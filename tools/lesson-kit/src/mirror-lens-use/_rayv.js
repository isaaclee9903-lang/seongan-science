/* ===== 빛길 그림 (캔버스 2D, 움직임) =====
   RAYV.start(캔버스, 종류, 옵션) → { set(옵션), stop() }
   종류: 'headlight' 전조등 단면(오목 거울), 'telescope' 망원경 거울(오목 거울), 'projector' 프로젝터 렌즈
   빛 알갱이가 실제 반사 방향을 따라 움직여요. 거울 모양은 빛을 한 점에 모으는 오목한 곡선으로 계산해요. */
window.RAYV = (() => {
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const lin = (ctx, x0, y0, x1, y1, st) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const rad = (ctx, x, y, r0, r1, st) => { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const len = (p) => { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; };
  const at = (p, d) => { for (let i = 1; i < p.length; i++) { const s = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (d <= s) { const t = d / s; return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t]; } d -= s; } return p[p.length - 1]; };

  function start(cv, kind, o = {}) {
    const ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    let opt = Object.assign({}, o), raf = 0, t0 = performance.now(), paths = [];
    function build() {
      paths = [];
      if (kind === 'headlight') {
        // 오목 거울(포물선) x = xv + (y - yc)² / (4p), 전구는 빛이 모이는 자리 (xv + p, yc)
        const yc = H * .5, xv = W * .14, p = W * .07, fxp = xv + p, A = H * .36;
        for (let k = -6; k <= 6; k++) {
          if (k === 0) continue;
          const y = yc + A * k / 6.4, x = xv + (y - yc) * (y - yc) / (4 * p);
          if (opt.noMirror) {
            const ang = Math.atan2(y - yc, x - fxp) + Math.PI;    // 거울이 없으면 뒤로 간 빛은 그대로 흩어짐
            paths.push({ p: [[fxp, yc], [fxp + Math.cos(ang) * W, yc + Math.sin(ang) * W]], w: .6 });
          } else paths.push({ p: [[fxp, yc], [x, y], [W + 40, y]], w: 1 });
        }
        for (let k = -3; k <= 3; k++) { const a = k * .28; paths.push({ p: [[fxp, yc], [fxp + Math.cos(a) * W, yc + Math.sin(a) * W]], w: .5 }); }
      } else if (kind === 'telescope') {
        const yc = H * .5, xv = W * .86, p = W * .3, A = H * .36;
        for (let k = -6; k <= 6; k++) {
          if (k === 0) continue;
          const y = yc + A * k / 6.2, x = xv - (y - yc) * (y - yc) / (4 * p);
          paths.push({ p: [[-20, y], [x, y], [xv - p, yc]], w: 1 });
        }
      } else if (kind === 'projector') {
        const lx = W * .34, ly = H * .5, sx = W * .95;
        for (let k = -5; k <= 5; k++) paths.push({ p: [[W * .08, ly + k * H * .025], [lx, ly + k * H * .03], [sx, ly + k * H * .085]], w: 1 });
      }
      paths.forEach((q) => { q.L = len(q.p); });
    }
    function bg() {
      if (kind === 'telescope') {
        ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#0b1626'], [1, '#13253b']]); ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 60; i++) { const x = (i * 97) % W, y = (i * 53) % H; ctx.fillStyle = `rgba(255,255,255,${.2 + (i % 5) * .1})`; ctx.fillRect(x, y, 1.6, 1.6); }
      } else if (kind === 'headlight') {
        ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#1b2430'], [1, '#2a3646']]); ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#3b4655'; ctx.fillRect(0, H * .92, W, H * .08);
        // 전조등 몸체 (빛줄기 뒤에 그림)
        const yc = H * .5, xv = W * .14, p = W * .07, A = H * .4, fr = xv + A * A / (4 * p) + 12;
        ctx.fillStyle = lin(ctx, 0, yc - A, 0, yc + A, [[0, '#3a4350'], [1, '#161b22']]);
        ctx.beginPath(); ctx.roundRect(xv - 34, yc - A - 12, fr - xv + 34, 2 * A + 24, 22); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.roundRect(xv - 22, yc - A, fr - xv + 10, 2 * A, 14); ctx.fill();
      } else {
        ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#283342'], [1, '#1c2530']]); ctx.fillRect(0, 0, W, H);
      }
    }
    function fg() {
      if (kind === 'headlight') {
        const yc = H * .5, xv = W * .14, p = W * .07, A = H * .4;
        if (!opt.noMirror) {
          ctx.lineWidth = 7; ctx.strokeStyle = lin(ctx, 0, yc - A, 0, yc + A, [[0, '#f2f5f8'], [.5, '#9aa6b2'], [1, '#e5ebf0']]);
          ctx.beginPath(); for (let y = yc - A; y <= yc + A; y += 3) { const x = xv + (y - yc) * (y - yc) / (4 * p); y === yc - A ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
        }
        // 앞 유리
        ctx.fillStyle = 'rgba(200,225,245,.12)'; ctx.fillRect(xv + A * A / (4 * p) + 4, yc - A, 8, 2 * A);
        // 전구
        const fxp = xv + p; ctx.fillStyle = rad(ctx, fxp, yc, 0, 46, [[0, 'rgba(255,250,220,1)'], [.3, 'rgba(255,236,160,.6)'], [1, 'rgba(255,230,140,0)']]); ctx.beginPath(); ctx.arc(fxp, yc, 46, 0, 7); ctx.fill();
        ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.ellipse(fxp, yc, 10, 7, 0, 0, 7); ctx.fill();
      } else if (kind === 'telescope') {
        const yc = H * .5, xv = W * .86, p = W * .3, A = H * .4;
        ctx.lineWidth = 12; ctx.strokeStyle = lin(ctx, 0, yc - A, 0, yc + A, [[0, '#ffe9a0'], [.5, '#d9a43a'], [1, '#a8761c']]);
        ctx.beginPath(); for (let y = yc - A; y <= yc + A; y += 3) { const x = xv - (y - yc) * (y - yc) / (4 * p); y === yc - A ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = '#4b3a18'; ctx.beginPath(); for (let y = yc - A; y <= yc + A; y += 3) { const x = xv - (y - yc) * (y - yc) / (4 * p) + 8; y === yc - A ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
        const fx = xv - p, pulse = .75 + .25 * Math.sin((performance.now() - t0) / 300);
        ctx.fillStyle = rad(ctx, fx, yc, 0, 40 * pulse, [[0, 'rgba(255,255,255,1)'], [.3, 'rgba(255,240,190,.7)'], [1, 'rgba(255,230,150,0)']]); ctx.beginPath(); ctx.arc(fx, yc, 40, 0, 7); ctx.fill();
      } else if (kind === 'projector') {
        const lx = W * .34, ly = H * .5;
        // 화면(벽)
        ctx.fillStyle = '#eef1f4'; ctx.fillRect(W * .94, H * .03, W * .04, H * .94);
        ctx.fillStyle = lin(ctx, 0, H * .06, 0, H * .94, [[0, '#ffffff'], [1, '#dfe6ee']]); ctx.fillRect(W * .935, H * .07, W * .03, H * .86);
        // 프로젝터 몸체
        ctx.fillStyle = lin(ctx, 0, ly - 70, 0, ly + 70, [[0, '#e9edf1'], [1, '#9aa4ae']]); ctx.beginPath(); ctx.roundRect(W * .02, ly - 66, lx - W * .02 - 10, 132, 14); ctx.fill();
        ctx.fillStyle = 'rgba(255,248,210,.9)'; ctx.fillRect(W * .07, ly - 18, 14, 36);
        // 렌즈 (볼록)
        ctx.fillStyle = 'rgba(160,210,240,.55)'; ctx.strokeStyle = '#5d8fb4'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(lx, ly, 16, 54, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(lx - 5, ly - 14, 4, 22, 0, 0, 7); ctx.stroke();
      }
    }
    function frame(now) {
      const t = (now - t0) / 1000;
      bg();
      // 빛줄기
      paths.forEach((q) => {
        ctx.lineWidth = 2.2 * q.w; ctx.strokeStyle = kind === 'telescope' ? 'rgba(255,240,190,.35)' : 'rgba(255,236,160,.35)';
        ctx.beginPath(); q.p.forEach((pt, i) => i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])); ctx.stroke();
        if (!reduce) for (let k = 0; k < 4; k++) {
          const d = ((t * 160 + k * q.L / 4) % q.L), pt = at(q.p, d);
          ctx.fillStyle = rad(ctx, pt[0], pt[1], 0, 6, [[0, 'rgba(255,252,230,1)'], [1, 'rgba(255,240,170,0)']]);
          ctx.beginPath(); ctx.arc(pt[0], pt[1], 6, 0, 7); ctx.fill();
        }
      });
      if (kind === 'projector') {
        // 화면에 비친 그림 (교실 화면)
        const sx = W * .935, top = H * .5 - 5 * H * .085, h = 10 * H * .085;
        ctx.fillStyle = 'rgba(255,248,215,.85)'; ctx.fillRect(sx, top, W * .03, h);
      }
      fg();
      raf = reduce ? 0 : requestAnimationFrame(frame);
    }
    build(); frame(performance.now());
    return {
      set(n) { Object.assign(opt, n); build(); if (reduce) frame(performance.now()); },
      stop() { cancelAnimationFrame(raf); raf = 0; },
    };
  }
  return { start };
})();
