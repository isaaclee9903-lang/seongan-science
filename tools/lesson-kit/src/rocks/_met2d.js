/* ===== 변성암: 원래 암석에 열과 압력 가하기 (2D) =====
   가운데 정육면체 암석 덩어리(앞면·윗면·옆면)를 양옆에서 판이 밀고, 아래에서 열이 올라와요.
   - 사암 → 규암: 모래 알갱이 사이가 메워지며 알갱이가 서로 붙어 치밀해져요.
   - 석회암 → 대리암: 아주 작은 알갱이들이 더 큰 광물 입자로 자라요.
   - 화강암 → 편마암: 덩어리가 옆으로 눌리며 광물 입자가 압력 방향과 수직으로 늘어서고, 어두운 입자와 밝은 입자가 줄지어 모여 줄무늬(엽리)가 생겨요.
   - 이암 → 편암 → 편마암: 먼저 아주 고운 입자가 한 방향으로 늘어서 촘촘한 줄무늬와 반짝임이 생기고(편암),
     변성 작용이 더 일어나면 입자가 커지고 어둡고 밝은 줄무늬가 생겨요(편마암).
   열·압력의 크기와 입자 수는 개념 이해를 위한 모형이에요. */
window.MET2D = (function () {
  'use strict';
  var G = 168;
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  var PAL = {
    sand: [[205, 160, 110], [220, 180, 128], [190, 140, 92], [235, 205, 160], [176, 126, 84]], quartzite: [[242, 230, 214], [236, 204, 174], [246, 238, 228], [228, 186, 156]],
    limeF: [[150, 152, 150], [170, 170, 166], [136, 139, 137], [186, 185, 180]], marble: [[238, 242, 244], [214, 224, 232], [246, 247, 247], [200, 212, 226]],
    granL: [[238, 232, 224], [234, 208, 196], [224, 218, 208], [160, 162, 166], [176, 178, 182]], granD: [[32, 30, 28], [46, 42, 40]],
    mud: [[172, 162, 142], [152, 144, 128], [186, 178, 160], [134, 128, 116]], schist: [[70, 80, 94], [98, 108, 120], [60, 68, 82], [126, 134, 146]],
    gnL: [[226, 222, 214], [204, 200, 194], [232, 214, 204]], gnD: [[40, 42, 46], [64, 66, 72], [30, 32, 36]],
  };
  var ROCK = {
    sandstone: { name: '사암', to: '규암', n: 210, fol: 0 },
    limestone: { name: '석회암', to: '대리암', n: 1500, fol: 0 },
    granite: { name: '화강암', to: '편마암', n: 320, fol: 1 },
    mudstone: { name: '이암', to: '편마암', mid: '편암', n: 2400, fol: 1 },
  };
  function create() {
    var st = { rock: 'sandstone', k: 0, target: 0, busy: false, t: 0, seeds: [], dirty: true, heat: 0 };
    var cv = document.createElement('canvas'); cv.width = cv.height = G; var cx = cv.getContext('2d'), img = cx.createImageData(G, G);
    var noise = new Float32Array(G * G); (function () { var R = rng(17); for (var i = 0; i < G * G; i++) noise[i] = R(); })();
    function setRock(r) {
      st.rock = r; st.k = 0; st.target = 0; st.dirty = true;
      var cfg = ROCK[r], R = rng(r.length * 977 + 13), S = [];
      for (var i = 0; i < cfg.n; i++) {
        var s = { x: R(), y: R(), ph: R() * 6.28, rank: R(), c2: R(), dark: false };
        if (r === 'sandstone') { s.c0 = PAL.sand[(R() * 5) | 0]; s.c1 = PAL.quartzite[(R() * 4) | 0]; }
        else if (r === 'limestone') { s.c0 = PAL.limeF[(R() * 4) | 0]; s.c1 = PAL.marble[(R() * 4) | 0]; }
        else if (r === 'granite') { s.dark = R() < 0.24; s.c0 = s.dark ? PAL.granD[(R() * 2) | 0] : PAL.granL[(R() * 5) | 0]; s.c1 = s.c0; }
        else { s.dark = R() < 0.45; s.c0 = PAL.mud[(R() * 4) | 0]; s.cs = PAL.schist[(R() * 4) | 0]; s.c1 = s.dark ? PAL.gnD[(R() * 3) | 0] : PAL.gnL[(R() * 3) | 0]; }
        // 줄무늬로 모일 자리 (어두운 입자는 어두운 띠, 밝은 입자는 밝은 띠)
        var nb = r === 'granite' ? 4 : 5, w = (s.x * nb) % 1, band = Math.floor(s.x * nb), dc = 0.5; // 띠 하나 안에서 어두운 쪽은 가운데
        s.bx = s.dark ? (band + lerp(0.38, 0.62, R())) / nb : (band + (w < 0.5 ? lerp(0.0, 0.3, R()) : lerp(0.7, 1.0, R()))) / nb;
        S.push(s);
      }
      st.seeds = S;
    }
    /* 앞면 그림: 물체 좌표(눌리기 전)에서 보로노이 무늬를 계산해요 */
    function paint(time) {
      var r = st.rock, cfg = ROCK[r], k = st.k, d = img.data;
      var kk = r === 'mudstone' ? Math.min(1, k / 0.6) : k;            // 편암까지의 진행
      var k2 = r === 'mudstone' ? Math.max(0, (k - 0.6) / 0.4) : (r === 'granite' ? k : 0); // 줄무늬(띠)로 모이는 진행
      // 살아 있는 입자 수: 석회암은 작은 알갱이가 큰 입자로 자라요, 이암은 편마암이 될 때 커져요
      var n = cfg.n; if (r === 'limestone') n = Math.round(lerp(cfg.n, 120, Math.pow(k, 0.7))); if (r === 'mudstone') n = Math.round(lerp(cfg.n, 260, Math.pow(k2, 0.8)));
      var ax = 1 + (cfg.fol ? (r === 'mudstone' ? 1.6 * kk + 0.6 * k2 : 1.3 * k) : 0.1 * k); // 입자가 세로로 길쭉해지는 정도
      var act = st.seeds.filter(function (s) { return s.rank * cfg.n < n || n >= cfg.n; });
      if (act.length < 3) act = st.seeds.slice(0, 3);
      var P = act.map(function (s) { var x = cfg.fol ? lerp(s.x, s.bx, k2 * 0.85) : s.x; return [x * ax, s.y, s]; });
      var bs = Math.sqrt(ax / P.length) * 1.0, nbx = Math.max(1, Math.ceil(ax / bs)), nby = Math.max(1, Math.ceil(1 / bs)), bins = [];
      for (var i = 0; i < nbx * nby; i++) bins.push([]);
      P.forEach(function (p, i) { var bx = Math.min(nbx - 1, (p[0] / bs) | 0), by = Math.min(nby - 1, (p[1] / bs) | 0); bins[by * nbx + bx].push(i); });
      var cell = Math.sqrt(ax / P.length);
      for (var py = 0; py < G; py++) for (var px = 0; px < G; px++) {
        var u = (px + 0.5) / G * ax, v = (py + 0.5) / G, cbx = Math.min(nbx - 1, (u / bs) | 0), cby = Math.min(nby - 1, (v / bs) | 0);
        var d1 = 1e9, d2 = 1e9, w = -1;
        for (var rr = 1; rr <= 4; rr++) {
          for (var yy = cby - rr; yy <= cby + rr; yy++) { if (yy < 0 || yy >= nby) continue; for (var xx = cbx - rr; xx <= cbx + rr; xx++) { if (xx < 0 || xx >= nbx) continue; if (rr > 1 && Math.abs(yy - cby) < rr && Math.abs(xx - cbx) < rr) continue; var B = bins[yy * nbx + xx]; for (var j = 0; j < B.length; j++) { var p = P[B[j]], dx = p[0] - u, dy = p[1] - v, dd = dx * dx + dy * dy; if (dd < d1) { d2 = d1; d1 = dd; w = B[j]; } else if (dd < d2) d2 = dd; } } }
          if (w >= 0 && Math.sqrt(d2) < rr * bs) break;
        }
        var s = P[w][2], D1 = Math.sqrt(d1) / cell, edge = (Math.sqrt(d2) - Math.sqrt(d1)) / cell, id = py * G + px, o = id * 4, c;
        var sh = 0.9 + 0.1 * Math.cos(Math.atan2(v - P[w][1], u - P[w][0]) * 2 + s.ph) + (noise[id] - 0.5) * 0.06;
        if (r === 'sandstone') {
          var col = [lerp(s.c0[0], s.c1[0], k), lerp(s.c0[1], s.c1[1], k), lerp(s.c0[2], s.c1[2], k)], rr2 = lerp(0.5, 0.95, k);
          if (D1 > rr2 && k < 0.98) { var pk = 1 - k; c = [lerp(col[0], 120, pk * 0.8), lerp(col[1], 88, pk * 0.8), lerp(col[2], 58, pk * 0.8)]; }
          else { c = [col[0] * sh, col[1] * sh, col[2] * sh]; if (edge < 0.06 + 0.04 * k) c = [c[0] * 0.8, c[1] * 0.8, c[2] * 0.8]; }
        } else if (r === 'limestone') {
          var col2 = k < 0.2 ? s.c0 : [lerp(s.c0[0], s.c1[0], Math.min(1, (k - 0.1) * 1.4)), lerp(s.c0[1], s.c1[1], Math.min(1, (k - 0.1) * 1.4)), lerp(s.c0[2], s.c1[2], Math.min(1, (k - 0.1) * 1.4))];
          c = [col2[0] * sh, col2[1] * sh, col2[2] * sh]; if (k > 0.25 && edge < 0.05) c = [c[0] * 0.78, c[1] * 0.8, c[2] * 0.84];
        } else if (r === 'granite') {
          c = [s.c0[0] * sh, s.c0[1] * sh, s.c0[2] * sh]; if (edge < 0.05) c = [c[0] * 0.7, c[1] * 0.7, c[2] * 0.7];
        } else {
          var base = kk < 1 || k2 === 0 ? [lerp(s.c0[0], s.cs[0], kk), lerp(s.c0[1], s.cs[1], kk), lerp(s.c0[2], s.cs[2], kk)] : s.cs;
          if (k2 > 0) base = [lerp(base[0], s.c1[0], k2), lerp(base[1], s.c1[1], k2), lerp(base[2], s.c1[2], k2)];
          c = [base[0] * sh, base[1] * sh, base[2] * sh];
          // 편암: 판 모양 입자의 반짝임 (세로 줄을 따라)
          var shine = kk * (1 - k2) * Math.pow(Math.max(0, Math.sin(u / ax * 70 + s.ph * 0.5 + Math.sin(v * 9) * 0.6 + time * 0.8)), 10) * 0.55;
          c = [c[0] + 255 * shine * 0.6, c[1] + 255 * shine * 0.62, c[2] + 255 * shine * 0.66];
          if (k2 > 0.3 && edge < 0.05) c = [c[0] * 0.75, c[1] * 0.75, c[2] * 0.75];
        }
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      }
      cx.putImageData(img, 0, 0);
    }
    function press(to) { st.target = to; st.busy = true; st.t = 0; }
    function step(dt) {
      if (st.busy) { var sp = 1 / 4.2; if (st.k < st.target) st.k = Math.min(st.target, st.k + dt * sp); else st.k = Math.max(st.target, st.k - dt * sp * 3); st.dirty = true; if (Math.abs(st.k - st.target) < 1e-4) st.busy = false; }
      st.heat = lerp(st.heat, st.busy ? 1 : st.k > 0 ? 0.25 : 0, Math.min(1, dt * 2));
    }
    var lastPaint = -1;
    function draw(c, W, H, time) {
      c.clearRect(0, 0, W, H);
      var cfg = ROCK[st.rock], k = st.k, fol = cfg.fol;
      var sx = 1 - (fol ? 0.3 : 0.14) * k, sy = 1 + (fol ? 0.24 : 0.08) * k;
      if (st.dirty || (st.rock === 'mudstone' && k > 0 && time - lastPaint > 0.08)) { paint(time); st.dirty = false; lastPaint = time; }
      // 바탕: 깊은 땅속
      var bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#5a4636'); bg.addColorStop(1, '#2e2219'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 2; for (var i = 0; i < 10; i++) { c.beginPath(); for (var x = 0; x <= W; x += 16) { var y = H * (i + 0.5) / 10 + Math.sin(x * 0.01 + i) * 6; if (!x) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke(); }
      // 열 (아래에서 올라오는 붉은 기운)
      var ht = st.heat + 0.15 * k;
      if (ht > 0.01) { var hg = c.createRadialGradient(W / 2, H * 0.95, 10, W / 2, H * 0.7, Math.max(W, H) * 0.6); hg.addColorStop(0, 'rgba(255,120,40,' + 0.55 * ht + ')'); hg.addColorStop(1, 'rgba(255,80,20,0)'); c.fillStyle = hg; c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(255,170,90,' + 0.35 * ht + ')'; c.lineWidth = 3; for (var j = 0; j < 7; j++) { var x0 = W * (0.15 + j * 0.12), ph = (time * 0.6 + j * 0.37) % 1; c.beginPath(); for (var t = 0; t <= 1; t += 0.05) { var yy = H * (0.98 - 0.35 * t - 0.3 * ph), xx = x0 + Math.sin(t * 9 + time * 3 + j) * 8; if (!t) c.moveTo(xx, yy); else c.lineTo(xx, yy); } c.stroke(); } }
      // 정육면체 크기
      var F = Math.min(W * 0.42, H * 0.5), fw = F * sx, fh = F * sy, dep = F * 0.34, ddx = dep * 0.75, ddy = -dep * 0.55;
      var x0 = W / 2 - (fw + ddx) / 2, yb = H * 0.86, y0 = yb - fh;
      // 바닥 그림자
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x0 + fw / 2 + ddx / 2, yb + 6, (fw + ddx) * 0.62, 14, 0, 0, 6.283); c.fill();
      // 윗면
      c.save(); c.setTransform(fw / G, 0, ddx / G, ddy / G, x0, y0); c.drawImage(cv, 0, 0); c.restore();
      c.save(); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + fw, y0); c.lineTo(x0 + fw + ddx, y0 + ddy); c.lineTo(x0 + ddx, y0 + ddy); c.closePath(); c.fillStyle = 'rgba(255,255,255,.12)'; c.fill(); c.restore();
      // 옆면
      c.save(); c.setTransform(ddx / G, ddy / G, 0, fh / G, x0 + fw, y0); c.drawImage(cv, 0, 0); c.restore();
      c.save(); c.beginPath(); c.moveTo(x0 + fw, y0); c.lineTo(x0 + fw + ddx, y0 + ddy); c.lineTo(x0 + fw + ddx, yb + ddy); c.lineTo(x0 + fw, yb); c.closePath(); c.fillStyle = 'rgba(0,0,0,.3)'; c.fill(); c.restore();
      // 앞면
      c.drawImage(cv, x0, y0, fw, fh);
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5; c.strokeRect(x0, y0, fw, fh);
      // 압력 판과 화살표
      var plateH = fh + 26, gap = 6;
      [[-1, x0 - gap], [1, x0 + fw + ddx + gap]].forEach(function (S2) {
        var sg = S2[0], px = S2[1], pw = 16, top = yb - plateH + (sg > 0 ? ddy : 0);
        var pg = c.createLinearGradient(px - pw / 2, 0, px + pw / 2, 0); pg.addColorStop(0, '#8a96a2'); pg.addColorStop(0.5, '#dfe5ea'); pg.addColorStop(1, '#7a8692');
        c.fillStyle = pg; c.fillRect(sg < 0 ? px - pw : px, top, pw, plateH);
        var ax0 = sg < 0 ? px - pw - 8 : px + pw + 8, ay = top + plateH / 2, al = Math.min(W * 0.12, 90), push = st.busy ? Math.sin(time * 6) * 4 : 0;
        c.fillStyle = '#f08a2a'; c.beginPath();
        var tip = ax0 + sg * push * -1, tail = ax0 + sg * al;
        c.moveTo(tip, ay); c.lineTo(tip + sg * 26, ay - 22); c.lineTo(tip + sg * 26, ay - 9); c.lineTo(tail, ay - 9); c.lineTo(tail, ay + 9); c.lineTo(tip + sg * 26, ay + 9); c.lineTo(tip + sg * 26, ay + 22); c.closePath(); c.fill();
        var fs0 = Math.max(13, Math.round(Math.min(W, H) * 0.03)); c.font = '900 ' + fs0 + 'px Pretendard, sans-serif'; c.fillStyle = '#ffd7a8'; c.textAlign = 'center'; c.fillText('압력', ax0 + sg * al * 0.6, ay - 30);
      });
      // 제목 (원래 암석 → 변성암)
      var fs = Math.max(14, Math.round(Math.min(W, H) * 0.034)), done = !st.busy && k > 0.01;
      var nm = k <= 0.01 ? '원래 암석: ' + cfg.name : st.busy ? '변성 작용이 일어나는 중…' : '변성암: ' + (st.rock === 'mudstone' && k < 0.99 ? cfg.mid : cfg.to);
      c.font = '900 ' + fs + 'px Pretendard, sans-serif'; var tw = c.measureText(nm).width + 26;
      c.fillStyle = done ? '#3f7f5a' : k <= 0.01 ? '#6b7b80' : '#b0662e'; c.beginPath(); c.roundRect(W / 2 - tw / 2, Math.max(10, y0 + ddy - fs * 2.6), tw, fs * 1.8, 12); c.fill();
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(nm, W / 2, Math.max(10, y0 + ddy - fs * 2.6) + fs * 0.9 + 1);
      if (ht > 0.05) { c.font = '900 ' + fs + 'px Pretendard, sans-serif'; c.fillStyle = 'rgba(255,200,140,' + Math.min(1, ht * 1.5) + ')'; c.fillText('열', W / 2, Math.min(H - fs, yb + 34)); }
      c.textBaseline = 'alphabetic';
    }
    setRock('sandstone');
    return { st: st, setRock: setRock, press: press, step: step, draw: draw, ROCK: ROCK };
  }
  return { create: create };
})();
