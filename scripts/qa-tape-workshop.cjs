const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const W=require('../tape-diagram/workshop-engine.js');
assert(W.assignments({total:'total',left:'left',right:'right'}));assert(!W.assignments({total:'left',left:'total',right:'right'}));
assert(!W.stroke('increase',0,null,{x:100,y:140},{x:110,y:140}).ok);
assert(!W.stroke('increase',0,null,{x:100,y:140},{x:800,y:140}).ok);
assert(!W.stroke('increase',1,{a:90,b:400},{x:90,y:140},{x:750,y:140}).ok);
assert(W.stroke('increase',1,{a:90,b:400},{x:400,y:140},{x:750,y:140}).ok);
assert(!W.stroke('compare',1,{a:90,b:700},{x:90,y:220},{x:720,y:220}).ok);
assert(!W.stroke('decrease',1,{a:90,b:700},{x:80,y:140},{x:80,y:140}).ok);
assert(W.stroke('decrease',1,{a:90,b:700},{x:350,y:140},{x:350,y:140}).ok);
const out='C:/Users/user/.cache/tape-diagram-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 const page=await browser.newPage({viewport:{width:1280,height:1000},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('file:///C:/Users/user/sonohoka/tape-diagram/index.html');
 await page.locator('#workshopButton').click();assert(await page.locator('#intro').isHidden());assert.equal(await page.locator('.practiceChoice').count(),6);await page.screenshot({path:out+'/workshop-hub.png',fullPage:true});
 const enter=async index=>{if(await page.locator('#workshopExercise').isVisible())await page.locator('#workshopMenu').click();await page.locator('.practiceChoice').nth(index).click();};
 const setLesson=async id=>page.locator('#workshopLesson').selectOption(id);
 const place=async(role,target=role)=>{await page.locator(`[data-fact="${role}"]`).click();await page.locator(`[data-range="${target}"]`).click();};
 // Matching and fixing work for all four structures, including the start-as-whole difficulty.
 for(const id of ['combine-small','increase-small','decrease-small','compare-small']){
  await enter(0);await setLesson(id);await place('left','total');assert((await page.locator('#workshopFeedback').textContent()).includes('一部分'));for(const r of W.roles)await place(r);assert((await page.locator('#workshopFeedback').textContent()).includes('むすべた'));
  await enter(2);await setLesson(id);await page.getByRole('button',{name:'たしかめる',exact:true}).click();assert(!(await page.locator('#workshopFeedback').textContent()).includes('正しく'));
  await place('total','left');await page.getByRole('button',{name:'たしかめる',exact:true}).click();assert((await page.locator('#workshopFeedback').textContent()).includes('正しく'));
 }
 await enter(1);await setLesson('increase-small');
 for(const label of ['全体','はじめ','もらった']){await page.getByRole('button',{name:label+'を □にする',exact:true}).click();const plus=label==='全体';await page.getByRole('button',{name:plus?'ひき算で 求める':'たし算で 求める',exact:true}).click();assert.equal(await page.locator('#workshopScene .equation').count(),0);await page.getByRole('button',{name:plus?'たし算で 求める':'ひき算で 求める',exact:true}).click();assert.equal(await page.locator('#workshopScene .equation').count(),1);}
 await enter(3);await setLesson('decrease-small');await page.getByRole('button',{name:'左の部分から',exact:true}).click();assert((await page.locator('#workshopFeedback').textContent()).includes('全体'));await page.getByRole('button',{name:'全体から',exact:true}).click();
 for(let i=0;i<2;i++)await page.getByRole('button',{name:'お手本と いっしょに描く',exact:true}).click();for(const r of W.roles)await place(r);await page.getByRole('button',{name:'図を たしかめる',exact:true}).click();assert((await page.locator('#workshopFeedback').textContent()).includes('正しく'));
 // Independent strokes build an actual connected diagram, and disconnected strokes are rejected.
 await setLesson('increase-small');await page.getByRole('button',{name:'白紙から',exact:true}).click();await page.getByRole('button',{name:'左の部分から',exact:true}).click();assert.equal(await page.locator('#workshopScene .trace').count(),0);
 const stroke=async(a,b)=>{await page.locator('.workshopDraw').scrollIntoViewIfNeeded();const box=await page.locator('.workshopDraw').boundingBox();const p=v=>({x:box.x+v[0]*box.width/900,y:box.y+v[1]*box.height/340});const start=p(a),end=p(b);await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:8});await page.mouse.up();};
 await stroke([100,140],[480,140]);await stroke([100,140],[300,140]);assert((await page.locator('#workshopFeedback').textContent()).includes('右端'));await stroke([480,140],[780,140]);
 await place('total','left');await page.getByRole('button',{name:'図を たしかめる',exact:true}).click();assert(!(await page.locator('#workshopFeedback').textContent()).includes('正しく'));for(const r of W.roles)await place(r);await page.getByRole('button',{name:'図を たしかめる',exact:true}).click();assert((await page.locator('#workshopFeedback').textContent()).includes('正しく'));
 await page.screenshot({path:out+'/workshop-drawn.png',fullPage:true});
 // Saved SVG contains real curved ranges and portable style, without clickable hit regions.
 const svgDownload=page.waitForEvent('download');await page.locator('#workshopSaveSvg').click();const d=await svgDownload;await d.saveAs(out+'/my-diagram.svg');const svg=fs.readFileSync(out+'/my-diagram.svg','utf8');assert(svg.includes('<style'));assert(svg.includes(' Q '));assert(!svg.includes('rangeHit'));
 await enter(4);await setLesson('combine-small');await page.getByRole('button',{name:'ふえる話',exact:true}).click();await page.locator('#workshopDraft').fill('花が8本ありました。7本もらい、15本になりました。');await page.getByRole('button',{name:'お話を 保存する',exact:true}).click();assert((await page.locator('#workshopFeedback').textContent()).includes('先生と'));
 await enter(5);await setLesson('ribbon');await page.getByRole('button',{name:'○図で 表す',exact:true}).click();assert((await page.locator('#workshopFeedback').textContent()).includes('長さ'));await page.getByRole('button',{name:'線分図で 表す',exact:true}).click();assert(await page.locator('#workshopScene .segmentA').count());await page.locator('#formatReason').fill('長さのまとまりを線で表せるから');await page.getByRole('button',{name:'えらんだ理由を 保存する',exact:true}).click();
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:out+'/workshop-mobile.png',fullPage:true});
 await page.locator('#workshopMenu').click();await page.locator('.workshopRecords summary').click();const reportDownload=page.waitForEvent('download');await page.locator('#workshopExportRecords').click();const r=await reportDownload;await r.saveAs(out+'/practice-records.json');const report=JSON.parse(fs.readFileSync(out+'/practice-records.json'));assert(report.records.some(r=>r.mode==='draw'&&r.level==='free'&&r.help===0));assert(report.records.some(r=>r.mode==='story'&&r.story.includes('15本')));
 const recordCount=report.records.length;await page.reload();await page.locator('#workshopButton').click();await page.locator('.workshopRecords summary').click();assert((await page.locator('#workshopRecords').textContent()).includes('件'));assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('tape-workshop-records-v1')).length),recordCount);
 await page.locator('#extendButton').click();assert(await page.locator('#workshop').isHidden());assert(await page.locator('#extension').isVisible());await page.locator('#introButton').click();assert(await page.locator('#extension').isHidden());assert(await page.locator('#intro').isVisible());
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,modes:6,structures:4,independentDrawing:true,wrongDiagrams:true,svgExport:true,recordsPersist:true,mobileOverflow:false},null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
