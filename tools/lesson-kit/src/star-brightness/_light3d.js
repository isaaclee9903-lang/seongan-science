/* ===== 3D: 빛이 퍼지는 모습 (그림 Ⅷ-4처럼 광원에서 거리 1·2·3·4 배인 판) =====
   읽기 페이지와 시뮬레이션 ②가 같은 모형을 써요. 판의 칸 수와 밝기(1, 1/4, 1/9, 1/16 배)는 교과서 값이에요.
   빛 알갱이의 수·빠르기는 개념 이해를 위한 모형이에요. */
const LIGHT3D = (() => {
  const { V } = C3;
  function glowTex(inner = 'rgba(255,250,232,1)', mid = 'rgba(255,214,130,.35)') {
    return C3.canvasTex(128, 128, (g, w, h) => {
      const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      r.addColorStop(0, inner); r.addColorStop(0.18, 'rgba(255,240,200,.85)'); r.addColorStop(0.42, mid); r.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = r; g.fillRect(0, 0, w, h);
    });
  }
  function glowSprite(scale, opacity = 1, tex) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex || glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity }));
    s.scale.set(scale, scale, 1); return s;
  }
  /* opt.D: 거리 1 배의 길이, opt.u: 거리 1 배 판의 한 변 */
  function build(st, opt = {}) {
    const D = opt.D || 2, u = opt.u || 1, N = opt.n || 4;
    const g = new THREE.Group(); st.scene.add(g);
    // 광원
    const src = new THREE.Mesh(new THREE.SphereGeometry(0.17, 32, 20), new THREE.MeshBasicMaterial({ color: 0xfff6dc }));
    g.add(src);
    const halo = glowSprite(2.4); g.add(halo);
    const halo2 = glowSprite(5.5, 0.35); g.add(halo2);
    const pl = new THREE.PointLight(0xffe2a6, 30, 30, 1.6); g.add(pl);
    // 모서리 빛줄기(네 귀퉁이)
    const far = N + 0.45;
    const rayMat = new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.55 });
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => {
      const end = V(D * far, (a * u * far) / 2, (b * u * far) / 2);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, end.length(), 6), rayMat);
      m.position.copy(end.clone().multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(V(0, 1, 0), end.clone().normalize()); g.add(m);
    });
    // 판 (거리 k 배, 칸 k × k)
    const panels = [];
    for (let k = 1; k <= N; k++) {
      const side = k * u, x = k * D;
      const p = new THREE.Group(); p.position.x = x; g.add(p);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(side, side), new THREE.MeshPhysicalMaterial({ color: 0x5d8be6, transparent: true, opacity: 0.2, roughness: 0.35, metalness: 0, side: THREE.DoubleSide, depthWrite: false, emissive: 0x2a4fa8, emissiveIntensity: 0.25 }));
      glass.rotation.y = -Math.PI / 2; p.add(glass);
      const pts = [];
      for (let i = 0; i <= k; i++) {
        const t = -side / 2 + i * u;
        pts.push(V(0, t, -side / 2), V(0, t, side / 2), V(0, -side / 2, t), V(0, side / 2, t));
      }
      const grid = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.85 }));
      p.add(grid);
      // 한 칸(맨 위 왼쪽): 같은 넓이에 들어오는 빛
      const tileMat = new THREE.MeshBasicMaterial({ color: 0xffe07a, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
      const tile = new THREE.Mesh(new THREE.PlaneGeometry(u * 0.94, u * 0.94), tileMat);
      tile.rotation.y = -Math.PI / 2; tile.position.set(-0.012, side / 2 - u / 2, -side / 2 + u / 2); p.add(tile);
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(u, u)), new THREE.LineBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0 }));
      edge.rotation.y = -Math.PI / 2; edge.position.copy(tile.position).x -= 0.01; p.add(edge);
      panels.push({ k, p, glass, grid, tile, tileMat, edge, side, x, pulse: 0 });
    }
    // 사방으로 퍼지는 빛(퍼져 나가는 둥근 껍질)
    const shells = [];
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      g.add(m); shells.push({ m, k: i / 3 });
    }
    // 고른 거리의 구면(그림 Ⅷ-4의 파란 껍질)
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.MeshPhysicalMaterial({ color: 0x3f73d8, transparent: true, opacity: 0.07, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false }));
    g.add(sphere);
    // 빛 알갱이
    const NP = opt.particles || 700;
    const pm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff1c2 }), NP); pm.frustumCulled = false; g.add(pm);
    const P = [];
    const spawn = (q, t) => { q.y = (Math.random() - 0.5) * u; q.z = (Math.random() - 0.5) * u; q.t = t; };
    for (let i = 0; i < NP; i++) { const q = {}; spawn(q, Math.random() * far); P.push(q); }
    const m4 = new THREE.Matrix4(), tmp = V(), one = V(1, 1, 1), qq = new THREE.Quaternion();
    const state = { d: opt.d || 1, speed: 0.5, run: true };
    function setD(d) {
      state.d = d;
      panels.forEach((P) => {
        const on = P.k === d;
        P.glass.material.opacity = on ? 0.32 : 0.12; P.grid.material.opacity = on ? 0.95 : 0.35;
        P.edge.material.opacity = on ? 1 : 0;
      });
      sphere.scale.setScalar(Math.hypot(d * D, (d * u) / 2 * 0.7));
    }
    setD(state.d);
    st.onFrame((dt, t) => {
      const sp = C3.REDUCE ? 0 : state.speed;
      halo.material.opacity = 0.9 + 0.1 * Math.sin(t * 3);
      for (let i = 0; i < NP; i++) {
        const q = P[i], t0 = q.t; q.t += dt * sp;
        // 고른 판의 한 칸을 지나가면 반짝
        const pd = panels[state.d - 1];
        if (t0 < state.d && q.t >= state.d) {
          const y = q.y * state.d, z = q.z * state.d;
          if (y > pd.side / 2 - u && z < -pd.side / 2 + u) pd.pulse = Math.min(1, pd.pulse + 0.5);
        }
        if (q.t > far) spawn(q, 0.05);
        tmp.set(D * q.t, q.y * q.t, q.z * q.t); m4.compose(tmp, qq, one); pm.setMatrixAt(i, m4);
      }
      pm.instanceMatrix.needsUpdate = true;
      panels.forEach((P) => {
        P.pulse = Math.max(0, P.pulse - dt * 2.2);
        const base = P.k === state.d ? 0.62 / (P.k * P.k) + 0.1 : 0;
        P.tileMat.opacity = base + (P.k === state.d ? P.pulse * 0.35 : 0);
      });
      shells.forEach((s) => {
        if (!C3.REDUCE) s.k = (s.k + dt * 0.16) % 1;
        const r = 0.3 + s.k * D * (N + 0.4); s.m.scale.setScalar(r);
        s.m.material.opacity = 0.05 * (1 - s.k) * (1 - s.k);
      });
    });
    return { g, panels, setD, state, D, u, N, src };
  }
  return { build, glowTex, glowSprite };
})();
