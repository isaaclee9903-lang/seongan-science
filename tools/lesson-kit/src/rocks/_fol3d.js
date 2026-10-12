/* ===== 엽리의 형성 과정 (교과서 그림 Ⅱ-8을 3D로) =====
   - 정육면체 암석 덩어리 겉면에 여러 광물 입자(어두운 판 모양, 주황빛 길쭉한 알갱이, 밝은 알갱이)가 제멋대로 놓여 있어요.
   - 「열과 압력 가하기」: 양옆 판이 밀고 들어오면 덩어리가 옆으로 눌리고 위로 늘어나며,
     광물 입자가 압력을 받는 방향(옆)과 수직이 되도록 돌아 서서 세로 줄무늬(엽리)가 생겨요. 입자도 조금 커져요.
   - 입자 개수·크기·눌리는 정도는 개념 이해를 위한 모형이에요. 이 조각 앞에 THREE, C3가 있어야 해요. */
const FOL3D = (() => {
  const V = C3.V;
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function make(st, o = {}) {
    const R = rng(o.seed || 77), H = 0.8; // 덩어리 반지름(처음)
    const frame = new THREE.Group(); st.scene.add(frame);
    const SX = 0.7, SY = 1.3, SZ = 1.04; // 눌린 뒤 비율
    // 바탕 덩어리
    const tex = C3.canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#d9d6cf'; g.fillRect(0, 0, w, h); for (let i = 0; i < 26000; i++) { const v = 150 + Math.random() * 90 | 0; g.fillStyle = `rgba(${v},${v - 4},${v - 10},${0.35 + Math.random() * 0.4})`; const s = 1 + Math.random() * 3; g.fillRect(Math.random() * w, Math.random() * h, s, s); } });
    const block = new THREE.Mesh(new THREE.BoxGeometry(2 * H * 0.985, 2 * H * 0.985, 2 * H * 0.985), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
    block.castShadow = block.receiveShadow = true; frame.add(block);
    // 광물 입자 세 종류 (긴 축 = 자기 y, 얇은 축 = 자기 x)
    const TYPES = [
      { n: 240, size: [0.02, 0.12, 0.075], col: 0x23262b, rough: 0.3, metal: 0.15, geo: new THREE.CylinderGeometry(1, 1, 1, 7) },   // 어두운 판 모양
      { n: 150, size: [0.035, 0.11, 0.055], col: 0xd8803a, rough: 0.55, metal: 0, geo: new THREE.IcosahedronGeometry(1, 1) },       // 주황빛 길쭉한 알갱이
      { n: 420, size: [0.04, 0.06, 0.05], col: 0xc8c6c0, rough: 0.6, metal: 0, geo: new THREE.IcosahedronGeometry(1, 0) },        // 밝은 알갱이
    ];
    TYPES[0].geo.rotateZ(Math.PI / 2); // 원기둥의 납작한 면이 x를 보게
    const grains = [], _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = V(), _s = V(), _e = new THREE.Euler();
    TYPES.forEach((T, ti) => {
      const mat = new THREE.MeshStandardMaterial({ color: T.col, roughness: T.rough, metalness: T.metal });
      const im = new THREE.InstancedMesh(T.geo, mat, T.n); im.castShadow = true; im.receiveShadow = true; frame.add(im);
      const col = new THREE.Color();
      for (let i = 0; i < T.n; i++) {
        // 겉면 근처에만 놓아요 (안쪽은 바탕 덩어리에 가려져요)
        const p = V((R() * 2 - 1) * H, (R() * 2 - 1) * H, (R() * 2 - 1) * H), ax = Math.floor(R() * 3), sgn = R() < 0.5 ? -1 : 1;
        if (ax === 0) p.x = sgn * H * (0.97 + R() * 0.02); else if (ax === 1) p.y = sgn * H * (0.97 + R() * 0.02); else p.z = sgn * H * (0.97 + R() * 0.02);
        if (p.y < -H * 0.96) p.y = H * 0.97; // 바닥면 대신 윗면
        const q0 = new THREE.Quaternion().setFromEuler(_e.set(R() * 6.28, R() * 6.28, R() * 6.28));
        // 윗면 입자는 긴 축이 앞뒤(z)로 눕고, 나머지는 세로로 서요. 어느 쪽이든 얇은 축은 압력 방향(x)
        const top = Math.abs(p.y) > H * 0.96, q1 = new THREE.Quaternion().setFromEuler(_e.set((top ? Math.PI / 2 : 0) + (R() - 0.5) * 0.3, (R() - 0.5) * 0.16, (R() - 0.5) * 0.1));
        const k = 0.7 + R() * 0.6;
        grains.push({ im, i, p0: p, q0, q1, s: V(T.size[0] * k, T.size[1] * k, T.size[2] * k) });
        col.set(T.col).multiplyScalar(0.82 + R() * 0.3); im.setColorAt(i, col);
      }
    });
    const arrowMat = new THREE.MeshStandardMaterial({ color: 0xf08a2a, roughness: 0.4, emissive: 0x7a3000, emissiveIntensity: 0.25 });
    const plateMat = new THREE.MeshPhysicalMaterial({ color: 0x9aa6b2, metalness: 0.8, roughness: 0.3, transparent: true, opacity: 0.55 });
    const sides = [-1, 1].map((sg) => {
      const g = new THREE.Group();
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.3, 1.85), plateMat); plate.position.y = 1.15; g.add(plate);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 18), arrowMat); shaft.rotation.z = Math.PI / 2; shaft.position.set(sg * 0.33, 1.0, 0); g.add(shaft);
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.32, 24), arrowMat); head.rotation.z = sg * Math.PI / 2; head.position.set(sg * 0.02 + sg * 0.1, 1.0, 0); g.add(head);
      g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
      frame.add(g); return { g, sg };
    });
    const lbP = sides.map((s) => st.label('압력', 'T', () => s.g.localToWorld(V(s.sg * 0.45, 1.32, 0))));
    lbP.forEach((l) => (l.el.style.background = '#e07a2a'));
    const title = st.label('원래 암석', 'T', () => V(0, 2 * H * (1 + (SY - 1) * k) + 0.45, 0)); title.el.style.background = '#6b7b80';

    let k = 0, busy = false;
    function apply() {
      const e = k, sx = 1 + (SX - 1) * e, sy = 1 + (SY - 1) * e, sz = 1 + (SZ - 1) * e, grow = 1 + 0.12 * e;
      block.scale.set(sx, sy, sz); block.position.y = H * sy;
      grains.forEach((G) => {
        _p.set(G.p0.x * sx, G.p0.y * sy + H * sy, G.p0.z * sz);
        _q.slerpQuaternions(G.q0, G.q1, e);
        _s.copy(G.s).multiplyScalar(grow); _s.y *= 1 + 0.3 * e;
        _m.compose(_p, _q, _s); G.im.setMatrixAt(G.i, _m);
      });
      frame.children.forEach((c) => { if (c.isInstancedMesh) c.instanceMatrix.needsUpdate = true; });
      sides.forEach((S) => { S.g.position.set(S.sg * (H * sx + 0.06), 0, 0); });
      title.set(e > 0.98 ? '변성암 · 엽리' : '원래 암석'); title.el.style.background = e > 0.98 ? '#3f7f5a' : '#6b7b80';
    }
    apply();
    let job = null;
    st.onFrame((dt) => { if (!job) return; job.t += dt; const u = Math.min(1, job.t / job.dur), ee = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; k = job.k0 + (job.to - job.k0) * ee; apply(); if (u >= 1) { const r = job.res; job = null; busy = false; r(); } });
    const run = (to, dur) => new Promise((res) => {
      if (C3.REDUCE) { k = to; apply(); return res(); }
      busy = true; job = { k0: k, to, dur, t: 0, res };
    });
    // 바깥 크기 (자동 구도용)
    const ext = new THREE.Mesh(new THREE.BoxGeometry(3.3, 2 * H * SY + 0.5, 2.1), new THREE.MeshBasicMaterial({ visible: false })); ext.position.y = (2 * H * SY + 0.5) / 2; frame.add(ext);
    return { frame, press: () => run(1, 3.6), reset: () => run(0, 1.4), get busy() { return busy; } };
  }
  return { make };
})();
