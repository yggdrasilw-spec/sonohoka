/* Geometry shared by the SVG animation and the numerical checks. */
(function(root){
'use strict';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
function area(p){let a=0;for(let i=0;i<p.length;i++){const q=p[(i+1)%p.length];a+=p[i].x*q.y-q.x*p[i].y;}return Math.abs(a)/2;}
function rotate(p,angle,cx=0,cy=0){const r=angle*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return {x:cx+p.x*c-p.y*s,y:cy+p.x*s+p.y*c};}
function clipBelow(poly,line){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],inside=a.y>=line,next=b.y>=line;if(inside)out.push(a);if(inside!==next){const t=(line-a.y)/(b.y-a.y);out.push({x:a.x+(b.x-a.x)*t,y:line});}}return out;}
function rectangle(w,h,angle,cx=0,cy=0){return [{x:-w/2,y:-h},{x:w/2,y:-h},{x:w/2,y:0},{x:-w/2,y:0}].map(p=>rotate(p,angle,cx,cy));}
function liquid(w,h,angle,volume,capacity,cx=0,cy=0){
 const vessel=rectangle(w,h,angle,cx,cy),target=clamp(volume/capacity)*w*h;
 let lo=Math.min(...vessel.map(p=>p.y)),hi=Math.max(...vessel.map(p=>p.y));
 for(let i=0;i<45;i++){const mid=(lo+hi)/2;if(area(clipBelow(vessel,mid))>target)lo=mid;else hi=mid;}
 const surface=(lo+hi)/2,polygon=volume>0?clipBelow(vessel,surface):[];
 return {polygon,surface,area:area(polygon),vessel};
}
function retained(w,h,angle){const p=rectangle(w,h,angle);return area(clipBelow(p,Math.max(p[0].y,p[1].y)))/(w*h);}
function spillAngle(w,h,fraction){let lo=0,hi=90;for(let i=0;i<36;i++){const m=(lo+hi)/2;if(retained(w,h,m)>fraction)lo=m;else hi=m;}return (lo+hi)/2;}
const removed=p=>ease((p-.38)/.34),arrived=p=>ease((p-.43)/.34);
function pose({fromX,toX,base,width,height,initial,remaining,capacity,progress,targetWidth}){
 const p=clamp(progress),dir=toX>=fromX?1:-1;
 const initialTilt=spillAngle(width,height,initial/capacity),currentTilt=spillAngle(width,height,remaining/capacity);
 let angle=p<.22?0:p<.38?initialTilt*ease((p-.22)/.16):p<.78?currentTilt:currentTilt*(1-ease((p-.78)/.12));
 angle*=dir;
 const lipLocal={x:dir*width/2,y:-height},lipRot=rotate(lipLocal,angle);
 const lipX=toX-dir*(targetWidth/2+10),lipY=Math.max(110,width+12);
 const hover={x:toX-dir*(width+55),y:height+8};
 const tilted={x:lipX-lipRot.x,y:lipY-lipRot.y};
 let center;
 if(p<.22){const k=ease(p/.22);center={x:fromX+(hover.x-fromX)*k,y:base+(hover.y-base)*k-28*Math.sin(k*Math.PI)};}
 else if(p<.38){const k=ease((p-.22)/.16);center={x:hover.x+(tilted.x-hover.x)*k,y:hover.y+(tilted.y-hover.y)*k};}
 else if(p<.78)center=tilted;
 else if(p<.9){const k=ease((p-.78)/.12);center={x:tilted.x+(hover.x-tilted.x)*k,y:tilted.y+(hover.y-tilted.y)*k};}
 else{const k=ease((p-.9)/.1);center={x:hover.x+(fromX-hover.x)*k,y:hover.y+(base-hover.y)*k};}
 return {...center,angle,lip:rotate(lipLocal,angle,center.x,center.y),dir};
}
function stream(start,end){const gravity=500,vy=30,dy=Math.max(1,end.y-start.y),time=(-vy+Math.sqrt(vy*vy+2*gravity*dy))/gravity,vx=(end.x-start.x)/time;
 return Array.from({length:17},(_,i)=>{const t=time*i/16;return {x:start.x+vx*t,y:start.y+vy*t+.5*gravity*t*t};});
}
function sweepPossible(values){const a=values.reduce((x,y)=>x+y,0)/values.length;let held=0;return Number.isInteger(a)&&values.every(v=>{held+=v-a;return held>=0;});}
// Grain identities persist: a blade translates connected rows, then gravity settles them.
function soilPlan(values,pieces=8){
 const average=values.reduce((a,b)=>a+b,0)/values.length,count=values.length*pieces;
 let grains=values.flatMap((h,i)=>Array.from({length:pieces},(_,j)=>Array.from({length:h},(_,y)=>({x:i*pieces+j,y}))).flat()).map((g,id)=>({...g,id}));
 let vehicle={x:0,depth:0,dir:1},time=0;const events=[];
 function add(kind,nextGrains,nextVehicle,weight=1){
  const last=events.at(-1);
  if(kind==='drive'&&last?.kind==='drive'&&last.to.dir===nextVehicle.dir){last.end+=weight;last.to={...nextVehicle};time+=weight;vehicle={...nextVehicle};return;}
  events.push({kind,start:time,end:time+weight,before:grains,after:nextGrains,from:{...vehicle},to:{...nextVehicle}});
  time+=weight;grains=nextGrains;vehicle={...nextVehicle};
 }
 function pass(dir){
  for(let j=dir===1?0:count-1;dir===1?j<count-1:j>0;j+=dir){
   const edge=j+(dir===-1?1:0);
   if(vehicle.x!==edge)add('drive',grains,{...vehicle,x:edge},Math.abs(vehicle.x-edge)*.35);
   const grid=new Map(grains.map(g=>[`${g.x},${g.y}`,g])),moving=new Set();let blocked=false;
   for(const g of grains.filter(g=>g.x===j&&g.y>=average)){
    let x=j;while(grid.has(`${x},${g.y}`)){moving.add(grid.get(`${x},${g.y}`).id);x+=dir;}
    if(x<0||x>=count)blocked=true;
   }
   if(blocked)return false;
   const pushed=grains.map(g=>moving.has(g.id)?{...g,x:g.x+dir}:g);
   add(moving.size?'push':'drive',pushed,{...vehicle,x:edge+dir},moving.size?1:.35);
   // Sort each column bottom-up. Falling never changes x or lifts a grain.
   const columns=Array.from({length:count},()=>[]);pushed.forEach(g=>columns[g.x].push(g));
   const settled=new Map();columns.forEach(col=>col.sort((a,b)=>a.y-b.y).forEach((g,y)=>settled.set(g.id,{...g,y})));
   const fallen=pushed.map(g=>settled.get(g.id));
   if(fallen.some((g,i)=>g.y!==pushed[i].y))add('fall',fallen,vehicle,.8);
  }
  return grains.every(g=>g.y<average);
 }
 if(!pass(1)){
  add('back',grains,{...vehicle,x:vehicle.x-3},2);
  add('away',grains,{...vehicle,depth:1},2);
  add('bypass',grains,{...vehicle,x:count+1},6);
  add('turn',grains,{...vehicle,dir:-1},2);
  add('return',grains,{...vehicle,depth:0},2);
  pass(-1);
 }
 add('drive',grains,{...vehicle,x:vehicle.dir===1?count+1:-1},1);
 return {events,duration:time,average,count,pieces,initial:events[0].before,final:grains};
}
function soilFrame(plan,progress){
 const time=clamp(progress)*plan.duration,e=plan.events.find(e=>time<e.end)||plan.events.at(-1),p=clamp((time-e.start)/(e.end-e.start));
 const t=e.kind==='fall'?p*p:ease(p);
 const grains=e.before.map((g,i)=>({...g,x:g.x+(e.after[i].x-g.x)*t,y:g.y+(e.after[i].y-g.y)*t}));
 const vehicle={x:e.from.x+(e.to.x-e.from.x)*ease(p),depth:e.from.depth+(e.to.depth-e.from.depth)*ease(p),dir:e.kind==='turn'?(p<.5?e.from.dir:e.to.dir):e.from.dir,turn:e.kind==='turn'?Math.abs(1-2*p):1};
 return {grains,vehicle,kind:e.kind,progress:clamp(progress),position:vehicle.x};
}
const api={clamp,ease,area,rotate,clipBelow,liquid,retained,spillAngle,removed,arrived,pose,stream,sweepPossible,soilPlan,soilFrame};
root.NarasuMotion=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
