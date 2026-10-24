(function(root){
'use strict';
const M=root.NarasuMotion;
const text=(x,y,label,cls='')=>`<text x="${x}" y="${y}" text-anchor="middle" class="${cls}">${label}</text>`;
const points=p=>p.map(v=>`${v.x.toFixed(3)},${v.y.toFixed(3)}`).join(' ');
function stone(x,y,w,h,index,kind){
 const colors=['#b98650','#c89b60','#ac7545','#d0a36b'];
 return `<path data-grain="${kind}" d="M${x+2} ${y+1}L${x+w-4} ${y}L${x+w} ${y+5}L${x+w-2} ${y+h-2}L${x+4} ${y+h}L${x} ${y+h-5}Z" fill="${colors[index%4]}" stroke="#77502e" stroke-width="1.2"/>`;
}
function soil({state,visual,average}){
 const s=visual.soil,left=170,right=790,base=306,scale=32,sub=(right-left)/(state.values.length*8),gw=sub-2,gh=27;
 const line=base-average*scale,blade=left+s.vehicle.x*sub;
 let out=`<path d="M${left} ${base+4}H${right}" stroke="#856640" stroke-width="4"/><line class="hintLine" x1="${left}" x2="${right}" y1="${line}" y2="${line}"/>`;
 const captions={back:'いったん バックするよ',away:'土の山を よけて 奥へ',bypass:'奥を通って 右側へ',turn:'向きを 変えるよ',return:'反対側から ならすよ'};
 out+=text(480,30,captions[s.kind]||(s.vehicle.dir===1?'左から 右へ →':'← 右から 左へ'),'muted');
 let ground='';for(const g of s.grains)ground+=`<g data-grain-id="${g.id}" data-grid-x="${g.x}" data-grid-y="${g.y}">${stone(left+g.x*sub+1,base-(g.y+1)*scale+3,gw,gh,g.id,'ground')}</g>`;
 const depth=s.vehicle.depth,dir=s.vehicle.dir,shrink=1-.2*depth;
 const machine=`<g data-sweep-x="${blade}" data-direction="${dir}" data-depth="${depth}" data-motion="${s.kind}" transform="translate(${blade},${line-67-65*depth}) scale(${dir*shrink*Math.max(.12,s.vehicle.turn)},${shrink}) translate(-112,0)">
 <path d="M8 27H75V54H8Z" fill="#e4a824" stroke="#6b501c" stroke-width="3"/>
 <path d="M25 0H56L67 29H25Z" fill="#f4c653" stroke="#6b501c" stroke-width="3"/>
 <path d="M31 6H51L58 23H31Z" fill="#b9e0eb" stroke="#685a30" stroke-width="2"/>
 <rect x="0" y="48" width="85" height="22" rx="11" fill="#344b53"/>
 <path d="M12 59H73" stroke="#9eb0b5" stroke-width="4" stroke-dasharray="7 6"/>
 <path d="M74 38L103 52M75 27L103 41" stroke="#b98217" stroke-width="7"/>
 <path d="M107 25Q97 42 105 69L115 69L115 27Z" fill="#8f9ca1" stroke="#455d68" stroke-width="3"/>
 </g>`;
 out+=depth>.15?machine+ground:ground+machine;
 out+=text(480,351,'横に 押す。下が 空いたら、落ちて たまる。','muted');
 return out;
}
function water({state,visual,tx,selected,destination,hintLine}){
 const base=370,cap=300,height=180,width=76,n=state.values.length,jug=state.stage===3;
 const left=jug?45:75,right=jug?650:885,cell=(right-left)/n,xs=Array.from({length:n},(_,i)=>left+(i+.5)*cell);
 const specs=Object.fromEntries(xs.map((x,i)=>[i,{x,width,height,capacity:cap}]));
 if(jug)specs.jug={x:807,width:106,height:170,capacity:state.original.reduce((a,b)=>a+b,0)};
 const value=key=>typeof key==='number'?visual.values[key]:visual.jug;
 let moving=null,to=null,p=0,pose=null;
 if(tx){moving=tx.from;to=tx.to==='all'?visual.activeCup:tx.to;p=tx.to==='all'?Math.min(.999999,tx.progress*n-visual.activeCup):tx.progress;
  const source=specs[moving],target=specs[to];
  if(source&&target)pose=M.pose({fromX:source.x,toX:target.x,base,width:source.width,height:source.height,initial:typeof moving==='number'?tx.before.values[moving]:tx.to==='all'?tx.before.jug-(tx.amount/n)*visual.activeCup:tx.before.jug,remaining:value(moving),capacity:source.capacity,progress:p,targetWidth:target.width});
 }
 let out='<defs><linearGradient id="waterGlass" x1="0" x2="1"><stop offset="0" stop-color="#e3f4fb" stop-opacity=".5"/><stop offset=".4" stop-color="white" stop-opacity=".06"/><stop offset="1" stop-color="#c8e7f0" stop-opacity=".3"/></linearGradient></defs>';
 function vessel(key,s,amount,position){
  const cx=position?.x??s.x,cy=position?.y??base,angle=position?.angle??0;
  const liquid=M.liquid(s.width,s.height,angle,amount,s.capacity,cx,cy),w=s.width,h=s.height;
  let svg=`<g data-vessel="${key}" data-angle="${angle}" data-volume="${amount}" data-surface="${liquid.surface}" data-area="${liquid.area}">`;
  svg+=`<polygon points="${points(liquid.vessel)}" fill="url(#waterGlass)"/>`;
  if(liquid.polygon.length)svg+=`<polygon data-liquid="${key}" points="${points(liquid.polygon)}" fill="#4fb4db" fill-opacity=".82" stroke="#228ab2" stroke-width="1.3"/>`;
  const surfacePoints=liquid.polygon.filter(p=>Math.abs(p.y-liquid.surface)<.001);
  if(surfacePoints.length>=2&&amount>0)svg+=`<path data-waterline="${key}" d="M${Math.min(...surfacePoints.map(p=>p.x))} ${liquid.surface}H${Math.max(...surfacePoints.map(p=>p.x))}" stroke="#06799d" stroke-width="2.4"/>`;
  svg+=`<g transform="translate(${cx},${cy}) rotate(${angle})"><path d="M${-w/2} ${-h}V0H${w/2}V${-h}" fill="none" stroke="#486f82" stroke-width="3.5" stroke-linecap="round"/>`;
  if(key==='jug')svg+=`<path d="M${w/2+2} ${-h+35}Q${w/2+64} ${-h+20} ${w/2+32} -58H${w/2+2}M${-w/2} ${-h+20}L${-w/2-15} ${-h}H${-w/2}" fill="none" stroke="#486f82" stroke-width="4"/>`;
  if(key==='jug'&&state.jugPhase==='divide')for(let i=1;i<n;i++){
   const y=-h*i/n;svg+=`<path data-division-mark="${i}" d="M${-w/2+3} ${y}H${w/2-3}" stroke="#815c20" stroke-width="2.5" stroke-dasharray="7 4"/>`;
  }
  if(key!=='jug')for(const mark of [0,100,200,300])svg+=`<path d="M${-w/2} ${-h*mark/cap}h8" stroke="#486f82" stroke-width="1.8"/>`;
  return svg+'</g></g>';
 }
 for(let i=0;i<n;i++){
  const x=xs[i],s=specs[i],chosen=selected===i||destination===i;
  out+=`<g role="button" tabindex="0" data-col="${i}" aria-label="${i+1}ばん ${visual.values[i]} mL" aria-pressed="${chosen}"><rect class="target" x="${x-cell/2+2}" y="174" width="${cell-4}" height="280" rx="15"/>`;
  if(moving===i)out+=`<path d="M${x-width/2} ${base-height}V${base}H${x+width/2}V${base-height}" fill="none" stroke="#bacbd0" stroke-dasharray="5 6" stroke-width="2"/>`;
  else out+=vessel(i,s,visual.values[i]);
  if(hintLine&&state.stage!==4)out+=`<path class="hintLine" d="M${x-width/2-5} ${base-height*(state.original.reduce((a,b)=>a+b,0)/n)/cap}h${width+10}"/>`;
  out+=text(x,407,`${visual.values[i]} mL`)+text(x,440,`${i+1}ばん`,'muted')+'</g>';
 }
 if(jug){const s=specs.jug;
  if(moving!=='jug')out+=vessel('jug',s,visual.jug);
  else out+=`<path d="M754 200V370H860V200" fill="none" stroke="#bacbd0" stroke-dasharray="5 6" stroke-width="2"/>`;
  if(state.jugPhase==='divide'&&moving!=='jug')out+=text(s.x,181,`${n}等分の目印`,'muted');
  out+=text(s.x,407,`${visual.jug} mL`)+text(s.x,435,`水差し：容量 ${s.capacity} mL`,'muted')+text(s.x,457,'コップとは別の縮尺','muted');
 }
 if(pose){
  const s=specs[moving];out+=vessel(moving,s,value(moving),pose);
  if(visual.transit>0){const target=specs[to],surface=base-target.height*value(to)/target.capacity;
   const path=M.stream(pose.lip,{x:target.x,y:surface});
   out+=`<polyline data-stream="true" data-start-x="${pose.lip.x}" data-start-y="${pose.lip.y}" points="${points(path)}" fill="none" stroke="#1c9aca" stroke-width="5" stroke-linecap="round" opacity=".85"/>`;
   out+=`<ellipse cx="${target.x}" cy="${surface}" rx="${10+3*Math.sin(p*70)}" ry="3" fill="none" stroke="#168eb8" stroke-width="1.6"/>`;
  }
 }
 return out;
}
function beads({state,visual,tx,selected,destination,hintLine,numbers,drag}){
 const colors=['#f3efe2','#334854'];
 const n=state.values.length,cell=780/n,xs=state.values.map((_,i)=>90+cell*(i+.5)),base=290;
 let out='<rect x="45" y="290" width="870" height="22" rx="8" fill="#cda97f"/><rect x="45" y="312" width="870" height="10" rx="4" fill="#987553"/>';
 if(hintLine){const y=base-state.original.reduce((a,b)=>a+b,0)/n*36;out+=`<line class="hintLine" x1="90" x2="870" y1="${y}" y2="${y}"/>`;}
 for(let i=0;i<n;i++){
  const x=xs[i],q=visual.values[i],chosen=selected===i||destination===i;
  out+=`<g role="button" tabindex="0" data-col="${i}" aria-label="${i+1}ばん ${q}こ" aria-pressed="${chosen}"><rect class="target" x="${x-cell/2+5}" y="36" width="${cell-10}" height="320" rx="16"/><rect x="${x-4}" y="60" width="8" height="230" rx="4" fill="#99a8ad"/>`;
  for(let k=0;k<q;k++)out+=`<ellipse data-bead-color="${visual.beadColors[i][k]}" cx="${x}" cy="${base-18-k*36}" rx="33" ry="16" fill="${colors[visual.beadColors[i][k]]}" stroke="#455c68" stroke-width="2"/>`;
  out+=text(x,345,`${i+1}ばん`,'muted');if(numbers)out+=text(x,42,`${q}こ`);if(chosen)out+=text(x,373,'えらんだよ','muted');out+='</g>';
 }
 if(tx){const p=tx.progress,k=M.ease(p),x=xs[tx.from]+(xs[tx.to]-xs[tx.from])*k;
  const fromY=base-(tx.before.values[tx.from]-.5)*36,toY=base-(tx.before.values[tx.to]+.5)*36,y=fromY+(toY-fromY)*k-60*Math.sin(p*Math.PI);
  const color=tx.before.beadColors[tx.from].at(-1);
  out+=`<ellipse data-moving-bead="true" data-bead-color="${color}" cx="${x}" cy="${y}" rx="33" ry="16" fill="${colors[color]}" stroke="#455c68" stroke-width="3"/>`;
 }
 if(drag?.moved)out+=`<circle cx="${drag.x}" cy="${drag.y}" r="20" fill="#f6b55d" opacity=".8" pointer-events="none"/>`;
 return out;
}
root.NarasuRender={soil,water,beads};
})(window);
