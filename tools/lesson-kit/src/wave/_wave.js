/* ===== 파동 그림 도구 (캔버스 2D) =====
   WV.tank(host, 옵션)      물결파 수조(옆에서 본 모습). 막대·탁구공·물 알갱이·마루 따라가기
   WV.graph(host, 옵션)     파동의 요소 그림(그림 Ⅲ-13 형식, 모눈). 진동수·파장·진폭 바꾸기, 목표 파동, 누른 곳 찾기
   WV.timeline(host, 그래프) 빨간 점의 높이 기록(2초 동안). 주기·진동수 세기
   WV.strip(host, 옵션)      그림 Ⅲ-12 형식 차례 사진 4장
   WV.ripple(host)          위에서 본 물결(동심원)
   매질은 위아래로만 진동하는 모형이에요(교과서 설명대로). 개념 이해를 위한 모형이며 수식은 화면에 쓰지 않아요. */
window.WV = (() => {
  const TAU = Math.PI * 2;
  const BLUE = '#0e63b3', ORANGE = '#f08a24', INK = '#14263b';
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---- 캔버스 · 이름표 · 반복 ---- */
  // 그림 좌표(W×H)를 칸 크기에 맞게 가운데 맞춤(contain). 남는 곳은 각 그림이 배경으로 채운다.
  function surface(host, W, H, onFit) {
    const cv = document.createElement('canvas'); cv.className = 'wvc'; host.appendChild(cv);
    const box = document.createElement('div'); box.className = 'olay'; host.appendChild(box);
    const ctx = cv.getContext('2d'); const m = { k: 1, ox: 0, oy: 0, dpr: 1 };
    function fit() {
      const r = host.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      m.k = Math.min(r.width / W, r.height / H); m.ox = (r.width - W * m.k) / 2; m.oy = (r.height - H * m.k) / 2; m.dpr = dpr;
      Object.assign(box.style, { left: m.ox + 'px', top: m.oy + 'px', width: W * m.k + 'px', height: H * m.k + 'px', right: 'auto', bottom: 'auto' });
      if (onFit) onFit();
    }
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(host); else window.addEventListener('resize', fit);
    return { cv, ctx, box, m, W, H,
      begin() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(m.dpr * m.k, 0, 0, m.dpr * m.k, m.dpr * m.ox, m.dpr * m.oy); },
      // 칸 전체(가운데 맞춤 바깥 포함)를 그림 좌표로
      full() { return [-m.ox / m.k, -m.oy / m.k, cv.width / m.dpr / m.k, cv.height / m.dpr / m.k]; },
      toLocal(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left - m.ox) / m.k, (e.clientY - r.top - m.oy) / m.k]; } };
  }
  function overlay(S) {
    const box = S.box;
    const map = {};
    return {
      box,
      put(id, x, y, html, cls = '') {
        let e = map[id]; if (!e) { e = document.createElement('span'); box.appendChild(e); map[id] = e; }
        const c = 'ol ' + cls; if (e.className !== c) e.className = c;
        if (e._h !== html) { e.innerHTML = html; e._h = html; }
        e.dataset.id = id; e.style.left = (x / S.W * 100).toFixed(2) + '%'; e.style.top = (y / S.H * 100).toFixed(2) + '%'; e.hidden = false; return e;
      },
      hide(id) { if (map[id]) map[id].hidden = true; },
      hideAll() { Object.values(map).forEach((e) => (e.hidden = true)); },
    };
  }
  const loops = new Set();
  let last = 0;
  function tick(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0); last = now;
    loops.forEach((L) => { try { if (L.host.offsetParent !== null || L.always) { const r = L.host.getBoundingClientRect(); if (r.bottom > -50 && r.top < innerHeight + 50) L.fn(dt); } } catch (e) { loops.delete(L); window.SM_err ? window.SM_err('파동 그림', e) : console.error(e); } });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  const addLoop = (host, fn) => { const L = { host, fn }; loops.add(L); return L; };

  function arrow(ctx, x1, y1, x2, y2, col, w = 4, head = 12) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * head * 0.7, y2 - Math.sin(a) * head * 0.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - Math.cos(a - 0.42) * head * 1.25, y2 - Math.sin(a - 0.42) * head * 1.25);
    ctx.lineTo(x2 - Math.cos(a + 0.42) * head * 1.25, y2 - Math.sin(a + 0.42) * head * 1.25); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function ball(ctx, x, y, r) {
    const g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.08, x, y, r * 1.05);
    g.addColorStop(0, '#fff3dc'); g.addColorStop(0.25, '#ffc070'); g.addColorStop(0.62, '#f08a24'); g.addColorStop(1, '#b65412');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(120,52,8,.35)'; ctx.lineWidth = 1; ctx.stroke();
  }
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = (c, al = 1) => `rgba(${c[0]},${c[1]},${c[2]},${al})`;

  /* ================= 물결파 수조 ================= */
  function tank(host, o = {}) {
    const W = 1000, H = 600;
    const S = surface(host, W, H), ctx = S.ctx, ov = overlay(S);
    const X0 = 70, X1 = 868, YT = 168, YB = 505, DX = 58, DY = -62;
    const YW = Math.round(YB - (YB - YT) * 2 / 3);
    const XS = o.stickX || 168, XB = o.ballX || 620;
    const st = { t: 0, run: true, speed: 1, f: o.f || 0.9, v: o.v || 230, A: o.A || 20, segs: [], dots: !!o.dots, crest: !!o.crest, guide: o.guide !== false, labels: o.labels !== false };
    let follow = null, crestFrom = null, crestMax = 0, listeners = [];
    const T = () => 1 / st.f;
    function src(tau) {
      for (const s of st.segs) if (tau >= s.t0 && tau < s.t1) return -st.A * Math.sin(TAU * st.f * (tau - s.t0));
      return 0;
    }
    const d = (x, t = st.t) => src(t - Math.abs(x - XS) / st.v);
    const tapping = () => st.segs.some((s) => s.t1 === Infinity);
    function tapOnce() { if (tapping()) return; const t0 = Math.max(st.t, ...st.segs.map((s) => s.t1)); st.segs.push({ t0, t1: t0 + T() }); st.run = true; }
    function tapStart() { if (tapping()) return; const t0 = Math.max(st.t, ...st.segs.map((s) => (s.t1 === Infinity ? 0 : s.t1))); st.segs.push({ t0, t1: Infinity }); st.run = true; }
    function tapStop() { st.segs.forEach((s) => { if (s.t1 === Infinity) s.t1 = s.t0 + Math.max(1, Math.ceil((st.t - s.t0) * st.f)) / st.f; }); }
    function reset() { st.t = 0; st.segs = []; follow = null; crestFrom = null; crestMax = 0; }
    // 마루: 막대 오른쪽으로 퍼져 나가는 마루들의 위치
    function crests() {
      const out = [];
      st.segs.forEach((s, si) => {
        const tEnd = Math.min(s.t1, st.t);
        for (let k = 0; ; k++) { const tau = s.t0 + (k + 0.75) / st.f; if (tau >= tEnd || k > 400) break; if (tau >= s.t1) break; const x = XS + st.v * (st.t - tau); if (x <= X1 - 6) out.push({ id: si + ':' + k, x }); }
      });
      return out;
    }
    function ballInfo() {
      // 탁구공에 도착한 진동 횟수(완전한 진동)
      const tl = st.t - Math.abs(XB - XS) / st.v; let n = 0, moving = false;
      st.segs.forEach((s) => { if (tl > s.t0) { const e = Math.min(tl, s.t1); n += Math.floor((e - s.t0) * st.f + 1e-6); if (tl < s.t1) moving = true; } });
      return { n, moving, arrived: st.segs.some((s) => tl > s.t0) };
    }

    function drawBg() {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f4f7fa'); g.addColorStop(0.72, '#dfe6ee'); g.addColorStop(0.72, '#cfd8e2'); g.addColorStop(1, '#bcc7d3');
      const [fx, fy, fw, fh] = S.full(); ctx.fillStyle = g; ctx.fillRect(fx, fy, fw, fh);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(fx, H * 0.72, fw, 2);
      const sh = ctx.createRadialGradient(W / 2 + 20, YB + 14, 40, W / 2 + 20, YB + 14, 520);
      sh.addColorStop(0, 'rgba(40,60,85,.32)'); sh.addColorStop(1, 'rgba(40,60,85,0)');
      ctx.save(); ctx.translate(0, YB + 14); ctx.scale(1, 0.09); ctx.translate(0, -(YB + 14)); ctx.fillStyle = sh; ctx.fillRect(0, YB - 600, W, 1200); ctx.restore();
    }
    function backGlass() {
      ctx.save(); ctx.strokeStyle = 'rgba(110,130,152,.45)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X0 + DX, YB + DY); ctx.lineTo(X0 + DX, YT + DY); ctx.lineTo(X1 + DX, YT + DY); ctx.lineTo(X1 + DX, YB + DY); ctx.lineTo(X0 + DX, YB + DY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X0, YB); ctx.lineTo(X0 + DX, YB + DY); ctx.moveTo(X0, YT); ctx.lineTo(X0 + DX, YT + DY); ctx.stroke();
      ctx.fillStyle = 'rgba(205,222,236,.35)'; ctx.beginPath(); ctx.moveTo(X0, YB); ctx.lineTo(X0 + DX, YB + DY); ctx.lineTo(X1 + DX, YB + DY); ctx.lineTo(X1, YB); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    function water() {
      const step = 3, xs = [];
      for (let x = X0; x <= X1 + 0.1; x += step) xs.push(x);
      const dv = xs.map((x) => d(x));
      // 오른쪽 옆면
      const dR = dv[dv.length - 1];
      ctx.fillStyle = 'rgba(52,140,190,.62)';
      ctx.beginPath(); ctx.moveTo(X1, YW - dR); ctx.lineTo(X1 + DX, YW + DY - dR); ctx.lineTo(X1 + DX, YB + DY); ctx.lineTo(X1, YB); ctx.closePath(); ctx.fill();
      // 수면 띠 (기울기에 따라 밝기)
      const lite = [236, 249, 255], mid = [170, 221, 240], dark = [104, 178, 214];
      for (let i = 0; i < xs.length - 1; i++) {
        const s = (dv[i + 1] - dv[i]) / step, k = Math.max(-1, Math.min(1, s * 2.2));
        const c = k > 0 ? mix(mid, lite, k) : mix(mid, dark, -k);
        ctx.fillStyle = rgb(c, 0.96);
        const xa = xs[i], xb = xs[i + 1] + 0.6;
        ctx.beginPath(); ctx.moveTo(xa, YW - dv[i]); ctx.lineTo(xa + DX, YW + DY - dv[i]); ctx.lineTo(xb + DX, YW + DY - dv[i + 1]); ctx.lineTo(xb, YW - dv[i + 1]); ctx.closePath(); ctx.fill();
      }
      // 수면 띠의 반짝임 줄 (뒤쪽 가장자리)
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.5; ctx.beginPath();
      xs.forEach((x, i) => (i ? ctx.lineTo(x + DX, YW + DY - dv[i]) : ctx.moveTo(x + DX, YW + DY - dv[i]))); ctx.stroke();
      return { xs, dv };
    }
    function frontWater(xs, dv) {
      ctx.save();
      ctx.beginPath(); xs.forEach((x, i) => (i ? ctx.lineTo(x, YW - dv[i]) : ctx.moveTo(x, YW - dv[i]))); ctx.lineTo(X1, YB); ctx.lineTo(X0, YB); ctx.closePath();
      const g = ctx.createLinearGradient(0, YW - 30, 0, YB); g.addColorStop(0, 'rgba(120,200,232,.80)'); g.addColorStop(0.5, 'rgba(66,160,210,.86)'); g.addColorStop(1, 'rgba(34,112,170,.92)');
      ctx.fillStyle = g; ctx.fill(); ctx.clip();
      // 물속 빛 무늬
      for (let r = 0; r < 4; r++) {
        const off = 26 + r * 44, al = 0.2 - r * 0.04;
        ctx.strokeStyle = `rgba(255,255,255,${al})`; ctx.lineWidth = 2.2 - r * 0.4; ctx.beginPath();
        xs.forEach((x, i) => { const y = YW - dv[i] * Math.exp(-off / 70) + off + Math.sin(x / 37 + r * 1.7 + st.t * 0.8) * 3; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      }
      ctx.restore();
      // 앞면 수면선
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.4; ctx.beginPath();
      xs.forEach((x, i) => (i ? ctx.lineTo(x, YW - dv[i]) : ctx.moveTo(x, YW - dv[i]))); ctx.stroke();
      ctx.strokeStyle = 'rgba(20,90,140,.35)'; ctx.lineWidth = 1; ctx.beginPath();
      xs.forEach((x, i) => (i ? ctx.lineTo(x, YW - dv[i] + 3) : ctx.moveTo(x, YW - dv[i] + 3))); ctx.stroke();
    }
    function particles() {
      // 수면 가운데 줄의 물 알갱이 + 물속 알갱이(깊을수록 조금 진동)
      const rows = [[DY / 2, 1, 5.6], [-22 - DY / 2 + 40, 0.55, 4.2], [-22 - DY / 2 + 104, 0.25, 3.6]];
      ctx.save();
      for (let x = X0 + 26; x < X1 - 8; x += 36) {
        if (Math.abs(x - XB) < 20 || Math.abs(x - XS) < 24) continue;
        rows.forEach(([off, k, r], ri) => {
          const px = ri === 0 ? x + DX / 2 : x, base = ri === 0 ? YW + DY / 2 : YW + off;
          const y = base - d(x) * k;
          if (st.guide && ri === 0) { ctx.strokeStyle = 'rgba(20,38,59,.28)'; ctx.lineWidth = 1.4; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(px, base - st.A - 6); ctx.lineTo(px, base + st.A + 6); ctx.stroke(); ctx.setLineDash([]); }
          ctx.fillStyle = ri === 0 ? '#ffffff' : 'rgba(255,255,255,.75)'; ctx.strokeStyle = ri === 0 ? '#1d5d8a' : 'rgba(20,80,130,.55)'; ctx.lineWidth = ri === 0 ? 2 : 1.4;
          ctx.beginPath(); ctx.arc(px, y, r, 0, TAU); ctx.fill(); ctx.stroke();
        });
      }
      ctx.restore();
    }
    function stick() {
      const x = XS + DX / 2, sd = src(st.t), tip = YW + DY / 2 - sd + 18, w = 18;
      const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, '#7f8b98'); g.addColorStop(0.35, '#e6ebf0'); g.addColorStop(0.6, '#b8c2cc'); g.addColorStop(1, '#6f7b88');
      const top = S.full()[1] - 4; ctx.fillStyle = g; ctx.fillRect(x - w / 2, top, w, tip - top);
      ctx.strokeStyle = 'rgba(30,45,60,.55)'; ctx.lineWidth = 1;
      for (let y = tip - 6; y > top; y -= 9) { ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2 + ((Math.round((tip - y) / 9) % 5) ? 5 : 9), y); ctx.stroke(); }
      // 물에 잠긴 부분
      const ws = YW + DY / 2 - d(XS + 1);
      if (tip > ws) { ctx.fillStyle = 'rgba(80,170,215,.5)'; ctx.fillRect(x - w / 2, ws, w, tip - ws); }
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, ws, w * 0.85, 4, 0, 0, TAU); ctx.stroke();
      return { x, tip };
    }
    function drawBall() {
      const r = 21, x = XB + DX / 2, ws = YW + DY / 2 - d(XB), y = ws - r * 0.4;
      ctx.fillStyle = 'rgba(20,70,110,.22)'; ctx.beginPath(); ctx.ellipse(x + 8, ws + 3, r * 1.15, 6, 0, 0, TAU); ctx.fill();
      ball(ctx, x, y, r);
      ctx.save(); ctx.beginPath(); ctx.rect(x - r - 2, ws, 2 * r + 4, r * 2); ctx.clip();
      ctx.fillStyle = 'rgba(90,180,222,.55)'; ctx.beginPath(); ctx.arc(x, y, r + 0.5, 0, TAU); ctx.fill(); ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, ws, r * 1.02, 4.5, 0, 0, TAU); ctx.stroke();
      return { x, y, ws };
    }
    function frontGlass() {
      ctx.save();
      const g = ctx.createLinearGradient(X0, 0, X1, 0); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(0.12, 'rgba(255,255,255,.04)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(0.88, 'rgba(255,255,255,.05)'); g.addColorStop(1, 'rgba(255,255,255,.2)');
      ctx.fillStyle = g; ctx.fillRect(X0, YT, X1 - X0, YB - YT);
      ctx.fillStyle = 'rgba(255,255,255,.13)'; ctx.beginPath(); ctx.moveTo(X0 + 60, YT); ctx.lineTo(X0 + 120, YT); ctx.lineTo(X0 + 40, YB); ctx.lineTo(X0 - 20 + 20, YB); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 3; ctx.strokeRect(X0, YT, X1 - X0, YB - YT);
      ctx.strokeStyle = 'rgba(96,118,140,.55)'; ctx.lineWidth = 1.2; ctx.strokeRect(X0 - 2, YT - 2, X1 - X0 + 4, YB - YT + 4);
      ctx.beginPath(); ctx.moveTo(X1, YT); ctx.lineTo(X1 + DX, YT + DY); ctx.lineTo(X1 + DX, YB + DY); ctx.lineTo(X1, YB); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X0, YT); ctx.lineTo(X0 + DX, YT + DY); ctx.lineTo(X1 + DX, YT + DY); ctx.lineTo(X1, YT); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.stroke();
      const b = ctx.createLinearGradient(0, YB, 0, YB + 12); b.addColorStop(0, '#d9e3ec'); b.addColorStop(1, '#9fb0c1');
      ctx.fillStyle = b; ctx.fillRect(X0 - 3, YB, X1 - X0 + 6, 10);
      ctx.restore();
    }
    function draw() {
      S.begin();
      drawBg(); backGlass();
      const { xs, dv } = water();
      if (st.dots) particles();
      const sk = stick();
      const bl = drawBall();
      frontWater(xs, dv);
      frontGlass();
      // 탁구공 제자리 표시
      const bi = ballInfo();
      if (st.guide) {
        ctx.save(); ctx.strokeStyle = 'rgba(20,38,59,.5)'; ctx.lineWidth = 1.6; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(bl.x, YT + DY + 4); ctx.lineTo(bl.x, bl.y - 30); ctx.stroke(); ctx.setLineDash([]);
        const yc = YW + DY / 2 - 21 * 0.4;
        ctx.strokeStyle = 'rgba(20,38,59,.55)'; ctx.lineWidth = 2;
        [yc - st.A, yc + st.A].forEach((yy) => { ctx.beginPath(); ctx.moveTo(bl.x + 30, yy); ctx.lineTo(bl.x + 44, yy); ctx.stroke(); });
        ctx.beginPath(); ctx.moveTo(bl.x + 37, yc - st.A); ctx.lineTo(bl.x + 37, yc + st.A); ctx.stroke();
        ctx.restore();
        if (bi.moving) {
          const tl = st.t - Math.abs(XB - XS) / st.v, vel = src(tl + 0.02) - src(tl);
          if (Math.abs(vel) > 0.3) arrow(ctx, bl.x - 36, bl.y + (vel > 0 ? 14 : -14), bl.x - 36, bl.y + (vel > 0 ? -18 : 18), ORANGE, 4.5, 10);
        }
      }
      // 마루 따라가기
      const cr = crests();
      let fx = null;
      if (st.crest && cr.length) {
        let c = follow && cr.find((q) => q.id === follow);
        if (!c) { c = cr.filter((q) => q.x > XS + 40).sort((a, b) => a.x - b.x)[0]; if (c) { follow = c.id; crestFrom = c.x; } }
        if (c) {
          fx = c.x; const px = c.x + DX / 2, py = YW + DY / 2 - st.A;
          ctx.save(); ctx.strokeStyle = BLUE; ctx.lineWidth = 3; ctx.setLineDash([2, 7]); ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(crestFrom + DX / 2, YT + DY - 38); ctx.lineTo(px, YT + DY - 38); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(crestFrom + DX / 2, YT + DY - 38, 5, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.moveTo(px, py - 8); ctx.lineTo(px - 11, py - 28); ctx.lineTo(px + 11, py - 28); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(14,99,179,.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, py - 28); ctx.lineTo(px, YT + DY - 38); ctx.stroke();
          ctx.restore();
        }
      }
      // 이름표
      if (st.labels) {
        ov.put('stick', sk.x - 16, YT + DY - 4, '막대', 'ink la');
        ov.put('ball', bl.x + 50, YW + DY / 2 - 21 * 0.4, '탁구공', 'ink ra');
        if (fx !== null) ov.put('crest', fx + DX / 2, YT + DY - 62, '마루', 'key'); else ov.hide('crest');
        if (st.dots) ov.put('dots', X0 + 14, YB - 18, '하얀 점: 물(매질)의 한 부분', 'ink ra sm'); else ov.hide('dots');
      }
      if (fx !== null) crestMax = Math.max(crestMax, fx - crestFrom);
      const out = { t: st.t, ball: bi, crestTravel: crestMax, ballDx: 0, tapping: tapping(), busy: tapping() || st.segs.some((s) => st.t < s.t1 + (X1 - XS) / st.v) };
      listeners.forEach((f) => f(out));
    }
    addLoop(host, (dt) => { if (st.run && !reduce) st.t += dt * st.speed; else if (st.run && reduce) st.t += dt * st.speed * 0.6; draw(); });
    draw();
    return {
      st, tapOnce, tapStart, tapStop, reset, draw, tapping, ballInfo,
      set(p) { Object.assign(st, p); if ('crest' in p && !p.crest) { follow = null; } },
      restartCrest() { follow = null; },
      onFrame(f) { listeners.push(f); },
      snap(t) { const k = st.t; st.t = t; draw(); st.t = k; },
    };
  }

  /* ================= 파동의 요소 그림 (모눈) ================= */
  function graph(host, o = {}) {
    const W = o.W || 1000, H = o.H || 440, C = o.cell || 40, Y0 = H / 2, XL = o.xl ?? 20, XR = W - (o.xr ?? 20);
    const S = surface(host, W, H), ctx = S.ctx, ov = overlay(S);
    const st = Object.assign({ t: 0, run: true, speed: 1, f: 1, lam: 6, A: 2, beads: true, hi: 'hi' in o ? o.hi : 12, anno: {}, ghost: null, marks: [], dir: true, grid: true, area: true, phase0: 0 }, o);
    const disp = (x, p = st, t = st.t) => p.A * C * Math.sin(TAU * ((x - XL) / (p.lam * C) - p.f * t) + st.phase0);
    const listeners = [];
    // 마루·골 위치 (화면 안)
    function extremes(kind, p = st, t = st.t) {
      const L = p.lam * C, out = []; const base = kind === 'crest' ? 0.25 : 0.75;
      const s0 = (base - st.phase0 / TAU + p.f * t);
      const frac = s0 - Math.floor(s0);
      for (let x = XL + frac * L - L; x <= XR + 1; x += L) if (x >= XL - 1) out.push(x);
      return out;
    }
    function pathOf(p, t) { ctx.beginPath(); for (let x = XL; x <= XR; x += 2) { const y = Y0 - disp(x, p, t); x === XL ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } }
    function draw() {
      S.begin();
      const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#fbfdff'); bg.addColorStop(1, '#f1f6fb'); ctx.fillStyle = bg; ctx.fillRect(...S.full());
      if (st.grid) {
        ctx.strokeStyle = 'rgba(14,99,179,.09)'; ctx.lineWidth = 1; ctx.beginPath();
        const [gx, gy, gw, gh] = S.full();
        for (let x = XL - Math.ceil((XL - gx) / C) * C; x <= gx + gw; x += C) { ctx.moveTo(x, gy); ctx.lineTo(x, gy + gh); }
        for (let y = Y0 - Math.ceil((Y0 - gy) / C) * C; y <= gy + gh; y += C) { ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); }
        ctx.stroke();
      }
      // 진동 중심
      ctx.save(); ctx.strokeStyle = 'rgba(20,38,59,.55)'; ctx.lineWidth = 1.6; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(XL, Y0); ctx.lineTo(XR, Y0); ctx.stroke(); ctx.restore();
      // 목표 파동
      if (st.ghost) {
        ctx.save(); ctx.strokeStyle = 'rgba(52,73,94,.55)'; ctx.lineWidth = 5; ctx.setLineDash([10, 9]); ctx.lineCap = 'round'; pathOf(st.ghost, st.t); ctx.stroke(); ctx.restore();
        const hx = XL + st.hi * C, hy = Y0 - disp(hx, st.ghost);
        ctx.strokeStyle = 'rgba(52,73,94,.75)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, hy, 11, 0, TAU); ctx.stroke();
      }
      // 물결 몸통
      if (st.area) {
        ctx.save(); pathOf(st, st.t); ctx.lineTo(XR, S.full()[1] + S.full()[3]); ctx.lineTo(XL, S.full()[1] + S.full()[3]); ctx.closePath();
        const g = ctx.createLinearGradient(0, Y0 - st.A * C, 0, H); g.addColorStop(0, 'rgba(120,196,236,.42)'); g.addColorStop(1, 'rgba(120,196,236,.06)');
        ctx.fillStyle = g; ctx.fill(); ctx.restore();
      }
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(14,99,179,.18)'; ctx.lineWidth = 12; pathOf(st, st.t); ctx.stroke();
      ctx.strokeStyle = BLUE; ctx.lineWidth = 5; pathOf(st, st.t); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.4; ctx.translate(0, -1.6); pathOf(st, st.t); ctx.stroke();
      ctx.restore();
      // 매질 알갱이
      if (st.beads) {
        for (let i = 0; XL + i * C <= XR; i++) {
          const x = XL + i * C, y = Y0 - disp(x);
          if (i === st.hi) continue;
          ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(14,99,179,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 5.5, 0, TAU); ctx.fill(); ctx.stroke();
        }
      }
      // 빨간 점(따라가는 매질)
      if (st.hi !== null && st.hi !== undefined) {
        const x = XL + st.hi * C, y = Y0 - disp(x), Am = st.A * C;
        ctx.save(); ctx.strokeStyle = 'rgba(240,138,36,.55)'; ctx.lineWidth = 2; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(x, Y0 - Am - 8); ctx.lineTo(x, Y0 + Am + 8); ctx.stroke(); ctx.setLineDash([]);
        [Y0 - Am, Y0 + Am].forEach((yy) => { ctx.beginPath(); ctx.moveTo(x - 9, yy); ctx.lineTo(x + 9, yy); ctx.stroke(); }); ctx.restore();
        const sh = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 11); sh.addColorStop(0, '#ffd8a8'); sh.addColorStop(0.5, ORANGE); sh.addColorStop(1, '#b65412');
        ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill();
        if (st.anno.vib) {
          const vel = disp(x, st, st.t + 0.01) - disp(x);
          if (st.run && Math.abs(vel) > 0.05 * st.A * C * st.f / 2) arrow(ctx, x + 24, y + (vel > 0 ? 16 : -16), x + 24, y + (vel > 0 ? -18 : 18), ORANGE, 4, 9);
          else if (!st.run) { arrow(ctx, x + 22, y - 4, x + 22, y - 34, ORANGE, 3.5, 8); arrow(ctx, x + 22, y + 4, x + 22, y + 34, ORANGE, 3.5, 8); }
        }
      }
      // 표시들
      const a = st.anno, cr = extremes('crest'), tr = extremes('trough'), L = st.lam * C, Am = st.A * C;
      const c1 = cr.find((x) => x > XL + 30 && x + L < XR - 10);
      ['cr0', 'cr1', 'tr0', 'lam', 'amp', 'amp2', 'mid', 'dir', 'vib'].forEach((k) => ov.hide(k));
      if (a.crest && c1 !== undefined) { ov.put('cr0', c1, Y0 - Am - 26, a.crestTxt || '마루', (a.clsOf && a.clsOf.crest) || 'key'); if (c1 + L < XR && !a.one) ov.put('cr1', c1 + L, Y0 - Am - 26, a.crestTxt || '마루', a.cls || 'key'); }
      const t1 = tr.find((x) => x > (c1 ?? XL) && x < XR - 10);
      if (a.trough && t1 !== undefined) ov.put('tr0', t1, Y0 + Am + 28, a.troughTxt || '골', (a.clsOf && a.clsOf.trough) || 'key');
      if (a.lam && c1 !== undefined) {
        const yy = Y0 - Am - 58; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
        ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(c1, Y0 - Am - 4); ctx.lineTo(c1, yy - 8); ctx.moveTo(c1 + L, Y0 - Am - 4); ctx.lineTo(c1 + L, yy - 8); ctx.stroke(); ctx.setLineDash([]);
        arrow(ctx, c1 + L / 2, yy, c1 + 3, yy, INK, 2.5, 9); arrow(ctx, c1 + L / 2, yy, c1 + L - 3, yy, INK, 2.5, 9); ctx.restore();
        ov.put('lam', c1 + L / 2, yy, a.lamTxt || '파장', (a.clsOf && a.clsOf.lam) || 'ink');
      }
      if (a.amp && c1 !== undefined) {
        const xa = c1 + L - (st.lam > 3 ? 0 : 0);
        ctx.save(); arrow(ctx, xa, Y0, xa, Y0 - Am + 3, INK, 2.5, 9);
        if (t1 !== undefined) arrow(ctx, t1, Y0, t1, Y0 + Am - 3, INK, 2.5, 9); ctx.restore();
        ov.put('amp', xa + 12, Y0 - Am / 2, a.ampTxt || '진폭', ((a.clsOf && a.clsOf.amp) || 'ink') + ' ra');
        if (t1 !== undefined && !a.one) ov.put('amp2', t1 + 12, Y0 + Am / 2, a.ampTxt || '진폭', ((a.clsOf && a.clsOf.amp) || 'ink') + ' ra');
      }
      if (a.mid) ov.put('mid', XR + 10, Y0, a.midTxt || '진동 중심', ((a.clsOf && a.clsOf.mid) || 'inks') + ' ra');
      if (a.dir) {
        ctx.save(); const ya = 34; arrow(ctx, XL + 14, ya, XL + 120, ya, BLUE, 7, 13); ctx.restore();
        ov.put('dir', XL + 132, ya, '파동의 진행 방향', 'inkb ra');
      }
      if (a.vib && st.hi != null) ov.put('vib', XL + st.hi * C + 40, Y0 - Am - 34 < 60 ? Y0 + Am + 34 : Y0 - Am - 34, '매질의 진동 방향', 'ink ra');
      // 누른 곳 표시
      st.marks.forEach((m) => {
        ctx.save(); ctx.strokeStyle = m.ok ? '#1f9d5c' : '#d9534f'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(m.x, m.y, 20, 0, TAU); ctx.stroke(); ctx.restore();
      });
      listeners.forEach((f) => f(st));
    }
    addLoop(host, (dt) => { if (st.run) st.t += dt * st.speed * (reduce ? 0.6 : 1); draw(); });
    draw();
    return {
      st, draw, extremes, disp, C, Y0, XL, XR, W, H, ov,
      set(p) { Object.assign(st, p); draw(); },
      onFrame(f) { listeners.push(f); },
      hiY(t) { const x = XL + st.hi * C; return disp(x, st, t); },
      // 누른 곳: 가장 가까운 마루·골
      hit(e) {
        const [x, y] = S.toLocal(e), L = st.lam * C, Am = st.A * C;
        const best = (kind) => extremes(kind).reduce((b, cx) => (Math.abs(cx - x) < Math.abs(b - x) ? cx : b), -1e9);
        const c = best('crest'), t = best('trough');
        if (Math.abs(c - x) < L * 0.16 && Math.abs(y - (Y0 - Am)) < 46) return { kind: 'crest', x: c, y: Y0 - Am };
        if (Math.abs(t - x) < L * 0.16 && Math.abs(y - (Y0 + Am)) < 46) return { kind: 'trough', x: t, y: Y0 + Am };
        return { kind: null, x, y };
      },
      canvas: S.cv,
    };
  }

  /* ================= 빨간 점 높이 기록 (시간) ================= */
  function timeline(host, G, o = {}) {
    const W = 1000, H = o.H || 190, XA = 70, XZ = 960, SEC = (XZ - XA) / 2, Y0 = H / 2 - 2, AMP = (H / 2 - 36);
    const S = surface(host, W, H), ctx = S.ctx, ov = overlay(S);
    const st = { on: false, wait: false, t0: 0, tau: 0, f: 1, pts: [], done: false };
    const listeners = [];
    function start() { clear(); st.wait = true; st.f = G.st.f; }
    function clear() { st.tStar = undefined; st.on = false; st.wait = false; st.pts = []; st.tau = 0; st.done = false; for (let k = 0; k < 8; k++) ov.hide('c' + k); }
    function draw() {
      S.begin();
      ctx.fillStyle = '#fbfdff'; ctx.fillRect(...S.full());
      // 1초 칸
      ctx.fillStyle = 'rgba(14,99,179,.06)'; ctx.fillRect(XA, 16, SEC, H - 32);
      ctx.strokeStyle = 'rgba(20,38,59,.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(XA, Y0); ctx.lineTo(XZ, Y0); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(20,38,59,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(XA, 14); ctx.lineTo(XA, H - 14); ctx.stroke();
      [0, 0.5, 1, 1.5, 2].forEach((s) => { const x = XA + s * SEC; ctx.strokeStyle = s === 1 ? INK : 'rgba(20,38,59,.3)'; ctx.lineWidth = s === 1 ? 2.4 : 1; ctx.beginPath(); ctx.moveTo(x, 14); ctx.lineTo(x, H - 14); ctx.stroke(); });
      // 주기 칸
      if (st.on || st.done) {
        const T = 1 / st.f, n = Math.floor(2 * st.f + 1e-6);
        for (let k = 0; k < n; k++) {
          const xa = XA + k * T * SEC, xb = XA + (k + 1) * T * SEC; if (st.tau < (k + 1) * T - 1e-6) break;
          ctx.fillStyle = k % 2 ? 'rgba(240,138,36,.10)' : 'rgba(240,138,36,.18)'; ctx.fillRect(xa, 18, xb - xa, H - 36);
          ov.put('c' + k, (xa + xb) / 2, 34, (xb - xa > 150 ? `${k + 1}번째 진동 · ${+(T).toFixed(2)}초` : `${k + 1}번`), 'tk b');
        }
        for (let k = n; k < 8; k++) ov.hide('c' + k);
        for (let k = 0; k < n; k++) if (st.tau < (k + 1) * T - 1e-6) ov.hide('c' + k);
      }
      // 기록 선
      if (st.pts.length > 1) {
        ctx.save(); ctx.strokeStyle = ORANGE; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath();
        st.pts.forEach(([tau, y], i) => { const x = XA + tau * SEC, yy = Y0 - y * AMP; i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }); ctx.stroke();
        const [lt, ly] = st.pts[st.pts.length - 1]; const g = ctx.createRadialGradient(XA + lt * SEC - 2, Y0 - ly * AMP - 2, 1, XA + lt * SEC, Y0 - ly * AMP, 9); g.addColorStop(0, '#ffd8a8'); g.addColorStop(1, '#c85e14');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(XA + lt * SEC, Y0 - ly * AMP, 8, 0, TAU); ctx.fill(); ctx.restore();
        // 마루 순간 점
        const T = 1 / st.f;
        for (let k = 0; k * T <= st.tau + 1e-6 && k * T <= 2 + 1e-6; k++) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(XA + k * T * SEC, Y0 - AMP, 5, 0, TAU); ctx.fill(); }
      }
      ov.put('s0', XA, H - 2, '0초', 'tk'); ov.put('s1', XA + SEC, H - 2, '1초', 'tk b'); ov.put('s2', XZ, H - 2, '2초', 'tk');
      ov.put('hi', XA - 8, Y0 - AMP, '마루', 'tk la'); ov.put('lo', XA - 8, Y0 + AMP, '골', 'tk la');
      if (st.wait) ov.put('msg', (XA + XZ) / 2, Y0, '빨간 점이 마루에 올 때 시작해요', 'ink'); else if (!st.on && !st.done) ov.put('msg', (XA + XZ) / 2, Y0, '‘2초 재기’를 누르면 빨간 점의 높이를 기록해요', 'inks'); else ov.hide('msg');
    }
    G.onFrame(() => {
      const A = G.st.A * G.C, y = G.hiY(G.st.t) / A;
      if (st.wait) {
        // 빨간 점이 다음에 마루가 되는 때부터 잰다
        if (st.tStar === undefined) {
          const x = G.XL + G.st.hi * G.C, s0 = (x - G.XL) / (G.st.lam * G.C) + G.st.phase0 / TAU - 0.25;
          const n = Math.ceil(G.st.t * G.st.f - s0 - 1e-9); st.tStar = (s0 + n) / G.st.f;
        }
        if (G.st.t >= st.tStar) { st.wait = false; st.on = true; st.t0 = st.tStar; st.tStar = undefined; st.f = G.st.f; st.pts = [[0, 1]]; }
      } else if (st.on) {
        st.tau = G.st.t - st.t0;
        if (st.tau >= 2) { st.tau = 2; st.on = false; st.done = true; st.pts.push([2, G.hiY(st.t0 + 2) / A]); listeners.forEach((f) => f('done', st)); }
        else st.pts.push([st.tau, y]);
      }
      draw();
    });
    draw();
    return { st, start, clear, onDone(f) { listeners.push(f); } };
  }

  /* ================= 그림 Ⅲ-12 차례 사진 4장 ================= */
  function strip(host, o = {}) {
    const W = 600, H = 560, rows = 4, RH = H / rows, L = 300, A = 26, XL = 20, XR = 560, XP = 470;
    const S = surface(host, W, H, () => requestAnimationFrame(() => draw())), ctx = S.ctx, ov = overlay(S);
    function yAt(x, k, r) { return r * RH + RH / 2 + 8 - A * Math.sin(TAU * ((x - XL) / L - k / 4)); }
    function draw() {
      S.begin(); ctx.fillStyle = '#fbfdff'; ctx.fillRect(...S.full());
      for (let r = 0; r < rows; r++) {
        const y0 = r * RH;
        const [fx0, , fw0] = S.full(); ctx.fillStyle = r % 2 ? '#f6f9fc' : '#fbfdff'; ctx.fillRect(fx0, y0, fw0, RH);
        ctx.save(); ctx.beginPath(); for (let x = XL; x <= XR; x += 3) { const y = yAt(x, r, r); x === XL ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.lineTo(XR, y0 + RH - 4); ctx.lineTo(XL, y0 + RH - 4); ctx.closePath();
        const g = ctx.createLinearGradient(0, y0 + RH / 2 - A, 0, y0 + RH); g.addColorStop(0, '#9fd6ef'); g.addColorStop(1, '#4aa2d4'); ctx.fillStyle = g; ctx.fill(); ctx.restore();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath(); for (let x = XL; x <= XR; x += 3) { const y = yAt(x, r, r); x === XL ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
        ctx.strokeStyle = 'rgba(20,38,59,.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(fx0, y0 + RH); ctx.lineTo(fx0 + fw0, y0 + RH); ctx.stroke();
        // 매질 점과 진동 방향
        const py = yAt(XP, r, r);
        ctx.strokeStyle = 'rgba(20,38,59,.35)'; ctx.setLineDash([3, 4]); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(XP, y0 + RH / 2 + 8 - A - 6); ctx.lineTo(XP, y0 + RH / 2 + 8 + A + 6); ctx.stroke(); ctx.setLineDash([]);
        ball(ctx, XP, py - 2, 11);
        const ph = ((XP - XL) / L - r / 4), vel = Math.cos(TAU * ph); // 위로 가면 +
        if (Math.abs(vel) > 0.2) arrow(ctx, XP - 26, py + (vel > 0 ? 10 : -10), XP - 26, py + (vel > 0 ? -20 : 20), ORANGE, 3.5, 8);
        ov.put('n' + r, 22, y0 + 18, ['①', '②', '③', '④'][r], 'nb ra');
      }
      // 마루를 잇는 점선
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
      ctx.beginPath(); for (let r = 0; r < rows; r++) { const x = XL + L * (0.25 + r / 4); const y = r * RH + RH / 2 + 8 - A - 8; r ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.setLineDash([]);
      for (let r = 0; r < rows; r++) { const x = XL + L * (0.25 + r / 4), y = r * RH + RH / 2 + 8 - A; ctx.fillStyle = BLUE; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x - 8, y - 20); ctx.lineTo(x + 8, y - 20); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
    draw();
    return { draw };
  }

  /* ================= 위에서 본 물결 ================= */
  function ripple(host, o = {}) {
    const W = o.W || 1000, H = o.H || 600, cx = o.cx || 300, cy = o.cy || 300, f = 0.9, v = 150;
    const S = surface(host, W, H), ctx = S.ctx, ov = overlay(S);
    let t = 0;
    const BX = o.bx || 700, BY = o.by || 330;
    function draw() {
      S.begin();
      const g = ctx.createRadialGradient(W * 0.5, H * 0.3, 40, W * 0.5, H * 0.5, W * 0.8); g.addColorStop(0, '#5fb6dc'); g.addColorStop(1, '#1f6f9e');
      ctx.fillStyle = g; ctx.fillRect(...S.full());
      const L = v / f, rmax = Math.hypot(W, H);
      for (let k = 0; ; k++) {
        const r = v * t - k * L - L * 0.75; if (r > rmax) continue; if (r < 0) break;
        const al = Math.max(0, 1 - r / (W * 0.9));
        ctx.lineWidth = 16; ctx.strokeStyle = `rgba(255,255,255,${0.32 * al})`; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
        ctx.lineWidth = 3; ctx.strokeStyle = `rgba(255,255,255,${0.75 * al})`; ctx.beginPath(); ctx.arc(cx - 2, cy - 3, r, 0, TAU); ctx.stroke();
        ctx.lineWidth = 12; ctx.strokeStyle = `rgba(8,52,84,${0.22 * al})`; ctx.beginPath(); ctx.arc(cx + 2, cy + 3, r + L / 2, 0, TAU); ctx.stroke();
      }
      // 두드리는 곳
      const pulse = Math.sin(TAU * f * t);
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(cx, cy, 7 + pulse * 2, 0, TAU); ctx.fill();
      // 탁구공: 제자리에서 오르내림(크기·그림자 변화로 표현)
      const r0 = Math.hypot(BX - cx, BY - cy), tl = t - r0 / v, h = tl > 0 ? Math.sin(TAU * f * tl - TAU * 0.75) : 0;
      ctx.fillStyle = 'rgba(0,30,50,.28)'; ctx.beginPath(); ctx.ellipse(BX + 6 + h * 3, BY + 7 + h * 3, 20, 17, 0, 0, TAU); ctx.fill();
      ball(ctx, BX, BY, 19 + h * 2.2);
      ov.put('b', BX, BY - 44, '탁구공', 'ink'); ov.put('s', cx, cy + 34, '두드리는 곳', 'ink');
    }
    addLoop(host, (dt) => { t += dt * (reduce ? 0.5 : 1); draw(); });
    draw();
    return { draw };
  }

  return { surface, overlay, arrow, ball, tank, graph, timeline, strip, ripple, BLUE, ORANGE, INK };
})();
