/* ===== 혼합물 분리 설계실 도구 (계산 + 캔버스 2D) =====
   MX.mk(o) / MX.ops / MX.comps / MX.dryRun   그릇 속 물질 계산(용해도로 녹는 양 판단)과 분리 방법 7가지
   MX.lab(host)    실험대: 가운데 그릇 + 오른쪽 기구(물 붓기, 거름 장치, 분별 깔때기, 뜬 것 건지기, 얼음물, 핫플레이트)
   MX.thumb(cv, c) 선반 칸에 그릇 작게 그리기
   그림 원칙: 흰 바탕, 라스 파랑 한 색조 + 무채색(물질의 실제 색은 옅게), 매트한 질감, 얇은 선. 그림 속 글씨는 HTML 이름표.
   녹는 빠르기, 끓는 빠르기, 식는 빠르기, 거르는 빠르기, 구슬 수, 결정 알갱이 수는 보기 좋게 정한 모형. */
window.MX = (() => {
  const TAU = Math.PI * 2;
  const BLUE = '#0e63b3';
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const eIn = (k) => k * k;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const mixC = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const shade = (c, f) => c.map((v) => Math.round(clamp(v * f, 0, 255)));
  const WATER = [196, 223, 244], OIL = [238, 211, 134], CUSO = [80, 160, 220], ICE = [236, 245, 252];

  /* =================================================================
     1. 물질과 계산
     ================================================================= */
  const NAME = { water: '물', oil: '콩기름', salt: '소금', boric: '붕산', cuso4: '황산 구리(Ⅱ)', pet: '플라스틱 구슬', iron: '쇠구슬', wood: '나무 구슬' };
  const SOLS = ['salt', 'boric', 'cuso4'], BEADS = ['pet', 'iron', 'wood'];
  // 용해도(g/물 100 g, 0~80 ℃, 10 ℃ 간격). 염화 나트륨은 그림 Ⅰ-6, 붕산·황산 구리(Ⅱ)는 그림 Ⅰ-12(용해도 차 분리 수업과 같은 곡선)
  const TAB = {
    salt: [35.7, 35.8, 35.9, 36.1, 36.4, 36.7, 37.1, 37.5, 38.0],
    boric: [2.7, 3.7, 5.0, 6.6, 8.7, 11.5, 14.8, 18.9, 23.6],
    cuso4: [14, 16.8, 20, 24, 29, 34, 40, 47.9, 55],
  };
  function solu(k, T) {
    const y = TAB[k], n = y.length - 1; T = clamp(T, 0, 80);
    const i = Math.min(n - 1, Math.floor(T / 10)), u = (T - i * 10) / 10;
    const d = (j) => (y[j + 1] - y[j]) / 10;
    const m = (j) => (j === 0 ? d(0) : j === n ? d(n - 1) : (d(j - 1) + d(j)) / 2);
    const h00 = 2 * u * u * u - 3 * u * u + 1, h10 = u * u * u - 2 * u * u + u, h01 = -2 * u * u * u + 3 * u * u, h11 = u * u * u - u * u;
    return h00 * y[i] + h10 * 10 * m(i) + h01 * y[i + 1] + h11 * 10 * m(i + 1);
  }
  let uid = 0;
  function mk(o = {}) {
    return { id: ++uid, w: o.w || 0, T: o.T == null ? 20 : o.T, oil: o.oil || 0, amt: Object.assign({ salt: 0, boric: 0, cuso4: 0 }, o.amt), beads: Object.assign({ pet: 0, iron: 0, wood: 0 }, o.beads), vessel: o.vessel || 'beaker' };
  }
  const clone = (c, o = {}) => Object.assign({}, c, { id: ++uid, amt: Object.assign({}, c.amt), beads: Object.assign({}, c.beads) }, o);
  const dis = (c, k) => (c.w > 0.01 ? Math.min(c.amt[k], solu(k, c.T) * c.w / 100) : 0);
  const sol = (c, k) => Math.max(0, c.amt[k] - dis(c, k));
  function comps(c) {
    const a = [];
    if (c.w > 0.01) a.push('water');
    if (c.oil > 0.01) a.push('oil');
    SOLS.forEach((k) => c.amt[k] > 0.05 && a.push(k));
    BEADS.forEach((k) => c.beads[k] > 0 && a.push(k));
    return a;
  }
  const pureOf = (c) => { const a = comps(c); return a.length === 1 ? a[0] : null; };
  const empty = (c) => comps(c).length === 0;
  const liquid = (c) => c.w > 0.01 || c.oil > 0.01;
  const solidKinds = (c) => [...BEADS.filter((k) => c.beads[k] > 0), ...SOLS.filter((k) => sol(c, k) > 0.05)];
  const fmt = (v) => { const r = Math.round(v * 10) / 10; return (r % 1 ? r.toFixed(1) : String(r)); };
  // 받침: 을/를, 이/가, 은/는, 과/와
  function jo(word, pair) {
    const w = word.replace(/\([^)]*\)$/, ''), ch = w.charCodeAt(w.length - 1);
    const has = ch >= 0xac00 && ch <= 0xd7a3 ? (ch - 0xac00) % 28 > 0 : false;
    const [a, b] = pair.split('/');
    return word + (has ? a : b);
  }
  const names = (ks) => ks.map((k) => NAME[k]).join(', ');
  // '소금과 붕산', '물과 콩기름'처럼 잇기
  const andList = (ws) => (ws.length < 2 ? ws.join('') : ws.slice(0, -2).map((w) => w + ', ').join('') + jo(ws[ws.length - 2], '과/와') + ' ' + ws[ws.length - 1]);
  const andN = (ks) => andList(ks.map((k) => NAME[k]));
  function label(c) {
    const a = comps(c);
    if (!a.length) return '빈 그릇';
    if (a.length === 1) return NAME[a[0]];
    return a.map((k) => NAME[k]).join(' · ');
  }

  /* ---- 분리 방법(기구) ---- 결과: { ok, msg, outs, main, prop, lost } ---- */
  const PROP = { filter: '용해도', funnel: '밀도', skim: '밀도', cool: '용해도', heat: '끓는점', water: null, hot: null };
  const TOOL = {
    water: '물 붓기', hot: '뜨거운 물 붓기', filter: '거름 장치로 거르기', funnel: '분별 깔때기로 나누기',
    skim: '뜬 것 건지기', cool: '얼음물로 식히기', heat: '가열하여 물 날려 보내기',
  };
  function fail(msg) { return { ok: false, msg }; }
  function pickMain(outs) {
    const mixes = outs.filter((o) => comps(o).length > 1);
    if (!mixes.length) return -1;
    let best = mixes[0]; mixes.forEach((o) => { if (comps(o).length > comps(best).length) best = o; });
    return outs.indexOf(best);
  }
  function dissolveNote(before, after) {
    const went = [], left = [];
    SOLS.forEach((k) => { if (after.amt[k] <= 0.05) return; const s0 = sol(before, k), s1 = sol(after, k); if (s1 <= 0.05) { if (s0 > 0.05) went.push(k); } else left.push(k); });
    let m = '';
    if (went.length) m += ` ${jo(andN(went), '은/는')} 모두 녹았어요.`;
    if (left.length) m += ` ${left.map((k) => `${NAME[k]} 약 ${fmt(sol(after, k))} g`).join(', ')}은 녹지 않고 남았어요.`;
    return m;
  }
  // 거름종이를 지나가는 것: '소금이 녹아 있는 물과 콩기름'
  function passList(c) {
    const p = [];
    if (c.w > 0.01) { const dd = SOLS.filter((k) => dis(c, k) > 0.05); p.push(dd.length ? `${jo(andN(dd), '이/가')} 녹아 있는 물` : '물'); }
    if (c.oil > 0.01) p.push('콩기름');
    return andList(p);
  }
  const ops = {
    water(c, hot) {
      const Tin = hot ? 70 : 20;
      if (c.w + 100 > 200.5) return fail('비커가 넘칠 것 같아요. 이 비커에는 물을 200 g까지만 넣을 수 있어요.');
      const o = clone(c, { vessel: 'beaker', w: c.w + 100, T: c.w > 0.01 ? (c.w * c.T + 100 * Tin) / (c.w + 100) : Tin });
      let m = `${hot ? '약 70 ℃ 뜨거운 물' : '물'} 100 g을 부었어요.`;
      m += dissolveNote(c, o);
      if (!liquid(c)) {
        const sink = ['pet', 'iron'].filter((k) => o.beads[k] > 0);
        if (sink.length) m += ` ${jo(andN(sink), '은/는')} 바닥에 가라앉았어요.`;
        if (o.beads.wood > 0) m += ' 나무 구슬은 물 위로 떠올랐어요.';
      }
      if (c.oil > 0.01 && c.w <= 0.01) m += ' 콩기름은 물 위에 떠서 층을 이뤘어요.';
      return { ok: true, outs: [o], main: 0, msg: m };
    },
    hot(c) { return ops.water(c, true); },
    filter(c) {
      if (!liquid(c)) return fail('거를 액체가 없어요. 고체끼리 섞인 것은 거름 장치로 나눌 수 없어요. 먼저 물을 부어 봐요.');
      const sk = solidKinds(c);
      if (!sk.length) return fail('거름종이에 걸러질 고체가 없어요. 물에 녹아 있는 물질은 거름종이를 그대로 지나가요.');
      const res = mk({ vessel: 'paper', beads: Object.assign({}, c.beads) });
      SOLS.forEach((k) => (res.amt[k] = sol(c, k)));
      const fil = mk({ w: c.w, T: c.T, oil: c.oil });
      SOLS.forEach((k) => (fil.amt[k] = dis(c, k)));
      const outs = [res, fil].filter((o) => !empty(o));
      let m = `거름종이 위에 ${jo(andN(sk), '이/가')} 남았어요.`;
      if (!empty(fil)) m += ` ${jo(passList(fil), '은/는')} 거름종이를 지나 비커로 내려갔어요.`;
      return { ok: true, outs, main: pickMain(outs), msg: m, prop: '용해도', got: sk.length === 1 ? sk : [] };
    },
    funnel(c) {
      if (solidKinds(c).length) return fail('분별 깔때기에는 액체만 넣어요. 구슬이나 녹지 않은 알갱이가 섞여 있으면 꼭지가 막혀요. 먼저 고체를 걸러 내요.');
      if (!(c.w > 0.01 && c.oil > 0.01)) return fail(c.w > 0.01 ? '서로 섞이지 않는 두 액체가 없어서 층이 하나뿐이에요. 물에 녹아 있는 물질은 분별 깔때기로 나눌 수 없어요.' : '분별 깔때기로 나눌 두 층이 없어요.');
      const lo = mk({ w: c.w, T: c.T, amt: Object.assign({}, c.amt) });
      const up = mk({ oil: c.oil });
      return { ok: true, outs: [lo, up], main: pickMain([lo, up]), msg: `아래층(물${SOLS.some((k) => c.amt[k] > 0.05) ? '과 녹아 있는 물질' : ''})은 꼭지로, 위층(콩기름)은 입구로 받았어요.`, prop: '밀도', got: ['oil'] };
    },
    skim(c) {
      if (!liquid(c)) return fail('물에 넣어야 뜨는 것과 가라앉는 것이 나뉘어요. 먼저 물을 부어요.');
      if (!c.beads.wood) {
        const sink = ['pet', 'iron'].filter((k) => c.beads[k] > 0);
        return fail('물 위에 떠 있는 고체가 없어요.' + (sink.length ? ` ${jo(andN(sink), '은/는')} 물보다 밀도가 커서 바닥에 가라앉아 있어요.` : ''));
      }
      const wd = mk({ beads: { wood: c.beads.wood } });
      const rest = clone(c); rest.beads.wood = 0;
      const outs = [wd, rest].filter((o) => !empty(o));
      return { ok: true, outs, main: pickMain(outs), msg: '물 위에 떠 있던 나무 구슬을 거름망 국자로 건져 냈어요. 나무 구슬은 물보다 밀도가 작아 떠요.', prop: '밀도', got: ['wood'] };
    },
    cool(c) {
      if (c.w <= 0.01) return fail('얼음물로 식힐 용액이 없어요. 물에 녹아 있는 물질이 있어야 식혔을 때 석출돼요.');
      if (c.T <= 10.5) return fail('이미 얼음물로 10 ℃까지 식혔어요.');
      const o = clone(c, { T: 10 });
      const came = SOLS.filter((k) => sol(o, k) - sol(c, k) > 0.05);
      let m = `용액이 10 ℃까지 식었어요.`;
      if (came.length) m += ` ${came.map((k) => `${NAME[k]} 약 ${fmt(sol(o, k) - sol(c, k))} g`).join(', ')}이 석출되어 가라앉았어요.`;
      else m += ' 그런데 석출된 물질이 없어요. 녹아 있는 양이 10 ℃의 포화 상태보다 적기 때문이에요.';
      const stay = SOLS.filter((k) => dis(o, k) > 0.05 && !came.includes(k));
      if (stay.length) m += ` ${jo(andN(stay), '은/는')} 녹아 있는 채로 남았어요.`;
      return { ok: true, outs: [o], main: 0, msg: m, prop: '용해도' };
    },
    heat(c) {
      if (c.w <= 0.01) return fail('가열해서 날려 보낼 물이 없어요.');
      const o = mk({ vessel: 'dish', oil: c.oil, amt: Object.assign({}, c.amt), beads: Object.assign({}, c.beads) });
      const left = comps(o);
      let m = '물은 100 ℃에서 끓어 수증기가 되어 날아갔어요.';
      if (left.length) m += ` 끓는점이 높은 ${jo(andN(left), '은/는')} 그릇에 남았어요.`;
      else m += ' 물만 들어 있어서 그릇에 아무것도 남지 않았어요.';
      if (c.oil > 0.01) m += ' 콩기름이 섞인 채로 가열하면 기름이 튈 수 있어 위험해요.';
      const outs = left.length ? [o] : [];
      return { ok: true, outs, main: pickMain(outs), msg: m, prop: '끓는점', lost: 'water', got: left.length === 1 ? left : [] };
    },
  };
  function run(tool, c) { return tool === 'hot' ? ops.water(c, true) : ops[tool](c); }

  /* ---- 계획 미리 따져 보기: 단계마다 목표 물질이 든 그릇에 방법을 써 봄 ---- */
  // 'water?'는 액체가 없을 때만 물을 부음
  const PLAN_M = {
    filter: { name: '거름 장치로 거르기', prop: '용해도', seq: ['filter'] },
    wfilter: { name: '물을 붓고 거르기', prop: '용해도', seq: ['water', 'filter'] },
    hfilter: { name: '뜨거운 물에 녹여 거르기', prop: '용해도', seq: ['hot', 'filter'] },
    funnel: { name: '분별 깔때기로 나누기', prop: '밀도', seq: ['funnel'] },
    skim: { name: '물에 띄워 뜬 것 건지기', prop: '밀도', seq: ['water?', 'skim'] },
    coolf: { name: '얼음물로 식혀 석출시켜 거르기', prop: '용해도', seq: ['cool', 'filter'] },
    heat: { name: '가열하여 물 날려 보내기', prop: '끓는점', seq: ['heat'] },
  };
  function dryRun(start, steps) {
    let box = [clone(start)];
    const out = [];
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i], r = { i, ok: true, notes: [] };
      out.push(r);
      if (!s.target || !s.method) { r.ok = false; r.notes.push('분리할 물질과 분리 방법을 골라요.'); continue; }
      const M = PLAN_M[s.method];
      if (s.prop && s.prop !== M.prop) r.notes.push(`${M.name}는 물질의 <b>${M.prop}</b>${jo(M.prop, '을/를').slice(-1)} 이용해요.`), (r.propBad = true);
      if (box.some((c) => pureOf(c) === s.target)) { r.ok = false; r.notes.push(`${jo(NAME[s.target], '은/는')} 이미 따로 나뉘어 있어요.`); continue; }
      let ci = box.findIndex((c) => comps(c).includes(s.target));
      if (ci < 0) { r.ok = false; r.notes.push(`${jo(NAME[s.target], '이/가')} 들어 있는 그릇이 없어요. 앞 단계에서 날아갔거나 다른 그릇에 섞여 있지 않은지 봐요.`); continue; }
      let cur = [box[ci]];
      const seq = M.seq;
      for (let t of seq) {
        // 이전 동작의 결과 중 목표 물질이 든 그릇에 이어서
        const j = cur.findIndex((c) => comps(c).includes(s.target) && comps(c).length > 1);
        if (j < 0) break;
        if (t === 'water?') { if (liquid(cur[j])) continue; t = 'water'; }
        const res = run(t, cur[j]);
        if (!res.ok) { r.ok = false; r.notes.push(`<b>${TOOL[t]}</b>: ${res.msg}`); break; }
        cur.splice(j, 1, ...res.outs);
      }
      box.splice(ci, 1, ...cur);
      box = box.filter((c) => !empty(c));
      const got = box.some((c) => pureOf(c) === s.target);
      if (r.ok && !got) { r.ok = false; const h = box.find((c) => comps(c).includes(s.target)); r.notes.push(h ? `이 방법으로는 ${jo(NAME[s.target], '이/가')} 따로 나오지 않아요. ${jo(andN(comps(h)), '이/가')} 한 그릇에 함께 남아요.` : `${jo(NAME[s.target], '이/가')} 남지 않았어요. 물과 함께 날아가지는 않았는지 생각해 봐요.`); }
      r.got = got;
    }
    return { steps: out, box };
  }

  /* =================================================================
     2. 캔버스 공통
     ================================================================= */
  function surface(host, W, H) {
    const cv = document.createElement('canvas'); cv.className = 'wvc'; host.appendChild(cv);
    const box = document.createElement('div'); box.className = 'olay'; host.appendChild(box);
    const ctx = cv.getContext('2d'); const m = { k: 1, ox: 0, oy: 0, dpr: 1 };
    function fit() {
      const r = host.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      m.k = Math.min(r.width / W, r.height / H); m.ox = (r.width - W * m.k) / 2; m.oy = (r.height - H * m.k) / 2; m.dpr = dpr;
      Object.assign(box.style, { left: m.ox + 'px', top: m.oy + 'px', width: W * m.k + 'px', height: H * m.k + 'px', right: 'auto', bottom: 'auto' });
    }
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(host); else window.addEventListener('resize', fit);
    return { cv, ctx, box, m, W, H,
      begin() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(m.dpr * m.k, 0, 0, m.dpr * m.k, m.dpr * m.ox, m.dpr * m.oy); },
      full() { return [-m.ox / m.k, -m.oy / m.k, cv.width / m.dpr / m.k, cv.height / m.dpr / m.k]; } };
  }
  function overlay(S) {
    const box = S.box, map = {};
    return {
      put(id, x, y, html, cls = '') {
        let e = map[id]; if (!e) { e = document.createElement('span'); box.appendChild(e); map[id] = e; }
        const c = 'ol ' + cls; if (e.className !== c) e.className = c;
        if (e._h !== html) { e.innerHTML = html; e._h = html; }
        e.style.left = (x / S.W * 100).toFixed(2) + '%'; e.style.top = (y / S.H * 100).toFixed(2) + '%'; e.hidden = false; return e;
      },
      hide(id) { if (map[id]) map[id].hidden = true; },
      hideAll() { Object.keys(map).forEach((k) => (map[k].hidden = true)); },
    };
  }
  const loops = new Set();
  let last = 0;
  function tick(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0); last = now;
    loops.forEach((L) => { try { if (L.host.offsetParent !== null) { const r = L.host.getBoundingClientRect(); if (r.bottom > -50 && r.top < innerHeight + 50) L.fn(dt); } } catch (e) { loops.delete(L); (window.SM_err || window.RD_err || console.error)('실험대 그림', e); } });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  const addLoop = (host, fn) => { const L = { host, fn }; loops.add(L); return L; };
  function tweens() {
    let list = [];
    return {
      add(dur, fn, done) { const t = { dur: Math.max(0.001, reduce ? 0.001 : dur), t: 0, fn, done }; list.push(t); return t; },
      step(dt) { const cur = list; list = []; cur.forEach((t) => { t.t += dt; const k = Math.min(1, t.t / t.dur); t.fn(k); if (k < 1) list.push(t); else if (t.done) t.done(); }); },
      clear() { list = []; },
      get busy() { return list.length > 0; },
    };
  }
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function contact(ctx, x, y, w, a = 0.18) {
    const g = ctx.createRadialGradient(x, y, 1, x, y, w / 2);
    g.addColorStop(0, `rgba(20,38,59,${a})`); g.addColorStop(1, 'rgba(20,38,59,0)');
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.16); ctx.translate(-x, -y);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, w / 2, 0, TAU); ctx.fill(); ctx.restore();
  }
  function lead(ctx, pts) { ctx.save(); ctx.strokeStyle = 'rgba(90,107,126,.55)'; ctx.lineWidth = 1; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.fillStyle = 'rgba(90,107,126,.8)'; const [ex, ey] = pts[pts.length - 1]; ctx.beginPath(); ctx.arc(ex, ey, 2, 0, TAU); ctx.fill(); ctx.restore(); }

  /* ---- 다각형 속 액체 높이 (그릇이 기울어도 수면은 수평) ---- */
  function clipBelow(P, L) {
    const out = [];
    for (let i = 0; i < P.length; i++) {
      const p = P[i], q = P[(i + 1) % P.length], pi = p[1] >= L, qi = q[1] >= L;
      if (pi) out.push(p);
      if (pi !== qi) { const t = (L - p[1]) / (q[1] - p[1]); out.push([p[0] + (q[0] - p[0]) * t, L]); }
    }
    return out;
  }
  function areaP(P) { let s = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; s += p[0] * q[1] - q[0] * p[1]; } return Math.abs(s) / 2; }
  function levelFor(P, A) {
    let lo = Infinity, hi = -Infinity; P.forEach((p) => { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); });
    if (A <= 0) return hi;
    if (A >= areaP(P)) return lo;
    for (let i = 0; i < 26; i++) { const m = (lo + hi) / 2; if (areaP(clipBelow(P, m)) > A) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  function chord(P, L) { const c = clipBelow(P, L - 0.01); let a = Infinity, b = -Infinity; c.forEach((p) => { if (Math.abs(p[1] - L) < 0.6) { a = Math.min(a, p[0]); b = Math.max(b, p[0]); } }); return a < b ? [a, b] : null; }
  const xf = (X, P) => { const c = Math.cos(X.a || 0), s = Math.sin(X.a || 0), k = X.s || 1; return P.map(([x, y]) => [X.x + (x * c - y * s) * k, X.y + (x * s + y * c) * k]); };
  const path = (ctx, P) => { ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };

  /* ---- 알갱이 · 구슬 ---- */
  function bead(ctx, kind, x, y, r, rot = 0) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(20,38,59,.10)'; ctx.beginPath(); ctx.ellipse(r * 0.15, r * 0.9, r * 0.85, r * 0.22, 0, 0, TAU); ctx.fill();
    let g;
    if (kind === 'iron') { g = ctx.createRadialGradient(-r * 0.4, -r * 0.45, r * 0.1, 0, 0, r); g.addColorStop(0, '#eef1f4'); g.addColorStop(0.35, '#a7b0b9'); g.addColorStop(1, '#4b5560'); }
    else if (kind === 'wood') { g = ctx.createRadialGradient(-r * 0.4, -r * 0.45, r * 0.1, 0, 0, r); g.addColorStop(0, '#ecd1a8'); g.addColorStop(0.55, '#c99a63'); g.addColorStop(1, '#93673b'); }
    else { g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r); g.addColorStop(0, 'rgba(255,255,255,.98)'); g.addColorStop(0.6, 'rgba(226,233,239,.95)'); g.addColorStop(1, 'rgba(176,190,203,.95)'); }
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = kind === 'iron' ? 'rgba(40,50,60,.45)' : kind === 'wood' ? 'rgba(110,72,36,.45)' : 'rgba(110,130,150,.5)'; ctx.lineWidth = 0.8; ctx.stroke();
    if (kind === 'wood') { ctx.rotate(rot); ctx.strokeStyle = 'rgba(120,80,40,.35)'; ctx.lineWidth = 0.8; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.ellipse(0, i * r * 0.4, r * 0.85, r * 0.16, 0, 0, Math.PI); ctx.stroke(); } }
    if (kind === 'pet') { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, r * 0.62, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke(); }
    ctx.restore();
  }
  function grain(ctx, k, x, y, s, a, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    if (k === 'cuso4') {
      ctx.beginPath(); ctx.moveTo(-s, -s * 0.2); ctx.lineTo(-s * 0.3, -s * 0.8); ctx.lineTo(s, -s * 0.4); ctx.lineTo(s * 0.6, s * 0.7); ctx.lineTo(-s * 0.7, s * 0.6); ctx.closePath();
      const g = ctx.createLinearGradient(-s, -s, s, s); g.addColorStop(0, '#7cc3ee'); g.addColorStop(1, '#2f86c8'); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(18,70,120,.45)'; ctx.lineWidth = 0.6; ctx.stroke();
    } else if (k === 'boric') {
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const q = i / 6 * TAU, r = s * (i % 3 === 0 ? 1.15 : 0.82); ctx[i ? 'lineTo' : 'moveTo'](Math.cos(q) * r, Math.sin(q) * r * 0.62); } ctx.closePath();
      const v = Math.round(lerp(214, 252, t)); ctx.fillStyle = `rgb(${v},${Math.min(255, v + 1)},${Math.min(255, v + 3)})`; ctx.fill();
      ctx.strokeStyle = 'rgba(120,138,156,.55)'; ctx.lineWidth = 0.6; ctx.stroke();
    } else {
      // 소금: 작은 정육면체(밝은 윗면 + 그늘진 옆면)
      const h = s * 0.9;
      ctx.fillStyle = '#d5dde4'; ctx.fillRect(-h, -h * 0.4, h * 2, h * 1.4);
      ctx.fillStyle = `rgb(${Math.round(lerp(236, 252, t))},${Math.round(lerp(238, 253, t))},${Math.round(lerp(240, 254, t))})`; ctx.beginPath(); ctx.moveTo(-h, -h * 0.4); ctx.lineTo(-h * 0.5, -h); ctx.lineTo(h * 1.4, -h); ctx.lineTo(h, -h * 0.4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(120,138,156,.5)'; ctx.lineWidth = 0.6; ctx.strokeRect(-h, -h * 0.4, h * 2, h * 1.4);
    }
    ctx.restore();
  }
  // 무더기 자리(가운데가 높게): 낮은 곳부터 채움
  function heapSlots(n, seed) {
    const R = rng(seed), out = [], bins = new Float32Array(40);
    for (let i = 0; i < n; i++) {
      const u = (R() + R() + R()) / 3 * 2 - 1; let j = clamp(Math.floor((u + 1) / 2 * 40), 0, 39);
      for (let k = 0; k < 6; k++) { const l = Math.max(0, j - 1), r = Math.min(39, j + 1); if (bins[l] + 1 < bins[j]) j = l; else if (bins[r] + 1 < bins[j]) j = r; else break; }
      out.push({ x: (j + 0.5) / 20 - 1 + (R() - 0.5) * 0.04, y: bins[j], a: R() * TAU, s: 0.8 + R() * 0.45, t: 0.4 + R() * 0.6 });
      bins[j] += 0.55 + R() * 0.35;
    }
    return out;
  }
  const HEAP = heapSlots(260, 11);
  const heapTop = []; { let m = 0; HEAP.forEach((h, i) => { m = Math.max(m, h.y); heapTop[i] = m || 1; }); }
  const GPG = 5.5; // 1 g에 그리는 알갱이 수(보기 좋게 정한 값)
  function pile(ctx, solid, cx, by, maxHW) {
    const n = {}; let N = 0; SOLS.forEach((k) => { n[k] = Math.min(80, Math.round((solid[k] || 0) * GPG)); N += n[k]; });
    if (!N) return 0;
    N = Math.min(N, HEAP.length);
    const hw = Math.min(maxHW, 12 + Math.sqrt(N) * 6.2), ph = Math.min(46, 2 + Math.sqrt(N) * 2.4), top = heapTop[N - 1];
    // 물질을 골고루 섞어 놓음
    const left = Object.assign({}, n), order = [];
    for (let i = 0; i < N; i++) { let best = null, bv = -1; SOLS.forEach((k) => { if (left[k] > 0) { const v = left[k] / n[k]; if (v > bv) { bv = v; best = k; } } }); order.push(best); left[best]--; }
    for (let i = 0; i < N; i++) { const h = HEAP[i]; grain(ctx, order[i], cx + h.x * hw, by - 2 - h.y / top * ph, 3.1 * h.s, h.a, h.t); }
    return ph;
  }
  // 구슬 자리: 바닥부터 줄지어
  function beadSlots(n, hw, r) {
    const out = []; let row = 0, i = 0;
    while (i < n) { const per = Math.max(1, Math.floor((2 * hw - (row % 2) * r) / (2 * r + 1))), x0 = -((per - 1) * (2 * r + 1)) / 2; for (let j = 0; j < per && i < n; j++, i++) out.push([x0 + j * (2 * r + 1) + (row % 2 ? 0.5 : 0) * r, -r - row * r * 1.7]); row++; }
    return out;
  }

  /* =================================================================
     3. 그릇 그리기 (비커 · 넓은 그릇 · 펼친 거름종이)
        v: 보이는 상태 { vessel, w, oil, T, solid{}, cu(황산 구리(Ⅱ) 진하기 0~1), beads{}, float(0~1), vol(0~1), rod, ref }
        X: { x, y(바닥), a(기울기), s(크기) }
     ================================================================= */
  const BW = 170, BH = 200, BIN = 79, KW = 0.75;
  const BPOLY = [[-BIN, -7], [BIN, -7], [BIN, -BH + 2], [-BIN, -BH + 2]];
  const DISH = (() => { const P = []; for (let i = 0; i <= 24; i++) { const t = i / 24 * Math.PI; P.push([96 * Math.cos(t), -44 + 40 * Math.sin(t)]); } return P; })();
  function viewOf(c) {
    const v = { vessel: c.vessel, w: c.w, oil: c.oil, T: c.T, solid: {}, beads: Object.assign({}, c.beads), float: liquid(c) ? 1 : 0, vol: 1, rod: 0 };
    SOLS.forEach((k) => (v.solid[k] = sol(c, k)));
    v.cu = c.w > 0.01 ? clamp(dis(c, 'cuso4') / c.w * 100 / 12, 0, 1) : 0;
    return v;
  }
  const waterCol = (v) => mixC(WATER, CUSO, v.cu || 0);
  function liquidAreas(v) {
    const vol = v.vol == null ? 1 : v.vol;
    if (v.vessel === 'dish') { const cap = areaP(DISH), ref = v.ref || v.w || 1; return [cap * 0.72 * clamp(v.w / ref, 0, 1) * vol, v.oil > 0.01 ? cap * 0.16 * vol : 0]; }
    return [v.w * KW * (2 * BIN) * vol, v.oil * KW * (2 * BIN) * vol];
  }
  function drawVessel(ctx, v, X, o = {}) {
    if (!v) return null;
    const k = X.s || 1, a = X.a || 0;
    const local = (fn) => { ctx.save(); ctx.translate(X.x, X.y); ctx.rotate(a); ctx.scale(k, k); fn(); ctx.restore(); };
    if (!o.noShadow && Math.abs(a) < 0.02 && !o.lifted) contact(ctx, X.x, X.y + 2, (v.vessel === 'dish' ? 220 : v.vessel === 'paper' ? 170 : BW * 1.15) * k, 0.14);
    if (v.vessel === 'paper') { local(() => paperBody(ctx, v)); return null; }
    const poly = v.vessel === 'dish' ? DISH : BPOLY;
    // 뒤 유리
    local(() => { if (v.vessel === 'dish') dishBack(ctx); else { rr(ctx, -BW / 2, -BH, BW, BH, 10); ctx.fillStyle = 'rgba(236,242,247,.55)'; ctx.fill(); } });
    // 액체(세계 좌표에서 수평)
    const PW = xf({ x: X.x, y: X.y, a, s: k }, poly);
    const [Aw, Ao] = liquidAreas(v).map((q) => q * k * k);
    let top = null, mid = null;
    if (Aw + Ao > 2) {
      top = levelFor(PW, Aw + Ao); mid = Aw > 1 ? levelFor(PW, Aw) : null;
      const ch = chord(PW, top);
      // 뜬 나무 구슬
      if (ch && (v.float || 0) > 0.01 && v.beads.wood) {
        const n = Math.round(v.beads.wood), span = ch[1] - ch[0] - 18 * k, step = Math.min(19 * k, span / Math.max(1, n - 1 || 1));
        for (let i = 0; i < n; i++) { const xx = (ch[0] + ch[1]) / 2 + (i - (n - 1) / 2) * step, bob = Math.sin(performance.now() / 700 + i * 1.7) * 0.8; bead(ctx, 'wood', xx, top - 2 * k + bob + (1 - v.float) * 40 * k, 9 * k, i); }
      }
      if (o.inside) o.inside(top);
      ctx.save(); path(ctx, PW); ctx.clip();
      const minX = Math.min(...PW.map((p) => p[0])) - 2, maxX = Math.max(...PW.map((p) => p[0])) + 2, maxY = Math.max(...PW.map((p) => p[1])) + 2;
      const wc = waterCol(v);
      if (mid != null) { const g = ctx.createLinearGradient(0, mid, 0, maxY); g.addColorStop(0, rgba(wc, 0.62)); g.addColorStop(1, rgba(shade(wc, 0.9), 0.78)); ctx.fillStyle = g; ctx.fillRect(minX, mid, maxX - minX, maxY - mid); }
      if (Ao > 1) { const y1 = mid == null ? maxY : mid, g = ctx.createLinearGradient(0, top, 0, y1); g.addColorStop(0, rgba(OIL, 0.78)); g.addColorStop(1, rgba(shade(OIL, 0.93), 0.86)); ctx.fillStyle = g; ctx.fillRect(minX, top, maxX - minX, y1 - top); if (mid != null) { ctx.strokeStyle = rgba(shade(OIL, 0.62), 0.8); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(minX, mid); ctx.lineTo(maxX, mid); ctx.stroke(); } }
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(minX, top); ctx.lineTo(maxX, top); ctx.stroke();
      ctx.restore();
      // 김(뜨거운 물)
      if (Math.abs(a) < 0.05 && v.T > 42 && v.w > 0.01 && !o.noSteam) steam(ctx, X.x, top - 8, clamp((v.T - 40) / 30, 0, 1) * 0.45 * (o.steamK == null ? 1 : o.steamK), 3, 34 * k);
    }
    // 바닥의 고체(알갱이 무더기, 가라앉은 구슬): 액체 뒤에 그려 잘 보이게
    let pileH = 0;
    local(() => {
      const by = v.vessel === 'dish' ? -6 : -8;
      pileH = pile(ctx, v.solid, 0, by, v.vessel === 'dish' ? 56 : BIN - 6);
      const sink = []; ['iron', 'pet'].forEach((kk) => { for (let i = 0; i < Math.round(v.beads[kk] || 0); i++) sink.push(kk); });
      const flo = Math.round(v.beads.wood || 0), lqd = liquidAreas(v)[0] + liquidAreas(v)[1] > 1;
      if (!lqd || (v.float || 0) < 0.5) for (let i = 0; i < flo; i++) sink.push('wood');
      const sl = beadSlots(sink.length, v.vessel === 'dish' ? 60 : BIN - 4, 9);
      // 기울이면 구슬이 낮은 쪽(따르는 쪽 벽)으로 굴러감
      const tk = v.vessel === 'beaker' ? clamp(a / 0.9, 0, 1) : 0;
      sink.forEach((kk, i) => { const p = sl[i], lift = Math.abs(p[0]) < 30 ? Math.min(pileH * 0.35, 6) : 0; bead(ctx, kk, lerp(p[0], BIN - 10 - (i % 2) * 18, tk), lerp(by + p[1] - lift, -17 - Math.floor(i / 2) * 17, tk), 9, i); });
    });
    // 앞 유리 + 유리 막대
    local(() => { if (v.vessel === 'dish') dishFront(ctx); else beakerFront(ctx); if (v.rod) rod(ctx, v.rod, v.rodT || 0); });
    return { top, mid, pileH };
  }
  function beakerFront(ctx) {
    const x0 = -BW / 2, h = BH, w = BW;
    ctx.save();
    ctx.strokeStyle = 'rgba(110,130,150,.75)'; ctx.lineWidth = 1.7; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x0 - 6, -h - 3); ctx.quadraticCurveTo(x0, -h - 1, x0, -h + 9); ctx.lineTo(x0, -9); ctx.quadraticCurveTo(x0, 0, x0 + 9, 0); ctx.lineTo(-x0 - 9, 0); ctx.quadraticCurveTo(-x0, 0, -x0, -9); ctx.lineTo(-x0, -h); ctx.stroke();
    ctx.strokeStyle = 'rgba(110,130,150,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, -h, w / 2, 4, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(110,130,150,.5)';
    for (let i = 1; i <= 5; i++) { const yy = -7 - i * 30; ctx.beginPath(); ctx.moveTo(-x0 - 26, yy); ctx.lineTo(-x0 - 8, yy); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-x0 - 17, yy + 15); ctx.lineTo(-x0 - 8, yy + 15); ctx.stroke(); }
    let g = ctx.createLinearGradient(x0, 0, x0 + 26, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.45, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x0 + 7, -h + 14, 20, h - 30);
    g = ctx.createLinearGradient(0, -8, 0, 0); g.addColorStop(0, 'rgba(210,222,233,.5)'); g.addColorStop(1, 'rgba(176,192,207,.75)');
    ctx.fillStyle = g; rr(ctx, x0 + 1, -8, w - 2, 7, 5); ctx.fill();
    ctx.restore();
  }
  // 넓은 유리 그릇(옆에서 본 반타원). 비커와 같은 유리 표현
  function dishBack(ctx) {
    ctx.save(); path(ctx, DISH); ctx.fillStyle = 'rgba(236,242,247,.55)'; ctx.fill();
    ctx.strokeStyle = 'rgba(110,130,150,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, -44, 100, 9, 0, Math.PI, TAU); ctx.stroke(); ctx.restore();
  }
  function dishFront(ctx) {
    ctx.save();
    ctx.beginPath(); for (let i = 0; i <= 32; i++) { const t = i / 32 * Math.PI; const x = -100 * Math.cos(t), y = -44 + 44 * Math.sin(t); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.strokeStyle = 'rgba(110,130,150,.75)'; ctx.lineWidth = 1.7; ctx.stroke();
    ctx.strokeStyle = 'rgba(110,130,150,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, -44, 100, 9, 0, 0, Math.PI); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); for (let i = 3; i <= 9; i++) { const t = i / 32 * Math.PI; const x = -92 * Math.cos(t), y = -44 + 38 * Math.sin(t); i > 3 ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    const g = ctx.createLinearGradient(0, -5, 0, 2); g.addColorStop(0, 'rgba(210,222,233,.6)'); g.addColorStop(1, 'rgba(176,192,207,.8)');
    ctx.fillStyle = g; rr(ctx, -40, -4, 80, 6, 3); ctx.fill();
    ctx.restore();
  }
  function paperBody(ctx, v) {
    // 펼친 거름종이(비스듬히 본 둥근 종이) + 위에 남은 고체
    ctx.save();
    ctx.fillStyle = 'rgba(20,38,59,.08)'; ctx.beginPath(); ctx.ellipse(3, 3, 78, 17, 0, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(-10, -8, 6, 0, -4, 80); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e6ebf0');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -2, 76, 16, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(120,138,156,.45)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = 'rgba(120,138,156,.25)'; ctx.beginPath(); ctx.moveTo(-76, -2); ctx.lineTo(76, -2); ctx.moveTo(0, -18); ctx.lineTo(0, 14); ctx.stroke();
    // 젖은 자국
    ctx.fillStyle = 'rgba(196,223,244,.35)'; ctx.beginPath(); ctx.ellipse(0, -2, 44, 9, 0, 0, TAU); ctx.fill();
    const ph = pile(ctx, v.solid, 0, 0, 40);
    const all = []; BEADS.forEach((kk) => { for (let i = 0; i < Math.round(v.beads[kk] || 0); i++) all.push(kk); });
    const sl = beadSlots(all.length, 56, 9);
    all.forEach((kk, i) => { const p = sl[i]; bead(ctx, kk, p[0], p[1] - (Math.abs(p[0]) < 26 ? Math.min(ph * 0.4, 5) : 0), 9, i); });
    ctx.restore();
  }
  function rod(ctx, k, th) {
    const tx = lerp(56, Math.cos(th) * 26, k), ty = -BH - 50, bx = lerp(-44, -Math.cos(th) * 34, k), by = -16 + Math.sin(th) * 2 * k;
    const g = ctx.createLinearGradient(tx - 4, 0, tx + 4, 0); g.addColorStop(0, 'rgba(190,205,218,.95)'); g.addColorStop(0.5, 'rgba(250,252,253,.95)'); g.addColorStop(1, 'rgba(170,188,204,.95)');
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(120,140,160,.6)'; ctx.lineWidth = 8.5; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(bx, by); ctx.stroke(); ctx.strokeStyle = g; ctx.lineWidth = 6.5; ctx.stroke(); ctx.restore();
  }
  function steam(ctx, x, y, a, n = 3, sp = 34) {
    if (a <= 0.01) return;
    const t = performance.now() / 1000;
    ctx.save(); ctx.strokeStyle = `rgba(150,168,186,${a})`; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) { const x0 = x - sp * (n - 1) / 2 + i * sp, ph = t * 1.4 + i * 2.1; ctx.beginPath(); for (let j = 0; j <= 20; j++) { const yy = y - j * 3.4, xx = x0 + Math.sin(ph + j * 0.32) * 7 * (j / 20); j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); }
    ctx.restore();
  }

  /* ---- 기구 ---- */
  function standBase(ctx, x0, x1, px, topY, TY) {
    contact(ctx, (x0 + x1) / 2, TY + 2, x1 - x0 + 40, 0.18);
    let g = ctx.createLinearGradient(0, TY - 14, 0, TY); g.addColorStop(0, '#4b5561'); g.addColorStop(1, '#262d35');
    ctx.fillStyle = g; rr(ctx, x0, TY - 14, x1 - x0, 14, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x0 + 4, TY - 13, x1 - x0 - 8, 1.5);
    g = ctx.createLinearGradient(px - 5, 0, px + 5, 0); g.addColorStop(0, '#9aa5b1'); g.addColorStop(0.45, '#f3f6f8'); g.addColorStop(1, '#7d8894');
    ctx.fillStyle = g; ctx.fillRect(px - 5, topY, 10, TY - 14 - topY);
    ctx.fillStyle = '#7d8894'; ctx.beginPath(); ctx.ellipse(px, topY, 5, 2, 0, 0, TAU); ctx.fill();
  }
  function arm(ctx, px, y, x2) {
    let g = ctx.createLinearGradient(0, y - 4, 0, y + 4); g.addColorStop(0, '#d9dfe5'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#8e99a5');
    ctx.fillStyle = g; ctx.fillRect(px, y - 3.5, x2 - px, 7);
    g = ctx.createLinearGradient(0, y - 10, 0, y + 10); g.addColorStop(0, '#5d6874'); g.addColorStop(1, '#2b333c');
    ctx.fillStyle = g; rr(ctx, px - 11, y - 10, 22, 20, 4); ctx.fill();
    ctx.fillStyle = '#3a434d'; ctx.beginPath(); ctx.arc(px - 16, y, 5, 0, TAU); ctx.fill();
  }
  function ring(ctx, x, y, rx, front) {
    ctx.save();
    if (front) { const g = ctx.createLinearGradient(0, y - 5, 0, y + 9); g.addColorStop(0, '#a9b3bd'); g.addColorStop(1, '#56616c'); ctx.strokeStyle = g; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(x, y, rx, 8, 0, 0, Math.PI); ctx.stroke(); }
    else { ctx.strokeStyle = '#6d7884'; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.ellipse(x, y, rx, 8, 0, Math.PI, TAU); ctx.stroke(); }
    ctx.restore();
  }
  function hotplate(ctx, cx, top, heat, w = 250) {
    const bh = 62;
    contact(ctx, cx, top + bh + 8, w + 50, 0.22);
    let g = ctx.createLinearGradient(0, top + 8, 0, top + bh + 8); g.addColorStop(0, '#fbfcfd'); g.addColorStop(1, '#d6dde5');
    ctx.fillStyle = g; rr(ctx, cx - w / 2, top + 8, w, bh, 12); ctx.fill(); ctx.strokeStyle = 'rgba(20,38,59,.14)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(20,38,59,.06)'; rr(ctx, cx - w / 2 + 6, top + bh - 2, w - 12, 8, 4); ctx.fill();
    ctx.fillStyle = '#2a323b'; ctx.beginPath(); ctx.ellipse(cx, top + 8, w / 2 - 10, 12, 0, 0, TAU); ctx.fill();
    g = ctx.createLinearGradient(0, top - 6, 0, top + 8); g.addColorStop(0, '#56616c'); g.addColorStop(1, '#1d242b');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, top + 3, w / 2 - 14, 10, 0, 0, TAU); ctx.fill();
    if (heat > 0.01) { ctx.save(); ctx.globalAlpha = heat * 0.5; ctx.strokeStyle = '#7d8c9b'; ctx.lineWidth = 1.2; [0.45, 0.7, 0.92].forEach((f) => { ctx.beginPath(); ctx.ellipse(cx, top + 3, (w / 2 - 14) * f, 10 * f, 0, 0, TAU); ctx.stroke(); }); ctx.restore(); }
    const ky = top + 8 + bh / 2 + 2;
    g = ctx.createRadialGradient(cx + w / 2 - 50, ky - 5, 2, cx + w / 2 - 48, ky, 17); g.addColorStop(0, '#5b6570'); g.addColorStop(1, '#171d23');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx + w / 2 - 48, ky, 16, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(cx + w / 2 - 48, ky); ctx.rotate(heat * 2.2); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, -5); ctx.stroke(); ctx.restore();
    ctx.fillStyle = heat > 0.01 ? BLUE : '#c3ccd6'; ctx.beginPath(); ctx.arc(cx - w / 2 + 40, ky, 6, 0, TAU); ctx.fill();
  }
  /* 분별 깔때기 모양 (밀도 차 분리 수업과 같은 윤곽) */
  const PROF = [[92, 19], [128, 19], [134, 30], [146, 52], [162, 74], [184, 92], [212, 103], [240, 103], [268, 95], [300, 81], [340, 61], [380, 41], [420, 22], [446, 10], [456, 6.5]];
  const hwOut = (() => {
    const pts = [];
    for (let i = 0; i < PROF.length - 1; i++) {
      const p0 = PROF[Math.max(0, i - 1)], p1 = PROF[i], p2 = PROF[i + 1], p3 = PROF[Math.min(PROF.length - 1, i + 2)];
      for (let s = 0; s < 12; s++) { const t = s / 12, t2 = t * t, t3 = t2 * t; const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]); }
    }
    pts.push(PROF[PROF.length - 1]);
    const tab = new Float32Array(460);
    for (let y = 0; y < 460; y++) { if (y < 92) { tab[y] = 0; continue; } let j = 0; while (j < pts.length - 2 && pts[j + 1][0] < y) j++; const a = pts[j], b = pts[j + 1], k = clamp((y - a[0]) / Math.max(0.001, b[0] - a[0]), 0, 1); tab[y] = lerp(a[1], b[1], k); }
    return (y) => { const i = Math.floor(clamp(y, 0, 458)), f = y - i; return lerp(tab[i], tab[Math.min(459, i + 1)], clamp(f, 0, 1)); };
  })();
  const hwIn = (y) => Math.max(1.6, hwOut(y) - 3);
  const MOUTH = 92, CONE = 456, COCK = 470, TIP = 598;
  const SPOLY = (() => { const P = []; for (let y = 104; y <= CONE; y += 4) P.push([hwIn(y), y]); for (let y = CONE; y >= 104; y -= 4) P.push([-hwIn(y), y]); return P; })();
  function sepOuter(ctx) {
    ctx.beginPath(); ctx.moveTo(-hwOut(MOUTH), MOUTH);
    for (let y = MOUTH + 2; y <= CONE; y += 2) ctx.lineTo(-hwOut(y), y);
    ctx.lineTo(-5, CONE + 4); ctx.lineTo(-5, TIP - 8); ctx.lineTo(-3.4, TIP); ctx.lineTo(3.4, TIP); ctx.lineTo(5, TIP - 8); ctx.lineTo(5, CONE + 4);
    for (let y = CONE; y >= MOUTH; y -= 2) ctx.lineTo(hwOut(y), y);
    ctx.closePath();
  }
  function sepFront(ctx, open) {
    ctx.save();
    sepOuter(ctx); ctx.strokeStyle = 'rgba(110,130,150,.75)'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.beginPath(); for (let y = 150; y <= 330; y += 3) { const x = -hwOut(y) + 12 + (y - 150) * 0.02; y === 150 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke();
    let g = ctx.createLinearGradient(-24, 0, 24, 0); g.addColorStop(0, 'rgba(205,216,226,.9)'); g.addColorStop(0.5, 'rgba(246,249,251,.95)'); g.addColorStop(1, 'rgba(190,203,215,.9)');
    ctx.fillStyle = g; rr(ctx, -23, MOUTH - 5, 46, 11, 3); ctx.fill(); ctx.strokeStyle = 'rgba(110,130,150,.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    // 꼭지
    g = ctx.createLinearGradient(-20, 0, 20, 0); g.addColorStop(0, 'rgba(196,209,221,.95)'); g.addColorStop(0.5, 'rgba(240,245,249,.98)'); g.addColorStop(1, 'rgba(182,197,211,.95)');
    ctx.fillStyle = g; rr(ctx, -20, COCK - 10, 40, 20, 7); ctx.fill(); ctx.strokeStyle = 'rgba(110,130,150,.65)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.translate(32, COCK); ctx.fillStyle = 'rgba(190,203,215,.95)'; ctx.fillRect(-12, -4, 12, 8);
    ctx.rotate(-open * Math.PI / 2);
    g = ctx.createLinearGradient(0, -7, 0, 7); g.addColorStop(0, '#fbfcfd'); g.addColorStop(1, '#d7dee5');
    ctx.fillStyle = g; rr(ctx, -26, -7, 52, 14, 7); ctx.fill(); ctx.strokeStyle = 'rgba(70,88,106,.6)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = '#c3ccd5'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(70,88,106,.5)'; ctx.stroke();
    ctx.restore();
  }
  // 거름망 국자: 손잡이 + 둥근 그물. 원점은 그물 가운데
  function ladle(ctx, x, y, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.strokeStyle = '#7d8894'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(34, -6); ctx.lineTo(150, -120); ctx.stroke();
    ctx.strokeStyle = '#c8d0d8'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(34, -7); ctx.lineTo(150, -121); ctx.stroke();
    ctx.fillStyle = '#3a434d'; rr(ctx, 136, -134, 34, 14, 6); ctx.save(); ctx.translate(150, -122); ctx.rotate(-Math.PI / 4); rr(ctx, -10, -6, 36, 12, 6); ctx.fill(); ctx.restore();
    // 그물 그릇(반원)
    ctx.beginPath(); ctx.moveTo(-36, -4); ctx.quadraticCurveTo(-34, 26, 0, 28); ctx.quadraticCurveTo(34, 26, 36, -4); ctx.closePath();
    ctx.fillStyle = 'rgba(200,210,220,.35)'; ctx.fill();
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(110,125,140,.55)'; ctx.lineWidth = 0.8;
    for (let i = -40; i <= 40; i += 6) { ctx.beginPath(); ctx.moveTo(i, -6); ctx.lineTo(i + 12, 30); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i, -6); ctx.lineTo(i - 12, 30); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = '#6b7783'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-36, -4); ctx.quadraticCurveTo(-34, 26, 0, 28); ctx.quadraticCurveTo(34, 26, 36, -4); ctx.stroke();
    ctx.strokeStyle = '#8b96a1'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -4, 36, 6, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  function ice(ctx, cx, top, t, front, inside) {
    ICES.forEach((c) => {
      if (!!c.front !== front) return;
      if (inside && !front && Math.abs(c.x) < 92) return;
      const y = top + c.dy + Math.sin(t * 0.9 + c.p) * 1.2;
      ctx.save(); ctx.translate(cx + c.x, y); ctx.rotate(c.a);
      rr(ctx, -c.s / 2, -c.s * 0.42, c.s, c.s * 0.84, 6);
      const g = ctx.createLinearGradient(-c.s / 2, -c.s / 2, c.s / 2, c.s / 2); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.6, 'rgba(232,242,250,.85)'); g.addColorStop(1, 'rgba(196,218,236,.85)');
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(140,165,188,.55)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    });
  }
  const ICES = [{ x: -118, s: 28, a: 0.2, dy: 4, p: 0 }, { x: -96, s: 24, a: -0.3, dy: 10, p: 1 }, { x: 116, s: 28, a: 0.4, dy: 5, p: 2 }, { x: 94, s: 22, a: -0.1, dy: 12, p: 3 }, { x: -120, s: 22, a: 0.6, dy: 34, p: 4, front: true }, { x: 118, s: 22, a: -0.5, dy: 38, p: 5, front: true }, { x: -40, s: 26, a: 0.1, dy: 3, p: 6 }, { x: 36, s: 24, a: -0.4, dy: 6, p: 7 }];

  /* =================================================================
     4. 실험대
     ================================================================= */
  function lab(host, o = {}) {
    const W = 1000, H = 560, S = surface(host, W, H), ov = overlay(S), ctx = S.ctx, TW = tweens();
    const TY = 516, HOME = { x: 330, y: TY }, SX = 742, ROD = 590;
    const labels = o.labels !== false, SP = o.speed || 1;
    const R = rng(3);
    // 기구 자리
    const FIL = { MY: 206, MHW: 80, CY: 300, STY: 382, ring: 234 };            // 거름 장치 (깔때기 축 x = SX)
    const SEPK = 0.5, SEPY = 90;                                               // 분별 깔때기: 크기, 위치(깔때기 좌표 0이 화면 SEPY)
    const sepW = (y) => SEPY + y * SEPK;
    const st = {
      tool: 'filter', work: null, wv: null, wx: { x: HOME.x, y: TY, a: 0, s: 1 }, workShow: true,
      prods: [], parts: [], drops: [], t: 0, busy: false,
      pit: { x: SX + 40, y: TY, a: 0, vol: 1, hot: false },
      fil: { w: 0, oil: 0, wet: 0, dep: null, recv: null, cu: 0, paperUp: 0, paperShow: true },
      sep: { w: 0, oil: 0, cu: 0, cock: 0, A: null, B: null, X: { x: SX, y: sepW(MOUTH), a: 0 } },
      heat: { on: 0, dish: null, splat: [] },
      lad: { x: SX - 6, y: TY - 52, a: 0.05, carry: 0 }, ladB: null,
      cool: false, temp: null,
    };
    const api = { busy: false, onDone: null };
    function setWork(c) { st.work = c; st.wv = c ? viewOf(c) : null; st.wx = { x: HOME.x, y: TY, a: 0, s: 1 }; st.workShow = !!c; }
    function setTool(t) { if (st.busy) return; st.tool = t; st.pit.hot = t === 'hot'; }
    const seq = (list, done) => { let i = 0; const next = () => { if (i >= list.length) { done && done(); return; } const s = list[i++]; if (typeof s === 'function') s(next); else TW.add(s[0] / SP, s[1], next); }; next(); };
    const until = (fn) => (next) => { const f = () => (fn() ? next() : setTimeout(f, 60)); f(); };
    const lipLocal = (s) => [(BW / 2 + 2) * s, -BH * s];
    function poseFor(lip, a, s) { const [lx, ly] = lipLocal(s), c = Math.cos(a), si = Math.sin(a); return { x: lip[0] - (lx * c - ly * si), y: lip[1] - (lx * si + ly * c) }; }
    const lipW = (X) => { const [lx, ly] = lipLocal(X.s || 1), c = Math.cos(X.a), s = Math.sin(X.a); return [X.x + lx * c - ly * s, X.y + lx * s + ly * c]; };
    // 그릇을 기울여 따르기: 위층부터 나감. 남은 양(물·기름)을 돌려줌
    function remain(v0, k) { const tw = v0.w, to = v0.oil, tot = tw + to, rem = tot * (1 - k); return { w: Math.min(tw, rem), oil: Math.max(0, rem - tw) }; }
    // 흐름 속 고체(구슬·알갱이)를 날려 보냄
    function fling(from, to, item, dur, land) {
      const p = { item, x0: from[0], y0: from[1], x1: to[0], y1: to[1], t: 0, dur: reduce ? 0.01 : dur / SP, rot: R() * TAU, land, jit: (R() - 0.5) * 16 };
      st.parts.push(p);
    }
    function moveWork(to, dur, ez = ease) { const a = Object.assign({}, st.wx); return [dur, (k) => { const e = ez(k); st.wx.x = lerp(a.x, to.x, e); st.wx.y = lerp(a.y, to.y, e); st.wx.a = lerp(a.a, to.a == null ? a.a : to.a, e); st.wx.s = lerp(a.s, to.s == null ? a.s : to.s, e); }]; }
    // 따를 자리로: 낮게 들어 올린 뒤, 옮기면서 기울임(그릇 위가 화면 밖으로 나가지 않게)
    function approach(pose, aP) { return [moveWork({ x: HOME.x + 50, y: TY - 140, a: 0.08 }, 0.7), moveWork({ x: pose.x, y: pose.y, a: aP }, 1.5)]; }
    function retreat(pose) { return moveWork({ x: pose.x - 90, y: TY - 120, a: 0 }, 1.0); }
    function exitLeft() { return (next) => { const a = st.wx.x; TW.add(0.7 / SP, (k) => (st.wx.x = lerp(a, -170, eIn(k))), () => { st.workShow = false; next(); }); }; }

    /* --- 결과 나눠 놓기: 남은 혼합물은 실험대 가운데로, 다 나뉜 것은 선반으로 --- */
    function finish(res, spots, cb) {
      // spots: outs와 같은 순서의 지금 위치 {x,y,s}
      const outs = res.outs, mi = res.main;
      st.prods = outs.map((c, i) => ({ c, v: viewOf(c), X: Object.assign({ a: 0 }, spots[i]), main: i === mi, gone: false }));
      st.workShow = false;
      const ps = st.prods;
      seq([[st.tool === 'heat' || st.tool === 'filter' ? 1.3 : 0.5, () => {}], [0.9, (k) => {
        const e = ease(k);
        ps.forEach((p) => {
          if (!p.from) p.from = Object.assign({}, p.X);
          if (p.main) { p.X.x = lerp(p.from.x, HOME.x, e); p.X.y = lerp(p.from.y, TY, e) - Math.sin(Math.PI * e) * 40; p.X.s = lerp(p.from.s, 1, e); }
          else { p.X.x = lerp(p.from.x, p.from.x + 30, e); p.X.y = lerp(p.from.y, H + 150, eIn(k)); p.X.s = lerp(p.from.s, p.from.s * 0.7, e); }
        });
      }]], () => {
        st.prods = [];
        if (mi >= 0) { setWork(outs[mi]); } else { st.work = null; st.workShow = false; }
        st.busy = false; api.busy = false; cb && cb();
      });
    }

    /* --- 동작 실행 --- */
    function runTool(cb) {
      if (st.busy || !st.work) return null;
      const c = st.work, t = st.tool, res = run(t, c);
      if (!res.ok) { cb && cb(res); return res; }
      st.busy = true; api.busy = true;
      const done = (spots) => finish(res, spots, () => cb && cb(res));
      ANIM[t](c, res, done);
      return res;
    }
    const ANIM = {
      water(c, res, done) { pour(c, res, done, false); },
      hot(c, res, done) { pour(c, res, done, true); },
      filter(c, res, done) {
        const v0 = Object.assign({}, st.wv), wv = st.wv, F = st.fil;
        F.w = 0; F.oil = 0; F.wet = 0; F.inW = 0; F.inO = 0; F.cu = wv.cu; F.dep = { vessel: 'paper', solid: { salt: 0, boric: 0, cuso4: 0 }, beads: { pet: 0, iron: 0, wood: 0 } }; F.recv = { vessel: 'beaker', w: 0, oil: 0, T: c.T, solid: {}, beads: {}, cu: wv.cu, float: 1, vol: 1 }; F.paperUp = 0; F.paperShow = true;
        const aP = 1.22, lip = [SX - 62, FIL.MY - 30], pose = poseFor(lip, aP, 1);
        const sol0 = Object.assign({}, wv.solid), bd0 = Object.assign({}, wv.beads);
        const tot = v0.w + v0.oil;
        const sendSolids = (frac0, frac1, k) => {
          // 고체는 따르는 동안 조금씩, 뜬 구슬은 먼저, 가라앉은 것은 나중에
          const f = clamp((k - frac0) / (frac1 - frac0), 0, 1);
          BEADS.forEach((b) => {
            const early = b === 'wood' && wv.float > 0.5, ff = early ? clamp(k / 0.35, 0, 1) : f;
            const want = Math.round(bd0[b] * ff);
            while (bd0[b] - wv.beads[b] < want) { wv.beads[b]--; fling(lipW(st.wx), [SX - 20 + (R() - 0.5) * 30, FIL.CY - 30], { bead: b }, 0.55, () => F.dep.beads[b]++); }
          });
          SOLS.forEach((s) => { if (!sol0[s]) return; const target = sol0[s] * (1 - f); if (wv.solid[s] - target > 0.25 || (f >= 1 && wv.solid[s] > 0)) { const d = Math.min(wv.solid[s], Math.max(0.25, wv.solid[s] - target)); wv.solid[s] -= d; fling(lipW(st.wx), [SX - 10 + (R() - 0.5) * 20, FIL.CY - 20], { grain: s }, 0.5, () => (F.dep.solid[s] += d)); } });
        };
        seq([
          ...approach(pose, aP),
          [3.4, (k) => {
            st.pourOn = true;
            const r = remain(v0, k); wv.w = r.w; wv.oil = r.oil;
            const pourOilFirst = v0.oil - r.oil, pourW = v0.w - r.w;
            F.inW = pourW; F.inO = pourOilFirst;
            sendSolids(0.55, 1, k);
            if (k >= 1) st.pourOn = false;
          }],
          retreat(pose),
          exitLeft(),
          until(() => F.w + F.oil < 0.5 && F.inW + F.inO >= v0.w + v0.oil - 0.5 && !st.parts.length),
          [0.8, (k) => (F.paperUp = ease(k))],
        ], () => { F.paperShow = false; F.recv = null; F.dep = null; F.inW = 0; F.inO = 0; done(res.outs.map((oc) => (oc.vessel === 'paper' ? { x: SX + 20, y: FIL.MY - 40, s: 0.8 } : { x: SX, y: TY, s: 0.74 }))); });
      },
      funnel(c, res, done) {
        const v0 = Object.assign({}, st.wv), wv = st.wv, P = st.sep;
        P.w = 0; P.oil = 0; P.cu = wv.cu; P.cock = 0; P.A = { vessel: 'beaker', w: 0, oil: 0, T: c.T, solid: {}, beads: {}, cu: wv.cu, vol: 1 }; P.B = { vessel: 'beaker', w: 0, oil: 0, solid: {}, beads: {}, vol: 1 };
        P.X = { x: SX, y: sepW(MOUTH), a: 0 };
        const aP = 1.1, lip = [SX - 16, sepW(MOUTH) - 20], pose = poseFor(lip, aP, 1), tot = v0.w + v0.oil;
        const BX = 905;
        seq([
          ...approach(pose, aP),
          [2.6, (k) => { st.pourOn = true; const r = remain(v0, k); wv.w = r.w; wv.oil = r.oil; P.oil = v0.oil - r.oil; P.w = v0.w - r.w; P.mixK = 1; if (k >= 1) st.pourOn = false; }],
          retreat(pose),
          exitLeft(),
          [1.0, (k) => (P.mixK = 1 - k)],
          [0.4, (k) => (P.cock = ease(k))],
          [2.4, (k) => { const left = v0.w * (1 - k); P.A.w = v0.w - left; P.w = left; P.drain = k < 1; }],
          [0.4, (k) => (P.cock = 1 - ease(k))],
          // 위층: 깔때기를 링에서 들어 입구로 비커에 따르기
          [0.8, (k) => { const e = ease(k); P.X.y = lerp(sepW(MOUTH), sepW(MOUTH) - 50, e); }],
          [0.9, (k) => { const e = ease(k); P.X.x = lerp(SX, BX - 60, e); P.X.y = lerp(sepW(MOUTH) - 50, TY - 210, e); P.X.a = lerp(0, 1.0, e); }],
          [0.7, (k) => { P.X.a = lerp(1.0, 1.95, ease(k)); P.X.x = lerp(BX - 60, BX - 30, ease(k)); }],
          [2.0, (k) => { P.oil = v0.oil * (1 - k); P.B.oil = v0.oil * k; P.upPour = k < 1; }],
          [0.7, (k) => { P.X.a = lerp(1.95, 1.0, ease(k)); P.X.x = lerp(BX - 30, BX - 60, ease(k)); }],
          [0.9, (k) => { const e = ease(k); P.X.x = lerp(BX - 60, SX, e); P.X.y = lerp(TY - 210, sepW(MOUTH), e); P.X.a = lerp(1.0, 0, e); }],
        ], () => {
          const sp = res.outs.map((oc) => (oc.oil > 0.01 && oc.w <= 0.01 ? { x: BX, y: TY, s: 0.7 } : { x: SX, y: TY, s: 0.7 }));
          P.A = null; P.B = null; done(sp);
        });
      },
      skim(c, res, done) {
        const wv = st.wv, L = st.lad, n = wv.beads.wood;
        const top = TY - 7 - (wv.w + wv.oil) * KW;
        const L0 = { x: L.x, y: L.y, a: L.a };
        st.ladB = { vessel: 'beaker', w: 0, oil: 0, solid: {}, beads: { wood: 0 }, vol: 1 };
        const mv = (to, dur) => { const a = { x: L.x, y: L.y, a: L.a }; return [dur, (k) => { const e = ease(k); L.x = lerp(a.x, to.x, e); L.y = lerp(a.y, to.y, e); L.a = lerp(a.a, to.a, e); }]; };
        seq([
          mv({ x: SX - 40, y: TY - 300, a: 0 }, 0.8),
          mv({ x: HOME.x, y: top - 60, a: 0 }, 1.0),
          mv({ x: HOME.x, y: top + 12, a: 0 }, 0.6),
          (next) => { wv.beads.wood = 0; L.carry = n; next(); },
          [0.3, () => {}],
          mv({ x: HOME.x + 10, y: top - 90, a: 0 }, 0.7),
          mv({ x: SX, y: TY - 230, a: 0 }, 1.0),
          [0.5, (k) => (L.a = lerp(0, -1.1, ease(k)))],
          (next) => { const k0 = L.carry; for (let i = 0; i < k0; i++) setTimeout(() => { L.carry--; fling([L.x - 10, L.y + 4], [SX + (R() - 0.5) * 60, TY - 20], { bead: 'wood' }, 0.5, () => st.ladB.beads.wood++); }, reduce ? 0 : i * 90 / SP); next(); },
          until(() => L.carry <= 0 && !st.parts.length),
          [0.4, (k) => (L.a = lerp(-1.1, 0, ease(k)))],
          mv(L0, 1.0),
        ], () => { const b = st.ladB; st.ladB = null; done(res.outs.map((oc) => (pureOf(oc) === 'wood' ? { x: SX, y: TY, s: 0.74 } : { x: HOME.x, y: TY, s: 1 }))); });
        // 남은 그릇은 가운데 그대로: done 전에 work를 숨기지 않음
      },
      cool(c, res, done) {
        const wv = st.wv, T0 = c.T;
        seq([
          moveWork({ x: HOME.x + 60, y: TY - 270, a: 0 }, 0.9),
          moveWork({ x: SX, y: TY - 270, a: 0 }, 0.9),
          moveWork({ x: SX, y: TY - 12, a: 0 }, 0.8),
          [3.6, (k) => {
            st.cool = true; const T = lerp(T0, 10, 1 - Math.pow(1 - k, 2)); wv.T = T; st.temp = T;
            const tmp = clone(c, { T });
            // 새로 석출된 알갱이는 용액 곳곳에서 생겨 가라앉고, 바닥 무더기는 조금 늦게 쌓임
            SOLS.forEach((s) => { const want = sol(tmp, s), had = wv.solid[s] || 0; if (want > had + 0.01) { const d = (want - had) * (k >= 1 ? 1 : 0.12); wv.solid[s] = had + d; if (R() < d * 3) spawnFlakes(s); } });
            if (k >= 1) st.cool = false;
          }],
          until(() => !st.parts.length),
          moveWork({ x: SX, y: TY - 270, a: 0 }, 0.8),
          moveWork({ x: HOME.x + 60, y: TY - 270, a: 0 }, 0.9),
          moveWork({ x: HOME.x, y: TY, a: 0 }, 0.8),
        ], () => { st.temp = null; done([{ x: HOME.x, y: TY, s: 1 }]); });
      },
      heat(c, res, done) {
        const v0 = Object.assign({}, st.wv), wv = st.wv, Hh = st.heat;
        Hh.dish = { vessel: 'dish', w: 0, oil: 0, T: c.T, solid: { salt: 0, boric: 0, cuso4: 0 }, beads: { pet: 0, iron: 0, wood: 0 }, cu: wv.cu, ref: v0.w, float: 1, vol: 1 };
        const D = Hh.dish, aP = 1.15, lip = [SX - 70, TY - 150], pose = poseFor(lip, aP, 1), tot = v0.w + v0.oil;
        const sol0 = Object.assign({}, wv.solid), bd0 = Object.assign({}, wv.beads);
        seq([
          ...approach(pose, aP),
          [2.2, (k) => {
            st.pourOn = true; const r = remain(v0, k); wv.w = r.w; wv.oil = r.oil; D.w = v0.w - r.w; D.oil = v0.oil - r.oil;
            BEADS.forEach((b) => { const want = Math.round(bd0[b] * clamp((k - 0.5) / 0.5, 0, 1)); while (bd0[b] - wv.beads[b] < want) { wv.beads[b]--; fling(lipW(st.wx), [SX + (R() - 0.5) * 80, TY - 82], { bead: b }, 0.45, () => D.beads[b]++); } });
            SOLS.forEach((s) => { if (sol0[s] && k > 0.6) { const d = wv.solid[s]; if (d > 0) { wv.solid[s] = 0; fling(lipW(st.wx), [SX, TY - 82], { grain: s }, 0.45, () => (D.solid[s] += d)); } } });
            if (k >= 1) st.pourOn = false;
          }],
          retreat(pose),
          exitLeft(),
          until(() => !st.parts.length),
          (next) => { D.s0 = Object.assign({}, D.solid); next(); },
          [0.6, (k) => (Hh.on = k)],
          [4.6, (k) => {
            const e = eIn(k) * 0.35 + k * 0.65; D.w = v0.w * (1 - e); D.T = 100;
            const tmp = clone(c, { w: D.w, T: 80 }); SOLS.forEach((s) => (D.solid[s] = Math.max(D.s0[s] || 0, sol(tmp, s))));
            D.cu = D.w > 0.5 ? clamp(dis(tmp, 'cuso4') / Math.max(1, D.w) * 100 / 30, 0, 1) : 0;
            if (k >= 1) { D.w = 0; SOLS.forEach((s) => (D.solid[s] = c.amt[s])); }
          }],
          [0.6, (k) => (Hh.on = 1 - k)],
        ], () => { const sp = res.outs.map(() => ({ x: SX, y: TY - 70, s: 1.15 })); Hh.dish = null; done(sp); });
      },
    };
    function spawnFlakes(s) {
      // 녹아 있던 물질이 석출: 용액 곳곳에서 알갱이가 생겨 바닥으로 가라앉는 모습(그리기용)
      st.flk = st.flk || []; if (st.flk.length > 40) return;
      st.flk.push({ s, x: (R() * 2 - 1) * 64, y: -7 - (st.wv.w * KW) * (0.2 + R() * 0.75), vy: 0, a: R() * TAU });
    }
    function pour(c, res, done, hot) {
      const wv = st.wv, P = st.pit, out = res.outs[0], v1 = viewOf(out), sol0 = Object.assign({}, wv.solid), w0 = wv.w, T0 = wv.T, f0 = wv.float;
      P.hot = hot; P.vol = 1;
      const top0 = TY - BH - 6, lip = [HOME.x + 78, top0 - 24], aP = 1.2, s = 0.74, pose = (() => { const [lx, ly] = [(BW / 2 + 2) * s, -BH * s], cc = Math.cos(aP), si = Math.sin(aP); return { x: lip[0] - (lx * cc - ly * si), y: lip[1] - (lx * si + ly * cc) }; })();
      const pv = (to, dur) => { const a = { x: P.x, y: P.y, a: P.a }; return [dur, (k) => { const e = ease(k); P.x = lerp(a.x, to.x, e); P.y = lerp(a.y, to.y, e); P.a = lerp(a.a, to.a, e); }]; };
      const home = { x: P.x, y: P.y, a: 0 };
      const needStir = SOLS.some((k) => Math.abs((sol0[k] || 0) - (v1.solid[k] || 0)) > 0.05);
      seq([
        pv({ x: pose.x + 30, y: pose.y - 40, a: 0.4 }, 0.9),
        pv({ x: pose.x, y: pose.y, a: aP }, 0.6),
        [2.0, (k) => {
          st.pitOn = k < 1; P.vol = 1 - k; wv.vessel = 'beaker'; wv.w = w0 + 100 * k; wv.T = w0 > 0.01 ? (w0 * T0 + 100 * k * (hot ? 70 : 20)) / (w0 + 100 * k) : (hot ? 70 : 20);
          wv.float = Math.max(f0, clamp(k * 2, 0, 1));
          wv.cu = lerp(st.wv.cu || 0, v1.cu, k * 0.6);
          if (!needStir) SOLS.forEach((q) => (wv.solid[q] = lerp(sol0[q] || 0, v1.solid[q] || 0, k)));
        }],
        pv({ x: home.x, y: home.y - 30, a: 0 }, 0.8),
        [0.4, (k) => { P.y = lerp(home.y - 30, home.y, ease(k)); P.vol = k; }],
        (next) => { if (!needStir) return next(); wv.rod = 0.001; seq([[2.2, (k) => { wv.rod = Math.min(1, k * 4, (1 - k) * 4 + 0.01); wv.rodT = k * 16; SOLS.forEach((q) => (wv.solid[q] = lerp(sol0[q] || 0, v1.solid[q] || 0, ease(k)))); wv.cu = lerp(wv.cu, v1.cu, k); }]], () => { wv.rod = 0; next(); }); },
      ], () => done([{ x: HOME.x, y: TY, s: 1 }]));
    }

    /* --- 매 장면 --- */
    function step(dt) {
      st.t += dt; TW.step(dt);
      // 날아가는 고체
      st.parts = st.parts.filter((p) => { p.t += dt; const k = Math.min(1, p.t / p.dur); if (k >= 1) { p.land && p.land(); return false; } return true; });
      // 거름 장치: 깔때기 → 비커 (아래층부터 빠짐, 빠르기는 정한 값)
      const F = st.fil;
      if (st.tool === 'filter' && F.recv) {
        const inW = F.inW || 0, inO = F.inO || 0, gotW = F.recv.w, gotO = F.recv.oil;
        F.w = Math.max(0, inW - gotW); F.oil = Math.max(0, inO - gotO);
        const rate = 46 * dt * SP;
        if (F.w > 0) { F.recv.w = Math.min(inW, gotW + rate); }
        else if (F.oil > 0) { F.recv.oil = Math.min(inO, gotO + rate * 0.6); }
        if (F.w + F.oil > 0.2) { F.wet = Math.min(1, F.wet + dt * 2); st.dropT = (st.dropT || 0) + dt * 9; while (st.dropT > 1) { st.dropT -= 1; st.drops.push({ x: SX - 1, y: FIL.STY, vy: 60, c: F.w > 0 ? 'w' : 'o' }); } }
      }
      const recvTop = TY - 7 * 0.74 - ((F.recv ? F.recv.w + F.recv.oil : 0) * KW) * 0.74;
      st.drops = st.drops.filter((d) => { d.vy += 900 * dt; d.y += d.vy * dt; return d.y < recvTop; });
      // 석출 알갱이 가라앉기
      if (st.flk) st.flk = st.flk.filter((f) => { f.vy = Math.min(60, f.vy + 90 * dt); f.y += f.vy * dt; f.a += dt; return f.y < -12; });
      // 핫플레이트: 기름 튀김
      const Hh = st.heat;
      if (Hh.dish && Hh.on > 0.5 && Hh.dish.oil > 0.01 && Hh.dish.w > 1 && R() < dt * 6) Hh.splat.push({ x: SX + (R() - 0.5) * 120, y: TY - 112, vx: (R() - 0.5) * 120, vy: -150 - R() * 80, t: 0 });
      Hh.splat = Hh.splat.filter((p) => { p.t += dt; p.vy += 600 * dt; p.x += p.vx * dt; p.y += p.vy * dt; return p.t < 0.6; });
      draw();
    }

    function draw() {
      S.begin(); const [fx, fy, fw, fh] = S.full();
      ctx.fillStyle = '#fff'; ctx.fillRect(fx, fy, fw, fh);
      let g = ctx.createLinearGradient(0, TY, 0, TY + 60); g.addColorStop(0, '#eef2f6'); g.addColorStop(1, '#f8fafc');
      ctx.fillStyle = g; ctx.fillRect(fx, TY, fw, fh); ctx.fillStyle = '#d9e1e9'; ctx.fillRect(fx, TY, fw, 1.2);
      ov.hideAll();
      const t = st.tool;
      // 기구(뒤)
      if (t === 'filter') drawFilterBack();
      if (t === 'funnel') drawSepBack();
      if (t === 'cool') drawIceBack();
      if (t === 'heat') { hotplate(ctx, SX, TY - 70, st.heat.on); }
      // 가운데 그릇
      let info = null;
      const inIce = t === 'cool' && st.wx.y > TY - 120;
      if (st.work && st.workShow && st.wv) info = drawVessel(ctx, st.wv, st.wx, { lifted: st.wx.y < TY - 2, inside: (top) => drawFlakes(top), noSteam: inIce });
      if (t === 'cool') drawIceFront();
      // 결과 그릇
      st.prods.forEach((p) => drawVessel(ctx, p.v, p.X, { lifted: p.X.y < TY - 2 }));
      // 기구(앞)
      if (t === 'filter') drawFilterFront();
      if (t === 'funnel') drawSepFront();
      if (t === 'heat') drawHeat();
      if (t === 'water' || t === 'hot') drawPitcher();
      if (t === 'skim') drawSkim();
      // 따르는 줄기
      if (st.pourOn && st.wv) drawStream();
      // 날아가는 고체
      st.parts.forEach((p) => {
        const k = Math.min(1, p.t / p.dur), x = lerp(p.x0, p.x1, k) + Math.sin(k * Math.PI) * p.jit, y = p.y0 + (p.y1 - p.y0) * eIn(k) - Math.sin(k * Math.PI) * 10;
        if (p.item.bead) bead(ctx, p.item.bead, x, y, 9 * (st.tool === 'heat' || st.tool === 'skim' ? 1 : 0.85), p.rot + k * 4); else for (let i = 0; i < 4; i++) grain(ctx, p.item.grain, x + (i - 1.5) * 4, y + (i % 2) * 3, 2.6, p.rot + i, 0.8);
      });
      if (labels) drawLabels(info);
    }
    function drawFlakes(top) {
      if (!st.flk || !st.flk.length || !st.wv) return;
      ctx.save(); ctx.translate(st.wx.x, st.wx.y); ctx.scale(st.wx.s, st.wx.s);
      st.flk.forEach((f) => grain(ctx, f.s, f.x, f.y, 2.6, f.a, 0.8));
      ctx.restore();
    }
    function drawStream() {
      const v = st.wv, [lx, ly] = lipW(st.wx), t = st.tool;
      if (v.w + v.oil <= 0.3) return;
      let tx, tyy;
      if (t === 'filter') { tx = SX - 34; tyy = FIL.CY - 24; }
      else if (t === 'funnel') { tx = SX - 6; tyy = sepW(200); }
      else { tx = SX - 46; tyy = TY - 96; }
      const col = v.oil > 0.05 ? OIL : waterCol(v), wdt = 4 + 5 * Math.min(1, (v.w + v.oil) / 60);
      ctx.save(); ctx.strokeStyle = rgba(col, 0.82); ctx.lineWidth = wdt; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(lx, ly + 2); ctx.quadraticCurveTo(lx + 16, ly + 8, tx, tyy); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(lx - 1, ly + 3); ctx.quadraticCurveTo(lx + 14, ly + 8, tx - 2, tyy); ctx.stroke();
      ctx.restore();
    }
    /* 거름 장치 */
    const hwF = (y) => (y <= FIL.MY ? FIL.MHW : y >= FIL.CY ? 7 : lerp(FIL.MHW, 7, (y - FIL.MY) / (FIL.CY - FIL.MY)));
    function drawFilterBack() {
      standBase(ctx, ROD - 30, SX + 70, ROD, 70, TY);
      arm(ctx, ROD, FIL.ring, SX - 62);
      ring(ctx, SX, FIL.ring, 66, false);
      const F = st.fil;
      drawVessel(ctx, F.recv || { vessel: 'beaker', w: 0, oil: 0, solid: {}, beads: {}, vol: 1 }, { x: SX, y: TY, s: 0.74 });
      st.drops.forEach((d) => { ctx.fillStyle = d.c === 'o' ? rgba(OIL, 0.9) : rgba(mixC(WATER, CUSO, F.cu || 0), 0.9); ctx.beginPath(); ctx.ellipse(d.x, d.y, 2.4, 3.2, 0, 0, TAU); ctx.fill(); });
    }
    function drawFilterFront() {
      const F = st.fil, MY = FIL.MY, CY = FIL.CY;
      // 유리 원뿔 뒤
      ctx.save(); ctx.beginPath(); ctx.moveTo(SX - FIL.MHW, MY); ctx.lineTo(SX - 7, CY); ctx.lineTo(SX + 7, CY); ctx.lineTo(SX + FIL.MHW, MY); ctx.closePath(); ctx.fillStyle = 'rgba(236,242,247,.5)'; ctx.fill(); ctx.restore();
      // 거름종이 + 그 위 고체 (끝나면 위로 들어 올림)
      const up = F.paperUp * 70;
      if (F.paperShow) {
        ctx.save(); ctx.translate(0, -up);
        const PY = MY + 8, phw = (y) => hwF(y) - 3, tip = CY - 8;
        ctx.beginPath(); ctx.moveTo(SX - phw(PY), PY); ctx.lineTo(SX, tip); ctx.lineTo(SX + phw(PY), PY); ctx.closePath();
        g2(ctx, F.wet);
        ctx.strokeStyle = 'rgba(150,160,170,.55)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(SX + phw(PY) * 0.15, PY); ctx.lineTo(SX, tip); ctx.strokeStyle = 'rgba(150,160,170,.45)'; ctx.stroke();
        // 깔때기 속 액체
        const tot = F.w + F.oil;
        if (tot > 0.3 && !F.paperUp) {
          const k = clamp(tot / 90, 0, 1), lev = lerp(tip - 8, MY + 26, Math.sqrt(k)), mid = F.oil > 0.3 && F.w > 0.3 ? lerp(tip - 8, MY + 26, Math.sqrt(clamp(F.w / 90, 0, 1))) : null;
          ctx.save(); ctx.beginPath(); ctx.moveTo(SX - phw(lev) + 2, lev); ctx.lineTo(SX, tip - 2); ctx.lineTo(SX + phw(lev) - 2, lev); ctx.closePath(); ctx.clip();
          if (F.w > 0.3) { ctx.fillStyle = rgba(mixC(WATER, CUSO, F.cu || 0), 0.72); ctx.fillRect(SX - 90, mid == null ? lev : mid, 180, 200); }
          if (F.oil > 0.3) { ctx.fillStyle = rgba(OIL, 0.82); ctx.fillRect(SX - 90, lev, 180, (mid == null ? tip : mid) - lev); }
          ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(SX - 90, lev); ctx.lineTo(SX + 90, lev); ctx.stroke();
          ctx.restore();
        }
        // 걸러진 고체
        const D = F.dep;
        if (D) {
          const N = SOLS.reduce((s, k) => s + (D.solid[k] || 0), 0);
          if (N > 0.05) { ctx.save(); ctx.translate(SX, tip - 3); const ph = pile(ctx, D.solid, 0, 0, 20); ctx.restore(); }
          const all = []; BEADS.forEach((b) => { for (let i = 0; i < D.beads[b]; i++) all.push(b); });
          let row = 0, i = 0; while (i < all.length) { const y = tip - 12 - N * 0.6 - row * 14, per = Math.max(1, Math.floor((2 * phw(y) - 6) / 18)); for (let j = 0; j < per && i < all.length; j++, i++) bead(ctx, all[i], SX + (j - (per - 1) / 2) * 18, y, 8.2, i); row++; }
        }
        ctx.restore();
      }
      // 유리 앞 + 다리
      ctx.save();
      ctx.beginPath(); ctx.moveTo(SX - FIL.MHW, MY); ctx.lineTo(SX - 7, CY); ctx.lineTo(SX + 7, CY); ctx.lineTo(SX + FIL.MHW, MY); ctx.strokeStyle = 'rgba(110,130,150,.72)'; ctx.lineWidth = 1.7; ctx.lineJoin = 'round'; ctx.stroke();
      const gg = ctx.createLinearGradient(SX - 6, 0, SX + 6, 0); gg.addColorStop(0, 'rgba(200,212,223,.85)'); gg.addColorStop(0.5, 'rgba(245,248,250,.9)'); gg.addColorStop(1, 'rgba(185,199,212,.85)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(SX - 6, CY); ctx.lineTo(SX - 5, FIL.STY - 8); ctx.lineTo(SX - 2, FIL.STY); ctx.lineTo(SX + 5, FIL.STY - 6); ctx.lineTo(SX + 6, CY); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(110,130,150,.65)'; ctx.lineWidth = 1.2; ctx.stroke();
      if (F.w + F.oil > 0.3) { ctx.fillStyle = F.w > 0.3 ? rgba(mixC(WATER, CUSO, F.cu || 0), 0.75) : rgba(OIL, 0.8); ctx.fillRect(SX - 2.5, CY, 5, FIL.STY - CY - 6); }
      ctx.strokeStyle = 'rgba(110,130,150,.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(SX, MY, FIL.MHW, 7, 0, 0, TAU); ctx.stroke();
      ctx.restore();
      ring(ctx, SX, FIL.ring, 66, true);
    }
    function g2(c2, wet) {
      const g = c2.createLinearGradient(SX - 80, 0, SX + 80, 0);
      g.addColorStop(0, rgba(mixC([250, 250, 247], [214, 232, 246], wet), 0.96)); g.addColorStop(0.55, rgba(mixC([255, 255, 253], [226, 239, 249], wet), 0.96)); g.addColorStop(1, rgba(mixC([236, 238, 236], [196, 220, 238], wet), 0.96));
      c2.fillStyle = g; c2.fill();
    }
    /* 분별 깔때기 */
    function sepX() { const P = st.sep.X; return { x: P.x, y: P.y, a: P.a }; }
    function sepToWorld(pts) {
      // 깔때기 좌표 → 화면: 입구(0, MOUTH)를 P.X에 두고 a만큼 돌림
      const P = st.sep.X, c = Math.cos(P.a), s = Math.sin(P.a);
      return pts.map(([x, y]) => { const lx = x * SEPK, ly = (y - MOUTH) * SEPK; return [P.x + lx * c - ly * s, P.y + lx * s + ly * c]; });
    }
    function drawSepBack() {
      const P = st.sep, onRing = P.X.a === 0 && Math.abs(P.X.x - SX) < 1;
      standBase(ctx, ROD - 30, SX + 70, ROD, 40, TY);
      const ry = sepW(330);
      arm(ctx, ROD, ry + 2, SX - 38);
      ring(ctx, SX, ry + 2, 38, false);
      drawVessel(ctx, P.A || { vessel: 'beaker', w: 0, oil: 0, solid: {}, beads: {}, vol: 1 }, { x: SX, y: TY, s: 0.7 });
      drawVessel(ctx, P.B || { vessel: 'beaker', w: 0, oil: 0, solid: {}, beads: {}, vol: 1 }, { x: 905, y: TY, s: 0.7 });
      // 꼭지에서 흐르는 물
      if (P.drain && P.cock > 0.5 && onRing) { ctx.save(); ctx.strokeStyle = rgba(mixC(WATER, CUSO, P.cu || 0), 0.85); ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(SX, sepW(TIP)); ctx.lineTo(SX, TY - 10 - (P.A.w * KW) * 0.7); ctx.stroke(); ctx.restore(); }
      st._sepOn = onRing;
    }
    function drawSepFront() {
      const P = st.sep;
      // 뒤 유리
      ctx.save(); const M = matSep(); ctx.setTransform(...M); sepOuter(ctx); ctx.fillStyle = 'rgba(236,242,247,.45)'; ctx.fill(); ctx.restore();
      // 액체 (기울어도 수면은 수평)
      const PW = sepToWorld(SPOLY), k2 = SEPK * SEPK, sc = 2 * BIN * KW;
      let Aw = P.w * sc, Ao = P.oil * sc; const capA = areaP(PW) * 0.92; const f = Math.min(1, capA / Math.max(1, (Aw + Ao)));
      Aw *= f; Ao *= f;
      if (Aw + Ao > 2) {
        const top = levelFor(PW, Aw + Ao), mid = Aw > 1 ? levelFor(PW, Aw) : null;
        ctx.save(); path(ctx, PW); ctx.clip();
        const minX = Math.min(...PW.map((p) => p[0])) - 2, maxX = Math.max(...PW.map((p) => p[0])) + 2, maxY = Math.max(...PW.map((p) => p[1])) + 2;
        const wc = mixC(WATER, CUSO, P.cu || 0);
        if (mid != null) { ctx.fillStyle = rgba(wc, 0.66); ctx.fillRect(minX, mid, maxX - minX, maxY - mid); }
        if (Ao > 1) { ctx.fillStyle = rgba(OIL, 0.8); ctx.fillRect(minX, top, maxX - minX, (mid == null ? maxY : mid) - top); }
        // 막 부었을 때: 콩기름 방울이 물속에 조금 흩어져 있다가 떠오름
        if ((P.mixK || 0) > 0.02 && mid != null) { const r2 = rng(9); ctx.fillStyle = rgba(OIL, 0.75 * P.mixK); for (let i = 0; i < 22; i++) { const x = lerp(minX + 12, maxX - 12, r2()), y = lerp(mid + 6, maxY - 20, r2()) - (1 - P.mixK) * 60; if (y > mid + 3) { ctx.beginPath(); ctx.arc(x, y, 2 + r2() * 2.5, 0, TAU); ctx.fill(); } } }
        if (mid != null && Ao > 1) { ctx.strokeStyle = rgba(shade(OIL, 0.62), 0.8); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(minX, mid); ctx.lineTo(maxX, mid); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(minX, top); ctx.lineTo(maxX, top); ctx.stroke();
        ctx.restore();
      }
      // 줄기 속 물(꼭지 아래)
      if (P.drain && P.cock > 0.5) { const a = sepToWorld([[0, CONE], [0, TIP]]); ctx.save(); ctx.strokeStyle = rgba(mixC(WATER, CUSO, P.cu || 0), 0.85); ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(a[0][0], a[0][1]); ctx.lineTo(a[1][0], a[1][1]); ctx.stroke(); ctx.restore(); }
      // 위층을 입구로 따를 때
      if (P.upPour) { const m = sepToWorld([[-20, MOUTH]])[0]; ctx.save(); ctx.strokeStyle = rgba(OIL, 0.88); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(m[0], m[1]); ctx.quadraticCurveTo(m[0] + 6, m[1] + 30, 905, TY - 12 - (P.B.oil * KW) * 0.7); ctx.stroke(); ctx.restore(); }
      ctx.save(); ctx.setTransform(...matSep()); sepFront(ctx, P.cock); ctx.restore();
      if (P.X.a === 0 && Math.abs(P.X.x - SX) < 1) ring(ctx, SX, sepW(330) + 2, 38, true);
    }
    function matSep() {
      const P = st.sep.X, m = S.m, k = m.dpr * m.k, c = Math.cos(P.a), s = Math.sin(P.a);
      // 화면 = P + R(a)·SEPK·(local - (0, MOUTH))
      const a = c * SEPK, b = s * SEPK, cc = -s * SEPK, d = c * SEPK, e = P.x - (cc * MOUTH), f = P.y - (d * MOUTH);
      return [a * k, b * k, cc * k, d * k, (e * k) + m.dpr * m.ox, (f * k) + m.dpr * m.oy];
    }
    /* 얼음물 */
    const IBW = 280, IBH = 236;
    function drawIceBack() {
      ctx.save(); ctx.translate(SX, TY); contact(ctx, 0, 2, IBW * 1.15, 0.14);
      rr(ctx, -IBW / 2, -IBH, IBW, IBH, 12); ctx.fillStyle = 'rgba(236,242,247,.55)'; ctx.fill();
      const top = -6 - 150, g = ctx.createLinearGradient(0, top, 0, 0); g.addColorStop(0, rgba(ICE, 0.78)); g.addColorStop(1, rgba([206, 224, 238], 0.86));
      ctx.fillStyle = g; rr(ctx, -IBW / 2 + 4, top, IBW - 8, 152, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-IBW / 2 + 5, top); ctx.lineTo(IBW / 2 - 5, top); ctx.stroke();
      ctx.restore();
      const inside = st.wx.x > SX - 40 && st.wx.x < SX + 40 && st.wx.y > TY - 120;
      ice(ctx, SX, TY - 156, st.t, false, inside);
    }
    function drawIceFront() {
      ctx.save(); ctx.translate(SX, TY);
      // 큰 비커 앞면
      const w = IBW, h = IBH, x0 = -w / 2;
      ctx.strokeStyle = 'rgba(110,130,150,.75)'; ctx.lineWidth = 1.7;
      ctx.beginPath(); ctx.moveTo(x0 - 6, -h - 3); ctx.quadraticCurveTo(x0, -h - 1, x0, -h + 9); ctx.lineTo(x0, -9); ctx.quadraticCurveTo(x0, 0, x0 + 9, 0); ctx.lineTo(-x0 - 9, 0); ctx.quadraticCurveTo(-x0, 0, -x0, -9); ctx.lineTo(-x0, -h); ctx.stroke();
      ctx.strokeStyle = 'rgba(110,130,150,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, -h, w / 2, 5, 0, 0, TAU); ctx.stroke();
      const inside = st.wx.x > SX - 40 && st.wx.x < SX + 40 && st.wx.y > TY - 120;
      if (inside) { const top = -6 - 150; ctx.fillStyle = rgba(ICE, 0.3); rr(ctx, -BW / 2 - 6, top, BW + 12, 150, 6); ctx.fill(); }
      ctx.restore();
      ice(ctx, SX, TY - 156, st.t, true, inside);
    }
    /* 핫플레이트 위 넓은 그릇 */
    function drawHeat() {
      const Hh = st.heat, D = Hh.dish || { vessel: 'dish', w: 0, oil: 0, solid: {}, beads: {}, vol: 1 };
      const X = { x: SX, y: TY - 70, s: 1.15 };
      const info = drawVessel(ctx, D, X, { noShadow: true, noSteam: true });
      if (Hh.dish && Hh.on > 0.2 && D.w > 0.5 && info && info.top != null) {
        // 끓는 거품
        const t = st.t; ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1;
        for (let i = 0; i < 14; i++) { const ph = (t * 1.6 + i * 0.37) % 1, x = SX + Math.sin(i * 12.9) * 70, y = lerp(TY - 76, info.top + 2, ph); ctx.beginPath(); ctx.arc(x, y, 1.5 + ph * 2.5, 0, TAU); ctx.stroke(); }
        ctx.restore();
        steam(ctx, SX, info.top - 10, 0.55 * Hh.on, 4, 40);
      }
      Hh.splat.forEach((p) => { ctx.fillStyle = rgba(OIL, 0.9); ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, TAU); ctx.fill(); });
    }
    /* 물 붓는 비커 */
    function drawPitcher() {
      const P = st.pit, v = { vessel: 'beaker', w: 100 * P.vol, oil: 0, T: P.hot ? 70 : 20, solid: {}, beads: {}, cu: 0, vol: 1 };
      drawVessel(ctx, v, { x: P.x, y: P.y, a: P.a, s: 0.74 }, { lifted: P.y < TY - 2 });
      if (st.pitOn) {
        const [lx, ly] = (() => { const s = 0.74, c = Math.cos(P.a), si = Math.sin(P.a), x = (BW / 2 + 2) * s, y = -BH * s; return [P.x + x * c - y * si, P.y + x * si + y * c]; })();
        const wv = st.wv, tyy = TY - 7 - (wv.w + wv.oil) * KW;
        ctx.save(); ctx.strokeStyle = rgba(WATER, 0.85); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lx, ly + 2); ctx.quadraticCurveTo(lx + 8, ly + 20, lx + 4, tyy); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(lx - 1, ly + 3); ctx.quadraticCurveTo(lx + 6, ly + 20, lx + 2, tyy); ctx.stroke(); ctx.restore();
      }
    }
    /* 거름망 국자 */
    function drawSkim() {
      const L = st.lad;
      drawVessel(ctx, st.ladB || { vessel: 'beaker', w: 0, oil: 0, solid: {}, beads: {}, vol: 1 }, { x: SX, y: TY, s: 0.74 });
      ladle(ctx, L.x, L.y, L.a);
      for (let i = 0; i < L.carry; i++) { const c = Math.cos(L.a), s = Math.sin(L.a), lx = (i - (L.carry - 1) / 2) * 13, ly = 12 - (i % 2) * 6; bead(ctx, 'wood', L.x + lx * c - ly * s, L.y + lx * s + ly * c, 8, i); }
    }

    /* --- 이름표 --- */
    function drawLabels(info) {
      const t = st.tool;
      // 기구 이름 (한 곳만, 얇게)
      const TN = { filter: '거름 장치', funnel: '분별 깔때기', cool: '얼음물', heat: '핫플레이트', water: '물 100 g', hot: '뜨거운 물 100 g (약 70 ℃)', skim: '거름망 국자' };
      const TX = { water: SX + 40, hot: SX + 40, funnel: SX + 80 };
      if (!st.busy && TN[t]) ov.put('tool', TX[t] || SX, TY + 24, TN[t], 'tx m');
      if (st.busy && st.temp != null) ov.put('temp', st.wx.x, st.wx.y - BH - 22, `<b>${Math.round(st.temp)} ℃</b>`, 'tx read');
      if (!st.work || !st.workShow) { if (!st.busy && !st.prods.length) ov.put('empty', HOME.x, TY - 120, st.hint || '선반에서 그릇을 골라<br>실험대에 올려요', 'tx big cen'); return; }
      if (st.busy || !info) return;
      // 가운데 그릇 속 물질 이름표 (왼쪽에 줄 맞춰)
      const c = st.work, v = st.wv, x = HOME.x, items = [];
      const yb = TY - 8;
      if (c.vessel === 'dish') {
        const ks = comps(c); if (ks.length) items.push([TY - 30, ks.map((k) => NAME[k]).join(', '), x - 60, TY - 30]);
      } else if (c.vessel === 'paper') {
        const ks = comps(c); if (ks.length) items.push([TY - 10, ks.map((k) => NAME[k]).join(', '), x - 50, TY - 6]);
      } else {
        if (v.oil > 0.01 && info.top != null) { const y = (info.top + (info.mid == null ? yb : info.mid)) / 2; items.push([y, '콩기름', x - 60, y]); }
        if (v.w > 0.01 && info.mid != null) {
          const dd = SOLS.filter((k) => dis(c, k) > 0.05);
          const y = (info.mid + yb - 20) / 2 - 6;
          items.push([y, dd.length ? `물 <span class="u">${names(dd)}${dd.length ? ' 녹아 있음' : ''}</span>` : '물', x - 60, y]);
        }
        const sk = SOLS.filter((k) => sol(c, k) > 0.05);
        if (sk.length) items.push([yb - 6, `${c.T <= 10.5 ? '석출된' : '녹지 않은'} ${names(sk)}`, x - 20, yb - 6]);
        ['pet', 'iron'].forEach((k, i) => { if (c.beads[k]) items.push([yb - 10 - i * 6, NAME[k], x - 50 + i * 30, yb - 10]); });
        if (c.beads.wood && info.top != null && liquid(c)) items.push([info.top - 4, '나무 구슬', x - 30, info.top - 2]);
        else if (c.beads.wood) items.push([yb - 12, '나무 구슬', x - 10, yb - 10]);
        if (c.T > 40 && c.w > 0.01) ov.put('wT', x, TY - BH - 18, `약 ${Math.round(c.T)} ℃`, 'tx m');
        else if (c.T < 15 && c.w > 0.01) ov.put('wT', x, TY - BH - 18, `${Math.round(c.T)} ℃`, 'tx m');
      }
      items.sort((p, q) => p[0] - q[0]);
      // 겹치지 않게 아래위로 밀기
      const gap = 30, top0 = TY - BH - 10; let prev = -Infinity;
      items.forEach((it) => { it.ly = Math.max(it[0], prev + gap, top0); prev = it.ly; });
      const over = prev - (TY - 4); if (over > 0) items.forEach((it) => (it.ly -= over));
      const LX = x - BW / 2 - 26;
      items.forEach((it, i) => { lead(ctx, [[LX + 4, it.ly], [x - BW / 2 + 4, it.ly], [it[2], it[3]]]); ov.put('w' + i, LX, it.ly, it[1], 'tx nm la'); });
    }

    addLoop(host, step);
    Object.assign(api, {
      setWork, setTool, runTool, setHint(h) { st.hint = h; }, get tool() { return st.tool; }, get work() { return st.work; }, st,
      // 검사·읽기용: 애니메이션 없이 바로 결과
      instant(tool) { if (!st.work) return null; const r = run(tool, st.work); if (r.ok) { st.tool = tool; setWork(r.main >= 0 ? r.outs[r.main] : null); } return r; },
    });
    return api;
  }

  /* ---- 선반 칸 그림 ---- */
  function thumb(cv, c, o = {}) {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const Wc = Math.max(10, r.width), Hc = Math.max(10, r.height);
    cv.width = Math.round(Wc * dpr); cv.height = Math.round(Hc * dpr);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, Wc, Hc);
    if (!c) return;
    const v = viewOf(c), k = v.vessel === 'beaker' ? Math.min(Hc / (BH + 30), Wc / (BW + 30)) : Math.min(Wc / 230, Hc / 90);
    drawVessel(ctx, v, { x: Wc / 2, y: Hc - 6, s: k }, { noSteam: true });
  }

  return { NAME, SOLS, BEADS, TOOL, PROP, PLAN_M, mk, clone, comps, pureOf, empty, label, sol, dis, solu, run, ops, dryRun, lab, thumb, jo, names };
})();
