const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
(async()=>{
 const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const out=path.resolve(__dirname,'../.portfolio-work/sansuu-kotoba');fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1180,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/sonohoka/sansuu_kotoba.html`);await page.locator('#voice-toggle').click();
  const opacity=id=>page.locator('#'+id).evaluate(el=>Number(getComputedStyle(el).opacity));
  for(const [scene,a,b,op] of [['multiply','4','3','×'],['subtract','7','2','−'],['divide','8','2','÷'],['add','4','3','＋']]){
   await page.locator(`[data-scene="${scene}"]`).click();await page.locator('[data-mode="numbers"]').click();
   await page.locator('#play').click();
   assert.equal(await page.locator('#play').getAttribute('aria-pressed'),'false');
   assert.equal(await opacity('frame'),1);assert.equal(await opacity('morph-left'),0);
   assert.equal(await page.locator('#morph-left').textContent(),a);assert.equal(await page.locator('#morph-right').textContent(),b);assert.equal(await page.locator('#morph-operator').textContent(),op);
   for(let i=0;i<4;i++)await page.locator('#step').click();
   assert((await opacity('morph-left'))>0);assert.equal(await opacity('frame'),1);
   if(scene==='multiply')await page.screenshot({path:path.join(out,'bridge-overlap.png')});
   await page.locator('#step').click();assert((await opacity('frame'))<1);assert.equal(await opacity('morph-left'),1);assert.equal(await opacity('morph-operator'),0);
   assert.match(await page.locator('#caption').innerText(),/ことばも へんしん/);
   assert.equal(await page.locator('#morph-left-term .term-suffix').innerText(),'数');
   if(scene==='multiply')await page.screenshot({path:path.join(out,'bridge-word-change.png')});
   await page.locator('#step').click();await page.locator('#step').click();
   assert.equal(await opacity('frame'),0);assert.equal(await opacity('morph-operator'),1);assert.match(await page.locator('#play').innerText(),/もういちど/);
   const positions=await page.evaluate(()=>{const svg=document.getElementById('morph-equation'),r=svg.getBoundingClientRect();return ['left','right'].map((side,i)=>{const label=document.getElementById(side+'-person').getBoundingClientRect();return Math.abs(r.x+r.width*[.3,.8][i]-(label.x+label.width/2));});});assert(positions.every(n=>n<1),JSON.stringify(positions));
   if(scene==='multiply')await page.screenshot({path:path.join(out,'bridge-complete.png')});
   await page.locator('#play').click();await page.waitForTimeout(160);await page.locator('#play').click();const paused=await opacity('morph-left');await page.waitForTimeout(250);assert.equal(await opacity('morph-left'),paused);
   await page.locator('#restart').click();assert.equal(await opacity('frame'),1);assert.match(await page.locator('#frame-count').innerText(),/1 \/ 8/);
  }
  await page.locator('[data-mode="people"]').click();await page.locator('[data-scene="multiply"]').click();await page.locator('[data-mode="numbers"]').click();
  await page.waitForFunction(()=>document.getElementById('play').textContent.includes('もういちど'),{},{timeout:9000});assert.equal(await opacity('frame'),0);
  await page.locator('#play').click();await page.locator('[data-mode="quiz"]').click();await page.waitForTimeout(200);assert.equal(await page.locator('#play').getAttribute('aria-pressed'),'false');assert(await page.locator('#morph-equation').isHidden());
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-mode="numbers"]').click();assert.equal(await opacity('frame'),0);assert.equal(await page.locator('#play').getAttribute('aria-pressed'),'false');
  for(const width of [375,390,768]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.screenshot({path:path.join(out,'bridge-mobile.png'),fullPage:true});assert.deepEqual(errors,[]);
  console.log('PASS: four operations, overlap, fixed coordinates, final stop, pause, replay, steps, mode cancellation, reduced motion, mobile widths');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
