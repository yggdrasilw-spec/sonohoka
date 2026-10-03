const fs=require('fs'),path=require('path'),http=require('http'),{chromium}=require('playwright');
const root='C:/Users/user';
const shotRoot='C:/Users/user/.cache/lesson-sharing';fs.mkdirSync(shotRoot,{recursive:true});
const apps=[['suji-ninshiki','tashi_hiki_hissan_tegakimondai.html'],['suji-ninshiki','kakezan.html'],['keisan','tashizan_ninja.html'],['keisan2','hikizan_hunter.html'],['sonohoka','warizan_renshu_hint.html'],['sonohoka','tashizan_daibouken.html'],['sonohoka','kakezan_textbook_interactive.html'],['sonohoka','seisuu_no_seishitsu_yasashiku.html']];
const server=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+name);if(!file.startsWith(path.resolve(root)+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,channel:'chrome'});let failures=0;
 for(const [repo,file] of apps){
  const context=await browser.newContext(),page=await context.newPage(),errors=[];
  await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(origin+'/'+repo+'/'+file,{waitUntil:'load'});
   await page.waitForSelector('.lesson-share-launcher',{state:'attached',timeout:10000});
   await page.evaluate(()=>LessonShare.open());
   const rows=page.locator('.lesson-share-row');
   if(!(await rows.count()))throw Error('No registered settings');
   await rows.evaluateAll(rows=>rows.forEach(row=>{const control=row.querySelector('select');if(control){control.selectedIndex=/かける数の桁数/.test(row.textContent)?0:control.options.length-1;}else {const group=row.querySelector(':scope > div');if(group)group.querySelectorAll('input').forEach(input=>input.checked=true);else{const inputs=row.querySelectorAll('input');if(inputs.length>1)inputs[1].checked=!inputs[1].checked;}}}));
   await page.locator('#lesson-teacher').fill('ａｂ１２');
   if(await page.locator('#lesson-raid').count())await page.locator('#lesson-raid').fill('cd34');
   await page.getByRole('button',{name:'配布URLを生成',exact:true}).click();
   const url=await page.locator('.lesson-share textarea').inputValue(),params=new URL(url).searchParams;
   if(params.get('teacherCode')!=='AB12')throw Error('Teacher code missing');
   const settings=JSON.parse(params.get('lesson')).settings;
   if(!Object.keys(settings).length)throw Error('Empty settings');
   // Restore without making a real classroom connection.
   const restore=new URL(url);restore.searchParams.delete('code');restore.searchParams.delete('teacherCode');
   await page.goto(restore.href,{waitUntil:'load'});await page.waitForSelector('.lesson-share-launcher',{state:'attached'});
   await page.evaluate(()=>LessonShare.open());
   await page.getByRole('button',{name:'配布URLを生成',exact:true}).click();
   const roundtrip=JSON.parse(new URL(await page.locator('.lesson-share textarea').inputValue()).searchParams.get('lesson')).settings;
   for(const key of Object.keys(settings))if(JSON.stringify(settings[key])!==JSON.stringify(roundtrip[key]))throw Error('Roundtrip mismatch '+key+': '+JSON.stringify(roundtrip[key]));
   // Continue with an URL containing no problem settings or codes.
  }catch(error){
   failures++;console.log('FAIL',repo,file,error.message,errors);await context.close();continue;
  }
  try{
   await page.locator('.lesson-share-row > label > input').evaluateAll(inputs=>inputs.forEach(input=>{input.checked=false;input.dispatchEvent(new Event('change'));}));
   await page.locator('#lesson-teacher').fill('');if(await page.locator('#lesson-raid').count())await page.locator('#lesson-raid').fill('');
   await page.getByRole('button',{name:'配布URLを生成',exact:true}).click();
   const params=new URL(await page.locator('.lesson-share textarea').inputValue()).searchParams;
   if(params.has('lesson')||params.has('code')||params.has('teacherCode'))throw Error('Omitted settings leaked');
   await page.setViewportSize({width:390,height:844});
   const box=await page.locator('.lesson-share').boundingBox();if(box.width>390)throw Error('Mobile dialog overflows');
   await page.screenshot({path:path.join(shotRoot,repo+'-'+file+'.png')});
   if(repo==='suji-ninshiki'&&file.startsWith('tashi_')){
    const url=new URL(page.url());url.searchParams.set('lesson',JSON.stringify({v:1,app:'tashi-hiki-hissan',settings:{ops:['sub'],digits:['3_2'],carries:['none']}}));
    await page.goto(url.href,{waitUntil:'load'});await page.waitForSelector('.lesson-share-launcher',{state:'attached'});
    const problems=await page.evaluate(()=>Array.from({length:50},()=>generateProblemByType()));
    if(problems.some(p=>p.a<100||p.a>999||p.b<10||p.b>99||p.answer!==p.a-p.b))throw Error('Problem selection did not apply');
   }
   const relevant=errors.filter(e=>/Lesson|selectedTypes|selectRaid|STAGE_TITLES|is not defined|is not a function|SyntaxError/.test(e));
   if(relevant.length)throw Error(relevant.join('; '));
   console.log('PASS',repo,file);
   await context.addInitScript({path:path.join(__dirname,'lesson-firebase-fixture.js')});
   const connectionURL=new URL(origin+'/'+repo+'/'+file);connectionURL.searchParams.set('share','1');connectionURL.searchParams.set('teacherCode','AB12');
   if(repo!=='sonohoka'||file==='warizan_renshu_hint.html')connectionURL.searchParams.set('code','CD34');
   await page.goto(connectionURL.href,{waitUntil:'load'});
   await page.waitForFunction(()=>window.TeacherBridge&&TeacherBridge.getSessionState().connected,{},{timeout:10000});
   const teacherCode=await page.evaluate(()=>TeacherBridge.getSessionState().teacherCode);if(teacherCode!=='AB12')throw Error('Wrong teacher session');
   if(repo==='suji-ninshiki'&&file.startsWith('tashi_')){
     await page.waitForFunction(()=>document.getElementById('classRaidStatus').textContent.includes('テストボス'));
     await page.waitForFunction(()=>currentProblem!==null);
     await page.evaluate(async()=>{await LessonRaid.answer(currentProblem);await LessonRaid.answer(currentProblem);});
     const attacks=await page.evaluate(()=>fixtureWrites.filter(([path])=>path==='rooms/CD34/logs').length);
     if(attacks!==1)throw Error('Raid duplicate or missing attack');
   }
   console.log('PASS connections',repo,file);
  }catch(error){failures++;console.log('FAIL',repo,file,error.message,errors);}
  await context.close();
 }
 await browser.close();server.close();process.exitCode=failures?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
