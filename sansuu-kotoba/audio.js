'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const synth=window.speechSynthesis;
  const supported=!!synth&&typeof window.SpeechSynthesisUtterance==='function';
  if(supported)synth.getVoices();
  const hasEffects=!!(window.AudioContext||window.webkitAudioContext);
  let effects=hasEffects,voice=supported,context=null,current=null,finishSpeech=null,watchdog=null,speaking=false,unlocked=false;
  const sources=new Set();
  function status(text){$('audio-status').textContent=text;}
  function activate(){
    unlocked=true;
    try{const Audio=window.AudioContext||window.webkitAudioContext;if(!context&&Audio)context=new Audio();if(context?.state==='suspended')context.resume().catch(()=>{});}catch{status('効果音を使えない端末です');}
  }
  function stopEffects(){for(const source of sources){try{source.stop();}catch{}}sources.clear();}
  function cancelSpeech(){
    clearTimeout(watchdog);watchdog=null;
    const finish=finishSpeech;finishSpeech=null;current=null;speaking=false;
    if(supported)synth.cancel();
    finish?.();
    document.querySelectorAll('.is-reading').forEach(el=>el.classList.remove('is-reading'));
  }
  function cancel(){cancelSpeech();stopEffects();status(!supported?'声は使えません。文字で たしかめよう':voice?'声と 効果音を 使えるよ':'「よむ」で 声をきけるよ');}
  function speak(text,target=null){
    cancelSpeech();
    if(!voice||!unlocked||!supported||!text)return Promise.resolve();
    const utterance=new SpeechSynthesisUtterance(reading(text));current=utterance;
    utterance.lang='ja-JP';utterance.rate=.88;utterance.pitch=1.08;utterance.volume=1;
    const voices=synth.getVoices().filter(v=>/^ja(?:-|_)/i.test(v.lang));
    const japanese=voices.find(v=>v.localService)||voices[0];if(japanese)utterance.voice=japanese;
    speaking=true;target?.classList.add('is-reading');status('声を きいてみよう');
    return new Promise(resolve=>{
      let finished=false;
      const finish=()=>{if(finished)return;finished=true;target?.classList.remove('is-reading');if(current===utterance){clearTimeout(watchdog);watchdog=null;current=null;finishSpeech=null;speaking=false;}resolve();};
      finishSpeech=finish;
      utterance.onend=()=>{if(current===utterance)status('もう一度 きくときは「よむ」');finish();};
      utterance.onerror=()=>{if(current===utterance)status('声を出せませんでした。「よむ」で ためしてね');finish();};
      // Some speech engines never report an end/error. Do not trap playback.
      watchdog=setTimeout(()=>{if(current===utterance){status('声を待たずに つづけるよ');cancelSpeech();}},Math.min(45000,Math.max(8000,utterance.text.length*280)));
      try{synth.speak(utterance);}catch{status('この端末では 声を出せません');finish();}
    });
  }
  function reading(text){
    const digits=['ぜろ','いち','に','さん','よん','ご','ろく','なな','はち','きゅう'];
    const number=n=>n<10?digits[n]:n<100?(n>=20?digits[Math.floor(n/10)]:'')+'じゅう'+(n%10?digits[n%10]:''):String(n);
    return String(text).replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xfee0))
      .replace(/(\d+)こ/g,(_,n)=>{const value=Number(n),last=value%10;if([1,6,8].includes(last))return (value>last?number(value-last):'')+({1:'いっこ',6:'ろっこ',8:'はっこ'}[last]);if(last===0)return number(value).replace(/じゅう$/,'じゅっ')+'こ';return number(value)+'こ';})
      .replace(/引かれる/g,'ひかれる').replace(/引く/g,'ひく').replace(/数/g,'かず').replace(/人/g,'ひと').replace(/×/g,' かける ').replace(/[−－]/g,' ひく ').replace(/[＋+]/g,' たす ').replace(/÷/g,' わる ').replace(/[＝=]/g,' は ').replace(/→/g,' から ').replace(/\d+/g,n=>number(Number(n)));
  }
  function track(source){sources.add(source);source.onended=()=>{sources.delete(source);source.disconnect();};}
  function tone(frequency,start,duration,type='sine',end=frequency){
    const osc=context.createOscillator(),gain=context.createGain(),at=context.currentTime+start;
    osc.type=type;osc.frequency.setValueAtTime(frequency,at);osc.frequency.exponentialRampToValueAtTime(Math.max(30,end),at+duration);
    const volume=speaking?.025:.075;
    gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(volume,at+.015);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    osc.connect(gain);gain.connect(context.destination);track(osc);osc.addEventListener('ended',()=>gain.disconnect(),{once:true});osc.start(at);osc.stop(at+duration+.02);
  }
  function noise(duration,frequency){
    const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*duration),context.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
    source.buffer=buffer;filter.type='bandpass';filter.frequency.value=frequency;gain.gain.value=speaking?.035:.10;
    source.connect(filter);filter.connect(gain);gain.connect(context.destination);track(source);source.addEventListener('ended',()=>{filter.disconnect();gain.disconnect();},{once:true});source.start();
  }
  function play(kind){
    if(!unlocked||!effects||!context||context.state!=='running')return;
    try{
      if(kind==='multiply'){noise(.32,1700);tone(620,.03,.18,'sine',280);}
      else if(kind==='divide'){noise(.15,650);tone(170,0,.14,'sine',60);}
      else if(kind==='subtract')tone(370,0,.25,'triangle',180);
      else if(kind==='add'){noise(.38,650);tone(340,0,.25,'sine',460);}
      else if(kind==='push')tone(200,0,.18,'triangle',95);
      else if(kind==='transform'){[440,554,659,880].forEach((n,i)=>tone(n,i*.08,.25));}
      else if(kind==='correct'){[523,659,784].forEach((n,i)=>tone(n,i*.1,.25));}
      else if(kind==='hint'){tone(440,0,.18);tone(523,.13,.22);}
      else if(kind==='retry')tone(330,0,.18,'sine',300);
      else tone(520,0,.10);
    }catch{status('効果音を再生できませんでした');}
  }
  function update(){
    $('effects-toggle').setAttribute('aria-pressed',String(effects));$('effects-toggle').textContent=`♪ 効果音：${effects?'入':'切'}`;
    $('voice-toggle').setAttribute('aria-pressed',String(voice));$('voice-toggle').textContent=`声：${voice?'入':'切'}`;
  }
  $('effects-toggle').addEventListener('click',()=>{activate();effects=!effects;if(!effects)stopEffects();else play('tap');update();status(effects?'効果音を つけたよ':'効果音を とめたよ');});
  $('voice-toggle').addEventListener('click',()=>{activate();voice=!voice;cancelSpeech();update();status(voice?'声を つけたよ':'声を とめたよ');});
  $('read-aloud').addEventListener('click',()=>{activate();if(!supported)return;voice=true;update();document.dispatchEvent(new Event('lesson-read'));});
  $('audio-stop').addEventListener('click',()=>{cancel();document.dispatchEvent(new Event('lesson-audio-stop'));});
  document.addEventListener('pointerdown',activate,{once:true,capture:true});
  document.addEventListener('keydown',activate,{once:true,capture:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  window.addEventListener('pagehide',cancel);
  if(!supported){$('voice-toggle').disabled=true;$('read-aloud').disabled=true;status('声は使えません。文字で たしかめよう');}
  if(!hasEffects)$('effects-toggle').disabled=true;
  update();
  window.LessonAudio={activate,cancel,cancelSpeech,speak,play,reading,get speaking(){return speaking;},get voice(){return voice;}};
})();
