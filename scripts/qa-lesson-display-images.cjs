const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  fs.readFile(file, (error, data) => {
    if (error) {res.writeHead(404);res.end();return;}
    const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.webp':'image/webp','.png':'image/png'};
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');res.end(data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({headless:true, channel:'msedge', timeout:30000});
  const page = await browser.newPage({viewport:{width:1280,height:900}});
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => requests.push(r.url()));
  await page.route('https://**', route => route.abort());
  await page.addInitScript(() => localStorage.setItem('my-town-v1', JSON.stringify({version:1,title:'Image QA',plots:['house','park',...Array(14).fill(null)],start:0,goal:1})));
  try {
    await page.goto(`${base}/my-town/`);
    await page.locator('.place-card:visible').first().click();
    assert(await page.locator('#enlarge-picture').isEnabled());
    assert.equal(requests.filter(u => /\/assets\/(places|map-places)\//.test(u)).length, 0);
    await page.locator('#enlarge-picture').click();
    await page.locator('#picture-original').evaluate(img => img.decode());
    assert(await page.locator('#picture-dialog').evaluate(d => d.open));
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('picture-original').hasAttribute('src'));
    assert.equal(await page.locator('#picture-original').getAttribute('src'), null);
    await page.locator('#open-map').click();
    assert(await page.locator('#plots img').evaluateAll(images => images.length > 0 && images.every(img => img.src.includes('/map-places/'))));
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => [...document.querySelectorAll('#plots img')].every(img=>img.src.includes('/display-map-places/')));
    assert(await page.locator('#plots img').evaluateAll(images => images.every(img => img.src.includes('/display-map-places/'))));
    await page.setViewportSize({width:390,height:844});
    await page.locator('#edit-tab').click();
    await page.locator('#enlarge-picture').click();
    assert(await page.locator('#close-picture').isVisible());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    fs.mkdirSync(path.join(root, 'qa-output/lesson-images'), {recursive:true});
    await page.screenshot({path:path.join(root, 'qa-output/lesson-images/town-mobile.png')});
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('picture-dialog').open);
    await page.setViewportSize({width:1280,height:900});
    await page.goto(`${base}/beaver_sym.html`, {waitUntil:'domcontentloaded'});
    await page.locator('#learning-gate .primary').click();
    await page.waitForTimeout(100); // Entry schedules MODE1 after 50 ms.
    await page.evaluate(() => {voiceEnabled=false;sfxEnabled=false;switchMode('MODE2');resetMode2();});
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const snapshot = () => page.evaluate(() => ({wall:[...m2Wall],next:m2ActiveGapIndex,count:m2FilledCount,done:m2Completed,mode:appMode}));
    assert.equal((await snapshot()).next, 0);
    await page.evaluate(() => handleMode2Click(460, 250));
    assert.equal((await snapshot()).count, 0);
    for (let i=0;i<8;i++) {
      const canvas = await page.locator('#simCanvas').boundingBox();
      const x=canvas.x+canvas.width*460/920,y=canvas.y+canvas.height*(175+(i+.5)*18.75)/500;
      assert.equal(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.id,{x,y}),'simCanvas');
      await page.mouse.click(x,y);
      const actual = await snapshot();
      assert.deepEqual(actual.wall, Array.from({length:8}, (_,n)=>n<=i));
      assert.equal(actual.count, i+1);assert.equal(actual.next, i===7?-1:i+1);
      if(i===3)await page.screenshot({path:path.join(root, 'qa-output/lesson-images/beaver-half.png')});
    }
    assert((await snapshot()).done);
    await page.evaluate(() => resetMode2());assert.equal((await snapshot()).next, 0);
    for(let n=0;n<=8;n++) {
      await page.evaluate(n => {resetMode2();currentSealedRatio=n/8;syncMode2FromMode1();},n);
      assert.deepEqual((await snapshot()).wall,Array.from({length:8},(_,i)=>i<n));
    }
    await page.evaluate(() => {const photo=document.getElementById('beaver-carrier');photo.src='img/display/beaver_swim_branch.webp';photo.click();});
    await page.locator('#beaver-image-preview img').evaluate(img => img.decode());
    assert((await page.locator('#beaver-image-preview img').getAttribute('src')).endsWith('/img/beaver_swim_branch.png'));
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#beaver-image-preview img').hasAttribute('src'));
    assert.equal(await page.locator('#beaver-image-preview img').getAttribute('src'),null);
    assert.deepEqual(errors,[]);
    console.log('PASS: small default images, originals on demand, map zoom, mobile dialog, 8 contiguous steps, reset and 9 mode-sync states');
  } finally {await browser.close();server.close();}
})().catch(error => {console.error(error);process.exitCode=1;server.close();});
