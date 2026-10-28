const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
(async()=>{const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});const base=process.argv[2]||`http://127.0.0.1:${server.address().port}/sonohoka/`,out=path.resolve('.portfolio-work/bun-review');fs.mkdirSync(out,{recursive:true});const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));let layouts=0,wrong=0;
try{
 await p.goto(base+'bun_no_hitogata.html');
 await p.evaluate(()=>{sdt();tab(3)});
 // Independent expected word boundaries and grammatical answers for all seven sentences.
 const cases=[[[2,6],0,2],[[2,6],0,2],[[4,7],0,2],[[2,5,9],1,3],[[2,6],0,2],[[4,8],0,2],[[6,9],0,2]];
 for(let q=0;q<cases.length;q++){
  const [boundaries,subject,predicate]=cases[q];await p.selectOption('#problem',String(q));
  await p.locator('#ck4').click();assert.equal(await p.evaluate(()=>ph),0);
  const count=await p.locator('.gp').count();
  for(let i=0;i<count;i++)if(!boundaries.includes(i)){await p.locator('.gp').nth(i).click();await p.locator('#ck4').click();assert.equal(await p.evaluate(()=>ph),0);await p.locator('.gp').nth(i).click();wrong++;}
  for(const i of boundaries)await p.locator('.gp').nth(i).click();
  await p.locator('#ck4').click();assert.equal(await p.evaluate(()=>ph),1);
  for(let i=0;i<await p.locator('.ck').count();i++)if(i!==subject){await p.locator('.ck').nth(i).click();assert.equal(await p.evaluate(()=>ph),1);wrong++;}
  await p.locator('.ck').nth(subject).focus();await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>ph),2);
  for(let i=0;i<await p.locator('.ck').count();i++)if(i!==predicate){await p.locator('.ck').nth(i).click();assert.equal(await p.evaluate(()=>ph),2);wrong++;}
  await p.locator('.ck').nth(predicate).click();assert.equal(await p.evaluate(()=>ph),3);assert.equal(await p.locator('.ck.r.on').count(),1);assert.equal(await p.locator('.ck.b.on').count(),1);
  await p.getByRole('button',{name:'はじめから',exact:true}).click();assert.equal(await p.evaluate(()=>ph),0);assert.equal(await p.locator('.gp.on').count(),0);
 }
 await p.evaluate(()=>r4(6));await p.getByRole('button',{name:'つぎの もんだい →',exact:true}).click();assert.equal(await p.inputValue('#problem'),'0');
 await p.locator('.gp').first().focus();await p.keyboard.press('Space');assert.equal(await p.locator('.gp').first().getAttribute('aria-pressed'),'true');assert(await p.locator('.gp').first().evaluate(e=>e===document.activeElement));await p.keyboard.press('Space');assert.equal(await p.locator('.gp').first().getAttribute('aria-pressed'),'false');
 // Lesson examples and reversed order: accessories also reveal their base words.
 await p.evaluate(()=>{tab(2);r3(0);f3(1)});assert.equal(await p.locator('#s3 .on').count(),4);
 await p.evaluate(()=>{r3(1);f3(1)});assert.equal(await p.locator('#s3 .on').count(),3);
 for(let i=0;i<10;i++){await p.evaluate(i=>{tab(1);r2(i);f2(1);f2(0)},i);assert.equal(await p.locator('#s2 .on').count(),2);assert.equal(await p.locator('#body .hl').count(),1);}
 // Inspect all feedback states, not only the initial screen. Landscape must fit without scroll.
 for(const [width,height] of [[1366,768],[1280,640],[1024,600],[1180,620],[900,540],[768,1024],[390,844],[320,568]]){
  await p.setViewportSize({width,height});
  for(let tabIndex=0;tabIndex<4;tabIndex++){
   await p.evaluate(t=>tab(t),tabIndex);
   const states=tabIndex===0?3:tabIndex===1?10:tabIndex===2?4:28;
   for(let state=0;state<states;state++){
    await p.evaluate(({t,k})=>{if(t===0)c1(k);if(t===1){r2(k);f2(0);f2(1)}if(t===2){r3(k%2);f3(k<2?0:1)}if(t===3){r4(Math.floor(k/4));if(k%4){let pos=-1;CH.slice(0,-1).forEach(c=>{pos+=c.length;tg(pos)});f4();if(k%4>=2)pk(Q[qi][1]);if(k%4>=3)pk(Q[qi][2]);}}},{t:tabIndex,k:state});
    const problems=await p.evaluate(()=>{const issues=[],rect=e=>e.getBoundingClientRect(),panel=document.querySelector('.panel:not([hidden])');if(document.documentElement.scrollWidth>innerWidth+1)issues.push('horizontal scroll');const landscape=innerWidth>=900&&innerHeight>=540;if(landscape&&document.documentElement.scrollHeight>innerHeight+1)issues.push('vertical scroll');const elements=[...panel.children].filter(e=>!e.hidden&&rect(e).height);for(const e of elements){const r=rect(e);if(landscape&&(r.top<0||r.bottom>innerHeight+1))issues.push(e.id+' outside viewport');if(r.left<0||r.right>innerWidth+1)issues.push(e.id+' outside width');}for(let i=0;i<elements.length;i++)for(let j=i+1;j<elements.length;j++){const a=rect(elements[i]),b=rect(elements[j]);if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)issues.push('overlap '+elements[i].className+' / '+elements[j].className)}const stage=panel.querySelector('.stage');for(const e of stage.querySelectorAll('.gp,.ck,#q4')){const r=rect(e),a=rect(stage);if(r.left<a.left-1||r.right>a.right+1||r.top<a.top-1||r.bottom>a.bottom+1)issues.push('stage overflow '+e.className)}return issues;});
    if(problems.length){await p.screenshot({path:out+'/failure.png',fullPage:true});console.log(await p.evaluate(()=>[...document.querySelectorAll('#app,nav,.wrap,.panel:not([hidden]),.panel:not([hidden])>*')].map(e=>({e:e.id||e.className||e.tagName,h:e.getBoundingClientRect().height,top:e.getBoundingClientRect().top,style:getComputedStyle(e).minHeight}))))}assert.deepEqual(problems,[],JSON.stringify({width,height,tabIndex,state,problems}));layouts++;
   }
   await p.waitForTimeout(450);await p.screenshot({path:`${out}/${width}-${height}-tab${tabIndex}.png`,fullPage:true});
  }
 }
 await p.setViewportSize({width:1024,height:600});await p.emulateMedia({reducedMotion:'reduce',colorScheme:'dark'});await p.evaluate(()=>{tab(3);r4(6)});assert.equal(await p.locator('.gp').first().evaluate(e=>getComputedStyle(e).animationName),'none');
 await p.evaluate(()=>{for(let i=0;i<100;i++){tab(i%4);r4(i%7);h4()}tab(0)});assert.deepEqual(errors,[]);
 const result={practice:7,rejectedWrongChoices:wrong,layoutStates:layouts,viewports:8,pageErrors:errors};fs.writeFileSync(out+'/results.json',JSON.stringify(result,null,2));console.log('PASS',result);
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
