// static server for dist/ applying Netlify-style _headers (simple subset). usage: node serve.js port [corsOff]
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..','dist');const port=+process.argv[2]||8080;
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.jpg':'image/jpeg','.m4a':'audio/mp4','.txt':'text/plain; charset=utf-8','.png':'image/png'};
function headersFor(p){const h={};try{const t=fs.readFileSync(path.join(root,'_headers'),'utf8');let cur=null;
 for(const line of t.split('\n')){if(!line.trim()||line.trim().startsWith('#'))continue;
  if(!/^\s/.test(line)){const pat=line.trim();const re=new RegExp('^'+pat.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*')+'$');cur=re.test(p);}
  else if(cur){const i=line.indexOf(':');h[line.slice(0,i).trim()]=line.slice(i+1).trim();}}}catch(e){}return h;}
http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
 const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('nf');}
 const h=Object.assign({'Content-Type':types[path.extname(f)]||'application/octet-stream'},headersFor(p));
 const st=fs.statSync(f);const range=req.headers.range;
 if(range){const m=/bytes=(\d*)-(\d*)/.exec(range);let s=+m[1]||0,e=m[2]?+m[2]:st.size-1;h['Content-Range']=`bytes ${s}-${e}/${st.size}`;h['Accept-Ranges']='bytes';h['Content-Length']=e-s+1;res.writeHead(206,h);fs.createReadStream(f,{start:s,end:e}).pipe(res);}
 else{h['Content-Length']=st.size;h['Accept-Ranges']='bytes';res.writeHead(200,h);fs.createReadStream(f).pipe(res);}
}).listen(port,()=>console.log('serving',root,port));
