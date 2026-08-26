const symbols = { gyouji: "🎉", nouji: "🌱", seikatsu: "☀️", kisetsu: "🌸", basho: "🏫", kimochi: "🙂", kigou: "✓" };
const iso = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
export function renderCalendar(root, events, year, month, onSelect) {
  const first = new Date(year,month,1).getDay(), last = new Date(year,month+1,0).getDate();
  root.innerHTML = ["日","月","火","水","木","金","土"].map(day => `<div class="weekday">${day}</div>`).join("");
  for(let i=0;i<first;i++) root.insertAdjacentHTML("beforeend", '<div class="calendar-cell empty"></div>');
  for(let day=1;day<=last;day++) { const date=iso(year,month,day); const stages=events.flatMap(event=>event.stages.filter(stage=>stage.date===date).map(stage=>({event,stage}))); const cell=document.createElement("button"); cell.className=`calendar-cell ${date===new Date().toISOString().slice(0,10)?"is-today":""}`; cell.innerHTML=`<span class="date-number">${day}</span><div class="event-icons">${stages.map(({event,stage})=>`<span title="${event.title}：${stage.label}">${symbols[event.category]||"📌"}</span>`).join("")}</div>`; cell.onclick=()=>onSelect(date,stages); root.append(cell); }
}
export function monthTitle(year, month) { return `${year}年 ${month+1}月`; }
