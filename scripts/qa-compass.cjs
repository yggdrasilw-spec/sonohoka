const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
(async()=>{const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.argv[2]||`http://127.0.0.1:${server.address().port}/sonohoka/`;
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),errors=[];
fs.mkdirSync('tmp/compass-qa',{recursive:true});
try{
for(const width of [1280,390,320]){
 const p=await browser.newPage({viewport:{width,height:900}});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'compass_pattern.html');await p.waitForFunction(()=>typeof P!=='undefined'&&S);
 await p.locator('#ovo').uncheck();await p.locator('#osf').uncheck();
 assert.equal(await p.evaluate(()=>PRACTICE_INDEX),32);assert.equal(await p.evaluate(()=>PR.length),15);
 assert(!/\d+ページ/.test(await p.locator('body').innerText()));
 // Every arc must fit the compass mechanism and use a positive clockwise sweep.
 const data=await p.evaluate(()=>P.slice(0,PRACTICE_INDEX));
 for(const pattern of data)for(const e of pattern.e){assert(e.r>0&&e.r<20);assert(e.c.every(Number.isFinite));if(e.a)assert(e.a[1]>e.a[0]&&e.a[1]-e.a[0]<360);}
 if(width===1280){
  for(let i=0;i<32;i++){
   await p.evaluate(i=>{setPattern(i);voice=false;sfxOn=false;},i);
   // Walk every real lesson transition and complete its actual animation callback.
   const result=await p.evaluate(()=>{let steps=0;while(idx<P[pi].e.length&&steps++<250){next();if(anim){const a=anim;a.fn(a.dur,1);anim=null;a.end?.();}}return {idx,n:P[pi].e.length,msg:document.querySelector('#msg').textContent};});
   assert.equal(result.idx,result.n);assert(result.msg.includes('かんせい'));
  }
  // Same-radius questions skip measurement; changed-radius questions retain it.
  assert(await p.evaluate(()=>{setPattern(0);return !sq(1).includes(4)}));
  assert(await p.evaluate(()=>{setPattern(4);return sq(1).includes(4)}));
 }
 await p.evaluate(()=>{setPattern(0);voice=false;sfxOn=false});
 await p.locator('#family').selectOption('半円');assert((await p.locator('#ttl').innerText()).includes('半円'));
 const before=await p.evaluate(()=>step);await p.locator('#nx').focus();await p.keyboard.press('Enter');await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>step),before+1);
 // Changing pattern while animation/queued navigation runs cancels old work.
 await p.evaluate(()=>{req(1);req(1);setPattern(7)});await p.waitForTimeout(200);assert.deepEqual(await p.evaluate(()=>[pi,idx,step,qn.length]),[7,0,1,0]);
 for(let k=0;k<15;k++){
  await p.evaluate(k=>startPrac(k),k);
  const r=await p.evaluate(()=>prac.r);const wrong=p.locator(`#qa button:not([data-v="${r}"])`).first();await wrong.click();assert.equal(await p.evaluate(()=>prac.stage),'ask');
  await p.locator(`#qa button[data-v="${r}"]`).click();assert.equal(await p.evaluate(()=>prac.stage),'center');
  const box=await p.locator('#c3').boundingBox();await p.locator('#c3').click({position:{x:box.width/2,y:box.height/2}});assert.equal(await p.evaluate(()=>prac.stage),'run');
 }
 await p.evaluate(()=>{setPattern(0);voice=false;sfxOn=false});
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.screenshot({path:`tmp/compass-qa/pattern-${width}.png`,fullPage:true});
 await p.goto(base+'compass_3d.html');await p.waitForFunction(()=>typeof scene!=='undefined');
 await p.locator('[data-v="top"]').click();assert.equal(await p.evaluate(()=>view),'top');
 await p.locator('[data-p="target"]').click();assert(await p.evaluate(()=>auto?.l.length>1));
 await p.locator('[data-p="stop"]').click();assert.equal(await p.evaluate(()=>auto),null);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.screenshot({path:`tmp/compass-qa/3d-${width}.png`});await p.close();console.log('PASS compass',width);
}
assert.deepEqual(errors,[]);console.log('PASS 32 patterns, 15 questions, navigation, switching, mobile, 3D');
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
