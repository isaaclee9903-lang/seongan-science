/* ===== 읽기 페이지 그림 RDF =====
   RDF.membrane: 그림 Ⅵ-2 형식. 구멍이 있는 세포막 앞에서 큰 녹말 사슬은 막히고, 작은 포도당은 통과한다(모형).
   RDF.steps: 그림 Ⅵ-4 형식. 입·위·작은창자에서 영양소가 소화효소에 의해 작게 분해되는 줄 그림(SVG). */
const RDF = (() => {
  'use strict';
  const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const hexPts = (x, y, r) => Array.from({ length: 6 }, (_, a) => { const t = a * Math.PI / 3 + Math.PI / 6; return `${(x + Math.cos(t) * r).toFixed(1)},${(y + Math.sin(t) * r).toFixed(1)}`; }).join(' ');
  function membrane(host) {
    const cv = document.createElement('canvas'); cv.style.cssText = 'width:100%;height:100%;display:block'; host.appendChild(cv);
    const g = cv.getContext('2d'); const VW = 720, VH = 300; let W, H, s, ox, oy, dpr;
    const rs = () => { const r = host.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(2, devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr; s = Math.min(W / VW, H / VH); ox = (W - VW * s) / 2; oy = (H - VH * s) / 2; };
    try { new ResizeObserver(rs).observe(host); } catch (e) { addEventListener('resize', rs); } rs();
    const MX = 400;
    const glu = Array.from({ length: 10 }, (_, i) => ({ x: 60 + i * 30, y: 60 + (i * 53) % 180, vx: 40 + (i % 3) * 12, vy: ((i * 37) % 30) - 15, ph: i }));
    const ch = Array.from({ length: 3 }, (_, i) => ({ x: 120 + i * 70, y: 70 + i * 80, vx: 30, w: i }));
    let last = performance.now();
    const hex = (x, y, r, f, sk) => { g.beginPath(); for (let a = 0; a < 6; a++) { const t = a * Math.PI / 3 + Math.PI / 6; g.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r); } g.closePath(); g.fillStyle = f; g.fill(); g.strokeStyle = sk; g.lineWidth = 1.2; g.stroke(); };
    function frame(now) {
      const dt = Math.min(.05, (now - last) / 1000) * (REDUCE ? 0 : 1); last = now;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); g.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
      /* 세포 안쪽 */
      const gi = g.createLinearGradient(MX, 0, VW, 0); gi.addColorStop(0, '#fbe9e4'); gi.addColorStop(1, '#fdf5f2'); g.fillStyle = gi; g.fillRect(MX, 0, VW - MX, VH);
      /* 세포막: 구멍 난 격자를 비스듬히 */
      for (let y = 10; y < VH; y += 26) { const sk = g.createLinearGradient(MX - 12, 0, MX + 12, 0); sk.addColorStop(0, '#9aa6b4'); sk.addColorStop(.5, '#d9dfe6'); sk.addColorStop(1, '#8794a3'); g.fillStyle = sk; g.beginPath(); g.roundRect(MX - 12, y, 24, 14, 3); g.fill(); }
      glu.forEach((p) => { p.x += p.vx * dt; p.y += Math.sin(now / 600 + p.ph) * 12 * dt; if (p.x > VW - 20) { p.x = 20; } const gap = Math.abs(((p.y - 10) % 26) - 19) < 6; if (p.x > MX - 18 && p.x < MX - 10 && !gap) { p.y = 10 + Math.round((p.y - 10) / 26) * 26 + 19; } hex(p.x, p.y, 7, '#c3cdf5', '#6c7bc8'); });
      ch.forEach((c, k) => { c.x += c.vx * dt; if (c.x > MX - 70) { c.x = MX - 70; c.vx = -Math.abs(c.vx); } if (c.x < 60) c.vx = Math.abs(c.vx); for (let j = 0; j < 7; j++) hex(c.x - j * 13 * Math.cos(.4 + k * .2) + 40, c.y + j * 8 * Math.sin(.6 + k) + Math.sin(now / 500 + j) * 3, 7, '#8e9de0', '#4f5bb0'); });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    const lab = (t, x, y) => { const e = document.createElement('div'); e.className = 'flab'; e.textContent = t; e.style.left = (x / VW * 100) + '%'; e.style.top = (y / VH * 100) + '%'; host.appendChild(e); };
    host.style.position = 'relative'; lab('녹말', 150, 22); lab('세포막', MX, 286); lab('포도당', 600, 22); lab('세포 안', 640, 270);
  }
  /* 그림 Ⅵ-4 줄 그림 */
  function steps(host) {
    const B = ['#e05a52', '#4caf6a', '#4a86d0', '#f2c444', '#a26ad0', '#ef8fb6'];
    const chain = (x, y, n, gap = 15) => Array.from({ length: n }, (_, j) => `<polygon points="${hexPts(x + j * gap, y + Math.sin(j * .9) * 5, 8)}" fill="${n > 2 ? '#8e9de0' : n === 2 ? '#a9b8ee' : '#c3cdf5'}" stroke="#4f5bb0" stroke-width="1"/>`).join('');
    const beads = (x, y, cols, gap = 15) => `<polyline points="${cols.map((c, j) => `${x + j * gap},${y + Math.sin(j * 1.1) * 6}`).join(' ')}" fill="none" stroke="#7a8796" stroke-width="2"/>` + cols.map((c, j) => `<circle cx="${x + j * gap}" cy="${y + Math.sin(j * 1.1) * 6}" r="6.5" fill="${c}" stroke="rgba(20,38,59,.25)"/>`).join('');
    const comb = (x, y, k = 3) => `<rect x="${x - 12}" y="${y - 4}" width="24" height="8" rx="3" fill="#f3e3b0" stroke="#b8954a"/>` + Array.from({ length: k }, (_, j) => `<rect x="${x - 10 + j * 8}" y="${y + 4}" width="4.4" height="18" rx="2" fill="#f2c94c" stroke="#b8954a"/>`).join('');
    const stick = (x, y, a) => `<g transform="translate(${x},${y}) rotate(${a})"><rect x="-2.2" y="-10" width="4.4" height="20" rx="2" fill="#f2c94c" stroke="#b8954a"/></g>`;
    const arrow = (x, y, t, c) => `<line x1="${x}" y1="${y}" x2="${x + 70}" y2="${y}" stroke="#5a6b7e" stroke-width="1.6"/><path d="M${x + 70},${y - 5} L${x + 78},${y} L${x + 70},${y + 5}" fill="#5a6b7e"/><text x="${x + 39}" y="${y - 10}" text-anchor="middle" font-size="13" font-weight="800" fill="${c}">${t}</text>`;
    const lbl = (x, y, t) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="13" font-weight="700" fill="#34495e">${t}</text>`;
    const row = (y, title, sub, body) => `<g><rect x="0" y="${y}" width="760" height="${sub}" rx="14" fill="#f7f9fb" stroke="#e3eaf0"/><text x="18" y="${y + 26}" font-size="16" font-weight="900" fill="#14263b">${title}</text>${body}</g>`;
    const p1 = B.concat(B.slice(0, 4)), p2 = [B[0], B[2], B[3]];
    const svg = `<svg viewBox="0 0 760 520" width="100%" style="display:block;font-family:Pretendard,sans-serif">
      ${row(0, '입', 110, chain(120, 62, 9) + lbl(180, 98, '녹말') + arrow(275, 62, '아밀레이스', '#3f8a52') + chain(380, 52, 2) + chain(430, 70, 2) + chain(480, 54, 2) + chain(530, 72, 2) + lbl(470, 98, '엿당'))}
      ${row(124, '위', 110, beads(120, 188, p1) + lbl(185, 222, '단백질') + arrow(275, 186, '펩신', '#c4567a') + beads(380, 178, [B[1], B[4], B[0]]) + beads(450, 196, [B[2], B[5], B[3]]) + beads(520, 180, [B[0], B[1], B[2], B[4]]) + lbl(470, 222, '작게 분해된 단백질'))}
      ${row(248, '작은창자', 272,
        chain(120, 300, 2) + chain(160, 312, 2) + lbl(150, 334, '녹말·엿당') + arrow(275, 304, '아밀레이스 · 탄수화물 소화효소', '#2f8a92') + [0, 1, 2, 3, 4].map((j) => `<polygon points="${hexPts(395 + j * 30, 300 + (j % 2) * 12, 8)}" fill="#c3cdf5" stroke="#4f5bb0"/>`).join('') + lbl(455, 334, '포도당')
        + beads(110, 380, p2) + lbl(140, 410, '작게 분해된 단백질') + arrow(275, 378, '트립신 · 단백질 소화효소', '#7c55aa') + p1.slice(0, 6).map((c, j) => `<circle cx="${395 + j * 26}" cy="${374 + (j % 2) * 10}" r="6.5" fill="${c}" stroke="rgba(20,38,59,.25)"/>`).join('') + lbl(460, 410, '아미노산')
        + `<ellipse cx="140" cy="462" rx="34" ry="24" fill="#f6e2a6" stroke="#cfae5d"/>` + comb(130, 450) + comb(152, 462) + lbl(140, 504, '지방') + `<text x="232" y="445" text-anchor="middle" font-size="12" font-weight="800" fill="#5f8a32">쓸개즙</text><line x1="205" y1="458" x2="255" y2="458" stroke="#86b04c" stroke-width="1.6" stroke-dasharray="4 3"/>` + comb(282, 450) + comb(300, 470)
        + arrow(320, 462, '라이페이스', '#c27a22') + comb(430, 452, 1) + comb(468, 470, 1) + stick(510, 456, 20) + stick(530, 470, -15) + stick(548, 452, 30) + stick(566, 468, -25) + lbl(495, 504, '지방산, 모노글리세리드'))}
      ${lbl(660, 98, '')}
    </svg>`;
    host.innerHTML = svg;
  }
  return { membrane, steps };
})();
window.RDF = RDF;
