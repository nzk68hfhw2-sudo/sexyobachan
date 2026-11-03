// Concatenate src/*.js into dist/game.js inside one IIFE.
const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','src');
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.js')).sort();
let out='/*! Hollow Pines Night School — game.js (single-file build). See source.txt */\n(function(){\n"use strict";\n';
for(const f of files){out+='\n// ===== '+f+' =====\n'+fs.readFileSync(path.join(dir,f),'utf8')+'\n';}
out+='\n})();\n';
fs.writeFileSync(path.join(__dirname,'..','dist','game.js'),out);
console.log('built',files.length,'files',out.length,'bytes');
