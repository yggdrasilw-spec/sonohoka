const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const out=path.resolve(__dirname,'../.portfolio-work/heikin-jug-examples');fs.mkdirSync(out,{recursive:true});
(async()=>{const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});const p=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/sonohoka/heikin_narasu.html`);
  await p.locator('#settingsOpen').click();await p.locator('#speed').selectOption('reduced');await p.locator('#settings button.primary').click();
  await p.locator('#scenes button').nth(3).click();
  const snap=()=>p.evaluate(()=>Narasu.snapshot());
  async function finish(){await p.waitForFunction(()=>!Narasu.snapshot().busy);const s=await snap();assert.equal(s.state.values.reduce((a,b)=>a+b,0)+s.state.jug,s.state.original.reduce((a,b)=>a+b,0));return s;}
  assert.equal(await p.locator('#subnav button').count(),7);
  for(const n of [2,3,4,5,6,8,10]){
   await p.locator('#subnav button').filter({hasText:new RegExp('^'+n+'この')}).click();
   let s=await snap();assert.equal(s.state.values.length,n);assert.equal(await p.locator('[data-col]').count(),n);assert.equal(await p.locator('.leveled-label').count(),0);
   const original=s.state.original,total=original.reduce((a,b)=>a+b,0);
   const cups=await p.locator('[data-col] [data-vessel]').evaluateAll(es=>es.map(e=>{const b=e.getBoundingClientRect();return {x:b.x,width:b.width};}));
   for(let i=1;i<cups.length;i++)assert(cups[i-1].x+cups[i-1].width<cups[i].x,'cups must not overlap');
   if(n===10)await p.screenshot({path:path.join(out,'10-cups-start.png'),fullPage:true});
   for(let i=0;i<n;i++){await p.locator(`[data-col="${i}"]`).click();await finish();}
   s=await snap();assert.equal(s.state.jug,total);assert.equal(await p.locator('[data-division-mark]').count(),n-1);assert.equal(await p.locator('.leveled-label').count(),0);
   if(n===10)await p.screenshot({path:path.join(out,'10-cups-collected.png'),fullPage:true});
   await p.locator('#divide').click();assert.equal(await p.locator('.leveled-label').count(),0);s=await finish();assert(s.state.values.every(v=>v===total/n));assert.equal(s.state.jug,0);assert.equal(await p.locator('.leveled-label').innerText(),'ならせたね！');
   if(n===10){
    await p.screenshot({path:path.join(out,'10-cups-leveled.png'),fullPage:true});
    await p.reload();await p.locator('#resumeYes').click();assert.equal((await snap()).state.values.length,10);assert.equal(await p.locator('.leveled-label').innerText(),'ならせたね！');
    await p.locator('#undo').click();assert.equal((await snap()).state.jug,total);assert.equal(await p.locator('.leveled-label').count(),0);
   }
  }
  // Teacher custom amounts can use ten full cups and resume a 3,000 mL pitcher.
  await p.locator('#settingsOpen').click();await p.locator('#custom').fill(Array(10).fill(300).join(','));await p.locator('#apply').click();
  for(let i=0;i<10;i++){await p.locator(`[data-col="${i}"]`).click();await finish();}
  assert.equal((await snap()).state.jug,3000);await p.reload();await p.locator('#resumeYes').click();assert.equal((await snap()).state.jug,3000);
  await p.locator('#next').click();await p.reload();await p.locator('#resumeYes').click();assert.equal((await snap()).state.stage,4);assert.equal((await snap()).state.values.length,10);
  await p.locator('#scenes button').nth(3).click();await p.locator('#subnav button').last().click();
  for(const viewport of [{width:1280,height:720},{width:390,height:844}]){await p.setViewportSize(viewport);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.join(out,`layout-${viewport.width}.png`),fullPage:true});}
  await p.setViewportSize({width:1280,height:720});await p.locator('#scenes button').nth(5).click();await p.locator('#next').click();await p.locator('#next').click();await p.locator('#next').click();
  assert(await p.locator('#drawing').isHidden());await p.locator('#answer').fill('999');await p.locator('#answerForm button').click();assert.equal(await p.locator('.leveled-label').count(),0);
  await p.locator('#answer').fill('100');await p.locator('#answerForm button').click();assert.equal(await p.locator('.leveled-label').innerText(),'正解！');await p.screenshot({path:path.join(out,'practice-correct.png'),fullPage:true});
  await p.locator('#undo').click();assert.equal(await p.locator('.leveled-label').count(),0);
  assert.deepEqual(errors,[]);console.log('PASS: seven pitcher examples, 2–10 nonoverlapping cups, collect/divide conservation, completion/undo/resume, 3,000 mL custom data, responsive layouts, practice correct/incorrect/undo');
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
