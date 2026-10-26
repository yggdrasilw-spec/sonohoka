const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
async function main(){
 const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];
 const base=process.argv[2]||`http://127.0.0.1:${server.address().port}/sonohoka/`;
 try{for(const mobile of [false,true]){
  const p=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},hasTouch:mobile,reducedMotion:mobile?'reduce':'no-preference'});p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'app_links_portfolio.html');const card=p.locator('#app-98');
  for(const query of ['My Town','英語 道案内','マイタウン','left right']){await p.locator('#searchInput').fill(query);assert(await card.isVisible(),query)}
  for(const grade of ['5']){await p.locator('#gradeSelect').selectOption(grade);assert(await card.isVisible(),grade)}
  assert.equal(await card.locator('.actions a').getAttribute('href'),'my-town/');await card.locator('img').evaluate(e=>e.decode());
  await card.locator('.card-media').scrollIntoViewIfNeeded();if(!mobile){await card.locator('.card-media').hover();await p.waitForFunction(()=>document.querySelector('#app-98 video').currentTime>.15)}
  await card.locator('.card-media').click();await p.waitForFunction(()=>document.querySelector('#mediaModal video').currentTime>.15);
  const v=p.locator('#mediaModal video'),meta=await v.evaluate(e=>({duration:e.duration,width:e.videoWidth,height:e.videoHeight,muted:e.muted}));
  assert(meta.duration>9&&meta.duration<=10);assert.equal(meta.width,1280);assert.equal(meta.height,720);assert(meta.muted);
  await v.evaluate(e=>{e.pause();e.currentTime=8.9});await p.waitForFunction(()=>{const v=document.querySelector('#mediaModal video');return Math.abs(v.currentTime-8.9)<.15&&v.readyState>=2});
  await p.screenshot({path:path.resolve(__dirname,`../.portfolio-work/demo-98/modal-${mobile?'mobile':'desktop'}.png`)});
  await p.locator('.media-modal-close').click();await p.waitForFunction(()=>!document.querySelector('#mediaModal video').getAttribute('src'));
  const a=await p.request.get(base+'my-town/');assert(a.ok());assert((await a.text()).includes('town-model.js'));
  await p.locator('#categorySelect').selectOption('英語');assert(await card.isVisible());
  console.log('PASS',mobile?'mobile':'desktop',base,meta);await p.close();
 }assert.deepEqual(errors,[])}finally{await browser.close();server.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
