/* ===== 시험 대비 그림 도구 (SVG) =====
   EX.pull 수평면 용수철저울  EX.zero 일이 0인 두 경우  EX.lift 화분 위치 에너지  EX.cart 수레와 나무 도막
   EX.fall 낙하와 에너지 막대  EX.throwUp 던져 올리기  EX.two 질량 다른 두 공  EX.coaster 롤러코스터
   EX.stack 코일 관 에너지 계산  EX.table 일주일 전력량
   모두 EX.이름(host, ctl, 옵션): host에 그림, ctl에 조작 버튼을 넣어요. 빠르기는 보기 좋게 정한 모형이에요. */
window.EX = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const C = { pe: '#2f9fb2', ke: '#f0913a', el: '#e8b422', ink: '#14263b', ink2: '#34495e', mut: '#5a6b7e', line: '#c9d5df', pale: '#f1f5f8', blue: '#0e63b3', wood: '#c99a6b', woodD: '#a97c4f' };
  const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const R1 = (x) => String(Math.round(x * 10) / 10);
  function S(tag, a, p) { const e = document.createElementNS(NS, tag); for (const k in a || {}) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function T(p, x, y, s, o = {}) {
    const e = S('text', { x, y, 'font-size': o.size || 19, 'font-weight': o.w || 700, fill: o.c || C.ink2, 'text-anchor': o.a || 'middle', 'font-family': 'Pretendard,Malgun Gothic,sans-serif' }, p);
    e.textContent = s; return e;
  }
  let uid = 0;
  function svg(host, w, h) {
    const s = S('svg', { viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: 'xMidYMid meet', role: 'img' }, host);
    const defs = S('defs', {}, s), id = 'x' + (++uid);
    const lg = (n, st, x2 = 0, y2 = 1) => { const g = S('linearGradient', { id: id + n, x1: 0, y1: 0, x2, y2 }, defs); st.forEach(([o, c]) => S('stop', { offset: o, 'stop-color': c }, g)); return `url(#${id + n})`; };
    const rg = (n, st, fx = .36, fy = .3) => { const g = S('radialGradient', { id: id + n, cx: .5, cy: .5, r: .62, fx, fy }, defs); st.forEach(([o, c]) => S('stop', { offset: o, 'stop-color': c }, g)); return `url(#${id + n})`; };
    const blur = S('filter', { id: id + 'b', x: '-30%', y: '-80%', width: '160%', height: '260%' }, defs); S('feGaussianBlur', { stdDeviation: 5 }, blur);
    return { s, lg, rg, blurUrl: `url(#${id}b)` };
  }
  function button(ctl, label, fn, cls = '') { const b = document.createElement('button'); b.type = 'button'; b.className = 'ctl ' + cls; b.textContent = label; b.addEventListener('click', fn); ctl.appendChild(b); return b; }
  function slider(ctl, label, min, max, step, val, fn) {
    const l = document.createElement('label'); l.textContent = label;
    const i = document.createElement('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = val; i.setAttribute('aria-label', label);
    i.addEventListener('input', () => fn(+i.value)); l.appendChild(i); ctl.appendChild(l); return i;
  }
  const seg = (ctl, items, cur, fn) => { const bs = items.map(([v, t]) => { const b = button(ctl, t, () => { bs.forEach((x, i) => x.setAttribute('aria-pressed', String(items[i][0] === v))); fn(v); }); b.setAttribute('aria-pressed', String(v === cur)); return b; }); return bs; };
  function anim(host, dur, step, done) {
    if (REDUCE) { step(1); done && done(); return () => {}; }
    let t0 = 0, live = true;
    const f = (now) => { if (!live) return; if (!t0) t0 = now; const k = Math.min(1, (now - t0) / (dur * 1000)); step(k); if (k < 1) requestAnimationFrame(f); else done && done(); };
    requestAnimationFrame(f);
    return () => { live = false; };
  }
  function ground(g, p, x, y, w, h = 44) {
    S('rect', { x, y, width: w, height: h, fill: g.lg('gr', [[0, '#8cc06a'], [.25, '#79b05a'], [1, '#5f9446']]) }, p);
    for (let i = 0; i < w / 9; i++) { const X = x + 4 + i * 9, H = 6 + (i * 7) % 7; S('path', { d: `M${X},${y + 1} q${(i % 2 ? 2 : -2)},${-H / 2} ${(i % 3) - 1},${-H}`, stroke: '#6fa650', 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round' }, p); }
  }
  function apple(g, p, sc = 1) {
    const a = S('g', {}, p);
    S('path', { d: 'M0,-20 C-8,-29 -25,-27 -27,-9 C-29,10 -14,28 -3,25 C-1,24 1,24 3,25 C14,28 29,10 27,-9 C25,-27 8,-29 0,-20Z', fill: g.rg('ap', [[0, '#f0695a'], [.6, '#d63a30'], [1, '#a4231f']]), transform: `scale(${sc})` }, a);
    S('path', { d: 'M0,-20 C0,-27 3,-32 6,-35', stroke: '#6b4a2c', 'stroke-width': 3 * sc, fill: 'none', 'stroke-linecap': 'round', transform: `scale(${sc})` }, a);
    S('path', { d: 'M4,-30 C12,-37 21,-34 23,-29 C15,-24 9,-25 4,-30Z', fill: '#5f9a48', transform: `scale(${sc})` }, a);
    return a;
  }
  function ball(g, p, r, cols) { const a = S('g', {}, p); S('circle', { r, fill: g.rg('b' + r + cols[0].slice(1), [[0, cols[0]], [.65, cols[1]], [1, cols[2]]]) }, a); return a; }
  function tree(g, p) {
    S('path', { d: 'M-10,20 C70,6 130,44 240,28 C290,20 300,36 330,30 L330,48 C280,56 230,50 190,62 C130,76 60,44 -10,52Z', fill: g.lg('br', [[0, '#8a6443'], [1, '#6a4a30']]) }, p);
    const lf = [[20, 8, 34], [66, 2, 38], [112, 14, 40], [158, 10, 44], [210, 2, 40], [262, 12, 44], [310, 4, 40], [40, 50, 34], [92, 60, 36], [240, 62, 36], [292, 56, 34]];
    lf.forEach(([x, y, r], i) => S('ellipse', { cx: x, cy: y, rx: r, ry: r * .62, fill: ['#5f9a48', '#6dab55', '#4f8a3e'][i % 3], transform: `rotate(${(i * 37) % 40 - 20} ${x} ${y})` }, p));
  }

  /* 에너지 막대 세 개: 위치 + 운동 = 역학적 (그림 Ⅵ-2 형식) */
  function bars3(p, x, y, w, h, names = ['위치 에너지', '운동 에너지', '역학적 에너지']) {
    const n = 3, gap = 40, cw = (w - gap * 2) / n, E = [];
    for (let i = 0; i < n; i++) {
      const X = x + i * (cw + gap);
      S('rect', { x: X, y, width: cw, height: h, fill: C.pale }, p);
      const a = S('rect', { x: X, y: y + h, width: cw, height: 0, fill: i === 1 ? C.ke : C.pe }, p);
      const b = i === 2 ? S('rect', { x: X, y: y + h, width: cw, height: 0, fill: C.ke }, p) : null;
      S('line', { x1: X - 6, x2: X + cw + 6, y1: y + h, y2: y + h, stroke: C.ink2, 'stroke-width': 2 }, p);
      const v = T(p, X + cw / 2, y - 12, '', { size: 24, w: 800, c: C.ink });
      const [l1, l2] = names[i].split(' ');
      T(p, X + cw / 2, y + h + 30, l1, { size: 20 }); if (l2) T(p, X + cw / 2, y + h + 54, l2, { size: 20 });
      E.push({ a, b, v });
    }
    T(p, x + cw + gap / 2, y + h / 2 + 8, '+', { size: 28, c: C.mut });
    T(p, x + 2 * cw + gap * 1.5, y + h / 2 + 8, '=', { size: 28, c: C.mut });
    return (pe, ke, max, f = (q) => R1(q) + ' J') => {
      const H = (q) => (q / max) * h;
      const set = (r, top, hh) => { r.setAttribute('y', top); r.setAttribute('height', Math.max(0, hh)); };
      set(E[0].a, y + h - H(pe), H(pe)); set(E[1].a, y + h - H(ke), H(ke));
      set(E[2].a, y + h - H(pe), H(pe)); set(E[2].b, y + h - H(pe) - H(ke), H(ke));
      E[0].v.textContent = f(pe); E[1].v.textContent = f(ke); E[2].v.textContent = f(pe + ke);
    };
  }

  /* ---- 수평면에서 용수철저울로 당기기 ---- */
  function pull(host, ctl, o = {}) {
    const F = o.F || 3, DIST = o.dist || 2, M = o.mass || 1, tabs = o.tabs !== false;
    const g = svg(host, 760, 430), s = g.s, Y = 300, X0 = 90, PX = 150;
    S('rect', { width: 760, height: 430, fill: '#fff' }, s);
    S('rect', { x: 0, y: Y, width: 760, height: 26, fill: g.lg('tb', [[0, '#d8ae80'], [1, '#c29465']]) }, s);
    S('rect', { x: 0, y: Y + 26, width: 760, height: 12, fill: '#a97c4f' }, s);
    S('ellipse', { cx: 300, cy: Y + 62, rx: 340, ry: 8, fill: 'rgba(20,38,59,.06)' }, s);
    // 눈금(이동 거리)
    const ruler = S('g', {}, s);
    for (let m = 0; m <= DIST; m++) { const x = X0 + 55 + m * PX; S('line', { x1: x, x2: x, y1: Y + 52, y2: Y + 68, stroke: C.mut, 'stroke-width': 2 }, ruler); T(ruler, x, Y + 94, m + ' m', { size: 20, c: C.mut }); }
    S('line', { x1: X0 + 55, x2: X0 + 55 + DIST * PX, y1: Y + 60, y2: Y + 60, stroke: C.line, 'stroke-width': 2 }, ruler);
    const mov = S('g', {}, s);
    S('ellipse', { cx: X0 + 55, cy: Y + 2, rx: 66, ry: 6, fill: 'rgba(20,38,59,.18)', filter: g.blurUrl }, mov);
    S('rect', { x: X0, y: Y - 92, width: 110, height: 92, rx: 3, fill: g.lg('bx', [[0, '#e2bb8c'], [1, '#c9985f']]) }, mov);
    S('path', { d: `M${X0},${Y - 92} l14,-12 h110 l-14,12Z`, fill: '#efcfa6' }, mov);
    S('path', { d: `M${X0 + 110},${Y} v-92 l14,-12 v92Z`, fill: '#ab7f50' }, mov);
    T(mov, X0 + 55, Y - 40, M + ' kg', { size: 22, w: 800, c: '#5b3f22' });
    // 용수철저울
    const SY = Y - 52, SX = X0 + 124;
    S('line', { x1: SX, x2: SX + 18, y1: SY, y2: SY, stroke: '#6c7886', 'stroke-width': 3 }, mov);
    S('rect', { x: SX + 18, y: SY - 15, width: 136, height: 30, rx: 7, fill: g.lg('sc', [[0, '#eef2f5'], [.5, '#fff'], [1, '#cfd8e0']]), stroke: '#8d9aa8', 'stroke-width': 1.5 }, mov);
    for (let i = 0; i < 7; i++) S('line', { x1: SX + 34 + i * 16, x2: SX + 34 + i * 16, y1: SY - 12, y2: SY - 4, stroke: '#7c8896', 'stroke-width': 1.4 }, mov);
    S('rect', { x: SX + 34 + F * 16 - 2, y: SY - 2, width: 5, height: 13, rx: 2, fill: C.blue }, mov);
    S('path', { d: `M${SX + 154},${SY} h16`, stroke: '#6c7886', 'stroke-width': 3 }, mov);
    S('circle', { cx: SX + 182, cy: SY, r: 12, fill: 'none', stroke: '#6c7886', 'stroke-width': 4 }, mov);
    // 힘 화살표(한 번에 하나)
    const arrow = S('g', {}, mov);
    const line = S('line', { stroke: C.blue, 'stroke-width': 4, 'stroke-linecap': 'round' }, arrow);
    const head = S('path', { fill: C.blue }, arrow);
    const lab = T(arrow, 0, 0, '', { size: 21, w: 800, c: C.blue });
    const res1 = T(s, 380, 62, '', { size: 34, w: 800, c: C.ink }), res2 = T(s, 380, 104, '', { size: 21, c: C.mut });
    const st = { x: 0, show: tabs ? 'el' : 'el', moved: false };
    function draw() {
      mov.setAttribute('transform', `translate(${st.x},0)`);
      if (st.show === 'el') {
        const x0 = SX + 40, y0 = SY - 42; line.setAttribute('x1', x0); line.setAttribute('y1', y0); line.setAttribute('x2', x0 + 92); line.setAttribute('y2', y0);
        head.setAttribute('d', `M${x0 + 104},${y0} l-14,-8 v16Z`); lab.setAttribute('x', x0 + 46); lab.setAttribute('y', y0 - 13); lab.textContent = tabs ? `탄성력 ${F} N` : `힘 ${F} N`;
        res1.textContent = st.moved ? `${F} N × ${DIST} m = ${F * DIST} J` : (tabs ? '탄성력이 한 일은?' : '힘이 한 일은?');
        res2.textContent = st.moved ? '힘의 방향으로 이동 → 일을 함' : '당겨서 이동시켜 보세요';
      } else {
        const x0 = X0 + 90, y0 = Y - 62; line.setAttribute('x1', x0); line.setAttribute('y1', y0); line.setAttribute('x2', x0); line.setAttribute('y2', y0 + 80);
        head.setAttribute('d', `M${x0},${y0 + 92} l-8,-14 h16Z`); lab.setAttribute('x', x0); lab.setAttribute('y', Y - 112); lab.textContent = `중력 ${R1(9.8 * M)} N`;
        res1.textContent = st.moved ? '중력이 한 일 = 0 J' : '중력이 한 일은?';
        res2.textContent = st.moved ? '중력은 아래, 이동은 수평 → 힘의 방향으로 이동한 거리 0' : '당겨서 이동시켜 보세요';
      }
    }
    const go = () => { st.moved = false; anim(host, 1.5, (k) => { st.x = (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2) * DIST * PX; draw(); }, () => { st.moved = true; draw(); }); };
    button(ctl, '당겨서 이동시키기', go, 'go');
    button(ctl, '처음으로', () => { st.x = 0; st.moved = false; draw(); });
    if (tabs) seg(ctl, [['el', '탄성력 보기'], ['g', '중력 보기']], 'el', (v) => { st.show = v; draw(); });
    draw();
  }

  /* ---- 일이 0인 두 경우 ---- */
  function zero(host) {
    const g = svg(host, 760, 540), s = g.s;
    S('rect', { width: 760, height: 540, fill: '#fff' }, s);
    S('line', { x1: 380, x2: 380, y1: 30, y2: 500, stroke: C.line, 'stroke-width': 1 }, s);
    const arrow = (x1, y1, x2, y2, c = C.blue) => { const a = Math.atan2(y2 - y1, x2 - x1); S('line', { x1, y1, x2: x2 - Math.cos(a) * 10, y2: y2 - Math.sin(a) * 10, stroke: c, 'stroke-width': 4, 'stroke-linecap': 'round' }, s); S('path', { d: `M${x2},${y2} l${-14 * Math.cos(a - .5)},${-14 * Math.sin(a - .5)} l${-14 * Math.cos(a + .5)},${-14 * Math.sin(a + .5)}Z`, fill: c }, s); };
    // 바닥
    S('rect', { x: 20, y: 430, width: 340, height: 14, rx: 2, fill: '#d9e1e8' }, s); S('rect', { x: 400, y: 430, width: 340, height: 14, rx: 2, fill: '#d9e1e8' }, s);
    // 왼쪽: 역기
    const skin = '#eebf9d', cx = 190;
    S('ellipse', { cx, cy: 432, rx: 84, ry: 7, fill: 'rgba(20,38,59,.16)', filter: g.blurUrl }, s);
    S('path', { d: `M${cx - 30},300 L${cx - 52},430 h24 L${cx - 6},318 Z M${cx + 30},300 L${cx + 52},430 h-24 L${cx + 6},318 Z`, fill: '#2d4a72' }, s);
    S('rect', { x: cx - 36, y: 196, width: 72, height: 116, rx: 16, fill: g.lg('sh', [[0, '#d9574a'], [1, '#b93f33']]) }, s);
    S('rect', { x: cx - 36, y: 288, width: 72, height: 14, fill: '#3a3f45' }, s);
    S('path', { d: `M${cx - 32},208 L${cx - 70},140 L${cx - 56},92`, stroke: skin, 'stroke-width': 19, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
    S('path', { d: `M${cx + 32},208 L${cx + 70},140 L${cx + 56},92`, stroke: skin, 'stroke-width': 19, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
    S('rect', { x: cx - 9, y: 174, width: 18, height: 26, fill: skin }, s);
    S('circle', { cx, cy: 158, r: 27, fill: skin }, s);
    S('path', { d: `M${cx - 27},156 a27,27 0 0 1 54,0 q-14,-14 -27,-12 q-14,0 -27,12Z`, fill: '#2d2a28' }, s);
    S('rect', { x: cx - 148, y: 84, width: 296, height: 8, rx: 4, fill: '#7f8b97' }, s);
    [[-142, 24, 92], [-122, 16, 72], [118, 16, 72], [130, 24, 92]].forEach(([dx, w, h], i) => S('rect', { x: cx + dx - (i > 1 ? 12 : 0), y: 88 - h / 2, width: w * .55, height: h, rx: 4, fill: i % 3 === 0 ? '#2e5f9e' : '#c9503f' }, s));
    S('rect', { x: cx - 66, y: 80, width: 22, height: 16, rx: 5, fill: skin }, s); S('rect', { x: cx + 44, y: 80, width: 22, height: 16, rx: 5, fill: skin }, s);
    arrow(cx, 72, cx, 26);
    T(s, cx + 12, 40, '힘의 방향', { a: 'start', c: C.blue, size: 20, w: 800 });
    T(s, 190, 476, '역기를 들고 서 있을 때', { size: 22, w: 800, c: C.ink });
    T(s, 190, 506, '이동 거리 0 → 일 = 0', { size: 21, c: C.blue, w: 800 });
    // 오른쪽: 상자 들고 걷기
    const cx2 = 520;
    S('ellipse', { cx: cx2, cy: 432, rx: 88, ry: 7, fill: 'rgba(20,38,59,.16)', filter: g.blurUrl }, s);
    S('path', { d: `M${cx2 - 14},296 L${cx2 - 54},430 h26 L${cx2 + 6},318Z`, fill: '#4b5f7a' }, s);
    S('path', { d: `M${cx2 + 6},296 L${cx2 + 42},428 h26 L${cx2 + 28},296Z`, fill: '#2d4a72' }, s);
    S('rect', { x: cx2 - 30, y: 184, width: 62, height: 122, rx: 18, fill: g.lg('sg', [[0, '#62ac86'], [1, '#478f6b']]) }, s);
    S('rect', { x: cx2 - 9, y: 164, width: 18, height: 26, fill: skin }, s);
    S('circle', { cx: cx2 + 2, cy: 146, r: 26, fill: skin }, s);
    S('path', { d: `M${cx2 - 24},148 a26,26 0 0 1 50,-8 q-16,-4 -26,-2 q-12,2 -24,10Z`, fill: '#2d2a28' }, s);
    // 상자
    S('rect', { x: cx2 + 42, y: 196, width: 104, height: 78, rx: 3, fill: g.lg('bx2', [[0, '#e2bb8c'], [1, '#c9985f']]) }, s);
    S('path', { d: `M${cx2 + 42},196 l12,-10 h104 l-12,10Z`, fill: '#efcfa6' }, s);
    S('path', { d: `M${cx2 + 146},274 v-78 l12,-10 v78Z`, fill: '#ab7f50' }, s);
    S('path', { d: `M${cx2 + 8},210 L${cx2 + 42},282 L${cx2 + 104},276`, stroke: skin, 'stroke-width': 16, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
    arrow(cx2 + 94, 180, cx2 + 94, 106);
    T(s, cx2 + 94, 96, '힘의 방향', { c: C.blue, size: 20, w: 800 });
    arrow(cx2 - 40, 60, cx2 + 60, 60, C.ink2);
    T(s, cx2 + 5, 42, '이동 방향', { c: C.ink2, size: 20, w: 800 });
    T(s, 570, 476, '상자를 들고 걸어갈 때', { size: 22, w: 800, c: C.ink });
    T(s, 570, 506, '힘과 이동 방향이 수직 → 일 = 0', { size: 21, c: C.blue, w: 800 });
  }

  /* ---- 화분: 위치 에너지 = 9.8 × 질량 × 높이 ---- */
  function lift(host, ctl) {
    const g = svg(host, 760, 540), s = g.s, FY = 490, PX = 78, X = 170;
    S('rect', { width: 760, height: 540, fill: '#fff' }, s);
    S('rect', { x: 0, y: 30, width: 400, height: FY - 30, fill: '#f6f8fa' }, s);
    S('rect', { x: 0, y: FY, width: 760, height: 50, fill: g.lg('fl', [[0, '#cdb392'], [1, '#b89b78']]) }, s);
    // 눈금
    for (let m = 0; m <= 5; m++) { const y = FY - m * PX; S('line', { x1: 44, x2: 60, y1: y, y2: y, stroke: C.mut, 'stroke-width': 2 }, s); T(s, 36, y + 7, m + ' m', { a: 'end', size: 17, c: C.mut, w: 600 }); }
    S('line', { x1: 60, x2: 60, y1: FY - 5 * PX, y2: FY, stroke: C.line, 'stroke-width': 2 }, s);
    // 아래 선반(1 m) 기준면
    const low = S('g', {}, s);
    S('rect', { x: 70, y: FY - PX, width: 310, height: 10, fill: '#b98f62' }, low);
    S('rect', { x: 70, y: FY - PX + 10, width: 310, height: 5, fill: '#94704a' }, low);
    S('rect', { x: 90, y: FY - PX + 15, width: 10, height: PX - 15, fill: '#a98559' }, low); S('rect', { x: 350, y: FY - PX + 15, width: 10, height: PX - 15, fill: '#a98559' }, low);
    const baseL = T(s, 376, FY - 8, '기준면', { a: 'end', size: 19, c: C.blue, w: 800 });
    // 위 선반 + 화분
    const top = S('g', {}, s);
    S('rect', { x: 100, y: 0, width: 150, height: 9, fill: '#c29465' }, top);
    S('rect', { x: 100, y: 9, width: 150, height: 4, fill: '#94704a' }, top);
    const pot = S('g', {}, top);
    S('path', { d: 'M-26,-44 L-20,0 H20 L26,-44Z', fill: g.lg('pt', [[0, '#d67d55'], [1, '#b05c3a']]) }, pot);
    S('rect', { x: -30, y: -52, width: 60, height: 11, rx: 2, fill: '#c56c47' }, pot);
    S('path', { d: 'M0,-52 C-2,-72 2,-92 0,-112', stroke: '#4f8a3e', 'stroke-width': 4, fill: 'none' }, pot);
    [[-22, -76, -30], [22, -86, 30], [-20, -102, -20], [18, -112, 22]].forEach(([x, y, r]) => S('ellipse', { cx: x, cy: y, rx: 22, ry: 11, fill: '#6dab55', transform: `rotate(${r} ${x} ${y})` }, pot));
    const hl = S('line', { x1: 66, x2: 66, stroke: C.blue, 'stroke-width': 3 }, s);
    // 값
    T(s, 580, 88, '중력에 의한 위치 에너지', { size: 22, c: C.ink });
    const f1 = T(s, 580, 136, '', { size: 27, w: 700, c: C.ink2 }), f2 = T(s, 580, 188, '', { size: 44, w: 800, c: C.ink });
    S('rect', { x: 530, y: 220, width: 100, height: 240, fill: C.pale }, s);
    const bar = S('rect', { x: 530, width: 100, fill: C.pe }, s);
    S('line', { x1: 520, x2: 640, y1: 460, y2: 460, stroke: C.ink2, 'stroke-width': 2 }, s);
    const st = { m: 2, h: 3, base: 0 };
    function draw() {
      const y = FY - st.h * PX, E = 9.8 * st.m * Math.max(0, st.h - st.base), by = FY - st.base * PX;
      top.setAttribute('transform', `translate(0,${y})`);
      pot.setAttribute('transform', `translate(175,0) scale(${.72 + st.m * .13})`);
      low.style.display = st.base ? '' : 'none';
      baseL.setAttribute('y', by - 8);
      hl.setAttribute('y1', y); hl.setAttribute('y2', by);
      f1.textContent = `9.8 × ${st.m} kg × ${Math.max(0, st.h - st.base)} m`; f2.textContent = R1(E) + ' J';
      const H = (E / (9.8 * 25)) * 240; bar.setAttribute('y', 460 - H); bar.setAttribute('height', H);
    }
    slider(ctl, '질량', 1, 5, 1, 2, (v) => { st.m = v; draw(); });
    slider(ctl, '높이', 1, 5, 1, 3, (v) => { st.h = v; draw(); });
    seg(ctl, [[0, '바닥 기준'], [1, '1 m 선반 기준']], 0, (v) => { st.base = v; draw(); });
    draw();
  }

  /* ---- 수레와 나무 도막 (교과서 자료 값) ---- */
  function cart(host, ctl) {
    const g = svg(host, 760, 440), s = g.s, Y = 300, X0 = 60, BX = 330;
    S('rect', { width: 760, height: 440, fill: '#fff' }, s);
    S('rect', { y: Y, width: 760, height: 20, fill: g.lg('rl', [[0, '#d8ae80'], [1, '#c29465']]) }, s);
    S('rect', { y: Y + 20, width: 760, height: 9, fill: '#a97c4f' }, s);
    const k = 3.2; // cm → 화면
    for (let c = 0; c <= 100; c += 20) { const x = BX + 60 + c * k; S('line', { x1: x, x2: x, y1: Y + 34, y2: Y + 46, stroke: C.mut, 'stroke-width': 2 }, s); T(s, x, Y + 70, c + ' cm', { size: 16, c: C.mut, w: 600 }); }
    const cartG = S('g', {}, s);
    S('rect', { x: 0, y: -60, width: 128, height: 40, rx: 6, fill: g.lg('ct', [[0, '#5b8fd0'], [1, '#2f62a8']]) }, cartG);
    [20, 108].forEach((x) => { S('circle', { cx: x, cy: -12, r: 12, fill: '#39424c' }, cartG); S('circle', { cx: x, cy: -12, r: 4, fill: '#aeb7c1' }, cartG); });
    const weights = S('g', {}, cartG);
    const block = S('g', {}, s);
    S('rect', { x: 0, y: -46, width: 60, height: 46, rx: 2, fill: g.lg('bk', [[0, '#d9b083'], [1, '#b98c5c']]) }, block);
    S('path', { d: 'M0,-46 l10,-8 h60 l-10,8Z', fill: '#e8c79f' }, block); S('path', { d: 'M60,0 v-46 l10,-8 v46Z', fill: '#a07646' }, block);
    const r1 = T(s, 380, 66, '', { size: 30, w: 800, c: C.ink }), r2 = T(s, 380, 106, '', { size: 21, c: C.mut });
    const st = { m: 300, v: 1, cx: X0, bx: BX, done: false };
    let stop = null;
    function draw() {
      cartG.setAttribute('transform', `translate(${st.cx},${Y})`); block.setAttribute('transform', `translate(${st.bx},${Y})`);
      weights.innerHTML = '';
      for (let i = 0; i < st.m / 300; i++) { S('rect', { x: 16 + i * 34, y: -84, width: 30, height: 24, rx: 3, fill: g.lg('wt', [[0, '#9aa6b2'], [1, '#6e7a86']]) }, weights); }
      const d = 4 * (st.m / 300) * st.v * st.v;
      r1.textContent = st.done ? `나무 도막 이동 거리 ${d} cm` : `${st.m} g, ${st.v} m/s`;
      r2.textContent = st.done ? '이동 거리는 질량에 비례, (속력)²에 비례' : '수레를 밀어 나무 도막의 이동 거리를 재 보세요';
    }
    function reset() { stop && stop(); st.cx = X0; st.bx = BX; st.done = false; draw(); }
    const pushIt = () => {
      reset(); const d = 4 * (st.m / 300) * st.v * st.v, gap = BX - X0 - 128;
      stop = anim(host, 0.9 / st.v + 0.2, (k) => { st.cx = X0 + gap * k; draw(); }, () => {
        stop = anim(host, 1.3, (q) => { const e = 1 - (1 - q) * (1 - q); st.bx = BX + d * k * e; st.cx = X0 + gap + d * k * e; draw(); }, () => { st.done = true; draw(); });
      });
    };
    seg(ctl, [[300, '300 g'], [600, '600 g'], [900, '900 g']], 300, (v) => { st.m = v; reset(); });
    seg(ctl, [[1, '1 m/s'], [2, '2 m/s'], [3, '3 m/s']], 1, (v) => { st.v = v; reset(); });
    button(ctl, '수레 밀기', pushIt, 'go');
    draw();
  }

  /* ---- 낙하: 위치 에너지 → 운동 에너지 ---- */
  function fall(host, ctl, o = {}) {
    const M = o.m || 2, H0 = o.h || 10, work = !!o.work, g = svg(host, 760, 560), s = g.s;
    const GY = 504, TOP = 96;
    S('rect', { width: 760, height: 560, fill: '#fff' }, s);
    tree(g, S('g', {}, s));
    ground(g, s, 0, GY, 340, 56);
    const py = (h) => GY - 28 - (h / H0) * (GY - 28 - TOP);
    S('line', { x1: 60, x2: 60, y1: py(H0), y2: py(0), stroke: C.line, 'stroke-width': 2 }, s);
    [0, .5, 1].forEach((f) => { const y = py(H0 * f); S('line', { x1: 52, x2: 68, y1: y, y2: y, stroke: C.mut, 'stroke-width': 2 }, s); T(s, 44, y + 6, R1(H0 * f) + ' m', { a: 'end', size: 16, c: C.mut, w: 600 }).setAttribute('x', 48); });
    const ghosts = S('g', {}, s); const aG = apple(g, s, 1);
    let upd;
    if (work) {
      const X = 400, W = 300, Yb = 150, Hb = 280, E = [];
      [['중력이 한 일', C.pe], ['운동 에너지', C.ke]].forEach(([n, c], i) => {
        const x = X + i * 170; S('rect', { x, y: Yb, width: 130, height: Hb, fill: C.pale }, s);
        const r = S('rect', { x, width: 130, fill: c }, s); const v = T(s, x + 65, Yb - 14, '', { size: 26, w: 800, c: C.ink });
        S('line', { x1: x - 6, x2: x + 136, y1: Yb + Hb, y2: Yb + Hb, stroke: C.ink2, 'stroke-width': 2 }, s); T(s, x + 65, Yb + Hb + 32, n, { size: 21 });
        E.push({ r, v });
      });
      T(s, X + 150, Yb + Hb / 2 + 10, '=', { size: 30, c: C.mut });
      const f = T(s, X + 150, 66, '', { size: 23, w: 700, c: C.ink2 });
      upd = (h) => { const W2 = 9.8 * M * (H0 - h), max = 9.8 * M * H0, hh = (W2 / max) * Hb; E.forEach((e) => { e.r.setAttribute('y', Yb + Hb - hh); e.r.setAttribute('height', hh); e.v.textContent = R1(W2) + ' J'; }); f.textContent = `9.8 × ${M} kg × ${R1(H0 - h)} m`; };
    } else {
      const bu = bars3(s, 380, 128, 350, 300);
      const f = T(s, 555, 62, '', { size: 22, w: 700, c: C.ink2 });
      upd = (h) => { const pe = 9.8 * M * h, ke = 9.8 * M * (H0 - h); bu(pe, ke, 9.8 * M * H0); f.textContent = `질량 ${M} kg, 지금 높이 ${R1(h)} m`; };
    }
    const st = { h: H0 };
    let stop = null, inp = null;
    function draw() { aG.setAttribute('transform', `translate(190,${py(st.h)})`); upd(st.h); if (inp && document.activeElement !== inp) inp.value = st.h; }
    const go = () => {
      stop && stop(); ghosts.innerHTML = ''; let lastG = -1; const T0 = 1.5;
      stop = anim(host, T0, (k) => {
        st.h = H0 * (1 - k * k);
        const n = Math.floor(k * 6);
        if (n !== lastG && n < 6) { lastG = n; const c = apple(g, ghosts, 1); c.setAttribute('transform', `translate(190,${py(st.h)})`); c.setAttribute('opacity', .22); }
        draw();
      });
    };
    if (o.controls !== false) {
      button(ctl, '떨어뜨리기', go, 'go');
      inp = slider(ctl, '지금 높이', 0, H0, H0 / 20, H0, (v) => { stop && stop(); ghosts.innerHTML = ''; st.h = v; draw(); });
    } else { const loop = () => { go(); setTimeout(() => { st.h = H0; ghosts.innerHTML = ''; draw(); }, 2600); }; loop(); }
    draw();
    return { go };
  }

  /* ---- 던져 올리기 ---- */
  function throwUp(host, ctl, o = {}) {
    const M = o.m || 1, H0 = o.h || 10, pair = !!o.pair, g = svg(host, 760, 560), s = g.s;
    const GY = 504, TOP = 60, XU = 130, XD = 240;
    S('rect', { width: 760, height: 560, fill: '#fff' }, s);
    ground(g, s, 0, GY, 340, 56);
    const py = (h) => GY - 24 - (h / H0) * (GY - 24 - TOP);
    const COL = ['#ffb65a', '#ef8a2c', '#b95f13'];
    T(s, XU, 544, '올라갈 때', { size: 18, c: '#fff' }); T(s, XD, 544, '내려올 때', { size: 18, c: '#fff' });
    S('path', { d: `M${XU},${py(0)} V${py(H0)} Q${(XU + XD) / 2},${py(H0) - 30} ${XD},${py(H0)} V${py(0)}`, fill: 'none', stroke: C.line, 'stroke-width': 2, 'stroke-dasharray': '4 7' }, s);
    const mk = (x) => { const b = ball(g, s, 21, COL); const l = S('line', { stroke: C.ink2, 'stroke-width': 3.4, 'stroke-linecap': 'round' }, s); const h = S('path', { fill: C.ink2 }, s); return { b, l, h, x }; };
    const A = mk(XU), B = pair ? mk(XD) : null;
    const lineH = S('line', { x1: 80, x2: 300, stroke: C.blue, 'stroke-width': 2, 'stroke-dasharray': '6 6' }, s);
    function put(q, h, dir, x) {
      const y = py(h), sp = Math.sqrt(Math.max(0, 1 - h / H0)) * 90; q.b.setAttribute('transform', `translate(${x},${y})`);
      const y2 = Math.min(536, y + dir * (28 + sp)), on = sp > 3;
      q.l.setAttribute('x1', x); q.l.setAttribute('x2', x); q.l.setAttribute('y1', y + dir * 24); q.l.setAttribute('y2', on ? y2 : y + dir * 24);
      q.h.setAttribute('d', on ? `M${x},${y2 + dir * 12} l-8,${-dir * 13} h16Z` : '');
    }
    const bu = bars3(s, 380, 128, 350, 300);
    const f = T(s, 555, 62, '', { size: 22, w: 700, c: C.ink2 }), f2 = T(s, 190, 36, '', { size: 21, w: 800, c: C.blue });
    const st = { h: 0, dir: -1, x: XU };
    let stop = null, inp = null;
    function draw() {
      const pe = 9.8 * M * st.h, ke = 9.8 * M * (H0 - st.h); bu(pe, ke, 9.8 * M * H0);
      f.textContent = `질량 ${M} kg, 지금 높이 ${R1(st.h)} m`;
      if (pair) { put(A, st.h, -1, XU); put(B, st.h, 1, XD); lineH.setAttribute('y1', py(st.h)); lineH.setAttribute('y2', py(st.h)); f2.textContent = '같은 높이 → 같은 속력'; }
      else { lineH.style.display = 'none'; put(A, st.h, st.dir, st.x); f2.textContent = st.h >= H0 * .995 ? '가장 높은 지점: 속력 0' : ''; }
      if (inp && document.activeElement !== inp) inp.value = st.h;
    }
    const go = () => {
      stop && stop();
      stop = anim(host, 3, (k) => {
        if (k < .5) { const q = k * 2; st.h = H0 * (1 - (1 - q) * (1 - q)); st.dir = -1; st.x = XU; }
        else { const q = (k - .5) * 2; st.h = H0 * (1 - q * q); st.dir = 1; st.x = XD; }
        draw();
      });
    };
    if (!pair) button(ctl, '던져 올리기', go, 'go');
    inp = slider(ctl, '지금 높이', 0, H0, H0 / 20, pair ? H0 / 2 : 0, (v) => { stop && stop(); st.h = v; draw(); });
    if (pair) st.h = H0 / 2;
    draw();
  }

  /* ---- 질량이 다른 두 공 ---- */
  function two(host, ctl, o = {}) {
    const H0 = o.h || 5, g = svg(host, 760, 560), s = g.s, GY = 504, TOP = 80;
    S('rect', { width: 760, height: 560, fill: '#fff' }, s);
    ground(g, s, 0, GY, 320, 56);
    const py = (h) => GY - 32 - (h / H0) * (GY - 32 - TOP);
    const a = ball(g, s, 21, ['#8ec0ee', '#3f86c9', '#205d95']), b = ball(g, s, 30, ['#ee9a8e', '#cf5044', '#99302a']);
    const la = T(s, 96, 0, '1 kg', { size: 19, w: 800, c: '#205d95' }), lb = T(s, 226, 0, '2 kg', { size: 19, w: 800, c: '#99302a' });
    const cols = [['1 kg 위치', C.pe, 1, 'p'], ['1 kg 운동', C.ke, 1, 'k'], ['2 kg 위치', C.pe, 2, 'p'], ['2 kg 운동', C.ke, 2, 'k']];
    const Yb = 150, Hb = 270, E = cols.map(([n, c], i) => {
      const x = 350 + i * 96 + (i > 1 ? 18 : 0);
      S('rect', { x, y: Yb, width: 76, height: Hb, fill: C.pale }, s);
      const r = S('rect', { x, width: 76, fill: c }, s), v = T(s, x + 38, Yb - 10, '', { size: 21, w: 800, c: C.ink });
      S('line', { x1: x - 4, x2: x + 80, y1: Yb + Hb, y2: Yb + Hb, stroke: C.ink2, 'stroke-width': 2 }, s);
      const q = n.split(' '); T(s, x + 38, Yb + Hb + 28, q[0] + ' ' + q[1], { size: 19, w: 800 }); T(s, x + 38, Yb + Hb + 52, q[2] + ' 에너지', { size: 16 });
      return { r, v };
    });
    const f = T(s, 550, 56, '', { size: 23, w: 800, c: C.blue });
    const hl = S('line', { x1: 40, x2: 290, stroke: C.blue, 'stroke-width': 2, 'stroke-dasharray': '6 6' }, s);
    const st = { h: H0 };
    let stop = null, inp = null;
    function draw() {
      const y = py(st.h), max = 9.8 * 2 * H0;
      a.setAttribute('transform', `translate(96,${y})`); b.setAttribute('transform', `translate(226,${y})`);
      la.setAttribute('y', y - 30); lb.setAttribute('y', y - 40);
      hl.setAttribute('y1', y); hl.setAttribute('y2', y);
      cols.forEach(([, , m, kind], i) => { const v = 9.8 * m * (kind === 'p' ? st.h : H0 - st.h), H = (v / max) * Hb; E[i].r.setAttribute('y', Yb + Hb - H); E[i].r.setAttribute('height', H); E[i].v.textContent = R1(v) + ' J'; });
      f.textContent = '같은 지점: 속력 같음, 운동 에너지 2배';
      if (inp && document.activeElement !== inp) inp.value = st.h;
    }
    button(ctl, '동시에 떨어뜨리기', () => { stop && stop(); stop = anim(host, 1.5, (k) => { st.h = H0 * (1 - k * k); draw(); }); }, 'go');
    inp = slider(ctl, '지금 높이', 0, H0, H0 / 20, H0, (v) => { stop && stop(); st.h = v; draw(); });
    draw();
  }

  /* ---- 롤러코스터 ---- */
  function coaster(host, ctl) {
    const g = svg(host, 760, 560), s = g.s, GY = 520;
    S('rect', { width: 760, height: 560, fill: '#fff' }, s);
    ground(g, s, 0, GY, 760, 40);
    const d = 'M52,214 C106,214 130,240 182,352 C212,416 262,424 300,372 C330,330 362,296 410,300 C468,306 492,480 556,486 C632,492 664,300 736,214';
    const P = S('path', { d, fill: 'none', stroke: 'none' }, s), L = P.getTotalLength();
    // 기둥
    const sup = S('g', {}, s);
    for (let i = 0; i <= 20; i++) { const q = P.getPointAtLength(L * i / 20); if (GY - q.y < 40) continue; S('line', { x1: q.x, x2: q.x, y1: q.y, y2: GY, stroke: '#6fa39a', 'stroke-width': 4 }, sup); if (GY - q.y > 90 && i % 2 === 0) { const q2 = P.getPointAtLength(L * (i + 1) / 20); S('line', { x1: q.x, x2: q2.x, y1: (q.y + GY) / 2, y2: q2.y + (GY - q2.y) * .15, stroke: '#8cb9b0', 'stroke-width': 2.4 }, sup); } }
    S('path', { d, fill: 'none', stroke: '#5a6b7e', 'stroke-width': 14, 'stroke-linecap': 'round' }, s);
    S('path', { d, fill: 'none', stroke: '#e7edf2', 'stroke-width': 8, 'stroke-dasharray': '4 10' }, s);
    const near = (x) => { let bs = 0, bd = 1e9; for (let i = 0; i <= 400; i++) { const q = P.getPointAtLength(L * i / 400); const dd = Math.abs(q.x - x); if (dd < bd) { bd = dd; bs = i / 400; } } return P.getPointAtLength(L * bs); };
    [['A', 240, 34], ['B', 410, -30], ['C', 556, 34], ['D', 736, -26]].forEach(([n, x, dy]) => { const q = near(x); T(s, q.x + (n === 'D' ? -8 : 0), q.y + dy, n, { size: 24, w: 800, c: C.ink }); });
    const car = S('g', {}, s);
    S('rect', { x: -34, y: -40, width: 68, height: 30, rx: 9, fill: g.lg('cr', [[0, '#e0564b'], [1, '#b8362c']]) }, car);
    S('rect', { x: -24, y: -50, width: 22, height: 14, rx: 4, fill: '#f6d36b' }, car); S('rect', { x: 2, y: -50, width: 22, height: 14, rx: 4, fill: '#f6d36b' }, car);
    [-20, 20].forEach((x) => S('circle', { cx: x, cy: -8, r: 7, fill: '#39424c' }, car));
    // 막대(위쪽 빈 곳)
    const X = 200, Y = 48, W = 380, Hb = 120, E = [];
    [['위치', C.pe], ['운동', C.ke], ['역학적', null]].forEach(([n, c], i) => {
      const y = Y + i * 44; T(s, X - 12, y + 25, n + ' 에너지', { a: 'end', size: 18 });
      S('rect', { x: X, y, width: W, height: 34, fill: C.pale }, s);
      const a = S('rect', { x: X, y, height: 34, fill: c || C.pe }, s), b = c ? null : S('rect', { y, height: 34, fill: C.ke }, s);
      E.push({ a, b });
    });
    const y0 = P.getPointAtLength(0).y;
    const st = { u: 0 };
    let stop = null, inp = null;
    function draw() {
      const q = P.getPointAtLength(st.u * L), q2 = P.getPointAtLength(Math.min(L, st.u * L + 4)), q1 = P.getPointAtLength(Math.max(0, st.u * L - 4));
      const a = Math.atan2(q2.y - q1.y, q2.x - q1.x) * 180 / Math.PI;
      car.setAttribute('transform', `translate(${q.x},${q.y - 4}) rotate(${a})`);
      const span = GY - 30 - y0, pe = clamp((GY - 30 - q.y) / span, 0, 1), ke = 1 - pe;
      E[0].a.setAttribute('width', pe * W); E[1].a.setAttribute('width', ke * W);
      E[2].a.setAttribute('width', pe * W); E[2].b.setAttribute('x', X + pe * W); E[2].b.setAttribute('width', ke * W);
      if (inp && document.activeElement !== inp) inp.value = st.u * 100;
    }
    const go = () => {
      stop && stop(); if (REDUCE) { st.u = 1; draw(); return; }
      st.u = 0; let last = 0, live = true; stop = () => { live = false; };
      const f = (now) => { if (!live) return; const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now; const q = P.getPointAtLength(st.u * L); const v = 34 + Math.sqrt(Math.max(0, q.y - y0)) * 26; st.u = Math.min(1, st.u + v * dt / L); draw(); if (st.u < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    };
    button(ctl, '출발', go, 'go');
    inp = slider(ctl, '레일 위 위치', 0, 100, 1, 0, (v) => { stop && stop(); st.u = v / 100; draw(); });
    draw();
  }

  /* ---- 코일 관 에너지 계산: 20 J → 2 J + 14 J + 전기 4 J ---- */
  function stack(host, ctl) {
    const g = svg(host, 760, 540), s = g.s;
    S('rect', { width: 760, height: 540, fill: '#fff' }, s);
    // 관과 코일
    S('rect', { x: 92, y: 40, width: 62, height: 450, rx: 4, fill: '#eaf1f6', stroke: '#c9d5df', 'stroke-width': 2 }, s);
    for (let i = 0; i < 16; i++) S('rect', { x: 80, y: 196 + i * 9, width: 86, height: 6, rx: 3, fill: g.lg('cu', [[0, '#d68c52'], [1, '#a9622d']]) }, s);
    const mag = (y) => { S('rect', { x: 104, y, width: 38, height: 34, fill: '#4f74ab' }, s); S('rect', { x: 104, y: y + 34, width: 38, height: 34, fill: '#c4584c' }, s); T(s, 123, y + 24, 'S', { size: 18, c: '#fff' }); T(s, 123, y + 58, 'N', { size: 18, c: '#fff' }); };
    mag(58); mag(400);
    T(s, 66, 100, 'A', { size: 26, w: 800, c: C.ink }); T(s, 66, 442, 'B', { size: 26, w: 800, c: C.ink });
    S('line', { x1: 166, x2: 190, y1: 268, y2: 268, stroke: '#6c7886', 'stroke-width': 3 }, s);
    S('circle', { cx: 204, cy: 268, r: 14, fill: '#ffe27a', stroke: '#c79a1d', 'stroke-width': 2 }, s);
    T(s, 204, 306, '전구', { size: 18, c: C.mut });
    // 막대
    const K = 19, B0 = 470, XA = 300, XB = 520, W = 130;
    const col = (x, parts, name) => { let y = B0; parts.forEach(([v, c, t]) => { const h = v * K; y -= h; S('rect', { x, y, width: W, height: h, fill: c }, s); T(s, x + W / 2, y + h / 2 + 8, t, { size: v < 3 ? 15 : 22, w: 800, c: '#fff' }); }); S('line', { x1: x - 6, x2: x + W + 6, y1: B0, y2: B0, stroke: C.ink2, 'stroke-width': 2 }, s); T(s, x + W / 2, B0 + 32, name, { size: 21, w: 800 }); };
    col(XA, [[20, C.pe, '위치 20 J']], 'A');
    col(XB, [[2, C.pe, '위치 2 J'], [14, C.ke, '운동 14 J']], 'B');
    const eg = S('g', { }, s);
    S('rect', { x: XB, y: B0 - 20 * K, width: W, height: 4 * K, fill: '#f6dc86', stroke: C.el, 'stroke-width': 2, 'stroke-dasharray': '6 5' }, eg);
    T(eg, XB + W / 2, B0 - 18 * K + 8, '전기 4 J', { size: 22, w: 800, c: '#6e5208' });
    S('line', { x1: XA + W, x2: XB, y1: B0 - 20 * K, y2: B0 - 20 * K, stroke: C.line, 'stroke-width': 2, 'stroke-dasharray': '5 6' }, s);
    eg.style.display = 'none';
    T(s, (XA + XB + W) / 2, 40, '에너지의 총합은 그대로', { size: 22, w: 800, c: C.blue });
    let on = false; const b = button(ctl, '사라진 4 J 보기', () => { on = !on; eg.style.display = on ? '' : 'none'; b.textContent = on ? '사라진 4 J 가리기' : '사라진 4 J 보기'; }, 'go');
  }

  /* ---- 일주일 전력량 (교과서 245쪽 표) ---- */
  function table(host) {
    const g = svg(host, 760, 500), s = g.s;
    S('rect', { width: 760, height: 500, fill: '#fff' }, s);
    const D = [['세탁기', 500, '7시간', 3500], ['진공청소기', 1200, '2시간', 2400], ['헤어드라이어', 1500, '1시간', 1500], ['전자레인지', 1600, '30분', 800], ['욕실 조명', 50, '4시간', 200], ['선풍기', 50, '2시간', 100]];
    T(s, 170, 36, '가전제품', { a: 'end', size: 18, c: C.mut }); T(s, 190, 36, '소비 전력 × 시간 = 전력량', { a: 'start', size: 18, c: C.mut });
    D.forEach(([n, w, t, wh], i) => {
      const y = 58 + i * 72;
      T(s, 170, y + 34, n, { a: 'end', size: 21, w: 800, c: C.ink });
      S('rect', { x: 190, y: y + 8, width: Math.max(4, (wh / 3500) * 500), height: 38, fill: C.blue, opacity: 1 - i * .1 }, s);
      T(s, 190, y + 66, `${w} W × ${t}`, { a: 'start', size: 16, c: C.mut, w: 600 });
      const big = wh > 1000; T(s, 190 + (big ? (wh / 3500) * 500 - 12 : Math.max(4, (wh / 3500) * 500) + 12), y + 35, wh + ' Wh', { a: big ? 'end' : 'start', size: 21, w: 800, c: big ? '#fff' : C.ink });
    });
  }

  return { pull, zero, lift, cart, fall, throwUp, two, coaster, stack, table };
})();
