/* ===== 지구 내부 그림 도구 (층 자료, 단면, 땅속, 지각 확대, 시추기, 화산, 지진계) =====
   - 층의 깊이·상태·물질은 교과서 「지구 내부는 어떻게 생겼을까?」의 값만 써요.
   - 지각 두께는 실제보다 두껍게 그려요(실제로는 지구 크기에 비해 아주 얇아요). 맨틀·외핵·내핵은 깊이에 맞춰요.
   - 층의 색은 교과서 그림 Ⅱ-3을 따른 것이고 온도를 뜻하지 않아요. 밀도 막대 높이는 순서만 보여 주는 모형이에요. */
window.EI = (function () {
  'use strict';
  /* 층 자료: 선생님이 고치기 쉽게 맨 위에 모아 둠 */
  var LAYERS = [
    { id: 'crust', name: '지각', from: 0, to: 35, range: '지표 ~ 약 35 km (해양 약 5 km)', state: '고체', stuff: '여러 가지 암석', tagBg: '#7cb342', tagFg: '#fff', fill: '#8d6a48', dens: 1,
      facts: ['지권 가장 바깥에 있는 <b>고체 상태의 얇은 층</b>이에요.', '<b>여러 가지 암석</b>으로 이루어져 있어요.', '<b>대륙 지각</b>(평균 약 35 km, 두꺼운 곳 약 70 km)과 <b>해양 지각</b>(평균 약 5 km)으로 구분해요.'] },
    { id: 'mantle', name: '맨틀', from: 35, to: 2900, range: '지각 아래 ~ 약 2900 km', state: '고체', stuff: '지각보다 밀도가 큰 암석', tagBg: '#e85d86', tagFg: '#fff', fill: '#c1401f', dens: 2,
      facts: ['지각 아래에서부터 깊이 <b>약 2900 km</b>까지의 층이에요.', '지구 전체 부피의 <b>약 80 %</b>를 차지해요.', '<b>지각보다 밀도가 큰 고체 상태의 암석</b>으로 이루어져 있지만, <b>부분적으로 암석이 녹아 흐르는 성질</b>을 가진 곳도 있어요.'] },
    { id: 'outer', name: '외핵', from: 2900, to: 5100, range: '약 2900 km ~ 5100 km', state: '액체', stuff: '주로 철과 니켈', tagBg: '#f59a23', tagFg: '#fff', fill: '#f6a62a', dens: 3,
      facts: ['깊이 약 <b>2900 km에서 5100 km</b>까지의 층이에요.', '주로 <b>철과 니켈</b>로 구성되어 있어요.', '<b>맨틀보다 밀도가 크고 액체 상태</b>예요.'] },
    { id: 'inner', name: '내핵', from: 5100, to: 6400, range: '약 5100 km ~ 6400 km (지구 중심)', state: '고체', stuff: '주로 철과 니켈', tagBg: '#ffd23f', tagFg: '#3a2c00', fill: '#fff0bf', dens: 4,
      facts: ['외핵 아래 깊이 약 <b>5100 km에서 지구 중심인 6400 km</b>까지의 층이에요.', '지구 가장 안쪽 층으로 <b>밀도가 가장 커요</b>.', '외핵처럼 주로 <b>철과 니켈</b>로 이루어져 있지만 <b>고체 상태</b>예요.'] },
  ];
  var R_IC = 1300 / 6400, R_OC = 3500 / 6400;   /* 내핵·외핵 바깥 반지름 (지구 중심에서, 비율) */

  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s = (s + 0x6D2B79F5) | 0; var t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var sstep = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var mixc = function (a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; };
  var REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function fit(cv, maxDpr) {
    var r = cv.getBoundingClientRect(), dpr = Math.min(maxDpr || 2, window.devicePixelRatio || 1);
    var w = Math.max(10, r.width), h = Math.max(10, r.height), W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { c: c, w: w, h: h, dpr: dpr };
  }
  function off(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function visible(el) {
    if (document.hidden) return false;
    try { var f = window.frameElement; if (f && f.hasAttribute('data-page') && !f.classList.contains('on')) return false; } catch (e) {}
    if (!el) return true;
    var r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > -40 && r.top < (window.innerHeight || 800) + 40;
  }
  /* 깊이(km) → 층 */
  function layerAt(km) { for (var i = 0; i < LAYERS.length; i++) if (km <= LAYERS[i].to + 1e-6) return LAYERS[i]; return LAYERS[3]; }
  /* 깊이(km) → 그림 속 반지름 비율 (지각은 crustK 두께로 부풀려요) */
  function rVis(km, crustK) {
    var cb = 1 - crustK, rM = R_OC;
    if (km <= 35) return 1 - (km / 35) * crustK;
    if (km <= 2900) return cb - (km - 35) / (2900 - 35) * (cb - rM);
    return 1 - km / 6400;
  }

  /* 값 잡음 (무늬용) */
  function noise2(seed) {
    var r = rng(seed), N = 256, G = new Float32Array(N * N);
    for (var i = 0; i < N * N; i++) G[i] = r();
    function v(x, y) {
      var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      var a = G[((yi & 255) * N) + (xi & 255)], b = G[((yi & 255) * N) + ((xi + 1) & 255)], c = G[(((yi + 1) & 255) * N) + (xi & 255)], d = G[(((yi + 1) & 255) * N) + ((xi + 1) & 255)];
      var u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
      return lerp(lerp(a, b, u), lerp(c, d, u), w);
    }
    return function (x, y, oct) { var s = 0, amp = 0.5, f = 1, n = oct || 4; for (var k = 0; k < n; k++) { s += amp * v(x * f, y * f); f *= 2.03; amp *= 0.5; } return s / (1 - Math.pow(0.5, n)); };
  }
  var NZ = noise2(17);

  /* 층 색 (교과서 그림 Ⅱ-3처럼: 지각 갈색, 맨틀 붉은색, 외핵 주황, 내핵 흰빛) */
  function layerColor(r, cb, n, m) {
    var col, edge = 1;
    if (r > cb) { var u = (r - cb) / (1 - cb); col = mixc([110, 78, 52], [150, 112, 74], n); if (u > 0.82) col = mixc(col, [86, 62, 40], 0.5); }
    else if (r > R_OC) { var u2 = (r - R_OC) / (cb - R_OC); col = mixc([232, 96, 36], [158, 42, 22], Math.pow(u2, 0.8)); col = mixc(col, [120, 26, 14], (1 - n) * 0.35); col = mixc(col, [255, 150, 60], Math.max(0, m - 0.72) * 1.4); }
    else if (r > R_IC) { var u3 = (r - R_IC) / (R_OC - R_IC); col = mixc([255, 214, 96], [242, 146, 30], u3); col = mixc(col, [255, 240, 170], Math.max(0, n - 0.6) * 0.9); }
    else { var u4 = r / R_IC; col = mixc([255, 252, 236], [255, 226, 140], Math.pow(u4, 1.6)); col = mixc(col, [255, 255, 255], Math.max(0, n - 0.62) * 0.8); }
    [cb, R_OC, R_IC].forEach(function (b) { var d = Math.abs(r - b); if (d < 0.007) edge = Math.min(edge, 0.62 + d / 0.007 * 0.38); });
    return [col[0] * edge, col[1] * edge, col[2] * edge];
  }
  /* 단면 원판(지름 S픽셀)을 미리 그려 둠 */
  var discCache = {};
  function disc(S, crustK, gray) {
    S = Math.max(64, Math.min(900, Math.round(S)));
    var key = S + ':' + crustK + ':' + (gray ? 1 : 0); if (discCache[key]) return discCache[key];
    var cv = off(S, S), g = cv.getContext('2d'), img = g.createImageData(S, S), D = img.data, cb = 1 - crustK, h = S / 2;
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var dx = (x + 0.5 - h) / h, dy = (y + 0.5 - h) / h, r = Math.sqrt(dx * dx + dy * dy), i = (y * S + x) * 4;
      if (r > 1) { D[i + 3] = 0; continue; }
      var n = NZ(dx * 7 + 3, dy * 7 + 3, 4), m = NZ(dx * 3.2 + 40, dy * 3.2 + 9, 3), col;
      if (gray) { var k = 70 + n * 26 + (1 - r) * 30; col = [k, k + 4, k + 12]; if (r > cb) col = [k + 30, k + 22, k + 10]; }
      else col = layerColor(r, cb, n, m);
      var aa = clamp((1 - r) * h, 0, 1);
      D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = 255 * aa;
    }
    g.putImageData(img, 0, 0);
    if (!gray) { var gl = g.createRadialGradient(h, h, 0, h, h, h * R_IC * 1.6); gl.addColorStop(0, 'rgba(255,255,240,.55)'); gl.addColorStop(1, 'rgba(255,255,240,0)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = gl; g.fillRect(0, 0, S, S); }
    discCache[key] = cv; return cv;
  }
  /* 지구 단면 그리기
     opt: crustK(지각 두께 비율), half('bottom'|'right'|null), t(ms, 외핵 일렁임), gray(층을 모를 때), surface(겉 띠), labels, ruler */
  function section(c, cx, cy, R, opt) {
    opt = opt || {}; var ck = opt.crustK || 0.05, dpr = Math.min(2, window.devicePixelRatio || 1), img = disc(R * 2 * dpr, ck, opt.gray);
    c.save();
    c.beginPath();
    if (opt.half === 'bottom') c.arc(cx, cy, R + 1, 0, Math.PI); else if (opt.half === 'right') c.arc(cx, cy, R + 1, -Math.PI / 2, Math.PI / 2); else if (opt.half === 'left') c.arc(cx, cy, R + 1, Math.PI / 2, Math.PI * 1.5); else c.arc(cx, cy, R + 1, 0, Math.PI * 2);
    c.closePath(); c.clip();
    c.drawImage(img, cx - R, cy - R, R * 2, R * 2);
    /* 외핵: 액체라서 천천히 일렁이는 빛 */
    if (!opt.gray && opt.t != null) {
      var t = REDUCE ? 0 : opt.t / 1000; c.globalCompositeOperation = 'lighter';
      for (var k = 0; k < 9; k++) {
        var a0 = k / 9 * Math.PI * 2 + t * 0.22 * (k % 2 ? 1 : -0.7), rr = R * lerp(R_IC + 0.05, R_OC - 0.05, ((k * 37) % 9) / 9 + 0.04 * Math.sin(t + k));
        c.strokeStyle = 'rgba(255,236,150,' + (0.1 + 0.07 * Math.sin(t * 1.3 + k)) + ')'; c.lineWidth = Math.max(1.5, R * 0.018); c.lineCap = 'round';
        c.beginPath(); c.arc(cx, cy, rr, a0, a0 + 0.6 + 0.25 * Math.sin(t * 0.7 + k)); c.stroke();
      }
      c.globalCompositeOperation = 'source-over';
    }
    c.restore();
    /* 겉 테두리 */
    c.save(); c.strokeStyle = opt.gray ? 'rgba(200,210,230,.5)' : 'rgba(60,40,24,.75)'; c.lineWidth = 2; c.beginPath();
    if (opt.half === 'bottom') { c.arc(cx, cy, R, 0, Math.PI); c.closePath(); } else if (opt.half === 'right') { c.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2); c.closePath(); } else if (opt.half === 'left') { c.arc(cx, cy, R, Math.PI / 2, Math.PI * 1.5); c.closePath(); } else c.arc(cx, cy, R, 0, Math.PI * 2);
    c.stroke(); c.restore();
  }
  function tag(ctx, text, x, y, opt) {
    opt = opt || {};
    ctx.save(); ctx.font = (opt.weight || 800) + ' ' + (opt.size || 14) + 'px Pretendard, sans-serif'; ctx.textBaseline = 'middle';
    var tw = ctx.measureText(text).width, pw = 8, ph = (opt.size || 14) * 0.95;
    var al = opt.align || 'center', x0 = al === 'center' ? x - tw / 2 - pw : al === 'left' ? x : x - tw - pw * 2;
    if (opt.bg !== 'none') { ctx.fillStyle = opt.bg || 'rgba(20,16,10,.78)'; ctx.beginPath(); ctx.roundRect(x0, y - ph, tw + pw * 2, ph * 2, ph); ctx.fill(); }
    if (opt.border) { ctx.strokeStyle = opt.border; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.fillStyle = opt.color || '#fff'; ctx.textAlign = 'left'; ctx.fillText(text, x0 + pw, y + 0.5); ctx.restore();
    return tw + pw * 2;
  }
  function arrow(ctx, x1, y1, x2, y2, col, lw, head) {
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw || 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var a = Math.atan2(y2 - y1, x2 - x1), H = head || 9;
    ctx.beginPath(); ctx.moveTo(x2 + Math.cos(a) * 2, y2 + Math.sin(a) * 2); ctx.lineTo(x2 - H * Math.cos(a - 0.45), y2 - H * Math.sin(a - 0.45)); ctx.lineTo(x2 - H * Math.cos(a + 0.45), y2 - H * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  /* ===== 땅속 단면 (지표 가까운 곳): 하늘, 흙·암석 층, 자갈 무늬 ===== */
  var groundCache = {};
  function groundTex(w, h, seed) {
    var key = Math.round(w) + 'x' + Math.round(h) + ':' + seed; if (groundCache[key]) return groundCache[key];
    var dpr = Math.min(2, window.devicePixelRatio || 1), cv = off(w * dpr, h * dpr), g = cv.getContext('2d'); g.scale(dpr, dpr);
    var BANDS = [[0, '#9a7a52', '#8a6a44'], [0.12, '#86654a', '#76563c'], [0.34, '#6f5446', '#5f4639'], [0.6, '#5a4a48', '#4b3c3c'], [0.82, '#4a3a3a', '#3e3030']];
    var r = rng(seed || 5);
    BANDS.forEach(function (b, i) {
      var y0 = b[0] * h, y1 = (BANDS[i + 1] ? BANDS[i + 1][0] : 1) * h, gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, b[1]); gr.addColorStop(1, b[2]);
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, y0);
      for (var x = 0; x <= w; x += 20) g.lineTo(x, y0 + (i ? Math.sin(x / 70 + i * 2) * h * 0.012 + Math.sin(x / 23 + i) * h * 0.005 : 0));
      g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
    });
    for (var i = 0; i < w * h / 90; i++) { var x = r() * w, y = r() * h, s = 0.6 + r() * (y / h) * 2.6; g.fillStyle = 'rgba(' + (r() < 0.5 ? '255,240,220' : '20,10,5') + ',' + (0.05 + r() * 0.12) + ')'; g.beginPath(); g.ellipse(x, y, s * 1.6, s, r() * 3, 0, Math.PI * 2); g.fill(); }
    groundCache[key] = cv; return cv;
  }
  function ground(c, x, y, w, h, seed) { c.drawImage(groundTex(w, h, seed), x, y, w, h); }
  function sky(c, w, y1) { var g = c.createLinearGradient(0, 0, 0, y1); g.addColorStop(0, '#9fcbf0'); g.addColorStop(1, '#e8f3fb'); c.fillStyle = g; c.fillRect(0, 0, w, y1); }

  /* 시추기 (그림 Ⅱ-2 '직접 땅을 뚫어 조사하기') */
  function rig(c, x, gy, s, t, depthPx) {
    c.save();
    /* 구멍과 드릴 줄 */
    if (depthPx > 0) {
      c.fillStyle = 'rgba(15,10,6,.75)'; c.fillRect(x - s * 0.05, gy, s * 0.1, depthPx);
      c.strokeStyle = '#c9ced6'; c.lineWidth = Math.max(2, s * 0.035); c.beginPath(); c.moveTo(x, gy - s * 0.9); c.lineTo(x, gy + depthPx - s * 0.04); c.stroke();
      var bx = x, by = gy + depthPx; c.fillStyle = '#e6e9ee'; c.beginPath(); c.moveTo(bx - s * 0.06, by - s * 0.08); c.lineTo(bx + s * 0.06, by - s * 0.08); c.lineTo(bx, by + s * 0.03); c.closePath(); c.fill();
      var sp = REDUCE ? 0 : (t / 90) % (Math.PI * 2); c.strokeStyle = 'rgba(80,90,100,.8)'; c.lineWidth = 1.5; for (var k = 0; k < 3; k++) { var yy = by - s * 0.07 + k * s * 0.025; c.beginPath(); c.moveTo(bx - s * 0.05 * Math.cos(sp + k), yy); c.lineTo(bx + s * 0.05 * Math.cos(sp + k), yy + s * 0.012); c.stroke(); }
    }
    /* 탑 */
    var top = gy - s * 1.15, base = s * 0.42;
    c.strokeStyle = '#d4552b'; c.lineWidth = Math.max(2, s * 0.04); c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x - base, gy); c.lineTo(x - s * 0.07, top); c.lineTo(x + s * 0.07, top); c.lineTo(x + base, gy); c.stroke();
    c.lineWidth = Math.max(1, s * 0.022);
    for (var j = 1; j < 6; j++) { var f = j / 6, y = lerp(gy, top, f), hw = lerp(base, s * 0.07, f), y2 = lerp(gy, top, f + 1 / 6), hw2 = lerp(base, s * 0.07, f + 1 / 6); c.beginPath(); c.moveTo(x - hw, y); c.lineTo(x + hw2, y2); c.moveTo(x + hw, y); c.lineTo(x - hw2, y2); c.moveTo(x - hw, y); c.lineTo(x + hw, y); c.stroke(); }
    /* 기계실 */
    var gr = c.createLinearGradient(0, gy - s * 0.3, 0, gy); gr.addColorStop(0, '#f08a3c'); gr.addColorStop(1, '#c4561f');
    c.fillStyle = gr; c.beginPath(); c.roundRect(x + base * 0.55, gy - s * 0.3, s * 0.55, s * 0.3, 3); c.fill();
    c.fillStyle = '#ffe2a8'; c.fillRect(x + base * 0.68, gy - s * 0.24, s * 0.12, s * 0.08);
    c.fillStyle = '#3a3f47'; c.fillRect(x - base * 1.05, gy - s * 0.06, base * 2.1, s * 0.06);
    c.restore();
  }
  /* 화산 (그림 Ⅱ-2 '화산 분출물 조사하기'): 산, 마그마가 올라오는 길, 흘러내리는 용암 */
  function volcano(c, x, gy, s, t, glow) {
    var T = REDUCE ? 0 : t / 1000; c.save();
    /* 땅속 통로 */
    var gp = c.createLinearGradient(0, gy, 0, gy + s * 1.2); gp.addColorStop(0, 'rgba(255,120,40,.95)'); gp.addColorStop(1, 'rgba(255,80,20,.35)');
    c.fillStyle = gp; c.beginPath(); c.moveTo(x - s * 0.05, gy); c.bezierCurveTo(x - s * 0.08, gy + s * 0.4, x + s * 0.02, gy + s * 0.8, x - s * 0.06, gy + s * 1.2); c.lineTo(x + s * 0.1, gy + s * 1.2); c.bezierCurveTo(x + s * 0.14, gy + s * 0.8, x + s * 0.06, gy + s * 0.4, x + s * 0.05, gy); c.closePath(); c.fill();
    /* 산 */
    var gm = c.createLinearGradient(x - s, gy, x + s, gy - s * 0.8); gm.addColorStop(0, '#5e4a3c'); gm.addColorStop(0.55, '#7a6352'); gm.addColorStop(1, '#4a3a30');
    c.fillStyle = gm; c.beginPath(); c.moveTo(x - s * 1.05, gy); c.quadraticCurveTo(x - s * 0.45, gy - s * 0.35, x - s * 0.14, gy - s * 0.78); c.lineTo(x + s * 0.14, gy - s * 0.78); c.quadraticCurveTo(x + s * 0.45, gy - s * 0.35, x + s * 1.05, gy); c.closePath(); c.fill();
    /* 용암 줄기 */
    c.lineCap = 'round';
    [[-1, 0.0], [1, 0.4], [-0.6, 0.7]].forEach(function (L, k) {
      var lg = c.createLinearGradient(x, gy - s * 0.78, x + L[0] * s * 0.6, gy - s * 0.1); lg.addColorStop(0, '#fff2a0'); lg.addColorStop(0.35, '#ff9a2a'); lg.addColorStop(1, 'rgba(200,50,20,.7)');
      c.strokeStyle = lg; c.lineWidth = s * (0.06 - k * 0.012);
      c.beginPath(); c.moveTo(x + L[0] * s * 0.06, gy - s * 0.77);
      c.bezierCurveTo(x + L[0] * s * 0.2, gy - s * 0.55, x + L[0] * s * (0.3 + 0.04 * Math.sin(T + k)), gy - s * 0.35, x + L[0] * s * (0.5 + L[1] * 0.2), gy - s * 0.08); c.stroke();
    });
    /* 분화구 빛과 연기 */
    var cg = c.createRadialGradient(x, gy - s * 0.8, 0, x, gy - s * 0.8, s * 0.35 * (glow || 1)); cg.addColorStop(0, 'rgba(255,230,140,.95)'); cg.addColorStop(0.4, 'rgba(255,120,40,.5)'); cg.addColorStop(1, 'rgba(255,80,20,0)');
    c.fillStyle = cg; c.beginPath(); c.arc(x, gy - s * 0.8, s * 0.35 * (glow || 1), 0, Math.PI * 2); c.fill();
    for (var i = 0; i < 6; i++) { var u = ((T * 0.18 + i / 6) % 1), sx = x + Math.sin(i * 2.1 + T * 0.5) * s * 0.1 + u * s * 0.35, sy = gy - s * 0.85 - u * s * 0.8, sr = s * (0.1 + u * 0.22); c.fillStyle = 'rgba(120,115,112,' + (0.42 * (1 - u)) + ')'; c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  /* 지진계 (상자 + 기록 띠) */
  function seismo(c, x, gy, s, trace, col) {
    c.save();
    var gb = c.createLinearGradient(0, gy - s * 0.5, 0, gy); gb.addColorStop(0, '#f2f5f9'); gb.addColorStop(1, '#c9d3de');
    c.fillStyle = gb; c.strokeStyle = '#6b7c8f'; c.lineWidth = 1.5; c.beginPath(); c.roundRect(x - s * 0.36, gy - s * 0.46, s * 0.72, s * 0.46, 5); c.fill(); c.stroke();
    c.fillStyle = '#fff'; c.fillRect(x - s * 0.3, gy - s * 0.4, s * 0.6, s * 0.26);
    c.strokeStyle = col || '#d23a2a'; c.lineWidth = 1.6; c.beginPath();
    var n = 40; for (var i = 0; i <= n; i++) { var u = i / n, v = trace ? trace(u) : 0; var px = x - s * 0.3 + u * s * 0.6, py = gy - s * 0.27 + v * s * 0.11; if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.stroke();
    c.fillStyle = '#4b5a6b'; c.beginPath(); c.arc(x + s * 0.24, gy - s * 0.07, s * 0.04, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  /* 지진이 난 곳에서 퍼지는 물결 (땅속) */
  function ripples(c, x, y, rMax, t, col, n) {
    var T = REDUCE ? 0.5 : (t / 2600) % 1; n = n || 4; c.save();
    for (var k = 0; k < n; k++) { var u = (T + k / n) % 1, r = u * rMax; c.strokeStyle = (col || 'rgba(255,240,200,') + (0.85 * (1 - u)) + ')'; c.lineWidth = 2.2; c.beginPath(); c.arc(x, y, Math.max(1, r), 0, Math.PI * 2); c.stroke(); }
    c.fillStyle = '#ffdf6b'; c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#7a4a00'; c.lineWidth = 1.5; c.stroke();
    c.restore();
  }

  /* ===== 지각 확대 (그림 Ⅱ-3 위쪽 확대 그림처럼): 바다·대륙 지각·해양 지각·맨틀 =====
     km 눈금을 붙여요. 세로는 깊이 0~80 km를 늘려 그린 모형이에요. */
  function crustBlock(c, w, h, opt) {
    opt = opt || {}; var sz = opt.fs || Math.max(12, Math.min(16, w / 34)), T = REDUCE ? 0 : (opt.t || 0) / 1000;
    var L = w * 0.15, Rr = w * 0.9, top = h * (opt.top || 0.34), bot = h * 0.93, dep = (bot - top) / 80;   /* 1 km당 픽셀 */
    var dx = w * 0.05, dy = -h * 0.08;                 /* 입체 옆면 */
    var kmY = function (km) { return top + km * dep; };
    var cx = lerp(L, Rr, 0.46), cw = (Rr - L) * 0.22;   /* 대륙 가운데, 반폭 */
    /* 지각 아래 경계(맨틀 위) 모양: 바다 쪽 약 5 km(+바닷물), 대륙 평균 35 km, 산 아래 가장 두꺼운 곳 약 70 km */
    var sea = 4;                                        /* 바닷물 깊이(모형) */
    function moho(x) { var d = Math.abs(x - cx) / cw; if (d > 1.9) return sea + 5; var k = d < 1 ? 1 : 1 - sstep(1, 1.9, d); return lerp(sea + 5, 35 + 35 * Math.max(0, 1 - d * d), k); }
    function surf(x) { var d = Math.abs(x - cx) / cw; if (d > 1.6) return sea; var k = d < 1 ? 1 : 1 - sstep(1, 1.6, d); return lerp(sea, -9 * Math.max(0.15, 1 - d * d * 0.9), k); }
    c.save();
    /* 옆면 (깊이감) */
    c.fillStyle = '#4a2a1d'; c.beginPath(); c.moveTo(Rr, kmY(-2)); c.lineTo(Rr + dx, kmY(-2) + dy); c.lineTo(Rr + dx, bot + dy); c.lineTo(Rr, bot); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(Rr, kmY(-2), 2, bot - kmY(-2));
    /* 윗면 (깊이감) */
    c.fillStyle = 'rgba(90,170,235,.55)'; c.beginPath(); c.moveTo(L, kmY(0)); c.lineTo(L + dx, kmY(0) + dy); c.lineTo(Rr + dx, kmY(0) + dy); c.lineTo(Rr, kmY(0)); c.closePath(); c.fill();
    /* 맨틀 */
    var gm = c.createLinearGradient(0, top, 0, bot); gm.addColorStop(0, '#9c3a20'); gm.addColorStop(1, '#6e2414'); c.fillStyle = gm; c.fillRect(L, top, Rr - L, bot - top);
    /* 지각 (대륙·해양을 한 덩어리로, 색만 다르게) */
    var STEP = 4;
    c.beginPath(); c.moveTo(L, kmY(surf(L)));
    for (var x = L; x <= Rr; x += STEP) c.lineTo(x, kmY(surf(x)));
    for (var x2 = Rr; x2 >= L; x2 -= STEP) c.lineTo(x2, kmY(moho(x2)));
    c.closePath();
    var gc = c.createLinearGradient(0, kmY(-9), 0, kmY(70)); gc.addColorStop(0, '#e8b74c'); gc.addColorStop(0.6, '#d49a36'); gc.addColorStop(1, '#b8792a');
    c.fillStyle = gc; c.fill();
    /* 해양 지각은 조금 어둡게 */
    c.save(); c.clip(); c.fillStyle = 'rgba(70,60,70,.42)'; c.fillRect(L, top, cx - cw * 1.75 - L, bot - top); c.fillRect(cx + cw * 1.75, top, Rr - cx - cw * 1.75, bot - top); c.restore();
    /* 바닷물 */
    var gs = c.createLinearGradient(0, kmY(-1), 0, kmY(sea)); gs.addColorStop(0, 'rgba(70,160,230,.95)'); gs.addColorStop(1, 'rgba(25,90,170,.95)'); c.fillStyle = gs;
    c.beginPath(); c.moveTo(L, kmY(0)); for (var x3 = L; x3 <= Rr; x3 += STEP) c.lineTo(x3, kmY(Math.min(0, surf(x3)) > 0 ? 0 : 0)); for (var x4 = Rr; x4 >= L; x4 -= STEP) c.lineTo(x4, kmY(Math.max(0, surf(x4)))); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.2; c.beginPath(); for (var x5 = L; x5 <= Rr; x5 += 6) { var yy = kmY(0) + Math.sin(x5 / 9 + T * 2) * 1.2; if (x5 === L) c.moveTo(x5, yy); else c.lineTo(x5, yy); } c.stroke();
    /* 산 위 초록 */
    c.fillStyle = '#5f9c3a'; c.beginPath(); var first = true; for (var x7 = cx - cw * 1.4; x7 <= cx + cw * 1.4; x7 += STEP) { var yv = kmY(surf(x7)); if (first) { c.moveTo(x7, yv); first = false; } else c.lineTo(x7, yv); } for (var x8 = cx + cw * 1.4; x8 >= cx - cw * 1.4; x8 -= STEP) c.lineTo(x8, kmY(surf(x8)) + 3.5); c.closePath(); c.fill();
    /* 테두리 */
    c.strokeStyle = 'rgba(40,20,10,.6)'; c.lineWidth = 1.4; c.strokeRect(L, kmY(-2), Rr - L, bot - kmY(-2));
    /* 깊이 눈금 */
    c.font = '800 ' + (sz - 2) + 'px Pretendard, sans-serif'; c.textAlign = 'right'; c.textBaseline = 'middle';
    [0, 35, 70].forEach(function (km) { var y = kmY(km); c.strokeStyle = 'rgba(255,255,255,.75)'; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(L, y); c.lineTo(Rr, y); c.stroke(); c.setLineDash([]); c.fillStyle = opt.dark ? '#e9eef7' : '#2a3442'; c.fillText(km + ' km', L - 6, y); });
    /* 두께 표시: 해양 약 5 km, 대륙 평균 약 35 km, 두꺼운 곳 약 70 km */
    var ox = lerp(L, cx - cw * 1.9, 0.45);
    tag(c, '해양 지각 (평균 약 5 km)', Math.max(L + w * 0.13, ox), kmY(-4) - sz * 0.6, { size: sz - 2, bg: 'rgba(30,40,60,.88)' });
    arrow(c, ox, kmY(-4) + sz * 0.5, ox, kmY(sea + 2.5) - 2, 'rgba(30,40,60,.9)', 2, 7);
    tag(c, '대륙 지각 (평균 약 35 km)', cx, kmY(20), { size: sz - 1, bg: 'rgba(90,55,10,.85)' });
    tag(c, '두꺼운 곳 약 70 km', cx, kmY(62), { size: sz - 3, bg: 'rgba(90,55,10,.7)' });
    tag(c, '맨틀', lerp(cx + cw * 1.9, Rr, 0.5), kmY(48), { size: sz, bg: '#e85d86' });
    if (opt.cap !== false) tag(c, '깊이를 늘려 그린 모형', Rr - 4, bot - sz * 0.9, { size: sz - 4, align: 'right', bg: 'rgba(255,255,255,.85)', color: '#4a3a2a' });
    c.restore();
  }

  /* 밀도 계단 (순서만): 지각 < 맨틀 < 외핵 < 내핵 */
  function densityBars(c, x, y, w, h, cur, sz) {
    var n = 4, gap = w * 0.06, bw = (w - gap * (n - 1)) / n;
    LAYERS.forEach(function (L, i) {
      var bh = h * (0.25 + i * 0.25) * 0.82, bx = x + i * (bw + gap), by = y + h * 0.82 - bh;
      var g = c.createLinearGradient(0, by, 0, by + bh); g.addColorStop(0, L.tagBg); g.addColorStop(1, L.fill);
      c.globalAlpha = cur == null || cur === i ? 1 : 0.35; c.fillStyle = g; c.beginPath(); c.roundRect(bx, by, bw, bh, 5); c.fill(); c.globalAlpha = 1;
      c.fillStyle = '#2b3442'; c.font = '800 ' + (sz || 13) + 'px Pretendard, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(L.name, bx + bw / 2, y + h * 0.92);
    });
  }

  return { LAYERS: LAYERS, R_IC: R_IC, R_OC: R_OC, rng: rng, clamp: clamp, sstep: sstep, lerp: lerp, REDUCE: REDUCE, fit: fit, off: off, visible: visible, layerAt: layerAt, rVis: rVis, noise2: noise2,
    section: section, tag: tag, arrow: arrow, ground: ground, sky: sky, rig: rig, volcano: volcano, seismo: seismo, ripples: ripples, crustBlock: crustBlock, densityBars: densityBars };
})();
