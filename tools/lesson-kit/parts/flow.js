/* ===== 2D 도식 도구 (SVG) =====
   FLOW.dots(path, 옵션): SVG 길(path)을 따라 알갱이(전기·물·열)가 흐르게 해요.
     옵션 n(개수), r(크기), color, speed(초당 길 몇 바퀴), layer(알갱이를 넣을 g, 생략하면 길의 부모), glow(빛 번짐)
     반환값.set({ rate: 0~1(보이는 양과 빠르기), color }) 로 바꿔요.
   FLOW.onFrame(fn): 화면에 보일 때만 매 프레임 fn(dt, t)를 불러요(탭 껍데기에서 숨은 탭이면 쉬어요).
   FLOW.num(el, 값, 자릿수): 숫자를 부드럽게 바꿔 보여 줘요.
   크기·개수·빠르기는 개념 이해를 위한 모형이에요. */
const FLOW = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const fns = [];
  function visibleNow() {
    if (document.hidden) return false;
    try { const f = window.frameElement; if (f && f.hasAttribute('data-page') && !f.classList.contains('on')) return false; } catch (e) {}
    return true;
  }
  let last = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    if (!visibleNow()) return;
    for (const f of fns) { try { f(dt, now / 1000); } catch (e) { console.error(e); } }
  }
  requestAnimationFrame(tick);
  const onFrame = (f) => fns.push(f);
  function onScreen(el) { const r = el.getBoundingClientRect(); return r.bottom > -40 && r.top < (window.innerHeight || 800) + 40; }

  function dots(path, o = {}) {
    const n = o.n || 14, layer = o.layer || path.parentNode, L = path.getTotalLength();
    const svg = path.ownerSVGElement;
    const g = document.createElementNS(NS, 'g'); g.setAttribute('pointer-events', 'none'); layer.appendChild(g);
    const cs = [];
    for (let k = 0; k < n; k++) {
      const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', o.r || 4);
      if (o.glow) c.setAttribute('filter', o.glow);
      g.appendChild(c); cs.push(c);
    }
    let rate = o.rate === undefined ? 1 : o.rate, color = o.color || '#2f6fd6', off = Math.random(), speed = o.speed || 0.12;
    const paint = () => cs.forEach((c) => c.setAttribute('fill', color)); paint();
    function place() {
      const show = Math.round(n * Math.min(1, rate));
      cs.forEach((c, k) => {
        if (k >= show) { c.setAttribute('opacity', '0'); return; }
        const s = ((off + k / n) % 1), p = path.getPointAtLength(s * L);
        c.setAttribute('cx', p.x.toFixed(1)); c.setAttribute('cy', p.y.toFixed(1));
        c.setAttribute('opacity', String(Math.min(1, s * 8, (1 - s) * 8)));
      });
    }
    onFrame((dt) => { if (REDUCE || !onScreen(svg)) return; off = (off + dt * speed * (0.25 + 0.75 * Math.min(1, rate))) % 1; place(); });
    place();
    return { set(v) { if (v.rate !== undefined) rate = v.rate; if (v.color) { color = v.color; paint(); } if (v.speed) speed = v.speed; place(); }, g };
  }

  const shown = new WeakMap();
  function num(el, v, digits = 0) {
    const from = shown.has(el) ? shown.get(el) : 0; shown.set(el, v);
    const fmt = (x) => x.toLocaleString('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    if (REDUCE) { el.textContent = fmt(v); return; }
    let t = 0; const step = (dt) => { t = Math.min(1, t + dt / 0.5); el.textContent = fmt(from + (v - from) * (1 - Math.pow(1 - t, 3))); return t < 1; };
    const f = (dt) => { if (!step(dt)) { const i = fns.indexOf(f); if (i >= 0) fns.splice(i, 1); } };
    fns.push(f);
  }
  return { dots, onFrame, num, REDUCE, NS };
})();
