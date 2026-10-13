/* ===== 여러 가지 풍화 작용 (교과서 그림 Ⅱ-11을 움직이는 그림으로) =====
   WX.draw(kind, ctx, W, H, t, p, o): kind = 'ice' | 'bio' | 'press' | 'co2', p = 풍화가 진행된 정도(0~1), t = 시간(바람·비 같은 잔 움직임)
   설계 크기 640×420. o.labels === false면 그림 안 이름표를 줄여요(작은 칸).
   이 조각 앞에 ART(_art.js)가 있어야 해요. */
window.WX = (function () {
  'use strict';
  var A = window.ART, W0 = 640, H0 = 420, GY = 360;
  var seg = A.seg, lerp = A.lerp, clamp = A.clamp;

  /* ---------- 공통: 틈이 있는 바위 ---------- */
  var C0 = [312, 122], TIP = [330, 310], CB = [330, 362];
  var CRK = [C0, [322, 160], [310, 200], [326, 240], [318, 280], TIP];
  var RIGHT = [C0, [360, 114], [410, 124], [452, 150], [478, 190], [492, 240], [488, 295], [470, 340], [450, 361], CB, TIP, [318, 280], [326, 240], [310, 200], [322, 160]];
  var LEFT = [C0, [322, 160], [310, 200], [326, 240], [318, 280], TIP, CB, [200, 361], [170, 330], [152, 280], [150, 230], [162, 180], [190, 146], [236, 124], [275, 118]];
  var BR = [450, 361], BL = [200, 361];
  function about(c, x, y, a) { c.translate(x, y); c.rotate(a); c.translate(-x, -y); }
  /* aR: 틈이 벌어진 각, sR·sL: 마지막에 쪼개져 기울어지는 각 */
  function parts(aR, sR, sL) {
    return {
      R: function (P) { return A.rot(A.rot(P, TIP[0], TIP[1], aR), BR[0], BR[1], sR, sR * 260, 0); },
      L: function (P) { return A.rot(A.rot(P, TIP[0], TIP[1], -aR * 0.45), BL[0], BL[1], -sL); },
      applyR: function (c) { c.translate(sR * 260, 0); about(c, BR[0], BR[1], sR); about(c, TIP[0], TIP[1], aR); },
      applyL: function (c) { about(c, BL[0], BL[1], -sL); about(c, TIP[0], TIP[1], -aR * 0.45); },
    };
  }
  function gapPoly(T, split) { var cr = split > 0 ? CRK.concat([[330, lerp(310, 362, split)]]) : CRK; return T.L(cr).concat(T.R(cr).reverse()); }
  function boulder(c, T, deco, kind) {
    c.save(); T.applyL(c); A.rock(c, LEFT, kind || 'granite', { edge: false, shadow: true }); if (deco) deco(c, 'L'); c.restore();
    c.save(); T.applyR(c); A.rock(c, RIGHT, kind || 'granite', { edge: false, shadow: false }); if (deco) deco(c, 'R'); c.restore();
    // 바깥 테두리만 (가운데 이음매는 그리지 않음)
    c.save(); c.lineJoin = 'round'; c.lineWidth = 2.2; c.strokeStyle = 'rgba(48,40,32,.75)';
    var l = T.L(LEFT.slice(6).concat([LEFT[0]])), r = T.R(RIGHT.slice(0, 10));
    [l, r].forEach(function (P) { c.beginPath(); P.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke(); });
    c.restore();
  }
  function ground(c, t, o) {
    o = o || {};
    var g = c.createLinearGradient(0, GY, 0, H0); g.addColorStop(0, o.top || '#7a6a4a'); g.addColorStop(1, '#4e4130'); c.fillStyle = g; c.fillRect(-200, GY, W0 + 400, H0 - GY + 80);
    c.fillStyle = A.pat(c, 'humus'); c.globalAlpha = 0.5; c.fillRect(-200, GY + 6, W0 + 400, H0 - GY + 80); c.globalAlpha = 1;
    if (o.grass !== false) A.grass(c, -40, W0 + 40, GY + 2, t, { h: 14, gap: 6, seed: 3, scale: o.gs == null ? 1 : o.gs });
  }
  function hills(c, night) {
    c.save(); c.fillStyle = night ? 'rgba(40,60,90,.55)' : 'rgba(120,160,150,.55)';
    c.beginPath(); c.moveTo(-200, 300); c.bezierCurveTo(60, 200, 160, 250, 260, 230); c.bezierCurveTo(380, 200, 470, 260, 560, 215); c.bezierCurveTo(620, 190, 700, 230, 840, 250); c.lineTo(840, GY + 2); c.lineTo(-200, GY + 2); c.closePath(); c.fill();
    c.fillStyle = night ? 'rgba(30,48,70,.7)' : 'rgba(96,140,110,.7)';
    c.beginPath(); c.moveTo(-200, 330); c.bezierCurveTo(40, 280, 120, 300, 220, 300); c.bezierCurveTo(340, 300, 420, 270, 520, 290); c.bezierCurveTo(600, 300, 700, 280, 840, 300); c.lineTo(840, GY + 2); c.lineTo(-200, GY + 2); c.closePath(); c.fill();
    c.restore();
  }
  function bg(c, W, H, top, bot) { var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  function mix(a, b, k) { var pa = a.match(/\w\w/g).map(function (h) { return parseInt(h, 16); }), pb = b.match(/\w\w/g).map(function (h) { return parseInt(h, 16); }); return 'rgb(' + pa.map(function (v, i) { return Math.round(lerp(v, pb[i], k)); }).join(',') + ')'; }
  function rubble(c, k, seed, x0, x1) { // 바위 밑에 떨어진 조각
    if (k <= 0) return; var r = A.rng(seed), n = 7;
    for (var i = 0; i < n; i++) {
      var kk = clamp(k * 1.6 - i * 0.09, 0, 1); if (kk <= 0) continue;
      var x = lerp(x0, x1, r()), s = 9 + r() * 13, yEnd = GY - s * 0.45, y = lerp(CRK[0][1] + 30, yEnd, kk * kk);
      var P = A.blob(x, y, s, s * 0.7, 7, seed + i * 7, 0.5); A.rock(c, P, 'granite', { lw: 1.4, blur: 6, sy: 3 });
    }
  }

  /* ---------- ① 물: 틈에 스며든 물이 얼어 부피가 늘어나며 틈을 넓혀요 ---------- */
  function ice(c, W, H, t, p, o) {
    var N = 4, end = 0.84, cyc = Math.min(p, end) / end * N, k = Math.min(N, Math.floor(cyc)), f = p >= end ? 0 : cyc - k;
    if (k >= N) f = 0;
    var nightK = p >= end ? 0 : clamp(seg(f, 0.3, 0.4) - seg(f, 0.68, 0.78), 0, 1);
    var split = seg(p, 0.86, 1), aR = 0.012 + 0.019 * (k + (p >= end ? 0 : seg(f, 0.4, 0.64)));
    var T = parts(aR, 0.1 * split, 0.04 * split);
    bg(c, W, H, mix('9fd2ee', '14203a', nightK), mix('e6f2ec', '33415e', nightK));
    A.fit(c, W, H, W0, H0, true);
    // 별·해·달
    if (nightK > 0.02) { c.fillStyle = 'rgba(255,255,255,' + 0.8 * nightK + ')'; var r = A.rng(4); for (var i = 0; i < 40; i++) { var sx = r() * W0, sy = r() * 200; c.fillRect(sx, sy, 1.6 + (i % 3 === 0 ? 1 : 0), 1.6); } }
    var bx = 560, by = 62;
    c.save(); c.globalAlpha = 1 - nightK; var sg = c.createRadialGradient(bx, by, 4, bx, by, 60); sg.addColorStop(0, 'rgba(255,240,170,1)'); sg.addColorStop(0.35, 'rgba(255,214,100,.9)'); sg.addColorStop(1, 'rgba(255,214,100,0)'); c.fillStyle = sg; c.beginPath(); c.arc(bx, by, 60, 0, 6.283); c.fill();
    c.globalAlpha = nightK; c.fillStyle = '#f1f3ff'; c.beginPath(); c.arc(bx, by, 22, 0, 6.283); c.fill(); c.fillStyle = mix('14203a', '14203a', 0); c.beginPath(); c.arc(bx + 10, by - 6, 19, 0, 6.283); c.fill(); c.restore();
    hills(c, nightK > 0.5);
    ground(c, t, { top: mix('7a6a4a', '3e4658', nightK * 0.7) });
    // 틈 속 (어두운 안쪽)
    var G = gapPoly(T, split);
    c.save(); A.path(c, G); var dg = c.createLinearGradient(0, 120, 0, 320); dg.addColorStop(0, '#3a2e24'); dg.addColorStop(1, '#120d09'); c.fillStyle = dg; c.globalAlpha = 1 - split; c.fill(); c.globalAlpha = 1; c.clip();
    // 물·얼음
    var lvl = p >= end ? lerp(1, 0, seg(p, 0.84, 0.9)) : k === 0 ? seg(f, 0.04, 0.32) : 1;
    var iceK = p >= end ? 0 : seg(f, 0.38, 0.5) * (1 - seg(f, 0.7, 0.84));
    if (lvl > 0.01) {
      var ly = lerp(312, 118, lvl);
      var wg = c.createLinearGradient(0, ly, 0, 312); wg.addColorStop(0, 'rgba(110,190,240,.95)'); wg.addColorStop(1, 'rgba(40,110,190,.95)'); c.fillStyle = wg; c.fillRect(250, ly, 140, 330 - ly);
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(250, ly + 1.5); c.lineTo(390, ly + 1.5); c.stroke();
    }
    if (iceK > 0.01) {
      c.globalAlpha = iceK; var ig = c.createLinearGradient(290, 0, 350, 0); ig.addColorStop(0, '#d9f1fb'); ig.addColorStop(0.5, '#ffffff'); ig.addColorStop(1, '#bfe4f5'); c.fillStyle = ig; c.fillRect(250, 100, 140, 230);
      c.strokeStyle = 'rgba(120,180,220,.8)'; c.lineWidth = 1.2; var rr = A.rng(8);
      for (var j = 0; j < 22; j++) { var x = 296 + rr() * 50, y = 125 + rr() * 185, s = 4 + rr() * 6; c.beginPath(); for (var m = 0; m < 3; m++) { var a = m * 1.047; c.moveTo(x - Math.cos(a) * s, y - Math.sin(a) * s); c.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); } c.stroke(); }
      c.globalAlpha = 1;
    }
    c.restore();
    // 얼음이 입구 위로 볼록 솟음
    if (iceK > 0.05) { var mouth = [(T.L([C0])[0][0] + T.R([C0])[0][0]) / 2, (T.L([C0])[0][1] + T.R([C0])[0][1]) / 2]; c.save(); c.globalAlpha = iceK; var hg = c.createRadialGradient(mouth[0] - 3, mouth[1] - 6, 1, mouth[0], mouth[1], 16); hg.addColorStop(0, '#ffffff'); hg.addColorStop(1, '#bfe4f5'); c.fillStyle = hg; c.beginPath(); c.ellipse(mouth[0], mouth[1] - 2, 15 + aR * 90, 8, 0, Math.PI, 0); c.fill(); c.restore(); }
    boulder(c, T);
    // 갈라짐이 아래까지 (마지막)
    if (split > 0 && split < 0.4) { A.crack(c, T.R([TIP, [327, lerp(310, 361, split / 0.4)]]), 2.5); }
    rubble(c, seg(p, 0.9, 1), 21, 300, 520);
    // 비 (물이 스며드는 때)
    var rain = p >= end ? 0 : (k === 0 ? 1 - seg(f, 0.3, 0.36) : seg(f, 0.86, 0.92) + (1 - seg(f, 0.2, 0.3)) - 1 + (f < 0.3 ? 1 : 0));
    rain = clamp(rain, 0, 1) * (1 - nightK);
    if (rain > 0.05 && !A.REDUCE) { c.strokeStyle = 'rgba(70,130,200,' + 0.6 * rain + ')'; c.lineWidth = 2; for (var d = 0; d < 34; d++) { var dx = ((d * 97) % 680) - 20, dy = ((t * 380 + d * 53) % 420); c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx - 4, dy + 14); c.stroke(); } }
    // 얼면서 틈을 미는 화살표
    var push = p >= end ? 0 : seg(f, 0.4, 0.48) * (1 - seg(f, 0.62, 0.7));
    if (push > 0.02) { c.save(); c.globalAlpha = push; var mid = T.R([[318, 220]])[0], midL = T.L([[318, 220]])[0]; A.arrow(c, midL[0] - 6, midL[1], midL[0] - 52, midL[1] + 4, '#f07b2a', 6); A.arrow(c, mid[0] + 6, mid[1], mid[0] + 52, mid[1] - 4, '#f07b2a', 6); c.restore(); }
    if (o.labels !== false) {
      var lab = p >= end ? (split > 0.5 ? '틈이 커져 암석이 부서졌어요' : '틈이 점점 넓어졌어요') : nightK > 0.5 ? '밤: 물이 얼어 부피가 늘어나요' : f < 0.36 ? (k ? '낮: 녹은 물이 다시 스며들어요' : '물이 암석 틈에 스며들어요') : '낮: 얼음이 녹아요';
      A.pill(c, lab, 24, 34, { align: 'left', size: 21, bg: nightK > 0.5 ? 'rgba(20,32,58,.85)' : 'rgba(255,255,255,.92)', fg: nightK > 0.5 ? '#e4ecff' : '#24384a' });
      if (iceK > 0.5) A.pill(c, '얼음', 382, 168, { size: 18, bg: '#e9f7fd', fg: '#1d5f88', stroke: '#9fd2ee' });
      else if (lvl > 0.5 && p < end) A.pill(c, '물', 382, 250, { size: 18, bg: '#e3f1fc', fg: '#1d5f88', stroke: '#9fd2ee' });
    }
  }

  /* ---------- ② 생물: 뿌리가 자라며 틈을 넓히고, 이끼가 성분을 바꿔요 ---------- */
  var MOSS = { L: [[196, 300, 30], [176, 230, 22], [236, 336, 22], [214, 170, 16]], R: [[440, 300, 28], [470, 240, 22], [400, 336, 20], [430, 170, 14]] };
  var SIDE = { L: [[306, 124], [282, 120], [252, 126], [224, 138], [198, 154], [178, 182], [166, 214]], R: [[318, 122], [356, 116], [402, 126], [440, 148], [466, 178], [482, 214], [489, 250]] };
  function bio(c, W, H, t, p, o) {
    var aR = 0.006 + 0.07 * seg(p, 0.3, 0.92), split = seg(p, 0.9, 1);
    var T = parts(aR, 0.07 * split, 0.02 * split);
    bg(c, W, H, '#cfe6d2', '#eef3e6'); A.fit(c, W, H, W0, H0, true);
    // 숲 배경
    c.save(); for (var i = 0; i < 9; i++) { var x = i * 82 - 20, h = 160 + (i % 3) * 40; var g = c.createLinearGradient(x, 0, x + 26, 0); g.addColorStop(0, 'rgba(110,130,100,.35)'); g.addColorStop(1, 'rgba(80,100,70,.2)'); c.fillStyle = g; c.fillRect(x, GY - h - 120, 18 + (i % 2) * 8, h + 140); } c.restore();
    c.save(); var fg = c.createRadialGradient(320, 40, 20, 320, 40, 420); fg.addColorStop(0, 'rgba(255,255,230,.6)'); fg.addColorStop(1, 'rgba(255,255,230,0)'); c.fillStyle = fg; c.fillRect(0, 0, W0, H0); c.restore();
    ground(c, t, { top: '#6b5a3a' });
    var G = gapPoly(T, split); c.save(); A.path(c, G); c.fillStyle = '#1d150e'; c.globalAlpha = 1 - split; c.fill(); c.restore();
    var mossK = seg(p, 0.12, 0.85);
    boulder(c, T, function (cc, side) {
      if (mossK <= 0) return;
      cc.save(); A.path(cc, side === 'L' ? LEFT : RIGHT); cc.clip();
      MOSS[side].forEach(function (m, i) {
        var R = m[2] * mossK * (1 + i * 0.08); if (R < 1) return;
        // 이끼 밑: 성분이 변해 색이 달라진 자리
        var tg = cc.createRadialGradient(m[0], m[1], R * 0.3, m[0], m[1], R * 1.7); tg.addColorStop(0, 'rgba(150,104,52,.55)'); tg.addColorStop(1, 'rgba(150,104,52,0)'); cc.fillStyle = tg; cc.beginPath(); cc.arc(m[0], m[1], R * 1.7, 0, 6.283); cc.fill();
        var r = A.rng(30 + i + (side === 'L' ? 0 : 50));
        for (var j = 0; j < 70; j++) { var a = r() * 6.283, d = Math.sqrt(r()) * R, x = m[0] + Math.cos(a) * d * 1.3, y = m[1] + Math.sin(a) * d * 0.8, s = 2 + r() * 3.2; cc.fillStyle = r() < 0.5 ? '#5d8f2e' : r() < 0.5 ? '#86b544' : '#3f6e22'; cc.beginPath(); cc.arc(x, y, s, 0, 6.283); cc.fill(); }
      });
      cc.restore();
    });
    // 뿌리: 틈 가운데를 따라, 바위 겉을 따라
    var mid = T.L(CRK).map(function (a, i) { var b = T.R(CRK)[i]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; });
    var rk = seg(p, 0.06, 0.7), rw = 3 + 9 * seg(p, 0.1, 0.95);
    A.root(c, A.partial(mid, rk), rw, 1.2);
    A.root(c, A.partial(T.L(SIDE.L), seg(p, 0.15, 0.75)), rw * 0.8, 1);
    A.root(c, A.partial(T.R(SIDE.R), seg(p, 0.15, 0.75)), rw * 0.8, 1);
    var tS = seg(p, 0.02, 0.8), top = mid[0];
    A.tree(c, top[0], top[1] + 2, tS, t, { h: 66, w: 8 + 9 * tS, r: 46, seed: 12 });
    if (tS > 0.02 && tS < 0.2) { c.fillStyle = '#6aa443'; c.beginPath(); c.ellipse(top[0] - 6, top[1] - 8, 7, 3, -0.5, 0, 6.283); c.ellipse(top[0] + 6, top[1] - 8, 7, 3, 0.5, 0, 6.283); c.fill(); }
    rubble(c, seg(p, 0.92, 1), 31, 330, 520);
    // 뿌리가 미는 화살표
    var push = seg(p, 0.35, 0.45) * (1 - seg(p, 0.85, 0.92));
    if (push > 0.02) { c.save(); c.globalAlpha = push; var mR = T.R([[318, 205]])[0], mL = T.L([[318, 205]])[0]; A.arrow(c, mL[0] - 8, mL[1], mL[0] - 54, mL[1] + 4, '#f07b2a', 6); A.arrow(c, mR[0] + 8, mR[1], mR[0] + 54, mR[1] - 4, '#f07b2a', 6); c.restore(); }
    if (o.labels !== false) {
      var lab = p < 0.12 ? '틈에 식물의 씨앗이 자리 잡아요' : p < 0.4 ? '뿌리가 틈을 파고들어요' : p < 0.88 ? '뿌리가 굵어지며 틈을 넓혀요' : '틈이 커져 암석이 부서졌어요';
      A.pill(c, lab, 24, 392, { align: 'left', size: 21 });
      if (mossK > 0.45) A.pill(c, '이끼: 암석의 성분이 변해요', 616, 34, { align: 'right', size: 17, bg: '#eef7e2', fg: '#3a6418', stroke: '#b7d98f' });
      if (rk > 0.4) A.pill(c, '뿌리', 352, 300, { size: 17, bg: '#fbf1e4', fg: '#6a4520', stroke: '#e0c39a' });
    }
  }

  /* ---------- ③ 압력: 덮고 있던 땅이 깎여 드러나면 겉 부분이 얇게 벗겨져요 ---------- */
  var DC = [320, 470], RX = 250, RY = 270, TH = 17;
  function ell(th, rx, ry) { return [DC[0] + rx * Math.sin(th), DC[1] - ry * Math.cos(th)]; }
  function sector(a, b, rx, ry, th) { var P = [], n = 14, i; for (i = 0; i <= n; i++) P.push(ell(lerp(a, b, i / n), rx, ry)); for (i = n; i >= 0; i--) P.push(ell(lerp(a, b, i / n), rx - th, ry - th)); return P; }
  var SHEETS = [[-0.9, -0.34, 0.6, 0.78], [0.34, 0.9, 0.64, 0.82], [-0.34, 0.02, 0.76, 0.93], [0.02, 0.34, 0.79, 0.96]];
  function press(c, W, H, t, p, o) {
    var cov = seg(p, 0, 0.55), coverTop = lerp(52, 300, cov), surf = 300;
    bg(c, W, H, '#a9d4ef', '#e8f3f6'); A.fit(c, W, H, W0, H0, true);
    hills(c, false);
    // 덮고 있던 땅 (층): 단면이라 암석 둘레만 보여요
    c.save(); c.beginPath(); c.rect(-200, coverTop, W0 + 400, H0 - coverTop + 80); c.fillStyle = A.pat(c, 'strata'); c.fill();
    var cg = c.createLinearGradient(0, coverTop, 0, H0); cg.addColorStop(0, 'rgba(255,255,255,.12)'); cg.addColorStop(1, 'rgba(40,24,10,.35)'); c.fillStyle = cg; c.fill();
    c.strokeStyle = 'rgba(70,50,30,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-200, coverTop); c.lineTo(W0 + 200, coverTop); c.stroke();
    c.restore();
    A.grass(c, -40, W0 + 40, coverTop + 2, t, { h: 12, gap: 7, seed: 8 });
    // 화강암 몸체 (속)
    c.save(); c.beginPath(); for (var i = 0; i <= 40; i++) { var q = ell(lerp(-1.3, 1.3, i / 40), RX - TH, RY - TH); if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); } c.closePath();
    c.fillStyle = A.pat(c, 'granite'); c.fill(); c.clip(); var dg = c.createRadialGradient(260, 220, 30, 320, 330, 280); dg.addColorStop(0, 'rgba(255,255,255,.22)'); dg.addColorStop(1, 'rgba(30,20,10,.3)'); c.fillStyle = dg; c.fillRect(0, 150, W0, 330); c.restore();
    // 겉 부분 (판): 드러난 뒤 하나씩 금이 가고, 바깥쪽으로 기울며 미끄러져 떨어져요
    SHEETS.forEach(function (S) {
      var P = sector(S[0], S[1], RX, RY, TH), crackK = seg(p, S[2] - 0.06, S[2]), k = seg(p, S[2], S[3]);
      var side = (S[0] + S[1]) / 2 < 0 ? -1 : 1, low = side < 0 ? ell(S[0], RX, RY) : ell(S[1], RX, RY);
      c.save();
      if (k > 0) { // 먼저 바깥으로 들뜨고, 다음에 미끄러져 떨어지며 부서져요
        var k1 = seg(k, 0, 0.5), k2 = seg(k, 0.5, 1), top = Math.abs((S[0] + S[1]) / 2) < 0.5, mid = ell((S[0] + S[1]) / 2, RX, RY), nx = (mid[0] - DC[0]) / RX, ny = (mid[1] - DC[1]) / RY, nl = Math.hypot(nx, ny);
        c.translate(nx / nl * 9 * k1, ny / nl * 9 * k1);
        c.translate(side * (top ? 150 : 60) * k2 * k2, (top ? 80 : 70) * k2 * k2);
        c.translate(low[0], low[1]); c.rotate(side * (0.12 * k1 + 0.4 * k2)); c.translate(-low[0], -low[1]);
        c.globalAlpha = 1 - k2;
      }
      A.rock(c, P, 'granite', { lw: 1.6, blur: 8, sy: 3, hi: 0.32 });
      c.restore();
      if (crackK > 0 && k < 0.02) { var arc = []; for (var j = 0; j <= 12; j++) arc.push(ell(lerp(S[0], S[1], j / 12), RX - TH + 1, RY - TH + 1)); A.crack(c, A.partial(arc, crackK), 2.2); }
    });
    // 떨어진 조각이 둘레 땅 위에 쌓여요
    SHEETS.forEach(function (S, i) { var kk = seg(p, lerp(S[2], S[3], 0.6), S[3]); if (kk <= 0) return; var side = (S[0] + S[1]) / 2 < 0 ? -1 : 1, r = A.rng(90 + i);
      for (var q = 0; q < 4; q++) { var x = DC[0] + side * (250 + q * 16 + i * 10 + r() * 8), s2 = 7 + r() * 9, y = lerp(250, 300 - s2 * 0.5, Math.min(1, kk * 1.3 - q * 0.08)); if (kk * 1.3 - q * 0.08 <= 0) continue; A.rock(c, A.blob(x, y, s2 * 1.3, s2 * 0.7, 7, 40 + i * 9 + q, 0.5), 'granite', { lw: 1.2, blur: 5, sy: 2 }); } });
    // 안쪽 겉 부분에도 다시 금이 가요
    var c2 = seg(p, 0.93, 1); if (c2 > 0) { var arc2 = []; for (var j2 = 0; j2 <= 16; j2++) arc2.push(ell(lerp(-0.8, 0.8, j2 / 16), RX - TH * 2, RY - TH * 2)); A.crack(c, A.partial(arc2, c2), 2); }
    void surf;
    // 누르던 압력 (덮개가 두꺼울수록 큰 화살표)
    var thick = clamp((200 - coverTop) / 148, 0, 1);
    if (thick > 0.03) { c.save(); c.globalAlpha = Math.min(1, thick * 2.5); for (var a = -1; a <= 1; a++) { var x = 320 + a * 110, L = 18 + 50 * thick; A.arrow(c, x, coverTop + 10, x, coverTop + 10 + L, '#3c5a9a', 7); } c.restore(); }
    // 드러난 뒤: 압력이 약해져 겉 부분이 바깥으로
    var exp = seg(p, 0.42, 0.52) * (1 - seg(p, 0.92, 1));
    if (exp > 0.02) { c.save(); c.globalAlpha = exp; [-0.55, 0, 0.55].forEach(function (th) { var a0 = ell(th, RX + 6, RY + 6), a1 = ell(th, RX + 38, RY + 38); A.arrow(c, a0[0], a0[1], a1[0], a1[1], '#f07b2a', 5); }); c.restore(); }
    if (o.labels !== false) {
      var lab = cov < 0.55 ? '땅속: 위의 땅이 암석을 눌러요' : cov < 0.98 ? '위의 땅이 깎여 암석이 드러나요' : p < 0.6 ? '누르던 압력이 약해져요' : p < 0.95 ? '겉 부분이 얇게 벗겨져 떨어져요' : '안쪽 겉 부분도 다시 벗겨져요';
      A.pill(c, lab, 24, 34, { align: 'left', size: 21 });
      if (coverTop < 180) A.pill(c, '덮고 있던 땅', 545, coverTop + 34, { size: 16 });
      A.pill(c, '화강암', 320, 392, { size: 16, bg: 'rgba(255,255,255,.85)' });
    }
  }

  /* ---------- ④ 이산화 탄소 + 물: 석회암을 녹여 석회 동굴을 만들어요 ---------- */
  var CAVE = A.blob(0, 0, 1, 1, 22, 77, 0.32);
  var JOINT = [[[208, 122], [214, 170], [206, 215], [220, 262]], [[402, 122], [396, 175], [410, 222], [404, 262]], [[300, 122], [306, 170], [298, 214]]];
  function co2(c, W, H, t, p, o) {
    bg(c, W, H, '#a9cde6', '#dfe9ee'); A.fit(c, W, H, W0, H0, true);
    var g = seg(p, 0.04, 0.95), cx = 320, cy = 302, rx = 205 * g, ry = 82 * g;
    // 구름·비
    c.save(); [[110, 36, 46], [160, 30, 52], [210, 40, 40], [450, 44, 40], [500, 36, 50], [548, 46, 36]].forEach(function (q) { var gr = c.createRadialGradient(q[0], q[1] - 10, 4, q[0], q[1], q[2]); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#9fb1c2'); c.fillStyle = gr; c.beginPath(); c.arc(q[0], q[1], q[2] * 0.62, 0, 6.283); c.fill(); }); c.restore();
    if (!A.REDUCE) { c.strokeStyle = 'rgba(60,120,190,.55)'; c.lineWidth = 2; for (var d = 0; d < 30; d++) { var dx = 80 + ((d * 71) % 500), dy = 56 + ((t * 300 + d * 41) % 50); c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx - 3, dy + 10); c.stroke(); } }
    // 이산화 탄소 알갱이 (작은 거품)
    c.save(); for (var b = 0; b < 12; b++) { var bx = 90 + ((b * 113) % 470), by = 64 + ((t * 30 + b * 13) % 40); c.strokeStyle = 'rgba(255,255,255,.9)'; c.fillStyle = 'rgba(200,230,255,.5)'; c.lineWidth = 1.4; c.beginPath(); c.arc(bx, by, 3.2, 0, 6.283); c.fill(); c.stroke(); } c.restore();
    // 흙과 풀
    c.fillStyle = A.pat(c, 'humus'); c.fillRect(-200, 100, W0 + 400, 26); var sg = c.createLinearGradient(0, 100, 0, 126); sg.addColorStop(0, 'rgba(255,255,255,.08)'); sg.addColorStop(1, 'rgba(0,0,0,.25)'); c.fillStyle = sg; c.fillRect(-200, 100, W0 + 400, 26);
    A.grass(c, -40, W0 + 40, 102, t, { h: 12, gap: 6, seed: 4 });
    // 석회암
    c.fillStyle = A.pat(c, 'lime'); c.fillRect(-200, 124, W0 + 400, H0 + 80); var lg = c.createLinearGradient(0, 124, 0, H0); lg.addColorStop(0, 'rgba(255,255,255,.1)'); lg.addColorStop(1, 'rgba(90,70,40,.35)'); c.fillStyle = lg; c.fillRect(-200, 124, W0 + 400, H0 + 80);
    // 틈(절리)과 스며드는 물
    JOINT.forEach(function (J) { A.crack(c, J, 2); });
    c.save(); c.setLineDash([6, 14]); c.lineDashOffset = A.REDUCE ? 0 : -t * 40; c.strokeStyle = 'rgba(70,150,230,.9)'; c.lineWidth = 3; c.lineCap = 'round';
    JOINT.forEach(function (J) { c.beginPath(); J.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.stroke(); }); c.restore();
    // 동굴
    if (g > 0.01) {
      var P = CAVE.map(function (q) { return [cx + q[0] * rx, cy + q[1] * ry]; });
      c.save(); A.smoothPath(c, P); c.shadowColor = 'rgba(60,30,10,.5)'; c.shadowBlur = 16;
      var cg = c.createRadialGradient(cx, cy - ry * 0.2, 6, cx, cy, rx); cg.addColorStop(0, '#a8541e'); cg.addColorStop(0.55, '#6a2f12'); cg.addColorStop(1, '#2a1208'); c.fillStyle = cg; c.fill(); c.shadowColor = 'transparent'; c.clip();
      // 동굴 벽의 녹은 무늬
      c.strokeStyle = 'rgba(255,190,120,.18)'; c.lineWidth = 2; for (var w = 0; w < 8; w++) { c.beginPath(); c.ellipse(cx, cy + 10, rx * (0.4 + w * 0.08), ry * (0.4 + w * 0.08), 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
      // 천장에 매달린 돌, 바닥의 물
      var st = seg(p, 0.45, 1);
      if (st > 0) { var r = A.rng(5); for (var s = 0; s < 11; s++) { var x = cx - rx * 0.8 + (s / 10) * rx * 1.6 + (r() - 0.5) * 10, yTop = cy - ry * Math.sqrt(Math.max(0, 1 - Math.pow((x - cx) / rx, 2))) * 0.95 - 2, L = (10 + r() * 26) * st; var sgd = c.createLinearGradient(x - 5, 0, x + 5, 0); sgd.addColorStop(0, '#f0d2a0'); sgd.addColorStop(1, '#b07a40'); c.fillStyle = sgd; c.beginPath(); c.moveTo(x - 5 - r() * 3, yTop - 4); c.lineTo(x + 5 + r() * 3, yTop - 4); c.lineTo(x, yTop + L); c.closePath(); c.fill();
        if (!A.REDUCE && s % 3 === 0) { var ph = (t * 0.7 + s * 0.31) % 1, dyy = yTop + L + ph * ph * (ry * 1.2); c.fillStyle = 'rgba(160,210,250,.9)'; c.beginPath(); c.arc(x, dyy, 2.6, 0, 6.283); c.fill(); } } }
      var pw = c.createLinearGradient(0, cy + ry * 0.6, 0, cy + ry); pw.addColorStop(0, 'rgba(90,170,230,.85)'); pw.addColorStop(1, 'rgba(30,90,150,.9)'); c.fillStyle = pw; c.beginPath(); c.ellipse(cx, cy + ry * 0.92, rx * 0.7, ry * 0.22, 0, 0, 6.283); c.fill();
      c.restore();
      c.save(); A.smoothPath(c, P); c.lineWidth = 2.4; c.strokeStyle = 'rgba(70,40,20,.75)'; c.stroke(); c.restore();
    }
    if (o.labels !== false) {
      var lab = p < 0.1 ? '이산화 탄소가 녹은 빗물이 내려요' : p < 0.45 ? '틈으로 스며든 물이 석회암을 녹여요' : p < 0.9 ? '녹은 자리가 점점 넓어져요' : '석회 동굴이 만들어졌어요';
      A.pill(c, lab, 24, 34, { align: 'left', size: 21 });
      A.pill(c, '이산화 탄소', 560, 92, { size: 16, bg: '#eef6ff', fg: '#1d4f80', stroke: '#b8d6f2' });
      A.pill(c, '석회암', 80, 392, { size: 16 });
      if (g > 0.55) A.pill(c, '석회 동굴', cx, cy - 4, { size: 18, bg: 'rgba(255,240,220,.92)', fg: '#6a3410' });
    }
  }

  var KIND = { ice: ice, bio: bio, press: press, co2: co2 };
  function draw(kind, ctx, W, H, t, p, o) { ctx.save(); KIND[kind](ctx, W, H, t, clamp(p, 0, 1), o || {}); ctx.restore(); }
  return { draw: draw, W: W0, H: H0 };
})();
