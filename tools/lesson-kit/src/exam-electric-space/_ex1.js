/* ===== 시험 대비 그림 도구 1: 공통 + Ⅶ 전기와 자기 (SVG) =====
   EX.이름(host, ctl, 옵션): host에 그림, ctl에 조작 버튼을 넣고 { play, stop }을 돌려줘요.
   장에 들어오면 play가 자동으로 불려요. 빠르기·각도·알갱이 수는 보기 좋게 정한 모형이에요.
   (−)전하는 파란 동그라미, (+)전하는 짙은 회색 테두리 동그라미(마찰 전기 수업 CHG와 같음). */
window.EX = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const C = { ink: '#14263b', ink2: '#34495e', mut: '#5a6b7e', line: '#c9d5df', pale: '#f1f5f8', blue: '#0e63b3', cu: '#c8824a', sky: '#0b1526', red: '#d64a3a', mag: '#2f6fc4' };
  const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => k * k * (3 - 2 * k);
  function S(tag, a, p) { const e = document.createElementNS(NS, tag); for (const k in a || {}) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function T(p, x, y, s, o = {}) {
    const e = S('text', { x, y, 'font-size': o.size || 20, 'font-weight': o.w || 700, fill: o.c || C.ink2, 'text-anchor': o.a || 'middle', 'font-family': 'Pretendard,Malgun Gothic,sans-serif' }, p);
    e.textContent = s; return e;
  }
  let uid = 0;
  function svg(host, w, h, bg = '#fff') {
    const s = S('svg', { viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: 'xMidYMid meet', role: 'img' }, host);
    host.style.background = bg;
    const defs = S('defs', {}, s), id = 'x' + (++uid);
    const seen = {};
    const lg = (n, st, x2 = 0, y2 = 1) => { if (!seen[n]) { const g = S('linearGradient', { id: id + n, x1: 0, y1: 0, x2, y2 }, defs); st.forEach(([o, c]) => S('stop', { offset: o, 'stop-color': c }, g)); seen[n] = 1; } return `url(#${id + n})`; };
    const rg = (n, st, fx = .36, fy = .3) => { if (!seen[n]) { const g = S('radialGradient', { id: id + n, cx: .5, cy: .5, r: .62, fx, fy }, defs); st.forEach(([o, c]) => S('stop', { offset: o, 'stop-color': c }, g)); seen[n] = 1; } return `url(#${id + n})`; };
    const glow = (n, c) => { if (!seen[n]) { const g = S('radialGradient', { id: id + n }, defs); [[0, c, 1], [.25, c, .75], [.6, c, .18], [1, c, 0]].forEach(([o, col, a]) => S('stop', { offset: o, 'stop-color': col, 'stop-opacity': a }, g)); seen[n] = 1; } return `url(#${id + n})`; };
    return { s, lg, rg, glow, w, h };
  }
  function button(ctl, label, fn, cls = '') { const b = document.createElement('button'); b.type = 'button'; b.className = 'ctl ' + cls; b.textContent = label; b.addEventListener('click', fn); ctl.appendChild(b); return b; }
  function slider(ctl, label, min, max, step, val, fn) {
    const l = document.createElement('label'); l.textContent = label;
    const i = document.createElement('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = val; i.setAttribute('aria-label', label);
    i.addEventListener('input', () => fn(+i.value)); l.appendChild(i); ctl.appendChild(l); return i;
  }
  const seg = (ctl, items, cur, fn) => { const mark = (v) => bs.forEach((x, i) => x.setAttribute('aria-pressed', String(items[i][0] === v))); const bs = items.map(([v, t]) => { const b = button(ctl, t, () => { mark(v); fn(v); }); b.setAttribute('aria-pressed', String(v === cur)); return b; }); bs.mark = mark; return bs; };
  /* 계속 도는 그림: 화면에 없으면 쉬어요 */
  function loop(host, step) {
    let live = false, last = 0, id = 0;
    const f = (now) => { if (!live) return; const dt = Math.min(.05, (now - last) / 1000 || 0); last = now; if (host.offsetParent !== null || host.clientWidth) step(dt, now / 1000); id = requestAnimationFrame(f); };
    return { start() { if (live) return; live = true; last = performance.now(); if (REDUCE) { step(0.6, 1); live = false; return; } id = requestAnimationFrame(f); }, stop() { live = false; cancelAnimationFrame(id); } };
  }
  /* 시간표대로 한 번 재생: tl(시간)을 dur초 동안 불러요 */
  function once(dur, tl, done) {
    if (REDUCE) { tl(dur); done && done(); return () => {}; }
    let t0 = 0, live = true;
    const f = (now) => { if (!live) return; if (!t0) t0 = now; const t = Math.min(dur, (now - t0) / 1000); tl(t); if (t < dur) requestAnimationFrame(f); else done && done(); };
    requestAnimationFrame(f);
    return () => { live = false; };
  }
  const seq = (t, a, b) => ease(clamp((t - a) / (b - a), 0, 1));
  /* 끝점 기준 화살표: 머리를 끝점에 맞춘 삼각형 */
  function arrow(p, o = {}) {
    const g = S('g', {}, p), c = o.c || C.ink, w = o.w || 3, h = o.head || 12;
    const ln = S('line', { stroke: c, 'stroke-width': w, 'stroke-linecap': 'round' }, g), hd = S('path', { fill: c }, g);
    g.set = (x1, y1, x2, y2) => {
      const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L, bx = x2 - ux * h, by = y2 - uy * h, nx = -uy * h * .55, ny = ux * h * .55;
      ln.setAttribute('x1', x1); ln.setAttribute('y1', y1); ln.setAttribute('x2', bx); ln.setAttribute('y2', by);
      hd.setAttribute('d', `M${x2},${y2} L${bx + nx},${by + ny} L${bx - nx},${by - ny}Z`);
      return g;
    };
    return g;
  }
  /* 전하 기호 */
  function chg(p, x, y, kind, r = 13) {
    const g = S('g', { transform: `translate(${x},${y})` }, p);
    if (kind === '-') { S('circle', { r, fill: C.blue }, g); S('line', { x1: -r * .5, x2: r * .5, y1: 0, y2: 0, stroke: '#fff', 'stroke-width': r * .24, 'stroke-linecap': 'round' }, g); }
    else { S('circle', { r, fill: '#fff', stroke: '#47566a', 'stroke-width': r * .16 }, g); S('path', { d: `M${-r * .5},0 H${r * .5} M0,${-r * .5} V${r * .5}`, stroke: '#47566a', 'stroke-width': r * .2, 'stroke-linecap': 'round' }, g); }
    g.at = (X, Y) => g.setAttribute('transform', `translate(${X},${Y})`);
    return g;
  }
  /* 전선 위 알갱이: 꺾은선 길을 따라 움직여요 */
  function dots(p, pts, n, o = {}) {
    let L = 0; const seg0 = [];
    for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg0.push([L, l, pts[i], pts[i + 1]]); L += l; }
    const at = (d) => { d = ((d % L) + L) % L; for (const [s, l, a, b] of seg0) if (d <= s + l) { const k = (d - s) / (l || 1); return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; } return pts[0]; };
    const ds = []; for (let i = 0; i < n; i++) ds.push(S('circle', { r: o.r || 5, fill: o.c || C.blue }, p));
    let ph = 0;
    return { tick(dt, sp) { ph += dt * sp; ds.forEach((c, i) => { const q = at(ph + (i * L) / n); c.setAttribute('cx', q[0]); c.setAttribute('cy', q[1]); }); }, show(v) { ds.forEach((c) => c.setAttribute('visibility', v ? 'visible' : 'hidden')); } };
  }
  const poly = (p, pts, o = {}) => S('polyline', { points: pts.map((q) => q.join(',')).join(' '), fill: 'none', stroke: o.c || '#3c4a5a', 'stroke-width': o.w || 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, p);
  /* 전지(옆으로 누운 건전지 그림): 오른쪽이 (+)극 */
  function battery(g, p, x, y, w = 92, h = 36, flip) {
    const a = S('g', { transform: `translate(${x},${y})${flip ? ' scale(-1,1)' : ''}` }, p);
    S('ellipse', { cx: 0, cy: h / 2 + 7, rx: w / 2 + 2, ry: 5, fill: 'rgba(20,38,59,.1)' }, a);
    S('rect', { x: -w / 2, y: -h / 2, width: w * .72, height: h, rx: 4, fill: g.lg('bat1', [[0, '#3b4c60'], [.45, '#2a3849'], [1, '#1a2533']]) }, a);
    S('rect', { x: -w / 2 + w * .72, y: -h / 2, width: w * .28, height: h, rx: 3, fill: g.lg('bat2', [[0, '#e6b84f'], [.45, '#d59e30'], [1, '#a97818']]) }, a);
    S('rect', { x: w / 2, y: -5, width: 6, height: 10, rx: 1.5, fill: '#8d98a4' }, a);
    return a;
  }
  /* 전구: set(밝기 0~1) */
  function bulb(g, p, x, y, r = 34) {
    const a = S('g', { transform: `translate(${x},${y})` }, p);
    const gl = S('circle', { r: r * 2, fill: g.glow('bulbg', '#ffd65a'), opacity: 0 }, a);
    S('rect', { x: -r * .42, y: r * .78, width: r * .84, height: r * .62, rx: 3, fill: g.lg('cap', [[0, '#c6ccd2'], [.5, '#e9ecef'], [1, '#9ca5ad']], 1, 0) }, a);
    for (let i = 0; i < 2; i++) S('line', { x1: -r * .42, x2: r * .42, y1: r * (.98 + i * .2), y2: r * (.98 + i * .2), stroke: '#868f98', 'stroke-width': 1.3 }, a);
    const gs = S('circle', { r, fill: '#eef2f5', stroke: '#9fadba', 'stroke-width': 2 }, a);
    const fil = S('path', { d: `M${-r * .3},${r * .8} L${-r * .22},${-r * .1} q${r * .11},${-r * .22} ${r * .22},0 q${r * .11},${r * .22} ${r * .22},0 L${r * .3},${r * .8}`, fill: 'none', stroke: '#6c7886', 'stroke-width': 2 }, a);
    a.set = (k) => { gl.setAttribute('opacity', k); gs.setAttribute('fill', k > .02 ? `rgb(255,${Math.round(lerp(238, 226, k))},${Math.round(lerp(245, 130, k))})` : '#eef2f5'); fil.setAttribute('stroke', k > .02 ? '#e08a1e' : '#6c7886'); };
    return a;
  }
  /* 끝 ---- 그림들 ---- */

  /* 표지: 위는 밤하늘, 아래는 불 켜진 회로 */
  function cover(host) {
    const g = svg(host, 760, 720), s = g.s;
    S('rect', { width: 760, height: 420, fill: g.lg('cs', [[0, '#070f1e'], [1, '#14233d']]) }, s);
    const band = S('g', { transform: 'rotate(-14 380 190)' }, s);
    S('ellipse', { cx: 380, cy: 190, rx: 480, ry: 58, fill: g.glow('mwb', '#8ea6d6'), opacity: .55 }, band);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const tw = [];
    for (let i = 0; i < 170; i++) { const inB = i < 95; const x = rnd() * 760, y = inB ? 190 + (rnd() - .5) * (rnd() * 150) + (380 - x) * .25 : rnd() * 380, r = rnd() * rnd() * 2.3 + .4; const c = S('circle', { cx: x, cy: clamp(y, 2, 376), r, fill: ['#fff', '#ffe9c4', '#cfe0ff', '#ffc9b8'][i % 4], opacity: .4 + rnd() * .6 }, s); if (i % 5 === 0) tw.push(c); }
    [[150, 90, 26, '#ffd9b8'], [610, 70, 32, '#bcd2ff'], [470, 230, 22, '#fff1cf']].forEach(([x, y, r, c]) => { S('circle', { cx: x, cy: y, r, fill: g.glow('st' + c.slice(1), c) }, s); S('circle', { cx: x, cy: y, r: r * .16, fill: '#fff' }, s); });
    S('rect', { y: 420, width: 760, height: 300, fill: '#fff' }, s);
    const W = [[150, 660], [150, 510], [610, 510], [610, 660], [150, 660]];
    poly(s, W, { w: 5 });
    const d = dots(s, W, 18, { r: 5 });
    battery(g, s, 380, 660, 120, 42);
    const b = bulb(g, s, 380, 490, 40); b.set(.85);
    const L = loop(host, (dt, t) => { d.tick(dt, 60); tw.forEach((c, i) => c.setAttribute('opacity', .5 + .4 * Math.sin(t * 1.5 + i))); });
    d.tick(0, 0);
    return { play: L.start, stop: L.stop };
  }

  /* 원자: 원자핵 +6, 전자 6개 (그림 Ⅶ-1) */
  function atom(host) {
    const g = svg(host, 760, 560), s = g.s, cx = 380, cy = 270;
    const orbits = [[110, 2], [195, 4]];
    orbits.forEach(([r]) => S('circle', { cx, cy, r, fill: 'none', stroke: '#c9d5df', 'stroke-width': 1.6 }, s));
    S('circle', { cx, cy, r: 50, fill: g.rg('nuc', [[0, '#fbe3c2'], [.6, '#efb56d'], [1, '#d38a3f']]) }, s);
    T(s, cx, cy + 12, '+6', { size: 36, w: 800, c: '#5a3513' });
    T(s, cx, cy + 78, '원자핵', { size: 22, c: C.ink });
    const es = []; orbits.forEach(([r, n], k) => { for (let i = 0; i < n; i++) es.push({ r, a: (i / n) * 6.283 + k, sp: k ? .55 : .85, g: chg(s, 0, 0, '-', 15) }); });
    const lb = T(s, 0, 0, '전자', { size: 22, c: C.blue });
    const draw = () => { es.forEach((e) => e.g.at(cx + Math.cos(e.a) * e.r, cy + Math.sin(e.a) * e.r)); lb.setAttribute('x', cx + Math.cos(es[5].a) * es[5].r); lb.setAttribute('y', cy + Math.sin(es[5].a) * es[5].r - 24); };
    T(s, 380, 530, '(+)전하량 = (−)전하량 → 전기를 띠지 않음', { size: 24, c: C.ink });
    draw();
    const L = loop(host, (dt) => { es.forEach((e) => { e.a += e.sp * dt; }); draw(); });
    return { play: L.start, stop: L.stop };
  }

  /* 털과 풍선 (그림 Ⅶ-2): 마찰 전 → 마찰 → 마찰 후 */
  function rub(host, ctl) {
    const g = svg(host, 760, 560), s = g.s;
    const cap = T(s, 380, 50, '마찰 전', { size: 28, w: 800, c: C.ink });
    const sub = T(s, 380, 84, '털과 풍선은 전기를 띠지 않음', { size: 22, c: C.mut });
    // 털
    const fur = S('g', {}, s);
    S('ellipse', { cx: 210, cy: 468, rx: 150, ry: 12, fill: 'rgba(20,38,59,.1)' }, fur);
    S('path', { d: 'M90,180 C120,150 300,150 330,180 C350,260 350,380 330,450 C290,480 130,480 90,450 C70,380 70,260 90,180Z', fill: g.lg('fur', [[0, '#c9a06f'], [1, '#9f7545']]) }, fur);
    for (let i = 0; i < 120; i++) { const x = 92 + (i * 37) % 236, y = 170 + (i * 61) % 295, l = 12 + (i % 5) * 2; S('path', { d: `M${x},${y} q${(i % 3) - 1},${l * .6} ${(i % 5) - 2},${l}`, stroke: i % 2 ? '#8a6238' : '#dcb98a', 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round' }, fur); }
    // 풍선
    const bal = S('g', {}, s);
    S('ellipse', { cx: 550, cy: 468, rx: 110, ry: 10, fill: 'rgba(20,38,59,.1)' }, bal);
    S('path', { d: 'M550,430 q-6,16 4,40', stroke: '#b5bfc9', 'stroke-width': 2, fill: 'none' }, bal);
    S('ellipse', { cx: 550, cy: 290, rx: 118, ry: 142, fill: g.rg('bal', [[0, '#f27f6f'], [.6, '#dd4c3d'], [1, '#b02f25']]) }, bal);
    S('path', { d: 'M538,430 l12,-10 l12,10 l-12,6Z', fill: '#b02f25' }, bal);
    // 전하: 털 안 6쌍, 풍선 안 6쌍
    const P1 = [[140, 230], [270, 230], [140, 315], [270, 315], [140, 400], [270, 400]], M1 = [[180, 260], [240, 260], [180, 345], [240, 345], [180, 425], [240, 425]];
    const P2 = [[495, 210], [605, 210], [480, 300], [620, 300], [510, 385], [590, 385]], M2 = [[530, 240], [570, 240], [520, 330], [580, 330], [545, 410], [550, 180]];
    const pf = P1.map(([x, y]) => chg(fur, x, y, '+', 15)), pb = P2.map(([x, y]) => chg(bal, x, y, '+', 15));
    const mb = M2.map(([x, y]) => chg(bal, x, y, '-', 15));
    const mf = M1.map(([x, y]) => chg(s, x, y, '-', 15));
    const moved = [0, 2, 4], tgt = [[412, 255], [490, 290], [568, 255]];
    const ar = arrow(s, { c: C.ink, w: 2.5 }); ar.style.visibility = 'hidden';
    const lab = T(s, 380, 520, '', { size: 24, c: C.ink });
    function pose(t) {
      // t: 0~1.5 마찰 전, 1.5~4 문지름, 4~5.5 떨어져 끌림
      const rubK = seq(t, 1.5, 2) * (1 - seq(t, 3.6, 4.2));
      const dx = -rubK * 120 + rubK * 18 * Math.sin((t - 1.5) * 9);
      bal.setAttribute('transform', `translate(${dx},0)`);
      const jump = (i) => seq(t, 2.1 + i * .45, 2.6 + i * .45);
      mf.forEach((m, i) => {
        const j = moved.indexOf(i);
        if (j < 0) { m.at(M1[i][0], M1[i][1]); return; }
        const k = jump(j), X = lerp(M1[i][0], tgt[j][0] + dx + 60, k), Y = lerp(M1[i][1], tgt[j][1], k);
        m.at(X - (k > 0 ? 0 : 0), Y);
      });
      if (t < 1.5) { cap.textContent = '마찰 전'; sub.textContent = '털과 풍선은 전기를 띠지 않음'; lab.textContent = ''; ar.style.visibility = 'hidden'; }
      else if (t < 4) { cap.textContent = '마찰'; sub.textContent = '털에서 풍선으로 일부 전자가 이동함'; lab.textContent = ''; ar.style.visibility = 'hidden'; }
      else { cap.textContent = '마찰 후'; sub.textContent = '털 (+)전하, 풍선 (−)전하'; lab.textContent = '서로 끌어당기는 힘(인력)이 작용함'; }
    }
    pose(0);
    let cancel = null;
    const play = () => { cancel && cancel(); cancel = once(5, pose); };
    button(ctl, '다시 문지르기', play, 'go');
    return { play, stop() { cancel && cancel(); } };
  }

  /* 매단 두 공: 척력과 인력 */
  function force(host) {
    const g = svg(host, 760, 560), s = g.s;
    S('rect', { x: 40, y: 58, width: 680, height: 12, rx: 3, fill: g.lg('rod', [[0, '#c0c8d0'], [1, '#8d98a4']]) }, s);
    function pair(cx, a, b, name, sub, sign, half) {
      const L = 270, g1 = S('g', {}, s), g2 = S('g', {}, s), x1 = cx - half, x2 = cx + half, Y = 70;
      const l1 = S('line', { x1, y1: Y, stroke: '#7c8896', 'stroke-width': 1.8 }, g1), l2 = S('line', { x1: x2, y1: Y, stroke: '#7c8896', 'stroke-width': 1.8 }, g2);
      const col = (k) => k === '-' ? ['#7db3ea', '#3e86d4', '#1f5ea9'] : ['#f6c9a0', '#e6975a', '#b86a2f'];
      const mk = (k) => { const q = S('g', {}, s); S('circle', { r: 30, fill: g.rg('pb' + k, [[0, col(k)[0]], [.6, col(k)[1]], [1, col(k)[2]]]) }, q); chg(q, 0, 0, k, 13); return q; };
      const b1 = mk(a), b2 = mk(b);
      T(s, cx, 440, name, { size: 30, w: 800, c: C.ink }); T(s, cx, 476, sub, { size: 21, c: C.mut });
      return (k) => {
        const th = k * .27 * sign, a1 = -th, a2 = th;
        const X1 = x1 + Math.sin(a1) * L, Y1 = Y + Math.cos(a1) * L, X2 = x2 + Math.sin(a2) * L, Y2 = Y + Math.cos(a2) * L;
        l1.setAttribute('x2', X1); l1.setAttribute('y2', Y1); l2.setAttribute('x2', X2); l2.setAttribute('y2', Y2);
        b1.setAttribute('transform', `translate(${X1},${Y1})`); b2.setAttribute('transform', `translate(${X2},${Y2})`);
      };
    }
    const A = pair(200, '-', '-', '척력', '같은 종류의 전하: 밀어냄', 1, 34), B = pair(560, '+', '-', '인력', '다른 종류의 전하: 끌어당김', -.42, 74);
    const set = (k) => { A(k); B(k); };
    set(1);
    let cancel = null;
    const play = () => { cancel && cancel(); cancel = once(2.6, (t) => { const u = t / 2.6; set(1 + (Math.exp(-u * 4) * Math.cos(u * 18) * -1)); }); };
    return { play, stop() { cancel && cancel(); } };
  }

  /* 금속 캔 정전기 유도 (그림 Ⅶ-3) */
  function can(host, ctl) {
    const g = svg(host, 760, 540), s = g.s, Y = 400;
    S('rect', { y: Y, width: 760, height: 24, fill: g.lg('tb', [[0, '#dcb78a'], [1, '#c29465']]) }, s);
    S('rect', { y: Y + 24, width: 760, height: 10, fill: '#a97c4f' }, s);
    const cg = S('g', {}, s);
    S('ellipse', { cx: 0, cy: 6, rx: 95, ry: 7, fill: 'rgba(20,38,59,.16)' }, cg);
    S('rect', { x: -90, y: -180, width: 180, height: 176, rx: 12, fill: g.lg('can', [[0, '#a9b4bf'], [.3, '#e6ebef'], [.65, '#c7d0d8'], [1, '#8f9ba7']], 1, 0) }, cg);
    S('ellipse', { cx: 0, cy: -180, rx: 90, ry: 13, fill: '#dfe5ea', stroke: '#9aa6b1' }, cg);
    const P = [], M = [];
    for (let i = 0; i < 6; i++) { const x = -60 + (i % 3) * 60, y = -130 + Math.floor(i / 3) * 76; P.push(chg(cg, x, y, '+', 13)); }
    for (let i = 0; i < 6; i++) { const x = -60 + (i % 3) * 60 + 22, y = -130 + Math.floor(i / 3) * 76 + 26; M.push({ x, y, g: chg(cg, x, y, '-', 13) }); }
    const rod = S('g', {}, s);
    S('rect', { x: 0, y: -15, width: 300, height: 30, rx: 8, fill: g.lg('rd', [[0, '#7a5bb0'], [.4, '#5d4192'], [1, '#402b6d']]) }, rod);
    const rc = [];
    let mode = '-';
    const label = T(s, 380, 62, '', { size: 26, w: 800, c: C.ink }), l2 = T(s, 380, 98, '', { size: 21, c: C.mut });
    const near = T(s, 0, 0, '가까운 쪽', { size: 20, c: C.ink2 }), far = T(s, 0, 0, '먼 쪽', { size: 20, c: C.ink2 });
    function buildRod() { rc.forEach((x) => x.remove()); rc.length = 0; for (let i = 0; i < 5; i++) rc.push(chg(rod, 28 + i * 54, 0, mode, 11)); }
    buildRod();
    function pose(t) {
      const r = seq(t, .3, 1.6), x0 = 620, xr = lerp(x0, 440, r);
      rod.setAttribute('transform', `translate(${xr},${Y - 95})`);
      const shift = seq(t, 1, 2.2), roll = seq(t, 2.3, 3.6);
      const cx = lerp(210, 320, roll);
      cg.setAttribute('transform', `translate(${cx},${Y})`);
      // (−) 막대: 전자가 먼 쪽(왼쪽)으로 / (+) 막대: 가까운 쪽(오른쪽)으로
      const dir = mode === '-' ? -1 : 1;
      M.forEach((e, i) => { const tx = (dir < 0 ? -72 : 18) + (i % 3) * 27; e.g.at(lerp(e.x, tx, shift), e.y); });
      near.setAttribute('x', cx + 56); near.setAttribute('y', Y - 196); far.setAttribute('x', cx - 56); far.setAttribute('y', Y - 196);
      const v = shift > .5 ? 'visible' : 'hidden'; near.style.visibility = v; far.style.visibility = v;
      if (t < 1) { label.textContent = mode === '-' ? '(−)전하로 대전된 막대를 가까이 함' : '(+)전하로 대전된 막대를 가까이 함'; l2.textContent = ''; }
      else if (t < 2.3) { label.textContent = mode === '-' ? '전자가 막대에서 먼 쪽으로 이동' : '전자가 막대와 가까운 쪽으로 이동'; l2.textContent = ''; }
      else { label.textContent = '막대와 캔 사이에 인력 → 캔이 끌려옴'; l2.textContent = '가까운 쪽은 막대와 다른 종류의 전하'; }
    }
    let cancel = null;
    const play = () => { cancel && cancel(); cancel = once(3.8, pose); };
    seg(ctl, [['-', '(−) 막대'], ['+', '(+) 막대']], '-', (v) => { mode = v; buildRod(); play(); });
    button(ctl, '다시 가까이 하기', play, 'go');
    pose(0);
    return { play, stop() { cancel && cancel(); } };
  }

  /* 검전기 (그림 Ⅶ-4·Ⅶ-5) */
  function scope(host, ctl) {
    const g = svg(host, 760, 580), s = g.s, cx = 380;
    S('ellipse', { cx, cy: 548, rx: 160, ry: 12, fill: 'rgba(20,38,59,.1)' }, s);
    // 병
    S('path', { d: `M${cx - 145},300 C${cx - 150},270 ${cx - 70},258 ${cx - 40},240 L${cx - 40},205 H${cx + 40} L${cx + 40},240 C${cx + 70},258 ${cx + 150},270 ${cx + 145},300 V530 Q${cx + 145},548 ${cx + 125},548 H${cx - 125} Q${cx - 145},548 ${cx - 145},530Z`, fill: '#eef5fa', stroke: '#a9bccb', 'stroke-width': 2.5 }, s);
    S('rect', { x: cx - 44, y: 190, width: 88, height: 26, rx: 4, fill: g.lg('stp', [[0, '#7b6a58'], [1, '#574838']]) }, s);
    S('rect', { x: cx - 5, y: 150, width: 10, height: 240, fill: g.lg('rodm', [[0, '#b58452'], [.5, '#e2b98a'], [1, '#a4733f']], 1, 0) }, s);
    S('rect', { x: cx - 92, y: 136, width: 184, height: 16, rx: 3, fill: g.lg('pl', [[0, '#e2b98a'], [1, '#b58452']]) }, s);
    T(s, cx + 134, 150, '금속판', { size: 20, a: 'start' }); T(s, cx + 72, 480, '금속박', { size: 20, a: 'start' }); T(s, cx - 160, 280, '금속 막대', { size: 20, a: 'end' });
    const f1 = S('path', { d: `M-2,0 H10 L14,120 H0Z`, fill: g.lg('foil', [[0, '#f4d26a'], [1, '#d4a92f']], 1, 0) }, s), f2 = S('path', { d: `M2,0 H-10 L-14,120 H0Z`, fill: g.lg('foil', [[0, '#f4d26a'], [1, '#d4a92f']], 1, 0) }, s);
    // 대전체(빨대)
    const st = S('g', {}, s); S('rect', { x: -130, y: -13, width: 260, height: 26, rx: 13, fill: g.lg('str', [[0, '#7a5bb0'], [.4, '#5d4192'], [1, '#402b6d']]) }, st);
    const stc = [];
    let mode = '-', amt = 1;
    const top = [-70, -30, 30, 70].map((x) => x), P = [], ES = [];
    // 금속판 (+) 고정, 금속박 (+) 고정, 전자 움직임
    const PT = [[-70, 144], [-25, 144], [25, 144], [70, 144]];
    PT.forEach(([x, y]) => P.push(chg(s, cx + x, y, '+', 10)));
    const fp = [chg(s, 0, 0, '+', 9), chg(s, 0, 0, '+', 9)];
    const EL = []; for (let i = 0; i < 6; i++) EL.push(chg(s, 0, 0, '-', 10));
    const cap = T(s, cx, 50, '', { size: 25, w: 800, c: C.ink });
    function buildSt() { stc.forEach((x) => x.remove()); stc.length = 0; for (let i = 0; i < 4; i++) stc.push(chg(st, -90 + i * 60, 0, mode, 9)); }
    buildSt();
    function pose(t) {
      const dn = seq(t, .2, 1.4), up = 104 - 0, yS = lerp(30, 100, dn);
      st.setAttribute('transform', `translate(${cx},${yS})`);
      const sh = seq(t, 1, 2.2), open = seq(t, 1.6, 2.8) * (amt > 1 ? 1 : .55);
      const a = open * .62;
      const fy = 395;
      f1.setAttribute('transform', `translate(${cx},${fy}) rotate(${-a * 57.3})`);
      f2.setAttribute('transform', `translate(${cx},${fy}) rotate(${a * 57.3})`);
      const tip = (sgn, l) => [cx + Math.sin(a) * sgn * l, fy + Math.cos(a) * l];
      fp[0].at(...tip(-1 * -1, 64)); fp[1].at(...tip(-1, 64));
      // 전자 시작: 금속판 위. (−): 금속박으로 내려감, (+): 시작은 금속박, 금속판으로 올라감
      const from = [[-48, 148], [0, 148], [48, 148], [cx, 0], [0, 0], [0, 0]];
      EL.forEach((e, i) => {
        const plate = [cx - 75 + i * 30, 166];
        const foil = i % 2 ? tip(1, 34 + (i * 11) % 50) : tip(-1, 34 + (i * 13) % 50);
        const via = mode === '-' ? [plate, foil] : [foil, plate];
        const k = seq(t, 1 + i * .05, 2.2 + i * .05);
        const stem = [cx, lerp(190, 360, .5)];
        const q = k < .5 ? [lerp(via[0][0], stem[0], k * 2), lerp(via[0][1], stem[1], k * 2)] : [lerp(stem[0], via[1][0], k * 2 - 1), lerp(stem[1], via[1][1], k * 2 - 1)];
        e.at(q[0], q[1]);
      });
      cap.textContent = t < 1 ? `${mode === '-' ? '(−)' : '(+)'} 대전체를 금속판에 가까이 함` : t < 2.2 ? (mode === '-' ? '전자가 금속판 → 금속박으로 이동' : '전자가 금속박 → 금속판으로 이동') : `금속박은 모두 ${mode === '-' ? '(−)' : '(+)'}전하 → 척력으로 벌어짐`;
    }
    let cancel = null;
    const play = () => { cancel && cancel(); cancel = once(3, pose); };
    seg(ctl, [['-', '(−) 대전체'], ['+', '(+) 대전체']], '-', (v) => { mode = v; buildSt(); play(); });
    seg(ctl, [[1, '2~3번 문지름'], [2, '10번 이상 문지름']], 1, (v) => { amt = v; play(); });
    pose(0);
    return { play, stop() { cancel && cancel(); } };
  }

  /* 전선 속 전자: 전지 없음 ↔ 있음 */
  function wire(host, ctl) {
    const g = svg(host, 760, 520), s = g.s;
    const X0 = 70, X1 = 690, Y0 = 170, Y1 = 330;
    S('rect', { x: X0, y: Y0, width: X1 - X0, height: Y1 - Y0, rx: 30, fill: g.lg('cu', [[0, '#e9b98a'], [.5, '#f4d4b0'], [1, '#c8905c']]), stroke: '#a97440', 'stroke-width': 2 }, s);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) chg(s, X0 + 45 + c * 66 + (r % 2 ? 33 : 0) * 0, Y0 + 28 + r * 52, '+', 11);
    const E = []; for (let i = 0; i < 22; i++) E.push({ x: X0 + 30 + (i * 37) % (X1 - X0 - 60), y: Y0 + 20 + (i * 53) % (Y1 - Y0 - 40), vx: Math.cos(i * 2.4) * 60, vy: Math.sin(i * 2.4) * 60, g: chg(s, 0, 0, '-', 9) });
    const a1 = arrow(s, { c: C.ink, w: 3 }).set(510, 112, 250, 112), a2 = arrow(s, { c: C.blue, w: 3 }).set(250, 388, 510, 388);
    const t1 = T(s, 380, 96, '전류의 방향', { size: 24, c: C.ink }), t2 = T(s, 380, 424, '전자의 이동 방향', { size: 24, c: C.blue });
    const lp = T(s, 690, 96, '(+)극 쪽', { size: 22, a: 'end' }), lm = T(s, 70, 96, '(−)극 쪽', { size: 22, a: 'start' });
    const cap = T(s, 380, 490, '', { size: 23, c: C.mut });
    let on = true;
    const vis = () => { const v = on ? 'visible' : 'hidden'; [a1, a2, t1, t2, lp, lm].forEach((x) => { x.style.visibility = v; }); cap.textContent = on ? '전자는 (−)극에서 (+)극 쪽으로, 전류는 그 반대로' : '전지가 없으면 불규칙하게 움직여 전류가 흐르지 않음'; };
    const L = loop(host, (dt) => {
      E.forEach((e) => {
        if (on) { e.vx += (70 - e.vx) * dt * 2.5; e.vy *= (1 - dt * 3); } else { e.vx += (Math.random() - .5) * 400 * dt; e.vy += (Math.random() - .5) * 400 * dt; const sp = Math.hypot(e.vx, e.vy) || 1; const m = clamp(sp, 40, 110); e.vx *= m / sp; e.vy *= m / sp; }
        e.x += e.vx * dt; e.y += e.vy * dt;
        if (e.x > X1 - 16) { if (on) e.x = X0 + 16; else { e.x = X1 - 16; e.vx = -Math.abs(e.vx); } }
        if (e.x < X0 + 16) { if (on) e.x = X1 - 16; else { e.x = X0 + 16; e.vx = Math.abs(e.vx); } }
        if (e.y > Y1 - 14) { e.y = Y1 - 14; e.vy = -Math.abs(e.vy); }
        if (e.y < Y0 + 14) { e.y = Y0 + 14; e.vy = Math.abs(e.vy); }
        e.g.at(e.x, e.y);
      });
    });
    const sg = seg(ctl, [[true, '전지 연결'], [false, '전지 없음']], true, (v) => { on = v; vis(); });
    vis(); E.forEach((e) => e.g.at(e.x, e.y));
    return { play: L.start, stop: L.stop };
  }

  /* 수로 모형 */
  function water(host, ctl) {
    const g = svg(host, 760, 600), s = g.s;
    let high = 1, open = true;
    const hOf = () => (high === 1 ? 190 : 120);
    const lowY = 470;
    const W = '#4f9fd8';
    // 아래 수로
    S('rect', { x: 60, y: lowY, width: 640, height: 40, fill: W }, s);
    S('rect', { x: 50, y: lowY + 40, width: 660, height: 12, rx: 3, fill: '#8d98a4' }, s);
    // 위 수로
    const upG = S('rect', { x: 60, height: 34, width: 400, fill: W }, s), upB = S('rect', { x: 50, height: 12, width: 420, rx: 3, fill: '#8d98a4' }, s);
    // 펌프
    const pump = S('g', {}, s);
    S('rect', { x: 76, y: 150, width: 56, height: 322, fill: '#b9c4cf' }, pump);
    S('rect', { x: 88, y: 150, width: 32, height: 322, fill: W }, pump);
    S('rect', { x: 60, y: 396, width: 88, height: 54, rx: 6, fill: g.lg('pm', [[0, '#546477'], [1, '#2f3c4c']]) }, pump);
    T(pump, 104, 431, '펌프', { size: 21, c: '#fff' });
    // 물레방아 + 떨어지는 물
    const wx = 520; const fallW = S('rect', { x: 462, width: 26, fill: W, opacity: .85 }, s);
    const wh = S('g', {}, s);
    S('circle', { r: 66, fill: 'none', stroke: '#8a6238', 'stroke-width': 8 }, wh);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; S('line', { x1: 0, y1: 0, x2: Math.cos(a) * 66, y2: Math.sin(a) * 66, stroke: '#a97c4f', 'stroke-width': 5 }, wh); S('rect', { x: Math.cos(a) * 66 - 11, y: Math.sin(a) * 66 - 11, width: 22, height: 22, rx: 2, fill: '#b98a57', transform: `rotate(${a * 57.3} ${Math.cos(a) * 66} ${Math.sin(a) * 66})` }, wh); }
    S('circle', { r: 11, fill: '#6b4a2c' }, wh);
    const whT = T(s, wx, 0, '물레방아', { size: 22 });
    // 수문
    const gate = S('rect', { x: 300, width: 12, rx: 2, fill: '#3c4a5a' }, s), gateT = T(s, 306, 0, '수문', { size: 21 });
    // 높이 차
    const br = S('path', { fill: 'none', stroke: C.blue, 'stroke-width': 2.5 }, s), brT = T(s, 690, 0, '수면의', { size: 22, c: C.blue, a: 'end' }), brT2 = T(s, 690, 0, '높이 차', { size: 22, c: C.blue, a: 'end' });
    const up = () => lowY - hOf() - 34 - 60;
    const ds = [];
    for (let i = 0; i < 16; i++) ds.push({ p: i / 16, c: S('circle', { r: 4.5, fill: '#fff', opacity: .95 }, s) });
    let ang = 0;
    function layout() {
      const y = lowY - hOf() - 60;
      upG.setAttribute('y', y); upB.setAttribute('y', y + 34);
      fallW.setAttribute('y', y + 12); fallW.setAttribute('height', lowY - y - 12);
      const wy = (y + lowY) / 2 + 12;
      wh.dataset.y = wy; whT.setAttribute('x', wx + 24); whT.setAttribute('y', wy - 76);
      gate.setAttribute('y', open ? y - 34 : y - 4); gate.setAttribute('height', open ? 30 : 40);
      gateT.setAttribute('x', 306); gateT.setAttribute('y', y - 42);
      br.setAttribute('d', `M618,${y} h24 M630,${y} V${lowY} M618,${lowY} h24`);
      brT.setAttribute('y', (y + lowY) / 2 - 2); brT2.setAttribute('y', (y + lowY) / 2 + 24); brT.setAttribute('x', 720); brT2.setAttribute('x', 720);
      return y;
    }
    function draw(dt) {
      const y = layout(), sp = open ? (high === 1 ? 1 : .55) : 0;
      ang += dt * sp * 120;
      wh.setAttribute('transform', `translate(${wx},${+wh.dataset.y}) rotate(${ang})`);
      ds.forEach((d) => {
        d.p = (d.p + dt * sp * .16) % 1;
        const p = d.p; let X, Y;
        // 길: 펌프 위로 → 위 수로 오른쪽 → 아래로 → 아래 수로 왼쪽
        if (p < .3) { X = 104; Y = lerp(lowY + 16, y + 16, p / .3); }
        else if (p < .55) { X = lerp(104, 475, (p - .3) / .25); Y = y + 16; }
        else if (p < .72) { X = 475; Y = lerp(y + 16, lowY + 16, (p - .55) / .17); }
        else { X = lerp(475, 104, (p - .72) / .28); Y = lowY + 18; }
        d.c.setAttribute('cx', X); d.c.setAttribute('cy', Y);
        d.c.setAttribute('visibility', 'visible');
      });
    }
    draw(0);
    T(s, 300, 582, '물의 흐름 = 전류, 수로 = 도선', { size: 22, c: C.mut });
    const L = loop(host, draw);
    seg(ctl, [[1, '높이 차 크게'], [0, '높이 차 작게']], 1, (v) => { high = v; });
    const b = button(ctl, '수문 닫기', () => { open = !open; b.textContent = open ? '수문 닫기' : '수문 열기'; draw(0); });
    return { play: L.start, stop: L.stop };
  }

  /* 전류계와 전압계 회로 */
  function meters(host, ctl) {
    const g = svg(host, 760, 560), s = g.s;
    const path = [[120, 430], [120, 150], [640, 150], [640, 430], [120, 430]];
    poly(s, path); battery(g, s, 380, 430, 130, 46);
    T(s, 380, 490, '전지', { size: 21 });
    // 니크롬선
    const rx = 640, ry = 300;
    S('rect', { x: rx - 16, y: ry - 66, width: 32, height: 132, rx: 8, fill: '#fff', stroke: 'none' }, s);
    for (let i = 0; i < 7; i++) S('path', { d: `M${rx - 16},${ry - 62 + i * 18} q32,9 32,0`, stroke: '#a15a2e', 'stroke-width': 4, fill: 'none' }, s);
    T(s, rx + 26, ry + 6, '니크롬선', { size: 21, a: 'start' });
    function meter(x, y, ch, on) { const m = S('g', { transform: `translate(${x},${y})` }, s); S('circle', { r: 40, fill: '#fff', stroke: C.ink2, 'stroke-width': 3 }, m); T(m, 0, 13, ch, { size: 38, w: 800, c: C.ink }); return m; }
    const v0 = [[640, 215], [500, 215], [500, 385], [640, 385]];
    const vw = poly(s, v0, { w: 4, c: '#5a6b7e' });
    const am = meter(280, 150, 'A'); const vm = meter(500, 300, 'V');
    T(s, 280, 90, '전류계', { size: 22 }); const vl = T(s, 454, 306, '전압계', { size: 22, a: 'end' });
    const main = dots(s, path, 16, { r: 5.5 }), sub = dots(s, v0, 5, { r: 4, c: '#7aa9d9' });
    const cap = T(s, 380, 44, '', { size: 24, c: C.ink });
    let mode = 'a'; const hi = () => {
      am.firstChild.setAttribute('stroke', mode === 'a' ? C.blue : C.ink2); am.firstChild.setAttribute('stroke-width', mode === 'a' ? 5 : 3);
      vm.firstChild.setAttribute('stroke', mode === 'v' ? C.blue : C.ink2); vm.firstChild.setAttribute('stroke-width', mode === 'v' ? 5 : 3);
      cap.textContent = mode === 'a' ? '전류계: 전류가 흐르는 길이 하나(직렬)' : '전압계: 길이 갈라지게 양 끝에 연결(병렬)'; sub.show(mode === 'v');
    };
    let tm = 0, lastSwitch = 0;
    const L = loop(host, (dt, t) => { main.tick(dt, 90); sub.tick(dt, 12); });
    const bs = seg(ctl, [['a', '전류계 보기'], ['v', '전압계 보기']], 'a', (v) => { clearInterval(tm); mode = v; hi(); });
    hi(); main.tick(0, 0); sub.tick(0, 0);
    return { play() { L.start(); clearInterval(tm); tm = setInterval(() => { mode = mode === 'a' ? 'v' : 'a'; bs.mark(mode); hi(); }, 3400); }, stop() { L.stop(); clearInterval(tm); } };
  }

  /* 전기 저항: 길이·굵기 */
  function resist(host, ctl) {
    const g = svg(host, 760, 540), s = g.s;
    let len = 1, thick = 0;
    const X0 = () => (len ? 70 : 200), X1 = () => (len ? 690 : 560), HH = () => (thick ? 130 : 66), Y = 245;
    const body = S('rect', { rx: 18, fill: g.lg('ni', [[0, '#c98a5a'], [.5, '#e8c29c'], [1, '#a9713f']]), stroke: '#8a5a30', 'stroke-width': 2 }, s);
    const atG = S('g', {}, s), E = [];
    let atoms = [];
    function build() {
      while (atG.firstChild) atG.removeChild(atG.firstChild);
      atoms = []; const x0 = X0(), x1 = X1(), h = HH();
      body.setAttribute('x', x0); body.setAttribute('width', x1 - x0); body.setAttribute('y', Y - h); body.setAttribute('height', h * 2);
      const rows = thick ? 4 : 2, cols = Math.round((x1 - x0) / 62);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const ax = x0 + 32 + c * ((x1 - x0 - 50) / Math.max(1, cols - 1 || 1)), ay = Y - h + (2 * h) * ((r + .5) / rows); atoms.push([ax, ay]); S('circle', { cx: ax, cy: ay, r: 14, fill: g.rg('atm', [[0, '#a8b3be'], [1, '#65727f']]) }, atG); }
      E.forEach((e) => e.g.remove()); E.length = 0;
      const n = thick ? 22 : 11;
      for (let i = 0; i < n; i++) E.push({ x: x0 + 20 + ((i * 53) % (x1 - x0 - 40)), y: Y - h + 14 + ((i * 41) % (2 * h - 28)), vx: 60, vy: 0, hit: 0, g: chg(s, 0, 0, '-', 7) });
    }
    const cap = T(s, 380, 46, '', { size: 26, w: 800, c: C.ink });
    const sub = T(s, 380, 470, '', { size: 22, c: C.mut });
    const mark = () => {
      const r = (len ? 2 : 1) / (thick ? 2 : 1);
      cap.textContent = r >= 2 ? '길고 가늘다: 저항이 큼' : r <= .5 ? '짧고 굵다: 저항이 작음' : len ? '길고 굵다' : '짧고 가늘다';
      sub.textContent = r >= 2 ? '같은 전압에서 전류가 약함' : r <= .5 ? '같은 전압에서 전류가 셈' : '';
    };
    let sp = 1;
    const update = () => { sp = (len ? .55 : 1) * (thick ? 1.1 : 1) * (len && !thick ? .9 : 1); build(); mark(); };
    const L = loop(host, (dt) => {
      const x0 = X0(), x1 = X1(), h = HH();
      E.forEach((e) => {
        e.vx += (150 * sp - e.vx) * dt * 2.5; e.vy *= (1 - dt * 2);
        e.x += e.vx * dt; e.y += e.vy * dt;
        atoms.forEach(([ax, ay]) => { const dx = e.x - ax, dy = e.y - ay, d = Math.hypot(dx, dy); if (d < 20 && dx < 6) { e.vx = -30 - Math.random() * 40; e.vy = (dy >= 0 ? 1 : -1) * (50 + Math.random() * 40); e.x = ax + dx / d * 21; e.y = ay + dy / d * 21; } });
        if (e.x > x1 - 8) e.x = x0 + 8; if (e.x < x0 + 8) { e.x = x0 + 8; e.vx = 30; }
        if (e.y > Y + h - 10) { e.y = Y + h - 10; e.vy = -Math.abs(e.vy); } if (e.y < Y - h + 10) { e.y = Y - h + 10; e.vy = Math.abs(e.vy); }
        e.g.at(e.x, e.y);
      });
    });
    seg(ctl, [[0, '짧게'], [1, '길게']], len, (v) => { len = v; update(); });
    seg(ctl, [[0, '가늘게'], [1, '굵게']], thick, (v) => { thick = v; update(); });
    update(); E.forEach((e) => e.g.at(e.x, e.y));
    return { play: L.start, stop: L.stop };
  }

  /* 옴의 법칙: 그래프 */
  function ohm(host, ctl) {
    const g = svg(host, 760, 560), s = g.s, X0 = 110, Y0 = 470, PX = 130, PY = 950; // 1 V = 130, 1 A = 950
    for (let i = 0; i <= 4; i++) { S('line', { x1: X0 + i * PX, x2: X0 + i * PX, y1: Y0, y2: Y0 - .4 * PY, stroke: '#eef2f6', 'stroke-width': 1.5 }, s); T(s, X0 + i * PX, Y0 + 30, String(i), { size: 21, c: C.mut }); }
    for (let i = 0; i <= 4; i++) { S('line', { x1: X0, x2: X0 + 4 * PX, y1: Y0 - i * .1 * PY, y2: Y0 - i * .1 * PY, stroke: '#eef2f6', 'stroke-width': 1.5 }, s); if (i) T(s, X0 - 14, Y0 - i * .1 * PY + 7, (i / 10).toFixed(1), { size: 21, c: C.mut, a: 'end' }); }
    S('path', { d: `M${X0},${Y0 - .4 * PY - 12} V${Y0} H${X0 + 4 * PX + 16}`, fill: 'none', stroke: C.ink2, 'stroke-width': 2.5 }, s);
    T(s, X0 + 2 * PX, Y0 + 66, '전압 (V)', { size: 22 }); T(s, X0 - 70, Y0 - .4 * PY - 22, '전류 (A)', { size: 22, a: 'start' });
    const l1 = S('line', { x1: X0, y1: Y0, stroke: C.blue, 'stroke-width': 4, 'stroke-linecap': 'round' }, s), l2 = S('line', { x1: X0, y1: Y0, stroke: '#8a97a5', 'stroke-width': 4, 'stroke-linecap': 'round' }, s);
    const t1 = T(s, 0, 0, '㉠ 10 Ω', { size: 22, c: C.blue, a: 'start' }), t2 = T(s, 0, 0, '㉡ 20 Ω', { size: 22, c: '#6a7a8a', a: 'start' });
    const dot = S('circle', { r: 9, fill: C.blue }, s), gh = S('path', { fill: 'none', stroke: C.blue, 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }, s);
    const rd = T(s, 380, 44, '', { size: 28, w: 800, c: '#0b3f73' });
    let v = 4, r = 10;
    function draw(k = 1) {
      const V = v;
      const end = (R) => [X0 + 4 * PX * k, Y0 - (4 / R) * k * PY];
      const e1 = end(10), e2 = end(20);
      l1.setAttribute('x2', e1[0]); l1.setAttribute('y2', e1[1]); l2.setAttribute('x2', e2[0]); l2.setAttribute('y2', e2[1]);
      t1.setAttribute('x', Math.min(e1[0] + 12, 640)); t1.setAttribute('y', e1[1] + 6); t2.setAttribute('x', Math.min(e2[0] + 12, 640)); t2.setAttribute('y', e2[1] + 6);
      const i = V / r, x = X0 + Math.min(V, 4 * k) * PX, y = Y0 - Math.min(i, (4 * k) / r) * PY;
      dot.setAttribute('cx', x); dot.setAttribute('cy', y); gh.setAttribute('d', `M${X0},${y} H${x} V${Y0}`);
      dot.setAttribute('fill', r === 10 ? C.blue : '#6a7a8a'); gh.setAttribute('stroke', r === 10 ? C.blue : '#6a7a8a');
      rd.textContent = `I = ${V} V ÷ ${r} Ω = ${Math.round((V / r) * 100) / 100} A`;
    }
    const sl = slider(ctl, '전압', 1, 4, 1, v, (x) => { v = x; draw(); });
    seg(ctl, [[10, '㉠ 10 Ω'], [20, '㉡ 20 Ω']], r, (x) => { r = x; draw(); });
    draw();
    let cancel = null;
    return { play() { cancel && cancel(); v = 4; sl.value = 4; cancel = once(1.4, (t) => draw(ease(t / 1.4))); }, stop() { cancel && cancel(); } };
  }

  /* 직렬·병렬 회로 */
  function conn(host, ctl, o = {}) {
    const mode = o.mode || 's';
    const g = svg(host, 760, 580), s = g.s;
    let cut = false;
    const yT = 150, yB = 480;
    let d1, d2, b1, b2, gap, bright;
    const cuts = [];
    if (mode === 's') {
      poly(s, [[120, yB], [120, yT], [290, yT]]); poly(s, [[350, yT], [640, yT], [640, yB], [120, yB]]);
      gap = S('g', {}, s); const gl = S('line', { x1: 290, y1: yT, x2: 350, y2: yT, stroke: '#3c4a5a', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, gap);
      d1 = dots(s, [[120, yB], [120, yT], [640, yT], [640, yB], [120, yB]], 12, { r: 5 });
      b1 = bulb(g, s, 250, yT - 2, 34); b2 = bulb(g, s, 500, yT - 2, 34);
      S('circle', { cx: 320, cy: yT, r: 0 }, s);
      const X = S('path', { d: `M308,${yT - 12} l24,24 m0,-24 l-24,24`, stroke: C.red, 'stroke-width': 4, 'stroke-linecap': 'round' }, s); cuts.push(X);
      gap.line = gl;
    } else {
      poly(s, [[120, yB], [120, yT], [640, yT], [640, yB], [120, yB]]);
      const ym = 300;
      poly(s, [[120, ym], [290, ym]]); poly(s, [[350, ym], [640, ym]]);
      gap = S('g', {}, s); gap.line = S('line', { x1: 290, y1: ym, x2: 350, y2: ym, stroke: '#3c4a5a', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, gap);
      d1 = dots(s, [[120, yB], [120, yT], [640, yT], [640, yB], [120, yB]], 12, { r: 5 });
      d2 = dots(s, [[120, ym], [640, ym]], 6, { r: 5 });
      b1 = bulb(g, s, 430, ym - 2, 34); b2 = bulb(g, s, 430, yT - 2, 34);
      const X = S('path', { d: `M308,${ym - 12} l24,24 m0,-24 l-24,24`, stroke: C.red, 'stroke-width': 4, 'stroke-linecap': 'round' }, s); cuts.push(X);
    }
    battery(g, s, 380, yB, 130, 46);
    const cap = T(s, 380, 50, '', { size: 25, w: 800, c: C.ink });
    const sub = T(s, 380, 540, '', { size: 21, c: C.mut });
    function apply() {
      gap.line.setAttribute('visibility', cut ? 'hidden' : 'visible'); cuts[0].setAttribute('visibility', cut ? 'visible' : 'hidden');
      if (mode === 's') { const k = cut ? 0 : .42; b1.set(k); b2.set(k); d1.show(!cut); cap.textContent = cut ? '한 개가 끊어지면 모두 꺼짐' : '직렬연결: 경로가 하나'; sub.textContent = cut ? '전류가 흐를 다른 길이 없음' : '전구 한 개일 때보다 어두움'; }
      else { b1.set(cut ? 0 : .9); b2.set(.9); d2.show(!cut); cap.textContent = cut ? '한 개가 끊어져도 다른 쪽은 켜짐' : '병렬연결: 경로가 두 개'; sub.textContent = '전구 한 개일 때와 밝기가 같음'; }
    }
    let tm = 0;
    const L = loop(host, (dt) => { if (mode === 's') { if (!cut) d1.tick(dt, 55); } else { d1.tick(dt, 90); if (!cut) d2.tick(dt, 55); } });
    const b = button(ctl, '전구 한 개 끊기', () => { clearTimeout(tm); cut = !cut; b.textContent = cut ? '다시 연결하기' : '전구 한 개 끊기'; apply(); }, 'go');
    apply(); d1.tick(0, 0); d2 && d2.tick(0, 0);
    return { play() { L.start(); clearTimeout(tm); cut = false; b.textContent = '전구 한 개 끊기'; apply(); tm = setTimeout(() => { cut = true; b.textContent = '다시 연결하기'; apply(); }, 2600); }, stop() { L.stop(); clearTimeout(tm); } };
  }

  /* 전기 기구 그림 (그림 Ⅶ-11) */
  const DEV = {
    fan(g, p, st) { // 드론
      S('ellipse', { cx: 0, cy: 72, rx: 90, ry: 7, fill: 'rgba(20,38,59,.1)' }, p);
      S('path', { d: 'M-34,0 H34 Q50,0 46,16 Q40,34 0,34 Q-40,34 -46,16 Q-50,0 -34,0Z', fill: g.lg('dr', [[0, '#55677c'], [1, '#2f3c4c']]) }, p);
      S('circle', { cx: 0, cy: 20, r: 8, fill: '#101a26' }, p);
      [-1, 1].forEach((k) => { S('line', { x1: k * 34, y1: 8, x2: k * 78, y2: -14, stroke: '#3c4a5a', 'stroke-width': 6, 'stroke-linecap': 'round' }, p); S('rect', { x: k * 78 - 5, y: -24, width: 10, height: 12, fill: '#2f3c4c' }, p); const bl = S('ellipse', { cx: k * 78, cy: -26, rx: 40, ry: 3.5, fill: '#7f8f9f' }, p); st.spin.push(bl); });
    },
    lamp(g, p) { const b = bulb(g, p, 0, -8, 40); b.set(.9); },
    kettle(g, p) {
      S('ellipse', { cx: 0, cy: 74, rx: 72, ry: 6, fill: 'rgba(20,38,59,.1)' }, p);
      S('rect', { x: -62, y: 56, width: 124, height: 16, rx: 6, fill: '#3c4a5a' }, p);
      S('path', { d: 'M-46,-40 Q0,-52 46,-40 L56,56 H-56Z', fill: g.lg('ke', [[0, '#a9b4bf'], [.4, '#e6ebef'], [1, '#8f9ba7']], 1, 0) }, p);
      S('path', { d: 'M52,-20 C86,-20 86,40 54,40', stroke: '#3c4a5a', 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round' }, p);
      S('path', { d: 'M-48,-34 L-76,-52 L-74,-34 L-52,-14Z', fill: '#c5ced6' }, p);
      S('rect', { x: -14, y: -60, width: 28, height: 12, rx: 5, fill: '#3c4a5a' }, p);
    },
    bat(g, p) { S('rect', { x: -44, y: -74, width: 88, height: 148, rx: 13, fill: '#1c2735' }, p); S('rect', { x: -38, y: -66, width: 76, height: 130, rx: 5, fill: '#e9eef3' }, p); S('rect', { x: -18, y: -30, width: 36, height: 66, rx: 4, fill: 'none', stroke: '#47a35a', 'stroke-width': 4 }, p); S('rect', { x: -7, y: -38, width: 14, height: 8, rx: 2, fill: '#47a35a' }, p); S('rect', { x: -11, y: -4, width: 22, height: 34, fill: '#47a35a' }, p); },
    tv(g, p) { S('ellipse', { cx: 0, cy: 72, rx: 70, ry: 6, fill: 'rgba(20,38,59,.1)' }, p); S('rect', { x: -92, y: -60, width: 184, height: 112, rx: 6, fill: '#1c2735' }, p); S('rect', { x: -84, y: -52, width: 168, height: 96, fill: g.lg('scr', [[0, '#6db2e6'], [1, '#d8efff']]) }, p); S('path', { d: 'M-84,44 L-40,8 L-12,30 L24,-8 L84,44Z', fill: '#5f9a48' }, p); S('rect', { x: -9, y: 52, width: 18, height: 12, fill: '#3c4a5a' }, p); S('rect', { x: -44, y: 62, width: 88, height: 8, rx: 3, fill: '#3c4a5a' }, p); },
    hp(g, p) { S('path', { d: 'M-58,20 C-62,-70 62,-70 58,20', fill: 'none', stroke: '#2f3c4c', 'stroke-width': 11, 'stroke-linecap': 'round' }, p); [-1, 1].forEach((k) => S('rect', { x: k * 62 - 18, y: 6, width: 36, height: 56, rx: 15, fill: g.lg('hpc', [[0, '#55677c'], [1, '#222e3c']]) }, p)); },
  };
  const ENERGY = [
    ['drone', 'fan', '드론', [['운동 에너지', '#3f7fc1']]],
    ['lamp', 'lamp', '조명', [['빛에너지', '#e4ad22']]],
    ['kettle', 'kettle', '전기 주전자', [['열에너지', '#d9602f']]],
    ['bat', 'bat', '휴대 전화 배터리', [['화학 에너지', '#45985c']]],
    ['tv', 'tv', '텔레비전', [['빛에너지', '#e4ad22'], ['소리 에너지', '#7c67b3']]],
    ['hp', 'hp', '헤드폰', [['소리 에너지', '#7c67b3']]],
  ];
  function devs(host, ctl) {
    const g = svg(host, 760, 500), s = g.s;
    const devG = S('g', { transform: 'translate(300,240) scale(1.4)' }, s);
    const name = T(s, 300, 450, '', { size: 24, w: 800, c: C.ink });
    T(s, 94, 96, '전기 에너지', { size: 22, c: C.blue });
    const cord = S('path', { d: 'M40,420 C90,420 90,120 210,180', fill: 'none', stroke: '#c9d5df', 'stroke-width': 5, 'stroke-linecap': 'round' }, s);
    const cl = cord.getTotalLength ? null : null;
    const inD = []; for (let i = 0; i < 6; i++) inD.push(S('circle', { r: 5.5, fill: C.blue }, s));
    const outG = S('g', {}, s);
    let cur = 0, ph = 0, spin = [], outs = [];
    function pick(i) {
      cur = i; while (devG.firstChild) devG.removeChild(devG.firstChild); while (outG.firstChild) outG.removeChild(outG.firstChild);
      spin = []; DEV[ENERGY[i][1]](g, devG, { spin }); name.textContent = ENERGY[i][2];
      const list = ENERGY[i][3]; outs = list.map(([n, c], k) => {
        const y = 250 + (k - (list.length - 1) / 2) * 110;
        S('rect', { x: 575, y: y - 11, width: 22, height: 22, rx: 5, fill: c }, outG); T(outG, 605, y + 8, n, { size: 23, c: C.ink, a: 'start' });
        const ds = []; for (let j = 0; j < 5; j++) ds.push(S('circle', { r: 6, fill: c }, outG));
        return { y, ds };
      });
    }
    pick(0);
    let tm = 0;
    const L = loop(host, (dt, t) => {
      ph += dt * .5;
      const len = cord.getTotalLength();
      inD.forEach((d, i) => { const q = cord.getPointAtLength((((ph + i / 6) % 1)) * len); d.setAttribute('cx', q.x); d.setAttribute('cy', q.y); });
      outs.forEach((o) => o.ds.forEach((d, j) => { const u = (ph * 1.2 + j / 5) % 1; d.setAttribute('cx', lerp(445, 565, u)); d.setAttribute('cy', lerp(250, o.y, ease(u))); }));
      spin.forEach((b, i) => { const w = 40 * Math.abs(Math.cos(t * 26 + i)); b.setAttribute('rx', 8 + w); });
    });
    const bs = seg(ctl, ENERGY.map((e, i) => [i, e[2]]), 0, (v) => { clearInterval(tm); pick(v); });
    return { play() { L.start(); clearInterval(tm); tm = setInterval(() => { const n = (cur + 1) % ENERGY.length; pick(n); bs.mark(n); }, 3000); }, stop() { L.stop(); clearInterval(tm); } };
  }

  /* 소비 전력: 에어컨과 선풍기 (그림 Ⅶ-10) */
  function power(host, ctl) {
    const g = svg(host, 760, 540), s = g.s;
    // 에어컨
    S('rect', { x: 70, y: 60, width: 250, height: 74, rx: 12, fill: g.lg('ac', [[0, '#fbfcfd'], [1, '#d3dbe2']]), stroke: '#bcc7d1' }, s);
    for (let i = 0; i < 4; i++) S('line', { x1: 86, x2: 304, y1: 110 + i * 5, y2: 110 + i * 5, stroke: '#aeb9c4', 'stroke-width': 1.5 }, s);
    T(s, 195, 208, '에어컨 690 W', { size: 24, w: 800, c: C.ink });
    const windA = []; for (let i = 0; i < 3; i++) windA.push(S('path', { d: '', fill: 'none', stroke: '#a7d0ee', 'stroke-width': 3, 'stroke-linecap': 'round' }, s));
    // 선풍기
    const FX = 560, FY = 92;
    S('rect', { x: FX - 5, y: FY + 40, width: 10, height: 46, fill: '#8d98a4' }, s);
    S('ellipse', { cx: FX, cy: FY + 86, rx: 34, ry: 7, fill: '#7c8896' }, s);
    S('circle', { cx: FX, cy: FY, r: 46, fill: '#f4f7f9', stroke: '#a8b4bf', 'stroke-width': 3 }, s);
    const blade = S('g', {}, s); for (let i = 0; i < 3; i++) S('path', { d: 'M0,0 C-16,-14 -14,-38 0,-40 C14,-38 16,-14 0,0Z', fill: '#7fb4de', transform: `rotate(${i * 120})` }, blade);
    S('circle', { cx: FX, cy: FY, r: 6, fill: '#3c4a5a' }, s);
    T(s, FX, 208, '선풍기 10 W', { size: 24, w: 800, c: C.ink });
    // 사용한 전기 에너지 막대
    const Y0 = 470, H = 200;
    const b1 = S('rect', { x: 135, width: 120, fill: C.blue }, s), b2 = S('rect', { x: 500, width: 120, fill: C.blue }, s);
    S('line', { x1: 80, x2: 680, y1: Y0, y2: Y0, stroke: C.ink2, 'stroke-width': 2.5 }, s);
    const v1 = T(s, 195, 0, '', { size: 24, w: 800, c: C.ink }), v2 = T(s, 560, 0, '', { size: 24, w: 800, c: C.ink });
    const cap = T(s, 380, 510, '', { size: 23, c: C.mut });
    let ang = 0;
    const bar = (r, tx, Wh) => { const h = (Wh / 2070) * H, y = Y0 - h; r.setAttribute('y', y); r.setAttribute('height', Math.max(0, h)); tx.setAttribute('y', y - 10); tx.textContent = Math.round(Wh) + ' Wh'; };
    const set = (hr) => { bar(b1, v1, 690 * hr); bar(b2, v2, 10 * hr); cap.textContent = '같은 시간 동안 사용한 전력량'; };
    const L = loop(host, (dt, t) => { ang += dt * 400; blade.setAttribute('transform', `translate(${FX},${FY}) rotate(${ang})`); windA.forEach((w, i) => { const y = 136 + ((t * 30 + i * 12) % 36); w.setAttribute('d', `M${110 + i * 75},${y} q18,6 36,0`); w.setAttribute('opacity', .9 - ((t * 30 + i * 12) % 36) / 45); }); });
    set(3);
    let cancel = null;
    const play = () => { L.start(); cancel && cancel(); cancel = once(3, (t) => set(t)); };
    button(ctl, '3시간 사용하기', play, 'go');
    return { play, stop() { L.stop(); cancel && cancel(); } };
  }

  /* 전력량: 소비 전력 × 시간 (넓이) */
  function wh(host, ctl) {
    const g = svg(host, 760, 540), s = g.s, X0 = 110, Y0 = 440, W = 560, H = 340;
    S('path', { d: `M${X0},${Y0 - H - 14} V${Y0} H${X0 + W + 14}`, fill: 'none', stroke: C.ink2, 'stroke-width': 2.5 }, s);
    const MAXW = 1000, MAXH = 5;
    const r = S('rect', { x: X0, fill: '#e3effb', stroke: C.blue, 'stroke-width': 2.5 }, s);
    for (let h = 1; h <= MAXH; h++) { S('line', { x1: X0 + h * W / MAXH, x2: X0 + h * W / MAXH, y1: Y0, y2: Y0 + 8, stroke: C.ink2, 'stroke-width': 2 }, s); T(s, X0 + h * W / MAXH, Y0 + 32, h + '시간', { size: 20, c: C.mut }); }
    [200, 400, 600, 800, 1000].forEach((v) => { S('line', { x1: X0 - 8, x2: X0, y1: Y0 - v / MAXW * H, y2: Y0 - v / MAXW * H, stroke: C.ink2, 'stroke-width': 2 }, s); T(s, X0 - 14, Y0 - v / MAXW * H + 7, String(v), { size: 20, c: C.mut, a: 'end' }); });
    T(s, X0 - 60, 72, '소비 전력 (W)', { size: 21, a: 'start' });
    const v1 = T(s, 0, 0, '', { size: 28, w: 800, c: '#0b3f73' }), v2 = T(s, 0, 0, '', { size: 23, c: '#0b3f73' });
    const eq = T(s, 380, 510, '', { size: 26, w: 800, c: C.ink });
    let P = 500, h = 2;
    function draw(k = 1) {
      const w = (h * W / MAXH) * k, hh = P / MAXW * H;
      r.setAttribute('y', Y0 - hh); r.setAttribute('height', hh); r.setAttribute('width', w);
      const E = P * h;
      const cx = X0 + w / 2, cy = Y0 - hh / 2;
      v1.setAttribute('x', Math.max(cx, X0 + 80)); v1.setAttribute('y', hh > 60 ? cy + 2 : Y0 - hh - 40); v1.textContent = k > .98 ? E + ' Wh' : '';
      v2.setAttribute('x', Math.max(cx, X0 + 80)); v2.setAttribute('y', hh > 60 ? cy + 30 : Y0 - hh - 12); v2.textContent = k > .98 ? '= ' + E / 1000 + ' kWh' : '';
      eq.textContent = `${P} W × ${h}시간 = ${E} Wh`;
    }
    slider(ctl, '소비 전력', 100, 1000, 100, P, (v) => { P = v; draw(); });
    slider(ctl, '시간', 1, 5, 1, h, (v) => { h = v; draw(); });
    draw();
    let cancel = null;
    const play = () => { cancel && cancel(); cancel = once(1.2, (t) => draw(ease(t / 1.2))); };
    return { play, stop() { cancel && cancel(); } };
  }

  /* 형광등과 LED등, 효율 등급 */
  function led(host, ctl) {
    const g = svg(host, 760, 540), s = g.s;
    const lamp = (cx, name, heatN) => {
      const h = S('g', {}, s);
      S('rect', { x: cx - 120, y: 48, width: 240, height: 14, rx: 3, fill: '#c9d2da' }, h);
      S('rect', { x: cx - 108, y: 62, width: 216, height: 20, rx: 10, fill: '#fffde6', stroke: '#e5dd9f' }, h);
      S('path', { d: `M${cx - 108},84 L${cx - 150},190 H${cx + 150} L${cx + 108},84Z`, fill: g.lg('beam', [[0, 'rgba(255,233,120,.6)'], [1, 'rgba(255,233,120,0)']]) }, h);
      T(s, cx, 150, name, { size: 26, w: 800, c: C.ink });
      const ps = []; for (let i = 0; i < heatN; i++) ps.push({ x: cx - 90 + (i * 180) / Math.max(1, heatN - 1), ph: i * .37, c: S('path', { d: 'M0,0 q7,-9 0,-18 q-7,-9 0,-18', fill: 'none', stroke: '#d9602f', 'stroke-width': 3, 'stroke-linecap': 'round' }, s) });
      return ps;
    };
    const P1 = lamp(195, '형광등', 7), P2 = lamp(565, 'LED등', 2);
    // 에너지 막대(비율 숫자 없음, 모형)
    const row = (cx, light, heat) => {
      const y = 220, W = 280;
      T(s, cx, y - 8, '같은 시간 사용한 전기 에너지', { size: 19, c: C.mut });
      S('rect', { x: cx - W / 2, y: y + 4, width: W * light, height: 30, fill: '#e9c23e' }, s);
      S('rect', { x: cx - W / 2 + W * light, y: y + 4, width: W * heat, height: 30, fill: '#d9602f' }, s);
      T(s, cx - W / 2 + W * light / 2, y + 26, '빛', { size: 20, c: '#4c3b05' });
      T(s, cx - W / 2 + W * light + W * heat / 2, y + 26, '열', { size: 20, c: '#fff' });
    };
    row(195, .5, .5); row(565, .5, .17);
    // 등급
    const GX = 170, GY = 310;
    T(s, 380, GY - 8, '에너지 소비 효율 등급', { size: 22, c: C.ink });
    const bars = [];
    for (let i = 0; i < 5; i++) { const w = 170 + i * 70, y = GY + 8 + i * 36; const r = S('rect', { x: GX, y, width: w, height: 30, fill: '#d6e2ee' }, s); T(s, GX + 14, y + 22, (i + 1) + ' 등급', { size: 19, c: C.ink, a: 'start' }); bars.push(r); }
    T(s, 730, GY + 34, '효율적', { size: 20, c: C.blue, a: 'end' });
    T(s, 730, GY + 178, '덜 효율적', { size: 20, c: C.mut, a: 'end' });
    const L = loop(host, (dt, t) => {
      [...P1, ...P2].forEach((p) => { const u = (t * .5 + p.ph) % 1; p.c.setAttribute('transform', `translate(${p.x},${80 - u * 34})`); p.c.setAttribute('opacity', Math.sin(u * 3.14)); });
      const k = Math.floor(t / 1.2) % 5; bars.forEach((b, i) => b.setAttribute('fill', i === 0 ? C.blue : '#d6e2ee'));
    });
    bars[0].setAttribute('fill', C.blue);
    return { play: L.start, stop: L.stop };
  }

  /* 자기장: 쌍극 계산으로 나침반과 곡선 */
  function poleField(x, y, N, Sp) {
    const f = (P) => { const dx = x - P[0], dy = y - P[1], d = Math.hypot(dx, dy) + 18; return [dx / (d * d * d), dy / (d * d * d)]; };
    const a = f(N), b = f(Sp); return [a[0] - b[0], a[1] - b[1]];
  }
  function fieldLines(p, N, Sp, o = {}) {
    const g = S('g', {}, p), starts = o.starts || 10;
    for (let i = 0; i < starts; i++) {
      const dirN = Math.sign(N[0] - Sp[0]) || 1, a0 = ((i - (starts - 1) / 2) / starts) * 2.6;
      let x = N[0] + dirN * Math.cos(a0) * 8, y = N[1] + Math.sin(a0) * 22;
      let d = `M${x.toFixed(1)},${y.toFixed(1)}`, ok = true;
      for (let n = 0; n < 900; n++) {
        const v = poleField(x, y, N, Sp), l = Math.hypot(v[0], v[1]) || 1; x += v[0] / l * 5; y += v[1] / l * 5; d += `L${x.toFixed(1)},${y.toFixed(1)}`;
        if (Math.hypot(x - Sp[0], y - Sp[1]) < 12) break;
        if (x < -60 || x > 820 || y < -80 || y > 680) { ok = true; break; }
      }
      S('path', { d, fill: 'none', stroke: o.c || '#b8cce0', 'stroke-width': 1.8 }, g);
      // S극 쪽도 같은 모양으로(화면 밖으로 나간 선이 한쪽만 남지 않게)
      x = Sp[0] - dirN * Math.cos(a0) * 8; y = Sp[1] + Math.sin(a0) * 22; d = `M${x.toFixed(1)},${y.toFixed(1)}`;
      for (let n = 0; n < 900; n++) {
        const v = poleField(x, y, N, Sp), l = Math.hypot(v[0], v[1]) || 1; x -= v[0] / l * 5; y -= v[1] / l * 5; d += `L${x.toFixed(1)},${y.toFixed(1)}`;
        if (Math.hypot(x - N[0], y - N[1]) < 12 || x < -60 || x > 820 || y < -80 || y > 680) break;
      }
      S('path', { d, fill: 'none', stroke: o.c || '#b8cce0', 'stroke-width': 1.8 }, g);
    }
    return g;
  }
  function compass(g, p, x, y, r = 26) {
    const c = S('g', { transform: `translate(${x},${y})` }, p);
    S('circle', { r, fill: '#fff', stroke: '#8d98a4', 'stroke-width': 2 }, c);
    const n = S('g', {}, c);
    S('path', { d: `M0,${-r * .8} L${r * .24},0 H${-r * .24}Z`, fill: C.red }, n);
    S('path', { d: `M0,${r * .8} L${r * .24},0 H${-r * .24}Z`, fill: '#3f7fc1' }, n);
    S('circle', { r: r * .1, fill: '#fff' }, c);
    let a = 0; c.ang = (v) => { a = v; n.setAttribute('transform', `rotate(${v})`); }; c.get = () => a;
    return c;
  }
  const toAng = (v) => Math.atan2(v[1], v[0]) * 57.3 + 90;
  const turn = (a, b, k) => { let d = ((b - a + 540) % 360) - 180; return a + d * k; };

  function field(host, ctl) {
    const g = svg(host, 760, 560), s = g.s, cy = 280; let flip = false;
    const lines = S('g', {}, s);
    const mag = S('g', {}, s);
    const draw = () => {
      while (lines.firstChild) lines.removeChild(lines.firstChild); while (mag.firstChild) mag.removeChild(mag.firstChild);
      const N = flip ? [230, cy] : [530, cy], Sp = flip ? [530, cy] : [230, cy];
      fieldLines(lines, N, Sp, { starts: 10 });
      const col = (l) => l ? ['#ef8378', '#d64a3a', '#a7322a'] : ['#7fb0e6', '#3f7fc1', '#285a99'];
      const x = [[220, 380, flip], [380, 540, !flip]];
      x.forEach(([a, b, isN], i) => { S('rect', { x: a, y: cy - 34, width: b - a, height: 68, fill: isN ? g.lg('magN', [[0, '#ef8378'], [.5, '#d64a3a'], [1, '#a7322a']]) : g.lg('magS', [[0, '#7fb0e6'], [.5, '#3f7fc1'], [1, '#285a99']]) }, mag); T(mag, (a + b) / 2, cy + 14, isN ? 'N' : 'S', { size: 40, w: 800, c: '#fff' }); });
      return [N, Sp];
    };
    let P = draw();
    const pos = [[90, 280], [670, 280], [380, 110], [380, 450], [190, 150], [570, 150], [190, 410], [570, 410], [290, 200], [470, 200], [290, 360], [470, 360]];
    const cs = pos.map(([x, y], i) => { const c = compass(g, s, x, y); c.ang(i * 53); return c; });
    let cancel = null;
    const play = () => { cancel && cancel(); const a0 = cs.map((c, i) => (i * 53) % 360); cancel = once(1.8, (t) => { cs.forEach((c, i) => c.ang(turn(a0[i], toAng(poleField(pos[i][0], pos[i][1], P[0], P[1])), ease(clamp(t / 1.5 - i * .02, 0, 1))))); }); };
    const b = button(ctl, '자석 뒤집기', () => { flip = !flip; P = draw(); const a0 = cs.map((c) => c.get()); cancel && cancel(); cancel = once(1, (t) => cs.forEach((c, i) => c.ang(turn(a0[i], toAng(poleField(pos[i][0], pos[i][1], P[0], P[1])), ease(t))))); });
    return { play, stop() { cancel && cancel(); } };
  }

  /* 코일 주위의 자기장 (그림 Ⅶ-13): 앞쪽 전선의 전류가 위로 → 왼쪽 끝이 N 쪽(오른손 말은 쓰지 않음) */
  function coil(host, ctl) {
    const g = svg(host, 760, 580), s = g.s, cy = 270, X0 = 240, X1 = 520;
    let dir = 1, amp = 2;
    const lines = S('g', {}, s);
    const redraw = () => { while (lines.firstChild) lines.removeChild(lines.firstChild); const N = dir > 0 ? [X0, cy] : [X1, cy], Sp = dir > 0 ? [X1, cy] : [X0, cy]; fieldLines(lines, N, Sp, { starts: 10, c: '#c5d6e6' }); return [N, Sp]; };
    let P = redraw();
    // 코일: 뒤쪽 선 → 앞쪽 선 교대
    const R = 62, turns = 9, st = (X1 - X0) / (turns - 1);
    for (let i = 0; i < turns - 1; i++) S('path', { d: `M${X0 + i * st},${cy - R} Q${X0 + i * st + st * .9},${cy} ${X0 + (i + 1) * st},${cy + R}`, stroke: '#a26a36', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, s);
    const fronts = [];
    for (let i = 0; i < turns; i++) fronts.push(S('path', { d: `M${X0 + i * st},${cy - R} Q${X0 + i * st - st * .3},${cy} ${X0 + i * st},${cy + R}`, stroke: g.lg('cw', [[0, '#e6a766'], [.5, '#f1c490'], [1, '#c8824a']]), 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' }, s));
    // 회로
    poly(s, [[X0, cy + R], [X0 - 40, cy + R], [X0 - 40, 500], [300, 500]], { c: '#3c4a5a' }); poly(s, [[460, 500], [X1 + 40, 500], [X1 + 40, cy - R], [X1, cy - R]], { c: '#3c4a5a' });
    const batH = S('g', {}, s); let batI = battery(g, batH, 380, 500, 160, 46, true);
    const flow = S('g', {}, s);
    const flowD = []; for (let i = 0; i < turns; i++) flowD.push(S('circle', { r: 5, fill: '#fff', stroke: C.blue, 'stroke-width': 2 }, flow));
    const a1 = arrow(s, { c: C.blue, w: 3 }), aT = T(s, 380, 180, '전류', { size: 21, c: C.blue });
    const pos = [[60, 270], [690, 270], [380, 80], [210, 110], [550, 110], [120, 440], [650, 440], [380, 150]];
    pos[7] = [380, 120]; pos[2] = [380, 44];
    const cs = pos.map(([x, y]) => compass(g, s, x, y, 24));
    let ph = 0;
    const aim = (k) => {
      const w = amp / 2; // 전류 세기: 약하면 지구 북쪽(위)과 섞여 조금만 움직여요
      cs.forEach((c, i) => {
        const v = poleField(pos[i][0], pos[i][1], P[0], P[1]), l = Math.hypot(v[0], v[1]) || 1;
        const dirx = v[0] / l, diry = v[1] / l, mix = amp === 1 ? .45 : 1;
        const ax = dirx * mix, ay = diry * mix - (1 - mix);
        c.ang(turn(c.get(), toAng([ax, ay]), k));
      });
    };
    const L = loop(host, (dt) => {
      ph += dt * amp * .8;
      flowD.forEach((d, i) => { const u = (ph + i / turns) % 1; const X = X0 + i * st, Y = dir > 0 ? cy + R - u * 2 * R : cy - R + u * 2 * R; d.setAttribute('cx', X - Math.sin(u * 3.14) * st * .18); d.setAttribute('cy', Y); });
      aim(dt * 3);
    });
    const labelDir = () => { a1.set(X0 - 80, dir > 0 ? cy + 40 : cy - 40, X0 - 80, dir > 0 ? cy - 40 : cy + 40); aT.setAttribute('x', X0 - 80); aT.setAttribute('y', cy - 54); batI.remove(); batI = battery(g, batH, 380, 500, 160, 46, dir > 0); };
    labelDir();
    seg(ctl, [[1, '전류 방향 그대로'], [-1, '전류 방향 바꾸기']], 1, (v) => { dir = v; P = redraw(); labelDir(); });
    seg(ctl, [[1, '전류 약하게'], [2, '전류 세게']], 2, (v) => { amp = v; });
    cs.forEach((c) => c.ang(0));
    return { play() { cs.forEach((c) => c.ang(0)); L.start(); }, stop: L.stop };
  }

  /* 전기 그네 옆모습 (그림 Ⅶ-15): 자석 왼쪽, N극 아래, S극 위. 전선은 끝에서 본 모습 */
  function swing(host, ctl) {
    const g = svg(host, 760, 560), s = g.s;
    let cur = 1, fld = 1, amp = 1, th = 0, om = 0;
    const px = 400, py = 40, L0 = 300;
    // 받침
    S('rect', { x: px - 150, y: py - 14, width: 300, height: 14, rx: 3, fill: g.lg('st', [[0, '#c0c8d0'], [1, '#8d98a4']]) }, s);
    // 말굽자석: 왼쪽이 굽은 쪽, 오른쪽으로 열림
    const mg = S('g', {}, s);
    const tcol = g.lg('hN', [[0, '#ef8378'], [1, '#c23b2e']]), bcol = g.lg('hS', [[0, '#7fb0e6'], [1, '#3567a8']]);
    const upArm = S('path', {}, mg), dnArm = S('path', {}, mg), back = S('path', { fill: '#59636e' }, mg);
    const upT = T(mg, 330, 0, '', { size: 30, w: 800, c: '#fff' }), dnT = T(mg, 330, 0, '', { size: 30, w: 800, c: '#fff' });
    upArm.setAttribute('d', 'M60,230 H420 V290 H120 Q60,290 60,340 V230Z'); dnArm.setAttribute('d', 'M60,340 Q60,390 120,390 H420 V450 H60Z');
    upT.setAttribute('y', 272); dnT.setAttribute('y', 432);
    // 흐름선
    const fl = S('g', {}, s);
    const flA = []; [300, 360, 420].forEach((x) => flA.push(arrow(fl, { c: '#7fa9d1', w: 2, head: 9 })));
    // 코일 줄과 전선
    const ln = S('line', { x1: px, y1: py, stroke: '#7c8896', 'stroke-width': 3 }, s), ln2 = S('line', { x1: px, y1: py, stroke: '#7c8896', 'stroke-width': 3 }, s);
    const wire = S('g', {}, s);
    S('circle', { r: 22, fill: g.rg('wc', [[0, '#f1c490'], [.6, '#d59a60'], [1, '#a26a36']]), stroke: '#8a5a30', 'stroke-width': 2 }, wire);
    const sym = S('g', {}, wire);
    const fa = arrow(s, { c: C.red, w: 4, head: 16 });
    const cap = T(s, 400, 510, '', { size: 26, w: 800, c: C.ink }), sub = T(s, 400, 544, '', { size: 21, c: C.mut });
    const lbField = T(s, 205, 348, '자기장', { size: 21, c: '#3f6f9e', a: 'start' });
    function symbol() { while (sym.firstChild) sym.removeChild(sym.firstChild); if (cur > 0) S('path', { d: 'M-11,-11 L11,11 M11,-11 L-11,11', stroke: '#3a230e', 'stroke-width': 4, 'stroke-linecap': 'round' }, sym); else S('circle', { r: 6, fill: '#3a230e' }, sym); }
    function look() {
      upArm.setAttribute('fill', fld > 0 ? bcol : tcol); dnArm.setAttribute('fill', fld > 0 ? tcol : bcol);
      upT.textContent = fld > 0 ? 'S' : 'N'; dnT.textContent = fld > 0 ? 'N' : 'S';
      flA.forEach((a, i) => { const x = 300 + i * 60; fld > 0 ? a.set(x, 380, x, 300) : a.set(x, 300, x, 380); });
      symbol();
      const outward = cur * fld > 0;
      cap.textContent = `코일이 받는 힘: ${outward ? '바깥쪽' : '안쪽'}`;
      sub.textContent = `전류 ${cur > 0 ? '처음 방향' : '반대'} · 자기장 ${fld > 0 ? '처음 방향' : '반대'}`;
    }
    function draw() {
      const x = px + Math.sin(th) * L0, y = py + Math.cos(th) * L0;
      ln.setAttribute('x2', x - 6); ln.setAttribute('y2', y); ln2.setAttribute('x2', x + 6); ln2.setAttribute('y2', y);
      wire.setAttribute('transform', `translate(${x},${y})`);
      const dir = cur * fld > 0 ? 1 : -1;
      fa.set(x + dir * 28, y, x + dir * (34 + 44 * amp), y);
    }
    const Lp = loop(host, (dt) => {
      const tgt = (cur * fld > 0 ? 1 : -1) * (amp > 1 ? .38 : .22);
      om += ((tgt - th) * 16 - om * 1.6) * dt; th += om * dt; draw();
    });
    look(); th = .22; draw();
    const bs1 = seg(ctl, [[1, '전류 처음'], [-1, '전류 반대']], 1, (v) => { cur = v; look(); });
    const bs2 = seg(ctl, [[1, '자기장 처음'], [-1, '자기장 반대']], 1, (v) => { fld = v; look(); });
    seg(ctl, [[1, '전류 약하게'], [2, '전류 세게']], 1, (v) => { amp = v; });
    let tm = 0;
    const CASES = [[1, 1], [-1, 1], [1, -1], [-1, -1]]; let ci = 0;
    return { play() { Lp.start(); th = 0; om = 0; clearInterval(tm); ci = 0; tm = setInterval(() => { ci = (ci + 1) % 4; cur = CASES[ci][0]; fld = CASES[ci][1]; bs1.mark(cur); bs2.mark(fld); look(); }, 3200); ctl.addEventListener('click', () => clearInterval(tm), { once: true }); }, stop() { Lp.stop(); clearInterval(tm); } };
  }

  /* 오른손 (그림 Ⅶ-14) */
  function hand(host) {
    const g = svg(host, 760, 560), s = g.s;
    // 약간 기울어진 판 위의 손: 손가락 오른쪽, 엄지 위, 손등이 보임 → 손바닥은 화면 안쪽
    const h = S('g', { transform: 'translate(50,62) scale(.95)' }, s);
    S('path', { d: 'M108,404 C70,396 40,356 42,300 C44,258 62,222 96,206 L200,194 C224,168 232,110 244,50 C250,22 290,26 288,60 C284,104 276,150 280,188 C330,180 400,176 468,172 C498,170 502,208 472,214 C420,222 380,226 340,232 C396,230 462,230 498,230 C530,232 530,272 498,274 C450,276 396,276 346,276 C396,280 448,282 486,288 C514,294 510,332 480,330 C434,328 390,322 344,318 C386,328 424,336 456,346 C484,356 472,392 442,384 C392,372 340,364 296,370 C250,396 170,416 108,404Z', fill: g.lg('skin', [[0, '#f7cfa9'], [.55, '#efbc8f'], [1, '#d99a6a']]), stroke: '#c0855a', 'stroke-width': 2, 'stroke-linejoin': 'round' }, h);
    // 손가락 사이 주름
    ['M340,232 C318,234 300,238 286,244', 'M346,276 C322,276 304,278 290,282', 'M344,318 C322,316 306,316 292,318'].forEach((d) => S('path', { d, fill: 'none', stroke: '#c0855a', 'stroke-width': 2, 'stroke-linecap': 'round' }, h));
    S('rect', { x: 0, y: 0, width: 0, height: 0 }, h);
    // 소매
    S('path', { d: 'M14,290 L74,282 L84,420 L28,430 Z', fill: g.lg('slv', [[0, '#7aa6d6'], [1, '#3e72ad']]) }, h);
    const a1 = arrow(s, { c: '#2f88c5', w: 6, head: 20 }).set(590, 292, 740, 292);
    const a2 = arrow(s, { c: '#3d9c54', w: 6, head: 20 }).set(380, 205, 380, 70);
    const t1 = T(s, 660, 262, '자기장 방향', { size: 24, c: '#2f88c5' }), t2 = T(s, 396, 110, '전류 방향', { size: 24, c: '#3d9c54', a: 'start' });
    // 힘: 화면 안쪽
    const f = S('g', { transform: 'translate(215,330)' }, s);
    S('circle', { r: 24, fill: '#fff', stroke: C.red, 'stroke-width': 4 }, f);
    S('path', { d: 'M-14,-14 L14,14 M14,-14 L-14,14', stroke: C.red, 'stroke-width': 4, 'stroke-linecap': 'round' }, f);
    const t3 = T(s, 215, 382, '힘', { size: 24, c: C.red });
    const t4 = T(s, 380, 530, '', { size: 24, w: 800, c: C.ink });
    const items = [[a1, t1], [a2, t2], [f, t3]];
    const step = (i) => { items.forEach((q, k) => q.forEach((e) => { e.style.opacity = k <= i ? 1 : .12; })); t4.textContent = ['네 손가락을 자기장 방향으로', '엄지손가락을 전류 방향으로', '손바닥이 향하는 쪽(화면 안쪽)이 힘의 방향'][i]; };
    step(2);
    let tm = 0;
    return { play() { clearInterval(tm); let i = 0; step(0); tm = setInterval(() => { i = (i + 1) % 3; step(i); }, 1900); }, stop() { clearInterval(tm); } };
  }

  /* 전동기 끝에서 본 모습 (그림 Ⅶ-16): 왼쪽 S극, 오른쪽 N극 */
  function motor(host, ctl) {
    const g = svg(host, 760, 540), s = g.s, cx = 380, cy = 250, R = 105;
    let cur = 1, fld = 1, a = 0;
    const block = (x, w, id) => { const G = S('g', {}, s); const r = S('rect', { x, y: 110, width: w, height: 280, rx: 6 }, G); const tx = T(G, x + w / 2, 268, '', { size: 44, w: 800, c: '#fff' }); return [r, tx]; };
    const [lb, lt] = block(40, 130), [rb, rt] = block(590, 130);
    const nCol = g.lg('mN', [[0, '#ef8378'], [1, '#c23b2e']]), sCol = g.lg('mS', [[0, '#7fb0e6'], [1, '#3567a8']]);
    const fl = S('g', {}, s); const fa = [150, 250, 350].map((y) => arrow(fl, { c: '#a6c2dd', w: 2, head: 10 }));
    // 코일: 깊이가 있는 네모 코일
    const coilB = S('line', { stroke: '#a26a36', 'stroke-width': 9, 'stroke-linecap': 'round' }, s);
    const axis = S('circle', { cx, cy, r: 9, fill: '#3c4a5a' }, s);
    const coilF = S('line', { stroke: g.lg('cf', [[0, '#e6a766'], [1, '#c8824a']]), 'stroke-width': 11, 'stroke-linecap': 'round' }, s);
    const end1 = S('g', {}, s), end2 = S('g', {}, s);
    const mk = (e) => { S('circle', { r: 20, fill: '#f1c490', stroke: '#8a5a30', 'stroke-width': 2 }, e); return S('g', {}, e); };
    const sy1 = mk(end1), sy2 = mk(end2);
    const sym = (h, into) => { while (h.firstChild) h.removeChild(h.firstChild); if (into) S('path', { d: 'M-9,-9 L9,9 M9,-9 L-9,9', stroke: '#3a230e', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, h); else S('circle', { r: 5.5, fill: '#3a230e' }, h); };
    const f1 = arrow(s, { c: C.red, w: 4, head: 15 }), f2 = arrow(s, { c: C.red, w: 4, head: 15 });
    const cap = T(s, 380, 472, '', { size: 25, w: 800, c: C.ink }), sub = T(s, 380, 506, '', { size: 21, c: C.mut });
    function look() {
      lb.setAttribute('fill', fld > 0 ? sCol : nCol); rb.setAttribute('fill', fld > 0 ? nCol : sCol); lt.textContent = fld > 0 ? 'S' : 'N'; rt.textContent = fld > 0 ? 'N' : 'S';
      fa.forEach((q, i) => { const y = 150 + i * 100; fld > 0 ? q.set(570, y, 190, y) : q.set(190, y, 570, y); });
      const ccw = cur * fld > 0;
      cap.textContent = ccw ? '시계 반대 방향으로 회전' : '시계 방향으로 회전';
      sub.textContent = ccw ? '왼쪽 부분은 아래로, 오른쪽 부분은 위로 힘을 받음' : '왼쪽 부분은 위로, 오른쪽 부분은 아래로 힘을 받음';
    }
    function draw() {
      const c = Math.cos(a), si = Math.sin(a), x1 = cx + c * R, y1 = cy - si * R, x2 = cx - c * R, y2 = cy + si * R;
      coilF.setAttribute('x1', x1); coilF.setAttribute('y1', y1); coilF.setAttribute('x2', x2); coilF.setAttribute('y2', y2);
      coilB.setAttribute('x1', x1 + 14); coilB.setAttribute('y1', y1 - 10); coilB.setAttribute('x2', x2 + 14); coilB.setAttribute('y2', y2 - 10);
      end1.setAttribute('transform', `translate(${x1},${y1})`); end2.setAttribute('transform', `translate(${x2},${y2})`);
      // 전류는 반 바퀴마다 바뀌어 늘 오른쪽 부분과 왼쪽 부분이 반대(그림의 모양 그대로, 이름은 쓰지 않음)
      const rightIs1 = c >= 0, sign = cur;
      sym(sy1, rightIs1 ? sign > 0 : sign < 0); sym(sy2, rightIs1 ? sign < 0 : sign > 0);
      const up = cur * fld > 0 ? 1 : -1; // 오른쪽 부분 힘: 위(+1)
      const rx = rightIs1 ? x1 : x2, ry = rightIs1 ? y1 : y2, lx = rightIs1 ? x2 : x1, ly = rightIs1 ? y2 : y1;
      f1.set(rx + 30, ry - up * 6, rx + 30, ry - up * 62); f2.set(lx - 30, ly + up * 6, lx - 30, ly + up * 62);
    }
    look(); a = .5; draw();
    const L = loop(host, (dt) => { a += (cur * fld > 0 ? 1 : -1) * dt * 1.15; draw(); });
    seg(ctl, [[1, '전류 처음'], [-1, '전류 반대']], 1, (v) => { cur = v; look(); });
    seg(ctl, [[1, '자석 처음'], [-1, '자석 반대']], 1, (v) => { fld = v; look(); });
    return { play: L.start, stop: L.stop };
  }

  return { _: { S, T, svg, button, slider, seg, loop, once, seq, arrow, chg, poly, clamp, lerp, ease, C, REDUCE, compass }, cover, atom, rub, force, can, scope, wire, water, meters, resist, ohm, conn, devs, power, wh, led, field, coil, swing, hand, motor };
})();
