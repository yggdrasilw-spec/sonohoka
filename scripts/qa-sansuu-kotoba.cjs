const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const out=path.resolve(__dirname,'../.portfolio-work/sansuu-kotoba');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const errors=[],badResponses=[];
 try{
  const page=await browser.newPage({viewport:{width:1280,height:1000}});
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)badResponses.push(r.url())});
  await page.goto(`http://127.0.0.1:${server.address().port}/sonohoka/sansuu_kotoba.html`);
  await page.locator('#frame').evaluate(img=>img.decode());
  assert.equal(await page.locator('[data-mode="numbers"]').isDisabled(),true);
  const terms={subtract:['引かれる数','引く数'],multiply:['かけられる数','かける数'],divide:['わられる数','わる数'],add:['たされる数','たす数']};
  let frames=0,questions=0;
  for(const scene of ['push',...Object.keys(terms)]){
   await page.locator(`[data-scene="${scene}"]`).click();
   for(let f=0;f<4;f++){
    const n=await page.locator('#frame').evaluate(async img=>{await img.decode();return img.naturalWidth;});assert(n>0);frames++;
    await page.locator('#step').click();
   }
   if(scene!=='push'){
    await page.locator('[data-mode="numbers"]').click();assert.equal(await page.locator('#left-term').innerText(),terms[scene][0]);assert.equal(await page.locator('#right-term').innerText(),terms[scene][1]);
    const aligned=await page.evaluate(()=>{const c=id=>{const r=document.getElementById(id).getBoundingClientRect();return r.x+r.width/2};return Math.abs(c('left-number')-c('left-person'))<1&&Math.abs(c('right-number')-c('right-person'))<1});assert(aligned,'people and numbers keep same x positions');
   }
   await page.locator('[data-mode="quiz"]').click();
   assert.equal(await page.locator('#mapping').isHidden(),true);
   if(scene!=='push')assert.equal(await page.locator('#left-term').innerText(),'？');
   await page.locator('[data-answer="right"]').click();assert.match(await page.locator('#feedback').innerText(),/もう一度/);
   await page.locator('[data-answer="left"]').click();assert.match(await page.locator('#feedback').innerText(),/先/);questions++;
   await page.locator('#next').click();await page.locator('[data-answer="right"]').click();assert.match(await page.locator('#feedback').innerText(),/根元/);questions++;
   await page.locator('[data-mode="people"]').click();
  }
  await page.locator('[data-scene="multiply"]').click();await page.locator('[data-mode="numbers"]').click();
  assert.equal(await page.locator('#left-number').innerText(),'4');assert.equal(await page.locator('#right-number').innerText(),'3');
  const direction=await page.evaluate(()=>{const a=document.getElementById('arc');return {start:a.getPointAtLength(0).x,end:a.getPointAtLength(a.getTotalLength()).x,marker:a.getAttribute('marker-end')}});assert(direction.start>direction.end);assert.equal(direction.marker,'url(#arrow-tip)');
  await page.locator('#play').click();await page.waitForTimeout(420);assert.notEqual(await page.locator('#frame-count').innerText(),'1 / 4 コマ');
  await page.locator('[data-scene="divide"]').click();await page.waitForTimeout(800);assert.equal(await page.locator('#frame-count').innerText(),'1 / 4 コマ','scene switch cancels playback');
  await page.locator('#step').click();assert.equal(await page.locator('#frame-count').innerText(),'2 / 4 コマ');await page.locator('#restart').click();assert.equal(await page.locator('#frame-count').innerText(),'1 / 4 コマ');
  await page.locator('[data-scene="multiply"]').click();await page.screenshot({path:path.join(out,'desktop.png'),fullPage:true});
  for(const width of [375,390,768]){
   await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`no horizontal overflow ${width}`);
   for(const scene of ['push',...Object.keys(terms)]){
    await page.locator(`[data-scene="${scene}"]`).click();const bounds=await page.locator('#mapping').evaluate(el=>[...el.querySelectorAll('strong')].map(x=>({client:x.clientWidth,scroll:x.scrollWidth})));assert(bounds.every(x=>x.scroll<=x.client),`labels fit ${width} ${scene}`);
   }
  }
  await page.setViewportSize({width:390,height:844});await page.locator('[data-scene="multiply"]').click();await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>Math.abs(Number(document.getElementById('traveler').getAttribute('cx'))-550)<1);const start=await page.locator('#traveler').getAttribute('cx');await page.locator('#step').click();assert.equal(await page.locator('#traveler').getAttribute('cx'),start,'reduced motion arrow stays still');
  await page.getByRole('button',{name:'① 人で見る'}).focus();await page.keyboard.press('Enter');assert.equal(await page.locator('[data-mode="people"]').getAttribute('aria-pressed'),'true');
  assert.deepEqual(errors,[]);assert.deepEqual(badResponses,[]);
  console.log(JSON.stringify({frames,questions,viewports:[1280,375,390,768],arrow:'right to left',alignment:'people and numbers match',errors,badResponses},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
