/* ===== 나란한 빛 그림 (그림 Ⅲ-7, Ⅲ-8 형식) =====
   ML.rays(host, { theme: 'dark'|'light', dev, n })  → { dev(k), single(높이|null), marks(켜기), light(켜기) }
   거울 면에서는 반사 법칙, 렌즈 면에서는 굴절(유리 1.5)을 실제로 계산해 빛의 경로를 그려요. */
ML.rays = (host, o) => {
  const { el } = OP;
  ML.defs();
  const W = 1000, H = o.H || 560, CY = H / 2, dark = o.theme !== 'light';
  const sv = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': o.aria || '나란한 빛을 거울이나 렌즈에 비출 때 빛이 나아가는 모습' }, host);
  OP.defs(sv);
  sv.querySelector('defs').insertAdjacentHTML('beforeend', `
    <radialGradient id="rySpot" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6ea" stop-opacity="1"/><stop offset=".25" stop-color="#ff9a8a" stop-opacity=".75"/><stop offset="1" stop-color="#ff3b2f" stop-opacity="0"/></radialGradient>
    <linearGradient id="ryBox" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a414b"/><stop offset=".5" stop-color="#20252c"/><stop offset="1" stop-color="#121519"/></linearGradient>
    <linearGradient id="ryGlass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d6eef8" stop-opacity="${dark ? .5 : .95}"/><stop offset=".45" stop-color="#9fd0e6" stop-opacity="${dark ? .32 : .85}"/><stop offset="1" stop-color="#cfe9f5" stop-opacity="${dark ? .45 : .95}"/></linearGradient>
    <linearGradient id="ryGrid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#131922"/><stop offset="1" stop-color="#0b0f15"/></linearGradient>`);
  const L = {}; ['bg', 'marks', 'beams', 'dev', 'dots', 'spot', 'src'].forEach((k) => (L[k] = el('g', {}, sv)));
  if (dark) {
    el('rect', { width: W, height: H, fill: 'url(#ryGrid)' }, L.bg);
    const gl = []; for (let x = 0; x <= W; x += 40) gl.push(`M${x} 0V${H}`); for (let y = CY % 40; y <= H; y += 40) gl.push(`M0 ${y}H${W}`);
    el('path', { d: gl.join(''), stroke: 'rgba(160,190,220,.06)', 'stroke-width': 1 }, L.bg);
  } else el('rect', { width: W, height: H, fill: '#fff' }, L.bg);
  const ph = dark ? OP.photons(L.dots) : null;
  let dev = o.dev, single = null, showMarks = false, lit = true;
  const N = o.n || 5, GAP = o.gap || 52;
  const MX = 760, LX = 520, n = 1.5;
  const geo = {
    'concave-mirror': { R: 600, half: 170 }, 'convex-mirror': { R: 600, half: 170 },
    'convex-lens': { R: 290, t: 104, half: 160 }, 'concave-lens': { R: 290, t: 16, half: 160 },
  };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], dot = (a, b) => a[0] * b[0] + a[1] * b[1], add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k], nrm = (a) => { const l = Math.hypot(a[0], a[1]); return [a[0] / l, a[1] / l]; };
  function hitCircle(p, d, c, R, vx) {
    const oc = sub(p, c), b = dot(oc, d), cc = dot(oc, oc) - R * R, disc = b * b - cc;
    if (disc < 0) return null;
    const s = Math.sqrt(disc), ts = [-b - s, -b + s].filter((t) => t > 1e-6);
    let best = null; ts.forEach((t) => { const q = add(p, d, t); if (!best || Math.abs(q[0] - vx) < Math.abs(best.q[0] - vx)) best = { t, q }; });
    return best;
  }
  function refract(d, nn, eta) {
    let N2 = nn, ci = -dot(N2, d); if (ci < 0) { N2 = [-nn[0], -nn[1]]; ci = -ci; }
    const k = 1 - eta * eta * (1 - ci * ci); if (k < 0) return null;
    return nrm(add([d[0] * eta, d[1] * eta], N2, eta * ci - Math.sqrt(k)));
  }
  /* 기구 면 */
  function surf(k) {
    const g = geo[k];
    if (k === 'concave-mirror') return [{ c: [MX - g.R, CY], R: g.R, vx: MX }];
    if (k === 'convex-mirror') return [{ c: [MX + g.R, CY], R: g.R, vx: MX }];
    if (k === 'convex-lens') return [{ c: [LX - g.t / 2 + g.R, CY], R: g.R, vx: LX - g.t / 2 }, { c: [LX + g.t / 2 - g.R, CY], R: g.R, vx: LX + g.t / 2 }];
    return [{ c: [LX - g.t / 2 - g.R, CY], R: g.R, vx: LX - g.t / 2 }, { c: [LX + g.t / 2 + g.R, CY], R: g.R, vx: LX + g.t / 2 }];
  }
  function trace(y) {
    const x0 = dark ? 150 : 30;
    let p = [x0, y], d = [1, 0];
    const pts = [p.slice()], hits = [];
    const ss = surf(dev);
    if (ML.isMirror(dev)) {
      const h = hitCircle(p, d, ss[0].c, ss[0].R, ss[0].vx); pts.push(h.q); hits.push({ q: h.q, n: nrm(sub(h.q, ss[0].c)) });
      const nn = nrm(sub(h.q, ss[0].c)); d = nrm(add(d, nn, -2 * dot(d, nn))); p = h.q;
    } else {
      ss.forEach((s, i) => { const h = hitCircle(p, d, s.c, s.R, s.vx); const nn = nrm(sub(h.q, s.c)); pts.push(h.q); hits.push({ q: h.q, n: nn }); d = refract(d, nn, i === 0 ? 1 / n : n) || d; p = h.q; });
    }
    // 화면 끝까지
    let t = 2000; const lim = [[0, W], [0, H]];
    if (d[0] > 0) t = Math.min(t, (lim[0][1] - p[0]) / d[0]); if (d[0] < 0) t = Math.min(t, (lim[0][0] + (dark ? 4 : 10) - p[0]) / d[0]);
    if (d[1] > 0) t = Math.min(t, (lim[1][1] - 4 - p[1]) / d[1]); if (d[1] < 0) t = Math.min(t, (4 - p[1]) / d[1]);
    pts.push(add(p, d, t));
    return { pts, hits, d, p };
  }
  /* 기구 그리기 */
  function drawDev() {
    L.dev.innerHTML = '';
    const g = geo[dev], ss = surf(dev);
    const arcPts = (s, sign, half) => { const a = []; for (let i = 0; i <= 40; i++) { const y = -half + (2 * half * i) / 40; a.push([s.c[0] + sign * Math.sqrt(s.R * s.R - y * y), CY + y]); } return a; };
    if (ML.isMirror(dev)) {
      const sign = dev === 'concave-mirror' ? 1 : -1, s = ss[0];
      const front = arcPts(s, sign, g.half), back = front.map(([x, y]) => [x + 16, y]);
      el('path', { d: OP.dstr(front) + 'L' + OP.dstr(back.reverse()).slice(1) + 'Z', fill: 'url(#mlBack)' }, L.dev);
      el('path', { d: OP.dstr(front) + 'L' + OP.dstr(front.map(([x, y]) => [x + 7, y]).reverse()).slice(1) + 'Z', fill: dark ? '#cfe7f3' : 'url(#mlGlassB)', stroke: dark ? 'rgba(220,240,250,.9)' : '#5c9fb8', 'stroke-width': 1.2 }, L.dev);
      if (dark) el('path', { d: OP.dstr(front), stroke: '#fff', 'stroke-width': 2, fill: 'none', opacity: .9 }, L.dev);
    } else {
      const a = arcPts(ss[0], -1, g.half), b = arcPts(ss[1], 1, g.half);
      let d;
      if (dev === 'convex-lens') d = OP.dstr(a) + 'L' + OP.dstr(b.reverse()).slice(1) + 'Z';
      else { const a2 = arcPts(ss[0], 1, g.half), b2 = arcPts(ss[1], -1, g.half); d = OP.dstr(a2) + 'L' + OP.dstr(b2.reverse()).slice(1) + 'Z'; }
      el('path', { d, fill: 'url(#ryGlass)', stroke: dark ? 'rgba(200,232,246,.85)' : '#4f93ad', 'stroke-width': 1.6 }, L.dev);
      el('path', { d: `M${LX - (dev === 'convex-lens' ? 26 : 22)} ${CY - g.half * .7}Q${LX - (dev === 'convex-lens' ? 38 : 14)} ${CY} ${LX - (dev === 'convex-lens' ? 30 : 16)} ${CY + g.half * .35}`, stroke: '#fff', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round', opacity: dark ? .35 : .6 }, L.dev);
    }
  }
  function drawSrc() {
    L.src.innerHTML = '';
    if (!dark) return;
    const hs = heights(), top = Math.min(...hs) - 34, bot = Math.max(...hs) + 34;
    el('rect', { x: 46, y: top, width: 104, height: bot - top, rx: 12, fill: 'url(#ryBox)', stroke: '#05070a', filter: 'url(#opShadow)' }, L.src);
    el('rect', { x: 52, y: top + 6, width: 92, height: 8, rx: 4, fill: 'rgba(255,255,255,.1)' }, L.src);
    el('rect', { x: 138, y: top + 8, width: 14, height: bot - top - 16, rx: 3, fill: 'url(#opMetal)' }, L.src);
    hs.forEach((y) => el('rect', { x: 146, y: y - 5, width: 6, height: 10, rx: 2, fill: lit ? '#ff6a5a' : '#3a1210' }, L.src));
  }
  const heights = () => (single != null ? [CY + single] : Array.from({ length: N }, (_, i) => CY + (i - (N - 1) / 2) * GAP));
  let beams = [];
  function render(grow) {
    L.beams.innerHTML = ''; L.marks.innerHTML = ''; L.spot.innerHTML = ''; if (ph) ph.clear(); beams = [];
    drawDev(); drawSrc();
    if (!lit) return;
    const rs = heights().map(trace);
    rs.forEach((r) => {
      if (dark) {
        const b = OP.beam(L.beams, { halo: 16, mid: 5, w: 2 }); b.set(r.pts); b.show(true, grow); beams.push(b);
        ph.add(r.pts, { rate: 1.6, speed: 260, r: 3.4, color: '#ffe0d8' });
      } else {
        el('path', { d: OP.dstr(r.pts), stroke: '#ee3a3a', 'stroke-width': 2.4, fill: 'none', 'stroke-linejoin': 'round' }, L.beams);
        for (let i = 1; i < r.pts.length; i++) {
          const a = r.pts[i - 1], b = r.pts[i], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 80) continue;
          const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
          el('path', { d: 'M-9 -6L5 0L-9 6Z', fill: '#ee3a3a', transform: `translate(${m[0].toFixed(1)} ${m[1].toFixed(1)}) rotate(${ang.toFixed(1)})` }, L.beams);
        }
      }
      if (showMarks) r.hits.forEach((h) => {
        const k = 54, a = add(h.q, h.n, -k), b = add(h.q, h.n, k);
        el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: dark ? 'rgba(220,235,250,.6)' : '#8a9bad', 'stroke-width': 1.4, 'stroke-dasharray': '5 5' }, L.marks);
        el('circle', { cx: h.q[0], cy: h.q[1], r: 5, fill: 'none', stroke: dark ? '#fff' : '#34495e', 'stroke-width': 1.6 }, L.marks);
      });
    });
    // 모이는 곳: 가운데 근처 빛들이 서로 만나는 점
    if (ML.converge(dev) && single == null && rs.length > 2) {
      const a = rs[Math.floor(N / 2) - 1], b = rs[Math.floor(N / 2) + 1];
      const p = a.p, d1 = a.d, q = b.p, d2 = b.d, den = d1[0] * d2[1] - d1[1] * d2[0];
      if (Math.abs(den) > 1e-6) {
        const t = ((q[0] - p[0]) * d2[1] - (q[1] - p[1]) * d2[0]) / den, X = add(p, d1, t);
        if (dark) { el('circle', { cx: X[0], cy: X[1], r: 34, fill: 'url(#rySpot)', class: 'pulse2' }, L.spot); }
        api.meet = X;
      }
    } else api.meet = null;
    api.traces = rs;
  }
  const api = {
    sv, dev(k) { dev = k; render(true); }, single(h) { single = h; render(false); }, marks(v) { showMarks = v; render(false); },
    light(v) { lit = v; render(true); }, get state() { return { dev, single, showMarks, lit }; }, CY, LX, MX, H, W, meet: null, traces: [],
  };
  render(false);
  return api;
};
