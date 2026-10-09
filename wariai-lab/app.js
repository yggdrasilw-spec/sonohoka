(()=>{
 'use strict';
 const $=id=>document.getElementById(id),banks=window.WariaiProblems;
 const gcd=(a,b)=>b?gcd(b,a%b):a;
 function Q(n,d=1n){n=BigInt(n);d=BigInt(d);if(!d)throw Error('0では割れません');if(d<0n){n=-n;d=-d}const g=gcd(n<0n?-n:n,d);return{n:n/g,d:d/g}}
 function parse(s){s=String(s).normalize('NFKC').trim();if(/^[+-]?\d+\/\d+$/.test(s)){const[n,d]=s.split('/');return Q(n,d)}if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))throw Error('数、小数、分数（3/4など）で入力してね。');const sign=s.startsWith('-')?-1n:1n;s=s.replace(/^[+-]/,'');const[a,b='']=s.split('.');return Q(sign*BigInt((a||'0')+b),10n**BigInt(b.length))}
 const mul=(a,b)=>Q(a.n*b.n,a.d*b.d),div=(a,b)=>Q(a.n*b.d,a.d*b.n),eq=(a,b)=>a.n===b.n&&a.d===b.d,num=a=>Number(a.n)/Number(a.d);
 function fmt(a){let d=a.d;while(d%2n===0n)d/=2n;while(d%5n===0n)d/=5n;if(d!==1n)return `${a.n}/${a.d}`;const sign=a.n<0n?'-':'';let n=a.n<0n?-a.n:a.n,whole=n/a.d,rem=n%a.d,out='';while(rem){rem*=10n;out+=rem/a.d;rem%=a.d}return sign+whole+(out?'.'+out:'')}
 function notation(r,style='times'){if(style==='percent')return fmt(mul(r,Q(100)))+'％';if(style==='buai'){const thousand=mul(r,Q(1000));if(thousand.d!==1n)return fmt(r)+'倍（歩合では正確に表しきれない）';const k=thousand.n;return `${k/100n}割${(k%100n)/10n}分${k%10n}厘`}return fmt(r)+'倍'}
 const labels={base:'もとにする量',ratio:'割合（何倍か）',compare:'比べる量'},steps=['文・基準','図','式','理由','答え'];
 let mode='home',set='core',index=0,stage=0,done=false,wrong=0,totalWrong=0,completed=new Set(),firstSolved=new Set();
 function vals(p){const b=parse(p.base),r=parse(p.ratio);return{base:b,ratio:r,compare:mul(b,r)}}
 function answer(p){const v=vals(p);return p.percent&&p.unknown==='ratio'?mul(v.ratio,Q(100)):v[p.unknown]}
 function value(p,key,reveal=false){const v=vals(p);if(p.unknown===key&&!reveal)return '□';return key==='ratio'?notation(v.ratio,p.percent?'percent':'times'):fmt(v[key])+p.unit}
 function prompt(p){return p.unknown==='compare'?`${value(p,'base')}の${value(p,'ratio')}は、何${p.unit}でしょうか。`:p.unknown==='ratio'?`${value(p,'compare')}は、${value(p,'base')}の${p.percent?'何％':'何倍'}でしょうか。`:`${value(p,'ratio')}した量が${value(p,'compare')}です。もとの量は何${p.unit}でしょうか。`}
 function expression(p){const v=vals(p),b=fmt(v.base),r=fmt(v.ratio),c=fmt(v.compare);return p.unknown==='compare'?`${b} × ${r}`:p.unknown==='ratio'?`${c} ÷ ${b}`:`${c} ÷ ${r}`}
 function relationship(p,reveal=false){return `${value(p,'base',reveal)} × ${value(p,'ratio',reveal)} ＝ ${value(p,'compare',reveal)}`}
 function reason(p){return p.unknown==='compare'?`もとにする量${value(p,'base')}を1倍と見て、その${value(p,'ratio')}の量を求めるから。`:p.unknown==='ratio'?`比べる量${value(p,'compare')}を、もとにする量${value(p,'base')}で割ると、何倍かが分かるから。`:`比べる量${value(p,'compare')}を${value(p,'ratio')}で割ると、1倍にあたる量にもどるから。`}
 function diagram(p,{reveal=false,reverse=false,line=false,style='times'}={}){
  const v=vals(p),ratio=reverse?1/num(v.ratio):num(v.ratio),scale=430/Math.max(1,ratio),x=65,y=75,bw=scale,cw=scale*ratio;
  const bLabel=reverse?value(p,'compare',reveal):value(p,'base',reveal),cLabel=reverse?value(p,'base',reveal):value(p,'compare',reveal),rLabel=p.unknown==='ratio'&&!reveal?'□':notation(reverse?div(Q(1),v.ratio):v.ratio,style);
  const tick=(tx,ty,label)=>`<path d="M${tx} ${ty-7}v14" stroke="#314d64" stroke-width="2"/><text x="${tx}" y="${ty+30}" text-anchor="middle" font-size="19" fill="#20344a">${label}</text>`;
  const tape=`<rect x="${x}" y="${y}" width="${bw}" height="42" rx="3" fill="#177dad"/><text x="${x}" y="${y-17}" font-size="21" fill="#177dad">もと（1倍）：${bLabel}</text><rect x="${x}" y="${y+112}" width="${cw}" height="42" rx="3" fill="#078a7b"/><text x="${x}" y="${y+96}" font-size="21" fill="#087c71">比べる量：${cLabel}</text><path d="M${x+bw} ${y+42}V${y+162}" stroke="#66827d" stroke-dasharray="6 6"/><text x="${x}" y="${y+198}" font-size="20" fill="#20344a">割合：${rLabel}</text>`;
  const nl=`<text x="${x}" y="35" font-size="19" fill="#20344a">量（${p.unit}）</text><path d="M${x} 95H${x+Math.max(bw,cw)+20} M${x} 225H${x+Math.max(bw,cw)+20}" stroke="#20344a" stroke-width="2"/>${tick(x,95,'0')}${tick(x+bw,95,bLabel)}${Math.abs(bw-cw)>1?tick(x+cw,95,cLabel):''}${tick(x,225,'0')}${tick(x+bw,225,'1倍')}${Math.abs(bw-cw)>1?tick(x+cw,225,rLabel):''}<path d="M${x+bw} 95V225 M${x+cw} 95V225" stroke="#859b97" stroke-dasharray="6 6"/><text x="${x}" y="190" font-size="19" fill="#20344a">割合</text>${Math.abs(bw-cw)<1?`<text x="${x}" y="290" fill="#20344a" font-size="18">もとの量と比べる量は同じ位置</text>`:''}`;
  return `<svg viewBox="0 0 570 325" role="img" aria-label="${line?'二重数直線':'テープ図'}：もと${bLabel}、比べる量${cLabel}、割合${rLabel}">${line?nl:tape}</svg>`;
 }
 function current(){return banks[set][index]}
 function feedback(text,result=''){ $('feedback').textContent=text;$('feedback').dataset.result=result }
 function showScreen(name){for(const s of ['home','activity','explore'])$(s).hidden=s!==name;window.scrollTo(0,0)}
 function start(m){mode=m;if(m==='explore'){showScreen('explore');renderExplore();return}set=$('setSelect').value;index=0;stage=0;done=false;wrong=0;totalWrong=0;completed=new Set();firstSolved=new Set();showScreen('activity');populate();render()}
 function populate(){$('questionSelect').replaceChildren();banks[set].forEach((p,i)=>$('questionSelect').add(new Option(`${i+1} ・ ${labels[p.unknown]}`,i)));$('questionSelect').value=index}
 function syncVisual(){const p=current(),visible=mode==='teacher'?stage>=2:stage>=2; $('visual').hidden=!visible;$('visualPlaceholder').hidden=visible;
  if(!visible)return;$('diagram').innerHTML=diagram(p,{reveal:stage===5,line:$('diagramSelect').value==='line',style:$('notation').value});
  $('relation').textContent=relationship(p,stage===5);$('formula').textContent=stage>=3?`${expression(p)} ＝ ${stage===5?fmt(vals(p)[p.unknown]):'□'}`:'';$('reason').textContent=stage>=4?reason(p):'';
 }
 function button(text,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;$('answerControls').appendChild(b);return b}
 function check(ok,hint,b){if(done)return;if(ok){done=true;if(b)b.classList.add('active-answer');feedback('たしかめられたね。つぎの段階へ進もう。','ok');$('stepButton').disabled=false;if(stage===4){completed.add(current().id);if(!wrong)firstSolved.add(current().id);feedback(`正解！ ${fmt(answer(current()))}${current().unknown==='ratio'?(current().percent?'％':'倍'):current().unit}。 ${reason(current())}`,'ok')}}else{wrong++;totalWrong++;feedback(hint,'ng');$('stepButton').disabled=true}record()}
 function record(){$('record').textContent=mode==='practice'?`たしかめた問題 ${completed.size} / ${banks[set].length}　・　やり直し ${totalWrong}`:'一斉学習：児童の予想を待って、手動で進めます。'}
 function render(){const p=current();done=false;$('questionSelect').value=index;$('modeName').textContent=mode==='teacher'?'先生と かくにん':'図を見て 考える';$('questionType').textContent=`${index+1} / ${banks[set].length} ・ ${labels[p.unknown]}を求める`;$('question').textContent=prompt(p);
  $('progress').innerHTML=steps.map((s,i)=>`<span class="${Math.min(stage,4)===i?'now':stage>i?'done':''}">${s}</span>`).join('');
  $('sourceInfo').textContent=`${p.source?'原教材：'+p.source+' ・ スライド'+p.slide:'アプリ用の追加問'}。対象の目安：${p.grade}年。${p.note}`;
  $('activity').classList.toggle('observing',mode==='practice'&&stage<4);
  $('answerControls').replaceChildren();feedback('先に考えてから、たしかめよう。');$('backButton').hidden=mode!=='teacher';$('backButton').disabled=stage===0;$('hintButton').hidden=mode==='teacher'||stage===5;$('nextButton').hidden=stage!==5;$('stepButton').hidden=stage===5;$('stepButton').disabled=mode==='practice';$('stepButton').textContent=mode==='teacher'?['基準を たしかめる →','図を みる →','式を みる →','理由を みる →','答えを みる →'][stage]:'つぎの段階へ →';
  if(mode==='teacher'){$('instruction').textContent=['文だけで予想しよう。何を1と見る？','基準は「'+value(p,'base')+'」。これを1倍と見ます。','図と文の数を対応させよう。□の量はまだ隠しています。','式のそれぞれの数は、どの量を表している？','なぜこの式になるか、説明しよう。',`答え：${fmt(answer(p))}${p.unknown==='ratio'?(p.percent?'％':'倍'):p.unit}。図でもたしかめよう。`][stage]}
  else if(stage<4){
   const leads=['文の中の「何の何倍か」を、図と見くらべよう。','２本のテープの左端と、1倍の位置を見よう。','図の□が、どの量を表すか見よう。','図と式を見て、なぜこの計算になるか考えよう。'];
   const summaries=['もとにする量'+value(p,'base')+'を、1倍と見ます。',relationship(p)+'。同じ1倍をもとに、量を比べます。',expression(p)+' ＝ □。図の□の量を、この式で求めます。',reason(p)];
   $('instruction').textContent=leads[stage];
   const scene=document.createElement('div');scene.className='observationScene';scene.innerHTML=diagram(p);$('answerControls').append(scene);
   const reveal=button('図を見て たしかめる',()=>{const point=document.createElement('p');point.className='observationTakeaway';point.textContent=summaries[stage];scene.append(point);reveal.disabled=true;done=true;$('stepButton').disabled=false;feedback('図で考えたことを、自分のことばでも話してみよう。');});
  }
  else if(stage===4){$('instruction').textContent='式を計算して、□の量を答えよう。';const label=document.createElement('label');label.textContent='答え';const input=document.createElement('input');input.id='numericAnswer';input.inputMode='decimal';input.autocomplete='off';input.setAttribute('aria-label','答えの数値、小数または分数');label.append(input);label.append(document.createTextNode(p.unknown==='ratio'?(p.percent?'％':'倍'):p.unit));$('answerControls').append(label);
   const submit=()=>{try{check(eq(parse(input.value),answer(p)),'式と図をもういちど見よう。分数は 2/3 のように入力できます。')}catch(e){feedback(e.message,'ng')}};button('答えを たしかめる',submit);input.onkeydown=e=>{if(e.key==='Enter')submit()}}
  else{$('instruction').textContent=`答え：${fmt(answer(p))}${p.unknown==='ratio'?(p.percent?'％':'倍'):p.unit}`;feedback('文・図・式・理由が、同じ関係を表しているね。','ok')}
  if(mode==='teacher'&&stage===5)feedback('文・図・式・理由が、同じ関係を表しているね。','ok');
  $('nextButton').textContent=index===banks[set].length-1?'セットを終える':'つぎの問題 →';syncVisual();record();
 }
 $('stepButton').onclick=()=>{if(mode==='practice'&&!done)return;stage++;render()};$('backButton').onclick=()=>{if(stage>0){stage--;render()}};
 $('hintButton').onclick=()=>{const p=current();feedback(stage===0?'「何の何倍か」の、何を1倍にするかを探そう。':stage===1?'図の「もと（1倍）」と問題の基準は同じかな。':stage===2?reason(p):stage===3?'小数の倍では、かけても小さくなることがあるよ。':`${expression(p)} を計算しよう。分数は / を使って入力できます。`)};
 $('nextButton').onclick=()=>{if(index<banks[set].length-1){index++;stage=0;wrong=0;render()}else{$('instruction').textContent=mode==='practice'?`${completed.size}問をたしかめました。やり直しは${totalWrong}回。基準・図・式・理由を、もういちど説明してみよう。`:'このセットの確認が終わりました。基準・図・式・理由を説明してみよう。';$('nextButton').hidden=true}};
 $('setSelect').onchange=()=>{set=$('setSelect').value;index=0;stage=0;wrong=0;totalWrong=0;completed.clear();firstSolved.clear();populate();render()};$('questionSelect').onchange=()=>{index=+$('questionSelect').value;stage=0;wrong=0;render()};$('diagramSelect').onchange=syncVisual;$('notation').onchange=syncVisual;
 $('homeButton').onclick=()=>{mode='home';showScreen('home')};document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>start(b.dataset.mode));
 function exploreProblem(){const b=parse($('baseInput').value),c=parse($('compareInput').value);if(b.n<=0n||c.n<=0n||num(b)>1000000||num(c)>1000000||num(div(c,b))>100||num(div(c,b))<.01)throw Error('量は0より大きく100万以下、倍率は0.01〜100倍で入力してね。');return {base:fmt(b),ratio:fmt(div(c,b)),unit:'m',unknown:$('unknownSelect').value}}
 function renderExplore(){try{const p=exploreProblem(),r=vals(p).ratio;$('exploreDiagram').innerHTML=diagram(p);$('exploreRelation').textContent=relationship(p);$('exploreFormula').textContent=expression(p)+' ＝ □';$('ratioOutput').textContent=notation(r);$('ratioSlider').value=Math.max(20,Math.min(500,num(r)*100));$('exploreAnswer').textContent='';$('exploreFeedback').textContent='';$('exploreReveal').disabled=false}catch(e){$('exploreFeedback').textContent=e.message;$('exploreReveal').disabled=true;$('exploreAnswer').textContent='';$('exploreDiagram').innerHTML='';$('exploreRelation').textContent='';$('exploreFormula').textContent=''}}
 ['baseInput','compareInput','unknownSelect'].forEach(id=>$(id).onchange=renderExplore);
 $('swapButton').onclick=()=>{[$('baseInput').value,$('compareInput').value]=[$('compareInput').value,$('baseInput').value];renderExplore()};
 $('ratioSlider').oninput=()=>{try{const base=parse($('baseInput').value);$('compareInput').value=fmt(mul(base,Q($('ratioSlider').value,100)));renderExplore()}catch{renderExplore()}};
 $('exploreReveal').onclick=()=>{try{const p=exploreProblem(),v=vals(p);$('exploreDiagram').innerHTML=diagram(p,{reveal:true});$('exploreAnswer').textContent=`□ ＝ ${fmt(v[p.unknown])}${p.unknown==='ratio'?'倍':'m'}。同じ割合は、${notation(v.ratio,'percent')}、${notation(v.ratio,'buai')}。`;if(p.unknown==='ratio'&&v.ratio.d!==1n&&fmt(v.ratio).includes('/'))$('exploreAnswer').textContent+=' 分数は正確な値で表示しています。'}catch(e){$('exploreFeedback').textContent=e.message}};
 // Read-only math helpers also support exact-data validation in the regression script.
 window.WariaiMath={parse,fmt,mul,div,eq,vals,answer};
})();
