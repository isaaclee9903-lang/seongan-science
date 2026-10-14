/* ===== 토양의 생성 과정 (교과서 그림 Ⅱ-12를 움직이는 단면 그림으로) =====
   SOIL.draw(ctx, W, H, t, s, o) → { cap, labels }
   s = 0(① 단단한 암석) → 1(② 표면에 흙, 식물) → 2(③ 토양이 두꺼워짐), 사이 값은 이어서 변해요.
   땅 덩어리를 비스듬히 내려다본 모습: 앞면·옆면에 같은 층이 보이고, 윗면에는 풀과 나무가 있어요.
   o.labels === false: 이름표 없음, o.marks: 이름 대신 번호(정리 페이지), o.bg/o.bg2: 바탕색
   설계 크기 900×600. 이 조각 앞에 ART(_art.js)가 있어야 해요. */
window.SOIL = (function () {
  'use strict';
  var A = window.ART, W0 = 900, H0 = 600, lerp = A.lerp, seg = A.seg, clamp = A.clamp;
  var NAMES = ['식물이 잘 자라는 층', '물에 녹은 물질과 진흙 등으로<br>이루어진 층', '암석 조각과 모래 등으로<br>이루어진 층', '풍화 작용이 거의<br>일어나지 않은 암석층'];
  var PLAIN = ['식물이 잘 자라는 층', '물에 녹은 물질과 진흙 등으로 이루어진 층', '암석 조각과 모래 등으로 이루어진 층', '풍화 작용이 거의 일어나지 않은 암석층'];
  var COLS = ['#4a3222', '#9a6038', '#c0a06c', '#b4afa5'];
  var S = 96, BW = 4.4, BH = 3.15, BD = 1.6, OX = 318, OY = 262, KX = 0.46, KY = 0.32;
  var cam = A.cab(OX, OY, S, KX, KY);
  function thick(s) { return { hum: s < 1 ? 14 * s : 14 + 46 * (s - 1), clay: s < 1 ? 0 : 54 * (s - 1), frag: s < 1 ? 78 * s : 78 + 24 * (s - 1) }; }
  var wave = function (x, k) { return Math.sin(x * 0.045 + k) * 3 + Math.sin(x * 0.11 + k * 2) * 1.6; };
  function layerYs(s, x) { var T = thick(s), y1 = T.hum + wave(x, 1) * clamp(T.hum / 20, 0, 1), y2 = y1 + T.clay + wave(x, 2) * clamp(T.clay / 20, 0, 1), y3 = y2 + T.frag + wave(x, 3) * clamp(T.frag / 20, 0, 1); return [0, y1, y2, y3]; }
  /* 덩어리 무늬(돌담처럼 쌓인 암석): 면마다 따로 */
  var BCACHE = {};
  function blocks(w, h, seed) {
    var key = w + ':' + h + ':' + seed; if (BCACHE[key]) return BCACHE[key];
    var r = A.rng(seed), out = [], y = -6;
    while (y < h + 10) { var deep = y / h, hb = 26 + deep * 18, x = -20 - r() * 40; while (x < w + 20) { var bw = 40 + r() * 70 + deep * 20, bh = hb * (0.75 + r() * 0.5); out.push({ x: x, y: y + (r() - 0.5) * 8, w: bw, h: bh, rr: r(), sd: Math.floor(r() * 1e6) }); x += bw + 3 + r() * 6; } y += hb + 3 + r() * 4; }
    BCACHE[key] = out; return out;
  }
  function block(g, b, k, mode) {
    var cx = b.x + b.w / 2, cy = b.y + b.h / 2, w = b.w * k, h = b.h * k;
    g.save(); g.translate(cx, cy); if (mode) g.rotate((b.rr - 0.5) * 0.6 * mode);
    var gr = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); gr.addColorStop(0, '#f2efe9'); gr.addColorStop(0.55, '#d6d1c8'); gr.addColorStop(1, '#a29c92');
    g.fillStyle = gr; g.shadowColor = 'rgba(40,30,20,.35)'; g.shadowBlur = 3; g.shadowOffsetX = 1; g.shadowOffsetY = 2;
    var r = A.rng(b.sd || 7), j = 0.06 + 0.12 * mode, P = [[-0.5, -0.5], [0, -0.5], [0.5, -0.5], [0.5, 0], [0.5, 0.5], [0, 0.5], [-0.5, 0.5], [-0.5, 0]].map(function (q) { return [(q[0] + (r() - 0.5) * j * 2) * w, (q[1] + (r() - 0.5) * j * 2) * h]; });
    A.smoothPath(g, P); g.fill(); g.shadowColor = 'transparent';
    g.globalCompositeOperation = 'multiply'; g.fillStyle = A.pat(g, 'stone'); g.globalAlpha = 0.35; g.fill(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.strokeStyle = 'rgba(80,70,60,.35)'; g.lineWidth = 0.8; g.stroke(); g.restore();
  }
  /* 한 면 그리기 (윗변이 땅 표면, 아래로 깊어져요) */
  function paintFace(g, w, h, s, t, seed, front) {
    var Bk = blocks(w, h, seed);
    g.fillStyle = '#8a7d6e'; g.fillRect(0, 0, w, h);
    function band(i) { g.beginPath(); var n = 30, k; for (k = 0; k <= n; k++) { var x = w * k / n, y = layerYs(s, x + seed)[i]; if (k) g.lineTo(x, y); else g.moveTo(x, y); } for (k = n; k >= 0; k--) { var x2 = w * k / n, y2 = i === 3 ? h : layerYs(s, x2 + seed)[i + 1]; g.lineTo(x2, y2); } g.closePath(); }
    band(2); g.fillStyle = A.pat(g, 'sand'); g.fill();
    Bk.forEach(function (b) {
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2, L = layerYs(s, cx + seed);
      if (cy < L[2] - 4) return;
      var fr = 1 - seg(cy, L[3] - 18, L[3] + 26);
      if (fr > 0.98 && cy < L[2] + 10) return;
      var k = lerp(1, 0.42, fr);
      if (fr > 0.05) { [[-0.22, -0.18], [0.24, 0.12], [-0.05, 0.28]].forEach(function (q, j) { if (j === 2 && b.w < 70) return; block(g, { x: b.x + q[0] * b.w, y: b.y + q[1] * b.h, w: b.w * lerp(1, 0.62, fr), h: b.h * lerp(1, 1.15, fr), rr: (b.rr + j * 0.37) % 1, sd: b.sd + j }, k * (0.95 - j * 0.12), fr); }); }
      else block(g, b, k, 0);
    });
    band(1); g.fillStyle = A.pat(g, 'clay'); g.fill();
    band(0); g.fillStyle = A.pat(g, 'humus'); g.fill();
    var T = thick(s);
    if (T.clay > 6) { var r = A.rng(seed + 5); for (var i = 0; i < 40; i++) { var x = r() * w, L = layerYs(s, x + seed), y = lerp(L[1] + 4, L[2] - 4, r()), sz = 2 + r() * 3; g.fillStyle = 'rgba(214,206,192,.9)'; g.beginPath(); g.ellipse(x, y, sz, sz * 0.7, r() * 3, 0, 6.283); g.fill(); } }
    // 물에 녹아 아래로 내려가는 물질
    var mv = seg(s, 1.1, 1.5);
    if (mv > 0 && !A.REDUCE) { for (var j = 0; j < 40; j++) { var px = 10 + ((j * 89) % (w - 20)), L2 = layerYs(s, px + seed), ph = ((t * 0.18 + j * 0.137) % 1), py = lerp(L2[0] + 6, L2[2] + 4, ph); g.fillStyle = 'rgba(' + (ph < 0.5 ? '60,38,22' : '110,64,34') + ',' + (0.8 * mv * Math.sin(ph * Math.PI)) + ')'; g.beginPath(); g.arc(px + Math.sin(ph * 9 + j) * 2, py, 1.8, 0, 6.283); g.fill(); } }
    if (front) {
      var tr = seg(s, 1.25, 2), tx = w * 0.77;
      if (tr > 0) {
        var RT = [[[tx, 0], [tx - 4, 30], [tx - 28, 62], [tx - 54, 92], [tx - 80, 112]], [[tx + 10, 0], [tx + 22, 40], [tx + 28, 82], [tx + 50, 116], [tx + 74, 130]], [[tx + 4, 0], [tx, 50], [tx + 6, 96], [tx, 140]], [[tx - 20, 30], [tx - 50, 40], [tx - 88, 44], [tx - 120, 60]]];
        RT.forEach(function (R, k2) { A.root(g, A.partial(R, tr * (1 - k2 * 0.08)), 6 - k2, 0.8); });
      }
      if (s > 1.5) { [[w * 0.27, 0.5], [w * 0.47, 1.6]].forEach(function (q, k3) { var L3 = layerYs(s, q[0] + seed), y = lerp(L3[0], L3[1], 0.55) + k3 * 4, ph = A.REDUCE ? 0 : t * 1.5 + q[1]; g.save(); g.globalAlpha = seg(s, 1.5, 1.8); g.lineCap = 'round'; for (var pass = 0; pass < 2; pass++) { g.strokeStyle = pass ? 'rgba(255,220,214,.5)' : '#b97470'; g.lineWidth = pass ? 1.4 : 5; g.beginPath(); for (var u = 0; u <= 30; u += 3) { var xx = q[0] + u, yy = y + Math.sin(u * 0.25 + ph) * 3 - pass; if (u) g.lineTo(xx, yy); else g.moveTo(xx, yy); } g.stroke(); } g.restore(); }); }
    }
    g.strokeStyle = 'rgba(40,24,12,.3)'; g.lineWidth = 1; [1, 2, 3].forEach(function (i) { g.beginPath(); for (var k = 0; k <= 40; k++) { var x = w * k / 40, y = layerYs(s, x + seed)[i]; if (k) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); });
  }
  var faces = null;
  function topIn(u, v) { return u > 0.02 && u < 0.98 && v > 0.03 && v < 0.97; }
  function draw(c, W, H, t, s, o) {
    o = o || {}; s = clamp(s, 0, 2);
    c.save();
    var bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, o.bg || '#e9f1f3'); bg.addColorStop(1, o.bg2 || '#f6f2e9'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
    A.fit(c, W, H, W0, H0);
    var fw = Math.round(BW * S), fh = Math.round(BH * S), sw = Math.round(BD * S);
    if (!faces) faces = { f: A.canvas(fw, fh), s: A.canvas(sw, fh) };
    var gf = faces.f.getContext('2d'), gs = faces.s.getContext('2d'); gf.clearRect(0, 0, fw, fh); gs.clearRect(0, 0, sw, fh);
    paintFace(gf, fw, fh, s, t, 0, true); paintFace(gs, sw, fh, s, t, 333, false);
    // 바닥 그림자
    A.shadow(c, OX + fw * 0.6, OY + fh + 8, fw * 0.75, 30, 0.3);
    // 비 (② 무렵)
    var rain = seg(s, 0.3, 0.6) * (1 - seg(s, 1.3, 1.6));
    // 옆면 (어둡게), 윗면, 앞면
    A.faceImg(c, cam, faces.s, [BW, 0, 0], [BW, 0, BD], [BW, -BH, 0], 'rgba(20,12,4,.24)');
    var tA = cam.p(0, 0, 0), tB = cam.p(BW, 0, 0), tC = cam.p(BW, 0, BD), tD = cam.p(0, 0, BD);
    c.save(); c.beginPath(); c.moveTo(tA[0], tA[1]); c.lineTo(tB[0], tB[1]); c.lineTo(tC[0], tC[1]); c.lineTo(tD[0], tD[1]); c.closePath(); c.clip();
    c.fillStyle = A.pat(c, 'stone'); c.fill();
    var cr = A.rng(3); c.strokeStyle = 'rgba(50,42,34,' + (0.5 * (1 - seg(s, 0.5, 1))) + ')'; c.lineWidth = 1.2; for (var i = 0; i < 18; i++) { var p0 = cam.p(cr() * BW, 0, cr() * BD); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p0[0] + 14 + cr() * 20, p0[1] - 4 + cr() * 8); c.lineTo(p0[0] + 26 + cr() * 18, p0[1] + (cr() - 0.5) * 10); c.stroke(); }
    var soilK = seg(s, 0.4, 1.0); if (soilK > 0) { c.globalAlpha = soilK; c.fillStyle = A.pat(c, 'sand'); c.fillRect(tA[0] - 10, tD[1] - 10, (tC[0] - tA[0]) + 20, (tA[1] - tD[1]) + 20); c.globalAlpha = 1; }
    var grassK = seg(s, 0.7, 1.4); if (grassK > 0) { var gp = c.createPattern(A.texture('grass'), 'repeat'); try { gp.setTransform(new DOMMatrix().scale(0.8, 0.5)); } catch (e) {} c.globalAlpha = grassK; c.fillStyle = gp; c.fillRect(tA[0] - 10, tD[1] - 10, (tC[0] - tA[0]) + 20, (tA[1] - tD[1]) + 20); c.globalAlpha = 1; }
    var lg = c.createLinearGradient(0, tD[1], 0, tA[1]); lg.addColorStop(0, 'rgba(240,246,236,.28)'); lg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = lg; c.fillRect(tA[0] - 10, tD[1] - 10, (tC[0] - tA[0]) + 20, (tA[1] - tD[1]) + 20);
    c.restore();
    // 윗면 위의 암석 조각 (①~②)
    var rc = A.rng(5); for (var q = 0; q < 16; q++) { var u = 0.06 + rc() * 0.88, v = 0.12 + rc() * 0.8, d = rc(), kk = seg(s, 0.1 + d * 0.3, 0.45 + d * 0.3) * (1 - seg(s, 0.9 + d * 0.4, 1.3 + d * 0.4)); if (kk < 0.02) continue; var sp = cam.p(u * BW, 0, v * BD), sz = (5 + rc() * 7) * kk; A.shadow(c, sp[0] + 3, sp[1] + 1, sz * 1.5, sz * 0.4, 0.3); A.volume(c, A.blob(sp[0], sp[1] - sz * 0.35, sz * 1.3, sz * 0.62, 8, 80 + q, 0.4), 'granite', { lw: 0.7 }); }
    // 풀 (윗면 안에서만, 원근)
    var gk = seg(s, 0.65, 1.4);
    if (gk > 0) A.grassField(c, tA[0], tC[0], tD[1], tA[1], t, { n: 520, seed: 4, h: 13, scale: gk, keep: function (x, y) { var v = (tA[1] - y) / (tA[1] - tD[1]), x0 = lerp(tA[0], tD[0], v), x1 = lerp(tB[0], tC[0], v); return v > 0.02 && v < 0.98 && x > x0 + 3 && x < x1 - 3; } });
    // 새싹 (②)
    var spk = seg(s, 0.7, 1.05) * (1 - seg(s, 1.4, 1.7)); if (spk > 0) { var r4 = A.rng(44); for (var q2 = 0; q2 < 9; q2++) { var sp2 = cam.p(0.2 + r4() * (BW - 0.4), 0, 0.2 + r4() * (BD - 0.4)); A.sprout(c, sp2[0], sp2[1], spk * 0.8); } }
    // 앞면 (가장 앞)
    A.faceImg(c, cam, faces.f, [0, 0, 0], [BW, 0, 0], [0, -BH, 0]);
    var sh = c.createLinearGradient(tA[0], 0, tB[0], 0); sh.addColorStop(0, 'rgba(255,255,255,.06)'); sh.addColorStop(1, 'rgba(0,0,0,.1)'); c.fillStyle = sh; c.fillRect(tA[0], tA[1], tB[0] - tA[0], fh);
    // 나무 (윗면 뒤쪽 오른편, 뿌리는 앞면에 보여요)
    var trk = seg(s, 1.15, 2); if (trk > 0) { var tp = cam.p(BW * 0.77 + 0.08, 0, 0.12); A.tree(c, tp[0], tp[1], trk, t, { seed: 7, h: 300, scale: 0.78 }); }
    // 모서리
    c.strokeStyle = 'rgba(40,28,16,.4)'; c.lineWidth = 1.2; var fl = cam.p(0, -BH, 0), fr2 = cam.p(BW, -BH, 0), br = cam.p(BW, -BH, BD);
    c.beginPath(); c.moveTo(fl[0], fl[1]); c.lineTo(tA[0], tA[1]); c.lineTo(tB[0], tB[1]); c.lineTo(fr2[0], fr2[1]); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(tB[0], tB[1]); c.lineTo(tC[0], tC[1]); c.lineTo(br[0], br[1]); c.lineTo(fr2[0], fr2[1]); c.stroke();
    if (rain > 0 && !A.REDUCE) { c.strokeStyle = 'rgba(120,165,205,' + 0.5 * rain + ')'; c.lineWidth = 1.2; for (var d2 = 0; d2 < 46; d2++) { var dx = tA[0] + ((d2 * 61) % (tC[0] - tA[0])), dy = ((t * 260 + d2 * 37) % 190) + 10; c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx - 2.5, dy + 11); c.stroke(); } }
    // 층 이름표: 왼쪽에 선을 그어 이어요
    var labels = [];
    if (o.labels !== false || o.marks) {
      var Ls = layerYs(s, 0), last = -99;
      [[Ls[0], Ls[1]], [Ls[1], Ls[2]], [Ls[2], Ls[3]], [Ls[3], fh]].forEach(function (q3, i) {
        var th = q3[1] - q3[0]; if (th < 12 && !o.marks) return; if (th < 4) return;
        var mid = (q3[0] + q3[1]) / 2, y = Math.max(OY + mid, last + (o.marks ? 46 : 58)); last = y;
        c.strokeStyle = 'rgba(40,50,60,.45)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(OX - 26, y); c.lineTo(OX + 12, OY + mid); c.stroke();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(OX + 12, OY + mid, 4, 0, 6.283); c.fill(); c.strokeStyle = COLS[i]; c.lineWidth = 2; c.stroke();
        labels.push(o.marks ? { k: 'm' + i, t: String(i + 1), x: OX - 46, y: y, cls: 'mark' } : { k: 'l' + i, t: NAMES[i], x: OX - 30, y: y, cls: 'layer', at: 'r' });
      });
    }
    c.restore();
    var cap = s < 0.5 ? '① 단단한 암석이 지표로 드러나 풍화되어 부서져요' : s < 1.35 ? '② 암석이 더 잘게 부서져 표면에 흙이 생기고 식물이 자라요' : '③ 다양한 생물이 살며 더욱 분해된 물질이 아래로 쌓여 토양이 두꺼워져요';
    return { cap: cap, labels: labels };
  }
  return { draw: draw, NAMES: PLAIN, W: W0, H: H0 };
})();
