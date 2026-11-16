/* ===== 분자와 이온 3D (MI3) — 2026-11-16 전면 수정 =====
   분자: 원소 수업 EL3(같은 폴더에 복사한 _el3.js)의 입자 색·크기와 PubChem 3D 좌표를 그대로 써요.
         염화 수소는 PubChem CID 313 3D 좌표(결합 길이 1.31 Å)를 더했어요. 교과서 153쪽처럼 원자끼리 겹친 공 모형이에요.
   이온: 원자의 구조 수업 AT3(같은 폴더에 복사한 _at3.js)의 원자 표현(하늘색 원자, 빨간 원자핵, 파란 전자 '−')을
         그대로 써서 교과서 그림 Ⅳ-11처럼 '간단히 나타낸 원자 모형'으로 그려요. 전자 껍질은 나누지 않아요.
   MI3.build(host)        분자 조립실: 원자 넣기 → 분자의 원자 수가 맞으면 실제 모양으로 결합, 분자 쪼개기, 모형 돌려 보기
   MI3.ion(host)          이온 만들기: 전자 떼어 내기(다른 원자로 이동) / 전자 받기(다른 원자에서 옴)
   MI3.still(host, k)     읽기 페이지 사진용 장면(_bake.py)
   크기·색·전자의 위치와 움직임은 개념 이해를 위해 정한 모형이에요. */
const MI3 = (() => {
  'use strict';
  const { V, makeStage, prepare, REDUCE } = C3;
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeO = (t) => 1 - Math.pow(1 - t, 3);
  const TS = () => (window.__TS || 1); // 검사용 느린 화면(연속 촬영)
  const mkR = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  /* ---------- 분자 자료 ---------- */
  EL3.MOL.HCl = [['Cl', 0, 0, 0], ['H', 1.306, 0, 0]]; // PubChem CID 313 (결합 길이만 씀)
  const NAME = { H2: '수소', O2: '산소', H2O: '물', CO: '일산화 탄소', CO2: '이산화 탄소', CH4: '메테인', NH3: '암모니아', HCl: '염화 수소' };
  const ATOMN = { H: '수소', C: '탄소', N: '질소', O: '산소', Cl: '염소', He: '헬륨' };
  const ORDER = ['C', 'N', 'O', 'H', 'Cl'];
  function counts(id) { const c = {}; EL3.MOL[id].forEach(([e]) => (c[e] = (c[e] || 0) + 1)); return c; }
  // 결합한 모습의 원자 자리(EL3.mol과 같은 방향)
  const POSE_FIX = { CH4: new THREE.Euler(.25, .6, 0), NH3: new THREE.Euler(0, 0, 0), CO2: new THREE.Euler(0, 0, 0), HCl: new THREE.Euler(0, 0, 0) };
  function slots(id) {
    const g = EL3.mol(id); g.updateMatrixWorld(true);
    const out = g.children.map((m) => ({ el: m.userData.el, p: m.position.clone().applyQuaternion(g.quaternion) }));
    if (id === 'HCl') { const c = out.reduce((s, o) => s.add(o.p), V()).multiplyScalar(1 / out.length); out.forEach((o) => o.p.sub(c)); }
    return out;
  }

  /* ---------- 공통 무대 ---------- */
  function stage(host, o = {}) {
    const st = makeStage(host, Object.assign({ top: '#ffffff', bottom: '#e8eff6', fov: 30, hold: true, fitWidth: true, minD: 4, maxD: 34, exposure: 1.0, sunX: -5, sunZ: 8 }, o));
    st.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    return st;
  }
  function floor(st, y, op = .13) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: op }));
    m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; st.scene.add(m); return m;
  }
  const _w = V(), _c = V(), _d = V(), _s = V();
  function placeSigns(root, camera) { // AT3과 같은 방법: '−' 부호를 카메라 쪽 겉면에
    camera.getWorldPosition(_c);
    root.traverse((o) => {
      const sp = o.userData && o.userData.sign; if (!sp) return;
      o.getWorldPosition(_w); o.getWorldScale(_s);
      _d.copy(_c).sub(_w).normalize().multiplyScalar(o.userData.r * _s.x * 1.04).add(_w);
      o.worldToLocal(_d); sp.position.copy(_d);
    });
  }
  function frameBox(w, h, d = 1) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial()); m.visible = false; return m; }
  const bez = (a, c, b, t, out) => out.set((1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y, (1 - t) * (1 - t) * a.z + 2 * (1 - t) * t * c.z + t * t * b.z);

  /* ===================== 1) 분자 조립실 ===================== */
  function build(host) {
    const st = stage(host);
    st.controls.enableZoom = false;
    const FLOOR_Y = -2.35; floor(st, FLOOR_Y);
    const R = new THREE.Group(); st.scene.add(R);
    const frame = frameBox(7.6, 4.6); frame.position.y = -.1; st.scene.add(frame);
    st.camera.position.set(0, 2.2, 14); st.controls.target.set(0, 0, 0);
    const dir = V(0, .2, 1);
    st.fit(frame, { dir, margin: 1.0 });
    const API = { st, target: null, mode: 'build', bonded: null, busy: false, onChange: null, onEvent: null, counts: {} };
    const atoms = [];
    let t0 = 0, spin = 0;
    const _bb = new THREE.Box3(), _bc = V();
    const hint = st.label('아래 원자 넣기 버튼을 눌러 원자를 넣어요', 'zl say', () => (API.mode === 'build' && API.target && !atoms.length ? V(0, .2, 0) : null));
    const nameLab = st.label('', 'zl big', () => { _bb.setFromObject(R); _bb.getCenter(_bc); return V(_bc.x, Math.max(FLOOR_Y + .45, _bb.min.y - .55), _bc.z); }); nameLab.show = false;

    function mkAtom(el) {
      const m = EL3.ball(el, 0, 0, 0); const a = { el, m, state: 'loose', p: V(), k: 0 };
      m.userData.atom = a; R.add(m);
      a.lab = st.label(el, 'zl sym', () => (a.state === 'loose' || a.state === 'in' ? m.getWorldPosition(V()).add(V(0, EL3.PT[el].r + .38, 0)) : null));
      return a;
    }
    function dropAtom(a) { R.remove(a.m); a.lab.show = false; a.lab.el.remove(); }
    function looseSlots() {
      const L = atoms.filter((a) => a.state !== 'bond' && a.state !== 'out' && a.state !== 'tobond');
      const n = L.length, perRow = n > 6 ? Math.ceil(n / 2) : n;
      L.forEach((a, i) => {
        const row = Math.floor(i / perRow), col = i % perRow, cnt = Math.min(perRow, n - row * perRow);
        const gap = 1.95; a.home = V((col - (cnt - 1) / 2) * gap, (n > 6 ? (row === 0 ? .95 : -1.05) : 0), row * .3);
      });
    }
    function report() { API.counts = {}; atoms.forEach((a) => { if (a.state !== 'out') API.counts[a.el] = (API.counts[a.el] || 0) + 1; }); API.onChange && API.onChange(API.counts); }
    function matches() {
      if (!API.target) return false; const t = counts(API.target), c = API.counts;
      const ks = new Set(Object.keys(t).concat(Object.keys(c))); for (const k of ks) if ((t[k] || 0) !== (c[k] || 0)) return false; return true;
    }
    function unspin() { // 돌던 분자를 멈추고 지금 자리 그대로 둬요
      if (!R.rotation.y && !R.rotation.x) return;
      R.updateMatrixWorld(true); atoms.forEach((a) => a.m.position.applyEuler(R.rotation)); R.rotation.set(0, 0, 0); spin = 0;
    }
    function bond() {
      const S = slots(API.target), used = new Set();
      API.busy = true; unspin();
      atoms.forEach((a, i) => {
        const j = S.findIndex((s, k) => !used.has(k) && s.el === a.el); used.add(j);
        a.state = 'tobond'; a.from = a.m.position.clone(); a.to = S[j].p.clone(); a.k = -i * .07; a.dur = .95;
      });
      nameLab.show = false;
    }
    function add(el) {
      if (API.busy) return false;
      if (API.bonded) { API.onEvent && API.onEvent('full'); return false; }
      if (atoms.filter((a) => a.state !== 'out').length >= 8) { API.onEvent && API.onEvent('many'); return false; }
      const a = mkAtom(el); atoms.push(a); a.state = 'in'; a.k = 0; looseSlots();
      a.from = V(a.home.x * .4, FLOOR_Y - 2.6, 2.4); a.m.position.copy(a.from);
      report();
      if (matches()) { a.after = true; } // 들어온 뒤에 결합
      else if (API.target) { const t = counts(API.target); if (!t[el]) API.onEvent && API.onEvent('notin', el); else if (API.counts[el] > t[el]) API.onEvent && API.onEvent('over', el); else API.onEvent && API.onEvent('add', el); }
      return true;
    }
    function remove(a) {
      if (API.busy || a.state === 'bond') return;
      a.state = 'out'; a.k = 0; a.from = a.m.position.clone(); a.to = V(a.from.x * .5, FLOOR_Y - 3, 2.5); a.lab.show = false;
      report(); looseSlots(); API.onEvent && API.onEvent('remove', a.el);
    }
    function clear() { atoms.slice().forEach((a) => dropAtom(a)); atoms.length = 0; API.bonded = null; API.busy = false; R.rotation.set(0, 0, 0); spin = 0; nameLab.show = false; report(); }
    function split() { // 결합한 분자를 원자로 나눠요
      if (!API.bonded || API.busy) return;
      unspin(); API.bonded = null; nameLab.show = false;
      atoms.forEach((a) => { a.state = 'loose'; a.lab.show = true; });
      looseSlots(); fitAll(); API.onEvent && API.onEvent('split'); report();
    }
    function fitMol() { st.fit([R], { dir, margin: 1.32, dur: REDUCE ? 0 : .9, extra: [V(0, FLOOR_Y + .2, 0)] }); }
    function fitAll() { st.fit(frame, { dir, margin: 1.0, dur: REDUCE ? 0 : .7 }); }
    function setTarget(id) { clear(); API.target = id; API.mode = 'build'; st.controls.enabled = true; fitAll(); }
    function show(id) { // 화학식 쓰기: 다 만들어진 분자를 바로 보여 줘요
      clear(); API.target = id; API.mode = 'show';
      slots(id).forEach((s) => { const a = mkAtom(s.el); a.state = 'bond'; a.m.position.copy(s.p); a.lab.show = false; atoms.push(a); });
      API.bonded = id; spin = 1; report(); fitMol();
    }

    // 누르기: 떠 있는 원자를 누르면 빼요
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
    const el = st.renderer.domElement;
    el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
    el.addEventListener('pointerup', (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) { down = null; return; } down = null;
      const r = el.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, st.camera);
      const hit = ray.intersectObjects(atoms.filter((a) => a.state === 'loose').map((a) => a.m), false)[0];
      if (hit) remove(hit.object.userData.atom);
      else if (API.bonded) API.onEvent && API.onEvent('tapmol');
    });

    st.onFrame((dt) => {
      dt *= TS(); t0 += dt;
      let moving = false;
      for (let i = atoms.length - 1; i >= 0; i--) {
        const a = atoms[i], m = a.m;
        if (a.state === 'in') { // 아래에서 포물선을 그리며 날아 들어와요
          a.k = Math.min(1, a.k + dt / (REDUCE ? .05 : .75)); const k = easeO(a.k);
          m.position.lerpVectors(a.from, a.home, k); m.position.y += Math.sin(k * Math.PI) * 1.4;
          const sq = a.k > .85 ? 1 + Math.sin((a.k - .85) / .15 * Math.PI) * .07 : 1; m.scale.setScalar(EL3.PT[a.el].r * sq);
          if (a.k >= 1) { a.state = 'loose'; m.scale.setScalar(EL3.PT[a.el].r); if (a.after) { a.after = false; bond(); } }
          moving = true;
        } else if (a.state === 'loose') { // 제자리에서 살짝 떠 있어요
          const h = V(a.home.x, a.home.y + Math.sin(t0 * 1.6 + i * 1.3) * .07, a.home.z);
          m.position.lerp(h, Math.min(1, dt * 6));
        } else if (a.state === 'tobond') { // 실제 분자 모양 자리로 모여요
          a.k += dt / (REDUCE ? .05 : a.dur); const k = ease(clamp(a.k));
          m.position.lerpVectors(a.from, a.to, k); m.position.z += Math.sin(k * Math.PI) * .9;
          moving = true;
          if (a.k >= 1) a.state = 'bond';
        } else if (a.state === 'out') {
          a.k = Math.min(1, a.k + dt / (REDUCE ? .05 : .55)); const k = a.k * a.k;
          m.position.lerpVectors(a.from, a.to, k); m.position.y += Math.sin(a.k * Math.PI) * .7;
          if (a.k >= 1) { dropAtom(a); atoms.splice(i, 1); }
        }
      }
      if (API.busy && atoms.every((a) => a.state === 'bond')) {
        API.busy = false; API.bonded = API.target; spin = 0.001; pulse = 1;
        atoms.forEach((a) => (a.lab.show = false));
        API.onEvent && API.onEvent('bond', API.target);
        fitMol();
      }
      if (pulse > 0) { pulse = Math.max(0, pulse - dt * 2.2); const s = 1 + Math.sin((1 - pulse) * Math.PI) * .06; R.scale.setScalar(s); }
      if (API.bonded && !API.busy && !REDUCE) { spin = Math.min(1, spin + dt * .8); R.rotation.y += dt * .32 * spin; }
      if (API.bonded) { nameLab.show = !!API.nameText; }
    });
    let pulse = 0;
    API.setName = (t) => { API.nameText = t; nameLab.set(t || ''); nameLab.show = !!t && !!API.bonded; };
    Object.assign(API, { add, remove, clear, split, setTarget, show, counts: {}, NAME, ATOMN });
    prepare(st).then(() => { window.__ready = true; });
    return API;
  }

  /* ===================== 2) 이온 만들기 ===================== */
  function electronPath(seed, rMin, rMax) { // AT3과 같은 움직임
    const r = mkR(seed), a = [r() * 6, r() * 6, r() * 6], f = [.35 + r() * .3, .27 + r() * .3, .2 + r() * .25], ax = V(r() - .5, r() - .5, r() - .5).normalize();
    const q = new THREE.Quaternion().setFromAxisAngle(ax, r() * 3);
    return (t, out) => {
      const th = a[0] + t * f[0] * 2.2, ph = Math.PI / 2 + Math.sin(a[1] + t * f[1]) * 1.05;
      const rad = lerp(rMin, rMax, .5 + .5 * Math.sin(a[2] + t * f[2]));
      return out.set(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)).applyQuaternion(q).multiplyScalar(rad);
    };
  }
  function ion(host) {
    const st = stage(host, { bottom: '#eaf1f7' });
    st.controls.enableZoom = false;
    st.onFrame(() => placeSigns(st.scene, st.camera));
    const RA = 3, g = new THREE.Group(); st.scene.add(g);
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), AT3.cloudMat(1)); cloud.scale.setScalar(RA); cloud.renderOrder = 3; g.add(cloud);
    const core = AT3.particle('p', .62); core.userData.sign.visible = false; g.add(core);
    const frame = frameBox(9.4, 7.6); frame.position.y = -.35; st.scene.add(frame);
    st.camera.position.set(0, 0, 16); st.controls.target.set(0, 0, 0);
    const fdir = V(0, .05, 1); st.fit(frame, { dir: fdir, margin: 1.0 });
    const qLab = st.label('', 'zl nucq', () => core.getWorldPosition(V()));
    const big = st.label('', 'zl big ionl', () => V(0, -RA - .55, 0));
    const tag = st.label('', 'zl say', () => (fly ? fly.e.getWorldPosition(V()).add(V(0, .6, 0)) : null)); tag.show = false;
    const es = []; let Z = 0, t0 = 0, fly = null, seedN = 0;
    const lineMat = new THREE.LineBasicMaterial({ color: 0x2f7fd0, transparent: true, opacity: .0 });
    const lineGeo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 40 }, () => V()));
    const arc = new THREE.Line(lineGeo, lineMat); arc.renderOrder = 8; g.add(arc);
    function mkE() { const e = AT3.particle('e', .21); e.userData.path = electronPath(31 + (seedN++) * 23, 1.25, 2.6); e.userData.ph = es.length * 1.7; g.add(e); return e; }
    function set(z, n) {
      if (fly) { g.remove(fly.e); fly = null; }
      Z = z; qLab.set('+' + z); qLab.el.classList.toggle('sm', z >= 10);
      while (es.length) g.remove(es.pop());
      seedN = z * 3; for (let i = 0; i < (n === undefined ? z : n); i++) es.push(mkE());
      lineMat.opacity = 0; tag.show = false;
    }
    function drawArc(a, c, b) {
      const P = lineGeo.attributes.position; const tmp = V();
      for (let i = 0; i < P.count; i++) { bez(a, c, b, i / (P.count - 1), tmp); P.setXYZ(i, tmp.x, tmp.y, tmp.z); }
      P.needsUpdate = true; lineGeo.setDrawRange(0, 0);
    }
    const OUT = V(7.4, 2.5, .6), IN = V(-7.4, 2.5, .6);
    function lose() {
      if (fly || !es.length) return false;
      // 화면 오른쪽에 있는 전자가 떨어져 나가요
      let best = 0; es.forEach((e, i) => { if (e.position.x + e.position.z * .3 > es[best].position.x + es[best].position.z * .3) best = i; });
      const e = es.splice(best, 1)[0], a = e.position.clone();
      const c = V(Math.max(a.x, 1.5) + 2.6, Math.max(a.y, 0) + 2.4, .8);
      fly = { e, a, c, b: OUT.clone(), k: 0, dur: REDUCE ? .05 : 1.5, kind: 'out' };
      drawArc(a, c, OUT); lineMat.opacity = .85; tag.set('다른 원자로 이동'); tag.show = true;
      return true;
    }
    function gain() {
      if (fly) return false;
      const e = mkE(); const dur = REDUCE ? .05 : 1.5;
      const end = e.userData.path(t0 * .9 + e.userData.ph + dur * .9, V());
      const c = V(Math.min(end.x, -1.5) - 2.6, Math.max(end.y, 0) + 2.4, .8);
      e.position.copy(IN); fly = { e, a: IN.clone(), c, b: end, k: 0, dur, kind: 'in' };
      drawArc(IN, c, end); lineMat.opacity = .85; tag.set('다른 원자에서 옴'); tag.show = true;
      return true;
    }
    const tmp = V();
    st.onFrame((dt) => {
      dt *= TS(); t0 += dt;
      es.forEach((e) => { e.userData.path(t0 * .9 + e.userData.ph, tmp); e.position.copy(tmp); });
      if (fly) {
        fly.k = Math.min(1, fly.k + dt / fly.dur);
        const k = fly.kind === 'out' ? fly.k * fly.k * (3 - 2 * fly.k) * (.35 + .65 * fly.k) / (.35 + .65) * 1 : easeO(fly.k);
        bez(fly.a, fly.c, fly.b, clamp(fly.kind === 'out' ? Math.pow(fly.k, 1.6) : k), fly.e.position);
        lineGeo.setDrawRange(0, Math.ceil(40 * (fly.kind === 'out' ? Math.pow(fly.k, 1.6) : k)));
        if (fly.k >= 1) {
          if (fly.kind === 'out') g.remove(fly.e); else es.push(fly.e);
          const kind = fly.kind; fly = null; tag.show = false; fade = 1;
          API.onChange && API.onChange(es.length, kind);
        }
      } else if (fade > 0) { fade = Math.max(0, fade - dt * 1.2); lineMat.opacity = .85 * fade; }
      g.rotation.y = Math.sin(t0 * .3) * .08;
    });
    let fade = 0;
    function hide(h) { g.visible = !h; qLab.show = !h; if (h) API.label(''); }
    const API = { st, set, lose, gain, hide, get n() { return es.length + (fly && fly.kind === 'in' ? 0 : 0); }, get busy() { return !!fly; }, label: (h) => big.set(h), onChange: null };
    prepare(st).then(() => { window.__ready = true; });
    return API;
  }

  /* ===================== 3) 사진용 장면 ===================== */
  // 정한 자리에 전자를 둔 원자·이온(교과서 그림 Ⅳ-11처럼 앞쪽에 고르게)
  function ionStill(g, z, n, seed) {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), AT3.cloudMat(1)); cloud.scale.setScalar(3); cloud.renderOrder = 3; g.add(cloud);
    const core = AT3.particle('p', .74); core.userData.sign.visible = false; g.add(core);
    const r = mkR(seed), pts = [];
    let tries = 0;
    while (pts.length < n && tries++ < 5000) {
      const a = r() * 6.283, d = 1.3 + r() * 1.3, p = V(Math.cos(a) * d, Math.sin(a) * d, .6 + r() * .6);
      if (pts.every((q) => q.distanceTo(p) > (n > 8 ? .86 : 1.1))) pts.push(p);
    }
    pts.forEach((p) => { const e = AT3.particle('e', .3); e.position.copy(p); g.add(e); });
    return { core, pts };
  }
  function still(host, k) {
    const st = stage(host, { top: '#ffffff', bottom: '#ffffff' });
    st.scene.background = new THREE.Color('#ffffff'); st.controls.enabled = false; st.controls.minDistance = .3;
    st.onFrame(() => placeSigns(st.scene, st.camera));
    const g = new THREE.Group(); st.scene.add(g);
    let fr, dir = V(0, .22, 1), margin = 1.06, fy = null;
    if (k.startsWith('m-') || k.startsWith('a-')) {
      const id = k.slice(2);
      const m = k.startsWith('a-') ? EL3.ball(id, 0, 0, 0) : EL3.mol(id);
      if (POSE_FIX[id]) m.rotation.copy(POSE_FIX[id]);
      if (id === 'H2O') m.rotateZ(-.15);
      g.add(m); g.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(g), s = b.getSize(V()), c = b.getCenter(V());
      g.position.sub(c); fy = -s.y / 2 - .05;
      const w = Math.max(s.x, s.y * 1.25, 1.6); fr = frameBox(w * 1.02, w * 1.02 / 1.25, 1); fr.position.y = -.08; margin = 1.0;
      if (k.startsWith('a-')) { const d = EL3.PT[id].r * 2.15; fr = frameBox(d, d, 1); fr.position.y = -.06; }
    } else if (k.startsWith('i-')) {
      const id = k.slice(2), z = { Li: 3, F: 9 }[id.replace(/[+-]/, '')], n = z + (id.endsWith('+') ? -1 : id.endsWith('-') ? 1 : 0);
      const seed = { Li: 11, 'Li+': 11, F: 23, 'F-': 23 }[id];
      const o = ionStill(g, z, n, seed);
      st.label('+' + z, 'zl nucq xl', () => V());
      fr = frameBox(6.3, 6.3); dir = V(0, .02, 1); margin = 1.01;
    } else { // hero, card: 물 분자 하나를 크게, 둘레에 산소 분자와 헬륨 원자
      const w = EL3.mol('H2O'); w.scale.setScalar(1.45); w.position.set(.1, 0, .4); w.rotateZ(-.15); g.add(w);
      const o2 = EL3.mol('O2'); o2.position.set(-3.1, -.25, -1.2); o2.rotation.set(0, .55, .35); g.add(o2);
      const he = EL3.ball('He', 3.0, -.2, -1.0); g.add(he);
      fr = frameBox(8.2, 4.3, 1); fr.position.y = -.25; fy = -1.95; dir = V(0, .24, 1); margin = 1.0;
    }
    if (fy !== null) floor(st, fy, .1);
    st.scene.add(fr); st.camera.position.set(0, 1, 14); st.fit(fr, { dir, margin });
    prepare(st).then(() => { window.__ready = true; });
    return { st };
  }

  return { NAME, ATOMN, ORDER, counts, slots, build, ion, still };
})();
