/* ===== 지진·화산 빅데이터 지도 (WMAP) =====
   실제 자료를 캔버스 지도에 그려요. 자료는 페이지 옆 data/ 폴더의 스크립트가 넣어 줘요.
   - window.LAND: 육지(Natural Earth), window.PB: 판의 경계(PB2002), window.EQ: 지진(USGS, 규모 5.5 이상, 1980~), window.VO/ER: 화산·분출(스미스소니언 GVP)
   - 날짜는 '1980-01-01부터 지난 날 수'로 다뤄요.
   - 지도는 경위도를 그대로 펼친 지도(정거 원통). 가운데 경도를 바꿀 수 있어요(태평양 가운데 = 150).
   - 그리는 순서: 바탕(바다·육지·경계, 시점이 바뀔 때만) → 쌓인 점(시간이 바뀔 때만) → 움직이는 것(최근 지진 물결, 분출 중인 화산, 표시 핀)
   이름표는 캔버스에 쓰지 않고 HTML(Pretendard)로 얹어요. */
window.WMAP = (function () {
  'use strict';
  var REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var D0 = Date.UTC(1980, 0, 1), DAY = 86400000;
  function dayOf(y, m, d) { return Math.round((Date.UTC(y, (m || 1) - 1, d || 1) - D0) / DAY); }
  function dateOf(n) { var t = new Date(D0 + n * DAY); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; }
  function fmt(n) { var t = dateOf(n); return t.y + '년 ' + t.m + '월 ' + t.d + '일'; }
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  function wrap(d) { d = ((d + 180) % 360 + 360) % 360 - 180; return d; }

  /* ---------- 자료 정리 (한 번만) ---------- */
  var DATA = null;
  function data() {
    if (DATA) return DATA;
    var E = window.EQ || [], n = E.length / 5, lon = new Float32Array(n), lat = new Float32Array(n), dep = new Uint16Array(n), mag = new Float32Array(n), day = new Int32Array(n);
    for (var i = 0; i < n; i++) { lon[i] = E[i * 5] / 10; lat[i] = E[i * 5 + 1] / 10; dep[i] = E[i * 5 + 2]; mag[i] = E[i * 5 + 3] / 10; day[i] = E[i * 5 + 4]; }
    var VO = window.VO || [], ER = window.ER || [];
    var vol = VO.map(function (v) { return { lon: v[0] / 10, lat: v[1] / 10, last: v[2], name: v[3] }; });
    var er = ER.map(function (e) { return { v: e[0], s: e[1], e: e[2], vei: e[3] }; });
    // 화산마다 1980년 이후 분출 목록
    vol.forEach(function (v) { v.er = []; }); er.forEach(function (e) { if (vol[e.v]) vol[e.v].er.push(e); });
    var land = (window.LAND || []).map(function (r) { var f = new Float32Array(r.length); for (var j = 0; j < r.length; j++) f[j] = r[j] / 10; return f; });
    var pb = (window.PB || []).map(function (l) { var f = new Float32Array(l.p.length); for (var j = 0; j < l.p.length; j++) f[j] = l.p[j] / 10; return { s: l.s, p: f }; });
    DATA = { n: n, lon: lon, lat: lat, dep: dep, mag: mag, day: day, vol: vol, er: er, land: land, pb: pb, end: window.EQ_END || (n ? day[n - 1] : 0) };
    return DATA;
  }

  /* 판의 경계까지 거리 (도 단위 근사, 지도 분석에 써요) */
  var grid = null;
  function boundaryGrid() {
    if (grid) return grid; var G = data(), cell = 1, W = 360, H = 180, g = new Uint8Array(W * H);
    G.pb.forEach(function (l) {
      for (var i = 0; i + 3 < l.p.length; i += 2) {
        var x0 = l.p[i], y0 = l.p[i + 1], x1 = l.p[i + 2], y1 = l.p[i + 3], dx = wrap(x1 - x0), steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(y1 - y0)) / 0.25) + 1;
        for (var k = 0; k <= steps; k++) { var x = x0 + dx * k / steps, y = y0 + (y1 - y0) * k / steps, cx = Math.floor((wrap(x) + 180) / cell) % W, cy = clamp(Math.floor((90 - y) / cell), 0, H - 1); g[cy * W + cx] = 1; }
      }
    });
    grid = { g: g, W: W, H: H }; return grid;
  }
  // (lon, lat)에서 판의 경계까지 대략 몇 km인가 (최대 maxKm까지만 찾음)
  function nearBoundaryKm(lon, lat, maxKm) {
    var B = boundaryGrid(), cx = Math.floor((wrap(lon) + 180)) % 360, cy = clamp(Math.floor(90 - lat), 0, 179), R = Math.ceil(maxKm / 111) + 1, best = 1e9;
    for (var dy = -R; dy <= R; dy++) { var y = cy + dy; if (y < 0 || y > 179) continue; var la = 90 - y - 0.5, kx = Math.max(0.15, Math.cos(la * Math.PI / 180));
      for (var dx = -R; dx <= R; dx++) { var x = ((cx + dx) % 360 + 360) % 360; if (!B.g[y * 360 + x]) continue; var d = Math.hypot(dx * kx, dy) * 111; if (d < best) best = d; } }
    return Math.max(0, best - 55);
  }

  /* ---------- 지도 만들기 ---------- */
  function create(wrapEl, o) {
    o = o || {};
    var G = data();
    var cv = wrapEl.querySelector('canvas') || wrapEl.appendChild(document.createElement('canvas'));
    var ctx = cv.getContext('2d');
    var ovl = document.createElement('div'); ovl.className = 'mapovl'; wrapEl.appendChild(ovl);
    var base = document.createElement('canvas'), hist = document.createElement('canvas');
    var W = 1, H = 1, dpr = 1;
    var S = {
      clon: o.center != null ? o.center : 150, clat: o.clat != null ? o.clat : 8, z: 1, zMin: 1, zMax: o.zMax || 9,
      layers: Object.assign({ quake: true, volc: true, plate: true, land: true }, o.layers || {}),
      minMag: o.minMag || 5.5, d0: 0, t: G.end, live: [], pins: [], labels: o.labels || [], pulse: o.pulse !== false,
      dim: 0, focusBox: null, sel: null, volcAll: !!o.volcAll,
    };
    var dirtyBase = true, dirtyHist = true, histUpTo = -1;
    var PAL = Object.assign({ ocean0: '#dfe9f0', ocean1: '#c9dae6', land0: '#f6f2e9', land1: '#e7dfcf', coast: 'rgba(110,96,74,.55)', grid: 'rgba(60,90,120,.10)',
      plate: '#7a3b1e', plateHalo: 'rgba(255,255,255,.75)', quake: '29,78,170', volc: '#d0412a', volcEdge: '#fff' }, o.palette || {});

    function k() { return W / 360 * S.z; }
    function X(lon) { return W / 2 + wrap(lon - S.clon) * k(); }
    function Y(lat) { return H / 2 - (lat - S.clat) * k(); }
    function clampView() {
      S.z = clamp(S.z, S.zMin, S.zMax);
      var half = H / 2 / k(); S.clat = clamp(S.clat, -78 + half, 86 - half); if (-78 + half > 86 - half) S.clat = 4;
      S.clon = wrap(S.clon);
    }
    function size() {
      var r = cv.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      [cv, base, hist].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
      // 처음 크기: 세계 전체가 가로로 꽉 차게 (세로가 남으면 위도 범위를 넓혀 채움)
      S.zMin = Math.max(1, (H / k() * S.z) > 164 ? (H / (164 * W / 360)) : 1);
      clampView(); dirtyBase = dirtyHist = true;
    }
    try { new ResizeObserver(size).observe(cv); } catch (e) { addEventListener('resize', size); }

    /* --- 바탕: 바다, 위도선, 육지, 판의 경계 --- */
    function ringPath(g, f, off) {
      var kk = k(), cx = W / 2, cy = H / 2;
      g.moveTo(cx + (f[0] - S.clon + off) * kk, cy - (f[1] - S.clat) * kk);
      for (var j = 2; j < f.length; j += 2) g.lineTo(cx + (f[j] - S.clon + off) * kk, cy - (f[j + 1] - S.clat) * kk);
      g.closePath();
    }
    function offs() { var c = S.clon, a = []; [-720, -360, 0, 360].forEach(function (o2) { var l = -180 + o2 - c, r = 540 + o2 - c; if (r * k() > -W / 2 - 4 && l * k() < W / 2 + 4) a.push(o2); }); return a; }
    function drawBase() {
      var g = base.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      var sea = g.createLinearGradient(0, 0, 0, H); sea.addColorStop(0, PAL.ocean0); sea.addColorStop(0.5, PAL.ocean1); sea.addColorStop(1, PAL.ocean0);
      g.fillStyle = sea; g.fillRect(0, 0, W, H);
      // 위도·경도선 (30도 간격)
      g.strokeStyle = PAL.grid; g.lineWidth = 1; g.beginPath();
      for (var la = -60; la <= 60; la += 30) { var y = Y(la); g.moveTo(0, y); g.lineTo(W, y); }
      for (var lo = -180; lo < 180; lo += 30) { var x = X(lo); g.moveTo(x, 0); g.lineTo(x, H); }
      g.stroke();
      g.strokeStyle = 'rgba(60,90,120,.22)'; g.setLineDash([4, 5]); g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(W, Y(0)); g.stroke(); g.setLineDash([]);
      var OF = offs();
      if (S.layers.land) {
        // 육지 그림자 → 육지 → 안쪽 그늘(가장자리를 살짝 어둡게) → 해안선
        g.save(); g.shadowColor = 'rgba(40,60,80,.28)'; g.shadowBlur = 6; g.shadowOffsetY = 1.5;
        g.beginPath(); OF.forEach(function (of) { G.land.forEach(function (f) { ringPath(g, f, of); }); });
        var lg = g.createLinearGradient(0, Y(70), 0, Y(-50)); lg.addColorStop(0, '#f1ece2'); lg.addColorStop(0.45, PAL.land0); lg.addColorStop(1, PAL.land1);
        g.fillStyle = lg; g.fill('evenodd'); g.restore();
        g.save(); g.beginPath(); OF.forEach(function (of) { G.land.forEach(function (f) { ringPath(g, f, of); }); }); g.clip('evenodd');
        g.strokeStyle = 'rgba(150,130,100,.22)'; g.lineWidth = 5; g.stroke();
        g.restore();
        g.beginPath(); OF.forEach(function (of) { G.land.forEach(function (f) { ringPath(g, f, of); }); });
        g.strokeStyle = PAL.coast; g.lineWidth = 0.8; g.stroke();
      }
      dirtyBase = false;
    }
    function drawPlates(g) {
      var kk = k(), cx = W / 2, cy = H / 2, lw = clamp(1.3 + (S.z - 1) * 0.35, 1.3, 3.2);
      function pass(style, w) {
        g.strokeStyle = style; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath();
        G.pb.forEach(function (l) {
          var f = l.p, base0 = f[0];
          offs().forEach(function (of) {
            var px = 0;
            for (var j = 0; j < f.length; j += 2) {
              var lo = f[j], dx = j ? wrap(lo - f[j - 2]) : 0; px = j ? px + dx : base0;
              var x = cx + (px - S.clon + of) * kk, y = cy - (f[j + 1] - S.clat) * kk;
              if (!j) g.moveTo(x, y); else g.lineTo(x, y);
            }
          });
        });
        g.stroke();
      }
      g.save(); g.globalAlpha = S.dimPlates ? 0.35 : 1; pass(PAL.plateHalo, lw + 2.6); pass(PAL.plate, lw); g.restore();
    }

    /* --- 쌓인 점: 지진(기간 안), 화산(분출) --- */
    function qR(m) { var s = clamp(0.7 + (S.z - 1) * 0.28, 0.7, 2.2); return Math.max(0.9, (m - 4.9) * 1.35 * s); }
    function drawHist() {
      var g = hist.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      if (S.layers.quake) {
        // 작은 지진부터 그려야 큰 지진이 위에 보여요: 규모 구간별로 나눠 그림
        var bands = [[5.5, 6], [6, 6.5], [6.5, 7], [7, 7.5], [7.5, 10]];
        bands.forEach(function (bd) {
          if (bd[1] <= S.minMag) return;
          g.fillStyle = 'rgba(' + PAL.quake + ',' + (bd[0] >= 7 ? 0.62 : bd[0] >= 6.5 ? 0.5 : 0.36) + ')';
          g.beginPath();
          for (var i = 0; i < G.n; i++) {
            var m = G.mag[i]; if (m < bd[0] || m >= bd[1] || m < S.minMag) continue; var d = G.day[i]; if (d < S.d0 || d > S.t) continue;
            var x = X(G.lon[i]), y = Y(G.lat[i]); if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
            var r = qR(m); g.moveTo(x + r, y); g.arc(x, y, r, 0, 6.2832);
          }
          g.fill();
          if (bd[0] >= 7) { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 0.8; g.stroke(); }
        });
      }
      histUpTo = S.t; dirtyHist = false;
    }
    // 시간이 앞으로만 갔으면 새로 생긴 지진만 덧그려요 (자료는 날짜 순)
    function addHist(from, to) {
      var g = hist.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (S.layers.quake) {
        var lo = 0, hi = G.n; while (lo < hi) { var mid = (lo + hi) >> 1; if (G.day[mid] <= from) lo = mid + 1; else hi = mid; }
        for (var i = lo; i < G.n && G.day[i] <= to; i++) {
          var m = G.mag[i]; if (m < S.minMag || G.day[i] < S.d0) continue; var x = X(G.lon[i]), y = Y(G.lat[i]), r = qR(m);
          g.fillStyle = 'rgba(' + PAL.quake + ',' + (m >= 7 ? 0.62 : m >= 6.5 ? 0.5 : 0.36) + ')'; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
          if (m >= 7) { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 0.8; g.stroke(); }
        }
      }
      histUpTo = to;
    }
    function volcState(v) { // 기간 안에 분출했나, 지금(t) 분출 중인가
      var any = false, on = false;
      for (var i = 0; i < v.er.length; i++) { var e = v.er[i], end = e.e < 0 ? 1e9 : Math.max(e.e, e.s + 20); if (e.s <= S.t && end >= S.d0) { any = true; if (e.s <= S.t && end >= S.t - 30) on = true; } }
      return any ? (on ? 2 : 1) : 0;
    }
    function tri(g, x, y, s) { g.moveTo(x, y - s); g.lineTo(x + s * 0.92, y + s * 0.62); g.lineTo(x - s * 0.92, y + s * 0.62); g.closePath(); }
    function drawVolc(g, tt) {
      if (!S.layers.volc) return;
      var s = clamp(4.2 + (S.z - 1) * 0.9, 4.2, 9), live = [];
      g.beginPath();
      G.vol.forEach(function (v, i) {
        var st = S.volcAll ? (v.last >= 1980 || v.er.length ? 1 : 0) : volcState(v); if (!st) return;
        var x = X(v.lon), y = Y(v.lat); if (x < -10 || x > W + 10 || y < -10 || y > H + 10) return;
        tri(g, x, y, s); if (st === 2 && !S.volcAll) live.push([x, y]);
      });
      g.lineJoin = 'round'; g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.6; g.stroke(); g.fillStyle = PAL.volc; g.fill();
      // 지금 분출 중인 화산: 위로 피어오르는 연기
      if (!REDUCE) live.forEach(function (p, j) {
        for (var q = 0; q < 3; q++) { var ph = ((tt * 0.6 + j * 0.37 + q / 3) % 1), yy = p[1] - s - ph * s * 3.2, rr = s * (0.45 + ph * 0.9);
          g.fillStyle = 'rgba(90,80,75,' + (0.32 * (1 - ph)).toFixed(3) + ')'; g.beginPath(); g.arc(p[0] + Math.sin(ph * 5 + j) * s * 0.4, yy, rr, 0, 6.2832); g.fill(); }
      });
    }
    function drawPulses(g, tt) {
      if (!S.layers.quake || !S.pulse || !(S.playing || S.pulseAlways)) return;
      var win = S.pulseWin || 200;
      g.save();
      for (var i = G.n - 1; i >= 0; i--) {
        var d = G.day[i]; if (d > S.t) continue; if (d < S.t - win) { if (d < S.t - win - 40) break; continue; } if (G.mag[i] < S.minMag || d < S.d0) continue;
        var ph = (S.t - d) / win, x = X(G.lon[i]), y = Y(G.lat[i]), r = qR(G.mag[i]);
        g.strokeStyle = 'rgba(' + PAL.quake + ',' + (0.7 * (1 - ph)).toFixed(3) + ')'; g.lineWidth = 1.4;
        g.beginPath(); g.arc(x, y, r + 2 + ph * (6 + r * 2.2), 0, 6.2832); g.stroke();
        g.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - ph)).toFixed(3) + ')'; g.beginPath(); g.arc(x, y, r * 0.55, 0, 6.2832); g.fill();
      }
      g.restore();
    }
    function drawLive(g, tt) {
      if (!S.live.length) return;
      S.live.forEach(function (q, i) {
        var x = X(q.lon), y = Y(q.lat), r = Math.max(2.4, (q.mag - 3.6) * 1.8), ph = REDUCE ? 0.4 : ((tt * 0.55 + i * 0.13) % 1);
        g.strokeStyle = 'rgba(20,38,59,' + (0.75 * (1 - ph)).toFixed(3) + ')'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r + ph * 16, 0, 6.2832); g.stroke();
        g.fillStyle = '#14263b'; g.strokeStyle = '#fff'; g.lineWidth = 1.4; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); g.stroke();
      });
    }
    function drawPins(g, tt) {
      S.pins.forEach(function (p) {
        var x = X(p.lon), y = Y(p.lat), on = p.on, R = on ? 11 : 7;
        if (on && !REDUCE) { var ph = (tt * 0.8) % 1; g.strokeStyle = 'rgba(14,99,179,' + (0.65 * (1 - ph)).toFixed(3) + ')'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, R + ph * 18, 0, 6.2832); g.stroke(); }
        g.fillStyle = on ? '#0e63b3' : '#fff'; g.strokeStyle = on ? '#fff' : '#0e63b3'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, R, 0, 6.2832); g.fill(); g.stroke();
        if (p.n != null) { /* 번호는 HTML 이름표 */ }
      });
    }
    function drawBox(g) {
      if (!S.focusBox) return; var b = S.focusBox, x0 = X(b[0]), x1 = x0 + wrap(b[2] - b[0] + (b[2] < b[0] ? 360 : 0)) * k(), y0 = Y(b[3]), y1 = Y(b[1]);
      if (b[2] - b[0] >= 180) x1 = x0 + (b[2] - b[0]) * k();
      g.save(); g.fillStyle = 'rgba(20,38,59,.2)'; g.beginPath(); g.rect(0, 0, W, H); g.rect(x0, y0, x1 - x0, y1 - y0); g.fill('evenodd');
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.setLineDash([6, 4]); g.strokeRect(x0, y0, x1 - x0, y1 - y0); g.restore();
    }

    /* --- 지진대·화산대를 띠로 칠하기 (1도 칸마다 개수를 세어 부드럽게 번지게) --- */
    var bandImg = {};
    function bandBitmap(kind) {
      if (bandImg[kind]) return bandImg[kind];
      var Wg = 360, Hg = 180, a = new Float32Array(Wg * Hg);
      if (kind === 'quake') for (var i = 0; i < G.n; i++) { var x = Math.floor(G.lon[i] + 180) % 360, y = clamp(Math.floor(90 - G.lat[i]), 0, 179); a[y * Wg + x] += 1; }
      else G.vol.forEach(function (v) { if (!v.er.length && !(v.last >= 1900)) return; var x = Math.floor(v.lon + 180) % 360, y = clamp(Math.floor(90 - v.lat), 0, 179); a[y * Wg + x] += 6; });
      for (var pass = 0; pass < 2; pass++) { var b = new Float32Array(Wg * Hg); for (var y2 = 0; y2 < Hg; y2++) for (var x2 = 0; x2 < Wg; x2++) { var sum = 0; for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) { var yy = y2 + dy; if (yy < 0 || yy >= Hg) continue; sum += a[yy * Wg + ((x2 + dx + Wg) % Wg)]; } b[y2 * Wg + x2] = sum / 25; } a = b; }
      var c = document.createElement('canvas'); c.width = Wg; c.height = Hg; var g = c.getContext('2d'), id = g.createImageData(Wg, Hg), col = kind === 'quake' ? [29, 78, 170] : [208, 65, 42];
      for (var k2 = 0; k2 < Wg * Hg; k2++) { var v2 = a[k2], al = clamp((v2 - (kind === 'quake' ? 0.25 : 0.12)) * (kind === 'quake' ? 0.5 : 0.9), 0, 0.55); id.data[k2 * 4] = col[0]; id.data[k2 * 4 + 1] = col[1]; id.data[k2 * 4 + 2] = col[2]; id.data[k2 * 4 + 3] = al * 255; }
      g.putImageData(id, 0, 0); bandImg[kind] = c; return c;
    }
    function drawBands(g) {
      if (!S.bands) return;
      ['quake', 'volc'].forEach(function (kind) {
        if (!S.bands[kind]) return; var img = bandBitmap(kind); g.save(); g.imageSmoothingEnabled = true; g.globalAlpha = S.bands.a == null ? 1 : S.bands.a;
        offs().forEach(function (of) { var x0 = W / 2 + (-180 - S.clon + of) * k(), y0 = Y(90); g.drawImage(img, x0, y0, 360 * k(), 180 * k()); });
        g.restore();
      });
    }
    /* --- 판 하나 강조 --- */
    function drawPlateSel(g) {
      if (!S.plateSel || !window.PLATES) return; var pl = window.PLATES.filter(function (q) { return q.c === S.plateSel; })[0]; if (!pl) return;
      g.save(); g.beginPath();
      offs().forEach(function (of) { pl.r.forEach(function (r) { var f = r.map(function (v) { return v / 10; }); ringPath(g, f, of); }); });
      g.fillStyle = 'rgba(14,99,179,.24)'; g.fill('evenodd'); g.restore();
    }

    /* --- 이름표 (HTML) --- */
    var pool = {};
    function labels() {
      var seen = {};
      S.labels.concat(S.pins.filter(function (p) { return p.label; }).map(function (p, i) { return { k: 'pin' + i, t: p.label, lon: p.lon, lat: p.lat, cls: 'pin' + (p.on ? ' on' : ''), dy: -20 }; }))
        .forEach(function (L, i) {
          if (L.minZ && S.z < L.minZ) return;
          var key = L.k || ('L' + i), el = pool[key]; if (!el) { el = document.createElement('span'); pool[key] = el; ovl.appendChild(el); }
          seen[key] = 1; if (el._t !== L.t) { el.innerHTML = L.t; el._t = L.t; } var cls = 'ml ' + (L.cls || ''); if (el.className !== cls) el.className = cls;
          var x = X(L.lon), y = Y(L.lat) + (L.dy || 0); el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%)'; el.style.display = (x < -60 || x > W + 60 || y < -30 || y > H + 30) ? 'none' : '';
        });
      Object.keys(pool).forEach(function (kk) { if (!seen[kk]) pool[kk].style.display = 'none'; });
    }

    /* --- 매 화면 --- */
    var t0 = performance.now(), lastSig = '';
    function visible() {
      if (document.hidden) return false;
      try { var fr = window.frameElement; if (fr && fr.hasAttribute('data-page') && !fr.classList.contains('on')) return false; } catch (e) {}
      var r = cv.getBoundingClientRect(); return r.bottom > -50 && r.top < (innerHeight || 800) + 50 && r.width > 0;
    }
    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible()) return;
      var tt = (now - t0) / 1000;
      if (S.tick) S.tick(tt);
      if (dirtyBase) drawBase();
      if (dirtyHist || S.t < histUpTo) drawHist(); else if (S.t > histUpTo) addHist(histUpTo, S.t);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      ctx.drawImage(base, 0, 0, W, H);
      drawBands(ctx); drawPlateSel(ctx);
      if (S.layers.plate && !S.platesOnTop) drawPlates(ctx);
      ctx.drawImage(hist, 0, 0, W, H);
      drawPulses(ctx, tt);
      if (S.layers.plate && S.platesOnTop) drawPlates(ctx);
      drawVolc(ctx, tt);
      drawLive(ctx, tt);
      drawBox(ctx);
      drawPins(ctx, tt);
      if (S.sel) { var x = X(S.sel.lon), y = Y(S.sel.lat); ctx.strokeStyle = '#14263b'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 10, 0, 6.2832); ctx.stroke(); }
      if (o.after) o.after(ctx, W, H, tt);
      labels();
    }
    size(); requestAnimationFrame(frame);

    /* --- 끌기·확대 (손가락 둘로 벌리기, 바퀴) --- */
    if (o.interactive !== false) {
      var pts = {}, startD = 0, startZ = 1, moved = 0, down = null;
      cv.style.touchAction = 'none';
      cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); pts[e.pointerId] = [e.clientX, e.clientY]; moved = 0; down = [e.clientX, e.clientY]; var ks = Object.keys(pts); if (ks.length === 2) { var a = pts[ks[0]], b = pts[ks[1]]; startD = Math.hypot(a[0] - b[0], a[1] - b[1]); startZ = S.z; } });
      cv.addEventListener('pointermove', function (e) {
        if (!pts[e.pointerId]) return; var p = pts[e.pointerId], dx = e.clientX - p[0], dy = e.clientY - p[1]; pts[e.pointerId] = [e.clientX, e.clientY]; var ks = Object.keys(pts);
        if (ks.length === 1) { moved += Math.abs(dx) + Math.abs(dy); if (moved > 6) { S.clon -= dx / k(); S.clat += dy / k(); clampView(); dirtyBase = dirtyHist = true; } }
        else if (ks.length === 2) { var a = pts[ks[0]], b = pts[ks[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]); moved = 99; if (startD > 0) { S.z = startZ * d / startD; clampView(); dirtyBase = dirtyHist = true; } }
      });
      function up(e) {
        var was = pts[e.pointerId]; delete pts[e.pointerId];
        if (was && moved < 6 && down && Object.keys(pts).length === 0) { var r = cv.getBoundingClientRect(); tap(e.clientX - r.left, e.clientY - r.top); }
      }
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', function (e) { delete pts[e.pointerId]; });
      cv.addEventListener('wheel', function (e) { e.preventDefault(); var r = cv.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.25 : 0.8); }, { passive: false });
    }
    function zoomAt(px, py, f) {
      var lon = S.clon + (px - W / 2) / k(), lat = S.clat - (py - H / 2) / k();
      S.z *= f; clampView(); S.clon = lon - (px - W / 2) / k(); S.clat = lat + (py - H / 2) / k(); clampView(); dirtyBase = dirtyHist = true;
    }
    function tap(px, py) {
      var best = null, bd = 18;
      if (S.layers.volc) G.vol.forEach(function (v) { var st = S.volcAll ? (v.last >= 1980 || v.er.length) : volcState(v); if (!st) return; var d = Math.hypot(X(v.lon) - px, Y(v.lat) - py); if (d < bd) { bd = d; best = { kind: 'volc', v: v, lon: v.lon, lat: v.lat }; } });
      S.live.forEach(function (q) { var d = Math.hypot(X(q.lon) - px, Y(q.lat) - py); if (d < bd) { bd = d; best = { kind: 'live', q: q, lon: q.lon, lat: q.lat }; } });
      if (S.layers.quake) { var bq = bd * 0.8; for (var i = 0; i < G.n; i++) { if (G.mag[i] < S.minMag || G.day[i] < S.d0 || G.day[i] > S.t) continue; var d = Math.hypot(X(G.lon[i]) - px, Y(G.lat[i]) - py) - qR(G.mag[i]) * 0.5; if (d < bq || (best && best.kind === 'quake' && d < bq + 3 && G.mag[i] > best.mag)) { bq = Math.min(bq, d); best = { kind: 'quake', i: i, lon: G.lon[i], lat: G.lat[i], mag: G.mag[i], dep: G.dep[i], day: G.day[i] }; } } }
      S.sel = best; if (o.onTap) o.onTap(best, { lon: S.clon + (px - W / 2) / k(), lat: S.clat - (py - H / 2) / k() });
    }

    /* --- 부드럽게 옮기기 --- */
    var anim = null;
    function flyTo(lon, lat, z, dur) {
      var a = { lon: S.clon, lat: S.clat, z: S.z }, b = { lon: lon, lat: lat, z: z }, dl = wrap(b.lon - a.lon), t1 = performance.now(); dur = REDUCE ? 1 : (dur || 900);
      if (anim) cancelAnimationFrame(anim);
      (function step(now) { var p = clamp((now - t1) / dur, 0, 1), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, lz = Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * e;
        S.z = Math.exp(lz); S.clon = a.lon + dl * e; S.clat = a.lat + (b.lat - a.lat) * e; clampView(); dirtyBase = dirtyHist = true; if (p < 1) anim = requestAnimationFrame(step); })(t1);
    }

    var api = {
      S: S, data: G,
      set: function (p) { var hb = false; Object.keys(p).forEach(function (kk) { if (kk === 'layers') { Object.assign(S.layers, p.layers); hb = true; } else { if (kk === 'center') { S.clon = p.center; hb = true; } else S[kk] = p[kk]; } }); dirtyHist = true; if (hb) dirtyBase = true; return api; },
      time: function (t) { S.t = t; return api; },
      range: function (d0, t) { S.d0 = d0; S.t = t; dirtyHist = true; return api; },
      flyTo: flyTo, zoom: function (f) { zoomAt(W / 2, H / 2, f); },
      home: function (dur) { flyTo(o.center != null ? o.center : 150, o.clat != null ? o.clat : 8, S.zMin, dur); },
      redraw: function () { dirtyBase = dirtyHist = true; },
      plateAt: function (lon, lat) {
        var P2 = window.PLATES || [];
        for (var i = 0; i < P2.length; i++) { var pl = P2[i], inside = false;
          pl.r.forEach(function (r) { for (var a = 0, b = r.length - 2; a < r.length; b = a, a += 2) { var xa = r[a] / 10, ya = r[a + 1] / 10, xb = r[b] / 10, yb = r[b + 1] / 10; if ((ya > lat) !== (yb > lat) && lon < (xb - xa) * (lat - ya) / (yb - ya) + xa) inside = !inside; } });
          if (inside) return pl; }
        return null;
      },
      X: X, Y: Y, size: function () { return { W: W, H: H, k: k() }; },
      volcState: volcState,
    };
    return api;
  }

  /* 실시간 지진 (USGS 자료 묶음, 키 없이 누구나) */
  function live(kind) {
    var url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/' + (kind || '4.5_week') + '.geojson';
    return fetch(url, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('응답 ' + r.status); return r.json(); }).then(function (j) {
      return (j.features || []).map(function (f) { var c = f.geometry.coordinates, p = f.properties; return { lon: c[0], lat: c[1], dep: Math.round(c[2]), mag: p.mag, time: p.time, place: p.place, url: p.url }; }).filter(function (q) { return q.mag != null; });
    });
  }

  /* 잘 알려진 화산의 한국어 이름 (나머지는 영어 이름 그대로) */
  var KO = { 'Fujisan': '후지산', 'Sakurajima': '사쿠라지마', 'Etna': '에트나', 'Kilauea': '킬라우에아', 'Mauna Loa': '마우나로아', 'Ruang': '루앙', 'Pinatubo': '피나투보', 'St. Helens': '세인트헬렌스', 'Merapi': '므라피', "Hunga Tonga-Hunga Ha'apai": '훙가 통가-훙가 하아파이', 'Krakatau': '크라카타우', 'Tambora': '탐보라',
    'Changbaishan': '백두산', 'Halla': '한라산', 'Ulleungdo': '울릉도', 'Vesuvius': '베수비오', 'Stromboli': '스트롬볼리', 'Eyjafjallajokull': '에이야퍄들라이외퀴들', 'Fagradalsfjall': '파그라달스퍄들', 'Reykjanes': '레이캬네스', 'Grimsvotn': '그림스뵈튼', 'Hekla': '헤클라',
    'Nyiragongo': '니라공고', 'Nyamulagira': '니아무라기라', 'Erta Ale': '에르타 알레', 'Ol Doinyo Lengai': '올도이뇨 렝가이', 'Popocatepetl': '포포카테페틀', 'Villarrica': '비야리카', 'Cotopaxi': '코토팍시', 'Asamayama': '아사마산', 'Aso': '아소산', 'Ontakesan': '온타케산', 'Mayon': '마욘', 'Taal': '탈', 'Sinabung': '시나붕', 'Semeru': '스메루', 'Agung': '아궁', 'Kelud': '클루드',
    'Klyuchevskoy': '클류쳅스카야', 'Shiveluch': '시벨루치', 'Bezymianny': '베지먄니', 'La Palma': '라팔마', 'Whakaari/White Island': '화카아리', 'Ruapehu': '루아페후', 'Rabaul': '라바울', 'Manam': '마남', 'Augustine': '오거스틴', 'Redoubt': '리다우트', 'Pavlof': '파블로프' };
  function koName(n) { return KO[n] || n; }

  return { koName: koName, create: create, data: data, live: live, dayOf: dayOf, dateOf: dateOf, fmt: fmt, nearBoundaryKm: nearBoundaryKm, wrap: wrap, REDUCE: REDUCE };
})();
