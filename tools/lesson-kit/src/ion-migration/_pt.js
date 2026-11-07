/* ===== 물질의 구성 입자 그림 도구 PT: 분자 조립, 이온 만들기, 전기력에 의한 이온 이동. 모두 새로 그림. 크기와 빠르기는 정한 모형 ===== */
window.PT = (() => {
  'use strict';
  const { el, grad, tween, loop, lerp, clamp, stage, f1, flock, defs, shadow, mk, REDUCE } = PS;
  const ATOM = { H: { n: '수소', r: 34, c: ['#ffffff', '#dfe7ef', '#a8b8c8'], t: '#14263b' }, C: { n: '탄소', r: 50, c: ['#7c8590', '#3b424a', '#1f252b'], t: '#fff' }, N: { n: '질소', r: 48, c: ['#8fb7ee', '#3f6fc4', '#274a8f'], t: '#fff' }, O: { n: '산소', r: 48, c: ['#ff9a8a', '#e5533f', '#b5301f'], t: '#fff' }, Cl: { n: '염소', r: 58, c: ['#b7e08a', '#69a93f', '#3f7a22'], t: '#fff' } };
  const MOL = {
    H2: { n: '수소', f: 'H<sub>2</sub>', a: [['H', -32, 0], ['H', 32, 0]] },
    O2: { n: '산소', f: 'O<sub>2</sub>', a: [['O', -46, 0], ['O', 46, 0]] },
    H2O: { n: '물', f: 'H<sub>2</sub>O', a: [['O', 0, -14], ['H', -66, 44], ['H', 66, 44]] },
    CO: { n: '일산화 탄소', f: 'CO', a: [['C', -44, 0], ['O', 46, 0]] },
    HCl: { n: '염화 수소', f: 'HCl', a: [['Cl', -24, 0], ['H', 62, 0]] },
    CO2: { n: '이산화 탄소', f: 'CO<sub>2</sub>', a: [['C', 0, 0], ['O', -92, 0], ['O', 92, 0]] },
    NH3: { n: '암모니아', f: 'NH<sub>3</sub>', a: [['N', 0, -18], ['H', -70, 36], ['H', 70, 36], ['H', 0, 74]] },
    CH4: { n: '메테인', f: 'CH<sub>4</sub>', a: [['C', 0, 0], ['H', -70, -44], ['H', 70, -44], ['H', -70, 44], ['H', 70, 44]] },
  };
  let gr = null;
  const gradOf = (k) => { if (!gr) gr = {}; if (!gr[k]) gr[k] = grad([[0, ATOM[k].c[0]], [.55, ATOM[k].c[1]], [1, ATOM[k].c[2]]], { r: 1, cx: .36, cy: .3, rr: .85 }); return gr[k]; };
  const key = (cnt) => Object.keys(MOL).find((m) => { const c = {}; MOL[m].a.forEach(([k]) => { c[k] = (c[k] || 0) + 1; }); const ks = new Set([...Object.keys(c), ...Object.keys(cnt).filter((x) => cnt[x])]); return [...ks].every((x) => (c[x] || 0) === (cnt[x] || 0)); });
  /* --- 분자 조립 --- */
  function builder(host) {
    PS.defs();
    const ST = stage(host, [0, 0, 1000, 700]), root = el('g', null, ST.svg);
    el('rect', { x: -200, width: 1400, height: 700, fill: '#fff' }, root);
    shadow(root, 500, 560, 300, 22, .14);
    const lay = el('g', null, root);
    const name = ST.label(500, 80, '', 'big'), form = ST.label(500, 620, '');
    form.e.style.fontSize = 'clamp(26px,4vw,44px)'; form.e.style.fontWeight = '800';
    let parts = [], arrId = 0;
    const put = (p, x, y, s = 1) => p.g.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) scale(${f1(s * 100) / 100})`);
    const mkAtom = (k, x, y) => { const g = el('g', null, lay); el('circle', { r: ATOM[k].r, fill: gradOf(k), stroke: ATOM[k].c[2], 'stroke-width': 1 }, g); const t = el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 26, 'font-weight': 800, fill: ATOM[k].t, style: 'font-family:Pretendard,sans-serif' }, g); t.textContent = k; const p = { k, g, x, y }; put(p, x, y); return p; };
    const cnt = () => { const c = {}; parts.forEach((p) => { c[p.k] = (c[p.k] || 0) + 1; }); return c; };
    const arrange = () => {
      const c = cnt(), m = key(c);
      const from = parts.map((p) => [p.x, p.y]);
      let tg;
      if (m) { const used = {}; tg = parts.map((p) => { const list = MOL[m].a.filter((a) => a[0] === p.k); const i = used[p.k] = (used[p.k] || 0); used[p.k]++; const a = list[i]; return [500 + a[1] * 1.5, 330 + a[2] * 1.5]; }); }
      else tg = parts.map((_, i) => { const n = parts.length, cols = Math.min(n, 5), r = Math.floor(i / 5), cc = i % 5, rn = Math.ceil(n / 5); return [500 + (cc - (Math.min(n - r * 5, 5) - 1) / 2) * 138, 330 + (r - (rn - 1) / 2) * 140]; });
      const sc = m ? 1.5 : 1.08;
      const ps = parts.slice(), id = ++arrId; tween(REDUCE ? 0 : 420, (t) => { if (id !== arrId) return; ps.forEach((p, i) => { p.x = lerp(from[i][0], tg[i][0], t); p.y = lerp(from[i][1], tg[i][1], t); put(p, p.x, p.y, sc); }); });
      name.set(m ? `${MOL[m].n} 분자` : parts.length ? '원자가 아직 결합하지 않았어요' : '원자를 넣어 분자를 만들어요');
      form.set(m ? MOL[m].f : '');
      return m;
    };
    const api = {
      ST,
      add(k) { if (parts.length >= 7) return arrange(); const p = mkAtom(k, 500 + (Math.random() - .5) * 400, -60); parts.push(p); return arrange(); },
      remove(k) { const i = parts.map((p) => p.k).lastIndexOf(k); if (i >= 0) { parts[i].g.remove(); parts.splice(i, 1); } return arrange(); },
      clear() { parts.forEach((p) => p.g.remove()); parts = []; return arrange(); },
      set(m) { api.clear(); MOL[m].a.forEach(([k]) => { const p = mkAtom(k, 500, 300); parts.push(p); }); return arrange(); },
      get cnt() { return cnt(); },
    };
    arrange();
    return api;
  }
  /* --- 이온 만들기 --- */
  const ION = {
    Li: { n: '리튬', z: 3, go: -1, ion: 'Li<sup>+</sup>', nm: '리튬 이온' }, Na: { n: '나트륨', z: 11, go: -1, ion: 'Na<sup>+</sup>', nm: '나트륨 이온' }, Mg: { n: '마그네슘', z: 12, go: -2, ion: 'Mg<sup>2+</sup>', nm: '마그네슘 이온' },
    F: { n: '플루오린', z: 9, go: 1, ion: 'F<sup>−</sup>', nm: '플루오린화 이온' }, Cl: { n: '염소', z: 17, go: 1, ion: 'Cl<sup>−</sup>', nm: '염화 이온' }, O: { n: '산소', z: 8, go: 2, ion: 'O<sup>2−</sup>', nm: '산화 이온' },
  };
  function ionMaker(host) {
    PS.defs();
    const ST = stage(host, [0, 0, 1000, 700]), root = el('g', null, ST.svg);
    el('rect', { x: -200, width: 1400, height: 700, fill: '#fff' }, root);
    const CX = 500, CY = 340, R = 210;
    el('circle', { cx: CX, cy: CY, r: R, fill: 'none', stroke: '#c9d7e2', 'stroke-width': 2, 'stroke-dasharray': '6 8' }, root);
    const nuc = el('circle', { cx: CX, cy: CY, r: 74, fill: grad([[0, '#ff9a8a'], [.6, '#de5a48'], [1, '#a93024']], { r: 1, cx: .38, cy: .32, rr: .8 }), stroke: '#8a2416' }, root);
    const nl = ST.label(CX, CY, '', 'lt'); nl.e.style.fontSize = 'clamp(26px,4vw,40px)'; nl.e.style.fontWeight = '800';
    const elG = el('g', null, root);
    const hd = ST.label(CX, 56, '', 'big'), fm = ST.label(CX, 640, ''); fm.e.style.fontSize = 'clamp(24px,3.6vw,38px)'; fm.e.style.fontWeight = '800';
    let cur = 'Li', e = 3, els = [], spin = 0, outs = [];
    const circleE = (x, y, s = 1) => { const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, elG); el('circle', { r: 18, fill: grad([[0, '#8fc2ef'], [1, '#0e63b3']], { r: 1, cx: .36, cy: .32, rr: .8 }), stroke: '#0b3f73' }, g); const t = el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 22, 'font-weight': 800, fill: '#fff', y: -1 }, g); t.textContent = '−'; return g; };
    const render = () => {
      els.forEach((g) => g.remove()); els = []; for (let i = 0; i < e; i++) els.push(circleE(0, 0));
      const I = ION[cur];
      nl.set('+' + I.z); hd.set(`${I.n} ${e === I.z ? '원자' : e === I.z + I.go ? '이온' : ''}`);
      const d = I.z - e;
      fm.set(d === 0 ? '전기적으로 중성' : (d === -I.go ? `${I.nm} ${I.ion}` : (d > 0 ? `(+)전하 ${d}` : `(−)전하 ${-d}`)));
    };
    loop((dt) => { spin += dt * .35; els.forEach((g, i) => { const a = spin + i / els.length * 6.283; g.setAttribute('transform', `translate(${f1(CX + Math.cos(a) * R)} ${f1(CY + Math.sin(a) * R)})`); }); });
    const api = {
      ST,
      pick(k) { cur = k; e = ION[k].z; render(); },
      lose() { if (e > 0) { e--; render(); } return e; }, gain() { e++; render(); return e; },
      get charge() { return ION[cur].z - e; }, get cur() { return cur; }, ION,
    };
    render();
    return api;
  }
  /* --- 전기력에 의한 이온 이동 --- */
  const DIP = { cu: { n: '황산 구리(Ⅱ) 수용액', col: '#2f8fd6', ion: '구리 이온 Cu²⁺', anion: '황산 이온', pos: 'cu', dir: -1 }, mn: { n: '과망가니즈산 칼륨 수용액', col: '#7b2fa8', ion: '과망가니즈산 이온 MnO₄⁻', anion: '칼륨 이온', dir: 1 } };
  function petri(host) {
    PS.defs();
    const ST = stage(host, [0, 0, 1000, 720]), root = el('g', null, ST.svg);
    PS.bench(root, 620);
    /* 전원 장치 */
    el('rect', { x: 330, y: 22, width: 340, height: 120, rx: 14, fill: grad([[0, '#e9edf1'], [1, '#c9d1d9']]), stroke: '#8fa0ad' }, root);
    el('rect', { x: 356, y: 44, width: 110, height: 44, rx: 4, fill: '#16242e' }, root);
    const scr = ST.label(411, 66, '꺼짐', 'lt'); scr.e.style.fontSize = 'clamp(12px,1.4vw,16px)';
    const lg = el('circle', { cx: 500, cy: 66, r: 10, fill: '#a8b4bf', stroke: '#6d7a85' }, root);
    [[580, '#2b2f35', '(−)'], [640, '#c9483a', '(+)']].forEach(([x, c, t]) => { el('circle', { cx: x, cy: 112, r: 12, fill: c, stroke: '#333' }, root); ST.label(x, 86, t, '').e.style.fontSize = 'clamp(11px,1.3vw,14px)'; });
    /* 전선 */
    /* 흰 종이와 접시 */
    el('rect', { x: 90, y: 250, width: 820, height: 370, rx: 8, fill: '#fbfcfd', stroke: '#cfd9e3' }, root);
    shadow(root, 500, 606, 380, 18, .16);
    el('ellipse', { cx: 500, cy: 430, rx: 370, ry: 164, fill: '#eef5f8', stroke: '#8ba0b2', 'stroke-width': 3 }, root);
    const liq = el('ellipse', { cx: 500, cy: 432, rx: 354, ry: 150, fill: '#dcecf4', opacity: 0, style: 'transition:opacity .6s' }, root);
    /* 금속판 */
    [[150, '(−)극'], [850, '(+)극']].forEach(([x, t]) => { el('rect', { x: x - 14, y: 330, width: 28, height: 200, rx: 3, fill: grad([[0, '#8e9aa5'], [.5, '#d7dee4'], [1, '#79858f']], { x2: 1, y2: 0 }), stroke: '#55616c' }, root); ST.label(x, 560, t, 'bg').e.style.fontSize = 'clamp(12px,1.4vw,15px)'; });
    el('path', { d: 'M580 124C560 240 200 190 150 330', fill: 'none', stroke: '#2b2f35', 'stroke-width': 7, 'stroke-linecap': 'round' }, root);
    el('path', { d: 'M640 124C660 240 800 190 850 330', fill: 'none', stroke: '#c9483a', 'stroke-width': 7, 'stroke-linecap': 'round' }, root);
    /* 한 방울 */
    const blob = el('ellipse', { rx: 0, ry: 0, cx: 500, cy: 432, opacity: .92 }, root);
    const blob2 = el('ellipse', { rx: 0, ry: 0, cx: 500, cy: 432, opacity: .35 }, root);
    /* 돋보기: 입자 */
    const lens = el('g', { opacity: 0 }, root);
    el('rect', { x: 30, y: 640, width: 940, height: 72, rx: 12, fill: '#fff', stroke: '#dbe4ed' }, lens);
    const parts = Array.from({ length: 16 }, (_, i) => el('circle', { r: 9, cy: i < 8 ? 660 : 692 }, lens));
    const laneA = ST.label(36, 660, '', 'ra'), laneB = ST.label(36, 692, '', 'ra m'); [laneA, laneB].forEach((l) => { l.e.style.fontSize = 'clamp(11px,1.2vw,13.5px)'; l.show(false); });
    let k = 'cu', on = false, dropped = false, x = 500, sp = 0, t = 0;
    const update = () => { const D = DIP[k]; blob.setAttribute('fill', D.col); blob2.setAttribute('fill', D.col); };
    update();
    const api = {
      ST,
      kind(v) { k = v; dropped = false; x = 500; sp = 0; blob.setAttribute('rx', 0); blob2.setAttribute('rx', 0); blob.setAttribute('ry', 0); blob2.setAttribute('ry', 0); lens.setAttribute('opacity', 0); laneA.show(false); laneB.show(false); update(); },
      fill() { liq.setAttribute('opacity', .85); },
      power(v) { on = v; scr.set(v ? '켜짐' : '꺼짐'); lg.setAttribute('fill', v ? '#49c47a' : '#a8b4bf'); },
      drop(cb) { dropped = true; tween(REDUCE ? 0 : 900, (u) => { blob.setAttribute('rx', 36 * u); blob.setAttribute('ry', 18 * u); }, cb); },
      get x() { return x; }, get k() { return k; },
      jump() { api.fill(); api.power(true); dropped = true; x = DIP[k].dir < 0 ? 280 : 720; sp = 1; blob.setAttribute('rx', 60); blob.setAttribute('ry', 34); },
    };
    loop((dt) => {
      if (!dropped) return;
      const D = DIP[k];
      if (on && x > 280 && x < 720) { x += D.dir * dt * 36; sp = Math.min(1, sp + dt * .12); } if (on) { lens.setAttribute('opacity', 1); laneA.set(`색이 보이는 ${D.ion}`).show(true); laneB.set(`색이 없는 ${D.anion}, 반대쪽으로`).show(true); }
      const w = lerp(36, 62, sp), h = lerp(18, 36, sp);
      blob.setAttribute('cx', f1(x)); blob.setAttribute('rx', f1(w)); blob.setAttribute('ry', f1(h));
      blob2.setAttribute('cx', f1(lerp(500, x, .6))); blob2.setAttribute('rx', f1(Math.abs(x - 500) * .6 + 26)); blob2.setAttribute('ry', f1(h * .5));
      /* 아래 줄 입자 */
      t += dt; parts.forEach((p, i) => { const pos = i < 8, v = on ? (pos ? D.dir : -D.dir) * t * 46 : 0, xx = 340 + (((i % 8) * 80 + v) % 640 + 640) % 640; p.setAttribute('cx', f1(xx)); p.setAttribute('fill', pos ? D.col : '#d7dee4'); p.setAttribute('stroke', pos ? '#333' : '#8fa0ad'); });
    });
    return api;
  }
  return { ATOM, MOL, ION, DIP, builder, ionMaker, petri };
})();
