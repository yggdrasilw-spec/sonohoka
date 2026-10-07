// Quantities are drawn by the app so the picture always matches the task.
function linearScene(t, lesson, taskIndex, state) {
  const wrap = (title, picture, caption, control = '') => `<figure class="linearScene"><figcaption><strong>${title}</strong><span>${caption}</span></figcaption>${picture}${control}</figure>`;
  const svg = (body, alt) => `<svg class="sceneDrawing" viewBox="0 0 680 155" role="img" aria-label="${alt}">${body}</svg>`;
  if (lesson === 1) {
    const count = t.explore ? state.exploreX : 2, base = t.b, unit = t.a, scale = 42;
    const length = base + unit * count, end = 35 + scale * length;
    let body = `<rect x="35" y="42" width="${base * scale}" height="48" rx="5" fill="#ffe0ae" stroke="#a35b0a" stroke-width="2"/><text x="${35 + base * scale / 2}" y="73" text-anchor="middle">土台 ${base}cm</text>`;
    for (let i = 0; i < count; i++) body += `<rect x="${35 + (base + unit * i) * scale}" y="42" width="${unit * scale}" height="48" rx="5" fill="#d9eaff" stroke="#1769e0" stroke-width="2"/><text x="${35 + (base + unit * (i + .5)) * scale}" y="73" text-anchor="middle">${unit}cm</text>`;
    body += `<path d="M35 101v12H${end}v-12" fill="none" stroke="#314158" stroke-width="2"/><text x="${(35 + end) / 2}" y="140" text-anchor="middle">全体の長さ y＝${length}cm</text>`;
    return wrap('つなぐと、どこが増える？', svg(body, `土台${base}cmに${unit}cmのブロックが${count}個。全体は${length}cm。`), `x：ブロックの数　／　y：全体の長さ（cm）`);
  }
  if (t.model) {
    const points = t.data || [], observations = points.map(p => `${p[0]}分 → ${p[1]}℃`).join('　／　');
    return wrap('時間がたつと、水温は？', `<div class="warmingScene"><img src="linear-lab-assets/warming-water.webp" width="240" height="160" alt="水を電熱器で温め、温度計と時計で測る実験のイラスト"><div><b>x：温めた時間（分）</b><b>y：水温（℃）</b><p>時計と温度計を、セットで記録する。</p><small>同じ火力・水の量で調べる。</small></div></div>`, observations || '同じ条件が続く範囲で、変化を考える。');
  }
  if (lesson === 17) {
    const time = state.sceneTime ?? 0;
    const tank = (x, name, initial, rate, fill, stroke) => {
      const amount = initial + rate * time, level = 110 - amount * 9;
      return `<text x="${x + 85}" y="21" text-anchor="middle" fill="${stroke}">${name}：最初 ${initial}L ／ 毎分＋${rate}L</text><rect x="${x + 24}" y="${level}" width="122" height="${amount * 9}" fill="${fill}"/><path d="M${x + 24} 34V110H${x + 146}V34" fill="none" stroke="${stroke}" stroke-width="3"/><text x="${x + 85}" y="138" text-anchor="middle" fill="${stroke}">今の水量 ${amount}L</text>`;
    };
    const body = tank(25, 'A', 1, 2, '#c6e2ff', '#1769e0') + tank(375, 'B', 4, 1, '#dce2ea', '#586779');
    return wrap('同じ時間の水量を比べよう', svg(body, `${time}分後。水そうAは${2 * time + 1}L、Bは${time + 4}L。同じ形の水そう。`), 'x：注ぎ始めてからの時間（分）　／　y：水の量（L）', `<div class="sceneControls"><span>時間を動かす</span>${[0,1,2,3].map(x => `<button type="button" data-scene-time="${x}" aria-pressed="${time === x}">${x}分後</button>`).join('')}</div>`);
  }
  return '';
}
