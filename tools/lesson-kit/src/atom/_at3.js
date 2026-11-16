/* ===== 원자의 구조 3D (AT3) =====
   교과서 그림 Ⅳ-4~Ⅳ-7의 표현(하늘색 공 모양 원자, 빨간 양성자 '+', 초록 중성자, 파란 전자 '−', 간단히 나타낸 모형의 원자핵 전하량)을
   따라 이 수업을 위해 새로 만든 3D 모형이다. 원자·원자핵·전자의 크기 비율, 전자의 위치와 움직임은 보기 좋게 정한 모형이다.
   AT3.dive(host, 'gold'|'he')  금괴 → 금 원자 / 헬륨 풍선 → 헬륨 원자들 → 헬륨 원자 → 원자핵 연속 확대
   AT3.lab(host)                 해 보기 144쪽: 원자핵 전하량 쓰기, 전자 붙임딱지 붙이기
   AT3.single(host)              양성자수에 따라 바뀌는 원자(간단히 나타낸 모형), 양성자·전자 더하기·빼기 */
const AT3 = (() => {
  'use strict';
  const { V, makeStage, prepare, REDUCE } = C3;
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeO = (t) => 1 - Math.pow(1 - t, 3);
  const mkR = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const COL = { p: '#e2463d', n: '#6fb646', e: '#2f7fd0', cloud: '#9fd8f6' };
  const SPH = new THREE.SphereGeometry(1, 48, 32);

  /* ---------- 재질 ---------- */
  function noiseTex(seed, base, spots) { // 매트한 입자 겉면(아주 엷은 얼룩)
    const r = mkR(seed);
    return C3.canvasTex(256, 128, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${r() < .5 ? '255,255,255' : '0,0,0'},${.02 + r() * .035})`; g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 7, 0, 6.3); g.fill(); }
      if (spots) spots(g, w, h, r);
    });
  }
  const MAT = {};
  function partMat(kind) {
    if (MAT[kind]) return MAT[kind];
    MAT[kind] = new THREE.MeshStandardMaterial({ map: noiseTex(kind.charCodeAt(0) * 7, COL[kind]), roughness: kind === 'e' ? .42 : .5, metalness: 0 });
    return MAT[kind];
  }
  // 입자에 찍힌 '+', '−' (교과서처럼 흰 부호). 늘 카메라 쪽 겉면에 보이게 해요.
  const SIGN = {};
  function signTex(s) {
    if (SIGN[s]) return SIGN[s];
    SIGN[s] = C3.canvasTex(128, 128, (g, w) => {
      g.translate(w / 2, w / 2); g.fillStyle = '#ffffff'; g.shadowColor = 'rgba(60,0,0,.25)'; g.shadowBlur = 4;
      const L = 30, T = 9.5; const rr = (x, y, a, b) => { g.beginPath(); g.roundRect(x, y, a, b, T / 2); g.fill(); };
      rr(-L, -T / 2, 2 * L, T); if (s === '+') rr(-T / 2, -L, T, 2 * L);
    });
    return SIGN[s];
  }
  /* 원자(하늘색 공): 가장자리가 진하고 가운데가 맑은 매트한 공. 빛은 왼쪽 위에서 */
  function cloudMat(op = 1, deep = '#4fb0e6', light = '#d6f0fd') {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uOp: { value: op }, uDeep: { value: new THREE.Color(deep) }, uLight: { value: new THREE.Color(light) } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vV = -mv.xyz; vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*mv; }',
      fragmentShader: `uniform float uOp; uniform vec3 uDeep; uniform vec3 uLight; varying vec3 vN; varying vec3 vV;
        void main(){ vec3 n = normalize(vN), v = normalize(vV); float f = 1.0 - abs(dot(n, v));
          float l = dot(n, normalize(vec3(-.55,.65,.55)))*.5+.5;
          vec3 c = mix(uDeep, uLight, clamp(l*.75 + (1.0-f)*.35, 0., 1.));
          float hl = smoothstep(.93, .995, dot(n, normalize(vec3(-.45,.55,.7)))) * .35;
          c = mix(c, vec3(1.), hl);
          float a = uOp * (0.20 + 0.58*pow(f, 1.7) + hl*.6);
          gl_FragColor = vec4(c, a);
          #include <colorspace_fragment>
        }`,
    });
  }

  /* ---------- 입자 하나 ---------- */
  // kind: 'p' 양성자, 'n' 중성자, 'e' 전자. g.userData.r 은 반지름
  function particle(kind, r) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(SPH, partMat(kind)); m.scale.setScalar(r); m.castShadow = true; g.add(m);
    g.userData = { r, kind, body: m };
    if (kind === 'p' || kind === 'e') {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: signTex(kind === 'p' ? '+' : '-'), transparent: true, depthWrite: false }));
      sp.scale.setScalar(r * 1.25); g.add(sp); g.userData.sign = sp;
    }
    return g;
  }
  // 부호를 카메라 쪽 겉면으로 옮겨요(매 장면마다)
  const _w = V(), _c = V(), _d = V(), _s = V();
  function placeSigns(root, camera) {
    camera.getWorldPosition(_c);
    root.traverse((o) => {
      const sp = o.userData && o.userData.sign; if (!sp) return;
      o.getWorldPosition(_w); o.getWorldScale(_s);
      _d.copy(_c).sub(_w).normalize().multiplyScalar(o.userData.r * _s.x * 1.04).add(_w);
      o.worldToLocal(_d); sp.position.copy(_d);
    });
  }

  /* ---------- 원자핵 덩어리 ---------- */
  // 양성자 np개, 중성자 nn개를 공처럼 뭉쳐요(번갈아 섞음)
  function nucleus(np, nn, r = .34, seed = 3) {
    const g = new THREE.Group(), n = np + nn, rnd = mkR(seed);
    const kinds = []; let a = np, b = nn; for (let i = 0; i < n; i++) { if ((i % 2 === 0 && a) || !b) { kinds.push('p'); a--; } else { kinds.push('n'); b--; } }
    const pts = [];
    if (n === 4) [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].forEach((q) => pts.push(V(...q).normalize().multiplyScalar(r * 1.0)));
    else { const ga = Math.PI * (3 - Math.sqrt(5)); const R0 = r * 1.05 * Math.cbrt(n); for (let i = 0; i < n; i++) { const y = 1 - (i + .5) / n * 2, rr = Math.sqrt(1 - y * y), th = ga * i; pts.push(V(Math.cos(th) * rr, y, Math.sin(th) * rr).multiplyScalar(R0 * (.55 + .45 * rnd()))); } }
    const parts = kinds.map((k, i) => { const p = particle(k, r); p.position.copy(pts[i]); p.userData.home = pts[i].clone(); g.add(p); return p; });
    g.userData.parts = parts;
    return g;
  }

  /* ---------- 전자 움직임: 원자핵 주위를 매끄럽게 돌아다녀요 ---------- */
  function electronPath(seed, rMin, rMax) {
    const r = mkR(seed), a = [r() * 6, r() * 6, r() * 6], f = [.35 + r() * .3, .27 + r() * .3, .2 + r() * .25], ax = V(r() - .5, r() - .5, r() - .5).normalize();
    const q = new THREE.Quaternion().setFromAxisAngle(ax, r() * 3);
    return (t, out) => {
      const th = a[0] + t * f[0] * 2.2, ph = Math.PI / 2 + Math.sin(a[1] + t * f[1]) * 1.05;
      const rad = lerp(rMin, rMax, .5 + .5 * Math.sin(a[2] + t * f[2]));
      out.set(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)).applyQuaternion(q).multiplyScalar(rad);
      return out;
    };
  }

  /* ---------- 투명도(장면 바꾸기) ---------- */
  function prepFade(root) {
    root.traverse((o) => {
      if (!o.material) return;
      const ms = [].concat(o.material).map((m) => { const c = m.clone(); c.userData.o0 = m.opacity === undefined ? 1 : m.opacity; c.userData.dw0 = m.depthWrite; if (c.uniforms && c.uniforms.uOp) c.userData.u0 = c.uniforms.uOp.value; c.transparent = true; return c; });
      o.material = Array.isArray(o.material) ? ms : ms[0];
    });
  }
  function setFade(root, a) {
    root.visible = a > .003;
    root.traverse((o) => { if (!o.material) return; [].concat(o.material).forEach((m) => { if (m.uniforms && m.uniforms.uOp) m.uniforms.uOp.value = m.userData.u0 * a; else m.opacity = m.userData.o0 * a; m.depthWrite = !!m.userData.dw0 && a > .98; }); });
  }

  /* ---------- 그림 재료: 금괴 ---------- */
  function goldBar() {
    const s = new THREE.Shape(); const wb = .62, wt = .46, h = .42;
    s.moveTo(-wb, 0); s.lineTo(wb, 0); s.lineTo(wt, h); s.lineTo(-wt, h); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 2.3, bevelEnabled: true, bevelThickness: .07, bevelSize: .05, bevelSegments: 4, steps: 1 });
    geo.translate(0, 0, -1.15); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#f3c24f', metalness: 1, roughness: .27, envMapIntensity: 1.25 }));
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function goldBars() {
    const g = new THREE.Group();
    const a = goldBar(); a.position.set(-.75, 0, .25); a.rotation.y = .32; g.add(a);
    const b = goldBar(); b.position.set(.62, 0, .55); b.rotation.y = .5; g.add(b);
    const c = goldBar(); c.position.set(-.05, .49, .25); c.rotation.set(.05, -.18, -.05); c.scale.setScalar(1.02); g.add(c);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: .2 })); fl.rotation.x = -Math.PI / 2; fl.position.y = -.07; fl.receiveShadow = true; g.add(fl);
    g.scale.setScalar(1.6); g.position.y = -1.05;
    g.userData.focus = V(-.08, .96 * 1.6 - 1.05, .3 * 1.6); // 맨 위 금괴의 윗면
    return g;
  }
  // 금 원자: 노란 공이 빽빽이 쌓인 모습(그림 Ⅳ-4)
  function goldLattice() {
    const g = new THREE.Group(), r = .5, rows = 13, cols = 15, layers = 3, list = [];
    for (let L = 0; L < layers; L++) for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      const x = (j - cols / 2) * 2 * r + (i % 2) * r + (L % 2) * r, z = (i - rows / 2) * Math.sqrt(3) * r + (L % 2) * r * .577, y = -L * r * 1.633;
      if (Math.hypot(x, z) > 7.4) continue; list.push(V(x, y, z));
    }
    const mat = new THREE.MeshStandardMaterial({ color: '#f2bf36', metalness: .35, roughness: .38, envMapIntensity: 1.1 });
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(r * .985, 36, 24), mat, list.length);
    const m4 = new THREE.Matrix4(); list.forEach((p, i) => { m4.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(i, m4); });
    im.castShadow = true; im.receiveShadow = true; g.add(im);
    g.rotation.x = .62; g.position.y = -.3;
    return g;
  }

  /* ---------- 그림 재료: 헬륨 풍선 ---------- */
  function balloonGeo() {
    const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * Math.PI; const y = -Math.cos(a) * 1.25; let x = Math.sin(a) * 1.0 * (1 - .32 * Math.pow(1 - t, 2.2)); if (t < .06) x *= t / .06 * .9 + .1; pts.push(new THREE.Vector2(Math.max(.02, x), y)); }
    const g = new THREE.LatheGeometry(pts, 64); g.computeVertexNormals(); return g;
  }
  function balloon(color) {
    const g = new THREE.Group();
    const skin = new THREE.Mesh(balloonGeo(), new THREE.MeshPhysicalMaterial({ color, roughness: .42, clearcoat: .25, clearcoatRoughness: .5, sheen: .4, sheenColor: new THREE.Color('#ffffff') }));
    skin.castShadow = true; g.add(skin);
    const knot = new THREE.Mesh(new THREE.ConeGeometry(.09, .16, 16), skin.material); knot.position.y = -1.32; knot.rotation.x = Math.PI; g.add(knot);
    return g;
  }
  function balloons() {
    const g = new THREE.Group();
    const spec = [['#f4b740', -1.55, .35, -.6, .12], ['#e34c64', 0, .55, .25, 0], ['#4cb3d4', 1.5, .3, -.45, -.14]];
    const sm = new THREE.MeshStandardMaterial({ color: '#9aa4ae', roughness: .8 });
    spec.forEach(([c, x, y, z, tilt], i) => {
      const b = balloon(c); b.position.set(x, y, z); b.rotation.z = tilt; b.scale.setScalar(i === 1 ? 1.08 : .96); g.add(b);
      const top = V(x + Math.sin(-tilt) * -1.4, y - 1.42, z), pts = [top, V(lerp(top.x, 0, .4) + (i - 1) * .15, -1.2, z * .5), V((i - 1) * .12, -2.55, .1)];
      g.add(C3.tube(pts, .012, sm, 40));
    });
    const hold = new THREE.Mesh(new THREE.CylinderGeometry(.22, .26, .26, 24), new THREE.MeshStandardMaterial({ color: '#5d6b79', roughness: .6 })); hold.position.set(0, -2.6, .1); hold.castShadow = true; g.add(hold);
    g.position.y = .35;
    g.userData.focus = V(0, .9, .25 + 1.0);
    return g;
  }
  // 풍선 속: 헬륨 원자들이 자유롭게 움직여요
  function heGas(n = 26) {
    const g = new THREE.Group(), r = mkR(11), atoms = [];
    const wall = new THREE.Mesh(new THREE.SphereGeometry(12, 48, 32), new THREE.MeshBasicMaterial({ color: '#f6d3d9', side: THREE.BackSide })); g.add(wall);
    for (let i = 0; i < n; i++) {
      const a = new THREE.Group();
      const c = new THREE.Mesh(SPH, cloudMat(1)); c.scale.setScalar(.42); c.renderOrder = 2; a.add(c);
      const k = new THREE.Mesh(SPH, partMat('p')); k.scale.setScalar(.07); a.add(k);
      a.position.set((r() - .5) * 8, (r() - .5) * 5, (r() - .5) * 4 - 1);
      a.userData.v = V(r() - .5, r() - .5, r() - .5).normalize().multiplyScalar(.6 + r() * .5);
      g.add(a); atoms.push(a);
    }
    const pick = atoms[0]; pick.position.set(.2, .1, 1.2); pick.userData.v.multiplyScalar(.15);
    g.userData = { atoms, pick, focus: pick.position };
    g.userData.step = (dt) => atoms.forEach((a) => {
      const p = a.position, v = a.userData.v; p.addScaledVector(v, dt);
      if (Math.abs(p.x) > 4.6) { v.x *= -1; p.x = Math.sign(p.x) * 4.6; } if (Math.abs(p.y) > 2.9) { v.y *= -1; p.y = Math.sign(p.y) * 2.9; } if (p.z > 1.8 || p.z < -3.5) { v.z *= -1; p.z = clamp(p.z, -3.5, 1.8); }
      if (a === pick) { p.x = clamp(p.x, -.6, .9); p.y = clamp(p.y, -.5, .7); }
    });
    return g;
  }
  // 헬륨 원자 하나(그림 Ⅳ-6): 원자핵(양성자 2, 중성자 2)과 전자 2개
  function heAtom() {
    const g = new THREE.Group();
    const cloud = new THREE.Mesh(SPH, cloudMat(1)); cloud.scale.setScalar(3); cloud.renderOrder = 3; g.add(cloud);
    const nuc = nucleus(2, 2, .3); g.add(nuc);
    const simple = particle('p', .5); simple.userData.sign.visible = false; simple.scale.setScalar(.001); g.add(simple);
    const es = [0, 1].map((i) => { const e = particle('e', .19); e.userData.path = electronPath(5 + i * 17, 1.55, 2.45); g.add(e); return e; });
    g.userData = { cloud, nuc, simple, es, t: Math.random() * 10, simp: 0, simpTo: 0 };
    g.userData.step = (dt, run = true) => {
      const u = g.userData; if (run) u.t += dt;
      es.forEach((e, i) => e.userData.path(u.t + i * 3.1, e.position));
      u.simp += (u.simpTo - u.simp) * Math.min(1, dt * 3.2);
      const k = ease(clamp(u.simp));
      nuc.userData.parts.forEach((p) => { p.position.copy(p.userData.home).multiplyScalar(1 - k); p.scale.setScalar(Math.max(.001, 1 - k)); });
      simple.scale.setScalar(Math.max(.001, k)); if (u.spin !== false) { nuc.rotation.y += dt * .25 * (1 - k); nuc.rotation.x += dt * .12 * (1 - k); }
    };
    return g;
  }

  /* ---------- 무대 공통 ---------- */
  function stage(host, o = {}) {
    const st = makeStage(host, Object.assign({ top: '#ffffff', bottom: '#e7eff6', fov: 32, minD: 3, maxD: 40, fitWidth: true, hold: true, exposure: 1.0 }, o));
    st.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    st.onFrame(() => placeSigns(st.scene, st.camera));
    return st;
  }
  function frameBox(w, h, d = 1) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial()); m.visible = false; return m; }

  /* ===================== 1) 연속 확대 ===================== */
  const CHAIN = {
    gold: [
      { name: '금괴', make: goldBars, labels: [['금 원소 · 금을 이루는 물질', 'big', () => V(0, 1.75, .3)]], K: 9 },
      { name: '금 원자', make: goldLattice, labels: [['금 원자 · 금 원소를 구성하는 입자', 'big', () => V(0, 2.4, 1.0)]] },
    ],
    he: [
      { name: '헬륨 풍선', make: balloons, labels: [['헬륨 풍선', 'big', () => V(0, 2.75, .3)]], K: 7 },
      { name: '풍선 속 헬륨', make: heGas, labels: [['헬륨 원자', 'big', (g) => V().copy(g.userData.pick.position).add(V(0, .75, 0))]], K: 6.5 },
      { name: '헬륨 원자', make: heAtom, labels: [['원자핵', '', () => V(0, -.62, .2)], ['전자', '', (g) => V().copy(g.userData.es[0].position).add(V(0, .45, 0))], ['헬륨 원자', 'big', () => V(0, 3.35, 0)]], K: 5.5 },
      { name: '원자핵', make: null, labels: [] }, // 헬륨 원자를 원자핵 둘레로 확대한 장면
    ],
  };
  function dive(host, which) {
    const st = stage(host, which === 'he' ? { top: '#ffffff', bottom: '#e6eef5' } : { top: '#ffffff', bottom: '#ece8de' });
    const chain = CHAIN[which];
    const levels = chain.map((c, i) => { if (!c.make) return null; const inner = c.make(), g = new THREE.Group(); g.add(inner); g.userData = inner.userData; prepFade(g); st.scene.add(g); return g; });
    const frame = frameBox(7.2, 5.4); st.scene.add(frame);
    st.camera.position.set(0, 1.2, 14); st.controls.target.set(0, 0, 0);
    const home = st.fit(frame, { dir: V(0, .16, 1), margin: 1.02 });
    st.controls.minDistance = 4; st.controls.maxDistance = 30;
    const API = { st, lv: 0, busy: false, simple: false, onEvent: null, NAMES: chain.map((c) => c.name) };
    // 이름표
    const LB = [];
    chain.forEach((c, i) => c.labels.forEach(([t, cls, at]) => { const g = levels[i] || levels[i - 1]; const L = st.label(t, 'zl ' + cls, () => at(g)); L.lv = i; L.show = false; LB.push(L); }));
    let nucLab = [];
    if (which === 'he') {
      const g = levels[2], parts = g.userData.nuc.userData.parts;
      nucLab = [st.label('양성자', 'zl pr', () => parts[0].getWorldPosition(V()).add(V(0, .0, 0))), st.label('중성자', 'zl ne', () => parts[1].getWorldPosition(V()))];
      nucLab.forEach((L) => (L.show = false));
      API.simpleLab = st.label('+2', 'zl nucq', () => g.userData.simple.getWorldPosition(V())); API.simpleLab.show = false;
    }
    function labels(lv, on) {
      LB.forEach((L) => (L.show = on && L.lv === lv && !(lv === 2 && API.simple && L.el.textContent === '원자핵')));
      nucLab.forEach((L) => (L.show = on && lv === 3));
      if (API.simpleLab) API.simpleLab.show = on && lv === 2 && API.simple;
    }
    // 장면 상태 정하기: lv 단계에서 각 그룹의 크기·위치·투명도
    function pose(lv, k = 1, from = lv) {
      levels.forEach((g, i) => { if (!g) return; g.visible = false; });
      const set = (i, s, pos, a) => { const g = levels[i]; if (!g) return; g.scale.setScalar(s); g.position.copy(pos); setFade(g, a); };
      if (which === 'he' && (lv === 3 || from === 3)) {
        // 헬륨 원자 → 원자핵: 원자핵을 가운데 두고 크게
        const t = from === 3 && lv === 2 ? 1 - k : lv === 3 ? k : 1;
        const s = lerp(1, 5.2, ease(t)); set(2, s, V(), 1);
        const cl = levels[2].userData.cloud; cl.material.uniforms.uOp.value = 1 - clamp(t * 1.6);
        return;
      }
      if (from === lv) { if (levels[lv]) set(lv, 1, V(), 1); return; }
      // from → lv (한 단계 들어가거나 나오기)
      const inward = lv > from, a = inward ? from : lv, b = inward ? lv : from, t = ease(inward ? k : 1 - k);
      const ga = levels[a], gb = levels[b], K = chain[a].K || 6;
      const f = ga.userData.focus.clone();
      const sa = lerp(1, K, t); set(a, sa, f.clone().multiplyScalar(1 - sa), 1 - clamp((t - .35) / .45));
      const sb = lerp(1 / K, 1, t); set(b, sb, f.clone().multiplyScalar(1 - t), clamp((t - .3) / .5));
    }
    let anim = null;
    function go(lv) {
      lv = Math.max(0, Math.min(chain.length - 1, lv));
      if (API.busy || lv === API.lv) return;
      const from = API.lv, step = lv > from ? 1 : -1;
      if (Math.abs(lv - from) > 1) { jump(lv); return; }
      if (API.simple && which === 'he') setSimple(false);
      labels(from, false); API.busy = true; st.controls.enabled = false;
      st.flyTo(home.p, home.t, .45);
      anim = { from, to: lv, k: 0, delay: .45 };
      API.onEvent && API.onEvent('leave', from);
    }
    function jump(lv) {
      anim = null; API.lv = lv; API.busy = false; st.controls.enabled = true; if (API.simple) setSimple(false);
      pose(lv); labels(lv, true); st.flyTo(home.p, home.t, 0);
      API.onEvent && API.onEvent('arrive', lv);
    }
    function setSimple(on) {
      if (which !== 'he') return; API.simple = !!on; levels[2].userData.simpTo = on ? 1 : 0; labels(API.lv, !API.busy);
    }
    st.onFrame((dt) => {
      levels.forEach((g) => g && g.visible && g.userData.step && g.userData.step(dt));
      if (which === 'he') levels[2].userData.spin = API.lv !== 3 && !(anim && anim.to === 3);
      if (!anim) return;
      if (anim.delay > 0) { anim.delay -= dt; return; }
      anim.k = Math.min(1, anim.k + dt / (REDUCE ? .01 : 1.7));
      pose(anim.to, anim.k, anim.from);
      if (anim.k >= 1) { const to = anim.to; anim = null; API.lv = to; API.busy = false; st.controls.enabled = true; pose(to); labels(to, true); API.onEvent && API.onEvent('arrive', to); }
    });
    pose(0); labels(0, true);
    Object.assign(API, { go, jump, setSimple, levels });
    prepare(st).then(() => { window.__ready = true; });
    return API;
  }

  /* ===================== 2) 원자 모형 실험실 (해 보기) ===================== */
  function lab(host) {
    const st = stage(host, { top: '#ffffff', bottom: '#eaf1f7', fov: 30 });
    st.controls.enabled = false;
    const R = 3, g = new THREE.Group(); st.scene.add(g);
    const cloud = new THREE.Mesh(SPH, cloudMat(1)); cloud.scale.setScalar(R); cloud.renderOrder = 3; g.add(cloud);
    const core = new THREE.Mesh(SPH, partMat('p')); core.scale.setScalar(.62); core.castShadow = true; g.add(core);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: C3.blobTex(), transparent: true, opacity: .35, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = -R - .05; sh.scale.set(.75, .32, 1); g.add(sh);
    const frame = frameBox(6.6, 6.7); frame.position.y = -.1; st.scene.add(frame);
    st.camera.position.set(0, 0, 14); st.fit(frame, { dir: V(0, 0, 1), margin: 1.0 });
    const qLab = st.label('', 'zl nucq', () => core.getWorldPosition(V())); qLab.show = false;
    const nameLab = st.label('', 'zl big', () => V(0, -R - .45, 0)); nameLab.show = false;
    const API = { st: { p: 0, es: [] }, onChange: null, onBlock: null, name: '' };
    const es = []; // {g, k, born}
    function add(p, quiet) {
      const e = particle('e', .27); e.position.copy(p); e.userData.k = quiet ? 1 : 0; g.add(e); es.push(e);
      API.st.es = es.map((x) => x.position.clone()); if (!quiet) API.onChange && API.onChange(API.st);
    }
    function remove(e) { g.remove(e); es.splice(es.indexOf(e), 1); API.st.es = es.map((x) => x.position.clone()); API.onChange && API.onChange(API.st); }
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(V(0, 0, 1), 0), hit = V();
    host.addEventListener('pointerup', (ev) => {
      const rc = host.getBoundingClientRect(); ndc.set(((ev.clientX - rc.left) / rc.width) * 2 - 1, -((ev.clientY - rc.top) / rc.height) * 2 + 1);
      ray.setFromCamera(ndc, st.camera);
      const hitE = ray.intersectObjects(es.map((e) => e.userData.body), false)[0];
      if (hitE) { const e = es.find((x) => x.userData.body === hitE.object); if (e) remove(e); return; }
      if (!ray.ray.intersectPlane(plane, hit)) return;
      const d = Math.hypot(hit.x, hit.y);
      if (d > R * .93) return;
      if (!API.st.p) { API.onBlock && API.onBlock('p'); return; }
      if (d < .62 + .35) { API.onBlock && API.onBlock('core'); return; }
      if (es.length >= API.st.p) { API.onBlock && API.onBlock('full'); return; }
      if (es.some((e) => Math.hypot(e.position.x - hit.x, e.position.y - hit.y) < .55)) { hit.x += .3; hit.y += .25; }
      add(V(hit.x, hit.y, .25));
    });
    st.onFrame((dt, t) => {
      es.forEach((e, i) => { e.userData.k = Math.min(1, e.userData.k + dt * 4); const k = e.userData.k, s = k < 1 ? easeO(k) * (1 + .25 * Math.sin(k * Math.PI)) : 1; e.scale.setScalar(Math.max(.001, s)); e.position.z = .25 + Math.sin(t * 1.3 + i) * .04; });
      g.rotation.y = Math.sin(t * .35) * .05;
    });
    // 전자 n개를 고르게 흩어 놓기(검사·한꺼번에 채우기용)
    function spots(n) { const out = [], r = mkR(n * 13 + 7); let tries = 0; while (out.length < n && tries++ < 4000) { const a = r() * 6.283, d = 1.25 + r() * 1.35, p = V(Math.cos(a) * d, Math.sin(a) * d, .25); if (out.every((q) => q.distanceTo(p) > .85) && es.every((e) => e.position.distanceTo(p) > .85)) out.push(p); } return out; }
    Object.assign(API, {
      setAtom(name) { API.name = name; nameLab.set(name + ' 원자'); nameLab.show = true; API.clear(true); API.st.p = 0; qLab.show = false; core.material = partMat('p'); },
      setP(n) { API.st.p = n; qLab.set('+' + n); qLab.show = true; },
      clear(quiet) { es.slice().forEach((e) => g.remove(e)); es.length = 0; API.st.es = []; if (!quiet) API.onChange && API.onChange(API.st); },
      fill(k) { const n = (k === undefined ? API.st.p : k) - es.length; spots(n).forEach((p, i) => add(p, i < n - 1)); },
    });
    prepare(st).then(() => { window.__ready = true; });
    return API;
  }

  /* ===================== 3) 양성자수에 따라 바뀌는 원자 ===================== */
  function single(host, o = {}) {
    const st = stage(host, { top: '#ffffff', bottom: '#eaf1f7', fov: 30 });
    st.controls.enabled = !!o.orbit;
    const R = 3, g = new THREE.Group(); st.scene.add(g);
    const cloud = new THREE.Mesh(SPH, cloudMat(1)); cloud.scale.setScalar(R); cloud.renderOrder = 3; g.add(cloud);
    const core = new THREE.Mesh(SPH, partMat('p')); core.scale.setScalar(.62); core.castShadow = true; g.add(core);
    const frame = frameBox(6.4, 6.4); st.scene.add(frame);
    st.camera.position.set(0, 0, 14); st.fit(frame, { dir: V(0, .05, 1), margin: 1.0 });
    const qLab = st.label('', 'zl nucq', () => core.getWorldPosition(V()));
    const es = [], fly = []; let t0 = 0, Z = 0, pulse = 0;
    function mkE(i) { const e = particle('e', .21); e.userData.path = electronPath(31 + i * 23, 1.3, 2.55); return e; }
    function setZ(z, animate) {
      z = Math.max(1, Math.min(20, z)); const old = Z; Z = z; qLab.set('+' + z);
      if (!animate || REDUCE || old === 0 || Math.abs(z - old) !== 1) {
        fly.forEach((f) => g.remove(f.o)); fly.length = 0;
        while (es.length > z) g.remove(es.pop());
        while (es.length < z) { const e = mkE(es.length); g.add(e); es.push(e); }
        return;
      }
      if (z > old) { // 양성자가 날아와 원자핵에 붙고, 전자가 하나 들어와요
        const p = particle('p', .3); p.position.set(-5.2, 1.6, .5); g.add(p); fly.push({ o: p, a: p.position.clone(), b: V(), k: 0, dur: .9, end: () => { g.remove(p); pulse = 1; } });
        const e = mkE(es.length); g.add(e); es.push(e); e.userData.enter = 0;
      } else { // 양성자가 빠져나가고, 전자도 하나 나가요
        const p = particle('p', .3); g.add(p); fly.push({ o: p, a: V(), b: V(5.2, -1.4, .5), k: 0, dur: .9, end: () => g.remove(p) });
        const e = es.pop(); const a = e.position.clone(); fly.push({ o: e, a, b: a.clone().normalize().multiplyScalar(6.5), k: 0, dur: .8, end: () => g.remove(e) });
        pulse = -1;
      }
    }
    const tmp = V();
    st.onFrame((dt) => {
      t0 += dt;
      es.forEach((e, i) => {
        e.userData.path(t0 * .9 + i * 1.7, tmp);
        if (e.userData.enter !== undefined) { e.userData.enter = Math.min(1, e.userData.enter + dt / .9); const k = ease(e.userData.enter); e.position.lerpVectors(V(5.4, 2.0, .6), tmp, k); if (e.userData.enter >= 1) delete e.userData.enter; }
        else e.position.copy(tmp);
      });
      for (let i = fly.length - 1; i >= 0; i--) { const f = fly[i]; f.k = Math.min(1, f.k + dt / f.dur); const k = ease(f.k); f.o.position.lerpVectors(f.a, f.b, k); if (f.o.userData.kind === 'p') f.o.position.y += Math.sin(k * Math.PI) * .5; if (f.k >= 1) { f.end(); fly.splice(i, 1); } }
      if (pulse) { const s = 1 + .14 * Math.sin((1 - Math.abs(pulse)) * Math.PI); core.scale.setScalar(.62 * s); pulse = Math.sign(pulse) * Math.max(0, Math.abs(pulse) - dt * 2.5); if (Math.abs(pulse) < .01) { pulse = 0; core.scale.setScalar(.62); } }
      g.rotation.y = Math.sin(t0 * .3) * .08;
    });
    const API = { st, setZ, get Z() { return Z; } };
    prepare(st).then(() => { window.__ready = true; });
    return API;
  }

  /* ===================== 읽기·카드용 사진 장면 ===================== */
  // which: 'he-detail' 그림 Ⅳ-6, 'he-simple' 그림 Ⅳ-7, 'gold-bars', 'gold-atoms', 'struct' 그림 Ⅳ-5, 'card'
  function still(host, which) {
    const st = stage(host, { top: '#ffffff', bottom: '#ffffff', fov: 30 });
    st.scene.background = new THREE.Color('#ffffff');
    st.controls.enabled = false;
    let fr, dir = V(0, .05, 1), margin = 1.02;
    if (which === 'gold-bars') { const g = goldBars(); st.scene.add(g); fr = frameBox(4.2, 2.2); fr.position.y = .05; dir = V(.15, .5, 1); margin = 1.0; st.scene.background = new THREE.Color('#ffffff'); }
    else if (which === 'gold-atoms') { const g = goldLattice(); st.scene.add(g); fr = frameBox(6, 6); }
    else {
      const g = heAtom(); st.scene.add(g);
      if (which === 'he-simple') { g.userData.simpTo = 1; g.userData.simp = 1; st.label('+2', 'zl nucq', () => V()); }
      g.userData.step(0.01);
      if (which === 'struct' || which === 'card') {
        // 그림 Ⅳ-5처럼 전자 여러 개가 아니라, 헬륨 원자 그대로 두되 전자 자리를 보기 좋게
        g.userData.es[0].position.set(-1.9, 1.25, .8); g.userData.es[1].position.set(1.7, -1.55, .6);
      } else { g.userData.es[0].position.set(.6, 2.1, .9); g.userData.es[1].position.set(-1.65, -1.6, .7); }
      g.userData.step = null; fr = frameBox(6.15, 6.15);
      if (which === 'card') { dir = V(.25, .18, 1); }
    }
    st.scene.add(fr); st.camera.position.set(0, 0, 14); st.fit(fr, { dir, margin });
    prepare(st).then(() => { window.__ready = true; });
    return { st };
  }

  return { COL, particle, nucleus, dive, lab, single, still, cloudMat };
})();
