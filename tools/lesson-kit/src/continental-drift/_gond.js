/* ===== 대륙 이동의 증거 자료 (EVID) + 평면 대륙 조각판 (GOND) =====
   - 모든 증거는 '대륙을 맞춘 때(판게아)' 좌표로 적어요. GLOBE.at(대륙, 경도, 위도)는 그 대륙의 지금 지점이 맞춘 때 어디 있었는지 알려 줘요.
   - 그래서 대륙을 맞추면 화석 띠와 빙하 흔적이 저절로 이어져요. (개념 이해를 위한 모형, 분포 범위는 단순하게 그렸어요) */
window.EVID = (function () {
  'use strict';
  var A = GLOBE.at;
  /* 화석 분포 띠: 교과서 그림 Ⅱ-14 ②처럼 색 띠로. name이 빈 것은 교과서에 이름이 없는 생물이라 '다른 생물 화석'으로만 보여 줘요 */
  var FOSSIL = [
    { id: 'cyno', name: '', col: '#e2673f', w: 5.5, lines: [[A('sa', -66, -30), A('sa', -58, -28), A('af', 17, -27), A('af', 27, -27.5)]] },
    { id: 'glosso', name: '글로소프테리스', col: '#4f9fe0', w: 6, lines: [[A('sa', -53, -33), A('af', 22, -31), A('af', 31, -25), A('mad', 46.5, -21), A('ind', 78, 17), A('ind', 85, 23)], [A('af', 31, -25), A('ant', 40, -80), A('ant', 110, -78), A('aus', 128, -29), A('aus', 145, -27)]] },
    { id: 'lystro', name: '', col: '#f3a531', w: 5.5, lines: [[A('af', 26, -24), A('mad', 45, -15), A('ind', 80, 22)], [A('af', 29, -29), A('ant', 25, -76), A('ant', 70, -83), A('ant', 160, -84)]] },
    { id: 'meso', name: '메소사우루스', col: '#76c06b', w: 4.6, lines: [[A('sa', -52, -26), A('sa', -49, -25), A('af', 15, -24.5), A('af', 19, -25.5)]] },
  ];
  /* 빙하 흔적: 흔적이 있는 곳(흰 얼룩)과 빙하가 흘러간 방향(화살표). 맞추면 한 곳에서 퍼져 나간 모양이 돼요 */
  var GL = [
    ['sa', -51, -27], ['sa', -57, -33], ['af', 25, -28], ['af', 19, -23], ['af', 30, -22], ['mad', 45.5, -23], ['ind', 80, 21], ['ind', 77, 14], ['ant', 20, -78], ['ant', 70, -76], ['aus', 118, -26], ['aus', 139, -34], ['aus', 125, -31],
  ];
  var C0 = A('ant', 30, -80); // 빙하가 퍼져 나간 가운데
  var vec = GLOBE.vec, ll = GLOBE.ll;
  function toward(from, to, f) { var a = vec(from[0], from[1]), b = vec(to[0], to[1]), v = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f], L = Math.hypot(v[0], v[1], v[2]); return ll([v[0] / L, v[1] / L, v[2] / L]); }
  var GLACIER = GL.map(function (g) {
    var p = A(g[0], g[1], g[2]), d = Math.acos(Math.max(-1, Math.min(1, (function (a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; })(vec(C0[0], C0[1]), vec(p[0], p[1]))))) / GLOBE.D;
    var back = d > 1 ? toward(C0, p, (d - 3.2) / d) : p, fwd = d > 1 ? toward(C0, p, (d + 3.2) / d) : p;
    return { plate: g[0], at: p, from: back, to: fwd };
  });
  function circle(c, r) { var out = []; for (var b = 0; b < 360; b += 30) out.push(GLOBE.dest(c, b, r)); return out; }
  /* 지구본(GLOBE.draw)에 넘길 도형 목록 */
  var ALLP = ['sa', 'af', 'mad', 'ind', 'ant', 'aus'];
  function globeShapes(kind) {
    var out = [];
    if (kind === 'fossil') FOSSIL.forEach(function (f) { f.lines.forEach(function (L) { out.push({ plates: ALLP, pts: L, open: true, band: f.w, stroke: f.col, alpha: 0.9 }); }); });
    if (kind === 'glacier') GLACIER.forEach(function (g) {
      out.push({ plates: [g.plate], pts: circle(g.at, 4.2), fill: 'rgba(244,250,255,.82)', stroke: 'rgba(120,170,210,.9)', lw: 1.2 });
      out.push({ plates: [g.plate], pts: [g.from, g.to], open: true, stroke: '#2d74b5', lw: 2.4, head: true });
    });
    return out;
  }
  return { FOSSIL: FOSSIL, GLACIER: GLACIER, C0: C0, circle: circle, globeShapes: globeShapes };
})();

window.GOND = (function () {
  'use strict';
  var G = GLOBE, D = G.D;
  var V = G.qView(30, -38, 0), S = 330;            // 맞춘 모습을 위에서 내려다보는 방향과 크기
  var W0 = 1200, H0 = 800, CX = 580, CY = 525;     // 설계 크기
  var PIECES = ['sa', 'af', 'mad', 'ind', 'ant', 'aus'];
  var NAMES = { sa: '남아메리카', af: '아프리카', mad: '마다가스카르', ind: '인도', ant: '남극', aus: '오스트레일리아' };
  var PLATES = { sa: ['sa'], af: ['af', 'arab'], mad: ['mad'], ind: ['ind'], ant: ['ant'], aus: ['aus'] };
  // 넓은 땅을 덜 찌그러뜨리는 평면 지도(면적이 같은 방위 도법)
  function pv(v) { var k = Math.sqrt(2 / (1 + v[0])); return [CX + v[1] * k * S, CY - v[2] * k * S]; }
  function fitPt(p) { return pv(G.qRot(V, G.vec(p[0], p[1]))); }
  function projRing(q, f) { var out = []; for (var i = 0; i < f.length; i += 3) { var xy = pv(G.qRot(q, [f[i], f[i + 1], f[i + 2]])); out.push(xy[0], xy[1]); } return out; }
  var P = {};
  PIECES.forEach(function (k) {
    var rings = [], ax = 0, ay = 0, aw = 0;
    PLATES[k].forEach(function (pl) {
      var q = G.qMul(V, G.FIT[G.MOVE[pl]]);
      (G.PL[pl] || []).forEach(function (f) {
        var r = projRing(q, f);
        var ar = 0; for (var i = 0; i < r.length; i += 2) { var j = (i + 2) % r.length; ar += r[i] * r[j + 1] - r[j] * r[i + 1]; }
        ar = Math.abs(ar) / 2; if (ar < 18 && k !== 'mad') return;
        for (var m = 0; m < r.length; m += 2) { ax += r[m] * ar; ay += r[m + 1] * ar; aw += ar * 1; }
        rings.push(r);
      });
    });
    var n = 0; rings.forEach(function (r) { n += r.length / 2; });
    var cx = 0, cy = 0, cnt = 0; rings.forEach(function (r) { for (var i = 0; i < r.length; i += 2) { cx += r[i]; cy += r[i + 1]; cnt++; } });
    cx /= cnt; cy /= cnt;
    var path = new Path2D(); rings.forEach(function (r) { path.moveTo(r[0], r[1]); for (var i = 2; i < r.length; i += 2) path.lineTo(r[i], r[i + 1]); path.closePath(); });
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; rings.forEach(function (r) { for (var i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]); } });
    P[k] = { k: k, rings: rings, path: path, cx: cx, cy: cy, box: [x0, y0, x1, y1] };
  });
  /* 지금 대륙처럼 흩어 놓은 자리 (조각의 가운데 위치, 돌린 각도). 화면 안에 들어오게 손으로 정했어요 */
  var NOW = { sa: [175, 560], af: null, mad: [850, 440], ind: [1000, 190], ant: [610, 682], aus: [1065, 600] };
  // 지금 지도처럼 '북쪽이 위'가 되게 돌리는 각도 (남극은 아프리카 쪽이 위)
  var REF = { sa: [-58, -12], mad: [46.8, -19.5], ind: [78, 20], aus: [134, -25] };
  function upRot(k) {
    var a = k === 'ant' ? [20, -88] : REF[k], b = k === 'ant' ? [20, -76] : [a[0], a[1] + 4];
    var A2 = fitPt(G.at(k, a[0], a[1])), B2 = fitPt(G.at(k, b[0], b[1])), ang = Math.atan2(B2[1] - A2[1], B2[0] - A2[0]) / D;
    var r = -90 - ang; while (r > 180) r -= 360; while (r < -180) r += 360; return Math.round(r);
  }
  PIECES.forEach(function (k) { if (NOW[k]) NOW[k] = { x: NOW[k][0], y: NOW[k][1], r: upRot(k) }; });
  function nowState() { var st = {}; PIECES.forEach(function (k) { var n = NOW[k]; st[k] = n ? { dx: n.x - P[k].cx, dy: n.y - P[k].cy, rot: n.r } : { dx: 0, dy: 0, rot: 0 }; }); return st; }
  function fitState() { var st = {}; PIECES.forEach(function (k) { st[k] = { dx: 0, dy: 0, rot: 0 }; }); return st; }
  function mixState(a, b, k) { var st = {}; PIECES.forEach(function (p) { st[p] = { dx: a[p].dx + (b[p].dx - a[p].dx) * k, dy: a[p].dy + (b[p].dy - a[p].dy) * k, rot: a[p].rot + (b[p].rot - a[p].rot) * k }; }); return st; }
  // 조각의 변환: 맞춘 자리 기준으로 (가운데를 축으로 돌리고 옮겨요)
  function xf(ctx, k, s) { var p = P[k]; ctx.translate(p.cx + s.dx, p.cy + s.dy); ctx.rotate(s.rot * D); ctx.translate(-p.cx, -p.cy); }
  function xpt(k, s, x, y) { var p = P[k], c = Math.cos(s.rot * D), si = Math.sin(s.rot * D), X = x - p.cx, Y = y - p.cy; return [p.cx + s.dx + X * c - Y * si, p.cy + s.dy + X * si + Y * c]; }

  /* 증거를 평면 좌표로 */
  var FOS = EVID.FOSSIL.map(function (f) { return { id: f.id, name: f.name, col: f.col, w: f.w * D * S, lines: f.lines.map(function (L) { var out = []; for (var i = 0; i < L.length - 1; i++) { var a = G.vec(L[i][0], L[i][1]), b = G.vec(L[i + 1][0], L[i + 1][1]); for (var t = 0; t < 1; t += 0.1) { var v = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; out.push(fitPt(G.ll(v))); } } out.push(fitPt(L[L.length - 1])); return out; }) }; });
  var GLA = EVID.GLACIER.map(function (g) { return { plate: g.plate, at: fitPt(g.at), from: fitPt(g.from), to: fitPt(g.to), r: 4.2 * D * S }; });
  var C0 = fitPt(EVID.C0);
  var pieceOfPlate = { sa: 'sa', af: 'af', arab: 'af', mad: 'mad', ind: 'ind', ant: 'ant', aus: 'aus' };

  /* ---------- 바다 바탕 (교과서처럼 옅은 물빛 종이) ---------- */
  var bgC = null;
  function bg(ctx) {
    if (!bgC) {
      bgC = document.createElement('canvas'); bgC.width = W0; bgC.height = H0; var g = bgC.getContext('2d');
      var gr = g.createLinearGradient(0, 0, W0, H0); gr.addColorStop(0, '#d7eef8'); gr.addColorStop(0.5, '#bfe2f2'); gr.addColorStop(1, '#a9d5ea'); g.fillStyle = gr; g.fillRect(0, 0, W0, H0);
      var s = 3; function r() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
      for (var i = 0; i < 140; i++) { var x = r() * W0, y = r() * H0, R = 40 + r() * 140, rg = g.createRadialGradient(x, y, 0, x, y, R); rg.addColorStop(0, 'rgba(255,255,255,' + (0.05 + r() * 0.12) + ')'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(x - R, y - R, R * 2, R * 2); }
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.6; g.lineCap = 'round';
      for (var j = 0; j < 26; j++) { var wx = r() * W0, wy = r() * H0, L = 20 + r() * 26; g.beginPath(); for (var u = 0; u <= L; u += 2) { var yy = wy + Math.sin(u / 5) * 2.4; if (u) g.lineTo(wx + u, yy); else g.moveTo(wx + u, yy); } g.stroke(); }
    }
    ctx.drawImage(bgC, 0, 0, W0, H0);
  }
  var grain = null;
  function grainPat(ctx) { if (!grain) { grain = document.createElement('canvas'); grain.width = grain.height = 160; var x = grain.getContext('2d'), id = x.createImageData(160, 160), s = 9; for (var i = 0; i < id.data.length; i += 4) { s = (s * 1664525 + 1013904223) >>> 0; var v = s >>> 24; id.data[i] = 90 + (v >> 2); id.data[i + 1] = 60 + (v >> 3); id.data[i + 2] = 30; id.data[i + 3] = (v & 31); } x.putImageData(id, 0, 0); } return ctx.createPattern(grain, 'repeat'); }

  /* ---------- 조각 그리기 ----------
     o: { state, show: {fossil, glacier, coast}, only: [조각], sel, lift: {k: 0~1}, done: {k:true}, names: true, dim: [조각] } */
  function drawPiece(ctx, k, s, o) {
    var p = P[k], lift = (o.lift && o.lift[k]) || 0, dim = o.dim && o.dim.indexOf(k) >= 0;
    ctx.save(); xf(ctx, k, s);
    // 그림자 (들어 올리면 더 멀리, 더 흐리게)
    ctx.save(); ctx.translate(4 + lift * 10, 6 + lift * 14); ctx.filter = 'blur(' + (4 + lift * 8) + 'px)'; ctx.fillStyle = 'rgba(20,50,70,' + (0.35 - lift * 0.08) + ')'; ctx.lineWidth = 12; ctx.strokeStyle = ctx.fillStyle; ctx.stroke(p.path); ctx.fill(p.path); ctx.restore();
    // 오려 낸 종이 테두리 (흰색) → 해안선(밑에 굵게 그은 뒤 땅을 덮으면 바깥 줄만 남아요)
    ctx.lineJoin = 'round';
    if (o.sel === k) { ctx.lineWidth = 20; ctx.strokeStyle = '#0b6aa0'; ctx.stroke(p.path); }
    ctx.lineWidth = 10; ctx.strokeStyle = '#fbfdfd'; ctx.stroke(p.path);
    var coast = o.show && o.show.coast && (k === 'sa' || k === 'af');
    ctx.lineWidth = coast ? 6 : 2.6; ctx.strokeStyle = coast ? '#c2410c' : 'rgba(96,62,28,.85)'; ctx.stroke(p.path);
    // 땅
    var b = p.box, gr = ctx.createLinearGradient(b[0], b[1], b[2], b[3]);
    if (k === 'ant') { gr.addColorStop(0, '#f6f8f9'); gr.addColorStop(1, '#d9e3e8'); } else { gr.addColorStop(0, '#dcb07a'); gr.addColorStop(1, '#b98451'); }
    ctx.fillStyle = gr; ctx.fill(p.path);
    ctx.save(); ctx.clip(p.path);
    var lg = ctx.createRadialGradient(b[0] + (b[2] - b[0]) * 0.3, b[1] + (b[3] - b[1]) * 0.25, 5, (b[0] + b[2]) / 2, (b[1] + b[3]) / 2, Math.max(b[2] - b[0], b[3] - b[1]) * 0.7); lg.addColorStop(0, 'rgba(255,248,230,.28)'); lg.addColorStop(1, 'rgba(70,40,15,.18)'); ctx.fillStyle = lg; ctx.fillRect(b[0] - 10, b[1] - 10, b[2] - b[0] + 20, b[3] - b[1] + 20);
    ctx.fillStyle = grainPat(ctx); ctx.globalAlpha = 0.6; ctx.fillRect(b[0] - 10, b[1] - 10, b[2] - b[0] + 20, b[3] - b[1] + 20); ctx.globalAlpha = 1;
    // 증거
    if (o.show && o.show.fossil) FOS.forEach(function (f) { if (o.fossilOnly && o.fossilOnly.indexOf(f.id) < 0) return; ctx.strokeStyle = f.col; ctx.lineWidth = f.w; ctx.lineCap = ctx.lineJoin = 'round'; ctx.globalAlpha = 0.88; f.lines.forEach(function (L) { ctx.beginPath(); L.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke(); }); ctx.globalAlpha = 1; });
    if (o.show && o.show.glacier) GLA.forEach(function (g) {
      if (pieceOfPlate[g.plate] !== k) return;
      var rg = ctx.createRadialGradient(g.at[0], g.at[1], 0, g.at[0], g.at[1], g.r * 1.15); rg.addColorStop(0, 'rgba(250,253,255,.95)'); rg.addColorStop(0.75, 'rgba(232,244,252,.8)'); rg.addColorStop(1, 'rgba(232,244,252,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(g.at[0], g.at[1], g.r * 1.15, 0, 6.283); ctx.fill();
      // 긁힌 자국 (흐른 방향으로 가는 줄)
      var an = Math.atan2(g.to[1] - g.from[1], g.to[0] - g.from[0]); ctx.strokeStyle = 'rgba(90,130,160,.55)'; ctx.lineWidth = 1.3;
      for (var i = -2; i <= 2; i++) { var ox = -Math.sin(an) * i * 6, oy = Math.cos(an) * i * 6; ctx.beginPath(); ctx.moveTo(g.at[0] + ox - Math.cos(an) * 14, g.at[1] + oy - Math.sin(an) * 14); ctx.lineTo(g.at[0] + ox + Math.cos(an) * 12, g.at[1] + oy + Math.sin(an) * 12); ctx.stroke(); }
      arrow(ctx, g.from[0], g.from[1], g.to[0], g.to[1], '#2563a6', 4.2);
    });
    ctx.restore();
    if (dim) { ctx.fillStyle = 'rgba(214,236,246,.62)'; ctx.fill(p.path); }
    ctx.restore();
  }
  function arrow(ctx, x0, y0, x1, y1, col, w) {
    var a = Math.atan2(y1 - y0, x1 - x0), s = w * 2.6; ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - Math.cos(a) * s * 0.7, y1 - Math.sin(a) * s * 0.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - Math.cos(a - 0.5) * s, y1 - Math.sin(a - 0.5) * s); ctx.lineTo(x1 - Math.cos(a + 0.5) * s, y1 - Math.sin(a + 0.5) * s); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // 이름표 자리: 조각마다 보기 좋은 곳 (맞춘 좌표)
  var LBL = { sa: G.at('sa', -58, -10), af: G.at('af', 21, 6), mad: G.at('mad', 46.8, -19.5), ind: G.at('ind', 78, 21.5), ant: G.at('ant', 50, -82), aus: G.at('aus', 134, -24) };
  function draw(ctx, W, H, o) {
    o = o || {}; var st = o.state || fitState();
    var bx = o.box || { x: 0, y: 0, w: W0, h: H0 }; ART.fit(ctx, W, H, bx.w, bx.h, !!o.cover); ctx.translate(-bx.x, -bx.y);
    if (o.bg !== false) bg(ctx);
    var list = (o.only || PIECES).slice(); if (o.sel) { list = list.filter(function (k) { return k !== o.sel; }); if ((o.only || PIECES).indexOf(o.sel) >= 0) list.push(o.sel); }
    list.forEach(function (k) { drawPiece(ctx, k, st[k], o); });
    var labels = [];
    if (o.names !== false) list.forEach(function (k) { if (k === 'mad' && o.names !== 'all') return; var q = fitPt(LBL[k]), x = xpt(k, st[k], q[0], q[1]); labels.push({ k: 'p-' + k, t: NAMES[k], x: x[0] - bx.x, y: x[1] - bx.y, cls: 'cont' + (o.dim && o.dim.indexOf(k) >= 0 ? ' dim' : '') }); });
    if (o.extra) o.extra(ctx, labels, st, bx);
    return { labels: labels };
  }
  /* 화면 좌표(설계 좌표) → 맨 위에 있는 조각 */
  var hitC = document.createElement('canvas').getContext('2d');
  function hit(x, y, st, order) {
    for (var i = order.length - 1; i >= 0; i--) { var k = order[i]; hitC.setTransform(1, 0, 0, 1, 0, 0); xf(hitC, k, st[k]); hitC.lineWidth = 26; if (hitC.isPointInPath(P[k].path, x, y) || hitC.isPointInStroke(P[k].path, x, y)) return k; }
    return null;
  }
  return { P: P, PIECES: PIECES, NAMES: NAMES, W0: W0, H0: H0, nowState: nowState, fitState: fitState, mixState: mixState, draw: draw, hit: hit, xpt: xpt, fitPt: fitPt, FOS: FOS, GLA: GLA, C0: C0, arrow: arrow };
})();
