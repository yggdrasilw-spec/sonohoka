/* All amounts live in this model. SVG positions never determine an answer. */
'use strict';
(() => {
const $ = id => document.getElementById(id);
const names = ['玉','土','水','水差し','式','練習'];
const waterSets = [[180,60],[180,60,120],[200,80,160,40],[200,50,150,100,100]];
const soilSets = [[5,4,1,2],[1,5,5,1],[5,1,5,1],[2,4,2,4,3],[1,2,6,2,4,3]];
const exercises = [
 {type:'beads',values:[4,2,3],text:'玉を うつして、同じ高さにしよう。'},
 {type:'water',values:[160,80],text:'2この水を ならすと、1こ分は何mL？'},
 {type:'water',values:[60,120,90],text:'全部の量と コップの数から 考えよう。'},
 {type:'water',values:[80,160,120,40],text:'式で考えよう。1こ分は何mL？',hide:true},
 {type:'water',values:[100,200,150,180,120],text:'5このコップに、全部で750mL。ならすと1こ分は何mL？',hide:true,word:true},
 {type:'water',values:[0,120,180],text:'空のコップもあるよ。3こで ならすと何mL？'},
 {type:'water',values:[100,150],text:'水は小さく分けられるよ。2こで ならすと何mL？'}
];
const KEY = 'heikin-narasu-v1';
let S, history = [], tx = null, frame = 0, token = 0, selected = null, destination = null, hint = 0, message = '', drag = null;
let soilAuto=false,soilPaused=false,soilTimer=0;
let settings = {speed:matchMedia('(prefers-reduced-motion: reduce)').matches?'reduced':'normal',speech:true,numbers:true,line:false};
const sum = a => a.reduce((x,y)=>x+y,0);
const copy = x => JSON.parse(JSON.stringify(x));
const average = () => sum(S.original)/S.original.length;
const type = () => S.stage===0?'beads':S.stage===1?'soil':S.stage===5?exercises[S.practice].type:'water';
const unit = () => type()==='water'?'mL':type()==='beads'?'こ':'単位';
const allEqual = () => S.values.every(v=>v===average()) && !S.bucket && !S.jug;
const fmt = n => Number.isInteger(n)?String(n):n.toFixed(1);
function fresh(stage=0, values, extra={}) {
 const defaults = stage===0?[5,4,1,2]:stage===1?soilSets[0]:stage===5?exercises[0].values:waterSets[0];
 S={stage,original:[...(values||defaults)],values:[...(values||defaults)],bucket:0,jug:0,vehicle:0,jugPhase:'collect',collected:[],waterIndex:0,soilIndex:0,practice:0,step:0,solved:false,diagram:stage===4?1:0,distributionStarted:false,...extra};
 history=[];selected=null;destination=null;hint=0;message='';
}
function persist() {try{localStorage.setItem(KEY,JSON.stringify({state:S,history:history.slice(-60),settings}));}catch{}}
function tell(text) {message=text;render();}
function cancel() {token++;cancelAnimationFrame(frame);clearTimeout(soilTimer);soilAuto=false;soilPaused=false;tx=null;selected=null;destination=null;if('speechSynthesis' in window)speechSynthesis.cancel();}
function checkpoint() {history.push(copy(S));if(history.length>100)history.shift();}
function go(stage) {
 cancel();
 if(stage===3 && S.stage===2){S.stage=3;S.jugPhase='collect';S.collected=[];S.step=0;history=[];hint=0;message='';}
 else if(stage===4 && (S.stage===2||S.stage===3)){S.stage=4;S.values=S.original.slice();S.jug=0;S.bucket=0;S.step=0;S.solved=false;S.diagram=0;history=[];hint=0;message='';}
 else fresh(stage);
 render();persist();if(stage===1)startSoil();
}
function reset() {cancel();const original=S.original.slice();const extras={waterIndex:S.waterIndex,soilIndex:S.soilIndex,practice:S.practice};fresh(S.stage,original,extras);if(S.stage===5)S.diagram=exercises[S.practice].hide?2:0;render();persist();if(S.stage===1)startSoil();}
function startSoil(){soilAuto=true;soilPaused=false;scheduleSoil();render();}
function scheduleSoil(){
 clearTimeout(soilTimer);if(!soilAuto||soilPaused||S.stage!==1||tx)return;
 if(allEqual()){soilAuto=false;message='高いところの土を、低いところへ。たいらにすることを「ならす」というよ。';render();return;}
 soilTimer=setTimeout(()=>{if(!soilAuto||soilPaused||S.stage!==1)return;const a=average();selected=S.bucket?S.values.findIndex(v=>v<a):S.values.findIndex(v=>v>a);soilAction(!S.bucket);},settings.speed==='reduced'?100:settings.speed==='slow'?1000:650);
}
function undo() {if(tx){cancel();message='動きを取り消したよ。';}else if(history.length){cancel();S=history.pop();message='ひとつ前に もどしたよ。';}hint=0;render();persist();}
function refValue(state, ref) {return typeof ref==='number'?state.values[ref]:state[ref];}
function changeRef(state, ref, delta) {if(typeof ref==='number')state.values[ref]+=delta;else state[ref]+=delta;}
function transfer(from,to,amount,after) {
 if(tx||amount<=0)return;
 const before=copy(S),next=copy(S);changeRef(next,from,-amount);changeRef(next,to,amount);
 if(refValue(next,from)<0 || refValue(next,to)<0)throw Error('Negative quantity');
 if(after)after(next);
 selected=null;destination=null;message=type()==='soil'?(from==='bucket'?'土を運んで、低いところに いれるよ。':'高いところの土を けずって、バケットにためるよ。'):'';
 const id=++token;
 tx={before,next,from,to,amount,progress:0,paused:false,last:0,elapsed:0,transit:0};
 const duration=settings.speed==='slow'?1800:settings.speed==='reduced'?160:850;
 render();
 function tick(now){
  if(!tx||id!==token)return;
  if(!tx.paused && tx.last)tx.elapsed+=Math.min(now-tx.last,80);
  tx.last=now;tx.progress=Math.min(tx.elapsed/duration,1);
  renderBoard();renderTotals();
  if(tx.progress>=1){checkpoint();S=next;tx=null;message=completionMessage();render();persist();if(S.stage===1)scheduleSoil();return;}
  frame=requestAnimationFrame(tick);
 }
 frame=requestAnimationFrame(tick);
}
function visual() {
 if(!tx)return {...copy(S),transit:0};
 const v=copy(tx.before),p=type()==='soil'?Math.max(0,(tx.progress-.4)/.6):tx.progress;
 const removed=type()==='beads'?tx.amount:Math.round(tx.amount*Math.min(1,p*2));
 const arrived=type()==='beads'?0:Math.round(tx.amount*Math.max(0,p*2-1));
 changeRef(v,tx.from,-removed);changeRef(v,tx.to,arrived);v.transit=removed-arrived;return v;
}
function completionMessage() {
 if(S.stage===3){if(S.jugPhase==='divide'&&!S.jug)return 'どのコップも '+fmt(average())+' mL。このように ならした量を「平均」といいます。';if(S.jugPhase==='divide')return '全部 集まったね。もとの '+S.values.length+'このコップに 分けよう。';return '水差しに '+S.jug+' mL 集まったよ。';}
 if(allEqual())return S.stage===1?'高いところの土を、低いところへ。たいらにすることを「ならす」というよ。':'どこも '+fmt(average())+' '+unit()+'。ならせたね！ 全部の量は 変わらないよ。';
 if(S.stage===1)return S.bucket?'けずった土は バケットの中。低いところへ 運ぶよ。':'低いところが 上がったね。次の高いところへ 向かうよ。';
 return 'うつせたね。多いところと 少ないところを 見てみよう。';
}
function selectColumn(i) {
 if(tx)return;
 if(S.stage===4)return tell('元の量のカードを見て、下の答えを入れよう。');
 if(S.stage===3){if(S.jugPhase==='collect')collect(i);else tell('水差しの下のボタンで、同じ量ずつ分けよう。');return;}
 if(type()==='soil')return;
 if(selected===null){if(!S.values[i])return tell('ここは空だよ。うつす元を えらぼう。');selected=i;tell((i+1)+'ばんから、どこへ うつす？');return;}
 if(selected===i){selected=null;destination=null;tell('選び直せるよ。うつす元を えらぼう。');return;}
 if(type()==='beads') {if(S.values[i]>=6)return tell('この棒は いっぱいだよ。別の棒を えらぼう。');transfer(selected,i,1);}
 else {destination=i;tell((selected+1)+' → '+(i+1)+'ばん。「うつす」で量をえらぼう。');}
}
function pour(amount) {
 if(tx)return;
 if(selected===null||destination===null)return tell('うつす元と うつす先を えらぼう。');
 if(S.values[selected]<amount)return tell('元の水が '+amount+' mLより 少ないよ。小さい量をえらぼう。');
 if(S.values[destination]+amount>300)return tell('300 mLを こえるよ。小さい量をえらぼう。');
 transfer(selected,destination,amount);
}
function soilAction(dig) {
 if(tx)return;
 if(selected===null)return tell('先に、土の場所を えらぼう。');
 const i=selected,a=average();
 const q=dig?Math.min(S.values[i]-a,2-S.bucket):Math.min(a-S.values[i],S.bucket);
 if(q<=0)return tell(dig?'線より高い場所をえらぼう。バケットがいっぱいなら、先にいれよう。':'土の入ったバケットから、線より低い場所へいれよう。');
 transfer(dig?i:'bucket',dig?'bucket':i,q,n=>{n.vehicle=i;});
}
function collect(i) {
 if(tx)return;
 if(!S.values[i])return tell('このコップは空だよ。空でも、分けるコップの数に入るよ。');
 const q=S.values[i];transfer(i,'jug',q,n=>{n.collected.push(q);if(n.values.every(v=>!v))n.jugPhase='divide';});
}
function distribute(all) {
 if(tx||S.jugPhase!=='divide'||!S.jug)return;
 const remaining=S.jug/S.values.length;
 const step=remaining%10===0?10:5;
 const q=all?remaining:Math.min(step,remaining);
 // One full round is one undoable transaction; the pitcher decreases as all cups rise.
 const before=copy(S),next=copy(S);next.values=next.values.map(v=>v+q);next.jug-=q*next.values.length;next.distributionStarted=true;
 const id=++token;selected=null;destination=null;message='';
 tx={before,next,from:'jug',to:'all',amount:q*next.values.length,progress:0,paused:false,last:0,elapsed:0};
 render();const duration=settings.speed==='slow'?2600:settings.speed==='reduced'?160:1400;
 function tick(now){if(!tx||id!==token)return;if(!tx.paused&&tx.last)tx.elapsed+=Math.min(now-tx.last,80);tx.last=now;tx.progress=Math.min(1,tx.elapsed/duration);renderBoard();renderTotals();if(tx.progress===1){checkpoint();S=next;tx=null;message=completionMessage();render();persist();return;}frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);
}
// Distribution animates one cup at a time, so each visible amount still adds to the total.
const transferVisual=visual;
function view() {
 if(!tx||tx.to!=='all')return transferVisual();
 const v=copy(tx.before),n=v.values.length,q=tx.amount/n;
 const position=tx.progress*n,index=Math.min(n-1,Math.floor(position)),fraction=position-index;
 for(let i=0;i<index;i++){v.values[i]+=q;v.jug-=q;}
 const removed=Math.round(q*Math.min(1,fraction*2)),arrived=Math.round(q*Math.max(0,fraction*2-1));
 v.jug-=removed;v.values[index]+=arrived;v.transit=removed-arrived;v.activeCup=index;return v;
}
function demonstrate() {
 if(tx)return;
 if(S.stage===4){giveHint();return;}
 if(S.stage===3){if(S.jugPhase==='collect'){const i=S.values.findIndex(v=>v>0);if(i>=0)collect(i);}else distribute(false);return;}
 const a=average(),hi=S.values.findIndex(v=>v>a),lo=S.values.findIndex(v=>v<a);
 if(allEqual())return tell(completionMessage());
 if(type()==='soil'){selected=S.bucket?lo:hi;soilAction(!S.bucket);}
 else if(hi>=0&&lo>=0)transfer(hi,lo,type()==='beads'?1:Math.min(S.values[hi]-a,a-S.values[lo],50));
}
function giveHint() {
 if(tx)return;
 hint=Math.min(3,hint+1);const a=average();
 if(S.stage>=4){const total=sum(S.original);tell(hint===1?'全部の量を 足そう。空のコップも1こだよ。':hint===2?'合計は '+total+' '+unit()+'。'+S.original.length+'こに 同じ量ずつ分けよう。':total+' ÷ '+S.original.length+' ＝ '+fmt(a)+'。図でも たしかめよう。');}
 else if(hint===1)tell('多いところは どこかな？');
 else if(hint===2)tell('少ないところに うつしてみよう。全部の量は 変わらないよ。');
 else tell('この点線の高さに そろえてみよう。');
}
function answer(event) {
 event.preventDefault();if(tx||S.solved)return;
 const raw=$('answer').value;if(raw.trim()==='')return tell('答えを 入れてみよう。');
 const value=Number(raw),total=sum(S.original),n=S.original.length,a=average();
 const target=S.stage===4||S.practice===2?(S.step===0?total:S.step===1?n:a):a;
 if(value!==target){tell(S.step===0&&(S.stage===4||S.practice===2)?'元の量を 全部 足してみよう。':S.step===1&&(S.stage===4||S.practice===2)?'空のコップも入れて、コップの数を数えよう。':value===total?'それは全部の量だね。コップの数で わると、1こ分になるよ。':'合計 ÷ 個数で たしかめよう。「図でたしかめる」も使えるよ。');return;}
 checkpoint();if((S.stage===4||S.practice===2)&&S.step<2){S.step++;message='そうだね！ 次を考えよう。';}else{S.solved=true;message='できたね！ '+total+' ÷ '+n+' ＝ '+fmt(a)+' '+unit()+'。';}render();persist();if(!S.solved)$('answer').focus();
}
function next() {
 if(tx)return;
 if(S.stage===2&&S.waterIndex<3){cancel();const index=S.waterIndex+1;fresh(2,waterSets[index],{waterIndex:index});}
 else if(S.stage===5){if(S.practice<exercises.length-1){cancel();const i=S.practice+1;fresh(5,exercises[i].values,{practice:i,diagram:exercises[i].hide?2:0});}else return tell('練習はおしまい。全部を合わせ、同じ数に分けると 平均が求められるね！');}
 else {go(Math.min(5,S.stage+1));return;}render();persist();
}
function defaultMessage() {
 if(S.stage===0)return '高い棒から 低い棒へ。いちばん上の玉を うつそう。';
 if(S.stage===1)return 'ブルドーザーが 地面を「ならす」ところを 見てみよう。';
 if(S.stage===2)return 'コップを2つ選んで、同じ量にしてみよう。';
 if(S.stage===3)return S.jugPhase==='collect'?'コップを1つずつ選んで、水差しに集めよう。':'もとのコップに、同じ量ずつ分けよう。';
 if(S.stage===4)return '元の量のカードを見て、順に計算しよう。';
 return exercises[S.practice].text;
}
function btn(label,fn,options={}) {const b=document.createElement('button');b.textContent=label;b.type='button';b.disabled=!!tx||!!options.disabled;if(options.id)b.id=options.id;if(options.primary)b.className='primary';if(options.pressed!==undefined)b.setAttribute('aria-pressed',options.pressed);b.onclick=fn;return b;}
function render() {
 document.querySelector('.lesson').dataset.stage=S.stage;
 $('scenes').replaceChildren(...names.map((name,i)=>{const b=btn(name,()=>go(i));b.disabled=false;b.innerHTML='<small>'+String(i+1).padStart(2,'0')+'</small>'+name;if(S.stage===i)b.setAttribute('aria-current','step');return b;}));
 $('eyebrow').textContent='やってみよう '+(S.stage+1)+' / 6';
 $('lessonTitle').textContent=['ならしてみよう！','地面を「ならす」って？','同じ量に しよう','まとめてから 分けたら？','図がなくても 分かるかな？','べつの問題でも やってみよう'][S.stage];
 $('message').textContent=message||defaultMessage();
 const sub=$('subnav');sub.replaceChildren();
 if(S.stage===2)waterSets.forEach((v,i)=>sub.append(btn((i+2)+'このコップ',()=>{cancel();fresh(2,v,{waterIndex:i});render();persist();},{pressed:S.waterIndex===i})));
 if(S.stage===1){const b=btn('べつの地面を 見る',()=>{cancel();const i=(S.soilIndex+1)%soilSets.length;fresh(1,soilSets[i],{soilIndex:i});render();persist();startSoil();},{id:'anotherSoil'});b.disabled=false;sub.append(b);}
 if(S.stage===5)sub.append(btn('問題 '+(S.practice+1)+' / '+exercises.length,()=>{}, {disabled:true}));
 const cards=$('cards');cards.replaceChildren();
 if(S.stage>=3){
  const word=S.stage===5&&exercises[S.practice].word;
  const cardValues=word?[sum(S.original)]:S.original;
  cardValues.forEach((v,i)=>{const c=document.createElement('div');c.className='card';const small=document.createElement('small');small.textContent=word?'5このコップ 全部で':'元の量 '+(i+1)+'ばん';c.append(small,document.createTextNode(v+' '+unit()));cards.append(c);});
 }
 const drawing=$('drawing');drawing.hidden=S.stage>=4&&S.diagram===2;drawing.classList.toggle('small',S.stage>=4&&S.diagram===1);
 renderBoard();renderMath();renderTotals();
 const actions=$('actions');actions.replaceChildren();
 if(type()==='soil')actions.append(document.createTextNode('見る教材：高いところから、低いところへ。土は すてないよ。'));
 if(S.stage===2||(S.stage===5&&type()==='water')){
  const u=average()%10===0&&S.original.every(v=>v%10===0)?10:5;
  [u,50].forEach(q=>actions.append(btn(q+' mL うつす',()=>pour(q),{id:'pour'+q,primary:destination!==null})));
  actions.append(btn('そろったかな？',()=>tell(allEqual()?completionMessage():((S.values.indexOf(Math.max(...S.values))+1)+'ばんが 多いね。少ないコップへ うつしてみよう。'))));
  if(S.stage===2)actions.append(btn('まとめる方法へ →',()=>go(3),{id:'toJug'}));
 }
 if(S.stage===3&&S.jugPhase==='divide'){
  actions.append(btn('少しずつ 1巡 分ける',()=>distribute(false),{id:'round',disabled:!S.jug}),btn('同じ量に 分ける',()=>distribute(true),{id:'divide',primary:true,disabled:!S.jug}));
 }
 if(S.stage>=4){
  actions.append(btn(S.diagram===2?'図でたしかめる':S.diagram===0?'図を小さくする':'図をかくす',()=>{S.diagram=(S.diagram+1)%3;render();persist();},{id:'toggleDiagram'}));
  if(S.stage===5&&S.solved)actions.append(btn('答えの図を 見る',()=>{checkpoint();S.values=S.values.map(()=>average());S.diagram=0;render();persist();},{id:'solutionDiagram'}));
 }
 $('undo').disabled=!tx&&!history.length;$('reset').disabled=false;$('hint').disabled=!!tx;$('demo').disabled=!!tx;
 for(const id of ['undo','hint','demo'])$(id).hidden=S.stage===1;
 $('reset').textContent=S.stage===1?'↻ もう一度 見る':'はじめの形';
 $('pause').hidden=!tx&&!soilAuto;$('pause').textContent=tx?.paused||soilPaused?'▶ 再開':'Ⅱ 一時停止';
 document.querySelector('.guide').hidden=S.stage===1;
 $('next').disabled=!!tx;$('next').textContent=S.stage===2&&S.waterIndex<3?'コップを ふやす →':S.stage===5?'つぎの問題 →':'つぎへ →';
 $('totalPanel').open=S.stage>=3||$('totalPanel').open;
 const f=$('answerForm');const hasInput=S.stage===4||(S.stage===5&&type()!=='beads');f.hidden=!hasInput||S.solved;
 if(hasInput){const staged=S.stage===4||S.practice===2;$('answerLabel').textContent=staged?(S.step===0?'全部で 何mL？':S.step===1?'何このコップに 分ける？':'1こ分は 何mL？'):'ならすと、1こ分は 何mL？';$('answer').value='';}
}
function renderMath() {
 const m=$('math');m.replaceChildren();const total=sum(S.original),n=S.original.length,a=average();
 if(S.stage===3){
  if(S.jugPhase==='collect')m.textContent=S.collected.length?S.collected.join(' ＋ ')+' ＝ '+S.jug+' mL':'全部を あわせてみよう';
  else {m.textContent=S.distributionStarted?total+' ÷ '+n+' ＝ '+fmt(a)+'　（1こ分・mL）':'全部で '+total+' mL → '+n+'こに 分ける';if(!S.jug){const c=document.createElement('div');c.className='concept';c.textContent='ならした量を「平均」といいます';m.append(c);const q=document.createElement('div');q.append(document.createTextNode(n+'で わるのは どうして？ '),btn('コップが '+n+'こだから',()=>tell('そうだね。もとのコップの数に 等しく分けるからだね。')));m.append(q);}}
 }else if(S.stage===4){m.textContent=(S.step>=1?'合計 '+total+' mL　':'')+(S.step>=2?'÷ 個数 '+n+'こ　':'')+(S.solved?'＝ 平均 '+fmt(a)+' mL':'');if(S.solved){const c=document.createElement('div');c.className='concept';c.textContent='平均 ＝ 合計 ÷ 個数';m.append(c);}}
 else if(S.stage===5&&S.solved)m.textContent=total+' ÷ '+n+' ＝ '+fmt(a)+' '+unit();
}
function renderTotals() {
 const v=view(),ground=sum(v.values),held=v.bucket+v.jug,transit=v.transit||0;
 $('totalText').textContent='はじめ：'+sum(S.original)+' '+unit()+'　／　いま：'+ground+' ＋ 容器 '+held+' ＋ 移動中 '+transit+' ＝ '+(ground+held+transit)+' '+unit();
}
const svgText=(x,y,text,cls='')=>'<text x="'+x+'" y="'+y+'" text-anchor="middle" class="'+cls+'">'+text+'</text>';
function renderBoard() {
 const v=view(),n=S.values.length,t=type(),jug=S.stage===3;
 const left=jug?45:90,right=jug?640:870,cell=(right-left)/n;
 const xs=Array.from({length:n},(_,i)=>left+cell*(i+.5));
 const base=290,scale=t==='water'?.65:36,width=Math.min(100,cell*.62);
 const y=q=>base-q*scale;
 const vehicleStart=S.vehicle||0,vehicleEnd=tx?(typeof tx.from==='number'?tx.from:typeof tx.to==='number'?tx.to:vehicleStart):vehicleStart;
 const travel=tx?Math.min(1,tx.progress/.4):0,eased=travel*travel*(3-2*travel);
 const vehicleX=xs[vehicleStart]+(xs[vehicleEnd]-xs[vehicleStart])*eased;
 const vehicleY=y(v.values[vehicleStart])*(1-eased)+y(v.values[vehicleEnd])*eased-62;
 let out='<defs><pattern id="soilPattern" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M2 4l4 2m5 6l4 -2" stroke="#9a6237" stroke-width="2"/></pattern><pattern id="excess" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 10L10 0" stroke="#7f4d29" stroke-width="2"/></pattern></defs>';
 if(t==='beads')out+='<rect x="45" y="290" width="870" height="22" rx="8" fill="#cda97f"/><rect x="45" y="312" width="870" height="10" rx="4" fill="#987553"/>';
 if(t==='soil')out+='<path d="M'+left+' 292H'+right+'" stroke="#87562d" stroke-width="5"/>';
 if((settings.line||hint>=3||t==='soil'||(allEqual()&&!tx))&&S.stage!==4)out+='<line class="hintLine" x1="'+left+'" x2="'+right+'" y1="'+y(average())+'" y2="'+y(average())+'"/>';
 for(let i=0;i<n;i++){
  const x=xs[i],q=v.values[i],chosen=selected===i||destination===i;
  out+='<g '+(t==='soil'?'role="img"':'role="button" tabindex="0" data-col="'+i+'"')+' aria-label="'+(i+1)+'ばん '+fmt(q)+' '+unit()+'" aria-pressed="'+chosen+'"><rect class="target" x="'+(x-cell/2+(jug?0:5))+'" y="36" width="'+(cell-(jug?0:10))+'" height="320" rx="16"/>';
  if(t==='beads'){
   out+='<rect x="'+(x-4)+'" y="60" width="8" height="230" rx="4" fill="#99a8ad"/>';
   for(let k=0;k<q;k++)out+='<ellipse cx="'+x+'" cy="'+(base-18-k*36)+'" rx="33" ry="16" fill="'+(k%2?'#334854':'#f3efe2')+'" stroke="#455c68" stroke-width="2"/><path d="M'+(x-20)+' '+(base-23-k*36)+'q20 -9 40 0" fill="none" stroke="'+(k%2?'#9db4bd':'#ffffff')+'" stroke-width="3"/>';
  }else if(t==='soil'){
   const w=cell-4;out+='<rect x="'+(x-w/2)+'" y="'+y(q)+'" width="'+w+'" height="'+q*scale+'" fill="#bd8854"/><rect x="'+(x-w/2)+'" y="'+y(q)+'" width="'+w+'" height="'+q*scale+'" fill="url(#soilPattern)"/>';
   if(q>average())out+='<rect x="'+(x-w/2)+'" y="'+y(q)+'" width="'+w+'" height="'+(q-average())*scale+'" fill="url(#excess)"/>';
   out+='<path d="M'+(x-w/2)+' '+y(q)+'H'+(x+w/2)+'" stroke="#775430" stroke-width="4"/>';
  }else{
   out+='<rect x="'+(x-width/2)+'" y="'+y(q)+'" width="'+width+'" height="'+q*scale+'" fill="#53b5dc" opacity=".8"/>';
   out+='<path d="M'+(x-width/2)+' 88V290H'+(x+width/2)+'V88" stroke="#517c90" stroke-width="4" fill="none"/>';
   for(const mark of [0,100,200,300])out+='<path d="M'+(x-width/2)+' '+y(mark)+'h10" stroke="#517c90" stroke-width="2"/>';
   out+=svgText(x,46,fmt(q))+svgText(x,76,'mL','muted');
  }
  out+=svgText(x,345,(i+1)+'ばん','muted');
  if(t==='beads'&&settings.numbers)out+=svgText(x,42,fmt(q)+' '+unit());
  if(chosen)out+=svgText(x,373,destination===i?'うつす先':'えらんだよ','muted');
  out+='</g>';
 }
 if(t==='soil'){
  const cx=vehicleX,groundY=vehicleY;
  out+='<g transform="translate('+(cx-50)+','+groundY+')"><path d="M0 20h55v25H0zM10 0h28v24H10z" fill="#efb839" stroke="#6e5318" stroke-width="3"/><rect x="-7" y="42" width="70" height="20" rx="10" fill="#384b53"/><circle cx="7" cy="52" r="5" fill="#a8b4b6"/><circle cx="48" cy="52" r="5" fill="#a8b4b6"/><path d="M55 27L82 46M68 24L92 40" stroke="#c88e18" stroke-width="7"/><path d="M72 40h42l-7 24H78z" fill="#a0aab0" stroke="#465c66" stroke-width="3"/>';
  for(let k=0;k<v.bucket;k++)out+='<rect x="'+(79+k*13)+'" y="46" width="12" height="12" rx="2" fill="#996333"/>';
  out+='</g>'+svgText(785,25,'バケット '+v.bucket+' / 2','muted');
 }
 if(jug){
  const capacity=sum(S.original),jugScale=175/Math.max(capacity,1),h=v.jug*jugScale;
  out+='<g data-jug="true" role="button" tabindex="0" aria-label="水差し '+v.jug+' mL"><rect class="target" x="705" y="25" width="215" height="330" rx="18"/><rect x="750" y="'+(290-h)+'" width="108" height="'+h+'" fill="#53b5dc" opacity=".8"/><path d="M740 98h118v192H750V123l-20 -18M858 130q80 -10 38 78h-38" fill="none" stroke="#517c90" stroke-width="5"/>'+svgText(805,62,v.jug+' mL')+svgText(805,323,'水差し','muted')+svgText(805,347,'容量 '+capacity+' mL','muted')+'</g>';
  out+=svgText(800,374,'コップとは別の縮尺','muted');
 }
 if(tx){
  const endpoint=ref=>typeof ref==='number'?{x:xs[ref],y:y(tx.before.values[ref])-15}:ref==='jug'?{x:802,y:112}:{x:vehicleX+42,y:vehicleY+54};
  let from=endpoint(tx.from),to=endpoint(tx.to==='all'?v.activeCup:tx.to),p=t==='soil'?Math.max(0,(tx.progress-.4)/.6):tx.progress;
  if(tx.to==='all')p=(p*n)%1;
  const smooth=p*p*(3-2*p),x=from.x+(to.x-from.x)*smooth,yy=from.y+(to.y-from.y)*smooth-60*Math.sin(p*Math.PI);
  if(t==='beads')out+='<ellipse cx="'+x+'" cy="'+yy+'" rx="33" ry="16" fill="#f3efe2" stroke="#455c68" stroke-width="3"/>';
  else if(t==='soil'&&v.transit)out+='<g transform="translate('+x+','+yy+')"><rect x="-22" y="-15" width="44" height="30" rx="5" fill="#a26d39"/>'+svgText(0,7,String(v.transit),'white')+'</g>';
  else if(v.transit){out+='<path d="M'+from.x+' '+from.y+'Q'+((from.x+to.x)/2)+' 12 '+to.x+' '+to.y+'" fill="none" stroke="#178cb5" stroke-width="8" stroke-dasharray="14 7"/>'+svgText(x,Math.max(25,yy),v.transit+' mL');}
 }
 if(drag&&drag.moved&&t==='beads')out+='<circle cx="'+drag.x+'" cy="'+drag.y+'" r="20" fill="#f6b55d" opacity=".8" pointer-events="none"/>';
 $('board').innerHTML=out;
}
// Stable delegated handlers survive SVG redraws and work with touch, mouse and keyboard.
$('board').addEventListener('click',e=>{const col=e.target.closest('[data-col]');if(col)selectColumn(Number(col.dataset.col));});
$('board').addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const col=e.target.closest('[data-col]');if(col){e.preventDefault();const i=Number(col.dataset.col);selectColumn(i);requestAnimationFrame(()=>$('board').querySelector('[data-col="'+i+'"]')?.focus());}});
$('board').addEventListener('pointerdown',e=>{if(tx||S.stage===3||S.stage===4||type()==='soil')return;const col=e.target.closest('[data-col]');if(!col)return;drag={index:Number(col.dataset.col),startX:e.clientX,startY:e.clientY,moved:false,x:0,y:0};});
$('board').addEventListener('pointermove',e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>10)drag.moved=true;if(drag.moved){const p=new DOMPoint(e.clientX,e.clientY).matrixTransform($('board').getScreenCTM().inverse());drag.x=p.x;drag.y=p.y;renderBoard();}});
window.addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;if(!d.moved)return;const col=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-col]');const target=col?Number(col.dataset.col):-1;if(target>=0&&target!==d.index&&S.values[d.index]){selected=d.index;selectColumn(target);}else{selected=null;destination=null;tell('ここには おけないよ。別の棒・コップへ うつそう。');}const stop=ev=>{ev.stopImmediatePropagation();ev.preventDefault();};$('board').addEventListener('click',stop,{capture:true,once:true});setTimeout(()=>$('board').removeEventListener('click',stop,true),0);});
window.addEventListener('pointercancel',()=>{drag=null;renderBoard();});
$('undo').onclick=undo;$('reset').onclick=reset;$('hint').onclick=giveHint;$('demo').onclick=demonstrate;$('next').onclick=next;
$('answerForm').onsubmit=answer;
$('pause').onclick=()=>{if(soilAuto){soilPaused=!soilPaused;if(tx){tx.paused=soilPaused;tx.last=0;}if(!soilPaused)scheduleSoil();}else if(tx){tx.paused=!tx.paused;tx.last=0;}$('pause').textContent=tx?.paused||soilPaused?'▶ 再開':'Ⅱ 一時停止';};
$('speak').onclick=()=>{if(!settings.speech)return tell('読み上げは 先生の設定で使えるよ。');if(!('speechSynthesis' in window))return tell('この端末では読み上げを使えません。画面の説明を見てね。');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance($('lessonTitle').textContent+'。'+$('message').textContent);u.lang='ja-JP';u.rate=.85;speechSynthesis.speak(u);};
$('settingsOpen').onclick=()=>{if((tx&&!tx.paused)||(soilAuto&&!soilPaused))$('pause').click();for(const key of ['speed','speech','numbers','line']){if(key==='speed')$(key).value=settings[key];else $(key).checked=settings[key];}$('custom').value=S.original.join(',');$('settingError').textContent='';$('settings').showModal();};
for(const key of ['speed','speech','numbers','line'])$(key).onchange=()=>{settings[key]=key==='speed'?$(key).value:$(key).checked;if(key==='speech'&&!settings.speech&&'speechSynthesis' in window)speechSynthesis.cancel();renderBoard();persist();};
$('apply').onclick=()=>{
 if(S.stage>=4){$('settingError').textContent='数値の編集は、玉・土・水・水差しの場面で使えます。';return;}
 const raw=$('custom').value.trim().split(/[,、\s]+/),v=raw.map(Number),water=type()==='water',n=v.length,a=sum(v)/n;
 const valid=raw.every(x=>x!=='')&&n>=(water?2:3)&&n<=(water?5:6)&&v.every(x=>Number.isInteger(x)&&x>=0&&x<=(water?300:6))&&sum(v)>0&&(water?v.every(x=>x%5===0)&&a%5===0:Number.isInteger(a));
 if(!valid){$('settingError').textContent=water?'2～5個、0～300mL、5mL単位で同じ量にできる数を入れてください。':'3～6列、0～6、同じ高さが整数になる数を入れてください。';return;}
 cancel();fresh(S.stage,v);render();persist();$('settings').close();if(S.stage===1)startSoil();
};
let saved;try{saved=JSON.parse(localStorage.getItem(KEY));}catch{}
function validSaved(record){
 if(!record?.state)return false;const s=record.state,t=s.stage===0?'beads':s.stage===1?'soil':'water';
 return Number.isInteger(s.stage)&&s.stage>=0&&s.stage<=5&&Number.isInteger(s.practice)&&s.practice>=0&&s.practice<exercises.length&&Array.isArray(s.original)&&Array.isArray(s.values)&&s.original.length===s.values.length&&s.values.length>=2&&s.values.length<=6&&[...s.original,...s.values,s.bucket,s.jug].every(x=>Number.isInteger(x)&&x>=0&&x<=1800)&&sum(s.original)===sum(s.values)+s.bucket+s.jug&&s.bucket<=2&&s.values.every(x=>x<=(t==='water'?300:6));
}
fresh();
if(validSaved(saved)){settings={...settings,...saved.settings};$('resume').showModal();}
$('resumeYes').onclick=()=>{if(validSaved(saved)){S=saved.state;history=Array.isArray(saved.history)?saved.history:[];}message='つづきから はじめよう。';$('resume').close();render();if(S.stage===1)startSoil();};
$('resumeNo').onclick=()=>{$('resume').close();fresh();render();persist();};
$('resume').addEventListener('cancel',()=>persist());
render();
// Exposed read-only snapshots make conservation and interrupted moves verifiable.
window.Narasu={snapshot:()=>copy({state:S,visual:view(),busy:!!tx,paused:!!tx?.paused,soilAuto,soilPaused,history:history.length,selected,destination}),validateInput:validSaved};
})();
