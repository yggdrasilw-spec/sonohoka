const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
(async()=>{
 const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/sonohoka/heikin_narasu.html`);
  const snap=()=>page.evaluate(()=>Narasu.snapshot());
  async function check(){
   const s=await snap();
   const shown=await page.locator('[data-col]').evaluateAll(cols=>cols.map(col=>Array.from(col.querySelectorAll('[data-bead-color]'),e=>Number(e.dataset.beadColor))));
   assert.deepEqual(shown,s.visual.beadColors);
   const fills=await page.locator('[data-bead-color]').evaluateAll(es=>es.every(e=>e.getAttribute('fill')===(e.dataset.beadColor==='0'?'#f3efe2':'#334854')));assert(fills);
   return s;
  }
  async function move(from,to){
   const before=(await snap()).state,color=before.beadColors[from].at(-1),expected=structuredClone(before.beadColors);
   expected[to].push(expected[from].pop());
   await page.locator(`[data-col="${from}"]`).click();await page.locator(`[data-col="${to}"]`).click();
   await page.waitForFunction(()=>document.querySelector('[data-moving-bead]'));
   await page.locator('#pause').click();assert.equal(Number(await page.locator('[data-moving-bead]').getAttribute('data-bead-color')),color);
   const during=await check();assert.equal(during.visual.beadColors.flat().length+1,before.beadColors.flat().length);
   await page.locator('#pause').click();await page.waitForFunction(()=>!Narasu.snapshot().busy);
   assert.deepEqual((await check()).state.beadColors,expected);
  }
  const initial=(await check()).state;
  await move(0,2);assert.deepEqual((await snap()).state.beadColors[2],[0,0]); // White stays white above white.
  await move(1,3);assert.deepEqual((await snap()).state.beadColors[3],[0,1,1]); // Black stays black above black.
  await move(3,2); // The same black bead moves again.
  const saved=(await snap()).state;
  await page.reload();await page.locator('#resumeYes').click();assert.deepEqual((await check()).state,saved);
  await page.locator('#undo').click();assert.deepEqual((await check()).state.beadColors[3],[0,1,1]);
  await page.locator('#reset').click();assert.deepEqual((await check()).state.beadColors,initial.beadColors);
  await page.locator('[data-col="1"]').click();await page.locator('[data-col="2"]').click();await page.locator('#undo').click();assert.deepEqual((await check()).state.beadColors,initial.beadColors);
  // A pre-change save and its history migrate without changing visible alternating colors.
  await page.evaluate(()=>{const key='heikin-narasu-v1',record=JSON.parse(localStorage.getItem(key));delete record.state.beadColors;record.history=[structuredClone(record.state)];localStorage.setItem(key,JSON.stringify(record));});
  await page.reload();await page.locator('#resumeYes').click();assert.deepEqual((await check()).state.beadColors,initial.beadColors);
  await page.locator('#undo').click();await check();await move(1,2);
  await page.locator('#scenes button').nth(5).click();await check();await move(0,1); // Practice uses the same color model.
  assert.deepEqual(errors,[]);console.log('PASS: white/black bead colors during and after moves, repeated moves, undo, reset, cancellation, save/resume, legacy saves and practice');
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
