// Original mascot engine for かずの芽ラボ.
// Built specifically for the sprout-pencil learner. No legacy mascot geometry is used.
import { Spring, tween, wait, lerp, clamp, onFrame } from './core.js';

const NS = 'http://www.w3.org/2000/svg';
const INK = '#24304a';
const FACE = '#fffaf2';
const CREAM = '#fff2dd';

export const PALETTES = {
  blue:   { main:'#318fd8', light:'#bfe3f8', cheek:'#ffb8c2' },
  pink:   { main:'#ed78a8', light:'#ffd9e8', cheek:'#ffb8c2' },
  yellow: { main:'#e8ad2f', light:'#ffe9aa', cheek:'#ffb8c2' },
  mint:   { main:'#39b88a', light:'#ccefe5', cheek:'#ffb8c2' },
  violet: { main:'#8c72df', light:'#e3dcff', cheek:'#ffb8c2' },
  gold:   { main:'#e9aa22', light:'#ffe5a2', cheek:'#ffb8c2' },
  snow:   { main:'#6d9ed8', light:'#eef6ff', cheek:'#ffb8c2' },
  rainbow:{ main:'#478fe0', light:'#d8ebff', cheek:'#ffb8c2' },
};

// Fresh costume overlays sized to this character only.
export const COSTUMES = {
  cap: { head:'<path d="M-42 -148 Q0 -172 42 -148 L36 -132 Q0 -144 -36 -132Z" fill="#4f72df" stroke="#24304a" stroke-width="4"/><path d="M12 -142 Q44 -146 58 -134 Q34 -128 8 -133Z" fill="#3554b4" stroke="#24304a" stroke-width="4"/>' },
  hachimaki: { head:'<path d="M-47 -135 Q0 -145 47 -135 L46 -124 Q0 -134 -46 -124Z" fill="#fff" stroke="#24304a" stroke-width="4"/><circle cy="-134" r="6" fill="#ef5367"/><path d="M43 -131 Q62 -137 72 -128 M44 -126 Q60 -118 67 -108" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>' },
  cape: { back:'<path d="M-34 -63 Q-62 -43 -55 2 L55 2 Q62 -43 34 -63Z" fill="#ef5367" stroke="#24304a" stroke-width="4"/><path d="M-30 -61 Q0 -53 30 -61" fill="none" stroke="#ffd34d" stroke-width="5"/>' },
  crown: { head:'<path d="M-30 -150 L-36 -180 L-15 -163 L0 -188 L15 -163 L36 -180 L30 -150Z" fill="#ffd34d" stroke="#24304a" stroke-width="4"/><circle cy="-168" r="5" fill="#ef6ca9"/>' },
  glasses: { face:'<g fill="rgba(255,255,255,.25)" stroke="#24304a" stroke-width="4"><circle cx="-20" cy="-105" r="15"/><circle cx="20" cy="-105" r="15"/><path d="M-5 -105 H5 M-35 -106 l-10 -4 M35 -106 l10 -4" fill="none"/></g>' },
  ribbon: { head:'<path d="M0 -166 Q-20 -188 -38 -171 Q-42 -153 -12 -153Z M0 -166 Q20 -188 38 -171 Q42 -153 12 -153Z" fill="#ef6ca9" stroke="#24304a" stroke-width="4"/><circle cy="-163" r="7" fill="#ff9ac4" stroke="#24304a" stroke-width="3"/>' },
  headphones: { head:'<path d="M-47 -116 Q-47 -166 0 -166 Q47 -166 47 -116" fill="none" stroke="#745bd6" stroke-width="8"/><rect x="-55" y="-127" width="15" height="28" rx="7" fill="#8c72df" stroke="#24304a" stroke-width="3"/><rect x="40" y="-127" width="15" height="28" rx="7" fill="#8c72df" stroke="#24304a" stroke-width="3"/>' },
  wizard: { head:'<path d="M-44 -145 Q0 -157 44 -145 Q0 -135 -44 -145Z" fill="#5d49b8" stroke="#24304a" stroke-width="4"/><path d="M-28 -148 Q-12 -190 22 -211 Q15 -179 31 -148Z" fill="#765bdc" stroke="#24304a" stroke-width="4"/><path d="M4 -181 l4 8 h9 l-7 6 3 9 -9 -5 -9 5 3 -9 -7 -6 h9z" fill="#ffd34d"/>' },
};

const el=(name,attrs={},parent)=>{const n=document.createElementNS(NS,name);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);if(parent)parent.appendChild(n);return n;};
const path=(d,attrs={},parent)=>el('path',{d,...attrs},parent);
const circle=(cx,cy,r,attrs={},parent)=>el('circle',{cx,cy,r,...attrs},parent);

class PulseSpring extends Spring { constructor(v=0){super(v,160,10);} }

function leafPath(side){
  const s=side<0?-1:1;
  return `M0 -164 C${s*8} -190 ${s*30} -202 ${s*48} -188 C${s*47} -166 ${s*27} -151 ${s*8} -151 C${s*1} -151 ${s*-2} -157 0 -164Z`;
}
function packMarkup(p){return `
  <path d="M27 -68 Q48 -72 55 -57 L55 -22 Q46 -14 32 -18 L27 -55Z" fill="#eef6ff" stroke="${INK}" stroke-width="4"/>
  <path d="M34 -58 Q46 -61 50 -52 L50 -27" fill="none" stroke="#9ab9d8" stroke-width="3" stroke-linecap="round"/>
  <path d="M38 -49 H49 M38 -41 H49" fill="none" stroke="#b6cae0" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M26 -63 Q35 -57 34 -45" fill="none" stroke="${p.main}" stroke-width="5" stroke-linecap="round"/>
`; }
function bodyMarkup(p){return `
  <path d="M-38 -76 Q-29 -65 -29 -49 Q-29 -37 -33 -28 Q-36 -13 -18 -7 Q0 -2 18 -7 Q36 -13 33 -28 Q29 -37 29 -49 Q29 -65 38 -76 Q20 -67 0 -69 Q-20 -67 -38 -76Z" fill="${FACE}" stroke="${INK}" stroke-width="4"/>
  <path d="M-31 -70 Q0 -58 31 -70 L27 -56 Q0 -48 -27 -56Z" fill="${p.main}" stroke="${INK}" stroke-width="4"/>
  <path d="M0 -65 l4 8 h9 l-7 6 3 9 -9 -5 -9 5 3 -9 -7 -6 h9z" fill="#ffd34d" stroke="${INK}" stroke-width="2.8"/>
  <circle cx="-15" cy="-31" r="7.5" fill="#f1c23a"/><path d="M1 -39 L13 -24 L-11 -24Z" fill="#87c45b"/><rect x="17" y="-39" width="14" height="15" rx="3" fill="#ef8395"/>
`}
function headMarkup(p){return `
  <path d="M0 -177 Q33 -168 51 -138 Q64 -116 56 -89 Q48 -62 22 -49 Q10 -43 0 -40 Q-10 -43 -22 -49 Q-48 -62 -56 -89 Q-64 -116 -51 -138 Q-33 -168 0 -177Z" fill="${FACE}" stroke="${INK}" stroke-width="4.5"/>
  <path d="M-18 -160 Q0 -173 18 -160 Q16 -148 0 -145 Q-16 -148 -18 -160Z" fill="${p.main}"/>
  <path d="M-20 -151 Q0 -159 20 -151" fill="none" stroke="#ead7ba" stroke-width="3" stroke-linecap="round"/>
`}
function eyeMarkup(kind,p){
  if(kind==='happy')return '<path d="M-8 2 Q0 -8 8 2" fill="none" stroke="#24304a" stroke-width="4" stroke-linecap="round"/>';
  if(kind==='closed')return '<path d="M-8 -1 Q0 6 8 -1" fill="none" stroke="#24304a" stroke-width="4" stroke-linecap="round"/>';
  if(kind==='star')return '<path d="M0 -10 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="#ffd34d" stroke="#24304a" stroke-width="2.5"/>';
  if(kind==='tight')return '<path d="M-7 -5 L6 0 L-7 5" fill="none" stroke="#24304a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
  if(kind==='wide')return `<circle r="11" fill="#fff" stroke="#24304a" stroke-width="3"/><circle class="iris" r="5" fill="${p.main}"/>`;
  return `<ellipse rx="8" ry="10" fill="#263044"/><circle cx="-2" cy="-3" r="2.5" fill="#fff"/>`;
}
function mouthMarkup(kind){
  if(kind==='o')return '<ellipse rx="4.5" ry="6" fill="#7e2946"/>';
  if(kind==='wobble')return '<path d="M-10 1 L-6 -3 L-2 2 L2 -3 L6 2 L10 -2" fill="none" stroke="#24304a" stroke-width="3" stroke-linecap="round"/>';
  if(kind==='big'||kind==='grin')return '<path d="M-11 -3 Q0 1 11 -3 Q9 13 0 14 Q-9 13 -11 -3Z" fill="#8b294d" stroke="#24304a" stroke-width="3"/><path d="M-5 9 Q0 5 5 9 Q2 13 0 13 Q-2 13 -5 9Z" fill="#ff8aaa"/>';
  if(kind==='cat')return '<path d="M-9 -1 Q-4 5 0 0 Q4 5 9 -1" fill="none" stroke="#24304a" stroke-width="3" stroke-linecap="round"/>';
  return '<path d="M-8 -1 Q0 6 8 -1" fill="none" stroke="#24304a" stroke-width="3" stroke-linecap="round"/>';
}

export class KazunomeMascot {
  constructor(layer,{scale=.7,palette='blue',front}={}){
    this.layer=layer;this.front=front||layer;this.S=scale;this.palName=palette;this.pal=PALETTES[palette]||PALETTES.blue;
    this.x=0;this.y=0;this.home={x:0,y:0};this.ground=0;this.lift=0;this.rot=0;this.shake=0;this.bob=0;this.visible=true;this.opacity=1;
    this.leafL=new PulseSpring(0);this.leafR=new PulseSpring(0);this.sq=new PulseSpring(1);this.sq.target=1;
    this.look={x:0,y:0};this.lookTarget={x:0,y:0};this.token=0;this.costume=null;this.baseEyes='open';this.baseMouth='smile';
    this.hands=[{side:-1,mode:'rest',x:0,y:0,job:0,raise:0},{side:1,mode:'rest',x:0,y:0,job:0,raise:0}];
    this.build();
  }
  build(){
    this.root=el('g',{class:'km'},this.layer);this.shadow=el('ellipse',{rx:38,ry:7,fill:INK,opacity:.13},this.root);this.bodyG=el('g',{},this.root);
    this.backG=el('g',{},this.bodyG);this.packG=el('g',{},this.bodyG);this.packG.innerHTML=packMarkup(this.pal);
    this.feet=[-1,1].map(s=>{const g=el('g',{},this.bodyG);path('M-18 -18 Q-33 -16 -36 -7 Q-37 1 -24 3 Q-9 4 -4 -8 Q-2 -16 -18 -18Z',{fill:this.pal.main,stroke:INK,'stroke-width':4,transform:s>0?'scale(-1 1)':''},g);return g;});
    const bg=el('g',{},this.bodyG);bg.innerHTML=bodyMarkup(this.pal);
    this.headG=el('g',{},this.bodyG);
    this.leaves=[-1,1].map(s=>{const g=el('g',{},this.headG);path(leafPath(s),{fill:'#9ccd63',stroke:INK,'stroke-width':4},g);return {g,s};});
    const hg=el('g',{},this.headG);hg.innerHTML=headMarkup(this.pal);
    this.faceG=el('g',{},this.headG);
    this.cheeks=[-1,1].map(s=>el('ellipse',{cx:s*29,cy:-88,rx:5.5,ry:4.2,fill:this.pal.cheek},this.faceG));
    this.eyeGs=[-1,1].map(s=>el('g',{transform:`translate(${s*20} -105)`},this.faceG));
    this.mouthG=el('g',{transform:'translate(0 -88)'},this.faceG);
    this.sweat=path('M0 -12 Q6 -2 0 2 Q-6 -2 0 -12Z',{fill:'#76c8ff',stroke:INK,'stroke-width':3,opacity:0},this.faceG);
    this.faceWear=el('g',{},this.headG);this.headWear=el('g',{},this.headG);
    this.armsFront=el('g',{class:'km-arms'},this.front);
    this.arms=this.hands.map(()=>({out:path('',{fill:'none',stroke:INK,'stroke-width':16,'stroke-linecap':'round'},this.armsFront),inn:path('',{fill:'none',stroke:this.pal.main,'stroke-width':9,'stroke-linecap':'round'},this.armsFront),hand:circle(0,0,10.5,{fill:this.pal.main,stroke:INK,'stroke-width':3},this.armsFront),digit:el('text',{'text-anchor':'middle','dominant-baseline':'central',fill:INK,'font-size':18,'font-weight':900},this.armsFront)}));
    this.setFace(this.baseEyes,this.baseMouth,true);this.setCostume(this.costume);
  }
  rebuild(){const vis=this.visible,front=this.front;this.root.remove();this.armsFront.remove();this.front=front;this.build();this.visible=vis;}
  setPalette(name){if(!PALETTES[name]||name===this.palName)return;this.palName=name;this.pal=PALETTES[name];this.rebuild();}
  setCostume(id){this.costume=id&&COSTUMES[id]?id:null;const c=this.costume?COSTUMES[this.costume]:{};this.backG.innerHTML=c.back||'';this.headWear.innerHTML=c.head||'';this.faceWear.innerHTML=c.face||'';}
  setFace(eyes='open',mouth='smile',base=false){this.eyeKind=eyes;this.mouthKind=mouth;this.eyeGs.forEach((g,i)=>{let k=eyes;if(eyes==='wink')k=i?'happy':'open';g.innerHTML=eyeMarkup(k,this.pal);});this.mouthG.innerHTML=mouthMarkup(mouth);if(base){this.baseEyes=eyes;this.baseMouth=mouth;}}
  resetFace(){this.setFace(this.baseEyes,this.baseMouth);this.sweat.setAttribute('opacity',0);}
  place(x,y){this.x=x;this.y=y;this.home={x,y};this.ground=y;}
  get headCenter(){return {x:this.x,y:this.y-this.lift-107*this.S};}
  toScreen(lx,ly){return {x:this.x+lx*this.S,y:this.y-this.lift+ly*this.S};}
  shoulder(side){return this.toScreen(side*30,-58);}
  restHand(side,h){return this.toScreen(side*(42+h.raise*28),-39-h.raise*100);}
  update(dt,t){
    this.leafL.step(dt);this.leafR.step(dt);this.sq.step(dt);
    this.look.x=lerp(this.look.x,this.lookTarget.x,Math.min(1,dt*8));this.look.y=lerp(this.look.y,this.lookTarget.y,Math.min(1,dt*8));
    const shakeX=this.shake?Math.sin(t/25)*this.shake:0;const breath=1+Math.sin(t/520)*.012;const sy=clamp(this.sq.value,.78,1.22)*breath;const sx=1/Math.sqrt(sy);
    const bx=this.x+shakeX,by=this.y-this.lift;this.root.style.display=this.visible?'':'none';this.armsFront.style.display=this.visible?'':'none';this.root.setAttribute('opacity',this.opacity);this.armsFront.setAttribute('opacity',this.opacity);
    this.shadow.setAttribute('transform',`translate(${bx} ${this.ground+2}) scale(${this.S*(1-this.lift/500)} ${this.S})`);
    this.bodyG.setAttribute('transform',`translate(${bx} ${by}) rotate(${this.rot}) scale(${this.S*sx} ${this.S*sy})`);
    this.leaves.forEach(({g,s})=>{const a=s<0?-this.leafL.value:this.leafR.value;g.setAttribute('transform',`rotate(${a} 0 -164)`);});
    this.eyeGs.forEach((g,i)=>{const s=i?1:-1;g.setAttribute('transform',`translate(${s*20+this.look.x*2} ${-105+this.look.y*2})`);});
    this.hands.forEach((h,i)=>{const a=this.arms[i],sh=this.shoulder(h.side);const target=h.mode==='free'?{x:h.x,y:h.y}:this.restHand(h.side,h);const mx=(sh.x+target.x)/2+h.side*8,my=Math.min(sh.y,target.y)-8;const d=`M${sh.x} ${sh.y} Q${mx} ${my} ${target.x} ${target.y}`;a.out.setAttribute('d',d);a.inn.setAttribute('d',d);a.hand.setAttribute('cx',target.x);a.hand.setAttribute('cy',target.y);a.digit.setAttribute('x',target.x);a.digit.setAttribute('y',target.y);a.digit.textContent=h.carry||'';});
  }
  lookAt(pt){const h=this.headCenter;this.lookTarget={x:clamp((pt.x-h.x)/80,-1,1),y:clamp((pt.y-h.y)/80,-1,1)};}
  begin(){this.token+=1;const k=this.token;return()=>k===this.token;}
  async hop(height=30,dur=360,{spin=0,to=null,audio}={}){const ok=this.begin();const sx=this.x,sy=this.y,tx=to?.x??sx,ty=to?.y??sy;audio?.play?.('jump',audio.now?.()||0,{v:.06});await tween(dur,k=>{if(!ok())return;this.x=lerp(sx,tx,k);this.y=lerp(sy,ty,k);this.lift=Math.sin(k*Math.PI)*height;this.rot=spin*k;});if(!ok())return false;this.x=tx;this.y=ty;this.lift=0;this.rot=0;return true;}
  async leapTo(pt,height=80,opt={}){return this.hop(height,520,{...opt,to:pt});}
  async point(pt,hold=900){const h=this.hands[pt.x>=this.x?1:0];h.mode='free';h.job=1;h.x=pt.x;h.y=pt.y;this.lookAt(pt);await wait(hold);if(h.job===1){h.mode='rest';h.job=0;}return true;}
  async clap(times=3){const ok=this.begin();for(let i=0;i<times&&ok();i++){this.hands.forEach((h,j)=>{h.mode='free';h.job=1;h.x=this.x+(j?6:-6);h.y=this.y-70*this.S;});await wait(100);this.hands.forEach(h=>{h.mode='rest';h.job=0;});await wait(90);}return ok();}
  async celebrate(E=0.5,{big=false,audio,variant}={}){this.setFace('happy',big?'big':'grin');this.leafL.kick(-10-14*E);this.leafR.kick(10+14*E);if(variant==='leafflap'){for(let i=0;i<3;i++){this.leafL.kick(i%2?-22:22);this.leafR.kick(i%2?22:-22);await wait(90);}}else if(variant==='clapjump'){await Promise.all([this.clap(2),this.hop(24+24*E,380,{audio})]);}else await this.hop(16+34*E,big?520:340,{spin:variant==='spinjump'?360:0,audio});this.resetFace();return true;}
  async hurt(){// Kept for game mode API compatibility; visually reads as surprise, not injury.
    this.setFace('wide','o');this.sq.kick(.82);this.leafL.kick(-18);this.leafR.kick(18);await wait(420);this.resetFace();return true;
  }
  async reachPose(on){this.hands.forEach((h,i)=>{h.raise=on?1:0;h.job=on?1:0;});if(on)this.setFace('happy','smile');else this.resetFace();await wait(120);}
  async swipe(pt){const h=this.hands[pt.x>=this.x?1:0];h.mode='free';h.job=1;const y=pt.y;h.x=pt.x-28;h.y=y;await tween(260,k=>{h.x=lerp(pt.x-28,pt.x+28,k);});h.mode='rest';h.job=0;}
  async carry(from,to,digit,{onGrab,onPlace}={}){const h=this.hands[to.x>=this.x?1:0];h.mode='free';h.job=1;h.x=from.x;h.y=from.y;h.carry=String(digit??'');onGrab?.();await tween(420,k=>{h.x=lerp(from.x,to.x,k);h.y=lerp(from.y,to.y,k)-Math.sin(k*Math.PI)*30;});onPlace?.();h.carry=null;h.mode='rest';h.job=0;return true;}
  destroy(){this.root.remove();this.armsFront.remove();}
}

function staticSvg(palette='blue',costume=null,cheer=false){
  const p=PALETTES[palette]||PALETTES.blue,c=COSTUMES[costume]||{};
  const eyes=cheer?eyeMarkup('happy',p):eyeMarkup('open',p), mouth=mouthMarkup(cheer?'grin':'smile');
  const arms=cheer?'<path d="M-28 -55 Q-55 -85 -62 -126 M28 -55 Q55 -85 62 -126" fill="none" stroke="#24304a" stroke-width="14" stroke-linecap="round"/><path d="M-28 -55 Q-55 -85 -62 -126 M28 -55 Q55 -85 62 -126" fill="none" stroke="'+p.main+'" stroke-width="8" stroke-linecap="round"/><circle cx="-62" cy="-126" r="9" fill="'+p.main+'" stroke="#24304a" stroke-width="3"/><circle cx="62" cy="-126" r="9" fill="'+p.main+'" stroke="#24304a" stroke-width="3"/>':'<circle cx="-42" cy="-39" r="9" fill="'+p.main+'" stroke="#24304a" stroke-width="3"/><circle cx="42" cy="-39" r="9" fill="'+p.main+'" stroke="#24304a" stroke-width="3"/>';
  return `<svg xmlns="${NS}" viewBox="-86 -214 172 220">${c.back||''}${packMarkup(p)}<path d="M-18 -18 Q-33 -16 -36 -7 Q-37 1 -24 3 Q-9 4 -4 -8 Q-2 -16 -18 -18Z" fill="${p.main}" stroke="${INK}" stroke-width="4"/><path d="M18 -18 Q33 -16 36 -7 Q37 1 24 3 Q9 4 4 -8 Q2 -16 18 -18Z" fill="${p.main}" stroke="${INK}" stroke-width="4"/><g>${bodyMarkup(p)}</g><path d="${leafPath(-1)}" fill="#9ccd63" stroke="${INK}" stroke-width="4"/><path d="${leafPath(1)}" fill="#9ccd63" stroke="${INK}" stroke-width="4"/><g>${headMarkup(p)}</g><ellipse cx="-29" cy="-88" rx="5.5" ry="4.2" fill="${p.cheek}"/><ellipse cx="29" cy="-88" rx="5.5" ry="4.2" fill="${p.cheek}"/><g transform="translate(-20 -105)">${eyes}</g><g transform="translate(20 -105)">${eyes}</g><g transform="translate(0 -88)">${mouth}</g>${arms}${c.face||''}${c.head||''}</svg>`;
}
export function mascotSVG(palette='blue',costume=null){return staticSvg(palette,costume,false);}
export function mascotSprite(palette='blue',size=128){const img=new Image();const svg=staticSvg(palette,null,true);img.width=size;img.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;return img;}
export function startActors(list,getCtx){return onFrame((dt,t)=>{const ctx=getCtx?.()||{};for(const a of list)a.update(dt,t,ctx);});}
