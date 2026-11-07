/* ===== 식물의 호흡 그림 도구 RS =====
   토마토는 앞 차시 PS.leafData로 잎을 그리고 줄기·열매·뿌리는 이 수업을 위해 새로 그렸다.
   입자 수와 빠르기는 정한 모형이다. 낮에는 광합성과 호흡이 함께, 밤에는 호흡만 일어난다. */
window.RS = (() => {
  'use strict';
  const { el, grad, leafData, drawLeaf, flock, tween, loop, mk, lerp, clamp, stage, shadow, defs, f1, taper, PAL, REDUCE } = PS;
  let symOK = false;
  function symbols() {
    if (symOK) return; symOK = true;
    const d = defs();
    /* 에너지: 뾰족한 별 */
    const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, r = i % 2 ? 7 : 17; pts.push(`${f1(Math.cos(a) * r)} ${f1(Math.sin(a) * r)}`); }
    const e = el('g', { id: 'mEn' }, d);
    el('path', { d: 'M' + pts.join('L') + 'Z', fill: grad([[0, '#fff3a6'], [.55, '#ffc62e'], [1, '#f08a12']], { r: 1, rr: .55 }), stroke: '#c8700a', 'stroke-width': .8, 'stroke-linejoin': 'round' }, e);
  }
  const TOM = { a: '#2c7f33', b: '#4fa53f', v: '#a2d97f', e: '#1f6329', p: '#4d9a3c', s: '#0b3a14' };
  const TOM2 = { a: '#24712e', b: '#3f9639', v: '#8ecb70', e: '#1a5a25', p: '#4d9a3c', s: '#0b3a14' };
  const LFD = [3, 8, 15].map((seed) => leafData({ L: 92, W: 30, p: .85, q: .72, seed, sec: 6, teeth: .1, nt: 13, nA: 30, vw: 2.8, D: 5, di: 20 }));

  function compound(p, x, y, ang, s, pal, n = 3) {
    const g = el('g', { transform: `translate(${x} ${y}) rotate(${ang}) scale(${s})` }, p);
    const len = 76 * n + 40;
    el('path', { d: `M0 0Q${len * .5} -14 ${len} 6`, fill: 'none', stroke: pal.p, 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    for (let i = 0; i < n; i++) {
      const t = (i + .45) / n, xx = len * t, yy = -14 * 2 * t * (1 - t) + 6 * t * t, ss = .92 - i * .08;
      [-1, 1].forEach((sd, k) => drawLeaf(g, LFD[(i + k) % 3], pal, { tf: `translate(${f1(xx)} ${f1(yy)}) rotate(${sd * 58}) scale(${ss})`, edge: .8, shade: .14, veinOp: .75 }));
    }
    drawLeaf(g, LFD[1], pal, { tf: `translate(${len - 8} 5) rotate(4) scale(1.02)`, edge: .8, shade: .14, veinOp: .75 });
    return g;
  }
  function tomatoFruit(p, x, y, r, ripe) {
    const g = el('g', { transform: `translate(${x} ${y})` }, p);
    el('circle', { r, fill: ripe ? grad([[0, '#ff8a6a'], [.5, '#e5402b'], [1, '#ad2214']], { r: 1, cx: .36, cy: .3, rr: .78 }) : grad([[0, '#c3df75'], [.6, '#8cbc47'], [1, '#5e8f30']], { r: 1, cx: .36, cy: .3, rr: .78 }), stroke: ripe ? '#8d1b10' : '#4f7a28', 'stroke-width': .9 }, g);
    const c = el('g', { fill: '#2f7d2f', stroke: '#1f5c24', 'stroke-width': .6 }, g);
    for (let i = 0; i < 5; i++) el('path', { d: `M0 ${-r + 1}Q${r * .18} ${-r - 2} ${r * .46} ${-r * .72}Q${r * .14} ${-r * .88} 0 ${-r + 1}`, transform: `rotate(${i * 72 - 144} 0 ${-r + 1})` }, c);
    return g;
  }

  /* --- 낮과 밤의 토마토 (그림 Ⅴ-4 형식) --- */
  function tomato(host, o = {}) {
    symbols();
    const ST = stage(host, [0, 0, 1000, 780]); ST.svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    const root = el('g', null, ST.svg);
    /* 하늘 */
    el('rect', { x: -300, y: -300, width: 1600, height: 1300, fill: grad([[0, '#a9d6f3'], [.55, '#def1fb'], [.75, '#f6fbf4']]) }, root);
    const night = el('g', { opacity: 0 }, root);
    el('rect', { x: -300, y: -300, width: 1600, height: 1300, fill: grad([[0, '#0d1a3f'], [.55, '#1e2f63'], [.78, '#3a4a7a']]) }, night);
    const Rs = mk(9); for (let i = 0; i < 90; i++) el('circle', { cx: f1(Rs() * 1200 - 100), cy: f1(Rs() * 540), r: f1(.7 + Rs() * 1.5), fill: '#fff', opacity: f1(.35 + Rs() * .6) }, night);
    const sun = el('g', null, root);
    el('circle', { r: 120, fill: grad([[0, '#fff3b0', .9], [.5, '#fff3b0', .32], [1, '#fff3b0', 0]], { r: 1, rr: .5 }) }, sun);
    el('circle', { r: 44, fill: grad([[0, '#ffe58a'], [.7, '#fbb92e'], [1, '#ef8f14']], { r: 1, cx: .4, cy: .36, rr: .7 }) }, sun);
    const moon = el('g', null, root);
    el('path', { d: 'M18 -38A42 42 0 1 0 18 38A34 34 0 1 1 18 -38Z', fill: grad([[0, '#fff5c9'], [1, '#f1d67c']]), stroke: '#d9b95c', 'stroke-width': .8 }, moon);
    /* 흙 단면과 뿌리 */
    el('path', { d: 'M-300 668Q250 618 500 612T1300 668V1000H-300Z', fill: grad([[0, '#a26a3c'], [.4, '#7f4f2b'], [1, '#5b3519']]) }, root);
    const Rg = mk(21), grains = el('g', null, root); for (let i = 0; i < 120; i++) el('ellipse', { cx: f1(Rg() * 1100 - 50), cy: f1(650 + Rg() * 140), rx: f1(1 + Rg() * 3.5), ry: f1(.8 + Rg() * 1.8), fill: Rg() < .5 ? '#c79462' : '#4a2a13', opacity: .55 }, grains);
    el('path', { d: 'M-300 668Q250 618 500 612T1300 668', fill: 'none', stroke: '#5f8f3a', 'stroke-width': 5, opacity: .55 }, root);
    const roots = el('g', { fill: '#e7d3ad', stroke: '#b89a6c', 'stroke-width': .6 }, root);
    [[[500, 610], [492, 660], [505, 720], [498, 790]], [[498, 628], [450, 665], [400, 680], [335, 735]], [[502, 628], [555, 668], [620, 680], [672, 742]], [[496, 655], [440, 700], [395, 770]], [[505, 655], [560, 705], [598, 785]], [[452, 662], [420, 648], [370, 655]], [[556, 666], [600, 648], [650, 660]]].forEach((a, i) => { el('path', { d: taper(a, i < 3 ? 11 : 7, 1.6) }, roots); });
    /* 줄기·잎 */
    const plant = el('g', null, root);
    shadow(plant, 500, 616, 110, 12, .28);
    const back = el('g', null, plant);
    [[500, 470, 200, .96], [500, 410, -22, .98], [505, 335, 205, .86], [505, 280, -30, .84]].forEach(([x, y, a, s]) => compound(back, x, y, a, s, TOM2));
    const stemPts = [[500, 618], [494, 520], [506, 420], [498, 320], [508, 220], [504, 120]];
    el('path', { d: taper(stemPts, 24, 7), fill: grad([[0, '#3f8a35'], [.5, '#6fb14e'], [1, '#347a2f']], { x2: 1, y2: 0 }), stroke: '#2a6a2b', 'stroke-width': .9 }, plant);
    [[497, 525, -14, 1.02], [500, 520, 194, 1.02], [502, 372, -6, .9], [500, 372, 186, .82], [506, 222, -38, .68], [506, 222, 218, .68], [505, 128, -80, .55]].forEach(([x, y, a, s]) => compound(plant, x, y, a, s, TOM));
    /* 열매 */
    const fruit = el('g', null, plant);
    el('path', { d: 'M504 300Q575 318 610 372M610 372Q640 372 660 386M610 372Q605 410 618 426M560 330Q566 360 580 386', fill: 'none', stroke: '#4d9a3c', 'stroke-width': 4, 'stroke-linecap': 'round' }, fruit);
    [[658, 408, 30, 1], [620, 448, 28, 1], [580, 410, 25, 1]].forEach(([x, y, r, ripe]) => tomatoFruit(fruit, x, y, r, ripe));
    el('path', { d: 'M500 440Q430 452 400 488M400 488Q375 500 362 520M400 488Q410 516 402 534', fill: 'none', stroke: '#4d9a3c', 'stroke-width': 3.6, 'stroke-linecap': 'round' }, fruit);
    [[360, 540, 22, 0], [404, 556, 24, 1]].forEach(([x, y, r, ripe]) => tomatoFruit(fruit, x, y, r, ripe));
    const dimP = el('rect', { x: -300, y: -300, width: 1600, height: 1300, fill: '#0a1636', opacity: 0, 'pointer-events': 'none' }, root);
    const LEAF = [[300, 490], [700, 500], [360, 360], [660, 370], [420, 250], [590, 260], [270, 420], [740, 420]];
    /* 입자 */
    const mol = el('g', null, root), fl = flock(mol), sp = el('g', null, root), R = Math.random;
    const lIn = ST.label(120, 320, '', 'big'), lOut = ST.label(880, 320, '', 'big'), lc = ST.label(500, 748, '', 'bg');
    lIn.e.style.textAlign = 'center'; lOut.e.style.textAlign = 'center';
    const sparks = [];
    const spark = (x, y) => { const u = el('use', { href: '#mEn' }, sp); sparks.push({ u, x, y, t: 0 }); };
    /* 부위 돋보기 */
    const PARTS = { leaf: [340, 420, '잎'], stem: [500, 450, '줄기'], root: [440, 700, '뿌리'], fruit: [640, 420, '열매'] };
    const ring = el('circle', { r: 38, fill: 'none', stroke: '#fff', 'stroke-width': 3, opacity: 0 }, root), ring2 = el('circle', { r: 38, fill: 'none', stroke: '#0e63b3', 'stroke-width': 1.6, opacity: 0 }, root);
    let day = o.day !== false, tt = day ? 1 : 0, showP = true, showR = true, part = null, acc = [0, 0, 0];
    const P = 5, RR = 2.2;
    const place = () => {
      sun.setAttribute('transform', `translate(${f1(lerp(-40, 135, tt))} ${f1(lerp(560, 100, Math.sqrt(tt)))})`);
      sun.setAttribute('opacity', tt);
      moon.setAttribute('transform', `translate(${f1(lerp(820, 880, tt))} ${f1(lerp(110, 420, tt))})`);
      moon.setAttribute('opacity', 1 - tt);
      night.setAttribute('opacity', 1 - tt);
      dimP.setAttribute('opacity', (1 - tt) * .42);
    };
    const words = () => {
      const pOn = day && showP, rOn = showR;
      const w = (k, c) => `<span style="color:${day ? '#14263b' : '#fff'}">${k}</span><br><small style="color:${day ? '#34495e' : '#d7e2f2'}">${c}</small>`;
      if (pOn) { lIn.set(w('이산화 탄소', '흡수')); lOut.set(w('산소', '방출')); }
      else if (rOn) { lIn.set(w('산소', '흡수')); lOut.set(w('이산화 탄소', '방출')); }
      else { lIn.set(''); lOut.set(''); }
      lc.set(pOn && rOn ? '광합성과 호흡이 함께 일어나요' : pOn ? '광합성만 골라 보는 중' : rOn ? (day ? '호흡만 골라 보는 중' : '빛이 없어 호흡만 일어나요') : '보이는 과정을 골라요');
    };
    const inF = () => [[lerp(30, 180, R()), lerp(380, 520, R())], [lerp(220, 280, R()), lerp(330, 500, R())]];
    const outF = (p) => [p, [lerp(p[0], 900, .55), p[1] + (R() - .5) * 60], [lerp(880, 990, R()), lerp(360, 520, R())]];
    const api = {
      ST,
      setDay(v, cb) { day = v; words(); tween(REDUCE ? 0 : 1600, (t) => { tt = v ? t : 1 - t; place(); }, cb); },
      show(p, r) { showP = p; showR = r; words(); },
      focus(k) { part = k; const pp = PARTS[k]; if (!pp) { ring.setAttribute('opacity', 0); ring2.setAttribute('opacity', 0); return; } [ring, ring2].forEach((c) => { c.setAttribute('cx', pp[0]); c.setAttribute('cy', pp[1]); c.setAttribute('opacity', 1); }); },
      jump(v) { day = v; tt = v ? 1 : 0; place(); words(); },
      get day() { return day; },
    };
    place(); words();
    if (o.labels === false) { lc.show(false); lIn.show(false); lOut.show(false); }
    loop((dt) => {
      fl.step(dt);
      for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.t += dt / .9; if (s.t >= 1) { s.u.remove(); sparks.splice(i, 1); continue; } const k = Math.sin(s.t * Math.PI); s.u.setAttribute('transform', `translate(${f1(s.x)} ${f1(s.y)}) scale(${f1(.6 + k * .7)})`); s.u.setAttribute('opacity', f1(k)); }
      const pOn = day && showP && tt > .5, rOn = showR;
      const net = pOn ? (rOn ? P - RR : P) : 0;
      acc[0] += dt * net; acc[1] += dt * (rOn && !pOn ? RR : 0); acc[2] += dt * (rOn ? RR : 0);
      const pick = () => LEAF[Math.floor(R() * LEAF.length)];
      while (acc[0] > 1 && fl.n < 40) { acc[0] -= 1; const t = pick(), [a, b] = inF(); fl.add('mCO2', [a, b, t], { dur: 1.9, s: 1.05, wob: 6, fi: .15, fo: .08, cb: () => fl.add('mO2', outF(pick()), { dur: 2.2, s: 1.1, wob: 7, fi: .2, fo: .2 }) }); }
      while (acc[1] > 1 && fl.n < 40) { acc[1] -= 1; const t = pick(), [a, b] = inF(); fl.add('mO2', [a, b, t], { dur: 2.1, s: 1.1, wob: 6, fi: .15, fo: .08, cb: () => fl.add('mCO2', outF(pick()), { dur: 2.2, s: 1.05, wob: 7, fi: .2, fo: .2 }) }); }
      while (acc[2] > 1) { acc[2] -= 1; const q = R() < .22 ? [lerp(430, 570, R()), lerp(650, 720, R())] : pick(); spark(q[0] + (R() - .5) * 40, q[1] + (R() - .5) * 40); if (pOn) { const a = pick(), b = pick(); fl.add('mO2', [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 40], b], { dur: 1.6, s: .66, fi: .2, fo: .2 }); } }
      if (acc[0] > 3) acc[0] = 3; if (acc[1] > 3) acc[1] = 3;
    });
    return api;
  }

  /* --- 호흡 식 입자 그림 --- */
  function eq(host) {
    symbols();
    const ST = stage(host, [0, 0, 1000, 400]), root = el('g', null, ST.svg);
    el('rect', { width: 1000, height: 400, fill: '#fff' }, root);
    const D = leafData({ L: 880, W: 195, p: .9, q: .72, seed: 5, sec: 8, nA: 150, vw: 6, D: 12, di: 70 });
    drawLeaf(root, D, { a: '#c9e6ae', b: '#def0c9', v: '#f1f8e7', e: '#a4cd83', s: '#74a55b' }, { tf: 'translate(60 190)', edge: 1, shade: .05, veinOp: .9 });
    const g = el('g', null, root);
    const use = (n, s) => el('use', { href: '#' + n, 'data-s': s }, g);
    const glu = use('mGlu', 3.3), oo = [use('mO2', 1.6), use('mO2', 1.6), use('mO2', 1.6)];
    const cc = [use('mCO2', 1.5), use('mCO2', 1.5)], hh = [use('mH2O', 1.6), use('mH2O', 1.6)];
    const en = use('mEn', 2.3);
    const put = (u, x, y, a, rot = 0) => { u.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) rotate(${rot}) scale(${u.dataset.s})`); u.setAttribute('opacity', f1(a)); };
    const l1 = ST.label(205, 330, '양분(포도당)'), l2 = ST.label(395, 330, '산소'), l3 = ST.label(650, 330, '이산화 탄소'), l4 = ST.label(800, 330, '물'), l5 = ST.label(905, 110, '에너지');
    const plus = ST.label(305, 190, '+', 'big'), ar = ST.label(525, 190, '→', 'big'); ar.e.style.fontSize = plus.e.style.fontSize = 'clamp(20px,3vw,30px)';
    const draw = (t) => {
      const a = clamp(t * 2), b = clamp(t * 2 - 1);
      put(glu, lerp(205, 500, a), 190, 1 - clamp(a * 2 - 1.2));
      oo.forEach((o, i) => put(o, lerp(395, 500, a) + (1 - a) * [0, -18, 26][i], 190 + (1 - a) * [-62, 58, 30][i], 1 - clamp(a * 2 - 1.2), i * 40));
      cc.forEach((c, i) => put(c, lerp(500, 650, b), 190 + b * [-48, 48][i], b, i ? 30 : -20));
      hh.forEach((h, i) => put(h, lerp(500, 800, b), 190 + b * [-44, 44][i], b));
      put(en, lerp(500, 905, b), lerp(190, 175, b), b, b * 90);
      l3.show(b > .5); l4.show(b > .5); l5.show(b > .5); l1.show(a < .5); l2.show(a < .5); plus.show(a < .5); ar.show(false);
    };
    draw(0);
    return { play(cb) { tween(3600, draw, cb, (x) => x); }, reset() { draw(0); } };
  }

  /* --- 광합성·호흡 순환 잎 (177쪽 형식) --- */
  function cycle(host, o = {}) {
    symbols();
    const ST = stage(host, [0, 12, 1000, 640]), root = el('g', null, ST.svg);
    el('rect', { y: -200, width: 1000, height: 1100, fill: '#fff' }, root);
    const sun = el('g', { transform: 'translate(112 92)' }, root);
    el('path', { d: 'M40 30L420 180V520L-10 110Z', fill: grad([[0, '#fff0a0', .75], [1, '#fff0a0', .1]], { x1: 0, y1: 0, x2: 1, y2: .7 }) }, sun);
    el('circle', { r: 58, fill: grad([[0, '#ffe58a'], [.7, '#fbb92e'], [1, '#ef8f14']], { r: 1, cx: .4, cy: .36, rr: .7 }) }, sun);
    const D = leafData({ L: 760, W: 245, p: .85, q: .72, seed: 13, sec: 9, teeth: .025, nt: 34, nA: 220, vw: 9, D: 12, di: 60 });
    drawLeaf(root, D, { a: '#67b24f', b: '#8ecb63', v: '#c7eaa1', e: '#3f8a35', p: '#4d9a3c', s: '#1c5a22' }, { tf: 'translate(150 380) rotate(-6)', pet: 90, petW: 13, petY: 26, edge: 1.5, shade: .12, veinOp: .75 });
    /* 네 자리 */
    const POS = { glu: [440, 225], o2: [650, 225], h2o: [440, 505], co2: [650, 505] };
    const mk2 = (n, x, y, s) => el('use', { href: '#' + n, transform: `translate(${x} ${y}) scale(${s})` }, root);
    const A = { glu: mk2('mGlu', POS.glu[0], POS.glu[1], 3), o2: mk2('mO2', POS.o2[0], POS.o2[1], 1.9), h2o: mk2('mH2O', POS.h2o[0], POS.h2o[1], 1.9), co2: mk2('mCO2', POS.co2[0], POS.co2[1], 1.9) };
    const lb = (x, y, t) => { const l = ST.label(x, y, t, 'bg'); return l; };
    lb(POS.glu[0], POS.glu[1] + 56, '포도당'); lb(POS.o2[0], POS.o2[1] + 40, '산소'); lb(POS.h2o[0], POS.h2o[1] + 42, '물'); lb(POS.co2[0], POS.co2[1] + 40, '이산화 탄소');
    ST.label(545, POS.glu[1], '+', 'big lt'); ST.label(545, POS.h2o[1], '+', 'big lt');
    ST.label(190, 200, '빛에너지', 'bg');
    /* 화살표: 고른 과정 하나만 */
    const arrP = el('path', { d: 'M360 480Q280 365 360 250', fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: .35 }, root);
    const arrR = el('path', { d: 'M730 250Q810 365 730 480', fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: .35 }, root);
    const heads = [el('path', { d: 'M342 268L362 240L376 272Z', fill: '#fff', opacity: .35 }, root), el('path', { d: 'M748 462L728 490L714 458Z', fill: '#fff', opacity: .35 }, root)];
    const tP = ST.label(262, 365, '광합성', 'big lt'), tR = ST.label(828, 365, '호흡', 'big lt');
    const en = el('use', { href: '#mEn', transform: 'translate(905 365) scale(3.4)', opacity: .25 }, root), tE = ST.label(905, 440, '에너지', 'bg');
    const fl = flock(root); loop((dt) => fl.step(dt));
    const pulse = (ks, on) => ks.forEach((k) => A[k].setAttribute('opacity', on ? 1 : .35));
    const api = {
      mode(k) {
        arrP.setAttribute('opacity', k === 'p' ? 1 : .35); heads[0].setAttribute('opacity', k === 'p' ? 1 : .35);
        arrR.setAttribute('opacity', k === 'r' ? 1 : .35); heads[1].setAttribute('opacity', k === 'r' ? 1 : .35);
        en.setAttribute('opacity', k === 'r' ? 1 : .25); sun.setAttribute('opacity', k === 'r' ? .35 : 1);
      },
      play(k, cb) {
        api.mode(k);
        const from = k === 'p' ? ['h2o', 'co2'] : ['glu', 'o2'], to = k === 'p' ? ['glu', 'o2'] : ['h2o', 'co2'];
        pulse(to, false); pulse(from, true);
        const n = { glu: 'mGlu', o2: 'mO2', h2o: 'mH2O', co2: 'mCO2' };
        const mid = k === 'p' ? [300, 365] : [790, 365];
        to.forEach((t, i) => fl.add(n[t], [POS[from[i]], mid, POS[t]], { dur: 1.6, s: t === 'glu' ? 3 : 1.9, spin: 0, rot: 0, fi: 0, ez: PS.ease }));
        if (k === 'r') { tween(1200, (t) => en.setAttribute('transform', `translate(905 365) scale(${f1(3.4 + Math.sin(t * Math.PI) * 1.2)})`)); }
        setTimeout(() => { pulse(to, true); cb && cb(); }, REDUCE ? 0 : 1650);
      },
    };
    api.mode(o.mode || 'none');
    return api;
  }

  /* --- 밀폐 장치 낮과 밤 측정 --- */
  function room(host) {
    symbols(); PF.symbols();
    const ST = stage(host, [0, 62, 1000, 690]), root = el('g', null, ST.svg);
    PS.bench(root, 700);
    const SX = 448, SY = 88, SW = 528, SH = 570;
    shadow(root, SX + SW / 2, 706, 250, 14, .22);
    el('path', { d: `M${SX + SW / 2 - 60} ${SY + SH + 14}L${SX + SW / 2 - 96} 702H${SX + SW / 2 + 96}L${SX + SW / 2 + 60} ${SY + SH + 14}Z`, fill: grad([[0, '#cdd6de'], [1, '#a9b6c2']]), stroke: '#94a3b0' }, root);
    el('rect', { x: SX - 14, y: SY - 14, width: SW + 28, height: SH + 28, rx: 20, fill: '#20262c', stroke: '#0f1316' }, root);
    el('rect', { x: SX, y: SY, width: SW, height: SH, rx: 5, fill: '#fff' }, root);
    const gx = SX + 66, gy = SY + 60, gw = SW - 98, gh = SH - 140;
    const bandG = el('g', null, root);
    const gr = el('g', { stroke: '#e9eff4' }, root); for (let i = 1; i < 4; i++) el('line', { x1: gx, x2: gx + gw, y1: gy + gh * i / 4, y2: gy + gh * i / 4 }, gr);
    for (let i = 1; i < 4; i++) el('line', { x1: gx + gw * i / 4, x2: gx + gw * i / 4, y1: gy, y2: gy + gh, stroke: '#dfe6ec', 'stroke-dasharray': '4 5' }, root);
    el('path', { d: `M${gx} ${gy}V${gy + gh}H${gx + gw}`, fill: 'none', stroke: '#34495e', 'stroke-width': 1.8 }, root);
    const stl = ST.label(SX + SW / 2, SY + 26, '밀폐 장치 속 기체의 농도', ''); stl.e.style.fontSize = 'clamp(13px,1.4vw,16px)';
    const yl = ST.label(gx - 30, gy + gh / 2, '농도', 'm'); yl.e.style.writingMode = 'vertical-rl';
    const xl = ST.label(gx + gw, gy + gh + 22, '시간', 'la m');
    const CO = '#39424c', OC = '#d9472f';
    const lC = el('path', { fill: 'none', stroke: CO, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, root), lO = el('path', { fill: 'none', stroke: OC, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, root);
    const tC = ST.label(gx, gy, '이산화 탄소', ''), tO = ST.label(gx, gy, '산소', ''); tC.e.style.color = CO; tO.e.style.color = OC; tC.e.style.fontSize = tO.e.style.fontSize = 'clamp(12.5px,1.35vw,15px)';
    const px = (t) => gx + gw * t, py = (v) => gy + gh * (1 - v);
    /* LED·장치 */
    const LX = 44, BX = 96, BW = 268, BY = 236, BB = 684;
    shadow(root, BX + BW / 2, 706, 170, 12, .26);
    const cone = el('path', { d: `M${LX + 12} 170L${BX + BW + 8} ${BY}V${BB}L${LX + 12} 630Z`, fill: grad([[0, '#fff2a8', .85], [1, '#fff2a8', .08]], { x2: 1, y2: 0 }), opacity: 0 }, root);
    el('path', { d: `M${LX - 34} 702L${LX - 22} 668H${LX + 22}L${LX + 34} 702Z`, fill: grad([[0, '#7a8894'], [1, '#55616c']]), stroke: '#47525c' }, root);
    el('rect', { x: LX - 13, y: 140, width: 26, height: 530, rx: 7, fill: grad([[0, '#8b98a4'], [.5, '#a9b5bf'], [1, '#70808d']], { x2: 1, y2: 0 }), stroke: '#5e6b76' }, root);
    const strip = el('rect', { x: LX + 4, y: 154, width: 7, height: 502, rx: 3.5, fill: '#c8d2da' }, root);
    const shade = el('path', { d: `M${BX} ${BY}L${BX + 8} ${BB - 8}Q${BX + 9} ${BB} ${BX + 18} ${BB}H${BX + BW - 18}Q${BX + BW - 9} ${BB} ${BX + BW - 8} ${BB - 8}L${BX + BW} ${BY}Z`, fill: '#17233d', opacity: 0, style: 'transition:opacity .6s' }, root);
    el('path', { d: `M${BX} ${BY}L${BX + 8} ${BB - 8}Q${BX + 9} ${BB} ${BX + 18} ${BB}H${BX + BW - 18}Q${BX + BW - 9} ${BB} ${BX + BW - 8} ${BB - 8}L${BX + BW} ${BY}Z`, fill: 'rgba(226,238,245,.28)', stroke: '#8ba0b2', 'stroke-width': 2 }, root);
    PF.lettuce(root, 'g', true, `translate(${BX + BW / 2} ${BB - 22}) scale(.98)`);
    el('rect', { x: BX - 10, y: BY - 18, width: BW + 20, height: 16, rx: 5, fill: grad([[0, '#f6f8fa'], [1, '#d3dce4']]), stroke: '#a4b2bf' }, root);
    el('rect', { x: BX - 6, y: BY - 4, width: BW + 12, height: 6, rx: 3, fill: '#c9483a' }, root);
    [BX + 72, BX + BW - 72].forEach((x) => { el('rect', { x: x - 4, y: BY - 18, width: 8, height: 44, fill: '#67737e' }, root); el('rect', { x: x - 24, y: BY - 92, width: 48, height: 74, rx: 7, fill: grad([[0, '#2aa2d6'], [1, '#157eb0']], { x2: 1, y2: 0 }), stroke: '#0f6a95' }, root); el('rect', { x: x - 17, y: BY - 84, width: 34, height: 18, rx: 3, fill: '#16242e' }, root); el('circle', { cx: x, cy: BY - 46, r: 6, fill: '#e9f2f7', stroke: '#0f6a95' }, root); });
    const c1 = ST.label(BX + 72, BY - 108, '이산화 탄소 센서', 'm'), c2 = ST.label(BX + BW - 72, BY - 108, '산소 센서', 'm'); c1.e.style.fontSize = c2.e.style.fontSize = 'clamp(10.5px,1.05vw,12.5px)';
    ST.label(LX + 8, 122, 'LED등', 'm').e.style.fontSize = 'clamp(12px,1.25vw,14.5px)';
    ST.label(BX + BW / 2, 726, '투명 밀폐 장치와 상추', 'm').e.style.fontSize = 'clamp(12px,1.25vw,14.5px)';
    ST.label(SX + SW / 2, 726, '스마트 기기', 'm').e.style.fontSize = 'clamp(12px,1.25vw,14.5px)';
    /* 입자 */
    const mol = el('g', null, root), R = Math.random, mols = [];
    const INB = () => [BX + 30 + R() * (BW - 60), BY + 24 + R() * 250];
    const LS = [[BX + BW / 2, BB - 80], [BX + BW / 2 - 50, BB - 60], [BX + BW / 2 + 50, BB - 60], [BX + BW / 2, BB - 110]];
    const add = (k, at) => { const b = at || INB(); const a = R() * 6.28; const u = el('use', { href: k === 'c' ? '#mCO2' : '#mO2' }, mol); const m = { u, k, x: b[0], y: b[1], a, seek: null }; mols.push(m); return m; };
    /* 값 */
    const SEG = 4; let t = 0, O = .3, C = .7, ptsO = [[0, .3]], ptsC = [[0, .7]], running = false, light = false, cbF = null, segEnd = 0, segO = 0, segC = 0, t0 = 0, o0 = 0, c0 = 0, bands = 0;
    for (let i = 0; i < 12; i++) add('c'); for (let i = 0; i < 6; i++) add('o');
    const pathD = (a) => a.map((p, i) => (i ? 'L' : 'M') + f1(px(p[0])) + ' ' + f1(py(p[1]))).join('');
    const redraw = () => {
      lO.setAttribute('d', pathD(ptsO)); lC.setAttribute('d', pathD(ptsC));
      const a = ptsO[ptsO.length - 1], b = ptsC[ptsC.length - 1];
      const ly = (v, o) => py(v) + (v > o ? -16 : 16);
      tO.move(clamp(px(a[0]) + 2, gx + 24, gx + gw - 40), ly(a[1], b[1])); tC.move(clamp(px(b[0]) + 2, gx + 46, gx + gw - 50), ly(b[1], a[1]));
    };
    const syncM = () => {
      const wC = Math.round(lerp(2, 18, C)), wO = Math.round(lerp(2, 18, O));
      const nC = mols.filter((m) => m.k === 'c' && !m.seek).length, nO = mols.filter((m) => m.k === 'o' && !m.seek).length;
      if (nC > wC) { const m = mols.find((x) => x.k === 'c' && !x.seek); m.seek = LS[Math.floor(R() * 4)]; }
      if (nO > wO) { const m = mols.find((x) => x.k === 'o' && !x.seek); m.seek = LS[Math.floor(R() * 4)]; }
      if (nC < wC) add('c', LS[Math.floor(R() * 4)]);
      if (nO < wO) add('o', LS[Math.floor(R() * 4)]);
    };
    const api = {
      setLight(v) { light = v; cone.setAttribute('opacity', v ? 1 : 0); strip.setAttribute('fill', v ? '#fff6c0' : '#c8d2da'); shade.setAttribute('opacity', v ? 0 : .16); },
      run(on, cb) {
        api.setLight(on); cbF = cb; running = true; t0 = t; o0 = O; c0 = C; segEnd = t + 1 / SEG; segO = on ? .14 : -.06; segC = on ? -.14 : .06;
        const b = el('rect', { x: px(t), y: gy, width: gw / SEG, height: gh, fill: on ? '#fff6cf' : '#dfe5f1', opacity: .7 }, bandG);
        const tag = ST.label(px(t + .5 / SEG), gy + 14, on ? '켬' : '끔', 'm'); tag.e.style.fontSize = 'clamp(11.5px,1.2vw,13.5px)';
        bands++;
      },
      jump(list) { list.forEach((on) => { api.setLight(on); const b = el('rect', { x: px(t), y: gy, width: gw / SEG, height: gh, fill: on ? '#fff6cf' : '#dfe5f1', opacity: .7 }, bandG); const tag = ST.label(px(t + .5 / SEG), gy + 14, on ? '켬' : '끔', 'm'); tag.e.style.fontSize = 'clamp(11.5px,1.2vw,13.5px)'; t += 1 / SEG; O += on ? .14 : -.06; C += on ? -.14 : .06; ptsO.push([t, O]); ptsC.push([t, C]); }); redraw(); },
      get left() { return SEG - Math.round(t * SEG); },
      get O() { return O; }, get C() { return C; },
    };
    redraw();
    let Dur = REDUCE ? .1 : 3.4;
    loop((dt, now) => {
      if (running) {
        t = Math.min(segEnd, t + dt / (Dur * SEG));
        const u = clamp((t - t0) * SEG); O = o0 + segO * u; C = c0 + segC * u;
        ptsO.push([t, O + (R() - .5) * .004]); ptsC.push([t, C + (R() - .5) * .004]); redraw();
        if (t >= segEnd - 1e-6) { running = false; const f = cbF; cbF = null; f && f(); }
      }
      if (Math.floor(now * 8) % 2 === 0) syncM();
      for (let i = mols.length - 1; i >= 0; i--) {
        const m = mols[i];
        if (m.seek) { const dx = m.seek[0] - m.x, dy = m.seek[1] - m.y, d = Math.hypot(dx, dy) || 1; m.x += dx / d * 110 * dt; m.y += dy / d * 110 * dt; if (d < 8) { m.u.remove(); mols.splice(i, 1); continue; } }
        else { m.a += (R() - .5) * dt * 3; m.x += Math.cos(m.a) * 17 * dt; m.y += Math.sin(m.a) * 15 * dt; if (m.x < BX + 28) m.a = 0; if (m.x > BX + BW - 28) m.a = 3.14; if (m.y < BY + 24) m.a = 1.57; if (m.y > BY + 300) m.a = -1.57; }
        m.u.setAttribute('transform', `translate(${f1(m.x)} ${f1(m.y)}) scale(.62)`);
      }
    });
    return api;
  }
  return { tomato, eq, cycle, room, symbols };
})();
