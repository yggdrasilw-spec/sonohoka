
const scenes = [
  [0.000,'media/tokei-song/img/01.webp'],[1.915,'media/tokei-song/img/02.webp'],[5.346,'media/tokei-song/img/03.webp'],[8.537,'media/tokei-song/img/04.webp'],
  [11.011,'media/tokei-song/img/05.webp'],[15.798,'media/tokei-song/img/06.webp'],[18.830,'media/tokei-song/img/07.webp'],[20.824,'media/tokei-song/img/08.webp'],
  [23.298,'media/tokei-song/img/09.webp'],[27.926,'media/tokei-song/img/10.webp'],[33.112,'media/tokei-song/img/11.webp'],[35.186,'media/tokei-song/img/12.webp'],
  [37.420,'media/tokei-song/img/13.webp'],[40.053,'media/tokei-song/img/14.webp'],[44.761,'media/tokei-song/img/15.webp'],[47.394,'media/tokei-song/img/16.webp'],
  [49.468,'media/tokei-song/img/17.webp'],[52.819,'media/tokei-song/img/18.webp'],[54.973,'media/tokei-song/img/19.webp'],[57.287,'media/tokei-song/img/20.webp'],
  [62.473,'media/tokei-song/img/21.webp'],[63.750,'media/tokei-song/img/22.webp'],[64.707,'media/tokei-song/img/23.webp'],[67.181,'media/tokei-song/img/24.webp'],
  [69.654,'media/tokei-song/img/25.webp'],[72.207,'media/tokei-song/img/26.webp'],[74.521,'media/tokei-song/img/27.webp'],[76.037,'media/tokei-song/img/28.webp'],
  [83.777,'media/tokei-song/img/29.webp'],[93.830,'media/tokei-song/img/30.webp'],[98.936,'media/tokei-song/img/31.webp'],[107.394,'media/tokei-song/img/32.webp'],
  [116.569,'media/tokei-song/img/33.webp'],[121.356,'media/tokei-song/img/34.webp'],[126.223,'media/tokei-song/img/35.webp'],[133.404,'media/tokei-song/img/36.webp'],
  [138.271,'media/tokei-song/img/37.webp'],[143.138,'media/tokei-song/img/38.webp'],[148.085,'media/tokei-song/img/39.webp'],[153.511,'media/tokei-song/img/40.webp']
];

const audio = document.getElementById('audio');
const stage = document.getElementById('stage');
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const playBtn = document.getElementById('playBtn');
const timeline = document.getElementById('timeline');
const timeLabel = document.getElementById('time');
const ui = document.getElementById('ui');
const badge = document.getElementById('sceneBadge');
const hint = document.getElementById('hint');
const layers = [document.getElementById('layerA'), document.getElementById('layerB')];
const imgs = [document.getElementById('imgA'), document.getElementById('imgB')];
let activeLayer = 0;
let sceneIndex = 0;
let raf = 0;
let uiTimer = 0;
let scrubbing = false;

// 全画像を先読み
for (const [,src] of scenes){ const im = new Image(); im.src = src; }

function fmt(sec){
  if(!isFinite(sec)) return '0:00';
  const m=Math.floor(sec/60), s=Math.floor(sec%60);
  return `${m}:${String(s).padStart(2,'0')}`;
}

function findScene(t){
  let lo=0, hi=scenes.length-1;
  while(lo<=hi){const mid=(lo+hi)>>1;if(scenes[mid][0]<=t)lo=mid+1;else hi=mid-1;}
  return Math.max(0,hi);
}

function setScene(idx, force=false){
  if(idx===sceneIndex && !force) return;
  sceneIndex=idx;
  const next=1-activeLayer;
  imgs[next].src=scenes[idx][1];
  layers[next].classList.add('active');
  layers[activeLayer].classList.remove('active');
  activeLayer=next;
  badge.textContent=`${String(idx+1).padStart(2,'0')} / ${scenes.length}`;
}

function motion(t){
  const start=scenes[sceneIndex][0];
  const end=sceneIndex<scenes.length-1?scenes[sceneIndex+1][0]:(audio.duration||171.92);
  const p=Math.max(0,Math.min(1,(t-start)/Math.max(.01,end-start)));
  const dir=(sceneIndex%4);
  const scale=1+0.025*p;
  let x=0,y=0;
  if(dir===0)x=-0.6+1.2*p;
  if(dir===1)x=0.6-1.2*p;
  if(dir===2)y=-0.35+0.7*p;
  if(dir===3)y=0.35-0.7*p;
  imgs[activeLayer].style.transform=`translate(${x}%,${y}%) scale(${scale})`;
}

function sync(){
  const t=audio.currentTime||0;
  const idx=findScene(t);
  if(idx!==sceneIndex) setScene(idx);
  motion(t);
  if(!scrubbing) timeline.value=t;
  timeLabel.textContent=`${fmt(t)} / ${fmt(audio.duration||171.92)}`;
  playBtn.textContent=audio.paused?'▶':'❚❚';
  if(!audio.paused) raf=requestAnimationFrame(sync);
}

async function togglePlay(){
  startOverlay.classList.add('hidden');
  if(audio.paused){
    try{await audio.play(); showUI(false); cancelAnimationFrame(raf); sync();}
    catch(e){startOverlay.classList.remove('hidden');}
  }else{audio.pause(); cancelAnimationFrame(raf); sync(); showUI(true);}
}

function showUI(sticky=false){
  ui.classList.remove('hidden');
  clearTimeout(uiTimer);
  if(!sticky && !audio.paused){uiTimer=setTimeout(()=>ui.classList.add('hidden'),2200);}
}

startBtn.addEventListener('click',e=>{e.stopPropagation();togglePlay();});
playBtn.addEventListener('click',e=>{e.stopPropagation();togglePlay();});
stage.addEventListener('click',e=>{
  if(e.target.closest('#ui')||e.target.closest('#startOverlay')) return;
  togglePlay();
});
stage.addEventListener('mousemove',()=>showUI(false));
stage.addEventListener('touchstart',()=>showUI(false),{passive:true});

['pointerdown','touchstart'].forEach(ev=>timeline.addEventListener(ev,()=>{scrubbing=true;showUI(true)}));
timeline.addEventListener('input',()=>{
  const t=Number(timeline.value); audio.currentTime=t; setScene(findScene(t),true); motion(t); timeLabel.textContent=`${fmt(t)} / ${fmt(audio.duration||171.92)}`;
});
['change','pointerup','touchend'].forEach(ev=>timeline.addEventListener(ev,()=>{scrubbing=false;showUI(false);if(!audio.paused){cancelAnimationFrame(raf);sync();}}));

audio.addEventListener('loadedmetadata',()=>{timeline.max=audio.duration;timeLabel.textContent=`0:00 / ${fmt(audio.duration)}`;});
audio.addEventListener('play',()=>{cancelAnimationFrame(raf);sync();});
audio.addEventListener('pause',()=>{cancelAnimationFrame(raf);sync();});
audio.addEventListener('seeked',()=>{setScene(findScene(audio.currentTime),true);sync();});
audio.addEventListener('ended',()=>{showUI(true);playBtn.textContent='▶';});

document.addEventListener('keydown',e=>{
  if(e.code==='Space'){e.preventDefault();togglePlay();}
  else if(e.key==='ArrowRight'){audio.currentTime=Math.min(audio.duration||171.92,audio.currentTime+5);}
  else if(e.key==='ArrowLeft'){audio.currentTime=Math.max(0,audio.currentTime-5);}
  else if(e.key.toLowerCase()==='f'){
    if(!document.fullscreenElement) stage.requestFullscreen?.(); else document.exitFullscreen?.();
  }
  else if(e.key.toLowerCase()==='d'){document.body.classList.toggle('debug');}
});

// 3秒だけ操作ヒント
setTimeout(()=>hint.classList.add('show'),500);
setTimeout(()=>hint.classList.remove('show'),3500);
setScene(0,true); sync(); showUI(true);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && window.parent !== window) {
    window.parent.postMessage({type:'tokei-song-close'}, '*');
  }
});
window.addEventListener('pagehide', () => audio.pause());