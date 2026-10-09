const assert = require('assert'), path = require('path');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { serve } = require('./capture-portfolio-83.cjs');
async function main() {
  const server = serve(); await new Promise(r => server.listen(8958,'127.0.0.1',r));
  const browser = await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try {
    const page = await browser.newPage({viewport:{width:1280,height:900}}), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8958/app_links_portfolio.html');
    await page.locator('#searchInput').fill('ひとふでヒント');
    assert.equal(await page.locator('.card:visible').count(),1);
    const card=page.locator('#app-83');
    assert.equal(await card.getAttribute('data-video'),'portfolio-83-intro.mp4');
    await card.locator('img').evaluate(img=>img.decode());
    await card.locator('.card-media').hover();
    await page.waitForFunction(()=>document.querySelector('#app-83 video').currentTime>.2);
    assert(await card.locator('.card-media').evaluate(e=>e.classList.contains('is-hover')));
    await card.locator('.card-media').click();
    await page.waitForFunction(()=>document.querySelector('#mediaModal video').currentTime>.2);
    assert(await page.locator('#mediaModal').evaluate(e=>e.open));
    const meta=await page.locator('#mediaModal video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight}));
    console.log('VIDEO metadata',meta);
    assert(meta.duration<=10 && meta.duration>=9.3);
    assert.equal(meta.width,1280);assert.equal(meta.height,720);
    await page.locator('#mediaModal video').evaluate(v=>{v.pause();v.currentTime=8.8;});
    await page.waitForFunction(()=>document.querySelector('#mediaModal video').readyState>=2);
    await page.screenshot({path:path.resolve(__dirname,'../.portfolio-work/demo-83/modal.png')});
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!document.querySelector('#mediaModal video').getAttribute('src'));
    assert.equal(await page.locator('#mediaModal video').getAttribute('src'),null);
    await page.mouse.move(0,0); await page.screenshot({path:path.resolve(__dirname,'../.portfolio-work/demo-83/card.png')});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.reload(); await card.locator('.card-media').hover();
    assert.equal(await card.locator('video').getAttribute('src'),null);
    for(const width of [390,320]) {
      await page.setViewportSize({width,height:844});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await card.locator('.card-media').click();
      await page.waitForFunction(()=>document.querySelector('#mediaModal video').currentTime>.2);
      await page.keyboard.press('Escape');
    }
    assert.deepEqual(errors,[]);
    console.log('PASS app-83: poster, hover, modal, closing, reduced motion, mobile playback',meta);
  } finally {await browser.close();server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
