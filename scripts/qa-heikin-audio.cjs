const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
(async()=>{const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});const p=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{
   window.audioLog={spoken:[],cancelled:0,tones:0};
   Object.defineProperty(window,'speechSynthesis',{value:{cancel(){audioLog.cancelled++;},getVoices(){return [{lang:'ja-JP',name:'Japanese local',localService:true}];},speak(u){audioLog.spoken.push({text:u.text,lang:u.lang,rate:u.rate,voice:u.voice?.name});u.onend?.();}}});
   window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
   const Native=window.AudioContext;window.AudioContext=class extends Native{createOscillator(){audioLog.tones++;return super.createOscillator();}};
  });
  await p.goto(`http://127.0.0.1:${server.address().port}/sonohoka/heikin_narasu.html`);
  assert.equal(await p.evaluate(()=>audioLog.spoken.length),0);
  const read=text=>p.evaluate(t=>NarasuAudio.reading(t),text);
  assert.equal(await read('はじめ はるか はな はし はんしん'),'はじめ はるか はな はし はんしん');
  assert.equal(await read('阪神園芸と浦和学院'),'はんしんえんげいとうらわがくいん');
  assert.equal(await read('水差し 平均 合計 個数'),'みずさし へいきん ごうけい こすう');
  assert.equal(await read('土は 水は はじめの形'),'つちわ みずわ はじめのかたち');
  assert.equal(await read('１２０ｍＬ ÷ １０ ＝ １２mL'),'ひゃくにじゅうみりりっとる 、わる、 じゅう 、イコール、 じゅうにみりりっとる');
  assert.equal(await read('1こ 6こ 8こ 10こ 2つ 3000mL 12.5mL'),'いっこ ろっこ はっこ じゅっこ ふたつ さんぜんみりりっとる じゅうにてんごみりりっとる');
  assert.equal(await read('28.5cm 55g 7.7m 80 × 20'),'にじゅうはちてんごせんちめーとる ごじゅうごぐらむ ななてんななめーとる はちじゅう 、かける、 にじゅう');
  await p.locator('#scenes button').nth(6).click();assert(await p.evaluate(()=>audioLog.spoken.at(-1).text.includes('オレンジを')));
  await p.locator('#appProblem').selectOption('2');await p.locator('#speak').click();
  assert(await p.evaluate(()=>{const t=audioLog.spoken.at(-1).text;return t.includes('にじゅうはちせんちめーとる')&&t.includes('さんじゅうせんちめーとる')&&t.includes('なんせんちめーとる');}));
  await p.locator('#scenes button').nth(1).click();assert(await p.evaluate(()=>audioLog.spoken.at(-1).text.includes('ぶるどーざー')));
  await p.locator('[data-soil-height="-1"]').click();assert(await p.evaluate(()=>audioLog.spoken.at(-1).text.includes('たかさわ、したから よんだんめ')));
  const beforeRepeat=await p.evaluate(()=>audioLog.spoken.length);await p.locator('#speak').click();assert.equal(await p.evaluate(()=>audioLog.spoken.length),beforeRepeat+1);
  assert.deepEqual(await p.evaluate(()=>{const u=audioLog.spoken.at(-1);return [u.lang,u.rate,u.voice];}),['ja-JP',.85,'Japanese local']);
  await p.locator('#settingsOpen').click();await p.locator('#speed').selectOption('reduced');await p.locator('#effects').uncheck();await p.locator('#speech').uncheck();await p.locator('#settings button.primary').click();
  const silent=await p.evaluate(()=>({tones:audioLog.tones,speech:audioLog.spoken.length}));await p.locator('#scenes button').nth(2).click();await p.locator('#demo').click();await p.waitForFunction(()=>!Narasu.snapshot().busy);
  assert.deepEqual(await p.evaluate(()=>({tones:audioLog.tones,speech:audioLog.spoken.length})),silent);
  await p.reload();await p.locator('#resumeYes').click();assert.equal(await p.evaluate(()=>audioLog.spoken.length),0);await p.locator('#settingsOpen').click();assert(!(await p.locator('#speech').isChecked()));assert(!(await p.locator('#effects').isChecked()));
  await p.locator('#speech').check();await p.locator('#effects').check();await p.locator('#settings button.primary').click();await p.locator('#scenes button').nth(5).click();await p.locator('#next').click();
  const beforeCorrect=await p.evaluate(()=>audioLog.tones);await p.locator('#answer').fill('120');await p.locator('#answerForm button').click();assert(await p.evaluate(()=>audioLog.tones)>=beforeCorrect+4);assert(await p.evaluate(()=>audioLog.spoken.at(-1).text.includes('せいかい')));
  const cancelled=await p.evaluate(()=>audioLog.cancelled);await p.locator('#audioStop').click();assert(await p.evaluate(()=>audioLog.cancelled)>cancelled);
  assert(await p.evaluate(()=>audioLog.tones)>0);assert.deepEqual(errors,[]);
  // Missing audio APIs do not prevent the visual lesson from working.
  const noAudio=await browser.newPage();const unsupported=[];noAudio.on('pageerror',e=>unsupported.push(e.message));await noAudio.addInitScript(()=>{Object.defineProperty(window,'speechSynthesis',{value:undefined});window.AudioContext=undefined;window.webkitAudioContext=undefined;});
  await noAudio.goto(`http://127.0.0.1:${server.address().port}/sonohoka/heikin_narasu.html`);await noAudio.locator('#scenes button').nth(1).click();await noAudio.locator('#speak').click();assert.match(await noAudio.locator('#message').innerText(),/使えません/);assert.deepEqual(unsupported,[]);
  console.log('PASS: Japanese pronunciation, initial は and proper names, counters/units/equations, automatic/manual speech, stable Japanese voice, effects, independent saved toggles, stop and unsupported APIs');
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
