// Local stand-in for Supabase's REST endpoint, for automated tests only.
// POST /rest/v1/rpc/<fn> -> runs public.<fn>(named args) as role "anon" in the local PostgreSQL that has supabase/setup.sql loaded.
// usage: NODE_PATH=<dir with pg> node tools/api-shim.js 8094
const http = require('http'); const { Pool } = require('pg');
const pool = new Pool({ host: '127.0.0.1', port: 54329, user: 'authenticator', database: 'postgres' });
const KEY = 'test-publishable-key';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'apikey,authorization,content-type,x-client-info', 'Access-Control-Max-Age': '600' };
http.createServer((req, res) => {
  const send = (code, obj) => { res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, CORS)); res.end(JSON.stringify(obj)); };
  if (req.method === 'OPTIONS') { res.writeHead(200, CORS); return res.end(); }
  const m = /^\/rest\/v1\/rpc\/(fr_[a-z_]+)$/.exec(req.url.split('?')[0]);
  if (!m || req.method !== 'POST') return send(404, { message: 'not found' });
  if (req.headers.apikey !== KEY) return send(401, { message: 'No API key found in request' });
  let body = ''; req.on('data', c => { body += c; if (body.length > 1e5) req.destroy(); });
  req.on('end', async () => {
    let args; try { args = JSON.parse(body || '{}'); } catch (e) { return send(400, { message: 'bad json' }); }
    const keys = Object.keys(args); if (keys.some(k => !/^p_[a-z]+$/.test(k))) return send(400, { message: 'bad arg' });
    const c = await pool.connect();
    try {
      await c.query('begin'); await c.query('set local role anon');
      await c.query("select set_config('request.headers', $1, true)", [JSON.stringify({ 'x-forwarded-for': req.headers['x-forwarded-for'] || req.socket.remoteAddress })]);
      const r = await c.query('select public.' + m[1] + '(' + keys.map((k, i) => k + ' => $' + (i + 1)).join(',') + ') as r', keys.map(k => args[k]));
      await c.query('commit'); send(200, r.rows[0].r);
    } catch (e) { await c.query('rollback').catch(() => {}); send(400, { message: e.message, code: e.code }); } finally { c.release(); }
  });
}).listen(+process.argv[2] || 8094, () => console.log('api shim on', +process.argv[2] || 8094));
