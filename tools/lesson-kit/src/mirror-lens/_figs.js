/* ===== 읽기 그림: 숟가락, 거울·렌즈의 종류, 그림 Ⅲ-7·8, 관찰 결과 ===== */
(() => {
  'use strict';
  try {
    const { $, $$ } = window.RD, { el } = OP;
    ML.defs();

    /* 얼굴 (숟가락에 비친 모습용, 가운데 0,0 · 지름 100) */
    function face(g) {
      el('rect', { x: -400, y: -400, width: 800, height: 400, fill: '#dfe8f0' }, g);
      el('rect', { x: -400, y: 0, width: 800, height: 400, fill: '#c5d2de' }, g);
      el('path', { d: 'M-46 70C-40 40 -20 30 0 30C20 30 40 40 46 70Z', fill: '#2f5d8a' }, g);           // 옷
      el('ellipse', { cx: 0, cy: -8, rx: 34, ry: 40, fill: '#f3c9a6' }, g);
      el('path', { d: 'M-36 -14C-40 -50 -14 -60 4 -56C26 -54 40 -40 36 -12C30 -30 14 -38 -4 -36C-18 -34 -30 -28 -36 -14Z', fill: '#2a211c' }, g);
      el('circle', { cx: -12, cy: -6, r: 3.6, fill: '#1b1410' }, g); el('circle', { cx: 12, cy: -6, r: 3.6, fill: '#1b1410' }, g);
      el('path', { d: 'M-10 14C-4 20 4 20 10 14', stroke: '#a3523a', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, g);
      el('ellipse', { cx: -20, cy: 6, rx: 6, ry: 3.5, fill: '#f08f7a', opacity: .45 }, g); el('ellipse', { cx: 20, cy: 6, rx: 6, ry: 3.5, fill: '#f08f7a', opacity: .45 }, g);
    }
    /* 숟가락 (x, y: 오목한 부분 가운데) */
    function spoon(g, x, y, front, sc) {
      const id = 'sp' + (front ? 'f' : 'b');
      const s = el('g', { transform: `translate(${x} ${y}) scale(1.55)` }, g);
      el('path', { d: 'M-12 120C-14 200 -10 260 -6 330L6 330C10 260 14 200 12 120Z', fill: 'url(#mlRod)' }, s);
      el('ellipse', { cx: 6, cy: 6, rx: 92, ry: 128, fill: 'rgba(20,30,40,.25)', filter: 'url(#mlSoft)' }, s);
      el('ellipse', { cx: 0, cy: 0, rx: 88, ry: 124, fill: front ? '#8c96a1' : '#b9c2cb' }, s);
      el('clipPath', { id }, s).appendChild(el('ellipse', { cx: 0, cy: 0, rx: 80, ry: 116 }));
      const c = el('g', { 'clip-path': `url(#${id})` }, s);
      el('rect', { x: -90, y: -130, width: 180, height: 260, fill: '#d9e1e8' }, c);
      const f = el('g', { transform: `scale(${sc}) ${front ? 'rotate(180)' : ''}` }, c); face(f);
      el('ellipse', { cx: 0, cy: 0, rx: 80, ry: 116, fill: front ? 'url(#mlVigC)' : 'url(#mlVigX)' }, c);
      el('ellipse', { cx: 0, cy: 0, rx: 80, ry: 116, fill: 'url(#mlSheen)', opacity: .8 }, c);
      el('path', { d: front ? 'M-58 -60C-50 -96 -20 -110 10 -108' : 'M-50 -70C-30 -100 10 -108 40 -94', stroke: '#fff', 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round', opacity: .55 }, s);
      el('ellipse', { cx: 0, cy: 0, rx: 88, ry: 124, fill: 'none', stroke: front ? '#5d6670' : '#7d8792', 'stroke-width': 7 }, s);
    }
    function hero() {
      const host = $('#heroScene'), sv = host.querySelector('svg');
      el('rect', { width: 1000, height: 620, fill: '#eef2f6' }, sv);
      el('rect', { y: 470, width: 1000, height: 150, fill: '#dde4eb' }, sv);
      spoon(sv, 290, 230, true, 0.95);
      spoon(sv, 710, 230, false, 0.8);
      const ov = OP.overlay(host, 1000, 620);
      ov.put('a', 290, 586, '숟가락 앞면 · 오목하게 들어감', 'ink');
      ov.put('b', 710, 586, '숟가락 뒷면 · 볼록하게 나옴', 'ink');
    }

    /* 거울과 렌즈의 종류 */
    function kinds() {
      const host = $('#figK'), sv = host.querySelector('svg');
      el('rect', { width: 1000, height: 360, fill: '#fff' }, sv);
      el('line', { x1: 600, x2: 600, y1: 40, y2: 300, stroke: '#e1e8ef', 'stroke-width': 2 }, sv);
      const ov = OP.overlay(host, 1000, 360);
      [['plane-mirror', 100, '평면거울', '면이 평평함'], ['concave-mirror', 300, '오목 거울', '면이 오목하게 들어감'], ['convex-mirror', 500, '볼록 거울', '면이 볼록하게 나옴'],
        ['convex-lens', 740, '볼록 렌즈', '가운데가 볼록함'], ['concave-lens', 900, '오목 렌즈', '가운데가 오목함']].forEach(([k, x, n, d], i) => {
        ML.icon(sv, k, x, 160, 200, { face: 1 });
        ov.put('n' + i, x, 296, n, 'ink'); ov.put('d' + i, x, 328, d, 'inks');
      });
      ov.put('h1', 300, 26, '거울 · 빛이 반사되는 면이 오른쪽', 'inks'); ov.put('h2', 820, 26, '렌즈 · 빛이 통과함', 'inks');
    }

    /* 관찰 결과 줄 */
    function strip(id, devs) {
      const box = $(id);
      box.innerHTML = '<div class="sh"></div>' + ML.ZONE.map((z) => `<div class="sh">${z}</div>`).join('') +
        devs.map((k) => `<div class="sd"><svg viewBox="-30 -110 60 220"></svg><b>${ML.NAMES[k]}</b></div>` + ML.PRESET.map((d) => `<div class="sc"><svg viewBox="0 0 200 200"></svg><span>${ML.label(k, d)}</span></div>`).join('')).join('');
      $$('.sd svg', box).forEach((s, i) => ML.icon(s, devs[i], 0, 0, 200));
      $$('.sc svg', box).forEach((s, j) => { const k = devs[Math.floor(j / 3)]; ML.inner(s, k, 'block', ML.PRESET[j % 3], 100, 100, 84, { H0: (ML.isMirror(k) ? 1.3 : 2.6) * 84 }); });
    }

    hero(); RD.ok2 = true;
    kinds();
    ML.rays($('#figM1'), { theme: 'light', dev: 'convex-mirror', H: 400, n: 3, gap: 80, aria: '나란한 빛이 볼록 거울에 반사된 뒤 넓게 퍼진다.' });
    ML.rays($('#figM2'), { theme: 'light', dev: 'concave-mirror', H: 400, n: 3, gap: 80, aria: '나란한 빛이 오목 거울에 반사된 뒤 한 점에 모인다.' });
    ML.rays($('#figL1'), { theme: 'light', dev: 'convex-lens', H: 400, n: 3, gap: 80, aria: '나란한 빛이 볼록 렌즈를 지나며 굴절되어 한 점에 모인다.' });
    ML.rays($('#figL2'), { theme: 'light', dev: 'concave-lens', H: 400, n: 3, gap: 80, aria: '나란한 빛이 오목 렌즈를 지나며 굴절되어 퍼진다.' });
    strip('#stripM', ['convex-mirror', 'concave-mirror']);
    strip('#stripL', ['convex-lens', 'concave-lens']);
  } catch (err) { window.RD_err && window.RD_err('그림', err); }
})();
