const byId = id => document.getElementById(id);
const buttons = selector => [...document.querySelectorAll(selector)];
const gripButtons = buttons('[data-grip]');
const directionButtons = buttons('[data-direction]');
const handButtons = buttons('[data-hand]');
const answerButtons = buttons('[data-answer]');
const play = byId('play');
const timeline = byId('time');
const pivot = { x: 226, y: 139 };
const edge = { start: 102, end: 478, y: 112 };
const handScale = .39;
// The image's middle finger is (31, 26), and its thumb is (310, 130).
const thumbOffset = { x: 279, y: 104 };
const thumbDistance = Math.hypot(thumbOffset.x, thumbOffset.y) * handScale;
const openHandAngle = -Math.atan2(thumbOffset.y, thumbOffset.x) * 180 / Math.PI;
const duration = 6300;
const pressEnd = .19;
const drawEnd = .86;
let grip = 'two';
let direction = 'vertical';
let hand = 'right';
let position = 0;
let frame = null;
let phase = '';

const explanations = {
  two: {
    hold: ['おやゆびと なかゆびを はなして おく。', 'はなれた ２かしょを おさえると、じょうぎが うごきにくいよ。'],
    draw: ['２かしょを おさえたまま ひこう。', 'えんぴつの さきを じょうぎの ほうへ すこしだけ よせて、ふちに そって うごかそう。'],
    done: ['まっすぐな せんが ひけたね。', 'ひきはじめる まえから ひきおわるまで、おやゆびと なかゆびを そのままに しておこう。']
  },
  one: {
    hold: ['なかゆび １ぽんで おさえると？', 'みどりの まるが、なかゆびで おさえて いる ところだよ。'],
    draw: ['なかゆびを まんなかに、くるっ。', '１かしょだけだと、えんぴつが ふちを おした ときに、じょうぎが まわる ことが あるよ。'],
    done: ['じょうぎが まわって、せんが まがったね。', 'はなれた ２かしょを おさえる うごきと、くらべて みよう。']
  },
  loose: {
    hold: ['じょうぎは ２かしょで おさえたよ。', 'こんどは、えんぴつの さきに ちゅうもく しよう。'],
    draw: ['えんぴつの さきが ふちから はなれた。', 'ふちから はなれたり、もどったり すると、せんが なみうつよ。'],
    done: ['じょうぎは うごいて いないね。', 'えんぴつの さきを ふちに かるく あてたまま ひくと、まっすぐ ひけるよ。']
  }
};

const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => n * n * (3 - 2 * n);
const pencilArt = byId('pencil-art');
pencilArt.innerHTML = pencilHandImage(100);
byId('ticks').setAttribute('d', Array.from({ length: 41 }, (_, i) =>
  `M${79 + i * 11} 113v${i % 5 === 0 ? 14 : 7}`
).join(' '));
const secondMark = byId('second-mark');
const pressMarks = buttons('.press-mark');
secondMark.setAttribute('cx', pivot.x + thumbDistance);
secondMark.setAttribute('cy', pivot.y);

function turnAt(amount) {
  return grip === 'one' ? 13 * ease(clamp((amount - .27) / .55)) : 0;
}

// Keep the pencil tip on the moving edge. Ink already on the paper stays in place.
function pointAt(amount) {
  const x = edge.start + (edge.end - edge.start) * amount;
  if (grip === 'loose') {
    const drift = 21 * Math.sin(3 * Math.PI * amount) ** 2;
    return { x, y: edge.y - drift };
  }
  const turn = turnAt(amount) * Math.PI / 180;
  const dx = x - pivot.x;
  const dy = edge.y - pivot.y;
  return {
    x: pivot.x + dx * Math.cos(turn) - dy * Math.sin(turn),
    y: pivot.y + dx * Math.sin(turn) + dy * Math.cos(turn)
  };
}

function labelPhase(next) {
  if (next !== phase) {
    phase = next;
    const [main, detail] = explanations[grip][phase];
    byId('explain-main').textContent = main;
    byId('explain-detail').textContent = detail;
    timeline.setAttribute('aria-valuetext', { hold: 'おさえる', draw: 'ひく', done: 'ひきおわり' }[phase]);
  }
}

function render() {
  const amount = clamp((position - pressEnd) / (drawEnd - pressEnd));
  const press = ease(clamp(position / pressEnd));
  const lift = ease(clamp((position - drawEnd) / (1 - drawEnd)));
  const turn = turnAt(amount);
  const point = pointAt(amount);
  const handAngle = openHandAngle + (grip === 'one' ? 52 : 0);
  const isDrawing = position >= pressEnd && position <= drawEnd;

  byId('ruler').setAttribute('transform', `rotate(${turn} ${pivot.x} ${pivot.y})`);
  byId('old-ruler').setAttribute('visibility', turn > 1 ? 'visible' : 'hidden');
  byId('turn-arrow').setAttribute('visibility', turn > 1 && isDrawing ? 'visible' : 'hidden');
  for (const mark of pressMarks) mark.classList.toggle('is-lifted', press < 1);
  secondMark.style.visibility = grip === 'one' ? 'hidden' : 'visible';
  byId('holding-hand').setAttribute('transform',
    `translate(${pivot.x} ${pivot.y + 23 * (1 - press)}) rotate(${handAngle}) scale(${handScale})`);
  byId('pencil').setAttribute('transform', `translate(${point.x} ${point.y - 25 * (1 - press) - 39 * lift})`);
  byId('pencil').setAttribute('opacity', String(1 - .8 * lift));
  byId('force-arrow').setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${turn})`);
  byId('force-arrow').setAttribute('visibility', isDrawing && grip !== 'loose' ? 'visible' : 'hidden');

  const samples = Math.ceil(amount * 100);
  const path = samples === 0 ? '' : Array.from({ length: samples + 1 }, (_, i) => {
    const { x, y } = pointAt(amount * i / samples);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
  byId('ink').setAttribute('d', path);

  timeline.value = Math.round(position * 1000);
  labelPhase(position < pressEnd ? 'hold' : position < drawEnd ? 'draw' : 'done');
  play.textContent = frame !== null ? 'いったん とめる' :
    position >= 1 ? 'もういちど みる' : position > 0 ? 'つづきを みる' : 'うごきを みる';
}

function pause() {
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null;
}

function start() {
  if (position >= 1) position = 0;
  const started = performance.now() - position * duration;
  function tick(now) {
    position = clamp((now - started) / duration);
    frame = position < 1 ? requestAnimationFrame(tick) : null;
    render();
  }
  frame = requestAnimationFrame(tick);
  render();
}

function markSelection(group, selected) {
  for (const button of group) button.setAttribute('aria-pressed', String(button === selected));
}

function updateTools() {
  const vertical = direction === 'vertical';
  const reflect = hand === 'left' ? 'translate(600 0) scale(-1 1) ' : '';
  const rotate = vertical ? 'translate(424 -6) rotate(90) scale(.68)' : '';
  byId('scene-direction').setAttribute('transform', reflect + rotate);
  document.querySelector('.scene').setAttribute('viewBox', vertical ? '45 0 510 360' : '0 0 600 338');
  pencilArt.setAttribute('transform', vertical ? 'rotate(-90)' : '');
  byId('grip-legend').textContent = grip === 'one' ? 'なかゆび だけ' : 'おやゆび と なかゆび';
  byId('force-legend').hidden = grip === 'loose';
  byId('force-legend').querySelector('i').textContent = vertical ? (hand === 'left' ? '→' : '←') : '↓';
  byId('scene-desc').textContent = grip === 'one'
    ? 'なかゆび １ぽんで おさえた ところを ちゅうしんに、じょうぎが まわります。'
    : 'みどりの まるは おやゆびと なかゆびを おく ところです。' +
      (grip === 'loose' ? 'えんぴつが じょうぎから はなれると、せんが なみうちます。' :
        'むらさきの やじるしは、えんぴつを かるく よせる むきです。');
  const [writing, holding] = hand === 'right' ? ['みぎ', 'ひだり'] : ['ひだり', 'みぎ'];
  byId('hand-note').textContent = `${writing}てで えんぴつを もつ ときは、${holding}てで じょうぎを おさえよう。`;
  byId('direction-note').textContent = vertical
    ? 'まずは たての せん。うえから したへ ひいて みよう。'
    : 'よこの せんは、おやゆびを ひらいて、てくびの むきを すこし かえると、おさえやすいよ。';
}

function reset() {
  pause();
  position = 0;
  phase = '';
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  updateTools();
  render();
}

play.addEventListener('click', () => {
  if (frame === null) start();
  else {
    pause();
    render();
  }
});
timeline.addEventListener('input', () => {
  pause();
  position = Number(timeline.value) / 1000;
  render();
});
for (const button of gripButtons) button.addEventListener('click', () => {
  if (grip === button.dataset.grip) return;
  grip = button.dataset.grip;
  markSelection(gripButtons, button);
  reset();
});
for (const button of directionButtons) button.addEventListener('click', () => {
  if (direction === button.dataset.direction) return;
  direction = button.dataset.direction;
  markSelection(directionButtons, button);
  reset();
});
for (const button of handButtons) button.addEventListener('click', () => {
  if (hand === button.dataset.hand) return;
  hand = button.dataset.hand;
  markSelection(handButtons, button);
  reset();
});
for (const button of answerButtons) button.addEventListener('click', () => {
  markSelection(answerButtons, button);
  byId('feedback').textContent = button.dataset.answer === 'two'
    ? 'そのとおり！ かみと じょうぎで、まっすぐな せんを ひいて みよう。'
    : '１かしょだけだと、じょうぎが くるっと まわる ことが あるよ。もう いちど えらぼう。';
});
const read = byId('read');
read.hidden = !('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
read.addEventListener('click', () => {
  speechSynthesis.cancel();
  const text = ['explain-main', 'explain-detail', 'hand-note', 'direction-note']
    .map(id => byId(id).textContent.replaceAll(' ', '')).join('');
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = .9;
  speechSynthesis.speak(utterance);
});
reset();
