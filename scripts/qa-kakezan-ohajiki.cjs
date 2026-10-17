const assert=require('node:assert/strict'),path=require('node:path');
const{pathToFileURL}=require('node:url');
const{chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve(__dirname,'../kakezan_ohajiki.html')).href);await page.evaluate(()=>snd=0);let cases=0;
async function drag(from,to){const points=await page.evaluate(([from,to])=>{const m=svg.getScreenCTM();return[from,to].map(([x,y])=>({x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f}))},[from,to]);await page.mouse.move(points[0].x,points[0].y);await page.mouse.down();await page.mouse.move(points[1].x,points[1].y,{steps:12});await page.mouse.up();await page.waitForFunction(()=>!anim)}
// Intro: six visible drags build two groups of three, then explain factor order.
assert.equal(await page.evaluate(()=>mode),'demo');
assert.equal(await page.locator('#demoNext').innerText(),'デモを はじめる');
await page.locator('#demoNext').click();await page.waitForFunction(()=>!demoMotion);
assert.deepEqual(await page.evaluate(()=>groups().map(g=>g.n)),[3]);
await page.locator('#demoNext').click();await page.waitForFunction(()=>!demoMotion);
assert.deepEqual(await page.evaluate(()=>groups().map(g=>g.n)),[3,3]);
await page.locator('#demoNext').click();assert.equal(await page.locator('#msg .big').innerText(),'3×2＝6');
assert.equal(await page.locator('#msg .cb').first().innerText(),'3こずつ');
assert.equal(await page.locator('#msg .cr').first().innerText(),'2つぶん');
await page.screenshot({path:path.resolve(__dirname,'../tmp/ohajiki-demo.png')});
await page.locator('#demoNext').click();assert.equal(await page.evaluate(()=>items.length),0);
await page.locator('#demoNext').click();await page.waitForTimeout(180);await page.locator('#demoPlay').click();await page.waitForTimeout(750);
assert.equal(await page.evaluate(()=>mode),'play');assert.equal(await page.evaluate(()=>items.length),0);cases++;
// Only one source is visible; switching preserves placed items and supports keyboard use.
for(const viewport of [{width:1366,height:768},{width:768,height:1024}]){await page.setViewportSize(viewport);await page.locator('[data-m=play]').click();await page.evaluate(()=>{pal=0;render()});for(let t=0;t<4;t++){assert.equal(await page.locator('[data-pal]').count(),1);assert.equal(await page.locator('[data-pal]').getAttribute('data-pal'),String(t));const h=await page.evaluate(()=>H);await drag([240,h-46],[100+t*160,120]);assert.deepEqual(await page.evaluate(()=>items.map(i=>i.t)),Array.from({length:t+1},(_,i)=>i));await page.locator('[data-pal-step="1"]').click();cases++}assert.equal(await page.locator('[data-pal]').getAttribute('data-pal'),'0');await page.locator('[data-pal-step="-1"]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('[data-pal]').getAttribute('data-pal'),'3');await page.keyboard.press('Space');assert.equal(await page.locator('[data-pal]').getAttribute('data-pal'),'2');assert.deepEqual(await page.evaluate(()=>items.map(i=>i.t)),[0,1,2,3]);cases++}
for(const m of ['make','pair','choose','fill']){await page.locator(`[data-m=${m}]`).click();assert.equal(await page.locator('[data-pal]').count(),['make','pair'].includes(m)?1:0);cases++}
for(const mode of ['play','make','pair'])for(const resized of [false,true])for(const action of ['single-delete','group-delete','group-move']){await page.setViewportSize({width:1366,height:900});await page.locator(`[data-m=${mode}]`).click();await page.evaluate(()=>{items=[{id:nid++,t:0,x:250,y:220},{id:nid++,t:0,x:302,y:220},{id:nid++,t:1,x:600,y:220}];render()});const original=await page.evaluate(()=>items.map(i=>({id:i.id,x:i.x,y:i.y})));if(resized){await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(80);assert.deepEqual(await page.evaluate(()=>items.map(i=>({id:i.id,x:i.x,y:i.y}))),original)}const H=await page.evaluate(()=>svg.viewBox.baseVal.height);
if(action==='single-delete'){await drag([250,220],[550,H-39]);assert.deepEqual(await page.evaluate(()=>items.map(i=>i.id)),original.slice(1).map(i=>i.id))}
else if(action==='group-delete'){await drag([276,220],[550,H-39]);assert.deepEqual(await page.evaluate(()=>items.map(i=>i.id)),[original[2].id])}
else{await drag([276,220],[320,320]);assert.equal(await page.evaluate(()=>items.length),3);assert.deepEqual(await page.evaluate(()=>groups().map(g=>g.n)),[2,1])}cases++;assert.equal(await page.locator('#undo').isEnabled(),true);await page.locator('#undo').click();assert.deepEqual(await page.evaluate(()=>items.map(i=>({id:i.id,x:i.x,y:i.y}))),original);assert.equal(await page.locator('#undo').isDisabled(),true);cases++;}
// Undo placement and clearing in order; ignore a tap that does not change the board.
await page.setViewportSize({width:1366,height:768});await page.locator('[data-m=make]').click();await page.evaluate(()=>{voice=0;pal=0;render()});let trayH=await page.evaluate(()=>H);await drag([240,trayH-46],[250,200]);const placed=await page.evaluate(()=>boardState());await page.locator('#clr').click();assert.equal(await page.evaluate(()=>items.length),0);await page.locator('#undo').click();assert.deepEqual(await page.evaluate(()=>boardState()),placed);await page.locator('#undo').click();assert.equal(await page.evaluate(()=>items.length),0);assert.equal(await page.locator('#undo').isDisabled(),true);cases++;
await drag([240,trayH-46],[250,200]);await drag([250,200],[250,200]);await page.locator('#undo').click();assert.equal(await page.evaluate(()=>items.length),0);await drag([240,trayH-46],[250,200]);await page.locator('#nx').click();assert.equal(await page.locator('#undo').isDisabled(),true);cases++;
// Match number colors to the same mathematical roles in all make hints.
await page.evaluate(()=>{prob={a:3,b:2};$('q').innerHTML=makeExpr(3,2)+' の かたちを つくろう！';hl=1;render()});assert.equal(await page.locator('#q .cb').innerText(),'3');assert.equal(await page.locator('#q .cr').innerText(),'2');assert.ok((await page.locator('#msg .cb').allTextContents()).every(t=>t.startsWith('3')));assert.ok((await page.locator('#msg .cr').allTextContents()).every(t=>t.startsWith('2')));await page.locator('#hn').click();assert.equal(await page.locator('#msg .cy').innerText(),'6こ');await page.locator('#hn').click();assert.equal(await page.locator('#msg .cb').innerText(),'3こずつ');assert.equal(await page.locator('#msg .cr').innerText(),'2つ');assert.equal(await page.locator('#sv ellipse[stroke-dasharray]').count(),2);await page.screenshot({path:path.resolve(__dirname,'../tmp/ohajiki-color-hints.png')});cases++;
// Keep the tray clear of the screen edge at Chromebook landscape sizes.
for(const viewport of [{width:1366,height:768},{width:1180,height:664}]){await page.setViewportSize(viewport);await page.locator('[data-m=play]').click();const layout=await page.evaluate(()=>({bottom:svg.getBoundingClientRect().bottom,edge:innerHeight,padding:parseFloat(getComputedStyle($('L')).paddingBottom)}));assert.ok(layout.edge-layout.bottom>=26,JSON.stringify(layout));assert.ok(layout.padding>=26&&layout.padding<=35);cases++}
// Speech follows meaningful content changes and is independent of sound effects.
await page.evaluate(()=>{window.spoken=[];Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},speak(u){spoken.push(u.text)}}});snd=1;voice=1;audioReady=true;readState={question:'',messages:[]};audioUi();setMode('make')});await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>spoken.length),1);
await page.locator('#hn').click();await page.waitForTimeout(250);assert.ok(await page.evaluate(()=>spoken.at(-1).includes('まず')));assert.ok(await page.evaluate(()=>!spoken.at(-1).includes('の かたちを')));cases++;
// Put a sentence pause after a complete expression, without breaking its equality or duplicating punctuation.
for(const[source,expected]of [['3×2 の かたちを つくろう！','さん かける に。 の かたちを つくろう！'],['3×2＝6 だよ。','さん かける に は ろく。 だよ。'],['3×2。つぎへ。','さん かける に。つぎへ。'],['3＋2＝5','さん たす に は ご。'],['3こずつ ならべよう。','さんこずつ ならべよう。']]){await page.evaluate(text=>speak(text),source);assert.equal(await page.evaluate(()=>spoken.at(-1)),expected);cases++}
await page.locator('#se').click();assert.equal(await page.locator('#se').getAttribute('aria-pressed'),'false');let spokenBefore=await page.evaluate(()=>spoken.length);await page.locator('[data-m=choose]').click();await page.waitForTimeout(250);assert.ok(await page.evaluate(()=>spoken.length)>spokenBefore);cases++;
await page.locator('#voice').click();assert.equal(await page.locator('#voice').getAttribute('aria-pressed'),'false');spokenBefore=await page.evaluate(()=>spoken.length);await page.locator('#hn').click();await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>spoken.length),spokenBefore);await page.locator('#voice').click();await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>spoken.length),spokenBefore);await page.locator('#hn').click();await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>spoken.length),spokenBefore+1);cases++;
spokenBefore=await page.evaluate(()=>spoken.length);await page.evaluate(()=>{render();render()});await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>spoken.length),spokenBefore);assert.equal(await page.locator('#sp').count(),0);cases++;
// Adding a hint to existing feedback reads only the hint, not the title or feedback again.
await page.evaluate(()=>{setMode('make');fb='<p>その ならべかたを たしかめよう。</p>';render()});await page.waitForTimeout(250);await page.locator('#hn').click();await page.waitForTimeout(250);assert.ok(await page.evaluate(()=>spoken.at(-1).includes('まず')&&!spoken.at(-1).includes('たしかめよう')&&!spoken.at(-1).includes('の かたちを')));cases++;
// Resizing and changing the material do not narrate unchanged text.
spokenBefore=await page.evaluate(()=>spoken.length);await page.locator('[data-pal-step="1"]').click();await page.setViewportSize({width:1366,height:800});await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>spoken.length),spokenBefore);cases++;
// Filling advances with a short prompt rather than reading question marks and the whole equation.
await page.locator('[data-m=fill]').click();await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>spoken.at(-1)),'ひとつぶんの かずを えらぼう。');const fillN=await page.evaluate(()=>cur.n);await page.locator(`#ch button[data-v="${fillN}"]`).click();await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>spoken.at(-1)),'いくつぶんかを えらぼう。');cases++;
// Play reads only an equal grouping and its expression; uneven/single/empty boards stay quiet.
await page.locator('[data-m=play]').click();await page.waitForTimeout(250);spokenBefore=await page.evaluate(()=>spoken.length);
await page.evaluate(()=>{items=[{id:nid++,t:0,x:200,y:150},{id:nid++,t:0,x:252,y:150}];render()});await page.waitForTimeout(250);
assert.equal(await page.evaluate(()=>spoken.length),spokenBefore);
await page.evaluate(()=>{items.push({id:nid++,t:0,x:500,y:150});render()});await page.waitForTimeout(250);
assert.equal(await page.evaluate(()=>spoken.length),spokenBefore);
await page.evaluate(()=>{items.push({id:nid++,t:0,x:552,y:150});render()});await page.waitForTimeout(250);
assert.equal(await page.evaluate(()=>spoken.at(-1)),'おなじ かずずつに なったね。に かける に は よん。');
spokenBefore=await page.evaluate(()=>spoken.length);await page.evaluate(()=>render());await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>spoken.length),spokenBefore);cases++;
await page.evaluate(()=>speak('⭕ せいかい！ 💡 ヒント 📖'));assert.equal((await page.evaluate(()=>spoken.at(-1))).trim(),'せいかい！  ヒント');cases++;
await page.evaluate(()=>{voice=0;snd=0;audioUi()});await page.setViewportSize({width:1366,height:768});await page.locator('[data-m=play]').click();await page.screenshot({path:path.resolve(__dirname,'../tmp/ohajiki-bottom-space.png')});
// Fade question colors independently after five complete, unassisted questions.
async function solveLearningQuestion(m){
 if(m==='make')await page.evaluate(()=>{const{a,b}=prob;items=[];for(let j=0;j<b;j++)for(let i=0;i<a;i++)items.push({id:nid++,t:0,x:100+j*150,y:60+i*48});render()});
 if(m==='make')await page.locator('#chk').click();
 else for(let i=0;i<3;i++){const v=await page.evaluate(()=>[cur.n,cur.g,cur.n*cur.g][fs]);await page.locator(`#ch button[data-v="${v}"]`).click()}
}
await page.evaluate(()=>{for(const p of Object.values(progress))Object.assign(p,{correct:0,streak:0,faded:false});questionSolved=true});
for(const m of ['make','fill']){
 await page.locator(`[data-m=${m}]`).click();
 assert.equal(await page.locator('#progress').isVisible(),true);
 for(let i=1;i<=5;i++){
  assert.equal(await page.locator('#q').evaluate(el=>el.classList.contains('no-color')),false);
  await solveLearningQuestion(m);
  assert.deepEqual(await page.evaluate(m=>[progress[m].correct,progress[m].streak],m),[i,i]);
  if(m==='make'){await page.locator('#chk').click();assert.equal(await page.evaluate(()=>progress.make.correct),i)}
  await page.locator('#nx').click();
 }
 assert.equal(await page.locator('#q').evaluate(el=>el.classList.contains('no-color')),true);
 assert.equal(await page.locator('#q .cb').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
 assert.ok((await page.locator('#progress').innerText()).includes('5もん'));
 // Rerender and resize retain the faded question; hint restores all question colors.
 await page.evaluate(()=>render());await page.setViewportSize({width:1180,height:664});
 await page.locator('#hn').click();
 assert.equal(await page.locator('#q').evaluate(el=>el.classList.contains('no-color')),false);
 assert.equal(await page.locator('#q .cb').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(30, 136, 229)');
 await solveLearningQuestion(m);
 assert.deepEqual(await page.evaluate(m=>[progress[m].correct,progress[m].streak],m),[6,0]);
 await page.locator('#nx').click();
 assert.equal(await page.locator('#q').evaluate(el=>el.classList.contains('no-color')),true);
 // A wrong attempt resets the streak, but does not revoke the achieved fade milestone.
 if(m==='make')await page.locator('#chk').click();
 else {const v=await page.evaluate(()=>cur.n);await page.locator('#ch button').filter({hasText:/./}).evaluateAll((els,v)=>els.find(el=>+el.dataset.v!==v).click(),v)}
 await solveLearningQuestion(m);
 assert.deepEqual(await page.evaluate(m=>[progress[m].correct,progress[m].streak,progress[m].faded],m),[7,0,true]);
 await page.locator('[data-m=play]').click();assert.equal(await page.locator('#progress').isVisible(),false);
 await page.locator(`[data-m=${m}]`).click();assert.equal(await page.locator('#q').evaluate(el=>el.classList.contains('no-color')),true);
 cases++;
}
// With no hints or mistakes, the consecutive count restarts normally after an assisted answer.
await page.locator('[data-m=fill]').click();await solveLearningQuestion('fill');assert.equal(await page.evaluate(()=>progress.fill.streak),1);
await page.locator('#nx').click();await page.locator('#nx').click();assert.equal(await page.evaluate(()=>progress.fill.streak),0);cases++;
// All automatic modes cover every ordered factor pair once, from small totals upward.
for(const m of ['make','choose','fill']){
 await page.evaluate(m=>{problemPosition[m]=0;problemDecks[m]=[...problemOrder];setMode(m)},m);
 const seen=[];
 for(let i=0;i<16;i++){
  const pair=await page.evaluate(()=>mode==='make'?[prob.a,prob.b]:[cur.n,cur.g]);seen.push(pair);
  assert.equal(new Set(seen.map(p=>p.join('x'))).size,i+1);
  if(i)assert.ok(seen[i-1][0]*seen[i-1][1]<=pair[0]*pair[1]);
  if(i<15)await page.locator('#nx').click();
 }
 assert.deepEqual(seen[0],[2,2]);assert.deepEqual(seen.at(-1),[5,5]);
 assert.ok(seen.some(([a,b])=>a===2&&b===3)&&seen.some(([a,b])=>a===3&&b===2));
 // Both later rounds are shuffled permutations, with no repeat across round boundaries.
 let last=seen.at(-1);
 for(let round=2;round<=3;round++){
  const shuffled=[];
  for(let i=0;i<16;i++){
   await page.locator('#nx').click();
   const pair=await page.evaluate(()=>mode==='make'?[prob.a,prob.b]:[cur.n,cur.g]);
   if(!i)assert.notDeepEqual(pair,last);
   shuffled.push(pair);
  }
  assert.equal(new Set(shuffled.map(p=>p.join('x'))).size,16);
  assert.deepEqual(shuffled.map(p=>p.join('x')).sort(),seen.map(p=>p.join('x')).sort());
  last=shuffled.at(-1);cases++;
 }
 await page.locator('#nx').click();
 const expectedNext=await page.evaluate(m=>{const p=problemDecks[m][problemPosition[m]];return[p.a,p.b]},m);
 // Returning via a tab continues the sequence; another mode has its own position.
 const other=m==='make'?'choose':'make';
 const otherPosition=await page.evaluate(m=>problemPosition[m],other);
 await page.locator('[data-m=play]').click();await page.locator(`[data-m=${m}]`).click();
 assert.deepEqual(await page.evaluate(()=>mode==='make'?[prob.a,prob.b]:[cur.n,cur.g]),expectedNext);
 assert.equal(await page.evaluate(m=>problemPosition[m],other),otherPosition);
 cases++;
}
// Force a known Fisher-Yates path and the boundary-repeat repair.
await page.evaluate(()=>{
 const originalRandom=Math.random,originalMode=mode;
 const savedDeck=problemDecks.choose,savedPosition=problemPosition.choose;
 try{
  mode='choose';Math.random=()=>0;
  problemDecks.choose=[problemOrder[1]];problemPosition.choose=1;
  const result=nextProblem();
  if(result.a===problemOrder[1].a&&result.b===problemOrder[1].b)throw Error('Boundary repeat');
  if(problemDecks.choose.every((p,i)=>p===problemOrder[i]))throw Error('Shuffle was not applied');
 }finally{Math.random=originalRandom;mode=originalMode;problemDecks.choose=savedDeck;problemPosition.choose=savedPosition}
});cases++;
// Preserve a friend's question and its groups across resizing and returning to edit.
await page.setViewportSize({width:1366,height:900});await page.locator('[data-m=pair]').click();await page.evaluate(()=>{items=[{id:nid++,t:0,x:250,y:550},{id:nid++,t:0,x:302,y:550},{id:nid++,t:0,x:250,y:720},{id:nid++,t:0,x:302,y:720}];render()});const before=await page.evaluate(()=>({H,points:items.map(i=>[i.x,i.y])}));await page.locator('#chk').click();await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(80);assert.deepEqual(await page.evaluate(()=>({H,points:items.map(i=>[i.x,i.y])})),before);await page.locator('#nx').click();assert.deepEqual(await page.evaluate(()=>groups().map(g=>g.n)),[2,2]);cases++;assert.deepEqual(errors,[]);console.log(`PASS: ${cases} deletion, group movement and resize cases`)}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
