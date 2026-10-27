'use strict';
// Geometry is shared by the app and Node-based route verification.
((root) => {
  const SIZES = [4, 5, 6, 8];
  const sizeOf = state => state.size || 4;
  const extent = size => size * 128 + 28;
  const entrance = (size, i) => ({ x: (i % size) * 2 + 1, y: Math.floor(i / size) * 2 });
  const label = (size, i) => `${String.fromCharCode(65 + Math.floor(i / size))}${i % size + 1}`;
  const direction = (a, b) => b.x > a.x ? 'E' : b.x < a.x ? 'W' : b.y > a.y ? 'S' : 'N';

  function resize(state, size) {
    if (!SIZES.includes(size)) throw Error('Unsupported map size');
    const old = sizeOf(state), plots = Array(size * size).fill(null);
    for (let r = 0; r < Math.min(old, size); r++) {
      for (let c = 0; c < Math.min(old, size); c++) plots[r * size + c] = state.plots[r * old + c];
    }
    const remap = i => i === null || Math.floor(i / old) >= size || i % old >= size
      ? null : Math.floor(i / old) * size + i % old;
    const next = { version: 1, title: state.title, plots, start: remap(state.start), goal: remap(state.goal) };
    if (size !== 4) next.size = size;
    return next;
  }

  function pathBetween(size, a, b) {
    const start = entrance(size, a), goal = entrance(size, b);
    const key = p => p.x + ',' + p.y, queue = [[start]], seen = new Set([key(start)]);
    for (let i = 0; i < queue.length; i++) {
      const path = queue[i], p = path.at(-1);
      if (key(p) === key(goal)) return path;
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const n = { x: p.x + dx, y: p.y + dy };
        if (n.x < 0 || n.x > size * 2 || n.y < 0 || n.y > size * 2 || (n.x % 2 && n.y % 2) || seen.has(key(n))) continue;
        seen.add(key(n)); queue.push([...path, n]);
      }
    }
    return null;
  }

  function plan(state, a, b, places) {
    const size = sizeOf(state), from = places.get(state.plots[a]), to = places.get(state.plots[b]);
    if (a === b || !from?.canNavigate || !to?.canNavigate) return null;
    const path = pathBetween(size, a, b);
    if (!path || path.length < 2) return null;
    const initial = direction(path[0], path[1]), arrows = { N: '↑', E: '→', S: '↓', W: '←' };
    const steps = [{ type: 'intro', text: `Start at the ${from.name}.`, ja: `${from.ja}の上の入口から出発。矢印 ${arrows[initial]} の向きで始めます。` }];
    let last = initial, segment = [path[0]];
    const move = () => {
      const blocks = (segment.length - 1) / 2;
      // One block is two road edges, in either axis. Mid-block entrances can
      // produce half blocks; retain that distance instead of rounding it away.
      const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
      const distance = blocks === .5 ? 'half a block' : Number.isInteger(blocks)
        ? `${words[blocks]} block${blocks === 1 ? '' : 's'}` : `${words[Math.floor(blocks)]} and a half blocks`;
      steps.push({ type: 'move', text: `Go straight for ${distance}.`,
        ja: `交差点から次の交差点までが1ブロック。${blocks === .5 ? '半' : blocks}ブロック、まっすぐ進みましょう。`, nodes: segment, dir: last, blocks });
    };
    for (let i = 1; i < path.length; i++) {
      const dir = direction(path[i - 1], path[i]);
      if (dir !== last) {
        move();
        const clockwise = ({ N: 0, E: 1, S: 2, W: 3 }[dir] - { N: 0, E: 1, S: 2, W: 3 }[last] + 4) % 4;
        steps.push({ type: 'turn', text: clockwise === 1 ? 'Turn right.' : clockwise === 3 ? 'Turn left.' : 'Turn around.',
          ja: clockwise === 1 ? 'この子から見て右に曲がりましょう。' : clockwise === 3 ? 'この子から見て左に曲がりましょう。' : '反対を向きましょう。',
          fromDir: last, dir, turnSign: clockwise === 3 ? -1 : 1 });
        segment = [path[i - 1]]; last = dir;
      }
      segment.push(path[i]);
    }
    move();
    const side = last === 'E' ? 'right' : 'left';
    steps.push({ type: 'arrive', text: `The ${to.name} is on your ${side}.`, ja: `${side === 'right' ? '右' : '左'}に${to.ja}があります。目的地の入口に着きました。` });
    return { path, steps, initial };
  }
  const model = { SIZES, sizeOf, extent, entrance, label, resize, pathBetween, plan };
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
  else root.TownModel = model;
})(typeof window !== 'undefined' ? window : globalThis);
