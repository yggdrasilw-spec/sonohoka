const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const out=path.resolve(__dirname,'../.portfolio-work/kakezan-rescue');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900}});page.on('pageerror',e=>errors.push(e.message));
  const url=`http://127.0.0.1:${server.address().port}/sonohoka/kakezan_rescue.html`;
  await page.goto(url);await page.screenshot({path:path.join(out,'desktop.png'),fullPage:true});
  const report=await page.evaluate(()=>{
   const $=id=>document.getElementById(id),fire=(e,type)=>e.dispatchEvent(new Event(type,{bubbles:true}));
   function progress(n){$('progress').value=n;fire($('progress'),'input')}
   const failures=[];let cases=0,cuts=0;
   for(let a=1;a<=9;a++)for(let b=1;b<=9;b++){
    $('a').value=a;$('b').value=b;fire($('a'),'change');
    for(let mode=0;mode<5;mode++){
     const btn=document.querySelector(`[data-mode="${mode}"]`);if(btn.disabled)continue;btn.click();
     for(const step of [0,500,1000]){
      progress(step);const circles=[...$('dots').children];
      if(circles.length!==a*(b+(mode===1?1:0)))failures.push({a,b,mode,step,error:'counter count'});
      for(const dot of circles){const x=+dot.getAttribute('cx'),y=+dot.getAttribute('cy'),r=+dot.getAttribute('r');if(x-r<0||x+r>760||y-r<0||y+r>355)failures.push({a,b,mode,step,error:'clipped dot',x,y,r})}
      const answer=$('topAnswer').textContent;if(answer!==(step===1000?String(a*b):'？'))failures.push({a,b,mode,step,answer});
      if(step===1000){const eq=$('equation').innerText.replace(/\s/g,'');if(!eq.endsWith('＝'+a*b))failures.push({a,b,mode,eq});
       if(mode===2){const cc=[...$('dots').children],x=new Set(cc.map(e=>(+e.getAttribute('cx')).toFixed(3))),y=new Set(cc.map(e=>(+e.getAttribute('cy')).toFixed(3)));if(x.size!==a||y.size!==b)failures.push({a,b,error:'transpose geometry'})}
       if(mode===1){const visible=circles.filter(e=>+e.getAttribute('opacity')>.5);if(visible.length!==a*b)failures.push({a,b,error:'subtract visible count'})}
      }
     }
     if(mode===3){for(const axis of ['a','b']){const size=axis==='a'?a:b;if(size<2)continue;$('split'+axis.toUpperCase()).click();
      for(let k=1;k<size;k++){$('cut').value=k;fire($('cut'),'input');progress(1000);const dots=[...$('dots').children],orange=dots.filter(e=>e.getAttribute('fill')==='url(#orange)').length;const expected=(size-k)*(axis==='a'?b:a);if(orange!==expected)failures.push({a,b,axis,k,orange,expected});const eq=$('equation').innerText.replace(/\s/g,'');const part=axis==='a'?`${k}×${b}＋${a-k}×${b}`:`${a}×${k}＋${a}×${b-k}`;if(!eq.includes(part))failures.push({a,b,axis,k,eq,part});cuts++}
     }}
     cases++;
    }
   }
   return {cases,cuts,failures};
  });assert.deepEqual(report.failures,[]);
  await page.reload();await page.locator('#play').click();await page.waitForTimeout(300);await page.locator('[data-mode="2"]').click();await page.waitForTimeout(1900);assert.equal(await page.locator('#progress').inputValue(),'0','old animation cancelled');
  const dragBoard=await page.locator('#board').boundingBox();await page.mouse.move(dragBoard.x+dragBoard.width*.4,dragBoard.y+dragBoard.height*.5);await page.mouse.down();await page.mouse.move(dragBoard.x+dragBoard.width*.4+190,dragBoard.y+dragBoard.height*.5,{steps:8});await page.mouse.up();assert.equal(await page.locator('#topAnswer').innerText(),'24','direct board swipe');await page.locator('#reset').click();
  await page.locator('#play').click();await page.waitForTimeout(2000);assert.equal(await page.locator('#topAnswer').innerText(),'24');
  await page.locator('#progress').fill('250');assert.equal(await page.locator('#topAnswer').innerText(),'？');
  await page.locator('[data-mode="4"]').click();await page.locator('#plates [role="button"]').nth(3).click();assert.equal(await page.locator('#equation').innerText(),'3 ＋ 3 ＋ 3 ＋ 3 ＝ 12');
  await page.locator('#plates [role="button"]').last().focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#topAnswer').innerText(),'24');
  await page.locator('[data-mode="3"]').click();const handle=page.locator('.handle');await handle.focus();await page.keyboard.press('Home');assert.equal(await page.locator('#cut').inputValue(),'1');await page.keyboard.press('End');assert.equal(await page.locator('#cut').inputValue(),'7');
  const bb=await page.locator('svg').boundingBox();const hb=await page.locator('.handle').boundingBox();await page.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);await page.mouse.down();await page.mouse.move(bb.x+bb.width*.4,hb.y+hb.height/2,{steps:8});await page.mouse.up();assert(+await page.locator('#cut').inputValue()<7,'drag changes cut');
  for(const [width,height]of [[1366,768],[1024,600],[768,1024],[390,844],[320,568]]){
   await page.setViewportSize({width,height});await page.reload();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);
   await page.locator('[data-mode="3"]').click();await page.locator('#play').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`split-${width}.png`),fullPage:true});
   await page.locator('#a').selectOption('9');await page.locator('#b').selectOption('9');await page.locator('[data-mode="4"]').click();await page.locator('#progress').fill('1000');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`long equation overflow ${width}`);
  }
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.locator('#play').click();assert.equal(await page.locator('#topAnswer').innerText(),'24');
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({...report,viewports:5,errors},null,2));console.log('PASS',JSON.stringify({...report,viewports:5,errors}));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
