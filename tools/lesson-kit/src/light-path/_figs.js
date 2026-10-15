/* ===== 블록 2: 읽기 그림 (첫 화면, 반사, 굴절, 해 보기, 광원, 오개념) ===== */
(() => {
  'use strict';
  try {
    const { $ } = window.RD, { el, D } = OP, RED = '#e0402f', AMB = OPA.LIGHT;
    function mk(id, W, H, sel = 'svg') {
      const host = typeof id === 'string' ? $(id) : id, svg = host.querySelector(sel);
      OP.defs(svg); OPA.defs(svg);
      return { host, svg, ov: OP.overlay(host, W, H), W, H };
    }
    const dash = (g, x1, y1, x2, y2, c = '#7d8a99') => el('line', { x1, y1, x2, y2, stroke: c, 'stroke-width': 1.8, 'stroke-dasharray': '6 6' }, g);
    const wedge = (g, cx, cy, r, a0, a1) => el('path', { d: OP.arc(cx, cy, r, a0, a1) + `L${cx} ${cy}Z`, fill: 'rgba(14,99,179,.1)', stroke: '#0e63b3', 'stroke-width': 2 }, g);

    /* ---- 첫 화면: 각도기 위 거울과 레이저 (각도가 천천히 바뀜) ---- */
    (function hero() {
      const { svg, ov } = mk('#heroScene', 600, 400);
      svg.insertAdjacentHTML('afterbegin', '');
      el('rect', { width: 600, height: 400, fill: '#11161d' }, svg);
      el('rect', { x: 18, y: 14, width: 564, height: 372, rx: 4, fill: '#222932' }, svg);
      el('rect', { x: 18, y: 14, width: 564, height: 372, rx: 4, fill: '#fff', filter: 'url(#opNoise)' }, svg);
      const C = [300, 92], R = 236;
      OP.protractor(svg, C, R, 'half');
      el('line', { x1: C[0], y1: C[1], x2: C[0], y2: C[1] + R + 30, stroke: 'rgba(240,246,252,.6)', 'stroke-width': 1.4, 'stroke-dasharray': '6 6' }, svg);
      el('rect', { x: 40, y: C[1] - 16, width: 520, height: 8, fill: '#262c33' }, svg);
      el('rect', { x: 40, y: C[1] - 8, width: 520, height: 8, fill: '#7fa8a2' }, svg);
      el('line', { x1: 40, y1: C[1], x2: 560, y2: C[1], stroke: 'rgba(225,250,245,.95)', 'stroke-width': 1.4 }, svg);
      const hit = el('circle', { cx: C[0], cy: C[1], r: 34, fill: 'rgba(255,80,60,.25)', filter: 'url(#opGlow)' }, svg);
      const beam = OP.beam(svg, { halo: 16, mid: 6 });
      const aI = el('path', { fill: 'rgba(120,180,255,.18)', stroke: '#8cc1ff', 'stroke-width': 2 }, svg);
      const aO = el('path', { fill: 'rgba(120,180,255,.18)', stroke: '#8cc1ff', 'stroke-width': 2 }, svg);
      const las = OP.laser(svg); las.g.setAttribute('transform', ''); las.power(true);
      const lg = el('g', {}, svg); lg.appendChild(las.g);
      beam.show(true);
      function draw(a) {
        const t = a * D, u = [-Math.sin(t), Math.cos(t)], v = [Math.sin(t), Math.cos(t)];
        const F = [C[0] + u[0] * 250, C[1] + u[1] * 250], E = [C[0] + v[0] * 330, C[1] + v[1] * 330];
        OP.place(lg, F[0], F[1], Math.atan2(-u[1], -u[0]) / D); lg.setAttribute('transform', lg.getAttribute('transform') + ' scale(.8)');
        beam.set([F, C, E]);
        aI.setAttribute('d', OP.arc(C[0], C[1], 50, Math.PI / 2, Math.PI / 2 + t) + `L${C[0]} ${C[1]}Z`);
        aO.setAttribute('d', OP.arc(C[0], C[1], 50, Math.PI / 2 - t, Math.PI / 2) + `L${C[0]} ${C[1]}Z`);
        const ar = Math.round(a);
        ov.put('i', C[0] - Math.max(58, Math.sin(t / 2) * 120) , C[1] + Math.cos(t / 2) * 100, `입사각 ${ar}°`, 'key');
        ov.put('o', C[0] + Math.max(58, Math.sin(t / 2) * 120), C[1] + Math.cos(t / 2) * 100, `반사각 ${ar}°`, 'key');
      }
      let T = 0; draw(45);
      if (!RD.reduce) FLOW.onFrame((dt) => { T += dt; draw(44 + 16 * Math.sin(T * 0.45)); });
      hit.style.opacity = 1;
    })();

    /* ---- 그림 ①: 빛의 반사 ---- */
    (function figA() {
      const { svg, ov } = mk('#figA', 800, 400);
      const bg = el('linearGradient', { id: 'faBg', x1: 0, y1: 0, x2: 0, y2: 1 }, svg.querySelector('defs')); bg.innerHTML = '<stop offset="0" stop-color="#fffbef"/><stop offset="1" stop-color="#fff6dc"/>';
      el('rect', { width: 800, height: 400, rx: 10, fill: 'url(#faBg)' }, svg);
      const gl = el('linearGradient', { id: 'faGlass', x1: 0, y1: 0, x2: 1, y2: 1 }, svg.querySelector('defs')); gl.innerHTML = '<stop offset="0" stop-color="#e3edf2"/><stop offset=".5" stop-color="#c7d6de"/><stop offset="1" stop-color="#a9bcc7"/>';
      el('path', { d: 'M70 340L690 340L740 300L120 300Z', fill: 'url(#faGlass)', stroke: '#9fb2bd', 'stroke-width': 1 }, svg);
      el('path', { d: 'M70 340L690 340L690 360L70 360Z', fill: '#8fa3b0' }, svg);
      el('path', { d: 'M690 340L740 300L740 320L690 360Z', fill: '#7a8e9b' }, svg);
      el('path', { d: 'M150 312L300 312M480 330L640 330', stroke: 'rgba(255,255,255,.7)', 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
      const C = [405, 320];
      dash(svg, C[0], C[1], C[0], 56);
      const dyn = el('g', {}, svg);
      ov.put('n', C[0], 40, '반사면과 수직인 선', 'inks');
      ov.put('m', 150, 378, '반사면(거울)', 'inks');
      function draw(a) {
        dyn.innerHTML = '';
        const t = a * D, L = 270;
        const S = [C[0] + Math.sin(t) * L, C[1] - Math.cos(t) * L], E = [C[0] - Math.sin(t) * L, C[1] - Math.cos(t) * L];
        el('circle', { cx: C[0], cy: C[1], r: 16, fill: 'rgba(224,64,47,.25)', filter: 'url(#opGlow2)' }, dyn);
        wedge(dyn, C[0], C[1], 62, -Math.PI / 2, -Math.PI / 2 + t);
        wedge(dyn, C[0], C[1], 62, -Math.PI / 2 - t, -Math.PI / 2);
        OPA.ray(dyn, S, C, { color: RED, w: 3.4, at: 0.55, glow: true });
        OPA.ray(dyn, C, E, { color: RED, w: 3.4, at: 0.5, glow: true });
        const g2 = Math.min(t + 0.38, 1.35), rr = 92;
        ov.put('ai', C[0] + Math.sin(g2) * rr, C[1] - Math.cos(g2) * rr, `입사각 ${a}°`, 'inkk ra');
        ov.put('ao', C[0] - Math.sin(g2) * rr, C[1] - Math.cos(g2) * rr, `반사각 ${a}°`, 'inkk la');
        ov.put('ri', S[0] + 10 * Math.cos(t) + 46, S[1] + 18, '입사 광선', 'ink');
        ov.put('ro', E[0] - 10 * Math.cos(t) - 46, E[1] + 18, '반사 광선', 'ink');
        $('#figAo').textContent = `입사각 ${a}° · 반사각 ${a}°`;
      }
      draw(40);
      $('#figAr').addEventListener('input', (e) => draw(+e.target.value));
      addEventListener('resize', () => draw(+$('#figAr').value));
    })();

    /* ---- 그림 ②: 빛의 굴절 (수조) ---- */
    (function figB() {
      const { svg, ov } = mk('#figB', 800, 440);
      const d = svg.querySelector('defs');
      d.insertAdjacentHTML('beforeend', '<linearGradient id="fbBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f7fa"/><stop offset="1" stop-color="#e6ecf2"/></linearGradient><linearGradient id="fbW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd8ef" stop-opacity=".85"/><stop offset="1" stop-color="#7fb0da" stop-opacity=".9"/></linearGradient><linearGradient id="fbS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d6e9f7"/><stop offset="1" stop-color="#c2dcf0"/></linearGradient><linearGradient id="fbLz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2e35"/><stop offset=".35" stop-color="#6c737d"/><stop offset=".6" stop-color="#2a2e35"/><stop offset="1" stop-color="#121418"/></linearGradient>');
      el('rect', { width: 800, height: 440, rx: 10, fill: 'url(#fbBg)' }, svg);
      el('ellipse', { cx: 430, cy: 420, rx: 280, ry: 14, fill: 'rgba(20,38,59,.14)' }, svg);
      // 뒤쪽 유리
      el('path', { d: 'M220 120L660 120L660 380', fill: 'none', stroke: 'rgba(120,150,175,.55)', 'stroke-width': 1.6 }, svg);
      el('path', { d: 'M220 220L660 220L660 380L220 380Z', fill: 'url(#fbW)', opacity: .5 }, svg);
      // 물
      el('path', { d: 'M180 250L620 250L660 220L220 220Z', fill: 'url(#fbS)' }, svg);
      el('path', { d: 'M180 250L620 250L620 410L180 410Z', fill: 'url(#fbW)' }, svg);
      el('path', { d: 'M620 250L660 220L660 380L620 410Z', fill: '#8fb9dd', opacity: .8 }, svg);
      // 앞쪽 유리 틀
      el('path', { d: 'M180 150L620 150L620 410L180 410Z', fill: 'rgba(230,240,248,.25)', stroke: 'rgba(110,140,165,.8)', 'stroke-width': 2 }, svg);
      el('path', { d: 'M180 150L220 120M620 150L660 120M620 410L660 380M180 410L220 380', stroke: 'rgba(110,140,165,.8)', 'stroke-width': 2 }, svg);
      el('path', { d: 'M196 170L196 395', stroke: 'rgba(255,255,255,.7)', 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
      const H = [410, 235], a = 48, r = OP.refr(a);
      dash(svg, H[0], 70, H[0], 400);
      const S = [H[0] + Math.sin(a * D) * 230, H[1] - Math.cos(a * D) * 230], E = [H[0] - Math.sin(r * D) * 190, H[1] + Math.cos(r * D) * 190];
      wedge(svg, H[0], H[1], 52, -Math.PI / 2, -Math.PI / 2 + a * D);
      wedge(svg, H[0], H[1], 52, Math.PI / 2, Math.PI / 2 + r * D);
      OPA.ray(svg, S, H, { color: RED, w: 3.4, at: 0.55, glow: true });
      OPA.ray(svg, H, E, { color: RED, w: 3.4, at: 0.6, glow: true });
      el('circle', { cx: H[0], cy: H[1], r: 12, fill: 'rgba(224,64,47,.3)', filter: 'url(#opGlow2)' }, svg);
      // 레이저 포인터
      const deg = Math.atan2(-Math.cos(a * D), Math.sin(a * D)) / D;
      const lz = el('g', { transform: `translate(${S[0]} ${S[1]}) rotate(${deg})`, filter: 'url(#opShadow)' }, svg);
      el('rect', { x: 14, y: -9, width: 110, height: 18, rx: 7, fill: 'url(#fbLz)' }, lz);
      el('rect', { x: 0, y: -7, width: 18, height: 14, rx: 3, fill: 'url(#paMetalV)' }, lz);
      el('rect', { x: 52, y: -10, width: 12, height: 4, rx: 2, fill: '#c94a3a' }, lz);
      ov.put('air', 245, 180, '공기', 'inks'); ov.put('wat', 240, 300, '물', 'inks');
      ov.put('nn', H[0] - 70, 62, '경계면과 수직인 선', 'inks');
      ov.put('ri', S[0] + 70, S[1] + 50, '입사 광선', 'ink');
      ov.put('ai', H[0] + 70, H[1] - 82, `입사각`, 'inkk');
      ov.put('ao', H[0] - 64, H[1] + 82, `굴절각`, 'inkk');
      ov.put('ro', E[0] - 62, E[1] - 10, '굴절 광선', 'ink');
      ov.put('bd', 260, 236, '경계면', 'inks');
    })();

    /* ---- 그림 ③: 해 보기 2×2 ---- */
    function tryPanel(host, glow, lifted) {
      const { svg } = mk(host, 300, 280);
      el('rect', { width: 300, height: 280, fill: '#eef2f6' }, svg);
      el('path', { d: 'M8 250L292 250L272 212L28 212Z', fill: '#d6dce3' }, svg);
      el('path', { d: 'M8 250L292 250L292 262L8 262Z', fill: '#b6bfc9' }, svg);
      el('path', { d: 'M58 244L242 244L230 218L70 218Z', fill: '#25282d' }, svg);
      const yb = lifted ? 186 : 242, h = 128, yt = yb - h;
      OPA.cube(svg, 150, 238, 26, glow);
      OPA.tube(svg, 150, yb, 40, h);
      const ey = yt - 30;
      OP.eye(svg, 150, ey, 54, { ly: 4, shade: false });
      if (!glow) {
        if (lifted) {
          OPA.ray(svg, [14, 168], [134, 222], { w: 2.6, at: 0.6 });
          OPA.ray(svg, [152, 208], [152, ey + 24], { w: 2.4, dash: '5 5', at: 0.3 });
        } else {
          OPA.ray(svg, [14, 168], [108, 202], { w: 2.6, head: false });
          el('path', { d: 'M104 194l8 8M112 194l-8 8', stroke: '#9aa3ad', 'stroke-width': 2, 'stroke-linecap': 'round' }, svg);
        }
      } else {
        OPA.ray(svg, [152, 208], [152, ey + 24], { w: 2.4, dash: '5 5', at: 0.3, color: '#5aaa43' });
        el('ellipse', { cx: 150, cy: yt + 2, rx: 30, ry: 7, fill: 'url(#paGreenGlow)' }, svg);
      }
    }
    (function tryGrid() {
      const grid = $('#tryGrid');
      [['작은 물체', false], ['야광 물체', true]].forEach(([name, glow]) => {
        grid.insertAdjacentHTML('beforeend', `<span class="rh">${name.replace(' ', '<br>')}</span>`);
        [false, true].forEach((lifted) => {
          const seen = glow || lifted;
          const c = document.createElement('div'); c.className = 'cell';
          c.innerHTML = `<div class="scene"><svg viewBox="0 0 300 280" role="img" aria-label="${name}, ${lifted ? '통을 들어 올림' : '통으로 덮음'}: ${seen ? '보인다' : '보이지 않는다'}"></svg></div><span class="res${seen ? '' : ' no'}">${seen ? '보여요' : '보이지 않아요'}</span>`;
          grid.appendChild(c); tryPanel(c.querySelector('.scene'), glow, lifted);
        });
      });
    })();

    /* ---- 그림 ④: 전등을 볼 때 · 공을 볼 때 ---- */
    (function figD() {
      const A = mk('#figD1', 400, 300);
      el('rect', { width: 400, height: 300, fill: '#edf1f5' }, A.svg);
      el('rect', { y: 228, width: 400, height: 72, fill: '#dcd3c4' }, A.svg);
      el('rect', { y: 228, width: 400, height: 6, fill: '#c9bfae' }, A.svg);
      const lamp = OPA.lamp(A.svg, 112, 108, 0.82, true);
      const B0 = [112, 116];
      [[-150, 0.45], [-95, 0.4], [-40, 0.4], [50, 0.4], [130, 0.45], [175, 0.4]].forEach(([deg, op]) => { const t = deg * D; OPA.ray(A.svg, [B0[0] + Math.cos(t) * 50, B0[1] + Math.sin(t) * 50], [B0[0] + Math.cos(t) * 92, B0[1] + Math.sin(t) * 92], { w: 2.4, op }); });
      const eyeP = [318, 96];
      OPA.ray(A.svg, [B0[0] + 46, B0[1] - 4], [eyeP[0] - 40, eyeP[1] + 2], { w: 3.2, at: 0.6, glow: true });
      OP.eye(A.svg, eyeP[0], eyeP[1], 64, { lx: -6 });
      const phA = OP.photons(el('g', { filter: 'url(#opDot)' }, A.svg));
      phA.add([[B0[0] + 46, B0[1] - 4], [eyeP[0] - 36, eyeP[1] + 2]], { rate: 2.2, speed: 120, color: '#ffb52e', r: 4 });
      A.ov.put('l', 112, 262, '전등 (광원)', 'ink'); A.ov.put('e', eyeP[0], 140, '눈', 'ink');

      const Bf = mk('#figD2', 400, 300);
      const d = Bf.svg.querySelector('defs');
      d.insertAdjacentHTML('beforeend', '<linearGradient id="fdSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe3f3"/><stop offset="1" stop-color="#eef4f8"/></linearGradient><linearGradient id="fdGr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd2ab"/><stop offset="1" stop-color="#9fbb8c"/></linearGradient>');
      el('rect', { width: 400, height: 300, fill: 'url(#fdSky)' }, Bf.svg);
      el('path', { d: 'M0 214C80 204 180 210 260 206S360 200 400 204L400 300L0 300Z', fill: 'url(#fdGr)' }, Bf.svg);
      el('path', { d: 'M0 200C30 180 60 186 80 194C100 176 140 182 150 198L0 204Z', fill: '#a9c49a', opacity: .7 }, Bf.svg);
      OPA.sun(Bf.svg, 340, 48, 20);
      const ball = [196, 236], eye2 = [66, 92];
      OPA.ball(Bf.svg, ball[0], ball[1], 24);
      OPA.ray(Bf.svg, [326, 64], [212, 216], { w: 3.2, at: 0.55, glow: true });
      OPA.ray(Bf.svg, [182, 216], [eye2[0] + 30, eye2[1] + 18], { w: 3.2, at: 0.55, glow: true });
      [[-60, 0.35], [-20, 0.3], [-110, 0.3]].forEach(([deg, op]) => { const t = deg * D; OPA.ray(Bf.svg, [ball[0] + Math.cos(t) * 30, ball[1] + Math.sin(t) * 30], [ball[0] + Math.cos(t) * 70, ball[1] + Math.sin(t) * 70], { w: 2.2, op }); });
      OP.eye(Bf.svg, eye2[0], eye2[1], 64, { lx: 6, ly: 4 });
      const phB = OP.photons(el('g', { filter: 'url(#opDot)' }, Bf.svg));
      phB.add([[326, 64], [204, 212], [eye2[0] + 34, eye2[1] + 20]], { rate: 1.6, speed: 130, color: '#ffb52e', r: 4 });
      Bf.ov.put('s', 340, 92, '태양 (광원)', 'ink'); Bf.ov.put('b', ball[0] + 52, ball[1] + 4, '공', 'ink'); Bf.ov.put('e', eye2[0], 136, '눈', 'ink'); Bf.ov.put('r', ball[0] - 2, ball[1] - 50, '반사', 'inkk');
    })();

    /* ---- 오개념 그림 ---- */
    function mini(id, kind) {
      const M = mk(id, 360, 200);
      const d = M.svg.querySelector('defs');
      if (!d.querySelector('#mnSky')) d.insertAdjacentHTML('beforeend', '<linearGradient id="mnSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dbe9f4"/><stop offset="1" stop-color="#f3f7fa"/></linearGradient>');
      el('rect', { width: 360, height: 200, fill: 'url(#mnSky)' }, M.svg);
      el('path', { d: 'M0 160C90 152 200 158 360 150L360 200L0 200Z', fill: '#bdd2ad' }, M.svg);
      OPA.sun(M.svg, 312, 40, 15);
      const ball = [190, 160], eye = [56, 64];
      OPA.ball(M.svg, ball[0], ball[1], 18);
      OP.eye(M.svg, eye[0], eye[1], 50, { lx: 6, ly: 4 });
      const WR = '#d9534f';
      if (kind === 1) OPA.ray(M.svg, [eye[0] + 26, eye[1] + 12], [ball[0] - 18, ball[1] - 14], { color: WR, w: 3, dash: '7 6', at: 0.6 });
      if (kind === 2) OPA.ray(M.svg, [ball[0] - 18, ball[1] - 14], [eye[0] + 26, eye[1] + 12], { color: WR, w: 3, dash: '7 6', at: 0.55 });
      if (kind === 3) { OPA.ray(M.svg, [302, 52], [202, 146], { w: 3, at: 0.55 }); OPA.ray(M.svg, [176, 146], [eye[0] + 26, eye[1] + 12], { w: 3, at: 0.55 }); }
      M.ov.put('e', eye[0], 100, '눈', 'ink'); M.ov.put('b', ball[0] + 36, ball[1] - 2, '공', 'ink'); M.ov.put('s', 312, 74, '태양', 'ink');
    }
    mini('#myth1', 1); mini('#myth2', 2); mini('#myth3', 3);

    window.RD.ok2 = true;
  } catch (err) { window.RD_err('그림', err); }
})();
