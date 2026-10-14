/* ===== 판의 경계 덩어리 그림 (BND) =====
   교과서 그림 Ⅱ-16(판의 구조)처럼 땅을 네모난 덩어리로 잘라 비스듬히 내려다본 그림이에요.
   - 좌표: x(왼→오른, 0~BW), d(앞→뒤 안쪽, 0~BD), z(위가 +, 땅 표면 0 근처, 아래로 -). 100 km ≈ 105.
   - 모드: sub(부딪침: 바다 쪽 판과 대륙 쪽 판), col(부딪침: 대륙과 대륙), div(갈라짐), tra(어긋남)
   - 빛은 왼쪽 앞 위에서 와요. 윗면은 작은 면마다 밝기를 계산(입체), 앞면·옆면은 같은 질감으로 그려요.
   - 높이·두께는 잘 보이게 크게 과장한 모형이에요. 글씨는 ART.overlay(HTML)로 얹어요. */
window.BND = (function () {
  'use strict';
  var A = window.ART, R = A.REDUCE, clamp = A.clamp, lerp = A.lerp, fbm = A.fbm, rng = A.rng;
  var BW = 920, BD = 250, ZB = -300, X0 = 70, Y0 = 392, KX = 0.5, KY = 0.36, DW = 1200, DH = 720;
  // 모드마다 보는 각도: 어긋나는 곳은 윗면(도로)이 잘 보이게 더 위에서 내려다봐요
  var VIEWS = { str: [70, 392, 0.5, 0.36, -300], sub: [70, 392, 0.5, 0.36, -300], col: [70, 392, 0.5, 0.36, -300], div: [70, 392, 0.5, 0.36, -300], tra: [96, 452, 0.42, 0.74, -215] };
  function view(m) { var v = VIEWS[m]; X0 = v[0]; Y0 = v[1]; KX = v[2]; KY = v[3]; ZB = v[4]; }
  function P(x, d, z) { return [X0 + x + d * KX, Y0 - z - d * KY]; }
  function hasSea(m) { return m === 'sub' || m === 'div' || m === 'str'; }
  function ss(a, b, x) { var k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); }
  function g1(x, m, s) { var u = (x - m) / s; return Math.exp(-u * u); }
  function mix(c1, c2, k) { return [lerp(c1[0], c2[0], k), lerp(c1[1], c2[1], k), lerp(c1[2], c2[2], k)]; }
  function rgb(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? 1 : a) + ')'; }

  /* ---------- 질감 (단면용, 한 번 만들어 무늬로) ---------- */
  var TX = {};
  function paint(key, base, sp, seed, sc, amp) {
    if (TX[key]) return TX[key];
    var c = A.canvas(256, 256), g = c.getContext('2d'), r = rng(seed); g.fillStyle = rgb(base); g.fillRect(0, 0, 256, 256);
    var id = g.getImageData(0, 0, 256, 256), d = id.data;
    for (var y = 0; y < 256; y++) for (var x = 0; x < 256; x++) { var n = (fbm(x / sc, y / sc, seed) - 0.5) * amp, k = (y * 256 + x) * 4; d[k] = clamp(d[k] + n, 0, 255); d[k + 1] = clamp(d[k + 1] + n * 0.9, 0, 255); d[k + 2] = clamp(d[k + 2] + n * 0.75, 0, 255); }
    g.putImageData(id, 0, 0);
    for (var i = 0; i < sp.n; i++) { g.fillStyle = sp.cols[Math.floor(r() * sp.cols.length)]; var s = sp.s0 + r() * (sp.s1 - sp.s0); g.beginPath(); g.ellipse(r() * 256, r() * 256, s, s * (0.5 + r() * 0.5), r() * 3, 0, 6.283); g.fill(); }
    TX[key] = c; return c;
  }
  var CC = [206, 186, 148], OC = [92, 101, 110], LI = [228, 176, 118], MA = [204, 112, 58];
  function tex(key) {
    if (key === 'cc') return paint('cc', CC, { n: 2600, cols: ['rgba(255,250,240,.45)', 'rgba(120,100,80,.28)', 'rgba(170,120,100,.25)', 'rgba(60,55,50,.3)'], s0: 0.5, s1: 1.7 }, 3, 26, 34);
    if (key === 'oc') return paint('oc', OC, { n: 2200, cols: ['rgba(40,44,50,.4)', 'rgba(150,158,166,.3)'], s0: 0.5, s1: 1.4 }, 5, 18, 30);
    if (key === 'li') return paint('li', LI, { n: 1400, cols: ['rgba(255,236,200,.35)', 'rgba(170,110,60,.22)'], s0: 0.6, s1: 1.8 }, 7, 34, 26);
    return paint('ma', MA, { n: 900, cols: ['rgba(255,190,120,.25)', 'rgba(120,50,20,.22)'], s0: 0.8, s1: 2.4 }, 9, 46, 40);
  }
  var pats = {};
  function pat(ctx, key) { if (!pats[key] || pats[key].c !== ctx) pats[key] = { c: ctx, p: ctx.createPattern(tex(key), 'repeat') }; return pats[key].p; }

  /* ---------- 모드별 설정 ---------- */
  var XT = 430, XV = 700, DV = 40, XC = 500, XR = 470, DF = 125, XROAD = 560;
  var MODES = {
    sub: { vL: 26, vR: -6 }, col: { vL: 20, vR: -4 }, div: { vL: -14, vR: 14 }, tra: { v: 11 },
  };
  /* 지진 일정: T(그림 시간)에 따라 정해져요 (다시 봐도 같아요) */
  function quakes(mode, T) {
    if (mode === 'str') return [];
    var iv = mode === 'tra' ? 4.5 : mode === 'div' ? 1.3 : mode === 'col' ? 1.0 : 0.85, life = mode === 'tra' ? 2.4 : 1.7, out = [];
    for (var k = Math.max(0, Math.floor((T - life) / iv)); k <= Math.floor(T / iv); k++) {
      var r = rng(9173 + k * 31 + (mode.charCodeAt(0) * 7)), t0 = mode === 'tra' ? k * iv + 4.5 * 0.999 : k * iv + r() * iv * 0.6; if (mode === 'tra') { t0 = (k + 1) * iv; }
      var age = T - t0; if (age < 0 || age > life) continue;
      out.push({ k: k, r: r, age: age, life: life, big: mode === 'tra' || r() < 0.18 });
    }
    return out;
  }
  // 바다 쪽 판이 들어가는 길 (판 윗면 선): 처음엔 수평, 해구 근처에서 휘어 비스듬히 내려가요
  var SLAB = (function () {
    var pts = [], x = -600, z = -22, a = 0, s = 0;
    while (z > ZB - 160) { pts.push([x, z, a, s]); var da = x > XT - 70 ? Math.min(0.0042 * 4, Math.max(0, (0.66 - a))) : 0; a += da; x += 4 * Math.cos(a); z -= 4 * Math.sin(a); s += 4; }
    return pts;
  })();
  function slabAt(s) { var i = clamp(Math.floor((s - SLAB[0][3]) / 4), 0, SLAB.length - 2), p = SLAB[i], q = SLAB[i + 1], k = clamp((s - p[3]) / 4, 0, 1); return [lerp(p[0], q[0], k), lerp(p[1], q[1], k), lerp(p[2], q[2], k)]; }
  var S_TRENCH = (function () { for (var i = 0; i < SLAB.length; i++) if (SLAB[i][0] >= XT - 20) return SLAB[i][3]; return 0; })();
  var SLABZ = (function () { var a = new Float32Array(BW + 41), j = 1; for (var x = -20; x <= BW + 20; x++) { while (j < SLAB.length && SLAB[j][0] < x) j++; a[x + 20] = j < SLAB.length ? SLAB[j][1] : -1e9; } return a; })();
  function slabTopZ(x) { x = Math.round(x); return x < -20 ? -22 : x > BW + 20 ? -1e9 : SLABZ[x + 20]; }

  /* ---------- 땅 높이 ---------- */
  function colK(T) { return 1 - Math.exp(-T / 22); }
  function traOff(d, T) { // 어긋나는 경계: 판이 움직인 거리 (경계 근처는 버티다가 지진 때 한꺼번에)
    var v = MODES.tra.v, iv = 4.5, kq = Math.floor(T / iv), S = kq * iv * v, e = (T - kq * iv) * v, sg = d < DF ? -1 : 1;
    return sg * (S / 2 + e / 2 * Math.tanh(Math.abs(d - DF) / 42));
  }
  function zs(mode, x, d, T) {
    if (mode === 'str') { var cs = ss(400, 530, x), mt = 118 * Math.exp(-Math.pow((x - 770) / (85 + 25 * fbm(d / 80, 2, 5)), 2)) * (0.45 + 0.55 * fbm(x / 42, d / 36, 6)); return lerp(-24 + 3 * (fbm(x / 40, d / 40, 3) - 0.5), 14 + 18 * fbm(x / 90, d / 60, 4), cs) + cs * mt; }
    if (mode === 'sub') {
      var sea = Math.max(slabTopZ(x), -70) + 5 * g1(x, XT - 130, 70), c = ss(XT + 10, XT + 125, x);
      var land = 14 + 22 * fbm(x / 95, d / 70, 3) + 18 * ss(760, 900, x) * fbm(x / 60, d / 50, 8);
      var z = lerp(sea, land, c);
      var cone = function (cx, cd, h, s) { var r = Math.hypot(x - cx, (d - cd) * 1.05); return h * Math.exp(-Math.pow(r / s, 1.7)) - 9 * g1(r, 0, 7) * (h / 100); };
      return z + c * (cone(XV, DV, 108, 54) + cone(XV - 25, 175, 86, 50) + cone(XV + 35, 248, 70, 46));
    }
    if (mode === 'col') {
      var k = colK(T), left = 10 + 6 * fbm((x - MODES.col.vL * T * 0.25) / 80, d / 60, 2), ridge = Math.exp(-Math.pow((x - 600) / (95 + 30 * fbm(d / 90, 1, 4)), 2));
      var peaks = 0.55 + 0.45 * fbm(x / 46, d / 40, 6), plateau = ss(640, 760, x) * (28 + 22 * k);
      return left * (1 - ss(XC - 60, XC + 40, x)) + ss(XC - 60, XC + 40, x) * (14 + plateau) + (24 + 132 * k) * ridge * peaks;
    }
    if (mode === 'div') { var ax = Math.abs(x - XR); return -12 - 22 * Math.sqrt(Math.min(1, ax / 330)) - 7 * g1(x, XR, 9) + 3 * g1(ax, 26, 10) + 2.5 * (fbm(x / 30, d / 30, 5) - 0.5); }
    // tra
    var o = traOff(d, T), xx = x - o;
    return 20 + 18 * fbm(xx / 110, d / 58, 11) + 8 * fbm(xx / 40, d / 30, 12) - 7 * g1(d, DF, 7);
  }

  /* ---------- 윗면 (작은 면마다 빛 계산) ---------- */
  var L = (function () { var l = [-0.55, -0.42, 0.72], n = Math.hypot(l[0], l[1], l[2]); return [l[0] / n, l[1] / n, l[2] / n]; })();
  var NX = 104, ND = 14, HZ = [];
  function topColor(mode, x, d, z, T, sh) {
    if (z < 0 && mode !== 'tra' && mode !== 'col') { // 바다: 깊을수록 진한 파랑
      var k = clamp(-z / 46, 0, 1), c = mix([126, 178, 206], [44, 104, 150], k);
      if (mode === 'div') { var ax = Math.abs(x - XR), ph = (ax + MODES.div.vR * T) % 64; c = mix(c, [64, 120, 160], 0.18 * (ph < 32 ? 1 : 0) * ss(10, 30, ax)); }
      return mix(c, [210, 232, 244], 0.08 + 0.06 * (sh - 0.8));
    }
    var n = fbm(x / 26, d / 22, 21), base;
    if (mode === 'tra') { var xx = x - traOff(d, T); base = mix([214, 192, 132], [168, 164, 106], fbm(xx / 60, d / 40, 13)); }
    else if (mode === 'col') {
      var xx2 = x < XC - 40 ? x - MODES.col.vL * T * 0.25 : x;
      base = z > 104 ? mix([206, 214, 222], [252, 253, 255], ss(104, 130, z)) : z > 58 ? mix([166, 150, 128], [136, 126, 116], fbm(xx2 / 30, d / 25, 3)) : mix([124, 152, 92], [160, 150, 104], ss(18, 60, z) * 0.8 + 0.2 * fbm(xx2 / 50, d / 40, 4));
    } else {
      base = z < 5 ? [214, 198, 156] : z > 70 ? mix([156, 142, 122], [128, 120, 110], ss(70, 105, z)) : mix([112, 146, 86], [150, 140, 98], ss(20, 70, z) * 0.85 + 0.15 * n);
    }
    var lit = 0.62 + 0.55 * (sh - 0.6);
    return mix(base, [0, 0, 0], 0) .map(function (v, i) { return clamp(v * lit + (n - 0.5) * 14, 0, 255); });
  }
  function drawTop(ctx, mode, T) {
    var dx = BW / NX, dd = BD / ND, i, j;
    HZ.length = (NX + 1) * (ND + 1);
    for (j = 0; j <= ND; j++) for (i = 0; i <= NX; i++) HZ[j * (NX + 1) + i] = zs(mode, i * dx, j * dd, T);
    for (j = ND - 1; j >= 0; j--) for (i = 0; i < NX; i++) {
      var a = HZ[j * (NX + 1) + i], b = HZ[j * (NX + 1) + i + 1], c = HZ[(j + 1) * (NX + 1) + i + 1], e = HZ[(j + 1) * (NX + 1) + i];
      var x = (i + 0.5) * dx, d = (j + 0.5) * dd, z = (a + b + c + e) / 4, sea = z < 0 && hasSea(mode);
      var gx = ((b + c) - (a + e)) / (2 * dx), gd = ((e + c) - (a + b)) / (2 * dd), nn = Math.hypot(gx, gd, 1), sh = sea ? 0.85 : clamp((-gx * L[0] - gd * L[1] + L[2]) / nn, 0, 1);
      var col = topColor(mode, x, d, z, T, sh);
      var za = sea ? 0 : Math.max(a, hasSea(mode) ? 0 : -99), zb = sea ? 0 : Math.max(b, hasSea(mode) ? 0 : -99), zc = sea ? 0 : Math.max(c, hasSea(mode) ? 0 : -99), ze = sea ? 0 : Math.max(e, hasSea(mode) ? 0 : -99);
      var p1 = P(i * dx, j * dd, za), p2 = P((i + 1) * dx, j * dd, zb), p3 = P((i + 1) * dx, (j + 1) * dd, zc), p4 = P(i * dx, (j + 1) * dd, ze);
      ctx.fillStyle = rgb(col); ctx.strokeStyle = rgb(col); ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.lineTo(p4[0], p4[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // 물결 반짝임 (바다)
    if (hasSea(mode)) {
      ctx.save(); ctx.globalAlpha = 0.22; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      for (var w = 0; w < 26; w++) { var r = rng(500 + w), wx = r() * (mode === 'sub' ? XT + 40 : BW), wd = r() * BD, ph = (T * 0.4 + r()) % 1, zz = zs(mode, wx, wd, T); if (zz > -3) continue; var p = P(wx, wd, 0); ctx.globalAlpha = 0.25 * Math.sin(ph * Math.PI); ctx.beginPath(); ctx.moveTo(p[0] - 10, p[1]); ctx.quadraticCurveTo(p[0], p[1] - 2, p[0] + 10, p[1]); ctx.stroke(); }
      ctx.restore();
    }
  }

  /* ---------- 앞면·옆면 (단면) ---------- */
  // (x, z) 평면에 그리는 도형: 앞면은 그대로, 옆면은 (d, z)로
  function frontT(ctx) { ctx.setTransform(ctx._s, 0, 0, -ctx._s, ctx._ox + X0 * ctx._s, ctx._oy + Y0 * ctx._s); }
  function sideT(ctx) { ctx.setTransform(ctx._s * KX, -ctx._s * KY, 0, -ctx._s, ctx._ox + (X0 + BW) * ctx._s, ctx._oy + Y0 * ctx._s); }
  function poly(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); }
  function fillTex(ctx, key, shade) {
    ctx.fillStyle = pat(ctx, key); ctx.fill();
    if (shade) { ctx.fillStyle = shade; ctx.fill(); }
  }
  function curve(f, x0, x1, step) { var a = []; for (var x = x0; x <= x1 + 0.01; x += step) a.push([x, f(x)]); return a; }
  // 단면 한 장 그리기: prof(x) = 그 면의 땅 높이, len = 면의 길이, side = 옆면인가
  function section(ctx, mode, T, side) {
    var len = side ? BD : BW, sh = side ? 'rgba(40,24,10,.16)' : null;
    var prof = side ? function (d) { return zs(mode, BW, d, T); } : function (x) { return zs(mode, x, 0, T); };
    var top = curve(prof, 0, len, 5);
    // 면 전체를 잘라 두기
    ctx.save(); poly(ctx, top.concat([[len, ZB], [0, ZB]])); ctx.clip();
    // 맨틀: 아래로 갈수록 붉고 어두워요
    ctx.fillStyle = pat(ctx, 'ma'); ctx.fillRect(-10, ZB - 10, len + 20, -ZB + 260);
    var mg = ctx.createLinearGradient(0, -100, 0, ZB); mg.addColorStop(0, 'rgba(255,190,110,.25)'); mg.addColorStop(1, 'rgba(110,30,10,.35)'); ctx.fillStyle = mg; ctx.fillRect(-10, ZB - 10, len + 20, -ZB + 260);
    var layers = side ? sideLayers(mode, T, prof) : frontLayers(mode, T, prof);
    layers.forEach(function (Ly) { poly(ctx, Ly.p); fillTex(ctx, Ly.k, Ly.shade); if (Ly.edge) { ctx.strokeStyle = Ly.edge; ctx.lineWidth = 1.2; ctx.stroke(); } });
    if (sh) { ctx.fillStyle = sh; ctx.fillRect(-10, ZB - 10, len + 20, -ZB + 260); }
    if (ctx._hi) { ctx.fillStyle = 'rgba(16,22,30,.5)'; ctx.fillRect(-10, ZB - 10, len + 20, ZB * -1 - 112 + 10); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-5, -112); ctx.lineTo(len + 5, -112); ctx.stroke(); }
    // 판의 아래 경계 (교과서처럼 흰 점선)
    ctx.restore();
    // 바다(물) 단면
    if (hasSea(mode)) {
      var wat = top.filter(function (p) { return p[1] < 0; });
      if (wat.length > 1) {
        var wp = [[wat[0][0], 0]].concat(wat).concat([[wat[wat.length - 1][0], 0]]);
        poly(ctx, wp); var wg = ctx.createLinearGradient(0, 0, 0, -50); wg.addColorStop(0, side ? 'rgba(70,130,170,.9)' : 'rgba(96,160,198,.92)'); wg.addColorStop(1, side ? 'rgba(30,80,120,.95)' : 'rgba(40,98,146,.95)'); ctx.fillStyle = wg; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(wp[0][0], 0); ctx.lineTo(wp[wp.length - 1][0], 0); ctx.stroke();
      }
    }
  }
  function band(topF, botF, x0, x1, step) { var a = curve(topF, x0, x1, step || 6), b = curve(botF, x0, x1, step || 6).reverse(); return a.concat(b); }
  function slabPoly(off0, off1, sMin, sMax) { // 휘어지는 판을 윗면에서 off0~off1 만큼 아래로
    var A2 = [], B2 = [];
    SLAB.forEach(function (p) { if (p[3] < sMin || p[3] > sMax) return; var nx = Math.sin(p[2]), nz = -Math.cos(p[2]); A2.push([p[0] + nx * off0, p[1] + nz * off0]); B2.push([p[0] + nx * off1, p[1] + nz * off1]); });
    return A2.concat(B2.reverse());
  }
  function frontLayers(mode, T, prof) {
    var out = [];
    if (mode === 'str') {
      out.push({ k: 'li', p: band(prof, function (x) { return -112 + 4 * fbm(x / 70, 3, 2); }, -10, BW + 10), edge: 'rgba(120,70,30,.3)' });
      out.push({ k: 'cc', p: band(prof, function (x) { return lerp(-36, -46, ss(430, 560, x)) - 3 * fbm(x / 50, 1, 2); }, 430, BW + 10), edge: 'rgba(90,70,40,.35)' });
      out.push({ k: 'oc', p: band(prof, function (x) { return prof(x) - 12; }, -10, 470) });
      return out;
    }
    if (mode === 'sub') {
      var lbot = function (x) { return -128 + 6 * fbm(x / 80, 2, 3); };
      out.push({ k: 'li', p: band(function (x) { return Math.min(prof(x), 0); }, lbot, XT - 40, BW + 10) });
      out.push({ k: 'cc', p: band(prof, function (x) { return -42 - 12 * g1(x, XV, 90) + 4 * fbm(x / 50, 1, 2); }, XT - 30, BW + 10), edge: 'rgba(90,70,40,.35)' });
      out.push({ k: 'li', p: slabPoly(11, 106, -700, 2000), edge: 'rgba(120,70,30,.35)' });
      out.push({ k: 'oc', p: slabPoly(-1, 12, -700, 2000) });
    } else if (mode === 'col') {
      var k = colK(T), dip = 0.32;
      var under = function (x) { return x < XC ? -40 : -40 - (x - XC) * Math.tan(dip); };
      out.push({ k: 'li', p: band(function (x) { return 0; }, function (x) { return -124 + 4 * fbm(x / 70, 3, 1); }, XC - 30, BW + 10) });
      out.push({ k: 'cc', p: band(prof, function (x) { return -40 - (60 + 40 * k) * g1(x, 610, 120) * (0.4 + 0.6 * k) - 4 * fbm(x / 40, 1, 2); }, XC - 50, BW + 10), edge: 'rgba(90,70,40,.35)' });
      // 왼쪽(대륙) 판: 경계에서 얕게 아래로 들어가요
      out.push({ k: 'li', p: band(function (x) { return x < XC ? -38 : under(x); }, function (x) { return (x < XC ? -40 : under(x)) - 86; }, -10, 1100, 6), edge: 'rgba(120,70,30,.35)' });
      out.push({ k: 'cc', p: band(function (x) { return x < XC - 60 ? prof(x) : x < XC ? lerp(prof(x), -2, ss(XC - 60, XC, x)) : under(x) + 36; }, function (x) { return x < XC ? -40 : under(x); }, -10, XC + 140, 5), edge: 'rgba(90,70,40,.35)' });
    } else if (mode === 'div') {
      var lt = function (x) { return prof(x) - 12 - 98 * Math.sqrt(Math.min(1, Math.abs(x - XR) / 360)); };
      out.push({ k: 'li', p: band(function (x) { return prof(x); }, lt, -10, BW + 10, 5), edge: 'rgba(120,70,30,.3)' });
      out.push({ k: 'oc', p: band(prof, function (x) { return prof(x) - 12; }, -10, BW + 10, 5) });
    } else {
      out.push({ k: 'li', p: band(function (x) { return 0; }, function (x) { return -112 + 5 * fbm(x / 70, 4, 1); }, -10, BW + 10) });
      out.push({ k: 'cc', p: band(prof, function (x) { return -38 + 4 * fbm(x / 50, 2, 6); }, -10, BW + 10), edge: 'rgba(90,70,40,.35)' });
    }
    return out;
  }
  function sideLayers(mode, T, prof) {
    var out = [];
    if (mode === 'div') {
      var th = 12 + 98 * Math.sqrt(Math.min(1, Math.abs(BW - XR) / 360));
      out.push({ k: 'li', p: band(prof, function (d) { return prof(d) - th; }, -10, BD + 10) });
      out.push({ k: 'oc', p: band(prof, function (d) { return prof(d) - 12; }, -10, BD + 10) });
    } else {
      var cb = mode === 'col' ? -40 - 28 * colK(T) : mode === 'tra' ? -38 : -42;
      out.push({ k: 'li', p: band(function () { return 0; }, function () { return mode === 'tra' || mode === 'str' ? -112 : -126; }, -10, BD + 10) });
      out.push({ k: 'cc', p: band(prof, function (d) { return cb + 3 * fbm(d / 40, 3, 2); }, -10, BD + 10) });
    }
    return out;
  }

  /* ---------- 움직임 표시 (단면 안의 무늬가 판과 함께 움직여요) ---------- */
  function markers(ctx, mode, T) {
    if (mode === 'str') return;
    ctx.save(); ctx.lineCap = 'round';
    var mk = function (x0, z0, x1, z1, a) { ctx.strokeStyle = 'rgba(110,60,25,' + (a == null ? 0.42 : a) + ')'; ctx.lineWidth = 2; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(x0, z0); ctx.lineTo(x1, z1); ctx.stroke(); ctx.setLineDash([]); };
    if (mode === 'sub') {
      var sp = 74, s0 = (T * MODES.sub.vL) % sp;
      for (var s = -700 + s0; s < SLAB[SLAB.length - 1][3]; s += sp) { var p = slabAt(s), nx = Math.sin(p[2]), nz = -Math.cos(p[2]); if (p[0] < -5 || p[0] > BW + 5 || p[1] < ZB + 5) continue; mk(p[0] + nx * 16, p[1] + nz * 16, p[0] + nx * 100, p[1] + nz * 100); }
      for (var x = BW - ((T * -MODES.sub.vR) % 80); x > XT + 60; x -= 80) { var zt = slabTopZ(x); mk(x, -48, x, Math.max(-122, zt + 6), 0.3); }
    } else if (mode === 'col') {
      var dip = 0.32;
      for (var x2 = (T * MODES.col.vL * 0.9) % 80 - 80; x2 < BW + 80; x2 += 80) { if (x2 < XC) mk(x2, -46, x2, -120); else { var u = -40 - (x2 - XC) * Math.tan(dip); if (u - 86 > ZB) mk(x2, u - 6, x2 + 20, u - 80, 0.38); } }
    } else if (mode === 'div') {
      for (var o = (T * MODES.div.vR) % 64; o < 520; o += 64) {
        [XR - o, XR + o].forEach(function (xx) { if (xx < 0 || xx > BW) return; var th = 98 * Math.sqrt(Math.min(1, Math.abs(xx - XR) / 360)), z0 = zs('div', xx, 0, T) - 14; if (th > 18) mk(xx, z0, xx, z0 - th + 4, 0.38 * ss(30, 90, Math.abs(xx - XR))); });
      }
    } else {
      for (var x3 = BW - ((T * MODES.tra.v / 2) % 80) + 40; x3 > -40; x3 -= 80) mk(x3, -44, x3, -108, 0.32);
    }
    ctx.restore();
  }
  // 마그마 (붉게 빛나는 덩어리가 올라와요)
  function glowBlob(ctx, x, z, r, a) { var g = ctx.createRadialGradient(x, z, 0, x, z, r); g.addColorStop(0, 'rgba(255,236,160,' + a + ')'); g.addColorStop(0.45, 'rgba(255,128,40,' + a * 0.85 + ')'); g.addColorStop(1, 'rgba(200,40,10,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, z, r, 0, 6.283); ctx.fill(); }
  function magma(ctx, mode, T, erupt) {
    if (mode === 'sub') {
      // 들어간 판 위쪽(깊이 약 100 km)에서 생긴 마그마가 화산 아래로 올라와 모여요
      var src = [XV + 70, slabTopZ(XV + 70) + 8], ch = [XV, -38], top = zs('sub', XV, 0, T);
      var lg = ctx.createLinearGradient(XV, ch[1], XV, top); lg.addColorStop(0, 'rgba(255,120,40,.95)'); lg.addColorStop(1, 'rgba(255,200,90,' + (erupt ? 0.95 : 0.55) + ')');
      ctx.strokeStyle = lg; ctx.lineWidth = erupt ? 4.5 : 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(XV, ch[1]); ctx.bezierCurveTo(XV - 4, ch[1] + 30, XV + 5, top - 40, XV, top - 4); ctx.stroke();
      ctx.save(); ctx.translate(ch[0], ch[1]); ctx.scale(1, 0.55); glowBlob(ctx, 0, 0, 40, 0.95); ctx.restore();
      for (var i = 0; i < 5; i++) { var ph = ((T * 0.22 + i / 5) % 1), x = lerp(src[0], ch[0], ph) + Math.sin(ph * 9 + i) * 6, z = lerp(src[1], ch[1] - 6, ph); glowBlob(ctx, x, z, 9 + 5 * Math.sin(ph * 3.14), 0.85 * Math.sin(ph * 3.14)); }
      glowBlob(ctx, src[0], src[1] + 6, 26, 0.5);
    } else if (mode === 'div') {
      var sf = zs('div', XR, 0, T);
      var hg = ctx.createRadialGradient(XR, sf - 70, 6, XR, sf - 70, 150); hg.addColorStop(0, 'rgba(255,190,90,.6)'); hg.addColorStop(1, 'rgba(255,140,60,0)'); ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(XR - 150, ZB); ctx.quadraticCurveTo(XR, sf - 10, XR + 150, ZB); ctx.fill();
      ctx.save(); ctx.translate(XR, sf - 22); ctx.scale(1, 0.45); glowBlob(ctx, 0, 0, 30, 0.95); ctx.restore();
      for (var j = 0; j < 6; j++) { var q = ((T * 0.2 + j / 6) % 1), xx = XR + Math.sin(j * 2.1) * 60 * (1 - q), zz = lerp(ZB + 20, sf - 20, q); glowBlob(ctx, xx, zz, 10, 0.8 * Math.sin(q * 3.14)); }
      ctx.strokeStyle = 'rgba(255,190,90,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(XR, sf - 20); ctx.lineTo(XR, sf - 2); ctx.stroke();
    }
  }
  // 지진: 땅속에서 번쩍이며 퍼지는 물결
  function quakeFlash(ctx, x, z, k, big) {
    var a = 1 - k, R0 = big ? 16 : 10;
    for (var w = 0; w < 3; w++) { var kk = k * 1.25 - w * 0.18; if (kk < 0 || kk > 1) continue; ctx.strokeStyle = 'rgba(255,248,220,' + (0.9 * (1 - kk)).toFixed(3) + ')'; ctx.lineWidth = big ? 2.6 : 1.8; ctx.beginPath(); ctx.arc(x, z, R0 + kk * (big ? 70 : 42), 0, 6.283); ctx.stroke(); }
    var g = ctx.createRadialGradient(x, z, 0, x, z, R0 * 1.4); g.addColorStop(0, 'rgba(255,255,240,' + a + ')'); g.addColorStop(0.5, 'rgba(255,214,90,' + a * 0.9 + ')'); g.addColorStop(1, 'rgba(255,150,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, z, R0 * 1.4, 0, 6.283); ctx.fill();
    // 별 모양 갈라짐
    ctx.strokeStyle = 'rgba(255,255,230,' + a + ')'; ctx.lineWidth = 1.6; ctx.beginPath(); for (var i = 0; i < 6; i++) { var an = i * 1.047 + 0.3; ctx.moveTo(x + Math.cos(an) * 3, z + Math.sin(an) * 3); ctx.lineTo(x + Math.cos(an) * R0 * (0.9 + 0.3 * (i % 2)), z + Math.sin(an) * R0 * (0.9 + 0.3 * (i % 2))); } ctx.stroke();
  }
  function quakePos(mode, q, T) {
    var r = rng(4000 + q.k * 13 + mode.length);
    if (mode === 'sub') { var s = S_TRENCH - 30 + Math.pow(r(), 1.4) * 420, p = slabAt(s); if (r() < 0.25) return { x: XT + 40 + r() * 260, z: -6 - r() * 34, d: 0 }; return { x: p[0] + Math.sin(p[2]) * 6, z: p[1] - Math.cos(p[2]) * 6, d: 0 }; }
    if (mode === 'col') return { x: XC - 20 + r() * 260, z: -8 - r() * 70, d: 0 };
    if (mode === 'div') return { x: XR + (r() - 0.5) * 30, z: zs('div', XR, 0, T) - 6 - r() * 18, d: 0, dTop: r() * BD };
    return { x: 80 + r() * (BW - 160), z: 0, d: DF, top: true };
  }

  /* ---------- 화산 분출 (부딪치는 경계: 바다 쪽 판과 대륙 쪽 판) ---------- */
  function eruptOn(T) { var p = T % 13; return p > 3 && p < 10.5; }
  function plume(ctx, T) {
    var top = zs('sub', XV, DV, T), c = P(XV, DV, top - 4), on = eruptOn(T), p = T % 13;
    var str = on ? ss(3, 4.2, p) * (1 - ss(9.3, 10.5, p)) : 0;
    // 화구의 붉은 빛
    var gl = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], 30); gl.addColorStop(0, 'rgba(255,200,90,' + (0.25 + 0.7 * str) + ')'); gl.addColorStop(1, 'rgba(255,90,20,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.ellipse(c[0], c[1], 30, 16, 0, 0, 6.283); ctx.fill();
    // 흘러내리는 용암 (왼쪽 앞 비탈을 따라 구불구불, 끝으로 갈수록 식어 어두워요)
    if (str > 0.01 || p >= 10.5) {
      var len = clamp((p - 3.6) / 5.5, 0, 1), cool = p >= 10.5 ? clamp((p - 10.5) / 2.5, 0, 1) : 0, cl = [], cr = [], n = 22;
      for (var k = 0; k <= n; k++) { var u = k / n * len, xx = XV - 10 - u * 70 + Math.sin(u * 9) * 6, dd = DV - 8 - u * 26, w = (1 - u * 0.45) * 8 * (0.6 + 0.4 * len);
        var c0 = P(xx - w, dd, zs('sub', xx - w, dd, T) + 1), c1 = P(xx + w, dd, zs('sub', xx + w, dd, T) + 1); cl.push(c0); cr.push(c1); }
      if (len > 0.02) {
        var pts2 = cl.concat(cr.reverse()); ctx.fillStyle = 'rgba(52,34,28,.85)'; poly(ctx, pts2); ctx.fill();
        ctx.save(); poly(ctx, pts2); ctx.clip(); var mid = cl[Math.floor(cl.length / 2)];
        var lg2 = ctx.createLinearGradient(c[0], c[1], cl[cl.length - 1][0], cl[cl.length - 1][1]); lg2.addColorStop(0, rgb(mix([255, 214, 110], [120, 64, 40], cool), 0.95)); lg2.addColorStop(0.7, rgb(mix([255, 120, 30], [90, 50, 36], cool), 0.9)); lg2.addColorStop(1, 'rgba(90,40,24,.9)');
        ctx.fillStyle = lg2; ctx.translate(-1.5, -1); poly(ctx, pts2); ctx.fill(); ctx.restore(); void mid;
      }
    }
    // 화산재 기둥: 아래는 빠르고 위로 갈수록 퍼지며 바람에 밀려요
    if (str > 0.01) {
      var Hc = 215 * str, L2p = [], R2p = [];
      for (var q = 0; q <= 24; q++) { var u = q / 24, yy = c[1] - 4 - u * Hc, cx = c[0] + 95 * u * u + Math.sin(u * 5 + T * 1.3) * 5 * u, w = 7 + 62 * Math.pow(u, 0.9) + Math.sin(u * 9 - T * 2) * 4 * u; L2p.push([cx - w, yy]); R2p.push([cx + w * 1.1, yy]); }
      var cg = ctx.createLinearGradient(0, c[1], 0, c[1] - Hc); cg.addColorStop(0, 'rgba(84,78,76,' + 0.9 * str + ')'); cg.addColorStop(0.5, 'rgba(112,106,102,' + 0.62 * str + ')'); cg.addColorStop(1, 'rgba(150,146,142,0)');
      ctx.save(); ctx.filter = 'blur(3px)'; ctx.fillStyle = cg; A.smoothPath(ctx, L2p.concat(R2p.reverse())); ctx.fill(); ctx.restore();
    }
    for (var i = 0; i < 90; i++) {
      var r = rng(70 + i), life = 4.2 + r() * 1.6, ph = r(), age = ((T + ph * life) % life), tb = T - age, k2 = age / life;
      if (tb < 0 || !eruptOn(tb) || (tb % 13) > 10.1) continue;
      var h = 225 * (1 - Math.pow(1 - k2, 1.8)), drift = 100 * k2 * k2 + (r() - 0.5) * 40 * k2, rad = 12 + 56 * k2;
      var x = c[0] + drift + Math.sin(i + T * 0.7) * 6 * k2, y = c[1] - 6 - h;
      var a = 0.2 * Math.min(1, age * 3) * Math.pow(1 - k2, 1.2) * (0.6 + 0.4 * r());
      var g = ctx.createRadialGradient(x - rad * 0.35, y - rad * 0.4, rad * 0.1, x, y, rad); g.addColorStop(0, 'rgba(176,170,164,' + a + ')'); g.addColorStop(0.55, 'rgba(120,114,110,' + a * 0.8 + ')'); g.addColorStop(1, 'rgba(110,104,100,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.283); ctx.fill();
    }
    // 화산탄: 포물선으로 날아가 떨어져요
    if (str > 0.2) for (var b = 0; b < 7; b++) {
      var rb = rng(300 + b), per = 1.3 + rb() * 0.8, ab = ((T + rb() * per) % per) / per, vx = (rb() - 0.5) * 120, vy = 120 + rb() * 80;
      var bx = c[0] + vx * ab * 1.2, by = c[1] - (vy * ab - 190 * ab * ab) * 1.2; if (by > c[1] + 30) continue;
      ctx.fillStyle = 'rgba(255,' + (190 - ab * 120 | 0) + ',60,' + (1 - ab * 0.6) + ')'; ctx.beginPath(); ctx.arc(bx, by, 2.6, 0, 6.283); ctx.fill();
    }
    return str;
  }

  /* ---------- 땅 위 덤불·나무 (판과 함께 움직여요) ---------- */
  var SHR = (function () { var r = rng(77), a = []; for (var i = 0; i < 150; i++) a.push([r() * 1400 - 240, r() * BD, 0.7 + r() * 0.6, r()]); return a; })();
  function shrubs(ctx, mode, T) {
    var list = [];
    SHR.forEach(function (b) {
      var x = b[0], d = b[1];
      if (mode === 'tra') x += traOff(d, T); else if (mode === 'col') { if (x < XC - 60) x += MODES.col.vL * T * 0.25; x = ((x + 240) % 1400 + 1400) % 1400 - 240; } else if (mode !== 'sub' && mode !== 'str') return;
      if (x < 6 || x > BW - 6 || d < 6 || d > BD - 4) return;
      var z = zs(mode, x, d, T); if (z < 8 || z > (mode === 'col' ? 60 : 72)) return; if (mode === 'sub' && Math.hypot(x - XV, d - DV) < 70) return;
      if (mode === 'tra' && (Math.abs(d - DF) < 10 || Math.abs(x - (XROAD + traOff(d, T))) < 14)) return;
      list.push([x, d, z, b[2], b[3]]);
    });
    list.sort(function (a, b) { return b[1] - a[1]; });
    list.forEach(function (b) {
      var c = P(b[0], b[1], b[2]), s2 = b[3] * (mode === 'tra' ? 5 : 4.2);
      ctx.fillStyle = 'rgba(30,40,20,.25)'; ctx.beginPath(); ctx.ellipse(c[0] + s2 * 0.6, c[1] + 0.5, s2 * 1.1, s2 * 0.45, 0, 0, 6.283); ctx.fill();
      var g = ctx.createRadialGradient(c[0] - s2 * 0.4, c[1] - s2 * 1.3, s2 * 0.2, c[0], c[1] - s2 * 0.8, s2 * 1.2);
      var base = mode === 'tra' ? (b[4] < 0.5 ? [96, 110, 58] : [118, 120, 66]) : (b[4] < 0.5 ? [70, 112, 52] : [88, 128, 60]);
      g.addColorStop(0, rgb(mix(base, [255, 255, 220], 0.35))); g.addColorStop(1, rgb(mix(base, [0, 0, 0], 0.35)));
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(c[0], c[1] - s2 * 0.8, s2, s2 * 0.9, 0, 0, 6.283); ctx.fill();
    });
  }

  /* ---------- 땅 위 화살표 (판이 움직이는 방향) ---------- */
  function surfArrow(ctx, mode, T, x, d, dir, len) {
    var pts = [], w = 13, hw = 26, hl = 34, sgn = dir;
    var shape = [[0, -w], [len - hl, -w], [len - hl, -hw], [len, 0], [len - hl, hw], [len - hl, w], [0, w]];
    var lift = function (xx, dd) { var z = zs(mode, xx, dd, T); return hasSea(mode) ? Math.max(z, 0) + 3 : z + 3; };
    shape.forEach(function (s) { var xx = x + sgn * s[0], dd = d + s[1] * 1.6; pts.push(P(xx, dd, lift(xx, dd))); });
    ctx.save(); ctx.translate(3, 5); ctx.fillStyle = 'rgba(20,30,40,.22)'; poly(ctx, pts); ctx.fill(); ctx.restore();
    var g = ctx.createLinearGradient(pts[0][0], pts[0][1] - 10, pts[0][0], pts[0][1] + 10); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e8eef4');
    ctx.fillStyle = g; poly(ctx, pts); ctx.fill(); ctx.strokeStyle = 'rgba(11,63,115,.85)'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
  }
  // 위아래 화살표가 있는 '판' 표시 (앞면 왼쪽)
  function plateBar(ctx, x, z0, z1) {
    ctx.save(); ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = 2.4; ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 3;
    ctx.beginPath(); ctx.moveTo(x, z0 - 7); ctx.lineTo(x, z1 + 7); ctx.stroke();
    [[z0, -1], [z1, 1]].forEach(function (q) { ctx.beginPath(); ctx.moveTo(x, q[0]); ctx.lineTo(x - 6, q[0] + q[1] * 10); ctx.lineTo(x + 6, q[0] + q[1] * 10); ctx.closePath(); ctx.fill(); });
    ctx.restore();
  }

  /* ---------- 어긋나는 경계: 도로와 울타리 ---------- */
  function road(ctx, T) {
    var lineAt = function (x0, wdt, col, dash) {
      var pts = []; for (var d = 0; d <= BD; d += 4) { var x = x0 + traOff(d, T); pts.push(P(x, d, zs('tra', x, d, T) + 1.2)); }
      ctx.strokeStyle = col; ctx.lineWidth = wdt; ctx.setLineDash(dash || []); ctx.lineJoin = 'round'; ctx.beginPath();
      // 경계(갈라진 틈)에서는 선이 끊겨요
      var prevSide = null; pts.forEach(function (p, i) { var side = i * 4 < DF ? 0 : 1; if (i && side === prevSide) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); prevSide = side; }); ctx.stroke(); ctx.setLineDash([]);
    };
    lineAt(XROAD, 15, 'rgba(60,60,64,.25)'); lineAt(XROAD, 12, '#6b6d72'); lineAt(XROAD, 1.6, 'rgba(250,220,90,.95)', [7, 7]);
    lineAt(300, 2.2, 'rgba(110,80,50,.85)', [2, 6]);
    // 경계를 따라 난 좁은 골짜기와 틈
    ctx.strokeStyle = 'rgba(60,40,20,.55)'; ctx.lineWidth = 2; ctx.beginPath();
    for (var x = 0; x <= BW; x += 6) { var p = P(x, DF, zs('tra', x, DF, T) + 0.5); if (x) ctx.lineTo(p[0], p[1] + Math.sin(x * 0.3) * 0.8); else ctx.moveTo(p[0], p[1]); } ctx.stroke();
  }
  function ripple(ctx, mode, x, d, k, big, T) {
    var z = zs(mode, x, d, T); if (mode === 'sub' || mode === 'div') z = Math.max(z, 0); var c = P(x, d, z + 1);
    for (var w = 0; w < 3; w++) { var kk = k * 1.2 - w * 0.17; if (kk < 0 || kk > 1) continue; ctx.strokeStyle = 'rgba(255,255,255,' + (0.85 * (1 - kk)).toFixed(3) + ')'; ctx.lineWidth = big ? 2.4 : 1.6; ctx.beginPath(); ctx.ellipse(c[0], c[1], 10 + kk * (big ? 120 : 60), (10 + kk * (big ? 120 : 60)) * 0.42, 0, 0, 6.283); ctx.stroke(); }
  }

  /* ---------- 한 장면 그리기 ---------- */
  function draw(ctx, W, H, T, mode, o) {
    o = o || {}; view(mode);
    var s = A.fit(ctx, W, H, DW, DH), f = A.fitInfo(), dpr = ctx.getTransform().a / s;
    ctx._s = s * dpr; ctx._ox = f.ox * dpr; ctx._oy = f.oy * dpr;
    var qs = quakes(mode, T), shake = 0;
    qs.forEach(function (q) { if (q.big && q.age < 0.5) shake = Math.max(shake, (1 - q.age / 0.5) * (mode === 'tra' ? 5 : 3)); });
    if (R) shake = 0;
    var sx = shake ? Math.sin(T * 90) * shake : 0, sy = shake ? Math.cos(T * 77) * shake * 0.5 : 0;
    ctx._ox += sx * ctx._s; ctx._oy += sy * ctx._s;
    var base = function () { ctx.setTransform(ctx._s, 0, 0, ctx._s, ctx._ox, ctx._oy); };
    base();
    // 하늘
    var sky = ctx.createLinearGradient(0, 0, 0, DH); sky.addColorStop(0, '#e4eef6'); sky.addColorStop(0.55, '#f3f7fa'); sky.addColorStop(1, '#eef2f5'); ctx.fillStyle = sky; ctx.fillRect(-40, -40, DW + 80, DH + 80);
    A.shadow(ctx, X0 + BW / 2 + 70, Y0 - ZB + 18, BW * 0.62, 26, 0.32);
    // 옆면 → 앞면 → 윗면
    ctx._hi = !!o.hi; sideT(ctx); section(ctx, mode, T, true);
    if (mode === 'tra') { ctx.strokeStyle = 'rgba(40,24,10,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(DF, zs('tra', BW, DF, T)); ctx.lineTo(DF + 3, -60); ctx.lineTo(DF - 2, ZB); ctx.stroke(); }
    frontT(ctx); section(ctx, mode, T, false);
    ctx.save(); poly(ctx, curve(function (x) { return zs(mode, x, 0, T); }, 0, BW, 5).concat([[BW, ZB], [0, ZB]])); ctx.clip();
    markers(ctx, mode, T);
    var str = mode === 'sub' ? (eruptOn(T) ? 1 : 0) : 0;
    magma(ctx, mode, T, str);
    // 판의 아래 경계 (흰 점선)
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.6; ctx.setLineDash([7, 6]); ctx.beginPath();
    if (mode === 'sub') { var pb = slabPoly(106, 106.5, -700, 2000).slice(0, 1e4); var half = pb.length / 2; for (var i = 0; i < half; i++) { if (i) ctx.lineTo(pb[i][0], pb[i][1]); else ctx.moveTo(pb[i][0], pb[i][1]); } ctx.moveTo(XT + 210, -128); ctx.lineTo(BW, -128); }
    else if (mode === 'col') { ctx.moveTo(0, -126); ctx.lineTo(XC, -126); ctx.lineTo(BW, -126 - (BW - XC) * Math.tan(0.32)); ctx.moveTo(XC + 260, -124); ctx.lineTo(BW, -124); }
    else if (mode === 'div') { for (var x = 0; x <= BW; x += 6) { var zz = zs('div', x, 0, T) - 12 - 98 * Math.sqrt(Math.min(1, Math.abs(x - XR) / 360)); if (x) ctx.lineTo(x, zz); else ctx.moveTo(x, zz); } }
    else { ctx.moveTo(0, -112); ctx.lineTo(BW, -112); }
    ctx.stroke(); ctx.setLineDash([]);
    qs.forEach(function (q) { var p = quakePos(mode, q, T); if (!p.top) quakeFlash(ctx, p.x, p.z, q.age / q.life, q.big); });
    plateBar(ctx, 36, mode === 'div' ? zs('div', 36, 0, T) : (mode === 'sub' || mode === 'str' ? -22 : 0), mode === 'sub' ? -128 : mode === 'div' ? zs('div', 36, 0, T) - 110 : mode === 'tra' || mode === 'str' ? -112 : -124);
    ctx.restore();
    // 윗면
    base(); drawTop(ctx, mode, T);
    // 모서리 선
    ctx.strokeStyle = 'rgba(40,30,20,.35)'; ctx.lineWidth = 1.2; ctx.beginPath();
    var a1 = P(0, 0, ZB), a2 = P(BW, 0, ZB), a3 = P(BW, BD, ZB), a4 = P(BW, BD, zs(mode, BW, BD, T)), a5 = P(BW, 0, zs(mode, BW, 0, T));
    ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.lineTo(a3[0], a3[1]); ctx.lineTo(a4[0], a4[1]); ctx.moveTo(a2[0], a2[1]); ctx.lineTo(a5[0], a5[1]); ctx.stroke();
    if (mode === 'tra') road(ctx, T);
    shrubs(ctx, mode, T);
    // 땅 위 화살표
    if (mode === 'str') { /* 구조만 보여요 */ }
    else if (mode === 'sub') { surfArrow(ctx, mode, T, 120, 150, 1, 170); surfArrow(ctx, mode, T, 880, 120, -1, 110); }
    else if (mode === 'col') { surfArrow(ctx, mode, T, 90, 140, 1, 190); surfArrow(ctx, mode, T, 890, 120, -1, 90); }
    else if (mode === 'div') { surfArrow(ctx, mode, T, XR - 70, 150, -1, 170); surfArrow(ctx, mode, T, XR + 70, 150, 1, 170); }
    else { surfArrow(ctx, mode, T, 760, 62, -1, 180); surfArrow(ctx, mode, T, 160, 205, 1, 180); }
    // 갈라지는 곳의 붉은 틈 (바다 밑)
    if (mode === 'div') { ctx.save(); ctx.globalAlpha = 0.55 + 0.25 * Math.sin(T * 3); ctx.strokeStyle = '#ffb35a'; ctx.lineWidth = 3; ctx.beginPath(); var a = P(XR, 0, 0.5), b = P(XR, BD, 0.5); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.restore(); }
    qs.forEach(function (q) { var p = quakePos(mode, q, T), k = q.age / q.life; if (mode === 'tra') ripple(ctx, mode, p.x, DF, k, true, T); else if (mode === 'div') ripple(ctx, mode, p.x, p.dTop, k, q.big, T); else ripple(ctx, mode, p.x, 40 + (q.k % 5) * 40, k, q.big, T); });
    var es = 0; if (mode === 'sub') es = plume(ctx, T);
    return { labels: labels(mode, T), quake: qs.some(function (q) { return q.age < 0.6; }), bigQuake: qs.some(function (q) { return q.big && q.age < 0.6; }), erupt: es > 0.2 };
  }
  function L2(k, t, x, d, z, cls, at) { var p = P(x, d, z); return { k: k, t: t, x: p[0], y: p[1], cls: cls || '', at: at || 'c' }; }
  function labels(mode, T) {
    var out = [L2('d0', '0', 0, 0, 0, 'depth', 'r'), L2('d1', '100 km', 0, 0, -105, 'depth', 'r'), L2('d2', '200 km', 0, 0, -210, 'depth', 'r'), L2('pl', '판', 36, 0, mode === 'sub' ? -75 : -62, 'plate')];
    if (mode === 'str') out.push(L2('oc', '해양 지각', 200, 0, -30, 'lay'), L2('cc', '대륙 지각', 760, 0, -22, 'lay'), L2('ma', '맨틀', 320, 0, -215, 'lay'), L2('sea', '바다', 230, 170, 10, 'top'), L2('mt', '대륙', 800, 120, 110, 'top'));
    if (mode === 'sub') out.push(L2('oc', '해양 지각', 230, 0, -32, 'lay'), L2('cc', '대륙 지각', 830, 0, -22, 'lay'), L2('ma', '맨틀', 300, 0, -220, 'lay'), L2('mg', '마그마', XV + 48, 0, -38, 'hot'), L2('vo', '화산', XV + 58, DV + 20, zs('sub', XV, DV, T) - 4, 'top', 'l'), L2('pa', '바다 쪽 판', 200, 180, 22, 'top'), L2('pb', '대륙 쪽 판', 830, 160, 70, 'top'));
    if (mode === 'col') out.push(L2('c1', '대륙 지각', 200, 0, -20, 'lay'), L2('c2', '대륙 지각', 820, 0, -20, 'lay'), L2('ma', '맨틀', 260, 0, -220, 'lay'), L2('mt', '높은 산맥', 600, 150, 30 + 140 * colK(T), 'top'), L2('pa', '대륙이 있는 판', 180, 180, 40, 'top'), L2('pb', '대륙이 있는 판', 860, 170, 80, 'top'));
    if (mode === 'div') out.push(L2('oc', '해양 지각', 760, 0, -38, 'lay'), L2('ma', '맨틀', 170, 0, -230, 'lay'), L2('mg', '마그마', XR, 0, -70, 'hot'), L2('rd', '갈라지는 곳', XR, BD * 0.75, 18, 'top'), L2('sea', '바다', 820, 200, 14, 'top'));
    if (mode === 'tra') out.push(L2('cc', '대륙 지각', 300, 0, -20, 'lay'), L2('ma', '맨틀', 300, 0, -210, 'lay'), L2('rd', '도로', XROAD + traOff(10, T) - 40, 10, 60, 'top'), L2('fl', '판의 경계', 80, DF, 46, 'top'));
    return out;
  }

  /* ---------- 화면에 붙이기 ---------- */
  function mount(fig, cv, o) {
    o = o || {};
    var st = { mode: o.mode || 'sub', T: o.T || 0, playing: o.play !== false, speed: 1, last: null, hi: false };
    var ov = A.overlay(fig);
    var api = { st: st };
    A.loop(cv, function (ctx, W, H, t, dt) {
      if (st.playing && !R) st.T += dt * st.speed;
      if (st.mode === 'tra' && st.T > 41) st.T = 0.2;
      var r = draw(ctx, W, H, st.T, st.mode, { hi: st.hi }); st.last = r; if (o.onFrame) o.onFrame(r, st); return r;
    }, { always: true, after: function (r, f) { ov.set(r.labels, f); } });
    api.mode = function (m) { st.mode = m; st.T = o.T0 ? o.T0(m) : 0; };
    api.play = function (v) { st.playing = v; };
    api.reset = function () { st.T = 0; };
    return api;
  }
  return { draw: draw, mount: mount, MODES: MODES, colK: colK, eruptOn: eruptOn };
})();
