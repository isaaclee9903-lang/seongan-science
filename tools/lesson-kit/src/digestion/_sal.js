/* ===== 침의 소화 작용 실험실 SAL (교과서 197쪽 탐구, 2D 캔버스) =====
   실험대 위: 묽은 녹말 용액 비커, 아이오딘-아이오딘화 칼륨 용액 병과 스포이트, 증류수 세척병, 면봉 접시, 시험관대(A·B), 35 ℃~40 ℃ 물이 든 비커와 디지털 온도계.
   돋보기: A·B 시험관 속 입자. 녹말 사슬(육각형 여럿) 안에 아이오딘(진한 점)이 끼어 청람색, 침 속 아밀레이스(초록)가 녹말을 엿당(육각형 2개)으로 자르면 아이오딘이 풀려 색이 옅어진다.
   A의 색은 돋보기 속 남은 녹말의 비율로 정한다. 입자의 크기·수, 색이 변하는 시간은 잘 보이게 정한 모형이다. */
const SAL = (() => {
  'use strict';
  const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const VW = 1000, VH = 720;
  const lerp = (a, b, t) => a + (b - a) * t, cl = (x) => Math.max(0, Math.min(1, x));
  const ease = (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((x, i) => Math.round(lerp(x, B[i], t))).join(',')})`; };
  const mixA = (a, b, t) => { const A = hex(a), B = hex(b); return A.map((x, i) => Math.round(lerp(x, B[i], t))); };
  const C = { milky: '#eceee6', blue: '#27307e', amber: '#ecd497', glass: '#8fa3b6', water: '#d6ebf6', steel: '#b9c1c9', bench: '#eef1f4' };

  function lab(host, opt = {}) {
    host.innerHTML = '';
    host.style.position = 'relative';
    const cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    host.appendChild(cv);
    const g = cv.getContext('2d');
    const labs = document.createElement('div'); labs.style.cssText = 'position:absolute;inset:0;pointer-events:none'; host.appendChild(labs);
    let W = 0, H = 0, s = 1, ox = 0, oy = 0, dpr = 1;
    const resize = () => { const r = host.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr; s = Math.min(W / VW, H / VH); ox = (W - VW * s) / 2; oy = (H - VH * s) / 2; };
    try { new ResizeObserver(resize).observe(host); } catch (e) { addEventListener('resize', resize); }
    resize();
    /* HTML 이름표 */
    const L = {};
    const tag = (k, html, x, y, al = 'c', cls = '') => { const e = document.createElement('div'); e.className = 'slab ' + cls; e.innerHTML = html; labs.appendChild(e); L[k] = { e, x, y, al, show: true }; return L[k]; };
    const placeTags = () => { Object.values(L).forEach((t) => { t.e.style.display = t.show ? '' : 'none'; const tx = ox + t.x * s, ty = oy + t.y * s; t.e.style.transform = `translate(${tx}px,${ty}px) translate(${t.al === 'l' ? '0' : t.al === 'r' ? '-100%' : '-50%'},-50%)` + (t.rot ? ` rotate(${t.rot}rad)` : ''); }); };

    /* ----- 상태 ----- */
    const st = {
      swab: 0,            // 면봉 준비 0~1
      lvl: [0, 0],        // 녹말 용액 높이 0~1 (6 mL)
      iod: [0, 0],        // 아이오딘 용액 0~1
      swIn: [0, 0],       // 면봉이 시험관 속으로 0~1
      shake: 0,           // 흔들기 시간
      bath: 0,            // 시험관대 → 물 비커 0~1
      starch: [1, 1],     // 남은 녹말 비율 (돋보기)
      mag: 0,             // 돋보기 보이기 0~1
      pour: null, drop: null, temp: 0, run: false,
    };
    const TUBE = { w: 46, h: 270 }, RACK = { x: [300, 392], top: 318 }, BATH = { x: [684, 780], top: 300 };
    const tubePos = (i) => { const t = ease(st.bath); const x0 = RACK.x[i], x1 = BATH.x[i], y0 = RACK.top, y1 = BATH.top; const arc = Math.sin(t * Math.PI) * 120; return { x: lerp(x0, x1, t), y: lerp(y0, y1, t) - arc }; };

    /* ----- 돋보기 입자 ----- */
    const P = [makeMag(0), makeMag(1)];
    function makeMag(which) {
      const R = 108, ch = [], enz = [], io = [];
      let seed = 3 + which * 11; const rn = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let k = 0; k < 7; k++) { const n = 6 + Math.floor(rn() * 5), a = rn() * 6.28, r = rn() * 50; ch.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, ang: rn() * 6.28, n, vx: 0, vy: 0, w: rn() * 6, io: true }); }
      for (let k = 0; k < 4; k++) enz.push({ x: (rn() - .5) * 140, y: (rn() - .5) * 140, a: rn() * 6.28, vx: 0, vy: 0, busy: 0, tgt: -1 });
      return { R, ch, enz, io, which, rn };
    }
    const stepMag = (m, dt, on) => {
      const R = m.R - 14;
      m.ch.forEach((c) => { c.w += dt * .6; c.vx += (Math.sin(c.w * 1.3 + c.n) * 6 - c.vx) * dt; c.vy += (Math.cos(c.w * 1.1 + c.n * 2) * 6 - c.vy) * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.ang += Math.sin(c.w) * dt * .25; const d = Math.hypot(c.x, c.y), lim = R - c.n * 5; if (d > lim) { c.x *= lim / d; c.y *= lim / d; } });
      m.io.forEach((p) => { p.w += dt; p.x += Math.sin(p.w * 1.7 + p.k) * dt * 14; p.y += Math.cos(p.w * 1.3 + p.k) * dt * 14; const d = Math.hypot(p.x, p.y); if (d > R) { p.x *= R / d; p.y *= R / d; } });
      if (m.which !== 0 || !on) return;
      /* 아밀레이스: 가까운 긴 사슬로 다가가 끝에서 두 칸(엿당)씩 자른다 */
      m.enz.forEach((e) => {
        if (e.busy > 0) { e.busy -= dt; if (e.busy <= 0) cut(m, e); return; }
        let best = -1, bd = 1e9; m.ch.forEach((c, i) => { if (c.n <= 2) return; const d = Math.hypot(c.x - e.x, c.y - e.y); if (d < bd) { bd = d; best = i; } });
        if (best < 0) { e.vx += (Math.sin(e.a += dt) * 20 - e.vx) * dt; e.vy += (Math.cos(e.a * .7) * 20 - e.vy) * dt; e.x += e.vx * dt; e.y += e.vy * dt; return; }
        const c = m.ch[best], dx = c.x - e.x, dy = c.y - e.y, d = Math.hypot(dx, dy) || 1;
        const sp = 46; e.x += dx / d * sp * dt; e.y += dy / d * sp * dt;
        if (d < 18) { e.busy = .55; e.tgt = best; }
      });
    };
    function cut(m, e) {
      const c = m.ch[e.tgt]; if (!c || c.n <= 2) return;
      c.n -= 2; const a = c.ang, off = (c.n + 1) * 7;
      m.ch.push({ x: c.x + Math.cos(a) * off, y: c.y + Math.sin(a) * off, ang: a + m.rn() - .5, n: 2, vx: Math.cos(a) * 14, vy: Math.sin(a) * 14, w: m.rn() * 6, io: false });
      for (let k = 0; k < 2; k++) m.io.push({ x: c.x + Math.cos(a) * off + (m.rn() - .5) * 10, y: c.y + Math.sin(a) * off + (m.rn() - .5) * 10, w: m.rn() * 6, k: m.rn() * 6 });
      if (c.n <= 2) c.io = false;
      e.x -= Math.cos(a) * 10; e.y -= Math.sin(a) * 10;
    }
    const starchLeft = (m) => { let a = 0, t = 0; m.ch.forEach((c) => { t += c.n; if (c.n > 2) a += c.n; }); return t ? a / t : 0; };

    /* ----- 그리기 도구 ----- */
    const shadow = (x, y, rx, ry, a = .14) => { g.save(); g.fillStyle = `rgba(20,38,59,${a})`; g.filter = 'blur(6px)'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); g.restore(); };
    function tubeShape(x, top, w, h) { const r = w / 2; g.beginPath(); g.moveTo(x - r, top); g.lineTo(x - r, top + h - r); g.arc(x, top + h - r, r, Math.PI, 0, true); g.lineTo(x + r, top); }
    function liquidColor(i) {
      const io = st.iod[i], sl = i === 0 ? st.starch[0] : st.starch[1];
      if (io <= 0) return hex(C.milky);
      const withI = mixA(C.amber, C.blue, cl(sl * 1.08 - .04));
      const base = hex(C.milky);
      return base.map((x, k) => Math.round(lerp(x, withI[k], cl(io))));
    }
    function drawTube(i) {
      const { x, y } = tubePos(i), w = TUBE.w, h = TUBE.h;
      let rot = 0; if (st.shake > 0) rot = Math.sin(st.shake * 26 + i) * .07 * Math.min(1, st.shake);
      g.save(); g.translate(x, y + h); g.rotate(rot); g.translate(-x, -(y + h));
      /* 유리 뒤쪽 */
      g.fillStyle = 'rgba(232,240,246,.55)'; tubeShape(x, y, w, h); g.closePath(); g.fill();
      /* 용액 */
      const lv = st.lvl[i];
      if (lv > 0) {
        const liqH = 112 * lv, top = y + h - liqH; const col = liquidColor(i);
        g.save(); tubeShape(x, y, w - 5, h - 2); g.closePath(); g.clip();
        const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
        const c0 = `rgba(${col.map((v) => Math.round(v * .82)).join(',')},.96)`, c1 = `rgba(${col.join(',')},.92)`;
        gr.addColorStop(0, c0); gr.addColorStop(.42, c1); gr.addColorStop(.6, c1); gr.addColorStop(1, c0);
        g.fillStyle = gr; g.fillRect(x - w, top, w * 2, liqH + 4);
        /* 아이오딘이 막 떨어져 위쪽부터 퍼지는 모습 */
        if (st.drop && st.drop.i === i && st.drop.spread < 1) { const sp = st.drop.spread; const gg = g.createLinearGradient(0, top, 0, top + liqH); gg.addColorStop(0, `rgba(39,48,126,${.0})`); gg.addColorStop(Math.max(.01, sp), 'rgba(39,48,126,0)'); gg.addColorStop(Math.min(1, sp + .2), `rgba(${hex(C.milky).join(',')},${.85 * (1 - sp)})`); gg.addColorStop(1, `rgba(${hex(C.milky).join(',')},${.85 * (1 - sp)})`); g.fillStyle = gg; g.fillRect(x - w, top, w * 2, liqH + 4); }
        g.fillStyle = `rgba(${col.map((v) => Math.round(v * .7)).join(',')},.55)`; g.beginPath(); g.ellipse(x, top, w / 2 - 3, 4, 0, 0, 7); g.fill();
        g.restore();
      }
      /* 면봉 */
      if (st.swIn[i] > 0) drawSwab(x - 6 + i * 2, lerp(y - 230, y + h - 120, ease(st.swIn[i])), 0.06 - i * .1, i, true);
      /* 유리 테두리 */
      g.strokeStyle = C.glass; g.lineWidth = 2.2; tubeShape(x, y, w, h); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - w / 2 + 7, y + 14); g.lineTo(x - w / 2 + 7, y + h - 40); g.stroke();
      g.strokeStyle = C.glass; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, w / 2 + 2, 4.5, 0, 0, 7); g.stroke();
      g.restore();
    }
    function drawSwab(x, y, rot, i, inTube) {
      g.save(); g.translate(x, y); g.rotate(rot);
      g.fillStyle = '#f3efe4'; g.strokeStyle = '#c9c2b0'; g.lineWidth = 1; g.beginPath(); g.roundRect(-2.4, -150, 4.8, 160, 2); g.fill(); g.stroke();
      const wet = i === 0 ? '#f4f4ee' : '#eef6fb';
      const gr = g.createRadialGradient(-3, 6, 2, 0, 10, 12); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, wet);
      g.fillStyle = gr; g.strokeStyle = '#cfcab9'; g.beginPath(); g.ellipse(0, 12, 7.5, 13, 0, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(180,175,160,.6)'; g.lineWidth = .8; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-6, 4 + k * 4); g.quadraticCurveTo(0, 6 + k * 4, 6, 3 + k * 4); g.stroke(); }
      g.restore();
    }
    function drawRackBack() {
      const x0 = 236, x1 = 456;
      shadow((x0 + x1) / 2, 606, 130, 10);
      g.fillStyle = '#9aa3ad'; [[x0 + 10, 420], [x1 - 10, 420]].forEach(([x]) => { g.fillRect(x - 3, 340, 6, 262); });
      /* 바닥판 */
      g.fillStyle = '#c3cad1'; g.beginPath(); g.moveTo(x0 - 6, 592); g.lineTo(x1 + 6, 592); g.lineTo(x1 + 18, 604); g.lineTo(x0 - 18, 604); g.closePath(); g.fill();
      g.fillStyle = '#a6aeb7'; g.fillRect(x0 - 18, 604, x1 - x0 + 36, 6);
      /* 가운데 받침 */
      g.fillStyle = '#c7ced5'; g.fillRect(x0, 506, x1 - x0, 8); g.fillStyle = '#a7afb8'; g.fillRect(x0, 514, x1 - x0, 3);
    }
    function drawRackFront() {
      const x0 = 236, x1 = 456, y = 340;
      g.fillStyle = '#cdd3d9'; g.beginPath(); g.moveTo(x0 - 8, y - 10); g.lineTo(x1 + 8, y - 10); g.lineTo(x1, y + 4); g.lineTo(x0, y + 4); g.closePath(); g.fill();
      g.fillStyle = '#aeb6be'; g.fillRect(x0, y + 4, x1 - x0, 7);
      [[x0 + 10], [x1 - 10]].forEach(([x]) => { g.fillStyle = '#a3abb4'; g.fillRect(x - 3, y + 11, 6, 252); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x - 3, y + 11, 2, 252); });
    }
    function drawBench() {
      const gr = g.createLinearGradient(0, 560, 0, VH); gr.addColorStop(0, '#e3e8ed'); gr.addColorStop(1, '#f2f4f6');
      g.fillStyle = gr; g.beginPath(); g.moveTo(30, 560); g.lineTo(970, 560); g.lineTo(1000, 690); g.lineTo(0, 690); g.closePath(); g.fill();
      g.fillStyle = '#cfd6dd'; g.fillRect(0, 690, VW, 14);
      g.fillStyle = '#e9edf1'; g.fillRect(0, 704, VW, 16);
    }
    function drawBeakerBack(x0, x1, top, bot, water) {
      g.fillStyle = 'rgba(232,240,246,.5)'; g.beginPath(); g.roundRect(x0, top, x1 - x0, bot - top, [2, 2, 14, 14]); g.fill();
      if (water) { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, '#c4dfee'); gr.addColorStop(.5, '#e2f1f9'); gr.addColorStop(1, '#c4dfee'); g.fillStyle = gr; g.globalAlpha = .55; g.beginPath(); g.roundRect(x0 + 3, water, x1 - x0 - 6, bot - water - 3, [0, 0, 12, 12]); g.fill(); g.globalAlpha = 1; }
    }
    function drawBeakerFront(x0, x1, top, bot, water, marks) {
      if (water) { g.fillStyle = 'rgba(160,205,232,.2)'; g.beginPath(); g.roundRect(x0 + 3, water, x1 - x0 - 6, bot - water - 3, [0, 0, 12, 12]); g.fill(); g.strokeStyle = 'rgba(110,160,200,.6)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse((x0 + x1) / 2, water, (x1 - x0) / 2 - 3, 5, 0, 0, 7); g.stroke(); }
      g.strokeStyle = C.glass; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x0 - 8, top - 4); g.quadraticCurveTo(x0, top, x0, top + 10); g.lineTo(x0, bot - 14); g.quadraticCurveTo(x0, bot, x0 + 14, bot); g.lineTo(x1 - 14, bot); g.quadraticCurveTo(x1, bot, x1, bot - 14); g.lineTo(x1, top + 4); g.stroke();
      g.beginPath(); g.ellipse((x0 + x1) / 2, top + 2, (x1 - x0) / 2, 5, 0, 0, 7); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + 9, top + 20); g.lineTo(x0 + 9, bot - 24); g.stroke();
      if (marks) { g.strokeStyle = 'rgba(90,110,130,.55)'; g.lineWidth = 1.3; for (let k = 1; k <= marks; k++) { const y = bot - k * (bot - top - 20) / (marks + 1); g.beginPath(); g.moveTo(x1 - 34, y); g.lineTo(x1 - 14, y); g.stroke(); } }
    }
    function drawBottle(x, y) {
      shadow(x, y + 132, 34, 6);
      const gr = g.createLinearGradient(x - 28, 0, x + 28, 0); gr.addColorStop(0, '#5a3214'); gr.addColorStop(.45, '#8b5426'); gr.addColorStop(1, '#4b2810');
      g.fillStyle = gr; g.beginPath(); g.roundRect(x - 28, y + 30, 56, 100, 10); g.fill();
      g.fillStyle = '#6f4019'; g.fillRect(x - 11, y + 14, 22, 18);
      g.fillStyle = '#f6f2e8'; g.fillRect(x - 24, y + 58, 48, 44); g.strokeStyle = 'rgba(0,0,0,.08)'; g.strokeRect(x - 24, y + 58, 48, 44);
    }
    function drawPipette(x, y, held) {
      g.save(); g.translate(x, y);
      g.fillStyle = 'rgba(232,240,246,.8)'; g.strokeStyle = C.glass; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-4, 0); g.lineTo(-4, 70); g.lineTo(-1.2, 92); g.lineTo(1.2, 92); g.lineTo(4, 70); g.lineTo(4, 0); g.closePath(); g.fill(); g.stroke();
      if (held) { g.fillStyle = 'rgba(160,110,40,.75)'; g.beginPath(); g.moveTo(-3, 50); g.lineTo(-3, 70); g.lineTo(-1, 90); g.lineTo(1, 90); g.lineTo(3, 70); g.lineTo(3, 50); g.fill(); }
      const gr = g.createLinearGradient(-9, 0, 9, 0); gr.addColorStop(0, '#2f3a46'); gr.addColorStop(.5, '#4d5a68'); gr.addColorStop(1, '#27313b');
      g.fillStyle = gr; g.beginPath(); g.roundRect(-8, -34, 16, 36, [8, 8, 3, 3]); g.fill();
      g.restore();
    }
    function drawStarchBeaker(x, y, tilt, fill) {
      g.save(); g.translate(x, y); g.rotate(tilt);
      const w = 92, h = 112;
      g.fillStyle = 'rgba(232,240,246,.5)'; g.beginPath(); g.roundRect(-w / 2, -h, w, h, [2, 2, 10, 10]); g.fill();
      const lv = 18 + 60 * fill;
      g.save(); g.beginPath(); g.roundRect(-w / 2 + 3, -h, w - 6, h - 3, [0, 0, 8, 8]); g.clip();
      g.fillStyle = 'rgba(232,234,224,.95)'; g.beginPath(); g.moveTo(-w, -lv - Math.tan(-tilt) * -w); g.lineTo(w, -lv - Math.tan(-tilt) * w); g.lineTo(w, 10); g.lineTo(-w, 10); g.closePath();
      g.save(); g.rotate(-tilt); g.fillRect(-w, -lv, w * 2, 200); g.restore(); g.restore();
      g.strokeStyle = C.glass; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-w / 2 - 7, -h - 3); g.quadraticCurveTo(-w / 2, -h, -w / 2, -h + 8); g.lineTo(-w / 2, -10); g.quadraticCurveTo(-w / 2, 0, -w / 2 + 10, 0); g.lineTo(w / 2 - 10, 0); g.quadraticCurveTo(w / 2, 0, w / 2, -10); g.lineTo(w / 2, -h + 3); g.stroke();
      g.beginPath(); g.ellipse(0, -h + 1, w / 2, 4, 0, 0, 7); g.stroke();
      g.restore();
    }
    function drawWashBottle(x, y) {
      shadow(x, y + 112, 36, 6);
      const gr = g.createLinearGradient(x - 32, 0, x + 32, 0); gr.addColorStop(0, '#dfe5ea'); gr.addColorStop(.5, '#f7f9fb'); gr.addColorStop(1, '#d3dae1');
      g.fillStyle = gr; g.strokeStyle = '#b8c2cc'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(x - 32, y + 20, 64, 92, 16); g.fill(); g.stroke();
      g.fillStyle = 'rgba(190,220,240,.5)'; g.beginPath(); g.roundRect(x - 29, y + 52, 58, 57, [0, 0, 14, 14]); g.fill();
      g.fillStyle = '#2f6fb0'; g.beginPath(); g.roundRect(x - 13, y + 6, 26, 16, 4); g.fill();
      g.strokeStyle = '#d0d7de'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y + 6); g.lineTo(x, y - 10); g.quadraticCurveTo(x, y - 22, x - 16, y - 26); g.lineTo(x - 30, y - 22); g.stroke(); g.lineCap = 'butt';
    }
    function drawTray(x, y) {
      shadow(x, y + 18, 92, 8, .12);
      g.fillStyle = '#ffffff'; g.strokeStyle = '#cdd5dd'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y + 8, 90, 16, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#f2f5f8'; g.beginPath(); g.ellipse(x, y + 6, 80, 11, 0, 0, 7); g.fill();
    }
    function drawThermo(x, y) {
      /* 디지털 온도계: 몸체는 비커 오른쪽 위, 탐침은 물속으로 */
      g.strokeStyle = '#8a95a1'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(x - 6, y + 60); g.lineTo(x - 96, y + 300); g.stroke();
      g.save(); g.translate(x, y); g.rotate(.36);
      g.fillStyle = '#e9edf1'; g.strokeStyle = '#aab4be'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(-30, -10, 60, 88, 14); g.fill(); g.stroke();
      g.fillStyle = '#9fb3a0'; g.beginPath(); g.roundRect(-22, 2, 44, 26, 4); g.fill();
      g.fillStyle = '#c9d1d8'; g.beginPath(); g.arc(0, 52, 8, 0, 7); g.fill();
      g.restore();
    }
    /* 돋보기 */
    function drawMag(m, cx, cy, from) {
      if (st.mag <= 0) return;
      const R = m.R * (.6 + .4 * ease(st.mag)); if (!st.lvl[m.which]) return;
      g.save(); g.globalAlpha = cl(st.mag * 1.5);
      g.strokeStyle = 'rgba(20,38,59,.4)'; g.lineWidth = 1; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(from.x, from.y); g.lineTo(cx + (from.x - cx) * R / Math.hypot(from.x - cx, from.y - cy), cy + (from.y - cy) * R / Math.hypot(from.x - cx, from.y - cy)); g.stroke(); g.setLineDash([]);
      g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fillStyle = '#fbfcfd'; g.fill();
      g.save(); g.clip();
      const tint = liquidColor(m.which); g.fillStyle = `rgba(${tint.join(',')},.13)`; g.fillRect(cx - R, cy - R, R * 2, R * 2);
      const k = R / m.R;
      m.io.forEach((p) => { g.fillStyle = '#c98a2a'; g.beginPath(); g.arc(cx + p.x * k, cy + p.y * k, 2.6 * k, 0, 7); g.fill(); });
      m.ch.forEach((c) => {
        const ux = Math.cos(c.ang), uy = Math.sin(c.ang);
        for (let j = 0; j < c.n; j++) {
          const wv = Math.sin(j * .9 + c.w) * 3, x = cx + (c.x + ux * (j - c.n / 2) * 7 - uy * wv) * k, y = cy + (c.y + uy * (j - c.n / 2) * 7 + ux * wv) * k;
          hexa(x, y, 4.3 * k, c.n > 2 ? '#8f9ee0' : '#b9c6f2', c.n > 2 ? '#5b67b7' : '#8b9ad6');
        }
        if (c.io && c.n > 2 && st.iod[m.which] > .3) for (let j = 1; j < c.n - 1; j += 2) { const x = cx + (c.x + ux * (j - c.n / 2 + .5) * 7) * k, y = cy + (c.y + uy * (j - c.n / 2 + .5) * 7) * k; g.fillStyle = '#2b2f74'; g.beginPath(); g.arc(x, y - 6 * k, 2.4 * k, 0, 7); g.fill(); }
      });
      if (m.which === 0 && st.swIn[0] >= 1) m.enz.forEach((e) => enzyme(cx + e.x * k, cy + e.y * k, 10 * k, e.busy > 0));
      g.restore();
      g.strokeStyle = '#5a6b7e'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
      g.restore();
    }
    function hexa(x, y, r, f, sk) { g.beginPath(); for (let a = 0; a < 6; a++) { const t = a * Math.PI / 3 + Math.PI / 6; g.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r); } g.closePath(); g.fillStyle = f; g.fill(); g.strokeStyle = sk; g.lineWidth = 1; g.stroke(); }
    function enzyme(x, y, r, chew) {
      const op = chew ? .55 : .9;
      const gr = g.createRadialGradient(x - r * .3, y - r * .3, r * .2, x, y, r * 1.1); gr.addColorStop(0, '#9fd59a'); gr.addColorStop(1, '#4e9a52');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, op, Math.PI * 2 - op); g.lineTo(x + r * .2, y); g.closePath(); g.fill();
      g.strokeStyle = '#3f7f44'; g.lineWidth = 1; g.stroke();
    }

    /* ----- 이름표 ----- */
    tag('A', '시험관 A', 0, 0, 'c', 'b'); tag('B', '시험관 B', 0, 0, 'c', 'b');
    tag('st', '묽은 녹말 용액', 112, 470); tag('io', '아이오딘-<br>아이오딘화 칼륨 용액', 540, 455); tag('dw', '증류수', 900, 470);
    tag('swA', '침을 적신 면봉', 244, 664, 'r', 's'); tag('swB', '증류수를 적신 면봉', 244, 688, 'r', 's');
    tag('bath', '35 ℃~40 ℃의 물', 731, 630); tag('T', '', 0, 0, 'c', 'lcd').rot = .36;
    tag('mA', 'A 속 입자', 0, 0, 'c', 's'); tag('mB', 'B 속 입자', 0, 0, 'c', 's');
    const mpos = [{ x: 300, y: 150 }, { x: 590, y: 150 }];

    /* ----- 장면 ----- */
    let last = performance.now(), queue = [];
    function frame(now) {
      const dt = Math.min(.05, (now - last) / 1000) * (REDUCE ? 3 : 1); last = now;
      /* 진행 중인 동작 */
      if (queue.length) { const a = queue[0]; a.t += dt; const u = cl(a.t / a.d); a.f(u, dt); if (u >= 1) { queue.shift(); a.done && a.done(); } }
      if (st.shake > 0) st.shake = Math.max(0, st.shake - dt * .5);
      if (st.drop) st.drop.spread = Math.min(1, st.drop.spread + dt * .9);
      const warm = st.bath >= 1 && st.swIn[0] >= 1;
      P.forEach((m) => stepMag(m, dt, warm && st.run));
      if (warm && st.run) st.starch[0] = starchLeft(P[0]);
      if (st.lvl[0] > .5) st.mag = Math.min(1, st.mag + dt * 1.5);
      /* 그리기 */
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
      g.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
      drawBench();
      /* 뒤쪽 물건 */
      drawWashBottle(900, 470);
      drawBottle(540, 470);
      drawBeakerBack(630, 832, 330, 612, 420);
      shadow(731, 614, 110, 8);
      drawRackBack();
      /* 시험관 (물 비커 안이면 물 앞면 전에 그린다) */
      drawTube(0); drawTube(1);
      drawRackFront();
      drawBeakerFront(630, 832, 330, 612, 420, 4);
      drawThermo(890, 250);
      /* 녹말 비커 */
      const sp = st.pour; let bx = 112, by = 600, tilt = 0, fill = 1 - (st.lvl[0] + st.lvl[1]) * .4;
      if (sp) { const tx = RACK.x[sp.i] - 74, ty = RACK.top - 6; const k = Math.min(1, sp.u * 3, (1 - sp.u) * 3); bx = lerp(112, tx, k); by = lerp(600, ty, k); tilt = k * 1.05; if (sp.u > .3 && sp.u < .7) { g.strokeStyle = 'rgba(225,228,215,.95)'; g.lineWidth = 6; g.beginPath(); g.moveTo(bx + 52, by - 112 + 30); g.quadraticCurveTo(RACK.x[sp.i] - 2, RACK.top + 10, RACK.x[sp.i], RACK.top + TUBE.h - 30); g.stroke(); } }
      else shadow(112, 606, 50, 6);
      drawStarchBeaker(bx, by, tilt, fill);
      /* 면봉 접시 */
      if (st.swab > 0) { g.save(); g.globalAlpha = cl(st.swab * 2); [0, 1].forEach((i) => { if (st.swIn[i] > 0) return; g.save(); g.translate(262, 652 + i * 24); g.rotate(1.53); drawSwab(0, 0, 0, i, false); g.restore(); }); g.restore(); }
      /* 스포이트 */
      const dp = st.drop; let px = 540, py = 452, held = false;
      if (dp && dp.u !== undefined) { const tx = tubePos(dp.i).x, ty = RACK.top - 110; const k = Math.min(1, dp.u * 4, (1 - dp.u) * 4); px = lerp(540, tx, k); py = lerp(452, ty, k); held = k > .2; if (dp.fall) dp.fall.forEach((f) => { if (f.y < f.end) { g.fillStyle = '#b07a2a'; g.beginPath(); g.ellipse(tx, f.y, 3.2, 4.4, 0, 0, 7); g.fill(); } }); }
      drawPipette(px, py, held);
      drawMag(P[0], mpos[0].x, mpos[0].y, { x: tubePos(0).x, y: tubePos(0).y + 160 });
      drawMag(P[1], mpos[1].x, mpos[1].y, { x: tubePos(1).x, y: tubePos(1).y + 160 });
      /* 이름표 자리 */
      [0, 1].forEach((i) => { const p = tubePos(i); L['AB'[i]].x = p.x; L['AB'[i]].y = p.y - 26; });
      L.swA.show = L.swB.show = st.swab > .5 && st.swIn[0] < .05;
      L.mA.x = mpos[0].x; L.mA.y = mpos[0].y - 124; L.mB.x = mpos[1].x; L.mB.y = mpos[1].y - 124; L.mA.show = L.mB.show = st.mag > .6;
      L.T.x = 885; L.T.y = 265; L.T.e.textContent = st.temp ? st.temp.toFixed(1) + ' ℃' : ''; L.T.show = !!st.temp;
      placeTags();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    const run = (d, f, done) => new Promise((res) => { queue.push({ t: 0, d: REDUCE ? d / 3 : d, f, done: () => { done && done(); res(); } }); });
    const api = {
      st, P,
      async prep() { await run(.8, (u) => { st.swab = u; }); },
      async pour() { for (const i of [0, 1]) { st.pour = { i, u: 0 }; await run(2.2, (u) => { st.pour.u = u; if (u > .32) st.lvl[i] = cl((u - .32) / .36); }); } st.pour = null; },
      async iodine() {
        for (const i of [0, 1]) {
          st.drop = { i, u: 0, spread: 1, fall: [] };
          await run(2.6, (u, dt) => { const dp = st.drop; dp.u = u; if (u > .3 && u < .7 && dp.fall.length < 3 && (u - .3) > dp.fall.length * .12) dp.fall.push({ y: RACK.top - 22, v: 0, end: RACK.top + TUBE.h - 112 * st.lvl[i] }); dp.fall.forEach((f) => { if (f.y < f.end) { f.v += 1400 * dt; f.y += f.v * dt; if (f.y >= f.end) { st.iod[i] = Math.min(1, st.iod[i] + .34); dp.spread = 0; } } }); });
        }
        st.drop = { i: 1, spread: 1 }; st.drop = null;
      },
      async swabIn() { await run(1.6, (u) => { st.swIn[0] = st.swIn[1] = u; }); st.shake = 1.6; await run(1.4, () => {}); },
      async warm() { await run(2.2, (u) => { st.bath = u; }); st.temp = 37; await run(.4, () => {}); st.run = true; },
      jump(n) { st.swab = 1; if (n >= 2) st.lvl = [1, 1]; if (n >= 3) st.iod = [1, 1]; if (n >= 4) st.swIn = [1, 1]; if (n >= 5) { st.bath = 1; st.temp = 37; st.mag = 1; st.run = true; } },
      fastForward(sec) { const m = P[0]; for (let t = 0; t < sec; t += .05) stepMag(m, .05, true); st.starch[0] = starchLeft(m); },
      get starchA() { return st.starch[0]; },
    };
    return api;
  }
  return { lab };
})();
window.SAL = SAL;
