const fs=require('fs/promises'),path=require('path'),assert=require('assert');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=require('http').createServer(async(req,res)=>{try{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]));const b=await fs.readFile(f);res.setHeader('Content-Type',f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.png')?'image/png':'application/octet-stream');res.end(b)}catch{res.statusCode=404;res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url())});
 const go=file=>page.goto('http://127.0.0.1:'+server.address().port+'/'+file);
 await go('chouhoukei_seihoukei_fukushu_v4.html');await page.locator('[data-mode="teacher"]').click();
 for(let i=0;i<5;i++){await page.locator('#revealBtn').click();await page.locator('#nextBtn').click()}
 assert(await page.locator('#revealBtn').isDisabled());assert.equal(await page.locator('.tourActive').count(),1);
 await page.waitForTimeout(5800);assert.equal(await page.locator('.tourActive').count(),7);assert(await page.locator('#revealBtn').isEnabled());
 await page.screenshot({path:root+'/.record_73-76/fixed-side-tour.png'});
 await page.locator('#revealBtn').click();assert.equal(await page.locator('.tourActive').count(),7);assert(await page.locator('.tourActive').first().evaluate(el=>getComputedStyle(el).opacity==='1'));await page.locator('#nextBtn').click();assert(await page.locator('#revealBtn').isDisabled());
 await page.waitForTimeout(5800);
 await page.locator('#revealBtn').click();assert.equal(await page.locator('.tourActive').count(),7);await page.locator('#nextBtn').click();
 // Inspect the selection board and the rotated right-angle marker in the actual lesson.
 for(let i=0;i<20&&!await page.locator('.selectionBoard').count();i++){await page.locator('#revealBtn').click();await page.locator('#nextBtn').click()}
 await page.locator('#revealBtn').click();await page.locator('#nextBtn').click();await page.locator('#revealBtn').click();await page.screenshot({path:root+'/.record_73-76/fixed-shape-grid.png'});
 assert(!await page.locator('body').innerText().then(t=>t.includes('定義')));
 const grid=await page.locator('.candidateMain').evaluateAll(es=>es.map(el=>el.tagName==='rect'?[el.x.baseVal.value,el.y.baseVal.value,el.width.baseVal.value,el.height.baseVal.value]:[...el.points].flatMap(p=>[p.x,p.y])));
 assert(grid.flat().every(n=>n%20===0));
 await go('setsuzoku_v3_28images_package/index.html');
 const addition=await page.evaluate(()=>{const it=ITEMS.find(i=>i.rel==='add');const p={item:it,rel:'add'};return {h:[1,2,3].map(n=>hintText(p,n)),r:reasoningHTML(p)}});
 assert(!JSON.stringify(addition).includes('ふつうなら'));assert(!addition.r.includes('でも、'));
 await page.evaluate(()=>{const it=ITEMS.find(i=>i.rel==='add');document.getElementById('app').innerHTML=reasoningHTML({item:it,rel:'add'})});
 await page.screenshot({path:root+'/.record_73-76/fixed-addition.png'});
 await page.evaluate(()=>{PREF.voice=false;start('join')});
 await page.evaluate(()=>{S.probs[S.i].opts.forEach((o,k)=>{if(o.ok)document.querySelector('.opt[data-k="'+k+'"]').click()});check()});
 await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));assert(await page.evaluate(()=>window.scrollY>0));
 await page.locator('#go').click();await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.scrollY),0);
 await go('ryokan_units_package/index.html');
 await page.evaluate(()=>Promise.all(Object.values(SOURCE_SHEETS).map(([name])=>{const i=new Image();i.src='img/source_sheets/'+name;return i.decode()})));
 await page.evaluate(()=>Promise.all(Object.values(NEW_SHEETS).map(sh=>{const i=new Image();i.src=sh.path;return i.decode()})));
 assert.equal(await page.evaluate(()=>Q.length),66);
 assert.equal(await page.getByRole('button',{name:'時間（2年）',exact:true}).count(),1);
 assert.equal(await page.getByRole('button',{name:'面積（4年）',exact:true}).count(),1);
 await page.getByRole('button',{name:'時間（2年）',exact:true}).click();assert.equal(await page.locator('.u').count(),2);
 assert.equal(await page.evaluate(()=>audioContext.state),'running');
 await page.locator('#soundToggle').click();assert.equal(await page.locator('#soundToggle').getAttribute('aria-pressed'),'false');
 const tones=await page.evaluate(()=>{window.tones=0;const create=audioContext.createOscillator.bind(audioContext);audioContext.createOscillator=()=>{window.tones++;return create()};se('ok');return window.tones});assert.equal(tones,0);
 await page.reload();assert.equal(await page.locator('#soundToggle').getAttribute('aria-pressed'),'false');await page.locator('#soundToggle').click();assert.equal(await page.locator('#soundToggle').getAttribute('aria-pressed'),'true');
 await page.evaluate(()=>{S={list:Q,i:0,ok:0,miss:[]};show()});
 assert.equal(await page.evaluate(()=>Q.filter(q=>(!q.illustration&&!CARD_VIEWPORTS[q.key])||(!UNIT_VIEWPORTS[q.unit]&&!UNIT_NOTES[q.unit])).length),0);
 assert(!await page.evaluate(()=>Q.find(q=>q.key==='run10').label.includes('km')));
 for(const key of ['brush','elephant','stamp_area','village_area','run10']){
  await page.evaluate(key=>{S={list:[Q.find(q=>q.key===key)],i:0,ok:0,miss:[]};show()},key);
  await page.evaluate(()=>pick(S.q.unit,[...document.querySelectorAll('.u')].find(b=>b.textContent===S.q.unit)));await page.locator('#fb button').first().click();
  await page.evaluate(()=>Promise.all([...document.querySelectorAll('svg image')].map(el=>{const i=new Image();i.src=el.getAttribute('href');return i.decode()})));
  assert(await page.locator('.quantity-answer').innerText().then(t=>t.includes(String(key==='elephant'?5:key==='run10'?10:key==='village_area'?30:key==='stamp_area'?6:3))));
  await page.screenshot({path:root+'/.record_73-76/new-unit-'+key+'.png'});
 }
 await page.evaluate(()=>{S={list:Q,i:0,ok:0,miss:[]};show()});
 await page.screenshot({path:root+'/.record_73-76/fixed-unit-pencil.png'});
 await page.evaluate(()=>explain());await page.waitForTimeout(400);await page.screenshot({path:root+'/.record_73-76/fixed-unit-explain.png'});
 // Render all question cards for visual inspection of all 51 source viewports.
 await page.evaluate(()=>{document.getElementById('app').style.maxWidth='1200px';document.getElementById('app').innerHTML='<div style="display:grid;grid-template-columns:repeat(6,1fr)">'+Q.map(q=>'<div>'+questionPicture(q)+'<small>'+q.key+'</small></div>').join('')+'</div>';document.querySelectorAll('.qpic').forEach(e=>e.style.height='180px')});
 await page.screenshot({path:root+'/.record_73-76/fixed-unit-all.png',fullPage:true});
 await go('hako_shape_review_app_package/hako_shape_review_app.html');await page.locator('[data-start="learn"]').click();assert(!await page.locator('#revealBox').isVisible());
 await page.locator('#revealBtn').click();assert(await page.locator('#revealBox').isVisible());
 for(let i=0;i<3;i++)await page.locator('#nextBtn').click();await page.locator('#lessonExploreBtn').click();
 const svg=page.locator('#lessonScreen .viewer svg').first();
 const face=page.locator('#lessonScreen polygon[data-kind="face"]').first();const box=await face.boundingBox();
 await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
 assert(!((await page.locator('#lessonScreen .discoverHud.show .discoverCount').innerText()).startsWith('0 / 6')));
 // Rotate by pointer drags and tap every visible face until all six are found.
 for(let i=0;i<12;i++){
  const ids=await svg.locator('polygon[data-kind="face"]').evaluateAll(es=>es.map(e=>e.dataset.id));
  for(const id of ids){const xy=await svg.locator(`polygon[data-id="${id}"]`).evaluate(el=>{const pts=[...el.points];const c={x:pts.reduce((s,p)=>s+p.x,0)/4,y:pts.reduce((s,p)=>s+p.y,0)/4};const p=new DOMPoint(c.x,c.y).matrixTransform(el.getScreenCTM());return{x:p.x,y:p.y}});await page.mouse.click(xy.x,xy.y)}
  if((await page.locator('#lessonScreen .discoverHud.show .discoverCount').innerText()).startsWith('6 / 6'))break;
  const b=await svg.boundingBox();await page.mouse.move(b.x+b.width*.5,b.y+b.height*.5);await page.mouse.down();await page.mouse.move(b.x+b.width*.5+110,b.y+b.height*.5+60,{steps:12});await page.mouse.up();
 }
 assert((await page.locator('#lessonScreen .discoverHud.show .discoverCount').innerText()).startsWith('6 / 6'),await page.locator('#lessonScreen .discoverHud.show .discoverCount').innerText());
 await page.screenshot({path:root+'/.record_73-76/fixed-box-six.png'});
 await page.locator('#nextBtn').click();await page.locator('#nextBtn').click();await page.locator('#revealBtn').click();await page.screenshot({path:root+'/.record_73-76/fixed-box-angles.png'});
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS: persistent side/vertex marks, grid intersections, scroll reset, audio ON/OFF persistence, 66 questions and illustrations, pointer discovery 6/6');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});

