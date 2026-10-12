/* ===== 퇴적암: 물속에 퇴적물을 쌓고, 다지고, 굳히기 (2D) =====
   호수·바다 바닥을 자른 모습이에요. 강물이 운반해 온 퇴적물이 물 위에서 가라앉아 바닥에 쌓여요.
   - 쌓기: 고른 퇴적물(자갈·모래·진흙·석회 물질)이 가라앉아 한 층이 돼요. 큰 알갱이는 빨리, 작은 알갱이는 천천히 가라앉아요.
     다른 퇴적물을 이어 쌓으면 층과 층이 나란한 줄무늬(층리)가 돼요. 생물의 유해를 함께 쌓으면 화석으로 남아요.
   - 다져지기: 쌓인 퇴적물이 눌려 알갱이 사이가 좁아지고 사이의 물이 빠져나가요.
   - 굳어지기: 물에 녹아 있는 여러 물질이 알갱이 사이를 아래부터 채워 퇴적물을 붙여요.
   알갱이 크기는 보기 쉽게 크게 그렸고, 걸리는 시간은 실제로 아주 오래예요. 이 조각 앞에 SED2D가 있어야 해요. */
window.SEDB2D = (function () {
  'use strict';
  var S = window.SED2D, BW = 230, NAME = { gravel: '역암', sand: '사암', mud: '이암', lime: '석회암' };
  var COUNT = { gravel: 24, sand: 250, mud: 1050, lime: 125 };
  function create() {
    var st = { H: S.heightMap(BW, 0.5), layers: [], falling: [], ph: 'idle', comp: 0, cem: 0, t: 0, bubbles: [], seed: 3, fossil: false, flash: 0 };
    var stat = document.createElement('canvas'), sc = stat.getContext('2d'), statKey = '';
    function reset() { st.Hprev = null; st.H = S.heightMap(BW, 0.5); st.layers = []; st.falling = []; st.ph = 'idle'; st.comp = 0; st.cem = 0; st.bubbles = []; st.seed = 3; statKey = ''; }
    function top() { var m = 0; for (var i = 0; i < st.H.h.length; i++) m = Math.max(m, st.H.h[i]); return m; }
    function deposit(kind, fossil) {
      if (st.ph !== 'idle' && st.ph !== 'deposited') return false;
      if (st.layers.length >= 4 || st.falling.length) return false;
      st.Hprev = Float32Array.from(st.H.h);
      var base = top(), P = S.pack(st.H, kind, COUNT[kind], ++st.seed * 31 + 5, { skew: kind === 'gravel' ? 1.1 : 1.4, interlock: kind === 'mud' ? 0.95 : 0.86 });
      if (fossil) { // 조개 하나를 층 중간에 함께 묻어요
        var F = S.pack(st.H, 'fossil', 1, st.seed + 99)[0]; F.shell = true; F.fossil = true;
        var more = S.pack(st.H, kind, Math.round(COUNT[kind] * 0.4), st.seed * 7 + 1, { skew: 1.4 }); P = P.concat([F], more);
      }
      var spread = kind === 'mud' ? 4.2 : kind === 'sand' ? 3.2 : 2.6, speed = kind === 'gravel' ? 120 : kind === 'sand' ? 80 : kind === 'lime' ? 70 : 34;
      P.forEach(function (p, i) { p.t0 = (i / P.length) * spread + Math.random() * 0.2; p.v = speed * (0.85 + Math.random() * 0.3); p.sw = Math.random() * 6; p.layer = st.layers.length; });
      st.layers.push({ kind: kind, P: P, base: base, top: top(), fossil: !!fossil });
      st.falling = P.slice(); st.t = 0; st.ph = 'falling';
      return true;
    }
    function compact() { if (st.ph !== 'deposited' || !st.layers.length) return false; st.ph = 'compact'; st.t = 0; return true; }
    function cement() { if (st.ph !== 'compacted') return false; st.ph = 'cement'; st.t = 0; return true; }
    function step(dt) {
      st.t += dt; st.flash = Math.max(0, st.flash - dt);
      if (st.ph === 'falling') {
        var any = false;
        st.falling.forEach(function (p) { if (p.landed) return; any = true; });
        if (!any) { st.falling = []; st.ph = 'deposited'; statKey = ''; }
      } else if (st.ph === 'compact') {
        var k = Math.min(1, st.t / 3.2); st.comp = k * k * (3 - 2 * k);
        if (Math.random() < 0.7) st.bubbles.push({ x: Math.random() * BW, y: top() * (1 - 0.16 * st.comp), r: 2 + Math.random() * 3.5, life: 0 });
        if (k >= 1) { st.ph = 'compacted'; }
      } else if (st.ph === 'cement') {
        var k2 = Math.min(1, st.t / 3.6); st.cem = k2;
        if (k2 >= 1) { st.ph = 'rock'; st.flash = 1.2; }
      }
      st.bubbles.forEach(function (b) { b.life += dt * 0.5; b.y += dt * 40; b.x += Math.sin(b.life * 12) * 0.2; });
      st.bubbles = st.bubbles.filter(function (b) { return b.life < 1; });
    }
    /* 그리기 */
    function draw(c, W, H, time) {
      c.clearRect(0, 0, W, H);
      var land = W / H >= 1.2, pad = Math.max(12, W * 0.02);
      var bx = pad + (land ? W * 0.06 : 0), bw = W - bx - pad - (land ? W * 0.16 : W * 0.2), s = bw / BW;
      var surf = H * 0.2, floor = H - pad - H * 0.06, deep = floor - surf;
      var X = function (u) { return bx + u * s; }, comp = 1 - 0.16 * st.comp, Y = function (v) { return floor - v * s * comp; }, Yr = function (v) { return floor - v * s; };
      // 하늘과 뭍
      var sky = c.createLinearGradient(0, 0, 0, surf); sky.addColorStop(0, '#c4e2f3'); sky.addColorStop(1, '#eef7fb'); c.fillStyle = sky; c.fillRect(0, 0, W, surf + 2);
      // 물
      var wg = c.createLinearGradient(0, surf, 0, floor); wg.addColorStop(0, '#8fcbe4'); wg.addColorStop(1, '#3d86ab'); c.fillStyle = wg; c.fillRect(0, surf, W, floor - surf);
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.beginPath(); for (var x = 0; x <= W; x += 10) { var y = surf + Math.sin(x / 30 + time * 1.5) * 2.5; if (!x) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke();
      // 강 (왼쪽 위에서 흘러들어요)
      c.fillStyle = '#9c7a52'; c.beginPath(); c.moveTo(0, surf - H * 0.02); c.lineTo(W * 0.14, surf - 2); c.lineTo(W * 0.14, surf + 4); c.lineTo(0, surf + 10); c.fill();
      c.fillStyle = '#7fae55'; c.beginPath(); c.moveTo(0, surf - H * 0.07); c.quadraticCurveTo(W * 0.08, surf - H * 0.06, W * 0.15, surf - 3); c.lineTo(W * 0.15, surf - 1); c.lineTo(0, surf - H * 0.02); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; for (var k3 = 0; k3 < 3; k3++) { var off = (time * 40 + k3 * 30) % 90; c.beginPath(); c.moveTo(off * W / 700, surf - H * 0.03 + off * 0.12); c.lineTo(off * W / 700 + 16, surf - H * 0.03 + off * 0.12 + 2); c.stroke(); }
      // 바닥(기반암)
      c.fillStyle = '#5c4a3a'; c.fillRect(0, floor, W, H - floor); c.fillStyle = 'rgba(0,0,0,.15)'; for (var i = 0; i < 40; i++) c.fillRect((i * 97) % W, floor + 4 + (i * 13) % Math.max(4, H - floor - 6), 18, 3);
      // 쌓인 퇴적물
      var hasSed = st.layers.length > 0;
      if (hasSed) {
        // 알갱이 사이: 물 → 붙이는 물질
        var HH = st.ph === 'falling' && st.Hprev ? st.Hprev : st.H.h, tp = 0; for (var j0 = 0; j0 < HH.length; j0++) tp = Math.max(tp, HH[j0]);
        c.save(); c.beginPath(); c.moveTo(X(0), floor); for (var j = 0; j < HH.length; j++) c.lineTo(X(j * st.H.dx), Y(HH[j])); c.lineTo(X(BW), floor); c.closePath(); c.clip();
        c.fillStyle = 'rgba(40,100,135,.55)'; c.fillRect(X(0), Y(tp) - 4, bw, floor - Y(tp) + 4);
        if (st.cem > 0) { var fy = floor - (floor - Y(top() + 2)) * st.cem; var cg = c.createLinearGradient(0, fy - 16, 0, floor); cg.addColorStop(0, 'rgba(200,160,110,0)'); cg.addColorStop(0.1, 'rgba(196,156,104,1)'); cg.addColorStop(1, 'rgba(160,118,76,1)'); c.fillStyle = cg; c.fillRect(X(0), fy - 16, bw, floor - fy + 16); }
        c.restore();
        // 다 쌓인 알갱이는 한 장에 그려 두고(빠르게), 다질 때는 그 장을 세로로 눌러 그려요
        var key = W + 'x' + H + ':' + st.layers.length + ':' + st.layers.map(function (L) { return L.P.filter(function (p) { return p.landed; }).length; }).join(',');
        if (key !== statKey && st.ph !== 'falling') { statKey = key; stat.width = Math.ceil(bw); stat.height = Math.ceil(floor); sc.clearRect(0, 0, stat.width, stat.height); st.layers.forEach(function (L) { L.P.forEach(function (p) { if (p.landed) S.grain(sc, p, p.x * s, floor - p.y * s, s, p.kind === 'mud'); }); }); }
        if (st.ph === 'falling') { // 떨어지는 중에는 그때그때 그려요
          st.layers.forEach(function (L) { L.P.forEach(function (p) { if (p.landed) S.grain(c, p, X(p.x), Yr(p.y), s, p.kind === 'mud'); }); });
        } else { c.drawImage(stat, 0, 0, stat.width, stat.height, bx, floor - floor * comp, stat.width, stat.height * comp); }
        if (st.cem > 0) { c.save(); c.globalAlpha = 0.12 * st.cem; c.fillStyle = '#a8763e'; c.beginPath(); c.moveTo(X(0), floor); for (var j2 = 0; j2 < st.H.h.length; j2++) c.lineTo(X(j2 * st.H.dx), Y(st.H.h[j2])); c.lineTo(X(BW), floor); c.closePath(); c.fill(); c.restore(); }
      }
      // 떨어지는 알갱이
      var tNow = st.t;
      st.falling.forEach(function (p) {
        if (p.landed) return; var dt0 = tNow - p.t0; if (dt0 < 0) return;
        var y0 = (floor - surf) / s + 8, y = y0 - dt0 * p.v;
        if (y <= p.y) { p.landed = true; y = p.y; }
        var x = p.x + Math.sin(p.sw + dt0 * 3) * (p.kind === 'mud' ? 4 : 1.5) * Math.min(1, (y - p.y) / 30);
        if (p.kind === 'mud' && !p.landed) { c.fillStyle = 'rgba(122,104,84,.55)'; c.beginPath(); c.arc(X(x), Yr(y), Math.max(1, p.r * s * 1.3), 0, 6.283); c.fill(); }
        else S.grain(c, p, X(x), Yr(y), s, false);
      });
      st.bubbles.forEach(function (b) { c.fillStyle = 'rgba(255,255,255,' + 0.75 * (1 - b.life) + ')'; c.strokeStyle = 'rgba(30,90,130,' + 0.5 * (1 - b.life) + ')'; c.lineWidth = 1.2; c.beginPath(); c.arc(X(b.x), Yr(b.y), b.r * s * 0.9, 0, 6.283); c.fill(); c.stroke(); });
      // 누르는 화살표
      if (st.ph === 'compact') { var a = Math.min(1, st.t * 2) * Math.max(0, Math.min(1, (3.2 - st.t) * 2)); c.fillStyle = 'rgba(30,60,100,' + 0.75 * a + ')'; for (var q = 0; q < 5; q++) { var ax = X(BW * (0.1 + q * 0.2)), ay = Y(top()) - 70 + Math.sin(time * 5 + q) * 3; c.beginPath(); c.moveTo(ax - 12, ay); c.lineTo(ax + 12, ay); c.lineTo(ax + 12, ay + 24); c.lineTo(ax + 24, ay + 24); c.lineTo(ax, ay + 48); c.lineTo(ax - 24, ay + 24); c.lineTo(ax - 12, ay + 24); c.closePath(); c.fill(); } }
      // 굳은 뒤 반짝
      if (st.flash > 0 && hasSed) { c.save(); c.globalAlpha = Math.min(1, st.flash) * 0.35; c.fillStyle = '#fff6d8'; c.fillRect(X(0), Y(top()), bw, floor - Y(top())); c.restore(); }
      // 층 이름표 (오른쪽)
      var fs = Math.max(13, Math.round(Math.min(W, H) * 0.028));
      c.font = '800 ' + fs + 'px Pretendard, sans-serif'; c.textBaseline = 'middle';
      st.layers.forEach(function (L, i) {
        var mid = Y((L.base + L.top) / 2), lx = X(BW) + 10, done = st.ph === 'rock', txt = done ? NAME[L.kind] : S.KIND[L.kind].name;
        c.strokeStyle = '#2b3a40'; c.lineWidth = 2; c.beginPath(); c.moveTo(lx, Y(L.base) - 2); c.lineTo(lx + 6, Y(L.base) - 2); c.lineTo(lx + 6, Y(L.top) + 2); c.lineTo(lx, Y(L.top) + 2); c.stroke();
        var tw = c.measureText(txt).width + 14; c.fillStyle = done ? '#a87a22' : 'rgba(255,255,255,.92)'; c.beginPath(); c.roundRect(lx + 12, mid - fs * 0.8, tw, fs * 1.6, 8); c.fill(); c.fillStyle = done ? '#fff' : '#3b4a52'; c.textAlign = 'left'; c.fillText(txt, lx + 19, mid + 1);
      });
      var fos = null; st.layers.forEach(function (L) { L.P.forEach(function (p) { if (p.fossil && p.landed) fos = p; }); });
      if (fos && (st.ph === 'rock' || st.ph === 'compacted' || st.ph === 'deposited' || st.ph === 'compact' || st.ph === 'cement')) {
        var fx = X(fos.x), fy2 = Y(fos.y); c.strokeStyle = '#7a4fb8'; c.lineWidth = 2.5; c.setLineDash([4, 4]); c.beginPath(); c.arc(fx, fy2, fos.r * s * 1.6, 0, 6.283); c.stroke(); c.setLineDash([]);
        var t2 = st.ph === 'rock' ? '화석' : '생물의 유해'; var tw2 = c.measureText(t2).width + 14; c.fillStyle = '#7a4fb8'; c.beginPath(); c.roundRect(fx - tw2 / 2, fy2 - fos.r * s * 1.6 - fs * 1.9, tw2, fs * 1.6, 8); c.fill(); c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(t2, fx, fy2 - fos.r * s * 1.6 - fs * 1.1);
      }
      if (st.ph === 'rock' && st.layers.length > 1) { // 층리
        var lx2 = bx - (land ? 14 : 6), t1 = Y(top()), b1 = floor; c.strokeStyle = '#a87a22'; c.lineWidth = 3; c.beginPath(); c.moveTo(lx2 + 6, t1); c.lineTo(lx2, t1); c.lineTo(lx2, b1); c.lineTo(lx2 + 6, b1); c.stroke();
        if (land) { c.save(); c.translate(lx2 - fs * 0.9, (t1 + b1) / 2); c.rotate(-Math.PI / 2); c.fillStyle = '#a87a22'; c.textAlign = 'center'; c.fillText('층리', 0, 0); c.restore(); }
      }
      // 안내
      c.textAlign = 'left'; c.fillStyle = '#14263b'; c.font = '800 ' + fs + 'px Pretendard, sans-serif';
      var tip = { idle: '퇴적물을 골라 「쌓기」를 눌러요', falling: '퇴적물이 가라앉아 바닥에 쌓여요', deposited: st.layers.length < 4 ? '다른 퇴적물을 더 쌓거나 「다져지기」를 눌러요' : '「다져지기」를 눌러요', compact: '눌려서 다져지며 알갱이 사이의 물이 빠져나가요', compacted: '「굳어지기」를 눌러요', cement: '물에 녹아 있는 여러 물질이 알갱이 사이를 채워요', rock: '단단한 퇴적암이 되었어요' }[st.ph];
      var tw3 = c.measureText(tip).width + 20; c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.roundRect(pad, pad, tw3, fs * 1.9, 10); c.fill(); c.fillStyle = '#14263b'; c.fillText(tip, pad + 10, pad + fs * 0.95 + 1);
    }
    return { st: st, reset: reset, deposit: deposit, compact: compact, cement: cement, step: step, draw: draw, NAME: NAME, top: top };
  }
  return { create: create };
})();
