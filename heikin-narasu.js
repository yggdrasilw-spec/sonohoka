/* All amounts live in this model. SVG positions never determine an answer. */
'use strict';
(() => {
const $ = id => document.getElementById(id);
const M=window.NarasuMotion;
const names = ['玉','土','水','水差し','式','練習'];
const waterSets = [[180,60],[180,60,60],[200,80,200,120],[250,50,200,100,200]];
const soilSets = [[5,4,1,2],[6,2,1,3],[1,5,5,1],[4,2,4,2,3],[6,1,4,2,3,2]];
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
let soilAuto=false,soilPaused=false,soilTimer=0,diagramDemo=false;
let settings = {speed:matchMedia('(prefers-reduced-motion: reduce)').matches?'reduced':'normal',speech:true,numbers:true,line:false};
const sum = a => a.reduce((x,y)=>x+y,0);
const copy = x => JSON.parse(JSON.stringify(x));
const average = () => sum(S.original)/S.original.length;
const type = () => S.stage===0?'beads':S.stage===1?'soil':S.stage===5?exercises[S.practice].type:'water';
const unit = () => type()==='water'?'mL':type()==='beads'?'こ':'単位';
const allEqual = () => (S.stage===1&&S.soilGrains?S.soilComplete:S.values.every(v=>v===average())) && !S.bucket && !S.jug;
const fmt = n => Number.isInteger(n)?String(n):n.toFixed(1);
function ensureBeadColors(state){
 // Older saves contain counts only. Assign their visible colors once on restore.
 if(!Array.isArray(state.beadColors)||state.beadColors.length!==state.values.length||!state.beadColors.every((col,i)=>Array.isArray(col)&&col.length===state.values[i]&&col.every(c=>c===0||c===1)))
  state.beadColors=state.values.map(q=>Array.from({length:q},(_,k)=>k%2));
}
function fresh(stage=0, values, extra={}) {
 const defaults = stage===0?[5,4,1,2]:stage===1?soilSets[0]:stage===5?exercises[0].values:waterSets[0];
 S={stage,original:[...(values||defaults)],values:[...(values||defaults)],bucket:0,jug:0,vehicle:0,jugPhase:'collect',collected:[],waterIndex:0,soilIndex:0,soilStartHeight:null,soilMode:'single',soilComplete:false,practice:0,step:0,solved:false,diagram:stage===4?1:0,distributionStarted:false,...extra};
 history=[];selected=null;destination=null;hint=0;message='';
 $('totalPanel').open=false;$('answer').value='';
}
function persist() {try{localStorage.setItem(KEY,JSON.stringify({state:S,history:history.slice(-60),settings}));}catch{}}
function tell(text) {message=text;render();}
function cancel() {token++;cancelAnimationFrame(frame);clearTimeout(soilTimer);soilAuto=false;soilPaused=false;diagramDemo=false;tx=null;selected=null;destination=null;if('speechSynthesis' in window)speechSynthesis.cancel();}
function checkpoint() {history.push(copy(S));if(history.length>100)history.shift();}
function go(stage) {
 cancel();
 $('totalPanel').open=false;$('answer').value='';
 if(stage===3 && S.stage===2){S.stage=3;S.jugPhase='collect';S.collected=[];S.step=0;history=[];hint=0;message='';}
 else if(stage===4 && (S.stage===2||S.stage===3)){S.stage=4;S.values=S.original.slice();S.jug=0;S.bucket=0;S.step=0;S.solved=false;S.diagram=0;history=[];hint=0;message='';}
 else fresh(stage);
 render();persist();
}
function reset() {cancel();const original=S.original.slice();const extras={waterIndex:S.waterIndex,soilIndex:S.soilIndex,practice:S.practice,soilStartHeight:S.soilStartHeight,soilMode:S.soilMode};fresh(S.stage,original,extras);if(S.stage===5)S.diagram=exercises[S.practice].hide?2:0;render();persist();}
function startSoil(){
 if(S.stage!==1||tx||!Number.isInteger(S.soilStartHeight))return;
 const original=S.original.slice(),extra={soilIndex:S.soilIndex,soilStartHeight:S.soilStartHeight,soilMode:S.soilMode};
 cancel();fresh(1,original,extra);soilAuto=true;soilPaused=false;scheduleSoil();render();
}
function scheduleSoil(){
 clearTimeout(soilTimer);if(!soilAuto||soilPaused||S.stage!==1||tx)return;
 soilTimer=setTimeout(()=>{
  if(!soilAuto||soilPaused||S.stage!==1)return;
  const before=copy(S),next=copy(S),plan=M.soilPlan(S.values,8,{startHeight:S.soilStartHeight,layered:S.soilMode==='layers'});
  const heights=Array(plan.count).fill(0);plan.final.forEach(g=>heights[g.x]++);
  next.values=S.values.map((_,i)=>sum(heights.slice(i*8,(i+1)*8))/8);
  next.bucket=0;next.soilGrains=plan.final;next.soilVehicle=M.soilFrame(plan,1).vehicle;next.soilComplete=plan.flat;next.soilBlocked=plan.blocked;
  tx={kind:'soilSweep',plan,before,next,progress:0,elapsed:0,last:0,paused:false};
  message=S.soilMode==='layers'?'選んだ高さから、一層ずつ下げて押すよ。土の動きを見てみよう。':'選んだ高さで押すよ。くぼみが埋まるか、土の動きを見てみよう。';
  const lowers=plan.events.filter(e=>e.kind==='lower').length;
  render();runAnimation(settings.speed==='reduced'?400+lowers*200:settings.speed==='slow'?28000+lowers*6000:16000+lowers*4000);
 },settings.speed==='reduced'?100:650);
}
function undo() {if(tx){cancel();message='動きを取り消したよ。';}else if(history.length){cancel();S=history.pop();message='ひとつ前に もどしたよ。';}hint=0;render();persist();}
function refValue(state, ref) {return typeof ref==='number'?state.values[ref]:state[ref];}
function changeRef(state, ref, delta) {if(typeof ref==='number')state.values[ref]+=delta;else state[ref]+=delta;}
function transfer(from,to,amount,after) {
 if(tx||amount<=0)return;
 const before=copy(S),next=copy(S);changeRef(next,from,-amount);changeRef(next,to,amount);
 if(type()==='beads')next.beadColors[to].push(next.beadColors[from].pop());
 if(refValue(next,from)<0 || refValue(next,to)<0)throw Error('Negative quantity');
 if(after)after(next);
 selected=null;destination=null;message=type()==='water'?`${from+1}ばんのコップを傾けて、${to==='jug'?'水差し':(to+1)+'ばん'}へ ${amount} mL 注ぐよ。`:'';
 ++token;
 tx={before,next,from,to,amount,progress:0,paused:false,last:0,elapsed:0,transit:0};
 const water=type()==='water';
 const duration=settings.speed==='slow'?(water?4000:1800):settings.speed==='reduced'?160:water?2400:850;
 render();
 runAnimation(duration);
}
function runAnimation(duration){
 const id=token;
 function tick(now){
  if(!tx||id!==token)return;
  if(!tx.paused && tx.last)tx.elapsed+=Math.min(now-tx.last,80);
  tx.last=now;tx.progress=Math.min(tx.elapsed/duration,1);
  renderBoard();renderTotals();
  if(tx.progress>=1){const next=tx.next;checkpoint();S=next;tx=null;if(S.stage===1)soilAuto=false;message=completionMessage();render();persist();if(diagramDemo)continueDiagramDemo();return;}
  frame=requestAnimationFrame(tick);
 }
 frame=requestAnimationFrame(tick);
}
function visual() {
 if(!tx)return {...copy(S),transit:0};
 const v=copy(tx.before),p=tx.progress;
 const removed=type()==='beads'?tx.amount:Math.round(tx.amount*M.removed(p));
 const arrived=type()==='beads'?0:Math.round(tx.amount*M.arrived(p));
 changeRef(v,tx.from,-removed);changeRef(v,tx.to,arrived);
 if(type()==='beads')v.beadColors[tx.from].pop();
 v.transit=removed-arrived;return v;
}
function completionMessage() {
 if(S.stage===1&&S.soilBlocked)return 'この高さでは、土の行き場がなくなったよ。土をすてずに、高さを変えて試してみよう。';
 if(S.stage===3){if(S.jugPhase==='divide'&&!S.jug)return 'どのコップも '+fmt(average())+' mL。このように ならした量を「平均」といいます。';if(S.jugPhase==='divide')return '全部 集まったね。横線で '+S.values.length+'等分した量を、コップに分けよう。';return '水差しに '+S.jug+' mL 集まったよ。';}
 if(allEqual())return S.stage===1?'高いところの土を、低いところへ。たいらにすることを「ならす」というよ。':'どこも '+fmt(average())+' '+unit()+'。ならせたね！ 全部の量は 変わらないよ。';
 if(S.stage===1)return '選んだ高さで押したよ。まだ高いところや くぼみがあるね。一層ずつ下げる方法でも試そう。';
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
 ++token;selected=null;destination=null;message='水差しを傾けて、同じ量ずつ コップに注ぐよ。';
 tx={before,next,from:'jug',to:'all',amount:q*next.values.length,progress:0,paused:false,last:0,elapsed:0};
 render();runAnimation((settings.speed==='slow'?4000:settings.speed==='reduced'?160:2400)*next.values.length);
}
function soilView(){
 const v=copy(S),pieces=8,count=S.values.length*pieces;
 const soil=tx?.plan?M.soilFrame(tx.plan,tx.progress):{
  grains:S.soilGrains||S.values.flatMap((h,i)=>Array.from({length:pieces},(_,j)=>Array.from({length:h},(_,y)=>({x:i*pieces+j,y}))).flat()).map((g,id)=>({...g,id})),
  vehicle:S.soilVehicle||{x:0,depth:0,dir:1,turn:1,height:S.soilStartHeight??Math.max(...S.original)},kind:'drive',progress:allEqual()?1:0,position:allEqual()?count+1:0
 };
 const heights=Array(count).fill(0);
 soil.grains.forEach(g=>heights[Math.max(0,Math.min(count-1,Math.floor(g.x)))]++);
 v.values=Array.from({length:S.values.length},(_,i)=>sum(heights.slice(i*pieces,(i+1)*pieces))/pieces);
 v.bucket=0;v.transit=0;v.soil={...soil,heights,pile:0,flying:0};return v;
}
// Distribution animates one cup at a time, so each visible amount still adds to the total.
const transferVisual=visual;
function view() {
 if(S.stage===1)return soilView();
 if(!tx||tx.to!=='all')return transferVisual();
 const v=copy(tx.before),n=v.values.length,q=tx.amount/n;
 const position=tx.progress*n,index=Math.min(n-1,Math.floor(position)),fraction=position-index;
 for(let i=0;i<index;i++){v.values[i]+=q;v.jug-=q;}
 const removed=Math.round(q*M.removed(fraction)),arrived=Math.round(q*M.arrived(fraction));
 v.jug-=removed;v.values[index]+=arrived;v.transit=removed-arrived;v.activeCup=index;return v;
}
function demonstrate() {
 if(tx)return;
 if(S.stage>=4){
  S.diagram=0;
  if(allEqual()&&S.original.some(v=>v!==average())){
   checkpoint();S.values=S.original.slice();S.jug=0;S.bucket=0;
   if(type()==='beads'){delete S.beadColors;ensureBeadColors(S);}
  }
  diagramDemo=true;continueDiagramDemo();return;
 }
 if(S.stage===3){if(S.jugPhase==='collect'){const i=S.values.findIndex(v=>v>0);if(i>=0)collect(i);}else distribute(false);return;}
 const a=average(),hi=S.values.findIndex(v=>v>a),lo=S.values.findIndex(v=>v<a);
 if(allEqual())return tell(completionMessage());
 if(hi>=0&&lo>=0)transfer(hi,lo,type()==='beads'?1:Math.min(S.values[hi]-a,a-S.values[lo],50));
}
function continueDiagramDemo(){
 if(!diagramDemo||S.stage<4||tx)return;
 const a=average(),hi=S.values.findIndex(v=>v>a),lo=S.values.findIndex(v=>v<a);
 if(hi<0||lo<0){diagramDemo=false;tell('図で ならせたね。全部の量はそのままで、同じ量ずつになったよ。');return;}
 transfer(hi,lo,type()==='beads'?1:Math.min(S.values[hi]-a,a-S.values[lo]));
 message=type()==='beads'?'図のヒント：多い棒から 少ない棒へ、玉をうつすよ。':'図のヒント：多いコップから 少ないコップへ、水を注ぐよ。';
 render();
}
function giveHint() {
 if(tx)return;
 hint=Math.min(3,hint+1);
 if(S.stage>=4&&type()==='water'){
  const total=sum(S.original),n=S.original.length;
  const totalQuestion=(S.stage===4||S.practice===2)&&S.step===0;
  const hints=[
   '全部の量を足してから、コップの数で等しく分けよう。空のコップも1こだよ。',
   totalQuestion?S.original.join(' ＋ ')+' を計算してみよう。':'合計は '+total+' mL。'+n+'このコップに 同じ量ずつ分けよう。',
   (totalQuestion?'全部の量は '+total+' mL。次にコップの数を考えよう。':total+' ÷ '+n+' で、1こ分を求めよう。')+'「図が動くヒント」でも確かめられるよ。'
  ];
  tell(hints[hint-1]);
 }
 else if(hint===1)tell('多いところは どこかな？');
 else if(hint===2)tell('少ないところに うつしてみよう。全部の量は 変わらないよ。');
 else {if(S.stage>=4)S.diagram=0;tell('この点線の高さに そろえてみよう。');}
}
function answer(event) {
 event.preventDefault();if(tx||S.solved)return;
 const raw=$('answer').value;if(raw.trim()==='')return tell('答えを 入れてみよう。');
 const value=Number(raw),total=sum(S.original),n=S.original.length,a=average();
 const target=S.stage===4||S.practice===2?(S.step===0?total:S.step===1?n:a):a;
 if(value!==target){tell(S.step===0&&(S.stage===4||S.practice===2)?'元の量を 全部 足してみよう。':S.step===1&&(S.stage===4||S.practice===2)?'空のコップも入れて、コップの数を数えよう。':value===total?'それは全部の量だね。コップの数で わると、1こ分になるよ。':'合計 ÷ 個数で たしかめよう。「図でたしかめる」も使えるよ。');return;}
 checkpoint();$('answer').value='';if((S.stage===4||S.practice===2)&&S.step<2){S.step++;hint=0;message='そうだね！ 次を考えよう。';}else{S.solved=true;message='できたね！ '+total+' ÷ '+n+' ＝ '+fmt(a)+' '+unit()+'。';}render();persist();if(!S.solved)$('answer').focus();
}
function next() {
 if(tx)return;
 if(S.stage===2&&S.waterIndex<3){cancel();const index=S.waterIndex+1;fresh(2,waterSets[index],{waterIndex:index});}
 else if(S.stage===5){if(S.practice<exercises.length-1){cancel();const i=S.practice+1;fresh(5,exercises[i].values,{practice:i,diagram:exercises[i].hide?2:0});}else return tell('練習はおしまい。全部を合わせ、同じ数に分けると 平均が求められるね！');}
 else {go(Math.min(5,S.stage+1));return;}render();persist();
}
function defaultMessage() {
 if(S.stage===0)return '高い棒から 低い棒へ。いちばん上の玉を うつそう。';
 if(S.stage===1)return 'はじめに押す高さと、押し方を選ぼう。選んだ高さで地面はどう変わるかな？';
 if(S.stage===2)return 'コップを2つ選んで、同じ量にしてみよう。';
 if(S.stage===3)return S.jugPhase==='collect'?'コップを1つずつ選んで、水差しに集めよう。':'水差しの横線は、コップの数で等しく分けた目印だよ。同じ量ずつ分けよう。';
 if(S.stage===4)return '元の量のカードを見て、順に計算しよう。';
 return exercises[S.practice].text;
}
function btn(label,fn,options={}) {const b=document.createElement('button');b.textContent=label;b.type='button';b.disabled=!!tx||!!options.disabled;if(options.id)b.id=options.id;if(options.primary)b.className='primary';if(options.pressed!==undefined)b.setAttribute('aria-pressed',options.pressed);b.onclick=fn;return b;}
function render() {
 if(type()==='beads')ensureBeadColors(S);
 $('soilReferences').hidden=S.stage!==1;if(S.stage!==1)$('soilReferences').open=false;
 document.querySelector('.lesson').dataset.stage=S.stage;
 document.querySelector('.lesson').dataset.kind=type();
 $('scenes').replaceChildren(...names.map((name,i)=>{const b=btn(name,()=>go(i));b.disabled=false;b.innerHTML='<small>'+String(i+1).padStart(2,'0')+'</small>'+name;if(S.stage===i)b.setAttribute('aria-current','step');return b;}));
 $('eyebrow').textContent='やってみよう '+(S.stage+1)+' / 6';
 $('lessonTitle').textContent=['ならしてみよう！','地面を「ならす」って？','同じ量に しよう','まとめてから 分けたら？','図がなくても 分かるかな？','べつの問題でも やってみよう'][S.stage];
 $('message').textContent=message||defaultMessage();
 const sub=$('subnav');sub.replaceChildren();
 if(S.stage===2)waterSets.forEach((v,i)=>sub.append(btn((i+2)+'このコップ',()=>{cancel();fresh(2,v,{waterIndex:i});render();persist();},{pressed:S.waterIndex===i})));
 if(S.stage===1){
  const select=(id,label,choices,value,onchange)=>{
   const wrap=document.createElement('label');wrap.className='soilChoice';wrap.append(document.createTextNode(label));
   const control=document.createElement('select');control.id=id;control.disabled=!!tx||soilAuto;
   for(const [key,name] of choices){const option=document.createElement('option');option.value=key;option.textContent=name;control.append(option);}
   control.value=value;control.onchange=()=>{onchange(control.value);delete S.soilGrains;delete S.soilVehicle;S.values=S.original.slice();S.soilComplete=false;message='';render();persist();};wrap.append(control);sub.append(wrap);
  };
  select('soilHeight','はじめに押す高さ',[['','高さを選ぶ'],...Array.from({length:Math.max(...S.original)},(_,i)=>[String(i+1),'下から '+(i+1)+'段目'])],S.soilStartHeight===null?'':String(S.soilStartHeight),v=>{S.soilStartHeight=v===''?null:Number(v);});
  select('soilMode','押し方',[['single','選んだ高さだけ'],['layers','一層ずつ下げる']],S.soilMode,v=>{S.soilMode=v;});
  sub.append(btn('ならしてみる',startSoil,{id:'soilPlay',primary:true,disabled:S.soilStartHeight===null||soilAuto}));
  const b=btn('べつの地面を 見る',()=>{cancel();const i=(S.soilIndex+1)%soilSets.length;fresh(1,soilSets[i],{soilIndex:i});render();persist();},{id:'anotherSoil'});b.disabled=false;sub.append(b);
 }

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
 $('hint').textContent=hint?'ヒント '+hint+' / 3':'ヒント';
 $('demo').textContent=S.stage>=4?'図が動くヒント':'おてほんを ひとつ';
 $('reset').textContent=S.stage===1?'はじめの地面':'はじめの形';
 $('pause').hidden=!tx&&!soilAuto;$('pause').textContent=tx?.paused||soilPaused?'▶ 再開':'Ⅱ 一時停止';
 document.querySelector('.guide').hidden=S.stage===1;
 $('next').disabled=!!tx;$('next').textContent=S.stage===2&&S.waterIndex<3?'コップを ふやす →':S.stage===5?'つぎの問題 →':'つぎへ →';
 if(S.stage===3)$('totalPanel').open=true;
 const f=$('answerForm');const hasInput=S.stage===4||(S.stage===5&&type()!=='beads');f.hidden=!hasInput||S.solved;
 $('answer').disabled=!!tx;$('answerForm').querySelector('button').disabled=!!tx;
 if(hasInput){const staged=S.stage===4||S.practice===2;$('answerLabel').textContent=staged?(S.step===0?'全部で 何mL？':S.step===1?'何このコップに 分ける？':'1こ分は 何mL？'):'ならすと、1こ分は 何mL？';}
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
 if(S.stage===1){$('totalText').textContent='土のかたまり：はじめ '+sum(S.original)*8+'こ ／ いま '+v.soil.grains.length+'こ。土は すてていないよ。';return;}
 $('totalText').textContent='はじめ：'+sum(S.original)+' '+unit()+'　／　いま：'+ground+' ＋ 容器 '+held+' ＋ 移動中 '+transit+' ＝ '+(ground+held+transit)+' '+unit();
}
function renderBoard() {
 const v=view(),kind=type();
 $('board').setAttribute('viewBox',kind==='water'?'0 0 960 460':'0 0 960 380');
 const context={state:S,visual:v,tx,selected,destination,average:average(),hintLine:(S.stage>=4?hint>=3||allEqual():settings.line||hint>=3||allEqual()),numbers:settings.numbers,drag};
 $('board').innerHTML=NarasuRender[kind](context);
}
// Stable delegated handlers survive SVG redraws and work with touch, mouse and keyboard.
$('board').addEventListener('click',e=>{const col=e.target.closest('[data-col]');if(col)selectColumn(Number(col.dataset.col));});
$('board').addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const col=e.target.closest('[data-col]');if(col){e.preventDefault();const i=Number(col.dataset.col);selectColumn(i);$('board').querySelector('[data-col="'+i+'"]')?.focus();}});
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
 cancel();fresh(S.stage,v);render();persist();$('settings').close();
};
let saved;try{saved=JSON.parse(localStorage.getItem(KEY));}catch{}
function validSaved(record){
 if(!record?.state)return false;const s=record.state,t=s.stage===0?'beads':s.stage===1?'soil':'water';
 return Number.isInteger(s.stage)&&s.stage>=0&&s.stage<=5&&Number.isInteger(s.practice)&&s.practice>=0&&s.practice<exercises.length&&Array.isArray(s.original)&&Array.isArray(s.values)&&s.original.length===s.values.length&&s.values.length>=2&&s.values.length<=6&&[...s.original,...s.values,s.bucket,s.jug].every(x=>Number.isFinite(x)&&x>=0&&x<=1800&&Number.isInteger(t==='soil'?x*8:x))&&sum(s.original)===sum(s.values)+s.bucket+s.jug&&s.bucket<=2&&s.values.every(x=>x<=(t==='water'?300:6));
}
fresh();
if(validSaved(saved)){settings={...settings,...saved.settings};$('resume').showModal();}
$('resumeYes').onclick=()=>{if(validSaved(saved)){S=saved.state;history=Array.isArray(saved.history)?saved.history:[];if(S.stage===1)fresh(1,S.original,{soilIndex:S.soilIndex||0,soilStartHeight:Number.isInteger(S.soilStartHeight)&&S.soilStartHeight<=Math.max(...S.original)?S.soilStartHeight:null,soilMode:S.soilMode==='layers'?'layers':'single'});}message='つづきから はじめよう。';$('resume').close();render();};
$('resumeNo').onclick=()=>{$('resume').close();fresh();render();persist();};
$('resume').addEventListener('cancel',()=>persist());
render();
// Exposed read-only snapshots make conservation and interrupted moves verifiable.
window.Narasu={snapshot:()=>copy({state:S,visual:view(),busy:!!tx,paused:!!tx?.paused,soilAuto,soilPaused,diagramDemo,hint,history:history.length,selected,destination}),validateInput:validSaved};
})();
