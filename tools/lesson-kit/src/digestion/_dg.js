/* ===== 소화 그림 도구 DG: 침의 소화 시험관, 소화계와 영양소 돋보기, 작은창자 융털. 모두 새로 그림.
   입자의 수와 크기, 시간은 정한 모형이다. 교과서 그림 Ⅵ-3~Ⅵ-7 형식을 빌렸다. */
window.DG = (() => {
  'use strict';
  const { el, grad, tween, loop, lerp, clamp, stage, shadow, f1, mk, polyAt, flock, defs, REDUCE } = PS;
  let okS = false;
  function symbols() {
    if (okS) return; okS = true; PS.defs(); const d = defs();
    const hex = (id, c1, c2, st) => { const g = el('g', { id }, d); el('path', { d: 'M12 0 6 10.4H-6L-12 0-6-10.4H6Z', fill: grad([[0, c1], [1, c2]]), stroke: st, 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, g); };
    hex('dGlu', '#ffd76a', '#e8a21c', '#a66d0a');
    const am = el('g', { id: 'dAmi' }, d); el('circle', { r: 10, fill: grad([[0, '#ef9ab5'], [1, '#c8486f']], { r: 1, cx: .38, cy: .32, rr: .8 }), stroke: '#8f2a4c', 'stroke-width': 1 }, am);
    const fa = el('g', { id: 'dFa' }, d); el('path', { d: 'M-16 0Q-8 -7 0 0T16 0', fill: 'none', stroke: '#a4a11f', 'stroke-width': 5, 'stroke-linecap': 'round' }, fa);
    const mg = el('g', { id: 'dMg' }, d); el('circle', { r: 8, fill: '#d8d34a', stroke: '#8f8c1a' }, mg); el('path', { d: 'M8 0Q14 -5 20 0', fill: 'none', stroke: '#a4a11f', 'stroke-width': 4.4, 'stroke-linecap': 'round' }, mg);
    const mn = el('g', { id: 'dMin' }, d); el('rect', { x: -7, y: -7, width: 14, height: 14, rx: 2, fill: '#8fb7d6', stroke: '#4c7898', transform: 'rotate(45)' }, mn);
  }

  /* --- 침의 소화 작용 시험관 --- */
  function saliva(host) {
    const ST = stage(host, [0, 0, 1000, 760]), root = el('g', null, ST.svg); PS.bench(root, 700);
    const TW = 88, TY = 130, TH = 450;
    /* 비커 */
    shadow(root, 500, 706, 340, 14, .22);
    const bx = 170, bw = 660;
    const BK = el('g', { opacity: 0 }, root);
    el('path', { d: `M${bx} 360V${690}Q${bx} 702 ${bx + 14} 702H${bx + bw - 14}Q${bx + bw} 702 ${bx + bw} 690V360`, fill: 'rgba(226,238,245,.3)', stroke: '#8ba0b2', 'stroke-width': 2.2 }, BK);
    el('rect', { x: bx + 2, y: 410, width: bw - 4, height: 290, rx: 10, fill: grad([[0, '#d9eef8'], [1, '#bfdff0']]), opacity: .8 }, BK);
    const tml = ST.label(500, 440, '35 ℃~40 ℃의 물', 'm').show(false);
    /* 시험관대 없이 두 시험관을 띄워 보여 준다 */
    const TUBE = {};
    [['A', 340, '침을 적신 면봉'], ['B', 660, '증류수를 적신 면봉']].forEach(([k, x, sw]) => {
      const g = el('g', null, root), cid = PS.nid('cl');
      const cp = el('clipPath', { id: cid }, g); el('path', { d: `M${x - TW / 2} ${TY}V${TY + TH - TW / 2}A${TW / 2} ${TW / 2} 0 0 0 ${x + TW / 2} ${TY + TH - TW / 2}V${TY}Z` }, cp);
      const liq = el('rect', { x: x - TW / 2, y: TY + 150, width: TW, height: TH, fill: '#f2f4ee', 'clip-path': `url(#${cid})` }, g);
      el('path', { d: `M${x - TW / 2} ${TY}V${TY + TH - TW / 2}A${TW / 2} ${TW / 2} 0 0 0 ${x + TW / 2} ${TY + TH - TW / 2}V${TY}`, fill: 'rgba(255,255,255,.14)', stroke: '#7f94a5', 'stroke-width': 2.2 }, g);
      el('ellipse', { cx: x, cy: TY, rx: TW / 2 + 4, ry: 8, fill: '#f1f6f9', stroke: '#7f94a5', 'stroke-width': 2 }, g);
      /* 면봉 */
      const s = el('g', { opacity: 0 }, g);
      el('rect', { x: x - 3, y: TY - 34, width: 6, height: 274, rx: 3, fill: '#f7f4ec', stroke: '#c2bba9' }, s);
      el('ellipse', { cx: x, cy: TY + 244, rx: 11, ry: 21, fill: '#fff', stroke: '#c2bba9' }, s);
      const nm = ST.label(x, TY - 62, `시험관 ${k}`, 'big');
      const sl = ST.label(x + TW / 2 + 12, TY + 40, sw, 'ra m').show(false); sl.e.style.fontSize = 'clamp(11px,1.2vw,14px)';
      /* 녹말 사슬 돋보기 */
      TUBE[k] = { g, x, liq, s, sl };
    });
    /* 돋보기: 녹말 사슬이 끊어지는 모습 */
    symbols();
    const lens = el('g', { opacity: 0, style: 'transition:opacity .4s' }, root);
    el('circle', { cx: 120, cy: 210, r: 96, fill: '#fff', stroke: '#14263b', 'stroke-width': 2.2 }, lens);
    const cG = el('g', null, lens);
    const lensL = ST.label(120, 322, '시험관 A 속', 'm').show(false); lensL.e.style.fontSize = 'clamp(11px,1.2vw,14px)';
    const n = 8, cells = Array.from({ length: n }, (_, i) => { const u = el('use', { href: '#dGlu', opacity: 1 }, cG); return { u, x0: 120 - 66 + i * 19, y0: 210 + Math.sin(i * .9) * 14, gx: 120 + (((i * 5) % 7) - 3) * 22, gy: 210 + ((i * 3) % 5 - 2) * 28 }; });
    const chain = (t) => cells.forEach((c) => c.u.setAttribute('transform', `translate(${f1(lerp(c.x0, Math.floor(c.gx), t))} ${f1(lerp(c.y0, c.gy, t))}) scale(.72)`));
    chain(0);
    const STARCH = '#f2f4ee', BLUE = '#23245c', BROWN = '#c58a2a';
    const mix = (a, b, t) => { const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`; };
    const api = {
      ST,
      iodine(cb) { tween(1100, (t) => { TUBE.A.liq.setAttribute('fill', mix(STARCH, BLUE, t)); TUBE.B.liq.setAttribute('fill', mix(STARCH, BLUE, t)); }, cb); },
      swab(cb) { ['A', 'B'].forEach((k) => { TUBE[k].sl.show(true); tween(800, (t) => { TUBE[k].s.setAttribute('opacity', t); TUBE[k].s.setAttribute('transform', `translate(0 ${f1(lerp(-80, 0, t))})`); }); }); setTimeout(() => cb && cb(), REDUCE ? 0 : 900); },
      warm(cb) {
        BK.setAttribute('opacity', 1); tml.show(true); lens.setAttribute('opacity', 1); lensL.show(true);
        tween(REDUCE ? 0 : 5200, (t) => { TUBE.A.liq.setAttribute('fill', mix(BLUE, STARCH, clamp((t - .15) / .75))); chain(clamp((t - .1) / .8)); }, cb, (x) => x);
      },
      jump(step) { if (step >= 1) { TUBE.A.liq.setAttribute('fill', BLUE); TUBE.B.liq.setAttribute('fill', BLUE); } if (step >= 2) ['A', 'B'].forEach((k) => { TUBE[k].s.setAttribute('opacity', 1); TUBE[k].sl.show(true); }); if (step >= 3) { BK.setAttribute('opacity', 1); tml.show(true); lens.setAttribute('opacity', 1); lensL.show(true); TUBE.A.liq.setAttribute('fill', STARCH); chain(1); } },
    };
    return api;
  }

  /* --- 소화계와 영양소 돋보기 --- */
  const PATH_ST = {
    mouth: [[285, 72]],
    eso: [[285, 72], [285, 120], [290, 170], [298, 222]],
    sto: [[298, 222], [330, 248], [372, 280], [372, 320], [330, 348], [288, 352]],
    si: [[288, 352], [260, 372], [262, 408], [310, 412], [360, 416], [360, 440], [300, 442], [230, 442], [220, 468], [300, 472], [362, 474], [362, 498], [290, 502], [222, 502], [222, 528], [300, 532], [352, 534]],
    li: [[352, 534], [408, 540], [420, 470], [410, 400], [340, 380], [180, 380], [136, 410], [128, 500], [150, 575], [240, 600], [278, 612]],
    anus: [[278, 612], [282, 650], [282, 682]],
  };
  const ALL = ['eso', 'sto', 'si', 'li', 'anus'].reduce((a, k) => a.concat(PATH_ST[k].slice(1)), [[285, 72]]);
  const STAGE = ['mouth', 'eso', 'sto', 'si', 'li', 'anus'];
  function journey(host) {
    symbols();
    const ST = stage(host, [0, 0, 1000, 760]), root = el('g', null, ST.svg);
    el('rect', { x: -200, width: 1400, height: 760, fill: '#fff' }, root);
    /* 몸 윤곽: 얼굴 표정 없이 옅은 실루엣 */
    el('path', { d: 'M215 40C215 -8 355 -8 355 40C355 86 325 122 318 136V164C390 176 470 208 478 262L472 790H98L92 262C100 208 180 176 252 164V136C245 122 215 86 215 40Z', fill: grad([[0, '#f6e4d6'], [1, '#efd5c3']]), stroke: '#dcbfac', 'stroke-width': 1.5 }, root);
    const tube = (pts, w, c1, c2) => { let d = `M${pts[0][0]} ${pts[0][1]}`; for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; d += `Q${pts[i][0]} ${pts[i][1]} ${f1(mx)} ${f1(my)}`; } d += `L${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`; [[w, c1], [w - 6, c2], [Math.max(2, w * .18), '#fff3ec']].forEach(([sw, s], i) => el('path', { d, fill: 'none', stroke: s, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: i === 2 ? .35 : 1 }, root)); };
    const smooth = (pts) => { let o = []; for (let i = 0; i < pts.length - 1; i++) { o.push(pts[i]); } o.push(pts[pts.length - 1]); return o; };
    /* 큰창자 */
    tube(PATH_ST.li.concat(PATH_ST.anus.slice(1)), 40, '#b4784c', '#dfa778');
    /* 간·쓸개 */
    el('path', { d: 'M152 262C184 214 268 214 306 244C322 262 300 306 258 318C210 332 150 322 140 298C136 284 142 274 152 262Z', fill: grad([[0, '#a84b3f'], [1, '#6f2a22']], { x2: .6, y2: 1 }), stroke: '#541f19' }, root);
    el('path', { d: 'M222 322C210 346 226 362 244 352C256 342 252 328 246 318Z', fill: grad([[0, '#6f9e3f'], [1, '#42752b']]), stroke: '#2f5a1f' }, root);
    /* 식도 */
    tube(PATH_ST.eso, 22, '#c4806f', '#eab3a2');
    /* 위 */
    el('path', { d: 'M290 214C318 204 370 212 398 256C420 296 402 348 354 366C322 378 288 372 276 352C286 342 318 336 332 316C342 296 310 268 290 240Z', fill: grad([[0, '#eb9c8f'], [1, '#c9604f']], { x2: .8, y2: 1 }), stroke: '#96402f', 'stroke-width': 1.4 }, root);
    /* 이자 */
    el('path', { d: 'M284 392C310 372 370 372 402 356C416 352 420 368 408 376C378 398 330 412 292 410C280 408 276 398 284 392Z', fill: grad([[0, '#ecd27e'], [1, '#c9a146']]), stroke: '#927127' }, root);
    /* 작은창자 */
    tube(PATH_ST.si.slice(0, 4), 22, '#c4806f', '#eeb7a8');
    tube(PATH_ST.si.slice(3), 22, '#c4806f', '#f2c0b1');
    /* 침샘·입 */
    [[232, 92], [338, 92]].forEach(([x, y]) => el('ellipse', { cx: x, cy: y, rx: 20, ry: 13, fill: grad([[0, '#f5d4a0'], [1, '#d7a35f']]), stroke: '#a57837' }, root));
    el('path', { d: 'M252 66Q285 92 318 66Q285 76 252 66Z', fill: '#8f3f3a' }, root);
    /* 이름표 */
    const L = {};
    [['침샘', 182, 92], ['입', 285, 40], ['식도', 232, 180], ['간', 208, 276], ['쓸개', 198, 348], ['위', 356, 292], ['이자', 442, 372], ['작은창자', 292, 568, 'bg'], ['큰창자', 92, 460], ['항문', 340, 680]].forEach(([n, x, y, c]) => { L[n] = ST.label(x, y, n, 'bg'); L[n].e.style.fontSize = 'clamp(11px,1.25vw,14.5px)'; });
    /* 음식물 덩어리 */
    const bol = el('g', null, root); el('ellipse', { rx: 14, ry: 11, fill: grad([[0, '#e5c07f'], [1, '#b47e3f']], { r: 1, cx: .38, cy: .32, rr: .8 }), stroke: '#7c5526' }, bol);
    /* 돋보기 판 */
    const PX = 520, PY = 24, PW = 464, PH = 712;
    el('rect', { x: PX, y: PY, width: PW, height: PH, rx: 22, fill: '#f7fafc', stroke: '#dbe4ed' }, root);
    const rowY = [160, 370, 590], rows = [['탄수화물', '#14263b'], ['단백질', '#14263b'], ['지방', '#14263b']];
    rows.forEach(([n], i) => { const l = ST.label(PX + 24, rowY[i] - 92, n, 'ra big'); el('line', { x1: PX + 24, x2: PX + PW - 24, y1: rowY[i] + 96, y2: rowY[i] + 96, stroke: '#e3eaf0', opacity: i === 2 ? 0 : 1 }, root); });
    const stL = [0, 1, 2].map((i) => { const l = ST.label(PX + PW - 24, rowY[i] - 92, '', 'la m'); l.e.style.fontSize = 'clamp(12px,1.3vw,15px)'; return l; });
    const enzL = [0, 1, 2].map((i) => { const l = ST.label(PX + PW / 2, rowY[i] + 74, '', 'bg'); l.e.style.color = '#0b3f73'; l.e.style.fontSize = 'clamp(12px,1.3vw,15px)'; return l.show(false); });
    const mkItems = (n, k, f, s) => Array.from({ length: n }, (_, i) => { const u = el('use', { href: '#' + k }, root); return { u, s, a: f(i), cur: f(i) }; });
    const CX = PX + PW / 2, GRID = (i, n, y, gx = 60, gy = 46, cols = 6) => { const c = i % cols, r = Math.floor(i / cols), rn = Math.ceil(n / cols); return [CX + (c - (Math.min(cols, n) - 1) / 2) * gx, y + (r - (rn - 1) / 2) * gy]; };
    /* 탄수화물 8개 포도당 사슬, 단백질 8개 구슬 사슬, 지방 큰 방울 */
    const N = 8;
    const carb = mkItems(N, 'dGlu', (i) => [CX - 140 + i * 40, rowY[0] + Math.sin(i * .9) * 14], 1.25);
    const prot = mkItems(N, 'dAmi', (i) => [CX - 140 + i * 40, rowY[1] + Math.sin(i * .8) * 16], 1.5);
    const linkC = el('path', { fill: 'none', stroke: '#a66d0a', 'stroke-width': 3 }, root), linkP = el('path', { fill: 'none', stroke: '#8f2a4c', 'stroke-width': 3 }, root);
    root.insertBefore(linkC, carb[0].u); root.insertBefore(linkP, prot[0].u);
    const fatB = el('path', { d: '', fill: grad([[0, '#fbf1a0'], [1, '#d9c84a']], { r: 1, cx: .38, cy: .32, rr: .8 }), stroke: '#9a8c1f' }, root);
    const drops = Array.from({ length: 12 }, () => el('circle', { r: 0, fill: grad([[0, '#fbf1a0'], [1, '#d9c84a']], { r: 1, cx: .38, cy: .32, rr: .8 }), stroke: '#9a8c1f' }, root));
    const fas = Array.from({ length: 6 }, (_, i) => el('use', { href: i % 3 === 2 ? '#dMg' : '#dFa', opacity: 0 }, root));
    const pos = (it) => { it.u.setAttribute('transform', `translate(${f1(it.cur[0])} ${f1(it.cur[1])}) scale(${it.s})`); };
    const chainLink = (list, groups) => { let d = ''; groups.forEach((g) => { g.forEach((i, j) => { d += (j ? 'L' : 'M') + f1(list[i].cur[0]) + ' ' + f1(list[i].cur[1]); }); }); return d; };
    let gC = [[0, 1, 2, 3, 4, 5, 6, 7]], gP = [[0, 1, 2, 3, 4, 5, 6, 7]], fatS = 0;
    const blob = (r) => `M${CX - r} ${rowY[2]}C${CX - r} ${rowY[2] - r * .9} ${CX + r} ${rowY[2] - r * .9} ${CX + r} ${rowY[2]}C${CX + r} ${rowY[2] + r * .9} ${CX - r} ${rowY[2] + r * .9} ${CX - r} ${rowY[2]}Z`;
    const draw = () => {
      carb.forEach(pos); prot.forEach(pos); linkC.setAttribute('d', chainLink(carb, gC)); linkP.setAttribute('d', chainLink(prot, gP));
      fatB.setAttribute('d', fatS === 0 ? blob(78) : ''); drops.forEach((d, i) => { const on = fatS === 1; d.setAttribute('r', on ? 13 + (i % 3) * 3 : 0); if (on) { const [x, y] = GRID(i, 12, rowY[2], 44, 36); d.setAttribute('cx', x); d.setAttribute('cy', y); } });
      fas.forEach((u, i) => { u.setAttribute('opacity', fatS === 2 ? 1 : 0); const [x, y] = GRID(i, 6, rowY[2], 66, 56, 3); u.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) scale(1.25)`); });
    };
    /* 조각 배치: groups는 사슬 묶음 */
    const layout = (list, groups, y) => { const tot = groups.length, targets = {}; const per = Math.max(1, ...groups.map((g) => g.length)); groups.forEach((g, gi) => { const col = gi % 4, row = Math.floor(gi / 4), rn = Math.ceil(tot / 4); const cx = CX + (col - (Math.min(4, tot) - 1) / 2) * (per > 2 ? 200 / Math.min(4, tot) * 1.6 : per > 1 ? 106 : 92), cy = y + (row - (rn - 1) / 2) * 56; g.forEach((i, j) => { targets[i] = [cx + (j - (g.length - 1) / 2) * 32, cy]; }); }); return targets; };
    const moveTo = (list, targets, cb) => { list.forEach((it) => { it.from = it.cur.slice(); }); tween(REDUCE ? 0 : 1100, (t) => { list.forEach((it, i) => { it.cur = [lerp(it.from[0], targets[i][0], t), lerp(it.from[1], targets[i][1], t)]; }); draw(); }, cb); };
    const STAT = { c: ['녹말', '엿당', '포도당'], p: ['단백질', '작게 분해된 단백질', '아미노산'], f: ['지방 덩어리', '작은 알갱이', '지방산, 모노글리세리드'] };
    stL[0].set('녹말'); stL[1].set('단백질'); stL[2].set('지방 덩어리');
    const enz = (i, t) => { enzL[i].set(t).show(true); setTimeout(() => enzL[i].show(false), REDUCE ? 0 : 2600); };
    let t0 = 0, bolusT = 0, moving = false;
    const lenFrac = (k) => { const n = ['mouth', 'eso', 'sto', 'si', 'li', 'anus'].indexOf(k); /* 길이 비율 계산 */ const seg = ['eso', 'sto', 'si', 'li', 'anus']; let tot = 0, cum = [0]; const L2 = (p) => { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; }; seg.forEach((a) => { tot += L2(PATH_ST[a]); cum.push(tot); }); return cum[n] / tot; };
    const putB = (t) => { const p = polyAt(ALL, t); bol.setAttribute('transform', `translate(${f1(p[0])} ${f1(p[1])})`); };
    putB(0);
    const api = {
      ST,
      move(to, cb) { const a = bolusT, b = lenFrac(to); tween(REDUCE ? 0 : Math.max(800, (b - a) * 5200), (t) => { bolusT = lerp(a, b, t); putB(bolusT); }, cb, (x) => x); },
      mouth(cb) { enz(0, '침 속 아밀레이스'); gC = [[0, 1], [2, 3], [4, 5], [6, 7]]; stL[0].set('엿당'); moveTo(carb, layout(carb, gC, rowY[0]), cb); },
      stomach(cb) { enz(1, '위액 속 펩신'); gP = [[0, 1, 2, 3], [4, 5, 6, 7]]; stL[1].set('작게 분해된 단백질'); moveTo(prot, layout(prot, gP, rowY[1]), cb); },
      bile(cb) { enz(2, '쓸개즙: 소화효소는 없어요'); fatS = 1; stL[2].set('작은 알갱이'); draw(); setTimeout(() => cb && cb(), REDUCE ? 0 : 1100); },
      small(cb) {
        enz(0, '이자액의 아밀레이스, 작은창자의 소화효소'); enz(1, '이자액의 트립신, 작은창자의 소화효소');
        gC = carb.map((_, i) => [i]); gP = prot.map((_, i) => [i]);
        stL[0].set('포도당'); stL[1].set('아미노산'); moveTo(carb, layout(carb, gC, rowY[0])); moveTo(prot, layout(prot, gP, rowY[1]), () => { enz(2, '이자액의 라이페이스'); fatS = 2; stL[2].set('지방산, 모노글리세리드'); draw(); cb && cb(); });
      },
      jump() { bolusT = lenFrac('anus'); putB(bolusT); fatS = 2; gC = carb.map((_, i) => [i]); gP = prot.map((_, i) => [i]); const tc = layout(carb, gC, rowY[0]), tp = layout(prot, gP, rowY[1]); carb.forEach((c, i) => { c.cur = tc[i]; }); prot.forEach((c, i) => { c.cur = tp[i]; }); stL[0].set('포도당'); stL[1].set('아미노산'); stL[2].set('지방산, 모노글리세리드'); draw(); },
    };
    draw();
    return api;
  }

  /* --- 작은창자 안쪽 벽과 융털 --- */
  function villus(host) {
    symbols();
    const ST = stage(host, [0, 0, 1000, 760]), root = el('g', null, ST.svg);
    el('rect', { x: -200, width: 1400, height: 760, fill: grad([[0, '#fff5ec'], [1, '#fbe9dc']]) }, root);
    /* 벽 바탕 */
    el('rect', { x: -200, y: 560, width: 1400, height: 240, fill: grad([[0, '#e39a86'], [1, '#b95d4b']]) }, root);
    const VX = [90, 270, 450, 630, 810, 985], VT = 170;
    const villi = el('g', null, root);
    const one = (x, w, top, big) => {
      const g = el('g', null, villi), base = 590;
      el('path', { d: `M${x - w} ${base}C${x - w} ${top + 90} ${x - w * .75} ${top} ${x} ${top}C${x + w * .75} ${top} ${x + w} ${top + 90} ${x + w} ${base}Z`, fill: grad([[0, '#f7c2ae'], [1, '#e79d88']], { x2: 1, y2: 0 }), stroke: '#b5604c', 'stroke-width': 1.4 }, g);
      /* 모세혈관 */
      const cap = el('g', { fill: 'none', 'stroke-width': big ? 5 : 3, 'stroke-linecap': 'round' }, g);
      el('path', { d: `M${x - w * .62} ${base}C${x - w * .62} ${top + 170} ${x - w * .5} ${top + 44} ${x} ${top + 30}`, stroke: '#d0392b' }, cap);
      el('path', { d: `M${x + w * .62} ${base}C${x + w * .62} ${top + 170} ${x + w * .5} ${top + 44} ${x} ${top + 30}`, stroke: '#3b6fc4' }, cap);
      for (let i = 0; i < 6; i++) { const y = top + 80 + i * (base - top - 90) / 6, q = w * .58; el('path', { d: `M${x - q} ${y}Q${x} ${y + 16 * (i % 2 ? 1 : -1)} ${x + q} ${y}`, stroke: '#b1456a', 'stroke-width': big ? 2 : 1.3 }, cap); }
      /* 암죽관 */
      el('path', { d: `M${x} ${base}V${top + 76}`, fill: 'none', stroke: '#f6efa6', 'stroke-width': big ? 16 : 8, 'stroke-linecap': 'round' }, g);
      el('path', { d: `M${x} ${base}V${top + 76}`, fill: 'none', stroke: '#c8bc47', 'stroke-width': big ? 1.6 : 1 }, g);
      return g;
    };
    VX.forEach((x, i) => one(x, 76, VT + (i % 2 ? 20 : 0), false));
    const big = one(450, 150, 80, true);
    /* 이름표 */
    const lc = ST.label(640, 300, '모세혈관', 'bg'), la = ST.label(450, 520, '암죽관', 'bg'), lv = ST.label(450, 44, '융털', 'bg'), lw = ST.label(92, 640, '작은창자 안쪽 벽', 'ra lt');
    lc.e.style.color = '#b1361f'; la.e.style.color = '#7a7312';
    /* 입자 */
    const fl = flock(root), R = Math.random;
    const KIND = { glu: ['dGlu', 'cap', '포도당'], ami: ['dAmi', 'cap', '아미노산'], min: ['dMin', 'cap', '무기염류'], fa: ['dFa', 'lac', '지방산'], mg: ['dMg', 'lac', '모노글리세리드'] };
    let auto = null;
    const path = (t) => {
      const sx = 80 + R() * 840, sy = 30 + R() * 90, k = KIND[t];
      const side = R() < .5 ? -1 : 1;
      if (k[1] === 'cap') { const ent = [450 + side * 118, 270 + R() * 140]; return [[sx, sy], ent, [450 + side * 92, ent[1] + 40], [450 + side * 92, 590], [450 + side * 90, 770]]; }
      const ent = [450 + side * 60, 240 + R() * 120]; return [[sx, sy], [450 + side * 130, ent[1] - 30], ent, [450, ent[1] + 40], [450, 770]];
    };
    const api = {
      ST,
      send(t, n = 5, cb) { let i = 0; const go = () => { if (i++ >= n) { cb && cb(); return; } fl.add(KIND[t][0], path(t), { dur: 4.2, s: 1.1, spin: 40, fi: .05, fo: .05, wob: 3 }); setTimeout(go, REDUCE ? 0 : 240); }; go(); },
    };
    loop((dt) => fl.step(dt));
    return api;
  }
  /* 주름 비교 작은 그림 */
  function fold(host) {
    const ST = stage(host, [0, 0, 720, 300]), root = el('g', null, ST.svg);
    el('rect', { width: 720, height: 300, fill: '#fff' }, root);
    const a = el('path', { d: 'M20 130H340', fill: 'none', stroke: '#c9604f', 'stroke-width': 8 }, root);
    el('rect', { x: 20, y: 134, width: 320, height: 166, fill: '#f0c0ae' }, root);
    const pts = []; for (let i = 0; i <= 200; i++) { const t = i / 200, x = 380 + t * 320, big = Math.sin(t * Math.PI * 6) * 44, sm = Math.sin(t * Math.PI * 60) * 12; pts.push(`${f1(x)} ${f1(130 - big - sm)}`); }
    el('path', { d: `M380 300L${pts.join('L')}L700 300Z`, fill: '#f0c0ae' }, root);
    el('path', { d: 'M' + pts.join('L'), fill: 'none', stroke: '#c9604f', 'stroke-width': 5 }, root);
    ST.label(180, 244, '주름이 없다면', 'm'); ST.label(540, 244, '주름과 융털이 있으면', '');
  }
  return { saliva, journey, villus, fold, symbols };
})();
