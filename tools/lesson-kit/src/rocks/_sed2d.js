/* ===== 퇴적물 2D 도구 =====
   - pack: 퇴적물 알갱이를 바닥(또는 이미 쌓인 층) 위에 하나씩 떨어뜨려 쌓아요. 알갱이는 낮은 곳으로 굴러가 자리를 잡아요(높이 지도 방식).
   - grain: 알갱이 하나를 그려요(울퉁불퉁한 둥근 모양, 빛 받는 쪽이 밝게).
   - 크기·개수·떨어지는 빠르기는 개념 이해를 위한 모형이에요. 숫자로 나타내지 않아요. */
window.SED2D = (function () {
  'use strict';
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  /* 퇴적물 종류: 크기(r), 색, 모양 */
  var KIND = {
    gravel: { r: [6.5, 12], cols: ['#8d8a86', '#b8b2a8', '#6f6a66', '#a77a5c', '#cfc6b6', '#5d5956', '#9c8a6e'], round: 0.82, name: '자갈' },
    sand: { r: [2.1, 3.0], cols: ['#d9b47a', '#e3c48e', '#c99a5c', '#efd9a8', '#b98a52', '#f2ede2'], round: 0.75, name: '모래' },
    mud: { r: [0.9, 1.25], cols: ['#8a7a66', '#7a6b5a', '#9a8a74', '#6e6152'], round: 0.7, name: '진흙' },
    lime: { r: [2.0, 4.2], cols: ['#f3eee2', '#e8e0cc', '#fbf8f0', '#dcd2bc'], round: 0.6, shell: true, name: '석회 물질' },
    fossil: { r: [10, 11], cols: ['#efe6d2'], round: 0.7, shell: true, name: '조개' },
    mix: { r: [3.2, 7.5], cols: ['#a8693e', '#c07d48', '#8f5a36', '#b5875a', '#d39a62', '#7e5636'], round: 0.8, name: '퇴적물' },
  };
  function heightMap(W, dx) { var n = Math.ceil(W / dx) + 1, h = new Float32Array(n); return { W: W, dx: dx, h: h }; }
  function restY(H, x, r) {
    var dx = H.dx, c0 = Math.max(0, Math.floor((x - r) / dx)), c1 = Math.min(H.h.length - 1, Math.ceil((x + r) / dx)), y = r;
    for (var c = c0; c <= c1; c++) { var d = c * dx - x; if (Math.abs(d) >= r) continue; var yy = H.h[c] + Math.sqrt(r * r - d * d); if (yy > y) y = yy; }
    return y;
  }
  function stamp(H, x, y, r, k) {
    var dx = H.dx, c0 = Math.max(0, Math.floor((x - r) / dx)), c1 = Math.min(H.h.length - 1, Math.ceil((x + r) / dx));
    for (var c = c0; c <= c1; c++) { var d = c * dx - x; if (Math.abs(d) >= r) continue; var top = y + Math.sqrt(r * r - d * d) * k; if (top > H.h[c]) H.h[c] = top; }
  }
  /* 알갱이 n개를 쌓아요. 결과: 놓인 차례대로 [{x,y,r,col,pts,rot,kind,t}] (t = 떨어지기 시작하는 순서) */
  function pack(H, kind, n, seed, o) {
    o = o || {};
    var K = KIND[kind], R = rng(seed || 7), out = [], W = H.W;
    for (var i = 0; i < n; i++) {
      var r = K.r[0] + (K.r[1] - K.r[0]) * Math.pow(R(), o.skew || 1.4);
      var x = r + R() * (W - 2 * r), y = restY(H, x, r);
      // 낮은 쪽으로 굴러가기
      for (var it = 0; it < 14; it++) {
        var st = r * 0.35, yl = x - st > r ? restY(H, x - st, r) : 1e9, yr = x + st < W - r ? restY(H, x + st, r) : 1e9;
        if (yl < y - 0.02 * r && yl <= yr) { x -= st; y = yl; } else if (yr < y - 0.02 * r) { x += st; y = yr; } else break;
      }
      stamp(H, x, y, r, o.interlock == null ? 0.86 : o.interlock);
      var pts = [], m = 9 + (R() * 3 | 0);
      for (var j = 0; j < m; j++) pts.push(K.round + (1 - K.round) * 0.5 + (R() - 0.5) * (1 - K.round) * 1.6);
      out.push({ x: x, y: y, r: r, col: K.cols[(R() * K.cols.length) | 0], pts: pts, rot: R() * 6.28, kind: kind, shell: K.shell && R() < 0.55, sx: o.flat ? 1.25 : 1, i: i });
    }
    return out;
  }
  function shade(hex, k) { var n = parseInt(hex.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; var f = function (v) { return Math.max(0, Math.min(255, Math.round(v * k))); }; return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')'; }
  /* 알갱이 그리기: (cx, cy)는 화면 좌표, s = 화면 배율 */
  function grain(c, p, cx, cy, s, simple) {
    var r = p.r * s;
    if (simple || r < 1.6) { c.fillStyle = p.col; c.beginPath(); c.arc(cx, cy, Math.max(0.8, r), 0, 6.283); c.fill(); return; }
    c.save(); c.translate(cx, cy); c.rotate(p.rot);
    if (p.shell && r > 2.5) { // 조개껍데기 조각: 부채꼴 + 줄무늬
      c.beginPath(); c.moveTo(0, r * 0.5); c.arc(0, r * 0.5, r * 1.15, -Math.PI * 0.85, -Math.PI * 0.15); c.closePath();
      var gs = c.createLinearGradient(0, -r, 0, r); gs.addColorStop(0, '#fffdf6'); gs.addColorStop(1, shade(p.col, 0.82)); c.fillStyle = gs; c.fill();
      c.strokeStyle = 'rgba(120,100,70,.45)'; c.lineWidth = Math.max(0.6, r * 0.08);
      for (var k = 1; k < 5; k++) { var a = -Math.PI * 0.85 + k * Math.PI * 0.14; c.beginPath(); c.moveTo(0, r * 0.5); c.lineTo(Math.cos(a) * r * 1.1, r * 0.5 + Math.sin(a) * r * 1.1); c.stroke(); }
      c.restore(); return;
    }
    var m = p.pts.length; c.beginPath();
    for (var i = 0; i <= m; i++) {
      var a0 = (i / m) * 6.283, a1 = ((i + 0.5) / m) * 6.283, k0 = p.pts[i % m], k1 = (p.pts[i % m] + p.pts[(i + 1) % m]) / 2;
      var x0 = Math.cos(a0) * r * k0 * p.sx, y0 = Math.sin(a0) * r * k0, x1 = Math.cos(a1) * r * k1 * p.sx, y1 = Math.sin(a1) * r * k1;
      if (i === 0) c.moveTo((x0 + x1) / 2, (y0 + y1) / 2); else c.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    }
    c.closePath();
    var g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.15);
    g.addColorStop(0, shade(p.col, 1.18)); g.addColorStop(0.55, p.col); g.addColorStop(1, shade(p.col, 0.62));
    c.fillStyle = g; c.fill();
    if (r > 3) { c.strokeStyle = 'rgba(40,28,18,.35)'; c.lineWidth = Math.max(0.6, r * 0.05); c.stroke(); }
    if (r > 6) { c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(-r * 0.3, -r * 0.35, r * 0.28, r * 0.16, -0.6, 0, 6.283); c.fill(); }
    c.restore();
  }
  /* 높이 지도의 윗면을 따라가는 경로 (기공 물·물질 채우기용) */
  function topPath(c, H, X, Y, sx, sy, c0) {
    c.beginPath(); c.moveTo(X(0), Y(0));
    for (var i = 0; i < H.h.length; i++) c.lineTo(X(i * H.dx), Y(H.h[i] * (c0 || 1)));
    c.lineTo(X(H.W), Y(0)); c.closePath();
  }
  return { KIND: KIND, rng: rng, heightMap: heightMap, pack: pack, grain: grain, shade: shade, topPath: topPath, restY: restY };
})();
