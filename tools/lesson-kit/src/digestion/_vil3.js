/* ===== 융털과 흡수 3D 도구 VIL3 (교과서 200쪽 그림 Ⅵ-5) =====
   VIL3.wall: 작은창자 안쪽 벽의 주름과 그 위를 덮은 융털. 주름·융털을 없애면 벽이 매끈해진다(표면적 비교, 수치는 쓰지 않음).
   VIL3.villus: 융털 다섯 개, 가운데 하나는 앞쪽을 잘라 속의 암죽관(가운데)과 모세혈관(둘레)을 보인다.
     포도당·아미노산·무기염류 → 모세혈관, 지방산·모노글리세리드 → 암죽관으로 들어가 아래로 운반된다.
   모양·크기·알갱이 수는 잘 보이게 정한 모형이다. C3와 같은 모듈 안에 넣는다. */
const VIL3 = (() => {
  'use strict';
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const REDUCE = C3.REDUCE;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .78, metalness: 0 }, o));
  const COL = { vil: '#e9a383', vilIn: '#e59a7d', wall: '#dd8f71', mus: '#c96a57', sub: '#f3cdb6', art: '#cf3b2f', vein: '#4d6fb3', lac: '#f4e2a2' };

  (function css() { const c = document.createElement('style'); c.textContent = '.hl{position:absolute;left:0;top:0;z-index:4;font:700 clamp(13px,1.25vw,16px)/1.2 Pretendard,sans-serif;color:#14263b;white-space:nowrap;pointer-events:none;background:rgba(255,255,255,.88);padding:2px 7px;border-radius:6px}.hl.b{font-weight:800;font-size:clamp(14px,1.45vw,18px)}.hl small{display:block;font-size:.76em;font-weight:700;color:#5a6b7e;margin-top:1px}'; document.head.appendChild(c); })();
  function labels(st) {
    const host = st.host, ov = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ov.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3'); host.appendChild(ov);
    const L = {}, p = V();
    st.onFrame(() => {
      const { W, H } = st.size();
      Object.values(L).forEach((a) => {
        a.e.style.display = a.show ? '' : 'none'; a.ln.style.display = a.show ? '' : 'none'; if (!a.show) return;
        const port = H > W * 1.02, xx = port && a.px !== undefined ? a.px : a.x, yy = port && a.py !== undefined ? a.py : a.y;
        const tx = xx * W, ty = yy * H; a.e.style.transform = `translate(${tx}px,${ty}px) translate(${xx < .5 ? '-100%' : '0'},-50%)`;
        p.copy(typeof a.at === 'function' ? a.at() : a.at).project(st.camera);
        a.ln.setAttribute('x1', (p.x + 1) / 2 * W); a.ln.setAttribute('y1', (1 - p.y) / 2 * H); a.ln.setAttribute('x2', tx + (xx < .5 ? 4 : -4)); a.ln.setAttribute('y2', ty);
      });
    });
    const add = (k, t, at, x, y, extra = {}) => { const e = document.createElement('div'); e.className = 'hl b'; e.innerHTML = t; host.appendChild(e); const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line'); ln.setAttribute('stroke', '#14263b'); ln.setAttribute('stroke-width', '1'); ov.appendChild(ln); L[k] = Object.assign({ e, ln, at, x, y, show: false }, extra); return L[k]; };
    const only = (keys) => { Object.entries(L).forEach(([k, a]) => { a.show = keys.includes(k); }); };
    const place = (P) => { Object.entries(P).forEach(([k, a]) => { const l = L[k]; if (!l) return; [l.x, l.y] = a; l.px = a[2] !== undefined ? a[2] : a[0]; l.py = a[3] !== undefined ? a[3] : a[1]; }); };
    return { add, only, place, L };
  }
  function stage(host, opt) {
    const st = C3.makeStage(host, { fov: 32, minD: 3, maxD: 80, hold: !!opt.hold, exposure: 1, sunX: 6, sunZ: 9 });
    st.scene.background = new THREE.Color('#ffffff'); st.scene.environmentIntensity = .5;
    st.sun.position.set(8, 14, 12); st.sun.castShadow = false;
    const fill = new THREE.DirectionalLight(0xffffff, .5); fill.position.set(-10, 5, 8); st.scene.add(fill);
    const clk = { dt: 0, last: 0 };
    st.onFrame((d) => { if (window.__bakeT !== undefined) { const n = window.__bakeT; clk.dt = Math.max(0, n - clk.last); clk.last = n; } else clk.dt = Math.min(.05, d); });
    return { st, clk };
  }
  /* 손가락 모양 융털 단면 (아래 넓고 끝이 둥근) */
  function profile(r, h, n = 18) {
    const pts = [V(r * 1.18, 0, 0)];
    for (let i = 1; i <= n; i++) { const t = i / n, y = t * (h - r); pts.push(new THREE.Vector2(r * (1.1 - .1 * t + .08 * Math.sin(t * 9)), y)); }
    for (let i = 1; i <= 10; i++) { const a = i / 10 * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r, h - r + Math.sin(a) * r)); }
    return pts.map((p) => new THREE.Vector2(p.x, p.y));
  }
  /* 겉에 작은 돌기가 있는 듯한 결 */
  const bumpTex = () => { const t = C3.canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '0,0,0'},.18)`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2.5, 0, 7); g.fill(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.NoColorSpace; return t; };

  /* ===================== 주름과 융털 ===================== */
  function wall(host, opt = {}) {
    const { st, clk } = stage(host, opt);
    const root = new THREE.Group(); st.scene.add(root);
    const NX = 160, NZ = 70, SX = 16, SZ = 7;
    const fold = (x) => { const k = Math.cos(x / SX * Math.PI * 2 * 2.5); return Math.pow(Math.max(0, k), 3) * 1.9; };
    const g0 = new THREE.PlaneGeometry(SX, SZ, NX, NZ); g0.rotateX(-Math.PI / 2);
    const pa = g0.attributes.position, base = pa.array.slice();
    const wm = mat(COL.wall, { roughness: .82, bumpMap: bumpTex(), bumpScale: .6 });
    const surf = new THREE.Mesh(g0, wm); root.add(surf);
    /* 아래 층 (근육) */
    const slab = new THREE.Mesh(new THREE.BoxGeometry(SX, 1.2, SZ), [mat(COL.mus), mat(COL.mus), mat(COL.sub), mat(COL.mus), mat('#d98270'), mat('#d98270')]); slab.position.y = -.62; root.add(slab);
    { const tex = C3.canvasTex(512, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f2c2a8'); gr.addColorStop(.35, '#e39c86'); gr.addColorStop(.4, '#c8665a'); gr.addColorStop(1, '#a8483e'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(120,40,30,.25)'; for (let y = 30; y < h; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + 2); g.stroke(); } }); slab.material[4].map = tex; slab.material[4].color.set('#ffffff'); slab.material[4].needsUpdate = true; }
    /* 융털 (인스턴스) */
    const vg = new THREE.LatheGeometry(profile(.075, .5), 10);
    const NV = 2600, im = new THREE.InstancedMesh(vg, mat(COL.vil, { roughness: .7 }), NV); root.add(im);
    const VP = Array.from({ length: NV }, () => ({ x: rnd(-SX / 2 + .1, SX / 2 - .1), z: rnd(-SZ / 2 + .1, SZ / 2 - .1), s: rnd(.8, 1.2), r: rnd(0, 6) }));
    let flat = 0, flatTo = 0;
    const dum = new THREE.Object3D(), up = V(0, 1, 0), nrm = V();
    const apply = () => {
      const f = 1 - flat;
      for (let i = 0; i < pa.count; i++) { const x = base[i * 3]; pa.setY(i, fold(x) * f); }
      pa.needsUpdate = true; g0.computeVertexNormals();
      VP.forEach((p, i) => { const h = fold(p.x) * f, dh = (fold(p.x + .01) - fold(p.x - .01)) / .02 * f; nrm.set(-dh, 1, 0).normalize(); dum.position.set(p.x, h - .02, p.z); dum.quaternion.setFromUnitVectors(up, nrm); dum.rotateY(p.r); dum.scale.setScalar(p.s * f); dum.updateMatrix(); im.setMatrixAt(i, dum.matrix); });
      im.instanceMatrix.needsUpdate = true;
    };
    /* 앞쪽 자른 면: 주름 속 조직 */
    const skirtM = mat('#e39a80', { roughness: .9, side: THREE.DoubleSide });
    const skirt = new THREE.Mesh(new THREE.BufferGeometry(), skirtM); skirt.position.z = SZ / 2 + .001; root.add(skirt);
    const apply0 = apply;
    const applyAll = () => { apply0(); const f = 1 - flat, sh = new THREE.Shape(); sh.moveTo(-SX / 2, 0); for (let i = 0; i <= NX; i++) { const x = -SX / 2 + SX * i / NX; sh.lineTo(x, Math.max(.001, fold(x) * f)); } sh.lineTo(SX / 2, 0); sh.closePath(); skirt.geometry.dispose(); skirt.geometry = new THREE.ShapeGeometry(sh); };
    applyAll();
    st.onFrame(() => { if (Math.abs(flatTo - flat) > .002) { flat += (flatTo - flat) * Math.min(1, clk.dt * (REDUCE ? 20 : 2.5)); applyAll(); } });
    const lab = labels(st);
    lab.add('fold', '작은창자 안쪽 벽의 주름', () => V(-SX / 4 + .2, fold(-SX / 4) * (1 - flat) + .3, 0), .2, .14);
    lab.add('vil', '융털<small>주름 표면의 작은 돌기</small>', () => V(SX / 4 + .4, .5 * (1 - flat), SZ / 2 - .4), .8, .2);
    const box = new THREE.Mesh(new THREE.BoxGeometry(SX * .82, 3.4, SZ)); box.position.set(0, .4, 0); box.visible = false; st.scene.add(box);
    st.fit([box], { dir: V(.18, .62, 1).normalize(), margin: 1.04 });
    return { st, lab, set flat(v) { flatTo = v; }, get flat() { return flatTo; }, showLabs: (k) => lab.only(k), place: (P) => lab.place(P) };
  }

  /* ===================== 융털 속 ===================== */
  function villus(host, opt = {}) {
    const { st, clk } = stage(host, opt);
    const root = new THREE.Group(); st.scene.add(root);
    const R = .62, Hh = 4.2;
    const bump = bumpTex();
    const outM = mat(COL.vil, { roughness: .74, bumpMap: bump, bumpScale: .5 });
    const xs = [-3.1, -1.55, 0, 1.55, 3.1];
    xs.forEach((x, i) => { if (i === 2) return; const m = new THREE.Mesh(new THREE.LatheGeometry(profile(R * (.92 + .06 * Math.sin(i * 3)), Hh * (.92 + .07 * Math.cos(i * 2))), 36), outM); m.position.set(x, 0, -.35 + (i % 2) * .5); root.add(m); });
    /* 가운데 융털: 앞쪽 반을 잘라 속을 보인다 */
    const cut = new THREE.Group(); root.add(cut);
    const shell = new THREE.Mesh(new THREE.LatheGeometry(profile(R * 1.06, Hh * 1.04), 48, Math.PI * .425, Math.PI * 1.15), [outM]);
    shell.material = mat(COL.vil, { roughness: .74, bumpMap: bump, bumpScale: .5, side: THREE.DoubleSide }); cut.add(shell);
    const inner = new THREE.Mesh(new THREE.LatheGeometry(profile(R * .96, Hh * .99), 48, Math.PI * .425, Math.PI * 1.15), mat(COL.vilIn, { roughness: .85, side: THREE.BackSide })); cut.add(inner);
    /* 잘린 면 (얇은 테두리) */
    const rimM = mat('#f6cdb6', { roughness: .9, side: THREE.DoubleSide });
    [Math.PI * .425, Math.PI * 1.575].forEach((a) => { const sh = new THREE.Shape(); const po = profile(R * 1.06, Hh * 1.04), pi = profile(R * .96, Hh * .99); po.forEach((p, k) => (k ? sh.lineTo(p.x, p.y) : sh.moveTo(p.x, p.y))); pi.slice().reverse().forEach((p) => sh.lineTo(p.x, p.y)); const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), rimM); m.rotation.y = a - Math.PI / 2; cut.add(m); });
    /* 암죽관: 가운데 */
    const lacC = new THREE.CatmullRomCurve3([V(0, -1.3, .05), V(0, 0, 0), V(.02, 1.6, .03), V(0, 3.05, 0), V(0, 3.3, 0)]);
    const lac = new THREE.Mesh(new THREE.TubeGeometry(lacC, 60, .15, 16), mat(COL.lac, { roughness: .6 })); cut.add(lac);
    const lacTip = new THREE.Mesh(new THREE.SphereGeometry(.15, 16, 12), lac.material); lacTip.position.set(0, 3.3, 0); cut.add(lacTip);
    /* 모세혈관: 한쪽으로 올라가는 동맥 쪽(붉은색), 그물을 지나 다른 쪽으로 내려가는 정맥 쪽(파란색) */
    const rc = R * .72, col = (t) => new THREE.Color(COL.art).lerp(new THREE.Color(COL.vein), t);
    const tubeC = (pts, r, c0, c1) => { const cv = new THREE.CatmullRomCurve3(pts); const g = new THREE.TubeGeometry(cv, 80, r, 8); const n = g.attributes.position.count, cs = new Float32Array(n * 3); const segs = 81, rad = 9; for (let i = 0; i < n; i++) { const t = Math.floor(i / rad) / (segs - 1); const c = col(c0 + (c1 - c0) * t); cs[i * 3] = c.r; cs[i * 3 + 1] = c.g; cs[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(cs, 3)); const m = new THREE.Mesh(g, mat('#ffffff', { roughness: .5, vertexColors: true })); cut.add(m); return cv; };
    const ang = (a, y, r = rc) => V(Math.cos(a) * r, y, Math.sin(a) * r);
    const ART = tubeC([ang(-.2, -1.3, .45), ang(-.2, 0), ang(-.1, 1.4), ang(0, 2.6), ang(.4, 3.3, rc * .8), ang(1.5708, 3.55, .1)], .07, 0, .45);
    const VEN = tubeC([ang(1.5708, 3.55, .1), ang(2.7, 3.3, rc * .8), ang(3.1, 2.6), ang(3.2, 1.4), ang(3.3, 0), ang(3.3, -1.3, .45)], .08, .55, 1);
    /* 그물: 높이마다 고리, 고리 사이를 잇는 짧은 관 */
    for (let k = 0; k < 7; k++) { const y = .1 + k * .48, n = 18, pts = []; for (let j = 0; j <= n; j++) { const a = -.2 + j / n * 3.5; pts.push(ang(a, y + Math.sin(j * 1.7 + k) * .08)); } tubeC(pts, .035, .2 + k * .05, .8 + k * .02); }
    for (let k = 0; k < 6; k++) for (let j = 0; j < 4; j++) { const a = .5 + j * .7 + (k % 2) * .3, y = .1 + k * .48; tubeC([ang(a, y), ang(a + .12, y + .24), ang(a, y + .48)], .03, .3 + j * .12, .35 + j * .12); }
    /* 바닥 (작은창자 벽) */
    const base = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.3, 2.6), mat(COL.sub, { roughness: .85 })); base.position.y = -.66; root.add(base);
    const mus = new THREE.Mesh(new THREE.BoxGeometry(8.2, .5, 2.6), mat(COL.mus, { roughness: .85 })); mus.position.y = -1.55; root.add(mus);
    /* 아래로 나가는 큰 혈관과 암죽관 */
    const ves = (z, c, r) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 8.2, 16), mat(c, { roughness: .5 })); m.rotation.z = Math.PI / 2; m.position.set(0, -1.32, z); root.add(m); return m; };
    ves(.85, COL.art, .1); ves(.55, COL.vein, .12); ves(.25, COL.lac, .13);
    /* ----- 흡수되는 알갱이 ----- */
    const K = {
      glu: { g: new THREE.CylinderGeometry(.11, .11, .08, 6), c: '#6f80d8', to: 'cap' },
      ami: { g: new THREE.SphereGeometry(.09, 12, 9), c: '#e05a52', to: 'cap', many: ['#e05a52', '#4caf6a', '#4a86d0', '#f2c444', '#a26ad0'] },
      min: { g: new THREE.BoxGeometry(.11, .11, .11), c: '#8f9aa6', to: 'cap' },
      fa: { g: new THREE.CapsuleGeometry(.035, .22, 4, 8), c: '#f2c94c', to: 'lac' },
      mg: { g: new THREE.CapsuleGeometry(.05, .14, 4, 8), c: '#e0b84a', to: 'lac' },
    };
    const N = 22, dum = new THREE.Object3D();
    Object.values(K).forEach((k) => { k.im = new THREE.InstancedMesh(k.g, mat('#ffffff', { roughness: .5, depthTest: false, transparent: true }), N); k.im.renderOrder = 50; k.im.frustumCulled = false; root.add(k.im); k.a = []; for (let i = 0; i < N; i++) k.im.setColorAt(i, new THREE.Color(k.many ? k.many[i % k.many.length] : k.c)); k.im.instanceColor.needsUpdate = true; k.im.count = 0; });
    const mkPath = (to, wrong) => {
      const y0 = rnd(1.2, 3.1), a = rnd(-.4, 1.9), surf = ang(a, y0, R * 1.05), start = V(surf.x * 2.2 + rnd(-.6, .6), y0 + rnd(.8, 1.8), Math.max(.6, surf.z * 2 + 1.2));
      const pts = [start, surf.clone().multiplyScalar(1.15), surf];
      if (to === 'lac') { pts.push(V(0, y0 - .1, 0)); const t0 = y0; [2.2, 1.2, 0, -1.2].filter((y) => y < t0).forEach((y) => pts.push(V(0, y, .02))); pts.push(V(.6, -1.32, .25), V(4.2, -1.32, .25)); }
      else { const vy = Math.max(.2, y0 - .2); pts.push(ang(2.9, vy)); [1.4, 0, -1.3].filter((y) => y < vy).forEach((y, i) => pts.push(i === 2 ? ang(3.3, y, .45) : ang(3.2, y))); pts.push(V(.6, -1.32, .55), V(4.2, -1.32, .55)); }
      return new THREE.CatmullRomCurve3(pts);
    };
    const tp = V();
    st.onFrame(() => {
      const dt = clk.dt * (REDUCE ? 2 : 1);
      Object.values(K).forEach((k) => {
        k.a.forEach((p) => { p.t += dt * p.sp; });
        k.a = k.a.filter((p) => p.t < 1);
        k.im.count = k.a.length;
        k.a.forEach((p, i) => { p.c.getPointAt(Math.max(0, Math.min(1, p.t)), tp); dum.position.copy(tp); dum.rotation.set(p.t * 9 + i, p.t * 7, 0); const f = Math.min(1, p.t / .05, (1 - p.t) / .05); dum.scale.setScalar(Math.max(0, f) * 1.45); dum.updateMatrix(); k.im.setMatrixAt(i, dum.matrix); });
        k.im.instanceMatrix.needsUpdate = true;
      });
    });
    const release = (key, n = 12) => { const k = K[key]; for (let i = 0; i < n && k.a.length < N; i++) k.a.push({ c: mkPath(k.to), t: -i * .06, sp: rnd(.09, .12) }); };
    /* ----- 이름표 ----- */
    const lab = labels(st);
    lab.add('vil', '융털', () => V(-1.55, 3.6, -.2), .14, .14);
    lab.add('cap', '모세혈관<small>포도당, 아미노산, 무기염류 등 흡수</small>', () => ang(3.15, 1.6), .14, .5);
    lab.add('lac', '암죽관<small>지방산과 모노글리세리드 등 흡수</small>', () => V(0, 2.2, .1), .86, .42);
    lab.add('wall', '작은창자 안쪽 벽', () => V(3.4, -.4, 1.3), .86, .82);
    lab.only(['vil', 'cap', 'lac', 'wall']);
    const box = new THREE.Mesh(new THREE.BoxGeometry(7.6, 6.6, 2)); box.position.set(0, 1.5, 0); box.visible = false; st.scene.add(box);
    st.fit([box], { dir: V(.12, .2, 1).normalize(), margin: 1.03 });
    return { st, lab, release, showLabs: (k) => lab.only(k), place: (P) => lab.place(P), K };
  }
  return { wall, villus };
})();
window.VIL3 = VIL3;
