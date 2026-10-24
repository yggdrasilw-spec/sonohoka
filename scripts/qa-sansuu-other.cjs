const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const examples={push:['おされる','おす'],poke:['つつかれる','つつく'],pat:['なでられる','なでる'],fan:['あおがれる','あおぐ'],call:['よばれる','よぶ'],light:['てらされる','てらす']};
(async()=>{
 const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const out=path.resolve(__dirname,'../.portfolio-work/sansuu-kotoba/other');fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1180,height:720}}),errors=[],badResponses=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)badResponses.push(r.url());});
  await page.addInitScript(()=>{
   window.spoken=[];window.currentSpeech=null;
   Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],speak:u=>{spoken.push(u.text);window.currentSpeech=u;},cancel:()=>{window.currentSpeech=null;}}});
   window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/sonohoka/sansuu_kotoba.html`);
  await page.locator('#voice-toggle').click();
  const open=page.locator('#other-scenes-open'),dialog=page.locator('#other-scenes');
  await open.click();assert.equal(await dialog.locator('[data-scene]').count(),6);
  assert.equal(await open.getAttribute('aria-expanded'),'true');
  for(let i=0;i<9;i++){
   await page.keyboard.press('Tab');
   assert(await dialog.evaluate(el=>el.contains(document.activeElement)),'focus stays inside modal');
  }
  await page.keyboard.press('Escape');assert(!await dialog.isVisible());
  await page.waitForFunction(()=>document.getElementById('other-scenes-open').getAttribute('aria-expanded')==='false');
  assert.equal(await open.getAttribute('aria-expanded'),'false');assert(await open.evaluate(el=>document.activeElement===el));
  await open.click();await page.mouse.click(4,4);assert(!await dialog.isVisible(),'backdrop closes popup');
  let frames=0,questions=0;
  for(const [scene,terms] of Object.entries(examples)){
   await open.click();await dialog.locator(`[data-scene="${scene}"]`).click();
   assert(!await dialog.isVisible());assert.equal(await open.getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator(`[data-scene="${scene}"]`).getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('#left-person').innerText(),terms[0]+'人');
   assert.equal(await page.locator('#right-person').innerText(),terms[1]+'人');
   assert(await page.locator('[data-mode="numbers"]').isDisabled());assert(await page.locator('[data-mode="apply"]').isDisabled());
   assert(await page.locator('#number-panel').isHidden());
   for(let f=0;f<4;f++){
    const width=await page.locator('#frame').evaluate(async img=>{await img.decode();return img.naturalWidth;});assert(width>=760);frames++;
    const caption=await page.locator('#caption').innerText();assert(caption.length>0&&!caption.includes('undefined'));
    if(f===2)await page.screenshot({path:path.join(out,`${scene}.png`)});
    await page.locator('#step').click();
   }
   await page.locator('[data-mode="quiz"]').click();assert.equal(await page.locator('#question').innerText(),`「${terms[0]}人」は、どっち？`);
   await page.locator('[data-answer="right"]').click();assert.match(await page.locator('#feedback').innerText(),/もういちど/);
   await page.locator('[data-answer="left"]').click();assert.match(await page.locator('#feedback').innerText(),/先/);questions++;
   await page.locator('#next').click();assert.equal(await page.locator('#question').innerText(),`「${terms[1]}人」は、どっち？`);
   await page.locator('[data-answer="right"]').click();assert.match(await page.locator('#feedback').innerText(),/ねもと/);questions++;
   assert(await page.locator('#number-panel').isHidden());assert(!await page.locator('#mapping').isHidden());
   await page.locator('[data-mode="people"]').click();await page.locator('#restart').click();await page.locator('#voice-toggle').click();
   await page.locator('#play').click();const caption=await page.locator('#caption').innerText();
   assert.equal(await page.evaluate(()=>currentSpeech.text),caption);
   await page.waitForTimeout(800);assert.equal(await page.locator('#frame-count').innerText(),'1 / 4 コマ','voice on holds scene');
   await page.locator('#voice-toggle').click();await page.waitForTimeout(800);
   assert.equal(await page.locator('#frame-count').innerText(),'4 / 4 コマ','voice off resumes snappy action');
   await open.click();assert.equal(await page.locator('#play').getAttribute('aria-pressed'),'false','opening popup stops playback');
   await page.locator('#other-scenes-close').click();
  }
  assert.deepEqual(await page.evaluate(()=>spoken.length),6,'only six deliberately voiced actions were read');
  // Switching from an arithmetic animation or practice to an extra action must
  // return to a usable people screen, without leaking operands or equations.
  for(const mode of ['numbers','apply']){
   await page.locator('[data-scene="multiply"]').click();assert.equal(await open.getAttribute('aria-pressed'),'false');
   await page.locator(`[data-mode="${mode}"]`).click();
   await open.click();await dialog.locator('[data-scene="poke"]').click();
   assert.equal(await page.locator('[data-mode="people"]').getAttribute('aria-pressed'),'true');
   assert(await page.locator('#application').isHidden());assert(await page.locator('#morph-equation').isHidden());
   assert.equal(await page.locator('#play').getAttribute('aria-pressed'),'false');
  }
  for(const [width,height] of [[1180,720],[1024,600],[375,844],[390,844],[768,1024]]){
   await page.setViewportSize({width,height});await open.click();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const bounds=await dialog.boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=width&&bounds.y>=0&&bounds.y+bounds.height<=height);
   for(const scene of Object.keys(examples)){
    const button=dialog.locator(`[data-scene="${scene}"]`);await button.scrollIntoViewIfNeeded();
    const accessible=await button.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return el.contains(hit)&&r.width>=44&&r.height>=44;});assert(accessible,`${width}: ${scene} reachable`);
   }
   await dialog.evaluate(el=>{el.scrollTop=0;});
   await page.screenshot({path:path.join(out,`popup-${width}.png`),fullPage:true});
   await page.keyboard.press('Escape');
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>Math.abs(Number(document.getElementById('traveler').getAttribute('cx'))-550)<1);
  const x=await page.locator('#traveler').getAttribute('cx');await page.locator('#step').click();assert.equal(await page.locator('#traveler').getAttribute('cx'),x);
  assert.deepEqual(errors,[]);assert.deepEqual(badResponses,[]);
  console.log(JSON.stringify({choices:6,newActions:5,frames,questions,viewports:5,modal:'focus/Escape/backdrop/selection verified',voice:'on synchronized, off snappy',errors,badResponses},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
