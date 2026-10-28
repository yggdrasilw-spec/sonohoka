const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.portfolio-work/my-town');
const server=http.createServer((req,res)=>{let name=decodeURIComponent(req.url.split('?')[0]);if(name.endsWith('/'))name+='index.html';const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{document.addEventListener('DOMContentLoaded',()=>{const sound=document.getElementById('sound');if(sound?.getAttribute('aria-pressed')==='true')sound.click();});});
 await p.goto(`http://127.0.0.1:${server.address().port}/my-town/`);
  await p.locator('[data-id="library"]').click();await p.locator('#go-to-map').click();assert.match(await p.locator('#placement-preview').innerText(),/library/);
  await p.locator('.plot').nth(0).click();await p.locator('.plot').nth(1).click();
  await p.locator('#open-map').click();
  assert.equal(await p.locator('#large-endpoints #pick-start').count(),1);
  await p.locator('#pick-start').click();await p.locator('.plot').nth(0).click();
  assert.equal(await p.locator('#start').inputValue(),'0');assert.equal(await p.locator('#pick-goal').getAttribute('aria-pressed'),'true');
  await p.locator('.plot').nth(0).click();assert.equal(await p.locator('#goal').inputValue(),'');
  await p.locator('.plot').nth(2).click();assert.equal(await p.locator('#goal').inputValue(),'');
  await p.locator('.plot').nth(1).click();assert.equal(await p.locator('#goal').inputValue(),'1');assert.equal(await p.locator('#pick-goal').getAttribute('aria-pressed'),'false');
  await p.keyboard.press('Escape');await p.locator('.map-panel #pick-start').waitFor();assert.equal(await p.locator('.map-panel #pick-start').count(),1);
  assert.equal(await p.locator('#directions li').count(),0);
  await p.locator('#speed').selectOption('0');await p.locator('#map-guide [data-map-action="next"]').click();await p.waitForFunction(()=>!MyTown.snapshot().busy);
  assert.equal(await p.locator('#inline-instruction').innerText(),'Start at the library.');
  while(!await p.locator('#next').isDisabled()){await p.locator('#map-guide [data-map-action="next"]').click();await p.waitForFunction(()=>!MyTown.snapshot().busy);}
  assert.match(await p.locator('#guide-progress').innerText(),/到着/);
  await p.locator('#map-guide [data-map-action="stop"]').click();assert.equal(await p.locator('#directions li').count(),0);assert(!await p.locator('#next').isDisabled());
  // Replacing an endpoint with vocabulary that is not a destination clears it immediately, including on reload.
  await p.locator('#edit-tab').click();await p.locator('#category').selectOption('all');await p.locator('[data-id="street"]').click();await p.locator('.plot').nth(0).click();
  assert.equal((await p.evaluate(()=>MyTown.snapshot())).state.start,null);await p.reload();assert.equal((await p.evaluate(()=>MyTown.snapshot())).state.start,null);
  await p.locator('#sample').click();await p.locator('#replace-confirm').click();
  for(const [width,height] of [[1366,768],[1024,768],[768,1024],[390,844],[320,640]]){
   await p.setViewportSize({width,height});await p.locator('#edit-tab').click();
   await p.locator('[data-id="hospital"]').click();await p.locator('#go-to-map').click();
   const preview=await p.locator('#placement-tools').boundingBox();assert(preview.y>=0&&preview.y+preview.height<=height);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await p.screenshot({path:path.join(out,`usability-edit-${width}.png`),fullPage:true});
   await p.locator('#route-tab').click();await p.locator('#pick-start').click();await p.locator('.plot').nth(0).focus();await p.keyboard.press('Enter');
   await p.locator('#pick-goal').click();await p.locator('.plot').nth(3).focus();await p.keyboard.press('Enter');
   assert.equal(await p.locator('#goal').inputValue(),'3');
   await p.locator('#speed').selectOption('0');await p.locator('#map-guide [data-map-action="next"]').click();await p.waitForFunction(()=>!MyTown.snapshot().busy);
   await p.screenshot({path:path.join(out,`usability-guide-${width}.png`),fullPage:true});
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  assert.deepEqual(errors,[]);console.log('PASS: picture/map navigation, map and keyboard endpoints, invalid selections, inline guide, arrival/restart, endpoint replacement persistence; five viewport sizes');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
