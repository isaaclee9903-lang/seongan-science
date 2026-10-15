/* ===== 물체의 색 그림 도구 (SVG 2D 일러스트) =====
   OC.LIGHTS / OC.OBJS           조명 4가지(흰색·빨간색·초록색·파란색)와 물체 3가지(사과·잎·셔츠)
   OC.seen(물체, 조명)            그 조명에서 보이는 색 이름 ('빨간색' … '검은색')
   OC.defs(svg)                   그라디언트·흐림 필터
   OC.apple(g, x, y, s)           잎 달린 빨간 사과   OC.shirt(g, x, y, s)  옷걸이에 걸린 파란 셔츠
   OC.torch(g, x, y, 각도, s)     3색 LED 손전등 → set('red' | null)
   OC.litFilter(svg, id)          조명 색을 곱하는 필터 → set([r,g,b]) / to([r,g,b], ms)
   OC.lab(host, 옵션)             조명 실험 장면(어두운 방, 흰 천, 사과, 셔츠, 손전등, 눈, 빛의 경로)
   물체의 색은 '물체가 반사하는 빛 × 조명 빛'으로 칠한 개념 이해용 모형이에요. */
window.OC = (() => {
  const { el } = OP;
  const LIGHTS = {
    white: { name: '흰색', rgb: [1, 1, 1], col: '#f4f6fa' },
    red: { name: '빨간색', rgb: [1, 0, 0], col: '#ff3b30' },
    green: { name: '초록색', rgb: [0, 1, 0], col: '#34d058' },
    blue: { name: '파란색', rgb: [0, 0, 1], col: '#3d6dff' },
  };
  const RAY = { r: '#ff4a3c', g: '#3fe064', b: '#5a86ff' };
  const OBJS = {
    apple: { name: '빨간 사과', ch: 'r', col: '빨간색' },
    leaf: { name: '초록 잎', ch: 'g', col: '초록색' },
    shirt: { name: '파란 셔츠', ch: 'b', col: '파란색' },
  };
  const CHI = { r: 0, g: 1, b: 2 };
  const SWATCH = { 빨간색: '#e0342a', 초록색: '#23a047', 파란색: '#2c55d8', 검은색: '#17191d', 흰색: '#f4f6fa' };
  const seen = (obj, light) => (LIGHTS[light].rgb[CHI[OBJS[obj].ch]] ? OBJS[obj].col : '검은색');
  const rid = () => Math.random().toString(36).slice(2, 7);

  function defs(svg) {
    const d = svg.querySelector('defs') || el('defs', {}, svg);
    if (d.querySelector('#ocApple')) return d;
    d.insertAdjacentHTML('beforeend', `
      <filter id="ocBlur3" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="ocBlur8" x="-40%" y="-80%" width="180%" height="260%"><feGaussianBlur stdDeviation="8"/></filter>
      <filter id="ocBlur16" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter>
      <radialGradient id="ocApple" cx=".36" cy=".34" r=".78"><stop offset="0" stop-color="#ff2414"/><stop offset=".38" stop-color="#e0170b"/><stop offset=".72" stop-color="#a80c05"/><stop offset="1" stop-color="#560402"/></radialGradient>
      <radialGradient id="ocAppleRim" cx=".42" cy=".4" r=".62"><stop offset=".72" stop-color="#2a0100" stop-opacity="0"/><stop offset="1" stop-color="#2a0100" stop-opacity=".55"/></radialGradient>
      <radialGradient id="ocCavity" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3a0402"/><stop offset=".7" stop-color="#7a0904" stop-opacity=".7"/><stop offset="1" stop-color="#a80c05" stop-opacity="0"/></radialGradient>
      <linearGradient id="ocLeaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d21e"/><stop offset=".55" stop-color="#169a12"/><stop offset="1" stop-color="#075a07"/></linearGradient>
      <linearGradient id="ocLeafB" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#0c6e0b"/><stop offset="1" stop-color="#0a4f09"/></linearGradient>
      <linearGradient id="ocStem" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a1608"/><stop offset=".45" stop-color="#6a4120"/><stop offset="1" stop-color="#26130a"/></linearGradient>
      <linearGradient id="ocShirt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#050a78"/><stop offset=".22" stop-color="#1018d8"/><stop offset=".5" stop-color="#1c22f2"/><stop offset=".78" stop-color="#0e16c8"/><stop offset="1" stop-color="#040864"/></linearGradient>
      <linearGradient id="ocShirtV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
      <linearGradient id="ocCloth" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#d6d6d3"/><stop offset=".08" stop-color="#f1f1ef"/><stop offset=".17" stop-color="#dcdcd9"/><stop offset=".3" stop-color="#f4f4f2"/><stop offset=".42" stop-color="#e2e2df"/>
        <stop offset=".55" stop-color="#f6f6f4"/><stop offset=".68" stop-color="#dededb"/><stop offset=".8" stop-color="#f2f2f0"/><stop offset=".92" stop-color="#dadad7"/><stop offset="1" stop-color="#eeeeec"/></linearGradient>
      <linearGradient id="ocClothV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".08"/></linearGradient>
      <linearGradient id="ocTable" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c4c4c1"/><stop offset="1" stop-color="#e9e9e6"/></linearGradient>
      <linearGradient id="ocTableF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c9c99"/><stop offset="1" stop-color="#7a7a77"/></linearGradient>
      <linearGradient id="ocWire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f2f0"/><stop offset=".5" stop-color="#a9a9a6"/><stop offset="1" stop-color="#d6d6d3"/></linearGradient>
      <linearGradient id="ocAlu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b626c"/><stop offset=".18" stop-color="#9aa2ac"/><stop offset=".34" stop-color="#3a4048"/><stop offset=".75" stop-color="#16191e"/><stop offset="1" stop-color="#2a2f36"/></linearGradient>
      <linearGradient id="ocAluHead" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b737e"/><stop offset=".2" stop-color="#c3cad2"/><stop offset=".38" stop-color="#4a515a"/><stop offset=".8" stop-color="#1b1f24"/><stop offset="1" stop-color="#333941"/></linearGradient>
      <radialGradient id="ocLensGlass" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#3a414a"/><stop offset="1" stop-color="#0d0f12"/></radialGradient>
      <radialGradient id="ocVig" cx=".46" cy=".52" r=".7"><stop offset=".35" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity=".88"/></radialGradient>`);
    return d;
  }

  function litFilter(svg, id) {
    const f = el('filter', { id, x: '0', y: '0', width: '100%', height: '100%', 'color-interpolation-filters': 'sRGB' }, defs(svg));
    const m = el('feColorMatrix', { type: 'matrix' }, f);
    let cur = [1, 1, 1], raf = 0;
    const set = (c) => { cur = c.slice(); m.setAttribute('values', `${c[0].toFixed(3)} 0 0 0 0  0 ${c[1].toFixed(3)} 0 0 0  0 0 ${c[2].toFixed(3)} 0 0  0 0 0 1 0`); };
    set(cur);
    return {
      set,
      to(c, ms = 520, done) {
        cancelAnimationFrame(raf);
        if (window.FLOW && FLOW.REDUCE) { set(c); if (done) done(); return; }
        const a = cur.slice(), t0 = performance.now();
        const step = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); set(a.map((v, i) => v + (c[i] - v) * e)); if (k < 1) raf = requestAnimationFrame(step); else if (done) done(); };
        raf = requestAnimationFrame(step);
      },
      get cur() { return cur; },
    };
  }

  /* 사과: 가운데 (0,0), 반지름 약 100. 잎은 꼭지에서 오른쪽 위로 */
  function apple(par, x, y, s = 1, o = {}) {
    const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, par);
    if (o.shadow !== false) el('ellipse', { cx: 10, cy: 94, rx: 96, ry: 15, fill: '#000', opacity: 0.5, filter: 'url(#ocBlur8)' }, g);
    const body = 'M0 -60C24 -88 80 -92 99 -40C117 8 93 70 53 92C37 101 18 99 0 92C-18 99 -37 101 -53 92C-93 70 -117 8 -99 -40C-80 -92 -24 -88 0 -60Z';
    const cid = 'oca' + rid();
    el('clipPath', { id: cid }, g).appendChild(el('path', { d: body }));
    el('path', { d: body, fill: 'url(#ocApple)' }, g);
    const inn = el('g', { 'clip-path': `url(#${cid})` }, g);
    // 세로 줄무늬 (사과 껍질 결)
    [[-70, .5], [-46, .7], [-22, .55], [6, .65], [30, .5], [56, .6], [78, .45]].forEach(([dx, op], i) => {
      el('path', { d: `M${dx * 0.25} -58C${dx * 0.9} -40 ${dx * 1.15} 20 ${dx * 0.75} 96`, fill: 'none', stroke: i % 2 ? '#7a0603' : '#ff2a12', 'stroke-width': i % 2 ? 9 : 5, opacity: op * 0.45, filter: 'url(#ocBlur3)' }, inn);
    });
    // 작은 점(껍질 숨구멍)
    let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 46; i++) { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 88; el('ellipse', { cx: (Math.cos(a) * r).toFixed(1), cy: (Math.sin(a) * r * 0.9 + 6).toFixed(1), rx: 1.6, ry: 1.1, fill: '#ff3a1a', opacity: 0.45 }, inn); }
    el('path', { d: body, fill: 'url(#ocAppleRim)' }, inn);
    el('ellipse', { cx: 0, cy: -58, rx: 30, ry: 13, fill: 'url(#ocCavity)' }, inn);
    // 반짝임 (아주 약하게: 조명 색을 그대로 비춤)
    el('ellipse', { cx: -46, cy: -26, rx: 14, ry: 28, transform: 'rotate(28 -46 -26)', fill: '#fff', opacity: 0.3, filter: 'url(#ocBlur3)' }, inn);
    el('ellipse', { cx: -54, cy: -38, rx: 4, ry: 8, transform: 'rotate(28 -54 -38)', fill: '#fff', opacity: 0.45 }, inn);
    // 꼭지
    el('path', { d: 'M-2 -58C-3 -78 2 -96 12 -110', fill: 'none', stroke: 'url(#ocStem)', 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
    el('path', { d: 'M0 -64C0 -80 4 -94 11 -106', fill: 'none', stroke: '#8a5a2c', 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0.7 }, g);
    if (o.leaf !== false) {
      const L = el('g', {}, g);
      el('path', { d: 'M8 -100C22 -150 82 -168 122 -146C100 -112 48 -86 8 -100Z', fill: 'url(#ocLeaf)' }, L);
      el('path', { d: 'M8 -100C40 -112 86 -128 122 -146C100 -112 48 -86 8 -100Z', fill: 'url(#ocLeafB)', opacity: 0.75 }, L);
      el('path', { d: 'M9 -100C42 -116 84 -132 120 -146', fill: 'none', stroke: '#2ee02c', 'stroke-width': 2.4, opacity: 0.7 }, L);
      [[30, -110, 36, -132], [52, -118, 62, -142], [74, -126, 88, -148], [40, -113, 52, -100], [66, -122, 80, -108]].forEach(([a, b, c, d2]) =>
        el('path', { d: `M${a} ${b}Q${(a + c) / 2 + 4} ${(b + d2) / 2} ${c} ${d2}`, fill: 'none', stroke: '#22c822', 'stroke-width': 1.3, opacity: 0.55 }, L));
      el('path', { d: 'M14 -108C30 -140 70 -156 104 -150', fill: 'none', stroke: '#40ff3a', 'stroke-width': 2, opacity: 0.22, filter: 'url(#ocBlur3)' }, L);
    }
    return g;
  }

  /* 셔츠: 옷걸이 고리 끝이 (0,-205), 몸판 아래 끝 y=148 */
  function shirt(par, x, y, s = 1) {
    const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, par);
    const body = 'M-30 -150C-56 -142 -90 -134 -112 -120L-150 -8L-116 6L-98 -58L-98 146C-60 153 60 153 98 146L98 -58L116 6L150 -8L112 -120C90 -134 56 -142 30 -150C18 -138 -18 -138 -30 -150Z';
    el('path', { d: body, fill: '#000', opacity: 0.35, transform: 'translate(10 12)', filter: 'url(#ocBlur8)' }, g);
    // 옷걸이
    el('path', { d: 'M0 -150L0 -176C0 -196 22 -200 22 -186', fill: 'none', stroke: 'url(#ocWire)', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, g);
    el('path', { d: 'M-108 -124L0 -156L108 -124', fill: 'none', stroke: 'url(#ocWire)', 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
    const cid = 'ocs' + rid();
    el('clipPath', { id: cid }, g).appendChild(el('path', { d: body }));
    el('path', { d: body, fill: 'url(#ocShirt)' }, g);
    const inn = el('g', { 'clip-path': `url(#${cid})` }, g);
    el('path', { d: body, fill: 'url(#ocShirtV)' }, inn);
    // 주름: 어두운 골과 밝은 등
    [['M-60 -40C-50 20 -64 90 -54 150', '#050c5c', 10, .45], ['M44 -60C36 0 52 80 40 150', '#050c5c', 12, .4], ['M-20 40C-10 80 -18 120 -12 150', '#050c5c', 7, .35],
      ['M-72 -50C-62 10 -78 90 -66 150', '#3a40ff', 6, .35], ['M58 -50C50 10 64 80 54 150', '#3a40ff', 6, .3], ['M-130 -40L-112 -2', '#050c5c', 8, .5], ['M130 -40L112 -2', '#050c5c', 8, .5],
      ['M-98 -58C-96 -80 -104 -100 -112 -118', '#030844', 6, .55], ['M98 -58C96 -80 104 -100 112 -118', '#030844', 6, .55]].forEach(([d, c, w, op]) =>
      el('path', { d, fill: 'none', stroke: c, 'stroke-width': w, opacity: op, filter: 'url(#ocBlur3)', 'stroke-linecap': 'round' }, inn));
    // 소매 끝단
    el('path', { d: 'M-150 -8L-116 6L-112 -6L-146 -20Z', fill: '#0810a8', opacity: 0.9 }, g);
    el('path', { d: 'M150 -8L116 6L112 -6L146 -20Z', fill: '#0810a8', opacity: 0.9 }, g);
    // 단추 줄과 단추
    el('path', { d: 'M0 -126L0 146', stroke: '#060e94', 'stroke-width': 2.5 }, g);
    el('path', { d: 'M8 -126L8 146', stroke: '#2a30ff', 'stroke-width': 1.2, opacity: 0.6 }, g);
    [-96, -44, 8, 60, 112].forEach((by) => { el('circle', { cx: 4, cy: by, r: 5.2, fill: '#2028f0', stroke: '#060c88', 'stroke-width': 1.4 }, g); el('circle', { cx: 3, cy: by - 1.5, r: 1.6, fill: '#5058ff', opacity: 0.8 }, g); });
    // 주머니
    el('path', { d: 'M-70 -82L-30 -82L-30 -40C-30 -34 -70 -34 -70 -40Z', fill: 'none', stroke: '#060e94', 'stroke-width': 2, 'stroke-dasharray': '3 3', opacity: 0.85 }, g);
    // 깃
    el('path', { d: 'M-30 -150C-24 -136 -12 -118 -2 -110L-14 -98L-48 -136Z', fill: '#1a22ee', stroke: '#060c88', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, g);
    el('path', { d: 'M30 -150C24 -136 12 -118 2 -110L14 -98L48 -136Z', fill: '#161ee2', stroke: '#060c88', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, g);
    el('path', { d: 'M-30 -150C-18 -140 18 -140 30 -150C22 -144 -22 -144 -30 -150Z', fill: '#050c5c' }, g);
    return g;
  }

  /* 3색 LED 손전등: (x, y)가 앞 렌즈 가운데, 각도(도)는 비추는 방향 */
  function torch(par, x, y, deg, s = 1) {
    const g = el('g', { transform: `translate(${x} ${y}) rotate(${deg}) scale(${s})`, 'pointer-events': 'none' }, par);
    el('ellipse', { cx: -90, cy: 40, rx: 110, ry: 12, fill: '#000', opacity: 0.35, filter: 'url(#ocBlur8)' }, g);
    el('rect', { x: -206, y: -21, width: 22, height: 42, rx: 8, fill: 'url(#ocAlu)' }, g);
    el('rect', { x: -188, y: -22, width: 150, height: 44, rx: 6, fill: 'url(#ocAlu)' }, g);
    for (let i = 0; i < 14; i++) el('rect', { x: -176 + i * 6.5, y: -22, width: 2.4, height: 44, fill: '#0b0d10', opacity: 0.55 }, g);
    el('rect', { x: -84, y: -26, width: 18, height: 8, rx: 3, fill: '#262b32' }, g);
    el('path', { d: 'M-40 -22L-6 -36L0 -36L0 36L-6 36L-40 22Z', fill: 'url(#ocAluHead)' }, g);
    el('ellipse', { cx: 0, cy: 0, rx: 9, ry: 36, fill: '#2a2f36', stroke: '#8e96a0', 'stroke-width': 1.5 }, g);
    el('ellipse', { cx: 1.5, cy: 0, rx: 6.5, ry: 31, fill: 'url(#ocLensGlass)' }, g);
    const leds = {};
    [['red', -16, '#5a0f0b', '#ff3b30'], ['green', 0, '#0f3d18', '#34d058'], ['blue', 16, '#101f57', '#3d6dff']].forEach(([k, yy, off, on]) => {
      const glow = el('ellipse', { cx: 4, cy: yy, rx: 16, ry: 16, fill: on, opacity: 0, filter: 'url(#ocBlur3)' }, g);
      const dot = el('ellipse', { cx: 2.5, cy: yy, rx: 3, ry: 5, fill: off }, g);
      leds[k] = { glow, dot, off, on };
    });
    return {
      g,
      set(k) {
        Object.entries(leds).forEach(([n, L]) => { const v = k === 'white' || k === n; L.dot.setAttribute('fill', v ? '#fff' : L.off); L.glow.setAttribute('opacity', v ? 0.95 : 0); L.glow.setAttribute('fill', L.on); });
      },
    };
  }

  function arrow(par, p0, p1, col, o = {}) {
    const w = o.w || 3, g = el('g', { 'pointer-events': 'none' }, par);
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, hs = o.hs || 13;
    el('line', { x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1], stroke: col, 'stroke-width': w * 4, 'stroke-opacity': 0.16, 'stroke-linecap': 'round' }, g);
    const end = o.head === false ? p1 : [p1[0] - ux * hs * 0.7, p1[1] - uy * hs * 0.7];
    el('line', { x1: p0[0], y1: p0[1], x2: end[0], y2: end[1], stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-dasharray': o.dash || '' }, g);
    if (o.head !== false) { const hx = p1[0], hy = p1[1]; el('path', { d: `M${hx} ${hy}L${hx - ux * hs - uy * hs * 0.5} ${hy - uy * hs + ux * hs * 0.5}L${hx - ux * hs + uy * hs * 0.5} ${hy - uy * hs - ux * hs * 0.5}Z`, fill: col }, g); }
    return g;
  }

  /* 흡수 표시: 빛이 물체 표면에서 사라지는 작은 번짐 */
  function absorb(par, p, col) {
    const g = el('g', { 'pointer-events': 'none' }, par);
    el('circle', { cx: p[0], cy: p[1], r: 13, fill: col, opacity: 0.35, filter: 'url(#ocBlur3)' }, g);
    el('circle', { cx: p[0], cy: p[1], r: 5, fill: 'none', stroke: col, 'stroke-width': 2, opacity: 0.8 }, g);
    return g;
  }

  /* 조명 실험 장면. 옵션: rays(빛의 경로 보기), eye(눈 그림), labels(이름표), shirt(셔츠 포함) */
  function lab(host, o = {}) {
    const W = 1000, H = 600;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': o.aria || '어두운 방에서 3색 LED 손전등으로 빨간 사과와 파란 셔츠를 비추는 장면' }, null);
    host.prepend(svg);
    OP.defs(svg); defs(svg);
    const fid = 'ocLit' + rid(), F = litFilter(svg, fid);
    el('rect', { width: W, height: H, fill: '#040506' }, svg);
    const lit = el('g', { filter: `url(#${fid})` }, svg);
    // 흰 천(뒤 배경)과 탁자
    el('path', { d: 'M40 18C200 30 800 30 960 18L960 420L40 420Z', fill: 'url(#ocCloth)' }, lit);
    el('path', { d: 'M40 18C200 30 800 30 960 18L960 420L40 420Z', fill: 'url(#ocClothV)' }, lit);
    el('path', { d: 'M0 408L1000 408L1000 600L0 600Z', fill: 'url(#ocTable)' }, lit);
    el('path', { d: 'M0 408L1000 408L1000 416L0 416Z', fill: '#000', opacity: 0.12 }, lit);
    // 옷걸이 봉
    if (o.shirt !== false) {
      el('rect', { x: 560, y: 52, width: 290, height: 9, rx: 4.5, fill: 'url(#ocWire)' }, lit);
      el('rect', { x: 560, y: 63, width: 290, height: 5, fill: '#000', opacity: 0.12, filter: 'url(#ocBlur3)' }, lit);
      shirt(lit, 705, 262, 0.98);
    }
    apple(lit, 352, 410 - 92 * 0.95, 0.95);
    // 빛 번짐(공기 중 산란)과 손전등
    const beamId = 'ocBeam' + rid();
    el('linearGradient', { id: beamId, x1: '0', y1: '0', x2: '1', y2: '0' }, svg.querySelector('defs')).innerHTML = '<stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".55" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>';
    const TX = 168, TY = 122, TA = 34;
    const beam = el('g', { transform: `translate(${TX} ${TY}) rotate(${TA})`, opacity: 0, style: 'mix-blend-mode:screen;transition:opacity .5s' }, svg);
    const beamPath = el('path', { d: 'M4 -30L900 -330L900 330L4 30Z', fill: `url(#${beamId})`, filter: 'url(#ocBlur16)' }, beam);
    el('rect', { width: W, height: H, fill: 'url(#ocVig)', 'pointer-events': 'none' }, svg);
    const T = torch(svg, TX, TY, TA, 0.92);
    const head = [TX + Math.cos(TA * Math.PI / 180) * 6, TY + Math.sin(TA * Math.PI / 180) * 6];
    // 눈, 빛의 경로 층
    const rayG = el('g', {}, svg), dotG = el('g', {}, svg);
    const EYE = [900, 528];
    if (o.eye !== false) OP.eye(svg, EYE[0], EYE[1], 74, { lx: -12, ly: -6 });
    const ov = OP.overlay(host, W, H);
    const HIT = { apple: [300, 338], leaf: [410, 206], shirt: [660, 196] };
    const TO = { apple: [EYE[0] - 36, EYE[1] - 12], leaf: [EYE[0] - 28, EYE[1] - 27], shirt: [EYE[0] - 16, EYE[1] - 34] };
    const NAMEPOS = { apple: [352, 498, ''], leaf: [482, 186, 'ra'], shirt: [705, 432, ''] };
    if (o.labels !== false) Object.entries(NAMEPOS).forEach(([k, [x, y]]) => { if (k !== 'shirt' || o.shirt !== false) ov.put('n-' + k, x, y, OBJS[k].name, NAMEPOS[k][2]); });
    if (o.eye !== false) ov.put('eye', EYE[0], EYE[1] + 38, '관찰자의 눈', 'soft');
    const ph = window.FLOW ? OP.photons(dotG) : null;
    let light = null, on = false, rays = o.rays !== false;

    function drawRays() {
      rayG.innerHTML = ''; if (ph) ph.clear(); ['apple', 'leaf', 'shirt'].forEach((k) => ov.hide('ab-' + k));
      if (!on || !rays) return;
      const L = LIGHTS[light];
      ['apple', 'leaf', 'shirt'].forEach((k) => {
        if (k === 'shirt' && o.shirt === false) return;
        const hit = HIT[k], ch = OBJS[k].ch;
        const comps = ['r', 'g', 'b'].filter((c) => L.rgb[CHI[c]]);
        const dx = hit[0] - head[0], dy = hit[1] - head[1], len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
        let anyRefl = false;
        comps.forEach((c, i) => {
          const off = comps.length > 1 ? (i - 1) * 6 : 0;
          const a = [head[0] + nx * off, head[1] + ny * off], b = [hit[0] + nx * off, hit[1] + ny * off];
          const refl = c === ch;
          arrow(rayG, a, b, RAY[c], { w: 2.4, hs: 11, head: !refl });
          if (refl) {
            anyRefl = true;
            const g0 = el('g', { 'pointer-events': 'none' }, rayG);
            el('circle', { cx: b[0], cy: b[1], r: 20, fill: RAY[c], opacity: 0.55, filter: 'url(#ocBlur3)' }, g0);
            el('circle', { cx: b[0], cy: b[1], r: 6, fill: '#fff', opacity: 0.9 }, g0);
            arrow(rayG, b, TO[k], RAY[c], { w: 3.6, hs: 15 });
            if (ph) ph.add([a, b, TO[k]], { rate: 1.8, speed: 260, r: 5, color: RAY[c] });
          } else {
            absorb(rayG, b, RAY[c]);
            if (ph) ph.add([a, b], { rate: 1.5, speed: 260, r: 4.4, color: RAY[c], fade: 40 });
          }
        });
        const lp = { apple: [222, 352], leaf: [404, 146], shirt: [598, 160] }[k];
        const cname = { r: '빨간색', g: '초록색', b: '파란색' }[ch];
        ov.put('ab-' + k, lp[0], lp[1], anyRefl ? `${cname} 빛${comps.length > 1 ? '만' : ''} 반사` : '모두 흡수', anyRefl ? 'ink' : 'ink dim');
      });
    }
    function setLight(k, isOn, instant) {
      light = k; on = isOn;
      const amp = k === 'white' ? 0.96 : 0.84, rgb = on ? LIGHTS[k].rgb.map((v) => Math.max(0.035, v * amp)) : [0.035, 0.035, 0.04];
      if (instant) F.set(rgb); else F.to(rgb, on ? 620 : 380);
      T.set(on ? k : null);
      beam.setAttribute('opacity', on ? 1 : 0);
      beamPath.style.fill = `url(#${beamId})`;
      svg.querySelector('#' + beamId).querySelectorAll('stop').forEach((s) => s.setAttribute('stop-color', LIGHTS[k].col));
      drawRays();
    }
    return {
      svg, ov, HIT,
      light: setLight,
      rays(v) { rays = v; drawRays(); },
      get state() { return { light, on }; },
    };
  }

  return { LIGHTS, OBJS, RAY, SWATCH, CHI, seen, defs, litFilter, apple, shirt, torch, arrow, absorb, lab };
})();
