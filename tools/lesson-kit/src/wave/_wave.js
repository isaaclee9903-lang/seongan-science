/* ===== 파동 그림 도구 (캔버스 2D) =====
   WV.tank(host, 옵션)       물결파 수조(옆에서 본 모습). 막대·탁구공·물 알갱이·마루 비추기
   WV.graph(host, 옵션)      파동의 요소 그림(그림 Ⅲ-13 형식). 진동수·파장·진폭 바꾸기, 목표 파동, 누른 곳 찾기
   WV.timeline(host, 그래프)  파란 점의 높이 기록(2초 동안). 주기·진동수 세기
   WV.strip(host)            그림 Ⅲ-12 형식 차례 사진 4장
   WV.ripple(host)           위에서 본 물결(동심원)
   그림 원칙(2026-10-15 다시 그림): 흰 바탕, 라스 파랑 한 색조 + 무채색, 매트한 질감, 얇은 선.
   화살표는 꼭 필요한 곳에만 얇게. 매질이 제자리에서 오르내리는 모습은 움직임과 얇은 범위선으로 보여 준다.
   매질은 위아래로만 진동하는 모형이에요(교과서 설명대로). 개념 이해를 위한 모형이며 수식은 화면에 쓰지 않아요. */
window.WV = (() => {
  const TAU = Math.PI * 2;
  const BLUE = '#0e63b3', INK = '#14263b';
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---- 캔버스 · 이름표 · 반복 ---- */
  // 그림 좌표(W×H)를 칸 크기에 맞게 가운데 맞춤(contain). 남는 곳은 각 그림이 배경으로 채운다.
  function surface(host, W, H, onFit) {
    const cv = document.createElement('canvas'); cv.className = 'wvc'; host.appendChild(cv);
    const box = document.createElement('div'); box.className = 'olay'; host.appendChild(box);
    const ctx = cv.getContext('2d'); const m = { k: 1, ox: 0, oy: 0, dpr: 1 };
    function fit() {
      const r = host.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      m.k = Math.min(r.width / W, r.height / H); m.ox = (r.width - W * m.k) / 2; m.oy = (r.height - H * m.k) / 2; m.dpr = dpr;
      Object.assign(box.style, { left: m.ox + 'px', top: m.oy + 'px', width: W * m.k + 'px', height: H * m.k + 'px', right: 'auto', bottom: 'auto' });
      if (onFit) onFit();
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
      box,
      put(id, x, y, html, cls = '') {
        let e = map[id]; if (!e) { e = document.createElement('span'); box.appendChild(e); map[id] = e; }
        const c = 'ol ' + cls; if (e.className !== c) e.className = c;
        if (e._h !== html) { e.innerHTML = html; e._h = html; }
        e.dataset.id = id; e.style.left = (x / S.W * 100).toFixed(2) + '%'; e.style.top = (y / S.H * 100).toFixed(2) + '%'; e.hidden = false; return e;
      },
      hide(id) { if (map[id]) map[id].hidden = true; },
      hideAll() { Object.values(map).forEach((e) => (e.hidden = true)); },
    };
  }
  const loops = new Set();
  let last = 0;
  function tick(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0); last = now;
    loops.forEach((L) => { try { if (L.host.offsetParent !== null) { const r = L.host.getBoundingClientRect(); if (r.bottom > -50 && r.top < innerHeight + 50) L.fn(dt); } } catch (e) { loops.delete(L); window.SM_err ? window.SM_err('파동 그림', e) : console.error(e); } });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  const addLoop = (host, fn) => { const L = { host, fn }; loops.add(L); return L; };

  // 얇은 선과 작은 촉
  function arrow(ctx, x1, y1, x2, y2, col, w = 1.8, head = 7) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.moveTo(x2 - Math.cos(a - 0.5) * head, y2 - Math.sin(a - 0.5) * head); ctx.lineTo(x2, y2); ctx.lineTo(x2 - Math.cos(a + 0.5) * head, y2 - Math.sin(a + 0.5) * head);
    ctx.stroke(); ctx.restore();
  }
  // 치수선 |—|
  function dim(ctx, x1, y1, x2, y2, col = 'rgba(20,38,59,.6)') {
    const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a) * 6, ny = Math.cos(a) * 6;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.moveTo(x1 - nx, y1 - ny); ctx.lineTo(x1 + nx, y1 + ny); ctx.moveTo(x2 - nx, y2 - ny); ctx.lineTo(x2 + nx, y2 + ny); ctx.stroke(); ctx.restore();
  }
  // 매트한 흰 탁구공
  function ball(ctx, x, y, r) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#f1f4f7'); g.addColorStop(1, '#c9d2dc');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(20,38,59,.18)'; ctx.lineWidth = 1; ctx.stroke();
  }
  // 강조 점(파란 점)
  function keyDot(ctx, x, y, r = 8) {
    ctx.save(); ctx.fillStyle = 'rgba(14,99,179,.14)'; ctx.beginPath(); ctx.arc(x, y, r + 6, 0, TAU); ctx.fill();
    ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore();
  }
  // 제자리 범위선 (위아래 끝에 짧은 가로선)
  function track(ctx, x, y1, y2, col = 'rgba(14,99,179,.45)') {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.moveTo(x - 6, y1); ctx.lineTo(x + 6, y1); ctx.moveTo(x - 6, y2); ctx.lineTo(x + 6, y2); ctx.stroke(); ctx.restore();
  }
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = (c, al = 1) => `rgba(${c[0]},${c[1]},${c[2]},${al})`;

  /* ================= 물결파 수조 ================= */
  function tank(host, o = {}) {
    const W = 1000, H = o.H || 540;
    const S = surface(host, W, H), ctx = S.ctx, ov = overlay(S);
    const X0 = 60, X1 = 900, YB = H - 60, YT = H > 560 ? 170 : 150, DX = 40, DY = -46;
    const YW = Math.round(YB - (YB - YT) * 2 / 3);
    const XS = o.stickX || 176, XB = o.ballX || 620;
    const st = { t: 0, run: true, speed: 1, f: o.f || 0.9, v: o.v || 230, A: o.A || 18, segs: [], dots: !!o.dots, crest: !!o.crest, guide: o.guide !== false, labels: o.labels !== false };
    let follow = null, crestFrom = null, crestMax = 0;
    const listeners = [];
    const T = () => 1 / st.f;
    function src(tau) {
      for (const s of st.segs) if (tau >= s.t0 && tau < s.t1) return -st.A * Math.sin(TAU * st.f * (tau - s.t0));
      return 0;
    }
    const d = (x, t = st.t) => src(t - Math.abs(x - XS) / st.v);
    const tapping = () => st.segs.some((s) => s.t1 === Infinity);
    function tapOnce() { if (tapping()) return; const t0 = Math.max(st.t, ...st.segs.map((s) => s.t1)); st.segs.push({ t0, t1: t0 + T() }); st.run = true; }
    function tapStart() { if (tapping()) return; const t0 = Math.max(st.t, ...st.segs.map((s) => (s.t1 === Infinity ? 0 : s.t1))); st.segs.push({ t0, t1: Infinity }); st.run = true; }
    function tapStop() { st.segs.forEach((s) => { if (s.t1 === Infinity) s.t1 = s.t0 + Math.max(1, Math.ceil((st.t - s.t0) * st.f)) / st.f; }); }
    function reset() { st.t = 0; st.segs = []; follow = null; crestFrom = null; crestMax = 0; }
    function crests() {
      const out = [];
      st.segs.forEach((s, si) => {
        const tEnd = Math.min(s.t1, st.t);
        for (let k = 0; k < 400; k++) { const tau = s.t0 + (k + 0.75) / st.f; if (tau >= tEnd) break; const x = XS + st.v * (st.t - tau); if (x <= X1 - 6) out.push({ id: si + ':' + k, x }); }
      });
      return out;
    }
    function ballInfo() {
      const tl = st.t - Math.abs(XB - XS) / st.v; let n = 0, moving = false;
      st.segs.forEach((s) => { if (tl > s.t0) { const e = Math.min(tl, s.t1); n += Math.floor((e - s.t0) * st.f + 1e-6); if (tl < s.t1) moving = true; } });
      return { n, moving, arrived: st.segs.some((s) => tl > s.t0) };
    }
    const mid = (x) => YW + DY / 2 - d(x); // 수면 가운데 줄(탁구공·막대가 있는 깊이)

    function drawBg() {
      const [fx, fy, fw, fh] = S.full();
      ctx.fillStyle = '#f7f9fb'; ctx.fillRect(fx, fy, fw, fh);
      const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      sh.addColorStop(0, 'rgba(20,38,59,.16)'); sh.addColorStop(1, 'rgba(20,38,59,0)');
      ctx.save(); ctx.translate((X0 + X1 + DX) / 2, YB + 6); ctx.scale((X1 - X0) * 0.62, 26); ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
    }
    function backGlass() {
      ctx.save(); ctx.strokeStyle = 'rgba(20,38,59,.13)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(X0 + DX, YB + DY); ctx.lineTo(X0 + DX, YT + DY); ctx.lineTo(X1 + DX, YT + DY);
      ctx.moveTo(X0 + DX, YB + DY); ctx.lineTo(X1 + DX, YB + DY);
      ctx.moveTo(X0, YB); ctx.lineTo(X0 + DX, YB + DY); ctx.moveTo(X0, YT); ctx.lineTo(X0 + DX, YT + DY); ctx.stroke();
      ctx.fillStyle = 'rgba(225,233,241,.6)'; ctx.fillRect(X0 + DX, YT + DY, X1 - X0, YB - YT);
      ctx.restore();
    }
    function water() {
      const step = 4, xs = [];
      for (let x = X0; x <= X1 + 0.1; x += step) xs.push(x);
      const dv = xs.map((x) => d(x));
      const dR = dv[dv.length - 1];
      // 오른쪽 옆면
      ctx.fillStyle = '#3f86c4';
      ctx.beginPath(); ctx.moveTo(X1, YW - dR); ctx.lineTo(X1 + DX, YW + DY - dR); ctx.lineTo(X1 + DX, YB + DY); ctx.lineTo(X1, YB); ctx.closePath(); ctx.fill();
      // 수면 (기울기에 따라 아주 조금 밝기 차이)
      const lite = [214, 234, 249], base = [180, 214, 240], dark = [140, 188, 226];
      for (let i = 0; i < xs.length - 1; i++) {
        const k = Math.max(-1, Math.min(1, (dv[i + 1] - dv[i]) / step * 2.4));
        ctx.fillStyle = rgb(k > 0 ? mix(base, lite, k) : mix(base, dark, -k));
        const xa = xs[i], xb = xs[i + 1] + 0.7;
        ctx.beginPath(); ctx.moveTo(xa, YW - dv[i]); ctx.lineTo(xa + DX, YW + DY - dv[i]); ctx.lineTo(xb + DX, YW + DY - dv[i + 1]); ctx.lineTo(xb, YW - dv[i + 1]); ctx.closePath(); ctx.fill();
      }
      return { xs, dv };
    }
    function frontWater(xs, dv) {
      ctx.save();
      ctx.beginPath(); xs.forEach((x, i) => (i ? ctx.lineTo(x, YW - dv[i]) : ctx.moveTo(x, YW - dv[i]))); ctx.lineTo(X1, YB); ctx.lineTo(X0, YB); ctx.closePath();
      const g = ctx.createLinearGradient(0, YW - 20, 0, YB); g.addColorStop(0, '#6aaee2'); g.addColorStop(1, '#2a6fb2');
      ctx.fillStyle = g; ctx.fill(); ctx.clip();
      if (st.dots) {
        // 물 알갱이: 깊을수록 조금 진동, 모두 제자리에서 위아래로만
        for (let x = X0 + 16; x < X1; x += 30) for (let r = 0; r < 6; r++) {
          const dep = 22 + r * 44, k = Math.exp(-dep / 90), y = YW + dep - d(x) * k;
          ctx.fillStyle = `rgba(255,255,255,${0.55 - r * 0.06})`; ctx.beginPath(); ctx.arc(x, y, 3.2 - r * 0.2, 0, TAU); ctx.fill();
        }
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.8; ctx.beginPath();
      xs.forEach((x, i) => (i ? ctx.lineTo(x, YW - dv[i]) : ctx.moveTo(x, YW - dv[i]))); ctx.stroke();
    }
    function stick() {
      const x = XS + DX / 2, tip = mid(XS) + 20, w = 12, top = S.full()[1] - 4;
      const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, '#3a4450'); g.addColorStop(0.45, '#5b6673'); g.addColorStop(1, '#2c343e');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w / 2, top); ctx.lineTo(x - w / 2, tip - w / 2); ctx.arc(x, tip - w / 2, w / 2, Math.PI, 0, true); ctx.lineTo(x + w / 2, top); ctx.closePath(); ctx.fill();
      const ws = mid(XS + 1);
      if (tip > ws) { ctx.fillStyle = 'rgba(120,180,228,.55)'; ctx.fillRect(x - w / 2, ws, w, tip - ws); }
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, ws, w * 0.9, 3, 0, 0, TAU); ctx.stroke();
      return { x };
    }
    function drawBall() {
      const r = 19, x = XB + DX / 2, ws = mid(XB), y = ws - r * 0.45;
      ctx.fillStyle = 'rgba(14,60,110,.18)'; ctx.beginPath(); ctx.ellipse(x + 5, ws + 2, r * 1.1, 4.5, 0, 0, TAU); ctx.fill();
      ball(ctx, x, y, r);
      ctx.save(); ctx.beginPath(); ctx.rect(x - r - 2, ws, 2 * r + 4, r * 2); ctx.clip();
      ctx.fillStyle = 'rgba(150,200,238,.6)'; ctx.beginPath(); ctx.arc(x, y, r + 0.5, 0, TAU); ctx.fill(); ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, ws, r, 3.5, 0, 0, TAU); ctx.stroke();
      return { x, y, ws };
    }
    function frontGlass() {
      ctx.save();
      ctx.strokeStyle = 'rgba(20,38,59,.28)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(X0, YT, X1 - X0, YB - YT);
      ctx.beginPath(); ctx.moveTo(X1, YT); ctx.lineTo(X1 + DX, YT + DY); ctx.lineTo(X1 + DX, YB + DY); ctx.lineTo(X1, YB);
      ctx.moveTo(X0, YT); ctx.lineTo(X0 + DX, YT + DY); ctx.lineTo(X1 + DX, YT + DY); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(X0, YT, X1 - X0, YB - YT);
      ctx.fillStyle = '#dde3ea'; ctx.fillRect(X0 - 2, YB, X1 - X0 + 4, 6);
      ctx.restore();
    }
    function draw() {
      S.begin();
      drawBg();
      // 마루 비추기: 따라가는 마루 위치에 옅은 파란 기둥
      const cr = crests();
      let fx = null;
      if (st.crest && cr.length) {
        let c = follow && cr.find((q) => q.id === follow);
        if (!c) { c = cr.filter((q) => q.x > XS + 40).sort((a, b) => a.x - b.x)[0]; if (c) { follow = c.id; crestFrom = c.x; } }
        if (c) fx = c.x;
      }
      backGlass();
      if (fx !== null) { const px = fx + DX / 2; const g = ctx.createLinearGradient(px - 26, 0, px + 26, 0); g.addColorStop(0, 'rgba(14,99,179,0)'); g.addColorStop(0.5, 'rgba(14,99,179,.16)'); g.addColorStop(1, 'rgba(14,99,179,0)'); ctx.fillStyle = g; ctx.fillRect(px - 26, YT + DY - 30, 52, YB - YT + 30); }
      const { xs, dv } = water();
      stick();
      const bl = drawBall();
      frontWater(xs, dv);
      frontGlass();
      if (fx !== null) { const px = fx + DX / 2; ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(px, mid(fx) - 4, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
      // 탁구공이 오르내리는 범위
      if (st.guide) track(ctx, bl.x + 34, YW + DY / 2 - st.A - 8.5, YW + DY / 2 + st.A - 8.5);
      const bi = ballInfo();
      if (st.labels) {
        ov.put('stick', XS + DX / 2 - 14, YT + DY - 14, '막대', 'tx la');
        ov.put('ball', bl.x + 50, YW + DY / 2 - 9, '탁구공', 'tx ra');
        if (fx !== null) ov.put('crest', fx + DX / 2, YT + DY - 44, '마루', 'tx b'); else ov.hide('crest');
      }
      if (fx !== null) crestMax = Math.max(crestMax, fx - crestFrom);
      const out = { t: st.t, ball: bi, crestTravel: crestMax, tapping: tapping() };
      listeners.forEach((f) => f(out));
    }
    addLoop(host, (dt) => { if (st.run) st.t += dt * st.speed * (reduce ? 0.6 : 1); draw(); });
    draw();
    return {
      st, tapOnce, tapStart, tapStop, reset, draw, tapping, ballInfo,
      set(p) { Object.assign(st, p); if ('crest' in p && !p.crest) follow = null; },
      onFrame(f) { listeners.push(f); },
    };
  }

  /* ================= 파동의 요소 그림 ================= */
  function graph(host, o = {}) {
    const W = o.W || 1000, H = o.H || 440, C = o.cell || 40, Y0 = H / 2, XL = o.xl ?? 20, XR = W - (o.xr ?? 20);
    const S = surface(host, W, H), ctx = S.ctx, ov = overlay(S);
    const st = Object.assign({ t: 0, run: true, speed: 1, f: 1, lam: 6, A: 2, beads: true, hi: 'hi' in o ? o.hi : 12, anno: {}, ghost: null, marks: [], grid: true, phase0: 0 }, o);
    const disp = (x, p = st, t = st.t) => p.A * C * Math.sin(TAU * ((x - XL) / (p.lam * C) - p.f * t) + st.phase0);
    const listeners = [];
    function extremes(kind, p = st, t = st.t) {
      const L = p.lam * C, out = [], base = kind === 'crest' ? 0.25 : 0.75;
      const s0 = base - st.phase0 / TAU + p.f * t, frac = s0 - Math.floor(s0);
      for (let x = XL + frac * L - L; x <= XR + 1; x += L) if (x >= XL - 1) out.push(x);
      return out;
    }
    function pathOf(p, t) { ctx.beginPath(); for (let x = XL; x <= XR; x += 2) { const y = Y0 - disp(x, p, t); x === XL ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } }
    function draw() {
      S.begin();
      const [gx, gy, gw, gh] = S.full();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(gx, gy, gw, gh);
      if (st.grid) {
        ctx.strokeStyle = 'rgba(20,38,59,.06)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let x = XL - Math.ceil((XL - gx) / C) * C; x <= gx + gw; x += C) { ctx.moveTo(x, gy); ctx.lineTo(x, gy + gh); }
        for (let y = Y0 - Math.ceil((Y0 - gy) / C) * C; y <= gy + gh; y += C) { ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); }
        ctx.stroke();
      }
      // 진동 중심
      ctx.save(); ctx.strokeStyle = 'rgba(20,38,59,.35)'; ctx.lineWidth = 1.2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(XL, Y0); ctx.lineTo(XR, Y0); ctx.stroke(); ctx.restore();
      // 목표 파동
      if (st.ghost) {
        ctx.save(); ctx.strokeStyle = 'rgba(90,107,126,.6)'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 7]); ctx.lineCap = 'round'; pathOf(st.ghost, st.t); ctx.stroke(); ctx.restore();
        if (st.hi != null) { const hx = XL + st.hi * C, hy = Y0 - disp(hx, st.ghost); ctx.strokeStyle = 'rgba(90,107,126,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy, 8, 0, TAU); ctx.stroke(); }
      }
      // 파동 선
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#78a5d3'; ctx.lineWidth = 3.2; pathOf(st, st.t); ctx.stroke(); ctx.restore();
      // 매질의 점
      if (st.beads) {
        for (let i = 0; XL + i * C <= XR; i++) {
          if (i === st.hi) continue;
          const x = XL + i * C, y = Y0 - disp(x);
          ctx.fillStyle = '#fff'; ctx.strokeStyle = '#5f738a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, 4.6, 0, TAU); ctx.fill(); ctx.stroke();
        }
      }
      const a = st.anno, cr = extremes('crest'), tr = extremes('trough'), L = st.lam * C, Am = st.A * C;
      // 파란 점(따라가는 매질)과 제자리 범위
      if (st.hi != null) {
        const x = XL + st.hi * C, y = Y0 - disp(x);
        track(ctx, x, Y0 - Am, Y0 + Am);
        keyDot(ctx, x, y);
      }
      ['cr0', 'cr1', 'tr0', 'lam', 'amp', 'amp2', 'mid', 'dir', 'vib'].forEach((k) => ov.hide(k));
      const c1 = cr.find((x) => x > XL + 30 && x + L < XR - 10);
      const t1 = tr.find((x) => x > (c1 ?? XL) && x < XR - 10);
      const ring = (x, y) => { ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.stroke(); };
      const cls = (k, d) => (a.clsOf && a.clsOf[k]) || d;
      if (a.crest && c1 !== undefined) { ring(c1, Y0 - Am); ov.put('cr0', c1, Y0 - Am - 24, a.crestTxt || '마루', cls('crest', 'tx')); if (c1 + L < XR && !a.one) { ring(c1 + L, Y0 - Am); ov.put('cr1', c1 + L, Y0 - Am - 24, a.crestTxt || '마루', cls('crest', 'tx')); } }
      if (a.trough && t1 !== undefined) { ring(t1, Y0 + Am); ov.put('tr0', t1, Y0 + Am + 24, a.troughTxt || '골', cls('trough', 'tx')); }
      if (a.lam && c1 !== undefined) {
        const yy = Y0 - Am - 50;
        ctx.save(); ctx.strokeStyle = 'rgba(20,38,59,.25)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(c1, Y0 - Am - 10); ctx.lineTo(c1, yy); ctx.moveTo(c1 + L, Y0 - Am - 10); ctx.lineTo(c1 + L, yy); ctx.stroke(); ctx.restore();
        dim(ctx, c1, yy, c1 + L, yy);
        ov.put('lam', c1 + L / 2, yy, a.lamTxt || '파장', cls('lam', 'tx'));
      }
      if (a.amp && c1 !== undefined) {
        const xa = c1 + L * 0.5 + 0.0; // 마루와 골 사이가 아닌 곳: 다음 마루 위치에 표시
        const xc = c1 + L;
        dim(ctx, xc, Y0, xc, Y0 - Am);
        ov.put('amp', xc + 12, Y0 - Am / 2, a.ampTxt || '진폭', cls('amp', 'tx') + ' ra');
        if (t1 !== undefined && !a.one) { dim(ctx, t1, Y0, t1, Y0 + Am); ov.put('amp2', t1 + 12, Y0 + Am / 2, a.ampTxt || '진폭', cls('amp', 'tx') + ' ra'); }
        void xa;
      }
      if (a.mid) ov.put('mid', XR + 10, Y0, a.midTxt || '진동 중심', cls('mid', 'tx m') + ' ra');
      if (a.dir) { arrow(ctx, XL + 8, 30, XL + 70, 30, BLUE); ov.put('dir', XL + 80, 30, '파동의 진행 방향', 'tx b ra'); }
      if (a.vib && st.hi != null) ov.put('vib', XL + st.hi * C + 14, Y0 - Am - 16 < 50 ? Y0 + Am + 18 : Y0 - Am - 16, '매질의 진동 방향 ↕', 'tx b ra');
      st.marks.forEach((m) => { ctx.save(); ctx.strokeStyle = m.ok ? '#1f9d5c' : '#d9534f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(m.x, m.y, 18, 0, TAU); ctx.stroke(); ctx.restore(); });
      listeners.forEach((f) => f(st));
    }
    addLoop(host, (dt) => { if (st.run) st.t += dt * st.speed * (reduce ? 0.6 : 1); draw(); });
    draw();
    return {
      st, draw, extremes, disp, C, Y0, XL, XR, W, H, ov,
      set(p) { Object.assign(st, p); draw(); },
      onFrame(f) { listeners.push(f); },
      hiY(t) { return disp(XL + st.hi * C, st, t); },
      hit(e) {
        const [x, y] = S.toLocal(e), L = st.lam * C, Am = st.A * C;
        const best = (kind) => extremes(kind).reduce((b, cx) => (Math.abs(cx - x) < Math.abs(b - x) ? cx : b), -1e9);
        const c = best('crest'), t = best('trough');
        if (Math.abs(c - x) < L * 0.16 && Math.abs(y - (Y0 - Am)) < 46) return { kind: 'crest', x: c, y: Y0 - Am };
        if (Math.abs(t - x) < L * 0.16 && Math.abs(y - (Y0 + Am)) < 46) return { kind: 'trough', x: t, y: Y0 + Am };
        return { kind: null, x, y };
      },
      canvas: S.cv,
    };
  }

  /* ================= 파란 점 높이 기록 (2초) ================= */
  function timeline(host, G, o = {}) {
    const W = 1000, H = o.H || 190, XA = 70, XZ = 960, SEC = (XZ - XA) / 2, Y0 = H / 2 - 2, AMP = H / 2 - 40;
    const S = surface(host, W, H), ctx = S.ctx, ov = overlay(S);
    const st = { on: false, wait: false, t0: 0, tau: 0, f: 1, pts: [], done: false };
    const listeners = [];
    function clear() { st.tStar = undefined; st.on = false; st.wait = false; st.pts = []; st.tau = 0; st.done = false; for (let k = 0; k < 8; k++) ov.hide('c' + k); }
    function start() { clear(); st.wait = true; st.f = G.st.f; }
    function draw() {
      S.begin();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(...S.full());
      ctx.save(); ctx.strokeStyle = 'rgba(20,38,59,.3)'; ctx.lineWidth = 1.2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(XA, Y0); ctx.lineTo(XZ, Y0); ctx.stroke(); ctx.restore();
      [0, 0.5, 1, 1.5, 2].forEach((s) => { const x = XA + s * SEC; ctx.strokeStyle = s === 1 ? 'rgba(20,38,59,.7)' : 'rgba(20,38,59,.12)'; ctx.lineWidth = s === 1 ? 1.6 : 1; ctx.beginPath(); ctx.moveTo(x, 22); ctx.lineTo(x, H - 22); ctx.stroke(); });
      const T = 1 / st.f, n = Math.floor(2 * st.f + 1e-6);
      if (st.on || st.done) {
        for (let k = 0; k < n; k++) {
          const xa = XA + k * T * SEC, xb = XA + (k + 1) * T * SEC;
          if (st.tau < (k + 1) * T - 1e-6) { ov.hide('c' + k); continue; }
          if (k % 2 === 0) { ctx.fillStyle = 'rgba(14,99,179,.07)'; ctx.fillRect(xa, 22, xb - xa, H - 44); }
          ov.put('c' + k, (xa + xb) / 2, 21, (xb - xa > 150 ? `${k + 1}번째 진동 · ${+T.toFixed(2)}초` : `${k + 1}`), 'tk b');
        }
      }
      if (st.pts.length > 1) {
        ctx.save(); ctx.strokeStyle = BLUE; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath();
        st.pts.forEach(([tau, y], i) => { const x = XA + tau * SEC, yy = Y0 - y * AMP; i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }); ctx.stroke(); ctx.restore();
        for (let k = 0; k * T <= st.tau + 1e-6 && k * T <= 2 + 1e-6; k++) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(XA + k * T * SEC, Y0 - AMP, 3.5, 0, TAU); ctx.fill(); }
        const [lt, ly] = st.pts[st.pts.length - 1]; keyDot(ctx, XA + lt * SEC, Y0 - ly * AMP, 6);
      }
      ov.put('s0', XA, H - 2, '0초', 'tk'); ov.put('s1', XA + SEC, H - 2, '1초', 'tk b'); ov.put('s2', XZ, H - 2, '2초', 'tk');
      ov.put('hi', XA - 10, Y0 - AMP, '마루', 'tk la'); ov.put('lo', XA - 10, Y0 + AMP, '골', 'tk la');
      if (st.wait) ov.put('msg', (XA + XZ) / 2, Y0, '파란 점이 마루에 올 때 시작해요', 'tx'); else if (!st.on && !st.done) ov.put('msg', (XA + XZ) / 2, Y0, '‘2초 동안 재기’를 누르면 파란 점의 높이를 기록해요', 'tx m'); else ov.hide('msg');
    }
    G.onFrame(() => {
      const A = G.st.A * G.C, y = G.hiY(G.st.t) / A;
      if (st.wait) {
        if (st.tStar === undefined) {
          const x = G.XL + G.st.hi * G.C, s0 = (x - G.XL) / (G.st.lam * G.C) + G.st.phase0 / TAU - 0.25;
          const n = Math.ceil(G.st.t * G.st.f - s0 - 1e-9); st.tStar = (s0 + n) / G.st.f;
        }
        if (G.st.t >= st.tStar) { st.wait = false; st.on = true; st.t0 = st.tStar; st.tStar = undefined; st.f = G.st.f; st.pts = [[0, 1]]; }
      } else if (st.on) {
        st.tau = G.st.t - st.t0;
        if (st.tau >= 2) { st.tau = 2; st.on = false; st.done = true; st.pts.push([2, G.hiY(st.t0 + 2) / A]); listeners.forEach((f) => f('done', st)); }
        else st.pts.push([st.tau, y]);
      }
      draw();
    });
    draw();
    return { st, start, clear, onDone(f) { listeners.push(f); } };
  }

  /* ================= 그림 Ⅲ-12 차례 사진 4장 ================= */
  function strip(host) {
    const W = 600, H = 560, rows = 4, RH = H / rows, L = 300, A = 24, XL = 20, XR = 560, XP = 470;
    const S = surface(host, W, H, () => requestAnimationFrame(() => draw())), ctx = S.ctx, ov = overlay(S);
    const yAt = (x, r) => r * RH + RH / 2 + 10 - A * Math.sin(TAU * ((x - XL) / L - r / 4));
    function draw() {
      S.begin(); const [fx0, , fw0] = S.full();
      ctx.fillStyle = '#fff'; ctx.fillRect(...S.full());
      for (let r = 0; r < rows; r++) {
        const y0 = r * RH;
        ctx.save(); ctx.beginPath(); for (let x = XL; x <= XR; x += 3) { const y = yAt(x, r); x === XL ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.lineTo(XR, y0 + RH - 8); ctx.lineTo(XL, y0 + RH - 8); ctx.closePath();
        const g = ctx.createLinearGradient(0, y0 + RH / 2 - A, 0, y0 + RH); g.addColorStop(0, '#9cc9ec'); g.addColorStop(1, '#4f93cf'); ctx.fillStyle = g; ctx.fill(); ctx.restore();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8; ctx.beginPath(); for (let x = XL; x <= XR; x += 3) { const y = yAt(x, r); x === XL ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
        if (r) { ctx.strokeStyle = 'rgba(20,38,59,.08)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(fx0, y0); ctx.lineTo(fx0 + fw0, y0); ctx.stroke(); }
        const base = y0 + RH / 2 + 10;
        track(ctx, XP + 26, base - A, base + A, 'rgba(20,38,59,.35)');
        ball(ctx, XP, yAt(XP, r) - 6, 10);
        ov.put('n' + r, 34, y0 + 22, ['①', '②', '③', '④'][r], 'tk b');
      }
      // 마루를 잇는 점선
      ctx.save(); ctx.strokeStyle = 'rgba(20,38,59,.4)'; ctx.lineWidth = 1.4; ctx.setLineDash([5, 5]);
      ctx.beginPath(); for (let r = 0; r < rows; r++) { const x = XL + L * (0.25 + r / 4), y = r * RH + RH / 2 + 10 - A - 12; r ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.restore();
      for (let r = 0; r < rows; r++) keyDot(ctx, XL + L * (0.25 + r / 4), r * RH + RH / 2 + 10 - A, 5);
    }
    draw();
    return { draw };
  }

  /* ================= 위에서 본 물결 ================= */
  function ripple(host, o = {}) {
    const W = o.W || 1000, H = o.H || 600, cx = o.cx || 300, cy = o.cy || 300, f = 0.9, v = 150;
    const S = surface(host, W, H), ctx = S.ctx, ov = overlay(S);
    const BX = o.bx || 700, BY = o.by || 330;
    let t = 0;
    function draw() {
      S.begin();
      const [fx, fy, fw, fh] = S.full();
      const g = ctx.createLinearGradient(0, fy, 0, fy + fh); g.addColorStop(0, '#5f9fd6'); g.addColorStop(1, '#3f80bf');
      ctx.fillStyle = g; ctx.fillRect(fx, fy, fw, fh);
      const L = v / f, rmax = Math.hypot(W, H);
      for (let k = 0; ; k++) {
        const r = v * t - k * L - L * 0.75; if (r < 0) break; if (r > rmax) continue;
        const al = Math.max(0, 1 - r / (W * 0.85));
        ctx.lineWidth = 14; ctx.strokeStyle = `rgba(255,255,255,${0.1 * al})`; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = `rgba(255,255,255,${0.6 * al})`; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
        ctx.lineWidth = 10; ctx.strokeStyle = `rgba(10,50,95,${0.12 * al})`; ctx.beginPath(); ctx.arc(cx, cy, r + L / 2, 0, TAU); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(cx, cy, 5 + Math.sin(TAU * f * t) * 1.5, 0, TAU); ctx.fill();
      const r0 = Math.hypot(BX - cx, BY - cy), tl = t - r0 / v, h = tl > 0 ? Math.sin(TAU * f * tl - TAU * 0.75) : 0;
      ctx.fillStyle = 'rgba(10,40,80,.22)'; ctx.beginPath(); ctx.ellipse(BX + 4 + h * 2, BY + 5 + h * 2, 19, 16, 0, 0, TAU); ctx.fill();
      ball(ctx, BX, BY, 18 + h * 1.6);
      ov.put('b', BX, BY - 38, '탁구공', 'tx'); ov.put('s', cx, cy + 30, '두드리는 곳', 'tx');
    }
    addLoop(host, (dt) => { t += dt * (reduce ? 0.5 : 1); draw(); });
    draw();
    return { draw };
  }

  return { surface, overlay, arrow, dim, ball, keyDot, track, tank, graph, timeline, strip, ripple, BLUE, INK };
})();
