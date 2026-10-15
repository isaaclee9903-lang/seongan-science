/* ===== 평면거울 작도 장면 (SVG 2D) =====
   MR.defs(svg)                     방·거울·화분 그라디언트
   MR.flower(g, x, yb, s, o)        화분 (x: 가운데 꽃의 x, yb: 화분 아래). 돌려주는 값 = 가운데 꽃(물체의 한 점) 좌표
   MR.ray(g, pts, o)                빛 화살표 (꺾인 선, 가운데 화살촉). setT(0~1)로 자라게
   MR.grow(목록, 시간)              여러 화살표를 차례로 자라게
   MR.build(host, o)                작도 장면. render(단계, {anim})로 단계별로 그려요
     단계 0 장면 · 1 사방으로 반사 · 2 거울로 가는 빛과 입사각 · 3 반사 법칙대로 반사 · 4 눈에 들어오는 빛 여러 개
          5 거울 뒤쪽으로 연장 · 6 상의 위치 · 7 거리와 크기 비교
   크기·각도는 개념 이해를 위한 모형이에요. */
window.MR = (() => {
  const { el } = OP;
  const RED = '#e0402f', BLUE = '#0e63b3', CELL = 40;
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  function defs(svg) {
    const d = svg.querySelector('defs') || el('defs', {}, svg);
    if (d.querySelector('#mrWall')) return d;
    d.insertAdjacentHTML('beforeend', `
      <linearGradient id="mrWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf7ec"/><stop offset=".7" stop-color="#f8ecd7"/><stop offset="1" stop-color="#f3e2c6"/></linearGradient>
      <linearGradient id="mrBack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef3f8"/><stop offset="1" stop-color="#e2e9f1"/></linearGradient>
      <linearGradient id="mrFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1c9a2"/><stop offset=".25" stop-color="#ecb98a"/><stop offset="1" stop-color="#d99a66"/></linearGradient>
      <linearGradient id="mrFloorB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3cdb8"/><stop offset="1" stop-color="#cdb099"/></linearGradient>
      <linearGradient id="mrGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9eef6"/><stop offset=".35" stop-color="#9fd0e6"/><stop offset=".5" stop-color="#c9e8f4"/><stop offset=".62" stop-color="#8cc4de"/><stop offset="1" stop-color="#5f9fc2"/></linearGradient>
      <linearGradient id="mrEdge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2f5d7a"/><stop offset=".5" stop-color="#4f86a6"/><stop offset="1" stop-color="#244a63"/></linearGradient>
      <linearGradient id="mrPot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c8743f"/><stop offset=".32" stop-color="#e3965f"/><stop offset=".7" stop-color="#c26a36"/><stop offset="1" stop-color="#97502a"/></linearGradient>
      <linearGradient id="mrPotRim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8612f"/><stop offset=".35" stop-color="#e9a26e"/><stop offset="1" stop-color="#9a4f27"/></linearGradient>
      <radialGradient id="mrPetR" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="#ffd0c0"/><stop offset=".5" stop-color="#f0543c"/><stop offset="1" stop-color="#c92f22"/></radialGradient>
      <radialGradient id="mrPetO" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="#ffe7b0"/><stop offset=".5" stop-color="#f6a12a"/><stop offset="1" stop-color="#d9781a"/></radialGradient>
      <radialGradient id="mrPetP" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="#ffe0ea"/><stop offset=".5" stop-color="#ee7fa1"/><stop offset="1" stop-color="#c9527a"/></radialGradient>
      <radialGradient id="mrCore" cx=".4" cy=".35" r=".6"><stop offset="0" stop-color="#fff3a8"/><stop offset="1" stop-color="#e2a414"/></radialGradient>
      <linearGradient id="mrLeaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9ccc6b"/><stop offset=".6" stop-color="#5d9b42"/><stop offset="1" stop-color="#3f7a31"/></linearGradient>
      <linearGradient id="mrLeaf2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b6dc84"/><stop offset="1" stop-color="#4f8b3a"/></linearGradient>
      <pattern id="mrTile" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M0 0L80 0" stroke="rgba(150,90,40,.14)" stroke-width="2"/></pattern>`);
    return d;
  }

  /* ---- 화분 ---- */
  function flower(g, x, yb, s = 1, o = {}) {
    const G = el('g', { transform: `translate(${x} ${yb}) scale(${s})`, 'pointer-events': 'none' }, g);
    if (o.shadow !== false) el('ellipse', { cx: 6, cy: 2, rx: 46, ry: 7, fill: 'rgba(80,40,10,.22)' }, G);
    const leaf = (x1, y1, x2, y2, w, f) => {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L * w, ny = dx / L * w;
      el('path', { d: `M${x1} ${y1}Q${mx + nx} ${my + ny} ${x2} ${y2}Q${mx - nx * 0.6} ${my - ny * 0.6} ${x1} ${y1}Z`, fill: f || 'url(#mrLeaf)' }, G);
      el('path', { d: `M${x1} ${y1}Q${mx + nx * 0.2} ${my + ny * 0.2} ${x2} ${y2}`, stroke: 'rgba(40,80,30,.45)', 'stroke-width': 1, fill: 'none' }, G);
    };
    // 줄기
    const st = el('g', { stroke: '#5b8f43', 'stroke-width': 3.2, fill: 'none', 'stroke-linecap': 'round' }, G);
    el('path', { d: 'M0 -52C-2 -90 2 -120 0 -150' }, st);
    el('path', { d: 'M-2 -70C-14 -92 -22 -108 -30 -120' }, st);
    el('path', { d: 'M2 -66C14 -88 24 -104 32 -116' }, st);
    // 잎
    leaf(-2, -60, -46, -78, 11); leaf(2, -58, 44, -72, 10, 'url(#mrLeaf2)');
    leaf(-2, -84, -34, -96, 8, 'url(#mrLeaf2)'); leaf(1, -94, 30, -104, 8);
    leaf(-1, -116, -20, -134, 6); leaf(1, -120, 18, -136, 6, 'url(#mrLeaf2)');
    // 꽃
    const bloom = (cx, cy, r, fill) => {
      const B = el('g', {}, G);
      for (let k = 0; k < 6; k++) { const a = k * 60 * Math.PI / 180; el('ellipse', { cx: cx + Math.cos(a) * r * 0.62, cy: cy + Math.sin(a) * r * 0.62, rx: r * 0.52, ry: r * 0.4, transform: `rotate(${k * 60} ${cx + Math.cos(a) * r * 0.62} ${cy + Math.sin(a) * r * 0.62})`, fill }, B); }
      el('circle', { cx, cy, r: r * 0.38, fill: 'url(#mrCore)' }, B);
      el('circle', { cx: cx - r * 0.12, cy: cy - r * 0.14, r: r * 0.12, fill: 'rgba(255,255,255,.6)' }, B);
    };
    bloom(-31, -122, 13, 'url(#mrPetO)'); bloom(33, -118, 13, 'url(#mrPetP)'); bloom(0, -152, 15, 'url(#mrPetR)');
    // 화분
    el('path', { d: 'M-30 -50L30 -50L23 0L-23 0Z', fill: 'url(#mrPot)' }, G);
    el('path', { d: 'M-18 -44L-14 -6', stroke: 'rgba(255,255,255,.28)', 'stroke-width': 4, 'stroke-linecap': 'round' }, G);
    el('rect', { x: -35, y: -60, width: 70, height: 13, rx: 3.5, fill: 'url(#mrPotRim)' }, G);
    el('ellipse', { cx: 0, cy: -60, rx: 33, ry: 3.2, fill: '#6b4126' }, G);
    return { g: G, P: [x, yb - 152 * s], top: yb - 167 * s, bottom: yb };
  }

  /* ---- 빛 화살표 (꺾인 선) ---- */
  function ray(g, pts, o = {}) {
    const col = o.color || RED, w = o.w || 3;
    const G = el('g', { 'pointer-events': 'none', opacity: o.op == null ? 1 : o.op }, g);
    const seg = [], cum = [0];
    for (let i = 1; i < pts.length; i++) { const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(L); cum.push(cum[i - 1] + L); }
    const total = cum[cum.length - 1];
    const halo = o.glow ? el('polyline', { fill: 'none', stroke: col, 'stroke-width': w * 3.4, 'stroke-opacity': 0.16, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, G) : null;
    const line = el('polyline', { fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': o.dash || '' }, G);
    const heads = [];
    if (o.head !== false) {
      const at = o.at == null ? 0.56 : o.at, hs = o.hs || 8 + w * 1.6;
      for (let i = 0; i < seg.length; i++) {
        if (o.heads && !o.heads[i]) continue;
        const a = pts[i], b = pts[i + 1], ux = (b[0] - a[0]) / seg[i], uy = (b[1] - a[1]) / seg[i];
        const hx = a[0] + (b[0] - a[0]) * at + ux * hs * 0.5, hy = a[1] + (b[1] - a[1]) * at + uy * hs * 0.5;
        const h = el('path', { d: `M${hx.toFixed(1)} ${hy.toFixed(1)}L${(hx - ux * hs - uy * hs * 0.55).toFixed(1)} ${(hy - uy * hs + ux * hs * 0.55).toFixed(1)}L${(hx - ux * hs + uy * hs * 0.55).toFixed(1)} ${(hy - uy * hs - ux * hs * 0.55).toFixed(1)}Z`, fill: col }, G);
        heads.push({ h, d: cum[i] + seg[i] * at });
      }
    }
    function setT(t) {
      const lim = total * Math.max(0, Math.min(1, t)), out = [pts[0]];
      for (let i = 0; i < seg.length; i++) {
        if (cum[i + 1] <= lim) { out.push(pts[i + 1]); continue; }
        const f = seg[i] ? (lim - cum[i]) / seg[i] : 0, a = pts[i], b = pts[i + 1];
        out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); break;
      }
      const s = out.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
      line.setAttribute('points', s); if (halo) halo.setAttribute('points', s);
      heads.forEach((k) => (k.h.style.display = k.d <= lim + 0.5 ? '' : 'none'));
    }
    setT(1);
    return { g: G, setT, total };
  }

  /* 여러 화살표를 차례로 자라게 (list: [{r, delay}]) */
  function grow(list, dur = 650) {
    if (reduce || !list.length) return;
    list.forEach((k) => k.r.setT(0));
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    (function tick(now) {
      let busy = false;
      list.forEach((k) => { const t = (now - t0 - (k.delay || 0)) / (k.dur || dur); if (t < 1) busy = true; k.r.setT(t <= 0 ? 0 : ease(Math.min(1, t))); });
      if (busy) requestAnimationFrame(tick);
    })(t0);
  }

  /* 부채꼴 각 표시 (cx, cy 기준, 각도 a0~a1 라디안) */
  function wedge(g, cx, cy, r, a0, a1, o = {}) {
    if (a1 < a0) [a0, a1] = [a1, a0];
    return el('path', { d: OP.arc(cx, cy, r, a0, a1) + `L${cx} ${cy}Z`, fill: o.fill || 'rgba(14,99,179,.12)', stroke: o.stroke || BLUE, 'stroke-width': o.w || 2 }, g);
  }
  const norm = (a) => { while (a < 0) a += Math.PI * 2; while (a >= Math.PI * 2) a -= Math.PI * 2; return a; };

  /* ---- 작도 장면 ---- */
  function build(host, o = {}) {
    const W = o.W || 1000, H = o.H || 620, MX = o.MX || 600, MT = o.MT || 66, FLOOR = o.floor || 566, FS = o.fs || 1.15;
    const svg = host.querySelector('svg');
    OP.defs(svg); OPA.defs(svg); defs(svg);
    const L = {};
    ['bg', 'grid', 'img', 'obj', 'scat', 'rays', 'ext', 'mirror', 'ang', 'meas', 'ph', 'top'].forEach((k) => (L[k] = el('g', {}, svg)));
    const ph = OP.photons(el('g', { filter: 'url(#opDot)' }, L.ph));
    const ov = OP.overlay(host, W, H);
    const S = { W, H, MX, MT, FLOOR, FS, svg, L, ov, ph, CELL,
      st: { px: o.px || MX - 7 * CELL, E: (o.E || [470, 206]).slice(), stage: 0, angles: o.angles !== false, labels: o.labels !== false, lamp: o.lamp !== false, nr: o.nr || 3, photons: o.photons !== false } };

    /* 배경: 거울 앞은 따뜻한 방, 거울 뒤쪽은 조금 차가운 색 */
    (function bg() {
      el('rect', { width: W, height: H, fill: 'url(#mrWall)' }, L.bg);
      el('rect', { x: MX, width: W - MX, height: H, fill: 'url(#mrBack)' }, L.bg);
      el('rect', { y: FLOOR - 26, width: MX, height: H - FLOOR + 26, fill: 'url(#mrFloor)' }, L.bg);
      el('rect', { x: MX, y: FLOOR - 26, width: W - MX, height: H - FLOOR + 26, fill: 'url(#mrFloorB)' }, L.bg);
      el('rect', { y: FLOOR - 26, width: W, height: 3, fill: 'rgba(120,70,30,.18)' }, L.bg);
      const tl = el('g', { stroke: 'rgba(140,80,30,.16)', 'stroke-width': 1.6 }, L.bg);
      for (let x = -400; x < W + 400; x += 90) el('line', { x1: x, y1: H, x2: x * 0.6 + W * 0.2, y2: FLOOR - 26 }, tl);
      el('line', { x1: 0, y1: FLOOR + 22, x2: W, y2: FLOOR + 22, stroke: 'rgba(140,80,30,.14)', 'stroke-width': 1.6 }, L.bg);
      // 벽 아래 걸레받이
      el('rect', { y: FLOOR - 38, width: MX, height: 12, fill: '#e7d3b4' }, L.bg);
      el('rect', { x: MX, y: FLOOR - 38, width: W - MX, height: 12, fill: '#d5dce4' }, L.bg);
    })();

    /* 모눈 (거리 비교 단계) */
    (function grid() {
      const g = L.grid; g.style.display = 'none';
      const p = [];
      for (let x = MX % CELL; x <= W; x += CELL) p.push(`M${x} 0V${FLOOR - 26}`);
      for (let y = 0; y <= FLOOR - 26; y += CELL) p.push(`M0 ${y}H${W}`);
      el('path', { d: p.join(''), stroke: 'rgba(14,99,179,.13)', 'stroke-width': 1 }, g);
    })();

    /* 거울 (앞면이 x = MX) */
    (function mirror() {
      const g = L.mirror, T = 16;
      el('rect', { x: MX - 3, y: MT - 4, width: T + 6, height: FLOOR - MT + 4, rx: 3, fill: 'url(#mrEdge)' }, g);
      el('rect', { x: MX, y: MT, width: T, height: FLOOR - MT - 6, fill: 'url(#mrGlass)' }, g);
      el('path', { d: `M${MX + 4} ${MT + 30}L${MX + 4} ${MT + 150}M${MX + 9} ${MT + 210}L${MX + 9} ${MT + 260}`, stroke: 'rgba(255,255,255,.75)', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g);
      el('line', { x1: MX, y1: MT, x2: MX, y2: FLOOR - 6, stroke: '#e9f7fd', 'stroke-width': 2 }, g);
      // 받침
      el('path', { d: `M${MX - 34} ${FLOOR + 6}L${MX + T + 34} ${FLOOR + 6}L${MX + T + 22} ${FLOOR - 10}L${MX - 22} ${FLOOR - 10}Z`, fill: '#3c4c5a' }, g);
      el('rect', { x: MX - 34, y: FLOOR + 6, width: T + 68, height: 6, rx: 2, fill: '#2a3640' }, g);
      el('ellipse', { cx: MX + 8, cy: FLOOR + 14, rx: 60, ry: 6, fill: 'rgba(60,30,10,.18)' }, g);
    })();

    S.geo = () => {
      const st = S.st, P = [st.px, FLOOR - 152 * FS], P2 = [2 * MX - P[0], P[1]];
      const offs = st.nr === 1 ? [0] : st.nr === 2 ? [-16, 16] : [-22, 0, 22];
      const T = offs.map((d) => [st.E[0] + 12, st.E[1] + d]);
      const M = T.map((t) => { const f = (P2[0] - MX) / (P2[0] - t[0]); return [MX, P2[1] + (t[1] - P2[1]) * f]; });
      return { P, P2, T, M, lamp: [150, 96] };
    };
    S.angle = (P, M) => Math.round(Math.atan2(Math.abs(P[1] - M[1]), Math.abs(P[0] - M[0])) * 180 / Math.PI);

    /* 각 표시: 반사면과 수직인 선, 입사각, 반사각 */
    S.drawAngles = (g, M, P, E, o2 = {}) => {
      el('line', { x1: M[0], y1: M[1], x2: M[0] - (o2.nl || 150), y2: M[1], stroke: '#5d6b7b', 'stroke-width': 1.8, 'stroke-dasharray': '7 6' }, g);
      const aN = Math.PI, aP = norm(Math.atan2(P[1] - M[1], P[0] - M[0])), aE = E ? norm(Math.atan2(E[1] - M[1], E[0] - M[0])) : null;
      const r = o2.r || 56;
      wedge(g, M[0], M[1], r, aP, aN);
      if (aE != null) wedge(g, M[0], M[1], r, aN, aE, o2.okColor ? { stroke: o2.okColor, fill: o2.okFill } : {});
      return { aP, aE, i: S.angle(P, M), o: E ? S.angle(E, M) : null };
    };

    let prev = -1;
    S.render = (stage, ro = {}) => {
      const st = S.st; st.stage = stage;
      const anim = ro.anim && stage > prev && prev >= 0;
      const from = anim ? prev : 99;
      const G = S.geo(), { P, P2, T, M } = G, lp = G.lamp;
      ['img', 'obj', 'scat', 'rays', 'ext', 'ang', 'meas', 'top'].forEach((k) => (L[k].innerHTML = ''));
      ov.hideAll(); ph.clear();
      const growL = [];
      const add = (r, s, delay = 0, dur) => { if (s > from) growL.push({ r, delay, dur }); return r; };

      // 물체·광원·눈
      if (st.lamp) { OPA.pendant(L.obj, lp[0], lp[1], 0.82, true); }
      MR.flower(L.obj, st.px, FLOOR, FS);
      OP.eye(L.obj, st.E[0], st.E[1], 100, { lx: 11, ly: 1 });
      if (st.labels) {
        ov.put('obj', st.px, FLOOR + 30, '물체(화분)', 'ink');
        ov.put('eye', st.E[0] - 2, st.E[1] + 40, '눈', 'ink');
        ov.put('mir', MX + 8, MT - 26, '평면거울', 'ink');
        if (st.lamp) ov.put('lamp', lp[0], lp[1] + 48, '광원', 'ink');
        ov.put('back', (MX + W) / 2 + 20, 26, '거울 뒤쪽', 'inks');
      }

      // 1 사방으로 반사
      const bare = !!st.bare;
      if (stage >= 1 && !bare) {
        const showScat = stage <= 2 || ro.keepScatter;
        if (st.lamp) add(ray(L.scat, [[lp[0] + 16, lp[1] + 20], [P[0] - 8, P[1] - 10]], { color: '#e89a12', w: 3, glow: true }), 1, 0, 500);
        if (showScat) {
          const dirs = [-150, -115, -80, -40, -12, 14, 40, 155, 190, 215];
          dirs.forEach((dg, i) => {
            const a = dg * Math.PI / 180, r0 = 26, r1 = 120;
            add(ray(L.scat, [[P[0] + Math.cos(a) * r0, P[1] + Math.sin(a) * r0], [P[0] + Math.cos(a) * r1, P[1] + Math.sin(a) * r1]], { w: 2.6, at: 0.62, op: stage === 1 ? 0.9 : 0.35 }), 1, 380 + i * 40, 420);
            if (stage === 1 && st.photons) ph.add([[P[0] + Math.cos(a) * r0, P[1] + Math.sin(a) * r0], [P[0] + Math.cos(a) * (r1 + 10), P[1] + Math.sin(a) * (r1 + 10)]], { rate: 0.9, speed: 90, color: '#ff8a70', r: 3.4 });
          });
        }
        if (stage === 1 && st.photons && st.lamp) ph.add([[lp[0] + 16, lp[1] + 20], [P[0] - 8, P[1] - 10]], { rate: 1.6, speed: 160, color: '#ffc04a', r: 3.8 });
        el('circle', { cx: P[0], cy: P[1], r: 7, fill: '#fff', stroke: RED, 'stroke-width': 3 }, L.top);
        if (st.labels && stage <= 2) ov.put('pt', P[0] - 64, P[1] - 30, '물체의 한 점', 'inkk');
      }

      // 2~4 거울로 가는 빛과 반사
      const mid = Math.floor(M.length / 2);
      if (stage >= 2 && !bare) {
        const idx = stage >= 4 ? M.map((_, i) => i) : [mid];
        idx.forEach((i, k) => {
          if (i === mid) {
            add(ray(L.rays, [P, M[i]], { w: 3, glow: true, at: 0.55 }), 2, 0, 700);
            if (stage >= 3) add(ray(L.rays, [M[i], T[i]], { w: 3, glow: true, at: 0.5 }), 3, 0, 700);
          } else add(ray(L.rays, [P, M[i], T[i]], { w: 3, glow: true, at: 0.55, op: 0.92 }), 4, k * 260, 900);
          if (stage >= 3 && st.photons) ph.add([P, M[i], T[i]], { rate: 0.9, speed: 230, color: '#ff7a60', r: 4, phase: k / 3 });
        });
        el('circle', { cx: M[mid][0], cy: M[mid][1], r: 4.5, fill: RED }, L.top);
        if (st.angles && stage >= 2 && stage <= 4) {
          const a = S.drawAngles(L.ang, M[mid], P, stage >= 3 ? T[mid] : null);
          const lx = M[mid][0] - 128;
          ov.put('ai', lx, M[mid][1] + 34, `입사각 ${a.i}°`, 'inkk');
          if (a.aE != null) ov.put('ao', lx, M[mid][1] - 34, `반사각 ${a.o}°`, 'inkk');
          if (st.labels) ov.put('nl', M[mid][0] - 156, M[mid][1], '반사면과 수직인 선', 'inks la');
        }
      }

      // 5 연장선
      if (stage >= 5 && !bare) {
        M.forEach((m, i) => {
          const dx = m[0] - T[i][0], dy = m[1] - T[i][1], Lm = Math.hypot(dx, dy);
          const end = [P2[0] + dx / Lm * 70, P2[1] + dy / Lm * 70];
          add(ray(L.ext, [m, end], { w: 2.4, dash: '9 8', head: false, op: 0.85 }), 5, i * 260, 900);
        });
        const dot = el('g', {}, L.top);
        el('circle', { cx: P2[0], cy: P2[1], r: 18, fill: 'rgba(224,64,47,.18)', class: stage === 5 ? 'pulse' : '' }, dot);
        el('circle', { cx: P2[0], cy: P2[1], r: 6.5, fill: '#fff', stroke: RED, 'stroke-width': 3 }, dot);
        if (stage === 5 && from < 5) { dot.style.opacity = 0; setTimeout(() => (dot.style.opacity = ''), reduce ? 0 : 1300); }
        if (st.labels && stage <= 6) ov.put('ex', MX + 70, Math.min(...M.map((m) => m[1])) - 34, '연장선', 'ink');
        if (st.labels && stage === 5) {
          const show = () => { if (st.stage === 5) ov.put('meet', P2[0] - 20, P2[1] + 44, '한 점에서 만나요', 'inkk'); };
          if (from < 5 && !reduce) setTimeout(show, 1300); else show();
        }
      }

      // 6 상
      if (stage >= 6) {
        const ig = el('g', { transform: `translate(${2 * MX} 0) scale(-1 1)`, opacity: 0.55 }, L.img);
        MR.flower(ig, st.px, FLOOR, FS, { shadow: false });
        if (from < 6) { ig.style.transformOrigin = `${P2[0]}px ${FLOOR}px`; ig.animate && !reduce && ig.animate([{ opacity: 0 }, { opacity: 0.55 }], { duration: 900, easing: 'ease-out' }); }
        if (st.labels) { ov.put('img', P2[0], FLOOR + 30, '상', 'inkk'); if (stage === 6) ov.put('pt2', P2[0] + 70, P2[1] - 26, '상의 위치', 'inkk'); }
      }

      // 7 거리·크기 비교
      L.grid.style.display = stage >= 7 ? '' : 'none';
      if (stage >= 7) {
        const y = P[1] - 62, n = Math.round((MX - P[0]) / CELL);
        const dim = (x1, x2, lab, id) => {
          el('line', { x1, y1: y, x2, y2: y, stroke: BLUE, 'stroke-width': 2.4 }, L.meas);
          [x1, x2].forEach((x) => el('line', { x1: x, y1: y - 9, x2: x, y2: y + 9, stroke: BLUE, 'stroke-width': 2.4 }, L.meas));
          ov.put(id, (x1 + x2) / 2, y + 22, lab, 'inkk');
        };
        el('line', { x1: P[0], y1: P[1], x2: P2[0], y2: P2[1], stroke: BLUE, 'stroke-width': 1.6, 'stroke-dasharray': '3 5' }, L.meas);
        dim(P[0], MX, `${n}칸`, 'd1'); dim(MX, P2[0], `${n}칸`, 'd2');
        const top = FLOOR - 167 * FS;
        [[st.px - 70, 'h1'], [P2[0] + 70, 'h2']].forEach(([x, id]) => {
          el('line', { x1: x, y1: top, x2: x, y2: FLOOR, stroke: '#34495e', 'stroke-width': 2 }, L.meas);
          [top, FLOOR].forEach((yy) => el('line', { x1: x - 8, y1: yy, x2: x + 8, y2: yy, stroke: '#34495e', 'stroke-width': 2 }, L.meas));
        });
        ov.put('h1', st.px - 70, top - 18, '물체의 높이', 'inks'); ov.put('h2', P2[0] + 70, top - 18, '상의 높이', 'inks');
      }
      grow(growL);
      prev = stage;
      S.G = G;
      return G;
    };
    S.reset = () => { prev = -1; };
    return S;
  }

  return { defs, flower, ray, grow, wedge, norm, build, RED, BLUE, CELL, reduce };
})();
