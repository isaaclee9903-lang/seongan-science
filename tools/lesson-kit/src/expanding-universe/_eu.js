/* ===== 우주 팽창 그림 도구 (은하, 우주 공, 대폭발, 시간의 흐름, 풍선) =====
   - 은하·우주 그림은 사진이 아니라 개념 이해를 위한 모형이에요. 은하의 수·모양·크기는 실제와 달라요.
   - 우주가 커져도 은하 그림의 크기는 그대로 두고, 은하 사이의 거리만 늘려요(교과서: 은하가 직접 움직이는 것이 아니라 우주 공간이 팽창).
   - 커지는 빠르기는 모형이에요. 숫자는 '대폭발 약 138억 년 전'과 '현재'만 써요. */
window.EU = (function () {
  'use strict';
  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s = (s + 0x6D2B79F5) | 0; var t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function gauss(r) { var u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var sstep = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  function rgb(c, a) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a == null ? 1 : a) + ')'; }
  function mix(a, b, t) { b = b || [255, 255, 255]; return [0, 1, 2].map(function (k) { return a[k] + (b[k] - a[k]) * t; }); }
  var REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function fit(cv, maxDpr) {
    var r = cv.getBoundingClientRect(), dpr = Math.min(maxDpr || 2, window.devicePixelRatio || 1);
    var w = Math.max(10, r.width), h = Math.max(10, r.height), W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { c: c, w: w, h: h, dpr: dpr };
  }
  function off(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  /* 화면에 보일 때만 움직이기 (탭 껍데기에서 가려진 탭, 화면 밖 그림은 쉬어요) */
  function visible(el) {
    if (document.hidden) return false;
    try { var f = window.frameElement; if (f && f.hasAttribute('data-page') && !f.classList.contains('on')) return false; } catch (e) {}
    if (!el) return true;
    var r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > -40 && r.top < (window.innerHeight || 800) + 40;
  }
  /* 빛 번짐 점 */
  var sprites = {};
  function sprite(col) {
    var key = col.map(Math.round).join(',');
    if (sprites[key]) return sprites[key];
    var s = off(64, 64), g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.1, rgb(mix(col, null, 0.6), 0.95)); gr.addColorStop(0.28, rgb(col, 0.45));
    gr.addColorStop(0.6, rgb(col, 0.1)); gr.addColorStop(1, rgb(col, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); sprites[key] = s; return s;
  }
  function star(ctx, x, y, r, col, a) {
    ctx.globalAlpha = a == null ? 1 : clamp(a, 0, 1);
    ctx.drawImage(sprite(col), x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
  }
  /* 우주 배경 */
  function space(ctx, w, h, seed, n, top, bot) {
    var g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top || '#04070f'); g.addColorStop(1, bot || '#0a1022');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    var R = rng(seed || 3); ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var N = n == null ? Math.round(w * h / 3000) : n;
    for (var i = 0; i < N; i++) { var m = Math.pow(R(), 3); star(ctx, R() * w, R() * h, 1 + m * 4, R() < 0.3 ? [170, 195, 255] : [235, 238, 255], 0.25 + m * 0.5); }
    ctx.restore();
  }
  /* 잡음 무늬(우주 공 안의 옅은 빛) */
  function noiseTex(seed, size) {
    var r = rng(seed), P = new Uint8Array(512), G = new Float32Array(256), i, p = [];
    for (i = 0; i < 256; i++) { p.push(i); G[i] = r(); }
    for (i = 255; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = p[i]; p[i] = p[j]; p[j] = t; }
    for (i = 0; i < 512; i++) P[i] = p[i & 255];
    function vn(x, y) { var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); xi &= 255; yi &= 255; var a = G[P[P[xi] + yi]], b = G[P[P[xi + 1] + yi]], c = G[P[P[xi] + yi + 1]], d = G[P[P[xi + 1] + yi + 1]]; return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
    function fbm(x, y) { var s = 0, a = 0.5, f = 1, n = 0; for (var k = 0; k < 5; k++) { s += a * vn(x * f + k * 17.3, y * f - k * 9.1); n += a; f *= 2.03; a *= 0.5; } return s / n; }
    var cv = off(size, size), g = cv.getContext('2d'), id = g.createImageData(size, size), d = id.data;
    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
      var f1 = fbm(x / size * 3.2, y / size * 3.2), f2 = fbm(x / size * 2.4 + 40, y / size * 2.4 + 9);
      var a1 = clamp((f1 - 0.45) * 2.4, 0, 1), a2 = clamp((f2 - 0.5) * 2.4, 0, 1), k4 = (y * size + x) * 4;
      d[k4] = 90 * a1 + 150 * a2; d[k4 + 1] = 70 * a1 + 90 * a2; d[k4 + 2] = 190 * a1 + 200 * a2; d[k4 + 3] = 255 * Math.max(a1, a2);
    }
    g.putImageData(id, 0, 0); return cv;
  }
  var NZ = null; function haze() { return NZ || (NZ = noiseTex(77, 192)); }

  /* ===== 은하 그림 (모형) ===== */
  var GT = {};
  function galTex(kind, seed) {
    var key = kind + seed; if (GT[key]) return GT[key];
    var S = 128, cv = off(S, S), g = cv.getContext('2d'), r = rng(seed * 31 + 7), c = S / 2;
    g.globalCompositeOperation = 'lighter';
    var glow = function (x, y, rad, col, a) { var gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgb(col, a)); gr.addColorStop(1, rgb(col, 0)); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
    if (kind === 'spiral') {
      var cool = r() < 0.6, armCol = cool ? [150, 185, 255] : [235, 220, 255];
      glow(c, c, S * 0.46, [130, 150, 230], 0.3); glow(c, c, S * 0.3, armCol, 0.28);
      var arms = 2, k = 0.3 + r() * 0.1, th0 = r() * Math.PI * 2;
      for (var a = 0; a < arms; a++) for (var i = 0; i < 700; i++) {
        var ph = Math.pow(r(), 0.75) * 3.4, rad = 7 * Math.exp(k * ph * 1.3), th = th0 + a * Math.PI + ph + gauss(r) * 0.22;
        if (rad > S * 0.46) continue;
        var x = c + rad * Math.cos(th) + gauss(r) * 2.4, y = c + rad * Math.sin(th) + gauss(r) * 2.4, kn = r() < 0.04;
        star(g, x, y, kn ? 3 : 1.2 + r() * 1.6, kn ? [255, 130, 175] : armCol, kn ? 0.6 : 0.16 + r() * 0.26);
      }
      glow(c, c, S * 0.2, [255, 225, 170], 0.9); glow(c, c, S * 0.08, [255, 248, 230], 1);
    } else if (kind === 'ell') {
      var warm = [255, 205 + r() * 25, 150 + r() * 30];
      glow(c, c, S * 0.47, warm, 0.5); glow(c, c, S * 0.25, warm, 0.7); glow(c, c, S * 0.1, [255, 245, 225], 1);
      for (var j = 0; j < 90; j++) { var rr = Math.abs(gauss(r)) * S * 0.16, aa = r() * Math.PI * 2; star(g, c + rr * Math.cos(aa), c + rr * Math.sin(aa), 1.4 + r() * 1.6, warm, 0.3); }
    } else { /* 옆에서 본 나선 은하 */
      g.save(); g.translate(c, c); g.scale(1, 0.2);
      var gr = g.createRadialGradient(0, 0, 0, 0, 0, S * 0.47); gr.addColorStop(0, 'rgba(255,235,200,.95)'); gr.addColorStop(0.35, 'rgba(190,200,255,.55)'); gr.addColorStop(1, 'rgba(150,170,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, S * 0.47, 0, Math.PI * 2); g.fill(); g.restore();
      glow(c, c, S * 0.13, [255, 225, 175], 0.9);
      g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(20,14,26,.55)'; g.beginPath(); g.ellipse(c, c + 1.2, S * 0.4, 1.6, 0, 0, Math.PI * 2); g.fill();
    }
    GT[key] = cv; return cv;
  }
  /* 우주 속 은하 목록: 단위 공 안의 위치(공간과 함께 움직이는 위치) */
  var UNI = {};
  function universe(seed, n) {
    var key = seed + ':' + n; if (UNI[key]) return UNI[key];
    var r = rng(seed), G = [], S = [];
    for (var i = 0; i < n; i++) {
      var u = Math.cbrt(0.04 + r() * 0.96) * 0.86, ct = 2 * r() - 1, st = Math.sqrt(1 - ct * ct), ph = r() * Math.PI * 2;
      var q = r(), kind = q < 0.58 ? 'spiral' : q < 0.86 ? 'ell' : 'edge';
      G.push({ x: u * st * Math.cos(ph), y: u * ct, z: u * st * Math.sin(ph), kind: kind, v: Math.floor(r() * 4), rot: r() * Math.PI, sq: kind === 'spiral' ? 0.35 + r() * 0.65 : kind === 'ell' ? 0.6 + r() * 0.4 : 1, s: 0.7 + r() * 0.7 });
    }
    for (var k = 0; k < 360; k++) { var uu = Math.cbrt(r()) * 0.95, c2 = 2 * r() - 1, s2 = Math.sqrt(1 - c2 * c2), p2 = r() * Math.PI * 2; S.push({ x: uu * s2 * Math.cos(p2), y: uu * c2, z: uu * s2 * Math.sin(p2), c: r() < 0.5 ? [170, 190, 255] : [255, 225, 200], m: r() }); }
    return (UNI[key] = { G: G, S: S });
  }
  function drawGal(ctx, g, x, y, size, a) {
    var t = galTex(g.kind, g.v); ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); ctx.translate(x, y); ctx.rotate(g.rot); ctx.scale(1, g.sq);
    ctx.drawImage(t, -size, -size, size * 2, size * 2); ctx.restore();
  }
  /* 3D 회전 투영 */
  function rot(p, yaw, pitch) {
    var cy = Math.cos(yaw), sy = Math.sin(yaw), x = p.x * cy + p.z * sy, z = -p.x * sy + p.z * cy;
    var cp = Math.cos(pitch), sp = Math.sin(pitch), y = p.y * cp - z * sp, z2 = p.y * sp + z * cp;
    return [x, y, z2];
  }
  /* 대폭발: 온도와 밀도가 매우 높은 한 점에서 퍼지는 빛 (그림 표현) */
  function bang(ctx, x, y, r, a, t) {
    if (a <= 0.003 || r < 0.5) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(a, 0, 1);
    var gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,250,1)'); gr.addColorStop(0.12, 'rgba(255,246,190,.98)'); gr.addColorStop(0.3, 'rgba(255,196,90,.8)');
    gr.addColorStop(0.55, 'rgba(255,120,40,.35)'); gr.addColorStop(1, 'rgba(220,60,20,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    var n = 14, tt = (t || 0) * 0.00012;
    for (var i = 0; i < n; i++) {
      var an = i / n * Math.PI * 2 + tt * (i % 2 ? 1 : -1), L = r * (0.75 + 0.35 * Math.sin(i * 2.7 + tt * 9));
      var g2 = ctx.createLinearGradient(x, y, x + Math.cos(an) * L, y + Math.sin(an) * L); g2.addColorStop(0, 'rgba(255,240,180,.5)'); g2.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.strokeStyle = g2; ctx.lineWidth = Math.max(1, r * 0.035); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(an) * L, y + Math.sin(an) * L); ctx.stroke();
    }
    ctx.restore();
  }
  /* 우주 공: 반지름 R, 은하 크기 gs(px, 우주가 커져도 그대로), heat(대폭발 빛의 남은 정도) */
  function ball(ctx, cx, cy, R, o) {
    o = o || {}; if (R < 0.5) return [];
    var U = universe(o.seed || 9, o.n || 70), yaw = o.yaw || 0, pitch = o.pitch == null ? 0.32 : o.pitch, heat = o.heat || 0, gs = o.gs || 10, ga = o.ga == null ? 1 : o.ga, out = [];
    ctx.save();
    /* 바깥 푸른 테두리 빛 */
    var halo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.18); halo.addColorStop(0, 'rgba(110,140,255,.28)'); halo.addColorStop(1, 'rgba(110,140,255,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    var body = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.05, cx, cy, R);
    body.addColorStop(0, '#2c3c6c'); body.addColorStop(0.55, '#141d3d'); body.addColorStop(1, '#070b1d');
    ctx.fillStyle = body; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.32; ctx.drawImage(haze(), cx - R, cy - R, R * 2, R * 2); ctx.globalAlpha = 1;
    /* 희미한 별빛 알갱이 */
    U.S.forEach(function (p) { var q = rot(p, yaw, pitch); star(ctx, cx + q[0] * R, cy + q[1] * R, 0.8 + p.m * 1.6 + R * 0.004, p.c, (0.25 + p.m * 0.45) * (0.75 - q[2] * 0.25)); });
    /* 은하: 뒤에서부터 */
    var L = U.G.map(function (g, i) { var q = rot(g, yaw, pitch); return { g: g, i: i, x: cx + q[0] * R, y: cy + q[1] * R, z: q[2] }; }).sort(function (a, b) { return b.z - a.z; });
    var crowd = clamp(R / (gs * 11), 0.3, 1);
    L.forEach(function (p) { var s = gs * p.g.s * (1 - p.z * 0.18); drawGal(ctx, p.g, p.x, p.y, s, ga * (0.62 - p.z * 0.33) * crowd + (1 - crowd) * 0.25); out.push(p); });
    /* 대폭발의 빛이 남아 있을 때 */
    if (heat > 0.002) {
      var hg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); hg.addColorStop(0, rgb([255, 245, 200], heat)); hg.addColorStop(0.5, rgb([255, 180, 80], heat * 0.85)); hg.addColorStop(1, rgb([255, 110, 40], heat * 0.6));
      ctx.fillStyle = hg; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
    /* 둥근 공의 입체감: 아래쪽 그늘, 위쪽 반짝임 */
    var sh = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.2, cx, cy, R * 1.02); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(0.75, 'rgba(0,0,10,.1)'); sh.addColorStop(1, 'rgba(0,0,10,.5)');
    ctx.fillStyle = sh; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    var hl = ctx.createRadialGradient(cx - R * 0.42, cy - R * 0.5, 0, cx - R * 0.42, cy - R * 0.5, R * 0.55); hl.addColorStop(0, 'rgba(200,215,255,.13)'); hl.addColorStop(1, 'rgba(200,215,255,0)');
    ctx.fillStyle = hl; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(150,175,255,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    if (heat > 0.002) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; var bl = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * (1.3 + heat)); bl.addColorStop(0, rgb([255, 170, 70], 0.5 * heat)); bl.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = bl; ctx.beginPath(); ctx.arc(cx, cy, R * (1.3 + heat), 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    return out;
  }
  /* 둥근 이름표 */
  function tag(ctx, text, x, y, opt) {
    opt = opt || {};
    ctx.save(); ctx.font = (opt.weight || 800) + ' ' + (opt.size || 14) + 'px Pretendard, sans-serif'; ctx.textBaseline = 'middle';
    var tw = ctx.measureText(text).width, pw = 8, ph = (opt.size || 14) * 0.95;
    var al = opt.align || 'center', x0 = al === 'center' ? x - tw / 2 - pw : al === 'left' ? x : x - tw - pw * 2;
    if (opt.bg !== 'none') { ctx.fillStyle = opt.bg || 'rgba(8,14,32,.78)'; ctx.beginPath(); ctx.roundRect(x0, y - ph, tw + pw * 2, ph * 2, ph); ctx.fill(); }
    if (opt.border) { ctx.strokeStyle = opt.border; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.fillStyle = opt.color || '#eef2fc'; ctx.textAlign = 'left'; ctx.fillText(text, x0 + pw, y + 0.5); ctx.restore();
    return tw + pw * 2;
  }
  function arrow(ctx, x1, y1, x2, y2, col, lw, head) {
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw || 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var a = Math.atan2(y2 - y1, x2 - x1), H = head || 9;
    ctx.beginPath(); ctx.moveTo(x2 + Math.cos(a) * 2, y2 + Math.sin(a) * 2); ctx.lineTo(x2 - H * Math.cos(a - 0.45), y2 - H * Math.sin(a - 0.45)); ctx.lineTo(x2 - H * Math.cos(a + 0.45), y2 - H * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  /* ===== 그림 Ⅷ-9처럼: 대폭발 → 점점 커지는 우주 → 현재 =====
     prog: 0~1 (시간이 어디까지 흘렀는지), t: 시각(ms, 천천히 돌기) */
  var TS = [0, 0.33, 0.63, 1];
  function tlLayout(w, h) {
    var R3 = Math.min(h * 0.4, w * 0.26), x3 = w - R3 - w * 0.025;
    var R2 = R3 * 0.52, x2 = x3 - R3 - R2 * 0.45;
    var R1 = R3 * 0.27, x1 = x2 - R2 - R1 * 0.35;
    var x0 = Math.max(w * 0.07, x1 - R1 - h * 0.09);
    return { st: [[x0, h * 0.6, 0.6], [x1, h * 0.6, R1], [x2, h * 0.56, R2], [x3, h * 0.47, R3]], w: w, h: h, gs: Math.max(4.5, Math.min(h * 0.024, R3 * 0.062)) };
  }
  function tlAt(Lay, s) {
    var i = 0; while (i < 2 && s > TS[i + 1]) i++;
    var k = clamp((s - TS[i]) / (TS[i + 1] - TS[i]), 0, 1), a = Lay.st[i], b = Lay.st[i + 1];
    var R = i === 0 ? lerp(0.6, b[2], Math.pow(k, 1.1)) : lerp(a[2], b[2], k);
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), R];
  }
  function timeline(ctx, w, h, prog, t, opt) {
    opt = opt || {}; var Lay = tlLayout(w, h), sz = Math.max(12, Math.min(18, w / 52)), yaw = REDUCE ? 0.5 : (t || 0) * 0.00008;
    space(ctx, w, h, 61, Math.round(w * h / 2600), '#03050c', '#0b0f24');
    /* 대폭발 */
    var b0 = Lay.st[0], flash = prog < 0.06 ? 1.6 - prog * 10 : 1;
    bang(ctx, b0[0], b0[1], h * 0.11 * flash, 1, t);
    /* 지나온 우주(정해진 시점) */
    var labelPts = null;
    for (var i = 1; i < 4; i++) {
      if (prog + 1e-6 < TS[i]) break;
      var st = Lay.st[i], pts = ball(ctx, st[0], st[1], st[2], { yaw: yaw + i, gs: Lay.gs, seed: 9, n: 70, heat: i === 1 ? 0.12 : 0 });
      if (i === 3) labelPts = pts;
    }
    /* 시간의 흐름 화살표 (분홍) */
    var ay = h * 0.9, ax0 = Lay.st[0][0] + h * 0.02, ax1 = Lay.st[3][0] - Lay.st[3][2] * 0.15, ay1 = Lay.st[3][1] + Lay.st[3][2] * 0.78;
    ctx.save();
    var ag = ctx.createLinearGradient(ax0, 0, ax1, 0); ag.addColorStop(0, 'rgba(255,220,235,0)'); ag.addColorStop(0.3, 'rgba(255,200,222,.55)'); ag.addColorStop(1, 'rgba(255,150,190,.95)');
    ctx.globalAlpha = 0.92; ctx.fillStyle = ag; ctx.beginPath(); ctx.moveTo(ax0, ay - h * 0.012);
    ctx.quadraticCurveTo((ax0 + ax1) / 2, ay + h * 0.03, ax1 - h * 0.06, ay1 + h * 0.012);
    ctx.lineTo(ax1 - h * 0.075, ay1 + h * 0.05); ctx.lineTo(ax1 + h * 0.025, ay1 - h * 0.035); ctx.lineTo(ax1 - h * 0.09, ay1 - h * 0.055); ctx.lineTo(ax1 - h * 0.075, ay1 - h * 0.022);
    ctx.quadraticCurveTo((ax0 + ax1) / 2, ay - h * 0.012, ax0, ay - h * 0.04); ctx.closePath(); ctx.fill(); ctx.restore();
    var mx = (ax0 + ax1) * 0.62, my = ay - h * 0.025;
    tag(ctx, '시간의 흐름', Math.min(mx, w - 80), my - sz * 1.4, { size: sz - 1, color: '#ffd6e6', bg: 'rgba(40,10,30,.55)' });
    /* 지금 커지는 중인 우주 */
    var cur = null;
    if (prog > 0 && prog < 1 && TS.indexOf(prog) < 0) {
      cur = tlAt(Lay, prog); var heat = clamp(1 - prog / 0.22, 0, 1);
      ball(ctx, cur[0], cur[1], cur[2], { yaw: yaw + prog * 3, gs: Lay.gs, seed: 9, n: 70, heat: heat * heat });
      ctx.save(); ctx.strokeStyle = 'rgba(255,214,107,.85)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(cur[0], cur[1], cur[2] + 5, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    /* 글자 */
    tag(ctx, '대폭발', b0[0], b0[1] - h * 0.2, { size: sz + 1, color: '#ffb14a', bg: 'none', weight: 900 });
    tag(ctx, '약 138억 년 전', b0[0], b0[1] - h * 0.2 + sz * 1.35, { size: sz - 1, color: '#ffc77a', bg: 'none' });
    if (prog >= 1) {
      var s3 = Lay.st[3];
      tag(ctx, '현재', s3[0], s3[1] - s3[2] * 0.05, { size: sz + 8, color: '#fff', bg: 'none', weight: 900 });
      if (labelPts && opt.galLabel !== false) {
        var best = labelPts.filter(function (p) { return p.z < 0 && p.x > s3[0] + s3[2] * 0.25 && p.y < s3[1] - s3[2] * 0.15; }).sort(function (a, b) { return a.y - b.y; })[0];
        if (best) { arrow(ctx, best.x, best.y - sz * 2.2, best.x, best.y - Lay.gs * 1.1, '#ffffff', 1.6, 7); tag(ctx, '은하', best.x, best.y - sz * 2.9, { size: sz - 2, bg: 'none' }); }
      }
    }
    if (cur && opt.nowLabel) tag(ctx, opt.nowLabel, cur[0], cur[1] + cur[2] + sz * 1.1, { size: sz - 2, color: '#ffe08a', bg: 'rgba(8,14,32,.8)' });
    return Lay;
  }

  /* ===== 풍선(옆에서 본 그림): 붙임딱지는 크기 그대로, 풍선 표면만 늘어나요 ===== */
  var STK = [[-0.62, -0.28, '1', '#ffd23f'], [0.22, -0.62, '2', '#5ad1a0'], [0.5, 0.18, '3', '#ff8a5c']];
  function balloon(ctx, cx, cy, R, o) {
    o = o || {};
    ctx.save();
    /* 그림자 */
    var sh = ctx.createRadialGradient(cx, cy + R * 1.42, 2, cx, cy + R * 1.42, R * 0.9); sh.addColorStop(0, 'rgba(10,20,40,.22)'); sh.addColorStop(1, 'rgba(10,20,40,0)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(cx, cy + R * 1.42, R * 0.9, R * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    /* 꼭지와 매듭 */
    var by = cy + R * 1.04;
    ctx.fillStyle = '#5a3cb0'; ctx.beginPath(); ctx.moveTo(cx - R * 0.08, by - R * 0.06); ctx.lineTo(cx + R * 0.08, by - R * 0.06); ctx.lineTo(cx + R * 0.05, by + R * 0.07); ctx.lineTo(cx - R * 0.05, by + R * 0.07); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, by + R * 0.09, R * 0.075, R * 0.04, 0, 0, Math.PI * 2); ctx.fill();
    /* 몸통: 아래가 살짝 좁은 달걀 모양 */
    ctx.beginPath(); ctx.moveTo(cx, cy - R);
    ctx.bezierCurveTo(cx + R * 0.58, cy - R, cx + R, cy - R * 0.62, cx + R, cy - R * 0.05);
    ctx.bezierCurveTo(cx + R, cy + R * 0.5, cx + R * 0.42, cy + R * 0.98, cx, cy + R * 1.0);
    ctx.bezierCurveTo(cx - R * 0.42, cy + R * 0.98, cx - R, cy + R * 0.5, cx - R, cy - R * 0.05);
    ctx.bezierCurveTo(cx - R, cy - R * 0.62, cx - R * 0.58, cy - R, cx, cy - R); ctx.closePath();
    var g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R * 1.15);
    g.addColorStop(0, '#d9c8ff'); g.addColorStop(0.25, '#9b7bf0'); g.addColorStop(0.7, '#6a46cf'); g.addColorStop(1, '#3e2491');
    ctx.fillStyle = g; ctx.fill(); ctx.save(); ctx.clip();
    /* 늘어나는 고무 무늬(얇은 결) */
    var hl = ctx.createRadialGradient(cx - R * 0.42, cy - R * 0.5, 0, cx - R * 0.42, cy - R * 0.5, R * 0.42); hl.addColorStop(0, 'rgba(255,255,255,.55)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.restore();
    /* 붙임딱지와 거리 */
    var P = STK.map(function (s) { return [cx + s[0] * R, cy + s[1] * R]; }), ss = o.sticker || 11;
    if (o.lines) {
      var gx = (P[0][0] + P[1][0] + P[2][0]) / 3, gy = (P[0][1] + P[1][1] + P[2][1]) / 3, F = o.fs || 13;
      [[0, 1], [0, 2], [1, 2]].forEach(function (pr, i) {
        var a = P[pr[0]], b = P[pr[1]], mxp = (a[0] + b[0]) / 2, myp = (a[1] + b[1]) / 2, nx = cx + (mxp - cx) * 1.1, ny = cy + (myp - cy) * 1.1;
        ctx.save(); ctx.strokeStyle = 'rgba(255,240,170,.95)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(nx, ny, b[0], b[1]); ctx.stroke(); ctx.restore();
        /* 글자는 세 붙임딱지의 가운데에서 바깥쪽으로 밀어 겹치지 않게 */
        var dx = mxp - gx, dy = myp - gy, L = Math.hypot(dx, dy) || 1, push = F * (i === 1 ? 0.6 : 1.9);
        if (o.lines[i]) tag(ctx, o.lines[i], mxp + dx / L * push, myp + dy / L * push, { size: F, color: '#2a2000', bg: 'rgba(255,224,120,.95)' });
      });
    }
    P.forEach(function (p, i) {
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 4; ctx.fillStyle = STK[i][3]; ctx.beginPath(); ctx.arc(p[0], p[1], ss, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.fillStyle = '#1b1530'; ctx.font = '900 ' + Math.round(ss * 1.25) + 'px Pretendard, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(STK[i][2], p[0], p[1] + 1); ctx.restore();
    });
    ctx.restore();
    return P;
  }

  return { rng: rng, gauss: gauss, clamp: clamp, sstep: sstep, lerp: lerp, rgb: rgb, mix: mix, fit: fit, off: off, visible: visible, REDUCE: REDUCE,
    sprite: sprite, star: star, space: space, galTex: galTex, drawGal: drawGal, universe: universe, rot: rot, bang: bang, ball: ball,
    tag: tag, arrow: arrow, timeline: timeline, tlLayout: tlLayout, tlAt: tlAt, TS: TS, balloon: balloon, STK: STK };
})();
