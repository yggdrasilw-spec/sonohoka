import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {Group,Box3,Vector3} from '../vendor/three.module.js';
import {fitModelToMeasurement} from '../model-scale.mjs';
import {fieldItems,animalCredits} from '../field-data.mjs';
import {buildQuestions} from '../catalog.mjs';
test('actual animal assets fit their stated measurement, remain proportional and stand on the floor',async()=>{
 for(const id of Object.keys(animalCredits)){
  const bytes=await readFile(new URL('../models/animals/'+id+'.glb',import.meta.url));
  // Keep geometry and materials; omit browser-only texture decoding in Node.
  const length=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+length));
  const removeTextures=o=>{for(const k of Object.keys(o)){if(k.endsWith('Texture'))delete o[k];else if(o[k]&&typeof o[k]==='object')removeTextures(o[k]);}};
  for(const m of json.materials||[])removeTextures(m);delete json.images;delete json.textures;
  let txt=Buffer.from(JSON.stringify(json));txt=Buffer.concat([txt,Buffer.alloc((4-txt.length%4)%4,32)]);
  const bin=bytes.subarray(20+length),out=Buffer.alloc(20+txt.length+bin.length);bytes.copy(out,0,0,12);out.writeUInt32LE(out.length,8);out.writeUInt32LE(txt.length,12);out.writeUInt32LE(0x4e4f534a,16);txt.copy(out,20);bin.copy(out,20+txt.length);
  const model=(await new GLTFLoader().parseAsync(out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength),'')).scene;
  const parent=new Group();parent.position.set(10,0,32);parent.add(model);parent.updateMatrixWorld(true);
  const d=fieldItems.outdoor[id],size=fitModelToMeasurement(model,d.axis,d.measure),bounds=new Box3().setFromObject(model);
  assert.ok(Math.abs(size[d.axis]-d.measure)<1e-4,id+' measurement');
  assert.ok(Math.abs(bounds.min.y)<1e-5,id+' floor');
  assert.ok(Math.abs(bounds.getCenter(new Vector3()).x-10)<1e-5,id+' center');
  assert.ok(Math.abs(model.scale.x-model.scale.y)<1e-6&&Math.abs(model.scale.y-model.scale.z)<1e-6,id+' uniform scale');
 }
});
test('item questions do not put the answer unit in the object name',()=>{
 for(const q of buildQuestions().filter(q=>q.item))assert.ok(!/[0-9]\s*(mL|dL|L|mm|cm|km|kg)\b/.test(q.text),q.text);
});
