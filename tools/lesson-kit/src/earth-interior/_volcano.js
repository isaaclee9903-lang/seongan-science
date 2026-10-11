/* ===== 화산 분출물 조사 장면 (시뮬레이션 ② 2단계) =====
   - 화산과 땅속을 자른 단면 그림이에요. 땅속에서 올라온 물질이 통로를 따라 올라와 분출해요.
   - 분출물은 포물선으로 날아가 떨어진 뒤 식어 어두워지고, 용암은 경사면을 따라 흘러내리며 식어요.
   - 조사원이 식은 분출물을 채취해 시료 병에 담고, 확대해 분석해요.
   - 화산 크기, 분출 빠르기, 분출물 크기는 개념 이해를 위한 모형이에요. 마그마·화산탄 같은 교과서 밖 용어는 쓰지 않아요.
   이 조각 앞에 window.EI(_ei.js)가 있어야 해요. */
window.VOLC = (function () {
  'use strict';
  var E = window.EI, RED = E.REDUCE, rng = E.rng(31);
  var H = 0.62, C = 0.11, G = 2.3;      /* 화산 높이(밑변 반폭=1 기준), 분화구 반폭, 중력 */
  function f(u) { return u < C ? 1 - 0.07 * (1 - (u / C) * (u / C)) : Math.pow((1 - u) / (1 - C), 1.35); }
  function sY(x) { var u = Math.abs(x); return u < 1 ? -H * f(u) : 0; }   /* 지표 높이 (위가 음수) */
  function heatCol(k, a) {   /* 1 뜨거움(흰노랑) → 0 식음(어두운 회갈색) */
    var S = [[0, [58, 50, 46]], [0.25, [120, 40, 22]], [0.5, [214, 70, 24]], [0.75, [255, 150, 40]], [1, [255, 240, 170]]];
    for (var i = 1; i < S.length; i++) if (k <= S[i][0]) { var p = S[i - 1], q = S[i], u = (k - p[0]) / (q[0] - p[0]); return 'rgba(' + Math.round(p[1][0] + (q[1][0] - p[1][0]) * u) + ',' + Math.round(p[1][1] + (q[1][1] - p[1][1]) * u) + ',' + Math.round(p[1][2] + (q[1][2] - p[1][2]) * u) + ',' + (a == null ? 1 : a) + ')'; }
    return 'rgba(255,240,170,' + (a == null ? 1 : a) + ')';
  }
  /* 돌 모양(울퉁불퉁한 다각형) */
  function rockShape(seed) { var r = E.rng(seed), P = []; for (var i = 0; i < 9; i++) P.push(0.72 + r() * 0.42); return P; }
  function drawRock(c, x, y, s, shape, heat, rot) {
    c.save(); c.translate(x, y); c.rotate(rot || 0);
    c.beginPath(); shape.forEach(function (k, i) { var a = i / shape.length * Math.PI * 2, px = Math.cos(a) * s * k, py = Math.sin(a) * s * k * 0.82; if (i) c.lineTo(px, py); else c.moveTo(px, py); }); c.closePath();
    var g = c.createLinearGradient(-s, -s, s, s); g.addColorStop(0, '#6b625c'); g.addColorStop(1, '#2c2622'); c.fillStyle = g; c.fill();
    if (heat > 0.02) { c.fillStyle = heatCol(Math.min(1, heat * 1.1), Math.min(1, heat * 1.3)); c.fill(); c.shadowColor = 'rgba(255,120,30,' + heat + ')'; c.shadowBlur = s * 2 * heat; c.fill(); c.shadowBlur = 0; }
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(-s * 0.3, -s * 0.3, s * 0.25, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  /* 조사원 (보호복, 안전모, 망치) */
  function person(c, x, y, s, o) {
    var ph = o.walk || 0, sw = Math.sin(ph) * 0.45, face = o.face || 1, arm = o.arm || 0;
    c.save(); c.translate(x, y); c.scale(face, 1);
    var leg = function (a, col) { c.save(); c.translate(0, -s * 0.46); c.rotate(a); c.fillStyle = col; c.beginPath(); c.roundRect(-s * 0.055, 0, s * 0.11, s * 0.4, s * 0.04); c.fill(); c.fillStyle = '#2a2622'; c.beginPath(); c.roundRect(-s * 0.06, s * 0.36, s * 0.16, s * 0.08, s * 0.03); c.fill(); c.restore(); };
    leg(-sw, '#d95f12'); leg(sw, '#f07a1e');
    /* 배낭 */
    c.fillStyle = '#5c6670'; c.beginPath(); c.roundRect(-s * 0.21, -s * 0.86, s * 0.12, s * 0.32, s * 0.04); c.fill();
    /* 몸통 */
    var g = c.createLinearGradient(-s * 0.15, 0, s * 0.15, 0); g.addColorStop(0, '#e86a16'); g.addColorStop(1, '#ff8f2e');
    c.fillStyle = g; c.beginPath(); c.roundRect(-s * 0.13, -s * 0.9, s * 0.26, s * 0.48, s * 0.07); c.fill();
    c.fillStyle = '#e6edf2'; c.fillRect(-s * 0.13, -s * 0.66, s * 0.26, s * 0.035); c.fillRect(-s * 0.13, -s * 0.56, s * 0.26, s * 0.035);
    /* 팔과 망치 */
    c.save(); c.translate(s * 0.04, -s * 0.84); c.rotate(-0.25 + arm + (o.walk ? -sw * 0.6 : 0));
    c.fillStyle = '#f07a1e'; c.beginPath(); c.roundRect(-s * 0.045, 0, s * 0.09, s * 0.34, s * 0.04); c.fill();
    c.fillStyle = '#30363d'; c.beginPath(); c.arc(0, s * 0.35, s * 0.05, 0, Math.PI * 2); c.fill();
    if (o.hammer !== false) { c.strokeStyle = '#8a5a32'; c.lineWidth = s * 0.035; c.beginPath(); c.moveTo(0, s * 0.35); c.lineTo(s * 0.2, s * 0.42); c.stroke(); c.fillStyle = '#9aa4ae'; c.beginPath(); c.roundRect(s * 0.17, s * 0.34, s * 0.05, s * 0.16, s * 0.015); c.fill(); }
    c.restore();
    /* 머리와 안전모 */
    c.fillStyle = '#f2c9a0'; c.beginPath(); c.arc(s * 0.02, -s * 1.0, s * 0.09, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2a3a4a'; c.beginPath(); c.roundRect(s * 0.03, -s * 1.03, s * 0.08, s * 0.035, s * 0.015); c.fill();
    var hg = c.createLinearGradient(0, -s * 1.13, 0, -s * 1.0); hg.addColorStop(0, '#ffffff'); hg.addColorStop(1, '#d6dde3');
    c.fillStyle = hg; c.beginPath(); c.arc(s * 0.02, -s * 1.04, s * 0.11, Math.PI, 0); c.fill(); c.fillRect(-s * 0.1, -s * 1.05, s * 0.25, s * 0.03);
    c.restore();
  }

  function create(cb) {
    var st = { ph: 'idle', t: 0, bombs: [], sparks: [], puffs: [], rocks: [], flows: [{ d: -1, L: 0, max: 0.8, heat: 0 }, { d: 1, L: 0, max: 0.62, heat: 0 }], sci: null, samples: [], mag: 0, carry: null, puffT: 0, shake: 0, glow: 0 };
    var GEO = null;
    function geo(w, h) {
      var gy = h * 0.6, U = Math.min(w * 0.3, (gy - h * 0.1) / H), vx = Math.max(U * 1.05, w * 0.36);
      var home = Math.min((w - vx) / U - 0.55, 2.0), jar = Math.min((w - vx) / U - 0.22, home + 0.36);
      return { gy: gy, U: U, vx: vx, home: home, jar: jar, D: (h - gy) / U * 0.62 };
    }
    function launch(X, T) { var y0 = -H * 0.95; return { x: (rng() - 0.5) * C, y: y0, vx: X / T, vy: (-y0 - 0.5 * G * T * T) / T }; }
    function erupt() {
      if (st.ph !== 'idle') return false;
      st.ph = 'erupt'; st.t = 0; st.bombs = []; st.mag = 0;
      for (var i = 0; i < 22; i++) { var X = (rng() * 2 - 1) * 1.7, b = launch(X, 1.2 + rng() * 1.1); b.s = 0.025 + rng() * 0.035; b.shape = rockShape(i * 7 + st.samples.length * 31); b.rot = rng() * 6; b.spin = (rng() - 0.5) * 6; b.heat = 1; b.trail = []; b.at = rng() * 1.6; st.bombs.push(b); }
      var g = GEO ? GEO.home : 1.6;
      for (var k = 0; k < 3; k++) { var b2 = launch(Math.min(g - 0.3, 1.2 + k * 0.12), 1.7 + k * 0.15); b2.s = 0.045; b2.shape = rockShape(900 + k + st.samples.length * 5); b2.rot = 0; b2.spin = 3; b2.heat = 1; b2.trail = []; b2.at = 0.3 + k * 0.35; b2.pick = true; st.bombs.push(b2); }
      st.flows.forEach(function (fl) { fl.L = Math.max(0, fl.L * 0.2); fl.heat = 1; });
      return true;
    }
    function update(dt) {
      st.t += dt;
      var er = st.ph === 'erupt';
      st.glow += ((er ? 1.6 : 0.65) - st.glow) * Math.min(1, dt * 3);
      st.shake = er && st.t < 2.4 && !RED ? 1 : 0;
      /* 화산재: 평소엔 옅은 김, 분출 때는 짙은 연기 */
      st.puffT -= dt;
      if (st.puffT <= 0) {
        st.puffT = er && st.t < 2.8 ? 0.05 : 0.4;
        var big = er && st.t < 2.8;
        st.puffs.push({ x: (rng() - 0.5) * C * 1.2, y: -H * 0.98, vx: 0.05 + rng() * 0.08 + (big ? (rng() - 0.5) * 0.4 : 0), vy: -(big ? 1.2 + rng() * 0.9 : 0.18 + rng() * 0.1), r: big ? 0.07 : 0.05, a: big ? 0.85 : 0.35, life: 0, dark: big });
      }
      st.puffs.forEach(function (p) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= Math.pow(0.35, dt); p.vx += 0.06 * dt; p.r += dt * (p.dark ? 0.22 : 0.08); p.a *= Math.pow(p.dark ? 0.72 : 0.6, dt); });
      st.puffs = st.puffs.filter(function (p) { return p.a > 0.02 && p.y > -H - 1.6; });
      /* 불꽃 */
      if (er && st.t < 2.5) for (var i = 0; i < 5; i++) st.sparks.push({ x: (rng() - 0.5) * C, y: -H * 0.95, vx: (rng() - 0.5) * 1.1, vy: -(1.6 + rng() * 2.1), life: 0 });
      st.sparks.forEach(function (p) { p.life += dt; p.vy += G * dt; p.x += p.vx * dt; p.y += p.vy * dt; });
      st.sparks = st.sparks.filter(function (p) { return p.life < 2.5 && p.y < sY(p.x) - 0.005; });
      /* 분출물 */
      st.bombs.forEach(function (b) {
        if (b.landed || st.t < b.at) return;
        b.vy += G * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.spin * dt;
        b.trail.push([b.x, b.y]); if (b.trail.length > 10) b.trail.shift();
        b.heat = Math.max(0.55, b.heat - dt * 0.12);
        if (b.vy > 0 && b.y >= sY(b.x) - b.s * 0.6) { b.y = sY(b.x) - b.s * 0.6; b.landed = true; b.trail = []; st.rocks.push(b); }
      });
      st.bombs = st.bombs.filter(function (b) { return !b.landed; });
      st.rocks.forEach(function (r) { r.heat = Math.max(0, r.heat - dt * (r.pick ? 0.4 : 0.18)); });
      /* 용암 흐름 */
      st.flows.forEach(function (fl) { if (er && st.t < 2.8) fl.L = Math.min(fl.max, fl.L + dt * 0.3); else fl.heat = Math.max(0, fl.heat - dt * 0.06); });
      /* 단계 */
      var s = st.sci;
      if (er && st.t > 4.2 && !st.bombs.length) { st.ph = 'walk'; st.target = st.rocks.filter(function (r) { return r.pick && !r.taken; }).sort(function (a, b) { return b.x - a.x; })[0]; if (!st.target) st.ph = 'idle'; }
      if (st.ph === 'walk') { var tx = st.target.x + 0.09; s.face = -1; s.x -= dt * 0.42; s.walk += dt * 9; if (s.x <= tx) { s.x = tx; st.ph = 'pick'; st.pt = 0; s.walk = 0; } }
      else if (st.ph === 'pick') { st.pt += dt; s.arm = Math.sin(Math.min(1, st.pt / 0.9) * Math.PI * 3) * 0.9; if (st.pt > 0.9) { st.target.taken = true; st.carry = st.target; st.ph = 'back'; s.arm = -0.9; } }
      else if (st.ph === 'back') { s.face = 1; s.x += dt * 0.42; s.walk += dt * 9; if (s.x >= GEO.home) { s.x = GEO.home; s.walk = 0; st.ph = 'toss'; st.pt = 0; } }
      else if (st.ph === 'toss') { st.pt += dt; s.arm = -0.9 + Math.min(1, st.pt / 0.7) * 1.6; if (st.pt > 0.75) { st.samples.push(st.carry); st.rocks = st.rocks.filter(function (r) { return r !== st.carry; }); st.carry = null; st.ph = 'idle'; s.arm = 0; st.mag = 0.001; if (cb) cb(st.samples.length); } }
      if (st.mag > 0 && st.mag < 1) st.mag = Math.min(1, st.mag + dt * 2);
    }
    function draw(c, w, h, t, dt) {
      GEO = geo(w, h); var g = GEO, U = g.U, vx = g.vx, gy = g.gy;
      if (!st.sci) st.sci = { x: g.home, walk: 0, arm: 0, face: 1 };
      if (st.ph === 'idle') st.sci.x = g.home;
      update(Math.max(0, Math.min(0.05, dt || 0.016)));
      var X = function (x) { return vx + x * U; }, Y = function (y) { return gy + y * U; };
      c.save();
      if (st.shake) c.translate((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3);
      /* 하늘과 먼 산 */
      var sky = c.createLinearGradient(0, 0, 0, gy); sky.addColorStop(0, '#7fb6e6'); sky.addColorStop(0.75, '#cfe3f2'); sky.addColorStop(1, '#f2e2cf'); c.fillStyle = sky; c.fillRect(-4, -4, w + 8, gy + 4);
      var sg = c.createRadialGradient(w * 0.12, h * 0.12, 0, w * 0.12, h * 0.12, h * 0.25); sg.addColorStop(0, 'rgba(255,250,225,.9)'); sg.addColorStop(1, 'rgba(255,250,225,0)'); c.fillStyle = sg; c.fillRect(0, 0, w, gy);
      if (st.glow > 0.7) { var og = c.createRadialGradient(X(0), Y(-H), 0, X(0), Y(-H), U * 1.6); og.addColorStop(0, 'rgba(255,120,40,' + (st.glow - 0.7) * 0.35 + ')'); og.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = og; c.fillRect(0, 0, w, gy); }
      [[0.55, '#a9bccd', 7], [0.35, '#8fa3b5', 3]].forEach(function (R) { c.fillStyle = R[1]; c.beginPath(); c.moveTo(-4, gy); for (var x = -4; x <= w + 24; x += 24) c.lineTo(x, gy - h * 0.12 * R[0] - Math.sin(x / (90 + R[2] * 9) + R[2]) * h * 0.04 * R[0] - Math.sin(x / 37 + R[2]) * h * 0.012); c.lineTo(w + 24, gy); c.closePath(); c.fill(); });
      /* 땅속 단면 */
      E.ground(c, 0, gy, w, h - gy + 4, 13);
      /* 땅속에서 올라오는 물질: 아래 덩어리와 통로 */
      var cy = Y(g.D), rx = U * 0.46, ry = U * 0.17, T = RED ? 0 : t / 1000, hot = Math.min(1, st.glow);
      var cg = c.createRadialGradient(X(0), cy, 0, X(0), cy, rx * 1.5); cg.addColorStop(0, 'rgba(255,190,80,' + (0.55 + 0.25 * hot) + ')'); cg.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = cg; c.beginPath(); c.ellipse(X(0), cy, rx * 1.5, ry * 2.2, 0, 0, Math.PI * 2); c.fill();
      var cg2 = c.createRadialGradient(X(-0.08), cy - ry * 0.3, 0, X(0), cy, rx); cg2.addColorStop(0, '#ffe08a'); cg2.addColorStop(0.45, '#ff8a2a'); cg2.addColorStop(1, '#a4300f'); c.fillStyle = cg2;
      c.beginPath(); for (var a = 0; a <= Math.PI * 2 + 0.01; a += 0.2) { var wob = 1 + 0.06 * Math.sin(a * 5 + T * 0.8); c.lineTo(X(0) + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob); } c.closePath(); c.fill();
      c.save(); c.clip(); c.strokeStyle = 'rgba(255,240,170,.35)'; c.lineWidth = U * 0.012; for (var k = 0; k < 6; k++) { c.beginPath(); c.ellipse(X(0) + Math.sin(T * 0.4 + k) * rx * 0.2, cy, rx * (0.25 + k * 0.13), ry * (0.3 + k * 0.12), 0, T * 0.5 + k, T * 0.5 + k + 1.4); c.stroke(); } c.restore();
      /* 통로 (땅속 덩어리 → 분화구) */
      var path = function () { c.beginPath(); c.moveTo(X(0), cy - ry * 0.6); c.bezierCurveTo(X(0.06), Y(g.D * 0.6), X(-0.05), Y(g.D * 0.25), X(0), Y(0)); c.lineTo(X(0), Y(-H * 0.93)); };
      path(); c.strokeStyle = '#3a1a0e'; c.lineWidth = U * 0.085; c.lineCap = 'round'; c.stroke();
      path(); var pg = c.createLinearGradient(0, Y(-H), 0, cy); pg.addColorStop(0, '#ffe9a0'); pg.addColorStop(0.5, '#ff8a2a'); pg.addColorStop(1, '#e0501a'); c.strokeStyle = pg; c.lineWidth = U * 0.055; c.stroke();
      /* 풀밭 */
      c.fillStyle = '#6f9b4a'; c.fillRect(0, gy - 3, X(-1), 6); c.fillRect(X(1), gy - 3, w - X(1), 6);
      /* 화산 몸체: 단면 (겹겹이 쌓인 층) */
      var cone = function (k) { c.beginPath(); c.moveTo(X(-1.02), gy + 1); for (var x = -1; x <= 1.0001; x += 0.02) c.lineTo(X(x), Y(sY(x) * k)); c.lineTo(X(1.02), gy + 1); c.closePath(); };
      var COLS = ['#5d4a3e', '#7b6556', '#6a5547', '#8a7362', '#5a4639', '#776050', '#665143', '#836c5a'];
      for (var j = 0; j < 8; j++) { cone(1 - j * 0.115); c.fillStyle = COLS[j]; c.fill(); }
      c.save(); cone(1); c.clip();
      var rr = E.rng(77); for (var q = 0; q < 260; q++) { var px = (rr() * 2 - 1), py = sY(px) * rr(); c.fillStyle = 'rgba(' + (rr() < 0.5 ? '255,240,220' : '20,10,5') + ',' + (0.06 + rr() * 0.1) + ')'; c.beginPath(); c.arc(X(px), Y(py), 0.6 + rr() * 1.8, 0, Math.PI * 2); c.fill(); }
      var sh = c.createLinearGradient(X(-1), 0, X(1), 0); sh.addColorStop(0, 'rgba(255,240,220,.12)'); sh.addColorStop(0.55, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.22)'); c.fillStyle = sh; c.fillRect(X(-1), Y(-H), U * 2, H * U);
      c.restore();
      c.strokeStyle = 'rgba(255,236,210,.35)'; c.lineWidth = 5; c.beginPath(); for (var x3 = -1; x3 <= -C; x3 += 0.02) { if (x3 === -1) c.moveTo(X(x3), Y(sY(x3)) + 3); else c.lineTo(X(x3), Y(sY(x3)) + 3); } c.stroke();
      c.strokeStyle = '#3d2f26'; c.lineWidth = 2.5; c.beginPath(); for (var x2 = -1; x2 <= 1.0001; x2 += 0.02) { if (x2 === -1) c.moveTo(X(x2), Y(sY(x2))); else c.lineTo(X(x2), Y(sY(x2))); } c.stroke();
      /* 화산 안 통로 */
      c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(0), Y(-H * 0.93)); c.strokeStyle = '#3a1a0e'; c.lineWidth = U * 0.085; c.stroke(); c.strokeStyle = pg; c.lineWidth = U * 0.055; c.stroke();
      /* 통로 속 올라가는 빛 덩이 */
      c.save(); c.globalCompositeOperation = 'lighter';
      for (var b = 0; b < 9; b++) { var u = ((T * (st.ph === 'erupt' ? 0.9 : 0.18) + b / 9) % 1), yy = Y(g.D * (1 - u) * 0.92 - H * 0.93 * u), xx = X(Math.sin(u * 7 + b) * 0.01); var bg = c.createRadialGradient(xx, yy, 0, xx, yy, U * 0.05); bg.addColorStop(0, 'rgba(255,250,210,.9)'); bg.addColorStop(1, 'rgba(255,170,60,0)'); c.fillStyle = bg; c.beginPath(); c.arc(xx, yy, U * 0.05, 0, Math.PI * 2); c.fill(); }
      c.restore();
      /* 용암 흐름: 경사면 위에 놓인 혀 모양 (앞쪽이 불룩, 식으면 겉이 굳고 틈새만 빛나요) */
      st.flows.forEach(function (fl, fi) {
        if (fl.L < 0.01) return;
        var x0 = C * 0.55, n = Math.max(2, Math.round(fl.L / 0.008)), top = [], bot = [];
        for (var i = 0; i <= n; i++) {
          var u = i / n, x = fl.d * (x0 + fl.L * u), ys = sY(x), dx = 0.004 * fl.d, ny = (sY(x + dx) - ys) / 0.004;   /* 경사 */
          var front = u > 0.86 ? Math.sin((1 - u) / 0.14 * Math.PI / 2) : 1;
          var th = (0.034 + 0.03 * u + 0.022 * Math.max(0, u - 0.7) / 0.3) * front * (1 + 0.18 * Math.sin(u * 23 + fi * 3 + T * 0.6 * fl.heat));
          var nx = -ny * fl.d, nl = Math.hypot(nx, 1);   /* 경사면에 수직인 방향 */
          top.push([X(x + (nx / nl) * th * 0), Y(ys - th / nl)]); bot.push([X(x), Y(ys + 0.004)]);
        }
        var shape = function () { c.beginPath(); top.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); var e = top[top.length - 1], eb = bot[bot.length - 1]; c.quadraticCurveTo(e[0] + fl.d * U * 0.03, (e[1] + eb[1]) / 2, eb[0], eb[1]); for (var j = bot.length - 1; j >= 0; j--) c.lineTo(bot[j][0], bot[j][1]); c.closePath(); };
        var A = top[0], B = top[top.length - 1];
        /* 바깥 빛 */
        if (fl.heat > 0.05) { c.save(); c.shadowColor = 'rgba(255,110,30,' + fl.heat + ')'; c.shadowBlur = U * 0.1 * fl.heat; shape(); c.fillStyle = heatCol(fl.heat * 0.7); c.fill(); c.restore(); }
        /* 녹은 부분: 분화구 쪽이 더 뜨거움 */
        var lg = c.createLinearGradient(A[0], A[1], B[0], B[1]);
        lg.addColorStop(0, heatCol(fl.heat)); lg.addColorStop(0.6, heatCol(fl.heat * 0.85)); lg.addColorStop(1, heatCol(fl.heat * 0.7));
        shape(); c.fillStyle = lg; c.fill();
        /* 굳은 겉: 식을수록 넓어지는 어두운 판, 틈새는 빛나요 */
        c.save(); shape(); c.clip();
        var crust = Math.min(1, 1.15 - fl.heat), rr2 = E.rng(50 + fi);
        for (var k = 0; k < n * 0.9; k++) {
          var i2 = Math.floor(rr2() * n), p = top[i2], q = bot[i2], m = rr2();
          if (rr2() > crust) continue;
          var cx = p[0] + (q[0] - p[0]) * m, cy2 = p[1] + (q[1] - p[1]) * m, s2 = U * (0.012 + rr2() * 0.016);
          c.fillStyle = 'rgba(46,38,34,' + (0.55 + crust * 0.45) + ')'; c.beginPath(); c.ellipse(cx, cy2, s2 * 1.4, s2, rr2() * 3, 0, Math.PI * 2); c.fill();
        }
        if (fl.heat > 0.08) { c.globalCompositeOperation = 'lighter'; c.setLineDash([U * 0.02, U * 0.05]); c.lineDashOffset = -T * U * 0.15 * fl.d; c.beginPath(); top.forEach(function (p2, i) { var mm = bot[i]; var yy2 = (p2[1] * 0.4 + mm[1] * 0.6); if (i) c.lineTo(p2[0], yy2); else c.moveTo(p2[0], yy2); }); c.strokeStyle = 'rgba(255,230,140,' + 0.6 * fl.heat + ')'; c.lineWidth = Math.max(1, U * 0.006); c.stroke(); }
        c.restore();
        shape(); c.strokeStyle = 'rgba(40,24,16,' + (0.3 + 0.5 * (1 - fl.heat)) + ')'; c.lineWidth = 1.2; c.stroke();
        /* 흐르는 앞쪽의 빛 */
        if (fl.heat > 0.4 && fl.L < fl.max) { var fg = c.createRadialGradient(B[0], B[1], 0, B[0], B[1], U * 0.08); fg.addColorStop(0, 'rgba(255,235,150,.9)'); fg.addColorStop(1, 'rgba(255,100,30,0)'); c.fillStyle = fg; c.beginPath(); c.arc(B[0], B[1], U * 0.08, 0, Math.PI * 2); c.fill(); }
      });
      /* 분화구 빛 */
      var kg = c.createRadialGradient(X(0), Y(-H), 0, X(0), Y(-H), U * 0.22 * st.glow); kg.addColorStop(0, 'rgba(255,245,190,.95)'); kg.addColorStop(0.35, 'rgba(255,140,40,.55)'); kg.addColorStop(1, 'rgba(255,90,20,0)');
      c.fillStyle = kg; c.beginPath(); c.arc(X(0), Y(-H), U * 0.22 * st.glow * (1 + 0.05 * Math.sin(T * 3)), 0, Math.PI * 2); c.fill();
      /* 떨어진 분출물 */
      st.rocks.forEach(function (r) { if (r !== st.carry) drawRock(c, X(r.x), Y(r.y), r.s * U, r.shape, r.heat, r.rot); });
      /* 날아가는 분출물과 꼬리 */
      st.bombs.forEach(function (b) {
        if (st.t < b.at) return;
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        for (var i = 1; i < b.trail.length; i++) { c.strokeStyle = 'rgba(255,150,50,' + (i / b.trail.length) * 0.5 + ')'; c.lineWidth = b.s * U * (i / b.trail.length); c.beginPath(); c.moveTo(X(b.trail[i - 1][0]), Y(b.trail[i - 1][1])); c.lineTo(X(b.trail[i][0]), Y(b.trail[i][1])); c.stroke(); }
        c.restore();
        drawRock(c, X(b.x), Y(b.y), b.s * U, b.shape, b.heat, b.rot);
      });
      /* 불꽃 */
      c.save(); c.globalCompositeOperation = 'lighter';
      st.sparks.forEach(function (p) { var k = Math.max(0, 1 - p.life / 1.6); c.fillStyle = heatCol(0.5 + k * 0.5, 0.9 * k + 0.1); c.beginPath(); c.arc(X(p.x), Y(p.y), U * 0.011 * (0.6 + k), 0, Math.PI * 2); c.fill(); });
      c.restore();
      /* 화산재·김 */
      st.puffs.forEach(function (p) {
        var x = X(p.x), y = Y(p.y), r = p.r * U, near = Math.max(0, 1 - p.life / 1.2) * Math.min(1, st.glow);
        var pg2 = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
        if (p.dark) { pg2.addColorStop(0, 'rgba(120,112,106,' + p.a + ')'); pg2.addColorStop(0.6, 'rgba(78,72,68,' + p.a * 0.8 + ')'); pg2.addColorStop(1, 'rgba(60,55,52,0)'); }
        else { pg2.addColorStop(0, 'rgba(235,235,235,' + p.a + ')'); pg2.addColorStop(1, 'rgba(220,220,220,0)'); }
        c.fillStyle = pg2; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
        if (p.dark && near > 0.05) { c.fillStyle = 'rgba(255,120,40,' + near * 0.3 * p.a + ')'; c.beginPath(); c.arc(x, y + r * 0.3, r * 0.7, 0, Math.PI * 2); c.fill(); }
      });
      /* 조사원과 시료 병 */
      var s = st.sci, ps = U * 0.26;
      person(c, X(s.x), gy, ps, { walk: s.walk, face: s.face, arm: s.arm });
      if (st.carry) { var hx = X(s.x) + s.face * ps * 0.14, hy = gy - ps * 0.5; drawRock(c, hx, hy, st.carry.s * U, st.carry.shape, 0, 0); }
      var jx = X(g.jar), jw = U * 0.17, jh = jw * 1.35, jy = gy;
      if (st.ph === 'toss' && st.carry) { var u2 = Math.min(1, st.pt / 0.75), ax = X(s.x) + ps * 0.14, ay = gy - ps * 0.5, bx = jx, by = jy - jh * 0.3, mx = (ax + bx) / 2, my = Math.min(ay, by) - ps * 0.8; var px2 = (1 - u2) * (1 - u2) * ax + 2 * (1 - u2) * u2 * mx + u2 * u2 * bx, py2 = (1 - u2) * (1 - u2) * ay + 2 * (1 - u2) * u2 * my + u2 * u2 * by; drawRock(c, px2, py2, st.carry.s * U, st.carry.shape, 0, u2 * 4); }
      c.save();
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(jx, jy, jw * 0.6, jw * 0.12, 0, 0, Math.PI * 2); c.fill();
      var gl = c.createLinearGradient(jx - jw / 2, 0, jx + jw / 2, 0); gl.addColorStop(0, 'rgba(210,230,245,.55)'); gl.addColorStop(0.3, 'rgba(255,255,255,.75)'); gl.addColorStop(1, 'rgba(180,205,225,.5)');
      c.fillStyle = gl; c.strokeStyle = '#7f98ad'; c.lineWidth = 2; c.beginPath(); c.roundRect(jx - jw / 2, jy - jh, jw, jh, jw * 0.16); c.fill(); c.stroke();
      st.samples.forEach(function (r, i) { var cx = jx + ((i % 3) - 1) * jw * 0.24, cy2 = jy - jw * 0.14 - Math.floor(i / 3) * jw * 0.22; drawRock(c, cx, cy2, Math.min(r.s * U, jw * 0.15), r.shape, 0, i); });
      c.fillStyle = '#4a5866'; c.beginPath(); c.roundRect(jx - jw * 0.56, jy - jh - jw * 0.14, jw * 1.12, jw * 0.18, jw * 0.05); c.fill();
      c.fillStyle = '#fff'; c.fillRect(jx - jw * 0.32, jy - jh * 0.62, jw * 0.64, jh * 0.2); c.fillStyle = '#4a5866'; c.font = '800 ' + Math.max(9, jw * 0.16) + 'px Pretendard, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('시료', jx, jy - jh * 0.52);
      c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(jx - jw * 0.38, jy - jh * 0.92, jw * 0.06, jh * 0.7);
      c.restore();
      c.restore();
      return { X: X, Y: Y, U: U, gy: gy, jx: jx, jy: jy - jh, cy: cy, st: st };
    }
    /* 확대 분석 그림 */
    var magCv = null;
    function magnifier(c, x, y, R, seed) {
      if (!magCv || magCv._s !== seed) {
        magCv = E.off(256, 256); magCv._s = seed; var g = magCv.getContext('2d'), r = E.rng(seed + 5);
        var bg = g.createRadialGradient(100, 90, 10, 128, 128, 140); bg.addColorStop(0, '#6e6660'); bg.addColorStop(1, '#2c2724'); g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
        for (var i = 0; i < 900; i++) { g.fillStyle = 'rgba(' + (r() < 0.5 ? '230,225,215' : '15,12,10') + ',' + (0.1 + r() * 0.25) + ')'; g.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1 + r() * 3); }
        for (var j = 0; j < 30; j++) { var px = r() * 256, py = r() * 256, s = 4 + r() * 12, col = ['#e8e4dc', '#1c1a18', '#5e7a4a', '#c9b48a'][Math.floor(r() * 4)]; g.save(); g.translate(px, py); g.rotate(r() * 3); g.fillStyle = col; g.beginPath(); g.moveTo(-s, 0); g.lineTo(-s * 0.3, -s * 0.6); g.lineTo(s * 0.8, -s * 0.3); g.lineTo(s, s * 0.3); g.lineTo(0, s * 0.6); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-s * 0.3, -s * 0.4, s * 0.4, s * 0.15); g.restore(); }
        for (var k = 0; k < 14; k++) { g.fillStyle = 'rgba(10,8,6,.55)'; g.beginPath(); g.arc(r() * 256, r() * 256, 2 + r() * 6, 0, Math.PI * 2); g.fill(); }
      }
      c.save();
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.arc(x + 4, y + 6, R + 6, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.save(); c.clip(); c.drawImage(magCv, x - R, y - R, R * 2, R * 2);
      var sh = c.createRadialGradient(x - R * 0.4, y - R * 0.4, 0, x, y, R); sh.addColorStop(0, 'rgba(255,255,255,.25)'); sh.addColorStop(0.6, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.35)'); c.fillStyle = sh; c.fillRect(x - R, y - R, R * 2, R * 2); c.restore();
      c.lineWidth = R * 0.12; c.strokeStyle = '#2f3a46'; c.stroke(); c.lineWidth = R * 0.04; c.strokeStyle = '#8a9aab'; c.stroke();
      c.restore();
    }
    return { draw: draw, erupt: erupt, magnifier: magnifier, busy: function () { return st.ph !== 'idle'; }, st: st };
  }
  return { create: create, person: person, drawRock: drawRock };
})();
