/* ===== 광합성에 영향을 미치는 환경요인 그림 도구 PF =====
   곡선은 교과서 그림 Ⅴ-3 모양을 눈금 숫자 없는 모형으로 그린 것이다. 모든 값은 0~1이다.
   상추 잎은 앞 차시 PS.leafData(공간 군집화 잎맥)를 쓰고, 온실은 이 수업을 위해 새로 그렸다. */
window.PF = (() => {
  'use strict';
  const { el, grad, leafData, drawLeaf, flock, tween, loop, mk, lerp, clamp, stage, shadow, defs, f1, REDUCE } = PS;
  /* --- 모형 --- */
  const sat = (x, a) => { const u = clamp(x / a); return 1 - Math.pow(1 - u, 2.3); };
  const F = {
    light: (x) => sat(x, .5),
    co2: (x) => sat(x, .54),
    temp: (x) => x <= .7 ? .2 + .8 * Math.pow(x / .7, 2.3) : Math.max(.1, 1 - Math.pow((x - .7) / .27, 2) * .88),
  };
  const rate = (L, C, T) => Math.min(F.light(L), F.co2(C)) * F.temp(T);
  const META = {
    light: { name: '빛의 세기', ax: '빛의 세기', low: '약함', high: '강함', col: '#e08a12', others: '이산화 탄소 농도, 온도', xs: [0, .08, .17, .28, .42, .68, 1] },
    co2: { name: '이산화 탄소 농도', ax: '이산화 탄소 농도', low: '낮음', high: '높음', col: '#39424c', others: '빛의 세기, 온도', xs: [0, .09, .19, .3, .45, .7, 1] },
    temp: { name: '온도', ax: '온도', low: '낮음', high: '높음', col: '#d9472f', others: '빛의 세기, 이산화 탄소 농도', xs: [.04, .24, .44, .6, .7, .82, .96] },
  };

  /* --- 상추 기호 --- */
  const PALS = {
    g: [{ a: '#3f8a2e', b: '#6fb440', v: '#bfe391', e: '#2f6f25', s: '#143f12' }, { a: '#5da838', b: '#92cf52', v: '#d5efa8', e: '#468a2d', s: '#1c4f18' }, { a: '#94cf52', b: '#cde981', v: '#ebf7c4', e: '#6fae3b', s: '#3a6e22' }],
    r: [{ a: '#5e6f2c', b: '#8c2541', v: '#d98097', e: '#551a2d', s: '#2a0b16' }, { a: '#7f8f36', b: '#a82f4d', v: '#e79ab0', e: '#6d2036', s: '#3a0f1e' }, { a: '#a9bb50', b: '#c74a66', v: '#f2bcc9', e: '#8a3148', s: '#4a1c2a' }],
    w: [{ a: '#8f7f30', b: '#bc9c3e', v: '#e0d097', e: '#6f5d22', s: '#3d3210' }, { a: '#a48f38', b: '#cfae4a', v: '#ebdda6', e: '#80692a', s: '#46391a' }, { a: '#b9a247', b: '#dcc264', v: '#f1e6b6', e: '#8e7730', s: '#54461f' }],
  };
  const LAY = [
    [[-108, 1, 0], [-72, 1, 0], [-90, 1.06, 0], [-128, 1, 0], [-52, 1, 0], [-150, .96, 0], [-30, .96, 0], [-170, .86, 0], [-10, .86, 0]],
    [[-118, .82, 1], [-62, .82, 1], [-140, .78, 1], [-40, .78, 1], [-160, .66, 1], [-20, .66, 1], [-98, .84, 1], [-82, .84, 1]],
    [[-112, .58, 2], [-68, .58, 2], [-132, .5, 2], [-48, .5, 2], [-90, .62, 2], [-152, .38, 2], [-28, .38, 2]],
    [[172, .62, 0], [8, .62, 0], [150, .46, 1], [30, .46, 1], [-128, .34, 2], [-52, .34, 2], [-90, .3, 1]],
  ];
  let sym = false;
  const LD = [[11, 1.45], [23, 1.6], [37, 1.35]].map(([seed, p]) => ({ L: 104, W: 58, p, q: .52, seed, sec: 5, ruffle: .17, nA: 30, vw: 2.8, D: 6, di: 26 }));
  function symbols() {
    if (sym) return; sym = true;
    const d = defs();
    ['g', 'r', 'w'].forEach((k) => [true, false].forEach((det) => {
      const g = el('g', { id: `lt${k}${det ? 'D' : 'S'}` }, d);
      const J = mk(k === 'r' ? 41 : 19);
      LAY.forEach((ly, li) => ly.forEach(([a00, s0, pi], i) => {
        const a0 = a00 + (J() - .5) * 13, s = s0 * (.92 + J() * .16);
        const a = k === 'w' ? -90 + (a0 + 90) * 1.14 : a0, data = leafData(LD[i % 3]);
        const dd = det ? data : { ...data, veins: [] };
        const bx = (a0 > -90 && a0 < 90 ? 1 : -1) * [4, 14, 10, 30][li] * (.6 + J() * .6), by = [0, -10, -26, -6][li];
        drawLeaf(g, dd, PALS[k][pi], { tf: `translate(${f1(bx)} ${by}) rotate(${f1(a)}) scale(${f1(s * (k === 'w' ? .94 : 1) * 100) / 100})`, edge: .7, shade: .16, veinOp: det ? .5 : 0 });
      }));
    }));
  }
  const lettuce = (p, k, det, tf) => el('use', { href: `#lt${k}${det ? 'D' : 'S'}`, transform: tf }, p);

  /* --- 온실 --- */
  const VP = [500, 300];
  const P = (x, y, s) => [VP[0] + (x - VP[0]) * s, VP[1] + (y - VP[1]) * s];
  const pp = (a) => a.map((v, i) => (i ? 'L' : 'M') + f1(v[0]) + ' ' + f1(v[1])).join('') + 'Z';
  const arch = (s) => { const a = P(-30, 800, s), b = P(-30, 340, s), c = P(120, 40, s), t = P(500, -70, s), d = P(880, 40, s), e = P(1030, 340, s), f = P(1030, 800, s); return `M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}Q${f1(c[0])} ${f1(c[1])} ${f1(t[0])} ${f1(t[1])}Q${f1(d[0])} ${f1(d[1])} ${f1(e[0])} ${f1(e[1])}L${f1(f[0])} ${f1(f[1])}`; };
  /* 활 모양 위의 점(지붕 가로대) */
  const archAt = (u) => { const lo = u < .5, t = lo ? u * 2 : (u - .5) * 2; const b = lo ? [-30, 340] : [500, -70], c = lo ? [120, 40] : [880, 40], e = lo ? [500, -70] : [1030, 340]; return [(1 - t) * (1 - t) * b[0] + 2 * t * (1 - t) * c[0] + t * t * e[0], (1 - t) * (1 - t) * b[1] + 2 * t * (1 - t) * c[1] + t * t * e[1]]; };
  const SZ = [.3, .37, .46, .58, .74, .96];

  function farm(host, o = {}) {
    symbols();
    const ST = stage(host, [0, 0, 1000, 780]); ST.svg.setAttribute('preserveAspectRatio', 'xMidYMax slice');
    const root = el('g', null, ST.svg);
    /* 비닐 너머 하늘 */
    el('rect', { x: -300, y: -400, width: 1600, height: 1300, fill: grad([[0, '#bfdff5'], [.45, '#e4f2fb'], [.62, '#f6fafc'], [1, '#f6fafc']]) }, root);
    const sun = el('circle', { cx: 180, cy: 40, r: 240, fill: grad([[0, '#fff6c9', .95], [.45, '#fff0b0', .35], [1, '#fff0b0', 0]], { r: 1, rr: .5 }) }, root);
    /* 지붕 비닐: 가로대 사이를 번갈아 칠한다 */
    const SB = .22, SF = 1.08, roofN = 12;
    for (let i = 0; i < roofN; i++) {
      const a = archAt(i / roofN), b = archAt((i + 1) / roofN);
      el('path', { d: pp([P(a[0], a[1], SF), P(b[0], b[1], SF), P(b[0], b[1], SB), P(a[0], a[1], SB)]), fill: i % 2 ? '#ffffff' : '#dfeef8', opacity: i % 2 ? .3 : .34 }, root);
    }
    /* 옆벽 */
    [[-30, 1], [1030, -1]].forEach(([x]) => {
      el('path', { d: pp([P(x, 340, SF), P(x, 800, SF), P(x, 800, SB), P(x, 340, SB)]), fill: grad([[0, '#f2f8fb', .75], [1, '#dbe9ef', .9]]) }, root);
    });
    /* 안쪽 끝 벽과 문 */
    const be = el('g', null, root);
    el('path', { d: arch(SB) + 'Z', fill: grad([[0, '#d4e8f4'], [1, '#eef6f9']]) }, be);
    const hl = el('path', { d: `M${P(-30, 800, SB)[0]} ${P(0, 660, SB)[1]}Q420 ${P(0, 560, SB)[1]} 500 ${P(0, 640, SB)[1]}T${P(1030, 0, SB)[0]} ${P(0, 620, SB)[1]}V${P(0, 800, SB)[1]}H${P(-30, 0, SB)[0]}Z`, fill: '#a9c9a0', opacity: .55 }, be);
    const dw = 95, dh = 340; const dA = P(500 - dw, 800, SB), dB = P(500 + dw, 800 - dh, SB);
    el('rect', { x: dA[0], y: dB[1], width: dB[0] - dA[0], height: dA[1] - dB[1], fill: '#fbfdfe', opacity: .8, stroke: '#8fa0ad', 'stroke-width': 1.4 }, be);
    el('line', { x1: 500, x2: 500, y1: dB[1], y2: dA[1], stroke: '#8fa0ad', 'stroke-width': 1.2 }, be);
    /* 바닥 */
    el('path', { d: pp([P(-30, 800, SF), P(1030, 800, SF), P(1030, 800, SB), P(-30, 800, SB)]), fill: grad([[0, '#cbd2d4'], [1, '#8f9a9d']]) }, root);
    el('path', { d: pp([P(405, 800, SF), P(595, 800, SF), P(595, 800, SB), P(405, 800, SB)]), fill: grad([[0, '#e4e7e4'], [1, '#c3c8c6']]) }, root);
    /* 이산화 탄소 공급 장치 */
    const tk = el('g', null, root);
    [[452, '#3f6f8f'], [548, '#4a7d9e']].forEach(([x, c]) => {
      const a = P(x - 26, 800, .36), b = P(x + 26, 500, .36);
      el('rect', { x: a[0], y: b[1], width: b[0] - a[0], height: a[1] - b[1], rx: 5, fill: grad([[0, c], [.45, '#7fa7c1'], [1, '#2c5570']], { x2: 1, y2: 0 }), stroke: '#28485c', 'stroke-width': .7 }, tk);
      el('rect', { x: a[0] + 3.5, y: b[1] - 4, width: b[0] - a[0] - 7, height: 5, fill: '#4c5660' }, tk);
    });
    /* 뼈대(앞쪽 기둥과 활) */
    [.8, .6, .46, .35, .27].forEach((s) => el('path', { d: arch(s), fill: 'none', stroke: grad([[0, '#c2ccd4'], [1, '#9aa7b1']], { x2: 1, y2: 0 }), 'stroke-width': 8 * s + 1.5 }, root));
    [2, 4, 6, 8, 10].forEach((i) => { const a = archAt(i / 12), p1 = P(a[0], a[1], 1.08), p2 = P(a[0], a[1], SB); el('line', { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], stroke: '#adb9c2', 'stroke-width': 2.2, opacity: .85 }, root); });
    /* 난방관 */
    const rails = [[430, 772], [460, 772], [540, 772], [570, 772]].map(([x, y]) => el('path', { d: pp([P(x - 5, y, SF), P(x + 5, y, SF), P(x + 5, y, SB), P(x - 5, y, SB)]), fill: '#8a949c' }, root));
    /* 벤치·물길·상추 */
    const plants = [];
    const bench = (x0, x1, kinds) => {
      const front = 1.1;
      const leg = (x, s) => { const a = P(x - 7, 800, s), b = P(x + 7, 575, s); el('rect', { x: a[0], y: b[1], width: b[0] - a[0], height: a[1] - b[1], fill: grad([[0, '#6d7a84'], [.5, '#a7b1b9'], [1, '#5c6872']], { x2: 1, y2: 0 }) }, root); };
      [.26, .33, .42, .54, .7, .92].forEach((s) => { leg(x0 + 20, s); leg(x1 - 20, s); });
      el('path', { d: pp([P(x0, 575, front), P(x1, 575, front), P(x1, 575, SB), P(x0, 575, SB)]), fill: grad([[0, '#6a7680'], [1, '#909aa2']]) }, root);
      const inner = x0 < 500 ? x1 : x0;
      el('path', { d: pp([P(inner, 575, front), P(inner, 600, front), P(inner, 600, SB), P(inner, 575, SB)]), fill: grad([[0, '#a0abb4'], [1, '#c4ccd2']]) }, root);
      el('path', { d: pp([P(x0, 575, front), P(x1, 575, front), P(x1, 600, front), P(x0, 600, front)]), fill: '#7b8791', stroke: '#5c6872', 'stroke-width': 1 }, root);
      /* 흰 물길 */
      [x0 + 88, x1 - 88].forEach((cx) => {
        el('path', { d: pp([P(cx - 42, 560, front), P(cx + 42, 560, front), P(cx + 42, 560, SB), P(cx - 42, 560, SB)]), fill: grad([[0, '#fbfcfd'], [1, '#dfe6ec']]) }, root);
        const side = cx < 500 ? 1 : -1;
        el('path', { d: pp([P(cx + side * 42, 560, front), P(cx + side * 42, 575, front), P(cx + side * 42, 575, SB), P(cx + side * 42, 560, SB)]), fill: '#c0ccd5' }, root);
        el('path', { d: pp([P(cx - 42, 560, front), P(cx + 42, 560, front), P(cx + 42, 575, front), P(cx - 42, 575, front)]), fill: '#e9eef2', stroke: '#b4c1cb', 'stroke-width': .8 }, root);
        const hole = P(cx, 560, .98); el('ellipse', { cx: hole[0], cy: hole[1], rx: 12, ry: 4, fill: '#3b4750' }, root);
      });
      return [x0 + 88, x1 - 88].map((cx, j) => ({ cx, k: kinds[j] }));
    };
    const rowsL = bench(50, 408, ['g', 'r']), rowsR = bench(592, 950, ['r', 'g']);
    /* 앞쪽 공급관 */
    [[414], [586]].forEach(([x]) => { const y = 548; el('path', { d: pp([P(x - 4, y, 1.1), P(x + 4, y, 1.1), P(x + 4, y, .36), P(x - 4, y, .36)]), fill: grad([[0, '#55616c'], [1, '#8c98a2']]) }, root); });
    const plantG = el('g', null, root);
    const items = [];
    SZ.forEach((s, si) => [...rowsL, ...rowsR].forEach((row) => { const [x, y] = P(row.cx, 562, s); items.push({ x, y, s, si, k: row.k, det: si >= 3 }); }));
    const R0 = mk(77);
    items.sort((a, b) => a.s - b.s).forEach((it) => {
      const g = el('g', null, plantG), flip = R0() < .5 ? -1 : 1, rot = (R0() - .5) * 8;
      shadow(g, it.x, it.y + 2, 76 * it.s, 12 * it.s, .32);
      const body = el('g', null, g);
      const u = lettuce(body, it.k, it.det, `scale(${flip} 1)`), w = lettuce(body, 'w', it.det, `scale(${flip} 1)`); w.setAttribute('opacity', 0);
      const p = { ...it, g, body, u, w, rot, jit: .94 + R0() * .14, cur: .42, wilt: 0 };
      const put = () => { p.body.setAttribute('transform', `translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(p.rot)}) scale(${f1(p.s * 1.02 * p.cur * 100) / 100})`); p.w.setAttribute('opacity', Math.round(p.wilt * 20) / 20); };
      p.put = put; put(); plants.push(p);
    });
    /* LED등 */
    const beams = el('g', null, root), bars = el('g', null, root), strips = [];
    [.98, .7, .5, .37].forEach((s) => [229, 771].forEach((x) => {
      const y = 245, a = P(x - 118, y, s), b = P(x + 118, y, s);
      const top = P(x - 70, 110, s), top2 = P(x + 70, 110, s);
      el('path', { d: pp([P(x - 112, y + 14, s), P(x + 112, y + 14, s), P(x + 175, 560, s), P(x - 175, 560, s)]), fill: grad([[0, '#fff3b4', .34], [1, '#fff3b4', .01]]) }, beams);
      el('line', { x1: P(x - 70, y, s)[0], y1: a[1], x2: top[0], y2: top[1], stroke: '#7c8892', 'stroke-width': 1.3 * s + .4 }, bars);
      el('line', { x1: P(x + 70, y, s)[0], y1: a[1], x2: top2[0], y2: top2[1], stroke: '#7c8892', 'stroke-width': 1.3 * s + .4 }, bars);
      const h = 20 * s;
      el('rect', { x: a[0], y: a[1], width: b[0] - a[0], height: h, rx: 3 * s + 1, fill: grad([[0, '#59646e'], [1, '#2f3841']]) }, bars);
      strips.push(el('rect', { x: a[0] + 3, y: a[1] + h - 4 * s, width: b[0] - a[0] - 6, height: 4.6 * s, rx: 2, fill: '#fff6c2' }, bars));
    }));
    /* 제어함과 센서 */
    const cab = el('g', null, root); { const s = .8, a = P(1006, 300, s), b = P(1130, 470, s); const W = b[0] - a[0], H = b[1] - a[1]; el('rect', { x: a[0], y: a[1], width: W, height: H, rx: 4, fill: grad([[0, '#eee9d6'], [1, '#cfc8b0']], { x2: 1, y2: .2 }), stroke: '#9c9681', 'stroke-width': 1.2 }, cab); [0, 1, 2, 3].forEach((i) => el('circle', { cx: a[0] + W * .3, cy: a[1] + H * (.22 + .17 * i), r: 4.6, fill: '#2fa35a', stroke: '#1d6a3b', 'stroke-width': .8 }, cab)); el('rect', { x: a[0] + W * .5, y: a[1] + H * .18, width: W * .34, height: H * .22, rx: 2, fill: '#27343e' }, cab); }
    const sb = P(180, 455, .95), sn = el('g', null, root);
    el('line', { x1: sb[0], y1: sb[1], x2: sb[0], y2: P(180, 572, .95)[1], stroke: '#58646e', 'stroke-width': 3.2 }, sn);
    el('rect', { x: sb[0] - 24, y: sb[1] - 26, width: 48, height: 32, rx: 5, fill: grad([[0, '#2aa2d6'], [1, '#157eb0']], { x2: 1, y2: 0 }), stroke: '#0f6a95' }, sn);
    el('rect', { x: sb[0] - 18, y: sb[1] - 21, width: 36, height: 14, rx: 2, fill: '#16242e' }, sn);
    el('rect', { x: sb[0] - 14, y: sb[1] - 17, width: 22, height: 2.6, fill: '#7fe0a5' }, sn); el('rect', { x: sb[0] - 14, y: sb[1] - 12, width: 14, height: 2.6, fill: '#7fe0a5', opacity: .6 }, sn);
    const dim = el('rect', { x: -300, y: -400, width: 1600, height: 1300, fill: '#0a1b2e', opacity: 0, 'pointer-events': 'none' }, root);
    const tint = el('rect', { x: -300, y: -400, width: 1600, height: 1300, fill: '#ff7a2e', opacity: 0, 'pointer-events': 'none' }, root);
    /* 입자 */
    const mol = el('g', null, root), fl = flock(mol), ambG = el('g', null, mol), R = Math.random;
    const AMB = Array.from({ length: 22 }, (_, i) => { const u = el('use', { href: '#mCO2', opacity: 0 }, ambG); return { u, x: 70 + R() * 860, y: 150 + R() * 300, a: R() * 6.28, sp: .4 + R() * .5, ph: R() * 6.28, on: 0 }; });
    const tgt = () => { const f = plants.filter((p) => p.s > .6); const p = f[Math.floor(R() * f.length)]; return [p.x + (R() - .5) * 70 * p.s, p.y - (30 + R() * 70) * p.s * p.cur * 1.3]; };
    let L = o.L ?? .6, C = o.C ?? .6, T = o.T ?? .55, acc = 0, cur = rate(L, C, T);
    /* 이름표 */
    if (o.labels !== false) {
      ST.label(229, 208, 'LED등', 'bg');
      ST.label(P(1068, 0, .8)[0], P(0, 284, .8)[1], '제어함', 'bg');
      ST.label(sb[0], sb[1] - 40, '센서', 'bg');
      ST.label(500, 628, '난방관', 'bg').e.style.fontSize = '13px';
      ST.label(500, 372, '이산화 탄소<br>공급 장치', 'bg').e.style.textAlign = 'center';
    }
    const rail = (t) => { const hot = clamp((t - .35) / .6); const mix = (a, b) => Math.round(lerp(a, b, hot)); const c = `rgb(${mix(138, 214)},${mix(148, 92)},${mix(156, 60)})`; rails.forEach((r) => r.setAttribute('fill', c)); };
    const api = {
      set(a, b, c) {
        L = a; C = b; T = c; cur = rate(L, C, T);
        beams.setAttribute('opacity', Math.round(L * 100) / 100);
        strips.forEach((s) => { s.setAttribute('fill', L > .03 ? '#fff6c2' : '#6d7883'); s.setAttribute('opacity', .35 + .65 * L); });
        sun.setAttribute('opacity', .1 + .9 * L);
        dim.setAttribute('opacity', Math.round((1 - L) * .36 * 100) / 100);
        const h = clamp((T - .7) / .28), co = clamp((.4 - T) / .4);
        tint.setAttribute('fill', h > 0 ? '#ff6a24' : '#3f8fd6');
        tint.setAttribute('opacity', Math.round((h > 0 ? h * .2 : co * .16) * 100) / 100);
        rail(T);
        return cur;
      },
      grow(cb, dur = 3200) {
        const r = cur, target = .42 + .82 * r, wilted = T > .8 ? clamp((T - .8) / .16) : 0;
        plants.forEach((p) => { p.c0 = p.cur; p.c1 = target * p.jit; p.w0 = p.wilt; p.d = p.si * .03; });
        tween(dur, (t) => { plants.forEach((p) => { const u = clamp((t - p.d) / (1 - p.d)); p.cur = lerp(p.c0, p.c1, u); p.wilt = lerp(p.w0, wilted, clamp(u * 1.4 - .3)); p.put(); }); }, cb, (x) => x);
      },
      reset() { plants.forEach((p) => { p.cur = .42; p.wilt = 0; p.put(); }); },
      jump(r, t) { const target = .42 + .82 * r, wilted = t > .8 ? clamp((t - .8) / .16) : 0; plants.forEach((p) => { p.cur = target * p.jit; p.wilt = wilted; p.put(); }); },
      get rate() { return cur; },
      ST,
    };
    api.set(L, C, T);
    loop((dt, now) => {
      fl.step(dt);
      const want = Math.round(C * AMB.length);
      AMB.forEach((a, i) => {
        a.on += ((i < want ? 1 : 0) - a.on) * Math.min(1, dt * 2.5);
        if (a.on < .02) { a.u.setAttribute('opacity', 0); return; }
        a.a += (R() - .5) * dt * 1.5; a.x += Math.cos(a.a) * 16 * a.sp * dt; a.y += Math.sin(a.a) * 12 * a.sp * dt;
        if (a.x < 50) a.a = 0; if (a.x > 950) a.a = 3.14; if (a.y < 120) a.a = 1.57; if (a.y > 470) a.a = -1.57;
        a.u.setAttribute('transform', `translate(${f1(a.x)} ${f1(a.y)}) rotate(${f1(now * 22 + a.ph * 40)}) scale(.72)`);
        a.u.setAttribute('opacity', Math.round(a.on * 20) / 20);
      });
      acc += dt * cur * 3.4;
      while (acc > 1 && fl.n < 42) {
        acc -= 1;
        const a = AMB[Math.floor(R() * Math.max(1, want))], t = tgt(), start = a ? [a.x, a.y] : [t[0], 160];
        fl.add('mCO2', [start, [lerp(start[0], t[0], .6), lerp(start[1], t[1], .4)], t], {
          dur: 1.6, s: .72, spin: 50, wob: 5, fi: .1, fo: .1,
          cb: () => { const t2 = [t[0] + (R() - .5) * 90, 90 + R() * 80]; fl.add('mO2', [t, [t[0] + (R() - .5) * 50, lerp(t[1], t2[1], .5)], t2], { dur: 2.6, s: .78, wob: 7, fi: .2, fo: .28, spin: 30 }); },
        });
      }
      if (acc > 3) acc = 3;
    });
    return api;
  }

  /* --- 축 + 곡선 (눈금 숫자 없음) --- */
  function plot(ST, parent, b, kind, o = {}) {
    const { x, y, w, h } = b, M = META[kind], f = F[kind];
    const g = el('g', null, parent);
    if (o.grid !== false) { const gr = el('g', { stroke: '#e9eff4', 'stroke-width': 1 }, g); for (let i = 1; i < 5; i++) { const xx = x + w * i / 5, yy = y + h * i / 5; el('line', { x1: xx, x2: xx, y1: y, y2: y + h }, gr); el('line', { x1: x, x2: x + w, y1: yy, y2: yy }, gr); } }
    el('path', { d: `M${x} ${y - 10}V${y + h}H${x + w + 10}`, fill: 'none', stroke: '#34495e', 'stroke-width': 1.8 }, g);
    el('path', { d: `M${x - 5} ${y - 3}L${x} ${y - 13}L${x + 5} ${y - 3}Z M${x + w + 3} ${y + h - 5}L${x + w + 13} ${y + h}L${x + w + 3} ${y + h + 5}Z`, fill: '#34495e' }, g);
    if (ST && o.labels !== false) {
      const fs = o.fs || '14px';
      const z = ST.label(x - 12, y + h + 14, '0', 'm'); z.e.style.fontSize = fs;
      const xl = ST.label(x + w, y + h + 20, M.ax, 'la'); xl.e.style.fontSize = fs;
      const yl = ST.label(x - 22, y + h * .24, '광합성량'); yl.e.style.fontSize = fs; yl.e.style.writingMode = 'vertical-rl'; yl.e.style.letterSpacing = '.1em';
    }
    const sx = (v) => x + w * v, sy = (v) => y + h * (1 - v * .86);
    const line = (a = 0, b1 = 1) => { let d = ''; const n = 90; for (let i = 0; i <= n; i++) { const v = lerp(a, b1, i / n); d += (i ? 'L' : 'M') + f1(sx(v)) + ' ' + f1(sy(f(v))); } return d; };
    return { g, sx, sy, line, f, M, b };
  }

  /* --- 작은 그래프 + 요인 아이콘 + 상추 (읽기 그림) --- */
  function factorIcon(p, kind, cx, cy) {
    const g = el('g', null, p);
    if (kind === 'light') {
      const rays = el('g', { stroke: '#f0a21d', 'stroke-width': 4.2, 'stroke-linecap': 'round' }, g);
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; el('line', { x1: cx + Math.cos(a) * 34, y1: cy + Math.sin(a) * 34, x2: cx + Math.cos(a) * 50, y2: cy + Math.sin(a) * 50 }, rays); }
      el('circle', { cx, cy, r: 28, fill: grad([[0, '#ffe28a'], [.7, '#f8b62c'], [1, '#e88f12']], { r: 1, cx: .4, cy: .36, rr: .7 }) }, g);
      return (v) => { rays.setAttribute('opacity', .12 + .88 * v); rays.setAttribute('transform', `translate(${cx} ${cy}) scale(${.75 + .45 * v}) translate(${-cx} ${-cy})`); g.lastChild.setAttribute('opacity', .4 + .6 * v); };
    }
    if (kind === 'co2') {
      const R = mk(5), ms = Array.from({ length: 12 }, () => el('use', { href: '#mCO2', transform: `translate(${f1(cx + (R() - .5) * 120)} ${f1(cy + (R() - .5) * 90)}) rotate(${f1(R() * 360)}) scale(.62)`, opacity: 0 }, g));
      return (v) => ms.forEach((m, i) => m.setAttribute('opacity', i < Math.round(v * 12) ? 1 : 0));
    }
    el('rect', { x: cx - 9, y: cy - 52, width: 18, height: 88, rx: 9, fill: '#f3f7fa', stroke: '#7c8c9b', 'stroke-width': 1.6 }, g);
    el('circle', { cx, cy: cy + 44, r: 16, fill: '#f3f7fa', stroke: '#7c8c9b', 'stroke-width': 1.6 }, g);
    const lq = el('rect', { x: cx - 4.5, width: 9, rx: 3, fill: '#d9472f' }, g), bb = el('circle', { cx, cy: cy + 44, r: 11.5, fill: '#d9472f' }, g);
    for (let i = 0; i < 5; i++) el('line', { x1: cx + 9, x2: cx + 16, y1: cy - 40 + i * 17, y2: cy - 40 + i * 17, stroke: '#7c8c9b', 'stroke-width': 1.4 }, g);
    return (v) => { const hh = 8 + 70 * v; lq.setAttribute('y', cy + 34 - hh); lq.setAttribute('height', hh); const c = `rgb(${Math.round(lerp(62, 217, v))},${Math.round(lerp(138, 71, v))},${Math.round(lerp(214, 47, v))})`; lq.setAttribute('fill', c); bb.setAttribute('fill', c); };
  }
  function one(host, kind, o = {}) {
    symbols();
    const ST = stage(host, [0, 0, 760, 420]), root = el('g', null, ST.svg);
    el('rect', { width: 760, height: 420, fill: '#fff' }, root);
    const pl = plot(ST, root, { x: 66, y: 30, w: 400, h: 330 }, kind, { fs: 'clamp(12px,1.5vw,15px)' });
    const fade = el('path', { d: pl.line(), fill: 'none', stroke: '#dfe6ec', 'stroke-width': 3, 'stroke-dasharray': '3 7', 'stroke-linecap': 'round' }, root);
    const cv = el('path', { fill: 'none', stroke: pl.M.col, 'stroke-width': 4.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, root);
    const guide = el('line', { stroke: '#8a98a6', 'stroke-width': 1, 'stroke-dasharray': '4 4' }, root);
    const dot = el('circle', { r: 8, fill: pl.M.col, stroke: '#fff', 'stroke-width': 2.4 }, root);
    /* 오른쪽 그림 */
    el('rect', { x: 510, y: 176, width: 232, height: 214, rx: 18, fill: grad([[0, '#f0f6e9'], [1, '#e4eedb']]) }, root);
    const upd = factorIcon(root, kind, 626, 96);
    const bed = el('g', null, root); shadow(bed, 626, 360, 90, 12, .3);
    el('rect', { x: 556, y: 356, width: 140, height: 18, rx: 6, fill: grad([[0, '#fbfcfd'], [1, '#d7e0e7']]), stroke: '#b4c1cb' }, bed);
    const pg = el('g', null, root), leaf = lettuce(pg, kind === 'temp' ? 'g' : 'g', true, '');
    const mol = el('g', null, root), fl = flock(mol), R = Math.random;
    let X = 0, acc = 0, cancel = null;
    const draw = (v) => {
      X = v; const a = kind === 'temp' ? .03 : 0, xx = lerp(a, .97, v), yv = pl.f(xx);
      cv.setAttribute('d', v <= 0 ? '' : pl.line(a, xx));
      dot.setAttribute('cx', pl.sx(xx)); dot.setAttribute('cy', pl.sy(yv));
      guide.setAttribute('x1', pl.sx(xx)); guide.setAttribute('x2', pl.sx(xx)); guide.setAttribute('y1', pl.sy(yv)); guide.setAttribute('y2', 360);
      upd(xx); api.y = yv;
      pg.setAttribute('transform', `translate(626 360) scale(${f1((.8 + .62 * yv) * 100) / 100})`);
    };
    const api = {
      y: 0,
      play(cb, onS) { if (cancel) cancel(); cancel = tween(o.dur || 5200, (t) => { draw(t); onS && onS(t); }, cb, (x) => x); },
      set: draw,
    };
    draw(o.at ?? 0);
    loop((dt) => {
      fl.step(dt); acc += dt * api.y * 2.2;
      while (acc > 1) { acc -= 1; const s = [626 + (R() - .5) * 60, 310 - R() * 30]; fl.add('mO2', [s, [s[0] + (R() - .5) * 40, 250], [s[0] + (R() - .5) * 70, 192]], { dur: 2, s: .66, wob: 5, fi: .2, fo: .3 }); }
    });
    return api;
  }
  /* 숫자·글자 없는 작은 곡선 (짝짓기) */
  function mini(host, kind) {
    const ST = stage(host, [0, 0, 300, 220]), root = el('g', null, ST.svg);
    const pl = plot(null, root, { x: 32, y: 22, w: 240, h: 170 }, kind, { labels: false });
    el('path', { d: pl.line(kind === 'temp' ? .03 : 0, .97), fill: 'none', stroke: '#0e63b3', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, root);
  }

  /* --- 그래프 실험실 --- */
  function lab(host, kind) {
    symbols();
    const M = META[kind], f = F[kind];
    const ST = stage(host, [0, 62, 1000, 690]), root = el('g', null, ST.svg);
    PS.bench(root, 700);
    /* 스마트 기기 */
    const SX = 448, SY = 88, SW = 528, SH = 570;
    shadow(root, SX + SW / 2, 706, 250, 14, .22);
    el('path', { d: `M${SX + SW / 2 - 60} ${SY + SH + 14}L${SX + SW / 2 - 96} 702H${SX + SW / 2 + 96}L${SX + SW / 2 + 60} ${SY + SH + 14}Z`, fill: grad([[0, '#cdd6de'], [1, '#a9b6c2']]), stroke: '#94a3b0' }, root);
    el('rect', { x: SX - 14, y: SY - 14, width: SW + 28, height: SH + 28, rx: 20, fill: '#20262c', stroke: '#0f1316' }, root);
    el('rect', { x: SX, y: SY, width: SW, height: SH, rx: 5, fill: '#fff' }, root);
    const pl = plot(ST, root, { x: SX + 74, y: SY + 56, w: SW - 116, h: SH - 136 }, kind, { fs: 'clamp(12.5px,1.35vw,15.5px)' });
    const st = ST.label(SX + SW / 2, SY + 24, `${M.name}에 따른 광합성량`, ''); st.e.style.fontSize = 'clamp(13px,1.4vw,16px)';
    const sketch = el('path', { fill: 'none', stroke: '#8b99a7', 'stroke-width': 3.2, 'stroke-dasharray': '2 8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, root);
    const cv = el('path', { fill: 'none', stroke: M.col, 'stroke-width': 4.4, 'stroke-linecap': 'round' }, root);
    const cursor = el('line', { stroke: '#0e63b3', 'stroke-width': 1.6, 'stroke-dasharray': '5 5', y1: pl.b.y, y2: pl.b.y + pl.b.h, opacity: 0 }, root);
    const dots = el('g', null, root);
    const hintL = ST.label(SX + SW / 2 + 20, SY + 250, '여기에 손가락으로<br>예측 곡선을 그려요', 'm'); hintL.e.style.textAlign = 'center'; hintL.e.style.fontSize = 'clamp(14px,1.5vw,17px)';
    /* LED등 */
    const LX = 44, BX = 96, BW = 268, BY = 236, BB = 684;
    shadow(root, BX + BW / 2, 706, 170, 12, .26);
    const cone = el('path', { d: `M${LX + 12} 170L${BX + BW + 8} ${BY}V${BB}L${LX + 12} 630Z`, fill: grad([[0, '#fff2a8', .8], [1, '#fff2a8', .08]], { x2: 1, y2: 0 }) }, root);
    el('path', { d: `M${LX - 34} 702L${LX - 22} 668H${LX + 22}L${LX + 34} 702Z`, fill: grad([[0, '#7a8894'], [1, '#55616c']]), stroke: '#47525c' }, root);
    el('rect', { x: LX - 13, y: 140, width: 26, height: 530, rx: 7, fill: grad([[0, '#8b98a4'], [.5, '#a9b5bf'], [1, '#70808d']], { x2: 1, y2: 0 }), stroke: '#5e6b76' }, root);
    const strip = el('rect', { x: LX + 4, y: 154, width: 7, height: 502, rx: 3.5, fill: '#fff6c0' }, root);
    /* 온도 조절판 */
    const plate = el('rect', { x: BX - 12, y: BB, width: BW + 24, height: 18, rx: 5, fill: '#9aa6b1', stroke: '#6d7a85' }, root);
    /* 밀폐 장치 */
    el('path', { d: `M${BX} ${BY}L${BX + 8} ${BB - 8}Q${BX + 9} ${BB} ${BX + 18} ${BB}H${BX + BW - 18}Q${BX + BW - 9} ${BB} ${BX + BW - 8} ${BB - 8}L${BX + BW} ${BY}Z`, fill: 'rgba(226,238,245,.3)', stroke: '#8ba0b2', 'stroke-width': 2 }, root);
    const lt = el('g', null, root); lettuce(lt, 'g', true, `translate(${BX + BW / 2} ${BB - 22}) scale(.98)`);
    /* 온도계 */
    const thG = el('g', { transform: `translate(${BX + 28} ${BY + 60}) scale(.62)` }, root), thU = factorIcon(thG, 'temp', 0, 0);
    /* 뚜껑·센서 */
    el('rect', { x: BX - 10, y: BY - 18, width: BW + 20, height: 16, rx: 5, fill: grad([[0, '#f6f8fa'], [1, '#d3dce4']]), stroke: '#a4b2bf' }, root);
    el('rect', { x: BX - 6, y: BY - 4, width: BW + 12, height: 6, rx: 3, fill: '#c9483a' }, root);
    [[BX + 72], [BX + BW - 72]].forEach(([x]) => { el('rect', { x: x - 4, y: BY - 18, width: 8, height: 44, fill: '#67737e' }, root); el('rect', { x: x - 24, y: BY - 92, width: 48, height: 74, rx: 7, fill: grad([[0, '#2aa2d6'], [1, '#157eb0']], { x2: 1, y2: 0 }), stroke: '#0f6a95' }, root); el('rect', { x: x - 17, y: BY - 84, width: 34, height: 18, rx: 3, fill: '#16242e' }, root); el('circle', { cx: x, cy: BY - 46, r: 6, fill: '#e9f2f7', stroke: '#0f6a95' }, root); });
    const c1 = ST.label(BX + 72, BY - 108, '이산화 탄소 센서', 'm'), c2 = ST.label(BX + BW - 72, BY - 108, '산소 센서', 'm'); c1.e.style.fontSize = c2.e.style.fontSize = 'clamp(10.5px,1.05vw,12.5px)';
    /* 이산화 탄소 공급: 기체통과 밸브 */
    const lL = ST.label(LX + 8, 122, 'LED등', 'm'), lP = ST.label(BX + BW / 2, 726, '온도 조절판', 'm'), lB = ST.label(SX + SW / 2, 724, '스마트 기기', 'm');
    [lL, lP, lB].forEach((l) => { l.e.style.fontSize = 'clamp(12px,1.25vw,14.5px)'; });
    const mol = el('g', null, root), fl = flock(mol), ambG = el('g', null, mol), R = Math.random;
    const INB = () => [BX + 62 + R() * (BW - 90), BY + 28 + R() * 240];
    const amb = Array.from({ length: 13 }, () => { const b = INB(); return { u: el('use', { href: '#mCO2', opacity: 0 }, ambG), x: b[0], y: b[1], a: R() * 6.28 }; });
    /* 값: 고른 요인만 x. 나머지는 알맞게 고정 */
    let x = M.xs[0], acc = 0, boost = 0, sk = [], skOn = false; const REST = .85;
    const lv = () => ({ L: kind === 'light' ? x : REST, C: kind === 'co2' ? x : REST, T: kind === 'temp' ? x : .62 });
    const hc = (v) => { const a = (p, q) => Math.round(lerp(p, q, v)); return `rgb(${a(70, 214)},${a(132, 80)},${a(200, 52)})`; };
    const paint = () => {
      const v = lv();
      cone.setAttribute('opacity', v.L); strip.setAttribute('opacity', .3 + .7 * v.L);
      plate.setAttribute('fill', hc(v.T)); thU(v.T);
      amb.forEach((a, i) => { a.show = i < Math.round(v.C * amb.length); });
      cursor.setAttribute('x1', pl.sx(x)); cursor.setAttribute('x2', pl.sx(x));
    };
    const svgPt = (e) => { const m = ST.svg.getScreenCTM().inverse(); return [m.a * e.clientX + m.c * e.clientY + m.e, m.b * e.clientX + m.d * e.clientY + m.f]; };
    const skDraw = () => { let d = ''; sk.forEach((p, i) => { d += (i ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]); }); sketch.setAttribute('d', d); };
    let drag = false, onSk = null;
    const inG = (p) => p[0] >= pl.b.x - 8 && p[0] <= pl.b.x + pl.b.w + 12 && p[1] >= pl.b.y - 14 && p[1] <= pl.b.y + pl.b.h + 8;
    ST.svg.addEventListener('pointerdown', (e) => { if (!skOn) return; const p = svgPt(e); if (!inG(p)) return; drag = true; sk = [p]; skDraw(); hintL.show(false); try { ST.svg.setPointerCapture(e.pointerId); } catch (er) {} e.preventDefault(); });
    ST.svg.addEventListener('pointermove', (e) => { if (!drag) return; const p = svgPt(e); p[0] = clamp(p[0], pl.b.x, pl.b.x + pl.b.w); p[1] = clamp(p[1], pl.b.y, pl.b.y + pl.b.h); if (p[0] > sk[sk.length - 1][0] + 2) { sk.push(p); skDraw(); } });
    const up = () => { if (drag) { drag = false; onSk && onSk(sk.length); } };
    ST.svg.addEventListener('pointerup', up); ST.svg.addEventListener('pointercancel', up);
    const api = {
      kind, M,
      sketchMode(v, cb) { skOn = v; onSk = cb; host.style.touchAction = v ? 'none' : ''; hintL.show(v && !sk.length); cursor.setAttribute('opacity', v ? 0 : 1); },
      clearSketch() { sk = []; skDraw(); hintL.show(skOn); },
      get drawn() { return sk.length > 3; },
      setX(v) { x = v; paint(); },
      measure(cb) { boost = 1; tween(900, () => {}, () => { boost = 0; const y = f(x); el('circle', { cx: pl.sx(x), cy: pl.sy(y), r: 7.5, fill: M.col, stroke: '#fff', 'stroke-width': 2.2 }, dots); cb && cb(y); }, (t) => t); },
      dot(v) { el('circle', { cx: pl.sx(v), cy: pl.sy(f(v)), r: 7.5, fill: M.col, stroke: '#fff', 'stroke-width': 2.2 }, dots); },
      curve(cb) { const a = M.xs[0], b = M.xs[M.xs.length - 1]; cursor.setAttribute('opacity', 0); tween(1100, (t) => cv.setAttribute('d', pl.line(a, lerp(a, b, t))), cb); },
      curveNow() { cursor.setAttribute('opacity', 0); cv.setAttribute('d', pl.line(M.xs[0], M.xs[M.xs.length - 1])); },
      get y() { return f(x); },
    };
    paint();
    loop((dt, now) => {
      fl.step(dt);
      amb.forEach((a, i) => { if (!a.show) { a.u.setAttribute('opacity', 0); return; } a.a += (R() - .5) * dt * 2; a.x += Math.cos(a.a) * 16 * dt; a.y += Math.sin(a.a) * 14 * dt; if (a.x < BX + 50) a.a = 0; if (a.x > BX + BW - 26) a.a = 3.14; if (a.y < BY + 24) a.a = 1.57; if (a.y > BY + 270) a.a = -1.57; a.u.setAttribute('opacity', 1); a.u.setAttribute('transform', `translate(${f1(a.x)} ${f1(a.y)}) rotate(${f1(now * 20 + i * 40)}) scale(.62)`); });
      if (skOn) return;
      const v = lv(); acc += dt * rate(v.L, v.C, v.T) * (boost ? 5.5 : 2.2);
      while (acc > 1 && fl.n < 20) {
        acc -= 1;
        const s = amb.filter((a) => a.show); const a = s[Math.floor(R() * s.length)];
        const t = [BX + BW / 2 + (R() - .5) * 90, BB - 60 - R() * 70];
        const from = a ? [a.x, a.y] : INB();
        fl.add('mCO2', [from, t], { dur: 1.1, s: .6, wob: 3, fo: .12, cb: () => fl.add('mO2', [t, [t[0] + (R() - .5) * 40, t[1] - 80], [t[0] + (R() - .5) * 90, BY + 30]], { dur: 1.7, s: .66, wob: 5, fi: .2, fo: .25 }) });
      }
      if (acc > 2) acc = 2;
    });
    return api;
  }

  return { F, rate, META, farm, one, mini, lab, symbols, lettuce };
})();
