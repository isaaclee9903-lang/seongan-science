/* ===== 우리은하 그림 도구 (은하 모형, 은하수 하늘, 성단, 성운) =====
   - 우리은하 모형: 막대 모양 중심부 + 나선팔 + 원반. 단위는 1 = 1000 pc. 지름 약 30000 pc, 태양계는 중심에서 약 8500 pc 떨어진 나선팔 위.
     팔 개수·감긴 정도·두께는 개념 이해를 위한 모형이에요(숫자로 쓰지 않음).
   - 성단·성운 그림은 사진이 아니라 모형이에요. 별 개수도 모형이에요. */
window.MW = (function () {
  'use strict';
  var D = Math.PI / 180;
  /* 같은 씨앗이면 같은 그림이 나오는 난수 */
  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s = (s + 0x6D2B79F5) | 0; var t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function gauss(r) { var u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
  /* 값 잡음 + 프랙털 잡음 (성운·은하수 무늬) */
  function noise(seed) {
    var r = rng(seed), P = new Uint8Array(512), G = new Float32Array(256), i;
    var p = []; for (i = 0; i < 256; i++) { p.push(i); G[i] = r(); }
    for (i = 255; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = p[i]; p[i] = p[j]; p[j] = t; }
    for (i = 0; i < 512; i++) P[i] = p[i & 255];
    function vn(x, y) {
      var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      xi &= 255; yi &= 255;
      var a = G[P[P[xi] + yi]], b = G[P[P[xi + 1] + yi]], c = G[P[P[xi] + yi + 1]], d = G[P[P[xi + 1] + yi + 1]];
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    function fbm(x, y, o) { var s = 0, a = 0.5, f = 1, n = 0; for (var k = 0; k < (o || 5); k++) { s += a * vn(x * f + k * 17.3, y * f - k * 9.1); n += a; f *= 2.03; a *= 0.5; } return s / n; }
    return { vn: vn, fbm: fbm };
  }
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var sstep = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  function rgb(c, a) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a == null ? 1 : a) + ')'; }
  function mix(a, b, t) { b = b || [255, 255, 255]; return [0, 1, 2].map(function (k) { return a[k] + (b[k] - a[k]) * t; }); }
  /* 캔버스를 화면 크기(기기 화소 비율)에 맞춰요 */
  function fit(cv, maxDpr) {
    var r = cv.getBoundingClientRect(), dpr = Math.min(maxDpr || 2, window.devicePixelRatio || 1);
    var w = Math.max(10, r.width), h = Math.max(10, r.height), W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { c: c, w: w, h: h, dpr: dpr };
  }
  function off(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  /* 빛 번짐 별 그림(색별로 한 번만 만들어 둠) */
  var sprites = {};
  function sprite(col) {
    var key = col.map(Math.round).join(',');
    if (sprites[key]) return sprites[key];
    var s = off(64, 64), g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.1, rgb(mix(col, null, 0.6), 0.95)); gr.addColorStop(0.28, rgb(col, 0.45));
    gr.addColorStop(0.6, rgb(col, 0.1)); gr.addColorStop(1, rgb(col, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); sprites[key] = s; return s;
  }
  function star(ctx, x, y, r, col, a, spikes) {
    ctx.globalAlpha = a == null ? 1 : clamp(a, 0, 1);
    ctx.drawImage(sprite(col), x - r, y - r, r * 2, r * 2);
    if (spikes && r > 7) {
      var L = r * 2.4, sc = mix(col, null, 0.5);
      [[1, 0], [0, 1]].forEach(function (d) {
        var g = ctx.createLinearGradient(x - d[0] * L, y - d[1] * L, x + d[0] * L, y + d[1] * L);
        g.addColorStop(0, rgb(sc, 0)); g.addColorStop(0.5, rgb(sc, 0.7)); g.addColorStop(1, rgb(sc, 0));
        ctx.strokeStyle = g; ctx.lineWidth = Math.max(1, r * 0.07); ctx.beginPath(); ctx.moveTo(x - d[0] * L, y - d[1] * L); ctx.lineTo(x + d[0] * L, y + d[1] * L); ctx.stroke();
      });
    }
    ctx.globalAlpha = 1;
  }
  /* 우주 배경 + 희미한 별 */
  function space(ctx, w, h, seed, n) {
    var g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#04070f'); g.addColorStop(1, '#0a1022');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    var R = rng(seed || 3); ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var N = n == null ? Math.round(w * h / 2600) : n;
    for (var i = 0; i < N; i++) { var m = Math.pow(R(), 3); star(ctx, R() * w, R() * h, 1.2 + m * 5, R() < 0.3 ? [170, 195, 255] : R() < 0.6 ? [255, 236, 210] : [235, 240, 255], 0.35 + m * 0.6); }
    ctx.restore();
  }

  /* ===== 우리은하 모형 ===== */
  var GAL = null;
  var K = 0.264, R0 = 4.2, RMAX = 15, A0 = 0.47;   /* 팔의 감긴 정도, 막대 끝, 가장자리, 막대 방향(모형) */
  var SUN = [-8.5, 0, 0];
  function galaxy() {
    if (GAL) return GAL;
    var r = rng(20261011), g = function () { return gauss(r); }, P = [];
    var add = function (x, y, z, c, b, s, t) { P.push({ x: x, y: y, z: z, c: c, b: b, s: s, t: t }); };
    var ca = Math.cos(A0), sa = Math.sin(A0), i, k;
    /* 막대 모양 중심부 */
    for (i = 0; i < 6000; i++) {
      var al = clamp(g() * R0 * 0.42, -R0, R0), ac = g() * 0.5 * (1 - Math.abs(al) / R0 * 0.45), y = g() * 0.3 * (1 - Math.abs(al) / R0 * 0.5);
      add(al * ca - ac * sa, y, al * sa + ac * ca, r() < 0.8 ? [1, 0.86, 0.64] : [1, 0.94, 0.82], 0.9 + r() * 0.6, 0.11, 'bar');
    }
    /* 볼록한 중심부 */
    for (i = 0; i < 7000; i++) {
      var q = Math.pow(r(), 1.5), rr = 2.7 * q, th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1);
      var bx = rr * Math.sin(ph) * Math.cos(th) * 1.25, bz = rr * Math.sin(ph) * Math.sin(th), by = rr * Math.cos(ph) * 0.7;
      add(bx * ca - bz * sa, by, bx * sa + bz * ca, r() < 0.75 ? [1, 0.84, 0.6] : [1, 0.93, 0.8], 1 + (1 - q) * 1.4, 0.12, 'bulge');
    }
    /* 나선팔 4개(굵은 팔 2, 가는 팔 2). 0번 팔이 태양계를 지나요 */
    var phiMax = Math.log(RMAX / R0) / K;
    for (k = 0; k < 4; k++) {
      var th0 = A0 + k * Math.PI / 2 + (k % 2 ? 0.25 : 0), major = k % 2 === 0, n = major ? 13000 : 6000;
      for (i = 0; i < n; i++) {
        var phi = phiMax * Math.pow(r(), 0.92), ra = R0 * Math.exp(K * phi), w = 0.16 + 0.036 * ra, th2 = th0 + phi + g() * 0.02;
        var rr2 = ra + g() * w, bl = r() < 0.72;
        add(rr2 * Math.cos(th2), g() * 0.09, rr2 * Math.sin(th2), bl ? [0.68, 0.8, 1] : [1, 0.97, 0.9], (major ? 1 : 0.75) * (0.6 + r() * 0.8) * (1.25 - ra / RMAX * 0.75), 0.1, 'arm');
      }
      /* 팔을 따라 붉은 빛 덩어리 */
      for (i = 0; i < (major ? 34 : 16); i++) {
        var p2 = phiMax * (0.08 + 0.85 * r()), ra2 = R0 * Math.exp(K * p2), t2 = th0 + p2, cx = ra2 * Math.cos(t2) + g() * 0.15, cz = ra2 * Math.sin(t2) + g() * 0.15;
        for (var j = 0; j < 10; j++) add(cx + g() * 0.09, g() * 0.04, cz + g() * 0.09, [1, 0.42, 0.58], 0.9, 0.09, 'hii');
      }
      /* 팔 안쪽 가장자리의 티끌 띠 */
      for (i = 0; i < (major ? 3200 : 1500); i++) {
        var p3 = phiMax * Math.pow(r(), 0.9), ra3 = R0 * Math.exp(K * p3), t3 = th0 + p3, rr3 = ra3 - (0.2 + 0.035 * ra3) + g() * 0.12;
        add(rr3 * Math.cos(t3), g() * 0.04, rr3 * Math.sin(t3), [0, 0, 0], 1, 0.3, 'dust');
      }
    }
    /* 원반 */
    for (i = 0; i < 16000; i++) {
      var rd = -3.4 * Math.log(1 - r() * 0.985); if (rd > 15.3) continue; var td = r() * Math.PI * 2;
      add(rd * Math.cos(td), g() * (0.1 + rd * 0.006), rd * Math.sin(td), [0.98, 0.93, 0.86], 0.35 + r() * 0.35, 0.1, 'disk');
    }
    /* 원반 가운데의 얇은 티끌층(옆에서 볼 때 어두운 줄) */
    for (i = 0; i < 4500; i++) {
      var rq = 1.5 + -3.6 * Math.log(1 - r() * 0.95); if (rq > 14) continue; var tq = r() * Math.PI * 2;
      add(rq * Math.cos(tq), g() * 0.05, rq * Math.sin(tq), [0, 0, 0], 1, 0.3, 'dust');
    }
    GAL = { P: P, SUN: SUN, R: RMAX, A0: A0, K: K, R0: R0, armPoint: function (k, ra) { var phi = Math.log(ra / R0) / K, th = A0 + k * Math.PI / 2 + (k % 2 ? 0.25 : 0) + phi; return [ra * Math.cos(th), 0, ra * Math.sin(th)]; } };
    return GAL;
  }

  /* 버퍼 그리기 도구: 빛을 더해 쌓고, 번지게 하고, 화면 색으로 바꿔요 */
  function blur1(src, dst, w, h, rad, horiz) {
    var n = horiz ? w : h, m = horiz ? h : w, st = horiz ? 1 : w, ln = horiz ? w : 1, inv = 1 / (2 * rad + 1);
    for (var a = 0; a < m; a++) {
      var base = a * ln, acc = 0, i;
      for (i = -rad; i <= rad; i++) acc += src[base + clamp(i, 0, n - 1) * st];
      for (i = 0; i < n; i++) {
        dst[base + i * st] = acc * inv;
        acc += src[base + Math.min(n - 1, i + rad + 1) * st] - src[base + Math.max(0, i - rad) * st];
      }
    }
  }
  function blur(arr, w, h, rad) { if (rad < 1) return arr; var t = new Float32Array(arr.length); blur1(arr, t, w, h, rad, true); blur1(t, arr, w, h, rad, false); blur1(arr, t, w, h, rad, true); blur1(t, arr, w, h, rad, false); return arr; }

  /* 우리은하를 2D 캔버스에 그려요.
     o: { elev: 90 = 위에서, 0 = 옆에서 (도), rot: 돌림(도), cx, cy: 중심(화면 비율), S: 1000 pc당 화소, exposure } → 화면 좌표 변환 함수 돌려줌 */
  function proj(o) {
    var ce = Math.cos(o.elev * D), se = Math.sin(o.elev * D), cr = Math.cos((o.rot || 0) * D), sr = Math.sin((o.rot || 0) * D);
    var yS = o.yS || 1; return function (x, y, z) { var xr = x * cr - z * sr, zr = x * sr + z * cr; return [o.cx + xr * o.S, o.cy + (zr * se - y * yS * ce) * o.S]; };
  }
  var galCache = {};
  function renderGalaxy(cv, o) {
    var f = o.size ? { c: cv.getContext('2d'), w: (cv.width = cv.height = o.size), h: o.size } : fit(cv, 1.5), w = f.w, h = f.h, key = [cv.width, cv.height, o.elev, o.rot, o.cxF, o.cyF, o.sF, o.yS].join('|');
    var S = Math.min(w * (o.sF || 0.031), h * (o.sFh || 1e9));
    var P = proj({ elev: o.elev, rot: o.rot, cx: w * o.cxF, cy: h * o.cyF, S: S, yS: o.yS });
    var img = galCache[cv.id + key];
    if (!img) {
      var sc = Math.min(1, (o.size || 900) / w), BW = Math.max(40, Math.round(w * sc)), BH = Math.max(30, Math.round(h * sc)), N = BW * BH;
      var Rb = new Float32Array(N), Gb = new Float32Array(N), Bb = new Float32Array(N), Db = new Float32Array(N);
      var G = galaxy().P, side = o.elev < 30;
      for (var i = 0; i < G.length; i++) {
        var p = G[i], s = P(p.x, p.y, p.z), x = s[0] * sc, y = s[1] * sc, xi = Math.floor(x), yi = Math.floor(y);
        if (xi < 0 || yi < 0 || xi >= BW - 1 || yi >= BH - 1) continue;
        var fx = x - xi, fy = y - yi, idx = yi * BW + xi, ws = [(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy], ids = [idx, idx + 1, idx + BW, idx + BW + 1];
        if (p.t === 'dust') { for (var a = 0; a < 4; a++) Db[ids[a]] += ws[a] * (side ? 1.6 : 0.5); continue; }
        var b = p.b * (side ? 0.55 : 1) * (p.t === 'hii' ? 1.6 : 1);
        for (var c = 0; c < 4; c++) { Rb[ids[c]] += ws[c] * p.c[0] * b; Gb[ids[c]] += ws[c] * p.c[1] * b; Bb[ids[c]] += ws[c] * p.c[2] * b; }
      }
      var gR = Rb.slice(), gG = Gb.slice(), gB = Bb.slice(), rad = Math.max(2, Math.round(BW / 170));
      blur(gR, BW, BH, rad); blur(gG, BW, BH, rad); blur(gB, BW, BH, rad);
      blur(Rb, BW, BH, 1); blur(Gb, BW, BH, 1); blur(Bb, BW, BH, 1);
      blur(Db, BW, BH, Math.max(1, Math.round(BW / (side ? 160 : 300))));
      /* 밝기 자동 맞춤: 밝은 쪽 몇 %를 기준으로 */
      var pct = function (A, B2, C2, q) { var smp = [], rr = rng(3); for (var t = 0; t < 6000; t++) { var j = Math.floor(rr() * N), v = A[j] + (B2 ? B2[j] + C2[j] : 0); if (v > 0) smp.push(v); } smp.sort(function (a, b) { return a - b; }); return smp.length ? smp[Math.floor(smp.length * q)] : 1; };
      for (i = 0; i < N; i++) { Rb[i] = Rb[i] * 0.3 + gR[i] * 1.8; Gb[i] = Gb[i] * 0.3 + gG[i] * 1.8; Bb[i] = Bb[i] * 0.3 + gB[i] * 1.8; }
      var ex = (o.exposure || 1) * 3 * 0.75 / pct(Rb, Gb, Bb, side ? 0.86 : 0.9), dk = (side ? 0.9 : 0.8) / pct(Db, null, null, 0.9);
      var cvs = off(BW, BH), cx = cvs.getContext('2d'), id = cx.createImageData(BW, BH), d = id.data;
      for (i = 0; i < N; i++) {
        var k2 = ex * Math.exp(-Db[i] * dk);
        d[i * 4] = 255 * Math.pow(1 - Math.exp(-Rb[i] * k2), 0.85); d[i * 4 + 1] = 255 * Math.pow(1 - Math.exp(-Gb[i] * k2), 0.85); d[i * 4 + 2] = 255 * Math.pow(1 - Math.exp(-Bb[i] * k2), 0.85); d[i * 4 + 3] = 255;
      }
      cx.putImageData(id, 0, 0); img = galCache[cv.id + key] = cvs;
    }
    var ctx = f.c; ctx.fillStyle = o.bg || '#060a16'; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true; ctx.drawImage(img, 0, 0, w, h); ctx.restore();
    return { c: ctx, w: w, h: h, P: P, S: S };
  }

  /* ===== 지구에서 본 은하수 (하늘 사진 느낌의 모형) =====
     o: { ang: 띠의 기울기(도), cxF, cyF: 띠 중심, wF: 띠 두께(높이 비율), core: 밝은 중심의 위치(가로 비율), mountains: 산 그리기 } */
  var bandCache = {};
  function renderBand(cv, o) {
    var f = fit(cv, 1.5), w = f.w, h = f.h, ctx = f.c, key = cv.id + [cv.width, cv.height].join('x');
    var img = bandCache[key];
    if (!img) {
      var sc = Math.min(1, 560 / w), BW = Math.round(w * sc), BH = Math.round(h * sc), nz = noise(31), nz2 = noise(77);
      var cvs = off(BW, BH), cx = cvs.getContext('2d'), id = cx.createImageData(BW, BH), d = id.data;
      var ca = Math.cos(o.ang * D), sa = Math.sin(o.ang * D), X0 = BW * o.cxF, Y0 = BH * o.cyF, Wd = BH * o.wF, core = (o.core - o.cxF) * BW;
      for (var y = 0; y < BH; y++) for (var x = 0; x < BW; x++) {
        var dx = x - X0, dy = y - Y0, l = dx * ca + dy * sa, b = -dx * sa + dy * ca, lc = (l - core) / (BW * 0.28);
        var wd = Wd * (1 + 0.9 * Math.exp(-lc * lc * 1.6)), u = l / Wd, v = b / wd;
        var n1 = nz.fbm(u * 0.9, v * 1.1 + 3, 6), n2 = nz2.fbm(u * 2.2 + 5, v * 2.6, 5);
        var I = Math.exp(-v * v * 1.3) * (0.42 + 1.1 * Math.exp(-lc * lc * 1.3)) * (0.35 + 1.25 * n1);
        var rift = Math.exp(-Math.pow((v - 0.12 * Math.sin(u * 0.7) - 0.05) / (0.2 + 0.1 * n2), 2)) * sstep(0.35, 0.62, n2 + 0.15 * Math.exp(-lc * lc));
        I *= 1 - 0.82 * rift;
        var warm = Math.exp(-lc * lc * 2.2), pink = sstep(0.62, 0.78, n2) * Math.exp(-v * v * 2) * 0.5;
        var R = I * (0.62 + 0.5 * warm) + pink * 0.5, G = I * (0.66 + 0.3 * warm) + pink * 0.08, B = I * (0.85 - 0.15 * warm) + pink * 0.22;
        var sky = 0.06 + 0.1 * (y / BH);
        var i4 = (y * BW + x) * 4;
        d[i4] = 255 * (1 - Math.exp(-(R * 0.85 + sky * 0.25))); d[i4 + 1] = 255 * (1 - Math.exp(-(G * 0.85 + sky * 0.32))); d[i4 + 2] = 255 * (1 - Math.exp(-(B * 0.95 + sky * 0.6))); d[i4 + 3] = 255;
      }
      cx.putImageData(id, 0, 0);
      /* 별 */
      var big = off(w, h), bc = big.getContext('2d'); bc.imageSmoothingEnabled = true; bc.drawImage(cvs, 0, 0, w, h);
      bc.globalCompositeOperation = 'lighter';
      var R2 = rng(5), Ns = Math.round(w * h / 300);
      for (var s = 0; s < Ns; s++) {
        var sx = R2() * w, sy = R2() * h, ddx = sx - w * o.cxF, ddy = sy - h * o.cyF, bb = (-ddx * sa + ddy * ca) / (h * o.wF), near = Math.exp(-bb * bb * 0.8);
        if (R2() > 0.25 + 0.75 * near) continue;
        var m = Math.pow(R2(), 4.5), col = R2() < 0.35 ? [175, 200, 255] : R2() < 0.6 ? [255, 228, 196] : [240, 243, 255];
        star(bc, sx, sy, 0.9 + m * 9, col, 0.3 + 0.7 * Math.min(1, m * 3 + R2() * 0.5), m > 0.55);
      }
      bc.globalCompositeOperation = 'source-over';
      /* 산 능선 두 겹 + 지평선 빛 */
      if (o.mountains) {
        var hz = bc.createLinearGradient(0, h * 0.62, 0, h); hz.addColorStop(0, 'rgba(60,90,140,0)'); hz.addColorStop(1, 'rgba(70,96,140,.35)'); bc.fillStyle = hz; bc.fillRect(0, h * 0.6, w, h * 0.4);
        var nm = noise(11);
        [[0.76, 0.1, '#0d1626', '#121e33', 0.004], [0.86, 0.07, '#060a12', '#0a111d', 0.007]].forEach(function (L, li) {
          bc.beginPath(); bc.moveTo(0, h);
          for (var xx = 0; xx <= w; xx += 3) bc.lineTo(xx, h * (L[0] - L[1] * (nm.fbm(xx * L[4] + li * 40, 0.5, 5) - 0.3) * 2.2));
          bc.lineTo(w, h); bc.closePath();
          var mg = bc.createLinearGradient(0, h * (L[0] - L[1]), 0, h); mg.addColorStop(0, L[3]); mg.addColorStop(1, L[2]); bc.fillStyle = mg; bc.fill();
        });
        /* 골짜기의 작은 불빛 */
        bc.globalCompositeOperation = 'lighter';
        for (var t = 0; t < 26; t++) star(bc, w * (0.62 + R2() * 0.2), h * (0.93 + R2() * 0.05), 1.5 + R2() * 2.5, [255, 200, 130], 0.5);
        bc.globalCompositeOperation = 'source-over';
      }
      img = bandCache[key] = big;
    }
    ctx.drawImage(img, 0, 0, w, h);
    return { c: ctx, w: w, h: h };
  }

  /* ===== 성단 (모형) ===== */
  var cluCache = {};
  /* kind: 'open' | 'glob', 결과는 size×size 캔버스 (둥근 사진처럼 쓰세요) */
  function cluster(kind, size, seed, opt) {
    opt = opt || {};
    var key = kind + size + '_' + seed + (opt.zoom || 1);
    if (cluCache[key]) return cluCache[key];
    var cv = off(size, size), c = cv.getContext('2d'), R = rng(seed || 1), Z = opt.zoom || 1, s = size;
    space(c, s, s, seed + 9, Math.round(s * s / 1800));
    c.globalCompositeOperation = 'lighter';
    if (kind === 'open') {
      /* 엉성하게 모인 파란 고온의 별 + 둘레의 옅은 빛 */
      var n = opt.n || 60, pts = [];
      for (var i = 0; i < n; i++) {
        var rr = Math.abs(gauss(R)) * 0.2 * s * Z, a = R() * Math.PI * 2, m = Math.pow(R(), 2.6);
        pts.push([s / 2 + rr * Math.cos(a) * 1.15, s / 2 + rr * Math.sin(a) * 0.9, m]);
      }
      pts.forEach(function (p) {
        if (p[2] > 0.45) { var g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], s * 0.12 * p[2]); g.addColorStop(0, 'rgba(70,120,255,.22)'); g.addColorStop(1, 'rgba(70,120,255,0)'); c.fillStyle = g; c.fillRect(0, 0, s, s); }
      });
      pts.forEach(function (p) {
        var col = R() < 0.82 ? [110, 160, 255] : [215, 230, 255];
        star(c, p[0], p[1], s * (0.007 + 0.05 * p[2]) * Math.sqrt(Z), col, 0.75 + p[2] * 0.25, p[2] > 0.35);
      });
    } else {
      /* 촘촘한 공 모양, 붉은색을 띠는 저온의 별 */
      var N = opt.n || Math.round(s * s / 40), A = s * 0.06 * Z;
      var cg = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.32 * Z); cg.addColorStop(0, 'rgba(255,214,150,.55)'); cg.addColorStop(0.35, 'rgba(255,190,120,.2)'); cg.addColorStop(1, 'rgba(255,170,110,0)');
      c.fillStyle = cg; c.fillRect(0, 0, s, s);
      for (var j = 0; j < N; j++) {
        var u = Math.max(1e-4, R()), rq = A / Math.sqrt(Math.pow(u, -2 / 3) - 1); if (rq > s * 0.5) continue;
        var aa = R() * Math.PI * 2, x = s / 2 + rq * Math.cos(aa), y = s / 2 + rq * Math.sin(aa), m2 = Math.pow(R(), 5), pk = R();
        var col2 = pk < 0.5 ? [255, 196, 120] : pk < 0.85 ? [255, 140, 90] : pk < 0.96 ? [255, 232, 200] : [170, 200, 255];
        star(c, x, y, s * (0.004 + 0.016 * m2) * (opt.zoom > 1 ? 1.5 : 1), col2, 0.55 + 0.45 * m2, false);
      }
    }
    c.globalCompositeOperation = 'source-over';
    cluCache[key] = cv; return cv;
  }

  /* ===== 성운 (모형) ===== kind: 'emit' 방출, 'refl' 반사, 'dark' 암흑 */
  var nebCache = {};
  function nebula(kind, size, seed) {
    var key = kind + size + '_' + (seed || 0);
    if (nebCache[key]) return nebCache[key];
    var s = size, BW = Math.min(300, s), cv = off(BW, BW), c = cv.getContext('2d'), id = c.createImageData(BW, BW), d = id.data;
    var n1 = noise(101 + (seed || 0)), n2 = noise(203 + (seed || 0));
    var HM = null;
    if (kind === 'dark') {
      /* 말머리 모양 그림자(왼쪽을 보는 옆모습) + 아래쪽 성간 물질 */
      var mc = off(BW, BW), mx = mc.getContext('2d'), Q = function (p) { return [p[0] * BW, p[1] * BW]; };
      var H = [[0.66, 1.02], [0.64, 0.62], [0.63, 0.45], [0.62, 0.34], [0.585, 0.25], [0.565, 0.19], [0.545, 0.25], [0.51, 0.27], [0.465, 0.3], [0.42, 0.35], [0.38, 0.4], [0.355, 0.44], [0.36, 0.475], [0.4, 0.49], [0.45, 0.485], [0.49, 0.52], [0.51, 0.58], [0.5, 0.66], [0.47, 1.02]];
      mx.fillStyle = '#fff'; mx.beginPath(); H.forEach(function (p, i) { var q = Q(p); if (i) mx.lineTo(q[0], q[1]); else mx.moveTo(q[0], q[1]); }); mx.closePath(); mx.fill();
      mx.beginPath(); mx.moveTo(0, BW); for (var xx = 0; xx <= BW; xx += 2) mx.lineTo(xx, BW * (0.7 + 0.04 * Math.sin(xx / BW * 9) + 0.05 * (n1.fbm(xx / BW * 4, 3, 4) - 0.5) * 2)); mx.lineTo(BW, BW); mx.closePath(); mx.fill();
      var md = mx.getImageData(0, 0, BW, BW).data; HM = new Float32Array(BW * BW); for (var q2 = 0; q2 < BW * BW; q2++) HM[q2] = md[q2 * 4] / 255;
      blur(HM, BW, BW, Math.max(1, Math.round(BW / 100)));
    }
    for (var y = 0; y < BW; y++) for (var x = 0; x < BW; x++) {
      var u = x / BW, v = y / BW, wx = u * 3 + 1.4 * n2.fbm(u * 3, v * 3, 4), wy = v * 3 + 1.4 * n2.fbm(u * 3 + 7, v * 3 + 2, 4);
      var f = n1.fbm(wx, wy, 6), r0 = Math.hypot(u - 0.5, v - 0.5), R = 0, G = 0, B = 0;
      if (kind === 'emit') {
        var I = Math.exp(-r0 * r0 * 9) * (0.3 + 1.6 * f * f) + 0.08 * f, core = Math.exp(-Math.pow(Math.hypot(u - 0.52, v - 0.47), 2) * 90);
        var lane = sstep(0.5, 0.62, n2.fbm(u * 5 + 3, v * 5, 5)) * Math.exp(-r0 * r0 * 6);
        I *= 1 - 0.75 * lane;
        R = I * 1.5 + core * 1.3; G = I * 0.38 + core * 1.05 + I * I * 0.25; B = I * 0.55 + core * 0.9;
      } else if (kind === 'refl') {
        var dl = Math.hypot(u - 0.45, v - 0.42), I2 = Math.exp(-dl * dl * 7) * (0.25 + 1.5 * f * f) + 0.05 * f;
        var lane2 = sstep(0.48, 0.6, n2.fbm(u * 4 + 1, v * 4 + 5, 5));
        I2 *= 1 - 0.85 * lane2;
        R = I2 * 0.45 + lane2 * 0.06 * f; G = I2 * 0.75 + lane2 * 0.04 * f; B = I2 * 1.55;
      } else {
        /* 뒤쪽의 밝은 배경(붉은 빛 + 별)과 그 앞을 가로막는 성간 물질 */
        var bg = (0.35 + 0.9 * f) * sstep(0.95, 0.25, u + (v - 0.5) * 0.2) * 0.9 + 0.12 * f;
        var mask = sstep(0.32, 0.68, HM[y * BW + x] + (n2.fbm(u * 9, v * 9, 4) - 0.5) * 0.55);
        R = bg * 1.45; G = bg * 0.32; B = bg * 0.55;
        R *= 1 - 0.96 * mask; G *= 1 - 0.96 * mask; B *= 1 - 0.96 * mask;
        R += mask * 0.04 * f; G += mask * 0.03 * f; B += mask * 0.03 * f;
        d[(y * BW + x) * 4 + 3] = 255;
        var i5 = (y * BW + x) * 4; d[i5] = 255 * (1 - Math.exp(-R)); d[i5 + 1] = 255 * (1 - Math.exp(-G)); d[i5 + 2] = 255 * (1 - Math.exp(-B));
        cv.mask = cv.mask || new Float32Array(BW * BW); cv.mask[y * BW + x] = mask;
        continue;
      }
      var i4 = (y * BW + x) * 4; d[i4] = 255 * (1 - Math.exp(-R)); d[i4 + 1] = 255 * (1 - Math.exp(-G)); d[i4 + 2] = 255 * (1 - Math.exp(-B)); d[i4 + 3] = 255;
    }
    c.putImageData(id, 0, 0);
    var out = off(s, s), oc = out.getContext('2d'); oc.imageSmoothingEnabled = true; oc.drawImage(cv, 0, 0, s, s);
    oc.globalCompositeOperation = 'lighter';
    var R3 = rng(9 + (seed || 0)), Nst = Math.round(s * s / 700);
    for (var k = 0; k < Nst; k++) {
      var sx = R3() * s, sy = R3() * s, m = Math.pow(R3(), 4);
      if (kind === 'dark' && cv.mask && cv.mask[Math.floor(sy / s * BW) * BW + Math.floor(sx / s * BW)] > 0.4) continue;
      star(oc, sx, sy, s * (0.004 + 0.02 * m), R3() < 0.5 ? [200, 215, 255] : [255, 236, 214], 0.45 + m * 0.5, false);
    }
    if (kind === 'emit') [[0.5, 0.46], [0.53, 0.48], [0.515, 0.5], [0.49, 0.49]].forEach(function (p) { star(oc, p[0] * s, p[1] * s, s * 0.035, [200, 220, 255], 1, true); });
    if (kind === 'refl') star(oc, 0.45 * s, 0.42 * s, s * 0.06, [210, 225, 255], 1, true);
    if (kind === 'dark') star(oc, 0.75 * s, 0.16 * s, s * 0.05, [210, 225, 255], 1, true);
    oc.globalCompositeOperation = 'source-over';
    nebCache[key] = out; return out;
  }
  /* 둥근 사진 틀에 그려요 */
  function disc(ctx, img, x, y, r, ring) {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(img, x - r, y - r, r * 2, r * 2); ctx.restore();
    ctx.save(); ctx.strokeStyle = ring || 'rgba(220,232,255,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  /* 둥근 이름표 글자 (그림 위 설명) */
  function tag(ctx, text, x, y, opt) {
    opt = opt || {};
    ctx.save(); ctx.font = (opt.weight || 800) + ' ' + (opt.size || 14) + 'px Pretendard, sans-serif'; ctx.textBaseline = 'middle';
    var tw = ctx.measureText(text).width, pw = 8, ph = (opt.size || 14) * 0.95;
    var al = opt.align || 'center', x0 = al === 'center' ? x - tw / 2 - pw : al === 'left' ? x : x - tw - pw * 2;
    ctx.fillStyle = opt.bg || 'rgba(8,14,32,.78)'; ctx.beginPath(); ctx.roundRect(x0, y - ph, tw + pw * 2, ph * 2, ph); ctx.fill();
    if (opt.border) { ctx.strokeStyle = opt.border; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.fillStyle = opt.color || '#eef2fc'; ctx.textAlign = 'left'; ctx.fillText(text, x0 + pw, y + 0.5); ctx.restore();
    return tw + pw * 2;
  }
  /* 양쪽 화살표 치수선 */
  function dim(ctx, x1, y1, x2, y2, col) {
    ctx.save(); ctx.strokeStyle = col || 'rgba(255,255,255,.9)'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var a = Math.atan2(y2 - y1, x2 - x1);
    [[x1, y1, a + Math.PI], [x2, y2, a]].forEach(function (p) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] - 9 * Math.cos(p[2] - 0.4), p[1] - 9 * Math.sin(p[2] - 0.4)); ctx.lineTo(p[0] - 9 * Math.cos(p[2] + 0.4), p[1] - 9 * Math.sin(p[2] + 0.4)); ctx.closePath(); ctx.fill(); });
    ctx.restore();
  }
  return { D: D, rng: rng, gauss: gauss, noise: noise, clamp: clamp, sstep: sstep, rgb: rgb, mix: mix, fit: fit, off: off, sprite: sprite, star: star, space: space,
    galaxy: galaxy, proj: proj, renderGalaxy: renderGalaxy, renderBand: renderBand, cluster: cluster, nebula: nebula, disc: disc, tag: tag, dim: dim };
})();
