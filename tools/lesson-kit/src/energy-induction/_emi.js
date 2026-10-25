/* ===== 전자기 유도와 에너지 전환 그림 도구 (캔버스 2D) =====
   EMI.lab(host, o)    배움활동: 코일·검류계·막대자석. 자석이나 코일을 끌어 움직이면 검류계 바늘이 움직임(실험하기 1~3)
   EMI.flash(host, o)  그림 Ⅵ-7: 자가 발전 손전등 속. 끌어서 흔들면 자석이 코일을 지나며 전구가 켜짐
   EMI.gen(host, o)    그림 Ⅵ-8: 말굽 모양 자석 사이에서 코일이 회전하는 발전기. 손잡이·물·바람으로 돌리기
   EMI.drop(host, o)   그림 Ⅵ-9: 같은 자석을 (가) 빈 관, (나) 코일 감은 관에 동시에 떨어뜨리기 + 에너지 막대
   EMI.bike(host, o)   다른 예시(선생님 요청): 자전거 발전기 → 전조등·스피커·휴대 전화 충전, 에너지 띠 그림
   그림 원칙(디자인기준): 흰 바탕, 라스 파랑 한 색조 + 무채색, 실제 물체 색은 차분하게(구리, 자석 N 붉은색·S 파란색),
   매트한 질감, 얇은 선, 그림 속 글씨는 HTML 이름표. 빠르기·바늘 크기·밝기는 보기 좋게 정한 모형이다. */
window.EMI = (() => {
  const TAU = Math.PI * 2;
  const BLUE = '#0e63b3', INK = '#14263b';
  const NC = ['#d9776c', '#c4584c', '#9c3f35'], SC = ['#7f9fcd', '#4f74ab', '#36578a'];
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const PX = 0.32, PY = 0.18; // 앞쪽(z+)으로 갈수록 오른쪽 아래로 보이는 비스듬한 투영

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
    };
  }
  const loops = new Set();
  let last = 0;
  function tick(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0); last = now;
    loops.forEach((L) => { try { if (L.host.offsetParent !== null) { const r = L.host.getBoundingClientRect(); if (r.bottom > -50 && r.top < innerHeight + 50) L.fn(dt); } } catch (e) { loops.delete(L); (window.SM_err || window.RD_err || console.error)('전자기 유도 그림', e); } });
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
  function drag(S, hit, move, up) {
    const cv = S.cv; cv.style.touchAction = 'pan-y';
    let on = null;
    cv.addEventListener('pointerdown', (e) => { const p = S.toLocal(e); const h = hit(p[0], p[1]); if (!h) return; on = h; cv.setPointerCapture(e.pointerId); e.preventDefault(); move(p[0], p[1], on, true); });
    cv.addEventListener('pointermove', (e) => { const p = S.toLocal(e); if (on) { move(p[0], p[1], on, false); e.preventDefault(); } else cv.style.cursor = hit(p[0], p[1]) ? 'grab' : ''; });
    const end = () => { if (on) { const h = on; on = null; up && up(h); } };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    return { get on() { return on; } };
  }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function white(S) { const [fx, fy, fw, fh] = S.full(); S.ctx.fillStyle = '#fff'; S.ctx.fillRect(fx, fy, fw, fh); }
  function desk(S, y) {
    const ctx = S.ctx, [fx, , fw, fh] = S.full();
    const g = ctx.createLinearGradient(0, y, 0, y + 120); g.addColorStop(0, '#eef2f6'); g.addColorStop(1, '#f8fafc');
    ctx.fillStyle = g; ctx.fillRect(fx, y, fw, fh); ctx.fillStyle = '#d9e1e9'; ctx.fillRect(fx, y, fw, 1.2);
  }
  function contact(ctx, x, y, w, a = 0.18, sq = 0.16) {
    const g = ctx.createRadialGradient(x, y, 1, x, y, w / 2);
    g.addColorStop(0, `rgba(20,38,59,${a})`); g.addColorStop(1, 'rgba(20,38,59,0)');
    ctx.save(); ctx.translate(x, y); ctx.scale(1, sq); ctx.translate(-x, -y);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, w / 2, 0, TAU); ctx.fill(); ctx.restore();
  }
  const vgrad = (ctx, y0, y1, stops) => { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; };
  const COPPER = ['#e9b27f', '#cc8549', '#a1602e', '#6f3d1c'];
  const STEEL = ['#c7ced6', '#eef1f4', '#aeb7c1', '#7b8590'];

  /* ---- 비스듬한 원(축이 좌우인 원통의 단면) ---- */
  const rp = (x, cy, R, a) => [x + R * Math.sin(a) * PX, cy - R * Math.cos(a) + R * Math.sin(a) * PY];
  function arcPath(ctx, x, cy, R, a0, a1, first = true) {
    const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 0.14));
    for (let i = 0; i <= n; i++) { const p = rp(x, cy, R, lerp(a0, a1, i / n)); if (i === 0 && first) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }
  }
  // 좌우로 누운 원통(몸통 + 왼쪽 끝 면)
  function cylinder(ctx, x0, x1, cy, R, stops, endStops) {
    ctx.beginPath(); arcPath(ctx, x0, cy, R, Math.PI, 0); arcPath(ctx, x1, cy, R, 0, -Math.PI, false); ctx.closePath();
    ctx.fillStyle = vgrad(ctx, cy - R, cy + R, stops); ctx.fill();
    ctx.beginPath(); arcPath(ctx, x0, cy, R, 0, TAU); ctx.closePath();
    ctx.fillStyle = vgrad(ctx, cy - R, cy + R, endStops || stops.slice().reverse()); ctx.fill();
  }

  /* ---- 코일: 뒤쪽 절반(자석보다 먼저) / 앞쪽 절반(자석 다음) ---- */
  function coilTurns(o) { const a = []; for (let i = 0; i < o.n; i++) a.push(o.cx - o.L / 2 + (i + 0.5) * o.L / o.n); return a; }
  function coil(ctx, o, part) {
    const { cx, cy, L, R } = o, x0 = cx - L / 2, x1 = cx + L / 2, Rt = R - 7, Rf = R + 13;
    const turns = coilTurns(o), lw = o.lw || Math.min(5.6, (L / o.n) * 0.55);
    if (part === 'back') {
      // 투명한 플라스틱 관(안쪽 벽)
      ctx.beginPath(); arcPath(ctx, x0, cy, Rt, Math.PI, 0); arcPath(ctx, x1, cy, Rt, 0, -Math.PI, false); ctx.closePath();
      ctx.fillStyle = 'rgba(214,224,233,.45)'; ctx.fill();
      // 감은 도선의 뒤쪽 절반
      ctx.lineWidth = lw; ctx.lineCap = 'round';
      turns.forEach((x) => { ctx.beginPath(); arcPath(ctx, x, cy, R, Math.PI * 1.02, TAU * 0.99); ctx.strokeStyle = '#7d4824'; ctx.stroke(); });
      // 테 뒤쪽 절반
      if (o.flange !== false) [x0 - 8, x1 + 8].forEach((x) => {
        ctx.beginPath(); arcPath(ctx, x, cy, Rf, Math.PI, TAU); arcPath(ctx, x, cy, Rt, TAU, Math.PI, false); ctx.closePath();
        ctx.fillStyle = 'rgba(226,232,238,.9)'; ctx.fill(); ctx.strokeStyle = 'rgba(120,138,156,.5)'; ctx.lineWidth = 1; ctx.stroke();
      });
    } else {
      ctx.lineWidth = lw; ctx.lineCap = 'round';
      const g = vgrad(ctx, cy - R, cy + R, COPPER);
      turns.forEach((x) => {
        ctx.beginPath(); arcPath(ctx, x, cy, R, 0.02, Math.PI * 0.98); ctx.strokeStyle = g; ctx.stroke();
        ctx.beginPath(); arcPath(ctx, x - lw * 0.18, cy, R, 0.35, 1.25); ctx.strokeStyle = 'rgba(255,228,196,.55)'; ctx.lineWidth = lw * 0.32; ctx.stroke(); ctx.lineWidth = lw;
      });
      if (o.flange !== false) [x0 - 8, x1 + 8].forEach((x) => {
        ctx.beginPath(); arcPath(ctx, x, cy, Rf, 0, Math.PI); arcPath(ctx, x, cy, Rt, Math.PI, 0, false); ctx.closePath();
        ctx.fillStyle = vgrad(ctx, cy - Rf, cy + Rf, ['#f7f9fb', '#e3e9ef', '#c9d3dc']); ctx.fill();
        ctx.strokeStyle = 'rgba(110,128,146,.55)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); arcPath(ctx, x + 6, cy, Rf, 0.1, Math.PI * 0.9); ctx.strokeStyle = 'rgba(150,165,180,.6)'; ctx.lineWidth = 3; ctx.stroke();
      });
      // 관 앞쪽 가장자리 선
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(120,140,160,.35)';
      ctx.beginPath(); ctx.moveTo(x0, cy - Rt); ctx.lineTo(x1, cy - Rt); ctx.moveTo(x0 + Rt * PX * 0.4, cy + Rt); ctx.lineTo(x1, cy + Rt); ctx.stroke();
    }
  }
  // 코일을 지나는 자기장 양(모형): 막대자석 중심이 코일 중심에서 d만큼 떨어졌을 때
  function fluxer(o, a) {
    const zs = coilTurns({ cx: 0, L: o.L, n: o.n });
    return (d) => { let s = 0; for (const z of zs) { const u = (d - z) / a; s += 1 / Math.pow(1 + u * u, 1.5); } return s; };
  }

  /* ---- 막대자석(앞면·윗면·왼쪽 면) ---- */
  function barMagnet(ctx, x, cy, L, h, d, left = 'N', alpha = 1) {
    const fx = (d / 2) * PX, fy = (d / 2) * PY, x0 = x - L / 2, x1 = x + L / 2, t = cy - h / 2, b = cy + h / 2;
    const cL = left === 'N' ? NC : SC, cR = left === 'N' ? SC : NC;
    ctx.save(); ctx.globalAlpha = alpha;
    // 왼쪽 면
    ctx.beginPath(); ctx.moveTo(x0 + fx, t + fy); ctx.lineTo(x0 - fx, t - fy); ctx.lineTo(x0 - fx, b - fy); ctx.lineTo(x0 + fx, b + fy); ctx.closePath();
    ctx.fillStyle = cL[2]; ctx.fill();
    // 윗면 두 칸
    [[x0, x, cL], [x, x1, cR]].forEach(([a, c, col]) => {
      ctx.beginPath(); ctx.moveTo(a + fx, t + fy); ctx.lineTo(c + fx, t + fy); ctx.lineTo(c - fx, t - fy); ctx.lineTo(a - fx, t - fy); ctx.closePath();
      ctx.fillStyle = col[0]; ctx.fill();
    });
    // 앞면 두 칸
    [[x0, x, cL], [x, x1, cR]].forEach(([a, c, col]) => {
      ctx.fillStyle = vgrad(ctx, t + fy, b + fy, [col[1], col[1], col[2]]); ctx.fillRect(a + fx, t + fy, c - a, h);
    });
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x0 + fx, t + fy, L, 2);
    ctx.strokeStyle = 'rgba(20,38,59,.25)'; ctx.lineWidth = 1; ctx.strokeRect(x0 + fx, t + fy, L, h);
    ctx.restore();
    return { lx: lerp(x0, x, 0.42) + fx, rx: lerp(x, x1, 0.58) + fx, y: cy + fy };
  }
  // 막대자석의 자기장 모양(쌍극자 모형). 화살표 없이 얇은 선
  function fieldLines(ctx, x, cy, L, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = 'rgba(14,99,179,.32)'; ctx.lineWidth = 1.3;
    [64, 104, 156, 225].forEach((k) => [1, -1].forEach((sg) => {
      ctx.beginPath(); let first = true;
      for (let i = 0; i <= 90; i++) {
        const th = lerp(0.12, Math.PI - 0.12, i / 90), r = k * Math.sin(th) ** 2;
        const px = x + r * Math.cos(th) * (1 + L / 600), py = cy - sg * r * Math.sin(th) * 0.9;
        if (Math.abs(px - x) < L / 2 && Math.abs(py - cy) < 26) { first = true; continue; }
        if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }));
    ctx.restore();
  }

  /* ---- 검류계 ---- */
  function galvo(ctx, x, y, w, ang) {
    const bh = w * 0.26, dp = w * 0.16, fx = dp * PX * 1.4, fy = dp * PY * 1.4;
    contact(ctx, x, y + 4, w * 1.25, 0.22);
    // 받침 상자
    ctx.fillStyle = vgrad(ctx, y - bh, y, ['#f1f3f5', '#dfe4e9', '#c5ccd4']); rr(ctx, x - w / 2, y - bh, w, bh, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(20,38,59,.18)'; ctx.lineWidth = 1; ctx.stroke();
    // 비스듬한 눈금판
    const pb = y - bh, pt = pb - w * 0.5, inset = w * 0.08;
    ctx.beginPath(); ctx.moveTo(x - w / 2 + 4, pb); ctx.lineTo(x + w / 2 - 4, pb); ctx.lineTo(x + w / 2 - inset, pt); ctx.lineTo(x - w / 2 + inset, pt); ctx.closePath();
    ctx.fillStyle = vgrad(ctx, pt, pb, ['#e9e5dc', '#ddd8cd']); ctx.fill(); ctx.strokeStyle = 'rgba(20,38,59,.2)'; ctx.stroke();
    // 눈금 창
    const wx = x - w * 0.36, wy = pt + w * 0.05, ww = w * 0.72, wh = w * 0.36;
    rr(ctx, wx, wy, ww, wh, 10); ctx.fillStyle = '#fbfaf7'; ctx.fill(); ctx.strokeStyle = 'rgba(20,38,59,.25)'; ctx.stroke();
    const px = x, py = wy + wh - w * 0.03, R = w * 0.29;
    ctx.save(); rr(ctx, wx, wy, ww, wh, 10); ctx.clip();
    ctx.strokeStyle = '#34495e'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(px, py, R * 0.82, -Math.PI / 2 - 0.95, -Math.PI / 2 + 0.95); ctx.stroke();
    for (let i = -10; i <= 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * 0.95, r0 = R * (i % 5 === 0 ? 0.7 : 0.76), r1 = R * 0.82;
      ctx.lineWidth = i === 0 ? 2.2 : i % 5 === 0 ? 1.6 : 1;
      ctx.beginPath(); ctx.moveTo(px + Math.cos(a) * r0, py + Math.sin(a) * r0); ctx.lineTo(px + Math.cos(a) * r1, py + Math.sin(a) * r1); ctx.stroke();
    }
    // 바늘
    const a = -Math.PI / 2 + ang;
    ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(px - Math.cos(a) * R * 0.1, py - Math.sin(a) * R * 0.1); ctx.lineTo(px + Math.cos(a) * R * 0.92, py + Math.sin(a) * R * 0.92); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#2a3440'; ctx.beginPath(); ctx.arc(px, py, 5, 0, TAU); ctx.fill();
    // 단자 두 개
    const ty = y - bh * 0.45, tA = x - w * 0.3, tB = x + w * 0.3;
    [[tA, '#b8493f'], [tB, '#2b3138']].forEach(([tx, c]) => {
      contact(ctx, tx, ty + 9, 30, 0.25);
      ctx.fillStyle = vgrad(ctx, ty - 10, ty + 8, [c, c, '#111']); rr(ctx, tx - 9, ty - 10, 18, 18, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(tx - 6, ty - 8, 12, 2);
    });
    return { tA: [tA, ty - 2], tB: [tB, ty - 2], zero: [px, py - R * 0.98], fx, fy };
  }

  /* ---- 전선과 흐르는 점 ---- */
  function bez(p0, c0, c1, p1, n = 36) {
    const pts = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t;
      pts.push([u * u * u * p0[0] + 3 * u * u * t * c0[0] + 3 * u * t * t * c1[0] + t * t * t * p1[0], u * u * u * p0[1] + 3 * u * u * t * c0[1] + 3 * u * t * t * c1[1] + t * t * t * p1[1]]); }
    return pts;
  }
  function polyLen(pts) { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L; }
  function along(pts, L, s) {
    const tot = L[L.length - 1]; s = ((s % tot) + tot) % tot;
    let i = 1; while (i < L.length - 1 && L[i] < s) i++;
    const k = (s - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
    return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)];
  }
  function wire(ctx, pts, col = '#3c4652', w = 4.2) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = w * 0.3; ctx.stroke();
  }
  function dots(ctx, pts, phase, gap = 34, amt = 1, r = 3.4) {
    if (amt < 0.04) return;
    const L = polyLen(pts), tot = L[L.length - 1];
    ctx.fillStyle = `rgba(14,99,179,${clamp(amt, 0, 1) * 0.95})`;
    for (let s = phase % gap; s < tot; s += gap) { const p = along(pts, L, s); ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.fill(); }
  }

  /* ---- 전구(꼬마전구) ---- */
  function bulb(ctx, x, y, s, lum) {
    // (x,y): 소켓 바닥 가운데
    contact(ctx, x, y + 2, s * 2.6, 0.2);
    ctx.fillStyle = vgrad(ctx, y - s * 0.55, y, ['#e4e8ec', '#c3cbd3', '#9aa4ae']); rr(ctx, x - s * 0.9, y - s * 0.5, s * 1.8, s * 0.5, 6); ctx.fill();
    ctx.fillStyle = vgrad(ctx, y - s * 1.05, y - s * 0.5, STEEL);
    rr(ctx, x - s * 0.36, y - s * 1.05, s * 0.72, s * 0.58, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(80,90,100,.45)'; ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - s * 0.36, y - s * 1.05 + i * s * 0.14); ctx.lineTo(x + s * 0.36, y - s * 1.05 + i * s * 0.14 + 3); ctx.stroke(); }
    const gy = y - s * 1.75, gr = s * 0.75;
    if (lum > 0.02) {
      const g = ctx.createRadialGradient(x, gy, gr * 0.2, x, gy, gr * 3.2);
      g.addColorStop(0, `rgba(255,236,170,${0.55 * lum})`); g.addColorStop(1, 'rgba(255,236,170,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, gy, gr * 3.2, 0, TAU); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(x, gy, gr, Math.PI * 0.72, Math.PI * 2.28); ctx.lineTo(x + s * 0.34, y - s * 1.05); ctx.lineTo(x - s * 0.34, y - s * 1.05); ctx.closePath();
    const gg = ctx.createRadialGradient(x - gr * 0.3, gy - gr * 0.35, 2, x, gy, gr * 1.2);
    gg.addColorStop(0, lum > 0.02 ? `rgba(255,250,228,${0.6 + 0.4 * lum})` : 'rgba(250,252,254,.75)');
    gg.addColorStop(1, lum > 0.02 ? `rgba(255,226,150,${0.35 + 0.5 * lum})` : 'rgba(214,224,233,.6)');
    ctx.fillStyle = gg; ctx.fill(); ctx.strokeStyle = 'rgba(110,128,146,.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    // 필라멘트
    ctx.strokeStyle = lum > 0.05 ? `rgb(${Math.round(lerp(120, 255, lum))},${Math.round(lerp(110, 200, lum))},${Math.round(lerp(100, 90, lum))})` : '#7b8590';
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - s * 0.18, y - s * 1.1); ctx.lineTo(x - s * 0.2, gy); ctx.lineTo(x - s * 0.1, gy - 5); ctx.lineTo(x, gy + 3); ctx.lineTo(x + s * 0.1, gy - 5); ctx.lineTo(x + s * 0.2, gy); ctx.lineTo(x + s * 0.18, y - s * 1.1); ctx.stroke();
    return { a: [x - s * 0.7, y - s * 0.25], b: [x + s * 0.7, y - s * 0.25] };
  }

  /* =====================================================================
     1) 배움활동: 코일·검류계·막대자석
     ===================================================================== */
  function lab(host, o = {}) {
    const S = surface(host, 1200, 760), ctx = S.ctx, OL = overlay(S), tw = tweens();
    const CY = 300, CL = 300, CR = 74, N = 22, ML = 250, MH = 50, MD = 50;
    const POS = { magnet: { xc: 470, home: 960, inn: 470 }, coil: { xm: 820, home: 330, inn: 820 } };
    const st = { mode: 'magnet', xm: POS.magnet.home, xc: POS.magnet.xc, needle: 0, nv: 0, phase: 0, emf: 0, v: 0, rest: 0, field: o.field !== false, labels: o.labels !== false, rec: {} };
    const flux = fluxer({ L: CL, n: N }, 88);
    let prevD = st.xm - st.xc, prevX = st.mode === 'magnet' ? st.xm : st.xc;
    const api = { st, onRecord: null, onMove: null };
    function setMode(m) {
      tw.clear(); st.mode = m;
      if (m === 'magnet') { st.xc = POS.magnet.xc; st.xm = POS.magnet.home; } else { st.xm = POS.coil.xm; st.xc = POS.coil.home; st.dragged = false; }
      prevD = st.xm - st.xc; st.needle = 0; st.nv = 0; st.rest = 0;
    }
    const mover = () => (st.mode === 'magnet' ? 'xm' : 'xc');
    function moveTo(target, dur, done) {
      tw.clear(); st.dragged = true; OL.hide('hd'); const k = mover(), a = st[k];
      tw.add(dur, (t) => { st[k] = lerp(a, target, ease(t)); }, done);
    }
    api.setMode = setMode;
    api.push = (dur = 0.7, done) => moveTo(st.mode === 'magnet' ? POS.magnet.inn : POS.coil.inn, dur, done);
    api.pull = (dur = 0.7, done) => moveTo(st.mode === 'magnet' ? POS.magnet.home : POS.coil.home, dur, done);
    api.hold = (sec = 1.5, done) => { tw.clear(); tw.add(sec, () => {}, done); };
    api.field = (v) => { st.field = v; };
    api.inside = () => Math.abs(st.xm - st.xc) < 90;
    api.reset = () => { setMode(st.mode); st.rec = {}; };
    api.busy = () => tw.busy;
    // 끌기: 자석 모드는 자석, 코일 모드는 코일
    let grab = 0;
    drag(S, (x, y) => {
      if (st.mode === 'magnet') return Math.abs(x - st.xm) < ML / 2 + 30 && Math.abs(y - CY) < 70 ? 'm' : null;
      return Math.abs(x - st.xc) < CL / 2 + 30 && Math.abs(y - CY) < CR + 30 ? 'c' : null;
    }, (x, y, h, first) => {
      tw.clear();
      if (h === 'm') { if (first) grab = x - st.xm; st.xm = clamp(x - grab, POS.magnet.inn, 1040); }
      else { if (first) grab = x - st.xc; st.xc = clamp(x - grab, 250, POS.coil.inn); }
    });
    const lead = (xc) => ({ l: [xc - CL / 2 + 6, CY + CR + 4], r: [xc + CL / 2 - 6, CY + CR + 4] });
    addLoop(host, (dt) => {
      tw.step(dt);
      const d = st.xm - st.xc, X = st[mover()];
      if (dt > 0) {
        const v = (X - prevX) / dt; st.v = lerp(st.v, v, 0.5);
        const e = (flux(d) - flux(prevD)) / dt; st.emf = lerp(st.emf, e, 0.6);
        const target = clamp(st.emf / 26, -1, 1) * 0.86;
        const sub = 4, h = dt / sub;
        for (let i = 0; i < sub; i++) { const acc = 260 * (target - st.needle) - 20 * st.nv; st.nv += acc * h; st.needle += st.nv * h; }
        st.phase += st.emf * dt * 9;
        // 기록: 1 자석을 넣거나 뺄 때, 2 넣고 가만히, 3 코일을 움직일 때
        const big = Math.abs(st.needle) > 0.18;
        if (st.mode === 'magnet' && big && Math.abs(st.v) > 30 && !st.rec[1]) { st.rec[1] = 1; api.onRecord && api.onRecord(1); }
        if (st.mode === 'magnet' && Math.abs(d) < 40 && Math.abs(st.v) < 4) { st.rest += dt; if (st.rest > 1.1 && !st.rec[2]) { st.rec[2] = 1; api.onRecord && api.onRecord(2); } } else st.rest = 0;
        if (st.mode === 'coil' && big && Math.abs(st.v) > 30 && !st.rec[3]) { st.rec[3] = 1; api.onRecord && api.onRecord(3); }
        api.onMove && api.onMove(st);
      }
      prevD = d; prevX = X;
      draw();
    });
    function draw() {
      S.begin(); white(S); desk(S, 430);
      const xc = st.xc, xm = st.xm;
      // 그림자
      contact(ctx, xc + 8, 436, CL + 70, 0.2);
      contact(ctx, xm + 10, 438, ML * 0.9, 0.08);
      // 코일 받침
      ctx.fillStyle = vgrad(ctx, CY + CR + 2, 432, ['#d9dfe5', '#c3ccd5']);
      [xc - CL / 2 + 30, xc + CL / 2 - 70].forEach((bx) => { rr(ctx, bx, CY + CR + 8, 40, 432 - CY - CR - 8, 4); ctx.fill(); });
      // 전선
      const G = galvo(ctx, 260, 690, 300, st.needle);
      const ld = lead(xc);
      const wA = bez(ld.l, [ld.l[0] - 40, ld.l[1] + 110], [G.tA[0], G.tA[1] - 150], G.tA);
      const wB = bez(ld.r, [ld.r[0] + 30, ld.r[1] + 150], [G.tB[0] + 90, G.tB[1] - 140], G.tB);
      wire(ctx, wA, '#3c4652'); wire(ctx, wB, '#3c4652');
      dots(ctx, wA, st.phase * 12, 30, Math.abs(st.needle) * 1.6);
      dots(ctx, wB.slice().reverse(), st.phase * 12, 30, Math.abs(st.needle) * 1.6);
      coil(ctx, { cx: xc, cy: CY, L: CL, R: CR, n: N }, 'back');
      if (st.field) fieldLines(ctx, xm, CY, ML, 0.9);
      const mg = barMagnet(ctx, xm, CY, ML, MH, MD, 'N');
      coil(ctx, { cx: xc, cy: CY, L: CL, R: CR, n: N }, 'front');
      // 코일 끝 도선
      ctx.strokeStyle = '#a1602e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(xc - CL / 2 + 6, CY + CR - 2); ctx.lineTo(ld.l[0], ld.l[1]); ctx.moveTo(xc + CL / 2 - 6, CY + CR - 2); ctx.lineTo(ld.r[0], ld.r[1]); ctx.stroke();
      OL.put('n', mg.lx, mg.y, 'N', 'tx inv pole'); OL.put('s', mg.rx, mg.y, 'S', 'tx inv pole');
      if (st.labels) {
        OL.put('lc', xc, CY - CR - 34, '코일', 'tx nm');
        if (Math.abs(xm - xc) > CL / 2 + ML / 2 - 20) OL.put('lm', xm + 30, CY + 62, '막대자석', 'tx nm'); else OL.hide('lm');
        OL.put('lg', 260, 718, '검류계', 'tx nm');
        OL.put('z', G.zero[0], G.zero[1] - 6, '0', 'tx sc0');
      } else { OL.hide('lc'); OL.hide('lm'); OL.hide('lg'); }
      if (!st.dragged && !tw.busy && st.labels && o.hintDrag !== false) {
        const hx = st.mode === 'magnet' ? xm : xc;
        OL.put('hd', hx, CY - CR - 70 + (st.mode === 'magnet' ? 40 : 0), st.mode === 'magnet' ? '자석을 끌어 움직여 보세요' : '코일을 끌어 움직여 보세요', 'tx hintl');
      }
    }
    S.cv.addEventListener('pointerdown', () => { st.dragged = true; OL.hide('hd'); });
    return api;
  }

  /* =====================================================================
     2) 그림 Ⅵ-7: 자가 발전 손전등 속
     ===================================================================== */
  function flash(host, o = {}) {
    const S = surface(host, 1040, 600), ctx = S.ctx, OL = overlay(S);
    const CY = 270, BL = 780, BR = 66, COILX = 70, CLN = 170, ML = 110, MR = 34;
    const RMIN = -200 + ML / 2, RMAX = 340 - ML / 2;
    const flux = fluxer({ L: CLN, n: 18 }, 46);
    const st = { bx: 0, bv: 0, xm: RMAX, vm: 0, lum: 0, emf: 0, phase: 0, auto: 0, t: 0, dragging: false, shakes: 0, lit: 0 };
    const api = { st, onLight: null };
    let grab = 0, prevBx = 0;
    drag(S, (x, y) => (Math.abs(x - (520 + st.bx)) < BL / 2 + 20 && Math.abs(y - CY) < BR + 40 ? 'b' : null), (x, y, h, first) => {
      st.auto = 0; st.dragging = true; if (first) grab = x - st.bx; st.bx = clamp(x - grab, -190, 190);
    }, () => { st.dragging = false; });
    api.shake = (sec = 3) => { st.auto = sec; st.t = 0; st.touched = true; };
    api.reset = () => { Object.assign(st, { bx: 0, bv: 0, xm: RMAX, vm: 0, lum: 0, emf: 0, auto: 0, lit: 0 }); prevBx = 0; };
    addLoop(host, (dt) => {
      if (dt <= 0) { draw(); return; }
      if (st.auto > 0) { st.t += dt; st.auto -= dt; const ramp = Math.min(1, st.t / 0.3, Math.max(0, st.auto) / 0.3); st.bx = Math.sin(st.t * TAU * 1.9) * 175 * ramp; }
      else if (!st.dragging) st.bx = lerp(st.bx, 0, Math.min(1, dt * 2));
      const bv = (st.bx - prevBx) / dt; prevBx = st.bx; st.bv = lerp(st.bv, bv, 0.6);
      const sub = 6, h = dt / sub; let emfSum = 0;
      for (let i = 0; i < sub; i++) {
        const bpos = lerp(st.bx - bv * dt, st.bx, (i + 1) / sub);
        let r = st.xm - bpos, vr = st.vm - st.bv;
        const dF = (flux(r - COILX + 1) - flux(r - COILX - 1)) / 2;
        // 관과의 마찰, 코일에 전류가 흐를 때 생기는 작은 제동
        const fr = Math.abs(vr) > 4 ? -Math.sign(vr) * 380 : -vr * 40;
        st.vm += (fr - 0.6 * dF * dF * vr) * h; st.xm += st.vm * h;
        r = st.xm - bpos; vr = st.vm - st.bv;
        if (r < RMIN) { st.xm = bpos + RMIN; st.vm = st.bv + Math.abs(vr) * 0.3; }
        if (r > RMAX) { st.xm = bpos + RMAX; st.vm = st.bv - Math.abs(vr) * 0.3; }
        emfSum += dF * (st.vm - st.bv);
      }
      st.emf = emfSum / sub;
      const target = clamp(Math.abs(st.emf) / 420, 0, 1);
      st.lum = target > st.lum ? lerp(st.lum, target, Math.min(1, dt * 30)) : lerp(st.lum, target, Math.min(1, dt * 7));
      st.phase += st.emf * dt * 0.05;
      if (st.lum > 0.35) { st.lit += dt; if (st.lit > 0.25 && api.onLight) { api.onLight(); api.onLight = null; } }
      draw();
    });
    function draw() {
      S.begin(); white(S); desk(S, 420);
      const X = 520 + st.bx, x0 = X - BL / 2, x1 = X + BL / 2;
      contact(ctx, X, 424, BL * 1.05, 0.2, 0.1);
      // 불빛
      if (st.lum > 0.03) {
        const g = ctx.createLinearGradient(x0 - 10, 0, x0 - 330, 0);
        g.addColorStop(0, `rgba(255,236,170,${0.55 * st.lum})`); g.addColorStop(1, 'rgba(255,236,170,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0 - 6, CY - 40); ctx.lineTo(x0 - 330, CY - 140); ctx.lineTo(x0 - 330, CY + 140); ctx.lineTo(x0 - 6, CY + 40); ctx.closePath(); ctx.fill();
      }
      // 투명한 몸통(뒤쪽)
      ctx.beginPath(); arcPath(ctx, x0 + 70, CY, BR, Math.PI, 0); arcPath(ctx, x1 - 40, CY, BR, 0, -Math.PI, false); ctx.closePath();
      ctx.fillStyle = 'rgba(221,229,237,.5)'; ctx.fill();
      // 안쪽 고무 받침
      [[X - 200, -1], [X + 340, 1]].forEach(([bx]) => { ctx.fillStyle = '#4a525c'; ctx.beginPath(); arcPath(ctx, bx, CY, BR - 10, 0, TAU); ctx.fill(); });
      // 회로판과 도선
      ctx.fillStyle = vgrad(ctx, CY - 40, CY + 40, ['#56606b', '#3c444d']); ctx.fillRect(x0 + 90, CY - 38, 70, 76);
      ctx.fillStyle = '#c9a15e'; [0, 1, 2].forEach((i) => ctx.fillRect(x0 + 100 + i * 20, CY - 8, 8, 16));
      const cx = X + COILX, wl = [[cx - CLN / 2, CY + BR - 14], [cx - CLN / 2 - 60, CY + BR - 6], [x0 + 150, CY + BR - 8], [x0 + 150, CY + 30]];
      const wr = [[cx + CLN / 2, CY + BR - 14], [cx + CLN / 2 + 20, CY + BR - 2], [x0 + 140, CY + BR - 2], [x0 + 140, CY + 30]];
      [wl, wr].forEach((w) => { ctx.beginPath(); w.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.strokeStyle = '#b06a34'; ctx.lineWidth = 2.4; ctx.stroke(); });
      dots(ctx, wl, st.phase * 40, 26, st.lum * 1.4, 3);
      dots(ctx, wr.slice().reverse(), st.phase * 40, 26, st.lum * 1.4, 3);
      coil(ctx, { cx, cy: CY, L: CLN, R: BR - 4, n: 18, flange: false, lw: 5 }, 'back');
      // 자석(원통형 네오디뮴 자석, 무광 은회색)
      const mx = X + (st.xm - st.bx);
      cylinder(ctx, mx - ML / 2, mx + ML / 2, CY, MR, ['#8d96a0', '#c8ced5', '#8a939d', '#5b636c']);
      coil(ctx, { cx, cy: CY, L: CLN, R: BR - 4, n: 18, flange: false, lw: 5 }, 'front');
      // 몸통 앞쪽 테두리
      ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(110,128,146,.45)';
      ctx.beginPath(); ctx.moveTo(x0 + 70, CY - BR); ctx.lineTo(x1 - 40, CY - BR); ctx.moveTo(x0 + 70, CY + BR); ctx.lineTo(x1 - 40, CY + BR); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x0 + 80, CY - BR + 8, BL - 140, 5);
      // 스위치
      ctx.fillStyle = vgrad(ctx, CY - BR - 14, CY - BR + 2, ['#59626c', '#2f363e']); rr(ctx, x0 + 210, CY - BR - 12, 46, 16, 5); ctx.fill();
      // 오른쪽 끝 마개
      cylinder(ctx, x1 - 44, x1, CY, BR + 4, ['#4b535c', '#6b747e', '#3a4149', '#22282e']);
      // 왼쪽 머리(전구와 렌즈)
      cylinder(ctx, x0, x0 + 74, CY, BR + 10, ['#3e464f', '#646d77', '#353c44', '#1f252b']);
      ctx.beginPath(); arcPath(ctx, x0, CY, BR - 4, 0, TAU); ctx.closePath();
      const lg = ctx.createRadialGradient(x0, CY, 2, x0, CY, BR);
      lg.addColorStop(0, st.lum > 0.03 ? `rgba(255,248,220,${0.6 + 0.4 * st.lum})` : '#e9eef2'); lg.addColorStop(1, st.lum > 0.03 ? `rgba(255,224,150,${0.4 + 0.4 * st.lum})` : '#c6d0d9');
      ctx.fillStyle = lg; ctx.fill(); ctx.strokeStyle = 'rgba(30,40,50,.5)'; ctx.stroke();
      if (o.labels !== false) {
        OL.put('l1', x0 + 4, CY - BR - 44, '전구', 'tx nm');
        OL.put('l2', x0 + 233, CY - BR - 44, '스위치', 'tx nm');
        OL.put('l3', cx, CY - BR - 44, '코일', 'tx nm');
        OL.put('l4', mx, CY + BR + 34, '자석', 'tx nm');
      }
      if (!st.touched && o.hintDrag !== false) OL.put('hd', X + 120, CY - BR - 92, '손전등을 좌우로 끌어 흔들어 보세요', 'tx hintl'); else OL.hide('hd');
    }
    S.cv.addEventListener('pointerdown', () => { st.touched = true; });
    return api;
  }

  /* =====================================================================
     3) 그림 Ⅵ-8: 발전기의 구조
     ===================================================================== */
  function gen(host, o = {}) {
    const S = surface(host, 1200, 720), ctx = S.ctx, OL = overlay(S);
    const AY = 330, X0 = 650, X1 = 840, H = 112, SH = 210;
    const st = { th: 0.4, w: 0, level: o.level || 0, driver: o.driver || 'hand', lum: 0, phase: 0, field: o.field !== false, grabbing: false, spin: 0, labels: o.labels !== false };
    const WT = [0, 3.2, 8.5];
    const api = { st, onBright: null };
    api.setDriver = (d) => { st.driver = d; };
    api.setLevel = (l) => { st.level = l; };
    api.field = (v) => { st.field = v; };
    const P = (x, y, z) => [x + z * PX, AY - y + z * PY];
    let prevA = null, tLast = 0;
    const WX = 0.62, WY = 0.08;
    const handA = (x, y) => { const dx = x - SH, dy = y - AY; const z = dx / WX, yy = -(dy - z * WY); return Math.atan2(z, yy); };
    drag(S, (x, y) => (st.driver === 'hand' && Math.hypot(x - SH, y - AY) < 150 ? 'h' : null), (x, y, h, first) => {
      const a = handA(x, y); const now = performance.now() / 1000;
      if (!first && prevA != null) { let da = a - prevA; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; const dt = Math.max(0.008, now - tLast); st.w = lerp(st.w, da / dt, 0.35); st.th += da; }
      st.grabbing = true; prevA = a; tLast = now;
    }, () => { st.grabbing = false; prevA = null; });
    addLoop(host, (dt) => {
      if (dt > 0) {
        if (st.grabbing) { if (performance.now() / 1000 - tLast > 0.08) st.w = lerp(st.w, 0, Math.min(1, dt * 10)); }
        else { const tgt = WT[st.level]; st.w = lerp(st.w, tgt, Math.min(1, dt * (tgt > Math.abs(st.w) ? 1.6 : 1.1))); st.th += st.w * dt; }
        const e = st.w * Math.sin(st.th);
        const tgtL = clamp(Math.abs(e) / 6, 0, 1);
        st.lum = tgtL > st.lum ? lerp(st.lum, tgtL, Math.min(1, dt * 25)) : lerp(st.lum, tgtL, Math.min(1, dt * 9));
        st.phase += e * dt * 26; st.spin += Math.abs(st.w) * dt;
        if (Math.abs(st.w) > 2.2 && api.onBright) { api.onBright(); api.onBright = null; }
      }
      draw();
    });
    function poleBlock(x0, x1, yt, yb, col, d) {
      const fx = (d / 2) * PX, fy = (d / 2) * PY;
      ctx.beginPath(); ctx.moveTo(x0 + fx, yt + fy); ctx.lineTo(x1 + fx, yt + fy); ctx.lineTo(x1 - fx, yt - fy); ctx.lineTo(x0 - fx, yt - fy); ctx.closePath(); ctx.fillStyle = col[0]; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x0 + fx, yt + fy); ctx.lineTo(x0 - fx, yt - fy); ctx.lineTo(x0 - fx, yb - fy); ctx.lineTo(x0 + fx, yb + fy); ctx.closePath(); ctx.fillStyle = col[2]; ctx.fill();
      ctx.fillStyle = vgrad(ctx, yt + fy, yb + fy, [col[1], col[1], col[2]]); ctx.fillRect(x0 + fx, yt + fy, x1 - x0, yb - yt);
      ctx.strokeStyle = 'rgba(20,38,59,.22)'; ctx.lineWidth = 1; ctx.strokeRect(x0 + fx, yt + fy, x1 - x0, yb - yt);
    }
    function magnetC() {
      // 말굽(C) 모양 자석: 위 팔 S극(파랑), 아래 팔 N극(빨강). 앞면 + 보이는 윗면·왼쪽 면
      const d = 190, fx = (d / 2) * PX, fy = (d / 2) * PY;
      const L = 630, R = 950, T = 80, B = 580, IN = 860, GT = 180, GB = 480, MID = (T + B) / 2;
      const quad = (pts, fill) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
      const F = (x, y) => [x + fx, y + fy], K = (x, y) => [x - fx, y - fy];
      quad([F(L, T), F(R, T), K(R, T), K(L, T)], SC[0]);                 // 위 팔 윗면
      quad([F(L, T), K(L, T), K(L, GT), F(L, GT)], SC[2]);               // 위 팔 왼쪽 끝
      quad([F(L, GB), K(L, GB), K(L, B), F(L, B)], NC[2]);               // 아래 팔 왼쪽 끝
      quad([F(L, GB), F(IN, GB), K(IN, GB), K(L, GB)], NC[0]);           // 아래 팔 윗면(극 사이에서 보임)
      quad([F(IN, GT), K(IN, GT), K(IN, MID), F(IN, MID)], SC[2]);       // 등 안쪽 면
      quad([F(IN, MID), K(IN, MID), K(IN, GB), F(IN, GB)], NC[2]);
      const front = (y0, y1, col) => {
        ctx.save(); ctx.beginPath();
        [[L, T], [R, T], [R, B], [L, B], [L, GB], [IN, GB], [IN, GT], [L, GT]].forEach((p, i) => { const q = F(p[0], p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
        ctx.closePath(); ctx.clip(); ctx.fillStyle = vgrad(ctx, y0 + fy, y1 + fy, [col[1], col[1], col[2]]); ctx.fillRect(L + fx, y0 + fy, R - L, y1 - y0); ctx.restore();
      };
      front(T, MID, SC); front(MID, B, NC);
      ctx.strokeStyle = 'rgba(20,38,59,.22)'; ctx.lineWidth = 1; ctx.beginPath();
      [[L, T], [R, T], [R, B], [L, B], [L, GB], [IN, GB], [IN, GT], [L, GT]].forEach((p, i) => { const q = F(p[0], p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.stroke();
      return { sx: 745 + fx, sy: (T + GT) / 2 + fy, nx: 745 + fx, ny: (GB + B) / 2 + fy, gapT: GT, gapB: GB };
    }
    function loopPts(th) {
      const c = Math.cos(th), s = Math.sin(th);
      const A = [X0, H * c, H * s], B = [X1, H * c, H * s], C = [X1, -H * c, -H * s], D = [X0, -H * c, -H * s];
      return [A, B, C, D];
    }
    function seg(a, b, w, col) { const p = P(...a), q = P(...b); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke(); }
    function coilDraw(front) {
      const [A, B, C, D] = loopPts(st.th);
      const sides = [[A, B], [B, C], [C, D], [D, A]];
      sides.forEach(([a, b]) => {
        const z = (a[2] + b[2]) / 2; if (front ? z < 0 : z >= 0) return;
        const shade = clamp(0.5 + z / (2 * H), 0, 1);
        seg(a, b, 13, `rgb(${Math.round(lerp(110, 196, shade))},${Math.round(lerp(60, 124, shade))},${Math.round(lerp(28, 66, shade))})`);
        seg(a, b, 3, `rgba(255,222,186,${0.15 + 0.35 * shade})`);
      });
    }
    function wheel(kind) {
      // 축 왼쪽 끝(SH)에 붙은 회전체: 손잡이·물레(수차)·바람개비(회전 날개)
      const th = st.th;
      // 회전체는 앞에서 조금 비스듬히 본 모습(날개와 물레가 잘 보이게)
      const P = (x, y, z) => [x + z * WX, AY - y + z * WY];
      if (kind === 'hand') {
        const L = 80, hy = L * Math.cos(th), hz = L * Math.sin(th);
        const hub = P(SH, 0, 0), end = P(SH, hy, hz), knob = P(SH - 50, hy, hz);
        ctx.strokeStyle = vgrad(ctx, AY - L, AY + L, STEEL); ctx.lineWidth = 14; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(hub[0], hub[1]); ctx.lineTo(end[0], end[1]); ctx.stroke();
        ctx.fillStyle = '#7b8590'; ctx.beginPath(); ctx.arc(hub[0], hub[1], 13, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#3a4149'; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(end[0], end[1]); ctx.lineTo(knob[0], knob[1]); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(end[0], end[1] - 5); ctx.lineTo(knob[0], knob[1] - 5); ctx.stroke();
        return knob;
      }
      if (kind === 'water') {
        const R = 120, n = 12;
        // 물받이
        ctx.fillStyle = vgrad(ctx, 560, 640, ['#cdd6de', '#aab5c0']); rr(ctx, SH - 120, 560, 290, 70, 10); ctx.fill();
        ctx.fillStyle = 'rgba(120,170,215,.55)'; rr(ctx, SH - 110, 575, 270, 46, 8); ctx.fill();
        const items = [];
        for (let i = 0; i < n; i++) { const a = th + (i / n) * TAU; items.push({ a, z: R * Math.sin(a) }); }
        items.sort((p, q) => p.z - q.z);
        // 테
        ctx.beginPath(); for (let i = 0; i <= 48; i++) { const a = (i / 48) * TAU, q = P(SH, R * Math.cos(a), R * Math.sin(a)); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); } ctx.strokeStyle = '#8a7a64'; ctx.lineWidth = 7; ctx.stroke();
        items.forEach(({ a, z }) => {
          const p0 = P(SH, R * 0.18 * Math.cos(a), R * 0.18 * Math.sin(a)), p1 = P(SH, R * Math.cos(a), R * Math.sin(a));
          ctx.strokeStyle = '#9b8a72'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
          const sh = clamp(0.55 + z / (2 * R), 0, 1);
          const q0 = P(SH - 30, R * Math.cos(a), R * Math.sin(a)), q1 = P(SH + 30, R * Math.cos(a), R * Math.sin(a)), q2 = P(SH + 30, R * 1.28 * Math.cos(a), R * 1.28 * Math.sin(a)), q3 = P(SH - 30, R * 1.28 * Math.cos(a), R * 1.28 * Math.sin(a));
          ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]); ctx.lineTo(q3[0], q3[1]); ctx.closePath();
          ctx.fillStyle = `rgb(${Math.round(lerp(120, 196, sh))},${Math.round(lerp(104, 172, sh))},${Math.round(lerp(82, 136, sh))})`; ctx.fill();
        });
        ctx.fillStyle = '#6b5d4c'; const hb = P(SH, 0, 0); ctx.beginPath(); ctx.arc(hb[0], hb[1], 16, 0, TAU); ctx.fill();
        // 관과 떨어지는 물
        const lv = st.level;
        ctx.fillStyle = vgrad(ctx, 40, 80, STEEL); rr(ctx, SH - 40, 50, 150, 36, 8); ctx.fill();
        ctx.fillStyle = vgrad(ctx, 50, 120, ['#9aa4ae', '#c9d0d7', '#8a939c']); rr(ctx, SH + 56, 70, 40, 44, 6); ctx.fill();
        if (lv > 0) {
          const wdt = lv === 1 ? 14 : 28, x = SH + 76, top = 112, bot = AY - R * 1.15;
          ctx.fillStyle = 'rgba(96,152,205,.6)'; ctx.fillRect(x - wdt / 2, top, wdt, bot - top);
          ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 1.5;
          for (let k = 0; k < 4; k++) { const yy = top + ((st.spin * 60 + k * 37) % (bot - top)); ctx.beginPath(); ctx.moveTo(x - wdt / 4, yy); ctx.lineTo(x - wdt / 4, yy + 16); ctx.stroke(); }
          // 물받이로 떨어지는 물
          ctx.fillStyle = 'rgba(96,152,205,.45)'; ctx.fillRect(x - wdt / 2 + 20, AY + R * 0.9, wdt * 0.8, 575 - AY - R * 0.9);
        }
        return null;
      }
      // 바람개비(회전 날개 3장)
      const R = 150;
      const bl = [0, 1, 2].map((i) => { const a = th + (i / 3) * TAU; return { a, z: R * Math.sin(a) }; }).sort((p, q) => p.z - q.z);
      // 기둥
      ctx.fillStyle = vgrad(ctx, AY, 640, ['#e6eaee', '#c6ced6']); ctx.fillRect(SH - 12, AY, 24, 640 - AY);
      bl.forEach(({ a, z }) => {
        const sh = clamp(0.55 + z / (2 * R), 0, 1);
        const c = Math.cos(a), s = Math.sin(a), nc = Math.cos(a + 0.22), ns = Math.sin(a + 0.22);
        const p0 = P(SH, 14 * c, 14 * s), p1 = P(SH, R * c, R * s), p2 = P(SH, R * 0.55 * nc, R * 0.55 * ns), p3 = P(SH, 22 * nc, 22 * ns);
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.quadraticCurveTo(p2[0], p2[1], p3[0], p3[1]); ctx.closePath();
        ctx.fillStyle = `rgb(${Math.round(lerp(176, 244, sh))},${Math.round(lerp(186, 247, sh))},${Math.round(lerp(196, 250, sh))})`; ctx.fill();
        ctx.strokeStyle = 'rgba(90,107,126,.55)'; ctx.lineWidth = 1.2; ctx.stroke();
      });
      const hb = P(SH, 0, 0); ctx.fillStyle = vgrad(ctx, hb[1] - 18, hb[1] + 18, STEEL); ctx.beginPath(); ctx.arc(hb[0], hb[1], 18, 0, TAU); ctx.fill();
      // 바람 줄기
      if (st.level > 0) {
        ctx.strokeStyle = 'rgba(90,107,126,.35)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
        for (let k = 0; k < 6; k++) {
          const yy = 170 + k * 52, xx = -40 + ((st.spin * (st.level === 1 ? 70 : 45) + k * 53) % 200);
          ctx.beginPath(); ctx.moveTo(xx, yy); ctx.bezierCurveTo(xx + 20, yy - 6, xx + 40, yy + 6, xx + 60 + st.level * 10, yy); ctx.stroke();
        }
      }
      return null;
    }
    function draw() {
      S.begin(); white(S); desk(S, 640);
      contact(ctx, 790, 648, 420, 0.18);
      const M = magnetC();
      // 자기장(N → S, 아래에서 위로)
      if (st.field) {
        ctx.strokeStyle = 'rgba(14,99,179,.28)'; ctx.lineWidth = 1.3;
        for (let x = 662; x <= 850; x += 28) [-60, 10, 70].forEach((z) => { const p = P(x, AY - M.gapB, z), q = P(x, AY - M.gapT, z); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); });
      }
      // 받침대 두 개
      ctx.fillStyle = vgrad(ctx, AY, 640, ['#d8dee4', '#b9c3cc']);
      [[SH + 260, 22], [960, 22]].forEach(([x, w]) => { rr(ctx, x - w / 2, AY + 6, w, 640 - AY - 6, 4); ctx.fill(); });
      coilDraw(false);
      // 축
      const a = P(SH, 0, 0), b = P(X1 + 160, 0, 0);
      ctx.strokeStyle = vgrad(ctx, AY - 8, AY + 8, STEEL); ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(X0, AY); ctx.moveTo(X1, AY); ctx.lineTo(b[0], b[1]); ctx.stroke();
      // 고리 두 개와 솔
      const ringX = [470, 520];
      ringX.forEach((rx) => {
        ctx.beginPath(); arcPath(ctx, rx, AY, 24, 0, TAU); ctx.closePath(); ctx.fillStyle = vgrad(ctx, AY - 24, AY + 24, COPPER); ctx.fill();
        ctx.beginPath(); arcPath(ctx, rx + 7, AY, 24, 0, TAU); ctx.closePath(); ctx.fillStyle = vgrad(ctx, AY - 24, AY + 24, ['#e9b27f', '#b8743c', '#7a4420']); ctx.fill();
        ctx.fillStyle = vgrad(ctx, AY + 22, AY + 52, ['#4d555e', '#2b3138']); rr(ctx, rx - 5, AY + 24, 22, 30, 4); ctx.fill();
      });
      // 코일 끝 → 고리
      ctx.strokeStyle = '#a1602e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(X0, AY - 3); ctx.lineTo(ringX[1] + 8, AY - 3); ctx.moveTo(X0, AY + 3); ctx.lineTo(ringX[0] + 8, AY + 3); ctx.stroke();
      // 솔 → 전구
      const bp = bulb(ctx, 400, 640, 46, st.lum);
      const w1 = bez([ringX[0] + 6, AY + 54], [ringX[0], AY + 140], [bp.a[0] - 40, 600], bp.a);
      const w2 = bez([ringX[1] + 6, AY + 54], [ringX[1] + 30, AY + 170], [bp.b[0] + 60, 620], bp.b);
      wire(ctx, w1); wire(ctx, w2);
      const amt = clamp(Math.abs(st.w * Math.sin(st.th)) / 4, 0, 1);
      dots(ctx, w1, st.phase, 28, amt); dots(ctx, w2.slice().reverse(), st.phase, 28, amt);
      coilDraw(true);
      // 코일 위 흐르는 점
      const [A, B, C, D] = loopPts(st.th).map((p) => P(...p));
      const path = [D, A, B, C]; dots(ctx, path, st.phase, 30, amt * 0.9, 3.2);
      const knob = wheel(st.driver);
      if (st.labels) {
        OL.put('s', M.sx, M.sy, 'S', 'tx inv pole big2'); OL.put('n', M.nx, M.ny, 'N', 'tx inv pole big2');
        OL.put('lc', 1010, AY - 6, '코일', 'tx nm la2');
        OL.put('lb', 400, 690, '전구', 'tx nm');
        OL.put('lm', 1010, 130, '자석', 'tx nm la2');
        OL.put('ld', SH, st.driver === 'wind' ? AY - 175 : st.driver === 'water' ? 30 : AY + 125, { hand: '손잡이', water: '물레', wind: '회전 날개' }[st.driver], 'tx nm');
      }
      if (st.driver === 'hand' && knob && !st.touched && st.level === 0 && o.hintDrag !== false) OL.put('hd', SH + 30, AY - 140, '손잡이를 돌려 보세요', 'tx hintl'); else OL.hide('hd');
    }
    S.cv.addEventListener('pointerdown', () => { st.touched = true; });
    return api;
  }

  /* =====================================================================
     4) 그림 Ⅵ-9: (가) 빈 관, (나) 코일 감은 관에 자석 떨어뜨리기
     ===================================================================== */
  function drop(host, o = {}) {
    const S = surface(host, 1200, 760), ctx = S.ctx, OL = overlay(S);
    const TX = [300, 560], TOP = 110, BOT = 660, MH = 60, YC = 400, G = 980;
    const Hh = BOT - TOP - MH;
    let DRAG = o.drag || 300;
    const fluxY = fluxer({ L: 140, n: 14 }, 34);
    const st = { y: [0, 0], v: [0, 0], done: [false, false], tland: [0, 0], t: 0, run: false, lum: 0, phase: 0, E: [null, null] };
    const api = { st, onEnd: null };
    function energy(i) {
      const pe = 1 - st.y[i] / Hh, ke = (st.v[i] * st.v[i]) / (2 * G * Hh);
      return { pe: clamp(pe, 0, 1), ke: clamp(ke, 0, 1), me: clamp(pe + ke, 0, 1) };
    }
    api.drop = () => { Object.assign(st, { y: [0, 0], v: [0, 0], done: [false, false], tland: [0, 0], t: 0, run: true, E: [null, null] }); };
    api.reset = () => { Object.assign(st, { y: [0, 0], v: [0, 0], done: [false, false], tland: [0, 0], t: 0, run: false, lum: 0, E: [null, null] }); };
    api.energy = energy;
    api.setDrag = (v) => { DRAG = v; };
    addLoop(host, (dt) => {
      if (st.run && dt > 0) {
        const sl = 0.55; // 천천히 보여 주기
        const sub = 8, h = (dt * sl) / sub;
        let emf = 0;
        for (let k = 0; k < sub; k++) {
          st.t += h;
          for (let i = 0; i < 2; i++) {
            if (st.done[i]) continue;
            let a = G;
            const yMag = TOP + st.y[i] + MH / 2;
            if (i === 1) { const dF = (fluxY(yMag - YC + 1) - fluxY(yMag - YC - 1)) / 2; a -= DRAG * dF * dF * st.v[i]; emf = dF * st.v[i]; }
            st.v[i] += a * h; st.y[i] += st.v[i] * h;
            if (st.y[i] >= Hh) { st.y[i] = Hh; st.E[i] = energy(i); st.done[i] = true; st.tland[i] = st.t; st.v[i] = 0; }
          }
        }
        const tg = clamp(Math.abs(emf) / 50, 0, 1);
        st.lum = tg > st.lum ? lerp(st.lum, tg, Math.min(1, dt * 30)) : lerp(st.lum, tg, Math.min(1, dt * 8));
        if (st.done[0] && st.done[1]) { st.run = false; api.onEnd && api.onEnd(st); }
      } else st.lum = lerp(st.lum, 0, Math.min(1, dt * 8));
      draw();
    });
    function tube(x) {
      const R = 34;
      ctx.beginPath(); arcPath(ctx, x, TOP, R, 0, TAU);
      ctx.fillStyle = 'rgba(214,224,233,.35)'; ctx.fillRect(x - R, TOP, 2 * R, BOT - TOP);
      ctx.strokeStyle = 'rgba(110,128,146,.55)'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(x - R, TOP); ctx.lineTo(x - R, BOT); ctx.moveTo(x + R, TOP); ctx.lineTo(x + R, BOT); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, TOP, R, 9, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(x - R + 6, TOP + 10, 5, BOT - TOP - 20);
      // 받침
      contact(ctx, x, BOT + 26, 150, 0.22);
      ctx.fillStyle = vgrad(ctx, BOT - 6, BOT + 26, ['#e3d7c8', '#cdbda9']);
      ctx.beginPath(); ctx.moveTo(x - 44, BOT - 6); ctx.lineTo(x + 44, BOT - 6); ctx.lineTo(x + 56, BOT + 24); ctx.lineTo(x - 56, BOT + 24); ctx.closePath(); ctx.fill();
    }
    function magnetV(x, y) {
      // 세운 원통 자석: 위 S(파랑), 아래 N(빨강)
      const R = 24, t = TOP + y, m = t + MH / 2, b = t + MH;
      ctx.fillStyle = vgrad(ctx, t, m, SC); ctx.fillStyle = (() => { const g = ctx.createLinearGradient(x - R, 0, x + R, 0); g.addColorStop(0, SC[2]); g.addColorStop(0.4, SC[0]); g.addColorStop(1, SC[2]); return g; })();
      ctx.fillRect(x - R, t, 2 * R, MH / 2);
      ctx.fillStyle = (() => { const g = ctx.createLinearGradient(x - R, 0, x + R, 0); g.addColorStop(0, NC[2]); g.addColorStop(0.4, NC[0]); g.addColorStop(1, NC[2]); return g; })();
      ctx.fillRect(x - R, m, 2 * R, MH / 2);
      ctx.beginPath(); ctx.ellipse(x, b, R, 6, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = SC[0]; ctx.beginPath(); ctx.ellipse(x, t, R, 6, 0, 0, TAU); ctx.fill();
      return { s: [x, t + MH * 0.27], n: [x, t + MH * 0.75] };
    }
    function bars(ox, oy, E, lost, title, show) {
      const bw = 34, gap = 26, hh = 150;
      const items = [['위치', E ? E.pe : 1], ['운동', E ? E.ke : 0], ['역학적', E ? E.me : 1]];
      ctx.fillStyle = '#f6f9fc'; rr(ctx, ox - 18, oy - hh - 44, 3 * bw + 2 * gap + 36, hh + 92, 14); ctx.fill();
      ctx.strokeStyle = '#dde6ee'; ctx.lineWidth = 1; ctx.stroke();
      items.forEach(([nm, v], i) => {
        const x = ox + i * (bw + gap);
        ctx.strokeStyle = '#b9c6d3'; ctx.lineWidth = 1.2; ctx.strokeRect(x, oy - hh, bw, hh);
        ctx.fillStyle = i === 2 ? BLUE : '#8fb4da'; ctx.fillRect(x, oy - hh * v, bw, hh * v);
        if (i === 2 && lost > 0.004) { ctx.setLineDash([4, 3]); ctx.strokeStyle = BLUE; ctx.strokeRect(x + 1, oy - hh * (v + lost), bw - 2, hh * lost); ctx.setLineDash([]); }
        if (show) OL.put(title + nm, x + bw / 2, oy + 16, nm, 'tx sc2b');
      });
      if (show) OL.put(title + 't', ox + (3 * bw + 2 * gap) / 2, oy - hh - 24, title, 'tx nm');
    }
    function draw() {
      S.begin(); white(S); desk(S, BOT + 24);
      TX.forEach((x) => tube(x));
      // (나) 코일과 발광 다이오드
      const xc = TX[1];
      // 세로로 감은 코일: 뒤쪽 절반 → 자석 → 앞쪽 절반
      const turnsY = []; for (let k = 0; k < 14; k++) turnsY.push(YC - 70 + (k + 0.5) * 10);
      turnsY.forEach((yy) => { ctx.beginPath(); ctx.ellipse(xc, yy, 40, 8, 0, Math.PI, TAU); ctx.strokeStyle = '#7d4824'; ctx.lineWidth = 5; ctx.stroke(); });
      const ms = TX.map((x, i) => magnetV(x, st.y[i]));
      turnsY.forEach((yy) => { ctx.beginPath(); ctx.ellipse(xc, yy, 40, 8, 0, 0, Math.PI); ctx.strokeStyle = vgrad(ctx, yy - 8, yy + 8, COPPER); ctx.lineWidth = 5; ctx.stroke(); });
      // 발광 다이오드
      const lx = xc + 78, ly = YC - 30;
      ctx.strokeStyle = '#a1602e'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(xc + 40, YC - 60); ctx.lineTo(lx - 8, ly + 14); ctx.moveTo(xc + 40, YC + 60); ctx.lineTo(lx + 8, ly + 14); ctx.stroke();
      if (st.lum > 0.03) { const g = ctx.createRadialGradient(lx, ly, 2, lx, ly, 46); g.addColorStop(0, `rgba(255,236,170,${0.75 * st.lum})`); g.addColorStop(1, 'rgba(255,236,170,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, ly, 46, 0, TAU); ctx.fill(); }
      ctx.fillStyle = st.lum > 0.03 ? `rgba(255,${Math.round(lerp(230, 246, st.lum))},${Math.round(lerp(200, 170, st.lum))},.95)` : 'rgba(236,240,244,.95)';
      ctx.beginPath(); ctx.arc(lx, ly - 6, 11, Math.PI, 0); ctx.lineTo(lx + 11, ly + 10); ctx.lineTo(lx - 11, ly + 10); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(110,128,146,.6)'; ctx.lineWidth = 1.2; ctx.stroke();
      // 이름표
      OL.put('ga', TX[0], TOP - 40, '(가)', 'tx nm'); OL.put('na', TX[1], TOP - 40, '(나)', 'tx nm');
      ms.forEach((m, i) => { OL.put('s' + i, m.s[0], m.s[1], 'S', 'tx inv pole sm'); OL.put('n' + i, m.n[0], m.n[1], 'N', 'tx inv pole sm'); });
      OL.put('lc', xc - 76, YC, '코일', 'tx nm la');
      OL.put('ll', lx + 20, ly - 2, '발광<br>다이오드', 'tx twol sm ra');
      // 에너지 막대
      const lost = (i) => (st.done[i] || st.run || st.t > 0 ? 1 - (st.E[i] || energy(i)).me : 0);
      bars(800, 330, st.E[0] || energy(0), 0, '(가)', true);
      bars(800, 640, st.E[1] || energy(1), lost(1), '(나)', true);
      if (st.done[0] && st.tland[0] && (!st.done[1])) OL.put('first', TX[0], BOT + 52, '먼저 도착', 'tx cap on'); else if (!st.done[0]) OL.hide('first');
      if (st.done[0] && st.done[1]) OL.put('first', TX[0], BOT + 52, '먼저 도착', 'tx cap on');
      if (st.done[1]) OL.put('second', TX[1], BOT + 52, '늦게 도착', 'tx cap'); else OL.hide('second');
      if (lost(1) > 0.01) OL.put('lostl', 1010, 640 - 150 * (st.E[1] || energy(1)).me - 26, '줄어든 만큼', 'tx sm lostt'); else OL.hide('lostl');
    }
    return api;
  }

  /* =====================================================================
     5) 다른 예시: 자전거 발전기와 에너지 띠
     ===================================================================== */
  const DEV = [
    { id: 'lamp', name: '전조등', tag: '전조등', out: '빛에너지', p: 3 },
    { id: 'spk', name: '스피커', tag: '스피커', out: '소리 에너지', p: 2 },
    { id: 'phone', name: '휴대 전화 충전', tag: '배터리', out: '화학 에너지', p: 4 },
  ];
  function bike(host, o = {}) {
    const S = surface(host, 1200, 760), ctx = S.ctx, OL = overlay(S);
    const st = { pedal: false, w: 0, a: 0, on: { lamp: false, spk: false, phone: false }, charge: 0.25, t: 0, flow: 0 };
    const api = { st, DEV };
    api.pedal = (v) => { st.pedal = v; };
    api.toggle = (id, v) => { st.on[id] = v == null ? !st.on[id] : v; };
    api.load = () => DEV.reduce((s, d) => s + (st.on[d.id] ? d.p : 0), 0);
    api.heat = () => { const l = api.load(); return l > 0 ? 0.8 + l * 0.12 : 0; };
    api.input = () => api.load() + api.heat();
    addLoop(host, (dt) => {
      if (dt > 0) {
        st.t += dt;
        const tgt = st.pedal ? 6.5 : 0; st.w = lerp(st.w, tgt, Math.min(1, dt * (st.pedal ? 1.5 : 0.9))); st.a += st.w * dt;
        st.flow = lerp(st.flow, st.pedal ? 1 : 0, Math.min(1, dt * 2.5));
        if (st.on.phone && st.w > 3) st.charge = Math.min(1, st.charge + dt * 0.03);
      }
      draw();
    });
    function wheel(x, y, r, a) {
      contact(ctx, x, y + r + 4, r * 2.2, 0.15);
      ctx.strokeStyle = '#2f363e'; ctx.lineWidth = 11; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#555e68'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r - 4, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#a8b1ba'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(x, y, r - 9, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,130,140,.75)'; ctx.lineWidth = 1;
      for (let i = 0; i < 16; i++) { const t = a + (i / 16) * TAU; ctx.beginPath(); ctx.moveTo(x + Math.cos(t) * 7, y + Math.sin(t) * 7); ctx.lineTo(x + Math.cos(t + 0.3) * (r - 10), y + Math.sin(t + 0.3) * (r - 10)); ctx.stroke(); }
      ctx.fillStyle = vgrad(ctx, y - 9, y + 9, STEEL); ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill();
    }
    function band(x0, y0, x1, y1, w, a = 1) {
      ctx.save(); ctx.globalAlpha = a;
      ctx.beginPath(); ctx.moveTo(x0, y0 - w / 2);
      ctx.bezierCurveTo((x0 + x1) / 2, y0 - w / 2, (x0 + x1) / 2, y1 - w / 2, x1, y1 - w / 2);
      ctx.lineTo(x1, y1 + w / 2);
      ctx.bezierCurveTo((x0 + x1) / 2, y1 + w / 2, (x0 + x1) / 2, y0 + w / 2, x0, y0 + w / 2); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    function draw() {
      S.begin(); white(S); desk(S, 470);
      // 자전거(옆모습, 뒷바퀴를 받침대에 올림)
      const R = 98, rear = [455, 352], front = [150, 372], bb = [320, 382], seat = [293, 205], head = [196, 214];
      // 받침대
      ctx.strokeStyle = '#5a636d'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(rear[0], rear[1]); ctx.lineTo(rear[0] - 50, 470); ctx.moveTo(rear[0], rear[1]); ctx.lineTo(rear[0] + 50, 470); ctx.stroke();
      wheel(front[0], front[1], R, 0); wheel(rear[0], rear[1], R, st.a);
      // 뼈대
      ctx.strokeStyle = '#3d4855'; ctx.lineWidth = 9;
      const T = (p, q) => { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); };
      T(bb, seat); T(seat, head); T(head, bb); T(bb, rear); T(seat, rear); T(head, front);
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2.5; T(bb, seat); T(seat, head); T(head, bb);
      // 안장·핸들
      ctx.fillStyle = '#2b3138'; rr(ctx, seat[0] - 34, seat[1] - 20, 64, 14, 7); ctx.fill();
      ctx.strokeStyle = '#2b3138'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(head[0], head[1]); ctx.lineTo(head[0] + 6, head[1] - 34); ctx.lineTo(head[0] + 40, head[1] - 40); ctx.stroke();
      // 체인·톱니
      ctx.strokeStyle = '#6b747e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bb[0], bb[1] - 26); ctx.lineTo(rear[0], rear[1] - 12); ctx.moveTo(bb[0], bb[1] + 26); ctx.lineTo(rear[0], rear[1] + 12); ctx.stroke();
      ctx.fillStyle = '#8a939d'; ctx.beginPath(); ctx.arc(bb[0], bb[1], 26, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(rear[0], rear[1], 12, 0, TAU); ctx.fill();
      // 페달
      const ca = st.a * 0.42;
      [0, Math.PI].forEach((o2) => { const px = bb[0] + Math.cos(ca + o2) * 48, py = bb[1] + Math.sin(ca + o2) * 48;
        ctx.strokeStyle = '#2f363e'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(bb[0], bb[1]); ctx.lineTo(px, py); ctx.stroke();
        ctx.fillStyle = '#2b3138'; rr(ctx, px - 16, py - 5, 32, 10, 3); ctx.fill(); });
      // 발전기(뒷바퀴 타이어에 닿은 병 모양)
      const ta = -2.2, tx = rear[0] + Math.cos(ta) * (R + 4), ty = rear[1] + Math.sin(ta) * (R + 4);
      ctx.save(); ctx.translate(tx, ty); ctx.rotate(ta + Math.PI / 2);
      ctx.fillStyle = (() => { const g = ctx.createLinearGradient(-16, 0, 16, 0); g.addColorStop(0, '#7b8590'); g.addColorStop(0.45, '#dfe4e9'); g.addColorStop(1, '#6b747e'); return g; })();
      rr(ctx, -16, -76, 32, 70, 10); ctx.fill();
      ctx.fillStyle = '#3a4149'; ctx.save(); ctx.translate(0, -2); ctx.rotate(st.a * 4); ctx.fillRect(-7, -7, 14, 14); ctx.restore();
      ctx.restore();
      const dyn = [tx + Math.cos(ta) * 60, ty + Math.sin(ta) * 60];
      // 기구 받침(오른쪽)
      ctx.fillStyle = vgrad(ctx, 300, 330, ['#eef2f6', '#dbe2e9']); rr(ctx, 600, 320, 560, 26, 8); ctx.fill();
      ctx.fillStyle = '#cfd8e0'; ctx.fillRect(630, 346, 14, 124); ctx.fillRect(1116, 346, 14, 124);
      const L = api.load(), drive = clamp(st.w / 6.5, 0, 1);
      const share = (id) => (st.on[id] ? drive : 0);
      // 전조등
      const lx = 700, ly = 320;
      if (share('lamp') > 0.05) { const g = ctx.createLinearGradient(lx + 30, 0, lx + 150, 0); g.addColorStop(0, `rgba(255,236,170,${0.6 * share('lamp')})`); g.addColorStop(1, 'rgba(255,236,170,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(lx + 26, ly - 70); ctx.lineTo(lx + 150, ly - 110); ctx.lineTo(lx + 150, ly - 10); ctx.lineTo(lx + 26, ly - 34); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = vgrad(ctx, ly - 80, ly - 24, ['#5e6772', '#363d45']); rr(ctx, lx - 34, ly - 80, 62, 56, 12); ctx.fill();
      ctx.fillStyle = share('lamp') > 0.05 ? `rgba(255,${Math.round(lerp(236, 246, share('lamp')))},${Math.round(lerp(210, 170, share('lamp')))},1)` : '#dfe5ea';
      ctx.beginPath(); ctx.ellipse(lx + 26, ly - 52, 9, 24, 0, 0, TAU); ctx.fill();
      // 스피커
      const sx = 880, sy = 320, vib = share('spk') > 0.05 ? Math.sin(st.t * 60) * 1.6 * share('spk') : 0;
      ctx.fillStyle = vgrad(ctx, sy - 110, sy, ['#59626c', '#2f363e']); rr(ctx, sx - 45, sy - 110, 90, 110, 12); ctx.fill();
      ctx.fillStyle = '#20262c'; ctx.beginPath(); ctx.arc(sx, sy - 56, 30 + vib, 0, TAU); ctx.fill();
      ctx.fillStyle = '#4a535c'; ctx.beginPath(); ctx.arc(sx, sy - 56, 11 + vib * 0.5, 0, TAU); ctx.fill();
      if (share('spk') > 0.05) { ctx.strokeStyle = `rgba(90,107,126,${0.55 * share('spk')})`; ctx.lineWidth = 1.6; for (let k = 0; k < 3; k++) { const r = 44 + ((st.t * 40 + k * 18) % 54); ctx.globalAlpha = 1 - (r - 44) / 54; ctx.beginPath(); ctx.arc(sx, sy - 56, r, -0.6, 0.6); ctx.stroke(); } ctx.globalAlpha = 1; }
      // 휴대 전화
      const px = 1050, py = 320;
      ctx.fillStyle = '#2b3138'; rr(ctx, px - 30, py - 116, 60, 112, 10); ctx.fill();
      ctx.fillStyle = '#eef2f6'; rr(ctx, px - 24, py - 106, 48, 92, 6); ctx.fill();
      ctx.strokeStyle = '#5a6b7e'; ctx.lineWidth = 1.5; rr(ctx, px - 12, py - 82, 24, 46, 4); ctx.stroke();
      ctx.fillStyle = BLUE; const ch = 40 * st.charge; ctx.fillRect(px - 9, py - 39 - ch, 18, ch);
      // 전선: 발전기 → 기구들
      const wy = 392;
      const wpts = [dyn, [dyn[0] + 60, dyn[1] - 50], [560, 270], [600, wy]];
      const trunk = bez(dyn, [dyn[0] + 90, dyn[1] - 60], [520, wy], [640, wy]);
      wire(ctx, trunk, '#3c4652', 3.5);
      [[lx, ly - 24], [sx, sy], [px, py - 4]].forEach(([dx, dy2]) => wire(ctx, [[dx, wy], [dx, dy2 + 22]], '#3c4652', 3));
      wire(ctx, [[640, wy], [px, wy]], '#3c4652', 3.5);
      if (L > 0) { dots(ctx, trunk.concat([[px, wy]]), st.t * 90 * drive, 30, drive, 3.2); }
      // 에너지 띠(아래)
      const y0 = 625, sc = 9, xin = 100, xg = 350, xe = 500, xo = 860;
      const inW = api.input() * sc * st.flow;
      ctx.fillStyle = '#f6f9fc'; rr(ctx, 40, 500, 1120, 240, 16); ctx.fill(); ctx.strokeStyle = '#dde6ee'; ctx.lineWidth = 1; ctx.stroke();
      if (inW > 1) {
        ctx.fillStyle = '#8fb4da'; band(xin, y0, xg, y0, inW);
        ctx.fillStyle = BLUE; band(xg + 70, y0, xe + 120, y0, api.load() * sc * st.flow);
        // 열에너지(발전기와 전선에서)
        ctx.fillStyle = '#c3ccd5';
        const hw = api.heat() * sc * st.flow;
        band(xg + 70, y0 + api.load() * sc * st.flow / 2 + hw / 2, xo, 715, hw);
        // 나누기
        let yy = y0 - (api.load() * sc * st.flow) / 2;
        const outs = DEV.filter((d) => st.on[d.id]);
        const slots = { lamp: 560, spk: 615, phone: 670 };
        outs.forEach((d) => { const w = d.p * sc * st.flow; ctx.fillStyle = BLUE; band(xe + 120, yy + w / 2, xo, slots[d.id], w, 0.9); yy += w; });
      } else {
        ctx.strokeStyle = '#c9d4de'; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xin, y0); ctx.lineTo(xo, y0); ctx.stroke(); ctx.setLineDash([]);
      }
      // 발전기 칸
      ctx.fillStyle = '#fff'; rr(ctx, xg, y0 - 38, 70, 76, 10); ctx.fill(); ctx.strokeStyle = '#9fb1c3'; ctx.lineWidth = 1.2; ctx.stroke();
      OL.put('bg', xg + 35, y0, '발전기', 'tx nm sm');
      OL.put('bin', xin, y0 - 50, '역학적 에너지<br><span class="u">페달을 밟음</span>', 'tx twol sm');
      OL.put('bel', xe + 30, y0 - 50, '전기 에너지', 'tx nm sm blue');
      DEV.forEach((d) => { const y = { lamp: 560, spk: 615, phone: 670 }[d.id]; OL.put('o' + d.id, xo + 14, y, `${d.out} <span class="u">${d.tag}</span>`, 'tx lay ra' + (st.on[d.id] && st.flow > 0.3 ? '' : ' dim')); });
      OL.put('oheat', xo + 14, 715, '열에너지 <span class="u">발전기·전선</span>', 'tx lay ra' + (api.heat() > 0 && st.flow > 0.3 ? '' : ' dim'));
      OL.put('dl', lx, 362, '전조등', 'tx nm sm'); OL.put('ds', sx, 362, '스피커', 'tx nm sm'); OL.put('dp', px, 362, '휴대 전화', 'tx nm sm');
      OL.put('dy', dyn[0] - 70, dyn[1] - 20, '발전기', 'tx nm sm');
      if (inW <= 1) OL.put('none', 600, y0 + 38, st.pedal ? '켠 기구가 없으면 전기 에너지가 쓰이지 않아요' : '페달을 밟으면 에너지가 흐르는 모습이 보여요', 'tx m'); else OL.hide('none');
    }
    return api;
  }

  return { lab, flash, gen, drop, bike, DEV, _: { surface, overlay, addLoop, coil, barMagnet, galvo, bulb } };
})();
