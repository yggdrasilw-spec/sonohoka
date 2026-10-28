const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),http=require('node:http');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const Model=require('../my-town/town-model.js');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.portfolio-work/my-town');fs.mkdirSync(out,{recursive:true});
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'my-town/data.js'),'utf8'),context);
const places=new Map(context.window.TOWN_PLACES.map(p=>[p.id,p]));
const vectors={N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]},angles={N:0,E:90,S:180,W:270};
let routes=0,countedSegments=0;const cases=new Map();
for(const size of Model.SIZES){
 const state={version:1,size,title:'Map QA',plots:Array(size*size).fill('house'),start:0,goal:size*size-1};
 for(let a=0;a<size*size;a++)for(let b=0;b<size*size;b++){
  if(a===b)continue;const r=Model.plan(state,a,b,places),s=Model.entrance(size,a),g=Model.entrance(size,b);
  assert.deepEqual(r.path[0],s);assert.deepEqual(r.path.at(-1),g);
  // Independent shortest length: Manhattan distance, except that two entrances
  // on the same odd column need a detour to the adjacent road and back.
  const distance=Math.abs(s.x-g.x)+Math.abs(s.y-g.y)+(s.x===g.x&&s.y!==g.y?2:0);
  assert.equal(r.path.length-1,distance);
  let at=s,dir=r.initial,travel=0;
  for(const step of r.steps){
   if(step.type==='turn'){
    const [x,y]=vectors[dir],[u,v]=vectors[step.dir],cross=x*v-y*u;
    assert.equal(step.text,cross>0?'Turn right.':'Turn left.');assert.equal(step.fromDir,dir);assert.equal(step.turnSign,Math.sign(cross));dir=step.dir;
    if(size===4&&!cases.has(`${step.fromDir}-${step.dir}`))cases.set(`${step.fromDir}-${step.dir}`,{state:{...state,start:a,goal:b},index:r.steps.indexOf(step),step});
   }
   if(step.type==='move'){
    assert(step.nodes.length>1);for(const n of step.nodes.slice(1)){assert.deepEqual([n.x-at.x,n.y-at.y],vectors[dir]);assert(!(n.x%2&&n.y%2));assert(n.x>=0&&n.x<=2*size&&n.y>=0&&n.y<=2*size);at=n;travel++;}
    assert.equal(step.blocks,(step.nodes.length-1)/2);assert(step.blocks>0&&Number.isInteger(step.blocks*2));
    assert.equal(step.blocks,(Math.abs(step.nodes.at(-1).x-step.nodes[0].x)+Math.abs(step.nodes.at(-1).y-step.nodes[0].y))/2);
    assert.match(step.text,/^Go straight for (half a block|(one|two|three|four|five|six|seven|eight)( and a half)? blocks?)\.$/);
    assert.equal(step.text.endsWith('one block.'),step.blocks===1);assert.equal(step.text.includes('half'),!Number.isInteger(step.blocks));countedSegments++;
   }
  }
  assert.equal(travel,distance);assert.deepEqual(at,g);const [dx,dy]=vectors[dir];assert(r.steps.at(-1).text.endsWith(`on your ${dx>0?'right':'left'}.`));routes++;
 }
 for(const next of Model.SIZES){const changed=Model.resize(state,next);for(let y=0;y<Math.min(size,next);y++)for(let x=0;x<Math.min(size,next);x++)assert.equal(changed.plots[y*next+x],state.plots[y*size+x]);assert.equal(changed.start,0);assert.equal(changed.goal,next<size?null:(size-1)*next+size-1);}
}
assert.equal(routes,6132);assert.equal(cases.size,8);assert(countedSegments>0);

const server=http.createServer((req,res)=>{let pathname=decodeURIComponent(req.url.split('?')[0]);if(pathname.endsWith('/'))pathname+='index.html';const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/my-town/`;const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];let samples=0;
try{
 const page=await browser.newPage({viewport:{width:1366,height:900}});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{document.addEventListener('DOMContentLoaded',()=>{const sound=document.getElementById('sound');if(sound?.getAttribute('aria-pressed')==='true')sound.click();});});
 await page.goto(base);
 async function load(state){await page.evaluate(data=>localStorage.setItem('my-town-v1',JSON.stringify(data)),state);await page.reload();await page.locator('#route-tab').click();await page.locator('#speed').selectOption('0');}
 async function advance(n){for(let i=0;i<n;i++){await page.locator('#next').click();await page.waitForFunction(()=>!MyTown.snapshot().busy);}}
 for(const [key,c] of cases){
  await load(c.state);await advance(c.index);await page.locator('#speed').selectOption('900');await page.locator('#next').click();
  let middle=false,last=angles[c.step.fromDir],direction=c.step.turnSign;
  for(let i=0;i<7;i++){await page.waitForTimeout(100);const sample=await page.evaluate(()=>MyTown.snapshot());if(sample.busy){const delta=sample.bearing-angles[c.step.fromDir];assert(delta*direction>=-0.01&&delta*direction<=90.01);assert((sample.bearing-last)*direction>=-0.01);if(Math.abs(delta)>2&&Math.abs(delta)<88)middle=true;last=sample.bearing;samples++;}}
  assert(middle,`no intermediate angle for ${key}`);await page.waitForFunction(()=>!MyTown.snapshot().busy);const final=await page.evaluate(()=>MyTown.snapshot());assert.equal(final.heading,c.step.dir);assert(Math.abs(final.bearing-(angles[c.step.fromDir]+direction*90))<.01);assert.equal(await page.locator('#turn-cue').count(),1);assert.equal(await page.locator('#turn-bubble').innerText(),c.step.text);
 }
 console.log('PASS: all eight smooth turn combinations');
 const c=[...cases.values()].find(c=>c.step.text==='Turn right.');await load(c.state);await advance(c.index);await page.locator('#speed').selectOption('900');await page.locator('#next').click();await page.waitForTimeout(200);const board=await page.locator('#board').elementHandle();await page.locator('#open-map').click();assert.equal(await page.locator('#map-dialog #board').count(),1);assert(await board.evaluate(e=>e===document.getElementById('board')));await page.waitForFunction(()=>!MyTown.snapshot().busy);assert.equal((await page.evaluate(()=>MyTown.snapshot())).index,c.index+1);
 await page.screenshot({path:path.join(out,'large-map-turn.png'),fullPage:true});
 const before=await page.locator('.plot img').first().boundingBox();await page.locator('#map-zoom').selectOption('2');await page.waitForTimeout(150);const enlarged=await page.locator('.plot img').first().boundingBox();assert(enlarged.width>before.width*1.5);assert(enlarged.height>before.height*1.4);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.getElementById('map-dialog').open);assert.equal(await page.locator('.map-scroll #board').count(),1);
 // Interrupted turns must never finish against a new map.
 await page.locator('#restart').click();await page.locator('#speed').selectOption('0');await advance(c.index);await page.locator('#speed').selectOption('900');await page.locator('#next').click();await page.waitForTimeout(200);await page.locator('#stop').click();const stopped=await page.evaluate(()=>MyTown.snapshot());await page.waitForTimeout(1200);assert.equal((await page.evaluate(()=>MyTown.snapshot())).bearing,stopped.bearing);assert.equal(await page.locator('#turn-cue').count(),0);assert.equal(await page.locator('#character').evaluate(e=>e.classList.contains('posing')),false);
 // Increase preserves row/column and endpoint references; file round trip keeps size.
 await page.locator('#map-size').selectOption('6');assert.equal(await page.locator('.plot').count(),36);let state=(await page.evaluate(()=>MyTown.snapshot())).state;assert.equal(state.size,6);assert.equal(state.start,Math.floor(c.state.start/4)*6+c.state.start%4);assert.equal(state.goal,Math.floor(c.state.goal/4)*6+c.state.goal%4);await page.reload();assert.equal(await page.locator('.plot').count(),36);
 const downloading=page.waitForEvent('download');await page.locator('#export').click();const download=await downloading,exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(exported.size,6);await page.locator('#import').setInputFiles({name:'large.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await page.locator('#replace-confirm').click();assert.equal(await page.locator('.plot').count(),36);
 await page.locator('#map-size').selectOption('8');await page.locator('#edit-tab').click();await page.locator('[data-id="library"]').click();await page.locator('.plot').nth(63).click();await page.locator('#route-tab').click();await page.locator('#goal').selectOption('63');await page.locator('#map-size').selectOption('4');assert.match(await page.locator('#replace-description').innerText(),/外側の/);await page.locator('button[value=cancel]').click();assert.equal(await page.locator('.plot').count(),64);await page.locator('#map-size').selectOption('4');await page.locator('#replace-confirm').click();await page.waitForFunction(()=>MyTown.snapshot().mapSize===4);assert.equal((await page.evaluate(()=>MyTown.snapshot())).state.goal,null);await page.locator('#undo').click();assert.equal(await page.locator('.plot').count(),64);assert.equal((await page.evaluate(()=>MyTown.snapshot())).state.goal,63);
 // Changing the grid during playback cancels stale motion.
 await page.locator('#play').click();await page.locator('#map-size').selectOption('5');await page.locator('#replace-confirm').click();await page.waitForTimeout(1300);assert.equal((await page.evaluate(()=>MyTown.snapshot())).busy,false);assert.equal(await page.locator('.plot').count(),25);
 for(const size of Model.SIZES){await load({version:1,size,title:`${size} × ${size} Town`,plots:Array(size*size).fill('library'),start:0,goal:size*size-1});await page.locator('#open-map').click();await page.locator('#map-zoom').selectOption('1.25');await page.screenshot({path:path.join(out,`large-map-${size}.png`),fullPage:true});await page.keyboard.press('Escape');}
 console.log('PASS: map sizes, file round trip, cancellation, undo and large view');
 // All new images decode, including 8 intermediate directions and the packed sheet.
 const decoded=await page.evaluate(async()=>{const paths=TOWN_PLACES.map(p=>`assets/map-places/${p.id}.webp`);for(let i=0;i<8;i++)paths.push(`assets/character/turn-${i}.webp`);paths.push('assets/character/turn-sheet.webp');for(const path of paths){const im=new Image();im.src=path;await im.decode();}return paths.length;});assert.equal(decoded,49);
 for(const [width,height] of [[1024,768],[768,1024],[390,844],[320,640]]){await page.setViewportSize({width,height});await page.locator('#open-map').click();const dims=await page.locator('#map-dialog').evaluate(e=>({w:e.offsetWidth,h:e.offsetHeight,iw:innerWidth,ih:innerHeight}));assert(dims.w<=dims.iw&&dims.h<=dims.ih);for(const selector of ['#close-map','#map-dialog [data-map-action="next"]','#map-dialog [data-map-action="stop"]']){const box=await page.locator(selector).boundingBox();assert(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1);}await page.screenshot({path:path.join(out,`large-map-${width}x${height}.png`),fullPage:true});await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 await page.emulateMedia({reducedMotion:'reduce'});await load(c.state);await advance(c.index);await page.locator('#speed').selectOption('900');await page.locator('#next').click();await page.waitForFunction(()=>!MyTown.snapshot().busy);assert.equal((await page.evaluate(()=>MyTown.snapshot())).heading,c.step.dir);
 assert.deepEqual(errors,[]);const result={routes,countedSegments,turnCombinations:cases.size,intermediateSamples:samples,newImages:decoded};fs.writeFileSync(path.join(out,'map-results.json'),JSON.stringify(result,null,2));console.log('PASS',JSON.stringify(result));
}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
