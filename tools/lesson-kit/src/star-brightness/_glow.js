/* ===== 별 그리기 도구 (빛 번짐 별, 우주 배경) =====
   별은 모두 흰색으로 그려요(별의 색은 다음 차시 내용). 등급 숫자가 작을수록 크고 밝게 그려요.
   크기는 '눈에 보이는 느낌'을 위한 모형이라 실제 밝기 비율과 같지 않아요. */
window.GLOW = (function () {
  var cache = {};
  function sprite(tint) {
    var key = tint || 'w';
    if (cache[key]) return cache[key];
    var cv = document.createElement('canvas'); cv.width = cv.height = 128;
    var c = cv.getContext('2d'), g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    var t = tint || '226,236,255';
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.08, 'rgba(255,255,255,.97)');
    g.addColorStop(0.16, 'rgba(' + t + ',.78)');
    g.addColorStop(0.32, 'rgba(' + t + ',.24)');
    g.addColorStop(0.62, 'rgba(' + t + ',.06)');
    g.addColorStop(1, 'rgba(' + t + ',0)');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    cache[key] = cv; return cv;
  }
  /* 빛 번짐 별 하나. r: 번짐 반지름(px), a: 진하기 */
  function star(c, x, y, r, a, spikes) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a == null ? 1 : Math.max(0, Math.min(1, a));
    c.drawImage(sprite(), x - r, y - r, r * 2, r * 2);
    if (spikes !== false && r > 11) {
      var L = r * 2.3;
      [[1, 0], [0, 1]].forEach(function (d) {
        var g = c.createLinearGradient(x - d[0] * L, y - d[1] * L, x + d[0] * L, y + d[1] * L);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(235,242,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.strokeStyle = g; c.lineWidth = Math.max(1, r * 0.06);
        c.beginPath(); c.moveTo(x - d[0] * L, y - d[1] * L); c.lineTo(x + d[0] * L, y + d[1] * L); c.stroke();
      });
    }
    c.restore();
  }
  /* 등급 → 번짐 반지름. 6 등급 = base, 한 등급 밝아질 때마다 조금씩 커져요 */
  function magR(m, base) {
    var s = Math.pow(10, -0.4 * (m - 6));
    return (base || 1.3) * Math.pow(s, 0.3);
  }
  /* 등급에 맞춰 별 하나 그리기 (어두운 별은 작은 점) */
  function magStar(c, x, y, m, k, alpha) {
    var r = magR(m, k);
    var a = alpha == null ? 1 : alpha;
    if (r < 1.6) {
      c.globalAlpha = Math.max(0.12, Math.min(1, 0.3 + r * 0.42)) * a;
      c.fillStyle = '#eef3ff'; var d = Math.max(1, r * 1.15); c.fillRect(x - d / 2, y - d / 2, d, d);
      c.globalAlpha = 1;
    } else star(c, x, y, r * 3.1, Math.min(1, 0.55 + r * 0.09) * a);
    return r;
  }
  function rng(seed) { var s = seed >>> 0; return function () { s += 0x6D2B79F5; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function space(c, w, h, seed) {
    var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#050a17'); g.addColorStop(0.6, '#0a1327'); g.addColorStop(1, '#0f1931');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    var R = rng(seed || 3);
    for (var i = 0; i < 4; i++) {
      var x = R() * w, y = R() * h * 0.8, r = (0.25 + R() * 0.35) * Math.max(w, h);
      var col = i % 2 ? '86,72,150' : '40,86,160';
      var n = c.createRadialGradient(x, y, 0, x, y, r);
      n.addColorStop(0, 'rgba(' + col + ',.15)'); n.addColorStop(1, 'rgba(' + col + ',0)');
      c.fillStyle = n; c.fillRect(0, 0, w, h);
    }
  }
  function fit(cv) {
    var r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(10, r.width), h = Math.max(10, r.height), W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { c: c, w: w, h: h };
  }
  /* 실제 별 자료(d3-celestial에서 줄인 stars6.json)를 한 번만 불러와요 */
  var starsP = null;
  function stars6() {
    if (!starsP) starsP = fetch('sky/data/stars6.json').then(function (r) { if (!r.ok) throw new Error('별 자료 ' + r.status); return r.json(); });
    return starsP;
  }
  return { sprite: sprite, star: star, magR: magR, magStar: magStar, rng: rng, space: space, fit: fit, stars6: stars6 };
})();
