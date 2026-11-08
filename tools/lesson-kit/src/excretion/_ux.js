/* ===== 인공소변 검사 실험실 UX (탐구 219쪽) =====
   실험대 위 인공소변 3종 비커, 소변검사지(포도당·단백질 칸), 비색표. 검사지를 담갔다 꺼내면 칸 색이 바뀌고 비색표와 견준다.
   검사지 칸과 비색표의 색, 기다리는 시간은 모형이다(실제 제품마다 다름). UF(_uf.js)의 surface·loop·label을 쓴다. */
const UX = (() => {
  'use strict';
  const { surface, loop, label } = UF;
  const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const ease = (t) => t * t * (3 - 2 * t);
  /* 비색표: [음성, 조금, 많이] */
  const CH = { glu: ['#8fd1c8', '#86b65a', '#7b5226'], pro: ['#ece27c', '#a9c96a', '#3f9a8c'] };
  const LEVEL = { normal: { glu: 0, pro: 0 }, glu: { glu: 2, pro: 0 }, pro: { glu: 0, pro: 2 } };
  function lab(host, opt = {}) {
    const LW = 1000, LH = 600, S = surface(host, LW, LH), g = S.g;
    const BX = [140, 350, 560], BY = 530, BW = 150, BH = 190;
    const types = opt.types || ['pro', 'normal', 'glu'];
    const res = [null, null, null];
    /* 검사지: x,y = 손잡이 끝(위) 위치, a = 각도 */
    const REST = { x: 985, y: 470, a: Math.PI / 2 };
    const st = { x: REST.x, y: REST.y, a: REST.a, pads: [CH.glu[0], CH.pro[0]], busy: false, sel: -1, ring: null, wet: 0 };
    let anim = [];
    const go = (to, dur, cb) => anim.push({ from: null, to, dur: REDUCE ? .05 : dur, t: 0, cb });
    const mixC = (a, b, t) => { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const f = (s) => [(s >> 16) & 255, (s >> 8) & 255, s & 255]; const A = f(pa), B = f(pb); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
    const drawBench = () => {
      g.fillStyle = '#ffffff'; g.fillRect(-300, -100, LW + 600, LH + 200);
      const tg = g.createLinearGradient(0, 470, 0, 640); tg.addColorStop(0, '#e9e3d8'); tg.addColorStop(1, '#d6cdbd'); g.fillStyle = tg; g.beginPath(); g.moveTo(-300, 510); g.lineTo(LW + 300, 510); g.lineTo(LW + 300, 700); g.lineTo(-300, 700); g.fill();
      g.fillStyle = '#c4b9a5'; g.fillRect(-300, 594, LW + 600, 6);
      g.strokeStyle = 'rgba(120,100,70,.12)'; g.lineWidth = 1; for (let y = 522; y < 592; y += 13) { g.beginPath(); g.moveTo(-300, y); g.lineTo(LW + 300, y + 3); g.stroke(); }
    };
    const beaker = (i) => {
      const x = BX[i], top = BY - BH, lv = BY - 104, sel = st.sel === i;
      g.save(); g.fillStyle = 'rgba(20,38,59,.16)'; g.beginPath(); g.ellipse(x, BY + 10, BW * .62, 10, 0, 0, 6.28); g.fill(); g.restore();
      /* 액체 */
      const lg = g.createLinearGradient(x - BW / 2, 0, x + BW / 2, 0); lg.addColorStop(0, '#efd56a'); lg.addColorStop(.5, '#f8e79a'); lg.addColorStop(1, '#e5c552');
      g.fillStyle = lg; g.beginPath(); g.moveTo(x - BW / 2 + 4, lv); g.lineTo(x - BW / 2 + 6, BY - 8); g.quadraticCurveTo(x - BW / 2 + 6, BY, x - BW / 2 + 16, BY); g.lineTo(x + BW / 2 - 16, BY); g.quadraticCurveTo(x + BW / 2 - 6, BY, x + BW / 2 - 6, BY - 8); g.lineTo(x + BW / 2 - 4, lv); g.fill();
      g.fillStyle = 'rgba(255,248,210,.85)'; g.beginPath(); g.ellipse(x, lv, BW / 2 - 4, 7, 0, 0, 6.28); g.fill();
      /* 유리 */
      g.strokeStyle = sel ? '#0e63b3' : '#8a9cab'; g.lineWidth = sel ? 3 : 2.2; g.beginPath(); g.moveTo(x - BW / 2 - 6, top - 4); g.lineTo(x - BW / 2, top + 4); g.lineTo(x - BW / 2 + 2, BY - 10); g.quadraticCurveTo(x - BW / 2 + 2, BY + 2, x - BW / 2 + 16, BY + 2); g.lineTo(x + BW / 2 - 16, BY + 2); g.quadraticCurveTo(x + BW / 2 - 2, BY + 2, x + BW / 2 - 2, BY - 10); g.lineTo(x + BW / 2, top + 4); g.lineTo(x + BW / 2 + 4, top); g.stroke();
      g.strokeStyle = 'rgba(138,156,171,.5)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, top + 2, BW / 2, 6, 0, 0, 6.28); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 5; g.beginPath(); g.moveTo(x - BW / 2 + 12, top + 18); g.lineTo(x - BW / 2 + 13, BY - 20); g.stroke();
      for (let k = 1; k <= 4; k++) { g.strokeStyle = 'rgba(100,120,135,.55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + BW / 2 - 26, BY - k * 34); g.lineTo(x + BW / 2 - 10, BY - k * 34); g.stroke(); }
      /* 이름 종이 */
      g.save(); g.translate(x, BY - 46); g.fillStyle = '#ffffff'; g.strokeStyle = '#c9d3dc'; g.lineWidth = 1; g.beginPath(); g.roundRect ? g.roundRect(-46, -14, 92, 28, 4) : g.rect(-46, -14, 92, 28); g.fill(); g.stroke(); g.restore();
      label(g, `인공소변 ${i + 1}`, x, BY - 46, { s: 15, bg: false, c: sel ? '#0e63b3' : '#14263b' });
      if (res[i]) label(g, '검사함', x, top - 22, { s: 13.5, c: '#5a6b7e' });
    };
    const chart = () => {
      /* 비색표 */
      const X = 690, Y = 40, W = 290, H = 220;
      g.save(); g.shadowColor = 'rgba(20,38,59,.18)'; g.shadowBlur = 12; g.shadowOffsetY = 4; g.fillStyle = '#fbfcfd'; g.beginPath(); g.roundRect ? g.roundRect(X, Y, W, H, 10) : g.rect(X, Y, W, H); g.fill(); g.restore();
      g.strokeStyle = '#d4dde6'; g.lineWidth = 1; g.beginPath(); g.roundRect ? g.roundRect(X, Y, W, H, 10) : g.rect(X, Y, W, H); g.stroke();
      label(g, '소변검사 비색표', X + W / 2, Y + 22, { s: 16, bg: false });
      [['음성', 0], ['조금', 1], ['많이', 2]].forEach(([t, k]) => label(g, t, X + 130 + k * 54, Y + 52, { s: 13, bg: false, c: '#5a6b7e', w: 700 }));
      label(g, '검사지', X + 70, Y + 52, { s: 13, bg: false, c: '#5a6b7e', w: 700 });
      [['포도당', 'glu', 0], ['단백질', 'pro', 1]].forEach(([n, k, r]) => {
        const y = Y + 90 + r * 62; label(g, n, X + 30, y, { s: 14.5, bg: false });
        CH[k].forEach((c, j) => { g.fillStyle = c; g.strokeStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.roundRect ? g.roundRect(X + 112 + j * 54, y - 17, 36, 34, 5) : g.rect(X + 112 + j * 54, y - 17, 36, 34); g.fill(); g.stroke(); });
        /* 검사지 칸 비교 자리 */
        g.strokeStyle = '#b8c5d2'; g.setLineDash([4, 3]); g.beginPath(); g.roundRect ? g.roundRect(X + 52, y - 19, 38, 38, 6) : g.rect(X + 52, y - 19, 38, 38); g.stroke(); g.setLineDash([]);
        if (st.cmp) { g.fillStyle = st.pads[r]; g.strokeStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.roundRect ? g.roundRect(X + 54, y - 17, 34, 34, 5) : g.rect(X + 54, y - 17, 34, 34); g.fill(); g.stroke(); }
        if (st.ring && st.ring[r] !== undefined) { g.strokeStyle = '#0e63b3'; g.lineWidth = 3; g.beginPath(); g.roundRect ? g.roundRect(X + 108 + st.ring[r] * 54, y - 21, 44, 42, 7) : g.rect(X + 108 + st.ring[r] * 54, y - 21, 44, 42); g.stroke(); }
      });
    };
    const strip = () => {
      g.save(); g.translate(st.x, st.y); g.rotate(st.a);
      g.shadowColor = 'rgba(20,38,59,.22)'; g.shadowBlur = 6; g.shadowOffsetY = 3;
      g.fillStyle = '#f7f8f9'; g.strokeStyle = '#b9c3cc'; g.lineWidth = 1.2; g.beginPath(); g.roundRect ? g.roundRect(-9, 0, 18, 230, 3) : g.rect(-9, 0, 18, 230); g.fill(); g.shadowColor = 'transparent'; g.stroke();
      if (st.wet > 0) { g.fillStyle = `rgba(240,214,110,${.25 * st.wet})`; g.fillRect(-9, 130, 18, 100); }
      [[176, 0], [206, 1]].forEach(([y, i]) => { g.fillStyle = st.pads[i]; g.strokeStyle = 'rgba(0,0,0,.2)'; g.fillRect(-8, y, 16, 16); g.strokeRect(-8, y, 16, 16); });
      g.restore();
    };
    const draw = () => { S.begin(); drawBench(); chart(); [0, 1, 2].forEach(beaker); strip(); label(g, '소변검사지', 870, 500, { s: 14, c: '#5a6b7e', w: 700 }); };
    const step = (dt) => {
      if (anim.length) { const a = anim[0]; if (!a.from) a.from = { x: st.x, y: st.y, a: st.a }; a.t += dt / a.dur; const e = ease(Math.min(1, a.t)); ['x', 'y', 'a'].forEach((k) => { if (a.to[k] !== undefined) st[k] = a.from[k] + (a.to[k] - a.from[k]) * e; }); if (a.to.f) a.to.f(Math.min(1, a.t)); if (a.t >= 1) { anim.shift(); a.cb && a.cb(); } }
    };
    loop(host, (dt) => { step(dt); draw(); }); draw();
    let onDone = null;
    /* 검사 한 번 */
    const test = (i, cb) => {
      if (st.busy) return; st.busy = true; st.cmp = false; st.ring = null; st.pads = [CH.glu[0], CH.pro[0]]; st.wet = 0;
      const x = BX[i], lv = BY - 104, L = LEVEL[types[i]];
      go({ x: REST.x, y: REST.y - 40, a: 0 }, .6);
      go({ x, y: BY - BH - 236 }, .9);
      go({ y: lv - 120 }, .8, () => { st.wet = 1; });
      go({ y: lv - 120, f: () => {} }, .7);
      go({ y: BY - BH - 236 }, .7);
      /* 기다리며 색이 바뀐다 */
      go({ x: 650, y: 296, a: -Math.PI / 2, f: (t) => { st.pads = [mixC(CH.glu[0], CH.glu[L.glu], ease(t)), mixC(CH.pro[0], CH.pro[L.pro], ease(t))]; } }, 2.2, () => { st.cmp = true; st.ring = [L.glu, L.pro]; res[i] = types[i]; st.busy = false; cb && cb(L); onDone && onDone(i, L); });
    };
    const api = {};
    Object.defineProperties(api, Object.getOwnPropertyDescriptors({
      S, types, res, CH,
      test, get busy() { return st.busy; },
      select(i) { st.sel = i; },
      onDone(f) { onDone = f; },
      show(i) { const L = LEVEL[types[i]]; st.pads = [CH.glu[L.glu], CH.pro[L.pro]]; st.cmp = true; st.ring = [L.glu, L.pro]; st.x = 650; st.y = 296; st.a = -Math.PI / 2; st.wet = 1; res[i] = types[i]; },
    }));
    return api;
  }
  return { lab, CH, LEVEL };
})();
window.UX = UX;
