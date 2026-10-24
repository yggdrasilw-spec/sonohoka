const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const expected=(topic,t,a,b)=>{
 const r=topic==='multiply'?a*b:topic==='subtract'?a-b:topic==='add'?a+b:a/b;
 if(topic==='multiply')return [`${b} × ${a} ＝ ${r}`,`${a} ふえる`,`${b} ふえる`][t];
 if(topic==='subtract')return [`${r} ＋ ${b} ＝ ${a}`,`${a+1} − ${b} ＝ ${r+1}`,'１ へる'][t];
 if(topic==='add')return [`${b} ＋ ${a} ＝ ${r}`,'１ ふえる',`${r} − ${b} ＝ ${a}`][t];
 return [`${r} × ${b} ＝ ${a}`,'１ ふえる','半分に なる'][t];
};
(async()=>{
 const s=serve();await new Promise(r=>s.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 const base=process.argv[2]||`http://127.0.0.1:${s.address().port}/sonohoka/`,errors=[];let count=0;
 try{
  const p=await browser.newPage({viewport:{width:1024,height:600}});p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'sansuu_kotoba.html');await p.locator('#voice-toggle').click();await p.locator('[data-mode="apply"]').click();
  async function fits(){const failures=await p.evaluate(()=>{
   const fail=[],container=document.getElementById('application').getBoundingClientRect();if(document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth)fail.push('scroll');
   for(const sel of ['#application-equation','#application-diagram','#application-diagram p','#practice-statement','#practice-question','#practice-choices','#practice-feedback','.practice-actions','#practice-score']){const e=document.querySelector(sel);if(!e)continue;const r=e.getBoundingClientRect();if(!r.width||!r.height)continue;if(r.bottom>container.bottom+1||r.right>innerWidth||r.top<container.top-1)fail.push(sel+' clipped');}
   for(const e of document.querySelectorAll('button,select')){const r=e.getBoundingClientRect();if(!r.width||!r.height)continue;const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(!e.contains(top))fail.push(e.textContent+' obscured');}
    for(const svg of document.querySelectorAll('#application-diagram:not([hidden]) svg')){const r=svg.getBoundingClientRect();if(r.height<80)fail.push('hint diagram too small');}
    return fail;
  });assert.deepEqual(failures,[]);}
  for(const topic of ['multiply','subtract','add','divide']){
   await p.locator('#practice-topic').selectOption(topic);const seen=new Set();
   for(let i=0;i<9;i++){
    const id=await p.locator('#application').getAttribute('data-problem-id');assert(!seen.has(id),'no repeated questions within topic');seen.add(id);
    const t=Number(id.split('-')[1]);const [a,b]=(await p.locator('.practice-operand strong').allTextContents()).map(Number),right=expected(topic,t,a,b);
    const choices=await p.locator('#practice-choices button').allTextContents();assert.equal(new Set(choices).size,3);assert(choices.includes(right),id+' answer');
    assert(await p.locator('#application-diagram').isHidden());await fits();
    if(i%3===1)await p.locator('#practice-hint').click();
    if(i%3===2){await p.locator('#practice-choices button').filter({hasText:choices.find(c=>c!==right)}).click();assert.match(await p.locator('#practice-feedback').innerText(),/ヒント/);}
    await p.getByRole('button',{name:right,exact:true}).click();assert.match(await p.locator('#practice-feedback').innerText(),/そう/);
    assert(await p.locator('#application-diagram').isVisible());await fits();
    const diagrams=await p.locator('#application-diagram svg').evaluateAll(ss=>ss.map(svg=>({label:svg.getAttribute('aria-label'),dots:svg.querySelectorAll('[data-dot]').length,units:svg.querySelectorAll('[data-unit]').length})));
    assert.equal(diagrams.length,2);
    for(const d of diagrams){const match=d.label.match(/(\d+)([×÷＋−])(\d+)＝(-?\d+)$/);assert(match,d.label);const x=+match[1],op=match[2],y=+match[3],r=+match[4];const calc=op==='×'?x*y:op==='÷'?x/y:op==='＋'?x+y:x-y;assert.equal(r,calc);assert.equal(d.dots||d.units,op==='×'?x*y:op==='＋'?x+y:x,d.label);}
    // Repeated answers cannot increment progress.
    const score=await p.locator('#practice-score').innerText();await p.getByRole('button',{name:right,exact:true}).dispatchEvent('click');assert.equal(await p.locator('#practice-score').innerText(),score);
    count++;if(i<8)await p.locator('#practice-next').click();
   }
  }
  assert.match(await p.locator('#practice-score').innerText(),/答えた 36もん.*はじめにせいかい 12もん/);
  await p.screenshot({path:path.resolve(__dirname,'../.portfolio-work/sansuu-kotoba/practice-1024.png')});
  for(const [width,height] of [[1366,768],[1366,640],[1366,600],[1280,600],[1180,620]]){await p.setViewportSize({width,height});await fits();}
  await p.setViewportSize({width:390,height:844});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.resolve(__dirname,'../.portfolio-work/sansuu-kotoba/practice-mobile.png'),fullPage:true});
  await p.setViewportSize({width:1024,height:600});await p.locator('#practice-topic').selectOption('all');const mixed=new Set();let previous='';for(let i=0;i<36;i++){const id=await p.locator('#application').getAttribute('data-problem-id');assert(!mixed.has(id),'mixed deck does not repeat');mixed.add(id);previous=id;await p.locator('#practice-next').click();}assert.equal(mixed.size,36);assert.notEqual(await p.locator('#application').getAttribute('data-problem-id'),previous,'new cycle does not repeat previous question');
  await p.setViewportSize({width:1024,height:600});await p.locator('[data-mode="people"]').click();assert(await p.locator('#basic-content').isVisible());assert(await p.locator('#application').isHidden());
  await p.locator('#play').click();await p.locator('[data-mode="apply"]').click();const frame=await p.locator('#frame').getAttribute('src');await p.waitForTimeout(800);assert.equal(await p.locator('#frame').getAttribute('src'),frame);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({questions:count,independent:12,diagramArithmetic:'verified',errors,base}));
 }finally{await browser.close();s.close();}
})().catch(e=>{console.error(e);process.exit(1)});
