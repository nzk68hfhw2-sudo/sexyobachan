const {chromium}=require('playwright');const fs=require('fs');const R='/home/user/sexyobachan/osen/';
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1000,height:500}});p.on('console',m=>console.log(m.text()));p.on('pageerror',e=>console.log('ERR',e.message));
const html=`<html><body style=margin:0><script>${fs.readFileSync(R+'tools/three-r128.min.js')}</script><script>var FRIENDS_BIN_B64="${fs.readFileSync(R+'assets/friends.bin').toString('base64')}";var FRIENDS_JPG_B64="${fs.readFileSync(R+'assets/friends.jpg').toString('base64')}";
${fs.readFileSync(R+'src/02_model.js')}
var r=new THREE.WebGLRenderer({antialias:true});r.setSize(1000,500);r.outputEncoding=THREE.sRGBEncoding;document.body.appendChild(r.domElement);
var s=new THREE.Scene();s.background=new THREE.Color(0x88aacc);s.add(new THREE.HemisphereLight(0xffffff,0x444444,1.2));var dl=new THREE.DirectionalLight(0xffffff,0.8);dl.position.set(1,2,3);s.add(dl);
var c=new THREE.PerspectiveCamera(35,2,0.1,100);c.position.set(0,0.6,__ROT__);c.lookAt(0,0.5,0);
loadFriends(function(){console.log('err',FRIENDS.err);var set=__LOD__;set.forEach(function(g,i){var m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:FRIENDS.tex,roughness:0.8}));m.position.x=(i-1.5)*0.55;m.rotation.y=__YR__;s.add(m);});r.render(s,c);window.done=1;});
</script></body></html>`;
for(const [n,rot,yr,lod] of [['front',3.2,0,'FRIENDS.hi'],['back',3.2,Math.PI,'FRIENDS.hi'],['lo',3.2,0,'FRIENDS.lo']]){
await p.setContent(html.split('__ROT__').join(rot).split('__YR__').join(yr).split('__LOD__').join(lod));await p.waitForFunction('window.done',null,{timeout:60000});await p.screenshot({path:'/tmp/claude-0/-home-user-sexyobachan/97275612-980f-5ebe-bbac-b443d3d79905/scratchpad/prev_'+n+'.png'});}
await b.close();})();
