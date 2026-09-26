import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {catalog,buildQuestions} from '../catalog.mjs';
import {createTeachingModel,createHand} from '../teaching-models.mjs';
test('all catalog models retain documented dimensions within 0.05mm',()=>{for(const [id,d] of Object.entries(catalog)){const m=createTeachingModel(d),b=new THREE.Box3().setFromObject(m),s=b.getSize(new THREE.Vector3());for(const [axis,expected] of [['x',d.width],['y',d.height],['z',d.depth]])assert.ok(Math.abs(s[axis]-expected)<.00005,`${id}.${axis}: ${s[axis]} expected ${expected}`);assert.ok(Math.abs(b.min.y)<.00005,`${id} base`);assert.ok(d.sources.every(s=>s.url.startsWith('https://')&&s.checked));}});
test('water at rated capacity stays below the rim and uses the documented bore',()=>{for(const d of Object.values(catalog).filter(d=>d.kind==='measure')){const m=createTeachingModel(d);m.userData.setVolume(d.capacityMl);const water=m.children[0].children[1];const expected=d.capacityMl/1e6/(Math.PI*(d.innerDiameter/2)**2);assert.ok(Math.abs(water.scale.y*.001-expected)<1e-10);assert.ok(.0025+expected<d.height);m.userData.setVolume(0);assert.equal(water.visible,false);}});
test('articulated hand has four three-joint fingers and opposing thumb',()=>{for(const sign of [-1,1]){const h=createHand(sign);assert.equal(h.children.filter(c=>c.isGroup).length,5);h.userData.pose(0);const open=new THREE.Box3().setFromObject(h).getSize(new THREE.Vector3());h.userData.pose(1);const closed=new THREE.Box3().setFromObject(h).getSize(new THREE.Vector3());assert.ok(open.y>.14&&open.y<.16);assert.ok(closed.y<open.y);assert.ok(closed.z>open.z);}});
test('questions cover length, capacity, mass, area, volume and thickness',()=>{const q=buildQuestions();for(const unit of ['mm','cm','m','km','mL','dL','L','g','kg','t','m²','cm²','cm³','ha'])assert.ok(q.some(x=>x.answer===unit),unit);for(const x of q){assert.ok(x.text&&x.answer&&x.explanation);if(x.item)assert.ok(catalog[x.item]);}assert.ok(q.length>=40);});
test('book and card covers have no coincident visible page surface',()=>{
 for(const d of Object.values(catalog).filter(d=>['book','card'].includes(d.kind))){
  const model=createTeachingModel(d);model.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(new THREE.Vector3(d.width*.13,d.height*.43,1),new THREE.Vector3(0,0,-1));
  const hits=ray.intersectObject(model,true),front=hits[0];
  assert.ok(front);assert.ok(Math.abs(front.point.z-d.depth/2)<1e-8);
  assert.ok(hits.filter(h=>h.object!==front.object).every(h=>h.distance-front.distance>1e-7),d.name+' has overlapping front surfaces');
 }
});
