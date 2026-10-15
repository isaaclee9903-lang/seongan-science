/* ===== 거울·렌즈 관찰 그림 도구 (SVG 2D) =====
   ML.defs()                         문서 공통 그라디언트 (한 번만)
   ML.toy(부모)                       물체(F 모양 블록, 바닥 가운데가 0,0)
   ML.calc(기구, d)                   관찰자에게 보이는 상의 크기 비율 s (음수면 거꾸로 선 상), 흐림 정도
   ML.inner(부모, 기구, 물체, d, cx, cy, R)  둥근 거울·렌즈 안에 보이는 모습 (작은 그림용)
   ML.view(host, 옵션)                관찰자 눈에 보이는 장면. set(d), dev(기구)
   ML.side(host, 옵션)                옆에서 본 배치 (물체 끌기)
   ML.icon(부모, 기구, x, y, 높이)     교과서식 기구 단면 그림
   기구: 'convex-mirror' 볼록 거울, 'concave-mirror' 오목 거울, 'convex-lens' 볼록 렌즈, 'concave-lens' 오목 렌즈
   상의 크기·방향은 실제 광학 관계로 계산하지만 화면에는 수식을 쓰지 않아요. 개념 이해를 위한 모형이에요. */
window.ML = (() => {
  const { el } = OP;
  const L = 10;                       // 관찰자와 기구 사이 거리 (기구의 '힘'을 1로 둔 단위)
  const NAMES = { 'convex-mirror': '볼록 거울', 'concave-mirror': '오목 거울', 'convex-lens': '볼록 렌즈', 'concave-lens': '오목 렌즈' };
  const PRESET = [0.55, 1.45, 3.4];   // 가까이 · 멀리 · 더 멀리
  const ZONE = ['가까이', '멀리', '더 멀리'];
  const isMirror = (k) => /mirror/.test(k);
  const converge = (k) => k === 'concave-mirror' || k === 'convex-lens';
  const TOYH = { block: 200 };
  const FACE = { block: [-2, -140] };
  let uid = 0;

  function defs() {
    if (document.getElementById('mlDefs')) return;
    const s = document.createElementNS(OP.NS, 'svg');
    s.setAttribute('width', 0); s.setAttribute('height', 0); s.setAttribute('aria-hidden', 'true');
    s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    s.id = 'mlDefs';
    s.innerHTML = `<defs>
      <linearGradient id="mlWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3f5f7"/><stop offset="1" stop-color="#dfe4e9"/></linearGradient>
      <linearGradient id="mlTable" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9cfd6"/><stop offset=".08" stop-color="#eceff2"/><stop offset="1" stop-color="#f7f8fa"/></linearGradient>
      <linearGradient id="mlRim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f6f8"/><stop offset=".35" stop-color="#9aa3ad"/><stop offset=".6" stop-color="#5b636d"/><stop offset="1" stop-color="#c3cad2"/></linearGradient>
      <linearGradient id="mlRod" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5d646d"/><stop offset=".3" stop-color="#e3e7eb"/><stop offset=".55" stop-color="#9aa2ac"/><stop offset="1" stop-color="#4b525b"/></linearGradient>
      <linearGradient id="mlBase" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b4047"/><stop offset="1" stop-color="#121418"/></linearGradient>
      <linearGradient id="mlSheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".28" stop-color="#fff" stop-opacity=".08"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity=".22"/></linearGradient>
      <radialGradient id="mlVigX" cx=".5" cy=".5" r=".5"><stop offset=".6" stop-color="#0a1824" stop-opacity="0"/><stop offset=".92" stop-color="#0a1824" stop-opacity=".22"/><stop offset="1" stop-color="#0a1824" stop-opacity=".45"/></radialGradient>
      <radialGradient id="mlVigC" cx=".5" cy=".5" r=".5"><stop offset=".7" stop-color="#0a1824" stop-opacity="0"/><stop offset="1" stop-color="#0a1824" stop-opacity=".25"/></radialGradient>
      <radialGradient id="mlVigL" cx=".5" cy=".5" r=".5"><stop offset=".75" stop-color="#bfe6f2" stop-opacity="0"/><stop offset=".96" stop-color="#8cc7dc" stop-opacity=".35"/><stop offset="1" stop-color="#5c9fb8" stop-opacity=".6"/></radialGradient>
      <linearGradient id="mlGlassB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e3f3fb"/><stop offset=".35" stop-color="#a9d6ec"/><stop offset=".7" stop-color="#6fb2d6"/><stop offset="1" stop-color="#cbe8f5"/></linearGradient>
      <linearGradient id="mlBack" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4e5660"/><stop offset=".5" stop-color="#a9b1ba"/><stop offset="1" stop-color="#5b636c"/></linearGradient>
      <linearGradient id="mlF" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3f8fd8"/><stop offset=".55" stop-color="#1b6fbf"/><stop offset="1" stop-color="#0e5aa0"/></linearGradient>
      <filter id="mlSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
      <filter id="mlSoft2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
    </defs>`;
    document.body.appendChild(s);
  }

  /* ---------- 물체: F 모양 블록 (위아래·좌우가 모두 구별됨) ---------- */
  const FPATH = 'M-46 0V-200H50V-166H-10V-118H34V-86H-10V0Z';
  function toy(parent) {
    const g = el('g', {}, parent);
    for (let i = 10; i >= 1; i--) el('path', { d: FPATH, transform: `translate(${i} ${-i * 0.8})`, fill: i > 8 ? '#0a2a4a' : '#0b3c6c' }, g);   // 옆면(두께)
    el('path', { d: FPATH, fill: 'url(#mlF)' }, g);
    el('path', { d: 'M-46 -200H50', stroke: '#fff', 'stroke-width': 2, opacity: .45 }, g);
    el('path', { d: 'M-40 -6V-194', stroke: '#fff', 'stroke-width': 3, opacity: .25, 'stroke-linecap': 'round' }, g);
    return g;
  }

  /* ---------- 계산 ---------- */
  function calc(dev, d) {
    const f = converge(dev) ? 1 : -1;
    const den = f * L - d * (L - f);
    let s = Math.abs(den) < 1e-3 ? 1e3 : f * L / den;            // 기구 자리에 있는 물체와 비교한 겉보기 크기
    const raw = s;
    const a = Math.abs(s);
    const blur = a > 1.5 ? Math.min(24, 1.5 * (a - 1.5) + Math.max(0, a - 5) * 2.5) : 0;
    s = Math.sign(s) * Math.min(a, 12);
    const m = f / (f - d);                                       // 물체와 비교한 상의 크기 (부호: 바로/거꾸로)
    return { s, raw, blur, up: m > 0, big: Math.abs(m) > 1, m };
  }
  const label = (dev, d) => { const c = calc(dev, d); return `물체보다 ${c.big ? '큰' : '작은'} 크기의 ${c.up ? '바로' : '거꾸로'} 선 상`; };

  /* ---------- 둥근 기구 안에 보이는 모습 ---------- */
  function inner(parent, dev, kind, d, cx, cy, R, o = {}) {
    defs();
    const id = 'mlc' + (++uid);
    const g = el('g', {}, parent);
    el('clipPath', { id }, g).appendChild(el('circle', { cx, cy, r: R }));
    const cl = el('g', { 'clip-path': `url(#${id})` }, g);
    const fid = 'mlb' + uid;
    const flt = el('filter', { id: fid, filterUnits: 'userSpaceOnUse', x: cx - R - 40, y: cy - R - 40, width: 2 * R + 80, height: 2 * R + 80 }, g);
    const gb = el('feGaussianBlur', { stdDeviation: 0 }, flt);
    const wrap = el('g', {}, cl);
    const tg = el('g', {}, wrap);
    const H = TOYH[kind];
    const hz = -H * 0.34;
    const mir = isMirror(dev);
    el('rect', { x: -6000, y: -6000, width: 12000, height: 6000 + hz, fill: mir ? '#e3e8ee' : '#eef1f4' }, tg);
    el('rect', { x: -6000, y: hz - 1, width: 12000, height: 5, fill: '#c3cad2' }, tg);
    el('rect', { x: -6000, y: hz + 4, width: 12000, height: 6000, fill: mir ? '#f1f3f5' : '#f6f7f9' }, tg);
    el('ellipse', { cx: 0, cy: 2, rx: 70, ry: 10, fill: 'rgba(30,40,55,.22)', filter: 'url(#mlSoft2)' }, tg);
    toy(tg, kind);
    // 유리 질감
    el('circle', { cx, cy, r: R, fill: mir ? (dev === 'convex-mirror' ? 'url(#mlVigX)' : 'url(#mlVigC)') : 'url(#mlVigL)' }, cl);
    if (mir) el('circle', { cx, cy, r: R, fill: '#7d93a8', opacity: .07 }, cl);
    else el('circle', { cx, cy, r: R, fill: '#9fd3e6', opacity: .1 }, cl);
    el('path', { d: `M${cx - R * .78} ${cy - R * .25}A${R * .82} ${R * .82} 0 0 1 ${cx + R * .2} ${cy - R * .8}`, stroke: '#fff', 'stroke-width': R * .07, fill: 'none', 'stroke-linecap': 'round', opacity: .5 }, cl);
    el('circle', { cx, cy, r: R, fill: 'url(#mlSheen)', opacity: .7 }, cl);
    if (o.rim !== false) {
      el('circle', { cx, cy, r: R + R * .045, fill: 'none', stroke: 'url(#mlRim)', 'stroke-width': R * .09 }, g);
      el('circle', { cx, cy, r: R, fill: 'none', stroke: 'rgba(20,30,40,.45)', 'stroke-width': 1.2 }, g);
    }
    function set(dd, dv) {
      if (dv) dev = dv;
      const c = calc(dev, dd), a0 = Math.abs(c.s), a = a0 <= 1 ? a0 : 1 + (a0 - 1) * 0.3;   // 아주 큰 상은 화면에 다 담기게 조금 줄여 그림
      const t = Math.max(0, Math.min(1, (a - 0.9) / 1.4));
      const ax = FACE[kind][0] * t, ay = -H / 2 + (FACE[kind][1] + H / 2) * t;
      const k = (o.H0 || R * 1.3) / H;
      tg.setAttribute('transform', `translate(${cx} ${cy}) scale(${(Math.sign(c.s) * a * k).toFixed(4)}) translate(${-ax} ${-ay})`);
      gb.setAttribute('stdDeviation', (c.blur * (R / 176)).toFixed(2));
      wrap.setAttribute('filter', c.blur > 0.3 ? `url(#${fid})` : '');
      return c;
    }
    set(d);
    return { g, set };
  }

  /* ---------- 받침대에 끼운 둥근 기구 ---------- */
  function stand(g, cx, cy, R, baseY) {
    el('ellipse', { cx: cx + 18, cy: baseY + 10, rx: 150, ry: 20, fill: 'rgba(20,30,40,.18)', filter: 'url(#mlSoft)' }, g);
    el('path', { d: `M${cx - 120} ${baseY - 6}Q${cx - 124} ${baseY + 18} ${cx - 100} ${baseY + 20}L${cx + 100} ${baseY + 20}Q${cx + 124} ${baseY + 18} ${cx + 120} ${baseY - 6}Z`, fill: '#0c0e11' }, g);
    el('ellipse', { cx, cy: baseY - 6, rx: 120, ry: 20, fill: 'url(#mlBase)' }, g);
    el('ellipse', { cx: cx - 20, cy: baseY - 12, rx: 70, ry: 8, fill: '#fff', opacity: .1 }, g);
    el('rect', { x: cx - 8, y: cy + R + 6, width: 16, height: baseY - cy - R - 8, fill: 'url(#mlRod)' }, g);
    el('rect', { x: cx - 16, y: baseY - 34, width: 32, height: 18, rx: 4, fill: 'url(#mlRod)' }, g);
    el('rect', { x: cx - 13, y: cy + R + 2, width: 26, height: 22, rx: 4, fill: 'url(#mlRod)' }, g);
    // 오른쪽 나사
    el('rect', { x: cx + R + 6, y: cy - 9, width: 22, height: 18, rx: 3, fill: 'url(#mlRod)' }, g);
    el('rect', { x: cx + R + 26, y: cy - 13, width: 10, height: 26, rx: 3, fill: '#2b3036' }, g);
  }

  /* ---------- 관찰자 눈에 보이는 장면 ---------- */
  function view(host, o) {
    defs();
    const W = 1000, H = 640, Y0 = 60, sv0 = el('svg', { viewBox: `0 0 ${W} ${H - Y0}`, role: 'img', 'aria-label': o.aria || '관찰자 자리에서 본 둥근 거울(렌즈)과 F 모양 물체' }, host);
    const sv = el('g', { transform: `translate(0 ${-Y0})` }, sv0);   // 위쪽 빈 벽은 잘라 냄
    let dev = o.dev;
    const kind = o.toy, TH = TOYH[kind];
    const lens = !isMirror(dev);
    const C = lens ? [560, 356] : [560, 276], R = lens ? 150 : 172, baseY = lens ? 604 : 600, HZ = lens ? 300 : 360;
    el('rect', { width: W, height: HZ, fill: 'url(#mlWall)' }, sv);
    el('rect', { y: HZ, width: W, height: H - HZ, fill: 'url(#mlTable)' }, sv);
    el('rect', { y: HZ - 30, width: W, height: 60, fill: '#fff', opacity: .25, filter: 'url(#mlSoft)' }, sv);
    const back = el('g', {}, sv), standG = el('g', {}, sv), mid = el('g', {}, sv), front = el('g', {}, sv);
    stand(standG, C[0], C[1], R, baseY);
    const H0 = lens ? R * 2.6 : R * 1.3;
    const insideL = inner(mid, dev, kind, 1, C[0], C[1], R, { H0 });
    // 실제 물체
    const real = el('g', {}, lens ? back : front), sh = el('ellipse', { rx: 80, ry: 12, fill: 'rgba(20,30,40,.25)', filter: 'url(#mlSoft2)' }, real), rt = el('g', {}, real);
    toy(rt, kind);
    const ov0 = OP.overlay(host, W, H - Y0), ov = { put: (id, x, y, h, c) => ov0.put(id, x, y - Y0, h, c), hide: ov0.hide, hideAll: ov0.hideAll };
    let cur = 1;
    function set(d) {
      cur = d;
      const c = insideL.set(d, dev);
      let k, x, y;
      if (lens) { k = H0 / TH * L / (L + d); y = HZ + (baseY - 34 - HZ) * L / (L + d * 1.6); x = C[0] - 30; }
      else { k = H0 / TH * L / (L - d); y = baseY + 14 + d * 6; x = C[0] - 330 - d * 14; }
      rt.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(4)})`);
      sh.setAttribute('cx', x + 6); sh.setAttribute('cy', y + 2); sh.setAttribute('rx', 72 * k); sh.setAttribute('ry', 11 * k);
      if (o.labels !== false) {
        ov.put('real', lens ? x - 150 : x, lens ? y - TH * k * 0.55 : y - TH * k - 22, lens ? '렌즈 뒤의 물체' : '거울 앞의 물체', 'ink' + (lens ? ' la' : ''));
        ov.put('dev', C[0] + R + 30, C[1] - R - 6, NAMES[dev], 'inkk ra');
      }
      return c;
    }
    set(1);
    return { sv: sv0, set, ov, get d() { return cur; }, dev(v) { dev = v; set(cur); }, C, R };
  }

  /* ---------- 교과서식 기구 단면 그림 (x, y: 가운데, h: 높이) ---------- */
  function icon(parent, dev, x, y, h, o = {}) {
    defs();
    const g = el('g', { transform: `translate(${x} ${y}) scale(${h / 200})` }, parent);
    const face = o.face || 1;                       // 거울 면이 오른쪽(1) 또는 왼쪽(-1)을 봄
    if (dev === 'plane-mirror' || isMirror(dev)) {
      const k = dev === 'plane-mirror' ? 0 : dev === 'concave-mirror' ? 1 : -1;
      const b = -26 * k;                             // 거울 면 가운데가 들어간(오목) / 나온(볼록) 정도
      const sx = face;
      const fr = `M${-6 * sx} -100Q${(-6 + b) * sx} 0 ${-6 * sx} 100`;
      el('path', { d: `M${-14 * sx} -100L${-6 * sx} -100Q${(-6 + b) * sx} 0 ${-6 * sx} 100L${-14 * sx} 100Q${(-14 + b) * sx} 0 ${-14 * sx} -100Z`, fill: 'url(#mlBack)' }, g);
      el('path', { d: `${fr}L${(10 - (k ? 0 : 0)) * sx} 100Q${(10 + b) * sx} 0 ${10 * sx} -100Z`, fill: 'url(#mlGlassB)', stroke: '#5c9fb8', 'stroke-width': 1.2 }, g);
      el('path', { d: `M${-22 * sx} -104H${-6 * sx}V-96H${-22 * sx}ZM${-22 * sx} 104H${-6 * sx}V96H${-22 * sx}Z`, fill: '#3f464e' }, g);
      el('path', { d: `M${-22 * sx} -104L${-22 * sx} 104`, stroke: '#3f464e', 'stroke-width': 6 }, g);
    } else {
      const cv = dev === 'convex-lens';
      const d = cv ? 'M0 -100C30 -100 40 -40 40 0C40 40 30 100 0 100C-30 100 -40 40 -40 0C-40 -40 -30 -100 0 -100Z'
        : 'M-30 -100L30 -100C16 -50 14 -20 14 0C14 20 16 50 30 100L-30 100C-16 50 -14 20 -14 0C-14 -20 -16 -50 -30 -100Z';
      el('path', { d, fill: 'url(#mlGlassB)', stroke: '#4f93ad', 'stroke-width': 1.6 }, g);
      el('path', { d: cv ? 'M-12 -80C-24 -50 -26 -10 -22 20' : 'M-20 -86C-8 -50 -6 -20 -8 10', stroke: '#fff', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round', opacity: .6 }, g);
    }
    return g;
  }

  /* ---------- 옆에서 본 배치 ---------- */
  function side(host, o) {
    defs();
    const W = 1000, H = 210, Y0 = 34, sv = el('svg', { viewBox: `0 ${Y0} ${W} ${H - Y0}`, role: 'img', 'aria-label': '옆에서 본 배치. 기구, 물체, 관찰자의 눈이 한 줄로 놓여 있다.' }, host);
    let dev = o.dev;
    const lens = !isMirror(dev), TY = 150;
    el('rect', { width: W, height: H, fill: '#f6f8fa' }, sv);
    el('rect', { y: TY, width: W, height: H - TY, fill: '#e3e8ed' }, sv);
    el('rect', { y: TY, width: W, height: 4, fill: '#c7cfd7' }, sv);
    const DX = lens ? 650 : 120, EYE = lens ? 945 : 945, DIR = lens ? -1 : 1, K = lens ? 160 : 210;
    const xOf = (d) => DX + DIR * d * K, dOf = (x) => (x - DX) * DIR / K;
    // 눈금
    const tk = el('g', {}, sv);
    const ov0 = OP.overlay(host, W, H - Y0), ov = { put: (id, x, y, h, c) => ov0.put(id, x, y - Y0, h, c) };
    PRESET.forEach((d, i) => { const x = xOf(d); el('line', { x1: x, x2: x, y1: TY + 6, y2: TY + 20, stroke: '#8fa1b3', 'stroke-width': 2 }, tk); ov.put('z' + i, x, TY + 38, ZONE[i], 'inks'); });
    // 일직선 (관찰자와 기구를 잇는 선)
    el('line', { x1: Math.min(DX, xOf(3.7)), x2: EYE - 30, y1: 96, y2: 96, stroke: '#9fb3c6', 'stroke-width': 1.5, 'stroke-dasharray': '5 6' }, sv);
    // 기구 단면
    const ig = el('g', {}, sv);
    const drawDev = () => { ig.innerHTML = ''; icon(ig, dev, DX, 96, 92, { face: 1 }); el('rect', { x: DX - 4, y: 142, width: 8, height: 10, fill: '#5d646d' }, ig); el('rect', { x: DX - 26, y: 146, width: 52, height: 6, rx: 3, fill: '#2b3036' }, ig); };
    drawDev();
    OP.eye(sv, EYE, 96, 54, { lx: -8 });
    ov.put('eye', EYE, 136, '관찰자', 'inks');
    const tg = el('g', { style: 'cursor:grab' }, sv);
    el('rect', { x: -60, y: -120, width: 120, height: 130, fill: 'transparent' }, tg);
    el('ellipse', { cx: 0, cy: 2, rx: 30, ry: 5, fill: 'rgba(20,30,40,.2)' }, tg);
    const tt = el('g', { transform: `scale(${100 / TOYH[o.toy]})` }, tg); toy(tt, o.toy);
    let d = 1;
    function set(v) { d = Math.max(0.3, Math.min(3.6, v)); tg.setAttribute('transform', `translate(${xOf(d).toFixed(1)} ${TY + 1})`); return d; }
    let drag = false;
    tg.addEventListener('pointerdown', (e) => { drag = true; sv.setPointerCapture(e.pointerId); e.preventDefault(); });
    sv.addEventListener('pointermove', (e) => { if (!drag) return; const [x] = OP.toSvg(sv, e); o.onDrag && o.onDrag(Math.max(0.3, Math.min(3.6, dOf(x)))); });
    const up = () => { if (drag) { drag = false; o.onEnd && o.onEnd(); } };
    sv.addEventListener('pointerup', up); sv.addEventListener('pointercancel', up);
    set(1);
    return { sv, set, dev(v) { dev = v; drawDev(); } };
  }

  return { defs, toy, calc, label, inner, view, side, icon, NAMES, PRESET, ZONE, isMirror, converge, TOYH };
})();
