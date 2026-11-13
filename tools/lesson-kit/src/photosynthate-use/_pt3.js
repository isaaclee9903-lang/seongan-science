/* ===== 감자 식물 3D (PT3) — 광합성산물의 저장과 이용 =====
   땅을 앞쪽에서 잘라 낸 화분 모형처럼, 땅 위의 줄기·겹잎·꽃과 땅속의 줄기·기는줄기·감자·뿌리를 함께 보여 줘요.
   무료로 쓸 수 있는 감자 식물 3D 자료를 찾지 못해 이 수업을 위해 새로 만들었어요(감자의 겹잎·꽃·기는줄기 끝의 덩이 모양을 따름).
   설탕 알갱이의 수·크기·빠르기는 잘 보이게 정한 모형이에요.
   PT3.plant(host, opt) → { st, setNight(v,dur), phloem(on), flow(kind, on), burst(kind), grow(dur), store(dur), cut(on), view(name,dur), labels(list), ... } */
const PT3 = (() => {
  const { V, ease, clamp01, canvasTex, REDUCE } = C3;
  const rnd = (s) => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const UP = V(0, 1, 0);

  /* ---------- 질감 ---------- */
  function leafTex() {
    return canvasTex(512, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#2f6a28'); gr.addColorStop(.55, '#3b7a30'); gr.addColorStop(1, '#326e2a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      const R = rnd(4); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${R() < .5 ? '30,70,25' : '120,170,80'},${.05 + R() * .07})`; g.fillRect(R() * w, R() * h, 2 + R() * 3, 2 + R() * 3); }
      // 잎맥: 가운데 잎맥 + 곁맥(바깥으로 휘어 올라감) + 그물맥
      g.lineCap = 'round';
      for (let k = 0; k < 9; k++) {
        const x0 = 30 + k * 50;
        [-1, 1].forEach((sd) => { g.strokeStyle = 'rgba(150,195,105,.38)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, h / 2); g.quadraticCurveTo(x0 + 34, h / 2 + sd * h * .25, x0 + 70, h / 2 + sd * h * .47); g.stroke(); });
      }
      g.strokeStyle = 'rgba(160,200,115,.18)'; g.lineWidth = 1;
      for (let i = 0; i < 260; i++) { const x = R() * w, y = R() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - .5) * 26, y + (R() - .5) * 26); g.stroke(); }
      g.strokeStyle = 'rgba(175,212,128,.7)'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
    });
  }
  function skinTex() {
    return canvasTex(512, 256, (g, w, h) => {
      g.fillStyle = '#d6a96a'; g.fillRect(0, 0, w, h);
      const R = rnd(11);
      for (let i = 0; i < 70; i++) { const x = R() * w, y = R() * h, r = 10 + R() * 40; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${R() < .5 ? '170,120,70' : '235,200,150'},.35)`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
      for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(110,72,35,${.15 + R() * .3})`; g.beginPath(); g.ellipse(R() * w, R() * h, .6 + R() * 1.6, .5 + R() * .9, R() * 3, 0, 6.3); g.fill(); }
      for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(140,95,50,.25)'; g.lineWidth = 1; g.beginPath(); const x = R() * w, y = R() * h; g.moveTo(x, y); g.bezierCurveTo(x + 20, y + 4, x + 30, y - 6, x + 50, y); g.stroke(); }
    });
  }
  function fleshTex() {
    return canvasTex(512, 512, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, '#fbf1cf'); gr.addColorStop(.7, '#f8ebc0'); gr.addColorStop(.86, '#f1dfaa'); gr.addColorStop(.95, '#f3e2b2'); gr.addColorStop(.985, '#b88a52'); gr.addColorStop(1, '#8a5f33'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      // 관다발 고리(희미하게)
      g.strokeStyle = 'rgba(214,186,118,.6)'; g.lineWidth = 4; g.beginPath(); g.ellipse(w / 2, h / 2, w * .41, h * .41, 0, 0, 6.3); g.stroke();
      const R = rnd(5);
      for (let i = 0; i < 26; i++) { const a = R() * 6.28, r = (.1 + R() * .3) * w; g.strokeStyle = 'rgba(225,200,140,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * r * .3, h / 2 + Math.sin(a) * r * .3); g.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); g.stroke(); }
      // 녹말(하얀 알갱이 무리, 개념 이해를 위한 크기)
      for (let i = 0; i < 1400; i++) { const a = R() * 6.28, r = Math.sqrt(R()) * w * .44; g.fillStyle = `rgba(255,255,252,${.55 + R() * .45})`; g.beginPath(); g.ellipse(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, 2.5 + R() * 3.5, 2 + R() * 2.4, R() * 3, 0, 6.3); g.fill(); g.strokeStyle = 'rgba(196,168,108,.45)'; g.lineWidth = .9; g.stroke(); }
    });
  }
  function soilTex(face) {
    return canvasTex(1024, 512, (g, w, h) => {
      const R = rnd(face ? 31 : 17);
      if (face) {
        const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5b3a22'); gr.addColorStop(.18, '#6e4628'); gr.addColorStop(.6, '#835631'); gr.addColorStop(1, '#94683f'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(${R() < .5 ? '60,35,18' : '160,115,70'},.10)`; g.fillRect(0, R() * h, w, 6 + R() * 20); }
      } else { g.fillStyle = '#6a4427'; g.fillRect(0, 0, w, h); }
      for (let i = 0; i < 5200; i++) { const c = R(); g.fillStyle = c < .4 ? `rgba(45,26,12,${.3 + R() * .4})` : c < .8 ? `rgba(165,118,72,${.25 + R() * .35})` : `rgba(210,180,140,${.3 + R() * .3})`; g.beginPath(); g.ellipse(R() * w, R() * h, .8 + R() * 2.6, .6 + R() * 1.8, R() * 3, 0, 6.3); g.fill(); }
      const peb = face ? 70 : 40;
      for (let i = 0; i < peb; i++) { const x = R() * w, y = (face ? .15 + R() * .85 : R()) * h, rx = 4 + R() * 10, ry = rx * (.55 + R() * .3); const gp = g.createRadialGradient(x - rx * .3, y - ry * .4, 1, x, y, rx); const c = ['#a99a86', '#8f8476', '#b8a68c', '#7c6f62'][i % 4]; gp.addColorStop(0, '#efe7d8'); gp.addColorStop(.4, c); gp.addColorStop(1, '#7a6650'); g.fillStyle = gp; g.beginPath(); g.ellipse(x, y, rx, ry, R() * 3, 0, 6.3); g.fill(); }
    });
  }
  function starTex() {
    return canvasTex(128, 128, (g, w, h) => {
      g.translate(w / 2, h / 2); g.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, r = i % 2 ? 22 : 58; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } g.closePath();
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 58); gr.addColorStop(0, '#fff3a6'); gr.addColorStop(.55, '#ffc62e'); gr.addColorStop(1, '#f08a12'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#c8700a'; g.lineWidth = 3; g.stroke();
    });
  }
  function skyCanvas(night) {
    return (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      const top = night ? [14, 26, 60] : [166, 210, 240], mid = night ? [34, 50, 96] : [220, 238, 250], bot = night ? [58, 70, 112] : [244, 248, 244];
      gr.addColorStop(0, `rgb(${top})`); gr.addColorStop(.55, `rgb(${mid})`); gr.addColorStop(1, `rgb(${bot})`); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    };
  }

  /* ---------- 모양 ---------- */
  // 작은잎: 길이 방향 x(0~1), 너비 방향 z. 가장자리가 살짝 올라가고 끝이 처져요
  function leafletGeo() {
    const N = 16, M = 6, pos = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, wd = Math.pow(Math.sin(Math.PI * Math.pow(t, .75)), .9) * .42 * (1 - .2 * t) + (t < .04 ? .02 : 0);
      for (let j = -M; j <= M; j++) {
        const s = j / M, z = s * wd;
        const y = -0.22 * t * t + 0.12 * s * s * wd + 0.03 * Math.sin(t * 9 + s * 2) * wd;
        pos.push(t, y, z); uv.push(t, (s + 1) / 2);
      }
    }
    const row = 2 * M + 1;
    for (let i = 0; i < N; i++) for (let j = 0; j < row - 1; j++) { const a = i * row + j, b = a + row; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  function flowerGeo() {
    const sh = new THREE.Shape(), n = 5;
    for (let i = 0; i <= n * 8; i++) { const a = i / (n * 8) * Math.PI * 2, k = (i % 8) / 8, r = .09 + .05 * Math.pow(Math.sin(k * Math.PI), .6); const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
    const g = new THREE.ShapeGeometry(sh, 4); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z); p.setY(i, r * r * 2.4); } g.computeVertexNormals(); return g;
  }
  function noise3(x, y, z, s) { return Math.sin(x * 3.1 + s) * Math.sin(y * 2.7 + s * 1.7) * Math.sin(z * 3.3 + s * .7) + .5 * Math.sin(x * 6.3 + y * 5.1 + s) * Math.sin(z * 5.7 - s); }
  function tuberGeo(seed, eyes = 7) {
    const g = new THREE.SphereGeometry(1, 56, 40), p = g.attributes.position, R = rnd(seed);
    const E = []; for (let i = 0; i < eyes; i++) { const a = R() * 6.28, b = Math.acos(R() * 2 - 1); E.push(V(Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a))); }
    const v = V();
    for (let i = 0; i < p.count; i++) {
      v.set(p.getX(i), p.getY(i), p.getZ(i));
      let r = 1 + .035 * noise3(v.x, v.y, v.z, seed) + .012 * noise3(v.x * 2.3, v.y * 2.1, v.z * 2.2, seed + 3);
      E.forEach((e) => { const d = v.distanceTo(e); if (d < .14) r -= .04 * Math.cos(d / .16 * Math.PI / 2) ** 2; });
      p.setXYZ(i, v.x * r, v.y * r, v.z * r);
    }
    g.computeVertexNormals(); return g;
  }
  function tubeR(pts, r0, r1, mat, seg = 40, rs = 10) {
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const geo = new THREE.TubeGeometry(curve, seg, 1, rs, false), p = geo.attributes.position, nrm = geo.attributes.normal;
    // 가늘어지게: 단면 고리마다 반지름을 바꿔요
    const ring = rs + 1;
    for (let i = 0; i <= seg; i++) { const t = i / seg, r = lerp(r0, r1, t), c = curve.getPointAt(t); for (let j = 0; j < ring; j++) { const k = i * ring + j; p.setXYZ(k, c.x + nrm.getX(k) * r, c.y + nrm.getY(k) * r, c.z + nrm.getZ(k) * r); } }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; m.curve = curve; return m;
  }
  const sample = (curve, n, a = 0, b = 1) => { const o = []; for (let i = 0; i <= n; i++) o.push(curve.getPointAt(lerp(a, b, i / n))); return o; };

  /* ---------- 식물 ---------- */
  function plant(host, opt = {}) {
    const st = C3.makeStage(host, { fov: 30, top: '#a6d2f0', bottom: '#f4f8f4', minD: 3.5, maxD: 26, hold: true, fitWidth: true, scroll: !!opt.scroll, exposure: 1.0, sunX: 4, sunZ: 8 });
    const { scene, camera, controls } = st;
    controls.minPolarAngle = .25; controls.maxPolarAngle = 1.75; controls.minAzimuthAngle = -1.05; controls.maxAzimuthAngle = 1.05;
    st.sun.shadow.mapSize.set(2048, 2048); const sc = st.sun.shadow.camera; sc.left = -7; sc.right = 7; sc.top = 8; sc.bottom = -6; sc.updateProjectionMatrix();
    st.sun.color.set('#fff3dc');
    const hemi = scene.children.find((o) => o.isHemisphereLight);
    const sky = canvasTex(4, 256, skyCanvas(false)); scene.background = sky;
    const moonL = new THREE.DirectionalLight(0x9fb6ff, 0); moonL.position.set(-5, 9, 6); scene.add(moonL);
    const fill = new THREE.DirectionalLight(0xffffff, .35); fill.position.set(-3, 2, 9); scene.add(fill);

    const W = 3.5, ZB = -3, YB = -3.1;
    const topY = (x, z) => .52 * Math.exp(-((x / 1.7) ** 2)) * (1 - .25 * Math.min(1, Math.abs(z) / 3)) + .04 * Math.sin(x * 2.1 + z * 1.3) * Math.cos(z * 2.7);
    /* 흙: 위 면·잘린 앞면·옆면 */
    const soilTop = soilTex(false); soilTop.wrapS = soilTop.wrapT = THREE.RepeatWrapping; soilTop.repeat.set(2.4, 1.2);
    const mTop = new THREE.MeshStandardMaterial({ map: soilTop, roughness: .98, color: '#e8dccb' });
    const tg = new THREE.PlaneGeometry(W * 2, -ZB, 80, 30); tg.rotateX(-Math.PI / 2); tg.translate(0, 0, ZB / 2);
    { const p = tg.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, topY(p.getX(i), p.getZ(i))); tg.computeVertexNormals(); }
    const top = new THREE.Mesh(tg, mTop); top.receiveShadow = true; scene.add(top);
    const faceT = soilTex(true), mFace = new THREE.MeshStandardMaterial({ map: faceT, roughness: 1, color: '#f2e6d6' });
    function faceGeo(xf) { // 앞면(z=0) 또는 옆면
      const pos = [], uv = [], idx = [], N = 80, M = 24;
      for (let i = 0; i <= N; i++) { const u = i / N; const x = xf ? xf : lerp(-W, W, u), z = xf ? lerp(0, ZB, u) : 0, yt = topY(x, z); for (let j = 0; j <= M; j++) { const v = j / M; pos.push(x, lerp(YB, yt, v), z); uv.push(xf ? u * .7 : u, v); } }
      for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; xf < 0 ? idx.push(a, a + 1, b, a + 1, b + 1, b) : idx.push(a, b, a + 1, a + 1, b, b + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
    }
    const front = new THREE.Mesh(faceGeo(0), mFace); front.receiveShadow = true; scene.add(front);
    [-W, W].forEach((x) => { const m = new THREE.Mesh(faceGeo(x), mFace); m.material = mFace.clone(); m.material.color.set('#c8b49c'); scene.add(m); });
    const bot = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, -ZB), new THREE.MeshStandardMaterial({ color: '#5a3a22' })); bot.rotation.x = Math.PI / 2; bot.position.set(0, YB, ZB / 2); scene.add(bot);
    const shadowM = new THREE.Mesh(new THREE.PlaneGeometry(W * 2.6, 6), new THREE.MeshBasicMaterial({ map: C3.blobTex(), transparent: true, depthWrite: false, opacity: .7 })); shadowM.rotation.x = -Math.PI / 2; shadowM.position.set(0, YB - .02, -1.4); scene.add(shadowM);
    // 땅 위 작은 흙덩이
    { const R = rnd(8), clod = new THREE.MeshStandardMaterial({ color: '#7a5233', roughness: 1 }); const geo = new THREE.IcosahedronGeometry(1, 1); for (let i = 0; i < 46; i++) { const x = (R() - .5) * W * 1.9, z = ZB * R() * .95 - .05, s = .03 + R() * .07; const m = new THREE.Mesh(geo, clod); m.position.set(x, topY(x, z) + s * .3, z); m.scale.set(s, s * .6, s); m.rotation.set(R() * 3, R() * 3, 0); m.castShadow = true; m.receiveShadow = true; scene.add(m); } }

    /* 재질 */
    const M = {
      stem: new THREE.MeshStandardMaterial({ color: '#4a7f31', roughness: .75 }),
      stemU: new THREE.MeshStandardMaterial({ color: '#e2d6b6', roughness: .8 }),
      stolon: new THREE.MeshStandardMaterial({ color: '#efe4c8', roughness: .75 }),
      root: new THREE.MeshStandardMaterial({ color: '#d7bf93', roughness: .9 }),
      leaf: new THREE.MeshStandardMaterial({ map: leafTex(), roughness: .78, side: THREE.DoubleSide }),
      petiole: new THREE.MeshStandardMaterial({ color: '#5b9440', roughness: .72 }),
      tipP: new THREE.MeshStandardMaterial({ color: '#8cc05a', roughness: .72 }),
      flower: new THREE.MeshStandardMaterial({ color: '#f4eefa', roughness: .8, side: THREE.DoubleSide }),
      anther: new THREE.MeshStandardMaterial({ color: '#f2c21b', roughness: .6 }),
      bud: new THREE.MeshStandardMaterial({ color: '#7aa955', roughness: .7 }),
      skin: new THREE.MeshStandardMaterial({ map: skinTex(), roughness: .86 }),
      flesh: new THREE.MeshStandardMaterial({ map: fleshTex(), roughness: .9 }),
      phl: new THREE.MeshStandardMaterial({ color: '#f6d77a', roughness: .5, emissive: '#7a5a10', emissiveIntensity: .25 }),
    };
    const lfGeo = leafletGeo(), flGeo = flowerGeo();
    const plantG = new THREE.Group(); scene.add(plantG);
    const PZ = -0.06; // 줄기가 잘린 앞면에 거의 붙어 있어요
    const R = rnd(opt.seed || 7);
    const leafMats = []; // 작은잎 놓을 자리
    const rachisMeshes = [], stems = [], leaves = [], flowersAt = [], phl = [];
    const stemTubes = [];

    // 겹잎 하나: 줄기 위 p0에서 방향 dir로. 작은잎 3쌍 + 끝 작은잎 + 사이 작은잎
    function compound(p0, dir, len, sz, group, ownerList) {
      const d = dir.clone().setY(0).normalize(), side = V().crossVectors(UP, d).normalize();
      const pts = [p0.clone(), p0.clone().addScaledVector(d, len * .3).add(V(0, len * .22, 0)), p0.clone().addScaledVector(d, len * .7).add(V(0, len * .2, 0)), p0.clone().addScaledVector(d, len).add(V(0, len * .02, 0))];
      const rach = tubeR(pts, .026 * sz, .012 * sz, M.petiole, 20, 6); group.add(rach); rachisMeshes.push(rach);
      const cv = rach.curve, L = [];
      const put = (t, sd, s, tilt) => {
        const at = cv.getPointAt(t), tan = cv.getTangentAt(t);
        let x = sd === 0 ? tan.clone() : side.clone().multiplyScalar(sd).addScaledVector(tan, .45).add(V(0, .12, 0));
        x.normalize(); const z = V().crossVectors(x, UP).normalize(); const y = V().crossVectors(z, x).normalize();
        const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
        q.multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), tilt * sd));
        L.push({ p: at, q, s: s * sz });
      };
      [.36, .62, .86].forEach((t, i) => { const s = [.36, .44, .48][i]; put(t, 1, s, .25 + R() * .15); put(t, -1, s * (.94 + R() * .1), .25 + R() * .15); });
      [.5, .74].forEach((t) => { put(t, 1, .13, .2); put(t, -1, .13, .2); });
      put(1, 0, .55, 0);
      const pathIn = sample(cv, 10, 1, 0); // 잎 끝에서 줄기 쪽으로
      const lf = { pts: pathIn, leaflets: L, group, mid: cv.getPointAt(.6) };
      (ownerList || leaves).push(lf); return lf;
    }
    function flowerCluster(p, group) {
      const n = 6, base = p.clone();
      for (let i = 0; i < n; i++) {
        const a = i / n * 6.28 + R(), r = .16 + R() * .1, q = base.clone().add(V(Math.cos(a) * r, .14 + R() * .12, Math.sin(a) * r));
        group.add(tubeR([base, base.clone().lerp(q, .5).add(V(0, .05, 0)), q], .01, .008, M.petiole, 8, 5));
        if (i < 4) {
          const f = new THREE.Mesh(flGeo, M.flower); f.position.copy(q); f.lookAt(q.clone().add(V(Math.cos(a) * .5, 1.2, Math.sin(a) * .5 + .4))); f.rotateX(Math.PI / 2); f.scale.setScalar(1.15); f.castShadow = true; group.add(f);
          const an = new THREE.Mesh(new THREE.ConeGeometry(.03, .075, 10), M.anther); an.position.copy(q); an.quaternion.copy(f.quaternion); an.translateY(.04); group.add(an);
        } else { const b = new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 8), M.bud); b.position.copy(q); b.scale.y = 1.4; group.add(b); }
      }
      flowersAt.push(base);
    }
    // 줄기 세 개(땅속에서 갈라져 올라옴)
    const BASE = V(0, -1.35, PZ);
    const STEMS = [
      { lean: V(.08, 0, 0), h: 3.5, n: 10, ph: 0 },
      { lean: V(-.85, 0, -.3), h: 2.9, n: 8, ph: 1.4 },
      { lean: V(.9, 0, -.45), h: 2.8, n: 8, ph: 2.6 },
      { lean: V(-.3, 0, -1.1), h: 2.6, n: 7, ph: 3.3 },
    ];
    STEMS.forEach((S, si) => {
      const u0 = BASE.clone().add(V(si === 0 ? 0 : S.lean.x * .25, .45, S.lean.z * .2));
      const pts = [BASE.clone(), u0, V(u0.x + S.lean.x * .3, .05, PZ + S.lean.z * .3)];
      for (let k = 1; k <= 4; k++) { const t = k / 4; pts.push(V(u0.x + S.lean.x * (.3 + t * .9) + Math.sin(t * 3 + si) * .06, .05 + S.h * t, PZ + S.lean.z * (.3 + t * .9))); }
      const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
      // 땅속 부분(흰빛)과 땅 위 부분(초록)을 나눠 그려요
      const tg0 = curve.getUtoTmapping(0, 0); void tg0;
      let tGround = .3; for (let t = 0; t < 1; t += .005) { if (curve.getPointAt(t).y > topY(curve.getPointAt(t).x, curve.getPointAt(t).z) - .02) { tGround = t; break; } }
      const under = tubeR(sample(curve, 12, 0, tGround + .02), .07, .062, M.stemU, 20, 10), over = tubeR(sample(curve, 30, tGround, 1), .062, .026, M.stem, 50, 10);
      plantG.add(under, over); stemTubes.push(under, over);
      const stem = { curve, tGround, leaves: [], si };
      for (let k = 0; k < S.n; k++) {
        const t = lerp(tGround + .05, .92, k / (S.n - 1)), p = curve.getPointAt(t);
        const a = S.ph + k * 2.4, d = V(Math.cos(a), 0, Math.sin(a) * .8 + .25);
        const sz = lerp(1.12, .66, k / S.n) * (si ? .92 : 1);
        const lf = compound(p, d, lerp(1.2, .78, k / S.n) * (si ? .92 : 1), sz, plantG, stem.leaves); lf.stem = stem; lf.t = t; leaves.push(lf);
      }
      flowerCluster(curve.getPointAt(1), plantG);
      stems.push(stem);
    });

    // 새순(생장): 큰 줄기 끝 옆에서 돋아나는 어린 겹잎
    const tipG = new THREE.Group(); plantG.add(tipG);
    const tipAt = stems[0].curve.getPointAt(.74);
    const tipLeaf = compound(V(0, .5, 0), V(.3, 0, 1), .8, .72, tipG, []);
    tipG.add(tubeR([V(0, 0, 0), V(0, .25, 0), V(-.05, .55, .05)], .028, .014, M.stem, 10, 8)); tipG.children.forEach((c) => { if (c.isMesh && c.material === M.petiole) c.material = M.tipP; }); void tipLeaf;
    tipG.position.copy(tipAt); tipG.rotation.set(0, -.3, -.75); tipG.scale.setScalar(.001);

    // 작은잎(한꺼번에)
    const allLeaflets = []; leaves.forEach((lf) => lf.leaflets.forEach((x) => allLeaflets.push(x)));
    const tipLeaflets = tipLeaf.leaflets;
    const inst = new THREE.InstancedMesh(lfGeo, M.leaf, allLeaflets.length); inst.castShadow = true; inst.receiveShadow = true;
    const m4 = new THREE.Matrix4(), sv = V(), col = new THREE.Color();
    allLeaflets.forEach((x, i) => { sv.setScalar(x.s); m4.compose(x.p, x.q, sv); inst.setMatrixAt(i, m4); col.setHSL(.27 + (R() - .5) * .04, .25, .82 + (R() - .5) * .14); inst.setColorAt(i, col); });
    plantG.add(inst);
    const inst2 = new THREE.InstancedMesh(lfGeo, M.leaf, tipLeaflets.length); inst2.castShadow = true;
    tipLeaflets.forEach((x, i) => { sv.setScalar(x.s); m4.compose(x.p, x.q, sv); inst2.setMatrixAt(i, m4); });
    inst2.material = M.leaf.clone(); inst2.material.color.set('#b8e08a'); tipG.add(inst2);

    /* 땅속: 기는줄기 끝의 감자 */
    const TUB = [
      { from: .1, to: V(-1.85, -1.5, .05), r: [.5, .36, .4], seed: 3, rot: [.2, .6, -.3] },
      { from: .2, to: V(-1.0, -2.15, .1), r: [.42, .32, .34], seed: 9, rot: [-.3, 1.2, .2] },
      { from: .12, to: V(1.5, -1.75, .08), r: [.55, .4, .42], seed: 5, rot: [.1, -.4, .25] },
      { from: .24, to: V(.95, -.82, .05), r: [.33, .25, .27], seed: 13, rot: [.4, .3, .5] },
      { from: .05, to: V(2.25, -1.1, .02), r: [.3, .23, .24], seed: 21, rot: [.6, 1.3, -.2] },
    ];
    const tubers = [], stolons = [];
    const sU = stems[0].curve;
    TUB.forEach((T, i) => {
      const a = sU.getPointAt(T.from), e = T.to;
      const mid = a.clone().lerp(e, .5).add(V(0, .18 * (e.y > a.y ? 1 : -.4), .05));
      const sCurve = tubeR([a, a.clone().lerp(mid, .5).add(V(0, .05, 0)), mid, e], .035, .028, M.stolon, 28, 7);
      plantG.add(sCurve);
      const g = new THREE.Mesh(tuberGeo(T.seed), M.skin); g.position.copy(e).add(V(Math.sign(e.x) * T.r[0] * .8, 0, 0)); g.rotation.set(...T.rot); g.castShadow = true;
      const s0 = V(...T.r); g.scale.copy(s0).multiplyScalar(.6); plantG.add(g);
      tubers.push({ m: g, s0, k: .6, end: e, center: g.position.clone() });
      stolons.push({ pts: sample(sCurve.curve, 12), stemT: T.from });
    });
    // 뿌리: 땅속 줄기 마디에서 나오는 수염뿌리
    const roots = [];
    { const rr = rnd(44);
      for (let i = 0; i < 26; i++) {
        const a = sU.getPointAt(.02 + rr() * .2), ang = (rr() - .5) * 2.6, L = 1 + rr() * 1.4;
        const pts = [a]; let p = a.clone(), d = V(Math.sin(ang), -.8 - rr() * .4, (rr() - .5) * .3).normalize();
        for (let k = 0; k < 6; k++) { d.add(V((rr() - .5) * .35, -.12, (rr() - .5) * .1)).normalize(); p = p.clone().addScaledVector(d, L / 6); if (p.y < YB + .25) p.y = YB + .25; p.z = Math.max(-.5, Math.min(.12, p.z)); pts.push(p); }
        const m = tubeR(pts, .016, .004, M.root, 30, 6); plantG.add(m); roots.push({ pts: sample(m.curve, 10), stemT: .05 });
        for (let b = 0; b < 3; b++) { const t = .25 + b * .2, q = m.curve.getPointAt(t), bd = V((rr() - .5) * 1.4, -.5, 0).normalize(); const q2 = q.clone().addScaledVector(bd, .35 + rr() * .3); plantG.add(tubeR([q, q.clone().lerp(q2, .5).add(V(0, -.05, 0)), q2], .009, .004, M.root, 8, 4)); }
      }
    }

    /* 체관(줄기 속 노란 길): 처음엔 숨겨요 */
    const phlG = new THREE.Group(); phlG.visible = false; scene.add(phlG);
    stems.forEach((S) => phlG.add(tubeR(sample(S.curve, 40), .024, .016, M.phl, 60, 6)));
    leaves.forEach((lf) => phlG.add(tubeR(lf.pts, .012, .016, M.phl, 16, 5)));
    stolons.forEach((s) => phlG.add(tubeR(s.pts, .014, .014, M.phl, 20, 5)));
    roots.slice(0, 16).forEach((r) => phlG.add(tubeR(r.pts, .009, .004, M.phl, 16, 4)));
    phlG.traverse((o) => { o.castShadow = false; });

    /* 길: 줄기의 t 구간을 점들로 */
    const stemSeg = (S, t0, t1) => sample(S.curve, Math.max(2, Math.ceil(Math.abs(t1 - t0) * 40)), t0, t1);
    const routes = { tuber: [], root: [], tip: [] };
    leaves.forEach((lf) => {
      const S = lf.stem;
      // 잎 → 줄기 → 아래로 → (큰 줄기 땅속 부분으로 합쳐짐) → 기는줄기 → 감자
      const down = stemSeg(S, lf.t, 0);
      tubers.forEach((T, i) => { const so = stolons[i]; const d0 = S.si === 0 ? stemSeg(S, lf.t, so.stemT) : down.concat(stemSeg(stems[0], 0, so.stemT)); routes.tuber.push(lf.pts.concat(d0, so.pts, [T.center])); });
      roots.forEach((r) => routes.root.push(lf.pts.concat(S.si === 0 ? stemSeg(S, lf.t, .04) : down, r.pts)));
      routes.tip.push(lf.pts.concat(stemSeg(S, lf.t, 1)));
    });

    /* 설탕 알갱이: 육각 기둥 두 개 */
    const sugGeo = (() => { const a = new THREE.CylinderGeometry(.042, .042, .03, 6); a.rotateX(Math.PI / 2); a.translate(-.038, 0, 0); const b = a.clone(); b.translate(.076, 0, 0); const g = new THREE.BufferGeometry(); const pa = [...a.toNonIndexed().attributes.position.array, ...b.toNonIndexed().attributes.position.array]; g.setAttribute('position', new THREE.Float32BufferAttribute(pa, 3)); g.computeVertexNormals(); return g; })();
    const MAXP = 360;
    const sugM = new THREE.MeshStandardMaterial({ color: '#fff1c4', emissive: '#d9a531', emissiveIntensity: .45, roughness: .55, depthTest: false, transparent: true });
    const sug = new THREE.InstancedMesh(sugGeo, sugM, MAXP); sug.frustumCulled = false; sug.renderOrder = 10; scene.add(sug);
    const parts = [];
    const flowOn = { tuber: false, root: false, tip: false };
    let spawnT = 0, flowRate = 1;
    function spawn(kind) {
      const L = routes[kind]; if (!L.length || parts.length >= MAXP) return;
      const pts = L[Math.floor(Math.random() * L.length)], cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
      parts.push({ pts, cum, s: 0, v: 1.05 + Math.random() * .3, kind, rot: Math.random() * 6, life: 0 });
    }
    const q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), pp = V();
    const arrive = { tuber: [], root: [], tip: [] }; // 도착 알림
    function stepParts(dt) {
      ['tuber', 'root', 'tip'].forEach((k) => { if (!flowOn[k]) return; spawnT += dt; });
      if (flowOn.tuber || flowOn.root || flowOn.tip) {
        const kinds = Object.keys(flowOn).filter((k) => flowOn[k]);
        const every = .1 / flowRate;
        while (spawnT > every) { spawnT -= every; spawn(kinds[Math.floor(Math.random() * kinds.length)]); }
      }
      let n = 0;
      for (let i = parts.length - 1; i >= 0; i--) {
        const P = parts[i]; P.s += P.v * dt; P.life += dt;
        const tot = P.cum[P.cum.length - 1];
        if (P.s >= tot) { arrive[P.kind].forEach((f) => f(P.pts[P.pts.length - 1])); parts.splice(i, 1); continue; }
      }
      parts.forEach((P) => {
        let j = 1; while (j < P.cum.length - 1 && P.cum[j] < P.s) j++;
        const a = P.pts[j - 1], b = P.pts[j], k = (P.s - P.cum[j - 1]) / ((P.cum[j] - P.cum[j - 1]) || 1);
        pp.lerpVectors(a, b, k);
        const tot = P.cum[P.cum.length - 1], sc = Math.min(1, P.s / .25, (tot - P.s) / .25 + .3);
        e3.set(.3, P.rot + P.s * 2, 0); q4.setFromEuler(e3); m4.compose(pp, q4, sv.setScalar(Math.max(.05, sc)));
        sug.setMatrixAt(n++, m4);
      });
      sug.count = n; sug.instanceMatrix.needsUpdate = true;
    }

    /* 에너지 별(호흡) */
    const starT = starTex(), stars = [];
    function star(at, s = .2) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: starT, transparent: true, depthTest: false })); sp.renderOrder = 12; sp.position.copy(at); scene.add(sp); stars.push({ sp, t: 0, s, y0: at.y }); }
    let respOn = false, respCool = 0;
    arrive.root.push((p) => { if (respOn && respCool <= 0) { star(p.clone().add(V(0, .05, .25))); respCool = .32; } });

    /* 저장: 감자가 커져요 */
    let storeOn = false;
    arrive.tuber.push(() => { if (storeOn) tubers.forEach((T) => { T.k = Math.min(1, T.k + .0035); }); });

    /* 잘라 본 감자: 가장 큰 감자 하나를 반으로 */
    const cutT = tubers[2];
    const cutG = new THREE.Group(); cutG.visible = false; scene.add(cutG);
    { const hg = new THREE.SphereGeometry(1, 48, 32, Math.PI, Math.PI); const half = new THREE.Mesh(hg, M.skin); half.castShadow = true; cutG.add(half);
      const cap = new THREE.Mesh(new THREE.CircleGeometry(1, 64), M.flesh); cutG.add(cap); }

    /* 낮과 밤 */
    const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(.42, 32, 16), new THREE.MeshBasicMaterial({ color: '#ffd24a' }));
    const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(.3, 32, 16), new THREE.MeshStandardMaterial({ color: '#f3ecd0', emissive: '#c9c2a4', emissiveIntensity: .7, roughness: 1 }));
    scene.add(sunMesh, moonMesh);
    const starPts = (() => { const g = new THREE.BufferGeometry(), a = [], rr = rnd(3); for (let i = 0; i < 220; i++) a.push((rr() - .5) * 60, 4 + rr() * 22, -14 - rr() * 10); g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); return new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: .09, transparent: true, opacity: 0, depthWrite: false })); })();
    scene.add(starPts);
    let night = 0, nightTo = 0, nightDur = 1;
    const dayC = canvasTex(4, 256, skyCanvas(false)).userData.canvas, nightC = canvasTex(4, 256, skyCanvas(true)).userData.canvas;
    function applyNight(v) {
      const g = sky.userData.canvas.getContext('2d'); g.globalAlpha = 1; g.drawImage(dayC, 0, 0); g.globalAlpha = v; g.drawImage(nightC, 0, 0); g.globalAlpha = 1; sky.needsUpdate = true;
      st.sun.intensity = lerp(1.7, .0, v); moonL.intensity = lerp(0, .75, v); hemi.intensity = lerp(.6, .3, v); hemi.color.set(v > .5 ? '#9fb2e0' : '#ffffff'); fill.intensity = lerp(.35, .1, v); fill.color.set(v > .5 ? '#a9b8e6' : '#ffffff');
      st.renderer.toneMappingExposure = lerp(1.0, 1.1, v);
      scene.environmentIntensity = lerp(1, .3, v); scene.traverse((o) => { if (o.material && o.material.envMapIntensity !== undefined && !o.material.userData.keepEnv) o.material.envMapIntensity = lerp(1, .3, v); });
      const ang = lerp(.35, -.5, v); sunMesh.position.set(5.4 + v * 2, 5 + Math.sin(ang * 2.4) * 2.2 - v * 6, -6); sunMesh.visible = v < .95;
      moonMesh.position.set(-5.2, lerp(-2, 5.8, v), -6); moonMesh.visible = v > .05;
      starPts.material.opacity = v * .85;
      st.sun.position.set(lerp(5, 9, v), lerp(11, 2, v), 7);
    }
    applyNight(0);

    /* 이름표 */
    const LB = {};
    const lab = (k, html, at, cls = '') => { LB[k] = st.label(html, cls, at); LB[k].show = false; return LB[k]; };
    lab('leaf', '잎', () => leaves[13].leaflets[6].p); lab('stem', '줄기', () => stems[0].curve.getPointAt(.55).clone().add(V(.15, 0, 0)));
    lab('tuber', '감자', () => tubers[2].m.position.clone().add(V(0, -.5 * tubers[2].m.scale.y / .4 - .1, .3))); lab('root', '뿌리', roots[3].pts[8]);
    lab('stolon', '기는줄기', () => stolons[0].pts[6].clone().add(V(0, .2, .1)), 'small');
    lab('flower', '꽃', flowersAt[0].clone().add(V(0, .45, 0)), 'small');
    lab('phl', '체관', () => stems[0].curve.getPointAt(.4).clone().add(V(-.35, 0, .1)));
    lab('tip', '새순', () => tipAt.clone().add(V(.8, .9, .3)));
    lab('energy', '에너지', () => roots[2].pts[10].clone().add(V(.2, .2, .3)));
    lab('starch', '녹말로 저장', () => cutT.m.position.clone().add(V(0, cutT.m.scale.y + .22, .3)));
    const showLabs = (ks) => Object.keys(LB).forEach((k) => { LB[k].show = ks.includes(k); });

    /* 시점 */
    const VIEWS = {
      all: { p: V(1.6, 1.9, 14.5), t: V(0, .7, -.3) },
      leaf: { p: V(3.0, 3.7, 6.6), t: V(.2, 2.0, -.3) },
      under: { p: V(.3, -.8, 7.4), t: V(0, -1.45, 0) },
      root: { p: V(-.4, -1.4, 4.4), t: V(-.1, -2.0, 0) },
      tuber: () => { const c = tubers[2].m.position; return { p: c.clone().add(V(-.9, 1.2, 5.0)), t: c.clone().add(V(-.6, .15, 0)) }; },
      top: () => { const c = tipAt.clone(); return { p: c.clone().add(V(1.6, .9, 4.2)), t: c.clone().add(V(.4, .3, 0)) }; },
    };
    let curView = 'all';
    function view(k, dur = 1.1) {
      curView = k; const v = typeof VIEWS[k] === 'function' ? VIEWS[k]() : VIEWS[k]; const { W: w, H: h } = st.size();
      if (k === 'all') { const f = st.fitPose([plantG, front], { dir: v.p.clone().sub(v.t), margin: 1.03 }); st.flyTo(f.p, f.t, REDUCE ? 0 : dur); return; }
      let p = v.p.clone();
      if (w / h < 1.05) p = v.t.clone().add(p.clone().sub(v.t).multiplyScalar(1.35)); // 세로 화면에서는 조금 물러나요
      st.flyTo(p, v.t, REDUCE ? 0 : dur);
    }

    /* 매 장면 */
    let tGrow = -1, growK = 0, cutOn = false, phlOn = false;
    st.onFrame((dt, time) => {
      if (night !== nightTo) { const s = Math.sign(nightTo - night); night += s * dt / nightDur; if ((s > 0 && night > nightTo) || (s < 0 && night < nightTo)) night = nightTo; applyNight(smooth(night)); }
      stepParts(dt);
      respCool -= dt;
      for (let i = stars.length - 1; i >= 0; i--) { const s = stars[i]; s.t += dt / 1.1; if (s.t >= 1) { scene.remove(s.sp); s.sp.material.dispose(); stars.splice(i, 1); continue; } const k = Math.sin(s.t * Math.PI); s.sp.scale.setScalar(s.s * (.4 + k * .8)); s.sp.material.opacity = k; s.sp.position.y = s.y0 + s.t * .35; }
      tubers.forEach((T) => { const cur = T.m.scale.x / T.s0.x; const nk = cur + (T.k - cur) * Math.min(1, dt * 3); T.m.scale.copy(T.s0).multiplyScalar(nk); });
      if (cutOn) { cutG.position.copy(cutT.m.position); cutG.rotation.set(-.2, -.85, .1); cutG.scale.copy(cutT.m.scale); cutG.children[1].scale.set(.985, .985, 1); }
      if (tGrow >= 0) { growK = Math.min(1, growK + dt / tGrow); tipG.scale.setScalar(Math.max(.001, ease(growK))); if (growK >= 1) tGrow = -1; }
      // 잎이 바람에 살짝
      plantG.rotation.z = REDUCE ? 0 : Math.sin(time * .7) * .006;
    });

    const fit = () => view(curView, 0);
    try { new ResizeObserver(() => { if (!api._moved) fit(); }).observe(host); } catch (e) {}
    controls.addEventListener('start', () => { api._moved = true; });
    view('all', 0);
    showLabs(opt.labels || ['leaf', 'stem', 'tuber', 'root', 'stolon']);

    const api = {
      st, _moved: false,
      get night() { return nightTo; },
      setNight(v, dur = 1.6) { nightTo = v; nightDur = REDUCE || dur <= 0 ? 1e-3 : dur; if (dur <= 0) { night = v; applyNight(v); } },
      phloem(on) { phlOn = on; phlG.visible = on; const op = on ? .38 : 1; [M.stem, M.stemU, M.stolon, M.root, M.petiole].forEach((m) => { m.transparent = on; m.opacity = op; m.depthWrite = !on; m.needsUpdate = true; }); },
      flow(kind, on, rate) { if (kind === 'all') { ['tuber', 'root', 'tip'].forEach((k) => { flowOn[k] = on; }); } else flowOn[kind] = on; if (rate) flowRate = rate; },
      flowing: () => parts.length,
      respire(on) { respOn = on; },
      store(on) { storeOn = on; },
      setTuber(k) { tubers.forEach((T) => { T.k = k; T.m.scale.copy(T.s0).multiplyScalar(k); }); },
      tuberK: () => tubers[0].k,
      grow(dur = 2.4) { growK = 0; tGrow = REDUCE ? .001 : dur; },
      setGrow(v) { tGrow = -1; growK = v; tipG.scale.setScalar(Math.max(.001, v)); },
      cut(on) { cutOn = on; cutG.visible = on; cutT.m.visible = !on; },
      view, showLabs, labels: LB,
      reset() { parts.length = 0; Object.keys(flowOn).forEach((k) => { flowOn[k] = false; }); respOn = storeOn = false; api.setTuber(.6); api.setGrow(0); api.cut(false); api.phloem(false); api.setNight(0, 0); },
    };
    C3.prepare(st);
    return api;
  }
  return { plant };
})();
