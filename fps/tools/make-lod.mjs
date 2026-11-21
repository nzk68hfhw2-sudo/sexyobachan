// usage: node make-lod.mjs boys.glb girls.glb out.glb targetTris  — low-poly copies of the 8 characters, no texture (the game reuses the main texture)
import { NodeIO } from '@gltf-transform/core';
import { simplify, weld, quantize, prune, dedup } from '@gltf-transform/functions';
import { KHRMeshQuantization } from '@gltf-transform/extensions';
import { MeshoptSimplifier } from 'meshoptimizer';
const [,, a, b, outp, tgt] = process.argv;
const io = new NodeIO().registerExtensions([KHRMeshQuantization]);
await MeshoptSimplifier.ready;
const A = await io.read(a), B = await io.read(b);
for (const doc of [A, B]) {
  for (const m of doc.getRoot().listMaterials()) m.setBaseColorTexture(null);
  const tris = doc.getRoot().listMeshes().reduce((s, m) => s + m.listPrimitives()[0].getIndices().getCount() / 3, 0);
  await doc.transform(prune(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio: (+tgt * 4) / tris, error: 0.03 }), quantize({ quantizePosition: 12, quantizeNormal: 8, quantizeTexcoord: 12 }), dedup(), prune());
}
// merge B's nodes into A by re-reading as separate files is simpler for the game: write two files
await io.write(outp.replace('.glb', '_boys.glb'), A); await io.write(outp.replace('.glb', '_girls.glb'), B);
for (const doc of [A, B]) for (const m of doc.getRoot().listMeshes()) console.log(m.getName(), m.listPrimitives()[0].getIndices().getCount() / 3);
