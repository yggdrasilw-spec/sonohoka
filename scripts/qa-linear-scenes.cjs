const fs = require('node:fs');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const {chromium} = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({headless:true,channel:'msedge'});
  const page = await browser.newPage({viewport:{width:1600,height:900}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(pathToFileURL(require('node:path').resolve('ichiji_kansu_lab_v11.html')).href);
  await page.locator('#startBtn').click();
  assert.equal(await page.locator('.sceneDrawing').getAttribute('aria-label'), '土台3cmに2cmのブロックが0個。全体は3cm。');
  await page.locator('#exploreXPlus').click();
  assert.match(await page.locator('.sceneDrawing').getAttribute('aria-label'), /ブロックが1個。全体は5cm/);
  await page.locator('[data-answer="1"]').click();
  assert.equal(await page.locator('#lessonNext').isEnabled(), true);
  await page.locator('#lessonNext').click();
  assert.match(await page.locator('.sceneDrawing').getAttribute('aria-label'), /土台1cmに3cm/);
  for (let lesson = 1; lesson <= 19; lesson++) {
    const count = await page.evaluate(id => lessonPlan[id - 1].tasks.length, lesson);
    for (let task = 0; task < count; task++) {
      await page.evaluate(({lesson,task}) => {openSyllabus(lesson);lessonTask=task;initLessonTask();renderSyllabus();}, {lesson,task});
      assert.equal(await page.locator('#lessonGraph').count(), 1);
      const hasScene = lesson === 1 || lesson === 17 || await page.evaluate(() => !!currentTask().model);
      assert.equal(await page.locator('.linearScene').count(), Number(hasScene));
      if (hasScene) {
        const clipped = await page.locator('.linearScene').evaluate(el => el.getBoundingClientRect().right > el.parentElement.getBoundingClientRect().right);
        assert.equal(clipped, false);
      }
    }
  }
  await page.evaluate(() => openSyllabus(17));
  await page.locator('[data-scene-time="2"]').click();
  assert.match(await page.locator('.sceneDrawing').getAttribute('aria-label'), /Aは5L、Bは6L/);
  await page.locator('[data-answer="1"]').click();
  await page.locator('#lessonNext').click();
  assert.equal(await page.locator('.sceneControls [aria-pressed="true"]').innerText(), '0分後');
  await page.locator('[data-scene-time="3"]').click();
  assert.match(await page.locator('.sceneDrawing').getAttribute('aria-label'), /Aは7L、Bは7L/);
  await page.locator('#answer-x').fill('3');
  await page.locator('#answer-y').fill('7');
  await page.locator('#lessonCheck').click();
  assert.equal(await page.locator('#lessonNext').isEnabled(), true);
  fs.mkdirSync('C:/Users/user/.cache/linear-scenes-qa',{recursive:true});
  for (const [lesson,name] of [[1,'blocks'],[15,'warming'],[17,'tanks']]) {
    await page.evaluate(id => openSyllabus(id), lesson);
    if(lesson===1) await page.locator('#exploreXPlus').click();
    if(lesson===17) await page.locator('[data-scene-time="2"]').click();
    await page.locator('.warmingScene img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
    await page.screenshot({path:`C:/Users/user/.cache/linear-scenes-qa/${name}.png`});
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(async()=>{fit();await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);document.getElementById('viewport').scrollTo(0,0);});
    await page.screenshot({path:`C:/Users/user/.cache/linear-scenes-qa/${name}-mobile.png`});
    await page.setViewportSize({width:1600,height:900});
  }
  assert.deepEqual(errors, []);
  console.log('PASS: all 19 lessons and tasks render; blocks, water levels, answers, image loading and scene bounds verified.');
  await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
