'use strict';
(() => {
const $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
const methods=[
 {name:'１つ前から',sub:'１つ分を たそう',icon:'＋',title:'あと １つ分、たしてみよう。'},
 {name:'１つ後から',sub:'１つ分を ひこう',icon:'−',title:'１つ分を、とりのけよう。'},
 {name:'ひっくり返す',sub:'たて・よこを 入れかえよう',icon:'↗',title:'ならべかえると、知っている 九九。'},
 {name:'２つに分ける',sub:'知っている 九九に わけよう',icon:'✂',title:'わけて 考えると、できそう！'},
 {name:'たしていく',sub:'１つ分ずつ 数えよう',icon:'⋯',title:'１つ分ずつ、たしていこう。'}
];
let a=3,b=8,mode=0,axis='b',cut=4,p=0,raf=0,playing=false,sound=false,audio,dragging=false,gesture;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function el(tag,attrs,parent,text){const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;parent.append(n);return n}
function tone(){if(!sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(520,audio.currentTime);o.frequency.exponentialRampToValueAtTime(780,audio.currentTime+.07);g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.13)}catch{}}
for(const id of ['a','b'])for(let i=1;i<=9;i++){const o=document.createElement('option');o.value=i;o.textContent=i;$(id).append(o)}$('a').value=a;$('b').value=b;
methods.forEach((m,i)=>{const button=document.createElement('button');button.className='strategy';button.dataset.mode=i;button.innerHTML=`<span class="icon" aria-hidden="true">${m.icon}</span><span><strong>${m.name}</strong><small>${m.sub}</small></span>`;button.onclick=()=>select(i);$('strategies').append(button)});
function stop(){cancelAnimationFrame(raf);playing=false;$('play').textContent=p>=1?'↻ もういちど':'▶ うごかす'}
function select(i){stop();mode=i;p=0;configure();render();tone()}
function configure(){
 if(mode===0&&b===1)mode=1;
 if(mode===3&&a===1&&b===1)mode=4;
 if(axis==='a'&&a===1)axis='b';if(axis==='b'&&b===1)axis='a';
 const size=axis==='a'?a:b;cut=Math.max(1,Math.min(cut,size-1));
 document.querySelectorAll('.strategy').forEach((e,i)=>{e.setAttribute('aria-pressed',i===mode);e.disabled=(i===0&&b===1)||(i===3&&a===1&&b===1);e.title=e.disabled?(i===0?'１つ前が ０つ分なので、ほかの作戦で考えよう':'１×１は ２つに分けられないよ'):''});
 $('splitTools').hidden=mode!==3;$('splitA').disabled=a===1;$('splitB').disabled=b===1;
 $('splitA').setAttribute('aria-pressed',axis==='a');$('splitB').setAttribute('aria-pressed',axis==='b');
 $('cut').max=Math.max(1,size-1);$('cut').value=cut;$('cutValue').textContent=`${cut} と ${size-cut}`;
 $('badge').textContent=`作戦 0${mode+1}`;$('title').textContent=methods[mode].title;$('unitLabel').textContent=`${a}こで １つ分`;
 const desc=[`${a} × ${b-1} は わかるかな？ ${a}こを １つ分、なかまに 入れよう。`,`${a} × ${b+1} から、${a}こを １つ分、とりのけよう。${b===9?'10こ分から 考えても いいね。':''}`,`${a}こずつ ${b}つ分を、${b}こずつ ${a}つ分に ならべかえよう。`,'オレンジの つまみを 動かして、知っている 九九に わけよう。',`${a}こずつの まとまりを、１つずつ タップしても いいよ。`];
 $('description').textContent=desc[mode];
 document.querySelector('label[for="progress"]').textContent=mode===0?'図を 左へ、または この つまみで':mode<3?'図を 右へ、または この つまみで':'ゆびで うごかしても いいよ';
 $('key1').textContent=mode===3?'１つめの かけ算':mode===4?'数えた まとまり':'知っている 九九';
 $('key2').textContent=['あと １つ分','とりのける １つ分','ならべかえても 同じ数','２つめの かけ算','これから 数える'][mode];
}
function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
function render(){
 const t=ease(p),done=p>=.9999,plates=$('plates'),dots=$('dots'),ann=$('annotations');plates.replaceChildren();dots.replaceChildren();ann.replaceChildren();
 const cols=mode===1?b+1:b,space=Math.min(49,530/Math.max(cols,a+1),250/Math.max(a,mode===2?b:1),mode===2?280/Math.hypot(a,b):1000),radius=Math.min(14,space*.29),cx=355,cy=188;
 const original=(r,c)=>({x:cx+(c-(cols-1)/2)*space,y:cy+(r-(a-1)/2)*space});
 // Each original column is one group. Identity of every counter survives each transformation.
 const counted=Math.min(b,Math.floor(p*b+1e-7));
 for(let c=0;c<cols;c++){
  const q=original(0,c),removed=mode===1&&c===b,added=mode===0&&c===b-1;
  let dx=added?(1-t)*100:removed?t*105:0,dy=added?(1-t)*(-30):removed?t*45:0;
  if(mode===3&&axis==='b')dx=c<cut?-t*19:t*19;
  const opacity=mode===2?1-t:mode===3&&axis==='a'?1-t:removed?1-t*.8:1;
  const plate=el('rect',{x:q.x-space*.43+dx,y:q.y-space*.44+dy,width:space*.86,height:space*(a-1)+space*.88,rx:space*.35,fill:added||removed?'#f9e9c7':'#e3efdf',stroke:added||removed?'#e3b66d':'#bdcfb4','stroke-dasharray':added&&p===0?'5 5':'none',opacity},plates);
  if(mode===4){plate.setAttribute('fill',c<counted?'#deeddb':'#eeeee0');plate.setAttribute('tabindex','0');plate.setAttribute('role','button');plate.setAttribute('aria-label',`${c+1}つ分まで 数える`);plate.style.cursor='pointer';const count=()=>{stop();p=(c+1)/b;render();tone()};plate.onclick=count;plate.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();count()}}}
 }
 if(mode===2){for(let r=0;r<a;r++){const first=original(r,0);const targetX=cx+(r-(a-1)/2)*space;el('rect',{x:targetX-space*.43,y:cy-(b-1)/2*space-space*.44,width:space*.86,height:space*b-space*.12,rx:space*.35,fill:'#e3efdf',stroke:'#bdcfb4',opacity:t},plates)}}
 if(mode===3&&axis==='a'){for(const [start,n,color]of [[0,cut,'#e3efdf'],[cut,a-cut,'#f9e9c7']]){const q=original(start,0);el('rect',{x:q.x-space*.44,y:q.y-space*.44+(start===0?-19:19)*t,width:space*b-space*.12,height:space*n-space*.12,rx:14,fill:color,opacity:t},plates)}}
 for(let c=0;c<cols;c++)for(let r=0;r<a;r++){
  const q=original(r,c);let x=q.x,y=q.y,orange=false,opacity=1;
  if(mode===0&&c===b-1){x+=(1-t)*100;y-=(1-t)*30;orange=true}
  if(mode===1&&c===b){x+=t*105;y+=t*45;orange=true;opacity=1-t*.8}
  if(mode===2){const angle=t*Math.PI/2,dx=x-cx,dy=y-cy;x=cx+dx*Math.cos(angle)-dy*Math.sin(angle);y=cy+dx*Math.sin(angle)+dy*Math.cos(angle)}
  if(mode===3){orange=(axis==='b'?c:r)>=cut;if(axis==='b')x+=(orange?19:-19)*t;else y+=(orange?19:-19)*t}
  if(mode===4){orange=c>=counted;opacity=orange?.28:1}
  el('circle',{cx:x,cy:y,r:radius,fill:`url(#${orange?'orange':'teal'})`,filter:'url(#shadow)',opacity,'pointer-events':'none','data-row':r,'data-col':c},dots);
 }
 if(mode===3){const vertical=axis==='b',q=original(vertical?0:cut,vertical?cut:0),pos=(vertical?q.x:q.y)-space/2;
  el('line',vertical?{x1:pos,x2:pos,y1:cy-a*space/2-12,y2:cy+a*space/2+12,stroke:'#d3913d','stroke-width':2,'stroke-dasharray':'5 5'}:{x1:cx-b*space/2-12,x2:cx+b*space/2+12,y1:pos,y2:pos,stroke:'#d3913d','stroke-width':2,'stroke-dasharray':'5 5'},ann);
  const handle=el('g',{class:'handle',role:'slider',tabindex:0,'aria-label':'わける ところ','aria-valuemin':1,'aria-valuemax':(vertical?b:a)-1,'aria-valuenow':cut},ann);
  const hx=vertical?pos:cx+b*space/2+25,hy=vertical?cy+a*space/2+25:pos;
  el('circle',{cx:hx,cy:hy,r:Math.max(23,22*760/$('board').getBoundingClientRect().width),fill:'transparent','pointer-events':'all'},handle);
  el('circle',{cx:hx,cy:hy,r:21,fill:'#fff6dd',stroke:'#dc9f42','stroke-width':2},handle);el('text',{x:hx,y:hy+6,'text-anchor':'middle','font-size':19},handle,vertical?'↔':'↕');
  handle.onpointerdown=e=>{e.preventDefault();dragging=true;stop();$('board').setPointerCapture(e.pointerId)};
  handle.onkeydown=e=>{if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const limit=(axis==='b'?b:a)-1;setCut(e.key==='Home'?1:e.key==='End'?limit:cut+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1));$('annotations').querySelector('.handle').focus()}};
 }
 const displayGroups=mode===2&&done?a:b,displayUnit=mode===2&&done?b:a;
 const caption=mode===4?`${a}こずつ ${counted}つ分 ＝ ${a*counted}こ`:mode===1&&!done?`${a}こずつ ${b+1}つ分 から…`:`${displayUnit}こずつ ${displayGroups}つ分`;
 el('text',{x:380,y:367,'text-anchor':'middle'},ann,caption);
 $('diagramDesc').textContent=caption+(done?`。ぜんぶで ${a*b}こ。`:'。スライダーで図を動かせます。');
 const answer=done?String(a*b):'？',n=axis==='b'?b:a;
 const first=axis==='b'?`${a} × ${cut}`:`${cut} × ${b}`,second=axis==='b'?`${a} × ${b-cut}`:`${a-cut} × ${b}`;
 const v1=axis==='b'?a*cut:cut*b,v2=a*b-v1;
 const known=s=>`<span class="known">${s}</span>`,accent=s=>`<span class="accent">${s}</span>`;
 let eq='',ex='';
 if(mode===0){eq=`${a} × ${b} ＝ ${known(`${a} × ${b-1}`)} ＋ ${accent(a)}${p>0?`<br>＝ ${known(a*(b-1))} ＋ ${accent(a)} ＝ ${answer}`:''}`;ex=done?`${a}のだんは、${a}ずつ ふえる。１つ分を たせたね！`:`${a} × ${b-1} の答えに、${a}こを １つ分たすよ。`}
 if(mode===1){eq=`${a} × ${b} ＝ ${known(`${a} × ${b+1}`)} − ${accent(a)}${p>0?`<br>＝ ${known(a*(b+1))} − ${accent(a)} ＝ ${answer}`:''}`;ex=done?`１つ分の ${a}こを ひくと、${b}つ分に なったね。`:`${b+1}つ分から、１つ分の ${a}こを とりのけるよ。`}
 if(mode===2){eq=`${a} × ${b} ＝ ${known(`${b} × ${a}`)} ＝ ${answer}`;ex=done?'おはじきは １こも ふえたり へったり していないね。':'１つ分の数と いくつ分を 入れかえても、ぜんぶの数は 同じ。'}
 if(mode===3){eq=`${a} × ${b} ＝ ${known(first)} ＋ ${accent(second)}${p>0?`<br>＝ ${known(v1)} ＋ ${accent(v2)} ＝ ${answer}`:''}`;ex=`${axis==='b'?'いくつ分':'１つ分の数'}を ${cut} と ${n-cut}に わけたよ。${done?'２つの答えを たせば いいね！':'わける ところは、つまみで かえられるよ。'}`}
 if(mode===4){eq=counted?Array(counted).fill(a).join(' ＋ ')+` ＝ ${a*counted}`:`${a} × ${b} ＝ ？`;ex=done?`${a}を ${b}回たしたね。だから ${a} × ${b} ＝ ${a*b}。`:`${a}こずつ、いま ${counted}つ分。あと ${b-counted}つ分だよ。`}
 $('equation').innerHTML=eq;$('explanation').textContent=ex;$('topAnswer').textContent=answer;$('progress').value=Math.round(p*1000);
 $('status').textContent=done?'できた！ べつの 作戦でも ためそう。':'すきな速さで、ためしてみよう。';
 if(!playing)$('play').textContent=done?'↻ もういちど':'▶ うごかす';
}
function setCut(value){stop();cut=Math.max(1,Math.min(value,(axis==='b'?b:a)-1));configure();render()}
$('board').onpointerdown=e=>{if(mode>2)return;e.preventDefault();stop();gesture={x:e.clientX,start:p};$('board').setPointerCapture(e.pointerId)};
$('board').onpointermove=e=>{if(gesture){const delta=(e.clientX-gesture.x)/Math.min(180,$('board').getBoundingClientRect().width*.45);p=Math.max(0,Math.min(1,gesture.start+delta*(mode===0?-1:1)));render();return}if(!dragging)return;const pt=new DOMPoint(e.clientX,e.clientY).matrixTransform($('board').getScreenCTM().inverse()),cols=b,space=Math.min(49,530/Math.max(cols,a+1),250/a);const value=axis==='b'?(pt.x-355)/space+b/2:(pt.y-188)/space+a/2;setCut(Math.round(value))};
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('board').addEventListener(event,()=>{dragging=false;gesture=null});
$('play').onclick=()=>{tone();if(playing){stop();return}if(p>=1)p=0;if(reduced.matches){p=1;render();return}playing=true;$('play').textContent='Ⅱ とめる';let start=performance.now(),from=p;const duration=mode===4?b*650:1800;const tick=now=>{p=Math.min(1,from+(now-start)/duration);render();if(p<1)raf=requestAnimationFrame(tick);else stop()};raf=requestAnimationFrame(tick)};
$('progress').oninput=e=>{stop();p=+e.target.value/1000;render()};
$('reset').onclick=()=>{stop();p=0;render();tone()};
for(const id of ['a','b'])$(id).onchange=()=>{stop();a=+$('a').value;b=+$('b').value;p=0;cut=Math.floor((axis==='b'?b:a)/2);configure();render()};
$('random').onclick=()=>{const old=a*10+b;let next;do{next=10*(1+Math.floor(Math.random()*9))+1+Math.floor(Math.random()*9)}while(next===old);a=Math.floor(next/10);b=next%10;$('a').value=a;$('b').value=b;p=0;stop();cut=Math.floor(b/2);configure();render();tone()};
$('nextStrategy').onclick=()=>{let next=(mode+1)%5;while((next===0&&b===1)||(next===3&&a===1&&b===1))next=(next+1)%5;select(next)};
for(const [id,dir]of [['splitA','a'],['splitB','b']])$(id).onclick=()=>{axis=dir;cut=Math.max(1,Math.floor((dir==='a'?a:b)/2));p=0;stop();configure();render()};
$('cut').oninput=e=>setCut(+e.target.value);
$('sound').onclick=()=>{sound=!sound;$('sound').setAttribute('aria-pressed',sound);$('sound').textContent=`おと ${sound?'ON':'OFF'}`;tone()};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
window.addEventListener('resize',render);
configure();render();
})();
