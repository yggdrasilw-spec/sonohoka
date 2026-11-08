'use strict';
window.createPhonicsStory = ({esc,playWord,stopAudio,onPractice}) => {
 const stories=window.PHONICS_STORIES,D=window.PHONICS_ADVANCED,images=window.PHONICS_STORY_IMAGES;
 const KEY='english-phonics-viewing-v1';
 let lesson=0,frame=0,started=false,paused=true,finished=false,controller=null,seen={},notice='',loading=false;
 try{const x=JSON.parse(localStorage.getItem(KEY));if(x?.version===1){if(Number.isInteger(x.lesson)&&x.lesson>=0&&x.lesson<stories.length)lesson=x.lesson;if(x.seen&&typeof x.seen==='object'&&!Array.isArray(x.seen))seen=Object.fromEntries(Object.entries(x.seen).filter(([id,date])=>stories.some(s=>s.id===id)&&typeof date==='string'));}}catch{}
 const current=()=>stories[lesson];
 const shot=()=>current().frames[frame];
 function save(){try{localStorage.setItem(KEY,JSON.stringify({version:1,lesson,seen}));notice='';}catch{notice='この端末に見た場所を保存できません。このまま見ることはできます。';}}
 function cancel(){controller?.abort();controller=null;stopAudio();}
 function suspend(){cancel();paused=true;}
 const delay=(ms,signal)=>new Promise(resolve=>{if(signal.aborted)return resolve(false);const done=ok=>{clearTimeout(timer);signal.removeEventListener('abort',aborted);resolve(ok);};const aborted=()=>done(false);const timer=setTimeout(()=>done(true),ms);signal.addEventListener('abort',aborted,{once:true});});
 function glyph(id){const w=D.words[id];let selected=[];if(w.grapheme.includes('…'))selected=[id.indexOf(w.grapheme[0]),id.length-1];else {const i=id.indexOf(w.grapheme);selected=Array.from({length:w.grapheme.length},(_,j)=>i+j);}
  return [...id].map((ch,i)=>`<span class="story-letter ${selected.includes(i)?'target':''} ${shot()?.effect==='add-e'&&i===id.length-1?'arriving-e':''}" style="--letter:${i}">${esc(ch)}</span>`).join('');}
 function art(id){const info=images.images[id];return `<div class="story-picture"><img src="${esc(info.src)}" alt="${esc(D.words[id].ja)}" data-story-image="${id}" decoding="async"><div class="story-fallback" data-story-fallback="${id}" hidden></div></div>`;}
 function word(id,i){return `<div class="story-word" data-story-word="${id}" style="--card:${i}">${art(id)}<div class="story-spelling" lang="en">${glyph(id)}</div><p>${esc(D.words[id].ja)}</p><span class="story-sound" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></div>`;}
 function player(){
  const s=current(),f=shot();
  if(finished)return `<div class="story-end"><p class="eyebrow">${Object.keys(seen).length===stories.length?'9つの探検を見たね':'探検は、ここまで'}</p><h1>きまりは、読むための手がかり。</h1><div class="story-finish-art">${art('moon')}${art('book')}</div><p>同じ音でも、つづりはいろいろ。<br>同じつづりでも、音はいろいろ。</p><button class="primary" data-story-action="restart">もう一度、はじめから見る</button><p class="small">見終わった記録です。発音を習得したという判定ではありません。</p></div>`;
  return `<div class="story-meta"><span>探検 ${lesson+1} / ${stories.length}</span><span>${frame+1} / ${s.frames.length}</span></div><div class="story-title"><h1>${esc(s.label)}</h1><span class="story-focus">${esc(s.focus)}</span></div><div class="story-stage ${f.effect?'effect-'+f.effect:''} ${f.words.length===1?'solo':'pair'}" data-story-frame="${lesson}:${frame}">${f.from?`<div class="story-before" lang="en">${esc(f.from)} <span aria-hidden="true">→</span></div>`:''}${f.words.map(word).join('')}${['same','different','change','join','exception'].includes(f.effect)?`<div class="story-relation" aria-hidden="true">${({same:'同じ音',different:'ちがう音',change:'音が変わる',join:'まとめて、ひとつ',exception:'単語で確かめよう'})[f.effect]}</div>`:''}</div><div class="story-caption" aria-live="polite" aria-atomic="true"><p>${esc(f.caption)}</p></div><progress class="story-progress" max="${s.frames.length}" value="${frame+1}" aria-label="この探検の進み具合"></progress>${!started?`<div class="story-start"><button class="primary" data-story-action="play">${Object.keys(seen).length||lesson?'ここから見る':'はじめから見る'} <span aria-hidden="true">▶</span></button><p>一度押すと、絵と音声が順に進みます。<br>画面を見ながら、ゆっくり聞いてね。</p></div>`:`<div class="story-controls"><button class="story-icon-button" data-story-action="replay" aria-label="今の探検を最初から見る">↺<span>もう一度</span></button><button class="primary" data-story-action="play">${paused?'▶ 続きを見る':'Ⅱ 一時停止'}</button><button class="story-icon-button" data-story-action="next" aria-label="次の探検へ">→<span>次の探検</span></button></div>${paused?'<p class="story-paused" role="status">止めています。今の場面から、もう一度聞けます。</p>':'<p class="story-playing" role="status">自動で進んでいます</p>'}`}`;
 }
 function extras(){return `<details class="story-options"><summary>探検を選ぶ・自分でためす</summary><label>見たいところから<select id="story-lesson-select">${stories.map((s,i)=>`<option value="${i}" ${i===lesson?'selected':''}>${i+1}. ${esc(s.label)}${seen[s.id]?'（見た）':''}</option>`).join('')}</select></label><button class="secondary" data-story-practice>自分で考える練習を開く →</button><button class="text-button" data-mode="sounds">基本の音を確かめる</button><details class="story-adult"><summary>先生・保護者の方へ</summary><p>英語の単語音声と、短い字幕で進みます。単語は既存の画像・録音を優先し、元の合成音声は専門家による全件試聴が未完了です。誤った音声に気づいたら、自分で考える練習の確認欄から先生の声に差し替えられます。</p><p>この視聴では採点しません。確認待ちの音声を使う聞き分け採点は、従来どおり停止しています。見た記録と、練習の正答記録は別です。別のタブへ移ると一時停止します。</p><a href="../docs/phonics-20261108/implementation.md">教材の範囲・音声・出典</a></details></details>`;}
 function bindImages(root){root.querySelectorAll('[data-story-image]').forEach(img=>{
  const fallback=()=>{img.hidden=true;const id=img.dataset.storyImage,box=img.nextElementSibling,index=images.fallback.words.indexOf(id);box.hidden=false;if(index>=0){box.className='story-fallback sprite';box.style.backgroundPosition=`${(index%4)*100/3}% ${Math.floor(index/4)*100/3}%`;box.setAttribute('role','img');box.setAttribute('aria-label',D.words[id].ja);}else{box.className='story-fallback textual';box.textContent=D.words[id].ja;}};
  img.addEventListener('error',fallback,{once:true});if(img.complete&&!img.naturalWidth)fallback();
 });const start=root.querySelector('.story-start [data-story-action="play"]');if(start){start.disabled=true;Promise.all([...root.querySelectorAll('.story-player img')].map(img=>img.decode().catch(()=>{}))).then(()=>{if(start.isConnected)start.disabled=false;});}}
 function paint(){const root=document.getElementById('phonics-story');if(!root)return;root.querySelector('.story-player').classList.toggle('is-paused',paused);root.querySelector('.story-player').innerHTML=player();const status=root.querySelector('.story-notice');status.textContent=notice;status.hidden=!notice;bindImages(root);const select=root.querySelector('#story-lesson-select');if(select){select.value=String(lesson);for(const option of select.options){const s=stories[Number(option.value)];option.textContent=(Number(option.value)+1)+'. '+s.label+(seen[s.id]?'（見た）':'');}}}
 async function waitImages(signal){const all=[...document.querySelectorAll('#phonics-story .story-player img')];return Promise.race([Promise.all(all.map(img=>img.decode().catch(()=>{}))).then(()=>true),delay(5000,signal)]);}
 async function run(){
  cancel();controller=new AbortController();const signal=controller.signal;paused=false;started=true;finished=false;notice='';paint();
  let primed=playWord('word:'+shot().words[0],signal);
  while(!signal.aborted){
   const f=shot();loading=true;await waitImages(signal);loading=false;if(signal.aborted)return;
   const startedAt=performance.now();
   for(const id of f.words){
    if(signal.aborted)return;
    const active=document.querySelector(`#phonics-story [data-story-word="${id}"]`);active?.classList.add('speaking');
    const okay=await (primed||playWord('word:'+id,signal));primed=null;active?.classList.remove('speaking');
    if(signal.aborted)return;
    if(!okay){paused=true;notice='音声を再生できませんでした。通信や音量を確認して「続きを見る」を押してください。';paint();return;}
    if(!await delay(850,signal))return;
   }
   // Time is governed by both natural audio completion and caption reading time.
   const minimum=Math.max(6200,Math.min(12000,f.caption.length*155));
   if(!await delay(Math.max(1400,minimum-(performance.now()-startedAt)),signal))return;
   if(frame+1<current().frames.length)frame++;
   else{seen[current().id]=new Date().toISOString();if(lesson+1<stories.length){lesson++;frame=0;save();}else{save();finished=true;paused=true;cancel();paint();return;}}
   paint();
  }
 }
 function select(index){if(!Number.isInteger(index)||index<0||index>=stories.length)return;suspend();lesson=index;frame=0;finished=false;save();paint();if(started)run();}
 document.addEventListener('change',e=>{if(e.target.id==='story-lesson-select'){select(Number(e.target.value));}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&!paused){suspend();paint();}});
 window.addEventListener('pagehide',suspend);
 return {
  render(){document.body.classList.add('story-mode');return `<section id="phonics-story" class="phonics-story"><p class="story-notice" role="alert" ${notice?'':'hidden'}>${esc(notice)}</p><div class="story-player ${paused?'is-paused':''}">${player()}</div><p class="story-audio-note">既存の単語音声を使った試聴レッスンです。音声の最終確認は待機中です。</p>${extras()}</section>`;},
  mounted(){const root=document.getElementById('phonics-story');if(root)bindImages(root);},
  suspend,
  click(b){if(b.hasAttribute('data-story-practice')){suspend();onPractice();return true;}const action=b.dataset.storyAction;if(!action)return false;if(action==='play'){if(!paused){suspend();paint();}else run();}else if(action==='replay'){frame=0;run();}else if(action==='next'){if(lesson+1<stories.length){lesson++;frame=0;save();run();}else{finished=true;suspend();paint();}}else if(action==='restart'){lesson=0;frame=0;run();}return 'stay';},
  state(){return {lesson,frame,paused,finished,loading,seen:{...seen}};}
 };
};
