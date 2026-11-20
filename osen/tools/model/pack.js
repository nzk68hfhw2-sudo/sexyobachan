// 使い方: node pack.js <出力.bin>   （hi.json / lo.json は simplify.mjs で作る。下の require のファイル名を書きかえて使う）
const fs=require('fs');
function split(d){const P=d.pos,I=d.idx,n=P.length/3;const par=new Int32Array(n).map((_,i)=>i);const f=x=>{while(par[x]!==x){par[x]=par[par[x]];x=par[x];}return x;};
const u=(a,b)=>{a=f(a);b=f(b);if(a!==b)par[a]=b;};const key=new Map();
for(let i=0;i<n;i++){const k=P[i*3].toFixed(5)+','+P[i*3+1].toFixed(5)+','+P[i*3+2].toFixed(5);if(key.has(k))u(i,key.get(k));else key.set(k,i);}
for(let t=0;t<I.length;t+=3){u(I[t],I[t+1]);u(I[t],I[t+2]);}
const groups=new Map();for(let t=0;t<I.length;t+=3){const r=f(I[t]);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(I[t],I[t+1],I[t+2]);}
const parts=[...groups.values()].map(tri=>{const map=new Map();const pos=[],nrm=[],uv=[],idx=[];for(const v of tri){if(!map.has(v)){map.set(v,pos.length/3);pos.push(P[v*3],P[v*3+1],P[v*3+2]);nrm.push(d.nrm[v*3],d.nrm[v*3+1],d.nrm[v*3+2]);uv.push(d.uv[v*2],d.uv[v*2+1]);}idx.push(map.get(v));}
 let cx=0;for(let i=0;i<pos.length;i+=3)cx+=pos[i];cx/=pos.length/3;return {pos,nrm,uv,idx,cx};});
parts.sort((a,b)=>a.cx-b.cx);return parts;}
const hi=split(require('./hi.json')),lo=split(require('./lo.json'));
const all=[...hi,...lo];const bufs=[];const H=Buffer.alloc(8);H.write('OSN1',0);H.writeUInt32LE(all.length,4);bufs.push(H);
for(const p of all){const v=p.pos.length/3,ic=p.idx.length;const mn=[9,9,9],mx=[-9,-9,-9];for(let i=0;i<v;i++)for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],p.pos[i*3+k]);mx[k]=Math.max(mx[k],p.pos[i*3+k]);}
 const h=Buffer.alloc(32);h.writeUInt32LE(v,0);h.writeUInt32LE(ic,4);for(let k=0;k<3;k++){h.writeFloatLE(mn[k],8+k*4);h.writeFloatLE(mx[k],20+k*4);}bufs.push(h);
 const pb=Buffer.alloc(v*6);for(let i=0;i<v;i++)for(let k=0;k<3;k++)pb.writeUInt16LE(Math.round((p.pos[i*3+k]-mn[k])/(mx[k]-mn[k]||1)*65535),(i*3+k)*2);bufs.push(pb);
 const nb=Buffer.alloc(Math.ceil(v*3/4)*4);for(let i=0;i<v*3;i++)nb.writeInt8(Math.max(-127,Math.min(127,Math.round(p.nrm[i]*127))),i);bufs.push(nb);
 const ub=Buffer.alloc(v*4);for(let i=0;i<v*2;i++)ub.writeUInt16LE(Math.round(Math.max(0,Math.min(1,p.uv[i]))*65535),i*2);bufs.push(ub);
 if(v>65535)throw 'too many';const ib=Buffer.alloc(Math.ceil(ic*2/4)*4);for(let i=0;i<ic;i++)ib.writeUInt16LE(p.idx[i],i*2);bufs.push(ib);
 console.log('part v',v,'tris',ic/3,'x',mn[0].toFixed(2),mx[0].toFixed(2),'h',(mx[1]-mn[1]).toFixed(2));}
const out=Buffer.concat(bufs);fs.writeFileSync(process.argv[2],out);console.log('bytes',out.length,'gz',require('zlib').gzipSync(out).length);
