/* ===== 블록 2: 읽기 그림 (첫 화면, 비쳐 보이는 모습, 상의 특징, 상이 생기는 원리 ①~④) ===== */
(() => {
  'use strict';
  try {
    const { $ } = window.RD, { el } = OP;

    /* ---- 첫 화면: 작도 단계가 차례로 그려짐 ---- */
    (function hero() {
      const S = MR.build($('#heroScene'), { px: 600 - 7 * 40, E: [372, 136] });
      S.st.labels = false;
      const seq = [1, 3, 4, 5, 6];
      let k = RD.reduce ? 4 : 0;
      S.render(seq[k]);
      if (!RD.reduce) setInterval(() => { k = (k + 1) % seq.length; if (k === 0) S.reset(); S.render(seq[k], { anim: true }); }, 2600);
    })();

    /* ---- 그림 ①: 거울, 유리, 잔잔한 수면 ---- */
    function pane(id) {
      const host = $(id), svg = host.querySelector('svg');
      OP.defs(svg); OPA.defs(svg); MR.defs(svg);
      return { host, svg, d: svg.querySelector('defs') };
    }
    (function mirrorPane() {
      const { svg, d } = pane('#figR1');
      d.insertAdjacentHTML('beforeend', '<linearGradient id="r1Frame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9b07a"/><stop offset="1" stop-color="#9c6b3c"/></linearGradient><linearGradient id="r1Glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8f2f7"/><stop offset=".5" stop-color="#cfe2ec"/><stop offset="1" stop-color="#b5cfdd"/></linearGradient><clipPath id="r1Clip"><rect x="112" y="34" width="176" height="150" rx="6"/></clipPath>');
      el('rect', { width: 400, height: 260, fill: 'url(#mrWall)' }, svg);
      el('rect', { y: 214, width: 400, height: 46, fill: 'url(#mrFloor)' }, svg);
      el('rect', { x: 102, y: 24, width: 196, height: 170, rx: 10, fill: 'url(#r1Frame)' }, svg);
      el('rect', { x: 112, y: 34, width: 176, height: 150, rx: 6, fill: 'url(#r1Glass)' }, svg);
      const inM = el('g', { 'clip-path': 'url(#r1Clip)' }, svg);
      el('rect', { x: 112, y: 150, width: 176, height: 40, fill: 'rgba(214,170,130,.55)' }, inM);
      MR.flower(el('g', { transform: 'translate(500 0) scale(-1 1)', opacity: 0.78 }, inM), 250, 190, 0.6, { shadow: false });
      el('path', { d: 'M130 50L170 50L124 120ZM190 44L206 44L140 150L132 150Z', fill: 'rgba(255,255,255,.4)' }, svg);
      el('rect', { x: 60, y: 202, width: 280, height: 14, rx: 3, fill: '#c8a37a' }, svg);
      el('rect', { x: 60, y: 214, width: 280, height: 6, fill: '#a7825b' }, svg);
      MR.flower(svg, 150, 206, 0.74);
    })();
    (function glassPane() {
      const { svg, d } = pane('#figR2');
      d.insertAdjacentHTML('beforeend', '<linearGradient id="r2Out" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e1a33"/><stop offset="1" stop-color="#22355a"/></linearGradient><radialGradient id="r2Glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff3c4" stop-opacity=".85"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient><clipPath id="r2Clip"><rect x="70" y="26" width="260" height="168"/></clipPath>');
      el('rect', { width: 400, height: 260, fill: '#efe6d6' }, svg);
      el('rect', { x: 60, y: 16, width: 280, height: 188, rx: 6, fill: '#f8f3ea', stroke: '#d8ccb6', 'stroke-width': 2 }, svg);
      el('rect', { x: 70, y: 26, width: 260, height: 168, fill: 'url(#r2Out)' }, svg);
      const sky = el('g', { 'clip-path': 'url(#r2Clip)' }, svg);
      [[96, 46], [150, 70], [300, 50], [260, 92], [118, 110]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 1.4, fill: '#cfe0ff', opacity: .8 }, sky));
      el('path', { d: 'M70 170L120 150L170 162L230 140L330 160L330 194L70 194Z', fill: '#101a2c' }, sky);
      // 유리에 비친 전등과 화분
      el('circle', { cx: 252, cy: 74, r: 46, fill: 'url(#r2Glow)', opacity: .55 }, sky);
      el('path', { d: 'M236 78C236 64 244 60 252 60C260 60 268 64 268 78Z', fill: 'rgba(240,230,205,.5)' }, sky);
      el('ellipse', { cx: 252, cy: 82, rx: 6, ry: 5, fill: 'rgba(255,250,225,.85)' }, sky);
      MR.flower(el('g', { transform: 'translate(560 0) scale(-1 1)', opacity: 0.42 }, sky), 300, 196, 0.5, { shadow: false });
      el('line', { x1: 200, y1: 26, x2: 200, y2: 194, stroke: '#f8f3ea', 'stroke-width': 7 }, svg);
      el('path', { d: 'M90 40L120 40L80 110ZM210 32L222 32L206 70Z', fill: 'rgba(255,255,255,.12)' }, svg);
      el('rect', { x: 50, y: 202, width: 300, height: 12, rx: 3, fill: '#d8ccb6' }, svg);
      el('rect', { y: 214, width: 400, height: 46, fill: 'url(#mrFloor)' }, svg);
      OPA.pendant(svg, 120, 70, 0.6, true);
      MR.flower(svg, 100, 202, 0.55);
    })();
    (function waterPane() {
      const { svg, d } = pane('#figR3');
      d.insertAdjacentHTML('beforeend', '<linearGradient id="r3Sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9d8f0"/><stop offset="1" stop-color="#eef5fa"/></linearGradient><linearGradient id="r3Wat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc3dc"/><stop offset="1" stop-color="#5f93b8"/></linearGradient><linearGradient id="r3Mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7f9fb5"/><stop offset="1" stop-color="#a9c0cf"/></linearGradient>');
      el('rect', { width: 400, height: 140, fill: 'url(#r3Sky)' }, svg);
      const land = (g) => {
        el('path', { d: 'M0 140L60 82L110 112L170 58L240 120L290 92L350 128L400 104L400 140Z', fill: 'url(#r3Mt)' }, g);
        el('path', { d: 'M0 140L0 128C40 122 90 130 140 126L170 140Z', fill: '#7da36a' }, g);
        el('rect', { x: 92, y: 96, width: 6, height: 34, fill: '#6b4a2c' }, g);
        el('circle', { cx: 95, cy: 88, r: 18, fill: '#5e9448' }, g); el('circle', { cx: 84, cy: 98, r: 13, fill: '#4f8a3c' }, g); el('circle', { cx: 106, cy: 96, r: 14, fill: '#6aa553' }, g); el('circle', { cx: 95, cy: 82, r: 14, fill: '#6aa553' }, g);
      };
      land(svg);
      el('rect', { y: 140, width: 400, height: 120, fill: 'url(#r3Wat)' }, svg);
      const rf = el('g', { transform: 'translate(0 280) scale(1 -1)', opacity: 0.5 }, svg); land(rf);
      const rp = el('g', { stroke: 'rgba(255,255,255,.55)', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, svg);
      [[40, 170, 60], [180, 186, 80], [300, 160, 50], [90, 214, 70], [250, 230, 90], [330, 200, 40]].forEach(([x, y, w]) => el('line', { x1: x, y1: y, x2: x + w, y2: y }, rp));
      el('line', { x1: 0, y1: 140, x2: 400, y2: 140, stroke: 'rgba(255,255,255,.7)', 'stroke-width': 1.4 }, svg);
    })();

    /* ---- 그림 ②: 상의 특징 (물체를 옮기면 상도 같은 거리만큼) ---- */
    (function feature() {
      const S = MR.build($('#figF'), { px: 600 - 5 * 40, E: [372, 136] });
      S.st.bare = true; S.st.lamp = false;
      const go = (k) => { S.st.px = 600 - k * 40; S.render(7); S.L.obj.lastChild.style.display = 'none'; S.ov.hide('eye'); $('#figFo').textContent = `거울에서 물체까지 ${k}칸 · 거울에서 상까지 ${k}칸`; };
      go(5);
      $('#figFr').addEventListener('input', (e) => go(+e.target.value));
    })();

    /* ---- 그림 ③~⑥: 상이 생기는 원리 ①~④ ---- */
    [['#figP1', 1], ['#figP2', 4], ['#figP3', 5], ['#figP4', 6]].forEach(([id, stage]) => {
      const S = MR.build($(id), { px: 600 - 7 * 40, E: [372, 136] });
      S.st.labels = false; S.st.angles = false;
      S.render(stage);
      if (stage === 6) { S.ov.put('img', S.geo().P2[0], S.FLOOR + 30, '상', 'inkk'); }
      S.ov.put('o', S.st.px, S.FLOOR + 30, '물체', 'ink'); S.ov.put('e', S.st.E[0], S.st.E[1] + 44, '눈', 'ink');
    });

    window.RD.ok2 = true;
  } catch (err) { window.RD_err('그림', err); }
})();
