/* ===== 지구 환경 물질 3D (ES3) — 2026-11-16 전면 수정 =====
   원소 수업 EL3(같은 폴더에 복사한 _el3.js)의 입자 색·크기·PubChem 좌표를 그대로 쓰고, 이 수업 물질 셋을 더해요.
     오존 O3: PubChem CID 24823 (결합 길이 1.278 Å, 결합각 116.8°)
     아산화 질소 N2O: PubChem CID 948 (N–N 1.128 Å, N–O 1.184 Å, 곧은 모양)
     수은 Hg: 원자가 모여 이루어진 액체 금속(원자 하나씩 그림)
   ES3.world(host, o)  땅을 잘라 낸 지구 환경 모형: 높은 하늘(오존층)·도시·논밭·숲·강·바다
                       .go(place) 그곳으로 날아가 그곳의 일(자외선 흡수·매연·비료·광합성·폐수)을 움직여 보여 줘요
                       .setCO2(0|1) 이산화 탄소 양(알맞음·지나치게 많음)
   ES3.lens(host, o)   둥근 돋보기 속 입자 모형: .show(kind) — 'O3','N2O','CO2','Hg','O2', 'one:O3' 같은 분자 하나
   ES3.still(host, k)  읽기 페이지 사진용 장면(_bake.py)
   높이·크기·개수·빠르기는 개념 이해를 위해 정한 모형이에요(실제 높이와 양이 아니에요). */
const ES3 = (() => {
  'use strict';
  const { V, makeStage, prepare, canvasTex, REDUCE } = C3;
  const TS = () => (window.__TS || 1); // 검사용 느린 화면(연속 촬영)
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rng = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

  /* ---------- 물질 자료 ---------- */
  EL3.PT.Hg = { c: '#aeb6bf', r: 0.95, n: '수은' };
  const a = 58.4 * Math.PI / 180;
  EL3.MOL.O3 = [['O', 0, 0.42, 0], ['O', -1.278 * Math.sin(a), 0.42 - 1.278 * Math.cos(a), 0], ['O', 1.278 * Math.sin(a), 0.42 - 1.278 * Math.cos(a), 0]];
  EL3.MOL.N2O = [['N', -1.128, 0, 0], ['N', 0, 0, 0], ['O', 1.184, 0, 0]];
  EL3.MOL.Hg = [['Hg', 0, 0, 0]];
  const NAME = { O3: '오존', N2O: '아산화 질소', CO2: '이산화 탄소', Hg: '수은', O2: '산소' };
  const FORM = { O3: 'O<sub>3</sub>', N2O: 'N<sub>2</sub>O', CO2: 'CO<sub>2</sub>', Hg: 'Hg', O2: 'O<sub>2</sub>' };

  const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.86, metalness: 0 }, o));
  const mesh = (geo, mat, x = 0, y = 0, z = 0, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; return m; };

  /* ---------- 질감 ---------- */
  function soilTex(sea) {
    return canvasTex(512, 128, (g, w, h) => {
      const r = rng(sea ? 9 : 4);
      if (sea) { g.fillStyle = '#d9c49a'; g.fillRect(0, 0, w, h); }
      const L = sea ? [[0, '#cdb486'], [.35, '#b89a6b'], [.7, '#8f8a82'], [1, '#7c7871']] : [[0, '#5d4029'], [.16, '#6e4c31'], [.34, '#8a6442'], [.62, '#9b8a73'], [1, '#858079']];
      for (let i = 0; i < L.length - 1; i++) {
        const y0 = L[i][0] * h, y1 = L[i + 1][0] * h;
        g.fillStyle = L[i][1]; g.beginPath(); g.moveTo(0, y0);
        for (let x = 0; x <= w; x += 32) g.lineTo(x, y0 + (i ? Math.sin(x * .03 + i) * 3 : 0));
        g.lineTo(w, h); g.lineTo(0, h); g.fill();
      }
      for (let i = 0; i < 420; i++) { // 자갈과 알갱이
        const y = h * (.2 + r() * .8), x = r() * w, s = .6 + r() * (y > h * .6 ? 3.2 : 1.6);
        g.fillStyle = `rgba(${y > h * .6 ? '70,66,62' : '60,40,24'},${.12 + r() * .2})`; g.beginPath(); g.ellipse(x, y, s * 1.3, s, r() * 3, 0, 7); g.fill();
      }
      if (!sea) { g.strokeStyle = 'rgba(255,240,220,.18)'; g.lineWidth = 1.4; for (let i = 0; i < 26; i++) { const x = r() * w; g.beginPath(); g.moveTo(x, h * .64); g.lineTo(x + (r() - .5) * 14, h * .64 + 8 + r() * 30); g.stroke(); } }
    });
  }
  function grassTex() {
    const t = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#8fb865'; g.fillRect(0, 0, w, h); const r = rng(12);
      for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${r() < .5 ? '70,110,40' : '170,200,110'},${.08 + r() * .14})`; g.fillRect(r() * w, r() * h, 2 + r() * 4, 2 + r() * 3); }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); return t;
  }
  function fieldTex(kind) {
    return canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = kind ? '#9c7b52' : '#8a6a45'; g.fillRect(0, 0, w, h); const r = rng(kind ? 31 : 17);
      for (let i = 0; i < 16; i++) {
        const x = (i + .5) * w / 16;
        g.fillStyle = 'rgba(80,58,36,.45)'; g.fillRect(x - 3, 0, 6, h);
        for (let y = 4; y < h; y += 9) { g.fillStyle = kind ? `rgba(${120 + r() * 30},${170 + r() * 30},70,.95)` : `rgba(${150 + r() * 30},${178 + r() * 20},${60 + r() * 20},.95)`; g.beginPath(); g.ellipse(x + (r() - .5) * 2, y, 4.2, 3.6, 0, 0, 7); g.fill(); }
      }
    });
  }
  function windowTex(base, win, rows, cols) {
    return canvasTex(128, 256, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      const pw = w / cols, ph = h / rows;
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { g.fillStyle = win; g.fillRect(j * pw + pw * .22, i * ph + ph * .25, pw * .56, ph * .5); }
      g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(0, 0, w * .08, h);
    });
  }

  /* ---------- 작은 입자 모형(장면 속) ---------- */
  const tinyMats = {}, tinyGeo = new THREE.SphereGeometry(1, 14, 10);
  function tiny(id, k = 0.13) {
    const g = new THREE.Group(), A = EL3.MOL[id], c = V();
    A.forEach(([, x, y, z]) => c.add(V(x, y, z))); c.multiplyScalar(1 / A.length);
    A.forEach(([e, x, y, z]) => {
      const m = tinyMats[e] || (tinyMats[e] = new THREE.MeshStandardMaterial({ color: EL3.PT[e].c, roughness: 0.55 }));
      const s = new THREE.Mesh(tinyGeo, m); s.position.set((x - c.x) * k, (y - c.y) * k, (z - c.z) * k); s.scale.setScalar(EL3.PT[e].r * k); g.add(s);
    });
    return g;
  }

  /* ================= 지구 환경 모형 ================= */
  // 땅 x -9~4.5, 바다 x 4.5~9, 앞뒤 z -4.5~4.5, 땅 위 y=0
  const RIVER = [V(1.35, 0, -4.5), V(1.7, 0, -3.2), V(2.15, 0, -2.0), V(2.95, 0, -0.9), V(3.55, 0, 0.3), V(4.1, 0, 1.0), V(4.62, 0, 1.25)];
  const PLACES = {
    sky: { n: '높은 하늘', at: V(-3.2, 5.75, -1.2), box: [V(-9, 2.6, -5), V(9, 7.6, 2.5)], dir: V(0.12, 0.05, 1) },
    city: { n: '도시', at: V(-6.9, 3.15, -0.6), box: [V(-9, 0, -4.5), V(-3.6, 2.8, 3.2)], dir: V(0.32, 0.5, 1) },
    farm: { n: '논밭', at: V(-2.4, 1.55, -1.3), box: [V(-4.5, 0, -4.4), V(-0.4, 1.6, 2.2)], dir: V(0.05, 0.85, 1) },
    forest: { n: '숲', at: V(3.0, 2.2, 3.0), box: [V(0.2, 0, -1), V(4.6, 2.2, 4.5)], dir: V(0.2, 0.45, 1) },
    river: { n: '강', at: V(1.55, 0.75, -3.9), box: [V(-0.6, 0, -4.5), V(4.9, .8, 1.5)], dir: V(-0.1, 1.7, 1) },
  };
  const ORDER = ['sky', 'city', 'farm', 'forest', 'river'];

  function world(host, o = {}) {
    const st = makeStage(host, { top: '#bcdcf3', bottom: '#f3f8fc', fov: 30, hold: !o.still, fitWidth: true, minD: 4, maxD: 60, exposure: 1.02, sunX: -7, sunZ: 9 });
    const sc = st.sun.shadow.camera; sc.left = -14; sc.right = 14; sc.top = 12; sc.bottom = -12; sc.far = 60; sc.updateProjectionMatrix();
    st.sun.position.set(-9, 16, 11); st.sun.shadow.mapSize.set(2048, 2048);
    const S = st.scene, all = new THREE.Group(); S.add(all);
    const R = rng(5);

    /* 땅과 바다 */
    const soil = soilTex(false), seaSoil = soilTex(true), grassM = M('#ffffff', { map: grassTex() });
    const soilM = M('#ffffff', { map: soil }), seaSoilM = M('#ffffff', { map: seaSoil });
    const land = mesh(new THREE.BoxGeometry(13.5, 1.8, 9), [soilM, soilM, grassM, soilM, soilM, soilM], -2.25, -0.9, 0);
    all.add(land);
    const bed = mesh(new THREE.BoxGeometry(4.5, 0.9, 9), [seaSoilM, seaSoilM, M('#d6c193'), seaSoilM, seaSoilM, seaSoilM], 6.75, -1.35, 0); all.add(bed);
    const water = mesh(new THREE.BoxGeometry(4.5, 0.82, 9), M('#3f86bf', { roughness: 0.35, transparent: true, opacity: 0.86 }), 6.75, -0.5, 0, false); all.add(water);
    const beach = mesh(new THREE.BoxGeometry(0.7, 0.04, 9), M('#dcc796'), 4.15, 0.02, 0, false); all.add(beach);
    // 물결 무늬(정지)
    const wv = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#ffffff00'; g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; const r = rng(3); for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.arc(x, y, 6 + r() * 10, 3.6, 5.8); g.stroke(); } });
    const wTop = mesh(new THREE.PlaneGeometry(4.5, 9), new THREE.MeshBasicMaterial({ map: wv, transparent: true, depthWrite: false }), 6.75, -0.085, 0, false); wTop.rotation.x = -Math.PI / 2; all.add(wTop);

    /* 강: 땅 위 띠 */
    const curve = new THREE.CatmullRomCurve3(RIVER), N = 80;
    function ribbon(w, y, mat) {
      const pos = [], idx = [];
      for (let i = 0; i <= N; i++) {
        const p = curve.getPoint(i / N), t = curve.getTangent(i / N), n = V(-t.z, 0, t.x).normalize();
        const ww = w * (0.85 + 0.3 * i / N);
        pos.push(p.x + n.x * ww, y, p.z + n.z * ww, p.x - n.x * ww, y, p.z - n.z * ww);
        if (i < N) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m;
    }
    all.add(ribbon(0.58, 0.012, M('#b9a77e', { side: THREE.DoubleSide })));
    const riverM = M('#3f8fd0', { roughness: 0.35, side: THREE.DoubleSide });
    const riverMesh = ribbon(0.44, 0.024, riverM); all.add(riverMesh);
    const nearRiver = (x, z, d) => { for (let i = 0; i <= 40; i++) { const p = curve.getPoint(i / 40); if (Math.hypot(p.x - x, p.z - z) < d) return true; } return false; };

    /* 도시: 건물 */
    const city = new THREE.Group(); all.add(city);
    const BLD = [['#d9d3c7', '#8fa6b8'], ['#c7cdd3', '#7f97ab'], ['#e3dccd', '#93a8b5'], ['#b9c2c9', '#6d879b'], ['#d4c7b3', '#8aa0b0']];
    const bt = BLD.map(([b, w]) => [windowTex(b, w, 8, 4), b]);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const x = -8.3 + i * 1.08 + (R() - .5) * .12, z = -3.7 + j * 1.35 + (R() - .5) * .12;
      const hgt = 0.7 + R() * (j < 2 ? 2.2 : 1.3), w = 0.66 + R() * 0.22, d = 0.7 + R() * 0.25;
      const k = Math.floor(R() * bt.length), tex = bt[k][0].clone(); tex.needsUpdate = true; tex.repeat.set(1, Math.max(1, Math.round(hgt * 1.3)) / 3); tex.wrapT = THREE.RepeatWrapping;
      const side = M('#ffffff', { map: tex }), roof = M(new THREE.Color(bt[k][1]).offsetHSL(0, 0, .06));
      const b = mesh(new THREE.BoxGeometry(w, hgt, d), [side, side, roof, roof, side, side], x, hgt / 2, z); city.add(b);
      if (R() < .35) city.add(mesh(new THREE.BoxGeometry(w * .35, .14, d * .35), M('#9aa4ad'), x + w * .15, hgt + .07, z - d * .1));
    }
    // 도로와 차
    const road = mesh(new THREE.BoxGeometry(10.2, .03, .82), M('#5b6168', { roughness: .9 }), -3.9, .016, 2.65, false); all.add(road);
    for (let i = 0; i < 16; i++) all.add(mesh(new THREE.BoxGeometry(.26, .006, .04), M('#f1efe6'), -8.6 + i * .64, .034, 2.65, false));
    const cars = [], CAR = ['#c8463c', '#f2f2ee', '#3c6fae', '#e2b13c', '#5b6a78'];
    const RB = (typeof RoundedBoxGeometry !== 'undefined') ? RoundedBoxGeometry : null;
    for (let i = 0; i < 6; i++) {
      const c = new THREE.Group(), col = CAR[i % CAR.length];
      const body = mesh(RB ? new RB(.46, .14, .24, 2, .04) : new THREE.BoxGeometry(.46, .14, .24), M(col, { roughness: .5 }), 0, .1, 0); c.add(body);
      const cab = mesh(RB ? new RB(.25, .11, .21, 2, .035) : new THREE.BoxGeometry(.25, .11, .21), M('#2c3a48', { roughness: .4 }), -.02, .21, 0); c.add(cab);
      [[-.14, .12], [.14, .12], [-.14, -.12], [.14, -.12]].forEach(([x, z]) => { const wh = mesh(new THREE.CylinderGeometry(.05, .05, .04, 12), M('#22272c'), x, .05, z); wh.rotation.x = Math.PI / 2; c.add(wh); });
      const dir = i % 2 ? -1 : 1; c.position.set(-8.5 + i * 1.55, 0, 2.65 + (dir > 0 ? .19 : -.19)); c.rotation.y = dir > 0 ? 0 : Math.PI; c.userData.dir = dir;
      all.add(c); cars.push(c);
    }

    /* 공장(강 상류 옆) */
    const fac = new THREE.Group(); fac.position.set(0.25, 0, -3.15); all.add(fac);
    const wallM = M('#cfd3d6'), roofM = M('#8f9aa3');
    fac.add(mesh(new THREE.BoxGeometry(1.5, .62, .95), wallM, 0, .31, 0));
    for (let i = 0; i < 3; i++) { // 톱니 지붕
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(.5, 0); sh.lineTo(.5, .26); sh.lineTo(0, 0);
      const pr = mesh(new THREE.ExtrudeGeometry(sh, { depth: .95, bevelEnabled: false }), roofM, -.75 + i * .5, .62, -.475); fac.add(pr);
    }
    const chims = [];
    [[-.45, -.2], [.1, -.28]].forEach(([x, z], i) => {
      const ch = mesh(new THREE.CylinderGeometry(.09, .12, 1.7 + i * .25, 18), M('#b9bec3'), x, (1.7 + i * .25) / 2, z); fac.add(ch);
      const band = mesh(new THREE.CylinderGeometry(.093, .093, .14, 18), M('#c0473d'), x, 1.7 + i * .25 - .12, z); fac.add(band);
      chims.push(V(fac.position.x + x, 1.7 + i * .25 + .05, fac.position.z + z));
    });
    const tank = mesh(new THREE.CylinderGeometry(.26, .26, .55, 24), M('#e6e8ea'), .95, .275, .25); fac.add(tank);
    // 폐수 관: 공장 → 강
    const pipeEnd = curve.getPoint(.24).clone(); pipeEnd.y = .06;
    const pipe = C3.tube([V(fac.position.x + .75, .12, fac.position.z + .1), V((fac.position.x + .75 + pipeEnd.x) / 2, .1, fac.position.z + .1), pipeEnd.clone().add(V(-.18, 0, 0))], .045, M('#6f767c', { roughness: .6 }), 24);
    all.add(pipe);

    /* 논밭 */
    const fields = new THREE.Group(); all.add(fields);
    [[-3.4, -3.0, 0], [-1.45, -3.0, 1], [-3.4, -0.95, 1], [-1.45, -0.95, 0], [-3.4, 1.05, 0], [-1.45, 1.05, 1]].forEach(([x, z, k]) => {
      const f = mesh(new THREE.BoxGeometry(1.75, .06, 1.75), [M('#7d5c3c'), M('#7d5c3c'), M('#ffffff', { map: fieldTex(k) }), M('#7d5c3c'), M('#7d5c3c'), M('#7d5c3c')], x, .03, z, false); fields.add(f);
    });
    // 비료 포대
    for (let i = 0; i < 3; i++) { const s = mesh(RB ? new RB(.3, .12, .2, 2, .05) : new THREE.BoxGeometry(.3, .12, .2), M('#f0eee6'), -0.42, .07 + i * .11, 2.0 + (i % 2) * .05); s.rotation.y = i * .3; all.add(s); }

    /* 나무 */
    const trunkM = M('#7a5a3c'), leafMs = ['#4f8a3d', '#5d9a44', '#3f7a3a', '#6aa24c'].map((c) => M(c, { roughness: .9, flatShading: true }));
    const leafGeo = new THREE.IcosahedronGeometry(1, 1), coneGeo = new THREE.ConeGeometry(1, 1, 8);
    const crowns = [];
    function tree(x, z, s, kind) {
      const t = new THREE.Group(); t.position.set(x, 0, z);
      t.add(mesh(new THREE.CylinderGeometry(.04 * s, .06 * s, .5 * s, 8), trunkM, 0, .25 * s, 0));
      const lm = leafMs[Math.floor(R() * leafMs.length)];
      if (kind) { for (let i = 0; i < 3; i++) { const c = mesh(coneGeo, lm, 0, (.55 + i * .3) * s, 0); c.scale.set((.36 - i * .08) * s, .5 * s, (.36 - i * .08) * s); t.add(c); } }
      else { [[0, .78, 0, .34], [.16, .7, .08, .24], [-.15, .72, -.06, .25], [0, .98, -.02, .22]].forEach(([a, b, c, r]) => { const l = mesh(leafGeo, lm, a * s, b * s, c * s); l.scale.setScalar(r * s); t.add(l); }); }
      all.add(t); crowns.push(V(x, .8 * s, z)); return t;
    }
    for (let i = 0; i < 70; i++) {
      const x = 0.4 + R() * 3.8, z = -4.2 + R() * 8.4;
      if (nearRiver(x, z, .95) || (x < 1.6 && z < -2.1) || (z > 2.1 && z < 3.2) || (x > 3.9 && z > .3 && z < 2)) continue;
      tree(x, z, .8 + R() * .55, R() < .4);
    }
    for (let i = 0; i < 12; i++) { const x = -8.8 + R() * 4.6, z = 3.35 + R() * .95; tree(x, z, .55 + R() * .3, R() < .5); }
    for (let i = 0; i < 6; i++) { const x = -4.4 + R() * 4.2, z = 3.35 + R() * .95; tree(x, z, .55 + R() * .25, 0); }

    /* 구름 */
    const cloudM = M('#ffffff', { roughness: 1 });
    [[-5.5, 3.3, -2.5, 1], [1.5, 3.6, -3.4, .8], [6.2, 3.1, -1.2, .9]].forEach(([x, y, z, s]) => {
      const c = new THREE.Group(); c.position.set(x, y, z);
      [[0, 0, 0, .55], [.55, -.08, .05, .42], [-.55, -.1, 0, .4], [.2, .26, -.05, .38], [-.25, .2, .1, .34]].forEach(([a, b, d, r]) => { const p = mesh(leafGeo, cloudM, a * s, b * s, d * s, false); p.scale.set(r * s * 1.2, r * s * .85, r * s); c.add(p); });
      all.add(c);
    });

    /* 높은 하늘: 오존층과 해 */
    const LAYER_Y = 5.3;
    const layer = mesh(new THREE.BoxGeometry(18.6, .55, 8), new THREE.MeshStandardMaterial({ color: '#8fbbe6', roughness: 1, transparent: true, opacity: .26, depthWrite: false }), 0, LAYER_Y, -1, false); layer.castShadow = false; layer.receiveShadow = false; all.add(layer);
    const ozoneDots = new THREE.Group(); all.add(ozoneDots);
    for (let i = 0; i < 260; i++) { const m = tiny('O3', .055); m.position.set(-9.1 + R() * 18.2, LAYER_Y - .22 + R() * .44, -4.8 + R() * 7.6); m.rotation.set(R() * 6, R() * 6, R() * 6); ozoneDots.add(m); }
    const sunP = V(-7.2, 6.55, -4.6);
    const sunMesh = mesh(new THREE.SphereGeometry(.62, 32, 20), new THREE.MeshBasicMaterial({ color: '#ffd45a' }), sunP.x, sunP.y, sunP.z, false); all.add(sunMesh);

    /* 이름표(누르면 그곳으로) */
    const labels = {};
    ORDER.forEach((k) => {
      const L = st.label(PLACES[k].n, 'zl pin', PLACES[k].at); L.el.dataset.k = k; L.el.setAttribute('role', 'button'); L.el.tabIndex = 0;
      L.el.addEventListener('click', (e) => { e.stopPropagation(); api.onPick && api.onPick(k); });
      labels[k] = L;
    });

    /* ---------- 움직임 ---------- */
    const fx = new THREE.Group(); all.add(fx);
    let place = null, co2 = 0, t = 0;
    const parts = [];
    const puffGeo = new THREE.SphereGeometry(1, 12, 9);
    function clearFx() { parts.length = 0; while (fx.children.length) fx.remove(fx.children[0]); hazeM.opacity = 0; haze.visible = false; riverM.color.set('#3f8fd0'); }
    const hazeTex = canvasTex(128, 128, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.55, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
    const hazeM = new THREE.SpriteMaterial({ map: hazeTex, color: '#b8a284', transparent: true, opacity: 0, depthWrite: false });
    const haze = new THREE.Group(); haze.visible = false; all.add(haze);
    for (let i = 0; i < 18; i++) { const sp = new THREE.Sprite(hazeM); sp.position.set(-8.6 + R() * 4.8, .5 + R() * 1.5, -4 + R() * 6.6); sp.scale.setScalar(2.2 + R() * 1.6); haze.add(sp); }
    let acc = 0, acc2 = 0, pv = 0;
    function addPart(obj, p) { fx.add(obj); p.obj = obj; p.age = 0; parts.push(p); return p; }
    function puff(pos, col, vy, life, s0, s1) {
      const m = new THREE.Mesh(puffGeo, new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: .55, roughness: 1, depthWrite: false }));
      m.position.copy(pos); m.scale.setScalar(s0); addPart(m, { kind: 'puff', v: V((Math.random() - .3) * .25, vy, (Math.random() - .5) * .15), life, s0, s1 });
    }
    function step(dt) {
      dt *= TS(); t += dt;
      if (place === 'city' || place === 'forest') cars.forEach((c) => { c.position.x += c.userData.dir * dt * .9; if (c.position.x > 0.9) c.position.x = -8.9; if (c.position.x < -8.9) c.position.x = 0.9; });
      if (place === 'sky') {
        acc += dt; if (acc > .08) { acc = 0; // 자외선: 해에서 땅 쪽으로, 오존층에서 흡수
          const tx = -6 + Math.random() * 13, tz = -3.5 + Math.random() * 6, dir = V(tx, 0, tz).sub(sunP).normalize();
          const ray = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1, 8), new THREE.MeshBasicMaterial({ color: '#7a48e6', transparent: true, opacity: .9 }));
          ray.quaternion.setFromUnitVectors(V(0, 1, 0), dir); ray.scale.y = 1.8; const p0 = sunP.clone().addScaledVector(dir, .8);
          ray.position.copy(p0); addPart(ray, { kind: 'ray', dir, p: p0.clone(), life: 9 });
        }
      }
      if (place === 'city') {
        acc += dt; if (acc > .16) { acc = 0;
          const c = cars[Math.floor(Math.random() * cars.length)]; puff(c.position.clone().add(V(-c.userData.dir * .26, .08, 0)), '#8d8f92', .22, 2.4, .05, .22);
          const ch = chims[Math.floor(Math.random() * 2)]; puff(ch, '#9a9ca0', .55, 4.2, .1, .5);
        }
        hazeM.opacity = Math.min(.42, hazeM.opacity + dt * .06); haze.visible = true;
        acc2 += dt; if (acc2 > .45 && parts.filter((p) => p.kind === 'o3').length < 26) { acc2 = 0; // 지표 가까이 오존
          const m = tiny('O3', .13); m.position.set(-8.6 + Math.random() * 4.6, .25 + Math.random() * .6, -4 + Math.random() * 6.2); m.scale.setScalar(.01);
          addPart(m, { kind: 'o3', v: V((Math.random() - .5) * .1, .02, (Math.random() - .5) * .1), w: V(Math.random(), Math.random(), Math.random()) });
        }
      }
      if (place === 'farm') {
        acc += dt; if (acc > .05) { acc = 0; // 비료 알갱이 뿌리기
          const sx = -4.2 + ((t * .9) % 3.9), sz = -3.8 + Math.random() * 5.6;
          const g = mesh(puffGeo, M('#f6f3ea', { roughness: .6 }), sx, 1.1 + Math.random() * .2, sz, false); g.scale.setScalar(.034);
          addPart(g, { kind: 'gran', v: V((Math.random() - .5) * .4, .2, (Math.random() - .5) * .4) });
        }
      }
      if (place === 'forest') {
        acc += dt; const rate = co2 ? .09 : .42;
        if (acc > rate) { acc = 0; // 도시·공장에서 나온 이산화 탄소
          const src = Math.random() < .5 ? chims[Math.floor(Math.random() * 2)].clone() : cars[Math.floor(Math.random() * cars.length)].position.clone().add(V(0, .2, 0));
          const m = tiny('CO2', .1); m.position.copy(src); m.rotation.set(Math.random() * 6, Math.random() * 6, 0);
          const absorb = !co2 || Math.random() < .3, tgt = crowns[Math.floor(Math.random() * crowns.length)];
          addPart(m, { kind: 'co2', absorb, tgt: absorb ? tgt.clone().add(V(0, .1, 0)) : V(-7 + Math.random() * 14, 3 + Math.random() * 1.9, -4 + Math.random() * 6), p0: src.clone(), k: 0, dur: 4 + Math.random() * 2.5, w: V(Math.random(), Math.random(), 0) });
        }
      }
      if (place === 'river') {
        acc += dt; if (acc > .12) { acc = 0;
          const d = mesh(puffGeo, M('#6b5a3e', { transparent: true, opacity: .5, roughness: 1, depthWrite: false }), pipeEnd.x, .03, pipeEnd.z, false); d.scale.set(.06, .012, .06);
          addPart(d, { kind: 'waste', u: .24, off: (Math.random() - .5) * .3 });
        }
        pv = Math.min(1, pv + dt * .08); riverM.color.set('#3f8fd0').lerp(new THREE.Color('#6f8a86'), pv * .45);
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i], ob = p.obj; p.age += dt; let dead = false;
        if (p.kind === 'puff') { ob.position.addScaledVector(p.v, dt); const k = p.age / p.life; ob.scale.setScalar(lerp(p.s0, p.s1, Math.sqrt(k))); ob.material.opacity = .5 * (1 - k); dead = k >= 1; }
        else if (p.kind === 'ray') { p.p.addScaledVector(p.dir, dt * 4.2); ob.position.copy(p.p); if (p.p.y < LAYER_Y + .2) { p.hit = (p.hit || 0) + dt; ob.scale.y = Math.max(.01, 1.8 - p.hit * 5); ob.material.opacity = Math.max(0, .9 - p.hit * 2.4); ob.position.addScaledVector(p.dir, -(1.8 - ob.scale.y) * .5); if (p.hit > .3) dead = true; } }
        else if (p.kind === 'o3') { ob.scale.setScalar(Math.min(1, p.age * 1.5)); ob.position.addScaledVector(p.v, dt); ob.rotation.x += p.w.x * dt; ob.rotation.y += p.w.y * dt; if (ob.position.y > 1.3) p.v.y = -Math.abs(p.v.y); if (ob.position.y < .2) p.v.y = Math.abs(p.v.y); }
        else if (p.kind === 'gran') { p.v.y -= 4.5 * dt; ob.position.addScaledVector(p.v, dt); if (ob.position.y <= .07) { ob.position.y = .07; p.v.set(0, 0, 0); p.land = (p.land || 0) + dt; if (p.land > .8 && !p.sent) { p.sent = true; if (Math.random() < .22) { const m = tiny('N2O', .1); m.position.copy(ob.position).add(V(0, .08, 0)); m.rotation.set(0, Math.random() * 6, Math.random()); addPart(m, { kind: 'n2o', v: V((Math.random() - .5) * .08, .45 + Math.random() * .15, (Math.random() - .5) * .08), w: Math.random() * 1.5 }); } } if (p.land > 1.4) dead = true; } }
        else if (p.kind === 'n2o') { ob.position.addScaledVector(p.v, dt); ob.rotation.y += p.w * dt; ob.rotation.z += p.w * .6 * dt; if (ob.position.y > 3.2) ob.scale.setScalar(Math.max(.01, 1 - (ob.position.y - 3.2) / 1.6)); if (ob.position.y > 4.8) dead = true; }
        else if (p.kind === 'co2') {
          p.k = Math.min(1, p.k + dt / p.dur); const e = p.k, q = p.p0.clone().lerp(p.tgt, e); q.y += Math.sin(e * Math.PI) * (p.absorb ? 1.1 : .4);
          ob.position.copy(q); ob.rotation.x += p.w.x * dt; ob.rotation.y += p.w.y * dt;
          if (p.absorb && e > .86) ob.scale.setScalar(Math.max(.01, (1 - e) / .14));
          if (e >= 1) { if (p.absorb) dead = true; else { p.kind = 'co2s'; p.v = V((Math.random() - .5) * .25, (Math.random() - .5) * .06, (Math.random() - .5) * .15); } }
        } else if (p.kind === 'co2s') { ob.position.addScaledVector(p.v, dt); if (ob.position.x > 8.5 || ob.position.x < -8.5) p.v.x *= -1; if (ob.position.y > 5.1 || ob.position.y < 2.8) p.v.y *= -1; ob.rotation.y += dt * .6; }
        else if (p.kind === 'waste') { p.u = Math.min(1, p.u + dt * .055); const c = curve.getPoint(p.u), tg = curve.getTangent(p.u), n = V(-tg.z, 0, tg.x).normalize(); ob.position.set(c.x + n.x * p.off * .6, .03, c.z + n.z * p.off * .6); const s = .05 + p.age * .02; ob.scale.set(Math.min(.15, s), .012, Math.min(.15, s)); if (p.u >= 1) { ob.position.x += p.age * .05; if (p.age > 28) dead = true; } }
        if (dead) { fx.remove(ob); parts.splice(i, 1); }
      }
      const co2s = parts.filter((p) => p.kind === 'co2s'); if (co2s.length > 90) { fx.remove(co2s[0].obj); parts.splice(parts.indexOf(co2s[0]), 1); }
    }
    if (!REDUCE) st.onFrame(step);

    /* ---------- 카메라 ---------- */
    const allBox = [land, bed, layer];
    const homeDir = V(0.16, 0.5, 1);
    function home(dur = 0) { st.fit(allBox, { dir: homeDir, margin: .97, dur }); }
    function go(k, dur = 1.2) {
      if (k === place) return; place = k; clearFx(); acc = acc2 = 0; pv = 0;
      Object.entries(labels).forEach(([n, L]) => L.el.classList.toggle('on', n === k));
      if (!k) { home(dur); return; }
      const P = PLACES[k], box = new THREE.Box3(P.box[0], P.box[1]), h = new THREE.Object3D();
      const helper = new THREE.Mesh(new THREE.BoxGeometry(...box.getSize(V()).toArray()), new THREE.MeshBasicMaterial()); helper.position.copy(box.getCenter(V())); helper.updateMatrixWorld(true); void h;
      st.fit(helper, { dir: P.dir, margin: 1.02, dur });
      if (REDUCE) { // 움직임 줄이기: 한 장면으로 보여 줘요
        for (let i = 0; i < 40; i++) step(.25);
      }
    }
    function setCO2(v) { co2 = v ? 1 : 0; if (place === 'forest') { clearFx(); } }
    home(0);
    if (!o.still) prepare(st);
    const api = { st, go, home, setCO2, labels, PLACES, ORDER, step, get place() { return place; }, onPick: null };
    return api;
  }

  /* ================= 돋보기(입자 모형) ================= */
  function lens(host, o = {}) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.domElement.className = 'gl'; host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(renderer), 0.04).texture;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa8b8, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(-4, 7, 6); scene.add(key);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
    let controls = null;
    if (o.orbit) { controls = new OrbitControls(cam, renderer.domElement); controls.enablePan = false; controls.enableZoom = false; controls.enableDamping = true; controls.rotateSpeed = 0.8; renderer.domElement.style.touchAction = 'none'; }
    const root = new THREE.Group(); scene.add(root);
    let cur = null, W = 1, H = 1, spin = o.spin === undefined ? 0.3 : o.spin;
    function resize() { const r = host.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); renderer.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); place(); }
    function place() {
      if (!cur) return;
      const R = cur.R, f = (cam.fov * Math.PI) / 360, fit = R / Math.sin(Math.min(f, Math.atan(Math.tan(f) * cam.aspect)));
      const d = fit * (o.margin || 1.05); cam.position.set(0, d * 0.3, d * 0.95).setLength(d); cam.lookAt(0, 0, 0);
      if (controls) { controls.target.set(0, 0, 0); controls.update(); }
    }
    function build(kind) {
      if (kind.startsWith('one:')) {
        const id = kind.slice(4);
        if (id === 'Hg') { const s = EL3.swarm('Hg', 13, 4.2, { gap: 1.95, speed: .5, liquid: true, seed: 4 }); return { group: s.group, tick: s.tick, R: 3.9 }; }
        const g = EL3.mol(id); if (id === 'O3') g.rotation.set(0, 0, 0);
        const b = new THREE.Box3().setFromObject(g), sp = b.getBoundingSphere(new THREE.Sphere());
        return { group: g, tick: null, R: Math.max(2.1, sp.radius + .55), single: true };
      }
      const cfg = { O3: ['O3', 10, 9, 2.9, 2.2], N2O: ['N2O', 10, 9, 3.2, 2.2], CO2: ['CO2', 10, 9, 3.2, 2.2], O2: ['O2', 11, 9, 2.6, 2.4], Hg: ['Hg', 30, 6.4, 2.0, .7] }[kind];
      const s = EL3.swarm(cfg[0], cfg[1], cfg[2], { gap: cfg[3], speed: cfg[4], liquid: kind === 'Hg', seed: 11 });
      return { group: s.group, tick: s.tick, R: cfg[2] * .6 };
    }
    const hgM = new THREE.MeshStandardMaterial({ color: '#c9ced4', roughness: .28, metalness: .75 });
    function show(kind) {
      if (cur && cur.kind === kind) return cur;
      if (cur) root.remove(cur.group);
      cur = build(kind); cur.group.traverse((m) => { if (m.isMesh && m.userData.el === 'Hg') m.material = hgM; }); cur.kind = kind; root.add(cur.group); root.rotation.set(0, 0, 0); place(); return cur;
    }
    try { new ResizeObserver(resize).observe(host); } catch (e) { addEventListener('resize', resize); }
    resize();
    let last = performance.now(), sw = 0;
    function vis() { if (document.hidden) return false; try { const f = window.frameElement; if (f && f.hasAttribute('data-page') && !f.classList.contains('on')) return false; } catch (e) {} const r = host.getBoundingClientRect(); return r.width > 2 && r.bottom > -40 && r.top < (innerHeight || 800) + 40; }
    function tick(now) {
      requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000) * TS(); last = now; if (!vis()) return;
      if (cur) { if (cur.tick) cur.tick(dt); if (!REDUCE) { if (cur.single) { sw += dt * spin; root.rotation.y = Math.sin(sw * 1.6) * .45; } else root.rotation.y += dt * spin; } }
      if (controls) controls.update(); renderer.render(scene, cam);
    }
    requestAnimationFrame(tick);
    return { show, renderer, scene, cam, root, get cur() { return cur; }, resize, setSpin: (s) => (spin = s) };
  }

  /* ================= 사진용 장면 ================= */
  function still(host, k) {
    if (k.startsWith('w-')) { // 지구 환경 모형
      const w = world(host, { still: true }); let p = k.slice(2); const many = p === 'forest2'; if (many) p = 'forest';
      if (p !== 'all') { w.go(p, 0); if (many) w.setCO2(1); for (let i = 0; i < (many ? 160 : 60); i++) w.step(.2); }
      w.st.release(); setTimeout(() => { window.__ready = true; }, 800); return w;
    }
    host.style.background = '#fff';
    const L = lens(host, { spin: 0, margin: k.startsWith('one:') ? 1.12 : 1.02 }); L.show(k);
    if (L.cur.tick) for (let i = 0; i < 30; i++) L.cur.tick(.05);
    L.root.rotation.y = k === 'one:N2O' || k === 'one:CO2' ? 0 : .5;
    setTimeout(() => { window.__ready = true; }, 600); return L;
  }

  return { world, lens, still, tiny, NAME, FORM, PLACES, ORDER };
})();
window.ES3 = ES3;
