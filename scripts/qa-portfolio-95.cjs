const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
(async()=>{
 const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 const base=process.argv[2]||`http://127.0.0.1:${server.address().port}/sonohoka/`;
 try{
  for(const width of [1280,390]){
   const p=await browser.newPage({viewport:{width,height:900},hasTouch:width===390});p.on('pageerror',e=>errors.push(e.message));
   await p.goto(base+'app_links_portfolio.html');const card=p.locator('#app-95');
   for(const q of ['算数 用語','かけられる数','わられる数','たされる数','引かれる数','円弧']){await p.locator('#searchInput').fill(q);assert(await card.isVisible(),q);}
   for(const g of ['1','2','3']){await p.locator('#gradeSelect').selectOption(g);assert(await card.isVisible(),g);}
   assert.equal(await card.locator('.actions a').getAttribute('href'),'sansuu_kotoba.html');
   await card.locator('img').evaluate(i=>i.decode());await card.locator('.card-media').scrollIntoViewIfNeeded();
   if(width===1280){await card.locator('.card-media').hover();await p.waitForFunction(()=>document.querySelector('#app-95 video').currentTime>.1);}
   await card.locator('.card-media').click();await p.waitForFunction(()=>document.querySelector('#mediaModal video').currentTime>.1);
   const meta=await p.locator('#mediaModal video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight}));
   assert(meta.duration>9&&meta.duration<=10);assert.equal(meta.width,1280);assert.equal(meta.height,720);
   await p.locator('#mediaModal video').evaluate(v=>{v.pause();v.currentTime=9.1});await p.waitForFunction(()=>document.querySelector('#mediaModal video').readyState>=2&&document.querySelector('#mediaModal video').currentTime>9);
   await p.screenshot({path:path.resolve(__dirname,`../.portfolio-work/demo-95/modal-${width}.png`)});
   await p.locator('.media-modal-close').click();await p.waitForFunction(()=>!document.querySelector('#mediaModal video').getAttribute('src'));
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const app=await p.request.get(base+'sansuu_kotoba.html');assert(app.ok());assert((await app.text()).includes('arrow-tip'));
   console.log('PASS',width,base,meta);await p.close();
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
