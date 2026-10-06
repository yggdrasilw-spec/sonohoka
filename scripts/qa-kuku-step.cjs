const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const out = path.join(root, '.kuku-work');
// 全81式を資料と照合した期待値。アプリの数値読み生成を使わず、唱え全体を検証する。
const readings = [
  'いんいちがいち いんにがに いんさんがさん いんしがし いんごがご いんろくがろく いんしちがしち いんはちがはち いんくがく',
  'にいちがに ににんがし にさんがろく にしがはち にごじゅう にろくじゅうに にしちじゅうし にはちじゅうろく にくじゅうはち',
  'さんいちがさん さんにがろく さざんがく さんしじゅうに さんごじゅうご さぶろくじゅうはち さんしちにじゅういち さんぱにじゅうし さんくにじゅうしち',
  'しいちがし しにがはち しさんじゅうに ししじゅうろく しごにじゅう しろくにじゅうし ししちにじゅうはち しはさんじゅうに しくさんじゅうろく',
  'ごいちがご ごにじゅう ごさんじゅうご ごしにじゅう ごごにじゅうご ごろくさんじゅう ごしちさんじゅうご ごはしじゅう ごっくしじゅうご',
  'ろくいちがろく ろくにじゅうに ろくさんじゅうはち ろくしにじゅうし ろくごさんじゅう ろくろくさんじゅうろく ろくしちしじゅうに ろくはしじゅうはち ろっくごじゅうし',
  'しちいちがしち しちにじゅうし しちさんにじゅういち しちしにじゅうはち しちごさんじゅうご しちろくしじゅうに しちしちしじゅうく しちはごじゅうろく しちくろくじゅうさん',
  'はちいちがはち はちにじゅうろく はっさんにじゅうし はっしさんじゅうに はちごしじゅう はちろくしじゅうはち はちしちごじゅうろく はっぱろくじゅうし はっくしちじゅうに',
  'くいちがく くにじゅうはち くさんにじゅうしち くしさんじゅうろく くごしじゅうご くろくごじゅうし くしちろくじゅうさん くはしちじゅうに くくはちじゅういち'
].map(row=>row.split(' '));
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.'+decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root+path.sep)) {res.writeHead(403).end(); return;}
  try {
    const data=fs.readFileSync(file);
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.jpg':'image/jpeg','.png':'image/png','.webm':'video/webm'})[path.extname(file)]||'application/octet-stream');
    res.end(data);
  } catch {res.writeHead(404).end();}
});
async function main() {
  await new Promise(r=>server.listen(8963,'127.0.0.1',r));
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    const context=await browser.newContext({viewport:{width:1280,height:900}});
    const page=await context.newPage();
    const errors=[],missing=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
    const click=a=>page.locator(`[data-action="${a}"]`).first().click();
    const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('kuku-small-steps-v1')));
    const url='http://127.0.0.1:8963/kuku_step.html';
    if(!process.argv.includes('--readings-only')) {
    await page.goto(url);
    assert((await page.locator('h1').innerText()).includes('ぱっと見て'));
    assert(!(await page.locator('.brand').innerText()).includes('九九'),'do not disclose the secret before the interview');
    await click('home');
    await page.screenshot({path:path.join(out,'home-desktop.png'),fullPage:true});
    await click('intro');
    assert.equal(await page.locator('.object').count(),6);
    assert(!(await page.locator('#app').innerText()).includes('48'));
    for(let i=0;i<6;i++) {
      await click('challenge-hide');
      assert(await page.locator('.hidden-card').isVisible());
      await click('challenge-rate');
      await click('challenge-next');
    }
    assert(await page.locator('.video-empty').isVisible());
    assert(await page.locator('[data-action="intro-next"]').isHidden(),'no fabricated school video');
    await click('teacher');
    // Synthetic video is a test-only solid-color recording, never a child-facing demonstration.
    const bytes=await page.evaluate(async()=>{
      const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#176958';ctx.fillRect(0,0,320,180);
      const stream=canvas.captureStream(10),rec=new MediaRecorder(stream,{mimeType:'video/webm'}),chunks=[];
      let n=0;const draw=setInterval(()=>{ctx.fillStyle=(++n%2)?'#176958':'#176959';ctx.fillRect(0,0,320,180);},70);
      const blob=await new Promise(resolve=>{rec.ondataavailable=e=>chunks.push(e.data);rec.onstop=()=>resolve(new Blob(chunks,{type:'video/webm'}));rec.start();setTimeout(()=>rec.stop(),900);});
      clearInterval(draw);stream.getTracks().forEach(t=>t.stop());return Array.from(new Uint8Array(await blob.arrayBuffer()));
    });
    await page.locator('#videoFile').setInputFiles({name:'QA-video.webm',mimeType:'video/webm',buffer:Buffer.from(bytes)});
    await page.locator('#videoSaveStatus').filter({hasText:'保存しました'}).waitFor();
    await page.locator('#teacher .close').click();
    await page.locator('#schoolVideo').waitFor();
    await page.locator('#schoolVideo').evaluate(v=>v.play());
    await page.locator('#interviewQuestion').waitFor({state:'visible'});
    await click('video-wrong');
    assert(await page.locator('#videoNext').isHidden());
    await click('video-answer');await click('intro-next');
    for(let i=2;i<=5;i++)await click('intro-next');
    for(let n=1;n<=9;n++){
      const names=['','いち','に','さん','し','ご','ろく','しち','はち','く'];
      if([4,7,9].includes(n)){
        await click('number:'+({4:'よん',7:'なな',9:'きゅう'})[n]);
        assert(await page.locator('#numberNext').isHidden());
      }
      await click('number:'+names[n]);await click('number-next');
    }
    for(const n of [4,7,9]){await click('careful:'+({4:'し',7:'しち',9:'く'})[n]);await click('careful-next');}
    await click('intro-next');await click('start-five');
    assert.equal(await page.locator('.chant-row').count(),9);
    assert(await page.locator('[data-action="random"]').isDisabled());
    assert((await page.locator('.chant-rows').innerText()).includes('ごっく しじゅうご'));
    await page.screenshot({path:path.join(out,'five-desktop.png'),fullPage:true});
    for(const direction of ['forward','reverse']){
      for(let level=1;level<=4;level++){
        if(level===2){
          assert(!(await page.locator('.chant-rows').innerText()).includes('しじゅうご'));
          await click('reveal-row:9');
          assert(await page.locator('[data-action="drill-pass"]').isDisabled());
          await click('hide-row:9');
          assert(!(await page.locator('.chant-rows').innerText()).includes('しじゅうご'));
          assert(await page.locator('[data-action="drill-pass"]').isEnabled());
          await click('reveal-row:9');
          await click('drill-hide');
        }
        if(level===3)assert.equal(await page.locator('.row-reading').count(),0);
        if(level===4){
          assert.equal(await page.locator('.chant-row').count(),0);
          await click('drill-model');assert(await page.locator('[data-action="drill-pass"]').isDisabled());await click('drill-hide');
        }
        await click('drill-pass');
      }
    }
    assert.equal((await state()).dan[5].forward,4);
    assert.equal((await state()).dan[5].reverse,4);
    assert(await page.locator('[data-action="random-show"]').isVisible());
    const firstQ=await page.locator('#randomProblem .equation').textContent();
    const firstB=Number(firstQ.match(/×\s*(\d+)/)[1]);
    await click('random-show');await page.locator('#answer').fill('99');await page.locator('#answerForm button').click();
    assert(await page.locator('#randomRate').isHidden());
    await click('random-hint');
    await page.locator('#answer').fill(String(5*firstB));await page.locator('#answerForm button').click();await click('random-rate:yes');
    const savedQueue=(await state()).dan[5].session.queue;
    const nextB=savedQueue[0];
    await click('random-show');await page.locator('#answer').fill(String(5*nextB));await page.locator('#answerForm button').click();await click('random-rate:yes');
    const beforeReload=(await state()).dan[5].session;
    assert.equal(beforeReload.solved.length,1);
    await page.reload();await click('resume');
    assert.deepEqual((await state()).dan[5].session,beforeReload,'resume retains solved questions and retry order');
    assert((await page.locator('.tag').innerText()).includes('1 / 9'));
    let count=0;
    while(await page.locator('[data-action="random-show"]').count()){
      const text=await page.locator('#randomProblem .equation').textContent();const b=Number(text.match(/×\s*(\d+)/)[1]);
      await click('random-show');await page.locator('#answer').fill(String(5*b));await page.locator('#answerForm button').click();await click('random-rate:yes');
      assert(++count<=12,'retry must terminate');
    }
    assert.equal(count,8,'solved questions stay solved and hinted problem repeats after reload');
    assert.equal((await state()).dan[5].mastered.length,9);
    assert((await page.locator('#app').innerText()).includes('魔法の完成'));
    await page.reload();await click('resume');
    assert(await page.locator('[data-action="random-show"]').isVisible(),'resume completed dan in random mode');
    await click('home');await click('intro'); // saved lesson resumes at the end
    assert((await page.locator('h1').innerText()).includes('見て、隠して'));
    await click('teacher');await click('teacher-video');
    await page.locator('#schoolVideo').waitFor();
    assert.equal(await page.locator('#videoName').innerText(),'QA-video.webm','video persisted');
    await click('home');await click('application');
    const scenePairs=[[8,6],[3,5],[4,4],[2,9],[4,7],[9,6]];
    for(const [a,b] of scenePairs){
      assert.equal(await page.locator('.object').count(),b);
      await page.locator('#sceneAnswer').fill(String(a));await page.locator('#applicationForm button').click();await click('application-next');
      await page.locator('#sceneAnswer').fill(String(b));await page.locator('#applicationForm button').click();await click('application-next');
      await click('application-formula:1');assert(await page.locator('#applicationNext').isHidden());
      await click('application-formula:0');await click('application-next');
      await page.locator('#sceneAnswer').fill(String(a*b));await page.locator('#applicationForm button').click();await click('application-next');
    }
    // Every dan's numeric equations, unlock sequence, and all nine random facts.
    for(const a of [2,3,4,6,7,8,9,1]){
      await click('map');await click('dan:'+a);
      const text=await page.locator('.chant-rows').innerText();
      for(let b=1;b<=9;b++)assert(text.includes(`${a} × ${b} ＝ ${a*b}`));
      for(let i=0;i<8;i++)await click('drill-pass');
      for(let i=0;i<9;i++){
        const text=await page.locator('#randomProblem .equation').textContent(),b=Number(text.match(/×\s*(\d+)/)[1]);
        await click('random-show');await page.locator('#answer').fill(String(a*b));await page.locator('#answerForm button').click();await click('random-rate:yes');
      }
      assert.equal((await state()).dan[a].mastered.length,9);
    }
    await click('home');await click('resume');
    const speedB=Number((await page.locator('#randomProblem .equation').textContent()).match(/×\s*(\d+)/)[1]);
    await click('random-show');await page.locator('#answer').fill(String(speedB));await page.locator('#answerForm button').click();await click('random-rate:yes');
    await click('teacher');await page.locator('#fastSeconds').selectOption('5');await page.locator('#teacher .close').click();
    await page.locator('.tag').filter({hasText:'0 / 9'}).waitFor();
    assert.equal((await state()).dan[1].session.queue.length,9,'new speed setting restarts an unfinished random session');
    assert(Object.values((await state()).dan).every(d=>d.mastered.length===0),'mastery records follow the new speed setting');
    for(const width of [768,390,320]){
      await page.setViewportSize({width,height:900});await click('home');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'home overflow '+width);
      await page.screenshot({path:path.join(out,`home-${width}.png`),fullPage:true});
      await click('map');await click('dan:5');await click('home');await click('map');await click('dan:3');
      // Completed dan resumes in random; return to a visible nine-line recitation.
      await click('home');await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('kuku-small-steps-v1'));s.dan[5].forward=0;s.dan[5].reverse=0;localStorage.setItem('kuku-small-steps-v1',JSON.stringify(s));});await page.reload();await click('map');await click('dan:5');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'chant overflow '+width);
      await page.screenshot({path:path.join(out,`five-${width}.png`),fullPage:true});
      if(width===390){
        await click('drill-pass');
        await page.locator('[data-action="reveal-row:9"]').scrollIntoViewIfNeeded();
        const y=await page.evaluate(()=>scrollY);
        await click('reveal-row:9');
        assert(Math.abs(await page.evaluate(()=>scrollY)-y)<80,'single answer reveal must keep scroll position');
        assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'hide-row:9');
        await click('hide-row:9');
        assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'reveal-row:9');
      }
    }
    await click('home');await click('teacher');await click('remove-video');
    await page.locator('.video-empty').waitFor();
    assert(await page.locator('.video-empty').isVisible());
    await click('teacher');await click('reset-ask');await click('reset-confirm');
    assert.equal((await state()).intro,0);assert.equal(Object.keys((await state()).dan).length,0);
    await page.reload();await click('teacher');await click('teacher-video');assert(await page.locator('.video-empty').isVisible(),'video deleted from indexedDB');
    assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
    }
    // 実際の画面と読み上げAPI入力を全81式で確認。音声エンジンの発音そのものは端末依存。
    const speechPage=await context.newPage();
    await speechPage.addInitScript(()=>{
      window.spoken=[];
      Object.defineProperty(window,'speechSynthesis',{value:{cancel(){},getVoices(){return [];},speak(u){window.spoken.push({text:u.text,lang:u.lang});setTimeout(()=>u.onend?.(),0);}}});
    });
    for(let a=1;a<=9;a++){
      await speechPage.goto(url+'?practice='+a);
      await speechPage.evaluate(()=>localStorage.removeItem('kuku-small-steps-v1'));
      await speechPage.reload();
      for(let b=1;b<=9;b++){
        const row=speechPage.locator(`.chant-row[data-b="${b}"]`);
        assert.equal((await row.locator('.row-reading').innerText()).replace(/\s/g,''),readings[a-1][b-1],`display ${a}×${b}`);
        await row.locator('[data-action^="speak-row:"]').click();
        const spoken=await speechPage.evaluate(()=>window.spoken.at(-1));
        const expected=readings[a-1][b-1].replace(/[ぁ-ゖ]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60));
        assert.equal(spoken.text.replace(/、/g,''),expected,`speech ${a}×${b}`);
        assert.equal(spoken.lang,'ja-JP');
      }
    }
    await speechPage.goto(url+'?practice=5');
    for(const direction of ['forward','reverse']){
      if(direction==='reverse'){
        await speechPage.evaluate(()=>{const s=JSON.parse(localStorage.getItem('kuku-small-steps-v1'));s.dan[5]={forward:4,reverse:0,mastered:[],randomDone:false};localStorage.setItem('kuku-small-steps-v1',JSON.stringify(s));});
        await speechPage.reload();
      }
      await speechPage.evaluate(()=>window.spoken=[]);
      await speechPage.locator('[data-action="drill-listen"]').click();
      await speechPage.waitForFunction(()=>window.spoken.length===9);
      const actual=await speechPage.evaluate(()=>window.spoken.map(u=>u.text.replace(/、/g,'')));
      const expected=readings[4].map(t=>t.replace(/[ぁ-ゖ]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60)));
      assert.deepEqual(actual,direction==='forward'?expected:expected.reverse(),direction+' continuous speech');
    }
    const alternatives={'3x2':'さにがろく','3x3':'さざんがきゅう','3x6':'さんろくじゅうはち','4x8':'しわさんじゅうに','8x3':'はちさんにじゅうし','8x4':'はちしさんじゅうに'};
    for(const [id,expected] of Object.entries(alternatives)){
      const [a,b]=id.split('x').map(Number);
      await speechPage.goto(url+'?practice='+a);
      await speechPage.locator('[data-action="teacher"]').click();
      await speechPage.locator(`[data-reading="${id}"]`).selectOption('1');
      assert((await speechPage.locator('.teacher-readings').textContent()).replace(/\s/g,'').includes(expected),'teacher list '+id);
      await speechPage.locator('#teacher .close').click();
      const row=speechPage.locator(`.chant-row[data-b="${b}"]`);
      await speechPage.waitForFunction(({b,expected})=>document.querySelector(`.chant-row[data-b="${b}"] .row-reading`)?.textContent.replace(/\s/g,'')===expected,{b,expected});
      assert.equal((await row.locator('.row-reading').innerText()).replace(/\s/g,''),expected);
      await row.locator('[data-action^="speak-row:"]').click();
      assert.equal(await speechPage.evaluate(()=>window.spoken.at(-1).text.replace(/、/g,'')),expected.replace(/[ぁ-ゖ]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60)));
      await speechPage.reload();
      assert.equal((await row.locator('.row-reading').innerText()).replace(/\s/g,''),expected,'saved '+id);
      await speechPage.locator('[data-action="teacher"]').click();
      assert.equal(await speechPage.locator(`[data-reading="${id}"]`).inputValue(),'1');
      await speechPage.locator(`[data-reading="${id}"]`).selectOption('0');
      await speechPage.locator('#teacher .close').click();
      await speechPage.waitForFunction(({b,expected})=>document.querySelector(`.chant-row[data-b="${b}"] .row-reading`)?.textContent.replace(/\s/g,'')===expected,{b,expected:readings[a-1][b-1]});
      assert.equal((await row.locator('.row-reading').innerText()).replace(/\s/g,''),readings[a-1][b-1]);
    }
    assert.deepEqual(await speechPage.evaluate(()=>JSON.parse(localStorage.getItem('kuku-small-steps-v1')).dan[5]),{forward:4,reverse:0,mastered:[],randomDone:false,session:null},'reading choices retain progress');
    await speechPage.close();
    console.log('PASS: all 81 displayed readings and katakana speech inputs, forward/reverse continuous speech, six alternative settings and persistence.');
    // Storage-disabled environments must still render and allow local practice.
    const blocked=await browser.newContext();const p2=await blocked.newPage();
    await p2.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}});Object.defineProperty(window,'indexedDB',{get(){throw new Error('blocked');}});});
    await p2.goto(url);await p2.locator('#homeButton').click();await p2.locator('[data-action="map"]').click();await p2.locator('[data-action="dan:5"]').click();assert.equal(await p2.locator('.chant-row').count(),9);
    await blocked.close();
    if(!process.argv.includes('--readings-only'))console.log('PASS: 10-stage introduction, local video playback/persistence/deletion, 4/7/9 readings, all 9 dans and 81 facts, hint retry, forward/reverse gates, saved progress, six four-step applications, desktop/mobile layouts, blocked-storage fallback.');
    await context.close();
  } finally {await browser.close();server.close();}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1;});
