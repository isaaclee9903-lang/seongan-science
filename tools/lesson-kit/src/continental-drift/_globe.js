/* ===== 움직이는 대륙 지구본 (GLOBE) =====
   대륙 모양(window.GEO)을 공 위의 점으로 바꾸고, 대륙마다 '회전'을 주어 옮겨요.
   - 대륙을 맞추는 회전은 '두 점 맞추기'로 정해요: 지금 대륙의 두 지점이 판게아 때 어디에 있었는지(아프리카를 기준으로) 적으면 회전이 계산돼요.
   - 시간(age, 백만 년 전)에 따라 회전을 조금씩 줄여 지금 모습으로 돌아와요. (개념 이해를 위한 모형)
   - 화석·빙하 흔적은 판게아 때 모습(아프리카 기준 좌표)으로 한 번 그리면, 대륙과 함께 움직여요. */
window.GLOBE = (function () {
  'use strict';
  var D = Math.PI / 180, REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  /* ---------- 벡터·회전(사원수) ---------- */
  function vec(lon, lat) { var c = Math.cos(lat * D); return [c * Math.cos(lon * D), c * Math.sin(lon * D), Math.sin(lat * D)]; }
  function ll(v) { return [Math.atan2(v[1], v[0]) / D, Math.asin(Math.max(-1, Math.min(1, v[2]))) / D]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(a) { var L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; }
  var Q0 = [1, 0, 0, 0];
  function qAxis(ax, deg) { ax = norm(ax); var h = deg * D / 2, s = Math.sin(h); return [Math.cos(h), ax[0] * s, ax[1] * s, ax[2] * s]; }
  function qPole(lat, lon, deg) { return qAxis(vec(lon, lat), deg); }
  function qMul(a, b) { return [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]]; }
  function qInv(q) { return [q[0], -q[1], -q[2], -q[3]]; }
  function qRot(q, v) { var w = q[0], x = q[1], y = q[2], z = q[3], ix = w * v[0] + y * v[2] - z * v[1], iy = w * v[1] + z * v[0] - x * v[2], iz = w * v[2] + x * v[1] - y * v[0], iw = -x * v[0] - y * v[1] - z * v[2]; return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x]; }
  function qSlerp(a, b, t) {
    var c = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]; if (c < 0) { b = [-b[0], -b[1], -b[2], -b[3]]; c = -c; }
    if (c > 0.9995) { var r = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t], L = Math.hypot(r[0], r[1], r[2], r[3]); return [r[0] / L, r[1] / L, r[2] / L, r[3] / L]; }
    var th = Math.acos(c), s = Math.sin(th), k0 = Math.sin((1 - t) * th) / s, k1 = Math.sin(t * th) / s; return [a[0] * k0 + b[0] * k1, a[1] * k0 + b[1] * k1, a[2] * k0 + b[2] * k1, a[3] * k0 + b[3] * k1];
  }
  function qBetween(a, b) { var c = dot(a, b); if (c > 0.999999) return Q0; var ax = cross(a, b); if (Math.hypot(ax[0], ax[1], ax[2]) < 1e-9) ax = Math.abs(a[0]) < 0.9 ? cross(a, [1, 0, 0]) : cross(a, [0, 1, 0]); return qAxis(ax, Math.acos(Math.max(-1, Math.min(1, c))) / D); }
  // 두 점 맞추기: p1→t1 정확히, p2는 t2 쪽 방향으로 (lon, lat 순서)
  function qTwo(p1, t1, p2, t2) {
    var P1 = vec(p1[0], p1[1]), T1 = vec(t1[0], t1[1]), P2 = vec(p2[0], p2[1]), T2 = vec(t2[0], t2[1]);
    var r1 = qBetween(P1, T1), P2r = qRot(r1, P2);
    var u = norm(cross(T1, P2r)), w = norm(cross(T1, T2)), ang = Math.atan2(dot(cross(u, w), T1), dot(u, w)) / D;
    return qMul(qAxis(T1, ang), r1);
  }
  // 보는 방향: (lon0, lat0)이 화면 가운데, roll만큼 기울임
  function qView(lon0, lat0, roll) { var q = qMul(qAxis([0, 1, 0], lat0), qAxis([0, 0, 1], -lon0)); return roll ? qMul(qAxis([1, 0, 0], roll), q) : q; }

  /* ---------- 대륙 자료 → 공 위의 점 (2도보다 먼 점 사이는 채워요) ---------- */
  var PL = {};
  function prep() {
    var G = window.GEO || {};
    Object.keys(G).forEach(function (k) {
      PL[k] = G[k].map(function (ring) {
        var out = [], prev = null;
        ring.forEach(function (p) {
          var v = vec(p[0] / 10, p[1] / 10);
          if (prev) { var a = Math.acos(Math.max(-1, Math.min(1, dot(prev, v)))) / D, n = Math.floor(a / 2); for (var i = 1; i <= n; i++) { var t = i / (n + 1); out.push(norm([prev[0] + (v[0] - prev[0]) * t, prev[1] + (v[1] - prev[1]) * t, prev[2] + (v[2] - prev[2]) * t])); } }
          out.push(v); prev = v;
        });
        var f = new Float32Array(out.length * 3); out.forEach(function (v, i) { f[i * 3] = v[0]; f[i * 3 + 1] = v[1]; f[i * 3 + 2] = v[2]; }); return f;
      });
    });
  }
  prep();
  // 아라비아는 아프리카와 함께 움직여요
  var MOVE = { af: 'af', arab: 'af', sa: 'sa', na: 'na', eu: 'eu', ind: 'ind', ant: 'ant', aus: 'aus', mad: 'mad', nz: 'nz' };

  /* ---------- 판게아 때 자리 (아프리카 기준) ---------- */
  var FIT = {}; FIT.af = Q0;
  // (lon, lat)에서 방위 brg(북=0, 동=90)로 dist도 간 곳
  function dest(p, brg, dist) { var la = p[1] * D, lo = p[0] * D, b = brg * D, d = dist * D, la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(b)), lo2 = lo + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2)); return [lo2 / D, la2 / D]; }
  function at(k, lon, lat) { return ll(qRot(FIT[k], vec(lon, lat))); }
  FIT.sa = qTwo([-34.9, -8.05], [8.6, 2.2], [-56.5, -35.0], [14.6, -29.5]);
  FIT.na = qTwo([-65.5, 43.5], [-10.8, 32.2], [-81.4, 30.5], [-17.6, 12.0]);
  FIT.eu = qTwo([-5.6, 36.0], [-8.5, 35.8], [5.0, 62.0], (function () { var g = at('na', -22, 70.5); return [g[0] + 1.5, g[1] - 0.5]; })());
  FIT.mad = qTwo([46.3, -15.7], [41.2, -4.6], [45.1, -25.6], [42.1, -13.6]);
  var indTip = (function () { var g = at('mad', 48.0, -25.2); return [g[0] + 1.6, g[1] - 0.6]; })();
  FIT.ind = qTwo([77.5, 8.1], indTip, [72.8, 19.0], dest(indTip, 60, 11.6));
  FIT.ant = qTwo([47.0, -66.5], at('ind', 81.0, 8.0), [73.0, -68.6], at('ind', 87.2, 19.6));
  FIT.aus = qTwo([115.1, -34.4], at('ant', 100.0, -64.6), [146.8, -43.6], at('ant', 162.0, -69.0));
  FIT.nz = qTwo([167.6, -46.6], at('ant', -150.0, -74.0), [173.0, -35.0], at('aus', 156.0, -31.0));
  // 판게아 전체를 옮기는 회전 (남쪽 대륙들이 남극 쪽에 있었어요)
  var ABS = qPole(0, -75, -30);
  /* 시간표: 판게아 회전이 얼마나 남아 있나 (백만 년 전 → 남은 비율). 개념 이해를 위한 모형 */
  var SCHED = {
    abs: [[335, 1], [200, 1], [150, 0.7], [0, 0]],
    na: [[335, 1], [195, 1], [150, 0.8], [0, 0]],
    eu: [[335, 1], [195, 1], [150, 0.82], [0, 0]],
    sa: [[335, 1], [150, 1], [130, 0.97], [0, 0]],
    mad: [[335, 1], [175, 1], [150, 0.9], [120, 0.25], [0, 0]],
    ind: [[335, 1], [170, 1], [150, 0.93], [0, 0]],
    ant: [[335, 1], [175, 1], [150, 0.95], [0, 0]],
    aus: [[335, 1], [175, 1], [150, 0.95], [0, 0]],
    nz: [[335, 1], [175, 1], [150, 0.95], [80, 0.3], [0, 0]],
    af: [[335, 1], [0, 1]],
  };
  function sched(k, age) { var s = SCHED[k]; if (age >= s[0][0]) return s[0][1]; for (var i = 1; i < s.length; i++) if (age >= s[i][0]) { var a = s[i - 1], b = s[i], t = (age - b[0]) / (a[0] - b[0]); return b[1] + (a[1] - b[1]) * t; } return s[s.length - 1][1]; }
  function qPow(q, f) { return qSlerp(Q0, q, f); }
  // age(백만 년 전)일 때 대륙 k의 회전 (지금 모습 → 그때 자리)
  var CFG = { abs: true };
  function plateQ(k, age) { var m = MOVE[k] || k; return qMul(CFG.abs ? qPow(ABS, sched('abs', age)) : Q0, qPow(FIT[m], sched(m, age))); }
  // 판게아 좌표(아프리카 기준)의 점이 age일 때 어디 있나: 대륙 k에 붙은 점
  function fitToNow(k) { var m = MOVE[k] || k; return qInv(FIT[m]); }

  /* ---------- 그리기 ---------- */
  var COL = { af: '#d0a56b', arab: '#d0a56b', sa: '#c99c62', na: '#c9a067', eu: '#cfa86f', ind: '#c79b60', ant: '#eef2f4', aus: '#cc9f63', mad: '#c99c62', nz: '#cc9f63' };
  var NAME = { sa: ['남아메리카', -60, -15], af: ['아프리카', 20, 5], na: ['북아메리카', -100, 45], eu: ['유라시아', 85, 52], ind: ['인도', 78, 21], ant: ['남극', 60, -80], aus: ['오스트레일리아', 134, -25], mad: ['', 46.8, -19.5] };
  var layer = null;
  function lay(w, h) { if (!layer) layer = document.createElement('canvas'); if (layer.width !== w || layer.height !== h) { layer.width = w; layer.height = h; } return layer; }
  // 점 목록을 화면 좌표로 (뒤쪽 점은 가장자리로 붙여요). 모두 뒤쪽이면 null
  function proj(q, f, cx, cy, R, out) {
    var n = f.length / 3, front = 0; out.length = 0;
    var w = q[0], x = q[1], y = q[2], z = q[3];
    for (var i = 0; i < n; i++) {
      var vx = f[i * 3], vy = f[i * 3 + 1], vz = f[i * 3 + 2];
      var ix = w * vx + y * vz - z * vy, iy = w * vy + z * vx - x * vz, iz = w * vz + x * vy - y * vx, iw = -x * vx - y * vy - z * vz;
      var X = ix * w - iw * x - iy * z + iz * y, Y = iy * w - iw * y - iz * x + ix * z, Z = iz * w - iw * z - ix * y + iy * x;
      if (X > 0) front++; else { var L = Math.hypot(Y, Z) || 1; Y /= L; Z /= L; }
      out.push(cx + Y * R, cy - Z * R);
    }
    return front ? out : null;
  }
  var tmp = [];
  function ringPath(p, q, f, cx, cy, R, open) { var a = proj(q, f, cx, cy, R, tmp); if (!a) return false; p.moveTo(a[0], a[1]); for (var i = 2; i < a.length; i += 2) p.lineTo(a[i], a[i + 1]); if (!open) p.closePath(); return true; }
  function landPath(k, q, cx, cy, R) { var p = new Path2D(), any = false; (PL[k] || []).forEach(function (f) { if (ringPath(p, q, f, cx, cy, R)) any = true; }); return any ? p : null; }
  // 판게아 좌표 도형(경도·위도 목록)을 공 위의 점으로
  var shapeCache = new WeakMap();
  function shapeF(pts, open) { var f = shapeCache.get(pts); if (f) return f; var out = []; for (var i = 0; i < pts.length; i++) { var a = vec(pts[i][0], pts[i][1]); out.push(a); if (open && i === pts.length - 1) break; var b = vec(pts[(i + 1) % pts.length][0], pts[(i + 1) % pts.length][1]); var ang = Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) / D, n = Math.floor(ang / 1.5); for (var j = 1; j <= n; j++) { var t = j / (n + 1); out.push(norm([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t])); } } f = new Float32Array(out.length * 3); out.forEach(function (v, i2) { f[i2 * 3] = v[0]; f[i2 * 3 + 1] = v[1]; f[i2 * 3 + 2] = v[2]; }); shapeCache.set(pts, f); return f; }
  function pt(q, lon, lat, cx, cy, R) { var v = qRot(q, vec(lon, lat)); return { x: cx + v[1] * R, y: cy - v[2] * R, front: v[0] > 0.08, z: v[0] }; }

  /* o: { cx, cy, R, view(사원수), age, shapes:[{plates:[...], pts:[[lon,lat]...], fill, stroke, lw, dash, alpha}], marks:[{plate, lon, lat, draw(ctx,x,y,s)}], grid, labels, glow, pick } */
  function draw(ctx, o) {
    var cx = o.cx, cy = o.cy, R = o.R, V = o.view || Q0, age = o.age || 0, labels = [];
    var dpr = ctx.getTransform().a;
    // 우주 쪽 빛무리
    if (o.glow !== false) { var gg = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.12); gg.addColorStop(0, 'rgba(140,200,255,.55)'); gg.addColorStop(1, 'rgba(140,200,255,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, 6.283); ctx.fill(); }
    // 바다
    var sea = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R); sea.addColorStop(0, '#5fb4e0'); sea.addColorStop(0.55, '#2b7fbe'); sea.addColorStop(1, '#134a86');
    ctx.fillStyle = sea; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.fill();
    // 땅은 따로 그린 뒤 빛을 입혀 얹어요
    var tr = ctx.getTransform(), L = lay(ctx.canvas.width, ctx.canvas.height), g = L.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, L.width, L.height); g.setTransform(tr);
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.clip();
    var order = o.order || ['ant', 'nz', 'aus', 'ind', 'mad', 'sa', 'arab', 'af', 'na', 'eu'], paths = {};
    order.forEach(function (k) { if (!PL[k]) return; var q = qMul(V, plateQ(k, age)), p = landPath(k, q, cx, cy, R); if (!p) return; paths[k] = { p: p, q: q }; });
    // 해안선 (밑에 굵게 그리고 위를 채우면 바깥 테두리만 남아요)
    order.forEach(function (k) { var P = paths[k]; if (!P) return; g.lineJoin = 'round'; g.lineWidth = 2.6; g.strokeStyle = 'rgba(70,48,22,.75)'; g.stroke(P.p); });
    order.forEach(function (k) {
      var P = paths[k]; if (!P) return;
      var hl = o.highlight && o.highlight[k];
      g.fillStyle = hl || COL[k]; g.fill(P.p);
      // 이 대륙에 붙은 도형(화석, 빙하 흔적)
      (o.shapes || []).forEach(function (s) {
        if (s.plates.indexOf(MOVE[k] || k) < 0 && s.plates.indexOf(k) < 0) return;
        var q = qMul(P.q, fitToNow(k)), sp = new Path2D(); if (!ringPath(sp, q, shapeF(s.pts, s.open), cx, cy, R, s.open)) return;
        g.save(); g.clip(P.p); g.globalAlpha = s.alpha == null ? 1 : s.alpha; g.lineCap = g.lineJoin = 'round';
        if (s.fill) { g.fillStyle = s.fill; g.fill(sp); }
        if (s.band) { g.lineWidth = s.band * D * R; g.strokeStyle = s.stroke; g.stroke(sp); }
        else if (s.stroke) { g.lineWidth = (s.lw || 2) * R / 300; g.strokeStyle = s.stroke; if (s.dash) g.setLineDash(s.dash); g.stroke(sp); }
        if (s.head) { var a2 = proj(q, shapeF(s.pts, s.open), cx, cy, R, []); if (a2) { var n = a2.length, x1 = a2[n - 2], y1 = a2[n - 1], x0 = a2[n - 4], y0 = a2[n - 3], an = Math.atan2(y1 - y0, x1 - x0), hs = (s.lw || 2) * R / 300 * 2.6; g.fillStyle = s.stroke; g.beginPath(); g.moveTo(x1 + Math.cos(an) * hs, y1 + Math.sin(an) * hs); g.lineTo(x1 + Math.cos(an + 2.4) * hs, y1 + Math.sin(an + 2.4) * hs); g.lineTo(x1 + Math.cos(an - 2.4) * hs, y1 + Math.sin(an - 2.4) * hs); g.closePath(); g.fill(); } }
        g.restore();
      });
    });
    // 빛: 왼쪽 위가 밝고 가장자리가 어두워요
    g.globalCompositeOperation = 'source-atop';
    var lg = g.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.1, cx, cy, R * 1.02); lg.addColorStop(0, 'rgba(255,250,235,.28)'); lg.addColorStop(0.6, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(30,20,10,.5)');
    g.fillStyle = lg; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    if (o.grain !== false) { g.globalAlpha = 0.5; g.fillStyle = grainPat(g); g.fillRect(cx - R, cy - R, R * 2, R * 2); g.globalAlpha = 1; }
    g.globalCompositeOperation = 'source-over';
    // 표시 (대륙 위의 작은 그림)
    (o.marks || []).forEach(function (m) { var P = paths[m.plate]; if (!P) return; var q = qMul(P.q, m.fit ? fitToNow(m.plate) : Q0), s = pt(q, m.lon, m.lat, cx, cy, R); if (!s.front) return; m.draw(g, s.x, s.y, R / 300 * (0.5 + 0.5 * s.z), s); });
    g.restore();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(L, 0, 0); ctx.restore();
    // 위도선 (적도는 진하게)
    if (o.grid !== false) {
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.clip(); ctx.lineWidth = 1;
      [-60, -30, 0, 30, 60].forEach(function (lat) {
        var pts = []; for (var lon = -180; lon <= 180; lon += 4) pts.push([lon, lat]);
        ctx.beginPath(); var on = false; pts.forEach(function (p) { var s = pt(V, p[0], p[1], cx, cy, R); if (s.z > 0) { if (on) ctx.lineTo(s.x, s.y); else ctx.moveTo(s.x, s.y); on = true; } else on = false; });
        ctx.strokeStyle = lat === 0 ? 'rgba(255,236,150,.85)' : 'rgba(255,255,255,.22)'; ctx.lineWidth = lat === 0 ? 2 : 1; if (lat === 0) ctx.setLineDash([7, 5]); ctx.stroke(); ctx.setLineDash([]);
      });
      ctx.restore();
      if (o.grid === 'label') { for (var lo = -180; lo < 180; lo += 10) { var s0 = pt(V, lo, 0, cx, cy, R); if (s0.z > 0.75) { labels.push({ k: 'eq', t: '적도', x: s0.x, y: s0.y - 2, cls: 'eq' }); break; } } }
    }
    // 바다 반짝임과 가장자리 그늘
    var sh = ctx.createRadialGradient(cx - R * 0.42, cy - R * 0.48, 0, cx - R * 0.42, cy - R * 0.48, R * 0.6); sh.addColorStop(0, 'rgba(255,255,255,.22)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.fill();
    var rim = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R); rim.addColorStop(0, 'rgba(8,20,40,0)'); rim.addColorStop(1, 'rgba(8,20,40,.35)'); ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.fill();
    // 대륙 이름
    if (o.labels !== false) Object.keys(NAME).forEach(function (k) { if (!paths[k] || !NAME[k][0]) return; var s = pt(paths[k].q, NAME[k][1], NAME[k][2], cx, cy, R); if (s.z > 0.25) labels.push({ k: 'n-' + k, t: NAME[k][0], x: s.x, y: s.y, cls: 'cont' }); });
    return { labels: labels, paths: paths };
  }
  var grain = null;
  function grainPat(g) { if (!grain) { var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d'), id = x.createImageData(128, 128), s = 7; for (var i = 0; i < id.data.length; i += 4) { s = (s * 1664525 + 1013904223) >>> 0; var v = (s >>> 24); id.data[i] = id.data[i + 1] = id.data[i + 2] = v > 128 ? 255 : 0; id.data[i + 3] = Math.abs(v - 128) / 10; } x.putImageData(id, 0, 0); grain = c; } return g.createPattern(grain, 'repeat'); }

  return { dest: dest, D: D, CFG: CFG, vec: vec, ll: ll, qAxis: qAxis, qPole: qPole, qMul: qMul, qInv: qInv, qRot: qRot, qSlerp: qSlerp, qView: qView, qTwo: qTwo, Q0: Q0, PL: PL, FIT: FIT, MOVE: MOVE, plateQ: plateQ, fitToNow: fitToNow, at: at, draw: draw, proj: proj, ringPath: ringPath, shapeF: shapeF, pt: pt, COL: COL, NAME: NAME, REDUCE: REDUCE, sched: sched };
})();
