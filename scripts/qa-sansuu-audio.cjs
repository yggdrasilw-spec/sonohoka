const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
(async()=>{
 const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const url=`http://127.0.0.1:${server.address().port}/sonohoka/sansuu_kotoba.html`,out=path.resolve(__dirname,'../.portfolio-work/sansuu-kotoba');fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1180,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.audioProbe={spoken:[],cancels:0,tones:0,noises:0,pending:null};
   const probe=window.audioProbe;
   Object.defineProperty(window,'speechSynthesis',{value:{
    getVoices:()=>[{lang:'ja-JP',localService:true,name:'Test Japanese'}],
    cancel:()=>{probe.cancels++;probe.pending=null;},
    speak:u=>{probe.spoken.push({text:u.text,lang:u.lang,rate:u.rate});probe.pending=u;},
   }});
   window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
   const oscillator=AudioContext.prototype.createOscillator,buffer=AudioContext.prototype.createBufferSource;
   AudioContext.prototype.createOscillator=function(){probe.tones++;return oscillator.call(this);};
   AudioContext.prototype.createBufferSource=function(){probe.noises++;return buffer.call(this);};
  });
  await page.goto(url);assert.equal(await page.evaluate(()=>audioProbe.spoken.length),0,'no speech on load');
  assert.equal(await page.evaluate(()=>LessonAudio.reading('4 × 3 ＝ 12。引かれる数')), 'よん  かける  さん  は  じゅうに。ひかれるかず');
  assert.equal(await page.evaluate(()=>LessonAudio.reading('１こ、６こ、８こ、10こ、21こ')),'いっこ、ろっこ、はっこ、じゅっこ、にじゅういっこ');
  await page.locator('[data-scene="multiply"]').click();await page.locator('[data-mode="numbers"]').click();
  await page.waitForFunction(()=>audioProbe.spoken.length===1);assert.match(await page.evaluate(()=>audioProbe.spoken[0].text),/かけられるひと/);
  const held=await page.locator('#frame-count').innerText();await page.waitForTimeout(400);assert.equal(await page.locator('#frame-count').innerText(),held,'wait for narration');
  const finish=()=>page.evaluate(()=>{const u=audioProbe.pending;audioProbe.pending=null;u?.onend?.();});
  await finish();await page.waitForFunction(()=>audioProbe.spoken.length===2,{},{timeout:5000});
  assert.match(await page.evaluate(()=>audioProbe.spoken[1].text),/同じ場所/);
  await finish();await page.waitForFunction(()=>audioProbe.spoken.length===3,{},{timeout:5000});
  assert.match(await page.evaluate(()=>audioProbe.spoken[2].text),/かけられるひとから、かけられるかず/);
  assert(await page.locator('#mapping').evaluate(el=>el.classList.contains('is-reading')));
  await page.screenshot({path:path.join(out,'audio-transform.png')});
  await finish();await page.waitForFunction(()=>audioProbe.spoken.length===4,{},{timeout:5000});
  assert.match(await page.evaluate(()=>audioProbe.spoken[3].text),/よん  かける  さん/);
  assert.equal(await page.locator('#play').getAttribute('aria-pressed'),'false');
  await page.locator('#audio-stop').click();assert.equal(await page.evaluate(()=>LessonAudio.speaking),false);
  assert.equal(await page.locator('.is-reading').count(),0);
  assert((await page.evaluate(()=>audioProbe.tones))>=8);assert((await page.evaluate(()=>audioProbe.noises))>=1);
  await page.locator('#effects-toggle').click();await page.locator('[data-mode="people"]').click();
  const tones=await page.evaluate(()=>audioProbe.tones);await page.locator('#step').click();assert.equal(await page.evaluate(()=>audioProbe.tones),tones,'effects muted');
  await page.locator('#voice-toggle').click();await page.locator('#play').click();await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>LessonAudio.speaking),false,'voice muted');
  await page.locator('#read-aloud').click();assert.equal(await page.locator('#play').getAttribute('aria-pressed'),'false');assert.equal(await page.evaluate(()=>LessonAudio.speaking),true);
  await page.locator('[data-scene="subtract"]').click();assert.equal(await page.evaluate(()=>LessonAudio.speaking),false,'scene cancels old speech');
  await page.locator('[data-mode="quiz"]').click();assert.match(await page.evaluate(()=>audioProbe.spoken.at(-1).text),/ひかれるかず/);
  await page.locator('[data-answer="right"]').click();assert.match(await page.evaluate(()=>audioProbe.spoken.at(-1).text),/もう一度/);
  await page.locator('[data-answer="left"]').click();assert.match(await page.evaluate(()=>audioProbe.spoken.at(-1).text),/そう/);
  await page.locator('[data-mode="apply"]').click();assert.equal(await page.evaluate(()=>LessonAudio.speaking),true);
  await page.locator('#practice-hint').click();assert(await page.locator('#application-diagram').evaluate(el=>el.classList.contains('is-reading')));
  await page.locator('#practice-next').click();assert.equal(await page.locator('#application-diagram').isHidden(),true);
  assert.match(await page.evaluate(()=>audioProbe.spoken.at(-1).text),/さんばん/,'reads all answer choices');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;});
  assert.equal(await page.evaluate(()=>LessonAudio.speaking),false,'hidden page cancels narration');
  await page.locator('#audio-stop').click();
  await page.clock.install();await page.evaluate(()=>LessonAudio.speak('テスト'));await page.clock.fastForward(46000);
  assert.equal(await page.evaluate(()=>LessonAudio.speaking),false,'missing speech events cannot trap playback');
  assert.deepEqual(errors,[]);
  const fallback=await browser.newPage();await fallback.addInitScript(()=>{Object.defineProperty(window,'speechSynthesis',{value:undefined});Object.defineProperty(window,'AudioContext',{value:undefined});Object.defineProperty(window,'webkitAudioContext',{value:undefined});});
  await fallback.goto(url);assert(await fallback.locator('#voice-toggle').isDisabled());assert(await fallback.locator('#read-aloud').isDisabled());
  await fallback.locator('[data-scene="multiply"]').click();await fallback.locator('[data-mode="numbers"]').click();await fallback.locator('#step').click();assert(await fallback.locator('#stage').isVisible());
  console.log('PASS: user-triggered audio, Japanese readings, narration waits, cue order, real Web Audio sources, separate mute controls, cancellation, problem narration, watchdog, unsupported fallback');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
