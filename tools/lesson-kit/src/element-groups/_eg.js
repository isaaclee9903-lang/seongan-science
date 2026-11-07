/* ===== 같은 족 원소 그림 도구 EG: 원소 카드 6장, 물과의 반응 그림, 간단한 주기율표. 모두 새로 그림. 반응 모습은 정성 모형 ===== */
window.EG = (() => {
  'use strict';
  const { el, grad, tween, loop, lerp, clamp, stage, f1, shadow, mk, REDUCE } = PS;
  const E = [
    { k: 'Li', n: '리튬', z: 3, g: 1, p: 2, st: '고체', w: '격렬히 반응', r: '반응 잘함', x: '은백색, 무름' },
    { k: 'Na', n: '나트륨', z: 11, g: 1, p: 3, st: '고체', w: '격렬히 반응', r: '반응 잘함', x: '은백색, 무름' },
    { k: 'K', n: '칼륨', z: 19, g: 1, p: 4, st: '고체', w: '격렬히 반응', r: '반응 잘함', x: '은백색, 무름' },
    { k: 'He', n: '헬륨', z: 2, g: 18, p: 1, st: '기체', w: '반응 안 함', r: '거의 반응 안 함', x: '비행선에 이용' },
    { k: 'Ne', n: '네온', z: 10, g: 18, p: 2, st: '기체', w: '반응 안 함', r: '거의 반응 안 함', x: '간판에 이용' },
    { k: 'Ar', n: '아르곤', z: 18, g: 18, p: 3, st: '기체', w: '반응 안 함', r: '거의 반응 안 함', x: '실온에서 기체' },
  ];
  /* 간단한 주기율표 1~4주기 */
  function table(host) {
    const ST = stage(host, [0, 0, 1000, 480]), root = el('g', null, ST.svg);
    el('rect', { x: -200, width: 1400, height: 480, fill: '#fff' }, root);
    const X0 = 70, Y0 = 60, CW = 49, CH = 88;
    const cells = {};
    const rows = { 1: [1, 18], 2: [1, 2, 13, 14, 15, 16, 17, 18], 3: [1, 2, 13, 14, 15, 16, 17, 18], 4: Array.from({ length: 18 }, (_, i) => i + 1) };
    Object.entries(rows).forEach(([p, gs]) => gs.forEach((g) => { const x = X0 + (g - 1) * CW, y = Y0 + (p - 1) * CH; const r = el('rect', { x, y, width: CW - 3, height: CH - 3, rx: 5, fill: '#f1f5f8', stroke: '#d4dee8' }, root); cells[`${g}-${p}`] = { r, x, y }; }));
    for (let g = 1; g <= 18; g++) { const l = ST.label(X0 + (g - .5) * CW, 40, String(g), 'm'); l.e.style.fontSize = 'clamp(10px,1vw,12.5px)'; }
    for (let p = 1; p <= 4; p++) { const l = ST.label(44, Y0 + (p - .5) * CH, String(p), 'm'); l.e.style.fontSize = 'clamp(10px,1vw,12.5px)'; }
    ST.label(X0 + 9 * CW, 12, '족', 'm').e.style.fontSize = 'clamp(10px,1vw,12.5px)';
    ST.label(18, Y0 + 2 * CH, '주기', 'm').e.style.fontSize = 'clamp(10px,1vw,12.5px)';
    const labs = {};
    E.forEach((e) => { const c = cells[`${e.g}-${e.p}`], l = ST.label(c.x + (CW - 3) / 2, c.y + (CH - 3) / 2, `<b>${e.k}</b>`, ''); l.e.style.fontSize = 'clamp(13px,1.6vw,18px)'; l.show(false); labs[e.k] = { l, c }; });
    return {
      ST,
      mark(k, col) { const L = labs[k]; L.l.show(true); L.c.r.setAttribute('fill', col); L.c.r.setAttribute('stroke', '#0e63b3'); L.c.r.setAttribute('stroke-width', 2); },
      all() { E.forEach((e) => this.mark(e.k, e.g === 1 ? '#fbd9c7' : '#d7e6fa')); },
    };
  }
  /* 물과의 반응 */
  function water(host) {
    PS.defs();
    const ST = stage(host, [0, 0, 1000, 640]), root = el('g', null, ST.svg);
    PS.bench(root, 560);
    const X = [170, 500, 830], items = [];
    [{ k: 'Na', col: '#d8dce2', strong: 1 }, { k: 'K', col: '#c7ccd4', strong: 1.5 }, { k: 'He', col: null, strong: 0 }].forEach((it, i) => {
      const x = X[i];
      shadow(root, x, 560, 130, 12, .22);
      el('path', { d: `M${x - 120} 280L${x - 110} 544Q${x - 108} 560 ${x - 92} 560H${x + 92}Q${x + 108} 560 ${x + 110} 544L${x + 120} 280`, fill: 'rgba(226,238,245,.28)', stroke: '#7f94a5', 'stroke-width': 2.2 }, root);
      el('path', { d: `M${x - 114} 360L${x - 110} 544Q${x - 108} 558 ${x - 92} 558H${x + 92}Q${x + 108} 558 ${x + 110} 544L${x + 114} 360Z`, fill: grad([[0, '#cfe8f4'], [1, '#a9d2e8']]), opacity: .85 }, root);
      const g = el('g', null, root);
      const lump = it.col ? el('path', { d: 'M-22 2C-24 -14 -6 -18 8 -16C24 -14 26 2 18 12C4 18 -18 16 -22 2Z', fill: grad([[0, '#f1f4f7'], [1, it.col]], { r: 1, cx: .38, cy: .32, rr: .8 }), stroke: '#8a95a1', transform: `translate(${x} 200)` }, g) : null;
      const He = !it.col ? Array.from({ length: 10 }, (_, j) => el('circle', { r: 8, fill: '#e9f1ff', stroke: '#9ab3d9', opacity: 0 }, g)) : [];
      const dots = Array.from({ length: 16 }, () => el('circle', { r: 4, fill: '#fff', stroke: '#8fbad6', opacity: 0 }, g));
      const sp = Array.from({ length: 10 }, () => el('circle', { r: 3, fill: '#fff4c2', stroke: '#e0a11c', opacity: 0 }, g));
      const lab = ST.label(x, 600, `${it.k === 'Na' ? '나트륨' : it.k === 'K' ? '칼륨' : '헬륨'} ${it.k}`, '');
      items.push({ ...it, x, lump, He, dots, sp, t: -1 });
    });
    const R = Math.random;
    const api = {
      ST,
      drop(i, cb) { const it = items[i]; if (it.t >= 0) return cb && cb(); it.t = 0; if (!it.lump) { it.He.forEach((u, j) => { u.setAttribute('cx', it.x + (j - 4.5) * 18); u.setAttribute('cy', 300); u.setAttribute('opacity', 1); }); cb && cb(); return; } tween(REDUCE ? 0 : 700, (t) => it.lump.setAttribute('transform', `translate(${it.x} ${lerp(200, 356, t * t)})`), () => { cb && cb(); }, (x) => x); },
      fill() { items.forEach((_, i) => api.drop(i)); },
    };
    loop((dt, now) => {
      items.forEach((it) => {
        if (it.t < 0) return; it.t += dt;
        if (!it.lump) { it.He.forEach((u, j) => { u.setAttribute('cy', f1(300 - (it.t * 26 + j * 8) % 220)); u.setAttribute('opacity', .9); }); return; }
        if (it.t < .7) return;
        const x0 = it.x + Math.sin(now * (4 * it.strong)) * (40 + 16 * it.strong);
        it.lump.setAttribute('transform', `translate(${f1(x0)} ${f1(356 + Math.sin(now * 13) * 3)}) scale(${f1(Math.max(.25, 1 - (it.t - .7) * .05) * 100) / 100})`);
        it.dots.forEach((d, j) => { const u = (now * .9 + j / 16) % 1; d.setAttribute('cx', f1(x0 + Math.sin(j * 4) * 34 * u)); d.setAttribute('cy', f1(372 - u * 44)); d.setAttribute('opacity', f1((1 - u) * .85)); });
        it.sp.forEach((s, j) => { const u = (now * 1.3 * it.strong + j / 10) % 1; s.setAttribute('cx', f1(x0 + Math.cos(j * 2.4) * 60 * u)); s.setAttribute('cy', f1(350 - Math.sin(u * 3.14) * 100 * it.strong)); s.setAttribute('opacity', f1(1 - u)); });
      });
    });
    return api;
  }
  return { E, table, water };
})();
