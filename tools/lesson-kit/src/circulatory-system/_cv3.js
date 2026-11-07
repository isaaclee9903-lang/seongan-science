/* ===== 순환계 3D 도구 CV3 =====
   심장 모양: BodyParts3D 4.0(CC BY 4.0, media/ATTRIBUTION.txt). 뛰는 모습과 혈액의 빠르기·수는 정한 모형이다.
   C3(c3.js)와 같은 모듈 안에 넣어 쓴다. */
const CV3 = (() => {
  'use strict';
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const REDUCE = C3.REDUCE;
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  (function css() { const c = document.createElement('style'); c.textContent = '.hl{position:absolute;left:0;top:0;z-index:4;font:700 clamp(13px,1.25vw,16px)/1.2 Pretendard,sans-serif;color:#14263b;white-space:nowrap;pointer-events:none;background:rgba(255,255,255,.82);padding:1px 6px;border-radius:5px}.hl.b{font-weight:800;font-size:clamp(15px,1.5vw,19px)}'; document.head.appendChild(c); })();
  let dataP = null;
  function heartData() {
    if (dataP) return dataP;
    dataP = Promise.all([fetch('media/heart.json').then((r) => r.json()), fetch('media/heart.bin').then((r) => r.arrayBuffer())]).then(([m, b]) => {
      const pad = m.pad || 0, [bp, bn, bi] = m.bytes;
      const pos = new Float32Array(b, 0, bp / 4), nor = new Int16Array(b, bp, bn / 2), idx = new Uint32Array(b, bp + bn + pad, bi / 4);
      const geo = {};
      Object.entries(m.groups).forEach(([k, g]) => {
        const G = new THREE.BufferGeometry();
        G.setAttribute('position', new THREE.BufferAttribute(pos.subarray(g.v[0] * 3, (g.v[0] + g.v[1]) * 3), 3));
        G.setAttribute('normal', new THREE.BufferAttribute(nor.subarray(g.v[0] * 3, (g.v[0] + g.v[1]) * 3), 3, true));
        const ix = new Uint32Array(g.i[1]); for (let i = 0; i < g.i[1]; i++) ix[i] = idx[g.i[0] + i] - g.v[0];
        G.setIndex(new THREE.BufferAttribute(ix, 1));
        G.computeBoundingSphere();
        geo[k] = G;
      });
      const cen = {}; Object.entries(m.groups).forEach(([k, g]) => { cen[k] = V((g.lo[0] + g.hi[0]) / 2, (g.lo[1] + g.hi[1]) / 2, (g.lo[2] + g.hi[2]) / 2); });
      return { geo, cen, man: m };
    });
    return dataP;
  }

  /* 심장 전체에 같은 변형을 주어 틈이 생기지 않게 뛰게 한다 */
  const BEAT_GLSL = `uniform float uSA,uSV,uKC;uniform vec3 uA,uD;
    vec3 beat(vec3 p){vec3 q=p-uA;float s=dot(q,uD);vec3 r=q-s*uD;float m=smoothstep(-.45,.3,s);float far=1.-smoothstep(1.9,3.1,length(q));
      float wv=m*(1.-smoothstep(1.9,3.1,length(q-uD*1.)));float wa=(1.-m)*far;
      float f=1.-uKC*(uSV*.09*wv+uSA*.06*wa);float sl=1.-uKC*uSV*.05*wv;return uA+uD*s*sl+r*f;}`;
  function beatP(out, p, U, kc) {
    const q = out.copy(p).sub(U.uA.value), D = U.uD.value, s = q.dot(D);
    const r = q.clone().addScaledVector(D, -s), m = smooth(-.45, .3, s), L = q.length();
    const far = 1 - smooth(1.9, 3.1, L), wv = m * (1 - smooth(1.9, 3.1, q.clone().addScaledVector(D, -1).length())), wa = (1 - m) * far;
    const f = 1 - kc * (U.uSV.value * .09 * wv + U.uSA.value * .06 * wa), sl = 1 - kc * U.uSV.value * .05 * wv;
    return out.copy(U.uA.value).addScaledVector(D, s * sl).addScaledVector(r, f);
  }
  function addBeat(mat, U, kc) {
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U, { uKC: { value: kc } });
      sh.vertexShader = BEAT_GLSL + String.fromCharCode(10) + sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed=beat(vec3(position));');
    };
    mat.customProgramCacheKey = () => 'beat' + kc;
    return mat;
  }
  function fiberTex() {
    return C3.canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#b4574b'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) {
        const x = Math.random() * w, y = Math.random() * h, l = 18 + Math.random() * 46, a = -0.5 + Math.sin(y / 70) * .55 + (Math.random() - .5) * .25;
        g.strokeStyle = Math.random() < .5 ? `rgba(120,40,34,${.1 + Math.random() * .18})` : `rgba(226,142,124,${.08 + Math.random() * .16})`;
        g.lineWidth = .8 + Math.random() * 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
    });
  }

  async function heart(host, opt = {}) {
    const D = await heartData(), { geo, cen } = D;
    const st = C3.makeStage(host, { hold: true, fov: 26, minD: 6, maxD: 26, scroll: !!opt.scroll, fitWidth: true, exposure: 1.02, sunX: -4, sunZ: 8 });
    st.scene.background = new THREE.Color(0xffffff);
    st.renderer.localClippingEnabled = true;
    st.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    st.scene.environment = null; st.scene.children.filter((o) => o.isHemisphereLight).forEach((o) => { o.intensity = 1.25; o.color.set(0xffffff); o.groundColor.set(0x9a8f88); });
    st.sun.castShadow = false; st.sun.intensity = 2.3; st.sun.position.set(-4, 7, 9);
    const fill = new THREE.DirectionalLight(0xdfeaff, .7); fill.position.set(7, -1, 5); st.scene.add(fill);

    /* 뛰는 기준: 판막이 있는 면 → 심장 끝 */
    const A = cen.valTV.clone().add(cen.valMV).multiplyScalar(.5);
    const Dir = cen.cavRV.clone().add(cen.cavLV).multiplyScalar(.5).sub(cen.cavRA.clone().add(cen.cavLA).multiplyScalar(.5)).normalize();
    const U = { uSA: { value: 0 }, uSV: { value: 0 }, uA: { value: A }, uD: { value: Dir } };
    /* 네 방이 함께 보이는 자르는 면 */
    const N = cen.cavRV.clone().sub(cen.cavLA).cross(cen.cavLV.clone().sub(cen.cavRA)).normalize(); if (N.z < 0) N.negate();
    const PC = cen.cavRA.clone().add(cen.cavRV).add(cen.cavLA).add(cen.cavLV).multiplyScalar(.25);
    const CUT = new THREE.Plane(N.clone().negate(), N.dot(PC));
    const NOCUT = new THREE.Plane(N.clone().negate(), 1000);
    const clip = [CUT.clone()];
    const root = new THREE.Group(); st.scene.add(root);

    const std = (color, side = THREE.FrontSide, rough = .68) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, side, clippingPlanes: clip });
    const COL = { wallV: '#a9463f', wallLA: '#bb5f52', wallRA: '#bb5f52', aorta: '#d8483c', pa: '#3f74c8', pv: '#d8483c', svc: '#3f74c8', ivc: '#3f74c8' };
    const meshes = {};
    const add = (k, m, kc = 1) => { addBeat(m, U, kc); const me = new THREE.Mesh(geo[k], m); me.userData.base = m.color.clone(); root.add(me); meshes[k] = me; return me; };
    ['wallV', 'wallLA', 'wallRA'].forEach((k) => add(k, std(COL[k], THREE.DoubleSide)));
    [['cavRA', '#7fa2e4'], ['cavRV', '#7fa2e4'], ['cavLA', '#f08a7a'], ['cavLV', '#f08a7a']].forEach(([k, c]) => { const m = std(c, THREE.BackSide, .75); m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; add(k, m, 1); });
    /* 방 안쪽 벽은 혈액 색을 입힌다: 방 표면 가까운 벽 꼭짓점을 칠한다 */
    const tint = (wk, rules) => {
      const G = geo[wk], p = G.attributes.position, n = G.attributes.normal, col = new Float32Array(p.count * 3), base = new THREE.Color(COL[wk]);
      const samples = rules.map(([ck, c]) => { const q = geo[ck].attributes.position, a = []; for (let i = 0; i < q.count; i += 2) a.push(q.getX(i), q.getY(i), q.getZ(i)); return { a, c: new THREE.Color(c) }; });
      const out = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i); let bd = 1e9, bc = null, bdot = -1;
        samples.forEach((sm) => { for (let j = 0; j < sm.a.length; j += 3) { const dx = sm.a[j] - x, dy = sm.a[j + 1] - y, dz = sm.a[j + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; bc = sm.c; bdot = (dx * nx + dy * ny + dz * nz); } } });
        const w = (1 - smooth(.06, .26, Math.sqrt(bd))) * (bd < .0016 ? 1 : (bdot > 0 ? 1 : 0)); out.copy(base).lerp(bc, w); col[i * 3] = out.r; col[i * 3 + 1] = out.g; col[i * 3 + 2] = out.b;
      }
      G.setAttribute('color', new THREE.BufferAttribute(col, 3));
    };
    if (!geo.wallV.attributes.color) { tint('wallV', [['cavRV', '#7fa2e4'], ['cavLV', '#f08a7a']]); tint('wallRA', [['cavRA', '#7fa2e4']]); tint('wallLA', [['cavLA', '#f08a7a']]); }
    ['wallV', 'wallLA', 'wallRA'].forEach((k) => { const m = meshes[k].material; m.vertexColors = true; m.color.set(0xffffff); meshes[k].userData.base = m.color.clone(); });
    /* 혈관은 자르지 않는다 */
    ['aorta', 'pa', 'pv', 'svc', 'ivc'].forEach((k) => { const m = new THREE.MeshStandardMaterial({ color: COL[k], roughness: .62, side: THREE.DoubleSide }); add(k, m); });
    const VAL = {};
    const flowAxis = { valTV: cen.cavRV.clone().sub(cen.cavRA).normalize(), valMV: cen.cavLV.clone().sub(cen.cavLA).normalize(), valPV: cen.valPV.clone().sub(cen.cavRV).normalize(), valAV: cen.valAV.clone().sub(cen.cavLV).normalize() };
    ['valTV', 'valMV', 'valPV', 'valAV'].forEach((k) => {
      const m = new THREE.MeshStandardMaterial({ color: '#f4ead8', roughness: .55, side: THREE.DoubleSide }); const me = add(k, m); me.matrixAutoUpdate = false; VAL[k] = { me, c: cen[k], a: flowAxis[k], q: new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), flowAxis[k]) };
    });
    const setValve = (k, open) => { const v = VAL[k], r = 1 + .3 * open, s = 1 + .25 * open; const R = new THREE.Matrix4().makeRotationFromQuaternion(v.q), Ri = R.clone().invert(); v.me.matrix.copy(new THREE.Matrix4().makeTranslation(v.c.x, v.c.y, v.c.z).multiply(R).multiply(new THREE.Matrix4().makeScale(r, r, s)).multiply(Ri).multiply(new THREE.Matrix4().makeTranslation(-v.c.x, -v.c.y, -v.c.z))); v.me.matrixWorldNeedsUpdate = true; };

    /* 잘린 면 채우기: 스텐실로 근육 단면을 그린다 */
    const caps = [];
    const capMat = () => new THREE.MeshStandardMaterial({ map: fiberTex(), roughness: .85, stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc, stencilFail: THREE.ReplaceStencilOp, stencilZFail: THREE.ReplaceStencilOp, stencilZPass: THREE.ReplaceStencilOp, side: THREE.DoubleSide });
    const planeGeo = new THREE.PlaneGeometry(14, 14);
    let order = 1;
    ['wallV', 'wallLA', 'wallRA'].forEach((k) => {
      const base = { depthWrite: false, depthTest: false, colorWrite: false, stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc, clippingPlanes: clip };
      const mb = addBeat(new THREE.MeshBasicMaterial({ ...base, side: THREE.BackSide, stencilFail: THREE.IncrementWrapStencilOp, stencilZFail: THREE.IncrementWrapStencilOp, stencilZPass: THREE.IncrementWrapStencilOp }), U, 1);
      const mf = addBeat(new THREE.MeshBasicMaterial({ ...base, side: THREE.FrontSide, stencilFail: THREE.DecrementWrapStencilOp, stencilZFail: THREE.DecrementWrapStencilOp, stencilZPass: THREE.DecrementWrapStencilOp }), U, 1);
      const a = new THREE.Mesh(geo[k], mb), b = new THREE.Mesh(geo[k], mf); a.renderOrder = b.renderOrder = order; root.add(a, b);
      const cap = new THREE.Mesh(planeGeo, capMat()); cap.renderOrder = order + .1;
      cap.position.copy(PC); cap.lookAt(PC.clone().add(N)); cap.onAfterRender = (r) => r.clearStencil();
      root.add(cap); caps.push(cap, a, b); order += 1;
    });

    /* 혈액 입자 */
    const pts = (...a) => a.map((x) => (Array.isArray(x) ? V(...x) : x.clone()));
    const P = opt.paths || {};
    const rp = pts(meshes.svc && [cen.svc.x, D.man.groups.svc.hi[1] - .15, cen.svc.z], [cen.svc.x, 1.4, cen.svc.z], cen.cavRA, cen.valTV, cen.cavRV.clone().add(Dir.clone().multiplyScalar(.15)), cen.cavRV.clone().add(Dir.clone().multiplyScalar(.75)), cen.cavRV.clone().add(V(.25, .45, .25)), cen.valPV, cen.valPV.clone().add(V(.05, .75, -.2)), [.25, 2.05, -.5], [1.45, 2.1, -.95]);
    const lp = pts([1.75, 1.1, -1.5], [.9, .95, -1.05], cen.cavLA, cen.valMV, cen.cavLV.clone().add(Dir.clone().multiplyScalar(.2)), cen.cavLV.clone().add(Dir.clone().multiplyScalar(.75)), cen.cavLV.clone().add(V(-.35, .55, -.2)), cen.valAV, [-.35, 1.75, -.25], [-.3, 2.8, -.75], [.1, 2.75, -1.8]);
    const mkFlow = (P0, col, n, ku, kS) => {
      const c = new THREE.CatmullRomCurve3(P0, false, 'centripetal'), L = c.getLengths(240), T = L[240];
      const uAt = (i) => { let best = 0, d = 1e9; for (let j = 0; j <= 240; j++) { const q = c.getPointAt(j / 240).distanceTo(P0[i]); if (q < d) { d = q; best = j / 240; } } return best; };
      const uV1 = uAt(ku), uV2 = uAt(kS);
      const lat = new THREE.LatheGeometry([[0, .32], [.5, .36], [.86, .48], [1, .6], [.9, .92], [.62, 1.02], [.25, 1.0], [0, .9]].map(([x, y]) => new THREE.Vector2(x, y - .66)), 22);
      lat.computeVertexNormals();
      const im = new THREE.InstancedMesh(lat, new THREE.MeshStandardMaterial({ color: col, roughness: .6 }), n); im.renderOrder = 50; im.frustumCulled = false; root.add(im);
      const items = Array.from({ length: n }, (_, i) => ({ u: i / n, j: V((Math.random() - .5) * .28, (Math.random() - .5) * .28, 0), rx: Math.random() * 6, ry: Math.random() * 6, sp: .8 + Math.random() * .4 }));
      return { c, im, items, uV1, uV2, T };
    };
    const F = [mkFlow(rp, '#2450a8', 18, 3, 7), mkFlow(lp, '#d42f24', 18, 3, 7)];
    const dummy = new THREE.Object3D(), tp = V(), tq = V();
    const blood = (dt, phase, speed) => {
      F.forEach((f) => f.items.forEach((it, i) => {
        const base = (phase === 1 ? .17 : .09) * dt * speed * it.sp * 8 / f.T;
        let nu = it.u + base;
        if (phase === 1) { if (it.u < f.uV1 && nu >= f.uV1 - .012) nu = Math.min(it.u, f.uV1 - .012); } else if (it.u < f.uV2 && nu >= f.uV2 - .012) nu = Math.min(it.u, f.uV2 - .012);
        if (it.u >= f.uV2 && phase !== 1) nu = it.u + base * .7;
        it.u = nu > 1 ? 0 : nu;
        f.c.getPointAt(it.u, tp); tp.add(it.j); beatP(tq, tp, U, 1);
        const fade = Math.min(1, it.u / .03, (1 - it.u) / .03);
        dummy.position.copy(tq); dummy.rotation.set(it.rx + it.u * 8, it.ry + it.u * 5, 0); dummy.scale.setScalar(.085 * fade); dummy.updateMatrix(); f.im.setMatrixAt(i, dummy.matrix);
      }));
      F.forEach((f) => { f.im.instanceMatrix.needsUpdate = true; });
    };

    /* 이름표: 칸 가장자리 쪽에 글자를 두고 얇은 선으로 잇는다 */
    const ov = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); ov.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3'); host.appendChild(ov);
    const LBL = {}, _p = V();
    const lab = (k, t, at, side, y, cls = '') => {
      const e = document.createElement('div'); e.className = 'hl ' + cls; e.textContent = t; host.appendChild(e);
      const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line'); ln.setAttribute('stroke', '#14263b'); ln.setAttribute('stroke-width', '1'); ov.appendChild(ln);
      LBL[k] = { e, ln, at, side, y, show: true };
    };
    const placeLab = () => {
      const { W, H } = st.size(); const off = Math.max(.1, Math.min(.2, (W / H - .4) * .16));
      Object.values(LBL).forEach((L) => {
        L.e.style.display = L.ln.style.display = L.show ? '' : 'none'; if (!L.show) return;
        _p.copy(L.at); beatP(_p, _p, U, 1); _p.project(st.camera);
        const px = (_p.x + 1) / 2 * W, py = (1 - _p.y) / 2 * H, tx = L.side < 0 ? W * off : W * (1 - off), ty = H * L.y;
        L.e.style.transform = `translate(${tx}px,${ty}px) translate(${L.side < 0 ? '-100%' : '0'},-50%)`;
        L.ln.setAttribute('x1', px); L.ln.setAttribute('y1', py); L.ln.setAttribute('x2', tx + (L.side < 0 ? 6 : -6)); L.ln.setAttribute('y2', ty);
      });
    };
    st.onFrame(placeLab);
    lab('svc', '대정맥', V(cen.svc.x, 2.3, cen.svc.z), -1, .12);
    lab('ra', '우심방', cen.cavRA.clone().add(V(-.1, .15, 0)), -1, .36, 'b');
    lab('valT', '판막', cen.valTV, -1, .5);
    lab('rv', '우심실', cen.cavRV.clone().add(Dir.clone().multiplyScalar(.55)), -1, .68, 'b');
    lab('ao', '대동맥', V(-.3, 2.75, -.8), 1, .08);
    lab('pa', '폐동맥', V(.7, 2.0, -.5), 1, .2);
    lab('pv', '폐정맥', V(1.75, 1.05, -1.4), 1, .33);
    lab('la', '좌심방', cen.cavLA.clone().add(V(.3, .1, 0)), 1, .46, 'b');
    lab('valM', '판막', cen.valMV, 1, .58);
    lab('lv', '좌심실', cen.cavLV.clone().add(Dir.clone().multiplyScalar(.45)), 1, .72, 'b');

    /* 상태 */
    let view = opt.view || 'cut', spd = opt.speed || .7, paused = false, t = 0, phase = 0, hl = null;
    const applyView = () => {
      const cut = view === 'cut';
      clip[0].copy(cut ? CUT : NOCUT);
      caps.forEach((c) => { c.visible = cut; });
      ['aorta', 'pa', 'valPV', 'valAV'].forEach((k) => { const m = meshes[k].material; m.transparent = cut; m.opacity = cut ? .17 : 1; m.depthWrite = !cut; if (k[0] !== 'v') m.side = cut ? THREE.FrontSide : THREE.DoubleSide; m.needsUpdate = true; meshes[k].renderOrder = cut ? 40 : 0; });
      F.forEach((f) => { f.im.visible = cut && !opt.noFlow; });
      ['ra', 'rv', 'la', 'lv', 'valT', 'valM'].forEach((k) => { LBL[k].show = cut; });
      ['cavRA', 'cavRV', 'cavLA', 'cavLV', 'valTV', 'valMV', 'valPV', 'valAV'].forEach((k) => { meshes[k].visible = cut; });
    };
    const DIM = new THREE.Color('#d9dde2');
    const GROUPS = { a: ['wallLA', 'wallRA', 'cavRA', 'cavLA'], v: ['wallV', 'cavRV', 'cavLV'], val: ['valTV', 'valMV', 'valPV', 'valAV'], wall: ['wallV'], art: ['aorta', 'pa'], vei: ['svc', 'ivc', 'pv'] };
    const paint = () => {
      Object.entries(meshes).forEach(([k, me]) => { const on = !hl || GROUPS[hl].includes(k); me.material.color.copy(me.userData.base); if (!on) me.material.color.lerp(DIM, .55); });
      caps.forEach((c) => { if (c.material.map) c.material.color.set(!hl || hl === 'v' || hl === 'wall' || hl === 'a' ? 0xffffff : 0xdddddd); });
    };
    applyView();
    const R = () => { const r = st.size(), port = r.H / r.W > 1.05; return port; };
    st.camera.position.copy(N.clone().multiplyScalar(14).add(V(0, .2, 0))); st.controls.target.set(0, .35, 0);
    const dirCam = N.clone();
    const fitBox = new THREE.Mesh(new THREE.BoxGeometry(5, 5.6, .5)); fitBox.visible = false; fitBox.position.set(0, .55, 0); st.scene.add(fitBox);
    st.fit([fitBox], { dir: dirCam, margin: 1.02, target: V(0, .55, 0) });
    let tt = 0;
    st.onFrame((dt) => {
      if (window.__bakeT !== undefined) { const n = window.__bakeT; dt = Math.max(0, n - tt); tt = n; }
      if (!paused && !REDUCE) t = (t + dt * spd * .55) % 1;
      /* 0~.18 심방 수축, .18~.55 심실 수축, 나머지 쉼 */
      const ph = t < .18 ? 0 : t < .55 ? 1 : 2;
      const sa = t < .18 ? Math.sin(t / .18 * Math.PI) : 0, sv = (t >= .18 && t < .55) ? Math.sin((t - .18) / .37 * Math.PI) : 0;
      U.uSA.value = sa * 2.2; U.uSV.value = sv * 2.2;
      const svOpen = smooth(.18, .25, t) * (1 - smooth(.5, .57, t));
      setValve('valTV', 1 - svOpen); setValve('valMV', 1 - svOpen); setValve('valPV', svOpen); setValve('valAV', svOpen);
      phase = ph;
      if (!paused) blood(dt, ph === 1 ? 1 : 0, spd);
    });
    const api = {
      st, get phase() { return phase; },
      speed(v) { spd = v; }, pause(v) { paused = v; }, seek(v) { t = v; },
      view(v) { view = v; applyView(); }, get viewName() { return view; },
      highlight(k) { hl = k; paint(); ['valPV', 'valAV'].forEach((n) => { const m = meshes[n].material; if (view === 'cut') { m.opacity = k === 'val' ? 1 : .17; m.depthWrite = k === 'val'; m.needsUpdate = true; } }); },
    };
    await C3.prepare(st);
    return api;
  }
  return { heart, heartData };
})();
window.CV3 = CV3;
