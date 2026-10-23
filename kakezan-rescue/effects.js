'use strict';
// Original, short Web Audio cues: no downloads, and no sound before a gesture.
window.RescueEffects=(()=>{
 let enabled=true,context,bus;const active=new Set(),last=new Map();
 const scores={
  appear:[[0,540,860,.12,.07]],grab:[[0,330,610,.08,.055]],tap:[[0,760,510,.055,.045]],
  move:[[0,210,640,.22,.04]],rotate:[[0,240,720,.29,.045],[.09,360,940,.23,.025]],
  split:[[0,520,410,.10,.055],[.065,780,650,.13,.05]],
  land:[[0,260,135,.09,.07],[.025,1047,784,.13,.035]],
  finish:[[0,659,659,.16,.045],[.10,784,784,.17,.04],[.21,1047,1047,.27,.04]]
 };
 function synthesize(ctx,output,kind,index=0,track=false){
  const pitch=[523,587,659,784,880,1047,1175,1319,1568][Math.max(0,Math.min(8,index))];
  const score=kind==='count'?[[0,pitch*.72,pitch,.12,.065]]:scores[kind]||scores.tap;
  for(const [delay,from,to,duration,volume]of score){
   const oscillator=ctx.createOscillator(),envelope=ctx.createGain(),start=ctx.currentTime+delay;
   oscillator.type=kind==='move'||kind==='rotate'?'sine':'triangle';oscillator.frequency.setValueAtTime(from,start);oscillator.frequency.exponentialRampToValueAtTime(to,start+duration*.7);
   envelope.gain.setValueAtTime(.0001,start);envelope.gain.exponentialRampToValueAtTime(volume,start+.009);envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);
   oscillator.connect(envelope).connect(output);if(track)active.add(oscillator);
   oscillator.onended=()=>{active.delete(oscillator);oscillator.disconnect();envelope.disconnect()};oscillator.start(start);oscillator.stop(start+duration+.015);
  }
 }
 function cancel(){for(const source of active){try{source.stop()}catch{}}active.clear();last.clear()}
 function duck(){if(bus&&context){const now=context.currentTime;bus.gain.cancelScheduledValues(now);bus.gain.setTargetAtTime(document.body.classList.contains('speaking')?.24:.75,now,.025)}}
 new MutationObserver(duck).observe(document.body,{attributes:true,attributeFilter:['class']});
 function play(kind,index=0){
  if(!enabled||document.hidden)return;const now=performance.now();if(now-(last.get(kind)??-Infinity)<45)return;last.set(kind,now);
  try{if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;context=new Audio();bus=context.createGain();bus.connect(context.destination)}
   context.resume().catch(()=>{});duck();if(active.size>10)cancel();synthesize(context,bus,kind,index,true);
  }catch{/* An unavailable audio device must not interrupt the diagram. */}
 }
 function enable(value){enabled=value;if(!enabled)cancel();return enabled}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});window.addEventListener('pagehide',cancel);
 return {play,cancel,enable,get enabled(){return enabled},async renderOffline(kind,index=0){const ctx=new OfflineAudioContext(1,44100,44100);synthesize(ctx,ctx.destination,kind,index);return ctx.startRendering()}};
})();
