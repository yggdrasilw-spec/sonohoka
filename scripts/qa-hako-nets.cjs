const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const G=require('../hako_shape_review_app_package/hako-net-geometry.js');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.record_73-76','nets');
function canonical(points){const forms=[];for(let flip=0;flip<2;flip++)for(let r=0;r<4;r++){let ps=points.map(([x,y])=>[flip?-x:x,y]);for(let i=0;i<r;i++)ps=ps.map(([x,y])=>[-y,x]);const minX=Math.min(...ps.map(p=>p[0])),minY=Math.min(...ps.map(p=>p[1]));forms.push(ps.map(([x,y])=>[x-minX,y-minY]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).map(p=>p.join(',')).join(';'))}return forms.sort()[0]}
let shapes=new Map([['0,0',[[0,0]]]]);
for(let n=2;n<=6;n++){const next=new Map();for(const shape of shapes.values())for(const [x,y]of shape)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const p=[x+dx,y+dy];if(shape.some(q=>q[0]===p[0]&&q[1]===p[1]))continue;const grown=[...shape,p],key=canonical(grown);next.set(key,grown)}shapes=next}
assert.equal(shapes.size,35,'All 35 free hexominoes');let valid=0;
for(const ps of shapes.values()){const faces=G.faces([1,1,1]).map((f,i)=>({...f,x:ps[i][0],y:ps[i][1]}));if(G.check(faces,[1,1,1]).ok)valid++}
assert.equal(valid,11,'Exactly the 11 cube nets must fold');
// The floor stays still; every moving face remains attached to its hinge.
for(const dims of [[6,4,3],[4,4,4],[7,2,5]]){
 const faces=G.example(dims),root=faces.findIndex(f=>f.id==='bottom'),options={root,sequential:true,floor:true};
 const base=G.folded(faces,0,options).frames[root];
 for(let step=0;step<=100;step++){
  const fold=G.folded(faces,step/100,options);assert.deepEqual(fold.frames[root],base);
  fold.parents.forEach((p,i)=>{if(!p)return;const a=G.corners(faces[p.from],fold.frames[p.from]),b=G.corners(faces[i],fold.frames[i]);
   const edges={E:[[a[1],a[2]],[b[0],b[3]]],W:[[a[0],a[3]],[b[1],b[2]]],S:[[a[3],a[2]],[b[0],b[1]]],N:[[a[0],a[1]],[b[3],b[2]]]};
   const [ae,be]=edges[p.dir];ae.forEach((v,j)=>v.forEach((n,k)=>assert(Math.abs(n-be[j][k])<1e-6,'Hinge edges stay together')));
  });
 }
 assert.equal(G.folded(faces,1,options).cycle,false);
 const first=G.folded(faces,.1,options);first.order.slice(1).forEach(i=>assert.deepEqual(first.frames[i].n,first.frames[first.parents[i].from].n,'Later hinges wait their turn'));
}
for(let w=1;w<=8;w++)for(let h=1;h<=8;h++)for(let d=1;d<=8;d++){
 const dims=[w,h,d],faces=G.example(dims);assert(G.check(faces,dims).ok);assert(G.check(faces.map(f=>({...f,x:-f.y-f.h,y:f.x,turn:1})),dims).ok);assert(G.check(faces.map(f=>({...f,x:-f.x-f.w})),dims).ok);
 const flat=G.folded(faces,0);flat.frames.forEach((f,i)=>{assert(Math.abs(f.o[0]-(faces[i].x-faces[0].x))<1e-6);assert(Math.abs(f.o[1]-(faces[i].y-faces[0].y))<1e-6);assert(Math.abs(f.o[2])<1e-6)});
}
const overlapping=G.example([6,4,3]);overlapping[1].x=0;overlapping[1].y=0;assert.match(G.check(overlapping,[6,4,3]).message,/重な/);
const partial=G.example([6,4,3]);partial[3].y=1;assert.match(G.check(partial,[6,4,3]).message,/辺/);
const disconnected=G.example([6,4,3]);disconnected[1].x=40;assert.match(G.check(disconnected,[6,4,3]).message,/はなれ/);
(async()=>{
 await fs.mkdir(out,{recursive:true});const server=require('node:http').createServer(async(req,res)=>{try{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]));res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file))}catch{res.statusCode=404;res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url())});
 await page.goto('http://127.0.0.1:'+server.address().port+'/hako_shape_review_app_package/hako_shape_review_app.html');
 await page.locator('[data-start="learn"]').click();for(let i=0;i<4;i++)await page.locator('#nextBtn').click();assert.equal(await page.locator('[data-flat-face]').count(),6);await page.screenshot({path:path.join(out,'lesson-six-faces.png')});
 await page.keyboard.press('Escape');await page.locator('[data-open-nets]').click();assert(await page.locator('#netWorkshop').isVisible());
 await page.locator('[data-net-mode="faces"]').click();assert.equal(await page.locator('#netBoard [data-flat-face]').count(),6);await page.screenshot({path:path.join(out,'six-faces.png')});
 await page.locator('[data-net-mode="net"]').click();await page.locator('#netAssemble').click();assert.match(await page.locator('#netMessage').innerText(),/はなれ/);
 await page.locator('#netExample').click();const basePoints=await page.locator('#netPreview [data-fixed-base] polygon').getAttribute('points');
 for(const value of [0,20,40,60,80,100]){await page.locator('#netFold').evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))},value);assert.equal(await page.locator('#netPreview [data-fixed-base] polygon').getAttribute('points'),basePoints,'Bottom face stays fixed on screen');await page.locator('#netPreview').screenshot({path:path.join(out,`fold-step-${value}.png`)})}
 await page.locator('#netAssemble').click();assert.equal(await page.locator('#netMessage').getAttribute('data-result'),'ok');await page.waitForTimeout(5100);assert.equal(await page.evaluate(()=>HakoNets.getState().progress),1);assert.equal(await page.locator('#netPreview [data-fixed-base] polygon').getAttribute('points'),basePoints);await page.screenshot({path:path.join(out,'folded.png')});
 // Exercise actual drag and pointer capture without editing runtime state.
 const polygon=page.locator('#netBoard [data-face="back"] rect');const start=await polygon.boundingBox(),before=await page.evaluate(()=>HakoNets.getState().faces.find(f=>f.id==='back'));
 await page.mouse.move(start.x+start.width/2,start.y+start.height/2);await page.mouse.down();await page.mouse.move(start.x+start.width/2+70,start.y+start.height/2+45,{steps:8});await page.mouse.up();const moved=await page.evaluate(()=>HakoNets.getState().faces.find(f=>f.id==='back'));assert(moved.x!==before.x||moved.y!==before.y);assert.equal(await page.evaluate(()=>HakoNets.getState().progress),0);
 await page.locator('#netUndo').click();assert(await page.evaluate(()=>HakoNets.check().ok));
 await page.locator('#netSelected').selectOption('back');await page.locator('#netAnchor').selectOption('front');await page.locator('#netSide').selectOption('E');await page.locator('#netAttach').click();await page.locator('#netAssemble').click();assert.equal(await page.locator('#netMessage').getAttribute('data-result'),'ng');assert.match(await page.locator('#netMessage').innerText(),/重な/);
 await page.locator('#netExample').click();await page.locator('#netSelected').selectOption('back');await page.locator('#netRotate').click();await page.locator('#netAssemble').click();assert.equal(await page.locator('#netMessage').getAttribute('data-result'),'ng');
 await page.locator('#netPreset').selectOption('cube');await page.locator('#netExample').click();assert(await page.evaluate(()=>HakoNets.check().ok));
 // Six rectangles in one straight row are connected but cannot form a cube.
 await page.locator('#netSeparate').click();for(const [face,anchor]of [['back','front'],['left','back'],['right','left'],['top','right'],['bottom','top']]){await page.locator('#netSelected').selectOption(face);await page.locator('#netAnchor').selectOption(anchor);await page.locator('#netSide').selectOption('E');await page.locator('#netAttach').click()}
 await page.locator('#netAssemble').click();assert.match(await page.locator('#netMessage').innerText(),/重な/);await page.waitForTimeout(5100);await page.screenshot({path:path.join(out,'invalid-row.png')});
 await page.locator('#netPreset').selectOption('flat');await page.locator('#netExample').click();assert(await page.evaluate(()=>HakoNets.check().ok));
 await page.locator('#netSelected').selectOption('right');await page.locator('#netAnchor').selectOption('front');await page.locator('#netSide').selectOption('N');await page.locator('#netAttach').click();assert.match(await page.locator('#netMessage').innerText(),/辺の長さ/);
 await page.locator('#netExample').click();await page.locator('#netBoard').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>HakoNets.getState().faces[0].x),1);await page.locator('#netUndo').click();assert(await page.evaluate(()=>HakoNets.check().ok));
 await page.setViewportSize({width:390,height:844});await page.locator('[data-net-mode="faces"]').click();await page.screenshot({path:path.join(out,'mobile-faces.png')});assert.equal(await page.evaluate(()=>document.querySelector('#netWorkshop').scrollWidth>document.querySelector('#netWorkshop').clientWidth),false);
 await page.locator('#netClose').click();assert(!await page.locator('#netWorkshop').isVisible());assert.equal(errors.length,0,errors.join('\n'));console.log('PASS: 11 of 35 cube nets; 512 dimension sets and rotations/reflections; six-face lesson; drag, attach, rotate, undo; valid/invalid folding; mobile dialog');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
