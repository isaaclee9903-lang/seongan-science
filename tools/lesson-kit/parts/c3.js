/* ===== 공통 3D 도구 (three.js) =====
   전자는 파란 알갱이(−), 전자를 잃은 쪽은 빨간 (+) 표시. 크기·개수·빠르기는 개념 이해를 위한 모형이에요(숫자 없음). */
const C3 = (() => {
  const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clamp01 = (t) => Math.max(0, Math.min(1, t));

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
    controls.minDistance = opt.minD || 3; controls.maxDistance = opt.maxD || 24; controls.maxPolarAngle = Math.PI * 0.86;

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
      const L = { el, at, show: true, set(h) { if (el.innerHTML !== h) el.innerHTML = h; } };
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

    const fns = [];
    let last = performance.now(), running = true;
    function tick(now) {
      requestAnimationFrame(tick);
      if (!running || !visibleNow()) { last = now; return; }
      if (opt.scroll) { const hr = host.getBoundingClientRect(); if (hr.bottom < -50 || hr.top > (window.innerHeight || 800) + 50) { last = now; return; } } // 화면 밖이면 쉬기
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      if (fly) {
        fly.k = Math.min(1, fly.k + dt / fly.dur); const e = ease(fly.k);
        camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.t0, fly.t1, e);
        if (fly.k >= 1) fly = null;
      }
      for (let i = 0; i < fns.length; i++) { try { fns[i](dt, now / 1000); } catch (err) { console.error(err); } }
      controls.update();
      renderer.render(scene, camera);
      placeLabels();
    }
    requestAnimationFrame(tick);

    /* 자동 구도: 물체(또는 여러 물체)가 화면에 꼭 들어오도록 카메라 거리를 찾아요.
       dir: 카메라가 놓일 방향(물체 중심에서), margin: 가장자리 여백(1.1 = 10%), dur: 이동 시간(초)
       화면 비율이 바뀌면(가로↔세로) 사용자가 돌리기 전까지 다시 맞춰요. */
    let lastFit = null, userMoved = false;
    controls.addEventListener('start', () => { userMoved = true; });
    const _box = new THREE.Box3(), _v = V(), _c = V();
    function fitPose(objs, o = {}) {
      _box.makeEmpty(); (Array.isArray(objs) ? objs : [objs]).forEach((ob) => { ob.updateMatrixWorld(true); _box.expandByObject(ob); });
      if (o.extra) o.extra.forEach((p) => _box.expandByPoint(p));
      const ctr = o.target ? o.target.clone() : _box.getCenter(V());
      const dir = (o.dir ? o.dir.clone() : camera.position.clone().sub(controls.target)).normalize();
      const pts = []; for (let i = 0; i < 8; i++) pts.push(V(i & 1 ? _box.max.x : _box.min.x, i & 2 ? _box.max.y : _box.min.y, i & 4 ? _box.max.z : _box.min.z));
      const lim = 1 / (o.margin || 1.1), cam = camera.clone();
      const ok = (d) => { cam.position.copy(ctr).addScaledVector(dir, d); cam.lookAt(ctr); cam.updateMatrixWorld(); cam.updateProjectionMatrix(); return pts.every((p) => { _c.copy(p).project(cam); return Math.abs(_c.x) <= lim && Math.abs(_c.y) <= lim && _c.z < 1; }); };
      let lo = 0.5, hi = 200; for (let k = 0; k < 28; k++) { const mid = (lo + hi) / 2; if (ok(mid)) hi = mid; else lo = mid; }
      return { p: ctr.clone().addScaledVector(dir, hi), t: ctr };
    }
    function fit(objs, o = {}) {
      lastFit = { objs, o: Object.assign({}, o, { dir: o.dir || camera.position.clone().sub(controls.target) }) }; userMoved = false;
      const f = fitPose(objs, lastFit.o); flyTo(f.p, f.t, o.dur === undefined ? 0 : o.dur); return f;
    }
    try { let fr = 0; new ResizeObserver(() => { cancelAnimationFrame(fr); fr = requestAnimationFrame(() => { if (lastFit && !userMoved) { const f = fitPose(lastFit.objs, lastFit.o); flyTo(f.p, f.t, 0); } }); }).observe(host); } catch (e) {}

    return { renderer, scene, camera, controls, sun, overlay, label, flyTo, fit, fitPose, onFrame: (f) => fns.push(f), size: () => ({ W, H }), resize };
  }

  // 관 모양 전선(곡선)
  function tube(points, r, mat, seg = 80) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 10, false), mat); m.castShadow = true; m.curve = curve; return m;
  }

  // 길을 따라 움직이는 알갱이(전자). 전선에는 전자가 이미 꽉 차 있으므로, 멈춰 있어도 알갱이는 보여요.
  // setPath(점 배열), update(dt, 빠르기) — 빠르기가 음수면 반대로 움직여요
  function makeDots(count, color, size = 1) {
    const geo = new THREE.SphereGeometry(0.06 * size, 14, 10);
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, roughness: 0.3 });
    const mesh = new THREE.InstancedMesh(geo, mat, count); mesh.frustumCulled = false;
    let pts = [], cum = [], total = 1, off = 0; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = V(), sc = V(1, 1, 1);
    function setPath(P) {
      pts = P; cum = [0];
      for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + P[i].distanceTo(P[i - 1]));
      total = cum[cum.length - 1] || 1;
    }
    function at(s, out) {
      s = ((s % total) + total) % total;
      let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
      const a = pts[i - 1], b = pts[i], seg = cum[i] - cum[i - 1] || 1, k = (s - cum[i - 1]) / seg;
      out.lerpVectors(a, b, k);
    }
    function update(dt, speed) {
      if (pts.length < 2) { mesh.visible = false; return; }
      off += dt * speed;
      const gap = total / count;
      for (let k = 0; k < count; k++) { at(off + k * gap, p); m4.compose(p, q, sc); mesh.setMatrixAt(k, m4); }
      mesh.instanceMatrix.needsUpdate = true;
    }
    return { mesh, setPath, update, mat };
  }

  // 책상
  function addTable(scene, w, d, y = 0) {
    const tex = woodTex(); tex.repeat.set(w / 10, d / 10);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0 });
    const t = new THREE.Mesh(new RoundedBoxGeometry(w, 0.4, d, 3, 0.12), mat); t.position.y = y - 0.2; t.receiveShadow = true; scene.add(t);
    return t;
  }
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };

  return { REDUCE, V, ease, clamp01, makeStage, canvasTex, gradientBg, blobTex, tube, makeDots, addTable, visibleNow, mesh };
})();
