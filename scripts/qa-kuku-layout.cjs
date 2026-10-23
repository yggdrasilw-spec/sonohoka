const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
async function main(){
  const server=serve();await new Promise(r=>server.listen(8966,'127.0.0.1',r));
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
      window.spoken=[];
      Object.defineProperty(window,'speechSynthesis',{value:{cancel(){},speak(u){window.spoken.push(u)}}});
    });
    await page.goto('http://127.0.0.1:8966/sonohoka/kuku_1to9.html');
    await page.locator('#startBtn').click();await page.locator('.unit-card').filter({hasText:'9のだん'}).click();
    await page.locator('#bPrac').click();
    const checkFit=async(label)=>{
      const issues=await page.evaluate(()=>{
        const bad=[];
        if(document.documentElement.scrollHeight>innerHeight+1)bad.push('vertical scroll '+document.documentElement.scrollHeight+'/'+innerHeight);
        if(document.documentElement.scrollWidth>innerWidth+1)bad.push('horizontal scroll');
        for(const el of document.querySelectorAll('#lesson button,#lesson select,#lesson input,.learn-note,#msg,#tb,.rw')){
          if(!el.checkVisibility())continue;
          const r=el.getBoundingClientRect();
          if(r.width>0&&r.height>0&&(r.top<-.5||r.left<-.5||r.bottom>innerHeight+.5||r.right>innerWidth+.5))bad.push((el.id||el.className||el.tagName)+' out of screen');
          if(el.matches('.row-listen')&&el.scrollWidth>el.clientWidth+1)bad.push('row text clipped');
        }
        return bad;
      });
      assert.deepEqual(issues,[],label);
    };
    for(const [width,height] of [[1366,768],[1366,650],[1280,600],[1024,600],[1024,552]]){
      await page.setViewportSize({width,height});
      await page.locator('#bBuild').click();
      await checkFit(`build ${width}x${height}`);
      await page.locator('#bPrac').click();
      for(let l=1;l<=4;l++){
        await page.locator(`[data-learn-level="${l}"]`).click();
        assert.equal(await page.locator(`[data-learn-level="${l}"]`).getAttribute('aria-pressed'),'true');
        assert.equal(await page.locator('.rw').count(),9);
        assert(await page.locator('#qc').isHidden());
        assert.equal(await page.locator('.chant-reading').first().isVisible(),l===1);
        assert.equal(await page.locator('.rt2').first().isVisible(),l===2);
        assert.equal(await page.locator('.rw .r').first().isVisible(),l!==4);
        await checkFit(`learn ${l} ${width}x${height}`);
      }
      await page.screenshot({path:path.resolve(__dirname,`../.kuku-work/learn-qa/level4-${width}x${height}.png`),fullPage:true});
      await page.locator('#bQuiz').click();
      for(let l=1;l<=5;l++){
        await page.locator(`.lv[data-l="${l}"]`).click();
        await checkFit(`quiz ${l} ${width}x${height}`);
      }
      await page.locator('#bPrac').click();
      assert(await page.locator('#tb.l4').isVisible(),'independent learn level retained');
    }
    for(let l=1;l<=4;l++){
      await page.locator(`[data-learn-level="${l}"]`).click();
      await page.locator('#bRead').click();
      for(let i=1;i<=9;i++){
        assert.equal(await page.locator('.rw.cur').getAttribute('data-i'),String(i));
        await page.evaluate(()=>window.spoken.at(-1).onend());
      }
      assert(await page.locator('#bRead').isEnabled());
    }
    for(const width of [390,320]){
      await page.setViewportSize({width,height:844});
      for(let l=1;l<=4;l++){
        await page.locator(`[data-learn-level="${l}"]`).click();
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      }
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: four independent recitation levels, speech at every level, all controls and nine rows fit five Chromebook viewport sizes, all five quiz levels fit, mobile widths.');
  }finally{await browser.close();server.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
