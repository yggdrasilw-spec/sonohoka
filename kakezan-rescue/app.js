'use strict';
(()=>{
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',voice=window.RescueVoice,sfx=window.RescueEffects;
const methods=[{name:'たす',icon:'＋'},{name:'ひく',icon:'−'},{name:'くるっ',icon:'↻'},{name:'わける',icon:'✂'},{name:'かぞえる',icon:'●●'}];
let a=3,b=8,mode=0,axis='b',cut=4,p=0,visual=0,raf=0,playing=false,gesture=null,scene,uiKey='',spokenComplete=false,committedCount=0,choosing=true;
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),clamp=n=>Math.max(0,Math.min(1,n));
const entrances=new Set(),flourishes=new Set();
function animate(node,frames,options,collection=flourishes){if(reduced.matches)return;const animation=node.animate(frames,options);collection.add(animation);animation.onfinish=()=>collection.delete(animation);return animation}
function clearEntrance(){for(const animation of entrances)animation.cancel();entrances.clear()}
function clearPresentation(){clearEntrance();for(const animation of flourishes)animation.cancel();flourishes.clear();$('fx').replaceChildren();sfx.cancel()}
function enterScene(){if(reduced.matches)return;for(const {node,row,c}of scene.dots)animate(node,[{transform:'translateY(14px) scale(.35)',opacity:0},{transform:'translateY(-3px) scale(1.12)',opacity:1,offset:.72},{transform:'none',opacity:1}],{duration:370,delay:Math.min(220,c*22+row*12),easing:'cubic-bezier(.2,.75,.3,1)',fill:'backwards'},entrances);for(const {node,c}of scene.plates)animate(node,[{opacity:0},{opacity:1}],{duration:240,delay:Math.min(c*20,180),fill:'backwards'},entrances)}
function landing(target){
 sfx.play(target===0?'tap':'land');if(target===0||reduced.matches)return;
 const selected=scene.dots.filter(d=>mode<2?d.c===(mode===0?b-1:b):true);
 for(const {node}of selected)animate(node,[{transform:'scale(1.15,.86)'},{transform:'scale(.97,1.06)',offset:.55},{transform:'none'}],{duration:300,easing:'ease-out'});
 const x=mode<2?scene.point(0,mode===0?b-1:b).x+(mode===1?95:0):scene.cx,y=scene.cy;
 for(let i=0;i<6;i++){const angle=i*Math.PI/3,dx=Math.cos(angle)*37,dy=Math.sin(angle)*30,anchor=el('g',{transform:`translate(${x+dx} ${y+dy})`},$('fx'));const star=el('path',{d:'M0 -5V5M-5 0H5',stroke:i%2?'#f5bb56':'#8ccfc2','stroke-width':2.5,'stroke-linecap':'round',fill:'none'},anchor);const animation=animate(star,[{opacity:0,scale:'.3'},{opacity:1,scale:'1.1',offset:.25},{opacity:0,scale:'.65'}],{duration:430,delay:i*17,easing:'ease-out'});if(animation)animation.onfinish=()=>{flourishes.delete(animation);anchor.remove()}}
}
function el(tag,attrs,parent,text){const node=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))node.setAttribute(k,v);if(text!==undefined)node.textContent=text;parent.append(node);return node}
const attr=(node,values)=>{for(const [k,v]of Object.entries(values))node.setAttribute(k,v)};
const number=voice.number,pieces=voice.pieces,groups=voice.groups,multiply=(x,y)=>`${number(x)} かける ${number(y)}`;
function partials(){return axis==='b'?[a*cut,a*(b-cut)]:[cut*b,(a-cut)*b]}
function initialText(){return ['あと １つぶん！\nオレンジを いれよう。','１つぶん とろう！\nオレンジを そとへ。',`${a}こずつ ${b}つぶん。\nくるっと まわすと？`,'どこで わけよう？\nつまみを うごかしてね。',`${a}こずつ、たそう！\nひかる まとまりを タッチ。`][mode]}
function introSpeech(){return [
 `${multiply(a,b-1)}は、${number(a*(b-1))}。あと ${pieces(a)}を、ひとつぶん、いれてみよう。`,
 `${multiply(a,b+1)}は、${number(a*(b+1))}。${pieces(a)}を、ひとつぶん、とってみよう。`,
 `${pieces(a)}ずつが、${groups(b)}ぶん。くるっと、まわしてみよう。`,
 'しっている くくに、わけてみよう。つまみを うごかすと、わける ばしょを かえられるよ。',
 `${pieces(a)}ずつ、たしてみよう。ひかる まとまりを、ひとつずつ、たっちしてね。`][mode]}
function actionText(){return [`${a}こを １つぶん、たすよ。`,`${a}こを １つぶん、とるよ。`,'くるっ！ かずは かわるかな？','ぱかっ！ ２つに わかれたね。',`${a}こずつ、たしていこう。`][mode]}
function actionSpeech(){return [`${pieces(a)}を、ひとつぶん、たすよ。`,`${pieces(a)}を、ひとつぶん、とるよ。`,'くるっと、まわすよ。','ぱかっ。ふたつに、わけるよ。',''][mode]}
function resultSpeech(){const [x,y]=partials();return [
 `${number(a*(b-1))}に、${number(a)}を たして、${number(a*b)}。だから、${multiply(a,b)}は、${number(a*b)}。`,
 `${number(a*(b+1))}から、${number(a)}を ひいて、${number(a*b)}。だから、${multiply(a,b)}は、${number(a*b)}。`,
 `${pieces(b)}ずつが、${groups(a)}ぶんに なったね。${multiply(b,a)}は、${number(a*b)}。おはじきの かずは、おなじだね。`,
 `${axis==='b'?multiply(a,cut):multiply(cut,b)}は、${number(x)}。${axis==='b'?multiply(a,b-cut):multiply(a-cut,b)}は、${number(y)}。${number(x)}と、${number(y)}を たして、${number(a*b)}。`,
 `${number(a)}を、${number(b)}かい たしたね。だから、${multiply(a,b)}は、${number(a*b)}。`][mode]}
function partsSpeech(){const [x,y]=partials();return `${axis==='b'?multiply(a,cut):multiply(cut,b)}は、${number(x)}。${axis==='b'?multiply(a,b-cut):multiply(a-cut,b)}は、${number(y)}。ふたつの こたえを、たしてみよう。`}
function setBubble(text){if($('description').textContent!==text)$('description').textContent=text}
function stop(){cancelAnimationFrame(raf);raf=0;playing=false}
function release(){if(gesture){const id=gesture.id;gesture=null;if($('board').hasPointerCapture(id))$('board').releasePointerCapture(id)}$('board').classList.remove('dragging')}
function announceResult(){if(spokenComplete)return;spokenComplete=true;sfx.play('finish');animate(document.querySelector('.friend'),[{transform:'rotate(-6deg)'},{transform:'translateY(-7px) rotate(5deg)',offset:.4},{transform:'rotate(-5deg)'}],{duration:520,easing:'ease-out'});voice.say(resultSpeech(),{append:true,mark:'result'})}
function challengeSpeech(){return `${multiply(a,b)}の こたえを、わすれちゃった！ どうする？ さあ、たすけてあげよう！ たすけかたは、ぜんぶで、いつつだよ。どれで、たすける？`}
function showChallenge(read=false){stop();release();clearPresentation();voice.cancel();choosing=true;p=visual=0;committedCount=0;spokenComplete=false;document.body.classList.add('choosing');document.body.classList.remove('done');$('rescueIntro').hidden=false;$('lesson').hidden=true;$('problemPrompt').textContent='こたえを わすれちゃった！';$('helpChoice').textContent='どれで たすける？';$('topAnswer').textContent='？';configure();if(read){sfx.play('tap');voice.say(challengeSpeech(),{mark:'question'})}}
function select(i,read=true){stop();release();clearPresentation();voice.cancel();choosing=false;document.body.classList.remove('choosing');$('rescueIntro').hidden=true;$('lesson').hidden=false;$('problemPrompt').textContent='わすれた 九九を たすけよう！';$('helpChoice').textContent='ほかの たすけかたも ためせるよ';mode=i;p=visual=0;committedCount=0;spokenComplete=false;configure();build();render();enterScene();if(read){sfx.play('appear');voice.say(introSpeech(),{mark:'known'})}}
function configure(){
 if(mode===0&&b===1)mode=1;if(mode===3&&a===1&&b===1)mode=4;
 if(axis==='a'&&a===1)axis='b';if(axis==='b'&&b===1)axis='a';cut=Math.max(1,Math.min(cut,(axis==='b'?b:a)-1));
 document.querySelectorAll('.strategy').forEach((button,i)=>{button.setAttribute('aria-pressed',!choosing&&i===mode);button.disabled=i===0&&b===1||i===3&&a===1&&b===1;button.title=button.disabled?'ほかの やりかたで ためそう':''});
 $('splitTools').hidden=mode!==3;$('splitA').disabled=a===1;$('splitB').disabled=b===1;
 $('splitA').setAttribute('aria-pressed',axis==='a');$('splitB').setAttribute('aria-pressed',axis==='b');$('cut').max=Math.max(1,(axis==='b'?b:a)-1);$('cut').value=cut;uiKey='';$('speechStatus').textContent='';
}
function build(){
 for(const id of ['destination','plates','dots','annotations','handles'])$(id).replaceChildren();
 const cols=mode===1?b+1:b,space=Math.min(55,580/(cols+(mode<2?1.7:.3)),265/Math.max(a,mode===2?b:1),mode===2?300/Math.hypot(a,b):1000);
 const cx=mode<2?335:380,cy=182,r=Math.min(17,space*.32);scene={cols,space,cx,cy,r,dots:[],plates:[],targets:[],hit:null};
 const point=(row,col)=>({x:cx+(col-(cols-1)/2)*space,y:cy+(row-(a-1)/2)*space});scene.point=point;
 for(let c=0;c<cols;c++){
  const q=point(0,c),tray=el('rect',{class:'tray',x:q.x-space*.44,y:q.y-space*.46,width:space*.88,height:space*(a-1)+space*.92,rx:Math.min(19,space*.4)},$('plates'));scene.plates.push({node:tray,q,c});
  if(mode===4){attr(tray,{role:'button',tabindex:c===0?'0':'-1','aria-label':`${a}こを １つぶん たす`});const go=()=>{if(c===counted())countOne()};tray.onclick=go;tray.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();go()}}}
   for(let row=0;row<a;row++){const q=point(row,c),dot=el('circle',{class:'counter',cx:q.x,cy:q.y,r,fill:'url(#teal)','data-row':row,'data-col':c},$('dots'));scene.dots.push({node:dot,row,c,q})}
 }
 if(mode===2)for(let row=0;row<a;row++)scene.targets.push(el('rect',{class:'tray',x:cx+(row-(a-1)/2)*space-space*.44,y:cy-(b-1)/2*space-space*.46,width:space*.88,height:b*space-space*.08,rx:Math.min(19,space*.4),opacity:0},$('plates')));
 if(mode===3&&axis==='a')for(const [start,n]of [[0,cut],[cut,a-cut]]){const q=point(start,0);scene.targets.push(el('rect',{class:'tray'+(start?' orange':''),x:q.x-space*.44,y:q.y-space*.46+(start?25:-25),width:space*b-space*.12,height:space*n-space*.08,rx:15,opacity:0},$('plates')))}
 if(mode<2){
  const q=point(0,mode===0?b-1:b);scene.destination=el('rect',{x:q.x-space*.44,y:q.y-space*.46,width:space*.88,height:space*a-space*.08,rx:Math.min(19,space*.4),fill:'none',stroke:'#f2b957','stroke-width':3,'stroke-dasharray':'5 7'},$('destination'));
  const hit=el('g',{role:'button',tabindex:0,'aria-label':mode===0?`${a}こを いれる`:`${a}こを とる`},$('handles'));scene.hit=el('rect',{fill:'transparent','pointer-events':'all',rx:15},hit);hit.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();act()}};
  scene.arrow=el('text',{'text-anchor':'middle','font-size':28},$('annotations'),mode===0?'←':'→');
 }
 if(mode===3){
  const vertical=axis==='b',q=point(vertical?0:cut,vertical?cut:0),pos=(vertical?q.x:q.y)-space/2;
  el('line',vertical?{x1:pos,x2:pos,y1:cy-a*space/2-5,y2:cy+a*space/2+5}:{x1:cx-b*space/2-5,x2:cx+b*space/2+5,y1:pos,y2:pos},$('annotations')).setAttribute('style','stroke:#df9c39;stroke-width:3;stroke-dasharray:5 6');
  const grip=el('g',{class:'handle',role:'slider',tabindex:0,'aria-label':'わける ところ','aria-valuemin':1,'aria-valuemax':(vertical?b:a)-1,'aria-valuenow':cut},$('handles'));
  const hx=vertical?pos:cx+b*space/2+28,hy=vertical?Math.min(334,cy+a*space/2+25):pos,hitRadius=Math.max(25,24*760/$('board').getBoundingClientRect().width);
  el('circle',{cx:hx,cy:hy,r:hitRadius,fill:'transparent','pointer-events':'all'},grip);el('circle',{cx:hx,cy:hy,r:25,class:'cut-grip'},grip);el('text',{x:hx,y:hy+7,'text-anchor':'middle','pointer-events':'none'},grip,vertical?'↔':'↕');
  grip.onpointerdown=e=>{e.preventDefault();e.stopPropagation();stop();clearEntrance();sfx.play('grab');voice.cancel();gesture={id:e.pointerId,type:'cut'};$('board').setPointerCapture(e.pointerId)};
  grip.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();setCut(e.key==='Home'?1:e.key==='End'?(axis==='b'?b:a)-1:cut+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1));$('handles').querySelector('.handle').focus()}};
 }
 scene.caption=el('text',{x:380,y:377,'text-anchor':'middle'},$('annotations'));
 const halfWidth=mode<2?Math.max(245,cols*space/2+110):Math.max(175,Math.max(cols,a)*space/2+65),halfHeight=mode===2?185:Math.max(mode===3?160:mode===4?155:105,a*space/2+45);
 $('board').setAttribute('viewBox',`${cx-halfWidth} ${cy-halfHeight} ${halfWidth*2} ${halfHeight*2}`);scene.caption.setAttribute('y',cy+halfHeight-15);
}
function counted(){return mode===4?committedCount:Math.min(b,Math.floor(p*b+1e-6))}
function render(){
 const {space,cx,cy}=scene,t=visual,done=p>=1&&!playing,shown=counted();
 const moving=playing||gesture?.type==='move',lift=moving&&mode!==4?-Math.sin(clamp(t)*Math.PI)*(mode===3?9:18):0,held=gesture?.type==='move'?-5:0;
 for(const {node,c}of scene.plates){
  let x=0,y=0,opacity=1,orange=mode===0&&c===b-1||mode===1&&c===b;
  if(mode===0&&c===b-1){x=(1-t)*95;y=lift+held}
  if(mode===1&&c===b){x=t*95;y=lift+held;opacity=1-clamp(t)*.83}
  if(mode===3&&axis==='b'){orange=c>=cut;x=(orange?25:-25)*t;y=lift}if(mode===3&&axis==='a')opacity=1-clamp(t);
  if(mode===2){opacity=1-Math.max(0,(clamp(t)-.7)/.3);const scale=1+(moving?.035:0)*Math.sin(clamp(t)*Math.PI);node.setAttribute('transform',`translate(${cx} ${cy}) scale(${scale}) rotate(${t*90}) translate(${-cx} ${-cy})`)}else node.setAttribute('transform',`translate(${x} ${y})`);
  attr(node,{opacity});Object.assign(node.style,{fill:mode===4?(c<shown?'#e0f1ff':'#f6f4ee'):orange?'#fff0d3':'#e5f3ff',stroke:mode===4&&c===shown?'#f4a83d':orange?'#f3b65e':'#aacbe8',strokeWidth:mode===4&&c===shown?'4':'2'});if(mode===4)attr(node,{'aria-disabled':c!==shown,tabindex:c===shown?0:-1});
 }
 for(const {node,row,c,q}of scene.dots){let x=q.x,y=q.y,orange=false,opacity=1;
  if(mode===0&&c===b-1){x+=(1-t)*95;y+=lift+held;orange=true}if(mode===1&&c===b){x+=t*95;y+=lift+held;orange=true;opacity=1-clamp(t)*.83}
  if(mode===2){const angle=t*Math.PI/2,scale=1+(moving?.035:0)*Math.sin(clamp(t)*Math.PI),dx=(x-cx)*scale,dy=(y-cy)*scale;x=cx+dx*Math.cos(angle)-dy*Math.sin(angle);y=cy+dx*Math.sin(angle)+dy*Math.cos(angle)}
  if(mode===3){orange=(axis==='b'?c:row)>=cut;if(axis==='b')x+=(orange?25:-25)*t;else y+=(orange?25:-25)*t;y+=lift}if(mode===4){orange=c>=shown;opacity=orange?.22:1}
  const pop=mode===4&&playing&&c===shown-1?1+.23*Math.sin(Math.PI*clamp(visual*b-(shown-1))):1;attr(node,{cx:x,cy:y,r:scene.r*pop,fill:`url(#${orange?'orange':'teal'})`,opacity});node.classList.toggle('lifted',moving&&(mode===0&&c===b-1||mode===1&&c===b||mode===2));
 }
 for(const node of scene.targets)node.setAttribute('opacity',mode===2?Math.max(0,(clamp(t)-.7)/.3):clamp(t));
 if(scene.hit){const q=scene.point(0,mode===0?b-1:b),x=q.x+(mode===0?(1-t)*95:t*95),pad=Math.max(space*.44,22*760/$('board').getBoundingClientRect().width);attr(scene.hit,{x:x-pad,y:q.y-space*.46,width:pad*2,height:Math.max(space*a,44)});attr(scene.arrow,{x:q.x+(mode===0?48:55),y:cy+8,opacity:1-clamp(t)});scene.destination.setAttribute('opacity',1-clamp(t))}
 scene.caption.textContent=mode===4?`${a}こずつ ${shown}つぶん`:mode===2?(done?`${b}こずつ ${a}つぶん`:`${a}こずつ ${b}つぶん`):'';
 const key=[mode,axis,cut,shown,p===0?'start':done?'done':'moving',playing].join(':');if(key!==uiKey){uiKey=key;renderWords(done,shown)}$('progress').value=Math.round(clamp(p)*1000);
}
function renderWords(done,shown){
 const known=s=>`<span class="known">${s}</span>`,accent=s=>`<span class="accent">${s}</span>`,ans=done?`<span class="answer">${a*b}</span>`:'？';let eq='';
 const [x,y]=partials(),first=axis==='b'?`${a} × ${cut}`:`${cut} × ${b}`,second=axis==='b'?`${a} × ${b-cut}`:`${a-cut} × ${b}`;
 if(mode===0)eq=p===0?known(`${a} × ${b-1} ＝ ${a*(b-1)}`):`${known(a*(b-1))} ＋ ${accent(a)} ＝ ${ans}`;
 if(mode===1)eq=p===0?known(`${a} × ${b+1} ＝ ${a*(b+1)}`):`${known(a*(b+1))} − ${accent(a)} ＝ ${ans}`;
 if(mode===2)eq=p===0?`${a} × ${b} ＝ ？`:`${known(`${b} × ${a}`)} ＝ ${ans}`;
 if(mode===3)eq=`<span class="small-equation">${known(first)} ＋ ${accent(second)}</span>${known(x)} ＋ ${accent(y)} ＝ ${ans}`;
 if(mode===4)eq=shown===0?`${a} × ${b} ＝ ？`:shown===1?`${a} ＝ ${a}`:`${known(a*(shown-1))} ＋ ${accent(a)} ＝ ${done?ans:a*shown}`;
 if($('equation').innerHTML!==eq)$('equation').innerHTML=eq;$('topAnswer').textContent=done?a*b:'？';document.body.classList.toggle('done',done);$('next').hidden=!done;
 if(done)setBubble([`${a}こ ふえて、${a*b}こ！\nわすれても、つくれたね。`,`${a}こ とって、${a*b}こ！\n１つぶん へらせたね。`,`${b}こずつ ${a}つぶん！\nかずは おなじだね。`,'２つの こたえを たせば いいね！',`${a}を ${b}かい たして、${a*b}！`][mode]);
 else if(mode===4&&shown)setBubble(`${a*shown}こに なったね。\nつぎの ${a}こを タッチ！`);else setBubble(p===0?initialText():actionText());
 $('play').textContent=done?'もういちど':mode===4?`${a}こを たす`:playing?'とめる':[`${a}こを いれる`,`${a}こを とる`,'くるっと まわす','ぱかっと わける'][mode];
 $('diagramDesc').textContent=done?`${a} かける ${b} は ${a*b}。`:`${a}こずつの まとまり。${mode===4?'ひかる まとまりを １つずつ タッチ。':mode<2?'オレンジの まとまりを うごかせるよ。':'下の ボタンでも うごかせるよ。'}`;
}
function spring(target,onComplete){
 stop();clearEntrance();playing=true;let x=visual,v=0,last=performance.now(),started=last,landed=false;if(reduced.matches){visual=p=target;playing=false;render();if(mode!==4)landing(target);onComplete?.();return}
 const tick=now=>{const dt=Math.min(.025,(now-last)/1000);last=now;v+=((target-x)*420-v*25)*dt;x+=v*dt;visual=x;p=clamp(x);render();if(!landed&&Math.abs(x-target)<.025){landed=true;if(mode!==4)landing(target)}
  if((Math.abs(x-target)<.0007&&Math.abs(v)<.013)||now-started>1100){visual=p=target;playing=false;raf=0;render();onComplete?.()}else raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);render();
}
function countOne(){if(counted()>=b)return;const previous=counted(),next=previous+1;stop();sfx.play('count',next-1);visual=p=previous/b;committedCount=next;voice.cancel();voice.say(previous?`${number(a*previous)}に、${number(a)}を たして、${number(a*next)}。`:`${pieces(a)}で、ひとつぶん。`,{mark:'count'});spring(next/b,()=>{if(next===b)announceResult()})}
function act(){clearEntrance();if(mode===4&&committedCount<b){countOne();return}if(playing){stop();sfx.cancel();visual=clamp(visual);p=visual;render();voice.cancel();return}if(p>=1){clearPresentation();p=visual=0;committedCount=0;spokenComplete=false;render();enterScene();sfx.play('appear');voice.say(introSpeech(),{mark:'known'});return}sfx.play(mode===2?'rotate':mode===3?'split':'move');voice.say(actionSpeech(),{mark:'action'});spring(1,announceResult)}
function setCut(value){const next=Math.max(1,Math.min(value,(axis==='b'?b:a)-1));if(next===cut)return;const focused=document.activeElement?.classList.contains('handle');stop();clearPresentation();sfx.play('tap');voice.cancel();cut=next;spokenComplete=false;configure();build();render();if(focused)$('handles').querySelector('.handle').focus()}
function point(e){return new DOMPoint(e.clientX,e.clientY).matrixTransform($('board').getScreenCTM().inverse())}
$('board').onpointerdown=e=>{if(mode>2||e.button!==0)return;const q=point(e);if(mode<2){const r=scene.hit.getBBox();if(q.x<r.x||q.x>r.x+r.width||q.y<r.y||q.y>r.y+r.height)return}e.preventDefault();stop();clearPresentation();sfx.play('grab');voice.say(actionSpeech(),{mark:'action'});spokenComplete=false;gesture={id:e.pointerId,type:'move',x:q.x,start:clamp(visual)};p=visual=gesture.start;$('board').setPointerCapture(e.pointerId);$('board').classList.add('dragging');render()};
$('board').onpointermove=e=>{if(!gesture||gesture.id!==e.pointerId)return;const q=point(e);if(gesture.type==='cut'){setCut(Math.round(axis==='b'?(q.x-scene.cx)/scene.space+b/2:(q.y-scene.cy)/scene.space+a/2));return}visual=p=clamp(gesture.start+(q.x-gesture.x)/(mode<2?95:180)*(mode===0?-1:1));render()};
function endGesture(e,cancelled=false){if(!gesture||gesture.id!==e.pointerId)return;const type=gesture.type;gesture=null;$('board').classList.remove('dragging');if($('board').hasPointerCapture(e.pointerId))$('board').releasePointerCapture(e.pointerId);if(type==='cut'){voice.say(p>=1?resultSpeech():partsSpeech(),{mark:'parts'});return}const target=cancelled?Math.round(p):p>.55?1:0;spring(target,target===1?announceResult:()=>voice.cancel())}
$('board').onpointerup=e=>endGesture(e);$('board').onpointercancel=e=>endGesture(e,true);$('board').onlostpointercapture=e=>{if(gesture)endGesture(e,true)};
for(const id of ['a','b'])for(let i=1;i<=9;i++){const option=document.createElement('option');option.value=i;option.textContent=i;$(id).append(option)}$('a').value=a;$('b').value=b;
methods.forEach((method,i)=>{const button=document.createElement('button');button.className='strategy';button.dataset.mode=i;button.setAttribute('aria-label',['１つ前の 九九から たす','１つ後の 九九から ひく','かける数と かけられる数を 入れかえる','２つの かけ算に わける','同じ数を １つぶんずつ たす'][i]);button.innerHTML=`<span class="icon" aria-hidden="true">${method.icon}</span><strong>${method.name}</strong>`;button.onclick=()=>select(i);$('strategies').append(button)});
$('play').onclick=act;$('reset').onclick=()=>select(mode);$('listen').onclick=()=>{if(!voice.enabled){voice.enable(true);$('sound').setAttribute('aria-pressed','true');$('sound').textContent='こえ ON'}voice.say(p>=1?resultSpeech():mode===4&&counted()?`${number(a*counted())}こに なったね。つぎの ${pieces(a)}を、たしてみよう。`:p===0?introSpeech():actionSpeech(),{mark:'replay'})};
$('introListen').onclick=()=>{if(!voice.enabled){voice.enable(true);$('sound').setAttribute('aria-pressed','true');$('sound').textContent='こえ ON'}voice.say(challengeSpeech(),{mark:'question'})};
$('sound').onclick=()=>{const enabled=voice.enable(!voice.enabled);$('sound').setAttribute('aria-pressed',enabled);$('sound').textContent=enabled?'こえ ON':'こえ OFF';if(enabled)$(choosing?'introListen':'listen').click()};
$('sfx').onclick=()=>{const enabled=sfx.enable(!sfx.enabled);$('sfx').setAttribute('aria-pressed',enabled);$('sfx').textContent=enabled?'おと ON':'おと OFF';if(enabled)sfx.play('tap')};
$('progress').oninput=e=>{stop();clearPresentation();voice.cancel();p=visual=+e.target.value/1000;committedCount=Math.min(b,Math.floor(p*b+1e-6));spokenComplete=false;render()};$('progress').onchange=()=>{if(p>=1)announceResult()};
for(const id of ['a','b'])$(id).onchange=()=>{a=+$('a').value;b=+$('b').value;cut=Math.max(1,Math.floor((axis==='b'?b:a)/2));showChallenge(true)};
function nextProblem(){let next;do next=10*(1+Math.floor(Math.random()*9))+1+Math.floor(Math.random()*9);while(next===a*10+b);a=Math.floor(next/10);b=next%10;$('a').value=a;$('b').value=b;cut=Math.max(1,Math.floor(b/2));showChallenge(true)}
$('random').onclick=nextProblem;$('next').onclick=nextProblem;
for(const [id,dir]of [['splitA','a'],['splitB','b']])$(id).onclick=()=>{axis=dir;cut=Math.max(1,Math.floor((axis==='a'?a:b)/2));select(mode)};
$('cut').oninput=e=>setCut(+e.target.value);$('cut').onchange=()=>voice.say(p>=1?resultSpeech():partsSpeech(),{mark:'parts'});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();release();clearPresentation();p=visual=clamp(visual);if(!choosing)render()}});
let resizeFrame;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(!choosing){build();render()}})});
showChallenge();
})();
