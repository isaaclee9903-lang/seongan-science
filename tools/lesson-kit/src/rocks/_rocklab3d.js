/* ===== 3D 암석 관찰 실험실 (교과서 탐구 '암석을 관찰하여 분류하기'를 가상으로) =====
   책상 위: 뒤쪽에 숫자 붙임딱지를 붙인 암석 표본, 가운데 페트리 접시, 왼쪽에 돋보기, 오른쪽에 묽은 염산과 스포이트.
   - 돋보기: 돋보기가 표본 위로 와서 렌즈 아래를 확대한 동그란 창이 열려요. 확대 창은 표본 표면을 천천히 훑어요.
   - 묽은 염산: 스포이트로 2~3방울 떨어뜨리고, 반응하는 암석(대리암)에서만 거품이 생겨요.
   크기·속도는 실제와 다른 모형이에요. 이 조각 앞에 THREE, C3, MIN3D, ROCK3D가 있어야 해요. */
const RLAB = (() => {
  const V = C3.V;
  function canvasTex(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { c, g: c.getContext('2d'), t }; }
  function makeDish(r = 0.62) {
    const pts = [[0, 0], [r, 0], [r + 0.01, 0.005], [r + 0.012, 0.11], [r + 0.002, 0.112], [r - 0.002, 0.012], [0, 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.04, roughness: 0.03, thickness: 0.05, ior: 1.5, specularIntensity: 1 })); m.receiveShadow = true; return m;
  }
  function makeDropper() {
    const grp = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.LatheGeometry([[0.004, 0], [0.012, 0.03], [0.026, 0.12], [0.026, 0.5], [0.03, 0.52]].map(([x, y]) => new THREE.Vector2(x, y)), 32),
      new THREE.MeshPhysicalMaterial({ color: 0xeef4fb, transparent: true, opacity: 0.3, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.04, roughness: 0.04, thickness: 0.12, ior: 1.5, specularIntensity: 1 }));
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.01, 0.16, 20), new THREE.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.55, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.04, roughness: 0.05, thickness: 0.05 })); liquid.position.y = 0.1;
    const bulb = new THREE.Mesh(new THREE.LatheGeometry([[0.03, 0.5], [0.042, 0.53], [0.046, 0.6], [0.04, 0.67], [0.02, 0.7], [0.0, 0.705]].map(([x, y]) => new THREE.Vector2(x, y)), 32), new THREE.MeshPhysicalMaterial({ color: 0xc8432c, roughness: 0.45, clearcoat: 0.3 }));
    grp.add(glass, liquid, bulb); grp.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return grp;
  }
  function makeBottle() {
    const grp = new THREE.Group();
    const body = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.16, 0], [0.17, 0.02], [0.17, 0.36], [0.12, 0.44], [0.06, 0.47], [0.06, 0.53]].map(([x, y]) => new THREE.Vector2(x, y)), 40),
      new THREE.MeshPhysicalMaterial({ color: 0x8a4a1c, transparent: true, opacity: 0.78, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.04, roughness: 0.08, thickness: 0.3, ior: 1.5, attenuationColor: new THREE.Color('#5a2a08'), attenuationDistance: 0.3 }));
    const lt = canvasTex(256, 128); lt.g.fillStyle = '#fbf8ef'; lt.g.fillRect(0, 0, 256, 128); lt.g.strokeStyle = '#c0392b'; lt.g.lineWidth = 6; lt.g.strokeRect(6, 6, 244, 116);
    lt.g.fillStyle = '#1d2b3a'; lt.g.font = '900 44px Pretendard, sans-serif'; lt.g.textAlign = 'center'; lt.g.textBaseline = 'middle'; lt.g.fillText('묽은 염산', 128, 56);
    lt.g.font = '700 22px Pretendard, sans-serif'; lt.g.fillStyle = '#c0392b'; lt.g.fillText('피부에 닿지 않게', 128, 98); lt.t.needsUpdate = true;
    const label = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.16, 40, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: lt.t, roughness: 0.7 })); label.position.y = 0.19;
    grp.add(body, label); grp.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return grp;
  }
  /* 돋보기: 금속 테 + 유리 렌즈 + 나무 손잡이 */
  function makeLoupe() {
    const grp = new THREE.Group(), R = 0.2;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.018, 16, 64), new THREE.MeshPhysicalMaterial({ color: 0xd6d9de, metalness: 1, roughness: 0.25 }));
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.012, 48), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.14, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.04, roughness: 0.02, thickness: 0.05, ior: 1.5, specularIntensity: 1 }));
    lens.rotation.x = Math.PI / 2;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.09, 16), rim.material); neck.rotation.z = Math.PI / 2; neck.position.x = R + 0.055;
    const wood = canvasTex(64, 256); { const g = wood.g; const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, '#7a4a26'); gr.addColorStop(0.5, '#b07a46'); gr.addColorStop(1, '#6a3e20'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(60,30,10,${0.1 + Math.random() * 0.15})`; g.beginPath(); const x = Math.random() * 64; g.moveTo(x, 0); g.bezierCurveTo(x + 6, 80, x - 6, 170, x + 2, 256); g.stroke(); } wood.t.needsUpdate = true; }
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.42, 20), new THREE.MeshStandardMaterial({ map: wood.t, roughness: 0.55 })); handle.rotation.z = Math.PI / 2; handle.position.x = R + 0.3;
    const lensGrp = new THREE.Group(); lensGrp.add(rim, lens); lensGrp.rotation.x = Math.PI / 2; // 렌즈가 바닥과 나란하게
    grp.add(lensGrp, neck, handle);
    grp.traverse((o) => { if (o.isMesh) { o.castShadow = o !== lens; o.layers.set(1); } });
    grp.userData.R = R; return grp;
  }
  /* 숫자 붙임딱지 */
  function sticker(n) {
    const ct = canvasTex(128, 128), g = ct.g;
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#41b8c6'; g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; g.font = '900 72px Pretendard, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 64, 70); ct.t.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshStandardMaterial({ map: ct.t, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -4 }));
    return m;
  }
  const _rc = new THREE.Raycaster();
  function hitDown(objs, x, z, from = 6) { _rc.set(V(x, from, z), V(0, -1, 0)); return _rc.intersectObjects(objs, true)[0] || null; }

  function make(st, opt = {}) {
    const scene = st.scene, REDUCE = C3.REDUCE;
    scene.environment = MIN3D.studioEnv(st.renderer);
    st.camera.layers.enable(1); st.sun.shadow.camera.layers.enable(1);
    C3.addTable(scene, 9, 6.4);
    st.sun.position.set(3.5, 9, 6); Object.assign(st.sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); st.sun.shadow.mapSize.set(2048, 2048);
    const mat = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.012, 3.7), new THREE.MeshStandardMaterial({ color: 0x75808c, roughness: 0.92 })); mat.position.set(0, 0.006, 0.15); mat.receiveShadow = true; scene.add(mat);
    const Y0 = 0.012;
    const jobs = [], ticks = [];
    const tween = (dur, f, ease = C3.ease) => new Promise((res) => { jobs.push({ t: 0, dur: Math.max(0.01, dur), f, res, ease }); });
    const wait = (s) => tween(s, () => {});
    st.onFrame((dt, t) => {
      dt *= window.LAB_SLOW || 1;
      for (let i = jobs.length - 1; i >= 0; i--) { const j = jobs[i]; j.t += dt; const k = Math.min(1, j.t / j.dur); j.f(j.ease(k), k, dt); if (k >= 1) { jobs.splice(i, 1); j.res(); } }
      ticks.forEach((f) => f(dt, t));
    });

    const WORK = V(0, Y0, 0.25);
    const dish = makeDish(); dish.position.copy(WORK); scene.add(dish);
    const bottle = makeBottle(); bottle.position.set(2.45, Y0, -0.35); scene.add(bottle);
    const dropper = makeDropper(); const dropHome = V(2.45, Y0 + 0.36, -0.35); dropper.position.copy(dropHome); scene.add(dropper);
    const loupe = makeLoupe(); const loupeHome = { p: V(-2.15, Y0 + 0.04, 0.55), r: V(0, 0.5, 0) }; loupe.position.copy(loupeHome.p); loupe.rotation.set(0, loupeHome.r.y, 0); scene.add(loupe);
    // 돋보기가 놓일 때 그림자를 받는 작은 받침 대신 바닥에 바로 눕혀요

    /* 표본 (뒤쪽 줄) */
    const specs = opt.specimens || [], shelf = [];
    const n = specs.length, gap = Math.min(1.05, 6.0 / Math.max(1, n));
    specs.forEach((s, i) => {
      const model = ROCK3D.make(s.id, s.seed); const x = (i - (n - 1) / 2) * gap, home = V(x, Y0, -1.2);
      const sc = 0.5 * (s.scale || 1);
      model.position.copy(home); model.scale.setScalar(sc); model.rotation.y = s.ry || 0; scene.add(model);
      model.updateMatrixWorld(true);
      if (s.num) { // 숫자 붙임딱지: 표본 윗면 앞쪽에 붙여요
        const h = hitDown([model], x + 0.05, home.z + 0.1, 4) || hitDown([model], x, home.z, 4);
        if (h) { const st2 = sticker(s.num), nrm = h.face.normal.clone().transformDirection(h.object.matrixWorld); st2.position.copy(h.point).addScaledVector(nrm, 0.004); st2.quaternion.setFromUnitVectors(V(0, 0, 1), nrm); st2.scale.setScalar(0.07); scene.add(st2); model.attach(st2); }
      }
      const item = { ...s, model, home, sc, x };
      if (opt.shelfLabels !== false) item.lb = st.label(s.label, 'small', V(x, Y0, -0.62));
      shelf.push(item);
    });
    let cur = null, busy = false;

    const VIEWS = {
      all: { p: V(0, 4.6, 5.0), t: V(0, 0.1, -0.1) },
      work: { p: V(0.1, 1.35, 2.0), t: V(0, 0.22, 0.25) },
      lens: { p: V(0.35, 2.0, 1.55), t: V(0, 0.25, 0.2) },
      acid: { p: V(0.75, 0.82, 1.75), t: V(0, 0.42, 0.25) },
    };
    function view(name, dur = 1.1) {
      const v = VIEWS[name]; if (!v) return;
      shelf.forEach((it) => { if (it.lb) it.lb.show = name === 'all'; });
      const { W, H } = st.size(), k = W / H < 1 ? 1.5 : W / H < 1.3 ? 1.15 : 1;
      st.flyTo(v.t.clone().add(v.p.clone().sub(v.t).multiplyScalar(k)), v.t, dur);
    }
    async function bring(item) {
      const m = item.model, p0 = m.position.clone(), s0 = m.scale.x;
      await tween(0.9, (e) => { m.position.lerpVectors(p0, WORK, e); m.position.y = p0.y + (WORK.y - p0.y) * e + Math.sin(e * Math.PI) * 0.7; m.scale.setScalar(s0 + (0.62 * (item.scale || 1) - s0) * e); });
    }
    async function putBack(item) {
      const m = item.model, p0 = m.position.clone(), s0 = m.scale.x, r0 = m.rotation.clone(), ry = item.ry || 0;
      await tween(0.8, (e) => { m.position.lerpVectors(p0, item.home, e); m.position.y = p0.y + (item.home.y - p0.y) * e + Math.sin(e * Math.PI) * 0.6; m.scale.setScalar(s0 + (item.sc - s0) * e); m.rotation.set(r0.x * (1 - e), r0.y + (ry - r0.y) * e, r0.z * (1 - e)); });
    }
    async function select(key) {
      if (busy) return false; const item = shelf.find((s) => s.key === key); if (!item || item === cur) return true;
      busy = true;
      try { closeLens(); await homeLoupe(); clearAcid(); if (cur) await putBack(cur); cur = item; await bring(item); }
      finally { busy = false; }
      return true;
    }
    async function observe() {
      if (!cur || busy) return; busy = true;
      try {
        closeLens(); await homeLoupe();
        const m = cur.model, p0 = m.position.clone(), r0 = m.rotation.y; view('work');
        await tween(0.7, (e) => { m.position.y = p0.y + e * 0.35; });
        await tween(3.2, (e) => { m.rotation.y = r0 + e * Math.PI * 2; m.rotation.x = Math.sin(e * Math.PI * 2) * 0.3; }, (k) => k);
        await tween(0.6, (e) => { m.position.y = p0.y + (1 - e) * 0.35; });
      } finally { busy = false; }
    }

    /* ---------- 돋보기와 확대 창 ---------- */
    const ins = opt.inset ? (() => {
      const host = opt.inset, r2 = new THREE.WebGLRenderer({ antialias: true });
      r2.outputColorSpace = THREE.SRGBColorSpace; r2.toneMapping = THREE.ACESFilmicToneMapping; r2.toneMappingExposure = 1.1;
      r2.shadowMap.enabled = true; r2.shadowMap.type = THREE.PCFSoftShadowMap;
      r2.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); r2.domElement.className = 'gl2'; host.appendChild(r2.domElement);
      const cam = new THREE.PerspectiveCamera(30, 1, 0.005, 20); cam.layers.set(0);
      const size = () => { const r = host.getBoundingClientRect(); r2.setSize(Math.max(1, r.width), Math.max(1, r.height), false); cam.aspect = r.width / Math.max(1, r.height); cam.updateProjectionMatrix(); };
      try { new ResizeObserver(size).observe(host); } catch (e) {} size();
      return { host, r2, cam, size, on: false, path: null, t: 0 };
    })() : null;
    if (ins) ticks.push((dt) => {
      if (!ins.on || !ins.path) return;
      ins.t += dt;
      const P = ins.path, k = (Math.sin(ins.t * 0.35) + 1) / 2, f = k * (P.length - 1), i = Math.min(P.length - 2, Math.floor(f)), u = f - i;
      const p = P[i].p.clone().lerp(P[i + 1].p, u), nrm = P[i].n.clone().lerp(P[i + 1].n, u).normalize();
      ins.cam.position.copy(p).addScaledVector(nrm, ins.dist); ins.cam.up.set(0, 0, -1); ins.cam.lookAt(p);
      // 돋보기도 같이 움직여요
      loupe.position.set(p.x, p.y + 0.2, p.z);
      ins.r2.render(scene, ins.cam);
    });
    function openLens() { if (ins) { ins.on = true; ins.host.classList.add('on'); ins.size(); } }
    function closeLens() { if (ins) { ins.on = false; ins.host.classList.remove('on'); } }
    async function homeLoupe() {
      if (loupe.position.distanceTo(loupeHome.p) < 0.01) return;
      const p0 = loupe.position.clone(), r0 = loupe.rotation.clone();
      await tween(0.8, (e) => { loupe.position.lerpVectors(p0, loupeHome.p, e); loupe.position.y += Math.sin(e * Math.PI) * 0.4; loupe.rotation.set(r0.x * (1 - e), r0.y + (loupeHome.r.y - r0.y) * e, r0.z * (1 - e)); });
    }
    async function magnify() {
      if (!cur || busy) return null; busy = true;
      try {
        clearAcid();
        const m = cur.model; m.updateMatrixWorld(true);
        const bb = new THREE.Box3().setFromObject(m), c = bb.getCenter(V()), sz = bb.getSize(V());
        // 표본 윗면을 가로지르는 길 (확대 창이 이 길을 따라 표면을 훑어요)
        const path = [];
        for (let i = 0; i <= 8; i++) { const x = c.x - sz.x * 0.3 + (sz.x * 0.6) * (i / 8), z = c.z + Math.sin(i * 0.9) * sz.z * 0.12, h = hitDown([m], x, z, 4); if (h) path.push({ p: h.point.clone(), n: h.face.normal.clone().transformDirection(h.object.matrixWorld).lerp(V(0, 1, 0), 0.35).normalize() }); }
        if (path.length < 2) return null;
        view('lens');
        const p0 = loupe.position.clone(), r0 = loupe.rotation.clone(), tgt = path[Math.floor(path.length / 2)].p.clone().add(V(0, 0.2, 0));
        await tween(1.1, (e) => { loupe.position.lerpVectors(p0, tgt, e); loupe.position.y += Math.sin(e * Math.PI) * 0.35; loupe.rotation.set(0, r0.y + (Math.PI * 0.85 - r0.y) * e, 0); });
        ins.path = path; ins.t = Math.asin(0) / 0.35; ins.dist = 0.17 * (opt.zoom || 1);
        openLens();
        await wait(1.2);
        return { big: !!(ROCK3D.INFO[cur.id] || {}).big };
      } finally { busy = false; }
    }

    /* ---------- 묽은 염산 ---------- */
    const dropMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.04, roughness: 0.02, thickness: 0.05, ior: 1.33 });
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.032, 20, 14), dropMat); drop.visible = false; scene.add(drop);
    const films = [], _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion();
    const bub = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.03, metalness: 0.1, transparent: true, opacity: 0.62, envMapIntensity: 2.2, depthWrite: false }), 260);
    bub.count = 0; bub.frustumCulled = false; scene.add(bub);
    let bubbles = [], fizz = null;
    ticks.push((dt) => {
      if (fizz && fizz.left > 0) {
        fizz.left -= dt; fizz.acc += dt * 110 * Math.min(1, fizz.left / 3 + 0.25);
        while (fizz.acc > 1 && bubbles.length < 260) {
          fizz.acc -= 1; const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * fizz.r, h = hitDown([fizz.m], fizz.c.x + Math.cos(a) * r, fizz.c.z + Math.sin(a) * r, 3);
          if (h) bubbles.push({ p: h.point.clone(), n: h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : V(0, 1, 0), r: 0, rm: 0.007 + Math.random() * 0.016, life: 0, max: 1.0 + Math.random() * 1.8, up: Math.random() < 0.25 });
        }
      }
      bubbles = bubbles.filter((b) => b.life < b.max);
      bubbles.forEach((b, i) => { b.life += dt; const k = b.life / b.max; b.r = b.rm * Math.min(1, k * 3) * (k > 0.92 ? (1 - k) / 0.08 : 1); if (b.up && k > 0.5) b.p.y += dt * 0.12; else b.p.addScaledVector(b.n, dt * 0.004); _m4.compose(b.p.clone().addScaledVector(b.n, b.r * 0.6), _q, V(b.r, b.r, b.r)); bub.setMatrixAt(i, _m4); });
      bub.count = bubbles.length; bub.instanceMatrix.needsUpdate = true;
    });
    async function acid() {
      if (!cur || busy) return null; busy = true;
      const m = cur.model, info = ROCK3D.INFO[cur.id] || {};
      try {
        closeLens(); await homeLoupe(); clearAcid(); view('acid');
        m.updateMatrixWorld(true);
        const tx = m.position.x + 0.04, tz = m.position.z + 0.04, hit = hitDown([m], tx, tz, 4), ty = hit ? hit.point.y : m.position.y + 0.3;
        const d0 = dropper.position.clone(), tip = V(tx, ty + 0.3, tz);
        await tween(1.1, (e) => { dropper.position.lerpVectors(d0, tip, e); dropper.position.y += Math.sin(e * Math.PI) * 0.5; });
        const nrm = hit && hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : V(0, 1, 0);
        for (let k = 0; k < 3; k++) { // 2~3방울
          drop.visible = true; drop.position.set(tx, tip.y - 0.005, tz);
          await tween(0.55, (e) => { drop.scale.set(0.3 + e * 0.7, 0.3 + e * 0.9, 0.3 + e * 0.7); drop.position.y = tip.y - 0.01 - e * 0.025; dropper.children[2].scale.set(1 - Math.sin(e * Math.PI) * 0.15, 1, 1 - Math.sin(e * Math.PI) * 0.15); });
          let vy = 0; await new Promise((res) => { const f = (dt) => { vy += 6 * dt; drop.position.y -= vy * dt; drop.scale.y = 1.2 + vy * 0.18; drop.scale.x = drop.scale.z = 1 - vy * 0.05; if (drop.position.y <= ty + 0.02) { ticks.splice(ticks.indexOf(f), 1); res(); } }; ticks.push(f); });
          drop.visible = false;
          if (k === 0) { const film = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), dropMat); film.position.set(tx, ty - 0.002, tz); film.quaternion.setFromUnitVectors(V(0, 1, 0), nrm); scene.add(film); films.push(film); film.scale.set(0.015, 0.012, 0.015); }
          const film = films[films.length - 1]; const r0 = film.scale.x;
          await tween(0.35, (e) => { const r = r0 + e * 0.022; film.scale.set(r, 0.008, r); });
          if (k === 0 && info.acid) fizz = { c: V(tx, 0, tz), r: 0.13, m, left: 10, acc: 0 };
        }
        const d1 = dropper.position.clone();
        tween(1.1, (e) => { dropper.position.lerpVectors(d1, dropHome, e); dropper.position.y += Math.sin(e * Math.PI) * 0.4; });
        await wait(info.acid ? 2.6 : 1.8);
        return { acid: !!info.acid };
      } finally { busy = false; }
    }
    function clearAcid() { films.forEach((f) => { scene.remove(f); f.geometry.dispose(); }); films.length = 0; bubbles = []; fizz = null; bub.count = 0; }

    function warm() {
      try {
        const film = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 4), dropMat); film.position.set(0, -3, 0); scene.add(film);
        drop.visible = true; bub.count = 1; _m4.compose(V(0, -3, 0), _q, V(0.01, 0.01, 0.01)); bub.setMatrixAt(0, _m4);
        // 화면 밖에 잠깐 두었다가, 준비(C3.prepare)가 끝나면 치워요 → 첫 염산 실험 때 멈추지 않아요
        const iv = setInterval(() => { if (!st.host || st.host.classList.contains('ready')) { clearInterval(iv); scene.remove(film); if (!fizz && drop.position.y < -2) drop.visible = false; if (!bubbles.length) bub.count = 0; } }, 300);
        drop.position.set(0, -3, 0);
      } catch (e) { console.warn(e); }
    }
    warm();
    view('all', 0);
    // 확대 창(두 번째 렌더러)도 화면을 멈추지 않고 미리 준비해요
    function warmInset() { if (ins) C3.compileAll(ins.r2, scene, ins.cam).catch(() => {}); }
    return { warmInset, shelf, select, observe, magnify, acid, view, closeLens, homeLoupe, get cur() { return cur; }, get busy() { return busy; }, get lensOn() { return !!(ins && ins.on); }, tween, wait };
  }
  return { make, makeLoupe, makeDish, makeDropper, makeBottle };
})();
