/* ===== 순환계 그림 도구 CR: 심장 단면, 세 혈관, 모세혈관 물질 교환, 혈액 성분. 모두 새로 그림 =====
   크기·빠르기·입자 수는 정한 모형이다. 교과서 그림 Ⅵ-8~Ⅵ-10 형식을 빌렸다. */
window.CR = (() => {
  'use strict';
  const { el, grad, tween, loop, lerp, clamp, stage, shadow, f1, mk, polyAt, flock, defs, ease, REDUCE } = PS;
  let okS = false;
  function symbols() {
    if (okS) return; okS = true; PS.defs(); const d = defs();
    const rbc = (id, a, b, st) => { const g = el('g', { id }, d); el('ellipse', { rx: 13, ry: 9, fill: grad([[0, a], [1, b]], { r: 1, cx: .38, cy: .32, rr: .85 }), stroke: st, 'stroke-width': .8 }, g); el('ellipse', { rx: 6, ry: 3.6, fill: b, opacity: .5 }, g); };
    rbc('cRbc', '#f06a5a', '#b5281d', '#7f1a12'); rbc('cRbcB', '#7d6ec2', '#4a3f8f', '#2e2663');
    const w = el('g', { id: 'cWbc' }, d); el('circle', { r: 19, fill: grad([[0, '#fbfbf4'], [1, '#d9dce6']], { r: 1, cx: .38, cy: .32, rr: .85 }), stroke: '#9aa1b5' }, w); [[-6, -3, 7], [5, -5, 6], [3, 6, 7]].forEach(([x, y, r]) => el('circle', { cx: x, cy: y, r, fill: '#7a68b8' }, w));
    const p = el('g', { id: 'cPlt' }, d); el('path', { d: 'M-7 -1C-6 -7 2 -8 6 -4C9 0 6 7 0 6C-6 6 -8 3 -7 -1Z', fill: '#e8c96a', stroke: '#b5923a' }, p);
    const b = el('g', { id: 'cBac' }, d); el('rect', { x: -10, y: -4.5, width: 20, height: 9, rx: 4.5, fill: '#7fb04f', stroke: '#4f7f2a' }, b);
    const nu = el('g', { id: 'cNut' }, d); el('path', { d: 'M9 0 4.5 7.8H-4.5L-9 0-4.5-7.8H4.5Z', fill: '#f5c04a', stroke: '#a66d0a' }, nu);
    const ws = el('g', { id: 'cWst' }, d); el('rect', { x: -7, y: -7, width: 14, height: 14, rx: 3, fill: '#8f8678', stroke: '#5f5749' }, ws);
  }

  /* --- 심장 단면 --- */
  const PATHS = {
    rv: [[214, 20], [238, 130], [262, 220], [280, 300], [305, 400], [335, 540], [385, 470], [394, 360], [392, 260], [370, 170], [330, 130], [296, 122]],
    lv: [[850, 150], [720, 205], [640, 262], [622, 340], [612, 440], [565, 590], [545, 470], [534, 390], [500, 270], [472, 150], [490, 70], [570, 45], [640, 90]],
  };
  function heart(host) {
    symbols();
    const ST = stage(host, [0, 0, 1000, 720]), root = el('g', null, ST.svg);
    el('rect', { x: -200, width: 1400, height: 720, fill: '#fff' }, root);
    const vs = (d, c1, c2, w) => { el('path', { d, fill: 'none', stroke: c1, 'stroke-width': w, 'stroke-linecap': 'round' }, root); el('path', { d, fill: 'none', stroke: c2, 'stroke-width': w - 10, 'stroke-linecap': 'round' }, root); };
    /* 큰 혈관 뒤쪽 */
    vs('M214 6C228 80 242 140 270 200', '#3c5a9a', '#6b8ecf', 62); vs('M280 700C276 620 262 460 270 330', '#3c5a9a', '#6b8ecf', 62);
    vs('M860 150C780 170 720 200 660 250', '#b02c20', '#e0604f', 46); vs('M870 270C780 262 720 262 650 280', '#b02c20', '#e0604f', 46);
    /* 심장 근육 */
    const heartG = el('g', null, root);
    const body = el('path', { d: 'M250 230C300 150 420 170 500 200C580 170 700 150 742 240C790 340 740 470 620 580C560 640 510 680 480 690C440 660 360 610 310 540C230 450 200 320 250 230Z', fill: grad([[0, '#c9685a'], [.5, '#a84234'], [1, '#7c2a20']], { x2: .8, y2: 1 }), stroke: '#5f1f16', 'stroke-width': 2 }, heartG);
    /* 네 방 */
    const room = (d, c, stroke) => el('path', { d, fill: c, stroke, 'stroke-width': 1.6 }, heartG);
    const RA = room('M226 250C262 206 332 218 352 262C362 306 326 348 280 346C238 342 212 296 226 250Z', grad([[0, '#6d88cf'], [1, '#49609f']]), '#2f4378');
    const LA = room('M556 262C576 216 650 206 696 248C716 294 688 342 640 346C590 348 546 306 556 262Z', grad([[0, '#e8796a'], [1, '#c2483b']]), '#8f2a1f');
    const RV = room('M284 398C316 372 396 372 420 396C440 470 430 560 394 616C350 588 300 520 284 398Z', grad([[0, '#6d88cf'], [1, '#394f89']]), '#2f4378');
    const LV = room('M528 396C556 372 640 372 672 398C664 470 610 590 516 642C500 560 506 460 528 396Z', grad([[0, '#e8796a'], [1, '#a93529']]), '#8f2a1f');
    /* 큰 혈관 앞쪽: 대동맥과 폐동맥 */
    vs('M536 400C522 300 472 210 470 110C475 45 610 25 640 90', '#b02c20', '#e0604f', 62);
    vs('M640 90C650 40 660 20 668 -10', '#b02c20', '#e0604f', 40);
    vs('M392 404C396 300 392 220 370 170C350 130 322 122 296 122', '#3c5a9a', '#6b8ecf', 54);
    /* 입자 길 */
    const fl = flock(root);
    /* 판막 */
    const leaf = (x, y, dir, c) => { const g = el('g', { transform: `translate(${x} ${y})` }, root); const a = el('path', { d: 'M0 0Q18 2 34 26', fill: 'none', stroke: '#fff', 'stroke-width': 6, 'stroke-linecap': 'round' }, g), b = el('path', { d: 'M0 0Q18 2 34 26', fill: 'none', stroke: '#fff', 'stroke-width': 6, 'stroke-linecap': 'round' }, g); return { set(open) { const ang = open ? 62 : 8; a.setAttribute('transform', `translate(-30 0) rotate(${f1(ang * dir)})`); b.setAttribute('transform', `translate(30 0) scale(-1 1) rotate(${f1(ang * dir)})`); } }; };
    const VAL = { ta: leaf(300, 362, 1), ma: leaf(615, 362, 1), pa: leaf(392, 352, -1), ao: leaf(530, 352, -1) };
    /* 이름표 */
    const LB = {};
    [['대정맥', 96, 62], ['대정맥', 196, 660], ['폐동맥', 296, 76], ['대동맥', 690, 44], ['폐정맥', 905, 196], ['우심방', 284, 288, 'lt'], ['좌심방', 628, 288, 'lt'], ['우심실', 360, 484, 'lt'], ['좌심실', 590, 484, 'lt'], ['판막', 192, 392], ['심장벽이 가장 두꺼운 곳', 840, 590]].forEach(([t, x, y, c], i) => { LB[i] = ST.label(x, y, t, c === 'lt' ? 'lt big' : 'bg'); });
    el('line', { x1: 220, y1: 390, x2: 272, y2: 368, stroke: '#14263b', 'stroke-width': 1.1 }, root);
    el('line', { x1: 740, y1: 590, x2: 668, y2: 560, stroke: '#14263b', 'stroke-width': 1.1 }, root);
    const flow = (rv) => (rv ? PATHS.rv : PATHS.lv);
    let bpm = 1, t = 0, acc = 0, paused = false, phase = '';
    const bTF = (sa, sv) => { [[RA, 285, 280], [LA, 622, 280]].forEach(([r, x, y]) => r.setAttribute('transform', `translate(${x} ${y}) scale(${f1(sa * 100) / 100}) translate(${-x} ${-y})`)); [[RV, 355, 490], [LV, 590, 500]].forEach(([r, x, y]) => r.setAttribute('transform', `translate(${x} ${y}) scale(${f1(sv * 100) / 100}) translate(${-x} ${-y})`)); body.setAttribute('transform', `translate(490 420) scale(${f1((.98 + (sv - .84) * .13) * 1000) / 1000}) translate(-490 -420)`); };
    const api = {
      ST,
      get phase() { return phase; },
      speed(v) { bpm = v; },
      pause(v) { paused = v; },
      set(p) { t = p; },
    };
    loop((dt) => {
      if (!paused) t = (t + dt * bpm * .62) % 1;
      /* 0~.35 심방 수축, .35~.7 심실 수축, 나머지 쉼 */
      const inA = t < .35, inV = t >= .35 && t < .7;
      const sa = inA ? 1 - .1 * Math.sin(t / .35 * Math.PI) : 1, sv = inV ? 1 - .16 * Math.sin((t - .35) / .35 * Math.PI) : 1;
      bTF(sa, sv);
      VAL.ta.set(!inV); VAL.ma.set(!inV); VAL.pa.set(inV); VAL.ao.set(inV);
      phase = inA ? '심방 수축' : inV ? '심실 수축' : '이완';
      fl.step(dt * (inV ? 1.45 : .75) * bpm);
      acc += dt * 3.2 * bpm;
      while (acc > 1 && fl.n < 40) { acc -= 1; [true, false].forEach((b) => { const P = flow(b); fl.add(b ? 'cRbcB' : 'cRbc', P, { dur: 3.4, s: 1, spin: 30, wob: 3, fi: .03, fo: .03 }); }); }
      if (acc > 2) acc = 2;
    });
    return api;
  }

  /* --- 세 혈관 --- */
  function vessels(host) {
    symbols();
    const ST = stage(host, [0, 0, 1000, 720]), root = el('g', null, ST.svg);
    el('rect', { x: -200, width: 1400, height: 720, fill: '#fff' }, root);
    const defsV = [
      { k: 'art', n: '동맥', y: 130, w: 86, wall: 26, sp: 2.4, col1: '#d8574a', col2: '#a93024', wc: '#efb3a6' },
      { k: 'cap', n: '모세혈관', y: 360, w: 18, wall: 2, sp: .6, col1: '#b86ca0', col2: '#884d78', wc: '#f1dbe8' },
      { k: 'vei', n: '정맥', y: 590, w: 86, wall: 9, sp: 1.3, col1: '#5d73bd', col2: '#3b4f8f', wc: '#c6d0ea' },
    ];
    const fl = flock(root), rows = {};
    defsV.forEach((v) => {
      const g = el('g', null, root), x0 = 40, x1 = 800, hw = v.w;
      el('rect', { x: x0, y: v.y - hw, width: x1 - x0, height: hw * 2, rx: 8, fill: grad([[0, v.wc], [.5, '#fff7f4'], [1, v.wc]]), stroke: '#9a7468', 'stroke-width': .9 }, g);
      const iw = hw - v.wall;
      el('rect', { x: x0, y: v.y - iw, width: x1 - x0, height: iw * 2, fill: grad([[0, v.col2], [.5, v.col1], [1, v.col2]]) }, g);
      /* 잘린 끝 */
      el('ellipse', { cx: x1, cy: v.y, rx: 22 * hw / 86 + 4, ry: hw, fill: v.wc, stroke: '#9a7468' }, g);
      el('ellipse', { cx: x1, cy: v.y, rx: (22 * hw / 86 + 4) * iw / hw, ry: iw, fill: v.col2 }, g);
      if (v.k === 'vei') [240, 560].forEach((x) => { const p = el('path', { d: `M${x - 30} ${v.y - iw}Q${x + 10} ${v.y - 20} ${x + 26} ${v.y - 8}M${x - 30} ${v.y + iw}Q${x + 10} ${v.y + 20} ${x + 26} ${v.y + 8}`, fill: 'none', stroke: '#eef1fb', 'stroke-width': 7, 'stroke-linecap': 'round' }, g); });
      const l = ST.label(895, v.y, v.n, 'big'); rows[v.k] = { ...v, g, l };
    });
    const R = Math.random, ac = { art: 0, cap: 0, vei: 0 };
    let only = null;
    const add = (v) => { const y0 = v.y + (v.k === 'cap' ? 0 : (R() - .5) * (v.w - v.wall) * 1.4); fl.add(v.k === 'vei' ? 'cRbcB' : 'cRbc', [[40, y0], [800, y0 + (R() - .5) * 6]], { dur: 760 / (v.sp * 95), s: v.k === 'cap' ? .85 : 1.25, spin: 25, fi: .02, fo: .03, wob: v.k === 'cap' ? 0 : 3 }); };
    const pulse = () => 1 + .6 * Math.sin(performance.now() / 340);
    loop((dt) => { fl.step(dt); Object.values(rows).forEach((v) => { ac[v.k] += dt * (v.k === 'cap' ? 1.1 : v.k === 'art' ? 4 * pulse() : 3); if (ac[v.k] > 1 && fl.n < 44) { ac[v.k] -= 1; add(v); } if (ac[v.k] > 2) ac[v.k] = 1; }); });
    return { ST, focus(k) { Object.values(rows).forEach((v) => v.g.setAttribute('opacity', !k || v.k === k ? 1 : .22)); } };
  }

  /* --- 모세혈관 물질 교환 --- */
  function exchange(host) {
    symbols();
    const ST = stage(host, [0, 0, 1000, 720]), root = el('g', null, ST.svg); ST.svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    el('rect', { x: -200, width: 1400, height: 720, fill: '#fdf6f0' }, root);
    /* 세포 줄 */
    const R0 = mk(5);
    [[200, 70], [420, 70], [640, 70], [860, 70], [200, 650], [420, 650], [640, 650], [860, 650], [90, 160], [90, 560], [970, 160], [970, 560]].forEach(([x, y]) => { el('path', { d: `M${x - 90} ${y - 30}C${x - 96} ${y - 90} ${x + 76} ${y - 96} ${x + 88} ${y - 30}C${x + 100} ${y + 30} ${x + 80} ${y + 86} ${x + 10} ${y + 84}C${x - 62} ${y + 88} ${x - 96} ${y + 34} ${x - 90} ${y - 30}Z`, fill: grad([[0, '#f6d7c4'], [1, '#e7b79e']], { r: 1, cx: .4, cy: .35, rr: .8 }), stroke: '#b57f62', 'stroke-width': 1.2 }, root); el('circle', { cx: x + (R0() - .5) * 30, cy: y + (R0() - .5) * 26, r: 25, fill: '#a47a9f', stroke: '#6f4f6c' }, root); });
    /* 모세혈관 */
    el('rect', { x: -40, y: 268, width: 1080, height: 180, fill: grad([[0, '#f7c8b8'], [.08, '#d9796a'], [.92, '#b95c6e'], [1, '#f7c8b8']]) }, root);
    el('rect', { x: -40, y: 268, width: 1080, height: 180, fill: grad([[0, '#d9493a', .4], [1, '#4f60b3', .55]], { x2: 1, y2: 0 }) }, root);
    [[-40, 268], [-40, 448]].forEach(([x, y]) => el('line', { x1: x, x2: 1040, y1: y, y2: y, stroke: '#9e4a3c', 'stroke-width': 3, 'stroke-dasharray': '30 3' }, root));
    const lIn = ST.label(90, 300, '동맥 쪽', 'lt'), lOut = ST.label(910, 300, '정맥 쪽', 'lt'), lCe = ST.label(530, 180, '세포', 'bg'), lW = ST.label(270, 358, '모세혈관', 'lt big');
    const fl = flock(root), R = Math.random; let acc = [0, 0, 0];
    loop((dt) => {
      fl.step(dt);
      acc[0] += dt * 1.8; if (acc[0] > 1) { acc[0] -= 1; const y = 300 + R() * 120; fl.add('cRbc', [[-20, y], [1020, y + (R() - .5) * 10]], { dur: 7, s: 1.3, spin: 20, wob: 2 }); }
      acc[1] += dt * 2.2; if (acc[1] > 1) { acc[1] -= 1; const x = 150 + R() * 700, up = R() < .5, yc = up ? 80 : 640, n = R() < .5 ? 'mO2' : 'cNut'; fl.add(n, [[x - 40, 360], [x, up ? 270 : 446], [x + (R() - .5) * 60, yc]], { dur: 2.6, s: 1.05, spin: 10, fi: .1, fo: .15, wob: 2 }); }
      acc[2] += dt * 2.2; if (acc[2] > 1) { acc[2] -= 1; const x = 150 + R() * 700, up = R() < .5, yc = up ? 80 : 640, n = R() < .5 ? 'mCO2' : 'cWst'; fl.add(n, [[x, yc], [x + 10, up ? 270 : 446], [x + 70, 360]], { dur: 2.6, s: .95, spin: 10, fi: .1, fo: .15, wob: 2 }); }
    });
    return { ST };
  }

  /* --- 혈액 성분 --- */
  function blood(host) {
    symbols();
    const ST = stage(host, [0, 0, 1000, 720]), root = el('g', null, ST.svg); ST.svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    el('rect', { x: -200, width: 1400, height: 720, fill: grad([[0, '#f6e1ac'], [1, '#efcf85']]) }, root);
    const WALL = el('path', { d: 'M-200 0H1200V54Q500 92 -200 54Z', fill: grad([[0, '#c9685a'], [1, '#e79a88']]), stroke: '#a84234' }, root);
    el('path', { d: 'M-200 720H1200V666Q500 628 -200 666Z', fill: grad([[0, '#e79a88'], [1, '#c9685a']]), stroke: '#a84234' }, root);
    const lP = ST.label(120, 610, '혈장', 'big');
    const R = mk(31), rnd = Math.random;
    const items = [];
    const add = (k, x, y, s, vx) => { const u = el('use', { href: '#' + k }, root); const it = { k, u, x, y, s, vx, ph: rnd() * 6, rot: rnd() * 360 }; items.push(it); return it; };
    for (let i = 0; i < 26; i++) add('cRbc', R() * 1000, 110 + R() * 500, 1.7, 26 + R() * 12);
    for (let i = 0; i < 3; i++) add('cWbc', 150 + i * 330, 200 + (i % 2) * 280, 1.7, 15);
    for (let i = 0; i < 10; i++) add('cPlt', R() * 1000, 120 + R() * 480, 1.3, 22);
    const O = []; for (let i = 0; i < 10; i++) { const u = el('use', { href: '#mO2', opacity: 0 }, root); O.push(u); }
    const lay = {};
    /* 상처 장면 */
    const wound = el('g', { opacity: 0 }, root);
    el('path', { d: 'M420 90C460 130 530 130 570 90L560 40H430Z', fill: '#fbf1e8', stroke: '#a84234' }, wound);
    const clot = []; for (let i = 0; i < 9; i++) clot.push(el('use', { href: '#cPlt', opacity: 0, transform: `translate(${430 + i * 16} ${108 + Math.sin(i) * 8}) scale(1.6)` }, wound));
    const crust = el('path', { d: 'M420 92C460 128 530 128 570 92', fill: 'none', stroke: '#6f2a20', 'stroke-width': 13, 'stroke-linecap': 'round', opacity: 0 }, wound);
    /* 세균 */
    const bac = el('use', { href: '#cBac', opacity: 0 }, root);
    let mode = null, mT = 0, tgt = null;
    const api = {
      ST,
      show(k) {
        mode = k; mT = 0;
        items.forEach((it) => { const dim = k && !((k === 'rbc' && it.k === 'cRbc') || (k === 'wbc' && it.k === 'cWbc') || (k === 'plt' && it.k === 'cPlt')); it.u.setAttribute('opacity', k === 'pla' ? .25 : dim ? .22 : 1); });
        wound.setAttribute('opacity', k === 'plt' ? 1 : 0); clot.forEach((c) => c.setAttribute('opacity', 0)); crust.setAttribute('opacity', 0);
        bac.setAttribute('opacity', k === 'wbc' ? 1 : 0);
        O.forEach((u) => u.setAttribute('opacity', k === 'rbc' ? 1 : 0));
        lP.e.style.fontSize = k === 'pla' ? 'clamp(20px,2.4vw,28px)' : '';
      },
    };
    const pl = []; for (let i = 0; i < 16; i++) { const k = ['mCO2', 'cNut', 'cWst'][i % 3], u = el('use', { href: '#' + k, opacity: 0 }, root); pl.push({ u, x: R() * 1000, y: 110 + R() * 500 }); }
    loop((dt, now) => {
      items.forEach((it) => { it.x += it.vx * dt; if (it.x > 1040) it.x = -40; it.rot += 10 * dt; const y = it.y + Math.sin(now + it.ph) * 7; it.u.setAttribute('transform', `translate(${f1(it.x)} ${f1(y)}) rotate(${f1(it.rot)}) scale(${it.s})`); it.Y = y; });
      if (mode === 'rbc') { const R2 = items.filter((i) => i.k === 'cRbc').slice(0, O.length); O.forEach((u, i) => { const r = R2[i]; u.setAttribute('transform', `translate(${f1(r.x + 2)} ${f1(r.Y - 22)}) scale(.82)`); }); }
      if (mode === 'pla') pl.forEach((p, i) => { p.x = (p.x + 26 * dt) % 1040; p.u.setAttribute('opacity', 1); p.u.setAttribute('transform', `translate(${f1(p.x)} ${f1(p.y + Math.sin(now + i) * 6)}) scale(1.1)`); }); else pl.forEach((p) => p.u.setAttribute('opacity', 0));
      if (mode === 'plt') { mT += dt / 3.2; clot.forEach((c, i) => c.setAttribute('opacity', mT > i * .08 ? 1 : 0)); crust.setAttribute('opacity', clamp((mT - .85) * 4)); }
      if (mode === 'wbc') { mT = (mT + dt / 4.5) % 1; const w = items.find((i) => i.k === 'cWbc' && i.x > 200 && i.x < 800) || items.find((i) => i.k === 'cWbc'), x = lerp(w.x + 170, w.x + 10, clamp(mT * 1.5)), y = lerp(w.Y - 60, w.Y, clamp(mT * 1.5)); bac.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) rotate(30) scale(1.3)`); bac.setAttribute('opacity', mT > .68 ? 0 : 1); }
    });
    return api;
  }
  return { heart, vessels, exchange, blood };
})();
