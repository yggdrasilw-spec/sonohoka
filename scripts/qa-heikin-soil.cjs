const assert=require('node:assert/strict');
const M=require('../heikin-narasu-motion.js');
let cases=0,events=0,seed=23;
function verify(values,options={}){
 const average=values.reduce((a,b)=>a+b,0)/values.length;
 if(!Number.isInteger(average)||!average)return;
 const p=M.soilPlan(values,8,options),total=values.reduce((a,b)=>a+b,0)*8;
 for(const e of p.events){
  assert.equal(e.after.length,total);
  assert.equal(new Set(e.after.map(g=>`${g.x},${g.y}`)).size,total,'no overlapping grains');
  for(let i=0;i<total;i++){
   const a=e.before[i],b=e.after[i];assert.equal(a.id,b.id);
   assert(b.x>=0&&b.x<p.count&&b.y>=0);
   if(e.kind==='push'){assert.equal(a.y,b.y,'pushing only translates horizontally');assert([0,e.from.dir].includes(b.x-a.x));if(a.x!==b.x)assert(a.y>=e.from.height,'only push soil at the chosen cut height or above');}
   else if(e.kind==='fall'){assert.equal(a.x,b.x,'gravity only moves down');assert(b.y<=a.y);}
   else assert.deepEqual(a,b,'vehicle repositioning leaves soil alone');
  }
  if(e.kind==='fall')for(const g of e.after)if(g.y>0)assert(e.after.some(b=>b.x===g.x&&b.y===g.y-1),'settled soil has support');
  if(e.kind==='lower'){assert.equal(e.to.height,e.from.height-1);assert(e.from.x<0||e.from.x>p.count,'lower the blade outside the soil');}
  for(const fraction of [.25,.5,.75]){
   const f=M.soilFrame(p,(e.start+(e.end-e.start)*fraction)/p.duration);
   assert.equal(f.grains.length,total);
   for(let i=0;i<total;i++){
    if(e.kind==='push')assert.equal(f.grains[i].y,e.before[i].y);
    if(e.kind==='fall')assert.equal(f.grains[i].x,e.before[i].x);
   }
  }
  events++;
 }
 const heights=Array(p.count).fill(0);p.final.forEach(g=>heights[g.x]++);
 assert.equal(p.flat,heights.every(h=>h===average));
 if(options.startHeight===undefined||(options.layered&&options.startHeight>=average))assert(p.flat,JSON.stringify({values,options}));
 if(options.startHeight<average)assert(p.blocked,'insufficient space must not be hidden by forcing an answer');
 cases++;
}
for(let code=0;code<7**4;code++){let c=code;const v=Array.from({length:4},()=>{const q=c%7;c=Math.floor(c/7);return q;});verify(v);}
for(let i=0;i<500;i++){const n=3+i%4;verify(Array.from({length:n},()=>{seed=(1664525*seed+1013904223)>>>0;return seed%7;}));}
const reverse=M.soilPlan([1,5,5,1]);
assert.deepEqual(reverse.events.filter(e=>['back','away','bypass','turn','return'].includes(e.kind)).map(e=>e.kind),['back','away','bypass','turn','return']);
assert(reverse.events.some(e=>e.kind==='push'&&e.from.dir===-1));
for(const values of [[5,4,1,2],[1,5,5,1],[6,6,6,0,0,0],[0,6,0],[0,0,6],[6,5,4],[1,1,1],[4,2,4,2,3],[6,1,4,2,3,2]]){
 for(let startHeight=1;startHeight<=Math.max(...values);startHeight++)for(const layered of [false,true])verify(values,{startHeight,layered});
}
const layers=M.soilPlan([5,4,1,2],8,{startHeight:4,layered:true});
assert.deepEqual([...new Set(layers.events.filter(e=>e.kind==='push').map(e=>e.from.height))],[4,3]);
assert(layers.flat);
const high=M.soilPlan([5,4,1,2],8,{startHeight:4,layered:false});assert(!high.flat);assert(!high.blocked);
console.log(`PASS: ${cases} soil layouts, ${events} events; horizontal pushing, downward falls, support, conservation, bypass and reverse pass`);
