/* ===== FIG.travel: 소리를 듣는 과정 (교과서 그림 Ⅲ-15를 바탕으로) =====
   북 → 공기 입자 → 귀. '북 치기'를 누르면 북의 막이 진동하고, 그 진동이 공기 입자를 차례로 진동시키며 귀까지 전해져요.
   입자는 제자리에서 진동만 해요. vacuum(true)이면 공기가 없어 소리가 전해지지 않아요. */
(() => {
  'use strict';
  function travel(host, o) {
    o = Object.assign({ sound: true }, o || {});
    const W = 1000, H = 420;
    const cv = document.createElement('canvas'); cv.className = 'wvc'; host.appendChild(cv);
    const ov = document.createElement('div'); ov.className = 'olay'; host.appendChild(ov);
    const lab = (t, x, y, cls) => { const e = document.createElement('span'); e.className = 'ol tx ' + (cls || ''); e.textContent = t; e.style.left = (x / W) * 100 + '%'; e.style.top = (y / H) * 100 + '%'; ov.appendChild(e); return e; };
    lab('북', 130, 372, 'm'); const lAir = lab('공기 입자(매질)', 520, 372, 'm'); const lEar = lab('귀', 900, 372, 'm');
    const lHear = lab('', 900, 72, 'b'); lHear.hidden = true;
    const g = cv.getContext('2d');
    let dpr = 1, sx = 1;
    // 공기 입자: 줄을 맞추되 조금씩 흐트러지게(고정)
    const P = []; let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let y = 128, r = 0; y <= 300; y += 19, r++) for (let x = 252 + (r % 2) * 9; x <= 792; x += 18) P.push({ x: x + (rnd() - 0.5) * 3, y: y + (rnd() - 0.5) * 3 });
    const hi = P.reduce((b, p) => (Math.abs(p.x - 520) + Math.abs(p.y - 214) < Math.abs(b.x - 520) + Math.abs(b.y - 214) ? p : b), P[0]);
    const st = { hits: [], vac: false, hi: false, auto: false, t: 0 };
    const X0 = 206, C = 240, F = 1.5, TAU = 1.5, A0 = 13;
    function size() { const r = host.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); sx = r.width / W; cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
    // 막에서 거리 d만큼 떨어진 곳의 시각 t 변위
    function disp(d, t) {
      let s = 0;
      for (const h of st.hits) { const tl = t - h - d / C; if (tl > 0 && tl < 3) s += Math.sin(2 * Math.PI * F * tl) * Math.exp(-tl / TAU) * Math.min(1, tl * 30); }
      return s;
    }
    function drum(t) {
      const m = disp(0, t) * 9;
      // 몸통
      const bg = g.createLinearGradient(0, 110, 0, 310); bg.addColorStop(0, '#b65a3c'); bg.addColorStop(0.45, '#93402a'); bg.addColorStop(1, '#5e2617');
      g.fillStyle = bg; g.beginPath(); g.moveTo(66, 130); g.quadraticCurveTo(126, 96, 186, 118); g.lineTo(186, 302); g.quadraticCurveTo(126, 324, 66, 290); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,230,210,.16)'; g.beginPath(); g.moveTo(80, 128); g.quadraticCurveTo(126, 104, 176, 122); g.lineTo(176, 150); g.quadraticCurveTo(126, 132, 80, 156); g.closePath(); g.fill();
      // 줄(지그재그)
      g.strokeStyle = '#e9dcc0'; g.lineWidth = 2; g.beginPath();
      for (let i = 0; i <= 8; i++) { const y1 = 120 + i * 23.5; g.moveTo(72, y1 + (i % 2 ? 6 : 0)); g.lineTo(180, y1 + 11 + (i % 2 ? -4 : 4)); }
      g.stroke();
      // 왼쪽 막(뒤)
      g.fillStyle = '#d9cbb0'; g.beginPath(); g.ellipse(66, 210, 16, 80, 0, Math.PI / 2, Math.PI * 1.5); g.fill();
      // 오른쪽 막(진동하는 막)
      const mg = g.createLinearGradient(186, 0, 220, 0); mg.addColorStop(0, '#e2d4b8'); mg.addColorStop(1, '#f6efe0');
      g.fillStyle = '#6f2c1a'; g.beginPath(); g.ellipse(186, 210, 26, 96, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = mg; g.beginPath(); g.ellipse(186, 210, 21 + m * 0.35, 90, 0, -Math.PI / 2, Math.PI / 2); g.ellipse(186, 210, 15, 90, 0, Math.PI / 2, -Math.PI / 2, true); g.fill();
      g.strokeStyle = 'rgba(80,40,20,.35)'; g.lineWidth = 1; g.beginPath(); g.ellipse(186, 210, 21 + m * 0.35, 90, 0, -Math.PI / 2, Math.PI / 2); g.stroke();
      // 받침
      g.strokeStyle = '#4a3a30'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(96, 312); g.lineTo(80, 350); g.moveTo(156, 312); g.lineTo(172, 350); g.stroke();
      g.fillStyle = 'rgba(20,38,59,.08)'; g.beginPath(); g.ellipse(126, 352, 74, 7, 0, 0, Math.PI * 2); g.fill();
      // 북채: 치는 순간 막에 닿았다가 돌아가요
      let k = 0; const last = st.hits.length ? st.hits[st.hits.length - 1] : -9, dt = t - last;
      if (dt >= -0.16 && dt < 0) k = 1 + dt / 0.16; else if (dt >= 0 && dt < 0.3) k = 1 - dt / 0.3;
      const ang = 0.24 + k * 0.38 - Math.PI / 2, px = 300, py = 40;
      g.save(); g.translate(px, py); g.rotate(ang + Math.PI / 2);
      g.fillStyle = '#c9a77e'; g.fillRect(-3, 0, 6, 150); g.fillStyle = '#3b4c63'; g.beginPath(); g.arc(0, 156, 10, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    function ear() {
      g.save(); g.translate(900, 214);
      const eg = g.createLinearGradient(-40, -90, 40, 90); eg.addColorStop(0, '#f1d5c0'); eg.addColorStop(1, '#d9ae92');
      g.fillStyle = eg; g.strokeStyle = '#b98a6e'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(-26, -70); g.bezierCurveTo(10, -104, 62, -86, 60, -30); g.bezierCurveTo(58, 10, 30, 22, 26, 50); g.bezierCurveTo(22, 82, -6, 96, -22, 76); g.bezierCurveTo(-30, 64, -20, 52, -26, 40); g.lineTo(-26, -70); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = '#c09074'; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-10, -56); g.bezierCurveTo(14, -76, 44, -60, 40, -30); g.bezierCurveTo(38, -8, 18, 0, 14, 22); g.stroke();
      g.beginPath(); g.arc(-8, 6, 10, -1.2, 2.2); g.stroke();
      g.fillStyle = '#8f5f47'; g.beginPath(); g.ellipse(-16, 4, 5, 8, 0, 0, Math.PI * 2); g.fill();
      g.restore();
      g.fillStyle = 'rgba(20,38,59,.06)'; g.beginPath(); g.ellipse(906, 330, 40, 6, 0, 0, Math.PI * 2); g.fill();
    }
    function draw() {
      const t = st.t;
      g.setTransform(dpr * sx, 0, 0, dpr * sx, 0, 0);
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      drum(t); ear();
      if (!st.vac) {
        for (const p of P) {
          const d = p.x - X0, dx = A0 * disp(d, t);
          const isHi = st.hi && p === hi;
          if (isHi) {
            g.strokeStyle = '#0e63b3'; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(p.x, p.y - 22); g.lineTo(p.x, p.y + 22); g.stroke(); g.setLineDash([]);
            g.fillStyle = '#0e63b3'; g.beginPath(); g.arc(p.x + dx, p.y, 6.2, 0, Math.PI * 2); g.fill();
          } else {
            // 촘촘해진 곳은 조금 진하게
            const cp = Math.max(-1, Math.min(1, -(disp(d + 4, t) - disp(d - 4, t)) * A0 / 8 * 1.6));
            g.fillStyle = cp > 0 ? `rgb(${159 - 95 * cp | 0},${176 - 86 * cp | 0},${193 - 70 * cp | 0})` : '#a9b8c7';
            g.beginPath(); g.arc(p.x + dx, p.y, 3.6, 0, Math.PI * 2); g.fill();
          }
        }
      } else {
        g.fillStyle = '#f5f7f9'; g.fillRect(232, 112, 576, 206); g.strokeStyle = '#d9e1e8'; g.setLineDash([6, 5]); g.strokeRect(232.5, 112.5, 575, 205); g.setLineDash([]);
      }
      // 귀에 진동이 닿았는지
      const reach = !st.vac && st.hits.some((h) => t - h > (860 - X0) / C && t - h < (860 - X0) / C + 2.2);
      lHear.hidden = !(reach || (st.vac && st.hits.some((h) => t - h > 0.4 && t - h < 2.5)));
      lHear.textContent = st.vac ? '아무 소리도 들리지 않아요' : '소리가 들려요';
      lAir.textContent = st.vac ? '공기가 없어요 (진공)' : '공기 입자(매질)';
    }
    let last = performance.now(), nextAuto = 0, raf = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      st.t += Math.min(0.05, (now - last) / 1000); last = now;
      if (st.auto && st.t >= nextAuto) { hit(); nextAuto = st.t + 1.6; }
      st.hits = st.hits.filter((h) => st.t - h < 6);
      draw();
    }
    function hit() {
      st.hits.push(st.t + 0.16);
      if (o.sound && !st.vac && window.SND) { const go = () => setTimeout(() => SND.play('timpani', 43, 0.9), 150); SND.ready('timpani') ? go() : SND.load('timpani').then(go).catch(() => {}); }
    }
    if (window.ResizeObserver) new ResizeObserver(() => { size(); draw(); }).observe(host); else window.addEventListener('resize', () => { size(); draw(); });
    size(); requestAnimationFrame((n) => { last = n; loop(n); });
    return { st, hit, set: (p) => Object.assign(st, p), auto: (v) => { st.auto = v; nextAuto = st.t; }, ff: (s) => { st.t += s; draw(); } };
  }
  window.FIG = { travel };
})();
