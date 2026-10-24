const assert=require('node:assert/strict');
const M=require('../heikin-narasu-motion.js');
let cases=0,events=0,seed=23;
function verify(values){
 const average=values.reduce((a,b)=>a+b,0)/values.length;
 if(!Number.isInteger(average)||!average)return;
 const p=M.soilPlan(values),total=values.reduce((a,b)=>a+b,0)*8;
 for(const e of p.events){
  assert.equal(e.after.length,total);
  assert.equal(new Set(e.after.map(g=>`${g.x},${g.y}`)).size,total,'no overlapping grains');
  for(let i=0;i<total;i++){
   const a=e.before[i],b=e.after[i];assert.equal(a.id,b.id);
   assert(b.x>=0&&b.x<p.count&&b.y>=0);
   if(e.kind==='push'){assert.equal(a.y,b.y,'pushing only translates horizontally');assert([0,e.from.dir].includes(b.x-a.x));}
   else if(e.kind==='fall'){assert.equal(a.x,b.x,'gravity only moves down');assert(b.y<=a.y);}
   else assert.deepEqual(a,b,'vehicle repositioning leaves soil alone');
  }
  if(e.kind==='fall')for(const g of e.after)if(g.y>0)assert(e.after.some(b=>b.x===g.x&&b.y===g.y-1),'settled soil has support');
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
 assert(heights.every(h=>h===average),JSON.stringify(values));cases++;
}
for(let code=0;code<7**4;code++){let c=code;const v=Array.from({length:4},()=>{const q=c%7;c=Math.floor(c/7);return q;});verify(v);}
for(let i=0;i<500;i++){const n=3+i%4;verify(Array.from({length:n},()=>{seed=(1664525*seed+1013904223)>>>0;return seed%7;}));}
const reverse=M.soilPlan([1,5,5,1]);
assert.deepEqual(reverse.events.filter(e=>['back','away','bypass','turn','return'].includes(e.kind)).map(e=>e.kind),['back','away','bypass','turn','return']);
assert(reverse.events.some(e=>e.kind==='push'&&e.from.dir===-1));
console.log(`PASS: ${cases} soil layouts, ${events} events; horizontal pushing, downward falls, support, conservation, bypass and reverse pass`);
