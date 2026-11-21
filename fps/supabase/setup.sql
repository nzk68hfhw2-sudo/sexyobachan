-- =====================================================================
-- FRIENDS WARFARE : ログインと記録のしくみ（Supabase の SQL Editor に全部貼って Run）
--  ・パスワードは bcrypt でハッシュ化して保存（平文は保存しない）
--  ・表は fr_private という非公開の場所に置き、外からは下の関数しか使えない
--  ・何度実行しても大丈夫（登録済みのアカウントや記録は消えません）
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;

create schema if not exists fr_private;
revoke all on schema fr_private from public;
revoke all on schema fr_private from anon, authenticated;

create table if not exists fr_private.users (
  id          uuid primary key default gen_random_uuid(),
  login_id    text not null,
  id_key      text not null unique,            -- 小文字にした ID（重複チェック用）
  pw_hash     text not null,                   -- bcrypt
  best_score  integer not null default 0,
  plays       integer not null default 0,
  created_at  timestamptz not null default now()
);
create table if not exists fr_private.sessions (
  token_hash  bytea primary key,               -- 合言葉そのものではなく sha256 を保存
  user_id     uuid not null references fr_private.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);
create index if not exists sessions_user on fr_private.sessions(user_id);
create table if not exists fr_private.scores (
  id          bigserial primary key,
  user_id     uuid not null references fr_private.users(id) on delete cascade,
  score       integer not null,
  wave        integer not null,
  kills       integer not null,
  acc         integer not null,
  time_s      integer not null,
  win         boolean not null,
  created_at  timestamptz not null default now()
);
create index if not exists scores_user on fr_private.scores(user_id, created_at desc);
create table if not exists fr_private.attempts (   -- 失敗回数（ID ごと・接続元ごと）
  key          text primary key,
  fails        integer not null default 0,
  first_at     timestamptz not null default now(),
  locked_until timestamptz
);
alter table fr_private.users    enable row level security;
alter table fr_private.sessions enable row level security;
alter table fr_private.scores   enable row level security;
alter table fr_private.attempts enable row level security;
revoke all on all tables in schema fr_private from public, anon, authenticated;

-- ---- 内部用の部品 ----------------------------------------------------
create or replace function fr_private.client_ip() returns text
language plpgsql stable set search_path = '' as $$
declare h text;
begin
  begin
    h := nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for';
  exception when others then h := null; end;
  return coalesce(nullif(trim(split_part(coalesce(h, ''), ',', 1)), ''), 'unknown');
end $$;

-- 失敗を1回記録する。p_max 回たまったら p_lock の間ロック。返り値: 残り回数（0 ならロックされた）
create or replace function fr_private.note_fail(p_key text, p_max integer, p_window interval, p_lock interval) returns integer
language plpgsql set search_path = '' as $$
declare v_fails integer;
begin
  insert into fr_private.attempts as a (key, fails, first_at) values (p_key, 1, now())
  on conflict (key) do update set
    fails    = case when a.first_at < now() - p_window then 1 else a.fails + 1 end,
    first_at = case when a.first_at < now() - p_window then now() else a.first_at end
  returning fails into v_fails;
  if v_fails >= p_max then
    update fr_private.attempts set locked_until = now() + p_lock, fails = 0, first_at = now() where key = p_key;
    return 0;
  end if;
  return p_max - v_fails;
end $$;

create or replace function fr_private.locked_secs(p_key text) returns integer
language sql stable set search_path = '' as $$
  select coalesce((select ceil(extract(epoch from (locked_until - now())))::integer
                   from fr_private.attempts where key = p_key and locked_until > now()), 0)
$$;

create or replace function fr_private.new_session(p_user uuid) returns text
language plpgsql set search_path = '' as $$
declare v_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  delete from fr_private.sessions where expires_at < now();
  delete from fr_private.sessions where user_id = p_user and token_hash not in
    (select token_hash from fr_private.sessions where user_id = p_user order by created_at desc limit 9);
  insert into fr_private.sessions (token_hash, user_id, expires_at)
  values (extensions.digest(v_token, 'sha256'), p_user, now() + interval '30 days');
  return v_token;
end $$;

create or replace function fr_private.user_of(p_token text) returns uuid
language sql stable set search_path = '' as $$
  select user_id from fr_private.sessions
  where p_token is not null and length(p_token) = 64
    and token_hash = extensions.digest(p_token, 'sha256') and expires_at > now()
$$;

-- ---- 外から呼べる関数（ゲームが使う） ----------------------------------
-- 新規登録
create or replace function public.fr_register(p_id text, p_password text) returns json
language plpgsql security definer set search_path = '' as $$
declare v_ip text := 'reg:' || fr_private.client_ip(); v_user uuid; v_wait integer;
begin
  if p_id is null or p_id !~ '^[A-Za-z0-9_]{3,16}$' then return json_build_object('ok', false, 'error', 'BAD_ID'); end if;
  if p_password is null or char_length(p_password) < 8 then return json_build_object('ok', false, 'error', 'SHORT_PASSWORD'); end if;
  if octet_length(p_password) > 72 then return json_build_object('ok', false, 'error', 'LONG_PASSWORD'); end if;
  v_wait := fr_private.locked_secs(v_ip);
  if v_wait > 0 then return json_build_object('ok', false, 'error', 'TOO_MANY', 'retry_after', v_wait); end if;
  begin
    insert into fr_private.users (login_id, id_key, pw_hash)
    values (p_id, lower(p_id), extensions.crypt(p_password, extensions.gen_salt('bf', 10)))
    returning id into v_user;
  exception when unique_violation then
    return json_build_object('ok', false, 'error', 'ID_TAKEN');
  end;
  perform fr_private.note_fail(v_ip, 6, interval '1 hour', interval '1 hour');   -- 同じ接続元からの大量登録を防ぐ
  return json_build_object('ok', true, 'token', fr_private.new_session(v_user), 'id', p_id, 'best', 0);
end $$;

-- ログイン（5回まちがえると、その ID は15分ロック）
create or replace function public.fr_login(p_id text, p_password text) returns json
language plpgsql security definer set search_path = '' as $$
declare
  v_key text; v_ip text := 'ip:' || fr_private.client_ip(); v_wait integer; v_left integer;
  u fr_private.users%rowtype; v_ok boolean := false;
begin
  if p_id is null or p_password is null or char_length(p_id) > 32 or octet_length(p_password) > 72 then
    return json_build_object('ok', false, 'error', 'BAD_CREDENTIALS');
  end if;
  v_key := 'id:' || lower(p_id);
  v_wait := greatest(fr_private.locked_secs(v_key), fr_private.locked_secs(v_ip));
  if v_wait > 0 then return json_build_object('ok', false, 'error', 'LOCKED', 'retry_after', v_wait); end if;
  select * into u from fr_private.users where id_key = lower(p_id);
  if found then
    v_ok := (u.pw_hash = extensions.crypt(p_password, u.pw_hash));
  else
    perform extensions.crypt(p_password, extensions.gen_salt('bf', 10));   -- ID が無いときも同じ時間をかける
  end if;
  if not v_ok then
    v_left := fr_private.note_fail(v_key, 5, interval '15 minutes', interval '15 minutes');
    perform fr_private.note_fail(v_ip, 40, interval '15 minutes', interval '15 minutes');
    if v_left = 0 then return json_build_object('ok', false, 'error', 'LOCKED', 'retry_after', 900); end if;
    return json_build_object('ok', false, 'error', 'BAD_CREDENTIALS', 'remaining', v_left);
  end if;
  delete from fr_private.attempts where key = v_key;
  return json_build_object('ok', true, 'token', fr_private.new_session(u.id), 'id', u.login_id, 'best', u.best_score);
end $$;

-- ログイン中かの確認
create or replace function public.fr_me(p_token text) returns json
language plpgsql security definer set search_path = '' as $$
declare u fr_private.users%rowtype;
begin
  select * into u from fr_private.users where id = fr_private.user_of(p_token);
  if not found then return json_build_object('ok', false, 'error', 'NOT_LOGGED_IN'); end if;
  return json_build_object('ok', true, 'id', u.login_id, 'best', u.best_score, 'plays', u.plays);
end $$;

-- ログアウト
create or replace function public.fr_logout(p_token text) returns json
language plpgsql security definer set search_path = '' as $$
begin
  if p_token is not null and length(p_token) = 64 then
    delete from fr_private.sessions where token_hash = extensions.digest(p_token, 'sha256');
  end if;
  return json_build_object('ok', true);
end $$;

-- アカウント削除（パスワードをもう一度確認。記録もすべて消える）
create or replace function public.fr_delete_account(p_token text, p_password text) returns json
language plpgsql security definer set search_path = '' as $$
declare u fr_private.users%rowtype; v_key text; v_wait integer; v_left integer;
begin
  select * into u from fr_private.users where id = fr_private.user_of(p_token);
  if not found then return json_build_object('ok', false, 'error', 'NOT_LOGGED_IN'); end if;
  v_key := 'id:' || u.id_key;
  v_wait := fr_private.locked_secs(v_key);
  if v_wait > 0 then return json_build_object('ok', false, 'error', 'LOCKED', 'retry_after', v_wait); end if;
  if p_password is null or octet_length(p_password) > 72 or u.pw_hash <> extensions.crypt(p_password, u.pw_hash) then
    v_left := fr_private.note_fail(v_key, 5, interval '15 minutes', interval '15 minutes');
    return json_build_object('ok', false, 'error', 'BAD_CREDENTIALS', 'remaining', v_left);
  end if;
  delete from fr_private.users where id = u.id;      -- sessions と scores も一緒に消える
  delete from fr_private.attempts where key = v_key;
  return json_build_object('ok', true);
end $$;

-- スコア保存（アカウントに紐づけ）
create or replace function public.fr_submit_score(p_token text, p_score integer, p_wave integer, p_kills integer, p_acc integer, p_time integer, p_win boolean) returns json
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := fr_private.user_of(p_token); v_best integer; v_rank integer;
begin
  if v_user is null then return json_build_object('ok', false, 'error', 'NOT_LOGGED_IN'); end if;
  if p_score is null or p_score < 0 or p_score > 60000 or p_wave is null or p_wave < 0 or p_wave > 8
     or p_kills is null or p_kills < 0 or p_kills > 500 or p_acc is null or p_acc < 0 or p_acc > 100
     or p_time is null or p_time < 0 or p_time > 36000 or p_win is null then
    return json_build_object('ok', false, 'error', 'BAD_SCORE');
  end if;
  if exists (select 1 from fr_private.scores where user_id = v_user and created_at > now() - interval '10 seconds') then
    return json_build_object('ok', false, 'error', 'TOO_FAST');
  end if;
  insert into fr_private.scores (user_id, score, wave, kills, acc, time_s, win) values (v_user, p_score, p_wave, p_kills, p_acc, p_time, p_win);
  delete from fr_private.scores where user_id = v_user and id not in
    (select id from fr_private.scores where user_id = v_user order by created_at desc, id desc limit 30);
  update fr_private.users set best_score = greatest(best_score, p_score), plays = plays + 1 where id = v_user returning best_score into v_best;
  select count(*) + 1 into v_rank from fr_private.users where best_score > v_best;
  return json_build_object('ok', true, 'best', v_best, 'rank', v_rank);
end $$;

-- ランキング（上位20人）
create or replace function public.fr_leaderboard() returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object('ok', true, 'rows', coalesce(json_agg(json_build_object('id', t.login_id, 'best', t.best_score) order by t.best_score desc, t.created_at), '[]'::json))
  from (select login_id, best_score, created_at from fr_private.users where best_score > 0 order by best_score desc, created_at limit 20) t
$$;

-- 自分の最近の記録
create or replace function public.fr_my_scores(p_token text) returns json
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := fr_private.user_of(p_token); v_rows json;
begin
  if v_user is null then return json_build_object('ok', false, 'error', 'NOT_LOGGED_IN'); end if;
  select coalesce(json_agg(json_build_object('score', s.score, 'wave', s.wave, 'win', s.win, 'at', s.created_at) order by s.created_at desc), '[]'::json) into v_rows
  from (select * from fr_private.scores where user_id = v_user order by created_at desc limit 10) s;
  return json_build_object('ok', true, 'rows', v_rows);
end $$;

-- 権限: 外からは public.fr_* の関数だけ実行できる
revoke all on all functions in schema fr_private from public, anon, authenticated;
revoke all on function public.fr_register(text, text), public.fr_login(text, text), public.fr_me(text), public.fr_logout(text),
  public.fr_delete_account(text, text), public.fr_submit_score(text, integer, integer, integer, integer, integer, boolean),
  public.fr_leaderboard(), public.fr_my_scores(text) from public;
grant execute on function public.fr_register(text, text), public.fr_login(text, text), public.fr_me(text), public.fr_logout(text),
  public.fr_delete_account(text, text), public.fr_submit_score(text, integer, integer, integer, integer, integer, boolean),
  public.fr_leaderboard(), public.fr_my_scores(text) to anon, authenticated;

notify pgrst, 'reload schema';
select 'セットアップ完了' as result;
