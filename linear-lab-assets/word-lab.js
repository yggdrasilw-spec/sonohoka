let wordIndex = null, wordState = null, wordDone = {};
try { wordDone = JSON.parse(localStorage.getItem('linear-lab-words-v1') || '{}') || {}; } catch {}
const wordN = n => String(Math.round(n * 1000) / 1000).replace('-', '−');
const wordY = (p,x,second=false) => (second?p.a2:p.a)*x+(second?p.b2:p.b);
const wordKnown = p => !p.observations || wordState.hint || wordState.correct;
function wordHeader(title) {return `<div class="courseHeader"><h2>${title}</h2><div class="courseTools"><button id="wordRead">🔊 課題をよむ</button><button id="wordMenu">文章題をえらぶ</button><button id="wordHome">学習メニュー</button></div></div>`;}
function bindWordHeader() {
  document.getElementById('wordHome').onclick=()=>openSyllabus();
  document.getElementById('wordMenu').onclick=()=>openWordLab();
  document.getElementById('wordRead').onclick=()=>speak([document.getElementById('wordPrompt')?.innerText,document.getElementById('wordStory')?.innerText,document.getElementById('wordLink')?.innerText,document.getElementById('wordFeedback')?.innerText].filter(Boolean).join('。'));
}
function openWordLab(index=null) {
  mask.classList.remove('open');courses.classList.remove('open');lab.classList.remove('open');syllabus.classList.add('open');syllabus.scrollTop=0;currentLesson=null;wordIndex=index;
  if(index!==null){const p=linearWordProblems[index];wordState={x:p.observations?.[0][0]??p.min??0,values:{},correct:false,hint:false,choice:null,feedback:'図・表を動かして調べてもいいよ。答えには単位に合う数を入れよう。'};}
  renderWordLab();document.getElementById('wordRead').focus();
}
function renderWordLab() {
  const focus=syllabus.contains(document.activeElement)?document.activeElement.id:null;
  if(wordIndex===null){
    syllabus.innerHTML=wordHeader('生活の文章題｜20問')+`<p class="syllabusIntro" id="wordPrompt">図 → 表 → 式 → グラフをつなげて考えよう。<br>好きな問題から始められます。</p><div class="syllabusGroups">${['料金','移動','量の変化','式・条件'].map(group=>`<section class="syllabusGroup"><h3>${group}</h3>${linearWordProblems.filter(p=>p.group===group).map(p=>`<button class="lessonTile" data-word="${p.id-1}"><b>${p.id}</b><span>${p.title}</span><small>${wordDone[p.id]?'✓ 学習済み':'図と表を動かして考える'}</small></button>`).join('')}</section>`).join('')}</div><p class="wordNote">問題の価格・速さなどは授業用に作った設定です。実際の料金表やサービスの条件を表すものではありません。</p>`;
    bindWordHeader();document.getElementById('wordMenu').disabled=true;syllabus.querySelectorAll('[data-word]').forEach(b=>b.onclick=()=>openWordLab(Number(b.dataset.word)));return;
  }
  const p=linearWordProblems[wordIndex],known=wordKnown(p),x=wordState.x, y=wordY(p,x);
  const controls=known?`<div class="wordSlider"><label for="wordX">${p.xLabel} x：<strong>${wordN(x)}${p.xUnit}</strong></label><div><button id="wordMinus" aria-label="${p.xLabel}を減らす" ${x<=(p.min??0)?'disabled':''}>−</button><input id="wordX" type="range" min="${p.min??0}" max="${p.max}" step="${p.discrete?1:.5}" value="${x}" aria-valuetext="${wordN(x)}${p.xUnit}"><button id="wordPlus" aria-label="${p.xLabel}を増やす" ${x>=p.max?'disabled':''}>＋</button></div></div>`:`<div class="sceneControls">測定した時刻：${p.observations.map(v=>`<button data-word-x="${v[0]}" aria-pressed="${x===v[0]}">${v[0]}${p.xUnit}</button>`).join('')}</div>`;
  const answers=p.choices?`<div class="courseChoices">${p.choices.map((v,i)=>`<button class="courseChoice ${wordState.choice===i?(wordState.correct?'selected':'retry'):''}" id="wordChoice${i}" data-word-answer="${i}" ${wordState.correct?'disabled':''}>${v}</button>`).join('')}</div>`:`<div class="wordAnswers">${p.fields.map(f=>`<label>${f.label}<input id="wordAnswer-${f.key}" data-word-field="${f.key}" inputmode="decimal" placeholder="数を入力" value="${wordEscape(wordState.values[f.key]??'')}" ${wordState.correct?'disabled':''}></label>`).join('')}</div><button class="coursePrimary" id="wordCheck" ${wordState.correct?'disabled':''}>答えを確かめる</button>`;
  syllabus.innerHTML=wordHeader(`${p.id} / 20｜${p.title}`)+`<div class="coursePrompt" id="wordPrompt">${p.prompt}</div><div class="wordBody"><div class="card wordLeft"><p id="wordStory">${p.story}</p><p class="wordUnits"><b>x：${p.xLabel}（${p.xUnit}）</b><b>y：${p.yLabel}（${p.yUnit}）</b></p>${wordTable(p,known)}${answers}</div><div class="card wordRight">${wordPicture(p,known)}${controls}<div id="wordLink" class="wordLink">${wordCorrespondence(p,known)}</div>${wordGraph(p,known)}</div></div><div class="courseBottom"><div class="courseFeedback ${wordState.correct?'ok':''}" id="wordFeedback" role="status" aria-live="polite">${wordState.feedback}</div><div class="courseBottomActions"><button class="courseHint" id="wordHint">式の手がかり</button><button class="coursePrimary" id="wordNext" ${wordState.correct?'':'disabled'}>${wordIndex===19?'20問のメニューへ':'次の文章題へ →'}</button></div></div>`;
  bindWordHeader();
  const setX=(v,keepSlider=false)=>{
    wordState.x=Math.max(p.min??0,Math.min(p.max,v));
    if(!keepSlider){renderWordLab();return;}
    document.querySelector('.wordSlider label strong').textContent=wordN(wordState.x)+p.xUnit;
    document.getElementById('wordX').setAttribute('aria-valuetext',wordN(wordState.x)+p.xUnit);
    document.getElementById('wordMinus').disabled=wordState.x<=(p.min??0);
    document.getElementById('wordPlus').disabled=wordState.x>=p.max;
    document.getElementById('wordPicture').outerHTML=wordPicture(p,known);
    document.getElementById('wordGraph').outerHTML=wordGraph(p,known);
    document.getElementById('wordLink').innerHTML=wordCorrespondence(p,known);
    document.querySelector('.wordTableWrap').outerHTML=wordTable(p,known);
    syllabus.querySelectorAll('[data-word-x]').forEach(b=>b.onclick=()=>setX(Number(b.dataset.wordX)));
  };
  document.getElementById('wordX')?.addEventListener('input',e=>setX(Number(e.target.value),true));
  document.getElementById('wordMinus')?.addEventListener('click',()=>setX(wordState.x-(p.discrete?1:.5)));
  document.getElementById('wordPlus')?.addEventListener('click',()=>setX(wordState.x+(p.discrete?1:.5)));
  syllabus.querySelectorAll('[data-word-x]').forEach(b=>b.onclick=()=>setX(Number(b.dataset.wordX)));
  syllabus.querySelectorAll('[data-word-field]').forEach(input=>input.oninput=()=>{wordState.values[input.dataset.wordField]=input.value;});
  document.getElementById('wordCheck')?.addEventListener('click',()=>{
    const values=p.fields.map(f=>parseLessonNumber(wordState.values[f.key]??''));
    wordState.correct=values.every((v,i)=>v!==null&&Math.abs(v-p.fields[i].answer)<1e-8);
    wordState.feedback=values.some(v=>v===null)?'すべての欄に数を入れよう。小数や 1/2 のような分数も使えます。':wordState.correct?'合っているね。'+p.explanation:'もう一度。'+p.hint;
    finishWord();renderWordLab();
  });
  syllabus.querySelectorAll('[data-word-answer]').forEach(b=>b.onclick=()=>{wordState.choice=Number(b.dataset.wordAnswer);wordState.correct=wordState.choice===p.answer;wordState.feedback=wordState.correct?'合っているね。'+p.explanation:'もう一度。'+p.hint;finishWord();renderWordLab();});
  document.getElementById('wordHint').onclick=()=>{wordState.hint=true;wordState.feedback=wordState.correct?p.explanation:p.hint;renderWordLab();};
  document.getElementById('wordNext').onclick=()=>openWordLab(wordIndex===19?null:wordIndex+1);
  if(focus)document.getElementById(focus)?.focus({preventScroll:true});
}
function finishWord(){if(wordState.correct){wordDone[linearWordProblems[wordIndex].id]=true;try{localStorage.setItem('linear-lab-words-v1',JSON.stringify(wordDone));}catch{}}}
function wordEscape(v){return String(v).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');}
function wordTable(p,known){
  let xs=known?Array.from({length:Math.floor((p.max-(p.min??0))/p.step)+1},(_,i)=>(p.min??0)+i*p.step):p.observations.map(v=>v[0]);
  xs=[...new Set([...xs,wordState.x])].sort((a,b)=>a-b);
  const cell=(x,v)=>`<td class="${x===wordState.x?'linkedCell':''}">${wordN(v)}</td>`;
  return `<div class="wordTableWrap"><table class="courseTable wordTable"><caption>列を押すと、図・計算・グラフも同じxになる</caption><tr><th>x（${p.xUnit}）</th>${xs.map(x=>`<td class="${x===wordState.x?'linkedCell':''}"><button data-word-x="${x}" aria-pressed="${x===wordState.x}" aria-label="x=${wordN(x)}${p.xUnit}を選ぶ">${wordN(x)}</button></td>`).join('')}</tr><tr class="wordA"><th>${p.a2!==undefined?'Aの':''}y（${p.yUnit}）</th>${xs.map(x=>cell(x,wordY(p,x))).join('')}</tr>${p.a2!==undefined?`<tr class="wordB"><th>Bのy（${p.yUnit}）</th>${xs.map(x=>cell(x,wordY(p,x,true))).join('')}</tr>`:''}</table></div>`;
}
function wordCorrespondence(p,known){
  const x=wordState.x,y=wordY(p,x),tag=`<span class="linkedX">x＝${wordN(x)}${p.xUnit}</span>`,val=`<span class="linkedY">y＝${wordN(y)}${p.yUnit}</span>`;
  if(!known)return `${tag} → 測定 ${val} → 点 (${wordN(x)}, ${wordN(y)})<small>まず2つの記録の差を比べよう。</small>`;
  const calc=(a,b)=>`${wordN(a)}×<span class="linkedX">${wordN(x)}</span>${b<0?'−':'＋'}${wordN(Math.abs(b))}`;
  return `${tag} → ${p.a2!==undefined?'A：':''}${calc(p.a,p.b)}＝${val}${p.a2!==undefined?`<br>B：${calc(p.a2,p.b2)}＝<span class="wordB">${wordN(wordY(p,x,true))}${p.yUnit}</span>`:''}<small>${p.a2!==undefined?'同じxで、AとBのyを比べる。':'最初の量 '+wordN(p.b)+p.yUnit+' ／ '+p.xUnit+'あたりの変化 '+wordN(p.a)+p.yUnit} → グラフの点 (${wordN(x)}, ${wordN(y)})</small>`;
}
function wordPicture(p,known){
  const x=wordState.x,y=wordY(p,x),y2=p.a2!==undefined?wordY(p,x,true):null;
  const label=`${p.xLabel}${wordN(x)}${p.xUnit}のとき、${p.yLabel}${wordN(y)}${p.yUnit}${y2!==null?'。Bは'+wordN(y2)+p.yUnit:''}`;
  let body='';
  if(p.kind==='distance'){
    const max=Math.max(wordY(p,0),wordY(p,p.max),y2??0,p.a2!==undefined?wordY(p,p.max,true):0,1),X=v=>60+540*v/max;
    body=`<path d="M60 88H600" stroke="#b8c8da" stroke-width="10"/><text x="60" y="125" text-anchor="middle">0${p.yUnit}</text><text x="600" y="125" text-anchor="middle">${wordN(max)}${p.yUnit}</text><circle cx="${X(y)}" cy="80" r="13" fill="#1769e0"/><text x="${Math.max(100,Math.min(550,X(y)))}" y="38" text-anchor="middle" fill="#1769e0">${y2!==null?'A：':''}${wordN(y)}${p.yUnit}</text>${y2!==null?`<circle cx="${X(y2)}" cy="98" r="11" fill="#586779"/><text x="340" y="148" text-anchor="middle" fill="#586779">B：${wordN(y2)}${p.yUnit}</text>`:''}`;
  }else if(p.kind==='cost'){
    if(p.discrete){
      const isPrint=p.xUnit==='枚',count=Math.round(x),spacing=isPrint?20:42;
      body=(isPrint?`<rect x="20" y="53" width="78" height="47" rx="5" fill="#ffe0ae" stroke="#a35b0a" stroke-width="3"/><path d="M35 53V32H82V53 M35 80H82V115H35Z" fill="white" stroke="#a35b0a" stroke-width="3"/>`:`<path d="M28 55H90V112H28Z M43 55V39Q59 20 75 39V55" fill="#ffe0ae" stroke="#a35b0a" stroke-width="3"/>`)+`<text x="59" y="139" text-anchor="middle" font-size="17">${wordN(p.b)}円</text>`;
      for(let i=0;i<count;i++){const start=110+i*spacing;body+=`<rect x="${start}" y="${isPrint?65-i%3*5:47}" width="${isPrint?34:32}" height="65" rx="3" fill="#d9eaff" stroke="#1769e0" stroke-width="2"/><path d="M${start+7} 60v40" stroke="#1769e0"/>`;}
      body+=`<text x="390" y="37">${wordN(x)}${p.xUnit} × ${wordN(p.a)}円</text><text x="390" y="80" fill="#1769e0">合計 ${wordN(y)}円</text><text x="390" y="118" font-size="18">袋・準備・包装代は1回分</text>`;
    }else{
      const cap=Math.max(wordY(p,p.max),y2!==null?wordY(p,p.max,true):0,1),scale=470/cap;
      const bar=(a,b,top,label,color)=>`<text x="32" y="${top+29}">${label}</text><rect x="80" y="${top}" width="${b*scale}" height="35" fill="#ffe0ae" stroke="#a35b0a"/><rect x="${80+b*scale}" y="${top}" width="${a*x*scale}" height="35" fill="#c6e2ff" stroke="${color}"/><text x="${Math.min(570,90+wordY({a,b},x)*scale)}" y="${top+27}" fill="${color}" font-size="18">${wordN(a*x+b)}円</text>`;
      body=bar(p.a,p.b,35,y2!==null?'A':'料金','#1769e0')+(y2!==null?bar(p.a2,p.b2,85,'B','#586779'):'')+`<text x="80" y="22" font-size="18" fill="#a35b0a">最初の料金</text><text x="290" y="22" font-size="18" fill="#1769e0">利用した分だけ増える料金</text>`;
      if(y2===null)body+=`<text x="80" y="110">基本${wordN(p.b)}円 ＋ ${wordN(p.a)}円 × ${wordN(x)}${p.xUnit}</text>`;
    }
  }else if(p.kind==='temperature'){
    body=`<image href="linear-lab-assets/warming-water.webp" x="25" y="0" width="210" height="155"/><text x="270" y="55">時計：${wordN(x)}分</text><text x="270" y="100" fill="#1769e0">温度計：予測 約${wordN(y)}℃</text>`;
  }else{
    const cap=Math.max(p.b,wordY(p,p.max),1),w=520*Math.max(0,y)/cap;
    body=`<rect x="75" y="48" width="520" height="40" rx="9" fill="#edf2f7"/><rect x="75" y="48" width="${w}" height="40" rx="9" fill="#c6e2ff" stroke="#1769e0" stroke-width="2"/><text x="75" y="30">${p.yLabel}</text><text x="75" y="125" fill="#1769e0">${known?'今の':'記録した'}量：${wordN(y)}${p.yUnit}</text><text x="400" y="125">x＝${wordN(x)}${p.xUnit}</text>`;
  }
  const scene={1:['shopping-notebooks.webp','ノートと袋を別々に買う場面'],2:['bicycle-rental.webp','自転車を借りる生徒と貸出係'],9:['catch-up.webp','先を歩く青い服のAと、後ろから同じ向きに走る灰色の服のB'],19:['shopping-notebooks.webp','本と包装を別々に買う場面']}[p.id];
  return `<div id="wordPicture" class="${scene?'withStoryAsset':''}">${scene?`<figure class="wordStoryAsset"><img src="linear-lab-assets/${scene[0]}" alt="${scene[1]}。${p.id===9?'出発時の':'場面の'}イメージ。数量は隣の図で確認できます。" width="210" height="140"><figcaption>${p.id===9?'出発時の':'場面の'}イメージ</figcaption></figure>`:''}<svg id="wordQuantity" viewBox="0 0 680 160" role="img" aria-label="${label}">${body}</svg></div>`;
}
function wordGraph(p,known){
  const niceStep=span=>{const raw=span/5,base=10**Math.floor(Math.log10(raw));return [1,2,5,10].find(v=>v*base>=raw)*base;};
  const W=680,H=255,L=72,R=25,T=25,B=57,xmin=0,xmax=p.max,vals=[0,wordY(p,p.min??0),wordY(p,p.max),...(p.a2!==undefined?[p.b2,wordY(p,p.max,true)]:[])],ymin=0,top=Math.max(...vals)||1,ys=niceStep(top),ymax=Math.ceil(top/ys)*ys,xs=Math.max(1,Math.ceil(xmax/6)),X=x=>L+(W-L-R)*(x-xmin)/(xmax-xmin),Y=y=>H-B-(H-T-B)*(y-ymin)/(ymax-ymin);
  let body=`<rect width="${W}" height="${H}" fill="white"/>`;
  for(let x=0;x<=xmax;x+=xs)body+=`<path d="M${X(x)} ${T}V${H-B}" stroke="#e2e9f2"/><text x="${X(x)}" y="${H-B+22}" text-anchor="middle">${wordN(x)}</text>`;
  for(let y=0;y<=ymax+ys*.01;y+=ys)body+=`<path d="M${L} ${Y(y)}H${W-R}" stroke="#e2e9f2"/><text x="${L-8}" y="${Y(y)+5}" text-anchor="end">${wordN(y)}</text>`;
  body+=`<path d="M${L} ${T}V${H-B}H${W-R}" stroke="#314158" fill="none" stroke-width="2"/><text x="${L}" y="17">y（${p.yUnit}）</text><text x="${W-R}" y="${H-7}" text-anchor="end">x：${p.xLabel}（${p.xUnit}）</text>`;
  const line=(a,b,color)=>`<path d="M${X(p.min??0)} ${Y(a*(p.min??0)+b)}L${X(p.max)} ${Y(a*p.max+b)}" fill="none" stroke="${color}" stroke-width="3"/>`;
  const point=(x,y,color,r=5)=>`<circle cx="${X(x)}" cy="${Y(y)}" r="${r}" fill="${color}" stroke="white" stroke-width="2"/>`;
  if(known){if(p.discrete){for(let x=p.min??0;x<=p.max;x++)body+=point(x,wordY(p,x),'#1769e0');}else body+=line(p.a,p.b,'#1769e0');if(p.a2!==undefined)body+=line(p.a2,p.b2,'#586779');}else p.observations.forEach(v=>{body+=point(...v,'#1769e0');});
  const x=wordState.x,y=wordY(p,x);body+=`<path d="M${X(x)} ${H-B}V${Y(y)}H${L}" fill="none" stroke="#d76a10" stroke-dasharray="4 4" stroke-width="2"/>`+point(x,y,'#1769e0',7);
  if(p.a2!==undefined)body+=point(x,wordY(p,x,true),'#586779',5);
  body+=`<text x="${Math.min(W-175,Math.max(L+12,X(x)+12))}" y="${Math.max(20,Y(y)-10)}" fill="#1769e0">(${wordN(x)}, ${wordN(y)})</text>`;
  return `<svg id="wordGraph" viewBox="0 0 ${W} ${H}" role="img" aria-label="${p.xLabel}と${p.yLabel}のグラフ。選んだ点は(${wordN(x)}, ${wordN(y)})。${p.discrete?'整数のxだけの点。':'縦と横はそれぞれの単位に合わせた目盛り。'}">${body}</svg>`;
}
