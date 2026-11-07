/* ===== 스마트팜 설계 그림 SD: 정면 온실에 장치를 넣으면 그림이 바뀐다. 모두 새로 그림 ===== */
window.SD = (() => {
  'use strict';
  const { el, grad, tween, loop, lerp, clamp, stage, shadow, f1, REDUCE } = PS;
  function farm(host) {
    PF.symbols();
    const ST = stage(host, [0, 0, 1000, 720]); const root = el('g', null, ST.svg);
    el('rect', { x: -300, y: -300, width: 1600, height: 1400, fill: grad([[0, '#bfe0f5'], [.72, '#f1f8fb']]) }, root);
    el('path', { d: 'M-300 610Q200 560 520 590T1300 580V1000H-300Z', fill: grad([[0, '#a8cf7a'], [1, '#6ea24c']]) }, root);
    const XL = 80, XR = 920, YR = 250, YB = 640, YT = 90;
    el('path', { d: `M${XL} ${YB}V${YR}L500 ${YT}L${XR} ${YR}V${YB}Z`, fill: 'rgba(238,247,251,.86)' }, root);
    el('rect', { x: XL, y: YB - 26, width: XR - XL, height: 46, fill: grad([[0, '#c9c3b5'], [1, '#a59f90']]) }, root);
    /* 호수 */
    const beds = [[150, 410], [590, 850]];
    beds.forEach(([a, b]) => {
      el('rect', { x: a, y: 552, width: b - a, height: 44, rx: 5, fill: grad([[0, '#7b5734'], [1, '#55391f']]), stroke: '#3f2a16' }, root);
      [a + 16, b - 28].forEach((x) => el('rect', { x, y: 596, width: 12, height: 34, fill: '#68747e' }, root));
    });
    const plants = []; const dimL = el('g', null, root);
    [[190, 'g'], [280, 'r'], [370, 'g'], [630, 'r'], [720, 'g'], [810, 'r']].forEach(([x, k]) => { const g = el('g', null, root); shadow(g, x, 552, 44, 6, .25); const b = el('g', null, g); PF.lettuce(b, k, true, ''); plants.push({ x, b, cur: .45 }); });
    const putP = () => plants.forEach((p) => p.b.setAttribute('transform', `translate(${p.x} 552) scale(${f1(p.cur * 100) / 100})`));
    putP();
    /* 틀 */
    const frame = el('g', { fill: 'none', stroke: '#8d9ba7', 'stroke-width': 7, 'stroke-linejoin': 'round' }, root);
    el('path', { d: `M${XL} ${YB}V${YR}L500 ${YT}L${XR} ${YR}V${YB}`, 'stroke-width': 10 }, frame);
    el('path', { d: `M${XL} ${YR}H${XR}` }, frame);
    [290, 500, 710].forEach((x) => el('path', { d: `M${x} ${YB}V${YR}`, 'stroke-width': 4, opacity: .7 }, frame));
    el('path', { d: `M500 ${YT}V${YR}M290 ${YR}L290 ${YT + (YR - YT) * .49}M710 ${YR}L710 ${YT + (YR - YT) * .49}`, 'stroke-width': 3, opacity: .7 }, frame);
    /* 장치 그림 */
    const dev = {}, make = (k, fn) => { const g = el('g', { opacity: 0 }, root); fn(g); dev[k] = g; };
    let beams;
    make('led', (g) => {
      beams = g;
      [[265], [735]].forEach(([x]) => {
        el('path', { d: `M${x - 90} 310H${x + 90}L${x + 150} 556H${x - 150}Z`, fill: grad([[0, '#fff1a0', .55], [1, '#fff1a0', .03]]) }, g);
        el('line', { x1: x - 50, x2: x - 50, y1: 250, y2: 296, stroke: '#7c8892', 'stroke-width': 2 }, g); el('line', { x1: x + 50, x2: x + 50, y1: 250, y2: 296, stroke: '#7c8892', 'stroke-width': 2 }, g);
        el('rect', { x: x - 96, y: 296, width: 192, height: 16, rx: 4, fill: grad([[0, '#59646e'], [1, '#2f3841']]) }, g);
        el('rect', { x: x - 90, y: 310, width: 180, height: 4, rx: 2, fill: '#fff6c2' }, g);
      });
    });
    make('shade', (g) => { el('path', { d: `M${XL + 10} ${YR + 8}H${XR - 10}`, stroke: '#3f6d55', 'stroke-width': 7, 'stroke-dasharray': '26 10' }, g); });
    const fanB = el('g', null);
    make('fan', (g) => {
      el('circle', { cx: 500, cy: 180, r: 52, fill: '#eaf1f6', stroke: '#67737e', 'stroke-width': 4 }, g); g.appendChild(fanB);
      for (let i = 0; i < 4; i++) el('path', { d: 'M0 0C10 -18 18 -36 2 -44C-14 -38 -14 -14 0 0Z', transform: `rotate(${i * 90})`, fill: '#4f88a8', stroke: '#35607a' }, fanB);
      el('circle', { cx: 500, cy: 180, r: 7, fill: '#2f3841' }, g);
    });
    make('co2', (g) => {
      [[495, '#3f6f8f'], [535, '#4a7d9e']].forEach(([x, c]) => { el('rect', { x: x - 16, y: 470, width: 32, height: 150, rx: 8, fill: grad([[0, c], [.45, '#7fa7c1'], [1, '#2c5570']], { x2: 1, y2: 0 }), stroke: '#28485c' }, g); el('rect', { x: x - 8, y: 458, width: 16, height: 14, fill: '#4c5660' }, g); });
      el('path', { d: 'M495 458V440H150M535 458V440H850', fill: 'none', stroke: '#5a6670', 'stroke-width': 4 }, g);
    });
    const co2M = el('g', { opacity: 0 }, root);
    const hP = []; make('heat', (g) => { [[150, 410], [590, 850]].forEach(([a, b]) => { const p = el('rect', { x: a, y: 603, width: b - a, height: 9, rx: 4, fill: '#d65f3c', stroke: '#9f3f22' }, g); hP.push(p); }); });
    make('water', (g) => {
      el('path', { d: 'M150 400H410M590 400H850', stroke: '#5b93b6', 'stroke-width': 5, fill: 'none' }, g);
      for (const x of [190, 280, 370, 630, 720, 810]) { el('path', { d: `M${x} 402v8`, stroke: '#5b93b6', 'stroke-width': 5 }, g); }
    });
    const drops = el('g', { opacity: 0 }, root), DR = [190, 280, 370, 630, 720, 810].map((x, i) => ({ u: el('path', { d: 'M0 -6C4 0 5 3 0 6C-5 3 -4 0 0 -6Z', fill: '#4aa3d4' }, drops), x, t: i * .17 }));
    make('net', (g) => { el('path', { d: `M${XL + 8} ${YB - 30}V${YR + 4}M${XR - 8} ${YB - 30}V${YR + 4}`, stroke: '#67737e', 'stroke-width': 13, 'stroke-dasharray': '3 4', fill: 'none', opacity: .55 }, g); });
    make('cam', (g) => {
      el('path', { d: 'M395 250V272M605 250V272', stroke: '#67737e', 'stroke-width': 3 }, g);
      [395, 605].forEach((x) => { el('rect', { x: x - 26, y: 272, width: 52, height: 28, rx: 6, fill: '#eef1f4', stroke: '#67737e' }, g); el('circle', { cx: x, cy: 286, r: 9, fill: '#2f3841' }, g); el('circle', { cx: x + 2, cy: 284, r: 3, fill: '#8db8e3' }, g); });
    });
    make('sensor', (g) => {
      [235, 765].forEach((x) => { el('line', { x1: x, x2: x, y1: 500, y2: 556, stroke: '#58646e', 'stroke-width': 3 }, g); el('rect', { x: x - 21, y: 474, width: 42, height: 28, rx: 4, fill: grad([[0, '#2aa2d6'], [1, '#157eb0']], { x2: 1, y2: 0 }), stroke: '#0f6a95' }, g); el('rect', { x: x - 15, y: 479, width: 30, height: 12, rx: 2, fill: '#16242e' }, g); el('rect', { x: x - 11, y: 483, width: 18, height: 2.5, fill: '#7fe0a5' }, g); });
    });
    make('robot', (g) => {
      const c = '#e9edf0', s = '#8b98a4';
      el('rect', { x: 462, y: 610, width: 76, height: 14, rx: 4, fill: '#59646e' }, g);
      el('path', { d: 'M500 610V540L450 480L420 500', fill: 'none', stroke: s, 'stroke-width': 26, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      el('path', { d: 'M500 610V540L450 480L420 500', fill: 'none', stroke: c, 'stroke-width': 20, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      [[500, 540], [450, 480]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 13, fill: '#59646e' }, g));
    });
    make('tablet', (g) => {
      el('rect', { x: 924, y: 470, width: 62, height: 90, rx: 6, fill: '#20262c' }, g); el('rect', { x: 930, y: 476, width: 50, height: 74, rx: 2, fill: '#f6fbff' }, g);
      [[936, 490, 30], [936, 506, 22], [936, 522, 36]].forEach(([x, y, w]) => { el('rect', { x, y, width: 38, height: 6, rx: 3, fill: '#dfe7ee' }, g); el('rect', { x, y, width: w, height: 6, rx: 3, fill: '#0e63b3' }, g); });
    });
    const co2S = Array.from({ length: 14 }, () => { const R = Math.random; return { u: el('use', { href: '#mCO2' }, co2M), x: 120 + R() * 760, y: 330 + R() * 150, a: R() * 6.28 }; });
    let fanOn = false;
    const on = {};
    loop((dt, now) => {
      if (on.fan) fanB.setAttribute('transform', `translate(500 180) rotate(${f1(now * 220 % 360)})`); else fanB.setAttribute('transform', 'translate(500 180)');
      if (on.co2) co2S.forEach((m) => { m.a += (Math.random() - .5) * dt * 2; m.x += Math.cos(m.a) * 14 * dt; m.y += Math.sin(m.a) * 12 * dt; if (m.x < 110) m.a = 0; if (m.x > 890) m.a = 3.14; if (m.y < 320) m.a = 1.57; if (m.y > 490) m.a = -1.57; m.u.setAttribute('transform', `translate(${f1(m.x)} ${f1(m.y)}) rotate(${f1(now * 20)}) scale(.6)`); });
      if (on.water) DR.forEach((d) => { d.t = (d.t + dt * .7) % 1; d.u.setAttribute('transform', `translate(${d.x} ${f1(lerp(412, 500, d.t * d.t))})`); d.u.setAttribute('opacity', d.t > .9 ? 0 : 1); });
    });
    return {
      set(k, v) { on[k] = v; if (dev[k]) tween(450, (t) => dev[k].setAttribute('opacity', v ? t : 1 - t)); if (k === 'co2') co2M.setAttribute('opacity', v ? 1 : 0); if (k === 'water') drops.setAttribute('opacity', v ? 1 : 0); },
      grow(v) { const a = plants[0].cur, b = v; tween(1500, (t) => { plants.forEach((p) => { p.cur = lerp(a, b, t); }); putP(); }); },
      ST,
    };
  }
  return { farm };
})();
