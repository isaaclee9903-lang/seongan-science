/* ===== 3D: 같은 밝기의 가로등 4개가 거리 1·2·3·4 배에 서 있는 밤길 =====
   가로등은 모두 같은 모형이에요. 멀리 있을수록 작고 어둡게 보이는 것은 원근(카메라)으로 생기고,
   '눈에 들어오는 빛' 막대(1, 1/4, 1/9, 1/16 배)는 교과서 값이에요. */
const STREET3D = (() => {
  const { V, mesh } = C3;
  function asphalt() {
    const t = C3.canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#23272f'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) { const v = 30 + Math.random() * 40; g.fillStyle = `rgba(${v},${v + 2},${v + 8},${0.25 + Math.random() * 0.3})`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  function poolTex() {
    return C3.canvasTex(256, 256, (g, w, h) => { const r = g.createRadialGradient(128, 128, 0, 128, 128, 128); r.addColorStop(0, 'rgba(255,214,140,.75)'); r.addColorStop(0.45, 'rgba(255,190,110,.25)'); r.addColorStop(1, 'rgba(255,180,100,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
  }
  function coneTex() {
    return C3.canvasTex(64, 256, (g, w, h) => { const r = g.createLinearGradient(0, 0, 0, h); r.addColorStop(0, 'rgba(255,226,170,.55)'); r.addColorStop(1, 'rgba(255,226,170,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
  }
  function build(st, opt = {}) {
    const L = opt.L || 7, N = 4, eyeZ = opt.eyeZ || 3;
    const g = new THREE.Group(); st.scene.add(g);
    // 땅: 차도, 인도, 잔디
    const tex = asphalt(); tex.repeat.set(3, 18);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 80), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0 }));
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -25); road.receiveShadow = true; g.add(road);
    const walkMat = new THREE.MeshStandardMaterial({ color: 0x5b5f68, roughness: 0.85 });
    [-4.8, 4.8].forEach((x) => { const w = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.18, 80), walkMat); w.position.set(x, 0.09, -25); w.receiveShadow = true; g.add(w); });
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(60, 80), new THREE.MeshStandardMaterial({ color: 0x1b2a22, roughness: 1 }));
    grass.rotation.x = -Math.PI / 2; grass.position.set(0, -0.02, -25); g.add(grass);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xcfc8a8 });
    for (let z = 4; z > -64; z -= 3.2) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 1.6), dashMat); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.01, z); g.add(d); }
    // 가로등 4개
    const metal = new THREE.MeshStandardMaterial({ color: 0x7c8592, roughness: 0.4, metalness: 0.75 });
    const pool = poolTex(), cone = coneTex();
    const lamps = [];
    for (let k = 1; k <= N; k++) {
      const z = eyeZ - k * L, x = 4.4;
      const lg = new THREE.Group(); lg.position.set(x, 0, z); g.add(lg); lg.userData.tap = k;
      const pole = mesh(new THREE.CylinderGeometry(0.09, 0.13, 6, 16), metal, 0, 3, 0); lg.add(pole);
      const base = mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.4, 16), metal, 0, 0.2, 0); lg.add(base);
      const arm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(V(0, 5.9, 0), V(0, 6.5, 0), V(-1.5, 6.35, 0)), 20, 0.06, 8, false), metal); arm.castShadow = true; lg.add(arm);
      const head = mesh(new THREE.BoxGeometry(0.9, 0.16, 0.42), metal, -1.6, 6.3, 0); lg.add(head);
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.3), new THREE.MeshBasicMaterial({ color: 0xfff1cf })); bulb.position.set(-1.6, 6.2, 0); lg.add(bulb);
      const glow = LIGHT3D.glowSprite(2.6, 0.95); glow.position.set(-1.6, 6.12, 0); lg.add(glow);
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 2.4, 6.1, 32, 1, true), new THREE.MeshBasicMaterial({ map: cone, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.38 }));
      beam.position.set(-1.6, 3.1, 0); lg.add(beam);
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 6.5), new THREE.MeshBasicMaterial({ map: pool, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }));
      pl.rotation.x = -Math.PI / 2; pl.position.set(-1.6, 0.03, 0); lg.add(pl);
      const spot = new THREE.PointLight(0xffd6a0, 9, 9, 1.8); spot.position.set(-1.6, 5.9, 0); lg.add(spot);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.56, 40), new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.25, 0); lg.add(ring);
      lamps.push({ k, lg, glow, ring, bulbPos: () => lg.localToWorld(V(-1.6, 6.2, 0)) });
    }
    // 보는 사람(눈 위치 표시)
    const person = new THREE.Group(); person.position.set(1.2, 0, eyeZ); g.add(person);
    const cloth = new THREE.MeshStandardMaterial({ color: 0x3b5bd6, roughness: 0.6 }), skin = new THREE.MeshStandardMaterial({ color: 0xf0c7a0, roughness: 0.7 });
    person.add(mesh(new THREE.CapsuleGeometry(0.28, 0.9, 6, 16), cloth, 0, 1.0, 0));
    person.add(mesh(new THREE.SphereGeometry(0.22, 24, 16), skin, 0, 1.78, 0));
    const leg = new THREE.MeshStandardMaterial({ color: 0x24314f, roughness: 0.8 });
    person.add(mesh(new THREE.CapsuleGeometry(0.1, 0.5, 4, 8), leg, -0.12, 0.35, 0), mesh(new THREE.CapsuleGeometry(0.1, 0.5, 4, 8), leg, 0.12, 0.35, 0));
    const eye = V(1.2, 1.78, eyeZ);
    // 뒤쪽 건물 실루엣과 창문 불빛
    const bmat = new THREE.MeshStandardMaterial({ color: 0x141b2e, roughness: 0.9 });
    const winTex = C3.canvasTex(128, 256, (gg, w, h) => { gg.fillStyle = '#141b2e'; gg.fillRect(0, 0, w, h); for (let j = 0; j < 16; j++) for (let i = 0; i < 6; i++) if (Math.random() < 0.28) { gg.fillStyle = `rgba(255,${200 + Math.random() * 40},${120 + Math.random() * 60},${0.5 + Math.random() * 0.4})`; gg.fillRect(8 + i * 20, 8 + j * 15, 10, 8); } });
    for (let i = 0; i < 9; i++) {
      const hgt = 6 + Math.random() * 12, w = 4 + Math.random() * 4;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, 4), [bmat, bmat, bmat, bmat, new THREE.MeshBasicMaterial({ map: winTex }), bmat]);
      b.position.set(-12 - Math.random() * 6, hgt / 2, eyeZ - 6 - i * 7.5); b.rotation.y = Math.PI / 2; g.add(b);
    }
    let sel = 0;
    function select(k) { sel = k; lamps.forEach((l) => (l.ring.material.opacity = l.k === k ? 0.95 : 0)); }
    st.onFrame((dt, t) => { lamps.forEach((l) => { l.glow.material.opacity = 0.9 + 0.05 * Math.sin(t * 2 + l.k); if (l.k === sel) l.ring.rotation.z += dt * 0.8; }); });
    return { g, lamps, eye, select, L, eyeZ, person };
  }
  return { build };
})();
