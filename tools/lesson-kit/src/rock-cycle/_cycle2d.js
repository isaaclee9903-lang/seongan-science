/* ===== 암석의 순환 (교과서 그림 Ⅱ-13을 움직이는 그림으로) =====
   바다와 화산이 있는 땅을 비스듬히 내려다본 단면 덩어리. 화산은 가운데를 잘라 앞면에 마그마 방과 통로가 보여요.
   CYC.draw(ctx, W, H, t, o) → { labels } (상자·화살표 이름은 페이지 글꼴 이름표로 얹어요)
     o.focus: 이 상자에서 나가는 화살표만 밝게 · o.arrow: 이 화살표 하나만 밝게 · o.marks: 상자 이름 대신 번호(정리 페이지)
     o.after(ctx): 같은 좌표계에서 덧그리기(시뮬레이션의 움직이는 암석) · o.flow === false: 흐르는 점 끄기 · o.hideNode: 이름표를 숨길 상자
   CYC.hit(x, y, W, H): 화면 좌표 → 가장 가까운 상자 id · CYC.token(ctx, x, y, kind, s, t): 상태별 작은 암석 그림
   설계 크기 1200×720. 이 조각 앞에 ART(_art.js)가 있어야 해요. */
window.CYC = (function () {
  'use strict';
  var A = window.ART, W0 = 1200, H0 = 720, lerp = A.lerp, clamp = A.clamp;
  var S = 96, OX = 52, OY = 392, KX = 0.42, KY = 0.27, XW = 11.1, DZ = 3.0, BOT = -3.05, COAST = 4.1, VX = 8.3, VR = 2.9, VH = 2.75;
  var cam = A.cab(OX, OY, S, KX, KY);
  function hgt(x, z) { // 땅 높이: 바다 밑 → 해안 → 들판, 화산
    var r = Math.hypot(x - VX, z * 0.9), cone = r < VR ? VH * Math.pow(1 - r / VR, 1.25) : 0;
    if (r < 0.42) cone -= (0.42 - r) * 1.3;
    var sea = lerp(-0.95, -0.2, A.ease(x / (COAST - 0.3))), k = A.ease((x - (COAST - 0.55)) / 0.9);
    return lerp(sea, 0.12, k) + cone + 0.035 * (A.fbm(x * 1.5, z * 1.5, 3) - 0.5) * k;
  }
  var P = function (x, y, z) { return cam.p(x, y, z || 0); };
  var NODE_U = { ign: [6.85, 1.35], sed: [2.55, -0.55], sedr: [2.55, -1.65], meta: [5.0, -2.45], magma: [8.4, -2.05] };
  var NODES = {
    ign: { name: '화성암', col: 'rock' }, sed: { name: '퇴적물', col: 'warm' }, sedr: { name: '퇴적암', col: 'rock' }, meta: { name: '변성암', col: 'rock' }, magma: { name: '마그마', col: 'warm' },
  };
  Object.keys(NODE_U).forEach(function (k) { var s = P(NODE_U[k][0], NODE_U[k][1], 0); NODES[k].x = s[0]; NODES[k].y = s[1]; });
  var G = '#4f8f5a', R = '#bf5679';
  // 화살표: 단위 좌표 [시작, 조절점, 끝] → 화면 좌표
  var AU = [
    { id: 'ign-sed', from: 'ign', to: 'sed', label: '풍화·침식·운반', col: G, u: [[6.4, 1.75], [4.4, 3.6], [2.85, -0.15]], lu: 0.42, lo: [0, -14] },
    { id: 'sed-sedr', from: 'sed', to: 'sedr', label: '다져지고 굳어짐', col: G, u: [[2.25, -0.85], [1.9, -1.1], [2.25, -1.38]], lu: 0.5, lo: [-74, 0] },
    { id: 'sedr-sed', from: 'sedr', to: 'sed', label: '풍화·침식·운반', col: G, u: [[2.95, -1.38], [3.35, -1.1], [2.95, -0.85]], lu: 0.5, lo: [70, 2] },
    { id: 'meta-sed', from: 'meta', to: 'sed', label: '풍화·침식·운반', col: G, u: [[5.05, -2.15], [4.9, -0.6], [3.2, -0.45]], lu: 0.22, lo: [64, 6] },
    { id: 'sedr-meta', from: 'sedr', to: 'meta', label: '높은 열과 압력', col: R, u: [[2.75, -1.95], [3.3, -2.6], [4.35, -2.55]], lu: 0.5, lo: [-30, 22] },
    { id: 'ign-meta', from: 'ign', to: 'meta', label: '높은 열과 압력', col: R, u: [[6.6, 1.05], [6.0, -1.2], [5.35, -2.15]], lu: 0.3, lo: [-66, -4] },
    { id: 'ign-magma', from: 'ign', to: 'magma', label: '녹음', col: R, u: [[7.15, 1.05], [7.55, -0.5], [8.05, -1.72]], lu: 0.5, lo: [-30, 0] },
    { id: 'magma-ign', from: 'magma', to: 'ign', label: '식음', col: G, u: [[8.8, -1.72], [8.9, 0.2], [7.45, 1.45]], lu: 0.45, lo: [32, 0] },
    { id: 'meta-magma', from: 'meta', to: 'magma', label: '녹음', col: R, u: [[5.6, -2.75], [6.8, -3.15], [7.75, -2.35]], lu: 0.55, lo: [0, 20] },
  ];
  var ARROWS = AU.map(function (a) { return { id: a.id, from: a.from, to: a.to, label: a.label, col: a.col, b: a.u.map(function (q) { return P(q[0], q[1], 0); }), lu: a.lu, lo: a.lo }; });
  function bez(b, u) { var a = b[0], c = b[1], d = b[2], v = 1 - u; return [v * v * a[0] + 2 * v * u * c[0] + u * u * d[0], v * v * a[1] + 2 * v * u * c[1] + u * u * d[1]]; }
  function tan(b, u) { var a = b[0], c = b[1], d = b[2]; return Math.atan2(2 * (1 - u) * (c[1] - a[1]) + 2 * u * (d[1] - c[1]), 2 * (1 - u) * (c[0] - a[0]) + 2 * u * (d[0] - c[0])); }

  /* ---------- 움직이지 않는 부분을 한 번 그려 둬요 ---------- */
  var base = null, baseS = 0;
  function front(g) { // 앞면(z=0) 단면 그림: 땅 위 높이 아래로
    var top = function (x) { return hgt(x, 0); };
    g.save(); g.beginPath(); var x0 = 0, i;
    var pt = function (x, y) { return P(x, y, 0); };
    g.moveTo.apply(g, pt(0, BOT)); for (i = 0; i <= 220; i++) { var x = XW * i / 220; g.lineTo.apply(g, pt(x, top(x))); } g.lineTo.apply(g, pt(XW, BOT)); g.closePath(); g.clip();
    var yTop = pt(0, 3.2)[1], yBot = pt(0, BOT)[1], xL = pt(0, 0)[0], xR = pt(XW, 0)[0];
    var dg = g.createLinearGradient(0, pt(0, 0.3)[1], 0, yBot); dg.addColorStop(0, '#c9ae86'); dg.addColorStop(0.45, '#a9845c'); dg.addColorStop(0.8, '#80553a'); dg.addColorStop(1, '#5d3424'); g.fillStyle = dg; g.fillRect(xL, yTop, xR - xL, yBot - yTop);
    // 지층: 바다 밑은 수평, 화산 쪽은 위로 휘어요
    var bandCols = ['rgba(232,212,176,.55)', 'rgba(150,112,76,.35)', 'rgba(214,186,146,.5)', 'rgba(130,92,60,.32)', 'rgba(204,176,134,.45)'];
    for (i = 0; i < 11; i++) {
      var y0 = -0.35 - i * 0.24; g.beginPath();
      for (var k = 0; k <= 120; k++) { var xx = XW * k / 120, bend = 0.55 * Math.exp(-Math.pow((xx - VX) / 2.2, 2)) * (1 - i / 14) + 0.06 * Math.sin(xx * 1.7 + i); g.lineTo.apply(g, pt(xx, y0 + bend)); }
      for (k = 120; k >= 0; k--) { var x2 = XW * k / 120, bend2 = 0.55 * Math.exp(-Math.pow((x2 - VX) / 2.2, 2)) * (1 - i / 14) + 0.06 * Math.sin(x2 * 1.7 + i); g.lineTo.apply(g, pt(x2, y0 - 0.09 - (i % 3) * 0.03 + bend2)); }
      g.closePath(); g.fillStyle = bandCols[i % bandCols.length]; g.fill();
    }
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.55; g.fillStyle = A.pat(g, 'strata'); g.fillRect(xL, yTop, xR - xL, yBot - yTop); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // 해저 퇴적물 띠
    g.beginPath(); for (i = 0; i <= 80; i++) { var xs = (COAST + 0.2) * i / 80; g.lineTo.apply(g, pt(xs, top(xs) + 0.02)); } for (i = 80; i >= 0; i--) { var xs2 = (COAST + 0.2) * i / 80; g.lineTo.apply(g, pt(xs2, top(xs2) - 0.17)); } g.closePath(); g.fillStyle = A.pat(g, 'sand'); g.fill();
    // 화산 몸체 단면 (굳은 용암 층)
    g.beginPath(); for (i = 0; i <= 80; i++) { var xv = VX - VR + 2 * VR * i / 80; g.lineTo.apply(g, pt(xv, top(xv) + 0.01)); } for (i = 80; i >= 0; i--) { var xv2 = VX - VR + 2 * VR * i / 80; g.lineTo.apply(g, pt(xv2, Math.max(0.0, top(xv2) - 0.55) * 0.25)); } g.closePath();
    var vg = g.createLinearGradient(0, pt(0, VH)[1], 0, pt(0, 0)[1]); vg.addColorStop(0, '#77695c'); vg.addColorStop(1, '#5b4c40'); g.fillStyle = vg; g.fill();
    g.save(); g.clip(); g.strokeStyle = 'rgba(40,30,22,.28)'; g.lineWidth = 1.5; for (i = 1; i < 8; i++) { g.beginPath(); for (var k2 = 0; k2 <= 60; k2++) { var xc = VX - VR + 2 * VR * k2 / 60; g.lineTo.apply(g, pt(xc, top(xc) - i * 0.27)); } g.stroke(); } g.restore();
    // 깊은 곳의 열기
    var hc = pt(7.2, -3.3), hg = g.createRadialGradient(hc[0], hc[1], 20, hc[0], hc[1], 520); hg.addColorStop(0, 'rgba(230,110,50,.5)'); hg.addColorStop(1, 'rgba(230,110,50,0)'); g.fillStyle = hg; g.fillRect(xL, yTop, xR - xL, yBot - yTop);
    g.restore();
    // 바닷물 단면
    g.beginPath(); g.moveTo.apply(g, pt(0, 0)); g.lineTo.apply(g, pt(COAST - 0.15, 0)); for (i = 80; i >= 0; i--) { var xw = (COAST - 0.15) * i / 80; g.lineTo.apply(g, pt(xw, top(xw))); } g.closePath();
    var wg = g.createLinearGradient(0, pt(0, 0)[1], 0, pt(0, -1)[1]); wg.addColorStop(0, 'rgba(92,170,190,.92)'); wg.addColorStop(1, 'rgba(40,104,140,.95)'); g.fillStyle = wg; g.fill();
  }
  function buildBase(sc) {
    var cv = A.canvas(W0 * sc, H0 * sc), g = cv.getContext('2d'); g.scale(sc, sc);
    var sk = g.createLinearGradient(0, 0, 0, H0); sk.addColorStop(0, '#9cc3dc'); sk.addColorStop(0.55, '#e3ecea'); sk.addColorStop(1, '#efebe2'); g.fillStyle = sk; g.fillRect(0, 0, W0, H0);
    A.cloud(g, 170, 70, 1.0); A.cloud(g, 520, 46, 0.8); A.cloud(g, 1060, 80, 0.7);
    A.shadow(g, OX + 620, OY + (-BOT) * S + 22, 640, 40, 0.28);
    // 옆면 (오른쪽)
    var sideImg = A.canvas(Math.round(DZ * 60), Math.round((3.2 - BOT) * 60)), sg = sideImg.getContext('2d');
    var sgd = sg.createLinearGradient(0, 0, 0, sideImg.height); sgd.addColorStop(0, '#b5946a'); sgd.addColorStop(0.7, '#8a5e40'); sgd.addColorStop(1, '#5d3424'); sg.fillStyle = sgd; sg.fillRect(0, 0, sideImg.width, sideImg.height); sg.globalCompositeOperation = 'multiply'; sg.globalAlpha = 0.6; sg.fillStyle = sg.createPattern(A.texture('strata'), 'repeat'); sg.fillRect(0, 0, sideImg.width, sideImg.height);
    var hs = function (z) { return hgt(XW, z); };
    g.save(); g.beginPath(); g.moveTo.apply(g, P(XW, BOT, 0)); for (var i = 0; i <= 30; i++) { var z = DZ * i / 30; g.lineTo.apply(g, P(XW, hs(z), z)); } g.lineTo.apply(g, P(XW, BOT, DZ)); g.closePath(); g.clip();
    A.faceImg(g, cam, sideImg, [XW, 3.2, 0], [XW, 3.2, DZ], [XW, BOT, 0], 'rgba(20,10,4,.28)'); g.restore();
    // 윗면: 땅 모양을 작은 면으로 나눠 빛을 계산해요 (바다 밑, 해안, 풀밭, 화산)
    var NXq = 110, NZq = 22, quads = [];
    for (var a = 0; a < NXq; a++) for (var b = 0; b < NZq; b++) {
      var xa = XW * a / NXq, xb = XW * (a + 1) / NXq, za = DZ * b / NZq, zb = DZ * (b + 1) / NZq, xm = (xa + xb) / 2, zm = (za + zb) / 2, hm = hgt(xm, zm), r = Math.hypot(xm - VX, zm * 0.9);
      var col = xm < COAST - 0.2 ? [196, 176, 138] : r < VR * 0.98 ? (r < 0.55 ? [92, 70, 58] : [132, 112, 96]) : xm < COAST + 0.35 ? [206, 190, 150] : [118, 150, 82];
      if (r < VR && r > VR * 0.82 && xm > COAST) col = [lerp(132, 118, 0.5), lerp(112, 150, 0.5), lerp(96, 82, 0.5)];
      var nz = A.fbm(xm * 2.3, zm * 2.3, 9) - 0.5; col = [col[0] * (1 + nz * 0.18), col[1] * (1 + nz * 0.18), col[2] * (1 + nz * 0.18)];
      quads.push({ v: [[xa, hgt(xa, za), za], [xb, hgt(xb, za), za], [xb, hgt(xb, zb), zb], [xa, hgt(xa, zb), zb]], c: col });
    }
    A.mesh(g, cam, quads, { amb: 0.5, dif: 0.62 });
    // 화산 비탈의 굳은 용암 줄기 (어두운 줄)
    g.save(); g.strokeStyle = 'rgba(50,38,30,.35)'; g.lineWidth = 2; g.lineCap = 'round'; [[-0.6, 0.3], [-0.2, 0.9], [0.35, 0.8], [0.8, 0.45]].forEach(function (q) { g.beginPath(); for (var k = 0; k <= 20; k++) { var rr = 0.45 + (VR - 0.6) * k / 20, an = Math.PI / 2 + q[0] * 1.2, x = VX + Math.cos(an) * rr * 0.9 * (q[0] < 0 ? -1 : 1) * Math.abs(Math.cos(an)) + q[0] * rr * 0.6, z = Math.max(0.05, q[1] * rr * 0.55); g.lineTo.apply(g, P(x, hgt(x, z) + 0.01, z)); } g.stroke(); }); g.restore();
    // 바다 수면 (반투명)
    g.save(); g.beginPath(); g.moveTo.apply(g, P(0, 0, 0)); g.lineTo.apply(g, P(COAST - 0.15, 0, 0)); g.lineTo.apply(g, P(COAST - 0.25, 0, DZ)); g.lineTo.apply(g, P(0, 0, DZ)); g.closePath();
    var sw = g.createLinearGradient(0, P(0, 0, DZ)[1], 0, P(0, 0, 0)[1]); sw.addColorStop(0, 'rgba(150,205,214,.88)'); sw.addColorStop(1, 'rgba(70,150,176,.85)'); g.fillStyle = sw; g.fill(); g.restore();
    // 앞면
    front(g);
    // 모서리
    g.save(); g.strokeStyle = 'rgba(40,28,18,.35)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo.apply(g, P(0, BOT, 0)); g.lineTo.apply(g, P(XW, BOT, 0)); g.lineTo.apply(g, P(XW, BOT, DZ)); g.stroke(); g.restore();
    return cv;
  }

  /* ---------- 움직이는 부분: 물결, 연기, 마그마 빛 ---------- */
  function live(c, t) {
    var R2 = A.REDUCE ? 0 : 1;
    // 물결 (수면 위의 반짝임)
    c.save(); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.2; for (var i = 0; i < 9; i++) { var z = 0.3 + i * 0.3, x0 = 0.2 + ((i * 0.37 + t * 0.06 * R2) % 1) * 2.6, a = P(x0, 0.005, z), b = P(x0 + 0.5, 0.005, z); c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, a[1] - 2, b[0], b[1]); c.stroke(); } c.restore();
    // 마그마 방과 통로 (앞면)
    var pulse = 0.85 + 0.15 * Math.sin(t * 2 * R2), ch = P(8.4, -2.2, 0);
    c.save(); var mg = c.createRadialGradient(ch[0] - 20, ch[1] - 8, 6, ch[0], ch[1], 150); mg.addColorStop(0, 'rgba(255,236,170,' + pulse + ')'); mg.addColorStop(0.35, 'rgba(250,164,64,.95)'); mg.addColorStop(0.75, 'rgba(214,86,36,.92)'); mg.addColorStop(1, 'rgba(160,50,24,0)');
    c.beginPath(); var bl = A.blob(ch[0], ch[1], 128, 50, 16, 3, 0.16); A.smoothPath(c, bl); c.fillStyle = mg; c.shadowColor = 'rgba(255,140,60,.7)'; c.shadowBlur = 26 * pulse; c.fill(); c.shadowBlur = 0;
    // 통로: 마그마 방에서 분화구까지
    var top = P(VX, hgt(VX, 0), 0), bot = P(8.35, -1.9, 0), cg = c.createLinearGradient(0, top[1], 0, bot[1]); cg.addColorStop(0, '#ffd27a'); cg.addColorStop(1, '#e86a2c');
    c.beginPath(); c.moveTo(bot[0] - 14, bot[1]); c.bezierCurveTo(bot[0] - 10, bot[1] - 80, top[0] - 8, top[1] + 60, top[0] - 6, top[1]); c.lineTo(top[0] + 6, top[1]); c.bezierCurveTo(top[0] + 8, top[1] + 60, bot[0] + 12, bot[1] - 80, bot[0] + 16, bot[1]); c.closePath(); c.fillStyle = cg; c.fill();
    // 거품
    if (R2) for (var b2 = 0; b2 < 9; b2++) { var ph = (t * 0.35 + b2 * 0.13) % 1, bx = ch[0] - 90 + b2 * 22, by = ch[1] + 22 - ph * 50; c.fillStyle = 'rgba(255,240,180,' + (0.5 * (1 - ph)) + ')'; c.beginPath(); c.arc(bx + Math.sin(ph * 6 + b2) * 5, by, 2 + b2 % 3, 0, 6.283); c.fill(); }
    c.restore();
    // 분화구의 빛과 연기
    var cr = P(VX, hgt(VX, 0.3) + 0.05, 0.3); c.save(); var gl = c.createRadialGradient(cr[0], cr[1], 2, cr[0], cr[1], 40); gl.addColorStop(0, 'rgba(255,170,80,' + 0.7 * pulse + ')'); gl.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = gl; c.beginPath(); c.arc(cr[0], cr[1], 40, 0, 6.283); c.fill(); c.restore();
    for (var s = 0; s < 8; s++) { var ps = ((t * 0.08 * R2) + s / 8) % 1, sx = cr[0] + ps * 70 + Math.sin(ps * 5 + s) * 10, sy = cr[1] - 10 - ps * 150, rr = 12 + ps * 46; var sgr = c.createRadialGradient(sx - rr * 0.3, sy - rr * 0.3, 2, sx, sy, rr); sgr.addColorStop(0, 'rgba(210,206,200,' + 0.5 * (1 - ps) + ')'); sgr.addColorStop(1, 'rgba(190,186,180,0)'); c.fillStyle = sgr; c.beginPath(); c.arc(sx, sy, rr, 0, 6.283); c.fill(); }
  }
  /* ---------- 화살표 ---------- */
  function drawArrow(c, a, alpha, t, flow) {
    var b = a.b, n = 40, end = 0.92;
    c.save(); c.globalAlpha = alpha; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); for (var i = 0; i <= n; i++) { var q = bez(b, i / n * end); if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }
    c.shadowColor = 'rgba(20,20,20,.28)'; c.shadowBlur = 5; c.shadowOffsetY = 2; c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 10; c.stroke(); c.shadowColor = 'transparent';
    c.strokeStyle = a.col; c.lineWidth = 6; c.stroke();
    var tip = bez(b, 1), ang = tan(b, 0.97);
    A.arrowHead(c, tip[0] + Math.cos(ang) * 2, tip[1] + Math.sin(ang) * 2, ang, 18, 'rgba(255,255,255,.95)'); A.arrowHead(c, tip[0], tip[1], ang, 14, a.col);
    if (flow && !A.REDUCE) { c.fillStyle = 'rgba(255,255,255,.95)'; for (var k = 0; k < 3; k++) { var u = ((t * 0.3 + k / 3) % 1) * end, q2 = bez(b, u); c.beginPath(); c.arc(q2[0], q2[1], 2.4, 0, 6.283); c.fill(); } }
    c.restore();
  }
  function frame(W, H, cover) { var s = cover ? Math.max(W / W0, H / H0) : Math.min(W / W0, H / H0); return { s: s, ox: (W - W0 * s) / 2, oy: (H - H0 * s) / 2 }; }
  function draw(c, W, H, t, o) {
    o = o || {};
    c.save(); c.fillStyle = '#e8ece8'; c.fillRect(0, 0, W, H);
    var s = A.fit(c, W, H, W0, H0, !!o.cover), need = Math.min(2, Math.max(1, s * (window.devicePixelRatio || 1)));
    if (!base || Math.abs(need - baseS) > 0.25) { base = buildBase(need); baseS = need; }
    c.drawImage(base, 0, 0, W0, H0);
    live(c, t);
    if (o.dimScene) { c.fillStyle = 'rgba(255,255,255,' + o.dimScene + ')'; c.fillRect(0, 0, W0, H0); }
    var on = function (a) { return o.arrow ? a.id === o.arrow : o.focus ? a.from === o.focus : true; };
    var labels = [];
    if (o.arrows !== false) {
      ARROWS.forEach(function (a) { if (!on(a)) drawArrow(c, a, o.dimAlpha == null ? 0.22 : o.dimAlpha, t, false); });
      ARROWS.forEach(function (a) { if (on(a)) drawArrow(c, a, 1, t, o.flow !== false); });
      if (o.labels !== false) ARROWS.forEach(function (a) { var q = bez(a.b, a.lu); labels.push({ k: 'a-' + a.id, t: a.label, x: q[0] + a.lo[0], y: q[1] + a.lo[1], cls: 'proc ' + (a.col === G ? 'g' : 'r') + (on(a) ? '' : ' dim') }); });
    }
    ['ign', 'sed', 'sedr', 'meta', 'magma'].forEach(function (id, i) {
      if (o.hideNode === id) return; var N = NODES[id], dim = o.focus && o.focus !== id && !(o.reach && o.reach.indexOf(id) >= 0);
      labels.push({ k: 'n-' + id, t: o.marks ? String((o.markNo || {})[id] || i + 1) : N.name, x: N.x, y: N.y, cls: 'node ' + N.col + (o.marks ? ' mark' : '') + (o.focus === id || o.hi === id ? ' hi' : '') + (dim ? ' dim' : '') });
    });
    if (o.after) o.after(c);
    c.restore();
    return { labels: labels };
  }
  function hit(x, y, W, H) {
    var f = frame(W, H), dx = (x - f.ox) / f.s, dy = (y - f.oy) / f.s, best = null, bd = 80;
    Object.keys(NODES).forEach(function (k) { var d = Math.hypot(NODES[k].x - dx, NODES[k].y - dy); if (d < bd) { bd = d; best = k; } });
    return best;
  }

  /* ---------- 상태별 작은 암석 그림 (입체감 있게) ---------- */
  function token(c, x, y, kind, s, t) {
    s = s || 1; c.save(); c.translate(x, y); c.scale(s, s);
    if (kind === 'magma') {
      var fl = A.REDUCE ? 0 : Math.sin(t * 5) * 1.2;
      c.shadowColor = 'rgba(255,140,40,.9)'; c.shadowBlur = 22;
      var g = c.createRadialGradient(-7, -9, 2, 0, 0, 30); g.addColorStop(0, '#fff3c0'); g.addColorStop(0.4, '#f8ac40'); g.addColorStop(1, '#c84a1a');
      c.fillStyle = g; c.beginPath(); c.moveTo(0, -30 - fl); c.bezierCurveTo(17, -11, 26, 4, 21, 15); c.bezierCurveTo(13, 28, -13, 28, -21, 15); c.bezierCurveTo(-26, 4, -17, -11, 0, -30 - fl); c.fill();
    } else if (kind === 'sed') {
      A.shadow(c, 3, 22, 34, 7, 0.35);
      var r = A.rng(5); for (var i = 0; i < 30; i++) { var a = r() * Math.PI, d = r() * 26, gx = Math.cos(a) * d * 1.2, gy = 16 - Math.sin(a) * d * 0.8, gs = 3 + r() * 5.5; var gg = c.createRadialGradient(gx - gs * 0.35, gy - gs * 0.4, 0.5, gx, gy, gs); var cc = r(); gg.addColorStop(0, cc < 0.4 ? '#f1e6cc' : cc < 0.7 ? '#d8d0c4' : '#c09a6c'); gg.addColorStop(1, cc < 0.4 ? '#9a7e50' : cc < 0.7 ? '#7a7268' : '#6b4a2c'); c.fillStyle = gg; c.beginPath(); c.ellipse(gx, gy, gs, gs * 0.8, r() * 3, 0, 6.283); c.fill(); }
    } else {
      A.shadow(c, 4, 24, 36, 7, 0.35);
      var Pb = A.blob(0, 0, 34, 25, 10, kind === 'ign' ? 4 : kind === 'sedr' ? 8 : 12, 0.18);
      if (kind === 'ign') A.volume(c, Pb, 'granite', { lw: 1 });
      else A.volume(c, Pb, kind === 'sedr' ? 'sand' : 'stone', { lw: 1, deco: function (cc) {
        if (kind === 'sedr') { var cols = ['rgba(232,212,170,.55)', 'rgba(170,130,90,.45)', 'rgba(220,196,150,.5)', 'rgba(150,110,76,.45)']; for (var k = 0; k < 7; k++) { cc.fillStyle = cols[k % 4]; cc.fillRect(-40, -28 + k * 8.5, 80, 7); } }
        else { for (var m = 0; m < 9; m++) { cc.strokeStyle = m % 2 ? 'rgba(236,232,224,.85)' : 'rgba(50,48,48,.8)'; cc.lineWidth = 3.4; cc.beginPath(); for (var xx = -40; xx <= 40; xx += 5) { var yy = -28 + m * 7 + Math.sin(xx * 0.12 + m) * 3; if (xx === -40) cc.moveTo(xx, yy); else cc.lineTo(xx, yy); } cc.stroke(); } }
      } });
    }
    c.restore();
  }
  return { draw: draw, hit: hit, token: token, bez: bez, tan: tan, NODES: NODES, ARROWS: ARROWS, W: W0, H: H0, frame: frame, G: G, R: R };
})();
