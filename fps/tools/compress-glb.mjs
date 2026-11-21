// usage: node split.mjs in.glb out.glb prefix targetTris texSize
import { NodeIO, Document } from '@gltf-transform/core';
import { weld, simplify, quantize, prune, textureCompress, dedup } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { KHRMeshQuantization } from '@gltf-transform/extensions';
const [,, inp, outp, prefix, tgt, texSize] = process.argv;
const io = new NodeIO().registerExtensions([KHRMeshQuantization]);
const doc = await io.read(inp);
const root = doc.getRoot();
const prim = root.listMeshes()[0].listPrimitives()[0];
const P = prim.getAttribute('POSITION').getArray(), N = prim.getAttribute('NORMAL').getArray(), T = prim.getAttribute('TEXCOORD_0').getArray(), I = prim.getIndices().getArray();
const nv = P.length / 3;
// find 3 gaps along X
let minX = 1e9, maxX = -1e9; for (let i = 0; i < nv; i++) { const x = P[i*3]; if (x < minX) minX = x; if (x > maxX) maxX = x; }
const B = 400, hist = new Uint32Array(B);
for (let i = 0; i < nv; i++) hist[Math.min(B-1, Math.floor((P[i*3]-minX)/(maxX-minX)*B))]++;
const gaps = []; let s = -1;
for (let b = 0; b < B; b++) { if (hist[b] === 0) { if (s < 0) s = b; } else if (s >= 0) { gaps.push(minX + ((s + b) / 2) / B * (maxX - minX)); s = -1; } }
console.log('gaps', gaps);
if (gaps.length !== 3) throw new Error('expected 3 gaps');
const bounds = [-Infinity, ...gaps, Infinity];
const mat = prim.getMaterial();
mat.setNormalTexture(null).setMetallicRoughnessTexture(null).setMetallicFactor(0).setRoughnessFactor(0.62).setDoubleSided(false);
const scene = root.listScenes()[0]; scene.listChildren().forEach(n => n.dispose()); root.listMeshes().forEach(m => m.dispose());
const buf = root.listBuffers()[0];
for (let c = 0; c < 4; c++) {
  const map = new Int32Array(nv).fill(-1); const idx = []; let cnt = 0;
  for (let t = 0; t < I.length; t += 3) {
    const cx = (P[I[t]*3] + P[I[t+1]*3] + P[I[t+2]*3]) / 3;
    if (cx < bounds[c] || cx >= bounds[c+1]) continue;
    for (let k = 0; k < 3; k++) { const v = I[t+k]; if (map[v] < 0) map[v] = cnt++; idx.push(map[v]); }
  }
  const p = new Float32Array(cnt*3), n = new Float32Array(cnt*3), u = new Float32Array(cnt*2);
  let bx0=1e9,bx1=-1e9,by0=1e9,by1=-1e9,bz0=1e9,bz1=-1e9;
  for (let v = 0; v < nv; v++) { const m = map[v]; if (m < 0) continue; const x=P[v*3],y=P[v*3+1],z=P[v*3+2];
    bx0=Math.min(bx0,x);bx1=Math.max(bx1,x);by0=Math.min(by0,y);by1=Math.max(by1,y);bz0=Math.min(bz0,z);bz1=Math.max(bz1,z); }
  const sc = 1 / (by1 - by0), ox = (bx0+bx1)/2, oz = (bz0+bz1)/2;   // height 1, feet at y=0, centred
  for (let v = 0; v < nv; v++) { const m = map[v]; if (m < 0) continue;
    p[m*3]=(P[v*3]-ox)*sc; p[m*3+1]=(P[v*3+1]-by0)*sc; p[m*3+2]=(P[v*3+2]-oz)*sc;
    n[m*3]=N[v*3]; n[m*3+1]=N[v*3+1]; n[m*3+2]=N[v*3+2]; u[m*2]=T[v*2]; u[m*2+1]=T[v*2+1]; }
  const np = doc.createPrimitive().setMaterial(mat)
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(p).setBuffer(buf))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(n).setBuffer(buf))
    .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(u).setBuffer(buf))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(idx)).setBuffer(buf));
  const mesh = doc.createMesh(prefix + (c+1)).addPrimitive(np);
  scene.addChild(doc.createNode(prefix + (c+1)).setMesh(mesh));
  console.log(prefix + (c+1), 'tris', idx.length/3, 'w', ((bx1-bx0)*sc).toFixed(3), 'd', ((bz1-bz0)*sc).toFixed(3), 'ratio', (+tgt/(idx.length/3)).toFixed(4));
  np.setExtras({ ratio: +tgt/(idx.length/3) });
}
await MeshoptSimplifier.ready;
const ratio = +tgt / (I.length / 3 / 4);
await doc.transform(prune(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.01, lockBorder: false }),
  textureCompress({ encoder: sharp, targetFormat: 'jpeg', resize: [+texSize, +texSize], quality: 82 }), quantize({ quantizePosition: 14, quantizeNormal: 8, quantizeTexcoord: 12 }), dedup(), prune());
for (const m of root.listMeshes()) { const pr = m.listPrimitives()[0]; pr.setExtras({}); console.log(m.getName(), 'final tris', pr.getIndices().getCount()/3, 'verts', pr.getAttribute('POSITION').getCount()); }
await io.write(outp, doc);
