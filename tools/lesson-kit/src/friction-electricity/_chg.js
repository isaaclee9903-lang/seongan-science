/* ===== 마찰 전기 그림 도구 (캔버스 2D) =====
   CHG.atom(host)           원자의 구조(그림 Ⅶ-1 형식): 원자핵 +6, 전자 6개
   CHG.rub(host, 옵션)       털과 풍선(그림 Ⅶ-2 형식): 끌어서 문지르기, 전자 이동, 떼어 놓으면 털이 풍선 쪽으로 끌림
   CHG.spoon(host, 옵션)     숟가락 실험실(해 보기): 장갑으로 문지르기, ㉯ 숟가락·장갑을 ㉮ 손잡이 끝에 가까이
   CHG.pend(host)           매단 두 공: 같은 종류 전하는 밀고(척력), 다른 종류는 당김(인력)
   그림 원칙: 흰 바탕, 라스 파랑 한 색조 + 무채색, 매트한 질감, 얇은 선. 그림 속 글씨는 HTML 이름표.
   (−)전하(전자)는 파란 동그라미에 '−', (+)전하는 짙은 회색 테두리 동그라미에 '+'.
   힘의 크기와 거리의 관계는 화면에 쓰지 않는다(개념 이해를 위한 모형). */
window.CHG = (() => {
  const TAU = Math.PI * 2;
  const BLUE = '#0e63b3', INK = '#14263b', INK2 = '#3d4f63';
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

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
      box,
      put(id, x, y, html, cls = '') {
        let e = map[id]; if (!e) { e = document.createElement('span'); box.appendChild(e); map[id] = e; }
        const c = 'ol ' + cls; if (e.className !== c) e.className = c;
        if (e._h !== html) { e.innerHTML = html; e._h = html; }
        e.dataset.id = id; e.style.left = (x / S.W * 100).toFixed(2) + '%'; e.style.top = (y / S.H * 100).toFixed(2) + '%'; e.hidden = false; return e;
      },
      hide(id) { if (map[id]) map[id].hidden = true; },
    };
  }
  const loops = new Set();
  let last = 0;
  function tick(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0); last = now;
    loops.forEach((L) => { try { if (L.host.offsetParent !== null) { const r = L.host.getBoundingClientRect(); if (r.bottom > -50 && r.top < innerHeight + 50) L.fn(dt); } } catch (e) { loops.delete(L); (window.SM_err || window.RD_err || console.error)('마찰 전기 그림', e); } });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  const addLoop = (host, fn) => { const L = { host, fn }; loops.add(L); return L; };
  // 짧은 움직임(트윈) 묶음
  function tweens() {
    let list = [];
    return {
      add(dur, fn, done) { const t = { dur: Math.max(0.001, dur), t: 0, fn, done }; list.push(t); return t; },
      step(dt) { const cur = list; list = []; cur.forEach((t) => { t.t += dt; const k = Math.min(1, t.t / t.dur); t.fn(k); if (k < 1) list.push(t); else if (t.done) t.done(); }); },
      clear() { list = []; },
      get busy() { return list.length > 0; },
    };
  }

  /* ---- 전하 표시 ---- */
  function plus(ctx, x, y, r = 11, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK2; ctx.lineWidth = Math.max(1.3, r * 0.14);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.lineWidth = Math.max(1.6, r * 0.2); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - r * 0.48, y); ctx.lineTo(x + r * 0.48, y); ctx.moveTo(x, y - r * 0.48); ctx.lineTo(x, y + r * 0.48); ctx.stroke();
    ctx.restore();
  }
  function minus(ctx, x, y, r = 11, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, '#3d8ad4'); g.addColorStop(1, BLUE);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.6, r * 0.2); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - r * 0.48, y); ctx.lineTo(x + r * 0.48, y); ctx.stroke();
    ctx.restore();
  }
  function arrow(ctx, x1, y1, x2, y2, col, w = 1.8, head = 7) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.moveTo(x2 - Math.cos(a - 0.5) * head, y2 - Math.sin(a - 0.5) * head); ctx.lineTo(x2, y2); ctx.lineTo(x2 - Math.cos(a + 0.5) * head, y2 - Math.sin(a + 0.5) * head);
    ctx.stroke(); ctx.restore();
  }
  // 간단한 난수(그림이 매번 같게)
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  /* =================================================================
     1. 원자의 구조 (그림 Ⅶ-1)
     ================================================================= */
  function atom(host, o = {}) {
    const W = 600, H = 600, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx;
    const cx = 300, cy = 300, R = 262;
    const E = [0, 1, 2, 3, 4, 5].map((i) => ({ a: i * TAU / 6 + 0.4, rx: 120 + (i % 3) * 45, ry: 62 + ((i + 1) % 3) * 30, tilt: i * 0.52 + 0.2, sp: (0.32 + 0.06 * (i % 3)) * (i % 2 ? 1 : -1) }));
    const st = { t: 0, run: !reduce, count: !!o.count };
    function pos(e) { const x = Math.cos(e.a) * e.rx, y = Math.sin(e.a) * e.ry, c = Math.cos(e.tilt), s = Math.sin(e.tilt); return [cx + x * c - y * s, cy + x * s + y * c]; }
    ov.put('nuc', cx, cy, '+6', 'nuc');
    addLoop(host, (dt) => {
      if (st.run) { st.t += dt; E.forEach((e) => (e.a += e.sp * dt)); }
      S.begin();
      const [fx, fy, fw, fh] = S.full(); ctx.fillStyle = '#fff'; ctx.fillRect(fx, fy, fw, fh);
      const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, R);
      g.addColorStop(0, '#f7fafd'); g.addColorStop(0.75, '#edf3f9'); g.addColorStop(1, '#e1eaf3');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(20,38,59,.08)'; ctx.lineWidth = 1.2; ctx.stroke();
      // 전자가 다니는 길(아주 옅게)
      ctx.strokeStyle = 'rgba(14,99,179,.10)'; ctx.lineWidth = 1;
      E.forEach((e) => { ctx.save(); ctx.translate(cx, cy); ctx.rotate(e.tilt); ctx.beginPath(); ctx.ellipse(0, 0, e.rx, e.ry, 0, 0, TAU); ctx.stroke(); ctx.restore(); });
      // 원자핵
      const ng = ctx.createRadialGradient(cx - 12, cy - 14, 4, cx, cy, 40);
      ng.addColorStop(0, '#4a5d73'); ng.addColorStop(1, INK);
      ctx.save(); ctx.shadowColor = 'rgba(20,38,59,.25)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
      ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(cx, cy, 38, 0, TAU); ctx.fill(); ctx.restore();
      // 전자
      E.forEach((e, i) => { const [x, y] = pos(e); minus(ctx, x, y, 16); if (i === 0) ov.put('el', x + 34, y - 24, '전자', 'tx m'); });
      ov.put('nl', cx, cy + 62, '원자핵', 'tx m');
    });
    return { st, set(v) { Object.assign(st, v); } };
  }

  /* =================================================================
     2. 털과 풍선 (그림 Ⅶ-2)
     ================================================================= */
  function rub(host, o = {}) {
    const W = 1000, H = o.H || 600, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx;
    const FY = H - 128, FX0 = 190, FX1 = 810, R = 122;
    const REST = FY - R + 8, UP = FY - 282, XL = 320, XR = 680, MAXE = 3, STEP = 230;
    const TW = tweens();
    const rnd = rng(7);
    const fibers = [];
    for (let i = 0; i < 190; i++) {
      const x = FX0 + 8 + rnd() * (FX1 - FX0 - 16);
      fibers.push({ x, y: FY + 2 + rnd() * 7, len: 20 + rnd() * 16, base: -Math.PI / 2 + (rnd() - 0.5) * 0.7, ang: 0, ph: rnd() * TAU,
        col: ['#5a7694', '#6a86a3', '#7c95b0', '#526e8c', '#8aa1b9'][Math.floor(rnd() * 5)] });
    }
    fibers.forEach((f) => (f.ang = f.base)); fibers.sort((a, b) => a.y - b.y);
    // 털의 전하: 처음에 (+) 4개, (−) 4개
    const FT = [];
    for (let i = 0; i < 8; i++) FT.push({ kind: i % 2 ? 'm' : 'p', x: 296 + i * 58, y: FY + 32 });
    // 풍선의 전하(풍선 중심 기준): (−) 3개 위, (+) 3개 아래, 옮겨 온 전자는 맨 아래
    const BT = [[-50, 40, 'm'], [0, 44, 'm'], [50, 40, 'm'], [-50, 74, 'p'], [0, 78, 'p'], [50, 74, 'p']];
    const SLOT = [[-40, 104], [40, 104], [0, 108]];
    const st = { bx: 500, by: UP, tx: 500, ty: UP, vx: 0, path: 0, moved: 0, arrived: 0, drag: null, t: 0, charges: true, flying: [], squash: 0, mode: 'idle', demo: !!o.demo };
    const fire = () => { if (o.onChange) o.onChange(state()); };
    function state() {
      return { fur: { p: 4, m: 4 - st.arrived }, bal: { p: 3, m: 3 + st.arrived }, moved: st.arrived, contact: st.by >= REST - 3, lifted: st.by < REST - 40, phase: phase() };
    }
    function phase() { if (st.arrived === 0 && st.by < REST - 3 && !st.path) return 'before'; if (st.by >= REST - 3) return 'rub'; return st.arrived ? 'after' : 'before'; }
    function transfer() {
      if (st.moved >= MAXE) return;
      const cand = FT.filter((t) => t.kind === 'm' && !t.gone).sort((a, b) => Math.abs(a.x - st.bx) - Math.abs(b.x - st.bx))[0];
      if (!cand) return;
      cand.gone = true; const slot = SLOT[st.moved]; st.moved++;
      const e = { x0: cand.x, y0: cand.y, slot, k: 0 }; st.flying.push(e);
      TW.add(reduce ? 0.05 : 0.75, (k) => (e.k = ease(k)), () => { e.done = true; st.arrived++; fire(); });
    }
    // 조작: 풍선을 끌어 문지르기
    S.cv.addEventListener('pointerdown', (ev) => {
      const [x, y] = S.toLocal(ev);
      if (Math.hypot(x - st.bx, y - st.by) > R + 18) return;
      st.drag = { dx: x - st.bx, dy: y - st.by }; st.mode = 'drag'; st.demo = false; TW.clear(); S.cv.setPointerCapture(ev.pointerId); ev.preventDefault();
      if (o.onUser) o.onUser();
    });
    S.cv.addEventListener('pointermove', (ev) => { if (!st.drag) return; const [x, y] = S.toLocal(ev); st.tx = clamp(x - st.drag.dx, XL, XR); st.ty = clamp(y - st.drag.dy, UP - 20, REST); });
    const up = () => { if (st.drag) { st.drag = null; st.mode = 'idle'; fire(); } };
    S.cv.addEventListener('pointerup', up); S.cv.addEventListener('pointercancel', up);
    S.cv.style.cursor = 'grab';

    function moveTo(x, y, dur, done) { const x0 = st.tx, y0 = st.ty; TW.add(dur, (k) => { const e = ease(k); st.tx = lerp(x0, x, e); st.ty = lerp(y0, y, e); }, done); }
    const api = {
      st,
      rubAuto(done) {
        if (st.drag) return; TW.clear(); st.mode = 'auto';
        const go = () => {
          const x0 = st.tx; let tt = 0;
          TW.add(reduce ? 0.3 : 3.4, (k) => { tt = k; st.tx = 500 + Math.sin(k * TAU * 2) * 150 * Math.min(1, k * 6, (1 - k) * 6) + (x0 - 500) * (1 - Math.min(1, k * 4)); }, () => {
            while (!reduce && st.moved < MAXE && st.path >= STEP * (st.moved + 1) - 1) transfer();
            if (reduce) { while (st.moved < MAXE) transfer(); }
            st.mode = 'idle'; fire(); if (done) done();
          });
        };
        if (st.ty < REST - 2) moveTo(st.tx, REST, 0.6, go); else go();
      },
      lift(done) { if (st.drag) return; TW.clear(); st.mode = 'auto'; moveTo(500, UP, reduce ? 0.2 : 1.0, () => { st.mode = 'idle'; fire(); if (done) done(); }); },
      reset() {
        TW.clear(); st.bx = st.tx = 500; st.by = st.ty = UP; st.path = 0; st.moved = 0; st.arrived = 0; st.flying = []; st.mode = 'idle';
        FT.forEach((t) => (t.gone = false)); fibers.forEach((f) => (f.ang = f.base)); fire();
      },
      set(v) { Object.assign(st, v); },
      state,
      fast() { // 검사용: 바로 문지른 뒤 떼어 놓은 상태
        TW.clear(); while (st.moved < MAXE) { transfer(); } TW.step(5); st.path = STEP * MAXE; st.bx = st.tx = 500; st.by = st.ty = UP; fire();
      },
    };
    // 첫 화면 시연(되풀이)
    let demoT = 0, demoStep = 0;
    function demo(dt) {
      if (!st.demo) return; demoT += dt;
      if (demoStep === 0 && demoT > 0.8) { demoStep = 1; api.rubAuto(() => { demoStep = 2; demoT = 0; }); }
      if (demoStep === 2 && demoT > 0.5) { demoStep = 3; api.lift(() => { demoStep = 4; demoT = 0; }); }
      if (demoStep === 4 && demoT > 4.5) { demoStep = 0; demoT = 0; api.reset(); }
    }

    function drawFur() {
      // 그림자
      ctx.save(); ctx.fillStyle = 'rgba(20,38,59,.10)'; ctx.beginPath(); ctx.ellipse(500, FY + 66, (FX1 - FX0) / 2 + 10, 12, 0, 0, TAU); ctx.fill(); ctx.restore();
      // 털 바탕(두께)
      const g = ctx.createLinearGradient(0, FY, 0, FY + 60);
      g.addColorStop(0, '#7590ac'); g.addColorStop(0.5, '#5f7b98'); g.addColorStop(1, '#4b6582');
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(FX0, FY, FX1 - FX0, 60, [14, 14, 18, 18]); ctx.fill();
      // 바탕 결
      ctx.save(); ctx.beginPath(); ctx.roundRect(FX0, FY, FX1 - FX0, 60, [14, 14, 18, 18]); ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = 1.2;
      for (let x = FX0 - 20; x < FX1 + 20; x += 9) { ctx.beginPath(); ctx.moveTo(x, FY + 60); ctx.quadraticCurveTo(x + 6, FY + 30, x + 2, FY + 2); ctx.stroke(); }
      ctx.restore();
    }
    function drawFibers(pass) {
      ctx.lineCap = 'round';
      fibers.forEach((f, i) => {
        if ((i % 2) !== pass) return;
        const L = f.len * f.k;
        const x2 = f.x + Math.cos(f.ang) * L, y2 = f.y + Math.sin(f.ang) * L;
        const cxp = f.x + Math.cos(f.base) * L * 0.5, cyp = f.y + Math.sin(f.base) * L * 0.5;
        ctx.strokeStyle = f.col; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.quadraticCurveTo(cxp, cyp, x2, y2); ctx.stroke();
      });
    }
    function drawBalloon() {
      const x = st.bx, y = st.by, sq = st.squash;
      // 털 위 그림자
      const hgt = clamp((REST - y) / (REST - UP), 0, 1);
      ctx.save(); ctx.fillStyle = `rgba(20,38,59,${0.16 - hgt * 0.1})`; ctx.beginPath(); ctx.ellipse(x + 10, FY + 6, R * (0.8 + hgt * 0.3), 10 + hgt * 4, 0, 0, TAU); ctx.fill(); ctx.restore();
      // 실
      ctx.save(); ctx.strokeStyle = '#9aa7b4'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y - R - 10); ctx.bezierCurveTo(x + 8, y - R - 60, x - 10, y - R - 120, x + 4, -20); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(x, y + R); ctx.scale(1 + sq * 0.05, 1 - sq * 0.06); ctx.translate(-x, -(y + R));
      // 매듭
      ctx.fillStyle = '#cdbb92'; ctx.beginPath(); ctx.moveTo(x - 9, y - R - 12); ctx.lineTo(x + 9, y - R - 12); ctx.lineTo(x + 4, y - R + 3); ctx.lineTo(x - 4, y - R + 3); ctx.closePath(); ctx.fill();
      // 몸통
      const g = ctx.createRadialGradient(x - R * 0.4, y - R * 0.45, R * 0.08, x, y, R * 1.05);
      g.addColorStop(0, '#fffdf7'); g.addColorStop(0.45, '#f4ecd8'); g.addColorStop(1, '#d6c7a2');
      ctx.save(); ctx.shadowColor = 'rgba(20,38,59,.16)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill(); ctx.restore();
      ctx.strokeStyle = 'rgba(120,100,60,.18)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke();
      // 은은한 반사
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(x - R * 0.42, y - R * 0.5, R * 0.16, R * 0.09, -0.6, 0, TAU); ctx.fill();
      if (st.charges) {
        BT.forEach(([dx, dy, k]) => (k === 'p' ? plus : minus)(ctx, x + dx, y + dy, 11));
        st.flying.forEach((e) => { if (e.done) minus(ctx, x + e.slot[0], y + e.slot[1], 11); });
      }
      ctx.restore();
    }
    addLoop(host, (dt) => {
      st.t += dt; TW.step(dt); demo(dt);
      const px = st.bx;
      const kk = st.drag ? 22 : 14;
      st.bx += (st.tx - st.bx) * Math.min(1, dt * kk); st.by += (st.ty - st.by) * Math.min(1, dt * kk);
      st.vx = dt ? (st.bx - px) / dt : 0;
      const contact = st.by >= REST - 3;
      st.squash += ((contact ? 1 : 0) - st.squash) * Math.min(1, dt * 10);
      if (contact) {
        st.path += Math.abs(st.bx - px);
        if (st.mode !== 'auto') { while (st.moved < MAXE && st.path >= STEP * (st.moved + 1)) transfer(); }
        else if (st.moved < MAXE && st.path >= STEP * (st.moved + 1)) transfer();
      }
      // 털 결: 문지를 때 눌리고 쓸리며, 떼어 놓은 뒤 전기를 띠면 풍선 쪽으로 일어남
      const charge = st.arrived / MAXE, gapY = st.by + R;
      fibers.forEach((f) => {
        let ta = f.base + Math.sin(st.t * 1.3 + f.ph) * 0.03, tk = 1;
        const under = Math.abs(f.x - st.bx) < R * 0.85;
        if (contact && under) { ta = f.base + clamp(st.vx * 0.004, -0.9, 0.9) + (f.x < st.bx ? -0.35 : 0.35); tk = 0.62; }
        else if (charge > 0 && !contact) {
          const dx = st.bx - f.x, dy = gapY - f.y, d = Math.hypot(dx, dy);
          const w = charge * clamp(1 - (d - 60) / 520, 0, 1) * 0.9;
          const toward = Math.atan2(dy, dx);
          let diff = toward - ta; while (diff > Math.PI) diff -= TAU; while (diff < -Math.PI) diff += TAU;
          ta = ta + diff * w * 0.75; tk = 1 + w * 0.45;
        }
        f.ang += (ta - f.ang) * Math.min(1, dt * 7); f.k = (f.k || 1) + (tk - (f.k || 1)) * Math.min(1, dt * 7);
      });
      S.begin();
      const [fx, fy, fw, fh] = S.full(); ctx.fillStyle = '#fff'; ctx.fillRect(fx, fy, fw, fh);
      // 바닥(아주 옅게)
      const fl = ctx.createLinearGradient(0, FY - 40, 0, H); fl.addColorStop(0, 'rgba(237,242,247,0)'); fl.addColorStop(1, '#eef2f6');
      ctx.fillStyle = fl; ctx.fillRect(fx, FY - 40, fw, fh);
      drawFur(); drawFibers(0);
      if (st.charges) FT.forEach((t) => { if (t.kind === 'p') plus(ctx, t.x, t.y, 11); else if (!t.gone) minus(ctx, t.x, t.y, 11); else { ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(t.x, t.y, 10, 0, TAU); ctx.stroke(); ctx.restore(); } });
      drawFibers(1);
      drawBalloon();
      // 날아가는 전자
      if (st.charges) st.flying.forEach((e) => {
        if (e.done) return;
        const x1 = st.bx + e.slot[0], y1 = st.by + e.slot[1], cxp = (e.x0 + x1) / 2 + 30, cyp = Math.min(e.y0, y1) - 40;
        const p = (k) => [(1 - k) * (1 - k) * e.x0 + 2 * (1 - k) * k * cxp + k * k * x1, (1 - k) * (1 - k) * e.y0 + 2 * (1 - k) * k * cyp + k * k * y1];
        ctx.save(); ctx.strokeStyle = 'rgba(14,99,179,.35)'; ctx.lineWidth = 1.4; ctx.setLineDash([3, 4]); ctx.beginPath();
        for (let k = 0; k <= e.k; k += 0.05) { const [a, b] = p(k); k ? ctx.lineTo(a, b) : ctx.moveTo(a, b); } ctx.stroke(); ctx.restore();
        const [a, b] = p(e.k); minus(ctx, a, b, 12);
      });
      // 끌어당기는 힘(떼어 놓은 뒤에만)
      const gap = FY - (st.by + R);
      if (st.arrived && gap > 70) {
        const ax = st.bx + 150, m = (st.by + R + FY) / 2, y0 = st.by + R * 0.62;
        arrow(ctx, ax, y0, ax, y0 + 34, INK2, 1.8, 7);
        arrow(ctx, ax, FY - 8, ax, FY - 42, INK2, 1.8, 7);
        ov.put('pull', ax + 14, (y0 + 34 + FY - 42) / 2, '서로 끌어당기는 힘', 'tx ra');
      } else ov.hide('pull');
      ov.put('furN', FX0 + 6, FY + 86, '털', 'tx m ra');
      ov.put('balN', st.bx - R - 14, st.by - R * 0.55, '풍선', 'tx m la');
      const ph = phase();
      ov.put('ph', 18, 22, ph === 'rub' ? '마찰하는 중' : ph === 'after' ? '마찰 후' : '마찰 전', 'chip');
    });
    if (st.demo) S.cv.style.cursor = 'grab';
    fire();
    return api;
  }

  /* =================================================================
     3. 숟가락 실험실 (해 보기)
     ================================================================= */
  function spoon(host, o = {}) {
    const W = 1000, H = 640, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx;
    const P = [700, 384], L = 330, TH0 = Math.PI + 0.12;
    const TW = tweens();
    const st = {
      th: TH0, om: 0, rubbed: 0, charges: true, sel: null, t: 0,
      na: { tip: [560, 112], ang: 0, held: false, a: 1 }, gl: { tip: [650, 160], ang: Math.PI + 0.1, held: false },
      drag: null, th1: TH0, result: null, rubbing: false, near: false,
    };
    const HELD_REST = [292, 640], APPROACH_ANG = -1.2;
    const fire = (type, v) => { if (o.onEvent) o.onEvent(type, v); };
    const end = () => [P[0] + Math.cos(st.th) * L, P[1] + Math.sin(st.th) * L];
    const target = () => { const e = end(); return [e[0] + 22, e[1] + 64]; };

    /* -- 그리기 -- */
    function spoonPath(c) { // 지역 좌표: 원점=목, +x=손잡이 쪽
      c.beginPath();
      c.moveTo(-6, -9);
      c.bezierCurveTo(40, -7.5, 200, -8.5, L - 14, -11);
      c.quadraticCurveTo(L + 6, -11, L + 6, 0); c.quadraticCurveTo(L + 6, 11, L - 14, 11);
      c.bezierCurveTo(200, 8.5, 40, 7.5, -6, 9);
      c.bezierCurveTo(-20, 22, -40, 34, -70, 33);
      c.bezierCurveTo(-112, 32, -124, 14, -124, 0);
      c.bezierCurveTo(-124, -14, -112, -32, -70, -33);
      c.bezierCurveTo(-40, -34, -20, -22, -6, -9);
      c.closePath();
    }
    function drawSpoon(x, y, ang, lift, name, charged) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.save(); ctx.shadowColor = 'rgba(20,38,59,.22)'; ctx.shadowBlur = 6 + lift * 10; ctx.shadowOffsetX = 3 + lift * 8; ctx.shadowOffsetY = 4 + lift * 12;
      const g = ctx.createLinearGradient(0, -14, 0, 14);
      g.addColorStop(0, '#fbf6ee'); g.addColorStop(0.5, '#f2e8d9'); g.addColorStop(1, '#dccdb6');
      ctx.fillStyle = g; spoonPath(ctx); ctx.fill(); ctx.restore();
      ctx.strokeStyle = 'rgba(110,90,60,.28)'; ctx.lineWidth = 1.1; spoonPath(ctx); ctx.stroke();
      // 오목한 부분
      const bg = ctx.createRadialGradient(-62, 6, 4, -66, 0, 36);
      bg.addColorStop(0, '#e9dcc6'); bg.addColorStop(1, 'rgba(233,220,198,0)');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(-66, 0, 46, 25, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(120, -4, 90, 2, 0, 0, TAU); ctx.fill();
      ctx.restore();
      if (charged > 0 && st.charges) [L - 96, L - 56, L - 16].forEach((s, i) => minus(ctx, x + Math.cos(ang) * s, y + Math.sin(ang) * s, 9, clamp(charged * 3 - i, 0, 1)));
    }
    function glovePath(c) {
      c.beginPath();
      // 검지
      c.moveTo(-112, -16); c.lineTo(-14, -15); c.arc(-14, 0, 15, -Math.PI / 2, Math.PI / 2); c.lineTo(-100, 15);
      // 접은 손가락(아래쪽 볼록)
      c.bezierCurveTo(-96, 30, -104, 44, -118, 46); c.bezierCurveTo(-110, 60, -122, 74, -140, 72);
      c.bezierCurveTo(-136, 86, -150, 96, -170, 90);
      c.bezierCurveTo(-190, 96, -214, 92, -226, 76);
      c.lineTo(-232, -30);
      // 엄지
      c.bezierCurveTo(-210, -44, -190, -62, -160, -62); c.bezierCurveTo(-140, -62, -132, -50, -140, -40); c.bezierCurveTo(-150, -32, -150, -24, -112, -16);
      c.closePath();
    }
    function drawGlove(x, y, ang, lift, charged) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.save(); ctx.shadowColor = 'rgba(20,38,59,.22)'; ctx.shadowBlur = 8 + lift * 12; ctx.shadowOffsetX = 3 + lift * 8; ctx.shadowOffsetY = 5 + lift * 12;
      const g = ctx.createLinearGradient(0, -60, 0, 90);
      g.addColorStop(0, '#eef2f5'); g.addColorStop(1, '#c9d3dc');
      ctx.fillStyle = g; glovePath(ctx); ctx.fill();
      // 손목 고무단
      ctx.fillStyle = '#d3dce4'; ctx.beginPath(); ctx.roundRect(-330, -44, 104, 130, 12); ctx.fill(); ctx.restore();
      // 짠 무늬
      ctx.save(); glovePath(ctx); ctx.rect(-330, -44, 104, 130); ctx.clip();
      ctx.strokeStyle = 'rgba(20,38,59,.07)'; ctx.lineWidth = 1.2;
      for (let yy = -70; yy < 100; yy += 7) for (let xx = -330; xx < 10; xx += 9) { ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 4.5, yy + 4); ctx.lineTo(xx + 9, yy); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(20,38,59,.10)'; ctx.lineWidth = 1.4;
      for (let xx = -324; xx < -226; xx += 8) { ctx.beginPath(); ctx.moveTo(xx, -44); ctx.lineTo(xx, 86); ctx.stroke(); }
      ctx.restore();
      ctx.strokeStyle = 'rgba(20,38,59,.18)'; ctx.lineWidth = 1.1; glovePath(ctx); ctx.stroke();
      ctx.restore();
      const c = Math.cos(ang), sn = Math.sin(ang);
      if (charged > 0 && st.charges) [[-40, 0], [-84, 0], [-130, -20], [-180, 10], [-140, 40], [-200, 52]].forEach(([a, b], i) => plus(ctx, x + a * c - b * sn, y + a * sn + b * c, 9, clamp(charged * 6 - i, 0, 1)));
    }
    function drawEraser() {
      const [x, y] = [P[0] + 16, P[1] + 6];
      ctx.save(); ctx.translate(x, y); ctx.rotate(-0.1);
      ctx.fillStyle = 'rgba(20,38,59,.13)'; ctx.beginPath(); ctx.roundRect(-54, -16, 116, 70, 10); ctx.fill();
      ctx.fillStyle = '#d9dfe5'; ctx.beginPath(); ctx.roundRect(-56, -6, 112, 44, 6); ctx.fill();
      ctx.fillStyle = '#fbfcfd'; ctx.beginPath(); ctx.roundRect(-56, -30, 112, 52, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(20,38,59,.12)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#dbe8f5'; ctx.fillRect(4, -30, 52, 52); ctx.fillStyle = '#c5d9ee'; ctx.fillRect(4, 22, 52, 16);
      ctx.fillStyle = BLUE; ctx.globalAlpha = 0.55; ctx.fillRect(4, -10, 52, 3); ctx.globalAlpha = 1;
      ctx.restore();
    }
    function spoonBase(tip, ang) { return [tip[0] - Math.cos(ang) * L, tip[1] - Math.sin(ang) * L]; }

    /* -- 움직임 -- */
    function moveObj(ob, tip, ang, dur, done) {
      const t0 = ob.tip.slice(), a0 = ob.ang;
      TW.add(reduce ? 0.05 : dur, (k) => { const e = ease(k); ob.tip = [lerp(t0[0], tip[0], e), lerp(t0[1], tip[1], e)]; ob.ang = lerp(a0, ang, e); }, done);
    }
    const api = {
      st,
      rub(done) {
        if (st.rubbing || TW.busy) return; st.rubbing = true; fire('rubStart');
        const gl = st.gl, home = gl.tip.slice(), hAng = gl.ang;
        const rubAlong = (base, ang, from, to, dur, cb) => {
          TW.add(reduce ? 0.05 : dur, (k) => {
            const s = lerp(from, to, 0.5 - Math.cos(k * TAU * 2) * 0.5);
            gl.tip = [base[0] + Math.cos(ang) * s, base[1] + Math.sin(ang) * s - 6]; gl.ang = ang + Math.PI;
          }, cb);
        };
        const naBase = spoonBase(st.na.tip, st.na.ang);
        // 1) ㉮ 손잡이로 → 문지르기
        const a = st.th;
        const s1 = [P[0] + Math.cos(a) * (L - 20), P[1] + Math.sin(a) * (L - 20) - 6];
        moveObj(gl, s1, a + Math.PI, 0.7, () => rubAlong(P, a, L - 10, L - 150, 1.7, () => {
          st.rubbed = Math.max(st.rubbed, 0.5);
          // 2) ㉯ 손잡이로
          const s2 = [naBase[0] + Math.cos(st.na.ang) * (L - 20), naBase[1] + Math.sin(st.na.ang) * (L - 20) - 6];
          moveObj(gl, s2, st.na.ang + Math.PI, 0.6, () => rubAlong(naBase, st.na.ang, L - 10, L - 150, 1.7, () => {
            st.rubbed = 1; moveObj(gl, home, hAng, 0.7, () => { st.rubbing = false; fire('rubbed'); if (done) done(); });
          }));
        }));
        // 문지르는 동안 전하가 조금씩 나타남
        let acc = 0; TW.add(reduce ? 0.05 : 5.4, (k) => { acc = k; st.chA = Math.min(1, k * 1.9); st.chB = clamp((k - 0.5) * 2.2, 0, 1); });
      },
      choose(who, done) {
        if (st.rubbing || st.sel === who) { if (done) done(); return; }
        TW.clear();
        const prev = st.sel; st.sel = who; st.result = null; st.near = false;
        // 놓아 두는 자리로
        if (prev === 'na' || (prev === null && who === 'gl')) moveObj(st.na, [560, 112], 0, 0.8);
        if (prev === 'gl' || (prev === null && who === 'na')) moveObj(st.gl, [650, 160], Math.PI + 0.1, 0.8);
        const ob = who === 'na' ? st.na : st.gl;
        // ㉮ 숟가락을 처음 자리로 돌려놓기
        const th0 = st.th; TW.add(reduce ? 0.05 : 0.8, (k) => { st.th = lerp(th0, TH0, ease(k)); st.om = 0; });
        moveObj(ob, HELD_REST, APPROACH_ANG, 0.9, () => { st.th1 = st.th; fire('chosen', who); if (done) done(); });
      },
      approach(done) {
        if (!st.sel || st.rubbing) return; const ob = st.sel === 'na' ? st.na : st.gl;
        st.th1 = st.th; st.result = null;
        moveObj(ob, target(), APPROACH_ANG, 2.0, () => { st.near = true; setTimeout(() => { if (!st.result) { st.result = 'none'; fire('result', 'none'); } }, 1400); if (done) done(); });
      },
      realign(done) { // 다시 하기: 들고 있는 물체를 물리고 ㉮를 처음 자리로
        if (!st.sel) return; TW.clear(); st.near = false; st.result = null; const ob = st.sel === 'na' ? st.na : st.gl;
        const th0 = st.th; TW.add(reduce ? 0.05 : 0.7, (k) => { st.th = lerp(th0, TH0, ease(k)); st.om = 0; });
        moveObj(ob, HELD_REST, APPROACH_ANG, 0.7, () => { st.th1 = st.th; if (done) done(); });
      },
      away() { if (!st.sel) return; const ob = st.sel === 'na' ? st.na : st.gl; st.near = false; moveObj(ob, HELD_REST, APPROACH_ANG, 1.0); },
      reset() {
        TW.clear(); st.th = TH0; st.om = 0; st.rubbed = 0; st.chA = 0; st.chB = 0; st.sel = null; st.result = null; st.rubbing = false; st.near = false;
        st.na.tip = [560, 112]; st.na.ang = 0; st.gl.tip = [650, 160]; st.gl.ang = Math.PI + 0.1; fire('reset');
      },
      set(v) { Object.assign(st, v); },
      fastRub() { st.rubbed = 1; st.chA = 1; st.chB = 1; },
    };
    st.chA = 0; st.chB = 0;
    // 끌어서 가까이 가져가기
    S.cv.addEventListener('pointerdown', (ev) => {
      if (!st.sel || st.rubbing) return;
      const [x, y] = S.toLocal(ev), ob = st.sel === 'na' ? st.na : st.gl;
      const bx = ob.tip[0] - Math.cos(ob.ang) * 120, by = ob.tip[1] - Math.sin(ob.ang) * 120;
      const dSeg = (() => { const vx = ob.tip[0] - bx, vy = ob.tip[1] - by, k = clamp(((x - bx) * vx + (y - by) * vy) / (vx * vx + vy * vy), 0, 1.6); return Math.hypot(x - (bx + vx * k), y - (by + vy * k)); })();
      if (dSeg > 70 && Math.hypot(x - ob.tip[0], y - ob.tip[1]) > 90) return;
      TW.clear(); st.drag = { dx: ob.tip[0] - x, dy: ob.tip[1] - y }; st.th1 = st.th; st.result = null; S.cv.setPointerCapture(ev.pointerId); ev.preventDefault(); fire('drag');
    });
    S.cv.addEventListener('pointermove', (ev) => {
      if (!st.drag) return; const [x, y] = S.toLocal(ev), ob = st.sel === 'na' ? st.na : st.gl;
      ob.tip = [clamp(x + st.drag.dx, 60, 940), clamp(y + st.drag.dy, 160, 700)];
    });
    const up = () => { if (!st.drag) return; st.drag = null; const ob = st.sel === 'na' ? st.na : st.gl; const e = end();
      if (Math.hypot(ob.tip[0] - e[0], ob.tip[1] - e[1]) < 120) { st.near = true; setTimeout(() => { if (!st.result && st.near) { st.result = 'none'; fire('result', 'none'); } }, 1400); } };
    S.cv.addEventListener('pointerup', up); S.cv.addEventListener('pointercancel', up);

    addLoop(host, (dt) => {
      st.t += dt; TW.step(dt);
      // 전기력에 의한 회전 (손잡이 끝 한 점과 가까이 가져간 물체 끝 한 점 사이)
      if (st.sel && st.rubbed >= 1) {
        const ob = st.sel === 'na' ? st.na : st.gl, sign = st.sel === 'na' ? 1 : -1;
        const e = end(), dx = e[0] - ob.tip[0], dy = e[1] - ob.tip[1], r = Math.max(30, Math.hypot(dx, dy));
        const F = 15000 / (r * r) * sign, fx = F * dx / r, fy = F * dy / r;
        const tq = (-Math.sin(st.th) * fx + Math.cos(st.th) * fy);
        let al = Math.abs(tq) > 0.6 ? tq : 0;
        al -= st.om * 3.6 + Math.sign(st.om) * 0.25;
        st.om += al * dt;
        const nth = st.th + st.om * dt;
        // 끌려와 닿으면 멈춤
        const ne = [P[0] + Math.cos(nth) * L, P[1] + Math.sin(nth) * L];
        if (sign < 0 && Math.hypot(ne[0] - ob.tip[0], ne[1] - ob.tip[1]) < 26) st.om = 0; else st.th = nth;
        if (st.th < TH0 - 1.25) { st.th = TH0 - 1.25; st.om = 0; } if (st.th > TH0 + 1.25) { st.th = TH0 + 1.25; st.om = 0; }
        if (!st.result && Math.abs(st.th - st.th1) > 0.1) { st.result = sign > 0 ? 'away' : 'toward'; fire('result', st.result); }
      } else st.om = 0;

      S.begin();
      const [fx, fy, fw, fh] = S.full();
      const g = ctx.createLinearGradient(0, fy, 0, fy + fh); g.addColorStop(0, '#f6f8fa'); g.addColorStop(1, '#e8edf2');
      ctx.fillStyle = g; ctx.fillRect(fx, fy, fw, fh);
      // ㉮ 손잡이 끝이 지나는 길(아주 옅게)
      ctx.save(); ctx.strokeStyle = 'rgba(20,38,59,.08)'; ctx.setLineDash([2, 6]); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(P[0], P[1], L, TH0 - 0.7, TH0 + 0.7); ctx.stroke(); ctx.restore();
      drawEraser();
      // 놓인 물체 → ㉮ → 들고 있는 물체 순서
      const naHeld = st.sel === 'na', glHeld = st.sel === 'gl';
      const naB = spoonBase(st.na.tip, st.na.ang);
      const glLift = st.rubbing ? 0.25 : glHeld ? 1 : 0;
      if (!naHeld) drawSpoon(naB[0], naB[1], st.na.ang, 0, '나', st.chB);
      if (!glHeld && !st.rubbing) drawGlove(st.gl.tip[0], st.gl.tip[1], st.gl.ang, 0, st.rubbed);
      drawSpoon(P[0], P[1], st.th, 0.55, '가', st.chA);
      if (st.rubbing) drawGlove(st.gl.tip[0], st.gl.tip[1], st.gl.ang, glLift, st.rubbed);
      if (naHeld) drawSpoon(naB[0], naB[1], st.na.ang, 1, '나', st.chB);
      if (glHeld) drawGlove(st.gl.tip[0], st.gl.tip[1], st.gl.ang, 1, st.rubbed);
      // 이름표
      const bowl = (x, y, a) => [x - Math.cos(a) * 66, y - Math.sin(a) * 66];
      const ga = bowl(P[0], P[1], st.th); ov.put('ga', ga[0] + 6, ga[1] - 54, '<i class="ck">가</i> 숟가락', 'tx');
      const nb = naHeld ? [naB[0] + Math.cos(st.na.ang) * 170, naB[1] + Math.sin(st.na.ang) * 170] : bowl(naB[0], naB[1], st.na.ang);
      ov.put('na', nb[0] + (naHeld ? -40 : 4), nb[1] + (naHeld ? 0 : 50), '<i class="ck">나</i> 숟가락', naHeld ? 'tx la' : 'tx');
      const gp = [st.gl.tip[0] - Math.cos(st.gl.ang) * 170, st.gl.tip[1] - Math.sin(st.gl.ang) * 170];
      if (!st.rubbing) ov.put('gl', gp[0] + (glHeld ? -70 : 0), gp[1] + (glHeld ? 0 : 92), '장갑', glHeld ? 'tx la' : 'tx'); else ov.hide('gl');
      ov.put('er', P[0] + 40, P[1] + 84, '지우개', 'tx m');
    });
    return api;
  }

  /* =================================================================
     4. 매단 두 공: 척력과 인력
     ================================================================= */
  function pend(host, o = {}) {
    const W = 1000, H = 400, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx;
    const TOP = 46, LEN = 220, BR = 24, GAP = 34;
    const panels = [[180, 'p', 'p', 1], [500, 'm', 'm', 1], [820, 'p', 'm', -1]];
    const st = { on: 0, t: 0, a: panels.map(() => 0), w: panels.map(() => 0) };
    const api = { replay() { st.on = 0; st.t = 0; st.a = panels.map(() => 0); st.w = panels.map(() => 0); } };
    panels.forEach(([cx, a, b, s], i) => {
      ov.put('n' + i, cx, H - 40, s > 0 ? '척력' : '인력', 'tx b big');
      ov.put('d' + i, cx, H - 14, s > 0 ? '같은 종류의 전하' : '다른 종류의 전하', 'tx m');
    });
    addLoop(host, (dt) => {
      st.t += dt; st.on = clamp((st.t - 0.8) / 0.6, 0, 1);
      S.begin();
      const [fx, fy, fw, fh] = S.full(); ctx.fillStyle = '#fff'; ctx.fillRect(fx, fy, fw, fh);
      panels.forEach(([cx, ka, kb, s], i) => {
        // 목표 기울기: 밀면 바깥, 당기면 안쪽(서로 닿기 직전까지)
        const goal = st.on * (s > 0 ? 0.30 : -0.04);
        st.w[i] += ((goal - st.a[i]) * 26 - st.w[i] * 4.2) * dt; st.a[i] += st.w[i] * dt;
        if (reduce) st.a[i] = goal;
        if (i > 0) { ctx.strokeStyle = '#e6ecf2'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - 160, 20); ctx.lineTo(cx - 160, H - 60); ctx.stroke(); }
        // 받침대
        ctx.fillStyle = '#c3ccd6'; ctx.beginPath(); ctx.roundRect(cx - 80, TOP - 8, 160, 8, 4); ctx.fill();
        [[-1, ka], [1, kb]].forEach(([side, k]) => {
          const px = cx + side * GAP, ang = side * st.a[i];
          const bx = px + Math.sin(ang) * LEN, by = TOP + Math.cos(ang) * LEN;
          ctx.strokeStyle = '#9aa7b4'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(px, TOP); ctx.lineTo(bx, by - BR + 2); ctx.stroke();
          ctx.fillStyle = 'rgba(20,38,59,.06)'; ctx.beginPath(); ctx.ellipse(bx + 6, H - 72, 20, 4, 0, 0, TAU); ctx.fill();
          // 공
          const g = ctx.createRadialGradient(bx - 8, by - 9, 3, bx, by, BR);
          g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d9e0e7');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, BR, 0, TAU); ctx.fill();
          ctx.strokeStyle = 'rgba(20,38,59,.15)'; ctx.lineWidth = 1; ctx.stroke();
          (k === 'p' ? plus : minus)(ctx, bx, by, 13, st.on);
        });
      });
    });
    return api;
  }

  return { atom, rub, spoon, pend, plus, minus, arrow, surface, overlay, addLoop };
})();
