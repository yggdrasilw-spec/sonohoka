'use strict';
const $=id=>document.getElementById(id);
const canvas=$('canvas'),ctx=canvas.getContext('2d');
const objects=[{name:'30cm定規',cm:30,g:30,color:'#e8b14d',w:5,d:1},{name:'えんぴつ',cm:18,g:6,color:'#da8961',w:1.5,d:1.5},{name:'つくえ',cm:70,g:8000,color:'#b99770',w:65,d:45},{name:'牛乳パック',cm:20,g:1050,color:'#72aebc',w:7,d:7}];
let mode='length',selected=0,revealed=false,angle=-.35,water=0,shape='slim',unit=100,weights=0,weightUnit=10,predicted=false;
let W=800,H=490,scale=2,originX=350,originY=400;
const titles={length:['どのくらいの長さかな？','130cmの子とならべて、身近なものの大きさを見てみよう。'],weight:['どのくらいの重さかな？','重りをのせて、天秤がつり合うところを探してみよう。'],volume:['何杯でいっぱいになるかな？','少しずつ水を入れて、mL・dL・Lのつながりを見てみよう。']};
function feedback(text){$('feedback').textContent=text}
function renderControls(){
 const o=objects[selected];
 $('title').textContent=titles[mode][0];$('intro').textContent=titles[mode][1];
 document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
 $('sceneTag').textContent=mode==='length'?'立体ビュー · ドラッグで回転':mode==='weight'?'天秤 · 重いほうが下がります':'1Lの容器 · 水の量と高さをくらべよう';
 $('front').classList.toggle('hidden',mode!=='length');$('rotate').classList.toggle('hidden',mode!=='length');
 if(mode==='length'){
 $('controls').innerHTML=`<h2>① くらべるものを選ぶ</h2><div class="choices">${objects.map((x,i)=>`<button data-object="${i}" class="${i===selected?'active':''}">${x.name}</button>`).join('')}</div><label for="guess">② 高さをよそうする（cm）</label><input id="guess" type="number" min="0" max="1000" placeholder="数字を入れてみよう"><button class="primary" id="answer">③ 長さをたしかめる</button><div class="readout"><small>${o.name}の高さ</small><strong>${revealed?o.cm+' cm':'？ cm'}</strong><p>くらべる子の身長：130cm</p></div>`;
 $('hint').textContent='正面とななめで見え方をくらべよう。自分の身長とくらべると、どうかな？';
 $('teacher').textContent='モデルの寸法比をそろえています。画面上の1cmは実物の1cmではありません。机は高さ、その他は立てたときの長さを示しています。';
 }else if(mode==='weight'){
 $('controls').innerHTML=`<h2>① はかるものを選ぶ</h2><div class="choices">${objects.filter((x,i)=>i!==2).map(x=>`<button data-object="${objects.indexOf(x)}" class="${objects.indexOf(x)===selected?'active':''}">${x.name}</button>`).join('')}</div><label>② どちらが重い？</label><div class="choices"><button data-predict="object">もののほう</button><button data-predict="equal">同じ</button><button data-predict="weights">重りのほう</button></div><label>③ 重りをのせてくらべる</label><div class="choices">${[1,10,100,1000].map(n=>`<button data-unit="${n}" class="${n===weightUnit?'active':''}">${n}g</button>`).join('')}</div><div class="choices" style="margin-top:10px"><button id="minus">− はずす</button><button id="plus">＋ のせる</button></div><div class="readout"><small>右のお皿の重り</small><strong>${weights.toLocaleString()} g</strong><p>${weights===o.g?'ぴったり！ つり合ったね。':weights<o.g?'もののほうが重いよ。':'重りのほうが重いよ。'}</p></div>`;
 $('hint').textContent='大きい重りで近づけて、小さい重りで調整してみよう。重りをのせる前に、どちらが重いか予想しよう。';
 $('teacher').textContent='重さは教材用の設定です（牛乳パックは中身入り）。画面では持った感覚は再現できません。実物を手に持つ活動と組み合わせてください。';
 }else{
 $('controls').innerHTML=`<h2>① 注ぐ量を選ぶ</h2><div class="choices"><button data-pour="10" class="${unit===10?'active':''}">10mL</button><button data-pour="100" class="${unit===100?'active':''}">1dL（100mL）</button></div><button id="pour" class="primary" ${water===1000?'disabled':''}>水を1杯入れる</button><label>② 同じ水を別の形へ</label><div class="choices"><button data-shape="slim" class="${shape==='slim'?'active':''}">細長い容器</button><button data-shape="wide" class="${shape==='wide'?'active':''}">平たい容器</button></div><div class="readout"><small>いま入っている水</small><strong>${water} mL</strong><p>＝ ${water/100} dL ＝ ${water/1000} L</p><p>容器の容量：1L（1000mL）<br>いまの水は${unit===10?'10mL':'1dL'}で ${water/unit} 杯分</p></div><button id="empty">水を空にする</button>`;
 $('hint').textContent='10mLを10杯で1dL。1dLを10杯で1L。形を変えても、水の量は変わるかな？';
 $('teacher').textContent='容器は内側の底面積×水深に比例する模式図です。形を変えたときは全量を移します。水面の高さと水の量の違いを確かめてください。';
 }
 draw();
}
function project(x,y,z){return [originX+(x*Math.cos(angle)+z*Math.sin(angle))*scale,originY-y*scale+(z*Math.cos(angle)-x*Math.sin(angle))*scale*.26]}
function poly(points,color,stroke='#35594b22'){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle=stroke;ctx.stroke()}
function box(x,y,z,w,h,d,color){const p=(a,b,c)=>project(a,b,c);poly([p(x,y,z+d),p(x+w,y,z+d),p(x+w,y+h,z+d),p(x,y+h,z+d)],color);poly([p(x,y,z),p(x+w,y,z),p(x+w,y+h,z),p(x,y+h,z)],color);poly([p(x+w,y,z),p(x+w,y,z+d),p(x+w,y+h,z+d),p(x+w,y+h,z)],'#49766555');poly([p(x,y+h,z),p(x+w,y+h,z),p(x+w,y+h,z+d),p(x,y+h,z+d)],color)}
function text(s,x,y,size=14,color='#35524b'){ctx.fillStyle=color;ctx.font=`600 ${size}px "Meiryo",sans-serif`;ctx.textAlign='center';ctx.fillText(s,x,y)}
function line(x1,y1,x2,y2,color='#648b7c',width=2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();ctx.lineWidth=1}
function draw(){
 const r=canvas.getBoundingClientRect();W=r.width;H=r.height;const dpr=window.devicePixelRatio||1;if(canvas.width!==Math.round(W*dpr)||canvas.height!==Math.round(H*dpr)){canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr)}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
 if(mode==='length')drawLength();else if(mode==='weight')drawWeight();else drawVolume();
}
function drawLength(){
 scale=Math.min((H-147)/145,(W-55)/215);originX=W*.46;originY=H-98;
 for(let x=-100;x<=110;x+=10)line(...project(x,0,-30),...project(x,0,45),'#cedbd0');for(let z=-30;z<=45;z+=10)line(...project(-100,0,z),...project(110,0,z),'#cedbd0');
 box(-49,0,0,10,48,12,'#587d88');box(-33,0,0,10,48,12,'#587d88');box(-50,48,0,28,48,15,'#df995e');box(-59,49,1,9,44,10,'#e6b895');box(-22,49,1,9,44,10,'#e6b895');box(-49,96,0,26,34,17,'#ebbd96');box(-49,123,0,26,7,17,'#544e44');
 const face=project(-36,110,-1);text('•  •',...face,Math.max(10,scale*8),'#493d35');
 const a=project(-74,0,0),b=project(-74,130,0);line(...a,...b);line(a[0]-5,a[1],a[0]+5,a[1]);line(b[0]-5,b[1],b[0]+5,b[1]);text('130cm',b[0],b[1]-14,14);
 const o=objects[selected],x=selected===2?10:28;
 if(selected===2){box(x,66,0,65,4,45,o.color);for(const dx of [0,59])for(const dz of [0,39])box(x+dx,0,dz,6,66,6,'#9e9988')}
 else{box(x,0,0,o.w,o.cm,o.d,o.color);if(selected===0)for(let n=0;n<=30;n++){const p=project(x,n,-.1),q=project(x+(n%5===0?3:1.5),n,-.1);line(...p,...q,'#745c31',1)}if(selected===3){const p=project(x+o.w/2,10,-1);text('MILK',...p,Math.max(6,scale*3),'#fff')}}
 const p=project(x+o.w/2,o.cm+12,0);text(revealed?`${o.cm} cm`:'？ cm',...p,20);text('身長のめやす',...project(-36,-17,0),12);text(o.name,...project(x+o.w/2,-17,0),12);
 canvas.setAttribute('aria-label',`130cmの子と${o.name}の比較。${revealed?o.cm+'cm':'高さを予想してください'}`);
}
function drawWeight(){
 const o=objects[selected],cx=W/2,cy=H*.48,span=Math.min(145,W*.27),tilt=Math.sign(o.g-weights)*.15,ly=cy+Math.sin(tilt)*span,ry=cy-Math.sin(tilt)*span;
 poly([[cx-34,H-60],[cx+34,H-60],[cx,cy-12]],'#7b9b87');line(cx-span,ly,cx+span,ry,'#496b59',9);
 function pan(x,y){line(x,y,x-45,y+75);line(x,y,x+45,y+75);poly([[x-55,y+75],[x+55,y+75],[x+39,y+90],[x-39,y+90]],'#bdcdb8')}
 pan(cx-span,ly);pan(cx+span,ry);ctx.fillStyle=o.color;ctx.fillRect(cx-span-24,ly+27,48,46);text(o.name,cx-span,ly+119,13);
 ctx.fillStyle='#647c71';ctx.fillRect(cx+span-29,ry+30,58,43);text(weights+'g',cx+span,ry+57,13,'white');text('重り',cx+span,ry+119,13);
 text(weights===o.g?'つり合った！':o.g>weights?'← もののほうが重い':'重りのほうが重い →',cx,80,Math.min(20,W/23));
 canvas.setAttribute('aria-label',`${o.name}と${weights}gの比較。${weights===o.g?'つり合っています':o.g>weights?'もののほうが重い':'重りのほうが重い'}`);
}
function drawVolume(){
 const factor=Math.min(1,(W-120)/300,(H-125)/270),w=(shape==='slim'?125:270)*factor,h=(shape==='slim'?270:125)*factor,x=(W-w)/2,y=H-75,waterH=h*water/1000;
 ctx.fillStyle='#ffffff99';ctx.fillRect(x,y-h,w,h);ctx.fillStyle='#64b9d2bb';ctx.fillRect(x,y-waterH,w,waterH);ctx.fillStyle='#a5e0e9';ctx.fillRect(x,y-waterH,w,Math.min(4,waterH));
 line(x,y-h,x,y,'#769b9d',3);line(x,y,x+w,y,'#769b9d',3);line(x+w,y,x+w,y-h,'#769b9d',3);
 for(let n=0;n<=10;n++){const yy=y-h*n/10;line(x+w-14,yy,x+w,yy,'#6a8d8d',1);if(n%2===0)text(`${n*100}`,x+w+29,yy+4,11)}text('mL',x+w+29,y-h-16,11);text(water+' mL',W/2,75,26);text(shape==='slim'?'細長い容器':'平たい容器',W/2,y+28,14);
 canvas.setAttribute('aria-label',`容量1Lの${shape==='slim'?'細長い':'平たい'}容器に${water}mLの水`);
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.mode){mode=b.dataset.mode;if(mode==='weight'&&selected===2)selected=0;feedback('');renderControls()}
 if(b.dataset.object!==undefined){selected=Number(b.dataset.object);revealed=false;weights=0;predicted=false;feedback('');renderControls()}
 if(b.id==='answer'){const value=$('guess').value;const n=Number(value);if(value!==''&&(!Number.isFinite(n)||n<0||n>1000)){feedback('0〜1000の数字を入れてね。');return}revealed=true;renderControls();feedback(value===''?'長さが見えたね。ほかのものともくらべよう。':n===objects[selected].cm?'ぴったり！ よく見て予想できたね。':`予想は${n}cm。モデルの高さは${objects[selected].cm}cmだったね。`)}
 if(b.dataset.unit){weightUnit=Number(b.dataset.unit);renderControls()}
 if(b.id==='plus'||b.id==='minus'){weights=Math.max(0,Math.min(10000,weights+(b.id==='plus'?weightUnit:-weightUnit)));renderControls();feedback(weights===objects[selected].g?'つり合った！ ものの重さは '+weights+'g だね。':'重りの種類を変えて、つり合うところを探そう。')}
 if(b.dataset.predict){const actual=weights===objects[selected].g?'equal':weights<objects[selected].g?'object':'weights';predicted=true;feedback(b.dataset.predict===actual?'そのとおり！ 天秤の傾きも見てみよう。':'天秤を見てみよう。重いほうのお皿が下がるよ。')}
 if(b.dataset.pour){unit=Number(b.dataset.pour);renderControls()}
 if(b.id==='pour'){const added=Math.min(unit,1000-water);water+=added;renderControls();feedback(water===1000?`1Lになった！${added<unit?' 残り'+added+'mLだけ入れたよ。':''}`:`${added}mL入れたよ。${water===100?'100mLは1dLだね！':''}`)}
 if(b.dataset.shape){shape=b.dataset.shape;renderControls();feedback(`形を変えても、水は${water}mLのままだね。`)}
 if(b.id==='empty'){water=0;renderControls();feedback('水を空にしたよ。')}
 if(b.id==='front'){angle=0;draw()}if(b.id==='rotate'){angle=-.55;draw()}
 if(b.id==='reset'){selected=0;water=0;weights=0;unit=100;weightUnit=10;shape='slim';revealed=false;angle=-.35;feedback('最初の状態にもどしたよ。');renderControls()}
});
let drag=null;canvas.addEventListener('pointerdown',e=>{if(mode==='length'){drag=e.clientX;canvas.setPointerCapture(e.pointerId)}});canvas.addEventListener('pointermove',e=>{if(drag!==null){angle=Math.max(-.9,Math.min(.9,angle+(e.clientX-drag)*.006));drag=e.clientX;draw()}});canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
window.addEventListener('resize',draw);renderControls();

