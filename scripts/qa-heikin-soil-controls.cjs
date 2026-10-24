const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const out=path.resolve(__dirname,'../.portfolio-work/heikin-soil-controls');fs.mkdirSync(out,{recursive:true});
(async()=>{const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});const p=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/sonohoka/heikin_narasu.html`);
  const snap=()=>p.evaluate(()=>Narasu.snapshot());
  async function speed(value){await p.locator('#settingsOpen').click();await p.locator('#speed').selectOption(value);await p.locator('#settings button.primary').click();}
  await p.locator('#scenes button').nth(1).click();await p.waitForTimeout(800);
  assert(!(await snap()).busy);assert(!(await snap()).soilAuto);assert.equal(await p.locator('[data-cut-line]').count(),0);assert(await p.locator('#soilPlay').isDisabled());
  await p.screenshot({path:path.join(out,'choose-before-playing.png')});
  await speed('reduced');await p.locator('#soilHeight').selectOption('4');assert.equal(await p.locator('[data-cut-line]').getAttribute('data-cut-line'),'4');
  await p.locator('#soilPlay').click();await p.waitForFunction(()=>!Narasu.snapshot().soilAuto);
  let s=await snap();assert(!s.state.soilComplete);assert(!s.state.soilBlocked);assert(s.state.values.some(v=>v!==3));assert.equal(s.visual.soil.grains.length,96);
  // A low cut jams naturally; it must not secretly replace the terrain with the answer.
  await p.locator('#soilHeight').selectOption('1');await p.locator('#soilPlay').click();await p.waitForFunction(()=>!Narasu.snapshot().soilAuto);
  s=await snap();assert(s.state.soilBlocked);assert.equal(s.visual.soil.grains.length,96);assert.match(await p.locator('#message').innerText(),/行き場/);
  await p.locator('#soilHeight').selectOption('4');await p.locator('#soilMode').selectOption('layers');await speed('normal');await p.locator('#soilPlay').click();
  await p.waitForFunction(()=>Narasu.snapshot().visual.soil.kind==='lower',{},{timeout:25000});await p.locator('#pause').click();
  const paused=(await snap()).visual;assert(paused.soil.vehicle.height<=4&&paused.soil.vehicle.height>=3);await p.waitForTimeout(150);assert.deepEqual((await snap()).visual,paused);
  await p.screenshot({path:path.join(out,'lower-after-first-layer.png')});await p.locator('#pause').click();await p.waitForFunction(()=>!Narasu.snapshot().soilAuto);
  s=await snap();assert(s.state.soilComplete);assert.deepEqual(s.state.values,[3,3,3,3]);assert.equal(s.visual.soil.vehicle.height,3);
  // Reopening retains the chosen pattern, but never starts without the play button.
  await p.reload();await p.locator('#resumeYes').click();assert.equal(await p.locator('#soilHeight').inputValue(),'4');assert.equal(await p.locator('#soilMode').inputValue(),'layers');assert(!(await snap()).soilAuto);
  await p.locator('#reset').click();assert(!(await snap()).busy);assert.deepEqual((await snap()).state.values,[5,4,1,2]);
  const layouts=[];for(const viewport of [{width:1280,height:720},{width:390,height:844}]){
   await p.setViewportSize(viewport);assert(await p.locator('#soilPlay').isVisible());assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await p.screenshot({path:path.join(out,`controls-${viewport.width}.png`),fullPage:true});layouts.push(viewport);
  }
  await p.locator('#scenes button').nth(2).click();const averages=[];
  for(let i=0;i<4;i++){await p.locator('#subnav button').nth(i).click();s=await snap();const total=s.state.original.reduce((a,b)=>a+b,0);averages.push(total/s.state.original.length);assert(s.state.original.every(v=>v%10===0));}
  assert.deepEqual(averages,[120,100,150,160]);assert.equal(new Set(averages).size,4);assert.deepEqual(errors,[]);
  console.log('PASS: no initial line/playback, selected cut height, partial/jammed soil, descending layers, conservation, pause/resume/reset, responsive controls, varied round water averages');
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
