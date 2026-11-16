/* ===== 원소 수업 3D 물체 — 그림 Ⅳ-1 물체 10가지, 그림 Ⅳ-2 원소 표본 18가지 =====
   EL3.obj(id) → THREE.Group (바닥 y = 0, 크기 약 2). 사진은 _fig.html + _bake.py로 media/ob-*.png, media/sm-*.png에 구워 쓴다.
   모두 새로 만든 모형이다(교과서 사진을 쓰지 않음). */
(() => {
  const { V, rng } = EL3;
  const std = (c, r = 0.6, m = 0, ex = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: m }, ex));
  const phys = (ex) => new THREE.MeshPhysicalMaterial(ex);
  const sh = (m) => { m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return m; };
  const lathe = (pts, mat, seg = 72) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), mat);

  // 값 잡음(울퉁불퉁한 덩어리용)
  function noise3(seed) {
    const r = rng(seed), P = Array.from({ length: 512 }, () => r());
    const h = (x, y, z) => P[((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) & 511];
    const s = (t) => t * t * (3 - 2 * t);
    return (x, y, z) => {
      const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = s(x - xi), yf = s(y - yi), zf = s(z - zi);
      const l = (a, b, t) => a + (b - a) * t;
      return l(l(l(h(xi, yi, zi), h(xi + 1, yi, zi), xf), l(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), xf), yf),
        l(l(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), xf), l(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), xf), yf), zf);
    };
  }
  // 덩어리 하나: 깎인 면이 있는 울퉁불퉁한 돌·금속 조각
  function chunk(seed, mat, o = {}) {
    const g = new THREE.IcosahedronGeometry(1, o.detail || 4), n = noise3(seed), r = rng(seed + 11), p = g.attributes.position, v = V();
    const cuts = Array.from({ length: o.cuts || 5 }, () => ({ d: V(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), k: (o.cutK || 0.55) + r() * 0.3 }));
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      let s = 1 + (n(v.x * 1.7 + 5, v.y * 1.7, v.z * 1.7) - 0.5) * (o.rough || 0.35) + (n(v.x * 5, v.y * 5 + 3, v.z * 5) - 0.5) * (o.fine || 0.08);
      v.multiplyScalar(s);
      cuts.forEach((c) => { const t = v.dot(c.d); if (t > c.k) v.addScaledVector(c.d, c.k - t); });
      v.multiply(o.scale || V(1, 0.7, 0.9)); p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); return m;
  }
  function pile(make, n, R, seed, h = 0.35) { // 덩어리 여러 개를 소복이
    const g = new THREE.Group(), r = rng(seed);
    for (let i = 0; i < n; i++) {
      const a = r() * 6.28, d = Math.sqrt(r()) * R, s = 0.28 + r() * 0.22, m = make(i, s);
      m.scale.multiplyScalar(s); m.position.set(Math.cos(a) * d, s * 0.55 + (1 - d / R) * h * r(), Math.sin(a) * d);
      m.rotation.set(r() * 6, r() * 6, r() * 6); g.add(m);
    }
    return g;
  }
  // 고운 가루·알갱이 무더기(황, 소금, 칼슘)
  function grains(n, R, H, color, seed, o = {}) {
    const r = rng(seed), geo = o.cube ? new THREE.BoxGeometry(1, 1, 1) : new THREE.IcosahedronGeometry(1, 1);
    const mats = (o.colors || [color]).map((c) => std(c, o.rough || 0.8, o.metal || 0));
    const g = new THREE.Group(), byMat = mats.map(() => []);
    for (let i = 0; i < n; i++) {
      const a = r() * 6.28, d = Math.pow(r(), 0.7) * R, y = Math.max(0, H * (1 - Math.pow(d / R, 1.6))) * (0.55 + r() * 0.45);
      byMat[Math.floor(r() * mats.length)].push([Math.cos(a) * d, y, Math.sin(a) * d, (o.size || 0.06) * (0.6 + r() * 0.8), r()]);
    }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    byMat.forEach((L, k) => {
      const im = new THREE.InstancedMesh(geo, mats[k], L.length);
      L.forEach(([x, y, z, s, t], i) => { e.set(t * 9, t * 13, t * 7); q.setFromEuler(e); m4.compose(V(x, y, z), q, V(s, s * (o.cube ? 1 : 0.8), s)); im.setMatrixAt(i, m4); });
      im.castShadow = true; im.receiveShadow = true; g.add(im);
    });
    // 속을 채우는 낮은 언덕
    const hill = lathe(Array.from({ length: 14 }, (_, i) => { const t = i / 13; return [R * 0.96 * Math.sin(t * Math.PI / 2), H * 0.82 * (1 - Math.pow(Math.sin(t * Math.PI / 2), 1.6))]; }).reverse().concat([[0, 0]]).reverse(), mats[0], 48);
    hill.geometry = new THREE.LatheGeometry([new THREE.Vector2(0, H * 0.78), ...Array.from({ length: 12 }, (_, i) => { const t = (i + 1) / 12; return new THREE.Vector2(R * 0.95 * t, H * 0.78 * (1 - Math.pow(t, 1.6))); })], 48);
    g.add(hill);
    return g;
  }
  // 투명 유리 재질
  const glassMat = (o = {}) => phys(Object.assign({ color: 0xffffff, roughness: 0.04, metalness: 0, transmission: 1, thickness: 0.15, ior: 1.5, transparent: true, opacity: 1, side: THREE.DoubleSide }, o));
  // 기체가 든 유리병(원소 표본: 수소·질소·산소·염소)
  function gasJar(tint, op) {
    const g = new THREE.Group();
    const prof = [[0, 0], [0.62, 0], [0.66, 0.05], [0.66, 1.55], [0.6, 1.66], [0.4, 1.74], [0.36, 1.86], [0.4, 1.9], [0.4, 1.97]];
    g.add(lathe(prof, glassMat({ thickness: 0.08 })));
    if (tint) { const gas = lathe([[0, 0.04], [0.62, 0.04], [0.62, 1.55], [0.55, 1.65], [0.36, 1.73], [0.33, 1.9], [0, 1.9]], std(tint, 1, 0, { transparent: true, opacity: op, depthWrite: false }), 48); g.add(gas); }
    const cap = lathe([[0, 1.9], [0.45, 1.9], [0.47, 1.96], [0.47, 2.12], [0.42, 2.18], [0, 2.18]], std('#2f3a46', 0.5));
    g.add(cap);
    return g;
  }

  const OBJ = {};
  /* ---------- 그림 Ⅳ-1 물체 ---------- */
  OBJ.balloon = () => {
    const g = new THREE.Group(), cols = ['#6fc6e8', '#ef6f7c', '#e23b3b', '#3fae5c'], pos = [[-0.42, 2.25, -0.2], [0.38, 2.45, -0.35], [0.02, 1.95, 0.25], [0.62, 1.85, 0.2]];
    const prof = Array.from({ length: 30 }, (_, i) => { const t = i / 29, a = t * Math.PI; return [Math.sin(a) * 0.48 * (1 + 0.15 * Math.sin(a * 0.9 - 0.6)), -Math.cos(a) * 0.58 - 0.02 * Math.sin(a)]; });
    pos.forEach(([x, y, z], i) => {
      const b = lathe(prof.map(([px, py]) => [px, py]).reverse(), phys({ color: cols[i], roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.35, sheen: 0.3 }), 64);
      b.rotation.x = Math.PI; b.position.set(x, y, z); b.rotation.z = (i - 1.5) * 0.12; g.add(b);
      const knot = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 16), std(cols[i], 0.4)); knot.position.set(x + (i - 1.5) * 0.07, y - 0.62, z); g.add(knot);
      const str = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(x + (i - 1.5) * 0.07, y - 0.66, z), V(x * 0.5 + 0.03, 1.0, z * 0.5), V(0.02, 0.18, 0)]), 30, 0.008, 6), std('#d9d4c8', 0.8)); g.add(str);
    });
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.18, 32), std('#8c96a3', 0.55, 0.3)); w.position.y = 0.09; g.add(w);
    return g;
  };
  OBJ.diamond = () => { // 둥근 브릴리언트 컷
    const N = 16, top = 0.62, girdle = 0.0, tbl = 0.55, R = 1, bottom = -0.95, pts = [];
    const geo = new THREE.BufferGeometry(), P = [];
    const ring = (r, y, off) => Array.from({ length: N }, (_, i) => { const a = ((i + off) / N) * Math.PI * 2; return V(Math.cos(a) * r, y, Math.sin(a) * r); });
    const T = ring(tbl, top, 0.5), G = ring(R, girdle, 0), G2 = ring(R, girdle - 0.06, 0), C = V(0, top, 0), Bt = V(0, bottom, 0);
    const tri = (a, b, c) => P.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    for (let i = 0; i < N; i++) { const j = (i + 1) % N; tri(C, T[j], T[i]); tri(T[i], T[j], G[j]); tri(T[i], G[j], G[i]); tri(G[i], G[j], G2[j]); tri(G[i], G2[j], G2[i]); tri(G2[i], G2[j], Bt); }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.computeVertexNormals(); void pts;
    const m = new THREE.Mesh(geo, phys({ color: 0xffffff, roughness: 0, metalness: 0, transmission: 1, ior: 2.42, thickness: 1.2, dispersion: 0.6, envMapIntensity: 2.2, specularIntensity: 1 }));
    m.rotation.z = 0.32; m.rotation.x = -0.18; m.position.y = 1.05; m.scale.setScalar(0.95);
    const g = new THREE.Group(); g.add(m); return g;
  };
  OBJ.capsule = () => {
    const g = new THREE.Group(), al = std('#cfd4da', 0.28, 1);
    const prof = [[0, 0.0], [0.42, 0.0], [0.47, 0.03], [0.6, 0.62], [0.63, 0.66], [0.82, 0.68], [0.83, 0.72], [0.62, 0.72], [0.6, 0.7], [0, 0.7]];
    const c = lathe(prof, al, 96);
    // 옆면 주름
    const p = c.geometry.attributes.position, v = V();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); if (v.y > 0.05 && v.y < 0.6) { const a = Math.atan2(v.z, v.x), k = 1 + 0.025 * Math.cos(a * 18); v.x *= k; v.z *= k; p.setXYZ(i, v.x, v.y, v.z); } }
    c.geometry.computeVertexNormals();
    c.rotation.x = Math.PI; c.position.y = 0.72; g.add(c);
    const c2 = c.clone(); c2.rotation.set(Math.PI * 0.5 + 0.25, 0, 0.5); c2.position.set(0.95, 0.68, -0.4); c2.material = std('#b8bec7', 0.32, 1); g.add(c2);
    g.scale.setScalar(1.25); return g;
  };
  OBJ.copper = () => {
    const g = new THREE.Group(), cu = std('#c8693a', 0.32, 1), pts = [];
    const r = rng(5);
    for (let i = 0; i < 900; i++) { const t = i / 899, a = t * Math.PI * 2 * 14, rr = 0.78 + 0.07 * Math.sin(t * 61) + 0.04 * (r() - 0.5); pts.push(V(Math.cos(a) * rr, 0.16 + 0.11 * Math.sin(t * 37) + t * 0.32 + 0.05 * Math.sin(a * 0.5), Math.sin(a) * rr)); }
    const coil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 1800, 0.028, 8), cu); g.add(coil);
    const end = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([pts[899], V(0.3, 0.55, 1.05), V(1.1, 0.06, 1.0)]), 40, 0.028, 8), cu); g.add(end);
    g.rotation.x = 0.35; g.position.y = 0.2; g.scale.setScalar(1.15); return g;
  };
  OBJ.soap = () => {
    const g = new THREE.Group();
    const geo = new RoundedBoxGeometry(1.7, 0.62, 1.1, 6, 0.24);
    const m = new THREE.Mesh(geo, std('#a6d8de', 0.62, 0, { emissive: '#0f2a2e', emissiveIntensity: 0.05 }));
    m.position.y = 0.31; m.rotation.y = -0.35; g.add(m);
    // 거품 몇 알
    const bub = phys({ color: 0xffffff, roughness: 0.1, transmission: 0.9, transparent: true, opacity: 0.55, iridescence: 1, iridescenceIOR: 1.3 });
    [[0.55, 0.66, 0.05, 0.08], [0.66, 0.64, 0.18, 0.05], [0.42, 0.66, 0.2, 0.045]].forEach(([x, y, z, s]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(s, 24, 16), bub); b.position.set(x, y, z); g.add(b); });
    return g;
  };
  OBJ.dryice = () => {
    const g = new THREE.Group(), ice = std('#f3f6f9', 0.95, 0, { emissive: '#dfe8f0', emissiveIntensity: 0.12 });
    [[-0.55, 0.35, 0, 1.1, 0.75, 0.9, 1], [0.6, 0.32, -0.1, 1.0, 0.68, 0.85, 2], [0.05, 0.3, 0.75, 0.9, 0.6, 0.8, 3]].forEach(([x, y, z, a, b, c, s]) => {
      const m = chunk(40 + s, ice, { detail: 5, cuts: 12, cutK: 0.42, rough: 0.1, fine: 0.05, scale: V(a * 0.7, b * 0.7, c * 0.7) }); m.position.set(x, y, z); m.rotation.y = s; g.add(m);
    });
    return g;
  };
  OBJ.salt = () => {
    const g = new THREE.Group();
    // 금속 계량 국자
    const st = std('#c7ccd2', 0.25, 1);
    const scoop = lathe([[0, 0], [0.72, 0], [0.82, 0.04], [0.86, 0.5], [0.84, 0.52], [0.8, 0.06], [0.72, 0.03], [0, 0.03]], st, 64);
    scoop.rotation.z = Math.PI / 2; scoop.position.set(-0.1, 0.62, 0); g.add(scoop); void scoop;
    const s2 = grains(1400, 0.95, 0.75, '#ffffff', 12, { cube: true, size: 0.055, colors: ['#ffffff', '#f2f4f6', '#e7ebef'], rough: 0.45 });
    s2.position.set(0.35, 0, 0.1); g.add(s2);
    g.remove(scoop);
    return g;
  };
  OBJ.water = () => {
    const g = new THREE.Group();
    const cup = lathe([[0, 0], [0.55, 0], [0.58, 0.03], [0.68, 1.75], [0.64, 1.75], [0.55, 0.12], [0, 0.12]], glassMat({ thickness: 0.1 }), 72);
    g.add(cup);
    const wat = lathe([[0, 0.12], [0.545, 0.12], [0.63, 1.3], [0, 1.3]], phys({ color: '#7cc3ef', roughness: 0.05, transmission: 0.75, thickness: 1, ior: 1.33, attenuationColor: '#4aa3e0', attenuationDistance: 1.6, transparent: true, opacity: 0.95 }), 72);
    g.add(wat);
    g.scale.setScalar(1.05); return g;
  };
  OBJ.glass = () => {
    const g = new THREE.Group();
    const vase = lathe([[0, 0], [0.5, 0], [0.55, 0.06], [0.62, 0.55], [0.48, 1.25], [0.34, 1.6], [0.34, 1.9], [0.4, 1.95], [0.36, 1.97], [0.29, 1.92], [0.29, 1.6], [0.42, 1.25], [0.56, 0.55], [0.49, 0.18], [0, 0.16]], glassMat({ color: '#e6f4f2', thickness: 0.25, attenuationColor: '#bfe6dd', attenuationDistance: 2 }), 72);
    g.add(vase);
    const tum = lathe([[0, 0], [0.42, 0], [0.48, 0.9], [0.45, 0.9], [0.39, 0.14], [0, 0.14]], glassMat({ thickness: 0.12 }), 64);
    tum.position.set(0.8, 0, 0.35); g.add(tum);
    return g;
  };
  OBJ.plastic = () => {
    const g = new THREE.Group();
    const prof = [[0, 0], [0.38, 0.02], [0.47, 0.12], [0.5, 0.3], [0.48, 0.42], [0.5, 0.5], [0.5, 0.8], [0.47, 0.88], [0.5, 0.95], [0.5, 1.3], [0.42, 1.55], [0.24, 1.82], [0.19, 1.95], [0.19, 2.0]];
    const b = lathe(prof, phys({ color: '#eaf6ff', roughness: 0.08, transmission: 0.92, thickness: 0.05, ior: 1.57, transparent: true, side: THREE.DoubleSide }), 72);
    g.add(b);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.2, 40), std('#2f7fd0', 0.5)); cap.position.y = 2.08; g.add(cap);
    const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.505, 0.505, 0.32, 64, 1, true), std('#3b8fdc', 0.6, 0, { side: THREE.DoubleSide })); lab.position.y = 1.12; g.add(lab);
    g.rotation.z = -0.08; g.scale.setScalar(0.95); return g;
  };

  /* ---------- 그림 Ⅳ-2 원소 표본 ---------- */
  const metal = (c, r = 0.35) => std(c, r, 1);
  const S = {};
  S.H = () => gasJar(null);
  S.He = () => { const g = OBJ.balloon(); g.scale.setScalar(0.85); return g; };
  S.N = () => gasJar(null);
  S.O = () => gasJar(null);
  S.Cl = () => gasJar('#c6e04a', 0.45);
  S.Ne = () => { // 빛나는 네온관
    const g = new THREE.Group(), pts = [];
    for (let i = 0; i <= 80; i++) { const t = i / 80; pts.push(V(-0.9 + t * 1.8, 1.0 + 0.45 * Math.sin(t * Math.PI * 2.2), 0)); }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.07, 14), new THREE.MeshStandardMaterial({ color: '#ff6a3d', emissive: '#ff5a2a', emissiveIntensity: 2.4, roughness: 0.3 }));
    g.add(tube);
    const glow = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.16, 14), new THREE.MeshBasicMaterial({ color: '#ff8a5c', transparent: true, opacity: 0.18, depthWrite: false }));
    g.add(glow);
    [-0.9, 0.9].forEach((x) => { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 20), std('#4a5562', 0.5, 0.5)); e.position.set(x * 1.06, 1.0, 0); e.rotation.z = Math.PI / 2; g.add(e); });
    const base = new THREE.Mesh(new RoundedBoxGeometry(2.3, 0.14, 0.7, 3, 0.05), std('#2c333b', 0.6)); base.position.y = 0.07; g.add(base);
    [-0.6, 0.6].forEach((x) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 8), metal('#9aa3ad')); p.position.set(x, 0.4, 0); g.add(p); });
    return g;
  };
  S.C = () => pile((i, s) => chunk(200 + i, std(i % 2 ? '#2b2e33' : '#383c42', 0.55, 0.2), { rough: 0.4, cuts: 6 }), 7, 0.7, 21);
  S.Li = () => pile((i) => chunk(300 + i, metal(i % 2 ? '#9ea4ab' : '#b3b8be', 0.55), { rough: 0.3 }), 9, 0.75, 31);
  S.Na = () => pile((i) => chunk(320 + i, metal(i % 2 ? '#b8bcc2' : '#c9ccd0', 0.6), { rough: 0.22, cuts: 4 }), 5, 0.65, 33);
  S.Be = () => pile((i) => chunk(340 + i, metal(i % 2 ? '#8d939b' : '#a1a7ae', 0.45), { rough: 0.45, cuts: 7 }), 7, 0.75, 35);
  S.Mg = () => { // 마그네슘 리본 감은 것
    const g = new THREE.Group(), pts = [];
    for (let i = 0; i < 400; i++) { const t = i / 399, a = t * Math.PI * 2 * 5; pts.push(V(Math.cos(a) * (0.7 - t * 0.15), 0.25 + t * 0.12, Math.sin(a) * (0.7 - t * 0.15))); }
    const crv = new THREE.CatmullRomCurve3(pts), shp = new THREE.Shape(); shp.moveTo(-0.012, -0.14); shp.lineTo(0.012, -0.14); shp.lineTo(0.012, 0.14); shp.lineTo(-0.012, 0.14);
    const rib = new THREE.Mesh(new THREE.ExtrudeGeometry(shp, { steps: 800, bevelEnabled: false, extrudePath: crv }), metal('#b9bec4', 0.3)); g.add(rib);
    const pl = pile((i) => chunk(360 + i, metal('#aab0b7', 0.4), { rough: 0.3 }), 4, 0.5, 37); pl.position.set(0.9, 0, 0.6); pl.scale.setScalar(0.8); g.add(pl);
    return g;
  };
  S.Al = () => pile((i) => chunk(380 + i, metal(i % 2 ? '#d4d8dd' : '#c2c7cd', 0.22), { rough: 0.35, cuts: 6 }), 9, 0.8, 39);
  S.Si = () => pile((i) => chunk(400 + i, std(i % 2 ? '#5f6772' : '#717a86', 0.25, 0.85), { rough: 0.5, cuts: 9 }), 7, 0.75, 41);
  S.S = () => grains(1600, 0.95, 0.7, '#f2cf33', 43, { size: 0.05, colors: ['#f4d43a', '#ecc52a', '#f7df63'], rough: 0.9 });
  S.Ca = () => grains(500, 0.9, 0.6, '#8f949a', 45, { size: 0.09, colors: ['#8c9197', '#a3a8ad', '#7a7f85'], rough: 0.7, metal: 0.4 });
  S.Fe = () => pile((i) => chunk(420 + i, metal(i % 2 ? '#5d6166' : '#6e7278', 0.5), { rough: 0.4, cuts: 7 }), 8, 0.8, 47);
  S.Cu = () => pile((i) => chunk(440 + i, metal(i % 2 ? '#c46a3b' : '#b85e30', 0.4), { rough: 0.55, fine: 0.14 }), 5, 0.7, 49);
  S.Hg = () => { // 수은 방울
    const g = new THREE.Group(), r = rng(51), hg = std('#d9dde2', 0.06, 1);
    [[0, 0, 0.55], [0.75, 0.25, 0.28], [-0.7, 0.3, 0.32], [0.35, -0.65, 0.2], [-0.25, 0.75, 0.16], [0.95, -0.4, 0.12], [-0.9, -0.45, 0.14]].forEach(([x, z, s]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), hg); m.scale.set(s, s * 0.62, s); m.position.set(x, s * 0.6, z); g.add(m);
    });
    void r; return g;
  };
  EL3.obj = (id) => sh((OBJ[id] || S[id])());
  EL3.OBJ_IDS = Object.keys(OBJ);
  EL3.SAMPLE_IDS = Object.keys(S);
})();
