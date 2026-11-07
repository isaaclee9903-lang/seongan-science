/* ===== 배설 그림 도구 EX: 네프론 모식도(여과·재흡수·분비), 인공소변 검사. 모두 새로 그림. 입자 수는 정한 모형 ===== */
window.EX = (() => {
  'use strict';
  const { el, grad, tween, loop, lerp, clamp, stage, f1, mk, flock, defs, shadow, polyAt, REDUCE } = PS;
  let okS = false;
  function symbols() {
    if (okS) return; okS = true; PS.defs(); const d = defs();
    const rb = el('g', { id: 'xRbc' }, d); el('ellipse', { rx: 15, ry: 10, fill: grad([[0, '#f06a5a'], [1, '#b5281d']], { r: 1, cx: .38, cy: .32, rr: .85 }), stroke: '#7f1a12' }, rb);
    const pr = el('g', { id: 'xPro' }, d); [[-8, 0], [6, -7], [6, 7], [-4, -10], [14, 2]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 8, fill: '#c76a9e', stroke: '#8a3f6c' }, pr));
    const gl = el('g', { id: 'xGlu' }, d); el('path', { d: 'M9 0 4.5 7.8H-4.5L-9 0-4.5-7.8H4.5Z', fill: '#f5c04a', stroke: '#a66d0a' }, gl);
    const am = el('g', { id: 'xAmi' }, d); el('circle', { r: 7.5, fill: '#ef9ab5', stroke: '#8f2a4c' }, am);
    const mi = el('g', { id: 'xMin' }, d); el('rect', { x: -6, y: -6, width: 12, height: 12, rx: 2, fill: '#8fb7d6', stroke: '#4c7898', transform: 'rotate(45)' }, mi);
    const wa = el('g', { id: 'xWat' }, d); el('path', { d: 'M0 -9C5 -2 7 2 0 8C-7 2 -5 -2 0 -9Z', fill: '#4aa3d4', stroke: '#2a7ba8', 'stroke-width': .7 }, wa);
    const ur = el('g', { id: 'xUre' }, d); el('path', { d: 'M0 -9L9 7H-9Z', fill: '#8f8678', stroke: '#5f5749' }, ur);
  }
  const TUB = [[292, 318], [430, 330], [560, 262], [712, 300], [742, 440], [590, 520], [440, 462], [380, 560], [500, 650], [790, 650]];
  const CAP = [[310, 190], [440, 268], [566, 196], [770, 250], [806, 450], [610, 574], [470, 512], [440, 570], [520, 590], [820, 590], [940, 520], [992, 420]];
  const seg = (P, a, b, n = 10) => Array.from({ length: n + 1 }, (_, i) => polyAt(P, lerp(a, b, i / n)));
  function nephron(host) {
    symbols();
    const ST = stage(host, [0, 0, 1000, 720]), root = el('g', null, ST.svg); ST.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    el('rect', { x: -200, width: 1400, height: 720, fill: '#fff' }, root);
    const sm = (pts) => { let d = `M${pts[0][0]} ${pts[0][1]}`; for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; d += `Q${pts[i][0]} ${pts[i][1]} ${f1(mx)} ${f1(my)}`; } return d + `L${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`; };
    const tube = (pts, c1, c2, w) => { const d = sm(pts); el('path', { d, fill: 'none', stroke: c1, 'stroke-width': w, 'stroke-linecap': 'round' }, root); el('path', { d, fill: 'none', stroke: c2, 'stroke-width': w - 7, 'stroke-linecap': 'round' }, root); };
    /* 세뇨관 */
    tube(TUB, '#b89a4f', '#f8ecc0', 38);
    /* 콩팥깔때기 */
    el('path', { d: 'M770 620L952 620C970 660 966 700 946 716H796Z', fill: grad([[0, '#f6e7a8'], [1, '#e7cd68']]), stroke: '#b89a4f', 'stroke-width': 2 }, root);
    /* 모세혈관 */
    tube(CAP, '#a23b35', '#df7a70', 22);
    tube([[10, 210], [120, 210], [170, 205]], '#a23b35', '#ef7f72', 30);
    /* 보먼주머니 */
    el('path', { d: 'M226 100C138 96 92 170 100 240C110 318 186 356 270 342L316 318L300 288L262 314C200 322 142 288 138 232C136 176 174 134 228 136Z', fill: grad([[0, '#f6e7a8'], [1, '#e7cd68']]), stroke: '#b89a4f', 'stroke-width': 2 }, root);
    /* 토리 */
    const R0 = mk(3);
    const knot = el('g', { fill: 'none', 'stroke-linecap': 'round' }, root);
    for (let i = 0; i < 16; i++) { const rot = R0() * 180, rx = 26 + R0() * 26, ry = 8 + R0() * 10, ox = (R0() - .5) * 32, oy = (R0() - .5) * 32; el('ellipse', { cx: 225 + ox, cy: 225 + oy, rx, ry, transform: `rotate(${f1(rot)} ${f1(225 + ox)} ${f1(225 + oy)})`, stroke: i % 2 ? '#e08274' : '#b8392f', 'stroke-width': 7 }, knot); }
    el('path', { d: 'M170 205Q195 200 215 215M245 200Q285 180 310 190', stroke: '#b8392f', 'stroke-width': 18 }, knot);
    /* 이름표 */
    [['콩팥동맥에서', 80, 170], ['토리', 225, 225, 'lt'], ['보먼주머니', 200, 370], ['세뇨관', 608, 412], ['모세혈관', 668, 200], ['콩팥깔때기', 870, 680], ['콩팥정맥으로', 900, 400]].forEach(([t, x, y, c]) => { const l = ST.label(x, y, t, c === 'lt' ? 'lt big' : 'bg'); l.e.style.fontSize = c ? '' : 'clamp(11px,1.25vw,14.5px)'; });
    const fl = flock(root), R = Math.random;
    const MAP = { glu: 'xGlu', ami: 'xAmi', min: 'xMin', wat: 'xWat', ure: 'xUre', rbc: 'xRbc', pro: 'xPro' };
    let st = 0, acc = 0, paused = false, ill = null;
    const big = (k) => fl.add(MAP[k], [[10, 210], [160, 210], [225, 225], [310, 190], ...seg(CAP, 0, 1)], { dur: 7, s: k === 'rbc' ? 1 : 1.2, spin: 15, wob: 2, fi: .02, fo: .02 });
    const toBow = (k, then) => fl.add(MAP[k], [[10, 210], [160, 210], [225, 225], [242, 318], [292, 318]], { dur: 1.8, s: 1.05, spin: 20, wob: 2, fi: .03, cb: then });
    const toCap = (k, t) => (p) => { const a = polyAt(TUB, t), b = polyAt(CAP, Math.min(1, t + .04)); fl.add(MAP[k], [a, [lerp(a[0], b[0], .5), lerp(a[1], b[1], .5)], b, ...seg(CAP, Math.min(1, t + .04), 1, 6)], { dur: 3.2, s: 1, spin: 15, wob: 1, fo: .02 }); };
    const alongTub = (k, a, b, cb, s = 1.05) => fl.add(MAP[k], seg(TUB, a, b), { dur: (b - a) * 6.2 + .1, s, spin: 15, wob: 1, fi: .02, cb });
    const toUrine = (k) => { const a = polyAt(TUB, 1); alongTub(k, 0, 1, () => { fl.add(MAP[k], [a, [860, 660], [880, 695]], { dur: .7, s: 1, fo: .3 }); }); };
    const kinds = ['glu', 'ami', 'min', 'wat', 'ure'];
    const emit = () => {
      const k = kinds[Math.floor(R() * kinds.length)];
      if (R() < .3) big(R() < .55 ? 'rbc' : 'pro');
      toBow(k, () => {
        if (st < 2) { /* 여과만 */ alongTub(k, 0, .2); return; }
        if (k === 'glu' || k === 'ami') { const t = .1 + R() * .4; if (ill === 'sugar' && k === 'glu') { toUrine(k); return; } alongTub(k, 0, t, toCap(k, t)); }
        else if (k === 'ure') toUrine(k);
        else if (R() < .78) { const t = .15 + R() * .6; alongTub(k, 0, t, toCap(k, t)); } else toUrine(k);
      });
      if (st >= 3 && R() < .5) { const t = .25 + R() * .5, b = polyAt(CAP, t); fl.add('xUre', [...seg(CAP, 0, t, 6), b], { dur: 2, s: 1, spin: 15, cb: () => { const a = polyAt(TUB, t - .03); fl.add('xUre', [b, a], { dur: .7, s: 1.05, cb: () => { const rest = seg(TUB, t - .03, 1); fl.add('xUre', rest, { dur: 3, s: 1.05, fo: .05 }); } }); } }); }
    };
    loop((dt) => { fl.step(dt); if (paused || st < 1) return; acc += dt * 2.2; if (acc > 1 && fl.n < 42) { acc = 0; emit(); } });
    return {
      ST, setStep(n) { st = n; if (n === 0) fl.clear(); },
      setIll(v) { ill = v; },
    };
  }
  /* 작은 입자 설명용 */
  /* --- 인공소변 검사 --- */
  const URINE = [{ n: '인공소변 1', gl: 0, pr: 2, ans: '단백뇨' }, { n: '인공소변 2', gl: 0, pr: 0, ans: '정상' }, { n: '인공소변 3', gl: 2, pr: 0, ans: '당뇨' }];
  const COL = { gl: ['#d9e7c0', '#7a9c3f', '#3f6b2e'], pr: ['#e7e0a1', '#7fb5a7', '#1c7f86'] };
  function urine(host) {
    symbols();
    const ST = stage(host, [0, 0, 1000, 720]), root = el('g', null, ST.svg);
    PS.bench(root, 650);
    const X = [160, 500, 840], B = [];
    X.forEach((x, i) => {
      shadow(root, x, 650, 120, 10, .22);
      const g = el('g', { class: 'tap', 'data-i': i }, root);
      el('path', { d: `M${x - 100} 330L${x - 92} 636Q${x - 90} 650 ${x - 76} 650H${x + 76}Q${x + 90} 650 ${x + 92} 636L${x + 100} 330`, fill: 'rgba(226,238,245,.3)', stroke: '#7f94a5', 'stroke-width': 2.2 }, g);
      el('path', { d: `M${x - 96} 440L${x - 92} 636Q${x - 90} 648 ${x - 76} 648H${x + 76}Q${x + 90} 648 ${x + 92} 636L${x + 96} 440Z`, fill: grad([[0, '#f6e27c'], [1, '#e7c94f']]), opacity: .92 }, g);
      ST.label(x, 680, URINE[i].n, '');
      /* 검사지 */
      const s = el('g', null, g);
      el('rect', { x: x - 11, y: 130, width: 22, height: 300, rx: 3, fill: '#fbfbf6', stroke: '#b9c3cc' }, s);
      const p1 = el('rect', { x: x - 9, y: 360, width: 18, height: 26, rx: 2, fill: COL.gl[0], stroke: '#9aa58b' }, s), p2 = el('rect', { x: x - 9, y: 396, width: 18, height: 26, rx: 2, fill: COL.pr[0], stroke: '#9aa58b' }, s);
      const a = ST.label(x + 16, 293, '포도당', 'ra m'), b = ST.label(x + 16, 329, '단백질', 'ra m'); a.e.style.fontSize = b.e.style.fontSize = 'clamp(11px,1.15vw,13.5px)'; a.show(false); b.show(false);
      s.setAttribute('transform', 'translate(0 -80)');
      B.push({ s, p1, p2, a, b, x, u: URINE[i], done: false });
    });
    const mix = (a, b, t) => { const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); const A = p(a), C = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, C[i], t))).join(',')})`; };
    return {
      ST,
      dip(i, cb) {
        const T = B[i]; if (T.done) return cb && cb(); T.done = true;
        tween(REDUCE ? 0 : 700, (t) => T.s.setAttribute('transform', `translate(0 ${f1(lerp(-80, 100, t))})`), () => setTimeout(() => tween(REDUCE ? 0 : 800, (t) => {
          T.s.setAttribute('transform', `translate(0 ${f1(lerp(100, -80, t))})`);
          T.p1.setAttribute('fill', mix(COL.gl[0], COL.gl[T.u.gl], t)); T.p2.setAttribute('fill', mix(COL.pr[0], COL.pr[T.u.pr], t));
        }, () => { T.a.show(true); T.b.show(true); cb && cb(); }), REDUCE ? 0 : 300));
      },
      fill() { B.forEach((T) => { T.done = true; T.p1.setAttribute('fill', COL.gl[T.u.gl]); T.p2.setAttribute('fill', COL.pr[T.u.pr]); T.a.show(true); T.b.show(true); }); },
    };
  }
  return { nephron, urine, URINE, COL };
})();
