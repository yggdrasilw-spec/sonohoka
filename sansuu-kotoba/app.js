'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const audio=window.LessonAudio;
  const blocks=window.LessonBlocks;
  const scenes = {
    push: {row:4,title:'うしろから、おす',left:'おされる',right:'おす',description:'みぎの人が、ひだりの人の せなかを おす。',beats:['手を せなかに 近づける。','せなかに 手を あてる。','うしろから 前へ、ぐっと おす。','おされた人が、前へ 一歩。']},
    poke: {row:5,title:'かたを、やさしく つつく',left:'つつかれる',right:'つつく',description:'みぎの人が、ひだりの人の かたを やさしく つつく。',beats:['かたに 指を 近づける。','指を、かたの すぐ近くへ。','かたを、かるく 一度だけ ちょん。','つつかれた人が、えがおで ふりむく。']},
    pat: {row:6,title:'頭を、やさしく なでる',left:'なでられる',right:'なでる',description:'みぎの人が、ひだりの人の 頭を やさしく なでる。',beats:['頭の 上に、手を 近づける。','かみの 上に、そっと 手を おく。','頭を、やさしく なでる。','なでられた人が、うれしそう。']},
    fan: {row:7,title:'うちわで、あおぐ',left:'あおがれる',right:'あおぐ',description:'みぎの人が、うちわで ひだりの人を あおぐ。',beats:['うちわを かまえる。','うちわで、風を おくる。','あおがれた人が、風を うける。','うちわを とめる。すずしかったね。']},
    call: {row:8,title:'うしろから、よぶ',left:'よばれる',right:'よぶ',description:'みぎの人が、ひだりの人を よぶ。',beats:['手を 上げて、よびかけよう。','声を かけて、よぶ。','よばれた人が、ふりむく。','声が とどいたね。ふたりとも えがお。']},
    light: {row:9,title:'ライトで、てらす',left:'てらされる',right:'てらす',description:'みぎの人が、ライトで ひだりの人の 服を てらす。',beats:['服に むけて、ライトを かまえる。','ライトを つけて、服を てらす。','てらされた 服に、光が あたる。','ライトを けすと、光が きえる。']},
    subtract: {row:0,title:'うしろから、引く',left:'引かれる',right:'引く',a:7,b:2,op:'−',description:'みぎの人が、ひだりの人の 体の ロープを 引く。',beats:['体に まいた ロープを もつ。','ロープを しっかり にぎる。','ロープを ぐっと 引く。','ひだりの人が、引かれる。']},
    multiply: {row:1,title:'うしろから、水を かける',left:'かけられる',right:'かける',a:4,b:3,op:'×',description:'みぎの人が、ひだりの人に 水でっぽうで 水を かける。',beats:['水でっぽうを かまえる。','みぎから ひだりへ、水を 出す。','ひだりの人に、水が かけられる。','水を かけたね。']},
    divide: {row:2,title:'うしろから、風船を わる',left:'わられる',right:'わる',a:8,b:2,op:'÷',description:'みぎの人が チョップして、ひだりの人の 頭の 風船を わる。',beats:['頭の 上に、風船。','風船に むかって、チョップ。','ぱん！ 風船が わられる。','風船を わったね。']},
    add: {row:3,title:'うしろから、ルーを たす',left:'たされる',right:'たす',a:4,b:3,op:'＋',description:'みぎの人が、ひだりの人の カレーに ルーを たす。',beats:['おさらの上は、ライスだけ。','ライスに ルーを そそぎはじめる。','同じ おさらに、ルーが ふえていく。','ルーを たして もらったね。']}
  };
  let sceneKey='push', mode='people', frame=0, timer=null, questionIndex=0, answered=false, tried=false, attempts=0, correct=0;
  let bridgeTime=0;
  let timerType='timeout';
  let numberView='digits';
  const bridgeCues=new Set();
  const bridgeSteps=[0,650,1300,1950,2800,3800,4800,5600], bridgeEnd=5600;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const isBlocks=()=>mode==='numbers'&&numberView==='blocks';
  const isOther=(key=sceneKey)=>!scenes[key].op;
  const endTime=()=>isBlocks()?blocks.end:bridgeEnd;
  const stepTimes=()=>isBlocks()?blocks.steps(sceneKey,scenes[sceneKey]):bridgeSteps;
  const cueTimes=()=>isBlocks()?blocks.cues(sceneKey,scenes[sceneKey]):[2200,3950,5600];
  // Like the clock's direction arrows: derive the head from the arc's endpoint
  // and tangent. The shaft overlaps the filled head, leaving no kink or gap.
  document.querySelectorAll('.semantic-arrow').forEach(svg=>{
    const cx=550,rx=250,cy=Number(svg.dataset.centerY),ry=Number(svg.dataset.radiusY);
    const scale=Number(svg.dataset.shaft)/10;
    const end={x:cx-rx,y:cy},u={x:0,y:1},normal={x:-u.y,y:u.x};
    const tip={x:end.x+20*scale*u.x,y:end.y+20*scale*u.y};
    const base={x:end.x-9*scale*u.x,y:end.y-9*scale*u.y};
    const points=[tip,{x:base.x+17*scale*normal.x,y:base.y+17*scale*normal.y},{x:base.x-17*scale*normal.x,y:base.y-17*scale*normal.y}];
    svg.querySelector('path').setAttribute('d',`M ${cx+rx} ${cy} A ${rx} ${ry} 0 0 0 ${end.x} ${end.y}`);
    svg.querySelector('.arrow-head').setAttribute('points',points.map(p=>`${p.x},${p.y}`).join(' '));
  });
  const arc=$('arc'), length=arc.getTotalLength();
  const asset=(row,n)=>`sansuu-kotoba/assets/scene-${row}-${n}.webp${row===3?'?v=rice-first-v2':row>=5?'?v=other-v1':'?v=hires-v2'}`;
  Object.values(scenes).forEach(s=>{for(let n=0;n<4;n++){const image=new Image();image.src=asset(s.row,n);}});
  function playButton(icon,label){$('play').textContent=icon;$('play').setAttribute('aria-label',label);$('play').title=label;}
  function stop(silence=true){if(timerType==='raf')cancelAnimationFrame(timer);else clearTimeout(timer);timer=null;if(silence)audio.cancel();playButton(mode==='numbers'&&bridgeTime>=endTime()?'🔄':'▶️',mode==='numbers'?(bridgeTime>=endTime()?'もういちど':isBlocks()?'ブロックに かえる':'数に かえる'):'うごかす');$('play').setAttribute('aria-pressed','false');}
  function clearCharacterFocus(){for(const side of ['left','right']){$(`character-${side}-focus`).hidden=true;document.querySelector(`.person-label.${side==='left'?'receiver':'actor'}`).classList.remove('role-speaking');}}
  function focusCharacter(side,word){
    clearCharacterFocus();
    $(`character-${side}-word`).textContent=word;$(`character-${side}-focus`).hidden=false;
    document.querySelector(`.person-label.${side==='left'?'receiver':'actor'}`).classList.add('role-speaking');
  }
  function rolePart(side,text,word){return {text,target:document.querySelector(`.person-label.${side==='left'?'receiver':'actor'}`),onStart:()=>focusCharacter(side,word)};}
  function readRoles(){const s=scenes[sceneKey];return audio.sequence([
    {text:s.description,target:$('caption')},
    rolePart('left',`ひだりは、${s.left}人。`,s.left+'人'),
    rolePart('right',`みぎは、${s.right}人。`,s.right+'人')
  ]);}
  function readNumberRoles(){const s=scenes[sceneKey];return audio.sequence([
    rolePart('left',`ひだりの ${s.left}数は、${s.a}。`,s.left+'数'),
    rolePart('right',`みぎの ${s.right}数は、${s.b}。`,s.right+'数'),
    {text:`しきは、${s.a} ${s.op} ${s.b}。`,target:$('caption'),onStart:clearCharacterFocus}
  ]);}
  document.addEventListener('lesson-speech-clear',clearCharacterFocus);
  function bridgeCue(at){
    if(bridgeCues.has(at))return;bridgeCues.add(at);
    const s=scenes[sceneKey];
    if(at===0){if(audio.voice)readRoles();return;}
    if(isBlocks()){audio.play(at===blocks.end?'correct':at===3950?'transform':'tap');if(audio.voice)audio.speak(blocks.cue(sceneKey,s,at),$('caption'));return;}
    audio.play(at===2200?'hint':at===3950?'transform':'correct');
    if(!audio.voice)return;
    if(at===2200)audio.speak('同じばしょに、数がかさなるよ。',$('caption'));
    else if(at===3950)audio.sequence([
      {text:'ことばも へんしん！',target:$('caption')},
      rolePart('left',`${s.left}人から、${s.left}数。`,s.left+'数'),
      rolePart('right',`${s.right}人から、${s.right}数。`,s.right+'数')
    ]);
    else readNumberRoles();
  }
  function renderBridge(){
    const s=scenes[sceneKey],clamp=x=>Math.max(0,Math.min(1,x));
    frame=Math.min(3,Math.floor(bridgeTime/650));renderFrame();
    const digits=clamp((bridgeTime-2200)/1100),fade=clamp((bridgeTime-3300)/1400),symbol=clamp((bridgeTime-4700)/700);
    document.querySelector('.visual').style.setProperty('--people-opacity',1-fade);
    document.querySelector('.visual').style.setProperty('--number-opacity',digits);
    const termChange=clamp((bridgeTime-3500)/450);
    // Emphasize the word change on the same timeline, so pause and steps freeze it too.
    const emphasis=reduced.matches?0:Math.sin(Math.PI*clamp((bridgeTime-3500)/1700));
    const visual=document.querySelector('.visual');
    visual.style.setProperty('--term-opacity',termChange);
    visual.style.setProperty('--term-old-opacity',1-termChange);
    visual.style.setProperty('--term-pop',1+emphasis*.45);
    visual.style.setProperty('--term-glow',emphasis);
    visual.style.setProperty('--burst-opacity',reduced.matches?0:Math.sin(Math.PI*clamp((bridgeTime-3300)/1700)));
    visual.style.setProperty('--number-pop',reduced.matches?1:1+Math.sin(Math.PI*digits)*.12);
    visual.classList.toggle('terms-changed',bridgeTime>=3500);
    for(const side of ['left','right']){
      $(`${side}-person`).setAttribute('aria-hidden',String(termChange>=.5));
      $(`morph-${side}-term`).setAttribute('aria-hidden',String(termChange<.5));
    }
    document.querySelector('.visual').style.setProperty('--operator-opacity',symbol);
    $('frame-count').textContent=`${bridgeSteps.filter(t=>t<=bridgeTime).length} / 8 ステップ`;
    $('caption').classList.toggle('term-change-cue',bridgeTime>=3300);
    $('caption').textContent=bridgeTime<2200?s.beats[frame]:bridgeTime<3300?'同じ ばしょに、数が かさなるよ。':bridgeTime<4700?'ことばも へんしん！「人」→「数」':`「人」が「数」に なったね！ ${s.left}数・${s.right}数。`;
    $('stage').setAttribute('aria-label',bridgeTime<3300?s.description:`左の${s.left}数は${s.a}、右の${s.right}数は${s.b}。やじるしは右から左へ。`);
    if(isBlocks()){
      const state=blocks.render(sceneKey,s,bridgeTime);
      $('frame-count').textContent=`${stepTimes().filter(t=>t<=bridgeTime).length} / ${stepTimes().length} ステップ`;
      if(bridgeTime>=2200){$('caption').textContent=state.caption;$('stage').setAttribute('aria-label',state.description);}
    }
  }
  function startBridge(){
    audio.activate();audio.cancel();
    if(bridgeTime>=endTime()){bridgeTime=0;bridgeCues.clear();}
    if(reduced.matches){bridgeTime=endTime();renderBridge();stop();bridgeCue(endTime());$('morph-status').textContent='できあがりを ひょうじしました。';return;}
    $('morph-status').textContent='人から数へ、同じばしょでかわります。';
    playButton('⏸️','とめる');$('play').setAttribute('aria-pressed','true');
    let previous=performance.now();
    function tick(){
      const now=performance.now(),rate=isBlocks()?blocks.playbackRate(bridgeTime,sceneKey):1.8;
      const delta=(now-previous)*350/Number($('speed').value)*rate;previous=now;
      // Hold the current teaching landmark while its narration is heard.
      // Updating the clock above prevents a jump when voice is turned off.
      if(audio.voice&&audio.speaking){timer=requestAnimationFrame(tick);return;}
      const next=bridgeTime+delta,at=cueTimes().find(t=>!bridgeCues.has(t)&&t>bridgeTime&&t<=next);
      const oldFrame=frame;bridgeTime=Math.min(endTime(),at??next);renderBridge();
      if(frame!==oldFrame&&frame===2)audio.play(sceneKey);
      if(at!==undefined)bridgeCue(at);
      if(bridgeTime>=endTime()){stop(false);$('morph-status').textContent='できたね。「もういちど」で見直せます。';return;}
      timer=requestAnimationFrame(tick);
    }
    renderBridge();if(bridgeTime===0)bridgeCue(0);timerType='raf';timer=requestAnimationFrame(tick);
  }
  function renderFrame(){
    const scene=scenes[sceneKey],src=asset(scene.row,frame);if($('frame').getAttribute('src')!==src)$('frame').src=src;$('frame-count').textContent=`${frame+1} / 4 コマ`;
    $('caption').textContent=scene.beats[frame];
    const p=arc.getPointAtLength(length*(reduced.matches?.5:Math.min(frame/3,.90)));$('traveler').setAttribute('cx',p.x);$('traveler').setAttribute('cy',p.y);
  }
  function playFrameSound(){if(frame===2)audio.play(sceneKey);if(audio.voice)audio.speak(scenes[sceneKey].beats[frame],$('caption'));}
  // Brief anticipation, two snappy action frames, then time to see the result.
  function schedule(){timerType='timeout';timer=setTimeout(()=>{if(audio.voice&&audio.speaking){schedule();return;}if(sceneKey==='add'&&frame===3){stop(false);return;}frame=(frame+1)%4;renderFrame();playFrameSound();schedule();},Number($('speed').value)*[.9,.6,.6,2][frame]);}
  function render(){
    stop();frame=0;bridgeTime=0;bridgeCues.clear();const s=scenes[sceneKey];
    document.querySelector('.visual').classList.toggle('number-mode',mode==='numbers');
    document.querySelector('.visual').classList.toggle('block-mode',isBlocks());
    $('number-view').hidden=mode!=='numbers';
    document.querySelectorAll('[data-number-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.numberView===numberView)));
    $('block-stage').toggleAttribute('hidden',!isBlocks());
    $('morph-equation').toggleAttribute('hidden',mode!=='numbers'||isBlocks());$('morph-status').hidden=mode!=='numbers';$('morph-status').textContent='';
    $('caption').classList.remove('term-change-cue');
    for(const side of ['left','right']){
      const term=$(`morph-${side}-term`);term.hidden=mode!=='numbers';
      const suffix=document.createElement('b');suffix.className='term-suffix';suffix.textContent='数';
      term.replaceChildren(document.createTextNode(s[side]),suffix);
      $(`${side}-person`).removeAttribute('aria-hidden');
    }
    $('step').setAttribute('aria-label',mode==='numbers'?'１ステップ すすむ':'１コマ すすむ');$('step').title=$('step').getAttribute('aria-label');
    updateSceneSelection();
    document.querySelectorAll('[data-mode]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.mode===mode));b.disabled=isOther()&&['numbers','apply'].includes(b.dataset.mode);});
    $('scene-title').textContent=s.title;$('stage').setAttribute('aria-label',s.description);
    $('scene-kicker').textContent=mode==='people'?'まずは、人で たしかめよう':mode==='numbers'?'同じ ばしょで、人から 数へ':'ことばと やじるしを 思い出そう';
    if(isBlocks()){$('scene-kicker').textContent='人から ブロックへ。数のうごきを 見よう';$('scene-title').textContent=`ブロックで ${ {add:'たし算',subtract:'ひき算',multiply:'かけ算',divide:'わり算'}[sceneKey]}`;}
    for(const side of ['left','right']){
      const suffix=document.createElement('b');suffix.className='person-suffix';suffix.textContent='人';
      $(`${side}-person`).replaceChildren(document.createTextNode(s[side]),suffix);
    }
    $('number-panel').hidden=isOther()||mode!=='quiz';$('mapping').hidden=mode==='quiz';$('quiz').hidden=mode!=='quiz';
    if(!isOther()){$('morph-left').textContent=s.a;$('morph-right').textContent=s.b;$('morph-operator').textContent=s.op;}
    if(!isOther()){$('left-number').textContent=s.a;$('right-number').textContent=s.b;$('operator').textContent=s.op;$('left-term').textContent=s.left+'数';$('right-term').textContent=s.right+'数';}
    $('basic-content').hidden=mode==='apply';$('application').hidden=mode!=='apply';
    if(mode==='apply'){$('scene-title').textContent='文のいみを たしかめよう';$('scene-kicker').textContent='ことばをつかって、計算のかんけいを読もう';document.dispatchEvent(new CustomEvent('practice-enter',{detail:sceneKey}));}
    if(mode==='quiz'){newQuestion();}
    renderFrame();
    if(mode==='numbers')renderBridge();stop();
  }
  function newQuestion(){
    answered=false;tried=false;const s=scenes[sceneKey],target=questionIndex%2===0?'left':'right',word=s[target]+(isOther()?'人':'数');
    $('question').textContent=`「${word}」は、どっち？`;$('feedback').textContent='';$('hint-text').hidden=true;
    document.querySelectorAll('[data-answer]').forEach(b=>{b.classList.remove('correct');b.setAttribute('aria-label',isOther()?(b.dataset.answer==='left'?'ひだりの人':'みぎの人'):`${b.dataset.answer==='left'?'ひだり':'みぎ'}の ${b.dataset.answer==='left'?s.a:s.b}`);b.textContent=(b.dataset.answer==='left'?'⬅️ ':'➡️ ')+(isOther()?(b.dataset.answer==='left'?'ひだりの人':'みぎの人'):(b.dataset.answer==='left'?s.a:s.b));});
    $('left-term').textContent='？';$('right-term').textContent='？';
    $('hint-text').textContent='やじるしの 先は「されるがわ」。ねもとは「するがわ」。みぎから ひだりへ、はたらきかけるよ。';
    $('score').textContent=attempts?`${attempts}もんのうち ${correct}もん、はじめに できた`:'左右の ばしょを 見てみよう';
  }
  function updateSceneSelection(){
    document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===sceneKey)));
    $('other-scenes-open').setAttribute('aria-pressed',String(isOther()));
  }
  $('other-scenes-open').addEventListener('click',()=>{stop();$('other-scenes').showModal();$('other-scenes-open').setAttribute('aria-expanded','true');});
  $('other-scenes-close').addEventListener('click',()=>$('other-scenes').close());
  $('other-scenes').addEventListener('close',()=>{$('other-scenes-open').setAttribute('aria-expanded','false');$('other-scenes-open').focus();});
  $('other-scenes').addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    const buttons=[...$('other-scenes').querySelectorAll('button')],first=buttons[0],last=buttons.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
  $('other-scenes').addEventListener('click',e=>{
    if(e.target!==$('other-scenes'))return;
    const r=e.target.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();
  });
  document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>{sceneKey=b.dataset.scene;if(isOther()&&(mode==='numbers'||mode==='apply'))mode='people';questionIndex=0;render();audio.play('tap');if($('other-scenes').open)$('other-scenes').close();}));
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{audio.activate();mode=b.dataset.mode;questionIndex=0;render();if(mode==='numbers')startBridge();else if(mode==='quiz')audio.speak($('question').textContent,$('question'));else if(mode==='apply')document.dispatchEvent(new Event('practice-read'));}));
  document.querySelectorAll('[data-number-view]').forEach(b=>b.addEventListener('click',()=>{stop();numberView=b.dataset.numberView;render();startBridge();}));
  document.addEventListener('practice-topic-changed',e=>{if(e.detail!=='all')sceneKey=e.detail;updateSceneSelection();});
  $('play').addEventListener('click',()=>{audio.activate();if(timer){stop();return;}if(mode==='numbers'){startBridge();return;}if(sceneKey==='add'&&frame===3){frame=0;renderFrame();}playButton('⏸️','とめる');$('play').setAttribute('aria-pressed','true');playFrameSound();schedule();});
  $('step').addEventListener('click',()=>{audio.activate();stop();if(mode==='numbers'){bridgeTime=stepTimes().find(t=>t>bridgeTime)??endTime();renderBridge();stop();const cue=cueTimes().filter(t=>t<=bridgeTime).at(-1);if(cue!==undefined)bridgeCue(cue);else playFrameSound();return;}frame=(frame+1)%4;renderFrame();playFrameSound();});
  $('restart').addEventListener('click',()=>{stop();bridgeCues.clear();if(mode==='numbers'){bridgeTime=0;renderBridge();stop();return;}frame=0;renderFrame();});
  $('speed').addEventListener('change',()=>{if(timer&&mode!=='numbers'){clearTimeout(timer);schedule();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  reduced.addEventListener('change',()=>{if(mode==='numbers'){if(reduced.matches){stop();bridgeTime=endTime();renderBridge();stop();}}else renderFrame();});
  $('frame').addEventListener('error',()=>{$('image-error').hidden=false;stop();});
  $('frame').addEventListener('load',()=>{$('image-error').hidden=true;});
  $('hint').addEventListener('click',()=>{$('hint-text').hidden=false;$('mapping').hidden=false;audio.play('hint');audio.speak($('hint-text').textContent,$('hint-text'));});
  $('next').addEventListener('click',()=>{stop();questionIndex++;$('mapping').hidden=true;newQuestion();audio.speak($('question').textContent,$('question'));});
  document.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>{
    if(answered)return;
    const target=questionIndex%2===0?'left':'right',s=scenes[sceneKey],ok=b.dataset.answer===target;
    if(!ok){if(!tried){attempts++;tried=true;}$('feedback').textContent='やじるしを たどって、もういちど。';$('hint-text').hidden=false;audio.play('retry');audio.speak($('feedback').textContent,$('feedback'));return;}
    if(!tried){attempts++;correct++;}answered=true;b.classList.add('correct');
    $('feedback').textContent=target==='left'?'そう！ やじるしの 先が「されるがわ」。':'そう！ やじるしの ねもとが「するがわ」。';
    $('mapping').hidden=false;if(!isOther()){$('left-term').textContent=s.left+'数';$('right-term').textContent=s.right+'数';}
    $('score').textContent=`${attempts}もんのうち ${correct}もん、はじめに できた`;
    audio.play('correct');audio.speak($('feedback').textContent,$('feedback'));
  }));
  document.addEventListener('lesson-audio-stop',()=>stop());
  $('voice-toggle').addEventListener('click',()=>{
    if(!audio.voice||!timer)return;
    if(isBlocks()&&bridgeTime>=2200)audio.speak(blocks.caption(sceneKey,scenes[sceneKey],bridgeTime),$('caption'));
    else if(mode==='people'||mode==='numbers')audio.speak($('caption').textContent,$('caption'));
  });
  document.addEventListener('lesson-read',()=>{stop();if(mode==='apply'){document.dispatchEvent(new Event('practice-read'));return;}if(isBlocks()&&bridgeTime>=2200){audio.speak(blocks.caption(sceneKey,scenes[sceneKey],bridgeTime),$('caption'));return;}if(mode==='people'||mode==='numbers'&&bridgeTime<3950){readRoles();return;}if(mode==='numbers'){readNumberRoles();return;}audio.speak($('question').textContent,$('question'));});
  render();
})();
