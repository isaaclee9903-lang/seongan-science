/* ===== 원소 수업 3D 도구 (three.js) — 2026-11-15 전면 수정 =====
   EL3.PT            입자 색·크기·이름 (널리 쓰는 분자 모형 색. 크기는 반데르발스 반지름 비율을 줄여 겹치게 그린 모형)
   EL3.MOL           PubChem 3D 좌표(공개 자료, CID 962 물·222 암모니아·297 메테인·280 이산화 탄소·281 일산화 탄소·977 산소, 수소는 결합 길이 0.74 Å)
   EL3.model(id)     입자 모형 묶음 { group, kinds, tick(dt) } — 물질 10가지·화학식 6가지·기체
   EL3.viewer(host)  입자 모형을 천천히 돌려 보여 주는 작은 3D 칸 → .show(id)
   화면 글에서는 '입자'라고만 부르고, 입자 개수 풀이는 하지 않는다(다음 차시 내용). */
const EL3 = (() => {
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  // 입자 색(실제 물질 색이 아니라 모형 색). r: 그림 반지름(Å 단위 좌표에 맞춤)
  const PT = {
    H: { c: '#f4f6f8', r: 0.62, n: '수소' }, He: { c: '#8fe3ef', r: 0.78, n: '헬륨' },
    C: { c: '#3b4048', r: 0.86, n: '탄소' }, N: { c: '#3d6fe0', r: 0.84, n: '질소' },
    O: { c: '#e2402f', r: 0.8, n: '산소' }, Na: { c: '#9c5bd6', r: 1.1, n: '나트륨' },
    Cl: { c: '#3fbf5a', r: 1.05, n: '염소' }, Si: { c: '#e6b98a', r: 1.0, n: '규소' },
    Al: { c: '#b9bfca', r: 0.98, n: '알루미늄' }, Cu: { c: '#d0773f', r: 0.92, n: '구리' },
  };
  const matCache = {};
  function pmat(el) {
    if (matCache[el]) return matCache[el];
    const m = new THREE.MeshStandardMaterial({ color: PT[el].c, roughness: el === 'Cu' || el === 'Al' ? 0.42 : 0.55, metalness: el === 'Cu' || el === 'Al' ? 0.25 : 0.0 });
    return (matCache[el] = m);
  }
  const sgeo = new THREE.SphereGeometry(1, 40, 28);
  function ball(el, x, y, z, k = 1) {
    const m = new THREE.Mesh(sgeo, pmat(el)); m.position.set(x, y, z); m.scale.setScalar(PT[el].r * k); m.castShadow = true; m.receiveShadow = true; m.userData.el = el; return m;
  }

  // PubChem 3D 배치(Å). 물·암모니아·메테인의 수소 결합 길이는 PubChem 값 그대로
  const MOL = {
    H2O: [['O', 0, 0, 0], ['H', 0.2774, 0.8929, 0.2544], ['H', 0.6068, -0.2383, -0.7169]],
    NH3: [['N', 0, 0, 0], ['H', -0.4417, 0.2906, 0.8711], ['H', 0.7256, 0.6896, -0.1907], ['H', 0.4875, -0.8701, 0.2089]],
    CH4: [['C', 0, 0, 0], ['H', 0.5541, 0.7996, 0.4965], ['H', 0.6833, -0.8134, -0.2536], ['H', -0.7782, -0.3735, 0.6692], ['H', -0.4593, 0.3874, -0.9121]],
    CO2: [['O', -1.197, 0, 0], ['O', 1.197, 0, 0], ['C', 0, 0, 0]],
    CO: [['O', 0.5285, 0, 0], ['C', -0.5285, 0, 0]],
    O2: [['O', -0.616, 0, 0], ['O', 0.616, 0, 0]],
    H2: [['H', -0.37, 0, 0], ['H', 0.37, 0, 0]],
    He: [['He', 0, 0, 0]],
  };
  function mol(id, k = 1) {
    const g = new THREE.Group(), A = MOL[id];
    const c = V(); A.forEach(([, x, y, z]) => c.add(V(x, y, z))); c.multiplyScalar(1 / A.length);
    A.forEach(([e, x, y, z]) => g.add(ball(e, x - c.x, y - c.y, z - c.z, k)));
    return g;
  }
  const randQ = (r) => new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 6.28, r() * 6.28, r() * 6.28));

  /* 흩어진 입자 무리(기체·액체): 상자 안에서 움직임 */
  function swarm(ids, n, box, opt = {}) {
    const g = new THREE.Group(), r = rng(opt.seed || 7), items = [];
    const sp = opt.speed || 1.2;
    for (let i = 0; i < n; i++) {
      const id = Array.isArray(ids) ? ids[i % ids.length] : ids, m = mol(id);
      let p; for (let t = 0; t < 40; t++) { p = V((r() - 0.5) * box, (r() - 0.5) * box, (r() - 0.5) * box); if (items.every((o) => o.m.position.distanceTo(p) > (opt.gap || 2.2))) break; }
      m.position.copy(p); m.quaternion.copy(randQ(r)); g.add(m);
      const v = V(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(sp * (0.6 + r() * 0.6));
      items.push({ m, v, w: V(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(opt.spin || 1.6) });
    }
    const h = box / 2;
    function tick(dt) {
      if (REDUCE) return;
      items.forEach((o) => {
        if (opt.liquid) { o.v.x += (Math.random() - 0.5) * dt * 6; o.v.y += (Math.random() - 0.5) * dt * 6; o.v.z += (Math.random() - 0.5) * dt * 6; o.v.clampLength(0, sp); }
        o.m.position.addScaledVector(o.v, dt);
        ['x', 'y', 'z'].forEach((a) => { if (o.m.position[a] > h) { o.m.position[a] = h; o.v[a] = -Math.abs(o.v[a]); } if (o.m.position[a] < -h) { o.m.position[a] = -h; o.v[a] = Math.abs(o.v[a]); } });
        o.m.rotation.x += o.w.x * dt; o.m.rotation.y += o.w.y * dt; o.m.rotation.z += o.w.z * dt;
      });
      if (opt.liquid) { // 서로 붙어 있되 겹치지 않게
        for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
          const a = items[i].m.position, b = items[j].m.position, d = a.distanceTo(b), want = opt.gap || 2.3;
          if (d < want && d > 1e-4) { const push = _t.subVectors(a, b).multiplyScalar((want - d) / d * 0.5); a.add(push); b.sub(push); }
        }
      }
    }
    return { group: g, tick };
  }
  const _t = V();

  /* 결정: 점 목록을 받아 공으로 */
  function cluster(pts, k = 1) { const g = new THREE.Group(); pts.forEach(([e, x, y, z]) => g.add(ball(e, x, y, z, k))); return g; }
  function fcc(el, a, n) { // 면심 입방(구리·알루미늄)
    const P = [], B = [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) B.forEach(([x, y, z]) => { const p = [(i + x) * a, (j + y) * a, (k + z) * a]; if (p.every((v) => v <= (n - 1) * a + 1e-6)) P.push([el, ...p]); });
    return centre(P);
  }
  function centre(P) { const c = [0, 0, 0]; P.forEach((p) => { c[0] += p[1]; c[1] += p[2]; c[2] += p[3]; }); c.forEach((v, i) => (c[i] = v / P.length)); return P.map(([e, x, y, z]) => [e, x - c[0], y - c[1], z - c[2]]); }
  function diamond(n) {
    const a = 3.567, P = [], F = [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) F.forEach(([x, y, z]) => [[0, 0, 0], [0.25, 0.25, 0.25]].forEach(([u, v, w]) => P.push(['C', (i + x + u) * a, (j + y + v) * a, (k + z + w) * a])));
    const c = centre(P); return c.filter(([, x, y, z]) => Math.hypot(x, y, z) < a * n * 0.52);
  }
  function rocksalt(n) { const a = 2.82, P = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) P.push([(i + j + k) % 2 ? 'Cl' : 'Na', i * a, j * a, k * a]); return centre(P); }
  function dryice() { // 이산화 탄소 결정(입방, 축이 대각선 방향)
    const a = 5.62, g = new THREE.Group(), F = [[0, 0, 0, [1, 1, 1]], [0.5, 0.5, 0, [1, -1, -1]], [0.5, 0, 0.5, [-1, 1, -1]], [0, 0.5, 0.5, [-1, -1, 1]]];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) F.forEach(([x, y, z, d]) => {
      const m = mol('CO2'); m.position.set((i + x - 0.75) * a, (j + y - 0.75) * a, (k + z - 0.75) * a);
      m.quaternion.setFromUnitVectors(V(1, 0, 0), V(...d).normalize()); g.add(m);
    });
    return g;
  }
  function glass(seed = 3) { // 유리: 규소 둘레에 산소가 불규칙하게 이어진 그물
    const r = rng(seed), Si = [];
    for (let t = 0; Si.length < 26 && t < 3000; t++) { const p = V((r() - 0.5) * 12, (r() - 0.5) * 12, (r() - 0.5) * 12); if (p.length() < 6.3 && Si.every((q) => q.distanceTo(p) > 2.9)) Si.push(p); }
    const P = Si.map((p) => ['Si', p.x, p.y, p.z]), used = new Set();
    Si.forEach((a, i) => { Si.map((b, j) => [j, a.distanceTo(b)]).filter(([j]) => j !== i).sort((x, y) => x[1] - y[1]).slice(0, 3).forEach(([j, d]) => {
      const key = Math.min(i, j) + '-' + Math.max(i, j); if (used.has(key) || d > 4.4) return; used.add(key);
      const m = a.clone().add(Si[j]).multiplyScalar(0.5).add(V(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.5)); P.push(['O', m.x, m.y, m.z]);
    }); });
    Si.forEach((a, i) => { if ([...used].filter((k) => k.split('-').includes(String(i))).length < 2) { const d = a.clone().normalize().multiplyScalar(1.6); P.push(['O', a.x + d.x, a.y + d.y, a.z + d.z]); } });
    return P;
  }
  // 사슬(플라스틱·비누): 지그재그 탄소 줄기에 수소가 붙음
  function chain(spec, x0, y0, z0, dir = 1) {
    const P = [], step = 1.27, rise = 0.42;
    spec.forEach((e, i) => {
      const x = x0 + i * step * dir, y = y0 + (i % 2 ? rise : -rise);
      P.push([e, x, y, z0]);
      if (e === 'C') { const s = i % 2 ? 1 : -1; P.push(['H', x, y + s * 0.62, z0 + 0.85], ['H', x, y + s * 0.62, z0 - 0.85]); }
      if (e === 'c') { P[P.length - 1][0] = 'C'; P.push(['O', x, y + (i % 2 ? 1.2 : -1.2), z0]); }
    });
    return P;
  }
  function plastic() { // 페트병 플라스틱처럼 탄소·수소·산소가 길게 이어진 사슬
    let P = [];
    [[-1.2, 0], [1.4, 3.1], [-0.4, -3.1]].forEach(([y, z], k) => { P = P.concat(chain(['C', 'C', 'O', 'c', 'C', 'C', 'O', 'c', 'C', 'C', 'O', 'c'], -7 + k * 0.8, y, z)); });
    return centre(P);
  }
  function soap() { // 비누: 긴 탄소 사슬 끝에 산소와 나트륨
    let P = [];
    [[0, -2.4], [0, 0], [0, 2.4], [2.6, -1.2], [2.6, 1.2]].forEach(([y, z]) => { P = P.concat(chain(['C', 'C', 'C', 'C', 'C', 'C', 'C', 'c'], -5.5, y, z)); const L = P.filter((p) => p[0] === 'O').pop(); P.push(['O', 4.4, y + 0.9, z + 0.2], ['Na', 5.6, y + 1.6, z + 0.4]); void L; });
    return centre(P);
  }

  /* 물질별 입자 모형 */
  const KINDS = {
    balloon: ['He'], diamond: ['C'], capsule: ['Al'], copper: ['Cu'],
    plastic: ['C', 'H', 'O'], glass: ['Si', 'O'], soap: ['C', 'H', 'O', 'Na'], dryice: ['C', 'O'], salt: ['Na', 'Cl'], water: ['H', 'O'],
    NH3: ['N', 'H'], NaCl: ['Na', 'Cl'], H2O: ['H', 'O'], CH4: ['C', 'H'], CO2: ['C', 'O'], CO: ['C', 'O'], O2: ['O'], H2: ['H'],
  };
  function model(id) {
    let g, tick = null;
    if (id === 'balloon') { const s = swarm('He', 14, 11, { gap: 2.4, speed: 3 }); g = s.group; tick = s.tick; }
    else if (id === 'O2' || id === 'H2') { const s = swarm(id, 12, 11, { gap: 2.8, speed: 3 }); g = s.group; tick = s.tick; }
    else if (id === 'water') { const s = swarm('H2O', 26, 7.4, { gap: 2.45, speed: 1.4, liquid: true }); g = s.group; tick = s.tick; }
    else if (id === 'diamond') g = cluster(diamond(3), 0.95);
    else if (id === 'capsule') g = cluster(fcc('Al', 4.05, 4), 1.2);
    else if (id === 'copper') g = cluster(fcc('Cu', 3.61, 4), 1.2);
    else if (id === 'salt' || id === 'NaCl') g = cluster(rocksalt(4), 1.1);
    else if (id === 'dryice') g = dryice();
    else if (id === 'glass') g = cluster(glass(), 1);
    else if (id === 'plastic') g = cluster(plastic(), 0.95);
    else if (id === 'soap') g = cluster(soap(), 0.95);
    else g = mol(id, 1);
    return { group: g, kinds: KINDS[id] || [], tick };
  }

  /* 작은 3D 칸: 입자 모형을 돌려 보기 */
  function viewer(host, o = {}) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.domElement.className = 'gl'; host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(renderer), 0.04).texture;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa8b8, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(-4, 7, 6); scene.add(key);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
    let controls = null;
    if (o.orbit !== false) { controls = new OrbitControls(cam, renderer.domElement); controls.enablePan = false; controls.enableZoom = false; controls.enableDamping = true; controls.rotateSpeed = 0.8; renderer.domElement.style.touchAction = 'none'; }
    const root = new THREE.Group(); scene.add(root);
    let cur = null, W = 1, H = 1, spin = o.spin === undefined ? 0.35 : o.spin, dist = 10;
    function resize() { const r = host.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); renderer.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); place(); }
    function place() {
      if (!cur) return; const b = new THREE.Box3().setFromObject(cur.group), s = b.getBoundingSphere(new THREE.Sphere());
      const R = Math.max(1.4, s.radius + (cur.tick ? 0.6 : 0)), f = (cam.fov * Math.PI) / 360, fit = R / Math.sin(Math.min(f, Math.atan(Math.tan(f) * cam.aspect)));
      dist = fit * (o.margin || 1.08); cam.position.set(0, dist * 0.32, dist * 0.95).setLength(dist); cam.lookAt(0, 0, 0);
      if (controls) { controls.target.set(0, 0, 0); controls.update(); }
    }
    function show(id) {
      if (cur) root.remove(cur.group);
      cur = model(id); cur.id = id; root.add(cur.group); root.rotation.set(0, 0, 0); place(); return cur;
    }
    try { new ResizeObserver(resize).observe(host); } catch (e) { addEventListener('resize', resize); }
    resize();
    let last = performance.now(), live = true;
    function vis() { if (document.hidden) return false; try { const f = window.frameElement; if (f && f.hasAttribute('data-page') && !f.classList.contains('on')) return false; } catch (e) {} const r = host.getBoundingClientRect(); return r.bottom > -40 && r.top < (innerHeight || 800) + 40 && r.width > 2; }
    function tick(now) {
      requestAnimationFrame(tick); if (!live) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!vis()) return;
      if (cur) { if (cur.tick) cur.tick(dt); if (!REDUCE) root.rotation.y += dt * spin; }
      if (controls) controls.update(); renderer.render(scene, cam);
    }
    requestAnimationFrame(tick);
    return { show, renderer, scene, cam, root, get cur() { return cur; }, setSpin: (s) => (spin = s), stop: () => (live = false), resize };
  }

  return { PT, MOL, KINDS, model, mol, viewer, ball, swarm, rng, V };
})();
window.EL3 = EL3;
