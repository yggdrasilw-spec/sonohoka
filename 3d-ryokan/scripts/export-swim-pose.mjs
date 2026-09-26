import {writeFile} from 'node:fs/promises';

import {readFile} from 'node:fs/promises';
import * as T from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {createCharacter,solveLimb} from '../character-rig.mjs';
import {graspProfile,graspPose} from '../grasp.mjs';
import {items} from '../units.mjs';
const v=(...a)=>new T.Vector3(...a);
async function loadRig(model='child-makehuman.glb'){
 // Load the actual exported mesh and skin weights in Node, omitting only browser textures.
 const b=await readFile(new URL('../models/'+model,import.meta.url));
 const len=b.readUInt32LE(12),json=JSON.parse(b.subarray(20,20+len).toString());
 for(const mat of json.materials||[]) {delete mat.normalTexture;delete mat.occlusionTexture;delete mat.emissiveTexture;if(mat.pbrMetallicRoughness){delete mat.pbrMetallicRoughness.baseColorTexture;delete mat.pbrMetallicRoughness.metallicRoughnessTexture;}}
 delete json.images;delete json.textures;
 let txt=Buffer.from(JSON.stringify(json));txt=Buffer.concat([txt,Buffer.alloc((4-txt.length%4)%4,32)]);
 const bin=b.subarray(20+len),out=Buffer.alloc(20+txt.length+bin.length);b.copy(out,0,0,12);out.writeUInt32LE(out.length,8);out.writeUInt32LE(txt.length,12);out.writeUInt32LE(0x4e4f534a,16);txt.copy(out,20);bin.copy(out,20+txt.length);
 const gltf=await new GLTFLoader().parseAsync(out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength),'');
 return createCharacter(new T.Scene(),gltf);
}

const kid=await loadRig('child-swim.glb');
kid.pose({right:v(-.19,.70,.06),left:v(.19,.70,.06),sit:1});
const meshes=[];
kid.root.traverse(o=>{
 if(!o.isMesh)return;
 if(o.isSkinnedMesh)o.skeleton.update();
 const g=o.geometry,vertices=[],uvs=[];
 for(let i=0;i<g.attributes.position.count;i++){
  const p=v().fromBufferAttribute(g.attributes.position,i);
  if(o.isSkinnedMesh)o.applyBoneTransform(i,p);
  p.applyMatrix4(o.matrixWorld);
  vertices.push([p.x,-p.z,p.y]);
  if(g.attributes.uv)uvs.push([g.attributes.uv.getX(i),1-g.attributes.uv.getY(i)]);
 }
 const indices=g.index?Array.from(g.index.array):vertices.map((_,i)=>i);
 meshes.push({name:o.name,material:o.material.name,vertices,uvs,indices});
});
await writeFile(new URL('../../.tools/swim-seated.json',import.meta.url),JSON.stringify(meshes));
