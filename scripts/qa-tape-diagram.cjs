const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('../tape-diagram/engine.js');
const out='C:/Users/user/.cache/tape-diagram-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:1000}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto('file:///C:/Users/user/sonohoka/tape-diagram/index.html');
  assert(await page.locator('#intro').isVisible());await page.evaluate(()=>TapeLessonApp.start(TAPE_LESSONS[0]));
  const source=await page.evaluate(()=>window.TAPE_LESSONS);assert.equal(source.length,12);
  const next=async()=>{assert(await page.locator('#next').isEnabled());await page.locator('#next').click();};
  async function select(id){await page.locator('#settingsButton').click();await page.locator('#lessonSelect').selectOption(id);await page.locator('#settingsButton').click();}
  async function run(l){
   const model=E.model(l);await select(l.id);
   await next();await next();
   if(!l.continuous){
    const actual=await page.locator('.piece[data-key]').count();
    const expected=l.kind==='compare'?(l.unknown==='total'?0:model.total)+(l.unknown==='left'?0:l.left):l.kind==='decrease'&&l.unknown!=='total'?model.total:(l.unknown==='left'?0:l.left)+(l.unknown==='right'?0:l.right);
    assert.equal(actual,expected,l.id+' circle mapping');
    for(const p of await page.locator('.piece[data-key]').all())await p.click();
    assert.equal(await page.locator('.piece.isCircle').count(),actual);
   }
   await next();await next();assert(await page.locator('#next').isDisabled());
   await page.locator('#action button').first().click();await next();
   await page.locator('#action button').first().click();await next();
   await page.locator('#action button').first().click();await next();
   assert((await page.locator('#scene').textContent()).includes('□'));
   await next();assert.equal(await page.locator('.equation').textContent(),model.equation);
  }
  for(const l of source)await run(l);
  await select('increase-small');await next();await next();
  await page.locator('#action button').click();await page.waitForFunction(()=>document.querySelectorAll('.piece[data-key]').length===document.querySelectorAll('.piece.isCircle').length);
  await next();await next();await page.locator('#action button').first().click();await next();
  // Actual pointer drawing: a short stroke must not count as a completed tape.
  const box=await page.locator('.drawSurface').boundingBox();const p=(a,b)=>({x:box.x+a*box.width/900,y:box.y+b*box.height/300});
  let a=p(100,140),b=p(180,140);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y);await page.mouse.up();assert(await page.locator('#next').isDisabled());
  b=p(537.5,140);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:8});await page.mouse.up();assert(await page.locator('#next').isEnabled());
  await next();await page.locator('#action button').click();await next();await page.waitForTimeout(800);await page.screenshot({path:out+'/increase-desktop.png',fullPage:true});
  await select('decrease-small');await next();await next();for(const dot of await page.locator('.piece').all())await dot.click();await next();await next();await page.locator('#action button').first().click();await next();await page.locator('#action button').click();await next();
  const partition=await page.locator('.partition,.trace').last().boundingBox();await page.mouse.click(partition.x,partition.y+partition.height/2);assert(await page.locator('#next').isEnabled());await next();await page.waitForTimeout(800);await page.screenshot({path:out+'/decrease-desktop.png',fullPage:true});
  // Import data is displayed as text, and malicious or invalid inputs are rejected.
  await page.locator('#settingsButton').click();const custom={...source[2],id:'custom',left:9,right:4,title:'<img src=x onerror=alert(1)>',story:[]};
  await page.locator('#import').setInputFiles({name:'lesson.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(custom))});await page.waitForFunction(title=>document.getElementById('lessonTitle').textContent===title,custom.title);assert.equal(await page.locator('#lessonTitle img').count(),0);
  await page.locator('#imageA').setInputFiles('C:/Users/user/sonohoka/tape-diagram/assets/red-flower.png');await page.waitForFunction(()=>document.getElementById('settingsMessage').textContent.includes('画像を選びました'));
  await page.locator('#customForm button[type=submit]').click();assert.equal(await page.locator('.piece img').count(),9);
  await page.locator('#settingsButton').click();const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;await download.saveAs(out+'/custom.json');const exported=JSON.parse(fs.readFileSync(out+'/custom.json'));assert.equal(exported.left,9);assert(exported.imageA.startsWith('data:image/png;base64,'));
  await page.locator('#import').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...custom,left:-1}))});await page.waitForFunction(()=>document.getElementById('settingsMessage').textContent.includes('読みこめません'));
  assert.throws(()=>E.model({...custom,imageA:'javascript:alert(1)'}));assert.throws(()=>E.model({...custom,unknown:'other'}));assert.throws(()=>E.model({...custom,left:1.5}));
  await page.locator('#settingsButton').click();await select('compare-small');
  await page.setViewportSize({width:390,height:844});await next();await next();for(const dot of await page.locator('.piece').all())await dot.click();await next();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.waitForTimeout(800);await page.screenshot({path:out+'/compare-mobile.png',fullPage:true});
  await next();await page.locator('#action button').first().click();await next();await page.locator('#action button').click();await next();await page.locator('#action button').click();await next();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.waitForTimeout(800);await page.screenshot({path:out+'/compare-tape-mobile.png',fullPage:true});
  await page.setViewportSize({width:1280,height:1000});await select('combine-large');await next();await next();await page.locator('#action button').click();await page.waitForFunction(()=>document.querySelectorAll('.piece.isCircle').length===55);await next();await page.waitForTimeout(800);await page.screenshot({path:out+'/large-circles.png',fullPage:true});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,lessons:source.length,pointerDrawing:true,partition:true,customImages:true,exportImport:true,mobileOverflow:false,screenshots:out},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
