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
  await page.goto(`http://127.0.0.1:${server.address().port}/sonohoka/sansuu_kotoba.html`);await page.locator('#voice-toggle').click();
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
    const aligned=await page.evaluate(()=>{const c=id=>{const r=document.getElementById(id).getBoundingClientRect();return r.x+r.width/2};const r=document.getElementById('morph-equation').getBoundingClientRect();return Math.abs(r.x+r.width*.3-c('left-person'))<1&&Math.abs(r.x+r.width*.8-c('right-person'))<1});assert(aligned,'people and numbers keep same x positions');
   }
   await page.locator('[data-mode="quiz"]').click();
   assert.equal(await page.locator('#mapping').isHidden(),true);
   if(scene!=='push')assert.equal(await page.locator('#left-term').innerText(),'？');
   await page.locator('[data-answer="right"]').click();assert.match(await page.locator('#feedback').innerText(),/もういちど/);
   await page.locator('[data-answer="left"]').click();assert.match(await page.locator('#feedback').innerText(),/先/);questions++;
   await page.locator('#next').click();await page.locator('[data-answer="right"]').click();assert.match(await page.locator('#feedback').innerText(),/ねもと/);questions++;
   await page.locator('[data-mode="people"]').click();
  }
  await page.locator('[data-scene="multiply"]').click();await page.locator('[data-mode="numbers"]').click();
  assert.equal(await page.locator('#left-number').innerText(),'4');assert.equal(await page.locator('#right-number').innerText(),'3');
  const arrows=await page.locator('.semantic-arrow').evaluateAll(ss=>ss.map(svg=>{const a=svg.querySelector('path'),len=a.getTotalLength(),start=a.getPointAtLength(0),end=a.getPointAtLength(len),mid=a.getPointAtLength(len/2),head=[...svg.querySelector('.arrow-head').points].map(p=>({x:p.x,y:p.y}));return {start:{x:start.x,y:start.y},end:{x:end.x,y:end.y},mid:{x:mid.x,y:mid.y},head,ry:Number(svg.dataset.radiusY)}}));
  for(const a of arrows){assert(a.start.x>a.end.x);assert(Math.abs(a.mid.x-550)<.1);assert(Math.abs(a.mid.y-(a.end.y-a.ry))<.1);const [tip,b1,b2]=a.head;assert.equal(tip.x,a.end.x);assert(tip.y>a.end.y);assert.equal((b1.x+b2.x)/2,tip.x);assert(b1.y<a.end.y&&b2.y<a.end.y,'shaft overlaps head along end tangent');}
  await page.locator('[data-mode="people"]').click();await page.locator('#play').click();await page.waitForTimeout(420);assert.notEqual(await page.locator('#frame-count').innerText(),'1 / 4 コマ');
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
  await page.locator('[data-scene="add"]').click();assert.match(await page.locator('#caption').innerText(),/ライスだけ/);
  await page.locator('#play').click();await page.waitForTimeout(2000);assert.equal(await page.locator('#frame-count').innerText(),'4 / 4 コマ');assert.equal(await page.locator('#play').getAttribute('aria-pressed'),'false','curry remains after adding');
  await page.locator('#play').click();assert.equal(await page.locator('#frame-count').innerText(),'1 / 4 コマ','curry replay restarts deliberately');await page.locator('#play').click();
  assert.deepEqual(errors,[]);assert.deepEqual(badResponses,[]);
  console.log(JSON.stringify({frames,questions,viewports:[1280,375,390,768],arrow:'right to left',alignment:'people and numbers match',errors,badResponses},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
