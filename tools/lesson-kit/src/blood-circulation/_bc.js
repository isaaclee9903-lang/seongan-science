/* ===== 그림 Ⅵ-11 형식 혈액 순환 지도 BC.eight =====
   폐·심장·온몸 그림은 3D 모형(media/fig-*.png)을 찍은 것이고, 큰 혈관과 모세혈관은 SVG로 새로 그렸다. 입자 수와 빠르기는 정한 모형이다. */
window.BC = (() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a, p) => { const e = document.createElementNS(NS, n); if (a) Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v)); if (p) p.appendChild(e); return e; };
  const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const B = { d: '#2f4f9f', m: '#5f83d4' }, R = { d: '#a92a20', m: '#e4665a' };
  let uid = 0;
  /* 큰 혈관 길 (가로 620, 세로 1000) */
  const PATHS = {
    pa: { d: 'M286 418C262 372 128 372 92 318C62 268 88 206 206 172', c: B, w: 22 },
    pv: { d: 'M414 172C532 200 562 276 526 330C498 368 452 372 402 408', c: R, w: 22 },
    ao: { d: 'M345 432C338 356 392 338 470 344C560 352 586 420 586 560C586 700 566 806 432 884', c: R, w: 26 },
    vc: { d: 'M192 884C70 806 36 700 36 560C36 448 90 416 234 428', c: B, w: 26 },
  };
  /* 각 곳의 위치(표시 동그라미) */
  const ROOM = { rv: [262, 548], la: [376, 432], lv: [362, 556], ra: [244, 450] };
  const NAME = { rv: '우심실', pa: '폐동맥', lc: '폐의 모세혈관', pv: '폐정맥', la: '좌심방', lv: '좌심실', ao: '대동맥', bc: '온몸의 모세혈관', vc: '대정맥', ra: '우심방' };
  /* 모세혈관망: 양쪽 끝을 잇는 가는 관 여러 가닥 */
  function net(par, x0, y0, x1, y1, rows, spread, gid, sag) {
    const g = el('g', { fill: 'none', 'stroke-linecap': 'round' }, par);
    for (let r = 0; r < rows; r++) {
      const k = rows > 1 ? r / (rows - 1) - .5 : 0, h = k * spread;
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + h + sag;
      const q1x = x0 + (mx - x0) * .32, q2x = x0 + (mx - x0) * .72;
      const d = `M${x0} ${y0}C${q1x} ${y0 + h * .4} ${q2x} ${my - 14 * Math.sin(r * 1.7)} ${mx} ${my + 8 * Math.sin(r * 2.3)}S${x1 + (mx - x1) * .32} ${y1 + h * .4} ${x1} ${y1}`;
      el('path', { d, stroke: `url(#${gid})`, 'stroke-width': r % 2 ? 2.6 : 3.4, opacity: .94 }, g);
    }
    /* 가닥 사이를 잇는 잔가지 */
    for (let i = 0; i < rows * 3; i++) {
      const t = .22 + (i / (rows * 3)) * .56, x = x0 + (x1 - x0) * t, k = (i % (rows - 1)) / (rows - 1) - .5, y = (y0 + y1) / 2 + k * spread * Math.sin(t * Math.PI) + sag * Math.sin(t * Math.PI);
      el('path', { d: `M${x} ${y}q${6 + i % 5} ${spread / (rows - 1) * .5} ${-3 + i % 7} ${spread / (rows - 1)}`, stroke: `url(#${gid})`, 'stroke-width': 1.8, opacity: .85 }, g);
    }
    return g;
  }
  function eight(host, o = {}) {
    const mini = !!o.mini, id = ++uid;
    host.style.position = 'relative';
    const svg = el('svg', { viewBox: '0 0 620 1000', role: 'presentation', style: 'display:block;width:100%;height:auto;overflow:visible' }, host);
    const defs = el('defs', null, svg);
    const gr = (name, x0, x1, a, b) => { const g = el('linearGradient', { id: name + id, gradientUnits: 'userSpaceOnUse', x1: x0, x2: x1, y1: 0, y2: 0 }, defs); el('stop', { offset: '.08', 'stop-color': a }, g); el('stop', { offset: '.92', 'stop-color': b }, g); };
    gr('gL', 206, 414, B.m, R.m); gr('gB', 432, 192, R.m, B.m);
    const fig = (file, x, y, w, h) => el('image', { href: 'media/' + file, x, y, width: w, height: h, preserveAspectRatio: 'xMidYMid meet' }, svg);
    /* 혈관 */
    const LAY = {}, tube = (k) => { const P = PATHS[k], g = el('g', { fill: 'none', 'stroke-linecap': 'round' }, svg); el('path', { d: P.d, stroke: P.c.d, 'stroke-width': P.w }, g); const c = el('path', { d: P.d, stroke: P.c.m, 'stroke-width': P.w - 6 }, g); LAY[k] = g; return c; };
    fig('fig-lung.png', 188, 0, 244, 330);
    const lcG = net(svg, 206, 172, 414, 172, 7, 150, 'gL' + id, -6); LAY.lc = lcG;
    const line = { pa: tube('pa'), pv: tube('pv'), ao: tube('ao'), vc: tube('vc') };
    fig('fig-heart.png', 168, 348, 284, 330);
    fig('fig-body.png', 226, 668, 168, 326);
    const bcG = net(svg, 432, 884, 192, 884, 7, 128, 'gB' + id, -8); LAY.bc = bcG;
    const dots = el('g', null, svg), fx = el('g', null, svg), top = el('g', null, svg);
    /* 흐르는 혈액 */
    const items = [];
    Object.entries(line).forEach(([k, p]) => { const L = p.getTotalLength(), n = mini ? 5 : 9, red = k === 'pv' || k === 'ao'; for (let i = 0; i < n; i++) { const e = el('ellipse', { rx: mini ? 9 : 7.5, ry: mini ? 6 : 5, fill: red ? '#c5271c' : '#28408f' }, dots); items.push({ e, p, L, t: i / n, k }); } });
    /* 물질 교환 입자 (큰 그림만): 안팎으로 드나든다 */
    const TAG = [];
    const chip = (x, y, t, anchor = 'middle') => { const a = el('text', { x, y, 'text-anchor': anchor, 'font-family': 'Pretendard,sans-serif', 'font-weight': 800, 'font-size': 21, fill: '#14263b', 'paint-order': 'stroke', stroke: '#fff', 'stroke-width': 5 }, top); a.textContent = t; return a; };
    const molA = (cx, cy, c) => { const g = el('g', null, fx); el('circle', { cx: 0, cy: 0, r: 6, fill: c }, g); TAG.push({ g, x: cx, y: cy }); return g; };
    const swaps = [];
    if (!mini) {
      [[190, 60, 244, 140, '#e23b2e'], [430, 60, 376, 140, '#e23b2e'], [262, 200, 186, 280, '#3b4048'], [358, 200, 434, 280, '#3b4048']].forEach(([x0, y0, x1, y1, c], i) => { for (let j = 0; j < 3; j++) { const e = el('circle', { r: 6, fill: c }, fx); const inward = c === '#e23b2e'; swaps.push({ e, a: [x0, y0], b: [x1, y1], t: (i * .17 + j / 3) % 1 }); void inward; } });
      [[232, 762, 284, 832, '#e23b2e'], [388, 762, 336, 832, '#f2b632'], [300, 930, 232, 960, '#3b4048'], [320, 930, 388, 960, '#8d8578']].forEach(([x0, y0, x1, y1, c], i) => { for (let j = 0; j < 3; j++) { const e = el('circle', { r: 6, fill: c }, fx); swaps.push({ e, a: [x0, y0], b: [x1, y1], t: (i * .21 + j / 3) % 1 }); } });
      /* 이름표 */
      chip(310, 346, '폐'); chip(40, 268, '폐동맥', 'start'); chip(580, 268, '폐정맥', 'end');
      chip(16, 650, '대정맥', 'start'); chip(604, 650, '대동맥', 'end');
      chip(32, 170, '폐의 모세혈관', 'start');
      chip(226, 442, '우심방', 'end'); chip(226, 562, '우심실', 'end'); chip(394, 442, '좌심방', 'start'); chip(394, 570, '좌심실', 'start');
      chip(310, 990, '온몸의 모세혈관').setAttribute('x', 140);
      chip(470, 716, '온몸', 'start');
    } else { const a = chip(310, 344, '폐'), b = chip(452, 760, '온몸'); [a, b].forEach((x) => { x.setAttribute('font-size', 46); x.setAttribute('stroke-width', 10); }); }
    void molA; void TAG;
    /* 지금 있는 곳 표시 (작은 그림) */
    const ring = el('circle', { r: 26, fill: 'none', stroke: '#0e63b3', 'stroke-width': 8, opacity: 0 }, top);
    const nameT = el('text', { 'text-anchor': 'middle', 'font-family': 'Pretendard,sans-serif', 'font-weight': 900, 'font-size': 58, fill: '#0e63b3', 'paint-order': 'stroke', stroke: '#fff', 'stroke-width': 14, opacity: 0 }, top);
    const WHERE = { pa: [86, 300], pv: [534, 300], ao: [586, 600], vc: [36, 600], lc: [310, 172], bc: [310, 884], rv: ROOM.rv, la: ROOM.la, lv: ROOM.lv, ra: ROOM.ra };
    let t0 = performance.now(), cur = null, vis = true;
    const frame = (now) => {
      requestAnimationFrame(frame);
      const r = host.getBoundingClientRect(); vis = r.bottom > -40 && r.top < (innerHeight || 800) + 40 && !document.hidden;
      if (!vis) { t0 = now; return; }
      const dt = REDUCE ? 0 : Math.min(.05, (now - t0) / 1000); t0 = now;
      items.forEach((m) => { m.t = (m.t + dt * .16) % 1; const q = m.p.getPointAtLength(m.t * m.L), q2 = m.p.getPointAtLength(Math.min(m.L, m.t * m.L + 2)); const a = Math.atan2(q2.y - q.y, q2.x - q.x) * 57.3; m.e.setAttribute('transform', `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) rotate(${a.toFixed(0)})`); });
      swaps.forEach((s) => { s.t = (s.t + dt * .28) % 1; const e = s.t * s.t * (3 - 2 * s.t); s.e.setAttribute('cx', (s.a[0] + (s.b[0] - s.a[0]) * e).toFixed(1)); s.e.setAttribute('cy', (s.a[1] + (s.b[1] - s.a[1]) * e).toFixed(1)); s.e.setAttribute('opacity', Math.min(1, Math.min(s.t, 1 - s.t) * 7).toFixed(2)); });
    };
    requestAnimationFrame(frame);
    return {
      /* k: 지금 있는 곳. 다른 혈관은 흐리게 */
      mark(k) {
        cur = k; const q = WHERE[k]; if (!q) return;
        Object.entries(LAY).forEach(([n, g]) => { g.style.opacity = n === k || ROOM[k] ? 1 : .32; });
        ring.setAttribute('cx', q[0]); ring.setAttribute('cy', q[1]); ring.setAttribute('opacity', ROOM[k] ? 1 : 0);
        nameT.textContent = ''; nameT.setAttribute('opacity', 0);
      },
      focus(c) { const P = ['pa', 'pv', 'lc'], Q = ['ao', 'vc', 'bc']; Object.entries(LAY).forEach(([n, g]) => { g.style.opacity = !c || c === 'all' ? 1 : (c === 'p' ? P : Q).includes(n) ? 1 : .22; }); },
      NAME,
    };
  }
  return { eight };
})();
