// Draw in the paper's gutters so arrows do not run through the words.
let connectionFrame=0;
function drawConnections(paper, ids, {confirmed=false,animate=true}={}) {
 cancelAnimationFrame(connectionFrame);
 connectionFrame=requestAnimationFrame(()=>{
  if(!paper?.isConnected)return;
  paper.querySelector('.connections')?.remove();
  const ref=paper.querySelector('.ref');
  if(!ref||!ids.length)return;
  const box=paper.getBoundingClientRect(),refBox=ref.getClientRects()[0];
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  const node=(tag,attrs)=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));return el};
  svg.setAttribute('class',`connections ${animate?'grow':''} ${confirmed?'confirmed':'trying'}`);
  svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);
  svg.setAttribute('role','img');
  const labels=[];
  ids.forEach((id,i)=>{
   const target=paper.querySelector(`[data-piece="${id}"],[data-source="${id}"]`);
   if(!target)return;
   const targetBox=target.getClientRects()[0];
   labels.push(target.textContent.replace(/^[＋✓]\s*/,''));
   const sourceX=refBox.left-box.left+refBox.width/2,sourceY=refBox.top-box.top-2;
   const targetX=targetBox.left-box.left+Math.min(24,targetBox.width/2),targetY=targetBox.top-box.top-3;
   const fromY=Math.min(ref.closest('p').getBoundingClientRect().top-box.top,sourceY)-5;
   const toY=Math.min(target.closest('p').getBoundingClientRect().top-box.top,targetY)-5;
   const rail=sourceX+targetX<box.width?6+i*4:box.width-6-i*4;
   const d=`M ${sourceX} ${sourceY} V ${fromY} H ${rail} V ${toY} H ${targetX} V ${targetY-7}`;
   const group=node('g',{'data-target':id,style:`--delay:${i*.16}s`});
   group.append(node('path',{class:'arrow-halo',d}),node('path',{class:'arrow-line',d,pathLength:1}),
    node('path',{class:'arrow-head',d:`M ${targetX-5} ${targetY-8} L ${targetX} ${targetY} L ${targetX+5} ${targetY-8}`}),
    node('circle',{class:'arrow-origin',cx:sourceX,cy:sourceY,r:3}));
   svg.append(group);
  });
  svg.setAttribute('aria-label',`${ref.textContent}から、${labels.join('と')}への矢印。${confirmed?'確かめたつながり。':'えらんだつながりを、入れかえて確かめよう。'}`);
  paper.append(svg);
 });
}
