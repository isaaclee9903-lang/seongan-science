/* ===== 호흡 운동 모형 3D 도구 BM3 (교과서 213쪽 탐구) =====
   투명 접이식 물통(입구가 아래), 바닥 구멍에 끼운 Y자관, 작은 고무풍선 2개, 고무찰흙, 큰 고무풍선으로 만든 고무 막.
   물통 길이 h(0 눌림 ~ 1 늘임)와 고무 막 d(-1 위로 밀기 ~ 1 아래로 당기기)로 속 공간의 부피가 바뀌고,
   작은 고무풍선은 바뀐 부피만큼 바깥 공기를 받아들이거나 내보낸다. 크기와 빠르기는 잘 보이게 정한 모형이다. */
const BM3 = (() => {
  'use strict';
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const REDUCE = C3.REDUCE;
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const COL = { bottle: '#dfe9f1', ring: '#f4f6f8', tube: '#cfe3ee', balloon: '#d9485a', band: '#c9a227', clay: '#ecd77a', mem: '#1f9a8c', air: '#2f8fe0' };
  const R0 = 3.0, R1 = 2.62, RM = 2.2; // 주름 바깥·안쪽 반지름, 입구 반지름
  const NP = 6; // 주름 수

  function model(host, opt = {}) {
    const st = C3.makeStage(host, { fov: 28, minD: 10, maxD: 60, hold: !!opt.hold, scroll: !!opt.scroll, exposure: .98 });
    st.scene.background = new THREE.Color('#ffffff');
    st.scene.environmentIntensity = .7;
    st.sun.position.set(7, 14, 12); st.sun.castShadow = false;
    const fill = new THREE.DirectionalLight(0xffffff, .5); fill.position.set(-9, 3, 9); st.scene.add(fill);
    st.controls.enableRotate = !!opt.rotate; st.controls.enableZoom = false;
    const root = new THREE.Group(); st.scene.add(root);
    const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .6 }, o));

    /* ----- 물통: 늘이고 누르면 주름 간격이 바뀐다 ----- */
    let h = .5, d = 0; // 지금 값
    const HB = (hh) => lerp(5.6, 8.4, hh); // 물통 높이(입구~바닥)
    const SEG = 72;
    const prof = (hh) => {
      const H = HB(hh), pts = [];
      pts.push([RM, 0], [RM, .42], [RM + .12, .5], [R0 - .1, 1.05]);
      const y0 = 1.15, y1 = H - .75, n = NP * 2;
      for (let i = 0; i <= n; i++) { const y = y0 + (y1 - y0) * i / n; pts.push([i % 2 ? R1 : R0, y]); }
      pts.push([R0 - .25, H - .3], [R0 - .6, H - .05], [1.0, H], [.62, H]);
      return pts;
    };
    const ptsN = prof(.5).length;
    const lat = new THREE.LatheGeometry(prof(.5).map(([r, y]) => new THREE.Vector2(r, y)), SEG);
    const bottleM = mat(COL.bottle, { transparent: true, opacity: .26, roughness: .25, side: THREE.DoubleSide, depthWrite: false });
    const bottle = new THREE.Mesh(lat, bottleM); bottle.renderOrder = 10; root.add(bottle);
    /* 주름 선: 주름의 산과 골에 고리 */
    const ringG = new THREE.Group(); root.add(ringG);
    const ringMat = new THREE.LineBasicMaterial({ color: '#7f95a8', transparent: true, opacity: .8 }), ringMat2 = new THREE.LineBasicMaterial({ color: '#b9c7d3', transparent: true, opacity: .55 });
    const rings = []; for (let i = 0; i < ptsN; i++) { const g = new THREE.BufferGeometry().setFromPoints(Array.from({ length: SEG + 1 }, (_, k) => V(Math.cos(k / SEG * 6.2832), 0, Math.sin(k / SEG * 6.2832)))); const l = new THREE.Line(g, i % 2 ? ringMat2 : ringMat); ringG.add(l); rings.push(l); }
    /* 입구 테두리(단단한 고리) */
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(RM + .05, .12, 12, 64), mat(COL.ring, { roughness: .4 })); mouth.rotation.x = Math.PI / 2; mouth.position.y = .42; root.add(mouth);
    const setBottle = () => {
      const pr = prof(h), P = lat.attributes.position;
      for (let s = 0; s <= SEG; s++) { const a = s / SEG * Math.PI * 2, c = Math.cos(a), si = Math.sin(a); for (let j = 0; j < pr.length; j++) { const k = s * pr.length + j; P.setXYZ(k, pr[j][0] * si, pr[j][1], pr[j][0] * c); } }
      P.needsUpdate = true; lat.computeVertexNormals();
      pr.forEach(([r, y], j) => { rings[j].position.y = y; rings[j].scale.set(r, 1, r); rings[j].visible = j >= 3 && j < pr.length - 1; });
    };

    /* ----- Y자관 ----- */
    const tubeM = mat(COL.tube, { transparent: true, opacity: .62, roughness: .2 });
    const yGrp = new THREE.Group(); root.add(yGrp);
    const STEM = [V(0, 2.2, 0), V(0, 0, 0)], ARM = (s) => [V(0, 0, 0), V(s * .35, -.55, 0), V(s * 1.0, -1.25, 0), V(s * 1.18, -1.75, 0)];
    const stem = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(STEM), 8, .2, 14), tubeM); yGrp.add(stem);
    const armC = [-1, 1].map((s) => new THREE.CatmullRomCurve3(ARM(s)));
    armC.forEach((c) => yGrp.add(new THREE.Mesh(new THREE.TubeGeometry(c, 24, .18, 12), tubeM)));
    const tip = (s) => ARM(s)[3];
    /* ----- 작은 고무풍선: 목은 관 끝에, 몸통은 아래로 ----- */
    const balloonProf = (() => { const p = []; for (let i = 0; i <= 28; i++) { const t = i / 28, y = -t * 2.2; const r = t < .12 ? lerp(.2, .24, t / .12) : .24 + .66 * Math.pow(Math.sin(Math.PI * Math.pow((t - .12) / .88, .75)), .85); p.push(new THREE.Vector2(Math.max(.001, r), y)); } return p; })();
    const balG = new THREE.LatheGeometry(balloonProf, 36);
    const balM = mat(COL.balloon, { roughness: .5, transparent: true, opacity: .92 });
    const bals = [-1, 1].map((s) => { const g = new THREE.Group(); const m = new THREE.Mesh(balG, balM); g.add(m); const band = new THREE.Mesh(new THREE.TorusGeometry(.27, .06, 8, 24), mat(COL.band, { roughness: .5 })); band.rotation.x = Math.PI / 2; band.position.y = -.12; g.add(band); g.position.copy(tip(s)).add(V(0, .25, 0)); g.rotation.z = s * .18; yGrp.add(g); return { g, m, band, s }; });
    /* ----- 고무찰흙 ----- */
    const clayG = new THREE.TorusGeometry(.48, .3, 14, 28); { const P = clayG.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); const n = 1 + .08 * Math.sin(x * 5 + y * 3) + .06 * Math.cos(z * 7); P.setXYZ(i, x * n, y * n, z * n * 1.25); } clayG.computeVertexNormals(); }
    const clay = new THREE.Mesh(clayG, mat(COL.clay, { roughness: .95 })); clay.rotation.x = Math.PI / 2; root.add(clay);
    /* ----- 고무 막: 입구를 덮고 가운데 매듭을 잡아 당기거나 민다 ----- */
    const memG = new THREE.CircleGeometry(RM + .1, 64, 0, Math.PI * 2); memG.rotateX(Math.PI / 2); { const P = memG.attributes.position; const n = P.count; const base = new Float32Array(n * 3); for (let i = 0; i < n * 3; i++) base[i] = P.array[i]; memG.userData.base = base; }
    const memSeg = new THREE.CylinderGeometry(RM + .1, RM + .1, .4, 64, 1, true); // 입구를 감싼 부분
    const memM = mat(COL.mem, { roughness: .55, side: THREE.DoubleSide, transparent: true, opacity: .96 });
    const mem = new THREE.Mesh(memG, memM); root.add(mem);
    const memWrap = new THREE.Mesh(memSeg, memM); memWrap.position.y = .22; root.add(memWrap);
    const knot = new THREE.Group(); const kn1 = new THREE.Mesh(new THREE.SphereGeometry(.24, 16, 12), memM); const kn2 = new THREE.Mesh(new THREE.CylinderGeometry(.13, .2, .55, 14), memM); kn2.position.y = -.35; knot.add(kn1, kn2); root.add(knot);
    const DM = 2.1; // 막이 움직이는 거리
    const setMem = () => {
      const P = memG.attributes.position, B = memG.userData.base, R = RM + .1;
      for (let i = 0; i < P.count; i++) { const x = B[i * 3], z = B[i * 3 + 2], r = Math.hypot(x, z) / R; const w = Math.pow(Math.max(0, 1 - r * r), 1.15); P.setXYZ(i, x, -d * DM * w + .02, z); }
      P.needsUpdate = true; memG.computeVertexNormals(); knot.position.y = -d * DM - .05;
    };

    /* ----- 부피와 풍선 ----- */
    const vol = () => (HB(h) - 5.6) / 2.8 * .55 + d * .45; // -0.45 ~ 1 사이의 상대 부피
    let bv = 0, bvShow = -1; // 풍선 부풀기 0~1
    const setBal = () => {
      const k = Math.max(0, Math.min(1, bv)), s = lerp(.42, 1.08, Math.pow(k, .8)), sy = lerp(1.25, 1.02, k);
      bals.forEach((b) => { b.m.scale.set(s, s * sy, s); });
    };

    /* ----- 공기 알갱이: 관 위 구멍 ↔ 풍선 속 ----- */
    const NA = 46, aim = new THREE.InstancedMesh(new THREE.SphereGeometry(.09, 10, 8), mat(COL.air, { roughness: .4, transparent: true, depthTest: false }), NA); aim.renderOrder = 40; aim.frustumCulled = false; yGrp.add(aim);
    const pathFor = (s) => { const pts = [V(0, 3.1, 0), V(0, 2.2, 0), V(0, 0, 0)].concat(ARM(s).slice(1)); return new THREE.CatmullRomCurve3(pts); };
    const pth = [pathFor(-1), pathFor(1)];
    const AIR = Array.from({ length: NA }, (_, i) => ({ s: i % 2, u: Math.random(), j: V(rnd(-1, 1), rnd(-.4, -1), rnd(-1, 1)), sp: rnd(.8, 1.2) }));
    const dum = new THREE.Object3D(), tp = V();

    /* ----- 만들기 단계(활동하기 1~3): 0 재료 · 1 풍선 끼움 · 2 물통에 끼움 · 3 고무 막 · 4 완성 ----- */
    let build = opt.build === undefined ? 4 : opt.build, bt = 1;
    const place = () => {
      const H = HB(h), e = REDUCE ? 1 : (.5 - .5 * Math.cos(Math.min(1, bt) * Math.PI));
      const top = H; const yIn = top - 1.2; // Y자관 갈라지는 곳
      /* 1: 풍선이 관 끝으로 올라와 끼워진다 */
      const b1 = build > 1 ? 1 : build === 1 ? e : 0;
      bals.forEach((b) => { b.g.position.copy(tip(b.s)).add(V(b.s * (1 - b1) * 1.6, .25 - (1 - b1) * 1.2, 0)); b.band.visible = b1 > .92; });
      /* 2: Y자관이 물통 바닥 구멍으로 들어가고 고무찰흙이 막는다 */
      const b2 = build > 2 ? 1 : build === 2 ? e : 0;
      const outside = V(4.6, H - 1.8, .6), inside = V(0, yIn, 0);
      yGrp.position.lerpVectors(outside, inside, b2 < .5 ? 0 : smooth(.5, 1, b2));
      if (b2 < .5) yGrp.position.y = lerp(H - 1.8, H + 2.6, smooth(0, .5, b2)), yGrp.position.x = lerp(4.6, 0, smooth(0, .5, b2)), yGrp.position.z = lerp(.6, 0, smooth(0, .5, b2));
      const showB = build >= 2; bottle.visible = ringG.visible = mouth.visible = showB; bottle.material.opacity = .26 * (build === 2 ? Math.min(1, e * 3) : 1);
      clay.visible = build > 2 || (build === 2 && e > .85); clay.position.y = H + .08; clay.scale.setScalar(build === 2 ? smooth(.85, 1, e) : 1);
      /* 3: 고무 막이 입구를 덮는다 */
      const b3 = build > 3 ? 1 : build === 3 ? e : 0;
      mem.visible = memWrap.visible = knot.visible = b3 > 0; mem.position.y = memWrap.position.y = knot.position.y = 0; root.userData.memY = -(1 - b3) * 2.6;
      mem.position.y = root.userData.memY; memWrap.position.y = .22 + root.userData.memY; knot.position.y += root.userData.memY;
      memWrap.scale.set(1, b3, 1);
    };

    /* ----- 이름표 ----- */
    const lab = CH3.labels(st);
    const H0 = () => HB(h);
    lab.add('bot', '투명 접이식 물통', () => V(R0, H0() * .62, 0), .78, .3, 'b', { px: .8, py: .26 });
    lab.add('yt', 'Y자관', () => V(-.15, -.4, 0).add(yGrp.position), .2, .13, 'b', { px: .16, py: .12 });
    lab.add('bal', '작은 고무풍선', () => bals[0].g.position.clone().add(yGrp.position).add(V(-.5, -1.1, .3)), .2, .42, 'b', { px: .16, py: .42 });
    lab.add('clay', '고무찰흙', () => V(.5, H0() + .1, .3), .78, .1, 'b', { px: .8, py: .07 });
    lab.add('mem', '고무 막', () => V(1.2, -d * DM * .6 + .1, 1.6), .78, .82, 'b', { px: .8, py: .84 });
    lab.add('band', '고무줄', () => bals[1].g.position.clone().add(yGrp.position).add(V(.1, -.1, .2)), .78, .5, '', { px: .8, py: .5 });
    /* 사람 몸에 견주면 */
    const BODY = { bot: '물통 주름<small>갈비뼈</small>', yt: 'Y자관<small>숨관·숨관가지</small>', bal: '작은 고무풍선<small>폐</small>', mem: '고무 막<small>가로막</small>', cav: '물통 속 공간<small>흉강</small>' };
    lab.add('cav', '물통 속 공간', () => V(-1.6, H0() * .32, .6), .2, .68, 'b', { px: .16, py: .68 });
    const showLabs = (keys, body) => { Object.entries(lab.L).forEach(([k, a]) => { a.e.innerHTML = body && BODY[k] ? BODY[k] : ({ bot: '투명 접이식 물통', yt: 'Y자관', bal: '작은 고무풍선', clay: '고무찰흙', mem: '고무 막', band: '고무줄', cav: '물통 속 공간' })[k]; }); lab.only(keys); };

    /* ----- 시점 ----- */
    const bx = new THREE.Mesh(new THREE.BoxGeometry(7.4, 13.2, 3)); bx.position.set(0, 3.7, 0); bx.visible = false; st.scene.add(bx);
    const fitView = () => st.fit([bx], { dir: V(.12, .22, 1), margin: 1.04, dur: 0, target: bx.position.clone() });
    fitView();
    /* 그림자 */
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ map: C3.blobTex(), transparent: true, depthWrite: false, opacity: .55 })); sh.rotation.x = -Math.PI / 2; sh.position.y = -3.1; root.add(sh);

    /* ----- 시간 ----- */
    const clk = { dt: 0, last: 0 };
    st.onFrame((dd) => { if (window.__bakeT !== undefined) { const n = window.__bakeT; clk.dt = Math.max(0, n - clk.last); clk.last = n; } else clk.dt = dd; });
    let tgt = null, onChange = null, lastV = vol(), flow = 0;
    st.onFrame(() => {
      const dt = clk.dt;
      if (bt < 1) { bt = Math.min(1, bt + dt / (build === 2 ? 2.6 : 1.8)); if (bt >= 1 && build_cb) { const c = build_cb; build_cb = null; c(); } }
      if (tgt) { tgt.t = Math.min(1, tgt.t + (REDUCE ? 1 : dt / tgt.dur)); const e = .5 - .5 * Math.cos(tgt.t * Math.PI); h = lerp(tgt.h0, tgt.h1, e); d = lerp(tgt.d0, tgt.d1, e); if (tgt.t >= 1) { const c = tgt.cb; tgt = null; c && c(); } }
      setBottle(); place(); setMem();
      /* 풍선은 속 공간 부피를 따라 늦지 않게 */
      const v = vol(), target = Math.max(0, Math.min(1, (v + .45) / 1.45));
      const bv0 = bv; bv += (target - bv) * Math.min(1, dt * 7); flow = dt > 0 ? (bv - bv0) / dt : 0; lastV = v;
      if (Math.abs(bv - bvShow) > 1e-4) { setBal(); bvShow = bv; }
      onChange && onChange({ h, d, bv, flow });
      const s = Math.min(1, Math.abs(flow) * 2.2);
      AIR.forEach((a, i) => {
        if (s > .02) { a.u += (flow > 0 ? 1 : -1) * dt * (.35 + Math.abs(flow) * .9) * a.sp; }
        if (a.u > 1.25) a.u = flow > 0 ? rnd(0, .04) : a.u; if (a.u < 0) a.u = 1.25 - rnd(0, .05);
        pth[a.s].getPoint(Math.min(1, a.u), tp); if (a.u > 1) { const k = (a.u - 1) / .25, sc = bals[a.s].m.scale.x; tp.add(V(a.j.x * .5 * sc * k, a.j.y * 1.1 * sc * k, a.j.z * .5 * sc * k)); }
        const vis = s > .02 && build >= 4; const f = Math.min(1, a.u / .08, (1.25 - a.u) / .1);
        dum.position.copy(tp); dum.scale.setScalar(vis ? Math.max(0, f) * Math.min(1, s * 2 + .3) : 0); dum.updateMatrix(); aim.setMatrixAt(i, dum.matrix);
      });
      aim.instanceMatrix.needsUpdate = true;
    });
    let build_cb = null;
    setBottle(); place(); setMem(); setBal();

    /* ----- 손가락으로 끌기: 매듭 근처는 고무 막, 물통 윗부분은 물통 ----- */
    let drag = null; const pp = V();
    const scr = (p) => { pp.copy(p).project(st.camera); const { W, H } = st.size(); return [(pp.x + 1) / 2 * W, (1 - pp.y) / 2 * H]; };
    const el = st.renderer.domElement; el.style.touchAction = opt.scroll ? 'pan-y' : 'none';
    const unitPx = () => { const a = scr(V(0, 0, 0)), b = scr(V(0, 1, 0)); return Math.abs(a[1] - b[1]) || 30; };
    el.addEventListener('pointerdown', (ev) => {
      if (build < 4 || !opt.drag) return; const r = el.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
      const k = scr(knot.getWorldPosition(V())), t = scr(V(0, HB(h), 0));
      const dk = Math.hypot(x - k[0], y - k[1]), dtp = Math.hypot(x - t[0], y - t[1]);
      if (dk < 80 && dk <= dtp) drag = { what: 'd', y, v: d }; else if (dtp < 110 || (y < t[1] + 40)) drag = { what: 'h', y, v: h }; else return;
      tgt = null; el.setPointerCapture(ev.pointerId); ev.preventDefault();
    });
    el.addEventListener('pointermove', (ev) => { if (!drag) return; const r = el.getBoundingClientRect(), y = ev.clientY - r.top, u = unitPx(); if (drag.what === 'd') d = Math.max(-1, Math.min(1, drag.v + (y - drag.y) / (u * DM))); else h = Math.max(0, Math.min(1, drag.v - (y - drag.y) / (u * 2.8))); });
    const end = () => { if (drag) { drag = null; dragEnd && dragEnd({ h, d }); } };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    let dragEnd = null;

    const api = {};
    Object.defineProperties(api, Object.getOwnPropertyDescriptors({
      st, lab, showLabs,
      get h() { return h; }, get d() { return d; }, get bv() { return bv; }, get build() { return build; },
      set(hh, dd) { tgt = null; h = hh; d = dd; },
      to(hh, dd, dur, cb) { tgt = { h0: h, d0: d, h1: hh, d1: dd, t: 0, dur: dur || 2, cb }; },
      ga(cb) { api.to(1, 1, 2.2, cb); }, na(cb) { api.to(0, -1, 2.2, cb); }, rest(cb) { api.to(.5, 0, 1.2, cb); },
      setBuild(n, animate, cb) { build = n; bt = animate ? 0 : 1; build_cb = cb || null; if (!animate && cb) cb(); },
      onChange(f) { onChange = f; }, onDragEnd(f) { dragEnd = f; },
      fitView,
    }));
    return api;
  }
  return { model };
})();
window.BM3 = BM3;
