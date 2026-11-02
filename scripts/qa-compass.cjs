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
 assert.equal(await p.evaluate(()=>PRACTICE_INDEX),100);assert.equal(await p.evaluate(()=>PR.length),15);
 assert(!/\d+ページ/.test(await p.locator('body').innerText()));
 // Every arc must fit the compass mechanism and use a positive clockwise sweep.
 const data=await p.evaluate(()=>P.slice(0,PRACTICE_INDEX));
 for(const pattern of data)for(const e of pattern.e){assert(e.r>0&&e.r<20);assert(e.c.every(Number.isFinite));if(e.a)assert(e.a[1]>e.a[0]&&e.a[1]-e.a[0]<360);}
 if(width===1280){
  const smallRadius=await p.evaluate(()=>{const i=P.findIndex(p=>p.e.some(e=>e.r===.5));setPattern(i);idx=P[pi].e.findIndex(e=>e.r===.5);step=4;enter();const a=anim,values=[];for(let k=0;k<=20;k++){a.fn(a.dur*k/20,k/20);values.push(S.R)}a.end();return {duration:a.dur,values,final:S.R,kana:kana(.5),label:fmtR(.5)};});
  assert(smallRadius.duration>0);assert(smallRadius.values.every(v=>Number.isFinite(v)&&v>0));assert.equal(smallRadius.final,.5);assert.equal(smallRadius.label,'5 mm');assert.equal(smallRadius.kana,'ごミリメートル');
  for(let i=0;i<100;i++){
   await p.evaluate(i=>{setPattern(i);voice=false;sfxOn=false;},i);
   // Walk every real lesson transition and complete its actual animation callback.
   const result=await p.evaluate(()=>{let steps=0;while(idx<P[pi].e.length&&steps++<1500){next();if(anim){const a=anim;a.fn(a.dur,1);anim=null;a.end?.();}}return {idx,n:P[pi].e.length,msg:document.querySelector('#msg').textContent};});
   assert.equal(result.idx,result.n);assert(result.msg.includes('かんせい'));
  }
  // Same-radius questions skip measurement; changed-radius questions retain it.
  assert(await p.evaluate(()=>{setPattern(0);return !sq(1).includes(4)}));
  assert(await p.evaluate(()=>{const i=P.findIndex(p=>p.e.length>1&&p.e[0].r!==p.e[1].r);setPattern(i);return sq(1).includes(4)}));
 }
 await p.evaluate(()=>{setPattern(0);voice=false;sfxOn=false});
 assert.equal(await p.locator('#patternGallery button').count(),100);
 await p.locator('#gallery summary').click();
 await p.screenshot({path:`tmp/compass-qa/gallery-${width}.png`,fullPage:true});
 await p.locator('#patternGallery button').filter({hasText:'ハート'}).first().click();
 assert((await p.locator('#ttl').innerText()).includes('ハート'));
 assert.equal(await p.locator('#patternSelect').inputValue(),String(await p.evaluate(()=>pi)));
 assert(!(await p.locator('#gallery').evaluate(e=>e.open)));
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
assert.deepEqual(errors,[]);console.log('PASS 100 distinct patterns, 15 questions, navigation, switching, mobile, 3D');
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
