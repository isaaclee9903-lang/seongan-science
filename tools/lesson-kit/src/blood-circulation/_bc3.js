/* ===== 혈액 순환 3D 도구 BC3 =====
   혈관·심장·뼈: BodyParts3D 4.0(CC BY 4.0), 폐 표면: HuBMAP CCF 3D Reference Object Library(CC BY 4.0). media/ATTRIBUTION.txt
   혈액의 빠르기, 입자의 수와 크기, 파랑·빨강은 잘 보이게 정한 모형이다.
   CV3.heart 무대(심장 잘라 보기, 뛰는 모습)에 온몸 혈관을 얹어 쓴다. C3·CV3와 같은 모듈 안에 넣는다. */
const BC3 = (() => {
  'use strict';
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const REDUCE = C3.REDUCE;
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const LO = .4;
  const COL = { art: '#d6382c', vei: '#3a62c4', red: '#d8392e', blue: '#4a56b8', dim: '#e4e8ec', lung: '#ee9f93', drug: '#f2b705' };

  let bodyP = null;
  function bodyData() {
    if (bodyP) return bodyP;
    bodyP = Promise.all([fetch('media/body.json').then((r) => r.json()), fetch('media/body.bin').then((r) => r.arrayBuffer())]).then(([m, b]) => {
      const n = m.counts[0], pos = new Int16Array(b, 0, n * 3), nor = new Int16Array(b, n * 6, n * 3), idx = new Uint32Array(b, m.iOff, m.counts[1]);
      const pa = new THREE.BufferAttribute(pos, 3, true), na = new THREE.BufferAttribute(nor, 3, true);
      const geo = (ranges) => { let c = 0; ranges.forEach((r) => { c += r[1]; }); const ix = new Uint32Array(c); let o = 0; ranges.forEach((r) => { ix.set(idx.subarray(r[0], r[0] + r[1]), o); o += r[1]; }); const G = new THREE.BufferGeometry(); G.setAttribute('position', pa); G.setAttribute('normal', na); G.setIndex(new THREE.BufferAttribute(ix, 1)); return G; };
      return { m, geo };
    });
    return bodyP;
  }
  /* 꺾은선 길 */
  class Path {
    constructor(pts, marks) { this.p = pts; this.c = new Float32Array(pts.length); for (let i = 1; i < pts.length; i++) this.c[i] = this.c[i - 1] + pts[i].distanceTo(pts[i - 1]); this.len = this.c[pts.length - 1] || 1; this.marks = marks || []; }
    at(u, out = V()) { const s = Math.max(0, Math.min(1, u)) * this.len, c = this.c; let a = 0, b = c.length - 1; while (b - a > 1) { const m = (a + b) >> 1; if (c[m] <= s) a = m; else b = m; } const t = (s - c[a]) / Math.max(1e-6, c[b] - c[a]); return out.lerpVectors(this.p[a], this.p[b], t); }
    curve() { return new THREE.CatmullRomCurve3(this.p, false, 'centripetal'); }
  }
  const toV = (a) => a.map((q) => (Array.isArray(q) ? V(q[0], q[1], q[2]) : q.clone()));
  const spline = (a, n = 24) => new THREE.CatmullRomCurve3(toV(a), false, 'centripetal').getPoints(n);
  const join = (...ls) => { const o = []; ls.forEach((l) => l.forEach((q) => { if (!o.length || o[o.length - 1].distanceToSquared(q) > 1e-5) o.push(q); })); return o; };

  function rbcGeo() {
    const c = new THREE.CatmullRomCurve3([[0, -.2], [.42, -.26], [.8, -.36], [1, -.1], [1, .1], [.8, .36], [.42, .26], [0, .2]].map(([x, y]) => V(x, y, 0)));
    const out = new THREE.LatheGeometry(c.getPoints(24).map((q) => new THREE.Vector2(Math.max(0, q.x), q.y)), 22); out.computeVertexNormals(); return out;
  }
  function lumpy(detail, amp, f, seed = 1) {
    const g = new THREE.SphereGeometry(1, 16 * detail, 11 * detail), p = g.attributes.position, v = V();
    const n = (x, y, z) => Math.sin(x * f + seed) * Math.cos(y * f * 1.3 + seed * 2) + Math.sin(z * f * 1.1 + seed * 3) * .7 + Math.sin((x + y + z) * f * 1.9) * .35;
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const L = 1 + amp * n(v.x, v.y, v.z); p.setXYZ(i, v.x * L, v.y * L, v.z * L); }
    g.computeVertexNormals();
    const nn = g.attributes.normal, seg = 16 * detail, rows = 11 * detail; for (let r = 0; r <= rows; r++) { const a0 = r * (seg + 1), a1 = a0 + seg; const x = nn.getX(a0) + nn.getX(a1), y = nn.getY(a0) + nn.getY(a1), z = nn.getZ(a0) + nn.getZ(a1), l = Math.hypot(x, y, z) || 1; nn.setXYZ(a0, x / l, y / l, z / l); nn.setXYZ(a1, x / l, y / l, z / l); }
    return g;
  }
  function molGeos() {
    const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: .55 });
    const o2 = new THREE.Group(); [-.42, .42].forEach((x) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.5, 18, 14), mat('#e23b2e')); m.position.x = x; o2.add(m); });
    const co2 = new THREE.Group(); co2.add(new THREE.Mesh(new THREE.SphereGeometry(.5, 18, 14), mat('#3b4048'))); [-.72, .72].forEach((x) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.42, 18, 14), mat('#e23b2e')); m.position.x = x; co2.add(m); });
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .36, 6), mat('#f2b632'));
    const wst = new THREE.Mesh(new THREE.BoxGeometry(.72, .72, .72), mat('#8d8578'));
    return { o2, co2, nut, wst };
  }
  /* 이름표: 3D 위치 at에서 칸 비율 (x,y) 글자까지 얇은 선 */
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
        a.ln.setAttribute('x1', (p.x + 1) / 2 * W); a.ln.setAttribute('y1', (1 - p.y) / 2 * H); a.ln.setAttribute('x2', tx + (xx < .5 ? 4 : -4)); a.ln.setAttribute('y2', ty);
      });
    });
    const add = (k, t, at, x, y, cls = '', extra = {}) => { const e = document.createElement('div'); e.className = 'hl ' + cls; e.innerHTML = t; host.appendChild(e); const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line'); ln.setAttribute('stroke', '#14263b'); ln.setAttribute('stroke-width', '1'); ov.appendChild(ln); L[k] = Object.assign({ e, ln, at, x, y, show: false }, extra); return L[k]; };
    const only = (keys) => { Object.entries(L).forEach(([k, a]) => { a.show = keys.includes(k); }); };
    return { add, only, L };
  }

  /* ===== 모세혈관 확대 무대: lung(폐), body(온몸의 세포) ===== */
  function microScene(st, lab, clk) {
    const G = new THREE.Group(); G.visible = false; st.scene.add(G);
    const part = { lung: new THREE.Group(), body: new THREE.Group() }; G.add(part.lung, part.body);
    const capR = .8, capL = 14.5, RB = rbcGeo(), dummy = new THREE.Object3D();
    const std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .72 }, o));
    /* 앞으로 지나는 모세혈관: 지나가며 색이 바뀐다 */
    const tubeCol = (g, a, b) => { const pp = g.attributes.position, col = new Float32Array(pp.count * 3), ca = new THREE.Color(a), cb = new THREE.Color(b), c = new THREE.Color(); for (let i = 0; i < pp.count; i++) { c.copy(ca).lerp(cb, smooth(-4, 4, pp.getX(i))); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(col, 3)); };
    const wallT = C3.canvasTex(1024, 256, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(120,70,70,.32)'; g.lineWidth = 2; for (let x = 0; x < 9; x++) { for (let y = 0; y < 3; y++) { const X = (x + (y % 2) * .5) * w / 8, Y = (y + .5) * h / 3; g.beginPath(); g.ellipse(X, Y, w / 18, h / 7, 0, 0, 6.3); g.stroke(); g.fillStyle = 'rgba(150,90,110,.28)'; g.beginPath(); g.ellipse(X, Y, 16, 9, 0, 0, 6.3); g.fill(); } } });
    wallT.wrapS = wallT.wrapT = THREE.RepeatWrapping;
    const mkCap = (par, a, b) => {
      const back = new THREE.Mesh(new THREE.CylinderGeometry(capR * .985, capR * .985, capL, 48, 16, true, Math.PI / 2, Math.PI), std('#fff', { vertexColors: true, side: THREE.DoubleSide, map: wallT })); back.geometry.rotateZ(Math.PI / 2); tubeCol(back.geometry, a, b); back.renderOrder = 1; par.add(back);
      const front = new THREE.Mesh(new THREE.CylinderGeometry(capR, capR, capL, 48, 16, true, -Math.PI / 2, Math.PI), std('#fff', { vertexColors: true, transparent: true, opacity: .28, depthWrite: false, side: THREE.DoubleSide })); front.geometry.rotateZ(Math.PI / 2); tubeCol(front.geometry, a, b); front.renderOrder = 5; par.add(front);
    };
    const thin = (par, pts, r, a, b) => { const c = new THREE.CatmullRomCurve3(pts), g = new THREE.TubeGeometry(c, 60, r, 10, false); const pp = g.attributes.position, col = new Float32Array(pp.count * 3), ca = new THREE.Color(a), cb = new THREE.Color(b), cc = new THREE.Color(); for (let i = 0; i < pp.count; i++) { cc.copy(ca).lerp(cb, smooth(-7, 7, pp.getX(i))); col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b; } g.setAttribute('color', new THREE.BufferAttribute(col, 3)); const m = new THREE.Mesh(g, std('#fff', { vertexColors: true })); par.add(m); return m; };
    /* --- 폐: 폐 속 공기 주머니 사이를 지나는 모세혈관 --- */
    const sacG = lumpy(5, .018, 3.1, 1.4);
    const sacs = [[-1.6, 6.15, -2.3, 5.2], [4.6, 6.5, -2.9, 4.2], [-6.6, 5.7, -3.2, 3.8], [1.6, -6.15, -2.3, 5.2], [-4.6, -6.5, -2.9, 4.2], [6.6, -5.7, -3.2, 3.8]];
    const sacM = std('#f6c9c0', { transparent: true, opacity: .34, depthWrite: false, side: THREE.FrontSide }), sacB = new THREE.MeshLambertMaterial({ color: '#fbe6e1', emissive: '#f4c9c1', emissiveIntensity: .55, side: THREE.BackSide });
    sacs.forEach(([x, y, z, s]) => { const a = new THREE.Mesh(sacG, sacB); a.position.set(x, y, z); a.scale.setScalar(s); a.rotation.set(x, y, 0); part.lung.add(a); const b = new THREE.Mesh(sacG, sacM); b.position.copy(a.position); b.scale.copy(a.scale); b.rotation.copy(a.rotation); b.renderOrder = 3; part.lung.add(b); });
    /* 공기 주머니 겉을 감싼 가는 모세혈관 */
    sacs.forEach(([x, y, z, s], k) => { for (let j = 0; j < 5; j++) { const ph = -1.2 + j * .6 + k * .13, py = y > 0 ? -1 : 1, pts = []; for (let t = 0; t <= 6; t++) { const th = -1.25 + t / 6 * 2.5, tilt = ph + Math.sin(t * 1.3 + j) * .16, X = Math.sin(th), Yc = Math.cos(th) * Math.sin(tilt), Zc = Math.cos(th) * Math.cos(tilt); pts.push(V(x + X * s * 1.01, y + Yc * s * 1.01, z + Zc * s * 1.01)); } thin(part.lung, pts, .085, '#3f5fc2', '#d8392e'); } });
    mkCap(part.lung, '#6a78c8', '#ea6a5c');
    /* --- 온몸: 세포 사이를 지나는 모세혈관 --- */
    const cG = lumpy(3, .035, 2.6, 2), nucG = new THREE.SphereGeometry(.42, 18, 14);
    const cellM = std('#f4b98e', { transparent: true, opacity: .82 }), nucM = std('#8f5f9e');
    const cells = [];
    const placeC = (x, y, z, s) => { const m = new THREE.Mesh(cG, cellM); m.position.set(x, y, z); m.scale.setScalar(s); m.rotation.set(rnd(0, 6), rnd(0, 6), 0); m.renderOrder = 2; part.body.add(m); const n = new THREE.Mesh(nucG, nucM); n.position.set(x + rnd(-.3, .3), y + rnd(-.25, .25), z + rnd(-.2, .4)); part.body.add(n); cells.push({ p: m.position, s }); };
    for (let ix = -4; ix <= 4; ix++) { [[2.2, 0], [-2.2, 0], [4.0, 0], [-4.0, 0], [5.8, 0], [-5.8, 0], [.1, -2.6]].forEach(([y, z], j) => { placeC(ix * 1.95 + (Math.abs(y) > 3 && Math.abs(y) < 5 ? .97 : 0) + rnd(-.06, .06), y + rnd(-.06, .06), z + rnd(-.1, .1), rnd(.94, 1.02)); }); void 0; }
    mkCap(part.body, '#ea6a5c', '#6a78c8');
    /* 혈액: 적혈구 */
    const NR = 8, rm = new THREE.InstancedMesh(RB, new THREE.MeshStandardMaterial({ roughness: .55 }), NR); rm.frustumCulled = false; rm.renderOrder = 4; G.add(rm);
    const rb = Array.from({ length: NR }, (_, i) => ({ x: -capL / 2 + i * capL / NR, c: new THREE.Color(), s: rnd(0, 6) }));
    const M = molGeos(), mols = [];
    const pool = (key, n, s) => { for (let i = 0; i < n; i++) { const o = M[key].clone(); o.visible = false; o.scale.setScalar(s); G.add(o); mols.push({ o, key, t: 0, dur: rnd(2.2, 3.2), s, a: V(), b: V(), active: false, wait: rnd(0, 3) }); } };
    pool('o2', 12, .36); pool('co2', 12, .33); pool('nut', 8, .44); pool('wst', 7, .36);
    let kind = 'lung', spd = 1, ca = new THREE.Color(), cb = new THREE.Color();
    const spawn = (m) => {
      const x = rnd(-5.6, 5.6), up = Math.random() < .5 ? 1 : -1, inward = kind === 'lung' ? m.key === 'o2' : (m.key === 'co2' || m.key === 'wst');
      const inside = V(x, up * .25, rnd(-.2, .2)); let out;
      if (kind === 'lung') { const sc = sacs[Math.floor(Math.random() * 6)], sy = up > 0 ? sacs[Math.floor(Math.random() * 3)] : sacs[3 + Math.floor(Math.random() * 3)]; void sc; out = V(x + rnd(-1, 1), up * rnd(2.6, 3.9), rnd(-1.2, .3)); void sy; }
      else { const c = cells.filter((q) => Math.sign(q.p.y) === up && Math.abs(q.p.y) < 3 && Math.abs(q.p.x - x) < 1.6); const t = c.length ? c[Math.floor(Math.random() * c.length)] : null; out = t ? t.p.clone().add(V(rnd(-.4, .4), rnd(-.2, .2), rnd(0, .5))) : V(x, up * 2, 0); }
      m.a.copy(inward ? out : inside); m.b.copy(inward ? inside : out); m.active = true; m.t = 0; m.o.visible = true;
    };
    const tick = (dt) => {
      if (!G.visible) return; const d = dt * spd;
      const t0 = kind === 'lung' ? .2 : .1, t1 = kind === 'lung' ? .72 : .92;
      rb.forEach((r, i) => { r.x += .62 * d; if (r.x > capL / 2) r.x = -capL / 2; const t = (r.x + capL / 2) / capL; r.c.copy(ca).lerp(cb, smooth(t0, t1, t)); dummy.position.set(r.x, Math.sin(i * 1.7 + r.x * .4) * .1, Math.cos(i) * .05); dummy.rotation.set(1.2, .35 + Math.sin(r.x + r.s) * .4, 0); dummy.scale.setScalar(.58); dummy.updateMatrix(); rm.setMatrixAt(i, dummy.matrix); rm.setColorAt(i, r.c); });
      rm.instanceMatrix.needsUpdate = true; if (rm.instanceColor) rm.instanceColor.needsUpdate = true;
      mols.forEach((m) => { const use = kind === 'lung' ? (m.key === 'o2' || m.key === 'co2') : true; if (!use) { m.o.visible = false; m.active = false; return; } if (!m.active) { m.wait -= d; if (m.wait <= 0) spawn(m); return; } m.t += d / m.dur; if (m.t >= 1) { m.active = false; m.o.visible = false; m.wait = rnd(.1, 1.1); return; } const e = m.t * m.t * (3 - 2 * m.t); m.o.position.lerpVectors(m.a, m.b, e); m.o.rotation.set(m.t * 3, m.t * 4, 0); m.o.scale.setScalar(m.s * Math.min(1, Math.min(m.t, 1 - m.t) * 7)); });
    };
    st.onFrame(() => { tick(clk.dt); });
    const box = new THREE.Mesh(new THREE.BoxGeometry(14, 10, 1)); box.visible = false; G.add(box);
    lab.add('xL1', '폐동맥 쪽에서', V(-6.6, 0, 0), .05, .2, '', { c: 1, x: .15, y: .5, at: null });
    lab.add('xL2', '폐정맥 쪽으로', null, .85, .5, '', { c: 1 });
    lab.add('xAir', '폐 속 공기', null, .5, .1, 'b', { c: 1 });
    lab.add('xCap', '폐의 모세혈관', V(1, .85, .4), .68, .34, 'b');
    lab.add('xB1', '대동맥 쪽에서', null, .15, .5, '', { c: 1 });
    lab.add('xB2', '대정맥 쪽으로', null, .85, .5, '', { c: 1 });
    lab.add('xCell', '세포', V(-2.6, 2.2, 1), .1, .1, 'b');
    lab.add('xCap2', '온몸의 모세혈관', V(1.5, .85, .4), .68, .34, 'b');
    return {
      G, box,
      set(k) { kind = k; part.lung.visible = k === 'lung'; part.body.visible = k === 'body'; ca.set(k === 'lung' ? COL.blue : COL.red); cb.set(k === 'lung' ? COL.red : COL.blue); mols.forEach((m) => { m.active = false; m.o.visible = false; m.wait = rnd(0, 1.2); }); },
      labs(k) { return k === 'lung' ? ['xL1', 'xL2', 'xAir', 'xCap'] : ['xB1', 'xB2', 'xCell', 'xCap2']; },
      speed(v) { spd = v; },
    };
  }

  /* ===== 온몸 무대 ===== */
  async function world(host, opt = {}) {
    const D = await bodyData(), R = D.m.routes;
    let W = {}, api = {};
    const H = await CV3.heart(host, {
      noLabels: true, speed: .55, view: 'cut',
      extra: async (h) => {
        const st = h.st; st.controls.maxDistance = 400; st.controls.minDistance = 3; st.camera.far = 900; st.camera.updateProjectionMatrix();
        st.renderer.localClippingEnabled = true;
        const K = D.m.K, g = D.m.groups;
        const wrap = new THREE.Group(); st.scene.add(wrap);
        const CLIP = new THREE.Plane(V(0, -1, 0), 1e6);
        const U = { uK: { value: 0 }, uH: { value: 0 }, uP: { value: 0 } };
        const legShader = (mat) => {
          mat.onBeforeCompile = (sh) => {
            Object.assign(sh.uniforms, U);
            sh.vertexShader = LEG_GLSL + '\n' + sh.vertexShader.replace('#include <beginnormal_vertex>', 'vec3 objectNormal=vec3(normal);objectNormal=legN(objectNormal,vec3(position)*' + K.toFixed(4) + ');').replace('#include <begin_vertex>', 'vec3 transformed=leg(vec3(position)*' + K.toFixed(4) + ')/' + K.toFixed(4) + ';');
          };
          mat.customProgramCacheKey = () => 'leg';
          return mat;
        };
        const mk = (ranges, color, o = {}, useLeg = false) => { let m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .56, side: THREE.DoubleSide, clippingPlanes: [CLIP] }, o)); if (useLeg) legShader(m); const me = new THREE.Mesh(D.geo(ranges), m); me.scale.setScalar(K); me.frustumCulled = false; me.userData.base = new THREE.Color(color); wrap.add(me); return me; };
        W.art = mk([g.art], COL.art, {}, true); W.vei = mk([g.vei], COL.vei, {}, true); W.pa = mk([g.pa], '#3f74c8'); W.pv = mk([g.pv], '#d8483c');
        W.bone = mk([g.bone], '#e9e2d2', { roughness: .85 }, true); W.bone.visible = false;
        /* 폐: 깊이를 먼저 그려 가장 앞면만 비치게 한다 */
        const lr = [D.m.lung.L, D.m.lung.R];
        const lungDepth = mk(lr, COL.lung, { colorWrite: false }); lungDepth.renderOrder = 20;
        const lungCol = mk(lr, COL.lung, { transparent: true, opacity: LO, roughness: .82, side: THREE.FrontSide, depthWrite: false, depthFunc: THREE.LessEqualDepth }); lungCol.renderOrder = 21;
        W.lung = lungCol; W.lungD = lungDepth;
        /* 고른 길만 진하게 그리는 조각 */
        W.route = {}; Object.entries(D.m.routeParts).forEach(([k, names]) => { const rs = []; names.forEach((n) => { (D.m.parts[n] || []).forEach((r) => rs.push(r)); }); W.route[k] = { art: mk(rs.filter((r) => r[0] < g.vei[0]), COL.art, {}, true), vei: mk(rs.filter((r) => r[0] >= g.vei[0]), COL.vei, {}, true) }; W.route[k].art.visible = W.route[k].vei.visible = false; });
        W.U = U; W.CLIP = CLIP; W.wrap = wrap;
      },
    });
    const st = H.st, cen = H.cen, Dir = H.Dir;
    const clk = { dt: 0, last: 0 };
    st.onFrame((d) => { if (window.__bakeT !== undefined) { const n = window.__bakeT; clk.dt = Math.max(0, n - clk.last); clk.last = n; } else clk.dt = REDUCE ? 0 : d; });
    const lab = labels(st);

    /* 길 만들기 */
    const P = {}; Object.entries(R).forEach(([k, a]) => { P[k] = toV(a); });
    const rvMid = cen.cavRV.clone().add(Dir.clone().multiplyScalar(.55)), lvMid = cen.cavLV.clone().add(Dir.clone().multiplyScalar(.55));
    const inRV = spline([rvMid, cen.cavRV.clone().add(V(.25, .45, .25)), cen.valPV]), inLV = spline([lvMid, cen.cavLV.clone().add(V(-.35, .55, -.2)), cen.valAV]);
    const toLA = (q) => spline([q[q.length - 1], cen.cavLA], 10), toRA = (q) => spline([q[q.length - 1], cen.cavRA], 10);
    const LAtoLV = spline([cen.cavLA, cen.valMV, cen.cavLV.clone().add(Dir.clone().multiplyScalar(.2)), lvMid]), RAtoRV = spline([cen.cavRA, cen.valTV, cen.cavRV.clone().add(Dir.clone().multiplyScalar(.15)), rvMid]);
    const DEST = { head: ['head', 'v_head'], arm: ['arm', 'v_arm'], leg: ['leg', 'v_leg'] };
    const PATH = {
      paL: new Path(join(inRV, P.pa_L)), paR: new Path(join(inRV, P.pa_R)),
      pvL: new Path(join(P.pv_L, toLA(P.pv_L))), pvR: new Path(join(P.pv_R, toLA(P.pv_R))),
      la: new Path(LAtoLV), ra: new Path(RAtoRV),
    };
    Object.keys(DEST).forEach((k) => { PATH['a_' + k] = new Path(join(inLV, P[DEST[k][0]])); PATH['v_' + k] = new Path(join(P[DEST[k][1]], toRA(P[DEST[k][1]]))); });

    /* ===== 흐르는 혈액 ===== */
    const FL = [];
    const flow = (pts, n, color, grp, sp = 1) => { const p = new Path(pts); for (let i = 0; i < n; i++) FL.push({ p, u: Math.random(), c: new THREE.Color(color), grp, sp: sp * rnd(.85, 1.15), rx: rnd(0, 6), ry: rnd(0, 6), j: V(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)) }); return p; };
    const fp = {};
    ['pa_L', 'pa_R', 'pa_L2', 'pa_R2'].forEach((k) => { fp[k] = flow(P[k], 7, COL.blue, 'p'); });
    ['pv_L', 'pv_R', 'pv_L2', 'pv_R2'].forEach((k) => { fp[k] = flow(P[k], 7, COL.red, 'p'); });
    [['ao_d', 12], ['head', 12], ['head_l', 12], ['arm', 22], ['arm_l', 22], ['leg', 38], ['leg_l', 38]].forEach(([k, n]) => { fp[k] = flow(P[k], n, COL.red, 'b'); });
    [['v_head', 8], ['v_head_l', 8], ['v_arm', 20], ['v_arm_l', 20], ['v_leg', 32], ['v_leg_l', 32]].forEach(([k, n]) => { fp[k] = flow(P[k], n, COL.blue, 'b', .8); });
    const RB = rbcGeo(), fim = new THREE.InstancedMesh(RB, new THREE.MeshStandardMaterial({ roughness: .55, depthTest: false, transparent: true }), FL.length); fim.renderOrder = 60; fim.frustumCulled = false; st.scene.add(fim);
    FL.forEach((f, i) => fim.setColorAt(i, f.c));
    const dummy = new THREE.Object3D(), tp = V();
    let flowOn = true, flowMode = 'all', flowSp = 1, press = 0, legOnly = false;
    const camDist = () => st.camera.position.distanceTo(st.controls.target);

    /* 다리 굽힘(그림자와 같은 계산): 셰이더 LEG_GLSL과 같다 */
    const KN = { y: -29.4, z: -1.75 }, HP = { y: -13.6, z: -1.3 };
    const bend = (o) => {
      const uK = W.U.uK.value, uH = W.U.uH.value; if (!uK && !uH) return o;
      const w = smooth(KN.y + 1.6, KN.y - 1.6, o.y), a = uK * w, c = Math.cos(a), s = Math.sin(a), y0 = o.y - KN.y, z0 = o.z - KN.z; o.y = KN.y + y0 * c - z0 * s; o.z = KN.z + y0 * s + z0 * c;
      const w2 = smooth(HP.y + 3, HP.y - 3, o.y), b = uH * w2, c2 = Math.cos(b), s2 = Math.sin(b), y1 = o.y - HP.y, z1 = o.z - HP.z; o.y = HP.y + y1 * c2 - z1 * s2; o.z = HP.z + y1 * s2 + z1 * c2;
      return o;
    };
    const kneeU = (p) => { let best = 0, d = 1e9; for (let i = 0; i < p.p.length; i++) { const q = Math.abs(p.p[i].y - KN.y); if (q < d) { d = q; best = i; } } return p.c[best] / p.len; };
    const legFlows = FL.filter((f) => f.p === fp.leg || f.p === fp.leg_l || f.p === fp.v_leg || f.p === fp.v_leg_l); legFlows.forEach((f) => { f.ku = kneeU(f.p); f.art = f.p === fp.leg || f.p === fp.leg_l; f.hipU = 0; for (let i = 0; i < f.p.p.length; i++) { if (f.art ? f.p.p[i].y > -12 : false) f.hipU = f.p.c[i] / f.p.len; } if (!f.art) { let h = 1; for (let i = f.p.p.length - 1; i >= 0; i--) { if (f.p.p[i].y < -12) { h = f.p.c[i] / f.p.len; break; } } f.endU = h; } });

    let scl = 1;
    st.onFrame(() => {
      const dt = clk.dt;
      const d = camDist(); scl = Math.max(.11, Math.min(.3, d * .0023));
      const beat = H.U.uSV.value / 2.2, pulse = 1 + beat * .9;
      FL.forEach((f, i) => {
        const show = flowOn && (flowMode === 'all' || flowMode === f.grp) && (!legOnly || legFlows.includes(f));
        if (!show) { dummy.position.set(0, 0, 0); dummy.scale.setScalar(0); dummy.updateMatrix(); fim.setMatrixAt(i, dummy.matrix); return; }
        let spd = 5.2 * flowSp * f.sp * (f.grp === 'b' && f.c.r > .5 ? pulse : 1);
        if (legOnly && f.ku !== undefined) { const below = f.art ? f.u > f.ku - .02 : f.u < f.ku + .02; if (below) spd *= 1 - .9 * press; else spd *= 1 - .55 * press; if (f.art && f.u < f.hipU) f.u = f.hipU + Math.random() * .05; if (!f.art && f.u > f.endU) f.u = 0; }
        f.u += dt * spd / f.p.len; if (f.u > 1) f.u = 0;
        f.p.at(f.u, tp); if (legOnly) bend(tp);
        const fade = Math.min(1, f.u / .012, (1 - f.u) / .012);
        dummy.position.copy(tp); dummy.rotation.set(f.rx + f.u * 20, f.ry + f.u * 12, 0); dummy.scale.setScalar(scl * fade); dummy.updateMatrix(); fim.setMatrixAt(i, dummy.matrix);
      });
      fim.instanceMatrix.needsUpdate = true;
    });

    /* ===== 주인공 적혈구와 지나온 길 ===== */
    const heroM = new THREE.MeshStandardMaterial({ color: COL.blue, roughness: .5, depthTest: false, transparent: true }), hero = new THREE.Mesh(RB, heroM); hero.renderOrder = 72; st.scene.add(hero);
    const edge = new THREE.Mesh(RB, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide, depthTest: false, transparent: true })); edge.renderOrder = 71; st.scene.add(edge);
    const heroCol = new THREE.Color(COL.blue); let heroSpin = 0;
    const heroAt = (p) => { hero.position.copy(p); edge.position.copy(p); };
    heroAt(rvMid);
    st.onFrame(() => { const d = camDist(), s = Math.max(.3, Math.min(1.05, d * .0085)); heroSpin += clk.dt * 1.6; hero.scale.setScalar(s); edge.scale.setScalar(s * 1.2); hero.rotation.set(1 + Math.sin(heroSpin) * .5, heroSpin * .6, 0); edge.rotation.copy(hero.rotation); });
    let trail = null;
    const setTrail = (pts, color) => { if (trail) { st.scene.remove(trail); trail.geometry.dispose(); trail = null; } if (!pts) return; const c = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); const seg = Math.min(420, 30 + pts.length * 2), g = new THREE.TubeGeometry(c, seg, Math.max(.05, Math.min(.2, c.getLength() * .0045 + .05)), 6, false); trail = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: .55 })); trail.renderOrder = 55; st.scene.add(trail); g.setDrawRange(0, 0); return g.index.count; };

    /* ===== 시점 ===== */
    const box = (x0, x1, y0, y1, z0 = -1, z1 = 1) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0)); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.visible = false; st.scene.add(m); return m; };
    const VIEW = { heart: box(-2.5, 2.5, -2.3, 3.3, -.25, .25), thorax: box(-5.4, 5.4, -7.2, 6.2), all: box(-12.5, 11, -45.5, 14.2), arm: box(-11, 3, -16, 7), legSt: box(-5, 5, -46.5, -11, -4, 4), legKn: box(-5, 5, -27, -9, -15, 20), lungs: box(-5, 5, -7, 6), legAll: box(-5, 5, -46.5, -11, -15, 15), card: box(-5.4, 5.4, -5, 4.2) };
    const micro = microScene(st, lab, clk);
    let curView = 'heart', inMicro = false, viewKey = 'heart';
    const showWorld = (v) => { W.wrap.visible = v; fim.visible = v; hero.visible = edge.visible = v && heroVis; Object.values(H.meshes).forEach((m) => { m.parent.visible = v; }); if (trail) trail.visible = v; };
    let heroVis = true;
    const flash = document.createElement('div'); flash.style.cssText = 'position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:2;transition:opacity .28s'; host.appendChild(flash);
    const fadeSwap = (fn) => { if (REDUCE || window.__bakeT !== undefined) { fn(); return; } flash.style.opacity = 1; setTimeout(() => { fn(); flash.style.opacity = 0; }, 300); };
    const setCam = (k, dur = 1.3) => {
      viewKey = k; if (window.__bakeT !== undefined) dur = 0;
      if (k === 'micro') { st.fit([micro.box], { dir: V(0, 0, 1), margin: 1, dur: 0, target: V(0, 0, 0) }); return; }
      const dir = k === 'heart' ? H.N.clone() : k === 'thorax' || k === 'card' ? V(0, .06, 1) : k === 'all' ? V(.02, .02, 1) : k === 'arm' ? V(-.1, .05, 1) : V(1, .14, .22);
      st.fit([VIEW[k]], { dir, margin: k === 'all' ? 1.02 : 1.03, dur, target: VIEW[k].position.clone() });
    };
    const heartView = (k) => { H.view(k === 'heart' ? 'cut' : 'out'); W.wrap.visible = k !== 'heart'; fim.visible = k !== 'heart'; };

    /* ===== 이름표 ===== */
    const midOf = (a, t) => a[Math.floor((a.length - 1) * t)];
    lab.add('ra', '우심방', cen.cavRA.clone().add(V(-.1, .15, 0)), .14, .36, 'b', { px: .1, py: .34 });
    lab.add('rv', '우심실', cen.cavRV.clone().add(Dir.clone().multiplyScalar(.55)), .14, .68, 'b', { px: .1, py: .68 });
    lab.add('la', '좌심방', cen.cavLA.clone().add(V(.3, .1, 0)), .86, .42, 'b', { px: .9, py: .4 });
    lab.add('lv', '좌심실', cen.cavLV.clone().add(Dir.clone().multiplyScalar(.45)), .86, .7, 'b', { px: .9, py: .7 });
    lab.add('pa0', '폐동맥', V(.55, 1.5, .6), .86, .12, '', { px: .9, py: .1 });
    lab.add('ao0', '대동맥', V(.1, 1.9, -.6), .86, .24, '', { px: .9, py: .22 });
    lab.add('vc0', '대정맥', V(cen.svc.x, 2.3, cen.svc.z), .14, .14, '', { px: .1, py: .12 });
    lab.add('pv0', '폐정맥', cen.cavLA.clone().add(V(1.1, .3, -.5)), .86, .33, '', { px: .9, py: .31 });
    lab.add('lungL', '폐', V(3.2, -.5, 1.6), .9, .5, 'b', { px: .92, py: .55 });
    lab.add('lungR', '폐', V(-3.4, -.5, 1.6), .1, .5, 'b', { px: .08, py: .55 });
    lab.add('pa1', '폐동맥', midOf(P.pa_L2, .42), .86, .14, 'b', { px: .9, py: .08 });
    lab.add('pv1', '폐정맥', midOf(P.pv_L, .55), .9, .3, 'b', { px: .92, py: .3 });
    lab.add('ao1', '대동맥', midOf(P.ao_d, .7), .74, .36, 'b', { px: .8, py: .34 });
    lab.add('vc1', '대정맥', midOf(P.v_leg, .92), .26, .36, 'b', { px: .2, py: .34 });
    lab.add('hrt', '심장', V(.6, 0, 1.4), .74, .23, 'b', { px: .8, py: .22 });
    lab.add('lng', '폐', V(-3.2, 1, 1), .26, .17, 'b', { px: .2, py: .17 });
    lab.add('hd', '머리', V(0, 11, 0), .58, .06, '', { px: .62, py: .05 });
    lab.add('am', '팔', V(-8.5, -10, 0), .2, .52, '', { px: .15, py: .5 });
    lab.add('lg', '다리', V(3, -32, 0), .68, .78, '', { px: .72, py: .78 });
    lab.add('hip', '허벅지', () => bend(V(-3.5, -21, 0)), .15, .25, '');
    lab.add('kne', '무릎 뒤쪽 혈관', () => bend(V(-3.2, KN.y, -1.7)), .15, .5, 'b');
    lab.add('cal', '종아리', () => bend(V(-3.5, -37, -1)), .85, .75, '');
    lab.add('art2', '동맥', () => bend(V(-3.2, -36.6, -1.5)), .85, .3, '');
    lab.add('vei2', '정맥', () => bend(V(-3.5, -24, -.4)), .15, .75, '');
    const LABS = { heart: ['ra', 'rv', 'la', 'lv', 'pa0', 'ao0', 'vc0', 'pv0'], thorax: ['lungL', 'lungR', 'pa1', 'pv1'], all: ['hrt', 'lng', 'ao1', 'vc1', 'hd', 'am', 'lg'], none: [] };
    const showLabs = (k) => lab.only(LABS[k] || k || []);

    /* ===== 집중 ===== */
    const DIM = new THREE.Color(COL.dim);
    const paint = (me, on, amt = .86) => { me.material.color.copy(me.userData.base); if (!on) me.material.color.lerp(DIM, amt); };
    let destK = null;
    const focus = (m) => {
      flowMode = m === 'p' ? 'p' : m === 'b' ? 'b' : 'all';
      paint(W.pa, m !== 'b'); paint(W.pv, m !== 'b'); paint(W.art, m !== 'p' && !destK); paint(W.vei, m !== 'p' && !destK);
      W.lung.material.opacity = m === 'b' ? .1 : LO;
      Object.entries(W.route).forEach(([k, r]) => { r.art.visible = r.vei.visible = m !== 'p' && destK === k; });
    };

    /* ===== 차례 =====
       s: 이름, view: 시점, labs: 이름표, path(dest): 도착까지의 길, col: 도착했을 때 혈액 색 */
    const STN = [
      { k: 'rv', view: 'heart', col: COL.blue, at: () => rvMid },
      { k: 'pa', view: 'thorax', fc: 'p', col: COL.blue, path: () => PATH.paL, hue: '#4a68c8', dur: 2.6 },
      { k: 'lc', view: 'micro', micro: 'lung', col: COL.red },
      { k: 'pv', view: 'thorax', fc: 'p', col: COL.red, path: () => PATH.pvL, hue: '#e0554a', dur: 2.2, labs: ['lungL', 'lungR', 'pa1', 'pv1'] },
      { k: 'la', view: 'heart', col: COL.red, at: () => cen.cavLA },
      { k: 'lv', view: 'heart', col: COL.red, path: () => PATH.la, hue: '#e0554a', dur: 1.8 },
      { k: 'ao', view: 'all', fc: 'b', col: COL.red, path: () => PATH['a_' + destK], hue: '#e0554a', dur: 4.2 },
      { k: 'bc', view: 'micro', micro: 'body', col: COL.blue },
      { k: 'vc', view: 'all', fc: 'b', col: COL.blue, path: () => PATH['v_' + destK], hue: '#4a68c8', dur: 4.2 },
      { k: 'ra', view: 'heart', col: COL.blue, at: () => cen.cavRA },
      { k: 'rv2', view: 'heart', col: COL.blue, path: () => PATH.ra, hue: '#4a68c8', dur: 1.8 },
    ];
    let idx = 0, anim = null;
    st.onFrame(() => {
      const dt = REDUCE ? 1e3 : clk.dt; if (!anim) return;
      anim.t += dt / anim.dur; const t = Math.min(1, anim.t), e = t * t * (3 - 2 * t), u = anim.ease ? e : (.15 * t + .85 * e);
      if (anim.path) { anim.path.at(u, tp); heroAt(tp); if (trail) trail.geometry.setDrawRange(0, Math.floor(anim.tri * u / 3) * 3); }
      if (anim.c0) { heroCol.copy(anim.c0).lerp(anim.c1, smooth(.1, .9, t)); heroM.color.copy(heroCol); }
      if (t >= 1) { const cb = anim.cb; anim = null; cb && cb(); }
    });
    const enterMicro = (kind) => { inMicro = true; micro.set(kind); micro.G.visible = true; showWorld(false); setTrail(null); setCam('micro'); showLabs(micro.labs(kind)); };
    const leaveMicro = () => { inMicro = false; micro.G.visible = false; showWorld(true); };
    const goto = (i, cb) => {
      const S = STN[i]; idx = i;
      const dest = () => { anim = null; };
      dest();
      if (S.micro) {
        const prev = STN[i - 1];
        const flyIn = () => fadeSwap(() => { enterMicro(S.micro); heroM.color.set(S.col); cb && cb(); });
        void prev; flyIn(); return;
      }
      const go = () => {
        heartView(S.view); setCam(S.view, 1.2); showLabs(S.labs || S.view); focus(S.fc || 'all');
        const c1 = new THREE.Color(S.col);
        if (S.path) {
          const p = S.path(), tri = setTrail(p.p, S.hue);
          anim = { t: 0, dur: REDUCE ? .01 : S.dur, path: p, tri, c0: heroCol.clone(), c1, cb: () => { heroCol.copy(c1); cb && cb(); } };
        } else {
          heroAt(S.at()); heroCol.copy(c1); heroM.color.copy(c1); setTrail(null); setTimeout(() => cb && cb(), REDUCE ? 0 : 700);
        }
      };
      if (inMicro) fadeSwap(() => { leaveMicro(); go(); }); else go();
    };

    /* ===== 정맥 주사 ===== */
    const NIV = 150, drugM = new THREE.MeshStandardMaterial({ color: COL.drug, roughness: .5, depthTest: false, transparent: true }), drugG = new THREE.SphereGeometry(1, 12, 10), dim = new THREE.InstancedMesh(drugG, drugM, NIV); dim.renderOrder = 66; dim.frustumCulled = false; dim.visible = false; st.scene.add(dim);
    const LUNGS = [['pa_L', 'pv_L'], ['pa_R', 'pv_R'], ['pa_L2', 'pv_L2'], ['pa_R2', 'pv_R2']], ENDS = ['head', 'head_l', 'arm', 'arm_l', 'leg', 'leg_l'];
    const LAST = {}; ENDS.forEach((k) => { LAST[k] = join(inLV, P[k]); });
    let iv = null;
    const startIV = () => {
      const legs = [];
      const pre = join(P.iv, spline([P.iv[P.iv.length - 1], cen.cavRA, cen.valTV, cen.cavRV.clone().add(Dir.clone().multiplyScalar(.15)), rvMid, cen.cavRV.clone().add(V(.25, .45, .25)), cen.valPV], 40));
      const markA = new Path(pre);
      LUNGS.forEach(([a, b]) => { ENDS.forEach((e) => { const pts1 = join(pre, P[a]), pts2 = join(P[b], toLA(P[b]), LAtoLV, LAST[e]); legs.push({ a: new Path(pts1), b: new Path(pts2), e }); }); });
      /* 차례 표시: 길의 어느 곳을 지나는지 첫 입자로 판단 */
      const lead = legs[12]; const mA = lead.a, mB = lead.b;
      const uOf = (p, q) => { let b = 0, d = 1e9; for (let i = 0; i < p.p.length; i++) { const x = p.p[i].distanceToSquared(q); if (x < d) { d = x; b = i; } } return p.c[b] / p.len; };
      const marks = [[0, 0, '주사'], [0, uOf(mA, P.iv[Math.floor(P.iv.length * .85)]), '대정맥'], [0, uOf(mA, cen.cavRA), '우심방'], [0, uOf(mA, rvMid), '우심실'], [0, uOf(mA, P.pa_L[3]), '폐동맥'], [0, .96, '폐'], [1, 0, '폐정맥'], [1, uOf(mB, cen.cavLA), '좌심방'], [1, uOf(mB, lvMid), '좌심실'], [1, uOf(mB, cen.valAV) + .01, '대동맥'], [1, .55, '온몸']];
      iv = { t: 0, its: Array.from({ length: NIV }, (_, i) => ({ d: i * .03 + rnd(0, .1), s: 0, u: 0, L: legs[Math.floor(Math.random() * legs.length)], sp: rnd(.9, 1.15), j: V(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)) })), legs, lead: { s: 0, u: 0, L: lead, sp: 1 }, marks, step: 0, cb: null };
      iv.its[0].L = lead; iv.its[0].d = 0; iv.its[0].sp = 1; iv.lead = iv.its[0];
      dim.visible = true;
    };
    const stopIV = () => { iv = null; dim.visible = false; };
    let onMark = null;
    st.onFrame(() => {
      if (!iv) return; const dt = REDUCE ? .1 : clk.dt; iv.t += dt;
      const d = camDist(), s = Math.max(.14, Math.min(.36, d * .0032));
      iv.its.forEach((m, i) => {
        if (iv.t < m.d) { dummy.scale.setScalar(0); dummy.position.set(0, 0, 0); dummy.updateMatrix(); dim.setMatrixAt(i, dummy.matrix); return; }
        const p = m.s === 0 ? m.L.a : m.L.b; m.u += dt * 8.2 * m.sp / p.len;
        if (m.u >= 1) { if (m.s === 0) { m.s = 1; m.u = 0; } else { m.u = .4 + Math.random() * .6; } }
        p.at(m.u, tp); dummy.position.copy(tp); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(s); dummy.updateMatrix(); dim.setMatrixAt(i, dummy.matrix);
      });
      dim.instanceMatrix.needsUpdate = true;
      const L = iv.lead; let st_ = iv.step; for (let i = 0; i < iv.marks.length; i++) { const k = iv.marks[i]; if (L.s > k[0] || (L.s === k[0] && L.u >= k[1])) st_ = Math.max(st_, i); } if (st_ !== iv.step) { iv.step = st_; onMark && onMark(st_, iv.marks[st_][2]); }
    });

    /* ===== 무릎 꿇기 ===== */
    let kneel = 0, kneelTo = 0, kneeCb = null, floor = null;
    const setLeg = (on) => {
      legOnly = on; W.CLIP.constant = on ? -10.5 : 1e6; W.bone.visible = on;
      [W.pa, W.pv, W.lung, W.lungD].forEach((m) => { m.visible = !on; });
      H.meshes.wallV.parent.visible = !on;
      if (!on) heartView('all');
      Object.values(W.route).forEach((r) => { r.art.visible = r.vei.visible = false; });
      hero.visible = edge.visible = heroVis = !on;
      if (!floor) { const g = new THREE.CircleGeometry(15, 64); floor = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#f1f4f7', toneMapped: false })); floor.rotation.x = -Math.PI / 2; floor.position.y = -45.6; floor.renderOrder = -2; st.scene.add(floor); }
      floor.visible = on;
    };
    st.onFrame(() => {
      const dt = REDUCE ? 10 : clk.dt; const prev = kneel;
      kneel += Math.sign(kneelTo - kneel) * Math.min(Math.abs(kneelTo - kneel), dt * .55);
      const e = smooth(0, 1, kneel); W.U.uK.value = 2.92 * e; W.U.uH.value = -1.42 * e; W.U.uP.value = smooth(.55, 1, kneel); press = smooth(.5, 1, kneel);
      if (floor) floor.position.y = -45.6 + (-23.2 + 45.6) * e;
      const LL = lab.L; if (LL.kne) { const k = kneel > .5; LL.kne.x = k ? .3 : .22; LL.kne.y = k ? .82 : .5; LL.hip.x = k ? .86 : .15; LL.hip.y = k ? .14 : .25; LL.cal.x = k ? .86 : .85; LL.cal.y = k ? .86 : .75; }
      if (prev !== kneel && kneel === kneelTo && kneeCb) { const c = kneeCb; kneeCb = null; c(); }
    });

    const heartN = H.N;
    const spinRig = { on: false, a: 0, dist: 0 };
    st.onFrame(() => { if (!spinRig.on) return; const T = window.__bakeT || 0, a = T / spinRig.T * Math.PI * 2; const t = st.controls.target; st.camera.position.set(t.x + Math.sin(a) * spinRig.d, t.y + spinRig.dy, t.z + Math.cos(a) * spinRig.d); st.scene.children.filter((o) => o.isDirectionalLight).forEach((o) => { if (!o.userData.p0) o.userData.p0 = o.position.clone(); o.position.copy(o.userData.p0).applyAxisAngle(V(0, 1, 0), a); }); });
    Object.defineProperties(api, Object.getOwnPropertyDescriptors({
      st, H, W, STN, P, cen, lab, micro, COL,
      goto, focus, showLabs, setCam, heartView,
      get idx() { return idx; }, set idx(v) { idx = v; },
      dest(k) { destK = k; }, get destK() { return destK; },
      place(i) { const S = STN[i]; idx = i; if (inMicro) leaveMicro(); anim = null; setTrail(null); heartView(S.view === 'micro' ? 'all' : S.view); heroCol.set(S.col); heroM.color.copy(heroCol); const q = S.at ? S.at() : S.path().at(1); heroAt(q); setCam(S.view === 'micro' ? 'thorax' : S.view, 0); showLabs(S.labs || S.view); focus(S.fc || 'all'); },
      enterMicro, leaveMicro,
      hero(v) { heroVis = v; hero.visible = edge.visible = v; },
      flows(v) { flowOn = v; }, flowSpeed(v) { flowSp = v; },
      flowTint(a) { const c = new THREE.Color(), pale = new THREE.Color('#c9d2dc'); FL.forEach((f, i) => { c.copy(f.c).lerp(pale, a); fim.setColorAt(i, c); }); fim.instanceColor.needsUpdate = true; },
      startIV, stopIV, onMark(f) { onMark = f; },
      setLeg, kneel(to, cb) { kneelTo = to; kneeCb = cb || null; }, get kneelV() { return kneel; },
      spin(T, d, dy) { spinRig.on = true; spinRig.T = T; spinRig.d = d; spinRig.dy = dy || 0; },
      heartN,
      numberHeart() { heroVis = false; hero.visible = edge.visible = false; heartView('heart'); H.flows.forEach((f) => { f.im.visible = false; }); setCam('heart', 0); showLabs('heart'); ['ra', 'rv', 'la', 'lv', 'pa0', 'ao0', 'vc0', 'pv0'].forEach((k, i) => { lab.L[k].e.textContent = String(i + 1); lab.L[k].e.className = 'hl b'; }); },
      /* 지도에 넣을 사진 찍기 */
      figure(k) {
        flowOn = false; heroVis = false; hero.visible = edge.visible = false; showLabs('none'); focus('all'); W.wrap.visible = k !== 'heart'; fim.visible = k !== 'heart';
        const show = (a) => { [W.art, W.vei, W.pa, W.pv, W.lung, W.lungD].forEach((m) => { m.visible = a.includes(m); }); };
        if (k === 'lung') { show([W.pa, W.pv, W.lung, W.lungD]); H.meshes.wallV.parent.visible = false; W.lung.material.opacity = .62; st.fit([VIEW.lungs], { dir: V(0, .04, 1), margin: 1.01, dur: 0, target: VIEW.lungs.position.clone() }); }
        if (k === 'heart') { show([]); H.view('cut'); H.flows.forEach((f) => { f.im.visible = false; }); setCam('heart', 0); }
        if (k === 'body') { show([W.art, W.vei]); H.view('out'); setCam('all', 0); }
        if (k === 'card') { show([W.pa, W.pv, W.lung, W.lungD]); H.view('out'); W.lung.material.opacity = .5; setCam('card', 0); }
        if (k === 'whole') { show([W.art, W.vei, W.pa, W.pv, W.lung, W.lungD]); W.lung.material.opacity = .5; H.view('out'); setCam('all', 0); }
      },
    }));
    return api;
  }
  /* 무릎·엉덩이를 굽히는 계산 (bend와 같다). 눌리는 곳은 오금 혈관을 조인다 */
  const LEG_GLSL = `uniform float uK,uH,uP;
    const vec2 KN=vec2(-29.4,-1.75),HP=vec2(-13.6,-1.3);
    vec3 rotX(vec3 v,float a){float c=cos(a),s=sin(a);return vec3(v.x,v.y*c-v.z*s,v.y*s+v.z*c);}
    vec3 leg(vec3 p){
      if(uP>0.){float w=exp(-pow((p.y-KN.x)/1.9,2.));vec2 c=vec2(2.35,-1.8);vec2 d=vec2(abs(p.x),p.z)-c;float m=(1.-smoothstep(.9,1.6,length(d)))*w*uP*.72;d*=1.-m;float sx=p.x<0.?-1.:1.;p.x=sx*(c.x+d.x);p.z=c.y+d.y;}
      float w=smoothstep(KN.x+1.6,KN.x-1.6,p.y);vec3 q=p-vec3(0.,KN.x,KN.y);q=rotX(q,uK*w);p=q+vec3(0.,KN.x,KN.y);
      float w2=smoothstep(HP.x+3.,HP.x-3.,p.y);q=p-vec3(0.,HP.x,HP.y);q=rotX(q,uH*w2);return q+vec3(0.,HP.x,HP.y);}
    vec3 legN(vec3 n,vec3 p){float w=smoothstep(KN.x+1.6,KN.x-1.6,p.y);vec3 q=rotX(n,uK*w);float w2=smoothstep(HP.x+3.,HP.x-3.,p.y);return rotX(q,uH*w2);}`;
  return { world, bodyData, rbcGeo, lumpy, molGeos, labels, Path };
})();
window.BC3 = BC3;
