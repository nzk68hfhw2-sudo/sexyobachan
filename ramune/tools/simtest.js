// node simtest.js — runs scripted scenarios through the body model
const fs=require('fs'),path=require('path'),vm=require('vm');
const ctx={console,Math,performance:{now:()=>0},window:{},document:{}};vm.createContext(ctx);
for(const f of ['01_util.js','02_data.js','03_body.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src',f),'utf8'),ctx);
vm.runInContext('Math.random=function(){return 0.5}',ctx);
const only=process.argv[3];function RUN(name,plan,mins){if(only&&!name.includes(only))return;run(name,plan,mins)}
function run(name,plan,mins=600){
  const B=ctx.newBody();let log=[];
  for(let t=0;t<=mins;t++){
    for(const p of plan.filter(p=>p[0]===t)){ if(p[1]==='sub')ctx.takeSub(B,p[2],p[3]||1); else if(p[1]==='can')ctx.drinkCan(B,p[2]); else if(p[1]==='water')ctx.drinkWater(B); else if(p[1]==='vomit')ctx.vomit(B);}
    ctx.bodyStep(B,1);B.maxD=Math.max(B.maxD||0,B.danger);
    if(t%30===0) log.push(`${t}m hr${B.hr.toFixed(0)} tp${B.tp.toFixed(1)} rr${B.rr.toFixed(1)} con${B.con.toFixed(0)} bac${B.bac.toFixed(3)} dang${B.danger.toFixed(0)} ps${B.F.ps.toFixed(2)} eu${B.F.eu.toFixed(2)} se${B.F.se.toFixed(2)} na${B.F.na.toFixed(2)} ${B.unconscious?'UNC':''}`);
    if(B.dead){log.push('DEAD at '+t+' cause '+B.dangerCause);break;}
  }
  console.log('== '+name+' found:'+B.found.join(',')+' fun:'+B.stats.fun.toFixed(0)+' vomits:'+B.stats.vomits+' maxHR'+B.stats.maxHR.toFixed(0)+' maxTp'+B.stats.maxTp.toFixed(1)+' minRR'+B.stats.minRR.toFixed(1)+' maxBAC'+B.stats.maxBAC.toFixed(3)+' maxDanger'+(B.maxD||0).toFixed(0));
  if(process.argv[2]==='v')console.log(log.join('\n')); else console.log(log.slice(-1)[0]);
}
RUN('yumeiro',[[0,'sub','yumeiro']]);
RUN('3 cans',[[0,'can','z9lemon'],[30,'can','z9lemon'],[60,'can','z9lemon']]);
RUN('6 cans fast',[[0,'can','z9lemon'],[15,'can','z9lemon'],[30,'can','z9lemon'],[45,'can','z9lemon'],[60,'can','z9lemon'],[75,'can','z9lemon']]);
RUN('3 ume',[[0,'can','z9ume'],[20,'can','z9ume'],[40,'can','z9ume']]);
RUN('masshiro',[[0,'sub','masshiro']]);
RUN('masshiro x2',[[0,'sub','masshiro'],[0,'sub','masshiro']]);
RUN('masshiro x2 + reset',[[0,'sub','masshiro'],[0,'sub','masshiro'],[22,'sub','reset']]);
RUN('nuku + 3 cans',[[0,'can','z9lemon'],[20,'can','z9lemon'],[40,'can','z9lemon'],[60,'sub','nukunuku']]);
RUN('nuku + 1 can',[[0,'can','z9lemon'],[60,'sub','nukunuku']]);
RUN('nemu + 2 cans',[[0,'can','z9lemon'],[20,'can','z9lemon'],[40,'sub','nemu']]);
RUN('nemu + 5 cans',[[0,'can','z9lemon'],[20,'can','z9lemon'],[40,'can','z9lemon'],[60,'can','z9lemon'],[80,'can','z9lemon'],[90,'sub','nemu']]);
RUN('toro + 1 can',[[0,'can','z9lemon'],[30,'sub','toro']]);
RUN('toro x2',[[0,'sub','toro'],[0,'sub','toro']]);
RUN('heart',[[0,'sub','heart']]);
RUN('heart + hyper',[[0,'sub','heart'],[0,'sub','hyper']]);
RUN('heart + hyper + water',[[0,'sub','heart'],[0,'sub','hyper'],[60,'water'],[90,'water'],[120,'water']]);
RUN('9 cans',[0,15,30,45,60,75,90,105,120].map(t=>[t,'can','z9lemon']));
RUN('12 cans',[0,10,20,30,40,50,60,70,80,90,100,110].map(t=>[t,'can','z9lemon']));
RUN('heart + booster',[[0,'sub','booster'],[0,'sub','heart']]);
RUN('hyper+rocket',[[0,'sub','hyper'],[30,'sub','rocket']]);
RUN('rocket x3',[[0,'sub','rocket'],[0,'sub','rocket'],[0,'sub','rocket']]);
RUN('yumeiro+fuyuu',[[0,'sub','yumeiro'],[100,'sub','fuyuu']]);
RUN('fuyuu x3',[[0,'sub','fuyuu'],[0,'sub','fuyuu'],[0,'sub','fuyuu']]);
RUN('tobari',[[0,'sub','tobari']],800);
RUN('nuku+nemu',[[0,'sub','nukunuku'],[0,'sub','nemu']]);
RUN('hyper + 5 cans',[[0,'sub','hyper'],[0,'can','z9lemon'],[20,'can','z9lemon'],[40,'can','z9lemon'],[60,'can','z9lemon'],[80,'can','z9lemon']]);
RUN('kinoko',[[0,'sub','kinoko']]);
RUN('zero',[[0,'sub','zero']]);
RUN('velvet',[[0,'sub','velvet']]);
RUN('velvet+heart',[[0,'sub','velvet'],[0,'sub','heart']]);
RUN('velvet+heart+water',[[0,'sub','velvet'],[0,'sub','heart'],[60,'water'],[90,'water'],[120,'water'],[150,'water']]);
RUN('velvet+2cans',[[0,'sub','velvet'],[30,'can','z9lemon'],[60,'can','z9lemon']]);
RUN('nuku+syrup',[[0,'sub','nukunuku'],[0,'sub','syrup']]);
RUN('fuwa+nemu',[[0,'sub','fuwa'],[0,'sub','nemu']]);
RUN('syrup+2cans',[[0,'sub','syrup'],[0,'can','z9lemon'],[20,'can','z9lemon']]);
RUN('yumeiro+kinoko',[[0,'sub','yumeiro'],[0,'sub','kinoko']]);
RUN('prism+fuyuu',[[0,'sub','fuyuu'],[2,'sub','prism']]);
RUN('nebula',[[0,'sub','nebula']]);
RUN('nebula+nuku',[[0,'sub','nebula'],[0,'sub','nukunuku']]);
RUN('nebula+2cans',[[0,'sub','nebula'],[30,'can','z9lemon'],[60,'can','z9lemon']]);
RUN('nebula+fuwa',[[0,'sub','nebula'],[0,'sub','fuwa']]);
RUN('chill',[[0,'sub','chillmaki']]);
RUN('chill+3cans',[[0,'can','z9lemon'],[20,'can','z9lemon'],[40,'can','z9lemon'],[60,'sub','chillmaki']]);
RUN('shaki x3',[[0,'sub','shakimaki'],[15,'sub','shakimaki'],[30,'sub','shakimaki']]);
RUN('fes',[[0,'sub','yumeiro'],[0,'sub','velvet'],[60,'sub','hyper']]);
RUN('koflez',[[0,'sub','koflez']]);
RUN('koflez x3',[[0,'sub','koflez'],[0,'sub','koflez'],[0,'sub','koflez']]);
RUN('sekitoru+3cans',[[0,'can','z9lemon'],[20,'can','z9lemon'],[40,'can','z9lemon'],[40,'sub','sekitoru']]);
RUN('shakin x3',[[0,'sub','shakin'],[0,'sub','shakin'],[0,'sub','shakin']]);
RUN('nemurina+3cans',[[0,'can','z9lemon'],[20,'can','z9lemon'],[40,'can','z9lemon'],[40,'sub','nemurina']]);
RUN('koflez+velvet',[[0,'sub','koflez'],[0,'sub','velvet']]);
RUN('itamin x3 + cans',[[0,'sub','itamin'],[0,'sub','itamin'],[0,'sub','itamin'],[0,'can','z9lemon'],[30,'can','z9lemon']]);
RUN('worst',[[0,'can','z9lemon'],[20,'can','z9lemon'],[30,'sub','koflez'],[30,'sub','nemurina']]);
RUN('yumeiro x1',[[0,'sub','yumeiro',1]]);
RUN('yumeiro x3',[[0,'sub','yumeiro',3]]);
RUN('nuku x3',[[0,'sub','nukunuku',3]]);
RUN('hyper x3',[[0,'sub','hyper',3]]);
RUN('zero x5',[[0,'sub','zero',5]]);
RUN('itamin x5',[[0,'sub','itamin',5]]);
RUN('chill x3',[[0,'sub','chillmaki',3]]);
RUN('fuyuu x3',[[0,'sub','fuyuu',3]]);
RUN('koflez x4',[[0,'sub','koflez',4]]);
RUN('heart+rocket',[[0,'sub','heart'],[0,'sub','rocket']]);
RUN('heart+rocket late',[[0,'sub','heart'],[60,'sub','rocket']]);
