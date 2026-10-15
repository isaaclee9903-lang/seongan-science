/* ===== 빛 그림 도구 (SVG 2D) =====
   OP.el(태그, 속성, 부모)            SVG 요소 만들기
   OP.defs(svg)                       공통 그라디언트·번짐 필터
   OP.overlay(host, W, H)             그림 위 HTML 이름표 (.ol). put(id, x, y, 글, 종류) / hide(id)
   OP.toSvg(svg, 이벤트)              누른 곳 → 그림 좌표
   OP.beam(부모, 옵션)                레이저 광선(번짐 + 밝은 심 + 흐르는 점선). set(점 목록) / show(켜기, 자라기)
   OP.photons(층)                     빛 알갱이 흐름. add(점 목록, {rate, speed, r, color}) → 길 / clear()
   OP.protractor(부모, C, R, 'half'|'full')  각도기
   OP.laser(부모) / OP.place(g, x, y, 각도)  슬릿 레이저 기구
   OP.eye(부모, x, y, 너비)           눈 그림
   크기·빠르기는 개념 이해를 위한 모형이에요. 굴절 정도는 실제 물과 비슷하게 그리지만 계산식은 화면에 쓰지 않아요. */
window.OP = (() => {
  const NS = 'http://www.w3.org/2000/svg', D = Math.PI / 180;
  const el = (tag, at = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (parent) parent.appendChild(e); return e; };
  const RED = '#ff3b2f';

  function defs(svg) {
    const d = el('defs', {}, svg);
    d.innerHTML = `
      <filter id="opGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="opGlow2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>
      <filter id="opDot" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="opShadow" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="7"/><feOffset dy="6"/><feComponentTransfer><feFuncA type="linear" slope=".45"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="opNoise" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .07 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
      <linearGradient id="opBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a5260"/><stop offset=".18" stop-color="#2a3039"/><stop offset=".7" stop-color="#15191f"/><stop offset="1" stop-color="#0b0d11"/></linearGradient>
      <linearGradient id="opMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9edf2"/><stop offset=".45" stop-color="#9aa3ae"/><stop offset=".55" stop-color="#7d8692"/><stop offset="1" stop-color="#c9d0d8"/></linearGradient>
      <linearGradient id="opPlastic" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dfeaf6" stop-opacity=".16"/><stop offset=".5" stop-color="#dfeaf6" stop-opacity=".07"/><stop offset="1" stop-color="#dfeaf6" stop-opacity=".13"/></linearGradient>
      <radialGradient id="opIris" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1b1410"/><stop offset=".38" stop-color="#1b1410"/><stop offset=".42" stop-color="#6b4a2c"/><stop offset=".8" stop-color="#3f2a18"/><stop offset="1" stop-color="#22160c"/></radialGradient>
      <radialGradient id="opSclera" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#ffffff"/><stop offset=".75" stop-color="#eef0f2"/><stop offset="1" stop-color="#c9ced6"/></radialGradient>`;
    return d;
  }

  function overlay(host, W, H) {
    const box = document.createElement('div'); box.className = 'olay'; host.appendChild(box);
    const map = {};
    return {
      put(id, x, y, html, cls = '') {
        let e = map[id]; if (!e) { e = document.createElement('span'); box.appendChild(e); map[id] = e; }
        e.className = 'ol ' + cls; if (e._h !== html) { e.innerHTML = html; e._h = html; }
        e.style.left = (x / W * 100).toFixed(2) + '%'; e.style.top = (y / H * 100).toFixed(2) + '%'; e.hidden = false; return e;
      },
      hide(id) { if (map[id]) map[id].hidden = true; },
      hideAll() { Object.values(map).forEach((e) => (e.hidden = true)); },
      box,
    };
  }

  function toSvg(svg, ev) {
    const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
    const q = p.matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y];
  }

  const dstr = (pts) => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');

  function beam(parent, o = {}) {
    const g = el('g', { 'pointer-events': 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, parent);
    const col = o.color || RED;
    const halo = el('path', { stroke: col, 'stroke-width': o.halo || 22, 'stroke-opacity': 0.16, filter: 'url(#opGlow)' }, g);
    const mid = el('path', { stroke: col, 'stroke-width': o.mid || 7, 'stroke-opacity': 0.55, filter: 'url(#opGlow2)' }, g);
    const core = el('path', { stroke: o.core || '#ffd9d2', 'stroke-width': o.w || 2.4 }, g);
    const dash = el('path', { stroke: '#fff', 'stroke-width': 2.6, 'stroke-opacity': 0.75, 'stroke-dasharray': '3 34', class: 'flowdash' }, g);
    const parts = [halo, mid, core, dash];
    let on = false;
    return {
      g,
      set(pts) { const d = dstr(pts); parts.forEach((p) => p.setAttribute('d', d)); },
      setSegments(list) { const d = list.map(dstr).join(' '); parts.forEach((p) => p.setAttribute('d', d)); },
      show(v, grow) {
        on = v; g.style.display = v ? '' : 'none';
        if (v && grow && !(window.FLOW && FLOW.REDUCE)) {
          [halo, mid, core].forEach((p) => {
            const L = p.getTotalLength(); p.style.transition = 'none'; p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
            p.getBoundingClientRect(); p.style.transition = 'stroke-dashoffset .55s cubic-bezier(.3,.7,.3,1)'; p.style.strokeDashoffset = 0;
            setTimeout(() => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; p.style.transition = ''; }, 600);
          });
          dash.style.opacity = 0; setTimeout(() => (dash.style.opacity = ''), 560);
        }
      },
      get on() { return on; },
      style(o2) { if (o2.halo) halo.setAttribute('stroke-width', o2.halo); if (o2.haloOp != null) halo.setAttribute('stroke-opacity', o2.haloOp); if (o2.midOp != null) mid.setAttribute('stroke-opacity', o2.midOp); },
    };
  }

  function photons(layer) {
    const routes = [], dots = [], pool = [];
    const visible = () => { const r = layer.ownerSVGElement.getBoundingClientRect(); return r.bottom > 0 && r.top < (innerHeight || 800); };
    function prep(r) { r.seg = []; r.total = 0; for (let i = 1; i < r.pts.length; i++) { const a = r.pts[i - 1], b = r.pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); r.seg.push(L); r.total += L; } }
    function pos(r, d) { for (let i = 0; i < r.seg.length; i++) { if (d <= r.seg[i] || i === r.seg.length - 1) { const a = r.pts[i], b = r.pts[i + 1], t = r.seg[i] ? Math.min(1, d / r.seg[i]) : 0; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; } d -= r.seg[i]; } return r.pts[0]; }
    function add(pts, o = {}) {
      const r = { pts, rate: o.rate == null ? 2 : o.rate, speed: o.speed || 240, color: o.color || '#ffe6a0', size: o.r || 4.2, acc: o.phase == null ? Math.random() : o.phase, fade: o.fade || 26, dead: false, end: o.end };
      prep(r); routes.push(r); return r;
    }
    function spawn(r, d0) { const c = pool.pop() || el('circle', {}, layer); c.setAttribute('r', r.size); c.setAttribute('fill', r.color); c.style.display = ''; dots.push({ c, r, d: d0 || 0 }); }
    FLOW.onFrame((dt) => {
      if (!visible()) return;
      routes.forEach((r) => { if (r.rate <= 0) return; r.acc += dt * r.rate; while (r.acc >= 1) { r.acc -= 1; spawn(r); } });
      for (let i = dots.length - 1; i >= 0; i--) {
        const p = dots[i]; p.d += dt * p.r.speed;
        if (p.r.dead || p.d >= p.r.total) { if (!p.r.dead && p.r.end) p.r.end(); p.c.style.display = 'none'; pool.push(p.c); dots.splice(i, 1); continue; }
        const [x, y] = pos(p.r, p.d); p.c.setAttribute('cx', x.toFixed(1)); p.c.setAttribute('cy', y.toFixed(1));
        p.c.setAttribute('opacity', Math.max(0, Math.min(1, p.d / p.r.fade, (p.r.total - p.d) / p.r.fade)).toFixed(2));
      }
    });
    return {
      add,
      fill(r) { for (let d = 0; d < r.total; d += r.speed / Math.max(0.5, r.rate)) spawn(r, d); },
      remove(r) { r.dead = true; const i = routes.indexOf(r); if (i >= 0) routes.splice(i, 1); },
      clear() { routes.forEach((r) => (r.dead = true)); routes.length = 0; },
      routes,
    };
  }

  function protractor(parent, C, R, mode) {
    const g = el('g', { 'pointer-events': 'none' }, parent);
    const [cx, cy] = C, full = mode === 'full';
    const dir = (a) => (full ? [Math.sin(a * D), -Math.cos(a * D)] : [Math.sin(a * D), Math.cos(a * D)]);
    // 판
    if (full) el('circle', { cx, cy, r: R, fill: 'url(#opPlastic)', stroke: 'rgba(225,236,248,.55)', 'stroke-width': 1.6 }, g);
    else el('path', { d: `M${cx - R} ${cy} A${R} ${R} 0 0 0 ${cx + R} ${cy} Z`, fill: 'url(#opPlastic)', stroke: 'rgba(225,236,248,.55)', 'stroke-width': 1.6 }, g);
    const ri = R * 0.24;
    if (full) el('circle', { cx, cy, r: ri, fill: 'none', stroke: 'rgba(225,236,248,.35)', 'stroke-width': 1.2 }, g);
    else el('path', { d: `M${cx - ri} ${cy} A${ri} ${ri} 0 0 0 ${cx + ri} ${cy}`, fill: 'none', stroke: 'rgba(225,236,248,.35)', 'stroke-width': 1.2 }, g);
    const lines = [], ticks = [];
    const a0 = full ? 0 : -90, a1 = full ? 359 : 90;
    for (let a = a0; a <= a1; a++) {
      const [sx, sy] = dir(a), big = a % 10 === 0, mid = a % 5 === 0;
      const L = big ? 20 : mid ? 13 : 7;
      ticks.push(`M${(cx + sx * R).toFixed(1)} ${(cy + sy * R).toFixed(1)}L${(cx + sx * (R - L)).toFixed(1)} ${(cy + sy * (R - L)).toFixed(1)}`);
      if (big) lines.push(`M${(cx + sx * ri).toFixed(1)} ${(cy + sy * ri).toFixed(1)}L${(cx + sx * (R - 46)).toFixed(1)} ${(cy + sy * (R - 46)).toFixed(1)}`);
    }
    el('path', { d: lines.join(''), stroke: 'rgba(225,236,248,.16)', 'stroke-width': 1 }, g);
    el('path', { d: ticks.join(''), stroke: 'rgba(225,236,248,.62)', 'stroke-width': 1.1 }, g);
    const tg = el('g', { fill: 'rgba(232,240,250,.78)', 'font-size': Math.max(12, R * 0.045), 'font-weight': 700, 'font-family': 'Pretendard,sans-serif', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, g);
    for (let a = a0; a <= a1; a += 10) {
      const v = full ? (a <= 90 ? a : a <= 180 ? 180 - a : a <= 270 ? a - 180 : 360 - a) : Math.abs(a);
      const [sx, sy] = dir(a), rr = R - 33;
      const t = el('text', { x: (cx + sx * rr).toFixed(1), y: (cy + sy * rr).toFixed(1), transform: `rotate(${full ? a : -a} ${(cx + sx * rr).toFixed(1)} ${(cy + sy * rr).toFixed(1)})` }, tg);
      t.textContent = v;
    }
    el('circle', { cx, cy, r: 3.2, fill: 'rgba(240,246,252,.9)' }, g);
    return g;
  }

  function laser(parent) {
    const g = el('g', { 'pointer-events': 'none', filter: 'url(#opShadow)' }, parent);
    el('rect', { x: -112, y: -21, width: 98, height: 42, rx: 8, fill: 'url(#opBody)', stroke: '#05070a', 'stroke-width': 1 }, g);
    el('rect', { x: -108, y: -18, width: 90, height: 6, rx: 3, fill: 'rgba(255,255,255,.12)' }, g);
    el('rect', { x: -90, y: -6, width: 40, height: 12, rx: 3, fill: '#0d1015', stroke: 'rgba(255,255,255,.08)' }, g);
    el('circle', { cx: -34, cy: 0, r: 6, fill: '#20252d', stroke: 'rgba(255,255,255,.18)' }, g);
    el('rect', { x: -16, y: -15, width: 16, height: 30, rx: 3, fill: 'url(#opMetal)', stroke: '#6b737e', 'stroke-width': .8 }, g);
    const slit = el('rect', { x: -1.6, y: -10, width: 3.2, height: 20, rx: 1.4, fill: '#3a1210' }, g);
    const led = el('circle', { cx: -34, cy: 0, r: 2.6, fill: '#3a1210' }, g);
    return { g, power(v) { slit.setAttribute('fill', v ? '#ff6a5a' : '#3a1210'); led.setAttribute('fill', v ? '#ff3b2f' : '#3a1210'); } };
  }
  const place = (g, x, y, deg) => g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(2)})`);

  function eye(parent, x, y, w, o = {}) {
    const g = el('g', { transform: `translate(${x} ${y}) scale(${w / 100})`, 'pointer-events': 'none' }, parent);
    if (o.shade !== false) el('ellipse', { cx: 0, cy: 3, rx: 58, ry: 34, fill: 'rgba(0,0,0,.18)', filter: 'url(#opGlow2)' }, g);
    el('path', { d: 'M-50 0C-30-30 30-30 50 0C30 30-30 30-50 0Z', fill: 'url(#opSclera)', stroke: '#3b2f2a', 'stroke-width': 3.2, 'stroke-linejoin': 'round' }, g);
    const clip = 'eyc' + Math.random().toString(36).slice(2, 7);
    el('clipPath', { id: clip }, g).innerHTML = '<path d="M-50 0C-30-30 30-30 50 0C30 30-30 30-50 0Z"/>';
    const ir = el('g', { 'clip-path': `url(#${clip})` }, g);
    el('circle', { cx: o.lx || 0, cy: o.ly || 0, r: 19, fill: 'url(#opIris)' }, ir);
    el('circle', { cx: (o.lx || 0) - 6, cy: (o.ly || 0) - 7, r: 5, fill: '#fff', opacity: .9 }, ir);
    el('path', { d: 'M-50 0C-30-30 30-30 50 0', fill: 'none', stroke: '#2a201c', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    return g;
  }

  const arc = (cx, cy, r, a0, a1) => { const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1); const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0, sw = a1 > a0 ? 1 : 0; return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 ${large} ${sw} ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
  const refr = (deg) => Math.asin(Math.sin(deg * D) / 1.33) / D; // 공기 → 물 (그림용)

  return { el, D, NS, RED, defs, overlay, toSvg, beam, photons, protractor, laser, place, eye, arc, refr, dstr };
})();
