function lessonLinkX(t,lesson,state){return lesson===1?state.exploreX:lesson===17?(state.sceneTime??0):(state.measureX??t.data?.[0]?.[0]??0);}
function lessonCorrespondence(t,lesson,state){
  if(lesson!==1&&lesson!==17&&!t.model)return '';
  const x=lessonLinkX(t,lesson,state),y=t.a*x+t.b,format=v=>String(Math.round(v*1000)/1000).replace('-','−'),xt=`<span class="linkedX">${format(x)}</span>`;
  const calc=(a,b)=>`${format(a)}×${xt}${b<0?'−':'＋'}${format(Math.abs(b))}`;
  let content;
  if(lesson===1)content=`選んだ列：x＝${xt}個 → ${calc(t.a,t.b)}＝<span class="linkedY">${format(y)}cm</span><small>最初の土台 ${t.b}cm ＋ ブロック${x}個分。グラフでは点 (${x}, ${format(y)})。</small>`;
  else if(lesson===17)content=`選んだ列：x＝${xt}分<br><span class="wordA">A：</span>${calc(t.a,t.b)}＝<span class="wordA">${format(y)}L</span>　<span class="wordB">B：</span>${calc(t.a2,t.b2)}＝<span class="wordB">${format(t.a2*x+t.b2)}L</span><small>同じ時間で比べる。水位・表の列・グラフの点が対応します。</small>`;
  else{
    const measured=t.data?.find(p=>p[0]===x)?.[1],showModel=!t.hideFormula||state.correct;
    content=`選んだ時刻：x＝${xt}分${measured!==undefined?` → 測定 <span class="measurement">${format(measured)}℃</span> → 青い点 (${x}, ${format(measured)})`:''}${showModel?`<br>式で予測：${calc(t.a,t.b)}＝<span class="prediction">約${format(y)}℃</span> → オレンジの点`:''}<small>${showModel?'青は測定値、オレンジは式による予測。2つは少し違うこともある。':'表の列を押して、測定値とグラフの点を見比べよう。'}</small>`;
    if(!t.data)content+=`<div class="sceneControls">${[0,1,2,3,4].map(v=>`<button type="button" data-measure-x="${v}" aria-pressed="${v===x}">${v}分</button>`).join('')}</div>`;
  }
  return `<div class="lessonLink" id="lessonLink">${content}</div>`;
}
function lessonLinkedTable(t,lesson){return taskTable(lesson===1||lesson===17?{...t,tableXs:[0,1,2,3]}:t);}
function bindLessonLinks(t,lesson,state){
  if(lesson!==1&&lesson!==17&&!t.model)return;
  const table=document.querySelector('#lessonLeft .courseTable'),x=lessonLinkX(t,lesson,state);
  const setX=value=>{if(lesson===1)state.exploreX=value;else if(lesson===17)state.sceneTime=value;else state.measureX=value;renderSyllabus();};
  if(table){
    const rows=[...table.rows],xs=[...rows[0].cells].slice(1).map(c=>Number(c.textContent));
    rows.forEach(row=>[...row.cells].slice(1).forEach((cell,i)=>cell.classList.toggle('linkedColumn',xs[i]===x)));
    xs.forEach((value,i)=>{const cell=rows[0].cells[i+1];cell.innerHTML=`<button type="button" id="linked-x-${value}" class="${value===x?'linkedPick':''}" aria-pressed="${value===x}" aria-label="x=${value}の列を選ぶ">${value}</button>`;cell.firstChild.onclick=()=>setX(value);});
    if(lesson===17){rows[1].cells[0].textContent='Aのy（L）';rows[1].classList.add('wordA');rows[2].cells[0].textContent='Bのy（L）';rows[2].classList.add('wordB');}
  }
  document.querySelectorAll('[data-measure-x]').forEach(b=>b.onclick=()=>setX(Number(b.dataset.measureX)));
}
function lessonLinkGraph(t,lesson,state,g){
  if(lesson!==1&&lesson!==17&&!t.model)return '';
  const x=lessonLinkX(t,lesson,state),pred=t.a*x+t.b,measurement=t.data?.find(p=>p[0]===x)?.[1],y=t.model&&measurement!==undefined?measurement:pred;
  const fmt=v=>String(Math.round(v*1000)/1000),label=(y,text,color)=>`<text x="${Math.min(580,g.X(x)+16)}" y="${Math.max(24,g.Y(y)-12)}" font-size="24" fill="${color}" font-weight="900">${text}</text>`;
  let s=`<path d="M${g.X(0)} ${g.Y(y)}H${g.X(x)}V${g.Y(0)}" fill="none" stroke="#d76a10" stroke-width="2" stroke-dasharray="5 5"/>`+label(y,`${t.model&&measurement!==undefined?'測定 ':''}(${x}, ${fmt(y)})`,t.model?'#1769e0':'#a35b0a');
  if(t.model){if(measurement!==undefined)s+=boardPoint(g,x,measurement,'#1769e0',10);if(!t.hideFormula||state.correct)s+=boardPoint(g,x,pred,'#d76a10',6);}
  return s;
}
