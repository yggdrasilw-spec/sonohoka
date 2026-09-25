import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {createCharacter} from './character-rig.mjs?v=20260925-4';
import {fitModelToMeasurement} from './model-scale.mjs';
import {walkPosition} from './field-navigation.mjs';
import {fieldItems,animalCredits} from './field-data.mjs';
const $=id=>document.getElementById(id),v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),canvas=$('world');
const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
const scene=new T.Scene();scene.background=new T.Color('#e8ede1');scene.add(new T.HemisphereLight('#fff7e3','#8b9d83',2.8));
const sun=new T.DirectionalLight('#fff3dd',3);sun.position.set(-10,25,15);scene.add(sun);
const camera=new T.PerspectiveCamera(40,1,.001,400),target=v(),desired=v();let yaw=.65,pitch=.48,radius=15,field='',selected='',showMeasure=true,eyeMode=false,walkOrigin=0;
const groups={},objects={},measures={},placements={},centers={},radii={},animalModels={};
function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
const obstacles={classroom:[],outdoor:[{minX:-.3,maxX:25.3,minZ:-6.55,maxZ:6.55},{minX:-3,maxX:33,minZ:-19.5,maxZ:-10.5}]};
const materials=new Map();function material(color){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.75}));return materials.get(color);}
function box(parent,w,h,d,x,y,z,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),material(color));m.position.set(x,y,z);parent.add(m);return m;}
function ellipsoid(parent,r,x,y,z,color){const m=new T.Mesh(new T.SphereGeometry(1,24,16),material(color));m.scale.set(...r);m.position.set(x,y,z);parent.add(m);return m;}
function label(parent,text,position,width=.8,color='#365c51'){
 const c=document.createElement('canvas');let ctx=c.getContext('2d');ctx.font='bold 64px sans-serif';c.width=Math.ceil(ctx.measureText(text).width+48);c.height=108;ctx=c.getContext('2d');ctx.fillStyle='#fffdf1';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=color;ctx.font='bold 64px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,c.width/2,56);
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:false}));sprite.position.copy(position);sprite.scale.set(width,width*c.height/c.width,1);sprite.renderOrder=10;parent.add(sprite);return sprite;
}
function line(parent,a,b,color='#c46743'){
 const g=new T.BufferGeometry().setFromPoints([a,b]),m=new T.Line(g,new T.LineBasicMaterial({color,depthTest:false}));m.renderOrder=8;parent.add(m);
}
function dimension(parent,a,b,text,labelSize=1){
 line(parent,a,b);const dir=b.clone().sub(a).normalize(),tick=Math.abs(dir.y)>.5?v(.06*labelSize,0,0):v(0,.06*labelSize,0);
 for(const p of [a,b])line(parent,p.clone().sub(tick),p.clone().add(tick));
 return label(parent,text,a.clone().lerp(b,.5).add(v(0,.13*labelSize,0)),labelSize);
}
function register(f,id,g,position,r){objects[f][id]=g;centers[f][id]=position;placements[f][id]=position.clone().add(v(-.85,-position.y,.8));radii[f][id]=r;measures[f][id]=group(groups[f]);}
function table(parent,w,h,d,x,z){const g=group(parent,x,0,z);if(parent===groups.classroom)obstacles.classroom.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});box(g,w,.035,d,0,h-.0175,0,'#ccae75');for(const xx of [-1,1])for(const zz of [-1,1])box(g,.035,h-.035,.035,xx*(w/2-.04),(h-.035)/2,zz*(d/2-.04),'#8a9690');return g;}
for(const f of Object.keys(fieldItems)){groups[f]=group(scene);groups[f].visible=false;objects[f]={};measures[f]={};placements[f]={};centers[f]={};radii[f]={};}
// Seven-by-nine metre cutaway classroom, floor at y=0.
const room=groups.classroom;box(room,7,.06,9,0,-.03,0,'#c8b999');
box(room,7,3,.08,0,1.5,-4.54,'#eeeada');box(room,.08,3,9,-3.54,1.5,0,'#eeeada');
for(let x=-3.5;x<=3.5;x++)line(room,v(x,.001,-4.5),v(x,.001,4.5),'#aba98f');for(let z=-4.5;z<=4.5;z++)line(room,v(-3.5,.001,z),v(3.5,.001,z),'#aba98f');
for(let z=-2.8;z<4;z+=2.4){box(room,.015,1.35,1.9,-3.49,1.75,z,'#b6d9d9');for(const y of [1.06,2.44])box(room,.04,.035,1.96,-3.47,y,z,'#f8f3dc');}
const ceiling=new T.Box3Helper(new T.Box3(v(-3.5,0,-4.5),v(3.5,3,4.5)),0x929e8b);room.add(ceiling);
register('classroom','room',room,v(0,1,0),14);placements.classroom.room.set(2.5,0,3.2);
dimension(measures.classroom.room,v(-3.5,.10,4.8),v(3.5,.10,4.8),'横 7m',1.6);dimension(measures.classroom.room,v(3.8,.10,-4.5),v(3.8,.10,4.5),'奥行 9m',1.6);dimension(measures.classroom.room,v(3.8,0,-4.5),v(3.8,3,-4.5),'高さ 3m',1.4);
for(let row=0;row<4;row++)for(let col=0;col<5;col++){
 const x=-2.6+col*1.15,z=-1.7+row*1.28,g=table(room,.65,.58,.45,x,z);
 const chair=group(room,x,0,z+.48);box(chair,.34,.035,.34,0,.325,0,'#b48e5c');box(chair,.34,.28,.025,0,.51,.15,'#b48e5c');for(const xx of [-.14,.14])for(const zz of [-.14,.14])box(chair,.025,.31,.025,xx,.155,zz,'#89958c');
 if(row===3&&col===4)register('classroom','pupil',g,v(x,.3,z),2.7);
}
const longdesk=table(room,1.8,.7,.45,-1.4,3.95);register('classroom','longdesk',longdesk,v(-1.4,.4,3.95),3.8);placements.classroom.longdesk.set(-2.6,0,3.25);
const teacher=table(room,.8,.9,.45,0,-3.3);box(teacher,.75,.7,.025,0,.50,-.18,'#c1a879');register('classroom','teacher',teacher,v(0,.5,-3.3),3.2);
const locker=group(room,2.65,0,3.95);box(locker,1.3,1.5,.025,0,.75,-.2125,'#b5bfa8');for(let i=0;i<=4;i++)box(locker,.018,1.5,.45,-.641+i*.3205,.75,0,'#d5d9bf');for(let j=0;j<=3;j++)box(locker,1.3,.018,.45,0,.009+j*.494,0,'#d5d9bf');register('classroom','locker',locker,v(2.65,.75,3.95),3.8);placements.classroom.locker.set(1.6,0,3.2);
const board=group(room,0,.90,-4.47);box(board,3.6,1.2,.04,0,.6,0,'#345a4b');register('classroom','board',board,v(0,1.5,-4.42),6);placements.classroom.board.set(-2.3,0,-3.5);
for(const [id,g] of Object.entries(objects.classroom))if(id!=='room'){
 const d=fieldItems.classroom[id],center=centers.classroom[id],base=id==='board'?.9:0;
 dimension(measures.classroom[id],v(center.x-d.size[0]/2,base+.04,center.z+.35),v(center.x+d.size[0]/2,base+.04,center.z+.35),`${Math.round(d.size[0]*100)}cm`,Math.max(.65,d.size[0]*.55));
 dimension(measures.classroom[id],v(center.x+d.size[0]/2+.12,base,center.z+.35),v(center.x+d.size[0]/2+.12,base+d.size[1],center.z+.35),`${Math.round(d.size[1]*100)}cm`,.65);
}
// Outdoor comparison campus. Dimensions are metres, not rescaled thumbnails.
const outdoor=groups.outdoor;box(outdoor,100,.12,85,20,-.07,5,'#c8d4ad');
const grid=new T.GridHelper(100,100,0x9aad94,0xb6c69d);grid.position.set(20,0,5);outdoor.add(grid);
const pool=group(outdoor,12.5,0,0);box(pool,25,1.2,12.5,0,-.6,0,'#75b7c5');for(const z of [-6.4,6.4])box(pool,25.5,.12,.3,0,.06,z,'#e5e1c9');for(const x of [-12.65,12.65])box(pool,.3,.12,12.5,x,.06,0,'#e5e1c9');for(let z=-6.25;z<=6.25;z+=2.5)box(pool,25,.015,.035,0,.013,z,'#f7e8a9');register('outdoor','pool',pool,v(12.5,0,0),37);placements.outdoor.pool.set(0,0,7.2);dimension(measures.outdoor.pool,v(0,.18,7),v(25,.18,7),'25m',4);dimension(measures.outdoor.pool,v(26,.18,-6.25),v(26,.18,6.25),'12.5m',3);
const track=group(outdoor,25,0,18);box(track,56,.012,4.1,0,.005,0,'#be9577');for(let lane=0;lane<=3;lane++)box(track,50,.004,.04,0,.014,-1.8+lane*1.2,'#fff6df');for(let x=-25;x<=25;x+=5){box(track,.05,.008,3.6,x,.018,0,'#fff6df');label(track,`${x+25}m`,v(x,.15,2.25),1.3);}register('outdoor','track',track,v(25,.3,18),58);placements.outdoor.track.set(0,0,20.6);dimension(measures.outdoor.track,v(0,.25,21.6),v(50,.25,21.6),'50m ＝ 25m × 2',7);
const school=group(outdoor,15,0,-15);box(school,36,10.5,9,0,5.25,0,'#e7dcc4');for(let floor=0;floor<3;floor++){box(school,36,.13,.15,0,floor*3.5,4.56,'#afa88f');for(let x=-16;x<=16;x+=2.6)box(school,1.7,1.55,.03,x,1.8+floor*3.5,4.52,'#8daeb4');}register('outdoor','school',school,v(15,4,-15),52);placements.outdoor.school.set(-2,0,-9.8);dimension(measures.outdoor.school,v(-3,.2,-9.4),v(33,.2,-9.4),'36m',6);dimension(measures.outdoor.school,v(33.6,0,-10.5),v(33.6,10.5,-10.5),'10.5m',4);
for(const id of Object.keys(animalCredits)){const g=group(outdoor,10,0,32);register('outdoor',id,g,v(10,1,32),12);placements.outdoor[id].set(5,0,36);g.visible=false;}
// Enlarged, dimensionally specified teaching examples. Their forms are schematic.
const micro=groups.micro;box(micro,.09,.001,.065,0,-.004,0,'#eee5cb');
const nail=group(micro,-.018,0,0);ellipsoid(nail,[.007,.003,.013],0,0,0,'#dda984');const nailSurface=box(nail,.010,.0005,.008,0,.003,.005,'#f2d9bd');register('micro','nail',nail,v(-.018,0,0),.065);dimension(measures.micro.nail,v(-.023,.005,.012),v(-.013,.005,.012),'1cm ＝ 10mm',.026).position.set(-.023,.004,-.016);
const pencil=group(micro,.018,0,0);const body=new T.Mesh(new T.CylinderGeometry(.0035,.0035,.021,6),material('#d6a951'));body.rotation.x=Math.PI/2;body.position.z=-.008;pencil.add(body);
const wood=new T.Mesh(new T.CylinderGeometry(.0008,.0035,.011,16),material('#c69f74'));wood.rotation.x=Math.PI/2;wood.position.z=.008;pencil.add(wood);
const core=new T.Mesh(new T.CylinderGeometry(.0005,.0008,.003,20),material('#383e3b'));core.rotation.x=Math.PI/2;core.position.z=.015;pencil.add(core);
register('micro','graphite',pencil,v(.018,0,.015),.043);dimension(measures.micro.graphite,v(.0175,.001,.018),v(.0185,.001,.018),'直径 1mm',.018).position.set(.031,.003,.004);
const ruler=group(micro,0,0,.025);box(ruler,.060,.0006,.008,0,0,0,'#d7be86');for(let mm=-30;mm<=30;mm++){const len=mm%10===0?.006:mm%5===0?.004:.0025;box(ruler,.00010,.00005,len,mm/1000,.00033,-.004+len/2,'#4b624b');if(mm%10===0)label(ruler,String((mm+30)/10),v(mm/1000,.001,.002),.005);}label(micro,'1つの小さい目盛りが1mm',v(0,.002,.035),.040);
obstacles.classroom.push({minX:2,maxX:3.3,minZ:3.725,maxZ:4.175});
let kid;
try{kid=await createCharacter(scene,null,'child-makehuman.glb?v=20260924-1');}catch(e){$('loading').textContent='人物モデルを読み込めません。再読み込みしてください。';throw e;}
const idle={right:v(-.19,.70,.06),left:v(.19,.70,.06)};kid.pose(idle);
const heightMarker=group(scene);dimension(heightMarker,v(-.23,0,0),v(-.23,1.3,0),'130cm',.7);
const animalStatus={};
async function loadAnimal(id){
 if(animalModels[id])return;const wrapper=objects.outdoor[id],d=fieldItems.outdoor[id];
 if(animalStatus[id]==='loading')return;animalStatus[id]='loading';$('fieldStatus').textContent='動物モデルを読み込んでいます…';
 try{
  const gltf=await new GLTFLoader().loadAsync(new URL(`./models/animals/${id}.glb`,import.meta.url).href),model=gltf.scene;wrapper.add(model);
  const size=fitModelToMeasurement(model,d.axis,d.measure);animalModels[id]=model;animalStatus[id]='ready';
  centers.outdoor[id].copy(wrapper.position).add(v(0,size.y*.4,0));radii.outdoor[id]=Math.max(size.x,size.y,size.z)*1.8+3;placements.outdoor[id].copy(wrapper.position).add(v(-size.x/2-1,0,size.z/2+.7));
  const a=wrapper.position.clone().add(d.axis==='y'?v(size.x/2+.5,0,0):v(-size.x/2,.2,size.z/2+.6)),b=a.clone();b[d.axis]+=d.measure;dimension(measures.outdoor[id],a,b,`${d.measure}m`,Math.max(1,d.measure*.14));
  if(field==='outdoor'&&selected===id){$('focus').disabled=false;$('fieldStatus').textContent='モデルの準備ができました。「選んだものへ」で近づけます。';}
 }catch(e){animalStatus[id]='error';if(field==='outdoor'&&selected===id){$('fieldStatus').textContent='動物モデルの読み込みに失敗しました。もう一度選ぶと再試行します。';$('focus').disabled=false;}console.error(e);}
}
function sourceLink(parent,text,url){const a=document.createElement('a');a.textContent=text;a.href=url;a.target='_blank';a.rel='noopener';parent.append(a);}
function selectItem(id){
 selected=id;const d=fieldItems[field][id];$('fieldName').textContent=d.name;$('fieldValue').textContent=d.value;$('fieldNote').textContent=d.note;$('fieldSources').replaceChildren();d.sources.forEach(s=>sourceLink($('fieldSources'),s.title,s.url));
 $('fieldAnnotation').textContent=d.name+' · '+d.value;
 for(const b of document.querySelectorAll('[data-choice]'))b.classList.toggle('active',b.dataset.choice===id);
 for(const [f,list] of Object.entries(measures))for(const [key,g] of Object.entries(list))g.visible=f===field&&key===selected&&showMeasure;
 for(const id of Object.keys(animalCredits))objects.outdoor[id].visible=field==='outdoor'&&selected===id;
 $('focus').disabled=field==='outdoor'&&id in animalCredits&&!animalModels[id];
 if(field==='outdoor'&&id in animalCredits){sourceLink($('fieldSources'),'模型：Poly by Google / CC BY 3.0',`https://poly.pizza/m/${animalCredits[id]}`);loadAnimal(id);}else if(!d.sources.length)$('fieldSources').textContent='上の説明に記載した比較用の設定値です。';
}
function movePerson(){kid.root.position.copy(placements[field][selected]);const direction=centers[field][selected].clone().sub(kid.root.position);kid.root.rotation.y=Math.atan2(direction.x,direction.z);if(viewMode!=='overview')yaw=kid.root.rotation.y-Math.PI;walkOrigin=kid.root.position.clone();walkDistance=0;kid.pose(idle);updateWalkReading();}
function focus(){if($('focus').disabled)return;viewMode="overview";eyeMode=false;syncView();target.copy(centers[field][selected]);radius=radii[field][selected];yaw=field==='micro'?.05:.5;pitch=field==='micro'?1.25:.38;}
function overview(){viewMode="overview";eyeMode=false;syncView();target.copy(field==='classroom'?v(0,1,0):field==='outdoor'?v(20,1,8):v(0,0,.006));radius=field==='classroom'?16:field==='outdoor'?88:.105;yaw=.65;pitch=field==='micro'?1.2:.62;}
function updateWalkReading(){$('walkReading').textContent=field==='micro'?'拡大図です。爪と芯と定規は同じ縮尺。':`基準の位置から ${(kid.root.position.distanceTo(walkOrigin)).toFixed(1)}m。人物の身長は130cm。`;}
function switchField(next){
 stopWalking();stepAction=null;field=next;for(const [f,g] of Object.entries(groups))g.visible=f===field;
 const tiny=field==='micro';kid.root.visible=heightMarker.visible=!tiny;for(const id of ['personBadge','eyeView','thirdView','movePerson','walkControls','navigationHelp','driveControls'])$(id).hidden=tiny;
 $('fieldTitle').textContent={classroom:'教室を、からだで測ろう。',outdoor:'校庭には、どのくらい入る？',micro:'1cm・1mmを思い浮かべよう。'}[field];
 $('fieldSubtitle').textContent=tiny?'爪の横幅、少し書いた鉛筆の芯。身近な目安から。':'身長130cmの子と、同じ縮尺でくらべよう。';
 $('selectionTitle').textContent={classroom:'教室のもの',outdoor:'校庭・校舎・動物',micro:'小さな長さの目安'}[field];$('fieldBadge').textContent=tiny?'拡大表示 · 実寸ではありません':'床の1マス＝1m';
 $('fieldTip').textContent={classroom:'児童机から黒板まで、何mぐらい？「子どもの目線」でも見てみよう。',outdoor:'25mプール2つ分が50m。30mのクジラと並ぶと、自分はどのくらい小さい？',micro:'1cmの中には1mmが10個。自分の爪の横幅は何mmかな？'}[field];
 document.querySelectorAll('[data-field]').forEach(b=>b.classList.toggle('active',b.dataset.field===field));$('fieldChoices').replaceChildren();
 for(const [id,d] of Object.entries(fieldItems[field])){const b=document.createElement('button');b.dataset.choice=id;b.textContent=d.name;b.onclick=()=>selectItem(id);$('fieldChoices').append(b);}
 selectItem(Object.keys(fieldItems[field])[0]);if(!tiny)movePerson();updateWalkReading();overview();history.replaceState(null,'','?field='+field);
}
for(const b of document.querySelectorAll('[data-field]'))b.onclick=()=>switchField(b.dataset.field);
let pointer=null;canvas.onpointerdown=e=>{canvas.focus({preventScroll:true});pointer=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(!pointer)return;yaw-=(e.clientX-pointer[0])*.006;pitch=T.MathUtils.clamp(pitch+(e.clientY-pointer[1])*.004,viewMode==="overview"?.05:-1.1,1.3);pointer=[e.clientX,e.clientY];};canvas.onpointerup=canvas.onpointercancel=()=>pointer=null;
function zoom(f){if(viewMode==="first")setPerspective("third");radius=T.MathUtils.clamp(radius*f,field==='micro'?.008:.5,field==='micro'?.3:160);}
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(e.deltaY*.001));},{passive:false});$('zoomIn').onclick=()=>zoom(.8);$('zoomOut').onclick=()=>zoom(1.25);
let stepAction=null,viewMode='overview',walkDistance=0,walkBlend=0,lastFrame=performance.now();
const keys=new Set();
function syncView(){for(const [id,value] of [['overview','overview'],['thirdView','third'],['eyeView','first']]){$(id).classList.toggle('active',viewMode===value);$(id).setAttribute('aria-pressed',String(viewMode===value));}}
function setPerspective(next){
 if(field==='micro')return;
 if(viewMode==='overview'){yaw=kid.root.rotation.y-Math.PI;pitch=.12;}
 viewMode=next;eyeMode=next==='first';radius=3.6;syncView();canvas.focus({preventScroll:true});
}
function stopWalking(){keys.clear();walkBlend=0;if(kid)kid.pose(idle);}
function updateNavigation(dt){
 if(field==='micro')return;
 const turn=(keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0);
 const tilt=(keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0);
 yaw+=turn*1.4*dt;pitch=T.MathUtils.clamp(pitch+tilt*dt,viewMode==='overview'?.05:-1.1,1.3);
 const moving=keys.has('Space');let moved=0;
 if(moving){
  stepAction=null;if(viewMode==='overview')setPerspective('third');
  const bounds=field==='classroom'?{minX:-3.28,maxX:3.28,minZ:-4.28,maxZ:4.28}:{minX:-29,maxX:69,minZ:-36,maxZ:46};
  const from=kid.root.position.clone(),next=walkPosition(from,yaw+Math.PI,dt*1.2,bounds,obstacles[field]);
  kid.root.position.set(next.x,0,next.z);kid.root.rotation.y=yaw+Math.PI;moved=from.distanceTo(kid.root.position);walkDistance+=moved;updateWalkReading();
 }
 walkBlend=T.MathUtils.damp(walkBlend,moved>1e-5?1:0,12,dt);
 if(!stepAction)kid.pose({...idle,walkDistance,walkWeight:walkBlend});
}
canvas.tabIndex=0;canvas.setAttribute('aria-label','3Dフィールド。スペースを押して前進、矢印キーで視線移動。Vで一人称と三人称を切り替え。');
canvas.addEventListener('keydown',e=>{if(field==='micro')return;if(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyV'].includes(e.code)){e.preventDefault();if(e.code==='KeyV'){if(!e.repeat)setPerspective(viewMode==='first'?'third':'first');}else{keys.add(e.code);if(!e.repeat)updateNavigation(.05);}}});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',stopWalking);canvas.addEventListener('blur',stopWalking);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopWalking();});
for(const b of document.querySelectorAll('[data-drive]')){
 b.onpointerdown=e=>{e.preventDefault();canvas.focus({preventScroll:true});b.setPointerCapture(e.pointerId);keys.add(b.dataset.drive);};
 b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.drive);
}
function walkBy(amount){if(stepAction)return;const from=kid.root.position.clone(),heading=amount>0?Math.PI/2:-Math.PI/2,bounds=field==='classroom'?{minX:-3.28,maxX:3.28,minZ:-4.28,maxZ:4.28}:{minX:-29,maxX:69,minZ:-36,maxZ:46},p=walkPosition(from,heading,Math.abs(amount),bounds,obstacles[field]),to=v(p.x,0,p.z);stepAction={from,to,start:performance.now()};kid.root.rotation.y=heading;}
function refresh(){const rect=$('stage').getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();}
new ResizeObserver(refresh).observe($('stage'));
$('overview').onclick=overview;$('focus').onclick=()=>{focus();$('stage').scrollIntoView({block:'center',behavior:'smooth'});};$('movePerson').onclick=()=>{stepAction=null;movePerson();$('stage').scrollIntoView({block:'center',behavior:'smooth'});};$('resetField').onclick=()=>{stepAction=null;if(field!=='micro')movePerson();overview();};$('stepBack').onclick=()=>walkBy(-1);$('stepForward').onclick=()=>walkBy(1);
$('measureToggle').onclick=()=>{showMeasure=!showMeasure;$('measureToggle').setAttribute('aria-pressed',String(showMeasure));$('measureToggle').textContent=showMeasure?'寸法の線を表示中':'寸法の線を非表示';selectItem(selected);};
$('eyeView').onclick=()=>setPerspective('first');$('thirdView').onclick=()=>setPerspective('third');
switchField(Object.hasOwn(fieldItems,new URLSearchParams(location.search).get('field'))?new URLSearchParams(location.search).get('field'):'classroom');$('loading').hidden=true;refresh();
function frame(now){
 const dt=Math.min(.05,Math.max(0,(now-lastFrame)/1000));lastFrame=now;updateNavigation(dt);
 if(stepAction){const p=Math.min(1,(now-stepAction.start)/1300),t=p*p*(3-2*p),distance=stepAction.from.distanceTo(stepAction.to);kid.root.position.copy(stepAction.from).lerp(stepAction.to,t);kid.pose({...idle,walkDistance:t*distance,walkWeight:Math.sin(Math.PI*p)});if(p===1){stepAction=null;kid.pose(idle);updateWalkReading();}}
 heightMarker.position.copy(kid.root.position);
 if(viewMode==='third')target.copy(kid.root.position).add(v(0,.95,0));
 if(eyeMode){camera.position.copy(kid.root.position).add(v(0,1.18,0));camera.lookAt(camera.position.clone().add(v(-Math.sin(yaw)*Math.cos(pitch),-Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch))));}else{desired.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(radius).add(target);camera.position.copy(desired);camera.lookAt(target);}
 kid.root.visible=heightMarker.visible=field!=='micro'&&!eyeMode;renderer.render(scene,camera);requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
