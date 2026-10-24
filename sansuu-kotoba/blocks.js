'use strict';
(() => {
  const end=20100,actionStart=6200,actionEnd=16000,countStart=16600,countEnd=19600;
  // Quick travel with a readable settle at either end. Keep the shared progress
  // for the glove, its contents and the rope so they stay in contact.
  const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{const t=clamp(x);return t<.5?8*t**4:1-(-2*t+2)**4/2;},mix=(a,b,t)=>a+(b-a)*t;
  // Preserve all teaching/step landmarks, but spend less real time travelling.
  // Counting and the pause before it remain slower than the hand action.
  const playbackRate=(time,key)=>time<actionStart?1.8:time<actionEnd?(key==='divide'?2:4):time<countStart?1.8:1.5;
  const answer=(key,s)=>key==='add'?s.a+s.b:key==='subtract'?s.a-s.b:key==='multiply'?s.a*s.b:s.a/s.b;
  const countTimes=(key,s)=>Array.from({length:answer(key,s)},(_,i)=>countStart+(i+1)*(countEnd-countStart)/answer(key,s));
  function count(key,s,time){return countTimes(key,s).filter(t=>time>=t-.01).length;}
  const at=p=>actionStart+p*(actionEnd-actionStart);
  function handCues(key,s){
    if(key==='subtract')return [{at:at(.30),text:`${s.b}こを ロープで まとめたよ。ロープを にぎって 引こう。`}];
    if(key==='add')return [{at:at(.18),text:`手のひらで ${s.b}こを おして、${s.a}こに 合わせよう。`}];
    if(key==='multiply')return [{at:at(.32),text:`${s.a}こを 手の中に にぎったよ。`},{at:at(.60),text:`手を ひらくと、${s.a}こずつ ${s.b}つ分！`}];
    const size=s.b,rounds=s.a/size,result=[];
    for(let g=0;g<rounds;g++)result.push(
      {at:at((g+.30)/rounds),text:`${size}こを にぎったよ。1こずつ 分けよう。`},
      {at:at((g+.45)/rounds),text:'左の はこに 1こ。'},
      {at:at((g+.70)/rounds),text:'右の はこに 1こ。'},
      {at:at((g+.80)/rounds),text:`1こずつ おいたよ。のこりは ${s.a-(g+1)*size}こ。`}
    );
    return result;
  }
  function inverseEase(value){let lo=0,hi=1;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(ease(mid)<value)lo=mid;else hi=mid;}return (lo+hi)/2;}
  function poseTimes(key,s){
    const result=[];
    for(let i=1;i<=7;i++){
      const q=inverseEase(i/7);
      if(key==='multiply')result.push(at(.18+.14*q),at(.50+.10*q));
      else if(key==='divide')for(let g=0;g<s.a/s.b;g++)result.push(...[.16+.14*q,.45+.10*q,.55+.05*q,.70+.10*q].map(v=>at((g+v)/(s.a/s.b))));
      else result.push(at(key==='subtract'?.36+.54*i/7:.18+.70*i/7));
    }
    return result.map(t=>Math.round(t*1000)/1000);
  }
  function steps(key,s){return [...new Set([0,650,1300,1950,2800,3800,4800,5600,actionStart,...poseTimes(key,s),...handCues(key,s).map(c=>c.at),actionEnd,countStart,...countTimes(key,s),end])].sort((a,b)=>a-b);}
  function cues(key,s){return [2200,3950,5600,actionStart,...handCues(key,s).map(c=>c.at),countStart,...countTimes(key,s),end].sort((a,b)=>a-b);}
  const resultWords={add:'あわせた数',subtract:'のこった数',multiply:'ぜんぶの数',divide:'1つ分の数'};
  function intro(key,s){return key==='add'?`${s.a}こと ${s.b}こを あわせよう。`:key==='subtract'?`${s.a}このうち、${s.b}こを 引こう。`:key==='multiply'?`${s.a}こずつ、${s.b}つ分に しよう。`:`${s.a}こを、${s.b}つに 同じ数ずつ 分けよう。`;}
  function cue(key,s,time){
    if(time===2200)return '人と 同じばしょに、ブロックが かさなるよ。';
    if(time===3950)return '人から 数へ。ブロックで 数のうごきを 見よう。';
    if(time===5600)return intro(key,s)+(key==='multiply'?`右の ${s.b}は、${s.b}つ分のことだよ。`:key==='divide'?`右の ${s.b}は、分けるばしょの数だよ。`:'');
    if(time===actionStart)return key==='subtract'?`${s.b}こに ロープをかけて 引き出そう。`:key==='multiply'?`${s.a}こを 手のひらに あつめよう。`:key==='divide'?`${s.b}こずつ、${s.a/s.b}回 とって、左と 右の はこに、1こずつ 入れよう。`:intro(key,s);
    const hand=handCues(key,s).find(c=>c.at===time);if(hand)return hand.text;
    if(time===countStart)return key==='divide'?'1つ分の ブロックを、1こずつ かぞえよう。':`${resultWords[key]}を、1こずつ かぞえよう。`;
    if(time===end&&key==='divide')return `${s.b}こずつ ${s.a/s.b}回 とったね。${s.b}つの はこには、${s.a/s.b}こずつ。${s.a} わる ${s.b}は ${s.a/s.b}。`;
    if(time===end)return `${s.a} ${s.op} ${s.b} は ${answer(key,s)}。${resultWords[key]}は、${answer(key,s)}こだね。`;
    return String(count(key,s,time));
  }
  function caption(key,s,time){
    if(time<5600)return '人から ブロックへ。同じ数を あらわすよ。';
    if(time<actionStart)return intro(key,s);
    if(time<countStart){
      const p=clamp((time-actionStart)/(actionEnd-actionStart));
      if(key==='subtract')return p<.30?`${s.b}こを ロープで まとめるよ。`:`ロープを 引いて ${s.b}こを うごかすよ。`;
      if(key==='add')return `${s.b}こを 手のひらで おして、${s.a}こに あわせるよ。`;
      if(key==='multiply')return p<.32?`${s.a}こを 手のひらに あつめるよ。`:p<.60?`手の中に ${s.a}こ。にぎって、ひらくよ。`:`ひらくと ${s.a}こずつ ${s.b}つ分！`;
      const size=s.b,rounds=s.a/size,cycle=Math.min(rounds-1,Math.floor(p*rounds)),local=p>=1?1:p*rounds-cycle;
      return local<.30?`のこり ${s.a-cycle*size}こから、${size}こを あつめるよ。`:local<.45?`${size}こを にぎって、左の はこへ。`:local<.55?'手を ひらいて、左に 1こ。':local<.70?'手の中の あと 1こを、右の はこへ。':local<.80?'手を ひらいて、右にも 1こ。':`1こずつ おけたね。のこり ${s.a-(cycle+1)*size}こ。`;
    }
    if(time<end)return `${key==='divide'?'1つ分を':'ブロックを'} かぞえる：${count(key,s,time)}こ`;
    return `${s.a} ${s.op} ${s.b} ＝ ${answer(key,s)}。${resultWords[key]}は ${answer(key,s)}こ。`;
  }
  const text=(x,y,value,cls='')=>`<text x="${x}" y="${y}" text-anchor="middle" class="${cls}">${value}</text>`;
  const gloveDir='sansuu-kotoba/assets/gloves/';
  for(const file of ['push.webp','rope-grip-v2.webp',...Array.from({length:8},(_,i)=>`close-${i}.webp`)]){const image=new Image();image.src=`${gloveDir}${file}?v=2`;}
  const rigs=window.LessonGloveRig,ropeRig=rigs.rope;
  const ropeAngle=Math.atan2(ropeRig.tangent.y,ropeRig.tangent.x)*180/Math.PI;
  function geometry(hand){
    const animation=hand.closure!==undefined,rig=hand.pose==='rope'?ropeRig:animation?rigs.close:rigs.push;
    const scale=(hand.size||260)/rig.width,angle=(hand.angle||0)*Math.PI/180,flip=hand.pose==='rope'?-1:1;
    const a=flip*scale*Math.cos(angle),b=flip*scale*Math.sin(angle),c=-scale*Math.sin(angle),d=scale*Math.cos(angle),e=hand.x-a*rig.grip.x-c*rig.grip.y,f=hand.y-b*rig.grip.x-d*rig.grip.y;
    const point=p=>({x:a*p.x+c*p.y+e,y:b*p.x+d*p.y+f});
    return {rig,matrix:[a,b,c,d,e,f],entry:rig.ends?point(rig.ends[0]):null,exit:rig.ends?point(rig.ends[1]):null,contact:point(rig.contact||rig.grip)};
  }
  function touching(hand,point){const offset=geometry({...hand,x:0,y:0}).contact;return {...hand,x:point.x-offset.x,y:point.y-offset.y};}
  function gloveImage(hand){
    if(!hand||hand.opacity<=0)return '';
    const g=geometry(hand),frame=hand.closure===undefined?null:Math.round(clamp(hand.closure)*7),pose=frame===null?hand.pose:frame===7?'grip':frame===0?'open':'cup',file=hand.pose==='rope'?'rope-grip-v2.webp':frame===null?'push.webp':`close-${frame}.webp`;
    return `<g data-glove="single" data-pose="${pose}" data-frame="${frame??''}" data-grip-x="${hand.x}" data-grip-y="${hand.y}" data-contact-x="${g.contact.x}" data-contact-y="${g.contact.y}" ${g.entry?`data-rope-entry-x="${g.entry.x}" data-rope-entry-y="${g.entry.y}" data-rope-exit-x="${g.exit.x}" data-rope-exit-y="${g.exit.y}"`:''} opacity="${hand.opacity}" class="glove-sprite" transform="matrix(${g.matrix.join(' ')})"><image href="${gloveDir}${file}?v=2" preserveAspectRatio="none" width="${g.rig.width}" height="${g.rig.height}"/></g>`;
  }
  function sync(target,markup){
    const next=document.createElementNS('http://www.w3.org/2000/svg','g');next.innerHTML=markup;
    function update(parent,source){
      const incoming=[...source.childNodes];
      for(let i=0;i<incoming.length;i++){
        const value=incoming[i];let old=parent.childNodes[i];
        if(!old||old.nodeType!==value.nodeType||old.nodeName!==value.nodeName){const copy=value.cloneNode(true);if(old)parent.replaceChild(copy,old);else parent.appendChild(copy);continue;}
        if(value.nodeType===3){if(old.nodeValue!==value.nodeValue)old.nodeValue=value.nodeValue;continue;}
        if(value.nodeType!==1)continue;
        for(const attr of [...old.attributes])if(!value.hasAttribute(attr.name))old.removeAttribute(attr.name);
        for(const attr of [...value.attributes])if(old.getAttribute(attr.name)!==attr.value)old.setAttribute(attr.name,attr.value);
        update(old,value);
      }
      while(parent.childNodes.length>incoming.length)parent.lastChild.remove();
    }
    update(target,next);
  }
  function render(key,s,time){
    const svg=document.getElementById('block-stage'),p=Math.round(clamp((time-actionStart)/(actionEnd-actionStart))*1e8)/1e8,n=count(key,s,time),done=time>=end,units=[],shape=[];
    let hand=null;
    const unit=(id,x,y,color,group=0,included=true,opacity=1,location='source')=>{units.push({id,x,y,color,group,included,opacity,location});};
    const tray=(x,y,w,h,label)=>shape.push(`<rect class="block-tray" x="${x}" y="${y}" width="${w}" height="${h}" rx="22"/>`+text(x+w/2,y+h+36,label));
    if(key==='subtract'){
      const move=ease((p-.36)/.54),removed=s.b,first=s.a-removed,pull=330*move;
      tray(545,330,245,200,p>=1?`引いた ${removed}こ`:`引く ${removed}こ`);
      for(let i=0;i<s.a;i++){const moving=i>=first,dx=moving?pull:0;unit(i,190+(i%4)*70+dx,330+Math.floor(i/4)*70,'receiver',moving?1:0,!moving,1,moving&&move>0?'pulled':'source');}
      const ropeX=190+(first%4)*70-16+pull,ropeY=330+Math.floor(first/4)*70-16,width=(removed-1)*70+82,right=ropeX+width,knotY=ropeY+44;
      if(time>=actionStart){
        const wrap=clamp((p-.06)/.22),template={pose:'rope',x:0,y:0,size:170,angle:ropeAngle,opacity:1},span=-geometry(template).entry.x,lead=90+10*ease((p-.28)/.08),gripX=right+lead+span;
        const gripY=knotY-geometry(template).entry.y;
        hand={...template,x:p<.28?mix(850,right+90+span,ease(p/.28)):gripX,y:p<.28?mix(340,gripY,ease(p/.28)):gripY,opacity:1-clamp((p-.94)/.06)};
        const entry=geometry(hand).entry,sag=60*(1-ease(p/.36)),path=`M ${right} ${knotY} Q ${(right+entry.x)/2} ${(knotY+entry.y)/2+sag} ${entry.x} ${entry.y}`;
        shape.push(`<g class="block-rope"><rect data-rope-loop="true" x="${ropeX}" y="${ropeY}" width="${width}" height="88" rx="20" pathLength="1" stroke="#805a2d" stroke-width="18" stroke-dasharray="1" stroke-dashoffset="${1-wrap}"/><rect x="${ropeX}" y="${ropeY}" width="${width}" height="88" rx="20" pathLength="1" stroke="#c69a58" stroke-width="12" stroke-dasharray="1" stroke-dashoffset="${1-wrap}"/><path data-rope-link="true" data-start-x="${right}" data-start-y="${knotY}" data-end-x="${entry.x}" data-end-y="${entry.y}" d="${path}" stroke="#805a2d" stroke-width="18"/><path d="${path}" stroke="#c69a58" stroke-width="13"/><circle cx="${right}" cy="${knotY}" r="9" fill="#c69a58" stroke="#805a2d" stroke-width="2"/></g>`);
      }
      shape.push(text(310,285,`${s.a}こから ${s.b}こ 引く`));
    }else if(key==='add'){
      const move=ease((p-.18)/.70);
      const face=900-410*move,incoming=[];
      for(let j=s.b-1;j>=0;j--)incoming[j]=Math.min(730+j*60,j===s.b-1?face-50:incoming[j+1]-50);
      for(let i=0;i<s.a+s.b;i++){
        const right=i>=s.a,j=right?i-s.a:i,x=right?incoming[j]:220+(j%2)*70,y=right?400:330+Math.floor(j/2)*70;
        unit(i,x,y,right?'actor':'receiver',right?1:0,true,1,right&&move>=1?'box':'source');
      }
      if(time<actionStart)shape.push(text(300,280,`${s.a}こ`),text(800,280,`${s.b}こ`));
      else shape.push(text(500,280,done?`あわせて ${s.a+s.b}こ`:`${s.a}こと ${s.b}こを あわせる`));
      if(time>=actionStart){const exit=ease((p-.88)/.12),contactX=p<.18?mix(920,900,ease(p/.18)):mix(face,850,exit);hand=touching({pose:'push',size:170,opacity:1-exit},{x:contactX,y:mix(425,520,exit)});}
    }else if(key==='multiply'){
      for(let g=0;g<s.b;g++){
        const gx=220+g*280,fly=ease((p-.60)/.32),palmX=mix(300,500,ease((p-.32)/.20));
        if(time>=actionStart)tray(gx-100,300,200,200,p>=.92?`${s.a}こ`:'これから');
        for(let i=0;i<s.a;i++){
          const initialX=230+(i%2)*70,initialY=340+Math.floor(i/2)*70,targetX=gx-60+(i%2)*70;
          const packedX=palmX-55+(i%2)*60,packedY=335+Math.floor(i/2)*60,gather=ease((p-.18)/.14);
          const x=p<.32?mix(initialX,packedX,gather):p<.60?packedX:mix(445+(i%2)*60,targetX,fly),y=p<.32?mix(initialY,packedY,gather):p<.60?packedY:mix(packedY,initialY,fly);
          const opacity=g===0?(p<.32||p>=.54?1:0):clamp((p-.60)/.06),location=g>0&&p<.66?'future':p<.32?'source':p<.60?'hand':'box';
          unit(g*s.a+i,x,y,'receiver',g,true,opacity,location);
        }
      }
      shape.push(text(300,255,`${s.a}こずつ`),text(800,255,done?`${s.b}つ分`:`${s.b}つ分にする`));
      if(time>=actionStart){const exit=ease((p-.92)/.08),palmX=mix(300,500,ease((p-.32)/.20)),closure=p<.32?ease((p-.18)/.14):1-ease((p-.50)/.10);hand={pose:'animated',closure,x:p<.18?mix(850,300,ease(p/.18)):mix(palmX,860,exit),y:mix(390,520,exit),size:280,opacity:1-exit};if(p>=.32&&p<.60)shape.push(text(500,285,`手の中に ${s.a}こ`));}
    }else{
      for(let g=0;g<s.b;g++)tray(210+g*440,390,260,160,done?`1つ分 ${s.a/s.b}こ`:`${g+1}つ目の ばしょ`);
      const batch=s.b,rounds=s.a/batch,cycle=Math.min(rounds-1,Math.floor(p*rounds)),local=p>=1?1:Math.round((p*rounds-cycle)*1e8)/1e8;
      const sourceX=247.5+cycle*130,row=Math.floor(cycle/2),column=cycle%2,targetY=470+row*65,leftX=300+column*65,rightX=740+column*65,back=ease((local-.80)/.20);
      let hx=sourceX,hy=355;
      if(local<.16&&cycle===0){hx=mix(850,sourceX,ease(local/.16));hy=mix(480,355,ease(local/.16));}
      else if(local>=.30&&local<.55){const t=ease((local-.30)/.15);hx=mix(sourceX,leftX,t);hy=mix(355,targetY,t);}
      else if(local>=.55&&local<.80){hx=mix(leftX,rightX,ease((local-.55)/.15));hy=targetY;}
      else if(local>=.80){hx=mix(rightX,cycle===rounds-1?850:sourceX+130,back);hy=mix(targetY,cycle===rounds-1?560:355,back);}
      for(let i=0;i<s.a;i++){
        const trip=Math.floor(i/batch),group=i%batch,sx=190+trip*130+group*65,sy=300,tx=245+group*440+(trip%2)*65,ty=415+Math.floor(trip/2)*65,dropStart=group===0?.50:.75,dropEnd=group===0?.55:.80;
        let x=sx,y=sy,location='source',opacity=1;
        if(trip<cycle||trip===cycle&&local>=dropEnd){x=tx;y=ty;location='box';}
        else if(trip===cycle&&local>=.16){
          const px=hx-55+group*60,py=hy-55,gather=ease((local-.16)/.14),drop=ease((local-dropStart)/.05);
          x=local<.30?mix(sx,px,gather):mix(px,tx,drop);y=local<.30?mix(sy,py,gather):mix(py,ty,drop);
          if(local>=.30){location='hand';opacity=local<.45||local>=.60&&local<.70?0:1;}
        }
        unit(i,x,y,'receiver',group,group===0,opacity,location);
      }
      if(time>=actionStart){const closure=local<.30?ease((local-.16)/.14):local<.55?1-ease((local-.45)/.10):local<.70?ease((local-.55)/.05):1-ease((local-.70)/.10);hand={pose:'animated',closure,x:hx,y:hy,size:260,opacity:cycle===rounds-1?1-back:1};if(local>=.30&&local<.80)shape.push(text(500,280,`手の中に ${local<.55?2:1}こ`));}
      shape.push(text(500,200,`${s.a}こから ${batch}こずつ ${rounds}回 とる`),text(500,240,'左に 1こ、右に 1こ'));

    }
    let countIndex=0;
    const blocks=units.map(u=>{
      const eligible=u.included&&u.opacity>=1,index=eligible?++countIndex:0,marked=time>=countStart&&index>0&&index<=n,active=marked&&index===n;
      const material=marked?'counted':u.color;
      return `<g data-block="${u.id}" data-group="${u.group}" data-location="${u.location}" data-included="${u.included}" data-counted="${marked}" opacity="${u.opacity}" transform="translate(${u.x} ${u.y})"><ellipse class="tile-shadow" cx="26" cy="57" rx="25" ry="4"/><rect class="tile-side ${material}" x="0" y="6" width="50" height="50" rx="9"/><rect class="number-block ${u.color}${marked?' counted':''}${active?' counting':''}" fill="url(#tile-${material})" width="50" height="50" rx="9"/><rect class="tile-rim" x="2.5" y="2.5" width="45" height="45" rx="7"/><path class="tile-shine" d="M 10 8 Q 25 3 40 8"/>${marked?text(25,34,String(index),'block-count'):''}</g>`;
    }).join('');
    const glove=time<actionEnd?gloveImage(hand):'';
    if(!svg.querySelector('[data-layer="shapes"]'))svg.innerHTML=`<defs><linearGradient id="tile-receiver" x2="0" y2="1"><stop stop-color="#ffe99e"/><stop offset=".5" stop-color="#fbd270"/><stop offset="1" stop-color="#edb63f"/></linearGradient><linearGradient id="tile-actor" x2="0" y2="1"><stop stop-color="#cfefde"/><stop offset="1" stop-color="#83c1a1"/></linearGradient><linearGradient id="tile-counted" x2="0" y2="1"><stop stop-color="#fff4b5"/><stop offset="1" stop-color="#ffd057"/></linearGradient></defs><g data-layer="shapes"/><g data-layer="back-blocks"/><g data-layer="glove"/><g data-layer="front-blocks"/><g data-layer="formula"/>`;
    const front=hand&&(hand.pose==='rope'||(hand.closure??0)>.45);
    sync(svg.querySelector('[data-layer="shapes"]'),shape.join(''));
    sync(svg.querySelector('[data-layer="back-blocks"]'),front?blocks:'');
    sync(svg.querySelector('[data-layer="glove"]'),glove);
    sync(svg.querySelector('[data-layer="front-blocks"]'),front?'':blocks);
    sync(svg.querySelector('[data-layer="formula"]'),text(500,650,`${s.a} ${s.op} ${s.b} ＝ ${done?answer(key,s):'？'}`,'block-formula'));
    svg.dataset.operation=key;svg.dataset.answer=done?String(answer(key,s)):'';svg.dataset.count=String(n);svg.dataset.phase=time<countStart?'action':done?'answer':'count';
    svg.dataset.sourceCount=String(units.filter(u=>u.location==='source').length);svg.dataset.heldCount=String(units.filter(u=>u.location==='hand').length);svg.dataset.placedCount=String(units.filter(u=>u.location==='box').length);
    return {caption:caption(key,s,time),description:caption(key,s,time)};
  }
  window.LessonBlocks={end,steps,cues,render,cue,caption,count,answer,geometry,playbackRate};
})();
