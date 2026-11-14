/* ===== 소화효소 실험실 ENZ (교과서 199쪽 그림 Ⅵ-4, 201쪽 그림 Ⅵ-7, 2D 캔버스) =====
   빵 한 입을 입 → 위 → 작은창자로 옮기며 소화액을 넣는다. 소화관 속을 크게 본 그림이다.
   녹말(육각형 사슬) → 아밀레이스 → 엿당(육각형 2개) → 탄수화물 소화효소 → 포도당
   단백질(색 구슬 사슬) → 펩신·트립신 → 작게 분해된 단백질 → 단백질 소화효소 → 아미노산
   지방(빗 모양이 뭉친 덩어리) → 쓸개즙: 작은 알갱이 → 라이페이스 → 지방산 + 모노글리세리드
   염산은 세균(막대 모양)을 죽인다. 각 소화효소는 한 종류의 영양소만 분해한다.
   입자의 수·크기·빠르기는 잘 보이게 정한 모형이다. */
const ENZ = (() => {
  'use strict';
  const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const VW = 1000, VH = 760, TOP = 180, BOT = 580, LX = 40, RX = 960;
  const rnd = (a, b) => a + Math.random() * (b - a), cl = (x) => Math.max(0, Math.min(1, x));
  const E = { amy: ['아밀레이스', '#4f9f62'], pep: ['펩신', '#dc6a8c'], try: ['트립신', '#9467c2'], lip: ['라이페이스', '#e0912f'], carb: ['탄수화물 소화효소', '#2f9faa'], prot: ['단백질 소화효소', '#3f7fc4'] };
  const BEAD = ['#e05a52', '#4caf6a', '#4a86d0', '#f2c444', '#a26ad0', '#ef8fb6'];
  const PLACE = {
    mouth: { name: '입', bg: '#fdf5f2' },
    sto: { name: '위', bg: '#fcf2f5' },
    si: { name: '작은창자', bg: '#fdf7f0' },
  };

  function lab(host) {
    host.innerHTML = ''; host.style.position = 'relative';
    const cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'; host.appendChild(cv);
    const g = cv.getContext('2d');
    const tags = document.createElement('div'); tags.style.cssText = 'position:absolute;inset:0;pointer-events:none'; host.appendChild(tags);
    let W = 0, H = 0, s = 1, ox = 0, oy = 0, dpr = 1;
    const resize = () => { const r = host.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr; s = Math.min(W / VW, H / VH); ox = (W - VW * s) / 2; oy = (H - VH * s) / 2; };
    try { new ResizeObserver(resize).observe(host); } catch (e) { addEventListener('resize', resize); }
    resize();
    const T = {};
    const tag = (k, html, x, y, al = 'c', cls = '') => { const e = document.createElement('div'); e.className = 'slab ' + cls; e.innerHTML = html; tags.appendChild(e); T[k] = { e, x, y, al, show: false }; return T[k]; };
    const placeTags = () => { Object.values(T).forEach((t) => { t.e.style.display = t.show ? '' : 'none'; t.e.style.transform = `translate(${ox + t.x * s}px,${oy + t.y * s}px) translate(${t.al === 'l' ? '0' : t.al === 'r' ? '-100%' : '-50%'},-50%)`; }); };
    tag('place', '', 500, 34, 'c', 'b');
    tag('duct', '쓸개즙·이자액이 들어오는 곳', 330, 120, 'l', 's');
    tag('wall', '', 500, 728, 'c', 's');

    /* ----- 상태 ----- */
    let place = 'mouth', chewed = false, chew = 0, slide = 0, acid = false, bile = false;
    const items = [], enz = [], drops = [];
    let seed = 5; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const inLumen = () => ({ x: rnd(LX + 80, RX - 80), y: rnd(TOP + 40, BOT - 40) });
    const reset = () => {
      items.length = enz.length = drops.length = 0; chewed = false; chew = 0; acid = false; bile = false; place = 'mouth';
      for (let k = 0; k < 6; k++) { const p = inLumen(); items.push({ t: 'S', n: 10, x: p.x, y: p.y, a: rnd(0, 6.28), w: rnd(0, 6) }); }
      for (let k = 0; k < 5; k++) { const p = inLumen(); items.push({ t: 'P', b: Array.from({ length: 10 }, () => BEAD[Math.floor(R() * BEAD.length)]), x: p.x, y: p.y, a: rnd(0, 6.28), w: rnd(0, 6) }); }
      items.push({ t: 'F', k: 9, x: 640, y: 380, a: 0, w: 0 });
      for (let k = 0; k < 6; k++) { const p = inLumen(); items.push({ t: 'B', x: p.x, y: p.y, a: rnd(0, 6.28), w: rnd(0, 6), life: 1 }); }
    };
    reset();

    /* ----- 소화효소 ----- */
    const addEnz = (kind, n, from) => { for (let k = 0; k < n; k++) { const p = from(); enz.push({ k: kind, x: p.x, y: p.y, vx: rnd(-20, 20), vy: rnd(-20, 20), busy: 0, tgt: null, a: rnd(0, 6.28), life: 1 }); } };
    const addDrops = (col, n, from, to) => { for (let k = 0; k < n; k++) { const p = from(); drops.push({ x: p.x, y: p.y, tx: to ? to().x : p.x + rnd(-60, 60), ty: to ? to().y : p.y + rnd(30, 120), c: col, t: -k * .03, d: rnd(.9, 1.4) }); } };
    const ductPt = () => ({ x: 200 + rnd(-10, 10), y: 128 });
    const wallPt = () => ({ x: rnd(LX + 60, RX - 60), y: R() < .5 ? TOP + 6 : BOT - 6 });
    const want = (e) => {
      /* 이 효소가 분해하는 대상 */
      if (e.k === 'amy') return (it) => it.t === 'S' && it.n > 2;
      if (e.k === 'carb') return (it) => it.t === 'S' && it.n === 2;
      if (e.k === 'pep' || e.k === 'try') return (it) => it.t === 'P' && it.b.length > 4;
      if (e.k === 'prot') return (it) => it.t === 'P' && it.b.length <= 4 && it.b.length > 1;
      if (e.k === 'lip') return (it) => it.t === 'F' && it.k > 0;
      return () => false;
    };
    const cut = (e, it) => {
      if (e.k === 'amy') { it.n -= 2; items.push({ t: 'S', n: 2, x: it.x + Math.cos(it.a) * 40, y: it.y + Math.sin(it.a) * 40, a: it.a + rnd(-1, 1), w: rnd(0, 6), vx: Math.cos(it.a) * 30, vy: Math.sin(it.a) * 30 }); }
      else if (e.k === 'carb') { it.n = 1; items.push({ t: 'S', n: 1, x: it.x + 12, y: it.y + 6, a: it.a, w: rnd(0, 6), vx: rnd(-30, 30), vy: rnd(-30, 30) }); }
      else if (e.k === 'pep' || e.k === 'try') { const piece = it.b.splice(it.b.length - 3, 3); items.push({ t: 'P', b: piece, x: it.x + Math.cos(it.a) * 40, y: it.y + Math.sin(it.a) * 40, a: it.a + rnd(-1, 1), w: rnd(0, 6), vx: rnd(-30, 30), vy: rnd(-30, 30) }); }
      else if (e.k === 'prot') { const b = it.b.pop(); items.push({ t: 'P', b: [b], x: it.x + rnd(-14, 14), y: it.y + rnd(-14, 14), a: 0, w: rnd(0, 6), vx: rnd(-35, 35), vy: rnd(-35, 35) }); }
      else if (e.k === 'lip') { it.k -= 1; items.push({ t: 'M', x: it.x + rnd(-20, 20), y: it.y + rnd(-20, 20), a: rnd(0, 6.28), w: rnd(0, 6), vx: rnd(-30, 30), vy: rnd(-30, 30) }); for (let j = 0; j < 2; j++) items.push({ t: 'A', x: it.x + rnd(-24, 24), y: it.y + rnd(-24, 24), a: rnd(0, 6.28), w: rnd(0, 6), vx: rnd(-35, 35), vy: rnd(-35, 35) }); }
    };
    const near = (e) => { const f = want(e); let best = null, bd = 1e9; items.forEach((it) => { if (!f(it) || it.lock) return; const d = Math.hypot(it.x - e.x, it.y - e.y); if (d < bd) { bd = d; best = it; } }); return best; };

    /* ----- 쓸개즙: 지방 덩어리를 작은 알갱이로 ----- */
    const splitFat = () => { const big = items.filter((it) => it.t === 'F' && it.k > 3); big.forEach((it) => { let k = it.k; it.k = 3; k -= 3; while (k > 0) { const n = Math.min(3, k); k -= n; items.push({ t: 'F', k: n, x: it.x + rnd(-110, 110), y: it.y + rnd(-90, 90), a: 0, w: rnd(0, 6), vx: rnd(-40, 40), vy: rnd(-40, 40) }); } }); bile = true; };

    /* ----- 움직임 ----- */
    const step = (dt) => {
      const run = chewed && slide <= 0;
      items.forEach((it) => {
        it.w += dt * .7; it.vx = (it.vx || 0) * (1 - dt * 1.5) + Math.sin(it.w * 1.3 + it.y * .01) * 9 * dt; it.vy = (it.vy || 0) * (1 - dt * 1.5) + Math.cos(it.w * 1.1 + it.x * .01) * 9 * dt;
        if (run) { it.x += it.vx * dt * 3; it.y += it.vy * dt * 3; it.a += Math.sin(it.w) * dt * .15; }
        const m = it.t === 'F' ? 30 + it.k * 4 : it.t === 'S' || it.t === 'P' ? 10 + (it.n || it.b.length) * 5 : 14;
        it.x = Math.max(LX + m, Math.min(RX - m, it.x)); it.y = Math.max(TOP + m * .6 + 8, Math.min(BOT - m * .6 - 8, it.y));
        if (it.t === 'B' && acid) it.life = Math.max(0, it.life - dt * .5);
      });
      for (let i = items.length - 1; i >= 0; i--) { const it = items[i]; if ((it.t === 'B' && it.life <= 0) || (it.t === 'F' && it.k <= 0) || (it.t === 'S' && it.n <= 0)) items.splice(i, 1); }
      if (!run) return;
      enz.forEach((e) => {
        if (e.leave) { e.life -= dt * 1.2; return; }
        if (e.busy > 0) { e.busy -= dt; if (e.busy <= 0 && e.tgt) { if (e.tgt.t === 'F' || e.tgt.t === 'S' || e.tgt.t === 'P') cut(e, e.tgt); e.tgt.lock = false; e.tgt = null; e.x += rnd(-20, 20); e.y += rnd(-20, 20); } return; }
        const it = near(e);
        if (!it) { e.a += dt; e.vx += (Math.sin(e.a) * 30 - e.vx) * dt; e.vy += (Math.cos(e.a * .8) * 30 - e.vy) * dt; e.x += e.vx * dt; e.y += e.vy * dt; }
        else { const dx = it.x - e.x, dy = it.y - e.y, d = Math.hypot(dx, dy) || 1, sp = 120; e.x += dx / d * sp * dt; e.y += dy / d * sp * dt; const reach = it.t === 'F' ? 22 + it.k * 4 : 20; if (d < reach) { e.busy = it.t === 'F' && it.k > 3 ? 2.6 : .45; e.tgt = it; it.lock = true; } }
        e.x = Math.max(LX + 14, Math.min(RX - 14, e.x)); e.y = Math.max(TOP + 14, Math.min(BOT - 14, e.y));
      });
      for (let i = enz.length - 1; i >= 0; i--) if (enz[i].life <= 0) enz.splice(i, 1);
    };

    /* ----- 그리기 ----- */
    function wall(top) {
      /* 소화관 벽: 위는 아래로, 아래는 위로 향한 면 */
      const y0 = top ? 0 : BOT, y1 = top ? TOP : VH, dir = top ? 1 : -1, edge = top ? TOP : BOT;
      if (place === 'mouth') {
        const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(top ? 0 : 1, top ? '#d98b88' : '#c96a68'); gr.addColorStop(top ? 1 : 0, top ? '#efb1aa' : '#e79a92');
        g.fillStyle = gr; g.fillRect(0, y0, VW, y1 - y0);
        /* 이 */
        for (let x = 70; x < VW - 40; x += 62) { const h = 34 + 6 * Math.sin(x); const tg = g.createLinearGradient(x, 0, x + 52, 0); tg.addColorStop(0, '#e9e4d8'); tg.addColorStop(.5, '#fbf9f3'); tg.addColorStop(1, '#ddd6c6'); g.fillStyle = tg; g.beginPath(); g.roundRect(x, top ? edge - h : edge, 52, h, top ? [4, 4, 14, 14] : [14, 14, 4, 4]); g.fill(); g.strokeStyle = 'rgba(150,140,120,.35)'; g.lineWidth = 1; g.stroke(); }
        if (!top) { g.fillStyle = 'rgba(255,255,255,.25)'; for (let k = 0; k < 90; k++) { g.beginPath(); g.arc((k * 97) % VW, BOT + 60 + (k * 37) % 110, 2, 0, 7); g.fill(); } }
        return;
      }
      if (place === 'sto') {
        const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(top ? 0 : 1, '#c46d5e'); gr.addColorStop(top ? 1 : 0, '#e7a091');
        g.fillStyle = gr; g.fillRect(0, y0, VW, y1 - y0);
        /* 근육 결 */
        g.strokeStyle = 'rgba(140,60,50,.25)'; g.lineWidth = 2; for (let k = 0; k < 4; k++) { const yy = top ? 18 + k * 14 : VH - 18 - k * 14; g.beginPath(); for (let x = 0; x <= VW; x += 20) g.lineTo(x, yy + Math.sin(x * .02 + k) * 3); g.stroke(); }
        /* 주름과 위샘 */
        g.fillStyle = '#f0b3a3'; g.beginPath(); g.moveTo(0, edge); for (let x = 0; x <= VW; x += 10) g.lineTo(x, edge - dir * (12 + 12 * Math.sin(x * .035) + 5 * Math.sin(x * .11))); g.lineTo(VW, edge); g.closePath(); g.fill();
        g.fillStyle = 'rgba(160,70,60,.35)'; for (let x = 40; x < VW; x += 46) { g.beginPath(); g.ellipse(x, edge - dir * 22, 4, 9, 0, 0, 7); g.fill(); }
        return;
      }
      /* 작은창자: 주름 위의 융털 */
      const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(top ? 0 : 1, '#d9926e'); gr.addColorStop(top ? 1 : 0, '#f1c09f');
      g.fillStyle = gr; g.fillRect(0, y0, VW, y1 - y0);
      for (let x = 10; x < VW; x += 24) { const h = 30 + 8 * Math.sin(x * .05); const vg = g.createLinearGradient(x - 9, 0, x + 9, 0); vg.addColorStop(0, '#e6a988'); vg.addColorStop(.5, '#f7d2b9'); vg.addColorStop(1, '#df9f7f'); g.fillStyle = vg; g.beginPath(); g.moveTo(x - 9, edge + dir * 4); g.lineTo(x - 9, edge - dir * (h - 9)); g.arc(x, edge - dir * (h - 9), 9, top ? Math.PI : 0, top ? 0 : Math.PI, !top); g.lineTo(x + 9, edge + dir * 4); g.closePath(); g.fill(); }
      if (top) { /* 샘창자로 들어오는 관 */ const dg = g.createLinearGradient(170, 0, 230, 0); dg.addColorStop(0, '#a7c46a'); dg.addColorStop(.5, '#d6e3a3'); dg.addColorStop(1, '#a7c46a'); g.fillStyle = dg; g.beginPath(); g.moveTo(180, 0); g.lineTo(220, 0); g.lineTo(214, TOP - 4); g.lineTo(186, TOP - 4); g.closePath(); g.fill(); g.fillStyle = '#6d8a3c'; g.beginPath(); g.ellipse(200, TOP - 3, 15, 5, 0, 0, 7); g.fill(); }
    }
    function hexa(x, y, r, f, sk) { g.beginPath(); for (let a = 0; a < 6; a++) { const t = a * Math.PI / 3 + Math.PI / 6; g.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r); } g.closePath(); g.fillStyle = f; g.fill(); g.strokeStyle = sk; g.lineWidth = 1.2; g.stroke(); }
    function bead(x, y, r, c) { const gr = g.createRadialGradient(x - r * .35, y - r * .35, r * .2, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.25, c); gr.addColorStop(1, c); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = 'rgba(20,38,59,.25)'; g.lineWidth = 1; g.stroke(); }
    function comb(x, y, a, sticks, sc = 1) { g.save(); g.translate(x, y); g.rotate(a); g.scale(sc, sc); g.fillStyle = '#f3e3b0'; g.strokeStyle = '#b8954a'; g.lineWidth = 1.2; g.beginPath(); g.roundRect(-12, -4, 24, 8, 3); g.fill(); g.stroke(); g.fillStyle = '#f2c94c'; for (let k = 0; k < sticks; k++) { const xx = -8 + k * 8; g.beginPath(); g.roundRect(xx - 2.2, 3, 4.4, 20, 2); g.fill(); g.stroke(); } g.restore(); }
    function stick(x, y, a) { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#f2c94c'; g.strokeStyle = '#b8954a'; g.lineWidth = 1.2; g.beginPath(); g.roundRect(-2.4, -11, 4.8, 22, 2); g.fill(); g.stroke(); g.fillStyle = '#d9a52d'; g.beginPath(); g.arc(0, -11, 3, 0, 7); g.fill(); g.restore(); }
    function drawItem(it) {
      const ux = Math.cos(it.a), uy = Math.sin(it.a);
      if (it.t === 'S') {
        const n = it.n, r = 9;
        for (let j = 0; j < n; j++) { const off = (j - (n - 1) / 2) * 15, wv = n > 2 ? Math.sin(j * .8 + it.w) * 6 : 0; hexa(it.x + ux * off - uy * wv, it.y + uy * off + ux * wv, r, n > 2 ? '#8e9de0' : n === 2 ? '#a9b8ee' : '#c3cdf5', n > 2 ? '#4f5bb0' : '#6c7bc8'); }
      } else if (it.t === 'P') {
        const n = it.b.length, pts = it.b.map((c, j) => { const off = (j - (n - 1) / 2) * 15, wv = n > 1 ? Math.sin(j * 1.1 + it.w) * 8 : 0; return [it.x + ux * off - uy * wv, it.y + uy * off + ux * wv]; });
        g.strokeStyle = '#7a8796'; g.lineWidth = 2; g.beginPath(); pts.forEach((p) => g.lineTo(p[0], p[1])); g.stroke();
        pts.forEach((p, j) => bead(p[0], p[1], 7.5, it.b[j]));
      } else if (it.t === 'F') {
        const k = it.k, rr = 18 + k * 7;
        const gr = g.createRadialGradient(it.x - rr * .3, it.y - rr * .3, rr * .2, it.x, it.y, rr); gr.addColorStop(0, 'rgba(255,240,180,.95)'); gr.addColorStop(1, 'rgba(240,205,110,.85)');
        g.fillStyle = gr; g.beginPath(); g.ellipse(it.x, it.y, rr, rr * .82, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(184,149,74,.6)'; g.lineWidth = 1.2; g.stroke();
        for (let j = 0; j < k; j++) { const t = j / Math.max(1, k) * 6.28 + it.w * .2, rad = k > 1 ? rr * .48 : 0; comb(it.x + Math.cos(t) * rad, it.y + Math.sin(t) * rad * .8 - 6, t * .5, 3, .85); }
      } else if (it.t === 'M') { comb(it.x, it.y, it.a, 1, 1); }
      else if (it.t === 'A') { stick(it.x, it.y, it.a); }
      else if (it.t === 'B') {
        g.save(); g.globalAlpha = it.life; g.translate(it.x, it.y); g.rotate(it.a); const sc = .6 + .4 * it.life; g.scale(sc, sc);
        g.fillStyle = '#7fb069'; g.strokeStyle = '#4d7a3c'; g.lineWidth = 1.2; g.beginPath(); g.roundRect(-14, -6, 28, 12, 6); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(77,122,60,.6)'; g.beginPath(); g.moveTo(14, 0); g.quadraticCurveTo(22, 6, 28, 0); g.stroke(); g.restore();
      }
    }
    function drawEnz(e) {
      const [, c] = E[e.k], r = 13, op = e.busy > 0 ? .5 : .85;
      g.save(); g.globalAlpha = Math.max(0, e.life);
      const gr = g.createRadialGradient(e.x - r * .35, e.y - r * .35, r * .2, e.x, e.y, r * 1.1); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.3, c); gr.addColorStop(1, c);
      g.fillStyle = gr; g.beginPath(); g.arc(e.x, e.y, r, op, Math.PI * 2 - op); g.lineTo(e.x + r * .15, e.y); g.closePath(); g.fill(); g.strokeStyle = 'rgba(20,38,59,.35)'; g.lineWidth = 1; g.stroke();
      g.restore();
    }
    function drawChunk(k) {
      /* 씹기 전 빵 조각: 겉은 갈색, 속은 연한 노란색, 씹으면 작게 부서진다 */
      const pieces = k <= 0 ? [[500, 380, 150]] : Array.from({ length: 9 }, (_, i) => [500 + Math.cos(i * 2.4) * k * 230, 380 + Math.sin(i * 2.4) * k * 120, 150 / Math.sqrt(1 + k * 8)]);
      pieces.forEach(([x, y, r], i) => {
        g.save(); g.globalAlpha = 1 - cl((k - .6) / .4);
        g.fillStyle = '#b8793a'; g.beginPath(); g.roundRect(x - r, y - r * .7, r * 2, r * 1.4, r * .35); g.fill();
        g.fillStyle = '#f2dca6'; g.beginPath(); g.roundRect(x - r * .86, y - r * .56, r * 1.72, r * 1.12, r * .28); g.fill();
        g.fillStyle = 'rgba(200,160,90,.5)'; for (let j = 0; j < 14; j++) { g.beginPath(); g.ellipse(x + Math.sin(j * 7 + i) * r * .6, y + Math.cos(j * 5 + i) * r * .4, 3 + (j % 3), 2, j, 0, 7); g.fill(); }
        g.restore();
      });
    }
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(.05, (now - last) / 1000) * (REDUCE ? 3 : 1); last = now;
      if (chew > 0 && chew < 1) chew = Math.min(1, chew + dt * .8);
      if (slide > 0) slide = Math.max(0, slide - dt * 1.4);
      step(dt);
      drops.forEach((d) => { d.t += dt / d.d; }); for (let i = drops.length - 1; i >= 0; i--) if (drops[i].t > 1.2) drops.splice(i, 1);
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
      g.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
      g.save(); g.beginPath(); g.roundRect(0, 0, VW, VH, 18); g.clip();
      g.fillStyle = PLACE[place].bg; g.fillRect(0, 0, VW, VH);
      const sx = slide > 0 ? (1 - Math.pow(1 - slide, 2)) * -VW * .0 : 0; void sx;
      wall(true); wall(false);
      /* 안쪽 그늘 */
      const sh = g.createLinearGradient(0, TOP, 0, TOP + 40); sh.addColorStop(0, 'rgba(120,60,50,.12)'); sh.addColorStop(1, 'rgba(120,60,50,0)'); g.fillStyle = sh; g.fillRect(0, TOP, VW, 40);
      const sh2 = g.createLinearGradient(0, BOT, 0, BOT - 40); sh2.addColorStop(0, 'rgba(120,60,50,.12)'); sh2.addColorStop(1, 'rgba(120,60,50,0)'); g.fillStyle = sh2; g.fillRect(0, BOT - 40, VW, 40);
      const off = slide > 0 ? -Math.sin(slide * Math.PI) * 30 : 0;
      g.save(); g.translate(off, 0);
      if (!chewed || chew < 1) drawChunk(chew);
      if (chewed) { g.save(); g.globalAlpha = cl(chew * 1.5 - .4); items.forEach(drawItem); enz.forEach(drawEnz); g.restore(); }
      drops.forEach((d) => { if (d.t < 0) return; const t = cl(d.t), x = d.x + (d.tx - d.x) * t, y = d.y + (d.ty - d.y) * t; g.globalAlpha = 1 - cl((d.t - .8) / .4); g.fillStyle = d.c; g.beginPath(); g.ellipse(x, y, 5, 6.5, 0, 0, 7); g.fill(); g.globalAlpha = 1; });
      g.restore();
      if (slide > 0) { g.fillStyle = `rgba(255,255,255,${Math.sin(slide * Math.PI) * .85})`; g.fillRect(0, 0, VW, VH); }
      g.restore();
      T.place.e.textContent = PLACE[place].name + ' 속을 크게 본 모습'; T.place.show = true;
      T.duct.show = place === 'si';
      T.wall.e.textContent = place === 'mouth' ? '이와 혀' : place === 'sto' ? '위의 안쪽 벽(주름, 위샘)' : '작은창자의 안쪽 벽'; T.wall.show = true;
      placeTags();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    /* ----- 집계 (교과서 그림 Ⅵ-7 표) ----- */
    const count = () => {
      const c = { S: 0, S2: 0, S1: 0, P: 0, P3: 0, P1: 0, F: 0, Fs: 0, FA: 0, B: 0 };
      items.forEach((it) => {
        if (it.t === 'S') { if (it.n > 2) c.S += it.n; else if (it.n === 2) c.S2 += 2; else c.S1 += 1; }
        if (it.t === 'P') { if (it.b.length > 4) c.P += it.b.length; else if (it.b.length > 1) c.P3 += it.b.length; else c.P1 += 1; }
        if (it.t === 'F') { if (it.k > 3) c.F += it.k; else c.Fs += it.k; }
        if (it.t === 'M') c.FA += 1; if (it.t === 'B') c.B += 1;
      });
      return c;
    };
    const api = {
      get place() { return place; }, get chewed() { return chewed; }, get bile() { return bile; }, E, count,
      chew() { chewed = true; chew = .001; },
      go(p) { place = p; slide = 1; enz.forEach((e) => { e.leave = true; }); },
      saliva() { addDrops('#8fc3e6', 30, () => ({ x: rnd(80, 920), y: TOP - 10 }), null); addEnz('amy', 5, () => ({ x: rnd(100, 900), y: TOP + 20 })); },
      gastric() { acid = true; addDrops('#d3b0e4', 36, wallPt, null); addEnz('pep', 5, wallPt); },
      bileJ() { addDrops('#86b04c', 30, ductPt, () => ({ x: rnd(180, 700), y: rnd(TOP + 40, BOT - 40) })); setTimeout(splitFat, 900); },
      pancreas() { addDrops('#f0c84a', 30, ductPt, () => ({ x: rnd(180, 700), y: rnd(TOP + 40, BOT - 40) })); addEnz('amy', 3, ductPt); addEnz('try', 3, ductPt); addEnz('lip', 3, ductPt); },
      wallE() { addEnz('carb', 4, wallPt); addEnz('prot', 4, wallPt); },
      reset() { reset(); },
      /* 화면 검사용: 시간을 앞당긴다 */
      ff(sec) { chew = 1; slide = 0; if (enz.some((e) => e.k === 'lip' && !e.leave) && !bile) splitFat(); for (let t = 0; t < sec; t += .05) { step(.05); } },
    };
    return api;
  }
  return { lab, E };
})();
window.ENZ = ENZ;
