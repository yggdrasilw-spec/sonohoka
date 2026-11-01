'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../phonics-lab'),out=path.resolve(__dirname,'../qa-output/phonics-teacher');fs.mkdirSync(out,{recursive:true});
const ctx={window:{}};for(const file of ['data.js','audio-data.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const sounds=ctx.window.PHONICS.sounds,audio=ctx.window.PHONICS_AUDIO,provenance=require('../phonics-lab/assets/audio/teacher-recording.json');
assert.equal(Object.keys(audio).length,178);assert.equal(provenance.entries.length,30);
for(const [i,s]of sounds.entries()){const e=provenance.entries[i];assert.equal(e.id,s.id);assert.equal(audio['sound:'+s.id].kind,'teacher-recording');assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'assets/audio',e.file))).digest('hex'),e.sha256);}
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8967/phonics-lab/#sounds');
 await page.evaluate(()=>{const Original=window.Audio;window.played=[];window.Audio=function(src){played.push(src);return new Original(src);};});
 for(const s of sounds){await page.locator(`[data-sound="${s.id}"]`).first().click();await page.locator(`[data-audio="sound:${s.id}"]`).click();assert.equal(await page.evaluate(()=>played.at(-1)),audio['sound:'+s.id].src);}
 await page.locator('.lesson-nav [data-mode="reading"]').click();await page.locator('[data-audio="sound:b"]').first().click();assert.equal(await page.evaluate(()=>played.at(-1)),audio['sound:b'].src);
 // A previously adopted TTS cutout must not hide the new teacher standard.
 await page.evaluate(async()=>{const bytes=await (await fetch(PHONICS_AUDIO['sound:s'].src)).arrayBuffer();await new Promise((resolve,reject)=>{const r=indexedDB.open('phonics-lab-voice',1);r.onsuccess=()=>{const tx=r.result.transaction('recordings','readwrite');tx.objectStore('recordings').put({key:'sound:s',blob:new Blob([bytes],{type:'audio/wav'}),source:'cutout'});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);};});});
 await page.goto('http://127.0.0.1:8967/phonics-lab/#sounds');await page.locator('[data-sound="s"]').first().click();
 await page.evaluate(()=>{const Original=window.Audio;window.played=[];window.Audio=function(src){played.push(src);return new Original(src);};});
 await page.locator('[data-audio="sound:s"]').click();assert.equal(await page.evaluate(()=>played.at(-1)),audio['sound:s'].src);
 await page.locator('#teacher-open').click();await page.waitForFunction(()=>document.querySelector('#record-state').textContent.includes('標準の先生の録音があります'));
 await page.locator('#record-file').setInputFiles(path.join(root,'assets/audio/sound-s.wav'));await page.waitForFunction(()=>document.querySelector('#record-state').textContent.includes('先生の声を使っています'));
 await page.locator('#record-play').click();assert((await page.evaluate(()=>played.at(-1))).startsWith('blob:'));
 await page.locator('#record-standard').click();assert.equal(await page.evaluate(()=>played.at(-1)),audio['sound:s'].src);
 await page.locator('#record-reset').click();await page.waitForFunction(()=>document.querySelector('#record-state').textContent.includes('標準の先生の録音があります'));
 await page.locator('[data-close="teacher-dialog"]').click();
 await page.locator('#review-open').click();await page.locator('#review-group').selectOption('英語の音');assert.equal(await page.locator('.review-row').count(),30);assert.equal(await page.locator('.review-row [data-review-play="standard"]:disabled').count(),0);
 await page.screenshot({path:path.join(out,'review.png')});assert.deepEqual(errors,[]);console.log('PASS: all 30 teacher WAVs, lesson and reading playback, legacy-cutout fallback, custom override, reset and review.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
