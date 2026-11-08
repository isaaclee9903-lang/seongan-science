/* ===== 배설계 3D 도구 EX3 =====
   콩팥·오줌관·방광·요도·혈관·간·심장·뼈: BodyParts3D 4.0(CC BY 4.0), 콩팥 속: HuBMAP CCF 3D Reference Object Library(CC BY 4.0). media/ATTRIBUTION.txt
   EX3.body: 몸속 배설계(혈액·오줌 흐름, 따라가기, 왼쪽 콩팥 자르기), EX3.nephron: 네프론(토리·보먼주머니·세뇨관·모세혈관, 여과·재흡수·분비).
   알갱이의 크기·수·빠르기, 네프론의 굵기와 감긴 모양은 잘 보이게 정한 모형이다. C3와 같은 모듈 안에 넣는다. */
const EX3 = (() => {
  'use strict';
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const REDUCE = C3.REDUCE;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const COL = { bone: '#e4d9c2', liver: '#8f3e2e', heart: '#bf4d40', art: '#cf3b2f', vein: '#4d6fb3', kid: '#a9473e', ure: '#e8cf93', blad: '#e8c8a0', cor: '#b8574a', col: '#bf6453', pyr: '#93363a', pap: '#a8463f', hil: '#efd690', cap: '#a94c41', rbc: '#d23a2c', urea: '#f08a1c', uri: '#f2c230' };

  let dataP = null;
  function data() {
    if (dataP) return dataP;
    dataP = Promise.all([fetch('media/ex.json').then((r) => r.json()), fetch('media/ex.bin').then((r) => r.arrayBuffer())]).then(([m, b]) => {
      const n = m.counts[0], pos = new Int16Array(b, 0, n * 3), nor = new Int16Array(b, n * 6, n * 3), idx = new Uint32Array(b, m.iOff, m.counts[1]);
      const pa = new THREE.BufferAttribute(pos, 3, true), na = new THREE.BufferAttribute(nor, 3, true);
      const geo = (ranges) => { let c = 0; ranges.forEach((r) => { c += r[1]; }); const ix = new Uint32Array(c); let o = 0; ranges.forEach((r) => { ix.set(idx.subarray(r[0], r[0] + r[1]), o); o += r[1]; }); const G = new THREE.BufferGeometry(); G.setAttribute('position', pa); G.setAttribute('normal', na); G.setIndex(new THREE.BufferAttribute(ix, 1)); return G; };
      return { m, geo };
    });
    return dataP;
  }

  /* 이름표: 3D 위치에서 칸 비율 (x,y)의 글자까지 얇은 선 (CH3와 같은 모양) */
  (function css() { const c = document.createElement('style'); c.textContent = '.hl{position:absolute;left:0;top:0;z-index:4;font:700 clamp(13px,1.25vw,16px)/1.2 Pretendard,sans-serif;color:#14263b;white-space:nowrap;pointer-events:none;background:rgba(255,255,255,.88);padding:2px 7px;border-radius:6px}.hl.b{font-weight:800;font-size:clamp(14px,1.45vw,18px)}.hl small{display:block;font-size:.76em;font-weight:700;color:#5a6b7e;margin-top:1px}.hl.on{color:#0e63b3}.hl.cap3{font-size:clamp(13px,1.2vw,15px);font-weight:800;color:#0b3f73;background:rgba(255,255,255,.94);border:1px solid #d6e5f5}'; document.head.appendChild(c); })();
  function labels(st) {
    const host = st.host, ov = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ov.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3'); host.appendChild(ov);
    const L = {}, p = V();
    st.onFrame(() => {
      const { W, H } = st.size();
      Object.values(L).forEach((a) => {
        const on = a.show; a.e.style.display = on ? '' : 'none'; a.ln.style.display = on && a.at ? '' : 'none'; if (!on) return;
        const port = H > W * 1.02, xx = port && a.px !== undefined ? a.px : a.x, yy = port && a.py !== undefined ? a.py : a.y;
        const ax = xx < .5 ? '-100%' : '0', tx = xx * W, ty = yy * H; a.e.style.transform = `translate(${tx}px,${ty}px) translate(${a.c ? '-50%' : ax},-50%)`;
        if (!a.at) return; p.copy(typeof a.at === 'function' ? a.at() : a.at).project(st.camera);
        a.ln.setAttribute('x1', (p.x + 1) / 2 * W); a.ln.setAttribute('y1', (1 - p.y) / 2 * H); a.ln.setAttribute('x2', tx + (a.c ? 0 : xx < .5 ? 4 : -4)); a.ln.setAttribute('y2', ty + (a.c ? (yy < .5 ? 12 : -12) : 0));
      });
    });
    const add = (k, t, at, x, y, cls = '', extra = {}) => { const e = document.createElement('div'); e.className = 'hl ' + cls; e.innerHTML = t; host.appendChild(e); const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line'); ln.setAttribute('stroke', '#14263b'); ln.setAttribute('stroke-width', '1'); ov.appendChild(ln); L[k] = Object.assign({ e, ln, at, x, y, show: false }, extra); return L[k]; };
    const only = (keys) => { Object.entries(L).forEach(([k, a]) => { a.show = keys.includes(k); }); };
    const place = (P) => { Object.entries(P).forEach(([k, a]) => { const l = L[k]; if (!l) return; [l.x, l.y] = a; l.px = a[2] !== undefined ? a[2] : a[0]; l.py = a[3] !== undefined ? a[3] : a[1]; }); };
    return { add, only, place, L };
  }

  class Path {
    constructor(pts) { this.p = pts; this.c = new Float32Array(pts.length); for (let i = 1; i < pts.length; i++) this.c[i] = this.c[i - 1] + pts[i].distanceTo(pts[i - 1]); this.len = this.c[pts.length - 1] || 1; }
    at(u, out = V()) { const s = Math.max(0, Math.min(1, u)) * this.len, c = this.c; let a = 0, b = c.length - 1; while (b - a > 1) { const m = (a + b) >> 1; if (c[m] <= s) a = m; else b = m; } const t = (s - c[a]) / Math.max(1e-6, c[b] - c[a]); return out.lerpVectors(this.p[a], this.p[b], t); }
  }

  /* 무대 공통: 흰 바탕, 부드러운 빛 세 개, 돌리는 영상이면 빛도 함께 돈다 */
  function baseStage(host, opt) {
    const st = C3.makeStage(host, { fov: opt.fov || 30, minD: opt.minD || 4, maxD: opt.maxD || 140, hold: !!opt.hold, scroll: !!opt.scroll, exposure: .95, sunX: 6, sunZ: 9 });
    st.renderer.localClippingEnabled = true;
    st.scene.environmentIntensity = .55; st.scene.traverse((o) => { if (o.isHemisphereLight) o.intensity = .45; });
    st.scene.background = new THREE.Color('#ffffff');
    st.camera.far = 600; st.camera.updateProjectionMatrix();
    st.sun.position.set(9, 14, 16); st.sun.castShadow = false;
    const fill = new THREE.DirectionalLight(0xffffff, .55); fill.position.set(-10, 4, 8); st.scene.add(fill);
    const back = new THREE.DirectionalLight(0xfff2ea, .4); back.position.set(0, 6, -14); st.scene.add(back);
    const clk = { dt: 0, last: 0 };
    st.onFrame((d) => { if (window.__bakeT !== undefined) { const n = window.__bakeT; clk.dt = Math.max(0, n - clk.last); clk.last = n; } else clk.dt = d; });
    const spinRig = { on: false };
    st.onFrame(() => { if (!spinRig.on) return; const T = window.__bakeT || 0, a = spinRig.a0 + T / spinRig.T * Math.PI * 2 * spinRig.turn; const t = st.controls.target; st.camera.position.set(t.x + Math.sin(a) * spinRig.d, t.y + spinRig.dy, t.z + Math.cos(a) * spinRig.d); [st.sun, fill, back].forEach((o) => { if (!o.userData.p0) o.userData.p0 = o.position.clone(); o.position.copy(o.userData.p0).applyAxisAngle(V(0, 1, 0), a - spinRig.a0); }); });
    const spin = (T, turn = 1, a0) => { const t = st.controls.target, dx = st.camera.position.x - t.x, dz = st.camera.position.z - t.z; spinRig.on = true; spinRig.T = T; spinRig.turn = turn; spinRig.a0 = a0 === undefined ? Math.atan2(dx, dz) : a0; spinRig.d = Math.hypot(dx, dz); spinRig.dy = st.camera.position.y - t.y; };
    return { st, clk, spin };
  }
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .76, metalness: 0 }, o));

  /* ===================== 몸속 배설계 ===================== */
  async function body(host, opt = {}) {
    const D = await data(), M = D.m, G = M.groups, KI = M.kin;
    const { st, clk, spin } = baseStage(host, opt);
    const K = M.K, root = new THREE.Group(); st.scene.add(root);
    const parts = {};
    const stat = (k, ranges, m) => { const me = new THREE.Mesh(D.geo(ranges), m); me.scale.setScalar(K); me.frustumCulled = false; root.add(me); parts[k] = me; return me; };
    const boneM = mat(COL.bone, { roughness: .9 });
    stat('spine', [G.spine], boneM); stat('hip', [G.hip], boneM); stat('rib', [G.rib], boneM);
    stat('liver', [G.liver], mat(COL.liver, { roughness: .55, transparent: true, opacity: .9 }));
    stat('heart', [G.heart], mat(COL.heart, { roughness: .6 }));
    const artM = mat(COL.art, { roughness: .5 }), veinM = mat(COL.vein, { roughness: .5 });
    stat('aorta', [G.aorta], artM); stat('rart', [G.rart], artM);
    stat('ivc', [G.ivc], veinM); stat('rvein', [G.rvein], veinM);
    const kidM = mat(COL.kid, { roughness: .58 });
    stat('kidL', [G.kidL], kidM); stat('kidR', [G.kidR], kidM.clone());
    const ureM = mat(COL.ure, { roughness: .62 });
    stat('ureL', [G.ureL], ureM); stat('ureR', [G.ureR], ureM);
    const bladM = mat(COL.blad, { roughness: .6 });
    stat('ureth', [G.ureth], ureM);
    /* 방광은 아래쪽을 기준으로 부풀릴 수 있게 따로 */
    const bl = new THREE.Mesh(D.geo([G.blad]), bladM); bl.frustumCulled = false; bl.geometry.computeBoundingBox();
    const bb = bl.geometry.boundingBox, bc = V((bb.min.x + bb.max.x) / 2 * K, bb.min.y * K, (bb.min.z + bb.max.z) / 2 * K);
    const blG = new THREE.Group(); blG.position.copy(bc); bl.scale.setScalar(K); bl.position.copy(bc).multiplyScalar(-1); blG.add(bl); root.add(blG); parts.blad = bl;

    /* ----- 왼쪽 콩팥 속: 자른 면은 스텐실로 꽉 찬 면을 그린다 ----- */
    const kL = V(...M.pts.kL), nL = V(...M.pts.nL).normalize();
    const cutP = new THREE.Plane(nL.clone().negate(), nL.dot(kL));
    const kin = new THREE.Group(); kin.visible = false; root.add(kin);
    const capPlaneG = new THREE.PlaneGeometry(9, 9);
    const capQ = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), nL);
    let ro = 50;
    const solid = (key, color, cutColor, rough = .7) => {
      const geo = D.geo([KI[key]]), base = ro; ro += 4;
      const sm1 = new THREE.MeshBasicMaterial({ side: THREE.BackSide, clippingPlanes: [cutP], depthWrite: false, depthTest: false, colorWrite: false, stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc, stencilFail: THREE.IncrementWrapStencilOp, stencilZFail: THREE.IncrementWrapStencilOp, stencilZPass: THREE.IncrementWrapStencilOp });
      const sm2 = new THREE.MeshBasicMaterial({ side: THREE.FrontSide, clippingPlanes: [cutP], depthWrite: false, depthTest: false, colorWrite: false, stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc, stencilFail: THREE.DecrementWrapStencilOp, stencilZFail: THREE.DecrementWrapStencilOp, stencilZPass: THREE.DecrementWrapStencilOp });
      const s1 = new THREE.Mesh(geo, sm1), s2 = new THREE.Mesh(geo, sm2); [s1, s2].forEach((m) => { m.scale.setScalar(K); m.renderOrder = base; m.frustumCulled = false; kin.add(m); });
      const capM = mat(cutColor, { roughness: .9, envMapIntensity: .35, stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc, stencilFail: THREE.ReplaceStencilOp, stencilZFail: THREE.ReplaceStencilOp, stencilZPass: THREE.ReplaceStencilOp, polygonOffset: true, polygonOffsetFactor: -1 - base / 50, polygonOffsetUnits: -4 - base / 10 });
      const cap = new THREE.Mesh(capPlaneG, capM); cap.quaternion.copy(capQ); cap.position.copy(kL).addScaledVector(nL, 0); cap.renderOrder = base + 1.1; cap.onAfterRender = (r) => r.clearStencil(); kin.add(cap);
      const outer = new THREE.Mesh(geo, mat(color, { roughness: rough, clippingPlanes: [cutP], clipShadows: true })); outer.scale.setScalar(K); outer.renderOrder = base + 2; outer.frustumCulled = false; kin.add(outer);
      return { s1, s2, cap, outer };
    };
    /* 겉부터 차례로: 겉질 → 콩팥 기둥 → 콩팥 피라미드 → 유두 → 콩팥깔때기(콩팥문) */
    const KP = { cor: solid('cor', COL.cap, COL.cor), col: solid('col', COL.col, COL.col), pyr: solid('pyr', COL.pyr, COL.pyr), pap: solid('pap', COL.pap, COL.pap), hil: solid('hil', COL.hil, COL.hil, .6) };
    /* 피라미드 자른 면에 가는 줄무늬(세뇨관 다발 느낌) */
    { const tex = C3.canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#8c3236'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,200,190,.3)'; g.lineWidth = 2.2; for (let x = -w; x < w * 2; x += 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w * .35, h); g.stroke(); } }); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(4, 4); KP.pyr.cap.material.map = tex; KP.pyr.cap.material.color.set('#ffffff'); KP.pyr.cap.material.roughness = .9; }

    /* ----- 흐르는 알갱이 ----- */
    const R = M.routes, mk = (k) => new Path(R[k].map((q) => V(...q)));
    const PA = { artL: mk('artL'), artR: mk('artR'), venL: mk('venL'), venR: mk('venR'), uriL: mk('uriL'), uriR: mk('uriR') };
    const disc = new THREE.SphereGeometry(.15, 14, 10); disc.scale(1, .42, 1);
    const NB = 90, NU = 60, NW = 50;
    const rbcM = mat(COL.rbc, { roughness: .45, depthTest: false, transparent: true });
    const rbcV = mat('#9b2a3a', { roughness: .45, depthTest: false, transparent: true });
    const ib = new THREE.InstancedMesh(disc, rbcM, NB), iv = new THREE.InstancedMesh(disc, rbcV, NB), iu = new THREE.InstancedMesh(new THREE.SphereGeometry(.12, 12, 9), mat(COL.uri, { roughness: .35, depthTest: false, transparent: true }), NU), iw = new THREE.InstancedMesh(new THREE.BoxGeometry(.15, .15, .15), mat(COL.urea, { roughness: .5, depthTest: false, transparent: true }), NW);
    [ib, iv, iu, iw].forEach((m, i) => { m.renderOrder = 120 + i; m.frustumCulled = false; root.add(m); });
    const mkA = (n, keys) => Array.from({ length: n }, (_, i) => ({ k: keys[i % keys.length], u: Math.random(), sp: rnd(.8, 1.2), j: V(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(0, .12)), r: V(rnd(0, 6), rnd(0, 6), 0) }));
    const AB = mkA(NB, ['artL', 'artR']), AV = mkA(NB, ['venL', 'venR']), AU = mkA(NU, ['uriL', 'uriR']), AW = mkA(NW, ['artL', 'artR']);
    const flow = { blood: false, urine: false, urea: false, speed: 1 };
    const dum = new THREE.Object3D(), tp = V();
    const draw = (im, arr, on, sc, spinOn) => {
      arr.forEach((a, i) => {
        if (on) a.u += clk.dt * .085 * flow.speed * a.sp * (PA[a.k].len > 30 ? .7 : 1);
        if (a.u > 1) a.u -= 1;
        PA[a.k].at(a.u, tp).add(a.j);
        const fade = Math.min(1, a.u / .04, (1 - a.u) / .04);
        dum.position.copy(tp); if (spinOn) { a.r.x += clk.dt * 2; dum.rotation.set(a.r.x, a.r.y, 0); }
        dum.scale.setScalar(on ? Math.max(0, fade) * sc : 0); dum.updateMatrix(); im.setMatrixAt(i, dum.matrix);
      });
      im.instanceMatrix.needsUpdate = true;
    };
    /* 요소: 콩팥동맥을 따라 들어와 콩팥에서 오줌 길로 넘어간다 */
    const ureaU = (a) => a.u;
    void ureaU;

    /* ----- 따라가기 ----- */
    const mark = new THREE.Mesh(new THREE.SphereGeometry(.34, 20, 14), mat('#ffffff', { roughness: .4, depthTest: false, transparent: true, opacity: .95 }));
    const markIn = new THREE.Mesh(disc, mat(COL.rbc, { depthTest: false, transparent: true })); markIn.scale.setScalar(1.6);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.42, .045, 8, 36), new THREE.MeshBasicMaterial({ color: '#0e63b3', depthTest: false, transparent: true }));
    const MK = new THREE.Group(); MK.add(ring, markIn); MK.visible = false; MK.renderOrder = 200; [ring, markIn].forEach((m) => { m.renderOrder = 201; }); root.add(MK); void mark;
    let tour = null, onTour = null;
    /* 피가 지나는 곳의 이름을 길의 비율로 */
    const TOURS = {
      blood: { legs: [['artL', ['심장에서 나온 혈액', '대동맥', '콩팥동맥', '콩팥']], ['venL', ['콩팥', '콩팥정맥', '대정맥', '다시 심장으로']]], col: [COL.rbc, '#9b2a3a'] },
      urine: { legs: [['uriL', ['콩팥깔때기', '오줌관', '방광', '요도']]], col: [COL.uri] },
    };
    const hLv = V(...M.pts.hL), wq = V();
    const where = (leg, u) => { const p = PA[leg].at(u, wq); const dh = p.distanceTo(hLv);
      if (leg.startsWith('art')) return dh < .7 ? 3 : Math.abs(p.x) > .75 ? 2 : u < .06 ? 0 : 1;
      if (leg.startsWith('ven')) return u > .97 ? 3 : dh < .7 && u < .3 ? 0 : Math.abs(p.x + .55) < .5 ? 2 : 1;
      return dh < .55 && u < .2 ? 0 : p.y > bc.y + 1.9 ? 1 : p.y > bc.y - .15 ? 2 : 3; };

    /* ----- 이름표 ----- */
    const lab = labels(st);
    const mid = (k, u) => () => PA[k].at(u, V());
    const kR = V(...M.pts.kR), hL = V(...M.pts.hL);
    lab.add('kid', '콩팥<small>오줌이 만들어지는 곳</small>', () => kL.clone().add(V(.9, .3, 0)), .78, .3, 'b');
    lab.add('kidR', '콩팥', () => kR.clone().add(V(-.9, .3, 0)), .1, .34, 'b');
    lab.add('ure', '오줌관<small>콩팥과 방광을 연결하는 긴 관</small>', mid('uriL', .45), .78, .54, 'b');
    lab.add('blad', '방광<small>오줌을 모아 두는 곳</small>', () => bc.clone().add(V(.6, 2.1, .9)), .78, .74, 'b');
    lab.add('ureth', '요도<small>오줌이 몸 밖으로 나가는 통로</small>', () => PA.uriL.at(.99, V()), .78, .92, 'b');
    lab.add('ra', '콩팥동맥<small>콩팥으로 들어오는 혈액</small>', () => { let b = PA.artL.p[0], d = 1e9; PA.artL.p.forEach((q) => { const e = Math.abs(q.x - 1.15) + (q.y < 1 ? 9 : 0); if (e < d) { d = e; b = q; } }); return b.clone(); }, .26, .5, 'b');
    lab.add('rv', '콩팥정맥<small>콩팥에서 나가는 혈액</small>', () => { const p = PA.venR; return p.at(.2, V()); }, .26, .64, 'b');
    lab.add('ao', '대동맥', () => PA.artL.at(.12, V()), .1, .14);
    lab.add('ivc', '대정맥', () => PA.venR.at(.7, V()), .1, .26);
    lab.add('liv', '간', () => V(-2.4, 6.4, 2.2), .1, .1, 'b');
    lab.add('hrt', '심장', () => V(.9, 9.6, 2.2), .9, .08, 'b');
    lab.add('spine', '척추', () => V(0, -1.2, -1.3), .9, .62);
    lab.add('rib', '갈비뼈', () => V(3.4, 3.2, -1.4), .9, .2);
    /* 자른 콩팥 */
        lab.add('kpel', '콩팥깔때기', () => hL.clone().add(V(.15, -.1, .2)), .1, .6, 'b');
    lab.add('kra', '콩팥동맥', () => PA.artL.at(.86, V()), .1, .3, 'b');
    lab.add('krv', '콩팥정맥', () => PA.venL.at(.14, V()), .1, .44, 'b');
    lab.add('kure', '오줌관', () => PA.uriL.at(.17, V()), .1, .8, 'b');
    lab.add('tour', '', () => MK.position, .5, .06, 'cap3', { c: true });

    /* ----- 시점 ----- */
    const box = (x0, x1, y0, y1, z0 = -3, z1 = 3) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0)); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.visible = false; st.scene.add(m); return m; };
    const kb = (s) => { const m = box(kL.x - s, kL.x + s, kL.y - s * 1.25, kL.y + s * 1.25, kL.z - s * .6, kL.z + s * .6); return m; };
    const VIEW = { front: box(-5.2, 5.2, -8.9, 12.6), sys: box(-4.6, 4.6, -8.9, 4.4), back: box(-5.2, 5.2, -9.4, 7), kid: kb(2.8), cut: kb(2.6), waste: box(-5.4, 5.4, -1.5, 11.2), card: box(-5, 5, -8.6, 5.6) };
    const DIR = { front: V(0, .04, 1), sys: V(.14, .06, 1), back: V(0, .1, -1), kid: V(.25, .05, 1), cut: nL.clone().add(V(.1, .05, 0)).normalize(), waste: V(.1, .05, 1), card: V(.42, .12, 1) };
    let curView = 'front';
    const setView = (k, dur = 0) => { curView = k; st.fit([VIEW[k]], { dir: DIR[k], margin: k === 'kid' || k === 'cut' ? 1.08 : 1.02, dur: window.__bakeT !== undefined ? 0 : dur, target: VIEW[k].position.clone() }); };
    setView(opt.view || 'front');

    /* ----- 보이기 ----- */
    const show = (o) => { Object.entries(o).forEach(([k, v]) => { if (parts[k]) parts[k].visible = v; if (k === 'blad') blG.visible = v; }); };
    show({ liver: false, heart: true });
    let cutOn = false;
    const cut = (on) => { cutOn = on; kin.visible = on; parts.kidL.visible = !on; };
    const fade = (keys, op) => { keys.forEach((k) => { const m = parts[k].material; m.transparent = op < 1; m.opacity = op; m.depthWrite = op > .6; m.needsUpdate = true; }); };

    /* ----- 매 장면 ----- */
    let fill = 0, fillTo = 0;
    st.onFrame(() => {
      const dt = clk.dt;
      draw(ib, AB, flow.blood, 1, true); draw(iv, AV, flow.blood, 1, true); draw(iu, AU, flow.urine, 1, false);
      /* 요소: 동맥 길에서만, 콩팥에 들어가면 사라진다 */
      AW.forEach((a, i) => { if (flow.urea) a.u += dt * .085 * flow.speed * a.sp; if (a.u > 1) a.u -= 1; PA[a.k].at(a.u, tp).add(a.j); const f = Math.min(1, a.u / .04, (1 - a.u) / .06); dum.position.copy(tp); dum.rotation.set(a.u * 9, a.u * 7, 0); dum.scale.setScalar(flow.urea ? Math.max(0, f) : 0); dum.updateMatrix(); iw.setMatrixAt(i, dum.matrix); }); iw.instanceMatrix.needsUpdate = true;
      /* 방광 부풀기 */
      fill += (fillTo - fill) * Math.min(1, dt * 1.6); blG.scale.set(1 + fill * .18, 1 + fill * .3, 1 + fill * .18);
      /* 따라가기 */
      if (tour) {
        tour.t += dt * (REDUCE ? 3 : 1); const T = TOURS[tour.k], leg = T.legs[tour.leg], p = PA[tour.side ? leg[0].replace('L', tour.side) : leg[0]];
        const u = Math.min(1, tour.t / tour.dur); p.at(u, MK.position); MK.visible = true; ring.lookAt(st.camera.position);
        markIn.material.color.set(T.col[Math.min(tour.leg, T.col.length - 1)]); markIn.rotation.x += dt * 2;
        const wi = where(leg[0], u), name = leg[1][wi];
        if (tour.k === 'urine') fillTo = wi === 2 && u > .75 ? 1 : wi === 3 ? Math.max(0, 1 - (u - .93) * 12) : fillTo;
        if (name !== tour.name) { tour.name = name; lab.L.tour.e.textContent = name; onTour && onTour(tour.k, tour.leg, wi, name); }
        if (u >= 1) { if (tour.leg < T.legs.length - 1) { tour.leg++; tour.t = 0; tour.dur = tour.durs[tour.leg]; } else { const k = tour.k; tour = null; MK.visible = false; lab.L.tour.show = false; if (k === 'urine') fillTo = 0; onTour && onTour(k, -1, -1, ''); } }
      }
    });

    const api = {};
    Object.defineProperties(api, Object.getOwnPropertyDescriptors({
      st, parts, lab, VIEW, COL, kin, KP, PA,
      get view() { return curView; }, get touring() { return !!tour; }, get cutOn() { return cutOn; },
      setView, show, cut, fade, spin,
      showLabs: (k) => lab.only(k.concat(tour ? ['tour'] : [])), place: (P) => lab.place(P),
      flow(o) { Object.assign(flow, o); },
      bladder(v) { fillTo = v; },
      tour(k, cb) { const T = TOURS[k], durs = T.legs.map(([kk]) => PA[kk].len / 1.5); tour = { k, leg: 0, t: 0, dur: durs[0], durs, name: '' }; onTour = cb || onTour; lab.L.tour.show = true; },
      stopTour() { tour = null; MK.visible = false; lab.L.tour.show = false; fillTo = 0; },
    }));
    return api;
  }

  /* ===================== 네프론 =====================
     토리(모세혈관이 실처럼 뭉친 부분)를 보먼주머니가 둘러싸고, 보먼주머니에 이어진 세뇨관을 모세혈관이 둘러싼다.
     세뇨관은 콩팥깔때기로 이어지는 관에 연결된다(교과서 217쪽 그림 형식). */
  function nephron(host, opt = {}) {
    const { st, clk, spin } = baseStage(host, Object.assign({ fov: 32, minD: 3, maxD: 80 }, opt));
    const root = new THREE.Group(); st.scene.add(root);
    let seed = 7; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const cr = (pts, closed = false) => new THREE.CatmullRomCurve3(pts.map((p) => V(...p)), closed, 'centripetal');
    const tubeM = (curve, r, m, seg = 260, rs = 14) => { const me = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, rs, false), m); root.add(me); return me; };
    /* 보먼주머니 중심 */
    const BC = V(-2.2, 4.2, 0), BR = 1.35;
    /* 세뇨관 길: 보먼주머니 아래 → 구불구불 → 아래로 긴 고리 → 다시 위 → 구불구불 → 모으는 관 */
    const TP = [[-2.2, 2.75, 0], [-1.6, 2.2, .5], [-.6, 2.6, .8], [-.2, 3.6, .2], [-1.0, 3.9, -.6], [-.4, 4.6, -.9], [.6, 4.3, -.3], [.4, 3.2, .4], [-.4, 1.9, .2], [-.3, .4, .1], [-.25, -1.6, 0], [-.2, -3.4, 0], [.1, -4.3, 0], [.5, -4.3, 0], [.75, -3.4, 0], [.85, -1.4, 0], [.9, .6, 0], [1.1, 2.2, .4], [.6, 3.4, 1.2], [1.4, 4.1, 1.0], [2.0, 3.5, .3], [1.6, 2.6, -.2], [2.3, 2.0, .2], [3.0, 2.2, 0], [3.3, 3.0, 0], [3.4, 4.6, 0]];
    const tubC = cr(TP);
    /* 모으는 관: 위에서 내려와 콩팥깔때기 쪽으로 */
    const CD = cr([[3.4, 6.0, 0], [3.4, 4.6, 0], [3.45, 1.0, 0], [3.5, -3.0, 0], [3.5, -5.6, 0]]);
    const tubMat = mat(COL.ure, { roughness: .55, transparent: true, opacity: .62, depthWrite: false, side: THREE.DoubleSide });
    const tub = tubeM(tubC, .27, tubMat, 420, 16); const cd = tubeM(CD, .34, tubMat, 120, 16); tub.renderOrder = 10; cd.renderOrder = 10;
    /* 보먼주머니: 앞쪽을 잘라 속의 토리가 보이게 (두 겹) */
    const capS = new THREE.Group(); root.add(capS); capS.position.copy(BC);
    const cupM = mat('#efd99a', { roughness: .62, side: THREE.DoubleSide, transparent: true, opacity: .9 });
    const outerS = new THREE.Mesh(new THREE.SphereGeometry(BR, 48, 32, Math.PI * .62, Math.PI * 1.76, Math.PI * .1, Math.PI * .9), cupM); capS.add(outerS);
    const innerS = new THREE.Mesh(new THREE.SphereGeometry(BR * .9, 48, 32, Math.PI * .62, Math.PI * 1.76, Math.PI * .1, Math.PI * .9), mat('#f7e9bd', { roughness: .7, side: THREE.DoubleSide })); capS.add(innerS);
    /* 자른 가장자리 */
    [Math.PI * .62, Math.PI * .62 + Math.PI * 1.76].forEach((ph) => { const pts = []; for (let k = 0; k <= 30; k++) { const th = Math.PI * .1 + Math.PI * .9 * k / 30; pts.push(V(-Math.cos(ph) * Math.sin(th), Math.cos(th), Math.sin(ph) * Math.sin(th))); } const g = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => p.multiplyScalar(BR * .95))), 40, BR * .055, 6), cupM); capS.add(g); });
    /* 토리: 들어오는 혈관 → 실처럼 뭉친 모세혈관 → 나가는 혈관 */
    const gPts = []; const IN = V(-1.25, 5.85, -.2), OUT = V(-1.0, 5.95, .35);
    gPts.push(IN.clone(), BC.clone().add(V(.55, 1.05, -.15)));
    for (let k = 0; k < 26; k++) { const th = R() * Math.PI * 2, ph = Math.acos(2 * R() - 1), r = BR * (.32 + R() * .4); gPts.push(BC.clone().add(V(Math.sin(ph) * Math.cos(th) * r, Math.cos(ph) * r * .9, Math.sin(ph) * Math.sin(th) * r))); }
    gPts.push(BC.clone().add(V(.7, 1.0, .3)), OUT.clone());
    const gC = new THREE.CatmullRomCurve3(gPts, false, 'catmullrom', .5);
    const gM = mat('#d24a3d', { roughness: .5 }); const glo = tubeM(gC, .1, gM, 900, 8);
    /* 들어오는 혈관(콩팥동맥에서), 나가는 혈관(세뇨관을 둘러싸는 모세혈관으로) */
    const AFF = cr([[-4.6, 7.6, -.6], [-3.0, 7.0, -.4], [-1.8, 6.4, -.25], [IN.x, IN.y, IN.z]]);
    tubeM(AFF, .2, mat(COL.art, { roughness: .5 }), 60, 12);
    /* 모세혈관: 세뇨관을 감으며 내려갔다 올라와 콩팥정맥 쪽으로. 색은 붉은색에서 푸른색으로 */
    const capPts = [OUT.clone(), V(-.4, 6.3, .6), V(.6, 5.4, .5)];
    const N = 220; for (let k = 0; k <= N; k++) { const u = .05 + .9 * k / N, p = tubC.getPointAt(u), tg = tubC.getTangentAt(u), a = V(0, 0, 1).cross(tg).normalize(); if (a.lengthSq() < .01) a.set(1, 0, 0); const b = tg.clone().cross(a).normalize(), ang = u * 150, rr = .42; capPts.push(p.clone().addScaledVector(a, Math.cos(ang) * rr).addScaledVector(b, Math.sin(ang) * rr)); }
    capPts.push(V(2.7, 1.2, .9), V(2.2, -.6, 1.2), V(1.7, -3.0, 1.2), V(1.6, -5.2, 1.0));
    const capC = new THREE.CatmullRomCurve3(capPts, false, 'catmullrom', .5);
    const capG = new THREE.TubeGeometry(capC, 1400, .085, 7, false);
    { const n = capG.attributes.position.count, cc = new Float32Array(n * 3), cA = new THREE.Color(COL.art), cB = new THREE.Color(COL.vein), c = new THREE.Color(); for (let i = 0; i < n; i++) { const u = Math.floor(i / 8) / 1400; c.copy(cA).lerp(cB, sm(.55, .9, u)); cc[i * 3] = c.r; cc[i * 3 + 1] = c.g; cc[i * 3 + 2] = c.b; } capG.setAttribute('color', new THREE.BufferAttribute(cc, 3)); }
    const capMesh = new THREE.Mesh(capG, mat('#ffffff', { roughness: .5, vertexColors: true })); root.add(capMesh);

    /* ----- 알갱이 ----- */
    const Pc = (curve) => { const pts = curve.getSpacedPoints(400); return new Path(pts); };
    const PATH = { aff: Pc(AFF), glo: Pc(gC), cap: Pc(capC), tub: Pc(tubC), cd: Pc(CD) };
    const rbcG = new THREE.SphereGeometry(.13, 12, 9); rbcG.scale(1, .45, 1);
    const SH = { rbc: rbcG, pro: new THREE.DodecahedronGeometry(.13), glu: new THREE.CylinderGeometry(.1, .1, .08, 6), ure: new THREE.BoxGeometry(.13, .13, .13), wat: new THREE.SphereGeometry(.07, 10, 8) };
    SH.glu.rotateX(Math.PI / 2);
    const CL = { rbc: COL.rbc, pro: '#e2669b', glu: '#8a5cc8', ure: COL.urea, wat: '#3d9be0' };
    const IM = {}; Object.keys(SH).forEach((k, i) => { IM[k] = new THREE.InstancedMesh(SH[k], mat(CL[k], { roughness: .45, depthTest: false, transparent: true }), 90); IM[k].renderOrder = 40 + i; IM[k].frustumCulled = false; IM[k].count = 0; root.add(IM[k]); });
    const P = [];
    const tv = V(), tw = V(), dum = new THREE.Object3D();
    /* 하나의 알갱이: 길(seq) 목록을 차례로 */
    const add = (k, seq) => { if (P.length > 240) return; P.push({ k, seq, i: 0, u: seq[0].u0 || 0, r: V(rnd(0, 6), rnd(0, 6), 0), j: V(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(.06) }); };
    const seg = (p, u0, u1, sp = 1) => ({ p, u0, u1, sp });
    const hop = (a, b, sp = 1.4) => ({ hop: [a, b], u0: 0, u1: 1, sp });
    let step = 3, sick = null, run = true, rate = 1;
    const ON = { filt: true, reab: true, secr: true };
    const emit = () => {
      const r = R();
      const base = [seg(PATH.aff, 0, 1, 1.2), seg(PATH.glo, 0, 1, .6)];
      const gU = .3 + R() * .5, toCap = [seg(PATH.glo, 0, gU, .6)];
      if (r < .3) { add('rbc', base.concat([seg(PATH.glo, gU, 1, .6), seg(PATH.cap, 0, 1, .35)])); return; }
      if (r < .4) { /* 단백질: 여과되지 않음 (단백뇨면 일부 여과) */ if (sick === 'pro' && R() < .6) { add('pro', [seg(PATH.aff, 0, 1, 1.2)].concat(toCap, [hop(() => PATH.glo.at(gU), () => PATH.tub.at(.005)), seg(PATH.tub, .005, 1, .32), seg(PATH.cd, .2, 1, .6)])); } else add('pro', base.concat([seg(PATH.cap, 0, 1, .35)])); return; }
      /* 작은 물질: 여과 */
      const k = r < .58 ? 'glu' : r < .78 ? 'wat' : 'ure';
      const inT = [seg(PATH.aff, 0, 1, 1.2)].concat(toCap, [hop(() => PATH.glo.at(gU), () => PATH.tub.at(.005))]);
      if (!ON.filt) { add(k, base.concat([seg(PATH.cap, 0, 1, .35)])); return; }
      if (k === 'glu' && ON.reab && !(sick === 'glu' && R() < .55)) { const t = .05 + R() * .3; add(k, inT.concat([seg(PATH.tub, .005, t, .32), hop(() => PATH.tub.at(t), () => PATH.cap.at(Math.min(.95, .07 + t * .9))), seg(PATH.cap, Math.min(.95, .07 + t * .9), 1, .35)])); return; }
      if (k === 'wat' && ON.reab && R() < .8) { const t = .05 + R() * .8; add(k, inT.concat([seg(PATH.tub, .005, t, .32), hop(() => PATH.tub.at(t), () => PATH.cap.at(Math.min(.95, .07 + t * .9))), seg(PATH.cap, Math.min(.95, .07 + t * .9), 1, .35)])); return; }
      add(k, inT.concat([seg(PATH.tub, .005, 1, .32), seg(PATH.cd, .2, 1, .6)]));
      /* 분비: 모세혈관 → 세뇨관 */
      if (ON.secr && R() < .5) { const t = .3 + R() * .5, cu = Math.min(.95, .07 + t * .9); add('ure', base.concat([seg(PATH.cap, 0, cu, .35), hop(() => PATH.cap.at(cu), () => PATH.tub.at(t), 1.1), seg(PATH.tub, t, 1, .32), seg(PATH.cd, .2, 1, .6)])); }
    };
    let acc = 0;
    st.onFrame(() => {
      const dt = clk.dt;
      if (run && step > 0) { acc += dt * 3.2 * rate; while (acc > 1) { acc -= 1; emit(); } }
      const cnt = { rbc: 0, pro: 0, glu: 0, ure: 0, wat: 0 };
      for (let n = P.length - 1; n >= 0; n--) {
        const a = P[n], s = a.seq[a.i];
        if (run) { const L = s.hop ? 1.2 : s.p.len; a.u += dt * s.sp * 2.4 / L * (s.u1 > s.u0 ? 1 : -1); }
        const done = s.u1 > s.u0 ? a.u >= s.u1 : a.u <= s.u1;
        if (done) { a.i++; if (a.i >= a.seq.length) { P.splice(n, 1); continue; } a.u = a.seq[a.i].u0; }
        const q = a.seq[a.i];
        if (q.hop) { const A = q.hop[0](), B = q.hop[1](); tv.lerpVectors(A, B, a.u); tv.y += Math.sin(a.u * Math.PI) * .12; } else { q.p.at(a.u, tv); tv.add(a.j); }
        const c = cnt[a.k]++; if (c >= 90) continue;
        dum.position.copy(tv); a.r.x += dt * 1.5; dum.rotation.set(a.r.x, a.r.y, 0); dum.scale.setScalar(1); dum.updateMatrix(); IM[a.k].setMatrixAt(c, dum.matrix);
      }
      Object.keys(IM).forEach((k) => { IM[k].count = Math.min(90, cnt[k]); IM[k].instanceMatrix.needsUpdate = true; });
    });
    /* 미리 채워 두기 */
    const warm = (t) => { for (let i = 0; i < t * 3.2; i++) emit(); P.forEach((a) => { let left = R() * 6; while (left > 0 && a.i < a.seq.length) { const s = a.seq[a.i], span = Math.abs(s.u1 - s.u0), L = s.hop ? 1.2 : s.p.len, need = span * L / (s.sp * 2.4); if (left < need) { a.u = s.u0 + (s.u1 > s.u0 ? 1 : -1) * left / need * span; left = 0; } else { left -= need; a.i++; if (a.i < a.seq.length) a.u = a.seq[a.i].u0; } } }); for (let n = P.length - 1; n >= 0; n--) if (P[n].i >= P[n].seq.length) P.splice(n, 1); };
    warm(5);

    /* ----- 이름표 ----- */
    const lab = labels(st);
    lab.add('glo', '토리<small>모세혈관이 실처럼 뭉친 부분</small>', () => BC.clone().add(V(-.2, .3, .3)), .3, .12, 'b');
    lab.add('bow', '보먼주머니<small>토리를 둘러싸는 주머니 모양</small>', () => BC.clone().add(V(-1.25, -.4, .2)), .3, .4, 'b');
    lab.add('tub', '세뇨관<small>보먼주머니와 연결된 가늘고 긴 관</small>', () => tubC.getPointAt(.48), .3, .72, 'b');
    lab.add('cap', '모세혈관', () => capC.getPointAt(.62), .8, .56, 'b');
    lab.add('aff', '콩팥동맥에서 들어오는 혈액', () => AFF.getPointAt(.15), .3, .03);
    lab.add('eff', '콩팥정맥 쪽으로', () => capC.getPointAt(.99), .62, .97);
    lab.add('cd', '콩팥깔때기로', () => CD.getPointAt(.9), .8, .86, 'b');
    lab.add('cap3', '', null, .5, .05, 'cap3', { c: true });
    const VIEW = { all: new THREE.Box3(V(-4.8, -5.4, -1.6), V(4.2, 7.8, 1.8)), glo: new THREE.Box3(V(-3.7, 2.6, -1.4), V(-.6, 6.4, 1.4)) };
    const vb = {}; Object.entries(VIEW).forEach(([k, b]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(...b.getSize(V()).toArray())); m.position.copy(b.getCenter(V())); m.visible = false; st.scene.add(m); vb[k] = m; });
    const setView = (k, dur = 0) => st.fit([vb[k]], { dir: k === 'glo' ? V(.25, .15, 1) : V(.3, .1, 1), margin: 1.03, dur: window.__bakeT !== undefined ? 0 : dur, target: vb[k].position.clone() });
    setView(opt.view || 'all');
    lab.only(['glo', 'bow', 'tub', 'cap', 'cd']);

    const api = {};
    Object.defineProperties(api, Object.getOwnPropertyDescriptors({
      st, lab, spin, setView, PATH,
      showLabs: (k) => lab.only(k), place: (P_) => lab.place(P_),
      set run(v) { run = v; }, get run() { return run; },
      set rate(v) { rate = v; },
      set sick(v) { sick = v; }, get sick() { return sick; },
      on(o) { Object.assign(ON, o); },
      cap(t) { lab.L.cap3.e.innerHTML = t; lab.L.cap3.show = !!t; },
      clear() { P.length = 0; },
      warm,
    }));
    return api;
  }
  return { body, nephron, data, labels, Path, COL };
})();
window.EX3 = EX3;
