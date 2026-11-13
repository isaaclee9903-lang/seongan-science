/* ===== 영양소 수업 그림 도구 NL (2) 검출 실험 기구·반응, 식판 — 모두 새로 그림 (2026-11-13) =====
   교과서 194~195쪽 사진의 색을 바탕으로 정한 모형이다.
   증류수 칸 색(아이오딘 황갈색, 뷰렛 하늘색, 수단 Ⅲ 분홍색)은 194쪽 24홈판 사진을 따랐다.
   음식물별 결과는 교과서 표가 빈칸이라 일반적인 결과로 정했다(제품에 따라 다를 수 있음). */
(() => {
  'use strict';
  const { el, grad, tween, loop, stage, mk, f1, nid, defs, REDUCE } = PS;
  const { mix, ramp, soft } = NL;
  const K = .68; /* 위에서 비스듬히 내려다볼 때 세로로 눌리는 비율 */
  const wait = (ms) => new Promise((r) => setTimeout(r, REDUCE ? 0 : ms));
  const tw = (ms, fn, ez) => new Promise((r) => tween(ms, fn, r, ez));
  const lin = (t) => t, fall = (t) => t * t, out = (t) => 1 - (1 - t) * (1 - t);

  const FOODS = [
    { k: 'water', n: '증류수', c: '#eaf3f8', op: .55, kind: 'clear' },
    { k: 'apple', n: '사과주스', c: '#e6bb4e', op: .78, kind: 'clear' },
    { k: 'oil', n: '식용유', c: '#f1dc6e', op: .72, kind: 'oil' },
    { k: 'milk', n: '우유', c: '#fbf8ee', op: 1, kind: 'opaque' },
    { k: 'bread', n: '빵', c: '#ead6ad', op: 1, kind: 'solid' },
    { k: 'prot', n: '단백질 음료', c: '#e7d0ac', op: 1, kind: 'opaque' },
  ];
  const REAG = {
    iodine: { n: '아이오딘-아이오딘화 칼륨 용액', s: '아이오딘', liq: '#a4621a', word: '청람색', what: '녹말' },
    biuret: { n: '뷰렛 용액', s: '뷰렛', liq: '#3f93d2', word: '보라색', what: '단백질' },
    sudan: { n: '수단 Ⅲ 용액', s: '수단 Ⅲ', liq: '#c8262b', word: '선홍색', what: '지방' },
    bene: { n: '베네딕트 용액', s: '베네딕트', liq: '#2f88d0', word: '황적색', what: '포도당' },
  };
  /* 0 변화 없음, 1 조금, 2 뚜렷 */
  const RES = {
    water: { iodine: 0, biuret: 0, sudan: 0, bene: 0 }, apple: { iodine: 0, biuret: 0, sudan: 0, bene: 2 }, oil: { iodine: 0, biuret: 0, sudan: 2, bene: 0 },
    milk: { iodine: 0, biuret: 2, sudan: 1, bene: 1 }, bread: { iodine: 2, biuret: 1, sudan: 0, bene: 0 }, prot: { iodine: 0, biuret: 2, sudan: 0, bene: 0 },
  };
  /* 시약을 떨어뜨린 뒤 색 */
  const FIN = {
    water: { iodine: '#e5b44c', biuret: '#a6d0ee', sudan: '#eca5b0' },
    apple: { iodine: '#dba43f', biuret: '#bccf9c', sudan: '#e8ad90' },
    oil: { iodine: '#f1dc6e', biuret: '#f1dc6e', sudan: '#e5361d' },
    milk: { iodine: '#f5ebc9', biuret: '#a585cf', sudan: '#f4d1cc' },
    bread: { iodine: '#2a2656', biuret: '#c1a6d8', sudan: '#efb8ae' },
    prot: { iodine: '#e2c086', biuret: '#8a61bb', sudan: '#ebbda7' },
  };
  /* 베네딕트: 가열 전 색, 가열하며 바뀌는 색 */
  const BENE0 = { water: '#62abe2', apple: '#7aa98a', oil: '#f1dc6e', milk: '#bcd5ea', bread: '#ead6ad', prot: '#adbccb' };
  const BRAMP = {
    2: [[0, '#7aa98a'], [.3, '#5f9a5a'], [.52, '#c4b23b'], [.75, '#dc7a22'], [1, '#c7531c']],
    1: [[0, '#bcd5ea'], [.4, '#bdd0a0'], [.75, '#dcc56a'], [1, '#dba64a']],
  };
  const lvWord = (r, lv) => (lv === 2 ? REAG[r].word : lv === 1 ? '조금 ' + REAG[r].word : '변화 없음');

  let filt = null;
  const blurId = () => { if (filt) return filt; filt = nid('bl'); const f = el('filter', { id: filt, x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs()); el('feGaussianBlur', { stdDeviation: 2.6 }, f); return filt; };
  const clip = (shape, attrs) => { const id = nid('c'); const c = el('clipPath', { id }, defs()); el(shape, attrs, c); return `url(#${id})`; };

  /* ---------- 스포이트 ---------- */
  function pipette(parent, color, s = 1) {
    const g = el('g', null, parent), inner = el('g', { transform: `scale(${s})` }, g);
    el('path', { d: 'M-1.7 0L-4.6-46V-188H4.6V-46L1.7 0Z', fill: 'rgba(236,244,249,.82)', stroke: '#8ea2b1', 'stroke-width': .9 }, inner);
    const liq = el('path', { d: 'M-1.2-2L-3.7-46V-96H3.7V-46L1.2-2Z', fill: color, opacity: .9 }, inner);
    el('ellipse', { cx: 0, cy: -96, rx: 3.7, ry: 1.2, fill: mix(color, '#ffffff', .3) }, inner);
    el('rect', { x: -6, y: -196, width: 12, height: 9, rx: 2, fill: '#cfd8df', stroke: '#9fb0bd', 'stroke-width': .7 }, inner);
    const bulb = el('g', { transform: 'translate(0 -196)' }, inner), bs = el('g', null, bulb);
    el('path', { d: 'M-7 0C-10-18-11-40-9-54C-7-66 7-66 9-54C11-40 10-18 7 0Z', fill: grad([[0, '#6a7079'], [.45, '#4b5058'], [1, '#2b2f35']], { x1: 0, x2: 1, y2: 0 }), stroke: '#24282d', 'stroke-width': .7 }, bs);
    const P = { g, x: 0, y: 0, s, color, liq,
      at(x, y) { P.x = x; P.y = y; g.setAttribute('transform', `translate(${f1(x)} ${f1(y)})`); return P; },
      async go(x, y, ms = 400, ez) { const x0 = P.x, y0 = P.y; await tw(ms, (t) => P.at(x0 + (x - x0) * t, y0 + (y - y0) * t), ez); },
      async arc(x, y, ms = 480, lift = 50) { const x0 = P.x, y0 = P.y; await tw(ms, (t) => P.at(x0 + (x - x0) * t, y0 + (y - y0) * t - Math.sin(Math.PI * t) * lift)); },
      squeeze(v) { bs.setAttribute('transform', `scale(${f1(1 - .2 * v)} ${f1(1 - .05 * v)})`); },
    };
    return P;
  }
  /* 방울 하나: 끝에 맺혔다가 떨어짐 → 착 하고 퍼지는 물결 */
  async function drop(layer, P, y1, color, ring) {
    const tipY = P.y + 2, d = el('ellipse', { cx: P.x, cy: tipY, rx: 0, ry: 0, fill: color }, layer);
    await tw(120, (t) => { P.squeeze(t); d.setAttribute('rx', f1(3.6 * t)); d.setAttribute('ry', f1(4.4 * t)); d.setAttribute('cy', f1(tipY + 4 * t)); });
    const yA = tipY + 4;
    await tw(Math.max(90, Math.sqrt(Math.max(0, y1 - yA)) * 14), (t) => { d.setAttribute('cy', f1(yA + (y1 - yA) * t)); d.setAttribute('ry', f1(4.4 + 1.6 * t)); }, fall);
    d.remove(); P.squeeze(0);
    if (ring) { const r = el('ellipse', { cx: P.x, cy: y1, rx: 2, ry: 2 * ring, fill: 'none', stroke: mix(color, '#ffffff', .35), 'stroke-width': 1.4 }, layer); tw(420, (t) => { r.setAttribute('rx', f1(2 + 22 * t)); r.setAttribute('ry', f1((2 + 22 * t) * ring)); r.setAttribute('opacity', f1(1 - t)); }, out).then(() => r.remove()); }
  }

  /* ---------- 시약병(스포이트 병) ---------- */
  function bottle(back, front, x, y, r, s = 1) {
    const R = REAG[r], amber = r === 'iodine';
    const gB = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, back), gF = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, front);
    soft(gB, 4, 0, 46, 8, .22);
    const body = 'M-30 0Q-32 0-32-6V-70Q-32-80-22-84L-12-88V-100H12V-88L22-84Q32-80 32-70V-6Q32 0 26 0Z';
    el('path', { d: body, fill: amber ? '#8a5418' : 'rgba(232,240,245,.6)' }, gB);
    el('path', { d: 'M-30-4V-56H30V-4Q30-2 26-2H-26Q-30-2-30-4Z', fill: amber ? '#5d3209' : R.liq, opacity: amber ? .9 : .82 }, gB);
    el('ellipse', { cx: 0, cy: -56, rx: 30, ry: 3, fill: amber ? '#7a4612' : mix(R.liq, '#ffffff', .3) }, gB);
    el('path', { d: body, fill: amber ? 'rgba(120,70,20,.35)' : 'rgba(255,255,255,.18)', stroke: amber ? '#5a3410' : '#8ea2b1', 'stroke-width': 1.1 }, gF);
    el('path', { d: 'M-24-12V-66', stroke: '#ffffff', 'stroke-width': 3, opacity: .25, 'stroke-linecap': 'round' }, gF);
    el('rect', { x: -14, y: -104, width: 28, height: 12, rx: 3, fill: '#e9edf0', stroke: '#9fb0bd', 'stroke-width': .8 }, gF);
    el('rect', { x: -22, y: -46, width: 44, height: 24, rx: 3, fill: '#fbfbf8', stroke: '#c9d2d9', 'stroke-width': .7 }, gF);
    el('rect', { x: -22, y: -46, width: 44, height: 5, fill: R.liq }, gF);
    return { x, y, s };
  }

  /* ---------- 24홈판의 홈 하나 ---------- */
  function well(g, cx, cy, fd, rr = 44) {
    const w = { cx, cy, fd, done: {}, r: rr };
    el('ellipse', { cx, cy, rx: rr + 6, ry: (rr + 6) * K, fill: '#e3eaef', stroke: '#b4c3ce', 'stroke-width': .9 }, g);
    el('ellipse', { cx, cy, rx: rr, ry: rr * K, fill: grad([[0, '#a7b7c3'], [.45, '#d3dde4'], [1, '#eef3f6']]), stroke: '#9fb1be', 'stroke-width': .8 }, g);
    el('ellipse', { cx, cy: cy + 8, rx: rr - 4, ry: (rr - 4) * K, fill: '#f8fbfc' }, g);
    const cl = clip('ellipse', { cx, cy: cy + 5, rx: rr - 1.5, ry: (rr - 1.5) * K });
    w.g = el('g', { 'clip-path': cl }, g);
    w.surf = cy + 6;
    if (fd.kind === 'solid') {
      el('ellipse', { cx, cy: cy + 14, rx: rr * .8, ry: rr * .8 * K * .7, fill: '#e4ebef', opacity: .8 }, w.g);
      w.pool = el('ellipse', { cx, cy: cy + 12, rx: 0, ry: 0, fill: '#ffffff', opacity: .7 }, w.g);
      const R = mk(Math.round(cx * 3 + cy)); w.pieces = [];
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2 + R(), d = i ? 12 + R() * 14 : 0, px = cx + Math.cos(a) * d, py = cy + 4 + Math.sin(a) * d * K, sz = 9 + R() * 6;
        const pts = Array.from({ length: 7 }, (_, j) => { const b = j / 7 * Math.PI * 2, q = sz * (.7 + R() * .45); return [px + Math.cos(b) * q, py + Math.sin(b) * q * .8]; });
        const dd = 'M' + pts.map((p) => p.map(f1).join(' ')).join('L') + 'Z';
        el('path', { d: dd, transform: 'translate(1.5 4)', fill: '#b98f5d', opacity: .55 }, w.g);
        const p = el('path', { d: dd, fill: fd.c, stroke: '#cdb184', 'stroke-width': .8 }, w.g);
        const pore = el('g', null, w.g); for (let k = 0; k < 3; k++) el('circle', { cx: f1(px + (R() - .5) * sz), cy: f1(py + (R() - .5) * sz * .6), r: 1, fill: '#cdb27f', opacity: .7 }, pore);
        w.pieces.push({ p, x: px, y: py });
      }
    } else {
      w.liq = el('ellipse', { cx, cy: cy + 5, rx: rr, ry: rr * K, fill: fd.c, opacity: fd.op }, w.g);
      w.blobs = el('g', { filter: `url(#${blurId()})` }, w.g);
      w.top = el('g', null, w.g);
      el('ellipse', { cx, cy: cy + 5, rx: rr - 3, ry: (rr - 3) * K, fill: 'none', stroke: '#ffffff', 'stroke-width': 1.4, opacity: .45 }, w.g);
    }
    /* 반응: 방울이 떨어진 자리에서 색이 번져 나감 */
    w.react = (r, hx = cx, hy = cy + 4) => {
      const f = fd.k, target = FIN[f][r], dc = REAG[r].liq; w.done[r] = true;
      if (fd.kind === 'solid') {
        const pr = w.pool; tw(700, (t) => { pr.setAttribute('rx', f1(18 * t)); pr.setAttribute('ry', f1(18 * K * .7 * t)); pr.setAttribute('fill', mix(FIN.water[r] || dc, '#ffffff', .2)); });
        w.pieces.forEach((pc) => { const d = Math.hypot(pc.x - hx, (pc.y - hy) / K); setTimeout(() => tw(1300, (t) => pc.p.setAttribute('fill', mix(fd.c, target, t))), REDUCE ? 0 : d * 18); });
        return;
      }
      if (fd.kind === 'oil') {
        const bead = el('ellipse', { cx: cx + 3, cy: cy + 9, rx: 0, ry: 0, fill: dc, stroke: mix(dc, '#000000', .25), 'stroke-width': .7 }, w.top);
        tw(600, (t) => { bead.setAttribute('rx', f1(8 * t)); bead.setAttribute('ry', f1(8 * K * t)); }, out);
        if (r === 'sudan') setTimeout(() => tw(1800, (t) => { w.liq.setAttribute('fill', mix(fd.c, target, t)); w.liq.setAttribute('opacity', f1(fd.op + (1 - fd.op) * t * .8)); bead.setAttribute('fill', mix(dc, '#f1a1a8', t)); bead.setAttribute('rx', f1(8 - 4 * t)); bead.setAttribute('ry', f1((8 - 4 * t) * K)); }), REDUCE ? 0 : 350);
        return;
      }
      const R = mk(Math.round(cx + cy * 7)), bl = [];
      for (let i = 0; i < 4; i++) bl.push(el('ellipse', { cx: f1(hx + (R() - .5) * 10), cy: f1(hy + (R() - .5) * 6), rx: 0, ry: 0, fill: mix(dc, target, .35) }, w.blobs));
      tw(1500, (t) => bl.forEach((b, i) => { const q = Math.min(1, t * (1.15 - i * .08)), rad = 4 + q * rr * 1.6; b.setAttribute('rx', f1(rad)); b.setAttribute('ry', f1(rad * K)); b.setAttribute('fill', mix(mix(dc, target, .35), target, t)); }), out);
      if (f === 'milk' && r === 'sudan') for (let i = 0; i < 16; i++) {
        const a = R() * Math.PI * 2, d = Math.sqrt(R()) * (rr - 8), sx = cx + Math.cos(a) * d, sy = cy + 5 + Math.sin(a) * d * K, sp = el('circle', { cx: f1(sx), cy: f1(sy), r: 0, fill: '#e2321f' }, w.top), rad = 1.2 + R() * 1.6;
        setTimeout(() => tw(700, (t) => { sp.setAttribute('r', f1(rad * t)); sp.setAttribute('cx', f1(sx + t * 2)); }), REDUCE ? 0 : 500 + i * 70);
      }
    };
    return w;
  }

  /* ========== 활동 1: 활동지 위 24홈판 ========== */
  function plate(host) {
    const ST = stage(host, [0, 0, 1000, 770]), svg = ST.svg;
    const root = el('g', null, svg);
    el('rect', { x: -300, y: -200, width: 1600, height: 1100, fill: '#ffffff' }, root);
    el('rect', { x: -300, y: 540, width: 1600, height: 400, fill: grad([[0, '#eef2f5'], [1, '#f8fafb']]) }, root);
    el('line', { x1: -300, x2: 1300, y1: 540, y2: 540, stroke: '#d6dee6', 'stroke-width': 1 }, root);
    /* 활동지 */
    soft(root, 520, 500, 480, 18, .14);
    el('path', { d: 'M58 34H968L976 496H50Z', fill: '#fdfdfb', stroke: '#d9dfe4', 'stroke-width': 1 }, root);
    el('line', { x1: 66, x2: 962, y1: 98, y2: 98, stroke: '#cdbfa8', 'stroke-width': 1.4 }, root);
    for (let i = 0; i < 5; i++) el('line', { x1: 66, x2: 966, y1: 182 + i * 79, y2: 182 + i * 79, stroke: '#e6dccd', 'stroke-width': 1 }, root);
    for (let i = 0; i < 6; i++) el('line', { x1: 318 + i * 116 - 116, x2: 318 + i * 116 - 116, y1: 46, y2: 484, stroke: '#e6dccd', 'stroke-width': 1, 'stroke-dasharray': '4 4' }, root);
    const XS = [260, 376, 492, 608, 724, 840], YS = [146, 225, 304, 383], ROWS = ['iodine', 'biuret', 'sudan', null];
    FOODS.forEach((fd, i) => ST.label(XS[i], 70, fd.n, 'nl-col'));
    ROWS.forEach((r, i) => { if (r) ST.label(130, YS[i], REAG[r].n.replace('아이오딘화 ', '<br>아이오딘화 '), 'nl-row'); });
    /* 판 */
    soft(root, 548, 466, 400, 16, .22);
    el('path', { d: 'M194 102Q194 92 206 92H890Q902 92 902 102V436Q902 446 890 446H206Q194 446 194 436Z', fill: 'rgba(214,226,234,.55)', stroke: '#a9bac6', 'stroke-width': 1.2 }, root);
    el('path', { d: 'M194 436Q194 446 206 446H890Q902 446 902 436V452Q902 462 890 462H206Q194 462 194 452Z', fill: '#c3d1db', stroke: '#a9bac6', 'stroke-width': 1 }, root);
    const wells = {};
    YS.forEach((y, ri) => XS.forEach((x, ci) => { const fd = ROWS[ri] ? FOODS[ci] : { k: 'empty', c: '#fff', op: 0, kind: 'clear' }; const w = well(root, x, y, fd); w.tap = el('ellipse', { cx: x, cy: y, rx: 52, ry: 52 * K, fill: 'transparent', class: 'tap', 'data-r': ROWS[ri] || '', 'data-c': fd.k }, root); if (ROWS[ri]) wells[ROWS[ri] + fd.k] = w; }));
    /* 시약병 세 개와 스포이트 */
    const back = el('g', null, root), rest = el('g', null, root), front = el('g', null, root), air = el('g', null, root), fx = el('g', null, root);
    const BX = { iodine: 250, biuret: 490, sudan: 730 }, BY = 748;
    const pips = {};
    Object.keys(BX).forEach((r) => { bottle(back, front, BX[r], BY, r, 1.08); pips[r] = pipette(rest, REAG[r].liq, .78).at(BX[r], BY - 30); ST.label(BX[r] + 44, BY - 44, REAG[r].n.replace('아이오딘화 ', '<br>아이오딘화 '), 'nl-btl ra'); });
    let busy = false;
    const api = {
      ST, wells, ROWS, XS, YS,
      get busy() { return busy; },
      /* 한 줄(또는 홈 하나)에 시약 떨어뜨리기 */
      async run(r, list, onEach) {
        if (busy) return; busy = true;
        const P = pips[r], bx = BX[r];
        try {
          await P.go(bx, BY - 200, 380); air.appendChild(P.g);
          for (const fk of list) {
            const w = wells[r + fk]; if (!w || w.done[r]) continue;
            await P.arc(w.cx, w.cy - 82, 460, 30); await P.go(w.cx, w.cy - 50, 180);
            const n = 2 + (w.cx % 2 ? 1 : 0);
            for (let i = 0; i < n; i++) { await drop(fx, P, w.surf + 2, REAG[r].liq, K); if (i === 0) w.react(r, w.cx + (i - 1) * 3, w.cy + 4); await wait(110); }
            onEach && onEach(fk); await P.go(w.cx, w.cy - 82, 160);
          }
          await P.arc(bx, BY - 200, 520, 20); rest.appendChild(P.g); await P.go(bx, BY - 30, 360);
        } finally { busy = false; }
      },
      fillAll() { ['iodine', 'biuret', 'sudan'].forEach((r) => FOODS.forEach((f) => wells[r + f.k].react(r))); },
    };
    return api;
  }

  /* ---------- 시험관 ---------- */
  const TL = 250;
  function tube(parent, fd, ST, o = {}) {
    const g = el('g', null, parent), body = el('g', null, g);
    const inside = 'M-15 2V233A15 15 0 0 0 15 233V2Z';
    el('path', { d: 'M-17 0V233A17 17 0 0 0 17 233V0', fill: 'rgba(236,244,249,.55)', stroke: 'none' }, body);
    const lq = el('g', { 'clip-path': clip('path', { d: inside }) }, body);
    const level = o.level ?? 190, T = { g, fd, x: 0, y: 0, rot: 0, level };
    if (fd.kind === 'solid') {
      const R = mk(fd.k.length * 9 + 3); T.pieces = [];
      T.pool = el('rect', { x: -16, y: 250, width: 32, height: 0, fill: BENE0.water, opacity: .8 }, lq);
      for (let i = 0; i < 6; i++) { const px = (R() - .5) * 18, py = 236 - i * 6 - R() * 4; T.pieces.push(el('path', { d: `M${f1(px - 7)} ${f1(py)}l${f1(4 + R() * 3)} -${f1(5 + R() * 3)}l${f1(6 + R() * 2)} ${f1(1 + R() * 2)}l1 ${f1(6 + R() * 2)}l-${f1(8 + R() * 3)} 2Z`, fill: fd.c, stroke: '#c9ab7c', 'stroke-width': .7 }, lq)); }
    } else if (fd.kind === 'oil') {
      T.bot = el('rect', { x: -16, y: 250, width: 32, height: 0, fill: '#2f88d0', opacity: .9 }, lq);
      T.liq = el('rect', { x: -16, y: level, width: 32, height: 260 - level, fill: fd.c, opacity: .8 }, lq);
      el('ellipse', { cx: 0, cy: level, rx: 15, ry: 3, fill: mix(fd.c, '#ffffff', .4), opacity: .9 }, lq);
      lq.insertBefore(T.liq, T.bot);
    } else {
      T.liq = el('rect', { x: -16, y: level, width: 32, height: 260 - level, fill: fd.c, opacity: Math.max(.7, fd.op) }, lq);
      T.surf = el('ellipse', { cx: 0, cy: level, rx: 15, ry: 3, fill: mix(fd.c, '#ffffff', .35), opacity: .9 }, lq);
    }
    T.ppt = el('ellipse', { cx: 0, cy: 246, rx: 0, ry: 0, fill: '#b8461b' }, lq);
    T.blobs = el('g', { filter: `url(#${blurId()})` }, lq);
    el('path', { d: 'M-17 0V233A17 17 0 0 0 17 233V0', fill: 'none', stroke: '#8ea2b1', 'stroke-width': 1.3 }, body);
    el('path', { d: 'M-11 14V226', stroke: '#ffffff', 'stroke-width': 2.4, opacity: .35, 'stroke-linecap': 'round' }, body);
    el('ellipse', { cx: 0, cy: 0, rx: 17, ry: 4, fill: 'rgba(240,246,250,.6)', stroke: '#8ea2b1', 'stroke-width': 1.2 }, body);
    if (o.sticker !== false) el('rect', { x: -13, y: 20, width: 26, height: 18, rx: 2, fill: '#ffffff', stroke: '#cfd8df', 'stroke-width': .7 }, body);
    if (ST && o.label !== false) T.lb = ST.label(0, -18, fd.n, 'nl-tube');
    T.at = (x, y, rot = 0) => { T.x = x; T.y = y; T.rot = rot; g.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})`); if (T.lb) T.lb.move(x, y + 284); return T; };
    T.color = (c) => { if (T.liq) T.liq.setAttribute('fill', c); if (T.surf) T.surf.setAttribute('fill', mix(c, '#ffffff', .3)); };
    /* 위에서 떨어진 시약이 아래로 번짐 */
    T.mix = (dc, target, ms = 1300) => {
      if (fd.kind === 'oil') return tw(ms * .6, (t) => { T.bot.setAttribute('y', f1(250 - 9 * t)); T.bot.setAttribute('height', f1(12 * t)); T.bot.setAttribute('fill', dc); });
      if (fd.kind === 'solid') { tw(ms, (t) => { T.pool.setAttribute('y', f1(250 - 12 * t)); T.pool.setAttribute('height', f1(14 * t)); T.pool.setAttribute('fill', dc); }); return tw(ms, (t) => T.pieces.forEach((p) => p.setAttribute('fill', mix(fd.c, target, t * .8)))); }
      const b = el('ellipse', { cx: 0, cy: level + 6, rx: 6, ry: 6, fill: dc }, T.blobs);
      return tw(ms, (t) => { b.setAttribute('cy', f1(level + 6 + (250 - level) * .45 * t)); b.setAttribute('rx', f1(6 + 14 * t)); b.setAttribute('ry', f1(6 + (260 - level) * .55 * t)); b.setAttribute('fill', mix(dc, target, t)); if (t > .6) T.color(mix(fd.c, target, (t - .6) / .4)); }, out).then(() => { T.color(target); b.remove(); });
    };
    return T;
  }

  /* ========== 활동 2: 시험관에 베네딕트 용액 → 약 90 ℃의 물에 5분 ========== */
  function tubes(host) {
    const ST = stage(host, [0, 124, 1000, 536]), svg = ST.svg, root = el('g', null, svg);
    el('rect', { x: -300, y: -200, width: 1600, height: 1100, fill: '#ffffff' }, root);
    el('rect', { x: -300, y: 612, width: 1600, height: 300, fill: grad([[0, '#eef2f5'], [1, '#f8fafb']]) }, root);
    el('line', { x1: -300, x2: 1300, y1: 612, y2: 612, stroke: '#d6dee6', 'stroke-width': 1 }, root);
    const XS = FOODS.map((_, i) => 84 + i * 78), TOP = 340;
    /* 시험관대 (뒤판) */
    soft(root, 278, 612, 260, 12, .2);
    const rackB = el('g', null, root);
    [36, 506].forEach((x) => el('rect', { x, y: 400, width: 14, height: 206, rx: 3, fill: grad([[0, '#eef3f6'], [1, '#c8d4dc']], { x2: 1, y2: 0 }), stroke: '#a9bac6', 'stroke-width': 1 }, rackB));
    el('rect', { x: 24, y: 596, width: 508, height: 14, rx: 4, fill: '#d4dee5', stroke: '#a9bac6', 'stroke-width': 1 }, rackB);
    /* 비커 (뒤) */
    const BXL = 650, BXR = 890, BT = 380, BB = 608, WL = 450;
    soft(root, 770, 612, 140, 10, .2);
    el('path', { d: `M${BXL} ${BT}V${BB - 10}Q${BXL} ${BB} ${BXL + 10} ${BB}H${BXR - 10}Q${BXR} ${BB} ${BXR} ${BB - 10}V${BT}Z`, fill: 'rgba(232,240,245,.45)' }, root);
    el('rect', { x: BXL + 2, y: WL, width: BXR - BXL - 4, height: BB - WL - 2, rx: 8, fill: '#d6eaf4', opacity: .7 }, root);
    const tubesL = el('g', null, root);
    /* 시험관대 앞판 */
    const rackF = el('g', null, root);
    el('rect', { x: 30, y: 400, width: 496, height: 18, rx: 5, fill: grad([[0, '#f4f7f9'], [1, '#d3dde4']]), stroke: '#a9bac6', 'stroke-width': 1 }, rackF);
    XS.forEach((x) => el('ellipse', { cx: x, cy: 403, rx: 19, ry: 4, fill: '#b8c7d1' }, rackF));
    /* 비커 앞: 물, 유리, 눈금, 온도계 */
    const wFront = el('g', null, root);
    el('rect', { x: BXL + 2, y: WL, width: BXR - BXL - 4, height: BB - WL - 2, rx: 8, fill: '#bfe0f0', opacity: .2 }, wFront);
    el('ellipse', { cx: (BXL + BXR) / 2, cy: WL, rx: (BXR - BXL) / 2 - 2, ry: 7, fill: '#e3f2f9', opacity: .75, stroke: '#a8d0e6', 'stroke-width': .8 }, wFront);
    const bub = el('g', null, wFront), steam = el('g', null, wFront);
    el('path', { d: `M${BXL - 8} ${BT - 6}Q${BXL} ${BT - 2} ${BXL} ${BT + 8}V${BB - 10}Q${BXL} ${BB} ${BXL + 10} ${BB}H${BXR - 10}Q${BXR} ${BB} ${BXR} ${BB - 10}V${BT}`, fill: 'none', stroke: '#8ea2b1', 'stroke-width': 1.6 }, wFront);
    el('ellipse', { cx: (BXL + BXR) / 2 + 2, cy: BT, rx: (BXR - BXL) / 2, ry: 6, fill: 'none', stroke: '#8ea2b1', 'stroke-width': 1.3 }, wFront);
    for (let i = 0; i < 6; i++) el('line', { x1: BXL + 14, x2: BXL + (i % 2 ? 30 : 40), y1: 580 - i * 36, y2: 580 - i * 36, stroke: '#8ea2b1', 'stroke-width': 1.2 }, wFront);
    el('path', { d: `M${BXL + 18} ${BT + 20}V${BB - 26}`, stroke: '#ffffff', 'stroke-width': 3, opacity: .3, 'stroke-linecap': 'round' }, wFront);
    /* 디지털 온도계 */
    const th = el('g', null, wFront);
    el('path', { d: 'M884 300L858 576', stroke: '#9aa6b0', 'stroke-width': 4, 'stroke-linecap': 'round' }, th);
    el('path', { d: 'M884 300L858 576', stroke: '#e4e9ed', 'stroke-width': 1.4, 'stroke-linecap': 'round' }, th);
    el('rect', { x: 842, y: 204, width: 120, height: 104, rx: 14, fill: grad([[0, '#fbfcfd'], [1, '#dfe5ea']], { x2: 1, y2: 1 }), stroke: '#9fb0bd', 'stroke-width': 1 }, th);
    el('rect', { x: 854, y: 216, width: 96, height: 46, rx: 5, fill: '#c9d3c4', stroke: '#8b9a86', 'stroke-width': .8 }, th);
    el('circle', { cx: 884, cy: 286, r: 7, fill: '#d0d8de', stroke: '#9fb0bd' }, th); el('circle', { cx: 920, cy: 286, r: 7, fill: '#d0d8de', stroke: '#9fb0bd' }, th);
    const lcd = ST.label(902, 239, '90.1 ℃', 'nl-lcd');
    const clock = ST.label(770, 640, '약 90 ℃의 물', 'nl-clock');
    /* 시험관 */
    const T = FOODS.map((fd, i) => tube(tubesL, fd, ST, { level: fd.kind === 'solid' ? 200 : 186 }).at(XS[i], TOP));
    /* 베네딕트 병과 스포이트 */
    const bBack = el('g', null, root); root.insertBefore(bBack, tubesL);
    const bRest = el('g', null, root); root.insertBefore(bRest, tubesL);
    const bFront = el('g', null, root); root.insertBefore(bFront, tubesL);
    const PX = 584, PY = 610; bottle(bBack, bFront, PX, PY, 'bene', .7);
    const air = el('g', null, root), fx = el('g', null, root);
    const P = pipette(bRest, REAG.bene.liq, .78).at(PX, PY - 22);
    ST.label(PX, 640, '베네딕트 용액', 'nl-btl');
    let busy = false, inBath = false, heat = 0, stopFx = null;
    const state = { added: {}, heated: false };
    const temp = () => { lcd.set((89.6 + Math.random() * .9).toFixed(1) + ' ℃'); };
    function effects(on) {
      if (stopFx) { stopFx(); stopFx = null; }
      bub.innerHTML = ''; steam.innerHTML = '';
      if (!on || REDUCE) return;
      const R = mk(5), bs = [], ss = [];
      for (let i = 0; i < 14; i++) bs.push({ e: el('circle', { r: f1(1 + R() * 1.6), fill: '#ffffff', stroke: '#9cc6de', 'stroke-width': .6, opacity: .8 }, bub), x: BXL + 14 + R() * (BXR - BXL - 28), y: BB - 8 - R() * 160, v: 12 + R() * 22 });
      for (let i = 0; i < 3; i++) ss.push({ e: el('path', { d: 'M0 0q-8-14 0-28t0-28', fill: 'none', stroke: '#c9d6df', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0 }, steam), x: BXL + 50 + i * 70, ph: i / 3 });
      let acc = 0;
      stopFx = loop((dt, t) => {
        bs.forEach((b) => { b.y -= b.v * dt; if (b.y < WL + 6) { b.y = BB - 10; b.x = BXL + 14 + Math.random() * (BXR - BXL - 28); } b.e.setAttribute('cx', f1(b.x + Math.sin(t * 3 + b.v) * 1.5)); b.e.setAttribute('cy', f1(b.y)); });
        ss.forEach((s) => { const p = (t * .35 + s.ph) % 1; s.e.setAttribute('transform', `translate(${f1(s.x + Math.sin(t + s.ph * 6) * 6)} ${f1(WL - 8 - p * 70)}) scale(${f1(.7 + p * .5)})`); s.e.setAttribute('opacity', f1(Math.sin(p * Math.PI) * .32)); });
        acc += dt; if (acc > .7) { acc = 0; temp(); }
      });
    }
    const api = {
      ST, T, state,
      get busy() { return busy; },
      get inBath() { return inBath; },
      async add(onEach) {
        if (busy) return; busy = true;
        try {
          await P.go(PX, PY - 272, 420); air.appendChild(P.g);
          for (const t of T) {
            if (state.added[t.fd.k]) continue;
            await P.arc(t.x, TOP - 6, 520, 0);
            for (let i = 0; i < 2; i++) { await drop(fx, P, TOP + (t.fd.kind === 'oil' ? 238 : t.level - 2), REAG.bene.liq, 0); await wait(90); }
            state.added[t.fd.k] = true; t.mix(REAG.bene.liq, BENE0[t.fd.k]); onEach && onEach(t.fd.k);
          }
          await P.arc(PX, PY - 272, 560, 0); bRest.appendChild(P.g); await P.go(PX, PY - 22, 380);
        } finally { busy = false; }
      },
      /* 시험관을 비커로 옮기거나 시험관대로 되돌림 */
      async move(toBath) {
        const from = T.map((t) => [t.x, t.y, t.rot]);
        const to = T.map((t, i) => (toBath ? [BXL + 26 + i * 37.5, BB - 8 - TL, (i % 2 ? 1.5 : -1.5)] : [XS[i], TOP, 0]));
        T.forEach((t) => t.lb && t.lb.show(!toBath && false));
        await Promise.all(T.map((t, i) => wait(i * 110).then(() => tw(1100, (q) => {
          const [x0, y0, r0] = from[i], [x1, y1, r1] = to[i], up = Math.min(y0, y1) - 205;
          const x = x0 + (x1 - x0) * Math.min(1, Math.max(0, (q - .25) / .5)), y = q < .25 ? y0 + (up - y0) * (q / .25) : q < .75 ? up : up + (y1 - up) * ((q - .75) / .25);
          t.at(x, y, r0 + (r1 - r0) * q);
        }, lin))));
        inBath = toBath; T.forEach((t) => t.lb && t.lb.show(!toBath));
      },
      async heat5(onTick) {
        if (busy) return; busy = true;
        try {
          if (!inBath) await api.move(true);
          effects(true); clock.set('담근 시간 0분');
          const go = (h) => T.forEach((t) => {
            const lv = RES[t.fd.k].bene; if (!lv) return;
            t.color(ramp(BRAMP[lv], h));
            const pp = Math.max(0, (h - .55) / .45); t.ppt.setAttribute('rx', f1(15 * Math.min(1, pp * 1.4))); t.ppt.setAttribute('ry', f1((lv === 2 ? 9 : 4) * pp)); t.ppt.setAttribute('cy', f1(250 - (lv === 2 ? 6 : 3) * pp)); t.ppt.setAttribute('fill', lv === 2 ? '#b5461a' : '#c7843a');
          });
          await tw(REDUCE ? 0 : 7000, (h) => { heat = h; go(h); const m = Math.min(5, Math.floor(h * 5 + .001)); clock.set(`담근 시간 ${m}분`); onTick && onTick(h); }, lin);
          go(1); clock.set('5분 동안 담갔어요'); state.heated = true; effects(false); lcd.set('90.0 ℃');
        } finally { busy = false; }
      },
      async back() { if (busy || !inBath) return; busy = true; try { await api.move(false); clock.set('약 90 ℃의 물'); } finally { busy = false; } },
      fillAll() { T.forEach((t) => { state.added[t.fd.k] = true; t.mix(REAG.bene.liq, BENE0[t.fd.k], 0); }); },
      async finishAll() { api.fillAll(); await wait(50); T.forEach((t) => { const lv = RES[t.fd.k].bene; if (lv) { t.color(ramp(BRAMP[lv], 1)); t.ppt.setAttribute('rx', 15); t.ppt.setAttribute('ry', lv === 2 ? 9 : 4); t.ppt.setAttribute('cy', 250 - (lv === 2 ? 6 : 3)); t.ppt.setAttribute('fill', lv === 2 ? '#b5461a' : '#c7843a'); } }); state.heated = true; },
    };
    return api;
  }

  /* ========== 읽기: 195쪽 네 가지 검출 반응 ========== */
  function four(host) {
    const ST = stage(host, [0, 0, 1000, 600]), root = el('g', null, ST.svg);
    el('rect', { x: -300, y: -200, width: 1600, height: 1000, fill: '#ffffff' }, root);
    el('rect', { x: -300, y: 470, width: 1600, height: 300, fill: '#f2f5f8' }, root);
    const C = [
      { r: 'iodine', n: '녹말 용액', fd: { k: 's', n: '녹말 용액', c: '#eef0ee', op: .92, kind: 'clear' }, to: '#262457', res: '청람색을 띰.' },
      { r: 'biuret', n: '단백질 용액', fd: { k: 'p', n: '단백질 용액', c: '#f0ead2', op: .9, kind: 'clear' }, to: '#6f47ab', res: '보라색을 띰.' },
      { r: 'sudan', n: '지방 + 증류수', fd: { k: 'f', n: '지방', c: '#eaf3f8', op: .6, kind: 'clear' }, to: '#f1c3c9', res: '선홍색을 띰.' },
      { r: 'bene', n: '포도당 용액', fd: { k: 'g', n: '포도당 용액', c: '#eef6fa', op: .7, kind: 'clear' }, to: '#2f88d0', res: '황적색을 띰.' },
    ];
    const XS = [150, 383, 616, 849], TY = 206;
    const bath = el('g', null, root), tl = el('g', null, root), fx = el('g', null, root);
    const items = C.map((c, i) => {
      const t = tube(tl, c.fd, ST, { level: 160, label: false, sticker: false }).at(XS[i], TY);
      if (c.r === 'sudan') { c.oil = el('rect', { x: XS[i] - 15, y: TY + 142, width: 30, height: 18, fill: '#f1dc6e', opacity: .85 }, tl); }
      const P = pipette(tl, REAG[c.r].liq, .5).at(XS[i], TY - 16);
      ST.label(XS[i], 30, REAG[c.r].n.replace('아이오딘화 ', '<br>아이오딘화 '), 'nl-four');
      const nm = ST.label(XS[i], TY + 286, c.n, 'nl-side');
      const res = ST.label(XS[i], TY + 336, '?', 'nl-res');
      return { c, t, P, res };
    });
    const hb = el('rect', { x: XS[3] - 56, y: 640, width: 112, height: 112, rx: 10, fill: '#cfe7f3', opacity: .75, stroke: '#8ea2b1', 'stroke-width': 1.2 }, bath);
    const hbl = ST.label(XS[3] + 84, TY + 196, '가열', 'nl-heat'); hbl.show(false);
    let busy = false, done = false;
    const api = {
      async play() {
        if (busy) return; busy = true; api.reset();
        try {
          for (const it of items) {
            for (let k = 0; k < 2; k++) { await drop(fx, it.P, TY + (it.c.r === 'sudan' ? 140 : 158), REAG[it.c.r].liq, 0); await wait(80); }
            if (it.c.r === 'sudan') { const o = it.c.oil; tw(1400, (q) => o.setAttribute('fill', mix('#f1dc6e', '#e5361d', q))); it.t.mix(REAG.sudan.liq, it.c.to); }
            else it.t.mix(REAG[it.c.r].liq, it.c.to);
            if (it.c.r !== 'bene') setTimeout(() => it.res.set(it.c.res), REDUCE ? 0 : 1100);
          }
          await wait(1300);
          hbl.show(true); await tw(900, (q) => hb.setAttribute('y', f1(640 - (640 - TY - 152) * q)), out);
          const t4 = items[3].t; await tw(REDUCE ? 0 : 3200, (h) => { t4.color(ramp(BRAMP[2].map(([p, c], j) => [p, j ? c : '#2f88d0']), h)); const pp = Math.max(0, (h - .55) / .45); t4.ppt.setAttribute('rx', f1(15 * Math.min(1, pp * 1.4))); t4.ppt.setAttribute('ry', f1(8 * pp)); t4.ppt.setAttribute('cy', f1(250 - 6 * pp)); }, lin);
          items[3].res.set(items[3].c.res); done = true;
        } finally { busy = false; }
      },
      reset() {
        if (busy && done) return;
        items.forEach((it) => { it.t.color(it.c.fd.c); it.t.ppt.setAttribute('rx', 0); it.t.ppt.setAttribute('ry', 0); it.res.set('?'); if (it.c.oil) it.c.oil.setAttribute('fill', '#f1dc6e'); });
        hb.setAttribute('y', 640); hbl.show(false); done = false;
      },
      get busy() { return busy; },
    };
    return api;
  }

  /* ========== 식판 (위에서 비스듬히 본 스테인리스 식판) ========== */
  function tray(host) {
    const ST = stage(host, [0, 0, 1000, 640]), root = el('g', null, ST.svg);
    el('rect', { x: -300, y: -200, width: 1600, height: 1000, fill: '#ffffff' }, root);
    soft(root, 500, 600, 470, 24, .22);
    el('path', { d: 'M60 96Q60 52 104 52H896Q940 52 940 96V556Q940 600 896 600H104Q60 600 60 556Z', transform: 'translate(0 16)', fill: '#9aa8b3' }, root);
    el('path', { d: 'M60 96Q60 52 104 52H896Q940 52 940 96V556Q940 600 896 600H104Q60 600 60 556Z', fill: grad([[0, '#f3f6f8'], [.5, '#dfe6eb'], [1, '#c4cfd7']], { x1: 0, y1: 0, x2: .9, y2: 1 }), stroke: '#8d9ca8', 'stroke-width': 1.6 }, root);
    const WELL = [[96, 300, 400, 268], [520, 300, 384, 268], [96, 84, 256, 192], [372, 84, 256, 192], [648, 84, 256, 192]];
    const slots = WELL.map(([x, y, w, h]) => {
      const r = 34, d = `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
      el('path', { d, fill: grad([[0, '#9fadb8'], [.16, '#c9d3da'], [.3, '#e4eaee'], [1, '#f1f4f6']]), stroke: '#8899a6', 'stroke-width': 1.2 }, root);
      el('path', { d, fill: 'none', stroke: '#ffffff', 'stroke-width': 1.5, opacity: .6, transform: 'translate(0 2)' }, root);
      const g = el('g', null, root);
      return { x: x + w / 2, y: y + h / 2 + 10, s: Math.min(w / 120, h / 92) * .86, g, lb: ST.label(x + w / 2, y + h - 18, '', 'nl-dish') };
    });
    slots.forEach((s) => s.lb.show(false));
    return {
      ST, slots,
      put(i, m) {
        const S = slots[i]; S.g.innerHTML = '';
        if (!m) { S.lb.show(false); return; }
        const f = NL.food(S.g, m.k, S.x, S.y - 12, S.s); S.lb.set(m.n).show(true);
        if (!REDUCE) tw(320, (t) => f.setAttribute('transform', `translate(${S.x} ${f1(S.y - 12 - 26 * (1 - t))}) scale(${f1(S.s * (.85 + .15 * t))})`), out);
      },
    };
  }

  Object.assign(NL, { K, FOODS, REAG, RES, FIN, BENE0, BRAMP, lvWord, pipette, drop, bottle, well, plate, tube, tubes, four, tray });
})();
