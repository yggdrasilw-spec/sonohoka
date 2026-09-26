import {readFileSync} from 'node:fs';
import {BVHLoader} from '../vendor/BVHLoader.js';
import * as T from '../vendor/three.module.js';
for(const name of process.argv.slice(2)){
 const {skeleton,clip}=new BVHLoader().parse(readFileSync(new URL('./assets/'+name+'.bvh',import.meta.url),'utf8'));
 const root=skeleton.bones[0],mixer=new T.AnimationMixer(root);mixer.clipAction(clip).setLoop(T.LoopOnce,1).play();
 const p=n=>skeleton.bones.find(b=>b.name===n).getWorldPosition(new T.Vector3());
 console.log(name,clip.duration);
 for(let t=.05;t<clip.duration;t+=.25){
  mixer.setTime(t);root.updateMatrixWorld(true);const hip=p('Hips'),chest=p('Neck').sub(hip);
  const forward=p('LeftUpLeg').sub(p('RightUpLeg'));forward.y=0;forward.normalize().cross(new T.Vector3(0,1,0));
  const vals=[hip.y,...['RightHand','LeftHand','RightFoot','LeftFoot'].flatMap(n=>{const a=p(n);return [a.y,a.clone().sub(hip).dot(forward)];}),Math.atan2(chest.dot(forward),chest.y)];
  console.log(t.toFixed(2),vals.map(x=>+x.toFixed(2)).join(' '));
 }
}
