const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const examples={subtract:{a:7,b:2,op:'−',result:5,total:7},add:{a:4,b:3,op:'＋',result:7,total:7},multiply:{a:4,b:3,op:'×',result:12,total:12},divide:{a:8,b:2,op:'÷',result:4,total:8}};
const languageFixture=fs.readFileSync(path.join(__dirname,'qa-sansuu-roles.cjs'),'utf8');
const allowed=languageFixture.match(/const first='([^']+)'/)[1]+languageFixture.match(/const second='([^']+)'/)[1];
const ropeRig=JSON.parse(fs.readFileSync(path.join(__dirname,'../sansuu-kotoba/assets/gloves/animation-v2.json'),'utf8')).anchors.rope;
(async()=>{
 const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 const out=path.resolve(__dirname,'../.portfolio-work/sansuu-kotoba');fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1180,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/sonohoka/sansuu_kotoba.html`);await page.locator('#voice-toggle').click();
  let samples=0;
  assert.equal(await page.evaluate(()=>LessonAudio.reading('1つ分、2つに 分ける、3つ分')),'ひとつ分、ふたつに 分ける、みっつ分');
  for(const [scene,s] of Object.entries(examples)){
   await page.locator(`[data-scene="${scene}"]`).click();await page.locator('[data-mode="numbers"]').click();await page.locator('[data-number-view="blocks"]').click();await page.locator('#play').click();
   assert(await page.locator('#morph-equation').isHidden());assert(await page.locator('#block-stage').isVisible());
   const report=await page.evaluate(({scene,s,allowed,ropeRig})=>{
    const failures=[],kanji=new Set(allowed),frames=new Set();let previousImage=null,pullGap=null;
    for(let t=0;t<=20100;t+=50){
     LessonBlocks.render(scene,s,t);const svg=document.getElementById('block-stage'),units=[...svg.querySelectorAll('[data-block]')],marked=units.filter(u=>u.dataset.counted==='true'),expected=Math.max(0,Math.min(s.result,Math.floor((t-16600)*s.result/3000+1e-7)));
     if(svg.querySelectorAll('[data-glove]').length>1)failures.push(`t=${t}: multiple gloves`);
     const hand=svg.querySelector('[data-glove]'),image=hand?.querySelector('image');
     if(t>=6200&&t<16000&&image){
      if(previousImage&&image!==previousImage)failures.push(`t=${t}: hand image DOM replaced`);previousImage=image;
      if(hand.dataset.frame!=='')frames.add(+hand.dataset.frame);
      if(scene==='subtract'){
       const m=hand.transform.baseVal.consolidate().matrix,entry=new DOMPoint(ropeRig.ends[0].x,ropeRig.ends[0].y).matrixTransform(m),exit=new DOMPoint(ropeRig.ends[1].x,ropeRig.ends[1].y).matrixTransform(m),link=svg.querySelector('[data-rope-link]');
       if(Math.hypot(entry.x-Number(link.dataset.endX),entry.y-Number(link.dataset.endY))>1e-3)failures.push(`t=${t}: transformed rope endpoint detached`);
       const tangentY=m.b*ropeRig.tangent.x+m.d*ropeRig.tangent.y;
       if(Math.abs(tangentY)>1e-5)failures.push(`t=${t}: rope entry tangent not aligned`);
       if(t>=9728&&t<=15020){const x=svg.querySelector('[data-block="5"]').transform.baseVal.consolidate().matrix.e,gap=+hand.dataset.gripX-x;if(pullGap===null)pullGap=gap;else if(Math.abs(gap-pullGap)>1e-4)failures.push(`t=${t}: hand and blocks lagged`);}
      }
      if(scene==='add'&&t>=7964&&t<=14824){const moving=[...svg.querySelectorAll('[data-group="1"]')],edge=Math.max(...moving.map(u=>u.transform.baseVal.consolidate().matrix.e+50));if(Math.abs(+hand.dataset.contactX-edge)>.01)failures.push(`t=${t}: pushing hand not touching blocks`);if(+hand.dataset.contactY<400||+hand.dataset.contactY>450)failures.push(`t=${t}: contact point missed tile face`);}
     }
     if(scene==='divide'&&Number(svg.dataset.sourceCount)+Number(svg.dataset.heldCount)+Number(svg.dataset.placedCount)!==8)failures.push(`t=${t}: division inventory lost`);
     if(units.length!==s.total)failures.push(`t=${t}: total ${units.length}`);
     if(marked.length!==expected)failures.push(`t=${t}: count ${marked.length}/${expected}`);
     if(marked.some(u=>u.dataset.included!=='true'||Number(u.getAttribute('opacity'))<1))failures.push(`t=${t}: counted excluded/moving block`);
     const formula=svg.querySelector('.block-formula').textContent;
     if(t<20100&&!formula.endsWith('？'))failures.push(`t=${t}: answer appeared early`);
     if(t===20100&&!formula.endsWith(String(s.result)))failures.push('wrong final answer');
     const words=svg.textContent+LessonBlocks.caption(scene,s,t)+LessonBlocks.cue(scene,s,t);
     if([...(words.match(/[一-龥]/g)||[])].some(c=>!kanji.has(c)))failures.push(`t=${t}: kanji outside grades 1/2`);
    }
    const units=[...document.querySelectorAll('#block-stage [data-block]')];
    const result={failures,frames:[...frames].sort((a,b)=>a-b),groups:units.reduce((a,u)=>{a[u.dataset.group]=(a[u.dataset.group]||0)+1;return a;},{}),included:units.filter(u=>u.dataset.included==='true').length};
    function probe(t){LessonBlocks.render(scene,s,t);const svg=document.getElementById('block-stage');return {source:+svg.dataset.sourceCount,held:+svg.dataset.heldCount,placed:+svg.dataset.placedCount,pose:svg.querySelector('[data-glove]')?.dataset.pose,visible:[...svg.querySelectorAll('[data-block]')].filter(u=>+u.getAttribute('opacity')>=1).length,ids:[...svg.querySelectorAll('[data-location="hand"]')].map(u=>+u.dataset.block)};}
    if(scene==='divide')result.carry=[probe(8160),probe(10610),probe(13060),probe(16000)];
    if(scene==='multiply')result.grasp=[probe(10120),probe(13060)];
    if(scene==='add'){
      const positions=t=>{LessonBlocks.render(scene,s,t);return [...document.querySelectorAll('#block-stage [data-group="0"]')].map(u=>u.getAttribute('transform'));};
      if(JSON.stringify(positions(6200))!==JSON.stringify(positions(14000)))failures.push('original addend moved with pushing glove');
    }
    if(scene==='subtract'){
      LessonBlocks.render(scene,s,12000);const svg=document.getElementById('block-stage'),hand=svg.querySelector('[data-glove]'),rope=svg.querySelector('[data-rope-link]');
      if(Math.hypot(+hand.dataset.ropeEntryX-Number(rope.dataset.endX),+hand.dataset.ropeEntryY-Number(rope.dataset.endY))>.01)failures.push('rope detached from glove');
    }
    return result;
   },{scene,s,allowed,ropeRig});assert.deepEqual(report.failures,[]);assert.equal(report.included,s.result);samples+=403;
   if(scene==='multiply'||scene==='divide')assert.deepEqual(report.frames,[0,1,2,3,4,5,6,7]);
   if(scene==='multiply')assert.deepEqual(report.groups,{0:4,1:4,2:4});if(scene==='divide')assert.deepEqual(report.groups,{0:4,1:4});if(scene==='subtract')assert.deepEqual(report.groups,{0:5,1:2});
   if(scene==='divide'){
    assert.deepEqual(report.carry.map(x=>[x.source,x.held,x.placed]),[[4,4,0],[4,0,4],[0,4,4],[0,0,8]]);
    assert.deepEqual(report.carry[0].ids,[0,1,2,3]);assert.deepEqual(report.carry[2].ids,[4,5,6,7]);assert.equal(report.carry[0].pose,'grip');assert.equal(report.carry[2].pose,'grip');
   }
   if(scene==='multiply'){assert.equal(report.grasp[0].visible,0);assert.equal(report.grasp[0].held,4);assert.equal(report.grasp[0].pose,'grip');assert.equal(report.grasp[1].visible,12);assert.equal(report.grasp[1].pose,'open');}
   await page.locator('#restart').click();
   const total=await page.evaluate(({scene,s})=>LessonBlocks.steps(scene,s).length,{scene,s});
   for(let i=1;i<total;i++)await page.locator('#step').click();
   assert.equal(await page.locator('#block-stage').getAttribute('data-answer'),String(s.result));assert.match(await page.locator('#play').getAttribute('aria-label'),/もういちど/);
   await page.screenshot({path:path.join(out,`blocks-${scene}.png`)});
   await page.evaluate(({scene,s})=>{const t=scene==='divide'?8160:10120;LessonBlocks.render(scene,s,t);document.getElementById('caption').textContent=LessonBlocks.caption(scene,s,t);const steps=LessonBlocks.steps(scene,s);document.getElementById('frame-count').textContent=`${steps.filter(x=>x<=t).length} / ${steps.length} ステップ`;},{scene,s});
   await page.screenshot({path:path.join(out,`glove-${scene}.png`)});
   await page.locator('#play').click();await page.waitForTimeout(120);await page.locator('#play').click();const held=await page.locator('#block-stage').innerHTML();await page.waitForTimeout(120);assert.equal(await page.locator('#block-stage').innerHTML(),held,'pause freezes diagram');
   await page.locator('[data-number-view="digits"]').click();assert(await page.locator('#block-stage').isHidden());assert(await page.locator('#morph-equation').isVisible());await page.locator('#play').click();
  }
  await page.locator('[data-scene="divide"]').click();await page.locator('[data-number-view="blocks"]').click();await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.getElementById('block-stage').dataset.answer==='4');
  assert.equal(await page.locator('#block-stage').getAttribute('data-answer'),'4');assert.equal(await page.locator('#play').getAttribute('aria-pressed'),'false');
  for(const [width,height] of [[1366,768],[1366,600],[1024,600],[1180,620],[375,844],[390,844],[768,1024]]){
   await page.setViewportSize({width,height});
   const failures=await page.evaluate(()=>{
    const fail=[];if(document.documentElement.scrollWidth>innerWidth)fail.push('horizontal scroll');if(innerWidth>=900&&document.documentElement.scrollHeight>innerHeight)fail.push('landscape scroll');
    for(const el of document.querySelectorAll('button,select')){const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;if(r.left<0||r.right>innerWidth)fail.push(el.textContent+' clipped');if(innerWidth>=900){const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(!el.contains(top))fail.push(el.textContent+' obscured');}}
    return fail;
   });assert.deepEqual(failures,[],`${width}x${height}`);
  }
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'blocks-mobile.png'),fullPage:true});
  await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#restart').click();await page.locator('#play').click();
  await page.waitForFunction(()=>document.getElementById('block-stage').dataset.answer==='4',{},{timeout:27000});assert.equal(await page.locator('#play').getAttribute('aria-pressed'),'false','automatic playback stops on answer');
  await page.locator('[data-scene="push"]').click();assert(await page.locator('#block-stage').isHidden());assert(await page.locator('[data-mode="numbers"]').isDisabled());
  const voiced=await browser.newPage();
  await voiced.addInitScript(()=>{window.blockSpeech=null;Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],speak:u=>{window.blockSpeech=u;},cancel:()=>{window.blockSpeech=null;}}});window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};});
  await voiced.goto(`http://127.0.0.1:${server.address().port}/sonohoka/sansuu_kotoba.html`);
  await voiced.locator('[data-scene="subtract"]').click();await voiced.locator('[data-mode="numbers"]').click();await voiced.locator('[data-number-view="blocks"]').click();await voiced.locator('#play').click();
  for(let i=0;i<100;i++){await voiced.locator('#step').click();if(await voiced.locator('#block-stage').getAttribute('data-count')==='1')break;}
  assert.equal(await voiced.evaluate(()=>blockSpeech.text),'いち');
  await voiced.locator('#play').click();await voiced.waitForFunction(()=>document.getElementById('block-stage').dataset.count==='2',{},{timeout:4000});
  assert.equal(await voiced.evaluate(()=>blockSpeech.text),'に');await voiced.waitForTimeout(800);assert.equal(await voiced.locator('#block-stage').getAttribute('data-count'),'2','count waits for voice');
  await voiced.locator('#audio-stop').click();assert.equal(await voiced.evaluate(()=>LessonAudio.speaking),false);assert.equal(await voiced.locator('#play').getAttribute('aria-pressed'),'false');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({samples,operations:4,conservation:'add/subtract/divide',multiplication:'4 blocks per group, 3 groups',division:'8 shared into 2 groups of 4',pause:'verified',viewports:7,errors}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
