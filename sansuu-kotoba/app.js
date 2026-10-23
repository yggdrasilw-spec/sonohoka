'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const scenes = {
    push: {row:4,title:'うしろから、押す',left:'押される',right:'押す',description:'みぎの人が、ひだりの人の せなかを 押す。',beats:['手を せなかに 近づける。','せなかに 手を あてる。','うしろから 前へ、ぐっと 押す。','押された人が、前へ 一歩。']},
    subtract: {row:0,title:'うしろから、引く',left:'引かれる',right:'引く',a:7,b:2,op:'−',description:'みぎの人が、ひだりの人の 体の ロープを 引く。',beats:['体に まいた ロープを 持つ。','ロープを しっかり にぎる。','ロープを ぐっと 引く。','ひだりの人が、引かれる。']},
    multiply: {row:1,title:'うしろから、水を かける',left:'かけられる',right:'かける',a:4,b:3,op:'×',description:'みぎの人が、ひだりの人に 水でっぽうで 水を かける。',beats:['水でっぽうを かまえる。','みぎから ひだりへ、水を 出す。','ひだりの人に、水が かけられる。','水を かけたね。']},
    divide: {row:2,title:'うしろから、風船を わる',left:'わられる',right:'わる',a:8,b:2,op:'÷',description:'みぎの人が チョップして、ひだりの人の 頭の 風船を わる。',beats:['頭の 上に、風船。','風船に 向かって、チョップ。','ぱん！ 風船が わられる。','風船を わったね。']},
    add: {row:3,title:'うしろから、ルーを たす',left:'たされる',right:'たす',a:4,b:3,op:'＋',description:'みぎの人が、ひだりの人の カレーに ルーを たす。',beats:['カレーを 食べようと しているね。','うしろから お玉を のばす。','カレーに ルーを たす。','ルーを たして もらったね。']}
  };
  let sceneKey='push', mode='people', frame=0, timer=null, questionIndex=0, answered=false, tried=false, attempts=0, correct=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const arc=$('arc'), length=arc.getTotalLength();
  const asset=(row,n)=>`sansuu-kotoba/assets/scene-${row}-${n}.webp`;
  Object.values(scenes).forEach(s=>{for(let n=0;n<4;n++){const image=new Image();image.src=asset(s.row,n);}});
  function stop(){clearTimeout(timer);timer=null;$('play').textContent='▶ うごかす';$('play').setAttribute('aria-pressed','false');}
  function renderFrame(){
    const scene=scenes[sceneKey];$('frame').src=asset(scene.row,frame);$('frame-count').textContent=`${frame+1} / 4 コマ`;
    $('caption').textContent=scene.beats[frame];
    const p=arc.getPointAtLength(length*(reduced.matches?.5:frame/3));$('traveler').setAttribute('cx',p.x);$('traveler').setAttribute('cy',p.y);
  }
  function schedule(){timer=setTimeout(()=>{frame=(frame+1)%4;renderFrame();schedule();},Number($('speed').value)*(frame===3?2:1));}
  function render(){
    stop();frame=0;const s=scenes[sceneKey];
    document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===sceneKey)));
    document.querySelectorAll('[data-mode]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.mode===mode));b.disabled=sceneKey==='push'&&b.dataset.mode==='numbers';});
    $('scene-title').textContent=s.title;$('stage').setAttribute('aria-label',s.description);
    $('scene-kicker').textContent=mode==='people'?'まずは、人で たしかめよう':mode==='numbers'?'同じ ばしょで、人から 数へ':'ことばと 矢印を 思い出そう';
    $('left-person').textContent=s.left+'人';$('right-person').textContent=s.right+'人';
    $('number-panel').hidden=sceneKey==='push'||mode==='people';$('mapping').hidden=mode==='quiz';$('quiz').hidden=mode!=='quiz';
    if(sceneKey!=='push'){$('left-number').textContent=s.a;$('right-number').textContent=s.b;$('operator').textContent=s.op;$('left-term').textContent=s.left+'数';$('right-term').textContent=s.right+'数';}
    $('basic-content').hidden=mode==='apply';$('application').hidden=mode!=='apply';
    if(mode==='apply'){$('scene-title').textContent='文の意味を たしかめよう';$('scene-kicker').textContent='ことばを使って、計算の関係を読もう';document.dispatchEvent(new CustomEvent('practice-enter',{detail:sceneKey}));}
    if(mode==='quiz'){newQuestion();}
    renderFrame();
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
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;if(mode==='apply'&&sceneKey==='push')sceneKey='multiply';questionIndex=0;render();}));
  document.addEventListener('practice-topic-changed',e=>{if(e.detail!=='all')sceneKey=e.detail;document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===e.detail)));});
  $('play').addEventListener('click',()=>{if(timer){stop();return;}$('play').textContent='Ⅱ とめる';$('play').setAttribute('aria-pressed','true');schedule();});
  $('step').addEventListener('click',()=>{stop();frame=(frame+1)%4;renderFrame();});
  $('restart').addEventListener('click',()=>{stop();frame=0;renderFrame();});
  $('speed').addEventListener('change',()=>{if(timer){clearTimeout(timer);schedule();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  reduced.addEventListener('change',renderFrame);
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
