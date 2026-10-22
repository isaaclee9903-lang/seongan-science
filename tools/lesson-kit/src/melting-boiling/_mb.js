/* ===== 녹는점과 끓는점 그림 도구 (캔버스 2D, SOL._ 도구를 빌려 씀) =====
   MB.pots(host, {demo})     작은 찻주전자와 큰 솥: 물이 끓는 온도 비교 (도입 질문)
   MB.boil(host)             끓는점 실험실(교과서 탐구): 조건 A·B 삼각 플라스크, C·D 가지 달린 시험관 물중탕 + 스마트 기기 그래프
   MB.melt(host)             녹는점 실험실(그림 Ⅰ-8): 뜨거운 물 속 시험관의 로르산·팔미트산 + 온도-시간 그래프
   MB.mgraph(host)           그림 Ⅰ-8 그래프만 그리기 (읽기)
   MB.ladder(host, {items, rise})  그림 Ⅰ-7(띠)·Ⅰ-9(오르는 곡선): 여러 가지 물질의 끓는점·녹는점, 눌러서 강조
   MB.atlas(host, {onT, onSel})    신기한 물질 도감: 물질마다 고체·액체·기체 구간 막대 + 끌 수 있는 온도 선
   그림 원칙: 흰 바탕, 라스 파랑 한 색조 + 무채색, 매트한 질감, 얇은 선. 그림 속 글씨는 HTML 이름표.
   가열 시간, 기포 수, 화면 속 빠르기는 보기 좋게 정한 모형. 끓는점·녹는점 값은 교과서 값. */
window.MB = (() => {
  const U = SOL._;
  const { surface, overlay, addLoop, tweens, rr, white, desk, contact, glassFront, tubeShape, tubeBack, tubeFront, clamp, lerp, ease, eOut, gauss, TAU, BLUE, INK, reduce, rng } = U;
  const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1);

  /* ---- 실험 기구 ---- */
  function hotplate(ctx, cx, top, heat, w = 230) {
    const bh = 62;
    contact(ctx, cx, top + bh + 8, w + 50, 0.22);
    let g = ctx.createLinearGradient(0, top + 8, 0, top + bh + 8); g.addColorStop(0, '#fbfcfd'); g.addColorStop(1, '#d6dde5');
    ctx.fillStyle = g; rr(ctx, cx - w / 2, top + 8, w, bh, 12); ctx.fill(); ctx.strokeStyle = 'rgba(20,38,59,.14)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(20,38,59,.06)'; rr(ctx, cx - w / 2 + 6, top + bh - 2, w - 12, 8, 4); ctx.fill();
    ctx.fillStyle = '#2a323b'; ctx.beginPath(); ctx.ellipse(cx, top + 8, w / 2 - 10, 12, 0, 0, TAU); ctx.fill();
    g = ctx.createLinearGradient(0, top - 6, 0, top + 8); g.addColorStop(0, '#56616c'); g.addColorStop(1, '#1d242b');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, top + 3, w / 2 - 14, 10, 0, 0, TAU); ctx.fill();
    const ky = top + 8 + bh / 2 + 2;
    g = ctx.createRadialGradient(cx + w / 2 - 50, ky - 5, 2, cx + w / 2 - 48, ky, 17); g.addColorStop(0, '#5b6570'); g.addColorStop(1, '#171d23');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx + w / 2 - 48, ky, 16, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + w / 2 - 48, ky - 12); ctx.lineTo(cx + w / 2 - 48, ky - 5); ctx.stroke();
    ctx.fillStyle = heat > 0.01 ? BLUE : '#c3ccd6'; ctx.beginPath(); ctx.arc(cx - w / 2 + 40, ky, 6, 0, TAU); ctx.fill();
  }
  function stand(ctx, px, baseY, topY, x0, x1) {
    contact(ctx, (x0 + x1) / 2, baseY + 2, x1 - x0 + 40, 0.2);
    let g = ctx.createLinearGradient(0, baseY - 14, 0, baseY); g.addColorStop(0, '#4b5561'); g.addColorStop(1, '#262d35');
    ctx.fillStyle = g; rr(ctx, x0, baseY - 14, x1 - x0, 14, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x0 + 4, baseY - 13, x1 - x0 - 8, 1.5);
    g = ctx.createLinearGradient(px - 5, 0, px + 5, 0); g.addColorStop(0, '#9aa5b1'); g.addColorStop(0.45, '#f3f6f8'); g.addColorStop(1, '#7d8894');
    ctx.fillStyle = g; ctx.fillRect(px - 5, topY, 10, baseY - 14 - topY);
    ctx.fillStyle = '#7d8894'; ctx.beginPath(); ctx.ellipse(px, topY, 5, 2, 0, 0, TAU); ctx.fill();
  }
  function clampArm(ctx, px, y, x2, jaw = 14) {
    let g = ctx.createLinearGradient(0, y - 4, 0, y + 4); g.addColorStop(0, '#d9dfe5'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#8e99a5');
    ctx.fillStyle = g; ctx.fillRect(px, y - 3.5, x2 - px - jaw, 7);
    g = ctx.createLinearGradient(0, y - 10, 0, y + 10); g.addColorStop(0, '#5d6874'); g.addColorStop(1, '#2b333c');
    ctx.fillStyle = g; rr(ctx, px - 11, y - 10, 22, 20, 4); ctx.fill();
    ctx.fillStyle = '#3a434d'; ctx.beginPath(); ctx.arc(px - 16, y, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = g; rr(ctx, x2 - jaw - 6, y - 8, 10, 16, 3); ctx.fill();
  }
  // 집게 턱(물체 양옆을 무는 고무)
  function jaws(ctx, cx, y, half) {
    ctx.fillStyle = '#3a434d'; rr(ctx, cx - half - 9, y - 9, 9, 18, 3); ctx.fill(); rr(ctx, cx + half, y - 9, 9, 18, 3); ctx.fill();
    ctx.fillStyle = '#7d8894'; ctx.fillRect(cx - half - 22, y - 2, 14, 4);
  }
  // 온도 센서(스마트 기기 연결): 몸통 + 긴 탐침
  function sensor(ctx, x, top, tip) {
    ctx.strokeStyle = '#2a323b'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, top + 4); ctx.bezierCurveTo(x - 10, top - 30, x + 40, top - 46, x + 70, top - 40); ctx.stroke();
    let g = ctx.createLinearGradient(x - 18, 0, x + 18, 0); g.addColorStop(0, '#4f8fd0'); g.addColorStop(0.5, '#7fb2e3'); g.addColorStop(1, '#3a78ba');
    ctx.fillStyle = g; rr(ctx, x - 17, top, 34, 64, 8); ctx.fill();
    ctx.fillStyle = '#18222d'; rr(ctx, x - 12, top + 9, 24, 13, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(x, top + 40, 6, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(20,38,59,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, top + 40, 6, 0, TAU); ctx.stroke();
    g = ctx.createLinearGradient(x - 3, 0, x + 3, 0); g.addColorStop(0, '#9aa5b1'); g.addColorStop(0.5, '#f4f7f9'); g.addColorStop(1, '#7d8894');
    ctx.fillStyle = g; ctx.fillRect(x - 2.5, top + 64, 5, tip - top - 64);
    ctx.fillStyle = '#7d8894'; ctx.beginPath(); ctx.arc(x, tip, 2.5, 0, Math.PI); ctx.fill();
  }
  // 디지털 온도계(녹는점 실험): 흰 몸통 + 화면 + 탐침
  function dthermo(ctx, x, top, tip) {
    let g = ctx.createLinearGradient(x - 34, 0, x + 34, 0); g.addColorStop(0, '#e3e8ed'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#cfd7df');
    ctx.fillStyle = g; rr(ctx, x - 34, top, 68, 104, 16); ctx.fill(); ctx.strokeStyle = 'rgba(20,38,59,.18)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#18222d'; rr(ctx, x - 27, top + 16, 54, 36, 6); ctx.fill();
    ctx.fillStyle = '#c9d2db'; ctx.beginPath(); ctx.arc(x, top + 76, 7, 0, TAU); ctx.fill();
    g = ctx.createLinearGradient(x - 9, 0, x + 9, 0); g.addColorStop(0, '#d9dfe5'); g.addColorStop(1, '#aeb8c2');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 14, top + 104); ctx.lineTo(x + 14, top + 104); ctx.lineTo(x + 5, top + 124); ctx.lineTo(x - 5, top + 124); ctx.closePath(); ctx.fill();
    g = ctx.createLinearGradient(x - 3, 0, x + 3, 0); g.addColorStop(0, '#9aa5b1'); g.addColorStop(0.5, '#f4f7f9'); g.addColorStop(1, '#7d8894');
    ctx.fillStyle = g; ctx.fillRect(x - 2.5, top + 124, 5, tip - top - 124);
  }
  // 삼각 플라스크 (cx, 바닥 y, 높이 H)
  function flaskPath(ctx, cx, bot, H, inset = 0) {
    const nw = 17 - inset, bw = 80 - inset, nh = 58, y0 = bot - H + inset;
    ctx.beginPath(); ctx.moveTo(cx - nw, y0); ctx.lineTo(cx - nw, bot - H + nh); ctx.lineTo(cx - bw + 6, bot - 14 - inset);
    ctx.quadraticCurveTo(cx - bw, bot - inset, cx - bw + 16, bot - inset); ctx.lineTo(cx + bw - 16, bot - inset);
    ctx.quadraticCurveTo(cx + bw, bot - inset, cx + bw - 6, bot - 14 - inset); ctx.lineTo(cx + nw, bot - H + nh); ctx.lineTo(cx + nw, y0);
  }
  function glassStroke(ctx) { ctx.strokeStyle = 'rgba(115,135,155,.7)'; ctx.lineWidth = 2; ctx.stroke(); }
  // 끓임쪽: 바닥의 작은 돌 조각
  function chips(ctx, pts) { pts.forEach(([x, y, r], i) => { ctx.fillStyle = i % 2 ? '#a8b1ba' : '#8f99a4'; ctx.beginPath(); ctx.ellipse(x, y, r * 1.3, r, i, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, TAU); ctx.fill(); }); }

  /* ---- 기포 · 김 ---- */
  function bubbles() {
    const list = [];
    return {
      list,
      add(b) { list.push(Object.assign({ vy: 0, life: 0, pop: 0 }, b)); },
      step(dt, top, wob = 0) {
        list.forEach((b) => {
          b.life += dt;
          if (b.stick) { b.r = Math.min(b.rmax, b.r + dt * b.grow); if (b.r >= b.rmax) { if (b.collapse) b.dead = true; else b.stick = false; } return; }
          b.vy = Math.min(b.vmax || 160, b.vy + 260 * dt); b.y -= b.vy * dt; b.x += Math.sin(b.life * 9 + b.ph) * 18 * dt * (1 + wob);
          if (b.collapse) { b.r -= dt * 3; if (b.r < 0.4) b.dead = true; } else b.r = Math.min(b.rmax * 1.25, b.r + dt * 2.2);
          if (b.y - b.r < top) { b.dead = true; b.burst = 0; }
        });
        for (let i = list.length - 1; i >= 0; i--) if (list[i].dead) list.splice(i, 1);
      },
      draw(ctx) {
        list.forEach((b) => {
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU);
          ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill(); ctx.strokeStyle = 'rgba(90,130,170,.55)'; ctx.lineWidth = Math.max(0.6, b.r * 0.14); ctx.stroke();
          if (b.r > 2.5) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 0, TAU); ctx.fill(); }
        });
      },
      clear() { list.length = 0; },
    };
  }
  function steam() {
    const list = [];
    return {
      add(x, y, s = 1) { list.push({ x, y, r: 6 * s, a: 0.0, life: 0, vx: gauss() * 6, ph: Math.random() * 6, s }); },
      step(dt) { list.forEach((p) => { p.life += dt; p.y -= (34 + 10 * p.s) * dt; p.x += (p.vx + Math.sin(p.life * 2 + p.ph) * 10) * dt; p.r += 14 * dt * p.s; p.a = p.life < 0.4 ? p.life / 0.4 : Math.max(0, 1 - (p.life - 0.4) / 2.2); if (p.a <= 0 && p.life > 0.5) p.dead = true; }); for (let i = list.length - 1; i >= 0; i--) if (list[i].dead) list.splice(i, 1); },
      draw(ctx) { list.forEach((p) => { const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.r); g.addColorStop(0, `rgba(150,170,192,${0.22 * p.a})`); g.addColorStop(1, 'rgba(150,170,192,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); }); },
      clear() { list.length = 0; },
    };
  }

  /* ---- 온도-시간 그래프 ----
     box {x,y,w,h}, ax {t1, y0, y1, ys, ts}, series [{pts:[[t,T]…], on, label, lab:[t,T,side]}], 이름표 접두어 pre */
  function tgraph(ctx, ov, pre, box, ax, series, o = {}) {
    const { x, y, w, h } = box;
    const X = (t) => x + w * t / ax.t1, Y = (T) => y + h - h * (T - ax.y0) / (ax.y1 - ax.y0);
    ctx.fillStyle = o.bg || '#fbfcfe'; ctx.fillRect(x, y, w, h);
    ctx.lineWidth = 1;
    for (let t = 0; t <= ax.t1 + 1e-6; t += ax.ts / (o.minor || 1)) { ctx.strokeStyle = '#e6ecf2'; ctx.beginPath(); ctx.moveTo(X(t), y); ctx.lineTo(X(t), y + h); ctx.stroke(); }
    for (let T = ax.y0; T <= ax.y1 + 1e-6; T += ax.ys) { ctx.strokeStyle = '#e6ecf2'; ctx.beginPath(); ctx.moveTo(x, Y(T)); ctx.lineTo(x + w, Y(T)); ctx.stroke(); }
    ctx.strokeStyle = '#8b9aab'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + h); ctx.lineTo(x + w + 4, y + h); ctx.stroke();
    if (!o.noTicks) {
      for (let t = 0; t <= ax.t1 + 1e-6; t += ax.ts) ov.put(pre + 'xt' + t, X(t), y + h + 14, String(t), 'tk2');
      for (let T = ax.y0; T <= ax.y1 + 1e-6; T += ax.ys) ov.put(pre + 'yt' + T, x - 8, Y(T), String(T), 'tk2 la');
      ov.put(pre + 'yl', x - 2, y - 20, '온도(℃)', 'tx m ra sc2');
      ov.put(pre + 'xl', x + w, y + h + 34, '시간(분)', 'tx m la sc2');
    }
    ctx.save(); ctx.beginPath(); ctx.rect(x, y - 6, w + 6, h + 8); ctx.clip(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    series.forEach((s) => {
      if (!s.pts.length) return;
      ctx.beginPath(); s.pts.forEach(([t, T], i) => (i ? ctx.lineTo(X(t), Y(T)) : ctx.moveTo(X(t), Y(T))));
      if (s.on) { ctx.strokeStyle = BLUE; ctx.lineWidth = 3; ctx.stroke(); }
      else { ctx.strokeStyle = s.col || '#a3b0bd'; ctx.lineWidth = 2; ctx.stroke(); }
    });
    ctx.restore();
    series.forEach((s, i) => {
      if (s.dot && s.pts.length) { const [t, T] = s.pts[s.pts.length - 1]; ctx.fillStyle = '#fff'; ctx.strokeStyle = s.on ? BLUE : '#6f8194'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X(t), Y(T), 6, 0, TAU); ctx.fill(); ctx.stroke(); }
      if (s.label && s.lab && s.pts.length) ov.put(pre + 'sl' + i, X(s.lab[0]), Y(s.lab[1]), s.label, 'tx gl' + (s.on ? ' on' : '') + (s.lab[2] ? ' ' + s.lab[2] : ''));
      else ov.hide(pre + 'sl' + i);
    });
    for (let i = series.length; i < 8; i++) ov.hide(pre + 'sl' + i);
    return { X, Y };
  }

  /* ---- 태블릿(스마트 기기) ---- */
  function tablet(ctx, x, y, w, h) {
    contact(ctx, x + w / 2, y + h + 6, w + 30, 0.2);
    ctx.fillStyle = '#9aa5b1'; ctx.beginPath(); ctx.moveTo(x + w * 0.7, y + h - 30); ctx.lineTo(x + w * 0.86, y + h + 6); ctx.lineTo(x + w * 0.8, y + h + 6); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#2c3540'); g.addColorStop(1, '#151b22');
    ctx.fillStyle = g; rr(ctx, x, y, w, h, 18); ctx.fill();
    ctx.fillStyle = '#fff'; rr(ctx, x + 12, y + 12, w - 24, h - 24, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.moveTo(x + w * 0.55, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h * 0.35); ctx.closePath(); ctx.fill();
  }

  /* ================= 끓는점 실험실 ================= */
  const COND = {
    A: { sub: 'water', name: '물(증류수)', vol: 20, bp: 100.0, tb: 4.0, lv: 36 },
    B: { sub: 'water', name: '물(증류수)', vol: 40, bp: 100.0, tb: 7.0, lv: 62 },
    C: { sub: 'eth', name: '에탄올', vol: 10, bp: 78.2, tb: 3.0, lv: 44 },
    D: { sub: 'eth', name: '에탄올', vol: 20, bp: 78.2, tb: 5.0, lv: 82 },
  };
  const T0 = 20;
  function tempAt(c, t) {
    if (t >= c.tb) return c.bp;
    const u = t / c.tb, a = 0.55, f = (1 - Math.exp(-a * u)) / (1 - Math.exp(-a));
    const lag = 1 - Math.exp(-t * 3.2);
    return T0 + (c.bp - T0) * f * (0.75 + 0.25 * lag);
  }
  function boil(host) {
    const W = 1000, H = 600, S = surface(host, W, H, { x: 0, y: 70, w: 1000, h: 525 }), ov = overlay(S), ctx = S.ctx;
    const SEC = 1.5; // 실제 1분을 화면 1.5초로
    const st = { cond: 'A', t: 0, run: false, end: 0, runs: {}, done: null, heat: 0, drip: 0, col: 0, onTick: null };
    const BB = bubbles(), SB = bubbles(), SM = steam(), DR = [];
    const R = rng(11);
    const DESK = 548;
    function set(cond) { st.cond = cond; st.t = 0; st.run = false; st.heat = 0; st.col = 0; BB.clear(); SB.clear(); SM.clear(); DR.length = 0; }
    function start(done, onTick) { if (st.run) return; st.t = 0; st.run = true; st.done = done; st.onTick = onTick; st.col = 0; st.pts = [[0, T0]]; st.end = COND[st.cond].tb + 1.2; }
    function jump(cond, t) { set(cond); st.t = t; st.pts = []; for (let k = 0; k <= t + 1e-6; k += 0.05) st.pts.push([k, tempAt(COND[cond], k)]); st.heat = 1; if (t >= COND[cond].tb) st.col = (t - COND[cond].tb) * 0.6; }
    function keep(cond) { st.runs[cond] = []; for (let k = 0; k <= COND[cond].tb + 1.2 + 1e-6; k += 0.05) st.runs[cond].push([k, tempAt(COND[cond], k)]); }
    // 실험 장치 그리기
    function drawAB(c, T, boilK) {
      const px = 70, cx = 270, top = 478, bot = top - 2, FH = 236;
      stand(ctx, px, DESK, 70, 30, 410);
      hotplate(ctx, cx, top, st.heat);
      // 뒤쪽 유리
      flaskPath(ctx, cx, bot, FH); ctx.fillStyle = 'rgba(236,242,247,.5)'; ctx.fill();
      // 물
      const lvl = bot - c.lv + Math.min(6, st.col * 3);
      ctx.save(); flaskPath(ctx, cx, bot, FH, 3); ctx.clip();
      const g = ctx.createLinearGradient(0, lvl, 0, bot); g.addColorStop(0, 'rgba(204,226,245,.6)'); g.addColorStop(1, 'rgba(168,204,236,.75)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - 90, bot + 2);
      for (let x = cx - 90; x <= cx + 90; x += 4) ctx.lineTo(x, lvl + Math.sin(x * 0.11 + st.t * 9) * 1.6 * boilK + Math.sin(x * 0.05 - st.t * 6) * 1.1 * boilK);
      ctx.lineTo(cx + 90, bot + 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.6; ctx.beginPath();
      for (let x = cx - 90; x <= cx + 90; x += 4) { const yy = lvl + Math.sin(x * 0.11 + st.t * 9) * 1.6 * boilK + Math.sin(x * 0.05 - st.t * 6) * 1.1 * boilK; x === cx - 90 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
      ctx.stroke();
      chips(ctx, [[cx - 30, bot - 6, 4], [cx + 18, bot - 5, 3.5], [cx - 4, bot - 7, 3], [cx + 40, bot - 6, 3.2]]);
      BB.draw(ctx);
      ctx.restore();
      // 센서
      const tip = lvl + (bot - lvl) / 2;
      clampArm(ctx, px, 152, cx + 4); jaws(ctx, cx, 152, 17);
      sensor(ctx, cx, 112, tip);
      flaskPath(ctx, cx, bot, FH); glassStroke(ctx);
      ctx.strokeStyle = 'rgba(115,135,155,.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(cx, bot - FH, 19, 3, 0, 0, TAU); ctx.stroke();
      const hg = ctx.createLinearGradient(cx - 70, 0, cx - 40, 0); hg.addColorStop(0, 'rgba(255,255,255,0)'); hg.addColorStop(0.5, 'rgba(255,255,255,.6)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(cx - 12, bot - FH + 64); ctx.lineTo(cx - 6, bot - FH + 64); ctx.lineTo(cx - 54, bot - 24); ctx.lineTo(cx - 66, bot - 24); ctx.closePath(); ctx.fill();
      SM.draw(ctx);
      // 이름표
      ov.put('nmA', cx + 92, bot - 40, `${c.name} ${c.vol} mL`, 'tx nm ra');
      ov.put('nmS', cx + 26, 140, '온도 센서', 'tx nm sol ra');
      ov.put('nmH', cx, top + 102, '핫플레이트', 'tx nm sol');
      ['nmT', 'nmB', 'nmI', 'nmR'].forEach((k) => ov.hide(k));
      return { lvl, bot, cx, emit: [[cx - 30, bot - 8], [cx + 18, bot - 8], [cx - 4, bot - 9], [cx + 40, bot - 8], [cx - 55, bot - 8], [cx + 60, bot - 8]], top: lvl, x0: cx - 66, x1: cx + 66, mouth: [cx, bot - FH] };
    }
    function drawCD(c, T, boilK) {
      const px = 60, cx = 200, top = 478, IR = 15;
      stand(ctx, px, DESK, 70, 22, 330);
      hotplate(ctx, cx, top, st.heat, 210);
      // 물중탕 비커
      const bx0 = cx - 92, bx1 = cx + 92, by0 = 268, by1 = top + 4, wl = 318;
      ctx.save(); rr(ctx, bx0, by0, bx1 - bx0, by1 - by0, 12); ctx.fillStyle = 'rgba(236,242,247,.55)'; ctx.fill(); ctx.restore();
      ctx.save(); ctx.beginPath(); rr(ctx, bx0 + 2, wl, bx1 - bx0 - 4, by1 - wl - 2, 10); ctx.clip();
      let g = ctx.createLinearGradient(0, wl, 0, by1); g.addColorStop(0, 'rgba(214,232,247,.55)'); g.addColorStop(1, 'rgba(184,214,240,.7)');
      ctx.fillStyle = g; ctx.fillRect(bx0, wl, bx1 - bx0, by1 - wl); SB.draw(ctx); ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx0 + 2, wl); ctx.lineTo(bx1 - 2, wl); ctx.stroke();
      // 가지 달린 시험관
      const tTop = 196, tBot = 452, L = tBot - tTop;
      ctx.save(); ctx.translate(cx, tTop);
      tubeBack(ctx, L, IR);
      const lvl = L - c.lv + Math.min(8, st.col * 4);
      ctx.save(); tubeShape(ctx, L, IR - 3); ctx.clip();
      g = ctx.createLinearGradient(0, lvl, 0, L); g.addColorStop(0, 'rgba(236,240,246,.75)'); g.addColorStop(1, 'rgba(214,224,236,.85)');
      ctx.fillStyle = g; ctx.fillRect(-IR, lvl + Math.sin(st.t * 10) * boilK, 2 * IR, L);
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-IR, lvl + Math.sin(st.t * 10) * boilK); ctx.lineTo(IR, lvl - Math.sin(st.t * 10) * boilK); ctx.stroke();
      ctx.translate(-cx, -tTop); BB.draw(ctx); ctx.translate(cx, tTop);
      ctx.restore();
      // 가지(오른쪽 위로 나와 아래로)
      ctx.strokeStyle = 'rgba(115,135,155,.7)'; ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(236,242,247,.6)';
      ctx.beginPath(); ctx.moveTo(IR, 34); ctx.lineTo(IR + 52, 50); ctx.lineTo(IR + 52, 60); ctx.lineTo(IR, 46); ctx.closePath(); ctx.fill(); ctx.stroke();
      tubeFront(ctx, L, IR);
      ctx.restore();
      // 고무관: 가지 끝 → 얼음물 속 시험관
      const ax = cx + IR + 52, ay = tTop + 55, cx2 = 448, cTop = 330;
      ctx.strokeStyle = '#a8998a'; ctx.lineWidth = 11; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ax - 4, ay); ctx.bezierCurveTo(ax + 70, ay + 10, cx2 - 30, cTop - 120, cx2 - 2, cTop - 46); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax - 2, ay - 3); ctx.bezierCurveTo(ax + 68, ay + 6, cx2 - 34, cTop - 122, cx2 - 6, cTop - 50); ctx.stroke();
      // 유리관
      ctx.fillStyle = 'rgba(236,242,247,.7)'; ctx.strokeStyle = 'rgba(115,135,155,.7)'; ctx.lineWidth = 1.5; ctx.fillRect(cx2 - 4, cTop - 50, 8, 120); ctx.strokeRect(cx2 - 4, cTop - 50, 8, 120);
      // 얼음물 비커 + 시험관
      const ib0 = cx2 - 70, ib1 = cx2 + 70, iby0 = 380, iby1 = DESK;
      contact(ctx, cx2, DESK + 2, 170, 0.16);
      ctx.save(); rr(ctx, ib0, iby0, ib1 - ib0, iby1 - iby0, 10); ctx.fillStyle = 'rgba(236,242,247,.55)'; ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(cx2, cTop); const L2 = 190; tubeBack(ctx, L2, 13);
      const cl = L2 - 6 - Math.min(40, st.drip * 3.2);
      ctx.save(); tubeShape(ctx, L2, 10); ctx.clip(); ctx.fillStyle = 'rgba(226,232,240,.9)'; ctx.fillRect(-13, cl, 26, L2); ctx.restore();
      DR.forEach((d) => { ctx.fillStyle = 'rgba(150,175,200,.8)'; ctx.beginPath(); ctx.ellipse(0, d.y, 2.6, 3.4, 0, 0, TAU); ctx.fill(); });
      tubeFront(ctx, L2, 13); ctx.restore();
      const iw = 418;
      ctx.save(); ctx.beginPath(); rr(ctx, ib0 + 2, iw, ib1 - ib0 - 4, iby1 - iw - 2, 8); ctx.clip();
      g = ctx.createLinearGradient(0, iw, 0, iby1); g.addColorStop(0, 'rgba(214,232,247,.5)'); g.addColorStop(1, 'rgba(190,216,240,.65)');
      ctx.fillStyle = g; ctx.fillRect(ib0, iw, ib1 - ib0, iby1 - iw);
      [[ib0 + 22, iw + 4, 0.2], [ib1 - 26, iw + 8, -0.3], [ib0 + 38, iw + 30, 0.5], [ib1 - 30, iw + 46, 0.1]].forEach(([x, y, a]) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.strokeStyle = 'rgba(140,165,190,.6)'; ctx.lineWidth = 1; rr(ctx, -14, -12, 28, 24, 5); ctx.fill(); ctx.stroke(); ctx.restore(); });
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ib0 + 2, iw); ctx.lineTo(ib1 - 2, iw); ctx.stroke();
      glassFront(ctx, ib0, iby0, ib1, iby1, 10, 10, false);
      glassFront(ctx, bx0, by0, bx1, by1, 12, 12, true);
      // 마개 + 센서 + 집게
      ctx.fillStyle = '#9aa5b1'; ctx.beginPath(); ctx.moveTo(cx - IR - 3, tTop - 14); ctx.lineTo(cx + IR + 3, tTop - 14); ctx.lineTo(cx + IR - 1, tTop + 12); ctx.lineTo(cx - IR + 1, tTop + 12); ctx.closePath(); ctx.fill();
      clampArm(ctx, px, tTop + 40, cx + 2); jaws(ctx, cx, tTop + 40, IR + 1);
      const tip = tTop + lvl + (L - lvl) / 2;
      sensor(ctx, cx, tTop - 84, tip);
      ov.put('nmA', cx - 4, tTop + lvl + (L - lvl) / 2 + 2, '', 'tx'); ov.hide('nmA');
      ov.put('nmT', cx - IR - 10, tTop + L - 30, `에탄올 ${c.vol} mL`, 'tx nm la');
      ov.put('nmB', bx0 - 8, wl + 18, '물', 'tx nm sol la');
      ov.put('nmI', cx2, iby0 - 12, '얼음물', 'tx nm sol');
      ov.put('nmR', ax + 50, ay - 26, '고무관', 'tx nm sol');
      ov.put('nmS', cx + 26, tTop - 56, '온도 센서', 'tx nm sol ra');
      ov.put('nmH', cx, top + 102, '핫플레이트', 'tx nm sol');
      return { lvl: tTop + lvl, bot: tTop + L - 4, cx, emit: [[cx - 6, tTop + L - 8], [cx + 5, tTop + L - 10], [cx, tTop + L - 6]], top: tTop + lvl, x0: cx - IR + 4, x1: cx + IR - 4, bath: [bx0 + 10, bx1 - 10, by1 - 6, wl], coll: [cx2, cTop, cl] };
    }
    let spawn = 0, sspawn = 0, dspawn = 0;
    addLoop(host, (dt) => {
      const c = COND[st.cond];
      if (st.run) {
        st.t = Math.min(st.end, st.t + dt / SEC);
        st.heat = Math.min(1, st.heat + dt);
        const T = tempAt(c, st.t); st.pts.push([st.t, T]);
        if (st.t >= c.tb) st.col += dt / SEC * 0.6;
        st.onTick && st.onTick(st.t, T);
        if (st.t >= st.end) { st.run = false; keep(st.cond); const d = st.done; st.done = null; d && d(); }
      }
      const T = st.pts && st.pts.length ? st.pts[st.pts.length - 1][1] : T0;
      const near = clamp((T - (c.bp - 28)) / 28, 0, 1), boiling = st.t >= c.tb && st.heat > 0.5;
      const boilK = boiling ? 1 : near * 0.25;
      S.begin(); white(S); desk(S, DESK);
      const G = c.sub === 'water' ? drawAB(c, T, boilK) : drawCD(c, T, boilK);
      // 기포
      if (!reduce) {
        spawn += dt * (boiling ? (c.sub === 'water' ? 26 : 16) : near * 6);
        while (spawn > 1) {
          spawn -= 1; const e = G.emit[Math.floor(Math.random() * G.emit.length)];
          if (boiling) BB.add({ x: e[0] + gauss() * 3, y: e[1], r: 1, rmax: c.sub === 'water' ? 3.5 + Math.random() * 4 : 2.2 + Math.random() * 2.2, stick: true, grow: 14, vmax: 150, ph: Math.random() * 6 });
          else BB.add({ x: e[0] + gauss() * 6, y: e[1], r: 0.6, rmax: 1.4 + Math.random() * 1.6, stick: true, grow: 4, collapse: Math.random() < 0.7, vmax: 40, ph: Math.random() * 6 });
        }
        BB.step(dt, G.top + 2, boiling ? 1 : 0);
        if (c.sub === 'water') { if (boiling && Math.random() < dt * 9) SM.add(G.mouth[0] + gauss() * 5, G.mouth[1] - 4, 1); }
        else if (G.bath) {
          const bT = Math.min(92, 20 + st.heat * (T + 12));
          sspawn += dt * clamp((bT - 70) / 20, 0, 1) * 5;
          while (sspawn > 1) { sspawn -= 1; SB.add({ x: lerp(G.bath[0], G.bath[1], Math.random()), y: G.bath[2], r: 0.6, rmax: 1.6, stick: true, grow: 3, collapse: true, vmax: 30, ph: Math.random() * 6 }); }
          SB.step(dt, G.bath[3]);
          if (boiling) { dspawn += dt * 2.2; while (dspawn > 1) { dspawn -= 1; DR.push({ y: 4, v: 0 }); } }
          DR.forEach((d) => { d.v += 600 * dt; d.y += d.v * dt; if (d.y > G.coll[2]) { d.dead = true; st.drip += 1; } });
          for (let i = DR.length - 1; i >= 0; i--) if (DR[i].dead) DR.splice(i, 1);
        }
        SM.step(dt);
      }
      // 태블릿 그래프
      const TX = 560, TY = 120, TWd = 420, THt = 400;
      tablet(ctx, TX, TY, TWd, THt);
      const series = [];
      Object.keys(st.runs).forEach((k) => { if (k !== st.cond || st.run || !st.pts) series.push({ pts: st.runs[k], label: k, lab: [COND[k].tb + 0.6, COND[k].bp, 'up'] }); });
      if (st.pts && st.pts.length) series.push({ pts: st.pts, on: true, dot: st.run, label: st.cond, lab: st.run ? [st.pts[st.pts.length - 1][0] + 0.3, st.pts[st.pts.length - 1][1], 'ra'] : [COND[st.cond].tb + 0.6, COND[st.cond].bp, 'up'] });
      tgraph(ctx, ov, 'g', { x: TX + 62, y: TY + 104, w: TWd - 110, h: THt - 160 }, { t1: 10, y0: 0, y1: 120, ys: 20, ts: 2 }, series);
      ov.put('gT', TX + 30, TY + 48, `<b>${f1(T)}</b> ℃`, 'tx big2 ra');
      ov.put('gt', TX + TWd - 30, TY + 48, `${(st.t).toFixed(1)}분`, 'tx m la');
      ov.put('gh', TX + TWd / 2, TY - 18, '스마트 기기 · 온도 센서 그래프', 'tx nm sol');
    });
    return { set, start, jump, keep, get st() { return st; }, COND };
  }

  /* ================= 녹는점 실험실 (그림 Ⅰ-8) ================= */
  const SAMP = {
    l100: { name: '로르산', g: 100, mp: 43.8, tm: 10, h: 104 },
    l150: { name: '로르산', g: 150, mp: 43.8, tm: 15, h: 156 },
    p100: { name: '팔미트산', g: 100, mp: 62.5, tm: 10, h: 104 },
  };
  const mtemp = (s, t) => (t >= s.tm ? s.mp : 20 + (s.mp - 20) * t / s.tm);
  const mpts = (s, t) => { const p = [[0, 20]]; if (t > s.tm) p.push([s.tm, s.mp]); p.push([t, mtemp(s, t)]); return p; };
  const SNAME = (s) => `${s.g} g ${s.name}`;
  // 시험관 속 고체/녹은 액체 그리기 (제 좌표: 입구 (0,0), 바닥 (0,L))
  const FLAKE = (() => { const r = rng(21), a = []; for (let i = 0; i < 60; i++) a.push([r(), r(), 0.6 + r() * 1.6, r()]); return a; })();
  function sampleDraw(ctx, L, IR, s, m) {
    const top = L - 4 - s.h, iw = IR - 3;
    ctx.save(); tubeShape(ctx, L, iw); ctx.clip();
    // 녹은 액체(투명, 아주 옅은 노란빛)
    if (m > 0.001) {
      const lt = top + s.h * 0.06 * m;
      const g = ctx.createLinearGradient(0, lt, 0, L); g.addColorStop(0, 'rgba(246,244,238,.92)'); g.addColorStop(1, 'rgba(232,229,220,.95)');
      ctx.fillStyle = g; ctx.fillRect(-iw, lt, 2 * iw, L - lt + 2);
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-iw, lt); ctx.lineTo(iw, lt); ctx.stroke();
    }
    // 고체(녹으며 벽에서부터 줄어듦)
    if (m < 0.999) {
      const k = 1 - m, hw = iw * Math.pow(k, 0.55), st = top + s.h * (1 - Math.pow(k, 0.8));
      ctx.beginPath(); ctx.moveTo(-hw, L); ctx.lineTo(-hw, st + hw * 0.5); ctx.quadraticCurveTo(-hw, st, -hw * 0.4, st); ctx.lineTo(hw * 0.4, st); ctx.quadraticCurveTo(hw, st, hw, st + hw * 0.5); ctx.lineTo(hw, L); ctx.closePath();
      const g = ctx.createLinearGradient(-hw, 0, hw, 0); g.addColorStop(0, '#dfe2e6'); g.addColorStop(0.35, '#fdfdfb'); g.addColorStop(1, '#cfd4da');
      ctx.fillStyle = g; ctx.fill();
      ctx.save(); ctx.clip();
      FLAKE.forEach(([u, v, r, a]) => { ctx.fillStyle = a > 0.5 ? 'rgba(255,255,255,.9)' : 'rgba(160,170,182,.35)'; ctx.beginPath(); ctx.ellipse(-iw + u * 2 * iw, top + v * s.h, r * 1.8, r, a * 3, 0, TAU); ctx.fill(); });
      ctx.restore();
      ctx.strokeStyle = m > 0.01 ? 'rgba(255,255,255,.85)' : 'rgba(120,135,150,.45)'; ctx.lineWidth = 1.2; ctx.stroke();
    }
    ctx.restore();
  }
  function melt(host, o = {}) {
    const W = 1000, H = 600, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx;
    const SEC = 0.6, END = 20;
    const st = { s: 'l100', t: 0, run: false, done: null, runs: {}, onTick: null, pts: [[0, 20]] };
    const SMK = steam();
    function set(s) { st.s = s; st.t = 0; st.run = false; st.pts = [[0, 20]]; }
    function start(done, onTick) { if (st.run) return; st.t = 0; st.run = true; st.done = done; st.onTick = onTick; }
    function keep(s) { st.runs[s] = mpts(SAMP[s], END); }
    function jump(s, t) { set(s); st.t = t; st.pts = mpts(SAMP[s], t); }
    function clearRuns() { st.runs = {}; }
    const DESK = 560;
    addLoop(host, (dt) => {
      const s = SAMP[st.s];
      if (st.run) {
        st.t = Math.min(END, st.t + dt / SEC); st.pts = mpts(s, st.t);
        st.onTick && st.onTick(st.t, mtemp(s, st.t));
        if (st.t >= END) { st.run = false; keep(st.s); const d = st.done; st.done = null; d && d(); }
      }
      const T = mtemp(s, st.t), m = st.t > s.tm ? Math.min(0.9, (st.t - s.tm) / 12) : 0;
      S.begin(); white(S); desk(S, DESK);
      const px = 74, cx = 250, bx0 = 150, bx1 = 350, by0 = 300, by1 = DESK - 14, wl = 344;
      stand(ctx, px, DESK, 40, 34, 400);
      // 뜨거운 물 비커
      ctx.save(); rr(ctx, bx0, by0, bx1 - bx0, by1 - by0, 12); ctx.fillStyle = 'rgba(236,242,247,.55)'; ctx.fill(); ctx.restore();
      ctx.save(); ctx.beginPath(); rr(ctx, bx0 + 2, wl, bx1 - bx0 - 4, by1 - wl - 2, 10); ctx.clip();
      let g = ctx.createLinearGradient(0, wl, 0, by1); g.addColorStop(0, 'rgba(208,228,246,.6)'); g.addColorStop(1, 'rgba(176,208,238,.75)');
      ctx.fillStyle = g; ctx.fillRect(bx0, wl, bx1 - bx0, by1 - wl); ctx.restore();
      // 시험관
      const tTop = 150, L = 380, IR = 27;
      ctx.save(); ctx.translate(cx, tTop); tubeBack(ctx, L, IR); sampleDraw(ctx, L, IR, s, m); ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx0 + 2, wl); ctx.lineTo(cx - IR, wl); ctx.moveTo(cx + IR, wl); ctx.lineTo(bx1 - 2, wl); ctx.stroke();
      ctx.save(); ctx.translate(cx, tTop); tubeFront(ctx, L, IR); ctx.restore();
      glassFront(ctx, bx0, by0, bx1, by1, 12, 12, true);
      if (!reduce) { if (Math.random() < dt * 3) SMK.add(lerp(bx0 + 20, bx1 - 20, Math.random()), wl - 8, 0.8); SMK.step(dt); }
      SMK.draw(ctx);
      clampArm(ctx, px, tTop + 30, cx + 2); jaws(ctx, cx, tTop + 30, IR + 1);
      const tip = tTop + L - 4 - s.h / 2;
      dthermo(ctx, cx, tTop - 132, tip);
      ov.put('lcd', cx, tTop - 98, f1(T), 'lcd sm');
      ov.put('nmW', bx1 + 10, wl + 40, '뜨거운 물', 'tx nm sol ra');
      ov.put('nmS', cx + IR + 10, tTop + L - 4 - s.h / 2, `${SNAME(s)}`, 'tx nm ra');
      ov.put('nmT', cx + 34, tTop - 120, '디지털 온도계', 'tx nm sol ra');
      // 그래프
      const GX = 470, GY = 40, GW = 510, GH = 500;
      ctx.fillStyle = '#fff'; rr(ctx, GX, GY, GW, GH, 16); ctx.fill(); ctx.strokeStyle = '#dde6ee'; ctx.lineWidth = 1; ctx.stroke();
      const series = [];
      Object.keys(st.runs).forEach((k) => { if (k !== st.s || st.run || st.t < END) series.push({ pts: st.runs[k], label: SNAME(SAMP[k]), lab: [17.5, SAMP[k].mp, k === 'l150' ? 'dn' : 'up'] }); });
      series.push({ pts: st.pts, on: true, dot: st.run, label: SNAME(s), lab: st.t > 4 ? [Math.min(st.t, 17.5), mtemp(s, Math.min(st.t, 17.5)), s.name === '팔미트산' || st.s === 'l100' ? 'up' : 'dn'] : null });
      const mp = tgraph(ctx, ov, 'm', { x: GX + 70, y: GY + 40, w: GW - 110, h: GH - 110 }, { t1: 20, y0: 0, y1: 70, ys: 10, ts: 5 }, series);
      // 녹는점 눈금선
      const shown = {};
      [...Object.keys(st.runs), st.t >= s.tm ? st.s : null].forEach((k) => { if (k) shown[SAMP[k].mp] = true; });
      [43.8, 62.5].forEach((v) => {
        if (shown[v]) {
          ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(20,38,59,.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(mp.X(0), mp.Y(v)); ctx.lineTo(mp.X(10), mp.Y(v)); ctx.stroke(); ctx.setLineDash([]);
          ov.put('mv' + v, mp.X(0) + 8, mp.Y(v) - 13, `${f1(v)} ℃`, 'tx mpv ra');
        } else ov.hide('mv' + v);
      });
    });
    return { set, start, jump, keep, clearRuns, get st() { return st; }, SAMP };
  }

  /* ================= 그림 Ⅰ-8 그래프만 (읽기) ================= */
  function mgraph(host) {
    const W = 1000, H = 560, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx;
    const st = { set: 'amount', p: 1, run: false, done: null };
    const SETS = { amount: ['l100', 'l150'], kind: ['p100', 'l100'] };
    function show(set) { st.set = set; st.p = 1; st.run = false; }
    function play(done) { st.p = 0; st.run = true; st.done = done; }
    addLoop(host, (dt) => {
      if (st.run) { st.p = Math.min(1, st.p + dt / 5); if (st.p >= 1) { st.run = false; const d = st.done; st.done = null; d && d(); } }
      S.begin(); white(S);
      const t = st.p * 20, ids = SETS[st.set];
      const series = ids.map((k, i) => ({ pts: mpts(SAMP[k], t), on: i === 0, dot: st.run, label: SNAME(SAMP[k]), lab: t > 3 ? [Math.min(t, 18), mtemp(SAMP[k], Math.min(t, 18)), k === 'l150' || (st.set === 'kind' && k === 'l100') ? 'dn' : 'up'] : null }));
      const mp = tgraph(ctx, ov, 'f', { x: 110, y: 50, w: 840, h: 420 }, { t1: 20, y0: 0, y1: 70, ys: 10, ts: 5 }, series);
      const marks = {};
      ids.forEach((k) => { if (t >= SAMP[k].tm) marks[SAMP[k].mp] = SAMP[k].tm; });
      [43.8, 62.5].forEach((v) => {
        if (marks[v] != null) { ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(20,38,59,.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(mp.X(0), mp.Y(v)); ctx.lineTo(mp.X(marks[v]), mp.Y(v)); ctx.stroke(); ctx.setLineDash([]); ov.put('fv' + v, mp.X(0) + 10, mp.Y(v) - 14, `${f1(v)} ℃`, 'tx mpv ra'); }
        else ov.hide('fv' + v);
      });
    });
    return { show, play, get st() { return st; } };
  }

  /* ================= 그림 Ⅰ-7 · Ⅰ-9 ================= */
  function ladder(host, o) {
    const rise = !!o.rise, W = 1000, H = rise ? 560 : 330, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx, TW = tweens();
    const items = o.items, n = items.length;
    const st = { sel: o.sel == null ? null : o.sel, draw: reduce ? 1 : 0, pulse: 0 };
    if (!reduce) TW.add(1.4, (k) => (st.draw = eOut(k)));
    // 곡선 위 위치
    const P0 = [70, 430], P1 = [560, 410], P2 = [780, 330], P3 = [930, 120];
    const bz = (u) => { const a = 1 - u; return [a * a * a * P0[0] + 3 * a * a * u * P1[0] + 3 * a * u * u * P2[0] + u * u * u * P3[0], a * a * a * P0[1] + 3 * a * a * u * P1[1] + 3 * a * u * u * P2[1] + u * u * u * P3[1]]; };
    const ARC = [[0, 0]]; for (let k = 1, L = 0, p = bz(0); k <= 400; k++) { const q = bz(k / 400); L += Math.hypot(q[0] - p[0], q[1] - p[1]); ARC.push([k / 400, L]); p = q; }
    const pos = (i) => {
      if (!rise) return [110 + i * (780 / (n - 1)), 210];
      const want = (0.05 + 0.86 * i / (n - 1)) * ARC[ARC.length - 1][1];
      for (let k = 1; k < ARC.length; k++) if (ARC[k][1] >= want) return bz(ARC[k][0]);
      return bz(1);
    };
    function sel(i) { st.sel = i; st.pulse = 0; o.onSel && o.onSel(i); }
    host.addEventListener('click', (e) => {
      const [x, y] = S.toLocal(e); let best = -1, bd = 1e9;
      items.forEach((_, i) => { const [px, py] = pos(i); const d = Math.hypot(px - x, (py - y) * 0.6); if (d < bd) { bd = d; best = i; } });
      if (bd < 90) sel(best);
    });
    host.style.cursor = 'pointer';
    addLoop(host, (dt) => {
      TW.step(dt); st.pulse += dt;
      S.begin(); white(S);
      if (!rise) {
        // 띠
        const y = 210, x0 = 40, x1 = 940 * st.draw + 40 * (1 - st.draw);
        const g = ctx.createLinearGradient(40, 0, 940, 0); g.addColorStop(0, '#dfe6ee'); g.addColorStop(1, '#8b9aab');
        ctx.fillStyle = g; rr(ctx, x0, y - 7, Math.max(1, x1 - x0), 14, 7); ctx.fill();
        if (st.draw > 0.98) { ctx.fillStyle = '#8b9aab'; ctx.beginPath(); ctx.moveTo(938, y - 16); ctx.lineTo(964, y); ctx.lineTo(938, y + 16); ctx.closePath(); ctx.fill(); }
        ov.put('lo', 46, y + 36, '온도 낮음', 'tx m ra'); ov.put('hi', 950, y + 36, '온도 높음', 'tx m la');
      } else {
        const N = 80, upto = st.draw;
        ctx.lineCap = 'round';
        ctx.beginPath(); for (let k = 0; k <= N * upto; k++) { const [x, y] = bz(k / N); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.strokeStyle = BLUE; ctx.lineWidth = 4; ctx.stroke();
        if (upto > 0.98) { const [ax, ay] = bz(1), [bx, by] = bz(0.97), a = Math.atan2(ay - by, ax - bx); ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.fillStyle = BLUE; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-10, -14); ctx.lineTo(-10, 14); ctx.closePath(); ctx.fill(); ctx.restore(); }
        ctx.strokeStyle = '#c3ccd6'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(40, 530); ctx.lineTo(960, 530); ctx.stroke();
        ov.put('lo', 46, 548, '온도 낮음', 'tx m ra'); ov.put('hi', 950, 548, '온도 높음', 'tx m la');
      }
      items.forEach((it, i) => {
        const [x, y] = pos(i), on = st.sel === i, vis = (i + 0.5) / n <= st.draw + 0.05;
        if (!vis) { ov.hide('n' + i); return; }
        const base = rise ? 530 : y;
        ctx.setLineDash([3, 4]); ctx.strokeStyle = on ? 'rgba(14,99,179,.7)' : 'rgba(20,38,59,.3)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); if (rise) { ctx.moveTo(x, y); ctx.lineTo(x, base); } else { ctx.moveTo(x, y - 14); ctx.lineTo(x, y - 62); } ctx.stroke(); ctx.setLineDash([]);
        const r = on ? 10 : 7;
        ctx.fillStyle = on ? BLUE : '#fff'; ctx.strokeStyle = on ? BLUE : '#8b9aab'; ctx.lineWidth = on ? 3 : 2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
        const side = rise && i >= n - 3;
        const ly = side ? y - 4 : rise ? (i % 2 ? y + 52 : y - 48) : y - 92;
        ov.put('n' + i, side ? x - 20 : x, ly, `<span>${it.name}</span><b>${it.v}</b>`, 'tx lad' + (side ? ' la' : '') + (on ? ' on' : ''));
      });
    });
    return { sel, get st() { return st; } };
  }

  /* ================= 신기한 물질 도감 ================= */
  // 구간마다 다른 눈금: [온도, 위치(0~1)]
  const BRK = [[-273.15, 0], [-250, 0.09], [-200, 0.16], [-100, 0.26], [0, 0.40], [100, 0.55], [500, 0.68], [1000, 0.76], [3000, 0.89], [6000, 1]];
  const sx = (T) => { T = clamp(T, BRK[0][0], 6000); for (let i = 1; i < BRK.length; i++) if (T <= BRK[i][0]) { const [a, pa] = BRK[i - 1], [b, pb] = BRK[i]; return pa + (pb - pa) * (T - a) / (b - a); } return 1; };
  const xs = (p) => { p = clamp(p, 0, 1); for (let i = 1; i < BRK.length; i++) if (p <= BRK[i][1]) { const [a, pa] = BRK[i - 1], [b, pb] = BRK[i]; return a + (b - a) * (p - pa) / (pb - pa); } return 6000; };
  function stateOf(it, T) {
    if (it.sub != null) return Math.abs(T - it.sub) < 0.05 ? '승화하는 중' : T < it.sub ? '고체' : '기체';
    if (it.mp != null && Math.abs(T - it.mp) < 0.05) return '녹는 중';
    if (Math.abs(T - it.bp) < 0.05) return '끓는 중';
    if (it.mp != null && T < it.mp) return '고체';
    return T < it.bp ? '액체' : '기체';
  }
  function atlas(host, o) {
    const items = o.items, W = 1000, RH = 54, TOP = 92, H = TOP + RH * items.length + 18, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx, TW = tweens();
    const X0 = 190, X1 = 970, xT = (T) => X0 + (X1 - X0) * sx(T);
    const st = { T: o.T == null ? 20 : o.T, Tv: o.T == null ? 20 : o.T, sel: o.sel || 0, grow: reduce ? 1 : 0 };
    if (!reduce) TW.add(1.2, (k) => (st.grow = eOut(k)));
    const marks = []; items.forEach((it) => [it.mp, it.bp, it.sub].forEach((v) => v != null && marks.push(v)));
    function snap(T) {
      const px = xT(T); let best = null, bd = 7;
      marks.forEach((v) => { const d = Math.abs(xT(v) - px); if (d < bd) { bd = d; best = v; } });
      if (best != null) return best;
      const a = Math.abs(T); return a < 200 ? Math.round(T) : a < 1000 ? Math.round(T / 10) * 10 : Math.round(T / 50) * 50;
    }
    function setT(T, anim = true) {
      const a = st.Tv; st.T = T;
      if (reduce || !anim) st.Tv = T; else TW.add(0.6, (k) => (st.Tv = xs(lerp(sx(a), sx(T), ease(k)))));
      o.onT && o.onT(T);
    }
    function setSel(i) { st.sel = i; o.onSel && o.onSel(i); }
    let drag = false, moved = false, downRow = -1;
    const at = (e) => { const [x, y] = S.toLocal(e); return { T: snap(xs((x - X0) / (X1 - X0))), row: Math.floor((y - TOP) / RH), x }; };
    host.addEventListener('pointerdown', (e) => { const p = at(e); drag = true; moved = false; downRow = p.row; host.setPointerCapture && host.setPointerCapture(e.pointerId); if (p.x < X0 - 10 && p.row >= 0 && p.row < items.length) { setSel(p.row); drag = false; return; } st.Tv = p.T; st.T = p.T; o.onT && o.onT(p.T); });
    host.addEventListener('pointermove', (e) => { if (!drag) return; moved = true; const p = at(e); if (p.T !== st.T) { st.T = p.T; st.Tv = p.T; o.onT && o.onT(p.T); } });
    ['pointerup', 'pointercancel'].forEach((n) => host.addEventListener(n, (e) => { if (drag && !moved && downRow >= 0 && downRow < items.length) setSel(downRow); drag = false; }));
    host.style.touchAction = 'none'; host.style.cursor = 'pointer';
    // 눈금 이름표
    [-250, -200, -100, 0, 100, 500, 1000, 3000, 6000].forEach((T) => ov.put('ax' + T, xT(T), TOP - 14, String(T), 'tk2'));
    ov.put('axu', X0 - 12, TOP - 14, '온도(℃)', 'tx m la sc2');
    const COL = { s: '#7f8fa1', l: BLUE, g: '#d6e5f4' };
    addLoop(host, (dt) => {
      TW.step(dt);
      S.begin(); white(S);
      // 범례
      [['s', '고체'], ['l', '액체'], ['g', '기체']].forEach(([k, t], i) => { const lx = X0 + i * 92; ctx.fillStyle = COL[k]; rr(ctx, lx, 22, 26, 14, 5); ctx.fill(); if (k === 'g') { ctx.strokeStyle = '#b6cde4'; ctx.lineWidth = 1; ctx.stroke(); } ov.put('lg' + k, lx + 32, 29, t, 'tx m ra'); });
      ov.put('lgn', X1, 29, '1 기압 · 눈금 간격은 구간마다 달라요', 'tx m la sc2');
      // 세로 눈금선
      [-250, -200, -100, 0, 100, 500, 1000, 3000, 6000].forEach((T) => { ctx.strokeStyle = T === 0 ? '#c9d4df' : '#eef2f6'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xT(T), TOP - 4); ctx.lineTo(xT(T), H - 10); ctx.stroke(); });
      const g = st.grow, T = st.Tv;
      items.forEach((it, i) => {
        const y = TOP + i * RH + RH / 2, on = st.sel === i;
        if (on) { ctx.fillStyle = '#eef5fc'; rr(ctx, 8, y - RH / 2 + 3, W - 16, RH - 6, 12); ctx.fill(); }
        const a = it.mp != null ? it.mp : it.sub != null ? it.sub : -273.15, b = it.sub != null ? it.sub : it.bp;
        const xa = xT(a), xb = xT(b), bh = on ? 20 : 16, xe = X0 + (X1 - X0) * g;
        ctx.save(); ctx.beginPath(); ctx.rect(X0, y - 20, xe - X0, 40); ctx.clip();
        ctx.fillStyle = COL.g; rr(ctx, X0, y - bh / 2, X1 - X0, bh, bh / 2); ctx.fill(); ctx.strokeStyle = '#c3d7ec'; ctx.lineWidth = 1; ctx.stroke();
        if (it.mp != null || it.sub == null) { ctx.fillStyle = COL.l; rr(ctx, it.mp != null ? xa : X0, y - bh / 2, xb - (it.mp != null ? xa : X0), bh, bh / 2); ctx.fill(); if (!it.mp && it.mp !== 0) { ctx.fillRect(X0, y - bh / 2, Math.min(8, xb - X0), bh); } }
        if (it.mp != null || it.sub != null) { ctx.fillStyle = COL.s; rr(ctx, X0, y - bh / 2, xa - X0, bh, bh / 2); ctx.fill(); }
        ctx.restore();
        ov.put('nm' + i, 20, y - 9, it.name, 'tx atn ra' + (on ? ' on' : ''));
        const s = stateOf(it, T);
        ov.put('sv' + i, 20, y + 12, s, 'tx ats ra ' + (s === '액체' ? 'l' : s === '고체' ? 's' : s === '기체' ? 'g' : 'x'));
        // 선택한 물질의 녹는점·끓는점 값
        if (on && g > 0.98) {
          const v = [];
          const fa = (t) => (t < 0 ? '−' : '') + (Number.isInteger(t) ? String(Math.abs(t)) : f1(Math.abs(t))) + ' ℃';
          if (it.mp != null) v.push([it.mp, fa(it.mp)]); if (it.sub != null) v.push([it.sub, fa(it.sub)]);
          if (it.bp != null) v.push([it.bp, it.bpTxt || fa(it.bp)]);
          v.forEach(([t, txt], j) => { ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(xT(t), y, 4.5, 0, TAU); ctx.fill(); ctx.stroke(); ov.put('vv' + j, xT(t), y + (j % 2 ? 22 : -22), txt, 'tx vtxt'); });
          for (let j = v.length; j < 3; j++) ov.hide('vv' + j);
        }
      });
      // 온도 선
      const x = xT(T);
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, TOP - 2); ctx.lineTo(x, H - 10); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(x - 7, TOP - 4); ctx.lineTo(x + 7, TOP - 4); ctx.lineTo(x, TOP + 6); ctx.closePath(); ctx.fill();
      items.forEach((it, i) => { const y = TOP + i * RH + RH / 2; ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(x, y, 5.5, 0, TAU); ctx.fill(); ctx.stroke(); });
      ov.put('tl', x, TOP - 40, `${Math.abs(T) < 100 && T % 1 ? f1(T) : Math.round(T)} ℃`, 'tx tline');
    });
    return { setT, setSel, get st() { return st; }, sx, stateOf };
  }

  /* ================= 작은 찻주전자와 큰 솥 ================= */
  function pots(host, o = {}) {
    const W = 1000, H = 560, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx;
    const st = { t: o.demo ? 0 : 0, run: !!o.demo, done: null };
    const V = [{ x: 300, tb: 4.0, big: false }, { x: 690, tb: 8.5, big: true }];
    const BBs = [bubbles(), bubbles()], SMs = [steam(), steam()];
    const temp = (v, t) => (t >= v.tb ? 100 : 20 + 80 * (1 - Math.exp(-0.9 * t / v.tb)) / (1 - Math.exp(-0.9)));
    function play(done) { st.t = 0; st.run = true; st.done = done; BBs.forEach((b) => b.clear()); SMs.forEach((s) => s.clear()); }
    function reset() { st.t = 0; st.run = false; BBs.forEach((b) => b.clear()); SMs.forEach((s) => s.clear()); }
    const DESK = 470;
    function burner(cx, on, t) {
      contact(ctx, cx, DESK + 4, 260, 0.2);
      let g = ctx.createLinearGradient(0, DESK - 46, 0, DESK); g.addColorStop(0, '#5a6571'); g.addColorStop(1, '#2a323b');
      ctx.fillStyle = g; rr(ctx, cx - 118, DESK - 46, 236, 46, 10); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(cx - 112, DESK - 44, 224, 2);
      ctx.fillStyle = '#d9dfe5'; ctx.beginPath(); ctx.arc(cx + 88, DESK - 23, 10, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#1d242b'; ctx.lineWidth = 3; [-70, -24, 24, 70].forEach((d) => { ctx.beginPath(); ctx.moveTo(cx + d, DESK - 46); ctx.lineTo(cx + d * 0.8, DESK - 64); ctx.stroke(); });
      if (on) for (let i = -4; i <= 4; i++) {
        const fx = cx + i * 9, fh = 15 + Math.sin(t * 17 + i * 1.7) * 3 + Math.sin(t * 29 + i) * 2;
        const fg = ctx.createLinearGradient(0, DESK - 52 - fh, 0, DESK - 50); fg.addColorStop(0, 'rgba(120,175,240,0)'); fg.addColorStop(0.5, 'rgba(90,150,230,.7)'); fg.addColorStop(1, 'rgba(40,90,200,.9)');
        ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(fx - 4, DESK - 50); ctx.quadraticCurveTo(fx - 4, DESK - 52 - fh * 0.5, fx, DESK - 52 - fh); ctx.quadraticCurveTo(fx + 4, DESK - 52 - fh * 0.5, fx + 4, DESK - 50); ctx.closePath(); ctx.fill();
      }
    }
    function probe(x, top, tip) {
      const g = ctx.createLinearGradient(x - 3, 0, x + 3, 0); g.addColorStop(0, '#9aa5b1'); g.addColorStop(0.5, '#f4f7f9'); g.addColorStop(1, '#7d8894');
      ctx.fillStyle = g; ctx.fillRect(x - 2.5, top, 5, tip - top);
      ctx.fillStyle = '#2a323b'; rr(ctx, x - 9, top - 26, 18, 28, 5); ctx.fill();
    }
    addLoop(host, (dt) => {
      if (st.run) { st.t += dt; if (o.demo && st.t > 15) { st.t = 0; BBs.forEach((b) => b.clear()); SMs.forEach((s) => s.clear()); } if (!o.demo && st.t >= 11) { st.run = false; const d = st.done; st.done = null; d && d(); } }
      const on = st.run || st.t > 0;
      S.begin(); white(S); desk(S, DESK);
      V.forEach((v, i) => {
        const T = temp(v, st.t), boiling = on && st.t >= v.tb, near = clamp((T - 70) / 30, 0, 1);
        burner(v.x, on, st.t + i);
        const BB = BBs[i], SM = SMs[i];
        const bot = DESK - 66;
        if (!v.big) {
          // 찻주전자: 둥근 몸통, 주둥이, 손잡이, 뚜껑
          const cx = v.x, w = 92, h = 116, top = bot - h;
          let g = ctx.createLinearGradient(cx - w, 0, cx + w, 0); g.addColorStop(0, '#aeb8c2'); g.addColorStop(0.35, '#f2f5f8'); g.addColorStop(1, '#8794a2');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - w * 0.62, top + 10); ctx.bezierCurveTo(cx - w * 1.1, top + 40, cx - w * 1.05, bot, cx - w * 0.6, bot); ctx.lineTo(cx + w * 0.6, bot); ctx.bezierCurveTo(cx + w * 1.05, bot, cx + w * 1.1, top + 40, cx + w * 0.62, top + 10); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(60,75,90,.35)'; ctx.lineWidth = 1.2; ctx.stroke();
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - w * 0.85, top + 62); ctx.quadraticCurveTo(cx - w * 1.35, top + 46, cx - w * 1.55, top + 6); ctx.lineTo(cx - w * 1.43, top + 2); ctx.quadraticCurveTo(cx - w * 1.25, top + 34, cx - w * 0.9, top + 40); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = '#3a434d'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - w * 0.45, top + 6); ctx.quadraticCurveTo(cx, top - 58, cx + w * 0.45, top + 6); ctx.stroke();
          ctx.fillStyle = '#c3ccd6'; ctx.beginPath(); ctx.ellipse(cx, top + 8, w * 0.5, 9, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = '#3a434d'; ctx.beginPath(); ctx.arc(cx + 18, top - 2, 6, 0, TAU); ctx.fill();
          probe(cx - 18, top - 34, top + 70);
          if (!reduce) { if (boiling && Math.random() < dt * 10) SM.add(cx - w * 1.5 + gauss() * 3, top - 2, 0.9); if (near > 0.3 && Math.random() < dt * near * 3) SM.add(cx - w * 1.5, top, 0.5); SM.step(dt); }
          SM.draw(ctx);
          ov.put('nm' + i, cx, DESK + 24, '작은 찻주전자', 'tx nm');
          ov.put('rd' + i, cx - 18, top - 86, `<b>${f1(T)} ℃</b>${boiling ? '<small>끓는 중</small>' : ''}`, 'tx dig' + (boiling ? ' on' : ''));
        } else {
          // 큰 솥: 넓은 원통, 위가 열려 물이 보임
          const cx = v.x, w = 150, h = 170, top = bot - h;
          ctx.fillStyle = '#7d8894'; ctx.beginPath(); ctx.ellipse(cx, top, w, 22, 0, 0, TAU); ctx.fill();
          const wl = top + 20;
          ctx.save(); ctx.beginPath(); ctx.ellipse(cx, top + 2, w - 8, 18, 0, 0, TAU); ctx.clip();
          let g = ctx.createLinearGradient(0, top - 18, 0, top + 20); g.addColorStop(0, 'rgba(206,226,244,1)'); g.addColorStop(1, 'rgba(172,204,234,1)');
          ctx.fillStyle = g; ctx.fillRect(cx - w, top - 20, 2 * w, 44);
          if (!reduce) {
            const rate = boiling ? 40 : near * 6;
            if (Math.random() < dt * rate) BB.add({ x: cx + gauss() * w * 0.4, y: top + 4 + gauss() * 4, r: 0.5, rmax: boiling ? 5 + Math.random() * 6 : 2, stick: true, grow: boiling ? 18 : 6, collapse: true, ph: 0 });
            BB.step(dt, -1e9);
          }
          BB.list.forEach((b) => { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r * 1.4, b.r * 0.7, 0, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill(); });
          ctx.restore();
          g = ctx.createLinearGradient(cx - w, 0, cx + w, 0); g.addColorStop(0, '#9aa5b1'); g.addColorStop(0.3, '#eef2f5'); g.addColorStop(0.7, '#c3ccd6'); g.addColorStop(1, '#7d8894');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - w, top); ctx.lineTo(cx - w + 6, bot - 10); ctx.quadraticCurveTo(cx - w + 8, bot, cx - w + 26, bot); ctx.lineTo(cx + w - 26, bot); ctx.quadraticCurveTo(cx + w - 8, bot, cx + w - 6, bot - 10); ctx.lineTo(cx + w, top); ctx.ellipse(cx, top, w, 22, 0, 0, Math.PI, false); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(60,75,90,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(cx, top, w, 22, 0, 0, TAU); ctx.stroke();
          ctx.strokeStyle = '#3a434d'; ctx.lineWidth = 9; ctx.lineCap = 'round';
          [[-1, 1]].forEach(() => { ctx.beginPath(); ctx.moveTo(cx - w, top + 30); ctx.quadraticCurveTo(cx - w - 34, top + 34, cx - w - 30, top + 56); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + w, top + 30); ctx.quadraticCurveTo(cx + w + 34, top + 34, cx + w + 30, top + 56); ctx.stroke(); });
          probe(cx + 40, top - 46, top + 90);
          if (!reduce) { if (boiling && Math.random() < dt * 16) SM.add(cx + gauss() * w * 0.5, top - 6, 1.2); if (near > 0.3 && Math.random() < dt * near * 5) SM.add(cx + gauss() * w * 0.5, top - 4, 0.6); SM.step(dt); }
          SM.draw(ctx);
          ov.put('nm' + i, cx, DESK + 24, '큰 솥', 'tx nm');
          ov.put('rd' + i, cx + 40, top - 108, `<b>${f1(T)} ℃</b>${boiling ? '<small>끓는 중</small>' : ''}`, 'tx dig' + (boiling ? ' on' : ''));
        }
      });
      ov.put('tm', 500, 30, on ? `가열한 시간 ${(st.t * 0.8).toFixed(1)}분` : '1 기압 · 같은 불로 가열', 'tx m');
    });
    return { play, reset, get st() { return st; } };
  }

  return { boil, melt, mgraph, ladder, atlas, pots, COND, SAMP, sx, stateOf, f1 };
})();
