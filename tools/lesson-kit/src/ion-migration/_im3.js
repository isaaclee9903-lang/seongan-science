/* ===== 이온의 이동 3D (IM3) — 2026-11-16 전면 수정 =====
   교과서 156~157쪽 탐구 '전기력을 이용한 이온의 이동 관찰하기'와 그림 Ⅳ-13을 three.js로 새로 그려요.
   IM3.ION            이온 자료(이름·화학식·전하·입자 모형). 여러 원자로 된 이온은 분자와 이온 수업(MI3)과 같은 모양·색,
                      원자 색은 원소 수업 EL3(같은 폴더에 복사한 _el3.js)과 같아요. 구리 이온만 교과서 그림 Ⅳ-13처럼
                      수용액의 파란색에 맞춰 파랗게 그렸어요.
   IM3.ionModel(id)   이온 입자 모형 묶음(전하 표시 포함)
   IM3.cell(host, o)  입자 돋보기: 두 금속판((−)극 왼쪽, (+)극 오른쪽) 사이 수용액 속 이온. set·mix·power·jump
   IM3.lab(host, o)   실험실: 흰 종이 위 페트리 접시, 금속판, 질산 칼륨 수용액, 집게 달린 전선, 전원 장치, 비커 3개·스포이트
   IM3.still(host, k) 읽기 페이지 사진(_bake.py)
   이온이 움직이는 빠르기, 색이 번지는 모양, 입자의 크기는 개념 이해를 위해 정한 모형이에요(수치는 쓰지 않아요). */
const IM3 = (() => {
  'use strict';
  const { V, makeStage, prepare, REDUCE } = C3;
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeO = (t) => 1 - Math.pow(1 - t, 3);
  const TS = () => (window.__TS || 1); // 검사용 느린 화면(연속 촬영)
  const mkR = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const std = (c, r = .6, m = 0, ex = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: m }, ex));
  const M = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };

  /* ---------- 이온 자료 ---------- */
  Object.assign(EL3.PT, {
    Mn: EL3.PT.Mn || { c: '#8a5bc4', r: 0.95, n: '망가니즈' }, // MI3과 같음
    S: { c: '#e8c23a', r: 0.98, n: '황' },
    K: { c: '#dfe4ea', r: 1.22, n: '칼륨' },
    Cu2: { c: '#3f97df', r: 0.92, n: '구리' }, // 그림 Ⅳ-13처럼 파랗게
  });
  const TET = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].map((q) => V(...q).normalize());
  const TRI = [0, 1, 2].map((i) => V(Math.cos(i * 2.094 + 1.571), Math.sin(i * 2.094 + 1.571), 0));
  const ION = {
    'Cu2+': { f: 'Cu<sup>2+</sup>', t: 'Cu²⁺', n: '구리 이온', q: 2, at: [['Cu2', V()]], from: '황산 구리(Ⅱ) 수용액' },
    'SO42-': { f: 'SO<sub>4</sub><sup>2−</sup>', t: 'SO₄²⁻', n: '황산 이온', q: -2, at: [['S', V()]].concat(TET.map((d) => ['O', d.clone().multiplyScalar(1.49)])), from: '황산 구리(Ⅱ) 수용액' },
    'K+': { f: 'K<sup>+</sup>', t: 'K⁺', n: '칼륨 이온', q: 1, at: [['K', V()]], from: '과망가니즈산 칼륨 수용액, 질산 칼륨 수용액' },
    'MnO4-': { f: 'MnO<sub>4</sub><sup>−</sup>', t: 'MnO₄⁻', n: '과망가니즈산 이온', q: -1, at: [['Mn', V()]].concat(TET.map((d) => ['O', d.clone().multiplyScalar(1.63)])), from: '과망가니즈산 칼륨 수용액' },
    'NO3-': { f: 'NO<sub>3</sub><sup>−</sup>', t: 'NO₃⁻', n: '질산 이온', q: -1, at: [['N', V()]].concat(TRI.map((d) => ['O', d.clone().multiplyScalar(1.25)])), from: '질산 칼륨 수용액', flat: true },
    'Na+': { f: 'Na<sup>+</sup>', t: 'Na⁺', n: '나트륨 이온', q: 1, at: [['Na', V()]], from: '소금물' },
    'Cl-': { f: 'Cl<sup>−</sup>', t: 'Cl⁻', n: '염화 이온', q: -1, at: [['Cl', V()]], from: '소금물' },
  };
  // 수용액 속 이온(교과서 그림 Ⅳ-13은 떨어뜨린 수용액의 이온만 그려요)
  const SOL = {
    cu: { n: '황산 구리(Ⅱ) 수용액', ions: ['Cu2+', 'SO42-'], color: '#2f86d6', dye: [34, 122, 214], vis: 'Cu2+', word: '파란색', liq: '#3f9be0' },
    mn: { n: '과망가니즈산 칼륨 수용액', ions: ['K+', 'MnO4-'], color: '#6d1f88', dye: [112, 26, 132], vis: 'MnO4-', word: '보라색', liq: '#5a1470' },
    salt: { n: '소금물', ions: ['Na+', 'Cl-'] },
    kno3: { n: '질산 칼륨 수용액', ions: ['K+', 'NO3-'] },
  };
  const chg = (q) => (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : '−');

  // 전하 표시(카메라를 보는 작은 글자판)
  const tagCache = {};
  function tagTex(q) {
    if (tagCache[q]) return tagCache[q];
    const tx = C3.canvasTex(160, 96, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.94)'; g.strokeStyle = 'rgba(20,38,59,.22)'; g.lineWidth = 3;
      const r = 26; g.beginPath(); g.moveTo(r + 4, 4); g.arcTo(w - 4, 4, w - 4, h - 4, r); g.arcTo(w - 4, h - 4, 4, h - 4, r); g.arcTo(4, h - 4, 4, 4, r); g.arcTo(4, 4, w - 4, 4, r); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = q > 0 ? '#b23a2e' : '#0e63b3'; g.font = '900 64px Pretendard, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(chg(q), w / 2, h / 2 + 3);
    });
    tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
    return (tagCache[q] = tx);
  }
  function ionModel(id, o = {}) {
    const d = ION[id], g = new THREE.Group(), m = new THREE.Group(); g.add(m);
    d.at.forEach(([e, p]) => m.add(EL3.ball(e, p.x, p.y, p.z)));
    const rad = d.at.length > 1 ? new THREE.Box3().setFromObject(m).getBoundingSphere(new THREE.Sphere()).radius : EL3.PT[d.at[0][0]].r;
    const k = d.at.length > 1 ? 1.42 / rad : 1; m.scale.setScalar(k); // 여러 원자로 된 이온은 조금 작게(한 화면에 여럿)
    if (d.flat) m.rotation.set(-.5, .3, 0); else m.rotation.set(.35, .5, 0);
    const R = d.at.length > 1 ? 1.42 : rad;
    if (o.tag !== false) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTex(d.q), transparent: true, depthWrite: false, depthTest: true }));
      sp.scale.set(.95, .57, 1); sp.position.set(R * .62 + .35, R * .62 + .25, .2); sp.renderOrder = 6; g.add(sp); g.userData.tag = sp;
    }
    g.userData = Object.assign(g.userData, { id, q: d.q, R, spin: m });
    return g;
  }

  /* ---------- 공통 무대 ---------- */
  function stage(host, o = {}) {
    const st = makeStage(host, Object.assign({ top: '#ffffff', bottom: '#e8eff6', fov: 30, hold: true, fitWidth: true, minD: 3, maxD: 40, exposure: 1.0, sunX: -5, sunZ: 8 }, o));
    st.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    return st;
  }
  const frameBox = (w, h, d = 1) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial()); m.visible = false; return m; };

  /* ===================== 입자 돋보기 (그림 Ⅳ-13 속) ===================== */
  function cell(host, o = {}) {
    const st = stage(host, { top: o.lens ? '#fbfdff' : '#ffffff', bottom: o.lens ? '#e4eef7' : '#e8eff6', minD: 4, maxD: 60 });
    st.controls.enableZoom = false;
    if (o.lens) { st.controls.enabled = false; }
    const XW = 6.2, YH = 2.1, ZD = 2.4; // 이온이 움직이는 칸(반 너비)
    const g = new THREE.Group(); st.scene.add(g);
    // 물(아주 옅은 하늘색 덩어리) + 바닥(페트리 접시 바닥)
    const water = M(new THREE.BoxGeometry(XW * 2 + .6, YH * 2 + 1.0, ZD * 2 + .8), new THREE.MeshPhysicalMaterial({ color: '#d9ecf8', roughness: .2, transparent: true, opacity: .16, depthWrite: false }), 0, 0, 0);
    water.castShadow = false; water.receiveShadow = false; g.add(water);
    const surf = M(new THREE.PlaneGeometry(XW * 2 + .6, ZD * 2 + .8), new THREE.MeshStandardMaterial({ color: '#cfe6f6', roughness: .15, transparent: true, opacity: .38, depthWrite: false }), 0, YH + .5, 0);
    surf.rotation.x = -Math.PI / 2; surf.castShadow = false; g.add(surf);
    const bottom = M(new THREE.BoxGeometry(XW * 2 + 1.6, .14, ZD * 2 + 1.6), new THREE.MeshPhysicalMaterial({ color: '#eef4f8', roughness: .12, transparent: true, opacity: .55 }), 0, -YH - .57, 0);
    bottom.castShadow = false; g.add(bottom);
    const paper = M(new THREE.PlaneGeometry(40, 30), std('#fbfbf9', .95), 0, -YH - .66, 0); paper.rotation.x = -Math.PI / 2; paper.castShadow = false; g.add(paper);
    // 금속판(구리판, 왼쪽 (−)극, 오른쪽 (+)극)
    const cuM = std('#c77b4c', .38, .72);
    const plates = [-1, 1].map((s) => { const p = M(new THREE.BoxGeometry(.18, YH * 2 + 1.5, ZD * 2 + .6), cuM, s * (XW + .55), .2, 0); g.add(p); return p; });
    // 전선 집게 쪽 띠(판 위로 나온 부분)
    [-1, 1].forEach((s) => { const lip = M(new THREE.BoxGeometry(.9, .14, ZD * 2 + .6), cuM, s * (XW + .92), YH + 1.02, 0); g.add(lip); });
    const lab = {
      m: st.label('(−)극', 'zl pole', () => V(-(XW + .55), YH + 1.75, 0)),
      p: st.label('(+)극', 'zl pole', () => V(XW + .55, YH + 1.75, 0)),
    };
    const frame = frameBox(XW * 2 + 2.4, YH * 2 + 3.4, ZD * 2); frame.position.y = .35; st.scene.add(frame);
    st.camera.position.set(0, 4, 18); st.controls.target.set(0, 0, 0);
    const dir = o.dir || V(0, .32, 1);
    st.fit(frame, { dir, margin: o.margin || 1.02 });

    const ions = []; let on = false, t0 = 0, rnd = mkR(7);
    function clear() { ions.forEach((p) => g.remove(p.m)); ions.length = 0; }
    function add(id, x, y, z) {
      const m = ionModel(id); m.position.set(x, y, z); g.add(m);
      const p = { id, q: ION[id].q, m, mob: .85 + rnd() * .35, ph: rnd() * 6.28, ph2: rnd() * 6.28, home: V(x, y, z), lane: V(0, y, z), stop: XW - .1 - m.userData.R - rnd() * 1.6 };
      ions.push(p); return p;
    }
    // 가운데에 떨어뜨린 방울처럼 모인 이온(kind 하나 또는 수용액)
    function set(list, o2 = {}) {
      clear(); on = false; rnd = mkR(o2.seed || 7);
      const n = o2.n || 6, spread = o2.spread || 1.0;
      list.forEach((id, li) => {
        for (let i = 0; i < n; i++) {
          let x, y, z, ok = false, tries = 0;
          while (!ok && tries++ < 400) {
            const a = rnd() * 6.283, r = Math.sqrt(rnd()) * (o2.wide ? XW - 1 : 2.2 * spread);
            x = o2.wide ? (rnd() * 2 - 1) * (XW - 1.3) : Math.cos(a) * r; y = (rnd() * 2 - 1) * (YH - .5); z = o2.wide ? (rnd() * 2 - 1) * (ZD - .4) : Math.sin(a) * r * .55;
            ok = ions.every((p) => p.m.position.distanceTo(V(x, y, z)) > (p.m.userData.R + 1.25));
          }
          add(id, x, y, z);
        }
      });
    }
    function power(v) { on = !!v; }
    // 진행 정도(0~1)로 바로 옮기기(사진·돋보기 맞추기)
    function jump(k) {
      ions.forEach((p) => {
        const s = p.q > 0 ? -1 : 1, x0 = p.home.x, tgt = s * p.stop;
        const x = lerp(x0, tgt, clamp(k * p.mob * 1.1));
        p.m.position.x = s > 0 ? Math.min(x, tgt) : Math.max(x, tgt);
      });
    }
    const v = V();
    st.onFrame((dt) => {
      dt *= TS(); t0 += dt;
      ions.forEach((p, i) => {
        const m = p.m, pos = m.position;
        // 제자리 떨림(물 입자와 부딪히는 모습)
        const jx = Math.sin(t0 * 2.3 + p.ph) * .5 + Math.sin(t0 * 3.7 + p.ph2) * .3;
        const jy = Math.sin(t0 * 1.9 + p.ph2) * .5 + Math.sin(t0 * 3.1 + p.ph) * .3;
        const jz = Math.cos(t0 * 2.1 + p.ph) * .5;
        let vx = jx * .22, vy = jy * .22, vz = jz * .22;
        if (on && !REDUCE) {
          const s = p.q > 0 ? -1 : 1, tgt = s * p.stop, gap = (tgt - pos.x) * s;
          if (gap > 0) vx += s * Math.min(1, gap * 1.4 + .15) * 1.05 * p.mob; // 극에 가까워지면 천천히 멈춰 모여요
          else vx += (tgt - pos.x) * .8;
        } else if (on && REDUCE) { pos.x = (p.q > 0 ? -1 : 1) * p.stop; }
        pos.x += vx * dt; pos.y += vy * dt; pos.z += vz * dt;
        pos.y = clamp(pos.y, -YH + .2, YH - .2); pos.z = clamp(pos.z, -ZD + .3, ZD - .3);
        pos.x = clamp(pos.x, -XW + m.userData.R * .6, XW - m.userData.R * .6);
        if (!REDUCE) { const s = m.userData.spin; s.rotation.y += dt * (.25 + (i % 3) * .1); s.rotation.x += dt * .08; }
      });
      // 겹치지 않게 살짝 밀어내기
      for (let a = 0; a < ions.length; a++) for (let b = a + 1; b < ions.length; b++) {
        const A = ions[a].m.position, B = ions[b].m.position; v.subVectors(A, B); const d = v.length(), need = ions[a].m.userData.R + ions[b].m.userData.R + .25;
        if (d < need && d > 1e-4) { v.multiplyScalar((need - d) / d * .5); A.add(v); B.sub(v); }
      }
    });
    const API = { st, set, power, jump, clear, get on() { return on; }, ions, lab };
    prepare(st).then(() => { window.__ready = true; API.ready = true; API.onReady && API.onReady(); });
    return API;
  }

  /* ===================== 실험실 (156쪽 탐구) ===================== */
  function lab(host, opt = {}) {
    const st = stage(host, { top: '#f7fafc', bottom: '#dfe8f1', fov: 30, minD: 2.2, maxD: 16, sunX: -3.5, sunZ: 6, exposure: 1.02 });
    const { scene, camera, controls } = st;
    controls.maxPolarAngle = Math.PI * .47; controls.minPolarAngle = Math.PI * .06; controls.enableZoom = true;
    st.sun.shadow.camera.left = -5; st.sun.shadow.camera.right = 5; st.sun.shadow.camera.top = 5; st.sun.shadow.camera.bottom = -5; st.sun.shadow.mapSize.set(2048, 2048);
    C3.addTable(scene, 12, 8, 0);
    const S = { kind: opt.kind || 'cu', plates: 0, fill: 0, wires: 0, on: false, dropped: false, prog: 0, busy: false };
    const A = { onEvent: null, S };
    const ev = (e, x) => A.onEvent && A.onEvent(e, x);

    /* 흰 종이 */
    const paper = M(new THREE.BoxGeometry(3.3, .006, 2.5), std('#fdfdfb', .92), 0, .003, .15); paper.rotation.y = .06; paper.castShadow = false; scene.add(paper);
    /* 페트리 접시 */
    const DR = 1.0, CX = 0, CZ = .15, BASE = .03, WALL = .26;
    const dish = new THREE.Group(); dish.position.set(CX, .006, CZ); scene.add(dish);
    const glassM = new THREE.MeshPhysicalMaterial({ color: '#e7f0f6', roughness: .06, metalness: 0, transparent: true, opacity: .32, depthWrite: false, side: THREE.DoubleSide, clearcoat: .5 });
    const base = M(new THREE.CylinderGeometry(DR + .02, DR + .02, BASE, 72), new THREE.MeshPhysicalMaterial({ color: '#eef4f8', roughness: .08, transparent: true, opacity: .5, depthWrite: false }), 0, BASE / 2, 0); base.castShadow = false; dish.add(base);
    const wall = M(new THREE.CylinderGeometry(DR + .02, DR + .02, WALL, 72, 1, true), glassM, 0, WALL / 2, 0); wall.castShadow = false; dish.add(wall);
    const rim = M(new THREE.TorusGeometry(DR + .02, .012, 10, 96), new THREE.MeshPhysicalMaterial({ color: '#d7e3ec', roughness: .1, transparent: true, opacity: .7 }), 0, WALL, 0); rim.rotation.x = Math.PI / 2; dish.add(rim);
    // 바닥 그림자 테두리(유리 두께가 보이게)
    const ring = M(new THREE.RingGeometry(DR - .02, DR + .05, 96), new THREE.MeshBasicMaterial({ color: '#b9c9d6', transparent: true, opacity: .35, depthWrite: false }), 0, .002, 0); ring.rotation.x = -Math.PI / 2; dish.add(ring);
    // 수용액
    const liqM = new THREE.MeshPhysicalMaterial({ color: '#dcecf7', roughness: .1, transparent: true, opacity: .42, depthWrite: false });
    const liq = M(new THREE.CylinderGeometry(DR - .005, DR - .005, 1, 72), liqM, 0, BASE, 0); liq.castShadow = false; liq.visible = false; dish.add(liq);
    const LMAX = .15;
    // 색 성분이 번지는 면(캔버스)
    const CW = 512, dyeCv = document.createElement('canvas'); dyeCv.width = dyeCv.height = CW; const dg = dyeCv.getContext('2d');
    const dyeTex = new THREE.CanvasTexture(dyeCv); dyeTex.colorSpace = THREE.SRGBColorSpace; dyeTex.anisotropy = 8;
    const dye = M(new THREE.CircleGeometry(DR - .01, 96), new THREE.MeshStandardMaterial({ map: dyeTex, transparent: true, depthWrite: false, roughness: .35 }), 0, BASE, 0);
    dye.rotation.x = -Math.PI / 2; dye.castShadow = false; dye.renderOrder = 4; dye.visible = false; dish.add(dye);
    const setLevel = (k) => { const h = Math.max(.001, LMAX * k); liq.scale.y = h; liq.position.y = BASE + h / 2; liq.visible = k > .01; dye.position.y = BASE + h + .002; };
    // 물결(방울이 떨어진 자리)
    const ripples = [0, 1, 2].map(() => { const r = M(new THREE.RingGeometry(.9, 1, 64), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }), 0, 0, 0); r.rotation.x = -Math.PI / 2; r.renderOrder = 5; r.castShadow = false; dish.add(r); return { r, t: -1 }; });

    /* 금속판(구리판을 접시 가장자리에 구부려 끼움): 안쪽 세움 + 가장자리 위 + 바깥 세움 */
    const cuM = std('#c8794a', .36, .75);
    const PW = .34;
    function plateMesh() {
      const g = new THREE.Group();
      const sh = new THREE.Shape(); // 옆에서 본 구부린 모양(두께 0.014)
      const T = .014, x0 = 0, xo = .09, top = WALL + .03;
      sh.moveTo(x0, BASE + .005); sh.lineTo(x0, top - .02); sh.quadraticCurveTo(x0, top, x0 + .03, top); sh.lineTo(xo - .02, top); sh.quadraticCurveTo(xo, top, xo, top - .03); sh.lineTo(xo, .07);
      sh.lineTo(xo + T, .07); sh.lineTo(xo + T, top - .03); sh.quadraticCurveTo(xo + T, top + T, xo - .02, top + T); sh.lineTo(x0 + .03, top + T); sh.quadraticCurveTo(x0 - T, top + T, x0 - T, top - .02); sh.lineTo(x0 - T, BASE + .005); sh.closePath();
      const geo = new THREE.ExtrudeGeometry(sh, { depth: PW, bevelEnabled: false, curveSegments: 8 }); geo.translate(0, 0, -PW / 2);
      const m = M(geo, cuM); g.add(m); return g;
    }
    const plates = [-1, 1].map((s) => { const p = plateMesh(); p.scale.x = s > 0 ? 1 : -1; p.userData.home = V(s * (DR - .045), 0, 0); dish.add(p); p.visible = false; return p; });
    // 왼쪽 = (−)극, 오른쪽 = (+)극 (그림 Ⅳ-13과 같음)

    /* 전원 장치 */
    const psu = new THREE.Group(); psu.position.set(2.15, 0, -1.25); psu.rotation.y = -.38; scene.add(psu);
    psu.add(M(new RoundedBoxGeometry(1.7, .78, 1.15, 4, .06), std('#1f242b', .5, .15), 0, .39, 0));
    psu.add(M(new THREE.BoxGeometry(1.56, .66, .02), std('#2a3038', .62), 0, .4, .58));
    // 옆 통풍 홈
    for (let i = 0; i < 5; i++) psu.add(M(new THREE.BoxGeometry(.012, .05, .7), std('#111418', .7), .86, .22 + i * .1, -.05));
    const dispCv = document.createElement('canvas'); dispCv.width = 256; dispCv.height = 96; const dx = dispCv.getContext('2d');
    const dispTex = new THREE.CanvasTexture(dispCv); dispTex.colorSpace = THREE.SRGBColorSpace;
    function drawDisp(on) {
      dx.fillStyle = on ? '#2a0b0a' : '#14171b'; dx.fillRect(0, 0, 256, 96);
      // 일곱 토막 숫자판의 꺼진 토막(숫자는 보이지 않게)
      dx.strokeStyle = on ? 'rgba(255,70,50,.95)' : 'rgba(255,255,255,.05)'; dx.lineWidth = 9; dx.lineCap = 'round';
      [[34, 0], [102, 0], [170, 0]].forEach(([x]) => { dx.beginPath(); dx.moveTo(x, 48); dx.lineTo(x + 44, 48); dx.stroke(); });
      if (on) { dx.fillStyle = 'rgba(255,90,60,.9)'; dx.beginPath(); dx.arc(236, 80, 5, 0, 6.3); dx.fill(); }
      dispTex.needsUpdate = true;
    }
    drawDisp(false);
    const disp = M(new THREE.PlaneGeometry(.62, .23), new THREE.MeshBasicMaterial({ map: dispTex, toneMapped: false }), -.33, .58, .595); disp.castShadow = false; psu.add(disp);
    const knob = new THREE.Group(); knob.position.set(.45, .55, .62); psu.add(knob);
    const kb = M(new THREE.CylinderGeometry(.11, .12, .09, 32), std('#d9dde2', .45), 0, 0, 0); kb.rotation.x = Math.PI / 2; knob.add(kb);
    knob.add(M(new THREE.BoxGeometry(.02, .09, .02), std('#22272e', .5), 0, .055, .05));
    const pbtn = M(new RoundedBoxGeometry(.16, .1, .06, 2, .02), std('#3a4048', .5), -.58, .22, .6); psu.add(pbtn);
    const lamp = M(new THREE.SphereGeometry(.028, 16, 12), new THREE.MeshStandardMaterial({ color: '#4a1f1a', emissive: '#ff3b2b', emissiveIntensity: 0 }), -.36, .22, .615); psu.add(lamp);
    const jacks = {};
    [['p', .15, '#d23a2c'], ['m', .42, '#1c2127']].forEach(([k, x, c]) => {
      const j = new THREE.Group(); j.position.set(x, .2, .6); psu.add(j);
      const c1 = M(new THREE.CylinderGeometry(.055, .06, .08, 24), std(c, .45), 0, 0, .03); c1.rotation.x = Math.PI / 2; j.add(c1);
      const c2 = M(new THREE.CylinderGeometry(.022, .022, .06, 16), std('#c9a347', .3, .8), 0, 0, .08); c2.rotation.x = Math.PI / 2; j.add(c2);
      jacks[k] = j;
    });
    const jackPos = (k) => jacks[k].localToWorld(V(0, 0, .11));

    /* 비커 3개와 스포이트 */
    const beakGeo = new THREE.LatheGeometry([[0, 0], [.3, 0], [.31, .01], [.31, .62], [.335, .66], [.34, .67], [.33, .675], [.3, .64], [.3, .012], [0, .012]].map(([a, b]) => new THREE.Vector2(a, b)), 48);
    const beakM = new THREE.MeshPhysicalMaterial({ color: '#e8f0f5', roughness: .05, transparent: true, opacity: .34, depthWrite: false, side: THREE.DoubleSide });
    function beaker(x, z, col, op, lvl, name) {
      const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
      const b = M(beakGeo, beakM); b.castShadow = false; g.add(b);
      const lq = M(new THREE.CylinderGeometry(.295, .295, 1, 40), new THREE.MeshPhysicalMaterial({ color: col, roughness: .12, transparent: true, opacity: op, depthWrite: false }), 0, 0, 0); lq.castShadow = false; g.add(lq);
      // 눈금
      for (let i = 1; i <= 4; i++) { const t = M(new THREE.BoxGeometry(.07, .006, .004), std('#9fb0c0', .6), -.12, .12 * i, .305); t.castShadow = false; g.add(t); }
      const o = { g, lq, lvl, name, set(l) { o.lvl = l; lq.scale.y = Math.max(.001, l); lq.position.y = .012 + l / 2; } };
      o.set(lvl); return o;
    }
    const BK = {
      kno3: beaker(-2.0, -.6, '#e3eef6', .38, .44, '질산 칼륨 수용액'),
      cu: beaker(-1.6, -1.45, '#3f9be0', .8, .36, '황산 구리(Ⅱ) 수용액'),
      mn: beaker(-.75, -1.75, '#4f0f66', .92, .36, '과망가니즈산 칼륨 수용액'),
    };
    function pipette(col) {
      const g = new THREE.Group();
      const tube = M(new THREE.LatheGeometry([[0, 0], [.012, 0], [.018, .1], [.03, .2], [.03, .62], [0, .62]].map(([a, b]) => new THREE.Vector2(a, b)), 20), new THREE.MeshPhysicalMaterial({ color: '#eef4f8', roughness: .05, transparent: true, opacity: .45, depthWrite: false }));
      tube.castShadow = false; g.add(tube);
      const inside = M(new THREE.LatheGeometry([[0, .01], [.009, .01], [.014, .1], [.024, .2], [.024, .36], [0, .36]].map(([a, b]) => new THREE.Vector2(a, b)), 16), std(col, .2, 0, { transparent: true, opacity: .9 })); inside.castShadow = false; g.add(inside);
      const bulb = M(new THREE.LatheGeometry([[0, .6], [.045, .6], [.06, .68], [.062, .78], [.05, .86], [0, .88]].map(([a, b]) => new THREE.Vector2(a, b)), 24), std('#2b2f35', .7)); g.add(bulb);
      g.userData.inside = inside; return g;
    }
    const PIP = { cu: pipette('#2f86d6'), mn: pipette('#5a1470') };
    const pipHome = (k) => BK[k].g.position.clone().add(V(.08, .12, .02));
    ['cu', 'mn'].forEach((k) => { const p = PIP[k]; p.position.copy(pipHome(k)); p.rotation.z = -.12; scene.add(p); });
    const drop = M(new THREE.SphereGeometry(1, 20, 14), std('#2f86d6', .15, 0, { transparent: true, opacity: .92 }), 0, -5, 0); drop.visible = false; scene.add(drop);

    /* 집게 달린 전선 */
    const clipHome = { m: V(.95, .1, -.65), p: V(1.35, .1, -.55) };
    const clipAt = { m: V(CX - DR - .1, .17, CZ), p: V(CX + DR + .1, .17, CZ) };
    function clip(col) {
      const g = new THREE.Group();
      g.add(M(new THREE.CylinderGeometry(.045, .06, .26, 16), std(col, .55), 0, 0, .0)).rotation.z = Math.PI / 2;
      const jaw = std('#c7ccd2', .3, .85);
      const j1 = M(new THREE.BoxGeometry(.2, .02, .06), jaw, -.2, .03, 0), j2 = M(new THREE.BoxGeometry(.2, .02, .06), jaw, -.2, -.03, 0); g.add(j1, j2);
      for (let i = 0; i < 4; i++) { g.add(M(new THREE.BoxGeometry(.012, .02, .05), jaw, -.27 + i * .04, .015, 0)); }
      return g;
    }
    const CL = { m: clip('#1f242b'), p: clip('#d23a2c') };
    const wireM = { m: std('#262b31', .55), p: std('#cc3b2e', .55) };
    const W = { m: null, p: null };
    const clipPos = { m: clipHome.m.clone(), p: clipHome.p.clone() };
    function wirePath(k) {
      const a = jackPos(k), c = clipPos[k], s = k === 'm' ? -1 : 1;
      const mid1 = V(lerp(a.x, c.x, .35), .025, a.z + .55), mid2 = k === 'm' ? V(c.x - .25, .03, CZ + DR + .45) : V(c.x + .32, .03, CZ + .55);
      const near = V(c.x + s * .3, .06, c.z);
      return [a, V(a.x, .06, a.z + .25), mid1, mid2, near, c.clone().add(V(s * .15, 0, 0))];
    }
    function buildWire(k) {
      if (W[k]) { scene.remove(W[k]); W[k].geometry.dispose(); }
      W[k] = C3.tube(wirePath(k), .018, wireM[k], 60); scene.add(W[k]);
    }
    function placeClip(k) {
      const c = CL[k], s = k === 'm' ? -1 : 1; c.position.copy(clipPos[k]);
      c.rotation.set(0, s > 0 ? Math.PI : 0, 0); // 집게 입이 접시 쪽
    }
    ['m', 'p'].forEach((k) => { scene.add(CL[k]); placeClip(k); buildWire(k); });

    /* 이름표 */
    const L = {
      dish: st.label('페트리 접시', 'dv', () => V(CX + .1, .02, CZ + DR + .2)),
      paper: st.label('흰 종이', 'dv', () => V(CX - 1.35, .02, CZ + 1.12)),
      psu: st.label('전원 장치', 'dv', () => psu.localToWorld(V(0, .95, 0))),
      kno3: st.label('질산 칼륨 수용액', 'dv', () => (S.busy && S.pour ? null : BK.kno3.g.position.clone().add(V(0, .92, 0)))),
      cu: st.label('황산 구리(Ⅱ) 수용액', 'dv', () => BK.cu.g.position.clone().add(V(0, 1.12, 0))),
      mn: st.label('과망가니즈산 칼륨 수용액', 'dv', () => BK.mn.g.position.clone().add(V(0, 1.12, 0))),
      pm: st.label('(−)극', 'dv pole', () => (S.wires >= 1 ? V(CX - DR - .02, WALL + .26, CZ - .1) : null)),
      pp: st.label('(+)극', 'dv pole', () => (S.wires >= 1 ? V(CX + DR + .02, WALL + .26, CZ - .1) : null)),
      plate: st.label('금속판', 'dv', () => (S.plates >= 1 && S.wires < 1 ? V(CX + DR + .05, WALL + .25, CZ - .15) : null)),
      say: st.label('', 'dv say', () => sayAt),
    };
    let sayAt = null;
    const say = (t, at) => { L.say.set(t); sayAt = at; L.say.show = !!t; };
    say('');
    A.labels = L;

    /* 색 성분(이온) 무리 */
    const puffs = [];
    function spawnDye() {
      puffs.length = 0; const r = mkR(S.kind === 'cu' ? 21 : 33);
      for (let i = 0; i < 150; i++) {
        const a = r() * 6.283, d = Math.sqrt(r()) * .045;
        puffs.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, vx: Math.cos(a) * (.08 + r() * .18), vz: Math.sin(a) * (.08 + r() * .18), r: .035 + r() * .03, mob: .78 + r() * .44, ph: r() * 6.28, al: .14 + r() * .08 });
      }
    }
    function drawDye() {
      dg.clearRect(0, 0, CW, CW);
      if (!puffs.length) { dyeTex.needsUpdate = true; return; }
      const c = SOL[S.kind].dye, k = CW / (2 * DR);
      puffs.forEach((p) => {
        const x = (p.x / DR + 1) / 2 * CW, y = (p.z / DR + 1) / 2 * CW, rr = p.r * k;
        const gr = dg.createRadialGradient(x, y, 0, x, y, rr);
        gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${p.al})`); gr.addColorStop(.55, `rgba(${c[0]},${c[1]},${c[2]},${p.al * .55})`); gr.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        dg.fillStyle = gr; dg.beginPath(); dg.arc(x, y, rr, 0, 6.283); dg.fill();
      });
      dyeTex.needsUpdate = true;
    }
    const EDGE = DR - .1; // 금속판 앞
    function stepDye(dt, t) {
      const dir = S.kind === 'cu' ? -1 : 1;
      let front = 0;
      puffs.forEach((p) => {
        // 방울이 퍼지는 처음 움직임(점점 느려짐)
        p.x += p.vx * dt; p.z += p.vz * dt; const f = Math.exp(-dt * 2.6); p.vx *= f; p.vz *= f;
        // 아주 느린 번짐
        p.r = Math.min(.2, p.r + dt * .0035); p.x += Math.sin(t * .9 + p.ph) * dt * .006; p.z += Math.cos(t * .8 + p.ph) * dt * .008;
        if (S.on) {
          const lim = EDGE - p.r * .35, gap = lim - p.x * dir;
          if (gap > 0) p.x += dir * Math.min(1, gap * 3 + .25) * .07 * p.mob * dt;
          else { p.x = dir * lim; }
          if (gap < .12) { p.z += (p.z >= 0 ? 1 : -1) * dt * .02 * (1 - gap / .12); p.r = Math.min(.17, p.r + dt * .004); } // 판 앞에 모여 옆으로 퍼짐
        }
        const rr = Math.hypot(p.x, p.z); if (rr > DR - .06) { p.x *= (DR - .06) / rr; p.z *= (DR - .06) / rr; }
        front = Math.max(front, (p.x * dir) / EDGE);
      });
      return front;
    }
    // 진행 정도로 바로 옮기기(사진·검사용)
    function jumpDye(k) {
      spawnDye(); const dir = S.kind === 'cu' ? -1 : 1;
      puffs.forEach((p) => { p.x += p.vx / 2.6; p.z += p.vz / 2.6; p.vx = p.vz = 0; p.r = Math.min(.2, p.r + .03); });
      puffs.forEach((p) => {
        const lim = EDGE - p.r * .35; p.x = Math.min(lim, p.x * dir + k * .9 * p.mob) * dir;
        if (p.x * dir >= lim - .1) { p.z *= 1 + k * .6; p.r = Math.min(.17, p.r + .03 * k); }
        const rr = Math.hypot(p.x, p.z); if (rr > DR - .06) { p.x *= (DR - .06) / rr; p.z *= (DR - .06) / rr; }
      });
      S.prog = k; drawDye();
    }

    /* 진행 중인 장면 */
    let anim = null; const queue = [];
    const play = (dur, fn, done) => { queue.push({ t: 0, dur: REDUCE ? .01 : dur, fn, done }); if (!anim) anim = queue.shift(); };
    let t0 = 0;
    st.onFrame((dt) => {
      dt *= TS(); t0 += dt;
      if (anim) {
        anim.t += dt; const u = clamp(anim.t / anim.dur);
        anim.fn(u, dt);
        if (u >= 1) { const d = anim.done; anim = queue.shift() || null; d && d(); }
      }
      // 물결
      ripples.forEach((o) => {
        if (o.t < 0) return; o.t += dt; const u = o.t / 1.6;
        if (u >= 1) { o.t = -1; o.r.material.opacity = 0; return; }
        o.r.scale.setScalar(.03 + u * .5); o.r.position.y = dye.position.y + .002; o.r.material.opacity = .7 * (1 - u);
      });
      if (S.dropped) {
        const f = stepDye(dt, t0); if (S.on) S.prog = Math.max(S.prog, f);
        drawDye();
        if (S.on && S.prog > .97 && !S.doneEv) { S.doneEv = true; ev('arrive'); }
      }
      if (S.on) { knob.rotation.z = lerp(knob.rotation.z, -1.1, Math.min(1, dt * 4)); lamp.material.emissiveIntensity = 2; }
      else { knob.rotation.z = lerp(knob.rotation.z, 0, Math.min(1, dt * 4)); lamp.material.emissiveIntensity = 0; }
    });

    /* ---------- 과정 ---------- */
    // 1 금속판 끼우기: 위에서 내려와 가장자리에 걸려요
    function putPlates(done) {
      if (S.busy || S.plates) return false; S.busy = true;
      plates.forEach((p, i) => { p.visible = true; p.position.copy(p.userData.home).add(V(i ? .5 : -.5, .9, .0)); p.rotation.z = (i ? -1 : 1) * .5; });
      play(1.25, (u) => {
        plates.forEach((p, i) => {
          const k = clamp(u * 1.15 - i * .15), e = easeO(k), s = i ? 1 : -1;
          p.position.set(p.userData.home.x + s * .5 * (1 - e), .9 * (1 - e) * (1 - e) + Math.sin(e * Math.PI) * .05, 0);
          p.rotation.z = -s * .5 * (1 - e);
        });
      }, () => { plates.forEach((p) => { p.position.copy(p.userData.home); p.rotation.z = 0; }); S.plates = 1; S.busy = false; ev('plates'); done && done(); });
      return true;
    }
    // 2 질산 칼륨 수용액 넣기: 비커를 들어 기울여 부어요
    const stream = M(new THREE.CylinderGeometry(.018, .028, 1, 16, 1, true), new THREE.MeshPhysicalMaterial({ color: '#d6e9f6', roughness: .05, transparent: true, opacity: .55, depthWrite: false }), 0, 0, 0); stream.visible = false; stream.castShadow = false; scene.add(stream);
    function pour(done) {
      if (S.busy || !S.plates || S.fill) return false; S.busy = true; S.pour = true;
      const b = BK.kno3, g = b.g, home = g.position.clone(), over = V(CX - .62, .78, CZ - .38);
      const lip = V(); const tilt = 1.15;
      play(1.0, (u) => { const e = ease(u); g.position.lerpVectors(home, over, e); g.position.y += Math.sin(e * Math.PI) * .25; g.rotation.z = 0; });
      play(.7, (u) => { g.rotation.z = -tilt * ease(u); });
      play(2.2, (u, dt) => {
        g.rotation.z = -tilt - Math.sin(u * Math.PI) * .08;
        b.set(lerp(.44, .2, u)); setLevel(easeO(u));
        g.updateMatrixWorld(true); lip.copy(g.localToWorld(V(.34, .66, 0)));
        const yb = BASE + LMAX * easeO(u) + .01, len = Math.max(.02, lip.y - yb);
        stream.visible = u < .96; stream.position.set(lip.x + .02, yb + len / 2, lip.z); stream.scale.set(1 - u * .4, len, 1 - u * .4);
        const sp = Math.sin(t0 * 8) * .02; stream.rotation.z = sp;
      }, () => { stream.visible = false; });
      play(.6, (u) => { g.rotation.z = -tilt * (1 - ease(u)); });
      play(.9, (u) => { const e = ease(u); g.position.lerpVectors(over, home, e); g.position.y += Math.sin(e * Math.PI) * .2; }, () => { g.position.copy(home); S.fill = 1; S.busy = false; S.pour = false; ev('fill'); done && done(); });
      return true;
    }
    // 3 전선 연결하고 전류 흘리기
    function wire(done) {
      if (S.busy || !S.fill || S.wires) return false; S.busy = true;
      const from = { m: clipPos.m.clone(), p: clipPos.p.clone() };
      ['m', 'p'].forEach((k, i) => {
        play(1.0, (u) => {
          const e = ease(u), to = clipAt[k];
          clipPos[k].lerpVectors(from[k], to, e); clipPos[k].y += Math.sin(e * Math.PI) * .45;
          placeClip(k); CL[k].rotation.z = (k === 'm' ? -1 : 1) * Math.sin(e * Math.PI) * .25; buildWire(k);
        }, () => { clipPos[k].copy(clipAt[k]); placeClip(k); buildWire(k); });
      });
      play(.05, () => {}, () => { S.wires = 1; S.busy = false; ev('wires'); done && done(); });
      return true;
    }
    function power(on) { if (!S.wires) return false; S.on = !!on; drawDisp(S.on); ev(on ? 'on' : 'off'); return true; }
    // 4 가운데에 한 방울 떨어뜨리기
    function dropIt(done) {
      if (S.busy || !S.fill || S.dropped) return false; S.busy = true;
      const k = S.kind, p = PIP[k], home = p.position.clone(), above = V(CX, .95, CZ), col = SOL[k].color;
      drop.material.color.set(col);
      play(.8, (u) => { const e = ease(u); p.position.copy(home); p.position.y += e * .6; p.rotation.z = -.12 * (1 - e); });
      play(1.1, (u) => { const e = ease(u); p.position.lerpVectors(home.clone().add(V(0, .6, 0)), above, e); p.position.y += Math.sin(e * Math.PI) * .15; p.rotation.z = 0; });
      // 끝에 방울이 맺혀요
      play(.9, (u) => { drop.visible = true; const r = .012 + .022 * easeO(u); drop.scale.set(r, r * (1 + u * .25), r); drop.position.set(CX, above.y - .01 - r * 1.1, CZ); });
      // 떨어져요(중력)
      const y0 = above.y - .05, yE = BASE + LMAX + .004;
      play(.36, (u) => { const y = y0 - (y0 - yE) * u * u; drop.position.y = y; const s = drop.scale.x; drop.scale.set(s, s * 1.25, s); }, () => {
        drop.visible = false; S.dropped = true; S.doneEv = false; S.prog = 0; spawnDye(); dye.visible = true;
        ripples.forEach((o, i) => { o.t = -i * .22; o.r.position.set(0, 0, 0); });
        ev('dropped');
      });
      play(1.1, (u) => { const e = ease(u); p.position.lerpVectors(above, home, e); p.position.y += Math.sin(e * Math.PI) * .3; p.rotation.z = -.12 * e; }, () => { S.busy = false; done && done(); });
      return true;
    }
    ripples.forEach((o) => (o.t = -1));
    // 물결이 차례로 나타나게
    st.onFrame((dt) => { ripples.forEach((o) => { if (o.t < -0.0001 && o.t > -1) o.t += dt * TS(); }); });

    /* 입자 돋보기(HTML 원 + 작은 3D 칸) */
    const lens = document.createElement('div'); lens.className = 'lens3'; lens.hidden = true;
    lens.innerHTML = '<div class="lv"></div><div class="lcap"></div>';
    host.appendChild(lens);
    const lline = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); lline.setAttribute('class', 'lline3'); lline.innerHTML = '<line stroke="#14263b" stroke-width="1.5" stroke-dasharray="4 4"/><circle r="6" fill="none" stroke="#14263b" stroke-width="1.5"/>'; lline.hidden = true; host.appendChild(lline);
    let CELL = null, cellKind = null;
    function syncCell() {
      if (!CELL) return;
      if (cellKind !== S.kind) { CELL.set(SOL[S.kind].ions, { n: 5, seed: S.kind === 'cu' ? 5 : 9 }); cellKind = S.kind; }
      CELL.jump(S.prog); CELL.power(S.on);
      const d = SOL[S.kind], a = ION[d.ions[0]], b = ION[d.ions[1]];
      lens.querySelector('.lcap').innerHTML = `<span><i class="pk" style="background:${EL3.PT[a.at[0][0]].c}"></i>${a.n}(${a.f}) → (−)극</span><span><i class="pk" style="background:${EL3.PT[b.at[0][0]].c}"></i>${b.n}(${b.f}) → (+)극</span>`;
    }
    st.onFrame(() => {
      if (lens.hidden) return;
      const dir = S.kind === 'cu' ? -1 : 1, x = S.dropped ? dir * Math.min(.8, S.prog * .82) * .9 : 0;
      const p = dish.localToWorld(V(x, BASE + LMAX, 0)).project(camera), r = host.getBoundingClientRect(), lr = lens.querySelector('.lv').getBoundingClientRect();
      const px = (p.x + 1) / 2 * r.width, py = (1 - p.y) / 2 * r.height, cx = lr.left - r.left + lr.width / 2, cy = lr.top - r.top + lr.height / 2;
      const dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy) || 1, R = lr.width / 2;
      const ln = lline.querySelector('line'); ln.setAttribute('x1', cx + dx / d * R); ln.setAttribute('y1', cy + dy / d * R); ln.setAttribute('x2', px); ln.setAttribute('y2', py);
      const c = lline.querySelector('circle'); c.setAttribute('cx', px); c.setAttribute('cy', py);
    });
    function showLens(on) {
      lens.hidden = !on; lline.hidden = !on; S.lens = !!on;
      if (on) { if (!CELL) CELL = cell(lens.querySelector('.lv'), { lens: true, dir: V(0, .42, 1), margin: 1.0 }); cellKind = null; syncCell(); }
    }
    A.syncLens = syncCell;

    /* 보기 */
    const fr = frameBox(5.6, 1.6, 3.2); fr.position.set(.05, .6, -.45); scene.add(fr);
    const frDish = frameBox(2.5, .35, 2.15); frDish.position.set(CX, .15, CZ); scene.add(frDish);
    function view(mode = 'all', dur = .9) {
      A.mode = mode;
      if (mode === 'dish') st.fit(frDish, { dir: V(0, 2.0, 1), margin: opt.dishMargin || 1.0, dur });
      else st.fit(fr, { dir: V(.02, .62, 1), margin: opt.margin || 1.0, dur });
    }

    function reset(kind) {
      queue.length = 0; anim = null;
      if (kind) S.kind = kind;
      Object.assign(S, { plates: 0, fill: 0, wires: 0, on: false, dropped: false, prog: 0, busy: false, doneEv: false, pour: false });
      plates.forEach((p) => (p.visible = false)); setLevel(0); puffs.length = 0; drawDye(); dye.visible = false; drawDisp(false);
      BK.kno3.set(.44); BK.kno3.g.position.set(-2.0, 0, -.6); BK.kno3.g.rotation.set(0, 0, 0);
      ['cu', 'mn'].forEach((k) => { PIP[k].position.copy(pipHome(k)); PIP[k].rotation.set(0, 0, -.12); });
      ['m', 'p'].forEach((k) => { clipPos[k].copy(clipHome[k]); placeClip(k); CL[k].rotation.z = 0; buildWire(k); });
      drop.visible = false; stream.visible = false; say('');
      if (S.lens) { cellKind = null; syncCell(); }
      view('all', 0);
    }
    // 검사·사진용: 상태 바로 만들기 { kind, upto: 'plates'|'fill'|'wires'|'on'|'drop', prog }
    function jump(o = {}) {
      reset(o.kind || S.kind);
      const order = ['plates', 'fill', 'wires', 'on', 'drop'], n = order.indexOf(o.upto || 'drop') + 1;
      if (n >= 1) { S.plates = 1; plates.forEach((p) => { p.visible = true; p.position.copy(p.userData.home); p.rotation.z = 0; }); }
      if (n >= 2) { S.fill = 1; setLevel(1); BK.kno3.set(.2); }
      if (n >= 3) { S.wires = 1; ['m', 'p'].forEach((k) => { clipPos[k].copy(clipAt[k]); placeClip(k); buildWire(k); }); }
      if (n >= 4) power(true);
      if (n >= 5) { S.dropped = true; dye.visible = true; S.doneEv = (o.prog || 0) > .97; jumpDye(o.prog || 0); }
      if (o.off) power(false);
      if (S.lens) syncCell();
    }
    reset(S.kind);
    Object.assign(A, { st, stage: st, putPlates, pour, wire, power, drop: dropIt, showLens, view, reset, jump, say, get busy() { return S.busy; } });
    prepare(st).then(() => { window.__ready = true; A.ready = true; A.onReady && A.onReady(); });
    return A;
  }

  /* ===================== 사진용 장면 ===================== */
  function still(host, k) {
    // lab-*: 실험실 / cell-*: 입자 돋보기
    if (k.startsWith('cell')) {
      const kind = k.split('-')[1] || 'cu';
      const C = cell(host, { dir: V(0, .5, 1), margin: 1.0 });
      C.st.controls.enabled = false;
      C.set(SOL[kind].ions, { n: 6, seed: kind === 'cu' ? 5 : 9 });
      C.onReady = () => { C.jump(.62); };
      C.jump(.62); window.__TS = .0001;
      return C;
    }
    const [, kind, state] = k.split('-');
    const A = lab(host, { kind: kind || 'cu', margin: 1.0, dishMargin: 1.0 });
    A.st.controls.enabled = false;
    const go = () => {
      if (state === 'setup') { A.jump({ kind, upto: 'on' }); A.view('all', 0); }
      else if (state === 'hero') { A.jump({ kind, upto: 'drop', prog: .55 }); A.view('all', 0); ['kno3', 'cu', 'mn', 'paper', 'dish', 'psu'].forEach((n) => (A.labels[n].show = false)); }
      else if (state === 'card') { A.jump({ kind, upto: 'drop', prog: .55 }); Object.values(A.labels).forEach((l) => (l.show = false)); A.view('dish', 0); }
      else { const p = { d0: 0, d1: 1 }[state] || 0; A.jump({ kind, upto: 'drop', prog: p }); Object.values(A.labels).forEach((l) => (l.show = false)); A.labels.pm.show = A.labels.pp.show = true; A.view('dish', 0); }
      window.__TS = .0001;
    };
    go();
    return A;
  }

  return { ION, SOL, ionModel, cell, lab, still, chg };
})();
