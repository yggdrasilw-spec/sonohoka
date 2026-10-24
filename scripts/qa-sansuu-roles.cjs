const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
// MEXT: https://www.mext.go.jp/content/1413522_001.pdf (学年別漢字配当表).
const first='一右雨円王音下火花貝学気九休玉金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大男竹中虫町天田土二日入年白八百文木本名目立力林六';
const second='引羽雲園遠何科夏家歌画回会海絵外角楽活間丸岩顔汽記帰弓牛魚京強教近兄形計元言原戸古午後語工公広交光考行高黄合谷国黒今才細作算止市矢姉思紙寺自時室社弱首秋週春書少場色食心新親図数西声星晴切雪船線前組走多太体台地池知茶昼長鳥朝直通弟店点電刀冬当東答頭同道読内南肉馬売買麦半番父風分聞米歩母方北毎妹万明鳴毛門夜野友用曜来里理話';
assert.equal(first.length,80);assert.equal(second.length,160);
const allowed=new Set(first+second);
(async()=>{
 const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 const out=path.resolve(__dirname,'../.portfolio-work/sansuu-kotoba');fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1180,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.roleProbe={pending:null,spoken:[]};
   Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],speak:u=>{roleProbe.pending=u;roleProbe.spoken.push(u.text);},cancel:()=>{roleProbe.pending=null;}}});
   window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/sonohoka/sansuu_kotoba.html`);
  const finish=()=>page.evaluate(()=>{const u=roleProbe.pending;roleProbe.pending=null;u?.onend?.();});
  async function kanji(){
   const text=await page.evaluate(()=>{const copy=document.querySelector('main').cloneNode(true);copy.querySelector('.teacher-note')?.remove();return document.title+copy.textContent+[...copy.querySelectorAll('[aria-label]')].map(e=>e.getAttribute('aria-label')).join('');});
   const extra=[...new Set(text.match(/[一-龥]/g)||[])].filter(c=>!allowed.has(c));assert.deepEqual(extra,[],'child-facing text uses only grade 1/2 kanji');
  }
  for(const [scene,left,right] of [['push','おされる人','おす人'],['multiply','かけられる人','かける人'],['subtract','引かれる人','引く人'],['divide','わられる人','わる人'],['add','たされる人','たす人']]){
   await page.locator(`[data-scene="${scene}"]`).click();await page.locator('#read-aloud').click();
   assert(await page.locator('#character-left-focus').isHidden());
   await finish();assert(await page.locator('#character-left-focus').isVisible());assert(await page.locator('#character-right-focus').isHidden());
   assert.equal(await page.locator('#character-left-word').innerText(),left);
   if(scene==='push')await page.screenshot({path:path.join(out,'role-left.png')});
   await finish();assert(await page.locator('#character-right-focus').isVisible());assert(await page.locator('#character-left-focus').isHidden());
   assert.equal(await page.locator('#character-right-word').innerText(),right);
   if(scene==='push')await page.screenshot({path:path.join(out,'role-right.png')});
   for(const width of [375,768,1180]){
    await page.setViewportSize({width,height:720});
    const fits=await page.evaluate(()=>{const stage=document.getElementById('stage').getBoundingClientRect(),box=document.getElementById('character-right-focus').getBoundingClientRect(),tag=document.getElementById('character-right-word').getBoundingClientRect();return box.left>stage.left&&box.right<stage.right&&box.top>stage.top&&box.bottom<stage.bottom&&tag.top>stage.top&&tag.right<stage.right;});assert(fits,'focus and tag stay inside character picture');
   }
   await finish();assert(await page.locator('#character-right-focus').isHidden());await kanji();
  }
  // A late native callback must not resurrect a cancelled sequence.
  await page.locator('#read-aloud').click();await finish();await page.evaluate(()=>{window.staleRole=roleProbe.pending;});
  await page.locator('#audio-stop').click();await page.evaluate(()=>staleRole.onend?.());await page.waitForTimeout(80);
  assert.equal(await page.locator('.role-speaking').count(),0);assert(await page.locator('#character-left-focus').isHidden());assert(await page.locator('#character-right-focus').isHidden());
  await page.locator('#voice-toggle').click();
  for(const scene of ['push','subtract','multiply','divide','add']){
   await page.locator(`[data-scene="${scene}"]`).click();
   await page.locator('[data-mode="quiz"]').click();await page.locator('#hint').click();await kanji();
   await page.locator('[data-answer="left"]').click();await kanji();
   if(scene!=='push'){await page.locator('[data-mode="numbers"]').click();await page.locator('#play').click();for(let i=0;i<8;i++)await page.locator('#step').click();await kanji();}
   await page.locator('[data-mode="people"]').click();
  }
  await page.locator('[data-mode="apply"]').click();await page.locator('#practice-topic').selectOption('all');
  for(let i=0;i<36;i++){await page.locator('#practice-hint').click();await kanji();await page.locator('#practice-next').click();}
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-mode="people"]').click();await page.locator('#read-aloud').click();await finish();
  assert(await page.locator('#character-left-focus').isVisible());assert.equal(await page.locator('#character-left-focus').evaluate(e=>getComputedStyle(e).animationName),'none');
  await page.locator('[data-scene="push"]').click();assert(await page.locator('#character-left-focus').isHidden());
  assert.deepEqual(errors,[]);console.log('PASS: five scenes, one character at a time, matching role labels, cancellation including stale callback, 3 widths, reduced motion, grade 1/2 kanji across all modes and 36 problems');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
