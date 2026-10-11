/* ===== 별의 색 도구 (색 띠, 표면 온도 → 색, 색깔별 빛의 양, 색 있는 빛 번짐 별, 우주 배경) =====
   - 색 띠 7 가지와 별 목록은 교과서 색 띠 그림을 따라요.
   - 표면 온도는 공개 자료의 값을 1000 ℃ 단위로 어림한 값이에요(태양은 교과서 값 약 6000 ℃).
   - 하늘 지도의 별 색은 별 목록(d3-celestial)의 색 정보로 칠해요. 그 값은 화면에 숫자로 쓰지 않아요. */
window.SC = (function () {
  /* 교과서 색 띠 (위: 표면 온도가 높다 → 아래: 낮다) */
  var CLASSES = [
    { k: '청색', c: [104, 146, 255] },
    { k: '청백색', c: [160, 194, 255] },
    { k: '백색', c: [238, 242, 255] },
    { k: '황백색', c: [255, 240, 196] },
    { k: '황색', c: [255, 214, 104] },
    { k: '주황색', c: [255, 160, 74] },
    { k: '적색', c: [255, 96, 64] },
  ];
  /* 교과서에 나온 별 (h: 별 목록의 히파르코스 번호, t: 표면 온도 어림값 ℃, cl: 색 띠 번호) */
  var STARS = [
    { id: 'naos', n: '나오스', h: 39429, t: 40000, cl: 0, con: '고물자리' },
    { id: 'dschubba', n: '드슈바', h: 78401, t: 27000, cl: 0, con: '전갈자리', note: '교과서: 청색' },
    { id: 'spica', n: '스피카', h: 65474, t: 25000, cl: 1, con: '처녀자리' },
    { id: 'rigel', n: '리겔', h: 24436, t: 12000, cl: 1, con: '오리온자리' },
    { id: 'vega', n: '베가', h: 91262, t: 9000, cl: 2, con: '거문고자리' },
    { id: 'altair', n: '알타이르', h: 97649, t: 7000, cl: 2, con: '독수리자리' },
    { id: 'procyon', n: '프로키온', h: 37279, t: 6000, cl: 3, con: '작은개자리' },
    { id: 'polaris', n: '북극성', h: 11767, t: 6000, cl: 3, con: '작은곰자리' },
    { id: 'sun', n: '태양', h: 0, t: 6000, cl: 4, con: '' },
    { id: 'capella', n: '카펠라', h: 24608, t: 5000, cl: 4, con: '마차부자리' },
    { id: 'arcturus', n: '아크투루스', h: 69673, t: 4000, cl: 5, con: '목동자리' },
    { id: 'aldebaran', n: '알데바란', h: 21421, t: 4000, cl: 5, con: '황소자리' },
    { id: 'betelgeuse', n: '베텔게우스', h: 27989, t: 3000, cl: 6, con: '오리온자리' },
    { id: 'antares', n: '안타레스', h: 80763, t: 3000, cl: 6, con: '전갈자리' },
  ];
  var byId = {}; STARS.forEach(function (s) { byId[s.id] = s; });
  /* 온도(℃) → 색. 색 띠의 색을 온도 눈금(로그)에 놓고 사이를 부드럽게 이어요 */
  var ANCH = [[2500, [255, 70, 50]], [3000, CLASSES[6].c], [4000, CLASSES[5].c], [5400, CLASSES[4].c], [6600, CLASSES[3].c], [8600, CLASSES[2].c], [14000, CLASSES[1].c], [30000, CLASSES[0].c], [45000, [90, 132, 255]]];
  function palette(tC) {
    var t = Math.max(ANCH[0][0], Math.min(ANCH[ANCH.length - 1][0], tC));
    for (var i = 0; i < ANCH.length - 1; i++) {
      var a = ANCH[i], b = ANCH[i + 1];
      if (t <= b[0]) {
        var f = (Math.log(t) - Math.log(a[0])) / (Math.log(b[0]) - Math.log(a[0]));
        f = f * f * (3 - 2 * f);
        return [0, 1, 2].map(function (k) { return Math.round(a[1][k] + (b[1][k] - a[1][k]) * f); });
      }
    }
    return ANCH[ANCH.length - 1][1].slice();
  }
  /* 별 목록의 색 정보 → 어림 온도(℃). 화면에는 숫자로 쓰지 않고 색칠에만 써요 */
  function bvToC(bv) { var b = Math.max(-0.35, Math.min(2.0, bv)); return 4600 * (1 / (0.92 * b + 1.7) + 1 / (0.92 * b + 0.62)) - 273; }
  /* 색깔별 빛의 양 (빨강·주황·노랑·초록·파랑). 가장 많은 색 = 1. 단위 없는 모형 */
  var BANDS = [['빨강', 650, '#ff5a4a'], ['주황', 605, '#ff9a3c'], ['노랑', 575, '#ffd84a'], ['초록', 525, '#4fd27a'], ['파랑', 465, '#4f8cff']];
  function bars(tC) {
    var T = tC + 273, v = BANDS.map(function (b) { var l = b[1] * 1e-9; return 1 / (Math.pow(l, 5) * (Math.exp(0.014388 / (l * T)) - 1)); });
    var mx = Math.max.apply(null, v); return v.map(function (x) { return Math.pow(x / mx, 2); }); /* 차이가 잘 보이도록 제곱(모형) */
  }
  /* 전기난로 열선 색 (0: 꺼짐 → 1: 가장 뜨거움). 온도 숫자는 쓰지 않아요 */
  var HEAT = [[0, [70, 66, 64]], [0.18, [92, 22, 12]], [0.4, [190, 34, 20]], [0.62, [255, 78, 28]], [0.82, [255, 150, 48]], [1, [255, 214, 96]]];
  function heater(t) {
    t = Math.max(0, Math.min(1, t));
    for (var i = 0; i < HEAT.length - 1; i++) { var a = HEAT[i], b = HEAT[i + 1]; if (t <= b[0]) { var f = (t - a[0]) / (b[0] - a[0]); return [0, 1, 2].map(function (k) { return Math.round(a[1][k] + (b[1][k] - a[1][k]) * f); }); } }
    return HEAT[HEAT.length - 1][1].slice();
  }
  /* 열선 0~1 → 색깔별 빛의 양에 쓸 모형 온도(℃). 숫자는 화면에 쓰지 않아요 */
  function heaterC(t) { return 450 + t * 1150; }
  function fmtC(n) {
    if (n >= 10000) { var m = Math.floor(n / 10000), r = Math.round(n % 10000); return '약 ' + m + '만' + (r ? ' ' + r : '') + ' ℃'; }
    return '약 ' + Math.round(n) + ' ℃';
  }
  var rgb = function (c, a) { return a == null ? 'rgb(' + c.join(',') + ')' : 'rgba(' + c.join(',') + ',' + a + ')'; };
  var mix = function (c, w, f) { return c.map(function (v, k) { return Math.round(v + ((w ? w[k] : 255) - v) * f); }); };
  /* 색 있는 빛 번짐 별 */
  var cache = {};
  function sprite(c) {
    var key = c.join(','); if (cache[key]) return cache[key];
    var cv = document.createElement('canvas'); cv.width = cv.height = 128;
    var x = cv.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.07, rgb(mix(c, null, 0.55), 1));
    g.addColorStop(0.16, rgb(mix(c, null, 0.18), 0.95));
    g.addColorStop(0.3, rgb(c, 0.45));
    g.addColorStop(0.58, rgb(c, 0.09));
    g.addColorStop(1, rgb(c, 0));
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    if (Object.keys(cache).length > 400) cache = {};
    cache[key] = cv; return cv;
  }
  function star(ctx, x, y, r, a, col, spikes) {
    col = col || [226, 236, 255];
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a == null ? 1 : Math.max(0, Math.min(1, a));
    ctx.drawImage(sprite(col), x - r, y - r, r * 2, r * 2);
    if (spikes !== false && r > 12) {
      var L = r * 2.2, sc = mix(col, null, 0.5);
      [[1, 0], [0, 1]].forEach(function (d) {
        var g = ctx.createLinearGradient(x - d[0] * L, y - d[1] * L, x + d[0] * L, y + d[1] * L);
        g.addColorStop(0, rgb(sc, 0)); g.addColorStop(0.5, rgb(sc, 0.65)); g.addColorStop(1, rgb(sc, 0));
        ctx.strokeStyle = g; ctx.lineWidth = Math.max(1, r * 0.055);
        ctx.beginPath(); ctx.moveTo(x - d[0] * L, y - d[1] * L); ctx.lineTo(x + d[0] * L, y + d[1] * L); ctx.stroke();
      });
    }
    ctx.restore();
  }
  /* 등급 → 번짐 반지름 (밝기 차이는 느낌만, 실제 비율과 다름) */
  function magR(m, base) { return (base || 1.3) * Math.pow(Math.pow(10, -0.4 * (m - 6)), 0.3); }
  function magStar(ctx, x, y, m, k, col, alpha) {
    var r = magR(m, k), a = alpha == null ? 1 : alpha;
    if (r < 1.6) {
      ctx.globalAlpha = Math.max(0.15, Math.min(1, 0.32 + r * 0.42)) * a;
      ctx.fillStyle = rgb(mix(col, null, 0.35)); var d = Math.max(1, r * 1.2); ctx.fillRect(x - d / 2, y - d / 2, d, d); ctx.globalAlpha = 1;
    } else star(ctx, x, y, r * 3.2, Math.min(1, 0.58 + r * 0.09) * a, col);
    return r;
  }
  function rng(seed) { var s = seed >>> 0; return function () { s += 0x6D2B79F5; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function space(ctx, w, h, seed) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#050a17'); g.addColorStop(0.6, '#0a1327'); g.addColorStop(1, '#0f1931');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    var R = rng(seed || 3);
    for (var i = 0; i < 4; i++) {
      var x = R() * w, y = R() * h * 0.8, r = (0.25 + R() * 0.35) * Math.max(w, h), col = i % 2 ? '86,72,150' : '40,86,160';
      var n = ctx.createRadialGradient(x, y, 0, x, y, r); n.addColorStop(0, 'rgba(' + col + ',.15)'); n.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = n; ctx.fillRect(0, 0, w, h);
    }
  }
  function fit(cv) {
    var r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(10, r.width), h = Math.max(10, r.height), W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { c: c, w: w, h: h };
  }
  /* 별 목록 (d3-celestial에서 줄인 stars6c.json: 경도, 위도, 등급, 색 정보) */
  var SKY = '../star-brightness/sky/';
  var starsP = null;
  function stars() {
    if (!starsP) starsP = fetch(SKY + 'data/stars6c.json').then(function (r) { if (!r.ok) throw new Error('별 자료 ' + r.status); return r.json(); }).then(function (j) {
      var out = [], hipIdx = {};
      Object.keys(j.h).forEach(function (h) { hipIdx[j.h[h]] = +h; });
      var byHip = {}; STARS.forEach(function (s) { if (s.h) byHip[s.h] = s; });
      for (var i = 0; i < j.s.length; i += 4) {
        var k = i / 4, tb = byHip[hipIdx[k]];
        var col = tb ? CLASSES[tb.cl].c : palette(bvToC(j.s[i + 3]));
        out.push({ lon: j.s[i], lat: j.s[i + 1], m: j.s[i + 2], col: col, name: tb ? tb.n : (j.n[k] || null), tb: tb || null, k: k });
      }
      return out;
    });
    return starsP;
  }
  return { CLASSES: CLASSES, STARS: STARS, byId: byId, palette: palette, bvToC: bvToC, BANDS: BANDS, bars: bars, heater: heater, heaterC: heaterC, fmtC: fmtC, rgb: rgb, mix: mix,
    sprite: sprite, star: star, magR: magR, magStar: magStar, rng: rng, space: space, fit: fit, stars: stars, SKY: SKY };
})();
