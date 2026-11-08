/* ===== 기관계의 상호작용 2D 도구 BSC =====
   cells: 넓적다리 근육 속 조직세포 확대(모세혈관에서 산소·영양소가 들어가고 이산화 탄소·노폐물이 나온다, 세포호흡 때 에너지)
   resp:  그림 Ⅵ-18 형식(영양소 + 산소 → 세포 → 이산화 탄소 + 물, 에너지 → 근육 운동·체온 유지·몸이 자람·두뇌 활동·소리 내기)
   map:   교과서 221쪽 해 보기 그림 형식(폐·심장·위·작은창자·콩팥·간·조직세포를 8자 순환 고리로 잇고 ㉠~㉣ 화살표)
   icon:  물질 기호(교과서 그림과 같은 모양: 산소 붉은 공, 이산화 탄소 푸른 공, 영양소 보라 육각형, 노폐물 노란 네모)
   알갱이의 수·크기·빠르기는 잘 보이게 정한 모형이다. */
const BSC = (() => {
  'use strict';
  const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const hex = (c) => { const p = parseInt(c.slice(1), 16); return [p >> 16, (p >> 8) & 255, p & 255]; };
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((x, i) => Math.round(x + (B[i] - x) * t)).join(',')})`; };
  const INK = '#14263b', BLUE = '#0e63b3';
  const K = {
    o2: { n: '산소', c: '#d8392b', r: 7 },
    co2: { n: '이산화 탄소', c: '#2f7fd0', r: 7 },
    nut: { n: '영양소', c: '#7d55c7', r: 9 },
    was: { n: '노폐물', c: '#e3ad18', r: 7.5 },
    wat: { n: '물', c: '#5fb0e8', r: 7.5 },
  };

  function surface(host, LW, LH) {
    const cv = document.createElement('canvas'); cv.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y'; host.appendChild(cv);
    const g = cv.getContext('2d'); const S = { cv, g, k: 1, ox: 0, oy: 0, W: 1, H: 1, LW, LH };
    const fit = () => { const r = host.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); S.W = Math.max(1, r.width); S.H = Math.max(1, r.height); cv.width = S.W * d; cv.height = S.H * d; S.k = Math.min(S.W / S.LW, S.H / S.LH); S.ox = (S.W - S.LW * S.k) / 2; S.oy = (S.H - S.LH * S.k) / 2; S.d = d; };
    S.begin = () => { g.setTransform(S.d, 0, 0, S.d, 0, 0); g.clearRect(0, 0, S.W, S.H); g.setTransform(S.d * S.k, 0, 0, S.d * S.k, S.d * S.ox, S.d * S.oy); };
    S.toL = (x, y) => [(x - S.ox) / S.k, (y - S.oy) / S.k];
    try { new ResizeObserver(fit).observe(host); } catch (e) { addEventListener('resize', fit); } fit();
    return S;
  }
  function loop(host, fn) {
    let last = performance.now(), on = true;
    const vis = () => { const r = host.getBoundingClientRect(); if (document.hidden || r.bottom < 0 || r.top > (window.innerHeight || 800) || r.width < 2) return false; try { const f = window.frameElement; if (f && f.hasAttribute('data-page') && !f.classList.contains('on')) return false; } catch (e) {} return true; };
    const tick = (now) => { requestAnimationFrame(tick); const dt = Math.min(.05, (now - last) / 1000); last = now; if (!on || !vis()) return; fn(window.__bakeDt !== undefined ? window.__bakeDt : dt); };
    requestAnimationFrame(tick); return { stop() { on = false; }, start() { on = true; } };
  }
  const rr = (g, x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); };
  const label = (g, t, x, y, o = {}) => {
    g.font = `${o.w || 800} ${o.s || 17}px Pretendard, sans-serif`; g.textAlign = o.a || 'center'; g.textBaseline = 'middle';
    if (o.bg !== false) { const w = g.measureText(t).width + 14, h = (o.s || 17) + 9, X = o.a === 'left' ? x - 7 : o.a === 'right' ? x - w + 7 : x - w / 2; g.fillStyle = o.bg || 'rgba(255,255,255,.93)'; rr(g, X, y - h / 2, w, h, 7); g.fill(); if (o.line) { g.strokeStyle = o.line; g.lineWidth = 1.2; g.stroke(); } }
    g.fillStyle = o.c || INK; g.fillText(t, x, y);
  };
  const lead = (g, x1, y1, x2, y2) => { g.strokeStyle = 'rgba(20,38,59,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
  const ballG = (g, x, y, r, c, hi = .42) => { const gr = g.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r); gr.addColorStop(0, mix(c, '#ffffff', hi)); gr.addColorStop(1, c); return gr; };
  const poly = (g, x, y, r, n, rot) => { g.beginPath(); for (let i = 0; i < n; i++) { const a = rot + i / n * Math.PI * 2 - Math.PI / 2; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); };
  function shape(g, k, x, y, s = 1, rot = 0, alpha = 1) {
    const d = K[k], r = d.r * s, c = d.c; g.globalAlpha = alpha; g.fillStyle = ballG(g, x, y, r * 1.1, c); g.strokeStyle = mix(c, '#000000', .32); g.lineWidth = 1;
    if (k === 'nut') { poly(g, x, y, r, 6, rot); g.fill(); g.stroke(); }
    else if (k === 'was') { g.save(); g.translate(x, y); g.rotate(rot * .25); g.beginPath(); g.rect(-r * .82, -r * .82, r * 1.64, r * 1.64); g.fill(); g.stroke(); g.restore(); }
    else if (k === 'wat') { g.beginPath(); g.moveTo(x, y - r * 1.25); g.bezierCurveTo(x + r * .9, y - r * .2, x + r * .95, y + r * .9, x, y + r * .95); g.bezierCurveTo(x - r * .95, y + r * .9, x - r * .9, y - r * .2, x, y - r * 1.25); g.fill(); g.stroke(); }
    else { g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); g.stroke(); }
    g.globalAlpha = 1;
  }
  function icon(k, size = 22) {
    const d = K[k], c = d.c, s = mix(c, '#000000', .32), id = 'bg' + k + Math.random().toString(36).slice(2, 6);
    const grad = `<defs><radialGradient id="${id}" cx="35%" cy="32%" r="70%"><stop offset="0" stop-color="${mix(c, '#ffffff', .42)}"/><stop offset="1" stop-color="${c}"/></radialGradient></defs>`;
    let body = '';
    if (k === 'nut') { const p = []; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 - Math.PI / 2; p.push((12 + Math.cos(a) * 9).toFixed(1) + ',' + (12 + Math.sin(a) * 9).toFixed(1)); } body = `<polygon points="${p.join(' ')}" fill="url(#${id})" stroke="${s}"/>`; }
    else if (k === 'was') body = `<rect x="5.5" y="5.5" width="13" height="13" rx="1.5" fill="url(#${id})" stroke="${s}"/>`;
    else if (k === 'wat') body = `<path d="M12 3 C18 10 19 15 12 20 C5 15 6 10 12 3Z" fill="url(#${id})" stroke="${s}"/>`;
    else body = `<circle cx="12" cy="12" r="7" fill="url(#${id})" stroke="${s}"/>`;
    return `<svg class="bsi" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${grad}${body}</svg>`;
  }
  /* 길 (점 목록) */
  class Line {
    constructor(pts) { this.p = pts; this.c = [0]; for (let i = 1; i < pts.length; i++) this.c.push(this.c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); this.len = this.c[this.c.length - 1] || 1; }
    at(u) { const s = Math.max(0, Math.min(1, u)) * this.len, c = this.c; let a = 0, b = c.length - 1; while (b - a > 1) { const m = (a + b) >> 1; if (c[m] <= s) a = m; else b = m; } const t = (s - c[a]) / Math.max(1e-6, c[b] - c[a]); return [this.p[a][0] + (this.p[b][0] - this.p[a][0]) * t, this.p[a][1] + (this.p[b][1] - this.p[a][1]) * t]; }
  }
  /* 부드러운 곡선 (캐트멀롬) */
  const curve = (pts, n = 10, closed = false) => {
    const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]], out = [];
    for (let i = 1; i < P.length - 2; i++) for (let k = 0; k < n; k++) { const t = k / n, [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]], t2 = t * t, t3 = t2 * t; out.push([0, 1].map((j) => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); }
    out.push(closed ? out[0].slice() : pts[pts.length - 1].slice()); return out;
  };
  const stroke = (g, pts, w, c, cap = 'round') => { g.lineCap = cap; g.lineJoin = 'round'; g.lineWidth = w; g.strokeStyle = c; g.beginPath(); pts.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); g.stroke(); };
  /* 관(속이 보이는 굵은 관): 바깥 선 → 속 → 위쪽 밝은 띠 */
  const tube = (g, pts, w, fill, edge) => { stroke(g, pts, w + 3, edge); stroke(g, pts, w, fill); g.globalAlpha = .35; g.save(); g.translate(-w * .14, -w * .14); stroke(g, pts, w * .3, '#ffffff'); g.restore(); g.globalAlpha = 1; };

  /* ---------- 조직세포 하나 (세포막·세포질·핵) ---------- */
  function cellShape(g, cx, cy, rx, ry, seed, glow = 0) {
    let s = seed; const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const N = 9, pts = []; for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2 + R() * .3; pts.push([cx + Math.cos(a) * rx * (.9 + R() * .14), cy + Math.sin(a) * ry * (.9 + R() * .14)]); }
    const c = curve(pts, 8, true);
    const gr = g.createRadialGradient(cx - rx * .3, cy - ry * .35, 2, cx, cy, Math.max(rx, ry) * 1.1); gr.addColorStop(0, mix('#f7dcd6', '#ffe9b8', glow)); gr.addColorStop(1, mix('#e9b4ab', '#f2c784', glow));
    g.fillStyle = gr; g.beginPath(); c.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); g.closePath(); g.fill(); g.strokeStyle = '#b97c74'; g.lineWidth = 2; g.stroke();
    /* 핵 */
    const nx = cx + rx * .12, ny = cy - ry * .05; const ng = g.createRadialGradient(nx - 4, ny - 4, 1, nx, ny, rx * .32); ng.addColorStop(0, '#b693c4'); ng.addColorStop(1, '#7b5a8f');
    g.fillStyle = ng; g.beginPath(); g.ellipse(nx, ny, rx * .3, ry * .27, .3, 0, 6.2832); g.fill(); g.strokeStyle = '#5d4270'; g.lineWidth = 1; g.stroke();
    g.fillStyle = 'rgba(80,50,90,.55)'; g.beginPath(); g.arc(nx + 3, ny - 2, 3.4, 0, 6.2832); g.fill();
    /* 세포질 속 작은 알갱이 */
    g.fillStyle = 'rgba(150,80,70,.28)'; for (let i = 0; i < 14; i++) { const a = R() * 6.28, d = .45 + R() * .4; g.beginPath(); g.ellipse(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, 3.2, 1.8, a, 0, 6.2832); g.fill(); }
    return c;
  }
  /* 에너지 표시: 교과서처럼 톱니 모양 폭발 (번지는 빛은 쓰지 않음) */
  function burst(g, x, y, r, a = 1, txt) {
    if (a <= 0) return; g.globalAlpha = Math.min(1, a); g.beginPath(); const n = 12;
    for (let i = 0; i < n * 2; i++) { const ang = i / (n * 2) * Math.PI * 2, rad = i % 2 ? r * .58 : r; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(ang) * rad, y + Math.sin(ang) * rad); }
    g.closePath(); const gr = g.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, '#fff2a8'); gr.addColorStop(.6, '#f9c23c'); gr.addColorStop(1, '#ee8a1c'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#c4610f'; g.lineWidth = 1.2; g.stroke();
    if (txt) { g.font = `900 ${Math.round(r * .42)}px Pretendard, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#7a3500'; g.fillText(txt, x, y + 1); }
    g.globalAlpha = 1;
  }

  /* ===================== 조직세포 확대 ===================== */
  function cells(host, opt = {}) {
    const LW = 420, LH = 300, S = surface(host, LW, LH), g = S.g;
    const st = { o2: true, nut: true, co2Out: true, wasOut: true, flow: true, act: 1 };
    /* 모세혈관: 왼쪽(동맥 쪽)에서 오른쪽(정맥 쪽)으로 */
    const CAP = curve([[-20, 84], [80, 70], [190, 86], [300, 70], [440, 84]], 12);
    const capL = new Line(CAP);
    const CELL = [[90, 196, 70, 58, 11], [214, 214, 66, 62, 23], [336, 194, 70, 58, 37]];
    const P = [], rbc = Array.from({ length: 16 }, (_, i) => ({ u: i / 16, r: rnd(0, 6) }));
    let energy = 1, waste = 0, co2 = 0, fl = [0, 0, 0], t = 0, acc = 0;
    const emit = () => {
      const ci = Math.floor(Math.random() * 3), c = CELL[ci], into = [c[0] + rnd(-25, 25), c[1] + rnd(-18, 18)];
      if (st.o2 && Math.random() < .55) { const u = rnd(.12, .8), s = capL.at(u); P.push({ k: 'o2', a: s, b: into, t: 0, d: rnd(1.3, 1.8), ci, cap: u }); }
      if (st.nut && Math.random() < .45) { const u = rnd(.12, .8), s = capL.at(u); P.push({ k: 'nut', a: s, b: into, t: 0, d: rnd(1.5, 2), ci, cap: u }); }
    };
    loop(host, (dt) => {
      t += dt; const sp = st.flow ? 1 : 0, A = st.act;
      /* 들어오는 양 */
      acc += dt * 1.6 * A * sp; while (acc > 1) { acc -= 1; emit(); }
      rbc.forEach((r) => { r.u = (r.u + dt * .09 * A * sp) % 1; });
      const ok = st.o2 && st.nut && st.flow;
      energy += ((ok ? 1 : .12) - energy) * Math.min(1, dt * .8);
      waste += ((st.wasOut && st.flow ? 0 : 1) - waste) * Math.min(1, dt * .25);
      co2 += ((st.co2Out && st.flow ? 0 : 1) - co2) * Math.min(1, dt * .25);
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i]; p.t += dt * sp / p.d;
        if (p.t >= 1) {
          if (p.k === 'o2' || p.k === 'nut') {
            fl[p.ci] = Math.max(fl[p.ci], p.k === 'o2' ? .5 : .5); fl[p.ci] += .5;
            if (p.k === 'o2') { const c = CELL[p.ci]; /* 세포호흡: 이산화 탄소와 노폐물이 나간다 */ P.push({ k: 'co2', a: p.b, b: capL.at(Math.min(.95, p.cap + rnd(.05, .2))), t: 0, d: rnd(1.3, 1.8), out: true, ci: p.ci }); if (Math.random() < .55) P.push({ k: 'was', a: [c[0] + rnd(-20, 20), c[1] + rnd(-15, 15)], b: capL.at(Math.min(.95, p.cap + rnd(.05, .2))), t: 0, d: rnd(1.6, 2.2), out: true, ci: p.ci }); }
          } else if (p.out) { p.k2 = p.k; p.out = false; p.cu = Math.max(.05, Math.min(.95, (p.b[0] + 20) / 460)); p.t = 0; p.d = 9; p.inCap = true; }
          if (p.k === 'o2' || p.k === 'nut' || (p.inCap && p.cu > .99)) { P.splice(i, 1); continue; }
        }
        if (p.inCap) { p.cu += dt * .09 * A * sp; /* 막히면(배설계·호흡계·순환계 멈춤) 세포 주변에 남는다 */ if ((p.k === 'was' && !st.wasOut) || (p.k === 'co2' && !st.co2Out)) p.cu = Math.min(p.cu, .97); if (p.cu > .99) { P.splice(i, 1); continue; } }
      }
      fl = fl.map((f) => Math.max(0, f - dt * 1.4));
      if (P.length > 160) P.splice(0, P.length - 160);
      /* ---- 그리기 ---- */
      S.begin();
      g.fillStyle = '#fbf5f2'; rr(g, 0, 0, LW, LH, 14); g.fill();
      /* 세포 사이 공간 */
      g.fillStyle = '#f6ebe5'; g.fillRect(0, 108, LW, LH - 108);
      CELL.forEach((c, i) => { cellShape(g, c[0], c[1], c[2], c[3], c[4], Math.min(1, fl[i]) * energy * .9); });
      /* 모세혈관 벽과 혈액 */
      tube(g, CAP, 36, '#f4c6bd', '#c97a6e');
      const cg = g.createLinearGradient(0, 0, LW, 0); cg.addColorStop(0, 'rgba(210,58,44,.32)'); cg.addColorStop(1, 'rgba(80,90,170,.3)'); stroke(g, CAP, 30, cg);
      rbc.forEach((r) => { const [x, y] = capL.at(r.u); g.save(); g.translate(x, y + Math.sin(r.r + r.u * 20) * 4); g.rotate(r.r + r.u * 6); g.scale(1, .55); g.fillStyle = ballG(g, 0, 0, 9, mix('#d23a2c', '#8e3046', r.u)); g.beginPath(); g.arc(0, 0, 8, 0, 6.2832); g.fill(); g.restore(); });
      /* 알갱이 */
      P.forEach((p) => {
        let x, y; if (p.inCap) { [x, y] = capL.at(p.cu); y += Math.sin(p.cu * 30) * 3; } else { const e = p.t * p.t * (3 - 2 * p.t); x = p.a[0] + (p.b[0] - p.a[0]) * e; y = p.a[1] + (p.b[1] - p.a[1]) * e + Math.sin(p.t * 9) * 2; }
        shape(g, p.k, x, y, .82, p.t * 3, p.k === 'o2' || p.k === 'nut' ? Math.min(1, (1 - p.t) * 4) : 1);
      });
      /* 쌓인 노폐물·이산화 탄소 (나가지 못할 때) */
      if (waste > .05 || co2 > .05) { let s = 5; const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; for (let i = 0; i < 26; i++) { const x = 20 + R() * 380, y = 120 + R() * 170, k = i % 2 ? 'was' : 'co2', a = k === 'was' ? waste : co2; if (R() < a) shape(g, k, x, y, .7, i, Math.min(1, a * 1.2)); } }
      /* 에너지 */
      CELL.forEach((c, i) => { if (fl[i] > .05 && energy > .3) burst(g, c[0] - 18, c[1] + 14, 15 + fl[i] * 6, Math.min(1, fl[i]) * energy, ''); });
      label(g, '모세혈관', 360, 34, { s: 14 });
      label(g, '조직세포', 214, 284, { s: 14 });
      if (opt.title !== false) label(g, '조직세포 확대', 14, 18, { s: 13, a: 'left', c: '#5a6b7e', bg: 'rgba(255,255,255,.0)' });
    });
    const api = {}; Object.defineProperties(api, Object.getOwnPropertyDescriptors({ set(o) { Object.assign(st, o); }, get energy() { return energy; }, get waste() { return waste; } }));
    return api;
  }

  /* ===================== 그림 Ⅵ-18 형식 ===================== */
  /* 쓰임 그림: 사람 대신 쓰임을 보여 주는 물건을 그린다 */
  const USE = [
    { k: 'mus', t: '근육 운동', s: '근육 운동에 이용해요' },
    { k: 'tmp', t: '체온 유지', s: '체온을 유지하는 데 이용해요' },
    { k: 'grow', t: '몸이 자람', s: '몸이 자라는 데 이용해요' },
    { k: 'brain', t: '두뇌 활동', s: '두뇌 활동에 이용해요' },
    { k: 'voice', t: '소리 내기', s: '소리를 내는 데 이용해요' },
  ];
  function useArt(g, k, x, y, s, t) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const sh = (w = 38, h = 7, yy = 34) => { g.fillStyle = 'rgba(20,38,59,.1)'; g.beginPath(); g.ellipse(0, yy, w, h, 0, 0, 6.2832); g.fill(); };
    if (k === 'mus') {
      /* 줄넘기 줄과 손잡이 (줄이 돈다) */
      sh(40, 6, 38); const a = t * 5; const yy = Math.cos(a) * 26, zz = Math.sin(a);
      g.strokeStyle = '#3b6fa8'; g.lineWidth = 3; g.beginPath(); g.moveTo(-30, 0); g.bezierCurveTo(-26, yy * 1.2, 26, yy * 1.2, 30, 0); g.stroke();
      [-1, 1].forEach((d) => { g.save(); g.translate(d * 33, 4); g.rotate(d * .25); const hg = g.createLinearGradient(-5, 0, 5, 0); hg.addColorStop(0, '#f2a33a'); hg.addColorStop(1, '#c4741c'); g.fillStyle = hg; rr(g, -5, -4, 10, 26, 4); g.fill(); g.restore(); });
      void zz;
    } else if (k === 'tmp') {
      /* 체온계: 유리관과 붉은 액체 */
      sh(16, 4, 40); const lv = .62 + Math.sin(t * 1.5) * .02;
      g.fillStyle = '#eef3f7'; rr(g, -7, -38, 14, 66, 7); g.fill(); g.strokeStyle = '#9fb1c2'; g.lineWidth = 1.4; g.stroke();
      g.fillStyle = ballG(g, 0, 30, 11, '#d8392b'); g.beginPath(); g.arc(0, 30, 10, 0, 6.2832); g.fill(); g.strokeStyle = '#9b2a1f'; g.stroke();
      g.fillStyle = '#d8392b'; g.fillRect(-2.6, 30 - 62 * lv, 5.2, 62 * lv);
      g.strokeStyle = '#8a9bad'; g.lineWidth = 1; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(7, -28 + i * 9); g.lineTo(12, -28 + i * 9); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(-5, -34, 2, 56);
    } else if (k === 'grow') {
      /* 키 재는 자와 위로 자라는 표시 */
      sh(30, 5, 40); const wg = g.createLinearGradient(-10, 0, 10, 0); wg.addColorStop(0, '#e8c48c'); wg.addColorStop(1, '#c99a5a'); g.fillStyle = wg; rr(g, -11, -42, 22, 80, 3); g.fill(); g.strokeStyle = '#9b7238'; g.lineWidth = 1.2; g.stroke();
      g.strokeStyle = '#6f4e22'; for (let i = 0; i < 15; i++) { g.beginPath(); g.moveTo(-11, -38 + i * 5.2); g.lineTo(i % 5 ? -5 : 1, -38 + i * 5.2); g.stroke(); }
      const h = -12 - (Math.sin(t * .9) * .5 + .5) * 18; g.fillStyle = BLUE; g.fillRect(14, h, 16, 3); g.beginPath(); g.moveTo(22, h - 12); g.lineTo(28, h - 4); g.lineTo(16, h - 4); g.closePath(); g.fill();
    } else if (k === 'brain') {
      /* 책상 위 책과 연필 */
      sh(40, 6, 30); g.fillStyle = '#f6f0e4'; g.beginPath(); g.moveTo(-36, 18); g.lineTo(-2, 24); g.lineTo(-2, -6); g.lineTo(-34, -12); g.closePath(); g.fill(); g.strokeStyle = '#a99a7c'; g.lineWidth = 1.2; g.stroke();
      g.fillStyle = '#fbf7ee'; g.beginPath(); g.moveTo(36, 18); g.lineTo(2, 24); g.lineTo(2, -6); g.lineTo(34, -12); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#3b6fa8'; g.fillRect(-2.5, -7, 5, 32);
      g.strokeStyle = '#b8ad95'; g.lineWidth = 1; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-30, -4 + i * 6); g.lineTo(-8, 0 + i * 6); g.stroke(); g.beginPath(); g.moveTo(8, 0 + i * 6); g.lineTo(28, -4 + i * 6); g.stroke(); }
      g.save(); g.translate(20 + Math.sin(t * 3) * 3, -8); g.rotate(-.7); g.fillStyle = '#f2b93a'; g.fillRect(-3, -22, 6, 26); g.fillStyle = '#e8c89e'; g.beginPath(); g.moveTo(-3, 4); g.lineTo(3, 4); g.lineTo(0, 11); g.closePath(); g.fill(); g.fillStyle = '#e07a8a'; g.fillRect(-3, -26, 6, 5); g.restore();
    } else if (k === 'voice') {
      /* 마이크와 소리 물결 */
      sh(18, 4, 40); g.fillStyle = '#4a5866'; rr(g, -3, 4, 6, 30, 2); g.fill();
      g.fillStyle = ballG(g, 0, -12, 15, '#8996a3', .5); g.beginPath(); g.ellipse(0, -12, 12, 16, 0, 0, 6.2832); g.fill(); g.strokeStyle = '#5a6672'; g.lineWidth = 1.2; g.stroke();
      g.strokeStyle = 'rgba(40,50,60,.35)'; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(-11, -12 + i * 5); g.lineTo(11, -12 + i * 5); g.stroke(); }
      g.strokeStyle = BLUE; g.lineWidth = 2.2; for (let i = 0; i < 3; i++) { const ph = (t * .9 + i / 3) % 1; g.globalAlpha = 1 - ph; g.beginPath(); g.arc(4, -12, 20 + ph * 22, -.6, .6); g.stroke(); } g.globalAlpha = 1;
    }
    g.restore();
  }
  function resp(host, opt = {}) {
    const uses = opt.uses !== false;
    const LW = 1000, LH = uses ? 680 : 420, S = surface(host, LW, LH), g = S.g;
    const CX = 500, CY = uses ? 540 : 250, EY = CY - 178;
    const P = []; let t = 0, acc = 0, fl = 0;
    /* 들어오는 길: 영양소(왼쪽 위), 산소(왼쪽 아래) / 나가는 길: 물(오른쪽 위), 이산화 탄소(오른쪽 아래) */
    const INL = { nut: [[CX - 360, CY - 50], [CX - 210, CY - 34], [CX - 70, CY - 8]], o2: [[CX - 360, CY + 76], [CX - 210, CY + 52], [CX - 70, CY + 12]] };
    const OUTL = { wat: [[CX + 70, CY - 8], [CX + 210, CY - 36], [CX + 360, CY - 52]], co2: [[CX + 70, CY + 12], [CX + 210, CY + 52], [CX + 360, CY + 78]] };
    const L = {}; Object.entries(Object.assign({}, INL, OUTL)).forEach(([k, p]) => { L[k] = new Line(curve(p, 10)); });
    const CARD = [[108, 250], [302, 158], [500, 118], [698, 158], [892, 250]];
    loop(host, (dt) => {
      t += dt; acc += dt * 1.3;
      while (acc > 1) { acc -= 1; P.push({ k: 'nut', u: 0 }, { k: 'o2', u: 0 }); }
      for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.u += dt * .45; if (p.u >= 1) { P.splice(i, 1); if (p.k === 'o2') { fl = 1; P.push({ k: 'wat', u: 0 }, { k: 'co2', u: 0 }); } } }
      fl = Math.max(0, fl - dt * .9);
      S.begin(); g.fillStyle = '#ffffff'; g.fillRect(0, 0, LW, LH);
      if (uses) {
        USE.forEach((u, i) => {
          const [x, y] = CARD[i];
          g.strokeStyle = 'rgba(238,138,28,.45)'; g.lineWidth = 2; g.setLineDash([4, 7]); g.lineDashOffset = -t * 22; g.beginPath(); g.moveTo(CX, EY); g.lineTo(x, y + 62); g.stroke(); g.setLineDash([]);
          g.fillStyle = '#f7f9fb'; rr(g, x - 88, y - 78, 176, 142, 16); g.fill(); g.strokeStyle = '#dde6ee'; g.lineWidth = 1.2; g.stroke();
          useArt(g, u.k, x, y - 18, 1.12, t);
          label(g, u.t, x, y + 44, { s: 19, bg: false });
        });
      }
      cellShape(g, CX, CY, 96, 74, 31, fl * .8);
      label(g, '세포', CX - 6, CY + 48, { s: 17, bg: 'rgba(255,255,255,.78)' });
      Object.values(L).forEach((l) => { g.strokeStyle = 'rgba(20,38,59,.12)'; g.lineWidth = 2; g.beginPath(); l.p.forEach((q, i) => g[i ? 'lineTo' : 'moveTo'](q[0], q[1])); g.stroke(); });
      P.forEach((p) => { const [x, y] = L[p.k].at(p.u), a = p.k === 'nut' || p.k === 'o2' ? Math.min(1, (1 - p.u) * 5) : Math.min(1, p.u * 5); shape(g, p.k, x, y, 1.6, p.u * 4, a); });
      shape(g, 'nut', INL.nut[0][0], INL.nut[0][1], 2.4, .2); label(g, '영양소', INL.nut[0][0], INL.nut[0][1] + 38, { s: 18 });
      shape(g, 'o2', INL.o2[0][0], INL.o2[0][1], 2.2); label(g, '산소', INL.o2[0][0], INL.o2[0][1] + 36, { s: 18 });
      shape(g, 'wat', OUTL.wat[2][0], OUTL.wat[2][1], 2.2); label(g, '물', OUTL.wat[2][0], OUTL.wat[2][1] + 38, { s: 18 });
      shape(g, 'co2', OUTL.co2[2][0], OUTL.co2[2][1], 2.2); label(g, '이산화 탄소', OUTL.co2[2][0], OUTL.co2[2][1] + 36, { s: 18 });
      const bs = 52 + Math.sin(t * 3) * 2 + fl * 8; g.strokeStyle = '#ee8a1c'; g.lineWidth = 3; g.beginPath(); g.moveTo(CX, CY - 78); g.lineTo(CX, CY - 104); g.stroke(); g.fillStyle = '#ee8a1c'; g.beginPath(); g.moveTo(CX - 8, CY - 102); g.lineTo(CX + 8, CY - 102); g.lineTo(CX, CY - 116); g.closePath(); g.fill();
      burst(g, CX, EY, bs, 1, '에너지');
    });
    return {};
  }

  /* ===================== 해 보기 그림 (교과서 221쪽 형식) ===================== */
  function map(host, opt = {}) {
    const LW = 900, LH = 1000, S = surface(host, LW, LH), g = S.g;
    const state = { hi: null, arrows: opt.arrows !== false, reveal: { a: true, b: true, c: true, d: true }, flow: true, roles: false, tag: {}, labels: opt.labels !== false, sel: null, speed: 1 };
    /* --- 몸 속 자리 --- */
    const HEART = [450, 470];
    /* 위 고리(폐 쪽): 심장 → 왼쪽 위 → ㉠(왼쪽 폐) → 가운데 → ㉡(오른쪽 폐) → 심장 */
    const UP = curve([HEART, [392, 452], [342, 410], [322, 350], [336, 300], [392, 282], [450, 300], [508, 282], [564, 300], [578, 350], [558, 410], [508, 452], HEART], 10);
    /* 아래 고리(온몸 쪽): 심장 → 오른쪽 아래 → 조직세포 → 간 → 왼쪽 위 → 심장 */
    const DN = curve([HEART, [520, 498], [568, 560], [574, 660], [572, 760], [556, 846], [500, 892], [420, 896], [352, 862], [326, 790], [326, 690], [330, 590], [354, 512], [404, 486], HEART], 10);
    const up = new Line(UP), dn = new Line(DN);
    const uAt = (L, x, y) => { let b = 0, d = 1e9; L.p.forEach((q, i) => { const e = Math.hypot(q[0] - x, q[1] - y); if (e < d) { d = e; b = i; } }); return L.c[b] / L.len; };
    /* ㉠~㉣ 자리 */
    const AR = {
      a: { n: '㉠', at: [322, 352], dir: [0, -1], u: uAt(up, 322, 352), L: up, k: 'co2', from: 'blood', to: [300, 300] },
      b: { n: '㉡', at: [578, 352], dir: [0, 1], u: uAt(up, 578, 352), L: up, k: 'o2', from: 'lung', to: [600, 300] },
      c: { n: '㉢', at: [326, 650], dir: [-1, 0], u: uAt(dn, 326, 650), L: dn, k: 'was', from: 'blood', to: [244, 650] },
      d: { n: '㉣', at: [574, 600], dir: [-1, 0], u: uAt(dn, 574, 600), L: dn, k: 'nut', from: 'gut', to: [650, 600] },
    };
    const uCell = uAt(dn, 528, 872), uLiv = uAt(dn, 380, 884);
    /* 공기·음식물 길 */
    const AIR = curve([[430, 18], [430, 70], [432, 150], [440, 218], [450, 236]], 8);
    const BRL = curve([[450, 236], [410, 262], [372, 300], [350, 330]], 8), BRR = curve([[450, 236], [492, 262], [528, 300], [550, 330]], 8);
    const FOODL = curve([[470, 18], [470, 80], [478, 170], [520, 240], [600, 300], [640, 360], [648, 410]], 8);
    const STOM = [[648, 410], [672, 438], [686, 470], [676, 500], [646, 512], [622, 506]];
    const SI = curve([[622, 506], [662, 526], [692, 548], [668, 572], [630, 580], [650, 606], [690, 620], [672, 646], [630, 652], [652, 680], [696, 694], [706, 730]], 8);
    const LI = curve([[706, 730], [726, 780], [732, 860], [716, 930], [700, 990]], 8);
    const KID = [[230, 620, -1], [278, 640, 1]];
    const URE = curve([[246, 664], [236, 740], [206, 820], [186, 868]], 8);
    const air = new Line(AIR.concat(BRR.slice(1))), airOut = new Line(BRL.slice().reverse().concat(AIR.slice(0, -1).reverse())), food = new Line(FOODL.concat(curve(STOM, 6).slice(1), SI.slice(1)));
    const uAbs = (() => { const L = food; let b = 0, d = 1e9; L.p.forEach((q, i) => { const e = Math.hypot(q[0] - 650, q[1] - 600); if (e < d) { d = e; b = i; } }); return L.c[b] / L.len; })();
    const urine = new Line(curve([[246, 652], [236, 740], [206, 820], [186, 868], [180, 900], [180, 990]], 8));
    /* --- 알갱이 --- */
    const P = [];
    const seed = () => {
      for (let i = 0; i < 70; i++) { const loop = Math.random() < .45 ? 'up' : 'dn'; P.push(mkBlood(loop, Math.random())); }
    };
    /* 혈액 속 알갱이: 고리 위치에 따라 무엇을 싣는지 정한다 */
    function mkBlood(loop, u) { return { where: loop, u, k: null, j: rnd(-8, 8), r: rnd(0, 6) }; }
    const blood = [], free = [];
    /* 혈액 고리에 실린 물질 (교과서 그림처럼: 위 고리 왼쪽은 이산화 탄소, 오른쪽은 산소, 아래 고리 오른쪽은 산소·영양소, 왼쪽은 이산화 탄소·노폐물) */
    for (let i = 0; i < 36; i++) blood.push({ L: 'up', u: i / 36, j: rnd(-7, 7), r: rnd(0, 6) });
    for (let i = 0; i < 70; i++) blood.push({ L: 'dn', u: i / 70, j: rnd(-7, 7), r: rnd(0, 6) });
    blood.forEach((b, i) => { b.slot = i % 4; });
    const cargo = (b) => {
      const u = b.u;
      if (b.L === 'up') { if (b.slot > 2) return null; return u < AR.a.u ? 'co2' : u < AR.b.u ? null : 'o2'; }
      /* 아래 고리 */
      if (u < uCell) { if (b.slot < 2) return 'o2'; if (b.slot === 2 && u > AR.d.u) return 'nut'; if (b.slot === 3) return u > AR.d.u ? 'nut' : 'o2'; return null; }
      if (b.slot < 2) return 'co2';
      if (b.slot === 2) return u < AR.c.u ? 'was' : 'co2';
      return u < AR.c.u ? 'was' : null;
    };
    let t = 0, acc = 0;
    loop(host, (dt) => {
      t += dt; const F = state.flow ? state.speed : 0;
      blood.forEach((b) => { const len = b.L === 'up' ? up.len : dn.len; b.u = (b.u + dt * 42 * F / len) % 1; });
      acc += dt * F; while (acc > .45) { acc -= .45; free.push({ L: air, k: 'o2', u: 0, sp: 70 }); free.push({ L: airOut, k: 'co2', u: 0, sp: 70 }); free.push({ L: food, k: 'nut', u: 0, sp: 55, stop: uAbs }); free.push({ L: urine, k: 'was', u: 0, sp: 40 }); }
      for (let i = free.length - 1; i >= 0; i--) { const f = free[i]; f.u += dt * f.sp * F / f.L.len; if (f.u >= (f.stop || 1)) free.splice(i, 1); }
      draw();
    });
    const dim = (sys) => state.hi && state.hi !== sys ? .22 : 1;
    function lungShape(cx, side) {
      const s = side, X = (d) => cx + s * d; /* s: 바깥쪽 방향 */
      g.beginPath(); g.moveTo(X(-6), 234);
      g.bezierCurveTo(X(24), 230, X(54), 276, X(60), 330); g.bezierCurveTo(X(64), 372, X(58), 404, X(40), 412);
      g.bezierCurveTo(X(14), 420, X(-24), 418, X(-44), 404); g.bezierCurveTo(X(-36), 380, X(-46), 350, X(-40), 318);
      g.bezierCurveTo(X(-34), 280, X(-30), 244, X(-6), 234); g.closePath();
    }
    function draw() {
      S.begin(); g.fillStyle = '#ffffff'; g.fillRect(0, 0, LW, LH);
      /* 소화계: 식도·위·작은창자·큰창자 */
      g.globalAlpha = dim('dig');
      tube(g, LI, 30, '#e6b98e', '#b9875c');
      tube(g, FOODL, 16, '#f0d58c', '#c9a659');
      { const st = curve(STOM, 8); g.fillStyle = (() => { const gr = g.createLinearGradient(620, 410, 690, 512); gr.addColorStop(0, '#f2b8a2'); gr.addColorStop(1, '#d98d74'); return gr; })(); g.beginPath(); g.moveTo(640, 396); g.bezierCurveTo(700, 400, 716, 476, 690, 512); g.bezierCurveTo(664, 540, 610, 530, 604, 506); g.bezierCurveTo(640, 504, 660, 470, 636, 420); g.closePath(); g.fill(); g.strokeStyle = '#b06a54'; g.lineWidth = 2; g.stroke(); void st; }
      tube(g, SI, 22, '#f3c9a8', '#c98e66');
      g.globalAlpha = 1;
      /* 간 */
      g.globalAlpha = state.hi ? .25 : 1;
      { g.beginPath(); g.moveTo(270, 860); g.bezierCurveTo(290, 820, 380, 818, 430, 840); g.bezierCurveTo(470, 858, 452, 900, 410, 914); g.bezierCurveTo(350, 932, 286, 920, 270, 900); g.closePath(); const gr = g.createLinearGradient(270, 820, 440, 920); gr.addColorStop(0, '#a3523e'); gr.addColorStop(1, '#7a3326'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#5c2419'; g.lineWidth = 1.6; g.stroke(); g.globalAlpha *= .25; g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.moveTo(296, 852); g.quadraticCurveTo(350, 832, 410, 842); g.stroke(); }
      g.globalAlpha = 1;
      /* 배설계: 콩팥·오줌관·방광 */
      g.globalAlpha = dim('exc');
      tube(g, URE, 9, '#f0d68a', '#c9a64e');
      KID.forEach(([x, y, s]) => { g.save(); g.translate(x, y); g.scale(s, 1); g.beginPath(); g.moveTo(0, -46); g.bezierCurveTo(34, -48, 40, 38, 4, 46); g.bezierCurveTo(-22, 48, -30, 30, -16, 14); g.bezierCurveTo(-8, 4, -10, -6, -18, -16); g.bezierCurveTo(-30, -34, -22, -46, 0, -46); g.closePath(); const gr = g.createLinearGradient(-20, -40, 30, 40); gr.addColorStop(0, '#b65a50'); gr.addColorStop(1, '#8a3a34'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#5e2522'; g.lineWidth = 1.6; g.stroke(); g.restore(); });
      { g.beginPath(); g.ellipse(180, 888, 30, 22, 0, 0, 6.2832); const gr = g.createRadialGradient(172, 880, 3, 180, 888, 32); gr.addColorStop(0, '#f6e2b3'); gr.addColorStop(1, '#e2bd78'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#b58f45'; g.lineWidth = 1.6; g.stroke(); }
      g.globalAlpha = 1;
      /* 호흡계: 숨관·폐 */
      g.globalAlpha = dim('res');
      [[368, -1], [532, 1]].forEach(([cx, s]) => { lungShape(cx, s); const gr = g.createLinearGradient(cx - 60, 240, cx + 60, 410); gr.addColorStop(0, '#f2b8ba'); gr.addColorStop(1, '#d98189'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#b25b66'; g.lineWidth = 1.8; g.stroke(); });
      tube(g, AIR, 18, '#cfe2f1', '#86a9c8'); tube(g, BRL, 12, '#cfe2f1', '#86a9c8'); tube(g, BRR, 12, '#cfe2f1', '#86a9c8');
      g.strokeStyle = 'rgba(134,169,200,.6)'; g.lineWidth = 1.2; for (let y = 60; y < 220; y += 12) { g.beginPath(); g.moveTo(421, y); g.lineTo(441, y + 1); g.stroke(); }
      g.globalAlpha = 1;
      /* 순환계: 혈액 고리와 심장 */
      g.globalAlpha = dim('cir');
      tube(g, DN, 40, '#fbe1d8', '#e2a493'); tube(g, UP, 34, '#fbe1d8', '#e2a493');
      /* 흐르는 방향 (얇은 화살표 두 개) */
      [[dn, .18], [dn, .7], [up, .2], [up, .78]].forEach(([L, u]) => { const [x1, y1] = L.at(u), [x2, y2] = L.at(u + .02), a = Math.atan2(y2 - y1, x2 - x1); g.save(); g.translate(x1, y1); g.rotate(a); g.fillStyle = 'rgba(178,74,58,.55)'; g.beginPath(); g.moveTo(8, 0); g.lineTo(-6, -7); g.lineTo(-6, 7); g.closePath(); g.fill(); g.restore(); });
      /* 심장 */
      { const b = 1 + (state.flow ? Math.max(0, Math.sin(t * 7)) * .04 : 0); g.save(); g.translate(HEART[0], HEART[1] + 6); g.scale(b, b); g.beginPath(); g.moveTo(0, 46); g.bezierCurveTo(-44, 18, -64, -12, -46, -36); g.bezierCurveTo(-30, -56, -6, -48, 0, -30); g.bezierCurveTo(6, -48, 30, -56, 46, -36); g.bezierCurveTo(64, -12, 44, 18, 0, 46); g.closePath(); const gr = g.createLinearGradient(-40, -50, 40, 40); gr.addColorStop(0, '#e2604f'); gr.addColorStop(1, '#a8322a'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#7d211b'; g.lineWidth = 1.8; g.stroke(); g.restore(); }
      g.globalAlpha = 1;
      /* 조직세포 */
      g.globalAlpha = state.hi && state.hi !== 'cell' ? .35 : 1;
      { const C = [[506, 900], [540, 884], [530, 920], [566, 904], [500, 936], [556, 940]]; C.forEach(([x, y], i) => { poly(g, x, y, 19, 6, 0); const gr = g.createRadialGradient(x - 5, y - 6, 2, x, y, 20); gr.addColorStop(0, '#fbe3c2'); gr.addColorStop(1, '#efbb7c'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#c6863a'; g.lineWidth = 1.4; g.stroke(); g.fillStyle = '#b8743a'; g.beginPath(); g.arc(x + 2, y, 4.5, 0, 6.2832); g.fill(); void i; }); }
      g.globalAlpha = 1;
      /* 혈액 속 물질 */
      blood.forEach((b) => { const L = b.L === 'up' ? up : dn, k = cargo(b); if (!k) return; const sys = 'cir'; g.globalAlpha = dim(sys); const [x, y] = L.at(b.u), a = L.at(Math.min(1, b.u + .003)), n = Math.atan2(a[1] - y, a[0] - x) + Math.PI / 2; shape(g, k, x + Math.cos(n) * b.j * 1.6, y + Math.sin(n) * b.j * 1.6, .8, b.r + b.u * 8); });
      g.globalAlpha = 1;
      /* 공기·음식물·오줌 속 물질 */
      free.forEach((f) => { const [x, y] = f.L.at(f.u), sys = f.k === 'nut' ? 'dig' : f.k === 'was' ? 'exc' : 'res'; g.globalAlpha = dim(sys); shape(g, f.k, x, y, .85, f.u * 10); });
      g.globalAlpha = 1;
      /* 화살표 ㉠~㉣ */
      if (state.arrows) Object.entries(AR).forEach(([k, a]) => {
        const on = state.sel === k; const [x, y] = a.at, [dx, dy] = a.dir, ang = Math.atan2(dy, dx);
        g.save(); g.translate(x + dx * 2, y + dy * 2); g.rotate(ang); g.scale(1.22, 1.22);
        g.beginPath(); g.moveTo(34, 0); g.lineTo(10, -20); g.lineTo(10, -9); g.lineTo(-22, -9); g.lineTo(-22, 9); g.lineTo(10, 9); g.lineTo(10, 20); g.closePath();
        g.fillStyle = on ? BLUE : '#ffffff'; g.fill(); g.strokeStyle = BLUE; g.lineWidth = 2.4; g.stroke(); g.restore();
        const lx = x + (dx ? 0 : (k === 'a' ? -46 : 46)), ly = y + (dx ? -42 : 0);
        g.beginPath(); g.arc(lx, ly, 20, 0, 6.2832); g.fillStyle = on ? BLUE : '#ffffff'; g.fill(); g.strokeStyle = BLUE; g.lineWidth = 2; g.stroke();
        g.font = '900 23px Pretendard, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = on ? '#ffffff' : BLUE; g.fillText(a.n, lx, ly + 1);
        /* 답을 맞힌 화살표: 물질이 화살표 방향으로 이동 */
        if (state.reveal[k]) { for (let i = 0; i < 3; i++) { const ph = ((t * .9 + i / 3) % 1); g.globalAlpha = Math.min(1, (1 - ph) * 3, ph * 6); shape(g, a.k, x - dx * 26 + dx * 60 * ph, y - dy * 26 + dy * 60 * ph, .95, ph * 5); } g.globalAlpha = 1; }
      });
      /* 이름표 */
      if (state.labels) {
        label(g, '폐', 372, 384, { s: 26 }); label(g, '폐', 528, 384, { s: 26 }); label(g, '심장', HEART[0], HEART[1] + 4, { s: 26, bg: 'rgba(255,255,255,.82)' });
        label(g, '위', 730, 446, { s: 26 }); label(g, '작은창자', 784, 640, { s: 26 }); lead(g, 726, 640, 704, 640);
        label(g, '콩팥', 150, 600, { s: 26 }); label(g, '간', 300, 952, { s: 26 }); if (!state.roles) { label(g, '조직세포', 640, 966, { s: 26 }); lead(g, 594, 956, 566, 940); }
        label(g, '방광', 110, 888, { s: 25 }); label(g, '큰창자', 800, 860, { s: 25 });
        label(g, '산소', 372, 30, { s: 25, c: '#b5281d' }); label(g, '이산화 탄소', 340, 70, { s: 25, c: '#1d63a8' }); label(g, '음식물', 540, 44, { s: 25, c: '#5b3a9c' });
      }
      /* 역할놀이: 모둠원이 맡는 자리 */
      if (state.roles) {
        const RP = [['소화계', 770, 520], ['순환계', 650, 780], ['순환계', 250, 470], ['호흡계', 300, 170], ['배설계', 130, 770], ['조직세포', 690, 900]];
        RP.forEach(([n, x, y], i) => { const tg = state.tag[i] || ''; g.beginPath(); g.arc(x, y - 36, 22, 0, 6.2832); g.fillStyle = BLUE; g.fill(); g.font = '900 22px Pretendard, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(String(i + 1), x, y - 35); label(g, n + (tg ? ' · ' + tg : ''), x, y, { s: 22, line: '#c6dbf0' }); });
      }
    }
    seed(); void P; void uLiv;
    const api = {};
    Object.defineProperties(api, Object.getOwnPropertyDescriptors({
      set hi(v) { state.hi = v; }, get hi() { return state.hi; },
      set sel(v) { state.sel = v; }, set arrows(v) { state.arrows = v; }, set roles(v) { state.roles = v; }, set flow(v) { state.flow = v; }, set labels(v) { state.labels = v; }, set speed(v) { state.speed = v; },
      reveal(k, v = true) { state.reveal[k] = v; }, hideAll() { state.reveal = {}; },
      tag(i, v) { state.tag[i] = v; },
      AR,
    }));
    return api;
  }
  return { cells, resp, map, icon, shape, K, surface, loop, label, burst, cellShape, USE };
})();
window.BSC = BSC;
