'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const scenes = {
    push: {row:4,title:'うしろから、押す',left:'押される',right:'押す',description:'みぎの人が、ひだりの人の せなかを 押す。',beats:['手を せなかに 近づける。','せなかに 手を あてる。','うしろから 前へ、ぐっと 押す。','押された人が、前へ 一歩。']},
    subtract: {row:0,title:'うしろから、引く',left:'引かれる',right:'引く',a:7,b:2,op:'−',description:'みぎの人が、ひだりの人の 体の ロープを 引く。',beats:['体に まいた ロープを 持つ。','ロープを しっかり にぎる。','ロープを ぐっと 引く。','ひだりの人が、引かれる。']},
    multiply: {row:1,title:'うしろから、水を かける',left:'かけられる',right:'かける',a:4,b:3,op:'×',description:'みぎの人が、ひだりの人に 水でっぽうで 水を かける。',beats:['水でっぽうを かまえる。','みぎから ひだりへ、水を 出す。','ひだりの人に、水が かけられる。','水を かけたね。']},
    divide: {row:2,title:'うしろから、風船を わる',left:'わられる',right:'わる',a:8,b:2,op:'÷',description:'みぎの人が チョップして、ひだりの人の 頭の 風船を わる。',beats:['頭の 上に、風船。','風船に 向かって、チョップ。','ぱん！ 風船が わられる。','風船を わったね。']},
    add: {row:3,title:'うしろから、ルーを たす',left:'たされる',right:'たす',a:4,b:3,op:'＋',description:'みぎの人が、ひだりの人の カレーに ルーを たす。',beats:['お皿の上は、ライスだけ。','ライスに ルーを 注ぎはじめる。','同じ お皿に、ルーが ふえていく。','ルーを たして もらったね。']}
  };
  let sceneKey='push', mode='people', frame=0, timer=null, questionIndex=0, answered=false, tried=false, attempts=0, correct=0;
  let bridgeTime=0;
  const bridgeSteps=[0,650,1300,1950,2800,3800,4800,5600], bridgeEnd=5600;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
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
  const asset=(row,n)=>`sansuu-kotoba/assets/scene-${row}-${n}.webp${row===3?'?v=rice-first-v2':''}`;
  Object.values(scenes).forEach(s=>{for(let n=0;n<4;n++){const image=new Image();image.src=asset(s.row,n);}});
  function stop(){clearTimeout(timer);timer=null;$('play').textContent=mode==='numbers'?(bridgeTime>=bridgeEnd?'↶ もう一度':'▶ 数に かえる'):'▶ うごかす';$('play').setAttribute('aria-pressed','false');}
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
    visual.classList.toggle('terms-changed',bridgeTime>=3500);
    for(const side of ['left','right']){
      $(`${side}-person`).setAttribute('aria-hidden',String(termChange>=.5));
      $(`morph-${side}-term`).setAttribute('aria-hidden',String(termChange<.5));
    }
    document.querySelector('.visual').style.setProperty('--operator-opacity',symbol);
    $('frame-count').textContent=`${bridgeSteps.filter(t=>t<=bridgeTime).length} / 8 ステップ`;
    $('caption').classList.toggle('term-change-cue',bridgeTime>=3300);
    $('caption').textContent=bridgeTime<2200?s.beats[frame]:bridgeTime<3300?'同じ ばしょに、数が かさなるよ。':bridgeTime<4700?'ことばも へんしん！「人」→「数」':`「人」が「数」に なったね！ ${s.left}数・${s.right}数。`;
    $('stage').setAttribute('aria-label',bridgeTime<3300?s.description:`左の${s.left}数は${s.a}、右の${s.right}数は${s.b}。矢印は右から左へ。`);
  }
  function startBridge(){
    if(bridgeTime>=bridgeEnd)bridgeTime=0;
    if(reduced.matches){bridgeTime=bridgeEnd;renderBridge();stop();$('morph-status').textContent='人と同じ場所の数を表示しました。';return;}
    $('morph-status').textContent='人から数へ、同じ場所で変わります。';
    $('play').textContent='Ⅱ とめる';$('play').setAttribute('aria-pressed','true');
    let previous=performance.now();
    function tick(){const now=performance.now();bridgeTime=Math.min(bridgeEnd,bridgeTime+(now-previous)*350/Number($('speed').value));previous=now;renderBridge();if(bridgeTime>=bridgeEnd){stop();$('morph-status').textContent='数になりました。「もう一度」で見直せます。';return;}timer=setTimeout(tick,40);}
    renderBridge();timer=setTimeout(tick,40);
  }
  function renderFrame(){
    const scene=scenes[sceneKey];$('frame').src=asset(scene.row,frame);$('frame-count').textContent=`${frame+1} / 4 コマ`;
    $('caption').textContent=scene.beats[frame];
    const p=arc.getPointAtLength(length*(reduced.matches?.5:Math.min(frame/3,.90)));$('traveler').setAttribute('cx',p.x);$('traveler').setAttribute('cy',p.y);
  }
  function schedule(){timer=setTimeout(()=>{if(sceneKey==='add'&&frame===3){stop();return;}frame=(frame+1)%4;renderFrame();schedule();},Number($('speed').value)*(frame===3?2:1));}
  function render(){
    stop();frame=0;bridgeTime=0;const s=scenes[sceneKey];
    document.querySelector('.visual').classList.toggle('number-mode',mode==='numbers');
    $('morph-equation').toggleAttribute('hidden',mode!=='numbers');$('morph-status').hidden=mode!=='numbers';$('morph-status').textContent='';
    $('caption').classList.remove('term-change-cue');
    for(const side of ['left','right']){
      const term=$(`morph-${side}-term`);term.hidden=mode!=='numbers';
      const suffix=document.createElement('b');suffix.className='term-suffix';suffix.textContent='数';
      term.replaceChildren(document.createTextNode(s[side]),suffix);
      $(`${side}-person`).removeAttribute('aria-hidden');
    }
    $('step').textContent=mode==='numbers'?'１ステップ すすむ':'１コマ すすむ';
    document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===sceneKey)));
    document.querySelectorAll('[data-mode]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.mode===mode));b.disabled=sceneKey==='push'&&b.dataset.mode==='numbers';});
    $('scene-title').textContent=s.title;$('stage').setAttribute('aria-label',s.description);
    $('scene-kicker').textContent=mode==='people'?'まずは、人で たしかめよう':mode==='numbers'?'同じ ばしょで、人から 数へ':'ことばと 矢印を 思い出そう';
    for(const side of ['left','right']){
      const suffix=document.createElement('b');suffix.className='person-suffix';suffix.textContent='人';
      $(`${side}-person`).replaceChildren(document.createTextNode(s[side]),suffix);
    }
    $('number-panel').hidden=sceneKey==='push'||mode!=='quiz';$('mapping').hidden=mode==='quiz';$('quiz').hidden=mode!=='quiz';
    if(sceneKey!=='push'){$('morph-left').textContent=s.a;$('morph-right').textContent=s.b;$('morph-operator').textContent=s.op;}
    if(sceneKey!=='push'){$('left-number').textContent=s.a;$('right-number').textContent=s.b;$('operator').textContent=s.op;$('left-term').textContent=s.left+'数';$('right-term').textContent=s.right+'数';}
    $('basic-content').hidden=mode==='apply';$('application').hidden=mode!=='apply';
    if(mode==='apply'){$('scene-title').textContent='文の意味を たしかめよう';$('scene-kicker').textContent='ことばを使って、計算の関係を読もう';document.dispatchEvent(new CustomEvent('practice-enter',{detail:sceneKey}));}
    if(mode==='quiz'){newQuestion();}
    renderFrame();
    if(mode==='numbers')renderBridge();stop();
  }
  function newQuestion(){
    answered=false;tried=false;const s=scenes[sceneKey],target=questionIndex%2===0?'left':'right',word=s[target]+(sceneKey==='push'?'人':'数');
    $('question').textContent=`「${word}」は、どっち？`;$('feedback').textContent='';$('hint-text').hidden=true;
    document.querySelectorAll('[data-answer]').forEach(b=>{b.classList.remove('correct');b.setAttribute('aria-label',sceneKey==='push'?(b.dataset.answer==='left'?'ひだりの人':'みぎの人'):`${b.dataset.answer==='left'?'ひだり':'みぎ'}の ${b.dataset.answer==='left'?s.a:s.b}`);b.textContent=sceneKey==='push'?(b.dataset.answer==='left'?'ひだりの人':'みぎの人'):(b.dataset.answer==='left'?s.a:s.b);});
    $('left-term').textContent='？';$('right-term').textContent='？';
    $('hint-text').textContent='矢印の 先は「される側」。根元は「する側」。みぎから ひだりへ、はたらきかけるよ。';
    $('score').textContent=attempts?`${attempts}問中 ${correct}問、はじめに できた`:'左右の ばしょを 見てみよう';
  }
  document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>{sceneKey=b.dataset.scene;if(sceneKey==='push'&&(mode==='numbers'||mode==='apply'))mode='people';questionIndex=0;render();}));
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;if(mode==='apply'&&sceneKey==='push')sceneKey='multiply';questionIndex=0;render();if(mode==='numbers')startBridge();}));
  document.addEventListener('practice-topic-changed',e=>{if(e.detail!=='all')sceneKey=e.detail;document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===e.detail)));});
  $('play').addEventListener('click',()=>{if(timer){stop();return;}if(mode==='numbers'){startBridge();return;}if(sceneKey==='add'&&frame===3){frame=0;renderFrame();}$('play').textContent='Ⅱ とめる';$('play').setAttribute('aria-pressed','true');schedule();});
  $('step').addEventListener('click',()=>{stop();if(mode==='numbers'){bridgeTime=bridgeSteps.find(t=>t>bridgeTime)??bridgeEnd;renderBridge();stop();return;}frame=(frame+1)%4;renderFrame();});
  $('restart').addEventListener('click',()=>{stop();if(mode==='numbers'){bridgeTime=0;renderBridge();stop();return;}frame=0;renderFrame();});
  $('speed').addEventListener('change',()=>{if(timer&&mode!=='numbers'){clearTimeout(timer);schedule();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  reduced.addEventListener('change',()=>{if(mode==='numbers'){if(reduced.matches){stop();bridgeTime=bridgeEnd;renderBridge();stop();}}else renderFrame();});
  $('frame').addEventListener('error',()=>{$('image-error').hidden=false;stop();});
  $('frame').addEventListener('load',()=>{$('image-error').hidden=true;});
  $('hint').addEventListener('click',()=>{$('hint-text').hidden=false;$('mapping').hidden=false;});
  $('next').addEventListener('click',()=>{questionIndex++;$('mapping').hidden=true;newQuestion();});
  document.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>{
    if(answered)return;
    const target=questionIndex%2===0?'left':'right',s=scenes[sceneKey],ok=b.dataset.answer===target;
    if(!ok){if(!tried){attempts++;tried=true;}$('feedback').textContent='矢印を たどって、もう一度。';$('hint-text').hidden=false;return;}
    if(!tried){attempts++;correct++;}answered=true;b.classList.add('correct');
    $('feedback').textContent=target==='left'?'そう！ 矢印の 先が「される側」。':'そう！ 矢印の 根元が「する側」。';
    $('mapping').hidden=false;if(sceneKey!=='push'){$('left-term').textContent=s.left+'数';$('right-term').textContent=s.right+'数';}
    $('score').textContent=`${attempts}問中 ${correct}問、はじめに できた`;
  }));
  render();
})();
