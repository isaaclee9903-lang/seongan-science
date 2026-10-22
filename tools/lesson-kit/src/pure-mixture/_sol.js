/* ===== 용해도 그림 도구 (캔버스 2D) =====
   SOL.dissolve(host, 옵션)  입자 모형으로 본 용해 과정(그림 Ⅰ-4 형식): 비커 속 각설탕 + 확대 원 속 용매·용질 입자
   SOL.satur(host)           포화 용액과 불포화 용액(그림 Ⅰ-5 형식): 용질을 더 넣으면 가라앉음 / 더 녹음
   SOL.curve(host, 옵션)     용해도 곡선(그림 Ⅰ-6 값): 물질 강조, 온도 눈금선, 넣은 양 점
   SOL.tube(host, 옵션)      탐구 실험실: 시험관에 용질을 넣고 녹이기, 뜨거운 물·얼음물에 넣기
   SOL.beaker(host)          물 100 g이 든 비커에 용질 넣고 젓기 (용해도 곡선 실험실)
   SOL.soda(host, 옵션)      기체의 용해도(해 보기): 찬물·뜨거운 물 속 탄산음료, 주사기 피스톤 잡아당기기
   그림 원칙: 흰 바탕, 라스 파랑 한 색조 + 무채색, 매트한 질감, 얇은 선. 그림 속 글씨는 HTML 이름표.
   녹는 빠르기, 입자 수, 기포 수는 보기 좋게 정한 모형. 용해도 값은 교과서 그림 Ⅰ-6 곡선을 따라 그린 값. */
window.SOL = (() => {
  const TAU = Math.PI * 2;
  const BLUE = '#0e63b3', INK = '#14263b', INK2 = '#3d4f63';
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const eOut = (k) => 1 - Math.pow(1 - k, 3);
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };

  /* ---- 용해도 자료 (g/물 100 g, 0~100 ℃, 10 ℃ 간격) ---- */
  const DATA = {
    nano3: { name: '질산 나트륨', t: [73, 80, 88, 96, 104, 114, 124, 134, 148, 161, 177], lab: [26, 'up'] },
    kno3: { name: '질산 칼륨', t: [13.3, 21.4, 31.9, 45.6, 63.9, 85.5, 109.2, 138, 169, 202, 246], lab: [52, 'left'] },
    cuso4: { name: '황산 구리(Ⅱ)', t: [14, 17, 20, 24, 29, 34, 40, 47, 55, 65, 77], lab: [72, 'up'] },
    nacl: { name: '염화 나트륨', t: [35.7, 35.8, 35.9, 36.1, 36.4, 36.7, 37.1, 37.5, 38.0, 38.5, 39.2], lab: [88, 'up2'] },
    boric: { name: '붕산', t: [2.7, 3.6, 5.0, 6.6, 8.7, 11.5, 14.8, 18.6, 23.6, 29.4, 37], lab: [84, 'up'] },
  };
  const ORDER = ['nano3', 'kno3', 'cuso4', 'nacl', 'boric'];
  const EXACT = { 'kno3@10': '21.4', 'kno3@20': '31.9', 'kno3@60': '109.2', 'boric@20': '5.0' };
  // 단조 3차 보간(곡선이 꺾이지 않게)
  function solu(id, T) {
    const y = DATA[id].t, n = y.length - 1; T = clamp(T, 0, 100);
    const i = Math.min(n - 1, Math.floor(T / 10)), u = (T - i * 10) / 10;
    const d = (j) => (y[j + 1] - y[j]) / 10;
    const m = (j) => (j === 0 ? d(0) : j === n ? d(n - 1) : (d(j - 1) + d(j)) / 2);
    const h00 = 2 * u * u * u - 3 * u * u + 1, h10 = u * u * u - 2 * u * u + u, h01 = -2 * u * u * u + 3 * u * u, h11 = u * u * u - u * u;
    return h00 * y[i] + h10 * 10 * m(i) + h01 * y[i + 1] + h11 * 10 * m(i + 1);
  }
  const label = (id, T) => (EXACT[id + '@' + T] ? EXACT[id + '@' + T] + ' g' : '약 ' + Math.round(solu(id, T)) + ' g');

  /* ---- 캔버스 · 이름표 · 반복 ---- */
  function surface(host, W, H, crop) {
    const cv = document.createElement('canvas'); cv.className = 'wvc'; host.appendChild(cv);
    const box = document.createElement('div'); box.className = 'olay'; host.appendChild(box);
    const ctx = cv.getContext('2d'); const m = { k: 1, ox: 0, oy: 0, dpr: 1 };
    function fit() {
      const r = host.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      const c = S.crop || { x: 0, y: 0, w: W, h: H };
      m.k = Math.min(r.width / c.w, r.height / c.h); m.ox = (r.width - c.w * m.k) / 2 - c.x * m.k; m.oy = (r.height - c.h * m.k) / 2 - c.y * m.k; m.dpr = dpr;
      Object.assign(box.style, { left: m.ox + 'px', top: m.oy + 'px', width: W * m.k + 'px', height: H * m.k + 'px', right: 'auto', bottom: 'auto' });
    }
    const S = { cv, ctx, box, m, W, H, crop,
      setCrop(c) { S.crop = c; fit(); },
      begin() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(m.dpr * m.k, 0, 0, m.dpr * m.k, m.dpr * m.ox, m.dpr * m.oy); },
      full() { return [-m.ox / m.k, -m.oy / m.k, cv.width / m.dpr / m.k, cv.height / m.dpr / m.k]; },
      toLocal(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left - m.ox) / m.k, (e.clientY - r.top - m.oy) / m.k]; } };
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(host); else window.addEventListener('resize', fit);
    return S;
  }
  function overlay(S) {
    const box = S.box, map = {};
    return {
      put(id, x, y, html, cls = '') {
        let e = map[id]; if (!e) { e = document.createElement('span'); box.appendChild(e); map[id] = e; }
        const c = 'ol ' + cls; if (e.className !== c) e.className = c;
        if (e._h !== html) { e.innerHTML = html; e._h = html; }
        e.style.left = (x / S.W * 100).toFixed(2) + '%'; e.style.top = (y / S.H * 100).toFixed(2) + '%'; e.hidden = false; return e;
      },
      hide(id) { if (map[id]) map[id].hidden = true; },
    };
  }
  const loops = new Set();
  let last = 0;
  function tick(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0); last = now;
    loops.forEach((L) => { try { if (L.host.offsetParent !== null) { const r = L.host.getBoundingClientRect(); if (r.bottom > -50 && r.top < innerHeight + 50) L.fn(dt); } } catch (e) { loops.delete(L); (window.SM_err || window.RD_err || window.SW_err || console.error)('그림', e); } });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  const addLoop = (host, fn) => { const L = { host, fn }; loops.add(L); return L; };
  function tweens() {
    let list = [];
    return {
      add(dur, fn, done) { const t = { dur: Math.max(0.001, dur), t: 0, fn, done }; list.push(t); return t; },
      step(dt) { const cur = list; list = []; cur.forEach((t) => { t.t += dt; const k = Math.min(1, t.t / t.dur); t.fn(k); if (k < 1) list.push(t); else if (t.done) t.done(); }); },
      clear() { list = []; },
      get busy() { return list.length > 0; },
    };
  }
  // 차례대로 하는 일: [[시간, fn(k)], …] 끝나면 done
  function seq(TW, steps, done) {
    let i = 0;
    const next = () => { if (i >= steps.length) { done && done(); return; } const [d, f] = steps[i++]; if (reduce) { f(1); next(); } else TW.add(d, f, next); };
    next();
  }
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function white(S) { const [fx, fy, fw, fh] = S.full(); S.ctx.fillStyle = '#fff'; S.ctx.fillRect(fx, fy, fw, fh); }
  function desk(S, y) {
    const ctx = S.ctx, [fx, , fw, fh] = S.full();
    const g = ctx.createLinearGradient(0, y, 0, y + 80);
    g.addColorStop(0, '#eef2f6'); g.addColorStop(1, '#f8fafc');
    ctx.fillStyle = g; ctx.fillRect(fx, y, fw, fh);
    ctx.fillStyle = '#d9e1e9'; ctx.fillRect(fx, y, fw, 1.2);
  }
  function contact(ctx, x, y, w, a = 0.18) {
    const g = ctx.createRadialGradient(x, y, 1, x, y, w / 2);
    g.addColorStop(0, `rgba(20,38,59,${a})`); g.addColorStop(1, 'rgba(20,38,59,0)');
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.16); ctx.translate(-x, -y);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, w / 2, 0, TAU); ctx.fill(); ctx.restore();
  }
  // 비커(앞에서 본 모습): 뒤쪽 면
  function glassBack(ctx, x0, y0, x1, y1, r) {
    ctx.save(); rr(ctx, x0, y0, x1 - x0, y1 - y0, r); ctx.fillStyle = 'rgba(236,242,247,.55)'; ctx.fill(); ctx.restore();
  }
  // 비커: 앞쪽 반사·테두리·주둥이·눈금
  function glassFront(ctx, x0, y0, x1, y1, r, base = 16, marks = true) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x0 - 6, y0 - 3); ctx.quadraticCurveTo(x0, y0 - 1, x0, y0 + 8); ctx.lineTo(x0, y1 - r); ctx.quadraticCurveTo(x0, y1, x0 + r, y1);
    ctx.lineTo(x1 - r, y1); ctx.quadraticCurveTo(x1, y1, x1, y1 - r); ctx.lineTo(x1, y0 + 6); ctx.quadraticCurveTo(x1, y0, x1 + 4, y0 - 1);
    ctx.strokeStyle = 'rgba(120,140,160,.6)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(120,140,160,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse((x0 + x1) / 2, y0, (x1 - x0) / 2, 4, 0, Math.PI, TAU); ctx.stroke();
    let g = ctx.createLinearGradient(x0, 0, x0 + 40, 0); g.addColorStop(0, 'rgba(255,255,255,.0)'); g.addColorStop(0.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x0 + 8, y0 + 14, 30, y1 - y0 - base - 20);
    g = ctx.createLinearGradient(x1 - 26, 0, x1 - 4, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.45)');
    ctx.fillStyle = g; ctx.fillRect(x1 - 24, y0 + 14, 18, y1 - y0 - base - 20);
    g = ctx.createLinearGradient(0, y1 - base, 0, y1); g.addColorStop(0, 'rgba(210,222,233,.55)'); g.addColorStop(1, 'rgba(180,196,210,.75)');
    ctx.fillStyle = g; rr(ctx, x0 + 1, y1 - base, x1 - x0 - 2, base - 1, Math.min(r, 10)); ctx.fill();
    if (marks) {
      ctx.strokeStyle = 'rgba(70,90,110,.35)'; ctx.lineWidth = 1;
      const h = y1 - base - y0 - 30;
      for (let i = 1; i <= 5; i++) { const y = y1 - base - i * h / 6; ctx.beginPath(); ctx.moveTo(x0 + 14, y); ctx.lineTo(x0 + (i % 2 ? 26 : 34), y); ctx.stroke(); }
    }
    ctx.restore();
  }
  function liquid(ctx, x0, x1, top, bottom, c0, c1) {
    const g = ctx.createLinearGradient(0, top, 0, bottom); g.addColorStop(0, c0); g.addColorStop(1, c1);
    ctx.fillStyle = g; ctx.fillRect(x0, top, x1 - x0, bottom - top);
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x1, top); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,140,190,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, top + 2.5); ctx.lineTo(x1, top + 2.5); ctx.stroke();
  }
  const WATER = ['rgba(204,226,245,.55)', 'rgba(172,206,236,.68)'];

  /* ---- 결정 알갱이 ---- */
  const SHAPES = (() => { const r = rng(7), out = []; for (let i = 0; i < 12; i++) { const n = 5 + Math.floor(r() * 3), pts = []; for (let j = 0; j < n; j++) { const a = j / n * TAU + (r() - 0.5) * 0.6, d = 0.7 + r() * 0.45; pts.push([Math.cos(a) * d, Math.sin(a) * d * (0.75 + r() * 0.3)]); } out.push(pts); } return out; })();
  function grainDraw(ctx, g, fill = '#fbfdff', line = 'rgba(105,125,148,.6)') {
    const r = g.r * (g.s == null ? 1 : g.s); if (r < 0.25) return;
    const pts = SHAPES[g.sh];
    ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.rot); ctx.globalAlpha = g.a == null ? 1 : g.a;
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * r, y * r) : ctx.moveTo(x * r, y * r))); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = Math.max(0.6, r * 0.22); ctx.stroke();
    if (r > 2.4) { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.25, r * 0.22, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  /* 바닥에 쌓이는 알갱이 무더기. base(x)는 그 자리 바닥 높이(y). */
  function pile(x0, x1, base, o = {}) {
    const bw = o.bw || 6, nb = Math.max(1, Math.floor((x1 - x0) / bw)), stacks = Array.from({ length: nb }, () => []), hgt = new Float32Array(nb);
    const list = [];
    const binOf = (x) => clamp(Math.floor((x - x0) / bw), 0, nb - 1);
    const vt = o.vt || 90, g0 = o.g || 900;
    function add(x, y, r, vx = 0, vy = 0, extra = {}) {
      const gr = Object.assign({ x, y, r, vx, vy, rot: Math.random() * TAU, sh: Math.floor(Math.random() * SHAPES.length), st: 'fall', s: 1, a: 1, wet: false }, extra);
      list.push(gr); return gr;
    }
    function land(gr) {
      let b = binOf(gr.x);
      for (let k = 0; k < 6; k++) { // 옆 칸이 많이 낮으면 굴러 내려감
        const l = b > 0 ? hgt[b - 1] : 1e9, rgt = b < nb - 1 ? hgt[b + 1] : 1e9, h = hgt[b];
        if (l < h - bw * 0.9 && l <= rgt) b--; else if (rgt < h - bw * 0.9) b++; else break;
      }
      gr.b = b; gr.x = clamp(x0 + (b + 0.5) * bw + (Math.random() - 0.5) * bw * 0.6, x0 + gr.r, x1 - gr.r);
      gr.y = base(gr.x) - hgt[b] - gr.r * 0.8; gr.st = 'rest'; gr.vx = gr.vy = 0;
      gr.c = gr.r * 1.25; hgt[b] += gr.c; stacks[b].push(gr);
    }
    function step(dt, surf, slow = 1) {
      list.forEach((gr) => {
        if (gr.st === 'fall') {
          const wet = gr.y > surf;
          if (wet && !gr.wet) { gr.wet = true; gr.vy *= 0.3; gr.vx *= 0.3; o.onSplash && o.onSplash(gr); }
          if (wet) { const v = (gr.vt || vt) * slow; gr.vy += (v - gr.vy) * Math.min(1, 5 * dt); gr.vx *= Math.exp(-3 * dt); gr.vx += gauss() * 30 * dt; gr.rot += dt * 1.5; }
          else gr.vy += g0 * dt;
          if (gr.s < 1) gr.s = Math.min(1, gr.s + dt / 1.2);
          gr.x = clamp(gr.x + gr.vx * dt, x0 + gr.r, x1 - gr.r); gr.y += gr.vy * dt;
          const b = binOf(gr.x); if (gr.y + gr.r * 0.8 >= base(gr.x) - hgt[b]) land(gr);
        } else if (gr.st === 'melt') {
          gr.s -= dt / (gr.mt || 0.8); if (gr.s <= 0) gr.dead = true;
        } else if (gr.st === 'grow') {
          gr.s = Math.min(1, gr.s + dt / 1.1); gr.a = Math.min(1, gr.a + dt * 1.5); if (gr.s >= 0.6) gr.st = 'fall';
        }
      });
      for (let i = list.length - 1; i >= 0; i--) if (list[i].dead) list.splice(i, 1);
    }
    // 맨 위 알갱이부터 녹이기
    function melt(n, mt) {
      for (let k = 0; k < n; k++) {
        let best = -1, bh = -1; for (let b = 0; b < nb; b++) if (stacks[b].length && hgt[b] > bh) { bh = hgt[b]; best = b; }
        if (best < 0) { const f = list.find((g) => g.st === 'fall' || g.st === 'grow'); if (!f) return; f.st = 'melt'; f.mt = mt; continue; }
        const gr = stacks[best].pop(); hgt[best] -= gr.c; gr.st = 'melt'; gr.mt = mt;
      }
    }
    return { list, add, step, melt, hgt, get live() { return list.filter((g) => g.st !== 'melt').length; }, get falling() { return list.some((g) => g.st === 'fall' || g.st === 'grow'); },
      clear() { list.length = 0; stacks.forEach((s) => (s.length = 0)); hgt.fill(0); } };
  }

  /* ---- 입자 그림(미리 그려 둔 조각) ---- */
  function sprite(rx, ry, c0, c1, c2) {
    const s = 3, w = Math.ceil(rx * 2 + 6), h = Math.ceil(ry * 2 + 6), cv = document.createElement('canvas'); cv.width = w * s; cv.height = h * s;
    const c = cv.getContext('2d'); c.scale(s, s); c.translate(w / 2, h / 2);
    c.save(); c.scale(1, ry / rx);
    const g = c.createRadialGradient(-rx * 0.35, -rx * 0.4, rx * 0.1, 0, 0, rx); g.addColorStop(0, c0); g.addColorStop(0.6, c1); g.addColorStop(1, c2);
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
    c.strokeStyle = 'rgba(20,38,59,.18)'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.stroke();
    return { cv, w, h };
  }
  const SPR = {};
  const spr = (k) => SPR[k] || (SPR[k] = k === 'sv' ? sprite(10, 10, '#a9cdf0', '#4f8fd2', '#2a62a6') : sprite(13, 8.5, '#fff3c4', '#f0d26a', '#c9a432'));
  function drawSpr(ctx, sp, x, y, rot = 0) { ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.drawImage(sp.cv, -sp.w / 2, -sp.h / 2, sp.w, sp.h); ctx.restore(); }

  /* =================================================================
     1. 입자 모형으로 본 용해 과정 (그림 Ⅰ-4)
     ================================================================= */
  function dissolve(host, o = {}) {
    const W = 1000, H = 560, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx;
    const TY = 492, BX0 = 60, BX1 = 360, BTOP = 150, WY = 224, CUBE = { x: 210, s: 66 };
    const L = { x: 690, y: 282, r: 228 };
    const st = { t: 0, play: false, pt: 0, f: 1, done: false, wait: 0 };
    let sv = [], su = [], spots = [];
    function init() {
      st.play = false; st.pt = 0; st.f = 1; st.done = false; st.wait = 0;
      su = []; sv = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) su.push({ x: L.x + (c - 2.5) * 30 + (r % 2 ? 6 : -6) * 0, y: L.y + L.r - 46 - r * 19, rot: 0, free: false, shell: [], hx: 0, hy: 0, vx: 0, vy: 0, rel: 0 });
      su.forEach((s) => { s.hx = s.x; s.hy = s.y; });
      const R = L.r - 16; let tries = 0;
      while (sv.length < 104 && tries++ < 20000) {
        const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * R, x = L.x + Math.cos(a) * d, y = L.y + Math.sin(a) * d;
        if (x > L.x - 104 && x < L.x + 104 && y > L.y + L.r - 112) continue;
        if (sv.some((p) => (p.x - x) ** 2 + (p.y - y) ** 2 < 23 * 23)) continue;
        sv.push({ x, y, vx: 0, vy: 0, own: null, k: 0 });
      }
      // 퍼질 자리: 해바라기 배치
      spots = su.map((_, i) => { const rr2 = (L.r - 48) * Math.sqrt((i + 0.6) / su.length), a = i * 2.39996 + 0.4; return [L.x + Math.cos(a) * rr2, L.y + Math.sin(a) * rr2]; }).sort(() => Math.random() - 0.5);
      // 풀려나는 순서: 위층부터, 가장자리부터
      const ord = su.slice().sort((a, b) => (a.hy - b.hy) || (Math.abs(b.hx - L.x) - Math.abs(a.hx - L.x)));
      ord.forEach((s, i) => { s.rel = 0.6 + i * 0.42 + Math.random() * 0.18; s.spot = spots[i]; });
    }
    init();
    function play() { if (st.play && !st.done) return; init(); st.play = true; if (reduce) { st.pt = 99; } }
    function release(s) {
      s.free = true; s.vx = (Math.random() - 0.5) * 40; s.vy = -50; s.spin = Math.random() * TAU;
      const free = sv.filter((p) => !p.own).sort((a, b) => ((a.x - s.x) ** 2 + (a.y - s.y) ** 2) - ((b.x - s.x) ** 2 + (b.y - s.y) ** 2)).slice(0, 4);
      free.forEach((p, k) => { p.own = s; p.k = k; }); s.shell = free;
    }
    function physics(dt) {
      const R = L.r - 17;
      sv.forEach((p) => {
        if (p.own) { const s = p.own, a = s.spin + p.k * TAU / 4, tx = s.x + Math.cos(a) * 22, ty = s.y + Math.sin(a) * 19; p.x += (tx - p.x) * Math.min(1, 6 * dt); p.y += (ty - p.y) * Math.min(1, 6 * dt); return; }
        p.vx += gauss() * 260 * dt; p.vy += gauss() * 260 * dt; p.vx *= Math.exp(-2.4 * dt); p.vy *= Math.exp(-2.4 * dt);
        p.x += p.vx * dt; p.y += p.vy * dt;
      });
      su.forEach((s) => {
        if (!s.free) { s.x = s.hx + Math.sin(st.t * 23 + s.hx) * 0.5; s.y = s.hy + Math.cos(st.t * 19 + s.hy) * 0.5; return; }
        s.vx += (gauss() * 90 + (s.spot[0] - s.x) * 3.2) * dt; s.vy += (gauss() * 90 + (s.spot[1] - s.y) * 3.2) * dt;
        s.vx *= Math.exp(-1.8 * dt); s.vy *= Math.exp(-1.8 * dt); s.x += s.vx * dt; s.y += s.vy * dt; s.spin += dt * 0.6; s.rot = Math.sin(s.spin) * 0.5;
      });
      // 겹침 풀기
      const all = sv.map((p) => ({ o: p, r: 10, fix: false })).concat(su.map((s) => ({ o: s, r: s.free ? 30 : 13, fix: !s.free, grp: s })));
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        const A = all[i], B = all[j];
        if ((A.o.own && A.o.own === B.grp) || (B.o.own && B.o.own === A.grp) || (A.o.own && A.o.own === B.o.own)) continue;
        const ra = A.o.own ? 10 : A.r, rb = B.o.own ? 10 : B.r;
        if (A.grp && A.grp.free && B.o.own) continue; // 다른 무리의 껍질과는 무리끼리 밀어냄
        const dx = B.o.x - A.o.x, dy = B.o.y - A.o.y, d2 = dx * dx + dy * dy, md = ra + rb + 1.5;
        if (d2 >= md * md || d2 < 1e-6) continue;
        const d = Math.sqrt(d2), push = (md - d), nx = dx / d, ny = dy / d;
        const ma = A.fix || A.o.own ? 0 : 1, mb = B.fix || B.o.own ? 0 : 1; if (!ma && !mb) continue;
        const ka = ma / (ma + mb), kb = mb / (ma + mb);
        A.o.x -= nx * push * ka; A.o.y -= ny * push * ka; B.o.x += nx * push * kb; B.o.y += ny * push * kb;
      }
      const keep = (p, rad) => { const dx = p.x - L.x, dy = p.y - L.y, d = Math.hypot(dx, dy); if (d > R - rad + 10) { p.x = L.x + dx / d * (R - rad + 10); p.y = L.y + dy / d * (R - rad + 10); if (p.vx != null) { p.vx *= -0.5; p.vy *= -0.5; } } };
      sv.forEach((p) => { if (!p.own) keep(p, 10); }); su.forEach((s) => s.free && keep(s, 32));
    }
    function beaker() {
      contact(ctx, (BX0 + BX1) / 2, TY + 2, 340, 0.16);
      glassBack(ctx, BX0, BTOP, BX1, TY, 14);
      liquid(ctx, BX0 + 3, BX1 - 3, WY, TY - 16, ...WATER);
      // 각설탕
      const s = CUBE.s * Math.cbrt(Math.max(0.001, st.f)), x = CUBE.x, yb = TY - 16;
      if (st.f > 0.01) {
        const dx = s * 0.3, dy = -s * 0.2, x0 = x - s / 2;
        ctx.fillStyle = '#e9edf1'; ctx.beginPath(); ctx.moveTo(x0 + s, yb - s); ctx.lineTo(x0 + s + dx, yb - s + dy); ctx.lineTo(x0 + s + dx, yb + dy); ctx.lineTo(x0 + s, yb); ctx.fill();
        ctx.fillStyle = '#fbfcfd'; ctx.beginPath(); ctx.moveTo(x0, yb - s); ctx.lineTo(x0 + dx, yb - s + dy); ctx.lineTo(x0 + s + dx, yb - s + dy); ctx.lineTo(x0 + s, yb - s); ctx.fill();
        ctx.fillStyle = '#f4f6f8'; ctx.fillRect(x0, yb - s, s, s);
        const r = rng(3); ctx.fillStyle = 'rgba(150,165,180,.28)'; for (let i = 0; i < s * 2.2; i++) ctx.fillRect(x0 + r() * s, yb - s + r() * s, 1.6, 1.6);
        ctx.strokeStyle = 'rgba(110,128,146,.4)'; ctx.lineWidth = 1; ctx.strokeRect(x0, yb - s, s, s);
        // 녹아 나오는 물결무늬
        if (st.play && !st.done) {
          ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.4;
          for (let i = 0; i < 5; i++) { const ph = st.t * 1.4 + i * 1.3, len = 60 + (i % 3) * 30; ctx.globalAlpha = 0.5 + 0.3 * Math.sin(ph); ctx.beginPath(); for (let k = 0; k <= len; k += 6) { const yy = yb - s - 4 - k, xx = x - s / 2 + (i + 0.5) * s / 5 + Math.sin(k * 0.08 + ph * 2) * 5 * (k / len); k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); }
          ctx.restore();
        }
      }
      ctx.fillStyle = 'rgba(160,200,236,.22)'; ctx.fillRect(BX0 + 3, WY, BX1 - BX0 - 6, TY - 16 - WY);
      glassFront(ctx, BX0, BTOP, BX1, TY, 14);
      ov.put('wl', BX0 + 28, WY + 34, st.done ? '설탕물(용액)' : '물', 'tx nm ra');
      if (st.f > 0.25) ov.put('cl', x + CUBE.s * 0.5 + 18, yb - CUBE.s * 0.45, '각설탕', 'tx nm sol ra'); else ov.hide('cl');
      // 확대 범위 → 원
      ctx.strokeStyle = 'rgba(20,38,59,.22)'; ctx.lineWidth = 1;
      const bx0 = x - 44, bx1 = x + 52, by0 = yb - 92, by1 = yb - 2;
      rr(ctx, bx0, by0, bx1 - bx0, by1 - by0, 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx1, by0); ctx.lineTo(L.x - L.r * 0.62, L.y - L.r * 0.78); ctx.moveTo(bx1, by1); ctx.lineTo(L.x - L.r * 0.5, L.y + L.r * 0.86); ctx.stroke();
    }
    function lens() {
      ctx.save(); ctx.shadowColor = 'rgba(20,38,59,.18)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 5;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(L.x, L.y, L.r, 0, TAU); ctx.fill(); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.arc(L.x, L.y, L.r - 2, 0, TAU); ctx.clip();
      const g = ctx.createRadialGradient(L.x - 60, L.y - 80, 20, L.x, L.y, L.r); g.addColorStop(0, '#f4f9fd'); g.addColorStop(1, '#e2eef8');
      ctx.fillStyle = g; ctx.fillRect(L.x - L.r, L.y - L.r, 2 * L.r, 2 * L.r);
      const a = spr('sv'), b = spr('su');
      sv.forEach((p) => drawSpr(ctx, a, p.x, p.y));
      su.forEach((s) => drawSpr(ctx, b, s.x, s.y, s.rot));
      ctx.restore();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(L.x, L.y, L.r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(20,38,59,.22)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(L.x, L.y, L.r + 2, 0, TAU); ctx.stroke();
    }
    ov.put('lg', BX0, 64, '<i class="pd sv"></i>용매 입자<br><i class="pd su"></i>용질 입자', 'tx key ra');
    addLoop(host, (dt) => {
      st.t += dt;
      if (st.play) {
        st.pt += dt;
        su.forEach((s) => { if (!s.free && st.pt >= s.rel) release(s); });
        const n = su.filter((s) => s.free).length; st.f += ((1 - n / su.length) - st.f) * Math.min(1, 3 * dt);
        if (n === su.length && !st.done && st.pt > su[0].rel + 0.1) { const last2 = Math.max(...su.map((s) => s.rel)); if (st.pt > last2 + 2.2) { st.done = true; o.onDone && o.onDone(); } }
        if (st.done && o.demo) { st.wait += dt; if (st.wait > 4) play(); }
      } else if (o.demo) { st.wait += dt; if (st.wait > 1.2) play(); }
      physics(dt);
      if (reduce && st.play) for (let i = 0; i < 40; i++) physics(0.05);
      S.begin(); white(S); desk(S, TY);
      beaker(); lens();
      const n = su.filter((s) => s.free).length;
      const cap = !st.play || n === 0 ? '각설탕(용질)을 물(용매)에 넣었어요' : st.done ? '용질 입자가 용매 입자 사이에 <b>고르게 섞였어요</b>' : '용질 입자가 하나씩 떨어져 <b>용매 입자 사이로</b> 퍼져요';
      ov.put('cap', L.x, L.y + L.r + 30, cap, 'tx cap');
    });
    if (o.done) { init(); su.forEach((s) => { release(s); s.x = s.spot[0]; s.y = s.spot[1]; }); for (let i = 0; i < 60; i++) physics(0.03); st.f = 0; st.play = true; st.done = true; st.pt = 99; }
    return { play, reset() { init(); }, get done() { return st.done; }, get busy() { return st.play && !st.done; } };
  }

  /* =================================================================
     2. 포화 용액과 불포화 용액 (그림 Ⅰ-5)
     ================================================================= */
  function spoon(ctx, x, y, a) { // 약숟가락: (x,y) 오목한 끝, a 기울기
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    let g = ctx.createLinearGradient(0, -6, 0, 6); g.addColorStop(0, '#e8ecf0'); g.addColorStop(1, '#9aa6b2');
    ctx.fillStyle = g; rr(ctx, 14, -3, 150, 6, 3); ctx.fill();
    g = ctx.createRadialGradient(-4, -4, 2, 0, 0, 20); g.addColorStop(0, '#f6f8fa'); g.addColorStop(1, '#a5b0bb');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 20, 11, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(20,38,59,.3)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
  function satur(host) {
    const W = 1000, H = 520, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx, TW = tweens();
    const TY = 452, TOP = 160, WY = 238, HW = 140;
    const BK = [{ cx: 260, sat: true, name: '포화 용액', res: '가라앉음' }, { cx: 740, sat: false, name: '불포화 용액', res: '더 녹음' }];
    const st = { t: 0, done: false, run: false };
    BK.forEach((b) => {
      b.x0 = b.cx - HW; b.x1 = b.cx + HW;
      b.P = pile(b.x0 + 6, b.x1 - 6, () => TY - 17, { bw: 7, vt: 70, onSplash: (gr) => b.rip.push({ x: gr.x, t: 0 }) });
      b.rip = []; b.sp = { x: b.cx + 330, y: -40, a: 0.2, on: false };
    });
    function run(done) {
      if (st.run) return; st.run = true;
      BK.forEach((b) => {
        b.sp.on = true; const sp = b.sp, x1 = b.cx + 14, y1 = 112;
        seq(TW, [
          [0.9, (k) => { const e = ease(k); sp.x = lerp(b.cx + 330, x1, e); sp.y = lerp(-40, y1, e); }],
          [0.5, (k) => { sp.a = lerp(0.2, -0.75, ease(k)); }],
          [1.0, (k) => { const n = Math.floor(k * 46); while ((b.em || 0) < n) { b.em = (b.em || 0) + 1; b.P.add(sp.x - 16 + Math.random() * 12, sp.y + 4, 3.6 + Math.random() * 2.6, -24 + Math.random() * 36, 30 + Math.random() * 60); } }],
          [0.4, () => {}],
          [0.8, (k) => { const e = ease(k); sp.a = lerp(-0.75, 0.2, e); sp.x = lerp(x1, b.cx + 330, e); sp.y = lerp(y1, -40, e); }],
        ], () => { sp.on = false; });
      });
      setTimeout(() => { st.done = true; done && done(); }, reduce ? 10 : 5200);
    }
    function reset() { TW.clear(); BK.forEach((b) => { b.P.clear(); b.em = 0; b.rip = []; b.sp.on = false; }); st.run = false; st.done = false; }
    addLoop(host, (dt) => {
      st.t += dt; TW.step(dt);
      BK.forEach((b) => {
        b.P.step(dt, WY);
        if (!b.sat) b.P.list.forEach((g) => { if (g.wet && g.st !== 'melt') { g.life = (g.life || 0) + dt; if (g.life > 0.5 + (g.sh % 5) * 0.12) { g.st = 'melt'; g.mt = 1.1; } } });
        b.rip = b.rip.filter((r) => (r.t += dt) < 0.9);
      });
      S.begin(); white(S); desk(S, TY);
      BK.forEach((b) => {
        contact(ctx, b.cx, TY + 2, 330, 0.16);
        glassBack(ctx, b.x0, TOP, b.x1, TY, 14);
        liquid(ctx, b.x0 + 3, b.x1 - 3, WY, TY - 16, 'rgba(198,226,240,.6)', 'rgba(160,206,226,.72)');
        b.P.list.forEach((g) => grainDraw(ctx, g));
        // 녹을 때 아른거림
        b.P.list.forEach((g) => { if (g.st === 'melt') { ctx.strokeStyle = `rgba(255,255,255,${0.6 * g.s})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(g.x, g.y - 3); ctx.quadraticCurveTo(g.x + 4, g.y - 10, g.x - 1, g.y - 18 * (1.2 - g.s)); ctx.stroke(); } });
        b.rip.forEach((r) => { const k = r.t / 0.9; ctx.strokeStyle = `rgba(14,99,179,${0.3 * (1 - k)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(r.x, WY + 1, 6 + k * 18, 2 + k * 2, 0, 0, TAU); ctx.stroke(); });
        glassFront(ctx, b.x0, TOP, b.x1, TY, 14);
        if (b.sp.on) spoon(ctx, b.sp.x, b.sp.y, b.sp.a);
        ov.put('n' + b.cx, b.cx, TY + 26, b.name, 'tx big');
        if (st.done) ov.put('r' + b.cx, b.cx, TY + 54, `용질 더 넣음 → <b>${b.res}</b>`, 'tx cap'); else ov.hide('r' + b.cx);
      });
    });
    return { run, reset, get busy() { return st.run && !st.done; } };
  }

  /* =================================================================
     3. 용해도 곡선 (그림 Ⅰ-6)
     ================================================================= */
  function curve(host, o = {}) {
    const W = o.W || 1000, H = o.H || 640, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx, TW = tweens();
    const X0 = 118, X1 = W - 50, Y0 = H - 74, Y1 = 46, GM = 180;
    const xT = (T) => X0 + (X1 - X0) * T / 100, yG = (g) => Y0 - (Y0 - Y1) * g / GM;
    const st = { sel: o.sel || null, T: o.T == null ? null : o.T, Tv: o.T == null ? 50 : o.T, draw: {}, pt: o.pt || null, ptv: null };
    ORDER.forEach((id) => (st.draw[id] = reduce ? 1 : 0));
    ORDER.forEach((id, i) => { if (!reduce) TW.add(0.9 + i * 0.12, (k) => (st.draw[id] = eOut(k))); });
    function set(p) {
      if (p.sel !== undefined && p.sel !== st.sel) { st.sel = p.sel; if (st.sel && !reduce) { st.draw[st.sel] = 0; TW.add(0.8, (k) => (st.draw[p.sel] = eOut(k))); } }
      if (p.T !== undefined) { st.T = p.T; if (p.T != null) { const a = st.Tv; if (reduce) st.Tv = p.T; else TW.add(0.35, (k) => (st.Tv = lerp(a, p.T, eOut(k)))); } }
      if (p.pt !== undefined) st.pt = p.pt;
    }
    if (o.onT) {
      let drag = false;
      const at = (e) => { const [x] = S.toLocal(e); let T = clamp((x - X0) / (X1 - X0) * 100, 0, 100); T = Math.round(T / (o.step || 1)) * (o.step || 1); if (T !== st.T) { st.T = T; st.Tv = T; o.onT(T); } };
      host.addEventListener('pointerdown', (e) => { drag = true; host.setPointerCapture && host.setPointerCapture(e.pointerId); at(e); });
      host.addEventListener('pointermove', (e) => drag && at(e));
      ['pointerup', 'pointercancel'].forEach((n) => host.addEventListener(n, () => (drag = false)));
      host.style.touchAction = 'none'; host.style.cursor = 'pointer';
    }
    for (let T = 0; T <= 100; T += 20) ov.put('xt' + T, xT(T), Y0 + 22, String(T), 'tk2');
    for (let g = 0; g <= GM; g += 20) ov.put('yt' + g, X0 - 12, yG(g), String(g), 'tk2 la');
    ov.put('yl', X0 - 4, Y1 - 26, '용해도(g/물 100 g)', 'tx m ra');
    ov.put('xl', X1, Y0 + 50, '온도(℃)', 'tx m la');
    function path(id, upto) {
      ctx.beginPath(); let first = true;
      for (let T = 0; T <= 100 * upto + 0.001; T += 1) { const x = xT(T), y = yG(solu(id, T)); first ? ctx.moveTo(x, y) : ctx.lineTo(x, y); first = false; }
    }
    addLoop(host, (dt) => {
      TW.step(dt);
      S.begin(); white(S);
      // 모눈
      ctx.fillStyle = '#fbfcfe'; ctx.fillRect(X0, Y1, X1 - X0, Y0 - Y1);
      ctx.lineWidth = 1;
      for (let T = 0; T <= 100; T += 10) { ctx.strokeStyle = T % 20 ? '#eef2f6' : '#e1e8ef'; ctx.beginPath(); ctx.moveTo(xT(T), Y1); ctx.lineTo(xT(T), Y0); ctx.stroke(); }
      for (let g = 0; g <= GM; g += 10) { ctx.strokeStyle = g % 20 ? '#eef2f6' : '#e1e8ef'; ctx.beginPath(); ctx.moveTo(X0, yG(g)); ctx.lineTo(X1, yG(g)); ctx.stroke(); }
      ctx.strokeStyle = '#8b9aab'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(X0, Y1 - 6); ctx.lineTo(X0, Y0); ctx.lineTo(X1 + 6, Y0); ctx.stroke();
      // 곡선
      ctx.save(); ctx.beginPath(); ctx.rect(X0, Y1 - 2, X1 - X0 + 2, Y0 - Y1 + 4); ctx.clip();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ORDER.forEach((id) => {
        if (id === st.sel) return;
        path(id, st.draw[id]); ctx.strokeStyle = st.sel ? '#c3ccd6' : '#6f8194'; ctx.lineWidth = st.sel ? 2 : 2.6; ctx.stroke();
      });
      if (st.sel) {
        path(st.sel, st.draw[st.sel]); ctx.strokeStyle = 'rgba(14,99,179,.16)'; ctx.lineWidth = 12; ctx.stroke();
        ctx.strokeStyle = BLUE; ctx.lineWidth = 4; ctx.stroke();
      }
      ctx.restore();
      // 곡선 이름
      ORDER.forEach((id) => {
        const [T, pos] = DATA[id].lab, g = solu(id, T), x = xT(T), y = yG(g);
        const dx = pos === 'left' ? -16 : 0, dy = pos === 'up' ? -18 : pos === 'up2' ? -16 : 0;
        ov.put('cl' + id, x + dx, y + dy, DATA[id].name, 'tx cn' + (pos === 'left' ? ' la' : '') + (st.sel === id ? ' on' : st.sel ? ' dim' : ''));
      });
      // 온도 눈금선
      if (st.T != null && st.sel) {
        const T = st.Tv, g = solu(st.sel, T), x = xT(T), y = yG(Math.min(g, GM)), inG = g <= GM;
        ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(14,99,179,.7)'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(x, Y0); ctx.lineTo(x, y); if (inG) ctx.lineTo(X0, y); ctx.stroke(); ctx.setLineDash([]);
        if (inG) { ctx.fillStyle = '#fff'; ctx.strokeStyle = BLUE; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill(); ctx.stroke(); }
        const below = st.pt && st.pt.g > g;
        ov.put('rd', x + (T > 70 ? -16 : 16), inG ? y + (below ? 22 : -22) : Y1 + 16, `${Math.round(T)} ℃ · ${label(st.sel, Math.round(T))}${inG ? '' : ' (그래프 위쪽)'}`, 'tx read' + (T > 70 ? ' la' : ' ra'));
        ov.put('tT', x, Y0 + 22, `<b>${Math.round(T)}</b>`, 'tx tT');
      } else { ov.hide('rd'); ov.hide('tT'); }
      // 넣은 양 점
      if (st.pt && st.sel) {
        const p = st.pt, x = xT(p.T), y = yG(Math.min(p.g, GM)), s = solu(st.sel, p.T), ys = yG(Math.min(s, GM));
        ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.setLineDash(p.g > s ? [] : [3, 4]);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, ys); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        const lx = p.T > 60 ? x - 16 : x + 16, cls = p.T > 60 ? ' la' : ' ra';
        ov.put('pt', lx, y + (p.g > s ? -4 : 6), `넣은 양 ${p.g} g`, 'tx pv' + cls);
        if (Math.abs(ys - y) > 70) ov.put('pd', lx, (y + ys) / 2, p.g > s ? `녹지 않고 남는 양 약 ${Math.round(p.g - s)} g` : `더 녹일 수 있는 양 약 ${Math.round(s - p.g)} g`, 'tx pdd' + cls); else ov.hide('pd');
      } else { ov.hide('pt'); ov.hide('pd'); }
    });
    return { set, get st() { return st; } };
  }

  /* ---- 시험관(제 좌표: 입구 가운데가 (0,0), 바닥 끝이 (0,L)) ---- */
  function tubeBase(L, IR) { return (x) => { const dx = Math.min(Math.abs(x), IR - 0.5); return L - 3 - (IR - Math.sqrt(IR * IR - dx * dx)); }; }
  function tubeShape(ctx, L, R) { ctx.beginPath(); ctx.moveTo(-R, 0); ctx.lineTo(-R, L - R); ctx.arc(0, L - R, R, Math.PI, 0, true); ctx.lineTo(R, 0); }
  function tubeBack(ctx, L, R) { tubeShape(ctx, L, R); ctx.fillStyle = 'rgba(236,242,247,.5)'; ctx.fill(); }
  function tubeLiquid(ctx, L, R, top, c0, c1) {
    ctx.save(); tubeShape(ctx, L, R - 3); ctx.clip();
    const g = ctx.createLinearGradient(0, top, 0, L); g.addColorStop(0, c0); g.addColorStop(1, c1);
    ctx.fillStyle = g; ctx.fillRect(-R, top, 2 * R, L - top + 2);
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-R, top); ctx.lineTo(R, top); ctx.stroke();
    ctx.strokeStyle = 'rgba(80,130,180,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-R, top + 2.5); ctx.quadraticCurveTo(0, top + 5, R, top + 2.5); ctx.stroke();
    ctx.restore();
  }
  function tubeFront(ctx, L, R) {
    tubeShape(ctx, L, R); ctx.strokeStyle = 'rgba(115,135,155,.65)'; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.strokeStyle = 'rgba(115,135,155,.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, 0, R + 2, 3, 0, 0, TAU); ctx.stroke();
    const g = ctx.createLinearGradient(-R, 0, -R + 14, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(-R + 3, 10, 11, L - R - 16);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(R - 8, 14, 4, L - R - 24);
  }

  return { DATA, ORDER, solu, label, dissolve, satur, curve,
    _: { surface, overlay, addLoop, tweens, seq, rng, rr, white, desk, contact, glassBack, glassFront, liquid, WATER, grainDraw, pile, spoon, tubeBase, tubeShape, tubeBack, tubeLiquid, tubeFront, clamp, lerp, ease, eOut, gauss, TAU, BLUE, INK, reduce } };
})();
