/* ===== 혈액 순환 그림 도구 BC: 그림 Ⅵ-11 형식의 경로 그림. 모두 새로 그림. 입자 수와 빠르기는 정한 모형 ===== */
window.BC = (() => {
  'use strict';
  const { el, grad, tween, loop, lerp, clamp, stage, f1, mk, polyAt, flock, defs, REDUCE } = PS;
  let okS = false;
  function symbols() {
    if (okS) return; okS = true; PS.defs(); const d = defs();
    const rbc = (id, a, b, st) => { const g = el('g', { id }, d); el('ellipse', { rx: 13, ry: 9, fill: grad([[0, a], [1, b]], { r: 1, cx: .38, cy: .32, rr: .85 }), stroke: st, 'stroke-width': .8 }, g); el('ellipse', { rx: 6, ry: 3.6, fill: b, opacity: .5 }, g); };
    rbc('bRed', '#f06a5a', '#b5281d', '#7f1a12'); rbc('bBlu', '#7d6ec2', '#4a3f8f', '#2e2663');
    const nu = el('g', { id: 'bNut' }, d); el('path', { d: 'M9 0 4.5 7.8H-4.5L-9 0-4.5-7.8H4.5Z', fill: '#f5c04a', stroke: '#a66d0a' }, nu);
    const ws = el('g', { id: 'bWst' }, d); el('rect', { x: -7, y: -7, width: 14, height: 14, rx: 3, fill: '#8f8678', stroke: '#5f5749' }, ws);
  }
  /* 길 조각 */
  const SEG = {
    pa: [[418, 452], [340, 452], [270, 400], [250, 280], [300, 160], [345, 120]], /* 우심실 → 폐동맥 → 폐 */
    lung: [[345, 120], [420, 90], [500, 112], [580, 90], [655, 120]],
    pv: [[655, 120], [720, 170], [720, 280], [650, 330], [582, 334]], /* 폐정맥 → 좌심방 */
    lh: [[582, 334], [582, 450]],
    ao: [[582, 450], [670, 470], [810, 470], [860, 560], [800, 650], [700, 672]], /* 좌심실 → 대동맥 → 온몸 */
    body: [[700, 672], [600, 694], [500, 672], [400, 694], [300, 672]],
    vc: [[300, 672], [190, 650], [140, 540], [150, 330], [240, 300], [340, 314], [418, 334]], /* 온몸 → 대정맥 → 우심방 */
    rh: [[418, 334], [418, 452]],
  };
  const LOOP = ['pa', 'lung', 'pv', 'lh', 'ao', 'body', 'vc', 'rh'];
  const ST_ = [
    ['우심실', '우심실에서 혈액이 나가요. 이산화 탄소가 많은 혈액이에요.', null, 'pa'], ['폐동맥', '혈액이 폐동맥을 따라 폐로 이동해요.', 'pa', 'lung'], ['폐의 모세혈관', '이산화 탄소를 내보내고 <b>산소</b>를 받아요.', 'lung', 'pv'],
    ['폐정맥', '산소를 받은 혈액이 폐정맥을 거쳐 심장으로 돌아와요.', 'pv', null], ['좌심방', '여기까지가 <b>허파순환</b>이에요. 혈액은 좌심실로 내려가요.', null, null],
    ['좌심실', '좌심실이 수축해 혈액을 온몸으로 내보내요.', 'lh', null], ['대동맥', '혈액이 대동맥을 따라 온몸으로 이동해요.', 'ao', null], ['온몸의 모세혈관', '세포에 <b>산소와 영양소</b>를 공급하고, <b>이산화 탄소와 노폐물</b>을 받아요.', 'body', null],
    ['대정맥', '이산화 탄소와 노폐물을 받은 혈액이 대정맥을 거쳐 돌아와요.', 'vc', null], ['우심방', '여기까지가 <b>온몸순환</b>이에요. 혈액은 다시 우심실로 내려가요.', null, null],
  ];
  function map(host, o = {}) {
    symbols();
    const ST = stage(host, [0, 0, 1000, 780]), root = el('g', null, ST.svg);
    el('rect', { x: -200, width: 1400, height: 780, fill: '#fff' }, root);
    /* 폐 */
    const R0 = mk(3);
    const lung = (x, f) => { const g = el('g', null, root); el('path', { d: `M${x} 22C${x + f * 92} 14 ${x + f * 190} 72 ${x + f * 196} 150C${x + f * 200} 200 ${x + f * 80} 212 ${x + f * 16} 186C${x + f * 6} 130 ${x + f * 2} 70 ${x} 22Z`, fill: grad([[0, '#f6c9c6'], [1, '#e79a95']], { r: 1, cx: .45, cy: .4, rr: .75 }), stroke: '#b56562', 'stroke-width': 1.5 }, g); for (let i = 0; i < 40; i++) el('circle', { cx: f1(x + f * (30 + R0() * 145)), cy: f1(40 + R0() * 140), r: f1(6 + R0() * 7), fill: '#f9dcda', stroke: '#d48b87', 'stroke-width': .6, opacity: .75 }, g); };
    lung(490, -1); lung(510, 1);
    /* 온몸 세포 */
    const bodyG = el('g', null, root);
    for (let i = 0; i < 9; i++) { const x = 190 + i * 78; [640, 716].forEach((y, r) => { const cx = x + (r ? 36 : 0); el('path', { d: `M${cx - 34} ${y}C${cx - 34} ${y - 34} ${cx + 34} ${y - 34} ${cx + 34} ${y}C${cx + 34} ${y + 34} ${cx - 34} ${y + 34} ${cx - 34} ${y}Z`, fill: grad([[0, '#f6d7c4'], [1, '#e7b79e']], { r: 1, cx: .4, cy: .35, rr: .8 }), stroke: '#b57f62' }, bodyG); el('circle', { cx: cx + (i % 2 ? 6 : -6), cy: y - 2, r: 10, fill: '#a47a9f' }, bodyG); }); }
    /* 혈관 */
    const LAY = {};
    const tube = (k, c1, c2, w) => { const pts = SEG[k]; let d = `M${pts[0][0]} ${pts[0][1]}`; for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; d += `Q${pts[i][0]} ${pts[i][1]} ${f1(mx)} ${f1(my)}`; } d += `L${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`; const g = el('g', { fill: 'none', 'stroke-linecap': 'round' }, root); el('path', { d, stroke: c1, 'stroke-width': w }, g); el('path', { d, stroke: c2, 'stroke-width': w - 8 }, g); LAY[k] = g; };
    const B1 = '#3c5a9a', B2 = '#7f9ad9', R1 = '#b02c20', R2 = '#e8796a';
    tube('vc', B1, B2, 34); tube('pa', B1, B2, 30); tube('pv', R1, R2, 30); tube('ao', R1, R2, 34);
    /* 모세혈관망 */
    const mesh = (k, c1, c2) => { const pts = SEG[k], g = el('g', { fill: 'none', 'stroke-linecap': 'round' }, root); for (let w = -2; w <= 2; w++) { const d = 'M' + pts.map((p, i) => `${p[0]} ${p[1] + w * 9 * Math.sin(i / (pts.length - 1) * Math.PI)}`).join('L'); el('path', { d, stroke: w < 0 || k === 'none' ? c1 : c2, 'stroke-width': 4 }, g); } LAY[k] = g; };
    mesh('lung', B2, R2); mesh('body', R2, B2);
    /* 심장 */
    const hG = el('g', null, root);
    el('path', { d: 'M500 256C410 214 340 270 348 370C354 470 440 540 500 566C560 540 646 470 652 370C660 270 590 214 500 256Z', fill: grad([[0, '#c9685a'], [1, '#7c2a20']], { x2: .8, y2: 1 }), stroke: '#5f1f16', 'stroke-width': 1.6 }, hG);
    const room = (x, y, w, h, a, b, lab) => { el('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 20, fill: grad([[0, a], [1, b]]), stroke: '#3a1a14' }, hG); return ST.label(x, y, lab, 'lt'); };
    room(418, 336, 110, 78, '#6d88cf', '#49609f', '우심방'); room(582, 336, 110, 78, '#e8796a', '#c2483b', '좌심방'); room(418, 452, 110, 96, '#6d88cf', '#394f89', '우심실'); room(582, 452, 110, 96, '#e8796a', '#a93529', '좌심실');
    tube('rh', B1, B2, 8); tube('lh', R1, R2, 8);
    /* 이름표 */
    [['폐', 500, 195], ['폐동맥', 254, 215], ['폐정맥', 762, 215], ['대동맥', 880, 510], ['대정맥', 95, 450], ['온몸', 500, 760]].forEach(([t, x, y]) => ST.label(x, y, t, 'bg'));
    const mol = el('g', null, root), fl = flock(mol), big = el('use', { href: '#bBlu', opacity: 0 }, root);
    const R = Math.random; let run = true, acc = 0, mode = 'all', exLung = 0, exBody = 0;
    const color = { pa: 'bBlu', lung: 'bBlu', pv: 'bRed', lh: 'bRed', ao: 'bRed', body: 'bRed', vc: 'bBlu', rh: 'bBlu' };
    const send = (k, cb) => fl.add(color[k], SEG[k], { dur: k === 'lung' || k === 'body' ? 1.8 : k === 'rh' || k === 'lh' ? .5 : 1.9, s: 1, spin: 20, fi: .02, fo: .02, wob: k === 'lung' || k === 'body' ? 8 : 2, cb });
    const nextAll = (i) => { if (!run) return; const k = LOOP[i % LOOP.length]; send(k, () => nextAll(i + 1)); };
    const api = {
      ST,
      focus(m) { mode = m; const P = ['pa', 'lung', 'pv'], B = ['ao', 'body', 'vc']; Object.keys(LAY).forEach((k) => LAY[k].setAttribute('opacity', m === 'all' ? 1 : (m === 'p' ? P : B).includes(k) ? 1 : .18)); },
      step(k, cb) { big.setAttribute('opacity', 1); big.setAttribute('href', color[k] === 'bRed' ? '#bRed' : '#bBlu'); const dur = REDUCE ? 0 : 1400; tween(dur, (t) => { const p = polyAt(SEG[k], t); big.setAttribute('transform', `translate(${f1(p[0])} ${f1(p[1])}) scale(1.8)`); }, cb, (x) => x); },
      place(xy, red) { big.setAttribute('opacity', 1); big.setAttribute('href', red ? '#bRed' : '#bBlu'); big.setAttribute('transform', `translate(${xy[0]} ${xy[1]}) scale(1.8)`); },
      autorun(v) { run = v; },
    };
    let t = 0;
    loop((dt) => {
      fl.step(dt);
      acc += dt; if (run && acc > .42 && fl.n < 40) { acc = 0; nextAll(Math.floor(R() * 2) ? 0 : 4); }
      if (run && mode !== 'b') { exLung += dt * 1.3; if (exLung > 1) { exLung = 0; const x = 370 + R() * 260; fl.add('mO2', [[x, 18], [x, 70], [x, 104]], { dur: 1, s: .75, fi: .2, fo: .2 }); fl.add('mCO2', [[x + 30, 104], [x + 30, 60], [x + 30, 10]], { dur: 1, s: .7, fi: .2, fo: .2 }); } }
      if (run && mode !== 'p') { exBody += dt * 1.3; if (exBody > 1) { exBody = 0; const x = 300 + R() * 400, n = R() < .5 ? 'mO2' : 'bNut'; fl.add(n, [[x, 682], [x, 712], [x, 738]], { dur: 1, s: .75, fi: .2, fo: .2 }); fl.add(R() < .5 ? 'mCO2' : 'bWst', [[x + 30, 738], [x + 30, 712], [x + 30, 682]], { dur: 1, s: .7, fi: .2, fo: .2 }); } }
    });
    if (o.autorun !== false) api.autorun(true);
    return api;
  }
  return { map, ST_, SEG };
})();
