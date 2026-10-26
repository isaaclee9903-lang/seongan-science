/* ===== 원소 수업 그림 도구: 물 분해 장치 (해 보기 '물을 이루는 입자의 종류 알아보기') =====
   EL.water(host, o)  수조 속에 세운 관 두 개 + 전극 + 전원 장치. 전원을 켜면 전극에서 기체 방울이 올라와 관 위에 모인다.
     .power(on)                전원 켜기(기체가 다 모이면 저절로 꺼짐)
     .test('+'|'-', done)      (+)극 관에 꺼져가는 향불 / (−)극 관에 향불 대기
     .showLens(on)             입자 돋보기 세 개(산소 기체, 수소 기체, 물)
     .reset(), .jump({gas, p, m, lens})   검사용으로 바로 그 장면
     .onEvent = (name) => {}   'full' 기체가 다 모임, 'relit' 향불이 살아남, 'pop' 퍽
   (−)극 관에 기체가 더 많이 모이는 것은 실제 현상대로 그리되 수치는 쓰지 않는다. 화면 속 빠르기·방울 수는 정한 모형. */
(() => {
  const { TAU, BLUE, reduce, clamp, lerp, ease, easeOut, sstep, surface, overlay, addLoop, tweens, rr, white, desk, contact, shade, swarm, lens, leader, unit } = EL;
  const W = 1000, H = 800, DESK = 700;
  const T = { L: 300, R: 440, r: 26, top: 104, mouth: 655, max: 300 };
  const TANK = { x0: 196, x1: 544, top: 540, bot: 690, lv: 576 };
  const PS = { x0: 690, x1: 940, y0: 596, y1: 704 };

  function glassTube(ctx, x, top, bot, r, fill) {
    ctx.beginPath(); ctx.moveTo(x - r, bot); ctx.lineTo(x - r, top + r); ctx.arc(x, top + r, r, Math.PI, 0); ctx.lineTo(x + r, bot);
    if (fill) { ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); return; }
    ctx.strokeStyle = 'rgba(96,120,146,.8)'; ctx.lineWidth = 2.2; ctx.stroke();
  }
  function wire(ctx, pts, col, w = 6) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(20,38,59,.12)'; ctx.lineWidth = w + 3;
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1] + 4); ctx.bezierCurveTo(pts[2], pts[3] + 4, pts[4], pts[5] + 4, pts[6], pts[7] + 4); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = w * 0.3;
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1] - w * 0.2); ctx.bezierCurveTo(pts[2], pts[3] - w * 0.2, pts[4], pts[5] - w * 0.2, pts[6], pts[7] - w * 0.2); ctx.stroke();
  }
  function terminal(ctx, x, y, col) {
    ctx.fillStyle = shade(col, -0.35); ctx.beginPath(); ctx.arc(x, y + 1.5, 9, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 9); g.addColorStop(0, shade(col, 0.35)); g.addColorStop(1, col);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c9d1d9'; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
  }
  function stand(ctx) {
    contact(ctx, 640, DESK + 2, 180, 0.2);
    let g = ctx.createLinearGradient(0, DESK - 16, 0, DESK); g.addColorStop(0, '#4a5562'); g.addColorStop(1, '#232a32');
    ctx.fillStyle = g; rr(ctx, 570, DESK - 16, 150, 16, 5); ctx.fill();
    g = ctx.createLinearGradient(612, 0, 626, 0); g.addColorStop(0, '#8d99a6'); g.addColorStop(0.45, '#eef2f5'); g.addColorStop(1, '#717d8a');
    ctx.fillStyle = g; ctx.fillRect(613, 150, 12, DESK - 16 - 150);
    // 두 관을 함께 잡는 집게
    const y = 262;
    g = ctx.createLinearGradient(0, y - 5, 0, y + 5); g.addColorStop(0, '#dfe5ea'); g.addColorStop(0.5, '#fff'); g.addColorStop(1, '#8e99a5');
    ctx.fillStyle = g; ctx.fillRect(T.L - 10, y - 4, 619 - T.L + 10, 8);
    g = ctx.createLinearGradient(0, y - 12, 0, y + 12); g.addColorStop(0, '#5d6874'); g.addColorStop(1, '#2b333c');
    ctx.fillStyle = g; rr(ctx, 606, y - 12, 26, 24, 5); ctx.fill();
    ctx.fillStyle = '#3a434d'; ctx.beginPath(); ctx.arc(640, y, 6, 0, TAU); ctx.fill();
  }
  function clampFront(ctx) {
    const y = 262;
    [T.L, T.R].forEach((x) => {
      const g = ctx.createLinearGradient(0, y - 11, 0, y + 11); g.addColorStop(0, '#59636f'); g.addColorStop(1, '#2a323b');
      ctx.fillStyle = g; rr(ctx, x - T.r - 6, y - 10, 10, 20, 3); ctx.fill(); rr(ctx, x + T.r - 4, y - 10, 10, 20, 3); ctx.fill();
      ctx.fillStyle = 'rgba(42,50,59,.35)'; ctx.fillRect(x - T.r, y - 3, T.r * 2, 6);
    });
  }
  function powerBox(ctx, on, t) {
    const { x0, x1, y0, y1 } = PS, d = 26;
    contact(ctx, (x0 + x1) / 2 + 8, y1 + 2, x1 - x0 + 60, 0.24);
    // 윗면
    ctx.fillStyle = '#4a535d'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + d, y0 - d * 0.6); ctx.lineTo(x1 + d, y0 - d * 0.6); ctx.lineTo(x1, y0); ctx.closePath(); ctx.fill();
    // 옆면
    ctx.fillStyle = '#1f252b'; ctx.beginPath(); ctx.moveTo(x1, y0); ctx.lineTo(x1 + d, y0 - d * 0.6); ctx.lineTo(x1 + d, y1 - d * 0.6); ctx.lineTo(x1, y1); ctx.closePath(); ctx.fill();
    // 앞면
    let g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#3a424b'); g.addColorStop(1, '#262c33');
    ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1);
    // 표시 창
    ctx.fillStyle = on ? '#123a2a' : '#151b20'; rr(ctx, x0 + 18, y0 + 16, 104, 38, 6); ctx.fill();
    if (on) {
      ctx.fillStyle = '#5ff0a1';
      for (let i = 0; i < 4; i++) { const hh = 10 + 14 * (0.5 + 0.5 * Math.sin(t * 6 + i * 1.3)); ctx.fillRect(x0 + 30 + i * 22, y0 + 46 - hh, 12, hh); }
    }
    // 손잡이 두 개
    [[x0 + 158, y0 + 34], [x0 + 210, y0 + 34]].forEach(([x, y], i) => {
      ctx.fillStyle = '#12171c'; ctx.beginPath(); ctx.arc(x, y + 2, 16, 0, TAU); ctx.fill();
      g = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, 16); g.addColorStop(0, '#6c7680'); g.addColorStop(1, '#2a3138');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 15, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#e8edf2'; ctx.lineWidth = 2.5; const a = -2.2 + (on ? 1.6 : 0) + i * 0.5;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5); ctx.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12); ctx.stroke();
    });
    // 전원 단추와 불빛
    ctx.fillStyle = on ? '#2fd27a' : '#55606b'; ctx.beginPath(); ctx.arc(x0 + 34, y1 - 24, 7, 0, TAU); ctx.fill();
    if (on) { ctx.strokeStyle = 'rgba(47,210,122,.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x0 + 34, y1 - 24, 11, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = '#d8dee4'; rr(ctx, x0 + 54, y1 - 34, 40, 20, 5); ctx.fill();
    ctx.fillStyle = on ? '#2a323b' : '#8a96a3'; rr(ctx, x0 + (on ? 74 : 56), y1 - 32, 18, 16, 4); ctx.fill();
    terminal(ctx, x1 - 66, y1 - 24, '#d93a32');
    terminal(ctx, x1 - 30, y1 - 24, '#2b3138');
  }
  function tank(ctx, back, lv, t) {
    const { x0, x1, top, bot } = TANK;
    if (back) {
      contact(ctx, (x0 + x1) / 2, bot + 30, x1 - x0 + 60, 0.2);
      // 받침
      let g = ctx.createLinearGradient(0, bot, 0, bot + 28); g.addColorStop(0, '#f4f7fa'); g.addColorStop(1, '#cdd6df');
      ctx.fillStyle = g; rr(ctx, x0 - 14, bot, x1 - x0 + 28, 28, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(20,38,59,.14)'; ctx.lineWidth = 1; ctx.stroke();
      // 뒤 유리
      ctx.fillStyle = 'rgba(232,240,247,.55)'; ctx.fillRect(x0, top, x1 - x0, bot - top);
      // 물(뒤)
      g = ctx.createLinearGradient(0, lv, 0, bot); g.addColorStop(0, 'rgba(120,188,240,.5)'); g.addColorStop(1, 'rgba(60,140,215,.58)');
      ctx.fillStyle = g; ctx.fillRect(x0, lv, x1 - x0, bot - lv);
      return;
    }
    // 앞 유리 + 물 표면
    ctx.fillStyle = 'rgba(160,210,244,.16)'; ctx.fillRect(x0, lv, x1 - x0, bot - lv);
    ctx.fillStyle = 'rgba(200,230,250,.7)'; ctx.beginPath(); ctx.moveTo(x0, lv);
    for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, lv + Math.sin(x * 0.05 + t * 2) * 0.9);
    ctx.lineTo(x1, lv + 7); ctx.lineTo(x0, lv + 7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(70,140,200,.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0, lv); ctx.lineTo(x1, lv); ctx.stroke();
    ctx.strokeStyle = 'rgba(96,120,146,.85)'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
    ctx.strokeRect(x0, top, x1 - x0, bot - top);
    ctx.strokeStyle = 'rgba(96,120,146,.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0 + 6, top + 6); ctx.lineTo(x1 - 6, top + 6); ctx.stroke();
  }
  function electrode(ctx, x) {
    const g = ctx.createLinearGradient(x - 4, 0, x + 4, 0); g.addColorStop(0, '#2a3138'); g.addColorStop(0.5, '#6a7480'); g.addColorStop(1, '#20262c');
    ctx.fillStyle = g; ctx.fillRect(x - 4, 610, 8, TANK.bot - 610); ctx.beginPath(); ctx.arc(x, 610, 4, Math.PI, 0); ctx.fill();
  }
  function stopcock(ctx, x, open) {
    const y = 78;
    ctx.fillStyle = 'rgba(236,243,248,.9)'; ctx.fillRect(x - 6, 56, 12, T.top - 56 + 4);
    ctx.strokeStyle = 'rgba(96,120,146,.8)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x - 6, T.top + 2); ctx.lineTo(x - 6, 56); ctx.moveTo(x + 6, 56); ctx.lineTo(x + 6, T.top + 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, 56, 7, 2.5, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(232,240,247,.95)'; ctx.beginPath(); ctx.ellipse(x, y, 13, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
    // 손잡이: 가로면 잠김, 세로면 열림
    const a = open * Math.PI / 2;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    const g = ctx.createLinearGradient(0, -5, 0, 5); g.addColorStop(0, '#5aa0e0'); g.addColorStop(1, '#1f5f9e');
    ctx.fillStyle = g; rr(ctx, -30, -5, 60, 10, 5); ctx.fill();
    ctx.restore();
  }
  function incense(ctx, x, y, glow, flame, t, smoke) {
    // 향: 끝(x, y)에서 오른쪽 위로 뻗은 막대
    const ang = -0.62, L = 150, ex = x + Math.cos(ang) * L, ey = y + Math.sin(ang) * L;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#7a4b2c'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * 16, y + Math.sin(ang) * 16); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.strokeStyle = '#c99a6b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * 40, y + Math.sin(ang) * 40 - 1); ctx.lineTo(ex, ey - 1); ctx.stroke();
    // 손잡이 쪽 대나무 심
    ctx.strokeStyle = '#d9b98c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + Math.cos(ang) * 40, ey + Math.sin(ang) * 40); ctx.stroke();
    // 재
    ctx.strokeStyle = '#9aa3ab'; ctx.lineWidth = 5.5; ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * 4, y + Math.sin(ang) * 4); ctx.lineTo(x + Math.cos(ang) * 16, y + Math.sin(ang) * 16); ctx.stroke();
    // 불씨
    const fl = 0.85 + 0.15 * Math.sin(t * 23) * Math.sin(t * 7);
    const g = ctx.createRadialGradient(x, y, 0, x, y, 6 + glow * 16);
    g.addColorStop(0, glow > 0.5 ? '#fff3b0' : '#ffb06a'); g.addColorStop(0.35, `rgba(255,${Math.round(110 + 60 * glow)},40,${0.5 + 0.5 * glow})`); g.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, (6 + glow * 16) * fl, 0, TAU); ctx.fill();
    ctx.fillStyle = glow > 0.3 ? '#ff7a1c' : '#9b3b1e'; ctx.beginPath(); ctx.arc(x, y, 3.6, 0, TAU); ctx.fill();
    if (flame > 0.02) {
      const h = (16 + 22 * flame) * (0.9 + 0.1 * Math.sin(t * 31));
      const gf = ctx.createLinearGradient(x, y, x, y - h); gf.addColorStop(0, 'rgba(255,170,40,.95)'); gf.addColorStop(0.6, 'rgba(255,214,90,.85)'); gf.addColorStop(1, 'rgba(255,240,180,0)');
      ctx.fillStyle = gf; ctx.beginPath(); ctx.moveTo(x - 6 * flame, y - 1); ctx.quadraticCurveTo(x - 7 * flame, y - h * 0.5, x + Math.sin(t * 9) * 2, y - h); ctx.quadraticCurveTo(x + 7 * flame, y - h * 0.5, x + 6 * flame, y - 1); ctx.closePath(); ctx.fill();
    }
    // 연기: 위로 올라가며 옆으로 흔들림
    if (smoke > 0.02) {
      ctx.strokeStyle = `rgba(150,160,170,${0.32 * smoke})`; ctx.lineWidth = 2;
      for (let k = 0; k < 2; k++) {
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) { const yy = y - 8 - i * 4.2, xx = x + 2 + Math.sin(i * 0.45 - t * 2.6 + k * 2) * (2 + i * 0.5) + k * 3; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
        ctx.stroke();
      }
    }
  }

  EL.water = function (host, o = {}) {
    const S = surface(host, W, H, o.crop || [0, -90, W, H + 90]), ctx = S.ctx, ol = overlay(S), tw = tweens();
    const st = { on: false, gL: 0, gR: 0, p: false, m: false, lens: false, busy: false, open: [0, 0], inc: null, pop: 0, popAt: null, t: 0 };
    const api = { st, onEvent: null };
    const bubbles = [];
    const sw = { o2: swarm({ state: 'gas', unit: 'O2', n: 8, r: 0.1, seed: 3 }), h2: swarm({ state: 'gas', unit: 'H2', n: 13, r: 0.1, seed: 5, speed: 0.6 }), w: swarm({ state: 'liquid', unit: 'H2O', n: 24, r: 0.095, seed: 9 }) };
    const ev = (n) => api.onEvent && api.onEvent(n);
    const lv = (side) => T.top + 4 + (side === 'L' ? st.gL : st.gR) * T.max;
    function spawn(dt) {
      const k = o.mini ? 0.7 : 1;
      [['L', T.L, 9], ['R', T.R, 18]].forEach(([s, x, rate]) => {
        if (Math.random() < rate * k * dt) bubbles.push({ s, x: x + (Math.random() - 0.5) * 6, y: 606 + Math.random() * 6, r: s === 'R' ? 1.8 + Math.random() * 2 : 2.4 + Math.random() * 2.4, v: 30 + Math.random() * 20, ph: Math.random() * TAU });
      });
    }
    function draw(dt) {
      st.t += dt; tw.step(dt);
      if (st.on) {
        spawn(dt);
        const rate = o.mini ? 1 / 4.5 : 1 / 7;
        st.gR = Math.min(1, st.gR + rate * dt); st.gL = Math.min(0.5, st.gL + rate * 0.5 * dt);
        if (st.gR >= 1) { st.on = false; ev('full'); }
      }
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i]; b.v = Math.min(170, b.v + 260 * dt); b.y -= b.v * dt; b.x += Math.sin(st.t * 9 + b.ph) * 0.35;
        if (b.y < lv(b.s) + b.r) bubbles.splice(i, 1);
      }
      for (const sk of ['o2', 'h2', 'w']) st.lens && sw[sk].step(dt);
      S.begin(); white(S); desk(S, DESK);
      stand(ctx);
      // 전선(바닥에 놓임)
      wire(ctx, [PS.x1 - 66, PS.y1 - 24, PS.x1 - 70, 770, T.L + 120, 770, T.L, TANK.bot + 16], '#d93a32');
      wire(ctx, [PS.x1 - 30, PS.y1 - 24, PS.x1 - 20, 760, T.R + 120, 752, T.R, TANK.bot + 16], '#2b3138');
      powerBox(ctx, st.on, st.t);
      const tlv = TANK.lv - (st.gL + st.gR) * 10;
      tank(ctx, true, tlv, st.t);
      terminal(ctx, T.L, TANK.bot + 16, '#d93a32'); terminal(ctx, T.R, TANK.bot + 16, '#2b3138');
      [['L', T.L], ['R', T.R]].forEach(([s, x]) => {
        glassTube(ctx, x, T.top, T.mouth, T.r, 'rgba(240,246,251,.75)');
        // 관 속 물
        const y = lv(s);
        let g = ctx.createLinearGradient(0, y, 0, T.mouth); g.addColorStop(0, 'rgba(120,188,240,.55)'); g.addColorStop(1, 'rgba(70,150,222,.6)');
        ctx.fillStyle = g; ctx.fillRect(x - T.r, y, T.r * 2, T.mouth - y);
        ctx.strokeStyle = 'rgba(60,128,190,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - T.r, y - 3); ctx.quadraticCurveTo(x, y + 3, x + T.r, y - 3); ctx.stroke();
        // 눈금(숫자 없음)
        ctx.strokeStyle = 'rgba(96,120,146,.5)'; ctx.lineWidth = 1;
        for (let i = 0; i <= 12; i++) { const yy = T.top + 40 + i * 25; ctx.beginPath(); ctx.moveTo(x - T.r + 4, yy); ctx.lineTo(x - T.r + (i % 4 === 0 ? 16 : 10), yy); ctx.stroke(); }
        electrode(ctx, x);
      });
      // 방울
      bubbles.forEach((b) => {
        ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.strokeStyle = 'rgba(70,130,190,.7)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); ctx.stroke();
      });
      // 전극에 붙은 작은 방울
      if (st.on) [T.L, T.R].forEach((x, i) => { for (let k = 0; k < 5; k++) { const yy = 616 + k * 13, xx = x + (k % 2 ? 5 : -5); ctx.strokeStyle = 'rgba(70,130,190,.6)'; ctx.beginPath(); ctx.arc(xx, yy + Math.sin(st.t * 5 + k + i) * 1.5, 1.6, 0, TAU); ctx.stroke(); } });
      tank(ctx, false, tlv, st.t);
      [['L', T.L], ['R', T.R]].forEach(([s, x]) => glassTube(ctx, x, T.top, T.mouth, T.r));
      clampFront(ctx);
      stopcock(ctx, T.L, st.open[0]); stopcock(ctx, T.R, st.open[1]);
      // 퍽: 아주 짧은 불꽃
      if (st.popAt) {
        const k = st.pop;
        if (k > 0 && k < 1) {
          const [x, y] = st.popAt, rad = 14 + 70 * easeOut(k), a = 1 - k;
          const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
          g.addColorStop(0, `rgba(255,250,220,${0.95 * a})`); g.addColorStop(0.35, `rgba(255,196,80,${0.8 * a})`); g.addColorStop(0.7, `rgba(255,120,40,${0.4 * a})`); g.addColorStop(1, 'rgba(255,120,40,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
          ctx.strokeStyle = `rgba(255,170,60,${0.7 * a})`; ctx.lineWidth = 2.5;
          for (let i = 0; i < 9; i++) { const an = i / 9 * TAU + 0.2, r0 = rad * 0.75, r1 = rad * 1.05; ctx.beginPath(); ctx.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0); ctx.lineTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1); ctx.stroke(); }
        }
      }
      if (st.inc) { const I = st.inc; incense(ctx, I.x, I.y, I.glow, I.flame, st.t, I.smoke); }
      // 이름표
      const L = o.labels !== false;
      if (L) {
        ol.put('p', T.L - 16, TANK.bot + 16, '(+)극', 'tx nm la');
        ol.put('m', T.R - 16, TANK.bot + 16, '(−)극', 'tx nm la');
        ol.put('ps', (PS.x0 + PS.x1) / 2, PS.y0 - 34, '전원 장치', 'tx');
        ol.put('wt', TANK.x0 + 52, TANK.bot - 28, '물', 'tx');
        const nm = st.p && st.m && !o.hideNames;
        if (st.gL > 0.1) ol.put('gl', T.L - T.r - 10, T.top + 40, nm ? '<b>산소</b> 기체' : '기체', 'tx la' + (nm ? ' gas' : '')); else ol.hide('gl');
        if (st.gR > 0.1) ol.put('gr', T.R + T.r + 10, T.top + 40, nm ? '<b>수소</b> 기체' : '기체', 'tx ra' + (nm ? ' gas' : '')); else ol.hide('gr');
      }
      if (st.say) ol.put('say', st.say.x, st.say.y, st.say.h, 'tx say' + (st.say.big ? ' big' : '')); else ol.hide('say');
      // 입자 돋보기
      if (st.lens) {
        const Lz = [[sw.o2, 120, 170, 92, T.L - 8, T.top + 50, 'o2'], [sw.h2, 790, 200, 92, T.R + 10, T.top + 90, 'h2'], [sw.w, 112, 486, 84, TANK.x0 + 70, 630, 'w']];
        Lz.forEach(([s, x, y, R, tx, ty]) => { leader(ctx, x, y, tx, ty); });
        Lz.forEach(([s, x, y, R]) => lens(ctx, x, y, R, s));
        ol.put('l1', 120, 170 + 92 + 22, `${EL.dot('O')}산소 기체 · 산소 입자만`, 'tx lz');
        ol.put('l2', 790, 200 + 92 + 22, `${EL.dot('H')}수소 기체 · 수소 입자만`, 'tx lz');
        ol.put('l3', 112, 486 + 84 + 22, `물 · ${EL.dot('O')}산소 + ${EL.dot('H')}수소`, 'tx lz');
      } else ['l1', 'l2', 'l3'].forEach(ol.hide);
    }
    addLoop(host, draw);

    api.power = (on) => { if (st.gR >= 1) return false; st.on = on; return true; };
    api.test = (side, done) => {
      if (st.busy || st.gR < 0.2) return false;
      st.busy = true; st.say = null;
      const plus = side === '+', x = plus ? T.L : T.R, idx = plus ? 0 : 1;
      const tip = [x + 3, 52];
      st.inc = { x: x + 230, y: -40, glow: plus ? 0.12 : 0.75, flame: plus ? 0 : 0.25, smoke: plus ? 0.7 : 1 };
      const from = [st.inc.x, st.inc.y];
      tw.add(1.1, (k) => { const e = ease(k); st.inc.x = lerp(from[0], tip[0], e); st.inc.y = lerp(from[1], tip[1], e); }, () => {
        tw.add(0.45, (k) => (st.open[idx] = ease(k)), () => {
          const g0 = plus ? st.gL : st.gR;
          tw.add(1.2, (k) => { if (plus) st.gL = g0 - 0.12 * k; else st.gR = g0 - 0.22 * k; });
          if (plus) {
            tw.add(0.9, (k) => { const e = sstep(0.25, 1, k); st.inc.glow = lerp(0.12, 1, e); st.inc.flame = lerp(0, 1, sstep(0.5, 1, k)); st.inc.smoke = lerp(0.7, 0.2, e); }, () => {
              st.say = { x: x - 120, y: -40, h: '향불이 다시 살아났어요', big: true }; ev('relit');
              tw.add(1.6, () => {}, () => { tw.add(0.4, (k) => (st.open[idx] = 1 - ease(k)), () => { st.p = true; st.busy = false; done && done(); }); });
            });
          } else {
            tw.add(0.25, () => {}, () => {
              st.popAt = [x, 44]; ev('pop');
              st.say = { x: x - 70, y: 6, h: '퍽!', big: true };
              tw.add(0.5, (k) => (st.pop = k), () => { st.pop = 0; st.popAt = null; });
              tw.add(1.8, () => {}, () => { st.say = { x: x - 140, y: -40, h: "'퍽' 소리를 내며 탔어요", big: true }; tw.add(0.4, (k) => (st.open[idx] = 1 - ease(k)), () => { st.m = true; st.busy = false; done && done(); }); });
            });
          }
        });
      });
      return true;
    };
    api.leave = () => { const me = st.inc; if (!me) return; const f = [me.x, me.y]; st.say = null; tw.add(0.6, (k) => { me.x = lerp(f[0], f[0] + 260, ease(k)); me.y = lerp(f[1], f[1] - 120, ease(k)); }, () => { if (st.inc === me) st.inc = null; }); };
    api.showLens = (on) => { st.lens = on; if (on) { st.say = null; st.inc = null; } };
    api.reset = () => { tw.clear(); bubbles.length = 0; Object.assign(st, { on: false, gL: 0, gR: 0, p: false, m: false, lens: false, busy: false, open: [0, 0], inc: null, pop: 0, popAt: null, say: null }); };
    api.jump = (j) => {
      api.reset();
      st.gR = j.gas == null ? 1 : j.gas; st.gL = st.gR / 2;
      if (j.p) { st.p = true; st.gL -= 0.12; }
      if (j.m) { st.m = true; st.gR -= 0.22; }
      if (j.inc === '+') { st.inc = { x: T.L + 3, y: 52, glow: 1, flame: 1, smoke: 0.2 }; st.say = { x: T.L - 120, y: -40, h: '향불이 다시 살아났어요', big: true }; }
      if (j.inc === '-') { st.inc = { x: T.R + 3, y: 52, glow: 0.75, flame: 0.25, smoke: 1 }; st.say = { x: T.R - 140, y: -40, h: "'퍽' 소리를 내며 탔어요", big: true }; }
      if (j.on) st.on = true;
      st.lens = !!j.lens;
      if (j.lens) for (let i = 0; i < 40; i++) ['o2', 'h2', 'w'].forEach((k) => sw[k].step(0.05));
    };
    api.S = S;
    return api;
  };
})();
