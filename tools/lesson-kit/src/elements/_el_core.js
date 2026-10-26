/* ===== 원소 수업 그림 도구: 바탕 (캔버스 2D) =====
   EL.surface / EL.overlay / EL.addLoop / EL.tweens   캔버스·HTML 이름표·반복·짧은 움직임
   EL.ball(ctx, x, y, r, el)                         입자 하나(매트한 공, 빛은 왼쪽 위)
   EL.swarm(spec)                                     돋보기 속 입자 무리(기체·액체·고체)
   EL.lens(ctx, x, y, R, swarm, dt)                   둥근 돋보기에 입자 무리 그리기
   그림 원칙(2026-10-26 선생님 요청 "다채롭고 화려하게"): 화면 틀은 라스 파랑 하나, 그림 속 물질은 실제 색을 살린다.
   입자 색은 널리 쓰는 모형 색(수소 흰색, 산소 빨강, 탄소 검정, 질소 파랑, 염소 초록, 나트륨 보라). 입자 수·배치는 보기 좋게 정한 모형. */
window.EL = (() => {
  const TAU = Math.PI * 2;
  const BLUE = '#0e63b3';
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  /* ---- 캔버스 · 이름표 · 반복 ---- */
  // crop: [x, y, w, h] 그림 좌표에서 칸에 맞춰 보일 영역(없으면 전체)
  function surface(host, W, H, crop) {
    const cv = document.createElement('canvas'); cv.className = 'wvc'; host.appendChild(cv);
    const box = document.createElement('div'); box.className = 'olay'; host.appendChild(box);
    const ctx = cv.getContext('2d'); const m = { k: 1, ox: 0, oy: 0, dpr: 1 };
    const S = { cv, ctx, box, m, W, H, crop: crop || null };
    function fit() {
      const r = host.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      const [cx, cy, cw, ch] = S.crop || [0, 0, W, H];
      m.k = Math.min(r.width / cw, r.height / ch);
      m.ox = (r.width - cw * m.k) / 2 - cx * m.k; m.oy = (r.height - ch * m.k) / 2 - cy * m.k; m.dpr = dpr;
      Object.assign(box.style, { left: m.ox + 'px', top: m.oy + 'px', width: W * m.k + 'px', height: H * m.k + 'px', right: 'auto', bottom: 'auto' });
      box.style.setProperty('--k', m.k);
      S.onfit && S.onfit();
    }
    S.fit = fit;
    S.setCrop = (c) => { S.crop = c; fit(); };
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(host); else window.addEventListener('resize', fit);
    S.begin = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(m.dpr * m.k, 0, 0, m.dpr * m.k, m.dpr * m.ox, m.dpr * m.oy); };
    S.full = () => [-m.ox / m.k, -m.oy / m.k, cv.width / m.dpr / m.k, cv.height / m.dpr / m.k];
    S.toLocal = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left - m.ox) / m.k, (e.clientY - r.top - m.oy) / m.k]; };
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
      hideAll() { Object.keys(map).forEach((k) => (map[k].hidden = true)); },
      el(id) { return map[id]; },
    };
  }
  const loops = new Set();
  let last = 0;
  function tick(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0); last = now;
    loops.forEach((L) => {
      try {
        if (L.host.offsetParent === null && !L.always) return;
        const r = L.host.getBoundingClientRect();
        if (r.bottom > -50 && r.top < innerHeight + 50) L.fn(dt);
      } catch (e) { loops.delete(L); (window.SM_err || window.RD_err || window.SW_err || console.error)('원소 그림', e); }
    });
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

  /* ---- 그리기 조각 ---- */
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function white(S, col = '#fff') { const [fx, fy, fw, fh] = S.full(); S.ctx.fillStyle = col; S.ctx.fillRect(fx, fy, fw, fh); }
  function desk(S, y) {
    const ctx = S.ctx, [fx, , fw, fh] = S.full();
    const g = ctx.createLinearGradient(0, y, 0, y + 90); g.addColorStop(0, '#e9eef4'); g.addColorStop(1, '#f7f9fb');
    ctx.fillStyle = g; ctx.fillRect(fx, y, fw, fh); ctx.fillStyle = '#d5dee7'; ctx.fillRect(fx, y, fw, 1.2);
  }
  function contact(ctx, x, y, w, a = 0.18, sq = 0.16) {
    const g = ctx.createRadialGradient(x, y, 1, x, y, w / 2);
    g.addColorStop(0, `rgba(20,38,59,${a})`); g.addColorStop(1, 'rgba(20,38,59,0)');
    ctx.save(); ctx.translate(x, y); ctx.scale(1, sq); ctx.translate(-x, -y);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, w / 2, 0, TAU); ctx.fill(); ctx.restore();
  }
  // 색 섞기: '#rrggbb' → 밝게(+)/어둡게(−)
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (k >= 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; } else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
    return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
  }
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

  /* ---- 입자 ---- */
  // 크기 s: 산소를 1로 본 그림 속 크기(모형)
  const PT = {
    H: { c: '#f2f4f6', s: 0.66, name: '수소', edge: '#9fabb8' },
    He: { c: '#56c6dc', s: 0.6, name: '헬륨' },
    C: { c: '#3a4049', s: 0.95, name: '탄소' },
    N: { c: '#3f72d9', s: 0.95, name: '질소' },
    O: { c: '#e2473d', s: 0.9, name: '산소' },
    Na: { c: '#9b63db', s: 1.15, name: '나트륨' },
    Cl: { c: '#3fb35a', s: 1.1, name: '염소' },
    Si: { c: '#d39b4c', s: 1.1, name: '규소' },
    Al: { c: '#a9b5c2', s: 1.05, name: '알루미늄' },
    Cu: { c: '#d27536', s: 1.0, name: '구리' },
    S: { c: '#e8c337', s: 1.05, name: '황' },
    Fe: { c: '#7d6b62', s: 1.0, name: '철' },
  };
  function ball(ctx, x, y, r, el, a = 1) {
    const p = PT[el] || { c: el };
    const c = p.c;
    const g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.08, x, y, r * 1.02);
    g.addColorStop(0, shade(c, 0.42)); g.addColorStop(0.55, c); g.addColorStop(1, shade(c, -0.32));
    ctx.globalAlpha = a;
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = p.edge ? rgba('#5f6e7e', 0.55) : rgba('#14263b', 0.22); ctx.lineWidth = Math.max(0.6, r * 0.07); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // 묶음 모양(입자 모형): [원소, x, y, z] 단위는 산소 반지름
  const UNIT = {
    H2O: [['O', 0, 0, 0], ['H', -0.78, 0.6, 0.3], ['H', 0.78, 0.6, 0.3]],
    H2: [['H', -0.36, 0, 0], ['H', 0.36, 0, 0.1]],
    O2: [['O', -0.42, 0, 0], ['O', 0.42, 0, 0.1]],
    He: [['He', 0, 0, 0]],
    CO2: [['C', 0, 0, 0], ['O', -0.95, 0, 0.1], ['O', 0.95, 0, 0.1]],
    CO: [['C', -0.45, 0, 0], ['O', 0.5, 0, 0.1]],
    CH4: [['C', 0, 0, 0], ['H', -0.72, -0.5, 0.3], ['H', 0.72, -0.5, 0.3], ['H', -0.45, 0.72, -0.3], ['H', 0.5, 0.7, 0.4]],
    NH3: [['N', 0, -0.1, 0], ['H', -0.78, 0.45, 0.3], ['H', 0.78, 0.45, 0.3], ['H', 0, 0.8, 0.5]],
  };
  function unit(ctx, x, y, R, u, ang = 0, a = 1) {
    const list = (typeof u === 'string' ? UNIT[u] : u).map(([e, dx, dy, z]) => {
      const c = Math.cos(ang), s = Math.sin(ang);
      return { e, x: x + (dx * c - dy * s) * R, y: y + (dx * s + dy * c) * R, z: z || 0 };
    }).sort((p, q) => p.z - q.z);
    list.forEach((p) => ball(ctx, p.x, p.y, R * (PT[p.e] ? PT[p.e].s : 1), p.e, a));
  }

  /* ---- 돋보기 속 입자 무리 ----
     spec: { state:'gas'|'liquid'|'solid', unit:'H2O'|…|[[…]], n, r(입자 반지름, 돋보기 반지름 1 기준), speed,
             lattice: 'square'|'hex', mix:[원소…](격자 칸마다 돌아가며), chains:[[원소…]…] } */
  function swarm(spec) {
    const R = rng(spec.seed || 7), S = { spec, list: [], t: 0 };
    const r = spec.r || 0.085;
    if (spec.state === 'solid') {
      const step = r * (spec.gap || 2.15), rows = [];
      for (let yy = -1 + step / 2; yy < 1; yy += step * (spec.lattice === 'hex' ? 0.87 : 1)) rows.push(yy);
      rows.forEach((yy, ri) => {
        const off = spec.lattice === 'hex' && ri % 2 ? step / 2 : 0;
        for (let xx = -1 + step / 2 + off - step; xx < 1 + step; xx += step) {
          if (xx * xx + yy * yy > 1.3) continue;
          const ci = Math.round((xx + 2) / step) + ri;
          const el = spec.mix ? spec.mix[ci % spec.mix.length] : null;
          const jx = spec.jitter ? (R() - 0.5) * spec.jitter * step : 0, jy = spec.jitter ? (R() - 0.5) * spec.jitter * step : 0;
          S.list.push({ x: xx + jx, y: yy + jy, hx: xx + jx, hy: yy + jy, ph: R() * TAU, u: el ? [[el, 0, 0, 0]] : (spec.unit || 'O2'), a: spec.rot ? R() * TAU : 0 });
        }
      });
    } else if (spec.chains) {
      // 긴 사슬(플라스틱·비누): 사슬 여러 개가 엉켜 있음
      spec.chains.forEach((ch, k) => {
        let x = -0.85 + R() * 0.3, y = -0.75 + k * (1.5 / spec.chains.length) + R() * 0.1, d = (R() - 0.5) * 0.6;
        const pts = [];
        ch.forEach((el, i) => { pts.push({ el, x, y, ox: 0, oy: 0 }); d += (R() - 0.5) * 0.9; x += Math.cos(d) * r * 1.55; y += Math.sin(d) * r * 1.2; if (x > 0.85) d = Math.PI - d; });
        S.list.push({ chain: pts, ph: R() * TAU });
      });
    } else {
      const n = spec.n || 12; let tries = 0;
      while (S.list.length < n && tries++ < 4000) {
        const a = R() * TAU, d = Math.sqrt(R()) * 0.86, x = Math.cos(a) * d, y = Math.sin(a) * d;
        const md = spec.state === 'gas' ? r * 4 : r * 2.6;
        if (S.list.some((p) => (p.x - x) ** 2 + (p.y - y) ** 2 < md * md)) continue;
        const sp = (spec.speed || (spec.state === 'gas' ? 0.42 : 0.06)) * (0.6 + R() * 0.8), va = R() * TAU;
        S.list.push({ x, y, vx: Math.cos(va) * sp, vy: Math.sin(va) * sp, a: R() * TAU, va: (R() - 0.5) * (spec.state === 'gas' ? 2.4 : 0.8), ph: R() * TAU });
      }
    }
    S.step = (dt) => {
      S.t += dt; const st = spec.state;
      if (st === 'solid') { S.list.forEach((p) => { const w = r * 0.07; p.x = p.hx + Math.sin(S.t * 9 + p.ph) * w; p.y = p.hy + Math.cos(S.t * 8 + p.ph * 1.3) * w; }); return; }
      if (spec.chains) return;
      S.list.forEach((p) => {
        if (st === 'liquid') { p.vx += (Math.random() - 0.5) * dt * 0.5; p.vy += (Math.random() - 0.5) * dt * 0.5; const sp = Math.hypot(p.vx, p.vy), mx = spec.speed || 0.08; if (sp > mx) { p.vx *= mx / sp; p.vy *= mx / sp; } }
        p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt;
        const d = Math.hypot(p.x, p.y), lim = 0.9 - r;
        if (d > lim) { const nx = p.x / d, ny = p.y / d, dot = p.vx * nx + p.vy * ny; if (dot > 0) { p.vx -= 2 * dot * nx; p.vy -= 2 * dot * ny; } p.x = nx * lim; p.y = ny * lim; }
      });
      if (st === 'liquid') {
        const md = r * 2.5;
        for (let i = 0; i < S.list.length; i++) for (let j = i + 1; j < S.list.length; j++) {
          const p = S.list[i], q = S.list[j], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
          if (d > 0 && d < md) { const k = (md - d) / d * 0.5; p.x -= dx * k; p.y -= dy * k; q.x += dx * k; q.y += dy * k; }
        }
      }
    };
    S.draw = (ctx, cx, cy, Rl) => {
      const rr2 = r * Rl;
      if (spec.chains) {
        S.list.forEach((c) => {
          const pts = c.chain;
          ctx.strokeStyle = 'rgba(20,38,59,.18)'; ctx.lineWidth = rr2 * 0.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath(); pts.forEach((p, i) => { const w = Math.sin(S.t * 2 + c.ph + i) * 0.006; const X = cx + (p.x + w) * Rl, Y = cy + (p.y - w) * Rl; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
          pts.forEach((p, i) => { const w = Math.sin(S.t * 2 + c.ph + i) * 0.006; ball(ctx, cx + (p.x + w) * Rl, cy + (p.y - w) * Rl, rr2 * (PT[p.el] ? PT[p.el].s : 1), p.el); });
        });
        return;
      }
      const list = S.list.slice().sort((p, q) => p.y - q.y);
      list.forEach((p) => unit(ctx, cx + p.x * Rl, cy + p.y * Rl, rr2, p.u || spec.unit, p.a || 0));
    };
    return S;
  }
  // 둥근 돋보기: 테 두께 · 그림자 · 흰 속
  function lens(ctx, x, y, R, sw, o = {}) {
    ctx.save();
    contact(ctx, x, y + R * 0.98, R * 1.7, 0.16, 0.2);
    ctx.fillStyle = o.bg || '#fbfdff'; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    if (o.tint) { const g = ctx.createRadialGradient(x, y - R * 0.3, R * 0.1, x, y, R); g.addColorStop(0, rgba(o.tint, 0.05)); g.addColorStop(1, rgba(o.tint, 0.2)); ctx.fillStyle = g; ctx.fill(); }
    ctx.beginPath(); ctx.arc(x, y, R - 1, 0, TAU); ctx.clip();
    sw && sw.draw(ctx, x, y, R);
    ctx.restore();
    const g = ctx.createLinearGradient(x, y - R, x, y + R); g.addColorStop(0, '#e8edf2'); g.addColorStop(1, '#a9b6c3');
    ctx.strokeStyle = g; ctx.lineWidth = Math.max(5, R * 0.075); ctx.beginPath(); ctx.arc(x, y, R + ctx.lineWidth / 2 - 1, 0, TAU); ctx.stroke();
    if (o.on) { ctx.strokeStyle = BLUE; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, R + Math.max(5, R * 0.075) + 2, 0, TAU); ctx.stroke(); }
  }
  // 돋보기와 가리키는 곳을 잇는 얇은 선
  function leader(ctx, x0, y0, x1, y1) {
    ctx.save(); ctx.strokeStyle = 'rgba(90,107,126,.55)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(90,107,126,.8)'; ctx.beginPath(); ctx.arc(x1, y1, 3, 0, TAU); ctx.fill(); ctx.restore();
  }
  // 범례 HTML: 원소 기호 목록 → 색 점 + 이름
  const legend = (els) => els.map((e) => `<span class="lg"><i style="background:${PT[e].c}${e === 'H' ? ';box-shadow:inset 0 0 0 1px #9fabb8' : ''}"></i>${PT[e].name}</span>`).join('');
  const dot = (e) => `<i class="pdot" style="background:${PT[e].c}${e === 'H' ? ';box-shadow:inset 0 0 0 1px #9fabb8' : ''}"></i>`;

  return { TAU, BLUE, reduce, clamp, lerp, ease, easeOut, sstep, rng, surface, overlay, addLoop, tweens, rr, white, desk, contact, shade, rgba, PT, UNIT, ball, unit, swarm, lens, leader, legend, dot };
})();
