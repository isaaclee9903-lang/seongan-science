/* ===== 토양의 생성 과정 (교과서 그림 Ⅱ-12를 움직이는 단면 그림으로) =====
   SOIL.draw(ctx, W, H, t, s, o): s = 0(① 단단한 암석) → 1(② 표면에 흙, 식물) → 2(③ 토양이 두꺼워짐), 사이 값은 이어서 변해요.
   o.labels: 층 이름표, o.marks: 이름 대신 번호(정리 페이지), o.bg: 바탕색
   설계 크기 900×560. 이 조각 앞에 ART(_art.js)가 있어야 해요. */
window.SOIL = (function () {
  'use strict';
  var A = window.ART, W0 = 900, H0 = 600, X0 = 300, X1 = 720, Y0 = 250, Y1 = 570, DX = 100, DY = -82;
  var lerp = A.lerp, seg = A.seg, clamp = A.clamp;
  var NAMES = ['식물이 잘 자라는 층', '물에 녹은 물질과 진흙 등으로\n이루어진 층', '암석 조각과 모래 등으로\n이루어진 층', '풍화 작용이 거의\n일어나지 않은 암석층'];
  var COLS = ['#4a3222', '#9a6038', '#c8a46e', '#b9b4aa'];
  function thick(s) {
    return { hum: s < 1 ? 14 * s : 14 + 46 * (s - 1), clay: s < 1 ? 0 : 56 * (s - 1), frag: s < 1 ? 74 * s : 74 + 22 * (s - 1) };
  }
  var wave = function (x, k) { return Math.sin(x * 0.045 + k) * 3 + Math.sin(x * 0.11 + k * 2) * 1.6; };
  /* 바위 덩어리 (미리 만든 돌담 모양) */
  var BLOCKS = (function () {
    var r = A.rng(17), out = [], y = Y0 - 6;
    while (y < Y1 + 10) {
      var deep = (y - Y0) / (Y1 - Y0), hb = 26 + deep * 18, x = X0 - 20 - r() * 40;
      while (x < X1 + 20) { var w = 40 + r() * 70 + deep * 20, h = hb * (0.75 + r() * 0.5); out.push({ x: x, y: y + (r() - 0.5) * 8, w: w, h: h, rr: r(), sd: Math.floor(r() * 1e6) }); x += w + 3 + r() * 6; }
      y += hb + 3 + r() * 4;
    }
    return out;
  })();
  var PEB = (function () { var r = A.rng(29), o = []; for (var i = 0; i < 70; i++) o.push({ u: r(), v: r(), s: 2 + r() * 4, sd: i }); return o; })();
  function block(c, b, k, mode) { // k: 크기 비율, mode 0 = 암석층, 1 = 조각
    var cx = b.x + b.w / 2, cy = b.y + b.h / 2, w = b.w * k, h = b.h * k;
    c.save(); c.translate(cx, cy); if (mode) c.rotate((b.rr - 0.5) * 0.6 * mode);
    var g = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, '#f5f3ef'); g.addColorStop(0.55, '#dcd8d1'); g.addColorStop(1, '#a9a49b');
    c.fillStyle = g; c.shadowColor = 'rgba(40,30,20,.35)'; c.shadowBlur = 4; c.shadowOffsetY = 2;
    var r = A.rng(b.sd || 7), j = 0.06 + 0.12 * mode, P = [[-0.5, -0.5], [0, -0.5], [0.5, -0.5], [0.5, 0], [0.5, 0.5], [0, 0.5], [-0.5, 0.5], [-0.5, 0]].map(function (q) { return [(q[0] + (r() - 0.5) * j * 2) * w, (q[1] + (r() - 0.5) * j * 2) * h]; });
    A.smoothPath(c, P); c.fill();
    c.shadowColor = 'transparent'; c.strokeStyle = 'rgba(90,80,70,.55)'; c.lineWidth = 1.2; c.stroke();
    if (w > 30) { c.strokeStyle = 'rgba(120,110,100,.35)'; c.beginPath(); c.moveTo(-w * 0.3, -h * 0.1); c.lineTo(w * 0.1, h * 0.2); c.stroke(); }
    c.restore();
  }
  function layerYs(s, x) { var T = thick(s), y1 = Y0 + T.hum + wave(x, 1) * clamp(T.hum / 20, 0, 1), y2 = y1 + T.clay + wave(x, 2) * clamp(T.clay / 20, 0, 1), y3 = y2 + T.frag + wave(x, 3) * clamp(T.frag / 20, 0, 1); return [Y0, y1, y2, y3]; }
  function band(c, s, i, xa, xb) { // i번 층 영역 길
    c.beginPath(); var n = 30, k;
    for (k = 0; k <= n; k++) { var x = lerp(xa, xb, k / n); var y = i === 0 ? Y0 : layerYs(s, x)[i]; if (k) c.lineTo(x, y); else c.moveTo(x, y); }
    for (k = n; k >= 0; k--) { var x2 = lerp(xa, xb, k / n); var y2 = i === 3 ? Y1 : layerYs(s, x2)[i + 1]; c.lineTo(x2, y2); }
    c.closePath();
  }
  function front(c, s, t) {
    c.save(); c.beginPath(); c.rect(X0, Y0, X1 - X0, Y1 - Y0); c.clip();
    // 바탕: 암석층(틈 색) → 조각층(모래) → 진흙층 → 흙층
    c.fillStyle = '#8f8172'; c.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    var Ys = layerYs(s, (X0 + X1) / 2);
    band(c, s, 2, X0 - 5, X1 + 5); c.fillStyle = A.pat(c, 'sand'); c.fill();
    // 바위 덩어리: 깊을수록 크고, 위로 갈수록 잘게 부서져요
    BLOCKS.forEach(function (b) {
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2, L = layerYs(s, cx);
      if (cy < L[2] - 4) return;
      var fr = 1 - seg(cy, L[3] - 18, L[3] + 26);
      if (fr > 0.98 && cy < L[2] + 10) return;
      var k = lerp(1, 0.42, fr);
      if (fr > 0.05) { // 조각 두세 개로
        var sub = [[-0.22, -0.18], [0.24, 0.12], [-0.05, 0.28]];
        sub.forEach(function (q, j) { if (j === 2 && b.w < 70) return; block(c, { x: b.x + q[0] * b.w, y: b.y + q[1] * b.h, w: b.w * lerp(1, 0.62, fr), h: b.h * lerp(1, 1.15, fr), rr: (b.rr + j * 0.37) % 1, sd: b.sd + j }, k * (0.95 - j * 0.12), fr); });
      } else block(c, b, k, 0);
    });
    // 진흙층·흙층
    band(c, s, 1, X0 - 5, X1 + 5); c.fillStyle = A.pat(c, 'clay'); c.fill();
    band(c, s, 0, X0 - 5, X1 + 5); c.fillStyle = A.pat(c, 'humus'); c.fill();
    // 진흙층의 작은 자갈
    var T = thick(s);
    if (T.clay > 6) PEB.forEach(function (q) { var x = lerp(X0, X1, q.u), L = layerYs(s, x), y = lerp(L[2] + 4, L[3] - 4, q.v); if (y > L[2] - 2 || q.sd % 3) return; c.fillStyle = '#d9d2c4'; c.beginPath(); c.ellipse(x, lerp(L[2], L[3], 0.5) + (q.v - 0.5) * (L[3] - L[2]) * 0.6, q.s, q.s * 0.7, q.u * 3, 0, 6.283); c.fill(); });
    // 위에서 아래로 내려가는 물에 녹은 물질
    var mv = seg(s, 1.1, 1.5);
    if (mv > 0 && !A.REDUCE) { for (var i = 0; i < 46; i++) { var x = X0 + 12 + ((i * 89) % (X1 - X0 - 24)), L = layerYs(s, x), ph = ((t * 0.18 + i * 0.137) % 1), y = lerp(L[0] + 6, L[2] + 4, ph); c.fillStyle = 'rgba(' + (ph < 0.5 ? '70,44,26' : '120,70,36') + ',' + (0.75 * mv * Math.sin(ph * Math.PI)) + ')'; c.beginPath(); c.arc(x + Math.sin(ph * 9 + i) * 2, y, 2.2, 0, 6.283); c.fill(); } }
    // 나무뿌리, 지렁이
    var tr = seg(s, 1.25, 2);
    if (tr > 0) {
      var RT = [[[640, Y0], [636, Y0 + 30], [612, Y0 + 62], [586, Y0 + 92], [560, Y0 + 112]], [[650, Y0], [662, Y0 + 40], [668, Y0 + 82], [690, Y0 + 116], [714, Y0 + 130]], [[644, Y0], [640, Y0 + 50], [646, Y0 + 96], [640, Y0 + 140]], [[620, Y0 + 30], [590, Y0 + 40], [552, Y0 + 44], [520, Y0 + 60]]];
      RT.forEach(function (R, j) { A.root(c, A.partial(R, tr * (1 - j * 0.08)), 7 - j, 1, '#6b4426'); });
    }
    if (s > 1.5) { [[410, 0.5], [500, 1.6]].forEach(function (w, j) { var L = layerYs(s, w[0]), y = lerp(L[0], L[1], 0.55) + j * 4, ph = A.REDUCE ? 0 : t * 1.5 + w[1]; c.save(); c.globalAlpha = seg(s, 1.5, 1.8); c.strokeStyle = '#c97a78'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); for (var u = 0; u <= 30; u += 3) { var xx = w[0] + u, yy = y + Math.sin(u * 0.25 + ph) * 3; if (u) c.lineTo(xx, yy); else c.moveTo(xx, yy); } c.stroke(); c.restore(); }); }
    // 입체 그늘
    var sh = c.createLinearGradient(X0, 0, X1, 0); sh.addColorStop(0, 'rgba(255,255,255,.08)'); sh.addColorStop(1, 'rgba(0,0,0,.12)'); c.fillStyle = sh; c.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    c.restore();
    // 층 경계선
    c.save(); c.strokeStyle = 'rgba(40,24,12,.35)'; c.lineWidth = 1.2; [1, 2, 3].forEach(function (i) { c.beginPath(); for (var k = 0; k <= 40; k++) { var x = lerp(X0, X1, k / 40), y = layerYs(s, x)[i]; if (k) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); }); c.restore();
    return Ys;
  }
  function side(c, s) { // 오른쪽 옆면 (층 색만, 어둡게)
    c.save(); c.beginPath(); c.moveTo(X1, Y0); c.lineTo(X1 + DX, Y0 + DY); c.lineTo(X1 + DX, Y1 + DY); c.lineTo(X1, Y1); c.closePath(); c.clip();
    c.transform(1, DY / DX, 0, 1, X1, 0); c.translate(-X1, 0);
    var Ls = layerYs(s, X1); c.fillStyle = '#b4ada2'; c.fillRect(X1, Y0, DX, Y1 - Y0);
    // 암석층 줄눈
    c.strokeStyle = 'rgba(110,100,90,.6)'; c.lineWidth = 1.2; for (var y = Ls[3] + 20; y < Y1; y += 34) { c.beginPath(); c.moveTo(X1, y); c.lineTo(X1 + DX, y + 6); c.stroke(); }
    [['sand', Ls[2], Ls[3]], ['clay', Ls[1], Ls[2]], ['humus', Ls[0], Ls[1]]].forEach(function (q) { if (q[2] - q[1] < 0.5) return; c.fillStyle = A.pat(c, q[0]); c.fillRect(X1, q[1], DX, q[2] - q[1]); });
    c.fillStyle = 'rgba(20,12,4,.24)'; c.fillRect(X1, Y0 - 10, DX, Y1 - Y0 + 20);
    c.restore();
  }
  function topFace(c, s, t) {
    var P = [[X0, Y0], [X1, Y0], [X1 + DX, Y0 + DY], [X0 + DX, Y0 + DY]];
    c.save(); A.path(c, P); c.fillStyle = A.pat(c, 'stone'); c.fill(); c.clip();
    // 금 간 바위 윗면
    c.strokeStyle = 'rgba(60,50,40,' + (0.5 * (1 - seg(s, 0.6, 1))) + ')'; c.lineWidth = 1.5; var r = A.rng(3);
    for (var i = 0; i < 16; i++) { var u = r(), v = r(), x = X0 + u * (X1 - X0) + v * DX, y = Y0 + v * DY; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 30 * (r() - 0.5) + 14, y - 6 + r() * 12); c.lineTo(x + 40 * (r() - 0.2), y + (r() - 0.5) * 14); c.stroke(); }
    // 흙과 풀이 덮어요
    var g = seg(s, 0.45, 1.2);
    if (g > 0) { c.globalAlpha = g; var gg = c.createLinearGradient(0, Y0 + DY, 0, Y0); gg.addColorStop(0, '#8fbf55'); gg.addColorStop(1, '#5e9a36'); c.fillStyle = gg; c.fill(); c.globalAlpha = 1; }
    // 이끼 조각 (①)
    var m = seg(s, 0.05, 0.5) * (1 - seg(s, 0.9, 1.2)); if (m > 0) { var r2 = A.rng(6); for (var j = 0; j < 14; j++) { var u2 = r2(), v2 = r2(), x2 = X0 + u2 * (X1 - X0) + v2 * DX, y2 = Y0 + v2 * DY; c.fillStyle = 'rgba(95,140,50,' + 0.75 * m + ')'; c.beginPath(); c.ellipse(x2, y2, 22 * m + 6, 7 * m + 2, 0, 0, 6.283); c.fill(); } }
    c.restore();
    // 풀 (윗면 여러 줄)
    var gs = seg(s, 0.6, 1.4);
    if (gs > 0) for (var row = 0; row < 6; row++) { var v3 = (row + 0.5) / 6, y3 = Y0 + v3 * DY; A.grass(c, X0 + v3 * DX + 4, X1 + v3 * DX - 4, y3, t, { h: 12 * (1 - v3 * 0.4), gap: 7, seed: 20 + row, scale: gs }); }
    // 꽃
    if (s > 1.6) { var r3 = A.rng(12); for (var f = 0; f < 6; f++) { var v4 = r3(), x4 = X0 + r3() * (X1 - X0 - 80) + v4 * DX, y4 = Y0 + v4 * DY - 8; c.fillStyle = '#ffd23a'; c.globalAlpha = seg(s, 1.6, 1.9); c.beginPath(); c.arc(x4, y4, 3.5, 0, 6.283); c.fill(); c.globalAlpha = 1; } }
    // 나무
    var tr = seg(s, 1.2, 2); if (tr > 0) A.tree(c, 646, Y0 + 2, tr, t, { h: 140, w: 20, r: 70, seed: 7 });
    // 새싹 (②)
    var sp = seg(s, 0.7, 1.1) * (1 - seg(s, 1.5, 1.8)); if (sp > 0) { var r4 = A.rng(44); for (var q = 0; q < 8; q++) { var v5 = r4(), x5 = X0 + 30 + r4() * (X1 - X0 - 60) + v5 * DX, y5 = Y0 + v5 * DY; c.strokeStyle = '#4f8a35'; c.lineWidth = 2; c.beginPath(); c.moveTo(x5, y5); c.lineTo(x5, y5 - 12 * sp); c.stroke(); c.fillStyle = '#7cbf4a'; c.beginPath(); c.ellipse(x5 - 4, y5 - 12 * sp, 5 * sp, 2.4 * sp, -0.5, 0, 6.283); c.ellipse(x5 + 4, y5 - 12 * sp, 5 * sp, 2.4 * sp, 0.5, 0, 6.283); c.fill(); } }
  }
  function draw(c, W, H, t, s, o) {
    o = o || {}; s = clamp(s, 0, 2);
    c.save();
    var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, o.bg || '#eaf3f6'); g.addColorStop(1, o.bg2 || '#f7f3ea'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    A.fit(c, W, H, W0, H0);
    // 바닥 그림자
    var sg = c.createRadialGradient(X0 + 260, Y1 + 8, 20, X0 + 260, Y1 + 8, 330); sg.addColorStop(0, 'rgba(60,50,30,.28)'); sg.addColorStop(1, 'rgba(60,50,30,0)'); c.fillStyle = sg; c.beginPath(); c.ellipse(X0 + 260, Y1 + 6, 330, 30, 0, 0, 6.283); c.fill();
    // 비 (② 무렵)
    var rain = seg(s, 0.3, 0.6) * (1 - seg(s, 1.3, 1.6));
    side(c, s);
    front(c, s, t);
    topFace(c, s, t);
    if (rain > 0 && !A.REDUCE) { c.strokeStyle = 'rgba(80,140,200,' + 0.55 * rain + ')'; c.lineWidth = 2; for (var d = 0; d < 30; d++) { var dx = X0 + ((d * 61) % (X1 - X0 + DX)), dy = ((t * 260 + d * 37) % 150); if (dy > (Y0 + DY) - 10 + (dx - X0) * 0) { } c.beginPath(); c.moveTo(dx, dy - 20); c.lineTo(dx - 3, dy - 8); c.stroke(); } }
    // 모서리
    c.strokeStyle = 'rgba(40,28,16,.45)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(X0, Y1); c.lineTo(X0, Y0); c.lineTo(X1, Y0); c.lineTo(X1, Y1); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(X1, Y0); c.lineTo(X1 + DX, Y0 + DY); c.lineTo(X1 + DX, Y1 + DY); c.lineTo(X1, Y1); c.stroke();
    // 층 이름표 (왼쪽)
    if (o.labels !== false || o.marks) {
      var Ls = layerYs(s, X0), mids = [], last = -99;
      [[Ls[0], Ls[1]], [Ls[1], Ls[2]], [Ls[2], Ls[3]], [Ls[3], Y1]].forEach(function (q, i) {
        var th = q[1] - q[0]; if (th < 12 && !o.marks) return; if (th < 4) return;
        var y = Math.max((q[0] + q[1]) / 2, last + (o.marks ? 46 : 54)); last = y; mids.push(i);
        c.strokeStyle = 'rgba(40,50,60,.5)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(X0 - 22, y); c.lineTo(X0 + 14, (q[0] + q[1]) / 2); c.stroke();
        c.fillStyle = COLS[i]; c.beginPath(); c.arc(X0 + 14, (q[0] + q[1]) / 2, 5, 0, 6.283); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
        if (o.marks) A.badge(c, i + 1, X0 - 42, y, '#2f6b4f', 20);
        else A.pill(c, NAMES[i], X0 - 26, y, { align: 'right', size: 17, bg: 'rgba(255,255,255,.95)', stroke: COLS[i], lw: 2.5 });
      });
    }
    c.restore();
  }
  return { draw: draw, NAMES: NAMES, W: W0, H: H0 };
})();
