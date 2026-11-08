/* ===== 배설 2D 도구 UF =====
   waste: 그림 Ⅵ-15 형식(세포 → 암모니아 → 간에서 요소 → 콩팥 → 오줌)
   lab:   그림 Ⅵ-17 형식 오줌 생성 실험실(토리·보먼주머니·세뇨관·모세혈관, 여과·재흡수·분비를 켜고 끄기, 당뇨·단백뇨)
   icon:  물질 기호 SVG(부록 339쪽 붙임딱지와 같은 모양: 물 물방울, 요소 네모, 적혈구 원반, 단백질 오각형, 포도당 육각형)
   입자의 수·크기·빠르기와 여과·재흡수되는 비율은 잘 보이게 정한 모형이다. */
const UF = (() => {
  'use strict';
  const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const mix = (a, b, t) => { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const r = (pa >> 16) + (((pb >> 16) - (pa >> 16)) * t), g = ((pa >> 8) & 255) + ((((pb >> 8) & 255) - ((pa >> 8) & 255)) * t), bl = (pa & 255) + (((pb & 255) - (pa & 255)) * t); return `rgb(${r | 0},${g | 0},${bl | 0})`; };
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  /* 물질: 이름, 색, 크기 */
  const K = {
    rbc: { n: '적혈구', c: '#d23a2c', r: 11, big: true },
    pro: { n: '단백질', c: '#e0609a', r: 9.5, big: true },
    glu: { n: '포도당', c: '#8a5cc8', r: 8 },
    ami: { n: '아미노산', c: '#4f9a52', r: 6.5 },
    min: { n: '무기염류', c: '#7d93a8', r: 6.5 },
    wat: { n: '물', c: '#3d9be0', r: 7 },
    ure: { n: '요소', c: '#f08a1c', r: 7 },
    amm: { n: '암모니아', c: '#2fa39a', r: 7 },
  };
  const INK = '#14263b';

  function surface(host, LW, LH) {
    const cv = document.createElement('canvas'); cv.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y'; host.appendChild(cv);
    const g = cv.getContext('2d'); const S = { cv, g, k: 1, ox: 0, oy: 0, W: 1, H: 1, LW, LH };
    const fit = () => { const r = host.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); S.W = Math.max(1, r.width); S.H = Math.max(1, r.height); cv.width = S.W * d; cv.height = S.H * d; S.k = Math.min(S.W / S.LW, S.H / S.LH); S.ox = (S.W - S.LW * S.k) / 2; S.oy = (S.H - S.LH * S.k) / 2; S.d = d; };
    S.begin = () => { g.setTransform(S.d, 0, 0, S.d, 0, 0); g.clearRect(0, 0, S.W, S.H); g.setTransform(S.d * S.k, 0, 0, S.d * S.k, S.d * S.ox, S.d * S.oy); };
    S.toL = (x, y) => [(x - S.ox) / S.k, (y - S.oy) / S.k];
    try { new ResizeObserver(fit).observe(host); } catch (e) { addEventListener('resize', fit); } fit();
    return S;
  }
  function loop(host, fn) {
    let last = performance.now(), on = true;
    const vis = () => { const r = host.getBoundingClientRect(); if (document.hidden || r.bottom < 0 || r.top > (window.innerHeight || 800)) return false; try { const f = window.frameElement; if (f && f.hasAttribute('data-page') && !f.classList.contains('on')) return false; } catch (e) {} return true; };
    const tick = (now) => { requestAnimationFrame(tick); const dt = Math.min(.05, (now - last) / 1000); last = now; if (!on || !vis()) return; fn(window.__bakeDt !== undefined ? window.__bakeDt : dt); };
    requestAnimationFrame(tick); return { stop() { on = false; }, start() { on = true; } };
  }
  const label = (g, t, x, y, o = {}) => { g.font = `${o.w || 800} ${o.s || 17}px Pretendard, sans-serif`; g.textAlign = o.a || 'center'; g.textBaseline = 'middle'; if (o.bg !== false) { const w = g.measureText(t).width + 12; g.fillStyle = 'rgba(255,255,255,.9)'; const X = o.a === 'left' ? x - 6 : o.a === 'right' ? x - w + 6 : x - w / 2; g.beginPath(); g.roundRect ? g.roundRect(X, y - 12, w, 24, 6) : g.rect(X, y - 12, w, 24); g.fill(); } g.fillStyle = o.c || INK; g.fillText(t, x, y); };
  const lead = (g, x1, y1, x2, y2) => { g.strokeStyle = 'rgba(20,38,59,.75)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };

  /* ----- 물질 기호 (캔버스) ----- */
  const ballG = (g, x, y, r, c, hi = .4) => { const gr = g.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r); gr.addColorStop(0, mix(c, '#ffffff', hi)); gr.addColorStop(1, c); return gr; };
  const poly = (g, x, y, r, n, rot) => { g.beginPath(); for (let i = 0; i < n; i++) { const a = rot + i / n * Math.PI * 2 - Math.PI / 2; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); };
  function shape(g, k, x, y, s = 1, rot = 0, alpha = 1) {
    const d = K[k], r = d.r * s, c = d.c; g.globalAlpha = alpha; g.fillStyle = ballG(g, x, y, r * 1.1, c); g.strokeStyle = mix(c, '#000000', .35); g.lineWidth = 1.1;
    if (k === 'rbc') { g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, .62); g.beginPath(); g.arc(0, 0, r, 0, 6.2832); g.fill(); g.stroke(); g.fillStyle = mix(c, '#000000', .16); g.beginPath(); g.arc(r * .04, r * .06, r * .46, 0, 6.2832); g.fill(); g.restore(); }
    else if (k === 'pro') { poly(g, x, y, r, 5, rot); g.fill(); g.stroke(); }
    else if (k === 'glu') { poly(g, x, y, r, 6, rot); g.fill(); g.stroke(); }
    else if (k === 'ure') { g.save(); g.translate(x, y); g.rotate(rot * .3); g.beginPath(); g.rect(-r * .85, -r * .85, r * 1.7, r * 1.7); g.fill(); g.stroke(); g.restore(); }
    else if (k === 'min') { poly(g, x, y, r * 1.05, 4, 0); g.fill(); g.stroke(); }
    else if (k === 'amm') { poly(g, x, y, r * 1.1, 3, rot * .3); g.fill(); g.stroke(); }
    else if (k === 'wat') { g.beginPath(); g.moveTo(x, y - r * 1.25); g.bezierCurveTo(x + r * .9, y - r * .2, x + r * .95, y + r * .9, x, y + r * .95); g.bezierCurveTo(x - r * .95, y + r * .9, x - r * .9, y - r * .2, x, y - r * 1.25); g.fill(); g.stroke(); }
    else { g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); g.stroke(); }
    g.globalAlpha = 1;
  }
  /* ----- 물질 기호 (SVG 문자열, 범례·붙임딱지용) ----- */
  function icon(k, size = 22) {
    const d = K[k], c = d.c, s = mix(c, '#000000', .35), id = 'ug' + k + Math.random().toString(36).slice(2, 6);
    const gr = `<defs><radialGradient id="${id}" cx=".36" cy=".32" r=".8"><stop offset="0" stop-color="${mix(c, '#ffffff', .42)}"/><stop offset="1" stop-color="${c}"/></radialGradient></defs>`;
    const P = (n, r, rot = 0) => Array.from({ length: n }, (_, i) => { const a = rot + i / n * Math.PI * 2 - Math.PI / 2; return `${(12 + Math.cos(a) * r).toFixed(1)},${(12 + Math.sin(a) * r).toFixed(1)}`; }).join(' ');
    const body = k === 'rbc' ? `<ellipse cx="12" cy="12" rx="10" ry="6.6" fill="url(#${id})" stroke="${s}"/><ellipse cx="12.3" cy="12.4" rx="4.6" ry="3" fill="${mix(c, '#000000', .16)}"/>`
      : k === 'pro' ? `<polygon points="${P(5, 10)}" fill="url(#${id})" stroke="${s}"/>` : k === 'glu' ? `<polygon points="${P(6, 10)}" fill="url(#${id})" stroke="${s}"/>`
        : k === 'ure' ? `<rect x="4.5" y="4.5" width="15" height="15" rx="1.5" fill="url(#${id})" stroke="${s}"/>` : k === 'min' ? `<polygon points="${P(4, 9.5)}" fill="url(#${id})" stroke="${s}"/>`
          : k === 'amm' ? `<polygon points="${P(3, 10.5)}" fill="url(#${id})" stroke="${s}"/>` : k === 'wat' ? `<path d="M12 2.5C17 9 19.5 13 19.5 15.5A7.5 7.5 0 0 1 4.5 15.5C4.5 13 7 9 12 2.5Z" fill="url(#${id})" stroke="${s}"/>`
            : `<circle cx="12" cy="12" r="7.5" fill="url(#${id})" stroke="${s}"/>`;
    return `<svg class="uic" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${gr}${body}</svg>`;
  }

  /* 길: 점 목록을 매끈하게 하고 길이로 따라가기 */
  function path(pts, n = 240) {
    const P = []; const cat = (p0, p1, p2, p3, t) => { const t2 = t * t, t3 = t2 * t; return [.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), .5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]; };
    const m = pts.length - 1, per = Math.ceil(n / m);
    for (let i = 0; i < m; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(m, i + 2)]; for (let k = 0; k < per; k++) P.push(cat(p0, p1, p2, p3, k / per)); }
    P.push(pts[m]);
    const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const len = L[L.length - 1];
    const at = (u) => { const s = Math.max(0, Math.min(1, u)) * len; let a = 0, b = L.length - 1; while (b - a > 1) { const md = (a + b) >> 1; if (L[md] <= s) a = md; else b = md; } const t = (s - L[a]) / Math.max(1e-6, L[b] - L[a]); return [P[a][0] + (P[b][0] - P[a][0]) * t, P[a][1] + (P[b][1] - P[a][1]) * t]; };
    const yAt = (y) => { let best = 0, bd = 1e9; for (let i = 0; i < P.length; i++) { const d = Math.abs(P[i][1] - y); if (d < bd) { bd = d; best = i; } } return L[best] / len; };
    return { P, len, at, yAt };
  }
  const stroke = (g, P, w, c) => { g.lineWidth = w; g.strokeStyle = c; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); P.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); g.stroke(); };
  /* 관: 겉 벽 → 안쪽 → 가운데 밝은 줄(둥근 관처럼 보이게) */
  const pipe = (g, P, w, wall, lumen, hi) => { stroke(g, P, w + 5, mix(wall, '#000000', .25)); stroke(g, P, w, wall); stroke(g, P, w - 9, lumen); if (hi) { g.globalAlpha = .45; stroke(g, P.map(([x, y]) => [x - w * .12, y]), (w - 9) * .32, hi); g.globalAlpha = 1; } };

  /* ===================== 그림 Ⅵ-15: 단백질이 분해될 때 생기는 노폐물 ===================== */
  function waste(host, opt = {}) {
    const LW = 960, LH = 440, S = surface(host, LW, LH), g = S.g;
    const CELL = [170, 230], LIV = [500, 210], KID = [770, 220];
    const vA = path([[262, 236], [330, 226], [400, 214], [452, 212]]);
    const vB = path([[560, 214], [620, 206], [680, 208], [726, 214]]);
    const vU = path([[792, 268], [800, 310], [806, 350], [812, 400]]);
    const P = [];
    let acc = 0, T = 0;
    const spawn = () => {
      /* 단백질 + 산소가 세포로 */
      P.push({ k: 'pro', st: 'in', x: rnd(-20, 10), y: CELL[1] + rnd(-30, 30), vx: rnd(70, 95), t: 0 });
    };
    const out = (x, y) => {
      const r = Math.random();
      P.push({ k: 'co2', st: 'up', x, y, vx: rnd(-25, 10), vy: rnd(-70, -50), t: 0 });
      P.push({ k: 'wat', st: 'down', x, y, vx: rnd(-20, 20), vy: rnd(45, 65), t: 0 });
      P.push({ k: 'amm', st: 'a', u: 0, x, y, sp: rnd(.32, .4), t: 0, off: rnd(-5, 5) });
      P.push({ k: 'en', st: 'en', x: x + rnd(-20, 20), y: y + rnd(-14, 14), t: 0 });
      void r;
    };
    const drawCell = () => {
      const [cx, cy] = CELL;
      g.save(); g.shadowColor = 'rgba(20,38,59,.18)'; g.shadowBlur = 14; g.shadowOffsetY = 6;
      g.beginPath(); g.ellipse(cx, cy, 98, 80, -.12, 0, 6.2832); const gr = g.createRadialGradient(cx - 30, cy - 34, 8, cx, cy, 104); gr.addColorStop(0, '#fdf1dc'); gr.addColorStop(1, '#efc98c'); g.fillStyle = gr; g.fill(); g.restore();
      g.lineWidth = 2.5; g.strokeStyle = '#c99a52'; g.beginPath(); g.ellipse(cx, cy, 98, 80, -.12, 0, 6.2832); g.stroke();
      /* 세포 속 작은 알갱이 */
      g.fillStyle = 'rgba(176,128,60,.22)'; [[-50, 30], [-30, -40], [40, 40], [60, -20], [10, 52], [-62, -6]].forEach(([dx, dy]) => { g.beginPath(); g.ellipse(cx + dx, cy + dy, 9, 5, dx * .02, 0, 6.2832); g.fill(); });
      const ng = g.createRadialGradient(cx - 26, cy - 8, 3, cx - 20, cy, 28); ng.addColorStop(0, '#c9a6d6'); ng.addColorStop(1, '#8c62a3'); g.fillStyle = ng; g.beginPath(); g.ellipse(cx - 20, cy + 2, 27, 23, .2, 0, 6.2832); g.fill(); g.strokeStyle = '#6e4785'; g.lineWidth = 1.5; g.stroke();
    };
    const drawLiver = () => {
      const [x, y] = LIV;
      g.save(); g.translate(x, y); g.shadowColor = 'rgba(20,38,59,.2)'; g.shadowBlur = 14; g.shadowOffsetY = 6;
      g.beginPath(); g.moveTo(-70, -28); g.bezierCurveTo(-40, -62, 40, -66, 76, -40); g.bezierCurveTo(96, -26, 80, 0, 50, 18); g.bezierCurveTo(20, 36, -10, 48, -40, 36); g.bezierCurveTo(-72, 24, -86, -8, -70, -28); g.closePath();
      const gr = g.createLinearGradient(-60, -60, 40, 50); gr.addColorStop(0, '#b25a45'); gr.addColorStop(1, '#7a2f24'); g.fillStyle = gr; g.fill(); g.restore();
      g.save(); g.translate(x, y); g.strokeStyle = 'rgba(70,20,14,.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-70, -28); g.bezierCurveTo(-40, -62, 40, -66, 76, -40); g.bezierCurveTo(96, -26, 80, 0, 50, 18); g.bezierCurveTo(20, 36, -10, 48, -40, 36); g.bezierCurveTo(-72, 24, -86, -8, -70, -28); g.stroke();
      g.strokeStyle = 'rgba(255,220,200,.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-40, -40); g.quadraticCurveTo(0, -54, 50, -42); g.stroke();
      g.strokeStyle = 'rgba(70,20,14,.45)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(5, -54); g.quadraticCurveTo(0, -10, -8, 40); g.stroke(); g.restore();
    };
    const drawKidney = () => {
      const [x, y] = KID;
      g.save(); g.translate(x, y); g.shadowColor = 'rgba(20,38,59,.2)'; g.shadowBlur = 14; g.shadowOffsetY = 6;
      g.beginPath(); g.moveTo(-6, -58); g.bezierCurveTo(40, -66, 58, -20, 52, 12); g.bezierCurveTo(46, 50, 10, 70, -14, 54); g.bezierCurveTo(-30, 44, -26, 22, -36, 12); g.bezierCurveTo(-48, 0, -38, -22, -30, -34); g.bezierCurveTo(-24, -48, -18, -56, -6, -58); g.closePath();
      const gr = g.createLinearGradient(-30, -60, 40, 60); gr.addColorStop(0, '#cf6a5c'); gr.addColorStop(1, '#93372f'); g.fillStyle = gr; g.fill(); g.restore();
      g.save(); g.translate(x, y); g.strokeStyle = 'rgba(90,24,18,.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-6, -58); g.bezierCurveTo(40, -66, 58, -20, 52, 12); g.bezierCurveTo(46, 50, 10, 70, -14, 54); g.bezierCurveTo(-30, 44, -26, 22, -36, 12); g.bezierCurveTo(-48, 0, -38, -22, -30, -34); g.bezierCurveTo(-24, -48, -18, -56, -6, -58); g.stroke();
      g.strokeStyle = 'rgba(255,225,210,.3)'; g.lineWidth = 3; g.beginPath(); g.moveTo(8, -48); g.quadraticCurveTo(40, -36, 42, 0); g.stroke(); g.restore();
    };
    const vessel = (pp) => { pipe(g, pp.P, 18, '#d98a80', '#f6d4ce', null); };
    const draw = () => {
      S.begin(); g.fillStyle = '#ffffff'; g.fillRect(-200, -100, LW + 400, LH + 200);
      vessel(vA); vessel(vB); pipe(g, vU.P, 16, '#d9bf6a', '#fbefc4', null);
      drawCell(); drawLiver(); drawKidney();
      /* 들어오는 쪽: 단백질 + 산소 */
      label(g, '단백질 + 산소', 70, 120, { s: 17 }); g.strokeStyle = 'rgba(20,38,59,.6)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(40, 140); g.quadraticCurveTo(60, 180, 84, 200); g.stroke();
      P.forEach((p) => {
        if (p.k === 'en') { const a = 1 - p.t / .9; if (a <= 0) return; g.strokeStyle = `rgba(232,170,30,${a})`; g.lineWidth = 2.4; g.beginPath(); g.moveTo(p.x, p.y - 8); g.lineTo(p.x + 4, p.y - 1); g.lineTo(p.x - 3, p.y + 1); g.lineTo(p.x + 2, p.y + 9); g.stroke(); return; }
        if (p.k === 'co2') { const a = Math.min(1, (1.6 - p.t) * 2); if (a <= 0) return; g.globalAlpha = a; [[-7, 0, '#e23b2e', 4.2], [7, 0, '#e23b2e', 4.2], [0, 0, '#3b4048', 5.2]].forEach(([dx, dy, c, r]) => { g.fillStyle = ballG(g, p.x + dx, p.y + dy, r, c, .3); g.beginPath(); g.arc(p.x + dx, p.y + dy, r, 0, 6.2832); g.fill(); }); g.globalAlpha = 1; return; }
        if (p.k === 'o2') return;
        const a = p.st === 'down' ? Math.min(1, (1.4 - p.t) * 2) : p.st === 'uri' ? Math.min(1, (1 - p.u) * 6) : 1; if (a <= 0) return;
        shape(g, p.k, p.x, p.y, p.k === 'pro' ? 1.15 : 1.05, p.t * 1.4, a);
        if (p.k === 'pro' && p.st === 'in') { const ox = p.x + 13, oy = p.y - 8; [[-4.2, 0], [4.2, 0]].forEach(([dx]) => { g.fillStyle = ballG(g, ox + dx, oy, 4.6, '#e23b2e', .35); g.beginPath(); g.arc(ox + dx, oy, 4.6, 0, 6.2832); g.fill(); }); }
      });
      /* 이름표 */
      label(g, '세포', CELL[0] - 20, CELL[1] + 104, { s: 19 });
      label(g, '간', LIV[0], LIV[1] + 78, { s: 19 });
      label(g, '콩팥', KID[0] + 6, KID[1] + 88, { s: 19 });
      label(g, '이산화 탄소', 238, 92, { s: 15.5, w: 700 }); label(g, '물', 236, 372, { s: 15.5, w: 700 }); label(g, '에너지', 100, 330, { s: 15.5, w: 700, c: '#9a6a08' });
      label(g, '암모니아', 366, 170, { s: 15.5, w: 800, c: '#1f7a72' }); label(g, '독성이 강함', 366, 270, { s: 13.5, w: 700, c: '#5a6b7e' });
      label(g, '요소', 640, 168, { s: 15.5, w: 800, c: '#b25e08' }); label(g, '독성이 약함', 640, 262, { s: 13.5, w: 700, c: '#5a6b7e' });
      label(g, '오줌', 860, 392, { s: 17, c: '#8a6a08' });
    };
    const step = (dt) => {
      T += dt; acc += dt * 1.15; if (acc > 1) { acc = 0; spawn(); }
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i]; p.t += dt;
        if (p.st === 'in') { p.x += p.vx * dt; p.y += (CELL[1] - p.y) * dt * .8; if (p.x > CELL[0] - 20) { P.splice(i, 1); out(CELL[0] + rnd(-10, 30), CELL[1] + rnd(-20, 20)); } continue; }
        if (p.st === 'up') { p.x += p.vx * dt; p.y += p.vy * dt; if (p.t > 1.6) P.splice(i, 1); continue; }
        if (p.st === 'down') { p.x += p.vx * dt; p.y += p.vy * dt; if (p.t > 1.4) P.splice(i, 1); continue; }
        if (p.st === 'en') { if (p.t > .9) P.splice(i, 1); continue; }
        if (p.st === 'a') { /* 세포 밖으로 나와 혈관을 따라 간으로 */ if (p.t < .5) { const q = vA.at(0); p.x += (q[0] - p.x) * dt * 3; p.y += (q[1] + p.off - p.y) * dt * 3; continue; } p.u += dt * p.sp; const q = vA.at(p.u); p.x = q[0]; p.y = q[1] + p.off; if (p.u >= 1) { p.st = 'liv'; p.t = 0; } continue; }
        if (p.st === 'liv') { /* 간 속을 지나며 요소로 */ p.x += 120 * dt; p.y = LIV[1] + Math.sin(p.t * 5 + p.off) * 10; if (p.t > .45 && p.k === 'amm') p.k = 'ure'; if (p.x >= vB.at(0)[0]) { p.st = 'b'; p.u = 0; } continue; }
        if (p.st === 'b') { p.u += dt * .45; const q = vB.at(p.u); p.x = q[0]; p.y = q[1] + p.off; if (p.u >= 1) { p.st = 'kid'; p.t = 0; } continue; }
        if (p.st === 'kid') { const tx = KID[0] + 22, ty = KID[1] + 48; p.x += (tx - p.x) * dt * 3; p.y += (ty - p.y) * dt * 3; if (p.t > .7) { p.st = 'uri'; p.u = 0; p.k = 'ure'; } continue; }
        if (p.st === 'uri') { p.u += dt * .7; const q = vU.at(p.u); p.x = q[0] + p.off * .4; p.y = q[1]; if (p.u >= 1) P.splice(i, 1); continue; }
      }
    };
    /* 처음부터 흐르는 모습으로 */
    for (let i = 0; i < 260; i++) step(1 / 30);
    loop(host, (dt) => { if (!REDUCE) step(dt); draw(); });
    draw();
    return { S };
  }

  /* ===================== 그림 Ⅵ-17: 오줌 생성 실험실 ===================== */
  function lab(host, opt = {}) {
    const LW = 900, LH = 780, S = surface(host, LW, LH), g = S.g;
    const G = [292, 168]; // 토리 가운데
    const ART = path([[-30, 96], [70, 92], [160, 98], [228, 128], [262, 152], [G[0], G[1]]]);
    const GLO = path([[G[0], G[1]], [G[0] - 30, G[1] - 6], [G[0] - 14, G[1] + 26], [G[0] + 20, G[1] + 10], [G[0] - 4, G[1] - 24], [G[0] + 28, G[1] - 18], [G[0] + 34, G[1] - 40]], 120);
    const EFF = path([[G[0] + 34, G[1] - 40], [G[0] + 60, G[1] - 86], [400, 70], [470, 72], [520, 104], [532, 160]]);
    const CAPX = 532, TUBX = 300, TOP = 160, BOT = 640;
    const CAP = path([[CAPX, TOP], [CAPX, 300], [CAPX, 460], [CAPX, BOT], [CAPX + 8, 690], [CAPX + 60, 720], [CAPX + 160, 724], [940, 724]]);
    const TUB = path([[TUBX, 262], [TUBX, 380], [TUBX, 520], [TUBX, BOT], [TUBX - 4, 690], [TUBX - 22, 726], [TUBX - 60, 760], [TUBX - 120, 800]]);
    const ON = { filt: false, reab: false, secr: false };
    let sick = null, focus = null, acc = 0, rate = 1;
    const P = [];
    const tally = { art: {}, fil: {}, uri: {}, vei: {} };
    const seen = { art: {}, fil: {}, uri: {}, vei: {} };
    const note = (z, k) => { tally[z][k] = (tally[z][k] || 0) + 1; seen[z][k] = performance.now(); };
    const MIX = [['rbc', .2], ['pro', .1], ['glu', .13], ['ami', .1], ['min', .1], ['wat', .22], ['ure', .15]];
    const pick = () => { let r = Math.random(); for (const [k, w] of MIX) { r -= w; if (r <= 0) return k; } return 'wat'; };
    const spawn = () => { const k = pick(); P.push({ k, z: 'art', u: 0, sp: rnd(.85, 1.15), off: rnd(-8, 8), rot: rnd(0, 6), x: 0, y: 0 }); note('art', k); };
    /* 비율 */
    const filtP = (k) => (K[k].big ? (k === 'pro' && sick === 'pro' ? .55 : 0) : k === 'wat' ? .6 : k === 'ure' ? .7 : .72);
    const reabP = (k) => (k === 'glu' ? (sick === 'glu' ? .35 : 1) : k === 'ami' ? 1 : k === 'wat' ? .86 : k === 'min' ? .8 : 0);
    const hop = (p, from, to, z) => { p.z = 'hop'; p.h = { a: [p.x, p.y], b: to, t: 0, next: z, nu: p.nextU }; void from; };
    const step = (dt) => {
      acc += dt * 5.2 * rate; while (acc > 1) { acc -= 1; spawn(); }
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i]; p.rot += dt * .8;
        if (p.z === 'hop') { p.h.t += dt * 1.25; const t = Math.min(1, p.h.t), e = t * t * (3 - 2 * t); p.x = p.h.a[0] + (p.h.b[0] - p.h.a[0]) * e; p.y = p.h.a[1] + (p.h.b[1] - p.h.a[1]) * e - Math.sin(t * Math.PI) * 8; if (t >= 1) { p.z = p.h.next; p.u = p.h.nu; if (p.z === 'tub' && !p.counted) { p.counted = true; } } continue; }
        const pp = p.z === 'art' ? ART : p.z === 'glo' ? GLO : p.z === 'eff' ? EFF : p.z === 'cap' ? CAP : TUB;
        const v = p.z === 'tub' ? 44 : p.z === 'glo' ? 60 : 110;
        p.u += dt * v * p.sp / pp.len;
        const q = pp.at(p.u); const side = p.z === 'tub' || p.z === 'cap' ? p.off : p.off * .6;
        p.x = q[0] + (p.z === 'tub' || p.z === 'cap' ? side : 0); p.y = q[1] + (p.z === 'tub' || p.z === 'cap' ? 0 : side);
        if (p.z === 'glo' && p.decided === undefined && p.u > .45) {
          p.decided = ON.filt && Math.random() < filtP(p.k);
          if (p.decided) { const ty = 232 + rnd(0, 10); note('fil', p.k); p.nextU = 0; hop(p, null, [TUBX + rnd(-12, 12), ty], 'tub'); p.tubOff = p.off; continue; }
        }
        if (p.z === 'tub' && p.rb === undefined) { p.rb = ON.reab && Math.random() < reabP(p.k) ? rnd(.08, .62) : -1; }
        if (p.z === 'tub' && p.rb > 0 && p.u >= p.rb) { const y = p.y; p.nextU = CAP.yAt(y); hop(p, null, [CAPX + rnd(-10, 10), y + 10], 'cap'); p.rb = -2; p.mark = 'reab'; continue; }
        if (p.z === 'cap' && p.k === 'ure' && p.sc === undefined) { p.sc = ON.secr && !p.fromTub && p.mark !== 'reab' ? rnd(.25, .62) : -1; }
        if (p.z === 'cap' && p.sc > 0 && p.u >= p.sc && p.y < BOT - 20) { const y = p.y; p.nextU = TUB.yAt(y); p.rb = -1; hop(p, null, [TUBX + rnd(-10, 10), y + 12], 'tub'); p.sc = -2; p.mark = 'secr'; continue; }
        if (p.u >= 1) {
          if (p.z === 'art') { p.z = 'glo'; p.u = 0; }
          else if (p.z === 'glo') { p.z = 'eff'; p.u = 0; }
          else if (p.z === 'eff') { p.z = 'cap'; p.u = 0; }
          else if (p.z === 'cap') { note('vei', p.k); P.splice(i, 1); }
          else if (p.z === 'tub') { note('uri', p.k); P.splice(i, 1); }
        }
      }
    };
    /* ----- 그리기 ----- */
    const bg = document.createElement('canvas'); let bgK = 0;
    const drawStatic = () => {
      const d = S.d * S.k; bg.width = Math.ceil(LW * d); bg.height = Math.ceil(LH * d); const b = bg.getContext('2d'); b.setTransform(d, 0, 0, d, 0, 0); bgK = d;
      b.fillStyle = '#fff'; b.fillRect(0, 0, LW, LH);
      /* 모세혈관(위 붉은색 → 아래 푸른색) */
      const capW = 54;
      const cg = b.createLinearGradient(0, TOP, 0, 730); cg.addColorStop(0, '#d9473b'); cg.addColorStop(.55, '#c6475a'); cg.addColorStop(1, '#5a6fb8');
      const lg = b.createLinearGradient(0, TOP, 0, 730); lg.addColorStop(0, '#f6c2ba'); lg.addColorStop(.55, '#efbfc8'); lg.addColorStop(1, '#c6d0ee');
      const thick = (P, w, c) => { b.lineWidth = w; b.strokeStyle = c; b.lineCap = 'round'; b.lineJoin = 'round'; b.beginPath(); P.forEach((p, i) => b[i ? 'lineTo' : 'moveTo'](p[0], p[1])); b.stroke(); };
      thick(EFF.P, 30, '#a8382e'); thick(EFF.P, 22, '#f1b3aa');
      thick(CAP.P, capW + 5, '#7c3a45'); thick(CAP.P, capW, cg); thick(CAP.P, capW - 10, lg);
      b.globalAlpha = .35; thick(CAP.P.map(([x, y]) => [x - 8, y]), 8, '#ffffff'); b.globalAlpha = 1;
      thick(ART.P, 36, '#8f2c24'); thick(ART.P, 30, '#d9473b'); thick(ART.P, 20, '#f4beb6');
      /* 세뇨관 */
      const tubW = 62;
      thick(TUB.P, tubW + 5, '#a3863c'); thick(TUB.P, tubW, '#e5c66e'); thick(TUB.P, tubW - 12, '#fbf0c8');
      b.globalAlpha = .5; thick(TUB.P.map(([x, y]) => [x - 10, y]), 9, '#ffffff'); b.globalAlpha = 1;
      /* 보먼주머니: 위가 열린 둥근 그릇, 아래가 세뇨관으로 이어진다 */
      b.save(); b.translate(G[0], G[1]);
      const cup = new Path2D('M-92 -30C-100 30 -70 82 -26 96L-26 110L26 110L26 96C70 82 100 30 92 -30L76 -30C80 22 58 64 0 74C-58 64 -80 22 -76 -30Z');
      b.shadowColor = 'rgba(20,38,59,.18)'; b.shadowBlur = 10; b.shadowOffsetY = 4; const cgd = b.createLinearGradient(-90, 0, 90, 0); cgd.addColorStop(0, '#d9b65a'); cgd.addColorStop(.45, '#f4dc92'); cgd.addColorStop(1, '#c9a24a'); b.fillStyle = cgd; b.fill(cup); b.shadowColor = 'transparent';
      b.strokeStyle = '#9c7d2e'; b.lineWidth = 1.5; b.stroke(cup);
      const inner = new Path2D('M-76 -30C-80 22 -58 64 0 74C58 64 80 22 76 -30Z'); b.fillStyle = 'rgba(251,240,200,.92)'; b.fill(inner);
      b.restore();
      /* 토리: 실처럼 뭉친 모세혈관 */
      b.save(); b.translate(G[0], G[1] - 4);
      let sd = 11; const R = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      for (let i = 0; i < 34; i++) { const a = R() * 6.28, r = 12 + R() * 34, x = Math.cos(a) * r, y = Math.sin(a) * r * .8, a2 = a + 1 + R() * 2, r2 = 10 + R() * 36; const x2 = Math.cos(a2) * r2, y2 = Math.sin(a2) * r2 * .8; b.lineCap = 'round'; b.strokeStyle = '#8f2c24'; b.lineWidth = 10; b.beginPath(); b.moveTo(x, y); b.quadraticCurveTo((x + x2) / 2 + (R() - .5) * 30, (y + y2) / 2 + (R() - .5) * 30, x2, y2); b.stroke(); b.strokeStyle = i % 3 ? '#d9473b' : '#e8665a'; b.lineWidth = 7; b.stroke(); b.strokeStyle = 'rgba(255,210,200,.55)'; b.lineWidth = 2; b.stroke(); }
      b.restore();
      /* 오줌, 콩팥정맥 끝 */
      b.font = '800 17px Pretendard, sans-serif'; b.textAlign = 'left'; b.textBaseline = 'middle';
    };
    let staticFor = 0;
    const ARW = { filt: [[G[0] - 44, G[1] + 14], [G[0] - 44, G[1] + 72]], reab: [[TUBX + 40, 400], [CAPX - 34, 400]], secr: [[CAPX - 34, 560], [TUBX + 40, 560]] };
    const arrow = (a, b) => { g.strokeStyle = '#0e63b3'; g.fillStyle = '#0e63b3'; g.lineWidth = 3.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); const an = Math.atan2(b[1] - a[1], b[0] - a[0]); g.beginPath(); g.moveTo(b[0] + Math.cos(an) * 6, b[1] + Math.sin(an) * 6); g.lineTo(b[0] + Math.cos(an + 2.5) * 14, b[1] + Math.sin(an + 2.5) * 14); g.lineTo(b[0] + Math.cos(an - 2.5) * 14, b[1] + Math.sin(an - 2.5) * 14); g.closePath(); g.fill(); };
    const draw = () => {
      if (staticFor !== S.d * S.k) { staticFor = S.d * S.k; drawStatic(); }
      S.begin(); g.drawImage(bg, 0, 0, bg.width / bgK, bg.height / bgK);
      P.forEach((p) => { shape(g, p.k, p.x, p.y, 1, p.rot); });
      if (focus && ARW[focus]) arrow(...ARW[focus]);
      /* 이름표 */
      label(g, '콩팥동맥에서', 70, 62, { s: 16 }); label(g, '토리', G[0] + 108, G[1] + 6, { s: 18, a: 'left' }); lead(g, G[0] + 102, G[1] + 6, G[0] + 30, G[1]);
      label(g, '보먼주머니', G[0] - 118, G[1] + 92, { s: 18, a: 'right' }); lead(g, G[0] - 112, G[1] + 92, G[0] - 70, G[1] + 70);
      label(g, '세뇨관', TUBX - 50, 470, { s: 18, a: 'right' }); lead(g, TUBX - 44, 470, TUBX - 30, 470);
      label(g, '모세혈관', CAPX + 50, 320, { s: 18, a: 'left' }); lead(g, CAPX + 44, 320, CAPX + 26, 320);
      label(g, '콩팥정맥으로', 820, 690, { s: 16 }); label(g, '오줌', 190, 760, { s: 18, c: '#8a6a08' });
      if (focus === 'filt') label(g, '여과', G[0] - 64, G[1] + 112, { s: 18, c: '#0b3f73' });
      if (focus === 'reab') label(g, '재흡수', (TUBX + CAPX) / 2, 376, { s: 18, c: '#0b3f73' });
      if (focus === 'secr') label(g, '분비', (TUBX + CAPX) / 2, 536, { s: 18, c: '#0b3f73' });
    };
    /* 처음 모습 */
    const warm = (n = 300) => { for (let i = 0; i < n; i++) step(1 / 30); };
    warm(240);
    loop(host, (dt) => { if (!REDUCE || true) step(REDUCE ? dt * .5 : dt); draw(); });
    draw();
    const present = (z, k, ms = 4500) => !!seen[z][k] && performance.now() - seen[z][k] < ms;
    const api = {};
    Object.defineProperties(api, Object.getOwnPropertyDescriptors({
      S, K,
      set(o) { Object.assign(ON, o); },
      get on() { return Object.assign({}, ON); },
      set sick(v) { sick = v; }, get sick() { return sick; },
      set focus(v) { focus = v; }, get focus() { return focus; },
      set rate(v) { rate = v; },
      present, tally,
      reset() { P.length = 0; ['art', 'fil', 'uri', 'vei'].forEach((z) => { tally[z] = {}; seen[z] = {}; }); },
      warm,
    }));
    return api;
  }
  return { waste, lab, icon, shape, K, surface, loop, label };
})();
window.UF = UF;
