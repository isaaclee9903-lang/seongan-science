/* ===== 잎 속 확대 그림 PFX.leaf =====
   잎을 잘라 비스듬히 본 덩어리 그림. 위에서 빛 알갱이가 내려와 엽록체에 닿고, 아래 기공으로 이산화 탄소가 들어가
   엽록체에서 쓰이고, 산소가 기공으로 나간다. 빛의 세기·이산화 탄소 농도·온도(0~1)에 따라 양과 빠르기가 달라진다.
   잎 조직 이름(책상 조직 등)은 교육과정 밖이라 그림으로만 그린다. 세포 모양은 일반 식물 해부 그림을 참고해 새로 그림. */
window.PFX = (() => {
  'use strict';
  const { el, grad, flock, loop, mk, lerp, clamp, stage, f1, defs } = PS;

  function litDef() {
    const d = defs(); if (d.querySelector('#mLit')) return;
    const g = el('g', { id: 'mLit' }, d);
    el('circle', { r: 10, fill: grad([[0, '#fff8c9', 1], [.5, '#ffe066', .9], [1, '#ffcf3a', 0]], { r: 1, rr: .5 }) }, g);
    el('circle', { r: 3.6, fill: '#fffbe0' }, g);
  }
  /* 둥근 다각형(세포벽) */
  const blob = (cx, cy, rx, ry, R, n = 9, j = .16) => {
    const pts = []; const a0 = R() * 6.28;
    for (let i = 0; i < n; i++) { const a = a0 + i / n * 6.283, k = 1 + (R() - .5) * 2 * j; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    let d = ''; pts.forEach((p, i) => { const q = pts[(i + 1) % n], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; d += (i ? '' : `M${f1((pts[n - 1][0] + p[0]) / 2)} ${f1((pts[n - 1][1] + p[1]) / 2)}`) + `Q${f1(p[0])} ${f1(p[1])} ${f1(m[0])} ${f1(m[1])}`; });
    return d + 'Z';
  };
  const rrect = (x, y, w, h, r) => `M${f1(x + r)} ${f1(y)}H${f1(x + w - r)}Q${f1(x + w)} ${f1(y)} ${f1(x + w)} ${f1(y + r)}V${f1(y + h - r)}Q${f1(x + w)} ${f1(y + h)} ${f1(x + w - r)} ${f1(y + h)}H${f1(x + r)}Q${f1(x)} ${f1(y + h)} ${f1(x)} ${f1(y + h - r)}V${f1(y + r)}Q${f1(x)} ${f1(y)} ${f1(x + r)} ${f1(y)}Z`;

  function leaf(host, o = {}) {
    litDef();
    const ST = stage(host, o.vb || [40, 6, 890, 630]), svg = ST.svg, R = mk(7);
    const root = el('g', null, svg);
    /* 배경: 위는 빛이 드는 공기, 아래는 잎 밑 공기 */
    el('rect', { x: -200, y: -200, width: 1400, height: 1100, fill: grad([[0, '#eaf4fb'], [.3, '#f7fbfd'], [.85, '#fbfcfd'], [1, '#f1f5f9']]) }, root);
    const X0 = 100, X1 = 780, Y0 = 200, Y1 = 530, DX = 60, DY = -56;
    /* 빛줄기(뒤) */
    const beams = el('g', null, root);
    for (let i = 0; i < 7; i++) {
      const x = 140 + i * 100;
      el('path', { d: `M${x - 30} -20L${x + 26} -20L${x + 58} ${Y0 - 6}L${x - 4} ${Y0 - 6}Z`, fill: grad([[0, '#fff1a6', .55], [1, '#fff1a6', .05]]) }, beams);
    }
    /* 윗면: 잎 겉 */
    const top = el('g', null, root);
    el('path', { d: `M${X0} ${Y0}L${X0 + DX} ${Y0 + DY}H${X1 + DX}L${X1} ${Y0}Z`, fill: grad([[0, '#5fa83f'], [1, '#7cc04e']], { x2: 1, y2: 0 }), stroke: '#3f7a2a', 'stroke-width': 1.4 }, top);
    /* 잎맥(윗면, 원근) */
    const vein = (u0, u1, v0, v1, w) => { const P = (u, v) => [X0 + (X1 - X0) * u + DX * v, Y0 + DY * v]; const a = P(u0, v0), b = P(u1, v1); el('path', { d: `M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}`, stroke: '#b5e08b', 'stroke-width': w, opacity: .75, 'stroke-linecap': 'round' }, top); };
    vein(.48, .52, 0, 1, 3.2);
    [[.1, .35], [.22, .62], [.3, .82], [.6, .9], [.7, .7], [.84, .52]].forEach(([u, v]) => { vein(.5 + (u - .5) * .0, u, v * .5, v, 1.4); });
    /* 오른쪽 옆면 */
    el('path', { d: `M${X1} ${Y0}L${X1 + DX} ${Y0 + DY}V${Y1 + DY}L${X1} ${Y1}Z`, fill: grad([[0, '#a6c98a'], [.12, '#8fbd6a'], [.48, '#b6d39c'], [.86, '#9fc483'], [1, '#6f9f55']]), stroke: '#4f7f38', 'stroke-width': 1.2 }, root);
    /* 앞면: 자른 면 */
    const face = el('g', null, root);
    const clipId = 'pfxclip' + Math.floor(R() * 1e6);
    const cp = el('clipPath', { id: clipId }, el('defs', null, svg)); el('rect', { x: X0, y: Y0, width: X1 - X0, height: Y1 - Y0 }, cp);
    el('rect', { x: X0, y: Y0, width: X1 - X0, height: Y1 - Y0, fill: '#f2f7ec' }, face);
    const cells = el('g', { 'clip-path': `url(#${clipId})` }, face);
    const WALL = '#86b264', CYT = grad([[0, '#f6fbef'], [1, '#e3f0d3']]);
    const chloros = [];
    const chl = (cx, cy, a, s = 1, g = cells) => {
      const c = el('g', { transform: `translate(${f1(cx)} ${f1(cy)}) rotate(${f1(a)}) scale(${s})` }, g);
      const body = el('ellipse', { rx: 9.5, ry: 5.2, fill: '#3e9a3a', stroke: '#1f5d21', 'stroke-width': 1 }, c);
      el('path', { d: 'M-5 -2.6V2.6M-1.5 -3.6V3.6M2 -3.6V3.6M5.4 -2.4V2.4', stroke: '#8fd36b', 'stroke-width': 1.1, opacity: .8 }, c);
      el('ellipse', { rx: 6, ry: 2.2, cy: -1.6, fill: '#7ccc5c', opacity: .45 }, c);
      const glow = el('ellipse', { rx: 13, ry: 8.5, fill: '#fff07a', opacity: 0 }, c); c.insertBefore(glow, body);
      const k = { x: cx, y: cy, body, glow, hot: 0 }; chloros.push(k); return k;
    };
    /* 위 표피 */
    const EP = 36; let x = X0 - 10;
    while (x < X1) { const w = 50 + R() * 22; el('path', { d: rrect(x + 1.5, Y0 + 4, w - 3, EP - 6, 8), fill: '#f8fcf3', stroke: WALL, 'stroke-width': 2 }, cells); x += w; }
    el('rect', { x: X0, y: Y0, width: X1 - X0, height: 4, fill: '#cfe6b5' }, cells);
    /* 길쭉한 세포 줄(위) */
    const PT = Y0 + EP, PH = 120; x = X0 - 6; const pal = [];
    while (x < X1) {
      const w = 30 + R() * 8, h = PH - R() * 10;
      el('path', { d: rrect(x + 2, PT + 2, w - 4, h - 4, 13), fill: CYT, stroke: WALL, 'stroke-width': 2.2 }, cells);
      pal.push([x + w / 2, PT + h / 2]);
      for (let k = 0; k < 7; k++) { const side = k % 2 ? 1 : -1; chl(x + w / 2 + side * (w / 2 - 9), PT + 16 + k * (h - 32) / 6 + (R() - .5) * 6, 90 + (R() - .5) * 20, .82); }
      x += w;
    }
    /* 잎맥 다발 */
    const VX = 420, VY = PT + PH + 58;
    /* 둥근 세포(아래, 공기 틈이 많음) */
    const SP0 = PT + PH + 4, SP1 = Y1 - 38, holes = [];
    const STX = 590, STW = 34; /* 기공 자리 */
    for (let gy = SP0 + 18; gy < SP1 - 8; gy += 40) {
      for (let gx = X0 + 6 + (gy % 80 ? 20 : 0); gx < X1 + 10; gx += 56) {
        const cx = gx + (R() - .5) * 18, cy = gy + (R() - .5) * 10;
        if (Math.hypot(cx - VX, (cy - VY) * 1.25) < 70) continue;
        if (Math.abs(cx - STX) < 42 && cy > SP1 - 46) continue;
        if (R() < .16) { holes.push([cx, cy]); continue; }
        const rx = 18 + R() * 7, ry = 13 + R() * 6;
        el('path', { d: blob(cx, cy, rx, ry, R, 9, .14), fill: CYT, stroke: WALL, 'stroke-width': 2 }, cells);
        for (let k = 0; k < 3; k++) { const a = R() * 6.28; chl(cx + Math.cos(a) * (rx - 8), cy + Math.sin(a) * (ry - 6), a * 57.3 + 90, .66); }
      }
    }
    el('ellipse', { cx: VX, cy: VY, rx: 62, ry: 48, fill: '#eef5dc', stroke: '#a9c27e', 'stroke-width': 2 }, cells);
    for (let i = 0; i < 26; i++) { const a = R() * 6.28, r = Math.sqrt(R()) * 38; el('path', { d: blob(VX + Math.cos(a) * r, VY + Math.sin(a) * r * .75, 8 + R() * 4, 7 + R() * 3, R, 7, .2), fill: i % 3 ? '#f7f2d8' : '#e8dfb5', stroke: '#b9a86b', 'stroke-width': 1.2 }, cells); }
    /* 아래 표피와 기공 */
    x = X0 - 14; const LE = Y1 - 34;
    while (x < X1) {
      let w = 44 + R() * 20;
      if (x + w > STX - STW && x < STX + STW) { const a = STX - STW - x; if (a > 12) el('path', { d: rrect(x + 1.5, LE + 2, a - 3, 28, 7), fill: '#f8fcf3', stroke: WALL, 'stroke-width': 2 }, cells); x = STX + STW; continue; }
      el('path', { d: rrect(x + 1.5, LE + 2, w - 3, 28, 7), fill: '#f8fcf3', stroke: WALL, 'stroke-width': 2 }, cells); x += w;
    }
    /* 기공 둘레 세포 한 쌍(콩팥 모양) */
    [-1, 1].forEach((s) => {
      const gx = STX + s * 19;
      el('path', { d: `M${gx - 15} ${LE + 2}C${gx - 18} ${LE + 18} ${gx - 12} ${LE + 32} ${gx} ${LE + 32}C${gx + 12} ${LE + 32} ${gx + 18} ${LE + 18} ${gx + 15} ${LE + 2}C${gx + 6} ${LE + 8} ${gx - 6} ${LE + 8} ${gx - 15} ${LE + 2}Z`, fill: '#e5f2d4', stroke: '#6f9b4f', 'stroke-width': 2.2 }, cells);
      chl(gx - 4, LE + 20, 30 * s, .55); chl(gx + 5, LE + 16, -20 * s, .5);
    });
    el('rect', { x: X0, y: Y1 - 4, width: X1 - X0, height: 4, fill: '#cfe6b5' }, cells);
    el('rect', { x: STX - 4, y: Y1 - 6, width: 8, height: 8, fill: '#f2f7ec' }, cells);
    el('rect', { x: X0, y: Y0, width: X1 - X0, height: Y1 - Y0, fill: 'none', stroke: '#4f7f38', 'stroke-width': 1.6 }, face);
    /* 이름표 */
    const lab = [];
    const pick = chloros.filter((k) => k.y < PT + PH && k.x > X1 - 70 && k.x < X1 - 20 && k.y > PT + 30)[0] || chloros[0];
    if (o.labels !== false) {
      el('path', { d: `M${f1(pick.x + 8)} ${f1(pick.y - 4)}L${X1 + DX + 8} ${Y0 + 70}`, stroke: '#14263b', 'stroke-width': 1.3, fill: 'none' }, root);
      el('circle', { cx: pick.x, cy: pick.y, r: 13, fill: 'none', stroke: '#14263b', 'stroke-width': 1.5 }, root);
      lab.push(ST.label(X1 + DX + 12, Y0 + 70, '엽록체', 'bg ra'));
      lab.push(ST.label(STX, Y1 + 34, '기공', 'bg'));
      lab.push(ST.label(96, 46, '빛', 'bg'));
    }
    /* 입자 */
    const mol = el('g', null, root), fl = flock(mol);
    const amb = Array.from({ length: 16 }, (_, i) => ({ u: el('use', { href: '#mCO2', opacity: 0 }, mol), x: X0 + R() * (X1 - X0), y: Y1 + 40 + R() * 70, a: R() * 6.28, on: 0 }));
    const legend = o.labels !== false ? [ST.label(560, 40, '<i class="lgd co2"></i>이산화 탄소', 'm ra'), ST.label(740, 40, '<i class="lgd o2"></i>산소', 'm ra')] : [];
    let L = .6, C = .6, T = .55, r = 0, accL = 0, accC = 0;
    const api = {
      ST,
      set(a, b, c) {
        L = a; C = b; T = c; r = PF.rate(L, C, T);
        beams.setAttribute('opacity', f1(.08 + .92 * L));
        chloros.forEach((k) => k.body.setAttribute('fill', `rgb(${Math.round(lerp(96, 52, L))},${Math.round(lerp(140, 160, L))},${Math.round(lerp(78, 54, L))})`));
        return r;
      },
      get rate() { return r; },
    };
    const inside = () => { const p = pal[Math.floor(R() * pal.length)]; return [p[0] + (R() - .5) * 14, p[1] + (R() - .5) * 70]; };
    const hole = () => holes.length ? holes[Math.floor(R() * holes.length)] : [STX, SP1 - 20];
    loop((dt, now) => {
      fl.step(dt);
      const want = Math.round(C * amb.length);
      amb.forEach((a, i) => {
        a.on += ((i < want ? 1 : 0) - a.on) * Math.min(1, dt * 3);
        if (a.on < .03) { a.u.setAttribute('opacity', 0); return; }
        a.a += (R() - .5) * dt * 2; a.x += Math.cos(a.a) * 22 * dt; a.y += Math.sin(a.a) * 12 * dt;
        if (a.x < X0) a.a = 0; if (a.x > X1) a.a = 3.14; if (a.y < Y1 + 26) a.a = 1.57; if (a.y > 600) a.a = -1.57;
        a.u.setAttribute('transform', `translate(${f1(a.x)} ${f1(a.y)}) rotate(${f1(now * 30 + i * 40)}) scale(.5)`);
        a.u.setAttribute('opacity', f1(a.on));
      });
      /* 빛 알갱이: 빛의 세기에 비례 */
      accL += dt * L * 7;
      while (accL > 1 && fl.n < 70) {
        accL -= 1; const k = chloros[Math.floor(R() * chloros.length * .7)];
        const sx = k.x - 90 * (k.y - (-10)) / 600;
        fl.add('mLit', [[sx, -10], [k.x, k.y]], { dur: .9 + R() * .3, s: 1.15, spin: 0, fi: .1, fo: .05, cb: () => { k.hot = 1; } });
      }
      /* 이산화 탄소가 기공으로 들어가 쓰이고, 산소가 나온다 */
      accC += dt * r * 2.6;
      while (accC > 1 && fl.n < 70) {
        accC -= 1;
        const on = amb.filter((a) => a.on > .5), a = on[Math.floor(R() * on.length)];
        const s = a ? [a.x, a.y] : [STX + (R() - .5) * 200, 590];
        const h = hole(), t = inside();
        fl.add('mCO2', [s, [STX + (R() - .5) * 6, Y1 + 8], [STX, Y1 - 46], h, t], { dur: 2.6, s: .5, wob: 3, spin: 60, fi: .08, fo: .1, cb: () => {
          const h2 = hole();
          fl.add('mO2', [t, h2, [STX, Y1 - 46], [STX, Y1 + 8], [STX + (R() - .5) * 260, 600 + R() * 20]], { dur: 3, s: .52, wob: 4, spin: 40, fi: .1, fo: .25 });
        } });
      }
      if (accL > 3) accL = 3; if (accC > 3) accC = 3;
      chloros.forEach((k) => { if (k.hot > 0) { k.hot = Math.max(0, k.hot - dt * 2.2); k.glow.setAttribute('opacity', f1(k.hot * .85)); } });
    });
    api.set(o.L ?? .6, o.C ?? .6, o.T ?? .55);
    return api;
  }
  return { leaf };
})();
