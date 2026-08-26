const DAY = 86400000;
const dateAt = value => new Date(`${value}T00:00:00`);
const iso = date => date.toISOString().slice(0, 10);
export function rangeFor(kind, customStart, customEnd) {
  const today = new Date(); let start, end;
  if (kind === "year") { start = new Date(today.getFullYear(), 3, 1); end = new Date(today.getFullYear() + 1, 2, 31); }
  else if (kind === "term") { const m = today.getMonth(); const y = today.getFullYear(); start = new Date(y, m < 7 ? 3 : m < 11 ? 7 : 11, 1); end = new Date(y, m < 7 ? 6 : m < 11 ? 10 : 2, m < 11 ? 0 : 31); if (m >= 11) end.setFullYear(y + 1); }
  else { start = dateAt(customStart); end = dateAt(customEnd); }
  return { start, end };
}
export async function renderTimeline(root, events, image, range) {
  const days = Math.max(1, Math.round((range.end - range.start) / DAY) + 1); const px = Math.max(7, Math.min(14, 1800 / days));
  root.innerHTML = ""; root.style.setProperty("--day", `${px}px`); root.style.width = `${days * px + 170}px`;
  const months = document.createElement("div"); months.className = "timeline-months"; months.style.marginLeft = "170px";
  for (let d = new Date(range.start); d <= range.end; d.setMonth(d.getMonth() + 1, 1)) { const next = new Date(d.getFullYear(), d.getMonth()+1, 1); const width = Math.min(range.end, next - DAY) - Math.max(range.start, d) + DAY; months.insertAdjacentHTML("beforeend", `<div style="width:${Math.round(width/DAY)*px}px">${d.getFullYear()}年 ${d.getMonth()+1}月</div>`); }
  root.append(months);
  for (const event of events) {
    const lane = document.createElement("div"); lane.className = "timeline-lane"; lane.innerHTML = `<strong>${event.title}</strong><div class="timeline-track"></div>`; const track = lane.lastElementChild;
    for (const [index, stage] of event.stages.entries()) { const current = dateAt(stage.date); const next = event.stages[index+1] ? dateAt(event.stages[index+1].date) : new Date(current.getTime()+DAY); const left = Math.round((current-range.start)/DAY); const width = Math.max(1, Math.round((next-current)/DAY)); if (left < days && left + width > 0) { const block = document.createElement("button"); block.className = `stage ${event.category}`; block.style.left=`${Math.max(0,left)*px}px`; block.style.width=`${Math.min(days-left,width)*px}px`; block.innerHTML = `<img alt="" /><span>${stage.label}</span>`; image(stage.imageId).then(url => { if (url) block.querySelector("img").src = url; }); track.append(block); } }
    root.append(lane);
  }
  const today = new Date(); const position = Math.round((new Date(today.getFullYear(),today.getMonth(),today.getDate())-range.start)/DAY);
  if (position >= 0 && position < days) { const marker=document.createElement("div"); marker.className="today-marker"; marker.style.left=`${170+position*px}px`; marker.textContent="きょう"; root.append(marker); setTimeout(() => root.parentElement.scrollLeft = Math.max(0, 170 + position*px - root.parentElement.clientWidth/2), 0); }
}
export { iso };
