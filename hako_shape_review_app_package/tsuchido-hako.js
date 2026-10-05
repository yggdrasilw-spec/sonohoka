(function(){
 'use strict';
 const data=window.TsuchidoHakoData,dialog=document.createElement('dialog');dialog.id='tsuchidoHako';
 dialog.setAttribute('aria-labelledby','tsuchidoTitle');
 dialog.innerHTML=`<div class="td-shell"><header><h2 id="tsuchidoTitle">はこが できるかな？</h2><button id="tdClose">もどる</button></header>
 <div class="td-options"><label>もんだい <select id="tdSelect"></select></label><label><input id="tdTeacher" type="checkbox"> 先生と かくにん</label></div>
 <p id="tdSource"></p><h3 id="tdQuestion"></h3><svg id="tdDiagram" role="img" aria-label="土堂教材の面の組み合わせ"></svg>
 <div class="td-choices"><button data-td-answer="true">○ できる</button><button data-td-answer="false">× できない</button><button id="tdReveal" hidden>こたえを みる</button></div>
 <p id="tdFeedback" role="status"></p><nav><button id="tdPrev">← まえ</button><button id="tdFold" hidden>折って たしかめる</button><button id="tdNext" disabled>つぎへ →</button></nav>
 <p class="td-note">出典：土堂モジュール教材「○2年 はこの形.pptx」。面の形・色・ならびと○×を取り込みました。</p></div>`;
 document.body.appendChild(dialog);let index=0,answered=false,retries=0,first=0;
 const $=s=>dialog.querySelector(s),choices=[...dialog.querySelectorAll('[data-td-answer]')];
 data.questions.forEach((q,i)=>$('#tdSelect').add(new Option(`${i+1} / 25 ・ ${q.kind==='faces'?'面のくみあわせ':'つなぎかた'}`,i)));
 function points(q){const size=q.faces[0].w,x=Math.min(...q.faces.map(f=>f.x)),y=Math.min(...q.faces.map(f=>f.y));return q.faces.map(f=>[Math.round((f.x-x)/size),Math.round((f.y-y)/size)])}
 function explanation(q){
  if(q.kind==='net'){if(q.faces.length!==6)return `面は6まい いるよ。この図は${q.faces.length}まい。全部使うと多すぎるね。`;const faces=window.HakoNetGeometry.faces([1,1,1]).map((f,i)=>({...f,x:points(q)[i][0],y:points(q)[i][1]}));return window.HakoNetGeometry.check(faces,[1,1,1]).message}
  if(q.faces.length!==6)return `面は6まい いるよ。この図は${q.faces.length}まいです。${q.faces.length<6?'面が足りないね。':'全部使うと、面が多すぎるね。'}`;
  if(q.answer)return '6まいの面を、辺の長さを合わせてつなぐと、はこができます。';
  return q.slide===5?'赤い面が3まい、緑の面が1まい。同じ形を2まいずつにできず、向かい合う面がそろわないね。':'6まいの形・大きさがばらばら。同じ形の面の組や、同じ長さの辺がそろわないね。';
 }
 function render(){const q=data.questions[index];answered=false;retries=0;$('#tdSelect').value=index;
  $('#tdSource').textContent=`土堂の問題 ${index+1} / 25 ・ 元スライド ${q.slide}`;
  $('#tdQuestion').textContent=q.kind==='faces'?'この面を ぜんぶ使って、はこが できるかな？':'この つなぎかたで 折ると、はこが できるかな？';
  const minX=Math.min(...q.faces.map(f=>f.x)),minY=Math.min(...q.faces.map(f=>f.y)),maxX=Math.max(...q.faces.map(f=>f.x+f.w)),maxY=Math.max(...q.faces.map(f=>f.y+f.h)),u=100000;
  $('#tdDiagram').setAttribute('viewBox',`${minX/u-3} ${minY/u-3} ${(maxX-minX)/u+6} ${(maxY-minY)/u+6}`);
  $('#tdDiagram').innerHTML=q.faces.map(f=>`<rect x="${f.x/u}" y="${f.y/u}" width="${f.w/u}" height="${f.h/u}" fill="${f.color}" stroke="#fff" stroke-width=".7"/>`).join('');
  $('#tdFeedback').textContent='まず、予想してみよう。';$('#tdFeedback').dataset.result='';$('#tdNext').disabled=true;$('#tdNext').textContent=index===24?'まとめを見る':'つぎへ →';$('#tdPrev').disabled=index===0;$('#tdFold').hidden=true;
  choices.forEach(b=>{b.disabled=false;b.hidden=$('#tdTeacher').checked});$('#tdReveal').hidden=!$('#tdTeacher').checked;
 }
 function correct(){const q=data.questions[index];answered=true;choices.forEach(b=>b.disabled=true);$('#tdFeedback').dataset.result='ok';$('#tdFeedback').textContent=`${q.answer?'○ できる！':'× できない。'} ${explanation(q)}`;$('#tdNext').disabled=false;$('#tdFold').hidden=q.kind!=='net'&&!q.answer;$('#tdFold').textContent=q.kind==='net'?'折って たしかめる':'面を くみあわせる'}
 choices.forEach(b=>b.onclick=()=>{if(answered)return;if((b.dataset.tdAnswer==='true')===data.questions[index].answer){if(!retries)first++;correct()}else{retries++;$('#tdFeedback').dataset.result='ng';$('#tdFeedback').textContent=data.questions[index].kind==='faces'?'もういちど。面の数と、同じ形の組を見てみよう。':'もういちど。折ったとき、面が重ならないかな？'}});
 $('#tdReveal').onclick=correct;$('#tdTeacher').onchange=render;$('#tdSelect').onchange=e=>{index=+e.target.value;render()};$('#tdPrev').onclick=()=>{index--;render()};
 $('#tdNext').onclick=()=>{if(!answered)return;if(index<24){index++;render()}else{$('#tdFeedback').textContent='25もんの かくにんが おわったよ。6まいの形と、折ったときの重なりを考えよう。';$('#tdNext').disabled=true}};
 $('#tdFold').onclick=()=>{const q=data.questions[index];if(q.kind==='net')window.HakoNets.loadCubeNet(points(q));else window.HakoNets.loadFaceSet(q.faces)};$('#tdClose').onclick=()=>dialog.close();dialog.addEventListener('keydown',e=>e.stopPropagation());
 document.querySelector('[data-open-tsuchido]').onclick=()=>{index=0;first=0;render();dialog.showModal()};
 if(new URLSearchParams(location.search).get('activity')==='tsuchido')document.querySelector('[data-open-tsuchido]').click();
})();
