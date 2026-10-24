const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {serve}=require('./portfolio-demo-inspect.cjs');
const out=path.resolve(__dirname,'../.portfolio-work/heikin-narasu');fs.mkdirSync(out,{recursive:true});
(async()=>{const server=serve();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});let samples=0;const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/sonohoka/heikin_narasu.html`);
 const snapshot=()=>page.evaluate(()=>Narasu.snapshot());
 async function invariant(){const s=await snapshot(),v=s.visual;assert.equal(v.values.reduce((a,b)=>a+b,0)+v.bucket+v.jug+(v.transit||0),s.state.original.reduce((a,b)=>a+b,0));assert(v.values.every(x=>x>=0&&x<=300));assert(v.bucket>=0);if(s.state.stage===1){assert.equal(v.soil.heights.reduce((a,b)=>a+b,0)+v.soil.pile+v.soil.flying,s.state.original.reduce((a,b)=>a+b,0)*8);assert.equal(await page.locator('[data-grain]').count(),s.state.original.reduce((a,b)=>a+b,0)*8);}samples++;return s;}
 async function finish(){for(let i=0;i<850;i++){const s=await invariant();if(!s.busy)return s;await page.waitForTimeout(20);}throw Error('animation timeout');}
 async function scene(name){await page.locator('#scenes button').nth(['玉','土','水','水差し','式','練習'].indexOf(name)).click();await finish();}
 async function speed(value){await page.locator('#settingsOpen').click();await page.locator('#speed').selectOption(value);await page.locator('#settings button.primary').click();}
 async function demo(){await page.locator('#demo').click();return finish();}
 async function soilMovie(){for(let i=0;i<600;i++){const s=await invariant();if(!s.soilAuto&&!s.busy)return s;await page.waitForTimeout(25);}throw Error('soil movie timeout');}
 async function solve(){for(let i=0;i<80;i++){const s=await snapshot(),a=s.state.original.reduce((x,y)=>x+y,0)/s.state.original.length;if(s.state.values.every(x=>x===a)&&s.state.bucket===0&&s.state.jug===0)return s;await demo();}throw Error('unsolved');}
 async function custom(text){await page.locator('#settingsOpen').click();await page.locator('#custom').fill(text);await page.locator('#apply').click();}
 async function input(value){await page.locator('#answer').fill(String(value));await page.locator('#answerForm button').click();}
 async function col(i){await page.locator(`[data-col="${i}"]`).click();}
 // Pause, cancel, stale frame, invalid drop, undo and real keyboard moves.
 await col(0);await col(2);await page.waitForTimeout(170);await page.locator('#pause').click();const paused=await snapshot();await page.waitForTimeout(140);assert.deepEqual((await snapshot()).visual,paused.visual);await page.locator('#undo').click();assert.deepEqual((await snapshot()).state.values,[5,4,1,2]);
 await col(0);await col(2);await page.waitForTimeout(80);await scene('土');await page.waitForTimeout(900);assert.deepEqual((await snapshot()).state.values,[5,4,1,2]);assert.equal((await snapshot()).state.stage,1);
 await scene('玉');await speed('reduced');await page.locator('[data-col="0"]').focus();await page.keyboard.press('Enter');await page.locator('[data-col="2"]').focus();await page.keyboard.press('Enter');await finish();assert.deepEqual((await snapshot()).state.values,[4,4,2,2]);await page.locator('#undo').click();await solve();assert.deepEqual((await snapshot()).state.values,[3,3,3,3]);
 await page.screenshot({path:path.join(out,'01-beads.png')});
 await page.locator('#reset').click();const a=await page.locator('[data-col="0"]').boundingBox(),b=await page.locator('[data-col="2"]').boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:12});await page.mouse.up();await finish();assert.deepEqual((await snapshot()).state.values,[4,4,2,2]);
 await scene('土');assert.equal(await page.locator('[data-cut-line]').count(),0);await page.locator('#soilHeight').selectOption('3');await page.locator('#soilPlay').click();await page.locator('#pause').click();const soilPaused=await snapshot();await page.waitForTimeout(200);assert.deepEqual((await snapshot()).visual,soilPaused.visual);await page.locator('#pause').click();
 for(let i=0;i<5;i++){await soilMovie();const s=await snapshot();assert.equal(s.state.bucket,0);assert(s.state.values.every(v=>v===3));assert.equal(await page.locator('#board [role="button"]').count(),0);if(i<4){await page.locator('#anotherSoil').click();await page.locator('#soilHeight').selectOption('3');await page.locator('#soilPlay').click();}}await page.screenshot({path:path.join(out,'02-soil.png')});
 await page.locator('#reset').click();await page.locator('#soilPlay').click();await soilMovie();assert((await snapshot()).state.values.every(v=>v===3));
 // All four cup counts keep the same geometry; taps alone solve all water sets.
 await scene('水');for(let i=0;i<4;i++){if(i)await page.locator('#subnav button').nth(i).click();await solve();assert((await snapshot()).state.values.every(x=>x===[120,100,150,160][i]));}
 await page.locator('#reset').click();await col(0);await col(1);await page.locator('#pour10').click();await finish();const carried=(await snapshot()).state;await page.locator('#toJug').click();assert.deepEqual((await snapshot()).state.values,carried.values);assert.deepEqual((await snapshot()).state.original,carried.original);
 // Collect current water, preserve the empty cups, and distribute in rounds.
 for(let i=0;i<carried.values.length;i++){await col(i);await finish();}
 assert.equal((await snapshot()).state.jug,800);assert.equal(await page.locator('[data-col]').count(),5);await page.screenshot({path:path.join(out,'03-collected.png')});
 await speed('normal');await page.locator('#round').click();await finish();assert.deepEqual((await snapshot()).state.values,[10,10,10,10,10]);await page.locator('#undo').click();assert.deepEqual((await snapshot()).state.values,[0,0,0,0,0]);
 await page.locator('#divide').click();await finish();assert.deepEqual((await snapshot()).state.values,[160,160,160,160,160]);assert.equal((await snapshot()).state.jug,0);assert.match(await page.locator('#math').innerText(),/平均/);await page.screenshot({path:path.join(out,'04-average.png')});
 await page.locator('#next').click();assert.equal((await snapshot()).state.stage,4);await input(120);assert.equal((await snapshot()).state.step,0);await input(800);await input(4);assert.equal((await snapshot()).state.step,1);await input(5);await input(160);assert((await snapshot()).state.solved);await page.locator('#toggleDiagram').click();await page.locator('#toggleDiagram').click();assert(await page.locator('#drawing').isHidden());assert.equal(await page.locator('#cards .card').count(),5);await page.screenshot({path:path.join(out,'05-formula.png')});
 await scene('練習');await speed('reduced');await solve();await page.locator('#next').click();await input(120);assert((await snapshot()).state.solved);
 await page.locator('#next').click();await input(270);await input(3);await input(90);assert((await snapshot()).state.solved);
 await page.locator('#next').click();assert(await page.locator('#drawing').isHidden());await input(100);assert((await snapshot()).state.solved);
 await page.locator('#next').click();assert.match(await page.locator('#message').innerText(),/750/);assert.equal(await page.locator('#cards .card').count(),1);await input(150);assert((await snapshot()).state.solved);
 await page.locator('#next').click();assert.deepEqual((await snapshot()).state.original,[0,120,180]);await input(150);assert(!(await snapshot()).state.solved);await input(100);assert((await snapshot()).state.solved);
 await page.locator('#next').click();await input(125);assert((await snapshot()).state.solved);await page.locator('#solutionDiagram').click();assert.deepEqual((await snapshot()).state.values,[125,125]);
 // Teacher validation and custom problems including fractional water averages.
 await scene('玉');await custom('1,1,1,2');assert(await page.locator('#settings').isVisible());assert.match(await page.locator('#settingError').innerText(),/整数/);await page.locator('#settings button.primary').click();
 await scene('水');await custom('100,150');await solve();assert.deepEqual((await snapshot()).state.values,[125,125]);await custom('0,120,180');await page.locator('#toJug').click();await col(0);assert.equal((await snapshot()).state.jug,0);await col(1);await finish();await col(2);await finish();await page.locator('#divide').click();await finish();assert.deepEqual((await snapshot()).state.values,[100,100,100]);
 // Storage resumes the last committed operation even when interrupted in flight.
 await scene('玉');await speed('slow');await col(0);await col(2);await page.waitForTimeout(160);await page.reload();await page.locator('#resumeYes').click();assert.deepEqual((await snapshot()).state.values,[5,4,1,2]);assert(!(await snapshot()).busy);
 await speed('reduced');await demo();const savedState=(await snapshot()).state;await page.reload();await page.locator('#resumeYes').click();assert.deepEqual((await snapshot()).state,savedState);
 // Standard desktop fits; narrow screens and zoom retain access without horizontal overflow.
 const layouts=[];
 for(const viewport of [{width:1366,height:768},{width:1280,height:720},{width:768,height:1024},{width:390,height:844},{width:320,height:740}]){
  await page.setViewportSize(viewport);for(const name of ['玉','土','水','水差し','式','練習']){await scene(name);const layout=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,bottom:document.querySelector('footer').getBoundingClientRect().bottom}));assert(!layout.overflow,JSON.stringify({viewport,name,layout}));if(viewport.width>=1280)assert(layout.bottom<=viewport.height,JSON.stringify({viewport,name,layout}));layouts.push({viewport,name,...layout});}await page.screenshot({path:path.join(out,`layout-${viewport.width}.png`),fullPage:true});
 }
 await page.setViewportSize({width:1366,height:768});await page.evaluate(()=>document.documentElement.style.zoom='2');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({samples,layouts,errors},null,2));console.log(`PASS: ${samples} conservation samples; all six scenes, drag/tap/keyboard, 7 exercises, undo/pause/cancel/resume, custom validation, ${layouts.length} responsive layouts`);
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
