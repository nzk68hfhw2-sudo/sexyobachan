// 「Gravity のローダーと同じ条件」を作る: 別のサイト(別オリジン)のページが script タグで game.js を読む
import http from 'node:http';
export async function startHost(gameOrigin, { csp, pre = '' } = {}) {
  const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover"><title>loader</title><style>html,body{margin:0;padding:0;height:100%;background:#f6efe2}</style></head><body><div id="kpl">よみこみ中…</div><script>${pre}</script><script>(function(){var s=document.createElement('script');s.src='${gameOrigin}/game.js?v='+Date.now();s.onload=function(){var e=document.getElementById('kpl');if(e)e.style.display='none'};document.body.appendChild(s)})();</script></body></html>`;
  const srv = http.createServer((req, res) => {
    const h = { 'content-type': 'text/html; charset=utf-8' };
    if (csp) h['content-security-policy'] = csp;
    res.writeHead(200, h); res.end(html);
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  return { port: srv.address().port, stop: () => new Promise((r) => srv.close(r)) };
}

// わたされた HTML をそのまま配る(アプリが作った Gravity 用のコードを、別サイトとして開くため)
export async function startHtml(html) {
  const srv = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  return { port: srv.address().port, stop: () => new Promise((r) => srv.close(r)) };
}
