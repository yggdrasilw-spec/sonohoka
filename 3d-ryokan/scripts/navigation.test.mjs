import test from 'node:test';
import assert from 'node:assert/strict';
import {walkPosition} from '../field-navigation.mjs';
const bounds={minX:-10,maxX:10,minZ:-10,maxZ:10};
test('walking follows heading, respects distance, and clamps field edges',()=>{
 const p=walkPosition({x:0,z:0},Math.PI/2,1.2,bounds);
 assert.ok(Math.abs(p.x-1.2)<1e-9);assert.ok(Math.abs(p.z)<1e-9);
 assert.equal(walkPosition(p,Math.PI/2,20,bounds).x,10);
});
test('long movements cannot tunnel through an obstacle and diagonal walking slides',()=>{
 const boxes=[{minX:1,maxX:2,minZ:-1,maxZ:1}];
 assert.ok(walkPosition({x:0,z:0},Math.PI/2,5,bounds,boxes).x<=.82);
 const p=walkPosition({x:0,z:0},Math.PI/4,1.6,bounds,boxes);
 assert.ok(p.x<=.82);assert.ok(p.z>1);
});
