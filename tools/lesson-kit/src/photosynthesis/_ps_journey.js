/* ===== 잎 속 광합성 여행: 해바라기 → 잎 → 식물세포 → 엽록체 (그림 Ⅴ-2 형식) =====
   같은 재료 상태(빛, 이산화 탄소, 물)가 네 단계 모두에 이어진다. 입자 수와 빠르기는 보기 좋게 정한 모형. */
(() => {
  'use strict';
  const { el, grad, leafData, drawLeaf, PAL, taper, flock, tween, loop, mk, lerp, stage, clamp } = PS;

  /* 빛 알갱이 모양(작은 노란 점) */
  function lightDefs() {
    const d = PS.defs(); if (d.querySelector('#mLit')) return;
    const f = grad([[0, '#fff8c9'], [.55, '#ffe066'], [1, '#ffcf3a', 0]], { r: 1, rr: .5 });
    const g = el('g', { id: 'mLit' }, d); el('circle', { r: 11, fill: f }, g); el('circle', { r: 4, fill: '#fff6bf' }, g);
  }
  const wig = (a, b, n = 6, amp = 14, R = Math.random) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n; out.push([lerp(a[0], b[0], t) + (i && i < n ? (R() - .5) * amp : 0), lerp(a[1], b[1], t) + (i && i < n ? (R() - .5) * amp : 0)]); } return out; };

  /* --- 단계 0: 식물 전체 --- */
  function plantLevel(ST, parent) {
    const g = el('g', null, parent), R = mk(21), GY = 610;
    el('rect', { x: -700, y: -800, width: 2400, height: 800 + GY, fill: grad([[0, '#9fd3f2'], [.62, '#cfeaf8'], [1, '#f1fafc']]) }, g);
    [[770, 110, 88, 28], [840, 90, 66, 32], [710, 120, 58, 20], [250, 300, 60, 18], [205, 312, 46, 14], [930, 260, 72, 20], [-60, 180, 90, 26]].forEach(([x, y, a, b]) => el('ellipse', { cx: x, cy: y, rx: a, ry: b, fill: '#fff', opacity: .82 }, g));
    el('path', { d: `M-700 ${GY}V540C-200 500 60 560 300 548S760 500 1000 545 1500 520 1700 560V${GY}Z`, fill: '#a9d58a' }, g);
    el('path', { d: `M-700 ${GY}V575C-100 545 200 590 520 572S1100 560 1700 585V${GY}Z`, fill: '#8cc56a' }, g);
    /* 흙 */
    el('rect', { x: -700, y: GY, width: 2400, height: 900, fill: grad([[0, '#8a5a34'], [.18, '#7a4d2b'], [1, '#54331c']]) }, g);
    el('path', { d: `M-700 ${GY}H1700V${GY + 7}C1200 ${GY + 15} 800 ${GY + 3} 400 ${GY + 11}S-300 ${GY + 4} -700 ${GY + 12}Z`, fill: '#5d8f3c' }, g);
    for (let i = 0; i < 150; i++) el('ellipse', { cx: -200 + R() * 1400, cy: GY + 18 + R() * 300, rx: 1.5 + R() * 6, ry: 1 + R() * 3.4, fill: R() < .5 ? '#a0754a' : '#3f2613', opacity: .25 + R() * .4 }, g);
    /* 풀 */
    const grass = el('g', { stroke: '#4c8a35', 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round' }, g);
    for (let i = 0; i < 120; i++) { const x = -120 + R() * 1240, h = 8 + R() * 16; el('path', { d: `M${x} ${GY + 3}q${(R() - .5) * 8} ${-h * .6} ${(R() - .5) * 14} ${-h}` }, grass); }
    /* 해 */
    const sun = el('g', null, g), SX = 130, SY = 105;
    el('circle', { cx: SX, cy: SY, r: 120, fill: grad([[0, '#fff3b0', .9], [.5, '#ffe27a', .35], [1, '#ffe27a', 0]], { r: 1, rr: .5 }) }, sun);
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; el('line', { x1: SX + 56 * Math.cos(a), y1: SY + 56 * Math.sin(a), x2: SX + (i % 2 ? 76 : 88) * Math.cos(a), y2: SY + (i % 2 ? 76 : 88) * Math.sin(a), stroke: '#f6b92c', 'stroke-width': 4, 'stroke-linecap': 'round' }, sun); }
    el('circle', { cx: SX, cy: SY, r: 48, fill: grad([[0, '#ffe680'], [1, '#f7b21f']]) , stroke: '#ea9c12', 'stroke-width': 1 }, sun);
    /* 빛줄기 */
    const beam = el('path', { d: `M${SX + 30} ${SY - 10}L700 262L610 430L${SX + 2} ${SY + 40}Z`, fill: grad([[0, '#fff0a0', .5], [1, '#fff0a0', .1]], { x2: 1, y2: .5 }) }, g);
    /* 뿌리 */
    const root = el('g', null, g), RX = 482, RY = GY - 2;
    const rootsP = [[[RX, RY], [478, 665], [486, 725], [472, 800]], [[RX, RY + 6], [425, 640], [375, 672], [318, 735]], [[RX, RY + 6], [545, 645], [604, 672], [668, 745]], [[478, 665], [430, 705], [398, 775]], [[484, 690], [535, 730], [566, 795]], [[420, 645], [360, 648], [300, 668]], [[550, 648], [612, 650], [672, 680]]];
    rootsP.forEach((p, i) => {
      const dense = []; for (let k = 0; k < p.length - 1; k++) for (let t = 0; t < 1; t += .34) dense.push([lerp(p[k][0], p[k + 1][0], t), lerp(p[k][1], p[k + 1][1], t)]); dense.push(p[p.length - 1]);
      el('path', { d: taper(dense, i < 1 ? 15 : i < 3 ? 10 : 6, 1.4), fill: grad([[0, '#f1e0b6'], [1, '#cfae7b']], { x2: 1, y2: 0 }), stroke: '#8d6c3e', 'stroke-width': .7 }, root);
      for (let t = .2; t < .98; t += .16) { const q = PS.polyAt(p, t), a = R() * 6.28, n = 16 + R() * 22; el('path', { d: `M${q[0]} ${q[1]}q${Math.cos(a) * n * .5} ${Math.sin(a) * n * .5 + 5} ${Math.cos(a) * n} ${Math.sin(a) * n + 8}`, stroke: '#d9c08d', 'stroke-width': 1.2, fill: 'none', 'stroke-linecap': 'round' }, root); }
    });
    /* 줄기 */
    const stemP = [[RX, GY + 4], [476, 540], [487, 435], [479, 320], [470, 205]];
    const denseS = []; for (let k = 0; k < stemP.length - 1; k++) for (let t = 0; t < 1; t += .2) denseS.push([lerp(stemP[k][0], stemP[k + 1][0], t), lerp(stemP[k][1], stemP[k + 1][1], t)]); denseS.push(stemP[4]);
    /* 잎 */
    const LD = leafData({ L: 240, W: 86, p: .6, q: .92, seed: 3, bend: .05, nA: 110, sec: 6, vw: 3.4, teeth: .035, nt: 24 });
    const LB = leafData({ L: 230, W: 80, p: .62, q: .9, seed: 8, bend: -.05, nA: 110, sec: 6, vw: 3.4, teeth: .03, nt: 24 });
    const back = el('g', null, g), front = el('g', null, g);
    [[479, 300, 196, .62, LB], [472, 245, -28, .52, LD], [480, 510, 178, .9, LB]].forEach(([x, y, r, s, d]) => drawLeaf(back, d, PAL.sunBack, { tf: `translate(${x} ${y}) rotate(${r}) scale(${s})`, pet: 26, edge: 1 }));
    el('path', { d: taper(denseS, 23, 10), fill: grad([[0, '#6db24b'], [.45, '#4b9636'], [1, '#2f7227']], { x2: 1, y2: 0 }), stroke: '#2a6423', 'stroke-width': .8 }, front);
    [[482, 460, 14, .86, LD], [484, 395, -16, 1.08, LD], [480, 385, 200, .92, LB], [478, 290, 12, .6, LB]].forEach(([x, y, r, s, d], i) => drawLeaf(front, d, i === 1 ? PAL.sun : PAL.sunBack, { tf: `translate(${x} ${y}) rotate(${r}) scale(${s})`, pet: 26, edge: 1 }));
    /* 꽃 */
    const fl = el('g', { transform: 'translate(466 142) rotate(-14) scale(1 .94)' }, front);
    const pet = (len, wid, fill) => `M0 -36C${-wid} ${-36 - len * .35} ${-wid * .7} ${-36 - len * .85} 0 ${-36 - len}C${wid * .7} ${-36 - len * .85} ${wid} ${-36 - len * .35} 0 -36Z`;
    const pf1 = grad([[0, '#ffc81f'], [1, '#f49d0f']], { y1: 1, y2: 0 }), pf2 = grad([[0, '#ffe04a'], [1, '#f8ac12']], { y1: 1, y2: 0 });
    for (let i = 0; i < 21; i++) el('path', { d: pet(66, 15), fill: pf1, stroke: '#cf7d08', 'stroke-width': .7, transform: `rotate(${i * 360 / 21 + 8})` }, fl);
    for (let i = 0; i < 21; i++) el('path', { d: pet(56, 13), fill: pf2, stroke: '#d88a0c', 'stroke-width': .7, transform: `rotate(${i * 360 / 21})` }, fl);
    el('circle', { r: 46, fill: grad([[0, '#3c2410'], [.7, '#5a3514'], [1, '#7a4a1a']], { r: 1, rr: .5 }) }, fl);
    for (let n = 1; n < 300; n++) { const r = 2.55 * Math.sqrt(n), a = n * 2.39996; if (r > 45) break; el('circle', { cx: PS.f1(r * Math.cos(a)), cy: PS.f1(r * Math.sin(a)), r: 1.2 + r / 40, fill: r > 30 ? '#d8982c' : r > 16 ? '#8f5a1e' : '#6a4518' }, fl); }
    /* 확대 표시 */
    const ring = el('circle', { cx: 626, cy: 330, r: 30, fill: 'rgba(255,255,255,.01)', stroke: '#fff', 'stroke-width': 3.5, class: 'tap' }, g);
    const dim = el('rect', { x: -700, y: -800, width: 2400, height: 1900, fill: '#102434', opacity: 0, style: 'transition:opacity .6s;pointer-events:none' }, g);
    const fx = flock(g);
    const waterRoute = (p) => { const s = []; for (let i = p.length - 1; i >= 0; i--) s.push(p[i]); if (p[0][0] !== RX) s.push([RX, GY]); s.push(...[[478, 540], [486, 440], [486, 395], [540, 378], [626, 345]]); return s; };
    const roots = [rootsP[1], rootsP[2], rootsP[3], rootsP[4], rootsP[5], rootsP[6]];
    const labs = { lit: ST.label(130, 105, '빛에너지', 'big'), co2: ST.label(872, 405, '이산화 탄소', 'bg'), o2: ST.label(860, 200, '산소', 'bg'), h2o: ST.label(238, 690, '물', 'bg') };
    let tc = 0, tw = 0, to = 0;
    return {
      g, ring, labs, focus: [626, 330], extra: [ST.label(626, 280, '여기를 눌러 확대', 'bg')],
      apply(s) { beam.style.opacity = s.light ? 1 : 0; beam.style.transition = 'opacity .6s'; sun.style.opacity = s.light ? 1 : .4; sun.style.transition = 'opacity .6s'; dim.setAttribute('opacity', s.light ? 0 : .3); },
      tick(dt, s, run) {
        fx.step(dt); tc -= dt; tw -= dt; to -= dt;
        if (s.co2 && tc <= 0) { tc = .85; const y = 330 + Math.random() * 160; fx.add('mCO2', [[1060, y], [840, y - 20], [640, 338]], { dur: 3.2, s: .62, wob: 10, fo: .08 }); }
        if (s.water && tw <= 0) { tw = .6; fx.add('mH2O', waterRoute(roots[Math.floor(Math.random() * roots.length)]), { dur: 5.2, s: .5, fi: .05, fo: .03, spin: 90 }); }
        if (run && to <= 0) { to = .9; const y = 80 + Math.random() * 180; fx.add('mO2', [[625, 320], [760, 230], [1060, y]], { dur: 3.4, s: .62, wob: 12, fi: .1 }); }
      },
      leave() { fx.clear(); },
    };
  }

  /* --- 단계 1: 잎 + 기공 돋보기 --- */
  function leafLevel(ST, parent) {
    const g = el('g', null, parent), R = mk(44);
    el('rect', { x: -700, y: -800, width: 2400, height: 1900, fill: grad([[0, '#bfe3f4'], [.55, '#dff2ee'], [1, '#c5e4ad']]) }, g);
    const beams = el('g', null, g);
    [[-40, 240], [150, 110], [340, 40]].forEach(([x, w]) => el('path', { d: `M${x} -60L${x + w} -60L${x + w + 330} 480L${x + 240} 520Z`, fill: grad([[0, '#fff3b0', .55], [1, '#fff3b0', .04]]) }, beams));
    const D = leafData({ L: 880, W: 285, p: .6, q: .92, seed: 11, bend: .03, nA: 620, D: 15, di: 62, vw: 15, sec: 10, teeth: .018, nt: 34, n: 170 });
    const tfm = 'translate(58 400) rotate(-9)';
    el('ellipse', { cx: 500, cy: 650, rx: 420, ry: 56, fill: grad([[0, '#3d6b2d', .3], [1, '#3d6b2d', 0]], { r: 1, rr: .5 }) }, g);
    drawLeaf(g, D, PAL.sun, { tf: tfm, pet: 110, petW: 17, petY: 14, edge: 1.6, shade: .12, veinOp: .95 });
    /* 잎 속으로 흐르는 물 */
    const lf = el('g', { transform: tfm }, g), fxW = flock(lf);
    const ring = el('circle', { cx: 400, cy: 256, r: 34, fill: 'rgba(255,255,255,.01)', stroke: '#fff', 'stroke-width': 3.5, class: 'tap' }, g);
    /* 기공 돋보기 */
    const LX = 760, LY = 590, LR = 158, cid = PS.nid('c');
    el('path', { d: `M650 465L${LX - 74} ${LY - 140}M640 500`, stroke: '#14263b', 'stroke-width': 1 }, g);
    el('circle', { cx: 660, cy: 452, r: 12, fill: 'none', stroke: '#14263b', 'stroke-width': 1.6 }, g);
    el('circle', { cx: LX, cy: LY + 6, r: LR + 6, fill: '#1f3a1f', opacity: .16 }, g);
    const clip = el('clipPath', { id: cid }, g); el('circle', { cx: LX, cy: LY, r: LR }, clip);
    const lens = el('g', { 'clip-path': `url(#${cid})` }, g);
    el('rect', { x: LX - LR, y: LY - LR, width: LR * 2, height: LR * 2, fill: '#b7dd8b' }, lens);
    const cellsG = el('g', { fill: 'none', stroke: '#79ad50', 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, lens);
    for (let i = -3; i <= 3; i++) { el('path', { d: 'M' + wig([LX - LR, LY + i * 58], [LX + LR, LY + i * 58 + 8], 9, 26, R).map((p) => p.join(' ')).join('L') }, cellsG); }
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const x = LX + j * 66 + (i % 2 ? 33 : 0), y = LY + i * 58; if (Math.hypot(x - LX, y - LY) < 62) continue; el('path', { d: 'M' + wig([x, y - 6], [x + 5, y + 58], 4, 16, R).map((p) => p.join(' ')).join('L') }, cellsG); }
    const stoma = el('g', { transform: `translate(${LX} ${LY}) rotate(24)` }, lens);
    el('ellipse', { cx: 0, cy: 0, rx: 60, ry: 72, fill: '#a3cf78' }, stoma);
    const guard = (side) => {
      const s = side, gg = el('g', null, stoma);
      el('path', { d: `M0 -66C${s * 40} -66 ${s * 52} -30 ${s * 52} 0S${s * 40} 66 0 66C${s * 12} 44 ${s * 15} 18 ${s * 15} 0S${s * 12} -44 0 -66Z`, fill: grad([[0, '#6db94c'], [1, '#3f9334']], { x2: 1, y2: 0 }), stroke: '#2a6a26', 'stroke-width': 2 }, gg);
      [[-40, 26], [-18, 34], [6, 36], [28, 30], [44, 20]].forEach(([y, x]) => el('ellipse', { cx: s * x, cy: y, rx: 6.5, ry: 4.4, fill: '#1f7a31', stroke: '#14551f', 'stroke-width': .8 }, gg));
    };
    el('ellipse', { cx: 0, cy: 0, rx: 15, ry: 50, fill: grad([[0, '#1b2a1b'], [1, '#3a4a30']], { r: 1, rr: .55 }) }, stoma);
    guard(1); guard(-1);
    const fx = flock(lens);
    el('circle', { cx: LX, cy: LY, r: LR, fill: 'none', stroke: '#14263b', 'stroke-width': 2.2 }, g);
    const dim = el('rect', { x: -700, y: -800, width: 2400, height: 1900, fill: '#102434', opacity: 0, style: 'transition:opacity .6s;pointer-events:none' }, g);
    const labs = { lit: ST.label(150, 40, '빛에너지', 'bg'), co2: ST.label(LX + 62, LY - 188, '이산화 탄소', 'bg'), o2: ST.label(LX - 150, LY + 150, '산소', 'bg'), h2o: ST.label(120, 470, '물', 'bg') };
    const nm = ST.label(LX, LY + LR + 22, '기공', 'bg big');
    const midPts = [[-110, 14], [0, 0], [120, .03 * 120 * 120 / 880], [300, 3], [350, -60], [385, -115], [410, -150]];
    const midPts2 = [[-110, 14], [0, 0], [200, 1.4], [440, 6.6], [560, 8], [620, 80], [660, 130]];
    let tc = 0, tw = 0, to = 0;
    return {
      g, ring, labs, focus: [400, 256], extra: [nm],
      apply(s) { beams.style.opacity = s.light ? 1 : 0; beams.style.transition = 'opacity .6s'; dim.setAttribute('opacity', s.light ? 0 : .22); },
      tick(dt, s, run) {
        fx.step(dt); fxW.step(dt); tc -= dt; tw -= dt; to -= dt;
        if (s.co2 && tc <= 0) { tc = .95; const a = -.9 + Math.random() * .9; fx.add('mCO2', [[LX + 180 * Math.cos(a), LY + 180 * Math.sin(a)], [LX + 40, LY - 8], [LX, LY]], { dur: 2.4, s: 1.05, wob: 7, fo: .1 }); }
        if (s.water && tw <= 0) { tw = .55; fxW.add('mH2O', Math.random() < .5 ? midPts : midPts2, { dur: 3.4, s: .9, fi: .05, fo: .1, spin: 70 }); }
        if (run && to <= 0) { to = 1.1; const a = 2.1 + Math.random() * 1; fx.add('mO2', [[LX, LY], [LX - 30, LY + 14], [LX + 190 * Math.cos(a), LY + 190 * Math.sin(a)]], { dur: 2.4, s: 1.05, wob: 7, fi: .15 }); }
      },
      leave() { fx.clear(); fxW.clear(); },
    };
  }

  /* --- 단계 2: 식물세포 (SwissBioPics 그림에 색을 입힘) --- */
  function cellLevel(ST, parent) {
    const g = el('g', null, parent), SC = 1.14, TX = -110, TY = -66, R = mk(5);
    el('rect', { x: -700, y: -800, width: 2400, height: 1900, fill: '#79ad54' }, g);
    /* 이웃 세포 */
    const nb = el('g', { fill: '#b5d993', stroke: '#568f3a', 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
    ['M-700 -800H130L40 200-700 260Z', 'M170 -800H1700V-30L860 -36Z', 'M920 10L1700 40V640L1020 620Z', 'M60 250-700 300V1100H110L40 760Z', 'M100 800V1100H1000L1040 720Z', 'M1080 690H1700V1100H1060Z'].forEach((d) => el('path', { d }, nb));
    const cellG = el('g', { transform: `translate(${TX} ${TY}) scale(${SC})` }, g);
    cellG.innerHTML = window.PS_CELL || '';
    const oo = cellG.querySelector('[data-o="SL0086"]'); if (oo) oo.remove();
    const oa = cellG.querySelector('[data-o="SL0019"]'); if (oa) oa.remove();
    const inner = el('path', { d: 'M226 330C270 280 370 190 450 170 540 166 700 195 806 240 835 262 848 400 848 480 848 560 846 600 830 622 760 650 640 668 575 668 480 666 340 650 262 628 236 612 225 560 218 480 214 420 216 370 226 330Z', fill: '#e8f4d4' });
    cellG.insertBefore(inner, cellG.firstChild);
    const C = [[367, 280], [298, 567], [643, 602], [472, 592], [802, 580], [772, 272]].map(([x, y]) => [x * SC + TX, y * SC + TY]);
    const litG = el('g', { style: 'transition:opacity .6s;pointer-events:none' }, g);
    [[-60, 200], [190, 130], [400, 170], [640, 110]].forEach(([x, w]) => el('path', { d: `M${x} -80L${x + w} -80L${x + w + 330} 800L${x + 300} 800Z`, fill: grad([[0, '#fff3b0', .26], [1, '#fff3b0', .02]]) }, litG));
    const ring = el('circle', { cx: C[0][0], cy: C[0][1], r: 66, fill: 'rgba(255,255,255,.01)', stroke: '#fff', 'stroke-width': 3.5, class: 'tap' }, g);
    const dim = el('rect', { x: -700, y: -800, width: 2400, height: 1900, fill: '#102434', opacity: 0, style: 'transition:opacity .6s;pointer-events:none' }, g);
    const fx = flock(g);
    const labs = { lit: ST.label(90, 30, '빛에너지', 'bg'), co2: ST.label(890, 60, '이산화 탄소', 'bg'), o2: ST.label(690, 40, '산소', 'bg'), h2o: ST.label(70, 720, '물', 'bg') };
    const nm = ST.label(C[0][0] + 12, C[0][1] - 88, '엽록체', 'bg big');
    const cn = ST.label(500, 742, '식물세포', 'bg big');
    let tc = 0, tw = 0, to = 0, tl = 0;
    return {
      g, ring, labs, focus: C[0], extra: [nm, cn],
      apply(s) { litG.style.opacity = s.light ? 1 : 0; dim.setAttribute('opacity', s.light ? 0 : .22); },
      tick(dt, s, run) {
        fx.step(dt); tc -= dt; tw -= dt; to -= dt; tl -= dt; if (s.light && tl <= 0) { tl = .3; const p = C[Math.floor(R() * C.length)], x = p[0] - 240 - R() * 120; fx.add('mLit', [[x, -40], p], { dur: 1, s: .9, spin: 0, fi: .05, fo: .12, ez: (u) => u }); }
        const pick = () => C[Math.floor(R() * C.length)];
        if (s.co2 && tc <= 0) { tc = .75; const p = pick(), a = 800 + R() * 300; fx.add('mCO2', [[a, -60], [lerp(a, p[0], .5) + 30, 180], p], { dur: 3, s: .78, wob: 12, fo: .1 }); }
        if (s.water && tw <= 0) { tw = .65; const p = pick(), b = R() * 200 - 60; fx.add('mH2O', [[b, 860], [lerp(b, p[0], .5), 640], p], { dur: 2.8, s: .78, wob: 10, fo: .1, spin: 70 }); }
        if (run && to <= 0) { to = .8; const p = pick(); fx.add('mGlu', [p, [p[0] + 3, p[1] - 3]], { dur: 1.6, s: .72, fi: .2, fo: .3, spin: 10 }); const e = 600 + R() * 260; fx.add('mO2', [p, [lerp(p[0], e, .5), 150], [e, -70]], { dur: 3, s: .78, wob: 12 }); }
      },
      leave() { fx.clear(); },
    };
  }

  /* --- 단계 3: 엽록체 속 --- */
  function chloroLevel(ST, parent, o) {
    const g = el('g', null, parent), R = mk(9), CX = 500, CY = 400;
    el('rect', { x: -700, y: -800, width: 2400, height: 1900, fill: grad([[0, '#eef7dd'], [1, '#d5ebbe']]) }, g);
    for (let i = 0; i < 26; i++) el('circle', { cx: -80 + R() * 1160, cy: -60 + R() * 920, r: 2 + R() * 5, fill: '#b6d893', opacity: .6 }, g);
    const litB = el('g', { style: 'transition:opacity .6s' }, g);
    const body = el('g', { transform: `rotate(-5 ${CX} ${CY})` }, g);
    el('ellipse', { cx: CX + 6, cy: CY + 14, rx: 462, ry: 306, fill: '#3f6d2c', opacity: .14 }, body);
    el('ellipse', { cx: CX, cy: CY, rx: 458, ry: 300, fill: grad([[0, '#82c35f'], [1, '#4f9c3f']]), stroke: '#2d7030', 'stroke-width': 3 }, body);
    el('ellipse', { cx: CX, cy: CY, rx: 440, ry: 283, fill: grad([[0, '#bfe292'], [.6, '#a3d57b'], [1, '#8cc768']]), stroke: '#3f8a3a', 'stroke-width': 2.5 }, body);
    /* 쌓인 원반 (이름은 쓰지 않는다) */
    const STK = [[190, 330, 6], [300, 240, 7], [430, 215, 6], [560, 240, 7], [690, 280, 6], [800, 370, 5], [250, 480, 7], [395, 400, 7], [530, 395, 6], [660, 430, 5], [345, 590, 5]];
    const sites = [];
    const lam = el('g', { stroke: '#4c9440', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round', opacity: .75 }, body);
    [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [0, 6], [6, 7], [7, 8], [8, 9], [6, 10], [1, 7], [3, 8], [4, 9]].forEach(([a, b]) => { const p = STK[a], q = STK[b]; el('path', { d: `M${p[0]} ${p[1]}Q${(p[0] + q[0]) / 2} ${(p[1] + q[1]) / 2 + 20} ${q[0]} ${q[1]}` }, lam); });
    const disk = grad([[0, '#58b04a'], [.5, '#2f8f3a'], [1, '#1e6f2e']]);
    STK.forEach(([x, y, n]) => { const sg = el('g', null, body); for (let i = n - 1; i >= 0; i--) el('ellipse', { cx: x, cy: y + i * 9 - n * 4, rx: 42, ry: 11, fill: disk, stroke: '#155526', 'stroke-width': 1 }, sg); sites.push([x, y - n * 4 - 2]); });
    const rot = (p) => { const a = -5 * Math.PI / 180, dx = p[0] - CX, dy = p[1] - CY; return [CX + dx * Math.cos(a) - dy * Math.sin(a), CY + dx * Math.sin(a) + dy * Math.cos(a)]; };
    const S = sites.map(rot);
    /* 녹말 사슬 */
    const chain = el('g', null, g); let nCh = 0, fG = false, fS = false, vis = false; const upd = () => { nmG.show(vis && fG); nmS.show(vis && fS); };
    const ROW = 13, slot = (i) => { const r = Math.floor(i / ROW), c = i % ROW, cc = r % 2 ? ROW - 1 - c : c, x = 486 + cc * 23 + (r % 2 ? 0 : 0); return [x, 535 + r * 38 - (x - 500) * .087 + (c % 2 ? 5 : -5)]; };
    const linkG = el('g', { fill: 'none', stroke: '#a66d0a', 'stroke-width': 4, 'stroke-linecap': 'round' }, chain), hexG = el('g', null, chain);
    const addHex = (quick) => {
      const i = nCh++; const c = slot(i);
      if (i) { const q = slot(i - 1); el('line', { x1: q[0], y1: q[1], x2: c[0], y2: c[1] }, linkG); }
      PS.sprite('mGlu', c[0], c[1], .92, hexG);
      if (nCh >= 4) { fS = true; upd(); }
    };
    const dim = el('rect', { x: -700, y: -800, width: 2400, height: 1900, fill: '#102434', opacity: 0, style: 'transition:opacity .6s;pointer-events:none' }, g);
    [[-90, 210], [160, 120], [330, 150]].forEach(([x, w]) => el('path', { d: `M${x} -90L${x + w} -90L${x + w + 280} 560L${x + 260} 620Z`, fill: grad([[0, '#fff3b0', .55], [1, '#fff3b0', .02]]) }, litB));
    const fx = flock(g), fl = flock(g);
    const labs = { lit: ST.label(92, 60, '빛에너지', 'bg'), co2: ST.label(895, 60, '이산화 탄소', 'bg'), o2: ST.label(660, 44, '산소', 'bg'), h2o: ST.label(78, 730, '물', 'bg') };
    const nmC = ST.label(CX - 8, 142, '엽록체', 'bg big');
    const nmG = ST.label(432, 520, '포도당', 'bg'), nmS = ST.label(640, 618, '녹말', 'bg');
    const glSite = [500, 590];
    let tc = 0, tw = 0, tl = 0, stock = 0;
    const CAP = 26, make = (p) => {
      const pulse = el('circle', { cx: p[0], cy: p[1], r: 6, fill: 'none', stroke: '#fff7c2', 'stroke-width': 3 }, g);
      tween(520, (t) => { pulse.setAttribute('r', 6 + t * 30); pulse.setAttribute('opacity', 1 - t); }, () => pulse.remove());
      const e = 560 + Math.random() * 300;
      fx.add('mO2', [p, [lerp(p[0], e, .5), lerp(p[1], -80, .5)], [e, -90]], { dur: 2.8, s: 1, wob: 10, fi: .12 });
      if (nCh < CAP) { const c = slot(nCh); fG = true; upd(); const k = nCh; fx.add('mGlu', [p, [(p[0] + c[0]) / 2, Math.max(p[1], c[1]) + 20], c], { dur: 2.2, s: .95, spin: 30, fi: .18, cb: () => { if (nCh <= k) addHex(); } }); }
      else fx.add('mGlu', [p, [p[0] + 4, p[1] + 26]], { dur: 2, s: .95, fi: .2, fo: .35, spin: 10 });
    };
    return {
      g, ring: null, labs, focus: [CX, CY], extra: [nmC], setVis(v) { vis = v; upd(); },
      reset() { linkG.innerHTML = ''; hexG.innerHTML = ''; nCh = 0; fG = fS = false; upd(); },
      prefill(n) { for (let i = 0; i < n; i++) addHex(true); fG = true; upd(); },
      apply(s) { litB.style.opacity = s.light ? 1 : 0; dim.setAttribute('opacity', s.light ? 0 : .2); },
      tick(dt, s, run) {
        fx.step(dt); fl.step(dt); tc -= dt; tw -= dt; tl -= dt;
        const pick = () => S[Math.floor(Math.random() * S.length)];
        if (s.light && tl <= 0) { tl = .22; const p = pick(), x = -40 + Math.random() * 240; fl.add('mLit', [[x, -40], p], { dur: .9, s: .9, spin: 0, fi: .05, fo: .15, ez: (t) => t }); }
        if (s.co2 && tc <= 0) { tc = 1.05; const p = pick(), x = 780 + Math.random() * 300; fx.add('mCO2', [[x, -50], [lerp(x, p[0], .5) + 40, lerp(-50, p[1], .5)], p], { dur: 2.5, s: 1.05, wob: 12, fo: .08, cb: () => { if (s.co2 && s.light && s.water) make(p); } }); }
        if (s.water && tw <= 0) { tw = 1.05; const p = pick(), x = -60 + Math.random() * 240; fx.add('mH2O', [[x, 860], [lerp(x, p[0], .5) - 20, lerp(860, p[1], .5)], p], { dur: 2.5, s: 1.05, wob: 10, fo: .08, spin: 70 }); }
      },
      leave() { fx.clear(); fl.clear(); },
    };
  }

  /* --- 전체 --- */
  PS.journey = function (host, o = {}) {
    lightDefs();
    const ST = stage(host), root = el('g', null, ST.svg);
    const state = { light: !!o.on, co2: !!o.on, water: !!o.on };
    const L = [plantLevel(ST, root), leafLevel(ST, root), cellLevel(ST, root), chloroLevel(ST, root, o)];
    let cur = -1, busy = false, onLevel = null, onState = null;
    const run = () => state.light && state.co2 && state.water;
    const labsOn = o.labels !== false;
    const showLabels = (i) => {
      L.forEach((l, k) => {
        const on = labsOn && k === i;
        Object.entries(l.labs).forEach(([name, lb]) => { const want = name === 'lit' ? state.light : name === 'co2' ? state.co2 : name === 'h2o' ? state.water : run(); lb.show(on && want); });
        l.extra.forEach((x) => x.show(on));
        if (l.setVis) l.setVis(on);
      });
    };
    const refresh = () => { L.forEach((l) => l.apply(state)); if (cur >= 0) showLabels(cur); onState && onState(state, run()); };
    function go(i, instant) {
      if (busy || i === cur) return; const from = cur; cur = i;
      L.forEach((l, k) => { if (k !== from && k !== i) { l.g.style.display = 'none'; l.leave(); } });
      const nx = L[i]; nx.g.style.display = '';
      onLevel && onLevel(i);
      if (from < 0 || instant || PS.REDUCE) { if (from >= 0) { L[from].g.style.display = 'none'; L[from].leave(); } nx.g.removeAttribute('transform'); nx.g.style.opacity = 1; showLabels(i); return; }
      busy = true; showLabels(-1);
      const out = L[from], inward = i > from, foc = inward ? out.focus : [500, 400], foc2 = inward ? [500, 400] : nx.focus;
      root.appendChild(inward ? out.g : nx.g); root.appendChild(inward ? nx.g : out.g);
      tween(760, (t) => {
        const a = inward ? 1 + t * t * 3.2 : 1 - t * .7, b = inward ? .3 + .7 * t : 4.2 - 3.2 * t;
        out.g.setAttribute('transform', `translate(${foc[0]} ${foc[1]}) scale(${a}) translate(${-foc[0]} ${-foc[1]})`);
        nx.g.setAttribute('transform', `translate(${foc2[0]} ${foc2[1]}) scale(${b}) translate(${-foc2[0]} ${-foc2[1]})`);
        out.g.style.opacity = clamp(1 - t * 1.25); nx.g.style.opacity = clamp(t * 1.5 - .15);
      }, () => { out.g.style.display = 'none'; out.g.removeAttribute('transform'); out.g.style.opacity = 1; out.leave(); nx.g.removeAttribute('transform'); nx.g.style.opacity = 1; busy = false; showLabels(i); });
    }
    L.forEach((l, k) => { if (l.ring) l.ring.addEventListener('click', () => go(k + 1)); });
    L.forEach((l) => { l.g.style.display = 'none'; });
    if (o.noRing) L.forEach((l) => { if (l.ring) l.ring.style.display = 'none'; });
    L[3].reset(); refresh(); go(o.level || 0, true);
    const tick = (dt) => { if (cur >= 0 && !busy) L[cur].tick(dt, state, run()); else if (busy) { /* 넘어가는 동안 입자 멈춤 */ } };
    if (o.prefill) L[3].prefill(o.prefill);
    loop(tick);
    return {
      state, run, go, get level() { return cur; }, L,
      set(k, v) { state[k] = v; refresh(); },
      setAll(v) { state.light = state.co2 = state.water = v; refresh(); },
      reset() { state.light = state.co2 = state.water = false; L[3].reset(); L.forEach((l) => l.leave()); refresh(); },
      fast(sec) { for (let i = 0; i < sec / .05; i++) tick(.05); },
      set onLevel(f) { onLevel = f; }, set onState(f) { onState = f; },
    };
  };
})();
