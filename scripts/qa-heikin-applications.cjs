const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const out=path.resolve(__dirname,'../.portfolio-work/heikin-applications');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser,samples=0;const errors=[];
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1366,height:900}});page.on('pageerror',e=>errors.push(e.message));
  const url=`http://127.0.0.1:${server.address().port}/sonohoka/heikin_narasu.html`;await page.goto(url);
  const snap=()=>page.evaluate(()=>Narasu.snapshot());
  const app=async()=>((await snap()).state.application);
  async function choose(i){await page.locator('#appProblem').selectOption(String(i));assert.equal((await app()).index,i);assert.equal((await app()).solved,false);assert.equal(await page.locator('#appEquation').count(),0);}
  async function input(value){await page.locator('#appAnswer').fill(String(value));await page.locator('#appAnswerForm button').click();}
  async function finish(){for(let n=0;n<450;n++){
   const s=await snap();if(s.application.values){const actual=s.application.values.filter(x=>x!==null).reduce((a,b)=>a+b,0),expected=await page.evaluate(()=>NarasuApplications.stats(Narasu.snapshot().state.application).total);assert(Math.abs(actual-expected)<1e-8,`conservation: ${actual} vs ${expected}`);assert(s.application.values.every(x=>x===null||x>=0));samples++;}
   if(!s.busy)return s;await page.waitForTimeout(20);
  }throw Error('animation timeout');}
  await page.locator('#scenes button').nth(6).click();assert(await page.locator('#applications').isVisible());assert(await page.locator('#drawing').isHidden());
  await page.locator('#settingsOpen').click();await page.locator('#speech').uncheck();await page.locator('#effects').uncheck();await page.locator('#speed').selectOption('reduced');await page.locator('#settings button.primary').click();
  const answers=[80,55,28.5,2.5,80,150.5,7.7,647];
  for(let i=0;i<answers.length;i++){
   await choose(i);const count=[5,7,4,6,5,5,5,3][i];assert.equal(await page.locator('.appCard svg').count(),count);assert.equal(await page.locator('[data-app-bar]').count(),count);
   if([3,6].includes(i)){
    assert(await page.locator('#appAnswer').isDisabled());assert(await page.locator('#appDemo').isDisabled());
    await page.locator('.appChoice button').nth(0).click();assert(await page.locator('#appAnswer').isDisabled());
    await page.locator('.appChoice button').nth(1).click();assert(await page.locator('#appAnswer').isEnabled());
   }
   if(i===6){assert.equal(await page.locator('[data-value="excluded"]').count(),1);assert.equal(await page.locator('.appCard.excluded').count(),1);assert.match(await page.locator('.appQuestion').innerText(),/手が当たって/);}
   if(i===3){assert.equal(await page.locator('[data-value="0"]').count(),1);assert.equal(await page.locator('[data-value="excluded"]').count(),0);}
   await input(999);assert.equal((await app()).solved,false);
   await page.locator('#appAnswer').fill('17');await page.locator('#hint').click();assert.equal(await page.locator('#appAnswer').inputValue(),'17');assert.equal((await app()).hint,1);
   await page.locator('#appDemo').click();await finish();assert.equal((await app()).solved,false);assert.equal((await app()).leveled,true);
   const bars=await page.locator('[data-app-bar]:not([data-value="excluded"])').evaluateAll(es=>es.map(e=>Number(e.dataset.value)));assert(bars.every(x=>Math.abs(x-answers[i])<1e-8));
   await input(answers[i]);
   if(i===4||i===7){assert.equal((await app()).step,1);assert.equal((await app()).solved,false);assert(await page.locator('#appAnswer').evaluate(e=>e===document.activeElement));await input(i===4?1600:65);}
   assert.equal((await app()).solved,true);assert(await page.locator('#message .leveled-label').isVisible());assert(await page.locator('#appReflection').isVisible());
   if(i===2)assert.match(await page.locator('#appReflection').innerText(),/必ずあるとは限らない/);
   if(i===3)assert.match(await page.locator('#appReflection').innerText(),/実際に2.5点/);
   if(i===4)assert.match(await page.locator('#appEquation').innerText(),/80 × 20 ＝ 1600/);
   if(i===6){assert.match(await page.locator('#appEquation').innerText(),/30.8 ÷ 4 ＝ 7.7/);assert.match(await page.locator('#appReflection').innerText(),/小さい値だから/);}
   if(i===7)assert.match(await page.locator('#appEquation').innerText(),/647 ÷ 10 ＝ 64.7 cm → 約 65/);
   await page.screenshot({path:path.join(out,`problem-${i+1}.png`),fullPage:true});
  }
  // Undo, saved work, stage transitions and stale animation callbacks.
  await page.locator('#undo').click();assert.equal((await app()).solved,false);assert.equal((await app()).step,1);
  await page.reload();await page.locator('#resumeYes').click();assert.equal((await app()).index,7);assert.equal((await app()).step,1);await input(65);assert.equal((await app()).solved,true);
  await choose(0);await page.locator('#settingsOpen').click();await page.locator('#speed').selectOption('normal');await page.locator('#settings button.primary').click();
  await page.locator('#appDemo').click();await page.waitForFunction(()=>Narasu.snapshot().application.values!==null);await page.locator('#pause').click();const frozen=(await snap()).application.values;await page.waitForTimeout(160);assert.deepEqual((await snap()).application.values,frozen);await page.locator('#pause').click();
  await page.locator('#reset').click();await page.waitForTimeout(200);assert.equal((await app()).leveled,false);assert.equal((await snap()).busy,false);
  await page.locator('#appDemo').click();await page.locator('#appProblem').selectOption('6');await page.waitForTimeout(200);assert.equal((await app()).index,6);assert.equal((await app()).leveled,false);
  await page.locator('.appChoice button').nth(1).click();await page.locator('#appDemo').click();await page.locator('#scenes button').nth(0).click();await page.waitForTimeout(200);assert.equal((await snap()).state.stage,0);assert.equal((await snap()).busy,false);assert(await page.locator('#drawing').isVisible());assert(await page.locator('#applications').isHidden());
  // Responsive access for every problem, before and after choosing counted data.
  await page.locator('#scenes button').nth(6).click();
  for(const width of [1280,768,390,320]){
   await page.setViewportSize({width,height:900});for(let i=0;i<8;i++){await choose(i);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px problem ${i}`);}
   await choose(6);await page.locator('.appChoice button').nth(1).click();await page.screenshot({path:path.join(out,`layout-${width}.png`),fullPage:true});
  }
  // Legacy saves remain accepted; invalid application state does not reach a renderer.
  const validation=await page.evaluate(()=>{const record={state:Narasu.snapshot().state};return [Narasu.validateInput(record),Narasu.validateInput({state:{...record.state,application:{...record.state.application,index:99}}}),Narasu.validateInput({state:{...record.state,application:{...record.state.application,choice:0,solved:true}}})];});assert.deepEqual(validation,[true,false,false]);
  assert.deepEqual(errors,[]);console.log(`PASS: 8 illustrated applications, 2-step estimates/rounding, zero vs failed trials, ${samples} conservation samples, pause/reset/undo/cancel/resume, 32 responsive cases`);
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
