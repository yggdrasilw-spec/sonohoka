import {Vector3,MathUtils} from './vendor/three.module.js';
import {interactionClips} from './models/interaction-clips.mjs';
const v=(...x)=>new Vector3(...x),clamp=x=>MathUtils.clamp(x,0,1),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export function sampleMotion(name,t){
 const frames=name.startsWith('step-')?interactionClips.step[name.slice(5)]:interactionClips[name];
 const f=clamp(t)*(frames.length-1),i=Math.min(Math.floor(f),frames.length-2);
 return frames[i].map((x,c)=>MathUtils.lerp(x,frames[i+1][c],f-i));
}
export function reachMotion(t){const [progress,arc,lean]=sampleMotion('reach',t);return {progress,arc:arc*.018,lean:lean*.10};}
export function liftMotion(t){const [progress,recovery]=sampleMotion('lift',t);return {progress,lean:.10*(1-recovery)};}
export const bathMotionLayout={home:v(-.88,0,.55),edge:v(-.87,0,-.12),seat:v(-.22,.136,-.12),rimTop:.6025};
// World-space contact targets. A small assisted lift during weight transfer
// avoids forcing a child's legs to span this high rim; this is simplified motion.
// Captured swing height and torso timing are warped to a 60 cm rim; this is
// obstacle adaptation of a step-over recording, not a recording of bathing.
function crossingFoot(u,side){
 const phase=clamp(u),swing=sampleMotion('step-'+side,phase),travel=smooth((phase-.22)/.56);
 const outside=side==='left'?-.727:-.96,inside=side==='left'?-.08:-.24;
 const clearance=smooth(phase/.22)*(1-smooth((phase-.78)/.22));
 return v(MathUtils.lerp(outside,inside,travel),MathUtils.lerp(.050,.186,travel)+.64*Math.max(clearance,swing[0]),-.06+.24*Math.sin(Math.PI*phase));
}
function rootAcross(q){
 const knots=[[0,-.87,0],[.18,-.82,-.04],[.45,-.54,.015],[.50,-.53,.015],[.60,-.43,.04],[.72,-.34,.10],[.85,-.28,.136],[1,-.22,.136]];
 const i=knots.findIndex((k,j)=>j<knots.length-1&&q<=knots[j+1][0]);
 const a=knots[Math.max(0,i)],b=knots[Math.max(0,i)+1],t=smooth((q-a[0])/(b[0]-a[0]));
 return v(MathUtils.lerp(a[1],b[1],t),MathUtils.lerp(a[2],b[2],t),-.12);
}
export function bathEntryMotion(progress){
 const p=clamp(progress),{home,edge,seat}=bathMotionLayout;
 const state={position:home.clone(),yaw:0,sit:0,lean:0,feet:null,hands:null,walkDistance:0,walkWeight:0,phase:'approach'};
 if(p<.20){
  const t=smooth(p/.20),direction=edge.clone().sub(home),heading=Math.atan2(direction.x,direction.z);
  state.position.lerp(edge,t);state.yaw=heading*smooth(p/.045);state.walkDistance=t*direction.length();state.walkWeight=smooth(Math.min(t,1-t)/.16);
 }else if(p<.26){
  state.position.copy(edge);state.yaw=MathUtils.lerp(Math.atan2(edge.x-home.x,edge.z-home.z),0,smooth((p-.20)/.06));
 }else if(p<.78){
  const q=(p-.26)/.52,left=clamp(q/.50),right=clamp((q-.50)/.50);
  state.phase='cross';state.position=rootAcross(q);state.yaw=0;
  state.feet={l:crossingFoot(left,'left'),r:crossingFoot(right,'right')};
  state.feet.r.y+=.165*smooth(q/.45)*(1-smooth((q-.50)/.14));
  state.lean=.65*Math.sin(Math.PI*q)+.035*sampleMotion(q<.5?'step-left':'step-right',q<.5?left:right)[1];
 }else{
  const q=(p-.78)/.22,[lower,lean]=sampleMotion('sit',q);
  state.phase='sit';state.position.copy(seat);state.yaw=Math.PI/2*lower;state.sit=lower;state.lean=lean*.20;
  state.feet={l:crossingFoot(1,'left').lerp(v(.17,.186,-.263),lower),r:crossingFoot(1,'right').lerp(v(.17,.186,.023),lower)};
 }
 // Transfer the supporting hand as the pelvis crosses the rim. These are
 // world-space wrist targets above the rim, blended in/out without snapping.
 if(p>=.20&&p<.88){
  const q=clamp((p-.26)/.52);
  state.hands={
   l:{position:v(-.465,.645,-.03),weight:smooth((q-.15)/.17)*(1-smooth((q-.48)/.14))},
   r:{position:v(-.465,.645,-.03),weight:smooth((q-.42)/.13)*(1-smooth((q-.64)/.16))}
  };
 }
 return state;
}

