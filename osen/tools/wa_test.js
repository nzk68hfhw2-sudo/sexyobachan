// WordArt を一覧表示して確認
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1100,height:1400}});
p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>console.log(m.text()));
const src=['00_boot.js','01_util.js','03_text.js','04_wordart.js'].map(f=>fs.readFileSync(path.join(__dirname,'../src',f),'utf8')).join('\n');
await p.setContent('<html><body style="margin:0;background:#468"><div id=o></div></body></html>');
await p.addScriptTag({content:src+`
setupPage();document.getElementById('os-root').style.position='static';
window.go=async function(){var fams=WA_FONTS.concat(['Noto Sans SC']);await Promise.all(fams.map(f=>document.fonts.load('40px "'+f+'"','汚染ゲーム駅前直骨角令画海这请')));await document.fonts.ready;WA_FONTS_READY=true;
var o=document.getElementById('o');o.style.cssText='display:flex;flex-wrap:wrap;gap:6px;padding:6px';
WA_STYLES.forEach(function(s,i){var c=wordArt(i%2?'精神汚染ゲーム':'駅前の直角な骨',{style:i,size:44});c.style.cssText='background:rgba(0,0,0,.15);max-width:540px';o.appendChild(c);});
['star','sparkle','heart','burst','new','flare','ring','smile','arrow','flower'].forEach(function(k){o.appendChild(clipArt(k,90));});
var d=document.createElement('div');d.style.cssText='font:700 30px '+FONT_JP+';color:#fff;background:#000;padding:8px';d.innerHTML=cnHTML('直骨角令画海 直骨角令画海（日本） / 这是好的商品です');o.appendChild(d);
var d2=document.createElement('div');d2.style.cssText='font:700 30px '+FONT_JP+';color:#fff;background:#000;padding:8px';d2.textContent='直骨角令画海（日本語フォント）';o.appendChild(d2);}`});
await p.evaluate(()=>window.go());await p.waitForTimeout(500);
await p.screenshot({path:process.argv[2]||'/tmp/wa.png',fullPage:true});await b.close();})();
