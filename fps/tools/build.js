// Concatenate src/*.js into dist/game.js inside one IIFE, and make the script-tag fallback copies of the GLB models.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), dir = path.join(root, 'src');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
let out = '/*! FRIENDS RESCUE — game.js (single-file build). See source.txt */\n(function(){\n"use strict";\n';
for (const f of files) out += '\n// ===== ' + f + ' =====\n' + fs.readFileSync(path.join(dir, f), 'utf8') + '\n';
out += '\n})();\n';
fs.writeFileSync(path.join(root, 'dist', 'game.js'), out);
for (const n of ['boys', 'girls']) {
  const b = fs.readFileSync(path.join(root, 'dist', 'models', n + '.glb'));
  fs.writeFileSync(path.join(root, 'dist', 'models', n + '.glb.js'), 'window.__frAsset&&window.__frAsset(' + JSON.stringify(n) + ',"' + b.toString('base64') + '");\n');
}
console.log('built', files.length, 'files', out.length, 'bytes');
