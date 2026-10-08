// Every task starts with a situation, then a complete question, then tools for solving.
function presentationFacts(t, lesson=null) {
  if(lesson===1)return `長さ${t.b}cmの土台に、長さ${t.a}cmのブロックを1個ずつつなぎます。`;
  if(lesson===17)return '水そうAには初めに1L、Bには4Lの水があります。Aには毎分2L、Bには毎分1Lずつ、同時に水を注ぎます。';
  if(t.figure)return '横4cm・縦3cmの長方形です。点PはBからC、CからDへ、毎秒1cmで進みます。';
  return (t.story||'').replace(/xは[^。]*。?/g,'').replace(/xは[^。]*$/g,'').trim();
}
function presentationDiagram(t,lesson,step) {
  if(lesson===1)return linearScene(t,1,0,{exploreX:Math.max(0,step)}).replace('viewBox="0 0 680 155"',`viewBox="0 0 ${Math.max(440,70+42*(t.b+3*t.a))} 155"`).replace(/全体の長さ y＝[^<]+/,'全体の長さ').replace(/x：ブロックの数[^<]+/,'');
  if(lesson===17)return linearScene(t,17,0,{sceneTime:Math.min(step,2)});
  if(t.figure)return taskFigure([0,1,3,5][step]);
  if(t.model)return `<img src="linear-lab-assets/warming-water.webp" width="360" height="250" alt="時計と温度計で水を温めた時間と温度を測る">`;
  if(lesson===null){
    // Observed records are the only quantities available in inference problems.
    const x=t.observations?t.observations[Math.min(step,t.observations.length-1)][0]:(t.min??0)+Math.min(step,2);
    const saved=wordState.x;wordState.x=x;
    const picture=wordPicture(t,!t.observations).replace(/x＝/g,`${t.xLabel}：`);
    wordState.x=saved;return picture;
  }
  const points=t.givenPoints||t.data||(t.customTable?t.customTable.xs.map((x,i)=>[x,t.customTable.ys[i]]):t.tableXs?.map(x=>[x,t.a*x+t.b]));
  if(points?.length){const [x,y]=points[Math.min(step,points.length-1)];return `<div class="introRecord"><span>横の値：${num(x)}</span><b>→</b><span>縦の値：${num(y)}</span></div>`;}
  if(t.hideFormula&&t.line)return lessonGraph(t).replace('id="lessonGraph"','id="introGraph"');
  const formula=t.formula||(!t.hideFormula&&t.a!==undefined?shortFormula(t.a,t.b):'');
  return `<div class="introRecord"><span>${formula||'横の値と縦の値を、組にして調べます。'}${t.a2!==undefined?'<br>'+shortFormula(t.a2,t.b2):''}</span></div>`;
}
function presentationSteps(t,lesson){
  if(lesson===1)return [`長さ${t.b}cmの土台があります。`,`長さ${t.a}cmのブロックを、1個つなぎます。`,'同じブロックを、もう1個つなぎます。','つなぐたびに、全体の長さが長くなります。'];
  if(lesson===17)return ['水そうAには1L、Bには4Lの水があります。','同時に注ぎ始めます。Aには毎分2L、Bには毎分1Lずつ入ります。','時間がたつと、どちらの水も増えます。同じ時刻の量を比べます。'];
  if(t.figure)return ['横4cm、縦3cmの長方形です。点PはBから出発します。','点Pは、毎秒1cmでBからCへ進みます。','Cに着いたら、Dへ向かいます。','A・B・Pを結んだ三角形の面積を考えます。'];
  if(t.model)return ['水を同じ火力・水の量で温めます。','時計と温度計で、時間と水温を一緒に記録します。','同じ条件が続く範囲で、水温の変化を考えます。'];
  const facts=presentationFacts(t,lesson);
  if(lesson===null){
    const steps=(facts||t.story).split('。').filter(Boolean).map(s=>s+'。');
    if(t.observations)return steps;
    while(steps.length<3)steps.push(`${t.xLabel}が${steps.length===1?'1'+t.xUnit+'増える':'さらに増える'}と、${t.yLabel}が${t.a<0?'減って':'増えて'}いきます。`);
    return steps;
  }
  if(t.givenPoints?.length)return ['横の値と縦の値を組にすると、図の点を表せます。',`${t.givenPoints.map(p=>'('+p.join(', ')+')').join('、')} の点が与えられています。`];
  if(t.tableXs||t.customTable)return [facts||'横の値に対応する縦の値を、順に記録しています。','同じ組の値を、表や図で表すことができます。'];
  return [facts||'横の値と縦の値の関係を考えます。','この関係を、図や言葉で確かめてから問題に進みます。'];
}
function renderPresentation(t,lesson,state,header,bindHeader,render){
  const steps=presentationSteps(t,lesson),step=state.introStep||0,question=state.phase==='question';
  const facts=presentationFacts(t,lesson);
  const diagram=presentationDiagram(t,lesson,Math.min(step,steps.length-1));
  syllabus.innerHTML=header+`<section class="presentation"><p class="introCount">${question?'② 問いを確かめる':'① お話を見よう　'+(step+1)+' / '+steps.length}</p>${question?`<div id="${lesson===null?'wordPrompt':'lessonPrompt'}"><p class="introFacts">${lesson===null?t.story:facts}</p><p class="introQuestion">${t.prompt}</p></div>`:`<div class="introStage" aria-live="polite">${diagram}</div><p class="introText" id="${lesson===null?'wordPrompt':'lessonPrompt'}" aria-live="polite">${steps[step]}</p>`}<div class="introActions"><button class="courseSecondary" id="introBack" ${!question&&step===0?'disabled':''}>${question?'お話に戻る':'ひとつ前へ'}</button><button class="coursePrimary" id="introNext">${question?'考える画面へ →':step===steps.length-1?'問題を読む →':'続きを見る →'}</button></div></section>`;
  bindHeader();
  document.getElementById('introNext').onclick=()=>{if(question)state.phase='solve';else if(step<steps.length-1)state.introStep=step+1;else state.phase='question';syllabus.scrollTop=0;render();document.getElementById(state.phase==='solve'?(lesson===null?'wordRead':'lessonRead'):'introNext')?.focus();};
  document.getElementById('introBack').onclick=()=>{if(question){state.phase='intro';state.introStep=steps.length-1;}else state.introStep=Math.max(0,step-1);render();document.getElementById('introBack')?.focus();};
}
function bindPresentationReplay(state,render){document.getElementById('problemReplay').onclick=()=>{state.phase='intro';state.introStep=0;render();document.getElementById('introNext')?.focus();};}
