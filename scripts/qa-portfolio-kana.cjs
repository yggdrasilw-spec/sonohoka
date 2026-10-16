const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.portfolio-work/kana-feedback');
const hash=(b,name)=>crypto.createHash('sha256').update(name.endsWith('.bin')?b:b.toString('utf8').replace(/\r\n/g,'\n')).digest('hex');
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'kana-feedback-lab/_SOURCE.json')));
 assert.equal(manifest.files.length,8);
 for(const file of manifest.files)assert.equal(hash(fs.readFileSync(path.join(root,'kana-feedback-lab',file.path)),file.path),file.sha256,file.path);
 const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}/sonohoka`;
 const browser=await chromium.launch({channel:'chrome',headless:true});fs.mkdirSync(out,{recursive:true});
 try{
  const lab=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];lab.on('pageerror',e=>errors.push(e.message));
  await lab.goto(origin+'/kana-feedback-lab/index.html?char=%E3%81%97&demo=wide');
  await lab.waitForFunction(()=>window.KanaFeedbackLab?.getState().result);
  assert.equal(await lab.locator('[data-character]').count(),86);assert.ok(await lab.locator('[data-rule="outline"]').count());
  assert.equal(await lab.locator('.back').getAttribute('href'),'../app_links_portfolio.html');
  assert.equal(await lab.evaluate(()=>KanaFeedbackLab.getState().result.identity.status),'unavailable');
  const moduleResponse=await lab.request.get(origin+'/kana-feedback-lab/kana-feedback-engine.mjs');
  assert.match(moduleResponse.headers()['content-type'],/javascript/);
  if(process.argv.includes('--capture-poster'))await lab.locator('.boards').screenshot({path:path.join(root,'media/portfolio-kana-feedback-lab.png')});
  await lab.close();
  for(const width of [1280,390,320]){
   const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/app_links_portfolio.html');const card=page.locator('#app-89');
   for(const query of ['かな 研究室','仮名','字形','書字','ひらがな 書き順']){
    await page.locator('#searchInput').fill(query);assert.equal(await card.isVisible(),true,query);
   }
   await page.locator('#searchInput').fill('かな 研究室');await page.locator('#categorySelect').selectOption('国語');
   await page.locator('#advancedFilters').evaluate(el=>el.open=true);
   await page.locator('#audienceSelect').selectOption('teacher');await page.locator('#usageSelect').selectOption('experiment');
   await page.locator('[data-topic="characters"]').click();assert.equal(await card.isVisible(),true);
   await card.locator('img').evaluate(img=>img.decode());assert.match(await card.innerText(),/正誤判定は未実装/);
   assert.equal(await card.locator('.actions a').getAttribute('href'),'kana-feedback-lab/index.html');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await card.screenshot({path:path.join(out,`card-${width}.png`)});
   const popup=page.waitForEvent('popup');await card.locator('.actions a').click();const opened=await popup;
   await opened.waitForFunction(()=>window.KanaFeedbackLab?.getState().ready);
   assert.equal(await opened.title(),'かなの かたち研究室');
   if(width<=390)assert.equal(await opened.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await opened.close();await page.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS: kana card, search/filter, poster, bundled module MIME, launch, provenance hashes and desktop/mobile layouts.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
