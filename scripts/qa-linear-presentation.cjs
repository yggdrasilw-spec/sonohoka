const assert=require('node:assert/strict');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
 const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(require('node:path').resolve('ichiji_kansu_lab_v11.html')).href);
 const dir='C:/Users/user/.cache/linear-presentation-qa';fs.mkdirSync(dir,{recursive:true});
 async function capture(name){await page.locator('.introStage').evaluateAll(nodes=>Promise.all(nodes.flatMap(el=>el.getAnimations({subtree:true}).map(a=>a.finished))));await page.screenshot({path:dir+'/'+name+'.png'});}
 async function advance(){
  assert.equal(await page.locator('#lessonGraph,#wordGraph,.courseChoices,.lessonFields,.wordAnswers,.wordTableWrap').count(),0);
  while(await page.locator('#introNext').innerText()!=='考える画面へ →')await page.locator('#introNext').click();
  assert.equal(await page.locator('.introQuestion').count(),1);
  assert.equal(await page.locator('#lessonGraph,#wordGraph,.courseChoices,.lessonFields,.wordAnswers').count(),0);
  await page.locator('#introNext').click();
 }
 await page.locator('#startBtn').click();
 assert.match(await page.locator('.sceneDrawing').getAttribute('aria-label'),/ブロックが0個/);
 assert.ok(!(await page.locator('.presentation').innerText()).includes('y＝'));
 await capture('base');
 await page.locator('#introNext').click();assert.match(await page.locator('.sceneDrawing').getAttribute('aria-label'),/ブロックが1個/);
 await capture('one-block');
 await page.locator('#introBack').click();assert.match(await page.locator('.sceneDrawing').getAttribute('aria-label'),/ブロックが0個/);
 await advance();
 assert.match(await page.locator('#lessonPrompt').innerText(),/長さ3cmの土台[\s\S]*ブロックを1個増やす/);
 await page.screenshot({path:dir+'/solve.png'});
 await page.locator('[data-answer="1"]').click();assert.equal(await page.locator('#lessonNext').isEnabled(),true);
 await page.locator('#lessonNext').click();assert.match(await page.locator('.introText').innerText(),/1cm/);
 const lessons=await page.evaluate(()=>lessonPlan.map(l=>l.tasks.length));
 let total=0;
 for(let id=1;id<=19;id++)for(let task=0;task<lessons[id-1];task++){
  await page.evaluate(({id,task})=>{openSyllabus(id);lessonTask=task;initLessonTask();renderSyllabus();},{id,task});
  await advance();assert.equal(await page.locator('#lessonGraph').count(),1);
  assert.equal(await page.locator('#lessonLeft .courseText').filter({hasText:'3cmの土台'}).count(),0);
  await page.locator('#problemReplay').click();assert.equal(await page.locator('#lessonGraph').count(),0);await advance();
  const t=await page.evaluate(()=>currentTask());
  if(t.type==='choice')await page.locator(`[data-answer="${t.answer}"]`).click();
  if(t.type==='number'){for(const f of t.fields)await page.locator('#answer-'+f.key).fill(String(f.answer));await page.locator('#lessonCheck').click();}
  if(t.type==='plot'){
   for(const x of [0,t.dx]){await page.evaluate(x=>{const t=currentTask();lessonState.px=x;lessonState.py=t.a*x+t.b;renderSyllabus();},x);await page.locator('#lessonPlot').click();}
   await page.locator('#lessonLine').click();await page.locator('#lessonVerify').click();
   await page.locator('#lessonRedraw').click();assert.equal(await page.locator('#lessonPlot').count(),1);
   assert.equal(await page.locator('.presentation').count(),0);
  }else assert.equal(await page.locator('#lessonNext').isEnabled(),true);
  total++;
 }
 for(let i=0;i<20;i++){
  await page.evaluate(i=>openWordLab(i),i);await advance();
  const p=await page.evaluate(i=>linearWordProblems[i],i);
  assert.ok((await page.locator('#wordPrompt').innerText()).includes(p.story));
  if(p.fields){for(const f of p.fields)await page.locator('#wordAnswer-'+f.key).fill(String(f.answer));await page.locator('#wordCheck').click();}
  else await page.locator(`[data-word-answer="${p.answer}"]`).click();
  assert.equal(await page.locator('#wordNext').isEnabled(),true);
 }
 await page.evaluate(()=>openSyllabus(1));await page.setViewportSize({width:390,height:844});await page.evaluate(()=>fit());
 await capture('mobile-intro');
 const bounds=await page.locator('#introNext').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=390);
 await advance();await page.screenshot({path:dir+'/mobile-solve.png'});
 assert.deepEqual(errors,[]);console.log(`PASS: ${total} lesson tasks and 20 word problems; staged presentation, replay, answers, mobile and no runtime errors.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
