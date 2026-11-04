// builds deliver/sunny_side_diner.html: one self-contained file (three.js, game, images, songs inlined)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), dist = path.join(root, 'dist');
const embed = {};
for (const f of fs.readdirSync(path.join(dist, 'audio'))) if (f.endsWith('.m4a')) embed['audio/' + f] = 'data:audio/mp4;base64,' + fs.readFileSync(path.join(dist, 'audio', f)).toString('base64');
for (const f of fs.readdirSync(path.join(dist, 'images'))) if (f.endsWith('.jpg')) embed['images/' + f] = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(dist, 'images', f)).toString('base64');
const three = fs.readFileSync(path.join(__dirname, 'three-r128.min.js'), 'utf8');
const game = fs.readFileSync(path.join(dist, 'game.js'), 'utf8');
const esc = s => s.replace(/<\/script/gi, '<\\/script');
const html = '<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n<meta name="theme-color" content="#000000">\n<title>Sunny Side Diner</title>\n<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}</style>\n</head>\n<body>\n' +
  '<script>window.__SSD_EMBED=' + JSON.stringify(embed) + ';</script>\n<script>' + esc(three) + '</script>\n<script>' + esc(game) + '</script>\n</body>\n</html>\n';
fs.writeFileSync(path.join(root, 'deliver', 'sunny_side_diner.html'), html);
console.log('single file', (html.length / 1048576).toFixed(1) + ' MB');
