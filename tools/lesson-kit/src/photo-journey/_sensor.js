/* ===== 이미지 센서 모형 =====
   칸(픽셀)마다 위에서부터 마이크로 렌즈 → 컬러 필터 → 빛을 받는 칸이 있어요.
   필터는 같은 색 4칸이 모인 무늬(초록이 빨강·파랑의 2배)로 놓았어요. 칸에 쌓이는 빛 막대는 받은 빛의 양이에요.
   실제 센서는 수천만~2억 칸이에요. 칸 수·크기·빛 알갱이는 개념 이해를 위한 모형이에요. */
const SENSOR = (() => {
  const { mesh } = C3;
  const COL = { R: 0xe5484d, G: 0x30a46c, B: 0x3e63dd };
  const CH = { R: 0, G: 1, B: 2 };
  function filterOf(i, j) { const a = Math.floor(i / 2) % 2, b = Math.floor(j / 2) % 2; return a === b ? 'G' : a === 1 ? 'R' : 'B'; }
  function make(scene, o = {}) {
    const nx = o.nx || 8, ny = o.ny || 8, p = o.pitch || 0.62;
    const root = new THREE.Group(); scene.add(root);
    // 실리콘 판
    const plate = mesh(new RoundedBoxGeometry(nx * p + 0.5, 0.3, ny * p + 0.5, 3, 0.08), new THREE.MeshStandardMaterial({ color: 0x3a3f4a, metalness: 0.5, roughness: 0.35 }), 0, -0.15, 0);
    root.add(plate);
    const wellG = new THREE.BoxGeometry(0.88 * p, 0.5, 0.88 * p), wellM = new THREE.MeshPhysicalMaterial({ color: 0x5a6476, metalness: 0.1, roughness: 0.25, transparent: true, opacity: 0.28, depthWrite: false });
    const floorM = new THREE.MeshStandardMaterial({ color: 0x1c1f26, roughness: 0.5 }), floorG = new THREE.BoxGeometry(0.9 * p, 0.04, 0.9 * p);
    const fillG = new THREE.CylinderGeometry(0.3 * p, 0.3 * p, 1, 20);
    const filtG = new THREE.BoxGeometry(0.92 * p, 0.07, 0.92 * p);
    const lensG = new THREE.SphereGeometry(0.44 * p, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const lensM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.3, depthWrite: false });
    const tileG = new THREE.BoxGeometry(0.94 * p, 0.05, 0.94 * p);
    const filtM = { R: null, G: null, B: null };
    Object.keys(filtM).forEach((k) => (filtM[k] = new THREE.MeshStandardMaterial({ color: COL[k], emissive: COL[k], emissiveIntensity: 0.25, roughness: 0.3, transparent: true, opacity: 0.5, depthWrite: false })));
    const px = [], fills = [], filters = [], lenses = [], tiles = [];
    const posX = (i) => (i - (nx - 1) / 2) * p, posZ = (j) => (j - (ny - 1) / 2) * p;
    for (let j = 0; j < ny; j++) {
      px.push([]);
      for (let i = 0; i < nx; i++) {
        const f = filterOf(i, j), x = posX(i), z = posZ(j);
        const c = PHOTO.cell(i / nx, j / ny, (i + 1) / nx, (j + 1) / ny);
        const w = new THREE.Mesh(wellG, wellM); w.position.set(x, 0.25, z); w.renderOrder = 2; w.userData = { i, j }; root.add(w); root.add(mesh(floorG, floorM, x, 0.02, z));
        const fm = new THREE.MeshStandardMaterial({ color: COL[f], emissive: COL[f], emissiveIntensity: 1.4, roughness: 0.3 });
        const fl = mesh(fillG, fm, x, 0.3, z); fl.userData = { i, j }; root.add(fl);
        const ft = mesh(filtG, filtM[f], x, 0.56, z); ft.castShadow = false; root.add(ft);
        const ln = new THREE.Mesh(lensG, lensM); ln.position.set(x, 0.6, z); ln.scale.y = 0.6; root.add(ln);
        const tm = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
        const tl = new THREE.Mesh(tileG, tm); tl.position.set(x, 0.66, z); tl.visible = false; root.add(tl);
        const cell = { i, j, f, c, val: 0, noise: 0, fill: fl, fm, tile: tl, tm, x, z };
        px[j].push(cell); fills.push(fl); filters.push(ft); lenses.push(ln); tiles.push(tl);
      }
    }
    // 4칸 묶음
    const groups = [];
    for (let j = 0; j + 1 < ny; j += 2) for (let i = 0; i + 1 < nx; i += 2) {
      const f = filterOf(i, j), x = (posX(i) + posX(i + 1)) / 2, z = (posZ(j) + posZ(j + 1)) / 2;
      const gm = new THREE.MeshStandardMaterial({ color: COL[f], emissive: COL[f], emissiveIntensity: 1.1, roughness: 0.3, transparent: true, opacity: 0.92 });
      const big = mesh(new THREE.CylinderGeometry(0.72 * p, 0.72 * p, 1, 28), gm, x, 0.3, z); big.visible = false; root.add(big);
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.9 * p, 0.62, 1.9 * p)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
      edge.position.set(x, 0.3, z); edge.visible = false; root.add(edge);
      groups.push({ cells: [px[j][i], px[j][i + 1], px[j + 1][i], px[j + 1][i + 1]], big, edge, f, x, z, val: 0 });
    }
    // 고른 칸 표시
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58 * p, 0.035, 10, 40), new THREE.MeshBasicMaterial({ color: 0xffd34d })); ring.rotation.x = Math.PI / 2; ring.visible = false; root.add(ring);
    // 빛 알갱이
    const N = o.particles || 200, pg = new THREE.SphereGeometry(0.045, 8, 6);
    const pm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false });
    const parts = new THREE.InstancedMesh(pg, pm, N); parts.frustumCulled = false; root.add(parts);
    const P = [];
    for (let k = 0; k < N; k++) P.push({ i: Math.floor(Math.random() * nx), j: Math.floor(Math.random() * ny), s: Math.random(), dx: (Math.random() - 0.5) * 0.3 * p, dz: (Math.random() - 0.5) * 0.3 * p });
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), sc = new THREE.Vector3(), cW = new THREE.Color(0xffe27a), cT = new THREE.Color();
    for (let k = 0; k < N; k++) parts.setColorAt(k, cW);
    const S = { bright: 1, explode: 0, ex: 0, bin: false, mode: 'fill', flow: 1, pick: null };
    let noiseT = 0;
    function measure() {
      const dark = 1 - S.bright;
      px.flat().forEach((c) => { const base = c.c[CH[c.f]] * S.bright; c.val = Math.max(0, Math.min(255, Math.round(base + c.noise * (6 + 46 * dark)))); });
      groups.forEach((g) => { g.val = g.cells.reduce((a, c) => a + c.val, 0); });
    }
    function update(dt, t) {
      noiseT -= dt;
      if (noiseT <= 0 && !S.freeze) { noiseT = 0.35; px.flat().forEach((c) => (c.noise = Math.random() * 2 - 1)); }
      measure();
      S.ex += (S.explode - S.ex) * Math.min(1, dt * 4);
      const color = S.mode === 'color';
      px.flat().forEach((c) => {
        const h = Math.max(0.02, (c.val / 255) * 0.44);
        c.fill.scale.y += (h - c.fill.scale.y) * Math.min(1, dt * 6); c.fill.position.y = 0.04 + c.fill.scale.y / 2;
        c.fill.visible = !S.bin;
        c.tile.visible = color;
        if (color) { const k = Math.min(1.25, S.bright * 1.05); cT.setRGB(Math.min(255, c.c[0] * k + c.noise * 40 * (1 - S.bright)) / 255, Math.min(255, c.c[1] * k + c.noise * 40 * (1 - S.bright)) / 255, Math.min(255, c.c[2] * k + c.noise * 40 * (1 - S.bright)) / 255); cT.convertSRGBToLinear(); c.tm.color.copy(cT); c.tm.opacity = Math.min(1, c.tm.opacity + dt * 2.5); }
        else c.tm.opacity = 0;
      });
      filters.forEach((f) => { f.position.y = 0.56 + S.ex * 0.75; f.visible = !color; });
      lenses.forEach((l) => { l.position.y = 0.6 + S.ex * 1.5; l.visible = !color; });
      groups.forEach((g) => {
        g.big.visible = g.edge.visible = S.bin && !color;
        const h = Math.max(0.03, Math.min(0.62, (g.val / 255) * 0.44)); g.big.scale.y += (h - g.big.scale.y) * Math.min(1, dt * 6); g.big.position.y = 0.04 + g.big.scale.y / 2;
      });
      if (S.pick) { const c = px[S.pick.j][S.pick.i]; ring.visible = true; ring.position.set(c.x, color ? 0.72 : 0.52, c.z); ring.rotation.z = t * 1.5; } else ring.visible = false;
      // 빛 알갱이: 위에서 내려와 렌즈를 지나 필터를 통과하면 필터 색만 남아요
      const yTop = 3.4, yL = 0.62 + S.ex * 1.5, yF = 0.56 + S.ex * 0.75, show = Math.round(N * (0.12 + 0.88 * S.bright) * S.flow);
      for (let k = 0; k < N; k++) {
        const a = P[k], c = px[a.j][a.i];
        if (k >= show || color) { sc.set(0, 0, 0); m4.compose(v3.set(0, -9, 0), q, sc); parts.setMatrixAt(k, m4); continue; }
        a.s += dt * 0.55; if (a.s > 1) { a.s -= 1; a.i = Math.floor(Math.random() * nx); a.j = Math.floor(Math.random() * ny); }
        const y = yTop - (yTop - 0.12) * a.s;
        const shrink = y < yL ? 0.35 : 1;
        v3.set(c.x + a.dx * shrink, y, c.z + a.dz * shrink);
        sc.setScalar(y < 0.2 ? 0.4 : 1); m4.compose(v3, q, sc); parts.setMatrixAt(k, m4);
        if (y < yF) { cT.set(COL[c.f]); parts.setColorAt(k, cT); } else parts.setColorAt(k, cW);
      }
      parts.instanceMatrix.needsUpdate = true; if (parts.instanceColor) parts.instanceColor.needsUpdate = true;
    }
    return { root, S, px, groups, nx, ny, p, update, measure, filterOf, fills, wells: root.children.filter((m) => m.geometry === wellG), COL, size: { w: nx * p, d: ny * p } };
  }
  return { make, filterOf, COL, CH };
})();
