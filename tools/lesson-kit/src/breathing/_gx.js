/* ===== 기체 교환 2D 도구 GX (그림 Ⅵ-14 형식) =====
   map: 위 폐, 가운데 심장, 아래 조직세포를 잇는 혈액 흐름 지도
   zoom: 허파꽈리-모세혈관 / 모세혈관-조직세포 단면. 입자가 제멋대로 움직이며 얇은 벽을 넘나들어(확산)
         많은 쪽에서 적은 쪽으로 저절로 퍼지는 것을 실제로 계산해 보여 준다.
   room: 사람이 많은 닫힌 방과 환기
   입자의 수·크기·빠르기는 잘 보이게 정한 모형이다. */
const GX = (() => {
  'use strict';
  const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const C = { o2: '#e23b2e', co2: '#3b4048', art: '#d8392e', vei: '#4a56b8', lung: '#f2b8ae', lungD: '#d98477', cell: '#f6cf8e', cellD: '#d9a253', nuc: '#9b6aa8', wall: '#e8a99c', plasma: '#fbe3dc', ink: '#14263b' };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const mix = (a, b, t) => { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const r = (pa >> 16) + (((pb >> 16) - (pa >> 16)) * t), g = ((pa >> 8) & 255) + ((((pb >> 8) & 255) - ((pa >> 8) & 255)) * t), bl = (pa & 255) + (((pb & 255) - (pa & 255)) * t); return `rgb(${r | 0},${g | 0},${bl | 0})`; };
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  /* 캔버스: 논리 크기 LW×LH 를 칸에 맞춰 그린다 */
  function surface(host, LW, LH) {
    const cv = document.createElement('canvas'); cv.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y'; host.appendChild(cv);
    const g = cv.getContext('2d'); const S = { cv, g, k: 1, ox: 0, oy: 0, W: 1, H: 1 };
    const fit = () => { const r = host.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); S.W = Math.max(1, r.width); S.H = Math.max(1, r.height); cv.width = S.W * d; cv.height = S.H * d; S.k = Math.min(S.W / LW, S.H / LH); S.ox = (S.W - LW * S.k) / 2; S.oy = (S.H - LH * S.k) / 2; S.d = d; };
    S.begin = () => { g.setTransform(S.d, 0, 0, S.d, 0, 0); g.clearRect(0, 0, S.W, S.H); g.setTransform(S.d * S.k, 0, 0, S.d * S.k, S.d * S.ox, S.d * S.oy); };
    S.toL = (x, y) => [(x - S.ox) / S.k, (y - S.oy) / S.k];
    try { new ResizeObserver(fit).observe(host); } catch (e) { addEventListener('resize', fit); } fit();
    return S;
  }
  /* 화면에 보일 때만 돌리기 */
  function loop(host, fn) {
    let last = performance.now(), on = true;
    const vis = () => { const r = host.getBoundingClientRect(); if (document.hidden || r.bottom < 0 || r.top > (window.innerHeight || 800)) return false; try { const f = window.frameElement; if (f && f.hasAttribute('data-page') && !f.classList.contains('on')) return false; } catch (e) {} return true; };
    const tick = (now) => { requestAnimationFrame(tick); const dt = Math.min(.05, (now - last) / 1000); last = now; if (!on || !vis()) return; fn(window.__bakeDt !== undefined ? window.__bakeDt : dt); };
    requestAnimationFrame(tick); return { stop() { on = false; }, start() { on = true; } };
  }
  /* 입자 그리기 */
  const ball = (g, x, y, r, c, hi = .35) => { const gr = g.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r); gr.addColorStop(0, mix(c, '#ffffff', hi)); gr.addColorStop(1, c); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); };
  const o2 = (g, x, y, s = 1, a = 0) => { const dx = Math.cos(a) * 4.2 * s, dy = Math.sin(a) * 4.2 * s; ball(g, x - dx, y - dy, 5 * s, C.o2); ball(g, x + dx, y + dy, 5 * s, C.o2); };
  const co2 = (g, x, y, s = 1, a = 0) => { const dx = Math.cos(a) * 7 * s, dy = Math.sin(a) * 7 * s; ball(g, x - dx, y - dy, 4.2 * s, C.o2); ball(g, x + dx, y + dy, 4.2 * s, C.o2); ball(g, x, y, 5.2 * s, C.co2, .25); };
  /* 적혈구: 가운데가 오목한 원반 */
  const rbc = (g, x, y, r, col, tilt = .55) => {
    g.save(); g.translate(x, y); g.scale(1, tilt);
    const gr = g.createRadialGradient(-r * .3, -r * .35, r * .1, 0, 0, r); gr.addColorStop(0, mix(col, '#ffffff', .28)); gr.addColorStop(.8, col); gr.addColorStop(1, mix(col, '#000000', .25)); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 6.2832); g.fill();
    g.fillStyle = mix(col, '#000000', .18); g.beginPath(); g.arc(r * .05, r * .08, r * .45, 0, 6.2832); g.fill();
    g.fillStyle = mix(col, '#ffffff', .12); g.beginPath(); g.arc(-r * .02, -r * .02, r * .38, 0, 6.2832); g.fill(); g.restore();
  };
  const label = (g, t, x, y, o = {}) => { g.font = `${o.w || 800} ${o.s || 17}px Pretendard, sans-serif`; g.textAlign = o.a || 'center'; g.textBaseline = 'middle'; if (o.bg !== false) { const w = g.measureText(t).width + 12; g.fillStyle = 'rgba(255,255,255,.9)'; const X = o.a === 'left' ? x - 6 : o.a === 'right' ? x - w + 6 : x - w / 2; g.beginPath(); g.roundRect ? g.roundRect(X, y - 12, w, 24, 6) : g.rect(X, y - 12, w, 24); g.fill(); } g.fillStyle = o.c || C.ink; g.fillText(t, x, y); };

  /* ===================== 지도 (그림 Ⅵ-14 형식) ===================== */
  function map(host, opt = {}) {
    const LW = 760, LH = 820, S = surface(host, LW, LH), g = S.g;
    /* 혈관 길 */
    const P = {
      pa: [[372, 262], [326, 240], [282, 268], [256, 318], [248, 350]], pv: [[266, 392], [316, 392], [362, 352], [392, 306]],
      ao: [[436, 330], [540, 400], [580, 520], [548, 640], [440, 690]], vc: [[340, 690], [232, 640], [196, 520], [238, 400], [366, 322]],
    };
    const pathLen = (p) => { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; };
    const at = (p, u) => { const L = pathLen(p) * u; let s = 0; for (let i = 1; i < p.length; i++) { const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (s + l >= L) { const t = (L - s) / l; return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t]; } s += l; } return p[p.length - 1]; };
    const curve = (p) => { g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length - 1; i++) { const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2; g.quadraticCurveTo(p[i][0], p[i][1], mx, my); } g.lineTo(p[p.length - 1][0], p[p.length - 1][1]); };
    const vessel = (p, c, w) => { g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = mix(c, '#000000', .2); g.lineWidth = w + 3; curve(p); g.stroke(); g.strokeStyle = c; g.lineWidth = w; curve(p); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = w * .28; curve(p.map(([x, y]) => [x - 2, y - 2])); g.stroke(); };
    /* 모세혈관 그물 (폐·조직) */
    const net = (cx, cy, w, h, a, b, seed) => { g.lineWidth = 3.2; for (let i = 0; i < 9; i++) { const y = cy - h / 2 + h * (i + .5) / 9; g.strokeStyle = mix(a, b, .5); g.beginPath(); for (let x = cx - w / 2; x <= cx + w / 2; x += 8) { const t = (x - cx + w / 2) / w; g.strokeStyle = mix(a, b, t); const yy = y + Math.sin(x * .05 + i * 1.7 + seed) * 7; if (x === cx - w / 2) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); } };
    const lungs = () => {
      [[-1, 250], [1, 520]].forEach(([s, cx]) => {
        g.save(); g.beginPath(); g.ellipse(cx, 175, 128, 150, s * .08, 0, 6.2832); g.closePath();
        const gr = g.createRadialGradient(cx - 40, 120, 20, cx, 175, 170); gr.addColorStop(0, '#fbe0db'); gr.addColorStop(1, C.lung); g.fillStyle = gr; g.fill(); g.clip();
        net(cx, 175, 260, 280, s < 0 ? C.vei : C.vei, s < 0 ? C.art : C.art, cx); g.restore();
        g.strokeStyle = C.lungD; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, 175, 128, 150, s * .08, 0, 6.2832); g.stroke();
      });
      label(g, '폐', 385, 60, { s: 22 });
    };
    const cells = () => {
      for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) { const x = 215 + c * 42 + (r % 2) * 21, y = 690 + r * 28; const gr = g.createRadialGradient(x - 8, y - 9, 3, x, y, 24); gr.addColorStop(0, '#fff1cf'); gr.addColorStop(1, C.cell); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, 23, 17, 0, 0, 6.2832); g.fill(); g.strokeStyle = C.cellD; g.lineWidth = 1.2; g.stroke(); g.fillStyle = '#d8b06a'; g.beginPath(); g.arc(x + 3, y + 2, 5, 0, 6.2832); g.fill(); }
      g.save(); g.beginPath(); g.rect(300, 690, 180, 40); g.clip(); net(390, 710, 170, 30, C.art, C.vei, 3); g.restore();
      label(g, '조직세포', 600, 760, { s: 19 });
    };
    const heart = () => {
      g.save(); g.translate(385, 495); g.rotate(-.2);
      g.beginPath(); g.moveTo(0, 70); g.bezierCurveTo(-90, 10, -78, -62, -24, -60); g.bezierCurveTo(-6, -60, 0, -44, 0, -36); g.bezierCurveTo(4, -48, 20, -64, 40, -60); g.bezierCurveTo(90, -50, 86, 14, 0, 70); g.closePath();
      const gr = g.createRadialGradient(-20, -24, 8, 0, 0, 90); gr.addColorStop(0, '#e98274'); gr.addColorStop(1, '#a8382d'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#7d281f'; g.lineWidth = 2; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-4, -30); g.quadraticCurveTo(6, 10, 0, 60); g.stroke(); g.restore();
      label(g, '심장', 470, 470, { s: 19 });
    };
    /* 흐르는 혈액 */
    const flows = [['pa', C.vei], ['pv', C.art], ['ao', C.art], ['vc', C.vei]];
    const dots = []; flows.forEach(([k, c]) => { for (let i = 0; i < 9; i++) dots.push({ k, c, u: i / 9 }); });
    const ring = (x, y, r, on) => { g.lineWidth = on ? 4 : 2.5; g.strokeStyle = on ? '#0e63b3' : C.o2; g.setLineDash(on ? [] : [7, 5]); g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.stroke(); g.setLineDash([]); };
    const HOT = { lung: [252, 372, 40], body: [390, 712, 44] };
    const img = new Image(); let imgOk = false; img.onload = () => { imgOk = true; }; img.src = opt.img || 'media/fig-lh.jpg';
    let hot = opt.hot || null, mol = 0;
    const draw = (dt) => {
      S.begin();
      if (imgOk) g.drawImage(img, 191, 4, 388, 518); else { lungs(); heart(); }
      cells();
      vessel(P.pa, C.vei, 11); vessel(P.vc, C.vei, 11); vessel(P.pv, C.art, 11); vessel(P.ao, C.art, 11);
      label(g, '폐', 610, 140, { s: 21 }); label(g, '심장', 600, 300, { s: 18 }); label(g, '폐동맥', 238, 222, { s: 15 }); label(g, '폐정맥', 330, 420, { s: 15 }); label(g, '동맥', 620, 520, { s: 15 }); label(g, '정맥', 150, 520, { s: 15 });
      dots.forEach((d) => { d.u += dt * .14; if (d.u > 1) d.u -= 1; const [x, y] = at(P[d.k], d.u); rbc(g, x, y, 7.5, d.c, .7); });
      /* 확대 고리와 그 안의 기체 */
      mol += dt;
      Object.entries(HOT).forEach(([k, [x, y, r]]) => { ring(x, y, r, hot === k); });
      const m1 = (mol * .6) % 1, m2 = ((mol * .6) + .5) % 1;
      o2(g, 236 + m1 * 14, 336 + m1 * 30, .9, .6); co2(g, 270 - m2 * 14, 400 - m2 * 30, .8, .3);
      co2(g, 372 + m1 * 4, 732 - m1 * 30, .8, .2); o2(g, 410 - m2 * 4, 690 + m2 * 30, .9, .4);
      if (opt.tap !== false) { label(g, hot === 'lung' ? '폐에서의 기체 교환' : '폐에서', 150, 372, { s: 15, c: hot === 'lung' ? '#0e63b3' : C.ink }); label(g, hot === 'body' ? '조직세포에서의 기체 교환' : '조직세포에서', 390, 650, { s: 15, c: hot === 'body' ? '#0e63b3' : C.ink }); }
    };
    let pick = null;
    S.cv.addEventListener('click', (e) => { const r = S.cv.getBoundingClientRect(), [x, y] = S.toL(e.clientX - r.left, e.clientY - r.top); Object.entries(HOT).forEach(([k, [hx, hy, hr]]) => { if (Math.hypot(x - hx, y - hy) < hr + 30 && pick) pick(k); }); });
    loop(host, (dt) => draw(REDUCE ? 0 : dt)); draw(0);
    return { set hot(k) { hot = k; }, onPick(f) { pick = f; } };
  }

  /* ===================== 단면: 확산 계산 ===================== */
  function zoom(host, opt = {}) {
    const LW = 900, LH = 620, S = surface(host, LW, LH), g = S.g;
    let kind = opt.kind || 'lung', run = !!opt.run, spd = 1;
    /* 칸: 위(허파꽈리 또는 조직세포) | 벽 | 모세혈관 | 벽 | 아래(조직세포) */
    const Y = { lung: { top: [40, 245], cap: [267, 413], wall: [245, 267], bot: [435, 600], wall2: [413, 435] }, body: { top: [40, 245], cap: [267, 413], wall: [245, 267], bot: [435, 600], wall2: [413, 435] } };
    let PS = [], rbcs = [], t = 0, made = { o2: 0, co2: 0 };
    const reset = () => {
      PS = []; t = 0; made = { o2: 0, co2: 0 }; const L = Y[kind];
      const add = (type, n, y0, y1, zone) => { for (let i = 0; i < n; i++) PS.push({ type, x: rnd(40, 860), y: rnd(y0 + 10, y1 - 10), vx: rnd(-1, 1), vy: rnd(-1, 1), a: rnd(0, 6), zone }); };
      if (kind === 'lung') { add('o2', 26, ...L.top, 'top'); add('co2', 3, ...L.top, 'top'); add('o2', 4, ...L.cap, 'cap'); add('co2', 28, ...L.cap, 'cap'); add('o2', 26, ...L.bot, 'bot'); add('co2', 3, ...L.bot, 'bot'); }
      else { add('o2', 5, ...L.top, 'top'); add('co2', 18, ...L.top, 'top'); add('o2', 34, ...L.cap, 'cap'); add('co2', 4, ...L.cap, 'cap'); add('o2', 5, ...L.bot, 'bot'); add('co2', 18, ...L.bot, 'bot'); }
      rbcs = Array.from({ length: 7 }, (_, i) => ({ x: 40 + i * 130, y: 0, s: rnd(0, 6) }));
    };
    const bounds = (z) => { const L = Y[kind]; return z === 'top' ? L.top : z === 'cap' ? L.cap : L.bot; };
    const count = () => { const c = { top: { o2: 0, co2: 0 }, cap: { o2: 0, co2: 0 }, bot: { o2: 0, co2: 0 } }; PS.forEach((p) => { c[p.zone][p.type]++; }); return c; };
    let onTick = null;
    const step = (dt) => {
      if (!run) return; t += dt * spd; const L = Y[kind];
      const flowV = 26; // 혈액이 흐르는 빠르기
      PS.forEach((p) => {
        p.vx += rnd(-1, 1) * 260 * dt; p.vy += rnd(-1, 1) * 260 * dt; p.vx *= .92; p.vy *= .92; const sp = Math.hypot(p.vx, p.vy), mx = 90; if (sp > mx) { p.vx *= mx / sp; p.vy *= mx / sp; }
        p.x += (p.vx + (p.zone === 'cap' ? flowV : 0)) * dt * spd; p.y += p.vy * dt * spd; p.a += dt * 2;
        const [y0, y1] = bounds(p.zone);
        /* 벽: 한 겹의 얇은 세포층이라 기체가 지나갈 수 있다 */
        const cross = (ny, z) => { if (Math.random() < .55) { p.zone = z; p.y = ny; return true; } return false; };
        if (p.y < y0 + 8) { if (p.zone === 'cap' && !cross(L.wall[0] - 9, 'top')) { p.y = y0 + 8; p.vy = Math.abs(p.vy); } else if (p.zone === 'bot' && !cross(L.wall2[0] - 9, 'cap')) { p.y = y0 + 8; p.vy = Math.abs(p.vy); } else if (p.zone === 'top' && p.y < y0 + 8) { p.y = y0 + 8; p.vy = Math.abs(p.vy); } }
        if (p.y > y1 - 8) { if (p.zone === 'top' && !cross(L.wall[1] + 9, 'cap')) { p.y = y1 - 8; p.vy = -Math.abs(p.vy); } else if (p.zone === 'cap' && !cross(L.wall2[1] + 9, 'bot')) { p.y = y1 - 8; p.vy = -Math.abs(p.vy); } else if (p.zone === 'bot' && p.y > y1 - 8) { p.y = y1 - 8; p.vy = -Math.abs(p.vy); } }
        if (p.x < 30) { p.x = 30; p.vx = Math.abs(p.vx); } if (p.x > 870 && p.zone !== 'cap') { p.x = 870; p.vx = -Math.abs(p.vx); }
      });
      /* 모세혈관 오른쪽 끝으로 나간 입자는 실려 가고, 왼쪽에서 새 혈액이 들어온다 */
      PS = PS.filter((p) => !(p.zone === 'cap' && p.x > 880));
      const cap = PS.filter((p) => p.zone === 'cap'); const inL = (type) => cap.filter((p) => p.type === type && p.x < 200).length;
      const want = kind === 'lung' ? { o2: 1, co2: 6 } : { o2: 7, co2: 1 };
      ['o2', 'co2'].forEach((ty) => { if (inL(ty) < want[ty] && Math.random() < dt * 6) PS.push({ type: ty, x: rnd(30, 60), y: rnd(L.cap[0] + 12, L.cap[1] - 12), vx: 20, vy: rnd(-20, 20), a: 0, zone: 'cap' }); });
      /* 허파꽈리: 숨을 쉬어 바깥 공기가 계속 들어오고 나간다 / 조직세포: 산소를 써서 에너지를 얻고 이산화 탄소가 생긴다 */
      const c = count();
      if (kind === 'lung') {
        ['top', 'bot'].forEach((z) => {
          const far = z === 'top' ? L.top[0] + 12 : L.bot[1] - 12;
          if (c[z].o2 < 25 && Math.random() < dt * 2.6) PS.push({ type: 'o2', x: rnd(120, 780), y: far, vx: 0, vy: z === 'top' ? 30 : -30, a: 0, zone: z });
          if (c[z].co2 > 3 && Math.random() < dt * 1.3) { const i = PS.findIndex((p) => p.zone === z && p.type === 'co2' && Math.abs(p.y - far) < 80); if (i >= 0) PS.splice(i, 1); }
        });
      } else {
        ['top', 'bot'].forEach((z) => {
          if (c[z].o2 > 3 && Math.random() < dt * 1.6) { const i = PS.findIndex((p) => p.zone === z && p.type === 'o2' && (z === 'top' ? p.y < L.top[1] - 60 : p.y > L.bot[0] + 60)); if (i >= 0) { const p = PS[i]; PS.splice(i, 1); made.o2++; PS.push({ type: 'co2', x: p.x, y: p.y, vx: 0, vy: 0, a: 0, zone: z, born: 1 }); made.co2++; } }
        });
      }
      rbcs.forEach((r) => { r.x += flowV * dt * spd; if (r.x > 900) r.x -= 910; });
      onTick && onTick(count());
    };
    /* 그리기 */
    const wallTex = (y0, y1, x0 = 0, x1 = 900, col = C.wall) => {
      const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, mix(col, '#ffffff', .25)); gr.addColorStop(1, mix(col, '#000000', .06)); g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      g.strokeStyle = mix(col, '#000000', .25); g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.moveTo(x0, y1); g.lineTo(x1, y1); g.stroke();
      for (let x = x0; x < x1; x += 70) { g.beginPath(); g.moveTo(x + 10, y0); g.lineTo(x + 10, y1); g.strokeStyle = mix(col, '#000000', .14); g.stroke(); g.fillStyle = mix(col, '#7a3f60', .35); g.beginPath(); g.ellipse(x + 45, (y0 + y1) / 2, 10, (y1 - y0) * .26, 0, 0, 6.2832); g.fill(); }
    };
    const capFill = (y0, y1, a, b) => { const gr = g.createLinearGradient(0, 0, 900, 0); gr.addColorStop(0, mix(a, '#ffffff', .72)); gr.addColorStop(1, mix(b, '#ffffff', .72)); g.fillStyle = gr; g.fillRect(0, y0, 900, y1 - y0); };
    const cellsRow = (y0, y1) => { for (let x = -20; x < 920; x += 120) { const cx = x + 60, cy = (y0 + y1) / 2; const gr = g.createRadialGradient(cx - 20, cy - 25, 8, cx, cy, 80); gr.addColorStop(0, '#fff0cc'); gr.addColorStop(1, C.cell); g.fillStyle = gr; g.beginPath(); g.roundRect ? g.roundRect(x + 4, y0 + 4, 112, y1 - y0 - 8, 26) : g.rect(x + 4, y0 + 4, 112, y1 - y0 - 8); g.fill(); g.strokeStyle = C.cellD; g.lineWidth = 1.5; g.stroke(); g.fillStyle = mix(C.nuc, '#ffffff', .25); g.beginPath(); g.ellipse(cx + 8, cy + (y0 < 200 ? -20 : 20), 20, 15, 0, 0, 6.2832); g.fill(); } };
    const draw = () => {
      S.begin(); const L = Y[kind];
      if (kind === 'lung') {
        /* 허파꽈리 속 공기 */
        const air = (y0, y1, up) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(up ? 0 : 1, '#fffaf8'); gr.addColorStop(up ? 1 : 0, '#fae6e0'); g.fillStyle = gr; g.fillRect(0, y0, 900, y1 - y0);
          g.strokeStyle = 'rgba(217,132,119,.28)'; g.lineWidth = 1.5; for (let k = 0; k < 3; k++) { g.beginPath(); const cx = 150 + k * 300, cy = up ? y0 - 40 : y1 + 40; g.ellipse(cx, cy, 150, y1 - y0 + 10, 0, up ? .15 : Math.PI + .15, up ? Math.PI - .15 : 2 * Math.PI - .15); g.stroke(); } };
        air(L.top[0], L.top[1], true); air(L.bot[0], L.bot[1], false);
        wallTex(L.wall[0], L.wall[1]); capFill(L.cap[0], L.cap[1], C.vei, C.art); wallTex(L.wall2[0], L.wall2[1]);
      } else {
        cellsRow(L.top[0], L.top[1]); wallTex(L.wall[0], L.wall[1], 0, 900, '#e2a094'); capFill(L.cap[0], L.cap[1], C.art, C.vei); wallTex(L.wall2[0], L.wall2[1], 0, 900, '#e2a094'); cellsRow(L.bot[0], L.bot[1]);
      }
      /* 적혈구 */
      rbcs.forEach((r, i) => { const tt = Math.max(0, Math.min(1, (r.x - 60) / 760)); const c = kind === 'lung' ? mix('#6a5cb8', '#d8392e', smooth(.05, .8, tt)) : mix('#d8392e', '#6a5cb8', smooth(.05, .85, tt)); rbc(g, r.x, (L.cap[0] + L.cap[1]) / 2 + Math.sin(i * 1.7 + r.x * .01) * 16, 30, c, .5); });
      PS.forEach((p) => { (p.type === 'o2' ? o2 : co2)(g, p.x, p.y, 1.25, p.a); });
      /* 글자 */
      if (kind === 'lung') { label(g, '허파꽈리 속 공기', 120, 62, { s: 17 }); label(g, '허파꽈리 속 공기', 120, L.bot[1] - 22, { s: 17 }); label(g, '한 겹의 얇은 세포층', 780, L.wall[0] - 14, { s: 14, w: 700 }); label(g, '모세혈관', 90, L.cap[0] + 22, { s: 17 }); label(g, '폐동맥 쪽에서', 90, L.cap[1] - 20, { s: 14, w: 700 }); label(g, '폐정맥 쪽으로', 810, L.cap[1] - 20, { s: 14, w: 700 }); }
      else { label(g, '조직세포', 90, 62, { s: 17 }); label(g, '모세혈관', 90, L.cap[0] + 22, { s: 17 }); label(g, '대동맥 쪽에서', 90, L.cap[1] - 20, { s: 14, w: 700 }); label(g, '대정맥 쪽으로', 810, L.cap[1] - 20, { s: 14, w: 700 }); label(g, '조직세포', 90, L.bot[1] - 22, { s: 17 }); }
    };
    reset();
    loop(host, (dt) => { step(REDUCE ? .016 : dt); draw(); }); draw();
    return {
      set(k) { kind = k; reset(); draw(); }, get kind() { return kind; },
      play(v) { run = v; }, get running() { return run; }, reset() { reset(); draw(); }, speed(v) { spd = v; },
      count, onTick(f) { onTick = f; }, get made() { return made; },
      warm(sec) { const r0 = run; run = true; for (let i = 0; i < sec * 30; i++) step(1 / 30); run = r0; draw(); },
    };
  }

  /* ===================== 닫힌 방과 환기 ===================== */
  function room(host) {
    const LW = 860, LH = 470, S = surface(host, LW, LH), g = S.g;
    let open = false, PS = [], t = 0;
    const PEOPLE = [[170, 330], [280, 345], [390, 330], [500, 345], [610, 330], [235, 395], [455, 395], [345, 400]];
    const reset = () => { PS = []; for (let i = 0; i < 60; i++) PS.push({ type: 'o2', x: rnd(60, 800), y: rnd(70, 300), vx: rnd(-30, 30), vy: rnd(-30, 30), a: rnd(0, 6) }); for (let i = 0; i < 4; i++) PS.push({ type: 'co2', x: rnd(60, 800), y: rnd(70, 300), vx: 0, vy: 0, a: 0 }); t = 0; };
    reset();
    let onTick = null;
    const step = (dt) => {
      t += dt;
      PS.forEach((p) => { p.vx += rnd(-1, 1) * 200 * dt; p.vy += rnd(-1, 1) * 200 * dt; p.vx *= .93; p.vy *= .93; p.x += p.vx * dt; p.y += p.vy * dt; p.a += dt * 2; if (p.y < 60) { p.y = 60; p.vy = Math.abs(p.vy); } if (p.y > 310) { p.y = 310; p.vy = -Math.abs(p.vy); } if (p.x < 50) { p.x = 50; p.vx = Math.abs(p.vx); } if (p.x > 810) { if (open && p.y > 90 && p.y < 260 && Math.random() < .5) p.gone = 1; else { p.x = 810; p.vx = -Math.abs(p.vx); } } });
      PS = PS.filter((p) => !p.gone);
      /* 사람이 숨을 쉬어 산소를 쓰고 이산화 탄소를 내보낸다 */
      if (Math.random() < dt * 2.6) { const near = PS.filter((p) => p.type === 'o2' && p.y > 220); if (near.length > 2) { const p = near[Math.floor(Math.random() * near.length)]; p.type = 'co2'; } }
      if (open && Math.random() < dt * 6) PS.push({ type: 'o2', x: 805, y: rnd(100, 250), vx: -60, vy: rnd(-20, 20), a: 0 });
      if (open && PS.length > 70) { const i = PS.findIndex((p) => p.type === 'co2' && p.x > 650); if (i >= 0) PS.splice(i, 1); }
      onTick && onTick({ o2: PS.filter((p) => p.type === 'o2').length, co2: PS.filter((p) => p.type === 'co2').length });
    };
    const person = (x, y, i) => {
      g.save(); g.translate(x, y);
      const sh = ['#3f6fa8', '#7a8a4a', '#b0644e', '#5f6f86', '#8a5d9c', '#4f8a86', '#a8794a', '#5c7aa8'][i % 8];
      g.fillStyle = 'rgba(20,38,59,.12)'; g.beginPath(); g.ellipse(0, 62, 34, 8, 0, 0, 6.2832); g.fill();
      const gb = g.createLinearGradient(-26, 0, 26, 0); gb.addColorStop(0, mix(sh, '#ffffff', .2)); gb.addColorStop(1, mix(sh, '#000000', .15)); g.fillStyle = gb; g.beginPath(); g.moveTo(-26, 60); g.quadraticCurveTo(-28, 10, 0, 8); g.quadraticCurveTo(28, 10, 26, 60); g.closePath(); g.fill();
      const gh = g.createRadialGradient(-5, -14, 2, 0, -8, 18); gh.addColorStop(0, '#f6d7bd'); gh.addColorStop(1, '#d9a983'); g.fillStyle = gh; g.beginPath(); g.arc(0, -8, 15, 0, 6.2832); g.fill();
      g.fillStyle = ['#2f2620', '#4a3527', '#1f1b18'][i % 3]; g.beginPath(); g.arc(0, -11, 15.5, Math.PI * 1.02, Math.PI * 1.98); g.fill();
      g.restore();
    };
    const draw = () => {
      S.begin();
      /* 방 */
      const gw = g.createLinearGradient(0, 40, 0, 330); gw.addColorStop(0, '#f6f2ea'); gw.addColorStop(1, '#ece5d8'); g.fillStyle = gw; g.fillRect(40, 40, 780, 300);
      const gf = g.createLinearGradient(0, 330, 0, 460); gf.addColorStop(0, '#d6c3a4'); gf.addColorStop(1, '#c4ad89'); g.fillStyle = gf; g.beginPath(); g.moveTo(40, 330); g.lineTo(820, 330); g.lineTo(850, 460); g.lineTo(10, 460); g.closePath(); g.fill();
      g.strokeStyle = '#b9ab95'; g.lineWidth = 2; g.strokeRect(40, 40, 780, 300);
      /* 창문 */
      g.fillStyle = open ? '#dff0fb' : '#cfe1ee'; g.fillRect(790, 90, 30, 170); g.strokeStyle = '#8a9aa8'; g.lineWidth = 3; g.strokeRect(790, 90, 30, 170);
      g.fillStyle = '#eef6fb'; if (open) { g.save(); g.translate(820, 90); g.transform(1, -.25, 0, 1, 0, 0); g.fillStyle = 'rgba(207,225,238,.9)'; g.fillRect(0, 0, 34, 170); g.strokeRect(0, 0, 34, 170); g.restore(); }
      PS.forEach((p) => { (p.type === 'o2' ? o2 : co2)(g, p.x, p.y, 1.05, p.a); });
      PEOPLE.forEach(([x, y], i) => person(x, y, i));
      label(g, open ? '창문 열림' : '창문 닫힘', 760, 70, { s: 15 });
    };
    loop(host, (dt) => { step(REDUCE ? .016 : dt); draw(); }); draw();
    return { set open(v) { open = v; }, get open() { return open; }, reset() { reset(); draw(); }, onTick(f) { onTick = f; } };
  }
  return { map, zoom, room, o2, co2, rbc, C };
})();
window.GX = GX;
