/* ===== 용해도 차를 이용한 분리 그림 도구 (캔버스 2D) =====
   SS.lab(host)    해 보기 '순수한 붕산 분리하기': 뜨거운 물 100 g에 혼합물 넣고 젓기 → 얼음물에 넣기 → 거름 장치로 거르기
   SS.curve(host)  그림 Ⅰ-12 형식 용해도 곡선(황산 구리(Ⅱ)·붕산) + 물 100 g 비커: 온도를 바꾸면 석출되는 양을 보여 줌
   SS.solu(id, T)  용해도(g/물 100 g). 그림 Ⅰ-12의 네 값(70 ℃·10 ℃)은 정확히, 나머지는 용해도 수업(그림 Ⅰ-6)에서 읽은 값으로 이은 곡선
   그림 원칙: 흰 바탕, 라스 파랑 한 색조 + 무채색(황산 구리(Ⅱ) 용액은 옅은 파랑, 붕산은 흰색), 매트한 질감, 얇은 선. 그림 속 글씨는 HTML 이름표.
   녹는 빠르기, 식는 빠르기, 결정 알갱이 수, 거르는 빠르기는 보기 좋게 정한 모형. */
window.SS = (() => {
  const TAU = Math.PI * 2;
  const BLUE = '#0e63b3';
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const eOut = (k) => 1 - Math.pow(1 - k, 3);
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const mixC = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const WATER = [214, 232, 246], CUSO = [86, 168, 224], ICE = [236, 245, 252];

  /* ---- 용해도 자료 (g/물 100 g, 0~80 ℃, 10 ℃ 간격) ---- */
  const DATA = {
    c: { name: '황산 구리(Ⅱ)', t: [14, 16.8, 20, 24, 29, 34, 40, 47.9, 55] },
    b: { name: '붕산', t: [2.7, 3.7, 5.0, 6.6, 8.7, 11.5, 14.8, 18.9, 23.6] },
  };
  const EXACT = { 'c@70': 47.9, 'c@10': 16.8, 'b@70': 18.9, 'b@10': 3.7 };
  function solu(id, T) {
    const y = DATA[id].t, n = y.length - 1; T = clamp(T, 0, 80);
    const i = Math.min(n - 1, Math.floor(T / 10)), u = (T - i * 10) / 10;
    const d = (j) => (y[j + 1] - y[j]) / 10;
    const m = (j) => (j === 0 ? d(0) : j === n ? d(n - 1) : (d(j - 1) + d(j)) / 2);
    const h00 = 2 * u * u * u - 3 * u * u + 1, h10 = u * u * u - 2 * u * u + u, h01 = -2 * u * u * u + 3 * u * u, h11 = u * u * u - u * u;
    return h00 * y[i] + h10 * 10 * m(i) + h01 * y[i + 1] + h11 * 10 * m(i + 1);
  }
  const isExact = (id, T) => EXACT[id + '@' + T] != null;
  // 화면에 보이는 값: 교과서 값은 그대로, 나머지는 '약'
  const fmt1 = (v) => (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '');
  function sText(id, T) { return isExact(id, T) ? EXACT[id + '@' + T] + ' g' : '약 ' + fmt1(solu(id, T)) + ' g'; }
  function pText(id, T, amt) { const p = amt - solu(id, T); if (p <= 0.05) return '0 g'; return (isExact(id, T) ? '' : '약 ') + fmt1(p) + ' g'; }
  // 붕산 10 g이 포화가 되는 온도(석출이 시작되는 온도)
  function startT(id, amt) { let lo = 0, hi = 80; if (solu(id, 0) >= amt) return 0; if (solu(id, 80) < amt) return 80; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (solu(id, m) < amt) lo = m; else hi = m; } return (lo + hi) / 2; }

  /* ---- 캔버스 · 이름표 · 반복 ---- */
  function surface(host, W, H) {
    const cv = document.createElement('canvas'); cv.className = 'wvc'; host.appendChild(cv);
    const box = document.createElement('div'); box.className = 'olay'; host.appendChild(box);
    const ctx = cv.getContext('2d'); const m = { k: 1, ox: 0, oy: 0, dpr: 1 };
    function fit() {
      const r = host.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      m.k = Math.min(r.width / W, r.height / H); m.ox = (r.width - W * m.k) / 2; m.oy = (r.height - H * m.k) / 2; m.dpr = dpr;
      Object.assign(box.style, { left: m.ox + 'px', top: m.oy + 'px', width: W * m.k + 'px', height: H * m.k + 'px', right: 'auto', bottom: 'auto' });
    }
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(host); else window.addEventListener('resize', fit);
    return { cv, ctx, box, m, W, H,
      begin() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(m.dpr * m.k, 0, 0, m.dpr * m.k, m.dpr * m.ox, m.dpr * m.oy); },
      full() { return [-m.ox / m.k, -m.oy / m.k, cv.width / m.dpr / m.k, cv.height / m.dpr / m.k]; },
      toLocal(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left - m.ox) / m.k, (e.clientY - r.top - m.oy) / m.k]; } };
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
      hideAll() { Object.keys(map).forEach((k) => (map[k].hidden = true)); },
    };
  }
  const loops = new Set();
  let last = 0;
  function tick(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0); last = now;
    loops.forEach((L) => { try { if (L.host.offsetParent !== null) { const r = L.host.getBoundingClientRect(); if (r.bottom > -50 && r.top < innerHeight + 50) L.fn(dt); } } catch (e) { loops.delete(L); (window.SM_err || window.RD_err || console.error)('분리 그림', e); } });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  const addLoop = (host, fn) => { const L = { host, fn }; loops.add(L); return L; };
  function tweens() {
    let list = [];
    return {
      add(dur, fn, done) { const t = { dur: Math.max(0.001, reduce ? 0.001 : dur), t: 0, fn, done }; list.push(t); return t; },
      step(dt) { const cur = list; list = []; cur.forEach((t) => { t.t += dt; const k = Math.min(1, t.t / t.dur); t.fn(k); if (k < 1) list.push(t); else if (t.done) t.done(); }); },
      clear() { list = []; },
      get busy() { return list.length > 0; },
    };
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
  function lead(ctx, pts) { ctx.save(); ctx.strokeStyle = 'rgba(90,107,126,.55)'; ctx.lineWidth = 1; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.fillStyle = 'rgba(90,107,126,.75)'; const [ex, ey] = pts[pts.length - 1]; ctx.beginPath(); ctx.arc(ex, ey, 2, 0, TAU); ctx.fill(); ctx.restore(); }

  /* ---- 붕산 결정(흰 판 모양)과 황산 구리(Ⅱ) 결정(파란 알갱이) ---- */
  function flake(ctx, x, y, s, a, tone = 1) {
    // 얇은 육각 판: 밝은 윗면 + 그늘진 옆면
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const t = i / 6 * TAU, r = s * (i % 3 === 0 ? 1.15 : 0.82); ctx[i ? 'lineTo' : 'moveTo'](Math.cos(t) * r, Math.sin(t) * r * 0.62); }
    ctx.closePath();
    const v = Math.round(lerp(214, 252, tone));
    ctx.fillStyle = `rgb(${v},${v + 1 > 255 ? 255 : v + 1},${Math.min(255, v + 3)})`; ctx.fill();
    ctx.strokeStyle = 'rgba(120,138,156,.55)'; ctx.lineWidth = 0.7; ctx.stroke();
    ctx.restore();
  }
  function bgrain(ctx, x, y, s, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(-s, -s * 0.2); ctx.lineTo(-s * 0.3, -s * 0.8); ctx.lineTo(s, -s * 0.4); ctx.lineTo(s * 0.6, s * 0.7); ctx.lineTo(-s * 0.7, s * 0.6); ctx.closePath();
    const g = ctx.createLinearGradient(-s, -s, s, s); g.addColorStop(0, '#7cc3ee'); g.addColorStop(1, '#2f86c8');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(18,70,120,.45)'; ctx.lineWidth = 0.7; ctx.stroke();
    ctx.restore();
  }
  // 정해진 모양의 무더기 자리(낮은 곳부터 채움). 결과: [{x(-1~1), y(0~1 높이), a, s}]
  function heapSlots(n, seed) {
    const R = rng(seed), out = [], bins = new Float32Array(40);
    for (let i = 0; i < n; i++) {
      // 가운데로 모이는 자리
      let u = (R() + R() + R()) / 3 * 2 - 1; const b = clamp(Math.floor((u + 1) / 2 * 40), 0, 39);
      // 이웃보다 너무 높으면 옆으로 흘러내림
      let j = b; for (let k = 0; k < 6; k++) { const l = Math.max(0, j - 1), r = Math.min(39, j + 1); if (bins[l] + 1 < bins[j]) j = l; else if (bins[r] + 1 < bins[j]) j = r; else break; }
      out.push({ x: (j + 0.5) / 20 - 1 + (R() - 0.5) * 0.04, y: bins[j], a: R() * TAU, s: 0.75 + R() * 0.5, t: 0.4 + R() * 0.6 });
      bins[j] += 0.55 + R() * 0.35;
    }
    return out;
  }

  /* ---- 유리 기구 ---- */
  // 비커(앞에서 본 모습). 원점: 바닥 가운데. 내부: x ±(w/2-4), 바닥 -6
  function beakerBack(ctx, w, h) { ctx.save(); rr(ctx, -w / 2, -h, w, h, 10); ctx.fillStyle = 'rgba(236,242,247,.55)'; ctx.fill(); ctx.restore(); }
  function beakerFront(ctx, w, h, o = {}) {
    const x0 = -w / 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(110,130,150,.75)'; ctx.lineWidth = 1.7; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x0 - 6, -h - 3); ctx.quadraticCurveTo(x0, -h - 1, x0, -h + 9); ctx.lineTo(x0, -9); ctx.quadraticCurveTo(x0, 0, x0 + 9, 0); ctx.lineTo(-x0 - 9, 0); ctx.quadraticCurveTo(-x0, 0, -x0, -9); ctx.lineTo(-x0, -h); ctx.stroke();
    ctx.strokeStyle = 'rgba(110,130,150,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, -h, w / 2, 4, 0, 0, TAU); ctx.stroke();
    // 눈금
    const n = o.ticks || 4, step = (h - 40) / n;
    ctx.strokeStyle = 'rgba(110,130,150,.5)'; ctx.lineWidth = 1;
    for (let i = 1; i <= n; i++) { const yy = -6 - i * step; ctx.beginPath(); ctx.moveTo(-x0 - 26, yy); ctx.lineTo(-x0 - 8, yy); ctx.stroke(); if (i % 2 === 0 || n <= 4) { ctx.beginPath(); ctx.moveTo(-x0 - 18, yy + step / 2); ctx.lineTo(-x0 - 8, yy + step / 2); ctx.stroke(); } }
    // 반사 띠
    let g = ctx.createLinearGradient(x0, 0, x0 + 26, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.45, 'rgba(255,255,255,.62)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x0 + 7, -h + 14, 20, h - 30);
    g = ctx.createLinearGradient(0, -8, 0, 0); g.addColorStop(0, 'rgba(210,222,233,.5)'); g.addColorStop(1, 'rgba(176,192,207,.75)');
    ctx.fillStyle = g; rr(ctx, x0 + 1, -8, w - 2, 7, 5); ctx.fill();
    ctx.restore();
  }
  // 기울어진 그릇 속 액체: 그릇 좌표(원점 바닥 가운데) 안쪽 직사각형을 a만큼 돌린 뒤 수평면 아래 넓이가 area가 되는 높이
  function tiltLevel(w, h, a, area) {
    const pts = [[-w / 2, 0], [w / 2, 0], [w / 2, -h], [-w / 2, -h]].map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
    const below = (L) => { // y >= L 인 부분 넓이 (화면 좌표는 아래가 +)
      const out = []; for (let i = 0; i < 4; i++) { const p = pts[i], q = pts[(i + 1) % 4], pi = p[1] >= L, qi = q[1] >= L; if (pi) out.push(p); if (pi !== qi) { const t = (L - p[1]) / (q[1] - p[1]); out.push([p[0] + (q[0] - p[0]) * t, L]); } }
      let s = 0; for (let i = 0; i < out.length; i++) { const p = out[i], q = out[(i + 1) % out.length]; s += p[0] * q[1] - q[0] * p[1]; } return Math.abs(s) / 2;
    };
    const ys = pts.map((p) => p[1]); let lo = Math.min(...ys), hi = Math.max(...ys);
    for (let i = 0; i < 26; i++) { const m = (lo + hi) / 2; if (below(m) > area) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }

  /* =================================================================
     1. 해 보기: 순수한 붕산 분리하기
     ================================================================= */
  function lab(host, o = {}) {
    const W = 1000, H = 640, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx, TW = tweens();
    const TY = 570, SW = 150, SH = 176, LV0 = 92;          // 200 mL 비커: 폭·높이, 물 100 g 높이
    const BW = 270, BH = 236, BX = 560, BLV = 118;          // 500 mL 비커(얼음물)
    const FX = 800, MY = 216, MHW = 92, CY = 326, STY = 440; // 깔때기: 축, 입구 높이·반폭, 원뿔 끝, 다리 끝
    const RX = FX, PX = 112;                                // 받는 비커, 시약포지
    const HOME = { x: 312, y: TY, a: 0 };
    const hwF = (y) => (y <= MY ? MHW : y >= CY ? 7 : lerp(MHW, 7, (y - MY) / (CY - MY)));
    const labels = o.labels !== false, sp = o.speed || 1;
    const R = rng(7);
    const st = {
      stage: 0, T: 70, sb: { ...HOME }, paper: { x: PX, y: TY - 4, a: 0 }, rod: { stir: 0, th: 0 },
      grains: [], flakes: [], heights: new Float32Array(36), vol: 1, bigLV: BLV,
      fun: { v: 0, dep: 0, wet: 0 }, rbV: 0, drops: [], stream: [], pour: 0, zoom: 0, cool: false, cb: null, t: 0, busy: false,
    };
    const mkGrains = () => { st.grains = []; for (let i = 0; i < 70; i++) { const blue = i % 2 === 0; st.grains.push({ blue, s: blue ? 4.2 + R() * 2 : 3.6 + R() * 1.6, a: R() * TAU, k: 1, ph: 'paper', x: 0, y: 0, vx: 0, vy: 0, ox: (R() - 0.5) * 52, oy: -R() * 14, r: 0.7 + R() * 0.6 }); } };
    mkGrains();
    const dissolved = () => { let c = 0, b = 0, nc = 0, nb = 0; st.grains.forEach((g) => { if (g.blue) { nc++; c += 1 - g.k; } else { nb++; b += 1 - g.k; } }); return { c: 10 * c / nc, b: 10 * b / nb }; };
    const allIn = () => st.grains.every((g) => g.ph === 'set' || g.ph === 'water');
    const allGone = () => st.grains.every((g) => g.k <= 0.001);
    const precip = () => Math.max(0, 10 - solu('b', st.T));
    const NPG = 13; // 1 g에 그리는 결정 수(보기 좋게 정한 값)

    // 그릇 속 바닥 위치(그릇 좌표)
    const inner = SW / 2 - 6, bottom = -8;
    function heightAt(lx) { const i = clamp(Math.floor((lx + inner) / (2 * inner) * 36), 0, 35); return st.heights[i]; }
    function addHeight(lx, h) { const i = clamp(Math.floor((lx + inner) / (2 * inner) * 36), 0, 35); st.heights[i] += h; for (let k = 1; k < 3; k++) { if (i - k >= 0) st.heights[i - k] += h * (0.5 / k); if (i + k < 36) st.heights[i + k] += h * (0.5 / k); } }
    // 그릇 좌표 ↔ 화면 좌표
    const toW = (lx, ly) => { const b = st.sb, c = Math.cos(b.a), s = Math.sin(b.a); return [b.x + lx * c - ly * s, b.y + lx * s + ly * c]; };
    const lip = () => toW(SW / 2 + 2, -SH);

    /* --- 동작 --- */
    function add(cb) {
      if (st.busy || st.stage !== 0) return; st.busy = true;
      const p0 = { ...st.paper };
      TW.add(1.0 / sp, (k) => { const e = ease(k); st.paper.x = lerp(p0.x, HOME.x - 120, e); st.paper.y = lerp(p0.y, TY - SH - 70, e); st.paper.a = lerp(0, 0.55, e); }, () => {
        st.grains.forEach((g, i) => setTimeout(() => { if (g.ph !== 'paper') return; const [px, py] = paperPt(g); g.ph = 'air'; g.x = px; g.y = py; g.vx = 40 + R() * 50; g.vy = -10 + R() * 20; }, (reduce ? 0 : i * 18 / sp)));
        setTimeout(() => {
          TW.add(0.9 / sp, (k) => { const e = ease(k); st.paper.x = lerp(HOME.x - 120, PX, e); st.paper.y = lerp(TY - SH - 70, TY - 4, e); st.paper.a = lerp(0.55, 0, e); });
          const wait = () => { if (allIn()) { st.stage = 1; st.busy = false; cb && cb(); } else setTimeout(wait, 120); }; wait();
        }, reduce ? 0 : 70 * 18 / sp + 300);
      });
    }
    function paperPt(g) { const p = st.paper, c = Math.cos(p.a), s = Math.sin(p.a), lx = g.ox * 0.45, ly = -6 + g.oy; return [p.x + lx * c - ly * s, p.y + lx * s + ly * c]; }
    function stir(cb) {
      if (st.busy || st.stage < 1 || st.stage > 2) return; st.busy = true; st.rod.stir = 1;
      TW.add(2.6 / sp, () => {}, () => { st.rod.stir = 0; st.busy = false; if (allGone()) st.stage = 2; cb && cb(allGone()); });
    }
    function cool(cb) {
      if (st.busy || st.stage !== 2) return; st.busy = true; const b0 = { ...st.sb };
      TW.add(0.9 / sp, (k) => { const e = ease(k); st.sb.x = b0.x; st.sb.y = lerp(b0.y, TY - BH - 40, e); }, () => {
        TW.add(0.9 / sp, (k) => { st.sb.x = lerp(b0.x, BX, ease(k)); }, () => {
          TW.add(0.8 / sp, (k) => { const e = ease(k); st.sb.y = lerp(TY - BH - 40, TY - 10, e); st.bigLV = lerp(BLV, BLV + 34, e); }, () => { st.stage = 3; st.cool = true; st.cb = cb; });
        });
      });
    }
    function filter(cb) {
      if (st.busy || st.stage !== 4) return; st.busy = true; const b0 = { ...st.sb };
      // 붕산 결정이 비커 바닥을 따라 따르는 쪽으로 미끄러짐
      const P = { x: 0, y: 0 }, aP = 1.05;
      const want = () => { const L = [748, 182], c = Math.cos(aP), s = Math.sin(aP); return [L[0] - (SW / 2 + 2) * c - SH * s, L[1] - (SW / 2 + 2) * s + SH * c]; };
      [P.x, P.y] = want();
      TW.add(0.9 / sp, (k) => { const e = ease(k); st.sb.y = lerp(b0.y, TY - BH - 70, e); st.bigLV = lerp(BLV + 34, BLV, e); }, () => {
        TW.add(1.0 / sp, (k) => { const e = ease(k); st.sb.x = lerp(b0.x, P.x, e); st.sb.y = lerp(TY - BH - 70, P.y, e); st.sb.a = lerp(0, aP * 0.55, e); }, () => {
          TW.add(1.0 / sp, (k) => { st.sb.a = lerp(aP * 0.55, aP, ease(k)); }, () => {
            st.pour = 1;
            TW.add(3.4 / sp, (k) => { st.vol = 1 - k; }, () => {
              st.pour = 0; st.vol = 0;
              TW.add(1.0 / sp, (k) => { st.sb.a = lerp(aP, 0, ease(k)); }, () => {
                TW.add(1.2 / sp, (k) => { const e = ease(k); st.sb.x = lerp(P.x, HOME.x, e); st.sb.y = lerp(P.y, TY, e); }, () => {
                  const wait = () => { if (st.fun.v < 0.5 && !st.stream.length) { st.stage = 5; TW.add(0.8, (k) => (st.zoom = eOut(k))); st.busy = false; cb && cb(); } else setTimeout(wait, 150); }; wait();
                });
              });
            });
          });
        });
      });
    }
    function reset() {
      TW.clear(); Object.assign(st, { stage: 0, T: 70, sb: { ...HOME }, paper: { x: PX, y: TY - 4, a: 0 }, rod: { stir: 0, th: 0 }, flakes: [], heights: new Float32Array(36), vol: 1, bigLV: BLV, fun: { v: 0, dep: 0, wet: 0 }, rbV: 0, drops: [], stream: [], pour: 0, zoom: 0, cool: false, cb: null, busy: false });
      mkGrains();
    }
    // 검사·읽기용: 바로 그 단계로
    function jump(n) {
      reset();
      if (n >= 1) st.grains.forEach((g) => { g.ph = 'set'; g.x = (R() - 0.5) * 70; g.y = bottom - R() * 6; st.stage = 1; });
      if (n >= 2) { st.grains.forEach((g) => (g.k = 0)); st.stage = 2; }
      if (n >= 3) { st.sb.x = BX; st.sb.y = TY - 10; st.bigLV = BLV + 34; st.T = 10; settleAll(); st.stage = 4; }
      if (n >= 5) { st.sb = { ...HOME }; st.bigLV = BLV; st.flakes = []; st.heights = new Float32Array(36); st.vol = 0; st.fun.dep = precip() * NPG; st.fun.wet = 1; st.rbV = 1; st.zoom = 1; st.stage = 5; }
    }
    function settleAll() {
      const n = Math.round(precip() * NPG);
      while (st.flakes.length < n) { const lx = (R() + R() - 1) * inner * 0.9; const f = { lx, ly: 0, s: 4.2 + R() * 3, a: R() * TAU, g: 1, ph: 'set', tone: 0.5 + R() * 0.5 }; f.ly = bottom - heightAt(lx) - 2; addHeight(lx, 1.6); st.flakes.push(f); }
    }

    /* --- 한 장면 그리기 --- */
    function drawStand() {
      // 받침·막대·집게 잡이·링
      const bx0 = 720, bx1 = 975;
      contact(ctx, 850, TY + 2, 300, 0.16);
      let g = ctx.createLinearGradient(0, TY - 16, 0, TY); g.addColorStop(0, '#5d6a77'); g.addColorStop(1, '#353f49');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx0 + 10, TY - 16); ctx.lineTo(bx1 + 6, TY - 16); ctx.lineTo(bx1 - 4, TY); ctx.lineTo(bx0, TY); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(bx0 + 12, TY - 16, bx1 - bx0 - 8, 2);
      g = ctx.createLinearGradient(940, 0, 956, 0); g.addColorStop(0, '#8d98a3'); g.addColorStop(0.4, '#eef2f5'); g.addColorStop(1, '#7c8792');
      ctx.fillStyle = g; ctx.fillRect(940, 34, 14, TY - 50);
      ctx.fillStyle = '#4b5662'; ctx.fillRect(937, TY - 22, 20, 7);
      // 링 팔
      ctx.fillStyle = '#525e6a'; rr(ctx, 930, MY + 34, 34, 24, 4); ctx.fill();
      g = ctx.createLinearGradient(0, MY + 40, 0, MY + 50); g.addColorStop(0, '#9aa5b0'); g.addColorStop(1, '#5f6b77');
      ctx.fillStyle = g; ctx.fillRect(FX + 66, MY + 41, 930 - FX - 66, 8);
      ctx.fillStyle = '#2f3943'; ctx.beginPath(); ctx.arc(968, MY + 46, 7, 0, TAU); ctx.fill();
    }
    function ringBack() { ctx.save(); ctx.strokeStyle = '#6d7884'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(FX, MY + 45, 68, 9, 0, Math.PI, TAU); ctx.stroke(); ctx.restore(); }
    function ringFront() { ctx.save(); const g = ctx.createLinearGradient(0, MY + 40, 0, MY + 56); g.addColorStop(0, '#a9b3bd'); g.addColorStop(1, '#56616c'); ctx.strokeStyle = g; ctx.lineWidth = 5.5; ctx.beginPath(); ctx.ellipse(FX, MY + 45, 68, 9, 0, 0, Math.PI); ctx.stroke(); ctx.restore(); }
    function conePath(dy = 0, shrink = 0) {
      ctx.beginPath(); ctx.moveTo(FX - MHW + shrink, MY + dy);
      ctx.lineTo(FX - 7, CY); ctx.lineTo(FX + 7, CY); ctx.lineTo(FX + MHW - shrink, MY + dy); ctx.closePath();
    }
    function drawFunnel() {
      // 유리 원뿔 뒤
      ctx.save(); conePath(); ctx.fillStyle = 'rgba(236,242,247,.5)'; ctx.fill(); ctx.restore();
      // 거름종이 (원뿔 안쪽, 입구보다 조금 아래)
      const PY = MY + 10, phw = (y) => hwF(y) - 3, pTip = CY - 8;
      ctx.save();
      ctx.beginPath(); ctx.moveTo(FX - phw(PY), PY); ctx.lineTo(FX, pTip); ctx.lineTo(FX + phw(PY), PY); ctx.closePath();
      const wet = st.fun.wet;
      let g = ctx.createLinearGradient(FX - 80, 0, FX + 80, 0);
      g.addColorStop(0, rgba(mixC([250, 250, 247], [214, 232, 246], wet), 0.96)); g.addColorStop(0.55, rgba(mixC([255, 255, 253], [226, 239, 249], wet), 0.96)); g.addColorStop(1, rgba(mixC([236, 238, 236], [196, 220, 238], wet), 0.96));
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(150,160,170,.55)'; ctx.lineWidth = 1; ctx.stroke();
      // 세 겹으로 접힌 쪽 (오른쪽 반)
      ctx.beginPath(); ctx.moveTo(FX + phw(PY) * 0.15, PY); ctx.lineTo(FX, pTip); ctx.strokeStyle = 'rgba(150,160,170,.45)'; ctx.stroke();
      ctx.restore();
      // 깔때기 속 액체
      if (st.fun.v > 0.2) {
        const lev = funLevel();
        ctx.save(); ctx.beginPath(); ctx.moveTo(FX - phw(lev) + 2, lev); ctx.lineTo(FX, pTip - 2); ctx.lineTo(FX + phw(lev) - 2, lev); ctx.closePath();
        g = ctx.createLinearGradient(0, lev, 0, pTip); g.addColorStop(0, rgba(mixC(WATER, CUSO, 0.55), 0.7)); g.addColorStop(1, rgba(mixC(WATER, CUSO, 0.8), 0.85));
        ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(FX - phw(lev) + 3, lev); ctx.lineTo(FX + phw(lev) - 3, lev); ctx.stroke(); ctx.restore();
      }
      // 거름종이 위에 모인 붕산
      if (st.fun.dep > 0.5) {
        const n = Math.min(st.fun.dep, depSlots.length), h = 6 + Math.sqrt(n) * 4.6, top = pTip - h;
        ctx.save(); ctx.beginPath(); ctx.moveTo(FX - phw(top) + 3, top); ctx.lineTo(FX, pTip - 1); ctx.lineTo(FX + phw(top) - 3, top); ctx.closePath(); ctx.clip();
        g = ctx.createLinearGradient(0, top, 0, pTip); g.addColorStop(0, '#f6f8fa'); g.addColorStop(1, '#dfe6ec'); ctx.fillStyle = g; ctx.fillRect(FX - 80, top, 160, h + 4);
        for (let i = 0; i < n; i++) { const d = depSlots[i]; const y = pTip - 2 - d.y * h * 0.95, hw = Math.max(2, phw(y) - 4); flake(ctx, FX + d.x * hw, y, 2.4 + d.s * 1.4, d.a, d.t); }
        ctx.restore();
      }
      // 유리 원뿔 앞 + 다리
      ctx.save();
      conePath(); ctx.strokeStyle = 'rgba(110,130,150,.72)'; ctx.lineWidth = 1.7; ctx.lineJoin = 'round'; ctx.stroke();
      g = ctx.createLinearGradient(FX - 6, 0, FX + 6, 0); g.addColorStop(0, 'rgba(200,212,223,.85)'); g.addColorStop(0.5, 'rgba(245,248,250,.9)'); g.addColorStop(1, 'rgba(185,199,212,.85)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(FX - 6, CY); ctx.lineTo(FX - 5, STY - 8); ctx.lineTo(FX - 2, STY); ctx.lineTo(FX + 5, STY - 6); ctx.lineTo(FX + 6, CY); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(110,130,150,.65)'; ctx.lineWidth = 1.2; ctx.stroke();
      if (st.fun.v > 0.2 || st.drops.length) { ctx.fillStyle = rgba(mixC(WATER, CUSO, 0.7), 0.7); ctx.fillRect(FX - 2.5, CY, 5, STY - CY - 6); }
      ctx.beginPath(); ctx.moveTo(FX - MHW + 14, MY + 12); ctx.lineTo(FX - 20, CY - 30); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
      ctx.strokeStyle = 'rgba(110,130,150,.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(FX, MY, MHW, 7, 0, 0, TAU); ctx.stroke();
      ctx.restore();
      if (labels && !(st.stage === 4 && st.busy)) lead(ctx, [[FX - 60, MY + 84], [FX - 26, MY + 72]]);
    }
    const depSlots = (() => { const a = heapSlots(Math.round(10 * NPG), 21), m = Math.max(...a.map((d) => d.y)) || 1; a.forEach((d) => (d.y /= m)); return a; })();
    function funLevel() { const k = clamp(st.fun.v / 70, 0, 1); return lerp(CY - 10, MY + 30, Math.sqrt(k)); }
    function drawBig() {
      ctx.save(); ctx.translate(BX, TY);
      contact(ctx, 0, 2, BW * 1.15, 0.14);
      beakerBack(ctx, BW, BH);
      // 얼음물
      const top = -6 - st.bigLV;
      let g = ctx.createLinearGradient(0, top, 0, 0); g.addColorStop(0, rgba(ICE, 0.75)); g.addColorStop(1, rgba([206, 224, 238], 0.85));
      ctx.fillStyle = g; rr(ctx, -BW / 2 + 4, top, BW - 8, st.bigLV + 2, 5); ctx.fill();
      ctx.restore();
    }
    function drawIce() {
      // 얼음 조각 (물에 떠 있음, 앞쪽)
      ctx.save(); ctx.translate(BX, TY);
      const top = -6 - st.bigLV, inSmall = st.sb.x > BX - 40 && st.sb.x < BX + 40 && st.sb.y > TY - 60;
      ICES.forEach((c) => {
        if (inSmall && Math.abs(c.x) < SW / 2 + 8 && !c.front) return;
        const y = top + c.dy + Math.sin(st.t * 0.9 + c.p) * 1.2;
        ctx.save(); ctx.translate(c.x, y); ctx.rotate(c.a);
        rr(ctx, -c.s / 2, -c.s * 0.42, c.s, c.s * 0.84, 6);
        const g = ctx.createLinearGradient(-c.s / 2, -c.s / 2, c.s / 2, c.s / 2); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.6, 'rgba(232,242,250,.85)'); g.addColorStop(1, 'rgba(196,218,236,.85)');
        ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(140,165,188,.55)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.9)'; rr(ctx, -c.s / 2 + 4, -c.s * 0.42 + 4, c.s * 0.35, 4, 2); ctx.fill();
        ctx.restore();
      });
      ctx.restore();
    }
    const ICES = [{ x: -104, s: 30, a: 0.2, dy: 4, p: 0 }, { x: -76, s: 26, a: -0.3, dy: 10, p: 1 }, { x: 98, s: 30, a: 0.4, dy: 5, p: 2 }, { x: 70, s: 24, a: -0.1, dy: 12, p: 3 }, { x: -110, s: 22, a: 0.6, dy: 30, p: 4, front: true }, { x: 108, s: 22, a: -0.5, dy: 34, p: 5, front: true }, { x: -30, s: 26, a: 0.1, dy: 3, p: 6 }, { x: 30, s: 24, a: -0.4, dy: 6, p: 7 }];
    function drawBigFront() { ctx.save(); ctx.translate(BX, TY); beakerFront(ctx, BW, BH, { ticks: 5 }); ctx.restore(); }
    function solColor() { const d = dissolved(); return mixC(WATER, CUSO, clamp(d.c / 10, 0, 1)); }
    function drawSmall() {
      const b = st.sb, d = dissolved();
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a);
      if (b.a === 0 && b.y >= TY - 1) contact(ctx, 0, 2, SW * 1.15, 0.14);
      beakerBack(ctx, SW, SH);
      // 액체
      const area = (SW - 8) * LV0 * st.vol;
      if (area > 4) {
        ctx.save(); rr(ctx, -SW / 2 + 4, -SH, SW - 8, SH - 3, 6); ctx.clip();
        ctx.rotate(-b.a);
        const L = tiltLevel(SW - 8, SH, b.a, area) - 6 * Math.cos(b.a);
        const col = solColor(), haze = clamp(st.flakes.filter((f) => f.ph === 'fall').length / 30, 0, 0.5);
        const g = ctx.createLinearGradient(0, L, 0, L + 120); g.addColorStop(0, rgba(col, 0.62)); g.addColorStop(1, rgba(mixC(col, [60, 120, 170], 0.12), 0.78));
        ctx.fillStyle = g; ctx.fillRect(-300, L, 600, 400);
        if (haze > 0) { ctx.fillStyle = `rgba(255,255,255,${haze * 0.35})`; ctx.fillRect(-300, L, 600, 400); }
        ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-300, L); ctx.lineTo(300, L); ctx.stroke();
        ctx.restore();
        // 김 (뜨거운 물)
        if (b.a === 0 && st.T > 42 && st.stage < 3) {
          const k = clamp((st.T - 40) / 30, 0, 1) * 0.5;
          ctx.save(); ctx.strokeStyle = `rgba(160,178,196,${k})`; ctx.lineWidth = 2; ctx.lineCap = 'round';
          for (let i = 0; i < 3; i++) { const x0 = -36 + i * 34, ph = st.t * 1.4 + i * 2.1; ctx.beginPath(); for (let j = 0; j <= 20; j++) { const yy = -LV0 - 18 - j * 3.2, xx = x0 + Math.sin(ph + j * 0.32) * 7 * (j / 20); j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.globalAlpha = 1; ctx.stroke(); }
          ctx.restore();
        }
      }
      // 바닥에 가라앉은 혼합물 알갱이
      st.grains.forEach((g) => { if (g.ph === 'set' || g.ph === 'water') { if (g.k <= 0.001) return; (g.blue ? bgrain : flake)(ctx, g.x, g.y, g.s * Math.sqrt(g.k), g.a, 0.95); } });
      // 붕산 결정 (그릇 좌표)
      st.flakes.forEach((f) => { if (f.ph === 'out') return; flake(ctx, f.lx, f.ly, f.s * f.g, f.a, f.tone); });
      // 유리 막대
      drawRod();
      beakerFront(ctx, SW, SH, { ticks: 4 });
      ctx.restore();
      return d;
    }
    function drawRod() {
      if (st.stage >= 4 && st.sb.a > 0) return; // 거를 때는 막대를 빼 둠(오른쪽에 놓음)
      if (st.stage >= 3) return;
      const r = st.rod, th = r.th;
      let tx, ty, bx, by;
      if (r.stir > 0 || r.k > 0) { const k = r.k || 0; tx = lerp(54, Math.cos(th) * 22, k); ty = -SH - 46; bx = lerp(-40, -Math.cos(th) * 30, k); by = -14 + Math.sin(th) * 2 * k; }
      else { tx = 54; ty = -SH - 46; bx = -40; by = -14; }
      const g = ctx.createLinearGradient(tx - 4, 0, tx + 4, 0); g.addColorStop(0, 'rgba(190,205,218,.95)'); g.addColorStop(0.5, 'rgba(250,252,253,.95)'); g.addColorStop(1, 'rgba(170,188,204,.95)');
      ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(120,140,160,.6)'; ctx.lineWidth = 8.5; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(bx, by); ctx.stroke();
      ctx.strokeStyle = g; ctx.lineWidth = 6.5; ctx.stroke(); ctx.restore();
    }
    function drawPaper() {
      const p = st.paper;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
      if (p.a === 0) { ctx.fillStyle = 'rgba(20,38,59,.08)'; ctx.beginPath(); ctx.ellipse(0, 6, 78, 9, 0, 0, TAU); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(-76, 0); ctx.lineTo(0, -16); ctx.lineTo(76, 0); ctx.lineTo(0, 16); ctx.closePath();
      const g = ctx.createLinearGradient(0, -16, 0, 16); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e8edf2'); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(20,38,59,.22)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = 'rgba(20,38,59,.1)'; ctx.beginPath(); ctx.moveTo(-76, 0); ctx.lineTo(76, 0); ctx.stroke();
      st.grains.forEach((g2) => { if (g2.ph !== 'paper') return; (g2.blue ? bgrain : flake)(ctx, g2.ox * 0.45, -6 + g2.oy, g2.s, g2.a, 0.95); });
      ctx.restore();
    }
    function drawRB() {
      ctx.save(); ctx.translate(RX, TY);
      contact(ctx, 0, 2, SW * 1.15, 0.14);
      beakerBack(ctx, SW, SH);
      const h = LV0 * 0.95 * st.rbV;
      if (h > 0.5) { const col = mixC(WATER, CUSO, 0.92), g = ctx.createLinearGradient(0, -6 - h, 0, 0); g.addColorStop(0, rgba(col, 0.62)); g.addColorStop(1, rgba(mixC(col, [60, 120, 170], 0.12), 0.8)); ctx.fillStyle = g; rr(ctx, -SW / 2 + 4, -6 - h, SW - 8, h + 2, 5); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-SW / 2 + 5, -6 - h); ctx.lineTo(SW / 2 - 5, -6 - h); ctx.stroke(); }
      ctx.restore();
      st.drops.forEach((d) => { ctx.fillStyle = rgba(mixC(WATER, CUSO, 0.8), 0.85); ctx.beginPath(); ctx.ellipse(d.x, d.y, 2.6, 3.4, 0, 0, TAU); ctx.fill(); });
      ctx.save(); ctx.translate(RX, TY); beakerFront(ctx, SW, SH, { ticks: 4 }); ctx.restore();
    }
    function drawStream() {
      if (!st.pour || st.vol <= 0.01) return;
      const [lx, ly] = lip(); const tx = FX - 38, tyy = funLevel();
      const w = 5 + 5 * Math.min(1, st.vol * 2);
      ctx.save(); ctx.strokeStyle = rgba(mixC(solColor(), [255, 255, 255], 0.1), 0.75); ctx.lineWidth = w; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(lx, ly + 2); ctx.quadraticCurveTo(lx + 14, ly + 6, tx, tyy - 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(lx - 1, ly + 3); ctx.quadraticCurveTo(lx + 12, ly + 6, tx - 2, tyy - 2); ctx.stroke();
      ctx.restore();
      st.stream.forEach((p) => flake(ctx, p.x, p.y, p.s, p.a, p.t));
    }
    function drawZoom() {
      if (st.zoom <= 0.01) return;
      const k = st.zoom, cx = 150, cy = 150, r = 122 * (0.85 + 0.15 * k);
      ctx.save(); ctx.globalAlpha = k;
      // 연결선
      ctx.strokeStyle = 'rgba(90,107,126,.45)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(cx + r * 0.97, cy + r * 0.2); ctx.lineTo(FX - 26, CY - 22); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(20,38,59,.08)'; ctx.beginPath(); ctx.arc(cx + 3, cy + 6, r, 0, TAU); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
      ctx.fillStyle = '#eef2f5'; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      // 펼친 거름종이 (위에서 본 모습)
      const pr = r * 0.92, g = ctx.createRadialGradient(cx, cy, 10, cx, cy, pr); g.addColorStop(0, '#dbe9f4'); g.addColorStop(0.7, '#eaf2f8'); g.addColorStop(1, '#f6f8f9');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, pr, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(140,155,170,.35)'; ctx.lineWidth = 1; [0, Math.PI / 2].forEach((a) => { ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * pr, cy - Math.sin(a) * pr); ctx.lineTo(cx + Math.cos(a) * pr, cy + Math.sin(a) * pr); ctx.stroke(); });
      // 가운데 모인 흰 붕산
      ZS.forEach((z) => flake(ctx, cx + z.x * r * 0.5, cy + z.y * r * 0.5, z.s, z.a, z.t));
      ctx.restore();
      ctx.strokeStyle = 'rgba(110,130,150,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    const ZS = (() => { const r = rng(5), a = []; for (let i = 0; i < 260; i++) { const ang = r() * TAU, d = Math.pow(r(), 0.7) * (0.8 + 0.25 * Math.sin(ang * 3)); a.push({ x: Math.cos(ang) * d, y: Math.sin(ang) * d * 0.9, s: 5 + r() * 6, a: r() * TAU, t: 0.45 + r() * 0.55 }); } return a.sort((p, q) => q.s - p.s).reverse(); })();

    /* --- 움직임 --- */
    function step(dt) {
      st.t += dt; TW.step(dt);
      const b = st.sb;
      // 시약포지 → 공기 → 물 → 바닥
      const surfY = b.y - 6 - LV0;
      st.grains.forEach((g) => {
        if (g.ph === 'air') {
          g.vy += 900 * dt; g.x += g.vx * dt; g.y += g.vy * dt; g.a += dt * 4;
          if (g.y > surfY && Math.abs(g.x - b.x) < SW / 2 - 6) { g.ph = 'water'; g.x -= b.x; g.y -= b.y; g.vy = Math.min(g.vy, 120); }
          if (g.y > TY) { g.ph = 'water'; g.x = (R() - 0.5) * 60; g.y = -40; }
        } else if (g.ph === 'water') {
          g.vy += (60 - g.vy) * dt * 4; g.y += g.vy * dt; g.x += g.vx * dt * 0.1; g.vx *= 0.96; g.x = clamp(g.x, -inner + 4, inner - 4);
          const fl = bottom - 3 - Math.abs(Math.sin(g.ox)) * 4;
          if (g.y >= fl) { g.y = fl; g.ph = 'set'; }
        }
      });
      // 젓기: 막대가 돌고, 알갱이가 소용돌이를 따라 돌며 녹음
      const r = st.rod; r.k = lerp(r.k || 0, r.stir ? 1 : 0, Math.min(1, dt * 6));
      if (r.stir) r.th += dt * 7.5;
      st.grains.forEach((g) => {
        if (g.ph !== 'set' && g.ph !== 'water') return;
        const rate = (r.stir ? 0.34 : 0.012) * g.r * (st.T > 40 ? 1 : 0.2);
        g.k = Math.max(0, g.k - rate * dt);
        if (r.stir && g.k > 0) { g.x += Math.sin(r.th + g.ox) * 34 * dt; g.x = clamp(g.x, -inner + 4, inner - 4); g.a += dt * 3; g.y = bottom - 3 - Math.abs(Math.sin(r.th * 0.5 + g.ox)) * 10; }
      });
      // 식히기
      if (st.cool) {
        st.T = Math.max(10, st.T - (st.T - 5) * 0.27 * dt * sp);
        const want = Math.round(precip() * NPG);
        while (st.flakes.length < want) {
          // 용액 곳곳(특히 위쪽과 벽 가까이)에서 생김
          const wall = R() < 0.35, lx = wall ? (R() < 0.5 ? -1 : 1) * (inner - 4 - R() * 6) : (R() * 2 - 1) * (inner - 8);
          st.flakes.push({ lx, ly: -6 - LV0 * (0.15 + R() * 0.8), s: 4.2 + R() * 3, a: R() * TAU, g: 0, ph: 'fall', vy: 0, sw: R() * TAU, tone: 0.5 + R() * 0.5 });
        }
        if (st.T <= 10.01 && st.flakes.every((f) => f.ph === 'set')) { st.cool = false; st.stage = 4; st.busy = false; const cb = st.cb; st.cb = null; cb && cb(); }
      }
      st.flakes.forEach((f) => {
        if (f.ph !== 'fall') return;
        f.g = Math.min(1, f.g + dt * 1.6);
        if (f.g < 0.6) return;
        f.vy = Math.min(70, f.vy + 120 * dt); f.ly += f.vy * dt; f.lx += Math.sin(st.t * 2 + f.sw) * 10 * dt; f.a += dt * 0.8;
        const fl = bottom - heightAt(f.lx) - 2;
        if (f.ly >= fl) { f.ly = fl; f.ph = 'set'; f.vy = 0; addHeight(f.lx, 1.6); }
      });
      // 따르기: 결정이 바닥을 따라 따르는 쪽으로 모였다가 함께 흘러나감
      if (st.stage === 4 && b.a > 0.05) {
        const left = st.flakes.filter((f) => f.ph !== 'out');
        left.forEach((f, i) => { const tgt = inner - 6 - (i % 7) * 4; f.lx = lerp(f.lx, tgt, Math.min(1, dt * 1.5 * (b.a / 1.05))); f.ly = lerp(f.ly, bottom - 3 - Math.floor(i / 7) * 3, Math.min(1, dt * 1.2)); });
        if (st.pour) {
          const shouldOut = Math.round(st.flakes.length * (1 - st.vol));
          let out = st.flakes.filter((f) => f.ph === 'out').length;
          for (let i = 0; i < st.flakes.length && out < shouldOut; i++) { const f = st.flakes[i]; if (f.ph !== 'out') { f.ph = 'out'; out++; const [x, y] = lip(); st.stream.push({ x, y, vx: 60 + R() * 30, vy: 20, s: f.s * 0.8, a: f.a, t: f.tone }); } }
          st.fun.v += 34 * dt * sp; st.fun.wet = Math.min(1, st.fun.wet + dt * 2);
        }
      }
      if (st.pour && st.vol <= 0.02) st.flakes.forEach((f) => { if (f.ph !== 'out') { f.ph = 'out'; const [x, y] = lip(); st.stream.push({ x, y, vx: 60, vy: 20, s: f.s * 0.8, a: f.a, t: f.tone }); } });
      // 흐름 속 결정 → 깔때기
      const tyy = funLevel();
      st.stream = st.stream.filter((p) => { p.vy += 700 * dt; p.x += (FX - 38 - p.x) * Math.min(1, dt * 5); p.y += p.vy * dt; p.a += dt * 3; if (p.y >= tyy) { st.fun.dep += 1; return false; } return true; });
      // 깔때기 → 거름종이를 지나 비커로 (빠르기는 보기 좋게 정한 값)
      if (st.fun.v > 0) {
        const out = Math.min(st.fun.v, 16 * dt * sp); st.fun.v -= out; st.rbV = Math.min(1, st.rbV + out / 100);
        st.dropT = (st.dropT || 0) + dt * (4 + 8 * Math.min(1, st.fun.v / 20)) * sp;
        while (st.dropT > 1) { st.dropT -= 1; st.drops.push({ x: FX - 1, y: STY, vy: 40 }); }
      }
      const rbTop = TY - 6 - LV0 * 0.95 * st.rbV;
      st.drops = st.drops.filter((d) => { d.vy += 900 * dt; d.y += d.vy * dt; return d.y < rbTop; });
    }

    addLoop(host, (dt) => {
      step(dt);
      S.begin(); white(S); desk(S, TY);
      drawStand(); ringBack(); drawFunnel(); ringFront();
      drawRB();
      drawBig();
      drawPaper();
      if (st.stage >= 3) { // 다 쓴 유리 막대는 시약포지 옆에 내려 둠
        ctx.save(); ctx.translate(170, TY + 22); ctx.rotate(-0.03); ctx.fillStyle = 'rgba(20,38,59,.08)'; ctx.fillRect(-92, 4, 184, 4);
        const g = ctx.createLinearGradient(0, -4, 0, 4); g.addColorStop(0, 'rgba(250,252,253,.95)'); g.addColorStop(1, 'rgba(170,188,204,.95)'); ctx.fillStyle = g; rr(ctx, -95, -3.5, 190, 7, 3.5); ctx.fill(); ctx.strokeStyle = 'rgba(120,140,160,.55)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
      const inIce = st.sb.x > BX - 30 && st.sb.x < BX + 30 && st.sb.y > TY - 80;
      if (!inIce) { drawIce(); drawBigFront(); }
      drawSmall();
      if (inIce) { // 작은 비커가 얼음물 속: 얼음물을 앞에 한 번 더 옅게
        ctx.save(); ctx.translate(BX, TY); const top = -6 - st.bigLV; const g = ctx.createLinearGradient(0, top, 0, 0); g.addColorStop(0, rgba(ICE, 0.28)); g.addColorStop(1, rgba([206, 224, 238], 0.34)); ctx.fillStyle = g; rr(ctx, -BW / 2 + 4, top, BW - 8, st.bigLV + 2, 5); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-BW / 2 + 5, top); ctx.lineTo(BW / 2 - 5, top); ctx.stroke(); ctx.restore();
        drawIce(); drawBigFront();
      }
      // 공중의 알갱이
      st.grains.forEach((g) => { if (g.ph === 'air') (g.blue ? bgrain : flake)(ctx, g.x, g.y, g.s, g.a, 0.95); });
      drawStream();
      drawZoom();
      labelsDraw();
    });

    /* --- 이름표 --- */
    function labelsDraw() {
      if (!labels) { ov.hideAll(); return; }
      const b = st.sb, moving = TW.busy && st.busy;
      // 온도 (모형으로 보여 주는 값)
      if (b.a === 0 && st.stage < 5) ov.put('temp', b.x, b.y - SH - 24, `용액 약 ${Math.round(st.T)} ℃`, 'tx read'); else ov.hide('temp');
      if (!moving && st.stage === 0) {
        ov.put('pp', st.paper.x, st.paper.y + 30, '혼합물 <span class="u">황산 구리(Ⅱ) 10 g + 붕산 10 g</span>', 'tx nm');
        ov.put('sbn', b.x, b.y + 22, '200 mL 비커 <span class="u">뜨거운 물 100 g</span>', 'tx nm');
      } else { ov.hide('pp'); ov.hide('sbn'); }
      if (!moving && (st.stage === 1 || st.stage === 2) && b.a === 0) ov.put('rod', b.x - SW / 2 - 12, b.y - SH - 20, '유리 막대', 'tx nm la'); else ov.hide('rod');
      if (st.stage <= 3) ov.put('bbn', BX, TY + 22, '500 mL 비커 <span class="u">얼음물</span>', 'tx nm'); else ov.hide('bbn');
      // 거름 장치 (거르는 동안에는 숨김)
      if (!(st.stage === 4 && st.busy)) {
        ov.put('fn', FX - MHW - 14, MY - 4, '깔때기', 'tx nm la');
        ov.put('rg', FX - 84, MY + 46, '링', 'tx m la');
        ov.put('fp', FX - 64, MY + 84, '거름종이', 'tx nm la');
        ov.put('sd', 932, TY - 150, '스탠드', 'tx m la');
      } else ['fn', 'fp', 'rg', 'sd'].forEach(ov.hide);
      if (st.stage === 5) {
        ov.put('rbn', RX, TY + 22, '걸러진 액체 <span class="u">파란색</span>', 'tx nm');
        ov.put('zn', 150, 150 + 142, '거름종이 위 <b>흰색 고체</b> <span class="u">위에서 본 모습</span>', 'tx cap');
      } else { ov.hide('rbn'); ov.hide('zn'); ov.put('rbn2', RX, TY + 22, '비커', 'tx m'); }
      if (st.stage === 5) ov.hide('rbn2');
    }

    if (o.jump) jump(o.jump);
    return { st, add, stir, cool, filter, reset, jump,
      get T() { return st.T; }, get dissolved() { return dissolved(); }, get busy() { return st.busy; },
      get crystals() { return precip(); }, get allGone() { return allGone(); } };
  }

  /* =================================================================
     2. 그림 Ⅰ-12 형식 용해도 곡선 + 물 100 g 비커
     amt: {c, b} 넣은 양(g). T: 온도(℃)
     ================================================================= */
  function curve(host, o = {}) {
    const W = 1100, H = o.H || 660, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx, TW = tweens();
    const X0 = 96, X1 = 640, Y0 = H - 70, Y1 = 40, GM = 80, TM = 80;
    const xT = (T) => X0 + (X1 - X0) * T / TM, yG = (g) => Y0 - (Y0 - Y1) * g / GM;
    const KX = 880, KY = H - 92, KW = 230, KH = 250; // 비커
    const st = { amt: { c: 10, b: 10, ...(o.amt || {}) }, T: o.T == null ? 70 : o.T, Tv: o.T == null ? 70 : o.T, draw: reduce ? 1 : 0, beaker: o.beaker !== false };
    if (!reduce) TW.add(1.1, (k) => (st.draw = eOut(k)));
    function set(p) {
      if (p.amt) st.amt = { ...st.amt, ...p.amt };
      if (p.T != null) { st.T = p.T; if (p.dur) { const a = st.Tv; TW.add(p.dur, (k) => (st.Tv = lerp(a, p.T, ease(k))), p.done); } else { st.Tv = p.T; } }
    }
    if (o.onT) {
      let drag = false;
      const at = (e) => { const [x, y] = S.toLocal(e); if (x > X1 + 30) return; let T = clamp((x - X0) / (X1 - X0) * TM, 0, TM); T = Math.round(T); if (T !== st.T) { st.T = T; st.Tv = T; o.onT(T); } };
      host.addEventListener('pointerdown', (e) => { const [x] = S.toLocal(e); if (x > X1 + 30) return; drag = true; host.setPointerCapture && host.setPointerCapture(e.pointerId); at(e); });
      host.addEventListener('pointermove', (e) => drag && at(e));
      ['pointerup', 'pointercancel'].forEach((n) => host.addEventListener(n, () => (drag = false)));
      host.style.touchAction = 'none';
    }
    for (let T = 0; T <= TM; T += 20) ov.put('xt' + T, xT(T), Y0 + 20, String(T), 'tk2');
    for (let g = 0; g <= GM; g += 20) ov.put('yt' + g, X0 - 12, yG(g), String(g), 'tk2 la');
    ov.put('yl', X0 - 4, Y1 - 22, '용해도(g/물 100 g)', 'tx m ra');
    ov.put('xl', X1, Y0 + 46, '온도(℃)', 'tx m la');
    const slotsB = heapSlots(400, 3), slotsC = heapSlots(400, 9);
    function path(id, upto) { ctx.beginPath(); for (let T = 0; T <= TM * upto + 0.001; T += 1) { const x = xT(T), y = yG(solu(id, T)); T ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } }
    const COL = { c: '#6b7c8f', b: BLUE };
    addLoop(host, (dt) => {
      TW.step(dt);
      S.begin(); white(S);
      const T = st.Tv, Ti = Math.round(T), A = st.amt;
      // 모눈
      ctx.fillStyle = '#fbfcfe'; ctx.fillRect(X0, Y1, X1 - X0, Y0 - Y1);
      ctx.lineWidth = 1;
      for (let t = 0; t <= TM; t += 10) { ctx.strokeStyle = t % 20 ? '#eef2f6' : '#e1e8ef'; ctx.beginPath(); ctx.moveTo(xT(t), Y1); ctx.lineTo(xT(t), Y0); ctx.stroke(); }
      for (let g = 0; g <= GM; g += 10) { ctx.strokeStyle = g % 20 ? '#eef2f6' : '#e1e8ef'; ctx.beginPath(); ctx.moveTo(X0, yG(g)); ctx.lineTo(X1, yG(g)); ctx.stroke(); }
      ctx.strokeStyle = '#8b9aab'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(X0, Y1 - 6); ctx.lineTo(X0, Y0); ctx.lineTo(X1 + 6, Y0); ctx.stroke();
      // 넣은 양 (가로 점선)
      const amts = A.c === A.b ? [['cb', A.c]] : [['c', A.c], ['b', A.b]];
      ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(20,38,59,.45)'; ctx.lineWidth = 1.2;
      amts.forEach(([, g]) => { ctx.beginPath(); ctx.moveTo(X0, yG(g)); ctx.lineTo(X1, yG(g)); ctx.stroke(); });
      ctx.restore();
      amts.forEach(([k, g]) => ov.put('am' + k, X1 - 4, yG(g) - 13, `넣은 양 ${g} g${k === 'cb' ? '' : `<span class="u">${DATA[k].name}</span>`}`, 'tx dn la'));
      ['amc', 'amb', 'amcb'].forEach((id) => { if (!amts.some(([k]) => 'am' + k === id)) ov.hide(id); });
      // 곡선
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ['c', 'b'].forEach((id) => { path(id, st.draw); ctx.strokeStyle = COL[id]; ctx.lineWidth = id === 'b' ? 3 : 2.4; ctx.stroke(); });
      ctx.restore();
      ov.put('cn', xT(58), yG(solu('c', 58)) - 22, '황산 구리(Ⅱ)', 'tx nm la');
      ov.put('bn', xT(30), yG(solu('b', 30)) + 22, '붕산', 'tx nm blue');
      // 지금 온도
      ctx.save(); ctx.strokeStyle = 'rgba(20,38,59,.5)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(xT(T), Y1); ctx.lineTo(xT(T), Y0); ctx.stroke(); ctx.restore();
      ov.put('tnow', xT(T), Y0 + 20, `${Ti}`, 'tx read');
      // 각 물질: 녹을 수 있는 양(곡선 위 점), 넣은 양보다 작으면 그 차이만큼 석출
      ['c', 'b'].forEach((id) => {
        const s = solu(id, T), a = A[id], x = xT(T), ys = yG(Math.min(s, GM)), ya = yG(a);
        const pS = x > X1 - 170 ? 'la' : 'ra', vS = pS === 'ra' ? 'la' : 'ra', pdx = pS === 'ra' ? 14 : -14;
        if (a > s + 0.05) {
          ctx.save(); ctx.strokeStyle = COL[id]; ctx.lineWidth = 6; ctx.globalAlpha = 0.28; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(x, ys); ctx.lineTo(x, ya); ctx.stroke(); ctx.restore();
          ctx.save(); ctx.strokeStyle = COL[id]; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 7, ya); ctx.lineTo(x + 7, ya); ctx.moveTo(x - 7, ys); ctx.lineTo(x + 7, ys); ctx.stroke(); ctx.restore();
          ov.put('pr' + id, x + pdx, (ys + ya) / 2, `석출 ${pText(id, Ti, a)}`, 'tx dn ' + pS + (id === 'b' ? ' bl' : ''));
        } else ov.hide('pr' + id);
        ctx.fillStyle = '#fff'; ctx.strokeStyle = COL[id]; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(x, ys, 5.5, 0, TAU); ctx.fill(); ctx.stroke();
        const pr = a > s + 0.05, vx = x + (pr ? (vS === 'la' ? -12 : 12) : (id === 'b' ? (x > X1 - 50 ? -12 : 10) : -12)), vy = ys + (pr ? 0 : (id === 'c' ? -16 : 18));
        ov.put('sv' + id, vx, vy, `${sText(id, Ti)}`, 'tx val ' + (pr ? vS : (id === 'b' ? (x > X1 - 50 ? 'la' : 'ra') : 'la')));
      });
      if (!st.beaker) return;
      // 비커: 물 100 g
      const dc = Math.min(A.c, solu('c', T)), pc = A.c - dc, pb = Math.max(0, A.b - solu('b', T));
      ctx.save(); ctx.translate(KX, KY);
      contact(ctx, 0, 2, KW * 1.15, 0.14);
      beakerBack(ctx, KW, KH);
      const LV = 150, col = mixC(WATER, CUSO, clamp(dc / 18, 0, 1));
      let g = ctx.createLinearGradient(0, -6 - LV, 0, 0); g.addColorStop(0, rgba(col, 0.62)); g.addColorStop(1, rgba(mixC(col, [60, 120, 170], 0.12), 0.8));
      ctx.fillStyle = g; rr(ctx, -KW / 2 + 4, -6 - LV, KW - 8, LV + 2, 5); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-KW / 2 + 5, -6 - LV); ctx.lineTo(KW / 2 - 5, -6 - LV); ctx.stroke();
      // 바닥의 고체: 붕산(흰) 왼쪽, 황산 구리(Ⅱ)(파랑) 오른쪽
      const per = 13, hw = KW / 2 - 14;
      const drawHeap = (slots, n, cx, w, fn) => { for (let i = 0; i < Math.min(n, slots.length); i++) { const s = slots[i]; fn(ctx, cx + s.x * w, -10 - s.y * 3.6, 4 + s.s * 2, s.a, s.t); } };
      const both = pb > 0.05 && pc > 0.05;
      if (pb > 0.05) drawHeap(slotsB, Math.round(pb * per), both ? -hw / 2 : 0, both ? hw / 2 : hw * 0.7, flake);
      if (pc > 0.05) drawHeap(slotsC, Math.round(pc * per), both ? hw / 2 : 0, both ? hw / 2 : hw * 0.7, bgrain);
      beakerFront(ctx, KW, KH, { ticks: 5 });
      ctx.restore();
      ov.put('kt', KX, KY - KH - 24, `물 100 g · ${Ti} ℃`, 'tx read');
      const line = (id, a, s) => (a > s + 0.05 ? `${DATA[id].name} <b>${isExact(id, Ti) ? '' : '약 '}${fmt1(s)} g</b> 녹음` : `${DATA[id].name} <b>${a} g</b> 모두 녹음`);
      ov.put('k1', KX, KY + 26, line('c', A.c, solu('c', T)), 'tx dn');
      ov.put('k2', KX, KY + 52, line('b', A.b, solu('b', T)), 'tx dn');
    });
    return { set, st, get busy() { return TW.busy; } };
  }

  return { lab, curve, solu, sText, pText, startT, DATA, EXACT, isExact, fmt1 };
})();
