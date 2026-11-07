/* ===== 광합성산물의 저장과 이용 그림 도구 SG =====
   감자 식물·작물 그림은 이 수업을 위해 새로 그렸다(교과서 사진을 쓰지 않음). 입자 수와 크기는 정한 모형이다. */
window.SG = (() => {
  'use strict';
  const { el, grad, flock, tween, loop, mk, lerp, clamp, stage, shadow, defs, f1, taper, polyAt, REDUCE } = PS;
  let ok = false;
  function symbols() {
    if (ok) return; ok = true; RS.symbols(); PS.defs();
    const d = defs();
    const s = el('g', { id: 'mSug' }, d);
    [[-9, '#f6f2e6'], [9, '#ece6d3']].forEach(([x, c]) => el('path', { d: 'M9 0 4.5 7.8H-4.5L-9 0-4.5-7.8H4.5Z', transform: `translate(${x} 0)`, fill: c, stroke: '#9c8d62', 'stroke-width': 1.1, 'stroke-linejoin': 'round' }, s));
  }

  /* --- 작물 8가지 (가로 220, 세로 160 안쪽, 가운데 0,0) --- */
  const C = {
    cane(g) {
      [[-70, 30, -64, '#c7b66a'], [-30, 40, -54, '#6f4a2b'], [20, 42, -74, '#d1be6f']].forEach(([x, y, a, c]) => {
        const s = el('g', { transform: `translate(${x} ${y}) rotate(${a})` }, g);
        el('rect', { x: 0, y: -13, width: 160, height: 26, rx: 5, fill: grad([[0, c], [.5, '#f0e5a6'], [1, c]]), stroke: '#7c6a38', 'stroke-width': .8 }, s);
        [34, 82, 128].forEach((n) => { el('rect', { x: n, y: -14, width: 6, height: 28, rx: 2, fill: '#8b7a3f' }, s); });
        el('ellipse', { cx: 160, cy: 0, rx: 4.5, ry: 13, fill: '#efe7b7', stroke: '#8b7a3f' }, s);
      });
    },
    potato(g) {
      const pot = (x, y, r, rot) => {
        const q = el('g', { transform: `translate(${x} ${y}) rotate(${rot})` }, g);
        el('path', { d: `M${-r} 0C${-r} ${-r * .8} ${-r * .3} ${-r * .82} ${r * .35} ${-r * .75}C${r * 1.05} ${-r * .68} ${r * 1.15} ${r * .2} ${r * .7} ${r * .55}C${r * .2} ${r * .86} ${-r} ${r * .75} ${-r} 0Z`, fill: grad([[0, '#e5c07f'], [.6, '#c9975a'], [1, '#9b6c3a']], { r: 1, cx: .38, cy: .3, rr: .8 }), stroke: '#7d5429', 'stroke-width': .9 }, q);
        const R = mk(rot + 9); for (let i = 0; i < 7; i++) el('ellipse', { cx: f1((R() - .5) * r * 1.5), cy: f1((R() - .5) * r * 1.1), rx: 2.4, ry: 1.3, fill: '#7d5429', opacity: .6 }, q);
      };
      pot(-50, 28, 42, -12); pot(44, 32, 44, 16); pot(-2, -22, 42, 4);
    },
    beet(g) {
      const lf = el('g', { fill: '#5ba23f', stroke: '#3a7a2d', 'stroke-width': .8 }, g);
      [-52, -32, -12, 8, 28, 48].forEach((a, i) => el('path', { d: 'M0 0C-12 -32 -9 -62 3 -82C13 -60 14 -30 0 0Z', transform: `translate(${-8 + i * 3} -22) rotate(${a})` }, lf));
      el('path', { d: 'M-46 -26C-30 -44 22 -44 42 -22C50 16 16 54 -14 74C-26 42 -56 8 -46 -26Z', fill: grad([[0, '#f6ecd2'], [.6, '#e1cfa5'], [1, '#b89f6f']], { x2: 1, y2: .4 }), stroke: '#957f50', 'stroke-width': .9 }, g);
      [-14, 2, 18].forEach((y) => el('path', { d: `M-34 ${y}Q-4 ${y + 7} 28 ${y - 2}`, fill: 'none', stroke: '#a68f5f', 'stroke-width': .8, opacity: .7 }, g));
    },
    sweet(g) {
      el('path', { d: 'M-96 10C-74 -34 -6 -48 44 -34C78 -24 96 -4 100 14C76 34 18 52 -40 44C-68 40 -88 28 -96 10Z', fill: grad([[0, '#b65a5c'], [.55, '#963f4c'], [1, '#6e2b3a']], { x2: .3, y2: 1 }), stroke: '#5c2230', 'stroke-width': .9 }, g);
      [[-40, 18], [10, -8], [50, 10]].forEach(([x, y]) => el('path', { d: `M${x} ${y}q10 4 20 1`, fill: 'none', stroke: '#5c2230', 'stroke-width': 1 }, g));
      el('ellipse', { cx: 62, cy: 44, rx: 40, ry: 28, fill: grad([[0, '#ffdf86'], [.7, '#f5b64a'], [1, '#d98f2c']], { r: 1, rr: .55 }), stroke: '#a24d3e', 'stroke-width': 3 }, g);
    },
    corn(g) {
      el('path', { d: 'M-104 34C-70 -18 -10 -42 60 -40C20 -10 -40 30 -104 34Z', fill: '#7cb04b', stroke: '#4f8430' }, g);
      const b = el('g', { transform: 'translate(-92 24) rotate(-15)' }, g);
      el('path', { d: 'M0 0C20 -32 120 -42 190 -14C196 -6 196 6 190 14C120 40 20 32 0 0Z', fill: '#e7a826', stroke: '#b67e12' }, b);
      for (let r = 0; r < 6; r++) for (let i = 0; i < 15; i++) { const x = 18 + i * 11.4, y = -24 + r * 9.6 + (i % 2) * 2.5, e = Math.sin(clamp(x / 196) * Math.PI); if (Math.abs(y) > 36 * e) continue; el('ellipse', { cx: f1(x), cy: f1(y), rx: 5.6, ry: 4.4, fill: grad([[0, '#ffe58a'], [1, '#f2b52e']], { r: 1, cx: .4, cy: .35, rr: .75 }), stroke: '#c98c15', 'stroke-width': .5 }, b); }
      el('path', { d: 'M-104 34C-60 44 10 40 70 18C30 44 -60 62 -104 34Z', fill: '#90c25a', stroke: '#4f8430' }, g);
    },
    grape(g) {
      el('path', { d: 'M4 -68C6 -56 4 -46 2 -34M4 -68C22 -80 50 -78 66 -60C74 -44 56 -24 34 -36C20 -44 10 -56 4 -68Z', fill: '#5ea03e', stroke: '#3a7a2d' }, g);
      const P = []; [[6, 0], [5, 1], [4, 2], [3, 3], [2, 4], [1, 5]].forEach(([n, r]) => { for (let i = 0; i < n; i++) P.push([(i - (n - 1) / 2) * 25, -30 + r * 21]); });
      P.forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 13.5, fill: grad([[0, '#e6f2a0'], [.6, '#b3cf5d'], [1, '#86a53a']], { r: 1, cx: .38, cy: .32, rr: .75 }), stroke: '#6c8a2c', 'stroke-width': .7 }, g));
    },
    sesame(g) {
      const sp = (x, y, a, seed, col, st) => {
        const s = el('g', { transform: `translate(${x} ${y}) rotate(${a})` }, g);
        el('rect', { x: 34, y: -7, width: 90, height: 14, rx: 7, fill: grad([[0, '#d9a56b'], [1, '#b3793f']]), stroke: '#8a5a2a' }, s);
        el('ellipse', { cx: 0, cy: 0, rx: 48, ry: 32, fill: grad([[0, '#e2b17a'], [1, '#b67c42']]), stroke: '#8a5a2a' }, s);
        const R = mk(seed); for (let i = 0; i < 90; i++) { const t = R() * 6.28, q = Math.sqrt(R()); el('ellipse', { cx: f1(Math.cos(t) * q * 40), cy: f1(Math.sin(t) * q * 25), rx: 3.2, ry: 1.9, transform: `rotate(${f1(R() * 180)} ${f1(Math.cos(t) * q * 40)} ${f1(Math.sin(t) * q * 25)})`, fill: col, stroke: st, 'stroke-width': .3 }, s); }
      };
      sp(-34, -12, 28, 4, '#2c2926', '#000'); sp(30, 26, -148 + 180 + 150, 7, '#ecdcb9', '#b9a678');
    },
    pea(g) {
      [[-14, -28, -18, .86], [6, 18, -14, 1]].forEach(([x, y, a, s]) => {
        const q = el('g', { transform: `translate(${x} ${y}) rotate(${a}) scale(${s})` }, g);
        el('path', { d: 'M-104 0C-70 -36 70 -36 106 -2C72 34 -70 36 -104 0Z', fill: grad([[0, '#79b84d'], [1, '#4f8f32']]), stroke: '#37702a' }, q);
        el('path', { d: 'M-90 0C-58 -18 58 -18 92 -1C58 15 -58 16 -90 0Z', fill: '#d7ebb3' }, q);
        [-68, -38, -8, 22, 52].forEach((px, i) => el('circle', { cx: px, cy: 0, r: 13 - Math.abs(i - 2), fill: grad([[0, '#c2e27c'], [.6, '#8dc14b'], [1, '#5f9632']], { r: 1, cx: .38, cy: .3, rr: .75 }), stroke: '#4d8029', 'stroke-width': .6 }, q));
      });
    },
  };
  const CROPS = [
    { k: 'cane', n: '사탕수수', organ: '줄기', form: '설탕' }, { k: 'potato', n: '감자', organ: '줄기', form: '녹말' },
    { k: 'beet', n: '사탕무', organ: '뿌리', form: '설탕' }, { k: 'sweet', n: '고구마', organ: '뿌리', form: '녹말' },
    { k: 'corn', n: '옥수수', organ: '열매', form: '녹말' }, { k: 'grape', n: '포도', organ: '열매', form: '포도당' },
    { k: 'sesame', n: '참깨', organ: '씨앗', form: '지방' }, { k: 'pea', n: '완두', organ: '씨앗', form: '단백질' },
  ];
  const crop = (svgP, k, x, y, s) => { const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, svgP); shadow(g, 0, 72, 104, 10, .16); C[k](g); return g; };
  function cropIn(host, k) { const ST = stage(host, [-120, -90, 240, 180]); crop(ST.svg, k, 0, 0, 1); return ST; }
  /* 네 칸 창고(그림 Ⅴ-5 형식): 안 채운 작물은 흐린 자리 */
  function shelf(host, o = {}) {
    const ST = stage(host, [0, 0, 1000, 760]), root = el('g', null, ST.svg);
    el('rect', { width: 1000, height: 760, fill: '#fff' }, root);
    const ROOM = { 줄기: [10, 10], 뿌리: [505, 10], 열매: [10, 385], 씨앗: [505, 385] };
    const items = {};
    Object.entries(ROOM).forEach(([n, [x, y]]) => {
      el('rect', { x, y, width: 485, height: 365, rx: 16, fill: '#f7fafc', stroke: '#dbe4ed' }, root);
      const l = ST.label(x + 24, y + 28, n + '에', 'ra big'); l.e.style.color = '#14263b';
    });
    CROPS.forEach((c, i) => {
      const [x, y] = ROOM[c.organ], side = CROPS.filter((q) => q.organ === c.organ).indexOf(c);
      const cx = x + 125 + side * 236, cy = y + 180;
      const g = crop(root, c.k, cx, cy, .95);
      const nm = ST.label(cx, cy + 112, c.n, ''), fm = ST.label(cx, cy + 142, c.form + '로 저장', 'bg');
      fm.e.style.color = '#0b3f73';
      items[c.k] = { g, nm, fm };
      const on = !!o.all;
      g.setAttribute('opacity', on ? 1 : .08); nm.show(on); fm.show(on);
    });
    return { reveal(k) { const it = items[k]; tween(450, (t) => it.g.setAttribute('opacity', lerp(.08, 1, t))); it.nm.show(true); it.fm.show(true); }, ST };
  }

  /* --- 감자 식물: 양분의 길 --- */
  const PATHS = {
    leaf: [[760, 230], [640, 250], [520, 280], [502, 340], [500, 430]],
    tip: [[500, 430], [502, 330], [500, 220], [503, 120]],
    root: [[500, 430], [498, 500], [488, 590], [498, 690]],
    tuber: [[500, 430], [470, 480], [380, 520], [290, 560], [250, 590]],
    tuber2: [[500, 430], [530, 480], [620, 530], [710, 575], [745, 600]],
  };
  function plant(host, o = {}) {
    symbols();
    const ST = stage(host, [0, 0, 1000, 780]); ST.svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    const root = el('g', null, ST.svg);
    el('rect', { x: -300, y: -300, width: 1600, height: 1300, fill: grad([[0, '#a9d6f3'], [.3, '#def1fb'], [.42, '#f6fbf4']]) }, root);
    const night = el('g', { opacity: 0 }, root);
    el('rect', { x: -300, y: -300, width: 1600, height: 1300, fill: grad([[0, '#0d1a3f'], [.3, '#1e2f63'], [.45, '#3a4a7a']]) }, night);
    const Rs = mk(9); for (let i = 0; i < 60; i++) el('circle', { cx: f1(Rs() * 1200 - 100), cy: f1(Rs() * 400), r: f1(.7 + Rs() * 1.4), fill: '#fff', opacity: f1(.35 + Rs() * .6) }, night);
    const sun = el('g', null, root);
    el('circle', { r: 110, fill: grad([[0, '#fff3b0', .9], [.5, '#fff3b0', .3], [1, '#fff3b0', 0]], { r: 1, rr: .5 }) }, sun);
    el('circle', { r: 42, fill: grad([[0, '#ffe58a'], [.7, '#fbb92e'], [1, '#ef8f14']], { r: 1, cx: .4, cy: .36, rr: .7 }) }, sun);
    const moon = el('path', { d: 'M18 -38A42 42 0 1 0 18 38A34 34 0 1 1 18 -38Z', fill: grad([[0, '#fff5c9'], [1, '#f1d67c']]), stroke: '#d9b95c', 'stroke-width': .8 }, root);
    /* 흙 */
    el('path', { d: 'M-300 448Q250 412 500 408T1300 448V1000H-300Z', fill: grad([[0, '#a26a3c'], [.35, '#7f4f2b'], [1, '#5b3519']]) }, root);
    const Rg = mk(21); for (let i = 0; i < 150; i++) el('ellipse', { cx: f1(Rg() * 1100 - 50), cy: f1(440 + Rg() * 340), rx: f1(1 + Rg() * 3.5), ry: f1(.8 + Rg() * 1.8), fill: Rg() < .5 ? '#c79462' : '#4a2a13', opacity: .5 }, root);
    /* 뿌리·기는줄기 */
    const rt = el('g', { fill: '#e7d3ad', stroke: '#b89a6c', 'stroke-width': .6 }, root);
    [[[498, 420], [488, 520], [502, 620], [494, 720]], [[496, 500], [450, 590], [420, 690]], [[502, 520], [560, 620], [590, 720]], [[492, 570], [440, 610], [380, 625]], [[502, 600], [560, 650], [640, 660]]].forEach((a, i) => el('path', { d: taper(a, i ? 7 : 11, 1.5) }, rt));
    [[[498, 440], [420, 500], [330, 540], [270, 570]], [[502, 440], [580, 505], [680, 555], [725, 590]]].forEach((a) => el('path', { d: taper(a, 9, 6), fill: '#d8c79a', stroke: '#a4906a', 'stroke-width': .7 }, root));
    /* 감자 */
    const tubers = [[240, 600, 62, -8], [755, 620, 60, 10]].map(([x, y, r, a]) => {
      const g = el('g', { transform: `translate(${x} ${y}) rotate(${a})` }, root), inner = el('g', null, g);
      el('path', { d: `M${-r} 0C${-r} ${-r * .8} ${-r * .3} ${-r * .82} ${r * .35} ${-r * .75}C${r * 1.05} ${-r * .68} ${r * 1.15} ${r * .2} ${r * .7} ${r * .55}C${r * .2} ${r * .86} ${-r} ${r * .75} ${-r} 0Z`, fill: grad([[0, '#e5c07f'], [.6, '#c9975a'], [1, '#9b6c3a']], { r: 1, cx: .38, cy: .3, rr: .8 }), stroke: '#7d5429', 'stroke-width': 1 }, inner);
      const R = mk(a + 40), dots = []; for (let i = 0; i < 26; i++) { const t = R() * 6.28, q = Math.sqrt(R()) * .78; dots.push(el('ellipse', { cx: f1(Math.cos(t) * q * r), cy: f1(Math.sin(t) * q * r * .62), rx: 5, ry: 3.4, fill: '#fff6dd', stroke: '#b89a6c', 'stroke-width': .5, opacity: 0 }, inner)); }
      return { inner, dots, s: .62, set(v) { this.s = v; inner.setAttribute('transform', `scale(${f1(v * 100) / 100})`); } };
    });
    tubers.forEach((t) => t.set(.62));
    /* 줄기·잎 */
    const pl = el('g', null, root);
    shadow(pl, 500, 414, 90, 10, .26);
    const SP = [[500, 420], [496, 340], [504, 240], [502, 150]];
    [[500, 340, 195, .78], [500, 275, -18, .74], [502, 210, 205, .66]].forEach(([x, y, a, s]) => RS.compound(pl, x, y, a, s, RS.TOM2));
    el('path', { d: taper(SP, 22, 8), fill: grad([[0, '#3f8a35'], [.5, '#6fb14e'], [1, '#347a2f']], { x2: 1, y2: 0 }), stroke: '#2a6a2b', 'stroke-width': .9 }, pl);
    [[497, 320, 192, .8], [500, 250, 188, .7], [503, 190, -35, .62]].forEach(([x, y, a, s]) => RS.compound(pl, x, y, a, s, RS.TOM));
    RS.compound(pl, 500, 295, -10, .92, RS.TOM);
    /* 새순(생장) */
    const tip = el('g', { transform: 'translate(503 150) scale(.01)' }, pl); RS.compound(tip, 0, 0, -70, .48, RS.TOM);
    /* 체관 */
    const veinD = (a) => a.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join('');
    const tube = el('g', { fill: 'none', stroke: '#fff7d0', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0, style: 'transition:opacity .5s' }, root);
    Object.values(PATHS).forEach((a) => el('path', { d: veinD(a) }, tube));
    const tube2 = el('g', { fill: 'none', stroke: '#c8851a', 'stroke-width': 1.4, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round', opacity: 0, style: 'transition:opacity .5s' }, root);
    Object.values(PATHS).forEach((a) => el('path', { d: veinD(a) }, tube2));
    const dim = el('path', { d: 'M-300 -300H1300V448Q750 404 500 408T-300 448Z', fill: '#0a1636', opacity: 0, 'pointer-events': 'none' }, root);
    /* 돋보기(엽록체) */
    const LX = 815, LY = 152, LR = 122;
    const lens = el('g', { opacity: 0, style: 'transition:opacity .4s' }, root);
    el('line', { x1: 738, y1: 232, x2: 772, y2: 268, stroke: '#14263b', 'stroke-width': 1.2 }, lens);
    el('circle', { cx: 760, cy: 240, r: 7, fill: 'none', stroke: '#14263b', 'stroke-width': 1.4 }, lens);
    el('line', { x1: 765, y1: 235, x2: 734, y2: 228, stroke: '#14263b', 'stroke-width': 1.2, opacity: 0 }, lens);
    el('circle', { cx: LX, cy: LY, r: LR, fill: '#fff', stroke: '#14263b', 'stroke-width': 2.4 }, lens);
    el('ellipse', { cx: LX, cy: LY, rx: 96, ry: 68, fill: grad([[0, '#a9dd78'], [.7, '#72bb4d'], [1, '#4f9a39']], { r: 1, cx: .42, cy: .36, rr: .72 }), stroke: '#2f7a2f', 'stroke-width': 1.5 }, lens);
    const lInner = el('g', null, lens);
    const lLab = ST.label(LX, LY + LR + 16, '엽록체', 'bg').show(false);
    /* 입자 */
    const mol = el('g', null, root), fl = flock(mol), sp = el('g', null, root), R = Math.random, sparks = [];
    const spark = (x, y, s = 1) => { const u = el('use', { href: '#mEn' }, sp); sparks.push({ u, x, y, t: 0, s }); };
    const lT = {
      leaf: ST.label(290, 200, '잎', 'bg'), tube: ST.label(444, 372, '체관', 'bg').show(false),
      gr: ST.label(585, 110, '생장', 'bg').show(false), re: ST.label(585, 700, '호흡', 'bg').show(false), st: ST.label(240, 690, '저장', 'bg').show(false),
    };
    let tt = 1, sunX = 135, phase = 0;
    const place = () => { sun.setAttribute('transform', `translate(${f1(lerp(-40, sunX, tt))} ${f1(lerp(450, 90, Math.sqrt(tt)))})`); sun.setAttribute('opacity', tt); moon.setAttribute('transform', `translate(${f1(lerp(135, 60, tt))} ${f1(lerp(90, 300, tt))})`); moon.setAttribute('opacity', 1 - tt); night.setAttribute('opacity', 1 - tt); dim.setAttribute('opacity', (1 - tt) * .34); };
    place();
    const hexAt = (x, y, s, n = 'mGlu') => el('use', { href: '#' + n, transform: `translate(${f1(x)} ${f1(y)}) scale(${s})` }, lInner);
    const GL = [[-58, -24], [-20, -36], [22, -22], [58, -30], [-40, 18], [4, 22], [46, 18]];
    let hexes = [];
    const api = {
      lens(v) { lens.setAttribute('opacity', v ? 1 : 0); lLab.show(v); },
      glucose(cb) { api.lens(true); let i = 0; const add = () => { if (i >= GL.length) { cb && cb(); return; } const [x, y] = GL[i++]; const h = hexAt(LX + x, LY + y, 1.25); hexes.push(h); setTimeout(add, REDUCE ? 0 : 210); }; add(); },
      starch(cb) { const pos = hexes.map((_, i) => [LX - 78 + i * 25.5, LY + Math.sin(i * 1.1) * 12]); const st = hexes.map((h) => { const m = h.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\)/); return [+m[1], +m[2]]; }); tween(1100, (t) => hexes.forEach((h, i) => h.setAttribute('transform', `translate(${f1(lerp(st[i][0], pos[i][0], t))} ${f1(lerp(st[i][1], pos[i][1], t))}) scale(1.1)`)), () => { const ln = el('path', { d: 'M' + pos.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L'), fill: 'none', stroke: '#a66d0a', 'stroke-width': 2.2 }, lInner); lInner.insertBefore(ln, lInner.firstChild); cb && cb(); }); },
      night(cb) { tween(REDUCE ? 0 : 1500, (t) => { tt = 1 - t; place(); }, cb); },
      sugar(cb) { hexes.forEach((h) => h.remove()); hexes = []; lInner.innerHTML = ''; GL.forEach(([x, y], i) => { const s = el('use', { href: '#mSug', transform: `translate(${LX + x} ${LY + y}) scale(1.05)` }, lInner); hexes.push(s); }); setTimeout(() => cb && cb(), REDUCE ? 0 : 700); },
      transport(cb) {
        tube.setAttribute('opacity', .95); tube2.setAttribute('opacity', 1); lT.tube.show(true); api.lens(false);
        let n = 0, end = 0;
        const go = () => { if (n++ > 14) return; ['tip', 'root', 'tuber', 'tuber2'].forEach((k) => { const P = PATHS.leaf.concat(PATHS[k].slice(1)); fl.add('mSug', P, { dur: 2.6, s: 1, spin: 20, fi: .06, fo: .03 }); }); setTimeout(go, REDUCE ? 0 : 340); };
        go(); setTimeout(() => cb && cb(), REDUCE ? 0 : 3200);
      },
      respire(cb) { lT.re.show(true); let n = 0; const f = () => { if (n++ > 7) { cb && cb(); return; } const a = PATHS.root[PATHS.root.length - 1 - (n % 3)]; spark(a[0] + (R() - .5) * 90, a[1] + (R() - .5) * 40, 1.1); setTimeout(f, REDUCE ? 0 : 220); }; f(); },
      grow(cb) { lT.gr.show(true); tween(1400, (t) => tip.setAttribute('transform', `translate(503 150) scale(${f1(Math.max(.01, t) * 100) / 100})`), cb); },
      store(cb) { lT.st.show(true); tween(1500, (t) => tubers.forEach((T) => { T.set(lerp(.62, 1, t)); T.dots.forEach((d, i) => { if (i / T.dots.length < t) d.setAttribute('opacity', .95); }); }), cb); },
      jump(p) {
        if (p >= 1) { api.lens(false); tt = 0; place(); tube.setAttribute('opacity', .95); tube2.setAttribute('opacity', 1); lT.tube.show(true); }
        if (p >= 2) { tip.setAttribute('transform', 'translate(503 150) scale(1)'); tubers.forEach((T) => { T.set(1); T.dots.forEach((d) => d.setAttribute('opacity', .95)); }); lT.gr.show(true); lT.re.show(true); lT.st.show(true); }
      },
      day(cb) { tween(REDUCE ? 0 : 1200, (t) => { tt = t; place(); }, cb); },
      ST,
    };
    if (o.labels === false) Object.values(lT).forEach((l) => l.e.remove());
    loop((dt) => {
      fl.step(dt);
      for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.t += dt / .85; if (s.t >= 1) { s.u.remove(); sparks.splice(i, 1); continue; } const k = Math.sin(s.t * Math.PI); s.u.setAttribute('transform', `translate(${f1(s.x)} ${f1(s.y)}) scale(${f1((.6 + k * .8) * s.s)})`); s.u.setAttribute('opacity', f1(k)); }
    });
    return api;
  }
  return { CROPS, crop, cropIn, shelf, plant, symbols };
})();
