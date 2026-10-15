/* ===== 빛의 합성 그림 도구 (캔버스) =====
   MIX.NAME[가림수]             1 빨간색 2 초록색 4 파란색 3 노란색 6 청록색 5 자홍색 7 흰색 0 검은색
   MIX.wall(host, 옵션)         어두운 벽에 빨간색·초록색·파란색 빛을 비추는 무대. 빛이 겹친 곳은 더해서 칠해요
                                → { spots, on(i, v), place('book'|'apart'), regions(), onChange(fn) }
   MIX.pixel(host)              화소 확대 보기. set(가림수), zoom(0~1)
   빛의 밝기 더하기는 캔버스의 'lighter' 합성으로 그린 개념 이해용 모형이에요. */
window.MIX = (() => {
  const NAME = { 0: '검은색', 1: '빨간색', 2: '초록색', 4: '파란색', 3: '노란색', 6: '청록색', 5: '자홍색', 7: '흰색' };
  const RGB = [[255, 30, 24], [30, 255, 60], [40, 70, 255]];
  const PURE = [[255, 0, 0], [0, 255, 0], [0, 0, 255]];
  const BIT = [1, 2, 4];
  const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const DPR = () => Math.min(2, window.devicePixelRatio || 1);

  function fitCanvas(host, W, H) {
    const cv = document.createElement('canvas'); cv.className = 'mixcv'; host.prepend(cv);
    const ctx = cv.getContext('2d');
    let k = 1;
    const resize = () => { const r = host.getBoundingClientRect(), d = DPR(); k = r.width / W; cv.width = Math.round(r.width * d); cv.height = Math.round(r.width * H / W * d); ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0); };
    resize();
    return { cv, ctx, resize, get k() { return k; } };
  }

  function wall(host, o = {}) {
    const W = 1000, H = o.H || 640, R = o.r || 150;
    const C = fitCanvas(host, W, H), { ctx } = C;
    // 벽 질감 (한 번만 만들어 둠)
    const tex = document.createElement('canvas'); tex.width = W; tex.height = H;
    (() => {
      const t = tex.getContext('2d');
      const g = t.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#16181c'); g.addColorStop(1, '#0c0d10'); t.fillStyle = g; t.fillRect(0, 0, W, H);
      const img = t.getImageData(0, 0, W, H), d = img.data;
      for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 9; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
      t.putImageData(img, 0, 0);
    })();
    // 빛을 받는 벽의 밝기(거친 면). 빛 무늬에 곱해 아주 약한 결을 남김
    const spots = [
      { x: 175, y: 230, on: true, c: RGB[0], p: PURE[0], src: [190, H + 4] },
      { x: 500, y: 230, on: true, c: RGB[1], p: PURE[1], src: [500, H + 4] },
      { x: 825, y: 230, on: true, c: RGB[2], p: PURE[2], src: [810, H + 4] },
    ];
    const LAY = {
      book: [[432, 250], [568, 250], [500, 368]],
      apart: [[175, 230], [500, 230], [825, 230]],
    };
    let cb = () => {}, raf = 0, anim = null;
    function draw() {
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(tex, 0, 0);
      ctx.globalCompositeOperation = 'lighter';
      spots.forEach((s) => {
        if (!s.on) return;
        // 공기 중으로 퍼지는 빛줄기 (아주 약하게)
        const dx = s.x - s.src[0], dy = s.y - s.src[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
        const bg = ctx.createLinearGradient(s.src[0], s.src[1], s.x, s.y); bg.addColorStop(0, css(s.c, 0.16)); bg.addColorStop(1, css(s.c, 0.03));
        ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(s.src[0] - nx * 14, s.src[1] - ny * 14); ctx.lineTo(s.x - nx * R * 0.95, s.y - ny * R * 0.95); ctx.lineTo(s.x + nx * R * 0.95, s.y + ny * R * 0.95); ctx.lineTo(s.src[0] + nx * 14, s.src[1] + ny * 14); ctx.closePath(); ctx.fill();
        // 벽에 닿은 동그란 빛 (가장자리는 부드럽게)
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, R);
        g.addColorStop(0, css(s.p, 1)); g.addColorStop(0.8, css(s.p, 0.97)); g.addColorStop(0.92, css(s.p, 0.6)); g.addColorStop(1, css(s.p, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, R, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
      // 손전등 머리 (아래 가장자리)
      spots.forEach((s) => {
        const a = Math.atan2(s.y - s.src[1], s.x - s.src[0]);
        ctx.save(); ctx.translate(s.src[0], s.src[1]); ctx.rotate(a);
        const hg = ctx.createLinearGradient(0, -26, 0, 26); hg.addColorStop(0, '#5b626c'); hg.addColorStop(0.22, '#aeb6c0'); hg.addColorStop(0.42, '#3a4048'); hg.addColorStop(1, '#16191e');
        ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(-70, -18); ctx.lineTo(-30, -18); ctx.lineTo(0, -28); ctx.lineTo(0, 28); ctx.lineTo(-30, 18); ctx.lineTo(-70, 18); ctx.closePath(); ctx.fill();
        ctx.fillStyle = s.on ? css(s.c, 1) : '#2a2f36'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 26, 0, 0, Math.PI * 2); ctx.fill();
        if (s.on) { ctx.globalCompositeOperation = 'lighter'; const lg = ctx.createRadialGradient(4, 0, 0, 4, 0, 40); lg.addColorStop(0, css(s.c, 0.8)); lg.addColorStop(1, css(s.c, 0)); ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(4, 0, 40, 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
        ctx.restore();
      });
    }
    // 겹친 곳 찾기: 격자 점마다 어느 빛 안에 있는지 보고, 가장 안쪽 점에 이름을 붙임
    function regions() {
      const best = {}, count = {};
      for (let y = 6; y < H - 60; y += 10) for (let x = 6; x < W; x += 10) {
        let m = 0, depth = 1e9;
        spots.forEach((s, i) => { if (!s.on) return; const d = Math.hypot(x - s.x, y - s.y); depth = Math.min(depth, Math.abs(R * 0.9 - d)); if (d < R * 0.9) m |= BIT[i]; });
        if (!m) continue;
        count[m] = (count[m] || 0) + 1;
        if (!best[m] || depth > best[m].depth) best[m] = { x, y, depth };
      }
      return Object.keys(best).map((m) => ({ m: +m, x: best[m].x, y: best[m].y, n: count[m], name: NAME[m] })).filter((r) => r.n > 18);
    }
    function frame() { raf = 0; draw(); cb(); }
    const req = () => { if (!raf) raf = requestAnimationFrame(frame); };
    // 끌기
    let drag = null;
    const toW = (e) => { const r = C.cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    C.cv.addEventListener('pointerdown', (e) => {
      const [x, y] = toW(e); let bi = -1, bd = 1e9;
      spots.forEach((s, i) => { const d = Math.hypot(x - s.x, y - s.y); if (s.on && d < R && d < bd) { bd = d; bi = i; } });
      if (bi < 0) return;
      drag = { i: bi, dx: spots[bi].x - x, dy: spots[bi].y - y }; C.cv.setPointerCapture(e.pointerId); anim = null; e.preventDefault();
    });
    C.cv.addEventListener('pointermove', (e) => {
      if (!drag) return; const [x, y] = toW(e), s = spots[drag.i];
      s.x = Math.max(R * 0.5, Math.min(W - R * 0.5, x + drag.dx)); s.y = Math.max(R * 0.5, Math.min(H - R * 0.7, y + drag.dy)); req();
    });
    const end = () => { drag = null; };
    C.cv.addEventListener('pointerup', end); C.cv.addEventListener('pointercancel', end);
    window.addEventListener('resize', () => { C.resize(); req(); });
    draw();
    return {
      spots, W, H, R, cv: C.cv,
      on(i, v) { spots[i].on = v; req(); },
      place(k) {
        const to = LAY[k], from = spots.map((s) => [s.x, s.y]), t0 = performance.now(), ms = window.FLOW && FLOW.REDUCE ? 1 : 700;
        anim = (t) => { if (anim === null) return; const q = Math.min(1, (t - t0) / ms), e = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2; spots.forEach((s, i) => { s.x = from[i][0] + (to[i][0] - from[i][0]) * e; s.y = from[i][1] + (to[i][1] - from[i][1]) * e; }); draw(); cb(); if (q < 1) requestAnimationFrame(anim); };
        requestAnimationFrame(anim);
      },
      regions,
      onChange(fn) { cb = fn; fn(); },
      redraw: req,
    };
  }

  /* 화소 확대 보기: 가까이(점 몇 개)에서 멀리(점이 아주 작아 섞여 보임)까지 */
  function pixel(host) {
    const W = 600, H = 400;
    const C = fitCanvas(host, W, H), { ctx } = C;
    let mask = 2, z = 0;
    function draw() {
      ctx.fillStyle = '#060708'; ctx.fillRect(0, 0, W, H);
      const cell = 150 * Math.pow(0.02, z);           // 화소 한 칸의 크기
      const ox = W / 2 - cell * 1.5, oy = H / 2 - cell * 1.5;
      const nx0 = Math.floor(-ox / cell) - 1, nx1 = Math.ceil((W - ox) / cell) + 1, ny0 = Math.floor(-oy / cell) - 1, ny1 = Math.ceil((H - oy) / cell) + 1;
      const bw = cell / 3;
      for (let j = ny0; j < ny1; j++) for (let i = nx0; i < nx1; i++) {
        const x = ox + i * cell, y = oy + j * cell;
        for (let k = 0; k < 3; k++) {
          const lit = mask & BIT[k], c = PURE[k];
          const px = x + k * bw + bw * 0.14, pw = bw * 0.72, py = y + cell * 0.08, ph = cell * 0.84;
          if (lit) {
            if (cell > 24) { ctx.fillStyle = css(c, 0.22); ctx.fillRect(px - bw * 0.12, py - cell * 0.04, pw + bw * 0.24, ph + cell * 0.08); }
            const g = cell > 24 ? ctx.createLinearGradient(px, 0, px + pw, 0) : null;
            if (g) { g.addColorStop(0, css(c, 0.82)); g.addColorStop(0.5, css([Math.min(255, c[0] + 150), Math.min(255, c[1] + 150), Math.min(255, c[2] + 150)], 1)); g.addColorStop(1, css(c, 0.82)); }
            ctx.fillStyle = g || css(c, 1);
          } else ctx.fillStyle = `rgba(${c[0] * 0.13 + 14},${c[1] * 0.13 + 14},${c[2] * 0.13 + 14},1)`;
          if (cell > 24) { const rr = Math.min(pw / 2, 6); ctx.beginPath(); ctx.moveTo(px + rr, py); ctx.arcTo(px + pw, py, px + pw, py + ph, rr); ctx.arcTo(px + pw, py + ph, px, py + ph, rr); ctx.arcTo(px, py + ph, px, py, rr); ctx.arcTo(px, py, px + pw, py, rr); ctx.fill(); }
          else ctx.fillRect(px, py, pw, ph);
        }
      }
      C.cv.style.filter = cell < 26 ? `blur(${((26 - cell) / 4.5).toFixed(2)}px)` : '';
      // 멀리서 보면 작은 점이 구별되지 않고 한 가지 색으로 섞여 보임
      const mix = Math.max(0, Math.min(1, (z - 0.45) / 0.45)), e = mix * mix * (3 - 2 * mix);
      if (e > 0) { ctx.fillStyle = `rgba(${mask & 1 ? 255 : 0},${mask & 2 ? 255 : 0},${mask & 4 ? 255 : 0},${(e * 0.92).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
      if (cell > 60) { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeRect(ox + cell + 1, oy + cell + 1, cell - 2, cell - 2); ctx.setLineDash([]); }
    }
    window.addEventListener('resize', () => { C.resize(); draw(); });
    draw();
    return {
      set(m) { mask = m; draw(); },
      zoom(v) { z = v; draw(); },
      get cellSize() { return 150 * Math.pow(0.02, z); },
      W, H,
    };
  }

  return { NAME, BIT, PURE, wall, pixel };
})();
