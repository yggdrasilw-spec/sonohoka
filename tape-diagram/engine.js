(function(root){
  'use strict';
  const kinds=['combine','increase','decrease','compare'];
  const typeNames={combine:'あわせて',increase:'ふえると',decrease:'のこりは',compare:'ちがいは'};
  const steps=['お話','動き','絵から○','○の図','描くところ','１本め','つづきを描く','名前と数','式'];
  function validate(data){
    if(!data || typeof data!=='object' || !kinds.includes(data.kind)) throw Error('お話の種類をえらんでください。');
    for(const k of ['left','right']) if(!Number.isInteger(data[k]) || data[k]<1 || data[k]>99) throw Error('部分の数は1〜99の整数にしてください。');
    if(!['left','right','total'].includes(data.unknown)) throw Error('わからない場所をえらんでください。');
    for(const k of ['title','unit','iconA','iconB','nameA','nameB']) if(typeof data[k]!=='string' || !data[k].trim() || data[k].length>80) throw Error('名前・絵・単位を入力してください（80文字まで）。');
    if(data.story!==undefined && (!Array.isArray(data.story) || data.story.length>3 || data.story.some(s=>typeof s!=='string' || s.length>500))) throw Error('お話は３行までにしてください。');
    if(data.continuous!==undefined && typeof data.continuous!=='boolean') throw Error('量の種類を確認してください。');
    for(const k of ['imageA','imageB']) if(data[k]!==undefined && (typeof data[k]!=='string'||data[k].length>1400000||!(/^(?:assets\/(?:white|red)-flower\.png|data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+)$/.test(data[k])))) throw Error('画像はPNG・JPEG・WebP・GIF（1MBまで）にしてください。');
    return {...data,total:data.left+data.right};
  }
  function model(data){
    const m=validate(data);
    m.typeName=typeNames[m.kind];
    m.names=m.kind==='increase'?{left:'はじめ',right:m.nameB,total:'ぜんぶ'}:m.kind==='decrease'?{left:m.nameA,right:'のこり',total:'はじめ'}:m.kind==='compare'?{left:m.nameA,right:'ちがい',total:m.nameB}:{left:m.nameA,right:m.nameB,total:'ぜんぶ'};
    m.start=m.kind==='decrease'||m.kind==='compare'?'total':'left';
    if(data.quantityNames){
      for(const role of ['left','right','total']){
        const name=data.quantityNames[role];
        if(typeof name!=='string'||!name.trim()||name.length>80)throw Error('量の名前を確認してください。');
      }
      m.names={...data.quantityNames};
    }
    m.display=(role,reveal=false)=>m.unknown===role&&!reveal?'□':String(m[role]);
    m.label=(role,reveal=false)=>`${m.names[role]} ${m.display(role,reveal)}${m.unit}`;
    m.equation=m.unknown==='total'?`${m.left} ＋ ${m.right} ＝ ${m.total}`:m.unknown==='left'?`${m.total} − ${m.right} ＝ ${m.left}`:`${m.total} − ${m.left} ＝ ${m.right}`;
    m.reason=m.unknown==='total'?'ぜんたいが わからないので、ぶぶんと ぶぶんを たします。':'ぶぶんが わからないので、ぜんたいから わかっている ぶぶんを ひきます。';
    const v=r=>m.display(r)==='□'?'何'+m.unit+'か':m[r]+m.unit;
    m.quantityName=r=>m.names[r]+(/[ただ]$/.test(m.names[r])?'':'の')+(m.continuous?'長さ':'数');
    const question=`${m.quantityName(m.unknown)}は 何${m.unit}でしょう。`;
    m.lines=m.story?.length?m.story:m.kind==='increase'?[`はじめに ${v('left')} ありました。`,`${m.quantityName('right')}は ${v('right')}。${m.unknown==='total'?'':`ぜんぶで ${m.total}${m.unit}に なりました。`}`,question]:m.kind==='decrease'?[`はじめに ${v('total')} ありました。`,`${m.quantityName('left')}は ${v('left')}。${m.unknown==='right'?'':`のこりは ${m.right}${m.unit}です。`}`,question]:m.kind==='compare'?[`${m.nameB}は ${v('total')}、${m.nameA}は ${v('left')}です。`,question]:[`${m.nameA}が ${v('left')}、${m.nameB}が ${v('right')} あります。`,question];
    // Preserve the relative size of the parts; keep tiny parts usable on a touch screen.
    m.ratio=Math.max(.18,Math.min(.82,m.left/m.total));
    return m;
  }
  function rangeArc(start,end,baseline,bend=-14){return `M ${start} ${baseline} Q ${(start+end)/2} ${baseline+2*bend} ${end} ${baseline}`;}
  // Labels sit on the curve, with a real white backing also preserved in SVG exports.
  function labeledArc(s,a,b,y,label,below=false){
    const ns='http://www.w3.org/2000/svg',g=document.createElementNS(ns,'g');g.setAttribute('class','arcLabel');
    g.dataset.a=a;g.dataset.b=b;g.dataset.y=y;g.dataset.below=below;
    for(const tag of ['path','rect','text'])g.append(document.createElementNS(ns,tag));
    g.children[0].setAttribute('class','brace');g.children[1].setAttribute('fill','white');
    g.children[2].textContent=label;g.children[2].setAttribute('text-anchor','middle');
    s.append(g);return g;
  }
  function layoutArcs(s){
    const shapes=[...s.querySelectorAll('rect.tapeA,rect.tapeB,rect.whole,rect.groupTape')];
    const segments=[...s.querySelectorAll('path.segmentA,path.segmentB,path.segmentShape')];
    const edges=[];
    if(!s.classList.contains('lineMode'))for(const r of shapes){const x=+r.getAttribute('x'),y=+r.getAttribute('y'),w=+r.getAttribute('width'),h=+r.getAttribute('height');edges.push({a:x,b:x+w,top:y,bottom:y+h});}
    if(!edges.length)for(const p of segments){const nums=p.getAttribute('d').match(/-?\d+(?:\.\d+)?/g)?.map(Number);if(nums?.length>=8)edges.push({a:nums[0],b:nums[6],top:nums[1],bottom:nums[2]});}
    for(const g of s.querySelectorAll('.arcLabel')){
      const a=+g.dataset.a,b=+g.dataset.b,y=+g.dataset.y,below=g.dataset.below==='true';
      const edge=x=>{const candidates=edges.filter(e=>x>=e.a-.1&&x<=e.b+.1);return candidates.length?candidates.map(e=>below?e.bottom:e.top).sort((u,v)=>Math.abs(u-y)-Math.abs(v-y))[0]:y;};
      const [p,r,t]=g.children;
      // A quadratic curve rises by half its control-point offset at the centre.
      // Leave room for the entire label backing plus a gap from the diagram.
      const labelHeight=t.getBBox().height;
      const ya=edge(a),yb=edge(b),bend=(below?1:-1)*Math.max(Number(g.dataset.bend)||64,labelHeight+26),cy=(ya+yb)/2+bend;
      p.setAttribute('d',`M ${a} ${ya} Q ${(a+b)/2} ${cy} ${b} ${yb}`);
      const midY=(ya+2*cy+yb)/4;t.setAttribute('x',(a+b)/2);t.setAttribute('y',midY);t.setAttribute('dominant-baseline','middle');
      const box=t.getBBox();r.setAttribute('x',box.x-7);r.setAttribute('y',box.y-3);r.setAttribute('width',box.width+14);r.setAttribute('height',box.height+6);
      const hit=g.parentElement.querySelector(':scope > .rangeHit,:scope > .groupHit');
      if(hit){const compact=hit.classList.contains('groupHit'),left=compact?box.x-9:Math.min(a,b,box.x-7),right=compact?box.x+box.width+9:Math.max(a,b,box.x+box.width+7),top=compact?box.y-8:Math.min(ya,yb,midY,box.y-3)-5,bottom=compact?box.y+box.height+8:Math.max(ya,yb,midY,box.y+box.height+3)+5;hit.setAttribute('x',left);hit.setAttribute('y',top);hit.setAttribute('width',right-left);hit.setAttribute('height',bottom-top);}
      const curve=g.parentElement.querySelector(':scope > .groupCurveHit');if(curve)curve.setAttribute('d',p.getAttribute('d'));
    }
  }
  const api={kinds,typeNames,steps,validate,model,rangeArc,labeledArc,layoutArcs};
  if(typeof module!=='undefined') module.exports=api;
  root.TapeLessonEngine=api;
})(typeof window!=='undefined'?window:globalThis);
