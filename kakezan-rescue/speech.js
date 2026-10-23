'use strict';
// Short spoken thoughts, not a mechanical reading of the whole screen.
window.RescueVoice=(()=>{
 const synth=window.speechSynthesis;let enabled=true,epoch=0,current=null,queue=[],pauseTimer=null;
 const digit=['れい','いち','に','さん','よん','ご','ろく','なな','はち','きゅう'];
 function number(n){if(n<10)return digit[n];return (n<20?'じゅう':digit[Math.floor(n/10)]+'じゅう')+(n%10?digit[n%10]:'')}
 function pieces(n){return ({1:'いっこ',6:'ろっこ',8:'はっこ',10:'じゅっこ'})[n]||number(n)+'こ'}
 function groups(n){return ['れいこ','ひとつ','ふたつ','みっつ','よっつ','いつつ','むっつ','ななつ','やっつ','ここのつ','とお'][n]||number(n)+'こ'}
 function cancel(){epoch++;clearTimeout(pauseTimer);pauseTimer=null;queue=[];current=null;synth?.cancel();document.body.classList.remove('speaking')}
 function next(){
  if(!enabled||current||pauseTimer!==null||!queue.length||!synth)return;
  const item=queue.shift(),token=epoch;
  const start=()=>{if(token!==epoch||!enabled)return;
  const {text,mark,onstart,onend,onerror}=item,u=new SpeechSynthesisUtterance(text),voices=synth.getVoices().filter(v=>v.lang.toLowerCase().startsWith('ja'));
  const chosen=voices.find(v=>/Nanami|Haruka|Kyoko|O-Ren/i.test(v.name))||voices[0];if(chosen)u.voice=chosen;
  u.lang='ja-JP';u.rate=.86;u.pitch=1.08;current=u;
  u.onstart=()=>{if(token===epoch){document.body.classList.add('speaking');document.body.dataset.speech=mark;onstart?.()}};
  const finish=()=>{if(token!==epoch)return;current=null;document.body.classList.remove('speaking');onend?.();if(token===epoch)next()};
  u.onend=finish;u.onerror=e=>{if(token!==epoch)return;if(!['canceled','interrupted'].includes(e.error))document.getElementById('speechStatus').textContent='こえが でないときは、ふきだしを よんでね。';onerror?.(e);finish()};
  try{synth.speak(u)}catch(e){u.onerror({error:'synthesis-failed'})}
  };
  if(item.pauseBefore>0)pauseTimer=setTimeout(()=>{pauseTimer=null;start()},item.pauseBefore);else start();
 }
 function sequence(items,{append=false}={}){if(!append)cancel();if(!enabled)return false;if(!synth){document.getElementById('speechStatus').textContent='この ブラウザーでは こえが でないよ。';return false}queue.push(...items);next();return true}
 function say(text,{append=false,mark='guide',...callbacks}={}){return sequence([{text,mark,...callbacks}],{append})}
 function enable(value){enabled=value;cancel();return enabled}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});window.addEventListener('pagehide',cancel);
 return {number,pieces,groups,say,sequence,cancel,enable,get enabled(){return enabled}};
})();
