/* ===== 호흡 그림 도구 BR: 호흡 운동 모형, 가슴 단면, 허파꽈리·조직세포 기체 교환. 모두 새로 그림. 크기와 입자 수는 정한 모형 ===== */
window.BR = (() => {
  'use strict';
  const { el, grad, tween, loop, lerp, clamp, stage, f1, mk, flock, shadow, defs, REDUCE, polyAt } = PS;
  let okS = false;
  function symbols() {
    if (okS) return; okS = true; PS.defs(); const d = defs();
    const r = (id, a, b, st) => { const g = el('g', { id }, d); el('ellipse', { rx: 13, ry: 9, fill: grad([[0, a], [1, b]], { r: 1, cx: .38, cy: .32, rr: .85 }), stroke: st, 'stroke-width': .8 }, g); el('ellipse', { rx: 6, ry: 3.6, fill: b, opacity: .5 }, g); };
    r('rRed', '#f06a5a', '#b5281d', '#7f1a12'); r('rBlu', '#7d6ec2', '#4a3f8f', '#2e2663');
  }
  /* --- 모형 + 가슴 --- */
  function model(host) {
    symbols();
    const ST = stage(host, [0, 0, 1000, 740]), root = el('g', null, ST.svg);
    PS.bench(root, 700);
    /* 왼쪽: 호흡 운동 모형 */
    const CX = 260, TOP = 190, W0 = 150;
    const bottle = el('path', { fill: 'rgba(226,238,245,.42)', stroke: '#7f94a5', 'stroke-width': 2.2 }, root);
    const folds = el('g', { fill: 'none', stroke: '#9fb3c3', 'stroke-width': 1.6 }, root);
    const FN = 5, fl = Array.from({ length: FN }, () => el('path', null, folds));
    const sheet = el('path', { fill: grad([[0, '#e27a6a'], [1, '#c8503f']]), stroke: '#9c3a2c', 'stroke-width': 1.4, opacity: .96 }, root);
    /* Y자관 */
    el('path', { d: `M${CX} 70V270M${CX} 270L${CX - 70} 330M${CX} 270L${CX + 70} 330`, fill: 'none', stroke: '#8aa0b0', 'stroke-width': 13, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, root);
    el('path', { d: `M${CX} 70V270M${CX} 270L${CX - 70} 330M${CX} 270L${CX + 70} 330`, fill: 'none', stroke: '#eef4f8', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, root);
    const bal = [-1, 1].map((f) => { const g = el('g', null, root); return { g, f, b: el('ellipse', { fill: grad([[0, '#ffa294'], [.6, '#e8604f'], [1, '#b43a2b']], { r: 1, cx: .38, cy: .3, rr: .8 }), stroke: '#8f2a1f' }, g) }; });
    el('rect', { x: CX - 34, y: TOP - 12, width: 68, height: 22, rx: 6, fill: '#8d7a5f', stroke: '#65553f' }, root);
    const LL = {};
    const lb = (k, x, y, t, c = '') => { LL[k] = ST.label(x, y, t, c); LL[k].e.style.fontSize = 'clamp(11px,1.3vw,15px)'; };
    lb('a', 130, 110, 'Y자관 = 숨관, 숨관가지', 'bg'); lb('b', 470, 400, '작은 고무풍선<br>= 폐', 'bg'); lb('c', 410, 250, '물통 = 흉강', 'bg'); lb('d', 110, 610, '고무 막 = 가로막', 'ra');
    LL.b.e.style.textAlign = 'center'; LL.d.e.style.color = '#8f2a1f';
    /* 오른쪽: 가슴 단면 */
    const HX = 730;
    el('path', { d: `M${HX - 160} 720L${HX - 176} 270C${HX - 176} 186 ${HX - 80} 160 ${HX - 44} 150L${HX - 40} 40C${HX - 40} 8 ${HX + 40} 8 ${HX + 40} 40L${HX + 44} 150C${HX + 80} 160 ${HX + 176} 186 ${HX + 176} 270L${HX + 160} 720Z`, fill: grad([[0, '#f6e4d6'], [1, '#efd5c3']]), stroke: '#dcbfac', 'stroke-width': 1.4 }, root);
    const lungG = el('g', null, root), lungs = [-1, 1].map((f) => el('path', { d: `M${f * 16} -120C${f * 100} -130 ${f * 136} -20 ${f * 128} 120C${f * 78} 148 ${f * 22} 130 ${f * 14} 90Z`, fill: grad([[0, '#f6c9c6'], [1, '#df8d88']], { r: 1, cx: .45, cy: .4, rr: .75 }), stroke: '#b56562', 'stroke-width': 1.4 }, lungG));
    const tree = el('g', { fill: 'none', stroke: '#fff4f0', 'stroke-linecap': 'round' }, lungG);
    [[-1], [1]].forEach(([f]) => { el('path', { d: `M0 -130L${f * 34} -86M${f * 34} -86L${f * 70} -40M${f * 34} -86L${f * 58} -24M${f * 70} -40L${f * 92} 10M${f * 58} -24L${f * 56} 50M${f * 70} -40L${f * 110} -20`, 'stroke-width': 5 }, tree); });
    const airway = el('path', { d: `M${HX} 40V200`, fill: 'none', stroke: '#c9d7e2', 'stroke-width': 18, 'stroke-linecap': 'round' }, root);
    el('path', { d: `M${HX} 40V200`, fill: 'none', stroke: '#eef4f8', 'stroke-width': 11, 'stroke-linecap': 'round' }, root);
    /* 갈비뼈 */
    const ribs = el('g', { fill: 'none', stroke: '#f6efe2', 'stroke-linecap': 'round' }, root);
    const ribL = []; for (let i = 0; i < 7; i++) { const y = 230 + i * 40; [-1, 1].forEach((f) => { const u = el('path', { 'stroke-width': 11, stroke: '#dfd2b9' }, ribs), v = el('path', { 'stroke-width': 7 }, ribs); ribL.push({ u, v, y, f, i }); }); }
    const dia = el('path', { fill: 'none', stroke: '#c8503f', 'stroke-width': 11, 'stroke-linecap': 'round' }, root);
    lb('e', HX, 28, '코로 이어지는 숨관', 'bg'); lb('f', HX + 190, 210, '갈비뼈', 'ra'); lb('g', HX, 400, '폐', ''); lb('h', HX + 178, 620, '가로막', 'ra');
    LL.h.e.style.color = '#8f2a1f';
    /* 공기 */
    const mol = el('g', null, root), flk = flock(mol), R = Math.random;
    let v = 0, vel = 0, acc = 0;
    const put = (a) => {
      v = a;
      const Hb = 390 + a * 42, W = W0 - a * 8, sy = TOP + Hb; /* 물통: 위로 늘고 고무 막이 아래로 */
      const yb = 640 - (1 - a) * 22 + a * 8;
      bottle.setAttribute('d', `M${CX - W} ${TOP + 26}C${CX - W} ${TOP} ${CX + W} ${TOP} ${CX + W} ${TOP + 26}V${yb}H${CX - W}Z`);
      fl.forEach((p, i) => { const y = TOP + 70 + i * ((yb - TOP - 90) / FN); p.setAttribute('d', `M${CX - W} ${f1(y)}Q${CX} ${f1(y + 14)} ${CX + W} ${f1(y)}`); });
      const sag = (a - .5) * 110;
      sheet.setAttribute('d', `M${CX - W} ${yb}Q${CX} ${f1(yb + sag * 2)} ${CX + W} ${yb}Q${CX} ${f1(yb + sag * 2 + 14)} ${CX - W} ${yb}Z`);
      bal.forEach((b) => { const rx = lerp(32, 56, a), ry = lerp(46, 92, a); b.b.setAttribute('rx', f1(rx)); b.b.setAttribute('ry', f1(ry)); b.g.setAttribute('transform', `translate(${CX + b.f * (66 + rx * .2)} ${f1(330 + ry * .95)}) rotate(${b.f * -14})`); });
      /* 사람 */
      const s = lerp(.86, 1.12, a);
      lungG.setAttribute('transform', `translate(${HX} ${f1(lerp(350, 362, a))}) scale(${f1(s * 100) / 100} ${f1(lerp(.82, 1.18, a) * 100) / 100})`);
      ribL.forEach((r) => { const up = (a - .5) * 22 * (1 - r.i * .08), w = lerp(150, 172, a) - r.i * 3, x0 = HX + r.f * 22, xe = HX + r.f * w; const y1 = r.y - up * .3, y2 = r.y + 26 - up; const d = `M${x0} ${f1(y1)}Q${f1(HX + r.f * (w * .9))} ${f1(y1 - 12)} ${f1(xe)} ${f1(y2)}`; r.u.setAttribute('d', d); r.v.setAttribute('d', d); });
      const dy = lerp(450, 545, a), arc = lerp(-70, -24, a);
      dia.setAttribute('d', `M${HX - 170} ${f1(dy + 30)}Q${HX - 90} ${f1(dy + arc)} ${HX} ${f1(dy + arc / 2 + 10)}Q${HX + 90} ${f1(dy + arc)} ${HX + 170} ${f1(dy + 30)}`);
      LL.h.move(HX + 178, dy + 28);
    };
    put(0);
    const api = {
      ST, get v() { return v; },
      set(a) { vel = (a - v); put(clamp(a)); },
      breathe(dir) { vel = dir; },
      anim(to, cb) { const a = v; tween(REDUCE ? 0 : 1500, (t) => { vel = (to - a); put(lerp(a, to, t)); }, () => { vel = 0; cb && cb(); }); },
    };
    loop((dt) => {
      flk.step(dt);
      if (Math.abs(vel) > .02) {
        acc += dt * 8;
        if (acc > 1 && flk.n < 30) {
          acc = 0; const inn = vel > 0;
          const a = [[CX, 16], [CX, 120], [CX, 268], [CX + (R() < .5 ? -70 : 70), 340]];
          const b = [[HX, 8], [HX, 90], [HX, 200], [HX + (R() < .5 ? -70 : 70), 300]];
          [a, b].forEach((p) => { const pts = inn ? p : p.slice().reverse(); flk.add(R() < .22 ? 'mO2' : 'mO2', pts, { dur: 1.1, s: .7, fi: .1, fo: .2 }); });
        }
      }
    });
    return api;
  }

  /* --- 기체 교환 --- */
  function exchange(host, kind) {
    symbols();
    const ST = stage(host, [0, 0, 1000, 720]), root = el('g', null, ST.svg); ST.svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    el('rect', { x: -200, width: 1400, height: 720, fill: '#fdf6f0' }, root);
    const R = Math.random;
    /* 모세혈관 */
    const capPath = [[-20, 660], [240, 650], [500, 620], [760, 650], [1020, 660]];
    const lung = kind === 'lung';
    if (lung) {
      el('path', { d: 'M90 560C60 280 220 60 500 60C780 60 940 280 910 560Z', fill: grad([[0, '#fbe6e2'], [1, '#f6cfca']], { r: 1, cx: .5, cy: .45, rr: .6 }), stroke: '#c58076', 'stroke-width': 7 }, root);
      ST.label(500, 200, '허파꽈리', 'big');
    } else {
      [[150, 300], [370, 240], [590, 240], [810, 300]].forEach(([x, y]) => { el('path', { d: `M${x - 104} ${y}C${x - 106} ${y - 160} ${x + 104} ${y - 160} ${x + 104} ${y}C${x + 110} ${y + 160} ${x - 110} ${y + 170} ${x - 104} ${y}Z`, fill: grad([[0, '#f6d7c4'], [1, '#e7b79e']], { r: 1, cx: .4, cy: .35, rr: .8 }), stroke: '#b57f62', 'stroke-width': 1.5 }, root); el('circle', { cx: x, cy: y - 16, r: 32, fill: '#a47a9f', stroke: '#6f4f6c' }, root); });
      ST.label(500, 70, '조직세포', 'big');
    }
    el('path', { d: 'M-40 690Q240 540 500 560T1040 690V760H-40Z', fill: grad(lung ? [[0, '#6f88d0'], [.5, '#a78ab8'], [1, '#e77c6c']] : [[0, '#e77c6c'], [.5, '#a78ab8'], [1, '#6f88d0']], { x2: 1, y2: 0 }), stroke: '#8d4f58', 'stroke-width': 4, 'stroke-dasharray': '26 3' }, root);
    ST.label(500, 634, '모세혈관', 'lt big');
    const fl = flock(root);
    /* 적혈구 흐름 */
    const flow = [[-30, 690], [200, 640], [500, 612], [800, 650], [1030, 700]];
    let aR = 0, aG = 0;
    const mid = 500;
    /* 밀도 표시: 위쪽 입자 */
    const bgO = [], bgC = [];
    const Rs = mk(9);
    const top = (n, k, s) => Array.from({ length: n }, () => { const x = 170 + Rs() * 660, y = (lung ? 170 : 160) + Rs() * 300; const u = el('use', { href: '#' + k, transform: `translate(${f1(x)} ${f1(y)}) rotate(${f1(Rs() * 360)}) scale(${s})` }, root); return u; });
    if (lung) top(20, 'mO2', .9); else top(16, 'mCO2', .85);
    const lowS = lung ? 'mCO2' : 'mO2'; top(4, lowS, .8);
    const api = { ST };
    loop((dt) => {
      fl.step(dt);
      aR += dt * 1.7; if (aR > 1) { aR = 0; const redLater = lung; const k = (R() < .5) ? 'rRed' : 'rBlu'; fl.add(lung ? 'rBlu' : 'rRed', flow.slice(0, 3), { dur: 2.2, s: 1.4, spin: 20, wob: 2, cb: () => fl.add(lung ? 'rRed' : 'rBlu', flow.slice(2), { dur: 2.2, s: 1.4, spin: 20, wob: 2 }) }); }
      aG += dt * 2.2; if (aG > 1) { aG = 0; const x = 180 + R() * 640, y0 = 240 + R() * 200; if (lung) { fl.add('mO2', [[x, y0], [x + 10, 620]], { dur: 2, s: .95, fo: .15, wob: 3 }); fl.add('mCO2', [[x + 60, 620], [x + 50, y0]], { dur: 2, s: .9, fi: .15, wob: 3 }); } else { fl.add('mO2', [[x, 620], [x - 5, y0]], { dur: 2, s: .95, fi: .15, wob: 3 }); fl.add('mCO2', [[x + 60, y0], [x + 50, 620]], { dur: 2, s: .9, fo: .15, wob: 3 }); } }
    });
    return api;
  }
  return { model, exchange };
})();
