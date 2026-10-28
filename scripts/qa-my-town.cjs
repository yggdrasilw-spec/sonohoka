const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.portfolio-work/my-town');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{let pathname=decodeURIComponent(req.url.split('?')[0]);if(pathname.endsWith('/'))pathname+='index.html';const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
const sample={version:1,title:'QA Town',plots:['elementary-school','park',null,'library',null,'post-office','hospital',null,'house',null,'supermarket',null,'station','restaurant',null,'zoo'],start:0,goal:15};
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({channel:'msedge',headless:true});let checks=0;
try{
 const p=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{document.addEventListener('DOMContentLoaded',()=>{const sound=document.getElementById('sound');if(sound?.getAttribute('aria-pressed')==='true')sound.click();});});
 await p.goto(base+'/my-town/source/original.html');
 const original=await p.evaluate(async()=>{
   mapData[1][1]='house';mapData[1][3]='library';startPos={r:1,c:1};goalPos={r:1,c:3};
   const path=findPath(getNearestIntersection(startPos,goalPos),getNearestIntersection(goalPos,startPos));const adjacent=buildSteps(path).map(s=>s.text);
   goalPos={r:1,c:9};mapData[1][9]='library';const far=findPath(getNearestIntersection(startPos,goalPos),getNearestIntersection(goalPos,startPos));
   speak=async()=>{};sleep=async()=>{};await executeSteps(buildSteps(far));
   return {adjacent,firstMove:buildSteps(far).find(s=>s.type==='move').dir,rotation:document.getElementById('char-svg').style.transform};
 });
 assert(original.adjacent.some(t=>t.includes('0 block')));assert.equal(original.firstMove,'E');assert.equal(original.rotation,'rotate(0deg)');
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:path.join(out,'original-mobile.png'),fullPage:true});
 const originalOverflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert(originalOverflow);
 fs.writeFileSync(path.join(out,'original-evidence.json'),JSON.stringify({...original,originalOverflow},null,2));checks+=3;
 await p.setViewportSize({width:1366,height:900});await p.goto(base+'/my-town/');
 await p.evaluate(data=>localStorage.setItem('my-town-v1',JSON.stringify(data)),sample);await p.reload();
 await p.locator('#route-tab').click();await p.locator('#speed').selectOption('0');
 // Exercise all 240 distinct ordered pairs. Use independent road connectivity,
 // shortest-distance BFS, vector turns and endpoint offsets as the oracle.
 const routes=await p.evaluate(()=>{
   const full={version:1,title:'All pairs',plots:Array(16).fill('house'),start:0,goal:1};localStorage.setItem('my-town-v1',JSON.stringify(full));return true;
 });assert(routes);await p.reload();await p.locator('#route-tab').click();
 const allPairs=await p.evaluate(()=>{
   const dirs={N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]};let count=0,left=0,right=0;
   const independentDistance=(s,g)=>{const q=[[s.x,s.y,0]],seen=new Set();for(let i=0;i<q.length;i++){const [x,y,d]=q[i];if(x===g.x&&y===g.y)return d;for(const [dx,dy] of Object.values(dirs)){const a=x+dx,b=y+dy,key=a+','+b;if(a<0||a>8||b<0||b>8||(a%2===1&&b%2===1)||seen.has(key))continue;seen.add(key);q.push([a,b,d+1]);}}};
   for(let a=0;a<16;a++)for(let b=0;b<16;b++){if(a===b)continue;
     // Clear first to avoid the intentional same-endpoint validation.
     const st=document.getElementById('start'),gl=document.getElementById('goal');st.value='';st.dispatchEvent(new Event('change'));gl.value=String(b);gl.dispatchEvent(new Event('change'));st.value=String(a);st.dispatchEvent(new Event('change'));
     const r=MyTown.snapshot().route;if(!r)throw Error(`missing ${a},${b}`);const s={x:2*(a%4)+1,y:2*Math.floor(a/4)},g={x:2*(b%4)+1,y:2*Math.floor(b/4)};
     if(JSON.stringify(r.path[0])!==JSON.stringify(s)||JSON.stringify(r.path.at(-1))!==JSON.stringify(g))throw Error('endpoint mismatch');
     if(r.path.length-1!==independentDistance(s,g))throw Error('not shortest');
     let pos=s,heading=r.initial,traversed=0;
     for(const step of r.steps){if(step.type==='move'){if(step.nodes.length<2)throw Error('zero move');for(const n of step.nodes.slice(1)){const [dx,dy]=dirs[heading];if(n.x-pos.x!==dx||n.y-pos.y!==dy||(n.x%2&&n.y%2))throw Error('movement mismatch');pos=n;traversed++;}}
       if(step.type==='turn'){const [x,y]=dirs[heading],[u,v]=dirs[step.dir],cross=x*v-y*u;const expected=cross>0?'Turn right.':cross<0?'Turn left.':'Turn around.';if(step.text!==expected)throw Error('turn mismatch');heading=step.dir;if(cross>0)right++;else left++;}}
     if(traversed!==r.path.length-1)throw Error('step coverage');const [hx,hy]=dirs[heading];const cross=hx*1-hy*0;const side=cross>0?'right':'left';if(!r.steps.at(-1).text.endsWith(`on your ${side}.`))throw Error('arrival side');count++;
   }return {count,left,right};
 });assert.equal(allPairs.count,240);assert(allPairs.left>0&&allPairs.right>0);checks+=240;
 // Every selectable vocabulary item must use the reviewed label in both sentences.
 const english=await p.evaluate(()=>{
   const expected={'public-hall':'community center','music-hall':'concert hall','hamburger-shop':'burger restaurant',station:'train station'};
   for(const [id,name] of Object.entries(expected))if(TOWN_PLACES.find(p=>p.id===id).name!==name)throw Error('US vocabulary label');
   let verified=0;
   for(const place of TOWN_PLACES.filter(p=>p.canNavigate)){
     document.getElementById('edit-tab').click();document.querySelector(`[data-id="${place.id}"]`).click();document.querySelectorAll('.plot')[0].click();document.querySelectorAll('.plot')[1].click();document.getElementById('route-tab').click();
     const st=document.getElementById('start'),gl=document.getElementById('goal');st.value='';st.dispatchEvent(new Event('change'));gl.value='1';gl.dispatchEvent(new Event('change'));st.value='0';st.dispatchEvent(new Event('change'));
     const route=MyTown.snapshot().route;if(route.steps[0].text!==`Start at the ${place.name}.`)throw Error('start wording');if(!new RegExp(`^The ${place.name} is on your (left|right)\\.$`).test(route.steps.at(-1).text))throw Error('arrival wording');verified++;
   }
   return {verified};
 });assert.equal(english.verified,38);
 await p.locator('#edit-tab').click();await p.locator('#search').fill('public hall');assert.equal(await p.locator('[data-id="public-hall"]').isVisible(),true);assert.match(await p.locator('[data-id="public-hall"]').innerText(),/community center/);
 const legacy={...sample,plots:['street','town','public-hall','station',...Array(12).fill(null)],start:0,goal:1};await p.evaluate(data=>localStorage.setItem('my-town-v1',JSON.stringify(data)),legacy);await p.reload();const migrated=await p.evaluate(()=>MyTown.snapshot().state);assert.equal(migrated.start,null);assert.equal(migrated.goal,null);assert.deepEqual(migrated.plots,legacy.plots);
 await p.locator('#route-tab').click();assert.equal(await p.locator('#start option').count(),3);assert.match(await p.locator('#start').innerText(),/community center/);assert.match(await p.locator('#start').innerText(),/train station/);assert.equal(await p.locator('#start option[value="0"]').count(),0);assert.equal(await p.locator('#start option[value="1"]').count(),0);checks+=english.verified+4;
 await p.evaluate(data=>localStorage.setItem('my-town-v1',JSON.stringify(data)),sample);await p.reload();
 // Native keyboard placement, undo, duplicate destination prevention.
 await p.locator('[data-id="library"]').focus();await p.keyboard.press('Enter');await p.locator('.plot').nth(2).focus();await p.keyboard.press('Enter');assert.equal((await p.evaluate(()=>MyTown.snapshot())).state.plots[2],'library');
 await p.locator('#undo').click();assert.equal((await p.evaluate(()=>MyTown.snapshot())).state.plots[2],null);
 await p.locator('#route-tab').click();await p.locator('#goal').selectOption('0');assert.equal(await p.locator('#goal').inputValue(),'15');checks+=3;
 // One-by-one model does not expose the full answer before use.
 assert.equal(await p.locator('#directions li').count(),0);await p.locator('#speed').selectOption('0');await p.locator('#next').click();await p.waitForFunction(()=>!MyTown.snapshot().busy);assert.equal(await p.locator('#directions li').count(),1);
 while(!(await p.locator('#next').isDisabled())){await p.locator('#next').click();await p.waitForFunction(()=>!MyTown.snapshot().busy);}
 assert.deepEqual((await p.evaluate(()=>MyTown.snapshot())).current,{x:7,y:6});await p.screenshot({path:path.join(out,'desktop-guide.png'),fullPage:true});checks+=3;
 // Stop while walking and rapid mode changes must cancel pending writes.
 await p.locator('#speed').selectOption('900');await p.locator('#play').click();await p.waitForFunction(()=>MyTown.snapshot().index>=1);await p.waitForTimeout(200);await p.locator('#stop').click();const stopped=await p.evaluate(()=>MyTown.snapshot());await p.waitForTimeout(1100);const later=await p.evaluate(()=>MyTown.snapshot());assert.equal(later.busy,false);assert.equal(later.index,0);assert.deepEqual(later.current,stopped.current);
 await p.locator('#play').click();await p.locator('#edit-tab').click();await p.waitForTimeout(1000);assert.equal((await p.evaluate(()=>MyTown.snapshot())).stage,'edit');assert.equal(await p.locator('#character').isHidden(),true);assert.equal(await p.locator('#town-name').getAttribute('readonly'),null);checks+=3;
 // Import validation and safe text titles, round trip and download.
 await p.locator('#import').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{bad')});await p.waitForFunction(()=>document.getElementById('status').textContent.includes('読み取れません'));assert.equal((await p.evaluate(()=>MyTown.snapshot())).state.title,'QA Town');
 const imported={...sample,title:'<img src=x onerror=alert(1)>'};await p.locator('#import').setInputFiles({name:'town.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))});await p.locator('#replace-confirm').click();await p.waitForFunction(()=>MyTown.snapshot().state.title.startsWith('<img'));await p.reload();assert.equal(await p.locator('#town-name').inputValue(),imported.title);
 const downloadPromise=p.waitForEvent('download');await p.locator('#export').click();const download=await downloadPromise;const downloaded=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.deepEqual(downloaded,imported);checks+=3;
 await p.locator('#sample').click();await p.locator('button[value=cancel]').click();assert.equal((await p.evaluate(()=>MyTown.snapshot())).state.title,imported.title);
 await p.locator('#clear').click();await p.locator('#replace-confirm').click();await p.waitForFunction(()=>MyTown.snapshot().state.plots.every(x=>x===null));await p.locator('#undo').click();assert.deepEqual((await p.evaluate(()=>MyTown.snapshot())).state,imported);checks+=2;
 // All assets must actually decode; count both ordinary pictures and sprite frames.
 const assets=await p.evaluate(async()=>{const paths=TOWN_PLACES.map(p=>`assets/places/${p.id}.webp`);for(const dir of ['south','west','east','north'])for(let f=0;f<4;f++)paths.push(`assets/character/${dir}-${f}.webp`);paths.push('assets/character/walk-sheet.png');for(const src of paths){const im=new Image();im.src=src;await im.decode();if(!im.naturalWidth)throw Error(src);}return paths.length;});assert.equal(assets,57);checks+=57;
 await p.locator('#town-name').fill('Our Town');await p.locator('#town-name').blur();
 const viewports=[[1366,900],[1024,768],[768,1024],[390,844],[320,640],[1366,600]];
 for(const [width,height] of viewports){await p.setViewportSize({width,height});await p.locator('#edit-tab').click();assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await p.locator('.plot').count(),16);assert.equal(await p.locator('.place-name').evaluateAll(els=>els.some(e=>e.scrollWidth>e.clientWidth+1)),false);await p.screenshot({path:path.join(out,`editor-${width}x${height}.png`),fullPage:true});checks++;}
 await p.setViewportSize({width:1366,height:900});await p.evaluate(()=>document.body.style.zoom='2');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await p.locator('.place-name').evaluateAll(els=>els.some(e=>e.scrollWidth>e.clientWidth+1)),false);await p.screenshot({path:path.join(out,'zoom-200.png'),fullPage:true});await p.evaluate(()=>document.body.style.zoom='1');checks++;
 // Storage unavailable and a speech engine that never emits callbacks.
 const broken=await browser.newPage();await broken.addInitScript(()=>{Storage.prototype.setItem=function(){throw Error('denied');};Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel(){},speak(){}}});});
 await broken.goto(base+'/my-town/');await broken.locator('#sample').click();await broken.locator('#replace-confirm').click();await broken.waitForFunction(()=>MyTown.snapshot().state.start===0);assert.match(await broken.locator('#save-state').innerText(),/自動保存できません/);await broken.locator('#route-tab').click();assert.equal(await broken.locator('#sound').getAttribute('aria-pressed'),'true');await broken.locator('#next').click();await broken.locator('#stop').click();await broken.waitForTimeout(100);assert.equal((await broken.evaluate(()=>MyTown.snapshot())).busy,false);
 await broken.locator('#next').click();await broken.waitForFunction(()=>!MyTown.snapshot().busy,{},{timeout:14000});assert.match(await broken.locator('#speech-note').innerText(),/待たず/);await broken.close();checks+=3;
 assert.deepEqual(errors,[]);const result={checks,allPairs,english,assets,viewports,original};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));console.log('PASS',JSON.stringify(result));
}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
