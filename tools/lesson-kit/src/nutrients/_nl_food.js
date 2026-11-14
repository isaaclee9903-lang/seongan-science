/* ===== 영양소 수업 그림 도구 NL (1) 음식 그림 — 모두 새로 그림 (2026-11-13 전면 수정) =====
   빛은 왼쪽 위에서, 매트한 질감, 얇은 선. 음식은 실제 색을 살린다. */
window.NL = (() => {
  'use strict';
  const { el, grad, mk, f1 } = PS;
  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  /* 여러 색 사이를 t(0~1)로 */
  const ramp = (stops, t) => { for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const [a, ca] = stops[i - 1], [b, cb] = stops[i]; return mix(ca, cb, (t - a) / (b - a || 1)); } return stops[stops.length - 1][1]; };
  const soft = (g, cx, cy, rx, ry, op = .22) => el('ellipse', { cx, cy, rx, ry, fill: grad([[0, '#1d2b3a', op], [.65, '#1d2b3a', op * .35], [1, '#1d2b3a', 0]], { r: 1, rr: .5 }) }, g);

  const D = {};
  /* 밥: 낟알이 보이는 봉긋한 밥 */
  D.rice = (g) => {
    soft(g, 0, 26, 64, 10, .2);
    el('path', { d: 'M-62 24C-60 -12-32-34 0-36C32-34 60-12 62 24C40 32-40 32-62 24Z', fill: grad([[0, '#fffefa'], [.55, '#f6f1e3'], [1, '#ddd3bb']], { x1: .2, y1: 0, x2: .7, y2: 1 }), stroke: '#cfc5ab', 'stroke-width': 1 }, g);
    const R = mk(11);
    for (let i = 0; i < 190; i++) {
      const x = (R() - .5) * 112, top = -36 + Math.pow(Math.abs(x) / 62, 2) * 58, y = top + 4 + R() * (26 - top);
      if (y > 26) continue;
      const sh = (y + 36) / 62;
      el('ellipse', { cx: f1(x), cy: f1(y), rx: 3, ry: 1.45, transform: `rotate(${f1(R() * 180)} ${f1(x)} ${f1(y)})`, fill: mix('#fffffb', '#e7dfc8', sh * .7), stroke: mix('#e4dcc6', '#c7bb9c', sh), 'stroke-width': .55 }, g);
    }
  };
  /* 빵: 식빵 두 장 */
  D.bread = (g) => {
    soft(g, 4, 30, 58, 9, .2);
    const slice = 'M-38 28V-8C-47-20-43-40-23-40C-13-50 13-50 23-40C43-40 47-20 38-8V28Z';
    [[14, -8, .9], [-4, 4, 1]].forEach(([dx, dy, s], j) => {
      const s2 = el('g', { transform: `translate(${dx} ${dy}) scale(${s})` }, g);
      el('path', { d: slice, transform: 'translate(3 6)', fill: '#9a5b27' }, s2);
      el('path', { d: slice, fill: grad([[0, '#fbf1dc'], [1, j ? '#ead6af' : '#e1c99d']], { x1: .2, y1: 0, x2: .8, y2: 1 }), stroke: '#b4702f', 'stroke-width': 5, 'stroke-linejoin': 'round' }, s2);
      el('path', { d: slice, fill: 'none', stroke: '#d79a55', 'stroke-width': 1.6, transform: 'translate(0 0) scale(.93)' }, s2);
      const R = mk(30 + j);
      for (let i = 0; i < 26; i++) el('ellipse', { cx: f1((R() - .5) * 60), cy: f1(-28 + R() * 50), rx: f1(1 + R() * 2), ry: f1(.7 + R() * 1.2), fill: '#d8bf8f', opacity: .7 }, s2);
    });
  };
  /* 달걀말이: 돌돌 만 층이 보이는 네 조각 */
  D.egg = (g) => {
    soft(g, 0, 28, 66, 9, .22);
    for (let i = 0; i < 4; i++) {
      const x = -45 + i * 30, s = el('g', { transform: `translate(${x} ${i % 2 ? 2 : 0})` }, g);
      el('path', { d: 'M-15-26Q-15-32-9-32H9Q15-32 15-26V22Q15 28 9 28H-9Q-15 28-15 22Z', transform: 'translate(5 -4)', fill: '#d79a2f' }, s);
      el('path', { d: 'M-15-26Q-15-32-9-32H9Q15-32 15-26V22Q15 28 9 28H-9Q-15 28-15 22Z', fill: grad([[0, '#fde89a'], [1, '#f2c247']], { x1: 0, y1: 0, x2: .4, y2: 1 }), stroke: '#c98d22', 'stroke-width': 1 }, s);
      [[11, 25], [7, 17], [3.5, 9]].forEach(([w, h], k) => el('rect', { x: -w, y: -h - 2, width: w * 2, height: h * 2 + 4, rx: Math.min(w, 6), fill: 'none', stroke: k % 2 ? '#fbe7a3' : '#e3ab33', 'stroke-width': 1.3, opacity: .9 }, s));
      const R = mk(50 + i);
      for (let k = 0; k < 3; k++) el('rect', { x: f1((R() - .5) * 20), y: f1((R() - .5) * 44), width: 3.6, height: 2.4, rx: .8, fill: '#4f8f34' }, s);
    }
  };
  /* 불고기 */
  D.meat = (g) => {
    soft(g, 0, 26, 64, 10, .22);
    el('path', { d: 'M-58 22C-52-8-24-26 2-26C30-24 54-6 58 22C30 30-30 30-58 22Z', fill: '#5b2c13' }, g);
    const R = mk(7), cs = ['#6e3518', '#7f4220', '#5a2a11', '#8a4a26'];
    for (let i = 0; i < 16; i++) {
      const x = (R() - .5) * 64, y = -12 + R() * 30, a = (R() - .5) * 1.2, L = 12 + R() * 10;
      const d = `M${f1(x - Math.cos(a) * L)} ${f1(y - Math.sin(a) * L)}Q${f1(x + (R() - .5) * 14)} ${f1(y - 8)} ${f1(x + Math.cos(a) * L)} ${f1(y + Math.sin(a) * L)}`;
      el('path', { d, stroke: cs[i % 4], 'stroke-width': f1(8 + R() * 4), 'stroke-linecap': 'round', fill: 'none' }, g);
      el('path', { d, stroke: '#a8673a', 'stroke-width': 1.4, 'stroke-linecap': 'round', fill: 'none', opacity: .55, transform: 'translate(-1 -3)' }, g);
    }
    for (let i = 0; i < 5; i++) { const x = (R() - .5) * 80, y = -6 + R() * 22; el('path', { d: `M${f1(x - 10)} ${f1(y)}q10 -7 20 0`, stroke: '#efe1bd', 'stroke-width': 3.2, fill: 'none', opacity: .85, 'stroke-linecap': 'round' }, g); }
    for (let i = 0; i < 14; i++) { const x = (R() - .5) * 80, y = -12 + R() * 30; el('ellipse', { cx: f1(x), cy: f1(y), rx: 1.6, ry: .9, transform: `rotate(${f1(R() * 180)} ${f1(x)} ${f1(y)})`, fill: '#f6ecd2' }, g); }
    for (let i = 0; i < 4; i++) el('circle', { cx: f1((R() - .5) * 70), cy: f1(-10 + R() * 26), r: 2.6, fill: 'none', stroke: '#5e9b3c', 'stroke-width': 1.8 }, g);
  };
  /* 생선구이 */
  D.fish = (g) => {
    soft(g, 0, 26, 66, 9, .22);
    const body = 'M-60 2C-44-24 16-26 44-6L62-20Q58 0 62 20L44 8C16 26-44 26-60 2Z';
    el('path', { d: body, transform: 'translate(2 4)', fill: '#3e4a52' }, g);
    el('path', { d: body, fill: grad([[0, '#4c6378'], [.45, '#8ea0ad'], [.62, '#e6e1d4'], [1, '#d7cdb8']]), stroke: '#3b4b58', 'stroke-width': 1 }, g);
    el('path', { d: body, fill: '#c98b43', opacity: .28 }, g);
    const cid = PS.nid('fc'); const cp = el('clipPath', { id: cid }, PS.defs()); el('path', { d: body }, cp);
    const gm = el('g', { 'clip-path': `url(#${cid})` }, g);
    for (let i = 0; i < 6; i++) el('path', { d: `M${-40 + i * 16} -24l-14 48`, stroke: '#3a2412', 'stroke-width': 3.2, opacity: .5, 'stroke-linecap': 'round' }, gm);
    el('path', { d: 'M-38-14Q-30 2-38 16', stroke: '#2f3d48', 'stroke-width': 1.2, fill: 'none', opacity: .6 }, g);
    el('circle', { cx: -48, cy: -3, r: 4.2, fill: '#f3efe6', stroke: '#2f3d48', 'stroke-width': 1 }, g);
    el('circle', { cx: -48, cy: -3, r: 2, fill: '#1c242b' }, g);
    el('path', { d: 'M-4 -18q10-10 22-4', stroke: '#3b4b58', 'stroke-width': 1.2, fill: '#6f8394' }, g);
  };
  /* 김: 접시에 쌓은 김 */
  D.gim = (g) => {
    soft(g, 0, 28, 62, 9, .2);
    el('ellipse', { cx: 0, cy: 18, rx: 58, ry: 16, fill: grad([[0, '#f6f1ea'], [1, '#d9d0c4']]), stroke: '#c3b8aa', 'stroke-width': 1 }, g);
    el('ellipse', { cx: 0, cy: 16, rx: 44, ry: 11, fill: '#e9e2d8' }, g);
    const R = mk(21);
    for (let i = 0; i < 5; i++) {
      const s = el('g', { transform: `translate(${f1((R() - .5) * 6)} ${12 - i * 7}) rotate(${f1((R() - .5) * 6)})` }, g);
      el('path', { d: 'M-40-10L36-14L42 8L-36 12Z', fill: i === 4 ? '#24332a' : '#1b261f', stroke: '#0f1611', 'stroke-width': .8 }, s);
      if (i === 4) for (let k = 0; k < 40; k++) el('ellipse', { cx: f1((R() - .5) * 74), cy: f1((R() - .5) * 18), rx: f1(1 + R() * 3), ry: f1(.5 + R()), fill: R() < .5 ? '#3e5a3a' : '#2e4430', opacity: .8 }, s);
    }
  };
  /* 브로콜리 */
  D.veg = (g) => {
    soft(g, 0, 28, 60, 9, .22);
    const R = mk(5);
    [[-30, -2, .9], [26, -4, .95], [-2, -16, 1.05]].forEach(([x, y, s]) => {
      const f = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, g);
      el('path', { d: 'M-6 6L-8 34Q0 38 8 34L6 6Z', fill: grad([[0, '#b8d488'], [1, '#7ea64f']], { x1: 0, x2: 1, y2: 0 }), stroke: '#6b8f43', 'stroke-width': .8 }, f);
      for (let i = 0; i < 22; i++) {
        const a = R() * Math.PI * 2, rr = Math.sqrt(R()) * 18, cx = Math.cos(a) * rr, cy = Math.sin(a) * rr * .75 - 4, r = 6 + R() * 3.5;
        const lit = clampN((-cx - cy) / 30 + .5);
        el('circle', { cx: f1(cx), cy: f1(cy), r: f1(r), fill: mix('#2f6a24', '#6ea845', lit), stroke: '#24531b', 'stroke-width': .5 }, f);
      }
      for (let i = 0; i < 26; i++) el('circle', { cx: f1((R() - .5) * 38), cy: f1((R() - .5) * 26 - 6), r: 1.1, fill: '#9ccc6b', opacity: .8 }, f);
    });
  };
  const clampN = (v) => Math.max(0, Math.min(1, v));
  /* 사과 하나와 한 조각 */
  D.fruit = (g) => {
    soft(g, 0, 30, 60, 9, .22);
    const a = el('g', { transform: 'translate(-14 -2)' }, g);
    el('path', { d: 'M0-26C-14-38-42-34-42-6C-42 18-22 34-6 30C-2 29 2 29 6 30C22 34 42 18 42-6C42-34 14-38 0-26Z', fill: grad([[0, '#f06a4a'], [.55, '#d4322a'], [1, '#981d1f']], { r: 1, cx: .35, cy: .35, rr: .75 }), stroke: '#7f1a1b', 'stroke-width': 1 }, a);
    el('path', { d: 'M-30-4C-28-18-18-24-8-24', stroke: '#f6b25a', 'stroke-width': 5, fill: 'none', opacity: .35, 'stroke-linecap': 'round' }, a);
    el('path', { d: 'M0-26Q2-38 6-44', stroke: '#5b3a1e', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, a);
    el('path', { d: 'M5-38Q18-48 26-38Q14-32 5-38Z', fill: '#5f9a3a', stroke: '#3e6e25', 'stroke-width': .8 }, a);
    const s = el('g', { transform: 'translate(40 14) rotate(-12)' }, g);
    el('path', { d: 'M-24 6Q0-20 24 6Q0 16-24 6Z', fill: grad([[0, '#fbf5dc'], [1, '#eadcab']]), stroke: '#d8c79a', 'stroke-width': .8 }, s);
    el('path', { d: 'M-24 6Q0-20 24 6', fill: 'none', stroke: '#b8262a', 'stroke-width': 3.4, 'stroke-linecap': 'round' }, s);
    el('ellipse', { cx: 0, cy: 2, rx: 2.4, ry: 3.6, fill: '#5b3a1e' }, s);
  };
  /* 우유 팩 */
  D.milk = (g) => {
    soft(g, 6, 34, 40, 8, .22);
    el('path', { d: 'M8-18L26-26V30L8 36Z', fill: grad([[0, '#dfe5ea'], [1, '#c3ccd4']]) }, g);
    el('rect', { x: -28, y: -18, width: 36, height: 54, fill: grad([[0, '#ffffff'], [1, '#eef1f3']], { x2: 1, y2: 0 }), stroke: '#b9c3cc', 'stroke-width': 1 }, g);
    el('path', { d: 'M-28-18L-10-36L8-18Z', fill: '#f4f6f8', stroke: '#b9c3cc', 'stroke-width': 1 }, g);
    el('path', { d: 'M-10-36L8-44L26-26L8-18Z', fill: '#d6dde3', stroke: '#b9c3cc', 'stroke-width': 1 }, g);
    el('path', { d: 'M-12-38L6-46', stroke: '#c5ced6', 'stroke-width': 3 }, g);
    el('rect', { x: -28, y: 4, width: 36, height: 14, fill: '#2f6db3' }, g);
    el('path', { d: 'M8 4L26-2V12L8 18Z', fill: '#24589a' }, g);
    el('path', { d: 'M-22 -6q8 -8 16 0', stroke: '#2f6db3', 'stroke-width': 2, fill: 'none' }, g);
  };
  /* --- 그림 Ⅵ-1에 쓰는 재료 그림 --- */
  D.grain = (g) => {
    soft(g, 0, 30, 62, 9, .2);
    el('path', { d: 'M-50 2Q-50 34-12 36H12Q50 34 50 2Z', fill: grad([[0, '#f1ece2'], [1, '#bdb2a1']], { x1: 0, x2: 1, y2: 0 }), stroke: '#a69a86', 'stroke-width': 1 }, g);
    el('ellipse', { cx: 0, cy: 2, rx: 50, ry: 9, fill: '#e2d9c8' }, g);
    const R = mk(3);
    el('path', { d: 'M-44 2C-38-14 38-14 44 2C30 8-30 8-44 2Z', fill: '#f7f2e3' }, g);
    for (let i = 0; i < 60; i++) { const x = (R() - .5) * 76, y = -6 + R() * 9; el('ellipse', { cx: f1(x), cy: f1(y), rx: 2.6, ry: 1.3, transform: `rotate(${f1(R() * 180)} ${f1(x)} ${f1(y)})`, fill: '#fffdf4', stroke: '#d9cfb6', 'stroke-width': .5 }, g); }
    const w = el('g', { transform: 'translate(34 -6) rotate(24)' }, g);
    el('path', { d: 'M0 6V-50', stroke: '#c9a24c', 'stroke-width': 2.2 }, w);
    for (let i = 0; i < 6; i++) [-1, 1].forEach((sd) => el('ellipse', { cx: sd * 4, cy: -14 - i * 7, rx: 3.2, ry: 5.5, transform: `rotate(${sd * 22} ${sd * 4} ${-14 - i * 7})`, fill: '#e2b85a', stroke: '#b08b36', 'stroke-width': .6 }, w));
  };
  D.eggs = (g) => {
    soft(g, 0, 30, 60, 9, .22);
    [[-28, 6, 1], [26, 8, .96], [0, -4, 1.05]].forEach(([x, y, s]) => {
      const e = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, g);
      el('path', { d: 'M0-26C14-26 22-6 22 8C22 22 12 28 0 28C-12 28-22 22-22 8C-22-6-14-26 0-26Z', fill: grad([[0, '#f6d2a8'], [.6, '#e3a868'], [1, '#b8783e']], { r: 1, cx: .35, cy: .3, rr: .8 }), stroke: '#a96b35', 'stroke-width': .8 }, e);
    });
  };
  D.avo = (g) => {
    soft(g, 0, 30, 62, 9, .22);
    const o = el('g', { transform: 'translate(36 -2)' }, g);
    el('path', { d: 'M-9-36H9V-30H-9Z', fill: '#c9a46a' }, o);
    el('path', { d: 'M-10-30H10V-22Q20-14 20 0V26Q20 32 14 32H-14Q-20 32-20 26V0Q-20-14-10-22Z', fill: 'rgba(240,246,250,.5)', stroke: '#9fb0bd', 'stroke-width': 1 }, o);
    el('path', { d: 'M-18-2H18V26Q18 30 14 30H-14Q-18 30-18 26Z', fill: grad([[0, '#f6e27a'], [1, '#e2bb36']]), opacity: .95 }, o);
    const a = el('g', { transform: 'translate(-20 4) rotate(-14)' }, g);
    el('path', { d: 'M0-36C16-36 26-14 26 4C26 22 14 32 0 32C-14 32-26 22-26 4C-26-14-16-36 0-36Z', fill: '#34501f', stroke: '#22350f', 'stroke-width': 1 }, a);
    el('path', { d: 'M0-31C12-31 21-12 21 4C21 18 12 27 0 27C-12 27-21 18-21 4C-21-12-12-31 0-31Z', fill: grad([[0, '#eef0a8'], [.7, '#c4d266'], [1, '#8fae3f']], { r: 1, cx: .5, cy: .6, rr: .6 }) }, a);
    el('circle', { cx: 0, cy: 8, r: 11, fill: grad([[0, '#a8683a'], [1, '#5f3418']], { r: 1, cx: .35, cy: .3, rr: .8 }) }, a);
  };
  D.lemon = (g) => {
    soft(g, 0, 30, 60, 9, .2);
    const l = el('g', { transform: 'translate(-14 -2) rotate(-10)' }, g);
    el('path', { d: 'M-40 0C-40-20-20-30 0-30C20-30 40-20 40 0C40 20 20 30 0 30C-20 30-40 20-40 0Z M40 0l7-3l0 6Z', fill: grad([[0, '#fff08a'], [.6, '#f5cf2c'], [1, '#d7a40f']], { r: 1, cx: .35, cy: .3, rr: .8 }), stroke: '#b98b10', 'stroke-width': 1 }, l);
    const R = mk(9); for (let i = 0; i < 30; i++) el('circle', { cx: f1((R() - .5) * 64), cy: f1((R() - .5) * 40), r: .9, fill: '#e2b51c', opacity: .7 }, l);
    const s = el('g', { transform: 'translate(36 14)' }, g);
    el('circle', { r: 22, fill: '#f5d02f', stroke: '#c79c12', 'stroke-width': 1 }, s);
    el('circle', { r: 19, fill: '#fbf3c6' }, s);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; el('path', { d: `M${f1(Math.cos(a + .07) * 3)} ${f1(Math.sin(a + .07) * 3)}L${f1(Math.cos(a + .3) * 17)} ${f1(Math.sin(a + .3) * 17)}A17 17 0 0 1 ${f1(Math.cos(a + .72) * 17)} ${f1(Math.sin(a + .72) * 17)}Z`, fill: '#f8de62' }, s); }
  };
  D.water = (g) => {
    soft(g, 0, 34, 40, 8, .2);
    el('path', { d: 'M-26-38L-20 32Q-20 36-16 36H16Q20 36 20 32L26-38Z', fill: 'rgba(232,242,248,.7)', stroke: '#9fb3c2', 'stroke-width': 1.2 }, g);
    el('path', { d: 'M-24-14L-20 32Q-20 34-16 34H16Q20 34 20 32L24-14Z', fill: grad([[0, '#cfe6f3'], [1, '#9cc8e2']]), opacity: .85 }, g);
    el('ellipse', { cx: 0, cy: -14, rx: 24, ry: 3.4, fill: '#e2f1f9', stroke: '#9cc8e2', 'stroke-width': .8 }, g);
    el('ellipse', { cx: 0, cy: -38, rx: 26, ry: 3.6, fill: 'none', stroke: '#9fb3c2', 'stroke-width': 1.2 }, g);
  };

  const food = (p, k, x, y, s) => { const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, p); D[k](g); return g; };
  const thumb = (host, k, vb = [-70, -54, 140, 100]) => { host.innerHTML = ''; const svg = el('svg', { viewBox: vb.join(' '), 'aria-hidden': 'true', style: 'width:100%;height:100%;display:block' }, host); food(svg, k, 0, 0, 1); return svg; };

  return { mix, ramp, soft, D, food, thumb };
})();
