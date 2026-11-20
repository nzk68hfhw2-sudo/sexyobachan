// 使い方: node simplify.mjs <入力.glb> <出力.json> <残す割合 例:0.05>
// 必要: npm i @gltf-transform/core @gltf-transform/functions meshoptimizer
import {NodeIO} from '@gltf-transform/core';
import {weld, simplify, dedup} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
const io=new NodeIO();
const doc=await io.read(process.argv[2]);
await doc.transform(weld({}));
const p=doc.getRoot().listMeshes()[0].listPrimitives()[0];
console.log('after weld verts',p.getAttribute('POSITION').getCount(),'tris',p.getIndices().getCount()/3);
await MeshoptSimplifier.ready;
await doc.transform(simplify({simplifier:MeshoptSimplifier, ratio:+process.argv[4], error:0.002, lockBorder:false}));
console.log('after simp verts',p.getAttribute('POSITION').getCount(),'tris',p.getIndices().getCount()/3);
// dump raw
const fs=await import('fs');
const pos=p.getAttribute('POSITION').getArray(), uv=p.getAttribute('TEXCOORD_0').getArray(), idx=p.getIndices().getArray();
fs.writeFileSync(process.argv[3], JSON.stringify({pos:Array.from(pos),uv:Array.from(uv),nrm:Array.from(p.getAttribute('NORMAL').getArray()),idx:Array.from(idx)}));
