/* ===== 2D 그림 도구 (ART): 질감, 암석 덩어리, 풀, 나무, 이름표, 캔버스 반복 그리기 =====
   풍화·토양·암석의 순환 그림이 함께 써요. 모든 그림은 정해진 크기(설계 좌표)에 그리고 화면에 맞춰 늘려요. */
window.ART = (function () {
  'use strict';
  var REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var lerp = function (a, b, k) { return a + (b - a) * k; };
  var ease = function (k) { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  var seg = function (p, a, b) { return ease((p - a) / (b - a)); };

  /* ---------- 질감 (한 번 만들어 두고 무늬로 반복) ---------- */
  var cache = {};
  function tex(key, w, h, paint) { if (!cache[key]) { var c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); cache[key] = c; } return cache[key]; }
  var KINDS = {
    granite: function (g, w, h) { // 밝은 회색 바탕에 검은 점·분홍 점 (화강암 느낌)
      var r = rng(11); g.fillStyle = '#c2bdb4'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 4200; i++) { var x = r() * w, y = r() * h, s = 0.7 + r() * 2.4, k = r(); g.fillStyle = k < 0.12 ? 'rgba(46,42,42,.62)' : k < 0.24 ? 'rgba(200,154,140,.5)' : k < 0.62 ? 'rgba(236,232,224,.55)' : 'rgba(130,124,116,.3)'; g.beginPath(); g.ellipse(x, y, s, s * (0.5 + r() * 0.6), r() * 3, 0, 6.283); g.fill(); }
    },
    stone: function (g, w, h) { // 짙은 회색 바위
      var r = rng(23); g.fillStyle = '#8f8c86'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 2200; i++) { var x = r() * w, y = r() * h, s = 0.8 + r() * 3.2, k = r(); g.fillStyle = k < 0.35 ? 'rgba(60,58,56,.35)' : k < 0.7 ? 'rgba(200,196,188,.32)' : 'rgba(120,104,88,.22)'; g.fillRect(x, y, s, s); }
      for (var j = 0; j < 40; j++) { g.strokeStyle = 'rgba(60,56,52,.12)'; g.lineWidth = 1; g.beginPath(); var x0 = r() * w, y0 = r() * h; g.moveTo(x0, y0); g.lineTo(x0 + (r() - 0.5) * 50, y0 + (r() - 0.5) * 30); g.stroke(); }
    },
    lime: function (g, w, h) { // 크림색 석회암, 가는 층
      var r = rng(37); g.fillStyle = '#ddd2b8'; g.fillRect(0, 0, w, h);
      for (var y = 0; y < h; y += 6 + r() * 10) { g.fillStyle = 'rgba(' + (r() < 0.5 ? '170,150,110' : '245,238,220') + ',' + (0.12 + r() * 0.18) + ')'; g.fillRect(0, y, w, 2 + r() * 4); }
      for (var i = 0; i < 1500; i++) { g.fillStyle = r() < 0.5 ? 'rgba(140,120,90,.25)' : 'rgba(255,255,255,.35)'; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
    },
    humus: function (g, w, h) { // 검은 갈색 흙
      var r = rng(41); g.fillStyle = '#4a3222'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 2600; i++) { var k = r(); g.fillStyle = k < 0.4 ? 'rgba(20,12,6,.35)' : k < 0.75 ? 'rgba(120,84,52,.35)' : 'rgba(160,130,80,.25)'; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); }
    },
    clay: function (g, w, h) { // 붉은 갈색 진흙
      var r = rng(53); g.fillStyle = '#9a6038'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 2000; i++) { var k = r(); g.fillStyle = k < 0.45 ? 'rgba(90,50,26,.25)' : 'rgba(200,140,90,.25)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
    },
    sand: function (g, w, h) { // 모래 (밝은 황갈색 알갱이)
      var r = rng(61); g.fillStyle = '#c8a46e'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 3200; i++) { var k = r(); g.fillStyle = k < 0.3 ? 'rgba(120,90,50,.4)' : k < 0.7 ? 'rgba(240,220,170,.5)' : 'rgba(170,150,120,.4)'; g.beginPath(); g.arc(r() * w, r() * h, 0.8 + r() * 1.6, 0, 6.283); g.fill(); }
    },
    strata: function (g, w, h) { // 퇴적층 (가로 줄무늬)
      var r = rng(71), y = 0, cols = ['#c9a77a', '#b48a5c', '#d8bf94', '#a77d55', '#cdb08a'];
      while (y < h) { var t = 8 + r() * 18; g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(0, y, w, t); y += t; }
      for (var i = 0; i < 2000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(80,56,30,.18)' : 'rgba(255,240,210,.22)'; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
    },
  };
  function pat(ctx, kind) { return ctx.createPattern(tex(kind, 256, 256, KINDS[kind]), 'repeat'); }

  /* ---------- 모양 ---------- */
  function path(ctx, P) { ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (var i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]); ctx.closePath(); }
  function smoothPath(ctx, P) { // 꼭짓점을 둥글게 이은 닫힌 길
    var n = P.length; ctx.beginPath();
    var m0 = [(P[n - 1][0] + P[0][0]) / 2, (P[n - 1][1] + P[0][1]) / 2]; ctx.moveTo(m0[0], m0[1]);
    for (var i = 0; i < n; i++) { var a = P[i], b = P[(i + 1) % n]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    ctx.closePath();
  }
  function blob(cx, cy, rx, ry, n, seed, jag) { var r = rng(seed), P = []; for (var i = 0; i < n; i++) { var a = (i / n) * 6.283, k = 1 + (r() - 0.5) * (jag || 0.25); P.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return P; }
  function bbox(P) { var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; P.forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }); return { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0, h: y1 - y0 }; }
  /* 질감 + 입체 그늘 + 테두리로 암석 덩어리 그리기 */
  function rock(ctx, P, kind, o) {
    o = o || {}; var b = bbox(P);
    ctx.save();
    (o.smooth ? smoothPath : path)(ctx, P);
    if (o.shadow !== false) { ctx.shadowColor = 'rgba(30,20,10,.28)'; ctx.shadowBlur = o.blur || 14; ctx.shadowOffsetY = o.sy || 6; }
    ctx.fillStyle = o.color || pat(ctx, kind || 'stone'); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.clip();
    if (o.tint) { ctx.fillStyle = o.tint; ctx.fillRect(b.x0 - 2, b.y0 - 2, b.w + 4, b.h + 4); }
    var g = ctx.createLinearGradient(b.x0, b.y0, b.x0 + b.w * 0.7, b.y1);
    g.addColorStop(0, 'rgba(255,255,255,' + (o.hi == null ? 0.28 : o.hi) + ')'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(20,14,8,' + (o.lo == null ? 0.38 : o.lo) + ')');
    ctx.fillStyle = g; ctx.fillRect(b.x0 - 2, b.y0 - 2, b.w + 4, b.h + 4);
    // 가장자리 안쪽 그늘
    ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(30,22,14,.12)'; (o.smooth ? smoothPath : path)(ctx, P); ctx.stroke();
    ctx.restore();
    if (o.edge !== false) { ctx.save(); (o.smooth ? smoothPath : path)(ctx, P); ctx.lineJoin = 'round'; ctx.lineWidth = o.lw || 2; ctx.strokeStyle = o.edgeColor || 'rgba(48,40,32,.7)'; ctx.stroke(); ctx.restore(); }
  }
  /* 틈 (어두운 선 + 밝은 가장자리) */
  function crack(ctx, pts, w) {
    ctx.save(); ctx.lineJoin = ctx.lineCap = 'round';
    ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = (w || 3) + 2; ctx.stroke();
    ctx.strokeStyle = '#2b231c'; ctx.lineWidth = w || 3; ctx.stroke(); ctx.restore();
  }
  function rot(P, cx, cy, a, dx, dy) { var c = Math.cos(a), s = Math.sin(a); return P.map(function (p) { var x = p[0] - cx, y = p[1] - cy; return [cx + x * c - y * s + (dx || 0), cy + x * s + y * c + (dy || 0)]; }); }

  /* ---------- 하늘·풀·나무 ---------- */
  function sky(ctx, x, y, w, h, top, bot) { var g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); }
  function grass(ctx, x0, x1, y, t, o) {
    o = o || {}; var r = rng(o.seed || 5), n = Math.round((x1 - x0) / (o.gap || 5)), hgt = o.h || 16;
    ctx.save(); ctx.lineCap = 'round';
    for (var i = 0; i < n; i++) {
      var x = x0 + (i + r()) * (x1 - x0) / n, hh = hgt * (0.5 + r() * 0.8) * (o.scale == null ? 1 : o.scale), sw = Math.sin(t * 1.6 + x * 0.05) * 3 * (REDUCE ? 0 : 1) + (r() - 0.5) * 6;
      if (hh < 1) continue;
      var c = r(); ctx.strokeStyle = c < 0.33 ? '#4f8a35' : c < 0.66 ? '#6aa443' : '#87b84f'; ctx.lineWidth = 1.6 + r() * 1.4;
      ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.quadraticCurveTo(x + sw * 0.3, y - hh * 0.6, x + sw, y - hh); ctx.stroke();
    }
    ctx.restore();
  }
  function tree(ctx, x, y, s, t, o) { // 줄기 + 잎 덩어리 (s: 크기 0~1)
    o = o || {}; if (s <= 0.01) return;
    var H = (o.h || 170) * s, W = (o.w || 16) * (0.35 + 0.65 * s), sw = REDUCE ? 0 : Math.sin(t * 0.9) * 2.5 * s;
    ctx.save();
    var g = ctx.createLinearGradient(x - W, 0, x + W, 0); g.addColorStop(0, '#5a3c22'); g.addColorStop(0.5, '#8a6038'); g.addColorStop(1, '#4a3019');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - W, y); ctx.bezierCurveTo(x - W * 0.6, y - H * 0.4, x - W * 0.35 + sw * 0.3, y - H * 0.7, x - W * 0.25 + sw, y - H); ctx.lineTo(x + W * 0.25 + sw, y - H); ctx.bezierCurveTo(x + W * 0.35 + sw * 0.3, y - H * 0.7, x + W * 0.6, y - H * 0.4, x + W, y); ctx.closePath(); ctx.fill();
    // 잎
    var r = rng(o.seed || 9), cx = x + sw, cy = y - H, R = (o.r || 70) * s;
    for (var i = 0; i < 16; i++) {
      var a = r() * 6.283, d = r() * R * 0.75, bx = cx + Math.cos(a) * d * 1.25, by = cy + Math.sin(a) * d * 0.7 - R * 0.15, br = R * (0.32 + r() * 0.25);
      var lg = ctx.createRadialGradient(bx - br * 0.3, by - br * 0.4, br * 0.1, bx, by, br); lg.addColorStop(0, '#9ccf5c'); lg.addColorStop(0.6, '#5f9a3a'); lg.addColorStop(1, '#3d6e27');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(bx, by, br, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  }
  /* 가늘어지는 선 (뿌리) */
  function root(ctx, pts, w0, w1, col) {
    if (pts.length < 2) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (var i = 1; i < pts.length; i++) {
      var k = i / (pts.length - 1); ctx.lineWidth = lerp(w0, w1, k); ctx.strokeStyle = col || '#7a5230';
      ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
    }
    ctx.globalAlpha = 0.35; ctx.strokeStyle = '#d9b48a';
    for (var j = 1; j < pts.length; j++) { var k2 = j / (pts.length - 1); ctx.lineWidth = Math.max(0.6, lerp(w0, w1, k2) * 0.28); ctx.beginPath(); ctx.moveTo(pts[j - 1][0] - 1, pts[j - 1][1] - 1); ctx.lineTo(pts[j][0] - 1, pts[j][1] - 1); ctx.stroke(); }
    ctx.restore();
  }
  /* 길의 앞부분만 (자라는 뿌리) */
  function partial(pts, k) {
    if (k <= 0) return [pts[0]]; if (k >= 1) return pts.slice();
    var L = 0, d = [0]; for (var i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); d.push(L); }
    var want = L * k, out = [pts[0]];
    for (var j = 1; j < pts.length; j++) { if (d[j] <= want) out.push(pts[j]); else { var f = (want - d[j - 1]) / (d[j] - d[j - 1]); out.push([lerp(pts[j - 1][0], pts[j][0], f), lerp(pts[j - 1][1], pts[j][1], f)]); break; } }
    return out;
  }

  /* ---------- 이름표·화살표 ---------- */
  function pill(ctx, text, x, y, o) {
    o = o || {}; var fs = o.size || 18;
    ctx.save(); ctx.font = (o.weight || 800) + ' ' + fs + 'px Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    var lines = String(text).split('\n'), w = 0; lines.forEach(function (l) { w = Math.max(w, ctx.measureText(l).width); });
    var pw = w + (o.px || 14) * 2, ph = lines.length * fs * 1.25 + (o.py || 7) * 2, ax = o.align === 'left' ? x : o.align === 'right' ? x - pw : x - pw / 2, ay = y - ph / 2;
    if (o.shadow !== false) { ctx.shadowColor = 'rgba(20,30,40,.22)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2; }
    ctx.fillStyle = o.bg || 'rgba(255,255,255,.94)'; ctx.beginPath(); ctx.roundRect(ax, ay, pw, ph, o.r == null ? Math.min(14, ph / 2) : o.r); ctx.fill();
    ctx.shadowColor = 'transparent';
    if (o.stroke) { ctx.lineWidth = o.lw || 2; ctx.strokeStyle = o.stroke; ctx.stroke(); }
    ctx.fillStyle = o.fg || '#2a3640'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach(function (l, i) { ctx.fillText(l, ax + pw / 2, ay + (o.py || 7) + fs * 1.25 * (i + 0.5) + 1); });
    ctx.restore();
    return { x: ax, y: ay, w: pw, h: ph };
  }
  function arrowHead(ctx, x, y, ang, s, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.7, -s * 0.75); ctx.lineTo(-s * 0.35, 0); ctx.lineTo(-s * 0.7, s * 0.75); ctx.closePath(); ctx.fill(); ctx.restore(); }
  function arrow(ctx, x0, y0, x1, y1, col, w) { // 곧은 화살표
    var a = Math.atan2(y1 - y0, x1 - x0), s = (w || 5) * 2.6;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w || 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - Math.cos(a) * s * 0.6, y1 - Math.sin(a) * s * 0.6); ctx.stroke(); ctx.restore();
    arrowHead(ctx, x1, y1, a, s, col);
  }
  function badge(ctx, n, x, y, col, r) { ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r || 18, 0, 6.283); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = '900 ' + Math.round((r || 18) * 1.1) + 'px Pretendard, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), x, y + 1); ctx.restore(); }

  /* ---------- 캔버스: 크기 맞추기 + 보일 때만 반복해서 그리기 ----------
     draw(ctx, W, H, t, dt): W·H는 CSS 픽셀 크기. 그림은 fit()으로 설계 좌표에 맞춰요. */
  function visible(el) {
    if (document.hidden) return false;
    try { var f = window.frameElement; if (f && f.hasAttribute('data-page') && !f.classList.contains('on')) return false; } catch (e) {}
    var r = el.getBoundingClientRect(); return r.bottom > -40 && r.top < (window.innerHeight || 800) + 40 && r.width > 0;
  }
  function loop(cv, draw, o) {
    o = o || {}; var ctx = cv.getContext('2d'), W = 1, H = 1, t = 0, last = performance.now(), dirty = true;
    function size() { var r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2); W = Math.max(1, r.width); H = Math.max(1, r.height); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); dirty = true; }
    try { new ResizeObserver(size).observe(cv); } catch (e) { addEventListener('resize', size); }
    size();
    var api = { stop: false, redraw: function () { dirty = true; } };
    function frame(now) {
      requestAnimationFrame(frame);
      var dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (!visible(cv)) return;
      if (REDUCE && !dirty && !o.always) return;
      t += dt; dirty = false;
      ctx.save(); ctx.clearRect(0, 0, W, H); draw(ctx, W, H, t, dt); ctx.restore();
    }
    requestAnimationFrame(frame);
    return api;
  }
  /* 설계 좌표(w0×h0)를 화면 W×H 가운데에 맞춰 넣기 (cover: 꽉 채우고 넘치는 곳은 자름) */
  function fit(ctx, W, H, w0, h0, cover) { var s = cover ? Math.max(W / w0, H / h0) : Math.min(W / w0, H / h0); ctx.translate((W - w0 * s) / 2, (H - h0 * s) / 2); ctx.scale(s, s); return s; }

  return { REDUCE: REDUCE, rng: rng, clamp: clamp, lerp: lerp, ease: ease, seg: seg, pat: pat, path: path, smoothPath: smoothPath, blob: blob, bbox: bbox, rock: rock, crack: crack, rot: rot,
    sky: sky, grass: grass, tree: tree, root: root, partial: partial, pill: pill, arrow: arrow, arrowHead: arrowHead, badge: badge, loop: loop, fit: fit };
})();
