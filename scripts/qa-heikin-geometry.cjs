const assert=require('node:assert/strict');
const M=require('../heikin-narasu-motion.js');
let checks=0;
for(const [width,height,capacity] of [[76,180,300],[106,170,600],[106,170,1500]]){
 for(let angle=-89;angle<=89;angle+=7)for(let volume=0;volume<=capacity;volume+=5){
  const r=M.liquid(width,height,angle,volume,capacity,170,220);
  assert(Math.abs(r.area/(width*height)*capacity-volume)<1e-7);
  assert(r.polygon.every(p=>p.y>=r.surface-1e-7));checks++;
 }
 for(let volume=1;volume<=capacity;volume+=5){const angle=M.spillAngle(width,height,volume/capacity);assert(Math.abs(M.retained(width,height,angle)-volume/capacity)<1e-8);checks++;}
}
for(const direction of [-1,1])for(const initial of [10,60,180,300])for(const amount of [5,10,50].filter(q=>q<=initial)){
 for(let i=0;i<=100;i++){
  const p=i/100,removed=Math.round(amount*M.removed(p)),arrived=Math.round(amount*M.arrived(p)),remaining=initial-removed;
  assert(removed>=arrived);assert.equal(remaining+arrived+removed-arrived,initial);
  const pose=M.pose({fromX:480-direction*190,toX:480,base:370,width:76,height:180,initial,remaining,capacity:300,progress:p,targetWidth:76});
  if(p>=.38&&p<.78){const r=M.liquid(76,180,pose.angle,remaining,300,pose.x,pose.y);
   assert(Math.abs(pose.lip.y-110)<1e-7);
   assert(direction===1?Math.max(...r.vessel.map(v=>v.x))<=442:Math.min(...r.vessel.map(v=>v.x))>=518);
   if(remaining)assert(Math.abs(r.surface-pose.lip.y)<1e-7);
   const impact={x:480,y:370-180*arrived/300},stream=M.stream(pose.lip,impact);assert.deepEqual(stream[0],pose.lip);assert(Math.abs(stream.at(-1).y-impact.y)<1e-6);assert(stream.every((v,j)=>!j||v.y>=stream[j-1].y));
  }checks++;
 }
}
assert(M.sweepPossible([5,4,1,2]));assert(M.sweepPossible([6,6,6,0,0,0]));assert(!M.sweepPossible([1,5,5,1]));
console.log(`PASS: ${checks} liquid areas, horizontal surfaces, spill angles, vessel clearances, gravity streams, and sweep feasibility checks`);
