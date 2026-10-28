'use strict';
(() => {
  const $=id=>document.getElementById(id), places=window.TOWN_PLACES, byId=new Map(places.map(p=>[p.id,p]));
  const Model=window.TownModel, gridSize=()=>Model.sizeOf(state), boardExtent=()=>Model.extent(gridSize());
  const KEY='my-town-v1', arrows={N:'↑',E:'→',S:'↓',W:'←'}, rows={S:0,W:1,E:2,N:3};
  let state={version:1,title:'My Town',plots:Array(16).fill(null),start:null,goal:null};
  let previous=null,selected=null,stage='edit',route=null,index=0,busy=false,token=0,current=null,heading='E',speechFinish=null;
  let endpointMode=null;
  const plotButtons=[],paletteButtons=[];
  const image=id=>`assets/display-places/${id}.webp`;
  const mapImage=id=>`assets/${$('map-dialog').open?'map-places':'display-map-places'}/${id}.webp`;
  const entrance=i=>Model.entrance(gridSize(),i);
  const percent=n=>(14+64*n)/boardExtent()*100;
  const label=i=>Model.label(gridSize(),i);
  const name=i=>byId.get(state.plots[i])?.name||'';
  const canNavigate=i=>Boolean(byId.get(state.plots[i])?.canNavigate);
  const message=text=>{$('status').textContent=text;if(stage==='guide')$('endpoint-hint').textContent=text;};
  function validate(data){
    const size=data?.size===undefined?4:data.size;
    if(!Model.SIZES.includes(size))throw Error('地図のマス数を確認してください。');
    if(!data||data.version!==1||typeof data.title!=='string'||data.title.length>40||!Array.isArray(data.plots)||data.plots.length!==size*size||data.plots.some(p=>p!==null&&!byId.has(p)))throw Error('町ファイルの形式がちがいます。');
    for(const k of ['start','goal'])if(data[k]!==null&&(!Number.isInteger(data[k])||data[k]<0||data[k]>=size*size||!data.plots[data[k]]))throw Error('出発地・目的地のデータを確認してください。');
    if(data.start!==null&&data.start===data.goal)throw Error('出発地と目的地は別の場所にしてください。');
    return {...(size===4?{}:{size}),version:1,title:data.title,plots:[...data.plots],start:data.start!==null&&byId.get(data.plots[data.start]).canNavigate?data.start:null,goal:data.goal!==null&&byId.get(data.plots[data.goal]).canNavigate?data.goal:null};
  }
  function save(){
    try{localStorage.setItem(KEY,JSON.stringify(state));$('save-state').textContent='このブラウザーに自動保存しました。共有端末ではファイルでも保存しましょう。';}
    catch{$('save-state').textContent='この端末では自動保存できません。「町を保存（ファイル）」を使ってください。';}
  }
  function checkpoint(){previous=structuredClone(state);$('undo').disabled=false;}
  let englishVoice=null;
  function refreshVoice(){
    try{const voices=window.speechSynthesis?.getVoices()||[],english=voices.filter(v=>/^en(?:-|$)/i.test(v.lang)),us=v=>/^en-US$/i.test(v.lang);
      englishVoice=english.find(v=>v.localService&&us(v))||english.find(v=>v.localService)||english.find(us)||english[0]||null;
      return voices;
    }catch{return [];}
  }
  function cancelSpeech(){const finish=speechFinish;if(finish)finish();try{const synth=window.speechSynthesis;if(synth&&(finish||synth.speaking||synth.pending))synth.cancel();}catch{}}
  function stop(reset=true){token++;busy=false;cancelSpeech();$('character').getAnimations().forEach(a=>a.cancel());clearTurnCue();setFrame(heading,0);if(reset){index=0;$('directions').replaceChildren();$('map-instruction').textContent='出発地から案内しましょう。';$('map-translation').textContent='';if(route){setPosition(route.path[0]);setFrame(route.initial,0);}}controls();}
  function changed(){stop(false);route=null;index=0;$('directions').replaceChildren();$('route-path')?.remove();buildMap();renderMap();renderEndpoints();prepare();save();}
  function setStage(next){stop();stage=next;document.body.dataset.stage=next;setEndpointMode(null);$('placement-tools').hidden=next!=='edit';$('map-endpoints').hidden=next!=='guide';$('map-guide').hidden=next!=='guide';$('town-name').readOnly=next==='guide';$('position').textContent='';$('editor').hidden=next!=='edit';$('guide').hidden=next!=='guide';$('edit-tab').toggleAttribute('aria-current',next==='edit');$('route-tab').toggleAttribute('aria-current',next==='guide');if(next==='edit'){$('edit-tab').setAttribute('aria-current','step');$('character').hidden=true;message('絵を選んで、町の置きたい場所を押しましょう。');}else{$('route-tab').setAttribute('aria-current','step');prepare();message('出発地と目的地を選び、友達に道案内をしてみましょう。');}}
  function renderMap(){
    state.plots.forEach((id,i)=>{
      const b=plotButtons[i];b.replaceChildren();b.className='plot';
      if(id){const img=new Image();img.src=mapImage(id);img.dataset.placeId=id;img.alt='';img.draggable=false;const span=document.createElement('span');span.className='place-name';span.lang='en';span.textContent=byId.get(id).name;b.append(img,span);}else{const span=document.createElement('span');span.className='empty';span.textContent='＋';b.append(span);}
      const coordinate=document.createElement('span');coordinate.className='plot-coordinate';coordinate.textContent=label(i);b.append(coordinate);const dot=document.createElement('span');dot.className='entrance';b.append(dot);
      if(i===state.start||i===state.goal){const isStart=i===state.start;b.classList.add(isStart?'is-start':'is-goal');const badge=document.createElement('span');badge.className='plot-tag';badge.textContent=isStart?'S':'G';b.append(badge);}
      b.setAttribute('aria-label',`${label(i)} ${id?byId.get(id).name+'（'+byId.get(id).ja+'）':'空き地'}${i===state.start?' 出発地':''}${i===state.goal?' 目的地':''}`);
    });
    $('map-size').value=String(gridSize());$('map-title').textContent=state.title||'My Town';$('town-name').value=state.title;$('town-name').readOnly=stage==='guide';
    for(const k of ['start','goal']){const pin=$(k+'-pin');pin.hidden=state[k]===null;if(!pin.hidden){const p=entrance(state[k]);pin.style.left=percent(p.x)+'%';pin.style.top=percent(p.y)+'%';}}
  }
  function renderPalette(){
    const query=$('search').value.trim().toLowerCase(),cat=$('category').value;
    let count=0;paletteButtons.forEach((b,i)=>{const p=places[i];const visible=(query?`${p.name} ${p.ja} ${p.aliases.join(' ')}`.toLowerCase().includes(query):cat==='all'||p.category===cat);b.hidden=!visible;b.querySelector('.ja').hidden=!$('translations').checked;if(visible)count++;});
    $('no-results')?.remove();if(!count){const p=document.createElement('p');p.id='no-results';p.textContent='見つかりません。別のことばで探してみましょう。';$('palette').append(p);}
  }
  function choose(id){selected=id;renderPlacement();paletteButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===id)));$('erase').setAttribute('aria-pressed',String(id==='erase'));$('selection').textContent=id==='erase'?'消したい場所を押しましょう。':`${byId.get(id).name}（${byId.get(id).ja}）を置きます。町の場所を押しましょう。${byId.get(id).canNavigate?'':' この絵は町のことばを表し、出発地・目的地には使いません。'}`;}
  function renderPlacement(){
    const preview=$('placement-preview');preview.replaceChildren();$('go-to-map').disabled=!selected;$('enlarge-picture').disabled=!selected||selected==='erase';
    if(!selected){preview.textContent='まず、置きたい絵を選ぼう。';return;}
    if(selected==='erase'){preview.textContent='消すモード：消したい場所を押そう。';return;}
    const img=new Image();img.src=image(selected);img.alt='';const text=document.createElement('span');text.textContent=`${byId.get(selected).name}（${byId.get(selected).ja}）を置く`;preview.append(img,text);
  }
  function setEndpointMode(mode){
    endpointMode=mode;
    for(const k of ['start','goal'])$('pick-'+k).setAttribute('aria-pressed',String(mode===k));
    $('endpoint-hint').textContent=mode?`${mode==='start'?'S 出発地':'G 目的地'}にする建物を、地図で押そう。`:'下の選択欄からも選べます。';
  }
  function syncInstruction(){
    const active=$('directions').querySelector('li.active');
    $('inline-instruction').textContent=active?.querySelector('[lang=en]')?.textContent||(route?'まず友達に案内してみよう。':$('route-summary').textContent);
    $('inline-translation').textContent=active?.querySelector('.translation')?.textContent||'';
    $('guide-progress').textContent=route?(index===route.steps.length?'到着！ 役割を交代して、もう一度やってみよう。':index===0&&!busy?'「1つずつ見る」で、お手本を確かめよう。':`お手本 ${Math.min(index+(busy?1:0),route.steps.length)} / ${route.steps.length}`):'';
  }
  function jumpTo(id){const el=$(id);el.scrollIntoView({block:'start',behavior:'instant'});el.focus({preventScroll:true});}
  $('choose-picture').onclick=()=>jumpTo('search');
  $('go-to-map').onclick=()=>jumpTo('placement-tools');
  for(const k of ['start','goal'])$('pick-'+k).onclick=()=>setEndpointMode(endpointMode===k?null:k);
  function renderEndpoints(){
    for(const k of ['start','goal']){const sel=$(k),currentValue=state[k];sel.replaceChildren(new Option('選んでください',''));state.plots.forEach((id,i)=>{if(id&&canNavigate(i))sel.add(new Option(`${label(i)} · ${byId.get(id).name}（${byId.get(id).ja}）`,String(i)));});sel.value=currentValue===null?'':String(currentValue);}
  }
  const pathBetween=(a,b)=>Model.pathBetween(gridSize(),a,b);
  const plan=(a,b)=>Model.plan(state,a,b,byId);
  function prepare(){
    route=null;$('character').hidden=true;$('route-path')?.remove();$('position').textContent='';$('town-name').readOnly=stage==='guide';
    if(state.start===null||state.goal===null){$('route-summary').textContent=state.plots.filter((_,i)=>canNavigate(i)).length<2?'道案内する場所を2つ以上置きましょう（street・town以外）。':'S 出発地と G 目的地を選びましょう。';controls();return;}
    route=plan(state.start,state.goal);if(!route){$('route-summary').textContent='出発地と目的地は別の場所にしてください。';controls();return;}
    $('route-summary').textContent=`Excuse me, where is the ${name(state.goal)}? — ${label(state.start)} から ${label(state.goal)} へ。まず、自分のことばで案内してみよう。`;
    if(stage==='guide'){$('character').hidden=false;setPosition(route.path[0]);setFrame(route.initial,0);}
    controls();
  }
  function controls(){syncInstruction();const ready=Boolean(route);$('play').disabled=!ready||busy;$('next').disabled=!ready||busy||index>=route.steps.length;$('stop').disabled=!busy&&index===0;$('start').disabled=busy;$('goal').disabled=busy;$('restart').disabled=!ready;for(const k of ['start','goal'])$('pick-'+k).disabled=busy;$('next').textContent=index===0?'1つずつ見る':'次の案内';for(const b of document.querySelectorAll('[data-map-action]')){const action=b.dataset.mapAction;b.disabled=$(action).disabled;if(action==='next')b.textContent=$('next').textContent;}}
  const angles={N:0,E:90,S:180,W:270};
  let bearing=90;
  function scrollHost(){return $('map-dialog').open?$('large-map-scroll'):document.querySelector('.map-scroll');}
  function followCharacter(){
    if(stage!=='guide'||!current)return;
    const scroll=scrollHost(),board=$('board').getBoundingClientRect(),view=scroll.getBoundingClientRect(),x=board.left-view.left+scroll.scrollLeft+percent(current.x)/100*board.width,y=board.top-view.top+scroll.scrollTop+percent(current.y)/100*board.height;
    if(x<scroll.scrollLeft+50||x>scroll.scrollLeft+scroll.clientWidth-50)scroll.scrollLeft=Math.max(0,x-scroll.clientWidth/2);
    if($('map-dialog').open&&(y<scroll.scrollTop+80||y>scroll.scrollTop+scroll.clientHeight-50))scroll.scrollTop=Math.max(0,y-scroll.clientHeight/2);
  }
  function setPosition(p){current={...p};$('character').classList.toggle('top-edge',p.y===0);$('character').style.left=percent(p.x)+'%';$('character').style.top=percent(p.y)+'%';followCharacter();updatePosition();}
  function updatePosition(){$('position').textContent=stage==='guide'&&current?`今の向き：${arrows[heading]}　左右はキャラクターから見ます。`:'';}
  function setBearing(angle){bearing=angle;$('facing').style.transform=`translateX(-50%) rotate(${angle}deg)`;$('ground-needle').style.transform=`rotate(${angle}deg)`;$('character').dataset.bearing=String(angle);}
  function turnPose(angle){
    const n=((angle/45)%8+8)%8,lo=Math.floor(n),hi=(lo+1)%8,mix=n-lo;
    for(const [id,i,opacity] of [['turn-pose-a',lo,1-mix],['turn-pose-b',hi,mix]]){const el=$(id);el.style.backgroundPosition=`${i%4*100/3}% ${Math.floor(i/4)*100}%`;el.style.opacity=String(opacity);}
  }
  function setFrame(dir,frame){heading=dir;$('character').classList.remove('posing');$('sprite').style.backgroundPosition=`${frame*100/3}% ${rows[dir]*100/3}%`;setBearing(angles[dir]);updatePosition();}
  function clearTurnCue(){$('block-cue')?.remove();$('turn-cue')?.remove();$('turn-bubble').hidden=true;$('character').classList.remove('posing');}
  function showTurnCue(step){
    clearTurnCue();$('character').classList.add('posing');$('turn-bubble').textContent=step.text;$('turn-bubble').hidden=false;
    const ns='http://www.w3.org/2000/svg',group=document.createElementNS(ns,'g');group.id='turn-cue';group.setAttribute('transform',`translate(${14+64*current.x} ${14+64*current.y}) rotate(${angles[step.fromDir]})`);
    const path=document.createElementNS(ns,'path'),s=step.turnSign;path.setAttribute('d',`M 0 38 L 0 14 Q 0 0 ${s*14} 0 L ${s*38} 0`);path.setAttribute('class','turn-line');path.setAttribute('marker-end','url(#turn-tip)');group.append(path);$('route-hints').append(group);
  }
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function speak(text,t){
    if(!soundEnabled||!window.speechSynthesis||t!==token)return Promise.resolve();
    return new Promise(resolve=>{
      let done=false,timer,waiting;const finish=()=>{if(done)return;done=true;clearTimeout(timer);clearTimeout(waiting);if(speechFinish===finish)speechFinish=null;resolve();};speechFinish=finish;
      const timeout=()=>{if(done)return;finish();if(t===token){try{speechSynthesis.cancel();}catch{}$('speech-note').textContent='音声の応答を待たず、文字と動きで続けます。';}};
      try{
        const utterance=new SpeechSynthesisUtterance(text),voices=refreshVoice(),voice=englishVoice;
        if(!voice&&voices.length){$('speech-note').textContent='英語の音声が見つからないため、文字と動きで案内します。';finish();return;}
        utterance.lang=voice?.lang||'en-US';utterance.rate=.85;if(voice)utterance.voice=voice;
        const note=voice?(voice.localService?'端末内の英語音声を使います。':'通信を使う英語音声です。開始まで時間がかかる場合があります。'):'端末の英語音声を使います。';
        $('speech-note').textContent=note;
        waiting=setTimeout(()=>{if(!done&&t===token)$('speech-note').textContent='英語の音声を準備しています…';},800);
        utterance.onstart=()=>{if(done||t!==token)return;clearTimeout(waiting);clearTimeout(timer);$('speech-note').textContent=note;timer=setTimeout(timeout,Math.min(20000,3000+text.length*150));};
        utterance.onend=finish;utterance.onerror=()=>{if(done||t!==token)return;finish();$('speech-note').textContent='音声を再生できませんでした。文字と動きで案内します。';};
        timer=setTimeout(timeout,4000);speechSynthesis.speak(utterance);
      }catch{finish();$('speech-note').textContent='音声を使えないため、文字と動きで案内します。';}
    });
  }
  function showStep(step){$('directions').querySelectorAll('li').forEach(e=>e.classList.remove('active'));const li=document.createElement('li');li.className='active';const en=document.createElement('span');en.lang='en';en.textContent=step.text;const ja=document.createElement('span');ja.className='translation';ja.textContent=step.ja;li.append(en,ja);$('directions').append(li);$('map-instruction').textContent=step.text;$('map-translation').textContent=step.ja;syncInstruction();}
  function drawPath(){const svg=$('roads');$('route-path')?.remove();const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');line.id='route-path';line.classList.add('route-line');line.setAttribute('points',route.path.map(p=>`${14+64*p.x},${14+64*p.y}`).join(' '));svg.append(line);}
  function showBlockCue(step){
    if(!step.blocks)return;
    const ns='http://www.w3.org/2000/svg',group=document.createElementNS(ns,'g');group.id='block-cue';
    for(let i=0;i<step.nodes.length-1;i+=2){
      const end=Math.min(i+2,step.nodes.length-1),a=step.nodes[i],b=step.nodes[end],p={x:(a.x+b.x)/2,y:(a.y+b.y)/2},distance=end/2;
      const mark=document.createElementNS(ns,'g');mark.classList.add('block-marker');mark.dataset.block=String(distance);mark.setAttribute('transform',`translate(${14+64*p.x} ${14+64*p.y})`);
      const circle=document.createElementNS(ns,'circle');circle.setAttribute('r','13');const text=document.createElementNS(ns,'text');text.textContent=Number.isInteger(distance)?String(distance):`${Math.floor(distance)||''}½`;
      if(!Number.isInteger(distance)){
        // Keep the final half-block label clear of the character's feet.
        const horizontal=a.y===b.y,dx=horizontal?0:22,dy=horizontal?-22:0;
        const stem=document.createElementNS(ns,'line');stem.setAttribute('x2',String(-dx));stem.setAttribute('y2',String(-dy));stem.setAttribute('stroke','#176b67');stem.setAttribute('stroke-width','2');mark.append(stem);
        mark.setAttribute('transform',`translate(${14+64*p.x+dx} ${14+64*p.y+dy})`);text.style.fontSize='14px';
      }
      mark.append(circle,text);group.append(mark);
    }
    $('roads').append(group);
  }
  async function animate(step,t){
    const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:Number($('speed').value);
    if(step.type==='turn'){
      showTurnCue(step);
      const from=angles[step.fromDir],delta=((angles[step.dir]-from+540)%360)-180;
      const ms=duration?Math.max(750,Math.min(1200,duration+300)):0,start=performance.now();
      while(t===token){const p=ms?Math.min(1,(performance.now()-start)/ms):1,ease=p*p*(3-2*p),angle=from+delta*ease;setBearing(angle);turnPose(angle);if(p>=1)break;await delay(16);}
      if(t!==token)return;heading=step.dir;updatePosition();if(ms)await delay(180);return;
    }
    clearTurnCue();if(step.type!=='move')return;setFrame(step.dir,0);showBlockCue(step);
    for(const p of step.nodes.slice(1)){
      if(t!==token)return;const from={...current};
      if(duration){const start=performance.now();while(t===token){const elapsed=performance.now()-start,ratio=Math.min(1,elapsed/duration);$('character').style.left=percent(from.x+(p.x-from.x)*ratio)+'%';$('character').style.top=percent(from.y+(p.y-from.y)*ratio)+'%';setFrame(step.dir,Math.floor(elapsed/140)%4);if(ratio>=1)break;await delay(25);}}
      if(t!==token)return;setPosition(p);if(step.blocks){const completed=step.nodes.indexOf(p)/2;document.querySelectorAll('.block-marker').forEach(m=>m.classList.toggle('done',Number(m.dataset.block)<=completed));}
    }
    setFrame(step.dir,0);
  }
  async function run(all){
    if(busy||!route)return;
    if(all){stop();drawPath();}
    const steps=route.steps;const t=++token;busy=true;controls();
    try{do{if(t!==token)return;const step=steps[index];showStep(step);await Promise.all([speak(step.text,t),animate(step,t)]);if(t!==token)return;index++;if(all&&index<steps.length)await delay(Number($('speed').value)===0?0:450);}while(t===token&&all&&index<steps.length);
      if(t===token&&index===steps.length)message('目的地に着きました！ 役割を交代して、もう一度案内してみましょう。');
    }finally{if(t===token){busy=false;controls();}}
  }
  function replaceTown(next){checkpoint();state=validate(next);selected=null;renderPlacement();paletteButtons.forEach(b=>b.setAttribute('aria-pressed','false'));$('erase').setAttribute('aria-pressed','false');$('selection').textContent='まだ絵を選んでいません。';changed();message('町を入れ替えました。「1つ戻す」で元の町に戻せます。');}
  let pendingReplacement=null;
  function requestReplace(next,copy){stop();pendingReplacement=next;$('replace-title').textContent=copy?.title||'今の町を入れ替えますか？';$('replace-description').textContent=copy?.description||'今の町は「1つ戻す」で戻せます。残す場合は、先にファイルで保存してください。';$('replace-dialog').showModal();}
  $('replace-confirm').closest('form').addEventListener('submit',e=>{const next=pendingReplacement;pendingReplacement=null;if(e.submitter?.value==='ok'&&next)replaceTown(next);});
  $('replace-dialog').addEventListener('cancel',()=>{pendingReplacement=null;});
  let builtSize=0;
  function buildMap(){
    const size=gridSize(),extent=boardExtent();if(builtSize===size)return;builtSize=size;plotButtons.length=0;$('plots').replaceChildren();$('roads').replaceChildren();$('roads').setAttribute('viewBox',`0 0 ${extent} ${extent}`);$('route-hints').setAttribute('viewBox',`0 0 ${extent} ${extent}`);$('board').style.setProperty('--grid-size',size);$('board').style.setProperty('--map-min',`${size*100+28}px`);
    const ns='http://www.w3.org/2000/svg',defs=document.createElementNS(ns,'defs');defs.innerHTML='<marker id="turn-tip" markerWidth="3" markerHeight="3" refX="2.4" refY="1.5" orient="auto"><path d="M 0 0 L 3 1.5 L 0 3 Z" fill="#d16c0d"/></marker>';$('roads').append(defs);
    for(let y=0;y<=size*2;y+=2)for(const vertical of [false,true]){const line=document.createElementNS(ns,'line'),p=14+64*y,last=extent-14;line.setAttribute('x1',vertical?p:14);line.setAttribute('x2',vertical?p:last);line.setAttribute('y1',vertical?14:p);line.setAttribute('y2',vertical?last:p);line.classList.add('road');$('roads').append(line);const dash=line.cloneNode();dash.classList.remove('road');dash.classList.add('center-line');$('roads').append(dash);}
    for(let i=0;i<size*size;i++){const b=document.createElement('button');b.className='plot';b.style.left=(28+128*(i%size))/extent*100+'%';b.style.top=(28+128*Math.floor(i/size))/extent*100+'%';b.style.width=b.style.height=100/extent*100+'%';
b.addEventListener('click',()=>{
    if(stage!=='edit'){
      if(busy){message('場所を変えるときは、先に止めましょう。');return;}
      if(!endpointMode){message('「S 出発地を選ぶ」か「G 目的地を選ぶ」を押してから、建物を選ぼう。');return;}
      if(!canNavigate(i)){message('建物などの場所を選ぼう。空き地・street・townは選べません。');return;}
      const k=endpointMode;$(k).value=String(i);$(k).dispatchEvent(new Event('change'));return;
    }
    if(!selected){message('先に、置きたい絵を選びましょう。');return;}
    const id=selected==='erase'?null:selected;if(state.plots[i]===id)return;checkpoint();state.plots[i]=id;if(!id||!byId.get(id).canNavigate){if(state.start===i)state.start=null;if(state.goal===i)state.goal=null;}changed();message(id?`${label(i)} に ${byId.get(id).name} を置きました。`:`${label(i)} を空き地にしました。`);
  });$('plots').append(b);plotButtons.push(b);}
    updateLargeMap();
  }
  for(const p of places){const b=document.createElement('button');b.className='place-card';b.dataset.id=p.id;b.setAttribute('aria-pressed','false');const img=new Image();img.src=image(p.id);img.alt='';img.loading='lazy';img.draggable=false;const en=document.createElement('span');en.lang='en';en.textContent=p.name;const ja=document.createElement('span');ja.className='ja';ja.textContent=p.ja;b.append(img,en,ja);b.addEventListener('click',()=>{choose(p.id);cancelSpeech();speak(p.name,token);});$('palette').append(b);paletteButtons.push(b);}
  function refreshMapImages(){
    $('plots').querySelectorAll('img[data-place-id]').forEach(img=>{img.src=mapImage(img.dataset.placeId);});
  }
  $('enlarge-picture').onclick=()=>{
    if(!selected||selected==='erase')return;
    const p=byId.get(selected);$('picture-title').textContent=`${p.name}（${p.ja}）`;$('picture-original').src=`assets/map-places/${selected}.webp`;$('picture-original').alt=p.ja;$('picture-dialog').showModal();
  };
  $('close-picture').onclick=()=>$('picture-dialog').close();
  $('picture-dialog').addEventListener('close',()=>$('picture-original').removeAttribute('src'));
  function updateLargeMap(){
    if(!$('map-dialog').open)return;
    const scroll=$('large-map-scroll'),fit=Math.min(scroll.clientWidth-32,scroll.clientHeight-32),base=Math.max(gridSize()*100+28,fit);
    $('board').style.width=`${Math.round(base*Number($('map-zoom').value))}px`;
  }
  $('open-map').onclick=()=>{
    if(stage!=='guide')setStage('guide');
    $('map-dialog').showModal();refreshMapImages();$('large-endpoints').append($('map-endpoints'));$('large-map-scroll').append($('board'));updateLargeMap();followCharacter();controls();
  };
  $('close-map').onclick=()=>$('map-dialog').close();
  $('map-dialog').addEventListener('close',()=>{refreshMapImages();$('placement-tools').after($('map-endpoints'));document.querySelector('.map-scroll').append($('board'));$('board').style.width='';followCharacter();});
  $('map-zoom').onchange=()=>{updateLargeMap();followCharacter();};
  new ResizeObserver(()=>{const tile=$('board').clientWidth/boardExtent()*100;$('board').style.setProperty('--tile-px',`${tile}px`);scrollHost().style.setProperty('--actor-space',`${Math.ceil($('board').clientWidth/(gridSize()*2.2)+25)}px`);}).observe($('board'));
  new ResizeObserver(()=>updateLargeMap()).observe($('large-map-scroll'));
  document.querySelectorAll('[data-map-action]').forEach(b=>b.onclick=()=>$(b.dataset.mapAction).click());
  $('map-size').onchange=()=>{
    const old=gridSize(),size=Number($('map-size').value);if(size===old)return;
    const next=Model.resize(state,size),lost=state.plots.filter((id,i)=>id&&(Math.floor(i/old)>=size||i%old>=size)).length;
    if(lost){$('map-size').value=String(old);requestReplace(next,{title:`${size} × ${size} に小さくしますか？`,description:`外側の${lost}個の場所が地図から外れます。「1つ戻す」で戻せます。残す場合は、先にファイルで保存してください。`});}
    else{checkpoint();state=next;changed();message(`${size} × ${size} に変えました。置いた場所の行と列は保っています。`);}
  };
  $('edit-tab').onclick=()=>setStage('edit');$('route-tab').onclick=$('to-route').onclick=()=>setStage('guide');$('erase').onclick=()=>choose('erase');
  $('search').oninput=$('category').onchange=$('translations').onchange=renderPalette;
  $('town-name').addEventListener('change',()=>{checkpoint();state.title=$('town-name').value;save();});
  for(const k of ['start','goal'])$(k).onchange=()=>{const n=$(k).value===''?null:Number($(k).value),other=k==='start'?'goal':'start';if(n!==null&&n===state[other]){$(k).value=state[k]===null?'':String(state[k]);message('出発地と目的地は別の場所を選びましょう。');return;}checkpoint();state[k]=n;changed();setEndpointMode(k==='start'&&state.goal===null?'goal':null);message(n===null?'場所の選択を外しました。':`${k==='start'?'出発地':'目的地'}は ${label(n)} ${name(n)} です。${endpointMode==='goal'?'次は目的地の建物を押そう。':route?'まず友達に案内してから、お手本を見よう。':'もう一方の場所も選ぼう。'}`);};
  $('play').onclick=()=>run(true);$('next').onclick=()=>run(false);$('stop').onclick=()=>{stop();message('止めて出発地へ戻りました。もう一度始められます。');};$('restart').onclick=()=>{stop();message('出発地へ戻りました。同じ道をもう一度案内しましょう。');};
  let soundEnabled=true;
  function renderSound(){
    document.querySelectorAll('[data-sound-toggle]').forEach(button=>{
      button.setAttribute('aria-pressed',String(soundEnabled));
      button.querySelector('[data-sound-icon]').textContent=soundEnabled?'🔊':'🔇';
      button.querySelector('[data-sound-state]').textContent=soundEnabled?'ON':'OFF';
      button.querySelector('[data-sound-action]').textContent=soundEnabled?'押すとオフ':'押すとオン';
    });
  }
  document.querySelectorAll('[data-sound-toggle]').forEach(button=>button.onclick=()=>{
    soundEnabled=!soundEnabled;cancelSpeech();if(soundEnabled)refreshVoice();renderSound();
    $('speech-note').textContent=soundEnabled?'英語の音声を使います。端末により声は異なります。':'音声を使わず、文字と動きで案内します。';
  });
  $('undo').onclick=()=>{if(!previous)return;stop();state=previous;previous=null;$('undo').disabled=true;changed();message('1つ前の町に戻しました。');};
  $('clear').onclick=()=>requestReplace({...state,title:'My Town',plots:Array(gridSize()*gridSize()).fill(null),start:null,goal:null});
  $('sample').onclick=()=>requestReplace(Model.resize({version:1,title:'Our Town',plots:['elementary-school','park',null,'library',null,'post-office','hospital',null,'house',null,'supermarket',null,'station','restaurant',null,'zoo'],start:0,goal:15},gridSize()));
  $('export').onclick=()=>{state.title=$('town-name').value;save();const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='my-town.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('町のファイルを保存しました。ダウンロード先を確認してください。');};
  $('import').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{if(file.size>100000)throw Error('ファイルが大きすぎます。My Townで保存したファイルを選んでください。');const next=validate(JSON.parse(await file.text()));requestReplace(next);}catch(err){message(err instanceof SyntaxError?'町のファイルを読み取れませんでした。JSONファイルを確認してください。':err.message);}};
  let loadError=false;try{const raw=localStorage.getItem(KEY);if(raw)state=validate(JSON.parse(raw));}catch{loadError=true;}
  buildMap();renderMap();renderEndpoints();renderPalette();prepare();
  if(loadError)message('保存データを読み込めませんでした。ファイルで保存した町は「町を開く」で戻せます。');
  if(!window.speechSynthesis){soundEnabled=false;renderSound();document.querySelectorAll('[data-sound-toggle]').forEach(button=>{button.disabled=true;button.querySelector('[data-sound-action]').textContent='この端末では使えません';});$('speech-note').textContent='このブラウザーでは音声を使えません。文字と動きで案内できます。';}
  else{refreshVoice();speechSynthesis.addEventListener?.('voiceschanged',refreshVoice);}
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&busy){stop();message('画面を離れたので、出発地へ戻りました。');}});
  window.MyTown={snapshot:()=>({state:structuredClone(state),stage,busy,index,current,heading,bearing,mapSize:gridSize(),route:structuredClone(route)}),pathBetween};
})();
