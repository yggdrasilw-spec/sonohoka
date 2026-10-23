const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const root=path.resolve(__dirname,'..');
(async()=>{
 const remote=process.argv.includes('--public'),server=remote?null:serve();if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=remote?'https://yggdrasilw-spec.github.io/sonohoka/':`http://127.0.0.1:${server.address().port}/sonohoka/`;
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'app_links_portfolio.html');if(await page.locator('#resetFiltersBtn').isVisible())await page.locator('#resetFiltersBtn').click();
  assert((await page.locator('.card').count())>=91);assert.equal(await page.locator('#app-94').count(),1);assert.equal(await page.locator('#app-85 .actions a').count(),0);
  for(const q of ['九九 たすけ舟','かけ算 忘れた','おはじき 交換法則']){await page.locator('#searchInput').fill(q);assert(await page.locator('#app-94').isVisible(),q)}
  await page.locator('#gradeSelect').selectOption('2');assert(await page.locator('#app-94').isVisible());
  assert.equal(await page.locator('#app-94 .actions a').getAttribute('href'),'kakezan_rescue.html');await page.locator('#app-94 img').evaluate(e=>e.decode());
  await page.locator('#app-94 .card-media').click();await page.waitForFunction(()=>document.querySelector('#mediaModal video').currentTime>.1);
  const meta=await page.locator('#mediaModal video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight}));assert(meta.duration<=10&&meta.duration>9);assert.equal(meta.width,1280);assert.equal(meta.height,720);
  await page.locator('#mediaModal video').evaluate(async v=>{v.pause();await new Promise((resolve,reject)=>{v.onseeked=resolve;v.currentTime=v.duration-.2;setTimeout(()=>reject(Error('seek timeout')),8000)})});await page.keyboard.press('Escape');
  for(const width of [390,320]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.goto(base+'kakezan_rescue.html');await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#play').click();assert.equal(await page.locator('#topAnswer').innerText(),'24');
  if(remote){for(const file of ['app_links_portfolio.html','kakezan_rescue.html','kakezan-rescue/app.js','kakezan-rescue/speech.js','kakezan-rescue/style.css','media/portfolio-94-intro.mp4','media/portfolio-94-intro.png']){const res=await page.request.get(base+file+'?v='+Date.now());assert(res.ok(),file+' '+res.status());const bytes=await res.body();const local=fs.readFileSync(path.join(root,file));const hash=b=>crypto.createHash('sha256').update(b).digest('hex');const normalized=b=>/\.(html|js|css)$/.test(file)?Buffer.from(b.toString('utf8').replace(/\r\n/g,'\n')):b;assert.equal(hash(normalized(bytes)),hash(normalized(local)),file+' public hash');console.log('PUBLIC HASH',file)}}
  assert.deepEqual(errors,[]);console.log('PASS portfolio-94',remote?'public':'local',meta);
 }finally{await browser.close();server?.close()}
})().catch(e=>{console.error(e);process.exit(1)});
