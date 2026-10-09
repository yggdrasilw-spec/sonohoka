(() => {
  'use strict';
  const $=id=>document.getElementById(id),E=window.TapeLessonEngine,ns='http://www.w3.org/2000/svg';
  let step=0,timer=null;
  const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const sv=(tag,attrs,text)=>{const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;return n;};
  function cancel(){clearInterval(timer);timer=null;}
  function ready(text){$('introFeedback').textContent=text;$('introNext').disabled=false;}
  function afterVisual(text){if(matchMedia('(prefers-reduced-motion: reduce)').matches)ready(text);else timer=setTimeout(()=>{timer=null;ready(text);},1400);}
  function action(id,label,fn){const b=node('button','primary',label);b.id=id;b.type='button';b.onclick=()=>{b.disabled=true;fn();};$('introActions').append(b);}
  function hide(){cancel();$('intro').hidden=true;$('lessonContent').hidden=false;$('introButton').setAttribute('aria-pressed','false');}
  function open(){window.TapeWorkshop?.hide();window.TapeExtension?.hide();window.TapeLessonApp.pause();step=0;$('settings').hidden=true;$('settingsButton').setAttribute('aria-expanded','false');$('intro').hidden=false;$('lessonContent').hidden=true;$('introButton').setAttribute('aria-pressed','true');render();}
  function groups(a,b,pictures=false){
    const wrap=node('div','objects introGroups');
    [[a,'赤い花','a','assets/red-flower.png'],[b,'白い花','b','assets/white-flower.png']].forEach(([count,name,cls,src])=>{
      const group=node('section','objectGroup '+cls);group.append(node('h3','',`${name} ${count}本`));const pieces=node('div','introPieces');
      for(let i=0;i<count;i++){const p=node('span','introDot'+(pictures?' flower':''));if(pictures){const img=node('img');img.src=src;img.alt=name;p.append(img);}pieces.append(p);}group.append(pieces);wrap.append(group);
    });$('introScene').append(wrap);
  }
  function character(){const wrap=node('div','introCharacter'),img=node('img');img.src='assets/notebook-child.png';img.alt='ノートに絵を描いている子ども';wrap.append(img,node('p','introSpeech','でも、これって かくのに、すごく 時間が かかるよ。'));$('introScene').append(wrap);}
  function tape(joined=false){
    const s=sv('svg',{viewBox:'0 0 900 290',class:'diagram introTape'+(joined?' morphed':''),role:'img','aria-label':'赤い花38本と白い花17本を表すテープ図'});
    const x=62,a=494,b=221,startB=x+a+(joined?0:50);
    [[38,x,a,'a','赤い花 38本'],[17,startB,b,'b','白い花 17本']].forEach(([count,left,width,cls,label])=>{
      s.append(sv('rect',{x:left,y:114,width,height:52,class:cls==='a'?'tapeA':'tapeB'}));
      for(let i=0;i<count;i++)s.append(sv('circle',{cx:left+(i+.5)*width/count,cy:140,r:4.5,class:cls==='a'?'dotA':'dotB'}));
      E.labeledArc(s,left,left+width,166,label,true);
    });if(joined)E.labeledArc(s,x,x+a+b,114,'ぜんぶで □本');$('introScene').append(s);E.layoutArcs(s);return s;
  }
  function render(){
    cancel();$('introScene').replaceChildren();$('introActions').replaceChildren();$('introFeedback').textContent='';$('introNext').disabled=true;$('introPrev').disabled=step===0;$('introPosition').textContent=`${step+1} / 6`;$('introNext').textContent=step===5?'テープ図を 描いてみる':'つぎへ';
    $('introTitle').textContent=['どんな おはなしかな？','詳しい絵を ノートに かくと…','ノートに かくときは、こう かくよ','数が 多いお話を ○図にすると…','○の まとまりを、テープに かえよう','テープ図で 同じお話を あらわせたね'][step];
    $('introHint').textContent=['図にすると、お話が わかりやすくなるよ。一番わかりやすいのは、詳しく 絵に かくことだね。','花を１本ずつ、形や花びらまで かいてみると…','花１本を、○１つで あらわしてみよう。','赤い花が38本、白い花が17本。今度は ○が いくつ いるかな？','○を１つずつ かくかわりに、数のまとまりを 長い四角で あらわすよ。','２つのテープを つなぐようすを 見てみよう。'][step];
    $('introStory').textContent=step<3?'赤い花が 8本、白い花が 7本 あります。ぜんぶで 何本でしょうか。':'赤い花が 38本、白い花が 17本 あります。ぜんぶで 何本でしょうか。';
    if(step===0){groups(8,7,true);action('introObserve','お話と 絵を 見くらべる',()=>ready('赤い花8本と 白い花7本。詳しい絵で、お話のようすが わかるね。'));}
    if(step===1){groups(8,7,true);const pieces=[...$('introScene').querySelectorAll('.introDot')];pieces.forEach(p=>p.classList.add('ghost'));action('introDrawPictures','詳しい絵を かくようすを見る',()=>{let i=0;const tick=()=>{pieces[i++].classList.remove('ghost');if(i===pieces.length){cancel();character();ready('詳しい絵は わかりやすいね。でも、１つずつ かくのは 時間が かかるね。');}};if(matchMedia('(prefers-reduced-motion: reduce)').matches){pieces.forEach(p=>p.classList.remove('ghost'));character();ready('詳しい絵は わかりやすいね。でも、１つずつ かくのは 時間が かかるね。');}else timer=setInterval(tick,260);});}
    if(step===2){groups(8,7,true);action('introConvert','絵を ○に かえてみる',()=>{for(const p of $('introScene').querySelectorAll('.introDot')){p.replaceChildren();p.classList.remove('flower');}ready('このような図を「○図」と 言います。絵１つを ○１つに かえても、数は 同じだね。');});}
    if(step===3){groups(38,17);const pieces=[...$('introScene').querySelectorAll('.introDot')];pieces.forEach(p=>p.classList.add('ghost'));action('introAuto','○図を かくようすを見る',()=>{let i=0;const tick=()=>{pieces[i++].classList.remove('ghost');if(i===pieces.length){cancel();ready('○図は絵より かんたん。でも、55この○を かくのは 手間が かかるね。');}};if(matchMedia('(prefers-reduced-motion: reduce)').matches){pieces.forEach(p=>p.classList.remove('ghost'));ready('○図は絵より かんたん。でも、55この○を かくのは 手間が かかるね。');}else timer=setInterval(tick,75);});}
    if(step===4){const s=tape();action('introTransform','○のまとまりを テープにする',()=>{s.classList.add('morphed');afterVisual('長い四角で 数のまとまりを あらわす図を「テープ図」と 言います。赤38本、白17本は 同じだね。');});}
    if(step===5){tape();action('introJoin','２つの テープを つなぐ',()=>{$('introScene').replaceChildren();tape(true);ready('２つの ぶぶんを あわせると、ぜんぶ。テープ図なら、数が多くても まとまりの関係を かけるね。');});}
  }
  $('introButton').onclick=open;$('introPrev').onclick=()=>{if(step>0){step--;render();}};$('introReplay').onclick=render;
  $('introNext').onclick=()=>{if($('introNext').disabled)return;if(step===5){window.TapeLessonApp.start(window.TAPE_LESSONS.find(l=>l.id==='combine-large'),4);return;}step++;render();};
  window.TapeIntro={open,hide};open();
})();
