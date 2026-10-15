/* ===== 읽기 페이지 그림 ===== */
(() => {
  'use strict';
  const { $, $$ } = window.RD, { el } = OP;
  const ok = [];

  /* 표지: 교과서 그림 Ⅲ-9처럼 세 가지 조명 아래의 사과 + 앞쪽의 평소 사과 */
  try {
    const svg = $('#heroScene svg');
    OP.defs(svg); OC.defs(svg);
    el('rect', { width: 1000, height: 620, fill: '#0b1220' }, svg);
    const PAN = [['red', 70, 210], ['green', 360, 60], ['blue', 650, 210]];
    PAN.forEach(([k, x, y]) => {
      const F = OC.litFilter(svg, 'hl' + k); F.set(OC.LIGHTS[k].rgb.map((v) => Math.max(0.03, v * 0.9)));
      const cid = 'hc' + k; el('clipPath', { id: cid }, svg).appendChild(el('rect', { x, y, width: 280, height: 280, rx: 18 }));
      el('rect', { x: x + 6, y: y + 14, width: 280, height: 280, rx: 18, fill: '#000', opacity: 0.45, filter: 'url(#ocBlur8)' }, svg);
      const g = el('g', { 'clip-path': `url(#${cid})` }, svg), lit = el('g', { filter: `url(#hl${k})` }, g);
      const bg = el('rect', { x, y, width: 280, height: 280, fill: '#f1f1ef' }, lit);
      el('rect', { x, y: y + 200, width: 280, height: 80, fill: '#d9d9d6' }, lit);
      OC.apple(lit, x + 140, y + 160, 0.78);
      el('rect', { x, y, width: 280, height: 280, fill: 'url(#ocVig)', opacity: 0.8 }, g);
      OC.torch(svg, x + 30, y + 26, 45, 0.4).set(k);
      bg.setAttribute('data-k', k);
    });
    el('ellipse', { cx: 508, cy: 598, rx: 150, ry: 18, fill: '#000', opacity: 0.6, filter: 'url(#ocBlur8)' }, svg);
    OC.apple(svg, 500, 470, 1.3, { shadow: false });
    ok.push('hero');
  } catch (e) { console.warn('hero', e); }

  /* 그림 ①: 흰색 빛을 비출 때 빛의 경로 */
  try {
    const host = $('#fig1');
    const lab = OC.lab(host, { shirt: false, aria: '손전등의 흰색 빛이 사과와 잎에 닿아, 사과에서는 빨간색 빛만, 잎에서는 초록색 빛만 반사되어 눈에 들어가는 모습' });
    lab.light('white', true, true);
    ok.push('fig1');
  } catch (e) { console.warn('fig1', e); }

  /* 그림 ②: 조명 색 바꿔 보기 */
  try {
    const host = $('#fig2');
    const lab = OC.lab(host, { aria: '빨간색, 초록색, 파란색 빛을 비출 때 사과, 잎, 셔츠의 색과 빛의 경로' });
    const say = (k) => {
      const t = ['apple', 'leaf', 'shirt'].map((o) => `${OC.OBJS[o].name} <b>${OC.seen(o, k)}</b>`).join(' · ');
      $('#fig2T').innerHTML = `${OC.LIGHTS[k].name} 빛을 비추면: ${t}`;
    };
    $$('#fig2B button').forEach((b) => b.addEventListener('click', () => {
      $$('#fig2B button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      lab.light(b.dataset.l, true); say(b.dataset.l);
    }));
    lab.light('red', true, true); say('red');
    window.RD.ok2 = true;
    ok.push('fig2');
  } catch (e) { console.warn('fig2', e); }

  /* 그림 ③: 빛의 삼원색과 합성 (교과서 그림 Ⅲ-10) */
  try {
    const host = $('#fig3'), svg = host.querySelector('svg');
    el('rect', { width: 1000, height: 560, fill: '#0b0d11', rx: 16 }, svg);
    const d = el('defs', {}, svg);
    d.innerHTML = '<filter id="v3s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5"/></filter>';
    const C = [[432, 222, '#ff0000'], [568, 222, '#00ff00'], [500, 340, '#0000ff']];
    const g = el('g', { style: 'isolation:isolate' }, svg);
    C.forEach(([x, y, c]) => el('circle', { cx: x, cy: y, r: 150, fill: c, style: 'mix-blend-mode:screen', filter: 'url(#v3s)' }, g));
    const ov = OP.overlay(host, 1000, 560);
    [['빨간색', 345, 180], ['초록색', 655, 180], ['파란색', 500, 430], ['노란색', 500, 168, 'mx'], ['청록색', 588, 318, 'mx'], ['자홍색', 412, 318, 'mx'], ['흰색', 500, 262, 'mx']].forEach(([t, x, y, c], i) =>
      ov.put('v' + i, x, y, t, c ? 'ink' : 'soft3'));
    ok.push('fig3');
  } catch (e) { console.warn('fig3', e); }

  /* 그림 ④: 영상 장치에서 다양한 색이 표현되는 원리 (교과서 그림 Ⅲ-11) */
  try {
    const host = $('#fig4'), cv = host.querySelector('canvas');
    const W = 1000, H = 640, dpr = Math.min(2, window.devicePixelRatio || 1);
    const draw = () => {
      const w = host.clientWidth; cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr);
      const c = cv.getContext('2d'); c.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
      c.fillStyle = '#f3f6f9'; c.fillRect(0, 0, W, H);
      const pic = document.createElement('canvas'); pic.width = 720; pic.height = 450; SCR.paint(pic.getContext('2d'), 720, 450, 'photo');
      const X = 140, Y = 120, PWd = 720, PHd = 450;
      c.save(); c.shadowColor = 'rgba(20,38,59,.3)'; c.shadowBlur = 30; c.shadowOffsetY = 12;
      c.beginPath(); c.roundRect ? c.roundRect(X, Y, PWd, PHd, 14) : c.rect(X, Y, PWd, PHd); c.fillStyle = '#000'; c.fill(); c.restore();
      c.save(); c.beginPath(); c.roundRect ? c.roundRect(X, Y, PWd, PHd, 14) : c.rect(X, Y, PWd, PHd); c.clip(); c.drawImage(pic, X, Y); c.restore();
      // 그림에서 각 색에 가장 가까운 곳 찾기
      const PX = SCR.pixels(pic, 144, 90);
      const T = [['흰색', 7, [255, 255, 255], 92, 118], ['파란색', 4, [40, 100, 230], 500, 86], ['빨간색', 1, [220, 50, 30], 908, 150], ['초록색', 2, [50, 140, 50], 92, 470], ['노란색', 3, [245, 210, 60], 908, 486]];
      const L = T.map(([n, m, tc, lx, ly]) => {
        let best = null, bd = 1e9;
        for (let j = 2; j < 88; j++) for (let i = 2; i < 142; i++) {
          const p = PX.at(i, j), d = (p[0] - tc[0]) ** 2 + (p[1] - tc[1]) ** 2 + (p[2] - tc[2]) ** 2 + ((X + i / 144 * PWd - lx) ** 2 + (Y + j / 90 * PHd - ly) ** 2) * 0.05;
          if (d < bd) { bd = d; best = [i, j]; }
        }
        return [n, m, (best[0] + 0.5) / 144, (best[1] + 0.5) / 90, lx, ly];
      });
      L.forEach(([n, m, u, v, lx, ly]) => {
        const px = X + u * PWd, py = Y + v * PHd;
        c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.strokeRect(px - 7, py - 7, 14, 14);
        c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(px, py); c.lineTo(lx, ly); c.stroke();
        SCR.sub(c, lx, ly, 150, 5, () => [m & 1 ? 255 : 0, m & 2 ? 255 : 0, m & 4 ? 255 : 0], 0, 0, { ring: 6 });
      });
    };
    draw();
    const ov = OP.overlay(host, W, H);
    [['흰색', 92, 210], ['파란색', 500, 178], ['빨간색', 908, 242], ['초록색', 92, 562], ['노란색', 908, 578]].forEach(([t, x, y], i) => ov.put('s' + i, x, y, t, 'ink'));
    let tm = 0; window.addEventListener('resize', () => { clearTimeout(tm); tm = setTimeout(draw, 150); });
    ok.push('fig4');
  } catch (e) { console.warn('fig4', e); }

  if (ok.length < 5) window.RD_err && window.RD_err('그림', new Error('그리지 못한 그림이 있어요: ' + ok.join(', ')));
})();
