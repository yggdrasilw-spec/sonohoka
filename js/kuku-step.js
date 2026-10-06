'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const app = $('#app');
  const key = 'kuku-small-steps-v1';
  const order = [5,2,3,4,6,7,8,9,1];
  const numberNames = ['','いち','に','さん','し','ご','ろく','しち','はち','く'];
  // 全81式の照合記録・出典は kuku_step_guide.md。８×３・８×４は促音のある形を初期値にする。
  const prefixes = [[],
    ['いんいち','いんに','いんさん','いんし','いんご','いんろく','いんしち','いんはち','いんく'],
    ['にいち','ににん','にさん','にし','にご','にろく','にしち','にはち','にく'],
    ['さんいち','さんに','さざん','さんし','さんご','さぶろく','さんしち','さんぱ','さんく'],
    ['しいち','しに','しさん','しし','しご','しろく','ししち','しは','しく'],
    ['ごいち','ごに','ごさん','ごし','ごご','ごろく','ごしち','ごは','ごっく'],
    ['ろくいち','ろくに','ろくさん','ろくし','ろくご','ろくろく','ろくしち','ろくは','ろっく'],
    ['しちいち','しちに','しちさん','しちし','しちご','しちろく','しちしち','しちは','しちく'],
    ['はちいち','はちに','はっさん','はっし','はちご','はちろく','はちしち','はっぱ','はっく'],
    ['くいち','くに','くさん','くし','くご','くろく','くしち','くは','くく']];
  function numRead(n) {
    const unit=['','いち','に','さん','し','ご','ろく','しち','はち','く'];
    return n<10?unit[n]:(Math.floor(n/10)===1?'じゅう':unit[Math.floor(n/10)]+'じゅう')+unit[n%10];
  }
  // 別の唱え方は東京書籍FAQと九九の覚え方の一覧で確認（kuku_step_guide.md参照）。
  const readingOptions={
    '3x2':[['さんにが','ろく'],['さにが','ろく']],
    '3x3':[['さざんが','く'],['さざんが','きゅう']],
    '3x6':[['さぶろく','じゅうはち'],['さんろく','じゅうはち']],
    '4x8':[['しは','さんじゅうに'],['しわ','さんじゅうに']],
    '8x3':[['はっさん','にじゅうし'],['はちさん','にじゅうし']],
    '8x4':[['はっし','さんじゅうに'],['はちし','さんじゅうに']]
  };
  function fact(a,b) {
    const selected=readingOptions[a+'x'+b]?.[state.readings[a+'x'+b]||0];
    return {a,b,value:a*b,start:selected?.[0]??prefixes[a][b-1]+(a*b<10?'が':''),answer:selected?.[1]??numRead(a*b)};
  }
  // 表示はひらがな。音声にはカタカナを渡し「ごは」などの「は」を助詞扱いさせない。
  // 式を読む際の助詞「は」は変換しないので、九九専用の入口で変換する。
  function speakChant(f,onEnd){
    const text=(f.start+'、'+f.answer).replace(/[ぁ-ゖ]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60));
    speak(text,onEnd);
  }
  function blankState(){return {intro:0,number:0,careful:0,challenge:0,dan:{},lastDan:5,fastSeconds:3,readings:{}};}
  let saveOK=true;
  function load(){
    try {
      const raw=JSON.parse(localStorage.getItem(key));
      if(!raw||typeof raw!=='object')return blankState();
      const st=blankState();
      for(const [k,max] of [['intro',9],['number',9],['careful',3],['challenge',6]])st[k]=Math.max(0,Math.min(max,Number.isInteger(raw[k])?raw[k]:0));
      if(order.includes(raw.lastDan))st.lastDan=raw.lastDan;
      if([3,5,10].includes(raw.fastSeconds))st.fastSeconds=raw.fastSeconds;
      for(const [id,options] of Object.entries(readingOptions)){
        const selected=raw.readings?.[id];
        if(Number.isInteger(selected)&&selected>=0&&selected<options.length)st.readings[id]=selected;
      }
      for(const a of order){const d=raw.dan?.[a];if(!d||typeof d!=='object')continue;
        st.dan[a]={forward:Math.min(4,Math.max(0,Number.isInteger(d.forward)?d.forward:0)),reverse:Math.min(4,Math.max(0,Number.isInteger(d.reverse)?d.reverse:0)),mastered:Array.isArray(d.mastered)?[...new Set(d.mastered.filter(n=>Number.isInteger(n)&&n>=1&&n<=9))]:[],randomDone:d.randomDone===true,session:validSession(d.session)};
      }
      return st;
    }catch{saveOK=false;return blankState();}
  }
  function validSession(s){
    if(!s||!Array.isArray(s.queue)||!Array.isArray(s.solved)||s.queue.length===0)return null;
    const all=[...s.queue,...s.solved];
    if(all.length!==9||new Set(all).size!==9||!all.every(n=>Number.isInteger(n)&&n>=1&&n<=9))return null;
    return {queue:[...s.queue],solved:[...s.solved]};
  }
  let state=load(),view='home',introIndex=state.intro;
  let challengeIndex=Math.min(state.challenge,5),challengeHidden=false,challengeRated=false;
  let numberIndex=Math.min(state.number,8),carefulIndex=Math.min(state.careful,2);
  let dan=state.lastDan,mode='forward',level=1,drillRevealed=new Set(),modelShown=false;
  let practiceTimer=null,speechRun=0,random=null,videoURL=null,videoName='',videoReady=false,videoSeen=false,videoDB=null;
  let routeVersion=0,speedChanged=false,readingsChanged=false;
  const sources=`<div class="sources"><p>教材・出典</p><p>練習の４段階と順・逆・ばらの流れは、提供された「５のだんおぼえよう」の35枚のスライドをもとにしています。三輪車５台・ライオン４ひき・タコ６ぴきの問題と３点の絵は、提供された「いっしゅんで こたえられる？」から使用しています。</p><p><a href="https://www.city.hannan.lg.jp/kakuka/syogai/syogai_s/bunkazai_shokai/bunkazai_arekore/1494826741043.html" target="_blank" rel="noopener">阪南市：寺子屋と読み・書き・そろばん</a> ／ <a href="https://crd.ndl.go.jp/reference/entry/index.php?id=1000088019&page=ref_view" target="_blank" rel="noopener">国立教育政策研究所教育図書館：昔の九九の読み方</a> ／ <a href="https://faq.tokyo-shoseki.co.jp/fa/customer/web/knowledge8282.html" target="_blank" rel="noopener">東京書籍：九九の唱え方には複数の形があります</a></p><p>寺子屋の絵はAIで生成したイメージです。うさぎ・車・テントの図はこの教材用の図です。</p></div>`;
  function save(){try{localStorage.setItem(key,JSON.stringify(state));saveOK=true;}catch{saveOK=false;}}
  function progress(a=dan){return state.dan[a]||(state.dan[a]={forward:0,reverse:0,mastered:[],randomDone:false});}
  function btn(text,action,cls='',disabled=false){return `<button ${cls?`class="${cls}"`:''} data-action="${action}" ${disabled?'disabled':''}>${text}</button>`;}
  function task(text){return `<div class="task"><b>いま、必ずやること</b>${text}</div>`;}
  function feedback(){return '<p class="feedback" id="feedback" role="status" aria-live="polite"></p>';}
  function tell(text,ok=true){const el=$('#feedback');if(el){el.className='feedback '+(ok?'ok':'error');el.textContent=text;}}
  function meter(n,max){return `<div class="meter" aria-label="${n} / ${max}">${Array.from({length:max},(_,i)=>`<span class="${i<n?'active':''}"></span>`).join('')}</div>`;}
  function stop(){speechRun++;if(practiceTimer){clearTimeout(practiceTimer);practiceTimer=null;}if('speechSynthesis' in window)window.speechSynthesis.cancel();app.querySelectorAll('.chant-row.active').forEach(el=>el.classList.remove('active'));const v=$('#schoolVideo');if(v)v.pause();}
  function mount(html,focus=true){routeVersion++;stop();app.classList.toggle('practice-view',view==='drill');app.innerHTML=html;const mystery=view==='intro'&&introIndex<2;$('.brand').innerHTML=mystery?'いっしゅんで<span>こたえられる？</span>':'九九の<span>小さなステップ</span>';document.title=mystery?'いっしゅんで こたえられる？':'九九の小さなステップ';if(focus){app.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});} }
  function backline(label){return `<div class="backline">${btn('← 学びの地図','home','quiet')}<span class="eyebrow">${label}</span>${btn('先生の準備','teacher','quiet')}</div>`;}
  function speak(text,onEnd){
    if(!('speechSynthesis' in window)){tell('音声が使えないブラウザです。画面の読み方を見て、声に出そう。',false);if(onEnd)onEnd();return;}
    window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';u.rate=.7;
    const voice=window.speechSynthesis.getVoices().find(v=>/^ja/.test(v.lang));if(voice)u.voice=voice;
    u.onend=()=>onEnd?.();u.onerror=()=>{tell('音声を再生できませんでした。画面の読み方を使おう。',false);onEnd?.();};window.speechSynthesis.speak(u);
  }
  function home(){view='home';
    const completed=order.filter(a=>progress(a).mastered.length===9).length;
    mount(`<section class="hero"><div><div class="eyebrow">九九を知る → 唱える → 思い出す</div><h1>たくさんの数を、<br>ぱっと言える魔法。</h1><p class="lead">そのひみつは「九九」。<br>ひとつずつ練習して、魔法を使えるようになろう。</p><div class="actions">${btn(state.intro?'導入のつづきから':'魔法のひみつを見つける','intro')}${btn('自習のつづきから','resume','quiet')}</div></div><div class="hero-art" aria-hidden="true"><strong>５×７</strong><span>ごしち さんじゅうご</span><strong>35</strong></div></section><div class="steps">${btn(`<span class="num">1</span><span><h3>魔法のひみつを見つける</h3><small>難しい！ → 学校の動画 → 九九 → 寺子屋 → 読み方</small></span><span class="arrow">→</span>`,'intro','step-link')}${btn(`<span class="num">2</span><span><h3>５のだんから、唱えよう</h3><small>見て・隠して・式だけ・何も見ずに。順 → 逆 → ばら。</small></span><span class="arrow">→</span>`,'map','step-link')}${btn(`<span class="num">3</span><span><h3>魔法を使ってみよう</h3><small>うさぎ・三輪車・車・タコ・テント。全部の数を求めよう。</small></span><span class="arrow">→</span>`,'application','step-link')}</div><p class="save-note">すぐ思い出せた記録：${completed} / 9 のだん。${saveOK?'練習の進み具合は、このブラウザに保存します。':'このブラウザでは記録を保存できません。画面を閉じると進み具合が消えます。'}</p><div class="actions">${btn('先生・おうちの方へ','teacher','quiet')}</div><details><summary>教材と出典</summary>${sources}</details>`);
  }
  const introTitles=['ぱっと見て、言えるかな？','学校の先ぱい・先生は、どうかな？','ひみつは「九九」！','昔の子どもたちも、学んでいた','みんなも、覚えていこう！','九九には、唱え方がある','数字の読み方を知ろう','４・７・９に気をつけよう','５のだんから始めるよ','見て、隠して、唱えよう'];
  function introNext(){introIndex=Math.min(9,introIndex+1);state.intro=Math.max(state.intro,introIndex);save();intro();}
  function intro(){view='intro';let body='';
    if(introIndex===0){
      const c=scenes[challengeIndex];
      body=task(`${c.question} ぱっと見て、声に出してみよう。`)+`<div class="stage"><span class="tag">チャレンジ ${challengeIndex+1} / ${scenes.length}</span><h2>${c.question}</h2><p>${c.countText}</p>${challengeHidden?'<div class="hidden-card"><strong>全部で、いくつだったかな？</strong></div>':sceneHTML(c)}<p class="caption">すぐに言えなくても、だいじょうぶ。</p><div class="actions center">${btn(challengeHidden?'もう一度見る':'絵を隠してみる','challenge-hide','quiet')}</div><p>やってみて、どうだった？</p><div class="choices">${btn('むずかしい！','challenge-rate')}${btn('言えた！','challenge-rate','quiet')}</div>${feedback()}${challengeRated?`<div class="actions center">${btn(challengeIndex<5?'次の問題へ':'先ぱい・先生を見てみよう','challenge-next')}</div>`:''}</div>`;
    }else if(introIndex===1){
      body=task('動画を見よう。「どうして、そんなに早く分かるの？」と、ひみつを聞こう。')+`<div class="stage"><p class="lead">同じ問題なのに、すぐに答えている！</p>${videoURL?`<video id="schoolVideo" class="school-video" src="${videoURL}" controls playsinline preload="metadata"></video><p class="caption">学校で撮った動画：<span id="videoName"></span></p><p id="videoStatus" class="caption">実演とインタビューを、最後まで見よう。</p><div id="interviewQuestion" ${videoSeen?'':'hidden'}><h3>どうやって数を求めていた？</h3><div class="choices">${btn('九九を使っていた','video-answer')}${btn('あてずっぽう','video-wrong','quiet')}</div></div>`:`<div class="video-empty"><strong>ここで、あなたの学校の動画を見ます。</strong><p>先生に「動画を選ぶ」を押してもらおう。</p>${btn('先生：学校の動画を選ぶ','teacher')}</div><p class="caption">自習の練習画面は「学びの地図」から使えます。</p>`}${feedback()}<div id="videoNext" hidden>${btn('魔法のひみつが分かった！','intro-next')}</div></div>`;
    }else if(introIndex===2){body=task('「九九」を声に出して言おう。覚えたら、同じ数のまとまりをすぐ数えられるよ。')+`<div class="stage"><div class="magic-word">九九<span>くく</span></div><p class="lead">先ぱいも、先生も、覚えて使っている<br>「魔法の言葉」だよ。</p><p>ひとつずつ数えなくても、<br>全部の数をすぐ思い出せるようになるよ。</p>${btn('「くく」と言った！','intro-next')}</div>`;
    }else if(introIndex===3){body=task('絵を見よう。昔の子どもたちは、どこで勉強しているかな？')+`<figure class="history-image"><img src="img/kuku/terakoya.png" alt="江戸時代の寺子屋で、着物を着た子どもたちが先生と学ぶイメージ"><figcaption>江戸時代の寺子屋のイメージ（AI生成）</figcaption></figure><div class="stage"><h2>日本で、昔から伝わる覚え方</h2><p class="lead">江戸時代の寺子屋では、<br>読み・書き・そろばんを学んでいたよ。</p><p>九九も、昔から使われてきたんだ。<br>３年生以上の先ぱいも、先生も、<br>九九を覚えて使っているよ。</p>${btn('昔の人も学んでいたんだね','intro-next')}</div>`;
    }else if(introIndex===4){body=task('これからの目標を読もう。「九九を覚えて、魔法を使おう！」')+`<div class="stage"><p class="congrats" aria-hidden="true">✦</p><h2>みんなも、覚えていこう！</h2><p class="lead">最初から、すぐに言えなくていい。<br>見て、唱えて、少しずつ覚えよう。</p>${btn('やってみよう！','intro-next')}</div>`;
    }else if(introIndex===5){body=task('式の読み方と、九九の唱え方を聞きくらべよう。自分でも声に出そう。')+`<div class="stage"><div class="equation">５ × ３ ＝ １５</div><div class="split"><section><p class="tag">式を読むとき</p><p class="reading">ご かける さん は<br>じゅうご</p>${btn('式を聞く','speak-expression','quiet')}</section><section><p class="tag">九九を唱えるとき</p><p class="reading">ごさん<br>じゅうご</p>${btn('九九を聞く','speak-chant','quiet')}</section></div><p>九九は、短い言葉でリズムよく覚えるよ。</p><div class="actions center">${btn('声に出してくらべた！','intro-next')}</div></div>`;
    }else if(introIndex===6){body=numberPractice();
    }else if(introIndex===7){body=carefulPractice();
    }else if(introIndex===8){body=task('５のだんは、答えが５ずつ増えるよ。声に出して数えよう。')+`<div class="stage"><div class="five-groups">${Array.from({length:9},(_,i)=>`<div><div class="dots">${'<i class="dot"></i>'.repeat(5)}</div><strong>${5*(i+1)}</strong></div>`).join('')}</div><p class="reading">５、１０、１５、２０、２５、<br>３０、３５、４０、４５</p>${btn('５ずつ数えた！','intro-next')}</div>`;
    }else{body=task('覚え方を確認しよう。まず９つを、順番にひとまとまりで唱えるよ。')+`<div class="stage"><ol class="learn-plan"><li><strong>見て唱える</strong><span>読み方と答えを見て、声に出す。</span></li><li><strong>答えを隠して唱える</strong><span>思い出して言い、答えをたしかめる。</span></li><li><strong>式だけで唱える</strong><span>読み方も隠して、数字の式から思い出す。</span></li><li><strong>何も見ずに唱える</strong><span>９つを続けて、声に出す。</span></li></ol><p class="lead">「順」も「逆」もできたら、<br>１問ずつ「ばらばら」に挑戦！</p><p>最後は、式を見たらすぐ九九が頭に浮かぶ。<br>これで、魔法の完成！</p>${btn('５のだんを練習する','start-five')}</div>`;}
    mount(`${backline('導入 '+(introIndex+1)+' / 10')}${meter(introIndex+1,10)}<h1>${introTitles[introIndex]}</h1>${body}<div class="actions">${introIndex>0?btn('← ひとつ前へ','intro-prev','quiet'):''}</div>`);
    if(introIndex===1&&videoURL){$('#videoName').textContent=videoName;const v=$('#schoolVideo');v.addEventListener('loadedmetadata',()=>videoReady=true);v.addEventListener('ended',()=>{videoSeen=true;$('#interviewQuestion').hidden=false;$('#videoStatus').textContent='インタビューで聞いたひみつを、選ぼう。';});v.addEventListener('error',()=>tell('この動画は再生できません。先生に別の動画を選んでもらおう。',false));}
  }
  function numberPractice(){const n=numberIndex+1,opts=n===4?['よん','し']:n===7?['なな','しち']:n===9?['きゅう','く']:[numberNames[n],numberNames[n%9+1]];return task(`九九で「${n}」をどう読むかな？ 声に出して、選ぼう。`)+`<div class="stage"><span class="tag">読み方 ${n} / 9</span><div class="numberbig">${n}</div><div class="choices">${opts.map(o=>btn(o,'number:'+o)).join('')}</div>${feedback()}<div id="numberNext" hidden>${btn(n===9?'４・７・９をもう一度':'次の数字へ','number-next')}</div><p class="caption">「よん」「なな」「きゅう」も、ふだんの数字の読み方では正しいよ。<br>この九九の練習では「し」「しち」「く」を使おう。</p></div>`;}
  function carefulPractice(){const n=[4,7,9][carefulIndex],wrong={4:'よん',7:'なな',9:'きゅう'};return task('要注意の３つを、もう一度。九九で使う読み方を選ぼう。')+`<div class="careful-strip"><span>４ → <b>し</b></span><span>７ → <b>しち</b></span><span>９ → <b>く</b></span></div><div class="stage"><span class="tag">要注意 ${carefulIndex+1} / 3</span><div class="numberbig">${n}</div><div class="choices">${btn(wrong[n],'careful:'+wrong[n],'quiet')}${btn(numberNames[n],'careful:'+numberNames[n])}</div>${feedback()}<div id="carefulNext" hidden>${btn(carefulIndex===2?'５のだんへ':'次をたしかめる','careful-next')}</div></div>`;}
  function svg(body,label){return `<svg viewBox="0 0 140 110" role="img" aria-label="${label}">${body}</svg>`;}
  const rabbit=()=>svg('<ellipse cx="52" cy="30" rx="11" ry="27" fill="#fff" stroke="#775640" stroke-width="3"/><ellipse cx="88" cy="30" rx="11" ry="27" fill="#fff" stroke="#775640" stroke-width="3"/><ellipse cx="70" cy="78" rx="44" ry="30" fill="#fff" stroke="#775640" stroke-width="3"/><circle cx="55" cy="74" r="4" fill="#233932"/><circle cx="85" cy="74" r="4" fill="#233932"/><path d="M64 86h12l-6 7z" fill="#eb9090"/>','耳が２本あるうさぎ');
  // 上から見た車にして、４つのタイヤを同時に見せる。
  const car=()=>svg('<rect x="37" y="14" width="14" height="25" rx="5" fill="#233932"/><rect x="89" y="14" width="14" height="25" rx="5" fill="#233932"/><rect x="37" y="74" width="14" height="25" rx="5" fill="#233932"/><rect x="89" y="74" width="14" height="25" rx="5" fill="#233932"/><rect x="48" y="4" width="44" height="102" rx="17" fill="#e9b957" stroke="#775640" stroke-width="3"/><rect x="53" y="28" width="34" height="18" rx="4" fill="#b0d9d8"/><rect x="53" y="67" width="34" height="17" rx="4" fill="#b0d9d8"/>','上から見た車。タイヤが４つ');
  const tent=()=>svg('<path d="M6 101L70 7l64 94z" fill="#e9b957" stroke="#775640" stroke-width="3"/><path d="M35 101L70 42l35 59z" fill="#fff4d4"/>','９人が入るテント');
  const scenes=[
    {id:'octopus',a:8,b:6,noun:'タコ',part:'足',unit:'本',question:'タコの足は、全部で何本？',countText:'タコは６ぴき。１ぴきの足は８本だよ。',img:'octopus.jpg'},
    {id:'tricycle',a:3,b:5,noun:'三輪車',part:'タイヤ',unit:'こ',question:'三輪車のタイヤは、全部で何こ？',countText:'三輪車は５台。１台にタイヤが３こあるよ。',img:'tricycle.png'},
    {id:'lion',a:4,b:4,noun:'ライオン',part:'足',unit:'本',question:'ライオンの足は、全部で何本？',countText:'ライオンは４ひき。１ぴきの足は４本だよ。',img:'lion.png'},
    {id:'rabbit',a:2,b:9,noun:'うさぎ',part:'耳',unit:'本',question:'うさぎの耳は、全部で何本？',countText:'うさぎは９ひき。１ぴきに耳が２本あるよ。',draw:rabbit},
    {id:'car',a:4,b:7,noun:'車',part:'タイヤ',unit:'こ',question:'車のタイヤは、全部で何こ？',countText:'車は７台。１台にタイヤが４こあるよ。',draw:car},
    {id:'tent',a:9,b:6,noun:'テント',part:'人',unit:'人',question:'テントの人は、全部で何人？',countText:'テントは６つ。どのテントにも９人いるよ。',draw:tent}
  ];
  function sceneHTML(c,dots=false){return `<div class="scene" aria-label="${c.countText}">${Array.from({length:c.b},()=>`<div class="object">${dots?`<div class="dots">${'<i class="dot"></i>'.repeat(c.a)}</div>`:c.img?`<img src="img/kuku/${c.img}" alt="${c.noun}">`:c.draw()}${c.id==='tent'?'<span class="object-label">９人</span>':''}</div>`).join('')}</div>`;}
  function map(){view='map';mount(`${backline('自習の練習')}<div class="eyebrow">まずは５のだん。自分のペースで。</div><h1>どのだんを練習する？</h1>${task('だんを選ぼう。読み方を見て唱え、少しずつ隠していこう。')}<div class="dans">${order.map(a=>{const p=progress(a);return btn(`<strong>${a}のだん ${p.mastered.length===9?'✦':''}</strong><small>順：${p.forward}/4 段階　逆：${p.reverse}/4 段階<br>すぐ思い出せた：${p.mastered.length}/9</small>`,'dan:'+a,'dan-card');}).join('')}</div><p class="caption">おすすめの順番：５ → ２ → ３ → ４ → ６ → ７ → ８ → ９ → １。<br>途中でも「学びの地図」に戻れます。終わったステップから再開できます。</p>${btn('４・７・９の読み方を復習','review-readings','quiet')}`);}
  function startDan(a){dan=a;state.lastDan=a;save();const p=progress();if(p.forward<4){mode='forward';level=p.forward+1;}else if(p.reverse<4){mode='reverse';level=p.reverse+1;}else{startRandom();return;}drillRevealed.clear();modelShown=false;drill();}
  const levelNames=['','見て唱える','答えを隠して唱える','式だけで唱える','何も見ずに唱える'];
  function drill(focus=true){view='drill';const p=progress(),seq=Array.from({length:9},(_,i)=>mode==='forward'?i+1:9-i),allRevealed=modelShown||level===1;
    const rows=seq.map((b,index)=>{const f=fact(dan,b),reveal=allRevealed||drillRevealed.has(b);return `<div class="chant-row" data-b="${b}"><span class="chant-index" aria-label="唱える順番 ${index+1}">${index+1}</span><span class="row-equation">${dan} × ${b} ＝ ${reveal?f.value:'？'}</span>${level<=2||reveal?`<span class="row-reading">${f.start} ${reveal?f.answer:'？'}</span>`:''}<div class="row-actions">${level===2&&!reveal?btn('たしかめる','reveal-row:'+b,'quiet'):reveal?btn('▶ 聞く','speak-row:'+b,'quiet'):''}${level===2&&drillRevealed.has(b)&&!modelShown?btn('隠す','hide-row:'+b,'quiet'):''}</div></div>`;}).join('');
    const hidden=level===4&&!modelShown;
    const instructions=level===1?'読み方を見て、９つを続けて声に出そう。':level===2?'答えを隠した９つを続けて唱えよう。迷ったところは、答えをたしかめてもう一度。':level===3?'数字の式だけを見て、９つを続けて唱えよう。':`何も見ずに、${mode==='forward'?'１つ分から９つ分まで':'９つ分から１つ分まで'}続けて唱えよう。`;
    mount(`${backline('自習 / '+dan+'のだん')}<h1>${dan}のだんを、${mode==='forward'?'順番':'逆の順番'}に</h1><div class="toggle">${btn('順：１ → ９','mode:forward',mode==='forward'?'':'quiet')}${btn('逆：９ → １','mode:reverse',mode==='reverse'?'':'quiet',p.forward<4)}${btn('ばらばら','random','quiet',p.forward<4||p.reverse<4)}</div><div class="levels">${[1,2,3,4].map(l=>btn(`レベル${l}<br>${levelNames[l]}`,'level:'+l,l===level?'current':l<=p[mode]?'completed':'',l>p[mode]+1)).join('')}</div>${task(instructions)}<div class="stage"><span class="tag">レベル${level}：${levelNames[level]}</span>${hidden?'<div class="hidden-card"><h2>９つ、続けて唱えよう。</h2><p>読み方も、式も、答えも隠してあるよ。</p></div>':`<p class="reading-order"><span class="wide-order">①②③と上から下へ。次に右の列へ進もう。</span><span class="narrow-order">①から⑨まで、上から順に唱えよう。</span></p><div class="chant-rows">${rows}</div>`}<div class="actions center">${btn('▶ 見本を続けて聞く','drill-listen','quiet')}${btn('■ 音声を止める','stop','quiet')}${level>1?btn(modelShown||drillRevealed.size?'もう一度、隠して唱える':'見本を見てたしかめる',modelShown||drillRevealed.size?'drill-hide':'drill-model','quiet'):''}</div><p class="caption">音声のあと、自分の声でも９つを続けて唱えよう。<br>「言えた」は、自分や先生が唱え方をたしかめて押します。</p>${modelShown||drillRevealed.size?'<p class="scene-note">見本を使ったら、もう一度隠してから唱えよう。</p>':''}<div class="choices">${btn('もう一度練習する','drill-retry','quiet')}${btn('９つ、続けて言えた ✓','drill-pass','',level>1&&(modelShown||drillRevealed.size>0))}</div>${feedback()}</div><p class="caption">順のレベル４ → 逆のレベル４ → ばらばらの順に進みます。<br>声の自動判定は行いません。答えの正しさは、ばらばらの入力練習でたしかめます。</p>`,focus);
  }
  function toggleRow(b,show){
    if(level!==2||modelShown)return;
    if(show)drillRevealed.add(b);else drillRevealed.delete(b);
    drill(false);
    app.querySelector(`[data-b="${b}"] [data-action="${show?'hide-row':'reveal-row'}:${b}"]`)?.focus({preventScroll:true});
  }
  function listenDrill(){modelShown=true;drill();const seq=Array.from({length:9},(_,i)=>mode==='forward'?i+1:9-i),run=++speechRun;let i=0;
    const next=()=>{if(run!==speechRun||view!=='drill')return;app.querySelectorAll('.chant-row').forEach(el=>el.classList.remove('active'));if(i>=9)return;const f=fact(dan,seq[i++]),row=app.querySelector(`[data-b="${f.b}"]`);row?.classList.add('active');row?.scrollIntoView({block:'nearest'});speakChant(f,()=>{if(run===speechRun)practiceTimer=setTimeout(next,650);});};next();
  }
  function drillPass(){if(level>1&&(modelShown||drillRevealed.size))return;const p=progress();p[mode]=Math.max(p[mode],level);save();const completedLevel=level;
    if(level<4){level++;drillRevealed.clear();modelShown=false;drill();tell(`レベル${completedLevel}をたしかめた！ 少し隠して、もう一度。`);}
    else if(mode==='forward'){mode='reverse';level=p.reverse<4?p.reverse+1:1;modelShown=false;drillRevealed.clear();drill();tell('順番に言えた！ 今度は、逆の順番で。');}
    else{startRandom();}
  }
  function shuffle(arr){const result=[...arr];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
  function saveRandom(){progress().session=random.queue.length?{queue:[...random.queue],solved:[...random.solved]}:null;save();}
  function startRandom(){if(progress().forward<4||progress().reverse<4)return;const session=validSession(progress().session);random={queue:session?session.queue:shuffle([1,2,3,4,5,6,7,8,9]),solved:session?session.solved:[],hint:false,submitted:false,attempts:0,start:0,elapsed:0,started:false};saveRandom();randomScreen();if(session)tell('残りの問題から再開したよ。式を出して、声に出そう。');}
  function randomScreen(){view='random';if(!random.queue.length){progress().randomDone=true;progress().session=null;save();randomFinish();return;}const b=random.queue[0];
    mount(`${backline('自習 / '+dan+'のだん / ばらばら')}<h1>式から、ぱっと九九を！</h1>${meter(random.solved.length,9)}${task('「式を出す」を押そう。出てきた式の九九を声に出して、答えを入れよう。')}<div class="stage"><span class="tag">${random.solved.length} / 9 問たしかめた</span><div id="randomProblem" hidden><div class="equation">${dan} × ${b} ＝ ？</div><form id="answerForm"><div class="control"><label for="answer">答え</label><input id="answer" type="text" inputmode="numeric" pattern="[0-9０-９]*" maxlength="2" autocomplete="off"><button type="submit">答えをたしかめる</button></div></form><div class="actions center">${btn('唱え方のヒントを見る','random-hint','quiet')}</div><div id="randomHint" hidden class="reading"></div></div><div id="randomStart"><p class="lead">式を見たら、九九がすぐ頭に浮かぶかな？</p>${btn('式を出す','random-show')}</div>${feedback()}<div id="randomRate" hidden><p id="answerReading" class="reading"></p><p>九九の唱え方も、すぐ思い出せた？</p><div class="choices">${btn('すぐ唱えられた！','random-rate:yes')}${btn('まだ・少し迷った','random-rate:no','quiet')}</div></div><p class="caption">迷った問題は、あとでもう一度出ます。<br>速さの目安：${state.fastSeconds}秒。急がず覚えてから、少しずつ速くしよう。</p></div>`);
    $('#answerForm').addEventListener('submit',e=>{e.preventDefault();submitAnswer();});random.started=false;random.submitted=false;random.hint=false;random.start=0;
  }
  function submitAnswer(){if(!random.started||random.submitted)return;const raw=$('#answer').value.replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xfee0)).trim();const f=fact(dan,random.queue[0]);
    if(!/^\d{1,2}$/.test(raw)){tell('答えを数字で入れよう。',false);return;}
    if(Number(raw)!==f.value){random.hint=true;progress().mastered=progress().mastered.filter(x=>x!==f.b);save();tell('もう一度考えよう。唱え方のヒントを使ってもいいよ。',false);$('#answer').select();return;}
    random.submitted=true;random.elapsed=(performance.now()-random.start)/1000;random.attempts++;
    $('#answerForm').querySelector('button').disabled=true;$('#answer').disabled=true;$('#randomRate').hidden=false;$('#answerReading').textContent=f.start+' '+f.answer;const hintButton=app.querySelector('[data-action="random-hint"]');hintButton.disabled=true;
    tell(`答えは${f.value}。正解！ 約${random.elapsed.toFixed(1)}秒で答えられたよ。`);
  }
  function rateRandom(yes){if(!random.submitted)return;const b=random.queue.shift(),p=progress(),fast=yes&&!random.hint&&random.elapsed<=state.fastSeconds;
    if(fast){if(!p.mastered.includes(b))p.mastered.push(b);}else{p.mastered=p.mastered.filter(x=>x!==b);}
    if(yes&&!random.hint){if(!random.solved.includes(b))random.solved.push(b);}else{const gap=Math.min(3,random.queue.length);random.queue.splice(gap,0,b);}
    saveRandom();randomScreen();if(view==='random'&&!fast&&yes)tell('唱えられた！ 次はもっとすぐ思い出せるように、また練習しよう。');
  }
  function randomFinish(){const p=progress(),complete=p.mastered.length===9;view='finish';mount(`${backline('自習 / '+dan+'のだん')}<div class="stage"><p class="congrats">${complete?'✦ 魔法の完成！':'９問、唱えられた！'}</p><h1>${dan}のだんを、思い出せたね。</h1><p class="lead">すぐ思い出せた記録：${p.mastered.length} / 9</p><p>${complete?'式を見て、答えと唱え方がすぐ浮かんだね。':'時間をかけて覚えた問題もあるよ。もう一度、少しずつ練習しよう。'}</p><p class="caption">答えの入力と、自分・先生による「唱えられた」の確認をもとにした記録です。</p><div class="actions center">${btn('ばらばらをもう一度','random')}${btn('魔法を使ってみる','application','quiet')}${btn('ほかのだんへ','map','quiet')}</div></div>`);}
  let applyIndex=0,applyStep=0,applyDots=false,applyDone=false;
  function application(){view='application';const c=scenes[applyIndex];const prompts=['１つ分の数はいくつ？','いくつ分ある？','「１つ分の数 × いくつ分」の式を選ぼう。','九九を使って、全部の数を求めよう。'];
    const opts=applyStep===2?[`${c.a} × ${c.b}`,`${c.a} ＋ ${c.b}`,`${c.a} − ${c.b}`]:[];
    mount(`${backline('魔法を使う / '+(applyIndex+1)+'問目')}<h1>${c.question}</h1>${task(prompts[applyStep])}<div class="stage"><span class="tag">ステップ ${applyStep+1} / 4</span><p class="lead">${c.countText}</p>${sceneHTML(c,applyDots)}<div class="actions center">${btn(applyDots?'絵に戻す':'１つ分を丸で見る','application-dots','quiet')}</div>${applyStep>=1?`<p class="scene-note">１つ分：${c.a}${c.unit}</p>`:''}${applyStep>=2?`<p class="scene-note">いくつ分：${c.b}つ分</p>`:''}${applyStep===3?`<div class="equation">${c.a} × ${c.b} ＝ ？</div>`:''}${applyStep===2?`<div class="choices">${opts.map((o,i)=>btn(o,'application-formula:'+i)).join('')}</div>`:`<form id="applicationForm"><div class="control"><label for="sceneAnswer">${applyStep===3?'全部の数':'数'}</label><input id="sceneAnswer" type="text" inputmode="numeric" maxlength="2" autocomplete="off"><span>${applyStep===1?'つ分':c.unit}</span><button type="submit">たしかめる</button></div></form>`}${feedback()}<div id="applicationNext" hidden>${btn(applyStep===3?(applyIndex===5?'学びの地図へ':'次の場面へ'):'次のステップへ','application-next')}</div></div>`);
    applyDone=false;$('#applicationForm')?.addEventListener('submit',e=>{e.preventDefault();const raw=$('#sceneAnswer').value.replace(/[０-９]/g,x=>String.fromCharCode(x.charCodeAt(0)-0xfee0)).trim();const expected=applyStep===0?c.a:applyStep===1?c.b:c.a*c.b;if(/^\d{1,2}$/.test(raw)&&Number(raw)===expected){applyDone=true;$('#applicationNext').hidden=false;tell(applyStep===3?`${fact(c.a,c.b).start} ${fact(c.a,c.b).answer}。全部で${expected}${c.unit}！`:'その通り！ 次のステップへ進もう。');$('#sceneAnswer').disabled=true;$('#applicationForm button').disabled=true;}else tell('絵と問題の言葉を、もう一度見よう。',false);});
  }
  async function db(){if(videoDB)return videoDB;videoDB=await new Promise((resolve,reject)=>{const r=indexedDB.open('kuku-school-video-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('video');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return videoDB;}
  async function videoStore(value){const d=await db();await new Promise((resolve,reject)=>{const tx=d.transaction('video','readwrite');if(value)tx.objectStore('video').put(value,'school');else tx.objectStore('video').delete('school');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
  async function restoreVideo(){const version=routeVersion;try{const d=await db();const value=await new Promise((resolve,reject)=>{const r=d.transaction('video').objectStore('video').get('school');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});if(value?.blob instanceof Blob&&!videoURL){videoURL=URL.createObjectURL(value.blob);videoName=typeof value.name==='string'?value.name:'学校の動画';if(view==='intro'&&introIndex===1&&version===routeVersion)intro();}}catch{/* file://や保存制限下でも、その場で選べる */}}
  async function chooseVideo(file){if(!file)return;if(!file.type.startsWith('video/')&&!/\.(mp4|webm|mov|m4v)$/i.test(file.name)){ $('#videoSaveStatus').textContent='動画ファイルを選んでください。';return; }
    stop();if(videoURL)URL.revokeObjectURL(videoURL);videoURL=URL.createObjectURL(file);videoName=file.name;videoSeen=false;videoReady=false;$('#videoSaveStatus').textContent='動画を選びました。この端末で再生します。';
    try{await videoStore({blob:file,name:file.name});if($('#videoSaveStatus'))$('#videoSaveStatus').textContent='このブラウザに動画を保存しました。次に開いたときも使えます。';}catch{if($('#videoSaveStatus'))$('#videoSaveStatus').textContent='動画はこの画面で再生できます。ブラウザに保存できなかったので、次回はもう一度選んでください。';}
    if(view==='intro'&&introIndex===1)intro();
  }
  function teacher(){speedChanged=false;
    $('#teacherContent').innerHTML=`<p>導入は授業で、自習画面は児童の端末で使う構成です。</p><h3>学校の動画を準備する</h3><ol class="teacher-list"><li>この学校の３年生以上の児童、または先生に、同じ場面問題を見せる。</li><li>「全部でいくつ？」にすぐ答える様子を撮る。例：三輪車５台のタイヤ15こ、タコ６ぴきの足48本。</li><li>続けて「なんで、こんなにできるの？」「どうやってやったの？」とインタビューする。</li><li>「九九を使っています」という説明を、本人の言葉で聞く。必要なら「何を使って考えた？」とたずねる。</li><li>実演とインタビューが入った１本の動画を、下で選ぶ。導入の２画面目で見せる。</li></ol><label class="file-label">学校で撮った動画を選ぶ<input id="videoFile" type="file" accept="video/*,.mp4,.webm,.mov,.m4v"></label><p id="videoSaveStatus" class="save-note" role="status">動画は選んだ端末・ブラウザにだけ保存します。外部にアップロードしません。未登録なら導入２で待ちます。</p><div class="actions">${btn('動画を見る画面へ','teacher-video','quiet')}${btn('この端末の動画を外す','remove-video','quiet',!videoURL)}</div><h3 class="teacher-heading">児童の進め方</h3><p>まず５のだん。９つをまとめて唱えます。レベル１〜４を順で終えてから逆へ、逆も終えてから個別ランダムへ進みます。終了済みのレベルはいつでも練習し直せます。</p><p>「言えた」は本人や先生の確認です。録音や音声認識はしません。ランダムは、数字の正解・ヒントを使わなかったこと・唱え方を思い出せたという確認・回答時間を組み合わせて記録します。</p><label>「すぐ」の目安 <select id="fastSeconds"><option value="3">３秒</option><option value="5">５秒</option><option value="10">10秒</option></select></label><p class="save-note">目安を変えると「すぐ思い出せた記録」をいったん消し、新しい目安で練習します。順・逆の記録は残ります。音声は端末の日本語読み上げを使います。音声がない場合も画面で練習できます。</p><p>「よん・なな・きゅう」も通常の数字の読み方として正しいことを伝えたうえで、九九の唱えでは「し・しち・く」にそろえます。九九には地域や教材による別の唱え方もあります。</p><details><summary>この教材の唱え方を一覧で確認</summary><div class="teacher-readings">${order.map(a=>`<h3>${a}のだん</h3><p>${Array.from({length:9},(_,i)=>{const f=fact(a,i+1);return `${a}×${i+1}=${f.value}：${f.start} ${f.answer}`;}).join('<br>')}</p>`).join('')}</div></details><h3 class="teacher-heading">記録の管理</h3><p>このブラウザの記録です。共有端末では、一人ごとにブラウザのプロフィールを分けるか、下から記録を消してください。</p><div class="actions">${btn('学習記録を消す','reset-ask','danger')}</div><div id="resetConfirm" hidden><p>このブラウザの練習記録を消します。</p>${btn('記録を消して最初から','reset-confirm','danger')}</div><details><summary>教材と出典</summary>${sources}</details>`;
    const settings=document.createElement('section');
    settings.className='reading-settings';
    settings.innerHTML=`<h3>九九の唱え方を選ぶ</h3><p>学校やおうちで使う唱え方に合わせて選べます。画面と音声の両方に反映し、このブラウザに保存します。</p>${Object.entries(readingOptions).map(([id,options])=>`<label>${id.replace('x',' × ')} ＝ ${id.split('x').reduce((a,b)=>a*Number(b),1)}<select data-reading="${id}" aria-label="${id.replace('x','×')}の唱え方">${options.map(([start,answer],i)=>`<option value="${i}">${start} ${answer}</option>`).join('')}</select></label>`).join('')}`;
    $('#teacherContent').prepend(settings);
    settings.querySelectorAll('select').forEach(select=>{
      select.value=state.readings[select.dataset.reading]||0;
      select.addEventListener('change',()=>{
        stop();state.readings[select.dataset.reading]=Number(select.value);readingsChanged=true;save();
        $('.teacher-readings').innerHTML=order.map(a=>`<h3>${a}のだん</h3><p>${Array.from({length:9},(_,i)=>{const f=fact(a,i+1);return `${a}×${i+1}=${f.value}：${f.start} ${f.answer}`;}).join('<br>')}</p>`).join('');
      });
    });
    $('#fastSeconds').value=state.fastSeconds;$('#fastSeconds').addEventListener('change',e=>{state.fastSeconds=Number(e.target.value);for(const a of order){progress(a).mastered=[];progress(a).session=null;}speedChanged=true;save();});$('#videoFile').addEventListener('change',e=>chooseVideo(e.target.files[0]));$('#teacher').showModal();
  }
  document.addEventListener('click',async e=>{
    const button=e.target.closest('[data-action]');if(!button||button.disabled)return;const [action,arg]=button.dataset.action.split(':');
    if(action==='home')home();
    else if(action==='intro'){introIndex=state.intro;challengeIndex=Math.min(state.challenge,5);challengeRated=false;intro();}
    else if(action==='intro-next')introNext();
    else if(action==='intro-prev'){introIndex=Math.max(0,introIndex-1);intro();}
    else if(action==='map')map();
    else if(action==='resume')startDan(state.lastDan);
    else if(action==='start-five'){state.intro=9;save();startDan(5);}
    else if(action==='teacher')teacher();
    else if(action==='teacher-video'){$('#teacher').close();introIndex=1;intro();}
    else if(action==='challenge-hide'){challengeHidden=!challengeHidden;intro();}
    else if(action==='challenge-rate'){challengeRated=true;intro();tell(button.textContent.includes('むずかしい')?'たくさんあると難しいね。先ぱいはどうしているかな？':'言えたんだね！ 先ぱいがどう考えるかも、見てみよう。');}
    else if(action==='challenge-next'){state.challenge=Math.max(state.challenge,challengeIndex+1);save();challengeRated=false;challengeHidden=false;if(challengeIndex<5){challengeIndex++;intro();}else introNext();}
    else if(action==='video-answer'){if(!videoSeen)return;tell('ひみつは「九九」だったんだね！');$('#videoNext').hidden=false;}
    else if(action==='video-wrong')tell('インタビューを、もう一度聞いてみよう。',false);
    else if(action==='speak-expression')speak('ご、かける、さん、は、じゅうご');
    else if(action==='speak-chant')speakChant(fact(5,3));
    else if(action==='number'){if(arg===numberNames[numberIndex+1]){tell(`${numberIndex+1}は「${arg}」。声に出そう！`);$('#numberNext').hidden=false;app.querySelectorAll('.choices button').forEach(b=>b.disabled=true);}else tell('この九九の練習では「'+numberNames[numberIndex+1]+'」を使うよ。もう一度選ぼう。',false);}
    else if(action==='number-next'){state.number=Math.max(state.number,numberIndex+1);save();if(numberIndex<8){numberIndex++;intro();}else introNext();}
    else if(action==='careful'){if(arg===numberNames[[4,7,9][carefulIndex]]){tell('その通り！ 声に出して覚えよう。');$('#carefulNext').hidden=false;app.querySelectorAll('.choices button').forEach(b=>b.disabled=true);}else tell('九九では「'+numberNames[[4,7,9][carefulIndex]]+'」。上の３つを見てみよう。',false);}
    else if(action==='careful-next'){state.careful=Math.max(state.careful,carefulIndex+1);save();if(carefulIndex<2){carefulIndex++;intro();}else introNext();}
    else if(action==='review-readings'){introIndex=6;numberIndex=0;carefulIndex=0;intro();}
    else if(action==='dan')startDan(Number(arg));
    else if(action==='mode'){if(arg==='reverse'&&progress().forward<4)return;mode=arg;level=Math.min(4,progress()[mode]+1);modelShown=false;drillRevealed.clear();drill();}
    else if(action==='level'){const l=Number(arg);if(l>progress()[mode]+1)return;level=l;modelShown=false;drillRevealed.clear();drill();}
    else if(action==='reveal-row')toggleRow(Number(arg),true);
    else if(action==='hide-row')toggleRow(Number(arg),false);
    else if(action==='drill-model'){modelShown=true;drill();}
    else if(action==='drill-hide'||action==='drill-retry'){modelShown=false;drillRevealed.clear();drill();if(action==='drill-retry')tell('何度でもだいじょうぶ。もう一度、自分の声で唱えよう。');}
    else if(action==='drill-listen')listenDrill();
    else if(action==='speak-row'){stop();const f=fact(dan,Number(arg));app.querySelector(`[data-b="${f.b}"]`)?.classList.add('active');speakChant(f,()=>app.querySelector(`[data-b="${f.b}"]`)?.classList.remove('active'));}
    else if(action==='drill-pass')drillPass();
    else if(action==='stop')stop();
    else if(action==='random')startRandom();
    else if(action==='random-show'){if(random.started)return;random.started=true;$('#randomStart').hidden=true;$('#randomProblem').hidden=false;random.start=performance.now();$('#answer').focus();}
    else if(action==='random-hint'){random.hint=true;const f=fact(dan,random.queue[0]);$('#randomHint').hidden=false;$('#randomHint').textContent=f.start+' '+f.answer;}
    else if(action==='random-rate')rateRandom(arg==='yes');
    else if(action==='application'){applyIndex=0;applyStep=0;applyDots=false;application();}
    else if(action==='application-dots'){applyDots=!applyDots;application();}
    else if(action==='application-formula'){if(Number(arg)===0){applyDone=true;$('#applicationNext').hidden=false;app.querySelectorAll('.choices button').forEach(b=>b.disabled=true);tell('１つ分の数 × いくつ分。この式で求めよう。');}else tell('同じ数ずつのまとまりは、かけ算で表すよ。',false);}
    else if(action==='application-next'){if(!applyDone)return;if(applyStep<3)applyStep++;else if(applyIndex<5){applyIndex++;applyStep=0;}else{home();return;}applyDots=false;application();}
    else if(action==='remove-video'){stop();if(videoURL)URL.revokeObjectURL(videoURL);videoURL=null;videoName='';videoSeen=false;try{await videoStore(null);}catch{}$('#teacher').close();introIndex=1;intro();}
    else if(action==='reset-ask')$('#resetConfirm').hidden=false;
    else if(action==='reset-confirm'){state=blankState();save();introIndex=0;numberIndex=0;carefulIndex=0;challengeIndex=0;challengeRated=false;challengeHidden=false;$('#teacher').close();home();}
  });
  $('#homeButton').addEventListener('click',home);
  $('#teacher').addEventListener('close',()=>{if(readingsChanged){readingsChanged=false;if(view==='drill')drill(false);if(view==='random'&&random?.hint){const f=fact(dan,random.queue[0]);$('#randomHint').textContent=f.start+' '+f.answer;}}if(speedChanged){speedChanged=false;if(view==='random'){startRandom();return;}if(view==='finish'){randomFinish();return;}if(view==='map'){map();return;}}if(view==='home')home();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('pagehide',stop);
  const requestedDan=Number(new URLSearchParams(location.search).get('practice'));
  if(order.includes(requestedDan))startDan(requestedDan);
  else if(state.intro===0)intro();
  else home();
  restoreVideo();
})();
