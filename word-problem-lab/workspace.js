/* Reading marks and a local, touch-friendly drawing workspace. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),E=WordProblemEngine;
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  let records={},current,record,pending=null,tool='circle';
  try{records=JSON.parse(localStorage.getItem('word-problem-workspace-v1')||'{}')||{};}catch{}
  if(typeof records!=='object'||Array.isArray(records))records={};
  function persist(){try{localStorage.setItem('word-problem-workspace-v1',JSON.stringify(records));$('workspaceStatus').textContent='印と図を このブラウザに保存しました。';}catch{$('workspaceStatus').textContent='保存できません。この画面では使えます。';}}
  const panel=el('section',undefined,'card drawingWorkspace');panel.id='drawingWorkspace';
  panel.innerHTML='<div class="sectionLabel">このお話を 図にしよう</div><p id="drawingGuide"></p><button id="openLocalDiagram" type="button" aria-expanded="false">このお話を 図にする</button><div id="localDiagram" hidden><p>道具をえらんで、白いところを押そう。矢印・線・テープは、始めと終わりを順に押すよ。</p><div id="drawingTools" class="drawingTools"></div><label>図に書くことば・数 <input id="drawingLabel" maxlength="36" placeholder="はじめ・もらった・□ など"></label><div id="drawingCanvas"></div><button id="undoDrawing" type="button">一つ もどす</button><p id="drawingStatus" role="status"></p></div><p id="workspaceStatus" class="tiny" role="status"></p>';
  document.querySelector('.support').before(panel);
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 720 360');svg.setAttribute('role','img');svg.setAttribute('aria-label','自分の図。下のボタンからも記号を追加できます。');
  $('drawingCanvas').append(svg);
  function node(tag,attrs){const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n;}
  const tools=[['circle','○'],['cross','消すしるし ×'],['arrow','矢印 →'],['line','線'],['tape','テープ'],['text','ことば・数']];
  tools.forEach(([id,title])=>{const b=el('button',title);b.type='button';b.dataset.tool=id;b.addEventListener('click',()=>{tool=id;pending=null;paint();});$('drawingTools').append(b);});
  function paint(){
    svg.replaceChildren();
    const defs=node('defs',{}),marker=node('marker',{id:'workspaceArrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'});marker.append(node('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'#236553'}));defs.append(marker);svg.append(defs);
    for(const item of record?.shapes||[]){
      const {x,y,x2,y2}=item;let n;
      if(item.tool==='circle')n=node('circle',{cx:x,cy:y,r:15,fill:'#eff6f2',stroke:'#236553','stroke-width':3});
      else if(item.tool==='text'){n=node('text',{x,y,fill:'#263b36','font-size':22});n.textContent=item.text;}
      else if(item.tool==='cross')n=node('path',{d:`M${x-12} ${y-12}l24 24m0 -24l-24 24`,stroke:'#a64c32','stroke-width':3});
      else if(item.tool==='tape')n=node('rect',{x:Math.min(x,x2),y:Math.min(y,y2),width:Math.max(12,Math.abs(x2-x)),height:Math.max(24,Math.abs(y2-y)),fill:'#fff0cf',stroke:'#ad7940','stroke-width':3});
      else n=node('line',{x1:x,y1:y,x2,y2,stroke:'#236553','stroke-width':3,...(item.tool==='arrow'?{'marker-end':'url(#workspaceArrow)'}:{})});
      svg.append(n);
    }
    if(pending)svg.append(node('circle',{cx:pending.x,cy:pending.y,r:6,fill:'#c67820'}));
    $('drawingTools').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tool===tool));
    $('undoDrawing').disabled=!record?.shapes.length;
  }
  function place(x,y){
    if(record.shapes.length>=200){$('drawingStatus').textContent='図がいっぱいです。一つもどしてから書こう。';return;}
    if(['arrow','line','tape'].includes(tool)&&!pending){pending={x,y};$('drawingStatus').textContent='終わりの場所を押そう。';paint();return;}
    if(tool==='text'&&!$('drawingLabel').value.trim()){$('drawingStatus').textContent='先に、書きたいことばや数を入力しよう。';return;}
    record.shapes.push({tool,...(pending||{x,y}),x2:x,y2:y,text:$('drawingLabel').value.trim()});pending=null;paint();persist();$('drawingStatus').textContent='図に書き残したよ。○一つが何を表すか、ことばも書こう。';
  }
  svg.addEventListener('pointerdown',event=>{const r=svg.getBoundingClientRect();place(Math.max(18,Math.min(702,(event.clientX-r.left)*720/r.width)),Math.max(24,Math.min(336,(event.clientY-r.top)*360/r.height)));});
  // Keyboard users can place symbols in a grid without pointer coordinates.
  const keyboard=el('button','えらんだ記号を 次の場所に置く');keyboard.type='button';keyboard.addEventListener('click',()=>{const i=record.shapes.length;place(35+(i%12)*55,45+Math.floor(i/12)%5*60);});$('drawingCanvas').after(keyboard);
  $('undoDrawing').addEventListener('click',()=>{if(pending)pending=null;else record.shapes.pop();paint();persist();});
  $('openLocalDiagram').addEventListener('click',()=>{$('localDiagram').hidden=!$('localDiagram').hidden;$('openLocalDiagram').setAttribute('aria-expanded',!$('localDiagram').hidden);});
  function read(m){
    current=m;const id=JSON.stringify([m.id,m.story,m.question]);
    record=records[id];if(!record||!Array.isArray(record.marks)||!Array.isArray(record.shapes))record=records[id]={marks:[],underline:false,shapes:[]};
    let i=0;$('storyLines').replaceChildren();
    const source=m.story.join(' '),parts=source.split(/(\d+(?:\.\d+)?(?:\/\d+)?)/g);
    parts.forEach((part,index)=>{if(index%2===0){$('storyLines').append(document.createTextNode(part));return;}const at=i++,b=el('button',part,'readingNumber');b.type='button';b.setAttribute('aria-label',part+'に○をつける');b.setAttribute('aria-pressed',record.marks.includes(at));b.addEventListener('click',()=>{record.marks.includes(at)?record.marks=record.marks.filter(n=>n!==at):record.marks.push(at);b.setAttribute('aria-pressed',record.marks.includes(at));$('readingFeedback').textContent='';persist();});$('storyLines').append(b);});
    const question=el('button',m.question,'readingQuestion');question.type='button';question.setAttribute('aria-label','聞かれていることに傍線：'+m.question);question.setAttribute('aria-pressed',!!record.underline);question.addEventListener('click',()=>{record.underline=!record.underline;question.setAttribute('aria-pressed',record.underline);$('readingFeedback').textContent='';persist();});$('question').replaceChildren(question);
    $('readingFeedback').textContent='';$('drawingLabel').value='';$('drawingStatus').textContent='';$('workspaceStatus').textContent='';pending=null;tool=m.stage===0?'circle':'text';$('localDiagram').hidden=true;$('openLocalDiagram').setAttribute('aria-expanded','false');
    $('drawingGuide').textContent=m.stage===0?'○一つを一つのものとして描こう。ふえる・へる動きを矢印や×で残し、くらべるときは○を一つずつ組にしよう。':'このお話に合う図を使おう。同じ一つ分は囲みやテープ、長さ・割合は線やテープで表し、数と名前も書こう。手がかりの図も参考にできるよ。';paint();
  }
  $('clearReading').addEventListener('click',()=>{record.marks=[];record.underline=false;persist();read(current);});
  $('checkReading').addEventListener('click',()=>{const count=$('storyLines').querySelectorAll('button').length,marked=record.marks.length;$('readingFeedback').textContent=marked===count&&record.underline?'数字に○、聞かれていることに傍線を付けたね。○の数は何の量か、単位も読んでみよう。':!record.underline?'聞かれている文に、傍線を引こう。':`問題文の数字を見直そう。○を付けた数字は ${marked} / ${count} こ。` ;});
  window.WordProblemWorkspace={read,clear(){records={};try{localStorage.removeItem('word-problem-workspace-v1');}catch{}}};
})();
