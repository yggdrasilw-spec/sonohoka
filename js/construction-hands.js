const RULER_HANDS = {
  // 反転した画像の親指 (314, 130) と中指 (31, 26) の中点。
  left: { x: 172.5, y: 78, scale: .28, angle: Math.atan2(-104, -283), wristSide: -1, inset: 12 },
  // 人差し指・中指・薬指の指先の中心と、人差し指から薬指への向き。
  right: { x: 283, y: 43, scale: .336, angle: Math.atan2(49, 66), wristSide: 1, inset: 11 }
};

function rulerHandPose(start, end, inside, hand = 'left', along = .5) {
  const grip = RULER_HANDS[hand];
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy);
  const side = Math.sign(dx * (inside[1] - start[1]) - dy * (inside[0] - start[0]));
  // 指先を指定された辺のすぐ内側に置き、手首を定規の内側に向ける。
  const inset = grip.inset * side;
  const x = start[0] + dx * along - dy / length * inset;
  const y = start[1] + dy * along + dx / length * inset;
  const angle = (Math.atan2(dy, dx) - grip.angle) * 180 / Math.PI +
    (side !== grip.wristSide ? 180 : 0);
  return { x, y, angle };
}

function rulerHandImage(hand) {
  const grip = RULER_HANDS[hand];
  return `<image href="media/construction-hands/${hand}-hand.png" aria-hidden="true" pointer-events="none"
    width="${328 * grip.scale}" height="${544 * grip.scale}" x="${-grip.x * grip.scale}" y="${-grip.y * grip.scale}" />`;
}

function rulerHoldingHand(start, end, inside, hand = 'left') {
  const { x, y, angle } = rulerHandPose(start, end, inside, hand);
  return `<g transform="translate(${x} ${y}) rotate(${angle})">${rulerHandImage(hand)}</g>`;
}

function pencilHandImage(width) {
  // 切り出した画像の鉛筆の先 (0.5, 415) を描画座標の原点に合わせる。
  const scale = width / 529;
  return `<image href="media/construction-hands/pencil-hand.png" aria-hidden="true"
    width="${width}" height="${763 * scale}" x="${-.5 * scale}" y="${-415 * scale}" />`;
}
