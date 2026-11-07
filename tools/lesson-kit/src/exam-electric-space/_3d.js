/* ===== 3D 그림: 전기 그네·오른손·전동기(lessons/motor-force와 같은 모형), 빛의 세기(star-brightness _light3d.js) =====
   three.js는 이 그림이 있는 장을 처음 볼 때만 받아요. */
window.EX3INIT = function (THREE, OrbitControls, RoomEnvironment, RoundedBoxGeometry) {
/* ===== 공통 3D 도구 (three.js) =====
   화살표 색은 교과서 그림 Ⅶ-14~16과 같게: 자기장 하늘색, 전류 초록색, 힘 빨간(주황)색.
   화살표 길이·움직이는 정도는 개념 이해를 위한 모형이에요(숫자 없음). */
const C3 = (() => {
  const COL = { B: 0x14a5d0, I: 0x2fae4a, F: 0xf0522a, N: 0xd8433b, S: 0x2f62c9, Cu: 0xc0703a, P: 0x7d5ad6 };
  const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // 탭 껍데기에서 보이지 않는 탭이면 그리지 않아요(태블릿 배터리 아끼기)
  function visibleNow() {
    if (document.hidden) return false;
    try { const f = window.frameElement; if (f && f.hasAttribute('data-page') && !f.classList.contains('on')) return false; } catch (e) {}
    return true;
  }

  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    t.userData.canvas = c; return t;
  }
  function gradientBg(top, bottom) {
    return canvasTex(4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  }
  // 극 표시(N, S) 글자 판
  function letterTex(ch, bg) {
    return canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.96)'; g.font = '900 190px Pretendard, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(ch, w / 2, h / 2 + 10);
    });
  }
  // 나뭇결 책상
  function woodTex() {
    const t = canvasTex(1024, 512, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#c99a6b'); gr.addColorStop(1, '#b8875a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 160; i++) {
        const y = Math.random() * h, a = 0.04 + Math.random() * 0.08; g.strokeStyle = `rgba(${90 + Math.random() * 40},${55 + Math.random() * 25},30,${a})`;
        g.lineWidth = 1 + Math.random() * 3; g.beginPath(); g.moveTo(0, y);
        for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x / 90 + i) * 4 + Math.sin(x / 23) * 1.2);
        g.stroke();
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  // 바닥에 드리우는 부드러운 그림자
  function blobTex() {
    return canvasTex(256, 256, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(20,38,59,.32)'); r.addColorStop(1, 'rgba(20,38,59,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
  }

  /* 무대: 렌더러·카메라·조명·손가락 조작 */
  function makeStage(host, opt = {}) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = opt.exposure || 1.05;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'gl';
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = gradientBg(opt.top || '#f6f9fc', opt.bottom || '#d6e3ef');
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a9bb0, 0.55));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(opt.sunX || 5, 11, opt.sunZ || 7); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
    const sc = sun.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 40;
    scene.add(sun);
    const camera = new THREE.PerspectiveCamera(opt.fov || 34, 1, 0.1, 200);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.09; controls.enablePan = false;
    controls.rotateSpeed = 0.85; controls.zoomSpeed = 0.9;
    if (opt.scroll) { controls.enableZoom = false; renderer.domElement.style.touchAction = 'pan-y'; host.style.touchAction = 'pan-y'; }
    controls.minDistance = opt.minD || 4; controls.maxDistance = opt.maxD || 24; controls.maxPolarAngle = Math.PI * 0.86;

    const overlay = document.createElement('div'); overlay.className = 'lbls'; host.appendChild(overlay);
    let W = 1, H = 1;
    function resize() {
      const r = host.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
      renderer.setSize(W, H, false); camera.aspect = W / H;
      if (opt.fitWidth) { // 세로 화면에서 장면이 잘리지 않도록 화각을 넓혀요
        const base = opt.fov || 34; camera.fov = camera.aspect < 1.15 ? Math.min(62, base * (1.15 / camera.aspect) * 0.92) : base;
      }
      camera.updateProjectionMatrix();
    }
    try { let rq = 0; new ResizeObserver(() => { cancelAnimationFrame(rq); rq = requestAnimationFrame(resize); }).observe(host); } catch (e) { addEventListener('resize', resize); }
    resize();

    // 이름표(HTML)를 3D 위치에 붙이기
    const labels = [];
    function label(html, cls, at) {
      const el = document.createElement('div'); el.className = 'lb ' + (cls || ''); el.innerHTML = html; overlay.appendChild(el);
      const L = { el, at, show: true, set(h) { el.innerHTML = h; } };
      labels.push(L); return L;
    }
    const tmp = V();
    function placeLabels() {
      labels.forEach((L) => {
        if (!L.show) { L.el.style.display = 'none'; return; }
        const p = typeof L.at === 'function' ? L.at() : L.at;
        if (!p) { L.el.style.display = 'none'; return; }
        tmp.copy(p).project(camera);
        if (tmp.z > 1 || tmp.z < -1) { L.el.style.display = 'none'; return; }
        const px = ((tmp.x + 1) / 2) * W, py = ((1 - tmp.y) / 2) * H;
        // 작은 창(오른손 등)에 가려지는 이름표는 숨겨요
        if (insets.some((I) => I.on && I.last && px > I.last.x - 30 && px < I.last.x + I.last.w + 30 && py > I.last.y - 12 && py < I.last.y + I.last.h + 12)) { L.el.style.display = 'none'; return; }
        L.el.style.display = '';
        L.el.style.transform = `translate(${px}px,${py}px) translate(-50%,-50%)`;
      });
    }

    // 카메라 이동
    let fly = null;
    controls.addEventListener('start', () => { fly = null; });
    function flyTo(pos, target, dur = 1.1) {
      if (REDUCE || dur <= 0) { camera.position.copy(pos); controls.target.copy(target); controls.update(); return; }
      fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: target.clone(), k: 0, dur };
    }

    // 작은 창(오른손 보기 등)을 같은 캔버스 귀퉁이에 그리기
    const insets = [];
    function addInset(sc2, cam2, rectFn) { const I = { scene: sc2, camera: cam2, rect: rectFn, on: true }; insets.push(I); return I; }

    const fns = [];
    let last = performance.now(), running = true;
    function tick(now) {
      requestAnimationFrame(tick);
      if (!running || !visibleNow() || !host.offsetParent) { last = now; return; }
      if (opt.scroll) { const hr = host.getBoundingClientRect(); if (hr.bottom < -50 || hr.top > (window.innerHeight || 800) + 50) { last = now; return; } } // 화면 밖이면 쉬기
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      if (fly) {
        fly.k = Math.min(1, fly.k + dt / fly.dur); const e = ease(fly.k);
        camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.t0, fly.t1, e);
        if (fly.k >= 1) fly = null;
      }
      for (let i = 0; i < fns.length; i++) { try { fns[i](dt, now / 1000); } catch (err) { console.error(err); } }
      controls.update();
      renderer.setScissorTest(false); renderer.setViewport(0, 0, W, H);
      renderer.render(scene, camera);
      insets.forEach((I) => {
        if (!I.on) return; const r = I.rect(W, H); I.last = r; if (!r) return;
        renderer.setScissorTest(true);
        renderer.setScissor(r.x, H - r.y - r.h, r.w, r.h); renderer.setViewport(r.x, H - r.y - r.h, r.w, r.h);
        I.camera.aspect = r.w / r.h; I.camera.updateProjectionMatrix();
        renderer.render(I.scene, I.camera);
      });
      renderer.setScissorTest(false);
      placeLabels();
    }
    requestAnimationFrame(tick);
    return { renderer, scene, camera, controls, sun, overlay, label, flyTo, onFrame: (f) => fns.push(f), addInset, size: () => ({ W, H }), resize };
  }

  /* 화살표: 원기둥 + 원뿔. setDir(방향, 길이) */
  const UP = V(0, 1, 0);
  function makeArrow(color, o = {}) {
    const r = o.r || 0.06, head = o.head || 0.3, hr = o.hr || r * 2.6;
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: o.glow == null ? 0.38 : o.glow, roughness: 0.35, metalness: 0.05, transparent: !!o.opacity, opacity: o.opacity || 1 });
    const g = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 20), mat);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(hr, head, 28), mat);
    shaft.castShadow = cone.castShadow = !!o.shadow;
    g.add(shaft, cone);
    let curLen = 1;
    g.setDir = (dir, len) => {
      if (len != null) curLen = len;
      const L = Math.max(curLen, head * 1.05);
      shaft.scale.y = L - head; shaft.position.y = (L - head) / 2; cone.position.y = L - head / 2;
      if (dir) g.quaternion.setFromUnitVectors(UP, tmpD.copy(dir).normalize());
      return g;
    };
    g.mat = mat; g.len = () => curLen;
    return g;
  }
  const tmpD = V();

  /* 오른손 모형
     손의 기준 방향: 네 손가락 = +Y, 엄지손가락 = +X, 손바닥이 향하는 쪽 = +Z
     (오른손이므로 엄지(전류) × 네 손가락(자기장) = 손바닥(힘) 방향) */
  function makeHand(o = {}) {
    const root = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: 0xeebc97, roughness: 0.62, metalness: 0 });
    const palmSkin = new THREE.MeshStandardMaterial({ color: 0xefc0a0, roughness: 0.8 });
    const nailM = new THREE.MeshStandardMaterial({ color: 0xffe9e2, roughness: 0.25 });
    const sleeve = new THREE.MeshStandardMaterial({ color: 0x35587d, roughness: 0.85 });
    const add = (m) => { m.castShadow = true; root.add(m); return m; };
    add(new THREE.Mesh(new RoundedBoxGeometry(0.94, 1.02, 0.34, 4, 0.14), skin));
    const pad = add(new THREE.Mesh(new RoundedBoxGeometry(0.84, 0.92, 0.03, 3, 0.012), palmSkin)); pad.position.set(0, -0.02, 0.155);
    // 손바닥 주름(손바닥 쪽임을 알아보기 쉽게)
    const crease = new THREE.MeshStandardMaterial({ color: 0xb97f5e, roughness: 0.8 });
    [[-0.05, 0.12, 0.62, -0.2], [0.02, -0.12, 0.55, 0.35]].forEach(([x, y, w, rz]) => { const c = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, w, 2, 6), crease); c.rotation.z = Math.PI / 2 + rz; c.position.set(x, y, 0.182); root.add(c); });
    const F = [[0.34, 0.8], [0.115, 0.9], [-0.115, 0.84], [-0.33, 0.66]];
    F.forEach(([x, L]) => {
      const r = 0.102;
      const f = add(new THREE.Mesh(new THREE.CapsuleGeometry(r, L - 2 * r, 6, 16), skin)); f.position.set(x, 0.44 + L / 2, 0);
      const n = add(new THREE.Mesh(new THREE.SphereGeometry(0.074, 16, 10), nailM)); n.scale.set(1, 1.35, 0.32); n.position.set(x, 0.44 + L - 0.14, -0.088);
      // 마디 주름
      const k = new THREE.Mesh(new THREE.TorusGeometry(r * 0.98, 0.006, 4, 18, Math.PI), crease); k.rotation.x = Math.PI / 2; k.rotation.z = Math.PI; k.position.set(x, 0.44 + L * 0.42, 0); root.add(k);
    });
    // 엄지: +X 방향으로 곧게
    const th = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.118, 0.5, 6, 16), skin)); th.rotation.z = -Math.PI / 2; th.position.set(0.78, -0.16, 0.04);
    const tn = add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 10), nailM)); tn.scale.set(1.35, 1, 0.32); tn.position.set(0.98, -0.16, -0.075);
    const mound = add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), skin)); mound.scale.set(1.1, 1.05, 0.62); mound.position.set(0.36, -0.2, 0.04);
    const wrist = add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.33, 0.55, 24), skin)); wrist.scale.z = 0.62; wrist.position.y = -0.74;
    const cuff = add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.62, 28), sleeve)); cuff.scale.z = 0.72; cuff.position.y = -1.25;
    // 세 화살표
    const aB = makeArrow(COL.B, { r: 0.05, head: 0.24 }); aB.position.set(0, 1.5, 0); aB.setDir(V(0, 1, 0), 0.75);
    const aI = makeArrow(COL.I, { r: 0.05, head: 0.24 }); aI.position.set(1.22, -0.16, 0.04); aI.setDir(V(1, 0, 0), 0.75);
    const aF = makeArrow(COL.F, { r: 0.065, head: 0.3 }); aF.position.set(0, 0.0, 0.2); aF.setDir(V(0, 0, 1), o.fLen || 1.15);
    root.add(aB, aI, aF);
    root.arrows = { B: aB, I: aI, F: aF };
    root.tips = { B: V(0, 2.42, 0), I: V(2.2, -0.16, 0.04), F: V(0, 0, 1.6) };
    return root;
  }
  // 엄지 = 전류 방향, 네 손가락 = 자기장 방향이 되도록 손을 돌리는 회전값
  function handQuat(iDir, bDir) {
    const x = iDir.clone().normalize(), y = bDir.clone().normalize(), z = V().crossVectors(x, y).normalize();
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  }

  /* 7-세그먼트 숫자(디지털 전원 장치 화면) */
  const SEG = { '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g', ' ': '' };
  function seg7(g, txt, x, y, s, on, off) {
    let cx = x;
    for (const ch of txt) {
      if (ch === '.') { g.fillStyle = on; g.beginPath(); g.arc(cx - s * 0.12, y + s * 1.9, s * 0.11, 0, 7); g.fill(); continue; }
      const segs = SEG[ch] || '', w = s, t = s * 0.2, h = s * 0.95;
      const R = { a: [cx + t, y, w - 2 * t, t], d: [cx + t, y + 2 * h, w - 2 * t, t], g: [cx + t, y + h, w - 2 * t, t], f: [cx, y + t * 0.6, t, h - t * 0.4], b: [cx + w - t, y + t * 0.6, t, h - t * 0.4], e: [cx, y + h + t * 0.6, t, h - t * 0.4], c: [cx + w - t, y + h + t * 0.6, t, h - t * 0.4] };
      Object.keys(R).forEach((k) => { g.fillStyle = segs.includes(k) ? on : off; const r = R[k]; g.fillRect(r[0], r[1], r[2], r[3]); });
      cx += w * 1.35;
    }
  }

  // 관 모양 전선(곡선)
  function tube(points, r, mat, seg = 80) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 10, false), mat); m.castShadow = true; m.curve = curve; return m;
  }

  // 길을 따라 움직이는 전류 화살표(작은 원뿔). setPath(점 배열), update(dt, 빠르기, 방향)
  function makeFlow(count, color, size = 1) {
    const geo = new THREE.ConeGeometry(0.055 * size, 0.17 * size, 12); geo.rotateX(Math.PI / 2); // 원뿔 끝 = +Z
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9, roughness: 0.3 });
    const mesh = new THREE.InstancedMesh(geo, mat, count); mesh.frustumCulled = false;
    let pts = [], cum = [], total = 1, off = 0; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = V(), d = V(), sc = V(1, 1, 1), Z = V(0, 0, 1);
    function setPath(P) {
      pts = P; cum = [0];
      for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + P[i].distanceTo(P[i - 1]));
      total = cum[cum.length - 1] || 1;
    }
    function at(s, out, dir) {
      s = ((s % total) + total) % total;
      let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
      const a = pts[i - 1], b = pts[i], seg = cum[i] - cum[i - 1] || 1, k = (s - cum[i - 1]) / seg;
      out.lerpVectors(a, b, k); dir.subVectors(b, a).normalize();
    }
    function update(dt, speed, sign, visible) {
      mesh.visible = !!visible && pts.length > 1;
      if (!mesh.visible) return;
      off += dt * speed * sign;
      const gap = total / count;
      for (let k = 0; k < count; k++) {
        at(off + k * gap, p, d);
        if (sign < 0) d.negate();
        q.setFromUnitVectors(Z, d); m4.compose(p, q, sc); mesh.setMatrixAt(k, m4);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
    return { mesh, setPath, update, mat };
  }

  // 책상과 그림자 받는 바닥
  function addTable(scene, w, d, y = 0) {
    const tex = woodTex(); tex.repeat.set(w / 10, d / 10);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0 });
    const t = new THREE.Mesh(new RoundedBoxGeometry(w, 0.4, d, 3, 0.12), mat); t.position.y = y - 0.2; t.receiveShadow = true; scene.add(t);
    return t;
  }

  return { COL, REDUCE, V, ease, makeStage, makeArrow, makeHand, handQuat, letterTex, canvasTex, blobTex, seg7, tube, makeFlow, addTable, visibleNow };
})();
/* ===== 3D 장치 모형 (시뮬레이션과 같은 모형을 읽기·정리 그림에 씀) ===== */
const KIT = (() => {
  const { V, COL } = C3;
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
  const mats = () => ({
    white: new THREE.MeshStandardMaterial({ color: 0xf3f5f7, roughness: 0.42 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x2a3036, roughness: 0.5, metalness: 0.2 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xd0d6dc, metalness: 0.92, roughness: 0.26 }),
    cu: new THREE.MeshStandardMaterial({ color: 0xc8733a, metalness: 1, roughness: 0.3 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 1, roughness: 0.3 }),
    carbon: new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.7 }),
    plastic: new THREE.MeshStandardMaterial({ color: 0x2f3a46, roughness: 0.55 }),
    black: new THREE.MeshStandardMaterial({ color: 0x1d2024, roughness: 0.55 }),
    red: new THREE.MeshStandardMaterial({ color: 0xd23b33, roughness: 0.45 }),
    acryl: new THREE.MeshPhysicalMaterial({ color: 0xe8f6ff, roughness: 0.04, transparent: true, opacity: 0.22, clearcoat: 1 }),
    magN: new THREE.MeshPhysicalMaterial({ color: COL.N, roughness: 0.36, clearcoat: 0.55, clearcoatRoughness: 0.25 }),
    magS: new THREE.MeshPhysicalMaterial({ color: COL.S, roughness: 0.36, clearcoat: 0.55, clearcoatRoughness: 0.25 }),
  });

  /* 전기 그네: 그림 Ⅶ-15처럼 말굽자석을 옆으로 세움(처음: N극 아래, S극 위). +z = 말굽자석 바깥쪽 */
  function swing(scene) {
    const M = mats();
    C3.addTable(scene, 15, 11);
    scene.add(mesh(new RoundedBoxGeometry(6.2, 0.25, 5.0, 3, 0.08), M.white, 0, 0.125, -0.25));
    const POSTX = 2.4, TOPY = 5.4, HOOKX = 0.95;
    [-1, 1].forEach((sx) => {
      scene.add(mesh(new THREE.CylinderGeometry(0.075, 0.075, TOPY - 0.25, 20), M.steel, sx * POSTX, 0.25 + (TOPY - 0.25) / 2, 0));
      scene.add(mesh(new RoundedBoxGeometry(0.62, 0.16, 0.62, 2, 0.05), M.dark, sx * POSTX, 0.33, 0));
      const tm = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.18, 18), sx > 0 ? M.red : M.black, sx * POSTX, 0.42, 0.33); tm.rotation.x = Math.PI / 2; scene.add(tm);
      scene.add(mesh(new THREE.SphereGeometry(0.11, 18, 12), M.steel, sx * POSTX, TOPY, 0));
      const rail = mesh(new THREE.CylinderGeometry(0.05, 0.05, POSTX - 0.45, 16), M.steel, sx * (0.45 + (POSTX - 0.45) / 2), TOPY, 0); rail.rotation.z = Math.PI / 2; scene.add(rail);
      const hook = mesh(new THREE.TorusGeometry(0.09, 0.022, 10, 24), M.steel, sx * HOOKX, TOPY - 0.03, 0); hook.rotation.y = Math.PI / 2; scene.add(hook);
      // 전원 장치로 가는 전선(뒤쪽으로)
      const lead = C3.tube([V(sx * POSTX, 0.42, 0.44), V(sx * POSTX, 0.2, 0.9), V(sx * (POSTX + 0.9), 0.06, 1.2), V(sx * (POSTX + 2.4), 0.06, -0.6), V(sx * (POSTX + 3.2), 0.06, -3.5)], 0.045, sx > 0 ? M.red : M.black, 80);
      scene.add(lead);
    });
    scene.add(mesh(new RoundedBoxGeometry(0.95, 0.2, 0.2, 2, 0.05), M.black, 0, TOPY, 0));
    const sw = new THREE.Group(); sw.position.set(0, TOPY, 0); scene.add(sw);
    const CT = -3.05, CB = -4.35, CX = HOOKX;
    [-1, 1].forEach((sx) => {
      sw.add(mesh(new THREE.CylinderGeometry(0.028, 0.028, 3.0, 12), M.steel, sx * CX, -1.5, 0));
      sw.add(mesh(new RoundedBoxGeometry(0.2, 0.18, 0.3, 2, 0.04), M.black, sx * CX, CT + 0.04, 0));
    });
    sw.add(mesh(new RoundedBoxGeometry(2.25, 0.62, 0.06, 2, 0.02), M.acryl, 0, CT - 0.22, -0.16));
    function rrect(x0, x1, y0, y1, r, z) {
      const P = [], arc = (cx, cy, a0) => { for (let k = 0; k <= 6; k++) { const a = a0 + (k / 6) * Math.PI / 2; P.push(V(cx + r * Math.cos(a), cy + r * Math.sin(a), z)); } };
      arc(x1 - r, y1 - r, 0); arc(x0 + r, y1 - r, Math.PI / 2); arc(x0 + r, y0 + r, Math.PI); arc(x1 - r, y0 + r, Math.PI * 1.5);
      return P;
    }
    for (let k = 0; k < 6; k++) {
      const curve = new THREE.CatmullRomCurve3(rrect(-CX, CX, CB, CT, 0.1, -0.1 + k * 0.04), true, 'catmullrom', 0.1);
      sw.add(mesh(new THREE.TubeGeometry(curve, 160, 0.021, 8, true), M.cu));
    }
    const MAGY = 1.05, TIP = 1.0, BEND = -1.6;
    const magPivot = new THREE.Group(); magPivot.position.set(0, MAGY, 0); scene.add(magPivot);
    const magnet = new THREE.Group(); magPivot.add(magnet);
    function half(lower) {
      const s = new THREE.Shape();
      if (lower) { s.moveTo(TIP, -0.75); s.lineTo(BEND, -0.75); s.absarc(BEND, 0, 0.75, -Math.PI / 2, -Math.PI, true); s.lineTo(BEND - 0.25, 0); s.absarc(BEND, 0, 0.25, Math.PI, Math.PI * 1.5, false); s.lineTo(TIP, -0.25); }
      else { s.moveTo(TIP, 0.75); s.lineTo(BEND, 0.75); s.absarc(BEND, 0, 0.75, Math.PI / 2, Math.PI, false); s.lineTo(BEND - 0.25, 0); s.absarc(BEND, 0, 0.25, Math.PI, Math.PI / 2, true); s.lineTo(TIP, 0.25); }
      s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: 1.0, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 3, curveSegments: 28 });
      g.translate(0, 0, -0.5); g.rotateY(-Math.PI / 2); g.computeVertexNormals();
      return mesh(g, lower ? M.magN : M.magS);
    }
    magnet.add(half(true), half(false));
    const texN = C3.letterTex('N', '#d8433b'), texS = C3.letterTex('S', '#2f62c9');
    [[texN, -0.5], [texS, 0.5]].forEach(([t, v]) => {
      const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.4 });
      [-1, 1].forEach((sx) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), mat); p.position.set(sx * 0.538, v, 0.45); p.rotation.y = sx * Math.PI / 2; magnet.add(p); });
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), mat); f.position.set(0, v, TIP + 0.04); magnet.add(f);
    });
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4), new THREE.MeshBasicMaterial({ map: C3.blobTex(), transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.set(0, 0.255, -0.4); scene.add(blob);
    const fieldG = new THREE.Group(); magnet.add(fieldG);
    [-1.15, -0.6, 0.72].forEach((z) => [-0.3, 0, 0.3].forEach((x) => { const a = C3.makeArrow(COL.B, { r: 0.022, head: 0.14, hr: 0.06, glow: 0.5 }); a.position.set(x, -0.23, z); a.setDir(V(0, 1, 0), 0.46); fieldG.add(a); }));
    const aI = C3.makeArrow(COL.I, { r: 0.045, head: 0.24 }); sw.add(aI);
    const aF = C3.makeArrow(COL.F, { r: 0.075, head: 0.32, shadow: true }); scene.add(aF);
    const flow = C3.makeFlow(40, COL.I, 1.15); scene.add(flow.mesh);
    // 안쪽·바깥쪽 표시
    const pkA = C3.makeArrow(COL.P, { r: 0.035, head: 0.2, hr: 0.09, glow: 0.3 }), pkB = C3.makeArrow(COL.P, { r: 0.035, head: 0.2, hr: 0.09, glow: 0.3 });
    pkA.position.set(-1.6, 0.42, 0.1); pkA.setDir(V(0, 0, -1), 0.85); pkB.position.set(-1.6, 0.42, 0.1); pkB.setDir(V(0, 0, 1), 0.85); scene.add(pkA, pkB);

    let th = 0, om = 0, magAnim = null, magSign = 1, shownFlip = false, magHome = true;
    const flowPts = [], bottomW = V();
    const K = {
      sw, magPivot, magnet, fieldG, aF, aI,
      pts: { out: V(-1.6, 0.5, 1.45), inn: V(-1.6, 0.5, -1.2) },
      busy: () => !!magAnim,
      cur: { sI: 1, sB: 1, on: false },
      // st: { on, rev, flip, k(세기), showF, showI, showB }
      update(dt, st) {
        if (shownFlip !== !!st.flip && !magAnim) { magAnim = { k: 0, from: magPivot.rotation.z, to: st.flip ? Math.PI : 0 }; shownFlip = !!st.flip; }
        if (magAnim) {
          magAnim.k = Math.min(1, magAnim.k + (C3.REDUCE ? 1 : dt / 2.1)); const k = magAnim.k;
          const out = k < 0.33 ? C3.ease(k / 0.33) : k < 0.67 ? 1 : 1 - C3.ease((k - 0.67) / 0.33);
          const rot = k < 0.33 ? 0 : k < 0.67 ? C3.ease((k - 0.33) / 0.34) : 1;
          magPivot.position.set(0, MAGY + out * 0.12, -2.5 * out);
          magPivot.rotation.z = magAnim.from + (magAnim.to - magAnim.from) * rot; magHome = false;
          if (k >= 1) { magAnim = null; magHome = true; magSign = st.flip ? -1 : 1; magPivot.position.set(0, MAGY, 0); }
        }
        const sI = st.rev ? -1 : 1, kI = st.on ? (st.k || 1) : 0, kB = magHome ? 1 : 0;
        const Fz = st.noForce ? 0 : sI * magSign * kI * kB;
        const thEq = -Math.atan(0.072 * Fz), w0 = 2.5, z = 0.13;
        for (let i = 0; i < 4; i++) { const h = dt / 4; om += (-w0 * w0 * (th - thEq) - 2 * z * w0 * om) * h; th += om * h; }
        sw.rotation.x = th;
        fieldG.visible = st.showB !== false;
        bottomW.copy(sw.localToWorld(V(0, CB, 0)));
        aF.visible = st.showF !== false && Math.abs(Fz) > 0.01;
        if (aF.visible) { aF.position.copy(bottomW).add(V(0, 0, Math.sign(Fz) * 0.16)); aF.setDir(V(0, 0, Math.sign(Fz)), 0.45 + 0.42 * Math.abs(Fz)); }
        aI.visible = st.showI !== false && kI > 0; aI.position.set(-0.62 * sI, CB, -0.3); aI.setDir(V(sI, 0, 0), 1.24);
        flowPts.length = 0;
        flowPts.push(V(POSTX, 0.42, 0), V(POSTX, TOPY, 0), V(HOOKX, TOPY, 0));
        [V(CX, -0.05, 0), V(CX, CT, 0.15), V(-CX, CT, 0.15), V(-CX, CB, 0.15), V(CX, CB, 0.15), V(CX, CT, 0.15), V(-CX, CT, 0.15), V(-CX, -0.05, 0)].forEach((p) => flowPts.push(sw.localToWorld(p)));
        flowPts.push(V(-HOOKX, TOPY, 0), V(-POSTX, TOPY, 0), V(-POSTX, 0.42, 0));
        flow.setPath(flowPts); flow.update(dt, 0.9 + 0.5 * kI, sI, st.showI !== false && kI > 0);
        K.cur = { sI, sB: magSign, on: kI > 0 && magHome, out: Fz };
      },
      amount: () => th,
      snapFlip(f) { magAnim = null; shownFlip = !!f; magSign = f ? -1 : 1; magHome = true; magPivot.rotation.z = f ? Math.PI : 0; magPivot.position.set(0, MAGY, 0); },
    };
    return K;
  }

  /* 전동기: 그림 Ⅶ-16처럼 왼쪽 S극, 오른쪽 N극. 앞(+z)에 금속 고리와 전지 */
  function motor(scene) {
    const M = mats();
    C3.addTable(scene, 14, 11, -1.4);
    const BASEY = -1.4;
    scene.add(mesh(new RoundedBoxGeometry(8.2, 0.24, 6.6, 3, 0.08), new THREE.MeshStandardMaterial({ color: 0xf2f4f6, roughness: 0.5 }), 0, BASEY + 0.12, 0.6));
    const TOPB = BASEY + 0.24;
    const R = 1.72, HY = 0.95, OUT = 2.75, ZH = 0.85, MY = TOPB + HY;
    const a = Math.asin(HY / R), xi = Math.sqrt(R * R - HY * HY), s = new THREE.Shape();
    s.moveTo(OUT, -HY); s.lineTo(OUT, HY); s.lineTo(xi, HY); s.absarc(0, 0, R, a, -a, true); s.lineTo(OUT, -HY); s.closePath();
    const pg = new THREE.ExtrudeGeometry(s, { depth: 2 * ZH, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, curveSegments: 40 });
    pg.translate(0, 0, -ZH); pg.computeVertexNormals();
    const mR = mesh(pg, M.magN, 0, MY, 0), mL = mesh(pg, M.magS, 0, MY, 0); mL.rotation.y = Math.PI; scene.add(mR, mL);
    [[mR, 'N', '#d8433b'], [mL, 'S', '#2f62c9']].forEach(([m, ch, c]) => {
      const mat = new THREE.MeshStandardMaterial({ map: C3.letterTex(ch, c), roughness: 0.4 });
      [[V(2.25, 0, ZH + 0.055), 0], [V(OUT + 0.055, 0, 0), Math.PI / 2]].forEach(([p, ry]) => { const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), mat); pl.position.copy(p); pl.rotation.y = ry; m.add(pl); });
      const top = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), mat); top.position.set(2.25, HY + 0.055, 0); top.rotation.x = -Math.PI / 2; m.add(top);
    });
    const fieldG = new THREE.Group(); fieldG.position.y = MY; scene.add(fieldG);
    [-0.6, 0, 0.6].forEach((y) => [-0.55, 0, 0.55].forEach((z) => { const ar = C3.makeArrow(COL.B, { r: 0.024, head: 0.16, hr: 0.065, glow: 0.45, opacity: 0.8 }); ar.position.set(1.62, y, z); ar.setDir(V(-1, 0, 0), 3.2); fieldG.add(ar); }));
    const A = 1.12, ZC = 1.3, AXY = MY;
    const rotor = new THREE.Group(); rotor.position.set(0, AXY, 0); scene.add(rotor);
    const ax = mesh(new THREE.CylinderGeometry(0.055, 0.055, 5.0, 18), M.steel, 0, 0, 0.55); ax.rotation.x = Math.PI / 2; rotor.add(ax);
    const coilPts = (dx, dy) => [V(0.13, dy, 1.72), V(0.13, dy, ZC), V(A + dx, dy, ZC), V(A + dx, dy, -ZC), V(-A - dx, dy, -ZC), V(-A - dx, dy, ZC), V(-0.13, dy, ZC), V(-0.13, dy, 1.72)];
    function polyTube(P, r, mat) { const path = new THREE.CurvePath(); for (let i = 1; i < P.length; i++) path.add(new THREE.LineCurve3(P[i - 1], P[i])); return mesh(new THREE.TubeGeometry(path, P.length * 24, r, 10, false), mat); }
    [[0, 0], [0.07, 0.05], [0.07, -0.05], [0.14, 0]].forEach(([dx, dy]) => rotor.add(polyTube(coilPts(dx, dy), 0.034, M.cu)));
    rotor.add(mesh(new RoundedBoxGeometry(0.42, 0.42, 0.18, 2, 0.05), M.plastic, 0, 0, -ZC));
    const ringG = new THREE.Group(); ringG.position.z = 1.92; rotor.add(ringG);
    [0, Math.PI].forEach((t0) => { const m = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.42, 32, 1, true, t0 + 0.2, Math.PI - 0.4), M.brass); m.rotation.x = Math.PI / 2; ringG.add(m); });
    const core = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.44, 24), M.plastic); core.rotation.x = Math.PI / 2; ringG.add(core);
    [-1.85, 2.8].forEach((z) => { scene.add(mesh(new RoundedBoxGeometry(0.5, AXY - TOPB, 0.18, 2, 0.05), M.plastic, 0, TOPB + (AXY - TOPB) / 2 - 0.05, z)); scene.add(mesh(new THREE.TorusGeometry(0.12, 0.05, 10, 24), M.steel, 0, AXY, z)); });
    const BRZ = 1.92;
    [-1, 1].forEach((sx) => {
      scene.add(mesh(new RoundedBoxGeometry(0.3, 0.16, 0.22, 2, 0.04), M.carbon, sx * 0.34, AXY, BRZ));
      scene.add(mesh(new THREE.BoxGeometry(0.05, AXY - TOPB - 0.1, 0.12), M.brass, sx * 0.52, TOPB + (AXY - TOPB) / 2 - 0.05, BRZ));
      scene.add(mesh(new THREE.BoxGeometry(0.2, 0.04, 0.12), M.brass, sx * 0.44, AXY, BRZ));
    });
    const bat = new THREE.Group(); bat.position.set(0, TOPB, 3.35); scene.add(bat);
    bat.add(mesh(new RoundedBoxGeometry(2.1, 0.32, 0.9, 2, 0.06), M.black, 0, 0.16, 0));
    const cellTex = C3.canvasTex(256, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#2e6fd0'); gr.addColorStop(0.8, '#2e6fd0'); gr.addColorStop(0.8, '#c9cfd6'); gr.addColorStop(1, '#c9cfd6'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const cellMat = new THREE.MeshStandardMaterial({ map: cellTex, roughness: 0.35, metalness: 0.2 });
    [-0.42, 0.42].forEach((x) => { const c = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.86, 28), cellMat, x, 0.48, 0); c.rotation.z = Math.PI / 2; bat.add(c); const n = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 16), M.steel, x + 0.45, 0.48, 0); n.rotation.z = Math.PI / 2; bat.add(n); });
    const wR = C3.tube([V(0.95, TOPB + 0.5, 3.35), V(1.25, TOPB + 0.1, 3.0), V(0.9, TOPB + 0.06, 2.1), V(0.52, TOPB + 0.08, BRZ)], 0.045, M.red, 60);
    const wL = C3.tube([V(-0.52, TOPB + 0.08, BRZ), V(-0.9, TOPB + 0.06, 2.1), V(-1.25, TOPB + 0.1, 3.0), V(-0.95, TOPB + 0.5, 3.35)], 0.045, M.black, 60);
    scene.add(wR, wL);
    const fR = C3.makeArrow(COL.F, { r: 0.08, head: 0.34, shadow: true }), fL = C3.makeArrow(COL.F, { r: 0.08, head: 0.34, shadow: true }); scene.add(fR, fL);
    const iR = C3.makeArrow(COL.I, { r: 0.045, head: 0.24 }), iL = C3.makeArrow(COL.I, { r: 0.045, head: 0.24 }); scene.add(iR, iL);
    const flow = C3.makeFlow(46, COL.I, 1.2); scene.add(flow.mesh);
    const spin = new THREE.Group(); spin.position.set(0, AXY, -2.25); scene.add(spin);
    const spinMat = new THREE.MeshStandardMaterial({ color: COL.P, emissive: COL.P, emissiveIntensity: 0.3, transparent: true, opacity: 0.9 });
    const spinArc = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.045, 8, 48, Math.PI * 1.4), spinMat); spinArc.rotation.z = 0.3; spin.add(spinArc);
    const spinHead = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.32, 20), spinMat); spin.add(spinHead);
    spinHead.position.set(0.75 * Math.cos(0.3 + Math.PI * 1.4), 0.75 * Math.sin(0.3 + Math.PI * 1.4), 0); spinHead.rotation.z = 0.3 + Math.PI * 1.4;
    let phi = 0, om = 0;
    const flowPts = [];
    const K = {
      rotor, fR, fL, iR, iL, fieldG, spin, A, AXY, brake() { om = 0; },
      // st: { run, hold, showI, showF, showSpin, k }
      update(dt, st) {
        const sg = st.rev ? -1 : 1, c = Math.cos(phi), on = (st.run || st.hold) && Math.abs(c) > 0.13, I = on ? (st.k || 1) : 0;
        if (st.run) om += (I * Math.abs(c) * 7.5 - 1.7 * om) * dt; else om += -3.2 * om * dt;
        if (st.hold) { const t = Math.round(phi / Math.PI) * Math.PI; phi += (t - phi) * Math.min(1, dt * 4); om = 0; }
        phi += sg * om * dt; rotor.rotation.z = phi; spin.scale.x = sg;
        spin.visible = !!st.showSpin || Math.abs(om) > 0.05;
        const pR = c >= 0 ? 1 : -1, sideR = rotor.localToWorld(V(pR * A, 0, 0)), sideL = rotor.localToWorld(V(-pR * A, 0, 0));
        fR.visible = fL.visible = !!st.showF && on;
        if (fR.visible) { fR.position.copy(sideR).add(V(0, 0.1 * sg, 0)); fR.setDir(V(0, sg, 0), 1.05); fL.position.copy(sideL).add(V(0, -0.1 * sg, 0)); fL.setDir(V(0, -sg, 0), 1.05); }
        iR.visible = iL.visible = !!st.showI && on;
        if (iR.visible) { iR.position.copy(sideR).add(V(0.24, 0, 0.75 * sg)); iR.setDir(V(0, 0, -sg), 1.5); iL.position.copy(sideL).add(V(-0.24, 0, -0.75 * sg)); iL.setDir(V(0, 0, sg), 1.5); }
        flowPts.length = 0;
        flowPts.push(...wR.curve.getPoints(16));
        [V(pR * 0.2, 0, 1.85), V(pR * 0.13, 0, 1.72), V(pR * 0.13, 0, ZC), V(pR * A, 0, ZC), V(pR * A, 0, -ZC), V(-pR * A, 0, -ZC), V(-pR * A, 0, ZC), V(-pR * 0.13, 0, ZC), V(-pR * 0.13, 0, 1.72), V(-pR * 0.2, 0, 1.85)].forEach((p) => flowPts.push(rotor.localToWorld(p.add(V(0, 0.07, 0)))));
        flowPts.push(...wL.curve.getPoints(16));
        flow.setPath(flowPts); flow.update(dt, 1.4, sg, !!st.showI && on);
      },
    };
    return K;
  }
  return { swing, motor };
})();
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
    const halo2 = glowSprite(3.2, 0.3); g.add(halo2);
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
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.MeshPhysicalMaterial({ color: 0x3f73d8, transparent: true, opacity: 0.04, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false }));
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
        P.glass.material.opacity = on ? 0.36 : 0.2; P.grid.material.opacity = on ? 1 : 0.6;
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

  const { V } = C3, { seg, button } = EX._;
  const capEl = (h) => { const e = document.createElement('div'); e.className = 'cap3d'; h.appendChild(e); return e; };
  const capSet = (e, t) => { if (e.textContent !== t) e.textContent = t; };

  /* 전기 그네 (그림 Ⅶ-15 네 경우) */
  function swing(h, c) {
    h.classList.add('g3');
    const st = C3.makeStage(h, { fitWidth: true }), k = KIT.swing(st.scene), cap = capEl(h);
    st.label('자기장', 'B', () => (k.fieldG.visible ? k.magnet.localToWorld(V(-1.9, 1.05, 0.4)) : null));
    st.label('전류', 'I', () => (k.aI.visible ? k.aI.localToWorld(V(0, k.aI.len() + 0.2, 0)) : null));
    st.label('힘', 'F', () => (k.aF.visible ? k.aF.localToWorld(V(0, k.aF.len() + 0.22, 0)) : null));
    st.label('안쪽', 'P', k.pts.inn); st.label('바깥쪽', 'P', k.pts.out);
    st.camera.position.set(-7.5, 4.7, 8.9); st.controls.target.set(0.2, 2.6, 0.2); st.controls.update();
    const S = { rev: false, flip: false, k: 1.4 };
    st.onFrame((dt) => {
      k.update(dt, { on: !k.busy(), rev: S.rev, flip: S.flip, k: S.k });
      capSet(cap, k.busy() ? '말굽자석의 N극과 S극을 바꾸는 중' : `전류 ${S.rev ? '반대' : '처음'} · 자기장 ${S.flip ? '반대' : '처음'} → 힘은 ${k.cur.out > 0 ? '바깥쪽' : '안쪽'}`);
    });
    const a = seg(c, [[false, '전류 처음'], [true, '전류 반대']], false, (v) => { off(); S.rev = v; });
    const b = seg(c, [[false, '자기장 처음'], [true, '자기장 반대']], false, (v) => { off(); S.flip = v; });
    seg(c, [[0.8, '전류 약하게'], [1.4, '전류 세게']], 1.4, (v) => { S.k = v; });
    let tm = 0, i = 0; const off = () => clearInterval(tm), CASES = [[false, false], [true, false], [true, true], [false, true]];
    const set = () => { S.rev = CASES[i][0]; S.flip = CASES[i][1]; a.mark(S.rev); b.mark(S.flip); };
    return { play() { off(); i = 0; set(); tm = setInterval(() => { i = (i + 1) % 4; set(); }, 5200); }, stop: off };
  }

  /* 오른손 (그림 Ⅶ-14): 손바닥이 보이게 */
  function hand(h, c) {
    h.classList.add('g3');
    const st = C3.makeStage(h, { fitWidth: true, top: '#fbf8f3', bottom: '#eef1f4', fov: 30, minD: 4, exposure: 0.8 }), cap = capEl(h);
    const H = C3.makeHand({ fLen: 1.5 }); st.scene.add(H);
    st.camera.position.set(3.2, 2.3, 8.8); st.controls.target.set(0.1, 0.6, 0); st.controls.update();
    const w = (P) => H.localToWorld(P.clone());
    const lb = [st.label('네 손가락: 자기장', 'B', () => w(H.tips.B)), st.label('엄지손가락: 전류', 'I', () => w(V(2.25, 0.2, 0.04))), st.label('손바닥이 향하는 쪽: 힘', 'F', () => w(V(-0.1, -0.15, 2.75))), st.label('손바닥', 'small', () => w(V(0.02, 0.36, 0.3)))];
    const S = { sI: 1, sB: 1, step: 3 }, cL = V(0.5, 0.3, 0.4);
    const AR = [H.arrows.B, H.arrows.I, H.arrows.F];
    const look = () => { AR.forEach((x, i) => { x.visible = i < S.step; lb[i].show = i < S.step; }); capSet(cap, ['네 손가락을 자기장 방향으로', '엄지손가락을 전류 방향으로', '손바닥이 향하는 쪽이 힘의 방향'][Math.max(0, S.step - 1)]); };
    st.onFrame((dt) => {
      const q = C3.handQuat(V(S.sI, 0, 0), V(0, S.sB, 0));
      H.quaternion.slerp(q, C3.REDUCE ? 1 : Math.min(1, dt * 5));
      H.position.copy(cL).applyQuaternion(H.quaternion).negate();
    });
    look();
    let tm = 0; const off = () => clearInterval(tm);
    seg(c, [[1, '전류 처음'], [-1, '전류 반대']], 1, (v) => { off(); S.sI = v; S.step = 3; look(); });
    seg(c, [[1, '자기장 처음'], [-1, '자기장 반대']], 1, (v) => { off(); S.sB = v; S.step = 3; look(); });
    return { play() { off(); S.step = 1; look(); tm = setInterval(() => { S.step++; look(); if (S.step >= 3) off(); }, 1900); }, stop: off };
  }

  /* 전동기 (그림 Ⅶ-16) */
  function motor(h, c) {
    h.classList.add('g3');
    const st = C3.makeStage(h, { fitWidth: true, minD: 3 }), k = KIT.motor(st.scene), cap = capEl(h);
    st.camera.position.set(4.2, 4.4, 8.6); st.controls.target.set(0, -0.2, 0.7); st.controls.update();
    st.label('힘', 'F', () => (k.fR.visible ? k.fR.localToWorld(V(0, k.fR.len() + 0.22, 0)) : null));
    st.label('힘', 'F', () => (k.fL.visible ? k.fL.localToWorld(V(0, k.fL.len() + 0.22, 0)) : null));
    st.label('전류', 'I', () => (k.iR.visible ? k.iR.localToWorld(V(0, k.iR.len() + 0.2, 0)) : null));
    st.label('전류', 'I', () => (k.iL.visible ? k.iL.localToWorld(V(0, k.iL.len() + 0.2, 0)) : null));
    st.label('자기장', 'B', V(0, k.AXY + 1.5, 1.0));
    const S = { rev: false };
    st.onFrame((dt) => { k.update(dt, { run: true, rev: S.rev, showI: true, showF: true, showSpin: true, k: 1 }); capSet(cap, S.rev ? '전류 반대: 왼쪽은 위로, 오른쪽은 아래로 힘을 받아 시계 방향으로 회전' : '왼쪽은 아래로, 오른쪽은 위로 힘을 받아 시계 반대 방향으로 회전'); });
    seg(c, [[false, '전류 처음'], [true, '전류 반대']], false, (v) => { S.rev = v; k.brake(); });
    return {};
  }

  /* 거리와 빛의 세기 (그림 Ⅷ-4) */
  function inv(h, c) {
    h.classList.add('g3', 'dark3d');
    const st = C3.makeStage(h, { top: '#050a18', bottom: '#16234d', fov: 36, exposure: 1.0, minD: 3, maxD: 60, fitWidth: true }), cap = capEl(h);
    st.sun.intensity = 0.25; st.scene.children.forEach((o) => { if (o.isHemisphereLight) o.intensity = 0.3; });
    st.controls.maxPolarAngle = Math.PI * 0.9;
    { const n = 700, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = 70; pos[i * 3] = r * Math.sqrt(1 - u * u) * Math.cos(a); pos[i * 3 + 1] = r * u; pos[i * 3 + 2] = r * Math.sqrt(1 - u * u) * Math.sin(a); } const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); st.scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xdfe8ff, size: 0.22, transparent: true, opacity: 0.75, depthWrite: false }))); }
    const A = LIGHT3D.build(st, { D: 2, u: 1, n: 3, particles: 520 });
    st.label('광원', 'Y', V(0, 0.6, 0));
    A.panels.forEach((P) => { P.lbD = st.label(`거리 ${P.k} 배`, 'small', V(P.x, -P.side / 2 - 0.35, 0)); P.lbA = st.label(`${P.k * P.k} 칸`, 'small', V(P.x, P.side / 2 + 0.35, 0)); });
    const dir = V(0.34, 0.34, 1).normalize(), tg = V(3.2, 0, 0);
    st.camera.position.copy(tg).add(dir.multiplyScalar(13.5)); st.controls.target.copy(tg); st.controls.update();
    const frac = (n) => (n === 1 ? '1 배' : `1/${n} 배`);
    const set = (k) => { A.setD(k); A.panels.forEach((P) => { const on = P.k === k; P.lbD.el.classList.toggle('dim', !on); P.lbA.el.classList.toggle('dim', !on); }); capSet(cap, `거리 ${k} 배: 같은 빛이 ${k * k} 칸에 퍼져 한 칸의 밝기는 ${frac(k * k)}`); };
    const bs = seg(c, [[1, '거리 1 배'], [2, '거리 2 배'], [3, '거리 3 배']], 1, (v) => { off(); set(v); });
    set(1);
    let tm = 0, i = 1; const off = () => clearInterval(tm);
    return { play() { off(); i = 1; bs.mark(1); set(1); tm = setInterval(() => { i = i % 3 + 1; bs.mark(i); set(i); }, 2800); }, stop: off };
  }
  return { swing, hand, motor, inv };
};
