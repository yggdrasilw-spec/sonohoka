const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
(async()=>{const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 try{const page=await browser.newPage({viewport:{width:1024,height:552}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.activeSpeech=null;window.spoken=[];Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel(){activeSpeech=null},speak(u){activeSpeech=u;spoken.push(u.text);u.onstart?.()}}});window.finishSpeech=()=>{const u=activeSpeech;activeSpeech=null;u?.onend?.()}});
  const url=`http://127.0.0.1:${server.address().port}/sonohoka/kakezan_rescue.html`;
  await page.goto(url);await page.locator('#a').selectOption('8');await page.locator('#b').selectOption('7');await page.locator('[data-mode="0"]').click();
  const upper=()=>page.locator('#topAnswer').innerText(),complete=()=>page.waitForFunction(()=>document.getElementById('equation').innerText.endsWith('56'));
  const slot=()=>page.locator('.problem').boundingBox();const before=await slot();
  await page.locator('#play').click();await complete();assert.equal(await upper(),'？','central result must precede upper answer');assert(await page.locator('#next').isHidden());
  await page.evaluate(()=>finishSpeech());assert((await page.evaluate(()=>activeSpeech.text)).includes('ごじゅうろく'));assert.equal(await upper(),'？','reason still keeps question');
  await page.evaluate(()=>finishSpeech());assert.equal(await page.evaluate(()=>activeSpeech.text),'だから、はち かける ななは。');assert((await page.locator('#description').innerText()).includes('だから 8 × 7 は'));assert.equal(await upper(),'？');
  await page.evaluate(()=>finishSpeech());await page.evaluate(()=>dispatchEvent(new Event('resize')));await page.waitForTimeout(480);assert.equal(await upper(),'？','hold before speaking answer');assert((await page.locator('#description').innerText()).includes('だから'),'resize preserves conclusion');await page.waitForFunction(()=>document.getElementById('topAnswer').textContent==='56');assert.equal(await page.evaluate(()=>activeSpeech.text),'ごじゅうろく。');assert(await page.locator('#topAnswer').evaluate(e=>e.classList.contains('revealed')));assert.deepEqual(await slot(),before,'popup keeps equation slot fixed');assert(await page.locator('#next').isVisible());
  // Replaying restores the question, and changing helper during the pause cancels it.
  await page.locator('#listen').click();assert.equal(await upper(),'？');await page.evaluate(()=>{finishSpeech();finishSpeech();window.staleAnswer=spoken.length});await page.locator('[data-mode="2"]').click();await page.waitForTimeout(850);assert.equal(await upper(),'？');assert.equal(await page.evaluate(()=>spoken.length),await page.evaluate(()=>staleAnswer+1),'cancel pending answer utterance');
  // Speech failure switches to a timed, equally ordered visual conclusion.
  await page.locator('#play').click();await complete();await page.waitForTimeout(500);await page.evaluate(()=>finishSpeech());await page.evaluate(()=>activeSpeech.onerror({error:'synthesis-failed'}));assert.equal(await upper(),'？');await page.waitForTimeout(450);assert((await page.locator('#description').innerText()).includes('だから'));assert.equal(await upper(),'？');await page.waitForFunction(()=>document.getElementById('topAnswer').textContent==='56');
  await page.locator('#listen').click();await page.locator('#sound').click();assert.equal(await upper(),'？');await page.waitForFunction(()=>document.getElementById('topAnswer').textContent==='56');
  // Muted/reduced-motion users retain the same logical order, without motion.
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-mode="0"]').click();await page.locator('#play').click();await complete();assert.equal(await upper(),'？');await page.waitForTimeout(450);assert.equal(await upper(),'？');await page.waitForFunction(()=>document.getElementById('topAnswer').textContent==='56');assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
  assert.deepEqual(errors,[]);console.log('PASS answer: central result, reason, therefore, 700ms pause, speech-start popup, fixed slot, replay, cancellation, speech failure, mute, reduced motion');
 }finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exit(1)});
