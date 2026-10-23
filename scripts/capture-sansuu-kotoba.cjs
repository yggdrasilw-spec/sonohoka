// Capture actual rendered app states at the same four-frame cadence as the app.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const out=path.resolve(__dirname,'../.portfolio-work/demo-95');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1000,height:1700}});
  await p.goto(`http://127.0.0.1:${server.address().port}/sonohoka/sansuu_kotoba.html`);
  const mapping=[];
  for(let n=0;n<38;n++){
   if(n===12)await p.locator('[data-scene="multiply"]').click();
   if(n===24)await p.locator('[data-mode="numbers"]').click();
   await p.locator('#frame').evaluate(i=>i.decode());
   const clip=await p.evaluate(numbers=>{const top=document.getElementById(numbers?'mapping':'stage').getBoundingClientRect(),bottom=document.getElementById(numbers?'number-panel':'mapping').getBoundingClientRect(),lesson=document.querySelector('.lesson').getBoundingClientRect();return {x:lesson.x+10,y:top.y,width:lesson.width-20,height:bottom.bottom-top.y+4}},n>=24);
   await p.screenshot({path:path.join(out,`frame-${String(n).padStart(3,'0')}.png`),clip});
   mapping.push({frame:n,time:n/4,scene:n<12?'push':'multiply',view:n<24?'people':'numbers',sourceFrame:n<24?n%4:0});
   if(n<24)await p.locator('#step').click();
  }
  fs.writeFileSync(path.join(out,'storyboard.json'),JSON.stringify(mapping,null,2));
  console.log('Captured 38 browser frames, 9.5 seconds at 4 fps');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
