const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { serve } = require('./portfolio-demo-inspect.cjs');
const publicBase = process.argv[2];
const posterOnly = process.env.WORD_LESSONS_POSTERS === '1';
const suffix = process.env.WORD_LESSONS_RELEASE ? '?release=' + process.env.WORD_LESSONS_RELEASE : '';

async function checkWidth(page) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'page overflow at ' + page.viewportSize().width);
}

async function checkNakama(page) {
  await page.locator('#snd').click();
  for (const [course, mode] of [['k','a'],['k','b'],['k','c'],['h','a'],['h','b'],['h','e'],['h','g']]) {
    await page.locator('[data-e=' + course + ']').click();
    await page.locator('[data-m=' + mode + ']').click();
    if (mode === 'c') {
      assert.equal(await page.evaluate(() => new Set(Q.map(q=>q.pw)).size), 10);
      assert.equal(await page.locator('.set .pic, .set rt').count(), 0);
    }
    for (let n = 0; n < 10; n++) {
      const answer = await page.evaluate(() => Q[i].ch.indexOf(Q[i].ans));
      assert(answer >= 0);
      assert.equal(await page.locator('.c').count(), 4);
      assert.equal(await page.evaluate(() => new Set(Q[i].ch).size), 4);
      await checkWidth(page);
      if (n === 0) {
        const wrong = page.locator('.c').nth((answer + 1) % 4);
        await wrong.click();
        assert(await wrong.isDisabled());
        assert.match(await page.locator('#fb').innerText(), /もういちど/);
      }
      await page.locator('.c').nth(answer).click();
      assert.match(await page.locator('#fb').innerText(), /せいかい/);
      assert.equal(await page.locator('.c:disabled').count(), 4);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'nxt');
      const next = await page.locator('#nxt').boundingBox();
      assert(next.y >= 0 && next.y + next.height <= page.viewportSize().height + 1, 'next action off screen');
      await page.keyboard.press('Enter');
    }
    assert.match(await page.locator('#app').innerText(), /9 \/ 10/);
    await page.locator('#cov').click();
  }
  await page.locator('[data-e=h]').click();
  await page.locator('[data-m=z]').click();
  assert.equal(await page.locator('.vo').count(), 4);
  await checkWidth(page);
  await page.locator('#menu').click();
  await page.locator('[data-m=v]').click();
  await page.locator('[data-v="1"]').click();
  await page.locator('[data-w="あゆ"]').press('Enter');
  assert.match(await page.locator('#vcard').innerText(), /みずうみ/);
  await page.locator('#menu').click();
  await page.locator('[data-m=s]').click();
  const datasets = await page.evaluate(() => VN.map(v => ['A','AB','B','O'].flatMap(key=>v[key].map(word=>[word,key]))));
  for (const [tab, entries] of datasets.entries()) {
    await page.locator('[data-s="' + tab + '"]').click();
    for (const [index, [word, region]] of entries.entries()) {
      await page.locator('[data-t="' + word + '"]').press('Enter');
      if (index === 0) {
        const wrong = region === 'A' ? 'B' : 'A';
        await page.locator('[data-region="' + wrong + '"]').press('Enter');
        await page.locator('[data-region="' + wrong + '"]').press('Enter');
        assert.match(await page.locator('#sfb').innerText(), /ヒント/);
      }
      await page.locator('[data-region="' + region + '"]').press('Enter');
      assert.match(await page.locator('#sfb').innerText(), /せいかい/);
      assert.equal(await page.locator('[data-w="' + word + '"]').count(), 1);
    }
    assert.match(await page.locator('.tray').innerText(), /ぜんぶ/);
    await page.locator('[data-s="' + tab + '"]').click();
    assert.match(await page.locator('.tray').innerText(), /ぜんぶ/);
    await checkWidth(page);
  }
  const diagram = page.locator('.vsv');
  await page.locator('[data-s="0"]').click();
  await page.locator('[data-t="くま"]').click();
  await diagram.evaluate(svg=>{svg.parentElement.scrollIntoView({block:'center'});svg.parentElement.scrollLeft=160;});
  const point = await diagram.evaluate(svg => new DOMPoint(460,220).matrixTransform(svg.getScreenCTM()));
  await page.mouse.click(point.x,point.y);
  assert.match(await page.locator('#sfb').innerText(), /せいかい/);
  await page.reload();
  await page.locator('[data-e=r]').click();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('nakama_kotoba_v1')).r.length), 7);
  await page.evaluate(() => localStorage.setItem('nakama_kotoba_v1', JSON.stringify({r:[{d:'<img src=x onerror=alert(1)>',s:3,n:10,m:'a'}],s:{'きせつ':[5,4]},x:{bad:{set:null}, legacy:{set:['山'],ans:'やま',m:'c'}}})));
  await page.reload();
  await page.locator('[data-e=r]').click();
  assert.match(await page.locator('#app').innerText(), /4 \/ 5/);
  assert.match(await page.locator('#app').innerText(), /やま/);
  assert.equal(await page.locator('#app img').count(),0);
  await checkWidth(page);
}

async function checkWago(page, exhaustive) {
  await page.evaluate(() => { window.spoken=[];speechSynthesis.speak=u=>spoken.push(u.text); });
  await page.locator('[data-m=s]').click();
  const slides = await page.locator('#slide option').count();
  for (let i=0;i<slides;i++) {
    await page.locator('#slide').selectOption(String(i));
    assert.equal(await page.evaluate(()=>i),i);
    await checkWidth(page);
    assert(await page.locator('#nx').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight));
  }
  await page.locator('#slide').selectOption('6');
  assert.match(await page.locator('#bd').innerText(), /ドリンクを オーダーする/);
  await page.locator('#sp').click();
  assert.match(await page.evaluate(()=>spoken.pop()), /ドリンクを オーダーする/);
  await page.locator('#hm').click();
  await page.locator('[data-k=b]').click();
  await page.evaluate(() => { Q2=[C[15]];show(); });
  await page.locator('[data-t=g]').click();
  assert.match(await page.locator('#fb').innerText(), /場面に 合う/);
  await page.locator('#bk').click();
  await page.waitForTimeout(400);
  assert.deepEqual(await page.evaluate(()=>spoken), []);
  await page.locator('[data-k=a]').click();
  await page.evaluate(()=>{Q2=[Q[0],Q[1]];show();});
  for (const [word, note] of [['山','漢字で 書いても'],['空','日本で むかしから']]) {
    await page.locator('[data-t=w]').click();
    assert.match(await page.locator('#fb').innerText(), new RegExp(word));
    assert.match(await page.locator('#fb').innerText(), new RegExp(note));
    await page.waitForFunction(()=>spoken.length>0);
    const speech=await page.evaluate(()=>spoken.pop());
    assert.match(speech,new RegExp(note));
    if(word==='空'){
      assert.doesNotMatch(await page.locator('#fb').innerText(), /山/);
      assert.doesNotMatch(speech,/山/);
    }
    await page.locator('#nx').click();
  }
  await page.locator('.result-review summary').click();
  assert.match(await page.locator('.result-review li').first().innerText(), /漢字で 書いても/);
  assert.doesNotMatch(await page.locator('.result-review li').last().innerText(), /山/);
  await page.locator('#bk').click();
  await page.locator('[data-k=a]').click();
  await page.locator('#sn').click();
  assert(await page.locator('#sp').isDisabled());
  for(let n=0;n<15;n++){
    const key = await page.evaluate(()=>Q2[qi][2]);
    await page.locator('[data-t="'+key+'"]').click();
    assert.equal(await page.locator('.ab:disabled').count(),3);
    await page.locator('#nx').press('Enter');
  }
  assert.match(await page.locator('#bd').innerText(), /15 \/ 15/);
  await page.locator('summary').click();
  assert.equal(await page.locator('.result-review li:visible').count(),15);
  await page.locator('#nx').click();
  assert(await page.locator('#nx').isDisabled());
  assert.deepEqual(await page.evaluate(()=>spoken), []);
  await page.locator('#bk').click();
  await page.locator('[data-k=b]').click();
  for(let n=0;n<6;n++){
    const key = await page.evaluate(()=>Q2[qi][2]);
    await page.locator('[data-t="'+key+'"]').click();
    await page.locator('#nx').press('Enter');
  }
  assert.match(await page.locator('#bd').innerText(), /6 \/ 6/);
  if (!exhaustive) return;
  const expected = ['wg','wkg','g','wkg','k','kg','w','k','wg','wg','k','g','w','wk','g','wkg','wkg','g','wg','wkg','g','wkg','wkg','kg','wg','kg','g'];
  assert.equal(await page.evaluate(()=>Q.length),90);
  assert.equal(await page.evaluate(()=>C.length),expected.length);
  const counts = await page.evaluate(()=>T.map(t=>Q.filter(row=>row[2]===t).length));
  assert.deepEqual(counts,[30,30,30]);
  const expectedTypes = 'w'.repeat(30) + 'k'.repeat(30) + 'g'.repeat(30);
  for (const [n, letter] of [...expectedTypes].entries()) {
    await page.evaluate(n=>{m='q';kd='a';qi=sc=done=0;Q2=[Q[n]];answers=[];show();},n);
    await page.locator('[data-t="'+letter+'"]').click();
    assert.match(await page.locator('#fb').innerText(), /せいかい/);
    if(n!==0)assert.doesNotMatch(await page.locator('#fb').innerText(), /漢字で 書いても 和語/);
  }
  for (let n=0;n<expected.length;n++) for (const letter of 'wkg') {
    await page.evaluate(n=>{m='q';kd='b';qi=sc=done=0;Q2=[C[n]];answers=[];show();},n);
    assert.equal(await page.locator('.ab.ok, .ab.ng').count(),0);
    assert.equal(await page.locator('.ab').evaluateAll(es=>new Set(es.map(e=>getComputedStyle(e).backgroundColor)).size),1);
    await page.locator('[data-t="'+letter+'"]').click();
    assert.equal(await page.evaluate(()=>sc),Number(expected[n].includes(letter)), 'scene '+(n+1)+' option '+letter);
    assert(!await page.locator('#fb').innerText().then(text=>text.includes('＿＿')));
    assert.equal(await page.locator('.ab:disabled').count(),3);
  }
}

(async () => {
  const server = serve();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const base = publicBase || 'http://127.0.0.1:' + server.address().port + '/sonohoka/';
  const errors = [];
  try {
    if (posterOnly) {
      const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});
      await page.goto(base+'nakama_kotoba.html');
      await page.locator('[data-e=h]').click();
      await page.locator('[data-m=v]').click();
      await page.locator('.vscroll').screenshot({path:'media/portfolio-116-intro.png'});
      await page.goto(base+'wago_kango_gairaigo.html');
      await page.locator('[data-m=s]').click();
      await page.locator('#slide').selectOption('6');
      await page.screenshot({path:'media/portfolio-120-intro.png'});
      return;
    }
    for (const [width,height] of [[320,568],[390,844],[768,1024],[1024,768],[1280,720],[568,320]]) {
      const p=await browser.newPage({viewport:{width,height},hasTouch:width<=768,reducedMotion:'reduce'});
      p.on('pageerror',e=>errors.push(e.message));
      await p.goto(base+'app_links_portfolio.html'+suffix);
      assert.equal(await p.locator('#appCount').innerText(),(await p.locator('article.card').count())+'本');
      for (const [id,grade,search,file] of [[116,'2','ベン図','nakama_kotoba.html'],[120,'5','混種語','wago_kango_gairaigo.html']]) {
        const card=p.locator('#app-'+id);
        await p.locator('#searchInput').fill(search);
        await p.locator('#categorySelect').selectOption('国語');
        await p.locator('#gradeSelect').selectOption(grade);
        assert(await card.isVisible());
        await card.locator('img').evaluate(img=>img.decode());
        const [app]=await Promise.all([p.waitForEvent('popup'),card.getByRole('link',{name:'開く'}).click()]);
        app.on('pageerror',e=>errors.push(e.message));
        assert(new URL(app.url()).pathname.endsWith('/'+file));
        if (suffix) await app.goto(base+file+suffix);
        await checkWidth(app);
        if(id===116)await checkNakama(app);else await checkWago(app,width===1280);
        await app.close();
      }
      await p.close();
      console.log('PASS', width+'×'+height, '作品集・検索・起動・両教材');
    }
    if (publicBase) {
      for (const file of ['app_links_portfolio.html','nakama_kotoba.html','wago_kango_gairaigo.html','media/portfolio-116-intro.png','media/portfolio-120-intro.png']) {
        const response=await fetch(base+file+suffix);
        assert.equal(response.status,200,file);
        const remote=Buffer.from(await response.arrayBuffer()),local=fs.readFileSync(file);
        if(file.endsWith('.html'))assert.equal(remote.toString().replace(/\r\n/g,'\n'),local.toString().replace(/\r\n/g,'\n'),file);
        else assert(remote.equals(local),file);
      }
    }
    assert.deepEqual(errors,[]);
  }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
