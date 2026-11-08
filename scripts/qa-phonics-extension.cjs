'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../phonics-lab'),out=path.resolve(__dirname,'../qa-output/phonics-extension');fs.mkdirSync(out,{recursive:true});
const data=JSON.parse(fs.readFileSync(path.join(root,'advanced-data.json'))),evidence=JSON.parse(fs.readFileSync(path.join(root,'research/pronunciation-evidence.json')));
function validate(d){
 assert.equal(new Set(d.lessons.map(l=>l.id)).size,d.lessons.length,'duplicate lesson');
 const ids=new Set();
 for(const l of d.lessons){assert(['A','B','C','D'].includes(l.kind));assert(l.prerequisites&&l.rule&&l.exception&&l.sources.length);assert.equal(l.ruleStatus,'source-crosschecked');
  for(const w of l.words)assert(d.words[w],`missing word ${w}`);
  for(const q of l.questions){assert(!ids.has(q.id),'duplicate question');ids.add(q.id);assert(q.options.length>=2);assert.equal(new Set(q.options).size,q.options.length);assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length,'invalid answer');assert(q.feedback);assert(q.words.length);for(const w of q.words)assert(l.words.includes(w),'question word outside lesson');}
 }
 for(const [id,w] of Object.entries(d.words)){assert.equal(id,w.id);assert.equal(w.dictionaryStatus,'cmu-crosschecked');assert.equal(evidence.words[id].ipaUS,w.ipaUS);assert.equal(w.audioStatus,'listening-review-required');assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,w.audio.src))).digest('hex'),w.audio.sha256);}
}
validate(data);
for(const mutate of [d=>d.lessons.push(d.lessons[0]),d=>d.lessons[0].questions[0].answer=99,d=>d.lessons[0].questions[0].words=['missing'],d=>d.lessons[0].questions.push(d.lessons[0].questions[0])]){const d=structuredClone(data);mutate(d);assert.throws(()=>validate(d));}
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'audio-data.js'),'utf8'),ctx);assert.equal(Object.keys(ctx.window.PHONICS_AUDIO).length,178);
vm.runInNewContext(fs.readFileSync(path.join(root,'advanced-data.js'),'utf8'),ctx);assert.equal(JSON.stringify(ctx.window.PHONICS_ADVANCED),JSON.stringify(data));
const coverage=JSON.parse(fs.readFileSync(path.join(root,'research/coverage.json')));assert.equal(coverage.length,126);assert.equal(new Set(coverage.map(r=>r.id)).size,126);assert(coverage.every(r=>r.status==='research-only'));
const origin=process.env.PHONICS_ORIGIN||'http://127.0.0.1:8967';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/phonics-lab/english.html#advanced');await page.locator('[data-explore="oo"]').waitFor();
  await page.evaluate(()=>{localStorage.setItem('phonics-lab-state',JSON.stringify({letter:'z',sound:'s',vowel:'u'}));localStorage.setItem('phonics-reading-sounds','["b","ae","t"]');});
  assert.equal(await page.locator('.lesson-nav [data-mode="vowels"],.lesson-nav [data-mode="blend"]').count(),0);
  assert.equal(await page.locator('[data-explore]').count(),9);
  assert(!/ローマ字|日本語/.test(await page.locator('body').innerText()));
  const decoded=await page.evaluate(async()=>{const ac=new AudioContext(),r=[];for(const w of Object.values(PHONICS_ADVANCED.words)){const response=await fetch(w.audio.src);if(!response.ok)throw Error(w.id);const b=await ac.decodeAudioData(await response.arrayBuffer());if(b.duration<.1||b.duration>15)throw Error('duration '+w.id);r.push({word:w.id,duration:b.duration});}await ac.close();return r;});assert.equal(decoded.length,17);
  fs.writeFileSync(path.join(out,'audio-decode.json'),JSON.stringify(decoded,null,2));
  await page.screenshot({path:path.join(out,'desktop.png'),fullPage:true});
  for(const lesson of data.lessons){
   await page.locator(`[data-explore="${lesson.id}"]`).click();
   if(lesson.kind==='C')assert(await page.locator('[data-explore-start="listen"]').isDisabled());
   await page.locator('[data-explore-start="text"]').click();
   let first=true;
   for(let i=0;i<lesson.questions.length;i++){
    const prompt=await page.locator('.explore-question h1').innerText(),q=lesson.questions.find(q=>q.prompt===prompt);assert(q);
    if(first){await page.locator(`[data-explore-answer="${(q.answer+1)%q.options.length}"]`).click();await page.getByText('もう一度、くらべてみよう。',{exact:true}).waitFor();assert.equal(await page.locator('.explore-feedback .explore-word').count(),q.words.length);first=false;}
    await page.locator(`[data-explore-answer="${q.answer}"]`).click();await page.locator('[data-explore-next]').click();
   }
   assert((await page.locator('.explore-summary').innerText()).includes(`${lesson.questions.length-1} / ${lesson.questions.length}`));
   await page.locator('[data-explore-back]').click();
  }
  await page.reload();await page.locator('[data-explore="oo"]').waitFor();
  assert((await page.locator('[data-explore="oo"]').innerText()).includes('ひと回り'));
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('phonics-lab-state')).letter),'z');
  assert.equal(await page.evaluate(()=>localStorage.getItem('phonics-reading-sounds')),'["b","ae","t"]');
  await page.locator('[data-explore="oo"]').click();await page.locator('.explore-teacher summary').click();
  // No audio approval before playback; completed playback alone is not approval.
  assert(await page.locator('[data-audio-confirm="moon"]').isDisabled());
  for(const w of ['moon','book']){await page.locator(`.explore-review [data-audio="word:${w}"]`).click();await page.waitForFunction(id=>!document.querySelector(`[data-audio-confirm="${id}"]`).disabled,w);assert(await page.locator('[data-explore-start="listen"]').isDisabled());await page.locator(`[data-audio-confirm="${w}"]`).click();}
  assert(await page.locator('[data-explore-start="listen"]').isEnabled());
  await page.locator('[data-explore-start="listen"]').click();assert(await page.locator('[data-explore-answer]').first().isDisabled());
  await page.locator('.explore-question > [data-audio]').click();await page.waitForFunction(()=>!document.querySelector('[data-explore-answer]').disabled);
  await page.locator('[data-explore-answer="0"]').click();await page.locator('[data-explore-next]').click();
  await page.locator('[data-explore-back]').click();await page.locator('[data-explore="oo"]').click();
  // Replacing a recording invalidates prior audio approval but keeps the original standard.
  await page.locator('.explore-teacher summary').click();await page.locator('[data-voice-word="moon"]').click();
  assert.equal(await page.locator('#record-target').inputValue(),'word:moon');
  await page.locator('#record-file').setInputFiles(path.join(root,'assets/audio/word-moon.mp3'));
  await page.waitForFunction(()=>document.querySelector('#record-state').textContent.includes('先生の声を使っています'));
  await page.locator('[data-close="teacher-dialog"]').click();assert(await page.locator('[data-explore-start="listen"]').isDisabled());
  await page.locator('[data-explore-back]').click();
  for(const width of [320,768]){await page.setViewportSize({width,height:900});await page.screenshot({path:path.join(out,`overview-${width}.png`),fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('[data-explore="silent-e"]').click();await page.screenshot({path:path.join(out,`lesson-${width}.png`),fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('[data-explore-back]').click();}
  // English entry rejects links to Japanese lessons; old entry continues to expose them.
  await page.goto(origin+'/phonics-lab/english.html#blend');assert.equal(await page.locator('.lesson-nav [aria-current="page"]').getAttribute('data-mode'),'letters');
  await page.goto(origin+'/phonics-lab/#blend');await page.locator('#gap-range').waitFor();
  assert.equal(await page.locator('.lesson-nav [data-mode="blend"]').count(),1);
  assert.deepEqual(errors,[]);console.log('PASS: data + negative validation; 17 audio decodes; 9 complete question flows; first-attempt history; persistence; approval and replacement gate; 320/768/1280 layouts; legacy entry.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
