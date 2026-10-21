/* ===== 용해도 실험 그림 (SOL에 더함) =====
   SOL.tube(host, {mode:'kind'|'temp', kind})  시험관 실험실(교과서 탐구)
   SOL.beaker(host)                             물 100 g 비커에 용질 넣고 젓기
   SOL.soda(host, {mode:'temp'|'press'})        기체의 용해도(해 보기) */
(() => {
  const SOL = window.SOL, U = SOL._;
  const { surface, overlay, addLoop, tweens, seq, rr, white, desk, contact, glassBack, glassFront, liquid, WATER, grainDraw, pile, spoon, tubeBase, tubeShape, tubeBack, tubeLiquid, tubeFront, clamp, lerp, ease, eOut, gauss, TAU, BLUE, INK, reduce } = U;
  const NAME = { kno3: '질산 칼륨', boric: '붕산' };
  const PER = { kno3: 20, boric: 160 }; // 1 g에 그리는 알갱이 수 (보기 좋게 정한 값)
  const GR = { kno3: [3.4, 1.6], boric: [2.6, 1.0] };

  // 시약포지(앞으로 기운 네모 종이). (x,y) 가운데, a 기울기, m 0~1 무더기
  function paper(ctx, x, y, a, m, seed) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = 'rgba(20,38,59,.08)'; ctx.beginPath(); ctx.ellipse(0, 9, 50, 8, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-52, 0); ctx.lineTo(0, -15); ctx.lineTo(52, 0); ctx.lineTo(0, 15); ctx.closePath();
    const g = ctx.createLinearGradient(0, -15, 0, 15); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e9eef3');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(20,38,59,.22)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = 'rgba(20,38,59,.12)'; ctx.beginPath(); ctx.moveTo(-52, 0); ctx.lineTo(52, 0); ctx.stroke();
    if (m > 0.02) {
      const r = U.rng(seed || 5), n = Math.round(26 * m);
      ctx.fillStyle = '#f3f6f9'; ctx.beginPath(); ctx.ellipse(0, -2, 22 * Math.sqrt(m), 9 * Math.sqrt(m), 0, Math.PI, TAU); ctx.fill();
      for (let i = 0; i < n; i++) grainDraw(ctx, { x: (r() - 0.5) * 38 * Math.sqrt(m), y: -2 - r() * 8 * Math.sqrt(m), r: 2.4, rot: r() * 6, sh: i % 12 });
    }
    ctx.restore();
  }
  function lcdBalance(ctx, ov, BX, TY, val, id) {
    contact(ctx, BX, TY + 1, 280, 0.18);
    let g = ctx.createLinearGradient(0, TY - 74, 0, TY); g.addColorStop(0, '#f4f6f8'); g.addColorStop(1, '#d3dae1');
    ctx.fillStyle = g; rr(ctx, BX - 120, TY - 74, 240, 74, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(20,38,59,.14)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#26323d'; rr(ctx, BX + 6, TY - 58, 100, 38, 7); ctx.fill();
    g = ctx.createLinearGradient(0, TY - 54, 0, TY - 24); g.addColorStop(0, '#3a4855'); g.addColorStop(1, '#2b3640'); ctx.fillStyle = g; rr(ctx, BX + 10, TY - 54, 92, 30, 5); ctx.fill();
    [-90, -64].forEach((dx) => { ctx.fillStyle = '#bfc8d1'; ctx.beginPath(); ctx.arc(BX + dx, TY - 38, 8, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(20,38,59,.18)'; ctx.stroke(); });
    ctx.fillStyle = '#b4bec8'; ctx.fillRect(BX - 14, TY - 86, 28, 12);
    g = ctx.createLinearGradient(0, TY - 94, 0, TY - 84); g.addColorStop(0, '#eef1f4'); g.addColorStop(1, '#a9b4bf');
    ctx.fillStyle = g; rr(ctx, BX - 96, TY - 94, 192, 10, 4); ctx.fill(); ctx.strokeStyle = 'rgba(20,38,59,.18)'; ctx.stroke();
    ov.put(id, BX + 56, TY - 39, `${val.toFixed(1)}<small>g</small>`, 'lcd');
    ov.put(id + 'n', BX - 50, TY + 22, '전자저울', 'tx m');
  }
  function bottle(ctx, x, TY) {
    contact(ctx, x, TY + 1, 110, 0.16);
    let g = ctx.createLinearGradient(x - 34, 0, x + 34, 0); g.addColorStop(0, '#d9e0e6'); g.addColorStop(0.3, '#f6f8fa'); g.addColorStop(1, '#c7d0d8');
    ctx.fillStyle = g; rr(ctx, x - 34, TY - 120, 68, 120, 10); ctx.fill(); ctx.strokeStyle = 'rgba(20,38,59,.2)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#e7ecf0'; rr(ctx, x - 18, TY - 140, 36, 24, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; rr(ctx, x - 26, TY - 92, 52, 44, 4); ctx.fill(); ctx.strokeStyle = 'rgba(20,38,59,.15)'; ctx.stroke();
  }
  function tongs(ctx, R) { // 시험관 집게 (시험관 제 좌표)
    ctx.save(); ctx.lineCap = 'round';
    const g = ctx.createLinearGradient(0, 30, 120, -60); g.addColorStop(0, '#c9d1d9'); g.addColorStop(1, '#7d8a97');
    ctx.strokeStyle = g; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-R - 3, 62); ctx.quadraticCurveTo(-R - 8, 40, R + 30, 18); ctx.lineTo(R + 120, -46); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(R + 3, 62); ctx.quadraticCurveTo(R + 10, 50, R + 34, 30); ctx.lineTo(R + 124, -40); ctx.stroke();
    ctx.fillStyle = '#5d6b78'; rr(ctx, R + 96, -60, 46, 18, 8); ctx.save(); ctx.translate(R + 119, -51); ctx.rotate(-0.62); ctx.translate(-R - 119, 51); ctx.fill(); ctx.restore();
    ctx.restore();
  }
  function steam(ctx, cx, top, t, w) {
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const ph = t * 0.8 + i * 1.7, k = (ph % 3) / 3;
      ctx.strokeStyle = `rgba(150,170,190,${0.32 * Math.sin(Math.PI * k)})`; ctx.lineWidth = 3;
      ctx.beginPath(); for (let s = 0; s <= 60; s += 5) { const y = top - 6 - k * 50 - s, x = cx + (i - 1) * w + Math.sin(s * 0.09 + ph * 2) * 7; s ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    }
    ctx.restore();
  }
  function ice(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const g = ctx.createLinearGradient(-s, -s, s, s); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(200,222,240,.8)');
    ctx.fillStyle = g; rr(ctx, -s, -s * 0.8, 2 * s, 1.6 * s, s * 0.35); ctx.fill();
    ctx.strokeStyle = 'rgba(120,150,180,.45)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.moveTo(-s * 0.6, -s * 0.5); ctx.lineTo(s * 0.2, -s * 0.5); ctx.stroke();
    ctx.restore();
  }

  /* =================================================================
     4. 시험관 실험실 (탐구: 용질의 녹는 양 비교하기)
     ================================================================= */
  function tube(host, o = {}) {
    const W = 1000, H = 640, S = surface(host, W, H, o.mode === 'temp' ? { x: 40, y: 120, w: 960, h: 520 } : { x: 190, y: 130, w: 790, h: 510 }), ov = overlay(S), ctx = S.ctx, TW = tweens();
    const TY = 600, L = 320, R = 30, IR = 27, SURF = 180, PV = 170, SLAB = 430;
    const RACK = o.mode === 'temp' ? 500 : 340;
    const BATH = { hot: { cx: 190, T: 60, name: '뜨거운 물(약 60 ℃)' }, ice: { cx: 810, T: 0, name: '얼음물' } };
    const BAL = 660, BOT = 890, PAPER0 = o.mode === 'temp' ? [1080, 160] : [BAL, TY - 104];
    const st = { t: 0, kind: o.kind || 'kno3', added: 0, solid: 0, T: 20, where: 'rack', cx: RACK, cy: SLAB, a: 0, stir: 0, shakeT: 0, wait: null, lcd: 0,
      pp: { x: PAPER0[0], y: PAPER0[1], a: 0, m: 0, on: o.mode !== 'temp' }, sp: { x: BOT, y: 380, a: 0.3, on: false }, pouring: false, tong: false };
    let P = mkPile();
    function mkPile() { return pile(-IR + 2, IR - 2, tubeBase(L, IR), { bw: 5, vt: 75 }); }
    const bathT = () => (st.where === 'hot' ? 60 : st.where === 'ice' ? 0 : 20);
    const cap = () => SOL.solu(st.kind, st.T) / 10;
    const inBath = () => st.where === 'hot' || st.where === 'ice';
    function newGrain(x, y, vx, vy, extra) { const [r0, dr] = GR[st.kind]; return P.add(x, y, r0 + Math.random() * dr, vx, vy, extra); }
    function watch(cb, min = 0) { st.wait = { cb, min, t: 0 }; }
    // 용질 넣기: (kind) 약숟가락으로 시약포지에 덜고 → 시약포지로 시험관에 붓기 → 흔들어 녹이기
    function add(g, cb) {
      const N = Math.max(1, Math.round(g * PER[st.kind])); const pp = st.pp, sp = st.sp;
      const goal = Math.round((st.added + g) * 100) / 100, per = g / N;
      const mx = st.cx, my = st.cy - PV; // 입구
      const steps = [];
      if (o.mode !== 'temp') {
        steps.push([0.6, (k) => { sp.on = true; const e = ease(k); sp.x = lerp(BOT + 6, BAL + 24, e); sp.y = lerp(445, TY - 130, e) - Math.sin(Math.PI * e) * 60; sp.a = 0.3; }]);
        steps.push([0.6, (k) => { sp.a = lerp(0.3, -0.6, ease(k)); pp.m = k; st.lcd = lerp(0, g, eOut(k)); }]);
        steps.push([0.5, (k) => { const e = ease(k); sp.x = lerp(BAL + 24, BOT + 6, e); sp.y = lerp(TY - 130, 445, e); sp.a = lerp(-0.6, 0.3, e); if (k >= 1) sp.on = false; }]);
        steps.push([0.25, () => { st.lcd = g; }]);
      } else { pp.on = true; pp.m = 1; }
      const ax = pp.x, ay = pp.y;
      steps.push([0.9, (k) => { const e = ease(k); pp.x = lerp(ax, mx + 58, e); pp.y = lerp(ay, my - 30, e) - Math.sin(Math.PI * e) * 50; pp.a = lerp(0, -0.55, e); if (o.mode !== 'temp') st.lcd = lerp(g, 0, Math.min(1, k * 3)); }]);
      let em = 0;
      steps.push([0.9, (k) => { st.pouring = true; pp.a = -0.55 - 0.25 * Math.sin(Math.PI * k); const n = Math.round(k * N); while (em < n) { em++; newGrain((Math.random() - 0.5) * 10, -12, (Math.random() - 0.5) * 20, 80 + Math.random() * 60); st.added += per; st.solid += per; } pp.m = 1 - k; }]);
      seq(TW, steps, () => {
        st.pouring = false; st.solid += goal - st.added; st.added = goal; st.solid = Math.max(0, Math.min(st.solid, st.added));
        const bx = pp.x, by = pp.y;
        TW.add(0.8, (k) => { const e = ease(k); pp.x = lerp(bx, PAPER0[0], e); pp.y = lerp(by, PAPER0[1], e); pp.a = lerp(-0.55, 0, e); }, () => { if (o.mode === 'temp') pp.on = false; });
        // 알갱이가 가라앉으면 흔들어 녹이기
        const go = () => { if (P.falling) { setTimeout(go, 120); return; } st.stir = 1; st.shakeT = 0; watch((r) => { st.stir = 0; cb && cb(r); }, reduce ? 0 : 1.8); };
        setTimeout(go, reduce ? 0 : 350);
      });
    }
    function move(where, cb) {
      const dest = where === 'rack' ? RACK : BATH[where].cx, c0 = st.cx, y0 = st.cy;
      st.tong = true; st.where = 'air';
      seq(TW, [
        [0.8, (k) => { st.cy = lerp(y0, 200, ease(k)); }],
        [0.9, (k) => { st.cx = lerp(c0, dest, ease(k)); }],
        [0.9, (k) => { st.cy = lerp(200, where === 'rack' ? SLAB : 435, ease(k)); }],
      ], () => { st.where = where; if (where === 'rack') st.tong = false; watch((r) => cb && cb(r), reduce ? 0 : 1.5); });
    }
    function result() { return { added: st.added, left: Math.round(st.solid * 100) / 100, cap: SOL.solu(st.kind, st.T) / 10, T: st.T, all: st.solid < 0.004 }; }
    function reset(kind) {
      TW.clear(); if (kind) st.kind = kind; P = mkPile();
      Object.assign(st, { added: 0, solid: 0, T: 20, where: 'rack', cx: RACK, cy: SLAB, a: 0, stir: 0, wait: null, lcd: 0, pouring: false, tong: false });
      Object.assign(st.pp, { x: PAPER0[0], y: PAPER0[1], a: 0, m: 0, on: o.mode !== 'temp' }); st.sp.on = false;
    }
    // 검사용: 곧바로 그 상태로
    function jump(p) {
      reset(p.kind); st.added = p.added || 0; if (p.where) { st.where = p.where; st.tong = p.where !== 'rack'; st.cx = p.where === 'rack' ? RACK : BATH[p.where].cx; st.cy = p.where === 'rack' ? SLAB : 435; }
      st.T = bathT(); st.solid = Math.max(0, st.added - cap());
      const n = Math.round(st.solid * PER[st.kind]); for (let i = 0; i < n; i++) newGrain((Math.random() - 0.5) * 40, SURF + 40 + Math.random() * 60, 0, 60);
      for (let i = 0; i < 200; i++) P.step(0.03, SURF);
    }
    addLoop(host, (dt) => {
      st.t += dt; TW.step(dt);
      // 온도와 녹는 양
      if (st.where !== 'air') st.T += (bathT() - st.T) * (1 - Math.exp(-dt / 1.3));
      const target = Math.max(0, st.added - cap());
      if (!st.pouring) {
        if (st.solid > target && (st.stir || inBath())) st.solid -= (st.solid - target) * (1 - Math.exp(-dt / (st.stir ? 0.5 : 0.9)));
        else if (st.solid < target) st.solid += (target - st.solid) * (1 - Math.exp(-dt / 1.0));
        if (Math.abs(st.solid - target) < 0.003) st.solid = target;
        const want = Math.round(st.solid * PER[st.kind]), live = P.live;
        if (live > want) P.melt(live - want, 0.7);
        else if (live < want) for (let i = 0; i < Math.min(3, want - live); i++) newGrain((Math.random() - 0.5) * 38, SURF + 16 + Math.random() * (L - SURF - 70), 0, 4, { st: 'grow', s: 0.1, a: 0, vt: 22 });
      }
      P.step(dt, SURF);
      if (st.stir) { st.shakeT += dt; st.a = 0.075 * Math.sin(st.shakeT * 15) * Math.min(1, st.shakeT * 4); } else st.a *= Math.exp(-8 * dt);
      if (st.wait) {
        st.wait.t += dt;
        const ok = st.wait.t >= st.wait.min && !P.falling && Math.abs(st.solid - target) < 0.004 && Math.abs(st.T - bathT()) < 0.6 && !TW.busy;
        if (ok) { const w = st.wait; st.wait = null; w.cb(result()); }
      }
      // ---- 그리기 ----
      S.begin(); white(S); desk(S, TY);
      if (o.mode === 'temp') ['hot', 'ice'].forEach((k) => { const b = BATH[k]; contact(ctx, b.cx, TY + 2, 270, 0.16); glassBack(ctx, b.cx - 115, 360, b.cx + 115, TY, 14); });
      // 시험관대 뒤쪽
      ctx.fillStyle = '#c9d2db'; rr(ctx, RACK - 92, SLAB - 6, 10, TY - SLAB, 3); ctx.fill(); rr(ctx, RACK + 82, SLAB - 6, 10, TY - SLAB, 3); ctx.fill();
      contact(ctx, RACK, TY + 1, 220, 0.14);
      let g = ctx.createLinearGradient(0, TY - 18, 0, TY); g.addColorStop(0, '#e3e9ef'); g.addColorStop(1, '#c4cdd6'); ctx.fillStyle = g; rr(ctx, RACK - 104, TY - 18, 208, 18, 5); ctx.fill();
      // 시험관
      ctx.save(); ctx.translate(st.cx, st.cy); ctx.rotate(st.a); ctx.translate(0, -PV);
      tubeBack(ctx, L, R);
      tubeLiquid(ctx, L, R, SURF, ...WATER);
      P.list.forEach((gr) => grainDraw(ctx, gr, '#fbfdff', 'rgba(100,120,142,.65)'));
      // 녹을 때 아른거림
      if (P.list.some((gr) => gr.st === 'melt')) { ctx.save(); tubeShape(ctx, L, R - 3); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.2; for (let i = 0; i < 4; i++) { const ph = st.t * 2 + i * 1.6; ctx.beginPath(); for (let s = 0; s < 80; s += 6) { const y = L - 30 - s - (ph % 2) * 20, x = (i - 1.5) * 10 + Math.sin(s * 0.1 + ph * 3) * 4; s ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); } ctx.restore(); }
      tubeFront(ctx, L, R);
      if (st.tong) tongs(ctx, R);
      ctx.restore();
      // 시험관대 앞판(구멍)
      g = ctx.createLinearGradient(0, SLAB - 8, 0, SLAB + 10); g.addColorStop(0, '#eef2f6'); g.addColorStop(1, '#c9d2db');
      ctx.fillStyle = g; rr(ctx, RACK - 104, SLAB - 8, 208, 18, 5); ctx.fill(); ctx.strokeStyle = 'rgba(20,38,59,.14)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = 'rgba(40,55,70,.18)'; ctx.beginPath(); ctx.ellipse(RACK, SLAB - 3, 34, 4, 0, 0, TAU); ctx.fill();
      if (st.where === 'rack') { ctx.fillStyle = 'rgba(236,242,247,.6)'; ctx.fillRect(RACK - R, SLAB - 3, 2 * R, 3); }
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(RACK - 100, SLAB - 6, 200, 1.5);
      // 물중탕 비커 앞쪽
      if (o.mode === 'temp') ['hot', 'ice'].forEach((k) => {
        const b = BATH[k], x0 = b.cx - 115, x1 = b.cx + 115;
        ctx.save(); ctx.globalAlpha = 0.92; liquid(ctx, x0 + 3, x1 - 3, 410, TY - 16, 'rgba(204,226,245,.45)', 'rgba(172,206,236,.6)'); ctx.restore();
        if (k === 'ice') [[-70, 0.2], [-24, -0.3], [52, 0.15], [86, -0.2]].forEach(([dx, r], i) => ice(ctx, b.cx + dx, 414 + Math.sin(st.t * 1.3 + i) * 1.5, 17, r + Math.sin(st.t + i) * 0.03));
        else steam(ctx, b.cx, 360, st.t, 46);
        glassFront(ctx, x0, 360, x1, TY, 14);
        ov.put('b' + k, b.cx, TY + 22, b.name, 'tx tag');
      });
      if (o.mode !== 'temp') {
        lcdBalance(ctx, ov, BAL, TY, st.lcd, 'lcd');
        bottle(ctx, BOT, TY);
        ov.put('botN', BOT, TY - 70, NAME[st.kind], 'tx bl');
      }
      if (st.pp.on) { paper(ctx, st.pp.x, st.pp.y, st.pp.a, st.pp.m, 9); if (o.mode === 'temp' && st.pp.m > 0.5) ov.put('ppN', st.pp.x, st.pp.y - 34, `${NAME[st.kind]} 6 g`, 'tx m'); else ov.hide('ppN'); } else ov.hide('ppN');
      if (st.sp.on) spoon(ctx, st.sp.x, st.sp.y, st.sp.a);
      // 이름표
      const my = st.cy - PV;
      ov.put('w', st.cx - R - 14, my + SURF + 40, '물 10 g', 'tx nm la');
      const showLeft = target > 0.004 && P.live > 0 && !P.falling && st.where !== 'air';
      if (showLeft) ov.put('left', st.cx + R + 16, my + L - 18, '녹지 않고 남음', 'tx lefty ra'); else ov.hide('left');
    });
    return { add, move, reset, jump, result, get st() { return st; }, get busy() { return TW.busy || !!st.wait || st.pouring; } };
  }

  /* =================================================================
     5. 물 100 g 비커 (용해도 곡선 실험실)
     ================================================================= */
  function beaker(host) {
    const W = 380, H = 820, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx, TW = tweens();
    const TY = 780, X0 = 30, X1 = 300, TOP = 330, WY = 470, K = 3, PX = X0 + 64, PY = TOP - 50;
    const st = { t: 0, sub: 'kno3', T: 20, g: 0, solid: 0, stir: 0, rod: 0, wait: null, pp: { x: -80, y: PY - 20, a: 0, m: 0, on: false }, pouring: false };
    let P = pile(X0 + 6, X1 - 6, () => TY - 17, { bw: 7, vt: 150 });
    const S100 = () => SOL.solu(st.sub, st.T);
    function setT(T) { st.T = T; }
    function setSub(s) { st.sub = s; }
    function reset() { TW.clear(); P = pile(X0 + 6, X1 - 6, () => TY - 17, { bw: 7, vt: 150 }); Object.assign(st, { g: 0, solid: 0, stir: 0, wait: null, pouring: false }); Object.assign(st.pp, { x: -80, y: PY - 20, a: 0, m: 0, on: false }); }
    function run(sub, T, g, cb) {
      reset(); st.sub = sub; st.T = T; const N = Math.round(g * K), pp = st.pp; pp.on = true; pp.m = 1;
      let em = 0;
      seq(TW, [
        [0.9, (k) => { const e = ease(k); pp.x = lerp(-80, PX, e); pp.y = lerp(PY - 20, PY, e) - Math.sin(Math.PI * e) * 40; pp.a = lerp(0, 0.5, e); }],
        [1.2, (k) => { st.pouring = true; pp.a = 0.5 + 0.25 * Math.sin(Math.PI * k); const n = Math.round(k * N); while (em < n) { em++; P.add(pp.x + 40 + Math.random() * 16, pp.y + 22, 4 + Math.random() * 2, -10 + Math.random() * 90, 40 + Math.random() * 80); } pp.m = 1 - k; }],
        [0.7, (k) => { st.pouring = false; const e = ease(k); pp.x = lerp(PX, -80, e); pp.y = lerp(PY, PY - 20, e); pp.a = lerp(0.5, 0, e); }],
      ], () => {
        pp.on = false; st.g = g; st.solid = g;
        const go = () => { if (P.falling) { setTimeout(go, 120); return; } st.stir = 1; st.wait = { t: 0, cb: (r) => { st.stir = 0; cb && cb(r); } }; };
        go();
      });
    }
    function jump(sub, T, g) { reset(); st.sub = sub; st.T = T; st.g = g; st.solid = Math.max(0, g - SOL.solu(sub, T)); const n = Math.round(st.solid * K); for (let i = 0; i < n; i++) P.add(X0 + 20 + Math.random() * (X1 - X0 - 40), WY + 30 + Math.random() * 120, 3.6 + Math.random() * 1.8, 0, 60); for (let i = 0; i < 300; i++) P.step(0.03, WY); }
    addLoop(host, (dt) => {
      st.t += dt; TW.step(dt);
      const target = Math.max(0, st.g - S100());
      if (st.g && !st.pouring) {
        if (st.solid > target && st.stir) st.solid -= (st.solid - target) * (1 - Math.exp(-dt / 0.7));
        if (Math.abs(st.solid - target) < 0.05) st.solid = target;
        const want = Math.round(st.solid * K), live = P.live; if (live > want) P.melt(Math.min(8, live - want), 0.6);
      }
      P.step(dt, WY);
      if (st.stir) st.rod += dt;
      if (st.wait) { st.wait.t += dt; if (st.wait.t > (reduce ? 0 : 2.2) && Math.abs(st.solid - target) < 0.06 && P.live === Math.round(target * K)) { const w = st.wait; st.wait = null; w.cb({ S: S100(), left: Math.max(0, st.g - S100()) }); } }
      S.begin(); white(S); desk(S, TY);
      contact(ctx, (X0 + X1) / 2, TY + 2, 400, 0.16);
      glassBack(ctx, X0, TOP, X1, TY, 16);
      // 용액 색: 황산 구리(Ⅱ)만 옅은 파랑
      const d = st.g ? st.g - st.solid : 0, f = st.sub === 'cuso4' ? clamp(d / 70, 0, 1) : 0;
      liquid(ctx, X0 + 3, X1 - 3, WY, TY - 16, `rgba(${lerp(204, 96, f)},${lerp(226, 160, f)},${lerp(245, 226, f)},${0.55 + 0.25 * f})`, `rgba(${lerp(172, 60, f)},${lerp(206, 130, f)},${lerp(236, 214, f)},${0.68 + 0.2 * f})`);
      const fill = st.sub === 'cuso4' ? '#cfe3f6' : '#fbfdff', line = st.sub === 'cuso4' ? 'rgba(40,100,170,.65)' : 'rgba(105,125,148,.6)';
      P.list.forEach((gr) => grainDraw(ctx, gr, fill, line));
      // 유리 막대로 젓기
      if (st.stir || st.wait) {
        const a = st.rod * 5, bx = (X0 + X1) / 2 - 10 + Math.cos(a) * 60, tx = (X0 + X1) / 2 + 30 + Math.cos(a) * 18;
        ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(150,170,190,.75)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(tx, TOP - 70); ctx.lineTo(bx, TY - 40); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx - 2, TOP - 66); ctx.lineTo(bx - 2, TY - 44); ctx.stroke(); ctx.restore();
      }
      // 온도계
      const tx0 = 270, ty0 = 230, tx1 = 258, ty1 = 750;
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(200,214,226,.9)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(tx0, ty0); ctx.lineTo(tx1, ty1); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 8; ctx.stroke();
      const k = clamp(st.T / 100, 0, 1), cy = lerp(700, 290, k), cx = lerp(tx1, tx0, (cy - ty1) / (ty0 - ty1));
      ctx.strokeStyle = '#3d4f63'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(tx1, ty1); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.fillStyle = '#3d4f63'; ctx.beginPath(); ctx.arc(tx1, ty1, 7, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(40,55,70,.4)'; ctx.lineWidth = 1; for (let T = 0; T <= 100; T += 10) { const y = lerp(700, 290, T / 100), x = lerp(tx1, tx0, (y - ty1) / (ty0 - ty1)); ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + (T % 50 ? 0 : 3), y); ctx.stroke(); }
      ctx.restore();
      ov.put('tr', tx0 - 4, ty0 - 24, `<b>${Math.round(st.T)}</b> ℃`, 'tx read');
      ctx.fillStyle = 'rgba(160,200,236,.18)'; ctx.fillRect(X0 + 3, WY, X1 - X0 - 6, TY - 16 - WY);
      glassFront(ctx, X0, TOP, X1, TY, 16);
      if (st.pp.on) { paper(ctx, st.pp.x, st.pp.y, st.pp.a, st.pp.m, 4); ov.put('pp', st.pp.x, st.pp.y - 30, SOL.DATA[st.sub].name, 'tx m'); } else ov.hide('pp');
      ov.put('w', X0 + 16, WY + 30, '물 100 g', 'tx nm ra');
      if (st.solid > 0.05 && !P.falling && !st.wait && st.g) ov.put('left', (X0 + X1) / 2 - 10, TY - 52 - Math.max(...Array.from(P.hgt)), `녹지 않고 남음<br>약 ${Math.round(st.solid)} g`, 'tx lefty c2'); else ov.hide('left');
    });
    return { run, reset, jump, setT, setSub, get busy() { return TW.busy || !!st.wait; } };
  }

  /* =================================================================
     6. 기체의 용해도 (해 보기): 탄산음료
     ================================================================= */
  function soda(host, o = {}) {
    const CROP = { temp: { x: 0, y: -50, w: 1000, h: 670 }, press: { x: 180, y: -40, w: 640, h: 660 } };
    const W = 1000, H = 620, S = surface(host, W, H, CROP[o.mode || 'temp']), ov = overlay(S), ctx = S.ctx, TW = tweens();
    const TY = 590;
    const SODA = ['rgba(176,170,226,.5)', 'rgba(130,122,206,.62)'];
    const st = { t: 0, mode: o.mode || 'temp', ins: 0, pull: 0, pt: 0 };
    // 온도: 시험관 두 개
    const TL = 330, TR = 22, TIR = 19, TSURF = 120, TA = 0.42;
    const TB = [{ cx: 270, hot: false, name: '찬물(약 10 ℃)', b: [] }, { cx: 730, hot: true, name: '뜨거운 물(약 60 ℃)', b: [] }];
    // 압력: 주사기
    const SY = { cx: 500, ir: 56, top: 228, bot: 540, liq: 452 };
    let sb = [];
    function tubePos(b) { const bx = b.cx - 60, by = TY - 26 - (1 - st.ins) * 300; return [bx + TL * Math.sin(TA), by - TL * Math.cos(TA)]; }
    function insert(cb) { if (st.ins > 0) return; if (reduce) { st.ins = 1; cb && cb(); return; } TW.add(1.4, (k) => (st.ins = ease(k)), () => setTimeout(() => cb && cb(), 2600)); }
    function pull(on, cb) { const a = st.pull, b = on ? 1 : 0; if (reduce) { st.pull = b; st.pt = 0; cb && cb(); return; } TW.add(1.2, (k) => (st.pull = lerp(a, b, ease(k))), () => { st.pt = 0; setTimeout(() => cb && cb(), 1800); }); }
    function reset() { TW.clear(); st.ins = 0; st.pull = 0; st.pt = 0; TB.forEach((b) => (b.b = [])); sb = []; }
    function setMode(m) { st.mode = m; S.setCrop(CROP[m]); reset(); }
    function bubbleStep(list, dt, rate, rmax, spawn, surf, up) {
      let n = rate * dt; while (n > 0) { if (Math.random() < n) list.push(Object.assign({ r: 0.4, s: 'stick', g: 0.3 + Math.random() * 0.9, rm: rmax * (0.5 + Math.random() * 0.6), v: 0 }, spawn())); n -= 1; }
      list.forEach((b) => {
        if (b.s === 'stick') { b.r += (b.rm - b.r) * dt * 3; b.g -= dt; if (b.g <= 0) b.s = 'up'; }
        else if (b.s === 'up') { b.v += (50 + b.r * 30 - b.v) * dt * 4; up(b, dt); if (b.y < surf + b.r) { b.s = 'pop'; b.k = 0; } }
        else { b.k += dt * 4; }
      });
      for (let i = list.length - 1; i >= 0; i--) if (list[i].s === 'pop' && list[i].k >= 1) list.splice(i, 1);
    }
    function bubbleDraw(list) {
      list.forEach((b) => {
        if (b.s === 'pop') { ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - b.k)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * (1 + b.k), 0, TAU); ctx.stroke(); return; }
        ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); ctx.stroke();
        if (b.r > 2) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 0, TAU); ctx.fill(); }
      });
    }
    function drawTemp(dt) {
      TB.forEach((b) => {
        const rate = st.ins < 1 ? 1.2 : b.hot ? 6 + 46 * Math.min(1, st.pt / 2.2) : 2.4, rmax = b.hot && st.ins >= 1 ? 3.2 : 2.2;
        bubbleStep(b.b, dt, rate, rmax, () => { const side = Math.random() < 0.6 ? -1 : 1; return { x: side * (TIR - 3) * Math.random(), y: TSURF + 30 + Math.random() * (TL - TSURF - 40) }; }, TSURF,
          (q, d) => { q.y -= q.v * d; q.x += (-(TIR - q.r - 1) - q.x) * d * 2.5 + gauss() * 4 * d; });
      });
      TB.forEach((b) => { const x0 = b.cx - 150, x1 = b.cx + 150; contact(ctx, b.cx, TY + 2, 340, 0.16); glassBack(ctx, x0, 270, x1, TY, 16); });
      TB.forEach((b) => {
        const x0 = b.cx - 150, x1 = b.cx + 150;
        liquid(ctx, x0 + 3, x1 - 3, 336, TY - 18, ...WATER);
        const [mx, my] = tubePos(b);
        ctx.save(); ctx.translate(mx, my); ctx.rotate(TA);
        tubeBack(ctx, TL, TR); tubeLiquid(ctx, TL, TR, TSURF, ...SODA);
        ctx.save(); tubeShape(ctx, TL, TR - 2); ctx.clip(); bubbleDraw(b.b); ctx.restore();
        tubeFront(ctx, TL, TR);
        ctx.restore();
        ctx.fillStyle = 'rgba(160,200,236,.18)'; ctx.fillRect(x0 + 3, 336, x1 - x0 - 6, TY - 18 - 336);
        if (b.hot) steam(ctx, b.cx - 50, 270, st.t, 40);
        glassFront(ctx, x0, 270, x1, TY, 16);
        ov.put('n' + b.cx, b.cx, TY + 20, b.name, 'tx tag');
        ov.put('s' + b.cx, x0 - 10, TY - 90, '탄산음료', 'tx nm sol la');
      });
    }
    function drawPress(dt) {
      const seal = lerp(SY.liq - 14, 282, st.pull), headspace = seal - 0; // 피스톤 아래쪽 끝
      const rate = st.pull > 0.5 ? 10 + 70 * Math.exp(-st.pt / 3.5) : 1.2 + 6 * st.pull;
      bubbleStep(sb, dt, rate, st.pull > 0.5 ? 3.4 : 2.2, () => ({ x: SY.cx + (Math.random() - 0.5) * (SY.ir * 2 - 10), y: SY.liq + 8 + Math.random() * (SY.bot - SY.liq - 6) }), SY.liq,
        (q, d) => { q.y -= q.v * d; q.x += gauss() * 8 * d; q.rm *= 1 + d * 0.15 * st.pull; q.r = Math.min(q.rm, q.r + d * 0.6 * st.pull); });
      contact(ctx, SY.cx, TY + 1, 140, 0.2);
      const x0 = SY.cx - SY.ir, x1 = SY.cx + SY.ir;
      // 고무마개
      let g = ctx.createLinearGradient(SY.cx - 30, 0, SY.cx + 30, 0); g.addColorStop(0, '#2f3740'); g.addColorStop(0.4, '#4b5560'); g.addColorStop(1, '#232a31');
      ctx.fillStyle = g; rr(ctx, SY.cx - 30, TY - 34, 60, 34, 6); ctx.fill();
      // 관 몸통 뒤
      ctx.fillStyle = 'rgba(236,242,247,.55)'; ctx.fillRect(x0 - 4, SY.top, x1 - x0 + 8, SY.bot - SY.top);
      ctx.fillRect(SY.cx - 9, SY.bot, 18, TY - 34 - SY.bot + 4);
      // 탄산음료
      g = ctx.createLinearGradient(0, SY.liq, 0, SY.bot); g.addColorStop(0, SODA[0]); g.addColorStop(1, SODA[1]);
      ctx.fillStyle = g; ctx.fillRect(x0, SY.liq, x1 - x0, SY.bot - SY.liq); ctx.fillRect(SY.cx - 7, SY.bot, 14, TY - 34 - SY.bot + 2);
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, SY.liq); ctx.lineTo(x1, SY.liq); ctx.stroke();
      // 거품 띠
      const foam = clamp(sb.length / 60, 0, 1);
      if (foam > 0.05) { const r = U.rng(3); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.strokeStyle = 'rgba(255,255,255,.95)'; for (let i = 0; i < 40 * foam; i++) { ctx.beginPath(); ctx.arc(x0 + 4 + r() * (x1 - x0 - 8), SY.liq - 2 - r() * 7 * foam, 1.5 + r() * 2.4, 0, TAU); ctx.fill(); ctx.stroke(); } }
      ctx.save(); ctx.beginPath(); ctx.rect(x0, SY.liq - 10, x1 - x0, SY.bot - SY.liq + 10); ctx.clip(); bubbleDraw(sb); ctx.restore();
      // 피스톤 고무와 막대
      const sealTop = seal - 20;
      ctx.fillStyle = '#c2cad2'; rr(ctx, SY.cx - 9, sealTop - 270, 18, 270, 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(SY.cx - 6, sealTop - 266, 3, 262);
      g = ctx.createLinearGradient(0, sealTop - 288, 0, sealTop - 270); g.addColorStop(0, '#e2e7ec'); g.addColorStop(1, '#a9b4bf');
      ctx.fillStyle = g; rr(ctx, SY.cx - 52, sealTop - 288, 104, 18, 7); ctx.fill(); ctx.strokeStyle = 'rgba(20,38,59,.2)'; ctx.lineWidth = 1; ctx.stroke();
      g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#262d34'); g.addColorStop(0.35, '#4a545e'); g.addColorStop(1, '#20262c');
      ctx.fillStyle = g; rr(ctx, x0 + 1, sealTop, x1 - x0 - 2, 20, 4); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x0 + 1, sealTop + 6, x1 - x0 - 2, 2); ctx.fillRect(x0 + 1, sealTop + 13, x1 - x0 - 2, 2);
      // 관 앞면
      ctx.strokeStyle = 'rgba(115,135,155,.7)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0 - 4, SY.top); ctx.lineTo(x0 - 4, SY.bot); ctx.lineTo(SY.cx - 9, SY.bot + 8); ctx.lineTo(SY.cx - 9, TY - 32); ctx.moveTo(x1 + 4, SY.top); ctx.lineTo(x1 + 4, SY.bot); ctx.lineTo(SY.cx + 9, SY.bot + 8); ctx.lineTo(SY.cx + 9, TY - 32); ctx.stroke();
      g = ctx.createLinearGradient(0, SY.top - 10, 0, SY.top + 4); g.addColorStop(0, '#f0f3f6'); g.addColorStop(1, '#c4cdd6');
      ctx.fillStyle = g; rr(ctx, SY.cx - 110, SY.top - 10, 220, 14, 6); ctx.fill(); ctx.strokeStyle = 'rgba(20,38,59,.2)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = 'rgba(40,55,70,.5)'; ctx.lineWidth = 1;
      for (let y = SY.bot - 10, i = 0; y > SY.top + 20; y -= 14, i++) { ctx.beginPath(); ctx.moveTo(x0 + 2, y); ctx.lineTo(x0 + (i % 5 ? 12 : 22), y); ctx.stroke(); }
      g = ctx.createLinearGradient(x0, 0, x0 + 22, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x1 - 26, SY.top + 6, 20, SY.bot - SY.top - 10);
      ov.put('pl', x1 + 26, sealTop - 140, st.pull > 0.97 ? '피스톤을 <b>잡아당긴 뒤</b>' : st.pull < 0.03 ? '피스톤을 잡아당기기 <b>전</b>' : '피스톤을 잡아당기는 중', 'tx cap ra');
      ov.put('sl', x0 - 14, (SY.liq + SY.bot) / 2, '탄산음료', 'tx nm sol la');
      ov.put('cp', SY.cx + 40, TY - 16, '고무마개', 'tx m ra');
    }
    addLoop(host, (dt) => {
      st.t += dt; TW.step(dt); st.pt += dt;
      if (st.mode === 'temp' && st.ins < 1) st.pt = 0;
      S.begin(); white(S); desk(S, TY);
      ['pl', 'sl', 'cp'].forEach((k) => st.mode === 'temp' && ov.hide(k));
      TB.forEach((b) => st.mode === 'press' && (ov.hide('n' + b.cx), ov.hide('s' + b.cx)));
      if (st.mode === 'temp') drawTemp(dt); else drawPress(dt);
    });
    return { insert, pull, reset, setMode, get st() { return st; }, get busy() { return TW.busy; } };
  }

  Object.assign(SOL, { tube, beaker, soda });
})();
