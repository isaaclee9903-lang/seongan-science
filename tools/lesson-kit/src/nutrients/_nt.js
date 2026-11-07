/* ===== 영양소 그림 도구 NT: 24홈판·시험관·식판·음식. 모두 새로 그림 =====
   검출 결과와 영양소 양은 교과서에 수치가 없어 눈금 없는 모형으로 정한 값이다. */
window.NT = (() => {
  'use strict';
  const { el, grad, tween, loop, lerp, clamp, stage, shadow, f1, mk, REDUCE } = PS;
  const FOODS = [
    { k: 'water', n: '증류수', base: '#eaf4fa', o: .35 }, { k: 'apple', n: '사과주스', base: '#efd27a', o: .9 }, { k: 'oil', n: '식용유', base: '#f3dc63', o: .92 },
    { k: 'milk', n: '우유', base: '#fbf9f0', o: 1 }, { k: 'bread', n: '빵', base: '#d9ad6d', o: 1, solid: true }, { k: 'prot', n: '단백질 음료', base: '#e6d9bd', o: 1 },
  ];
  const RG = {
    iodine: { n: '아이오딘-아이오딘화 칼륨 용액', s: '아이오딘', neg: '#c58a2a', pos: '#23245c', word: '청람색', what: '녹말', drop: '#c58a2a' },
    biuret: { n: '뷰렛 용액', s: '뷰렛', neg: '#8fc7e8', pos: '#6b3fa0', word: '보라색', what: '단백질', drop: '#8fc7e8' },
    sudan: { n: '수단 Ⅲ 용액', s: '수단 Ⅲ', neg: '#ec9f83', pos: '#e5261f', word: '선홍색', what: '지방', drop: '#d9362b' },
    bene: { n: '베네딕트 용액', s: '베네딕트', neg: '#3f9bd8', pos: '#d9681e', word: '황적색', what: '포도당', drop: '#3f9bd8' },
  };
  /* 0 변화 없음, 1 조금, 2 뚜렷 */
  const RES = {
    water: { iodine: 0, biuret: 0, sudan: 0, bene: 0 }, apple: { iodine: 0, biuret: 0, sudan: 0, bene: 2 }, oil: { iodine: 0, biuret: 0, sudan: 2, bene: 0 },
    milk: { iodine: 0, biuret: 2, sudan: 1, bene: 1 }, bread: { iodine: 2, biuret: 1, sudan: 0, bene: 0 }, prot: { iodine: 0, biuret: 2, sudan: 0, bene: 0 },
  };
  const mix = (a, b, t) => { const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`; };
  const colorOf = (r, lv) => (lv === 2 ? RG[r].pos : lv === 1 ? mix(RG[r].neg, RG[r].pos, .5) : RG[r].neg);

  /* --- 검출 실험대 --- */
  function bench(host) {
    const ST = stage(host, [0, 0, 1000, 800]), root = el('g', null, ST.svg);
    PS.bench(root, 770);
    /* 활동지 + 24홈판 */
    const PX = 168, PY = 62, CW = 130, RH = 112, COLS = 6, ROWS = 3;
    shadow(root, PX + CW * 3, PY + RH * 3 + 30, 420, 14, .18);
    el('rect', { x: PX - 14, y: PY - 14, width: CW * COLS + 28, height: RH * ROWS + 28, rx: 16, fill: grad([[0, '#f7fbfd'], [1, '#dde8ef']]), stroke: '#a9bac7', 'stroke-width': 1.4 }, root);
    const wells = {};
    const keys = ['iodine', 'biuret', 'sudan'];
    keys.forEach((r, ri) => {
      const lb = ST.label(PX - 26, PY + RH * (ri + .5), RG[r].s, 'la'); lb.e.style.fontSize = 'clamp(11px,1.25vw,14.5px)';
      FOODS.forEach((fd, ci) => {
        const cx = PX + CW * (ci + .5), cy = PY + RH * (ri + .5), g = el('g', { class: 'tap', 'data-r': r, 'data-c': fd.k }, root);
        el('circle', { cx, cy, r: 46, fill: grad([[0, '#cdd9e2'], [.86, '#f4f8fa'], [1, '#b6c5d1']], { r: 1, rr: .5 }), stroke: '#8fa3b2', 'stroke-width': 1.2 }, g);
        el('circle', { cx, cy, r: 38, fill: fd.base, opacity: fd.o }, g);
        if (fd.solid) { const R = mk(ci * 7 + ri + 3); for (let i = 0; i < 10; i++) el('ellipse', { cx: f1(cx + (R() - .5) * 42), cy: f1(cy + (R() - .5) * 42), rx: f1(5 + R() * 7), ry: f1(4 + R() * 5), fill: R() < .5 ? '#cf9e5a' : '#e6c088', stroke: '#b48443', 'stroke-width': .5 }, g); }
        const c = el('circle', { cx, cy, r: 0, fill: colorOf(r, RES[fd.k][r]), opacity: .94 }, g);
        wells[r + fd.k] = { cx, cy, c, done: false };
      });
    });
    FOODS.forEach((fd, ci) => { const l = ST.label(PX + CW * (ci + .5), PY - 28, fd.n, ''); l.e.style.fontSize = 'clamp(11px,1.25vw,14.5px)'; });
    /* 베네딕트: 시험관과 뜨거운 물 */
    const BY = 430, TH = 200;
    const bk = el('g', null, root);
    const bx = PX - 10, bw = CW * COLS + 20, wTop = 560, bBot = 762;
    el('path', { d: `M${bx} 508V${bBot - 12}Q${bx} ${bBot} ${bx + 12} ${bBot}H${bx + bw - 12}Q${bx + bw} ${bBot} ${bx + bw} ${bBot - 12}V508`, fill: 'rgba(226,238,245,.35)', stroke: '#8ba0b2', 'stroke-width': 2 }, bk);
    const water = el('rect', { x: bx + 2, y: wTop, width: bw - 4, height: bBot - wTop - 2, rx: 8, fill: grad([[0, '#cfe7f4'], [1, '#a9d2e8']]), opacity: .85 }, bk);
    const tubes = {}, tubeG = el('g', null, root);
    FOODS.forEach((fd, ci) => {
      const cx = PX + CW * (ci + .5), g = el('g', { class: 'tap', 'data-r': 'bene', 'data-c': fd.k }, tubeG);
      const clipId = PS.nid('cl'); const defsC = el('clipPath', { id: clipId }, g); el('path', { d: `M${cx - 21} ${BY}V${BY + TH - 21}A21 21 0 0 0 ${cx + 21} ${BY + TH - 21}V${BY}Z` }, defsC);
      const liq = el('rect', { x: cx - 22, y: BY + 80, width: 44, height: TH, fill: fd.base, 'clip-path': `url(#${clipId})` }, g);
      el('path', { d: `M${cx - 21} ${BY}V${BY + TH - 21}A21 21 0 0 0 ${cx + 21} ${BY + TH - 21}V${BY}`, fill: 'rgba(255,255,255,.18)', stroke: '#7f94a5', 'stroke-width': 1.6 }, g);
      el('ellipse', { cx, cy: BY, rx: 23, ry: 4.5, fill: '#f1f6f9', stroke: '#7f94a5', 'stroke-width': 1.4 }, g);
      tubes[fd.k] = { cx, liq, base: fd.base, dropped: false };
    });
    const temp = ST.label(PX + CW * 5, 524, '약 90 ℃의 물', 'm'); temp.e.style.fontSize = 'clamp(11px,1.2vw,14px)'; temp.show(false);
    water.setAttribute('opacity', 0);
    const lbB = ST.label(PX - 26, BY + 90, RG.bene.s, 'la'); lbB.e.style.fontSize = 'clamp(11px,1.25vw,14.5px)';
    /* 스포이트 */
    const dp = el('g', { opacity: 0 }, root);
    el('rect', { x: -7, y: -118, width: 14, height: 34, rx: 6, fill: '#3c4650' }, dp);
    el('path', { d: 'M-5 -84H5L2 -14H-2Z', fill: 'rgba(235,245,250,.75)', stroke: '#7f94a5' }, dp);
    const dpL = el('path', { d: 'M-4 -60H4L2 -14H-2Z', fill: RG.iodine.drop }, dp);
    const dropU = el('circle', { r: 6, fill: RG.iodine.drop, opacity: 0 }, root);
    /* 김 */
    const steam = el('g', { opacity: 0 }, root), St = Array.from({ length: 12 }, (_, i) => ({ u: el('circle', { r: 10, fill: '#fff' }, steam), x: bx + 40 + i * (bw - 80) / 11, t: i / 12 }));
    let busy = 0, heated = false;
    const setDrop = (c) => { dpL.setAttribute('fill', c); dropU.setAttribute('fill', c); };
    const api = {
      ST, wells, tubes,
      drop(r, food, cb) {
        const W = r === 'bene' ? { cx: tubes[food].cx, cy: BY - 8 } : wells[r + food]; setDrop(RG[r].drop);
        if (r !== 'bene' && W.done) { cb && cb(false); return; } if (r === 'bene' && tubes[food].dropped) { cb && cb(false); return; }
        busy++; dp.setAttribute('opacity', 1); const y0 = W.cy - (r === 'bene' ? 6 : 34);
        dp.setAttribute('transform', `translate(${W.cx} ${y0})`);
        const fall = () => { dropU.setAttribute('cx', W.cx); dropU.setAttribute('opacity', 1); tween(REDUCE ? 0 : 260, (t) => dropU.setAttribute('cy', lerp(y0 - 8, W.cy + (r === 'bene' ? 90 : 0), t * t)), () => {
          dropU.setAttribute('opacity', 0);
          if (r === 'bene') { const T = tubes[food]; T.dropped = true; tween(REDUCE ? 0 : 500, (t) => T.liq.setAttribute('fill', mix(T.base.length === 7 ? T.base : '#ffffff', RG.bene.neg, t))); }
          else { W.done = true; tween(REDUCE ? 0 : 700, (t) => W.c.setAttribute('r', f1(38 * Math.sqrt(t)))); }
          busy--; if (!busy) dp.setAttribute('opacity', 0); cb && cb(true);
        }, (x) => x); };
        setTimeout(fall, REDUCE ? 0 : 120);
      },
      heat(cb) {
        heated = true; water.setAttribute('opacity', .85); steam.setAttribute('opacity', .55); temp.show(true);
        tween(REDUCE ? 0 : 900, (t) => tubeG.setAttribute('transform', `translate(0 ${f1(t * 52)})`), () => {
          let n = 0; FOODS.forEach((fd) => { const T = tubes[fd.k], lv = RES[fd.k].bene; if (lv) tween(REDUCE ? 0 : 2200, (t) => T.liq.setAttribute('fill', mix(RG.bene.neg, lv === 2 ? RG.bene.pos : '#8fa25f', t))); });
          setTimeout(() => cb && cb(), REDUCE ? 0 : 2300);
        });
      },
      fill() { keys.forEach((r) => FOODS.forEach((fd) => { const W = wells[r + fd.k]; W.done = true; W.c.setAttribute('r', 38); })); FOODS.forEach((fd) => { const T = tubes[fd.k], lv = RES[fd.k].bene; T.dropped = true; T.liq.setAttribute('fill', lv === 2 ? RG.bene.pos : lv ? '#8fa25f' : RG.bene.neg); }); tubeG.setAttribute('transform', 'translate(0 52)'); water.setAttribute('opacity', .85); steam.setAttribute('opacity', .55); temp.show(true); heated = true; },
    };
    loop((dt) => { if (!heated) return; St.forEach((s) => { s.t = (s.t + dt * .25) % 1; s.u.setAttribute('cx', f1(s.x + Math.sin(s.t * 6) * 8)); s.u.setAttribute('cy', f1(508 - s.t * 60)); s.u.setAttribute('r', f1(5 + s.t * 11)); s.u.setAttribute('opacity', f1((1 - s.t) * .7)); }); });
    return api;
  }

  /* --- 음식 그림 (120×90 칸 안, 가운데 0,0) --- */
  const blob = (g, a) => el('path', a, g);
  const DRAW = {
    rice(g) { blob(g, { d: 'M-52 16C-52 -22 -20 -36 2 -36C30 -36 54 -20 52 16Z', fill: grad([[0, '#ffffff'], [1, '#e8e4d8']]), stroke: '#bfb9a7', 'stroke-width': .8 }); const R = mk(2); for (let i = 0; i < 46; i++) { const x = (R() - .5) * 92, y = -30 + R() * 44; if (y < -36 + Math.abs(x) * .4) continue; el('ellipse', { cx: f1(x), cy: f1(y), rx: 3.6, ry: 1.7, transform: `rotate(${f1(R() * 180)} ${f1(x)} ${f1(y)})`, fill: '#fff', stroke: '#cfc9b8', 'stroke-width': .4 }, g); } },
    bread(g) { blob(g, { d: 'M-46 28V-6C-58 -12 -56 -34 -36 -34H36C56 -34 58 -12 46 -6V28Z', fill: '#c98f4c', stroke: '#8e5e27' }); blob(g, { d: 'M-40 24V-8C-50 -14 -48 -28 -33 -28H33C48 -28 50 -14 40 -8V24Z', fill: grad([[0, '#f7e7c4'], [1, '#ecd5a4']]) }); },
    egg(g) { [-40, -14, 12, 38].forEach((x, i) => { el('rect', { x: x - 13, y: -22, width: 26, height: 44, rx: 8, fill: grad([[0, '#ffe07a'], [1, '#f2bf3c']]), stroke: '#c8922a' }, g); el('path', { d: `M${x} -12a7 12 0 0 1 0 24`, fill: 'none', stroke: '#e0a63a', 'stroke-width': 1.3 }, g); }); },
    meat(g) { blob(g, { d: 'M-50 6C-48 -22 -14 -30 16 -26C44 -22 56 -6 50 12C40 30 -38 30 -50 6Z', fill: grad([[0, '#a85a3f'], [1, '#6c3322']]), stroke: '#4d2214' }); [-24, 0, 24].forEach((x) => el('path', { d: `M${x} -18l10 34`, stroke: '#3f1b0e', 'stroke-width': 3, opacity: .55 }, g)); },
    fish(g) { blob(g, { d: 'M-54 2C-30 -24 22 -24 42 -2L60 -18V18L42 2C22 24 -30 26 -54 2Z', fill: grad([[0, '#c9d6de'], [.5, '#90a7b5'], [1, '#6b8494']]), stroke: '#4c6372' }); el('circle', { cx: -36, cy: -3, r: 3.6, fill: '#1f2b33' }, g); [-14, 2, 18].forEach((x) => el('path', { d: `M${x} -12q6 12 0 24`, fill: 'none', stroke: '#5a7180', 'stroke-width': 1 }, g)); },
    veg(g) { [[-26, 8], [6, 12], [28, -2], [-6, -14]].forEach(([x, y], i) => { el('path', { d: `M${x} ${y + 26}V${y}`, stroke: '#6fa24a', 'stroke-width': 7 }, g); [[-14, -2], [12, -3], [0, -14], [-8, -12], [8, -12]].forEach(([a, b]) => el('circle', { cx: x + a, cy: y + b, r: 9, fill: grad([[0, '#5fb04a'], [1, '#2f7a33']], { r: 1, cx: .4, cy: .35, rr: .8 }), stroke: '#23632a', 'stroke-width': .5 }, g)); }); },
    fruit(g) { [[-26, 6, '#d6352c'], [24, 2, '#e8483a']].forEach(([x, y, c]) => { el('path', { d: `M${x} ${y - 26}C${x + 34} ${y - 40} ${x + 42} ${y + 8} ${x + 12} ${y + 30}C${x + 4} ${y + 34} ${x - 4} ${y + 34} ${x - 12} ${y + 30}C${x - 42} ${y + 8} ${x - 34} ${y - 40} ${x} ${y - 26}Z`, fill: grad([[0, '#ff8f7a'], [.5, c], [1, '#99201a']], { r: 1, cx: .35, cy: .3, rr: .8 }), stroke: '#7c1a14' }, g); el('path', { d: `M${x} ${y - 24}q2 -14 10 -18`, fill: 'none', stroke: '#6e4a24', 'stroke-width': 3 }, g); }); },
    milk(g) { blob(g, { d: 'M-30 40V-12L-16 -34H16L30 -12V40Z', fill: grad([[0, '#fff'], [1, '#dbe6ee']]), stroke: '#8ba0b2' }); blob(g, { d: 'M-30 40V4H30V40Z', fill: '#2f8fd0' }); blob(g, { d: 'M-16 -34H16V-44H-16Z', fill: '#f5f7f9', stroke: '#8ba0b2' }); },
    avo(g) { blob(g, { d: 'M0 -44C20 -44 44 -2 40 18C36 42 -36 42 -40 18C-44 -2 -20 -44 0 -44Z', fill: '#39602c' }); blob(g, { d: 'M0 -36C15 -36 36 -2 33 16C30 34 -30 34 -33 16C-36 -2 -15 -36 0 -36Z', fill: grad([[0, '#eef0a0'], [1, '#b4cf63']], { r: 1, rr: .6 }) }); el('circle', { cx: 0, cy: 12, r: 15, fill: grad([[0, '#a56b3a'], [1, '#633a1a']], { r: 1, cx: .4, cy: .35, rr: .7 }) }, g); },
  };
  const MENU = [
    { k: 'rice', n: '밥', v: [3, 1, 0, 0, 0, 1] }, { k: 'bread', n: '빵', v: [3, 1, 1, 0, 0, 0] }, { k: 'egg', n: '달걀말이', v: [0, 3, 2, 1, 1, 1] },
    { k: 'meat', n: '고기', v: [0, 3, 2, 1, 0, 1] }, { k: 'fish', n: '생선', v: [0, 3, 1, 2, 0, 1] }, { k: 'veg', n: '브로콜리', v: [1, 1, 0, 2, 3, 2] },
    { k: 'fruit', n: '사과', v: [2, 0, 0, 1, 2, 3] }, { k: 'milk', n: '우유', v: [1, 2, 1, 3, 1, 3] }, { k: 'avo', n: '아보카도', v: [1, 0, 3, 1, 2, 1] },
  ];
  const NUTR = ['탄수화물', '단백질', '지방', '무기염류', '바이타민', '물'];
  const food = (p, k, x, y, s) => { const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, p); DRAW[k](g); return g; };
  function foodIn(host, k) { const ST = stage(host, [-65, -50, 130, 100]); food(ST.svg, k, 0, 0, .95); return ST; }
  /* 식판 */
  function tray(host) {
    const ST = stage(host, [0, 0, 1000, 720]), root = el('g', null, ST.svg);
    el('rect', { width: 1000, height: 720, fill: '#fff' }, root);
    shadow(root, 500, 672, 460, 22, .2);
    el('rect', { x: 40, y: 50, width: 920, height: 610, rx: 44, fill: grad([[0, '#f2f6f8'], [.6, '#d9e2e8'], [1, '#b9c6cf']], { x2: .8, y2: 1 }), stroke: '#8fa0ad', 'stroke-width': 2 }, root);
    const WELL = [[80, 320, 400, 300], [510, 320, 410, 300], [80, 90, 260, 200], [370, 90, 260, 200], [660, 90, 260, 200]];
    const slots = WELL.map(([x, y, w, h]) => { el('rect', { x, y, width: w, height: h, rx: 26, fill: grad([[0, '#a9b6c0'], [.12, '#dbe3e8'], [1, '#f3f6f8']]), stroke: '#95a5b1', 'stroke-width': 1.2 }, root); return { x: x + w / 2, y: y + h / 2, g: null, s: Math.min(w, h) / 90, lb: ST.label(x + w / 2, y + h - 22, '', 'bg') }; });
    slots.forEach((s) => s.lb.show(false));
    return {
      ST, slots,
      put(i, m) { const S = slots[i]; if (S.g) S.g.remove(); S.g = m ? food(root, m.k, S.x, S.y - 14, Math.min(S.s, 2.5) * .78) : null; if (m) { S.lb.set(m.n).show(true); if (!REDUCE) { const f = S.g, tr = f.getAttribute('transform'); tween(300, (t) => f.setAttribute('transform', tr + ` scale(${f1((.7 + .3 * t) * 100) / 100})`)); } } else S.lb.show(false); },
    };
  }
  return { FOODS, RG, RES, colorOf, bench, MENU, NUTR, food, foodIn, tray };
})();
