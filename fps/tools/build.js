// Concatenate src/*.js into dist/game.js inside one IIFE, and make the script-tag fallback copies of the GLB models.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), dir = path.join(root, 'src');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
let out = '/*! FRIENDS WARFARE — game.js (single-file build). See source.txt */\n(function(){\n"use strict";\n';
for (const f of files) out += '\n// ===== ' + f + ' =====\n' + fs.readFileSync(path.join(dir, f), 'utf8') + '\n';
out += '\n})();\n';
// Supabase の URL と公開用キー（publishable key）を api-config.json から差し込む。無ければ「準備中」のまま。
const cfgPath = path.join(root, 'api-config.json');
if (fs.existsSync(cfgPath)) {
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  if (!/^https:\/\/[a-z0-9.-]+$/i.test(cfg.url)) throw new Error('api-config.json: url must be https://… without a trailing slash');
  if (/secret|service_role/i.test(cfg.key)) throw new Error('api-config.json: never put a secret key here; use the publishable key');
  out = out.replace("'SUPABASE_URL_HERE'", JSON.stringify(cfg.url)).replace("'SUPABASE_KEY_HERE'", JSON.stringify(cfg.key));
  console.log('api config applied:', cfg.url);
} else console.log('no api-config.json: login stays in "準備中" mode');
fs.writeFileSync(path.join(root, 'dist', 'game.js'), out);
for (const n of ['boys', 'girls']) {
  const b = fs.readFileSync(path.join(root, 'dist', 'models', n + '.glb'));
  fs.writeFileSync(path.join(root, 'dist', 'models', n + '.glb.js'), 'window.__frAsset&&window.__frAsset(' + JSON.stringify(n) + ',"' + b.toString('base64') + '");\n');
}
console.log('built', files.length, 'files', out.length, 'bytes');
