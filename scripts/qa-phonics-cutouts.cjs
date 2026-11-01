'use strict';
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../qa-output/phonics-cutouts');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8967/phonics-lab/audio-candidates.html');
 assert.equal(await page.locator('.candidate').count(),32);
 const s=page.locator('[data-id="s"]');await s.locator('summary').click();
 await s.locator('[data-play]').waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('[data-id="s"] [data-play]').disabled);
 await s.locator('[data-play]').click();
 await s.locator('[data-end]').focus();for(let i=0;i<15;i++)await page.keyboard.press('ArrowLeft');
 assert.match(await s.locator('[data-status]').textContent(),/135ミリ秒/);
 const downloaded=page.waitForEvent('download');await s.locator('[data-save]').click();const download=await downloaded;await download.saveAs(path.join(out,'adjusted-s.wav'));
 const wav=fs.readFileSync(path.join(out,'adjusted-s.wav'));assert.equal(wav.toString('ascii',0,4),'RIFF');assert(Math.abs(wav.readUInt32LE(40)/wav.readUInt32LE(28)-.415)<.002);
 await s.locator('[data-reset]').click();assert.equal(await s.locator('[data-end]').inputValue(),'0.245');
 await s.locator('[data-verdict]').selectOption('use');
 await s.locator('[data-adopt]').click();await page.waitForFunction(()=>document.querySelector('#message').textContent.includes('切り出し音を保存しました'));
 await page.reload();assert.equal(await s.locator('[data-verdict]').inputValue(),'use');await page.waitForFunction(()=>document.querySelector('[data-id="s"] [data-adopt]').textContent.includes('置き換えて'));
 await page.goto('http://127.0.0.1:8967/phonics-lab/index.html#sounds');
 await page.locator('#teacher-open').click();assert.equal(await page.locator('#record-target').inputValue(),'sound:s');
 await page.waitForFunction(()=>document.querySelector('#record-state').textContent.includes('切り出した音を使っています'));
 await page.evaluate(()=>{const Original=window.Audio;window.sources=[];window.Audio=function(src){sources.push(src);return new Original(src);};});
 await page.locator('#record-play').click();assert((await page.evaluate(()=>sources.at(-1))).startsWith('blob:'));
 const backupEvent=page.waitForEvent('download');await page.locator('#backup-export').click();const backup=await backupEvent;const backupPath=path.join(out,'cutout-backup.json');await backup.saveAs(backupPath);
 assert.equal(JSON.parse(fs.readFileSync(backupPath,'utf8')).entries.find(e=>e.key==='sound:s').source,'cutout');
 await page.locator('#record-reset').click();await page.waitForFunction(()=>document.querySelector('#record-state').textContent.includes('単音は先生の録音待ち'));
 await page.locator('#backup-import').setInputFiles(backupPath);await page.waitForFunction(()=>document.querySelector('#record-state').textContent.includes('切り出した音を使っています'));
 await page.goto('http://127.0.0.1:8967/phonics-lab/audio-candidates.html');
 const decoded=await page.evaluate(async()=>{const context=new AudioContext(),rows=[];for(const e of PHONICS_CUTS.entries){const r=await fetch('assets/audio-candidates/'+e.file);if(!r.ok)throw Error(e.id+' HTTP '+r.status);const b=await context.decodeAudioData(await r.arrayBuffer());let peak=0;for(const v of b.getChannelData(0))peak=Math.max(peak,Math.abs(v));rows.push({id:e.id,peak,duration:b.duration,expected:e.end-e.start+.28});}await context.close();return rows;});
 assert.equal(decoded.length,32);for(const row of decoded){assert(row.peak>.001,row.id+' silent');assert(Math.abs(row.duration-row.expected)<.002,row.id+' wrong duration');}
 await page.locator('[data-id="ae"] summary').click();await page.waitForFunction(()=>!document.querySelector('[data-id="ae"] [data-play]').disabled);
 await page.screenshot({path:path.join(out,'desktop.png')});await page.setViewportSize({width:390,height:844});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(out,'mobile.png')});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:true,decoded},null,2));console.log('PASS: 32 cutouts, waveform adjustment, WAV download, review persistence, explicit adoption, lesson playback, reset, mobile layout.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
