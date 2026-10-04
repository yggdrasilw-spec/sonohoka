(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HakoNetGeometry=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const EPS=1e-7,add=(a,b)=>a.map((v,i)=>v+b[i]),scale=(a,n)=>a.map(v=>v*n),same=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<EPS);
 const size=f=>f.turn%2?[f.h,f.w]:[f.w,f.h];
 function faces([w,h,d]){return[{id:'front',name:'まえ',color:'#58e986',w,h},{id:'back',name:'うしろ',color:'#58e986',w,h},{id:'left',name:'ひだり',color:'#3ac7ff',w:d,h},{id:'right',name:'みぎ',color:'#3ac7ff',w:d,h},{id:'top',name:'うえ',color:'#ffd43b',w,h:d},{id:'bottom',name:'した',color:'#ffd43b',w,h:d}].map(f=>({...f,x:0,y:0,turn:0}))}
 function example(dims){const [w,h,d]=dims;return faces(dims).map(f=>({...f,...({front:{x:0,y:0},back:{x:0,y:h+d},left:{x:-d,y:0},right:{x:w,y:0},top:{x:0,y:-d},bottom:{x:0,y:h}}[f.id])}))}
 function adjacency(fs){const graph=fs.map(()=>[]);let overlap=false,partial=false;
  for(let i=0;i<fs.length;i++)for(let j=i+1;j<fs.length;j++){
   const a=fs[i],b=fs[j],[aw,ah]=size(a),[bw,bh]=size(b);
   const ox=Math.min(a.x+aw,b.x+bw)-Math.max(a.x,b.x),oy=Math.min(a.y+ah,b.y+bh)-Math.max(a.y,b.y);
   if(ox>EPS&&oy>EPS)overlap=true;
   let dir=null;
   if(Math.abs(a.x+aw-b.x)<EPS&&oy>EPS){if(Math.abs(a.y-b.y)<EPS&&Math.abs(ah-bh)<EPS)dir='E';else partial=true}
   if(Math.abs(b.x+bw-a.x)<EPS&&oy>EPS){if(Math.abs(a.y-b.y)<EPS&&Math.abs(ah-bh)<EPS)dir='W';else partial=true}
   if(Math.abs(a.y+ah-b.y)<EPS&&ox>EPS){if(Math.abs(a.x-b.x)<EPS&&Math.abs(aw-bw)<EPS)dir='S';else partial=true}
   if(Math.abs(b.y+bh-a.y)<EPS&&ox>EPS){if(Math.abs(a.x-b.x)<EPS&&Math.abs(aw-bw)<EPS)dir='N';else partial=true}
   if(dir){graph[i].push({to:j,dir});graph[j].push({to:i,dir:({E:'W',W:'E',S:'N',N:'S'})[dir]})}
  }
  return{graph,overlap,partial};
 }
 function child(a,dir,as,bs,angle){const c=Math.cos(angle),s=Math.sin(angle),[aw,ah]=as,[bw,bh]=bs;let r=a.r,d=a.d,n=a.n,o=a.o;
  if(dir==='E'){o=add(o,scale(r,aw));r=add(scale(a.r,c),scale(a.n,-s));n=add(scale(a.r,s),scale(a.n,c))}
  if(dir==='W'){r=add(scale(a.r,c),scale(a.n,s));n=add(scale(a.r,-s),scale(a.n,c));o=add(o,scale(r,-bw))}
  if(dir==='S'){o=add(o,scale(d,ah));d=add(scale(a.d,c),scale(a.n,-s));n=add(scale(a.d,s),scale(a.n,c))}
  if(dir==='N'){d=add(scale(a.d,c),scale(a.n,s));n=add(scale(a.d,-s),scale(a.n,c));o=add(o,scale(d,-bh))}
  return{o,r,d,n};
 }
 function folded(fs,progress=1){const {graph}=adjacency(fs),frames=Array(fs.length).fill(null),parents=Array(fs.length).fill(null);if(!fs.length)return{frames,parents,graph,cycle:false};frames[0]={o:[0,0,0],r:[1,0,0],d:[0,1,0],n:[0,0,1]};const queue=[0];let cycle=false;
  while(queue.length){const i=queue.shift();for(const e of graph[i]){const next=child(frames[i],e.dir,size(fs[i]),size(fs[e.to]),progress*Math.PI/2);if(!frames[e.to]){frames[e.to]=next;parents[e.to]={from:i,dir:e.dir};queue.push(e.to)}else if(progress===1&&(!same(next.o,frames[e.to].o)||!same(next.n,frames[e.to].n)||!same(next.r,frames[e.to].r)))cycle=true}}
  return{frames,parents,graph,cycle};
 }
 function corners(f,frame){const[w,h]=size(f);return[[0,0],[w,0],[w,h],[0,h]].map(([x,y])=>add(frame.o,add(scale(frame.r,x),scale(frame.d,y))))}
 function check(fs,dims){
  if(fs.length!==6||new Set(fs.map(f=>f.id)).size!==6)return{ok:false,message:'6まいの面を、1まいずつ使おう。'};
  const adj=adjacency(fs),fold=folded(fs),base={...fold};
  if(adj.overlap)return{...base,ok:false,message:'平らなところで面が重なっているよ。重ならない場所に動かそう。'};
  if(adj.partial)return{...base,ok:false,message:'辺の長さや、はしの位置が合っていないよ。辺ぜんぶをぴったりつなごう。'};
  if(fold.frames.some(f=>!f))return{...base,ok:false,message:'まだ、はなれている面があるよ。6まいを辺どうしでつなごう。'};
  const normals=fold.frames.map(f=>f.n.map(v=>Math.round(v)).join(','));
  if(new Set(normals).size!==6||fold.cycle)return{...base,ok:false,message:'折ると、同じ場所に面が重なってしまうよ。つなぐ場所を変えてみよう。'};
  const cs=fs.flatMap((f,i)=>corners(f,fold.frames[i])),lo=[0,1,2].map(k=>Math.min(...cs.map(p=>p[k]))),hi=[0,1,2].map(k=>Math.max(...cs.map(p=>p[k])));
  const ext=hi.map((v,i)=>v-lo[i]).sort((a,b)=>a-b),expected=[...dims].sort((a,b)=>a-b);
  if(!same(ext,expected)||cs.some(p=>p.some((v,k)=>Math.abs(v-lo[k])>EPS&&Math.abs(v-hi[k])>EPS)))return{...base,ok:false,message:'折ったとき、面のはしがそろわないよ。長さの合う辺をつなごう。'};
  return{...base,ok:true,message:'できた！ 6まいが重ならず、ぴったり はこの形になるよ。'};
 }
 return{faces,example,size,adjacency,folded,corners,check};
});
