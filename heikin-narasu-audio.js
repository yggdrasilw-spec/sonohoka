(function(root){
'use strict';
const digits=['れい','いち','に','さん','よん','ご','ろく','なな','はち','きゅう'];
function integer(n){
 n=Number(n);if(n===0)return digits[0];let out='';
 for(const [base,unit,special] of [[1000,'せん',{3:'さんぜん',8:'はっせん'}],[100,'ひゃく',{3:'さんびゃく',6:'ろっぴゃく',8:'はっぴゃく'}],[10,'じゅう',{}]]){
  const q=Math.floor(n/base);if(q)out+=special[q]||((q===1?'':digits[q])+unit);n%=base;
 }
 return out+(n?digits[n]:'');
}
function number(raw){const [whole,fraction]=String(raw).split('.');return integer(whole)+(fraction?'てん'+[...fraction].map(n=>digits[Number(n)]).join(''):'');}
function pieces(raw){const n=Number(raw),last=n%10;return n===0?'れいこ':last===0?integer(n).replace(/じゅう$/,'じゅっ')+'こ':[1,6,8].includes(last)?(n>last?integer(n-last):'')+({1:'いっこ',6:'ろっこ',8:'はっこ'}[last]):integer(n)+'こ';}
// Whole words and known particles only: never replace every 「は」 with 「わ」.
// Keep proper names in this explicit dictionary so future additions are reviewable.
const readings={
 '阪神園芸':'はんしんえんげい','浦和学院':'うらわがくいん','ブルドーザー':'ぶるどーざー',
 'はじめの形':'はじめのかたち','はじめの地面':'はじめのじめん','初め':'はじめ',
 '水差し':'みずさし','平均':'へいきん','合計は':'ごうけいわ','合計':'ごうけい','個数':'こすう',
 '全部の量は':'ぜんぶのりょうわ','全部の量':'ぜんぶのりょう','全部':'ぜんぶ','元の量':'もとのりょう','元の':'もとの',
 '水は':'みずわ','土は':'つちわ','コップは':'こっぷわ','ここは':'ここわ','それは':'それわ','これは':'これわ','量は':'りょうわ','高さは':'たかさわ',
 '空のコップ':'からのこっぷ','地面':'じめん','高さ':'たかさ','高い':'たかい','低い':'ひくい',
 '同じ':'おなじ','等しく':'ひとしく','一層ずつ':'いっそうずつ','一層':'いっそう','行き場':'いきば',
 '玉':'たま','土':'つち','水':'みず','棒':'ぼう','量':'りょう','何こ':'なんこ','何mL':'なんみりりっとる',
 '正解':'せいかい','式':'しき','図':'ず','練習':'れんしゅう','下から':'したから','上の':'うえの','下の':'したの',
 '注ぐ':'そそぐ','傾けて':'かたむけて','押す':'おす','分ける':'わける','分けよう':'わけよう','分けた':'わけた','分かる':'わかる',
 '変わらない':'かわらない','変える':'かえる','取り消した':'とりけした','移動中':'いどうちゅう',
 '数から':'かずから','数を':'かずを','数に':'かずに','数で':'かずで','数と':'かずと','数が':'かずが',
 '何cm':'なんせんちめーとる','何g':'なんぐらむ','何m':'なんめーとる','歩はば':'ほはば','四捨五入':'ししゃごにゅう'
};
const words=new RegExp(Object.keys(readings).sort((a,b)=>b.length-a.length).join('|'),'g');
function reading(text){
 return String(text).normalize('NFKC').replace(words,w=>readings[w])
  .replace(/(\d+(?:\.\d+)?)\s*m[lL]/g,(_,n)=>number(n)+'みりりっとる')
  .replace(/(\d+(?:\.\d+)?)\s*cm\b/g,(_,n)=>number(n)+'せんちめーとる')
  .replace(/(\d+(?:\.\d+)?)\s*m\b/g,(_,n)=>number(n)+'めーとる')
  .replace(/(\d+(?:\.\d+)?)\s*g\b/g,(_,n)=>number(n)+'ぐらむ')
  .replace(/(\d+)\s*(?:こ|個)/g,(_,n)=>pieces(n))
  .replace(/([1-9])つ/g,(_,n)=>['','ひとつ','ふたつ','みっつ','よっつ','いつつ','むっつ','ななつ','やっつ','ここのつ'][Number(n)])
  .replace(/(\d+)等分/g,(_,n)=>number(n)+'とうぶん').replace(/(\d+)段目/g,(_,n)=>number(n)+'だんめ')
  .replace(/\d+(?:\.\d+)?/g,number).replace(/÷/g,'、わる、').replace(/×/g,'、かける、').replace(/[＋+]/g,'、たす、').replace(/[＝=]/g,'、イコール、')
  .replace(/→/g,'、から、').replace(/△/g,'うえボタン').replace(/▽/g,'したボタン').replace(/\s+/g,' ').trim();
}
let context=null,activated=false,speech=true,effects=true,current=null,lastText='',epoch=0,timer=0;
const sources=new Set(),synth=root.speechSynthesis;
function cancelSpeech(){epoch++;clearTimeout(timer);current=null;try{synth?.cancel();}catch{}}
function stopEffects(){for(const source of sources){try{source.stop();}catch{}}sources.clear();}
function cancel(){cancelSpeech();stopEffects();lastText='';}
function activate(){
 activated=true;if(!effects)return;
 try{const Audio=root.AudioContext||root.webkitAudioContext;if(!context&&Audio)context=new Audio();if(context?.state==='suspended')context.resume().catch(()=>{});}catch{}
}
function configure(options){speech=options.speech!==false;effects=options.effects!==false;if(!speech)cancelSpeech();if(!effects)stopEffects();}
function speak(text,{force=false}={}){
 if(!activated||!speech||!synth||typeof root.SpeechSynthesisUtterance!=='function')return false;
 const spoken=reading(text);if(!spoken||(!force&&spoken===lastText))return false;
 cancelSpeech();lastText=spoken;const id=epoch;
 const u=new root.SpeechSynthesisUtterance(spoken);current=u;u.lang='ja-JP';u.rate=.85;
 const voices=synth.getVoices().filter(v=>/^ja(?:-|_)/i.test(v.lang));
 const voice=voices.find(v=>v.localService)||voices[0];if(voice)u.voice=voice;
 const finish=()=>{if(id!==epoch)return;clearTimeout(timer);current=null;};u.onend=finish;u.onerror=finish;
 timer=setTimeout(()=>{if(id===epoch)cancelSpeech();},Math.min(60000,Math.max(12000,spoken.length*350)));
 try{synth.speak(u);return true;}catch{finish();return false;}
}
function tone(frequency,start,duration,type='sine',end=frequency){
 const osc=context.createOscillator(),gain=context.createGain(),at=context.currentTime+start;
 osc.type=type;osc.frequency.setValueAtTime(frequency,at);osc.frequency.exponentialRampToValueAtTime(Math.max(30,end),at+duration);
 gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(current?.025:.065,at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
 osc.connect(gain);gain.connect(context.destination);sources.add(osc);osc.onended=()=>{sources.delete(osc);osc.disconnect();gain.disconnect();};osc.start(at);osc.stop(at+duration+.02);
}
function play(kind){
 if(!activated||!effects||!context||context.state!=='running')return;
 try{
  stopEffects();
  if(kind==='success')[523,659,784,1047].forEach((f,i)=>tone(f,i*.09,.24));
  else if(kind==='water')[520,680,460,740].forEach((f,i)=>tone(f,i*.065,.1,'sine',f*.7));
  else if(kind==='soil'){tone(100,0,.28,'triangle',65);tone(140,.08,.22,'triangle',75);}
  else if(kind==='retry')tone(330,0,.16,'sine',280);
  else if(kind==='bead')tone(760,0,.09,'triangle',420);
  else tone(580,0,.07);
 }catch{}
}
document.addEventListener('pointerdown',activate,{capture:true});
document.addEventListener('keydown',activate,{capture:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});root.addEventListener('pagehide',cancel);
root.NarasuAudio={reading,activate,configure,speak,play,cancel,cancelSpeech};
})(window);
