const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(req.url.split('?')[0]),file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{
   const bus=new EventTarget();window.speechCalls=[];window.cancelCalls=0;window.voiceReads=0;window.testVoices=[];
   Object.defineProperty(window,'speechSynthesis',{value:{getVoices(){voiceReads++;return testVoices;},addEventListener:bus.addEventListener.bind(bus),cancel(){cancelCalls++;},speak(u){speechCalls.push(u);}}});
   window.SpeechSynthesisUtterance=function(text){this.text=text;};window.voicesReady=()=>bus.dispatchEvent(new Event('voiceschanged'));
   localStorage.setItem('my-town-v1',JSON.stringify({version:1,title:'Speech QA',plots:Array(16).fill('house'),start:0,goal:15}));
  });
  await p.goto(`http://127.0.0.1:${server.address().port}/my-town/`);
  assert(await p.evaluate(()=>voiceReads>0),'voice list is requested before first playback');
  await p.evaluate(()=>{testVoices=[{lang:'en-US',localService:false,name:'Remote'},{lang:'en-GB',localService:true,name:'UK'},{lang:'en-US',localService:true,name:'Local'}];voicesReady();});
  assert.equal(await p.locator('#sound').getAttribute('aria-pressed'),'true','speech is on by default');
  await p.locator('#route-tab').click();await p.locator('#speed').selectOption('0');await p.locator('#next').click();
  assert.equal(await p.evaluate(()=>speechCalls[0].voice.name),'Local');assert.equal(await p.evaluate(()=>speechCalls[0].text),'Start at the house.');
  assert.equal(await p.evaluate(()=>cancelCalls),0,'idle synthesis is not cancelled before first speech');
  // Delayed start remains on the intro; no instruction or animation is skipped.
  await p.waitForTimeout(900);assert.match(await p.locator('#speech-note').innerText(),/準備/);assert.equal(await p.evaluate(()=>MyTown.snapshot().index),0);
  await p.evaluate(()=>speechCalls[0].onstart());assert.match(await p.locator('#speech-note').innerText(),/端末内/);
  await p.locator('#stop').click();await p.evaluate(()=>{speechCalls[0].onerror();speechCalls[0].onend();speechCalls[0].onstart();});
  assert.equal(await p.evaluate(()=>MyTown.snapshot().index),0);assert.equal(await p.evaluate(()=>MyTown.snapshot().busy),false);assert.doesNotMatch(await p.locator('#speech-note').innerText(),/再生できません/);
  // Voice installation changes are picked up; an engine with no callbacks times out.
  await p.evaluate(()=>{testVoices=[{lang:'en-US',localService:false,name:'Remote only'}];voicesReady();});await p.locator('#next').click();
  assert.equal(await p.evaluate(()=>speechCalls.at(-1).voice.name),'Remote only');await p.waitForFunction(()=>!MyTown.snapshot().busy,null,{timeout:6000});assert.match(await p.locator('#speech-note').innerText(),/待たず/);
  // Half-block badges stay on the path and all complete at the end of that move.
  await p.locator('#sound').click();await p.locator('#next').click();await p.waitForFunction(()=>!MyTown.snapshot().busy);
  const badges=await p.locator('.block-marker').evaluateAll(ms=>ms.map(m=>({distance:Number(m.dataset.block),done:m.classList.contains('done'),position:m.getAttribute('transform')})));
  assert(badges.length>0);assert(badges.some(m=>m.distance%1===.5));assert(badges.every(m=>m.done&&!m.position.includes('NaN')));
  const out=path.join(root,'.portfolio-work/my-town');fs.mkdirSync(out,{recursive:true});await p.locator('#open-map').click();await p.screenshot({path:path.join(out,'distance-half-block.png'),fullPage:true});
  assert.equal(await p.locator('#map-sound').getAttribute('aria-pressed'),'false');
  await p.locator('#map-sound').focus();await p.keyboard.press('Space');
  assert.equal(await p.locator('#sound').getAttribute('aria-pressed'),'true');
  await p.keyboard.press('Escape');await p.locator('#sound').waitFor();
  for(const width of [320,390,768,1366]){
    await p.setViewportSize({width,height:844});await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));
    const box=await p.locator('#sound').boundingBox();assert(box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=844,'floating sound button stays in view');
    await p.locator('#open-map').click();await p.locator('#map-sound').click();await p.locator('#map-sound').click();await p.keyboard.press('Escape');
  }
  await p.setViewportSize({width:390,height:844});await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:path.join(out,'sound-toggle-mobile.png'),fullPage:false});
  await p.reload();assert.equal(await p.locator('#sound').getAttribute('aria-pressed'),'true');
  const unsupported=await browser.newPage();await unsupported.addInitScript(()=>Object.defineProperty(window,'speechSynthesis',{value:undefined}));await unsupported.goto(`http://127.0.0.1:${server.address().port}/my-town/`);
  assert(await unsupported.locator('#sound').isDisabled());assert.equal(await unsupported.locator('#sound').getAttribute('aria-pressed'),'false');assert(await unsupported.locator('#map-sound').isDisabled());await unsupported.close();
  assert.deepEqual(errors,[]);console.log('PASS: default ON, synchronized keyboard toggles, floating control at 4 widths, unsupported speech, early voices, cancellation, timeout and distance badges');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
