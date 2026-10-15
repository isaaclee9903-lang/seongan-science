/* ===== 물체 그림 (SVG 2D 일러스트) =====
   OPA.defs(svg)  그림용 그라디언트
   OPA.ray(g, p0, p1, 옵션)   빛 화살표 (색, 굵기, 점선, 화살촉 위치)
   OPA.lamp / pendant / sun / ball / book / cube / tube / reflector / plant / camera
   빛은 왼쪽 위에서 비친다고 보고 밝은 면·그림자를 칠해요. */
window.OPA = (() => {
  const { el } = OP;
  const LIGHT = '#e89a12';
  function defs(svg) {
    const d = svg.querySelector('defs') || el('defs', {}, svg);
    if (d.querySelector('#paBall')) return;
    d.insertAdjacentHTML('beforeend', `
      <radialGradient id="paBall" cx=".36" cy=".32" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#eceff2"/><stop offset=".85" stop-color="#b9c0c8"/><stop offset="1" stop-color="#8d959f"/></radialGradient>
      <radialGradient id="paBallDark" cx=".36" cy=".32" r=".75"><stop offset="0" stop-color="#3a3f46"/><stop offset="1" stop-color="#0f1114"/></radialGradient>
      <radialGradient id="paSun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe8"/><stop offset=".55" stop-color="#ffe9a3"/><stop offset="1" stop-color="#ffc94d"/></radialGradient>
      <radialGradient id="paSunGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2c2" stop-opacity=".9"/><stop offset=".4" stop-color="#ffe08a" stop-opacity=".35"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient>
      <radialGradient id="paBulb" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffdf2"/><stop offset=".35" stop-color="#fff1bf" stop-opacity=".95"/><stop offset=".7" stop-color="#ffd977" stop-opacity=".35"/><stop offset="1" stop-color="#ffd977" stop-opacity="0"/></radialGradient>
      <linearGradient id="paShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6f1e6"/><stop offset=".6" stop-color="#ddd3bf"/><stop offset="1" stop-color="#b9ae98"/></linearGradient>
      <linearGradient id="paMetalV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8b939d"/><stop offset=".3" stop-color="#e6eaee"/><stop offset=".6" stop-color="#9aa2ac"/><stop offset="1" stop-color="#5d646d"/></linearGradient>
      <linearGradient id="paTube" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2d33"/><stop offset=".22" stop-color="#4b5059"/><stop offset=".38" stop-color="#2b2e34"/><stop offset=".8" stop-color="#16181c"/><stop offset="1" stop-color="#22252a"/></linearGradient>
      <linearGradient id="paWoodTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e7c79a"/><stop offset="1" stop-color="#cfa66f"/></linearGradient>
      <linearGradient id="paWoodFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b98a52"/><stop offset="1" stop-color="#94673a"/></linearGradient>
      <linearGradient id="paWoodSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a5f34"/><stop offset="1" stop-color="#6e4925"/></linearGradient>
      <linearGradient id="paGlowTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1ffe9"/><stop offset="1" stop-color="#c3f3b0"/></linearGradient>
      <linearGradient id="paGlowFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b4ef9c"/><stop offset="1" stop-color="#8fdc76"/></linearGradient>
      <linearGradient id="paGlowSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#86d16c"/><stop offset="1" stop-color="#6dbb55"/></linearGradient>
      <radialGradient id="paGreenGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#c9ffb4" stop-opacity=".85"/><stop offset=".45" stop-color="#9df07f" stop-opacity=".3"/><stop offset="1" stop-color="#9df07f" stop-opacity="0"/></radialGradient>
      <linearGradient id="paPage" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf8"/><stop offset="1" stop-color="#ece6da"/></linearGradient>
      <linearGradient id="paPageR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f2ea"/><stop offset="1" stop-color="#ddd5c6"/></linearGradient>
      <radialGradient id="paRefl" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#e4e8ec"/><stop offset=".8" stop-color="#b7bfc8"/><stop offset="1" stop-color="#8f98a2"/></radialGradient>
      <linearGradient id="paPot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d98a5f"/><stop offset=".35" stop-color="#e9a57c"/><stop offset="1" stop-color="#a8593a"/></linearGradient>
      <linearGradient id="paLeaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fbf73"/><stop offset="1" stop-color="#4f8a45"/></linearGradient>
      <linearGradient id="paCam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a5059"/><stop offset=".3" stop-color="#2d3138"/><stop offset="1" stop-color="#15171b"/></linearGradient>`);
  }

  function ray(g, p0, p1, o = {}) {
    const col = o.color || LIGHT, w = o.w || 3.2;
    const gg = el('g', { 'pointer-events': 'none', opacity: o.op == null ? 1 : o.op }, g);
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const hp = o.at == null ? 1 : o.at, hx = p0[0] + dx * hp, hy = p0[1] + dy * hp, hs = o.hs || 7 + w * 1.6;
    const end = hp === 1 ? [p1[0] - ux * hs * 0.8, p1[1] - uy * hs * 0.8] : p1;
    if (o.glow) el('line', { x1: p0[0], y1: p0[1], x2: end[0], y2: end[1], stroke: col, 'stroke-width': w * 3.4, 'stroke-opacity': 0.18, 'stroke-linecap': 'round' }, gg);
    el('line', { x1: p0[0], y1: p0[1], x2: end[0], y2: end[1], stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-dasharray': o.dash || '' }, gg);
    if (o.head !== false) el('path', { d: `M${hx} ${hy}L${hx - ux * hs - uy * hs * 0.55} ${hy - uy * hs + ux * hs * 0.55}L${hx - ux * hs + uy * hs * 0.55} ${hy - uy * hs - ux * hs * 0.55}Z`, fill: col }, gg);
    return gg;
  }

  function sun(g, x, y, r) {
    const s = el('g', { 'pointer-events': 'none' }, g);
    el('circle', { cx: x, cy: y, r: r * 3, fill: 'url(#paSunGlow)' }, s);
    el('circle', { cx: x, cy: y, r, fill: 'url(#paSun)' }, s);
    return s;
  }
  function lamp(g, x, y, s = 1, on = true) {           // 갓 씌운 탁상 전등 (x, y: 갓 가운데)
    const L = el('g', { transform: `translate(${x} ${y}) scale(${s})`, 'pointer-events': 'none' }, g);
    const glow = el('circle', { cx: 0, cy: 6, r: 96, fill: 'url(#paBulb)' }, L);
    el('ellipse', { cx: 4, cy: 118, rx: 46, ry: 9, fill: 'rgba(0,0,0,.16)' }, L);
    el('path', { d: 'M-34 112C-34 102 34 102 34 112L34 116C34 124 -34 124 -34 116Z', fill: '#565d67' }, L);
    el('rect', { x: -5, y: 30, width: 10, height: 80, fill: 'url(#paMetalV)' }, L);
    const lit = el('path', { d: 'M-28 -34L28 -34L46 30L-46 30Z', fill: on ? '#fff3d2' : 'url(#paShade)', stroke: '#c8b994', 'stroke-width': 1.4 }, L);
    const inner = el('path', { d: 'M-28 -34L28 -34L46 30L-46 30Z', fill: 'url(#paShade)', opacity: on ? 0.35 : 1 }, L);
    el('ellipse', { cx: 0, cy: -34, rx: 28, ry: 5, fill: '#e4d8bd' }, L);
    const b = el('ellipse', { cx: 0, cy: 30, rx: 46, ry: 8, fill: on ? '#fffbe6' : '#cfc7b4' }, L);
    return { g: L, on(v) { glow.style.display = v ? '' : 'none'; lit.setAttribute('fill', v ? '#fff3d2' : 'url(#paShade)'); inner.setAttribute('opacity', v ? 0.35 : 1); b.setAttribute('fill', v ? '#fffbe6' : '#cfc7b4'); } };
  }
  function pendant(g, x, y, s = 1, on = true) {        // 천장 전등 (x, y: 전구)
    const L = el('g', { transform: `translate(${x} ${y}) scale(${s})`, 'pointer-events': 'none' }, g);
    const glow = el('circle', { cx: 0, cy: 8, r: 90, fill: 'url(#paBulb)' }, L);
    el('line', { x1: 0, y1: -200, x2: 0, y2: -26, stroke: '#4a4f57', 'stroke-width': 2.4 }, L);
    el('path', { d: 'M-44 4C-44 -24 -22 -30 0 -30C22 -30 44 -24 44 4Z', fill: 'url(#paShade)', stroke: '#a59a83', 'stroke-width': 1.2 }, L);
    el('ellipse', { cx: 0, cy: 4, rx: 44, ry: 6, fill: '#c9bea7' }, L);
    const b = el('ellipse', { cx: 0, cy: 10, rx: 13, ry: 10, fill: on ? '#fffbe6' : '#d9d6cc' }, L);
    return { g: L, on(v) { glow.style.display = v ? '' : 'none'; b.setAttribute('fill', v ? '#fffbe6' : '#d9d6cc'); } };
  }
  function ball(g, x, y, r, dark) {                     // 축구공
    const B = el('g', { 'pointer-events': 'none' }, g);
    el('ellipse', { cx: x + r * 0.15, cy: y + r * 0.92, rx: r * 0.95, ry: r * 0.2, fill: 'rgba(0,0,0,.22)' }, B);
    const id = 'bc' + Math.random().toString(36).slice(2, 7);
    el('clipPath', { id }, B).innerHTML = `<circle cx="${x}" cy="${y}" r="${r}"/>`;
    el('circle', { cx: x, cy: y, r, fill: dark ? 'url(#paBallDark)' : 'url(#paBall)' }, B);
    const P = el('g', { 'clip-path': `url(#${id})`, fill: dark ? '#050607' : '#22262c' }, B);
    const pent = (cx, cy, rr, rot) => { let d = ''; for (let k = 0; k < 5; k++) { const a = rot + k * 72 * Math.PI / 180; d += (k ? 'L' : 'M') + (cx + rr * Math.sin(a)).toFixed(1) + ' ' + (cy - rr * Math.cos(a)).toFixed(1); } el('path', { d: d + 'Z' }, P); };
    pent(x + r * 0.05, y + r * 0.02, r * 0.3, 0);
    for (let k = 0; k < 5; k++) { const a = k * 72 * Math.PI / 180 + Math.PI / 5; pent(x + Math.sin(a) * r * 0.86, y - Math.cos(a) * r * 0.86, r * 0.26, a); }
    el('path', { d: `M${x - r * 0.5} ${y - r * 0.62}A${r} ${r} 0 0 1 ${x + r * 0.25} ${y - r * 0.9}`, stroke: 'rgba(255,255,255,.65)', 'stroke-width': r * 0.08, fill: 'none', 'stroke-linecap': 'round' }, B);
    el('circle', { cx: x, cy: y, r, fill: 'none', stroke: 'rgba(0,0,0,.25)', 'stroke-width': 1 }, B);
    return B;
  }
  function book(g, x, y, w) {                           // 펼친 책 (x, y: 책등 아래)
    const s = w / 200, B = el('g', { transform: `translate(${x} ${y}) scale(${s})`, 'pointer-events': 'none' }, g);
    el('ellipse', { cx: 6, cy: 8, rx: 108, ry: 14, fill: 'rgba(0,0,0,.18)' }, B);
    el('path', { d: 'M-104 -4L0 4L104 -4L96 -46L0 -38L-96 -46Z', fill: '#2f5f8f' }, B);
    el('path', { d: 'M-98 -10C-60 -22 -24 -16 0 -2L0 -44C-24 -58 -60 -62 -92 -52Z', fill: 'url(#paPage)', stroke: '#cfc6b4', 'stroke-width': 1 }, B);
    el('path', { d: 'M98 -10C60 -22 24 -16 0 -2L0 -44C24 -58 60 -62 92 -52Z', fill: 'url(#paPageR)', stroke: '#cfc6b4', 'stroke-width': 1 }, B);
    const ln = el('g', { stroke: '#b9b1a1', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, B);
    for (let k = 0; k < 4; k++) { const yy = -44 + k * 8; el('path', { d: `M${-84 + k * 2} ${yy - 2}C-60 ${yy - 8} -30 ${yy - 4} -12 ${yy + 4}` }, ln); el('path', { d: `M${84 - k * 2} ${yy - 2}C60 ${yy - 8} 30 ${yy - 4} 12 ${yy + 4}` }, ln); }
    return B;
  }
  function cube(g, x, y, s, glow) {                     // 작은 물체 (x, y: 앞면 아래 가운데)
    const C = el('g', { 'pointer-events': 'none' }, g), h = s, d = s * 0.42;
    if (glow) el('circle', { cx: x + d * 0.4, cy: y - h * 0.6, r: s * 1.9, fill: 'url(#paGreenGlow)', class: 'glowpulse' }, C);
    el('ellipse', { cx: x + d * 0.5, cy: y + 1, rx: s * 0.75, ry: s * 0.14, fill: 'rgba(0,0,0,.35)' }, C);
    el('path', { d: `M${x - h / 2} ${y - h}L${x - h / 2 + d} ${y - h - d * 0.7}L${x + h / 2 + d} ${y - h - d * 0.7}L${x + h / 2} ${y - h}Z`, fill: glow ? 'url(#paGlowTop)' : 'url(#paWoodTop)' }, C);
    el('rect', { x: x - h / 2, y: y - h, width: h, height: h, fill: glow ? 'url(#paGlowFront)' : 'url(#paWoodFront)' }, C);
    el('path', { d: `M${x + h / 2} ${y - h}L${x + h / 2 + d} ${y - h - d * 0.7}L${x + h / 2 + d} ${y - d * 0.7}L${x + h / 2} ${y}Z`, fill: glow ? 'url(#paGlowSide)' : 'url(#paWoodSide)' }, C);
    if (!glow) el('path', { d: `M${x - h / 2 + 3} ${y - h * 0.62}L${x + h / 2 - 3} ${y - h * 0.58}M${x - h / 2 + 3} ${y - h * 0.3}L${x + h / 2 - 4} ${y - h * 0.33}`, stroke: 'rgba(110,70,30,.35)', 'stroke-width': 1 }, C);
    return C;
  }
  function tube(g, x, yb, r, h) {                       // 검은 종이 통 (x: 가운데, yb: 아래 끝)
    const T = el('g', { 'pointer-events': 'none' }, g), ry = r * 0.24, yt = yb - h;
    el('path', { d: `M${x - r} ${yt}L${x - r} ${yb}A${r} ${ry} 0 0 0 ${x + r} ${yb}L${x + r} ${yt}Z`, fill: 'url(#paTube)' }, T);
    el('line', { x1: x + r * 0.55, y1: yt + ry, x2: x + r * 0.55, y2: yb + ry * 0.85, stroke: 'rgba(255,255,255,.07)', 'stroke-width': 1.4 }, T);
    el('ellipse', { cx: x, cy: yt, rx: r, ry, fill: '#3a3e45' }, T);
    el('ellipse', { cx: x, cy: yt + 1, rx: r * 0.9, ry: ry * 0.8, fill: '#08090b' }, T);
    return T;
  }
  function reflector(g, x, y, r) {                      // 반사판 (x, y: 판 가운데)
    const R = el('g', { 'pointer-events': 'none' }, g);
    el('line', { x1: x, y1: y + r * 0.6, x2: x, y2: y + r * 2.3, stroke: '#4a5059', 'stroke-width': 5 }, R);
    el('path', { d: `M${x} ${y + r * 2.1}L${x - r * 0.6} ${y + r * 2.75}M${x} ${y + r * 2.1}L${x + r * 0.6} ${y + r * 2.75}M${x} ${y + r * 2.1}L${x + r * 0.1} ${y + r * 2.8}`, stroke: '#4a5059', 'stroke-width': 4, 'stroke-linecap': 'round' }, R);
    el('ellipse', { cx: x, cy: y, rx: r * 0.55, ry: r, fill: '#2c3036' }, R);
    el('ellipse', { cx: x - 3, cy: y, rx: r * 0.5, ry: r * 0.94, fill: 'url(#paRefl)' }, R);
    el('path', { d: `M${x - r * 0.2} ${y - r * 0.7}C${x - r * 0.42} ${y - r * 0.2} ${x - r * 0.38} ${y + r * 0.3} ${x - r * 0.15} ${y + r * 0.7}`, stroke: 'rgba(255,255,255,.7)', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, R);
    return R;
  }
  function plant(g, x, y, s) {                          // 화분 (x, y: 화분 아래)
    const P = el('g', { transform: `translate(${x} ${y}) scale(${s})`, 'pointer-events': 'none' }, g);
    el('ellipse', { cx: 4, cy: 2, rx: 40, ry: 7, fill: 'rgba(0,0,0,.2)' }, P);
    const leaf = (x1, y1, x2, y2, w) => { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L * w, ny = dx / L * w; el('path', { d: `M${x1} ${y1}Q${mx + nx} ${my + ny} ${x2} ${y2}Q${mx - nx} ${my - ny} ${x1} ${y1}Z`, fill: 'url(#paLeaf)' }, P); el('path', { d: `M${x1} ${y1}L${x2} ${y2}`, stroke: 'rgba(40,80,40,.4)', 'stroke-width': 1 }, P); };
    const stems = [[0, -150, -6], [-26, -120, -30], [26, -126, 32], [-8, -96, -40], [12, -104, 42]];
    stems.forEach(([sx, sy]) => el('path', { d: `M0 -48Q${sx * 0.3} ${(sy - 48) / 2} ${sx} ${sy}`, stroke: '#5c8a4a', 'stroke-width': 3, fill: 'none' }, P));
    stems.forEach(([sx, sy, a]) => { leaf(sx, sy, sx + a * 0.9, sy - 26, 9); leaf(sx * 0.6, (sy - 48) * 0.6, sx * 0.6 - a * 0.7, (sy - 48) * 0.6 - 10, 7); });
    el('path', { d: 'M-30 -52L30 -52L22 0L-22 0Z', fill: 'url(#paPot)' }, P);
    el('rect', { x: -34, y: -60, width: 68, height: 11, rx: 3, fill: '#c97650' }, P);
    return P;
  }
  function camera(g, x, y, s) {                         // 촬영기 (x, y: 렌즈 끝, 오른쪽을 봄)
    const C = el('g', { transform: `translate(${x} ${y}) scale(${s})`, 'pointer-events': 'none' }, g);
    el('path', { d: 'M-70 60L-70 112M-70 60L-96 116M-70 60L-44 116', stroke: '#4a5059', 'stroke-width': 4, 'stroke-linecap': 'round' }, C);
    el('rect', { x: -112, y: -26, width: 78, height: 56, rx: 8, fill: 'url(#paCam)' }, C);
    el('rect', { x: -100, y: -40, width: 34, height: 16, rx: 4, fill: '#2a2e34' }, C);
    el('rect', { x: -36, y: -18, width: 36, height: 40, rx: 4, fill: 'url(#paMetalV)', transform: 'rotate(90 -18 2)' }, C);
    el('rect', { x: -34, y: -16, width: 34, height: 36, rx: 5, fill: '#1c1f24' }, C);
    el('ellipse', { cx: 0, cy: 2, rx: 5, ry: 18, fill: '#3f5b78' }, C);
    el('rect', { x: -78, y: 30, width: 16, height: 30, fill: '#3a3f46' }, C);
    return C;
  }
  return { defs, ray, sun, lamp, pendant, ball, book, cube, tube, reflector, plant, camera, LIGHT };
})();
