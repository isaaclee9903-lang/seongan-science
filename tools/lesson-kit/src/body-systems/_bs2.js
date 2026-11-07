/* ===== 기관계 상호작용 그림 도구 BY: 네 기관계와 조직세포를 잇는 그림. 새로 그림. 입자 수와 에너지 막대는 정한 모형 ===== */
window.BY = (() => {
  'use strict';
  const { el, grad, tween, loop, lerp, clamp, stage, f1, mk, flock, defs, polyAt, REDUCE } = PS;
  let okS = false;
  function symbols() {
    if (okS) return; okS = true; PS.defs(); const d = defs();
    const nu = el('g', { id: 'yNut' }, d); el('path', { d: 'M9 0 4.5 7.8H-4.5L-9 0-4.5-7.8H4.5Z', fill: '#f5c04a', stroke: '#a66d0a' }, nu);
    const ws = el('g', { id: 'yWst' }, d); el('rect', { x: -7, y: -7, width: 14, height: 14, rx: 3, fill: '#8f8678', stroke: '#5f5749' }, ws);
    const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, r = i % 2 ? 7 : 17; pts.push(`${f1(Math.cos(a) * r)} ${f1(Math.sin(a) * r)}`); }
    const e = el('g', { id: 'yEn' }, d); el('path', { d: 'M' + pts.join('L') + 'Z', fill: grad([[0, '#fff3a6'], [.55, '#ffc62e'], [1, '#f08a12']], { r: 1, rr: .55 }), stroke: '#c8700a', 'stroke-width': .8 }, e);
  }
  const P = {
    lung: [500, 110], gut: [190, 400], kid: [810, 400], cell: [500, 640], heart: [500, 330],
  };
  function map(host) {
    symbols();
    const ST = stage(host, [0, 0, 1000, 780]), root = el('g', null, ST.svg);
    el('rect', { x: -200, width: 1400, height: 780, fill: '#fff' }, root);
    const sm = (pts) => { let d = `M${pts[0][0]} ${pts[0][1]}`; for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; d += `Q${pts[i][0]} ${pts[i][1]} ${f1(mx)} ${f1(my)}`; } return d + `L${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`; };
    const tube = (pts, c1, c2, w) => { const g = el('g', { fill: 'none', 'stroke-linecap': 'round' }, root), d = sm(pts); el('path', { d, stroke: c1, 'stroke-width': w }, g); el('path', { d, stroke: c2, 'stroke-width': w - 7 }, g); return g; };
    const B1 = '#3c5a9a', B2 = '#7f9ad9', R1 = '#b02c20', R2 = '#e8796a';
    const LOOPS = { lung: tube([[500, 330], [395, 280], [420, 170], [500, 120]], B1, B2, 22), lung2: tube([[500, 120], [580, 170], [605, 280], [500, 330]], R1, R2, 22), gut: tube([[500, 330], [320, 330], [210, 390]], R1, R2, 22), gut2: tube([[210, 410], [320, 470], [500, 400]], B1, B2, 22), kid: tube([[500, 330], [680, 330], [790, 390]], R1, R2, 22), kid2: tube([[790, 410], [680, 470], [500, 400]], B1, B2, 22), cell: tube([[500, 340], [570, 480], [510, 620]], R1, R2, 22), cell2: tube([[490, 620], [430, 480], [500, 340]], B1, B2, 22) };
    /* 폐 */
    const gL = el('g', null, root);
    [[-1], [1]].forEach(([f]) => el('path', { d: `M${500 + f * 12} 34C${500 + f * 70} 20 ${500 + f * 136} 70 ${500 + f * 140} 150C${500 + f * 134} 186 ${500 + f * 60} 192 ${500 + f * 12} 170C${500 + f * 4} 120 ${500 + f * 4} 70 ${500 + f * 12} 34Z`, fill: grad([[0, '#f6c9c6'], [1, '#df8d88']], { r: 1, cx: .45, cy: .4, rr: .75 }), stroke: '#b56562', 'stroke-width': 1.4 }, gL));
    /* 소화계 */
    const gG = el('g', null, root);
    el('path', { d: 'M126 262C156 244 210 256 228 296C240 330 216 372 170 378C142 380 120 370 110 352C122 342 150 338 158 318C166 298 140 282 126 262Z', fill: grad([[0, '#eb9c8f'], [1, '#c9604f']], { x2: .8, y2: 1 }), stroke: '#96402f' }, gG);
    const zig = [[110, 372], [90, 406], [120, 412], [240, 412], [240, 442], [100, 442], [100, 472], [240, 472], [240, 502], [100, 502], [100, 532], [250, 532]];
    const t2 = el('g', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gG), dz = sm(zig); el('path', { d: dz, stroke: '#c4806f', 'stroke-width': 24 }, t2); el('path', { d: dz, stroke: '#f2c0b1', 'stroke-width': 17 }, t2);
    /* 콩팥 */
    const gK = el('g', null, root);
    el('path', { d: 'M780 340C820 300 884 320 892 384C900 446 852 498 808 486C778 478 792 450 800 420C806 396 782 396 778 382C774 368 772 348 780 340Z', fill: grad([[0, '#b45a4e'], [1, '#7a2f26']], { x2: .8, y2: 1 }), stroke: '#541f19', 'stroke-width': 1.2 }, gK);
    el('path', { d: 'M806 486Q826 560 860 590', fill: 'none', stroke: '#d9c174', 'stroke-width': 9, 'stroke-linecap': 'round' }, gK);
    el('path', { d: 'M842 590C842 572 898 572 898 590C898 626 842 626 842 590Z', fill: '#efd88a', stroke: '#b89a4f' }, gK);
    /* 조직세포 */
    const gC = el('g', null, root);
    [[370, 660, 66], [500, 670, 82], [630, 660, 66]].forEach(([x, y, r]) => { el('path', { d: `M${x - r} ${y}C${x - r} ${y - r * .95} ${x + r} ${y - r * .95} ${x + r} ${y}C${x + r} ${y + r * .95} ${x - r} ${y + r * .95} ${x - r} ${y}Z`, fill: grad([[0, '#f6d7c4'], [1, '#e7b79e']], { r: 1, cx: .4, cy: .35, rr: .8 }), stroke: '#b57f62', 'stroke-width': 1.2 }, gC); el('circle', { cx: x + 12, cy: y - 8, r: r * .27, fill: '#a47a9f', stroke: '#6f4f6c' }, gC); });
    /* 심장 */
    el('path', { d: 'M500 306C476 284 436 290 432 330C430 366 470 396 500 420C530 396 570 366 568 330C564 290 524 284 500 306Z', fill: grad([[0, '#c9685a'], [1, '#7c2a20']], { x2: .8, y2: 1 }), stroke: '#5f1f16', 'stroke-width': 1.4 }, root);
    /* 이름표 */
    const LB = { lung: ST.label(500, 208, '호흡계', 'bg'), gut: ST.label(170, 228, '소화계', 'bg'), kid: ST.label(840, 290, '배설계', 'bg'), heart: ST.label(500, 354, '순환계', 'lt'), cell: ST.label(500, 748, '조직세포', 'bg') };
    const tag = (x, y, t) => { const l = ST.label(x, y, t, 'big'); l.e.style.color = '#0e63b3'; return l; };
    tag(308, 390, '㉠'); tag(610, 150, '㉡'); tag(690, 390, '㉢'); tag(586, 500, '㉣');
    const off = {}; let rate = 1, energy = 0, wst = 0;
    const mol = el('g', null, root), fl = flock(mol), sp = el('g', null, root), R = Math.random, sparks = [];
    const tw = { n: 0, o: 0, c: 0, w: 0, s: 0 };
    const OUT = el('g', null, root);
    const addE = (x, y) => { const u = el('use', { href: '#yEn' }, sp); sparks.push({ u, x, y, t: 0 }); };
    let lastOk = 0;
    const api = {
      ST, set(k, v) { off[k] = !v; ({ lung: [gL, LOOPS.lung, LOOPS.lung2], gut: [gG, LOOPS.gut, LOOPS.gut2], kid: [gK, LOOPS.kid, LOOPS.kid2], cir: [] })[k].forEach((e) => e.setAttribute('opacity', v ? 1 : .22)); if (k === 'cir') Object.values(LOOPS).forEach((e) => e.setAttribute('opacity', v ? 1 : .22)); },
      speed(v) { rate = v; },
      get energy() { return energy; }, get waste() { return wst; },
      reset() { energy = 0; wst = 0; },
    };
    loop((dt) => {
      fl.step(dt);
      for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.t += dt / .8; if (s.t >= 1) { s.u.remove(); sparks.splice(i, 1); continue; } const k = Math.sin(s.t * Math.PI); s.u.setAttribute('transform', `translate(${f1(s.x)} ${f1(s.y)}) scale(${f1(.6 + k * .9)})`); s.u.setAttribute('opacity', f1(k)); }
      const cir = !off.cir, O = !off.lung && cir, N = !off.gut && cir, W = !off.kid && cir;
      /* 에너지 생산은 산소와 영양소가 모두 올 때 */
      const makes = O && N;
      energy = clamp(energy + dt * (makes ? .22 * rate : -.14));
      wst = clamp(wst + dt * (makes ? (W ? -.1 : .14) : (W ? -.1 : 0)));
      tw.s += dt * (makes ? 2.2 * rate : 0); if (tw.s > 1) { tw.s = 0; addE(420 + R() * 170, 640 + R() * 50); }
      if (cir) {
        tw.o += dt * 1.6 * rate; if (tw.o > 1 && fl.n < 40) { tw.o = 0; if (!off.lung) { fl.add('mO2', [[500 + (R() - .5) * 180, 16], [500 + (R() < .5 ? -80 : 80), 90]], { dur: .8, s: .75, fi: .2, cb: () => fl.add('mO2', [[580, 170], [605, 280], [500, 330], [570, 480], [510, 620]], { dur: 2, s: .75 }) }); } }
        tw.n += dt * 1.5 * rate; if (tw.n > 1 && fl.n < 40) { tw.n = 0; if (!off.gut) { fl.add('yNut', [[240, 472], [320, 470], [500, 400], [570, 480], [510, 620]], { dur: 2.2, s: 1, spin: 40 }); } }
        tw.c += dt * 1.3 * rate; if (tw.c > 1 && fl.n < 40) { tw.c = 0; if (makes) { fl.add('mCO2', [[490, 620], [430, 480], [500, 340], [395, 280], [420, 170], [500, 120], [500, 16]], { dur: 2.6, s: .7, fo: .08 }); } }
        tw.w += dt * 1.1 * rate; if (tw.w > 1 && fl.n < 40) { tw.w = 0; if (makes && !off.kid) { fl.add('yWst', [[490, 620], [430, 480], [500, 400], [680, 470], [790, 410], [806, 486], [870, 590]], { dur: 2.6, s: 1, fo: .06 }); } }
      }
    });
    return api;
  }
  return { map };
})();
