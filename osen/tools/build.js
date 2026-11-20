// src/*.js を1本の dist/game.js にまとめる（3Dモデルとテクスチャは base64 で埋め込み）
const fs=require('fs'),path=require('path');
const R=path.join(__dirname,'..');
const dir=path.join(R,'src');
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.js')).sort();
const b64=f=>fs.readFileSync(path.join(R,'assets',f)).toString('base64');
let code='';
for(const f of files){code+='\n// ===== '+f+' =====\n'+fs.readFileSync(path.join(dir,f),'utf8')+'\n';}
let out='/*! 精神汚染ゲーム game.js v'+(/GAME_VERSION = '([^']+)'/.exec(code)||[,''])[1]+' (single-file build) — 説明は source.txt */\n(function(){\n"use strict";\n';
out+=code;
out+='\n// ===== embedded assets (8 friends: 2 GLB models split into 4 each, decimated) =====\n';
out+='var FRIENDS1_BIN_B64="'+b64('friends1.bin')+'";\nvar FRIENDS1_JPG_B64="'+b64('friends1.jpg')+'";\n';
out+='var FRIENDS2_BIN_B64="'+b64('friends2.bin')+'";\nvar FRIENDS2_JPG_B64="'+b64('friends2.jpg')+'";\n';
out+='\nboot();\n})();\n';
fs.writeFileSync(path.join(R,'dist','game.js'),out);
console.log('built',files.length,'files code',code.length,'total',out.length,'bytes');
