'use strict';
window.createAdvancedUI = ({esc,listen,stopAudio,hasAudio,audioSignature,playStoryWord}) => {
 const D=window.PHONICS_ADVANCED, KEY='english-phonics-progress-v1', REVIEW='english-phonics-audio-v1';
 let progress={}, reviews={}, lesson=null, session=null, message='', teacherWord=null, reviewOpen=false;
 const heard=new Map();
 try{const x=JSON.parse(localStorage.getItem(KEY));if(x?.version===1&&x.lessons&&typeof x.lessons==='object')progress=Object.fromEntries(Object.entries(x.lessons).filter(([id,p])=>D.lessons.some(l=>l.id===id)&&p&&typeof p==='object'&&!Array.isArray(p)));}catch{}
 try{const x=JSON.parse(localStorage.getItem(REVIEW));if(x&&typeof x==='object'&&!Array.isArray(x))reviews=x;}catch{}
 const shuffle=a=>a.map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.v);
 let manual=false;
 const story=window.createPhonicsStory?.({esc,stopAudio,playWord:playStoryWord,onPractice:()=>{manual=true;document.body.classList.remove('story-mode');}});
 const current=()=>D.lessons.find(l=>l.id===lesson);
 function save(){try{localStorage.setItem(KEY,JSON.stringify({version:1,lessons:progress}));localStorage.setItem(REVIEW,JSON.stringify(reviews));message='';}catch{message='この端末に記録を保存できません。今の画面では続けられます。';}}
 const signature=w=>audioSignature('word:'+w);
 const ready=w=>hasAudio('word:'+w)&&reviews[w]===signature(w);
 const canListen=l=>l.words.every(ready);
 function spelling(w){
  if(w.grapheme.includes('…')){const v=w.grapheme[0],i=w.id.indexOf(v);return esc(w.id.slice(0,i))+'<mark>'+esc(v)+'</mark>'+esc(w.id.slice(i+1,-1))+'<mark>e</mark>';}
  const i=w.id.indexOf(w.grapheme);if(i<0)return esc(w.id);
  return esc(w.id.slice(0,i))+'<mark>'+esc(w.grapheme)+'</mark>'+esc(w.id.slice(i+w.grapheme.length));
 }
 function card(id){const w=D.words[id];return `<article class="explore-word"><h3 lang="en">${spelling(w)}</h3><p>${esc(w.ja)}</p>${listen('word:'+id,ready(id)?'単語を聞く':'音声を試聴')}<small>${ready(id)?'この端末で音声確認済み':'既存の合成音声・最終試聴確認待ち'}</small><details><summary>発音と確認先</summary><p>米語 /${esc(w.ipaUS)}/<br>英国の表記例 /${esc(w.ipaUK)}/</p><a href="${esc(w.dictionary)}" target="_blank" rel="noopener">辞書のお手本（米・英） ↗</a></details></article>`;}
 function overview(){return `<div class="page-heading"><div><p class="eyebrow">SOUND EXPLORER</p><h1>つづりと音の探検</h1><p>聞いて、気づいて、読んでみよう。<br>きまりは、音を予想する手がかりだよ。</p></div><div class="explore-emblem" aria-hidden="true">oo<span>♪</span>ow</div></div><aside class="explore-intro"><b>はじめてでも、だいじょうぶ。</b><p>文字の名前 → 英語の音 → 英語を読んでみよう、と戻りながら進めるよ。順番に全部できなくても、気になる探検を選べるよ。</p><button class="secondary" data-mode="sounds">基本の音を確かめる →</button></aside><div class="explore-map">${D.lessons.map((l,i)=>{const p=progress[l.id];return `<button class="explore-stop" data-explore="${l.id}"><span class="explore-number">${String(i+1).padStart(2,'0')}</span><span><small>${esc(D.kinds[l.kind])}</small><strong>${esc(l.title)}</strong><span>${p?.completed?'✓ 練習をひと回り':p?.answers?.length?'練習の続き・もう一度':'比べて発見しよう'}</span></span><span aria-hidden="true">→</span></button>`;}).join('')}</div><details class="explore-teacher"><summary>先生・保護者の方へ：教材と音声の確認状況</summary><p>9つの探検は規則・米語音素を資料で照合した限定版です。17語の既存合成音声は再利用しており、今回の全件の専門家による試聴は未完了です。音声を答えの根拠にする練習は、各探検の確認欄でお手本と照合してから利用できます。文字で考える練習は先に使えます。</p><p>126項目の初稿を、そのまま正答データにしていません。blood・breakなどの追加音声や、残りの規則は確認後に増やします。発音記号は大人向けの補助情報です。発音の地域差は誤答にしません。</p><ul>${D.sources.map(s=>`<li><a target="_blank" rel="noopener" href="${esc(s.url)}">${esc(s.title)}</a></li>`).join('')}</ul><a href="research/coverage.json">126項目の確認台帳</a> / <a href="research/pronunciation-evidence.json">米語発音の照合記録</a><p>記録はこのブラウザー内。音声・録音は旧版と共有し、旧版の学習記録には上書きしません。</p></details>`;}
 function reviewPanel(l){return `<details class="explore-teacher" ${reviewOpen?'open':''}><summary>先生・保護者の方へ：この探検の音声を確認</summary><p>辞書の米語のお手本と、実際に使う音声を聞き比べます。発音や語の対応に疑問があれば確認済みにせず、録音で差し替えてください。差し替え後は再確認が必要です。</p>${l.words.map(id=>`<div class="explore-review"><b lang="en">${esc(id)}</b>${listen('word:'+id,'使用する音声を試聴')}<a href="${esc(D.words[id].dictionary)}" target="_blank" rel="noopener">辞書で比較 ↗</a><button class="secondary" data-voice-word="${id}">録音・差し替え</button><button class="secondary" data-audio-confirm="${id}" ${ready(id)||heard.get(id)===signature(id)?'':'disabled'}>${ready(id)?'確認を取り消す':'最後まで試聴し、発音を照合した'}</button><span>${ready(id)?'確認済み':'確認待ち'}</span></div>`).join('')}<p>確認は音声ごと・端末ごとに保存します。標準音声のファイル更新や録音の差し替えで確認を解除します。</p></details>`;}
 function lessonPage(l){return `<button class="text-button" data-explore-back>← 探検を選ぶ</button><div class="page-heading"><div><p class="eyebrow">${esc(D.kinds[l.kind])}</p><h1>${esc(l.title)}</h1><p>先に知っておくこと：${esc(l.prerequisites)}</p></div></div><section class="lesson-sheet explore-sheet"><h2>① 聞いて、くらべよう</h2><div class="explore-words">${l.words.map(card).join('')}</div><div class="explore-rule"><h2>② 見つけた手がかり</h2><p>${esc(l.rule)}</p></div><aside class="explore-exception"><b>ここも、だいじ</b><p>${esc(l.exception)}</p></aside><h2>③ ためしてみよう</h2><p>はじめは文字を見ながら。まちがえたら、比べて聞き直そう。</p><div class="explore-actions"><button class="primary" data-explore-start="text">文字で考える（${l.questions.length}問） →</button>${l.kind==='C'?`<button class="secondary" data-explore-start="listen" ${canListen(l)?'':'disabled'}>音で分ける →</button>`:''}</div>${l.kind==='C'&&!canListen(l)?'<p class="small">音で分ける練習は、下の大人用確認欄で音声の発音を照合すると使えます。</p>':''}</section>${reviewPanel(l)}`;}
 function questionPage(l){
  if(session.mode==='listen'&&!canListen(l)){session=null;return lessonPage(l);}
  if(session.index>=session.queue.length){const p=progress[l.id]||{};return `<section class="lesson-sheet explore-summary"><p class="eyebrow">ひと回りできたね</p><h1>手がかりが、ひとつ増えた！</h1><p>最初の答えで合っていた問題：${session.firstCorrect} / ${session.queue.length}</p><p>比べ直したことも、大切な学び。これだけで発音を習得したという判定にはしないよ。</p><button class="primary" data-explore-again>もう一度、くらべる</button><button class="secondary" data-explore-back>別の探検へ →</button><p class="small">この探検の累計：${Number(p.runs)||0}回</p></section>`;}
  const item=session.queue[session.index],q=item.q,feedback=session.feedback,word=q.words[0];
  return `<button class="text-button" data-explore-again>← 単語の比較に戻る</button><section class="lesson-sheet explore-question"><p class="eyebrow">${esc(l.title)} ／ ${session.index+1} / ${session.queue.length}</p><h1>${session.mode==='listen'?'聞こえた単語の '+l.id+' は、どちらの音？':esc(q.prompt)}</h1>${session.mode==='listen'?listen('word:'+word,'問題の単語を聞く'):''}<div class="explore-choices">${item.options.map(o=>`<button class="secondary" data-explore-answer="${o.index}" ${feedback?.correct||(session.mode==='listen'&&!session.heard)?'disabled':''}>${esc(o.label)}</button>`).join('')}</div>${feedback?`<div class="explore-feedback ${feedback.correct?'correct':''}" role="status"><b>${feedback.correct?'そうだね！':'もう一度、くらべてみよう。'}</b><p>${esc(q.feedback)}</p><div class="explore-words">${q.words.map(card).join('')}</div>${feedback.correct?'<button class="primary" data-explore-next>次へ →</button>':'<p>お手本と説明を確かめて、もう一度選べるよ。</p>'}</div>`:'<p class="small">分からなくても大丈夫。答えたあと、比べるヒントが出るよ。</p>'}</section>`;
 }
 function start(mode){const l=current();if(mode==='listen'&&!canListen(l))return;session={mode,index:0,firstCorrect:0,queue:shuffle((mode==='listen'?l.questions.filter(q=>q.id.endsWith('-group')):l.questions).map(q=>({q,options:shuffle(q.options.map((label,index)=>({label,index}))),attempts:0}))),feedback:null,heard:false};}
 return {
  suspend(){story?.suspend();},
  mounted(){if(!manual)story?.mounted();},
  render(){if(story&&!manual)return story.render();const l=current();return `<button class="secondary story-practice-return" data-story-return>← 絵と音で、自動レッスンを見る</button><div class="explore">${message?`<p role="alert">${esc(message)}</p>`:''}${l?(session?questionPage(l):lessonPage(l)):overview()}</div>`;},
  currentTarget(){return 'word:'+(teacherWord||current()?.words[0]||'cut');},
  heard(key,playedSignature){if(!key.startsWith('word:'))return;const id=key.slice(5);if(!D.words[id]||playedSignature!==signature(id))return;heard.set(id,signature(id));if(session?.mode==='listen'&&session.queue[session.index]?.q.words[0]===id){session.heard=true;document.querySelectorAll('[data-explore-answer]').forEach(b=>b.disabled=!!session.feedback?.correct);}document.querySelectorAll(`[data-audio-confirm="${id}"]`).forEach(b=>b.disabled=false);},
  click(b){
   if(b.hasAttribute('data-story-return')){manual=false;return true;}
   if(story&&!manual)return story.click(b);
   if(b.closest('.explore-teacher'))reviewOpen=b.closest('.explore-teacher').open;
   if(b.dataset.explore){lesson=b.dataset.explore;session=null;teacherWord=null;reviewOpen=false;return true;}
   if(b.hasAttribute('data-explore-back')){lesson=null;session=null;return true;}
   if(b.hasAttribute('data-explore-again')){session=null;return true;}
   if(b.dataset.voiceWord){teacherWord=b.dataset.voiceWord;document.getElementById('teacher-open').click();return true;}
   if(b.dataset.audioConfirm){const id=b.dataset.audioConfirm;if(!ready(id)&&heard.get(id)!==signature(id))return true;if(ready(id))delete reviews[id];else reviews[id]=signature(id);save();return true;}
   if(b.dataset.exploreStart){start(b.dataset.exploreStart);return true;}
   if(b.hasAttribute('data-explore-answer')&&session&&!session.feedback?.correct){
    if(session.mode==='listen'&&!session.heard)return true;const l=current(),item=session.queue[session.index],q=item.q,correct=Number(b.dataset.exploreAnswer)===q.answer;
    if(item.attempts===0&&correct)session.firstCorrect++;
    item.attempts++;
    const p=progress[l.id] ||= {answers:[],runs:0};if(!Array.isArray(p.answers))p.answers=[];
    p.answers.push({question:q.id,correct,attempt:item.attempts,mode:session.mode,at:new Date().toISOString()});p.answers=p.answers.slice(-200);
    session.feedback={correct};save();return true;
   }
   if(b.hasAttribute('data-explore-next')&&session?.feedback?.correct){session.index++;session.feedback=null;session.heard=false;if(session.index===session.queue.length){const p=progress[lesson];p.completed=true;p.runs=(Number(p.runs)||0)+1;save();}return true;}
   return false;
  }
 };
};
