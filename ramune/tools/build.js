// Concatenate ramune/src/*.js into ramune/dist/game.js inside one IIFE.
const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','src');
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.js')).sort();
let out='/*! RAMUNE NIGHT — game.js (single-file build). Fictional game. See source.txt */\n(function(){\n"use strict";\n';
for(const f of files){out+='\n// ===== '+f+' =====\n'+fs.readFileSync(path.join(dir,f),'utf8')+'\n';}
out+='\n})();\n';
fs.writeFileSync(path.join(__dirname,'..','dist','game.js'),out);
console.log('built',files.length,'files',out.length,'bytes');
// standalone single-file HTML (game inlined; only three.js + fonts come from CDNs)
const html='<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n<title>RAMUNE NIGHT</title>\n<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}</style>\n</head>\n<body>\n<script>\n'+out.replace(/<\/script/gi,'<\\/script')+'\n</script>\n</body>\n</html>\n';
fs.writeFileSync(path.join(__dirname,'..','dist','ramune_night_standalone.html'),html);
console.log('standalone',html.length,'bytes');
