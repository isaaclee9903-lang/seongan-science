/* ===== 광합성 수업 공통 그림 도구 PS =====
   잎맥: Runions 등(2005)의 공간 군집화(space colonization) 방법을 이 수업에 맞게 새로 구현(코드 복사 아님).
   해바라기 꽃판: 보겔의 잎차례 공식(황금각 137.5도). 모두 SVG로 그리고 글씨는 HTML 이름표로 올린다. */
window.PS = (() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const el = (t, a, p) => { const e = document.createElementNS(NS, t); if (a) for (const k in a) if (a[k] != null) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const mk = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const f1 = (n) => Math.round(n * 10) / 10;
  let uid = 0;
  const nid = (s = 'p') => `ps${s}${++uid}`;

  /* --- 시간 --- */
  function tween(ms, fn, done, ez = ease) {
    if (REDUCE || ms <= 0) { fn(1); done && done(); return () => {}; }
    let t0 = null, stop = false;
    const step = (now) => { if (stop) return; if (t0 == null) t0 = now; const t = clamp((now - t0) / ms); fn(ez(t)); if (t < 1) requestAnimationFrame(step); else done && done(); };
    requestAnimationFrame(step);
    return () => { stop = true; };
  }
  function loop(fn) {
    let last = null, stop = false;
    const step = (now) => { if (stop) return; if (last == null) last = now; const dt = Math.min(.05, (now - last) / 1000); last = now; fn(dt, now / 1000); requestAnimationFrame(step); };
    requestAnimationFrame(step);
    return () => { stop = true; };
  }

  /* --- 무대: SVG + HTML 이름표 --- */
  function stage(host, vb = [0, 0, 1000, 800]) {
    host.innerHTML = '';
    const svg = el('svg', { viewBox: vb.join(' '), preserveAspectRatio: 'xMidYMid meet', class: 'psv', 'aria-hidden': 'true' }, host);
    const ol = document.createElement('div'); ol.className = 'olay'; host.appendChild(ol);
    const labels = [];
    const place = () => {
      const m = svg.getScreenCTM(); if (!m) return; const b = host.getBoundingClientRect();
      labels.forEach((l) => { l.e.style.left = (m.a * l.x + m.c * l.y + m.e - b.left) + 'px'; l.e.style.top = (m.b * l.x + m.d * l.y + m.f - b.top) + 'px'; });
    };
    const label = (x, y, html, cls = '') => {
      const e = document.createElement('div'); e.className = 'ol ' + cls; e.innerHTML = html; ol.appendChild(e);
      const l = { e, x, y, set(h) { e.innerHTML = h; return l; }, show(v) { e.dataset.off = v ? '0' : '1'; return l; }, move(a, c) { l.x = a; l.y = c; place(); return l; } };
      labels.push(l); place(); return l;
    };
    if (window.ResizeObserver) new ResizeObserver(place).observe(host);
    window.addEventListener('resize', place);
    return { svg, ol, label, place, labels };
  }

  /* --- 공통 정의: 입자 모형, 재질 --- */
  let shared = null;
  function defs() {
    if (shared) return shared;
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden'); s.setAttribute('aria-hidden', 'true');
    s.innerHTML = `<defs>
      <radialGradient id="psO" cx=".36" cy=".32" r=".8"><stop offset="0" stop-color="#ff9a8a"/><stop offset=".55" stop-color="#e5533f"/><stop offset="1" stop-color="#b5301f"/></radialGradient>
      <radialGradient id="psC" cx=".36" cy=".32" r=".8"><stop offset="0" stop-color="#77808a"/><stop offset=".6" stop-color="#3b424a"/><stop offset="1" stop-color="#1f252b"/></radialGradient>
      <radialGradient id="psH" cx=".36" cy=".32" r=".85"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#e7eef6"/><stop offset="1" stop-color="#b7c6d6"/></radialGradient>
      <linearGradient id="psGlu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd76a"/><stop offset="1" stop-color="#e8a21c"/></linearGradient>
      <g id="mCO2"><circle cx="-15" cy="0" r="8.5" fill="url(#psO)" stroke="#8a2416" stroke-width=".7"/><circle cx="15" cy="0" r="8.5" fill="url(#psO)" stroke="#8a2416" stroke-width=".7"/><circle r="10" fill="url(#psC)" stroke="#14181c" stroke-width=".7"/></g>
      <g id="mH2O"><circle cx="-10" cy="8" r="6" fill="url(#psH)" stroke="#7f92a6" stroke-width=".7"/><circle cx="10" cy="8" r="6" fill="url(#psH)" stroke="#7f92a6" stroke-width=".7"/><circle r="10.5" fill="url(#psO)" stroke="#8a2416" stroke-width=".7"/></g>
      <g id="mO2"><circle cx="-7.5" cy="0" r="9" fill="url(#psO)" stroke="#8a2416" stroke-width=".7"/><circle cx="7.5" cy="0" r="9" fill="url(#psO)" stroke="#8a2416" stroke-width=".7"/></g>
      <g id="mGlu"><path d="M12 0 6 10.4H-6L-12 0-6-10.4H6Z" fill="url(#psGlu)" stroke="#a66d0a" stroke-width="1.2" stroke-linejoin="round"/><path d="M6.5 0 3.2 5.6H-3.2L-6.5 0-3.2-5.6H3.2Z" fill="none" stroke="#fff3c4" stroke-width="1.2" opacity=".75"/></g>
    </defs>`;
    (document.body || document.documentElement).appendChild(s);
    shared = s.querySelector('defs'); return shared;
  }
  function grad(stops, o = {}) {
    const id = nid('g'); const d = defs();
    const g = el(o.r ? 'radialGradient' : 'linearGradient', o.r ? { id, cx: o.cx ?? .5, cy: o.cy ?? .5, r: o.rr ?? .6 } : { id, x1: o.x1 ?? 0, y1: o.y1 ?? 0, x2: o.x2 ?? 0, y2: o.y2 ?? 1 }, d);
    stops.forEach(([p, c, a]) => el('stop', { offset: p, 'stop-color': c, 'stop-opacity': a }, g));
    return `url(#${id})`;
  }
  const sprite = (name, x, y, s, p) => el('use', { href: '#' + name, transform: `translate(${f1(x)} ${f1(y)}) scale(${s})` }, p);

  /* --- 잎: 윤곽 + 공간 군집화 잎맥 --- */
  const cache = {};
  function leafData(o) {
    const key = JSON.stringify(o); if (cache[key]) return cache[key];
    const R = mk(o.seed || 7), L = o.L, W = o.W, p = o.p ?? .72, q = o.q ?? .85, bend = o.bend ?? 0;
    const hw = (t) => t <= 0 || t >= 1 ? 0 : W * Math.pow(Math.sin(Math.PI * Math.pow(t, p)), q);
    const yb = (x) => bend * x * x / L;
    const tooth = (t, s) => { let k = 1; if (o.teeth) { const n = o.nt || 22, f = (t * n) % 1; k += o.teeth * (f < .75 ? f / .75 : (1 - f) / .25) * Math.sin(Math.PI * t); } if (o.ruffle) k += o.ruffle * Math.sin(t * 27 + s) * Math.sin(Math.PI * t); return k; };
    const N = o.n || 90, top = [], bot = [];
    for (let i = 0; i <= N; i++) { const t = i / N, x = t * L, w = hw(t); top.push([x, -w * tooth(t, 1) + yb(x)]); bot.push([x, w * tooth(t, 4) + yb(x)]); }
    const pd = (a) => a.map((v, i) => (i ? 'L' : 'M') + f1(v[0]) + ' ' + f1(v[1])).join('');
    const back = bot.slice().reverse();
    const outline = pd(top) + pd(back).replace(/^M/, 'L') + 'Z';
    const lower = pd(top.map((v) => [v[0], yb(v[0])])) + pd(back).replace(/^M/, 'L') + 'Z';
    /* 잎맥 */
    const D = o.D || L / 42, di = o.di || L / 7, dk = o.dk || D * 1.5;
    const at = []; let tries = 0;
    while (at.length < (o.nA || 240) && tries++ < 8000) { const t = R(); const y = (R() * 2 - 1) * W; if (Math.abs(y) < hw(t) * .95) at.push([t * L, y]); }
    const nodes = [];
    const nMid = Math.round(L / D);
    for (let i = 0; i <= nMid; i++) nodes.push({ x: i * D * .985, y: 0, p: i ? i - 1 : -1, k: 'm' });
    /* 곁맥: 가운데 잎맥에서 가장자리로 휘어 나가는 굵은 맥 */
    const nSec = o.sec ?? 8;
    for (let i = 0; i < nSec; i++) [-1, 1].forEach((sd) => {
      const t0 = .045 + .74 * (i + (sd > 0 ? .28 : 0)) / nSec, t1 = Math.min(.97, t0 + .2 + .06 * (1 - t0)), x0 = t0 * L, xe = t1 * L, ye = sd * hw(t1) * .93;
      const cx = x0 + (xe - x0) * .32, cy = ye * .68, n = Math.max(5, Math.round(Math.hypot(xe - x0, ye) / D));
      let par = Math.round(x0 / (D * .985)); par = Math.min(par, nMid);
      for (let k = 1; k <= n; k++) { const u = k / n, x = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * cx + u * u * xe, y = 2 * u * (1 - u) * cy + u * u * ye; nodes.push({ x, y, p: par, k: 's', u }); par = nodes.length - 1; }
    });
    let alive = at;
    for (let it = 0; it < 60 && alive.length; it++) {
      const pull = new Map();
      for (const a of alive) { let best = -1, bd = di * di; for (let i = 0; i < nodes.length; i++) { const dx = a[0] - nodes[i].x, dy = a[1] - nodes[i].y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } } if (best >= 0) { const v = pull.get(best) || [0, 0]; const dx = a[0] - nodes[best].x, dy = a[1] - nodes[best].y, m = Math.hypot(dx, dy) || 1; v[0] += dx / m; v[1] += dy / m; pull.set(best, v); } }
      if (!pull.size) break;
      const start = nodes.length;
      pull.forEach((v, i) => { const n = nodes[i]; const dx = v[0], dy = v[1]; const m = Math.hypot(dx, dy) || 1; nodes.push({ x: n.x + D * dx / m, y: n.y + D * dy / m, p: i, k: 't' }); });
      alive = alive.filter((a) => { for (let i = start; i < nodes.length; i++) { const dx = a[0] - nodes[i].x, dy = a[1] - nodes[i].y; if (dx * dx + dy * dy < dk * dk) return false; } return true; });
    }
    /* 굵기: 가운데 잎맥 > 곁맥 > 잔맥. 끝으로 갈수록 가늘게 */
    const V = o.vw || L / 80, bk = [V, V * .78, V * .58, V * .42, V * .34, V * .24, V * .1], ds = bk.map(() => []);
    for (let i = 1; i < nodes.length; i++) {
      const n = nodes[i]; if (n.p < 0) continue; const b = nodes[n.p];
      const k = n.k === 'm' ? Math.min(3, Math.floor(n.x / L * 4)) : n.k === 's' ? (n.u < .55 ? 4 : 5) : 6;
      ds[k].push(`M${f1(b.x)} ${f1(b.y + yb(b.x))}L${f1(n.x)} ${f1(n.y + yb(n.x))}`);
    }
    const res = { outline, lower, L, W, yb, hw, veins: ds.map((a, i) => ({ d: a.join(''), w: Math.round(bk[i] * 100) / 100 })) };
    cache[key] = res; return res;
  }
  /* pal: {a,b,v,e,p} 앞쪽 색, 끝쪽 색, 잎맥, 테두리, 잎자루. layers: 윤곽과 같은 덧칠 층 이름들 */
  function drawLeaf(parent, data, pal, o = {}) {
    const g = el('g', { transform: o.tf }, parent);
    if (o.pet) el('path', { d: `M${-o.pet} ${o.petY || 0}Q${-o.pet * .4} 2 2 0`, fill: 'none', stroke: pal.p || pal.e, 'stroke-width': o.petW || data.L / 45, 'stroke-linecap': 'round' }, g);
    const fill = grad([[0, pal.a], [1, pal.b]], { x1: 0, x2: 1, y1: .1, y2: .5 });
    const base = el('path', { d: data.outline, fill, stroke: pal.e, 'stroke-width': o.edge ?? .9, 'stroke-linejoin': 'round' }, g);
    const lo = el('path', { d: data.lower, fill: pal.s || '#0b3a14', opacity: o.shade ?? .13 }, g);
    const layers = {}; (o.layers || []).forEach((n) => { layers[n] = el('path', { d: data.outline, fill: 'none', opacity: 0 }, g); });
    const veins = el('g', { fill: 'none', stroke: pal.v, 'stroke-linecap': 'round', opacity: o.veinOp ?? .85 }, g);
    data.veins.forEach((v) => { if (v.d) el('path', { d: v.d, 'stroke-width': v.w }, veins); });
    return { g, base, lo, layers, veins };
  }
  const PAL = {
    sun: { a: '#3f8f35', b: '#5fb044', v: '#b8e08a', e: '#28692b', p: '#4c9a3a', s: '#0b3a14' },
    sunBack: { a: '#2f7a2e', b: '#4b9b3b', v: '#94cc72', e: '#215a25', p: '#3f8a33', s: '#0b3a14' },
    pep: { a: '#2f8a38', b: '#55ac45', v: '#a8dc86', e: '#1f6329', p: '#5aa244', s: '#0b3a14' },
    let: { a: '#79bd47', b: '#a9d962', v: '#def2b4', e: '#5d9c36', p: '#c7e59a', s: '#245c1c' },
  };

  /* --- 굵기가 변하는 줄기·뿌리 --- */
  function taper(pts, w0, w1) {
    const A = [], B = [], n = pts.length;
    pts.forEach((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, i / (n - 1)) / 2; A.push([p[0] - dy / m * w, p[1] + dx / m * w]); B.push([p[0] + dy / m * w, p[1] - dx / m * w]); });
    const smooth = (a) => { let d = ''; a.forEach((p, i) => { if (!i) return; const q = a[i - 1], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; d += `Q${f1(q[0])} ${f1(q[1])} ${f1(mx)} ${f1(my)}`; }); const e = a[a.length - 1]; return d + `L${f1(e[0])} ${f1(e[1])}`; };
    return `M${f1(A[0][0])} ${f1(A[0][1])}` + smooth(A) + `L${f1(B[n - 1][0])} ${f1(B[n - 1][1])}` + smooth(B.slice().reverse()) + 'Z';
  }
  function polyAt(pts, t) {
    if (!pts._l) { let s = 0; pts._l = [0]; for (let i = 1; i < pts.length; i++) { s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); pts._l.push(s); } pts._s = s; }
    const d = t * pts._s; let i = 1; while (i < pts.length - 1 && pts._l[i] < d) i++;
    const u = (d - pts._l[i - 1]) / ((pts._l[i] - pts._l[i - 1]) || 1);
    return [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)];
  }

  /* --- 입자 흐름: 길을 따라 움직이는 입자 묶음 --- */
  function flock(parent) {
    const g = el('g', null, parent); let list = [];
    const place = (p) => {
      const t = clamp(p.t), tt = p.ez ? p.ez(t) : t, c = polyAt(p.pts, tt);
      const w = p.wob ? Math.sin(t * 9 + p.ph) * p.wob * Math.sin(Math.PI * t) : 0;
      const a = (p.fi && t < p.fi ? t / p.fi : 1) * (p.fo && t > 1 - p.fo ? (1 - t) / p.fo : 1);
      p.u.setAttribute('transform', `translate(${f1(c[0] + w)} ${f1(c[1] + w * .6)}) rotate(${f1(p.rot + p.t * p.spin)}) scale(${p.s})`);
      p.u.setAttribute('opacity', Math.round(a * 20) / 20);
    };
    return {
      g,
      add(name, pts, o = {}) {
        const u = el('use', { href: '#' + name }, g);
        const p = { u, pts, t: 0, dur: o.dur || 3, s: o.s || 1, wob: o.wob || 0, ph: Math.random() * 6.28, rot: o.rot ?? (Math.random() * 360), spin: o.spin ?? 40, fi: o.fi ?? .12, fo: o.fo ?? 0, stay: o.stay || 0, cb: o.cb, ez: o.ez };
        list.push(p); place(p); return p;
      },
      step(dt) {
        const cbs = [];
        list = list.filter((p) => {
          p.t += dt / p.dur;
          if (p.t >= 1 && !p.done) { p.done = true; if (p.cb) cbs.push(p); }
          if (p.t >= 1 + p.stay) { p.u.remove(); return false; }
          place(p); return true;
        });
        cbs.forEach((p) => p.cb(p));
      },
      clear() { list.forEach((p) => p.u.remove()); list = []; },
      get n() { return list.length; },
    };
  }

  /* --- 실험대 --- */
  function bench(g, y = 690) {
    el('rect', { x: -600, y: -700, width: 2200, height: y + 700, fill: '#fff' }, g);
    el('rect', { x: -600, y, width: 2200, height: 900, fill: grad([[0, '#e9eef3'], [.2, '#f3f6f9'], [1, '#fbfcfd']]) }, g);
    el('line', { x1: -600, x2: 1600, y1: y, y2: y, stroke: '#cfd9e3', 'stroke-width': 1.2 }, g);
  }
  const shadow = (g, cx, cy, rx, ry, op = .28) => el('ellipse', { cx, cy, rx, ry, fill: grad([[0, '#2a3a4a', op], [.6, '#2a3a4a', op * .4], [1, '#2a3a4a', 0]], { r: 1, rr: .5 }) }, g);

  return { el, mk, lerp, clamp, ease, f1, nid, tween, loop, stage, defs, grad, sprite, leafData, drawLeaf, PAL, taper, polyAt, flock, bench, shadow, REDUCE };
})();
