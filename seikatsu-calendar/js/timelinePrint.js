export function printTimeline(timeline, range) {
  const source = timeline.cloneNode(true); source.id="print-timeline"; const pages=Math.max(2, Math.ceil(source.scrollWidth / 1050));
  source.querySelectorAll(".today-marker").forEach(node=>node.remove());
  const holder=document.createElement("div"); holder.id="print-area";
  for(let page=0;page<pages;page++) { const sheet=document.createElement("section"); sheet.className="print-sheet"; const inner=source.cloneNode(true); inner.style.transform=`translateX(${-page*1050}px)`; sheet.innerHTML=`<header>生活カレンダー　${range.start.toLocaleDateString("ja-JP")} 〜 ${range.end.toLocaleDateString("ja-JP")} <b>${page+1}/${pages}　→ 次の紙と貼り合わせ</b></header><div class="cut-guide">✂ のりしろ（ここを重ねる）</div><div class="print-window"></div>`; sheet.querySelector(".print-window").append(inner); holder.append(sheet); }
  document.body.append(holder); window.print(); holder.remove();
}
