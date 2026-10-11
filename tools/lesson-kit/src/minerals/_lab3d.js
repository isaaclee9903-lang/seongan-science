/* ===== 3D 광물 실험실 (교과서 탐구 '광물의 특성 관찰하기'를 가상으로) =====
   책상 위: 뒤쪽에 광물 표본 받침, 가운데 페트리 접시, 왼쪽에 흰색·검은색 조흔판, 오른쪽에 클립과 묽은 염산·스포이트.
   - 조흔판: 광물을 기울여 판 위에서 앞뒤로 문지르면, 닿은 자리를 따라 광물 가루(조흔색)가 그려져요.
   - 클립: 광물을 클립 위로 가져가면 자철석일 때만 클립이 끌려와 붙어요.
   - 묽은 염산: 스포이트에서 방울이 떨어지고, 방해석일 때만 기포가 생겨요.
   - 굳기: 석영과 방해석을 서로 긁으면 방해석에만 흠집이 남아요.
   크기·속도는 실제와 다른 모형이에요. 이 조각 앞에 THREE, C3, MIN3D가 있어야 해요. */
const LAB = (() => {
  const V = C3.V;
  const PLATE = { w: 1.5, d: 0.92, h: 0.07 };

  function canvasTex(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { c, g: c.getContext('2d'), t }; }

  /* 조흔판 (초벌구이 도자기 판): 윗면에 그림을 그릴 수 있는 캔버스를 붙여요 */
  function makePlate(color) {
    const white = color === 'white', W = 768, H = 480, ct = canvasTex(W, H);
    const base = white ? '#efebe3' : '#26262a';
    function clear() {
      const g = ct.g; g.fillStyle = base; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 9000; i++) { const x = Math.random() * W, y = Math.random() * H, a = Math.random() * 0.07; g.fillStyle = white ? `rgba(120,100,80,${a})` : `rgba(255,255,255,${a * 0.6})`; g.fillRect(x, y, 1.5, 1.5); }
      const vg = g.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, white ? 'rgba(90,70,50,.10)' : 'rgba(0,0,0,.25)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
      ct.t.needsUpdate = true;
    }
    clear();
    const top = new THREE.MeshStandardMaterial({ map: ct.t, roughness: 0.92, metalness: 0 });
    const side = new THREE.MeshStandardMaterial({ color: white ? 0xe4ddd0 : 0x1e1e22, roughness: 0.9 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(PLATE.w, PLATE.h, PLATE.d), [side, side, top, side, side, side]);
    m.castShadow = true; m.receiveShadow = true;
    const grp = new THREE.Group(); m.position.y = PLATE.h / 2; grp.add(m);
    // 가루를 판 위 점(월드)에 찍어요
    function dab(world, hex, amt, spread) {
      const p = grp.worldToLocal(world.clone()), u = p.x / PLATE.w + 0.5, vy = p.z / PLATE.d + 0.5;
      if (u < 0 || u > 1 || vy < 0 || vy > 1) return;
      const x = u * W, y = vy * H, g = ct.g, r = spread * W / PLATE.w;
      g.fillStyle = hex;
      for (let i = 0; i < 34 * amt; i++) {
        const a = Math.random() * 6.28, d = Math.pow(Math.random(), 0.8) * r;
        g.globalAlpha = 0.1 + Math.random() * 0.22;
        const s = 1.2 + Math.random() * 3; g.fillRect(x + Math.cos(a) * d * 1.4, y + Math.sin(a) * d * 0.55, s, s * 0.8);
      }
      g.globalAlpha = 0.05; g.beginPath(); g.ellipse(x, y, r * 1.1, r * 0.45, 0, 0, 6.283); g.fill();
      g.globalAlpha = 1; ct.t.needsUpdate = true;
    }
    // 긁힌 자국(가루 없이 판이 살짝 긁힘)
    function scuff(world) {
      const p = grp.worldToLocal(world.clone()), x = (p.x / PLATE.w + 0.5) * W, y = (p.z / PLATE.d + 0.5) * H, g = ct.g;
      g.strokeStyle = white ? 'rgba(150,140,125,.10)' : 'rgba(255,255,255,.06)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 3, y + (Math.random() - 0.5) * 6); g.lineTo(x + 3, y + (Math.random() - 0.5) * 6); g.stroke(); ct.t.needsUpdate = true;
    }
    return { grp, top: PLATE.h, dab, scuff, clear, white };
  }

  /* 클립 (색 코팅 철사) */
  function clipCurve() {
    const P = [], arc = (cx, cy, r, a0, a1, n = 10) => { for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); P.push(V(cx + Math.cos(a) * r, 0, cy + Math.sin(a) * r)); } };
    P.push(V(0.2, 0, 0.004)); P.push(V(0.05, 0, 0.004));
    arc(0.05, 0.016, 0.012, -Math.PI / 2, -Math.PI * 1.5);
    P.push(V(0.15, 0, 0.028)); P.push(V(0.27, 0, 0.028));
    arc(0.27, 0.004, 0.024, Math.PI / 2, -Math.PI / 2);
    P.push(V(0.15, 0, -0.02)); P.push(V(0.025, 0, -0.02));
    arc(0.025, -0.001, 0.019, -Math.PI / 2, -Math.PI * 1.5);
    P.push(V(0.1, 0, 0.018)); P.push(V(0.17, 0, 0.018));
    return new THREE.CatmullRomCurve3(P, false, 'catmullrom', 0.1);
  }
  const CLIP_COLORS = ['#e8423a', '#2f7de1', '#f2c230', '#ec6fa8', '#2fb26b', '#8a5bd6', '#f08a2a'];
  function makeClip(col) {
    const g = new THREE.TubeGeometry(clipCurve(), 140, 0.0055, 8, false);
    const m = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2 }));
    m.castShadow = true; m.receiveShadow = true; return m;
  }

  /* 페트리 접시 (유리) */
  function makeDish(r = 0.62) {
    const pts = [V(0, 0, 0), V(r, 0, 0), V(r + 0.01, 0.005, 0), V(r + 0.012, 0.11, 0), V(r + 0.002, 0.112, 0), V(r - 0.002, 0.012, 0), V(0, 0.012, 0)].map((p) => new THREE.Vector2(p.x, p.y));
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, roughness: 0.03, thickness: 0.05, ior: 1.5, specularIntensity: 1, transparent: true, opacity: 1 });
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), mat); m.receiveShadow = true;
    return m;
  }
  /* 스포이트 (유리관 + 고무 꼭지) */
  function makeDropper() {
    const grp = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.LatheGeometry([[0.004, 0], [0.012, 0.03], [0.026, 0.12], [0.026, 0.5], [0.03, 0.52]].map(([x, y]) => new THREE.Vector2(x, y)), 32),
      new THREE.MeshPhysicalMaterial({ color: 0xeef4fb, transmission: 0.92, roughness: 0.04, thickness: 0.12, ior: 1.5, specularIntensity: 1 }));
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.01, 0.16, 20), new THREE.MeshPhysicalMaterial({ color: 0xcfe6ff, transmission: 0.6, roughness: 0.05, thickness: 0.05 }));
    liquid.position.y = 0.1;
    const bulb = new THREE.Mesh(new THREE.LatheGeometry([[0.03, 0.5], [0.042, 0.53], [0.046, 0.6], [0.04, 0.67], [0.02, 0.7], [0.0, 0.705]].map(([x, y]) => new THREE.Vector2(x, y)), 32),
      new THREE.MeshPhysicalMaterial({ color: 0xc8432c, roughness: 0.45, clearcoat: 0.3 }));
    grp.add(glass, liquid, bulb); grp.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return grp;
  }
  /* 묽은 염산 병 (갈색 유리병 + 이름표) */
  function makeBottle() {
    const grp = new THREE.Group();
    const body = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.16, 0], [0.17, 0.02], [0.17, 0.36], [0.12, 0.44], [0.06, 0.47], [0.06, 0.53]].map(([x, y]) => new THREE.Vector2(x, y)), 40),
      new THREE.MeshPhysicalMaterial({ color: 0x8a4a1c, transmission: 0.55, roughness: 0.08, thickness: 0.3, ior: 1.5, attenuationColor: new THREE.Color('#5a2a08'), attenuationDistance: 0.3 }));
    const lt = canvasTex(256, 128); lt.g.fillStyle = '#fbf8ef'; lt.g.fillRect(0, 0, 256, 128); lt.g.strokeStyle = '#c0392b'; lt.g.lineWidth = 6; lt.g.strokeRect(6, 6, 244, 116);
    lt.g.fillStyle = '#1d2b3a'; lt.g.font = '900 44px Pretendard, sans-serif'; lt.g.textAlign = 'center'; lt.g.textBaseline = 'middle'; lt.g.fillText('묽은 염산', 128, 56);
    lt.g.font = '700 22px Pretendard, sans-serif'; lt.g.fillStyle = '#c0392b'; lt.g.fillText('피부에 닿지 않게', 128, 98); lt.t.needsUpdate = true;
    const label = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.16, 40, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: lt.t, roughness: 0.7 }));
    label.position.y = 0.19;
    grp.add(body, label); grp.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return grp;
  }
  /* 이름 카드 */
  function makeCard(text, sub) {
    const ct = canvasTex(256, 112), g = ct.g;
    g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(4, 4, 248, 104, 18); g.fill(); g.strokeStyle = '#d7dee6'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#14263b'; g.font = `900 ${sub ? 44 : 50}px Pretendard, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, sub ? 44 : 58);
    if (sub) { g.font = '700 24px Pretendard, sans-serif'; g.fillStyle = '#6b7b8d'; g.fillText(sub, 128, 84); }
    ct.t.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.012, 0.2), [0, 0, 0, 0, 0, 0].map((_, i) => i === 2 ? new THREE.MeshStandardMaterial({ map: ct.t, roughness: 0.6 }) : new THREE.MeshStandardMaterial({ color: 0xf2f2f2 })));
    m.receiveShadow = true; m.position.y = 0.006; m.userData.redraw = (t2, s2) => { const n = makeCard(t2, s2); m.material = n.material; };
    return m;
  }

  /* 가장 낮은 점 (월드) */
  const _v = V();
  function lowest(obj) {
    obj.updateMatrixWorld(true); let best = null;
    obj.traverse((o) => { if (!o.isMesh) return; const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i += 1) { _v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); if (!best || _v.y < best.y) best = _v.clone(); } });
    return best || obj.getWorldPosition(V());
  }
  const _rc = new THREE.Raycaster();
  function hitUp(objs, x, z) { _rc.set(V(x, -0.5, z), V(0, 1, 0)); const h = _rc.intersectObjects(objs, true)[0]; return h || null; }
  function hitDown(objs, x, z, from = 6) { _rc.set(V(x, from, z), V(0, -1, 0)); const h = _rc.intersectObjects(objs, true)[0]; return h || null; }

  /* ===== 실험실 만들기 ===== */
  function make(st, opt = {}) {
    const scene = st.scene, REDUCE = C3.REDUCE;
    scene.environment = MIN3D.studioEnv(st.renderer);
    C3.addTable(scene, 9, 6.4);
    st.sun.position.set(3.5, 9, 6); st.sun.shadow.camera.left = -6; st.sun.shadow.camera.right = 6; st.sun.shadow.camera.top = 6; st.sun.shadow.camera.bottom = -6; st.sun.shadow.mapSize.set(2048, 2048);
    // 실험 매트
    const mat = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.012, 3.7), new THREE.MeshStandardMaterial({ color: 0x75808c, roughness: 0.92 })); mat.position.set(0, 0.006, 0.15); mat.receiveShadow = true; scene.add(mat);
    const Y0 = 0.012;

    /* 시간 흐름(트윈) */
    const jobs = [];
    const tween = (dur, f, ease = C3.ease) => new Promise((res) => { jobs.push({ t: 0, dur: Math.max(0.01, dur), f, res, ease }); });
    const wait = (s) => tween(s, () => {});
    const ticks = [];
    st.onFrame((dt, t) => {
      dt *= window.LAB_SLOW || 1; // 검사용: ?slow=4 이면 4배 느리게
      for (let i = jobs.length - 1; i >= 0; i--) { const j = jobs[i]; j.t += dt; const k = Math.min(1, j.t / j.dur); j.f(j.ease(k), k, dt); if (k >= 1) { jobs.splice(i, 1); j.res(); } }
      ticks.forEach((f) => f(dt, t));
    });

    /* 도구 배치 */
    const WORK = V(0, Y0, 0.25);
    const dish = makeDish(); dish.position.copy(WORK); scene.add(dish);
    const plates = { white: makePlate('white'), black: makePlate('black') };
    plates.white.grp.position.set(-2.2, Y0, -0.1); plates.black.grp.position.set(-2.2, Y0, 1.02);
    plates.white.grp.rotation.y = 0.04; plates.black.grp.rotation.y = -0.03;
    scene.add(plates.white.grp, plates.black.grp);
    const clipHome = V(2.2, Y0, 0.95), clips = [];
    for (let i = 0; i < 6; i++) {
      const c = makeClip(CLIP_COLORS[i]); const a = i * 1.05 + 0.3, r = 0.08 + (i % 3) * 0.1;
      c.userData.home = { p: V(clipHome.x + Math.cos(a) * r - 0.12, Y0 + 0.006 + i * 0.0001, clipHome.z + Math.sin(a) * r * 0.8), ry: a * 1.7 };
      c.position.copy(c.userData.home.p); c.rotation.set(0, c.userData.home.ry, 0); scene.add(c); clips.push(c);
    }
    const bottle = makeBottle(); bottle.position.set(2.45, Y0, -0.35); scene.add(bottle);
    const dropper = makeDropper(); const dropHome = { p: V(2.45, Y0 + 0.36, -0.35), r: V(0, 0, 0) }; dropper.position.copy(dropHome.p); scene.add(dropper);

    /* 표본 받침 (뒤쪽 줄) */
    const specs = opt.specimens || [];
    const shelf = [];
    const n = specs.length, gap = Math.min(1.05, 6.0 / Math.max(1, n));
    specs.forEach((s, i) => {
      const model = MIN3D.make(s.id, s.seed); const x = (i - (n - 1) / 2) * gap, home = V(x, Y0, -1.25);
      const sc = 0.5 * (s.scale || 1);
      model.position.copy(home); model.scale.setScalar(sc); model.rotation.y = s.ry || 0; scene.add(model);
      const card = makeCard(s.label, s.sub); card.position.set(x, Y0 + 0.006, -0.72); scene.add(card);
      const item = { ...s, model, home, sc, card, x };
      if (opt.shelfLabels !== false) item.lb = st.label(s.label, 'small', V(x, Y0, -0.62));
      model.traverse((o) => { if (o.isMesh) o.userData.spec = item; });
      shelf.push(item);
    });

    let cur = null, busy = false;
    const lb = st.label('', 'small', () => (cur ? cur.model.localToWorld(V(0, (cur.model.userData.h || 1) + 0.25, 0)) : null)); lb.show = false;

    /* 카메라 */
    const VIEWS = {
      all: { p: V(0, 5.0, 5.0), t: V(0, 0.1, 0.05) },
      work: { p: V(0.15, 1.45, 2.15), t: V(0, 0.25, 0.25) },
      white: { p: V(-1.95, 1.55, 1.5), t: V(-2.2, 0.12, -0.1) },
      black: { p: V(-1.95, 1.55, 2.65), t: V(-2.2, 0.12, 1.02) },
      plates: { p: V(-1.55, 2.5, 3.0), t: V(-2.2, 0.1, 0.45) },
      clips: { p: V(1.8, 1.6, 2.85), t: V(2.05, 0.45, 0.85) },
      acid: { p: V(0.75, 0.82, 1.75), t: V(0, 0.42, 0.25) },
      scratch: { p: V(0.12, 1.15, 1.7), t: V(-0.05, 0.28, 0.28) },
    };
    function view(name, dur = 1.1) {
      const v = VIEWS[name]; if (!v) return;
      shelf.forEach((it) => { if (it.lb) it.lb.show = name === 'all'; });
      // 세로 화면이면 조금 더 뒤로
      const { W, H } = st.size(), k = W / H < 1 ? 1.45 : W / H < 1.3 ? 1.15 : 1;
      const p = v.t.clone().add(v.p.clone().sub(v.t).multiplyScalar(k)); st.flyTo(p, v.t, dur);
    }

    /* 표본 고르기: 받침에서 페트리 접시로 옮겨요 */
    async function bring(item, to = WORK, scale = 1) {
      const m = item.model, p0 = m.position.clone(), s0 = m.scale.x, r0 = m.rotation.clone();
      await tween(0.9, (e) => { m.position.lerpVectors(p0, to, e); m.position.y = p0.y + (to.y - p0.y) * e + Math.sin(e * Math.PI) * 0.7; m.scale.setScalar(s0 + (scale * 0.6 * (item.scale || 1) - s0) * e); m.rotation.x = r0.x * (1 - e); m.rotation.z = r0.z * (1 - e); });
    }
    async function putBack(item) {
      const m = item.model, p0 = m.position.clone(), s0 = m.scale.x, r0 = m.rotation.clone(), ry = item.ry || 0;
      await tween(0.8, (e) => { m.position.lerpVectors(p0, item.home, e); m.position.y = p0.y + (item.home.y - p0.y) * e + Math.sin(e * Math.PI) * 0.6; m.scale.setScalar(s0 + (item.sc - s0) * e); m.rotation.set(r0.x * (1 - e), r0.y + (ry - r0.y) * e, r0.z * (1 - e)); });
    }
    async function select(key) {
      if (busy) return false; const item = shelf.find((s) => s.key === key); if (!item || item === cur) return true;
      busy = true;
      try {
        await resetTools();
        if (cur) await putBack(cur);
        cur = item; await bring(item);
        lb.set(item.label); lb.show = !!opt.labelCur;
      } finally { busy = false; }
      return true;
    }

    /* 관찰: 들어 올려 천천히 돌려 봐요 */
    async function observe() {
      if (!cur || busy) return; busy = true;
      try {
        const m = cur.model, p0 = m.position.clone(), r0 = m.rotation.y;
        view('work');
        await tween(0.7, (e) => { m.position.y = p0.y + e * 0.35; });
        await tween(3.2, (e) => { m.rotation.y = r0 + e * Math.PI * 2; m.rotation.x = Math.sin(e * Math.PI * 2) * 0.25; }, (k) => k);
        await tween(0.6, (e) => { m.position.y = p0.y + (1 - e) * 0.35; });
      } finally { busy = false; }
    }

    /* 가루 알갱이 */
    const dust = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.006, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), 400);
    dust.count = 0; dust.castShadow = false; dust.frustumCulled = false; scene.add(dust);
    const dustP = []; const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion();
    function addDust(p, hex, groundY) {
      if (dust.count >= 400) return;
      const i = dust.count++; dustP.push({ p: p.clone(), v: V((Math.random() - 0.5) * 0.25, 0.15 + Math.random() * 0.2, (Math.random() - 0.5) * 0.25), g: groundY, s: 0.6 + Math.random() * 1.2 });
      dust.setColorAt(i, new THREE.Color(hex)); dust.instanceColor.needsUpdate = true;
    }
    ticks.push((dt) => {
      for (let i = 0; i < dust.count; i++) {
        const d = dustP[i]; if (d.p.y > d.g + 0.003) { d.v.y -= 3.2 * dt; d.p.addScaledVector(d.v, dt); if (d.p.y < d.g + 0.003) { d.p.y = d.g + 0.003; d.v.set(0, 0, 0); } }
        _m4.compose(d.p, _q, V(d.s * 0.7, d.s * 0.4, d.s * 0.7)); dust.setMatrixAt(i, _m4);
      }
      dust.instanceMatrix.needsUpdate = true;
    });
    function clearDust() { dust.count = 0; dustP.length = 0; }

    /* 조흔판에 긁기 */
    async function streak(which) {
      if (!cur || busy) return null; busy = true;
      const P = plates[which], m = cur.model, info = MIN3D.INFO[cur.id] || {}, hex = info.sHex;
      try {
        view(which);
        const pp = P.grp.position, topY = pp.y + P.top;
        const p0 = m.position.clone(), r0 = m.rotation.clone();
        // 광물을 기울여 모서리가 아래로 오게
        const tilt = V(0.55, r0.y, 0.42);
        await tween(0.9, (e) => { m.position.lerpVectors(p0, V(pp.x - 0.3, topY + 0.6, pp.z), e); m.position.y += Math.sin(e * Math.PI) * 0.4; m.rotation.set(r0.x + (tilt.x - r0.x) * e, r0.y, r0.z + (tilt.z - r0.z) * e); });
        const low = lowest(m), off = low.clone().sub(m.position);
        await tween(0.45, (e) => { m.position.y = (topY + 0.6) * (1 - e) + (topY - off.y - 0.004) * e; });
        const yC = topY - off.y - 0.004;
        let last = null, made = 0;
        const strokes = 3;
        for (let s = 0; s < strokes; s++) {
          const xa = pp.x - 0.45, xb = pp.x + 0.4, zz = pp.z + (s - 1) * 0.02;
          const from = s % 2 ? xb : xa, to = s % 2 ? xa : xb;
          await tween(0.75, (e, k, dt) => {
            m.position.set(from + (to - from) * e, yC + Math.sin(e * Math.PI * 9) * 0.0015, zz);
            const c = m.position.clone().add(off); c.y = topY;
            if (last) {
              const d = c.distanceTo(last), N = Math.max(1, Math.ceil(d / 0.006));
              for (let i = 1; i <= N; i++) {
                const q = last.clone().lerp(c, i / N);
                if (hex) { P.dab(q, hex, 1, 0.02); if (Math.random() < 0.08) addDust(q.clone().setY(topY + 0.01), hex, topY); made++; } else if (Math.random() < 0.3) P.scuff(q);
              }
            }
            last = c;
          }, (k) => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
        }
        await tween(0.5, (e) => { m.position.y = yC + e * 0.45; });
        const p1 = m.position.clone();
        await tween(0.9, (e) => { m.position.lerpVectors(p1, WORK, e); m.position.y += Math.sin(e * Math.PI) * 0.2; m.rotation.set(tilt.x * (1 - e) + r0.x * e, r0.y, tilt.z * (1 - e) + r0.z * e); });
        m.position.copy(WORK); m.rotation.copy(r0);
        const visible = !!hex && !((which === 'white' && info.streak === '흰색'));
        return { hex, streak: info.streak, visible, which };
      } finally { busy = false; }
    }

    /* 클립 가져다 대기 */
    async function magnet() {
      if (!cur || busy) return null; busy = true;
      const m = cur.model, info = MIN3D.INFO[cur.id] || {};
      try {
        view('clips');
        const p0 = m.position.clone(), above = V(clipHome.x - 0.12, 0, clipHome.z);
        await tween(1.0, (e) => { m.position.lerpVectors(p0, V(above.x, 0.75, above.z), e); m.position.y += Math.sin(e * Math.PI) * 0.3; });
        const low = lowest(m), off = low.y - m.position.y, hoverY = Y0 + 0.11 - off;
        const live = info.magnet ? clips.map((c) => ({ c, v: V(), stuck: false, target: null, d0: 0 })) : [];
        let lowered = false;
        // 클립이 광물 쪽으로 끌려와요 (가까울수록 세게)
        const tickFn = (dt) => {
          if (!lowered) return;
          live.forEach((L) => {
            if (L.stuck) return;
            const c = L.c, end = c.localToWorld(V(0.29, 0, 0.004));
            if (!L.target) {
              const gx = end.x * 0.55 + m.position.x * 0.45, gz = end.z * 0.55 + m.position.z * 0.45, h = hitUp([m], gx, gz);
              L.target = h ? h.point.clone() : lowest(m);
            }
            if (!L.local) L.local = m.worldToLocal(L.target.clone());
            const tw = m.localToWorld(L.local.clone());
            const dir = tw.clone().sub(end), d = dir.length();
            if (d < 0.02) { L.stuck = true; m.attach(c); L.hang = 0; return; }
            const a = Math.min(4.5, 0.05 / (d * d + 0.012));
            L.v.addScaledVector(dir.normalize(), a * dt); L.v.multiplyScalar(0.93);
            c.position.addScaledVector(L.v, dt);
            // 끝이 먼저 들리며 몸통이 따라와요
            c.rotation.z = Math.min(1.2, c.rotation.z + dt * 2.2 * Math.min(1, a / 2));
          });
        };
        ticks.push(tickFn);
        await tween(1.0, (e) => { m.position.y = 0.75 + (hoverY - 0.75) * e; });
        lowered = true;
        await wait(info.magnet ? 1.6 : 1.2);
        // 들어 올리기
        const hy = m.position.y;
        await tween(1.1, (e) => { m.position.y = hy + e * 0.5; m.children.forEach((ch) => { if (ch.userData.home) ch.rotation.z = Math.min(1.45, ch.rotation.z + 0.02); }); });
        ticks.splice(ticks.indexOf(tickFn), 1);
        await wait(0.6);
        const stuck = live.filter((L) => L.stuck).length;
        return { stuck, magnet: !!info.magnet };
      } finally { busy = false; }
    }
    async function dropClips() {
      const m = cur && cur.model; const att = clips.filter((c) => c.parent !== scene);
      att.forEach((c) => scene.attach(c));
      const st0 = clips.map((c) => ({ p: c.position.clone(), r: c.rotation.clone() }));
      await tween(att.length ? 0.6 : 0.01, (e) => { clips.forEach((c, i) => { const h = c.userData.home; c.position.lerpVectors(st0[i].p, h.p, e); c.rotation.set(st0[i].r.x * (1 - e), st0[i].r.y + (h.ry - st0[i].r.y) * e, st0[i].r.z * (1 - e)); }); }, (k) => k * k);
      if (m && m.position.distanceTo(WORK) > 0.01) { const p0 = m.position.clone(); await tween(0.8, (e) => { m.position.lerpVectors(p0, WORK, e); m.position.y += Math.sin(e * Math.PI) * 0.25; }); }
    }

    /* 묽은 염산 떨어뜨리기 */
    const dropMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, roughness: 0.02, thickness: 0.05, ior: 1.33 });
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.032, 20, 14), dropMat); drop.visible = false; scene.add(drop);
    const films = [];
    const bub = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.03, metalness: 0.1, transparent: true, opacity: 0.62, envMapIntensity: 2.2, depthWrite: false }), 220);
    bub.count = 0; bub.frustumCulled = false; scene.add(bub);
    let bubbles = [], fizz = null;
    ticks.push((dt) => {
      if (fizz && fizz.left > 0) {
        fizz.left -= dt; const rate = 90 * Math.min(1, fizz.left / 2 + 0.2);
        fizz.acc += dt * rate;
        while (fizz.acc > 1 && bubbles.length < 220) {
          fizz.acc -= 1; const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * fizz.r;
          const x = fizz.c.x + Math.cos(a) * r, z = fizz.c.z + Math.sin(a) * r, h = hitDown([fizz.m], x, z, 3);
          if (h) bubbles.push({ p: h.point.clone(), n: h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : V(0, 1, 0), r: 0, rm: 0.004 + Math.random() * 0.011, life: 0, max: 0.6 + Math.random() * 1.4, up: Math.random() < 0.25 });
        }
      }
      bubbles = bubbles.filter((b) => b.life < b.max);
      bubbles.forEach((b, i) => {
        b.life += dt; const k = b.life / b.max; b.r = b.rm * Math.min(1, k * 3) * (k > 0.92 ? (1 - k) / 0.08 : 1);
        if (b.up && k > 0.5) b.p.y += dt * 0.12; else b.p.addScaledVector(b.n, dt * 0.004);
        _m4.compose(b.p.clone().addScaledVector(b.n, b.r * 0.6), _q, V(b.r, b.r, b.r)); bub.setMatrixAt(i, _m4);
      });
      bub.count = bubbles.length; bub.instanceMatrix.needsUpdate = true;
    });
    async function acid() {
      if (!cur || busy) return null; busy = true;
      const m = cur.model, info = MIN3D.INFO[cur.id] || {};
      try {
        view('acid');
        // 표본 윗면에서 방울이 떨어질 곳
        m.updateMatrixWorld(true);
        const tx = m.position.x + 0.05, tz = m.position.z + 0.04, hit = hitDown([m], tx, tz, 4), ty = hit ? hit.point.y : m.position.y + 0.3;
        const d0 = dropper.position.clone(), r0 = dropper.rotation.clone(), tip = V(tx, ty + 0.3, tz);
        await tween(1.2, (e) => { dropper.position.lerpVectors(d0, tip, e); dropper.position.y += Math.sin(e * Math.PI) * 0.5; dropper.rotation.z = r0.z * (1 - e); });
        // 꼭지를 누르면 방울이 맺혀요
        drop.visible = true; drop.position.set(tx, tip.y - 0.005, tz);
        await tween(0.9, (e) => { drop.scale.set(0.3 + e * 0.7, 0.3 + e * 0.9, 0.3 + e * 0.7); drop.position.y = tip.y - 0.01 - e * 0.025; dropper.children[2].scale.set(1 - Math.sin(e * Math.PI) * 0.15, 1, 1 - Math.sin(e * Math.PI) * 0.15); });
        // 떨어지기 (점점 빨라져요)
        const y0 = drop.position.y; let vy = 0;
        await new Promise((res) => { const f = (dt) => { vy += 6 * dt; drop.position.y -= vy * dt; drop.scale.y = 1.2 + vy * 0.18; drop.scale.x = drop.scale.z = 1 - vy * 0.05; if (drop.position.y <= ty + 0.02) { ticks.splice(ticks.indexOf(f), 1); res(); } }; ticks.push(f); });
        drop.visible = false;
        // 표면에 퍼지는 액체 막
        const film = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), dropMat);
        const nrm = hit && hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : V(0, 1, 0);
        film.position.set(tx, ty - 0.002, tz); film.quaternion.setFromUnitVectors(V(0, 1, 0), nrm); scene.add(film); films.push(film);
        await tween(0.5, (e) => { const r = 0.015 + e * 0.045; film.scale.set(r, 0.006 + 0.01 * (1 - e), r); });
        if (info.acid) fizz = { c: V(tx, 0, tz), r: 0.09, m, left: 5.5, acc: 0 };
        // 스포이트 돌려놓기
        const d1 = dropper.position.clone();
        tween(1.1, (e) => { dropper.position.lerpVectors(d1, dropHome.p, e); dropper.position.y += Math.sin(e * Math.PI) * 0.4; });
        await wait(info.acid ? 2.6 : 1.8);
        return { acid: !!info.acid };
      } finally { busy = false; }
    }
    function clearAcid() { films.forEach((f) => { scene.remove(f); f.geometry.dispose(); }); films.length = 0; bubbles = []; fizz = null; bub.count = 0; }

    /* 굳기: 석영과 방해석을 서로 긁기 */
    let scr = null;
    async function hardness(mode) {
      if (busy) return null; busy = true;
      try {
        await resetTools(true);
        const q = shelf.find((s) => s.id === 'quartz'), c = shelf.find((s) => s.id === 'calcite');
        if (!q || !c) return null;
        if (!scr) {
          scr = { piece: MIN3D.make('quartzPiece'), marks: new THREE.Group() }; scr.piece.scale.setScalar(0.55); scr.piece.visible = false; scene.add(scr.piece, scr.marks);
        }
        if (cur && cur !== c) { await putBack(cur); cur = null; }
        view('scratch');
        if (cur !== c) { cur = c; await bring(c, V(-0.25, Y0, 0.3), 0.95); }
        const cm = c.model; cm.updateMatrixWorld(true);
        // 석영 조각 준비
        const P = scr.piece; P.visible = true;
        const soft = mode === 'q-on-c' ? cm : P, hard = mode === 'q-on-c' ? P : cm;
        let tool, target;
        if (mode === 'q-on-c') { tool = P; target = cm; P.position.set(0.7, 0.9, 0.3); P.rotation.set(0, 0, -0.9); }
        else { // 석영을 눕히고 방해석 모서리로 긁어요
          await putBack(c); cur = null;
          P.position.set(-0.2, Y0, 0.35); P.rotation.set(0, 0.3, 0); tool = c.model; target = P;
          await bring(c, V(0.8, 0.9, 0.3), 0.6); cur = c;
        }
        target.updateMatrixWorld(true);
        const hb = new THREE.Box3().setFromObject(target, true), cx = (hb.min.x + hb.max.x) / 2, cz = (hb.min.z + hb.max.z) / 2;
        const xa = cx - (hb.max.x - hb.min.x) * 0.28, xb = cx + (hb.max.x - hb.min.x) * 0.28;
        const tlow = lowest(tool), toff = tlow.clone().sub(tool.position);
        const pts = []; for (let i = 0; i <= 24; i++) { const x = xa + (xb - xa) * (i / 24), z = cz + Math.sin(i / 24 * 3) * 0.02; const h = hitDown([target], x, z, 4); if (h) pts.push(h.point.clone().add(V(0, 0.002, 0))); }
        if (pts.length < 4) return null;
        const t0 = tool.position.clone();
        await tween(0.9, (e) => { tool.position.lerpVectors(t0, pts[0].clone().sub(toff).add(V(0, 0.25, 0)), e); });
        await tween(0.35, (e) => { tool.position.copy(pts[0].clone().sub(toff).add(V(0, 0.25 * (1 - e), 0))); });
        let line = null;
        if (mode === 'q-on-c') {
          const curve = new THREE.CatmullRomCurve3(pts.map((p, i) => p.clone().add(V(0, (Math.random() - 0.5) * 0.003, (Math.random() - 0.5) * 0.004))));
          const g = new THREE.TubeGeometry(curve, 96, 0.0075, 5, false);
          line = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xf7f5ef, roughness: 1, emissive: 0x444444 })); line.geometry.setDrawRange(0, 0); scr.marks.add(line);
          cm.attach(line);
        }
        const strokes = 2;
        for (let s = 0; s < strokes; s++) {
          await tween(1.1, (e) => {
            const k = s % 2 ? 1 - e : e, f = k * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), u = f - i;
            const p = pts[i].clone().lerp(pts[i + 1], u); tool.position.copy(p.sub(toff)); tool.position.y += Math.sin(e * 40) * 0.001;
            if (line && s === 0) line.geometry.setDrawRange(0, Math.floor(e * 96) * 5 * 6);
            if (Math.random() < 0.12) { const q2 = pts[i].clone(); addDust(q2.add(V(0, 0.01, 0)), mode === 'q-on-c' ? '#f4f2ec' : '#efece4', Y0); }
          }, (k) => k);
        }
        if (line) line.geometry.setDrawRange(0, Infinity);
        const t1 = tool.position.clone();
        await tween(0.8, (e) => { tool.position.lerpVectors(t1, t1.clone().add(V(0.25, 0.45, 0)), e); });
        return { scratched: mode === 'q-on-c' ? '방해석' : null };
      } finally { busy = false; }
    }

    async function resetTools(keepScratch) {
      clearAcid(); clearDust();
      if (clips.some((c) => c.parent !== scene) || clips.some((c) => c.position.distanceTo(c.userData.home.p) > 0.01)) await dropClips();
      if (scr && !keepScratch) { scr.piece.visible = false; scr.marks.clear(); shelf.forEach((s) => s.model.traverse((o) => { o.children.filter((ch) => ch.isMesh && ch.geometry.type === 'TubeGeometry').forEach((ch) => o.remove(ch)); })); }
    }
    function clearPlates() { plates.white.clear(); plates.black.clear(); clearDust(); }

    // 처음 쓸 때 화면이 멈추지 않도록 재질(셰이더)을 미리 준비해요
    function warm() {
      try {
        const extra = MIN3D.make('quartzPiece'); extra.position.set(0, -3, 0); scene.add(extra);
        const film = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 4), dropMat); film.position.set(0, -3, 0); scene.add(film);
        drop.visible = true; bub.count = 1; dust.count = 1; _m4.compose(V(0, -3, 0), _q, V(0.01, 0.01, 0.01)); bub.setMatrixAt(0, _m4); dust.setMatrixAt(0, _m4);
        st.renderer.compile(scene, st.camera);
        st.renderer.render(scene, st.camera);
        scene.remove(extra, film); drop.visible = false; bub.count = 0; dust.count = 0;
        scr = { piece: extra, marks: new THREE.Group() }; extra.scale.setScalar(0.4); extra.visible = false; scene.add(extra, scr.marks);
      } catch (e) { console.warn(e); }
    }
    warm();
    view('all', 0);
    return { _d: { dropper, drop, bub, films, get fizz() { return fizz; } }, shelf, select, observe, streak, magnet, acid, hardness, resetTools, clearPlates, dropClips, view, get cur() { return cur; }, get busy() { return busy; }, plates, tween, wait, WORK };
  }
  return { make, makePlate, makeClip, makeDish, makeDropper, makeBottle, makeCard, lowest, hitDown };
})();
