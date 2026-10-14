/* ===== 2D 그림 도구 (ART) =====
   풍화·토양·암석의 순환 그림이 함께 써요. 모든 그림은 정해진 크기(설계 좌표)에 그리고 화면에 맞춰 늘려요.
   - 빛은 언제나 왼쪽 위 앞에서 와요. 입체감: volume(가장자리 안쪽 그늘·밝음), mesh(작은 면마다 빛을 계산하는 입체 그리기)
   - 원근: cab(비스듬히 내려다보는 투영). 덩어리의 앞면·윗면·옆면을 같은 질감으로 그려요(faceImg)
   - 글씨는 캔버스에 쓰지 않고 overlay로 페이지 글꼴(Pretendard) 이름표를 얹어요. */
window.ART = (function () {
  'use strict';
  var REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var lerp = function (a, b, k) { return a + (b - a) * k; };
  var ease = function (k) { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  var seg = function (p, a, b) { return ease((p - a) / (b - a)); };
  // 값 잡음 (모양을 울퉁불퉁하게)
  function hash(i, j, s) { var h = (i * 374761393 + j * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function noise(x, y, s) { var i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return lerp(lerp(hash(i, j, s), hash(i + 1, j, s), u), lerp(hash(i, j + 1, s), hash(i + 1, j + 1, s), u), v); }
  function fbm(x, y, s) { return (noise(x, y, s) * 0.55 + noise(x * 2.1, y * 2.1, s + 7) * 0.3 + noise(x * 4.3, y * 4.3, s + 13) * 0.15); }

  /* ---------- 질감 (한 번 만들어 두고 무늬로 반복) ---------- */
  var cache = {};
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(key, w, h, paint) { if (!cache[key]) { var c = canvas(w, h); paint(c.getContext('2d'), w, h); cache[key] = c; } return cache[key]; }
  function speck(g, w, h, n, r, cols, seed, smin, smax) { for (var i = 0; i < n; i++) { var x = r() * w, y = r() * h, s = smin + r() * (smax - smin); g.fillStyle = cols[Math.floor(r() * cols.length)]; g.beginPath(); g.ellipse(x, y, s, s * (0.55 + r() * 0.45), r() * 3, 0, 6.283); g.fill(); } }
  function mottle(g, w, h, seed, col, a, sc) { // 넓은 얼룩 (단조로운 색을 깨요)
    var id = g.getImageData(0, 0, w, h), d = id.data;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var n = fbm(x / sc, y / sc, seed) - 0.5, k = (y * w + x) * 4; d[k] = clamp(d[k] + n * a * col[0], 0, 255); d[k + 1] = clamp(d[k + 1] + n * a * col[1], 0, 255); d[k + 2] = clamp(d[k + 2] + n * a * col[2], 0, 255); }
    g.putImageData(id, 0, 0);
  }
  var KINDS = {
    granite: function (g, w, h) { // 회백색 바탕에 잘고 고른 알갱이 (멀리서 본 화강암)
      var r = rng(11); g.fillStyle = '#b7b2a8'; g.fillRect(0, 0, w, h); mottle(g, w, h, 3, [1, 1, 0.95], 46, 40);
      speck(g, w, h, 5200, r, ['rgba(236,232,224,.55)', 'rgba(215,205,194,.5)', 'rgba(150,145,138,.35)'], 0, 0.6, 1.8);
      speck(g, w, h, 1100, r, ['rgba(52,48,46,.7)', 'rgba(80,74,70,.55)'], 0, 0.5, 1.3);
      speck(g, w, h, 500, r, ['rgba(190,150,135,.45)'], 0, 0.6, 1.5);
    },
    stone: function (g, w, h) {
      var r = rng(23); g.fillStyle = '#8c877f'; g.fillRect(0, 0, w, h); mottle(g, w, h, 5, [1, 1, 1], 50, 34);
      speck(g, w, h, 3000, r, ['rgba(60,56,52,.3)', 'rgba(200,196,188,.3)', 'rgba(120,104,88,.2)'], 0, 0.5, 1.6);
    },
    lime: function (g, w, h) { // 연한 크림색 석회암, 고운 층
      var r = rng(37); g.fillStyle = '#d9cfb9'; g.fillRect(0, 0, w, h); mottle(g, w, h, 9, [1, 0.95, 0.85], 34, 46);
      for (var y = 0; y < h; y += 5 + r() * 9) { g.fillStyle = 'rgba(' + (r() < 0.5 ? '150,132,100' : '250,244,230') + ',' + (0.07 + r() * 0.1) + ')'; g.fillRect(0, y, w, 1 + r() * 3); }
      speck(g, w, h, 1800, r, ['rgba(140,120,90,.18)', 'rgba(255,255,255,.25)'], 0, 0.4, 1.1);
    },
    humus: function (g, w, h) { var r = rng(41); g.fillStyle = '#3e2c1f'; g.fillRect(0, 0, w, h); mottle(g, w, h, 4, [1, 0.8, 0.6], 40, 22); speck(g, w, h, 2600, r, ['rgba(20,12,6,.35)', 'rgba(110,80,52,.35)', 'rgba(150,120,80,.22)'], 0, 0.5, 1.6); },
    clay: function (g, w, h) { var r = rng(53); g.fillStyle = '#8f5b37'; g.fillRect(0, 0, w, h); mottle(g, w, h, 6, [1, 0.75, 0.55], 44, 30); speck(g, w, h, 1500, r, ['rgba(80,46,24,.22)', 'rgba(190,140,96,.2)'], 0, 0.5, 1.4); },
    sand: function (g, w, h) { var r = rng(61); g.fillStyle = '#b89a6c'; g.fillRect(0, 0, w, h); mottle(g, w, h, 8, [1, 0.9, 0.7], 30, 26); speck(g, w, h, 4200, r, ['rgba(110,84,50,.35)', 'rgba(236,216,172,.45)', 'rgba(160,145,118,.35)'], 0, 0.5, 1.3); },
    grass: function (g, w, h) { // 위에서 본 풀밭
      var r = rng(71); g.fillStyle = '#5f8a3a'; g.fillRect(0, 0, w, h); mottle(g, w, h, 12, [0.6, 1, 0.4], 60, 30);
      for (var i = 0; i < 3800; i++) { var x = r() * w, y = r() * h, L = 2 + r() * 4, a = -1.2 + r() * 0.8; g.strokeStyle = r() < 0.5 ? 'rgba(40,70,20,.35)' : 'rgba(150,185,80,.35)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
    },
    strata: function (g, w, h) { // 퇴적층 (차분한 갈색 띠)
      var r = rng(79), y = 0, cols = ['#b59a76', '#a3845f', '#c4ab86', '#957552', '#b8a07c'];
      while (y < h) { var t = 10 + r() * 22; g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(0, y, w, t); y += t; }
      mottle(g, w, h, 14, [1, 0.9, 0.75], 30, 30); speck(g, w, h, 2400, r, ['rgba(80,56,30,.16)', 'rgba(255,240,210,.18)'], 0, 0.4, 1.2);
    },
  };
  function pat(ctx, kind) { return ctx.createPattern(tex(kind, 256, 256, KINDS[kind]), 'repeat'); }
  function texture(kind) { return tex(kind, 256, 256, KINDS[kind]); }

  /* ---------- 모양 ---------- */
  function path(ctx, P) { ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (var i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]); ctx.closePath(); }
  function smoothPath(ctx, P, open) {
    var n = P.length; ctx.beginPath();
    if (open) { ctx.moveTo(P[0][0], P[0][1]); for (var k = 1; k < n - 1; k++) ctx.quadraticCurveTo(P[k][0], P[k][1], (P[k][0] + P[k + 1][0]) / 2, (P[k][1] + P[k + 1][1]) / 2); ctx.lineTo(P[n - 1][0], P[n - 1][1]); return; }
    var m0 = [(P[n - 1][0] + P[0][0]) / 2, (P[n - 1][1] + P[0][1]) / 2]; ctx.moveTo(m0[0], m0[1]);
    for (var i = 0; i < n; i++) { var a = P[i], b = P[(i + 1) % n]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    ctx.closePath();
  }
  function blob(cx, cy, rx, ry, n, seed, jag) { var r = rng(seed), P = []; for (var i = 0; i < n; i++) { var a = (i / n) * 6.283, k = 1 + (r() - 0.5) * (jag || 0.25); P.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return P; }
  function bbox(P) { var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; P.forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }); return { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0, h: y1 - y0 }; }
  function rot(P, cx, cy, a, dx, dy) { var c = Math.cos(a), s = Math.sin(a); return P.map(function (p) { var x = p[0] - cx, y = p[1] - cy; return [cx + x * c - y * s + (dx || 0), cy + x * s + y * c + (dy || 0)]; }); }
  function partial(pts, k) {
    if (k <= 0) return [pts[0]]; if (k >= 1) return pts.slice();
    var L = 0, d = [0]; for (var i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); d.push(L); }
    var want = L * k, out = [pts[0]];
    for (var j = 1; j < pts.length; j++) { if (d[j] <= want) out.push(pts[j]); else { var f = (want - d[j - 1]) / (d[j] - d[j - 1]); out.push([lerp(pts[j - 1][0], pts[j][0], f), lerp(pts[j - 1][1], pts[j][1], f)]); break; } }
    return out;
  }

  /* ---------- 입체감 ---------- */
  // 땅에 드리운 부드러운 그림자
  function shadow(ctx, cx, cy, rx, ry, a) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, ry / rx);
    var g = ctx.createRadialGradient(0, 0, rx * 0.1, 0, 0, rx); g.addColorStop(0, 'rgba(30,24,16,' + (a == null ? 0.38 : a) + ')'); g.addColorStop(0.6, 'rgba(30,24,16,' + 0.6 * (a == null ? 0.38 : a) + ')'); g.addColorStop(1, 'rgba(30,24,16,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.283); ctx.fill(); ctx.restore();
  }
  // 질감 + 빛(왼쪽 위) + 둥근 가장자리 그늘로 덩어리를 입체로 그려요
  function volume(ctx, P, kind, o) {
    o = o || {}; var b = bbox(P), R = Math.max(b.w, b.h), sp = o.smooth === false ? path : smoothPath;
    ctx.save(); sp(ctx, P); ctx.fillStyle = o.color || pat(ctx, kind || 'stone'); ctx.fill(); ctx.clip();
    if (o.tint) { ctx.fillStyle = o.tint; ctx.fillRect(b.x0 - 2, b.y0 - 2, b.w + 4, b.h + 4); }
    if (o.deco) o.deco(ctx, b);
    var g = ctx.createLinearGradient(b.x0, b.y0, b.x0 + b.w * 0.75, b.y1); g.addColorStop(0, 'rgba(255,250,240,' + (o.hi == null ? 0.26 : o.hi) + ')'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(25,18,10,' + (o.lo == null ? 0.42 : o.lo) + ')');
    ctx.fillStyle = g; ctx.fillRect(b.x0 - 2, b.y0 - 2, b.w + 4, b.h + 4);
    // 가장자리 안쪽: 오른쪽 아래는 어둡게, 왼쪽 위는 밝게 (둥근 덩어리처럼)
    var big = [[b.x0 - R, b.y0 - R], [b.x1 + R, b.y0 - R], [b.x1 + R, b.y1 + R], [b.x0 - R, b.y1 + R]];
    function rim(col, ox, oy, blur) { ctx.save(); ctx.beginPath(); ctx.moveTo(big[0][0], big[0][1]); big.forEach(function (q) { ctx.lineTo(q[0], q[1]); }); ctx.closePath(); var Q = P.slice().reverse(); ctx.moveTo(Q[0][0], Q[0][1]); Q.forEach(function (q) { ctx.lineTo(q[0], q[1]); }); ctx.closePath(); ctx.shadowColor = col; ctx.shadowBlur = blur; ctx.shadowOffsetX = ox; ctx.shadowOffsetY = oy; ctx.fillStyle = '#000'; ctx.fill('evenodd'); ctx.restore(); }
    var k = o.round == null ? 1 : o.round;
    rim('rgba(20,14,8,' + 0.55 * k + ')', -R * 0.05, -R * 0.07, R * 0.16);
    rim('rgba(255,250,235,' + 0.45 * k + ')', R * 0.04, R * 0.05, R * 0.1);
    // 아래쪽 바닥 닿는 곳(어둡게)
    var ag = ctx.createLinearGradient(0, b.y1 - b.h * 0.18, 0, b.y1); ag.addColorStop(0, 'rgba(20,14,8,0)'); ag.addColorStop(1, 'rgba(20,14,8,' + (o.ao == null ? 0.35 : o.ao) + ')'); ctx.fillStyle = ag; ctx.fillRect(b.x0 - 2, b.y1 - b.h * 0.18, b.w + 4, b.h * 0.18 + 2);
    ctx.restore();
    if (o.edge !== false) { ctx.save(); sp(ctx, P); ctx.lineWidth = o.lw || 1.2; ctx.strokeStyle = 'rgba(40,32,24,.4)'; ctx.stroke(); ctx.restore(); }
  }
  // 틈 (가는 그늘 + 밝은 가장자리)
  function crack(ctx, pts, w) {
    ctx.save(); ctx.lineJoin = ctx.lineCap = 'round';
    ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
    ctx.strokeStyle = 'rgba(255,248,236,.35)'; ctx.lineWidth = (w || 2) + 1.6; ctx.translate(0.8, 0.8); ctx.stroke(); ctx.translate(-0.8, -0.8);
    ctx.strokeStyle = 'rgba(30,22,16,.85)'; ctx.lineWidth = w || 2; ctx.stroke(); ctx.restore();
  }

  /* ---------- 원근: 비스듬히 내려다보기 (앞면 그대로, 깊이는 오른쪽 위로) ---------- */
  function cab(ox, oy, s, kx, ky) {
    kx = kx == null ? 0.46 : kx; ky = ky == null ? 0.32 : ky;
    var c = { ox: ox, oy: oy, s: s, kx: kx, ky: ky };
    c.p = function (x, y, z) { return [ox + (x + z * kx) * s, oy - (y + z * ky) * s]; };
    c.view = [-kx, -ky, 1]; // 이 방향으로 멀어져요
    return c;
  }
  /* 작은 면(사각형)마다 빛을 계산해 그리는 입체 그리기. quads: {v:[[x,y,z]×4], c:[r,g,b], n?:[x,y,z]} */
  var LIGHT = (function () { var l = [-0.5, 0.72, -0.48], n = Math.hypot(l[0], l[1], l[2]); return [l[0] / n, l[1] / n, l[2] / n]; })();
  function faceNormal(v) {
    var a = [v[2][0] - v[0][0], v[2][1] - v[0][1], v[2][2] - v[0][2]], b = [v[3][0] - v[1][0], v[3][1] - v[1][1], v[3][2] - v[1][2]];
    var n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], L = Math.hypot(n[0], n[1], n[2]) || 1; return [n[0] / L, n[1] / L, n[2] / L];
  }
  function mesh(ctx, cam, quads, o) {
    o = o || {}; var V = cam.view, list = [];
    quads.forEach(function (q) {
      var n = q.n || faceNormal(q.v); if (o.cull !== false && n[0] * V[0] + n[1] * V[1] + n[2] * V[2] > 0.02) return;
      var cx = 0, cy = 0, cz = 0; q.v.forEach(function (p) { cx += p[0]; cy += p[1]; cz += p[2]; });
      list.push({ q: q, n: n, d: (cx * V[0] + cy * V[1] + cz * V[2]) / 4 });
    });
    list.sort(function (a, b) { return b.d - a.d; });
    var amb = o.amb == null ? 0.42 : o.amb, dif = o.dif == null ? 0.7 : o.dif;
    list.forEach(function (it) {
      var q = it.q, n = it.n, k = amb + dif * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
      var sp = Math.pow(Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]), 14) * (o.spec || 0);
      var c = q.c, col = 'rgb(' + Math.round(clamp(c[0] * k + 255 * sp, 0, 255)) + ',' + Math.round(clamp(c[1] * k + 255 * sp, 0, 255)) + ',' + Math.round(clamp(c[2] * k + 255 * sp, 0, 255)) + ')';
      ctx.beginPath(); q.v.forEach(function (p, i) { var s = cam.p(p[0], p[1], p[2]); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath();
      ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 0.9; ctx.stroke();
    });
  }
  /* 입체 그리기 + 질감: 따로 그린 뒤 질감 무늬를 곱해 얹어요 */
  var mtx = null;
  function meshTex(ctx, cam, quads, kind, o) {
    var tr = ctx.getTransform(), cw = ctx.canvas.width, ch = ctx.canvas.height;
    if (!mtx) mtx = [canvas(cw, ch), canvas(cw, ch)];
    mtx.forEach(function (m) { if (m.width !== cw || m.height !== ch) { m.width = cw; m.height = ch; } });
    var g = mtx[0].getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cw, ch); g.setTransform(tr); mesh(g, cam, quads, o);
    var g2 = mtx[1].getContext('2d'); g2.setTransform(1, 0, 0, 1, 0, 0); g2.clearRect(0, 0, cw, ch); g2.globalCompositeOperation = 'source-over'; g2.setTransform(tr); g2.fillStyle = g2.createPattern(texture(kind), 'repeat'); g2.fillRect(-500, -500, 2000, 2000);
    g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalCompositeOperation = 'destination-in'; g2.drawImage(mtx[0], 0, 0); g2.globalCompositeOperation = 'source-over';
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.globalAlpha = o && o.texA != null ? o.texA : 0.85; g.drawImage(mtx[1], 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'destination-in'; g.drawImage(mtx[1], 0, 0); g.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(mtx[0], 0, 0); ctx.restore();
  }
  /* 평면 그림(img: 가로 w, 세로 h)을 3D 사각형 면 a(왼쪽 위)·b(오른쪽 위)·d(왼쪽 아래)에 붙여요 */
  function faceImg(ctx, cam, img, a, b, d, shade) {
    var A = cam.p(a[0], a[1], a[2]), B = cam.p(b[0], b[1], b[2]), D = cam.p(d[0], d[1], d[2]), w = img.width, h = img.height;
    ctx.save(); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(B[0] + D[0] - A[0], B[1] + D[1] - A[1]); ctx.lineTo(D[0], D[1]); ctx.closePath(); ctx.clip();
    ctx.transform((B[0] - A[0]) / w, (B[1] - A[1]) / w, (D[0] - A[0]) / h, (D[1] - A[1]) / h, A[0], A[1]); ctx.drawImage(img, 0, 0);
    ctx.restore();
    if (shade) { ctx.save(); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(B[0] + D[0] - A[0], B[1] + D[1] - A[1]); ctx.lineTo(D[0], D[1]); ctx.closePath(); ctx.fillStyle = shade; ctx.fill(); ctx.restore(); }
  }

  /* ---------- 하늘·구름·먼 산·풀 ---------- */
  function sky(ctx, x, y, w, h, top, bot) { var g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); }
  function cloud(ctx, x, y, s, a) { // 부드러운 뭉게구름
    ctx.save(); ctx.globalAlpha = a == null ? 1 : a; var r = rng(Math.round(x * 7 + y));
    for (var i = 0; i < 9; i++) { var px = x + (r() - 0.5) * 90 * s, py = y + (r() - 0.6) * 22 * s, R = (18 + r() * 22) * s; var g = ctx.createRadialGradient(px - R * 0.3, py - R * 0.4, R * 0.1, px, py, R); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.7, 'rgba(236,240,245,.8)'); g.addColorStop(1, 'rgba(220,228,236,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, R, 0, 6.283); ctx.fill(); }
    ctx.restore();
  }
  function ridge(ctx, y, amp, x0, x1, seed, col, bot) { // 먼 산줄기
    ctx.beginPath(); ctx.moveTo(x0, bot); for (var x = x0; x <= x1; x += 8) ctx.lineTo(x, y - amp * fbm(x / 120, 0.5, seed) - amp * 0.4 * fbm(x / 40, 1.5, seed + 3)); ctx.lineTo(x1, bot); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  }
  /* 원근 풀밭: y가 클수록(가까울수록) 풀이 크고 진해요. keep(x,y)로 빼고 싶은 곳을 걸러요 */
  var grassCache = {};
  function grassField(ctx, x0, x1, yFar, yNear, t, o) {
    o = o || {}; var key = [x0, x1, yFar, yNear, o.n || 400, o.seed || 1].join(','), B = grassCache[key];
    if (!B) { var r = rng(o.seed || 1); B = []; for (var i = 0; i < (o.n || 400); i++) { var y = lerp(yFar, yNear, Math.pow(r(), 0.7)); B.push([x0 + r() * (x1 - x0), y, r(), r(), r()]); } B.sort(function (a, b) { return a[1] - b[1]; }); grassCache[key] = B; }
    var sc = o.scale == null ? 1 : o.scale; if (sc <= 0.01) return;
    ctx.save(); ctx.lineCap = 'round';
    B.forEach(function (b) {
      if (o.keep && !o.keep(b[0], b[1])) return;
      var k = (b[1] - yFar) / Math.max(1, yNear - yFar), hh = (o.h || 14) * (0.35 + 0.65 * k) * (0.6 + b[2] * 0.8) * sc, sw = (REDUCE ? 0 : Math.sin(t * 1.5 + b[0] * 0.05) * 2) * (0.4 + k) + (b[3] - 0.5) * 6 * k;
      var gr = Math.round(lerp(120, 70, k) + b[4] * 30), rr = Math.round(lerp(120, 60, k) + b[4] * 25), bb = Math.round(lerp(90, 30, k));
      ctx.strokeStyle = 'rgba(' + rr + ',' + (gr + 40) + ',' + bb + ',' + (0.55 + 0.4 * k) + ')'; ctx.lineWidth = 0.7 + 1.3 * k;
      for (var j = 0; j < 3; j++) { var dx = (j - 1) * 2.2 * (0.5 + k); ctx.beginPath(); ctx.moveTo(b[0] + dx, b[1]); ctx.quadraticCurveTo(b[0] + dx + sw * 0.3 + (j - 1) * 2, b[1] - hh * 0.55, b[0] + dx + sw + (j - 1) * 4 * k, b[1] - hh * (0.8 + 0.2 * ((j + b[2] * 3) % 1))); ctx.stroke(); }
    });
    ctx.restore();
  }

  /* ---------- 나무: 굵기가 가늘어지는 줄기·가지 + 잎 수백 장 (미리 그려 둔 그림을 써요) ---------- */
  var treeCache = {};
  function taper(g, pts, w0, w1, colL, colR) { // 가늘어지는 가지 하나
    var L = [], R = [];
    for (var i = 0; i < pts.length; i++) { var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, i / (pts.length - 1)) / 2; L.push([pts[i][0] - dy / n * w, pts[i][1] + dx / n * w]); R.push([pts[i][0] + dy / n * w, pts[i][1] - dx / n * w]); }
    var bx = bbox(L.concat(R)), gr = g.createLinearGradient(bx.x0, 0, bx.x1, 0); gr.addColorStop(0, colL || '#7a5a3c'); gr.addColorStop(1, colR || '#3b2717');
    g.beginPath(); g.moveTo(L[0][0], L[0][1]); L.forEach(function (p) { g.lineTo(p[0], p[1]); }); R.slice().reverse().forEach(function (p) { g.lineTo(p[0], p[1]); }); g.closePath(); g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(30,18,8,.25)'; g.lineWidth = 0.6; g.stroke();
  }
  function makeTree(seed, H) {
    var key = seed + ':' + H; if (treeCache[key]) return treeCache[key];
    var W = Math.round(H * 1.25), c = canvas(W, Math.round(H * 1.08)), g = c.getContext('2d'), r = rng(seed), bx = W / 2, by = c.height - 2, tips = [];
    function branch(x, y, ang, len, w, d) {
      var pts = [[x, y]], a = ang, px = x, py = y;
      for (var i = 0; i < 5; i++) { a += (r() - 0.5) * 0.35; px += Math.cos(a) * len / 5; py += Math.sin(a) * len / 5; pts.push([px, py]); }
      taper(g, pts, w, w * 0.6, '#8a6a48', '#3a2616');
      if (d >= 3 || w < 2) { tips.push([px, py, w]); tips.push([pts[3][0], pts[3][1], w]); return; }
      var n = d === 0 ? 3 : 2 + (r() < 0.5 ? 1 : 0);
      for (var k = 0; k < n; k++) { var at = pts[2 + Math.floor(r() * 3)], sp = (k / Math.max(1, n - 1) - 0.5) * (d === 0 ? 1.6 : 1.3); branch(at[0], at[1], -Math.PI / 2 + sp + (r() - 0.5) * 0.3, len * (0.62 + r() * 0.12), w * 0.58, d + 1); }
    }
    branch(bx, by, -Math.PI / 2 + (r() - 0.5) * 0.1, H * 0.42, H * 0.075, 0);
    // 잎 덩어리: 바깥 그늘 → 가운데 → 밝은 앞쪽 순서로 잎을 겹쳐요
    var cx = 0, cy = 0; tips.forEach(function (t) { cx += t[0]; cy += t[1]; }); cx /= tips.length; cy /= tips.length;
    var layers = [[0.0, 'dark'], [0.0, 'mid'], [0.0, 'lit']];
    layers.forEach(function (L, li) {
      tips.forEach(function (tp) {
        var n = 26 - li * 6, spread = H * (0.16 - li * 0.025);
        for (var i = 0; i < n; i++) {
          var a = r() * 6.283, d = Math.sqrt(r()) * spread, x = tp[0] + Math.cos(a) * d * 1.2 + (li === 2 ? -H * 0.03 : 0), y = tp[1] + Math.sin(a) * d * 0.85 - H * 0.02 - (li === 2 ? H * 0.03 : 0);
          var lightK = clamp(0.5 + ((cx - x) * 0.6 + (cy - y)) / (H * 0.6), 0, 1), base = li === 0 ? 0.25 : li === 1 ? 0.5 : 0.8, k = clamp(base * 0.6 + lightK * 0.5, 0, 1);
          var R = Math.round(lerp(38, 140, k)), G = Math.round(lerp(64, 172, k)), B = Math.round(lerp(26, 66, k));
          g.save(); g.translate(x, y); g.rotate(r() * 6.283); var s = H * (0.018 + r() * 0.012);
          g.fillStyle = 'rgb(' + R + ',' + G + ',' + B + ')'; g.beginPath(); g.ellipse(0, 0, s * 1.6, s * 0.75, 0, 0, 6.283); g.fill();
          g.strokeStyle = 'rgba(20,40,10,.25)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(-s * 1.4, 0); g.lineTo(s * 1.4, 0); g.stroke(); g.restore();
        }
      });
    });
    var T = { img: c, bx: bx, by: by, H: H }; treeCache[key] = T; return T;
  }
  // 나무 그리기: (x, y) 뿌리 위치, size(0~1), 바람에 흔들림
  function tree(ctx, x, y, size, t, o) {
    o = o || {}; if (size <= 0.01) return; var T = makeTree(o.seed || 9, o.h || 200), s = size * (o.scale || 1);
    if (o.shadow !== false) shadow(ctx, x + T.H * 0.28 * s, y + 4 * s, T.H * 0.42 * s, T.H * 0.09 * s, 0.25);
    ctx.save(); ctx.translate(x, y); ctx.rotate(REDUCE ? 0 : Math.sin(t * 0.9 + (o.seed || 0)) * 0.012); ctx.scale(s, s);
    if (o.haze) ctx.globalAlpha = 1 - o.haze; ctx.drawImage(T.img, -T.bx, -T.by); ctx.restore();
  }
  function sprout(ctx, x, y, k) { // 새싹
    if (k <= 0.01) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.strokeStyle = '#4f7a2a'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(1, -8, 0, -15); ctx.stroke();
    [[-1, -0.5], [1, 0.5]].forEach(function (q) { var g = ctx.createLinearGradient(0, -15, q[0] * 9, -18); g.addColorStop(0, '#5f9433'); g.addColorStop(1, '#9cc65a'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(q[0] * 5, -16, 6, 2.8, q[1], 0, 6.283); ctx.fill(); }); ctx.restore();
  }
  /* 가늘어지는 뿌리 (나무껍질 빛과 그림자) */
  function root(ctx, pts, w0, w1) {
    if (pts.length < 2) return;
    ctx.save(); ctx.translate(1.5, 2); ctx.globalAlpha = 0.28; taper(ctx, pts, w0, w1, '#1d140c', '#1d140c'); ctx.restore();
    taper(ctx, pts, w0, w1, '#9a7350', '#4b3220');
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(235,205,160,.35)'; for (var i = 1; i < pts.length; i++) { var k = i / (pts.length - 1); ctx.lineWidth = Math.max(0.5, lerp(w0, w1, k) * 0.18); ctx.beginPath(); ctx.moveTo(pts[i - 1][0] - lerp(w0, w1, k) * 0.2, pts[i - 1][1] - lerp(w0, w1, k) * 0.2); ctx.lineTo(pts[i][0] - lerp(w0, w1, k) * 0.2, pts[i][1] - lerp(w0, w1, k) * 0.2); ctx.stroke(); } ctx.restore();
  }

  /* ---------- 화살표 (부드러운 그림자, 흰 테두리) ---------- */
  function arrowHead(ctx, x, y, ang, s, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.75, -s * 0.72); ctx.quadraticCurveTo(-s * 0.35, 0, -s * 0.75, s * 0.72); ctx.closePath(); ctx.fill(); ctx.restore(); }
  function arrow(ctx, x0, y0, x1, y1, col, w) {
    var a = Math.atan2(y1 - y0, x1 - x0), s = (w || 5) * 2.4;
    ctx.save(); ctx.shadowColor = 'rgba(20,20,20,.3)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1.5;
    ctx.strokeStyle = col; ctx.lineWidth = w || 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - Math.cos(a) * s * 0.6, y1 - Math.sin(a) * s * 0.6); ctx.stroke();
    arrowHead(ctx, x1, y1, a, s, col); ctx.restore();
  }

  /* ---------- 캔버스: 크기 맞추기 + 보일 때만 반복해서 그리기 ----------
     draw(ctx, W, H, t, dt)가 이름표 목록을 돌려주면 o.after(목록, 맞춤 정보)를 불러요 */
  function visible(el) {
    if (document.hidden) return false;
    try { var f = window.frameElement; if (f && f.hasAttribute('data-page') && !f.classList.contains('on')) return false; } catch (e) {}
    var r = el.getBoundingClientRect(); return r.bottom > -40 && r.top < (window.innerHeight || 800) + 40 && r.width > 0;
  }
  var lastFit = { s: 1, ox: 0, oy: 0 };
  function loop(cv, draw, o) {
    o = o || {}; var ctx = cv.getContext('2d'), W = 1, H = 1, t = 0, last = performance.now(), dirty = true;
    function size() { var r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2); W = Math.max(1, r.width); H = Math.max(1, r.height); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); dirty = true; }
    try { new ResizeObserver(size).observe(cv); } catch (e) { addEventListener('resize', size); }
    size();
    var api = { redraw: function () { dirty = true; } };
    function frame(now) {
      requestAnimationFrame(frame);
      var dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (!visible(cv)) return;
      if (REDUCE && !dirty && !o.always) return;
      t += dt; dirty = false;
      ctx.save(); ctx.clearRect(0, 0, W, H); var res = draw(ctx, W, H, t, dt); ctx.restore();
      if (o.after) o.after(res || {}, { s: lastFit.s, ox: lastFit.ox, oy: lastFit.oy });
    }
    requestAnimationFrame(frame);
    return api;
  }
  /* 설계 좌표(w0×h0)를 화면 W×H 가운데에 맞춰 넣기 (cover: 꽉 채우고 넘치는 곳은 자름) */
  function fit(ctx, W, H, w0, h0, cover) { var s = cover ? Math.max(W / w0, H / h0) : Math.min(W / w0, H / h0), ox = (W - w0 * s) / 2, oy = (H - h0 * s) / 2; ctx.translate(ox, oy); ctx.scale(s, s); lastFit = { s: s, ox: ox, oy: oy }; return s; }
  /* 이름표: 캔버스 위에 페이지 글꼴로 얹어요. items: [{k, t, x, y, cls, at:'c'|'l'|'r'}] (x, y는 설계 좌표) */
  function overlay(wrap) {
    var box = document.createElement('div'); box.className = 'ovl'; wrap.appendChild(box); var pool = {};
    return {
      set: function (items, f) {
        var seen = {}, k = clamp(0.42 + f.s * 0.75, 0.74, 1); if (box._k !== k) { box.style.setProperty('--k', k.toFixed(3)); box._k = k; }
        (items || []).forEach(function (it) {
          var el = pool[it.k]; if (!el) { el = document.createElement('span'); pool[it.k] = el; box.appendChild(el); }
          seen[it.k] = 1; if (el._t !== it.t) { el.innerHTML = it.t; el._t = it.t; } var cls = 'tag ' + (it.cls || '') + ' at-' + (it.at || 'c'); if (el.className !== cls) el.className = cls;
          el.style.left = (f.ox + it.x * f.s).toFixed(1) + 'px'; el.style.top = (f.oy + it.y * f.s).toFixed(1) + 'px'; el.style.display = '';
        });
        Object.keys(pool).forEach(function (k) { if (!seen[k]) pool[k].style.display = 'none'; });
      },
    };
  }

  return { REDUCE: REDUCE, rng: rng, clamp: clamp, lerp: lerp, ease: ease, seg: seg, noise: noise, fbm: fbm, canvas: canvas, pat: pat, texture: texture,
    path: path, smoothPath: smoothPath, blob: blob, bbox: bbox, rot: rot, partial: partial, shadow: shadow, volume: volume, crack: crack,
    cab: cab, mesh: mesh, meshTex: meshTex, faceNormal: faceNormal, faceImg: faceImg, sky: sky, cloud: cloud, ridge: ridge, grassField: grassField,
    makeTree: makeTree, tree: tree, sprout: sprout, root: root, taper: taper, arrow: arrow, arrowHead: arrowHead, loop: loop, fit: fit, fitInfo: function () { return { s: lastFit.s, ox: lastFit.ox, oy: lastFit.oy }; }, overlay: overlay, LIGHT: LIGHT };
})();
