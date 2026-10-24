const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const out=path.resolve(__dirname,'../.portfolio-work/heikin-hints');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser,samples=0;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const p=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/sonohoka/heikin_narasu.html`);
  const snap=()=>p.evaluate(()=>Narasu.snapshot());
  async function scene(i){await p.locator('#scenes button').nth(i).click();}
  async function speed(value){await p.locator('#settingsOpen').click();await p.locator('#speed').selectOption(value);await p.locator('#settings button.primary').click();}
  async function initial(){
   const s=await snap();assert.equal(s.hint,0);assert.equal(s.diagramDemo,false);assert.equal(s.busy,false);
   assert.equal(await p.locator('#totalPanel').evaluate(e=>e.open),false);
   assert.equal(await p.locator('#board .hintLine').count(),0);
   assert.equal(await p.locator('#math').innerText(),'');assert.equal(await p.locator('#hint').innerText(),'ヒント');
   assert.equal(await p.locator('#demo').innerText(),'図が動くヒント');
  }
  async function finish(){
   for(let i=0;i<500;i++){
    const s=await snap(),v=s.visual,total=s.state.original.reduce((a,b)=>a+b,0);
    assert.equal(v.values.reduce((a,b)=>a+b,0)+v.bucket+v.jug+(v.transit||0),total);samples++;
    if(!s.busy&&!s.diagramDemo)return s;
    await p.waitForTimeout(25);
   }throw Error('hint animation timeout');
  }
  // Previously the total panel opened itself in practice; teacher hint lines also leaked the result.
  await p.locator('#settingsOpen').click();await p.locator('#line').check();await p.locator('#settings button.primary').click();
  await scene(3);assert(await p.locator('#totalPanel').evaluate(e=>e.open));
  await scene(5);await initial();
  await p.locator('#toggleDiagram').click();await p.locator('#toggleDiagram').click();assert(await p.locator('#drawing').isHidden());
  await p.locator('#hint').click();assert.equal((await snap()).hint,1);assert.match(await p.locator('#message').innerText(),/多い/);assert.doesNotMatch(await p.locator('#message').innerText(),/÷/);
  await p.locator('#hint').click();assert.equal((await snap()).hint,2);await p.locator('#hint').click();assert.equal((await snap()).hint,3);assert(await p.locator('#board .hintLine').count());assert(await p.locator('#drawing').isVisible());
  await p.locator('#demo').click();const beads=await finish();assert.deepEqual(beads.state.values,[3,3,3]);assert.equal(beads.state.solved,false);
  await p.locator('#reset').click();await initial();
  await speed('reduced');
  for(let practice=1;practice<7;practice++){
   await p.locator('#next').click();await initial();
   const before=await snap(),hidden=[3,4].includes(practice);
   assert.equal(await p.locator('#drawing').isHidden(),hidden);
   await p.locator('#answer').fill('17');await p.locator('#hint').click();assert.equal(await p.locator('#answer').inputValue(),'17');assert.equal((await snap()).hint,1);
   await p.locator('#hint').click();assert.equal((await snap()).hint,2);
   if(practice===2){assert.match(await p.locator('#message').innerText(),/60 ＋ 120 ＋ 90/);assert.doesNotMatch(await p.locator('#message').innerText(),/270/);}
   if(practice===3)await speed('normal');
   await p.locator('#demo').click();assert(await p.locator('#drawing').isVisible());
   if(practice===3){
    await p.waitForFunction(()=>document.querySelector('[data-stream]'));await p.locator('#pause').click();
    const frozen=(await snap()).visual;await p.waitForTimeout(140);assert.deepEqual((await snap()).visual,frozen);
    await p.screenshot({path:path.join(out,'hidden-problem-moving-hint.png')});
    await p.locator('#pause').click();
   }
   const result=await finish(),a=before.state.original.reduce((a,b)=>a+b,0)/before.state.original.length;
   assert(result.state.values.every(v=>v===a));assert.equal(result.state.solved,false);assert.equal(result.state.step,0);assert(await p.locator('#answerForm').isVisible());assert.equal(await p.locator('#math').innerText(),'');
   if(practice===3)await speed('reduced');
   if(practice===6){assert.deepEqual(result.state.values,[125,125]);await p.screenshot({path:path.join(out,'125ml-visual-hint.png')});}
  }
  // Reset cancels both the active pour and all future moves in the demonstration.
  await p.locator('#reset').click();await speed('normal');await p.locator('#demo').click();await p.waitForFunction(()=>document.querySelector('[data-stream]'));
  await p.locator('#reset').click();await p.waitForTimeout(300);await initial();assert.deepEqual((await snap()).state.values,[100,150]);
  await p.locator('#demo').click();await scene(0);await p.waitForTimeout(250);assert.equal((await snap()).state.stage,0);assert.equal((await snap()).busy,false);
  // The formula lesson has the same visual explanation, without answering its input steps.
  await scene(4);await speed('reduced');await p.locator('#demo').click();const formula=await finish();assert.deepEqual(formula.state.values,[120,120]);assert.equal(formula.state.step,0);assert.equal(formula.state.solved,false);
  assert.deepEqual(errors,[]);console.log(`PASS: ${samples} conservation samples; all 7 practice hints, no automatic totals/lines, hidden diagrams animate, 125mL, pause/reset/cancel and formula lesson`);
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
