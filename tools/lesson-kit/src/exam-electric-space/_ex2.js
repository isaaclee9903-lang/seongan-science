/* ===== 시험 대비 그림 도구 2: Ⅷ 별과 우주 (SVG, 어두운 하늘) =====
   각도·거리·별의 수는 보기 좋게 정한 모형이에요. 숫자는 교과서 값만 씁니다. */
(() => {
  const { S, T, svg, button, slider, seg, loop, once, seq, arrow, clamp, lerp, ease, C } = EX._;
  const SKY = '#0b1526', W1 = '#e9eff6', W2 = '#a9b8c9';
  const rnd32 = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const mkRnd = (s0) => { let s = s0; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  function sky(g, n = 90, w = g.w, h = g.h, seed = 11) {
    g.s.parentNode.style.background = SKY;
    S('rect', { width: w, height: h, fill: SKY }, g.s);
    const r = mkRnd(seed); for (let i = 0; i < n; i++) S('circle', { cx: r() * w, cy: r() * h, r: r() * r() * 1.6 + .4, fill: '#dfe8f5', opacity: .25 + r() * .55 }, g.s);
  }
  /* 빛 번짐 별: set(반지름 배율) */
  function star(g, p, x, y, r, c = '#ffffff') {
    const a = S('g', { transform: `translate(${x},${y})` }, p);
    const gl = S('circle', { r: r * 3, fill: g.glow('sg' + c.slice(1), c) }, a), co = S('circle', { r: r * .55, fill: '#fff' }, a);
    a.size = (R) => { gl.setAttribute('r', R * 3); co.setAttribute('r', R * .55); };
    a.color = (col) => { gl.setAttribute('fill', g.glow('sg' + col.slice(1), col)); };
    a.at = (X, Y) => a.setAttribute('transform', `translate(${X},${Y})`);
    return a;
  }

  /* 시차: 흰 바탕, 두 관측 지점과 물체 */
  function para(host, ctl) {
    const g = svg(host, 760, 560), s = g.s, A = [250, 500], B = [510, 500], BGY = 60;
    S('rect', { x: 30, y: BGY - 34, width: 700, height: 34, fill: g.lg('bgb', [[0, '#c9d9e8'], [1, '#e6eef5']]) }, s);
    for (let i = 0; i < 15; i++) S('line', { x1: 40 + i * 48, x2: 40 + i * 48, y1: BGY - 34, y2: BGY, stroke: '#a9bccb', 'stroke-width': 1.4 }, s);
    T(s, 690, BGY + 26, '먼 배경', { size: 20, c: C.mut, a: 'end' });
    const l1 = S('line', { stroke: C.blue, 'stroke-width': 2 }, s), l2 = S('line', { stroke: C.blue, 'stroke-width': 2 }, s);
    const m1 = S('circle', { r: 8, fill: C.blue }, s), m2 = S('circle', { r: 8, fill: C.blue }, s);
    const pole = S('g', {}, s);
    S('rect', { x: -12, y: -46, width: 24, height: 60, rx: 6, fill: g.lg('pole', [[0, '#d65d4e'], [.5, '#ef8d7f'], [1, '#b03e30']], 1, 0) }, pole);
    S('circle', { cy: -48, r: 15, fill: g.rg('ph', [[0, '#ffe39a'], [1, '#e6a93a']]) }, pole);
    const arc = S('path', { fill: 'rgba(14,99,179,.14)', stroke: C.blue, 'stroke-width': 2 }, s);
    const tA = T(s, 0, 0, '시차', { size: 24, w: 800, c: '#0b3f73', a: 'start' });
    const eye = (x, n) => { S('circle', { cx: x, cy: 512, r: 15, fill: g.rg('eye', [[0, '#55677c'], [1, '#2f3c4c']]) }, s); T(s, x, 546, n, { size: 21 }); };
    eye(A[0], '관측 지점 1'); eye(B[0], '관측 지점 2');
    const rd = T(s, 380, 110 + 40, '', { size: 0 });
    let k = .15;
    function draw() {
      const y = lerp(330, 150, k), x = 380;
      pole.setAttribute('transform', `translate(${x},${y})`);
      const ext = (P) => { const u = (P[1] - BGY) / (P[1] - y); return [P[0] + (x - P[0]) * u, BGY]; };
      const e1 = ext(A), e2 = ext(B);
      l1.setAttribute('x1', A[0]); l1.setAttribute('y1', A[1]); l1.setAttribute('x2', e1[0]); l1.setAttribute('y2', e1[1]);
      l2.setAttribute('x1', B[0]); l2.setAttribute('y1', B[1]); l2.setAttribute('x2', e2[0]); l2.setAttribute('y2', e2[1]);
      m1.setAttribute('cx', e1[0]); m1.setAttribute('cy', BGY - 4); m2.setAttribute('cx', e2[0]); m2.setAttribute('cy', BGY - 4);
      const ang = (P) => Math.atan2(P[1] - y, P[0] - x), R = 60;
      const a1 = ang(A), a2 = ang(B);
      arc.setAttribute('d', `M${x},${y} L${x + Math.cos(a2) * R},${y + Math.sin(a2) * R} A${R},${R} 0 0 1 ${x + Math.cos(a1) * R},${y + Math.sin(a1) * R}Z`);
      tA.setAttribute('x', x + 26); tA.setAttribute('y', y + R + 28);
    }
    draw();
    const sl = slider(ctl, '물체까지의 거리', 0, 1, .01, k, (v) => { k = v; draw(); });
    let cancel = null;
    return { play() { cancel && cancel(); cancel = once(3, (t) => { k = .5 - .5 * Math.cos(t / 3 * 6.283); k = lerp(.02, .9, k); sl.value = k; draw(); }); }, stop() { cancel && cancel(); } };
  }

  /* 연주 시차 (그림 Ⅷ-2) */
  function annual(host, ctl) {
    const g = svg(host, 760, 620); sky(g, 70); const s = g.s;
    const cx = 380, cy = 470, R = 150, BG = 56;
    S('rect', { x: 20, y: BG - 16, width: 720, height: 32, fill: 'rgba(160,185,220,.1)' }, s);
    T(s, 720, BG + 42, '먼 별들', { size: 19, c: W2, a: 'end' });
    S('ellipse', { cx, cy, rx: R, ry: R * .34, fill: 'none', stroke: '#6b7f99', 'stroke-width': 1.6, 'stroke-dasharray': '6 6' }, s);
    star(g, s, cx, cy, 16, '#ffd67a'); T(s, cx, cy + 46, '태양', { size: 20, c: W1 });
    const X = [cx, 280], Y = [cx, 170];
    star(g, s, X[0], X[1], 10, '#ffffff'), star(g, s, Y[0], Y[1], 7, '#bcd2ff');
    T(s, X[0] + 22, X[1] + 7, '별 X', { size: 21, c: W1, a: 'start' }); T(s, Y[0] + 22, Y[1] + 7, '별 Y', { size: 21, c: W1, a: 'start' });
    const lx1 = S('line', { stroke: '#7fc0ff', 'stroke-width': 2 }, s), lx2 = S('line', { stroke: '#7fc0ff', 'stroke-width': 2 }, s), ly1 = S('line', { stroke: '#8d9db3', 'stroke-width': 1.6 }, s), ly2 = S('line', { stroke: '#8d9db3', 'stroke-width': 1.6 }, s);
    const earth = S('g', {}, s); S('circle', { r: 13, fill: g.rg('earth', [[0, '#7cc4f5'], [.6, '#2f7fc6'], [1, '#1b5293']]) }, earth); S('path', { d: 'M-8,-5 q6,-5 10,0 q-2,6 -8,4Z M2,5 q5,-2 7,2 q-4,4 -7,0Z', fill: '#67ad5c' }, earth);
    T(s, cx - R - 22, cy + 8, 'A', { size: 24, c: W1, a: 'end' }); T(s, cx + R + 22, cy + 8, 'B', { size: 24, c: W1, a: 'start' });
    const P1 = [0, 0, 0, 0], names = ['X₁', 'X₂', 'Y₁', 'Y₂'].map((n) => T(s, 0, 0, n, { size: 21, c: '#fff' }));
    const dots2 = [0, 1, 2, 3].map((i) => S('circle', { r: 5.5, fill: i < 2 ? '#7fc0ff' : '#c6d2e2' }, s));
    const arc = S('path', { fill: 'rgba(127,192,255,.25)', stroke: '#7fc0ff', 'stroke-width': 2 }, s);
    const lbl = T(s, 0, 0, '', { size: 22, w: 800, c: '#cfe6ff', a: 'start' });
    const cap = T(s, 380, 568, '', { size: 23, w: 800, c: W1 });
    const pos = (u) => [cx - Math.cos(u * Math.PI) * R, cy + Math.sin(u * Math.PI) * R * .34 * .0 + (-Math.sin(u * Math.PI) * R * .34)];
    const proj = (E, star0) => { const k = (E[1] - BG) / (E[1] - star0[1]); return [E[0] + (star0[0] - E[0]) * k, BG]; };
    const A = [cx - R, cy], B = [cx + R, cy];
    const xA = proj(A, X), xB = proj(B, X), yA = proj(A, Y), yB = proj(B, Y);
    function draw(u) {
      const E = pos(u); earth.setAttribute('transform', `translate(${E[0]},${E[1]})`);
      const at = (e, st, l, flag) => { const q = proj(e, st); l.setAttribute('x1', e[0]); l.setAttribute('y1', e[1]); l.setAttribute('x2', q[0]); l.setAttribute('y2', q[1]); l.style.visibility = flag ? 'visible' : 'hidden'; };
      at(A, X, lx1, true); at(A, Y, ly1, true);
      at(u > .98 ? B : E, X, lx2, u > .02); at(u > .98 ? B : E, Y, ly2, u > .02);
      const done = u > .98;
      [[xA, 0, true], [xB, 1, done], [yA, 2, true], [yB, 3, done]].forEach(([q, i, on]) => { dots2[i].setAttribute('cx', q[0]); dots2[i].setAttribute('cy', BG); dots2[i].style.visibility = on ? 'visible' : 'hidden'; names[i].setAttribute('x', q[0]); names[i].setAttribute('y', BG - 22); names[i].style.visibility = on ? 'visible' : 'hidden'; });
      arc.style.visibility = lbl.style.visibility = done ? 'visible' : 'hidden';
      const ang = (P) => Math.atan2(P[1] - X[1], P[0] - X[0]), r = 66, a1 = ang(A), a2 = ang(B);
      arc.setAttribute('d', `M${X[0]},${X[1]} L${X[0] + Math.cos(a2) * r},${X[1] + Math.sin(a2) * r} A${r},${r} 0 0 1 ${X[0] + Math.cos(a1) * r},${X[1] + Math.sin(a1) * r}Z`);
      lbl.textContent = '∠AXB = 별 X의 시차'; lbl.setAttribute('x', X[0] + 80); lbl.setAttribute('y', X[1] + 66);
      cap.textContent = done ? '반년 뒤. 시차의 ½이 연주 시차. 가까운 별 X의 시차가 더 큼' : '지구가 A에서 반년 동안 공전하여 B로 감';
    }
    draw(0);
    let cancel = null;
    const play = () => { cancel && cancel(); cancel = once(3.2, (t) => draw(ease(t / 3.2))); };
    button(ctl, '반년 공전하기', play, 'go');
    T(s, 380, 604, '각도는 잘 보이게 크게 그림', { size: 18, c: W2 });
    return { play, stop() { cancel && cancel(); } };
  }

  /* 등급과 밝기 (그림 Ⅷ-3) */
  function mag(host) {
    const g = svg(host, 760, 440); sky(g, 40); const s = g.s;
    const R = [30, 19.5, 12.3, 7.8, 4.9, 3.1], X = (i) => 80 + i * 120, Y = 190;
    const st = R.map((r, i) => star(g, s, X(i), Y, r, '#ffffff'));
    R.forEach((r, i) => T(s, X(i), 330, (i + 1) + ' 등급', { size: 22, c: W1 }));
    const arcs = []; for (let i = 0; i < 5; i++) { const x1 = X(i), x2 = X(i + 1); S('path', { d: `M${x1 + 8},82 Q${(x1 + x2) / 2},52 ${x2 - 8},82`, fill: 'none', stroke: '#8bb7e6', 'stroke-width': 1.8 }, s); arcs.push(T(s, (x1 + x2) / 2, 48, '약 2.5 배', { size: 18, c: '#cfe0f4' })); }
    S('path', { d: `M${X(0)},368 V382 H${X(5)} V368`, fill: 'none', stroke: '#fff', 'stroke-width': 1.8 }, s);
    T(s, 380, 416, '1 등급은 6 등급보다 100 배 밝음', { size: 25, w: 800, c: '#fff' });
    let cancel = null;
    return { play() { cancel && cancel(); cancel = once(2, (t) => { st.forEach((a, i) => { a.size(R[i] * ease(clamp(t * 2 - i * .25, 0, 1))); }); }); }, stop() { cancel && cancel(); } };
  }

  /* 거리와 빛의 세기 (그림 Ⅷ-4) */
  function inv(host, ctl) {
    const g = svg(host, 760, 540); sky(g, 30); const s = g.s;
    const sx = 70, sy = 250; star(g, s, sx, sy, 22, '#ffe9a8');
    T(s, sx, sy + 76, '광원', { size: 21, c: W1 });
    const cols = [200, 400, 660], sizes = [50, 100, 150];
    const beam = S('path', { fill: 'rgba(255,233,160,.1)' }, s);
    const panels = cols.map((x, i) => {
      const n = i + 1, h = sizes[i], G = S('g', {}, s), cells = [];
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const u = h * 2 / n; const q = S('rect', { x: x - h * .34 + c * (h * .68 / n), y: sy - h + r * u, width: h * .68 / n - 2, height: u - 2, fill: '#ffe9a8', stroke: '#f1cd70', 'stroke-width': 1 }, G); q._k = i; cells.push(q); }
      T(G, x, sy + h + 32, `거리 ${n} 배`, { size: 21, w: 800, c: W1 });
      T(G, x, sy + h + 60, `${n * n} 칸, 한 칸 ${i === 0 ? '1 배' : '1/' + (n * n) + ' 배'}`, { size: 19, c: W2 });
      return { G, cells, x, h };
    });
    const dotsG = []; for (let i = 0; i < 24; i++) dotsG.push({ a: (i / 24 - .5) * .5, ph: (i * 7 % 24) / 24, c: S('circle', { r: 3.4, fill: '#ffe9a8' }, s) });
    let k = 3;
    function look() { panels.forEach((p, i) => { p.cells.forEach((c) => { c.setAttribute('opacity', (i + 1) <= k ? [1, 1 / 4 + .15, 1 / 9 + .1][i] : .05); }); p.G.style.opacity = (i + 1) <= k ? 1 : .5; }); const h = panels[k - 1]; beam.setAttribute('d', `M${sx},${sy} L${h.x},${sy - h.h} V${sy + h.h}Z`); }
    look();
    const L = loop(host, (dt) => { const x1 = panels[k - 1].x; dotsG.forEach((d) => { d.ph = (d.ph + dt * .3) % 1; const X = lerp(sx, x1, d.ph), slope = (panels[2].h / (panels[2].x - sx)) * d.a * 4; d.c.setAttribute('cx', X); d.c.setAttribute('cy', sy + (X - sx) * slope); }); });
    const bs = seg(ctl, [[1, '거리 1 배'], [2, '거리 2 배'], [3, '거리 3 배']], 3, (v) => { k = v; look(); });
    let tm = 0;
    return { play() { L.start(); clearInterval(tm); k = 1; bs.mark(1); look(); let i = 1; tm = setInterval(() => { i = i % 3 + 1; k = i; bs.mark(k); look(); }, 2000); ctl.addEventListener('click', () => clearInterval(tm), { once: true }); }, stop() { L.stop(); clearInterval(tm); } };
  }

  /* 10 pc로 옮겨 보기 (그림 Ⅷ-5) */
  function tenpc(host, ctl) {
    const g = svg(host, 760, 560); sky(g, 60); const s = g.s;
    const cx = 330, cy = 300, R = 170;
    S('circle', { cx, cy, r: R, fill: 'rgba(120,160,220,.07)', stroke: '#8bb7e6', 'stroke-width': 2, 'stroke-dasharray': '7 7' }, s);
    T(s, cx, cy - R - 14, '10 pc', { size: 24, w: 800, c: '#cfe0f4' });
    const e = S('circle', { cx, cy, r: 10, fill: g.rg('earth', [[0, '#7cc4f5'], [.6, '#2f7fc6'], [1, '#1b5293']]) }, s); T(s, cx, cy + 34, '지구', { size: 20, c: W1 });
    // 등급 → 그림 크기(모형)
    const sz = (m) => clamp(14 - (m + 1.5) * 1.7, 3, 30);
    const DATA = {
      si: { n: '시리우스', ap: -1.5, ab: 1.4, from: [cx + 92, cy - 62], to: [cx + 141, cy - 95], rel: '겉보기 등급 < 절대 등급: 10 pc보다 가까움' },
      mi: { n: '미르잠', ap: 2.0, ab: -4.1, from: [cx + 320, cy + 80], to: [cx + 162, cy + 40], rel: '겉보기 등급 > 절대 등급: 10 pc보다 멂' },
    };
    const a = star(g, s, 0, 0, 10, '#ffffff'), name = T(s, 0, 0, '', { size: 24, w: 800, c: '#fff' });
    const rd = T(s, 380, 44, '', { size: 25, w: 800, c: W1 }), rel = T(s, 380, 530, '', { size: 23, c: '#cfe0f4' });
    let cur = 'si', cancel = null;
    function pose(k) {
      const d = DATA[cur], x = lerp(d.from[0], d.to[0], k), y = lerp(d.from[1], d.to[1], k), m = lerp(d.ap, d.ab, k);
      a.at(x, y); a.size(sz(m)); name.setAttribute('x', x); name.setAttribute('y', y - sz(m) * 2 - 10); name.textContent = d.n;
      rd.textContent = k < .05 ? `지구에서 볼 때: 겉보기 ${d.ap} 등급` : k > .95 ? `10 pc로 옮기면: 절대 ${d.ab} 등급` : '10 pc 거리로 옮기는 중';
      rel.textContent = d.rel;
    }
    pose(0);
    const play = () => { cancel && cancel(); pose(0); cancel = once(3.2, (t) => pose(seq(t, .6, 2.8))); };
    seg(ctl, [['si', '시리우스'], ['mi', '미르잠']], 'si', (v) => { cur = v; play(); });
    button(ctl, '10 pc로 옮기기', play, 'go');
    return { play, stop() { cancel && cancel(); } };
  }

  /* 별의 색과 표면 온도 */
  const BAND = [['청색', '#7da7ff', '나오스'], ['청백색', '#a9c6ff', '스피카, 리겔'], ['백색', '#f3f5ff', '알타이르, 베가'], ['황백색', '#fff4c9', '프로키온, 북극성'], ['황색', '#ffdf73', '태양, 카펠라'], ['주황색', '#ffb15c', '아크투루스, 알데바란'], ['적색', '#ff7a5a', '베텔게우스, 안타레스']];
  function scolor(host, ctl) {
    const g = svg(host, 760, 560); sky(g, 40); const s = g.s;
    // 큰 별
    const mix = (k) => { const n = BAND.length - 1, i = clamp(Math.floor(k * n), 0, n - 1), u = k * n - i; const h = (c) => [1, 3, 5].map((j) => parseInt(c.substr(j, 2), 16)); const a = h(BAND[i][1]), b = h(BAND[i + 1][1]); return '#' + a.map((v, j) => Math.round(lerp(v, b[j], u)).toString(16).padStart(2, '0')).join(''); };
    const halo = S('circle', { cx: 200, cy: 180, r: 170, fill: g.glow('sch', '#ffffff') }, s), ball = S('circle', { cx: 200, cy: 180, r: 72 }, s);
    const haloStops = s.querySelectorAll('defs radialGradient:last-of-type stop');
    const lt = T(s, 200, 345, '', { size: 25, w: 800, c: W1 });
    // 빛의 양 막대
    const bB = S('rect', { x: 90, width: 90, fill: '#6f9cf0' }, s), bR = S('rect', { x: 220, width: 90, fill: '#ec6a50' }, s);
    S('line', { x1: 70, x2: 330, y1: 500, y2: 500, stroke: W2, 'stroke-width': 2 }, s);
    T(s, 135, 528, '파란색 빛', { size: 20, c: W1 }); T(s, 265, 528, '붉은색 빛', { size: 20, c: W1 });
    // 색 띠
    const X = 400, cell = 66;
    T(s, X, 34, '표면 온도 높음', { size: 20, c: '#cfe0f4', a: 'start' });
    BAND.forEach(([n, c, names], i) => { const y = 50 + i * cell; S('rect', { x: X, y, width: 14, height: cell - 6, fill: c }, s); T(s, X + 28, y + 24, n, { size: 21, w: 800, c: '#fff', a: 'start' }); T(s, X + 28, y + 50, names, { size: 19, c: '#c4d1e2', a: 'start' }); });
    T(s, X, 540, '표면 온도 낮음', { size: 20, c: '#cfe0f4', a: 'start' });
    const mk = S('path', { fill: '#fff' }, s);
    let k = .67;
    function draw() {
      const c = mix(k); ball.setAttribute('fill', c); haloStops.forEach((x) => x.setAttribute('stop-color', c));
      lt.textContent = k < .35 ? '파란색 빛을 많이 방출' : k > .7 ? '붉은색 빛을 많이 방출' : '노란빛 계열';
      const blue = lerp(120, 22, k), red = lerp(22, 120, k);
      bB.setAttribute('y', 500 - blue); bB.setAttribute('height', blue); bR.setAttribute('y', 500 - red); bR.setAttribute('height', red);
      const y = 50 + k * (7 * cell - 6); mk.setAttribute('d', `M${X - 6},${y} l-14,-9 v18Z`);
    }
    draw();
    const sl = slider(ctl, '표면 온도 낮게 ↔ 높게', 0, 1, .01, 1 - k, (v) => { k = 1 - v; draw(); });
    let cancel = null;
    return { play() { cancel && cancel(); cancel = once(3, (t) => { k = 1 - ease(t / 3); sl.value = 1 - k; draw(); }); }, stop() { cancel && cancel(); } };
  }

  /* 우리은하 (그림 Ⅷ-7): 위에서 본 모습 ↔ 옆에서 본 모습 */
  function mw(host, ctl) {
    const g = svg(host, 760, 560); sky(g, 40); const s = g.s, cx = 380, cy = 270, RR = 240, A0 = .35, K = .33, R0 = 55;
    const r = rnd32(23);
    const gauss = () => (r() + r() + r() - 1.5) / 1.5;
    const disc = S('g', {}, s);
    S('circle', { r: RR + 8, fill: g.glow('dsk', '#7f97c9'), opacity: .55 }, disc);
    const spiral = (arm, th) => { const rad = R0 * Math.exp(K * th), t = th + A0 + arm * Math.PI; return [Math.cos(t) * rad, Math.sin(t) * rad]; };
    for (let arm = 0; arm < 2; arm++) {
      let d = ''; for (let th = 0; th <= 4.25; th += .1) { const q = spiral(arm, th); d += (d ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1); }
      S('path', { d, fill: 'none', stroke: '#a9c0ea', 'stroke-width': 34, 'stroke-linecap': 'round', opacity: .14 }, disc);
      S('path', { d, fill: 'none', stroke: '#c5d6f4', 'stroke-width': 14, 'stroke-linecap': 'round', opacity: .16 }, disc);
      for (let i = 0; i < 340; i++) { const u = r(), q = spiral(arm, u * 4.25), sp = 14 + u * 20, x = q[0] + gauss() * sp, y = q[1] + gauss() * sp; S('circle', { cx: x, cy: y, r: r() * 1.5 + .6, fill: ['#cfe0ff', '#ffffff', '#a9c6ff', '#ffe6c9'][i % 4], opacity: .55 + r() * .45 }, disc); }
    }
    for (let i = 0; i < 260; i++) { const a = r() * 6.283, rad = 30 + r() * 208; S('circle', { cx: Math.cos(a) * rad, cy: Math.sin(a) * rad, r: r() * .9 + .4, fill: '#c6d4ec', opacity: .4 }, disc); }
    const bulge = S('g', {}, s);
    S('ellipse', { rx: 78, ry: 30, fill: g.glow('blg', '#ffdca6') }, bulge);
    S('ellipse', { rx: 44, ry: 15, fill: '#fff3d9', opacity: .75 }, bulge);
    const th0 = Math.log(136 / R0) / K, SUNP = spiral(0, th0);
    const d1 = S('path', { fill: 'none', stroke: '#cfe0f4', 'stroke-width': 1.8 }, s), d2 = S('line', { stroke: '#fff', 'stroke-width': 1.6, 'stroke-dasharray': '5 5' }, s);
    const sun = S('circle', { r: 6.5, fill: '#ffdf73', stroke: '#fff', 'stroke-width': 1.5 }, s), sT = T(s, 0, 0, '태양계', { size: 21, c: '#fff' });
    const t1 = T(s, cx, 536, '지름 약 30000 pc', { size: 23, w: 800, c: '#fff' }), t2 = T(s, 0, 0, '약 8500 pc', { size: 20, c: '#fff' });
    const name = T(s, cx, 40, '', { size: 26, w: 800, c: W1 });
    let tilt = 0;
    function draw() {
      const f = lerp(1, .1, tilt);
      disc.setAttribute('transform', `translate(${cx},${cy}) scale(1,${f})`);
      bulge.setAttribute('transform', `translate(${cx},${cy}) rotate(${lerp(A0 * 57.3, 0, tilt)}) scale(${lerp(1, 1.1, tilt)},${lerp(1, 1.5, tilt)})`);
      const sx = cx + SUNP[0], sy = cy + SUNP[1] * f;
      sun.setAttribute('cx', sx); sun.setAttribute('cy', sy); sT.setAttribute('x', sx); sT.setAttribute('y', sy + (SUNP[1] < 0 && tilt < .5 ? -16 : 30));
      d1.setAttribute('d', `M${cx - RR},498 V510 H${cx + RR} V498`);
      d2.setAttribute('x1', cx); d2.setAttribute('y1', cy); d2.setAttribute('x2', sx); d2.setAttribute('y2', sy);
      t2.setAttribute('x', sx + (tilt > .5 ? 68 : 30)); t2.setAttribute('y', tilt > .5 ? cy - 42 : sy - 14);
      name.textContent = tilt < .5 ? '위에서 본 모습: 막대 모양 중심부와 나선팔' : '옆에서 본 모습: 중심부가 볼록한 원반';
    }
    draw();
    let cancel = null;
    const toView = (v, dur = 1.6) => { const a = tilt, b = v === 'top' ? 0 : 1; cancel && cancel(); cancel = once(dur, (t) => { tilt = lerp(a, b, ease(t / dur)); draw(); }); };
    const bs = seg(ctl, [['top', '위에서 보기'], ['side', '옆에서 보기']], 'top', (v) => toView(v));
    let tm = 0;
    return { play() { clearTimeout(tm); cancel && cancel(); tilt = 0; bs.mark('top'); draw(); tm = setTimeout(() => { bs.mark('side'); toView('side', 2.2); }, 3000); }, stop() { clearTimeout(tm); cancel && cancel(); } };
  }

  /* 성단 */
  function cluster(host) {
    const g = svg(host, 760, 500); sky(g, 40); const s = g.s;
    const panel = (cx, n, spread, cols, name, sub, dense) => {
      const r = mkRnd(cx * 7 + 5), L = [];
      for (let i = 0; i < n; i++) {
        const a = r() * 6.283, rad = dense ? Math.pow(r(), 1.7) * spread : Math.sqrt(r()) * spread, x = cx + Math.cos(a) * rad, y = 220 + Math.sin(a) * rad;
        const sz = dense ? r() * 1.4 + 1 : r() * 3.4 + 1.6, col = cols[i % cols.length];
        const G = S('circle', { r: sz, cx: x, cy: y, fill: col, opacity: .95 }, s);
        L.push({ G, x, y, rad, a, sz });
        if (!dense && i % 3 === 0) S('circle', { cx: x, cy: y, r: sz * 3.2, fill: g.glow('c' + col.slice(1), col), opacity: .6 }, s);
      }
      T(s, cx, 410, name, { size: 27, w: 800, c: '#fff' }); T(s, cx, 444, sub, { size: 20, c: '#c4d1e2' });
      return L;
    };
    const A = panel(205, 46, 150, ['#a9c6ff', '#d8e6ff', '#7da7ff', '#ffffff'], '산개 성단', '엉성하게 모임, 파란색 별', false);
    const B = panel(555, 760, 150, ['#ffb48c', '#ffd2a8', '#ff9c7a', '#ffe5c4'], '구상 성단', '촘촘한 공 모양, 붉은색 별', true);
    const all = [...A, ...B];
    let cancel = null;
    return { play() { cancel && cancel(); cancel = once(1.8, (t) => { const k = ease(t / 1.8); all.forEach((p, i) => { const q = lerp(1.5, 1, k), cx = i < A.length ? 205 : 555; p.G.setAttribute('cx', cx + (p.x - cx) * q); p.G.setAttribute('cy', 220 + (p.y - 220) * q); }); }); }, stop() { cancel && cancel(); } };
  }

  /* 성운 세 종류 (그림 Ⅷ-8의 모형) */
  function nebula(host, ctl) {
    const g = svg(host, 760, 560); sky(g, 70); const s = g.s;
    function cloud(p, cx, cy, n, cols, seed, spread = 86) { const r = rnd32(seed); const a = []; for (let i = 0; i < n; i++) { const x = cx + (r() - .5) * spread * 2, y = cy + (r() - .5) * spread * 1.1, rr = 30 + r() * 42, c = cols[i % cols.length]; a.push(S('circle', { cx: x, cy: y, r: rr, fill: g.glow('nb' + c.slice(1), c), opacity: .75 }, p)); } return a; }
    const rows = [
      { y: 92, name: '방출 성운', sub: '별빛을 흡수 → 온도가 높아져 스스로 빛' },
      { y: 280, name: '반사 성운', sub: '별빛을 반사 → 밝게 보임' },
      { y: 468, name: '암흑 성운', sub: '뒤의 별빛을 가로막음 → 어둡게 보임' },
    ];
    const CX = 200;
    cloud(s, CX, 92, 30, ['#e8566a', '#f07c8c', '#c93f63'], 31, 80);
    cloud(s, CX, 280, 30, ['#6e9df2', '#92b8ff', '#5580d8'], 47, 80);
    S('ellipse', { cx: CX, cy: 468, rx: 170, ry: 80, fill: g.glow('nbb', '#8a6fa8'), opacity: .75 }, s);
    { const r = rnd32(9); for (let i = 0; i < 90; i++) S('circle', { cx: CX - 165 + r() * 330, cy: 400 + r() * 136, r: r() * 1.3 + .5, fill: '#fff', opacity: .85 }, s); }
    const dark = cloud(s, CX, 468, 26, ['#04070d', '#070b13'], 59, 62); dark.forEach((c) => c.setAttribute('opacity', 1));
    star(g, s, CX - 110, 92, 9, '#cfe0ff'); star(g, s, CX - 110, 280, 10, '#ffffff');
    // 암흑 성운 둘레의 별
    const back = []; [[CX - 118, 440], [CX + 112, 432], [CX + 128, 500], [CX - 122, 505]].forEach(([x, y]) => back.push(star(g, s, x, y, 4, '#ffffff')));
    rows.forEach((r) => { T(s, 340, r.y - 6, r.name, { size: 26, w: 800, c: '#fff', a: 'start' }); T(s, 340, r.y + 26, r.sub, { size: 20, c: '#c4d1e2', a: 'start' }); });
    const ps = [];
    for (let i = 0; i < 8; i++) ps.push({ k: 0, ph: i / 8, c: S('circle', { r: 3.6, fill: '#ffe9a8' }, s) });
    for (let i = 0; i < 8; i++) ps.push({ k: 1, ph: i / 8, c: S('circle', { r: 3.6, fill: '#fff4cf' }, s) });
    for (let i = 0; i < 5; i++) ps.push({ k: 2, ph: i / 5, c: S('circle', { r: 3.2, fill: '#fff' }, s) });
    const L = loop(host, (dt, t) => {
      ps.forEach((p, i) => {
        p.ph = (p.ph + dt * .42) % 1; const u = p.ph; let x, y, o = 1;
        if (p.k === 0) { x = CX - 110 + u * 140; y = 92 + Math.sin(i * 2.4) * 34 * u; o = u < .85 ? 1 : (1 - u) / .15; }
        else if (p.k === 1) { const a = Math.sin(i * 2.4) * 34; if (u < .5) { x = CX - 110 + u * 2 * 130; y = 280 + a * u * 2; } else { x = CX + 20 + (u - .5) * 2 * 100; y = 280 + a + (u - .5) * 2 * (a > 0 ? 40 : -40); } }
        else { x = CX + 8 * Math.sin(i * 3); y = 505 - u * 60; const yy = (u * 180); x = CX + 132 - yy; y = 470 + Math.sin(i * 2) * 26; o = x > CX + 72 ? 1 : 0; }
        p.c.setAttribute('cx', x); p.c.setAttribute('cy', y); p.c.setAttribute('opacity', o);
      });
      back.forEach((b, i) => b.setAttribute('opacity', .75 + .25 * Math.sin(t * 2 + i)));
    });
    T(s, 720, 548, '개념 이해를 위한 모형', { size: 18, c: W2, a: 'end' });
    return { play: L.start, stop: L.stop };
  }

  /* 풍선 모형 */
  function balloon(host, ctl) {
    const g = svg(host, 760, 560), s = g.s, cx = 380, cy = 270;
    S('ellipse', { cx, cy: 524, rx: 150, ry: 8, fill: 'rgba(20,38,59,.08)' }, s);
    const tail = S('path', { fill: '#b02f25' }, s), str = S('path', { fill: 'none', stroke: '#b5bfc9', 'stroke-width': 2 }, s);
    const body = S('ellipse', { cx, cy, fill: g.rg('bl', [[0, '#7fb6ec'], [.6, '#3f83ce'], [1, '#2a5f9e']]) }, s);
    const STK = [[-.5, -.3, '①'], [.38, -.5, '②'], [.08, .46, '③']];
    const lines = [S('line', { stroke: '#fff', 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }, s), S('line', { stroke: '#fff', 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }, s), S('line', { stroke: '#fff', 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }, s)];
    const stk = STK.map(([x, y, n]) => { const a = S('g', {}, s); S('circle', { r: 19, fill: '#fff4cf', stroke: '#e0b94a', 'stroke-width': 2 }, a); T(a, 0, 8, n, { size: 22, w: 800, c: '#6b4f05' }); return a; });
    const cap = T(s, 380, 40, '', { size: 25, w: 800, c: C.ink }), sub = T(s, 380, 548, '', { size: 21, c: C.mut });
    let bk = 0;
    function draw(k) {
      const R = lerp(85, 188, k), Ry = R * 1.08;
      body.setAttribute('rx', R); body.setAttribute('ry', Ry);
      tail.setAttribute('d', `M${cx - 11},${cy + Ry + 10} l11,-11 l11,11Z`); str.setAttribute('d', `M${cx},${cy + Ry + 10} q-6,12 3,${520 - cy - Ry - 10}`);
      const pos = STK.map(([x, y]) => [cx + x * R * 1.1, cy + y * Ry * 1.1]);
      stk.forEach((a, i) => a.setAttribute('transform', `translate(${pos[i][0]},${pos[i][1]})`));
      [[0, 1], [0, 2], [1, 2]].forEach(([a, b], i) => { const on = bk === a || bk === b; lines[i].setAttribute('x1', pos[a][0]); lines[i].setAttribute('y1', pos[a][1]); lines[i].setAttribute('x2', pos[b][0]); lines[i].setAttribute('y2', pos[b][1]); lines[i].style.visibility = on ? 'visible' : 'hidden'; });
      cap.textContent = k < .1 ? '공기를 조금 넣은 풍선' : k > .9 ? '붙임딱지는 그대로, 간격만 멀어짐' : '풍선 표면이 늘어나는 중';
      sub.textContent = `${STK[bk][2]}을 기준으로 봐도 다른 붙임딱지가 모두 멀어짐`;
    }
    let cur = 0, cancel = null;
    draw(0);
    const play = () => { cancel && cancel(); cancel = once(2.8, (t) => { cur = ease(t / 2.8); draw(cur); }); };
    button(ctl, '공기 넣기', play, 'go');
    seg(ctl, [[0, '① 기준'], [1, '② 기준'], [2, '③ 기준']], 0, (v) => { bk = v; draw(cur); });
    return { play, stop() { cancel && cancel(); } };
  }

  /* 대폭발과 팽창: 중심 없음 */
  function bang(host, ctl) {
    const g = svg(host, 760, 560); sky(g, 40); const s = g.s, cx = 380, cy = 262;
    const edge = S('circle', { cx, cy, fill: 'rgba(120,160,220,.08)', stroke: 'rgba(160,190,235,.35)', 'stroke-width': 1.5 }, s);
    const flash = S('circle', { cx, cy, r: 30, fill: g.glow('fl', '#fff2c9') }, s);
    const r = mkRnd(77), GS = [];
    for (let i = 0; i < 26; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * .92; GS.push({ x: Math.cos(a) * d, y: Math.sin(a) * d }); }
    const glx = GS.map((p, i) => { const G = S('g', {}, s); S('ellipse', { rx: 11, ry: 5, fill: g.glow('gx' + (i % 3), ['#cfe0ff', '#ffe6c9', '#ffffff'][i % 3]), transform: `rotate(${i * 47})` }, G); S('circle', { r: 1.6, fill: '#fff' }, G); return G; });
    const refs = [3, 11, 19];
    const hi = S('circle', { r: 16, fill: 'none', stroke: '#fff', 'stroke-width': 2 }, s);
    const as = []; for (let i = 0; i < 6; i++) as.push(arrow(s, { c: '#9cc7f2', w: 2, head: 9 }));
    // 시간 띠
    S('line', { x1: 120, x2: 640, y1: 516, y2: 516, stroke: '#7d90a8', 'stroke-width': 2 }, s);
    T(s, 120, 546, '대폭발(약 138억 년 전)', { size: 19, c: W1, a: 'start' }); T(s, 640, 546, '현재', { size: 19, c: W1, a: 'end' });
    const tick = S('circle', { cy: 516, r: 8, fill: '#fff' }, s);
    const cap = T(s, cx, 34, '', { size: 23, w: 800, c: W1 });
    let k = 1, ri = 0;
    function draw() {
      const R = lerp(0, 220, k);
      edge.setAttribute('r', R); flash.setAttribute('opacity', 1 - clamp(k * 5, 0, 1)); flash.setAttribute('r', 30 + k * 200);
      glx.forEach((G, i) => { G.setAttribute('transform', `translate(${cx + GS[i].x * R},${cy + GS[i].y * R}) scale(${clamp(k * 3, .05, 1)})`); G.style.visibility = k > .06 ? 'visible' : 'hidden'; });
      tick.setAttribute('cx', lerp(120, 640, k));
      const o = GS[refs[ri]], ox = cx + o.x * R, oy = cy + o.y * R; hi.setAttribute('cx', ox); hi.setAttribute('cy', oy); hi.style.visibility = k > .4 ? 'visible' : 'hidden';
      const near = GS.map((p, i) => [Math.hypot(p.x - o.x, p.y - o.y), i]).filter((q) => q[1] !== refs[ri]).sort((a, b) => a[0] - b[0]).slice(0, 6);
      as.forEach((a, i) => { const p = GS[near[i][1]], X = cx + p.x * R, Y = cy + p.y * R, dx = X - ox, dy = Y - oy, l = Math.hypot(dx, dy) || 1; const show = k > .75; a.style.visibility = show ? 'visible' : 'hidden'; if (show) a.set(X, Y, X + dx / l * 30, Y + dy / l * 30); });
      cap.textContent = k < .06 ? '온도와 밀도가 매우 높은 한 점' : k < .75 ? '우주 공간이 점점 팽창함' : '어느 은하에서 봐도 대부분의 은하가 멀어짐';
    }
    draw();
    let cancel = null;
    const play = () => { cancel && cancel(); cancel = once(4, (t) => { k = ease(t / 4); draw(); }); };
    button(ctl, '다시 팽창하기', play, 'go');
    seg(ctl, [[0, '은하 A에서 보기'], [1, '은하 B에서 보기'], [2, '은하 C에서 보기']], 0, (v) => { ri = v; draw(); });
    T(s, 720, 490, '은하의 수·크기는 모형', { size: 17, c: W2, a: 'end' });
    return { play, stop() { cancel && cancel(); } };
  }

  /* 지구와 인공위성, 우주 정거장 */
  function earth(host) {
    const g = svg(host, 760, 560); sky(g, 90); const s = g.s, cx = 380, cy = 300;
    S('circle', { cx, cy, r: 132, fill: g.rg('eb', [[0, '#7cc4f5'], [.55, '#2f7fc6'], [1, '#143f77']]) }, s);
    [['M300,240 q30,-40 70,-22 q24,18 -6,44 q-36,22 -60,0Z', '#67ad5c'], ['M400,330 q40,-20 62,6 q6,34 -28,40 q-30,4 -34,-22Z', '#5d9f52'], ['M300,350 q20,-8 28,12 q-4,18 -22,12Z', '#73b566']].forEach(([d, c]) => S('path', { d, fill: c }, s));
    S('path', { d: 'M270,270 q40,-14 90,-4 M360,240 q40,-8 70,8 M300,380 q40,10 90,-4', stroke: 'rgba(255,255,255,.75)', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, s);
    const O1 = { rx: 240, ry: 96 }, O2 = { rx: 188, ry: 188 };
    S('ellipse', { cx, cy, rx: O1.rx, ry: O1.ry, fill: 'none', stroke: 'rgba(170,195,230,.4)', 'stroke-width': 1.5, transform: `rotate(-18 ${cx} ${cy})` }, s);
    S('circle', { cx, cy, r: O2.rx, fill: 'none', stroke: 'rgba(170,195,230,.28)', 'stroke-width': 1.5 }, s);
    const sat = S('g', {}, s);
    S('rect', { x: -32, y: -7, width: 24, height: 14, fill: '#3e6ea8' }, sat); S('rect', { x: 8, y: -7, width: 24, height: 14, fill: '#3e6ea8' }, sat); S('rect', { x: -8, y: -10, width: 16, height: 20, rx: 2, fill: '#d6dde4' }, sat);
    const iss = S('g', {}, s);
    S('rect', { x: -40, y: -2, width: 80, height: 4, fill: '#c9d2da' }, iss); [-34, -20, 20, 34].forEach((x) => S('rect', { x: x - 5, y: -18, width: 10, height: 36, fill: '#4f7fb5' }, iss)); S('rect', { x: -10, y: -7, width: 20, height: 14, rx: 3, fill: '#e6ebef' }, iss);
    const lines = ['일기 예보', '위치 정보(GPS)', '방송과 통신', '우주 정거장: 식물 생장, 신소재 개발 실험'];
    const cap = T(s, 380, 44, '인공위성: ' + lines[0], { size: 25, w: 800, c: '#fff' });
    let i = 0, tm = 0;
    const L = loop(host, (dt, t) => {
      const a = t * .55, x = Math.cos(a) * O1.rx, y = Math.sin(a) * O1.ry, ca = Math.cos(-.314), sa = Math.sin(-.314);
      sat.setAttribute('transform', `translate(${cx + x * ca - y * sa},${cy + x * sa + y * ca}) rotate(-18)`);
      const b = t * .3 + 2; iss.setAttribute('transform', `translate(${cx + Math.cos(b) * O2.rx},${cy + Math.sin(b) * O2.rx})`);
    });
    const show = () => { cap.textContent = i < 3 ? '인공위성: ' + lines[i] : lines[3]; };
    return { play() { L.start(); clearInterval(tm); tm = setInterval(() => { i = (i + 1) % 4; show(); }, 2400); }, stop() { L.stop(); clearInterval(tm); } };
  }

  /* 탐사 성과 (그림 Ⅷ-11) */
  const MIS = [
    ['sun', '파커 태양 탐사선', '태양에 접근하여 태양 코로나를 관측'],
    ['sun', '태양 궤도선', '태양의 극지방을 관측'],
    ['moon', '아폴로 계획', '총 11차례 유인 우주선 발사, 이 중 6번 달에 착륙'],
    ['moon', '아르테미스 계획', '새로운 유인 달 탐사, 우리나라도 참여'],
    ['moon', '다누리', '우리나라의 달 탐사선, 달-지구 간 인터넷 통신 성공'],
    ['mars', '큐리오시티', '2012년 화성에 착륙한 탐사차'],
    ['jup', '주노', '목성 탐사선'],
    ['sat', '카시니-하위헌스', '토성 탐사선'],
    ['nep', '보이저 2호', '1977년 발사, 목성·토성·천왕성·해왕성을 지나 태양계를 벗어남'],
    ['com', '로제타', '혜성에 탐사 로봇 필레를 착륙시켜 표면을 직접 탐사'],
    ['com', '딥 임팩트호', '혜성에 충돌체를 떨어뜨려 구성 물질을 조사'],
  ];
  function missions(host, ctl) {
    const g = svg(host, 760, 540); sky(g, 70); const s = g.s, Y = 230;
    S('circle', { cx: -40, cy: Y, r: 130, fill: g.rg('sn', [[0, '#fff0b8'], [.6, '#ffc94f'], [1, '#f09a2b']]) }, s);
    const body = (x, r, c1, c2, n, y = Y) => { S('circle', { cx: x, cy: y, r, fill: g.rg('pl' + n, [[0, c1], [1, c2]]) }, s); T(s, x, y + r + 28, n, { size: 19, c: W1 }); };
    const P = { sun: [70, Y], moon: [215, Y - 58], mars: [292, Y], jup: [395, Y], sat: [510, Y], nep: [688, Y], com: [330, 110] };
    body(180, 16, '#7cc4f5', '#1f5ea9', '지구'); body(P.moon[0], 8, '#e6e6e6', '#9a9a9a', '달', P.moon[1]);
    body(P.mars[0], 12, '#ee9a6a', '#b4532c', '화성'); body(P.jup[0], 38, '#ecd2ad', '#b98a57', '목성');
    S('ellipse', { cx: P.sat[0], cy: Y, rx: 58, ry: 11, fill: 'none', stroke: '#d9c79c', 'stroke-width': 4, transform: `rotate(-14 ${P.sat[0]} ${Y})` }, s);
    body(P.sat[0], 30, '#f1deb4', '#c6a56b', '토성'); body(610, 20, '#bfeaf0', '#6fb5c4', '천왕성'); body(P.nep[0], 20, '#8db4f5', '#3a60c0', '해왕성');
    // 혜성
    S('path', { d: `M${P.com[0]},${P.com[1]} L${P.com[0] + 90},${P.com[1] - 28} L${P.com[0] + 90},${P.com[1] + 16}Z`, fill: g.lg('tail', [[0, 'rgba(220,235,255,.8)'], [1, 'rgba(220,235,255,0)']], 1, 0) }, s);
    S('circle', { cx: P.com[0], cy: P.com[1], r: 9, fill: '#dfe7f2' }, s); T(s, P.com[0], P.com[1] - 18, '혜성', { size: 19, c: W1 });
    const ship = S('g', {}, s); S('rect', { x: -5, y: -6, width: 10, height: 12, fill: '#f3d27a' }, ship); S('rect', { x: -16, y: -3, width: 10, height: 6, fill: '#6c94c9' }, ship); S('rect', { x: 6, y: -3, width: 10, height: 6, fill: '#6c94c9' }, ship);
    const trail = S('line', { x1: 180, y1: Y, stroke: '#ffe9a8', 'stroke-width': 1.8, 'stroke-dasharray': '4 6' }, s);
    const n1 = T(s, 380, 400, '', { size: 28, w: 800, c: '#fff' }), n2 = T(s, 380, 438, '', { size: 21, c: '#cfe0f4' });
    let i = 0, cancel = null, tm = 0;
    function pick(k) {
      i = k; const [t, a, b] = MIS[k]; n1.textContent = a; n2.textContent = b;
      const P0 = P[t]; cancel && cancel();
      const fly = (u) => { const x = lerp(180, P0[0], u), y = lerp(Y, P0[1] - 26, u) - Math.sin(u * 3.14) * 44; ship.setAttribute('transform', `translate(${x},${y})`); trail.setAttribute('x2', x); trail.setAttribute('y2', y); };
      cancel = once(1.1, (tt) => fly(ease(tt / 1.1)));
    }
    pick(0);
    const prev = button(ctl, '이전 탐사', () => { clearInterval(tm); pick((i + MIS.length - 1) % MIS.length); });
    const next = button(ctl, '다음 탐사', () => { clearInterval(tm); pick((i + 1) % MIS.length); }, 'go');
    return { play() { clearInterval(tm); pick(0); tm = setInterval(() => pick((i + 1) % MIS.length), 3000); }, stop() { clearInterval(tm); cancel && cancel(); } };
  }

  Object.assign(EX, { para, annual, mag, inv, tenpc, scolor, mw, cluster, nebula, balloon, bang, earth, missions });
})();
