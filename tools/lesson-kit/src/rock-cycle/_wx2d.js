/* ===== 여러 가지 풍화 작용 (교과서 그림 Ⅱ-11을 움직이는 그림으로) =====
   WX.draw(kind, ctx, W, H, t, p) → { cap: 자막, labels: 이름표 목록 }
   kind = 'ice' | 'bio' | 'press' | 'co2', p = 풍화가 진행된 정도(0~1), t = 시간(바람·비 같은 잔 움직임)
   설계 크기 640×420. 이 조각 앞에 ART(_art.js)가 있어야 해요. */
window.WX = (function () {
  'use strict';
  var A = window.ART, W0 = 640, H0 = 420, HZ = 236, GX = 320, GY = 356;
  var seg = A.seg, lerp = A.lerp, clamp = A.clamp;
  function mix(a, b, k) { var pa = a.match(/\w\w/g).map(function (h) { return parseInt(h, 16); }), pb = b.match(/\w\w/g).map(function (h) { return parseInt(h, 16); }); return 'rgb(' + pa.map(function (v, i) { return Math.round(lerp(v, pb[i], k)); }).join(',') + ')'; }

  /* ---------- 바깥 풍경: 하늘, 먼 산, 원근이 있는 들판 ---------- */
  var grassPat = null;
  function land(c, W, H, t, o) {
    o = o || {}; var n = o.night || 0;
    var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, mix(o.top || '8fbedf', '24315a', n)); g.addColorStop(1, mix(o.bot || 'e7efe9', '55648a', n)); c.fillStyle = g; c.fillRect(0, 0, W, H);
    A.fit(c, W, H, W0, H0, true);
    if (n < 0.98) { c.save(); c.globalAlpha = 1 - n; A.cloud(c, 120, 70, 0.9); A.cloud(c, 470, 52, 0.7); c.restore(); }
    if (n > 0.02) { c.save(); c.globalAlpha = n; var r = A.rng(4); for (var i = 0; i < 70; i++) { var sx = r() * 760 - 60, sy = r() * (HZ - 40); c.fillStyle = 'rgba(255,255,255,' + (0.4 + r() * 0.6) + ')'; c.fillRect(sx, sy, r() < 0.15 ? 2 : 1.3, r() < 0.15 ? 2 : 1.3); } c.restore(); }
    // 해와 달
    c.save(); c.globalAlpha = 1 - n; var sg = c.createRadialGradient(560, 64, 4, 560, 64, 70); sg.addColorStop(0, 'rgba(255,246,214,1)'); sg.addColorStop(0.25, 'rgba(255,236,180,.85)'); sg.addColorStop(1, 'rgba(255,236,180,0)'); c.fillStyle = sg; c.beginPath(); c.arc(560, 64, 70, 0, 6.283); c.fill();
    c.globalAlpha = n; var mg = c.createRadialGradient(552, 58, 2, 556, 62, 22); mg.addColorStop(0, '#fbfbf2'); mg.addColorStop(1, '#d9dccd'); c.fillStyle = mg; c.beginPath(); c.arc(556, 62, 17, 0, 6.283); c.fill(); c.restore();
    // 먼 산 (멀수록 흐리고 푸르게)
    A.ridge(c, HZ - 22, 60, -80, 720, 3, mix('a9bfc3', '2b3653', n), HZ + 4);
    A.ridge(c, HZ - 4, 34, -80, 720, 7, mix('8ea98f', '27324a', n), HZ + 4);
    // 들판: 멀수록 밝고 흐려요. 풀밭 무늬도 원근으로 눌러요
    var fg = c.createLinearGradient(0, HZ, 0, H0); fg.addColorStop(0, mix('a7b98c', '313d4c', n)); fg.addColorStop(0.35, mix('7f9b58', '27342f', n)); fg.addColorStop(1, mix('5b7a37', '1c2820', n)); c.fillStyle = fg; c.fillRect(-200, HZ, W0 + 400, H0 - HZ + 100);
    if (!grassPat) grassPat = c.createPattern(A.texture('grass'), 'repeat');
    try { grassPat.setTransform(new DOMMatrix().translate(0, HZ).scale(0.9, 0.42)); } catch (e) {}
    c.save(); c.globalAlpha = 0.55 * (1 - n * 0.6); c.globalCompositeOperation = 'multiply'; c.fillStyle = grassPat; c.fillRect(-200, HZ + 6, W0 + 400, H0 - HZ + 100); c.restore();
    var hz = c.createLinearGradient(0, HZ, 0, HZ + 50); hz.addColorStop(0, mix('d6e2dc', '323c55', n)); hz.addColorStop(1, 'rgba(214,226,220,0)'); c.fillStyle = hz; c.fillRect(-200, HZ, W0 + 400, 50);
  }
  function nightCover(c, n) { // 밤: 장면 전체를 푸르게 어둡게
    if (n <= 0.01) return; c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(' + Math.round(lerp(255, 120, n)) + ',' + Math.round(lerp(255, 138, n)) + ',' + Math.round(lerp(255, 200, n)) + ',1)'; c.fillRect(-200, -100, W0 + 400, H0 + 200); c.restore();
  }

  /* ---------- 틈이 있는 바위: 둥근 덩어리를 계산해 면마다 빛을 주어 미리 그려 둬요 ---------- */
  var S = 112, CAM = { kx: 0.42, ky: 0.26 };
  var crackX = function (y, z) { return 0.06 + 0.06 * Math.sin(2.6 * y + 0.4) + 0.05 * Math.sin(3.1 * z + 1.1) + 0.025 * Math.sin(7.3 * y + 4.1 * z + 0.5); };
  var HY = 0.32; // 틈 끝(경첩) 높이
  var BCACHE = {};
  function boulder(seed) {
    if (BCACHE[seed]) return BCACHE[seed];
    var r = A.rng(seed), cuts = [];
    for (var i = 0; i < 7; i++) { var nx = r() * 2 - 1, ny = (r() * 2 - 1) * 0.6, nz = r() * 2 - 1, L = Math.hypot(nx, ny, nz); cuts.push([nx / L, ny / L, nz / L, 0.8 + r() * 0.15]); }
    var RX = 1.4, RY = 1.0, RZ = 1.05, CY = 0.62;
    function P(th, ph) {
      var dx = Math.sin(th) * Math.cos(ph), dy = Math.cos(th), dz = Math.sin(th) * Math.sin(ph), k = 1 + 0.16 * (A.fbm(dx * 1.4 + 3, dy * 1.4 + dz * 0.8 + 5, seed) - 0.5) * 2;
      var x = dx * k, y = dy * k, z = dz * k;
      for (var j = 0; j < cuts.length; j++) { var q = cuts[j], d = x * q[0] + y * q[1] + z * q[2]; if (d > q[3]) { x -= q[0] * (d - q[3]); y -= q[1] * (d - q[3]); z -= q[2] * (d - q[3]); } }
      var py = CY + y * RY; if (py < 0) py = 0;
      return [x * RX, py, z * RZ];
    }
    var NT = 64, NP = 128, grid = [];
    for (var a = 0; a <= NT; a++) { var row = []; for (var b = 0; b <= NP; b++) row.push(P(a / NT * Math.PI, b / NP * 6.2832)); grid.push(row); }
    function half(side) {
      var g2 = grid.map(function (row) { return row.map(function (p) { var c = crackX(p[1], p[2]), x = p[0], cl = false; if (side < 0 && x > c) { x = c; cl = true; } if (side > 0 && x < c) { x = c; cl = true; } return [x, p[1], p[2], cl]; }); });
      var quads = [], R = A.rng(seed + side * 7);
      for (var a2 = 0; a2 < NT; a2++) for (var b2 = 0; b2 < NP; b2++) {
        var v = [g2[a2][b2], g2[a2][b2 + 1], g2[a2 + 1][b2 + 1], g2[a2 + 1][b2]], cl = v[0][3] && v[1][3] && v[2][3] && v[3][3];
        var j = 1, base = cl ? [196, 184, 168] : [232, 226, 216];
        quads.push({ v: v.map(function (q) { return [q[0], q[1], q[2]]; }), c: [base[0] * j, base[1] * j, base[2] * j], n: cl ? [side < 0 ? 1 : -1, 0, 0] : null });
      }
      // 투영 범위
      var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, cam0 = A.cab(0, 0, S, CAM.kx, CAM.ky);
      g2.forEach(function (row) { row.forEach(function (p) { var s = cam0.p(p[0], p[1], p[2]); x0 = Math.min(x0, s[0]); y0 = Math.min(y0, s[1]); x1 = Math.max(x1, s[0]); y1 = Math.max(y1, s[1]); }); });
      var pad = 6, sc = 2, cv = A.canvas(Math.ceil((x1 - x0 + 2 * pad) * sc), Math.ceil((y1 - y0 + 2 * pad) * sc)), g = cv.getContext('2d');
      g.scale(sc, sc); var cam = A.cab(pad - x0, pad - y0, S, CAM.kx, CAM.ky);
      A.mesh(g, cam, quads, { amb: 0.5, dif: 0.62 });
      // 화강암 알갱이 무늬 (그린 부분에만)
      var tx = A.canvas(cv.width, cv.height), tg = tx.getContext('2d'); tg.fillStyle = tg.createPattern(A.texture('granite'), 'repeat'); tg.fillRect(0, 0, tx.width, tx.height); tg.globalCompositeOperation = 'destination-in'; tg.drawImage(cv, 0, 0);
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.9; g.drawImage(tx, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      // 가장자리 살짝 어둡게
      var ox = (pad - x0), oy = (pad - y0);
      return { img: cv, sc: sc, ox: ox, oy: oy, cam: cam, grid: g2 };
    }
    var L = half(-1), Rh = half(1);
    // 틈의 앞쪽 가장자리(위에서 경첩까지): 높이마다 가장 앞(z가 가장 작은) 틈 위의 점
    var edge = [];
    for (var y = 1.55; y >= HY; y -= 0.05) { var best = null; L.grid.forEach(function (row) { row.forEach(function (p) { if (p[3] && Math.abs(p[1] - y) < 0.04 && (!best || p[2] < best[2])) best = p; }); }); if (best) edge.push([best[0], y, best[2]]); }
    var top = edge[0];
    var B = { L: L, R: Rh, edge: edge, top: top, P: P };
    BCACHE[seed] = B; return B;
  }
  var toS = function (p) { return [GX + (p[0] + p[2] * CAM.kx) * S, GY - (p[1] + p[2] * CAM.ky) * S]; };
  /* 두 쪽의 화면 변환: a(틈이 벌어진 각), s(쪼개져 기울어진 정도) */
  function xform(B, side, a, s) {
    var hz = B.edge[B.edge.length - 1], Hs = toS(hz), corner = toS([side < 0 ? -1.25 : 1.3, 0, -0.3]);
    var ang = side < 0 ? -a * 0.45 : a, sAng = side < 0 ? -0.05 * s : 0.14 * s, dx = side < 0 ? -10 * s : 34 * s;
    return {
      apply: function (c) { c.translate(dx, 0); c.translate(corner[0], corner[1]); c.rotate(sAng); c.translate(-corner[0], -corner[1]); c.translate(Hs[0], Hs[1]); c.rotate(ang); c.translate(-Hs[0], -Hs[1]); },
      pt: function (q) { var p = A.rot([q], Hs[0], Hs[1], ang)[0]; p = A.rot([p], corner[0], corner[1], sAng)[0]; return [p[0] + dx, p[1]]; },
    };
  }
  function drawHalf(c, H, X, deco) { c.save(); X.apply(c); c.drawImage(H.img, GX - H.ox, GY - H.oy, H.img.width / H.sc, H.img.height / H.sc); if (deco) deco(c); c.restore(); }
  function gapPath(c, B, XL, XR, split) {
    var E = B.edge.map(toS), Lp = E.map(XL.pt), Rp = E.map(XR.pt);
    if (split > 0) { var bot = toS([crackX(0.02, -0.9), 0.02, -0.9]); Lp.push(XL.pt(bot)); Rp.push(XR.pt(bot)); }
    c.beginPath(); c.moveTo(Lp[0][0], Lp[0][1]); Lp.forEach(function (q) { c.lineTo(q[0], q[1]); }); Rp.slice().reverse().forEach(function (q) { c.lineTo(q[0], q[1]); }); c.closePath();
    return { L: Lp, R: Rp };
  }
  function chips(c, k, seed) { // 떨어진 작은 조각
    if (k <= 0) return; var r = A.rng(seed);
    for (var i = 0; i < 7; i++) { var kk = clamp(k * 1.5 - i * 0.08, 0, 1); if (kk <= 0) continue; var x = GX + 10 + (r() - 0.3) * 120, s = 6 + r() * 9, y0 = GY - 150, y = lerp(y0, GY + 6 + r() * 14 - s * 0.4, kk * kk); A.shadow(c, x + 4, GY + 10 + r() * 14, s * 1.3 * kk, s * 0.35, 0.3 * kk); A.volume(c, A.blob(x, y, s * 1.2, s * 0.75, 8, seed + i * 7, 0.45), 'granite', { lw: 0.8 }); }
  }

  /* ========== ① 물 ========== */
  function ice(c, W, H, t, p) {
    var N = 4, END = 0.84, cyc = Math.min(p, END) / END * N, k = Math.min(N, Math.floor(cyc)), f = p >= END ? 0 : cyc - k; if (k >= N) f = 0;
    var done = p >= END, night = done ? 0 : clamp(seg(f, 0.3, 0.4) - seg(f, 0.68, 0.78), 0, 1);
    var split = seg(p, 0.86, 1), a = 0.012 + 0.017 * (k + (done ? 0 : seg(f, 0.4, 0.64)));
    var B = boulder(21), XL = xform(B, -1, a, split), XR = xform(B, 1, a, split);
    land(c, W, H, t, { night: night });
    A.shadow(c, GX + 50, GY + 16, 205, 34, 0.42);
    // 틈 속 (깊고 어두워요)
    c.save(); var G = gapPath(c, B, XL, XR, split); var dg = c.createLinearGradient(0, GY - 170, 0, GY); dg.addColorStop(0, '#2c241c'); dg.addColorStop(1, '#0d0a07'); c.fillStyle = dg; c.globalAlpha = 1 - split; c.fill(); c.restore();
    drawHalf(c, B.L, XL); drawHalf(c, B.R, XR);
    // 물·얼음
    var lvl = done ? 1 - seg(p, 0.84, 0.88) : k === 0 ? seg(f, 0.04, 0.32) : 1, iceK = done ? 0 : seg(f, 0.38, 0.5) * (1 - seg(f, 0.7, 0.84));
    var Ltop = G.L[0], bot = G.L[G.L.length - 1];
    if (lvl > 0.01) {
      var ly = lerp(bot[1], Ltop[1] - 2, lvl);
      c.save(); gapPath(c, B, XL, XR, 0); c.clip();
      var wg = c.createLinearGradient(GX - 30, 0, GX + 40, 0); wg.addColorStop(0, '#3f7fb4'); wg.addColorStop(0.5, '#6fb1de'); wg.addColorStop(1, '#2f6a9c');
      c.fillStyle = wg; c.fillRect(GX - 120, ly, 260, GY - ly + 10);
      c.strokeStyle = 'rgba(230,246,255,.85)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(GX - 120, ly + 1); c.lineTo(GX + 140, ly + 1); c.stroke();
      if (iceK > 0.01) { c.globalAlpha = iceK; var ig = c.createLinearGradient(GX - 30, 0, GX + 40, 0); ig.addColorStop(0, '#cfe9f7'); ig.addColorStop(0.5, '#ffffff'); ig.addColorStop(1, '#b5d9ee'); c.fillStyle = ig; c.fillRect(GX - 120, ly - 4, 260, GY - ly + 10);
        var rr = A.rng(8); c.strokeStyle = 'rgba(120,175,215,.7)'; c.lineWidth = 0.8; for (var j = 0; j < 26; j++) { var x = GX - 20 + rr() * 50, y = lerp(ly, bot[1], rr()), s = 2 + rr() * 4; c.beginPath(); for (var m = 0; m < 3; m++) { var an = m * 1.047 + rr(); c.moveTo(x - Math.cos(an) * s, y - Math.sin(an) * s); c.lineTo(x + Math.cos(an) * s, y + Math.sin(an) * s); } c.stroke(); } }
      c.restore();
      // 얼음이 입구 위로 볼록 솟아요
      if (iceK > 0.05) { var mx = (G.L[0][0] + G.R[0][0]) / 2, my = (G.L[0][1] + G.R[0][1]) / 2, wv = Math.abs(G.R[0][0] - G.L[0][0]) / 2 + 2; c.save(); c.globalAlpha = iceK; var hg = c.createRadialGradient(mx - 2, my - 5, 1, mx, my, wv + 6); hg.addColorStop(0, '#ffffff'); hg.addColorStop(1, '#bcdcef'); c.fillStyle = hg; c.beginPath(); c.ellipse(mx, my + 1, wv + 3, 5 + a * 60, 0, Math.PI, 0); c.fill(); c.restore(); }
    }
    chips(c, seg(p, 0.9, 1), 31);
    // 비 (낮에 물이 스며드는 때)
    var rain = done ? 0 : clamp(k === 0 ? 1 - seg(f, 0.28, 0.34) : (f < 0.3 ? 1 - seg(f, 0.22, 0.3) : seg(f, 0.86, 0.92)), 0, 1) * (1 - night);
    if (rain > 0.05 && !A.REDUCE) { c.save(); c.strokeStyle = 'rgba(190,215,235,' + 0.55 * rain + ')'; c.lineWidth = 1.2; for (var d = 0; d < 60; d++) { var dx = ((d * 97) % 720) - 40, dy = ((t * 420 + d * 53) % 440) - 20; c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx - 3, dy + 13); c.stroke(); } c.restore(); }
    nightCover(c, night);
    // 얼면서 틈을 미는 힘
    var push = done ? 0 : seg(f, 0.4, 0.46) * (1 - seg(f, 0.62, 0.68)), mid = Math.floor(G.L.length * 0.4);
    if (push > 0.02) { c.save(); c.globalAlpha = push; var pl = G.L[mid], pr = G.R[mid]; A.arrow(c, pl[0] - 6, pl[1], pl[0] - 58, pl[1] + 3, '#ea8a3c', 5); A.arrow(c, pr[0] + 6, pr[1], pr[0] + 58, pr[1] - 3, '#ea8a3c', 5); c.restore(); }
    var labels = [];
    if (iceK > 0.5) labels.push({ k: 'i', t: '얼음 (부피가 늘어나요)', x: G.R[2][0] + 18, y: G.R[2][1] - 14, cls: 'ice', at: 'l' });
    else if (lvl > 0.4 && !done) labels.push({ k: 'w', t: '틈에 스며든 물', x: G.R[3][0] + 18, y: G.R[3][1] - 6, cls: 'water', at: 'l' });
    var cap = done ? (split > 0.4 ? '틈이 커져 암석이 부서졌어요' : '틈이 점점 넓어졌어요') : night > 0.5 ? '밤: 물이 얼어 부피가 늘어나며 틈을 밀어요' : f < 0.36 ? (k ? '낮: 넓어진 틈으로 물이 다시 스며들어요' : '비가 내려 물이 암석 틈에 스며들어요') : '낮: 얼음이 녹아요';
    return { cap: cap, labels: labels, night: night };
  }

  /* ========== ② 생물 ========== */
  var MOSS = { L: [[-1.15, 0.9, -0.55], [-0.75, 1.35, -0.6], [-1.3, 0.45, -0.25], [-0.4, 1.5, -0.2]], R: [[1.0, 1.1, -0.65], [1.3, 0.55, -0.4], [0.65, 1.45, -0.45], [1.15, 0.8, 0.2]] };
  function surfPts(B, side, phi) { // 바위 위쪽에서 겉을 따라 내려가는 뿌리 길(화면 좌표)
    var out = []; for (var i = 0; i <= 12; i++) { var th = lerp(0.12, 1.5, i / 12), p = B.P(th, phi), c = crackX(p[1], p[2]); if ((side < 0 && p[0] > c) || (side > 0 && p[0] < c)) continue; out.push(toS([p[0] * 1.01, p[1] + 0.01, p[2] * 1.01])); } return out;
  }
  function bio(c, W, H, t, p) {
    var a = 0.01 + 0.075 * seg(p, 0.3, 0.92), split = seg(p, 0.9, 1) * 0.7;
    var B = boulder(23), XL = xform(B, -1, a, split), XR = xform(B, 1, a, split);
    land(c, W, H, t, { top: '9fc6da', bot: 'e9f0e4' });
    // 뒤 숲 (멀수록 흐리게)
    [[40, 0.34, 1], [118, 0.42, 2], [470, 0.38, 3], [560, 0.46, 4], [620, 0.33, 5], [210, 0.3, 6]].forEach(function (q) { A.tree(c, q[0], HZ + 14, q[1], t, { seed: 40 + q[2], h: 300, haze: 0.38, shadow: false }); });
    A.shadow(c, GX + 50, GY + 16, 205, 34, 0.42);
    c.save(); var G = gapPath(c, B, XL, XR, split); c.fillStyle = '#18120c'; c.globalAlpha = 1 - split; c.fill(); c.restore();
    var mossK = seg(p, 0.1, 0.9);
    function moss(side) {
      return function (cc) {
        if (mossK <= 0) return;
        MOSS[side].forEach(function (m, i) {
          var s = toS(m), R = (16 + i * 3) * mossK; if (R < 1) return;
          var tg = cc.createRadialGradient(s[0], s[1], R * 0.3, s[0], s[1], R * 1.9); tg.addColorStop(0, 'rgba(120,84,40,.45)'); tg.addColorStop(1, 'rgba(120,84,40,0)'); cc.fillStyle = tg; cc.beginPath(); cc.ellipse(s[0], s[1], R * 1.9, R * 1.3, 0, 0, 6.283); cc.fill();
          var r = A.rng(30 + i + (side === 'L' ? 0 : 50));
          for (var j = 0; j < 110; j++) { var an = r() * 6.283, d = Math.sqrt(r()) * R, x = s[0] + Math.cos(an) * d * 1.35, y = s[1] + Math.sin(an) * d * 0.85, sz = 1 + r() * 2.2, up = (s[1] - y) / R; var k2 = clamp(0.45 + up * 0.3 + (r() - 0.5) * 0.4, 0, 1); cc.fillStyle = 'rgb(' + Math.round(lerp(52, 150, k2)) + ',' + Math.round(lerp(82, 176, k2)) + ',' + Math.round(lerp(26, 64, k2)) + ')'; cc.beginPath(); cc.arc(x, y, sz, 0, 6.283); cc.fill(); }
        });
      };
    }
    // 바위 겉을 따라 내려가는 뿌리 (바위와 함께 움직여요)
    var rk = seg(p, 0.12, 0.75), rw = 2.5 + 7 * seg(p, 0.15, 0.95);
    function sideRoots(side) { return function (cc) { [side < 0 ? 2.6 : 0.4, side < 0 ? 3.5 : -0.5].forEach(function (phi, i) { var P2 = surfPts(B, side, phi); if (P2.length > 2) A.root(cc, A.partial(P2, rk * (1 - i * 0.15)), rw * (0.8 - i * 0.2), 0.8); }); }; }
    drawHalf(c, B.L, XL, function (cc) { moss('L')(cc); sideRoots(-1)(cc); });
    drawHalf(c, B.R, XR, function (cc) { moss('R')(cc); sideRoots(1)(cc); });
    // 틈 가운데를 따라 내려가는 굵은 뿌리
    var mid = G.L.map(function (q, i) { return [(q[0] + G.R[i][0]) / 2, (q[1] + G.R[i][1]) / 2]; });
    A.root(c, A.partial(mid, seg(p, 0.06, 0.6)), 3 + 9 * seg(p, 0.15, 0.95), 1.2);
    var tS = seg(p, 0.03, 0.85), top = mid[0];
    if (tS < 0.18) A.sprout(c, top[0], top[1], seg(p, 0.0, 0.05) * 1.1); else A.tree(c, top[0], top[1] + 2, tS, t, { seed: 12, h: 300, scale: 0.62 });
    chips(c, seg(p, 0.93, 1), 41);
    var push = seg(p, 0.35, 0.42) * (1 - seg(p, 0.85, 0.9)), mi = Math.floor(G.L.length * 0.45);
    if (push > 0.02) { c.save(); c.globalAlpha = push; var pl = G.L[mi], pr = G.R[mi]; A.arrow(c, pl[0] - 8, pl[1], pl[0] - 58, pl[1] + 3, '#ea8a3c', 5); A.arrow(c, pr[0] + 8, pr[1], pr[0] + 58, pr[1] - 3, '#ea8a3c', 5); c.restore(); }
    var labels = [];
    if (p > 0.3) labels.push({ k: 'r', t: '뿌리', x: mid[Math.floor(mid.length * 0.55)][0] + 30, y: mid[Math.floor(mid.length * 0.55)][1], cls: 'root', at: 'l' });
    if (mossK > 0.4) { var ms = XL.pt(toS(MOSS.L[2])); labels.push({ k: 'm', t: '이끼 (자란 곳의 색이 변해요)', x: ms[0] - 30, y: ms[1] + 46, cls: 'moss', at: 'c' }); }
    var cap = p < 0.1 ? '암석 틈에 식물의 씨앗이 자리 잡아요' : p < 0.35 ? '뿌리가 틈을 파고들고, 표면에 이끼가 자라요' : p < 0.9 ? '뿌리가 굵어지며 틈을 넓혀요' : '틈이 커져 암석이 부서졌어요';
    return { cap: cap, labels: labels };
  }

  /* ========== ③ 압력: 단면 덩어리. 화강암 위의 땅이 깎여 드러나면 겉 부분이 얇게 벗겨져요 ========== */
  var PS = 84, PO = [172, 318], PCAM = { kx: 0.44, ky: 0.46 };
  var BX0 = -1.6, BX1 = 3.6, BD = 1.5, BBOT = -0.95, R1 = 1.2, RY1 = 1.05, TH = 0.12, DCX = 1.0;
  function pcam() { return A.cab(PO[0], PO[1], PS, PCAM.kx, PCAM.ky); }
  var faceCache = {};
  // 앞면 그림: 층(덮개) + 화강암 단면(겹 줄). 땅 높이 h 아래만
  function pressFront(h, kind) {
    var key = kind + h.toFixed(3); if (faceCache.key === key) return faceCache.img;
    var wU = (kind === 'side' ? BD : BX1 - BX0), hU = h - BBOT, sc = 60, cv = A.canvas(Math.max(2, Math.round(wU * sc)), Math.max(2, Math.round(hU * sc))), g = cv.getContext('2d');
    g.fillStyle = g.createPattern(A.texture('strata'), 'repeat'); g.save(); g.translate(0, -(1.9 - h) * sc); g.fillRect(0, 0, cv.width, cv.height + 200); g.restore();
    if (kind === 'front') {
      var X = function (x) { return (x - BX0) * sc; }, Y = function (y) { return (h - y) * sc; };
      g.save(); g.beginPath(); for (var i = 0; i <= 60; i++) { var a = Math.PI - (i / 60) * Math.PI, x = DCX + Math.cos(a) * R1, y = Math.sin(a) * RY1; if (i) g.lineTo(X(x), Y(y)); else g.moveTo(X(x), Y(y)); } g.lineTo(X(DCX + R1 + 0.7 * 0.95), Y(BBOT)); g.lineTo(X(DCX - R1 - 0.7 * 0.95), Y(BBOT)); g.closePath();
      g.fillStyle = g.createPattern(A.texture('granite'), 'repeat'); g.fill(); g.clip();
      var sh = g.createLinearGradient(0, 0, 0, cv.height); sh.addColorStop(0, 'rgba(255,255,255,.12)'); sh.addColorStop(1, 'rgba(40,30,20,.18)'); g.fillStyle = sh; g.fillRect(0, 0, cv.width, cv.height);
      [1 - TH / R1, 1 - 2 * TH / R1].forEach(function (s) { g.strokeStyle = 'rgba(70,60,50,.55)'; g.lineWidth = 1.4; g.beginPath(); for (var j = 0; j <= 60; j++) { var a2 = Math.PI - (j / 60) * Math.PI; var xx = DCX + Math.cos(a2) * R1 * s, yy = Math.sin(a2) * RY1 * s; if (j) g.lineTo(X(xx), Y(yy)); else g.moveTo(X(xx), Y(yy)); } g.stroke(); });
      g.restore();
    }
    faceCache = { key: key, img: cv }; return cv;
  }
  var SHEETS = [ // [겹, θ시작, θ끝, φ시작, φ끝, 시작 p] (φ: 0=오른쪽, π/2=뒤쪽, π=왼쪽)
    [1, 1.0, 1.52, 2.05, Math.PI, 0.42], [1, 1.0, 1.52, 0, 1.1, 0.47], [1, 1.0, 1.52, 1.1, 2.05, 0.53], [1, 0.48, 1.0, 1.57, Math.PI, 0.6], [1, 0.48, 1.0, 0, 1.57, 0.65], [1, 0, 0.48, 1.57, Math.PI, 0.72], [1, 0, 0.48, 0, 1.57, 0.76],
    [2, 1.0, 1.52, 2.05, Math.PI, 0.84], [2, 1.0, 1.52, 0, 1.1, 0.89], [2, 0, 1.0, 0, Math.PI, 9],
  ];
  function sphereP(s, th, ph) { return [DCX + R1 * s * Math.sin(th) * Math.cos(ph), RY1 * s * Math.cos(th), R1 * s * Math.sin(th) * Math.sin(ph)]; }
  function shellQuads(s0, s1, t0, t1, p0, p1, col, xf) {
    var Q = [], nT = 7, nP = 10;
    function add(a, b, c2, d) { var v = [a, b, c2, d].map(xf); Q.push({ v: v, c: col }); }
    for (var i = 0; i < nT; i++) for (var j = 0; j < nP; j++) {
      var ta = lerp(t0, t1, i / nT), tb = lerp(t0, t1, (i + 1) / nT), pa = lerp(p0, p1, j / nP), pb = lerp(p0, p1, (j + 1) / nP);
      add(sphereP(s1, ta, pa), sphereP(s1, tb, pa), sphereP(s1, tb, pb), sphereP(s1, ta, pb));
      add(sphereP(s0, ta, pa), sphereP(s0, ta, pb), sphereP(s0, tb, pb), sphereP(s0, tb, pa));
    }
    for (var i2 = 0; i2 < nT; i2++) { var u = lerp(t0, t1, i2 / nT), w = lerp(t0, t1, (i2 + 1) / nT); add(sphereP(s0, u, p0), sphereP(s0, w, p0), sphereP(s1, w, p0), sphereP(s1, u, p0)); add(sphereP(s0, u, p1), sphereP(s1, u, p1), sphereP(s1, w, p1), sphereP(s0, w, p1)); }
    for (var j2 = 0; j2 < nP; j2++) { var u2 = lerp(p0, p1, j2 / nP), w2 = lerp(p0, p1, (j2 + 1) / nP); if (t0 > 0.01) add(sphereP(s0, t0, u2), sphereP(s1, t0, u2), sphereP(s1, t0, w2), sphereP(s0, t0, w2)); add(sphereP(s0, t1, u2), sphereP(s0, t1, w2), sphereP(s1, t1, w2), sphereP(s1, t1, u2)); }
    return Q;
  }
  function press(c, W, H, t, p) {
    var h = lerp(1.62, 0.06, seg(p, 0, 0.36)), cam = pcam();
    var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8fbedf'); g.addColorStop(1, '#eef2ec'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    A.fit(c, W, H, W0, H0); A.cloud(c, 110, 60, 0.8); A.cloud(c, 520, 44, 0.6);
    // 바닥 그림자, 덩어리의 오른쪽 옆면·앞면
    A.shadow(c, PO[0] + 210, PO[1] + 30, 330, 34, 0.3);
    var front = pressFront(h, 'front'), side = pressFront(h, 'side');
    A.faceImg(c, cam, side, [BX1, h, 0], [BX1, h, BD], [BX1, BBOT, 0], 'rgba(30,20,10,.28)');
    // 윗면(풀밭): 화강암이 드러난 곳은 비워요
    var tA = cam.p(BX0, h, 0), tB = cam.p(BX1, h, 0), tC = cam.p(BX1, h, BD), tD = cam.p(BX0, h, BD);
    c.save(); c.beginPath(); c.moveTo(tA[0], tA[1]); c.lineTo(tB[0], tB[1]); c.lineTo(tC[0], tC[1]); c.lineTo(tD[0], tD[1]); c.closePath();
    var gp = c.createPattern(A.texture('grass'), 'repeat'); try { gp.setTransform(new DOMMatrix().scale(0.7, 0.5)); } catch (e) {} c.fillStyle = gp; c.fill();
    var tg2 = c.createLinearGradient(0, tD[1], 0, tA[1]); tg2.addColorStop(0, 'rgba(230,240,225,.35)'); tg2.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = tg2; c.fill(); c.restore();
    // 화강암(돔): 땅 위로 나온 뒤쪽 반구 + 겉 판(껍질)
    var core = [236, 230, 220], shellC = [246, 240, 230];
    var above = function (q) { return q.v.every(function (v) { return v[1] >= h - 0.02; }); };
    var quads = [];
    // 속: 가장 안쪽 반구(뒤쪽 절반)
    shellQuads(0.0, 1 - 2 * TH / R1 - 0.01, 0, 1.56, 0, Math.PI, core, function (v) { return v; }).forEach(function (q) { if (above(q)) quads.push(q); });
    var fall = [];
    SHEETS.forEach(function (S2, i) {
      var k = seg(p, S2[5], S2[5] + 0.12); var s0 = S2[0] === 1 ? 1 - TH / R1 + 0.006 : 1 - 2 * TH / R1 + 0.006, s1 = S2[0] === 1 ? 1 : 1 - TH / R1 - 0.006;
      var tc = (S2[1] + S2[2]) / 2, pc = (S2[3] + S2[4]) / 2, n = sphereP(1, tc, pc); n = [n[0] - DCX, n[1], n[2]]; var nl = Math.hypot(n[0], n[1], n[2]); n = [n[0] / nl, n[1] / nl, n[2] / nl];
      var dirx = Math.cos(pc), dirz = Math.sin(pc), lift = seg(k, 0, 0.3) * 0.05, sl = seg(k, 0.3, 1), ang = sl * sl * (1.62 - tc + 0.3);
      var xf = function (v) { var x = v[0] - DCX, y = v[1], z = v[2]; // 바깥쪽으로 들뜬 뒤, 자오선을 따라 아래로 미끄러져요
        x += n[0] * lift; y += n[1] * lift; z += n[2] * lift;
        var hx = x * dirx + z * dirz, ca = Math.cos(ang), sa = Math.sin(ang); var nh = hx * ca + y * sa, ny = -hx * sa + y * ca; x += (nh - hx) * dirx; z += (nh - hx) * dirz; y = ny;
        x += dirx * 0.5 * sl * sl; z += dirz * 0.5 * sl * sl; y -= 0.5 * Math.pow(sl, 3);
        return [x + DCX, y, Math.max(0.001, z)]; };
      if (k >= 1) { fall.push(S2); return; }
      shellQuads(s0, s1, S2[1], S2[2], S2[3], S2[4], shellC, xf).forEach(function (q) { if (k > 0.05 || above(q)) quads.push(q); });
    });
    A.meshTex(c, cam, quads, 'granite', { amb: 0.6, dif: 0.55, texA: 0.7 });
    // 떨어진 조각 더미
    var rr = A.rng(14);
    SHEETS.forEach(function (S2, i) { var kk = seg(p, S2[5] + 0.09, S2[5] + 0.15); if (kk <= 0 || S2[5] > 1) { rr(); rr(); rr(); return; } var pc = (S2[3] + S2[4]) / 2; for (var q = 0; q < 3; q++) { var d = R1 + 0.2 + rr() * 0.45, an = pc + (rr() - 0.5) * 0.6, X = DCX + Math.cos(an) * d, Z = Math.max(0.12, Math.sin(an) * d * 0.9), s = cam.p(X, h, Z), sz = 7 + rr() * 6; c.save(); c.globalAlpha = kk; A.shadow(c, s[0] + 4, s[1] + 2, sz * 1.4, sz * 0.4, 0.3); A.volume(c, A.blob(s[0], s[1] - sz * 0.35, sz * 1.4, sz * 0.55, 8, 60 + i * 3 + q, 0.4), 'granite', { lw: 0.8 }); c.restore(); } });
    // 앞면(단면)은 가장 앞이라 마지막에 그려요. 땅 위로 나온 화강암 단면도 함께
    A.faceImg(c, cam, front, [BX0, h, 0], [BX1, h, 0], [BX0, BBOT, 0]);
    // 땅 위로 나온 속(화강암)의 단면: 앞면과 같은 평면이라 평평하게 칠해요 (겉 판의 단면은 판 조각에 들어 있어요)
    (function () { var s2 = 1 - 2 * TH / R1 - 0.004; c.save(); c.beginPath(); for (var i = 0; i <= 48; i++) { var a = Math.PI - i / 48 * Math.PI, q = cam.p(DCX + Math.cos(a) * R1 * s2, Math.max(h, Math.sin(a) * RY1 * s2), 0); if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); } c.closePath();
      c.fillStyle = A.pat(c, 'granite'); c.fill(); c.fillStyle = 'rgba(255,250,240,.12)'; c.fill(); c.restore(); })();
    // 앞면 테두리
    var f0 = cam.p(BX0, h, 0), f1 = cam.p(BX1, h, 0), f2 = cam.p(BX1, BBOT, 0), f3 = cam.p(BX0, BBOT, 0); c.save(); c.strokeStyle = 'rgba(50,36,24,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(f0[0], f0[1]); c.lineTo(f1[0], f1[1]); c.lineTo(f2[0], f2[1]); c.lineTo(f3[0], f3[1]); c.closePath(); c.stroke(); c.restore();
    // 누르던 압력(파랑), 드러난 뒤 바깥으로 늘어남(주황)
    var thick = clamp((h - RY1) / 0.5, 0, 1);
    if (thick > 0.02) { c.save(); c.globalAlpha = Math.min(1, thick * 2); [-0.7, 0, 0.7].forEach(function (dx) { var s0 = cam.p(DCX + dx, h + 0.15 + 0.55 * thick, 0.35), s1 = cam.p(DCX + dx, h + 0.04, 0.35); A.arrow(c, s0[0], s0[1], s1[0], s1[1], '#3d5f9e', 5); }); c.restore(); }
    var ex = seg(p, 0.36, 0.42) * (1 - seg(p, 0.55, 0.6));
    if (ex > 0.02) { c.save(); c.globalAlpha = ex; [2.3, 1.57, 0.84].forEach(function (an) { var a0 = cam.p(DCX + Math.cos(an) * R1 * 1.04, Math.sin(an) * RY1 * 1.04, 0.05), a1 = cam.p(DCX + Math.cos(an) * R1 * 1.42, Math.sin(an) * RY1 * 1.42, 0.05); A.arrow(c, a0[0], a0[1], a1[0], a1[1], '#ea8a3c', 4.5); }); c.restore(); }
    var labels = [], lc = cam.p(BX0 + 0.55, h - 0.25, 0), lg = cam.p(DCX, Math.min(h, RY1) - 0.45 - (h > RY1 ? 0.2 : 0), 0);
    if (h > 0.5) labels.push({ k: 'c', t: '덮고 있던 땅', x: lc[0], y: lc[1], cls: 'soil' });
    labels.push({ k: 'g', t: '화강암', x: lg[0], y: lg[1] + (h > RY1 ? 0 : 30), cls: 'rock' });
    if (p > 0.42 && p < 0.84) { var sh2 = cam.p(DCX - R1 * 0.85, RY1 * 0.75, 0); labels.push({ k: 's', t: '얇게 벗겨지는 겉 부분', x: sh2[0] - 6, y: sh2[1] - 22, cls: 'rock', at: 'r' }); }
    if (p >= 0.84) { var sh3 = cam.p(DCX - R1 * 0.8, RY1 * 0.6, 0); labels.push({ k: 's2', t: '안쪽 겉 부분도 벗겨져요', x: sh3[0] - 6, y: sh3[1] - 22, cls: 'rock', at: 'r' }); }
    var cap = p < 0.13 ? '땅속: 위의 땅이 암석을 눌러요' : p < 0.36 ? '위의 땅이 깎여 암석이 땅 위로 드러나요' : p < 0.42 ? '누르던 압력이 약해져 암석의 겉 부분이 늘어나요' : p < 0.84 ? '겉 부분이 얇게 벗겨져 떨어져요' : '드러난 안쪽 겉 부분도 들떠서 다시 벗겨져요';
    return { cap: cap, labels: labels };
  }

  /* ========== ④ 이산화 탄소 + 물: 틈과 층을 따라 석회암이 녹아 동굴이 돼요 ========== */
  var CS = 76, CO = [128, 244], CCAM = { kx: 0.5, ky: 0.3 }, CX0 = 0, CX1 = 4.4, CD = 1.5, CTOP = 0, CBOT = -2.05, SOIL = 0.2, BEDY = -1.32;
  var JX = [0.95, 2.2, 3.45];
  function caveShape(p, xs) { // 동굴 단면: 층(BEDY)을 따라 생긴 길이 넓어져요. x마다 [천장, 바닥] (없으면 null)
    var reach = lerp(0.05, 0.9, seg(p, 0.2, 0.55)), grow = seg(p, 0.5, 0.95), merge = seg(p, 0.45, 0.6);
    var out = [];
    xs.forEach(function (x) {
      var best = 0; JX.forEach(function (jx) { var d = Math.abs(x - jx) / reach; if (d < 1) best = Math.max(best, Math.sqrt(1 - d * d)); });
      if (merge > 0 && x > JX[0] - 0.2 && x < JX[2] + 0.2) best = Math.max(best, merge * (0.55 + 0.45 * Math.sqrt(Math.max(0, 1 - Math.pow((x - (JX[0] + JX[2]) / 2) / ((JX[2] - JX[0]) / 2 + 0.55), 2)))));
      if (best <= 0.02 || p < 0.2) { out.push(null); return; }
      var dome = 0; JX.forEach(function (jx) { dome += Math.exp(-Math.pow((x - jx) / 0.35, 2)); });
      var hgt = best * (0.05 + 0.55 * grow * (0.55 + 0.45 * dome) + 0.05 * (A.fbm(x * 3, 1, 5) - 0.5));
      out.push([BEDY + 0.02 + hgt + 0.04 * grow * (A.fbm(x * 6, 2, 9) - 0.5), BEDY - 0.02 - 0.06 * best * (0.4 + grow)]);
    });
    return out;
  }
  function co2(c, W, H, t, p) {
    var cam = A.cab(CO[0], CO[1], CS, CCAM.kx, CCAM.ky);
    var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9ab8cf'); g.addColorStop(1, '#e8ecee'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    A.fit(c, W, H, W0, H0);
    // 비구름
    c.save(); A.cloud(c, 190, 44, 1.0, 1); A.cloud(c, 300, 36, 0.8, 1); A.cloud(c, 430, 40, 1.1, 1); c.restore();
    A.shadow(c, CO[0] + 250, CO[1] + 24, 290, 28, 0.3);
    // 옆면
    var sideImg = A.canvas(150, 220), sg = sideImg.getContext('2d'); sg.fillStyle = sg.createPattern(A.texture('lime'), 'repeat'); sg.fillRect(0, 0, 150, 220); sg.fillStyle = sg.createPattern(A.texture('humus'), 'repeat'); sg.fillRect(0, 0, 150, SOIL / (CTOP + SOIL - CBOT) * 220);
    A.faceImg(c, cam, sideImg, [CX1, CTOP + SOIL, 0], [CX1, CTOP + SOIL, CD], [CX1, CBOT, 0], 'rgba(30,20,10,.25)');
    // 윗면 (풀밭)
    var tA = cam.p(CX0, CTOP + SOIL, 0), tB = cam.p(CX1, CTOP + SOIL, 0), tC = cam.p(CX1, CTOP + SOIL, CD), tD = cam.p(CX0, CTOP + SOIL, CD);
    c.save(); c.beginPath(); c.moveTo(tA[0], tA[1]); c.lineTo(tB[0], tB[1]); c.lineTo(tC[0], tC[1]); c.lineTo(tD[0], tD[1]); c.closePath(); var gp = c.createPattern(A.texture('grass'), 'repeat'); try { gp.setTransform(new DOMMatrix().scale(0.7, 0.5)); } catch (e) {} c.fillStyle = gp; c.fill(); c.restore();
    // 앞면: 흙 + 석회암(층, 틈), 동굴
    var X = function (x) { return cam.p(x, 0, 0)[0]; }, Y = function (y) { return cam.p(0, y, 0)[1]; };
    var fx0 = X(CX0), fx1 = X(CX1), fy0 = Y(CTOP + SOIL), fy1 = Y(CBOT);
    c.save(); c.beginPath(); c.rect(fx0, fy0, fx1 - fx0, fy1 - fy0); c.clip();
    c.fillStyle = A.pat(c, 'lime'); c.fillRect(fx0, Y(CTOP), fx1 - fx0, fy1 - Y(CTOP));
    // 층 경계
    c.strokeStyle = 'rgba(120,100,70,.35)'; c.lineWidth = 1; [-0.45, -0.88, BEDY, -1.75].forEach(function (y, i) { c.beginPath(); for (var x = CX0; x <= CX1 + 0.01; x += 0.1) { var yy = Y(y + 0.025 * Math.sin(x * 2 + i)); if (x === CX0) c.moveTo(X(x), yy); else c.lineTo(X(x), yy); } c.stroke(); });
    c.fillStyle = A.pat(c, 'humus'); c.fillRect(fx0, fy0, fx1 - fx0, Y(CTOP) - fy0 + 1);
    var sg2 = c.createLinearGradient(0, fy0, 0, fy1); sg2.addColorStop(0, 'rgba(255,255,255,.08)'); sg2.addColorStop(1, 'rgba(40,30,20,.18)'); c.fillStyle = sg2; c.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0);
    // 틈(절리): 위에서부터 물이 녹여 넓혀요
    var jw = lerp(1.2, 5, seg(p, 0.08, 0.45)), jDeep = lerp(0.3, 1, seg(p, 0.06, 0.2));
    JX.forEach(function (jx, i) {
      var pts = []; for (var y = CTOP; y >= BEDY - 0.01; y -= 0.06) pts.push([X(jx + 0.05 * Math.sin(y * 4 + i * 2)), Y(y)]);
      var vis = A.partial(pts, 1);
      c.save(); c.lineJoin = c.lineCap = 'round';
      c.strokeStyle = 'rgba(30,24,18,.9)'; c.lineWidth = jw; c.beginPath(); vis.forEach(function (q, k2) { var w = k2 / (vis.length - 1) > jDeep ? 0.35 : 1; if (k2) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); void w; }); c.stroke();
      c.strokeStyle = 'rgba(255,248,236,.3)'; c.lineWidth = 1; c.translate(-jw / 2 - 0.5, 0); c.stroke(); c.restore();
      // 틈을 따라 내려가는 물 (반짝이는 물줄기)
      if (!A.REDUCE) { c.save(); c.setLineDash([5, 16]); c.lineDashOffset = -t * 45 - i * 7; c.strokeStyle = 'rgba(120,190,240,.95)'; c.lineWidth = Math.max(1.6, jw * 0.55); c.beginPath(); vis.forEach(function (q, k2) { if (k2) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.stroke(); c.restore(); }
    });
    // 동굴: 층을 따라 옆으로 생긴 길 → 위아래로 넓어진 굴
    var xs = []; for (var x = CX0 + 0.05; x <= CX1 - 0.05; x += 0.04) xs.push(x);
    var shp = caveShape(p, xs), segs = [], cur = null;
    shp.forEach(function (q, i) { if (q) { if (!cur) { cur = []; segs.push(cur); } cur.push([xs[i], q[0], q[1]]); } else cur = null; });
    segs.forEach(function (sgm) {
      if (sgm.length < 2) return;
      c.save(); c.beginPath(); sgm.forEach(function (q, i) { var s = [X(q[0]), Y(q[1])]; if (i) c.lineTo(s[0], s[1]); else c.moveTo(s[0], s[1]); }); sgm.slice().reverse().forEach(function (q) { c.lineTo(X(q[0]), Y(q[2])); }); c.closePath();
      c.save(); c.shadowColor = 'rgba(40,20,5,.45)'; c.shadowBlur = 6; c.fillStyle = '#5a3a22'; c.fill(); c.restore(); c.clip();
      // 안쪽 벽: 깊이 들어갈수록 어두워요 (뒷벽은 비스듬히 오른쪽 위)
      var dz = 1.1 * CS, ox = CCAM.kx * dz * 0.5, oy = -CCAM.ky * dz * 0.5;
      var wg = c.createLinearGradient(X(sgm[0][0]), 0, X(sgm[sgm.length - 1][0]), 0); wg.addColorStop(0, '#9a6a40'); wg.addColorStop(0.5, '#c8925a'); wg.addColorStop(1, '#8a5c36'); c.fillStyle = wg; c.globalAlpha = 0.95; c.fillRect(X(sgm[0][0]) - 10, Y(CTOP), X(sgm[sgm.length - 1][0]) - X(sgm[0][0]) + 20, fy1 - Y(CTOP));
      c.globalAlpha = 1; c.beginPath(); sgm.forEach(function (q, i) { var s = [X(q[0]) + ox, Y(q[1]) + oy + 4]; if (i) c.lineTo(s[0], s[1]); else c.moveTo(s[0], s[1]); }); sgm.slice().reverse().forEach(function (q) { c.lineTo(X(q[0]) + ox, Y(q[2]) + oy); }); c.closePath();
      var bg2 = c.createRadialGradient(X(2.2) + ox, Y(BEDY) + oy, 4, X(2.2) + ox, Y(BEDY) + oy, 160); bg2.addColorStop(0, '#7a5030'); bg2.addColorStop(1, '#3e2716'); c.fillStyle = bg2; c.fill();
      // 고드름처럼 매달린 돌 (나중에)
      var stal = seg(p, 0.8, 1);
      if (stal > 0) { var r = A.rng(5); sgm.forEach(function (q, i) { if (i % 7) return; var L = (3 + r() * 7) * stal * clamp((q[1] - q[2]) / 0.4, 0, 1), xx = X(q[0]) + (r() - 0.5) * 3, yy = Y(q[1]); var sg3 = c.createLinearGradient(xx - 3, 0, xx + 3, 0); sg3.addColorStop(0, '#f2dfbd'); sg3.addColorStop(1, '#b08452'); c.fillStyle = sg3; c.beginPath(); c.moveTo(xx - 3, yy - 2); c.lineTo(xx + 3, yy - 2); c.lineTo(xx + 0.3, yy + L); c.closePath(); c.fill(); }); }
      // 바닥 물줄기
      if (p > 0.35) { c.beginPath(); sgm.forEach(function (q, i) { var s = [X(q[0]), Y(q[2]) - 3 - 3 * seg(p, 0.5, 0.9)]; if (i) c.lineTo(s[0], s[1]); else c.moveTo(s[0], s[1]); }); sgm.slice().reverse().forEach(function (q) { c.lineTo(X(q[0]), Y(q[2]) + 1); }); c.closePath(); var sw = c.createLinearGradient(0, Y(BEDY) - 6, 0, Y(BEDY) + 4); sw.addColorStop(0, '#6aa9d8'); sw.addColorStop(1, '#2f6b9a'); c.fillStyle = sw; c.fill(); }
      c.restore();
      c.save(); c.beginPath(); sgm.forEach(function (q, i) { if (i) c.lineTo(X(q[0]), Y(q[1])); else c.moveTo(X(q[0]), Y(q[1])); }); c.strokeStyle = 'rgba(255,240,220,.35)'; c.lineWidth = 1.2; c.stroke(); c.restore();
    });
    // 층을 따라 옆으로 흐르는 물 (동굴이 생기기 전)
    if (p > 0.15 && p < 0.6 && !A.REDUCE) { c.save(); c.globalAlpha = 1 - seg(p, 0.45, 0.6); c.setLineDash([4, 12]); c.lineDashOffset = -t * 30; c.strokeStyle = 'rgba(120,190,240,.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(X(JX[0] - 0.3), Y(BEDY)); c.lineTo(X(JX[2] + 0.4), Y(BEDY)); c.stroke(); c.restore(); }
    c.restore();
    // 앞면 테두리
    c.save(); c.strokeStyle = 'rgba(50,36,24,.35)'; c.lineWidth = 1; c.strokeRect(fx0, fy0, fx1 - fx0, fy1 - fy0); c.restore();
    // 비 (구름에서 땅까지): 공기 중의 이산화 탄소가 녹은 빗물
    if (!A.REDUCE) { c.save(); c.strokeStyle = 'rgba(150,185,215,.6)'; c.lineWidth = 1.2; for (var d = 0; d < 70; d++) { var rx = 120 + ((d * 61) % 420), ry = 70 + ((t * 300 + d * 37) % (Math.max(30, tA[1] - 60 + (rx - 120) * -0.05))); c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - 2.5, ry + 11); c.stroke(); } c.restore(); }
    var labels = [{ k: 'r', t: '공기 중의 이산화 탄소가 녹은 빗물', x: 470, y: 112, cls: 'co2' }, { k: 'l', t: '석회암', x: X(0.45), y: Y(-0.6), cls: 'rock' }];
    if (p > 0.08 && p < 0.5) labels.push({ k: 'j', t: '틈을 따라 녹아 넓어져요', x: X(JX[1]) + 12, y: Y(-0.55), cls: 'water', at: 'l' });
    if (p > 0.55) labels.push({ k: 'v', t: '석회 동굴', x: X(2.2), y: Y(BEDY + 0.22 + 0.2 * seg(p, 0.6, 0.95)), cls: 'cave' });
    var cap = p < 0.08 ? '공기 중의 이산화 탄소가 녹은 빗물이 땅으로 스며들어요' : p < 0.2 ? '물이 석회암의 틈을 따라 내려가며 틈을 녹여 넓혀요' : p < 0.5 ? '물이 층을 따라 옆으로 흐르며 석회암을 녹여 길을 만들어요' : p < 0.85 ? '녹은 자리가 점점 넓어져 석회 동굴이 돼요' : '석회 동굴이 만들어졌어요';
    return { cap: cap, labels: labels };
  }

  var KIND = { ice: ice, bio: bio, press: press, co2: co2 };
  function draw(kind, ctx, W, H, t, p) { ctx.save(); var r = KIND[kind](ctx, W, H, t, clamp(p, 0, 1)); ctx.restore(); return r; }
  return { draw: draw, W: W0, H: H0 };
})();
