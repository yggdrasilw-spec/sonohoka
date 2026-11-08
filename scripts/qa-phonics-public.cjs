'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const entry='https://yggdrasilw-spec.github.io/sonohoka/phonics-lab/english.html#advanced';
const home='https://yggdrasilw-spec.github.io/english-stage/';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(home,{waitUntil:'domcontentloaded'});
  const link=page.locator('.banner-phonics');await link.waitFor({timeout:45000});assert.equal(await link.getAttribute('href'),entry);
  await link.click();await page.locator('#phonics-story').waitFor({timeout:45000});await page.locator('[data-story-action="play"]').click();await page.locator('[data-story-frame="0:1"]').waitFor({timeout:20000});await page.locator('[data-story-action="play"]').click();assert.equal(await page.locator('.story-player img').getAttribute('src'),await page.evaluate(()=>PHONICS_STORY_IMAGES.images.cute.src));await page.screenshot({path:path.resolve(__dirname,'../qa-output/phonics-extension/public-story.png'),fullPage:true});await page.locator('.story-options > summary').click();await page.locator('[data-story-practice]').click();await page.locator('[data-explore="oo"]').waitFor({timeout:45000});assert.equal(await page.locator('[data-explore]').count(),9);
  assert(!/ローマ字|日本語/.test(await page.locator('body').innerText()));
  const originalImages=await page.evaluate(async()=>Promise.all(Object.values(PHONICS_STORY_IMAGES.images).map(async i=>{const img=new Image();img.src=i.src;await img.decode();return i.src;})));assert.equal(originalImages.length,17);
  const words=await page.evaluate(async()=>{const ac=new AudioContext();try{const result=[];for(const w of Object.values(PHONICS_ADVANCED.words)){const r=await fetch(w.audio.src);if(!r.ok)throw Error(w.id+' HTTP '+r.status);const b=await ac.decodeAudioData(await r.arrayBuffer());if(b.duration<.1)throw Error('empty '+w.id);result.push(w.id);}return result;}finally{await ac.close();}});assert.equal(words.length,17);
  await page.locator('[data-explore="oo"]').click();assert(await page.locator('[data-explore-start="listen"]').isDisabled());await page.locator('[data-explore-start="text"]').click();await page.locator('[data-explore-answer]').first().click();await page.locator('.explore-feedback').waitFor();
  await page.locator('.lesson-nav [data-mode="sounds"]').click();await page.locator('[data-sound="m"]').first().click();await page.locator('[data-audio="sound:m"]').click();await page.waitForFunction(()=>!document.querySelector('[data-audio="sound:m"]').classList.contains('playing'));
  await page.locator('.lesson-nav [data-mode="advanced"]').click();await page.locator('[data-explore-again]').click();await page.locator('[data-explore-back]').click();
  const out=path.resolve(__dirname,'../qa-output/phonics-extension');fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'public-desktop.png'),fullPage:true});
  await page.locator('.english-return a').click();await page.locator('.banner-phonics').waitFor({timeout:45000});
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'public-result.json'),JSON.stringify({entry,home,words,originalImages,autoplay:'real cut -> cute; paused; original pictures',questions:'text feedback works; unreviewed listening blocked',teacherSound:'m played',links:'home -> explorer -> home',errors},null,2));
  console.log('PASS PUBLIC: English Stage -> autoplay story -> practice -> English Stage; 17 original images; 9 explorations; 17 MP3 decodes; feedback; audio approval gate; teacher sound m; no page errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
