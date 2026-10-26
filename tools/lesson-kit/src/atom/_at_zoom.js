/* ===== 원자 속으로: 헬륨 풍선 → 풍선 속 헬륨 원자 → 헬륨 원자 하나 → 원자핵 =====
   AT.zoom(host, o)  → { go(i), to(i), lv, onEvent }
   교과서 그림 Ⅳ-4(금괴 → 금 원자)와 Ⅳ-5·Ⅳ-6(원자의 구조, 헬륨 원자 모형)을 한 장면으로 이어 확대한다.
   단계 사이는 다음 장면이 둥근 창으로 커지며 들어오는 확대. 확대 비율은 보기 좋게 정한 모형(수치 없음). */
(() => {
  const { TAU, clamp, lerp, ease, sstep, rng, surface, overlay, addLoop, tweens, contact, shade, rgba, white } = EL;
  const W = 1000, H = 760, C = [500, 380];
  const FOCUS = [[500, 300], [500, 380], [500, 380]];
  const ZF = [9, 8.5, 4.2];
  const NAMES = ['헬륨 풍선', '풍선 속 헬륨', '헬륨 원자', '원자핵'];

  AT.zoom = function (host, o = {}) {
    const S = surface(host, W, H), ol = overlay(S), tw = tweens();
    const layers = [document.createElement('canvas'), document.createElement('canvas')];
    const st = { v: 0, lv: 0, t: 0, busy: false };
    const API = { st, onEvent: null };

    // ---- 장면 0: 헬륨 풍선 세 개 ----
    const BAL = [
      { x: 318, y: 262, rx: 112, ry: 132, c: '#f2b632', sx: 410, sy: 690 },
      { x: 690, y: 232, rx: 118, ry: 138, c: '#35a9c6', sx: 560, sy: 690 },
      { x: 500, y: 300, rx: 158, ry: 184, c: '#e8506b', sx: 492, sy: 690 },
    ];
    function balloon(ctx, b, t, i) {
      const sway = Math.sin(t * 0.9 + i * 1.7) * 6, x = b.x + sway, y = b.y + Math.sin(t * 1.3 + i) * 3;
      const ky = y + b.ry;
      // 끈
      ctx.strokeStyle = 'rgba(70,84,100,.55)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, ky + 12);
      ctx.bezierCurveTo(x + 20, ky + 110, b.sx - 24, b.sy - 150, b.sx, b.sy - 28); ctx.stroke();
      // 풍선 몸(위가 조금 넓은 달걀꼴)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, ky);
      ctx.bezierCurveTo(x - b.rx * 0.55, ky - b.ry * 0.25, x - b.rx * 1.05, y - b.ry * 0.25, x - b.rx, y - b.ry * 0.35);
      ctx.bezierCurveTo(x - b.rx * 0.95, y - b.ry * 1.05, x + b.rx * 0.95, y - b.ry * 1.05, x + b.rx, y - b.ry * 0.35);
      ctx.bezierCurveTo(x + b.rx * 1.05, y - b.ry * 0.25, x + b.rx * 0.55, ky - b.ry * 0.25, x, ky);
      ctx.closePath();
      const g = ctx.createRadialGradient(x - b.rx * 0.38, y - b.ry * 0.5, b.rx * 0.08, x, y, b.ry * 1.15);
      g.addColorStop(0, shade(b.c, 0.42)); g.addColorStop(0.5, b.c); g.addColorStop(1, shade(b.c, -0.35));
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = rgba('#14263b', 0.12); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore();
      // 매듭
      ctx.fillStyle = shade(b.c, -0.25); ctx.beginPath(); ctx.moveTo(x - 9, ky + 13); ctx.lineTo(x + 9, ky + 13); ctx.lineTo(x + 3, ky - 1); ctx.lineTo(x - 3, ky - 1); ctx.closePath(); ctx.fill();
    }
    function scene0(ctx, t) {
      white(S, '#fff');
      const g = ctx.createLinearGradient(0, 660, 0, 760); g.addColorStop(0, '#eef2f6'); g.addColorStop(1, '#f8fafc');
      ctx.fillStyle = g; ctx.fillRect(-2000, 660, 5000, 1000); ctx.fillStyle = '#dbe3eb'; ctx.fillRect(-2000, 660, 5000, 1.2);
      // 풍선 끈을 묶은 작은 추
      contact(ctx, 487, 692, 150, 0.2, 0.14);
      const wx = 452, wy = 640, ww = 80, wh = 48;
      ctx.fillStyle = '#5a6b7e'; ctx.beginPath(); ctx.moveTo(wx, wy + 8); ctx.lineTo(wx + ww, wy + 8); ctx.lineTo(wx + ww - 6, wy + wh); ctx.lineTo(wx + 6, wy + wh); ctx.closePath(); ctx.fill();
      const tg = ctx.createLinearGradient(0, wy, 0, wy + 10); tg.addColorStop(0, '#9aa8b7'); tg.addColorStop(1, '#788899');
      ctx.fillStyle = tg; ctx.beginPath(); ctx.ellipse(wx + ww / 2, wy + 8, ww / 2, 8, 0, 0, TAU); ctx.fill();
      BAL.forEach((b, i) => balloon(ctx, b, t, i));
      // 빨간 풍선 안쪽에 아주 작은 헬륨 원자들이 비쳐 보이는 느낌(확대 전에는 거의 안 보임)
    }

    // ---- 장면 1: 풍선 속 헬륨(기체) ----
    const R1 = rng(5), gas = [];
    for (let i = 0; i < 22; i++) {
      let x, y, tries = 0;
      do { x = 40 + R1() * 920; y = 40 + R1() * 680; tries++; } while (tries < 50 && (Math.hypot(x - C[0], y - C[1]) < 150 || gas.some((q) => Math.hypot(q.x - x, q.y - y) < 95)));
      const a = R1() * TAU, sp = 40 + R1() * 50;
      gas.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, orb: AT.orbits(2, 20 + i), ph: R1() * 10 });
    }
    const orb1 = AT.orbits(2, 9);
    function scene1(ctx, t, dt) {
      const g = ctx.createRadialGradient(500, 380, 60, 500, 380, 700); g.addColorStop(0, '#fff7f8'); g.addColorStop(1, '#fbe3e8');
      ctx.fillStyle = g; ctx.fillRect(-3000, -3000, 7000, 7000);
      gas.forEach((q) => {
        q.x += q.vx * dt; q.y += q.vy * dt;
        if (q.x < 30 || q.x > 970) q.vx *= -1; if (q.y < 30 || q.y > 730) q.vy *= -1;
        const dx = q.x - C[0], dy = q.y - C[1], d = Math.hypot(dx, dy);
        if (d < 110) { q.vx += dx / d * 30; q.vy += dy / d * 30; const s = Math.hypot(q.vx, q.vy); q.vx *= 70 / s; q.vy *= 70 / s; }
        AT.atom(ctx, q.x, q.y, 30, { mode: 'simple', e: 2, orb: q.orb, t: t + q.ph, nr: 0.16, er: 0.09, shadow: false });
      });
      AT.atom(ctx, C[0], C[1], 34, { mode: 'simple', e: 2, orb: orb1, t, nr: 0.16, er: 0.09, shadow: false, ring: st.lv === 1 && !st.busy });
    }

    // ---- 장면 2: 헬륨 원자 하나(자세히) ----
    const orb2 = AT.orbits(2, 4);
    function scene2(ctx, t) {
      white(S, '#fff');
      AT.atom(ctx, C[0], C[1], 290, { mode: 'detail', p: 2, n: 2, e: 2, orb: orb2, t, nr: 0.085, er: 0.06 });
    }

    // ---- 장면 3: 원자핵 ----
    function scene3(ctx, t) {
      const g = ctx.createRadialGradient(440, 300, 40, 500, 380, 760); g.addColorStop(0, '#f2faff'); g.addColorStop(1, '#bfe3f6');
      ctx.fillStyle = g; ctx.fillRect(-3000, -3000, 7000, 7000);
      AT.nucleus(ctx, C[0], C[1], 105, ['p', 'n', 'p', 'n'], t * 0.6);
    }
    const SCENES = [scene0, scene1, scene2, scene3];

    function fitLayer(cv) { if (cv.width !== S.cv.width || cv.height !== S.cv.height) { cv.width = S.cv.width; cv.height = S.cv.height; } return cv.getContext('2d'); }
    // 장면 하나를 층에 그리기: 확대 변환 [tx, ty, s, fx, fy] (화면 = t + s·(p − f))
    function renderLayer(cv, idx, tr, dt, clipR) {
      const c = fitLayer(cv), m = S.m;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
      c.setTransform(m.dpr * m.k, 0, 0, m.dpr * m.k, m.dpr * m.ox, m.dpr * m.oy);
      c.translate(tr[0], tr[1]); c.scale(tr[2], tr[2]); c.translate(-tr[3], -tr[4]);
      if (clipR) { c.beginPath(); c.arc(C[0], C[1], clipR, 0, TAU); c.clip(); }
      const keep = S.ctx; S.ctx = c; // white()가 S.ctx를 쓰므로 잠시 바꿈
      try { SCENES[idx](c, st.t, dt); } finally { S.ctx = keep; }
    }

    function labels() {
      ol.hideAll();
      if (st.busy) return;
      const L = st.lv;
      if (L === 0) {
        ol.put('l0', 500, 724, '<b>헬륨 풍선</b> 속에는 헬륨이 들어 있어요', 'tx cap2');
      } else if (L === 1) {
        ol.put('l1', 560, 372, '<b>헬륨 원자</b>', 'tx lz ra');
        ol.put('l1b', 500, 724, '헬륨 원자들이 이리저리 움직여요', 'tx cap2');
      } else if (L === 2) {
        ol.put('n', 600, 330, '원자핵 <span class="u">(+)전하</span>', 'tx lz ra');
        ol.put('e', 820, 140, '전자 <span class="u">(−)전하</span>', 'tx lz ra');
        ol.put('a', 500, 712, '<b>헬륨 원자</b> · 원자핵과 그 주위를 움직이는 전자', 'tx cap2');
      } else {
        ol.put('p', 300, 226, '양성자 <span class="u">(+)전하</span>', 'tx lz la');
        ol.put('nn', 700, 226, '중성자 <span class="u">전하 없음</span>', 'tx lz ra');
        ol.put('c', 500, 712, '<b>원자핵</b> · 양성자와 중성자가 결합되어 있어요', 'tx cap2');
      }
    }
    // 이름표 끝을 잇는 얇은 선
    function leaders(ctx) {
      if (st.busy) return;
      ctx.save(); ctx.strokeStyle = 'rgba(90,107,126,.6)'; ctx.lineWidth = 1.3;
      const ln = (a, b, c2, d) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c2, d); ctx.stroke(); ctx.fillStyle = 'rgba(90,107,126,.85)'; ctx.beginPath(); ctx.arc(c2, d, 3, 0, TAU); ctx.fill(); };
      if (st.lv === 1) ln(552, 372, 536, 378);
      if (st.lv === 2) { ln(592, 330, 528, 366); const q = AT.epos(orb2[0], st.t); const ex = C[0] + q.x * 290, ey = C[1] + q.y * 290; ln(812, 140, ex, ey); }
      if (st.lv === 3) { ln(308, 226, 430, 316); ln(692, 226, 572, 320); }
      ctx.restore();
    }

    addLoop(host, (dt) => {
      st.t += dt; tw.step(dt);
      const i = Math.min(2, Math.floor(st.v)), f = clamp(st.v - i, 0, 1);
      const ctx = S.ctx, m = S.m;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, S.cv.width, S.cv.height);
      if (f < 0.0005 || st.v >= 3) {
        const idx = Math.round(st.v);
        renderLayer(layers[0], idx, [C[0], C[1], 1, C[0], C[1]], dt);
        ctx.drawImage(layers[0], 0, 0);
      } else {
        const Z = ZF[i], F = FOCUS[i], s = Math.pow(Z, f);
        const px = lerp(F[0], C[0], f), py = lerp(F[1], C[1], f);
        renderLayer(layers[0], i, [px, py, s, F[0], F[1]], dt);
        renderLayer(layers[1], i + 1, [px, py, s / Z, C[0], C[1]], dt, 560);
        ctx.globalAlpha = 1 - sstep(0.55, 0.97, f); ctx.drawImage(layers[0], 0, 0);
        ctx.globalAlpha = sstep(0.04, 0.5, f); ctx.drawImage(layers[1], 0, 0);
        ctx.globalAlpha = 1;
      }
      ctx.setTransform(m.dpr * m.k, 0, 0, m.dpr * m.k, m.dpr * m.ox, m.dpr * m.oy);
      leaders(ctx);
      labels();
    });

    API.go = (to) => {
      to = clamp(to, 0, 3); if (st.busy || to === st.lv) return false;
      const from = st.v, dur = 1.5 + Math.abs(to - from) * 0.35; st.busy = true;
      tw.add(dur, (k) => { st.v = lerp(from, to, ease(k)); }, () => { st.v = to; st.lv = to; st.busy = false; API.onEvent && API.onEvent('arrive', to); });
      API.onEvent && API.onEvent('leave', to);
      return true;
    };
    API.jump = (to) => { tw.clear(); st.v = st.lv = to; st.busy = false; };
    API.NAMES = NAMES;
    return API;
  };
})();
