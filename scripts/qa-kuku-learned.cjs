const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
async function main(){
  const server=serve();await new Promise(r=>server.listen(8965,'127.0.0.1',r));
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
      window.spoken=[];
      Object.defineProperty(window,'speechSynthesis',{value:{cancel(){},speak(u){window.spoken.push(u)}}});
    });
    const url='http://127.0.0.1:8965/sonohoka/kuku_1to9.html';
    async function enter(d){
      await page.locator('#startBtn').click();
      await page.locator('.unit-card').filter({hasText:d+'のだん'}).click();
      await page.locator('#bPrac').click();
    }
    const box=i=>page.locator(`input[data-learned="${i}"]`);
    await page.goto(url);await enter(2);
    for(const i of [1,4,9])await box(i).check();
    assert.equal(await page.evaluate(()=>window.spoken.length),0,'checkbox never triggers speech');
    await page.locator('#bRead').click();
    const seen=[];
    while(await page.locator('#bRead').isDisabled()){
      seen.push(Number(await page.locator('.rw.cur').getAttribute('data-i')));
      await page.evaluate(()=>window.spoken.at(-1).onend());
      assert(seen.length<=9);
    }
    assert.deepEqual(seen,[2,3,5,6,7,8]);
    await page.reload();await enter(2);
    for(const i of [1,4,9])assert(await box(i).isChecked(),'persist '+i);
    await box(1).uncheck();
    await page.locator('#bRead').click();
    assert.equal(await page.locator('.rw.cur').getAttribute('data-i'),'1');
    const count=await page.evaluate(()=>window.spoken.length);
    await box(1).check();
    await page.evaluate(()=>window.spoken.at(-1).onend());
    assert.equal(await page.evaluate(()=>window.spoken.length),count,'editing checks cancels pending speech');
    for(let i=1;i<=9;i++)await box(i).check();
    await page.locator('#readRepeat').check();await page.locator('#bRead').click();
    assert(await page.locator('#bRead').isEnabled());
    assert.match(await page.locator('#msg').innerText(),/ぜんぶに チェック/);
    assert.equal(await page.evaluate(()=>window.spoken.length),count,'all checked cannot loop');
    await box(3).uncheck();await page.locator('#bRead').click();
    for(let i=0;i<3;i++){
      assert.equal(await page.locator('.rw.cur').getAttribute('data-i'),'3');
      await page.evaluate(()=>window.spoken.at(-1).onend());
    }
    await page.locator('#bStop').click();
    // A checked fact is still available for listening on demand.
    await page.locator('.rw[data-i="1"] .row-listen').click();
    assert.equal(await page.evaluate(()=>window.spoken.at(-1).text),'ニイチガ ニ');
    await page.locator('#bQuiz').click();
    assert(await box(1).isHidden());
    assert.equal(await page.evaluate(()=>window.eval('ord.length')),9,'quiz retains every fact');
    await page.locator('#bToc').click();
    await page.locator('.unit-card').filter({hasText:'3のだん'}).click();await page.locator('#bPrac').click();
    assert.equal(await page.locator('input[data-learned]:checked').count(),0,'checks are per dan');
    await box(2).check();
    for(const width of [1280,768,390,320]){
      await page.setViewportSize({width,height:900});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);
      assert(await box(9).isVisible());
      await page.screenshot({path:path.resolve(__dirname,`../.kuku-work/learn-qa/learned-${width}.png`),fullPage:true});
    }
    await box(2).focus();await page.keyboard.press('Space');assert(!(await box(2).isChecked()));
    await page.locator('.row-listen').first().focus();await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>window.spoken.at(-1).text),'サンイチガ サン');
    assert.deepEqual(errors,[]);
    const fallback=await browser.newPage();
    await fallback.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('blocked')}}));
    await fallback.goto(url);await fallback.locator('#startBtn').click();await fallback.locator('.unit-card').first().click();await fallback.locator('#bPrac').click();
    await fallback.locator('input[data-learned="1"]').check();
    assert.match(await fallback.locator('#msg').innerText(),/ほぞんできません/);
    assert(await fallback.locator('input[data-learned="1"]').isChecked());
    console.log('PASS: skip checked facts, restore unchecked facts, per-dan persistence, cancel stale speech, repeat, all-checked state, manual listen, unchanged quiz, keyboard, four widths, blocked storage.');
  }finally{await browser.close();server.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
