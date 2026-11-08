// node simtest.js — runs scripted scenarios through the body model
const fs=require('fs'),path=require('path'),vm=require('vm');
const ctx={console,Math,performance:{now:()=>0},window:{},document:{}};vm.createContext(ctx);
for(const f of ['01_util.js','02_data.js','03_body.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src',f),'utf8'),ctx);
vm.runInContext('Math.random=function(){return 0.5}',ctx);
const only=process.argv[3];function RUN(name,plan,mins){if(only&&!name.includes(only))return;run(name,plan,mins)}
function run(name,plan,mins=600){
  const B=ctx.newBody();let log=[];
  for(let t=0;t<=mins;t++){
    for(const p of plan.filter(p=>p[0]===t)){ if(p[1]==='sub')ctx.takeSub(B,p[2]); else if(p[1]==='can')ctx.drinkCan(B,p[2]); else if(p[1]==='water')ctx.drinkWater(B); else if(p[1]==='vomit')ctx.vomit(B);}
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
