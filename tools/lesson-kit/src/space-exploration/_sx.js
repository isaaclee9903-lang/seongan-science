/* ===== 우주 탐사 그림 도구 (별 배경, 태양, 행성, 탐사선, 이름표, 화살표) =====
   - 행성·탐사선 그림은 사진이 아니라 개념 이해를 위한 모형이에요. 크기와 거리는 실제 비율과 달라요.
   - 모든 그림은 캔버스(2D)로 그리고, 화면에 보일 때만 움직여요(SX.add). */
window.SX = (function () {
  'use strict';
  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s = (s + 0x6D2B79F5) | 0; var t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var sstep = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
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
  /* 화면에 보이는 그림만 다시 그리는 공용 반복 */
  var anims = [], running = false;
  function add(el, draw, onErr) {
    anims.push({ el: el, draw: draw, onErr: onErr });
    if (!running) { running = true; requestAnimationFrame(loop); }
    try { draw(performance.now(), true); } catch (e) { if (onErr) onErr(e); }
  }
  function loop(t) {
    anims.forEach(function (a) {
      if (!a.draw || !visible(a.el)) return;
      try { a.draw(t); } catch (e) { a.draw = null; if (a.onErr) a.onErr(e); }
    });
    requestAnimationFrame(loop);
  }
  window.addEventListener('resize', function () { anims.forEach(function (a) { try { if (a.draw) a.draw(performance.now(), true); } catch (e) {} }); });

  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a == null ? 1 : a) + ')'; }
  var sprites = {};
  function sprite(col) {
    var key = col.join(',');
    if (sprites[key]) return sprites[key];
    var s = off(64, 64), g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, rgba(col, 0.9)); gr.addColorStop(0.3, rgba(col, 0.35)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); sprites[key] = s; return s;
  }
  function glow(ctx, x, y, r, col, a) { ctx.globalAlpha = clamp(a == null ? 1 : a, 0, 1); ctx.drawImage(sprite(col), x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1; }

  /* 별 배경: 미리 그려 두고 붙여요 */
  var bgCache = {};
  function space(ctx, w, h, seed, opt) {
    opt = opt || {};
    var key = [Math.round(w), Math.round(h), seed, opt.top, opt.bot].join('|');
    var b = bgCache[key];
    if (!b) {
      b = off(w, h); var g = b.getContext('2d');
      var gr = g.createLinearGradient(0, 0, w * 0.3, h); gr.addColorStop(0, opt.top || '#04060f'); gr.addColorStop(1, opt.bot || '#0b1226');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      /* 옅은 성운 */
      var R = rng(seed || 5);
      for (var k = 0; k < 3; k++) {
        var nx = R() * w, ny = R() * h, nr = Math.max(w, h) * (0.25 + R() * 0.3), ng = g.createRadialGradient(nx, ny, 0, nx, ny, nr);
        var cc = [[90, 70, 170], [40, 90, 170], [150, 60, 110]][k];
        ng.addColorStop(0, rgba(cc, 0.12)); ng.addColorStop(1, rgba(cc, 0)); g.fillStyle = ng; g.fillRect(0, 0, w, h);
      }
      g.globalCompositeOperation = 'lighter';
      var N = opt.n == null ? Math.round(w * h / 1800) : opt.n;
      for (var i = 0; i < N; i++) { var m = Math.pow(R(), 4); glow(g, R() * w, R() * h, 0.8 + m * 5, R() < 0.25 ? [170, 195, 255] : R() < 0.15 ? [255, 210, 170] : [235, 238, 255], 0.35 + m * 0.6); }
      bgCache[key] = b;
      var keys = Object.keys(bgCache); if (keys.length > 12) delete bgCache[keys[0]];
    }
    ctx.drawImage(b, 0, 0, w, h);
  }

  /* 태양: 이글거리는 가장자리 */
  function sun(ctx, x, y, r, t) {
    t = REDUCE ? 0 : t || 0;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var co = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 3.2);
    co.addColorStop(0, 'rgba(255,170,60,.55)'); co.addColorStop(0.35, 'rgba(255,120,30,.16)'); co.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = co; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    var g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r);
    g.addColorStop(0, '#fffbe6'); g.addColorStop(0.45, '#ffd25a'); g.addColorStop(0.85, '#ff9a2a'); g.addColorStop(1, '#f06a12');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    /* 쌀알 무늬 */
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    var R = rng(77); ctx.globalAlpha = 0.18;
    for (var i = 0; i < 70; i++) {
      var a = R() * Math.PI * 2, d = Math.sqrt(R()) * r, s = r * (0.05 + R() * 0.09), ph = Math.sin(t / 900 + i) * 0.5 + 0.5;
      ctx.fillStyle = ph > 0.5 ? '#fff3c4' : '#d9560d'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    /* 가장자리 불꽃 */
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,150,50,.5)'; ctx.lineWidth = Math.max(1, r * 0.03);
    for (var k = 0; k < 7; k++) {
      var aa = k / 7 * Math.PI * 2 + t / 6000, rr = r * (1.04 + 0.08 * Math.sin(t / 700 + k * 2));
      ctx.beginPath(); ctx.arc(x + Math.cos(aa) * r * 0.98, y + Math.sin(aa) * r * 0.98, r * 0.14 * (rr / r), aa + Math.PI * 0.9, aa + Math.PI * 2.1); ctx.stroke();
    }
    ctx.restore();
  }

  /* 행성 (kind: mercury, venus, earth, moon, mars, jupiter, saturn, uranus, neptune, comet, asteroid)
     lx, ly: 빛이 오는 방향(단위 벡터) */
  var PAL = {
    mercury: ['#c9bfb4', '#7d7369', '#4a433d'], venus: ['#f6e3b5', '#d9b46d', '#8a6a35'], earth: ['#8fd0ff', '#2a7fd0', '#0d2f66'],
    moon: ['#eeeeea', '#a9a8a3', '#55544f'], mars: ['#ffb08a', '#d0582c', '#6e2210'], jupiter: ['#f8e6cf', '#d8a77a', '#7a4f33'],
    saturn: ['#fbecc4', '#d9bb7c', '#7f6533'], uranus: ['#dafcff', '#8fd8e2', '#3d8693'], neptune: ['#a9c6ff', '#3d66d8', '#162d78'],
    asteroid: ['#c9b9a4', '#8a7963', '#3f352a'], comet: ['#e7e3dc', '#9d968b', '#4a463f']
  };
  function planet(ctx, x, y, r, kind, opt) {
    opt = opt || {};
    var lx = opt.lx == null ? -0.7 : opt.lx, ly = opt.ly == null ? -0.35 : opt.ly, p = PAL[kind] || PAL.moon, t = opt.t || 0;
    if (kind === 'saturn' && opt.ring !== false) ringS(ctx, x, y, r, true);
    ctx.save(); ctx.beginPath();
    if (kind === 'asteroid' || kind === 'comet') {
      var R = rng(opt.seed || 9); for (var i = 0; i <= 14; i++) { var a = i / 14 * Math.PI * 2, rr = r * (0.75 + R() * 0.35) * (i % 2 ? 1 : 0.95); if (i === 0) ctx.moveTo(x + Math.cos(a) * rr * 1.25, y + Math.sin(a) * rr * 0.85); else ctx.lineTo(x + Math.cos(a) * rr * 1.25, y + Math.sin(a) * rr * 0.85); }
      ctx.closePath();
    } else ctx.arc(x, y, r, 0, Math.PI * 2);
    var g = ctx.createRadialGradient(x + lx * r * 0.45, y + ly * r * 0.45, r * 0.05, x, y, r * 1.15);
    g.addColorStop(0, p[0]); g.addColorStop(0.55, p[1]); g.addColorStop(1, p[2]);
    ctx.fillStyle = g; ctx.fill(); ctx.clip();
    if (kind === 'jupiter' || kind === 'saturn') {
      var bands = kind === 'jupiter' ? [[-0.62, 0.1, '#a8693f'], [-0.3, 0.12, '#c7875a'], [0.05, 0.08, '#efd2b0'], [0.28, 0.13, '#b77548'], [0.6, 0.09, '#9e6a45']] : [[-0.4, 0.12, '#cfae6a'], [0.1, 0.1, '#e8d5a4'], [0.45, 0.12, '#bb9a5b']];
      ctx.globalAlpha = 0.55;
      bands.forEach(function (b) { ctx.fillStyle = b[2]; ctx.beginPath(); ctx.ellipse(x, y + b[0] * r, r * 1.2, b[1] * r, Math.sin(t / 3000 + b[0]) * 0.02, 0, Math.PI * 2); ctx.fill(); });
      if (kind === 'jupiter') { ctx.globalAlpha = 0.8; ctx.fillStyle = '#c4563a'; ctx.beginPath(); ctx.ellipse(x + r * 0.32, y + r * 0.34, r * 0.16, r * 0.09, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    } else if (kind === 'earth') {
      var E = rng(41); ctx.fillStyle = 'rgba(70,160,80,.85)';
      for (var j = 0; j < 7; j++) { var ex = x + (E() * 1.6 - 0.8) * r + ((t / 120) % (r * 2)) * 0, ey = y + (E() * 1.4 - 0.7) * r; ctx.beginPath(); ctx.ellipse(ex, ey, r * (0.18 + E() * 0.25), r * (0.12 + E() * 0.2), E() * 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = Math.max(1, Math.min(r * 0.08, 5)); ctx.lineCap = 'round';
      for (var q = 0; q < 5; q++) { var cy = y + (E() * 1.6 - 0.8) * r, cx = x + (E() * 1.6 - 0.8) * r; ctx.beginPath(); ctx.arc(cx, cy, r * (0.3 + E() * 0.4), E() * 3, E() * 3 + 1.2); ctx.stroke(); }
    } else if (kind === 'mars' || kind === 'moon' || kind === 'mercury' || kind === 'asteroid' || kind === 'comet') {
      var M = rng(kind.length * 13); ctx.fillStyle = kind === 'mars' ? 'rgba(120,40,20,.35)' : 'rgba(60,60,60,.25)';
      for (var u = 0; u < 9; u++) { ctx.beginPath(); ctx.arc(x + (M() * 1.6 - 0.8) * r, y + (M() * 1.6 - 0.8) * r, r * (0.07 + M() * 0.16), 0, Math.PI * 2); ctx.fill(); }
      if (kind === 'mars') { ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(x, y - r * 0.92, r * 0.35, r * 0.13, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    /* 밤 쪽 그림자 */
    var sh = ctx.createLinearGradient(x + lx * r, y + ly * r, x - lx * r, y - ly * r);
    sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(0.55, 'rgba(0,0,0,.05)'); sh.addColorStop(1, 'rgba(0,0,10,.72)');
    ctx.fillStyle = sh; ctx.fillRect(x - r * 1.5, y - r * 1.5, r * 3, r * 3);
    ctx.restore();
    if (kind === 'earth' || kind === 'neptune' || kind === 'uranus' || kind === 'venus') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var at = ctx.createRadialGradient(x, y, r * 0.92, x, y, r * 1.18);
      at.addColorStop(0, kind === 'venus' ? 'rgba(255,220,150,.25)' : 'rgba(120,190,255,.35)'); at.addColorStop(1, 'rgba(120,190,255,0)');
      ctx.fillStyle = at; ctx.beginPath(); ctx.arc(x, y, r * 1.18, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    if (kind === 'saturn' && opt.ring !== false) ringS(ctx, x, y, r, false);
    if (kind === 'uranus' && opt.ring !== false) { ctx.save(); ctx.strokeStyle = 'rgba(200,240,250,.35)'; ctx.lineWidth = Math.max(1, r * 0.06); ctx.beginPath(); ctx.ellipse(x, y, r * 0.5, r * 1.6, 0.2, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  }
  function ringS(ctx, x, y, r, back) {
    ctx.save(); ctx.beginPath();
    if (back) ctx.rect(x - r * 3, y - r * 3, r * 6, r * 3); else ctx.rect(x - r * 3, y, r * 6, r * 3);
    ctx.clip();
    [[2.25, 0.16, 'rgba(240,220,170,.75)'], [1.85, 0.2, 'rgba(210,180,120,.6)'], [1.5, 0.1, 'rgba(240,225,190,.45)']].forEach(function (b) {
      ctx.strokeStyle = b[2]; ctx.lineWidth = r * b[1]; ctx.beginPath(); ctx.ellipse(x, y, r * b[0], r * b[0] * 0.3, -0.12, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.restore();
  }
  /* 혜성 꼬리 (태양 반대쪽) */
  function tail(ctx, x, y, r, ang, len) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, g = ctx.createLinearGradient(x, y, ex, ey);
    g.addColorStop(0, 'rgba(190,225,255,.55)'); g.addColorStop(1, 'rgba(190,225,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); var nx = -Math.sin(ang), ny = Math.cos(ang);
    ctx.moveTo(x + nx * r, y + ny * r); ctx.quadraticCurveTo(ex + nx * len * 0.15, ey + ny * len * 0.15, ex + nx * len * 0.22, ey + ny * len * 0.22);
    ctx.lineTo(ex - nx * len * 0.12, ey - ny * len * 0.12); ctx.quadraticCurveTo(ex - nx * len * 0.05, ey - ny * len * 0.05, x - nx * r, y - ny * r); ctx.closePath(); ctx.fill();
    glow(ctx, x, y, r * 3.5, [200, 230, 255], 0.7); ctx.restore();
  }

  /* 탐사선 그림 (kind: dish 보이저형 / wing 태양 전지판형 / shield 파커형 / lander 착륙선) s: 크기 기준, ang: 기울기 */
  function probe(ctx, x, y, s, ang, kind) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang || 0); ctx.lineJoin = 'round';
    var gold = ctx.createLinearGradient(-s, -s, s, s); gold.addColorStop(0, '#ffe7a3'); gold.addColorStop(0.5, '#d7a43c'); gold.addColorStop(1, '#8a6018');
    var pan = ctx.createLinearGradient(0, -s, 0, s); pan.addColorStop(0, '#3d6fd6'); pan.addColorStop(1, '#16306e');
    function panel(px, py, pw, ph) {
      ctx.fillStyle = pan; ctx.fillRect(px, py, pw, ph); ctx.strokeStyle = 'rgba(180,210,255,.55)'; ctx.lineWidth = Math.max(0.6, s * 0.04);
      for (var i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(px + pw * i / 4, py); ctx.lineTo(px + pw * i / 4, py + ph); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(px, py + ph / 2); ctx.lineTo(px + pw, py + ph / 2); ctx.stroke();
    }
    if (kind === 'shield') {
      ctx.fillStyle = '#e9e3d6'; ctx.beginPath(); ctx.ellipse(-s * 0.55, 0, s * 0.18, s * 0.95, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7b7468'; ctx.beginPath(); ctx.ellipse(-s * 0.45, 0, s * 0.1, s * 0.85, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = gold; ctx.fillRect(-s * 0.35, -s * 0.32, s * 0.75, s * 0.64);
      panel(-s * 0.2, s * 0.32, s * 0.4, s * 0.45); panel(-s * 0.2, -s * 0.77, s * 0.4, s * 0.45);
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = Math.max(1, s * 0.05); ctx.beginPath(); ctx.moveTo(s * 0.4, 0); ctx.lineTo(s * 0.9, 0); ctx.stroke();
    } else if (kind === 'dish') {
      ctx.strokeStyle = '#cfd6e0'; ctx.lineWidth = Math.max(1, s * 0.05);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 1.4, s * 0.35); ctx.moveTo(0, 0); ctx.lineTo(-s * 1.1, -s * 0.5); ctx.stroke();
      ctx.fillStyle = gold; ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.15); ctx.lineTo(0, -s * 0.12); ctx.lineTo(s * 0.32, s * 0.15); ctx.lineTo(0, s * 0.42); ctx.closePath(); ctx.fill();
      var dg = ctx.createLinearGradient(-s, -s, s, 0); dg.addColorStop(0, '#ffffff'); dg.addColorStop(1, '#9aa6b5');
      ctx.fillStyle = dg; ctx.beginPath(); ctx.ellipse(0, -s * 0.3, s * 0.85, s * 0.28, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#7d8896'; ctx.lineWidth = Math.max(0.6, s * 0.03); ctx.stroke();
      ctx.fillStyle = '#e8edf3'; ctx.beginPath(); ctx.arc(0, -s * 0.62, s * 0.08, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(-s * 1.1, -s * 0.5, s * 0.1, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'lander') {
      ctx.strokeStyle = '#c9ced6'; ctx.lineWidth = Math.max(1, s * 0.07);
      ctx.beginPath(); ctx.moveTo(-s * 0.4, s * 0.2); ctx.lineTo(-s * 0.75, s * 0.7); ctx.moveTo(s * 0.4, s * 0.2); ctx.lineTo(s * 0.75, s * 0.7); ctx.moveTo(0, s * 0.3); ctx.lineTo(0, s * 0.72); ctx.stroke();
      ctx.fillStyle = gold; ctx.fillRect(-s * 0.5, -s * 0.35, s, s * 0.65);
      panel(-s * 0.45, -s * 0.7, s * 0.9, s * 0.3);
    } else {
      panel(-s * 1.35, -s * 0.22, s * 0.9, s * 0.44); panel(s * 0.45, -s * 0.22, s * 0.9, s * 0.44);
      ctx.strokeStyle = '#aeb6c2'; ctx.lineWidth = Math.max(0.8, s * 0.05); ctx.beginPath(); ctx.moveTo(-s * 0.45, 0); ctx.lineTo(s * 0.45, 0); ctx.stroke();
      ctx.fillStyle = gold; ctx.fillRect(-s * 0.38, -s * 0.38, s * 0.76, s * 0.76);
      ctx.fillStyle = '#e8edf3'; ctx.beginPath(); ctx.ellipse(0, -s * 0.5, s * 0.3, s * 0.1, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function tag(ctx, text, x, y, opt) {
    opt = opt || {};
    ctx.save(); ctx.font = (opt.weight || 800) + ' ' + (opt.size || 14) + 'px Pretendard, sans-serif'; ctx.textBaseline = 'middle';
    var tw = ctx.measureText(text).width, pw = opt.pad == null ? 8 : opt.pad, ph = (opt.size || 14) * 0.95;
    var al = opt.align || 'center', x0 = al === 'center' ? x - tw / 2 - pw : al === 'left' ? x : x - tw - pw * 2;
    if (opt.bg !== 'none') { ctx.fillStyle = opt.bg || 'rgba(8,14,32,.8)'; ctx.beginPath(); ctx.roundRect(x0, y - ph, tw + pw * 2, ph * 2, ph); ctx.fill(); }
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
  /* 점선 길 + 길을 따라 흐르는 빛 */
  function path(ctx, pts, col, lw, dash, prog) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw || 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (dash) ctx.setLineDash(dash);
    var n = prog == null ? pts.length : Math.max(1, Math.floor(pts.length * clamp(prog, 0, 1)));
    ctx.beginPath(); for (var i = 0; i < n; i++) { if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]); else ctx.lineTo(pts[i][0], pts[i][1]); } ctx.stroke(); ctx.restore();
  }
  return { rng: rng, clamp: clamp, sstep: sstep, lerp: lerp, REDUCE: REDUCE, fit: fit, visible: visible, add: add, glow: glow, space: space, sun: sun, planet: planet, tail: tail, probe: probe, tag: tag, arrow: arrow, path: path };
})();
