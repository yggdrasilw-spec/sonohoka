'use strict';
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../qa-output/phonics-audio');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.PHONICS_QA_URL||'http://127.0.0.1:8967/phonics-lab/'));
 await page.waitForFunction(()=>window.PHONICS_AUDIO);
 await page.evaluate(()=>{localStorage.setItem('phonics-lab-audio-review',JSON.stringify({'sound:s':'ok'}));localStorage.removeItem('phonics-lab-single-review-version');});
 await page.reload();
 await page.locator('#review-open').click();
 assert.equal(await page.locator('.review-row').count(),220);
 const missing=page.locator('[data-review-key="sound:oo"]');
 assert.equal(await missing.locator('select').inputValue(),'pending');
 assert(await missing.locator('[data-review-play="standard"]').isDisabled());
 assert.match(await missing.textContent(),/単音は先生の録音待ち/);
 assert.equal(await page.evaluate(()=>Object.keys(window.PHONICS_AUDIO).filter(k=>k.startsWith('sound:')).length),30);
 const soundRow=page.locator('[data-review-key="word:sun"]');
 await soundRow.locator('[data-review-play="standard"]').click();
 await page.waitForFunction(()=>document.querySelector('.playing'));
 await soundRow.locator('select').selectOption('replace');
 assert.match(await page.locator('#review-count').textContent(),/差し替えたい 1/);
 await page.reload();await page.locator('#review-open').click();
 assert.equal(await soundRow.locator('select').inputValue(),'replace');
 await page.locator('#review-filter').selectOption('replace');assert.equal(await page.locator('.review-row').count(),1);
 await soundRow.locator('[data-review-record]').click();assert.equal(await page.locator('#record-target').inputValue(),'word:sun');
 assert(await page.locator('#record-standard').isEnabled());
 await page.locator('#record-file').setInputFiles(path.resolve(__dirname,'../phonics-lab/assets/audio/word-sun.mp3'));
 await page.waitForFunction(()=>document.querySelector('#record-state').textContent.includes('先生の声を使っています'));
 await page.locator('#record-play').click();
 // Intercept Audio construction to verify the source chosen by each playback button.
 await page.evaluate(()=>{const Original=window.Audio;window.audioSources=[];window.Audio=function(src){window.audioSources.push(src);return new Original(src);};});
 await page.locator('#record-play').click();assert((await page.evaluate(()=>audioSources.at(-1))).startsWith('blob:'));
 await page.locator('#record-standard').click();assert.match(await page.evaluate(()=>audioSources.at(-1)),/^assets\/audio\/word-sun\.mp3\?v=/);
 await page.reload();await page.locator('#teacher-open').click();await page.locator('#record-target').selectOption('word:sun');
 await page.waitForFunction(()=>document.querySelector('#record-state').textContent.includes('先生の声を使っています'));
 await page.locator('#record-reset').click();await page.waitForFunction(()=>document.querySelector('#record-state').textContent.includes('標準音声があります'));
 assert(await page.locator('#record-reset').isDisabled());
 await page.locator('#record-review').click();await page.locator('#review-filter').selectOption('');
 await page.locator('#review-group').selectOption('英語の音');assert.equal(await page.locator('.review-row').count(),30);
 await page.locator('#review-group').selectOption('次の読み方のきまり');await missing.locator('[data-review-record]').click();
 assert.equal(await page.locator('#record-target').inputValue(),'sound:oo');
 assert(await page.locator('#record-play').isDisabled());assert(await page.locator('#record-standard').isDisabled());
 await page.locator('#record-file').setInputFiles(path.resolve(__dirname,'../phonics-lab/assets/audio/word-sun.mp3'));
 await page.waitForFunction(()=>document.querySelector('#record-state').textContent.includes('先生の声を使っています'));
 assert(await page.locator('#record-play').isEnabled());assert(await page.locator('#record-standard').isDisabled());
 await page.locator('#record-reset').click();await page.waitForFunction(()=>document.querySelector('#record-state').textContent.includes('この単音は先生の録音待ち'));
 assert(await page.locator('#record-play').isDisabled());await page.locator('#record-review').click();
 await page.screenshot({path:path.join(out,'review-desktop.png')});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'review-mobile.png')});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('[data-close="review-dialog"]').click();
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:path.join(out,'lesson-mobile.png')});
 await page.evaluate(()=>{const Original=window.Audio;window.audioSources=[];window.Audio=function(src){window.audioSources.push(src);return new Original(src);};});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('.lesson-nav [data-mode="blend"]').click();await page.locator('#blend-animate').click();
 await page.waitForFunction(()=>audioSources.at(-1)?.startsWith('assets/audio/blend-m-a-joined.mp3?v='));
 // Decode every bundled MP3, verify it contains a signal and save acoustic facts.
 const decoded=await page.evaluate(async()=>{
  const context=new AudioContext(),results=[];
  for(const [key,value] of Object.entries(window.PHONICS_AUDIO)){
   const r=await fetch(value.src);if(!r.ok)throw new Error(key+': HTTP '+r.status);
   const buffer=await context.decodeAudioData(await r.arrayBuffer()),data=buffer.getChannelData(0);
   let peak=0,sum=0;for(const v of data){peak=Math.max(peak,Math.abs(v));sum+=v*v;}
   results.push({key,duration:buffer.duration,peak,rms:Math.sqrt(sum/data.length)});
  }
  await context.close();return results;
 });
 assert.equal(decoded.length,178);for(const r of decoded){assert(r.duration>0.05,r.key+' too short');assert(r.peak>0.001,r.key+' silent');}
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:true,decoded},null,2));
 console.log('PASS: 178 audio files decoded; review persistence, filtering, recording override, standard comparison, reset, mobile layout; no browser errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
