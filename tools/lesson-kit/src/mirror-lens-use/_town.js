/* ===== 거울·렌즈 마을 그림 (SVG 2D, 위에서 비스듬히 내려다본 마을) =====
   TOWN.draw(svg) → 조사할 곳의 그림 좌표 { id: [x, y] } (viewBox 1200×900)
   교과서 108~109쪽 마을 그림처럼 미용실·안경점·편의점·학교·병원·버스·도로 거울·우주 망원경이 있어요.
   건물 이름은 그림 위 HTML 이름표로 붙여요. */
window.TOWN = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, at = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (parent) parent.appendChild(e); return e; };
  const U = 34, OX = 600, OY = 214, C = 0.866;
  const iso = (x, y, z = 0) => [OX + (x - y) * U * C, OY + (x + y) * U * 0.5 - z * U];
  const pts = (a) => a.map((p) => iso(...p).map((v) => v.toFixed(1)).join(',')).join(' ');
  const poly = (g, a, at) => el('polygon', Object.assign({ points: pts(a) }, at), g);
  // 면 위에 그리기: y가 일정한 왼쪽 앞면(u: +x 방향), x가 일정한 오른쪽 앞면(u: -y 방향), v: 위쪽
  const fy = (g, x0, y, z0) => { const [X, Y] = iso(x0, y, z0); return el('g', { transform: `matrix(${C * U} ${0.5 * U} 0 ${-U} ${X.toFixed(1)} ${Y.toFixed(1)})` }, g); };
  const fx = (g, x, y1, z0) => { const [X, Y] = iso(x, y1, z0); return el('g', { transform: `matrix(${C * U} ${-0.5 * U} 0 ${-U} ${X.toFixed(1)} ${Y.toFixed(1)})` }, g); };
  const rect = (g, x, y, w, h, at) => el('rect', Object.assign({ x, y, width: w, height: h }, at), g);   // 면 좌표: y는 아래에서 위로

  function defs(svg) {
    const d = el('defs', {}, svg);
    d.innerHTML = `
      <linearGradient id="twSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcdcf2"/><stop offset="1" stop-color="#eaf4fa"/></linearGradient>
      <linearGradient id="twGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c6dca8"/><stop offset="1" stop-color="#a9c98a"/></linearGradient>
      <linearGradient id="twGlass" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#5f8fb0"/><stop offset=".6" stop-color="#9cc3dc"/><stop offset="1" stop-color="#d5e8f3"/></linearGradient>
      <linearGradient id="twGlassD" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#3f6a8a"/><stop offset="1" stop-color="#86aecb"/></linearGradient>
      <linearGradient id="twShine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".45" stop-color="#fff" stop-opacity=".35"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <radialGradient id="twLeaf" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#8fc27a"/><stop offset=".6" stop-color="#5f9a4f"/><stop offset="1" stop-color="#3f7637"/></radialGradient>
      <radialGradient id="twLeaf2" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#a3cf86"/><stop offset=".6" stop-color="#6eaa5a"/><stop offset="1" stop-color="#477f3d"/></radialGradient>
      <radialGradient id="twBeam" cx="0" cy=".5" r="1"><stop offset="0" stop-color="#fff6c8" stop-opacity=".95"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient>
      <radialGradient id="twLamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe6"/><stop offset=".4" stop-color="#fff2b0" stop-opacity=".9"/><stop offset="1" stop-color="#ffe680" stop-opacity="0"/></radialGradient>
      <linearGradient id="twGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".45" stop-color="#e9b949"/><stop offset="1" stop-color="#a8761c"/></linearGradient>
      <linearGradient id="twMirror" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f8fb"/><stop offset=".5" stop-color="#b9c8d4"/><stop offset="1" stop-color="#e4ecf2"/></linearGradient>
      <filter id="twBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>
      <filter id="twBlur2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2"/></filter>`;
  }

  /* 상자 건물: 위·왼쪽 앞면·오른쪽 앞면, 바닥 그림자 */
  function shade(hex, k) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = (c) => Math.max(0, Math.min(255, Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k)))); return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1); }
  function shadow(g, x0, x1, y0, y1, h) {
    const s = h * 0.55;
    poly(g, [[x1, y0, 0], [x1 + s, y0 + s * .15, 0], [x1 + s, y1 + s * .15, 0], [x0 + s * .4, y1 + s * .15, 0], [x0, y1, 0]], { fill: '#2b3a2a', opacity: .16, filter: 'url(#twBlur2)' });
  }
  function block(g, x0, x1, y0, y1, h, col, o = {}) {
    const z = o.z0 || 0;
    if (o.shadow !== false) shadow(g, x0, x1, y0, y1, h);
    const L = el('linearGradient', { id: 'tw' + (++block.n), x1: 0, y1: 0, x2: 0, y2: 1 }, g);
    el('stop', { offset: 0, 'stop-color': shade(col, .06) }, L); el('stop', { offset: 1, 'stop-color': shade(col, -.06) }, L);
    poly(g, [[x0, y1, z], [x1, y1, z], [x1, y1, h], [x0, y1, h]], { fill: `url(#${L.id})` });
    const R = el('linearGradient', { id: 'tw' + (++block.n), x1: 0, y1: 0, x2: 0, y2: 1 }, g);
    el('stop', { offset: 0, 'stop-color': shade(col, -.16) }, R); el('stop', { offset: 1, 'stop-color': shade(col, -.3) }, R);
    poly(g, [[x1, y1, z], [x1, y0, z], [x1, y0, h], [x1, y1, h]], { fill: `url(#${R.id})` });
    poly(g, [[x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]], { fill: o.top || shade(col, .22) });
    // 모서리 밝은 선
    const [a, b] = [iso(x1, y1, z), iso(x1, y1, h)];
    el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#fff', 'stroke-opacity': .35, 'stroke-width': 1.2 }, g);
  }
  block.n = 0;
  /* 옥상 난간 */
  function parapet(g, x0, x1, y0, y1, h, col) {
    const t = .22, p = .35;
    const o = { shadow: false, z0: h };
    block(g, x0, x1, y0, y0 + t, h + p, col, o);
    block(g, x0, x0 + t, y0, y1, h + p, col, o);
    poly(g, [[x0 + t, y0 + t, h + .01], [x1, y0 + t, h + .01], [x1, y1, h + .01], [x0 + t, y1, h + .01]], { fill: shade(col, -.08) });
    block(g, x0, x1, y1 - t, y1, h + p, col, o);
    block(g, x1 - t, x1, y0, y1, h + p, col, o);
  }

  /* 나무: 줄기 + 잎 덩어리 여러 개 */
  function tree(g, x, y, s = 1, alt) {
    const [X, Y] = iso(x, y, 0);
    el('ellipse', { cx: X + 14 * s, cy: Y + 4, rx: 30 * s, ry: 11 * s, fill: '#2b3a2a', opacity: .18, filter: 'url(#twBlur2)' }, g);
    el('path', { d: `M${X - 3 * s} ${Y}L${X - 2 * s} ${Y - 34 * s}L${X - 9 * s} ${Y - 46 * s}M${X - 2 * s} ${Y - 34 * s}L${X + 6 * s} ${Y - 50 * s}M${X + 1 * s} ${Y - 30 * s}L${X + 2 * s} ${Y - 56 * s}`, stroke: '#6b4f33', 'stroke-width': 4.5 * s, 'stroke-linecap': 'round', fill: 'none' }, g);
    const B = [[-12, -54, 17], [10, -58, 16], [0, -70, 19], [-6, -42, 14], [12, -44, 13], [-14, -66, 13], [6, -78, 13]];
    B.forEach(([dx, dy, r], i) => el('circle', { cx: X + dx * s, cy: Y + dy * s, r: r * s, fill: `url(#${(i + (alt ? 1 : 0)) % 2 ? 'twLeaf2' : 'twLeaf'})` }, g));
    B.slice(0, 4).forEach(([dx, dy, r]) => el('circle', { cx: X + (dx - r * .3) * s, cy: Y + (dy - r * .35) * s, r: r * .35 * s, fill: '#b9dd9b', opacity: .45 }, g));
  }
  function bush(g, x, y, n = 3) {
    const [X, Y] = iso(x, y, 0);
    for (let i = 0; i < n; i++) el('circle', { cx: X + (i - (n - 1) / 2) * 13, cy: Y - 8 - (i % 2) * 4, r: 11, fill: `url(#${i % 2 ? 'twLeaf2' : 'twLeaf'})` }, g);
  }

  function draw(svg) {
    defs(svg);
    const g = el('g', {}, svg), A = {};
    // 하늘·먼 산·땅
    el('rect', { x: 0, y: 0, width: 1200, height: 900, fill: 'url(#twSky)' }, g);
    el('path', { d: 'M0 250C120 170 220 205 330 165S520 120 640 175S860 130 980 170S1130 150 1200 190V320H0Z', fill: '#a8c3b5' }, g);
    el('path', { d: 'M0 285C150 225 260 260 400 228S640 220 760 250S1020 215 1200 248V340H0Z', fill: '#93b89c' }, g);
    el('rect', { x: 0, y: 270, width: 1200, height: 630, fill: 'url(#twGrass)' }, g);
    poly(g, [[-3, -3, 0], [23, -3, 0], [23, 23, 0], [-3, 23, 0]], { fill: '#bed59f' });
    // 구름
    [[960, 70, 1], [300, 58, .8], [1110, 120, .7]].forEach(([x, y, s]) => { const c = el('g', { opacity: .9 }, g); [[0, 0, 26], [26, -8, 30], [56, 0, 24], [28, 8, 24]].forEach(([dx, dy, r]) => el('circle', { cx: x + dx * s, cy: y + dy * s, r: r * s, fill: '#fff' }, c)); });

    // 도로 (가로: y 9~12, 세로: x 9~12)
    const RD = '#8b9299', SW = '#e4ddce';
    poly(g, [[-8, 8.2, 0], [30, 8.2, 0], [30, 12.8, 0], [-8, 12.8, 0]], { fill: SW });
    poly(g, [[8.2, -8, 0], [12.8, -8, 0], [12.8, 30, 0], [8.2, 30, 0]], { fill: SW });
    poly(g, [[-8, 9, 0], [30, 9, 0], [30, 12, 0], [-8, 12, 0]], { fill: RD });
    poly(g, [[9, -8, 0], [12, -8, 0], [12, 30, 0], [9, 30, 0]], { fill: RD });
    // 보도 블록 줄
    for (let k = -8; k < 30; k += 1.2) {
      if (k > 7.6 && k < 12.8) continue;
      poly(g, [[k, 8.2, 0], [k + .05, 8.2, 0], [k + .05, 9, 0], [k, 9, 0]], { fill: '#cfc6b3' }); poly(g, [[k, 12, 0], [k + .05, 12, 0], [k + .05, 12.8, 0], [k, 12.8, 0]], { fill: '#cfc6b3' });
      poly(g, [[8.2, k, 0], [9, k, 0], [9, k + .05, 0], [8.2, k + .05, 0]], { fill: '#cfc6b3' }); poly(g, [[12, k, 0], [12.8, k, 0], [12.8, k + .05, 0], [12, k + .05, 0]], { fill: '#cfc6b3' });
    }
    // 가운데 선
    for (let k = -8; k < 30; k += 1.4) {
      if (k > 7.2 && k < 12.6) continue;
      poly(g, [[k, 10.45, 0], [k + .7, 10.45, 0], [k + .7, 10.55, 0], [k, 10.55, 0]], { fill: '#f3d36a' });
      poly(g, [[10.45, k, 0], [10.55, k, 0], [10.55, k + .7, 0], [10.45, k + .7, 0]], { fill: '#f3d36a' });
    }
    // 건널목
    for (let k = 9.2; k < 11.9; k += .5) {
      poly(g, [[7.3, k, 0], [8.4, k, 0], [8.4, k + .26, 0], [7.3, k + .26, 0]], { fill: '#f5f5f2' });
      poly(g, [[12.6, k, 0], [13.7, k, 0], [13.7, k + .26, 0], [12.6, k + .26, 0]], { fill: '#f5f5f2' });
      poly(g, [[k, 7.3, 0], [k + .26, 7.3, 0], [k + .26, 8.4, 0], [k, 8.4, 0]], { fill: '#f5f5f2' });
      poly(g, [[k, 12.6, 0], [k + .26, 12.6, 0], [k + .26, 13.7, 0], [k, 13.7, 0]], { fill: '#f5f5f2' });
    }

    // ---------- 우주 망원경 (하늘) ----------
    const sp = el('g', { transform: 'translate(140 112) scale(1.3)' }, g);
    for (let k = 4; k >= 0; k--) el('path', { d: `M${-58 + k * 4} ${20 - k * 1.5}L0 ${36 - k * 2.4}L${58 - k * 4} ${20 - k * 1.5}L0 ${6 + k}Z`, fill: k % 2 ? '#e6e0ee' : '#cfc4de', stroke: '#a597bf', 'stroke-width': .5 }, sp);
    el('path', { d: 'M0 36V46M-7 42H7', stroke: '#6b6f78', 'stroke-width': 1.6 }, sp);
    const hx = (cx, cy, r) => { let d = ''; for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a) * .62).toFixed(1); } return d + 'Z'; };
    const HX = [[0, 0], [1, 0], [-1, 0], [.5, .866], [-.5, .866], [.5, -.866], [-.5, -.866], [1.5, .866], [-1.5, .866], [1.5, -.866], [-1.5, -.866], [0, 1.732], [0, -1.732], [1, 1.732], [-1, 1.732], [1, -1.732], [-1, -1.732], [2, 0]];
    HX.slice(1).forEach(([a, b]) => el('path', { d: hx(a * 9.6, -14 + b * 9.6 * .62, 5.4), fill: 'url(#twGold)', stroke: '#8c6218', 'stroke-width': .6 }, sp));
    el('path', { d: 'M-4 -40L0 -14L4 -40', stroke: '#6b6f78', 'stroke-width': 1.5, fill: 'none' }, sp);
    el('circle', { cx: 0, cy: -41, r: 3, fill: '#d6dbe2', stroke: '#6b6f78' }, sp);
    A.telescope = [268, 120];

    // ---------- 나무 (뒤쪽) ----------
    const T = el('g', {}, g);
    [[0.5, 0.6, 1], [3, -.2, .9], [6.6, -.2, 1.05], [-.6, 6.5, .9], [12.2, 0.2, .9], [20.4, 1.4, 1], [20.6, 5.6, .9]].forEach(([x, y, s], i) => tree(T, x, y, s, i % 2));

    // ---------- 미용실 (x 0.8~4.4, y 2.6~6.4) ----------
    const sal = el('g', {}, g);
    block(sal, 0.8, 4.4, 2.6, 6.4, 2.5, '#f2e2cc');
    parapet(sal, 0.8, 4.4, 2.6, 6.4, 2.5, '#e4cfb3');
    let f = fy(sal, 0.8, 6.4, 0);
    rect(f, .25, .1, 1.9, 1.75, { fill: 'url(#twGlass)', stroke: '#8a6f55', 'stroke-width': .08 });
    rect(f, .5, .55, .55, .9, { fill: '#e8f1f7', stroke: '#b9a58c', 'stroke-width': .05 });   // 안쪽 거울
    rect(f, 1.3, .55, .55, .9, { fill: '#e8f1f7', stroke: '#b9a58c', 'stroke-width': .05 });
    rect(f, .55, .25, .45, .35, { fill: '#2e3640' }); rect(f, 1.35, .25, .45, .35, { fill: '#2e3640' });   // 의자
    rect(f, .25, .1, 1.9, 1.75, { fill: 'url(#twShine)' });
    rect(f, 2.55, 0, .75, 1.6, { fill: '#9c7552', stroke: '#6f5038', 'stroke-width': .06 });
    rect(f, 2.62, .08, .6, .9, { fill: 'url(#twGlassD)' });
    rect(f, .2, 2.0, 3.2, .38, { fill: '#7a5a8c' });   // 간판
    f = fx(sal, 4.4, 6.4, 0);
    rect(f, .5, .7, 1.1, 1.0, { fill: 'url(#twGlassD)', stroke: '#8a6f55', 'stroke-width': .06 });
    rect(f, 2.2, .7, 1.1, 1.0, { fill: 'url(#twGlassD)', stroke: '#8a6f55', 'stroke-width': .06 });
    // 이발소 기둥
    { const [X, Y] = iso(1.0, 6.9, 0); const pg = el('g', {}, sal);
      el('rect', { x: X - 6, y: Y - 64, width: 12, height: 64, rx: 6, fill: '#fff', stroke: '#c9ccd2' }, pg);
      for (let k = 0; k < 5; k++) el('path', { d: `M${X - 6} ${Y - 12 - k * 12}L${X + 6} ${Y - 20 - k * 12}`, stroke: k % 2 ? '#2f5fa5' : '#d2443a', 'stroke-width': 4 }, pg);
      el('circle', { cx: X, cy: Y - 68, r: 7, fill: '#e9edf1', stroke: '#b6bcc5' }, pg); }
    A.salon = iso(2.2, 6.4, 1.4);

    // ---------- 안경점 (x 5.2~8.4, y 2.4~6.2) ----------
    const opt = el('g', {}, g);
    block(opt, 5.2, 8.4, 2.4, 6.2, 2.7, '#d9a079');
    parapet(opt, 5.2, 8.4, 2.4, 6.2, 2.7, '#c98c66');
    f = fy(opt, 5.2, 6.2, 0);
    rect(f, .25, .12, 1.7, 1.7, { fill: 'url(#twGlass)', stroke: '#6e4c34', 'stroke-width': .08 });
    rect(f, .4, .35, 1.4, .1, { fill: '#8a6c55' });
    for (let k = 0; k < 4; k++) { el('circle', { cx: .55 + k * .34, cy: .6, r: .1, fill: 'none', stroke: '#2b2622', 'stroke-width': .04 }, f); }
    el('circle', { cx: 1.1, cy: 1.25, r: .28, fill: '#fff', opacity: .7 }, f);   // 시력표
    rect(f, 2.3, 0, .7, 1.6, { fill: '#6c4a33' }); rect(f, 2.37, .08, .56, .95, { fill: 'url(#twGlassD)' });
    rect(f, .2, 2.05, 2.8, .4, { fill: '#3b5f86' });
    f = fx(opt, 8.4, 6.2, 0);
    rect(f, .5, .7, 1.0, 1.1, { fill: 'url(#twGlassD)', stroke: '#6e4c34', 'stroke-width': .06 });
    rect(f, 2.2, .7, 1.0, 1.1, { fill: 'url(#twGlassD)', stroke: '#6e4c34', 'stroke-width': .06 });
    // 지붕 위 안경 간판
    { const [X, Y] = iso(6.8, 4.3, 3.1); const og = el('g', {}, opt);
      el('rect', { x: X - 3, y: Y - 4, width: 6, height: 18, fill: '#59616b' }, og);
      el('ellipse', { cx: X - 22, cy: Y - 18, rx: 17, ry: 14, fill: 'rgba(210,232,246,.75)', stroke: '#2b2622', 'stroke-width': 4 }, og);
      el('ellipse', { cx: X + 22, cy: Y - 18, rx: 17, ry: 14, fill: 'rgba(210,232,246,.75)', stroke: '#2b2622', 'stroke-width': 4 }, og);
      el('path', { d: `M${X - 6} ${Y - 22}Q${X} ${Y - 28} ${X + 6} ${Y - 22}`, stroke: '#2b2622', 'stroke-width': 4, fill: 'none' }, og); }
    A.glassesPlus = iso(5.9, 6.2, 1.1); A.glassesMinus = iso(8.4, 3.6, 1.3);

    // ---------- 도로 둥근 거울 (모퉁이 x 8.4, y 7.9) ----------
    { const [X, Y] = iso(12.75, 8.05, 0); const mg = el('g', {}, g);
      el('ellipse', { cx: X + 10, cy: Y + 2, rx: 12, ry: 4, fill: '#2b3a2a', opacity: .2 }, mg);
      el('rect', { x: X - 2.5, y: Y - 86, width: 5, height: 86, fill: '#e2552f' }, mg);
      el('ellipse', { cx: X + 6, cy: Y - 98, rx: 20, ry: 23, fill: '#c63d22' }, mg);
      el('ellipse', { cx: X + 8, cy: Y - 98, rx: 16, ry: 19, fill: 'url(#twMirror)' }, mg);
      el('path', { d: `M${X} ${Y - 110}Q${X + 6} ${Y - 116} ${X + 14} ${Y - 112}`, stroke: '#fff', 'stroke-width': 2.5, fill: 'none', opacity: .8 }, mg);
      A.roadMirror = [X - 96, Y - 30]; }

    // ---------- 학교 (x 13~19.6, y 0.8~6.8) ----------
    const sch = el('g', {}, g);
    block(sch, 13, 19.6, 0.8, 6.8, 4.4, '#c9785e');
    parapet(sch, 13, 19.6, 0.8, 6.8, 4.4, '#efe7dc');
    f = fy(sch, 13, 6.8, 0);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) {
      if (r === 0 && c === 2) continue;
      rect(f, .45 + c * 1.25, .55 + r * 1.95, .9, 1.15, { fill: 'url(#twGlass)', stroke: '#f2ece2', 'stroke-width': .1 });
      rect(f, .45 + c * 1.25, 1.12 + r * 1.95, .9, .05, { fill: '#f2ece2' });
    }
    rect(f, 2.85, 0, 1.0, 1.75, { fill: '#5a6b7e' }); rect(f, 2.95, .1, .8, 1.5, { fill: 'url(#twGlassD)' });
    rect(f, 0, 2.05, 6.6, .12, { fill: '#efe7dc' });
    // 시계
    el('circle', { cx: 3.35, cy: 3.95, r: .38, fill: '#fbfaf6', stroke: '#6b6f78', 'stroke-width': .06 }, f);
    el('path', { d: 'M3.35 3.95L3.35 4.2M3.35 3.95L3.52 3.9', stroke: '#2b2f36', 'stroke-width': .05, fill: 'none' }, f);
    f = fx(sch, 19.6, 6.8, 0);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) rect(f, .5 + c * 1.4, .55 + r * 1.95, .95, 1.15, { fill: 'url(#twGlassD)', stroke: '#f2ece2', 'stroke-width': .1 });
    A.projector = iso(14.4, 6.8, 3.4); A.microscope = iso(19.6, 3.0, 1.3);
    // 교실 창 안 (화면과 빔)
    { const ff = fy(sch, 13, 6.8, 0); rect(ff, .55, 2.65, .7, .55, { fill: '#fff', opacity: .9 }); el('path', { d: 'M1.3 2.7L1.25 2.95L1.3 3.2', stroke: '#fff7c4', 'stroke-width': .06, fill: 'none', opacity: .7 }, ff);
      rect(ff, 5.5, 2.6, .5, .3, { fill: '#2b3440' }); rect(ff, 5.7, 2.9, .1, .3, { fill: '#2b3440' }); }

    // ---------- 버스 (가로 도로, x 1~6.4, y 10.6~11.9) ----------
    const bus = el('g', {}, g);
    // 전조등 빛
    { const [X, Y] = iso(6.5, 11.4, .55); el('path', { d: `M${X} ${Y}L${X + 150} ${Y + 50}L${X + 118} ${Y + 104}Z`, fill: 'url(#twBeam)', opacity: .55, filter: 'url(#twBlur2)' }, bus); }
    block(bus, 1.0, 6.4, 10.6, 11.9, 1.75, '#2f6fb3', { top: '#e9eef3' });
    f = fy(bus, 1.0, 11.9, 0);
    for (let k = 0; k < 6; k++) rect(f, .3 + k * .82, .85, .68, .62, { fill: 'url(#twGlassD)' });
    rect(f, 0, .55, 5.4, .1, { fill: '#ffffff', opacity: .8 });
    f = fx(bus, 6.4, 11.9, 0);
    rect(f, .1, .8, 1.1, .75, { fill: 'url(#twGlassD)' });
    rect(f, .12, .35, .26, .16, { fill: '#fff8d8' }); rect(f, .92, .35, .26, .16, { fill: '#fff8d8' });
    for (const [x, y] of [[1.9, 11.9], [5.3, 11.9]]) { const [X, Y] = iso(x, y, .32); el('ellipse', { cx: X, cy: Y, rx: 9, ry: 10, fill: '#1d2024' }, bus); el('ellipse', { cx: X, cy: Y, rx: 4, ry: 4.5, fill: '#9aa1a8' }, bus); }
    { const [X, Y] = iso(6.4, 11.75, .43); el('circle', { cx: X, cy: Y, r: 9, fill: 'url(#twLamp)' }, bus); const [X2, Y2] = iso(6.4, 10.85, .43); el('circle', { cx: X2, cy: Y2, r: 9, fill: 'url(#twLamp)' }, bus); }
    A.bus = iso(6.4, 11.3, .5);

    // ---------- 편의점 (x 1.4~7.6, y 13.6~18) ----------
    const cvs = el('g', {}, g);
    block(cvs, 1.4, 7.6, 13.6, 18, 2.6, '#f4f5f6');
    parapet(cvs, 1.4, 7.6, 13.6, 18, 2.6, '#e5e8eb');
    f = fx(cvs, 7.6, 18, 0);
    rect(f, .3, .1, 3.2, 1.6, { fill: 'url(#twGlass)', stroke: '#9aa4ad', 'stroke-width': .07 });
    for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++) rect(f, .45 + k * .33, .25 + r * .45, .25, .28, { fill: ['#e0563f', '#f2b134', '#3c86c9', '#49a66f'][(k + r) % 4], opacity: .75 });
    el('circle', { cx: 3.2, cy: 1.45, r: .2, fill: 'url(#twMirror)', stroke: '#c63d22', 'stroke-width': .05 }, f);   // 안쪽 보안 거울
    rect(f, .3, .1, 3.2, 1.6, { fill: 'url(#twShine)' });
    rect(f, 3.7, 0, .7, 1.6, { fill: '#9aa4ad' }); rect(f, 3.77, .06, .56, 1.48, { fill: 'url(#twGlassD)' });
    rect(f, .1, 2.0, 4.3, .45, { fill: '#2e6fb1' });
    rect(f, .1, 1.9, 4.3, .08, { fill: '#ffffff' });
    // 차양 (파랑·흰 줄무늬)
    { const aw = el('g', {}, cvs); for (let k = 0; k < 11; k++) { const y0 = 18 - k * .4, y1 = y0 - .4; poly(aw, [[7.6, y0, 1.85], [7.6, y1, 1.85], [8.3, y1, 1.55], [8.3, y0, 1.55]], { fill: k % 2 ? '#ffffff' : '#2e6fb1' }); } }
    f = fy(cvs, 1.4, 18, 0);
    rect(f, .5, .7, 1.5, 1.0, { fill: 'url(#twGlassD)', stroke: '#9aa4ad', 'stroke-width': .06 }); rect(f, 3.8, .7, 1.5, 1.0, { fill: 'url(#twGlassD)', stroke: '#9aa4ad', 'stroke-width': .06 });
    A.store = iso(3.6, 18, 1.5);

    // ---------- 병원 (치과) (x 13.4~18.4, y 13.6~18.2) ----------
    const hos = el('g', {}, g);
    block(hos, 13.4, 18.4, 13.6, 18.2, 3.4, '#eef1f2');
    parapet(hos, 13.4, 18.4, 13.6, 18.2, 3.4, '#dfe4e6');
    f = fy(hos, 13.4, 18.2, 0);
    rect(f, .4, .1, 1.6, 1.5, { fill: 'url(#twGlass)', stroke: '#9aa4ad', 'stroke-width': .07 });
    rect(f, 2.3, 0, 1.1, 1.6, { fill: '#9aa4ad' }); rect(f, 2.38, .06, .94, 1.48, { fill: 'url(#twGlassD)' });
    for (let c = 0; c < 3; c++) rect(f, .4 + c * 1.55, 2.0, 1.1, 1.0, { fill: 'url(#twGlassD)', stroke: '#c9d0d6', 'stroke-width': .07 });
    f = fx(hos, 18.4, 18.2, 0);
    for (let c = 0; c < 3; c++) rect(f, .4 + c * 1.45, 2.0, 1.0, 1.0, { fill: 'url(#twGlassD)', stroke: '#c9d0d6', 'stroke-width': .07 });
    // 십자 간판 (옥상)
    { const [X, Y] = iso(15.9, 15.9, 3.8); const cg = el('g', {}, hos);
      el('rect', { x: X - 22, y: Y - 44, width: 44, height: 44, rx: 5, fill: '#fbfcfc', stroke: '#c9d0d6' }, cg);
      el('path', { d: `M${X - 5} ${Y - 38}h10v11h11v10h-11v11h-10v-11h-11v-10h11z`, fill: '#3f9a5c' }, cg); }
    A.dentist = iso(14.6, 18.2, 2.5);

    // ---------- 앞쪽 나무·덤불 ----------
    const T2 = el('g', {}, g);
    [[0.2, 12.4, 1.05], [-1, 16, 1], [-0.8, 20.2, 1.1], [4.2, 21.6, 1], [8, 19.6, .95], [12.6, 21, 1], [19.4, 12.6, .9], [20.6, 17.2, 1.05], [21.6, 21, 1]].forEach(([x, y, s], i) => tree(T2, x, y, s, i % 2));
    [[2.4, 7.4], [6.2, 7.3], [14.2, 7.6], [17.6, 7.6], [3.6, 12.9], [15.2, 12.9]].forEach(([x, y]) => bush(T2, x, y));
    return A;
  }
  return { draw, iso };
})();
