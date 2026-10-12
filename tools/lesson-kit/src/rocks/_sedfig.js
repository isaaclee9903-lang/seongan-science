/* ===== 읽기 그림 ②: 퇴적암의 생성 과정 (교과서 그림 Ⅱ-6을 움직이는 그림으로) =====
   동그란 확대 창 세 개: ① 물속에서 퇴적물이 하나씩 가라앉아 쌓여요 ② 위에서 눌려 다져지며 알갱이 사이의 물이 빠져나가요
   ③ 물에 녹아 있는 여러 물질이 알갱이 사이를 아래부터 채워 퇴적물을 붙여요. 차례대로 움직이고 반복해요.
   이 조각 앞에 SED2D(_sed2d.js)가 있어야 해요. */
window.SEDFIG = (function () {
  'use strict';
  var S = window.SED2D;
  var LABEL = [['퇴적물이 쌓인다.'], ['퇴적물이 다져진다.'], ['물에 녹아 있는 여러 물질이', '퇴적물을 붙여 단단한 암석이 된다.']];
  function make(cv) {
    var c = cv.getContext('2d'), W = cv.width, Hc = cv.height, R = 190, CY = 250, CX = [225, 640, 1055];
    var H = S.heightMap(100, 0.5), P = S.pack(H, 'mix', 78, 11, { skew: 1.2 });
    var top = 0; for (var i = 0; i < H.h.length; i++) top = Math.max(top, H.h[i]);
    var N = P.length, T1 = 6.0, t = 0, last = performance.now();
    P.forEach(function (p, i) { p.t0 = (i / N) * (T1 - 1.6); p.y0 = 112 + p.r + (i % 3) * 4; p.dur = (p.y0 - p.y) / 70 + 0.25; p.sw = Math.random() * 6; });
    var bubbles = [];
    var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (reduce) t = 14;
    function waterBg(cx) {
      var g = c.createLinearGradient(0, CY - R, 0, CY + R); g.addColorStop(0, '#bfe6f3'); g.addColorStop(1, '#6fb7d6');
      c.fillStyle = g; c.fillRect(cx - R, CY - R, 2 * R, 2 * R);
      // 물결 빛
      c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 2;
      for (var k = 0; k < 4; k++) { c.beginPath(); for (var x = -R; x <= R; x += 8) { var y = CY - R + 24 + k * 30 + Math.sin(x / 26 + t * 1.3 + k) * 4; if (x === -R) c.moveTo(cx + x, y); else c.lineTo(cx + x, y); } c.stroke(); }
    }
    function panel(idx, st) {
      var cx = CX[idx], s = (2 * R) / 100;
      var X = function (u) { return cx - R + u * s; }, Y = function (v) { return CY + R - v * s * st.comp; };
      c.save(); c.beginPath(); c.arc(cx, CY, R, 0, 6.283); c.clip();
      waterBg(cx);
      // 알갱이 사이 채우기: 물(파랑) → 물질(연한 갈색), 아래부터
      if (st.cem > 0) {
        c.save(); S.topPath(c, H, X, function (v) { return CY + R - v * s * st.comp; }); c.clip();
        var fy = CY + R - st.cem * (top + 4) * s * st.comp;
        var g = c.createLinearGradient(0, fy - 20, 0, CY + R); g.addColorStop(0, 'rgba(196,150,96,0)'); g.addColorStop(0.08, 'rgba(196,150,96,.95)'); g.addColorStop(1, 'rgba(170,122,72,1)');
        c.fillStyle = g; c.fillRect(cx - R, fy - 20, 2 * R, CY + R - fy + 20);
        // 작은 알갱이(붙이는 물질) 점무늬
        c.fillStyle = 'rgba(120,80,40,.35)'; for (var k = 0; k < 260; k++) { var u = (k * 37.3) % 100, v = (k * 13.7) % top; var yy = Y(v); if (yy > fy) { c.fillRect(X(u), yy, 2, 2); } }
        c.restore();
      }
      // 알갱이
      for (var i = 0; i < N; i++) {
        var p = P[i], y = p.y, x = p.x;
        if (st.fall) { var k2 = (t - p.t0) / p.dur; if (k2 <= 0) continue; if (k2 < 1) { var e = k2 * k2 * (3 - 2 * k2); y = p.y0 + (p.y - p.y0) * e; x = p.x + Math.sin(p.sw + k2 * 5) * 2.2 * (1 - k2); } }
        var sy = st.comp; c.save(); c.translate(X(x), Y(y)); c.scale(1, 0.94 + 0.06 * sy); S.grain(c, p, 0, 0, s); c.restore();
      }
      // 다져지기: 위에서 누르는 화살표, 빠져나가는 물방울
      if (st.press > 0 && st.press < 1.2) {
        var a = Math.min(1, st.press * 3) * (st.press > 1 ? Math.max(0, 1 - (st.press - 1) * 5) : 1);
        c.fillStyle = 'rgba(40,70,110,' + 0.8 * a + ')';
        for (var j = -1; j <= 1; j++) { var ax = cx + j * 90, ay = Y(top) - 64 + Math.sin(t * 4) * 3; c.beginPath(); c.moveTo(ax - 13, ay); c.lineTo(ax + 13, ay); c.lineTo(ax + 13, ay + 22); c.lineTo(ax + 26, ay + 22); c.lineTo(ax, ay + 46); c.lineTo(ax - 26, ay + 22); c.lineTo(ax - 13, ay + 22); c.closePath(); c.fill(); }
      }
      bubbles.forEach(function (b) { if (b.panel !== idx) return; c.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - b.life)) + ')'; c.strokeStyle = 'rgba(70,140,180,' + (0.6 * (1 - b.life)) + ')'; c.beginPath(); c.arc(X(b.x), Y(b.y), b.r, 0, 6.283); c.fill(); c.stroke(); });
      if (st.dim) { c.fillStyle = 'rgba(246,243,236,.62)'; c.fillRect(cx - R, CY - R, 2 * R, 2 * R); }
      c.restore();
      // 테두리
      c.lineWidth = 6; c.strokeStyle = '#fff'; c.beginPath(); c.arc(cx, CY, R, 0, 6.283); c.stroke();
      c.lineWidth = 1.5; c.strokeStyle = 'rgba(80,60,30,.25)'; c.beginPath(); c.arc(cx, CY, R + 3, 0, 6.283); c.stroke();
      // 번호
      c.fillStyle = st.dim ? '#e8c9a6' : '#f08a2a'; c.beginPath(); c.arc(cx - R * 0.72, CY - R * 0.72, 26, 0, 6.283); c.fill();
      c.lineWidth = 4; c.strokeStyle = '#fff'; c.stroke();
      c.fillStyle = '#fff'; c.font = '900 30px Pretendard, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(idx + 1), cx - R * 0.72, CY - R * 0.72 + 1);
      // 이름표
      var L = LABEL[idx], lw = idx === 2 ? 390 : 260, lh = L.length * 30 + 16, ly = CY + R + 18;
      c.fillStyle = st.dim ? 'rgba(255,255,255,.6)' : '#fff'; c.strokeStyle = st.dim ? '#e4dccb' : '#e3b98a'; c.lineWidth = 2;
      c.beginPath(); c.roundRect(cx - lw / 2, ly, lw, lh, 14); c.fill(); c.stroke();
      c.fillStyle = st.dim ? '#a89a86' : '#4a3418'; c.font = '800 23px Pretendard, sans-serif';
      L.forEach(function (s2, k) { c.fillText(s2, cx, ly + 23 + k * 30); });
    }
    function chevron(x, on) {
      c.fillStyle = on ? '#f0a65a' : '#e9d9c2'; c.beginPath(); c.moveTo(x - 12, CY - 30); c.lineTo(x + 14, CY); c.lineTo(x - 12, CY + 30); c.lineTo(x - 4, CY); c.closePath(); c.fill();
    }
    function frame() {
      var now = performance.now(), dt = Math.min(0.12, (now - last) / 1000); last = now;
      var r = cv.getBoundingClientRect(), vis = r.bottom > 0 && r.top < (window.innerHeight || 800) && !document.hidden;
      if (vis && !reduce) t += dt;
      if (t > 17.5) { t = 0; bubbles = []; }
      // 단계별 상태
      var p2 = Math.max(0, Math.min(1, (t - 6.6) / 2.8)), p3 = Math.max(0, Math.min(1, (t - 10.2) / 3.0));
      var comp = 1 - 0.16 * (p2 * p2 * (3 - 2 * p2));
      if (vis && t > 6.6 && t < 9.6 && Math.random() < 0.5) bubbles.push({ panel: 1, x: 5 + Math.random() * 90, y: top * comp, r: 3 + Math.random() * 4, life: 0 });
      bubbles.forEach(function (b) { b.life += dt * 0.6; b.y += dt * 26; b.x += Math.sin(b.life * 9) * 0.1; }); bubbles = bubbles.filter(function (b) { return b.life < 1; });
      c.clearRect(0, 0, W, Hc);
      panel(0, { fall: true, comp: 1, cem: 0, dim: false });
      panel(1, { comp: t < 6.6 ? 1 : comp, cem: 0, press: t >= 6.6 ? (t - 6.6) / 3 : 0, dim: t < 6.6 });
      panel(2, { comp: t < 10.2 ? 0.84 : 0.84, cem: t < 10.2 ? 0 : p3 * p3 * (3 - 2 * p3), dim: t < 10.2 });
      chevron(433, t >= 6.6); chevron(848, t >= 10.2);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return { restart: function () { t = 0; bubbles = []; } };
  }
  return { make: make };
})();
