import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const clamp=T.MathUtils.clamp;

// Character coordinates: +Y up, +Z face/front, -X anatomical right.
// The pole is an elbow/knee guide, NOT the joint's rotation axis.
export function solveLimb(shoulder,target,pole,upper,lower){
 const delta=target.clone().sub(shoulder),raw=delta.length();
 const minReach=Math.sqrt(upper*upper+lower*lower+2*upper*lower*Math.cos(145*Math.PI/180));
 const distance=clamp(raw,minReach,upper+lower-.004);
 const axis=raw>1e-8?delta.divideScalar(raw):v(0,-1,0);
 const wrist=shoulder.clone().addScaledVector(axis,distance);
 let bend=pole.clone().addScaledVector(axis,-pole.dot(axis));
 if(bend.lengthSq()<1e-8){bend=v(0,0,-1);bend.addScaledVector(axis,-bend.dot(axis));}
 if(bend.lengthSq()<1e-8){bend=v(1,0,0);bend.addScaledVector(axis,-bend.dot(axis));}
 bend.normalize();
 const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
 const elbow=shoulder.clone().addScaledVector(axis,along).addScaledVector(bend,Math.sqrt(Math.max(0,upper*upper-along*along)));
 return {elbow,wrist,limited:Math.abs(raw-distance)>.001};
}
function frame(long,normal){
 const y=long.clone().normalize(),z=normal.clone().addScaledVector(y,-normal.dot(y)).normalize(),x=y.clone().cross(z).normalize();
 return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));
}
export async function createCharacter(parent,asset=null,model='child-makehuman.glb'){
 const gltf=asset||await new GLTFLoader().loadAsync(new URL('./models/'+model,import.meta.url).href);
 const root=new T.Group();parent.add(root);root.add(gltf.scene);
 const bones={},rest={},arms={};
 root.traverse(o=>{if(o.isBone)bones[o.name]=o;if(o.isMesh){
  o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;
  // MPFB's generic exporter marks even opaque clothes as BLEND. Use depth-tested
  // opaque/cutout surfaces to avoid triangle sorting artifacts on the torso/hair.
  for(const m of Array.isArray(o.material)?o.material:[o.material]){
   m.transparent=false;m.depthWrite=true;m.alphaTest=/eyebrow|short01/.test(m.name)?.35:0;m.needsUpdate=true;
  }
 }});
 root.updateMatrixWorld(true);
 for(const [name,b] of Object.entries(bones))rest[name]={q:b.quaternion.clone(),p:b.position.clone()};
 const pos=b=>root.worldToLocal(b.getWorldPosition(v()));
 const worldQ=b=>b.getWorldQuaternion(new T.Quaternion());
 function orient(b,q){b.quaternion.copy(worldQ(b.parent).invert().multiply(q));b.updateMatrixWorld(true);}
 function aim(b,child,target){
  const origin=b.getWorldPosition(v()),current=child.getWorldPosition(v()).sub(origin).normalize();
  const direction=root.localToWorld(target.clone()).sub(origin).normalize();
  orient(b,new T.Quaternion().setFromUnitVectors(current,direction).multiply(worldQ(b)));
 }
 for(const side of ['r','l']){
  const sign=side==='r'?-1:1,hand=bones['hand_'+side],upper=bones['upperarm_'+side],lower=bones['lowerarm_'+side];
  const wrist=pos(hand),long=pos(bones['middle_01_'+side]).sub(wrist).normalize();
  const across=pos(bones['index_01_'+side]).sub(pos(bones['pinky_01_'+side]));
  const normal=across.cross(long).normalize().multiplyScalar(-sign);
  const handFrame=frame(long,normal),handQ=worldQ(hand);
  const fingers=[];
  for(const finger of ['index','middle','ring','pinky','thumb'])for(let i=1;i<=3;i++){
   const bone=bones[`${finger}_0${i}_${side}`],child=bones[`${finger}_0${Math.min(3,i+1)}_${side}`];
   const dir=i<3?pos(child).sub(pos(bone)).normalize():v(0,1,0).applyQuaternion(worldQ(bone));
   const toward=finger==='thumb'?pos(bones['middle_02_'+side]).sub(pos(bone)).normalize():normal;
   const axis=dir.clone().cross(toward).normalize().applyQuaternion(worldQ(bone).invert());
   fingers.push({bone,axis,finger,index:i});
  }
  const upperDir=pos(lower).sub(pos(upper)).normalize(),lowerDir=pos(hand).sub(pos(lower)).normalize();
  const upperFrame=frame(upperDir,upperDir.clone().cross(lowerDir).normalize()),upperQ=worldQ(upper);
  const hingeAxis=upperDir.clone().cross(lowerDir).normalize().applyQuaternion(worldQ(lower).invert());
  arms[side]={sign,hand,upper,lower,length1:pos(upper).distanceTo(pos(lower)),length2:pos(lower).distanceTo(pos(hand)),handFrame,handQ,fingers,upperFrame,upperQ,hingeAxis,lowerRest:lower.quaternion.clone()};
 }
 const legs={};for(const side of ['r','l']){
  const upper=bones['thigh_'+side],lower=bones['calf_'+side],foot=bones['foot_'+side];
  const upperDir=pos(lower).sub(pos(upper)).normalize(),lowerDir=pos(foot).sub(pos(lower)).normalize();
  legs[side]={upper,lower,foot,length1:pos(upper).distanceTo(pos(lower)),length2:pos(lower).distanceTo(pos(foot)),ankle:pos(foot),q:worldQ(foot),upperFrame:frame(upperDir,upperDir.clone().cross(lowerDir).normalize()),upperQ:worldQ(upper)};
 }
 const diagnostics={};
 // fingers: {r: {index: [MCP, PIP, DIP], ...}, l: {...}}, angles in radians.
 function pose({right,left,rightGrip=0,leftGrip=0,sit=0,walk=0,palms={},fingers={},collider=null}){
  for(const [name,b] of Object.entries(bones)){b.quaternion.copy(rest[name].q);b.position.copy(rest[name].p);}
  // Lower the pelvis, keeping feet independently planted via knee IK.
  root.updateMatrixWorld(true);
  const pelvisTarget=pos(bones.pelvis).add(v(0,-sit*.42,0));
  bones.pelvis.position.copy(bones.pelvis.parent.worldToLocal(root.localToWorld(pelvisTarget)));
  root.updateMatrixWorld(true);
  for(const [side,a] of Object.entries(arms)){
   const target=(side==='r'?right:left).clone();target.y-=sit*.42;
   const shoulder=pos(a.upper),result=solveLimb(shoulder,target,v(a.sign*.42,-.85,-.32),a.length1,a.length2);
   // Align the upper-arm roll to the bending plane BEFORE flexing the elbow.
   // This keeps elbow motion on its anatomical hinge rather than twisting the forearm.
   const upperDir=result.elbow.clone().sub(shoulder).normalize(),lowerDir=result.wrist.clone().sub(result.elbow).normalize();
   const upperRotation=frame(upperDir,upperDir.clone().cross(lowerDir).normalize()).multiply(a.upperFrame.clone().invert()).multiply(a.upperQ);
   orient(a.upper,worldQ(root).multiply(upperRotation));aim(a.lower,a.hand,result.wrist);
   const grip=side==='r'?rightGrip:leftGrip;
   const long=palms[side]?.long||v(0,-1,.12),normal=palms[side]?.normal||v(-a.sign,0,0);
   const desired=frame(long,normal).multiply(a.handFrame.clone().invert()).multiply(a.handQ);
   orient(a.hand,worldQ(root).multiply(desired));
   // Test the whole downstream finger, including an estimated fingertip and
   // skin radius. Catalog bounds are conservative (handles are not modeled).
   const penetrates=f=>{
    if(!collider)return false;
    root.updateMatrixWorld(true);
    const joints=a.fingers.filter(j=>j.finger===f.finger&&j.index>=f.index);
    for(const j of joints){
     const start=pos(j.bone),next=bones[`${j.finger}_0${j.index+1}_${side}`];
     const end=next?pos(next):start.clone().add(v(0,.018,0).applyQuaternion(worldQ(j.bone)).applyQuaternion(worldQ(root).invert()));
     for(let i=0;i<=8;i++){
      const p=start.clone().lerp(end,i/8),r=.005;
      if(p.x>collider.min.x-r&&p.x<collider.max.x+r&&p.y>collider.min.y-r&&p.y<collider.max.y+r&&p.z>collider.min.z-r&&p.z<collider.max.z+r)return true;
     }
    }
    return false;
   };
   for(const f of a.fingers){
    const angle=clamp(fingers[side]?.[f.finger]?.[f.index-1]??grip*(f.finger==='thumb'?[.55,.45,.35][f.index-1]:[.50,.85,.60][f.index-1]),0,1.5);
    let safe=0;
    for(let step=1;step<=12;step++){
     const candidate=angle*step/12;
     f.bone.quaternion.copy(rest[f.bone.name].q).multiply(new T.Quaternion().setFromAxisAngle(f.axis,candidate));
     if(penetrates(f))break;
     safe=candidate;
    }
    f.bone.quaternion.copy(rest[f.bone.name].q).multiply(new T.Quaternion().setFromAxisAngle(f.axis,safe));
   }
   diagnostics[side]={shoulder:shoulder.toArray(),elbow:result.elbow.toArray(),wrist:result.wrist.toArray(),requested:target.toArray(),limited:result.limited};
  }
  for(const [side,l] of Object.entries(legs)){
   const sign=side==='r'?-1:1,target=l.ankle.clone();target.z+=sit*.39+walk*sign;target.y+=Math.max(0,walk*sign)*.35;
   const result=solveLimb(pos(l.upper),target,v(sign*.05,.05,1),l.length1,l.length2);
   const upperDir=result.elbow.clone().sub(pos(l.upper)).normalize(),lowerDir=result.wrist.clone().sub(result.elbow).normalize();
   orient(l.upper,worldQ(root).multiply(frame(upperDir,upperDir.clone().cross(lowerDir).normalize()).multiply(l.upperFrame.clone().invert()).multiply(l.upperQ)));
   aim(l.lower,l.foot,result.wrist);orient(l.foot,worldQ(root).multiply(l.q));
  }
  root.updateMatrixWorld(true);
 }
 return {root,bones,pose,diagnostics,arms};
}
