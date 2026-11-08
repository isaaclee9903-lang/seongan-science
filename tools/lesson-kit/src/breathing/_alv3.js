/* ===== 허파꽈리 3D 도구 ALV =====
   숨관가지 끝이 갈라져 포도송이처럼 생긴 허파꽈리 무리가 되고, 겉을 모세혈관이 그물처럼 둘러싼다.
   한 송이는 반으로 잘라 한 겹의 얇은 벽과 속 공기를 보인다. 크기와 수는 잘 보이게 정한 모형이다. */
const ALV = (() => {
  'use strict';
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let seed = 7; const rnd = (a, b) => { seed = (seed * 16807) % 2147483647; return a + (seed / 2147483647) * (b - a); };
  function lumpy(det, amp, f, sd) {
    const g = new THREE.SphereGeometry(1, 28 * det, 20 * det), p = g.attributes.position, v = V();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = Math.sin(v.x * f + sd) * Math.cos(v.y * f * 1.3 + sd * 2) + Math.sin(v.z * f * 1.1 + sd * 3) * .7; const L = 1 + amp * n; p.setXYZ(i, v.x * L, v.y * L, v.z * L); }
    g.computeVertexNormals(); return g;
  }
  function scene(host, opt = {}) {
    const st = C3.makeStage(host, { fov: 30, minD: 6, maxD: 80, hold: !!opt.hold, scroll: !!opt.scroll, exposure: 1 });
    st.scene.background = new THREE.Color('#ffffff'); st.scene.environmentIntensity = .4; st.sun.castShadow = false; st.sun.position.set(8, 12, 14);
    const fill = new THREE.DirectionalLight(0xffffff, .5); fill.position.set(-10, 2, 8); st.scene.add(fill);
    const root = new THREE.Group(); st.scene.add(root);
    const std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .7 }, o));
    /* 숨관가지: 줄기 → 두 갈래 → 다시 갈래 (끝으로 갈수록 가늘어진다) */
    const brM = std('#dca48f', { roughness: .66 });
    const tube = (a, b, r0, r1) => { const len = a.distanceTo(b); const cyl = new THREE.CylinderGeometry(r1, r0, len, 16, 1, true); cyl.translate(0, len / 2, 0); const m = new THREE.Mesh(cyl, brM); m.position.copy(a); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); root.add(m); const j = new THREE.Mesh(new THREE.SphereGeometry(r1, 14, 10), brM); j.position.copy(b); root.add(j); };
    const ends = [];
    const grow = (p, dir, r, len, depth) => { const q = p.clone().addScaledVector(dir, len); tube(p, q, r, r * .8); if (depth === 0) { ends.push({ p: q, dir }); return; } [-1, 1].forEach((s) => { const d = dir.clone().applyAxisAngle(V(0, 0, 1), s * rnd(.42, .62)).applyAxisAngle(V(0, 1, 0), rnd(-.5, .5)).normalize(); grow(q, d, r * .72, len * .78, depth - 1); }); };
    grow(V(0, -7.4, 0), V(0, 1, 0), .62, 3.2, 3);
    /* 허파꽈리 송이 */
    const sacG = lumpy(1, .03, 2.4, 1.7);
    const sacM = std('#e3846f', { roughness: .78 });
    const sacs = [];
    ends.forEach((e, k) => {
      const cen = e.p.clone().addScaledVector(e.dir, 1.5);
      for (let i = 0; i < 17; i++) { const d = V(rnd(-1, 1), rnd(-.4, 1.2), rnd(-1, 1)).normalize(); const r = rnd(.5, .66); const p = cen.clone().addScaledVector(d, rnd(.35, 1.05)); sacs.push({ p, r, k }); }
    });
    sacs.forEach((s) => { const m = new THREE.Mesh(sacG, sacM); m.position.copy(s.p); m.scale.setScalar(s.r); m.rotation.set(rnd(0, 6), rnd(0, 6), 0); root.add(m); s.m = m; });
    /* 모세혈관: 허파꽈리 겉을 감싸는 가는 관(파랑 → 빨강) */
    const capM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .5 });
    const blue = new THREE.Color('#5a62b8'), red = new THREE.Color('#c8402f'), cc = new THREE.Color();
    sacs.forEach((s, i) => {
      for (let j = 0; j < 5; j++) {
        const ax = V(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize(), b0 = V(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).cross(ax).normalize(), pts = [];
        const a0 = rnd(0, 6), span = rnd(1.6, 2.6);
        for (let t = 0; t <= 14; t++) { const a = a0 + span * t / 14; const v = b0.clone().applyAxisAngle(ax, a).multiplyScalar(s.r * 1.1 + .02 * Math.sin(t * 2.3)); pts.push(s.p.clone().add(v)); }
        const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, .045, 6, false), P = g.attributes.position, col = new Float32Array(P.count * 3);
        for (let k = 0; k < P.count; k++) { const u = Math.floor(k / 7) / 28; cc.copy(blue).lerp(red, smooth(.1, .9, u)); col[k * 3] = cc.r; col[k * 3 + 1] = cc.g; col[k * 3 + 2] = cc.b; }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3)); root.add(new THREE.Mesh(g, capM));
      }
    });
    /* 이름표 */
    const lab = CH3.labels(st);
    const firstSac = sacs[Math.floor(sacs.length * .4)];
    lab.add('br', '숨관가지', V(.25, -5.2, .3), .2, .8, 'b', { px: .14, py: .86 });
    lab.add('al', '허파꽈리', () => firstSac.p.clone().add(V(0, firstSac.r * .9, 0)), .16, .2, 'b', { px: .14, py: .14 });
    const capPt = sacs[sacs.length - 3]; lab.add('cap', '모세혈관', () => capPt.p.clone().add(V(capPt.r, 0, 0)), .84, .28, 'b', { px: .86, py: .2 });
    lab.only(opt.labels === false ? [] : ['br', 'al', 'cap']);
    /* 시점 */
    const bb = new THREE.Box3().setFromObject(root); const bx = new THREE.Mesh(new THREE.BoxGeometry(...bb.getSize(V()).toArray())); bx.position.copy(bb.getCenter(V())); bx.visible = false; st.scene.add(bx);
    st.fit([bx], { dir: V(.2, .1, 1), margin: 1.06, dur: 0, target: bx.position.clone() });
    /* 숨에 맞춰 조금 부풀고 천천히 돈다 */
    const clk = { t: 0, last: 0 };
    st.onFrame((d) => { if (window.__bakeT !== undefined) { clk.t = window.__bakeT; } else clk.t += d; const b = .5 - .5 * Math.cos(clk.t / 4 * Math.PI * 2); sacs.forEach((s) => s.m.scale.setScalar(s.r * (1 + .06 * b))); root.rotation.y = opt.spin === false ? 0 : Math.sin(clk.t / 12 * Math.PI * 2) * .5; });
    return { st, lab };
  }
  return { scene };
})();
window.ALV = ALV;
