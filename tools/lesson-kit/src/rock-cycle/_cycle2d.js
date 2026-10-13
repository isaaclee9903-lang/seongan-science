/* ===== 암석의 순환 (교과서 그림 Ⅱ-13을 움직이는 그림으로) =====
   CYC.draw(ctx, W, H, t, o)
     o.focus: 이 상자에서 나가는 화살표만 밝게 · o.arrow: 이 화살표 하나만 밝게 · o.marks: 상자 이름 대신 번호(정리 페이지)
     o.after(ctx): 같은 좌표계에서 덧그리기(시뮬레이션의 움직이는 암석) · o.flow === false: 화살표 위 흐르는 점 끄기
   CYC.hit(x, y, W, H): 화면 좌표 → 가장 가까운 상자 id
   CYC.token(ctx, x, y, kind, s, t): 상태별 작은 암석 그림 (magma, ign, sed, sedr, meta)
   설계 크기 1200×720. 이 조각 앞에 ART(_art.js)가 있어야 해요. */
window.CYC = (function () {
  'use strict';
  var A = window.ART, W0 = 1200, H0 = 720, SEA = 300;
  var lerp = A.lerp, clamp = A.clamp;
  var NODES = {
    ign: { name: '화성암', x: 845, y: 205, col: '#1f6f7a' },
    sed: { name: '퇴적물', x: 318, y: 318, col: '#e2802a' },
    sedr: { name: '퇴적암', x: 318, y: 478, col: '#1f6f7a' },
    meta: { name: '변성암', x: 572, y: 612, col: '#1f6f7a' },
    magma: { name: '마그마', x: 962, y: 548, col: '#e2802a' },
  };
  var G = '#6fbf3a', P = '#ec5f98';
  var ARROWS = [
    { id: 'ign-sed', from: 'ign', to: 'sed', label: '풍화·침식·운반', col: G, b: [[790, 182], [560, 18], [352, 290]], lu: 0.5, lo: [0, -8] },
    { id: 'sed-sedr', from: 'sed', to: 'sedr', label: '다져지고\n굳어짐', col: G, b: [[290, 348], [262, 400], [290, 450]], lu: 0.5, lo: [-74, 0] },
    { id: 'sedr-sed', from: 'sedr', to: 'sed', label: '풍화·침식·운반', col: G, b: [[360, 452], [420, 400], [366, 348]], lu: 0.5, lo: [74, 2] },
    { id: 'meta-sed', from: 'meta', to: 'sed', label: '풍화·침식·운반', col: G, b: [[586, 582], [590, 360], [392, 326]], lu: 0.3, lo: [58, 6] },
    { id: 'sedr-meta', from: 'sedr', to: 'meta', label: '높은 열과 압력', col: P, b: [[340, 508], [400, 610], [500, 616]], lu: 0.45, lo: [-70, 22] },
    { id: 'ign-meta', from: 'ign', to: 'meta', label: '높은 열과 압력', col: P, b: [[815, 236], [720, 470], [630, 590]], lu: 0.5, lo: [-6, 0] },
    { id: 'ign-magma', from: 'ign', to: 'magma', label: '녹음', col: P, b: [[868, 236], [880, 400], [930, 520]], lu: 0.5, lo: [-34, 0] },
    { id: 'magma-ign', from: 'magma', to: 'ign', label: '식음', col: G, b: [[990, 520], [990, 340], [900, 222]], lu: 0.5, lo: [32, 0] },
    { id: 'meta-magma', from: 'meta', to: 'magma', label: '녹음', col: P, b: [[640, 630], [800, 690], [910, 576]], lu: 0.55, lo: [0, 18] },
  ];
  function bez(b, u) { var a = b[0], c = b[1], d = b[2], v = 1 - u; return [v * v * a[0] + 2 * v * u * c[0] + u * u * d[0], v * v * a[1] + 2 * v * u * c[1] + u * u * d[1]]; }
  function tan(b, u) { var a = b[0], c = b[1], d = b[2]; return Math.atan2(2 * (1 - u) * (c[1] - a[1]) + 2 * u * (d[1] - c[1]), 2 * (1 - u) * (c[0] - a[0]) + 2 * u * (d[0] - c[0])); }

  /* ---------- 배경: 하늘, 바다, 화산, 땅속 ---------- */
  var VOL = [[560, SEA + 4], [640, 262], [720, 214], [800, 160], [862, 104], [884, 92], [916, 92], [938, 104], [1000, 150], [1080, 200], [1160, 236], [1260, 256], [1260, 322], [1000, 330], [760, 326], [560, 318]];
  function surfY(x) { // 땅 위 높이 (바다 밑은 바닥)
    if (x < 560) return lerp(420, SEA + 30, clamp(x / 540, 0, 1));
    for (var i = 0; i < VOL.length - 3; i++) { var a = VOL[i], b = VOL[i + 1]; if (x >= a[0] && x <= b[0]) return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0])); }
    return 260;
  }
  function background(c, t) {
    A.sky(c, -300, -100, W0 + 600, SEA + 100, '#b7dcef', '#eef6f6');
    // 먼 산
    c.fillStyle = 'rgba(150,180,170,.5)'; c.beginPath(); c.moveTo(-300, SEA); c.bezierCurveTo(100, 230, 300, 250, 460, 240); c.bezierCurveTo(560, 236, 640, 250, 700, SEA); c.closePath(); c.fill();
    // 땅속 전체 바탕 (깊을수록 붉고 뜨거워요)
    var dg = c.createLinearGradient(0, SEA, 0, H0 + 80); dg.addColorStop(0, '#c8a77c'); dg.addColorStop(0.45, '#a77a52'); dg.addColorStop(0.75, '#7a4a32'); dg.addColorStop(1, '#4f2418'); c.fillStyle = dg; c.fillRect(-300, SEA, W0 + 600, H0 + 100 - SEA);
    // 지층 (물결치는 띠)
    c.save(); c.beginPath(); c.rect(-300, SEA, W0 + 600, H0 + 100); c.clip();
    var bands = ['rgba(222,196,150,.75)', 'rgba(170,128,88,.6)', 'rgba(210,176,128,.7)', 'rgba(150,104,70,.55)', 'rgba(196,160,116,.6)', 'rgba(130,86,58,.5)'];
    for (var i = 0; i < 9; i++) {
      var y0 = 360 + i * 30, th = 14 + (i % 3) * 6; c.fillStyle = bands[i % bands.length]; c.beginPath();
      for (var x = -300; x <= W0 + 300; x += 20) { var y = y0 + Math.sin(x * 0.006 + i) * 10 + (x > 600 ? -(x - 600) * 0.06 * Math.max(0, 1 - i / 9) : 0); if (x === -300) c.moveTo(x, y); else c.lineTo(x, y); }
      for (var x2 = W0 + 300; x2 >= -300; x2 -= 20) { var yb = y0 + th + Math.sin(x2 * 0.006 + i) * 10 + (x2 > 600 ? -(x2 - 600) * 0.06 * Math.max(0, 1 - i / 9) : 0); c.lineTo(x2, yb); }
      c.closePath(); c.fill();
    }
    c.fillStyle = A.pat(c, 'sand'); c.globalAlpha = 0.18; c.fillRect(-300, SEA, W0 + 600, 300); c.globalAlpha = 1;
    // 깊은 곳의 열기
    var hg = c.createRadialGradient(780, 760, 40, 780, 760, 520); hg.addColorStop(0, 'rgba(255,110,40,.55)'); hg.addColorStop(1, 'rgba(255,110,40,0)'); c.fillStyle = hg; c.fillRect(-300, 300, W0 + 600, 500);
    c.restore();
    // 바다 (바닥은 퇴적물)
    c.save(); c.beginPath(); c.moveTo(-300, SEA); c.lineTo(560, SEA); c.lineTo(540, SEA + 30); for (var xs = 540; xs >= -300; xs -= 20) c.lineTo(xs, surfY(Math.max(0, xs)) + Math.sin(xs * 0.05) * 3); c.closePath();
    var sg = c.createLinearGradient(0, SEA, 0, 430); sg.addColorStop(0, 'rgba(80,190,210,.92)'); sg.addColorStop(1, 'rgba(30,110,150,.95)'); c.fillStyle = sg; c.fill(); c.restore();
    // 해저 퇴적물 띠
    c.save(); c.beginPath(); for (var xb = -300; xb <= 545; xb += 15) c.lineTo(xb, surfY(Math.max(0, xb)) - 2); for (var xc = 545; xc >= -300; xc -= 15) c.lineTo(xc, surfY(Math.max(0, xc)) + 16); c.closePath(); c.fillStyle = A.pat(c, 'sand'); c.fill(); c.restore();
    // 물결
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; for (var k = 0; k < 3; k++) { c.beginPath(); for (var xw = -300; xw <= 540; xw += 10) { var yw = SEA + 8 + k * 16 + Math.sin(xw * 0.04 + t * (A.REDUCE ? 0 : 1.4) + k) * 2.5; if (xw === -300) c.moveTo(xw, yw); else c.lineTo(xw, yw); } c.stroke(); }
    // 화산 몸체
    c.save(); A.path(c, VOL); var vg = c.createLinearGradient(600, 90, 1100, 400); vg.addColorStop(0, '#9d8a74'); vg.addColorStop(0.5, '#7d6a58'); vg.addColorStop(1, '#5e4c3e'); c.fillStyle = vg; c.fill(); c.clip();
    c.fillStyle = A.pat(c, 'stone'); c.globalAlpha = 0.35; c.fillRect(540, 80, 720, 700); c.globalAlpha = 1;
    // 화산 층 (줄무늬), 풀
    c.strokeStyle = 'rgba(60,40,30,.25)'; c.lineWidth = 3; for (var v = 0; v < 8; v++) { c.beginPath(); c.moveTo(580, 300 - v * 8); c.quadraticCurveTo(900, 120 + v * 36, 1260, 280 - v * 6); c.stroke(); }
    var gr = c.createLinearGradient(560, 0, 760, 0); gr.addColorStop(0, 'rgba(110,150,70,.85)'); gr.addColorStop(1, 'rgba(110,150,70,0)'); c.fillStyle = gr; c.fillRect(540, 180, 240, 140);
    // 용암 줄기
    var glow = 0.75 + 0.25 * Math.sin(t * (A.REDUCE ? 0 : 2.2));
    c.lineCap = 'round';
    [[[892, 96], [870, 140], [880, 190], [850, 240]], [[912, 96], [940, 150], [930, 200], [970, 250], [990, 300]], [[900, 96], [906, 130]]].forEach(function (L, i) {
      c.strokeStyle = 'rgba(255,90,20,' + (0.55 * glow) + ')'; c.lineWidth = 14 - i * 3; c.beginPath(); L.forEach(function (q, j) { if (j) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.stroke();
      c.strokeStyle = 'rgba(255,200,80,' + glow + ')'; c.lineWidth = 5 - i; c.stroke();
    });
    c.restore();
    // 화산 아래 통로 + 마그마 방
    c.save(); var mg = c.createLinearGradient(0, 100, 0, 640); mg.addColorStop(0, '#ffb341'); mg.addColorStop(1, '#e8471c');
    c.fillStyle = mg; c.beginPath(); c.moveTo(888, 96); c.bezierCurveTo(892, 260, 930, 380, 930, 520); c.lineTo(980, 520); c.bezierCurveTo(970, 380, 922, 260, 912, 96); c.closePath(); c.globalAlpha = 0.95; c.fill();
    var ch = A.blob(950, 610, 175, 78, 18, 3, 0.18); c.shadowColor = 'rgba(255,120,40,.9)'; c.shadowBlur = 40 * glow; A.smoothPath(c, ch);
    var cg = c.createRadialGradient(950, 590, 10, 950, 610, 190); cg.addColorStop(0, '#fff0a0'); cg.addColorStop(0.35, '#ffb02e'); cg.addColorStop(0.75, '#ef5a1c'); cg.addColorStop(1, '#b8300f'); c.fillStyle = cg; c.fill(); c.shadowColor = 'transparent';
    // 끓는 거품
    if (!A.REDUCE) for (var bb = 0; bb < 10; bb++) { var ph = (t * 0.4 + bb * 0.13) % 1, bx = 820 + bb * 26, by = 650 - ph * 70; c.fillStyle = 'rgba(255,240,170,' + (0.6 * (1 - ph)) + ')'; c.beginPath(); c.arc(bx + Math.sin(ph * 6 + bb) * 6, by, 3 + bb % 3, 0, 6.283); c.fill(); }
    c.restore();
    // 연기
    if (!A.REDUCE) for (var sm = 0; sm < 7; sm++) { var ps = (t * 0.12 + sm / 7) % 1, sx = 900 + ps * 50 + Math.sin(ps * 5 + sm) * 10, sy = 84 - ps * 110, r = 14 + ps * 40; c.fillStyle = 'rgba(170,170,170,' + (0.45 * (1 - ps)) + ')'; c.beginPath(); c.arc(sx, sy, r, 0, 6.283); c.fill(); }
    else { c.fillStyle = 'rgba(170,170,170,.35)'; c.beginPath(); c.arc(920, 50, 34, 0, 6.283); c.fill(); }
    // '지하 깊은 곳' 글씨
    c.save(); c.font = '800 18px Pretendard, sans-serif'; c.fillStyle = 'rgba(255,230,200,.75)'; c.textAlign = 'left'; c.fillText('지하 깊은 곳', 24, 700); c.fillStyle = 'rgba(30,60,80,.6)'; c.fillText('바다', 24, 330); c.restore();
  }

  /* ---------- 화살표 ---------- */
  function drawArrow(c, a, alpha, t, flow) {
    var b = a.b, n = 40, i;
    c.save(); c.globalAlpha = alpha; c.lineCap = 'round'; c.lineJoin = 'round';
    var end = 0.93;
    c.beginPath(); for (i = 0; i <= n; i++) { var q = bez(b, i / n * end); if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }
    c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 15; c.stroke();
    c.strokeStyle = a.col; c.lineWidth = 9; c.stroke();
    var tip = bez(b, 1), ang = tan(b, 0.97);
    A.arrowHead(c, tip[0] + Math.cos(ang) * 2, tip[1] + Math.sin(ang) * 2, ang, 24, '#fff'); A.arrowHead(c, tip[0], tip[1], ang, 19, a.col);
    if (flow && !A.REDUCE) { c.fillStyle = 'rgba(255,255,255,.9)'; for (var k = 0; k < 3; k++) { var u = ((t * 0.32 + k / 3) % 1) * end, q2 = bez(b, u); c.beginPath(); c.arc(q2[0], q2[1], 3.2, 0, 6.283); c.fill(); } }
    c.restore();
  }
  function arrowLabel(c, a, alpha) {
    var q = bez(a.b, a.lu); c.save(); c.globalAlpha = alpha;
    A.pill(c, a.label, q[0] + a.lo[0], q[1] + a.lo[1], { size: 16, bg: 'rgba(255,255,255,.95)', fg: a.col === G ? '#2f6a12' : '#a3245a', stroke: a.col, lw: 2, px: 9, py: 4 });
    c.restore();
  }
  function node(c, id, alpha, hi, marks, num) {
    var N = NODES[id]; c.save(); c.globalAlpha = alpha;
    if (hi) { c.shadowColor = 'rgba(255,230,120,.95)'; c.shadowBlur = 26; }
    A.pill(c, marks ? String(num) : N.name, N.x, N.y, { size: 26, weight: 900, bg: marks ? '#fff' : N.col, fg: marks ? N.col : '#fff', stroke: '#fff', lw: 4, px: marks ? 22 : 18, py: 8, r: 16 });
    c.restore();
  }
  function frame(W, H) { var s = Math.min(W / W0, H / H0); return { s: s, ox: (W - W0 * s) / 2, oy: (H - H0 * s) / 2 }; }
  function draw(c, W, H, t, o) {
    o = o || {};
    c.save(); c.fillStyle = '#d9cbb3'; c.fillRect(0, 0, W, H);
    A.fit(c, W, H, W0, H0, !!o.cover);
    background(c, t);
    if (o.dimScene) { c.fillStyle = 'rgba(255,255,255,' + o.dimScene + ')'; c.fillRect(-300, -100, W0 + 600, H0 + 200); }
    var on = function (a) { return o.arrow ? a.id === o.arrow : o.focus ? a.from === o.focus : true; };
    var arrowsOn = o.arrows !== false;
    if (arrowsOn) {
      ARROWS.forEach(function (a) { if (!on(a)) drawArrow(c, a, o.dimAlpha == null ? 0.22 : o.dimAlpha, t, false); });
      ARROWS.forEach(function (a) { if (on(a)) drawArrow(c, a, 1, t, o.flow !== false); });
      if (o.labels !== false) { ARROWS.forEach(function (a) { if (!on(a)) arrowLabel(c, a, o.dimAlpha == null ? 0.3 : o.dimAlpha); }); ARROWS.forEach(function (a) { if (on(a)) arrowLabel(c, a, 1); }); }
    }
    var order = ['ign', 'sed', 'sedr', 'meta', 'magma'];
    order.forEach(function (id, i) { node(c, id, o.focus && o.focus !== id && !(o.reach && o.reach.indexOf(id) >= 0) ? 0.75 : 1, o.focus === id || o.hi === id, o.marks, (o.markNo || {})[id] || i + 1); });
    if (o.after) o.after(c);
    c.restore();
  }
  function hit(x, y, W, H) {
    var f = frame(W, H), dx = (x - f.ox) / f.s, dy = (y - f.oy) / f.s, best = null, bd = 80;
    Object.keys(NODES).forEach(function (k) { var d = Math.hypot(NODES[k].x - dx, NODES[k].y - dy); if (d < bd) { bd = d; best = k; } });
    return best;
  }

  /* ---------- 상태별 작은 암석 그림 ---------- */
  function token(c, x, y, kind, s, t) {
    s = s || 1; c.save(); c.translate(x, y); c.scale(s, s);
    if (kind === 'magma') {
      var fl = A.REDUCE ? 0 : Math.sin(t * 5) * 1.5;
      c.shadowColor = 'rgba(255,140,40,.95)'; c.shadowBlur = 24;
      var g = c.createRadialGradient(-6, -8, 2, 0, 0, 30); g.addColorStop(0, '#fff6b0'); g.addColorStop(0.4, '#ffb02e'); g.addColorStop(1, '#d8400f');
      c.fillStyle = g; c.beginPath(); c.moveTo(0, -32 - fl); c.bezierCurveTo(18, -12, 28, 4, 22, 16); c.bezierCurveTo(14, 30, -14, 30, -22, 16); c.bezierCurveTo(-28, 4, -18, -12, 0, -32 - fl); c.fill();
    } else if (kind === 'sed') {
      var r = A.rng(5); c.shadowColor = 'rgba(40,30,20,.35)'; c.shadowBlur = 6; c.shadowOffsetY = 3;
      for (var i = 0; i < 26; i++) { var a = r() * Math.PI, d = r() * 26, gx = Math.cos(a) * d * 1.2, gy = 14 - Math.sin(a) * d * 0.8, gs = 3 + r() * 6; var gg = c.createRadialGradient(gx - gs * 0.3, gy - gs * 0.3, 0.5, gx, gy, gs); var cc = r(); gg.addColorStop(0, cc < 0.4 ? '#efe2c4' : cc < 0.7 ? '#cfc6b8' : '#b48a5c'); gg.addColorStop(1, cc < 0.4 ? '#a88a58' : cc < 0.7 ? '#7f776c' : '#6b4a2c'); c.fillStyle = gg; c.beginPath(); c.ellipse(gx, gy, gs, gs * 0.8, r() * 3, 0, 6.283); c.fill(); }
    } else {
      var P = A.blob(0, 0, 34, 26, 10, kind === 'ign' ? 4 : kind === 'sedr' ? 8 : 12, 0.18);
      if (kind === 'ign') A.rock(c, P, 'granite', { smooth: true, lw: 2 });
      else {
        c.save(); A.smoothPath(c, P); c.shadowColor = 'rgba(30,20,10,.3)'; c.shadowBlur = 10; c.shadowOffsetY = 4; c.fillStyle = kind === 'sedr' ? '#d2b483' : '#8d8d8a'; c.fill(); c.shadowColor = 'transparent'; c.clip();
        if (kind === 'sedr') { var cols = ['#e3cc9e', '#b98f5e', '#d7bc8a', '#a77d55', '#e8d6ae']; for (var k = 0; k < 7; k++) { c.fillStyle = cols[k % 5]; c.fillRect(-40, -30 + k * 9, 80, 9); } }
        else { for (var m = 0; m < 9; m++) { c.strokeStyle = m % 2 ? '#e8e4dc' : '#3c3a3a'; c.lineWidth = 4.5; c.beginPath(); for (var xx = -40; xx <= 40; xx += 5) { var yy = -30 + m * 7.5 + Math.sin(xx * 0.12 + m) * 3; if (xx === -40) c.moveTo(xx, yy); else c.lineTo(xx, yy); } c.stroke(); } }
        var sh = c.createLinearGradient(-34, -26, 30, 26); sh.addColorStop(0, 'rgba(255,255,255,.3)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(20,14,8,.35)'); c.fillStyle = sh; c.fillRect(-40, -30, 80, 60);
        c.restore(); c.lineWidth = 2; c.strokeStyle = 'rgba(48,40,32,.7)'; A.smoothPath(c, P); c.stroke();
      }
    }
    c.restore();
  }
  return { draw: draw, hit: hit, token: token, bez: bez, tan: tan, NODES: NODES, ARROWS: ARROWS, W: W0, H: H0, frame: frame };
})();
