/* ===== 잎 속 돋보기 LZ: 엽록체에서 포도당 → 녹말 → 설탕, 설탕이 체관 쪽으로 =====
   그림은 이 수업을 위해 새로 그렸어요. 입자 기호는 광합성 수업과 같아요(포도당: 노란 육각형, 설탕: 육각형 두 개).
   알갱이의 수와 크기는 정한 모형이에요. */
window.LZ = (() => {
  'use strict';
  const { el, grad, tween, loop, mk, lerp, f1, REDUCE } = PS;
  const NS = 'http://www.w3.org/2000/svg';
  let symOK = false;
  function symbols() {
    if (symOK) return; symOK = true; PS.defs();
    const d = PS.defs();
    if (!d.querySelector('#mSug')) {
      const s = el('g', { id: 'mSug' }, d);
      [[-9, '#fffaf0'], [9, '#f3ead2']].forEach(([x, c]) => el('path', { d: 'M9 0 4.5 7.8H-4.5L-9 0-4.5-7.8H4.5Z', transform: `translate(${x} 0)`, fill: c, stroke: '#9c8d62', 'stroke-width': 1.1, 'stroke-linejoin': 'round' }, s));
    }
  }
  function lens(host, o = {}) {
    symbols();
    host.innerHTML = '';
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 300 300'); svg.setAttribute('class', 'lzsvg'); host.appendChild(svg);
    const ol = document.createElement('div'); ol.className = 'lzl'; host.appendChild(ol);
    const lab = (x, y, t) => { const e = document.createElement('span'); e.textContent = t; e.style.left = (x / 3) + '%'; e.style.top = (y / 3) + '%'; ol.appendChild(e); return { e, show(v) { e.style.display = v ? '' : 'none'; return this; }, set(t2) { e.textContent = t2; return this; } }; };
    const cid = 'lzc' + Math.random().toString(36).slice(2, 7);
    const defs = el('defs', null, svg); const cp = el('clipPath', { id: cid }, defs); el('circle', { cx: 150, cy: 150, r: 146 }, cp);
    const R = el('g', { 'clip-path': `url(#${cid})` }, svg);
    /* 잎 세포: 이웃 세포 벽, 세포 안쪽 */
    el('rect', { x: 0, y: 0, width: 300, height: 300, fill: '#d9ecc0' }, R);
    el('rect', { x: 14, y: 22, width: 272, height: 216, rx: 26, fill: grad([[0, '#eef7e2'], [1, '#e2f0cf']], { x2: 0, y2: 1 }), stroke: '#a9cf86', 'stroke-width': 6 }, R);
    // 작은 엽록체 몇 개(세포벽 가까이)
    [[40, 48, 20], [258, 60, 160], [36, 200, -20], [262, 208, 200]].forEach(([x, y, a]) => { const g = el('g', { transform: `translate(${x} ${y}) rotate(${a})` }, R); el('ellipse', { rx: 20, ry: 10, fill: '#79b24e', stroke: '#3f7f2f', 'stroke-width': 1 }, g); [-8, 0, 8].forEach((dx) => el('rect', { x: dx - 2.5, y: -4, width: 5, height: 8, rx: 1.5, fill: '#2f6f2c' }, g)); });
    /* 체관 쪽(아래): 잎맥 */
    const vein = el('g', null, R);
    el('rect', { x: -10, y: 246, width: 320, height: 60, fill: grad([[0, '#d8e9b8'], [.25, '#f4ecc4'], [.75, '#efe3b0'], [1, '#cfe2a8']], { x2: 0, y2: 1 }) }, vein);
    for (let x = -10; x < 310; x += 22) el('line', { x1: x, y1: 252, x2: x, y2: 300, stroke: '#cdbf86', 'stroke-width': 1.2 }, vein);
    el('line', { x1: -10, y1: 249, x2: 310, y2: 249, stroke: '#a9c27a', 'stroke-width': 2 }, vein);
    /* 큰 엽록체 */
    const C = el('g', { transform: 'translate(150 128) rotate(-6)' }, R);
    el('ellipse', { rx: 122, ry: 76, fill: '#4f8f36' }, C);
    el('ellipse', { rx: 118, ry: 72, fill: grad([[0, '#c7e69c'], [.6, '#a5d375'], [1, '#7fb655']], { r: 1, cx: .4, cy: .35, rr: .75 }), stroke: '#e3f3c8', 'stroke-width': 1.4 }, C);
    // 그라나(쌓인 원판)와 이어진 막
    const G = [[-78, -12], [-42, 24], [-8, -26], [30, 18], [66, -16], [92, 22], [-70, 34]];
    G.forEach(([x, y], i) => el('path', { d: `M${x} ${y}Q${(x + (G[(i + 1) % G.length][0])) / 2} ${y + 14} ${G[(i + 1) % G.length][0]} ${G[(i + 1) % G.length][1]}`, fill: 'none', stroke: '#5f9f43', 'stroke-width': 1.6, opacity: .7 }, C));
    G.forEach(([x, y]) => { const g = el('g', { transform: `translate(${x} ${y})` }, C); for (let k = 0; k < 5; k++) el('rect', { x: -12, y: -13 + k * 5.4, width: 24, height: 4.6, rx: 2.2, fill: k % 2 ? '#2f7432' : '#3c8a3a', stroke: '#235c27', 'stroke-width': .5 }, g); });
    const night = el('rect', { x: 0, y: 0, width: 300, height: 300, fill: '#0b1838', opacity: 0, 'pointer-events': 'none' }, R);
    /* 햇빛(낮) */
    const rays = el('g', { opacity: 0 }, R);
    [0, 1, 2].forEach((i) => el('line', { x1: 40 + i * 34, y1: -10, x2: 100 + i * 34, y2: 96, stroke: '#ffe27a', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .8 }, rays));
    const mol = el('g', null, R);
    el('circle', { cx: 150, cy: 150, r: 146, fill: 'none', stroke: '#14263b', 'stroke-width': 3 }, svg);
    const L = { chl: lab(150, 214, '엽록체'), vein: lab(232, 280, '체관 쪽'), what: lab(150, 34, '') };
    L.what.e.classList.add('b'); L.what.show(false);
    const use = (n, x, y, s = 1) => el('use', { href: '#' + n, transform: `translate(${f1(x)} ${f1(y)}) scale(${s})` }, mol);
    const at = (u, x, y, s, r = 0) => u.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) rotate(${f1(r)}) scale(${f1(s * 100) / 100})`);
    const GP = [[-96, 6], [-60, -34], [-24, 8], [14, -40], [50, 4], [84, -36], [100, 38], [-28, 46]].map(([x, y]) => [150 + x, 128 + y]);
    let hexes = [], sugs = [], state = 0, flowing = false;
    const T = (ms) => (REDUCE ? 0 : ms);
    function clear() { mol.innerHTML = ''; hexes = []; sugs = []; }
    const CH = (i, n) => [150 + (i - (n - 1) / 2) * 21, 124 + Math.sin(i * 1.3) * 7];
    const api = {
      glucose(cb) {
        clear(); state = 1; rays.setAttribute('opacity', 1); L.what.set('낮: 포도당이 만들어져요').show(true);
        let i = 0; const add = () => { if (i >= GP.length) { cb && cb(); return; } const [x, y] = GP[i++]; const u = use('mGlu', x, y, .01); hexes.push({ u, x, y }); tween(T(320), (t) => at(u, x, y, 1.15 * Math.sin(t * Math.PI * .5 + .0) + .01, 0)); setTimeout(add, T(260)); }; add();
      },
      starch(cb) {
        state = 2; L.what.set('포도당이 이어져 녹말이 돼요');
        const n = hexes.length, from = hexes.map((h) => [h.x, h.y]);
        tween(T(1300), (t) => hexes.forEach((h, i) => { const [x1, y1] = CH(i, n); h.x = lerp(from[i][0], x1, t); h.y = lerp(from[i][1], y1, t); at(h.u, h.x, h.y, 1.15 - .2 * t, t * 30); }), () => { L.what.set('녹말로 바뀌어 저장돼요'); cb && cb(); });
      },
      night(v, dur = 1400) { const a = +night.getAttribute('opacity'); tween(T(dur), (t) => { night.setAttribute('opacity', f1(lerp(a, v * .38, t) * 100) / 100); rays.setAttribute('opacity', f1(Math.max(0, 1 - v) * 100) / 100); }); },
      sugar(cb) {
        state = 3; L.what.set('밤: 녹말이 설탕으로 바뀌어요');
        const n = hexes.length, pairs = Math.floor(n / 2);
        tween(T(700), (t) => hexes.forEach((h) => h.u.setAttribute('opacity', f1(1 - t))), () => {
          clear();
          for (let i = 0; i < pairs; i++) { const [x, y] = CH(i * 2 + .5, n); const u = use('mSug', x, y, .95); sugs.push({ u, x, y, x0: x, y0: y, k: 0, d: i * .18 }); }
          cb && cb();
        });
      },
      out(on) { // 설탕이 엽록체를 나와 체관 쪽으로 가요(계속)
        flowing = on; L.what.set(on ? '물에 잘 녹는 설탕이 체관으로 가요' : L.what.e.textContent);
      },
      jump(s) { // 화면 검사용
        clear(); state = s; L.what.show(s > 0);
        if (s >= 1) rays.setAttribute('opacity', s >= 3 ? 0 : 1);
        if (s === 1) { GP.forEach(([x, y]) => hexes.push({ u: use('mGlu', x, y, 1.15), x, y })); L.what.set('낮: 포도당이 만들어져요'); }
        if (s === 2) { GP.forEach((_, i) => { const [x, y] = CH(i, GP.length); hexes.push({ u: use('mGlu', x, y, .95), x, y }); }); hexes.forEach((h, i) => at(h.u, h.x, h.y, .95, 30)); L.what.set('녹말로 바뀌어 저장돼요'); }
        if (s >= 3) { night.setAttribute('opacity', .38); for (let i = 0; i < 4; i++) { const [x, y] = CH(i * 2 + .5, 8); sugs.push({ u: use('mSug', x, y, .95), x, y, x0: x, y0: y, k: 0, d: i * .18 }); } L.what.set('밤: 녹말이 설탕으로 바뀌어요'); }
      },
      get state() { return state; },
    };
    loop((dt) => {
      if (!flowing) return;
      sugs.forEach((s) => {
        s.d -= dt; if (s.d > 0) return;
        s.k += dt / 2.4;
        if (s.k >= 1) { s.k = 0; s.d = .2 + Math.random() * .3; }
        // 엽록체에서 아래 잎맥으로 내려간 뒤 오른쪽으로 흘러가요
        const k = s.k, dn = Math.min(1, k / .45), rt = Math.max(0, (k - .45) / .55);
        const x = lerp(s.x0, s.x0 + 18, dn) + rt * 260, y = lerp(s.y0, 274, PS.ease(dn));
        at(s.u, x, y, .95, k * 90); s.u.setAttribute('opacity', f1(Math.min(1, (1 - k) * 6, k * 12 + .3)));
      });
    });
    return api;
  }
  return { lens, symbols };
})();
