const assert=require('node:assert/strict');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
let qaBrowser;
(async()=>{
 const browser=qaBrowser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(require('node:path').resolve('ichiji_kansu_lab_v11.html')).href);
 await require('./linear-solve-test-helper.cjs')(page);
 await page.locator('#chooseCourse').click();await page.locator('#syllabusWords').click();
 assert.equal(await page.locator('[data-word]').count(),20);
 const expected=[[410],[600],[10],[40],[4],[500],[300],[60],[5],[1.5],[16],[6],[16],[1500],[12],[24],[2,5],[250,500],[],[0,4]];
 for(let i=0;i<20;i++){
  await page.evaluate(index=>openWordLab(index),i);
  assert.equal(await page.locator('#wordNext').isEnabled(),false);
  const task=await page.evaluate(index=>linearWordProblems[index],i);
  if(task.fields){
   assert.deepEqual(task.fields.map(f=>f.answer),expected[i]);
   await page.locator('#wordCheck').click();assert.equal(await page.locator('#wordNext').isEnabled(),false);
   for(const f of task.fields)await page.locator(`#wordAnswer-${f.key}`).fill('99999');
   await page.locator('#wordCheck').click();assert.equal(await page.locator('#wordNext').isEnabled(),false);
   for(let k=0;k<task.fields.length;k++)await page.locator(`#wordAnswer-${task.fields[k].key}`).fill(i===9?'3/2':String(expected[i][k]));
   await page.locator('#wordCheck').click();
  }else{
   await page.locator('[data-word-answer="1"]').click();assert.equal(await page.locator('#wordNext').isEnabled(),false);
   await page.locator('[data-word-answer="0"]').click();
  }
  assert.equal(await page.locator('#wordNext').isEnabled(),true);
  if([0,1,8,18].includes(i)){
   assert.equal(await page.locator('.wordStoryAsset img').count(),1);
   await page.locator('.wordStoryAsset img').evaluate(img=>img.decode());
   assert.equal(await page.locator('#wordQuantity').count(),1);
  }else assert.equal(await page.locator('.wordStoryAsset img').count(),0);
  const xs=await page.locator('.wordTable [data-word-x]').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.wordX)));
  const x=xs.at(-1);await page.locator(`.wordTable [data-word-x="${x}"]`).click();
  assert.match(await page.locator('#wordGraph').getAttribute('aria-label'),new RegExp(`選んだ点は\\(${x},`));
  assert.equal(await page.locator('.wordTable [aria-pressed="true"]').innerText(),String(x).replace('-','−'));
  const invalidNumbers=await page.locator('#wordGraph').evaluate(el=>/NaN|Infinity/.test(el.outerHTML));assert.equal(invalidNumbers,false);
 }
 assert.equal(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('linear-lab-words-v1'))).length),20);
 await page.locator('#wordNext').click();assert.equal(await page.locator('[data-word]').count(),20);
 await page.evaluate(()=>openWordLab(0));
 await page.locator('#wordX').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
 assert.equal(await page.evaluate(()=>wordState.x),2);
 assert.match(await page.locator('#wordLink').innerText(),/y＝290円/);
 assert.equal(await page.locator('#wordX').evaluate(el=>el===document.activeElement),true);
 await page.locator('#wordPlus').click();assert.equal(await page.evaluate(()=>wordState.x),3);
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(async()=>{fit();await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);document.getElementById('viewport').scrollTo(9999,0);});
 const mobilePlus=await page.locator('#wordPlus').boundingBox();
 assert.ok(mobilePlus.x>=0&&mobilePlus.x+mobilePlus.width<=390,JSON.stringify(mobilePlus));
 await page.mouse.click(mobilePlus.x+mobilePlus.width/2,mobilePlus.y+mobilePlus.height/2);assert.equal(await page.evaluate(()=>wordState.x),4);
 await page.setViewportSize({width:1600,height:900});await page.evaluate(()=>fit());
 await page.evaluate(()=>openSyllabus(1));await page.locator('#linked-x-2').click();
 assert.match(await page.locator('.sceneDrawing').getAttribute('aria-label'),/ブロックが2個。全体は7cm/);
 assert.match(await page.locator('#lessonLink').innerText(),/点 \(2, 7\)/);
 assert.equal(await page.locator('.linkedColumn').count(),2);
 await page.evaluate(()=>openSyllabus(17));await page.locator('#linked-x-3').click();
 assert.match(await page.locator('#lessonLink').innerText(),/7L/);assert.equal(await page.locator('.linkedColumn').count(),3);
 await page.evaluate(()=>openSyllabus(15));await page.locator('#linked-x-1').click();
 assert.match(await page.locator('#lessonLink').innerText(),/測定 5.1℃/);
 assert.equal(await page.locator('#lessonLink').innerText().then(s=>s.includes('式で予測')),false);
 await page.locator('[data-answer="0"]').click();
 assert.match(await page.locator('#lessonLink').innerText(),/約5℃/);
 const out='C:/Users/user/.cache/linear-word-lab-qa';fs.mkdirSync(out,{recursive:true});
 for(const [index,name] of [[0,'fee'],[1,'rental'],[8,'chase'],[16,'derive'],[18,'discrete'],[19,'capacity']]){
  await page.evaluate(i=>openWordLab(i),index);
  if(index===8)await page.locator('.wordTable [data-word-x="5"]').click();
  await page.locator('.wordStoryAsset img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  await page.screenshot({path:`${out}/${name}.png`});
  const box=await page.locator('#wordNext').boundingBox();assert.ok(box.y+box.height<=900,`${name}: next button clipped`);
 }
 await page.evaluate(()=>openSyllabus(1));await page.screenshot({path:`${out}/linked-blocks.png`});
 await page.evaluate(()=>openSyllabus(17));await page.screenshot({path:`${out}/linked-tanks.png`});
 await page.evaluate(()=>openSyllabus(15));await page.screenshot({path:`${out}/linked-measurements.png`});
 assert.deepEqual(errors,[]);console.log('PASS: 20 problems, independent expected answers, wrong/empty answers, progress, linked table/diagram/formula/graph, measured vs predicted values, and desktop bounds.');
 await browser.close();
})().catch(async e=>{console.error(e);await qaBrowser?.close();process.exitCode=1;});
