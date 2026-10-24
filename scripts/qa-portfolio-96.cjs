const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.portfolio-work/demo-96');
(async()=>{const remote=process.argv.includes('--public'),server=remote?null:serve();if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=remote?'https://yggdrasilw-spec.github.io/sonohoka/':`http://127.0.0.1:${server.address().port}/sonohoka/`;
const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'app_links_portfolio.html?q=平均');const card=page.locator('#app-96');assert.equal(await card.count(),1);assert(await card.isVisible());assert.equal(await card.locator('.actions a').getAttribute('href'),'heikin_narasu.html');
 const ids=await page.locator('article.card').evaluateAll(cards=>cards.map(c=>c.id));assert.equal(new Set(ids).size,ids.length);
 for(const q of ['平均','ならす','ブルドーザー','合計 個数','平均 特別支援']){await page.locator('#searchInput').fill(q);assert(await card.isVisible(),q);}
 await page.locator('#gradeSelect').selectOption('5');await page.locator('#categorySelect').selectOption('算数');assert(await card.isVisible());
 await card.locator('img').evaluate(e=>e.decode());await card.locator('.card-media').hover();await page.waitForFunction(()=>document.querySelector('#app-96 video').currentTime>.15&&document.querySelector('#app-96 .card-media').classList.contains('is-hover'));
 await page.mouse.move(5,5);assert(await card.locator('video').evaluate(v=>v.paused));await card.screenshot({path:path.join(out,'portfolio-card.png')});
 await card.locator('.card-media').click();await page.waitForFunction(()=>document.querySelector('#mediaModal video').currentTime>.15);
 const video=page.locator('#mediaModal video'),meta=await video.evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,muted:v.muted}));assert(meta.duration>9&&meta.duration<=10);assert.equal(meta.width,1280);assert.equal(meta.height,720);assert(meta.muted);assert((await page.locator('#modalAppLink').getAttribute('href')).endsWith('/heikin_narasu.html'));
 for(const [name,time] of [['opening',.3],['beads',1.7],['soil',4.4],['divide',6.9],['formula',9.2]]){await video.evaluate(async(v,time)=>{v.pause();await new Promise((resolve,reject)=>{v.onseeked=resolve;v.currentTime=time;setTimeout(()=>reject(Error('seek timeout')),8000);});},time);await video.screenshot({path:path.join(out,`export-${name}.png`)});}
 await page.keyboard.press('Escape');assert(!(await page.locator('#mediaModal').isVisible()));assert(await video.evaluate(v=>v.paused&&!v.hasAttribute('src')));
 await page.emulateMedia({reducedMotion:'reduce'});await card.locator('.card-media').hover();assert(await card.locator('video').evaluate(v=>v.paused));
 for(const width of [390,320]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await card.screenshot({path:path.join(out,`card-${width}.png`)});await card.locator('.card-media').click();await page.waitForFunction(()=>document.querySelector('#mediaModal video').currentTime>.1);await page.keyboard.press('Escape');}
 if(remote){for(const file of ['app_links_portfolio.html','media/portfolio-96-intro.mp4','media/portfolio-96-intro.png']){const response=await page.request.get(base+file+'?v='+Date.now());assert(response.ok(),file+' '+response.status());const bytes=await response.body(),local=fs.readFileSync(path.join(root,file));const normalize=b=>file.endsWith('.html')?Buffer.from(b.toString('utf8').replace(/\r\n/g,'\n')):b;const hash=b=>crypto.createHash('sha256').update(normalize(b)).digest('hex');assert.equal(hash(bytes),hash(local),file+' public hash');}}
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,remote?'qa-public.json':'qa-local.json'),JSON.stringify({meta,errors,cards:ids.length,remote},null,2));console.log('PASS portfolio-96',remote?'public':'local',meta);
}finally{await browser.close();server?.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
