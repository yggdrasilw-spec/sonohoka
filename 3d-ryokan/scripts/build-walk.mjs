// Offline conversion. Inputs: CMU 07_01, Bruce Hahne BVH conversion, Three BVHLoader.
import {readFileSync,writeFileSync} from 'node:fs';
import {BVHLoader} from '../vendor/BVHLoader.js';
import * as T from '../vendor/three.module.js';
const {skeleton,clip}=new BVHLoader().parse(readFileSync(new URL('./assets/07_01.bvh',import.meta.url),'utf8'));
const root=skeleton.bones[0],mixer=new T.AnimationMixer(root);mixer.clipAction(clip).play();
const p=name=>skeleton.bones.find(b=>b.name===name).getWorldPosition(new T.Vector3());
const frames=[];
for(let i=0;i<=64;i++){
 mixer.setTime(.42+i/64*1.1);root.updateMatrixWorld(true);
 const hips=p('Hips'),frame=[];
 for(const side of ['Right','Left']){
  const foot=p(side+'Foot').sub(hips),hand=p(side+'Hand').sub(p(side+'Arm'));
  frame.push(foot.z/15,foot.y/15,hand.z/15);
 }
 frames.push(frame);
}
// Remove capture drift and close the single stride with a distributed correction.
for(let c=0;c<6;c++){
 const drift=frames[64][c]-frames[0][c];
 for(let i=0;i<=64;i++)frames[i][c]-=drift*i/64;
 const base=c%3===1?Math.min(...frames.map(f=>f[c])):frames.reduce((s,f)=>s+f[c],0)/65;
 for(const f of frames)f[c]=+(f[c]-base).toFixed(5);
}
writeFileSync(new URL('../models/walk-cycle.mjs',import.meta.url),'// CMU 07_01 walking; see MOTION-LICENSE.txt. Normalized foot Z/lift and hand Z.\nexport const walkFrames='+JSON.stringify(frames)+';\n');
