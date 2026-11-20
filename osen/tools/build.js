// src/*.js を1本の dist/game.js にまとめる（3Dモデルとテクスチャは base64 で埋め込み）
const fs=require('fs'),path=require('path');
const R=path.join(__dirname,'..');
const dir=path.join(R,'src');
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.js')).sort();
const b64=f=>fs.readFileSync(path.join(R,'assets',f)).toString('base64');
// フォント：src の文章から「使う字」だけを切り出して埋め込む
const FSRC=process.env.FONTSRC||path.join(R,'tools/fonts/src');
if(!process.argv.includes('--nofonts')){
  const cp=require('child_process');
  cp.execSync('sh '+path.join(R,'tools/fonts/get_fonts.sh')+' '+FSRC,{stdio:'inherit'});
  cp.execSync('python3 '+path.join(R,'tools/fonts/subset.py')+' '+path.join(R,'src')+' '+FSRC+' '+path.join(R,'assets/fonts'),{stdio:'inherit'});
}
const fontIds=JSON.parse(fs.readFileSync(path.join(R,'tools/fonts/fonts.json'),'utf8')).map(f=>f.id);
let code='';
for(const f of files){code+='\n// ===== '+f+' =====\n'+fs.readFileSync(path.join(dir,f),'utf8')+'\n';}
// 同時プレイ用：Firebase JS SDK（Apache-2.0）。ほかのページの firebase とぶつからないように保存して戻す
const vend=['firebase-app-compat.js','firebase-database-compat.js'].map(f=>fs.readFileSync(path.join(R,'tools/vendor',f),'utf8')).join('\n;\n');
const vendor='\n/* Firebase JS SDK v10.14.1 (app-compat + database-compat) — Apache License 2.0 — https://github.com/firebase/firebase-js-sdk */\n'+
 '(function(){var g=typeof globalThis!=="undefined"?globalThis:window;var prevFB=g.firebase,prevDef=g.define;g.firebase=undefined;try{g.define=undefined;}catch(e){}\ntry{\n'+vend+'\n}catch(e){g.__osenFirebaseErr=String(e&&e.message||e);}\ng.__osenFirebase=g.firebase;g.firebase=prevFB;try{g.define=prevDef;}catch(e){}})();\n';
let out='/*! 精神汚染ゲーム game.js v'+(/GAME_VERSION = '([^']+)'/.exec(code)||[,''])[1]+' (single-file build) — 説明は source.txt */\n'+vendor+'(function(){\n"use strict";\n';
out+=code;
out+='\n// ===== embedded assets (8 friends: 2 GLB models split into 4 each, decimated) =====\n';
out+='var FRIENDS1_BIN_B64="'+b64('friends1.bin')+'";\nvar FRIENDS1_JPG_B64="'+b64('friends1.jpg')+'";\n';
out+='var FRIENDS2_BIN_B64="'+b64('friends2.bin')+'";\nvar FRIENDS2_JPG_B64="'+b64('friends2.jpg')+'";\n';
out+='var FONT_B64={'+fontIds.map(id=>id+':"'+b64('fonts/'+id+'.woff2')+'"').join(',\n')+'};\n';
out+='\nboot();\n})();\n';
fs.writeFileSync(path.join(R,'dist','game.js'),out);
['bgm_long.mp3','bgm_short.mp3'].forEach(function(f){fs.copyFileSync(path.join(R,'music',f),path.join(R,'dist',f));});
console.log('built',files.length,'files code',code.length,'total',out.length,'bytes');
