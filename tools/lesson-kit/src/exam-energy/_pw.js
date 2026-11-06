/* ===== 소비 전력과 전력량 그림 도구 (캔버스 2D) =====
   PW.plate(host)        그림 Ⅵ-13: 헤어드라이어와 소비 전력 표시 확대
   PW.race(host, o)      문제 발견하기: 우재(헤어드라이어 3분)와 지우(선풍기 20분)가 쓴 전기 에너지(J)
   PW.lamps(host, o)     그림 Ⅵ-14·15: 밝기가 같은 두 전등, 열화상 사진기로 보기, 1초 동안 에너지 따라가기
   PW.room(host, o)      거실과 전력량계: 하루 동안 쓴 전력량(Wh), 밤에 모두 끈 뒤의 대기전력
   그림 원칙(디자인기준): 흰 바탕, 매트한 질감, 얇은 선, 그림 속 글씨는 HTML 이름표.
   물체 색은 실제 색을 차분하게(흰 플라스틱, 나무 바닥), 에너지 알갱이는 전기 = 라스 파랑, 빛 = 노랑, 열 = 주황.
   빠르기·알갱이 수(1 J = 1개)는 교과서 값, 그 밖의 소비 전력은 예시 값이다. */
window.PW = (() => {
  const TAU = Math.PI * 2;
  const BLUE = '#0e63b3';
  const LIGHT = ['#f7d774', '#e9b931'], HEAT = ['#f0a074', '#d8643a'];
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const fmt = (n) => Math.round(n).toLocaleString('ko-KR');

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
      box.style.setProperty('--k', m.k.toFixed(4));
    }
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(host); else window.addEventListener('resize', fit);
    return { cv, ctx, box, m, W, H,
      begin() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(m.dpr * m.k, 0, 0, m.dpr * m.k, m.dpr * m.ox, m.dpr * m.oy); },
      full() { return [-m.ox / m.k, -m.oy / m.k, cv.width / m.dpr / m.k, cv.height / m.dpr / m.k]; } };
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
    loops.forEach((L) => { try { if (L.host.offsetParent !== null) { const r = L.host.getBoundingClientRect(); if (r.bottom > -50 && r.top < innerHeight + 50) L.fn(dt); } } catch (e) { loops.delete(L); (window.SM_err || window.RD_err || console.error)('소비 전력 그림', e); } });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  const addLoop = (host, fn) => { const L = { host, fn }; loops.add(L); return L; };

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function white(S, col = '#fff') { const [fx, fy, fw, fh] = S.full(); S.ctx.fillStyle = col; S.ctx.fillRect(fx, fy, fw, fh); }
  function desk(S, y) {
    const ctx = S.ctx, [fx, , fw, fh] = S.full();
    const g = ctx.createLinearGradient(0, y, 0, y + 160); g.addColorStop(0, '#eef2f6'); g.addColorStop(1, '#f8fafc');
    ctx.fillStyle = g; ctx.fillRect(fx, y, fw, fh); ctx.fillStyle = '#d9e1e9'; ctx.fillRect(fx, y, fw, 1.2);
  }
  function contact(ctx, x, y, w, a = 0.18, sq = 0.16) {
    const g = ctx.createRadialGradient(x, y, 1, x, y, w / 2);
    g.addColorStop(0, `rgba(20,38,59,${a})`); g.addColorStop(1, 'rgba(20,38,59,0)');
    ctx.save(); ctx.translate(x, y); ctx.scale(1, sq); ctx.translate(-x, -y);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, w / 2, 0, TAU); ctx.fill(); ctx.restore();
  }
  const vgrad = (ctx, y0, y1, stops) => { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; };
  const hgrad = (ctx, x0, x1, stops) => { const g = ctx.createLinearGradient(x0, 0, x1, 0); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; };
  const PLASTIC = ['#ffffff', '#f3f5f8', '#dfe5eb', '#c3ccd5'];
  const STEEL = ['#c7ced6', '#eef1f4', '#aeb7c1', '#7b8590'];

  /* ---- 전선과 흐르는 점 ---- */
  function bez(p0, c0, c1, p1, n = 36) {
    const pts = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t;
      pts.push([u * u * u * p0[0] + 3 * u * u * t * c0[0] + 3 * u * t * t * c1[0] + t * t * t * p1[0], u * u * u * p0[1] + 3 * u * u * t * c0[1] + 3 * u * t * t * c1[1] + t * t * t * p1[1]]); }
    return pts;
  }
  function polyLen(pts) { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L; }
  function along(pts, L, s) {
    const tot = L[L.length - 1]; s = clamp(s, 0, tot);
    let i = 1; while (i < L.length - 1 && L[i] < s) i++;
    const k = (s - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
    return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)];
  }
  function line(pts) { const out = []; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 12)); for (let j = i === 1 ? 0 : 1; j <= n; j++) out.push([lerp(a[0], b[0], j / n), lerp(a[1], b[1], j / n)]); } return out; }
  function wire(ctx, pts, col = '#4a5561', w = 4) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = w * 0.3; ctx.stroke();
  }
  function dots(ctx, pts, phase, gap = 34, amt = 1, r = 3.2) {
    if (amt < 0.04) return;
    const L = polyLen(pts), tot = L[L.length - 1];
    ctx.fillStyle = `rgba(14,99,179,${clamp(amt, 0, 1) * 0.95})`;
    for (let s = ((phase % gap) + gap) % gap; s < tot; s += gap) { const p = along(pts, L, s); ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.fill(); }
  }
  // 바람 줄기: (x0,y0)에서 오른쪽(dir=1) 또는 아래(dir=2)로 흐르는 물결선
  function air(ctx, x0, y0, len, spread, t, rgb, amt, dir = 1, n = 5) {
    if (amt < 0.03) return;
    ctx.lineCap = 'round'; ctx.lineWidth = 2.2;
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) / ((n - 1) / 2 || 1);
      for (let s = 0; s < len; s += 5) {
        const ph = (s - t * 150 - i * 23) % 70; if (((ph + 70) % 70) > 36) continue;
        const k = s / len, k2 = (s + 5) / len;
        const w1 = Math.sin(s * 0.045 - t * 5 + i * 1.7) * 5 * k, w2 = Math.sin((s + 5) * 0.045 - t * 5 + i * 1.7) * 5 * k2;
        const o1 = off * spread * (0.3 + 0.7 * k), o2 = off * spread * (0.3 + 0.7 * k2);
        ctx.strokeStyle = `rgba(${rgb},${amt * 0.55 * (1 - k) * (0.6 + 0.4 * Math.sin(k * Math.PI))})`;
        ctx.beginPath();
        if (dir === 1) { ctx.moveTo(x0 + s, y0 + o1 + w1); ctx.lineTo(x0 + s + 5, y0 + o2 + w2); }
        else { ctx.moveTo(x0 + o1 + w1, y0 + s); ctx.lineTo(x0 + o2 + w2, y0 + s + 5); }
        ctx.stroke();
      }
    }
  }

  /* ---- 헤어드라이어(옆모습, 바람은 오른쪽) : 단순한 모양 ---- */
  function dryer(ctx, x, y, s, o = {}) {
    const ol = 'rgba(96,112,128,.55)', A = 0.16;
    // 손잡이(몸통 뒤)
    ctx.save(); ctx.translate(x - 0.12 * s, y + 0.18 * s); ctx.rotate(A);
    rr(ctx, -0.17 * s, 0, 0.34 * s, 1.05 * s, 0.16 * s);
    ctx.fillStyle = hgrad(ctx, -0.17 * s, 0.17 * s, ['#dfe5eb', '#ffffff', '#d3dae1']); ctx.fill();
    ctx.strokeStyle = ol; ctx.lineWidth = 1.4; ctx.stroke();
    rr(ctx, 0.03 * s, 0.26 * s, 0.08 * s, 0.26 * s, 0.04 * s); ctx.fillStyle = '#8d99a6'; ctx.fill();
    ctx.fillStyle = o.on ? BLUE : '#d3dae1'; rr(ctx, 0.04 * s, (o.on ? 0.28 : 0.39) * s, 0.06 * s, 0.11 * s, 0.03 * s); ctx.fill();
    ctx.fillStyle = '#b9c3cd'; rr(ctx, -0.07 * s, 1.0 * s, 0.14 * s, 0.13 * s, 0.05 * s); ctx.fill();
    ctx.restore();
    const cord = [x - 0.12 * s - Math.sin(A) * 1.13 * s, y + 0.18 * s + Math.cos(A) * 1.13 * s];
    // 노즐
    ctx.beginPath(); ctx.moveTo(x + 0.6 * s, y - 0.31 * s); ctx.lineTo(x + 1.1 * s, y - 0.23 * s); ctx.lineTo(x + 1.1 * s, y + 0.23 * s); ctx.lineTo(x + 0.6 * s, y + 0.31 * s); ctx.closePath();
    ctx.fillStyle = vgrad(ctx, y - 0.31 * s, y + 0.31 * s, ['#7d8994', '#5d6873', '#47515b']); ctx.fill();
    ctx.fillStyle = '#2f363e'; ctx.beginPath(); ctx.ellipse(x + 1.1 * s, y, 0.045 * s, 0.23 * s, 0, 0, TAU); ctx.fill();
    // 몸통
    rr(ctx, x - 0.86 * s, y - 0.37 * s, 1.52 * s, 0.74 * s, 0.37 * s);
    ctx.fillStyle = vgrad(ctx, y - 0.37 * s, y + 0.37 * s, ['#ffffff', '#f3f6f9', '#d9e0e7']); ctx.fill();
    ctx.strokeStyle = ol; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.strokeStyle = 'rgba(140,155,170,.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 0.46 * s, y - 0.35 * s); ctx.lineTo(x + 0.46 * s, y + 0.35 * s); ctx.stroke();
    // 뒤 덮개(둥근 판)
    ctx.beginPath(); ctx.arc(x - 0.8 * s, y, 0.47 * s, 0, TAU);
    const gb = ctx.createRadialGradient(x - 0.9 * s, y - 0.2 * s, 0.05 * s, x - 0.8 * s, y, 0.5 * s);
    gb.addColorStop(0, '#ffffff'); gb.addColorStop(1, '#d6dde4'); ctx.fillStyle = gb; ctx.fill();
    ctx.strokeStyle = ol; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.strokeStyle = 'rgba(140,155,170,.5)'; ctx.lineWidth = 1.2;
    [0.33, 0.2].forEach((r) => { ctx.beginPath(); ctx.arc(x - 0.8 * s, y, r * s, 0, TAU); ctx.stroke(); });
    // 표시 스티커
    const sx = x - 0.16 * s, sy = y - 0.15 * s, sw = 0.46 * s, sh = 0.3 * s;
    ctx.fillStyle = '#eef2f6'; rr(ctx, sx, sy, sw, sh, 0.03 * s); ctx.fill(); ctx.strokeStyle = 'rgba(120,135,150,.55)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = 'rgba(90,105,120,.5)'; ctx.lineWidth = Math.max(1, 0.012 * s);
    for (let i = 0; i < 4; i++) { const ly = sy + sh * (0.24 + i * 0.18); ctx.beginPath(); ctx.moveTo(sx + sw * 0.12, ly); ctx.lineTo(sx + sw * (i % 2 ? 0.7 : 0.86), ly); ctx.stroke(); }
    return { cord, nozzle: [x + 1.14 * s, y], sticker: [sx + sw / 2, sy + sh / 2, sw, sh] };
  }

  /* ---- 선풍기(오른쪽을 보는 비스듬한 모습) ---- */
  function fan(ctx, x, y, R, a, sp, baseY, o = {}) {
    const rx = 0.42;
    const P = (u, v, cx = x) => [cx + u * rx, y + v];
    // 받침과 기둥
    contact(ctx, x - 0.2 * R, baseY + 4, R * 1.6, 0.18);
    ctx.fillStyle = vgrad(ctx, baseY - 0.16 * R, baseY + 0.08 * R, ['#f6f8fa', '#dfe5eb', '#b9c3cd']);
    ctx.beginPath(); ctx.ellipse(x - 0.2 * R, baseY - 0.04 * R, 0.62 * R, 0.13 * R, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e9eef2'; ctx.beginPath(); ctx.ellipse(x - 0.2 * R, baseY - 0.08 * R, 0.55 * R, 0.1 * R, 0, 0, TAU); ctx.fill();
    if (o.knob !== false) { ctx.fillStyle = '#9aa6b2'; ctx.beginPath(); ctx.ellipse(x + 0.12 * R, baseY - 0.08 * R, 0.07 * R, 0.03 * R, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = hgrad(ctx, x - 0.3 * R, x - 0.12 * R, ['#c3ccd5', '#f3f5f8', '#aeb7c1']);
    ctx.fillRect(x - 0.28 * R, y + 0.2 * R, 0.14 * R, baseY - y - 0.28 * R);
    // 모터 덮개(뒤)
    const mx = x - 0.42 * R;
    rr(ctx, mx - 0.3 * R, y - 0.2 * R, 0.5 * R, 0.4 * R, 0.18 * R);
    ctx.fillStyle = vgrad(ctx, y - 0.2 * R, y + 0.2 * R, PLASTIC); ctx.fill();
    ctx.strokeStyle = 'rgba(110,125,140,.35)'; ctx.lineWidth = 1; ctx.stroke();
    // 뒤 망
    ctx.strokeStyle = 'rgba(150,165,180,.75)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(x - 0.06 * R, y, R * rx, R, 0, 0, TAU); ctx.stroke();
    for (let i = 0; i < 18; i++) { const t = (i / 18) * TAU; const p = P(Math.cos(t) * R, Math.sin(t) * R, x - 0.06 * R); ctx.beginPath(); ctx.moveTo(x - 0.06 * R, y); ctx.lineTo(p[0], p[1]); ctx.stroke(); }
    // 날개
    const blade = (ang, alpha) => {
      ctx.beginPath();
      for (let k = 0; k <= 16; k++) { const t = ang - 0.42 + (k / 16) * 0.84, rr2 = R * (0.9 - 0.1 * Math.abs(k / 8 - 1)); const p = P(Math.cos(t) * rr2, Math.sin(t) * rr2); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      const q = P(Math.cos(ang + 0.5) * R * 0.16, Math.sin(ang + 0.5) * R * 0.16); ctx.lineTo(q[0], q[1]);
      const q2 = P(Math.cos(ang - 0.5) * R * 0.16, Math.sin(ang - 0.5) * R * 0.16); ctx.lineTo(q2[0], q2[1]); ctx.closePath();
      ctx.fillStyle = `rgba(150,186,214,${alpha})`; ctx.fill();
      if (alpha > 0.5) { ctx.strokeStyle = 'rgba(80,120,155,.35)'; ctx.lineWidth = 1; ctx.stroke(); }
    };
    const blur = clamp(sp / 14, 0, 1);
    if (blur < 0.3) [0, 1, 2].forEach((i) => blade(a + (i * TAU) / 3, 0.78));
    else {
      ctx.fillStyle = `rgba(150,186,214,${0.28 + 0.1 * blur})`; ctx.beginPath(); ctx.ellipse(x, y, R * 0.9 * rx, R * 0.9, 0, 0, TAU); ctx.fill();
      for (let j = 0; j < 4; j++) [0, 1, 2].forEach((i) => blade(a - j * 0.18 + (i * TAU) / 3, 0.2 * (1 - blur * 0.5)));
    }
    ctx.fillStyle = vgrad(ctx, y - 0.14 * R, y + 0.14 * R, PLASTIC); ctx.beginPath(); ctx.ellipse(x + 0.02 * R, y, 0.07 * R, 0.15 * R, 0, 0, TAU); ctx.fill();
    // 앞 망
    ctx.strokeStyle = 'rgba(120,138,156,.85)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(x + 0.06 * R, y, R * rx, R, 0, 0, TAU); ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(120,138,156,.55)';
    [0.38, 0.66].forEach((f) => { ctx.beginPath(); ctx.ellipse(x + 0.06 * R, y, R * rx * f, R * f, 0, 0, TAU); ctx.stroke(); });
    for (let i = 0; i < 24; i++) { const t = (i / 24) * TAU; const p = P(Math.cos(t) * R, Math.sin(t) * R, x + 0.06 * R), q = P(Math.cos(t) * R * 0.2, Math.sin(t) * R * 0.2, x + 0.06 * R); ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); }
    ctx.fillStyle = vgrad(ctx, y - 0.18 * R, y + 0.18 * R, ['#ffffff', '#e3e8ed', '#c3ccd5']); ctx.beginPath(); ctx.ellipse(x + 0.08 * R, y, 0.08 * R, 0.18 * R, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(110,125,140,.4)'; ctx.stroke();
    return { cord: [x - 0.2 * R, baseY - 0.02 * R] };
  }

  /* ---- 콘센트에 꽂는 전력 측정기 ---- */
  function plugMeter(ctx, x, y, k = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = '#e9eef2'; rr(ctx, -46, -78, 92, 116, 10); ctx.fill(); ctx.strokeStyle = '#cfd8e0'; ctx.lineWidth = 1; ctx.stroke();
    rr(ctx, -56, -68, 112, 146, 14); ctx.fillStyle = hgrad(ctx, -56, 56, ['#e3e8ed', '#ffffff', '#f1f4f7', '#cfd7df']); ctx.fill();
    ctx.strokeStyle = 'rgba(110,125,140,.4)'; ctx.stroke();
    rr(ctx, -46, -56, 92, 62, 7); ctx.fillStyle = vgrad(ctx, -56, 6, ['#26323e', '#1c2631']); ctx.fill();
    ctx.fillStyle = '#d8dfe6'; ctx.beginPath(); ctx.arc(0, 42, 19, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(110,125,140,.4)'; ctx.stroke();
    ctx.fillStyle = '#5d6873'; [-7, 7].forEach((d) => { ctx.beginPath(); ctx.arc(d, 42, 2.6, 0, TAU); ctx.fill(); });
    ctx.restore();
    return { lcd: [x, y - 25 * k], socket: [x, y + 42 * k], k };
  }

  /* =====================================================================
     그림 Ⅵ-13: 헤어드라이어와 소비 전력 표시
     ===================================================================== */
  function plate(host) {
    const S = surface(host, 1200, 900), ctx = S.ctx, OL = overlay(S);
    let drawn = false;
    function draw() {
      S.begin(); white(S);
      const x = 440, y = 300, s = 200;
      contact(ctx, 380, 800, 640, 0.14, 0.1);
      const d = dryer(ctx, x, y, s, {});
      wire(ctx, bez(d.cord, [d.cord[0] - 6, d.cord[1] + 90], [d.cord[0] - 80, 800], [90, 790]), '#cfd7df', 8);
      // 확대 연결선
      const [sx, sy, sw, sh] = d.sticker, cx = 890, cy = 630, R = 210;
      ctx.strokeStyle = 'rgba(90,107,126,.45)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(sx + sw / 2, sy + sh / 2); ctx.lineTo(cx - R * 0.42, cy - R * 0.9); ctx.moveTo(sx - sw / 2, sy + sh / 2); ctx.lineTo(cx - R * 0.95, cy + R * 0.3); ctx.stroke();
      ctx.strokeStyle = 'rgba(90,107,126,.65)'; ctx.lineWidth = 1.6; rr(ctx, sx - sw / 2 - 5, sy - sh / 2 - 5, sw + 10, sh + 10, 6); ctx.stroke();
      // 확대 원
      contact(ctx, cx, cy + R + 6, R * 1.5, 0.12, 0.12);
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
      ctx.fillStyle = vgrad(ctx, cy - R, cy + R, ['#ffffff', '#f1f4f7', '#dfe5eb']); ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      ctx.fillStyle = '#f4f6f8'; rr(ctx, cx - R * 0.9, cy - R * 0.6, R * 1.8, R * 1.2, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(120,135,150,.45)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = '#8b9aab'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
      ctx.strokeStyle = BLUE; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(cx + 2, cy + 40, R * 0.76, 32, 0, 0, TAU); ctx.stroke();
      OL.put('l1', cx - R * 0.68, cy - 76, '모델명 : ○○○○', 'tx plt dim ra');
      OL.put('l2', cx - R * 0.68, cy - 26, '정격 전압 : 220 V', 'tx plt ra');
      OL.put('l3', cx - R * 0.68, cy + 40, '소비 전력 : 1200 W', 'tx plt big ra');
      OL.put('l4', cx - R * 0.68, cy + 104, '제조 연월 : ○○○○', 'tx plt dim ra');
      OL.put('cap', 60, 70, '헤어드라이어 옆면의 표시', 'tx m cap2 ra');
    }
    addLoop(host, () => { if (!drawn || S.cv.width !== S._w) { draw(); drawn = true; S._w = S.cv.width; } });
    if (window.ResizeObserver) new ResizeObserver(() => (drawn = false)).observe(host);
    return {};
  }

  /* =====================================================================
     에너지 전환 지도: 기구를 고르면 그 기구가 일하는 모습과 바뀌는 에너지 띠
     ===================================================================== */
  const EN = { light: ['빛에너지', [233, 185, 49]], heat: ['열에너지', [216, 100, 58]], move: ['운동 에너지', [90, 143, 196]], sound: ['소리 에너지', [122, 107, 176]], chem: ['화학 에너지', [79, 154, 106]] };
  const DEVS = [
    { id: 'dryer', name: '헤어드라이어', out: ['heat', 'move'] },
    { id: 'fan', name: '선풍기', out: ['move'] },
    { id: 'lamp', name: '전등', out: ['light', 'heat'] },
    { id: 'tv', name: '텔레비전', out: ['light', 'sound'] },
    { id: 'kettle', name: '전기 주전자', out: ['heat'] },
    { id: 'mixer', name: '믹서', out: ['move', 'sound'] },
    { id: 'phone', name: '휴대 전화 충전', out: ['chem'] },
    { id: 'hp', name: '헤드폰', out: ['sound'] },
  ];
  function heatWaves(ctx, x, y, w, h, t, a = 1) {
    ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const xx = x + (i - 1) * w / 2, ph = (t * 0.8 + i * 0.33) % 1;
      ctx.strokeStyle = `rgba(216,100,58,${a * 0.6 * Math.sin(ph * Math.PI)})`;
      ctx.beginPath(); for (let k = 0; k <= 20; k++) { const yy = y - ph * h * 0.4 - k / 20 * h * 0.6; const xw = xx + Math.sin(k / 20 * 6 + t * 4 + i) * 5; k ? ctx.lineTo(xw, yy) : ctx.moveTo(xw, yy); } ctx.stroke();
    }
  }
  function soundArcs(ctx, x, y, dir, t, a = 1, R0 = 18) {
    ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const ph = (t * 0.9 + k / 3) % 1, r = R0 + ph * 60; ctx.strokeStyle = `rgba(122,107,176,${a * 0.75 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x, y, r, dir > 0 ? -0.6 : Math.PI - 0.6, dir > 0 ? 0.6 : Math.PI + 0.6); ctx.stroke(); }
  }
  function glow(ctx, x, y, r, a = 1) { const g = ctx.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, `rgba(255,232,150,${0.65 * a})`); g.addColorStop(1, 'rgba(255,232,150,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  // (cx, cy) 가운데, 약 300×300 크기. fx: 일하는 모습(움직임) 그리기. 돌려주는 값: 전선이 들어가는 곳
  function device(ctx, id, cx, cy, t, fx) {
    const ol = 'rgba(96,112,128,.55)';
    if (id === 'dryer') { const d = dryer(ctx, cx - 30, cy - 40, 104, { on: fx }); if (fx) { air(ctx, d.nozzle[0] + 4, d.nozzle[1], 110, 26, t, '226,128,82', 1); } return d.cord; }
    if (id === 'fan') { fan(ctx, cx + 10, cy - 40, 118, fx ? t * 20 : 0.3, fx ? 20 : 0, cy + 130); if (fx) air(ctx, cx + 70, cy - 40, 90, 60, t, '120,160,195', 1); return [cx - 14, cy + 128]; }
    if (id === 'lamp') {
      contact(ctx, cx + 40, cy + 132, 180, 0.16);
      ctx.fillStyle = vgrad(ctx, cy + 110, cy + 136, ['#f5f7f9', '#c9d1d9']); ctx.beginPath(); ctx.ellipse(cx + 40, cy + 124, 70, 14, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = hgrad(ctx, cx + 34, cx + 46, ['#c3ccd5', '#f6f8fa', '#aeb7c1']); ctx.fillRect(cx + 34, cy - 100, 12, 224);
      ctx.strokeStyle = '#d0d8e0'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + 40, cy - 100); ctx.lineTo(cx - 40, cy - 100); ctx.stroke();
      if (fx) { glow(ctx, cx - 40, cy - 6, 150, 0.9); }
      ctx.beginPath(); ctx.moveTo(cx - 62, cy - 92); ctx.bezierCurveTo(cx - 70, cy - 60, cx - 120, cy - 40, cx - 124, cy - 22); ctx.ellipse(cx - 40, cy - 22, 84, 18, 0, Math.PI, 0, true); ctx.bezierCurveTo(cx + 40, cy - 40, cx - 10, cy - 60, cx - 18, cy - 92); ctx.closePath();
      ctx.fillStyle = hgrad(ctx, cx - 124, cx + 44, ['#c9d1d9', '#f4f6f8', '#ffffff', '#b2bcc6']); ctx.fill(); ctx.strokeStyle = ol; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx - 40, cy + 8, 26, 0, TAU); ctx.fillStyle = fx ? '#fff3c4' : '#f1f4f7'; ctx.fill(); ctx.strokeStyle = 'rgba(190,170,120,.6)'; ctx.stroke();
      if (fx) heatWaves(ctx, cx - 40, cy - 110, 50, 90, t, 0.9);
      return [cx + 100, cy + 126];
    }
    if (id === 'tv') {
      ctx.fillStyle = '#3a424b'; rr(ctx, cx - 50, cy + 92, 100, 12, 4); ctx.fill(); ctx.fillRect(cx - 7, cy + 70, 14, 26);
      if (fx) glow(ctx, cx, cy - 10, 210, 0.45);
      rr(ctx, cx - 150, cy - 100, 300, 176, 10); ctx.fillStyle = '#1e242b'; ctx.fill();
      ctx.save(); rr(ctx, cx - 142, cy - 92, 284, 160, 4); ctx.clip();
      if (fx) { ctx.fillStyle = vgrad(ctx, cy - 92, cy + 68, ['#9cc6e6', '#d6e8f4']); ctx.fillRect(cx - 142, cy - 92, 284, 160); const sh = Math.sin(t * 0.6) * 8; ctx.fillStyle = '#7fb07c'; ctx.beginPath(); ctx.moveTo(cx - 142, cy + 40); ctx.quadraticCurveTo(cx - 40 + sh, cy - 30, cx + 60, cy + 20); ctx.quadraticCurveTo(cx + 110, cy + 36, cx + 142, cy); ctx.lineTo(cx + 142, cy + 68); ctx.lineTo(cx - 142, cy + 68); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff6da'; ctx.beginPath(); ctx.arc(cx + 80 + sh, cy - 50, 16, 0, TAU); ctx.fill(); }
      else { ctx.fillStyle = '#2a3138'; ctx.fillRect(cx - 142, cy - 92, 284, 160); }
      ctx.restore();
      if (fx) { soundArcs(ctx, cx + 156, cy - 10, 1, t); soundArcs(ctx, cx - 156, cy - 10, -1, t + 0.4); }
      return [cx + 40, cy + 104];
    }
    if (id === 'kettle') {
      contact(ctx, cx, cy + 128, 220, 0.18);
      ctx.fillStyle = vgrad(ctx, cy + 104, cy + 130, ['#5d6873', '#353d46']); rr(ctx, cx - 92, cy + 104, 184, 24, 10); ctx.fill();
      // 몸통
      ctx.beginPath(); ctx.moveTo(cx - 70, cy - 70); ctx.lineTo(cx + 66, cy - 70); ctx.quadraticCurveTo(cx + 86, cy + 20, cx + 84, cy + 104); ctx.lineTo(cx - 84, cy + 104); ctx.quadraticCurveTo(cx - 86, cy + 20, cx - 70, cy - 70); ctx.closePath();
      ctx.fillStyle = hgrad(ctx, cx - 86, cx + 86, ['#9fb4c4', '#e6eef3', '#c4d2dd', '#7f94a6']); ctx.fill(); ctx.strokeStyle = ol; ctx.lineWidth = 1.4; ctx.stroke();
      // 물 보이는 창
      rr(ctx, cx - 50, cy - 30, 22, 110, 8); ctx.fillStyle = 'rgba(160,205,235,.85)'; ctx.fill(); ctx.strokeStyle = 'rgba(80,110,140,.5)'; ctx.stroke();
      if (fx) for (let i = 0; i < 4; i++) { const ph = (t * 0.7 + i / 4) % 1; ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - ph)})`; ctx.beginPath(); ctx.arc(cx - 39 + Math.sin(i * 2 + t) * 4, cy + 72 - ph * 96, 3, 0, TAU); ctx.fill(); }
      // 뚜껑·주둥이·손잡이
      ctx.fillStyle = vgrad(ctx, cy - 90, cy - 66, ['#5d6873', '#353d46']); rr(ctx, cx - 60, cy - 88, 112, 20, 8); ctx.fill(); rr(ctx, cx - 14, cy - 100, 28, 14, 5); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + 64, cy - 66); ctx.lineTo(cx + 116, cy - 92); ctx.lineTo(cx + 120, cy - 80); ctx.lineTo(cx + 76, cy - 40); ctx.closePath(); ctx.fillStyle = '#b2c2cf'; ctx.fill(); ctx.strokeStyle = ol; ctx.stroke();
      ctx.strokeStyle = '#3a424b'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - 78, cy - 50); ctx.quadraticCurveTo(cx - 140, cy - 30, cx - 84, cy + 60); ctx.stroke();
      ctx.fillStyle = fx ? BLUE : '#aeb7c1'; ctx.beginPath(); ctx.arc(cx - 108, cy + 2, 4, 0, TAU); ctx.fill();
      if (fx) { // 김
        ctx.lineWidth = 6; ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) { const ph = (t * 0.6 + i / 3) % 1; ctx.strokeStyle = `rgba(170,185,200,${0.55 * Math.sin(ph * Math.PI)})`; ctx.beginPath(); for (let k = 0; k <= 16; k++) { const yy = cy - 100 - ph * 70 - k * 4; const xx = cx + 122 + ph * 20 + Math.sin(k * 0.5 + t * 3 + i) * 7; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); }
        heatWaves(ctx, cx, cy - 120, 70, 70, t, 0.8);
      }
      return [cx + 80, cy + 120];
    }
    if (id === 'mixer') {
      contact(ctx, cx, cy + 130, 220, 0.18);
      // 받침
      ctx.beginPath(); ctx.moveTo(cx - 70, cy + 40); ctx.lineTo(cx + 70, cy + 40); ctx.lineTo(cx + 84, cy + 128); ctx.lineTo(cx - 84, cy + 128); ctx.closePath(); ctx.fillStyle = vgrad(ctx, cy + 40, cy + 128, ['#5d6873', '#353d46']); ctx.fill();
      ctx.fillStyle = '#d6dde4'; ctx.beginPath(); ctx.arc(cx, cy + 88, 15, 0, TAU); ctx.fill(); ctx.fillStyle = '#5d6873'; ctx.fillRect(cx - 2, cy + 76, 4, 12);
      // 컵
      ctx.save(); ctx.beginPath(); ctx.moveTo(cx - 74, cy - 120); ctx.lineTo(cx + 74, cy - 120); ctx.lineTo(cx + 54, cy + 40); ctx.lineTo(cx - 54, cy + 40); ctx.closePath(); ctx.clip();
      ctx.fillStyle = 'rgba(230,238,244,.65)'; ctx.fillRect(cx - 80, cy - 125, 160, 170);
      // 과일 조각(돌면 소용돌이)
      const cols = ['#e2725b', '#f2b94a', '#8cc068', '#e2725b', '#f2b94a', '#d9566b', '#8cc068', '#f2b94a'];
      for (let i = 0; i < 14; i++) { const a = i * 2.4 + (fx ? t * 7 : 0), r = 12 + (i % 5) * 9, yy = cy + 16 - (i % 6) * 12 - (fx ? 18 : 0); ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * r, yy + Math.sin(a) * 4, 10, 8, a, 0, TAU); ctx.fill(); }
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(cx - 74, cy - 120); ctx.lineTo(cx + 74, cy - 120); ctx.lineTo(cx + 54, cy + 40); ctx.lineTo(cx - 54, cy + 40); ctx.closePath(); ctx.strokeStyle = 'rgba(96,112,128,.6)'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.fillStyle = '#3a424b'; rr(ctx, cx - 80, cy - 132, 160, 16, 6); ctx.fill();
      ctx.strokeStyle = '#3a424b'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(cx + 66, cy - 100); ctx.quadraticCurveTo(cx + 116, cy - 80, cx + 66, cy + 10); ctx.stroke();
      if (fx) { soundArcs(ctx, cx + 120, cy - 40, 1, t); soundArcs(ctx, cx - 100, cy - 40, -1, t + 0.5); }
      return [cx + 84, cy + 120];
    }
    if (id === 'phone') {
      contact(ctx, cx, cy + 130, 200, 0.16);
      ctx.fillStyle = vgrad(ctx, cy + 108, cy + 130, ['#e9eef2', '#b9c3cd']); rr(ctx, cx - 80, cy + 108, 160, 22, 10); ctx.fill();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.08);
      rr(ctx, -62, -130, 124, 240, 20); ctx.fillStyle = '#2b3138'; ctx.fill();
      rr(ctx, -54, -120, 108, 220, 14); ctx.fillStyle = '#f1f5f8'; ctx.fill();
      // 배터리
      const lv = fx ? 0.25 + ((t * 0.18) % 0.75) : 0.3;
      rr(ctx, -24, -60, 48, 100, 8); ctx.strokeStyle = '#5a6b7e'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#5a6b7e'; rr(ctx, -10, -70, 20, 10, 3); ctx.fill();
      ctx.fillStyle = '#4f9a6a'; rr(ctx, -18, 34 - lv * 88, 36, lv * 88, 4); ctx.fill();
      ctx.restore();
      return [cx + 80, cy + 120];
    }
    if (id === 'hp') {
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#3a424b'; ctx.lineWidth = 20; ctx.beginPath(); ctx.arc(cx, cy + 10, 110, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      ctx.strokeStyle = '#5d6873'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy + 10, 110, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      [-1, 1].forEach((d) => {
        const x = cx + d * 104;
        rr(ctx, x - 30, cy - 10, 60, 100, 26); ctx.fillStyle = vgrad(ctx, cy - 10, cy + 90, ['#5d6873', '#2f363e']); ctx.fill();
        rr(ctx, x - (d > 0 ? 36 : 4), cy - 2, 40, 84, 20); ctx.fillStyle = '#7d8994'; ctx.fill();
        if (fx) soundArcs(ctx, x + d * 34, cy + 40, d, t + (d > 0 ? 0 : 0.5), 1, 14);
      });
      ctx.strokeStyle = '#3a424b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 104, cy + 90); ctx.quadraticCurveTo(cx - 90, cy + 140, cx - 20, cy + 130); ctx.stroke();
      return [cx - 20, cy + 130];
    }
    return [cx, cy];
  }
  function devmap(host, o = {}) {
    const S = surface(host, 1100, 440), ctx = S.ctx, OL = overlay(S);
    const st = { id: o.id || null, t: 0, k: 0 };
    const api = { st, DEVS, EN, set(id) { st.id = id; st.k = 0; } };
    addLoop(host, (dt) => { st.t += reduce ? 0 : dt; st.k = Math.min(1, st.k + dt * 1.6); draw(); });
    function band(x0, y0, x1, y1, w, rgb, a) {
      ctx.fillStyle = `rgba(${rgb.join(',')},${a})`;
      ctx.beginPath(); ctx.moveTo(x0, y0 - w / 2); ctx.bezierCurveTo((x0 + x1) / 2, y0 - w / 2, (x0 + x1) / 2, y1 - w / 2, x1, y1 - w / 2);
      ctx.lineTo(x1, y1 + w / 2); ctx.bezierCurveTo((x0 + x1) / 2, y1 + w / 2, (x0 + x1) / 2, y0 + w / 2, x0, y0 + w / 2); ctx.closePath(); ctx.fill();
    }
    function draw() {
      S.begin(); white(S);
      const d = DEVS.find((x) => x.id === st.id);
      Object.keys(EN).forEach((k) => OL.hide('e' + k)); OL.hide('src'); OL.hide('none');
      if (!d) { OL.put('none', 550, 220, '아래에서 기구를 눌러 보세요', 'tx m'); return; }
      const cx = 290, cy = 220;
      const plug = device(ctx, d.id, cx, cy, st.t, true);
      // 전기 에너지가 전선을 따라 들어옴
      const cord = bez([20, 410], [140, 420], [plug[0] - 60, plug[1] + 70], plug);
      wire(ctx, cord, '#cfd7df', 5); dots(ctx, cord, st.t * 120, 26, 1, 3.4);
      OL.put('src', 26, 382, '전기 에너지', 'tx grp sm blue');
      // 바뀐 에너지 띠
      const n = d.out.length, x0 = 500, x1 = 800;
      d.out.forEach((k, i) => {
        const y = cy + (i - (n - 1) / 2) * 110, [name, rgb] = EN[k];
        band(x0, cy + (i - (n - 1) / 2) * 26, x1, y, 22, rgb, 0.25 * st.k);
        for (let j = 0; j < 4; j++) { const u = ((st.t * 0.5 + j / 4) % 1); const px = lerp(x0, x1, u), py = lerp(cy + (i - (n - 1) / 2) * 26, y, ease(u)); ctx.fillStyle = `rgba(${rgb.join(',')},${0.9 * st.k})`; rr(ctx, px - 8, py - 8, 16, 16, 4); ctx.fill(); }
        ctx.fillStyle = `rgba(${rgb.join(',')},1)`; rr(ctx, x1 + 6, y - 14, 28, 28, 7); ctx.fill();
        OL.put('e' + k, x1 + 46, y, name, 'tx nm ra');
      });
    }
    return api;
  }
  // 버튼에 넣는 작은 그림
  function thumb(cv, id) {
    const ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth || 96, H = cv.clientHeight || 72;
    cv.width = W * dpr; cv.height = H * dpr;
    const k = Math.min(W / 330, H / 300) * dpr;
    ctx.setTransform(k, 0, 0, k, (W * dpr - 330 * k) / 2, (H * dpr - 300 * k) / 2);
    device(ctx, id, 165, 160, 0, false);
  }

  /* =====================================================================
     문제 발견하기: 우재(헤어드라이어 3분)와 지우(선풍기 20분)
     ===================================================================== */
  function race(host, o = {}) {
    const S = surface(host, 1200, 850), ctx = S.ctx, OL = overlay(S);
    const PD = 1200, TD = 180, TF = 1200;
    const st = { mode: 'idle', t: 0, run: false, fanP: o.fan || 40, a: 0, sp: 0, ph: 0, pd: 0, pf: 0, air: 0, tt: 0, dOn: 0, fOn: 0 };
    const api = { st, onEnd: null };
    api.setFan = (p) => { st.fanP = p; };
    api.race = () => { st.mode = 'race'; st.t = 0; st.run = true; };
    api.second = () => { st.mode = 'sec'; st.t = 0; st.run = true; };
    api.reset = () => { st.mode = 'idle'; st.t = 0; st.run = false; };
    api.jump = (mode, t) => { st.mode = mode; st.t = t; st.run = false; };
    api.E = () => ({ d: PD * Math.min(st.t, st.mode === 'sec' ? 1 : TD), f: st.fanP * Math.min(st.t, st.mode === 'sec' ? 1 : TF) });
    const dryOn = () => st.run && (st.mode === 'sec' || st.t < TD);
    const fanOn = () => st.run;
    addLoop(host, (dt) => {
      st.tt += dt;
      if (st.run) {
        const rate = st.mode === 'race' ? 100 : 0.4;
        st.t += dt * rate;
        const T = st.mode === 'race' ? TF : 1;
        if (st.t >= T) { st.t = T; st.run = false; api.onEnd && api.onEnd(st.mode); }
      }
      st.dOn = lerp(st.dOn, dryOn() ? 1 : 0, Math.min(1, dt * 5));
      st.fOn = lerp(st.fOn, fanOn() ? 1 : 0, Math.min(1, dt * 3));
      const tgt = fanOn() ? (st.fanP > 30 ? 22 : 13) : 0;
      st.sp = lerp(st.sp, tgt, Math.min(1, dt * (fanOn() ? 1.2 : 0.6))); st.a += st.sp * dt;
      st.pd += dt * 240 * st.dOn; st.pf += dt * (st.fanP > 30 ? 70 : 45) * st.fOn;
      draw();
    });
    function draw() {
      S.begin(); white(S); desk(S, 520);
      // 가운데 나눔선
      ctx.strokeStyle = '#e3e9ef'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(600, 70); ctx.lineTo(600, 520); ctx.stroke();
      // ---- 우재: 헤어드라이어 ----
      const m1 = plugMeter(ctx, 104, 372, 1.25);
      const bx = 352, dy = 262;
      contact(ctx, bx, 522, 220, 0.18);
      ctx.fillStyle = vgrad(ctx, 504, 526, ['#e9eef2', '#c9d1d9']); ctx.beginPath(); ctx.ellipse(bx, 515, 88, 15, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = hgrad(ctx, bx - 6, bx + 6, ['#aeb7c1', '#eef1f4', '#8f99a4']); ctx.fillRect(bx - 6, 205, 12, 312);
      ctx.strokeStyle = '#9aa6b2'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(bx + 2, dy, 14, 62, 0, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
      const d = dryer(ctx, bx + 4, dy, 92, { on: st.dOn > 0.5 });
      ctx.strokeStyle = '#a7b2bd'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(bx + 2, dy, 14, 62, 0, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
      air(ctx, d.nozzle[0] + 6, d.nozzle[1], 105, 30, st.tt, '226,128,82', st.dOn);
      const c1 = bez(m1.socket, [m1.socket[0] + 10, 500], [d.cord[0] - 120, 522], d.cord);
      wire(ctx, c1, '#d2d9e0', 5.5);
      dots(ctx, c1, st.pd, 18, st.dOn, 3);
      // ---- 지우: 선풍기 ----
      const m2 = plugMeter(ctx, 704, 372, 1.25);
      const f = fan(ctx, 960, 282, 138, st.a, st.sp, 518);
      air(ctx, 1030, 282, 150, 80, st.tt * (st.fanP > 30 ? 1.1 : 0.7), '120,160,195', clamp(st.sp / 18, 0, 1));
      const c2 = bez(m2.socket, [m2.socket[0] + 10, 502], [f.cord[0] - 120, 524], f.cord);
      wire(ctx, c2, '#d2d9e0', 5.5);
      dots(ctx, c2, st.pf, st.fanP > 30 ? 40 : 58, st.fOn, 3);
      // ---- 쓴 전기 에너지 막대 ----
      const sec = st.mode === 'sec';
      const E = api.E(), MAX = sec ? 1400 : 240000, x0 = 270, x1 = 1120, sc = (x1 - x0) / MAX;
      ctx.fillStyle = '#f6f9fc'; rr(ctx, 24, 566, 1152, 268, 16); ctx.fill(); ctx.strokeStyle = '#dde6ee'; ctx.lineWidth = 1; ctx.stroke();
      const ticks = sec ? [0, 400, 800, 1200] : [0, 50000, 100000, 150000, 200000];
      [0, 400, 800, 1200, 50000, 100000, 150000, 200000].forEach((v) => OL.hide('tk' + v));
      ticks.forEach((v) => { const x = x0 + v * sc; ctx.strokeStyle = v ? '#e3e9ef' : '#b9c6d3'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, 628); ctx.lineTo(x, 776); ctx.stroke(); OL.put('tk' + v, x, 800, fmt(v), 'tx sc'); });
      [[E.d, 664, 'd'], [E.f, 734, 'f']].forEach(([v, y, k]) => {
        ctx.fillStyle = '#e6edf4'; rr(ctx, x0, y - 18, x1 - x0, 36, 9); ctx.fill();
        const w = Math.max(0, v * sc);
        if (w > 1) { ctx.fillStyle = BLUE; rr(ctx, x0, y - 18, Math.max(w, 12), 36, 9); ctx.fill(); }
        OL.put('v' + k, Math.min(x0 + w + 12, x1 - 4), y, `${fmt(v)} J`, 'tx val ra' + (x0 + w + 12 > x1 - 100 ? ' in' : ''));
      });
      OL.put('ttl', 44, 600, sec ? '1초 동안 쓴 전기 에너지' : '사용한 전기 에너지', 'tx grp');
      OL.put('rd', 250, 664, '우재 · 헤어드라이어', 'tx nm la');
      OL.put('rf', 250, 734, '지우 · 선풍기', 'tx nm la');
      // ---- 이름표 ----
      const tm = sec ? `${st.t.toFixed(2)}초` : `${Math.floor(st.t / 60)}분 ${String(Math.floor(st.t % 60)).padStart(2, '0')}초`;
      OL.put('clock', 600, 36, st.mode === 'idle' ? '켜면 시간이 흐르고 막대가 늘어나요' : `지난 시간 <b>${tm}</b>`, 'tx clock');
      OL.put('h1', 300, 100, '우재 · 헤어드라이어 <span class="u">3분 사용</span>', 'tx nm');
      OL.put('h2', 900, 100, `지우 · 선풍기 (${st.fanP > 30 ? '강' : '약'}) <span class="u">20분 사용</span>`, 'tx nm');
      const lcd = (id, m, P, on, v) => {
        OL.put(id + 'w', m.lcd[0], m.lcd[1] - 14, on ? `${fmt(P)} W` : '0 W', 'lcd');
        OL.put(id + 'j', m.lcd[0], m.lcd[1] + 16, `${fmt(v)} J`, 'lcd s');
      };
      lcd('m1', m1, PD, st.dOn > 0.5, E.d); lcd('m2', m2, st.fanP, st.fOn > 0.5, E.f);
      OL.put('mt1', 104, 270, '전력 측정기', 'tx m sm'); OL.put('mt2', 704, 270, '전력 측정기', 'tx m sm');
      if (st.mode === 'race' && st.t >= TD && st.t < TF) OL.put('done1', 352, 150, '3분이 지나 껐어요', 'tx m'); else OL.hide('done1');
    }
    return api;
  }

  /* =====================================================================
     그림 Ⅵ-14·15: 밝기가 같은 두 전등
     ===================================================================== */
  // 열화상 색(0 차가움 ~ 1 뜨거움)
  const TH = [[0, [24, 28, 92]], [0.18, [38, 72, 190]], [0.36, [28, 168, 205]], [0.52, [60, 190, 92]], [0.68, [238, 222, 60]], [0.82, [240, 132, 44]], [0.93, [222, 52, 40]], [1, [255, 246, 240]]];
  function thc(k, a = 1) { k = clamp(k, 0, 1); let i = 1; while (i < TH.length - 1 && TH[i][0] < k) i++; const [k0, c0] = TH[i - 1], [k1, c1] = TH[i], u = (k - k0) / (k1 - k0 || 1); return `rgba(${c0.map((c, j) => Math.round(lerp(c, c1[j], u))).join(',')},${a})`; }
  const LAMPS = [
    { id: 'a', name: '(가)', x: 320, n: 12, L: 6, H: 6, kind: 'spiral', hot: 1, pat: 'LHLHLHLHLHLH' },
    { id: 'b', name: '(나)', x: 880, n: 8, L: 6, H: 2, kind: 'round', hot: 0.62, pat: 'LLLHLLLH' },
  ];
  function lamps(host, o = {}) {
    const S = surface(host, 1200, 800), ctx = S.ctx, OL = overlay(S);
    const DUR = 4.2, TRIP = 1.15, OUT = 1.05;
    const st = { thermal: !!o.thermal, run: false, t: -1, tt: 0, glow: 1 };
    const api = { st, onEnd: null, LAMPS };
    api.thermal = (v) => { st.thermal = v == null ? !st.thermal : v; };
    api.follow = () => { st.t = 0; st.run = true; };
    api.reset = () => { st.t = -1; st.run = false; };
    api.finish = () => { st.t = DUR + TRIP + OUT + 0.1; st.run = false; };
    const Y = { heat: 66, rim: 286, desk: 540, light: 628, elec: 716 };
    const geo = LAMPS.map((L) => {
      const x = L.x, base = [x + 120, Y.desk - 6], out = [x + 228, 470];
      const cord = bez(out, [out[0] - 4, 520], [base[0] + 70, Y.desk - 2], [base[0] + 30, Y.desk - 4]);
      const path = line(cord.concat([[base[0], Y.desk - 14], [base[0], 150], [x + 14, 150], [x, 178], [x, Y.rim + 48]]));
      const tokens = L.pat.split('').map((c, i) => ({ c, i, t0: (i + 0.5) * (DUR / L.n) - TRIP * 0.2 }));
      let li = 0, hi = 0;
      tokens.forEach((tk, i) => { tk.slot = tk.c === 'L' ? li++ : hi++; tk.side = (i % 2 ? 1 : -1); tk.ei = i; });
      return { L, x, base, out, cord, path, PL: polyLen(path), tokens };
    });
    const slotX = (x, i, n) => x + (i - (n - 1) / 2) * 28;
    addLoop(host, (dt) => {
      st.tt += dt;
      if (st.run) { st.t += dt; if (st.t > DUR + TRIP + OUT + 0.1) { st.run = false; api.onEnd && api.onEnd(); } }
      draw();
    });
    function token(x, y, c, s = 20, a = 1) {
      const cols = c === 'E' ? ['#3d86cc', BLUE] : c === 'L' ? LIGHT : HEAT;
      ctx.globalAlpha = a; ctx.fillStyle = vgrad(ctx, y - s / 2, y + s / 2, cols); rr(ctx, x - s / 2, y - s / 2, s, s, 5); ctx.fill();
      ctx.strokeStyle = 'rgba(20,38,59,.18)'; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1;
    }
    function lampBody(g, th) {
      const { x, base } = g, L = g.L;
      // 받침
      if (!th) contact(ctx, base[0], Y.desk + 2, 200, 0.2);
      ctx.fillStyle = th ? thc(0.2) : vgrad(ctx, Y.desk - 26, Y.desk + 6, ['#f5f7f9', '#dfe5eb', '#b9c3cd']);
      ctx.beginPath(); ctx.ellipse(base[0], Y.desk - 8, 72, 15, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = th ? thc(0.22) : '#eef2f5'; ctx.beginPath(); ctx.ellipse(base[0], Y.desk - 14, 64, 11, 0, 0, TAU); ctx.fill();
      // 기둥·팔
      ctx.fillStyle = th ? thc(0.24) : hgrad(ctx, base[0] - 7, base[0] + 7, ['#c3ccd5', '#f6f8fa', '#aeb7c1']);
      ctx.fillRect(base[0] - 6, 150, 12, Y.desk - 162);
      ctx.strokeStyle = th ? thc(0.26) : '#d0d8e0'; ctx.lineWidth = 11; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(base[0], 152); ctx.lineTo(x + 18, 152); ctx.stroke();
      ctx.strokeStyle = th ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(base[0], 149); ctx.lineTo(x + 18, 149); ctx.stroke();
      // 갓(종 모양, 아래가 열림)
      const top = 168, rim = Y.rim, R = 104;
      ctx.beginPath(); ctx.moveTo(x - 26, top); ctx.bezierCurveTo(x - 40, top + 40, x - R + 6, rim - 50, x - R, rim);
      ctx.ellipse(x, rim, R, 22, 0, Math.PI, 0, true);
      ctx.bezierCurveTo(x + R - 6, rim - 50, x + 40, top + 40, x + 26, top); ctx.closePath();
      ctx.fillStyle = th ? thc(0.3 + 0.18 * L.hot) : hgrad(ctx, x - R, x + R, ['#c9d1d9', '#f4f6f8', '#ffffff', '#dfe5eb', '#b2bcc6']); ctx.fill();
      if (!th) { ctx.strokeStyle = 'rgba(110,125,140,.35)'; ctx.lineWidth = 1; ctx.stroke(); }
      ctx.fillStyle = th ? thc(0.28) : vgrad(ctx, top - 14, top + 6, ['#e9eef2', '#c3ccd5']); rr(ctx, x - 28, top - 14, 56, 20, 7); ctx.fill();
      // 갓 안쪽(밝게 보이는 면)
      ctx.beginPath(); ctx.ellipse(x, rim, R - 4, 19, 0, 0, TAU);
      ctx.fillStyle = th ? thc(0.45 + 0.3 * L.hot) : 'rgba(255,244,214,.95)'; ctx.fill();
    }
    function bulb(g, th, flash) {
      const { x } = g, L = g.L, cy = Y.rim + 48;
      if (th) {
        const r = 48 + 72 * L.hot;
        const gr = ctx.createRadialGradient(x, cy, 4, x, cy, r);
        const top = L.hot;
        for (let i = 0; i <= 10; i++) gr.addColorStop(i / 10, thc(lerp(top, 0.34, Math.pow(i / 10, 0.8)), i === 10 ? 0 : 1));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, cy, r, 0, TAU); ctx.fill();
        return;
      }
      ctx.fillStyle = vgrad(ctx, Y.rim - 8, Y.rim + 18, ['#dfe5eb', '#aeb7c1']); rr(ctx, x - 16, Y.rim - 6, 32, 22, 4); ctx.fill();
      const lum = 0.85 + 0.15 * flash;
      ctx.fillStyle = vgrad(ctx, Y.rim + 8, Y.rim + 26, ['#f3f5f7', '#c9d1d9']); rr(ctx, x - 20, Y.rim + 6, 40, 20, 5); ctx.fill();
      const glass = (a) => `rgba(255,${Math.round(250 - 12 * flash)},${Math.round(228 - 40 * flash)},${a})`;
      if (L.kind === 'spiral') {
        // 나선형 관: 뒤쪽 반은 어둡게, 앞쪽 반은 밝게
        ctx.lineCap = 'round';
        const turns = 5, y0 = Y.rim + 34, dy = 13, rx = 25, ry = 7;
        for (let i = 0; i < turns; i++) { const yy = y0 + i * dy; ctx.strokeStyle = 'rgba(196,178,130,.95)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(x, yy + 3, rx, ry, 0.1, Math.PI, TAU); ctx.stroke(); }
        for (let i = 0; i < turns; i++) {
          const yy = y0 + i * dy;
          ctx.strokeStyle = 'rgba(150,132,90,.75)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.ellipse(x, yy, rx, ry, -0.1, 0.05, Math.PI - 0.05); ctx.stroke();
          ctx.strokeStyle = glass(1); ctx.lineWidth = 9.5; ctx.beginPath(); ctx.ellipse(x, yy, rx, ry, -0.1, 0.05, Math.PI - 0.05); ctx.stroke();
        }
        ctx.strokeStyle = glass(1); ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(x, y0 + (turns - 1) * dy + 4, 8, 0, Math.PI); ctx.stroke();
      } else {
        const by = Y.rim + 64, br = 40;
        const gg = ctx.createRadialGradient(x - 12, by - 14, 4, x, by, br);
        gg.addColorStop(0, glass(lum)); gg.addColorStop(1, `rgba(250,226,170,${lum})`);
        ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(x - 16, Y.rim + 24); ctx.lineTo(x - 22, by - br * 0.75); ctx.arc(x, by, br, Math.PI * 1.25, Math.PI * 1.75, true); ctx.lineTo(x + 16, Y.rim + 24); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(190,170,120,.5)'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
    function cone(g) {
      const { x } = g, R = 104;
      const gr = ctx.createLinearGradient(0, Y.rim, 0, Y.desk + 10);
      gr.addColorStop(0, 'rgba(255,236,170,.42)'); gr.addColorStop(1, 'rgba(255,236,170,.12)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - R + 6, Y.rim + 6); ctx.lineTo(x - 210, Y.desk + 14); ctx.lineTo(x + 210, Y.desk + 14); ctx.lineTo(x + R - 6, Y.rim + 6); ctx.closePath(); ctx.fill();
      const pg = ctx.createRadialGradient(x, Y.desk + 14, 10, x, Y.desk + 14, 220);
      pg.addColorStop(0, 'rgba(255,236,170,.55)'); pg.addColorStop(1, 'rgba(255,236,170,0)');
      ctx.save(); ctx.translate(x, Y.desk + 14); ctx.scale(1, 0.14); ctx.translate(-x, -(Y.desk + 14)); ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(x, Y.desk + 14, 220, 0, TAU); ctx.fill(); ctx.restore();
    }
    function draw() {
      const th = st.thermal;
      S.begin();
      if (th) { white(S, thc(0.06)); const [fx, , fw, fh] = S.full(); ctx.fillStyle = thc(0.1); ctx.fillRect(fx, Y.desk, fw, fh); }
      else { white(S); desk(S, Y.desk); }
      // 콘센트
      geo.forEach((g) => {
        ctx.fillStyle = th ? thc(0.12) : '#eef2f5'; rr(ctx, g.out[0] - 22, g.out[1] - 30, 44, 60, 8); ctx.fill();
        if (!th) { ctx.strokeStyle = '#cfd8e0'; ctx.lineWidth = 1; ctx.stroke(); }
        ctx.fillStyle = th ? thc(0.14) : '#dfe5eb'; ctx.beginPath(); ctx.arc(g.out[0], g.out[1], 14, 0, TAU); ctx.fill();
        wire(ctx, g.cord, th ? thc(0.18) : '#cfd7df', 5);
      });
      if (!th) geo.forEach(cone);
      const flash = (g) => { let f = 0; g.tokens.forEach((tk) => { const k = st.t - tk.t0 - TRIP; if (k > -0.12 && k < 0.2) f = Math.max(f, 1 - Math.abs(k - 0.04) / 0.16); }); return clamp(f, 0, 1); };
      geo.forEach((g) => { lampBody(g, th); bulb(g, th, flash(g)); });
      // 1초 동안의 에너지 알갱이 (아래 기록판)
      const showRows = st.t >= 0;
      ctx.fillStyle = '#f6f9fc'; rr(ctx, 16, 584, 1168, 206, 16); ctx.fill(); ctx.strokeStyle = '#dde6ee'; ctx.lineWidth = 1; ctx.stroke();
      geo.forEach((g) => {
        const L = g.L;
        let nE = 0, nL = 0, nH = 0;
        g.tokens.forEach((tk) => {
          const k = st.t - tk.t0;
          if (k < 0 || st.t < 0) return;
          nE++;
          if (k < TRIP) { const p = along(g.path, g.PL, ease(k / TRIP) * g.PL[g.PL.length - 1]); token(p[0], p[1], 'E', 18); return; }
          const u = (k - TRIP) / OUT;
          if (tk.c === 'L') {
            const tx = slotX(g.x, tk.slot, L.L), ty = Y.light;
            if (u < 1) {
              const p0 = [g.x, Y.rim + 70], p1 = [lerp(g.x, tx, 0.6), Y.desk - 10];
              const q = u < 0.6 ? [lerp(p0[0], p1[0], ease(u / 0.6)), lerp(p0[1], p1[1], ease(u / 0.6))] : [lerp(p1[0], tx, ease((u - 0.6) / 0.4)), lerp(p1[1], ty, ease((u - 0.6) / 0.4))];
              token(q[0], q[1], 'L', 18);
            }
            else nL++;
          } else {
            const tx = slotX(g.x, tk.slot, L.H), ty = Y.heat, sx = g.x + tk.side * 132;
            if (u < 1) {
              const hy = Y.rim + 30, p = u < 0.35 ? [lerp(g.x, sx, ease(u / 0.35)), lerp(Y.rim + 50, hy, u / 0.35)] : [lerp(sx, tx, ease((u - 0.35) / 0.65)) + Math.sin(u * 14) * 7 * (1 - u), lerp(hy, ty, ease((u - 0.35) / 0.65))];
              token(p[0], p[1], 'H', 18);
            } else nH++;
          }
        });
        if (!showRows) return;
        const rowE = Array.from({ length: nE }, (_, i) => slotX(g.x, i, L.n));
        rowE.forEach((x) => token(x, Y.elec, 'E', 20));
        for (let i = 0; i < nL; i++) token(slotX(g.x, i, L.L), Y.light, 'L', 20);
        for (let i = 0; i < nH; i++) token(slotX(g.x, i, L.H), Y.heat, 'H', 20);
        OL.put(g.L.id + 've', slotX(g.x, Math.max(nE, 1) - 1, L.n) + 22, Y.elec, `${nE} J`, 'tx val ra');
        OL.put(g.L.id + 'vl', slotX(g.x, Math.max(nL, 1) - 1, L.L) + 22, Y.light, `${nL} J`, 'tx val ra');
        OL.put(g.L.id + 'vh', slotX(g.x, Math.max(nH, 1) - 1, L.H) + 22, Y.heat, `${nH} J`, 'tx val ra' + (th ? ' inv' : ''));
      });
      if (showRows) {
        ctx.strokeStyle = '#e3e9ef'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(36, (Y.light + Y.elec) / 2); ctx.lineTo(1164, (Y.light + Y.elec) / 2); ctx.stroke();
        OL.put('rl', 36, Y.light, '빛에너지', 'tx grp sm');
        OL.put('re', 36, Y.elec, '전기 에너지', 'tx grp sm blue');
        OL.put('rh', 36, Y.heat, '열에너지', 'tx grp sm' + (th ? ' inv' : ''));
        const sec = clamp(st.t / DUR, 0, 1);
        OL.put('clk', 600, Y.elec + 46, st.t < DUR ? `1초 동안 들어간 전기 에너지 · <b>${sec.toFixed(1)}초</b>` : '1초 동안 들어간 전기 에너지 · <b>1초 끝</b>', 'tx m');
        OL.hide('hint0');
      } else { ['rl', 're', 'rh', 'clk', 'ave', 'avl', 'avh', 'bve', 'bvl', 'bvh'].forEach((k) => OL.hide(k)); OL.put('hint0', 600, 687, '1초 동안 들어간 전기 에너지와 나온 빛에너지·열에너지가 여기에 1 J씩 쌓여요', 'tx m'); }
      // 열화상 눈금
      if (th) {
        const x0 = 440, x1 = 760, y = 24;
        for (let i = 0; i < 64; i++) { ctx.fillStyle = thc(i / 63); ctx.fillRect(x0 + (i / 64) * (x1 - x0), y - 7, (x1 - x0) / 64 + 0.6, 14); }
        OL.put('t0', x0 - 8, y, '17 ℃', 'tx sc la inv'); OL.put('t1', x1 + 8, y, '83 ℃', 'tx sc ra inv');
        OL.put('tcap', 600, Y.desk - 24, '열화상 사진기로 본 모습', 'tx m inv');
      } else { OL.hide('t0'); OL.hide('t1'); OL.hide('tcap'); }
      geo.forEach((g) => OL.put('n' + g.L.id, g.x - 150, 236, g.L.name, 'tx nm big' + (th ? ' inv' : '')));
    }
    return api;
  }

  /* =====================================================================
     거실과 전력량계: 하루 동안 쓴 전력량, 대기전력
     ===================================================================== */
  const DEV = [
    { id: 'lamp', name: '전등', w: 20, h: 5, sb: false, plug: null },
    { id: 'fan', name: '선풍기', w: 40, h: 4, sb: false, plug: 0 },
    { id: 'tv', name: '텔레비전', w: 100, h: 3, sb: true, plug: 1 },
    { id: 'pc', name: '컴퓨터', w: 200, h: 2, sb: true, plug: 2 },
    { id: 'ac', name: '에어컨', w: 1000, h: 2, sb: true, plug: 3 },
  ];
  function room(host, o = {}) {
    const S = surface(host, 1200, 800), ctx = S.ctx, OL = overlay(S);
    const st = { mode: o.mode || 'day', t: 0, run: false, tt: 0, h: {}, plug: { fan: true, tv: true, pc: true, ac: true }, tap: true, a: 0, sp: 0, disc: 0, rate: 0, blink: 0, night: 0, ph: {} };
    DEV.forEach((d) => { st.h[d.id] = o.h && o.h[d.id] != null ? o.h[d.id] : d.h; st.ph[d.id] = 0; });
    const api = { st, DEV, onEnd: null };
    api.maxH = () => Math.max(0, ...DEV.map((d) => st.h[d.id]));
    api.wh = (id) => { const d = DEV.find((x) => x.id === id); return d.w * Math.min(st.t, st.h[id]); };
    api.total = () => DEV.reduce((s, d) => s + api.wh(d.id), 0);
    api.setH = (id, h) => { st.h[id] = h; };
    api.day = () => { st.mode = 'day'; st.t = 0; st.run = true; if (api.maxH() === 0) { st.run = false; api.onEnd && api.onEnd(); } };
    api.jump = (t) => { st.mode = 'day'; st.t = t; st.run = false; };
    api.reset = () => { st.t = 0; st.run = false; };
    api.setMode = (m) => { st.mode = m; st.t = 0; st.run = false; };
    api.setPlug = (id, v) => { st.plug[id] = v; };
    api.setTap = (v) => { st.tap = v; };
    const powered = (id) => (id === 'lamp' ? true : st.plug[id] && st.tap);
    const isOn = (id) => st.mode === 'day' && st.run && st.t < st.h[id] && powered(id);
    const standby = (id) => st.mode === 'night' && DEV.find((d) => d.id === id).sb && powered(id);
    api.standbyAny = () => DEV.some((d) => standby(d.id));
    addLoop(host, (dt) => {
      st.tt += dt;
      if (st.run) { st.t += dt / 0.9; const M = api.maxH(); if (st.t >= M) { st.t = M; st.run = false; api.onEnd && api.onEnd(); } }
      const P = st.mode === 'day' ? DEV.reduce((s, d) => s + (isOn(d.id) ? d.w : 0), 0) : 0;
      const target = st.mode === 'day' ? (P > 0 ? 0.6 + Math.sqrt(P) * 0.22 : 0) : (api.standbyAny() ? 0.25 : 0);
      st.rate = lerp(st.rate, target, Math.min(1, dt * 3)); st.disc += st.rate * dt * TAU * 0.5;
      st.night = lerp(st.night, st.mode === 'night' ? 1 : 0, Math.min(1, dt * 2.5));
      const fanTgt = isOn('fan') ? 18 : 0; st.sp = lerp(st.sp, fanTgt, Math.min(1, dt * (fanTgt ? 1.2 : 0.6))); st.a += st.sp * dt;
      DEV.forEach((d) => { st.ph[d.id] += dt * (isOn(d.id) ? 50 + Math.sqrt(d.w) * 6 : standby(d.id) ? 14 : 0); });
      draw();
    });
    const TAPX = (i) => 520 + i * 52, TAPY = 742;
    function floor() {
      const [fx, , fw] = S.full();
      ctx.fillStyle = vgrad(ctx, 560, 800, ['#d9c3a2', '#cfb28a', '#c4a47a']); ctx.fillRect(fx, 560, fw, 260);
      ctx.strokeStyle = 'rgba(120,88,52,.18)'; ctx.lineWidth = 1;
      for (let i = -14; i <= 14; i++) { const xb = 600 + i * 70; ctx.beginPath(); ctx.moveTo(xb, 560); ctx.lineTo(600 + i * 130, 820); ctx.stroke(); }
      [610, 680, 770].forEach((y, j) => { for (let i = -10; i <= 10; i++) { const x = 600 + (i + (j % 2) * 0.5) * (70 + (y - 560) * 0.23) * 2.1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 6, y + 2); ctx.stroke(); } });
      ctx.fillStyle = '#fbfaf8'; ctx.fillRect(fx, 548, fw, 14); ctx.fillStyle = 'rgba(120,100,80,.18)'; ctx.fillRect(fx, 561, fw, 2);
    }
    function wall() {
      const [fx, fy, fw] = S.full();
      ctx.fillStyle = vgrad(ctx, fy, 560, ['#f6f4f0', '#efece6']); ctx.fillRect(fx, fy, fw, 560 - fy);
      // 창문
      const wx = 250, wy = 92, ww = 170, wh = 210;
      ctx.fillStyle = '#e4e8ec'; rr(ctx, wx - 10, wy - 10, ww + 20, wh + 20, 6); ctx.fill();
      const day = vgrad(ctx, wy, wy + wh, ['#cfe3f4', '#e8f2fa']), nt = vgrad(ctx, wy, wy + wh, ['#1c2a44', '#2d4062']);
      ctx.fillStyle = day; ctx.fillRect(wx, wy, ww, wh);
      if (st.night > 0.01) { ctx.globalAlpha = st.night; ctx.fillStyle = nt; ctx.fillRect(wx, wy, ww, wh); ctx.fillStyle = '#e9edf2'; ctx.beginPath(); ctx.arc(wx + 120, wy + 52, 14, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a3c5c'; ctx.beginPath(); ctx.arc(wx + 127, wy + 47, 12, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.fillStyle = '#f7f8fa'; ctx.fillRect(wx + ww / 2 - 4, wy, 8, wh); ctx.fillRect(wx, wy + wh / 2 - 4, ww, 8);
      ctx.fillStyle = '#d6dce2'; ctx.fillRect(wx - 16, wy + wh + 8, ww + 32, 10);
    }
    function meterBox(x, y, k) {
      // 벽에 달린 전력량계(숫자 창 + 회전판 창)
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-x, -y);
      ctx.fillStyle = '#e1e6eb'; rr(ctx, x - 62, y - 92, 124, 200, 12); ctx.fill(); ctx.strokeStyle = '#c3ccd5'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = vgrad(ctx, y - 80, y + 96, ['#f7f9fb', '#e3e8ed']); rr(ctx, x - 52, y - 82, 104, 180, 10); ctx.fill();
      ctx.fillStyle = '#28333f'; rr(ctx, x - 40, y - 64, 80, 30, 5); ctx.fill();
      // 회전판 창
      ctx.fillStyle = '#1f2830'; rr(ctx, x - 40, y + 2, 80, 26, 5); ctx.fill();
      ctx.save(); rr(ctx, x - 38, y + 4, 76, 22, 4); ctx.clip();
      ctx.fillStyle = vgrad(ctx, y + 8, y + 22, ['#c7ced6', '#eef1f4', '#9aa4ae']); ctx.beginPath(); ctx.ellipse(x, y + 15, 48, 7, 0, 0, TAU); ctx.fill();
      const mx = x + Math.cos(st.disc) * 44;
      if (Math.sin(st.disc) > 0) { ctx.fillStyle = '#b8473c'; ctx.fillRect(mx - 3, y + 9, 6, 12); }
      ctx.restore();
      ctx.fillStyle = 'rgba(90,107,126,.6)'; ctx.font = '600 9px Pretendard, sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#c3ccd5'; rr(ctx, x - 30, y + 50, 60, 12, 3); ctx.fill();
      ctx.restore();
      return { lcd: [x, y - 49 * k], disc: [x, y + 15 * k], out: [x, y + 108 * k], bottom: y + 108 * k };
    }
    function ceilingLamp(on) {
      const x = 600;
      if (on > 0.02) { const g = ctx.createRadialGradient(x, 40, 10, x, 40, 260); g.addColorStop(0, `rgba(255,236,170,${0.35 * on})`); g.addColorStop(1, 'rgba(255,236,170,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, 40, 260, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#e3e8ed'; ctx.fillRect(x - 70, 0, 140, 10);
      ctx.beginPath(); ctx.ellipse(x, 22, 110, 22, 0, 0, Math.PI); ctx.lineTo(x - 110, 10); ctx.lineTo(x + 110, 10); ctx.closePath();
      ctx.fillStyle = on > 0.3 ? `rgba(255,${Math.round(lerp(245, 238, on))},${Math.round(lerp(236, 200, on))},1)` : vgrad(ctx, 10, 44, ['#ffffff', '#e6ebf0']); ctx.fill();
      ctx.strokeStyle = 'rgba(110,125,140,.3)'; ctx.lineWidth = 1; ctx.stroke();
    }
    function aircon(on, sb) {
      const x0 = 840, y0 = 90, w = 300, h = 96;
      contact(ctx, x0 + w / 2, y0 + h + 10, w * 0.9, 0.08, 0.1);
      rr(ctx, x0, y0, w, h, 14); ctx.fillStyle = vgrad(ctx, y0, y0 + h, PLASTIC); ctx.fill(); ctx.strokeStyle = 'rgba(110,125,140,.35)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#c3ccd5'; rr(ctx, x0 + 20, y0 + h - 22, w - 40, 12, 5); ctx.fill();
      ctx.fillStyle = on ? '#6b7c8f' : '#aeb7c1'; rr(ctx, x0 + 24, y0 + h - 20 + (on ? 0 : 2), w - 48, on ? 8 : 4, 3); ctx.fill();
      ctx.fillStyle = '#e9eef2'; rr(ctx, x0 + w - 62, y0 + 22, 40, 16, 4); ctx.fill();
      led(x0 + w - 30, y0 + 50, sb, on);
      air(ctx, x0 + w / 2, y0 + h - 6, 150, 110, st.tt, '120,165,205', on ? 1 : 0, 2, 6);
      return [x0 + w - 6, y0 + 60];
    }
    function led(x, y, sb, on) {
      const c = on ? '#4fae6a' : sb ? '#d9483b' : '#b9c3cd';
      if (sb || on) { const g = ctx.createRadialGradient(x, y, 0, x, y, 9); g.addColorStop(0, on ? 'rgba(79,174,106,.45)' : 'rgba(217,72,59,.5)'); g.addColorStop(1, 'rgba(217,72,59,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); }
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
    }
    function tv(on, sb) {
      // 장식장
      ctx.fillStyle = vgrad(ctx, 470, 552, ['#a07c58', '#8a6948']); rr(ctx, 430, 470, 340, 84, 6); ctx.fill();
      ctx.fillStyle = '#b48e68'; ctx.fillRect(430, 470, 340, 8);
      ctx.strokeStyle = 'rgba(60,40,20,.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(600, 482); ctx.lineTo(600, 548); ctx.stroke();
      ctx.fillStyle = '#6f5338'; [560, 640].forEach((x) => { rr(ctx, x - 14, 508, 28, 5, 2); ctx.fill(); });
      ctx.fillStyle = '#5e4a35'; ctx.fillRect(440, 552, 10, 10); ctx.fillRect(750, 552, 10, 10);
      // 텔레비전
      ctx.fillStyle = '#3a424b'; rr(ctx, 560, 452, 80, 12, 3); ctx.fill(); ctx.fillRect(594, 440, 12, 16);
      rr(ctx, 444, 262, 312, 186, 8); ctx.fillStyle = '#1e242b'; ctx.fill();
      ctx.save(); rr(ctx, 452, 270, 296, 166, 3); ctx.clip();
      if (on) {
        ctx.fillStyle = vgrad(ctx, 270, 436, ['#9cc6e6', '#d6e8f4']); ctx.fillRect(452, 270, 296, 166);
        const sh = Math.sin(st.tt * 0.4) * 10;
        ctx.fillStyle = '#7fb07c'; ctx.beginPath(); ctx.moveTo(452, 400); ctx.quadraticCurveTo(540 + sh, 330, 640, 380); ctx.quadraticCurveTo(700, 400, 748, 360); ctx.lineTo(748, 436); ctx.lineTo(452, 436); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5f9560'; ctx.beginPath(); ctx.moveTo(452, 420); ctx.quadraticCurveTo(600, 380 - sh, 748, 420); ctx.lineTo(748, 436); ctx.lineTo(452, 436); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff6da'; ctx.beginPath(); ctx.arc(680 + sh, 310, 16, 0, TAU); ctx.fill();
      } else { ctx.fillStyle = vgrad(ctx, 270, 436, ['#2c343c', '#22292f']); ctx.fillRect(452, 270, 296, 166); }
      ctx.restore();
      led(600, 444, sb, false);
      return [700, 548];
    }
    function pc(on, sb) {
      // 책상
      ctx.fillStyle = '#d8dee4'; [870, 1110].forEach((x) => ctx.fillRect(x, 486, 10, 106));
      contact(ctx, 990, 594, 300, 0.12);
      ctx.fillStyle = vgrad(ctx, 470, 490, ['#f3f5f8', '#d6dce2']); rr(ctx, 850, 470, 290, 18, 4); ctx.fill();
      // 모니터
      ctx.fillStyle = '#3a424b'; ctx.fillRect(988, 436, 14, 34); rr(ctx, 958, 462, 74, 9, 3); ctx.fill();
      rr(ctx, 900, 326, 190, 118, 7); ctx.fillStyle = '#1e242b'; ctx.fill();
      ctx.save(); rr(ctx, 907, 333, 176, 102, 3); ctx.clip();
      if (on) {
        ctx.fillStyle = '#f4f7fa'; ctx.fillRect(907, 333, 176, 102);
        ctx.fillStyle = '#cfe0f0'; ctx.fillRect(907, 333, 176, 16);
        ctx.fillStyle = '#c3ccd5'; for (let i = 0; i < 5; i++) ctx.fillRect(918, 360 + i * 13, 90 + ((i * 37) % 50), 5);
        ctx.fillStyle = '#e3e9ef'; ctx.fillRect(1030, 360, 42, 60);
      } else { ctx.fillStyle = vgrad(ctx, 333, 435, ['#2c343c', '#22292f']); ctx.fillRect(907, 333, 176, 102); }
      ctx.restore();
      led(995, 440, sb, false);
      // 키보드
      ctx.fillStyle = '#e9eef2'; rr(ctx, 930, 474, 130, 8, 3); ctx.fill();
      return [880, 590];
    }
    function multitap() {
      ctx.save();
      contact(ctx, 600, TAPY + 22, 340, 0.16);
      rr(ctx, 490, TAPY - 18, 262, 38, 9); ctx.fillStyle = vgrad(ctx, TAPY - 18, TAPY + 20, ['#ffffff', '#e9eef2', '#cfd7df']); ctx.fill(); ctx.strokeStyle = 'rgba(110,125,140,.4)'; ctx.lineWidth = 1; ctx.stroke();
      for (let i = 0; i < 4; i++) { ctx.fillStyle = '#d8dfe6'; ctx.beginPath(); ctx.ellipse(TAPX(i), TAPY, 16, 12, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#6b7783'; [-5, 5].forEach((d) => { ctx.beginPath(); ctx.arc(TAPX(i) + d, TAPY, 2, 0, TAU); ctx.fill(); }); }
      // 스위치
      ctx.fillStyle = st.tap ? '#e7a77d' : '#c9d1d9'; rr(ctx, 720, TAPY - 11, 22, 22, 4); ctx.fill();
      ctx.fillStyle = st.tap ? '#d9824f' : '#aeb7c1'; rr(ctx, 723, TAPY - 9 + (st.tap ? 0 : 8), 16, 10, 2); ctx.fill();
      ctx.restore();
      return [490, TAPY];
    }
    function plugAt(i, id, from) {
      const sx = TAPX(i), sy = TAPY;
      const p = st.plug[id] ? [sx, sy] : [sx + 18 - i * 3, sy + 50];
      const pts = bez(from, [from[0], from[1] + 60], [p[0], p[1] - 80 + (st.plug[id] ? 0 : 40)], [p[0], p[1] - 8]);
      wire(ctx, pts, '#d5dbe1', 4);
      ctx.fillStyle = vgrad(ctx, p[1] - 14, p[1] + 10, ['#ffffff', '#cfd7df']); rr(ctx, p[0] - 11, p[1] - 16, 22, 24, 5); ctx.fill(); ctx.strokeStyle = 'rgba(110,125,140,.45)'; ctx.lineWidth = 1; ctx.stroke();
      return pts;
    }
    function draw() {
      S.begin(); white(S);
      wall(); floor();
      const lampOn = isOn('lamp') ? 1 : 0;
      ceilingLamp(lampOn);
      const m = meterBox(98, 196, 1.42);
      const pAC = aircon(isOn('ac'), standby('ac'));
      const pTV = tv(isOn('tv'), standby('tv'));
      const pPC = pc(isOn('pc'), standby('pc'));
      const f = fan(ctx, 300, 340, 92, st.a, st.sp, 704);
      air(ctx, 352, 340, 120, 60, st.tt, '120,160,195', clamp(st.sp / 16, 0, 1));
      // 전선: 에어컨은 벽을 따라 내려옴
      const tapIn = multitap();
      const cAC = plugAt(3, 'ac', [1150, 640]);
      wire(ctx, [pAC, [1150, pAC[1]], [1150, 640]], '#d5dbe1', 4);
      const cTV = plugAt(1, 'tv', pTV), cPC = plugAt(2, 'pc', pPC), cFan = plugAt(0, 'fan', f.cord);
      const main = bez(m.out, [m.out[0], 520], [300, 760], tapIn);
      wire(ctx, main, '#d5dbe1', 5);
      // 흐르는 점
      const flowAmt = (id) => (isOn(id) ? 1 : standby(id) ? 0.45 : 0);
      const gapOf = (id) => (isOn(id) ? clamp(70 - Math.sqrt(DEV.find((d) => d.id === id).w) * 1.6, 18, 60) : 70);
      [['ac', [pAC, [1150, pAC[1]], [1150, 640]].concat(cAC)], ['tv', cTV], ['pc', cPC], ['fan', cFan]].forEach(([id, pts]) => dots(ctx, line(pts).reverse(), st.ph[id], gapOf(id), flowAmt(id), 2.8));
      const anyFlow = DEV.some((d) => isOn(d.id) || standby(d.id));
      dots(ctx, main, st.tt * (st.mode === 'day' ? 80 : 20), st.mode === 'day' ? 26 : 70, anyFlow ? (st.mode === 'day' ? 1 : 0.45) : 0, 3);
      // 밤
      if (st.night > 0.01) {
        const [fx, fy, fw, fh] = S.full(); ctx.fillStyle = `rgba(16,28,54,${0.5 * st.night})`; ctx.fillRect(fx, fy, fw, fh);
        if (st.mode === 'night') { // 대기 표시등은 어둠 위에 다시
          if (standby('tv')) led(600, 444, true, false);
          if (standby('pc')) led(995, 440, true, false);
          if (standby('ac')) led(1110, 140, true, false);
        }
      }
      // 이름표
      const dim = st.mode === 'night' ? ' inv' : '';
      if (st.mode === 'day') OL.put('mlcd', m.lcd[0], m.lcd[1], `${fmt(api.total())} <small>Wh</small>`, 'lcd'); else OL.hide('mlcd');
      OL.put('nm', 98, m.bottom + 18, '전력량계', 'tx nm sm' + dim);
      if (st.mode === 'night') OL.put('disc', 24, m.bottom + 54, api.standbyAny() ? '회전판이 아주 천천히 돌아요' : '회전판이 멈췄어요', 'tx clock ra'); else OL.hide('disc');
      OL.put('nl', 600, 66, '전등', 'tx nm sm' + dim);
      OL.put('na', 990, 214, '에어컨', 'tx nm sm' + dim);
      OL.put('nt', 600, 246, '텔레비전', 'tx nm sm' + dim);
      OL.put('np', 995, 308, '컴퓨터', 'tx nm sm' + dim);
      OL.put('nf', 300, 222, '선풍기', 'tx nm sm' + dim);
      OL.put('nx', 620, 790, '멀티탭', 'tx nm sm' + dim);
      if (st.mode === 'day') OL.put('clk', 600, 140, st.t > 0 || st.run ? `사용한 시간 <b>${st.t >= api.maxH() && !st.run ? api.maxH() : Math.floor(st.t)}시간</b>` : '', 'tx clock' + (st.t > 0 || st.run ? '' : ' hide'));
      else OL.hide('clk');
    }
    return api;
  }

  /* =====================================================================
     전력량 그래프: 시간(h)에 따른 전력량(Wh), 기울기 = 소비 전력 (선생님 요청으로 더한 그래프 해석)
     set({a:{name,w}, b:{name,w}|null, t, step, tri})  step 0 보통, 1~5 차근차근 단계
     ===================================================================== */
  function graph(host, o = {}) {
    const S = surface(host, 1100, 640), ctx = S.ctx, OL = overlay(S);
    const X0 = 120, X1 = 900, YB = 560, YT = 50, T = 5;
    const st = Object.assign({ a: { name: '(가) 전구', w: 12 }, b: { name: '(나) 전구', w: 8 }, t: 2, td: 0, step: 0, tri: false }, o);
    const COL = { a: BLUE, b: '#3f4d5c' };
    const api = { st, set(v) { Object.assign(st, v); } };
    function nice(v) { const e = Math.pow(10, Math.floor(Math.log10(v))); for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * e >= v) return m * e; return 10 * e; }
    addLoop(host, (dt) => { st.td = reduce ? st.t : lerp(st.td, st.t, Math.min(1, dt * 5)); if (Math.abs(st.td - st.t) < 0.002) st.td = st.t; draw(); });
    function draw() {
      S.begin(); white(S);
      const showB = st.b && st.step !== 1, ser = [['a', st.a]].concat(showB ? [['b', st.b]] : []);
      const ymax = nice(Math.max(st.a.w, st.b ? st.b.w : 0) * T * 1.04);
      const px = (h) => X0 + (h / T) * (X1 - X0), py = (wh) => YB - (wh / ymax) * (YB - YT);
      // 눈금과 격자
      const n = 5;
      for (let i = 0; i <= n; i++) { const v = (ymax / n) * i, y = py(v); ctx.strokeStyle = i ? '#eef2f6' : '#9fb0c1'; ctx.lineWidth = i ? 1 : 1.6; ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y); ctx.stroke(); OL.put('y' + i, X0 - 12, y, fmt(v), 'tx sc la'); }
      for (let h = 0; h <= T; h++) { const x = px(h); if (h) { ctx.strokeStyle = '#eef2f6'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, YB); ctx.lineTo(x, YT); ctx.stroke(); } OL.put('x' + h, x, YB + 22, String(h), 'tx sc'); }
      ctx.strokeStyle = '#9fb0c1'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(X0, YT - 10); ctx.lineTo(X0, YB); ctx.stroke();
      OL.put('ax', (X0 + X1) / 2, YB + 58, '시간(h)', 'tx nm sm'); OL.put('ay', X0 - 80, YT - 26, '전력량(Wh)', 'tx nm sm ra');
      const td = st.step === 1 || st.step === 2 || st.step >= 4 ? T : st.td;
      // 지금 시간 세로선
      const mark = st.step === 0 || st.step === 3;
      if (mark && td > 0.01) { ctx.strokeStyle = '#b9c6d3'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(px(td), YB); ctx.lineTo(px(td), YT); ctx.stroke(); ctx.setLineDash([]); OL.put('tm', px(td), YT - 22, `${Math.round(td * 10) / 10}시간`, 'tx clock'); } else OL.hide('tm');
      ['a', 'b'].forEach((k) => { ['e', 'v', 'tr1', 'tr2'].forEach((q) => OL.hide(k + q)); for (let h = 0; h <= T; h++) OL.hide(k + 'p' + h); });
      ser.forEach(([k, d], si) => {
        const c = COL[k], end = d.w * T;
        // 전체 직선(옅게)과 지금까지(진하게)
        ctx.strokeStyle = k === 'a' ? 'rgba(14,99,179,.22)' : 'rgba(63,77,92,.22)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px(0), py(0)); ctx.lineTo(px(T), py(end)); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px(0), py(0)); ctx.lineTo(px(td), py(d.w * td)); ctx.stroke();
        for (let h = 0; h <= Math.floor(td + 1e-6); h++) {
          ctx.fillStyle = '#fff'; ctx.strokeStyle = c; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(px(h), py(d.w * h), 6, 0, TAU); ctx.fill(); ctx.stroke();
          if ((st.step === 1 && k === 'a') || (st.step === 2 && k === 'b')) OL.put(k + 'p' + h, px(h) + (k === 'a' ? -10 : 12), py(d.w * h) + (k === 'a' ? -18 : 18), fmt(d.w * h), 'tx val sm' + (k === 'a' ? ' la' : ' ra'));
        }
        if (mark && td > 0.01) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(px(td), py(d.w * td), 9, 0, TAU); ctx.fill(); OL.put(k + 'v', px(td) + ((st.tri || st.step >= 4) && Math.abs(td - Math.max(1, Math.floor(td + 1e-6) - 1)) < 0.01 ? 96 : 16), py(d.w * td) + (si ? 18 : -18), `<b>${fmt(d.w * td)} Wh</b>`, 'tx val ra'); }
        // 기울기 계단(1시간 동안 늘어난 양)
        if (st.tri || st.step >= 4) {
          const ha = Math.max(0, Math.min(T - 1, Math.floor(td + 1e-6) - 2)), hb = Math.max(0, ha - 1), h0 = st.step >= 4 ? (k === 'a' ? 3 : 1) : (k === 'a' ? ha : hb), h1 = h0 + 1, same = st.step < 4 && ha === hb;
          const xa = px(h0), xb = px(h1), ya = py(d.w * h0), yb = py(d.w * h1);
          ctx.fillStyle = k === 'a' ? 'rgba(14,99,179,.08)' : 'rgba(63,77,92,.08)'; ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, ya); ctx.lineTo(xb, yb); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = c; ctx.lineWidth = 1.6; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, ya); ctx.lineTo(xb, yb); ctx.stroke(); ctx.setLineDash([]);
          if (!(same && k === 'a')) OL.put(k + 'tr1', (xa + xb) / 2, ya + 16, '1시간', 'tx sc');
          OL.put(k + 'tr2', xb + 10, same && k === 'a' ? Math.min((ya + yb) / 2, yb + 6) - 10 : (ya + yb) / 2, `+${fmt(d.w)} Wh`, 'tx val sm ra');
        }
        OL.put(k + 'e', X1 + 14, py(end), `${d.name} <span class="u">${fmt(d.w)} W</span>`, 'tx nm sm ra');
      });
      if (st.step === 5) OL.put('cap', (X0 + X1) / 2 - 120, YT + 26, '기울기 = 1시간 동안 늘어나는 전력량 = <b>소비 전력</b>', 'tx clock'); else OL.hide('cap');
    }
    return api;
  }

  return { plate, race, lamps, room, graph, devmap, thumb, DEVS, EN, DEV, LAMPS, fmt };
})();
