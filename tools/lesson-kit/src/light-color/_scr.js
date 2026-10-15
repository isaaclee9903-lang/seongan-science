/* ===== 영상 장치 화면 그림 도구 (캔버스) =====
   SCR.TILES                         색 카드 8칸 (교과서 해 보기 표의 7가지 색 + 검은색)
   SCR.paint(ctx, W, H, 'tiles'|'photo')   화면에 띄울 그림 그리기
   SCR.pixels(그림캔버스, 가로, 세로)        화소 자료(작은 점 밝기) 만들기 → { w, h, at(i, j) → [r, g, b] }
   SCR.sub(ctx, cx, cy, D, n, at, i0, j0)  지름 D 원 안에 화소 n×n칸을 빨간색·초록색·파란색 작은 점으로 그리기
   풍경은 실제 사진이 아니라 교과서 그림 Ⅲ-11을 본떠 새로 그린 그림이에요. */
window.SCR = (() => {
  const TILES = [
    { n: '빨간색', c: [255, 0, 0], m: 1 }, { n: '초록색', c: [0, 255, 0], m: 2 }, { n: '파란색', c: [0, 0, 255], m: 4 }, { n: '노란색', c: [255, 255, 0], m: 3 },
    { n: '흰색', c: [255, 255, 255], m: 7 }, { n: '청록색', c: [0, 255, 255], m: 6 }, { n: '자홍색', c: [255, 0, 255], m: 5 }, { n: '검은색', c: [0, 0, 0], m: 0 },
  ];
  const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
  function rng(seed) { let s = seed; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }

  function tileRect(W, H, k) {
    const cols = 4, gx = W * 0.035, gy = H * 0.07, tw = (W - gx * (cols + 1)) / cols, th = (H - gy * 3 - H * 0.1) / 2;
    const i = k % cols, j = Math.floor(k / cols);
    return { x: gx + i * (tw + gx), y: gy + j * (th + gy + H * 0.05), w: tw, h: th };
  }

  function paint(ctx, W, H, mode) {
    ctx.save();
    if (mode === 'tiles') {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      TILES.forEach((t, k) => {
        const r = tileRect(W, H, k);
        ctx.fillStyle = rgb(t.c); ctx.fillRect(r.x, r.y, r.w, r.h);
        if (t.m === 0) { ctx.strokeStyle = '#3a3f46'; ctx.lineWidth = W * 0.004; ctx.strokeRect(r.x, r.y, r.w, r.h); }
      });
      ctx.restore(); return;
    }
    // 풍경: 하늘 → 먼 산 → 단풍 든 산 → 호수(비친 모습) → 섬과 나무
    const R = rng(11);
    const hz = H * 0.56;
    let g = ctx.createLinearGradient(0, 0, 0, hz);
    g.addColorStop(0, '#2f72cf'); g.addColorStop(0.55, '#79b6ea'); g.addColorStop(1, '#e6eef2');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, hz);
    ctx.filter = `blur(${W * 0.012}px)`;
    [[0.18, 0.16, 0.13], [0.33, 0.2, 0.09], [0.72, 0.12, 0.15], [0.86, 0.22, 0.08]].forEach(([x, y, r]) => { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(W * x, H * y, W * r, H * r * 0.32, 0, 0, Math.PI * 2); ctx.fill(); });
    ctx.filter = 'none';
    const ridge = (y0, amp, rough, seed) => { const r2 = rng(seed), pts = []; let y = 0; for (let x = 0; x <= W; x += W / 60) { y += (r2() - 0.5) * rough; y *= 0.9; pts.push([x, y0 - Math.abs(Math.sin(x / W * Math.PI * 1.6 + seed)) * amp + y]); } return pts; };
    const fillRidge = (pts, base, fill) => { ctx.beginPath(); ctx.moveTo(0, base); pts.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.lineTo(W, base); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
    const far = ridge(hz - H * 0.06, H * 0.26, H * 0.05, 2);
    g = ctx.createLinearGradient(0, H * 0.2, 0, hz); g.addColorStop(0, '#8aa6c4'); g.addColorStop(1, '#b7c9d8');
    fillRidge(far, hz, g);
    const mid = ridge(hz - H * 0.01, H * 0.15, H * 0.04, 5);
    g = ctx.createLinearGradient(0, H * 0.35, 0, hz); g.addColorStop(0, '#3f7a3f'); g.addColorStop(1, '#2a5a2e');
    fillRidge(mid, hz, g);
    // 단풍 든 나무 점들
    for (let k = 0; k < 520; k++) {
      const x = R() * W, top = mid[Math.min(mid.length - 1, Math.round(x / (W / 60)))][1];
      const y = top + R() * (hz - top), cols = ['#d8401c', '#f0a020', '#f6d23a', '#b8261a', '#3f8a3a', '#e86a1e'];
      ctx.fillStyle = cols[Math.floor(R() * cols.length)]; ctx.globalAlpha = 0.75; ctx.beginPath(); ctx.arc(x, y, W * (0.004 + R() * 0.006), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // 호수
    g = ctx.createLinearGradient(0, hz, 0, H); g.addColorStop(0, '#5aa6b8'); g.addColorStop(0.4, '#2f8f9c'); g.addColorStop(1, '#16606e');
    ctx.fillStyle = g; ctx.fillRect(0, hz, W, H - hz);
    ctx.save(); ctx.globalAlpha = 0.5; ctx.translate(0, hz * 2); ctx.scale(1, -1);
    fillRidge(far, hz, '#7d98ad'); fillRidge(mid, hz, '#2d5f3a');
    ctx.restore();
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#e8f4f6';
    for (let k = 0; k < 70; k++) { const y = hz + R() * (H - hz); ctx.fillRect(R() * W, y, W * (0.02 + R() * 0.06), H * 0.003); }
    ctx.globalAlpha = 1;
    // 섬, 나무
    const ix = W * 0.38, iy = hz + H * 0.07;
    ctx.fillStyle = '#5b5a52'; ctx.beginPath(); ctx.ellipse(ix, iy, W * 0.085, H * 0.035, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c45a1e'; ctx.beginPath(); ctx.ellipse(ix + W * 0.02, iy - H * 0.02, W * 0.06, H * 0.03, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a3420'; ctx.fillRect(ix - W * 0.004, iy - H * 0.33, W * 0.008, H * 0.31);
    for (let k = 0; k < 7; k++) {
      const y = iy - H * (0.32 - k * 0.042), w = W * (0.018 + k * 0.009);
      ctx.fillStyle = k % 2 ? '#1f4a2a' : '#2a5c33';
      ctx.beginPath(); ctx.moveTo(ix, y - H * 0.035); ctx.lineTo(ix + w, y + H * 0.03); ctx.lineTo(ix - w, y + H * 0.03); ctx.closePath(); ctx.fill();
    }
    // 앞쪽 바위
    ctx.fillStyle = '#9c968a'; ctx.beginPath(); ctx.ellipse(W * 0.12, H * 0.94, W * 0.15, H * 0.07, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c8c2b4'; ctx.beginPath(); ctx.ellipse(W * 0.1, H * 0.92, W * 0.1, H * 0.035, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function pixels(src, w, h) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data;
    return { w, h, at(i, j) { if (i < 0 || j < 0 || i >= w || j >= h) return [0, 0, 0]; const k = (j * w + i) * 4; return [d[k], d[k + 1], d[k + 2]]; } };
  }

  const KC = [[255, 40, 30], [40, 255, 70], [60, 90, 255]];
  function sub(ctx, cx, cy, D, n, at, i0, j0, o = {}) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, D / 2, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#050607'; ctx.fillRect(cx - D / 2, cy - D / 2, D, D);
    const cell = D / n, bw = cell / 3, x0 = cx - D / 2 + (o.fx || 0) * -cell, y0 = cy - D / 2 + (o.fy || 0) * -cell;
    for (let j = -1; j <= n; j++) for (let i = -1; i <= n; i++) {
      const v = at(i0 + i, j0 + j), x = x0 + i * cell, y = y0 + j * cell;
      for (let k = 0; k < 3; k++) {
        const a = v[k] / 255, c = KC[k];
        const px = x + k * bw + bw * 0.16, pw = bw * 0.68, py = y + cell * 0.07, ph = cell * 0.86;
        ctx.fillStyle = `rgb(${Math.round(18 + c[0] * a * 0.95)},${Math.round(18 + c[1] * a * 0.95)},${Math.round(18 + c[2] * a * 0.95)})`;
        ctx.fillRect(px, py, pw, ph);
        if (a > 0.55 && cell > 18) { ctx.fillStyle = `rgba(255,255,255,${((a - 0.55) * 0.5).toFixed(2)})`; ctx.fillRect(px + pw * 0.3, py + ph * 0.06, pw * 0.4, ph * 0.88); }
      }
    }
    // 렌즈 유리 반사
    const gl = ctx.createRadialGradient(cx - D * 0.22, cy - D * 0.26, 0, cx - D * 0.22, cy - D * 0.26, D * 0.55);
    gl.addColorStop(0, 'rgba(255,255,255,.16)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gl; ctx.fillRect(cx - D / 2, cy - D / 2, D, D);
    ctx.restore();
    if (o.ring !== false) {
      ctx.save();
      const rg = ctx.createLinearGradient(cx - D / 2, cy - D / 2, cx + D / 2, cy + D / 2);
      rg.addColorStop(0, '#f2f4f6'); rg.addColorStop(0.45, '#9aa3ad'); rg.addColorStop(0.55, '#7d8692'); rg.addColorStop(1, '#d4d9de');
      ctx.strokeStyle = rg; ctx.lineWidth = o.ring || Math.max(4, D * 0.045); ctx.beginPath(); ctx.arc(cx, cy, D / 2, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, D / 2 - (o.ring || Math.max(4, D * 0.045)) / 2, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  }

  return { TILES, tileRect, paint, pixels, sub };
})();
