/* ===== 원자 모형 실험실(해 보기 '원자 모형 나타내기') · 원자 하나 보기 =====
   AT.lab(host)      하늘색 원자에 전자 붙임딱지를 눌러 붙이고 떼기, 아래에 양성자·전자 전하 줄
                     → { setAtom(name), setP(p|null), clear(), fill(), st, onChange, onBlock }
   AT.single(host,o) 원자 하나를 간단히 나타낸 모형(그림 Ⅳ-7 형식)으로 보여 주고 양성자수를 바꾸기 → { set(p) }
   AT.row(host, ps)  간단히 나타낸 원자 여러 개를 나란히(첫 화면 그림) */
(() => {
  const { TAU, clamp, lerp, easeOut, surface, overlay, addLoop, tweens, white, contact, rgba } = EL;

  AT.lab = function (host) {
    const W = 1000, H = 760, X = 500, Y = 312, R = 262, NR = 0.17, ER = 0.068;
    const S = surface(host, W, H), ol = overlay(S), tw = tweens(), ctx = S.ctx;
    const st = { p: null, name: '', es: [], t: 0, pulse: 0, flash: 0 };
    const API = { st, onChange: null, onBlock: null };
    const ch = () => API.onChange && API.onChange(st);

    host.addEventListener('pointerdown', (ev) => {
      const [x, y] = S.toLocal(ev), dx = (x - X) / R, dy = (y - Y) / R, d = Math.hypot(dx, dy);
      if (d > 1.02) return;
      const hit = st.es.findIndex((q) => Math.hypot(q.x - dx, q.y - dy) < ER * 1.7);
      if (hit >= 0) { const q = st.es[hit]; tw.add(0.22, (k) => (q.s = 1 - k), () => { st.es.splice(st.es.indexOf(q), 1); ch(); }); return; }
      if (st.p == null) { API.onBlock && API.onBlock('p'); return; }
      if (d < NR + ER * 1.2) { API.onBlock && API.onBlock('core'); return; }
      if (st.es.length >= st.p) { st.flash = 1; API.onBlock && API.onBlock('full'); return; }
      let px = dx, py = dy; const lim = 1 - ER * 1.3; if (d > lim) { px *= lim / d; py *= lim / d; }
      // 다른 전자와 겹치면 조금 밀어 냄
      st.es.forEach((q) => { const ex = px - q.x, ey = py - q.y, e = Math.hypot(ex, ey); if (e < ER * 2.1 && e > 0) { px = q.x + ex / e * ER * 2.1; py = q.y + ey / e * ER * 2.1; } });
      const q = { x: px, y: py, s: 0, ph: Math.random() * TAU };
      st.es.push(q); tw.add(0.3, (k) => (q.s = 0.4 + 0.6 * easeOut(k)));
      ch();
    });

    function token(x, y, r, kind, on) { AT.part(ctx, x, y, r, kind, on ? 1 : 0.18); }
    addLoop(host, (dt) => {
      st.t += dt; tw.step(dt); st.pulse = Math.max(0, st.pulse - dt * 1.6); st.flash = Math.max(0, st.flash - dt * 1.5);
      S.begin(); white(S);
      AT.cloud(ctx, X, Y, R, { ring: st.flash > 0 });
      // 원자핵
      const nr = R * NR * (1 + Math.sin(st.pulse * Math.PI) * 0.12);
      if (st.p == null) {
        ctx.save(); ctx.setLineDash([7, 6]); ctx.strokeStyle = '#d56a62'; ctx.lineWidth = 2.4; ctx.fillStyle = 'rgba(242,170,164,.55)';
        ctx.beginPath(); ctx.arc(X, Y, nr, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
      } else AT.atom(ctx, X, Y, R, { mode: 'simple', e: 0, nr: nr / R, noCloud: true });
      // 전자 붙임딱지(살짝 떨림)
      st.es.forEach((q) => { const b = Math.sin(st.t * 3 + q.ph) * 0.006; AT.part(ctx, X + (q.x + b) * R, Y + (q.y - b) * R, R * ER * q.s, 'e'); });
      // 전하 줄: 양성자 줄과 전자 줄을 짝지어 놓기
      const n = Math.max(st.p || 0, st.es.length, 1), gap = Math.min(40, 520 / n), x0 = 560 - (n - 1) * gap / 2;
      const y1 = 652, y2 = 708;
      ctx.fillStyle = '#f4f7fa'; EL.rr(ctx, 160, 620, 760, 122, 18); ctx.fill();
      for (let i = 0; i < n; i++) {
        const x = x0 + i * gap;
        if (i < (st.p || 0)) token(x, y1, 13, 'p', true); else { ctx.strokeStyle = '#d3dce6'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(x, y1, 12, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
        if (i < st.es.length) token(x, y2, 13, 'e', true); else { ctx.strokeStyle = '#d3dce6'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(x, y2, 12, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
      }
      // 이름표
      ol.put('nq', X, Y, st.p == null ? '?' : `+${st.p}`, 'tx nq');
      ol.put('nm', X, Y + R + 26, st.name ? `<b>${st.name}</b> 원자` : '', 'tx cap2');
      if (!st.name) ol.hide('nm');
      ol.put('r1', 180, y1, `양성자 총전하량 <b>${st.p == null ? '?' : '+' + st.p}</b>`, 'tx qrow');
      ol.put('r2', 180, y2, `전자 총전하량 <b>${st.es.length ? '−' + st.es.length : '0'}</b>`, 'tx qrow');
    });

    API.setAtom = (name) => { st.name = name; st.p = null; st.es = []; ch(); };
    API.setP = (p) => { st.p = p; st.pulse = 1; if (p != null && st.es.length > p) st.es.length = p; ch(); };
    API.clear = () => { st.es = []; ch(); };
    API.fill = (upto) => {
      if (st.p == null) return;
      const need = (upto == null ? st.p : upto) - st.es.length;
      for (let i = 0; i < need; i++) {
        const k = st.es.length, a = k * 2.399 + 0.6, r = 0.42 + (k % 3) * 0.16;
        st.es.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, s: 1, ph: Math.random() * TAU });
      }
      ch();
    };
    return API;
  };

  // 원자 하나: 간단히 나타낸 모형, 전자는 원자 안에서 움직임
  AT.single = function (host, o = {}) {
    const W = o.W || 600, H = o.H || 600, X = W / 2, Y = o.Y || H / 2 - 10, R = o.R || Math.min(W, H) * 0.4;
    const S = surface(host, W, H), ol = overlay(S), ctx = S.ctx;
    const st = { p: o.p || 1, t: 0, orb: AT.orbits(o.p || 1, 40 + (o.p || 1)), pulse: 0, fade: 1 };
    addLoop(host, (dt) => {
      st.t += dt; st.pulse = Math.max(0, st.pulse - dt * 1.8); st.fade = Math.min(1, st.fade + dt * 2.5);
      S.begin(); white(S);
      const ea = st.orb.map(() => st.fade);
      const r = AT.atom(ctx, X, Y, R, { mode: 'simple', e: st.p, orb: st.orb, t: st.t, nr: 0.21 * (1 + Math.sin(st.pulse * Math.PI) * 0.14), er: st.p > 10 ? 0.045 : 0.055, ea });
      ol.put('nq', X, Y, `+${st.p}`, 'tx nq sm');
      if (o.label) ol.put('nm', X, Y + R + (o.labelGap || 34), o.label(st.p), 'tx cap2'); else ol.hide('nm');
    });
    return { st, set(p) { if (p === st.p) return; st.p = p; st.orb = AT.orbits(p, 40 + p); st.pulse = 1; st.fade = 0; } };
  };

  // 여러 원자를 나란히: ps = [[양성자수, 이름]…]
  AT.row = function (host, ps, o = {}) {
    const W = o.W || 1200, H = o.H || 560, n = ps.length, R = o.R || 150;
    const S = surface(host, W, H), ol = overlay(S), ctx = S.ctx;
    const orbs = ps.map(([p]) => AT.orbits(p, 60 + p)); let t = 0;
    addLoop(host, (dt) => {
      t += dt; S.begin(); white(S);
      ps.forEach(([p, nm], i) => {
        const x = W / (n + 1) * (i + 1) + (i - (n - 1) / 2) * 0, y = H / 2 - 30;
        AT.atom(ctx, x, y, R, { mode: 'simple', e: p, orb: orbs[i], t: t + i, nr: 0.27, er: 0.085 });
        ol.put('q' + i, x, y, `+${p}`, 'tx nq sm');
        ol.put('n' + i, x, y + R + 40, `<b>${nm}</b> 원자<span class="u2">양성자 ${p}개 · 전자 ${p}개</span>`, 'tx inm2');
      });
    });
  };
})();
