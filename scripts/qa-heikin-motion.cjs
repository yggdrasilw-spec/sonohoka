const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const out=path.resolve(__dirname,'../.portfolio-work/heikin-motion');fs.mkdirSync(out,{recursive:true});
(async()=>{const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage({viewport:{width:1366,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(`http://127.0.0.1:${server.address().port}/sonohoka/heikin_narasu.html`);
 const snap=()=>p.evaluate(()=>Narasu.snapshot());
 await p.locator('#scenes button').nth(1).click();let previous=0,samples=0,paused=false;
 for(let i=0;i<250;i++){const s=await snap(),v=s.visual;assert.equal(v.soil.heights.reduce((a,b)=>a+b,0)+v.soil.pile+v.soil.flying,96);assert(v.soil.position>=previous);previous=v.soil.position;samples++;
  if(!paused&&v.soil.progress>.3){await p.locator('#pause').click();const before=await snap();await p.waitForTimeout(180);assert.deepEqual((await snap()).visual,before.visual);await p.screenshot({path:path.join(out,'soil-pushing.png')});await p.locator('#pause').click();paused=true;}
  if(!s.soilAuto&&!s.busy)break;await p.waitForTimeout(60);
 }assert.deepEqual((await snap()).state.values,[3,3,3,3]);await p.screenshot({path:path.join(out,'soil-flat.png')});
 await p.locator('#settingsOpen').click();await p.locator('#custom').fill('1,5,5,1');await p.locator('#apply').click();assert.match(await p.locator('#settingError').innerText(),/左から右/);await p.locator('#settings button.primary').click();
 await p.locator('#scenes button').nth(2).click();await p.locator('[data-col="0"]').click();await p.locator('[data-col="1"]').click();await p.locator('#pour50').click();await p.waitForFunction(()=>document.querySelector('[data-stream]')&&Number(document.querySelector('[data-vessel="0"]').dataset.angle)>30);await p.locator('#pause').click();
 const geometry=await p.evaluate(()=>{const e=document.querySelector('[data-vessel="0"]'),poly=e.querySelector('[data-liquid]'),pts=poly.getAttribute('points').split(' ').map(s=>{const [x,y]=s.split(',').map(Number);return {x,y};});return {angle:+e.dataset.angle,volume:+e.dataset.volume,area:NarasuMotion.area(pts),surface:+e.dataset.surface,lowest:Math.min(...pts.map(p=>p.y)),stream:!!document.querySelector('[data-stream]')};});
 assert(geometry.angle>30);assert(Math.abs(geometry.area/(76*180)*300-geometry.volume)<.01);assert(Math.abs(geometry.lowest-geometry.surface)<.01);assert(geometry.stream);
 await p.screenshot({path:path.join(out,'cup-pouring.png')});const frozen=await snap();await p.waitForTimeout(120);assert.deepEqual((await snap()).visual,frozen.visual);await p.locator('#pause').click();await p.waitForFunction(()=>!Narasu.snapshot().busy);assert.deepEqual((await snap()).state.values,[130,110]);
 // Both collection and distribution animate the actual source vessel.
 await p.locator('#toJug').click();await p.locator('[data-col="0"]').click();await p.waitForFunction(()=>document.querySelector('[data-stream]'));await p.locator('#pause').click();assert(await p.locator('[data-vessel="0"][data-angle]').count());await p.screenshot({path:path.join(out,'cup-to-jug.png')});await p.locator('#pause').click();await p.waitForFunction(()=>!Narasu.snapshot().busy);await p.locator('[data-col="1"]').click();await p.waitForFunction(()=>!Narasu.snapshot().busy);
 await p.locator('#divide').click();await p.waitForFunction(()=>document.querySelector('[data-stream]'));await p.locator('#pause').click();const jugAngle=await p.locator('[data-vessel="jug"]').getAttribute('data-angle');assert(Number(jugAngle)<-1);await p.screenshot({path:path.join(out,'jug-pouring.png')});
 await p.locator('#reset').click();await p.waitForTimeout(350);assert.deepEqual((await snap()).state.values,[180,60]);assert.equal((await snap()).state.jug,0);assert(!(await snap()).busy);assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({samples,geometry,jugAngle,errors},null,2));console.log('PASS: one-way sweep, discrete grain conservation, horizontal tilted water, source cup/jug motion, pause and cancellation',samples);
}finally{await b.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
