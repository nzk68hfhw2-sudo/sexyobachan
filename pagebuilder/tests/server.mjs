// テスト用のローカルサーバー。本番と同じ lib/app.mjs と Netlify Blobs の部品(ローカル版)を使います。
import http from 'node:http';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStore } from '@netlify/blobs';
import { BlobsServer } from '@netlify/blobs/server';
import { createApp, blobsAdapter } from '../lib/app.mjs';

const PUB = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };

export async function startBackend(opts = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), 'kp-blobs-'));
  const bs = new BlobsServer({ directory: dir, token: 'tok', port: 0 });
  const { port } = await bs.start();
  const store = getStore({ name: 'kojin-pages', edgeURL: `http://localhost:${port}`, token: 'tok', siteID: 'site' });
  const app = createApp(blobsAdapter(store), { adminId: 'punpun2005', adminSetupCode: 'test-admin-code', ...opts });
  return { app, store, stop: () => bs.stop() };
}

// port で「本体サイト」(public と /api) を配る
export async function startSite(app, port = 0) {
  const srv = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      const chunks = []; for await (const c of req) chunks.push(c);
      const r = await app.handleRequest(new Request('http://x' + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : Buffer.concat(chunks) }), req.headers['x-test-ip'] || req.socket.remoteAddress);
      res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
    }
    const f = url.pathname === '/' ? '/index.html' : url.pathname;
    try {
      const data = await readFile(path.join(PUB, path.normalize(f)));
      res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'access-control-allow-origin': '*', 'cross-origin-resource-policy': 'cross-origin' });
      res.end(data);
    } catch (e) { res.writeHead(404); res.end('not found'); }
  });
  await new Promise((r) => srv.listen(port, '127.0.0.1', r));
  return { port: srv.address().port, stop: () => new Promise((r) => srv.close(r)) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const b = await startBackend();
  const s = await startSite(b.app, Number(process.env.PORT || 8788));
  console.log(`http://127.0.0.1:${s.port}/  (管理者の合言葉: test-admin-code)`);
}
