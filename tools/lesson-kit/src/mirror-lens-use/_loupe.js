/* ===== 거울·렌즈로 본 모습 그리기 (캔버스 2D) =====
   LP.scene(이름)                       장면 캔버스(1000×1000)를 만들어 돌려줌. store 편의점, road 굽은 길, face 미용실 손님, teeth 치아, page 책, cells 양파 세포, sky 별
   LP.render(캔버스, 옵션)              장면을 거울·렌즈로 본 모습으로 그림
     옵션 { scene, mode, frame, blur, lenses:[{x,y,r,mode}] }
     mode: 'flat' 평면거울, 'convex-mirror' 볼록 거울, 'concave-near' 오목 거울(가까이), 'concave-far' 오목 거울(멀리),
           'convex-lens' 볼록 렌즈(가까이), 'concave-lens' 오목 렌즈, 'plain' 그대로(렌즈 밖)
     frame: 'orange' 도로·가게 거울 테, 'metal' 금속 테, 'dental' 치과 거울, 'glasses' 안경테, 'none'
   상의 크기·방향은 개념 이해를 위한 모형이에요(실제 거울의 휘어진 정도에 따라 달라요). */
window.LP = (() => {
  const S = 1000, cache = {};
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const lin = (ctx, x0, y0, x1, y1, st) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const rad = (ctx, x, y, r0, r1, st) => { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const poly = (ctx, pts, fill, stroke, lw) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); } };
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  /* ---------- 3D 원근 (간단한 바늘구멍 사진기) ---------- */
  function cam(f, cx, cy, h) { return (X, Y, Z) => [cx + f * X / Z, cy + f * (h - Y) / Z]; }
  function box(ctx, P, x0, x1, y0, y1, z0, z1, col, opt = {}) {
    // 보이는 면: 위(카메라가 위에 있을 때), 앞(z0), 가운데 쪽 옆면
    const c = (X, Y, Z) => P(X, Y, Z);
    const side = opt.side;   // 'L' 왼쪽 면(x0) 보임 / 'R' 오른쪽 면(x1) 보임
    if (side === 'R') poly(ctx, [c(x1, y0, z0), c(x1, y0, z1), c(x1, y1, z1), c(x1, y1, z0)], col.side);
    if (side === 'L') poly(ctx, [c(x0, y0, z0), c(x0, y0, z1), c(x0, y1, z1), c(x0, y1, z0)], col.side);
    if (opt.top !== false) poly(ctx, [c(x0, y1, z0), c(x1, y1, z0), c(x1, y1, z1), c(x0, y1, z1)], col.top);
    poly(ctx, [c(x0, y0, z0), c(x1, y0, z0), c(x1, y1, z0), c(x0, y1, z0)], col.front);
  }

  /* ---------- 장면: 편의점 (천장 모서리 높이에서 본 가게) ---------- */
  function store(ctx) {
    seed = 11;
    const P = cam(430, 500, 330, 2.85);
    // 천장
    ctx.fillStyle = lin(ctx, 0, 0, 0, 340, [[0, '#d9dde2'], [1, '#eef0f2']]); ctx.fillRect(0, 0, S, S);
    const zB = 15;
    // 벽
    poly(ctx, [P(-5.5, 3.2, 1.2), P(-5.5, 3.2, zB), P(-5.5, 0, zB), P(-5.5, 0, 1.2)], lin(ctx, 0, 0, 300, 0, [[0, '#cfd6dc'], [1, '#e7ebee']]));
    poly(ctx, [P(5.5, 3.2, 1.2), P(5.5, 3.2, zB), P(5.5, 0, zB), P(5.5, 0, 1.2)], lin(ctx, S, 0, 700, 0, [[0, '#cfd6dc'], [1, '#e7ebee']]));
    poly(ctx, [P(-5.5, 3.2, zB), P(5.5, 3.2, zB), P(5.5, 0, zB), P(-5.5, 0, zB)], '#eef1f3');
    // 바닥 타일
    poly(ctx, [P(-5.5, 0, 1.2), P(5.5, 0, 1.2), P(5.5, 0, zB), P(-5.5, 0, zB)], lin(ctx, 0, 380, 0, S, [[0, '#d8d1c3'], [1, '#efe9dc']]));
    ctx.strokeStyle = 'rgba(120,105,80,.18)'; ctx.lineWidth = 1.2;
    for (let x = -5.5; x <= 5.5; x += 1.1) { const a = P(x, 0, 1.2), b = P(x, 0, zB); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    for (let z = 1.2; z <= zB; z += 1.1) { const a = P(-5.5, 0, z), b = P(5.5, 0, z); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    // 천장 조명
    for (let z = 3; z < zB; z += 3) for (const x of [-2.2, 2.2]) {
      poly(ctx, [P(x - .5, 3.2, z), P(x + .5, 3.2, z), P(x + .5, 3.2, z + 1.6), P(x - .5, 3.2, z + 1.6)], '#ffffff', 'rgba(0,0,0,.08)');
    }
    // 뒷벽 냉장고
    for (let i = 0; i < 6; i++) {
      const x0 = -4.8 + i * 1.6, x1 = x0 + 1.5;
      poly(ctx, [P(x0, .1, zB - .05), P(x1, .1, zB - .05), P(x1, 2.3, zB - .05), P(x0, 2.3, zB - .05)], '#4d5966');
      poly(ctx, [P(x0 + .08, .2, zB - .1), P(x1 - .08, .2, zB - .1), P(x1 - .08, 2.2, zB - .1), P(x0 + .08, 2.2, zB - .1)], lin(ctx, 0, 300, 0, 470, [[0, '#d8ecf7'], [1, '#a9c9db']]));
      for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) {
        const cols = ['#e3533f', '#2f7fc4', '#f0b23a', '#3aa36a', '#ffffff', '#7a5ac4'];
        const bx = x0 + .15 + k * .21, by = .3 + r * .48;
        poly(ctx, [P(bx, by, zB - .12), P(bx + .14, by, zB - .12), P(bx + .14, by + .34, zB - .12), P(bx, by + .34, zB - .12)], cols[(i + r + k) % 6]);
      }
    }
    // 진열대: 멀리 있는 것부터
    const prod = ['#e0563f', '#f2b134', '#3c86c9', '#49a66f', '#f4f1ea', '#8a62c9', '#e7884a', '#2b5b8c'];
    function shelf(x0, x1, z0, z1, side) {
      const h = 1.75;
      box(ctx, P, x0, x1, 0, h, z0, z1, { top: '#f6f7f8', front: '#c7ced5', side: '#e9edf0' }, { side });
      const fx = side === 'R' ? x1 : x0;
      for (let r = 0; r < 4; r++) {
        const y = .12 + r * .42;
        poly(ctx, [P(fx, y - .03, z0), P(fx, y - .03, z1), P(fx, y, z1), P(fx, y, z0)], '#9aa4ad');
        for (let z = z0 + .1; z < z1 - .2; z += .32) {
          const c = prod[Math.floor(rnd() * prod.length)], hh = .22 + rnd() * .1;
          poly(ctx, [P(fx, y, z), P(fx, y, z + .26), P(fx, y + hh, z + .26), P(fx, y + hh, z)], c, 'rgba(0,0,0,.12)', .8);
        }
      }
    }
    shelf(-5.5, -4.6, 2, zB - .3, 'R'); shelf(4.6, 5.5, 2, zB - .3, 'L');
    // 손님 (가운데 통로)
    function person(X, Z, coat, hair) {
      const s = 430 / Z, [px, py] = P(X, 0, Z);
      ctx.fillStyle = 'rgba(40,40,40,.18)'; ctx.beginPath(); ctx.ellipse(px, py, .35 * s, .08 * s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#2f3a4a'; rr(ctx, px - .2 * s, py - .85 * s, .17 * s, .85 * s, 4); ctx.fill(); rr(ctx, px + .03 * s, py - .85 * s, .17 * s, .85 * s, 4); ctx.fill();
      ctx.fillStyle = lin(ctx, px - .3 * s, 0, px + .3 * s, 0, [[0, coat[1]], [.5, coat[0]], [1, coat[1]]]); rr(ctx, px - .3 * s, py - 1.55 * s, .6 * s, .78 * s, .12 * s); ctx.fill();
      ctx.fillStyle = '#f0c9a5'; ctx.beginPath(); ctx.arc(px, py - 1.72 * s, .15 * s, 0, 7); ctx.fill();
      ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(px, py - 1.76 * s, .155 * s, Math.PI, 0); ctx.fill();
    }
    shelf(-2.9, -1.7, 3.5, 12, 'R'); shelf(1.7, 2.9, 3.5, 12, 'L');
    person(.35, 9, ['#3d7cc0', '#285a8f'], '#2b2420');
    person(-3.5, 13, ['#d9694a', '#a64a32'], '#4a3426');
    person(3.4, 6.5, ['#5a9d6a', '#3d7a4d'], '#1f1a17');
    // 가까운 진열대(아래쪽)
    shelf(-2.9, -1.7, 1.25, 3.2, 'R'); shelf(1.7, 2.9, 1.25, 3.2, 'L');
  }

  /* ---------- 장면: 굽은 길 모퉁이 (거울 높이에서 본 길) ---------- */
  function road(ctx) {
    seed = 5;
    const P = cam(380, 500, 300, 2.6);
    ctx.fillStyle = lin(ctx, 0, 0, 0, 330, [[0, '#9cc8ec'], [1, '#dcecf8']]); ctx.fillRect(0, 0, S, 330);
    ctx.fillStyle = '#c7d9b1'; ctx.fillRect(0, 300, S, 700);
    // 먼 산·건물
    ctx.fillStyle = '#9fb9a0'; ctx.beginPath(); ctx.moveTo(0, 300); for (let x = 0; x <= S; x += 50) ctx.lineTo(x, 300 - 30 - 25 * Math.sin(x / 140) - 12 * Math.sin(x / 47)); ctx.lineTo(S, 300); ctx.fill();
    // 가로 도로 (왼쪽 → 오른쪽)
    const Z0 = 7, Z1 = 10.5;
    poly(ctx, [P(-40, 0, Z0), P(40, 0, Z0), P(40, 0, Z1), P(-40, 0, Z1)], '#7d848b');
    poly(ctx, [P(-40, 0, Z1), P(40, 0, Z1), P(40, 0, Z1 + 1), P(-40, 0, Z1 + 1)], '#d9d3c6');
    for (let x = -40; x < 40; x += 3) poly(ctx, [P(x, 0, (Z0 + Z1) / 2 - .06), P(x + 1.6, 0, (Z0 + Z1) / 2 - .06), P(x + 1.6, 0, (Z0 + Z1) / 2 + .06), P(x, 0, (Z0 + Z1) / 2 + .06)], '#f2f2f2');
    // 우리 쪽 도로 (앞으로)
    poly(ctx, [P(-1.8, 0, 1), P(1.8, 0, 1), P(1.8, 0, Z0), P(-1.8, 0, Z0)], '#80878e');
    poly(ctx, [P(-2.6, 0, 1), P(-1.8, 0, 1), P(-1.8, 0, Z0), P(-2.6, 0, Z0)], '#d9d3c6');
    poly(ctx, [P(1.8, 0, 1), P(2.6, 0, 1), P(2.6, 0, Z0), P(1.8, 0, Z0)], '#d9d3c6');
    // 건널목
    for (let k = -1.6; k < 1.7; k += .5) poly(ctx, [P(k, 0, Z0 - 1.2), P(k + .28, 0, Z0 - 1.2), P(k + .28, 0, Z0 - .2), P(k, 0, Z0 - .2)], '#f4f4f4');
    // 모퉁이 담장 (양옆에서 시야를 가림)
    box(ctx, P, -40, -2.6, 0, 1.9, 1, Z0 - .3, { top: '#d6cab5', front: '#b9aa90', side: '#c9bba2' }, { side: 'R' });
    box(ctx, P, 2.6, 40, 0, 1.9, 1, Z0 - .3, { top: '#d6cab5', front: '#b9aa90', side: '#c9bba2' }, { side: 'L' });
    // 담장 무늬
    ctx.strokeStyle = 'rgba(90,70,40,.18)'; ctx.lineWidth = 1;
    for (let z = 1.5; z < Z0 - .3; z += .6) { const a = P(-2.6, 0, z), b = P(-2.6, 1.9, z); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); const c = P(2.6, 0, z), d = P(2.6, 1.9, z); ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke(); }
    // 뒤 건물들
    const cols = ['#e9dcc8', '#d7e1ea', '#efe5d3', '#dfd3c2'];
    for (let i = -6; i < 6; i++) { const x0 = i * 5.2 + 1, y1 = 3 + (i * 7 % 5) * .6; box(ctx, P, x0, x0 + 4.6, 0, y1, Z1 + 1.5, Z1 + 5, { top: '#c9c2b6', front: cols[(i + 8) % 4], side: '#c8bfb1' }, { top: false });
      for (let w = 0; w < 3; w++) for (let r = 0; r < 2; r++) poly(ctx, [P(x0 + .6 + w * 1.3, 1 + r * 1.1, Z1 + 1.5), P(x0 + 1.4 + w * 1.3, 1 + r * 1.1, Z1 + 1.5), P(x0 + 1.4 + w * 1.3, 1.7 + r * 1.1, Z1 + 1.5), P(x0 + .6 + w * 1.3, 1.7 + r * 1.1, Z1 + 1.5)], '#8fb3cf'); }
    // 다가오는 차 (왼쪽에서)
    function car(X, Z, body) {
      const x0 = X, x1 = X + 3.9, z0 = Z - .85, z1 = Z + .85;
      ctx.fillStyle = 'rgba(30,30,30,.25)'; const a = P(x0 - .2, 0, z0), b = P(x1 + .4, 0, z1); ctx.beginPath(); ctx.ellipse((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 4, Math.abs(b[0] - a[0]) / 2, 10, 0, 0, 7); ctx.fill();
      box(ctx, P, x0, x1, .25, .95, z0, z1, { top: body[0], front: body[1], side: body[2] }, { side: 'R' });
      box(ctx, P, x0 + .9, x1 - .9, .95, 1.5, z0 + .12, z1 - .12, { top: body[0], front: '#5d7a92', side: '#5d7a92' }, { side: 'R' });
      for (const wx of [x0 + .8, x1 - .8]) { const w = P(wx, .3, z0); ctx.fillStyle = '#1d2024'; ctx.beginPath(); ctx.ellipse(w[0], w[1], 17, 17, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#9aa1a8'; ctx.beginPath(); ctx.ellipse(w[0], w[1], 7, 7, 0, 0, 7); ctx.fill(); }
      const h = P(x1, .65, z0 + .3); ctx.fillStyle = rad(ctx, h[0], h[1], 0, 26, [[0, '#fffbe0'], [1, 'rgba(255,250,210,0)']]); ctx.beginPath(); ctx.arc(h[0], h[1], 26, 0, 7); ctx.fill();
    }
    car(-10.4, 8, ['#e4554a', '#c03c33', '#a8322a']);
    // 길가 나무
    for (const [X, Z] of [[-9, 12], [-4, 12.2], [6, 12.1], [12, 12.4]]) {
      const t = P(X, 0, Z), s = 380 / Z; ctx.fillStyle = '#6b5236'; ctx.fillRect(t[0] - .08 * s, t[1] - 1.2 * s, .16 * s, 1.2 * s);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#5f9a52' : '#4b8442'; ctx.beginPath(); ctx.arc(t[0] + (rnd() - .5) * .9 * s, t[1] - (1.6 + rnd() * .8) * s, (.45 + rnd() * .2) * s, 0, 7); ctx.fill(); }
    }
    // 걸어오는 사람 (오른쪽)
    const p = P(7, 0, 9.6), s = 380 / 9.6; ctx.fillStyle = '#2c3440'; ctx.fillRect(p[0] - .16 * s, p[1] - .8 * s, .32 * s, .8 * s); ctx.fillStyle = '#e5a94b'; rr(ctx, p[0] - .25 * s, p[1] - 1.5 * s, .5 * s, .75 * s, 5); ctx.fill(); ctx.fillStyle = '#f0c9a5'; ctx.beginPath(); ctx.arc(p[0], p[1] - 1.66 * s, .14 * s, 0, 7); ctx.fill();
  }

  /* ---------- 장면: 미용실 손님 ---------- */
  function face(ctx) {
    ctx.fillStyle = lin(ctx, 0, 0, 0, S, [[0, '#f1ece6'], [1, '#e2d9cf']]); ctx.fillRect(0, 0, S, S);
    // 뒤 벽 선반·화분
    ctx.fillStyle = '#d6c9b8'; ctx.fillRect(0, 300, S, 10);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = ['#7aa6c9', '#e0b46a', '#c98a7a', '#8fb98a', '#b6a0cf'][i]; rr(ctx, 90 + i * 70, 230, 40, 70, 8); ctx.fill(); }
    ctx.fillStyle = '#9b7b5c'; rr(ctx, 760, 230, 70, 70, 10); ctx.fill(); for (let k = 0; k < 7; k++) { ctx.fillStyle = '#5c9a55'; ctx.beginPath(); ctx.ellipse(795 + Math.cos(k) * 40, 200 - Math.sin(k * 1.7) * 30, 34, 14, k, 0, 7); ctx.fill(); }
    // 미용사 (뒤)
    ctx.fillStyle = '#3a3f47'; rr(ctx, 600, 380, 260, 620, 110); ctx.fill();
    ctx.fillStyle = '#efc7a3'; ctx.beginPath(); ctx.arc(730, 330, 70, 0, 7); ctx.fill();
    ctx.fillStyle = '#6a4630'; ctx.beginPath(); ctx.arc(730, 310, 74, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); rr(ctx, 660, 290, 30, 120, 14); ctx.fill();
    // 손님 망토
    ctx.fillStyle = lin(ctx, 200, 0, 760, 0, [[0, '#2f5f95'], [.5, '#3f78b5'], [1, '#2a5486']]);
    ctx.beginPath(); ctx.moveTo(150, S); ctx.quadraticCurveTo(200, 620, 480, 600); ctx.quadraticCurveTo(760, 620, 810, S); ctx.fill();
    ctx.fillStyle = '#efc7a3'; rr(ctx, 440, 540, 80, 90, 20); ctx.fill();
    // 얼굴
    ctx.fillStyle = rad(ctx, 460, 420, 20, 170, [[0, '#f6d4b2'], [1, '#e7b48d']]); ctx.beginPath(); ctx.ellipse(480, 440, 135, 165, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#e7b48d'; ctx.beginPath(); ctx.ellipse(345, 450, 22, 38, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(615, 450, 22, 38, 0, 0, 7); ctx.fill();
    // 머리카락 (오른쪽 가르마로 좌우 구별)
    ctx.fillStyle = '#2b1f18'; ctx.beginPath(); ctx.moveTo(340, 430); ctx.quadraticCurveTo(330, 250, 480, 255); ctx.quadraticCurveTo(640, 255, 620, 430); ctx.quadraticCurveTo(600, 330, 540, 320); ctx.quadraticCurveTo(450, 350, 380, 320); ctx.quadraticCurveTo(350, 360, 340, 430); ctx.fill();
    ctx.strokeStyle = '#4a382b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(540, 262); ctx.quadraticCurveTo(545, 290, 540, 320); ctx.stroke();
    // 눈·눈썹·입
    for (const x of [430, 530]) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, 445, 20, 12, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#3b2a20'; ctx.beginPath(); ctx.arc(x, 446, 9, 0, 7); ctx.fill(); ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - 24, 412); ctx.quadraticCurveTo(x, 402, x + 24, 412); ctx.stroke(); }
    ctx.strokeStyle = '#c98f6c'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(480, 470); ctx.quadraticCurveTo(470, 500, 486, 505); ctx.stroke();
    ctx.strokeStyle = '#b2584b'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(445, 540); ctx.quadraticCurveTo(480, 562, 518, 540); ctx.stroke();
    // 가위
    ctx.strokeStyle = '#aeb6bf'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(640, 300); ctx.lineTo(560, 250); ctx.moveTo(640, 280); ctx.lineTo(565, 265); ctx.stroke();
    ctx.strokeStyle = '#d24c3f'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(660, 300, 16, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(660, 270, 16, 0, 7); ctx.stroke();
  }

  /* ---------- 장면: 치아 ---------- */
  function teeth(ctx) {
    ctx.fillStyle = '#5a1f22'; ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = rad(ctx, 500, 500, 50, 600, [[0, '#7a2b2e'], [1, '#3b1214']]); ctx.fillRect(0, 0, S, S);
    // 잇몸
    ctx.fillStyle = lin(ctx, 0, 140, 0, 330, [[0, '#d46f78'], [1, '#e9939a']]);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(S, 0); ctx.lineTo(S, 260); ctx.quadraticCurveTo(500, 470, 0, 260); ctx.fill();
    // 윗니 (둥글게 늘어섬)
    const n = 10;
    for (let i = 0; i < n; i++) {
      const t = (i + .5) / n, x = 60 + t * 880, y = 250 + 170 * Math.sin(t * Math.PI), w = 72 + 30 * Math.sin(t * Math.PI), h = 130 + 40 * Math.sin(t * Math.PI);
      ctx.fillStyle = lin(ctx, x - w / 2, 0, x + w / 2, 0, [[0, '#d9d2c2'], [.35, '#fbf8f0'], [.7, '#f1ebdd'], [1, '#cfc6b3']]);
      rr(ctx, x - w / 2, y - h * .65, w, h, 26); ctx.fill();
      ctx.strokeStyle = 'rgba(120,100,80,.25)'; ctx.lineWidth = 2; ctx.stroke();
      if (i === 6) { ctx.fillStyle = '#5a4630'; ctx.beginPath(); ctx.ellipse(x + 8, y + h * .12, 10, 7, .4, 0, 7); ctx.fill(); ctx.fillStyle = '#8a6a44'; ctx.beginPath(); ctx.ellipse(x + 8, y + h * .12, 16, 11, .4, 0, 7); ctx.globalAlpha = .35; ctx.fill(); ctx.globalAlpha = 1; }
    }
    // 아랫니 그림자
    ctx.fillStyle = 'rgba(30,8,10,.6)'; ctx.beginPath(); ctx.moveTo(0, 820); ctx.quadraticCurveTo(500, 560, S, 820); ctx.lineTo(S, S); ctx.lineTo(0, S); ctx.fill();
  }

  /* ---------- 장면: 책 ---------- */
  function page(ctx) {
    ctx.fillStyle = lin(ctx, 0, 0, S, S, [[0, '#fbf8f1'], [1, '#f1ebdd']]); ctx.fillRect(0, 0, S, S);
    const lines = ['우리는 목적에 따라 다양한 형태의 거울과', '렌즈를 사용한다. 우리 주변에서 거울과', '렌즈를 어떻게 활용하고 있는지 알아보자.', '평면거울은 물체의 모습을 그대로 비추므로', '자신의 모습을 비춰 보는 데 많이 이용한다.', '볼록 거울은 넓은 범위를 볼 때 이용하고,', '오목 거울은 가까이 있는 물체의 모습을', '확대하여 볼 때나 빛을 모을 때 이용한다.', '렌즈도 안경이나 카메라, 현미경 등 여러', '곳에 이용된다. 우리 주변의 거울과 렌즈'];
    ctx.fillStyle = '#2a2a2a'; ctx.font = '600 34px Pretendard, "Malgun Gothic", sans-serif'; ctx.textBaseline = 'middle';
    lines.forEach((t, i) => ctx.fillText(t, 70, 110 + i * 84));
  }

  /* ---------- 장면: 양파 껍질 세포 ---------- */
  function cells(ctx) {
    seed = 3;
    ctx.fillStyle = rad(ctx, 500, 500, 100, 700, [[0, '#f6e9f0'], [1, '#e3c9d9']]); ctx.fillRect(0, 0, S, S);
    for (let r = 0; r < 12; r++) {
      let x = -60 + (r % 2) * 60;
      while (x < S) {
        const w = 150 + rnd() * 70, y = r * 88 - 20, sk = (rnd() - .5) * 20;
        ctx.fillStyle = `rgba(${200 + rnd() * 30},${150 + rnd() * 30},${185 + rnd() * 30},.55)`;
        poly(ctx, [[x + 6, y + 6], [x + w - 6, y + 6 + sk], [x + w - 6, y + 86 + sk], [x + 6, y + 86]], ctx.fillStyle, 'rgba(120,60,100,.65)', 3);
        ctx.fillStyle = 'rgba(110,40,95,.75)'; ctx.beginPath(); ctx.ellipse(x + w * (.3 + rnd() * .4), y + 46, 13, 10, 0, 0, 7); ctx.fill();
        x += w;
      }
    }
  }

  const SCENES = { store, road, face, teeth, page, cells };
  function scene(name) {
    if (cache[name]) return cache[name];
    const c = mk(S, S), ctx = c.getContext('2d'); SCENES[name](ctx);
    cache[name] = { c, d: ctx.getImageData(0, 0, S, S).data };
    return cache[name];
  }

  /* 둥근 기구 안: 출력 반지름 ρ(0~1) → 장면 반지름 (장면 반 폭 = 1) */
  const MAP = {
    'flat': (p) => .5 * p,
    'convex-mirror': (p) => .36 * p + .6 * p * p * p,
    'concave-near': (p) => .26 * p + .05 * p * p * p,
    'concave-far': (p) => -(.42 * p + .3 * p * p * p),
    'convex-lens': (p) => .5 * (.42 * p),
    'concave-lens': (p) => .5 * (1.7 * p + .5 * p * p * p),
    'plain': (p) => .5 * p,
  };
  const FLIP = { 'flat': true, 'convex-mirror': true, 'concave-near': true, 'concave-far': true };

  function render(cv, o) {
    const ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    const sc = scene(o.scene), src = sc.d;
    const out = ctx.createImageData(W, H), od = out.data;
    const lenses = o.lenses || null;
    const CX = W / 2, CY = H / 2, R = Math.min(W, H) * .44;
    const cx0 = (o.center ? o.center[0] : .5) * S, cy0 = (o.center ? o.center[1] : .5) * S;
    const half = S / 2;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let sx, sy, inside = true;
      if (lenses) {
        // 책 위의 안경: 렌즈 밖은 그대로, 렌즈 안은 렌즈 가운데를 기준으로 바뀐 모습
        const bs = (o.base || 1) * S / W;
        sx = cx0 + (x - CX) * bs; sy = cy0 + (y - CY) * bs;
        for (const L of lenses) {
          const lx = L.x * W, ly = L.y * H, dx = x - lx, dy = y - ly, r = Math.hypot(dx, dy), LR = L.r * W;
          if (r < LR) { const k = L.mode === 'convex-lens' ? .5 : (1.45 + .35 * (r / LR) * (r / LR)); sx = cx0 + (lx - CX) * bs + dx * bs * k; sy = cy0 + (ly - CY) * bs + dy * bs * k; }
        }
      } else {
        const dx = x - CX, dy = y - CY, r = Math.hypot(dx, dy) / R;
        if (r > 1) { inside = false; }
        else {
          const f = MAP[o.mode](r) / (r || 1e-6);
          let ux = dx / R * f, uy = dy / R * f;
          if (FLIP[o.mode]) ux = -ux;
          sx = cx0 + ux * half; sy = cy0 + uy * half;
        }
      }
      const i = (y * W + x) * 4;
      if (!inside) { od[i + 3] = 0; continue; }
      let ix = Math.round(sx), iy = Math.round(sy);
      if (ix < 0 || iy < 0 || ix >= S || iy >= S) { od[i] = 210; od[i + 1] = 214; od[i + 2] = 219; od[i + 3] = 255; continue; }
      const j = (iy * S + ix) * 4;
      od[i] = src[j]; od[i + 1] = src[j + 1]; od[i + 2] = src[j + 2]; od[i + 3] = 255;
    }
    const tmp = mk(W, H); tmp.getContext('2d').putImageData(out, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // 배경 (벽)
    if (!lenses) {
      ctx.fillStyle = o.wall || lin(ctx, 0, 0, 0, H, [[0, '#e9edf1'], [1, '#d5dce3']]); ctx.fillRect(0, 0, W, H);
      if (o.frame === 'orange' || o.frame === 'metal') { ctx.fillStyle = 'rgba(30,40,55,.18)'; ctx.beginPath(); ctx.arc(CX + 10, CY + 14, R * 1.08, 0, 7); ctx.fill(); }
    }
    ctx.save();
    if (!lenses) { ctx.beginPath(); ctx.arc(CX, CY, R, 0, 7); ctx.clip(); }
    if (o.blur) ctx.filter = `blur(${o.blur}px)`;
    ctx.drawImage(tmp, 0, 0); ctx.filter = 'none';
    if (!lenses) {
      // 유리 광택과 가장자리 어두움
      ctx.fillStyle = rad(ctx, CX, CY, R * .55, R, [[0, 'rgba(10,24,36,0)'], [1, o.mode === 'convex-mirror' ? 'rgba(10,24,36,.32)' : 'rgba(10,24,36,.18)']]); ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = R * .06; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(CX, CY, R * .82, Math.PI * 1.1, Math.PI * 1.42); ctx.stroke();
      ctx.fillStyle = lin(ctx, CX - R, CY - R, CX + R, CY + R, [[0, 'rgba(255,255,255,.25)'], [.4, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,.08)']]); ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
    // 테
    if (!lenses && o.frame === 'orange') {
      ctx.lineWidth = R * .13; ctx.strokeStyle = lin(ctx, CX - R, CY - R, CX + R, CY + R, [[0, '#ff8a5b'], [.5, '#e2462a'], [1, '#a92f1a']]); ctx.beginPath(); ctx.arc(CX, CY, R * 1.06, 0, 7); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.arc(CX, CY, R, 0, 7); ctx.stroke();
    } else if (!lenses && (o.frame === 'metal' || o.frame === 'dental')) {
      ctx.lineWidth = R * (o.frame === 'dental' ? .05 : .08); ctx.strokeStyle = lin(ctx, CX - R, CY - R, CX + R, CY + R, [[0, '#f4f6f8'], [.35, '#9aa3ad'], [.6, '#5b636d'], [1, '#c3cad2']]); ctx.beginPath(); ctx.arc(CX, CY, R * 1.03, 0, 7); ctx.stroke();
      if (o.frame === 'dental') { ctx.lineWidth = R * .1; ctx.beginPath(); ctx.moveTo(CX + R * .74, CY + R * .74); ctx.lineTo(W, H + R * .3); ctx.stroke(); }
    }
    if (lenses && o.frame === 'glasses') {
      ctx.lineWidth = W * .012; ctx.strokeStyle = '#3b3027';
      lenses.forEach((L) => { ctx.beginPath(); ctx.ellipse(L.x * W, L.y * H, L.r * W * 1.02, L.r * W * .95, 0, 0, 7); ctx.stroke();
        ctx.save(); ctx.beginPath(); ctx.ellipse(L.x * W, L.y * H, L.r * W, L.r * W * .93, 0, 0, 7); ctx.clip();
        ctx.fillStyle = L.mode === 'convex-lens' ? 'rgba(200,225,240,.10)' : 'rgba(170,205,230,.14)'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = W * .008; ctx.beginPath(); ctx.arc(L.x * W, L.y * H, L.r * W * .8, Math.PI * 1.1, Math.PI * 1.4); ctx.stroke(); ctx.restore(); });
      const a = lenses[0], b = lenses[1];
      if (b) { ctx.beginPath(); ctx.moveTo(a.x * W + a.r * W, a.y * H - a.r * W * .2); ctx.quadraticCurveTo((a.x + b.x) / 2 * W, a.y * H - a.r * W * .55, b.x * W - b.r * W, b.y * H - b.r * W * .2); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(a.x * W - a.r * W, a.y * H - a.r * W * .3); ctx.lineTo(0, a.y * H - a.r * W * .45); ctx.stroke();
      if (b) { ctx.beginPath(); ctx.moveTo(b.x * W + b.r * W, b.y * H - b.r * W * .3); ctx.lineTo(W, b.y * H - b.r * W * .45); ctx.stroke(); }
    }
    if (lenses && o.frame === 'loupe') {
      const L = lenses[0];
      ctx.lineWidth = W * .02; ctx.strokeStyle = '#2a2f36'; ctx.beginPath(); ctx.arc(L.x * W, L.y * H, L.r * W * 1.01, 0, 7); ctx.stroke();
    }
  }

  return { scene, render };
})();
