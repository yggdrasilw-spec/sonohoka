const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
(async()=>{const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{browser=await chromium.launch({channel:'msedge',headless:true});const p=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(`http://127.0.0.1:${server.address().port}/sonohoka/kakezan_wakeyou.html`);
 for(const mode of ['a','b']){
  await p.evaluate(mode=>{Object.assign(S,{a:8,b:4,k:3,mode});V.split=true;update('init')},mode);
  for(let i=0;i<3;i++){await p.locator('#uncut').click();assert.deepEqual(await p.evaluate(()=>({a:S.a,b:S.b,k:S.k,mode:S.mode,split:V.split,ready:V.ready})),{a:8,b:4,k:3,mode,split:false,ready:true});
   assert.equal(await p.locator('#cutPreview line').count(),1);await p.locator('#aftercut').click();assert.equal(await p.evaluate(()=>V.split&&!V.busy),true);assert.equal(await p.locator('.samurai-action').count(),0);
  }
 }
 await p.locator('#lawPanel > summary').click();await p.evaluate(()=>{Object.assign(S,{a:8,b:4,k:3,mode:'a'});update('init')});assert.equal(await p.locator('#lawNumbers').textContent(),'（3 ＋ 5）×4 ＝ 3×4 ＋ 5×4');
 await p.locator('#lawSubtract').click();assert.equal(await p.locator('#lawNumbers').textContent(),'（8 − 5）×4 ＝ 8×4 − 5×4');assert.equal(await p.locator('#lawDiagram [data-removed="true"]').count(),20);
 await p.locator('#lawReverse').click();assert.equal(await p.locator('#lawNumbers').textContent(),'8×4 − 5×4 ＝ （8 − 5）×4');
 const result=await p.evaluate(()=>{let cases=0;const bad=[];const calculate=s=>Function(`return (${s.replaceAll('（','(').replaceAll('）',')').replaceAll('×','*').replaceAll('−','-').replaceAll('＋','+')})`)();
  for(let a=2;a<=12;a++)for(let b=2;b<=12;b++)for(const mode of ['a','b'])for(let k=1;k<(mode==='a'?a:b);k++)for(const subtract of [false,true])for(const reverse of [false,true]){
   Object.assign(S,{a,b,mode,k});Object.assign(lawView,{subtract,reverse});renderLaw();const target=subtract?k*(mode==='a'?b:a):a*b;
   const n=mode==='a'?a:b,common=mode==='a'?b:a,first=subtract?n:k;
   const symbolic=$('lawSymbols').textContent.replaceAll('○',first).replaceAll('□',n-k).replaceAll('△',common);
   const values=[$('lawNumbers').textContent,symbolic].flatMap(s=>s.split('＝').map(calculate));
   const removed=$('lawDiagram').querySelectorAll('[data-removed="true"]').length;
   if(values.some(v=>v!==target)||removed!==(subtract?(n-k)*common:0))bad.push({a,b,mode,k,subtract,reverse,values,removed});cases++;
  }return {cases,bad}});assert.deepEqual(result.bad,[]);
 const out=path.resolve(__dirname,'../.portfolio-work/wakeyou-laws');fs.mkdirSync(out,{recursive:true});
 for(const width of [1366,390,320]){await p.setViewportSize({width,height:844});await p.evaluate(()=>{Object.assign(S,{a:8,b:4,k:3,mode:'a'});Object.assign(lawView,{subtract:true,reverse:false});update('init');$('lawPanel').open=true});await p.locator('#lawPanel').scrollIntoViewIfNeeded();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.join(out,`laws-${width}.png`),fullPage:true})}
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({cases:result.cases,errors},null,2));console.log('PASS: before/after round trips, numeric and symbolic distribution, subtraction diagram, responsive',result.cases);
}finally{if(browser)await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
