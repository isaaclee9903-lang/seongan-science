/* ===== 순물질과 혼합물 그림 도구 (캔버스 2D, SOL._·MB._ 도구를 빌려 씀) =====
   MIX.SUBS                       물질별 입자 모형 자료 (한 가지 색 입자 = 한 가지 물질)
   MIX.lensCore(o)                입자 돋보기 한 개: set(물질), pour(종류, 수), stir(), settle(k), step(dt), draw(ctx, cx, cy, R)
   MIX.lens(host, o)              돋보기 한 개를 그 칸에 그림 (o.sub, o.W, o.H, o.cx, o.cy, o.R)
   MIX.ws(host)                   해보기: 물과 소금물을 가열·냉각하며 온도-시간 그래프 그리기 (교과서 그래프 모양)
   MIX.sample(host)               탐구 활동 2: 컵에 담긴 물질 그림 + 입자 돋보기, 흙탕물 가만히 두기
   MIX.sketch(id)                 탐구 활동 2 조사 카드의 온도 그래프 모양(SVG 문자열)
   입자 움직임은 Matter.js(MIT, brm.io/matter-js)로 계산한다. 불러오지 못하면 간단한 자체 계산으로 대신한다.
   그림 원칙: 흰 바탕, 라스 파랑 한 색조 + 무채색, 매트한 질감, 얇은 선. 그림 속 글씨는 HTML 이름표.
   입자 크기·수·빠르기, 가열 시간, 기포 수는 보기 좋게 정한 모형. 물 100.0 ℃·0 ℃, 염화 나트륨 802.0 ℃만 교과서 값. */
window.MIX = (() => {
  const U = SOL._, M = MB._;
  const { surface, overlay, addLoop, rr, white, desk, contact, glassBack, glassFront, clamp, lerp, gauss, TAU, BLUE, reduce, rng } = U;
  const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1).replace('-', '−');

  /* ---- 입자 조각 (용해도 수업과 같은 그림 말) ---- */
  function sprite(r, c0, c1, c2) {
    const s = 3, w = Math.ceil(r * 2 + 6), cv = document.createElement('canvas'); cv.width = w * s; cv.height = w * s;
    const c = cv.getContext('2d'); c.scale(s, s); c.translate(w / 2, w / 2);
    const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r); g.addColorStop(0, c0); g.addColorStop(0.6, c1); g.addColorStop(1, c2);
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(20,38,59,.18)'; c.lineWidth = 0.8; c.stroke();
    return { cv, w };
  }
  function soilSprite(r, seed) {
    const s = 3, w = Math.ceil(r * 2.6 + 6), cv = document.createElement('canvas'); cv.width = w * s; cv.height = w * s;
    const c = cv.getContext('2d'); c.scale(s, s); c.translate(w / 2, w / 2);
    const R = rng(seed), n = 7, pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU + (R() - 0.5) * 0.5, d = r * (0.8 + R() * 0.35); pts.push([Math.cos(a) * d, Math.sin(a) * d]); }
    const g = c.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r * 1.2); g.addColorStop(0, '#d2c3ad'); g.addColorStop(0.6, '#a38e72'); g.addColorStop(1, '#76644f');
    c.fillStyle = g; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(60,45,30,.25)'; c.lineWidth = 0.8; c.stroke();
    c.fillStyle = 'rgba(70,55,40,.25)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc((R() - 0.5) * r, (R() - 0.5) * r, 0.9, 0, TAU); c.fill(); }
    return { cv, w };
  }
  // 입자 종류: a 파랑, b 노랑, c 회청, d 연회색, s 흙 알갱이
  const KIND = {
    a: { r: 12, sp: () => sprite(12, '#b9d7f3', '#5b97d6', '#2a62a6') },
    b: { r: 11, sp: () => sprite(11, '#fff6d2', '#f0d26a', '#c09a2c') },
    c: { r: 11, sp: () => sprite(11, '#e8edf2', '#8796a6', '#4c5b6b') },
    d: { r: 10, sp: () => sprite(10, '#ffffff', '#e2e7ed', '#a3afbc') },
    s: { r: 16, sp: () => soilSprite(16, 5) },
  };
  const SPR = {};
  const spr = (k) => SPR[k] || (SPR[k] = KIND[k].sp());
  const DOT = { a: 'a', b: 'b', c: 'c', d: 'd', s: 's' };

  /* ---- 물질 자료: st 상태(gas·liq·sol), parts [[종류, 이름, 수]] ---- */
  const SUBS = {
    water: { name: '물', st: 'liq', pure: true, parts: [['a', '물', 120]] },
    sugar: { name: '설탕', st: 'sol', pure: true, parts: [['b', '설탕', 0]] },
    sugarwater: { name: '설탕물', st: 'liq', pure: false, parts: [['a', '물', 101], ['b', '설탕', 18]] },
    saltwater: { name: '소금물', st: 'liq', pure: false, parts: [['a', '물', 101], ['b', '염화 나트륨', 18]] },
    oxygen: { name: '산소', st: 'gas', pure: true, parts: [['c', '산소', 20]] },
    co2: { name: '이산화 탄소', st: 'gas', pure: true, parts: [['d', '이산화 탄소', 20]] },
    nacl: { name: '염화 나트륨', st: 'sol', pure: true, parts: [['b', '염화 나트륨', 0]] },
    air: { name: '공기', st: 'gas', pure: false, parts: [['a', '다른 기체', 14], ['c', '산소', 5], ['d', '이산화 탄소', 2]] },
    seawater: { name: '바닷물', st: 'liq', pure: false, parts: [['a', '물', 99], ['b', '염화 나트륨', 12], ['c', '다른 물질', 6]] },
    juice: { name: '과일주스', st: 'liq', pure: false, parts: [['a', '물', 96], ['b', '설탕', 13], ['c', '다른 물질', 5], ['d', '다른 물질', 5]] },
    rock: { name: '암석', st: 'sol', pure: false, parts: [['a', '광물 ㉠', 0], ['b', '광물 ㉡', 0], ['c', '광물 ㉢', 0]], grains: true },
    soda: { name: '탄산음료', st: 'liq', pure: false, parts: [['a', '물', 99], ['b', '설탕', 12], ['d', '이산화 탄소', 8], ['c', '다른 물질', 4]] },
    milk: { name: '우유', st: 'liq', pure: false, parts: [['a', '물', 96], ['d', '다른 물질', 12], ['c', '다른 물질', 9]] },
    antifreeze: { name: '부동액', st: 'liq', pure: false, parts: [['a', '물', 73], ['c', '물에 섞은 물질', 44]] },
    muddy: { name: '흙탕물', st: 'liq', pure: false, parts: [['a', '물', 96], ['s', '흙', 8]] },
  };

  /* ---- 입자 움직임 계산: Matter.js가 있으면 쓰고, 없으면 자체 계산 ---- */
  const LR = 176; // 돋보기 안쪽 반지름(계산 좌표)
  function physics() {
    const MJ = window.Matter;
    if (MJ && MJ.Engine) {
      const { Engine, Bodies, Composite, Body } = MJ;
      const eng = Engine.create({ enableSleeping: false }); eng.gravity.y = 0;
      const ring = [], N = 44;
      for (let i = 0; i < N; i++) { const a = i / N * TAU, w = TAU * (LR + 30) / N * 1.15; ring.push(Bodies.rectangle(Math.cos(a) * (LR + 30), Math.sin(a) * (LR + 30), 60, w, { isStatic: true, angle: a })); }
      Composite.add(eng.world, ring);
      return {
        lib: 'matter',
        add(p, o) { p.body = Bodies.circle(p.x, p.y, p.r, Object.assign({ friction: 0, frictionStatic: 0, inertia: Infinity, slop: 0.02 }, o)); Body.setVelocity(p.body, { x: p.vx || 0, y: p.vy || 0 }); Composite.add(eng.world, p.body); },
        remove(p) { if (p.body) Composite.remove(eng.world, p.body); p.body = null; },
        setVel(p, vx, vy) { Body.setVelocity(p.body, { x: vx, y: vy }); },
        step(list, g) {
          eng.gravity.y = 0;
          list.forEach((p) => { if (p.body && p.g) Body.setVelocity(p.body, { x: p.body.velocity.x, y: p.body.velocity.y + p.g }); });
          Engine.update(eng, 1000 / 60);
          list.forEach((p) => { if (!p.body) return; p.x = p.body.position.x; p.y = p.body.position.y; p.vx = p.body.velocity.x; p.vy = p.body.velocity.y;
            const d = Math.hypot(p.x, p.y); if (d > LR - p.r + 2) { Body.setPosition(p.body, { x: p.x / d * (LR - p.r), y: p.y / d * (LR - p.r) }); } });
        },
      };
    }
    return {
      lib: 'self',
      add(p, o) { p.rest = o.restitution != null ? o.restitution : 0.3; p.air = o.frictionAir || 0; },
      remove() {},
      setVel(p, vx, vy) { p.vx = vx; p.vy = vy; },
      step(list) {
        list.forEach((p) => { p.vy += p.g || 0; p.vx *= 1 - p.air; p.vy *= 1 - p.air; p.x += p.vx; p.y += p.vy; });
        for (let it = 0; it < 2; it++) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
          const A = list[i], B = list[j], dx = B.x - A.x, dy = B.y - A.y, md = A.r + B.r, d2 = dx * dx + dy * dy;
          if (d2 >= md * md || d2 < 1e-6) continue;
          const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, push = (md - d) / 2;
          A.x -= nx * push; A.y -= ny * push; B.x += nx * push; B.y += ny * push;
          const rv = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny; if (rv < 0) { const k = -rv * (1 + Math.min(A.rest, B.rest)) / 2; A.vx -= nx * k; A.vy -= ny * k; B.vx += nx * k; B.vy += ny * k; }
        }
        list.forEach((p) => { const d = Math.hypot(p.x, p.y), m = LR - p.r; if (d > m) { const nx = p.x / d, ny = p.y / d; p.x = nx * m; p.y = ny * m; const vn = p.vx * nx + p.vy * ny; if (vn > 0) { p.vx -= (1 + p.rest) * vn * nx; p.vy -= (1 + p.rest) * vn * ny; } } });
      },
    };
  }

  /* =================================================================
     입자 돋보기
     ================================================================= */
  function lensCore(o = {}) {
    let P = physics(), list = [], fixed = [], sub = null, t = 0, stirT = 0, settleK = 0, surfY = -LR;
    const R0 = rng(o.seed || 3);
    function clear() { list.forEach((p) => P.remove(p)); list = []; fixed = []; }
    function addFree(k, x, y, st) {
      const r = KIND[k].r, p = { k, r, x, y, vx: 0, vy: 0, g: 0, rot: R0() * TAU };
      if (st === 'gas') { const a = R0() * TAU, v = 2.6 + R0() * 1.4; p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v; P.add(p, { restitution: 1, frictionAir: 0 }); }
      else { p.g = k === 's' ? 0.16 : 0.12; P.add(p, { restitution: 0.15, frictionAir: 0.03, density: k === 's' ? 0.004 : 0.001 }); }
      list.push(p); return p;
    }
    function spots(n, st, top) {
      // 겹치지 않는 처음 자리
      const out = [], R = LR - 14;
      let tries = 0;
      while (out.length < n && tries++ < 30000) {
        const a = R0() * TAU, d = Math.sqrt(R0()) * R, x = Math.cos(a) * d, y = Math.sin(a) * d;
        if (st === 'liq' && y < top) continue;
        if (out.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 < (st === 'gas' ? 34 * 34 : 22 * 22))) continue;
        out.push([x, y]);
      }
      return out;
    }
    function set(id) {
      sub = SUBS[id]; clear(); queue = []; extra = []; stirT = 0; settleK = 0; t = 0;
      if (sub.st === 'sol') {
        // 고체: 촘촘한 격자. 암석은 알갱이(광물)마다 다른 입자
        const r = 11, dx = 2 * r + 1.5, dy = dx * 0.866, seeds = [];
        if (sub.grains) { const R = rng(9); for (let i = 0; i < 7; i++) seeds.push([(R() - 0.5) * 2 * LR * 0.9, (R() - 0.5) * 2 * LR * 0.9, sub.parts[i % 3][0]]); }
        for (let row = -10; row <= 10; row++) for (let col = -10; col <= 10; col++) {
          const x = col * dx + (row & 1 ? dx / 2 : 0), y = row * dy;
          if (Math.hypot(x, y) > LR - r - 2) continue;
          let k = sub.parts[0][0];
          if (seeds.length) { let best = 1e9; seeds.forEach(([sx, sy, sk]) => { const dd = (sx - x) ** 2 + (sy - y) ** 2; if (dd < best) { best = dd; k = sk; } }); }
          fixed.push({ k, r, x, y, hx: x, hy: y, ph: R0() * TAU });
        }
        return;
      }
      const tot = sub.parts.reduce((s, q) => s + q[2], 0);
      const top = sub.st === 'liq' ? -LR * 0.62 : -LR;
      const pts = spots(tot, sub.st, top);
      const kinds = []; sub.parts.forEach(([k, , n]) => { for (let i = 0; i < n; i++) kinds.push(k); });
      for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(R0() * (i + 1)); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
      pts.forEach(([x, y], i) => addFree(kinds[i] || kinds[0], x, y, sub.st));
      // 처음 모습을 미리 몇 번 계산해 둠
      for (let i = 0; i < 40; i++) stepOnce(1 / 60);
    }
    // 설탕 넣기처럼 위에서 입자를 하나씩 떨어뜨림
    let queue = [];
    let extra = [];
    function pour(k, n, nm) { if (nm) extra.push([k, nm]); for (let i = 0; i < n; i++) queue.push({ k, at: t + 0.15 + i * 0.12 }); }
    // 젓기: 넣은 입자와 액체 속 고르게 떨어진 입자(가장 먼 점 고르기)가 자리를 맞바꾸며 섞임
    function stir(sec = 3) {
      stirT = sec;
      const ex = list.filter((p) => p.poured), base = list.filter((p) => !p.poured && p.y > surfY + 20), pick = [];
      if (!ex.length || !base.length) return;
      pick.push(base[Math.floor(R0() * base.length)]);
      while (pick.length < Math.min(ex.length, base.length)) {
        let best = null, bd = -1;
        base.forEach((q) => { if (pick.includes(q)) return; const d = Math.min(...pick.map((r) => (r.x - q.x) ** 2 + (r.y - q.y) ** 2), ...ex.filter((e) => e.y > surfY + 20 && !e.tg).map((e) => (e.x - q.x) ** 2 + (e.y - q.y) ** 2 + 1e9)); if (d > bd) { bd = d; best = q; } });
        pick.push(best);
      }
      ex.forEach((p, i) => { const q = pick[i % pick.length]; p.tg = [q.x, q.y]; q.tg = [p.x, Math.max(p.y, surfY + 20)]; });
    }
    function settle(k) { settleK = k; }
    function stepOnce(dt) {
      if (!sub) return;
      t += dt;
      if (sub.st === 'gas') {
        list.forEach((p) => { const v = Math.hypot(p.vx, p.vy); if (v < 2.2 || v > 5) { const s = (v < 2.2 ? 2.8 : 4.4) / (v || 1); P.setVel(p, p.vx * s || 3, p.vy * s); } });
      } else if (sub.st === 'liq') {
        // 액체: 아래로 모이면서 제자리에서 흔들리고 서로 자리를 바꿈
        const kick = reduce ? 0.12 : 0.38;
        list.forEach((p) => {
          let vx = p.vx + gauss() * kick, vy = p.vy + gauss() * kick;
          if (p.k === 's') { vx = p.vx * 0.9 + gauss() * kick * (1 - settleK) * 0.6; vy = p.vy + gauss() * kick * (1 - settleK) * 0.6 + settleK * 0.9; p.g = 0.06 + settleK * 0.4; }
          if (stirT > 0) { const d = Math.hypot(p.x, p.y) || 1, k2 = 0.12 * Math.min(1, stirT); vx += (-p.y / d) * k2 + gauss() * 0.3; vy += (p.x / d) * k2 * 0.5 + gauss() * 0.3; }
          if (p.tg && stirT > 0) { vx = vx * 0.6 + (p.tg[0] - p.x) * 0.05; vy = vy * 0.6 + (p.tg[1] - p.y) * 0.05; } else if (p.tg) p.tg = null;
          if (vy < -2.2 && !(p.tg && stirT > 0)) vy = -2.2; if (p.y < surfY + 4 && vy < 0) vy *= 0.5;
          P.setVel(p, vx, vy);
        });
        stirT = Math.max(0, stirT - dt);
      }
      P.step(list);
    }
    function step(dt) { if (!sub) return; if (sub.st === 'sol') { t += dt; return; } stepOnce(dt); }
    function draw(ctx, cx, cy, R, opt = {}) {
      const k = R / LR;
      ctx.save(); ctx.shadowColor = 'rgba(20,38,59,.16)'; ctx.shadowBlur = 16 * k + 4; ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, R + 3, 0, TAU); ctx.fill(); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
      let g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.45, R * 0.1, cx, cy, R); g.addColorStop(0, '#fbfdff'); g.addColorStop(1, '#eaf2f9');
      ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      ctx.translate(cx, cy); ctx.scale(k, k);
      if (sub && sub.st === 'liq' && list.length) {
        // 액체 면: 위쪽 입자 높이를 부드럽게 따라감
        const ys = list.filter((p) => p.k !== 's' && p.y > -LR + 70).map((p) => p.y).sort((a, b) => a - b);
        const target = (ys[Math.min(ys.length - 1, 3)] || 0) - 16; surfY += (target - surfY) * 0.08;
        g = ctx.createLinearGradient(0, surfY, 0, LR); g.addColorStop(0, 'rgba(206,226,244,.55)'); g.addColorStop(1, 'rgba(178,208,236,.6)');
        ctx.fillStyle = g; ctx.fillRect(-LR, surfY, 2 * LR, 2 * LR);
        ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-LR, surfY); ctx.lineTo(LR, surfY); ctx.stroke();
        ctx.strokeStyle = 'rgba(90,140,190,.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-LR, surfY + 3); ctx.lineTo(LR, surfY + 3); ctx.stroke();
      }
      if (sub && sub.st === 'sol') {
        const amp = reduce ? 0 : 0.9;
        fixed.forEach((p) => { const sp = spr(p.k); ctx.drawImage(sp.cv, p.hx + Math.sin(t * 17 + p.ph) * amp - sp.w / 2, p.hy + Math.cos(t * 13 + p.ph) * amp - sp.w / 2, sp.w, sp.w); });
      }
      list.forEach((p) => { const sp = spr(p.k); if (p.k === 's') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.drawImage(sp.cv, -sp.w / 2, -sp.w / 2, sp.w, sp.w); ctx.restore(); } else ctx.drawImage(sp.cv, p.x - sp.w / 2, p.y - sp.w / 2, sp.w, sp.w); });
      ctx.restore();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, 4 * k); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(20,38,59,.22)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, TAU); ctx.stroke();
    }
    function tickDrops() {
      while (queue.length && queue[0].at <= t) { const q = queue.shift(); const p = addFree(q.k, (R0() - 0.5) * 240, -LR + 30 + R0() * 20, 'liq'); p.poured = true; P.setVel(p, gauss() * 0.8, 2.5); }
    }
    if (o.sub) set(o.sub);
    return {
      set, pour, stir, settle,
      step(dt) { tickDrops(); step(dt); },
      draw,
      get sub() { return sub; },
      legend() {
        if (!sub) return '';
        const by = []; sub.parts.concat(extra).forEach(([k, nm]) => { const e = by.find((x) => x[0] === nm); if (e) { if (!e[1].includes(k)) e[1].push(k); } else by.push([nm, [k]]); });
        return by.map(([nm, ks]) => ks.map((k) => `<i class="pd ${DOT[k]}"></i>`).join('') + nm).join('<br>');
      },
      get lib() { return P.lib; },
    };
  }

  // 돋보기 한 개짜리 그림 칸
  function lens(host, o = {}) {
    const W = o.W || 400, H = o.H || 400, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx;
    const C = lensCore(o), cx = o.cx || W / 2, cy = o.cy || H / 2, R = o.R || Math.min(W, H) / 2 - 12;
    addLoop(host, (dt) => {
      C.step(dt);
      S.begin(); if (!o.clear) white(S); else ctx.clearRect(-W, -H, 3 * W, 3 * H);
      C.draw(ctx, cx, cy, R);
      if (o.legend) ov.put('lg', o.legend[0], o.legend[1], C.legend(), 'tx key ra'); else ov.hide('lg');
      o.onDraw && o.onDraw(ctx, ov);
    });
    return C;
  }

  /* =================================================================
     해보기: 물과 소금물의 끓는점과 어는점 (교과서 그래프 모양)
     ================================================================= */
  // u: 0~1 (가열·냉각 시간 비율). 소금물 값은 그래프 모양을 위한 값(화면 글에는 숫자로 쓰지 않음)
  const CURVE = {
    heat: { water: (u) => (u < 0.32 ? 97 + 3 * u / 0.32 : 100), salt: (u) => (u < 0.36 ? 96.9 + 4.6 * u / 0.36 : 101.5 + 1.0 * (u - 0.36) / 0.64), kw: 0.32, ks: 0.36, y0: 95, y1: 105, ys: 5, minor: 1 },
    cool: { water: (u) => (u < 0.22 ? 6.5 - 6.5 * u / 0.22 : 0), salt: (u) => (u < 0.34 ? 6.5 - 12.1 * u / 0.34 : -5.6 - 2.9 * (u - 0.34) / 0.66), kw: 0.22, ks: 0.34, y0: -12, y1: 8, ys: 4, minor: 2 },
  };
  function iceCube(ctx, x, y, s, a, alpha = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(-s, -s, s, s); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(206,224,240,.9)');
    ctx.fillStyle = g; rr(ctx, -s, -s * 0.85, 2 * s, 1.7 * s, s * 0.3); ctx.fill();
    ctx.strokeStyle = 'rgba(130,160,190,.55)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-s * 0.6, -s * 0.5); ctx.lineTo(s * 0.2, -s * 0.55); ctx.stroke();
    ctx.restore();
  }
  // 얼음: 수면과 벽에서 안쪽으로 자라는 흰 얼음 층. 소금물은 얇은 층과 떠다니는 얼음 조각
  const FLK = (() => { const r = rng(31), a = []; for (let i = 0; i < 26; i++) a.push([r(), r(), r(), r()]); return a; })();
  function frost(ctx, x0, x1, top, bot, f, slush) {
    if (f <= 0) return;
    const w = x1 - x0, k = Math.min(1, f);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, top, w, bot - top); ctx.clip();
    const th = (slush ? 7 : 26) * k + 2, side = (slush ? 3 : 14) * k;
    const jag = (n, y0, amp, ph) => { for (let i = 0; i <= n; i++) { const x = x0 + w * i / n; ctx.lineTo(x, y0 + Math.sin(i * 1.7 + ph) * amp + Math.sin(i * 0.6) * amp * 0.6); } };
    let g = ctx.createLinearGradient(0, top, 0, top + th + 10); g.addColorStop(0, 'rgba(255,255,255,.96)'); g.addColorStop(1, 'rgba(236,244,251,.9)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x1, top); ctx.lineTo(x1, top + th); jag(10, top + th, 1.6, 0.4); ctx.lineTo(x0, top); ctx.closePath();
    // 벽을 따라 자라는 얼음
    ctx.moveTo(x0, top); ctx.lineTo(x0 + side, top); for (let y = top; y <= bot; y += 10) ctx.lineTo(x0 + side + Math.sin(y * 0.3) * 1.5, y); ctx.lineTo(x0, bot); ctx.closePath();
    ctx.moveTo(x1, top); ctx.lineTo(x1 - side, top); for (let y = top; y <= bot; y += 10) ctx.lineTo(x1 - side - Math.sin(y * 0.3 + 1) * 1.5, y); ctx.lineTo(x1, bot); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(150,180,210,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, top + th); jag(10, top + th, 1.6, 0.4); ctx.stroke();
    if (slush) {
      // 소금물: 얇은 얼음 조각이 떠다님(얼음과 물이 섞인 모습)
      FLK.forEach(([a, b, c, d], i) => {
        if (c > k * 1.05) return;
        const x = x0 + 8 + a * (w - 16), y = top + th + 6 + b * (bot - top - th - 16), s2 = 3 + d * 4;
        ctx.save(); ctx.translate(x, y); ctx.rotate(d * 3); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.strokeStyle = 'rgba(150,180,210,.5)'; ctx.lineWidth = 0.8;
        rr(ctx, -s2, -s2 * 0.45, 2 * s2, s2 * 0.9, 1.5); ctx.fill(); ctx.stroke(); ctx.restore();
      });
    }
    ctx.restore();
  }
  // 해보기 그래프 한 개 (교과서처럼 가로축 숫자 없음)
  function wsDraw(ctx, ov, pre, mode, u, run, box) {
    const C = CURVE[mode], { x, y, w, h } = box;
    const X = (k) => x + w * k, Y = (v) => y + h - h * (v - C.y0) / (C.y1 - C.y0);
    ctx.fillStyle = '#fbfcfe'; ctx.fillRect(x, y, w, h);
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) { ctx.strokeStyle = '#e6ecf2'; ctx.beginPath(); ctx.moveTo(X(i / 10), y); ctx.lineTo(X(i / 10), y + h); ctx.stroke(); }
    for (let v = C.y0; v <= C.y1 + 1e-6; v += C.minor) { ctx.strokeStyle = (v - C.y0) % C.ys === 0 ? '#dbe3eb' : '#eef2f6'; ctx.beginPath(); ctx.moveTo(x, Y(v)); ctx.lineTo(x + w, Y(v)); ctx.stroke(); }
    ctx.strokeStyle = '#8b9aab'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + h); ctx.lineTo(x + w + 6, y + h); ctx.stroke();
    for (let v = -12; v <= 105; v += 1) {
      if (v >= C.y0 && v <= C.y1 && (v - C.y0) % C.ys === 0) ov.put(pre + 'yt' + v, x - 8, Y(v), String(v).replace('-', '−'), 'tk2 la'); else ov.hide(pre + 'yt' + v);
    }
    ov.put(pre + 'y0l', x - 8, y + h + 22, '0', 'tk2 la');
    ov.put(pre + 'yl', x - 4, y - 24, '온도(℃)', 'tx m ra sc2');
    ov.put(pre + 'xl', x + w, y + h + 30, mode === 'heat' ? '가열 시간(분)' : '냉각 시간(분)', 'tx m la sc2');
    const n = 120;
    const line = (who, col, wd) => {
      ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let i = 0; i <= n; i++) { const uu = u * i / n; const px = X(uu), py = Y(C[who](uu)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    };
    if (u > 0) { line('salt', '#5d6c7c', 2.6); line('water', BLUE, 3); }
    const dot = (who, col) => { const px = X(u), py = Y(C[who](u)); ctx.fillStyle = '#fff'; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, 5.5, 0, TAU); ctx.fill(); ctx.stroke(); };
    if (run) { dot('salt', '#5d6c7c'); dot('water', BLUE); }
    // 끓기 시작 · 얼기 시작: 꺾이는 곳에 점과 가는 점선
    ['kw', 'ks'].forEach((key) => {
      const uk = C[key], who = key === 'kw' ? 'water' : 'salt';
      if (u < uk) return;
      const px = X(uk), py = Y(C[who](uk));
      ctx.strokeStyle = 'rgba(20,38,59,.45)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, y + h); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#14263b'; ctx.beginPath(); ctx.arc(px, py, 3.2, 0, TAU); ctx.fill();
    });
    if (u >= Math.min(C.kw, C.ks)) ov.put(pre + 'mk', X(Math.max(C.kw, C.ks)) + 8, mode === 'heat' ? Y(103.6) : Y(-10.4), mode === 'heat' ? '끓기 시작' : '얼기 시작', 'tx gl ra'); else ov.hide(pre + 'mk');
    // 선 이름표: 그래프 오른쪽 끝 가까이, 물은 선 아래(가열)·위(냉각), 소금물은 반대쪽
    if (u > 0.05) {
      const up = mode === 'heat', lu = Math.max(0.6, u - 0.1);
      if (u >= 0.6) { ov.put(pre + 'lw', X(lu), Y(C.water(lu)) + (up ? 16 : -16), '물', 'tx gl on'); ov.put(pre + 'ls', X(lu), Y(C.salt(lu)) + (up ? -18 : 18), '소금물', 'tx gl'); }
      else { ov.put(pre + 'lw', X(u) + 10, Y(C.water(u)) + (up ? 14 : -14), '물', 'tx gl on ra'); ov.put(pre + 'ls', X(u) + 10, Y(C.salt(u)) + (up ? -16 : 16), '소금물', 'tx gl ra'); }
    } else { ov.hide(pre + 'lw'); ov.hide(pre + 'ls'); }
    ov.put(pre + 'gh', x + w / 2, y - 52, mode === 'heat' ? '가열할 때의 온도 변화' : '냉각할 때의 온도 변화', 'tx nm');
  }
  // 읽기용: 가열·냉각 그래프 두 개를 나란히 그림
  function wsGraphs(host) {
    const W = 1000, H = 440, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx;
    const st = { u: 0, run: false, done: null };
    addLoop(host, (dt) => {
      if (st.run) { st.u = Math.min(1, st.u + dt / 6); if (st.u >= 1) { st.run = false; const d = st.done; st.done = null; d && d(); } }
      S.begin(); white(S);
      wsDraw(ctx, ov, 'h', 'heat', st.u, st.run, { x: 80, y: 80, w: 360, h: 290 });
      wsDraw(ctx, ov, 'c', 'cool', st.u, st.run, { x: 580, y: 80, w: 360, h: 290 });
    });
    return { play(done) { st.u = 0; st.run = true; st.done = done; }, show() { st.u = 1; st.run = false; }, get st() { return st; } };
  }
  function ws(host, o = {}) {
    const W = 1000, H = 600, S = surface(host, W, H, { x: 0, y: 40, w: 1000, h: 556 }), ov = overlay(S), ctx = S.ctx;
    const DUR = o.dur || 11; // 화면 시간(초)
    const st = { mode: 'heat', u: 0, run: false, done: null, heat: 0, keep: { heat: false, cool: false } };
    const B = { water: M.bubbles(), salt: M.bubbles() }, SM = M.steam();
    const DESK = 548;
    const BK = { water: [128, 238], salt: [282, 392] };
    function set(mode) { st.mode = mode; st.u = 0; st.run = false; st.heat = 0; B.water.clear(); B.salt.clear(); SM.clear(); }
    function start(done, onTick) { if (st.run) return; st.u = 0; st.run = true; st.done = done; st.onTick = onTick; }
    function jump(mode, u) { set(mode); st.u = u; st.heat = 1; }
    const T = (who, u) => CURVE[st.mode][who](u);
    function beakerAt(key, bot, lvl, top) {
      const [x0, x1] = BK[key];
      glassBack(ctx, x0, top, x1, bot, 10);
      const g = ctx.createLinearGradient(0, lvl, 0, bot); g.addColorStop(0, 'rgba(206,227,246,.6)'); g.addColorStop(1, 'rgba(172,206,236,.72)');
      ctx.fillStyle = g; rr(ctx, x0 + 3, lvl, x1 - x0 - 6, bot - lvl - 3, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0 + 3, lvl); ctx.lineTo(x1 - 3, lvl); ctx.stroke();
    }
    function drawHeat() {
      const top = 470, bot = top + 2, btop = 318, lvl = 372;
      M.hotplate(ctx, 260, top, st.heat, 360);
      ['water', 'salt'].forEach((k) => {
        beakerAt(k, bot, lvl, btop);
        ctx.save(); ctx.beginPath(); ctx.rect(BK[k][0] + 3, lvl, BK[k][1] - BK[k][0] - 6, bot - lvl); ctx.clip(); B[k].draw(ctx); ctx.restore();
      });
      ['water', 'salt'].forEach((k) => glassFront(ctx, BK[k][0], btop, BK[k][1], bot, 10, 12, false));
      SM.draw(ctx);
      ov.put('nmH', 260, top + 102, '핫플레이트', 'tx nm sol');
      return { bot, lvl };
    }
    function drawCool() {
      const bx0 = 70, bx1 = 450, by0 = 330, by1 = DESK - 2, wl = 372, btop = 300, bot = by1 - 14, lvl = 360;
      contact(ctx, 260, DESK + 2, 420, 0.18);
      glassBack(ctx, bx0, by0, bx1, by1, 26);
      // 큰 그릇 속 얼음물(뒤쪽 얼음)
      let g = ctx.createLinearGradient(0, wl, 0, by1); g.addColorStop(0, 'rgba(214,232,247,.5)'); g.addColorStop(1, 'rgba(190,216,240,.62)');
      ctx.fillStyle = g; rr(ctx, bx0 + 3, wl, bx1 - bx0 - 6, by1 - wl - 3, 22); ctx.fill();
      [[98, 392, 0.3], [422, 398, -0.2], [260, 396, 0.1]].forEach(([x, y, a]) => iceCube(ctx, x, y, 16, a));
      ['water', 'salt'].forEach((k) => {
        beakerAt(k, bot, lvl, btop);
        const [x0, x1] = BK[k], key = k === 'water' ? 'kw' : 'ks', u0 = CURVE.cool[key];
        frost(ctx, x0 + 3, x1 - 3, lvl, bot - 3, clamp((st.u - u0) / (1 - u0), 0, 1), k === 'salt');
      });
      ['water', 'salt'].forEach((k) => glassFront(ctx, BK[k][0], btop, BK[k][1], bot, 10, 12, false));
      // 앞쪽 얼음
      [[98, 448, -0.3], [100, 500, 0.4], [260, 456, -0.1], [258, 508, 0.3], [422, 452, -0.5], [420, 504, 0.2]].forEach(([x, y, a]) => iceCube(ctx, x, y, 16, a, 0.95));
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx0 + 4, wl); ctx.lineTo(BK.water[0], wl); ctx.moveTo(BK.water[1], wl); ctx.lineTo(BK.salt[0], wl); ctx.moveTo(BK.salt[1], wl); ctx.lineTo(bx1 - 4, wl); ctx.stroke();
      glassFront(ctx, bx0, by0, bx1, by1, 26, 22, false);
      ov.put('nmH', 260, by1 + 28, '얼음', 'tx nm sol');
      return { bot, lvl };
    }
    const graph = () => wsDraw(ctx, ov, '', st.mode, st.u, st.run, { x: 600, y: 120, w: 340, h: 330 });
    let spawn = { water: 0, salt: 0 };
    addLoop(host, (dt) => {
      if (st.run) {
        st.u = Math.min(1, st.u + dt / DUR); st.heat = Math.min(1, st.heat + dt);
        st.onTick && st.onTick(st.u);
        if (st.u >= 1) { st.run = false; st.keep[st.mode] = true; const d = st.done; st.done = null; d && d(); }
      }
      S.begin(); white(S); desk(S, DESK);
      const G = st.mode === 'heat' ? drawHeat() : drawCool();
      // 기포: 끓기 시작한 뒤 바닥에서 생겨 올라감
      if (st.mode === 'heat' && !reduce) {
        ['water', 'salt'].forEach((k) => {
          const uk = CURVE.heat[k === 'water' ? 'kw' : 'ks'], boiling = st.u >= uk && st.heat > 0.5, near = clamp((st.u - uk * 0.5) / (uk * 0.5), 0, 1);
          spawn[k] += dt * (boiling ? 22 : near * 4) * (st.run || st.u > 0 ? 1 : 0);
          while (spawn[k] > 1) {
            spawn[k] -= 1; const x = lerp(BK[k][0] + 14, BK[k][1] - 14, Math.random());
            if (boiling) B[k].add({ x, y: G.bot - 6, r: 1, rmax: 3 + Math.random() * 3.5, stick: true, grow: 14, vmax: 150, ph: Math.random() * 6 });
            else B[k].add({ x, y: G.bot - 6, r: 0.6, rmax: 1.2 + Math.random() * 1.4, stick: true, grow: 4, collapse: Math.random() < 0.7, vmax: 40, ph: Math.random() * 6 });
          }
          B[k].step(dt, G.lvl + 2, boiling ? 1 : 0);
          if (boiling && Math.random() < dt * 5) SM.add((BK[k][0] + BK[k][1]) / 2 + gauss() * 10, 312, 0.8);
        });
        SM.step(dt);
      }
      // 디지털 온도계 두 개
      [['water', 183, '물'], ['salt', 337, '소금물']].forEach(([k, x, nm]) => {
        M.dthermo(ctx, x, 120, G.bot - 26);
        const v = st.u > 0 || st.run ? T(k, st.u) : CURVE[st.mode][k](0);
        ov.put('lcd' + k, x, 154, f1(v), 'lcd xs');
        ov.put('bn' + k, x, G.bot - 20 - (st.mode === 'heat' ? 70 : 60), nm, 'tx nm');
      });
      graph();
    });
    return { set, start, jump, get st() { return st; }, CURVE };
  }

  /* =================================================================
     탐구 활동 2: 컵에 담긴 물질 + 입자 돋보기
     ================================================================= */
  const LOOK = {
    water: { c: ['rgba(206,227,246,.5)', 'rgba(176,208,236,.62)'] },
    soda: { c: ['rgba(122,66,34,.88)', 'rgba(64,32,16,.94)'], fizz: true, ice: true },
    milk: { c: ['#fdfcf8', '#ece8de'], opaque: true },
    antifreeze: { c: ['rgba(176,214,226,.62)', 'rgba(132,186,204,.74)'] },
    muddy: { c: ['rgba(176,150,112,.85)', 'rgba(132,104,74,.92)'], mud: true },
    nacl: { salt: true },
  };
  function tumbler(ctx, x, bot, H, wTop, wBot) {
    ctx.beginPath(); ctx.moveTo(x - wTop / 2, bot - H); ctx.lineTo(x - wBot / 2, bot - 8); ctx.quadraticCurveTo(x - wBot / 2, bot, x - wBot / 2 + 10, bot); ctx.lineTo(x + wBot / 2 - 10, bot); ctx.quadraticCurveTo(x + wBot / 2, bot, x + wBot / 2, bot - 8); ctx.lineTo(x + wTop / 2, bot - H);
  }
  const SALT = (() => { const r = rng(17), a = []; for (let i = 0; i < 70; i++) { const u = r() * 2 - 1, h = Math.sqrt(Math.max(0, 1 - u * u)); a.push([u, r() * h, 3 + r() * 4, r() * 0.8 - 0.4]); } return a.sort((p, q) => q[1] - p[1]); })();
  function saltCube(ctx, x, y, s, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = '#e4e9ee'; ctx.beginPath(); ctx.moveTo(s, -s); ctx.lineTo(s + s * 0.5, -s - s * 0.4); ctx.lineTo(s + s * 0.5, s - s * 0.4); ctx.lineTo(s, s); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-s, -s); ctx.lineTo(-s + s * 0.5, -s - s * 0.4); ctx.lineTo(s + s * 0.5, -s - s * 0.4); ctx.lineTo(s, -s); ctx.fill();
    ctx.fillStyle = '#f3f5f8'; ctx.fillRect(-s, -s, 2 * s, 2 * s); ctx.strokeStyle = 'rgba(110,128,146,.35)'; ctx.lineWidth = 0.8; ctx.strokeRect(-s, -s, 2 * s, 2 * s);
    ctx.restore();
  }
  function sample(host, o = {}) {
    const W = 1000, H = 600, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx;
    const C = lensCore({ seed: 7 });
    const st = { id: null, t: 0, settle: 0, settling: false };
    const GX = 230, GB = 500, DESK = 504, LX = 660, LY = 290, LRAD = 220;
    const FZ = []; // 탄산음료 기포
    function set(id) { st.id = id; st.settle = 0; st.settling = false; FZ.length = 0; C.set(id === 'nacl' ? 'nacl' : id); }
    function settle() { st.settling = true; }
    addLoop(host, (dt) => {
      st.t += dt;
      if (st.settling) { st.settle = Math.min(1, st.settle + dt / 5); C.settle(st.settle); if (st.settle >= 1) { st.settling = false; o.onSettled && o.onSettled(); } }
      C.step(dt);
      S.begin(); white(S); desk(S, DESK);
      const L = LOOK[st.id] || LOOK.water;
      let fy, fx = GX;
      if (L.salt) {
        // 시계 접시 위 염화 나트륨 결정
        contact(ctx, GX, DESK + 2, 300, 0.18);
        let g = ctx.createLinearGradient(0, GB - 30, 0, GB); g.addColorStop(0, 'rgba(236,242,247,.9)'); g.addColorStop(1, 'rgba(200,214,228,.9)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(GX, GB - 14, 150, 22, 0, 0, Math.PI); ctx.lineTo(GX - 150, GB - 14); ctx.fill();
        ctx.strokeStyle = 'rgba(115,135,155,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(GX, GB - 14, 150, 22, 0, 0, TAU); ctx.stroke();
        SALT.forEach(([u, h, s, a]) => saltCube(ctx, GX + u * 110, GB - 22 - h * 90, s * 1.6, a));
        fy = GB - 60;
      } else {
        const HH = 260, wT = 190, wB = 150, top = GB - HH, lvl = top + 52;
        contact(ctx, GX, DESK + 2, 240, 0.2);
        tumbler(ctx, GX, GB, HH, wT, wB); ctx.closePath(); ctx.fillStyle = 'rgba(236,242,247,.5)'; ctx.fill();
        ctx.save(); tumbler(ctx, GX, GB - 3, HH - 3, wT - 8, wB - 8); ctx.closePath(); ctx.clip();
        let g = ctx.createLinearGradient(0, lvl, 0, GB); g.addColorStop(0, L.c[0]); g.addColorStop(1, L.c[1]);
        ctx.fillStyle = g; ctx.fillRect(GX - 120, lvl, 240, GB - lvl);
        if (L.mud) {
          // 가만히 두면 위는 맑아지고 바닥에 흙이 쌓임
          const k = st.settle;
          g = ctx.createLinearGradient(0, lvl, 0, GB); g.addColorStop(0, `rgba(222,236,248,${0.95 * k})`); g.addColorStop(0.75, `rgba(214,226,232,${0.9 * k})`); g.addColorStop(1, `rgba(200,206,206,${0.7 * k})`); ctx.fillStyle = g; ctx.fillRect(GX - 120, lvl, 240, GB - lvl);
          const sh = 8 + 34 * k; g = ctx.createLinearGradient(0, GB - sh, 0, GB); g.addColorStop(0, '#9b8466'); g.addColorStop(1, '#6f5c46');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(GX - 120, GB); ctx.lineTo(GX - 120, GB - sh); for (let x = -120; x <= 120; x += 10) ctx.lineTo(GX + x, GB - sh + Math.sin(x * 0.2) * 2); ctx.lineTo(GX + 120, GB); ctx.fill();
          const r = rng(4); ctx.fillStyle = 'rgba(110,90,66,.55)'; for (let i = 0; i < 60 * (1 - k); i++) { const yy = lvl + 10 + r() * (GB - lvl - 20), xx = GX + (r() - 0.5) * 160; ctx.beginPath(); ctx.arc(xx, yy + Math.sin(st.t + i) * 2, 1.2 + r() * 1.6, 0, TAU); ctx.fill(); }
        }
        if (L.fizz && !reduce) {
          if (Math.random() < dt * 14) FZ.push({ x: GX + (Math.random() - 0.5) * 140, y: GB - 8, r: 1 + Math.random() * 1.6, v: 30 + Math.random() * 30 });
          FZ.forEach((b) => { b.y -= b.v * dt; b.x += Math.sin(b.y * 0.1) * 0.2; if (b.y < lvl) b.dead = true; }); for (let i = FZ.length - 1; i >= 0; i--) if (FZ[i].dead) FZ.splice(i, 1);
          ctx.strokeStyle = 'rgba(255,240,220,.7)'; ctx.lineWidth = 1; FZ.forEach((b) => { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.stroke(); });
        }
        if (L.ice) { iceCube(ctx, GX - 30, lvl + 14, 22, 0.25, 0.85); iceCube(ctx, GX + 38, lvl + 10, 20, -0.3, 0.85); }
        ctx.strokeStyle = L.opaque ? 'rgba(220,214,200,.9)' : 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(GX - 120, lvl); ctx.lineTo(GX + 120, lvl); ctx.stroke();
        ctx.restore();
        tumbler(ctx, GX, GB, HH, wT, wB); ctx.strokeStyle = 'rgba(115,135,155,.65)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = 'rgba(115,135,155,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(GX, top, wT / 2, 6, 0, 0, TAU); ctx.stroke();
        g = ctx.createLinearGradient(GX - wT / 2 + 10, 0, GX - wT / 2 + 44, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.45, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(GX - wT / 2 + 14, top + 12); ctx.lineTo(GX - wT / 2 + 40, top + 12); ctx.lineTo(GX - wB / 2 + 34, GB - 16); ctx.lineTo(GX - wB / 2 + 12, GB - 16); ctx.closePath(); ctx.fill();
        fy = lvl + (GB - lvl) * (L.mud ? 0.45 : 0.5);
      }
      // 확대 표시
      ctx.strokeStyle = 'rgba(20,38,59,.32)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(fx + 20, fy, 24, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(20,38,59,.18)'; ctx.lineWidth = 1;
      const a1 = -0.95, a2 = 0.95;
      ctx.beginPath(); ctx.moveTo(fx + 20 + Math.cos(a1) * 24, fy + Math.sin(a1) * 24); ctx.lineTo(LX + Math.cos(Math.PI - 0.55) * LRAD, LY - Math.sin(0.55) * LRAD - 0);
      ctx.moveTo(fx + 20 + Math.cos(a2) * 24, fy + Math.sin(a2) * 24); ctx.lineTo(LX + Math.cos(Math.PI + 0.55) * LRAD, LY + Math.sin(0.55) * LRAD); ctx.stroke();
      C.draw(ctx, LX, LY, LRAD);
      ov.put('nm', GX, DESK + 34, C.sub ? C.sub.name : '', 'tx big2');
      ov.put('lg', 40, 110, C.legend(), 'tx key ra');
      ov.put('cap', LX, LY + LRAD + 30, '입자 모형으로 본 모습 · 한 가지 색 입자 = 한 가지 물질', 'tx cap');
    });
    return { set, settle, get st() { return st; }, core: C };
  }

  /* ---- 조사 카드의 온도 그래프 모양 (숫자는 교과서 값만) ---- */
  function sketch(id) {
    // [가로 0~1, 세로 0~1] 꺾은선, 기준선 ref, 글
    const D = {
      water_heat: { pts: [[0, 0.15], [0.35, 0.75], [1, 0.75]], ref: [0.75, '100 ℃'], x: '가열 시간', note: '끓는 동안 온도 일정' },
      water_cool: { pts: [[0, 0.8], [0.3, 0.45], [1, 0.45]], ref: [0.45, '0 ℃'], x: '냉각 시간', note: '어는 동안 온도 일정' },
      nacl_heat: { pts: [[0, 0.1], [0.4, 0.72], [1, 0.72]], ref: [0.72, '802.0 ℃'], x: '가열 시간', note: '녹는 동안 온도 일정' },
      soda_heat: { pts: [[0, 0.15], [0.38, 0.62], [1, 0.78]], ref: [0.55, '100 ℃'], x: '가열 시간', note: '끓는 동안 온도가 계속 오름' },
      milk_heat: { pts: [[0, 0.15], [0.36, 0.6], [1, 0.74]], ref: [0.55, '100 ℃'], x: '가열 시간', note: '끓는 동안 온도가 계속 오름' },
      antifreeze_cool: { pts: [[0, 0.85], [0.42, 0.3], [1, 0.14]], ref: [0.7, '0 ℃'], x: '냉각 시간', note: '0 ℃보다 훨씬 낮은 온도에서 얼기 시작하고, 어는 동안 온도가 계속 내려감' },
    }[id];
    if (!D) return '';
    const w = 300, h = 150, px = (u) => 40 + u * (w - 56), py = (v) => h - 24 - v * (h - 40);
    const path = D.pts.map(([u, v], i) => `${i ? 'L' : 'M'}${px(u).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
    const kink = D.pts[1];
    return `<svg viewBox="0 0 ${w} ${h}" class="sk" role="img" aria-label="${D.note}">
      <rect x="40" y="16" width="${w - 56}" height="${h - 40}" fill="#fbfcfe"/>
      <path d="M40 10V${h - 24}H${w - 10}" fill="none" stroke="#8b9aab" stroke-width="1.4"/>
      <line x1="40" x2="${w - 16}" y1="${py(D.ref[0])}" y2="${py(D.ref[0])}" stroke="#9fb3c7" stroke-dasharray="4 4"/>
      <text x="36" y="${py(D.ref[0]) + 4}" text-anchor="end" font-size="11" font-weight="700" fill="#5a6b7e">${D.ref[1]}</text>
      <path d="${path}" fill="none" stroke="${BLUE}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${px(kink[0])}" cy="${py(kink[1])}" r="3.5" fill="#14263b"/>
      <text x="${w - 12}" y="${h - 8}" text-anchor="end" font-size="11" font-weight="700" fill="#5a6b7e">${D.x}</text>
      <text x="44" y="11" font-size="11" font-weight="700" fill="#5a6b7e">온도</text>
    </svg>`;
  }

  return { SUBS, lensCore, lens, ws, wsGraphs, sample, sketch, CURVE, f1 };
})();
