const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const out=path.resolve(__dirname,'../.portfolio-work/wakeyou-samurai');fs.mkdirSync(out,{recursive:true});
async function cut(p,mode,label,{sprite=true,size=7}={}){
 await p.evaluate(({mode,size})=>{Object.assign(S,{a:size,b:6,mode,k:1});Object.assign(V,{split:false,ready:true,totals:true});update('init');},{mode,size});
 await p.waitForTimeout(450);await p.locator('#cutNow').scrollIntoViewIfNeeded();
 await p.evaluate(()=>{window.samples=[];let recording=true;window.stopSamples=()=>recording=false;
  function sample(){const g=document.querySelector('.samurai-action'),s=g?.querySelector('svg'),l=g?.querySelector('line');
   samples.push({cutin:$('samuraiFx').classList.contains('active'),busy:V.busy,split:V.split,phase:g?.dataset.phase,direction:g?.dataset.direction,x:s?+s.getAttribute('x'):null,y:s?+s.getAttribute('y'):null,frame:s?+s.dataset.frame:null,x1:l?+l.getAttribute('x1'):null,y1:l?+l.getAttribute('y1'):null,x2:l?+l.getAttribute('x2'):null,y2:l?+l.getAttribute('y2'):null,total:[...$('totals').querySelectorAll('text')].reduce((n,t)=>n+Number(t.textContent),0)});
   if(recording)requestAnimationFrame(sample)}requestAnimationFrame(sample);
 });
 await p.locator('#cutNow').click();await p.waitForFunction(()=>$('samuraiFx').classList.contains('active'));
 assert.equal(await p.evaluate(()=>V.split),false);assert(await p.locator('#sl').isDisabled());assert(!(await p.locator('#mute').isDisabled()));
 // A second invocation must not start a second cut.
 await p.evaluate(()=>performCut());
 await p.waitForFunction(()=>document.querySelector('.samurai-action')?.dataset.phase==='dash');
 assert.equal(await p.locator('#cutPreview').evaluate(e=>getComputedStyle(e).visibility),'hidden');assert(!(await p.locator('#cutNow').isVisible()));
 await p.screenshot({path:path.join(out,label+'-dash.png'),fullPage:true});
 await p.waitForFunction(()=>!V.busy);await p.evaluate(()=>stopSamples());
 const samples=await p.evaluate(()=>samples);const dash=samples.filter(s=>s.phase==='dash'),prep=samples.filter(s=>s.phase==='prepare');
 assert(prep.length&&dash.length);assert(samples.some(s=>s.cutin));assert(samples.every(s=>!(s.cutin&&s.phase)),'cut-in must disappear before sprite');
 assert([...prep,...dash].every(s=>!s.split),'diagram must stay joined until dash ends');
 assert(samples.every(s=>s.total===size*6),'every frame preserves total');
 assert(dash.every(s=>s.direction===(mode==='a'?'horizontal':'vertical')));
 assert(dash.every(s=>mode==='a'?s.y1===s.y2:s.x1===s.x2));
 if(sprite){assert(dash.every(s=>s.frame!==null));assert(mode==='a'?dash.at(-1).x>dash[0].x:dash.at(-1).y>dash[0].y);assert(mode==='a'?dash.at(-1).y===dash[0].y:dash.at(-1).x===dash[0].x)}
 else assert(dash.every(s=>s.frame===null));
 assert.equal(await p.locator('.samurai-action').count(),0);assert.equal(await p.evaluate(()=>V.split),true);assert(!(await p.locator('#sl').isDisabled()));
 await p.screenshot({path:path.join(out,label+'-done.png'),fullPage:true});
 return {label,frames:samples.length,dashFrames:dash.length};
}
(async()=>{const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[],results=[];
 try{const url=`http://127.0.0.1:${server.address().port}/sonohoka/kakezan_wakeyou.html`;
  const p=await browser.newPage({viewport:{width:1366,height:900}});p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await p.waitForFunction(()=>Object.values(samuraiSheets).every(s=>s.ready));
  results.push(await cut(p,'a','horizontal'));results.push(await cut(p,'b','vertical'));
  await p.locator('#zoom').click();results.push(await cut(p,'b','zoom-vertical',{size:12}));
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(url);await mobile.waitForFunction(()=>Object.values(samuraiSheets).every(s=>s.ready));results.push(await cut(mobile,'a','mobile-horizontal',{size:2}));results.push(await cut(mobile,'b','mobile-vertical'));
  const fallback=await browser.newPage();fallback.on('pageerror',e=>errors.push(e.message));await fallback.route('**/wakeyou-samurai-slash-*.png',r=>r.abort());await fallback.goto(url);results.push(await cut(fallback,'a','missing-sprite',{sprite:false}));
  const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(url);await reduced.evaluate(()=>{Object.assign(V,{split:false,ready:true});update('init')});await reduced.locator('#cutNow').click();assert.equal(await reduced.evaluate(()=>V.split&&!V.busy),true);assert.equal(await reduced.locator('.samurai-action').count(),0);
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,errors},null,2));console.log('PASS',JSON.stringify(results));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
