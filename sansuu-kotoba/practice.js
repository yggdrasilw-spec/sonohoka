'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const audio=window.LessonAudio;
  const terms={multiply:['かけられる数','かける数'],subtract:['引かれる数','引く数'],add:['たされる数','たす数'],divide:['わられる数','わる数']};
  const symbols={multiply:'×',subtract:'−',add:'＋',divide:'÷'};
  const samples={multiply:[[4,3],[3,2],[5,4]],subtract:[[7,2],[9,3],[8,5]],add:[[4,3],[5,2],[6,3]],divide:[[8,2],[12,3],[16,4]]};
  function problem(topic,type,a,b,index){
    const op=symbols[topic],r=topic==='multiply'?a*b:topic==='subtract'?a-b:topic==='add'?a+b:a/b;
    const p={id:`${topic}-${type}-${index}`,topic,type,a,b,r,op,before:{a,b,op,caption:'はじめの式'},after:null};
    if(topic==='multiply'&&type===0)Object.assign(p,{statement:'かけられる数と かける数を いれかえても、答えは 同じ。',question:'この文を 表している式は どれ？',options:[`${b} × ${a} ＝ ${r}`,`${a} × ${a} ＝ ${a*a}`,`${b} × ${b} ＝ ${b*b}`],answer:0,after:{a:b,b:a,op,caption:'２つの数を いれかえる'},explain:`${a}こずつ ${b}組も、${b}こずつ ${a}組も、全部で ${r}こ。数の役割をいれかえても、答えは同じだね。`});
    if(topic==='multiply'&&type===1)Object.assign(p,{statement:'かける数が １ふえると、答えは かけられる数の分だけ ふえる。',question:`${a} × ${b} の かける数を １ふやすと、答えは いくつ ふえる？`,options:[`${a} ふえる`,`${b} ふえる`,'１ ふえる'],answer:0,after:{a,b:b+1,op,caption:`かける数：${b} から ${b+1}`},explain:`${a}こ入りの組が、${b}組から ${b+1}組へ。１組ふえるので、答えは かけられる数の ${a}だけ ふえるよ。`});
    if(topic==='multiply'&&type===2)Object.assign(p,{statement:'かけられる数が １ふえると、答えは かける数の分だけ ふえる。',question:`${a} × ${b} の かけられる数を １ふやすと、答えは いくつ ふえる？`,options:[`${b} ふえる`,`${a} ふえる`,'１ ふえる'],answer:0,after:{a:a+1,b,op,caption:`かけられる数：${a} から ${a+1}`},explain:`${b}組それぞれに １こずつ たすので、全部で ${b}こ ふえるよ。ふやしたのは式の左の数だね。`});
    if(topic==='subtract'&&type===0)Object.assign(p,{statement:'ひき算の答えは、「答え ＋ 引く数 ＝ 引かれる数」に なるかを見て、たしかめる。',question:'この たしかめを 表す式は どれ？',options:[`${r} ＋ ${b} ＝ ${a}`,`${r} ＋ ${a} ＝ ${r+a}`,`${a} ＋ ${b} ＝ ${a+b}`],answer:0,after:{a:r,b,op:'＋',caption:'答え ＋ 引く数 で、もとに もどす'},explain:`残った ${r}に、引いた ${b}を もどすと ${a}。もとの 引かれる数に もどるかを 見るんだね。`});
    if(topic==='subtract'&&type===1)Object.assign(p,{statement:'引かれる数が １ふえて、引く数が 同じなら、答えは １ふえる。',question:'引かれる数だけを １ふやした式は どれ？',options:[`${a+1} − ${b} ＝ ${r+1}`,`${a} − ${b+1} ＝ ${r-1}`,`${a+1} − ${b+1} ＝ ${r}`],answer:0,after:{a:a+1,b,op,caption:`引かれる数：${a} から ${a+1}`},explain:`もとの数が ${a}から ${a+1}に ふえたよ。引く数は ${b}のままなので、残る数も １ふえるね。`});
    if(topic==='subtract'&&type===2)Object.assign(p,{statement:'引かれる数は そのままで、引く数を １ふやす。',question:'答えは どう かわる？',options:['１ へる','１ ふえる','かわらない'],answer:0,after:{a,b:b+1,op,caption:`引く数：${b} から ${b+1}`},explain:`${a}から 引く数が ${b}から ${b+1}へ。１こ多く 引くので、答えは ${r}から ${r-1}へ １へるよ。`});
    if(topic==='add'&&type===0)Object.assign(p,{statement:'たされる数と たす数を いれかえても、答えは 同じ。',question:'この文を 表している式は どれ？',options:[`${b} ＋ ${a} ＝ ${r}`,`${a} ＋ ${a} ＝ ${a*2}`,`${b} ＋ ${b} ＝ ${b*2}`],answer:0,after:{a:b,b:a,op,caption:'２つの数を いれかえる'},explain:`${a}こと ${b}こを 合わせても、${b}こと ${a}こを 合わせても、全部で ${r}こ。たす順番を かえても 同じだね。`});
    if(topic==='add'&&type===1)Object.assign(p,{statement:'たされる数は そのままで、たす数を １ふやす。',question:'答えは いくつ ふえる？',options:['１ ふえる',`${a} ふえる`,`${b} ふえる`],answer:0,after:{a,b:b+1,op,caption:`たす数：${b} から ${b+1}`},explain:`たす数が ${b}から ${b+1}へ １ふえたので、答えも ${r}から ${r+1}へ １ふえるよ。`});
    if(topic==='add'&&type===2)Object.assign(p,{statement:'たし算の答えから たす数を 引くと、たされる数に もどる。',question:'この文を 表している式は どれ？',options:[`${r} − ${b} ＝ ${a}`,`${r} ＋ ${b} ＝ ${r+b}`,`${a} − ${b} ＝ ${a-b}`],answer:0,after:{a:r,b,op:'−',caption:'答え − たす数 で、もとに もどす'},explain:`全部の ${r}から、たした ${b}を 引くと ${a}。もとの たされる数に もどったね。`});
    if(topic==='divide'&&type===0)Object.assign(p,{statement:'あまりのない わり算は、「答え × わる数 ＝ わられる数」に なるかを見て、たしかめる。',question:'この たしかめを 表す式は どれ？',options:[`${r} × ${b} ＝ ${a}`,`${r} ＋ ${b} ＝ ${r+b}`,`${a} × ${b} ＝ ${a*b}`],answer:0,after:{a:r,b,op:'×',caption:'答え × わる数 で、もとに もどす'},explain:`わり算の答え ${r}と、わる数 ${b}を かけると ${a}。もとの わられる数に もどるか たしかめよう。`});
    if(topic==='divide'&&type===1)Object.assign(p,{statement:'わる数は 同じで、わられる数を わる数の分だけ ふやす。',question:`${a} ÷ ${b} を ${a+b} ÷ ${b} に すると、答えは どう かわる？`,options:['１ ふえる',`${b} ふえる`,'１ へる'],answer:0,after:{a:a+b,b,op,caption:`わられる数を ${b}ふやす`},explain:`${b}こずつの組が １組分ふえるので、答えは ${r}から ${r+1}へ １ふえるよ。`});
    if(topic==='divide'&&type===2)Object.assign(p,{statement:'わられる数は 同じで、わる数を ２倍にする。',question:'答えは どう かわる？',options:['半分に なる','２倍に なる','かわらない'],answer:0,after:{a,b:b*2,op,caption:`わる数：${b} から ${b*2}`},explain:`１組分が ${b}こから ${b*2}こへ。全部の数は同じなので、組の数は ${r}組から ${r/2}組へ 半分に なるよ。`});
    return p;
  }
  const bank=[];
  for(const topic of Object.keys(samples))samples[topic].forEach(([a,b],i)=>{for(let t=0;t<3;t++)bank.push(problem(topic,t,a,b,i));});
  let deck=[],current=null,order=[],answered=false,assisted=false,attempted=false,attempts=0,independent=0;
  function shuffle(list){for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}return list;}
  function fillDeck(){deck=shuffle(bank.filter(p=>$('practice-topic').value==='all'||p.topic===$('practice-topic').value).slice());if(current&&deck.at(-1)?.id===current.id)[deck[0],deck[deck.length-1]]=[deck.at(-1),deck[0]];document.dispatchEvent(new CustomEvent('practice-topic-changed',{detail:$('practice-topic').value}));}
  function result(a,b,op){return op==='×'?a*b:op==='÷'?a/b:op==='＋'?a+b:a-b;}
  function diagram(row){
    const {a,b,op,caption}=row,total=result(a,b,op);
    let shape='';
    if(op==='×'||op==='÷'){
      const size=op==='×'?a:b,groups=op==='×'?b:a/b;
      const groupW=Math.min(100,490/groups),dotR=Math.min(8,groupW/7);
      for(let g=0;g<groups;g++){
        const x=55+g*groupW;
        shape+=`<rect x="${x}" y="66" width="${groupW-8}" height="76" rx="8" fill="#edf5ef" stroke="#9ab6a6"/>`;
        for(let n=0;n<size;n++)shape+=`<circle data-dot="true" cx="${x+13+(n%3)*dotR*2.5}" cy="${80+Math.floor(n/3)*22}" r="${dotR}" fill="${row===current.after&&((current.topic==='multiply'&&current.type===1&&g===groups-1)||(current.topic==='multiply'&&current.type===2&&n===size-1)||(current.topic==='divide'&&current.type===1&&g===groups-1))?'#a64c2d':'#166557'}"/>`;
      }
      shape+=`<text x="300" y="164" text-anchor="middle">${size}こずつ ${groups}組 ＝ 全部 ${op==='×'?total:a}こ</text>`;
    }else{
      const whole=op==='＋'?a+b:a,unit=Math.min(31,490/whole),first=op==='＋'?a:a-b;
      for(let n=0;n<whole;n++)shape+=`<rect data-unit="true" x="${55+n*unit}" y="83" width="${unit-3}" height="46" rx="4" fill="${n<first?'#f1b294':op==='−'?'#edf0ed':'#8fc5ad'}" stroke="${n<first?'#a64c2d':'#166557'}" ${op==='−'&&n>=first?'stroke-dasharray="3 3"':''}/>`;
      shape+=`<text x="300" y="164" text-anchor="middle">${op==='＋'?`${a}こ と ${b}こを 合わせる`:`${a}こから ${b}こを 引いて、${total}こ 残る`}</text>`;
    }
    return `<svg viewBox="0 0 600 182" role="img" aria-label="${caption}。${a}${op}${b}＝${total}"><text x="30" y="24" class="diagram-label">${caption}</text><text x="300" y="54" text-anchor="middle" class="diagram-formula">${a} ${op} ${b} ＝ ${total}</text>${shape}</svg>`;
  }
  function reveal(){
    $('diagram-placeholder').hidden=true;$('application-diagram').hidden=false;
    $('application-diagram').innerHTML=diagram(current.before)+diagram(current.after)+`<p>${current.explain}</p>`;
  }
  function score(){$('practice-score').textContent=`答えた ${attempts}問 ／ ヒントなしで 最初に正解 ${independent}問`;}
  function read(){const choices=order.map((option,index)=>`${index+1}ばん。${current.options[option]}。`).join(' ');audio.speak(`${current.a} ${current.op} ${current.b} は ${current.r}。${current.statement} ${current.question} ${choices}`,$('practice-statement'));}
  function next(narrate=true){
    audio.cancel();
    if(!deck.length)fillDeck();current=deck.pop();answered=false;assisted=false;attempted=false;
    $('application').dataset.problemId=current.id;
    $('application-equation').innerHTML=`<div class="practice-operand receiver"><strong>${current.a}</strong><span>${terms[current.topic][0]}</span></div><b>${current.op}</b><div class="practice-operand actor"><strong>${current.b}</strong><span>${terms[current.topic][1]}</span></div><b>＝ ${current.r}</b>`;
    $('practice-statement').textContent=current.statement;$('practice-question').textContent=current.question;
    $('practice-count').textContent=`全${$('practice-topic').value==='all'?36:9}問を ひとめぐり ／ のこり ${deck.length+1}問`;
    $('practice-feedback').textContent='';$('diagram-placeholder').hidden=false;$('application-diagram').hidden=true;$('application-diagram').replaceChildren();
    order=shuffle([0,1,2]);$('practice-choices').replaceChildren();
    order.forEach(i=>{const button=document.createElement('button');button.type='button';button.textContent=current.options[i];button.dataset.option=i;button.addEventListener('click',()=>answer(i,button));$('practice-choices').append(button);});score();
    if(narrate){audio.play('tap');read();}
  }
  function answer(i,button){
    if(answered)return;
    const first=!attempted;if(first){attempts++;attempted=true;}
    if(i!==current.answer){assisted=true;$('practice-feedback').textContent='図のヒントで、どの数が かわるか 見てみよう。';reveal();score();audio.play('retry');audio.speak($('practice-feedback').textContent,$('practice-feedback'));return;}
    if(first&&!assisted)independent++;answered=true;button.classList.add('correct');
    $('practice-feedback').textContent='そう！ 文と式の意味が つながったね。';reveal();score();
    [...$('practice-choices').children].forEach(b=>b.setAttribute('aria-disabled','true'));
    audio.play('correct');audio.speak(`${$('practice-feedback').textContent} ${current.explain}`,$('practice-feedback'));
  }
  $('practice-hint').addEventListener('click',()=>{if(!answered)assisted=true;reveal();audio.play('hint');audio.speak(current.explain,$('application-diagram'));});
  $('practice-next').addEventListener('click',next);
  $('practice-topic').addEventListener('change',()=>{fillDeck();next();});
  document.addEventListener('practice-enter',e=>{const topic=e.detail==='push'?'all':e.detail;$('practice-topic').value=topic;fillDeck();next(false);});
  document.addEventListener('practice-read',()=>{if(current)read();});
})();
