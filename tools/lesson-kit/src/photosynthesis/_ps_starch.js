/* ===== 탐구 1: 광합성으로 만들어진 양분 확인하기 (교과서 170~171쪽) ===== */
(() => {
  'use strict';
  const { el, grad, leafData, drawLeaf, PAL, flock, tween, loop, mk, lerp, stage, clamp, bench, shadow, taper } = PS;
  const PALE = '#ddd8a0', AMBER = '#c5832a', BLUE = '#26265e';
  const LEAF = () => leafData({ L: 178, W: 46, p: .82, q: 1, seed: 17, bend: .05, nA: 70, sec: 5, vw: 2.8, D: 5, di: 26 });
  const LEAF2 = () => leafData({ L: 150, W: 38, p: .84, q: 1, seed: 29, bend: -.06, nA: 50, sec: 5, vw: 2.4, D: 5, di: 26 });

  /* 유리 비커 (반사 띠 없이 얇은 선과 옅은 면으로) */
  function beaker(g, x, y, w, h, o = {}) {
    const e = 9, b = el('g', null, g);
    el('path', { d: `M${x} ${y}V${y + h - 14}Q${x} ${y + h} ${x + 14} ${y + h}H${x + w - 14}Q${x + w} ${y + h} ${x + w} ${y + h - 14}V${y}`, fill: o.fill || 'rgba(222,235,244,.28)', stroke: '#7f94a8', 'stroke-width': 1.8 }, b);
    el('ellipse', { cx: x + w / 2, cy: y, rx: w / 2, ry: e, fill: 'rgba(235,243,249,.5)', stroke: '#7f94a8', 'stroke-width': 1.8 }, b);
    if (o.marks) for (let i = 1; i <= 4; i++) el('line', { x1: x + w - 26, x2: x + w - 8, y1: y + h - i * h / 5.4, y2: y + h - i * h / 5.4, stroke: '#9fb1c2', 'stroke-width': 1.2 }, b);
    return b;
  }
  function liquid(g, x, y, w, h, top, col) {
    const yy = y + top, H = h - top, lg = el('g', null, g);
    const f = el('path', { d: `M${x + 1} ${yy}V${y + h - 14}Q${x + 1} ${y + h - 1} ${x + 15} ${y + h - 1}H${x + w - 15}Q${x + w - 1} ${y + h - 1} ${x + w - 1} ${y + h - 14}V${yy}Z`, fill: col }, lg);
    const s = el('ellipse', { cx: x + w / 2, cy: yy, rx: w / 2 - 1, ry: 8, fill: col, stroke: 'rgba(90,120,140,.4)', 'stroke-width': 1 }, lg);
    return { lg, f, s, H };
  }

  PS.starchLab = function (host, o = {}) {
    const ST = stage(host, [30, 66, 940, 708]), R = mk(5);
    let fast = false;
    const T = (ms) => (fast ? 0 : ms);
    const root = el('g', null, ST.svg);
    const lbs = { a: [], b: [], c: [] };
    const lab = (k, ...args) => { const l = ST.label(...args); lbs[k].push(l); return l; };
    /* === 장면 A: 고추 모종 === */
    const A = el('g', null, root); bench(A, 700);
    const sunG = el('g', { style: 'transition:opacity .6s', opacity: 0 }, A);
    const rayB = el('g', null, sunG);
    [[640, 130], [440, 150], [250, 120]].forEach(([x, w]) => el('path', { d: `M${x + 330} -100L${x + w + 330} -100L${x + w - 60} 700L${x - 120} 700Z`, fill: grad([[0, '#ffe88f', .55], [1, '#ffe88f', .04]]) }, rayB));
    const sun = el('g', { transform: 'translate(880 70)' }, sunG);
    el('circle', { r: 110, fill: grad([[0, '#fff3b0', .9], [.5, '#ffe27a', .3], [1, '#ffe27a', 0]], { r: 1, rr: .5 }) }, sun);
    el('circle', { r: 44, fill: grad([[0, '#ffe680'], [1, '#f7b21f']]), stroke: '#ea9c12', 'stroke-width': 1 }, sun);
    shadow(A, 432, 706, 200, 24, .3);
    const plant = el('g', null, A);
    /* 줄기·잎 */
    const sp = []; for (let i = 0; i <= 12; i++) { const t = i / 12; sp.push([430 + Math.sin(t * 3.1) * 12, 548 - t * 415]); }
    const backL = el('g', null, plant);
    [[438, 300, -32, .8], [426, 250, 208, .78], [434, 190, -50, .62], [428, 175, 232, .6], [440, 390, 30, .78], [424, 345, 152, .82]].forEach(([x, y, r, s], i) => drawLeaf(backL, i % 2 ? LEAF2() : LEAF(), { ...PAL.pep, a: '#2a7a32', b: '#47993c' }, { tf: `translate(${x} ${y}) rotate(${r}) scale(${s})`, pet: 22, petW: 4 }));
    el('path', { d: taper(sp, 15, 5), fill: grad([[0, '#6aaa4c'], [1, '#3f8836']], { x2: 1, y2: 0 }), stroke: '#2f6c2a', 'stroke-width': .7 }, plant);
    const tipL = [[432, 140, -80, .5], [430, 138, 262, .46]];
    tipL.forEach(([x, y, r, s]) => drawLeaf(plant, LEAF2(), PAL.pep, { tf: `translate(${x} ${y}) rotate(${r}) scale(${s})`, pet: 12, petW: 3 }));
    /* 고추 한 개, 꽃 한 송이 */
    const pp = el('g', { transform: 'translate(442 330) rotate(8)' }, plant);
    el('path', { d: 'M0 0C2 8 3 12 3 16', stroke: '#4c8f39', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, pp);
    el('path', { d: 'M-5 14C6 10 13 16 12 34 11 58 5 72 1 80-3 66-11 42-5 14Z', fill: grad([[0, '#58a83f'], [1, '#2f7f30']], { x2: 1, y2: 0 }), stroke: '#27682a', 'stroke-width': .8 }, pp);
    const fl = el('g', { transform: 'translate(420 222)' }, plant);
    for (let i = 0; i < 5; i++) el('ellipse', { cx: 0, cy: -8, rx: 4.6, ry: 8, fill: '#fbfbf4', stroke: '#c9ccb6', 'stroke-width': .6, transform: `rotate(${i * 72})` }, fl);
    el('circle', { r: 3.4, fill: '#d6b53a' }, fl);
    /* 실험할 잎 두 장 */
    const LA = drawLeaf(plant, LEAF(), PAL.pep, { tf: 'translate(424 462) rotate(186) scale(1.12)', pet: 24, petW: 4.5 });
    const LB = drawLeaf(plant, LEAF(), PAL.pep, { tf: 'translate(436 434) rotate(-14) scale(1.12)', pet: 24, petW: 4.5 });
    /* 검은색 종이 */
    const paper = el('g', { opacity: 0, transform: 'translate(424 462) rotate(186) scale(1.12)' }, plant);
    const pIn = el('g', null, paper);
    el('path', { d: 'M14 -34C60 -60 130 -58 186 -22L192 22C140 56 62 60 18 36Z', fill: grad([[0, '#3a3d44'], [1, '#17191d']], { x2: 1, y2: .5 }), stroke: '#0a0b0d', 'stroke-width': 1 }, pIn);
    el('path', { d: 'M14 -34C70 -18 130 -4 192 22', fill: 'none', stroke: '#565a62', 'stroke-width': 1.2 }, pIn);
    el('path', { d: 'M18 36C60 8 96 -8 186 -22', fill: 'none', stroke: '#2a2d32', 'stroke-width': 1 }, pIn);
    /* 화분 */
    const pot = el('g', null, A);
    el('ellipse', { cx: 432, cy: 692, rx: 118, ry: 15, fill: '#a95f38', stroke: '#7c4324', 'stroke-width': 1 }, pot);
    el('path', { d: 'M352 572L374 688Q432 702 490 688L512 572Z', fill: grad([[0, '#d98a58'], [.5, '#c8733f'], [1, '#9c552d']], { x2: 1, y2: 0 }), stroke: '#7c4324', 'stroke-width': 1 }, pot);
    el('path', { d: 'M342 548Q432 534 522 548V578Q432 592 342 578Z', fill: grad([[0, '#e39a68'], [.5, '#d17f4a'], [1, '#a95f38']], { x2: 1, y2: 0 }), stroke: '#7c4324', 'stroke-width': 1 }, pot);
    el('ellipse', { cx: 432, cy: 549, rx: 85, ry: 10, fill: '#4a2f1b' }, pot);
    const lPaper = lab('a', 225, 395, '검은색 종이', 'm').show(false), lLeaf = lab('a', 700, 372, '가리지 않은 잎', 'm').show(false);
    const lPot = lab('a', 432, 738, '고추 모종', 'm');

    /* === 장면 B: 물중탕 === */
    const B = el('g', { style: 'display:none' }, root); bench(B, 700);
    shadow(B, 500, 712, 310, 22, .3);
    const hp = el('g', null, B);
    el('rect', { x: 240, y: 620, width: 520, height: 84, rx: 16, fill: grad([[0, '#f6f8fa'], [1, '#cfd8e1']]), stroke: '#a3b1bf', 'stroke-width': 1.4 }, hp);
    el('rect', { x: 268, y: 602, width: 464, height: 22, rx: 8, fill: grad([[0, '#59636d'], [1, '#2b3238']]) }, hp);
    el('circle', { cx: 330, cy: 664, r: 19, fill: grad([[0, '#f0f3f6'], [1, '#aab6c1']]), stroke: '#7f8e9c' }, hp);
    el('line', { x1: 330, y1: 664, x2: 330, y2: 649, stroke: '#3b4650', 'stroke-width': 3, 'stroke-linecap': 'round' }, hp);
    const lamp = el('circle', { cx: 670, cy: 664, r: 8, fill: '#8e969e', stroke: '#6a7178' }, hp);
    const bigX = 300, bigW = 400, bigY = 250, bigH = 352;
    const water = liquid(B, bigX, bigY, bigW, bigH, 92, grad([[0, '#c7e6f7', .78], [1, '#a5d3ee', .86]]));
    const smX = 408, smW = 184, smY = 178, smH = 412;
    /* 작은 비커 + 에탄올 */
    const eth = liquid(B, smX, smY, smW, smH, 195, grad([[0, '#f2f8ee', .92], [1, '#e8f2e4', .95]]));
    const ethG = liquid(B, smX, smY, smW, smH, 195, '#79b43f'); ethG.lg.setAttribute('opacity', 0);
    const bubblesW = el('g', null, B), bubbleE = el('g', null, B);
    const inLeaf = (x, y, r, s, pet) => { const l = drawLeaf(B, LEAF(), PAL.pep, { tf: `translate(${x} ${y}) rotate(${r}) scale(${s})`, pet, petW: 3.6, layers: ['pale'] }); l.layers.pale.setAttribute('fill', PALE); return l; };
    const bA = inLeaf(442, 448, 12, .62, 12), bB = inLeaf(558, 528, 196, .62, 38);
    beaker(B, smX, smY, smW, smH);
    beaker(B, bigX, bigY, bigW, bigH, { marks: true });
    const lE = lab('b', 672, 470, '에탄올', '').show(false), lW = lab('b', 790, 390, '물', '').show(false);
    el('path', { d: 'M590 470H640', stroke: '#14263b', 'stroke-width': 1, opacity: .6 }, B);
    el('path', { d: 'M690 390H770', stroke: '#14263b', 'stroke-width': 1, opacity: .6 }, B);
    const lT = lab('b', 500, 742, '약 70 ℃~80 ℃의 물에 물중탕', 'm');
    const lTime = lab('b', 500, 118, '', 'bg big').show(false);

    /* === 장면 C: 페트리 접시 === */
    const C = el('g', { style: 'display:none' }, root); bench(C, 700);
    const dish = (cx, cy, name, pet) => {
      const g = el('g', null, C);
      shadow(g, cx, cy + 66, 196, 34, .28);
      el('ellipse', { cx, cy: cy + 22, rx: 180, ry: 80, fill: grad([[0, '#eef2f5'], [1, '#c8d3dc']]), stroke: '#8e9fae', 'stroke-width': 1.5 }, g);
      el('ellipse', { cx, cy, rx: 180, ry: 80, fill: grad([[0, '#f8fafb'], [1, '#e4eaef']]), stroke: '#8e9fae', 'stroke-width': 1.5 }, g);
      el('ellipse', { cx, cy: cy + 4, rx: 167, ry: 71, fill: grad([[0, '#fdfefe'], [1, '#eff3f6']]), stroke: '#b7c4cf', 'stroke-width': 1 }, g);
      const tfm = `translate(${cx - 114} ${cy + 18}) rotate(-7) scale(1.3 .78)`;
      const l = drawLeaf(g, LEAF(), { ...PAL.pep, a: '#9fb06a', b: '#b0bb74', v: '#e6e4b8', e: '#7f8a4c', p: '#a6b070' }, { tf: tfm, pet, petW: 4, layers: ['pale', 'amber', 'blue'], shade: .06 });
      const clipA = PS.nid('k'), clipB = PS.nid('k');
      const lg = l.g, ca = el('clipPath', { id: clipA }, lg), cb = el('clipPath', { id: clipB }, lg);
      const cA = el('circle', { cx: 86, cy: 0, r: 0 }, ca), cB = el('circle', { cx: 86, cy: 0, r: 0 }, cb);
      l.layers.pale.setAttribute('fill', PALE); l.layers.pale.setAttribute('opacity', 1);
      l.layers.amber.setAttribute('fill', AMBER); l.layers.amber.setAttribute('clip-path', `url(#${clipA})`);
      l.layers.blue.setAttribute('fill', BLUE); l.layers.blue.setAttribute('clip-path', `url(#${clipB})`);
      const puddle = el('ellipse', { cx, cy: cy + 18, rx: 0, ry: 0, fill: '#d99a3a', opacity: .55 }, g);
      g.insertBefore(puddle, l.g);
      return { g, l, cA, cB, puddle, cx, cy, leafY: cy + 12 };
    };
    const DY = 520, dA = dish(255, DY, 'A', 12), dB = dish(745, DY, 'B', 40);
    const tagA = lab('c', 255, DY + 122, '빛을 받지 못한 잎', 'bg'), tagB = lab('c', 745, DY + 122, '빛을 받은 잎', 'bg');
    /* 돋보기 */
    const lensMk = (d, hasStarch) => {
      const g = el('g', { opacity: 0, style: 'pointer-events:none' }, C), cx = d.cx, cy = 200, r = 136, id = PS.nid('k');
      el('line', { x1: cx, y1: cy + r, x2: d.cx, y2: d.leafY - 22, stroke: '#14263b', 'stroke-width': 1.2 }, g);
      el('circle', { cx: d.cx, cy: d.leafY - 10, r: 12, fill: 'none', stroke: '#14263b', 'stroke-width': 1.4 }, g);
      const c = el('clipPath', { id }, g); el('circle', { cx, cy, r }, c);
      const inn = el('g', { 'clip-path': `url(#${id})` }, g);
      el('rect', { x: cx - r, y: cy - r, width: 2 * r, height: 2 * r, fill: '#f0ecc4' }, inn);
      const Q = mk(hasStarch ? 3 : 4);
      [[-50, -55, -18], [55, -38, 24], [-30, 55, 12], [66, 62, -24]].forEach(([dx, dy, a]) => {
        const k = el('g', { transform: `translate(${cx + dx} ${cy + dy}) rotate(${a})` }, inn);
        el('ellipse', { rx: 60, ry: 34, fill: '#e2dc9f', stroke: '#a8a264', 'stroke-width': 2 }, k);
        el('ellipse', { rx: 51, ry: 26, fill: '#ece7b3', stroke: '#bdb778', 'stroke-width': 1 }, k);
        if (hasStarch) [[-26, -6, 14, 9], [6, 8, 15, 10], [24, -10, 11, 7.5]].forEach(([x, y, a1, b1]) => el('ellipse', { cx: x + Q() * 4, cy: y, rx: a1, ry: b1, fill: grad([[0, '#4a49a0'], [1, BLUE]], { r: 1, rr: .6, cx: .35, cy: .3 }), stroke: '#15153f', 'stroke-width': .8 }, k));
      });
      el('circle', { cx, cy, r, fill: 'none', stroke: '#14263b', 'stroke-width': 2.2 }, g);
      return g;
    };
    const lensA = lensMk(dA, false), lensB = lensMk(dB, true);
    const lNoA = lab('c', 255, 374, '엽록체 속에 <b>녹말이 없어요</b>', 'bg').show(false), lNoB = lab('c', 745, 374, '엽록체 속 <b>녹말이 청람색</b>으로', 'bg').show(false);
    /* 스포이트 */
    const dr = el('g', { opacity: 0 }, C);
    el('path', { d: 'M-9 -86V-8L-3 8H3L9 -8V-86Z', fill: 'rgba(235,243,249,.8)', stroke: '#7f94a8', 'stroke-width': 1.5 }, dr);
    el('path', { d: 'M-8 -52V-8L-2.6 7H2.6L8 -8V-52Z', fill: '#c98a2e', opacity: .9 }, dr);
    el('path', { d: 'M-14 -84H14V-96C14 -128 -14 -128 -14 -96Z', fill: grad([[0, '#6d7883'], [1, '#3e4750']], { x2: 1, y2: 0 }), stroke: '#2f363d', 'stroke-width': 1 }, dr);
    const lDr = lab('c', 500, 300, '아이오딘-아이오딘화 칼륨 용액', 'm').show(false);
    const drops = el('g', null, C);
    const setDr = (x, y, a = 1) => { dr.setAttribute('transform', `translate(${x} ${y})`); dr.setAttribute('opacity', a); };
    setDr(500, 120, 0);

    /* 물방울 움직임 */
    let bubbling = 0; const bub = [];
    loop((dt) => {
      if (bubbling > 0 && Math.random() < dt * 22) {
        const onLeft = Math.random() < .5, x = onLeft ? bigX + 18 + Math.random() * 84 : smX + smW + 8 + Math.random() * 84;
        bub.push({ x, y: bigY + bigH - 14, r: 2 + Math.random() * 3.6, v: 40 + Math.random() * 40, c: el('circle', { fill: 'rgba(255,255,255,.65)', stroke: 'rgba(90,130,160,.6)', 'stroke-width': .8 }, bubblesW), top: bigY + 94 });
      }
      for (let i = bub.length - 1; i >= 0; i--) { const b = bub[i]; b.v += 26 * dt; b.y -= b.v * dt; b.x += Math.sin(b.y * .08) * .25; if (b.y < b.top) { b.c.remove(); bub.splice(i, 1); continue; } b.c.setAttribute('cx', PS.f1(b.x)); b.c.setAttribute('cy', PS.f1(b.y)); b.c.setAttribute('r', PS.f1(b.r)); }
    });

    let scene = 'a';
    const show = (s) => {
      scene = s; A.style.display = s === 'a' ? '' : 'none'; B.style.display = s === 'b' ? '' : 'none'; C.style.display = s === 'c' ? '' : 'none';
      Object.entries(lbs).forEach(([k, a]) => a.forEach((l) => { if (k !== s) { l.e.style.display = 'none'; } else l.e.style.display = ''; }));
    };
    const fade = (s, cb) => {
      const cur = { a: A, b: B, c: C }[scene], nx = { a: A, b: B, c: C }[s];
      if (fast) { show(s); cb && cb(); return; }
      tween(260, (t) => { cur.style.opacity = 1 - t; }, () => { cur.style.opacity = 1; show(s); nx.style.opacity = 0; tween(320, (t) => { nx.style.opacity = t; }, cb); });
    };
    show('a');
    if (o.startDish) { show('c'); }

    const api = {
      wrap(cb) {
        lPaper.show(true);
        paper.setAttribute('opacity', 1);
        tween(T(800), (t) => { pIn.setAttribute('transform', `translate(${(1 - t) * 40} ${(1 - t) * -150}) rotate(${(1 - t) * -14} 100 0)`); paper.setAttribute('opacity', clamp(t * 2)); }, () => { lLeaf.show(true); cb && cb(); });
      },
      sunny(cb) {
        sunG.style.transition = fast ? 'none' : 'opacity .6s'; sunG.setAttribute('opacity', 1);
        const a = [880, 70];
        tween(T(3400), (t) => { sun.setAttribute('transform', `translate(${lerp(880, 610, t)} ${70 - Math.sin(t * Math.PI) * 26})`); rayB.setAttribute('transform', `translate(${-t * 240} 0)`); }, cb, (t) => t);
      },
      pick(cb) {
        lPaper.show(false); lLeaf.show(false);
        tween(T(620), (t) => { pIn.setAttribute('transform', `translate(${t * 120} ${t * 190}) rotate(${t * -18} 100 0)`); paper.setAttribute('opacity', 1 - t); }, () => {
          const start = [LA.g.getAttribute('transform'), LB.g.getAttribute('transform')];
          tween(T(620), (t) => { LA.g.setAttribute('transform', `translate(${lerp(424, 560, t)} ${lerp(462, 240, t)}) rotate(${lerp(186, 110, t)}) scale(1.12)`); LB.g.setAttribute('transform', `translate(${lerp(436, 620, t)} ${lerp(434, 220, t)}) rotate(${lerp(-14, 70, t)}) scale(1.12)`); }, () => {
            fade('b', () => { lE.show(true); lW.show(true); cb && cb(); });
          });
        });
      },
      bath(cb) {
        lamp.setAttribute('fill', '#e5533f'); bubbling = 1; lTime.show(true);
        tween(T(4200), (t) => {
          ethG.lg.setAttribute('opacity', t * .72);
          bA.layers.pale.setAttribute('opacity', t * .92); bB.layers.pale.setAttribute('opacity', t * .92);
          lTime.set(`물중탕 ${Math.round(t * 10)}분`);
        }, () => { bubbling = 0; lamp.setAttribute('fill', '#8e969e'); lTime.set('잎의 초록색이 에탄올로 빠졌어요'); cb && cb(); }, (t) => t);
      },
      rinse(cb) { fade('c', cb); },
      drop(which, cb) {
        const d = which === 'A' ? dA : dB, x = d.cx, y0 = d.leafY - 80;
        lDr.show(true); lDr.move(x, 262);
        const fin = () => {
          const col = which === 'B';
          tween(T(col ? 2800 : 1500), (t) => {
            d.cA.setAttribute('r', t * 150); d.l.layers.amber.setAttribute('opacity', col ? .9 * (1 - clamp((t - .35) / .65)) + .0 : .86);
            d.puddle.setAttribute('rx', t * 150); d.puddle.setAttribute('ry', t * 58);
            if (col) { d.cB.setAttribute('r', clamp((t - .25) / .75) * 150); d.l.layers.blue.setAttribute('opacity', clamp((t - .25) / .75) * .96); d.l.veins.setAttribute('opacity', .55); }
          }, () => { setDr(x, y0, 0); lDr.show(false); cb && cb(); }, (t) => t);
        };
        if (fast) { fin(); return; }
        setDr(x + 120, 200, 1);
        tween(620, (t) => setDr(lerp(x + 120, x, t), lerp(200, y0 - 40, t), clamp(t * 3)), () => {
          let n = 0; const one = () => {
            const c = el('path', { d: 'M0 -7C4 -2 5 2 0 5-5 2-4 -2 0 -7Z', fill: '#c98a2e' }, drops); const top = y0 - 30, H = d.leafY - top;
            tween(420, (t) => c.setAttribute('transform', `translate(${x} ${top + H * t})`), () => { c.remove(); if (++n === 1) fin(); if (n < 3) setTimeout(one, 200); }, (t) => t * t);
          }; one();
        });
      },
      lens(cb) {
        lNoA.show(true); lNoB.show(true);
        tween(T(600), (t) => { lensA.setAttribute('opacity', t); lensB.setAttribute('opacity', t); }, cb);
      },
      jump(n) {
        fast = true;
        const seq = [api.wrap, api.sunny, api.pick, api.bath, api.rinse, (c) => { api.drop('A', () => api.drop('B', c)); }, api.lens];
        const go = (i) => { if (i >= n) { fast = false; return; } seq[i](() => go(i + 1)); }; go(0);
      },
      view(vb) { ST.svg.setAttribute('viewBox', vb.join(' ')); ST.place(); },
      dropA: dA, dropB: dB, get scene() { return scene; },
    };
    return api;
  };

  /* 그림 Ⅴ-1 형식: 엽록체 속 포도당이 이어져 녹말이 됨 */
  PS.starchFig = function (host) {
    const ST = stage(host, [0, 0, 1000, 520]), g = el('g', null, ST.svg);
    el('rect', { x: -500, y: -500, width: 2000, height: 1500, fill: '#fff' }, g);
    const D = leafData({ L: 1000, W: 300, p: .62, q: .92, seed: 12, bend: .01, nA: 320, D: 22, di: 80, vw: 14, sec: 9, n: 120 });
    drawLeaf(g, D, PAL.sun, { tf: 'translate(0 260)', edge: 1.4 });
    const b = el('g', null, g), CX = 500, CY = 260;
    el('ellipse', { cx: CX, cy: CY, rx: 360, ry: 196, fill: grad([[0, '#d9efb8'], [1, '#b6dd8f']]), stroke: '#2d7030', 'stroke-width': 5 }, b);
    el('ellipse', { cx: CX, cy: CY, rx: 346, ry: 182, fill: 'none', stroke: '#3f8a3a', 'stroke-width': 2 }, b);
    ST.label(CX, 44, '엽록체', 'bg big'); const lG = ST.label(290, 110, '포도당', 'bg'); const lS = ST.label(645, 382, '녹말', 'bg');
    lS.show(false);
    const links = el('g', { stroke: '#a66d0a', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, b), hx = el('g', null, b), N = 18, R = mk(4);
    const ROW = 6, slot = (i) => { const r = Math.floor(i / ROW), c = i % ROW, cc = r % 2 ? ROW - 1 - c : c; return [560 + cc * 34, 210 + r * 48 + (c % 2 ? 6 : -6)]; };
    const start = []; for (let i = 0; i < N; i++) start.push([220 + R() * 240, 150 + R() * 230, R() * 60]);
    const uses = start.map((s) => PS.sprite('mGlu', s[0], s[1], 1.25, hx));
    const set = (u, x, y, a = 0) => u.setAttribute('transform', `translate(${x} ${y}) rotate(${a}) scale(1.25)`);
    const reset = () => { links.innerHTML = ''; lS.show(false); lG.move(290, 110); uses.forEach((u, i) => set(u, start[i][0], start[i][1], start[i][2])); };
    reset();
    return {
      reset,
      play(cb) {
        let i = 0; const next = () => {
          if (i >= N) { lS.show(true); lG.move(645, 158); cb && cb(); return; }
          const k = i++, s = start[k], c = slot(k);
          tween(PS.REDUCE ? 0 : 230, (t) => set(uses[k], lerp(s[0], c[0], t), lerp(s[1], c[1], t) - Math.sin(t * Math.PI) * 26, s[2] * (1 - t)), () => { if (k) { const q = slot(k - 1); el('line', { x1: q[0], y1: q[1], x2: c[0], y2: c[1] }, links); b.appendChild(hx); } next(); });
        }; next();
      },
      end() { uses.forEach((u, k) => { const c = slot(k); set(u, c[0], c[1]); if (k) { const q = slot(k - 1); el('line', { x1: q[0], y1: q[1], x2: c[0], y2: c[1] }, links); } }); lS.show(true); },
    };
  };
})();
