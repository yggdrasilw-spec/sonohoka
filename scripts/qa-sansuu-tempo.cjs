const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const examples={subtract:{a:7,b:2,op:'−',result:5,total:7},add:{a:4,b:3,op:'＋',result:7,total:7},multiply:{a:4,b:3,op:'×',result:12,total:12},divide:{a:8,b:2,op:'÷',result:4,total:8}};
(async()=>{
 const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1180,height:720}}),errors=[],timings={};
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.spoken=[];
   Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],speak:u=>{spoken.push(u.text);setTimeout(()=>u.onend?.(),0);},cancel:()=>{}}});
   window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/sonohoka/sansuu_kotoba.html`);
  await page.locator('#play').click();await page.waitForTimeout(800);
  assert.equal(await page.locator('#frame-count').innerText(),'4 / 4 コマ');
  await page.locator('#play').click();
  let samples=0;
  for(const [scene,s] of Object.entries(examples)){
   await page.locator(`[data-scene="${scene}"]`).click();
   await page.locator('[data-mode="numbers"]').click();
   if(await page.locator('[data-number-view="blocks"]').getAttribute('aria-pressed')!=='true')await page.locator('[data-number-view="blocks"]').click();
   else{await page.locator('#restart').click();await page.locator('#play').click();}
   const start=Date.now();
   await page.waitForFunction(()=>document.getElementById('block-stage').dataset.phase==='count',null,{timeout:7500});
   timings[scene]={toCount:Date.now()-start};
   await page.waitForFunction(()=>document.getElementById('block-stage').dataset.phase==='answer',null,{timeout:3500});
   timings[scene].total=Date.now()-start;
   assert(timings[scene].total<10000,'full sequence stays under ten seconds at normal speed');
   assert.equal(await page.locator('#block-stage').getAttribute('data-answer'),String(s.result));
   assert.equal(await page.locator('#play').getAttribute('aria-pressed'),'false');
   const failures=await page.evaluate(({scene,s})=>{
    const failures=[];
    for(let t=0;t<=20100;t+=25){
     LessonBlocks.render(scene,s,t);
     const svg=document.getElementById('block-stage'),units=[...svg.querySelectorAll('[data-block]')],hand=svg.querySelector('[data-glove]');
     if(units.length!==s.total)failures.push(`${t}: block total`);
     if(scene==='divide'&&+svg.dataset.sourceCount + +svg.dataset.heldCount + +svg.dataset.placedCount!==s.a)failures.push(`${t}: lost blocks`);
     const expected=Math.max(0,Math.min(s.result,Math.floor((t-16600)*s.result/3000+1e-7)));
     if(units.filter(u=>u.dataset.counted==='true').length!==expected)failures.push(`${t}: count`);
     if(hand&&scene==='subtract'){
      const link=svg.querySelector('[data-rope-link]');
      if(Math.hypot(+hand.dataset.ropeEntryX - +link.dataset.endX,+hand.dataset.ropeEntryY - +link.dataset.endY)>.01)failures.push(`${t}: rope detached`);
     }
     if(hand&&scene==='add'&&t>=7964&&t<=14824){
      const edge=Math.max(...units.filter(u=>u.dataset.group==='1').map(u=>u.transform.baseVal.consolidate().matrix.e+50));
      if(Math.abs(+hand.dataset.contactX-edge)>.01)failures.push(`${t}: push detached`);
     }
    }
    return failures;
   },{scene,s});
   assert.deepEqual(failures,[]);samples+=805;
   await page.locator('#restart').click();await page.locator('#play').click();await page.waitForTimeout(200);await page.locator('#play').click();
   const paused=await page.locator('#block-stage').innerHTML();await page.waitForTimeout(150);
   assert.equal(await page.locator('#block-stage').innerHTML(),paused);
  }
  assert.deepEqual(await page.evaluate(()=>spoken),[],'animation and stepping have no automatic narration even with voice on');
  await page.locator('#step').click();assert.deepEqual(await page.evaluate(()=>spoken),[]);
  await page.locator('#read-aloud').click();await page.waitForTimeout(80);
  assert((await page.evaluate(()=>spoken)).length>0,'explicit reading of role terms remains available');
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#restart').click();await page.locator('#play').click();
  assert.equal(await page.locator('#block-stage').getAttribute('data-answer'),'4');
  assert.equal(await page.locator('#play').getAttribute('aria-pressed'),'false');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{
   const s={a:8,b:2,op:'÷'},t=8160,steps=LessonBlocks.steps('divide',s);
   LessonBlocks.render('divide',s,t);
   document.getElementById('caption').textContent=LessonBlocks.caption('divide',s,t);
   document.getElementById('frame-count').textContent=`${steps.filter(x=>x<=t).length} / ${steps.length} ステップ`;
  });
  await page.screenshot({path:'.portfolio-work/sansuu-kotoba/snappy-divide.png'});
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({timings,samples,automaticNarration:false,pause:'passed',reducedMotion:'passed',errors},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
