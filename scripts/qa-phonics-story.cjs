'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto'),vm=require('node:vm');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(__dirname,'../phonics-lab'),out=path.resolve(__dirname,'../qa-output/phonics-story');fs.mkdirSync(out,{recursive:true});
const origin=process.env.PHONICS_ORIGIN||'http://127.0.0.1:8968',url=origin+'/phonics-lab/english.html#advanced';
const data=JSON.parse(fs.readFileSync(path.join(app,'advanced-data.json'))),manifest=JSON.parse(fs.readFileSync(path.join(app,'assets/story/image-manifest.json')));
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(app,'story-data.js'),'utf8'),ctx);const stories=ctx.window.PHONICS_STORIES;
assert.equal(stories.length,9);assert.equal(new Set(stories.map(s=>s.id)).size,9);assert.equal(Object.keys(manifest.images).length,17);
for(const s of stories){assert(data.lessons.some(l=>l.id===s.id));assert(s.frames.length>=3);for(const f of s.frames){assert(f.caption&&f.words.length);for(const id of f.words)assert(data.words[id]&&manifest.images[id]);}}
for(const image of Object.values(manifest.images)){assert(image.kind.startsWith('existing-'));assert.equal(createHash('sha256').update(fs.readFileSync(path.join(app,image.src))).digest('hex'),image.sha256);}
function fastMode(){
 const timer=window.setTimeout.bind(window);window.storyPlays=[];window.storyFail=false;
 window.setTimeout=(fn,ms,...args)=>timer(fn,(ms>=1400&&ms<=12000)||ms===850?20:ms,...args);
 class FakeAudio{constructor(src){this.src=src||'';this.timer=null;}pause(){clearTimeout(this.timer);}play(){window.storyPlays.push(this.src);if(window.storyFail){window.storyFail=false;return Promise.reject(Error('intentional playback failure'));}this.timer=timer(()=>this.onended?.(),15);return Promise.resolve();}}
 window.Audio=FakeAudio;
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url.split('#')[0]);await page.locator('#phonics-story').waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('.story-player img')].every(i=>i.complete&&i.naturalWidth));
  const decoded=await page.evaluate(async()=>Promise.all(Object.values(PHONICS_STORY_IMAGES.images).map(async entry=>{const img=new Image();img.src=entry.src;await img.decode();return img.naturalWidth;})));assert.equal(decoded.length,17);assert(decoded.every(w=>w>10));
  assert.equal(await page.locator('.story-player button:visible').count(),1);assert.equal(await page.locator('.lesson-nav:visible').count(),0);assert.equal(await page.locator('.story-player img').getAttribute('src'),manifest.images.cut.src);
  await page.waitForTimeout(900);await page.screenshot({path:path.join(out,'desktop.png'),fullPage:true});
  await page.locator('[data-story-action="play"]').click();await page.locator('[data-story-frame="0:1"]').waitFor({timeout:20000});assert.equal(await page.locator('.story-player img').getAttribute('src'),manifest.images.cute.src);
  await page.locator('[data-story-action="play"]').click();assert((await page.locator('.story-paused').innerText()).includes('止めています'));const scene=await page.locator('[data-story-frame]').getAttribute('data-story-frame');
  await page.waitForTimeout(7000);assert.equal(await page.locator('[data-story-frame]').getAttribute('data-story-frame'),scene);
  for(const [width,height] of [[320,740],[768,900],[1280,720]]){await page.setViewportSize({width,height});await page.screenshot({path:path.join(out,`paused-${width}.png`),fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await page.locator('.story-controls button:visible').count(),3);assert(await page.locator('.story-controls').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight),'playback controls should fit the viewport');}
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.arriving-e').evaluate(e=>getComputedStyle(e).animationName),'none');
  await page.locator('.story-player img').evaluate(img=>img.src='assets/story/intentionally-missing.png');await page.locator('.story-fallback.sprite:not([hidden])').waitFor();assert.equal(await page.locator('.story-fallback.sprite').getAttribute('aria-label'),data.words.cute.ja);
  await page.locator('.story-options > summary').click();await page.locator('[data-story-practice]').click();await page.locator('[data-explore="oo"]').click();assert(await page.locator('[data-explore-start="listen"]').isDisabled());
  await page.locator('[data-story-return]').click();await page.locator('.story-paused').waitFor();
  assert.deepEqual(errors,[]);
  // Accelerate waits and substitute audio only in this second browser context.
  // The first context above used real audio at the normal caption pace.
  const fast=await browser.newPage({viewport:{width:1280,height:900}}),fastErrors=[];fast.on('pageerror',e=>fastErrors.push(e.message));await fast.addInitScript(fastMode);await fast.goto(url);await fast.locator('#phonics-story').waitFor();
  await fast.evaluate(async()=>{await Promise.all(Object.values(PHONICS_STORY_IMAGES.images).map(i=>{const p=new Image();p.src=i.src;return p.decode().catch(()=>{});}));});
  await fast.locator('[data-story-action="play"]').click();await fast.locator('.story-end').waitFor({timeout:30000});
  const saved=await fast.evaluate(()=>JSON.parse(localStorage.getItem('english-phonics-viewing-v1')));assert.equal(Object.keys(saved.seen).length,9);assert.equal(await fast.evaluate(()=>localStorage.getItem('english-phonics-progress-v1')),null);
  const played=await fast.evaluate(()=>storyPlays);assert(played.length>=stories.reduce((n,s)=>n+s.frames.reduce((n,f)=>n+f.words.length,0),0));assert(played[0].includes('cut-word'));assert(played[1].includes('cute-word'));
  // Playback failure stops the timeline, and replay clears the error.
  await fast.reload();await fast.locator('#phonics-story').waitFor();await fast.evaluate(()=>{window.storyFail=true;});await fast.locator('[data-story-action="play"]').click();await fast.locator('.story-notice:visible').waitFor();assert(await fast.locator('.story-paused').isVisible());const failedFrame=await fast.locator('[data-story-frame]').getAttribute('data-story-frame');await fast.waitForTimeout(300);assert.equal(await fast.locator('[data-story-frame]').getAttribute('data-story-frame'),failedFrame);
  await fast.locator('[data-story-action="play"]').click();await fast.locator('.story-end').waitFor({timeout:15000});assert.deepEqual(fastErrors,[]);
  // Navigating away aborts timers/audio. Viewing never unlocks the assessed audio gate.
  await fast.locator('[data-story-action="restart"]').click();await fast.locator('.story-options > summary').click();await fast.locator('[data-story-practice]').click();const stopped=await fast.evaluate(()=>storyPlays.length);await fast.waitForTimeout(400);assert.equal(await fast.evaluate(()=>storyPlays.length),stopped);await fast.locator('[data-explore="oo"]').click();assert(await fast.locator('[data-explore-start="listen"]').isDisabled());
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({stories:9,frames:stories.reduce((n,s)=>n+s.frames.length,0),existingImages:17,realAudio:'cut then cute; normal timing',automated:'all scenes and all nine endings',pause:'stable for 7 seconds',reducedMotion:true,errors:[...errors,...fastErrors]},null,2));
  console.log('PASS: 17 original image hashes; 9 story schemas; real cut/cute playback + natural pacing; pause; 320/768/1280 layouts; reduced motion; all stories auto-finish; separate viewing records; audio failure/retry; navigation abort; assessment gate preserved.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
