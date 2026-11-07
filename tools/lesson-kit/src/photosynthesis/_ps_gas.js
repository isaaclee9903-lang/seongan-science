/* ===== 탐구 2: 광합성에 필요한 물질과 생산된 물질 (교과서 172쪽, 디지털 ON) =====
   농도 숫자는 교과서 그림에서 읽을 수 없어 눈금 없는 모형으로 그린다. 두 기체의 세로 눈금은 서로 다르다. */
(() => {
  'use strict';
  const { el, grad, leafData, drawLeaf, PAL, flock, tween, loop, mk, lerp, stage, clamp, bench, shadow, sprite } = PS;
  const CO2C = '#39424c', O2C = '#d9472f';
  PS.gasLab = function (host, o = {}) {
    const ST = stage(host, [0, 118, 1000, 660]), root = el('g', null, ST.svg);
    let fast = false; const T = (m) => (fast ? 0 : m);
    bench(root, 720);
    shadow(root, 760, 726, 230, 18, .25); shadow(root, 250, 722, 260, 18, .26); shadow(root, 500, 726, 60, 10, .3);
    /* 태블릿 */
    const SX = 34, SY = 268, SW = 430, SH = 322;
    const tb = el('g', null, root);
    el('path', { d: `M${SX + SW / 2 - 60} ${SY + SH + 14}L${SX + SW / 2 - 96} 722H${SX + SW / 2 + 96}L${SX + SW / 2 + 60} ${SY + SH + 14}Z`, fill: grad([[0, '#cdd6de'], [1, '#a9b6c2']]), stroke: '#94a3b0' }, tb);
    el('rect', { x: SX - 14, y: SY - 14, width: SW + 28, height: SH + 28, rx: 20, fill: '#20262c', stroke: '#0f1316', 'stroke-width': 1.2 }, tb);
    el('rect', { x: SX, y: SY, width: SW, height: SH, rx: 5, fill: '#fff' }, tb);
    const gx = SX + 44, gy = SY + 40, gw = SW - 66, gh = SH - 84;
    const grid = el('g', { stroke: '#e3eaf0', 'stroke-width': 1 }, tb);
    for (let i = 0; i <= 5; i++) { const x = gx + gw * i / 5; el('line', { x1: x, x2: x, y1: gy, y2: gy + gh }, grid); }
    for (let i = 0; i <= 4; i++) { const y = gy + gh * i / 4; el('line', { x1: gx, x2: gx + gw, y1: y, y2: y }, grid); }
    el('path', { d: `M${gx} ${gy}V${gy + gh}H${gx + gw}`, fill: 'none', stroke: '#5a6b7e', 'stroke-width': 1.6 }, tb);
    for (let i = 0; i <= 5; i++) ST.label(gx + gw * i / 5, gy + gh + 15, String(i * 2), 'm').e.style.fontSize = '12px';
    const yl = ST.label(SX + 18, gy + gh / 2, '농도', 'm'); yl.e.style.fontSize = '12.5px'; yl.e.style.writingMode = 'vertical-rl';
    const xl = ST.label(gx + gw / 2, gy + gh + 34, '시간(분)', 'm'); xl.e.style.fontSize = '12.5px';
    const others = el('g', { fill: 'none', 'stroke-width': 1.6, opacity: 0, style: 'transition:opacity .5s' }, tb);
    const tempL = el('path', { fill: 'none', stroke: '#a5b1bd', 'stroke-width': 1.8, 'stroke-dasharray': '6 5' }, tb);
    const co2L = el('path', { fill: 'none', stroke: CO2C, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, tb);
    const o2L = el('path', { fill: 'none', stroke: O2C, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, tb);
    const dotC = el('circle', { r: 5, fill: CO2C, opacity: 0 }, tb), dotO = el('circle', { r: 5, fill: O2C, opacity: 0 }, tb);
    const status = ST.label(SX + SW / 2, SY + 19, '센서를 기다리는 중', 'm'); status.e.style.fontSize = '13px';
    const lC = ST.label(0, 0, '이산화 탄소', '').show(false), lO = ST.label(0, 0, '산소', '').show(false), lTm = ST.label(0, 0, '온도', 'm').show(false);
    lC.e.style.color = CO2C; lO.e.style.color = O2C; lC.e.style.fontSize = lO.e.style.fontSize = '13.5px'; lTm.e.style.fontSize = '12.5px';
    const px = (f) => gx + gw * f, py = (v) => gy + gh * (1 - v);
    const R = mk(31), nC = [], nO = [];
    const N = 60; for (let i = 0; i <= N; i++) { nC.push((R() - .5) * .022); nO.push((R() - .5) * .022); }
    const shape = (f) => (1 - Math.exp(-1.9 * f)) / (1 - Math.exp(-1.9));
    const co2v = (f, i, k = 1) => .9 - .72 * k * shape(f) + (nC[i] || 0);
    const o2v = (f, i, k = 1) => .14 + .68 * k * shape(f) + (nO[i] || 0);
    const lineD = (fn, n) => { let d = ''; for (let i = 0; i <= n; i++) { const f = i / N; d += (i ? 'L' : 'M') + PS.f1(px(f)) + ' ' + PS.f1(py(fn(f, i))); } return d; };
    /* 다른 모둠 */
    [[.92, 1.06, 77], [1.1, .88, 91]].forEach(([k1, k2, s]) => {
      const Q = mk(s), a = [], b = []; for (let i = 0; i <= N; i++) { a.push((Q() - .5) * .024); b.push((Q() - .5) * .024); }
      el('path', { d: lineD((f, i) => .9 - .72 * k1 * shape(f) + a[i] + .015, N), stroke: CO2C, opacity: .32 }, others);
      el('path', { d: lineD((f, i) => .14 + .68 * k2 * shape(f) + b[i], N), stroke: O2C, opacity: .36 }, others);
    });
    /* LED 등 */
    const ledG = el('g', null, root), LX = 520;
    const cone = el('path', { d: `M${LX + 18} 250L905 330V700L${LX + 18} 640Z`, fill: grad([[0, '#fff2a8', .62], [1, '#fff2a8', .06]], { x2: 1, y2: 0 }), opacity: 0, style: 'transition:opacity .5s' }, ledG);
    el('path', { d: `M${LX - 44} 722L${LX - 30} 680H${LX + 30}L${LX + 44} 722Z`, fill: grad([[0, '#7a8894'], [1, '#55616c']]), stroke: '#47525c' }, ledG);
    el('rect', { x: LX - 17, y: 226, width: 34, height: 456, rx: 8, fill: grad([[0, '#8b98a4'], [.5, '#a9b5bf'], [1, '#70808d']], { x2: 1, y2: 0 }), stroke: '#5e6b76' }, ledG);
    const strip = el('rect', { x: LX + 6, y: 242, width: 8, height: 424, rx: 4, fill: '#c8d2da' }, ledG);
    /* 투명 밀폐 장치 */
    const BX = 590, BY = 322, BW = 350, BH = 394;
    el('path', { d: `M${BX} ${BY}L${BX + 14} ${BY + BH - 12}Q${BX + 15} ${BY + BH} ${BX + 28} ${BY + BH}H${BX + BW - 28}Q${BX + BW - 15} ${BY + BH} ${BX + BW - 14} ${BY + BH - 12}L${BX + BW} ${BY}Z`, fill: 'rgba(226,238,245,.34)', stroke: '#8ba0b2', 'stroke-width': 2 }, root);
    /* 상추 */
    const LEAFS = [[742, 706, -112, .8, 5], [788, 706, -68, .8, 7], [765, 706, -92, .92, 2], [722, 708, -142, .62, 9], [808, 708, -38, .62, 13], [765, 708, -84, .6, 15]];
    LEAFS.forEach(([x, y, r, s, seed]) => drawLeaf(root, leafData({ L: 196, W: 84, p: .52, q: .78, seed, sec: 6, ruffle: .1, teeth: .03, nt: 30, nA: 60, vw: 5, D: 6, di: 30 }), PAL.let, { tf: `translate(${x} ${y}) rotate(${r}) scale(${s})`, edge: 1.1, shade: .1, veinOp: .9 }));
    const mol = el('g', null, root);
    /* 뚜껑 + 센서 */
    const lid = el('g', null, root);
    el('rect', { x: BX - 12, y: BY - 22, width: BW + 24, height: 18, rx: 6, fill: grad([[0, '#f6f8fa'], [1, '#d3dce4']]), stroke: '#a4b2bf' }, lid);
    el('rect', { x: BX - 8, y: BY - 5, width: BW + 16, height: 7, rx: 3, fill: '#c9483a' }, lid);
    const sens = el('g', null, lid), SP = [[BX + 72, '산소 센서'], [BX + 175, '온도 센서'], [BX + 278, '이산화 탄소 센서']];
    const sensG = SP.map(([x, n], i) => {
      const s = el('g', null, sens);
      el('rect', { x: x - 4, y: BY - 22, width: 8, height: 60, fill: '#67737e' }, s);
      el('rect', { x: x - 27, y: BY - 118, width: 54, height: 90, rx: 8, fill: grad([[0, '#2aa2d6'], [1, '#157eb0']], { x2: 1, y2: 0 }), stroke: '#0f6a95' }, s);
      el('rect', { x: x - 20, y: BY - 110, width: 40, height: 22, rx: 3, fill: '#16242e' }, s);
      el('rect', { x: x - 15, y: BY - 104, width: 30, height: 4, fill: '#7fe0a5', opacity: .75 }, s);
      el('rect', { x: x - 15, y: BY - 97, width: 18, height: 3, fill: '#7fe0a5', opacity: .5 }, s);
      el('circle', { cx: x, cy: BY - 58, r: 6.5, fill: '#e9f2f7', stroke: '#0f6a95' }, s);
      el('rect', { x: x - 16, y: BY - 28, width: 32, height: 8, rx: 3, fill: '#20313e' }, s);
      return s;
    });
    const sl = SP.map(([x, n]) => { const l = ST.label(x, BY - 136, n.replace(' 센서', ''), 'm'); l.e.style.fontSize = '12.5px'; return l.show(false); });
    const lLED = ST.label(LX, 206, 'LED등', 'm'), lBox = ST.label(BX + BW / 2, 750, '투명 밀폐 장치와 상추', 'm'), lTab = ST.label(SX + SW / 2, 750, '스마트 기기', 'm');
    /* 뚜껑·센서 처음 위치 */
    const setLid = (t) => lid.setAttribute('transform', `translate(0 ${(1 - t) * -210})`);
    const setSens = (t) => sensG.forEach((s, i) => { s.setAttribute('transform', `translate(0 ${(1 - t) * -160})`); s.setAttribute('opacity', t); });
    setLid(0); setSens(0);
    /* 기체 입자 */
    const parts = []; const Rm = Math.random;
    const LF = [[760, 610], [715, 630], [810, 630], [765, 570]];
    const spawn = (kind, x, y) => { const u = el('use', { href: kind === 'c' ? '#mCO2' : '#mO2' }, mol), a = Rm() * 6.28, p = { u, kind, x, y, vx: Math.cos(a) * 26, vy: Math.sin(a) * 26, rot: Rm() * 360, seek: null }; parts.push(p); return p; };
    const inBox = () => [BX + 34 + Rm() * (BW - 68), BY + 22 + Rm() * 200];
    for (let i = 0; i < 15; i++) { const b = inBox(); spawn('c', b[0], b[1]); }
    for (let i = 0; i < 6; i++) { const b = inBox(); spawn('o', b[0], b[1]); }
    let f = 0, running = false, sealed = false, onP = null, done = null;
    const cnt = (k) => parts.filter((p) => p.kind === k && !p.seek).length;
    const stepMol = (dt) => {
      parts.forEach((p) => {
        if (p.seek) { const dx = p.seek[0] - p.x, dy = p.seek[1] - p.y, m = Math.hypot(dx, dy) || 1; p.x += dx / m * 120 * dt; p.y += dy / m * 120 * dt; if (m < 8) p.gone = true; }
        else { p.vx += (Rm() - .5) * 30 * dt * 10; p.vy += (Rm() - .5) * 30 * dt * 10; const sp = Math.hypot(p.vx, p.vy) || 1; p.vx = p.vx / sp * 26; p.vy = p.vy / sp * 26; p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.x < BX + 30) p.vx = Math.abs(p.vx); if (p.x > BX + BW - 30) p.vx = -Math.abs(p.vx); if (p.y < BY + 20) p.vy = Math.abs(p.vy); if (p.y > BY + 215) p.vy = -Math.abs(p.vy); }
        p.rot += 30 * dt; p.u.setAttribute('transform', `translate(${PS.f1(p.x)} ${PS.f1(p.y)}) rotate(${PS.f1(p.rot)}) scale(.82)`);
      });
      for (let i = parts.length - 1; i >= 0; i--) if (parts[i].gone) { parts[i].u.remove(); parts.splice(i, 1); }
    };
    const syncCount = () => {
      const wantC = Math.round(lerp(15, 3, shape(f))), wantO = Math.round(lerp(6, 19, shape(f)));
      if (cnt('c') > wantC) { const c = parts.find((p) => p.kind === 'c' && !p.seek); if (c) c.seek = LF[Math.floor(Rm() * LF.length)]; }
      if (cnt('o') < wantO) { const l = LF[Math.floor(Rm() * LF.length)]; const p = spawn('o', l[0], l[1]); p.vy = -26; }
    };
    const draw = () => {
      const n = Math.round(f * N), c = (g, i) => co2v(g, i), oo = (g, i) => o2v(g, i);
      co2L.setAttribute('d', lineD(c, n)); o2L.setAttribute('d', lineD(oo, n)); tempL.setAttribute('d', `M${px(0)} ${py(.5)}L${px(n / N)} ${py(.5)}`);
      if (n > 0) {
        const xx = px(n / N), yc = py(co2v(n / N, n)), yo = py(o2v(n / N, n));
        dotC.setAttribute('cx', xx); dotC.setAttribute('cy', yc); dotC.setAttribute('opacity', 1); dotO.setAttribute('cx', xx); dotO.setAttribute('cy', yo); dotO.setAttribute('opacity', 1);
        lC.move(gx + 92, gy + 12).show(true); lO.move(gx + 30, py(.14) + 15).show(true); lTm.move(gx + gw - 18, py(.5) - 11).show(true);
      }
      const sec = Math.round(f * 600), mm = Math.floor(sec / 60), ss = sec % 60;
      status.set(`측정 시간 ${mm}분 ${String(ss).padStart(2, '0')}초 · 10초마다 측정`);
    };
    const DUR = 15;
    const lp = loop((dt) => {
      if (sealed || parts.length) stepMol(dt);
      if (running) {
        f = Math.min(1, f + dt / DUR); syncCount(); draw(); onP && onP(f);
        if (f >= 1) { running = false; status.set('측정 끝 · 10분 동안 기록했어요'); done && done(); }
      }
    });
    const api = {
      close(cb) { tween(T(800), setLid, () => { sealed = true; cb && cb(); }); },
      connect(cb) { tween(T(750), setSens, () => { sl.forEach((l) => l.show(true)); status.set('센서 3개 연결됨'); cb && cb(); }); },
      light(v) { cone.setAttribute('opacity', v ? 1 : 0); strip.setAttribute('fill', v ? '#fff6c0' : '#c8d2da'); },
      run(cb, p) { api.light(true); onP = p; done = cb; running = true; },
      others(v) { others.setAttribute('opacity', v ? 1 : 0); },
      jump(step, ff = 1) {
        fast = true; if (step >= 1) { setLid(1); sealed = true; } if (step >= 2) { setSens(1); sl.forEach((l) => l.show(true)); status.set('센서 3개 연결됨'); }
        if (step >= 3) { api.light(true); f = ff; const wc = Math.round(lerp(15, 3, shape(f))), wo = Math.round(lerp(6, 19, shape(f))); while (cnt('c') > wc) { const i = parts.findIndex((p) => p.kind === 'c'); parts[i].u.remove(); parts.splice(i, 1); } while (cnt('o') < wo) { const b = inBox(); spawn('o', b[0], b[1]); } draw(); if (ff >= 1) status.set('측정 끝 · 10분 동안 기록했어요'); }
        fast = false;
      },
      get f() { return f; },
    };
    return api;
  };
})();
