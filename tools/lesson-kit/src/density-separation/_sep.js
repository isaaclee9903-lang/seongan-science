/* ===== 밀도 차를 이용한 분리 그림 도구 (캔버스 2D) =====
   SEP.bottle(host)    흔들어 섞은 물과 콩기름: 콩기름 방울이 떠올라 두 층이 되는 병
   SEP.funnel(host)    탐구 '물과 콩기름의 혼합물 분리하기': 스탠드·링·분별 깔때기·비커 3개
   SEP.winnow(host)    키질: 바람이 불 때 밀도가 작은 검불·티는 날아가고 알곡은 키로 떨어짐
   SEP.boom(host)      바다에 유출된 기름과 기름막이: 위에서 본 바다 + 옆에서 자른 모습
   그림 원칙: 흰 바탕, 라스 파랑 한 색조 + 무채색(물질의 실제 색은 옅게), 매트한 질감, 얇은 선. 그림 속 글씨는 HTML 이름표.
   방울 크기·떠오르는 빠르기·기다리는 시간·꼭지로 흐르는 양·키질과 바람의 세기·기름이 퍼지는 빠르기는 보기 좋게 정한 모형. */
window.SEP = (() => {
  const TAU = Math.PI * 2;
  const BLUE = '#0e63b3';
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const shade = (c, f) => c.map((v) => Math.round(clamp(v * f, 0, 255)));
  const mixC = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const WATER = [190, 220, 244], OIL = [236, 208, 128], MILK = [244, 236, 214];

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
  // 이름표 연결선 (얇은 회색)
  function lead(ctx, pts) { ctx.save(); ctx.strokeStyle = 'rgba(90,107,126,.55)'; ctx.lineWidth = 1; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.fillStyle = 'rgba(90,107,126,.75)'; const [ex, ey] = pts[pts.length - 1]; ctx.beginPath(); ctx.arc(ex, ey, 2, 0, TAU); ctx.fill(); ctx.restore(); }

  /* ---- 그릇 속 부피 ↔ 높이 ----
     hwi(y): 그릇 안쪽 반폭. 세운 그릇을 돌림 모양으로 보고 아래부터 쌓인 부피를 구한다(mL 단위로 맞춤). */
  function vessel(hwi, y0, y1) {
    const n = Math.ceil(y1 - y0), cum = new Float64Array(n + 1);
    for (let i = n - 1; i >= 0; i--) { const w = hwi(y0 + i + 0.5); cum[i] = cum[i + 1] + Math.PI * w * w; }
    let K = 1;
    const vol = (y) => { const t = clamp(y - y0, 0, n), i = Math.floor(t), f = t - i; return (i >= n ? 0 : cum[i] * (1 - f) + cum[i + 1] * f) * K; };
    const Y = (v) => { if (v <= 0) return y1; let a = y0, b = y1; for (let k = 0; k < 28; k++) { const m = (a + b) / 2; if (vol(m) > v) a = m; else b = m; } return (a + b) / 2; };
    return { vol, Y, hwi, y0, y1,
      scale(yRef, mL) { K = 1; K = mL / vol(yRef); },
      path(ctx, ya, yb) {
        ya = clamp(ya, y0, y1); yb = clamp(yb, y0, y1);
        ctx.beginPath(); ctx.moveTo(-hwi(ya), ya);
        for (let y = ya + 2; y < yb; y += 2) ctx.lineTo(-hwi(y), y);
        ctx.lineTo(-hwi(yb), yb); ctx.lineTo(hwi(yb), yb);
        for (let y = yb - 2; y > ya; y -= 2) ctx.lineTo(hwi(y), y);
        ctx.lineTo(hwi(ya), ya); ctx.closePath();
      } };
  }

  /* ---- 섞인 액체(콩기름 방울이 물속에 흩어진 모습)와 층 나누기 ----
     E.w, E.o: 물·콩기름 부피(mL). E.f: 위층으로 모인 콩기름의 비율(1이면 다 나뉨). 방울 하나 = 흩어진 콩기름 한 몫. */
  function emulsion(V, N = 120) {
    const E = { w: 0, o: 0, f: 1, drops: [], n0: 1, turb: 0, t: 0, ow: 0, oTarget: 0 };
    E.top = () => V.Y(E.w + E.o);
    E.iface = () => V.Y(E.w + E.o * (1 - E.f));
    function spawnOne() {
      for (let k = 0; k < 12; k++) {
        const v = Math.random() * (E.w + E.o) * 0.97 + 0.4, y = V.Y(v), r = 2.6 + Math.random() * 4.6, hw = V.hwi(y) - r - 2;
        if (hw < 6) continue;
        E.drops.push({ x: (Math.random() * 2 - 1) * hw, y, r, vx: 0, vy: 0, ph: Math.random() * TAU }); return true;
      }
      return false;
    }
    E.set = (w, o, mixed) => {
      E.w = w; E.o = o; E.drops = []; E.turb = 0;
      if (mixed) { E.f = 0; for (let i = 0; i < N; i++) spawnOne(); E.n0 = Math.max(1, E.drops.length); E.turb = 1; } else E.f = 1;
    };
    // 섞인 혼합물을 조금씩 부어 넣기
    E.addMix = (dw, dO, oTotal) => {
      if (E.w + E.o < 0.01) { E.f = 0; E.n0 = N; }
      E.w += dw; E.o += dO; E.turb = 1;
      const want = Math.round(N * clamp(E.o / oTotal, 0, 1));
      while (E.drops.length < want && spawnOne());
    };
    E.step = (dt, settle, speed = 1) => {
      E.t += dt; E.turb = Math.max(0, E.turb - dt * (settle ? 1.4 : 0.35));
      const top = E.top(); let yi = E.iface();
      E.drops = E.drops.filter((d) => {
        if (settle) { const vt = -(12 + d.r * 4.2) * speed; d.vy += (vt - d.vy) * Math.min(1, 3 * dt); }
        else d.vy *= 1 - 1.5 * dt;
        if (E.turb > 0) { d.vx += (Math.random() - 0.5) * E.turb * 900 * dt; d.vy += (Math.random() - 0.5) * E.turb * 700 * dt; }
        d.vx *= 1 - 2.5 * dt;
        d.x += d.vx * dt + Math.sin(E.t * 1.7 + d.ph) * 0.12; d.y += d.vy * dt;
        const hw = V.hwi(d.y) - d.r - 1.5;
        if (hw <= 0) { d.y -= 3; d.x *= 0.8; } else if (Math.abs(d.x) > hw) { d.x = Math.sign(d.x) * hw; d.vx *= -0.4; }
        if (settle && d.y - d.r <= yi + 1.5) { E.f = Math.min(1, E.f + 1 / E.n0); yi = E.iface(); return false; }
        if (d.y - d.r < top + 1) { d.y = top + d.r + 1; d.vy = Math.abs(d.vy) * 0.3; }
        return true;
      });
      if (settle && !E.drops.length) E.f = 1;
    };
    E.mixed = () => E.drops.length > 0;
    // 그리기 (그릇 좌표계)
    E.draw = (ctx, opt = {}) => {
      if (E.w + E.o < 0.05) return;
      const top = E.top(), yi = E.iface(), bot = V.y1, d = E.drops.length ? clamp(E.drops.length / E.n0, 0, 1) : 0;
      if (bot - yi > 0.3) {
        V.path(ctx, yi, bot);
        const g = ctx.createLinearGradient(0, yi, 0, bot); g.addColorStop(0, rgba(WATER, 0.62)); g.addColorStop(1, rgba(shade(WATER, 0.92), 0.78));
        ctx.fillStyle = g; ctx.fill();
        if (d > 0) { ctx.fillStyle = rgba(MILK, 0.62 * d); ctx.fill(); }
      }
      if (yi - top > 0.3) {
        V.path(ctx, top, yi);
        const g = ctx.createLinearGradient(0, top, 0, yi); g.addColorStop(0, rgba(OIL, 0.72)); g.addColorStop(1, rgba(shade(OIL, 0.95), 0.86));
        ctx.fillStyle = g; ctx.fill();
      }
      if (E.drops.length) {
        ctx.save(); V.path(ctx, top, bot); ctx.clip();
        E.drops.forEach((p) => {
          const g = ctx.createRadialGradient(p.x - p.r * 0.35, p.y - p.r * 0.4, 0.5, p.x, p.y, p.r);
          g.addColorStop(0, 'rgba(255,248,222,.95)'); g.addColorStop(1, rgba(shade(OIL, 0.94), 0.92));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
          ctx.strokeStyle = rgba(shade(OIL, 0.72), 0.45); ctx.lineWidth = 0.7; ctx.stroke();
        });
        ctx.restore();
      }
      // 경계면
      if (!E.drops.length && E.w > 0.05 && yi - top > 1) {
        const hw = V.hwi(yi); ctx.strokeStyle = rgba(shade(OIL, 0.62), opt.hiIface ? 1 : 0.85); ctx.lineWidth = opt.hiIface ? 2 : 1.3;
        ctx.beginPath(); ctx.moveTo(-hw, yi); ctx.lineTo(hw, yi); ctx.stroke();
      }
      // 겉면
      const hw = V.hwi(top); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(-hw + 1, top); ctx.lineTo(hw - 1, top); ctx.stroke();
    };
    return E;
  }

  // 비커 (앞에서 본 모습). x: 가운데, yb: 바닥, c: {w, o} 물·콩기름 mL, k: 1 mL당 높이
  const BK = { w: 104, h: 100, k: 0.9 };
  function beaker(ctx, x, yb, c, o = {}) {
    const w = BK.w, h = BK.h, x0 = x - w / 2, y0 = yb - h, ix0 = x0 + 4, ix1 = x0 + w - 4, ib = yb - 7;
    contact(ctx, x, yb + 1, w * 1.15, 0.13);
    ctx.save(); rr(ctx, x0, y0, w, h, 9); ctx.fillStyle = 'rgba(236,242,247,.5)'; ctx.fill(); ctx.restore();
    const hw = c.w * BK.k, ho = c.o * BK.k;
    if (hw > 0.2) { const g = ctx.createLinearGradient(0, ib - hw, 0, ib); g.addColorStop(0, rgba(WATER, 0.66)); g.addColorStop(1, rgba(shade(WATER, 0.9), 0.8)); ctx.fillStyle = g; rr(ctx, ix0, ib - hw, ix1 - ix0, hw + 3, 4); ctx.fill(); }
    if (ho > 0.2) { const g = ctx.createLinearGradient(0, ib - hw - ho, 0, ib - hw); g.addColorStop(0, rgba(OIL, 0.75)); g.addColorStop(1, rgba(shade(OIL, 0.94), 0.88)); ctx.fillStyle = g; ctx.fillRect(ix0, ib - hw - ho, ix1 - ix0, ho + (hw > 0.2 ? 0 : 3)); }
    if (hw > 0.2 && ho > 0.2) { ctx.strokeStyle = rgba(shade(OIL, 0.62), 0.8); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ix0, ib - hw); ctx.lineTo(ix1, ib - hw); ctx.stroke(); }
    if (hw + ho > 0.4) { ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ix0, ib - hw - ho); ctx.lineTo(ix1, ib - hw - ho); ctx.stroke(); }
    // 유리 앞면
    ctx.save();
    ctx.strokeStyle = 'rgba(110,130,150,.7)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x0 - 5, y0 - 3); ctx.quadraticCurveTo(x0, y0 - 1, x0, y0 + 8); ctx.lineTo(x0, yb - 8); ctx.quadraticCurveTo(x0, yb, x0 + 8, yb); ctx.lineTo(x0 + w - 8, yb); ctx.quadraticCurveTo(x0 + w, yb, x0 + w, yb - 8); ctx.lineTo(x0 + w, y0); ctx.stroke();
    ctx.strokeStyle = 'rgba(110,130,150,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y0, w / 2, 3.5, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(110,130,150,.5)'; ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) { const yy = ib - i * 20 * BK.k; ctx.beginPath(); ctx.moveTo(x0 + w - 20, yy); ctx.lineTo(x0 + w - 6, yy); ctx.stroke(); }
    let g = ctx.createLinearGradient(x0, 0, x0 + 22, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.4, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x0 + 6, y0 + 10, 18, h - 26);
    g = ctx.createLinearGradient(0, yb - 7, 0, yb); g.addColorStop(0, 'rgba(210,222,233,.5)'); g.addColorStop(1, 'rgba(180,196,210,.7)');
    ctx.fillStyle = g; rr(ctx, x0 + 1, yb - 7, w - 2, 6, 4); ctx.fill();
    if (o.hi) { ctx.strokeStyle = BLUE; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); rr(ctx, x0 - 8, y0 - 10, w + 16, h + 18, 12); ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore();
    return ib - hw - ho; // 겉면 높이
  }

  /* =================================================================
     1. 흔들어 섞은 물과 콩기름 (병)
     ================================================================= */
  function bottle(host, o = {}) {
    const W = 1000, H = 520, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx;
    const CX = 330, TY = 470, BY0 = 150, BY1 = 452, HW = 92;
    const hwi = (y) => (y < BY0 + 6 ? HW - 22 : y > BY1 - 10 ? HW - 2 - Math.pow((y - (BY1 - 10)) / 10, 2) * 4 : HW - 2);
    const V = vessel(hwi, BY0 - 30, BY1); V.scale(BY0 + 70, 100);
    const E = emulsion(V, 110); E.set(55, 45, false);
    const st = { shake: 0, ang: 0, settle: false, t: 0, cb: null, speed: o.speed || 1 };
    function shake(cb) {
      if (st.shake > 0) return; st.shake = 1.5; st.settle = false; st.cb = null;
      setTimeout(() => { E.set(55, 45, true); }, reduce ? 0 : 350);
      setTimeout(() => cb && cb(), reduce ? 0 : 1550);
    }
    function wait(cb) { st.settle = true; st.cb = cb; if (reduce) { E.set(55, 45, false); st.cb = null; cb && cb(); } }
    function reset() { st.shake = 0; st.settle = false; st.cb = null; E.set(55, 45, false); }
    function glass() {
      // 병 모양(앞에서 본 모습): 몸통 + 어깨 + 목 + 마개
      ctx.beginPath();
      ctx.moveTo(-HW, BY1 - 14); ctx.lineTo(-HW, BY0 + 30); ctx.quadraticCurveTo(-HW, BY0 - 4, -46, BY0 - 20); ctx.lineTo(-30, BY0 - 30);
      ctx.lineTo(-30, BY0 - 70); ctx.lineTo(30, BY0 - 70); ctx.lineTo(30, BY0 - 30); ctx.lineTo(46, BY0 - 20); ctx.quadraticCurveTo(HW, BY0 - 4, HW, BY0 + 30); ctx.lineTo(HW, BY1 - 14);
      ctx.quadraticCurveTo(HW, BY1 + 2, HW - 16, BY1 + 2); ctx.lineTo(-HW + 16, BY1 + 2); ctx.quadraticCurveTo(-HW, BY1 + 2, -HW, BY1 - 14); ctx.closePath();
    }
    addLoop(host, (dt) => {
      st.t += dt;
      if (st.shake > 0) { st.shake = Math.max(0, st.shake - dt); const k = st.shake / 1.5; st.ang = Math.sin(st.t * 22) * 0.13 * Math.sin(k * Math.PI); } else st.ang *= 0.8;
      E.step(dt, st.settle, st.speed);
      if (st.settle && !E.mixed() && st.cb) { const cb = st.cb; st.cb = null; cb(); }
      S.begin(); white(S); desk(S, TY);
      contact(ctx, CX, TY + 2, 260, 0.16);
      ctx.save(); ctx.translate(CX, TY); ctx.rotate(st.ang); ctx.translate(0, -TY + (st.shake > 0 ? Math.sin(st.t * 30) * 3 : 0));
      glass(); ctx.fillStyle = 'rgba(236,242,247,.5)'; ctx.fill();
      E.draw(ctx);
      glass(); ctx.strokeStyle = 'rgba(110,130,150,.7)'; ctx.lineWidth = 2; ctx.stroke();
      let g = ctx.createLinearGradient(-HW, 0, -HW + 34, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.4, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(-HW + 8, BY0 + 20, 26, BY1 - BY0 - 40);
      // 마개
      g = ctx.createLinearGradient(-34, 0, 34, 0); g.addColorStop(0, '#d9dee3'); g.addColorStop(0.45, '#f6f8f9'); g.addColorStop(1, '#c9d0d6');
      ctx.fillStyle = g; rr(ctx, -36, BY0 - 92, 72, 26, 6); ctx.fill(); ctx.strokeStyle = 'rgba(90,107,126,.45)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
      // 이름표
      const top = E.top(), yi = E.iface();
      if (!E.mixed() && st.shake <= 0) {
        lead(ctx, [[CX + HW + 70, (top + yi) / 2], [CX + HW - 20, (top + yi) / 2]]);
        lead(ctx, [[CX + HW + 70, (yi + BY1) / 2], [CX + HW - 20, (yi + BY1) / 2]]);
        ov.put('lo', CX + HW + 80, (top + yi) / 2, '콩기름 <span class="u">밀도 0.92 g/mL</span>', 'tx nm ra twol');
        ov.put('lw', CX + HW + 80, (yi + BY1) / 2, '물 <span class="u">밀도 1.00 g/mL</span>', 'tx nm ra twol');
        ov.hide('lm');
      } else {
        ov.hide('lo'); ov.hide('lw');
        lead(ctx, [[CX + HW + 70, (top + BY1) / 2], [CX + 30, (top + BY1) / 2 + 20]]);
        ov.put('lm', CX + HW + 80, (top + BY1) / 2, '콩기름 방울이 물속에 흩어진 혼합물', 'tx nm ra');
      }
    });
    return { shake, wait, reset, E };
  }

  /* =================================================================
     2. 분별 깔때기 실험 (탐구)
     좌표: 깔때기 좌표계는 축이 x=0, 입구가 y=92. 받침 상태에서 (FX, 0)으로 옮겨 그린다.
     ================================================================= */
  const PROF = [[92, 19], [128, 19], [134, 30], [146, 52], [162, 74], [184, 92], [212, 103], [240, 103], [268, 95], [300, 81], [340, 61], [380, 41], [420, 22], [446, 10], [456, 6.5]];
  const hwOut = (() => {
    // 캣멀-롬 곡선으로 매끈하게 만든 뒤 1px마다 반폭 표
    const pts = [];
    for (let i = 0; i < PROF.length - 1; i++) {
      const p0 = PROF[Math.max(0, i - 1)], p1 = PROF[i], p2 = PROF[i + 1], p3 = PROF[Math.min(PROF.length - 1, i + 2)];
      for (let s = 0; s < 12; s++) {
        const t = s / 12, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    pts.push(PROF[PROF.length - 1]);
    const tab = new Float32Array(460);
    for (let y = 0; y < 460; y++) {
      if (y < 92) { tab[y] = 0; continue; }
      let j = 0; while (j < pts.length - 2 && pts[j + 1][0] < y) j++;
      const a = pts[j], b = pts[j + 1], k = clamp((y - a[0]) / Math.max(0.001, b[0] - a[0]), 0, 1);
      tab[y] = lerp(a[1], b[1], k);
    }
    return (y) => { const i = Math.floor(clamp(y, 0, 458)), f = y - i; return lerp(tab[i], tab[Math.min(459, i + 1)], clamp(f, 0, 1)); };
  })();
  const hwIn = (y) => Math.max(1.6, hwOut(y) - 3);
  const PIV = 230, MOUTH = 92, CONE = 456, COCK = 470, TIP = 598;
  function outerPath(ctx) {
    ctx.beginPath(); ctx.moveTo(-hwOut(MOUTH), MOUTH);
    for (let y = MOUTH + 2; y <= CONE; y += 2) ctx.lineTo(-hwOut(y), y);
    ctx.lineTo(-5, CONE + 4); ctx.lineTo(-5, TIP - 8); ctx.lineTo(-3.4, TIP); ctx.lineTo(3.4, TIP); ctx.lineTo(5, TIP - 8); ctx.lineTo(5, CONE + 4);
    for (let y = CONE; y >= MOUTH; y -= 2) ctx.lineTo(hwOut(y), y);
    ctx.closePath();
  }
  function funnelGlassBack(ctx) { outerPath(ctx); ctx.fillStyle = 'rgba(236,242,247,.5)'; ctx.fill(); }
  function funnelGlassFront(ctx) {
    ctx.save();
    outerPath(ctx); ctx.strokeStyle = 'rgba(110,130,150,.72)'; ctx.lineWidth = 1.7; ctx.lineJoin = 'round'; ctx.stroke();
    // 왼쪽 반사 띠
    ctx.beginPath(); for (let y = 150; y <= 330; y += 3) { const x = -hwOut(y) + 12 + (y - 150) * 0.02; y === 150 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); for (let y = 190; y <= 300; y += 3) { const x = hwOut(y) - 10; y === 190 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.4; ctx.stroke();
    // 입구 테
    const g = ctx.createLinearGradient(-24, 0, 24, 0); g.addColorStop(0, 'rgba(205,216,226,.9)'); g.addColorStop(0.5, 'rgba(246,249,251,.95)'); g.addColorStop(1, 'rgba(190,203,215,.9)');
    ctx.fillStyle = g; rr(ctx, -23, MOUTH - 4, 46, 9, 3); ctx.fill(); ctx.strokeStyle = 'rgba(110,130,150,.6)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
  function stopcock(ctx, open) {
    // 꼭지: 앞에서 본 둥근 몸통 + 손잡이(가로 = 잠금, 세로 = 열림)
    ctx.save();
    let g = ctx.createLinearGradient(-20, 0, 20, 0); g.addColorStop(0, 'rgba(196,209,221,.9)'); g.addColorStop(0.5, 'rgba(240,245,249,.95)'); g.addColorStop(1, 'rgba(182,197,211,.9)');
    ctx.fillStyle = g; rr(ctx, -19, COCK - 9, 38, 18, 7); ctx.fill(); ctx.strokeStyle = 'rgba(110,130,150,.65)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.translate(30, COCK); // 손잡이는 오른쪽 축 끝
    ctx.fillStyle = 'rgba(190,203,215,.95)'; ctx.fillRect(-12, -4, 12, 8);
    ctx.rotate(-open * Math.PI / 2);
    g = ctx.createLinearGradient(0, -6, 0, 6); g.addColorStop(0, '#fbfcfd'); g.addColorStop(1, '#d7dee5');
    ctx.fillStyle = g; rr(ctx, -24, -6, 48, 12, 6); ctx.fill(); ctx.strokeStyle = 'rgba(70,88,106,.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#c3ccd5'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(70,88,106,.5)'; ctx.stroke();
    ctx.restore();
  }
  function stopper(ctx, x, y, a = 0) {
    // 마개: 아래가 좁은 간 유리 마개 + 위 손잡이. (x, y)는 마개 아래 끝
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    let g = ctx.createLinearGradient(-16, 0, 16, 0); g.addColorStop(0, '#d6dce2'); g.addColorStop(0.45, '#f7f9fa'); g.addColorStop(1, '#c4ccd4');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(-16, -26); ctx.lineTo(16, -26); ctx.lineTo(13, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(90,107,126,.5)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = g; rr(ctx, -22, -40, 44, 15, 6); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function pourBeaker(ctx, lip, A, fillK) {
    // 혼합물을 붓는 작은 비커(기울임). lip: 따르는 입 위치
    const w = 74, h = 92;
    ctx.save(); ctx.translate(lip[0], lip[1]); ctx.rotate(A);
    ctx.save(); rr(ctx, 0, 0, w, h, 7); ctx.clip(); ctx.rotate(-A);
    const lev = lerp(-58, -2, fillK);
    ctx.fillStyle = rgba(WATER, 0.75); ctx.fillRect(-200, lev, 400, 300); ctx.fillStyle = rgba(MILK, 0.7); ctx.fillRect(-200, lev, 400, 300);
    ctx.restore();
    ctx.fillStyle = 'rgba(236,242,247,.35)'; rr(ctx, 0, 0, w, h, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(110,130,150,.75)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, h - 7); ctx.quadraticCurveTo(0, h, 7, h); ctx.lineTo(w - 7, h); ctx.quadraticCurveTo(w, h, w, h - 7); ctx.lineTo(w, 0); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(6, 8, 6, h - 18);
    ctx.restore();
  }

  function funnel(host, o = {}) {
    const W = 1100, H = 760, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx, TW = tweens();
    const FX = 400, DESK = 724, PLATE = 702, ROD = 172, RING = 338;
    const SLOT = { S: [FX, PLATE], D: [[668, DESK], [800, DESK], [960, DESK]] };
    const V = vessel(hwIn, MOUTH + 2, CONE); V.scale(200, 100);
    const E = emulsion(V, 130);
    const W0 = 55, O0 = 45, RATE = [0, 4.5, 16];
    const st = {
      t: 0, tap: 0, cap: 'desk', capP: [560, DESK], capA: 0, settle: false, speed: o.speed || 1,
      pose: { x: FX, y: PIV, a: 0, al: 1 }, pour: null, mpour: null, flight: [], stemC: null, drips: [],
      bk: [{ w: 0, o: 0, x: SLOT.S[0], y: SLOT.S[1] }, { w: 0, o: 0, x: SLOT.D[1][0], y: DESK }, { w: 0, o: 0, x: SLOT.D[2][0], y: DESK }],
      under: 0, moving: false, labels: o.labels !== false, cb: {}, hiB: -1,
    };
    // 기울인 깔때기 속 액체: 단면 위 점마다 돌림 부피 몫(|x|)을 주어 수평 겉면 높이를 찾는다
    const SAMP = []; (() => { for (let y = MOUTH + 2; y < CONE; y += 3) { const hw = hwIn(y); for (let x = -hw + 1.5; x < hw; x += 3) SAMP.push([x, y, Math.abs(x) + 0.75]); } })();
    const SAMPK = (() => { let s = 0; SAMP.forEach((p) => (s += p[2])); return (V.vol(MOUTH + 2)) / s; })();
    function levelFor(v, a, py) { // 세계 좌표의 높이(깔때기 회전 a, 회전 중심 높이 py)
      const ca = Math.cos(a), sa = Math.sin(a);
      const ys = SAMP.map((p) => [py + p[0] * sa + (p[1] - PIV) * ca, p[2]]).sort((m, n) => n[0] - m[0]);
      let acc = 0; for (const [y, w] of ys) { acc += w * SAMPK; if (acc >= v) return y; }
      return ys.length ? ys[ys.length - 1][0] : py;
    }
    function reset() {
      TW.clear(); E.set(0, 0, false); E.w = 0; E.o = 0;
      Object.assign(st, { tap: 0, cap: 'desk', capP: [560, DESK], capA: 0, settle: false, pour: null, mpour: null, flight: [], stemC: null, drips: [], under: 0, moving: false, cb: {}, hiB: -1 });
      st.pose = { x: FX, y: PIV, a: 0, al: 1 };
      st.bk = [{ w: 0, o: 0, x: SLOT.S[0], y: SLOT.S[1] }, { w: 0, o: 0, x: SLOT.D[1][0], y: DESK }, { w: 0, o: 0, x: SLOT.D[2][0], y: DESK }];
    }
    // 1. 혼합물 넣기
    function fill(cb) {
      if (st.pour || E.w + E.o > 0) return;
      st.pour = { t: 0, cb };
      if (reduce) { E.set(W0, O0, true); st.pour = null; cb && cb(); }
    }
    // 2. 마개 닫기 / 열기
    function cap(on, cb) {
      const from = st.capP.slice(), fa = st.capA, to = on ? [FX, MOUTH + 4] : [560, DESK], ta = on ? 0 : 0;
      st.cap = 'move';
      TW.add(0.8, (k) => { const e = ease(k); st.capP = [lerp(from[0], to[0], e), lerp(from[1], to[1], e) - Math.sin(k * Math.PI) * 70]; st.capA = lerp(fa, ta, e); }, () => { st.cap = on ? 'on' : 'desk'; cb && cb(); });
    }
    function wait(cb) { st.settle = true; st.cb.settle = cb; if (reduce) { E.set(E.w, E.o, false); st.cb.settle = null; cb && cb(); } }
    // 3. 꼭지 (0 잠금, 1 조금, 2 많이)
    function setTap(v) { st.tap = v; }
    function underBeaker() { return st.moving ? -1 : st.under; }
    // 비커 바꾸기: 받던 비커를 옆으로, 다음 비커를 꼭지 아래로
    function swap(cb) {
      if (st.moving || st.under >= 2) return;
      const a = st.under, b = a + 1, A = st.bk[a], B = st.bk[b];
      st.moving = true;
      const ax = A.x, ay = A.y, bx = B.x, by = B.y;
      TW.add(0.75, (k) => { const e = ease(k); A.x = lerp(ax, SLOT.D[a][0], e); A.y = lerp(ay, SLOT.D[a][1], e); }, () => {
        TW.add(0.75, (k) => { const e = ease(k); B.x = lerp(bx, SLOT.S[0], e); B.y = lerp(by, SLOT.S[1], e); }, () => { st.under = b; st.moving = false; cb && cb(); });
      });
    }
    // 4. 위층 액체를 입구로 따르기 (비커 3을 옆으로 옮긴 뒤)
    function pourTop(cb) {
      if (st.mpour) return;
      const B = st.bk[2], bx = B.x, by = B.y, A = 2.1, mouth = [SLOT.D[2][0] - 4, 566];
      const px = mouth[0] - 138 * Math.sin(A), py = mouth[1] + 138 * Math.cos(A);
      st.mpour = { phase: 'move', cb, t: 0 };
      st.under = -1;
      const go = () => {
        TW.add(0.55, (k) => { st.pose.y = lerp(PIV, PIV - 60, ease(k)); st.pose.al = 1 - k; }, () => {
          st.pose = { x: px, y: py, a: 1.0, al: 0 };
          TW.add(0.5, (k) => { st.pose.al = k; st.pose.a = lerp(1.0, 1.55, ease(k)); }, () => {
            TW.add(0.9, (k) => { st.pose.a = lerp(1.55, A, ease(k)); }, () => { st.mpour.phase = 'pour'; });
          });
        });
      };
      if (Math.abs(bx - SLOT.D[2][0]) > 1 || Math.abs(by - DESK) > 1) TW.add(0.8, (k) => { const e = ease(k); B.x = lerp(bx, SLOT.D[2][0], e); B.y = lerp(by, DESK, e) - Math.sin(k * Math.PI) * 26; }, go); else go();
    }
    function backHome(cb) {
      const p = st.pose, x0 = p.x, y0 = p.y, a0 = p.a;
      TW.add(0.5, (k) => { p.a = lerp(a0, 0.6, ease(k)); p.al = 1 - k; }, () => {
        st.pose = { x: FX, y: PIV - 60, a: 0, al: 0 };
        TW.add(0.6, (k) => { st.pose.al = k; st.pose.y = lerp(PIV - 60, PIV, ease(k)); }, () => { st.mpour = null; cb && cb(); });
      });
      void x0; void y0;
    }
    // 검사·읽기용: 곧바로 어떤 상태로
    function jump(stage) {
      reset();
      if (stage >= 1) { E.set(W0, O0, stage === 1); E.turb = stage === 1 ? 0.3 : 0; }
      if (stage >= 2) { st.cap = 'on'; st.capP = [FX, MOUTH + 4]; }
      if (stage >= 3) { st.cap = 'desk'; st.capP = [560, DESK]; }
      if (stage >= 4) { E.w = 0.0; E.o = O0 - 2.2; st.bk[0].w = W0 - 0.6; st.bk[1].w = 0.6; st.bk[1].o = 2.2; st.bk[0].x = SLOT.D[0][0]; st.bk[0].y = DESK; st.bk[1].x = SLOT.D[1][0]; st.bk[1].y = DESK; st.bk[2].x = SLOT.S[0]; st.bk[2].y = SLOT.S[1]; st.under = 2; }
      if (stage >= 5) { st.bk[2].o = E.o; E.o = 0; st.bk[2].x = SLOT.D[2][0]; st.bk[2].y = DESK; st.under = -1; }
    }

    addLoop(host, (dt) => {
      st.t += dt; TW.step(dt);
      // 혼합물 붓기
      if (st.pour) {
        const P = st.pour; P.t += dt;
        const k = clamp((P.t - 0.45) / 2.2, 0, 1), want = 100 * k, have = E.w + E.o;
        if (want > have) E.addMix((want - have) * W0 / 100, (want - have) * O0 / 100, O0);
        if (P.t > 3.2) { const cb = P.cb; st.pour = null; cb && cb(); }
      }
      E.step(dt, st.settle, st.speed);
      if (st.settle && !E.mixed() && st.cb.settle) { const cb = st.cb.settle; st.cb.settle = null; cb(); }
      // 꼭지로 흘러나감 (마개를 열어야 함, 다 나뉜 뒤에만)
      const flowing = st.tap > 0 && st.cap !== 'on' && !E.mixed() && E.w + E.o > 0.01 && st.pose.a === 0;
      if (flowing) {
        let dv = Math.min(RATE[st.tap] * dt, E.w + E.o);
        const tw = Math.min(dv, E.w); E.w -= tw; dv -= tw; const to = Math.min(dv, E.o); E.o -= to;
        st.flight.push({ age: 0, w: tw, o: to });
      }
      // 줄기 속 액체가 비커에 닿기까지 조금 걸림
      st.flight.forEach((p) => (p.age += dt));
      while (st.flight.length && st.flight[0].age > 0.42) {
        const p = st.flight.shift(), u = underBeaker();
        if (u >= 0) { st.bk[u].w += p.w; st.bk[u].o += p.o; }
      }
      // 꼭지를 잠근 뒤 끝에 맺힌 방울
      if (!flowing && st.flight.length === 0 && st.stemC && Math.random() < dt * 1.2 && st.drips.length < 2) { st.drips.push({ y: TIP + 2, v: 0, c: st.stemC }); }
      if (!flowing && st.flight.length === 0 && st.stemC && st.t % 3 < dt) st.stemC = null;
      st.drips = st.drips.filter((d) => { d.v += 900 * dt; d.y += d.v * dt; return d.y < PLATE - 20; });
      // 입구로 따르기
      if (st.mpour && st.mpour.phase === 'pour') {
        const M = st.mpour; M.t += dt;
        let dv = Math.min(22 * dt, E.w + E.o);
        const tw = Math.min(dv, E.w); E.w -= tw; dv -= tw; const to = Math.min(dv, E.o); E.o -= to;
        M.fl = (M.fl || []); if (tw + to > 0) M.fl.push({ age: 0, w: tw, o: to });
        M.fl.forEach((p) => (p.age += dt));
        while (M.fl.length && M.fl[0].age > 0.3) { const p = M.fl.shift(); st.bk[2].w += p.w; st.bk[2].o += p.o; }
        if (E.w + E.o < 0.05 && !M.fl.length) { E.w = 0; E.o = 0; M.phase = 'back'; backHome(M.cb); }
      }

      /* ---- 그리기 ---- */
      S.begin(); white(S); desk(S, DESK);
      // 스탠드 받침판
      contact(ctx, 300, DESK + 2, 520, 0.16);
      let g = ctx.createLinearGradient(0, PLATE - 4, 0, DESK);
      g.addColorStop(0, '#5b6570'); g.addColorStop(1, '#3a424b');
      ctx.fillStyle = '#6f7a85'; ctx.beginPath(); ctx.moveTo(96, PLATE); ctx.lineTo(112, PLATE - 10); ctx.lineTo(536, PLATE - 10); ctx.lineTo(520, PLATE); ctx.closePath(); ctx.fill();
      ctx.fillStyle = g; rr(ctx, 96, PLATE, 424, DESK - PLATE, 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(98, PLATE + 1, 420, 2);
      // 막대
      g = ctx.createLinearGradient(ROD - 7, 0, ROD + 7, 0); g.addColorStop(0, '#9aa4ae'); g.addColorStop(0.4, '#e8edf1'); g.addColorStop(1, '#7d8892');
      ctx.fillStyle = g; ctx.fillRect(ROD - 6.5, 40, 13, PLATE - 44);
      ctx.fillStyle = '#4b545e'; rr(ctx, ROD - 12, PLATE - 16, 24, 10, 3); ctx.fill();
      // 링: 뒤쪽 반
      const RX = 66, RY = 10;
      ctx.strokeStyle = '#59636d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(FX, RING, RX, RY, 0, Math.PI, TAU); ctx.stroke();
      // 비커들 (꼭지 아래 비커는 깔때기 뒤에 있어도 됨)
      const surf = [];
      st.bk.forEach((b, i) => { surf[i] = beaker(ctx, b.x, b.y, b, { hi: st.hiB === i }); });
      // 마개 (책상 위)
      if (st.cap !== 'on') stopper(ctx, st.capP[0], st.capP[1], st.capA);
      // 깔때기
      const P = st.pose, ca = Math.cos(P.a), sa = Math.sin(P.a);
      const toW = (x, y) => [P.x + x * ca - (y - PIV) * sa, P.y + x * sa + (y - PIV) * ca];
      ctx.save(); ctx.globalAlpha = P.al; ctx.translate(P.x, P.y); ctx.rotate(P.a); ctx.translate(0, -PIV);
      funnelGlassBack(ctx);
      if (P.a === 0) {
        E.draw(ctx, { hiIface: o.hiIface });
        // 꼭지 위 짧은 관 속 액체
        if (E.w + E.o > 0.05) { ctx.fillStyle = E.w > 0.05 ? rgba(WATER, 0.7) : rgba(OIL, 0.8); ctx.fillRect(-2.2, CONE - 2, 4.4, COCK - CONE + 2); }
        // 꼭지 아래 관 속
        if (st.flight.length) { const p = st.flight[st.flight.length - 1]; st.stemC = p.w >= p.o ? WATER : OIL; ctx.fillStyle = rgba(st.stemC, 0.85); ctx.fillRect(-2.2, COCK, 4.4, TIP - COCK - 1); }
      } else if (E.w + E.o > 0.05) {
        // 기울인 깔때기: 세계 좌표에서 수평인 겉면
        const Lw = levelFor(E.w, P.a, P.y), Lt = levelFor(E.w + E.o, P.a, P.y);
        ctx.save(); V.path(ctx, MOUTH + 2, CONE); ctx.clip();
        ctx.translate(0, PIV); ctx.rotate(-P.a); ctx.translate(-P.x, -P.y); // 세계 좌표로 돌아가 수평으로 칠함
        if (E.o > 0.05) { ctx.fillStyle = rgba(OIL, 0.8); ctx.fillRect(-2000, Lt, 4000, Math.max(0, Lw - Lt)); }
        if (E.w > 0.05) { ctx.fillStyle = rgba(WATER, 0.72); ctx.fillRect(-2000, Lw, 4000, 2000); }
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-2000, Lt); ctx.lineTo(2000, Lt); ctx.stroke();
        ctx.restore();
      }
      funnelGlassFront(ctx);
      stopcock(ctx, st.tap === 0 ? 0 : st.tap === 1 ? 0.38 : 1);
      if (st.cap === 'on' && P.a === 0) stopper(ctx, 0, MOUTH + 4, 0);
      ctx.restore();
      if (st.cap === 'move') stopper(ctx, st.capP[0], st.capP[1], st.capA);
      // 링: 앞쪽 반 + 팔 + 집게 잡이
      ctx.strokeStyle = '#6b757f'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(FX, RING, RX, RY, 0, 0, Math.PI); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(FX, RING - 1.5, RX, RY, 0, 0.2, Math.PI - 0.2); ctx.stroke();
      g = ctx.createLinearGradient(0, RING - 4, 0, RING + 4); g.addColorStop(0, '#8f99a3'); g.addColorStop(1, '#55606a');
      ctx.fillStyle = g; ctx.fillRect(ROD + 10, RING - 3.5, FX - RX - ROD - 8, 7);
      g = ctx.createLinearGradient(ROD - 16, 0, ROD + 16, 0); g.addColorStop(0, '#2f363d'); g.addColorStop(0.5, '#4d5660'); g.addColorStop(1, '#2a3036');
      ctx.fillStyle = g; rr(ctx, ROD - 15, RING - 15, 30, 30, 5); ctx.fill();
      ctx.fillStyle = '#20262c'; rr(ctx, ROD - 34, RING - 4, 20, 8, 3); ctx.fill(); ctx.beginPath(); ctx.arc(ROD - 38, RING, 8, 0, TAU); ctx.fill();
      // 꼭지에서 흐르는 줄기
      if (P.a === 0 && (st.flight.length || flowing)) {
        const u = underBeaker(), yEnd = u >= 0 ? surf[u] : PLATE - 10;
        const n = st.flight.length, last = st.flight[0];
        const c = last ? (last.w >= last.o ? WATER : OIL) : WATER;
        const wd = flowing ? (st.tap === 2 ? 3.6 : 1.9) : 1.2;
        if (flowing || n > 3) {
          g = ctx.createLinearGradient(0, TIP, 0, yEnd); g.addColorStop(0, rgba(shade(c, 0.95), 0.95)); g.addColorStop(1, rgba(shade(c, 0.88), 0.75));
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(FX - wd, TIP);
          for (let y = TIP; y <= yEnd; y += 6) ctx.lineTo(FX - wd * (1 - (y - TIP) / 400) + Math.sin(y * 0.08 + st.t * 16) * 0.5, y);
          ctx.lineTo(FX + wd * 0.6, yEnd); for (let y = yEnd; y >= TIP; y -= 6) ctx.lineTo(FX + wd * (1 - (y - TIP) / 400) + Math.sin(y * 0.08 + st.t * 16) * 0.5, y);
          ctx.closePath(); ctx.fill();
          if (u >= 0) { ctx.strokeStyle = 'rgba(20,38,59,.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(FX, yEnd + 1, 10 + Math.sin(st.t * 9) * 2, 2.2, 0, 0, TAU); ctx.stroke(); }
        }
      }
      st.drips.forEach((d) => { ctx.fillStyle = rgba(shade(d.c, 0.9), 0.9); ctx.beginPath(); ctx.ellipse(FX, d.y, 2.6, 3.4, 0, 0, TAU); ctx.fill(); });
      // 붓는 비커와 줄기 (혼합물 넣기)
      if (st.pour) {
        const k = clamp(Math.min(st.pour.t / 0.45, (3.2 - st.pour.t) / 0.4), 0, 1), lip = [FX + 10, MOUTH - 22];
        const flowingIn = st.pour.t > 0.45 && st.pour.t < 2.7;
        if (flowingIn) {
          const yEnd = E.top();
          ctx.fillStyle = rgba(mixC(WATER, MILK, 0.6), 0.9);
          ctx.beginPath(); ctx.moveTo(lip[0] - 3, lip[1]); ctx.quadraticCurveTo(lip[0] - 6, lip[1] + 30, FX + 2, MOUTH + 10); ctx.lineTo(FX + 1, yEnd); ctx.lineTo(FX + 7, yEnd); ctx.lineTo(FX + 7, MOUTH + 10); ctx.quadraticCurveTo(lip[0] + 2, lip[1] + 26, lip[0] + 3, lip[1]); ctx.closePath(); ctx.fill();
        }
        ctx.save(); ctx.globalAlpha = k; pourBeaker(ctx, lip, -1.95 + (1 - k) * 0.6, 1 - clamp((st.pour.t - 0.45) / 2.2, 0, 1)); ctx.restore();
      }
      // 입구로 따르는 줄기
      if (st.mpour && st.mpour.phase === 'pour' && (st.mpour.fl || []).length) {
        const m = toW(0, MOUTH), B = st.bk[2], yEnd = surf[2], c = E.w > 0.05 ? WATER : OIL;
        g = ctx.createLinearGradient(0, m[1], 0, yEnd); g.addColorStop(0, rgba(c, 0.95)); g.addColorStop(1, rgba(shade(c, 0.9), 0.8));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(m[0] - 2, m[1]); ctx.quadraticCurveTo(m[0] + 6, m[1] + 10, B.x - 4, yEnd); ctx.lineTo(B.x + 4, yEnd); ctx.quadraticCurveTo(m[0] + 14, m[1] + 8, m[0] + 8, m[1] - 2); ctx.closePath(); ctx.fill();
      }
      // 이름표
      if (st.labels) {
        const lx = 560;
        if (P.a === 0 && P.al > 0.9) {
          lead(ctx, [[lx - 8, MOUTH - 26], [FX + 30, MOUTH - 26]]); ov.put('mk', lx, MOUTH - 26, '마개', 'tx nm ra');
          if (st.cap !== 'on') ov.put('mk', lx, MOUTH - 26, '입구', 'tx nm ra');
          lead(ctx, [[lx - 8, 180], [FX + 88, 180]]); ov.put('fn', lx, 180, '분별 깔때기', 'tx nm ra');
          lead(ctx, [[lx - 8, COCK], [FX + 56, COCK]]); ov.put('ck', lx, COCK, '꼭지' + (st.tap ? ' <span class="u">열림</span>' : ' <span class="u">잠금</span>'), 'tx nm ra');
        } else { ov.hide('mk'); ov.hide('fn'); ov.hide('ck'); }
        lead(ctx, [[ROD - 54, RING + 46], [ROD - 34, RING + 6]]); ov.put('jg', ROD - 58, RING + 50, '집게 잡이', 'tx nm sol la');
        lead(ctx, [[FX - 120, RING + 34], [FX - 60, RING + 6]]); ov.put('rg', FX - 124, RING + 38, '링', 'tx nm sol la');
        ov.put('sd', ROD - 18, 520, '스탠드', 'tx nm sol la');
        // 층 이름
        if (P.a === 0 && !E.mixed() && E.w + E.o > 1 && P.al > 0.9) {
          const top = E.top(), yi = E.iface();
          if (yi - top > 16) ov.put('up', FX, (top + yi) / 2, '위층', 'tx lay'); else ov.hide('up');
          if (E.w > 1.2 && CONE - yi > 40) ov.put('dn', FX, yi + Math.min(34, (CONE - yi) * 0.4), '아래층', 'tx lay'); else ov.hide('dn');
          if (E.w > 0.05 && E.o > 0.05 && yi - top > 1 && yi < 425) { const ex = FX + hwIn(yi); lead(ctx, [[FX + 150, yi - 14], [ex + 2, yi]]); ov.put('if', FX + 156, yi - 14, '경계면', 'tx band ra'); } else ov.hide('if');
        } else { ov.hide('up'); ov.hide('dn'); ov.hide('if'); }
        st.bk.forEach((b, i) => ov.put('b' + i, b.x, b.y + 20, '비커 ' + (i + 1), 'tx sc'));
      }
    });
    return { st, E, fill, cap, wait, setTap, swap, pourTop, jump, reset, RATE,
      get mixed() { return E.mixed(); }, get busy() { return !!st.pour || st.moving || TW.busy || !!st.mpour || st.flight.length > 0; },
      get left() { return { w: E.w, o: E.o }; }, get under() { return st.under; },
      hi(i) { st.hiB = i; },
      ifaceAt() { const yi = E.iface(); return clamp((CONE - yi) / (CONE - 300), 0, 1); } };
  }

  /* =================================================================
     3. 키질 (그림 Ⅰ-11)
     ================================================================= */
  function winnow(host, o = {}) {
    const W = 1000, H = 600, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx;
    const GY = 548, KX = 400, KY = 390, TILT = -0.06, PY = 0.46;
    // 키를 비스듬히 내려다본 모습. u: 길이 방향(왼쪽이 뒤), v: 폭 방향(−가 먼 쪽). 화면 y = v × PY
    const hwK = (u) => (u < -120 ? Math.sqrt(Math.max(0, 110 * 110 - (u + 120) * (u + 120))) : 110 + (u + 120) * 0.05);
    const wallH = (u) => (u < -120 ? 62 : lerp(62, 8, (u + 120) / 320));
    const U0 = -230, U1 = 200;
    const st = { t: 0, wind: o.wind !== false, flick: 0, ky: 0, ka: TILT, parts: [], toss: 0, gusts: [] };
    const KIND = { grain: { c: 0.25, n: 70 }, chaff: { c: 6.5, n: 22 }, dust: { c: 10, n: 34 } };
    function inside(u, v, m = 8) { return u > U0 + m && u < U1 - 4 && Math.abs(v) < hwK(u) - m; }
    function seed() {
      st.parts = []; const r = rng(7);
      Object.keys(KIND).forEach((k) => { for (let i = 0; i < KIND[k].n; i++) {
        let u, v; do { u = -200 + r() * 360; v = (r() * 2 - 1) * 100; } while (!inside(u, v, 14));
        st.parts.push({ k, s: 'bed', u, v, z: r() * 4, a: r() * TAU, va: 0, x: 0, y: 0, vx: 0, vy: 0, len: 14 + r() * 12, sz: k === 'grain' ? 4 + r() * 1.2 : 1.4 + r() * 1.2, sh: r() });
      } });
    }
    seed();
    const toW = (lx, ly) => { const c = Math.cos(st.ka), s = Math.sin(st.ka); return [KX + lx * c - ly * s, KY + st.ky + lx * s + ly * c]; };
    const toL = (x, y) => { const c = Math.cos(-st.ka), s = Math.sin(-st.ka), dx = x - KX, dy = y - KY - st.ky; return [dx * c - dy * s, dx * s + dy * c]; };
    function toss() {
      if (st.flick > 0) return; st.flick = 0.42; st.toss++;
      setTimeout(() => {
        const r = Math.random;
        st.parts.forEach((p) => {
          if (p.s !== 'bed') return;
          const [x, y] = toW(p.u, p.v * PY - p.z); p.x = x; p.y = y; p.s = 'air'; p.y0 = y;
          p.vx = (r() - 0.5) * 50 - p.u * 0.1; p.vy = -(560 + r() * 200); p.va = (r() - 0.5) * (p.k === 'grain' ? 6 : 14);
        });
      }, reduce ? 0 : 120);
    }
    function setWind(on) { st.wind = on; }
    function reset() { seed(); st.flick = 0; st.ky = 0; st.ka = TILT; st.toss = 0; }
    const count = () => { const c = { grain: 0, chaff: 0, dust: 0, gone: 0, air: 0 }; st.parts.forEach((p) => { if (p.s === 'bed') c[p.k]++; else if (p.s === 'air') c.air++; else if (p.k !== 'grain') c.gone++; }); return c; };
    function edge(side) { const pts = []; for (let u = U0; u <= U1; u += 5) pts.push([u, side * hwK(u) * PY]); return pts; }
    function weave(clipFn, base0, base1, y0, y1) {
      ctx.save(); clipFn(); ctx.clip();
      const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, base0); g.addColorStop(1, base1);
      ctx.fillStyle = g; ctx.fillRect(-260, -120, 520, 200);
      ctx.strokeStyle = 'rgba(92,62,30,.2)'; ctx.lineWidth = 1;
      for (let x = -300; x < 260; x += 8) { ctx.beginPath(); ctx.moveTo(x, -120); ctx.lineTo(x + 60, 80); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,240,210,.18)';
      for (let x = -300; x < 320; x += 8) { ctx.beginPath(); ctx.moveTo(x + 60, -120); ctx.lineTo(x, 80); ctx.stroke(); }
      ctx.restore();
    }
    function drawKiBack() {
      ctx.save(); ctx.translate(KX, KY + st.ky); ctx.rotate(st.ka);
      const far = edge(-1), near = edge(1);
      // 먼 쪽 벽 안쪽 면
      const farWall = () => { ctx.beginPath(); far.forEach(([u, y], i) => (i ? ctx.lineTo(u, y - wallH(u)) : ctx.moveTo(u, y - wallH(u)))); for (let i = far.length - 1; i >= 0; i--) ctx.lineTo(far[i][0], far[i][1]); ctx.closePath(); };
      weave(farWall, '#c09b63', '#a98250', -100, -20);
      // 바닥
      const floor = () => { ctx.beginPath(); far.forEach(([u, y], i) => (i ? ctx.lineTo(u, y) : ctx.moveTo(u, y))); for (let i = near.length - 1; i >= 0; i--) ctx.lineTo(near[i][0], near[i][1]); ctx.closePath(); };
      weave(floor, '#d7b682', '#c39d66', -40, 40);
      // 바닥 그늘(먼 벽 아래)
      ctx.save(); floor(); ctx.clip(); const g = ctx.createLinearGradient(0, -44, 0, -10); g.addColorStop(0, 'rgba(90,60,25,.25)'); g.addColorStop(1, 'rgba(90,60,25,0)'); ctx.fillStyle = g; ctx.fillRect(-260, -60, 520, 60); ctx.restore();
      // 먼 쪽 테(대나무)
      ctx.strokeStyle = '#8c6337'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); far.forEach(([u, y], i) => (i ? ctx.lineTo(u, y - wallH(u)) : ctx.moveTo(u, y - wallH(u)))); ctx.stroke();
      ctx.restore();
    }
    function drawKiFront() {
      ctx.save(); ctx.translate(KX, KY + st.ky); ctx.rotate(st.ka);
      const near = edge(1);
      // 가까운 쪽 벽 바깥 면 (바닥 가장자리에서 위로)
      const nearWall = () => { ctx.beginPath(); near.forEach(([u, y], i) => (i ? ctx.lineTo(u, y - wallH(u) * 0.55) : ctx.moveTo(u, y - wallH(u) * 0.55))); for (let i = near.length - 1; i >= 0; i--) ctx.lineTo(near[i][0], near[i][1] + 6); ctx.closePath(); };
      weave(nearWall, '#b48855', '#8f6538', 0, 50);
      ctx.strokeStyle = '#8c6337'; ctx.lineWidth = 5.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); near.forEach(([u, y], i) => (i ? ctx.lineTo(u, y - wallH(u) * 0.55) : ctx.moveTo(u, y - wallH(u) * 0.55))); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,235,200,.35)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); near.forEach(([u, y], i) => (i ? ctx.lineTo(u, y - wallH(u) * 0.55 - 1.5) : ctx.moveTo(u, y - wallH(u) * 0.55 - 1.5))); ctx.stroke();
      // 앞 날(트인 쪽)
      ctx.strokeStyle = 'rgba(110,78,40,.7)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(U1, -hwK(U1) * PY - wallH(U1)); ctx.lineTo(U1 + 2, hwK(U1) * PY); ctx.stroke();
      ctx.restore();
    }
    function drawPart(p, x, y) {
      if (p.k === 'grain') {
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.a);
        const g = ctx.createRadialGradient(-1.4, -1.4, 0.5, 0, 0, p.sz * 1.4); g.addColorStop(0, '#f3dc9b'); g.addColorStop(0.7, '#d6ae5c'); g.addColorStop(1, '#b38940');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, p.sz * 1.35, p.sz * 0.8, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(120,85,30,.45)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-p.sz, 0); ctx.lineTo(p.sz, 0); ctx.stroke();
        ctx.restore();
      } else if (p.k === 'chaff') {
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.a);
        ctx.strokeStyle = p.sh < 0.5 ? 'rgba(150,128,88,.95)' : 'rgba(128,108,72,.95)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-p.len / 2, 0); ctx.quadraticCurveTo(0, -4 - p.sh * 3, p.len / 2, 1); ctx.stroke();
        ctx.strokeStyle = 'rgba(225,205,165,.8)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-p.len / 2 + 2, -0.8); ctx.quadraticCurveTo(0, -4.5 - p.sh * 3, p.len / 2 - 2, 0); ctx.stroke();
        ctx.restore();
      } else {
        ctx.fillStyle = p.sh < 0.5 ? 'rgba(100,90,76,.8)' : 'rgba(140,126,106,.8)'; ctx.beginPath(); ctx.arc(x, y, p.sz, 0, TAU); ctx.fill();
      }
    }
    addLoop(host, (dt) => {
      st.t += dt;
      if (st.flick > 0) { st.flick = Math.max(0, st.flick - dt); const k = 1 - st.flick / 0.42, b = Math.sin(k * Math.PI); st.ky = -42 * b; st.ka = TILT - 0.14 * b; } else { st.ky = 0; st.ka = TILT; }
      const wind = st.wind ? 330 : 0;
      st.parts.forEach((p) => {
        if (p.s !== 'air') return;
        const c = KIND[p.k].c, gust = st.wind ? Math.sin(st.t * 3 + p.sh * 6) * 40 : 0;
        p.vx += c * (wind + gust - p.vx) * dt;
        p.vy += (1500 - c * p.vy * 1.2) * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt;
        if (p.vy > 0) {
          const [lu, ly] = toL(p.x, p.y), floorY = p.v * PY - p.z;
          if (ly >= floorY && ly < floorY + 40 && inside(lu, p.v, 6)) { p.s = 'bed'; p.u = lu; p.va = 0; return; }
        }
        const gy = GY - 6 + p.v * 0.12;
        if (p.y >= gy) { p.y = gy - (p.k === 'grain' ? p.sz * 0.6 : 1) ; p.s = 'ground'; }
        if (p.x > W + 40) { p.s = 'ground'; p.y = GY - 2; p.x = W + 60; }
      });
      if (st.wind && !reduce && Math.random() < dt * 5) st.gusts.push({ x: -80, y: 110 + Math.random() * 300, t: 0, L: 120 + Math.random() * 120 });
      st.gusts = st.gusts.filter((gl) => { gl.t += dt; gl.x += 520 * dt; return gl.x < W + 200; });

      S.begin(); white(S);
      let g = ctx.createLinearGradient(0, GY, 0, H); g.addColorStop(0, '#eceae4'); g.addColorStop(1, '#f7f6f2');
      const [fx, , fw, fh] = S.full(); ctx.fillStyle = g; ctx.fillRect(fx, GY, fw, fh); ctx.fillStyle = '#dcd8cf'; ctx.fillRect(fx, GY, fw, 1.2);
      contact(ctx, KX - 10, GY + 4, 500 - st.ky * 2, 0.13);
      st.gusts.forEach((gl) => { const a = 0.22 * Math.sin(Math.min(1, gl.t * 2) * Math.PI / 2); ctx.strokeStyle = `rgba(14,99,179,${a})`; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(gl.x, gl.y); ctx.bezierCurveTo(gl.x + gl.L * 0.3, gl.y - 8, gl.x + gl.L * 0.6, gl.y + 8, gl.x + gl.L, gl.y); ctx.stroke(); });
      st.parts.forEach((p) => { if (p.s === 'ground') drawPart(p, p.x, p.y); });
      drawKiBack();
      st.parts.filter((p) => p.s === 'bed').sort((a, b) => a.v - b.v).forEach((p) => { const [x, y] = toW(p.u, p.v * PY - p.z); drawPart(p, x, y); });
      drawKiFront();
      st.parts.forEach((p) => { if (p.s === 'air') drawPart(p, p.x, p.y); });
      const c = count();
      ov.put('ki', KX - 270, KY - 70, '키', 'tx nm');
      if (st.wind) ov.put('wd', 70, 80, '바람 →', 'tx band'); else ov.hide('wd');
      if (c.gone > 4) ov.put('gn', 840, GY + 28, '날아간 검불·티', 'tx nm sol'); else ov.hide('gn');
    });
    return { toss, setWind, reset, count, st };
  }

  /* =================================================================
     4. 바다에 유출된 기름과 기름막이 (그림 Ⅰ-11)
     ================================================================= */
  function boom(host, o = {}) {
    const W = 1000, H = 620, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx;
    const C = [480, 300], BRX = 190, BRY = 140;
    const st = { t: 0, spill: 0, R: 0, cap: 70, boomK: 0, boom: false, sect: o.section !== false, ph: [], waves: [] };
    const r = rng(11); for (let i = 0; i < 5; i++) st.ph.push(i < 2 ? [r() * TAU, 2 + i, 0.05 + r() * 0.03] : [r() * TAU, 5 + Math.floor(r() * 4), 0.012 + r() * 0.012]);
    for (let i = 0; i < 70; i++) st.waves.push([r() * W, r() * H, 10 + r() * 16, r()]);
    const RMAX = 440;
    function spill() { if (st.spill) return; st.spill = 1; st.R = 18; st.cap = 70; }
    function go(on) { st.boom = on; st.cap = RMAX; } // 기름막이를 칠지 정하면 계속 퍼짐
    function reset() { st.spill = 0; st.R = 0; st.cap = 70; st.boomK = 0; st.boom = false; }
    function show(s) { st.sect = s; }
    const ellR = (a) => 1 / Math.sqrt(Math.pow(1.08 * Math.cos(a) / BRX, 2) + Math.pow(0.82 * Math.sin(a) / BRY, 2));
    function slickR(a) {
      let n = 1; st.ph.forEach(([p, f, amp]) => (n += amp * Math.sin(f * a + p + st.t * 0.15)));
      let R = st.R * n;
      if (st.boomK >= 1) R = Math.min(R, ellR(a) - 12 - 3 * Math.sin(a * 5 + st.t));
      return R;
    }
    function ship(x, y, a, L, Wd) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = 'rgba(20,38,59,.12)'; ctx.beginPath(); ctx.ellipse(4, 6, L / 2 + 4, Wd / 2 + 3, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-L / 2, -Wd / 2); ctx.lineTo(L / 2 - Wd * 0.7, -Wd / 2); ctx.quadraticCurveTo(L / 2 + Wd * 0.2, 0, L / 2 - Wd * 0.7, Wd / 2); ctx.lineTo(-L / 2, Wd / 2); ctx.closePath();
      let g = ctx.createLinearGradient(0, -Wd / 2, 0, Wd / 2); g.addColorStop(0, '#6c7a87'); g.addColorStop(1, '#4b5864'); ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = '#8796a3'; rr(ctx, -L / 2 + 6, -Wd / 2 + 6, L - Wd * 0.9 - 6, Wd - 12, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(40,52,64,.35)'; ctx.lineWidth = 1; for (let i = 1; i < 6; i++) { const xx = -L / 2 + 30 + i * (L - 70) / 6; ctx.beginPath(); ctx.moveTo(xx, -Wd / 2 + 8); ctx.lineTo(xx, Wd / 2 - 8); ctx.stroke(); }
      ctx.fillStyle = '#eef2f5'; rr(ctx, -L / 2 + 2, -Wd / 2 + 4, 24, Wd - 8, 3); ctx.fill();
      ctx.restore();
    }
    function boat(x, y, a) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = 'rgba(20,38,59,.12)'; ctx.beginPath(); ctx.ellipse(3, 4, 22, 9, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-20, -8); ctx.lineTo(10, -8); ctx.quadraticCurveTo(24, 0, 10, 8); ctx.lineTo(-20, 8); ctx.closePath();
      ctx.fillStyle = '#f4f6f8'; ctx.fill(); ctx.strokeStyle = 'rgba(40,52,64,.5)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#5a6b7e'; rr(ctx, -12, -5, 12, 10, 2); ctx.fill();
      ctx.restore();
    }
    function boomPath(a0, a1) { // a0에서 a1까지 타원 둘레 (일정한 칸 수로 그려 끝없는 반복이 없게)
      ctx.beginPath(); const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / 0.04));
      for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, x = C[0] + BRX * Math.cos(a), y = C[1] + BRY * Math.sin(a); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    }
    function drawBoom(k) {
      const span = Math.PI * k;
      [1, -1].forEach((d) => {
        boomPath(0, d * span);
        ctx.strokeStyle = 'rgba(20,38,59,.18)'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.stroke();
        ctx.strokeStyle = '#d9a441'; ctx.lineWidth = 6; ctx.stroke();
        ctx.setLineDash([2, 9]); ctx.strokeStyle = 'rgba(90,60,10,.55)'; ctx.lineWidth = 6; ctx.stroke(); ctx.setLineDash([]);
      });
      if (k < 1) [1, -1].forEach((d) => { const a = d * span, x = C[0] + BRX * Math.cos(a), y = C[1] + BRY * Math.sin(a), ta = Math.atan2(BRY * Math.cos(a) * d, -BRX * Math.sin(a) * d); boat(x + 18 * Math.cos(ta), y + 18 * Math.sin(ta), ta); });
    }
    function section(x0, y0, w, h) {
      // 옆에서 자른 모습: 바닷물 위에 뜬 기름층, 물속으로 조금 잠긴 기름막이
      ctx.save(); rr(ctx, x0, y0, w, h, 14); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#dde6ee'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.clip();
      const sy = y0 + 92, bx = x0 + w * 0.62;
      let g = ctx.createLinearGradient(0, sy, 0, y0 + h); g.addColorStop(0, '#bcd6ec'); g.addColorStop(1, '#8fb6d9');
      ctx.fillStyle = g; ctx.fillRect(x0, sy, w, h);
      const ok = st.spill > 0, held = st.boomK >= 1;
      if (ok) {
        const ex = held ? bx - 8 : x0 + w;
        g = ctx.createLinearGradient(0, sy - 7, 0, sy + 6); g.addColorStop(0, '#4a4036'); g.addColorStop(1, '#2c261f');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, sy - 6); ctx.lineTo(ex - 12, sy - 6); ctx.quadraticCurveTo(ex, sy - 5, ex, sy); ctx.lineTo(ex, sy + 5); ctx.lineTo(x0, sy + 5); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ok ? (held ? bx - 8 : x0 + w) : x0, sy); ctx.lineTo(x0 + w, sy); ctx.stroke();
      if (held) {
        g = ctx.createLinearGradient(bx - 12, 0, bx + 12, 0); g.addColorStop(0, '#c8902f'); g.addColorStop(0.5, '#e6b85a'); g.addColorStop(1, '#b77f22');
        ctx.fillStyle = '#b98227'; ctx.fillRect(bx - 2.5, sy, 5, 44);
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(bx, sy - 2, 13, 11, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(90,60,10,.45)'; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.restore();
      ov.put('sct', x0 + 16, y0 + 24, '옆에서 자른 모습', 'tx grp');
      if (ok) { lead(ctx, [[x0 + 92, sy - 30], [x0 + 92, sy - 4]]); ov.put('soil', x0 + 100, sy - 32, '기름', 'tx nm ra'); } else ov.hide('soil');
      ov.put('ssea', x0 + 24, sy + 52, '바닷물', 'tx nm ra');
      if (held) ov.put('sbm', bx + 20, sy - 30, '기름막이', 'tx nm ra'); else ov.hide('sbm');
    }
    addLoop(host, (dt) => {
      st.t += dt;
      if (st.spill) {
        const target = Math.min(st.cap, st.boomK >= 1 ? 200 : RMAX), sp = st.boomK >= 1 ? 36 : 60 * Math.max(0.3, 1 - st.R / RMAX);
        st.R = Math.min(target, st.R + sp * dt * (reduce ? 20 : 1));
      }
      if (st.boom && st.boomK < 1) st.boomK = Math.min(1, st.boomK + dt / (reduce ? 0.01 : 2.6));
      if (!st.boom) st.boomK = 0;
      S.begin();
      const [fx, fy, fw, fh] = S.full();
      let g = ctx.createLinearGradient(0, fy, 0, fy + fh); g.addColorStop(0, '#d4e5f3'); g.addColorStop(1, '#bcd5ea');
      ctx.fillStyle = g; ctx.fillRect(fx, fy, fw, fh);
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
      st.waves.forEach(([x, y, L, p]) => { const xx = (x + st.t * 8 * (0.5 + p)) % (W + 40) - 20; ctx.beginPath(); ctx.moveTo(xx, y); ctx.quadraticCurveTo(xx + L / 2, y - 3, xx + L, y); ctx.stroke(); });
      if (st.spill) {
        // 기름띠
        ctx.save(); ctx.beginPath();
        for (let i = 0; i <= 96; i++) { const a = i / 96 * TAU, R = slickR(a), x = C[0] + R * Math.cos(a) * 1.08, y = C[1] + R * Math.sin(a) * 0.82; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.closePath();
        const thick = st.boomK >= 1 ? 0.86 : clamp(0.82 - st.R / 1400, 0.45, 0.82);
        g = ctx.createRadialGradient(C[0], C[1], 10, C[0], C[1], Math.max(30, st.R));
        g.addColorStop(0, `rgba(36,31,26,${thick})`); g.addColorStop(1, `rgba(58,50,40,${thick * 0.75})`);
        ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(120,104,80,.35)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }
      ship(150, 120, 0.36, 230, 50);
      if (st.boom) drawBoom(st.boomK);
      if (st.sect) section(656, 416, 326, 184); else { ['sct', 'soil', 'ssea', 'sbm'].forEach((k) => ov.hide(k)); }
      if (st.spill && st.R > 40) ov.put('oil', C[0], C[1], '유출된 기름', 'tx nm' + (st.R > 80 ? ' inv' : '')); else ov.hide('oil');
      if (st.boomK >= 1) ov.put('bm', C[0] + BRX + 14, C[1] - 40, '기름막이', 'tx nm ra'); else ov.hide('bm');
    });
    return { spill, go, reset, show, st, get spread() { return st.R / RMAX; }, get settled() { return st.R >= Math.min(st.cap, st.boomK >= 1 ? 200 : RMAX) * 0.97 && (!st.boom || st.boomK >= 1); } };
  }

  return { bottle, funnel, winnow, boom, WATER, OIL };
})();
