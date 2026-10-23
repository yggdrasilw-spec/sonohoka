const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const out=path.resolve(__dirname,'../.portfolio-work/kakezan-rescue');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768}});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.spoken=[];window.activeSpeech=null;window.cancelCalls=0;Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel(){window.cancelCalls++;window.activeSpeech=null},speak(u){window.spoken.push({text:u.text,lang:u.lang,rate:u.rate});window.activeSpeech=u;u.onstart?.()},get speaking(){return !!window.activeSpeech}}});window.finishSpeech=()=>{const u=window.activeSpeech;window.activeSpeech=null;u?.onend?.()}});
  const url=`http://127.0.0.1:${server.address().port}/sonohoka/kakezan_rescue.html`;await page.goto(url);
  assert.equal(await page.evaluate(()=>spoken.length),0,'no unsolicited narration on load');assert((await page.locator('body').innerText()).length<190,'keep the starting screen short');
  assert(await page.locator('#rescueIntro').isVisible());assert(!(await page.locator('#lesson').isVisible()));assert.equal(await page.locator('.strategy[aria-pressed="true"]').count(),0);assert.equal(await page.locator('.strategy').count(),5);assert((await page.locator('#problemPrompt').innerText()).includes('わすれちゃった'));assert((await page.locator('.five-ways').innerText()).includes('５つ'));
  await page.locator('#introListen').click();const question=await page.evaluate(()=>spoken.at(-1).text);assert(question.includes('さん かける はちの こたえを、わすれちゃった'));assert(question.includes('いつつ'));assert(!question.includes('にじゅうよん'),'do not reveal the answer in the question');
  await page.locator('[data-mode="0"]').click();assert(!(await page.locator('#rescueIntro').isVisible()));assert(await page.locator('#lesson').isVisible());
  await page.locator('#listen').click();let speech=await page.evaluate(()=>spoken.at(-1));assert.equal(speech.lang,'ja-JP');assert(speech.rate<1);assert(speech.text.includes('さん かける ななは、にじゅういち'));assert(!/[×＝＋]/.test(speech.text));
  const before=await page.evaluate(()=>spoken.length);await page.setViewportSize({width:1280,height:768});await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>spoken.length),before,'resize does not narrate');
  await page.locator('#play').click();await page.waitForTimeout(1200);assert.equal(await page.locator('#topAnswer').innerText(),'24');
  assert.equal(await page.evaluate(()=>activeSpeech.text),'さんこを、ひとつぶん、たすよ。','result waits for action speech');await page.evaluate(()=>finishSpeech());assert((await page.evaluate(()=>activeSpeech.text)).includes('にじゅういちに、さんを たして、にじゅうよん'));
  const old=await page.evaluate(()=>{window.oldSpeech=activeSpeech;return spoken.length});await page.locator('[data-mode="1"]').click();const newText=await page.evaluate(()=>activeSpeech.text);assert(newText.includes('さん かける きゅう'));await page.evaluate(()=>oldSpeech.onend());assert.equal(await page.evaluate(()=>activeSpeech.text),newText,'late callbacks cannot replace new speech');
  await page.locator('#sound').click();const silent=await page.evaluate(()=>spoken.length);await page.locator('[data-mode="2"]').click();await page.locator('#play').click();await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>spoken.length),silent,'voice off suppresses action and result');
  // Every possible factor pair, mode and split. Arithmetic is computed independently.
  const report=await page.evaluate(()=>{
   const $=id=>document.getElementById(id),fire=(e,type)=>e.dispatchEvent(new Event(type,{bubbles:true})),progress=n=>{$('progress').value=n;fire($('progress'),'input')};
   const failures=[];let cases=0,cuts=0;
   for(let a=1;a<=9;a++)for(let b=1;b<=9;b++){
    $('a').value=a;$('b').value=b;fire($('a'),'change');
    for(let mode=0;mode<5;mode++){
     const btn=document.querySelector(`[data-mode="${mode}"]`);if(btn.disabled)continue;btn.click();const original=$('dots').firstElementChild;
     for(const step of [0,500,1000]){
      progress(step);const dots=[...$('dots').children];if(dots.length!==a*(b+(mode===1?1:0)))failures.push({a,b,mode,step,error:'counter count'});
      if($('dots').firstElementChild!==original)failures.push({a,b,mode,error:'replaced live counter'});
      const box=$('board').viewBox.baseVal;for(const dot of dots){const x=+dot.getAttribute('cx'),y=+dot.getAttribute('cy'),r=+dot.getAttribute('r');if(x-r<box.x-.1||x+r>box.x+box.width+.1||y-r<box.y-.1||y+r>box.y+box.height+.1)failures.push({a,b,mode,step,error:'clipped counter',x,y,r})}
      if($('topAnswer').textContent!==(step===1000?String(a*b):'？'))failures.push({a,b,mode,step,error:'answer'});
      const eq=$('equation').innerText.replace(/\s/g,'');
      if(step===1000){if(!eq.endsWith('＝'+a*b))failures.push({a,b,mode,eq});if(mode===2){const xs=new Set(dots.map(d=>(+d.getAttribute('cx')).toFixed(2))),ys=new Set(dots.map(d=>(+d.getAttribute('cy')).toFixed(2)));if(xs.size!==a||ys.size!==b)failures.push({a,b,error:'transpose geometry'})}if(mode===1&&dots.filter(d=>+d.getAttribute('opacity')>.5).length!==a*b)failures.push({a,b,error:'subtract count'})}
      if(step===0&&mode===0&&eq!==`${a}×${b-1}＝${a*(b-1)}`)failures.push({a,b,error:'known fact before addition',eq});
     }
     if(mode===3)for(const axis of ['a','b']){const size=axis==='a'?a:b;if(size<2)continue;$('split'+axis.toUpperCase()).click();for(let k=1;k<size;k++){$('cut').value=k;fire($('cut'),'input');progress(1000);const orange=[...$('dots').children].filter(d=>d.getAttribute('fill')==='url(#orange)').length,expected=(size-k)*(axis==='a'?b:a);if(orange!==expected)failures.push({a,b,axis,k,orange,expected});const eq=$('equation').innerText.replace(/\s/g,''),part=axis==='a'?`${k}×${b}＋${a-k}×${b}`:`${a}×${k}＋${a}×${b-k}`;if(!eq.includes(part))failures.push({a,b,axis,k,eq,part});cuts++}}
     cases++;
    }
   }return {cases,cuts,failures};
  });assert.deepEqual(report.failures,[]);
  await page.reload();await page.locator('#sound').click();await page.locator('[data-mode="0"]').click();
  // Direct manipulation moves exactly with the pointer, followed by a spring to the slot.
  const drag=await page.evaluate(()=>{const rect=document.querySelector('#handles [role="button"] rect'),r=rect.getBBox(),m=document.querySelector('#board').getScreenCTM(),q=new DOMPoint(r.x+r.width/2,r.y+r.height/2).matrixTransform(m);window.stableDot=document.querySelector('#dots circle[data-col="7"]');return {x:q.x,y:q.y,dx:95*m.a,original:+stableDot.getAttribute('cx')}});
  await page.mouse.move(drag.x,drag.y);await page.mouse.down();await page.mouse.move(drag.x-drag.dx*.5,drag.y,{steps:10});assert(Math.abs((await page.evaluate(()=>+stableDot.getAttribute('cx')))-(drag.original-47.5))<.2,'pointer and object travel match');assert(await page.evaluate(()=>stableDot.isConnected));
  await page.mouse.move(drag.x-drag.dx*.75,drag.y,{steps:5});await page.mouse.up();await page.waitForTimeout(1200);assert.equal(await page.locator('#topAnswer').innerText(),'24');
  await page.locator('#reset').click();await page.locator('#play').click();await page.waitForTimeout(80);await page.locator('[data-mode="2"]').click();await page.waitForTimeout(1200);assert.equal(await page.locator('#progress').inputValue(),'0','old spring cancelled on strategy switch');
  await page.locator('[data-mode="4"]').click();await page.locator('#plates [role="button"]').last().click({force:true});assert.equal(await page.locator('#progress').inputValue(),'0','cannot skip ahead in repeated addition');
  for(let i=0;i<8;i++){await page.locator('#plates [role="button"]').nth(i).click();await page.waitForTimeout(40)}await page.waitForTimeout(1200);assert.equal(await page.locator('#topAnswer').innerText(),'24');assert.equal(await page.locator('#equation').innerText(),'21 ＋ 3 ＝ 24');
  await page.locator('[data-mode="3"]').click();await page.locator('.handle').focus();await page.keyboard.press('Home');assert.equal(await page.locator('#cut').inputValue(),'1');await page.keyboard.press('End');assert.equal(await page.locator('#cut').inputValue(),'7');
  const h=await page.locator('.cut-grip').boundingBox();await page.mouse.move(h.x+h.width/2,h.y+h.height/2);await page.mouse.down();await page.mouse.move(h.x-100,h.y+h.height/2,{steps:10});await page.mouse.up();assert(+await page.locator('#cut').inputValue()<7,'cut drag');
  for(const [width,height]of [[1366,768],[1024,600],[768,1024],[390,844],[320,568]]){
   await page.setViewportSize({width,height});await page.reload();await page.locator('#sound').click();await page.screenshot({path:path.join(out,`question-${width}.png`),fullPage:true});assert(await page.locator('#rescueIntro').isVisible());await page.locator('[data-mode="0"]').click();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:path.join(out,`child-${width}.png`),fullPage:true});
   if(width>=1000)assert(await page.locator('#strategies').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight),'desktop controls fit on screen');
   await page.locator('[data-mode="3"]').click();await page.screenshot({path:path.join(out,`split-${width}.png`),fullPage:true});
   await page.locator('#a').selectOption('9');await page.locator('#b').selectOption('9');await page.locator('[data-mode="4"]').click();await page.locator('.slow summary').click();await page.locator('#progress').fill('1000');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.locator('[data-mode="0"]').click();await page.locator('#play').click();assert.equal(await page.locator('#topAnswer').innerText(),'24');await page.locator('#next').click();assert(await page.locator('#rescueIntro').isVisible());assert.equal(await page.locator('#topAnswer').innerText(),'？');assert.equal(await page.locator('.strategy[aria-pressed="true"]').count(),0);
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({...report,viewports:5,speech:'sequence/cancel/mute/replay',errors},null,2));console.log('PASS',JSON.stringify({...report,viewports:5,errors}));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
