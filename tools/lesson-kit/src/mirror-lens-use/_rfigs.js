/* ===== 읽기 페이지 그림 (SVG 2D + 캔버스) =====
   hero: 마을 그림 / figLoupe: 거울·렌즈로 본 모습 4장 / figJW: 제임스 웹 거울 / figEUV: 렌즈와 거울 비교
   figPhone: 휴대 전화 망원 카메라 / figMyo: 근시가 심해지는 것을 늦추는 안경렌즈
   그림 속 글씨는 HTML 이름표(.ol)로 붙여요. */
(() => {
  'use strict';
  try {
    const NS = 'http://www.w3.org/2000/svg';
    const el = (tag, at = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (parent) parent.appendChild(e); return e; };
    const $ = (s) => document.querySelector(s);
    function tags(host, W, H, list) {
      const o = document.createElement('div'); o.className = 'olay'; host.appendChild(o);
      list.forEach(([x, y, t, c]) => { const s = document.createElement('span'); s.className = 'ol ' + (c || 'ink'); s.style.left = (x / W * 100) + '%'; s.style.top = (y / H * 100) + '%'; s.innerHTML = t; o.appendChild(s); });
    }
    function svgIn(host, W, H, aria) { const s = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': aria }, host); return s; }
    const defs = (s, html) => { const d = el('defs', {}, s); d.innerHTML = html; };

    /* 첫 화면: 마을 */
    const hero = $('#heroScene svg'); if (hero) TOWN.draw(hero);

    /* 그림 ②: 거울·렌즈로 본 모습 */
    document.querySelectorAll('canvas[data-lp]').forEach((cv) => {
      const k = cv.dataset.lp;
      const O = {
        road: { scene: 'road', mode: 'convex-mirror', frame: 'orange' },
        teeth: { scene: 'teeth', mode: 'concave-near', frame: 'dental', center: [.63, .42] },
        plus: { scene: 'page', frame: 'glasses', base: .55, lenses: [{ x: .3, y: .5, r: .2, mode: 'convex-lens' }, { x: .72, y: .5, r: .2, mode: 'convex-lens' }] },
        minus: { scene: 'page', frame: 'glasses', base: .55, lenses: [{ x: .3, y: .5, r: .2, mode: 'concave-lens' }, { x: .72, y: .5, r: .2, mode: 'concave-lens' }] },
        store: { scene: 'store', mode: 'convex-mirror', frame: 'orange' },
        face: { scene: 'face', mode: 'flat', frame: 'metal' },
      }[k];
      const go = () => LP.render(cv, O);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
    });

    /* 그림 ③: 제임스 웹 우주 망원경의 거울 */
    const jw = $('#figJW');
    if (jw) {
      const W = 1000, H = 520, s = svgIn(jw, W, H, '육각형 금빛 거울 18개가 모인 제임스 웹 우주 망원경의 큰 오목 거울과, 앞에 매달린 작은 볼록 거울. 오른쪽은 별빛이 오목 거울에서 반사되어 볼록 거울로, 다시 관측 장비로 가는 길');
      defs(s, `<linearGradient id="jwSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#08111f"/><stop offset="1" stop-color="#13233a"/></linearGradient>
        <linearGradient id="jwGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".45" stop-color="#e9b949"/><stop offset="1" stop-color="#a8761c"/></linearGradient>
        <linearGradient id="jwGold2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset=".5" stop-color="#d9a43a"/><stop offset="1" stop-color="#a8761c"/></linearGradient>
        <radialGradient id="jwSec" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff4c8"/><stop offset=".6" stop-color="#d9a63a"/><stop offset="1" stop-color="#8a5f14"/></radialGradient>
        <radialGradient id="jwDot" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe6"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient>`);
      el('rect', { width: W, height: H, rx: 18, fill: 'url(#jwSky)' }, s);
      for (let i = 0; i < 70; i++) el('circle', { cx: (i * 131) % W, cy: (i * 71) % H, r: .9 + (i % 3) * .4, fill: '#fff', opacity: .2 + (i % 5) * .1 }, s);
      const CX = 270, CY = 250, S = 46, SQ = Math.sqrt(3);
      const AX = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1], [2, 0], [2, -1], [2, -2], [1, -2], [0, -2], [-1, -1], [-2, 0], [-2, 1], [-2, 2], [-1, 2], [0, 2], [1, 1]];
      const hx = (x, y, r) => { let d = ''; for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i; d += (i ? 'L' : 'M') + (x + r * Math.cos(a)).toFixed(1) + ' ' + (y + r * Math.sin(a)).toFixed(1); } return d + 'Z'; };
      for (let k = 4; k >= 0; k--) el('path', { d: `M${CX - 230 + k * 14} ${CY + 200 - k * 5}L${CX} ${CY + 262 - k * 8}L${CX + 230 - k * 14} ${CY + 200 - k * 5}L${CX} ${CY + 168 + k * 3}Z`, fill: k % 2 ? '#d9cfe6' : '#b9a9cf', opacity: .55 }, s);
      AX.forEach(([q, r]) => { const x = CX + S * 1.5 * q, y = CY + S * SQ * (r + q / 2); el('path', { d: hx(x, y, S + 3), fill: '#1b222b' }, s); });
      AX.forEach(([q, r], i) => { const x = CX + S * 1.5 * q, y = CY + S * SQ * (r + q / 2); el('path', { d: hx(x, y, S - 2), fill: 'url(#jwGold)', stroke: '#6b4a12', 'stroke-width': 1.2 }, s); el('ellipse', { cx: x - S * .3, cy: y - S * .35, rx: S * .35, ry: S * .11, fill: '#fff', opacity: .2, transform: `rotate(-28 ${x - S * .3} ${y - S * .35})` }, s); });
      [[-150, 165], [150, 165], [0, -180]].forEach(([dx, dy]) => el('line', { x1: CX + dx, y1: CY + dy, x2: CX, y2: CY - 4, stroke: '#8a929c', 'stroke-width': 4 }, s));
      el('circle', { cx: CX, cy: CY - 4, r: 22, fill: 'url(#jwSec)' }, s);
      // 옆에서 본 빛길
      const by = 270, xv = 950, p = 210, A = 150, xs = 700, fx = xv - p;
      el('rect', { x: 560, y: 90, width: 420, height: 360, rx: 16, fill: '#fff', opacity: .04 }, s);
      for (let k = -3; k <= 3; k++) {
        if (!k) continue;
        const y = by + k * A / 3.3, x = xv - (y - by) * (y - by) / (4 * p), ty = by + (y - by) * (xs - fx) / (x - fx);
        const d = `M575 ${y}L${x.toFixed(1)} ${y}L${xs} ${ty.toFixed(1)}L${xv + 30} ${by}`;
        el('path', { d, stroke: '#ffe9a0', 'stroke-opacity': .3, 'stroke-width': 3, fill: 'none' }, s);
        el('path', { d, stroke: '#fff6d0', 'stroke-width': 2, fill: 'none', 'stroke-dasharray': '6 31', class: 'flowdash' }, s);
      }
      const arc = (y0, y1) => { let q = ''; for (let y = y0; y <= y1; y += 3) { const x = xv - (y - by) * (y - by) / (4 * p); q += (q ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); } return q; };
      const d = arc(by - A - 8, by - 12) + arc(by + 12, by + A + 8);
      el('path', { d, stroke: 'url(#jwGold2)', 'stroke-width': 10, fill: 'none' }, s);
      el('path', { d: `M${xs + 6} ${by - 26}Q${xs - 8} ${by} ${xs + 6} ${by + 26}`, stroke: '#e9b949', 'stroke-width': 6, fill: 'none' }, s);
      el('rect', { x: xv + 26, y: by - 22, width: 26, height: 44, rx: 4, fill: '#3a4350' }, s);
      tags(jw, W, H, [[CX, 34, '큰 거울 · 육각형 18개가 모인 <b>오목 거울</b>', 'key'], [CX + 118, CY - 52, '작은 <b>볼록 거울</b>', 'ink'], [CX, CY + 236, '햇빛 가리개', 'soft'],
        [770, 64, '옆에서 본 빛길', 'soft'], [600, 150, '별빛', 'soft'], [xs - 6, 470, '볼록 거울', 'ink'], [xv - 20, 470, '오목 거울', 'ink']]);
    }

    /* 그림 ④: 렌즈일까, 거울일까 (극자외선) */
    const eu = $('#figEUV');
    if (eu) {
      const W = 1000, H = 420, s = svgIn(eu, W, H, '위: 극자외선이 렌즈를 지나면 렌즈 속에서 거의 다 흡수되어 원판에 닿지 못한다. 아래: 굽은 거울에서 반사시키면 원판까지 간다');
      defs(s, `<linearGradient id="euBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a222d"/><stop offset="1" stop-color="#232e3c"/></linearGradient>
        <linearGradient id="euM" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5f6b78"/><stop offset=".5" stop-color="#d4dde6"/><stop offset="1" stop-color="#5f6b78"/></linearGradient>
        <radialGradient id="euSrc" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#c9b6ff"/><stop offset="1" stop-color="#9a7cff" stop-opacity="0"/></radialGradient>
        <linearGradient id="euFade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cdbaff" stop-opacity=".9"/><stop offset=".55" stop-color="#cdbaff" stop-opacity=".25"/><stop offset="1" stop-color="#cdbaff" stop-opacity="0"/></linearGradient>`);
      el('rect', { width: W, height: H, rx: 18, fill: 'url(#euBg)' }, s);
      el('line', { x1: 30, y1: 190, x2: 970, y2: 190, stroke: 'rgba(255,255,255,.12)', 'stroke-width': 2, 'stroke-dasharray': '8 8' }, s);
      // 위: 렌즈
      el('circle', { cx: 90, cy: 100, r: 36, fill: 'url(#euSrc)' }, s);
      for (let k = -2; k <= 2; k++) el('path', { d: `M110 ${100 + k * 10}L330 ${100 + k * 10}`, stroke: '#cdbaff', 'stroke-width': 3, opacity: .8 }, s);
      for (let k = -2; k <= 2; k++) el('path', { d: `M330 ${100 + k * 10}L400 ${100 + k * 9}`, stroke: 'url(#euFade)', 'stroke-width': 3 }, s);
      [350, 520, 690].forEach((x, i) => { el('ellipse', { cx: x, cy: 100, rx: 18, ry: 66 - i * 6, fill: 'rgba(170,215,240,.35)', stroke: '#7fb3d6', 'stroke-width': 2 }, s); });
      el('ellipse', { cx: 350, cy: 100, rx: 40, ry: 70, fill: '#ff7a5a', opacity: .18 }, s);
      el('rect', { x: 900, y: 40, width: 14, height: 120, fill: '#8e9aa8' }, s);
      el('path', { d: 'M860 82l30 36M890 82l-30 36', stroke: '#ff8a76', 'stroke-width': 6, 'stroke-linecap': 'round' }, s);
      // 아래: 거울
      el('circle', { cx: 90, cy: 300, r: 36, fill: 'url(#euSrc)' }, s);
      const M = [[260, 225], [420, 375], [580, 225], [740, 375]];
      const path = [[110, 300], ...M, [900, 300]];
      for (let k = -1; k <= 1; k++) { const d = path.map((q, i) => (i ? 'L' : 'M') + (q[0] + k * 8) + ' ' + q[1]).join(''); el('path', { d, stroke: '#cdbaff', 'stroke-width': 3, fill: 'none', opacity: .55 - Math.abs(k) * .1 }, s); el('path', { d, stroke: '#fff', 'stroke-width': 2, fill: 'none', 'stroke-dasharray': '5 30', class: 'flowdash', opacity: .8 }, s); }
      M.forEach(([x, y], i) => { const up = i % 2 === 0; el('path', { d: `M${x - 46} ${y + (up ? -12 : 12)}Q${x} ${y + (up ? 6 : -6)} ${x + 46} ${y + (up ? -12 : 12)}L${x + 46} ${y + (up ? -26 : 26)}L${x - 46} ${y + (up ? -26 : 26)}Z`, fill: 'url(#euM)' }, s); });
      el('rect', { x: 900, y: 240, width: 14, height: 120, fill: '#c7d0da' }, s);
      tags(eu, W, H, [[90, 160, '극자외선', 'soft'], [520, 28, '<b>렌즈</b>: 빛이 렌즈 속에서 흡수됨', 'ink'], [907, 26, '원판', 'soft'], [430, 200, '<b>굽은 거울</b>: 표면에서 반사', 'key'], [907, 226, '원판', 'soft']]);
    }

    /* 그림 ⑤: 휴대 전화 망원 카메라 (잠망경 방식) */
    const ph = $('#figPhone');
    if (ph) {
      const W = 1000, H = 380, s = svgIn(ph, W, H, '휴대 전화를 옆에서 자른 모습. 위에서 들어온 빛이 프리즘의 비스듬한 면에서 반사되어 옆으로 꺾이고, 여러 장의 렌즈를 지나 이미지 센서에 닿는다');
      defs(s, `<linearGradient id="phB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9edf1"/><stop offset=".12" stop-color="#cfd6dd"/><stop offset="1" stop-color="#9aa4ae"/></linearGradient>
        <linearGradient id="phIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a313a"/><stop offset="1" stop-color="#171b21"/></linearGradient>
        <linearGradient id="phPr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3f3fb" stop-opacity=".95"/><stop offset="1" stop-color="#8fc3e0" stop-opacity=".8"/></linearGradient>
        <linearGradient id="phL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfe8f6" stop-opacity=".85"/><stop offset=".5" stop-color="#9ccbe6" stop-opacity=".7"/><stop offset="1" stop-color="#cfe8f6" stop-opacity=".85"/></linearGradient>`);
      el('rect', { width: W, height: H, rx: 18, fill: '#f3f6f9' }, s);
      el('ellipse', { cx: 520, cy: 330, rx: 440, ry: 16, fill: '#14263b', opacity: .1 }, s);
      el('rect', { x: 70, y: 150, width: 880, height: 150, rx: 40, fill: 'url(#phB)' }, s);
      el('rect', { x: 90, y: 168, width: 840, height: 114, rx: 26, fill: 'url(#phIn)' }, s);
      el('rect', { x: 150, y: 140, width: 110, height: 16, rx: 6, fill: '#1d2228' }, s);   // 카메라 창
      const rays = [175, 205, 235];
      rays.forEach((x) => { const d = `M${x} 40L${x} ${180 + (x - 175)}L760 ${180 + (x - 175)}`; el('path', { d, stroke: '#ffd25a', 'stroke-opacity': .35, 'stroke-width': 5, fill: 'none' }, s); el('path', { d, stroke: '#fff6c8', 'stroke-width': 2.4, fill: 'none', 'stroke-dasharray': '6 28', class: 'flowdash' }, s); });
      el('path', { d: 'M150 172L270 172L270 282Z', fill: 'url(#phPr)', stroke: '#6fa9cc', 'stroke-width': 2 }, s);
      el('path', { d: 'M150 172L270 282', stroke: '#ffffff', 'stroke-width': 5, opacity: .9 }, s);
      [360, 450, 540, 630].forEach((x, i) => el('path', { d: i % 2 ? `M${x - 16} 186Q${x} 226 ${x - 16} 266L${x + 16} 266Q${x} 226 ${x + 16} 186Z` : `M${x} 184Q${x + 22} 226 ${x} 268Q${x - 22} 226 ${x} 184Z`, fill: 'url(#phL)', stroke: '#6fa9cc', 'stroke-width': 1.5 }, s));
      el('rect', { x: 770, y: 186, width: 18, height: 80, fill: '#384656' }, s); el('rect', { x: 788, y: 196, width: 12, height: 60, fill: '#56b07a', opacity: .8 }, s);
      tags(ph, W, H, [[205, 22, '들어오는 빛', 'soft'], [300, 120, '프리즘: 비스듬한 면이 <b>평면거울</b>처럼 반사', 'key'], [495, 312, '여러 장의 렌즈(볼록 렌즈와 오목 렌즈)', 'ink'], [800, 120, '이미지 센서', 'ink']]);
    }

    /* 그림 ⑥: 근시가 심해지는 것을 늦추는 안경렌즈 */
    const my = $('#figMyo');
    if (my) {
      const W = 1000, H = 400, s = svgIn(my, W, H, '안경렌즈를 앞에서 본 모습: 가운데는 맑고, 둘레에는 작은 볼록 렌즈 점이 고리 모양으로 촘촘히 박혀 있다. 오른쪽은 옆에서 본 모습으로 가장자리가 두꺼운 오목 렌즈 앞면에 작은 볼록한 점들이 있다');
      defs(s, `<radialGradient id="myG" cx=".45" cy=".4" r=".6"><stop offset="0" stop-color="#f4fbff"/><stop offset="1" stop-color="#cfe6f4"/></radialGradient>
        <radialGradient id="myD" cx=".4" cy=".35" r=".6"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#8fc3e0"/></radialGradient>
        <linearGradient id="mySide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfe8f6"/><stop offset="1" stop-color="#9ccbe6"/></linearGradient>`);
      el('rect', { width: W, height: H, rx: 18, fill: '#f3f6f9' }, s);
      const cx = 300, cy = 200, R = 160;
      el('ellipse', { cx: cx + 10, cy: cy + 168, rx: 150, ry: 12, fill: '#14263b', opacity: .08 }, s);
      el('circle', { cx, cy, r: R, fill: 'url(#myG)', stroke: '#7aa9c6', 'stroke-width': 3 }, s);
      for (let ring = 0; ring < 6; ring++) { const rr = 62 + ring * 16, n = Math.round(2 * Math.PI * rr / 15); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + ring * .2; el('circle', { cx: cx + rr * Math.cos(a), cy: cy + rr * Math.sin(a), r: 4.6, fill: 'url(#myD)', stroke: '#7aa9c6', 'stroke-width': .6 }, s); } }
      el('circle', { cx, cy, r: 50, fill: 'none', stroke: '#0e63b3', 'stroke-width': 2, 'stroke-dasharray': '5 5' }, s);
      el('path', { d: `M${cx - 120} ${cy - 90}A150 150 0 0 1 ${cx + 30} ${cy - 150}`, stroke: '#fff', 'stroke-width': 8, fill: 'none', opacity: .7, 'stroke-linecap': 'round' }, s);
      // 옆 모습
      const sx = 760;
      el('path', { d: `M${sx - 44} 50Q${sx - 14} 200 ${sx - 44} 350L${sx + 44} 350Q${sx + 14} 200 ${sx + 44} 50Z`, fill: 'url(#mySide)', stroke: '#6fa9cc', 'stroke-width': 2 }, s);
      for (let k = 0; k < 8; k++) { const y1 = 70 + k * 16, y2 = 330 - k * 16; [y1, y2].forEach((y) => { const t = (y - 200) / 150, x = sx - 44 + 30 * (1 - t * t); el('circle', { cx: x - 1, cy: y, r: 4.5, fill: 'url(#myD)', stroke: '#6fa9cc', 'stroke-width': .6 }, s); }); }
      tags(my, W, H, [[cx, 22, '앞에서 본 모습', 'soft'], [cx, cy, '가운데: 근시안경과 같은 <b>오목 렌즈</b>', 'key'], [cx, 384, '둘레: 아주 작은 <b>볼록 렌즈</b> 점 수백 개', 'ink'], [sx, 22, '옆에서 본 모습', 'soft'], [sx + 150, 200, '가장자리가 두꺼운<br>오목 렌즈', 'ink']]);
    }
    window.RD.ok2 = true;
  } catch (err) { window.RD_err && window.RD_err('그림', err); }
})();
