const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
(async()=>{
 const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 const base=process.argv[2]||`http://127.0.0.1:${server.address().port}/sonohoka/`,out=path.resolve(__dirname,'../.portfolio-work/sansuu-kotoba');fs.mkdirSync(out,{recursive:true});
 const errors=[];let states=0;
 try{
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'sansuu_kotoba.html');await page.locator('#voice-toggle').click();
  async function check(label){
   const report=await page.evaluate(()=>{
    const selectors=['header','.scenes','.lesson-heading','.direction','.playback','#stage','#mapping','#number-panel','#caption','#quiz','.remember','.teacher-note summary'];
    const failures=[];
    for(const sel of selectors){const el=document.querySelector(sel),r=el.getBoundingClientRect();if(!r.width||!r.height)continue;if(r.top<0||r.left<0||r.right>innerWidth+1||r.bottom>innerHeight+1)failures.push(sel+' outside viewport');}
    for(const el of document.querySelectorAll('button,select')){const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(top!==el&&!el.contains(top))failures.push(el.textContent+' obscured');}
    for(const el of document.querySelectorAll('.person-label strong,.operand span')){const r=el.getBoundingClientRect();if(r.width&&el.scrollWidth>el.clientWidth+1)failures.push(el.textContent+' text overflow '+innerWidth+'x'+innerHeight+' '+el.scrollWidth+'/'+el.clientWidth);}
    const visual=document.querySelector('.visual').getBoundingClientRect(),slot=document.querySelector('.visual-slot').getBoundingClientRect();if(visual.bottom>slot.bottom+2)failures.push('diagram exceeds reserved height');
    if(document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth)failures.push('page requires scroll');
    return failures;
   });assert.deepEqual(report,[],label);states++;
  }
  for(const [width,height] of [[1366,768],[1366,640],[1366,600],[1280,600],[1024,600],[1180,620]]){
   await page.setViewportSize({width,height});
   for(const scene of ['push','subtract','multiply','divide','add']){
    await page.locator(`[data-scene="${scene}"]`).click();
    for(const mode of ['people','numbers','quiz']){
     if(scene==='push'&&mode==='numbers')continue;
     await page.locator(`[data-mode="${mode}"]`).click();await check(`${width}x${height} ${scene} ${mode}`);
     if(mode==='quiz'){
      await page.locator('#hint').click();await check('hint open');
      await page.locator('[data-answer="right"]').click();await check('retry');
      await page.locator('[data-answer="left"]').click();await check('correct with labels restored');
      await page.locator('#next').click();await check('next question');
     }
    }
   }
   await page.locator('[data-scene="multiply"]').click();await page.locator('[data-mode="numbers"]').click();
   await page.screenshot({path:path.join(out,`fit-${width}-${height}.png`)});
  }
  await page.locator('#step').click();const frame=await page.locator('#frame').getAttribute('src');await page.setViewportSize({width:390,height:844});await page.setViewportSize({width:1024,height:600});assert.equal(await page.locator('#frame').getAttribute('src'),frame,'resize preserves animation state');await check('return from portrait');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({states,errors,base}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
