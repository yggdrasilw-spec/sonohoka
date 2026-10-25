/* Illustrated applications: values, formulas and bars share the same data. */
'use strict';
window.NarasuApplications = (() => {
 const problems = [
  {id:'juice',group:'平均を求める',title:'オレンジの ジュース',icon:'orange',values:[70,80,95,65,90],unit:'mL',item:'個',question:'5個のオレンジを しぼったよ。1個からとれるジュースは、平均で何mL？'},
  {id:'eggs',group:'平均を求める',title:'たまごの 重さ',icon:'egg',values:[56,55,54,58,55,53,54],unit:'g',item:'個',question:'7個のたまごの重さを はかったよ。平均の重さは何g？'},
  {id:'fish',group:'平均を求める',title:'魚の 長さ',icon:'fish',values:[28,30,29,27],unit:'cm',item:'ひき',question:'4ひきの魚の長さを はかったよ。平均の長さは何cm？',reflection:'平均は28.5cm。でも、今回の4ひきに28.5cmの魚はいないね。平均と同じものが、必ずあるとは限らないよ。'},
  {id:'scores',group:'0と小数',title:'0点の試合も 数える？',icon:'ball',values:[1,4,0,5,3,2],unit:'点',item:'試合',question:'6試合の得点だよ。1試合に平均で何点とったかな？',choice:{question:'0点の試合もしたよ。何試合で わる？',options:['5試合','6試合'],correct:1,why:'0点でも1試合。6試合全部の得点を、6でわるよ。'},reflection:'平均2.5点は、6試合の得点をならした値だよ。1試合で実際に2.5点をとった、という意味ではないよ。'},
  {id:'total',group:'全体を予想する',title:'20個なら どのくらい？',icon:'orange',values:[70,80,95,65,90],unit:'mL',item:'個',kind:'total',factor:20,question:'5個を調べて、20個分を予想しよう。まず、1個分の平均は何mL？'},
  {id:'wheel',group:'はかった値を使う',title:'タイヤが 1回転すると？',icon:'wheel',values:[150.2,150.9,150.3,150.6,150.5],unit:'cm',item:'回',question:'同じタイヤを1回転させて進む長さを、5回はかったよ。このデータの平均は何cm？',reflection:'同じものでも、はかるたびに少しずれることがあるね。何回かはかった値の平均を、長さの見当として使えるよ。'},
  {id:'failure',group:'はかった値を使う',title:'失敗した実験を どうする？',icon:'car',values:[7.4,0.8,7.8,7.6,8],unit:'m',item:'回',exclude:1,question:'同じだけゴムをのばして車を走らせたよ。2回目は途中で手が当たって、車を止めてしまった。うまく走ったときの道のりを予想しよう。',choice:{question:'今回の目的には、どのデータを使う？',options:['5回を全部使う','失敗した2回目を除く'],correct:1,why:'今回は「うまく走ったとき」を調べるので、手で止めた2回目を除いた4回を使うよ。'},reflection:'5回全部の平均は6.32m。成功した4回の平均は7.7m。目的と失敗の理由を確かめて選ぼう。小さい値だから、という理由だけでは除かないよ。'},
  {id:'stride',group:'はかった値を使う',title:'自分の 歩はば',icon:'steps',values:[648,641,652],unit:'cm',item:'回',kind:'stride',factor:10,question:'10歩で歩いた長さを3回はかったよ。まず、10歩分の長さの平均は何cm？'}
 ];
 const sum=a=>a.reduce((x,y)=>x+y,0),fmt=x=>String(Number(x.toFixed(6)));
 const current=s=>problems[s.index];
 const ready=s=>!current(s).choice||s.choice===current(s).choice.correct;
 const active=s=>current(s).values.filter((_,i)=>!(current(s).exclude===i&&ready(s)));
 const stats=s=>{const values=active(s),total=sum(values);return {values,total,n:values.length,mean:total/values.length};};
 const initial=(index=0)=>({index,step:0,choice:null,solved:false,hint:0,leveled:false,draft:'',feedback:''});
 const valid=s=>!!s&&Number.isInteger(s.index)&&s.index>=0&&s.index<problems.length&&Number.isInteger(s.step)&&s.step>=0&&s.step<=(current(s).kind?1:0)&&[null,0,1].includes(s.choice)&&['solved','leveled'].every(k=>typeof s[k]==='boolean')&&Number.isInteger(s.hint)&&s.hint>=0&&s.hint<=3&&typeof s.draft==='string'&&s.draft.length<=50&&typeof s.feedback==='string'&&s.feedback.length<=1000&&(!(s.solved||s.leveled||s.step)||ready(s));
 const target=s=>{const p=current(s),a=stats(s).mean;return s.step===0?a:p.kind==='total'?a*p.factor:Math.round(a/p.factor);};
 const question=s=>s.step===0?current(s).question:current(s).kind==='total'?'1個分を平均と同じ量と考えると、20個では何mLと予想できる？':'10歩分の平均から、1歩分を求めよう。四捨五入して、整数で約何cm？';
 const equation=s=>{const p=current(s),a=stats(s);return s.step===0?`${a.values.map(fmt).join(' ＋ ')} ＝ ${fmt(a.total)} ${p.unit}　／　${fmt(a.total)} ÷ ${a.n} ＝ ${fmt(a.mean)} ${p.unit}`:p.kind==='total'?`${fmt(a.mean)} × ${p.factor} ＝ ${fmt(target(s))} mL（予想）`:`${fmt(a.mean)} ÷ ${p.factor} ＝ ${fmt(a.mean/p.factor)} cm → 約 ${target(s)} cm`;};
 let animation=null,frame=0,epoch=0,visual=null,context=null;
 function cancel(){epoch++;cancelAnimationFrame(frame);animation=null;visual=null;}
 function pause(){if(!animation)return;animation.paused=!animation.paused;animation.last=0;}
 function picture(icon){
  const shapes={
   orange:'<circle cx="48" cy="43" r="27" fill="#ffad38" stroke="#bc6518" stroke-width="3"/><path d="M48 16Q48 2 64 8Q63 23 48 16" fill="#3a9354"/><path d="M31 34q4-8 11-9" fill="none" stroke="#ffe6b3" stroke-width="5"/>',
   egg:'<path d="M48 9C25 9 12 64 35 72C81 90 85 11 48 9Z" fill="#fff1c9" stroke="#a2814b" stroke-width="3"/>',
   fish:'<path d="M73 42L91 23V61L73 45Q40 80 10 42Q40 7 73 42Z" fill="#78c6df" stroke="#276885" stroke-width="3"/><circle cx="28" cy="36" r="4" fill="#203c4b"/><path d="M43 36L57 42L43 51" fill="#e3f6fb"/>',
   ball:'<circle cx="48" cy="42" r="32" fill="#fafafa" stroke="#344e5a" stroke-width="3"/><path d="M48 25L63 36L57 53H39L33 36Z M22 21L30 25L21 42L16 42 M75 21L66 26L76 42L80 42 M24 66L34 55L39 70 M72 66L62 55L57 71" fill="#344e5a"/>',
   wheel:'<circle cx="48" cy="43" r="31" fill="#e9f6f4" stroke="#314d59" stroke-width="6"/><path d="M48 12V74M17 43H79M26 21L70 65M26 65L70 21" stroke="#6d969b" stroke-width="2"/><circle cx="48" cy="43" r="5" fill="#007e80"/>',
   car:'<path d="M12 29H78L91 55H7Z" fill="#57b8c1" stroke="#276885" stroke-width="3"/><path d="M27 29L35 15H62L72 29" fill="#d7f4f2" stroke="#276885" stroke-width="3"/><circle cx="26" cy="59" r="12" fill="#344e5a"/><circle cx="72" cy="59" r="12" fill="#344e5a"/>',
   steps:'<path d="M25 12Q8 8 10 30L18 52Q33 59 36 41L34 20Z M61 31Q44 27 46 49L54 71Q69 78 72 60L70 39Z" fill="#599c8d"/><path d="M17 60L21 71L35 67L32 57 M53 78L56 85L72 81L70 75" fill="#344e5a"/>'
  };
  return `<svg viewBox="0 0 100 90" aria-hidden="true">${shapes[icon]}</svg>`;
 }
 function graph(s,values){
  const p=current(s),a=stats(s),v=values||p.values.map((q,i)=>p.exclude===i&&ready(s)?null:s.leveled?a.mean:q),max=Math.max(...p.values)*1.16,n=v.length,base=235,scale=180/max,bar=42,space=490/n;
  const bars=v.map((q,i)=>{const x=80+i*space;return `<g data-app-bar="${i}" data-value="${q===null?'excluded':q}"><title>${i+1}${p.item}目：${q===null?'計算から除いた値':fmt(q)+' '+p.unit}</title><text x="${x+21}" y="265" text-anchor="middle">${i+1}</text>${q===null?`<path d="M${x} 211l42 24m0-24l-42 24" stroke="#9b4d42" stroke-width="3"/><text x="${x+21}" y="196" text-anchor="middle" class="appGraphSmall">除く</text>`:`<rect x="${x}" y="${base-q*scale}" width="${bar}" height="${q*scale}" rx="3" fill="#59b9af"/><rect x="${x}" y="55" width="${bar}" height="180" fill="none" stroke="#c4d9dc" stroke-dasharray="3 4"/><text x="${x+21}" y="${Math.max(32,base-q*scale-9)}" text-anchor="middle" class="appGraphValue">${fmt(q)}</text>`}</g>`;}).join('');
  const line=s.leveled?`<path d="M65 ${base-a.mean*scale}H590" stroke="#ae5519" stroke-width="2" stroke-dasharray="6 5"/>`:'';
  return `<svg id="appGraph" viewBox="0 0 620 290" role="img" aria-label="${p.title}。量を棒の高さで表したグラフ。${s.leveled?'同じ高さになったよ。':''}"><text x="10" y="28" class="appGraphSmall">${p.unit}</text><text x="38" y="240">0</text><path d="M65 50V235H590" fill="none" stroke="#54747c" stroke-width="2"/>${bars}${line}<text x="585" y="285" text-anchor="end" class="appGraphSmall">${p.item}目</text></svg>`;
 }
 function draw(){const old=document.getElementById('appGraph');if(old&&context)old.outerHTML=graph(context.state,visual);}
 function demonstrate(){
  if(!context||animation||!ready(context.state))return;
  const {state:s,settings,onChange}=context,p=current(s),a=stats(s),moves=[],work=p.values.map((q,i)=>p.exclude===i?null:q);
  for(let guard=0;guard<30;guard++){
   const hi=work.findIndex(v=>v!==null&&v>a.mean+1e-8),lo=work.findIndex(v=>v!==null&&v<a.mean-1e-8);
   if(hi<0||lo<0)break;
   const q=Math.min(work[hi]-a.mean,a.mean-work[lo]);moves.push({before:[...work],hi,lo,q});work[hi]-=q;work[lo]+=q;
  }
  cancel();const id=epoch;visual=p.values.map((q,i)=>p.exclude===i?null:q);animation={paused:false,last:0,elapsed:0,moves};
  const duration=settings.speed==='reduced'?180:settings.speed==='slow'?3000:1400;
  document.getElementById('appGraphHint').textContent='多い棒から少ない棒へ。棒で表した量の合計は変わらないよ。';
  document.getElementById('appDemo').disabled=true;document.getElementById('pause').hidden=false;
  document.getElementById('pause').textContent='Ⅱ 一時停止';
  document.getElementById('undo').disabled=false;
  for(const control of document.querySelectorAll('#appAnswerForm input,#appAnswerForm button'))control.disabled=true;
  function tick(now){
   if(id!==epoch||!animation)return;
   if(!animation.paused&&animation.last)animation.elapsed+=Math.min(80,now-animation.last);animation.last=now;
   const progress=Math.min(animation.elapsed/duration,Math.max(1,moves.length)),index=Math.min(moves.length-1,Math.floor(progress));
   if(moves.length){const move=moves[index],t=Math.min(1,progress-index),moved=Math.min(move.q,Math.floor(move.q*t*10+1e-8)/10);visual=[...move.before];visual[move.hi]-=moved;visual[move.lo]+=moved;draw();}
   if(progress>=moves.length){cancel();onChange({...s,leveled:true,feedback:'量を表す棒が、同じ高さになったね。実物を切ったり、重さを変えたりしたわけではないよ。'});return;}
   frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
 }
 function hint(){
  if(!context)return;const {state:s,onChange}=context,p=current(s),a=stats(s),h=Math.min(3,s.hint+1);
  const hints=!ready(s)?['まず、どのデータを数えるかを選ぼう。',p.choice.why,p.choice.why]:s.step===0?['合計を求めてから、データの個数で等しく分けよう。',`使うデータは${a.n}${p.item}分。${a.values.map(fmt).join(' ＋ ')} を計算しよう。`,`合計は${fmt(a.total)}${p.unit}。${fmt(a.total)} ÷ ${a.n} で考えよう。`]:p.kind==='total'?['1個分を平均と同じ量と考えて、個数分を求めよう。','平均 × 全部の個数で、全体を予想できるよ。',`${fmt(a.mean)} × ${p.factor} を計算しよう。`]:['これは10歩分の長さだよ。1歩分にするには？','10でわってから、四捨五入して整数にしよう。',`${fmt(a.mean)} ÷ 10 ＝ ${fmt(a.mean/10)}。小数第1位を見て、整数にしよう。`];
  onChange({...s,hint:h,feedback:hints[h-1]});
 }
 function render(host,ctx){
  cancel();context=ctx;const {state:s,onChange}=ctx,p=current(s),a=stats(s);
  host.replaceChildren();
  const chooser=document.createElement('label');chooser.className='appChooser';chooser.textContent='問題をえらぶ';const select=document.createElement('select');select.id='appProblem';
  for(const group of [...new Set(problems.map(p=>p.group))]){const g=document.createElement('optgroup');g.label=group;problems.forEach((q,i)=>{if(q.group===group){const o=document.createElement('option');o.value=i;o.textContent=`${i+1}. ${q.title}`;g.append(o);}});select.append(g);}select.value=s.index;select.onchange=()=>onChange(initial(Number(select.value)),true);chooser.append(select);host.append(chooser);
  const cards=document.createElement('div');cards.className='appCards';
  p.values.forEach((q,i)=>{const c=document.createElement('div');c.className='appCard';if(p.exclude===i&&ready(s))c.classList.add('excluded');c.innerHTML=picture(p.icon);const label=document.createElement('span');label.textContent=`${i+1}${p.item}目${p.exclude===i?'（失敗）':''}`;const value=document.createElement('strong');value.textContent=`${fmt(q)} ${p.unit}`;c.append(label,value);cards.append(c);});host.append(cards);
  if(p.choice){const field=document.createElement('fieldset');field.className='appChoice';const legend=document.createElement('legend');legend.textContent=p.choice.question;field.append(legend);p.choice.options.forEach((text,i)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-pressed',s.choice===i);b.disabled=s.solved;b.onclick=()=>onChange({...s,choice:i,leveled:false,solved:false,draft:'',feedback:i===p.choice.correct?p.choice.why:p.id==='scores'?'0点でも試合をしたね。0を除くと、何試合の平均になってしまうかな？':'今回は、手で止めてしまった回があるね。「うまく走ったとき」を調べる目的に合うのはどちらかな？'});field.append(b);});host.append(field);}
  const body=document.createElement('div');body.className='appBody';
  const figure=document.createElement('figure');figure.className='appFigure';const scroll=document.createElement('div');scroll.className='appGraphScroll';scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','量のグラフ。小さい画面では左右にスクロールできます');scroll.innerHTML=graph(s);figure.append(scroll);const caption=document.createElement('figcaption');caption.textContent='量を棒で表した図（実物の形や重さは変えないよ）';figure.append(caption);const graphHint=document.createElement('p');graphHint.id='appGraphHint';graphHint.className='help';graphHint.textContent=s.leveled?`使う量の合計は ${fmt(a.total)} ${p.unit} のまま。同じ高さが平均だよ。`:'「ならす動きを見る」で、多い部分を少ないところへ移せるよ。';figure.append(graphHint);
  const demo=document.createElement('button');demo.id='appDemo';demo.type='button';demo.textContent='ならす動きを見る';demo.disabled=!ready(s);demo.onclick=demonstrate;figure.append(demo);body.append(figure);
  const task=document.createElement('div');task.className='appTask';const label=document.createElement('p');label.className='appTaskLabel';label.textContent=s.step===0?'平均を求めよう':p.kind==='total'?'平均を使って 全体を予想しよう':'平均を使って 1歩分を求めよう';task.append(label);
  if(s.step===1){const known=document.createElement('p');known.className='appKnown';known.textContent=`${p.kind==='total'?'1個分':'10歩分'}の平均：${fmt(a.mean)} ${p.unit}`;task.append(known);}
  if(!s.solved){const form=document.createElement('form');form.id='appAnswerForm';const answerLabel=document.createElement('label');answerLabel.htmlFor='appAnswer';answerLabel.textContent=s.step===0?`平均は何${p.unit}？`:p.kind==='total'?'20個分は何mL？':'1歩分は約何cm？（整数）';const row=document.createElement('div');row.className='answerRow';const input=document.createElement('input');input.id='appAnswer';input.type='number';input.min='0';input.step='any';input.inputMode='decimal';input.autocomplete='off';input.value=s.draft;input.disabled=!ready(s);input.oninput=()=>{s.draft=input.value.slice(0,50);};const submit=document.createElement('button');submit.type='submit';submit.className='primary';submit.textContent='たしかめる';submit.disabled=!ready(s);row.append(input,submit);form.append(answerLabel,row);form.onsubmit=e=>{e.preventDefault();if(!ready(s)||animation)return;const raw=input.value;if(!raw.trim())return onChange({...s,feedback:'答えを入れてみよう。'});if(Math.abs(Number(raw)-target(s))>1e-8)return onChange({...s,draft:raw,feedback:s.step===0?'合計を、使うデータの個数でわって たしかめよう。':p.kind==='total'?'1個分の平均が、20個分あると考えよう。':'10歩分を10でわってから、四捨五入しよう。'});if(s.step===0&&p.kind)return onChange({...s,step:1,hint:0,draft:'',feedback:`平均は ${fmt(a.mean)} ${p.unit} だね。次は、その平均を使おう。`});onChange({...s,solved:true,draft:'',feedback:'できたね！ '+equation(s)});};task.append(form);}
  if(s.solved){const formula=document.createElement('p');formula.id='appEquation';formula.className='appEquation';formula.textContent=equation(s);task.append(formula);const explanation=document.createElement('p');explanation.id='appReflection';explanation.textContent=p.reflection||(p.kind==='total'?'平均を使った予想だよ。実際には、オレンジ1個ごとの量が違うので、必ずこの合計になるわけではないよ。':p.kind==='stride'?'約65cmの歩はばを使うと、およその道のりを調べられるね。歩はばは毎回ぴったり同じではないよ。':'いくつかの量を等しい大きさにならした値が、平均だよ。');task.append(explanation);}
  body.append(task);host.append(body);
 }
 return {problems,initial,valid,current,stats,target,question,equation,render,cancel,pause,hint,demonstrate,snapshot:()=>({busy:!!animation,paused:!!animation?.paused,values:visual?[...visual]:null})};
})();
