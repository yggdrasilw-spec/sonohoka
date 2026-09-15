import * as THREE from './vendor/three.module.js';
import {createTeachingModel} from './teaching-models.mjs?v=20260915-1';
import {catalog,buildQuestions} from './catalog.mjs';
import { items, tub, calibrationFrustum, waterDepth, clamp, smooth } from './units.mjs';
import {createCharacter} from './character-rig.mjs';
import {graspProfile,graspPose} from './grasp.mjs?v=20260915-1';
const $=id=>document.getElementById(id), V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const canvas=$('world'),stage=$('stage');
const qa=new URLSearchParams(location.search);
let sideOn=false,showDimensions=false,quizIndex=0;
const questions=buildQuestions();
const grid=document.querySelector('.object-grid');
for(const [id,d] of Object.entries(catalog)){const b=document.createElement('button');b.dataset.item=id;b.innerHTML='<b>'+d.name+'</b><small>'+d.value+' '+d.unit+'</small>';grid.append(b);}

let renderer;
try { renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false}); }
catch(error){$('loading').innerHTML='3Dを表示できませんでした。WebGL対応ブラウザで開いてください。<br><a href="classic.html">基本教材を開く</a>';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const scene=new THREE.Scene();scene.background=new THREE.Color('#e7e7da');scene.fog=new THREE.Fog('#e7e7da',8,18);
const camera=new THREE.PerspectiveCamera(34,1,.01,40),realCamera=new THREE.OrthographicCamera(-1,1,1,-1,.001,30);
const hemi=new THREE.HemisphereLight('#fff5d8','#8da283',2.6);scene.add(hemi);
const sun=new THREE.DirectionalLight('#fff1d5',3.5);sun.position.set(-2,6,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.1,far:15});sun.shadow.bias=-.00015;sun.shadow.normalBias=.012;sun.shadow.radius=4;scene.add(sun);
const fillLight=new THREE.DirectionalLight('#d8eefa',1);fillLight.position.set(3,3,-2);scene.add(fillLight);
const mats={};function mat(color,extra={}){const key=color+JSON.stringify(extra);return mats[key]||(mats[key]=new THREE.MeshStandardMaterial({color,roughness:.65,...extra}));}
const sphereGeo=new THREE.SphereGeometry(1,24,20),cylinderGeo=new THREE.CylinderGeometry(1,1,1,24),boxGeo=new THREE.BoxGeometry(1,1,1);
function mesh(geo,material,parent,pos=[0,0,0],scale=[1,1,1]){const m=new THREE.Mesh(geo,material);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(parent,size,pos,color,extra){return mesh(boxGeo,mat(color,extra),parent,pos,size)}
function ball(parent,size,pos,color){return mesh(sphereGeo,mat(color),parent,pos,size)}
function cylinder(parent,radius,height,pos,color,extra){return mesh(cylinderGeo,mat(color,extra),parent,pos,[radius,height,radius])}
function group(parent,pos=[0,0,0]){const g=new THREE.Group();g.position.set(...pos);parent.add(g);return g;}
function rod(parent,a,b,r,color){const m=mesh(cylinderGeo,mat(color),parent);setRod(m,V(...a),V(...b),r);return m;}
function setRod(m,a,b,r){m.position.copy(a).lerp(b,.5);m.scale.set(r,a.distanceTo(b),r);m.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());}
function label(parent,txt,w,h,pos,bg='#faf7e8',fg='#42624d'){const c=document.createElement('canvas');c.width=768;c.height=192;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);x.fillStyle=fg;x.font='bold 65px Meiryo,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(txt,384,96);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;const p=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tx,side:THREE.DoubleSide}),parent,pos);p.castShadow=false;return p;}
const room=new THREE.Group();scene.add(room);
box(room,[5.2,.12,4.1],[0,-.075,-.1],'#d7c8a7');
for(let i=0;i<26;i++){const x=-2.5+i*.2;box(room,[.194,.018,4],[x,-.007,-.1],i%3===0?'#d1ba92':i%3===1?'#ddcaa7':'#d7c19b');}
box(room,[5.2,2.3,.09],[0,1.08,-2.05],'#dadcc9');box(room,[.08,2.3,4.1],[-2.57,1.08,-.05],'#dddaca');
box(room,[5,.09,.04],[0,.06,-1.98],'#c3b898');box(room,[.04,.09,4],[-2.5,.06,-.03],'#c3b898');
// A shoji-like window and warm wooden details give the room an everyday scale.
box(room,[1.35,1.18,.05],[-1.0,1.36,-1.98],'#a6b6a0');box(room,[1.24,1.06,.03],[-1,1.36,-1.94],'#eff0dc');
for(const x of [-1.64,-1.32,-1,-.68,-.36])box(room,[.025,1.1,.035],[x,1.36,-1.91],'#bcac89');for(const y of [.83,1.18,1.53,1.9])box(room,[1.3,.025,.035],[-1,y,-1.91],'#bcac89');
label(room,'くらべるラボ',.65,.16,[.65,1.66,-1.99]);
const plant=group(room,[-1.8,0,-1.45]);cylinder(plant,.13,.23,[0,.115,0],'#b78e6c');cylinder(plant,.12,.008,[0,.233,0],'#544f36');rod(plant,[0,.23,0],[0,.77,0],.016,'#688353');
for(let i=0;i<7;i++){let a=i*2.4;const leaf=ball(plant,[.14,.035,.065],[Math.cos(a)*.13,.36+i*.065,Math.sin(a)*.1],'#7b945d');leaf.rotation.z=Math.cos(a)*.4;leaf.rotation.y=a;}
const deskScene=group(scene),bathScene=group(scene);bathScene.visible=false;
// Desk height is exactly 0.70m, including its top.
box(deskScene,[.84,.035,.52],[.44,.6825,-.13],'#c7a06b');box(deskScene,[.79,.028,.47],[.44,.651,-.13],'#af8959');
for(const x of [.075,.805])for(const z of [-.335,.075]){box(deskScene,[.042,.65,.042],[x,.325,z],'#b78f61');}box(deskScene,[.68,.04,.025],[.44,.27,-.335],'#b78f61');
const rug=box(deskScene,[1.25,.008,.9],[-.36,.005,.54],'#a8b49a');
for(let i=0;i<11;i++)box(deskScene,[1.21,.001,.006],[-.36,.01,.15+i*.078],'#b8c2a8');
const heightMark=group(deskScene,[-.95,0,.0]);rod(heightMark,[0,0,0],[0,1.3,0],.003,'#7b9776');for(let i=0;i<=13;i++)rod(heightMark,[-.025,i*.1,0],[.025,i*.1,0],.002,'#7b9776');label(heightMark,'130 cm',.26,.065,[0,1.37,0]);

let kid;
try{kid=await createCharacter(scene);}catch(error){$('loading').textContent='人物モデルを読み込めませんでした。ページを再読み込みしてください。';throw error;}
function makeItem(id){const d=items[id];if(d.kind){const model=createTeachingModel(d);model.userData.id=id;scene.add(model);
 if(d.kind==='measure'){for(let ml=d.stepMl;ml<=d.capacityMl;ml+=d.stepMl){const y=.0025+ml/1e6/(Math.PI*(d.innerDiameter/2)**2);label(model,String(ml),d.width*.23,d.height*.048,[0,y,d.depth/2+.0003],'#e5f2eb','#31515d');}}
 else if(d.kind!=='syringe'&&d.kind!=='card'){label(model,d.kind==='book'?d.name:d.value+' '+d.unit,d.width*.75,Math.min(d.height*.14,.025),[0,d.height*.46,d.depth/2+.0003],'#f5f0de','#3d624f');}
 if(d.kind==='card'){label(model,'郵便はがき',d.width*.55,.01,[0,d.height*.85,d.depth/2+.00003],'#fffbec','#a25e4c');}
 return model;}const root=group(scene);root.userData.id=id;
 if(id==='ruler'){
 box(root,[.035,.3,.003],[0,.15,0],'#e4ba61');for(let i=0;i<=300;i++){const big=i%10===0,mid=i%5===0;box(root,[big?.012:mid?.008:.004,.00045,.0003],[-.0175+(big?.006:mid?.004:.002),i*.001,.0017],'#6b593b');}for(let i=0;i<=30;i+=5){const mark=label(root,String(i),.014,.009,[.007,i*.01,.0019],'#e4ba61','#5a4c32');}
 }else if(id==='pencil'){
 const body=mesh(new THREE.CylinderGeometry(.0035,.0035,.157,6),mat('#ad6650'),root,[0,.0785,0]);mesh(new THREE.ConeGeometry(.0035,.018,6),mat('#d8b182'),root,[0,.166,0]);mesh(new THREE.ConeGeometry(.001,.005,6),mat('#33392f'),root,[0,.1775,0]);
 }else{
 box(root,[.07,.205,.07],[0,.1025,0],'#f7f1de');box(root,[.0703,.066,.0703],[0,.075,0],'#7fa8a1');const roof=new THREE.BufferGeometry();roof.setAttribute('position',new THREE.Float32BufferAttribute([-.035,.205,-.035,.035,.205,-.035,0,.235,-.035, -.035,.205,.035,0,.235,.035,.035,.205,.035, -.035,.205,-.035,0,.235,-.035,-.035,.205,.035, -.035,.205,.035,0,.235,-.035,0,.235,.035, .035,.205,-.035,.035,.205,.035,0,.235,-.035, .035,.205,.035,0,.235,.035,0,.235,-.035],3));roof.computeVertexNormals();mesh(roof,mat('#e7e8d1',{side:THREE.DoubleSide}),root);label(root,'MILK',.058,.02,[0,.083,.0353],'#7fa8a1','#fffdee');label(root,'1 L',.05,.017,[0,.048,.0353],'#7fa8a1','#fffdee');
 }
 root.position.set(.27,.701,.035);return root;}
const objectModels=Object.fromEntries(Object.keys(items).map(id=>[id,makeItem(id)]));
// Bathroom: inner floor 1.25 × .64m; 200L / .8m² = .25m depth.
box(bathScene,[2.55,.018,2.15],[.25,.006,.12],'#c7d2c5');for(let x=-1;x<=1.5;x+=.2)box(bathScene,[.002,.001,2.1],[x,.017,.12],'#f0f0dd');for(let z=-.9;z<=1.2;z+=.2)box(bathScene,[2.5,.001,.002],[.25,.017,z],'#f0f0dd');
const bath=group(bathScene,[.2,0,-.15]);
box(bath,[1.41,.08,.8],[0,.08,0],'#ede8d8');box(bath,[1.25,.016,.64],[0,.128,0],'#d9e2d9');
for(const z of [-.36,.36])box(bath,[1.41,.45,.08],[0,.353,z],'#e8e7d8');for(const x of [-.665,.665])box(bath,[.08,.45,.64],[x,.353,0],'#e8e7d8');
for(const z of [-.36,.36])box(bath,[1.43,.035,.105],[0,.585,z],'#f7f2e4');for(const x of [-.665,.665])box(bath,[.105,.035,.66],[x,.585,0],'#f7f2e4');
label(bath,'200 L の おふろ',.54,.09,[0,.38,.401]);
const water=box(bath,[1.247,.001,.637],[0,.15,0],'#6bb5be',{transparent:true,opacity:.68,roughness:.12,metalness:.12,depthWrite:false});water.castShadow=false;
const waterSurface=mesh(new THREE.PlaneGeometry(1.245,.635,32,16),mat('#8dccce',{transparent:true,opacity:.45,roughness:.1,metalness:.15,side:THREE.DoubleSide,depthWrite:false}),bath,[0,.38,0]);waterSurface.rotation.x=-Math.PI/2;waterSurface.castShadow=false;
const faucet=group(bath,[-.46,0,-.36]);rod(faucet,[0,.59,0],[0,.82,0],.017,'#9ea99f');rod(faucet,[0,.82,0],[0,.82,.16],.017,'#9ea99f');ball(faucet,[.022,.022,.022],[0,.82,0],'#abb4aa');
const stream=cylinder(faucet,.009,.42,[0,.6,.16],'#addde0',{transparent:true,opacity:.5});stream.visible=false;
const bucket=group(bathScene,[1.18,0,.66]);cylinder(bucket,.115,.241,[0,.14,0],'#b5c6ae');cylinder(bucket,.106,.008,[0,.258,0],'#729d9a');const handle=mesh(new THREE.TorusGeometry(.12,.006,8,32,Math.PI),mat('#7a977d'),bucket,[0,.24,0]);bucket.visible=false; // Legacy bucket had unsupported dimensions; use researched desk model.
const cubeGroup=group(bathScene,[-.55,.068,.7]);cubeGroup.visible=false;const literCubes=[];
for(let i=0;i<200;i++){const x=i%10,y=Math.floor(i/100),z=Math.floor(i/10)%10;literCubes.push(box(cubeGroup,[.1,.1,.1],[x*.103,y*.103,z*.103],i%10%2?'#76b7b9':'#91c6c4',{roughness:.25}));}
label(cubeGroup,'1 L × 200 = 200 L',.7,.1,[.46,.38,.48]);
const literExample=box(bathScene,[.1,.1,.1],[-.93,.07,.5],'#87bdbe');label(bathScene,'1 L',.14,.05,[-.93,.17,.55]);
let mode='desk',item='masuDL',view='wide',action=null,held=false,inBath=false,showCubes=false,waterL=200,displayL=200,pourUntil=0;
let cal=null,realPending=false;try{const saved=JSON.parse(localStorage.getItem('ryokan-real-size-v1'));if(saved?.ppm>=1.5&&saved.ppm<=12&&saved.dpr===devicePixelRatio)cal=saved;}catch{}
let camTarget=V(0,.68,0),camGoal=V(0,.68,0),camPosGoal=V(2.4,2.0,3.6),realPan=V(),orbitYaw=.5,orbitPitch=.3,orbitRadius=3.8,manualOrbit=false;
const homeDesk=V(-.57,0,.48),atDesk=V(.10,0,.22),bathHome=V(-.88,0,.55),bathSeat=V(-.22,.13,-.12);
let bodyPosition=homeDesk.clone(),bodyRotation=0,sit=0;

const tableItem=V(.27,.701,.035),presentPosition=V(.10,0,.56);
let gripAmount=0,objectLocal=V();
let w=1,h=1,lastTime=performance.now(),clock=0;
function status(t){$('status').textContent=t;}
function updateUI(){
 $('deskPanel').hidden=mode!=='desk';$('bathPanel').hidden=mode!=='bath';$('handView').hidden=mode!=='desk';$('realView').hidden=mode!=='desk';
 $('title').textContent=mode==='desk'?'手に持つと、どのくらい？':'200Lに、からだごと入ってみる。';$('subtitle').textContent=mode==='desk'?'近づいて、持って、ぐっと見てみよう。':'1Lも、おふろも、自分のからだも。同じものさしの世界。';
 document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));document.querySelectorAll('[data-item]').forEach(b=>{b.classList.toggle('active',b.dataset.item===item);b.disabled=!!action;});document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
 const d=items[item];$('itemLabel').textContent=d.label;$('itemValue').innerHTML=d.value+' <em>'+d.unit+'</em>';$('itemHint').textContent=d.hint;
 $('dimensions').textContent=d.width?`幅 ${(d.width*1000).toFixed(2).replace(/\.?0+$/,'')} × 高さ ${(d.height*1000).toFixed(2).replace(/\.?0+$/,'')} × 奥行 ${(d.depth*1000).toFixed(2).replace(/\.?0+$/,'')} mm`:'従来の教材設定（製品寸法の資料未取得）';
 $('sourceLinks').replaceChildren();
 for(const ref of d.sources||[]){const a=document.createElement('a');a.href=ref.url;a.target='_blank';a.rel='noopener';a.textContent=ref.title+'（確認 '+ref.checked+'）';$('sourceLinks').append(a);}
 $('sourceNote').textContent=(d.dimensionStatus||'仮寸法')+'。形状の細部は簡略化しています。';
 $('sideItem').disabled=!!action;$('sideItem').classList.toggle('active',sideOn);$('sideItem').textContent=sideOn?'正面にもどす':'横から厚さを見る';
 $('volumeControls').hidden=d.kind!=='measure';if(d.kind==='measure')$('volumeReading').textContent=`いま ${objectModels[item].userData.volumeMl||0} mL ／ますの容量 ${d.capacityMl} mL`;
 $('quizPanel').hidden=mode!=='desk';
 for(const [id,m] of Object.entries(objectModels)){if(m.userData.dimensionHelper)m.userData.dimensionHelper.visible=showDimensions&&id===item;}

 $('pick').disabled=held||!!action;$('put').disabled=!held||!!action;$('enter').disabled=!!action;$('enter').textContent=inBath?'▶ おふろから出る':'▶ おふろに入る';
 $('liters').textContent=waterL;$('meterFill').style.width=waterL/2+'%';document.querySelectorAll('[data-add]').forEach(b=>b.disabled=waterL>=200);$('cubes').textContent=showCubes?'1Lのブロックをしまう':'1Lを200個ならべる';$('cubes').classList.toggle('active',showCubes);
 $('physicalScale').hidden=view!=='real';$('viewBadge').textContent=view==='real'?'⌖ 実寸 · 定規で調整済み':view==='hand'?'● 手元の拡大 · 実寸ではありません':'● 同じ縮尺の3D空間';
 $('gesture').textContent=view==='real'?'実寸固定 · ドラッグで上下左右に移動':'ドラッグで回転 · ホイールで近づく';
 $('tipText').textContent=mode==='desk'?'全体 → 手元 → 実寸。見方を変えると、同じ30cmがどう見える？':'200Lは、1Lの200個分。水面の高さだけでなく、おふろ全体の広さも見てみよう。';
 if(view==='real'){$('scaleLine').style.width=cal.ppm*50+'px';$('annotation').textContent='正面の長さを実寸で表示。収まらない部分はドラッグ。';}
 else $('annotation').textContent=mode==='desk'?(held?'手に持てた！ 手元にぐっと近づいてみよう。':'ものを選んだら、歩いて取りにいこう。'):(inBath?'身体の大きさを比較する表示です。':showCubes?'10cm角の1Lを200個。おふろと同じ縮尺。':'この水が200L。からだとくらべてみよう。');
 for(const [key,m]of Object.entries(objectModels))m.visible=mode==='desk'&&key===item;
 deskScene.visible=mode==='desk';bathScene.visible=mode==='bath';cubeGroup.visible=showCubes;canvas.setAttribute('aria-label',mode==='desk'?`身長130cmのキャラクター。${items[item].name}を${held?'手に持っています':'机に置いています'}。${view==='real'?'実寸表示':view==='hand'?'手元拡大':'全体表示'}`:`おふろの水${waterL}L。キャラクターは${inBath?'入浴中':'おふろの外'}。${showCubes?'1Lのブロック200個を比較表示':''}`);
}
function setView(next){if(next==='real'&&!cal){realPending=true;openCalibration();return;}view=next;realPan.set(0,0,0);manualOrbit=false;if(mode==='desk'&&(next==='hand'||next==='real')&&!held&&!action)startPickup();updateUI();}
function startPickup(){if(held||action)return;stage.scrollIntoView({behavior:'smooth',block:'center'});action={type:'pickup',start:clock,duration:5.2,from:bodyPosition.clone(),fromRotation:bodyRotation};status('机へ歩いて、手を伸ばしています…');updateUI();}
function startPut(){if(!held||action)return;view='wide';manualOrbit=false;action={type:'put',start:clock,duration:3.8};status('ものを机にもどしています…');updateUI();}
function switchMode(next){mode=next;action=null;held=false;sit=0;inBath=false;view='wide';manualOrbit=false;realPan.set(0,0,0);bodyPosition.copy(next==='desk'?homeDesk:bathHome);bodyRotation=0;updateUI();status(next==='desk'?'ものを選んで、手に持ってみよう。':`おふろの水はいま${waterL}L。中に入って身体とくらべよう。`);}
function bathAction(){if(action)return;stage.scrollIntoView({behavior:'smooth',block:'center'});view='wide';manualOrbit=false;action={type:inBath?'exit':'enter',start:clock,duration:4.2};status(inBath?'おふろから出ています…':'ふちをまたいで、おふろに入っています…');updateUI();}
function animateActions(){
 let walk=0;const t=action?clamp((clock-action.start)/action.duration,0,1):0;
 const d=items[item],{large}=graspProfile(d,item);
 atDesk.x=large?.27:.10;
 const contact=V(atDesk.x-tableItem.x,.701,atDesk.z-tableItem.z),present=V(large?0:-.09,.81,.27);
 gripAmount=held?1:0;
 if(action?.type==='pickup'){
  if(t<.32){
   const direction=atDesk.clone().sub(action.from),heading=Math.atan2(direction.x,direction.z);
   if(t<.07){bodyPosition.copy(action.from);bodyRotation=THREE.MathUtils.lerp(action.fromRotation||0,heading,smooth(t/.07));}
   else if(t<.26){const p=smooth((t-.07)/.19);bodyPosition.copy(action.from).lerp(atDesk,p);bodyRotation=heading;walk=Math.sin(p*Math.PI*6)*.045;}
   else{bodyPosition.copy(atDesk);bodyRotation=THREE.MathUtils.lerp(heading,Math.PI,smooth((t-.26)/.06));}
  }
  else if(t<.52){bodyPosition.copy(atDesk);bodyRotation=Math.PI;}
  else if(t<.64){gripAmount=smooth((t-.52)/.12);}
  else if(t<.80){held=true;gripAmount=1;objectLocal.copy(contact).lerp(contact.clone().add(V(0,.15,0)),smooth((t-.64)/.16));}
  else{held=true;const p=smooth((t-.80)/.20);bodyPosition.copy(atDesk).lerp(presentPosition,smooth((t-.80)/.09));bodyRotation=Math.PI*(1-smooth((t-.89)/.11));objectLocal.copy(contact.clone().add(V(0,.15,0))).lerp(present,p);}
 }else if(action?.type==='put'){
  if(t<.30){const p=smooth(t/.30);bodyPosition.copy(presentPosition).lerp(atDesk,smooth((t-.12)/.18));bodyRotation=Math.PI*smooth(t/.12);objectLocal.copy(present).lerp(contact.clone().add(V(0,.15,0)),p);}
  else if(t<.60){objectLocal.copy(contact.clone().add(V(0,.15,0))).lerp(contact,smooth((t-.30)/.30));}
  else if(t<.75){held=false;gripAmount=1-smooth((t-.60)/.15);}
  else{held=false;gripAmount=0;}
 }else if(action?.type==='enter'||action?.type==='exit'){
  const p=action.type==='enter'?t:1-t;
  if(p<.3){bodyPosition.copy(bathHome).lerp(V(-.75,0,.32),smooth(p/.3));sit=0;bodyRotation=smooth(p/.3)*Math.PI/2;walk=Math.sin(p*42)*.06;}
  else if(p<.72){const q=smooth((p-.3)/.42);bodyPosition.copy(V(-.75,0,.32)).lerp(V(-.22,.66,-.12),q);bodyPosition.y+=Math.sin(q*Math.PI)*.5;sit=Math.sin(q*Math.PI)*.65;bodyRotation=Math.PI/2;}
  else{const q=smooth((p-.72)/.28);bodyPosition.copy(V(-.22,.66,-.12)).lerp(bathSeat,q);sit=q;bodyRotation=Math.PI/2;}
 }
 if(action&&t>=1){const type=action.type;action=null;
  if(type==='pickup'){held=true;gripAmount=1;bodyPosition.copy(presentPosition);bodyRotation=0;objectLocal.copy(present);status('手に持てたよ。手元や横から、ものと手をくらべよう。');}
  if(type==='put'){held=false;gripAmount=0;status('机にもどしたよ。');}
  if(type==='enter'){inBath=true;sit=1;bodyPosition.copy(bathSeat);status('おふろと身体の大きさをくらべよう。');}
  if(type==='exit'){inBath=false;sit=0;bodyPosition.copy(bathHome);bodyRotation=0;status('おふろから出たよ。');}updateUI();
 }
 if(held&&!action)objectLocal.copy(present);
 kid.root.position.copy(bodyPosition);kid.root.rotation.y=bodyRotation;kid.root.updateMatrixWorld(true);
 const m=objectModels[item];
 if(held){m.position.copy(kid.root.localToWorld(objectLocal.clone()));m.quaternion.copy(kid.root.quaternion);}
 else{m.position.copy(tableItem);m.rotation.set(0,Math.PI,0);}
 // Holding frame is attached to the object; camera-side inspection never rotates it out of the fingers.
 const objectPosition=kid.root.worldToLocal(m.position.clone());
 let reach=held?1:0;
 if(action?.type==='pickup')reach=t<.32?0:smooth((t-.32)/.20);
 if(action?.type==='put')reach=t<.75?1:1-smooth((t-.75)/.25);
 kid.pose({...graspPose(d,item,objectPosition,reach,gripAmount),sit,walk});
}
function updateCamera(dt){
 const obj=objectModels[item];
 if(view==='real'&&cal){const fr=calibrationFrustum(w,h,cal.ppm);Object.assign(realCamera,fr);realCamera.updateProjectionMatrix();const center=obj.position.clone().add(V(0,Math.min(items[item].height/2,h/(cal.ppm*1000)*.2),0)).add(realPan);realCamera.position.copy(center).add(V(0,0,2));realCamera.lookAt(center);return;}
 if(view==='hand'){camGoal.copy(obj.position).add(V(0,items[item].height*.42,0));camPosGoal.copy(camGoal).add(sideOn?V(.75,.08,0):V(.24,.12,.75));}
 else if(mode==='bath'){camGoal.set(.08,.52,showCubes?.48:0);camPosGoal.set(showCubes?3.3:2.35,showCubes?3.15:2.4,showCubes?4.3:3.5);}
 else {camGoal.set(-.06,.71,.1);camPosGoal.set(2.15,1.9,3.65);}
 if(w/h<.9&&view==='wide'){camPosGoal.sub(camGoal).multiplyScalar(1.22).add(camGoal);}
 if(manualOrbit){camPosGoal.copy(camGoal).add(V(Math.sin(orbitYaw)*Math.cos(orbitPitch)*orbitRadius,Math.sin(orbitPitch)*orbitRadius,Math.cos(orbitYaw)*Math.cos(orbitPitch)*orbitRadius));}
 const k=1-Math.exp(-dt*5);camTarget.lerp(camGoal,k);camera.position.lerp(camPosGoal,k);camera.lookAt(camTarget);
}
function frame(now){const dt=qa.has('qa')?1:Math.min((now-lastTime)/1000,.05);lastTime=now;if(!qa.has('qa'))clock+=dt;animateActions();displayL+=(waterL-displayL)*(1-Math.exp(-dt*3));const depth=waterDepth(displayL,sit*15*Math.min(displayL/200,1));water.visible=waterSurface.visible=displayL>.1;water.scale.y=Math.max(.0001,depth);water.position.y=.137+depth/2;waterSurface.position.y=.138+depth;
 const positions=waterSurface.geometry.attributes.position;for(let i=0;i<positions.count;i++){positions.setZ(i,Math.sin(positions.getX(i)*18+clock*1.8)*Math.cos(positions.getY(i)*15+clock)*.0012);}positions.needsUpdate=true;
 stream.visible=clock<pourUntil;stream.scale.y=Math.max(.02,.82-(.138+depth));stream.position.y=(.82+.138+depth)/2;
 updateCamera(dt);renderer.render(scene,view==='real'&&cal?realCamera:camera);if(!qa.has('qa'))requestAnimationFrame(frame);
}
function resize(){w=stage.clientWidth;h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(cal&&cal.dpr!==devicePixelRatio){cal=null;if(view==='real'){view='hand';status('表示倍率が変わりました。実寸は定規で再調整してください。');}updateUI();}}
new ResizeObserver(resize).observe(stage);
function openCalibration(){if(cal)$('calRange').value=cal.ppm;updateCalLine();$('calibration').showModal();}
function updateCalLine(){$('calLine').style.width=Number($('calRange').value)*50+'px';}
$('calibrate').onclick=()=>{realPending=view==='real';openCalibration();};$('calRange').oninput=updateCalLine;
$('calMinus').onclick=()=>{$('calRange').value=Number($('calRange').value)-.01;updateCalLine();};$('calPlus').onclick=()=>{$('calRange').value=Number($('calRange').value)+.01;updateCalLine();};
$('saveCal').onclick=()=>{cal={ppm:Number($('calRange').value),dpr:devicePixelRatio};try{localStorage.setItem('ryokan-real-size-v1',JSON.stringify(cal));}catch{}$('calibration').close();status('実寸の調整を保存したよ。画面や倍率を変えたら、定規で確かめ直してね。');if(realPending){realPending=false;setView('real');}else updateUI();};
$('clearCal').onclick=()=>{cal=null;realPending=false;try{localStorage.removeItem('ryokan-real-size-v1');}catch{}if(view==='real')view='hand';$('calibration').close();updateUI();status('実寸調整をリセットしました。定規を用意して合わせ直してください。');};
$('calibration').addEventListener('close',()=>{if(!cal)realPending=false;});
$('pick').onclick=startPickup;$('put').onclick=startPut;$('enter').onclick=bathAction;
$('home').onclick=()=>{manualOrbit=false;realPan.set(0,0,0);};
$('cubes').onclick=()=>{showCubes=!showCubes;view='wide';manualOrbit=false;updateUI();status(showCubes?'1L（10cm角）を200個ならべたよ。いまのおふろの水量とは独立した、200Lの比較用だよ。':'ブロックをしまったよ。');};
$('drain').onclick=()=>{waterL=0;updateUI();status('水を抜いています。');};$('fill').onclick=()=>{waterL=200;pourUntil=clock+2;updateUI();status('200Lまで水を入れています。');};
for(const b of document.querySelectorAll('[data-add]'))b.onclick=()=>{const add=Math.min(Number(b.dataset.add),200-waterL);waterL+=add;pourUntil=clock+1.2;updateUI();status(`${add}L入れたよ。いま${waterL}L。${waterL===200?'200Lになった！':''}`);};
for(const b of document.querySelectorAll('[data-item]'))b.onclick=()=>{if(action)return;item=b.dataset.item;sideOn=false;held=false;bodyRotation=0;bodyPosition.copy(homeDesk);view='wide';manualOrbit=false;updateUI();status(`${items[item].name}を選んだよ。歩いて取りにいこう。`);};

$('sideItem').onclick=()=>{if(action)return;sideOn=!sideOn;view=cal&&view==='real'?'real':'hand';manualOrbit=false;updateUI();};
$('dimensionToggle').onclick=()=>{showDimensions=!showDimensions;$('dimensionToggle').classList.toggle('active',showDimensions);updateUI();};
for(const [id,m] of Object.entries(objectModels)){const d=items[id];if(!d.width)continue;
 const helper=new THREE.Box3Helper(new THREE.Box3(V(-d.width/2,0,-d.depth/2),V(d.width/2,d.height,d.depth)),0x467f70);helper.visible=false;m.add(helper);m.userData.dimensionHelper=helper;
}
for(const b of document.querySelectorAll('[data-volume]'))b.onclick=()=>{const m=objectModels[item],d=items[item];if(!m.userData.setVolume)return;const ml=Number(b.dataset.volume)*d.capacityMl;m.userData.setVolume(ml);m.userData.volumeMl=ml;$('volumeReading').textContent=`いま ${ml} mL（${ml/100} dL）／ますの容量 ${d.capacityMl} mL`;};
function renderQuestion(){const q=questions[quizIndex];$('quizProgress').textContent=`${quizIndex+1} / ${questions.length}`;$('quizQuestion').textContent=q.text;$('quizResult').textContent='';$('quizAnswers').replaceChildren();const choices=[['mm','cm','m','km'],['mL','dL','L'],['g','kg','t'],['cm²','m²','a','ha','km²'],['cm³','m³']].find(group=>group.includes(q.answer));for(const unit of choices){const b=document.createElement('button');b.textContent=unit;b.onclick=()=>{$('quizResult').textContent=unit===q.answer?'正解！ '+q.explanation:'もう一度、大きさや数を考えてみよう。';};$('quizAnswers').append(b);}$('quizShow').hidden=!q.item;}
$('quizNext').onclick=()=>{quizIndex=(quizIndex+1)%questions.length;renderQuestion();};
$('quizShow').onclick=()=>{const id=questions[quizIndex].item;if(id&&!action){document.querySelector(`[data-item="${id}"]`).click();setView('hand');}};
renderQuestion();
for(const b of document.querySelectorAll('[data-mode]'))b.onclick=()=>switchMode(b.dataset.mode);
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>setView(b.dataset.view);
let pointer=null;canvas.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);if(!manualOrbit){const offset=camera.position.clone().sub(camTarget);orbitRadius=offset.length();orbitYaw=Math.atan2(offset.x,offset.z);orbitPitch=Math.asin(offset.y/orbitRadius);}});
canvas.addEventListener('pointermove',e=>{if(!pointer)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer={x:e.clientX,y:e.clientY};if(view==='real'&&cal){realPan.x-=dx/(cal.ppm*1000);realPan.y+=dy/(cal.ppm*1000);}else {manualOrbit=true;orbitYaw-=dx*.006;orbitPitch=clamp(orbitPitch+dy*.004,.05,1.2);}});canvas.addEventListener('pointerup',()=>pointer=null);canvas.addEventListener('pointercancel',()=>pointer=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();if(view==='real')return;if(!manualOrbit){const o=camera.position.clone().sub(camTarget);orbitRadius=o.length();orbitYaw=Math.atan2(o.x,o.z);orbitPitch=Math.asin(o.y/orbitRadius);}manualOrbit=true;orbitRadius=clamp(orbitRadius*Math.exp(e.deltaY*.001),.25,8);},{passive:false});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('loading').hidden=false;$('loading').textContent='3D表示が中断されました。ページを再読み込みしてください。';});
if(qa.has('qa')){
 item=qa.get('item')||'masuDL';view=qa.get('view')||'hand';sideOn=qa.get('side')==='1';
 if(qa.get('qa')==='hold'){held=true;bodyPosition.copy(presentPosition);}
 else if(qa.get('qa')==='pickup'){action={type:'pickup',start:0,duration:1,from:homeDesk.clone()};for(let f=0;f<=Number(qa.get('t')||.52);f+=.005){clock=f;animateActions();}}
 else if(qa.get('qa')==='bath'){mode='bath';sit=1;bodyPosition.copy(bathSeat);bodyRotation=Math.PI/2;}
 animateActions();const report=document.createElement('pre');report.id='rig-report';report.textContent=JSON.stringify(kid.diagnostics,null,2);document.body.append(report);resize();updateCamera(10);
}
resize();camera.position.copy(camPosGoal);updateUI();$('loading').hidden=true;requestAnimationFrame(frame);



