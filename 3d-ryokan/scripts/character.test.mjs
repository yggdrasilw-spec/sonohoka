import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {createCharacter,solveLimb,sampleWalk} from '../character-rig.mjs';
import {graspProfile,graspPose} from '../grasp.mjs';
import {items} from '../units.mjs';
import {bathEntryMotion,reachMotion,liftMotion,sampleMotion} from '../interaction-motion.mjs';
const v=(...a)=>new T.Vector3(...a);
test('captured walk loops continuously and stops without residual limb motion',()=>{
 assert.ok(sampleWalk(.4,0).every(x=>x===0));
 for(let i=0;i<6;i++)assert.ok(Math.abs(sampleWalk(.78-1e-7)[i]-sampleWalk(0)[i])<1e-5);
 let rightLift=0,leftLift=0;
 for(let i=0;i<100;i++){
  const frame=sampleWalk(i*.78/100);assert.ok(frame.every(Number.isFinite));
  assert.ok(frame[1]>=0&&frame[4]>=0);rightLift=Math.max(rightLift,frame[1]);leftLift=Math.max(leftLift,frame[4]);
 }
 assert.ok(rightLift>.05&&leftLift>.05);
});
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
test('unreachable wrist is clamped without stretching either bone',()=>{
 for(const target of [v(0,0,0),v(0,-2,0),v(0,0,2),v(.02,-.3,.2)]){
  const p=solveLimb(v(),target,v(-.4,-.85,-.32),.178,.180);
  assert.ok(Math.abs(p.elbow.length()-.178)<1e-9);
  assert.ok(Math.abs(p.elbow.distanceTo(p.wrist)-.180)<1e-9);
  assert.ok(p.wrist.length()<=.354001);
 }
});
test('actual MakeHuman rig: wrists follow targets, bone lengths stay fixed across facing directions',async()=>{
 const kid=await loadRig();
 for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
  kid.root.position.set(.2,0,.3);kid.root.rotation.y=yaw;
  for(let i=0;i<=60;i++){
   const p=i/60,right=v(-.19,.70,.06).lerp(v(-.214,.7375,.197),p),left=v(.19,.70,.06);
   kid.pose({right,left,rightGrip:p*.85,palms:{r:{long:v(0,-1,.12).lerp(v(0,0,1),p).normalize(),normal:v(1,0,0)}}});
   for(const [side,a] of Object.entries(kid.arms)){
    const wp=b=>kid.root.worldToLocal(b.getWorldPosition(v()));
    assert.ok(Math.abs(wp(a.upper).distanceTo(wp(a.lower))-a.length1)<1e-5);
    assert.ok(Math.abs(wp(a.lower).distanceTo(wp(a.hand))-a.length2)<1e-5);
    assert.ok(wp(a.hand).distanceTo(side==='r'?right:left)<1e-5,`${yaw}/${i}/${side}`);
    assert.ok(kid.diagnostics[side].elbow[1]<kid.diagnostics[side].shoulder[1]);
    assert.ok(kid.diagnostics[side].elbow[2]<kid.diagnostics[side].wrist[2]);
    const change=a.lowerRest.clone().invert().multiply(a.lower.quaternion);
    const axis=v(change.x,change.y,change.z);
    if(axis.length()>1e-5)assert.ok(Math.abs(axis.normalize().dot(a.hingeAxis))>.999,'Elbow must flex on its hinge, without sideways twist');
   }
  }
 }
});
test('sitting lowers hips without changing pelvis sideways position',async()=>{
 const kid=await loadRig();kid.pose({right:v(-.19,.70,.06),left:v(.19,.70,.06)});
 const before=kid.bones.pelvis.getWorldPosition(v());
 kid.pose({right:v(-.19,.70,.06),left:v(.19,.70,.06),sit:1});
 const after=kid.bones.pelvis.getWorldPosition(v());
 assert.ok(Math.abs(before.y-after.y-.42)<1e-5);assert.ok(Math.abs(before.x-after.x)<1e-5);assert.ok(Math.abs(before.z-after.z)<1e-5);
});
test('every catalog grasp is within reach at contact, lift and presentation',async()=>{
 const kid=await loadRig();
 for(const [id,d] of Object.entries(items)){
  const {large}=graspProfile(d,id),contact=v(large?0:-.17,.701,.185),present=v(large?0:-.09,.81,.27);
  for(let i=0;i<=30;i++){
   const p=i/30,position=contact.clone().lerp(present,p);
   kid.pose(graspPose(d,id,position,1,1));
   for(const side of ['r','l'])assert.equal(kid.diagnostics[side].limited,false,`${id} ${side} ${p} cannot reach`);
  }
 }
});

test('individual finger joints can be adjusted without curling the other fingers',async()=>{
 const kid=await loadRig(),base={right:v(-.19,.70,.06),left:v(.19,.70,.06)};
 kid.pose(base);
 const index=kid.bones.index_02_r.quaternion.clone(),middle=kid.bones.middle_02_r.quaternion.clone();
 kid.pose({...base,fingers:{r:{index:[0,.6,0]}}});
 assert.ok(Math.abs(index.angleTo(kid.bones.index_02_r.quaternion)-.6)<1e-6);
 assert.ok(middle.angleTo(kid.bones.middle_02_r.quaternion)<1e-6);
 kid.pose({...base,fingers:{r:{index:[0,.6,0]}},collider:{min:v(-2,-2,-2),max:v(2,2,2)}});
 assert.ok(index.angleTo(kid.bones.index_02_r.quaternion)<1e-6,'collision blocks requested curl');
});

test('swimsuit has skinned fabric and follows seated bath pose',async()=>{
 const kid=await loadRig('child-swim.glb');
 const fabric=[];
 kid.root.traverse(o=>{if(o.isMesh&&(Array.isArray(o.material)?o.material:[o.material]).some(m=>/swimming_trunks_02/i.test(m.name)))fabric.push(o);});
 assert.ok(fabric.length>0);
 assert.ok(fabric.every(o=>o.isSkinnedMesh));
 kid.pose({right:v(-.19,.70,.06),left:v(.19,.70,.06),sit:1});
 kid.root.traverse(o=>{if(o.isBone)assert.ok(o.matrixWorld.elements.every(Number.isFinite));});
 assert.ok(!kid.root.getObjectByName('male_casualsuit06'));
});

test('captured reach and lift retain contact reachability for every item',async()=>{
 const kid=await loadRig();
 for(const [id,d] of Object.entries(items)){
  const {large}=graspProfile(d,id),contact=v(large?0:-.17,.701,.185);
  for(let i=0;i<=20;i++){
   const t=i/20,r=reachMotion(t),g=graspPose(d,id,contact,r.progress,0);
   g.right.y+=r.arc;if(large)g.left.y+=r.arc;
   kid.pose({...g,torsoLean:r.lean});
   for(const side of ['r','l'])assert.equal(kid.diagnostics[side].limited,false,`${id} reach ${t}/${side}`);
   const lift=liftMotion(t);kid.pose({...graspPose(d,id,contact.clone().add(v(0,lift.progress*.15,0)),1,1),torsoLean:lift.lean});
   for(const side of ['r','l'])assert.equal(kid.diagnostics[side].limited,false,`${id} lift ${t}/${side}`);
  }
 }
});

test('bath sequence keeps both ankle targets reachable and clears the rim',async()=>{
 const kid=await loadRig('child-swim.glb');let maxError=0,worst='';
 for(let i=0;i<=260;i++){
  const t=.26+i/260*.74,m=bathEntryMotion(t);
  kid.root.position.copy(m.position);kid.root.rotation.y=m.yaw;kid.root.updateMatrixWorld(true);
  const footTargets=Object.fromEntries(Object.entries(m.feet).map(([s,p])=>[s,kid.root.worldToLocal(p.clone())]));
  const hands={right:v(-.19,.70,.06),left:v(.19,.70,.06)};
  for(const [side,h] of Object.entries(m.hands||{})){const target=kid.root.worldToLocal(h.position.clone());target.y+=m.sit*.42;hands[side==='r'?'right':'left'].lerp(target,h.weight);}
  kid.pose({...hands,sit:m.sit,torsoLean:m.lean,footTargets});
  for(const side of ['r','l']){
   const d=kid.diagnostics['leg_'+side],hip=v(...d.hip),knee=v(...d.knee),ankle=v(...d.ankle);
   const flex=Math.PI-knee.clone().sub(hip).negate().angleTo(ankle.clone().sub(knee));
   assert.ok(flex<=145*Math.PI/180+1e-5,`knee flex ${t}/${side}`);
   if(m.hands?.[side]?.weight===1)assert.equal(kid.diagnostics[side].limited,false,`support hand ${t}/${side}: ${JSON.stringify(kid.diagnostics[side])}`);
  }
  for(const side of ['r','l']){
   const actual=kid.bones['foot_'+side].getWorldPosition(v()),error=actual.distanceTo(m.feet[side]);
   if(error>maxError){maxError=error;worst=`${t}/${side}: ${actual.toArray()} -> ${m.feet[side].toArray()}`;}
   // A conservative sole envelope while crossing the side rim.
   if(actual.x>-.68&&actual.x<-.30)assert.ok(actual.y>.68,`rim ${t}/${side} ${actual.toArray()}`);
  }
 }
 assert.ok(maxError<.025,`${maxError} ${worst}`);
});
