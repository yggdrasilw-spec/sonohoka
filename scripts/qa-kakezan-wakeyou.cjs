const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const out=path.resolve(__dirname,'../.portfolio-work/demo-93');fs.mkdirSync(out,{recursive:true});
async function main(){
 const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];
 try{
 const p=await browser.newPage({viewport:{width:1366,height:768}});p.on('pageerror',e=>errors.push(e.message));
 const url=`http://127.0.0.1:${server.address().port}/sonohoka/kakezan_wakeyou.html`;await p.goto(url);await p.waitForTimeout(1800);
 // Check actual display text in every sampled animation frame against independent arithmetic.
 const frames=await p.evaluate(async()=>{let count=0;const failures=[];for(const sel of ['a+','k-','b+','k+','a-']){
  document.querySelector(`[data-s="${sel}"]`).click();for(let f=0;f<32;f++){await new Promise(requestAnimationFrame);const {a,b,k,mode}=S;
   const e1=mode==='a'?`${k}×${b}`:`${a}×${k}`,e2=mode==='a'?`${a-k}×${b}`:`${a}×${b-k}`;
   const x=mode==='a'?k*b:a*k;const expected=[`${a}×${b}`,e1,e2,String(x),String(a*b-x),String(a*b),String(a*b)];
   const actual=['e0','e1','e2','p1','p2','ps','ar'].map(id=>document.getElementById(id).textContent);
   if(JSON.stringify(actual)!==JSON.stringify(expected))failures.push({actual,expected});count++}}
  return {count,failures}});assert.deepEqual(frames.failures,[]);
 await p.reload();await p.waitForTimeout(1300);await p.locator('[data-s="k-"]').click();
 await p.locator('#hb').click();const before=await p.evaluate(()=>({state:{...S},hint:{...H}}));await p.locator('#ma').click();assert.deepEqual(await p.evaluate(()=>({state:{...S},hint:{...H}})),before);
 await p.locator('#sl').focus();await p.keyboard.press('ArrowLeft');assert.equal(await p.evaluate(()=>S.k),3);
 await p.keyboard.press('ArrowRight');assert.equal(await p.evaluate(()=>S.k),4);await p.keyboard.press('Home');assert.equal(await p.evaluate(()=>S.k),1);await p.keyboard.press('End');assert.equal(await p.evaluate(()=>S.k),6);
 await p.locator('#mb').click();await p.locator('.cell[data-idx="1"]').first().click();assert.equal(await p.evaluate(()=>S.k),2);
 const q=await browser.newPage({reducedMotion:'reduce'});q.on('pageerror',e=>errors.push(e.message));await q.goto(url);
 const exhaustive=await q.evaluate(()=>{let cases=0,hints=0;const failures=[];
  for(let a=2;a<=12;a++)for(let b=2;b<=12;b++)for(const mode of ['a','b'])for(let k=1;k<(mode==='a'?a:b);k++){
   Object.assign(S,{a,b,mode,k});update('init');const partial=mode==='a'?k*b:a*k;
   const active=[...cells.values()].filter(c=>!c.dying),first=active.filter(c=>c.pt===1).length;
   const actual=['p1','p2','ps','ar'].map(id=>Number(document.getElementById(id).textContent));
   if(active.length!==a*b||first!==partial||JSON.stringify(actual)!==JSON.stringify([partial,a*b-partial,a*b,a*b]))failures.push({...S,actual,first});
   for(let t=0;t<3;t++){H.t=t;H.s=3;hRender();const expected=[a*b,partial,a*b-partial][t];
    const counts=[...hg.querySelectorAll('text')].filter(e=>e.getAttribute('fill')==='#4a3800').map(e=>+e.textContent);
    if(counts.length!==expected||counts.some((n,i)=>n!==i+1)||!$('hm').innerText.endsWith(String(expected)))failures.push({...S,t,expected,counts});hints++}
   cases++}return {cases,hints,failures}});assert.deepEqual(exhaustive.failures,[]);
 // Resize with the maximum array and final explanation; text must remain reachable.
 await p.evaluate(()=>{Object.assign(S,{a:12,b:12,k:5,mode:'a'});update('size',{key:'a',d:1});H.t=0;H.s=3;hRender()});await p.waitForTimeout(2000);
 for(const [width,height] of [[1366,768],[1024,768],[1180,820],[768,1024],[390,844],[320,568],[1280,600],[1024,600]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(250);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.locator('#eq1').scrollIntoViewIfNeeded();assert(await p.locator('#eq1').evaluate(e=>e.getBoundingClientRect().top>=0));
  await p.locator('#hm').scrollIntoViewIfNeeded();assert(await p.locator('#hm').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight+1));
  if(width<=390){
   assert(await p.evaluate(()=>$('figureCard').contains($('hc'))));
   await p.locator('#zoom').click();assert.equal(await p.locator('#zoom').getAttribute('aria-pressed'),'true');
   const diagram=await p.evaluate(()=>{const e=[...hg.querySelectorAll('text')].find(e=>e.textContent==='144');return {font:parseFloat(getComputedStyle(e).fontSize)*e.getScreenCTM().a,scroll:$('diagramScroll').scrollWidth>$('diagramScroll').clientWidth}});
   assert(diagram.font>=12,JSON.stringify(diagram));assert(diagram.scroll);
   await p.locator('#hm').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,`qa-zoom-${width}.png`),fullPage:true});await p.locator('#zoom').click();
   assert(await p.locator('.factor').evaluateAll(groups=>groups.every(g=>{const r=[...g.children].map(e=>e.getBoundingClientRect());return Math.max(...r.map(e=>e.top))-Math.min(...r.map(e=>e.top))<15})));
  }else if(width>1024)assert(await p.evaluate(()=>document.querySelector('aside').contains($('hc'))));
  await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:path.join(out,`qa-${width}-${height}.png`),fullPage:true});
 }
 await p.setViewportSize({width:1366,height:768});await p.evaluate(()=>{for(let i=0;i<120;i++){document.querySelector(`[data-s="a${i%2?'+':'-'}"]`).click();$('mb').click();$('hb').click();$('ma').click();document.querySelector('[data-s="k+"]').click()}Object.assign(S,{a:7,b:6,k:5,mode:'a'});update('size',{key:'a',d:1})});
 await p.waitForTimeout(3500);assert.deepEqual(await p.evaluate(()=>({count:cells.size,result:$('ar').textContent,running})),{count:42,result:'42',running:false});
 assert.deepEqual(errors,[]);const result={frames:frames.count,cases:exhaustive.cases,hints:exhaustive.hints,viewports:8,stressSequences:120,errors};fs.writeFileSync(path.join(out,'qa-results.json'),JSON.stringify(result,null,2));console.log('PASS',result);
 }finally{await browser.close();server.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
