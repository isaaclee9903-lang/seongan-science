/* ===== 화성암: 마그마가 식는 곳과 광물 입자가 자라는 모습 (2D) =====
   왼쪽(세로 화면은 위): 화산과 땅속을 자른 단면. 마그마가 지표로 분출해 흘러내리며 빠르게 식거나, 지하 깊은 곳에서 천천히 식어요.
   오른쪽(세로 화면은 아래): 확대 창. 녹은 마그마 속에서 광물 입자가 생기고 자라요.
     - 빠르게 식으면: 입자가 짧은 시간에 아주 많이 생기고 조금밖에 못 자라요 → 입자가 매우 작아요.
     - 천천히 식으면: 입자가 조금씩 생기고 오래 자라요 → 입자가 커요.
   식는 시간, 온도, 입자 수는 개념 이해를 위한 모형이에요. 숫자로 나타내지 않아요. */
window.IGN2D = (function () {
  'use strict';
  var G = 190; // 확대 창 격자 크기
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mixc(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  function rgb(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? 1 : a) + ')'; }
  function heat(k) { // 1 뜨거움 → 0 식음
    var S = [[0, [70, 60, 56]], [0.25, [128, 42, 24]], [0.5, [214, 74, 26]], [0.75, [255, 152, 42]], [1, [255, 236, 160]]];
    for (var i = 1; i < S.length; i++) if (k <= S[i][0]) { var p = S[i - 1], q = S[i]; return mixc(p[1], q[1], (k - p[0]) / (q[0] - p[0])); }
    return S[4][1];
  }
  /* 광물 색: 밝은색 마그마(석영·장석 많음) / 어두운색 마그마(감람석·휘석 많음) */
  var MIN = {
    light: [{ p: 0.55, c: [[236, 230, 220], [244, 238, 228], [232, 212, 198], [226, 222, 214]], lath: 1.7 }, { p: 0.33, c: [[150, 152, 156], [170, 172, 176], [136, 138, 142]], lath: 1.15 }, { p: 0.12, c: [[34, 30, 28], [48, 42, 38]], lath: 1.5 }],
    dark: [{ p: 0.6, c: [[32, 38, 30], [44, 50, 40], [26, 30, 26], [58, 62, 50]], lath: 1.2 }, { p: 0.4, c: [[118, 122, 120], [140, 142, 140], [104, 108, 108]], lath: 1.9 }],
  };
  function create() {
    var st = { mode: null, kind: 'light', where: 'surface', ph: 'idle', t: 0, T: 1, dur: 1, grains: [], owner: new Int16Array(G * G).fill(-1), filled: 0, done: false, bombs: [], puffs: [], flow: 0, glow: 0, seed: 1 };
    var img = null, cvs = document.createElement('canvas'); cvs.width = cvs.height = G; var cx2 = cvs.getContext('2d');
    var noise = new Float32Array(G * G); (function () { var R = rng(5); for (var i = 0; i < G * G; i++) noise[i] = R(); })();
    var inCircle = new Uint8Array(G * G); (function () { var c = (G - 1) / 2; for (var y = 0; y < G; y++) for (var x = 0; x < G; x++) inCircle[y * G + x] = (x - c) * (x - c) + (y - c) * (y - c) <= c * c ? 1 : 0; })();
    var total = 0; for (var i = 0; i < G * G; i++) total += inCircle[i];
    var R = rng(9);
    function reset(kind, where) {
      st.kind = kind || st.kind; st.where = where || st.where; st.ph = 'idle'; st.t = 0; st.T = 1; st.grains = []; st.owner.fill(-1); st.filled = 0; st.done = false; st.bombs = []; st.puffs = []; st.flow = 0; st.glow = 0; R = rng(++st.seed * 7 + 3);
    }
    function start() {
      reset();
      st.ph = 'run'; st.dur = st.where === 'surface' ? 5.5 : 13; st.t = 0;
    }
    function pickMineral() {
      var L = MIN[st.kind], u = R(), acc = 0;
      for (var i = 0; i < L.length; i++) { acc += L[i].p; if (u <= acc) return L[i]; }
      return L[L.length - 1];
    }
    function nucleate(n) {
      for (var k = 0; k < n; k++) {
        for (var tries = 0; tries < 6; tries++) {
          var x = (R() * G) | 0, y = (R() * G) | 0, id = y * G + x;
          if (!inCircle[id] || st.owner[id] >= 0) continue;
          var m = pickMineral(), col = m.c[(R() * m.c.length) | 0], a = R() * Math.PI;
          st.grains.push({ x: x, y: y, r: 0.6, a: a, ca: Math.cos(a), sa: Math.sin(a), ax: m.lath, col: col, ph: R() * 6.28, grow: 0.75 + R() * 0.5 });
          st.owner[id] = st.grains.length - 1; st.filled++;
          break;
        }
      }
    }
    var acc = 0, gacc = 0;
    function growStep(dt) {
      var fast = st.where === 'surface';
      var gs = (fast ? 1.6 : 4.6) * dt;               // 자라는 빠르기 (격자 칸/초)
      st.grains.forEach(function (g, gi) {
        if (g.full) return;
        var r0 = g.r; g.r += gs * g.grow * (0.4 + 0.6 * st.T);
        var ext = Math.ceil(g.r * g.ax) + 1, x0 = Math.max(0, g.x - ext), x1 = Math.min(G - 1, g.x + ext), y0 = Math.max(0, g.y - ext), y1 = Math.min(G - 1, g.y + ext), any = false;
        for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
          var id = y * G + x; if (st.owner[id] >= 0 || !inCircle[id]) continue;
          var dx = x - g.x, dy = y - g.y, u = (dx * g.ca + dy * g.sa) / g.ax, v = -dx * g.sa + dy * g.ca;
          var d = Math.pow(Math.pow(Math.abs(u), 3) + Math.pow(Math.abs(v), 3), 1 / 3); // 모서리가 둥근 네모(결정 모양)
          if (d <= g.r) { st.owner[id] = gi; st.filled++; any = true; }
          else if (d <= g.r + 1.5) any = true;
        }
        if (!any && g.r > 3) g.full = true;
      });
    }
    function step(dt) {
      if (st.ph !== 'run') return;
      st.t += dt; var k = Math.min(1, st.t / st.dur);
      var fast = st.where === 'surface';
      // 식는 정도: 지표는 빨리, 지하는 천천히
      st.T = fast ? Math.max(0, 1 - Math.pow(k, 0.8) * 1.05) : Math.max(0, 1 - k);
      // 입자가 생기는 빠르기 (빠르게 식으면 많이, 천천히 식으면 조금)
      var rate = fast ? (k < 0.08 ? 0 : 520 * Math.min(1, (k - 0.08) * 4)) : (k < 0.04 ? 0 : 7);
      acc += rate * dt; var n = acc | 0; acc -= n; if (n) nucleate(n);
      gacc += dt; if (gacc > 0.045 || k >= 1) { growStep(gacc); gacc = 0; }
      if (fast) { st.flow = Math.min(1, st.t / 2.6); }
      st.glow = st.T;
      // 분출물·화산재 (지표)
      if (fast && st.t < st.dur * 0.75) {
        if (R() < 0.5) st.bombs.push({ x: 0, y: 0, vx: (R() - 0.5) * 1.3, vy: -(1.1 + R() * 0.9), life: 0, s: 0.006 + R() * 0.01 });
        if (R() < 0.25) st.puffs.push({ x: (R() - 0.5) * 0.02, y: 0, r: 0.02 + R() * 0.02, life: 0, vx: 0.03 + R() * 0.03 });
      }
      st.bombs.forEach(function (b) { b.vy += 2.6 * dt; b.x += b.vx * dt * 0.35; b.y += b.vy * dt * 0.35; b.life += dt; });
      st.bombs = st.bombs.filter(function (b) { return b.life < 1.3; });
      st.puffs.forEach(function (p) { p.y -= dt * 0.09; p.x += p.vx * dt; p.r += dt * 0.035; p.life += dt * 0.3; });
      st.puffs = st.puffs.filter(function (p) { return p.life < 1; });
      if (k >= 1) { // 남은 마그마는 가장 가까운 입자로 굳어요
        if (st.filled < total) fillRest();
        st.ph = 'done'; st.done = true; st.T = 0;
      }
    }
    function fillRest() {
      var own = st.owner, q = [];
      for (var i = 0; i < G * G; i++) if (own[i] >= 0 && inCircle[i]) q.push(i);
      for (var h = 0; h < q.length; h++) { var i0 = q[h], x = i0 % G, y = (i0 / G) | 0, nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (var j = 0; j < 4; j++) { var xx = x + nb[j][0], yy = y + nb[j][1]; if (xx < 0 || yy < 0 || xx >= G || yy >= G) continue; var id = yy * G + xx; if (own[id] < 0 && inCircle[id]) { own[id] = own[i0]; q.push(id); } } }
      st.filled = total;
    }
    /* 확대 창 그림 (격자 → 이미지) */
    var tick = 0;
    function paintMag(time) {
      if (!img) img = cx2.createImageData(G, G);
      var d = img.data, own = st.owner, gr = st.grains, melt = heat(0.35 + 0.65 * st.T), fl = time * 0.6;
      for (var y = 0; y < G; y++) for (var x = 0; x < G; x++) {
        var id = y * G + x, o = id * 4;
        if (!inCircle[id]) { d[o + 3] = 0; continue; }
        var w = own[id], c;
        if (w < 0) { // 녹은 마그마: 뜨거울수록 밝게, 일렁이는 무늬
          var n = noise[(id + ((fl * 37) | 0) * 3) % (G * G)] * 0.5 + noise[(id * 7 + ((fl * 23) | 0)) % (G * G)] * 0.5;
          var k = 0.82 + 0.3 * n; c = [melt[0] * k, melt[1] * k, melt[2] * k];
        } else {
          var g = gr[w], dx = x - g.x, dy = y - g.y, ang = Math.atan2(dy, dx), sh = 0.9 + 0.08 * Math.cos(ang * 2 + g.ph) + 0.05 * Math.sin((dx * g.ca + dy * g.sa) * 1.7 + g.ph) * (g.r > 6 ? 1 : 0) + (noise[id] - 0.5) * 0.08;
          var edge = (x + 1 < G && own[id + 1] !== w) || (y + 1 < G && own[id + G] !== w) || (x > 0 && own[id - 1] !== w) || (y > 0 && own[id - G] !== w);
          c = [g.col[0] * sh, g.col[1] * sh, g.col[2] * sh];
          if (edge) c = [c[0] * 0.55, c[1] * 0.55, c[2] * 0.55];
          if (st.T > 0.02) { var hh = heat(0.35 + 0.65 * st.T); var a = Math.min(0.55, st.T * 0.6); c = [lerp(c[0], hh[0], a), lerp(c[1], hh[1], a), lerp(c[2], hh[2], a)]; }
        }
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      }
      cx2.putImageData(img, 0, 0);
    }

    /* ---------- 단면 그림 ---------- */
    var strata = null;
    function section(c, x, y, w, h, time) {
      var gy = y + h * 0.36, vx = x + w * 0.56, vh = h * 0.2, vw = w * 0.34, crY = gy - vh, crW = w * 0.035;
      var chY = y + h * 0.83, chRX = w * 0.2, chRY = h * 0.085;
      // 하늘
      var sky = c.createLinearGradient(0, y, 0, gy); sky.addColorStop(0, '#bfdff2'); sky.addColorStop(1, '#eaf5fb'); c.fillStyle = sky; c.fillRect(x, y, w, gy - y + 2);
      // 먼 산
      c.fillStyle = '#b9d2c4'; c.beginPath(); c.moveTo(x, gy); for (var i = 0; i <= 20; i++) { var px = x + (i / 20) * w; c.lineTo(px, gy - h * 0.05 - Math.sin(i * 0.9) * h * 0.02 - Math.sin(i * 2.3) * h * 0.01); } c.lineTo(x + w, gy); c.fill();
      // 땅속 지층
      if (!strata || strata.w !== w || strata.h !== h) { var Rr = rng(4), L = []; for (var j = 0; j < 9; j++) L.push({ k: j / 9, a: Rr() * 6, f: 0.004 + Rr() * 0.01, amp: 4 + Rr() * 6, col: ['#8a5a36', '#9b6a42', '#7a4e2e', '#a8774c', '#6e4428'][j % 5] }); strata = { w: w, h: h, L: L }; }
      var gg = c.createLinearGradient(0, gy, 0, y + h); gg.addColorStop(0, '#9b6a42'); gg.addColorStop(1, '#5a3620'); c.fillStyle = gg; c.fillRect(x, gy, w, y + h - gy);
      strata.L.forEach(function (Ls, j) { var yy = gy + (y + h - gy) * Ls.k; c.strokeStyle = 'rgba(60,30,12,.28)'; c.lineWidth = 2; c.beginPath(); for (var px = 0; px <= w; px += 10) { var py = yy + Math.sin(px * Ls.f + Ls.a) * Ls.amp; if (!px) c.moveTo(x + px, py); else c.lineTo(x + px, py); } c.stroke(); });
      // 풀 덮인 지표
      c.fillStyle = '#7fae55'; c.fillRect(x, gy - 5, w, 8); c.fillStyle = '#5f8f3c'; c.fillRect(x, gy + 2, w, 3);
      // 마그마 방
      var glow = st.where === 'deep' && st.ph !== 'idle' ? st.T : 1;
      var cg = c.createRadialGradient(vx, chY, 4, vx, chY, chRX * 1.3);
      var hc = heat(0.55 + 0.45 * glow), ec = heat(0.3 + 0.5 * glow);
      cg.addColorStop(0, rgb(heat(0.85 + 0.15 * glow))); cg.addColorStop(0.55, rgb(hc)); cg.addColorStop(1, rgb(ec, 0.0));
      c.save(); c.shadowColor = rgb(hc, 0.8 * glow + 0.1); c.shadowBlur = 30 * glow + 6;
      c.fillStyle = cg; c.beginPath(); c.ellipse(vx, chY, chRX, chRY, 0, 0, 6.283); c.fill(); c.restore();
      c.fillStyle = rgb(ec, 0.9); c.beginPath(); c.ellipse(vx, chY, chRX, chRY, 0, 0, 6.283); c.globalAlpha = 0.35; c.fill(); c.globalAlpha = 1;
      // 지하에서 식을 때: 마그마 방 가장자리가 식어 굳는 모습
      if (st.where === 'deep' && st.ph !== 'idle') {
        var k = 1 - st.T; c.save(); c.beginPath(); c.ellipse(vx, chY, chRX, chRY, 0, 0, 6.283); c.clip();
        c.strokeStyle = 'rgba(80,70,64,' + (0.85 * k) + ')'; c.lineWidth = chRY * 1.6 * k; c.beginPath(); c.ellipse(vx, chY, chRX, chRY, 0, 0, 6.283); c.stroke(); c.restore();
      }
      // 화산 (단면: 층이 보이는 원뿔)
      var cone = function () { c.beginPath(); c.moveTo(vx - vw, gy); c.quadraticCurveTo(vx - vw * 0.35, gy - vh * 0.55, vx - crW, crY); c.lineTo(vx + crW, crY); c.quadraticCurveTo(vx + vw * 0.35, gy - vh * 0.55, vx + vw, gy); c.closePath(); };
      cone(); var vg = c.createLinearGradient(vx - vw, 0, vx + vw, 0); vg.addColorStop(0, '#6f9a48'); vg.addColorStop(0.5, '#8fb862'); vg.addColorStop(1, '#5d8a3c'); c.fillStyle = vg; c.fill();
      c.save(); cone(); c.clip(); c.strokeStyle = 'rgba(160,120,70,.45)'; c.lineWidth = 3; for (var s = 1; s < 7; s++) { c.beginPath(); c.moveTo(vx - vw * (s / 7), gy); c.lineTo(vx - crW * 0.5, crY + 6); c.lineTo(vx + vw * (s / 7), gy); c.stroke(); } c.restore();
      // 통로
      var flowOn = st.where === 'surface' && st.ph !== 'idle', pipe = flowOn ? Math.max(0.15, st.T) : 0.12;
      c.beginPath(); c.moveTo(vx, chY - chRY * 0.6); c.bezierCurveTo(vx - w * 0.02, (chY + gy) / 2, vx + w * 0.015, gy, vx, crY + 2);
      c.strokeStyle = 'rgba(60,24,10,.85)'; c.lineWidth = crW * 1.15; c.stroke();
      c.strokeStyle = rgb(heat(0.3 + 0.7 * pipe)); c.lineWidth = crW * 0.7; c.stroke();
      if (flowOn) { c.save(); c.shadowColor = 'rgba(255,140,40,.9)'; c.shadowBlur = 18 * st.T; c.stroke(); c.restore(); }
      // 용암 흐름 (오른쪽 경사면을 따라)
      var lavaPt = function (u) { u *= 0.92; var a = 1 - u, P0x = vx + crW, P0y = crY, Cx = vx + vw * 0.35, Cy = gy - vh * 0.55, P2x = vx + vw, P2y = gy; return [a * a * P0x + 2 * a * u * Cx + u * u * P2x, a * a * P0y + 2 * a * u * Cy + u * u * P2y - 3]; };
      if (flowOn || (st.where === 'surface' && st.done)) {
        var n = 48, len = st.flow, th = function (u) { return crW * (0.28 + 0.42 * u + 0.1 * Math.sin(u * 19 + 1)); };
        for (var i2 = 0; i2 < n; i2++) {
          var u0 = i2 / n, u1 = Math.min((i2 + 1) / n, len); if (u0 > len) break;
          var age = Math.max(0, st.t - 2.6 * u0), cool = Math.max(0, 1 - age / (st.dur * 0.75)) * (st.done ? 0 : 1);
          var a0 = lavaPt(u0), a1 = lavaPt(u1), t0 = th(u0), t1 = th(u1);
          // 경사면 위에 얹힌 용암 띠 (아래는 지표에 붙고 위는 볼록)
          c.beginPath(); c.moveTo(a0[0], a0[1] + 2); c.lineTo(a1[0], a1[1] + 2); c.lineTo(a1[0], a1[1] - t1); c.lineTo(a0[0], a0[1] - t0); c.closePath();
          var lg = c.createLinearGradient(0, a0[1] - t0, 0, a0[1] + 2); lg.addColorStop(0, rgb(heat(Math.min(1, 0.25 + 0.85 * cool)))); lg.addColorStop(1, rgb(heat(0.1 + 0.6 * cool)));
          c.fillStyle = lg; if (cool > 0.3) { c.save(); c.shadowColor = 'rgba(255,120,30,.8)'; c.shadowBlur = 14 * cool; } c.fill(); if (cool > 0.3) c.restore();
          // 식으며 생기는 겉껍질과 그 틈의 붉은빛
          if (cool < 0.75 && i2 % 2 === 0) { c.strokeStyle = 'rgba(30,24,22,' + (0.6 * (1 - cool)) + ')'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(a0[0], a0[1] - t0 * 0.9); c.lineTo(a1[0], a1[1] - t1 * 0.4); c.stroke(); }
          if (cool > 0.05 && cool < 0.6 && i2 % 3 === 1) { c.strokeStyle = rgb(heat(0.7), cool * 1.4); c.lineWidth = 1.2; c.beginPath(); c.moveTo((a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2 - t0 * 0.7); c.lineTo((a0[0] + a1[0]) / 2 + 3, (a0[1] + a1[1]) / 2 - t0 * 0.2); c.stroke(); }
          if (u1 >= len - 1e-6) { c.fillStyle = rgb(heat(Math.min(1, 0.2 + 0.85 * cool))); c.beginPath(); c.ellipse(a1[0], a1[1] - t1 * 0.45, t1 * 0.75, t1 * 0.6, 0.5, 0, 6.283); c.fill(); break; }
        }
      }
      // 분출물과 화산재
      st.bombs.forEach(function (b) { var bx = vx + b.x * w, by = crY + b.y * h; if (by > crY + vh) return; var k3 = Math.max(0, 1 - b.life / 1.1); c.fillStyle = rgb(heat(0.2 + 0.8 * k3)); c.beginPath(); c.arc(bx, by, Math.max(1.5, b.s * w), 0, 6.283); c.fill(); });
      st.puffs.forEach(function (p) { var px = vx + p.x * w, py = crY - 8 + p.y * h, pr = p.r * w; var pg = c.createRadialGradient(px, py, 0, px, py, pr); pg.addColorStop(0, 'rgba(110,108,106,' + (0.55 * (1 - p.life)) + ')'); pg.addColorStop(1, 'rgba(110,108,106,0)'); c.fillStyle = pg; c.beginPath(); c.arc(px, py, pr, 0, 6.283); c.fill(); });
      // 표시 위치
      var spot = st.where === 'surface' ? lavaPt(0.55) : [vx - chRX * 0.75, chY - chRY * 0.35];
      var tag = function (txt, px, py, on, col) { c.font = '800 ' + Math.max(13, Math.round(w * 0.024)) + 'px Pretendard, sans-serif'; var tw = c.measureText(txt).width + 16, th = Math.max(24, w * 0.04); c.fillStyle = on ? col : 'rgba(255,255,255,.85)'; c.beginPath(); c.roundRect(px - tw / 2, py - th / 2, tw, th, 8); c.fill(); c.fillStyle = on ? '#fff' : '#3b4a52'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, px, py + 1); };
      tag('마그마', vx + chRX * 0.55, chY + chRY * 0.15, false);
      tag('지표', x + w * 0.13, gy - h * 0.035, st.where === 'surface', '#d0602a');
      tag('지하 깊은 곳', x + w * 0.16, chY - chRY * 0.2, st.where === 'deep', '#3f86b5');
      c.save(); c.setLineDash([6, 5]); c.lineWidth = 3; c.strokeStyle = st.where === 'surface' ? '#d0602a' : '#3f86b5'; c.beginPath(); c.arc(spot[0], spot[1], Math.max(14, w * 0.035), 0, 6.283); c.stroke(); c.restore();
      return { spot: spot };
    }

    /* 전체 그리기 */
    function draw(c, W, H, time) {
      c.clearRect(0, 0, W, H);
      var land = W / H >= 1.2, sx, sy, sw, sh, mr, mx, my;
      if (land) { sw = W * 0.6; sh = H; sx = 0; sy = 0; mr = Math.min(W * 0.18, H * 0.34); mx = W * 0.6 + (W * 0.4) / 2; my = H * 0.44; }
      else { sw = W; sh = H * 0.56; sx = 0; sy = 0; mr = Math.min(W * 0.3, H * 0.17); mx = W / 2; my = sh + (H - sh) * 0.44; }
      // 바탕
      c.fillStyle = '#f4f1ea'; c.fillRect(0, 0, W, H);
      var info = section(c, sx, sy, sw, sh, time);
      // 지시선
      var col = st.where === 'surface' ? '#d0602a' : '#3f86b5';
      c.save(); c.strokeStyle = col; c.lineWidth = 2.5; c.setLineDash([2, 6]); c.lineCap = 'round'; c.beginPath(); c.moveTo(info.spot[0], info.spot[1]); c.lineTo(mx - (land ? mr : 0), my - (land ? 0 : mr)); c.stroke(); c.restore();
      // 확대 창
      tick++; paintMag(time);
      c.save(); c.beginPath(); c.arc(mx, my, mr, 0, 6.283); c.closePath();
      c.shadowColor = 'rgba(20,38,59,.3)'; c.shadowBlur = 24; c.fillStyle = '#222'; c.fill(); c.shadowBlur = 0; c.clip();
      c.imageSmoothingEnabled = true; c.drawImage(cvs, mx - mr, my - mr, mr * 2, mr * 2);
      var shine = c.createRadialGradient(mx - mr * 0.4, my - mr * 0.5, 0, mx, my, mr); shine.addColorStop(0, 'rgba(255,255,255,.18)'); shine.addColorStop(0.5, 'rgba(255,255,255,0)'); shine.addColorStop(1, 'rgba(0,0,0,.25)'); c.fillStyle = shine; c.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
      c.restore();
      c.lineWidth = 8; c.strokeStyle = '#d7dbe0'; c.beginPath(); c.arc(mx, my, mr + 4, 0, 6.283); c.stroke(); c.lineWidth = 2; c.strokeStyle = '#9aa1aa'; c.beginPath(); c.arc(mx, my, mr + 8, 0, 6.283); c.stroke();
      // 확대 창 제목과 식는 정도 막대
      var fs = Math.max(13, Math.round(Math.min(W, H) * 0.028));
      c.font = '800 ' + fs + 'px Pretendard, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#123f46';
      c.fillText(st.where === 'surface' ? '확대: 지표로 분출한 마그마' : '확대: 지하 깊은 곳의 마그마', mx, my - mr - 18);
      var bw = mr * 1.7, bx = mx - bw / 2, by = my + mr + 22, bh = Math.max(12, fs * 0.8);
      var bgd = c.createLinearGradient(bx, 0, bx + bw, 0); bgd.addColorStop(0, rgb(heat(1))); bgd.addColorStop(0.5, rgb(heat(0.55))); bgd.addColorStop(1, rgb(heat(0))); c.fillStyle = bgd; c.beginPath(); c.roundRect(bx, by, bw, bh, bh / 2); c.fill();
      var mk = bx + bw * (1 - st.T); c.fillStyle = '#fff'; c.strokeStyle = '#14263b'; c.lineWidth = 3; c.beginPath(); c.arc(mk, by + bh / 2, bh * 0.75, 0, 6.283); c.fill(); c.stroke();
      c.font = '700 ' + (fs - 1) + 'px Pretendard, sans-serif'; c.fillStyle = '#5a6b7e'; c.textAlign = 'left'; c.fillText('뜨겁다', bx, by + bh + fs + 4); c.textAlign = 'right'; c.fillText('식어 굳었다', bx + bw, by + bh + fs + 4);
      c.textAlign = 'center'; c.fillStyle = '#14263b'; c.font = '800 ' + fs + 'px Pretendard, sans-serif';
      var msg = st.ph === 'idle' ? '「식히기 시작」을 눌러요' : st.done ? (st.where === 'surface' ? '빠르게 식어 입자가 매우 작아요' : '천천히 식어 입자가 커요') : (st.where === 'surface' ? '빠르게 식는 중' : '천천히 식는 중 (오랜 시간)');
      c.fillText(msg, mx, by + bh + fs * 2 + 14);
      // 범례
      var ly = by + bh + fs * 3 + 26, items = st.kind === 'light' ? [['#ebe5da', '장석'], ['#9a9ca0', '석영'], ['#2a2522', '어두운색 광물']] : [['#2c3328', '감람석, 휘석 등 어두운색 광물'], ['#8a8e8c', '밝은색 광물']];
      if (ly + fs < H) { c.font = '700 ' + (fs - 2) + 'px Pretendard, sans-serif'; var tot = 0; items.forEach(function (it) { tot += c.measureText(it[1]).width + 30; }); var lx = mx - tot / 2; items.forEach(function (it) { c.fillStyle = it[0]; c.fillRect(lx, ly - fs * 0.7, 14, 14); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.strokeRect(lx, ly - fs * 0.7, 14, 14); c.fillStyle = '#34495e'; c.textAlign = 'left'; c.fillText(it[1], lx + 18, ly + 2); lx += c.measureText(it[1]).width + 30; }); }
    }
    reset();
    return { st: st, reset: reset, start: start, step: step, draw: draw, grains: function () { return st.grains.length; } };
  }
  return { create: create };
})();
