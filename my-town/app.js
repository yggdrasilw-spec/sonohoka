'use strict';
(() => {
  const $=id=>document.getElementById(id), places=window.TOWN_PLACES, byId=new Map(places.map(p=>[p.id,p]));
  const KEY='my-town-v1', arrows={N:'↑',E:'→',S:'↓',W:'←'}, rows={S:0,W:1,E:2,N:3};
  let state={version:1,title:'My Town',plots:Array(16).fill(null),start:null,goal:null};
  let previous=null,selected=null,stage='edit',route=null,index=0,busy=false,token=0,current=null,heading='E',speechFinish=null;
  const plotButtons=[],paletteButtons=[];
  const image=id=>`assets/places/${id}.webp`;
  const entrance=i=>({x:(i%4)*2+1,y:Math.floor(i/4)*2});
  const percent=n=>(14+64*n)/540*100;
  const label=i=>`${String.fromCharCode(65+Math.floor(i/4))}${i%4+1}`;
  const name=i=>byId.get(state.plots[i])?.name||'';
  const canNavigate=i=>Boolean(byId.get(state.plots[i])?.canNavigate);
  const message=text=>{$('status').textContent=text;};
  function validate(data){
    if(!data||data.version!==1||typeof data.title!=='string'||data.title.length>40||!Array.isArray(data.plots)||data.plots.length!==16||data.plots.some(p=>p!==null&&!byId.has(p)))throw Error('町ファイルの形式がちがいます。');
    for(const k of ['start','goal'])if(data[k]!==null&&(!Number.isInteger(data[k])||data[k]<0||data[k]>15||!data.plots[data[k]]))throw Error('出発地・目的地のデータを確認してください。');
    if(data.start!==null&&data.start===data.goal)throw Error('出発地と目的地は別の場所にしてください。');
    return {version:1,title:data.title,plots:[...data.plots],start:data.start!==null&&byId.get(data.plots[data.start]).canNavigate?data.start:null,goal:data.goal!==null&&byId.get(data.plots[data.goal]).canNavigate?data.goal:null};
  }
  function save(){
    try{localStorage.setItem(KEY,JSON.stringify(state));$('save-state').textContent='このブラウザーに自動保存しました。共有端末ではファイルでも保存しましょう。';}
    catch{$('save-state').textContent='この端末では自動保存できません。「町を保存（ファイル）」を使ってください。';}
  }
  function checkpoint(){previous=structuredClone(state);$('undo').disabled=false;}
  function cancelSpeech(){try{window.speechSynthesis?.cancel();}catch{}if(speechFinish)speechFinish();}
  function stop(reset=true){token++;busy=false;cancelSpeech();$('character').getAnimations().forEach(a=>a.cancel());setFrame(heading,0);if(reset){index=0;$('directions').replaceChildren();if(route){setPosition(route.path[0]);setFrame(route.initial,0);}}controls();}
  function changed(){stop(false);route=null;index=0;$('directions').replaceChildren();$('route-path')?.remove();renderMap();renderEndpoints();prepare();save();}
  function setStage(next){stop();stage=next;$('town-name').readOnly=next==='guide';$('position').textContent='';$('editor').hidden=next!=='edit';$('guide').hidden=next!=='guide';$('edit-tab').toggleAttribute('aria-current',next==='edit');$('route-tab').toggleAttribute('aria-current',next==='guide');if(next==='edit'){$('edit-tab').setAttribute('aria-current','step');$('character').hidden=true;message('絵を選んで、町の置きたい場所を押しましょう。');}else{$('route-tab').setAttribute('aria-current','step');prepare();message('出発地と目的地を選び、友達に道案内をしてみましょう。');}}
  function renderMap(){
    state.plots.forEach((id,i)=>{
      const b=plotButtons[i];b.replaceChildren();b.className='plot';
      if(id){const img=new Image();img.src=image(id);img.alt='';img.draggable=false;const span=document.createElement('span');span.className='place-name';span.lang='en';span.textContent=byId.get(id).name;b.append(img,span);}else{const span=document.createElement('span');span.className='empty';span.textContent='＋';b.append(span);}
      const coordinate=document.createElement('span');coordinate.className='plot-coordinate';coordinate.textContent=label(i);b.append(coordinate);const dot=document.createElement('span');dot.className='entrance';b.append(dot);
      if(i===state.start||i===state.goal){const isStart=i===state.start;b.classList.add(isStart?'is-start':'is-goal');const badge=document.createElement('span');badge.className='plot-tag';badge.textContent=isStart?'S':'G';b.append(badge);}
      b.setAttribute('aria-label',`${label(i)} ${id?byId.get(id).name+'（'+byId.get(id).ja+'）':'空き地'}${i===state.start?' 出発地':''}${i===state.goal?' 目的地':''}`);
    });
    $('town-name').value=state.title;$('town-name').readOnly=stage==='guide';
    for(const k of ['start','goal']){const pin=$(k+'-pin');pin.hidden=state[k]===null;if(!pin.hidden){const p=entrance(state[k]);pin.style.left=percent(p.x)+'%';pin.style.top=percent(p.y)+'%';}}
  }
  function renderPalette(){
    const query=$('search').value.trim().toLowerCase(),cat=$('category').value;
    let count=0;paletteButtons.forEach((b,i)=>{const p=places[i];const visible=(query?`${p.name} ${p.ja} ${p.aliases.join(' ')}`.toLowerCase().includes(query):cat==='all'||p.category===cat);b.hidden=!visible;b.querySelector('.ja').hidden=!$('translations').checked;if(visible)count++;});
    $('no-results')?.remove();if(!count){const p=document.createElement('p');p.id='no-results';p.textContent='見つかりません。別のことばで探してみましょう。';$('palette').append(p);}
  }
  function choose(id){selected=id;paletteButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===id)));$('erase').setAttribute('aria-pressed',String(id==='erase'));$('selection').textContent=id==='erase'?'消したい場所を押しましょう。':`${byId.get(id).name}（${byId.get(id).ja}）を置きます。町の場所を押しましょう。${byId.get(id).canNavigate?'':' この絵は町のことばを表し、出発地・目的地には使いません。'}`;}
  function renderEndpoints(){
    for(const k of ['start','goal']){const sel=$(k),currentValue=state[k];sel.replaceChildren(new Option('選んでください',''));state.plots.forEach((id,i)=>{if(id&&canNavigate(i))sel.add(new Option(`${label(i)} · ${byId.get(id).name}（${byId.get(id).ja}）`,String(i)));});sel.value=currentValue===null?'':String(currentValue);}
  }
  function pathBetween(a,b){
    const start=entrance(a),goal=entrance(b),key=p=>p.x+','+p.y,q=[[start]],seen=new Set([key(start)]);
    for(let i=0;i<q.length;i++){const path=q[i],p=path.at(-1);if(key(p)===key(goal))return path;for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const n={x:p.x+dx,y:p.y+dy};if(n.x<0||n.x>8||n.y<0||n.y>8||(n.x%2&&n.y%2)||seen.has(key(n)))continue;seen.add(key(n));q.push([...path,n]);}}
    return null;
  }
  const direction=(a,b)=>b.x>a.x?'E':b.x<a.x?'W':b.y>a.y?'S':'N';
  function plan(a,b){
    if(a===b||!canNavigate(a)||!canNavigate(b))return null;const path=pathBetween(a,b);if(!path||path.length<2)return null;
    const initial=direction(path[0],path[1]);
    const steps=[{type:'intro',text:`Start at the ${name(a)}.`,ja:`${byId.get(state.plots[a]).ja}の上の入口から出発。矢印 ${arrows[initial]} の向きで始めます。`}];
    let last=initial,segment=[path[0]];
    for(let i=1;i<path.length;i++){
      const dir=direction(path[i-1],path[i]);
      if(dir!==last){steps.push({type:'move',text:'Go straight.',ja:'まっすぐ進みましょう。',nodes:segment,dir:last});const clockwise=({N:0,E:1,S:2,W:3}[dir]-{N:0,E:1,S:2,W:3}[last]+4)%4;steps.push({type:'turn',text:clockwise===1?'Turn right.':clockwise===3?'Turn left.':'Turn around.',ja:clockwise===1?'キャラクターから見て右を向きましょう。':clockwise===3?'キャラクターから見て左を向きましょう。':'反対を向きましょう。',dir});segment=[path[i-1]];last=dir;}
      segment.push(path[i]);
    }
    steps.push({type:'move',text:'Go straight.',ja:'まっすぐ進みましょう。',nodes:segment,dir:last});
    const side=last==='E'?'right':'left'; // Entrance is always on the north road; final move is horizontal.
    steps.push({type:'arrive',text:`The ${name(b)} is on your ${side}.`,ja:`${side==='right'?'右':'左'}に${byId.get(state.plots[b]).ja}が見えます。目的地の入口に着きました。`});
    return {path,steps,initial};
  }
  function prepare(){
    route=null;$('character').hidden=true;$('route-path')?.remove();$('position').textContent='';$('town-name').readOnly=stage==='guide';
    if(state.start===null||state.goal===null){$('route-summary').textContent=state.plots.filter((_,i)=>canNavigate(i)).length<2?'道案内する場所を2つ以上置きましょう（street・town以外）。':'S 出発地と G 目的地を選びましょう。';controls();return;}
    route=plan(state.start,state.goal);if(!route){$('route-summary').textContent='出発地と目的地は別の場所にしてください。';controls();return;}
    $('route-summary').textContent=`Excuse me, where is the ${name(state.goal)}? — ${label(state.start)} から ${label(state.goal)} へ。まず、自分のことばで案内してみよう。`;
    if(stage==='guide'){$('character').hidden=false;setPosition(route.path[0]);setFrame(route.initial,0);}
    controls();
  }
  function controls(){const ready=Boolean(route);$('play').disabled=!ready||busy;$('next').disabled=!ready||busy||index>=route.steps.length;$('stop').disabled=!busy&&index===0;$('start').disabled=busy;$('goal').disabled=busy;$('restart').disabled=!ready;$('next').textContent=index===0?'1つずつ見る':'次の案内';}
  function setPosition(p){current={...p};const scroll=document.querySelector('.map-scroll');if(stage==='guide'&&scroll.scrollWidth>scroll.clientWidth){const x=percent(p.x)/100*$('board').offsetWidth;if(x<scroll.scrollLeft+35||x>scroll.scrollLeft+scroll.clientWidth-35)scroll.scrollLeft=Math.max(0,x-scroll.clientWidth/2);}$('character').style.left=percent(p.x)+'%';$('character').style.top=percent(p.y)+'%';updatePosition();}
  function updatePosition(){$('position').textContent=stage==='guide'&&current?`今の向き：${arrows[heading]}　左右はキャラクターから見ます。`:'';}
  function setFrame(dir,frame){heading=dir;$('sprite').style.backgroundPosition=`${frame*100/3}% ${rows[dir]*100/3}%`;$('facing').textContent=arrows[dir];updatePosition();}
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function speak(text,t){
    if(!$('sound').checked||!window.speechSynthesis||t!==token)return Promise.resolve();
    return new Promise(resolve=>{
      let done=false,timer;const finish=()=>{if(done)return;done=true;clearTimeout(timer);if(speechFinish===finish)speechFinish=null;resolve();};speechFinish=finish;
      try{const utterance=new SpeechSynthesisUtterance(text),voices=speechSynthesis.getVoices();const voice=voices.find(v=>v.lang==='en-US')||voices.find(v=>v.lang.startsWith('en'));if(!voice&&voices.length){$('speech-note').textContent='英語の音声が見つからないため、文字と動きで案内します。';finish();return;}utterance.lang='en-US';utterance.rate=.85;if(voice){utterance.voice=voice;if(!voice.lang.toLowerCase().startsWith('en-us'))$('speech-note').textContent='米国英語の声がないため、別の英語音声を使います。';}utterance.onend=finish;utterance.onerror=()=>{$('speech-note').textContent='音声を再生できませんでした。文字と動きで案内します。';finish();};timer=setTimeout(()=>{if(t===token){try{speechSynthesis.cancel();}catch{}$('speech-note').textContent='音声の応答を待たず、文字と動きで続けます。';}finish();},Math.min(12000,2000+text.length*130));speechSynthesis.speak(utterance);}catch{finish();$('speech-note').textContent='音声を使えないため、文字と動きで案内します。';}
    });
  }
  function showStep(step){$('directions').querySelectorAll('li').forEach(e=>e.classList.remove('active'));const li=document.createElement('li');li.className='active';const en=document.createElement('span');en.lang='en';en.textContent=step.text;const ja=document.createElement('span');ja.className='translation';ja.textContent=step.ja;li.append(en,ja);$('directions').append(li);}
  function drawPath(){const svg=$('roads');$('route-path')?.remove();const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');line.id='route-path';line.classList.add('route-line');line.setAttribute('points',route.path.map(p=>`${14+64*p.x},${14+64*p.y}`).join(' '));svg.append(line);}
  async function animate(step,t){
    const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:Number($('speed').value);
    if(step.type==='turn'){setFrame(step.dir,0);if(duration)await delay(Math.min(duration,400));return;}
    if(step.type!=='move')return;setFrame(step.dir,0);
    for(const p of step.nodes.slice(1)){
      if(t!==token)return;const from={...current};
      if(duration){const start=performance.now();while(t===token){const elapsed=performance.now()-start,ratio=Math.min(1,elapsed/duration);$('character').style.left=percent(from.x+(p.x-from.x)*ratio)+'%';$('character').style.top=percent(from.y+(p.y-from.y)*ratio)+'%';setFrame(step.dir,Math.floor(elapsed/140)%4);if(ratio>=1)break;await delay(25);}}
      if(t!==token)return;setPosition(p);
    }
    setFrame(step.dir,0);
  }
  async function run(all){
    if(busy||!route)return;
    if(all){stop();drawPath();}
    const t=++token;busy=true;controls();
    try{do{if(t!==token)return;const step=route.steps[index];showStep(step);await Promise.all([speak(step.text,t),animate(step,t)]);if(t!==token)return;index++;if(all&&index<route.steps.length)await delay(Number($('speed').value)===0?0:450);}while(all&&index<route.steps.length);
      if(index===route.steps.length)message('目的地に着きました！ 役割を交代して、もう一度案内してみましょう。');
    }finally{if(t===token){busy=false;controls();}}
  }
  function replaceTown(next){checkpoint();state=validate(next);selected=null;paletteButtons.forEach(b=>b.setAttribute('aria-pressed','false'));$('erase').setAttribute('aria-pressed','false');$('selection').textContent='まだ絵を選んでいません。';changed();message('町を入れ替えました。「1つ戻す」で元の町に戻せます。');}
  let pendingReplacement=null;
  function requestReplace(next){stop();pendingReplacement=next;$('replace-dialog').showModal();}
  $('replace-dialog').addEventListener('close',()=>{if($('replace-dialog').returnValue==='ok'&&pendingReplacement)replaceTown(pendingReplacement);pendingReplacement=null;});
  for(let y=0;y<=8;y+=2){for(const vertical of [false,true]){const ns='http://www.w3.org/2000/svg',line=document.createElementNS(ns,'line');const p=14+64*y;line.setAttribute('x1',vertical?p:14);line.setAttribute('x2',vertical?p:526);line.setAttribute('y1',vertical?14:p);line.setAttribute('y2',vertical?526:p);line.classList.add('road');$('roads').append(line);const dash=line.cloneNode();dash.classList.remove('road');dash.classList.add('center-line');$('roads').append(dash);}}
  for(let i=0;i<16;i++){const b=document.createElement('button');b.className='plot';b.style.left=(28+128*(i%4))/540*100+'%';b.style.top=(28+128*Math.floor(i/4))/540*100+'%';b.addEventListener('click',()=>{
    if(stage!=='edit'){message(`${label(i)} ${state.plots[i]?name(i):'空き地'}。出発地と目的地は選択欄で指定します。`);return;}
    if(!selected){message('先に、置きたい絵を選びましょう。');return;}
    const id=selected==='erase'?null:selected;if(state.plots[i]===id)return;checkpoint();state.plots[i]=id;if(!id){if(state.start===i)state.start=null;if(state.goal===i)state.goal=null;}changed();message(id?`${label(i)} に ${byId.get(id).name} を置きました。`:`${label(i)} を空き地にしました。`);
  });$('plots').append(b);plotButtons.push(b);}
  for(const p of places){const b=document.createElement('button');b.className='place-card';b.dataset.id=p.id;b.setAttribute('aria-pressed','false');const img=new Image();img.src=image(p.id);img.alt='';img.loading='lazy';img.draggable=false;const en=document.createElement('span');en.lang='en';en.textContent=p.name;const ja=document.createElement('span');ja.className='ja';ja.textContent=p.ja;b.append(img,en,ja);b.addEventListener('click',()=>{choose(p.id);cancelSpeech();speak(p.name,token);});$('palette').append(b);paletteButtons.push(b);}
  $('edit-tab').onclick=()=>setStage('edit');$('route-tab').onclick=$('to-route').onclick=()=>setStage('guide');$('erase').onclick=()=>choose('erase');
  $('search').oninput=$('category').onchange=$('translations').onchange=renderPalette;
  $('town-name').addEventListener('change',()=>{checkpoint();state.title=$('town-name').value;save();});
  for(const k of ['start','goal'])$(k).onchange=()=>{const n=$(k).value===''?null:Number($(k).value),other=k==='start'?'goal':'start';if(n!==null&&n===state[other]){$(k).value=state[k]===null?'':String(state[k]);message('出発地と目的地は別の場所を選びましょう。');return;}checkpoint();state[k]=n;changed();};
  $('play').onclick=()=>run(true);$('next').onclick=()=>run(false);$('stop').onclick=()=>{stop();message('止めて出発地へ戻りました。もう一度始められます。');};$('restart').onclick=()=>{stop();message('出発地へ戻りました。同じ道をもう一度案内しましょう。');};
  $('sound').onchange=()=>{cancelSpeech();$('speech-note').textContent=$('sound').checked?'英語の音声を使います。端末により声は異なります。':'音声を使わず、文字と動きで案内します。';};
  $('undo').onclick=()=>{if(!previous)return;stop();state=previous;previous=null;$('undo').disabled=true;changed();message('1つ前の町に戻しました。');};
  $('clear').onclick=()=>requestReplace({version:1,title:'My Town',plots:Array(16).fill(null),start:null,goal:null});
  $('sample').onclick=()=>requestReplace({version:1,title:'Our Town',plots:['elementary-school','park',null,'library',null,'post-office','hospital',null,'house',null,'supermarket',null,'station','restaurant',null,'zoo'],start:0,goal:15});
  $('export').onclick=()=>{state.title=$('town-name').value;save();const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='my-town.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('町のファイルを保存しました。ダウンロード先を確認してください。');};
  $('import').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{if(file.size>100000)throw Error('ファイルが大きすぎます。My Townで保存したファイルを選んでください。');const next=validate(JSON.parse(await file.text()));requestReplace(next);}catch(err){message(err instanceof SyntaxError?'町のファイルを読み取れませんでした。JSONファイルを確認してください。':err.message);}};
  let loadError=false;try{const raw=localStorage.getItem(KEY);if(raw)state=validate(JSON.parse(raw));}catch{loadError=true;}
  renderMap();renderEndpoints();renderPalette();prepare();
  if(loadError)message('保存データを読み込めませんでした。ファイルで保存した町は「町を開く」で戻せます。');
  if(!window.speechSynthesis){$('sound').disabled=true;$('speech-note').textContent='このブラウザーでは音声を使えません。文字と動きで案内できます。';}
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&busy){stop();message('画面を離れたので、出発地へ戻りました。');}});
  window.MyTown={snapshot:()=>({state:structuredClone(state),stage,busy,index,current,heading,route:structuredClone(route)}),pathBetween};
})();
