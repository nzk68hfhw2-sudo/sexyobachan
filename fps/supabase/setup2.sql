-- =====================================================================
-- FRIENDS WARFARE 第2弾 : コイン・ショップ・持ち物・レベル・チーム戦の記録
--  ・前回の setup.sql を実行ずみのプロジェクトに、これを追加で貼って Run してください
--  ・コインの増減、値段、購入、装備は、すべてこのサーバー側の関数が計算します
--  ・何度実行しても大丈夫（アカウント・コイン・持ち物は消えません）
-- =====================================================================
alter table fr_private.users add column if not exists coins        integer not null default 0;
alter table fr_private.users add column if not exists xp           integer not null default 0;
alter table fr_private.users add column if not exists tdm_wins     integer not null default 0;
alter table fr_private.users add column if not exists tdm_losses   integer not null default 0;
alter table fr_private.users add column if not exists last_daily   date;
alter table fr_private.users add column if not exists earned_day   date;
alter table fr_private.users add column if not exists earned_today integer not null default 0;
alter table fr_private.users add column if not exists equipped     jsonb not null default '{}'::jsonb;
alter table fr_private.users add column if not exists loadout      text[] not null default array['ar','pistol','shotgun','sniper'];
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'users_coins_nonneg') then
    alter table fr_private.users add constraint users_coins_nonneg check (coins >= 0);
  end if;
end $$;

create table if not exists fr_private.items (id text primary key, kind text not null, price integer not null check (price >= 0));
insert into fr_private.items (id, kind, price) values
  ('w_ar','weapon',0), ('w_pistol','weapon',0), ('w_shotgun','weapon',0), ('w_sniper','weapon',0),
  ('w_smg','weapon',800), ('w_lmg','weapon',1500), ('w_magnum','weapon',1000), ('w_rocket','weapon',2500),
  ('s_default','skin',0), ('s_desert','skin',300), ('s_arctic','skin',300), ('s_camo','skin',500), ('s_neon','skin',800), ('s_gold','skin',2000),
  ('h_none','hat',0), ('h_cap','hat',200), ('h_party','hat',300), ('h_helmet','hat',400), ('h_tophat','hat',600), ('h_crown','hat',1500),
  ('t_default','tracer',0), ('t_red','tracer',150), ('t_green','tracer',150), ('t_blue','tracer',150), ('t_pink','tracer',200),
  ('c_default','cross',0), ('c_green','cross',100), ('c_cyan','cross',100), ('c_yellow','cross',100), ('c_pink','cross',100)
on conflict (id) do update set kind = excluded.kind, price = excluded.price;

create table if not exists fr_private.inventory (
  user_id   uuid not null references fr_private.users(id) on delete cascade,
  item_id   text not null references fr_private.items(id),
  bought_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
create table if not exists fr_private.matches (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references fr_private.users(id) on delete cascade,
  mode       text not null,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  coins      integer
);
create index if not exists matches_user on fr_private.matches(user_id, started_at desc);
alter table fr_private.items     enable row level security;
alter table fr_private.inventory enable row level security;
alter table fr_private.matches   enable row level security;
revoke all on all tables in schema fr_private from public, anon, authenticated;

-- ---- 内部用の部品 ----------------------------------------------------
create or replace function fr_private.jst_today() returns date
language sql stable set search_path = '' as $$ select (now() at time zone 'Asia/Tokyo')::date $$;

create or replace function fr_private.level_of(p_xp integer) returns integer
language sql immutable set search_path = '' as $$ select floor(sqrt(greatest(p_xp, 0) / 150.0))::integer + 1 $$;

create or replace function fr_private.profile(p_user uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('ok', true, 'id', u.login_id, 'coins', u.coins, 'xp', u.xp, 'wins', u.tdm_wins, 'losses', u.tdm_losses, 'best', u.best_score,
    'equipped', u.equipped, 'loadout', to_jsonb(u.loadout),
    'daily', (u.last_daily is null or u.last_daily < fr_private.jst_today()),
    'owned', coalesce((select jsonb_agg(i.item_id order by i.bought_at) from fr_private.inventory i where i.user_id = u.id), '[]'::jsonb))
  from fr_private.users u where u.id = p_user
$$;

create or replace function fr_private.owns(p_user uuid, p_item text) returns boolean
language sql stable set search_path = '' as $$
  select exists (select 1 from fr_private.items it where it.id = p_item
                 and (it.price = 0 or exists (select 1 from fr_private.inventory v where v.user_id = p_user and v.item_id = p_item)))
$$;

-- ---- 外から呼べる関数 --------------------------------------------------
create or replace function public.fr_profile(p_token text) returns json
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := fr_private.user_of(p_token);
begin
  if v_user is null then return json_build_object('ok', false, 'error', 'NOT_LOGGED_IN'); end if;
  return fr_private.profile(v_user)::json;
end $$;

-- 毎日のログインボーナス（日本時間で1日1回、100コイン）
create or replace function public.fr_claim_daily(p_token text) returns json
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := fr_private.user_of(p_token); v_n integer;
begin
  if v_user is null then return json_build_object('ok', false, 'error', 'NOT_LOGGED_IN'); end if;
  update fr_private.users set coins = coins + 100, last_daily = fr_private.jst_today()
   where id = v_user and (last_daily is null or last_daily < fr_private.jst_today());
  get diagnostics v_n = row_count;
  if v_n = 0 then return json_build_object('ok', false, 'error', 'ALREADY'); end if;
  return (fr_private.profile(v_user) || jsonb_build_object('gained', 100))::json;
end $$;

-- 購入（値段はサーバーの表から。コインが足りなければ買えない）
create or replace function public.fr_buy(p_token text, p_item text) returns json
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := fr_private.user_of(p_token); v_price integer; v_coins integer;
begin
  if v_user is null then return json_build_object('ok', false, 'error', 'NOT_LOGGED_IN'); end if;
  select price into v_price from fr_private.items where id = p_item;
  if v_price is null or v_price <= 0 then return json_build_object('ok', false, 'error', 'BAD_ITEM'); end if;
  select coins into v_coins from fr_private.users where id = v_user for update;      -- 同時に2回買えないようロック
  if exists (select 1 from fr_private.inventory where user_id = v_user and item_id = p_item) then return json_build_object('ok', false, 'error', 'OWNED'); end if;
  if v_coins < v_price then return json_build_object('ok', false, 'error', 'NO_COINS'); end if;
  update fr_private.users set coins = coins - v_price where id = v_user;
  insert into fr_private.inventory (user_id, item_id) values (v_user, p_item);
  return fr_private.profile(v_user)::json;
end $$;

-- 装備（持っている物だけ）
create or replace function public.fr_equip(p_token text, p_slot text, p_item text) returns json
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := fr_private.user_of(p_token);
begin
  if v_user is null then return json_build_object('ok', false, 'error', 'NOT_LOGGED_IN'); end if;
  if p_slot = 'avatar' then
    if p_item is null or p_item !~ '^[0-7]$' then return json_build_object('ok', false, 'error', 'BAD_ITEM'); end if;
    update fr_private.users set equipped = equipped || jsonb_build_object('avatar', p_item::integer) where id = v_user;
  elsif p_slot in ('skin', 'hat', 'tracer', 'cross') then
    if not exists (select 1 from fr_private.items where id = p_item and kind = p_slot) then return json_build_object('ok', false, 'error', 'BAD_ITEM'); end if;
    if not fr_private.owns(v_user, p_item) then return json_build_object('ok', false, 'error', 'NOT_OWNED'); end if;
    update fr_private.users set equipped = equipped || jsonb_build_object(p_slot, p_item) where id = v_user;
  else
    return json_build_object('ok', false, 'error', 'BAD_ITEM');
  end if;
  return fr_private.profile(v_user)::json;
end $$;

-- 持っていく武器（1〜4個、持っている武器だけ）
create or replace function public.fr_set_loadout(p_token text, p_weapons text[]) returns json
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := fr_private.user_of(p_token); w text;
begin
  if v_user is null then return json_build_object('ok', false, 'error', 'NOT_LOGGED_IN'); end if;
  if p_weapons is null or coalesce(array_length(p_weapons, 1), 0) not between 1 and 4
     or (select count(distinct x) from unnest(p_weapons) x) <> array_length(p_weapons, 1) then
    return json_build_object('ok', false, 'error', 'BAD_LOADOUT');
  end if;
  foreach w in array p_weapons loop
    if w is null or not exists (select 1 from fr_private.items where id = 'w_' || w and kind = 'weapon') or not fr_private.owns(v_user, 'w_' || w) then
      return json_build_object('ok', false, 'error', 'BAD_LOADOUT');
    end if;
  end loop;
  update fr_private.users set loadout = p_weapons where id = v_user;
  return fr_private.profile(v_user)::json;
end $$;

-- 試合開始：サーバーが「試合券」を発行する（終了時にこれが無いと報酬は出ない）
create or replace function public.fr_match_start(p_token text, p_mode text) returns json
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := fr_private.user_of(p_token); v_id uuid;
begin
  if v_user is null then return json_build_object('ok', false, 'error', 'NOT_LOGGED_IN'); end if;
  if p_mode is null or p_mode not in ('tdm', 'survival') then return json_build_object('ok', false, 'error', 'BAD_RESULT'); end if;
  delete from fr_private.matches where user_id = v_user and ended_at is null;                         -- 同時に進められる試合は1つ
  delete from fr_private.matches where user_id = v_user and started_at < now() - interval '30 days';
  insert into fr_private.matches (user_id, mode) values (v_user, p_mode) returning id into v_id;
  return json_build_object('ok', true, 'match', v_id);
end $$;

-- 試合終了：結果を受け取り、サーバーがコインと経験値を計算して加える
create or replace function public.fr_match_end(p_token text, p_match text, p_mode text, p_kills integer, p_heads integer, p_streak integer,
  p_win boolean, p_draw boolean, p_wave integer, p_score integer, p_acc integer, p_time integer) returns json
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := fr_private.user_of(p_token); m fr_private.matches%rowtype; v_secs numeric;
  v_kills integer; v_streak integer; v_finish integer; v_coins integer; v_xp integer; v_today date := fr_private.jst_today();
  v_room integer; v_best integer; v_rank integer; v_win boolean := coalesce(p_win, false); v_draw boolean := coalesce(p_draw, false);
begin
  if v_user is null then return json_build_object('ok', false, 'error', 'NOT_LOGGED_IN'); end if;
  if p_match is null or p_match !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return json_build_object('ok', false, 'error', 'BAD_MATCH'); end if;
  select * into m from fr_private.matches where id = p_match::uuid and user_id = v_user and ended_at is null for update;
  if not found or m.mode is distinct from p_mode then return json_build_object('ok', false, 'error', 'BAD_MATCH'); end if;
  v_secs := extract(epoch from (now() - m.started_at));
  update fr_private.matches set ended_at = now(), coins = 0 where id = m.id;          -- 1つの試合券は1回だけ
  if v_secs < 20 then return json_build_object('ok', false, 'error', 'TOO_FAST'); end if;
  if p_kills is null or p_kills < 0 or p_kills > 200 or p_kills > v_secs / 1.2 + 3
     or p_streak is null or p_streak < 0 or p_streak > p_kills
     or p_heads is null or p_heads < 0 or p_heads > 2000
     or p_wave is null or p_wave < 0 or p_wave > 8
     or p_score is null or p_score < 0 or p_score > 60000
     or p_acc is null or p_acc < 0 or p_acc > 100
     or (m.mode = 'survival' and v_win and (p_wave <> 8 or v_secs < 60))
     or (m.mode = 'tdm' and v_win and (v_draw or v_secs < 30)) then
    return json_build_object('ok', false, 'error', 'BAD_RESULT');
  end if;
  v_kills  := least(p_kills, 60) * 10;
  v_streak := case when p_streak >= 10 then 150 when p_streak >= 7 then 80 when p_streak >= 5 then 50 when p_streak >= 3 then 25 when p_streak >= 2 then 10 else 0 end;
  v_finish := case when m.mode = 'tdm' then (case when v_win then 150 when v_draw then 90 else 60 end)
                   else greatest(0, case when v_win then 8 else p_wave - 1 end) * 25 + (case when v_win then 200 else 0 end) end;
  v_coins  := least(1200, v_kills + v_streak + v_finish);
  v_xp     := least(p_kills, 60) * 10 + (case when v_win then 100 else 40 end);
  -- 1日にもらえるコインの上限（8000）
  update fr_private.users set earned_today = case when earned_day is distinct from v_today then 0 else earned_today end, earned_day = v_today where id = v_user
    returning 8000 - earned_today into v_room;
  v_coins := greatest(0, least(v_coins, v_room));
  update fr_private.users set coins = coins + v_coins, earned_today = earned_today + v_coins, xp = xp + v_xp, plays = plays + 1,
    tdm_wins = tdm_wins + (case when m.mode = 'tdm' and v_win then 1 else 0 end),
    tdm_losses = tdm_losses + (case when m.mode = 'tdm' and not v_win and not v_draw then 1 else 0 end),
    best_score = case when m.mode = 'survival' then greatest(best_score, p_score) else best_score end
   where id = v_user returning best_score into v_best;
  update fr_private.matches set coins = v_coins where id = m.id;
  if m.mode = 'survival' then
    insert into fr_private.scores (user_id, score, wave, kills, acc, time_s, win) values (v_user, p_score, p_wave, p_kills, p_acc, least(greatest(coalesce(p_time, 0), 0), 36000), v_win);
    delete from fr_private.scores where user_id = v_user and id not in (select id from fr_private.scores where user_id = v_user order by created_at desc, id desc limit 30);
  end if;
  select count(*) + 1 into v_rank from fr_private.users where best_score > v_best;
  return (fr_private.profile(v_user) || jsonb_build_object('rank', v_rank,
    'reward', jsonb_build_object('kills', v_kills, 'streak', v_streak, 'finish', v_finish, 'coins', v_coins, 'xp', v_xp)))::json;
end $$;

-- ランキング（サバイバルのスコア／チーム戦の勝利数）
create or replace function public.fr_leaderboard() returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object('ok', true, 'rows', coalesce(json_agg(json_build_object('id', t.login_id, 'best', t.best_score, 'lv', fr_private.level_of(t.xp)) order by t.best_score desc, t.created_at), '[]'::json))
  from (select login_id, best_score, xp, created_at from fr_private.users where best_score > 0 order by best_score desc, created_at limit 20) t
$$;
create or replace function public.fr_leaderboard_tdm() returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object('ok', true, 'rows', coalesce(json_agg(json_build_object('id', t.login_id, 'wins', t.tdm_wins, 'losses', t.tdm_losses, 'lv', fr_private.level_of(t.xp)) order by t.tdm_wins desc, t.tdm_losses, t.created_at), '[]'::json))
  from (select login_id, tdm_wins, tdm_losses, xp, created_at from fr_private.users where tdm_wins > 0 order by tdm_wins desc, tdm_losses, created_at limit 20) t
$$;

-- 権限
revoke all on all functions in schema fr_private from public, anon, authenticated;
revoke all on function public.fr_profile(text), public.fr_claim_daily(text), public.fr_buy(text, text), public.fr_equip(text, text, text), public.fr_set_loadout(text, text[]),
  public.fr_match_start(text, text), public.fr_match_end(text, text, text, integer, integer, integer, boolean, boolean, integer, integer, integer, integer),
  public.fr_leaderboard_tdm() from public;
grant execute on function public.fr_profile(text), public.fr_claim_daily(text), public.fr_buy(text, text), public.fr_equip(text, text, text), public.fr_set_loadout(text, text[]),
  public.fr_match_start(text, text), public.fr_match_end(text, text, text, integer, integer, integer, boolean, boolean, integer, integer, integer, integer),
  public.fr_leaderboard(), public.fr_leaderboard_tdm() to anon, authenticated;

notify pgrst, 'reload schema';
select 'セットアップ2 完了' as result;
