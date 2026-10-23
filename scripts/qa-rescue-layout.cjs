const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');const {serve}=require('./portfolio-demo-inspect.cjs');
(async()=>{const s=serve();await new Promise(r=>s.listen(0,'127.0.0.1',r));const b=await chromium.launch({channel:'msedge',headless:true});const errors=[];let samples=0;
 try{const p=await b.newPage();p.on('pageerror',e=>errors.push(e.message));const url=`http://127.0.0.1:${s.address().port}/sonohoka/kakezan_rescue.html`;
  for(const [width,height]of [[1366,768],[1280,720],[1180,640],[1024,600],[1024,552],[960,540],[854,480]]){
   await p.setViewportSize({width,height});await p.goto(url);await p.locator('#sound').click();await p.locator('#sfx').click();
   const result=await p.evaluate(async()=>{
    const $=id=>document.getElementById(id),failures=[],selectors=['#lesson','.guide','.bubble','#description','#listen','.diagram-frame','#board','.math','#equation','.transport','#reset','#play','#next','.slow','nav','#strategies','.problem','#topAnswer'];let frames=0;
    const rect=e=>{if(e.id==='topAnswer')return [e.offsetLeft,e.offsetTop,e.offsetWidth,e.offsetHeight];const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]};
    function visibleBounds(label){if(document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth)failures.push({label,error:'document overflow',h:document.documentElement.scrollHeight,H:innerHeight});for(const sel of ['header','.problem',document.body.classList.contains('choosing')?'#rescueIntro':'#lesson','#strategies']){const r=document.querySelector(sel).getBoundingClientRect();if(r.top<-.5||r.bottom>innerHeight+.5)failures.push({label,sel,error:'off screen',rect:rect(document.querySelector(sel))})}}
    visibleBounds('question');
    for(const mode of [0,1,2,3,4]){
     document.querySelector(`[data-mode="${mode}"]`).click();await new Promise(r=>setTimeout(r,500));
     const original=selectors.map(sel=>rect(document.querySelector(sel))),bubble=$('description').getBoundingClientRect();
     function stable(label){visibleBounds(label);selectors.forEach((sel,i)=>{const actual=rect(document.querySelector(sel));if(actual.some((n,k)=>Math.abs(n-original[i][k])>.2))failures.push({mode,label,sel,error:'layout shift',original:original[i],actual})});const d=$('description');if(d.scrollHeight>d.clientHeight+1)failures.push({mode,label,error:'description clipped',height:d.clientHeight,scroll:d.scrollHeight});const e=$('equation');if(e.scrollHeight>e.clientHeight+1||e.scrollWidth>e.clientWidth+1)failures.push({mode,label,error:'equation clipped'});frames++}
     stable('before');$('play').click();for(let i=0;i<36;i++){await new Promise(requestAnimationFrame);stable('animation-'+i)}await new Promise(r=>setTimeout(r,700));stable('after');for(let i=0;i<40;i++){await new Promise(requestAnimationFrame);stable('answer-popup-'+i)}
     if(mode===4){for(let i=0;i<7;i++)$('play').click();await new Promise(r=>setTimeout(r,1200));stable('count-complete')}
     const slow=document.querySelector('.slow');slow.open=true;stable('slider-open');slow.open=false;stable('slider-close');
     if(mode===3){$('splitA').click();await new Promise(r=>setTimeout(r,100));const now=selectors.map(sel=>rect(document.querySelector(sel)));for(let i=0;i<now.length;i++)if(now[i].some((n,k)=>Math.abs(n-original[i][k])>.2))failures.push({mode,error:'axis changed layout',sel:selectors[i]})}
    }
    // Longest text and two-digit answers, all 81 facts, at start/middle/end.
    for(let a=1;a<=9;a++)for(let b=1;b<=9;b++){$('a').value=a;$('b').value=b;$('a').dispatchEvent(new Event('change'));for(let mode=0;mode<5;mode++){const button=document.querySelector(`[data-mode="${mode}"]`);if(button.disabled)continue;button.click();const baseline=selectors.map(sel=>rect(document.querySelector(sel)));for(const value of [0,500,1000]){$('progress').value=value;$('progress').dispatchEvent(new Event('input'));visibleBounds('all-facts');selectors.forEach((sel,i)=>{const current=rect(document.querySelector(sel));if(current.some((n,k)=>Math.abs(n-baseline[i][k])>.2))failures.push({a,b,mode,value,sel,error:'fact layout shift'})});if($('description').scrollHeight>$('description').clientHeight+1)failures.push({a,b,mode,value,error:'long text clipped'});frames++}}}
    return {frames,failures};
   });assert.deepEqual(result.failures,[],`${width}x${height}`);samples+=result.frames;await p.locator('[data-mode="3"]').click();await p.waitForTimeout(650);await p.screenshot({path:`.portfolio-work/rescue-fixed-${width}-${height}.png`});console.log('LAYOUT PASS',width,height,result.frames);
  }
  assert.deepEqual(errors,[]);fs.writeFileSync('.portfolio-work/rescue-layout-results.json',JSON.stringify({samples,viewports:7,errors},null,2));console.log('PASS fixed layout',samples);
 }finally{await b.close();s.close()}})().catch(e=>{console.error(e);process.exit(1)});
