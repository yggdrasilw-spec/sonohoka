const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve} = require('./portfolio-demo-inspect.cjs');

async function main() {
  const server = serve();
  await new Promise(r => server.listen(8964, '127.0.0.1', r));
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const out = path.resolve(__dirname, '../.kuku-work/learn-qa');
  fs.mkdirSync(out, {recursive:true});
  try {
    const page = await browser.newPage({viewport:{width:1280,height:900}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // Drive native speech callbacks explicitly, including late events after cancellation.
    await page.addInitScript(() => {
      window.spoken = [];
      Object.defineProperty(window, 'speechSynthesis', {value:{
        cancel(){}, speak(u){window.spoken.push(u);}, getVoices(){return [];}
      }});
    });
    await page.goto('http://127.0.0.1:8964/sonohoka/kuku_1to9.html');
    await page.locator('#startBtn').click();
    await page.locator('.unit-card').filter({hasText:'2のだん'}).click();
    await page.locator('#bPrac').click();
    assert.equal(await page.locator('#bPrac').getAttribute('aria-selected'), 'true');
    assert(await page.locator('#qc').isHidden());
    assert(await page.locator('.lv').first().isHidden());
    assert((await page.locator('#tb').boundingBox()).width > 900);
    assert.equal(await page.locator('.chant-reading').first().innerText(), 'にいちがに');
    await page.locator('#bRead').click();
    assert.equal(await page.evaluate(() => window.spoken.length),1,'one utterance per dan');
    assert.equal(await page.evaluate(() => window.spoken[0].text),
      ['ニイチガニ','ニニンガシ','ニサンガロク','ニシガハチ','ニゴジュウ','ニロクジュウニ','ニシチジュウシ','ニハチジュウロク','ニクジュウハチ'].join('、'));
    for(let i=1;i<=9;i++){
      await page.evaluate(i=>{const u=window.spoken.at(-1);const parts=u.text.split('、');u.onboundary({charIndex:parts.slice(0,i-1).reduce((n,t)=>n+t.length+1,0)});},i);
      assert.equal(await page.locator('.rw.cur').getAttribute('data-i'),String(i));
    }
    await page.evaluate(() => window.spoken.at(-1).onend());
    assert(await page.locator('#bRead').isEnabled());
    assert(await page.locator('#bStop').isDisabled());
    await page.locator('#readSpeed').evaluate(el=>{el.value='0.6';el.dispatchEvent(new Event('input'));el.dispatchEvent(new Event('change'));});
    await page.locator('#readRepeat').check();
    await page.locator('#bRead').click();
    assert(Math.abs(await page.evaluate(() => window.spoken.at(-1).rate)-.6)<.00001);
    const beforeDrag=await page.evaluate(()=>window.spoken.length);
    await page.locator('#readSpeed').evaluate(el=>{el.value='2.0';el.dispatchEvent(new Event('input'));});
    assert.equal(await page.locator('#readSpeedValue').innerText(),'2.0倍');
    assert.equal(await page.evaluate(()=>window.spoken.length),beforeDrag,'drag only updates the displayed rate');
    await page.locator('#readSpeed').dispatchEvent('change');
    assert.equal(await page.evaluate(()=>window.spoken.length),beforeDrag+1,'release restarts once');
    assert(Math.abs(await page.evaluate(() => window.spoken.at(-1).rate)-2)<.00001);
    await page.evaluate(() => window.spoken.at(-1).onend());
    assert.equal(await page.locator('.rw.cur').count(),9);
    await page.locator('#bStop').click();
    let before = await page.evaluate(() => window.spoken.length);
    await page.evaluate(() => window.spoken.at(-1).onend());
    assert.equal(await page.evaluate(() => window.spoken.length), before, 'stop invalidates callbacks');
    await page.locator('#bRead').click();
    await page.locator('#bQuiz').click();
    before = await page.evaluate(() => window.spoken.length);
    await page.evaluate(() => window.spoken.at(-1).onend());
    assert.equal(await page.evaluate(() => window.spoken.length), before, 'tab switch stops recitation');
    assert(await page.locator('#qc').isVisible());
    if(!process.argv.includes('--speech-only')){
    // Each ordering is independent of the five scaffold levels; each round visits all nine facts.
    for(const level of [1,3,5]) {
      await page.locator(`.lv[data-l="${level}"]`).click();
      for(const order of ['forward','reverse','random']) {
        await page.locator('#questionOrder').selectOption(order);
        const seen = [];
        for(let i=0;i<9;i++) {
          const qi = await page.evaluate(() => window.eval('qi'));
          seen.push(qi);
          await page.locator(`#ch button[data-v="${2*qi}"]`).click();
          if(i<8) await page.waitForFunction(n => window.eval('qn')===n, i+1);
          else await page.locator('#again').waitFor();
        }
        assert.deepEqual([...seen].sort((a,b)=>a-b), [1,2,3,4,5,6,7,8,9]);
        if(order==='forward') assert.deepEqual(seen, [1,2,3,4,5,6,7,8,9]);
        if(order==='reverse') assert.deepEqual(seen, [9,8,7,6,5,4,3,2,1]);
      }
    }
    // Switching away while the answer is pending must not create another question.
    await page.locator('#again').click();
    const qi = await page.evaluate(() => window.eval('qi'));
    await page.locator(`#ch button[data-v="${2*qi}"]`).click();
    await page.locator('#bPrac').click();
    await page.waitForTimeout(2300);
    assert.equal(await page.locator('#ch button').count(), 0);
    assert(await page.locator('#tb').isVisible(), 'learn restores the full table after level 5');
    }
    for(const width of [1280,768,390,320]) {
      await page.setViewportSize({width,height:900});
      for(const tab of ['bPrac','bQuiz']) {
        await page.locator('#'+tab).click();
        assert(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth), `${tab} overflow at ${width}`);
        await page.screenshot({path:path.join(out, `${tab}-${width}.png`),fullPage:true});
      }
    }
    await page.locator('#bPrac').click();
    await page.locator('.row-listen').first().focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => window.spoken.at(-1).text), 'ニイチガ ニ');
    await page.locator('#bRead').click();
    await page.locator('#bToc').click();
    before = await page.evaluate(() => window.spoken.length);
    await page.evaluate(() => window.spoken.at(-1).onend());
    assert.equal(await page.evaluate(() => window.spoken.length), before, 'navigation stops recitation');
    await page.locator('.unit-card').filter({hasText:'9のだん'}).click();
    await page.locator('#bPrac').click();
    await page.locator('#bRead').click();
    assert.equal(await page.evaluate(() => window.spoken.at(-1).text.split('、')[0]), 'クイチガク');
    await page.evaluate(() => window.spoken.at(-1).onerror());
    assert(await page.locator('#bRead').isEnabled());
    assert.match(await page.locator('#msg').innerText(), /さいせいできません/);
    await page.locator('#readSpeed').focus();await page.keyboard.press('End');
    assert.equal(await page.locator('#readSpeedValue').innerText(),'2.5倍');
    await page.keyboard.press('Home');
    assert.equal(await page.locator('#readSpeedValue').innerText(),'0.5倍');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#readSpeedValue').innerText(),'0.6倍');
    await page.reload();await page.locator('#startBtn').click();await page.locator('.unit-card').first().click();await page.locator('#bPrac').click();
    assert.equal(await page.locator('#readSpeedValue').innerText(),'0.6倍','speed survives reload');
    assert.deepEqual(errors, []);
    const fallback = await browser.newPage();
    await fallback.addInitScript(() => Object.defineProperty(window,'speechSynthesis',{value:undefined}));
    await fallback.goto('http://127.0.0.1:8964/sonohoka/kuku_1to9.html');
    await fallback.locator('#startBtn').click();await fallback.locator('.unit-card').first().click();
    await fallback.locator('#bPrac').click();await fallback.locator('#bRead').click();
    assert.match(await fallback.locator('#msg').innerText(), /こえが つかえません/);
    console.log('PASS: whole-dan recitation, boundary highlighting, slider display/keyboard/persistence, speed on release, repeat, cancellation, navigation, speech errors/fallback, desktop/mobile layouts.'+(process.argv.includes('--speech-only')?'':' Three orders at three levels verified.')+' Native pronunciation remains device-dependent.');
  } finally {await browser.close();server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
