/* ===== 혈관·혈액 3D 도구 CVB: 세 혈관(잘린 관·판막), 연결 그림, 모세혈관 물질 교환, 혈액 성분
   굵기, 빠르기, 입자의 수와 크기는 차이가 잘 보이게 정한 모형이다. 모두 새로 만든 모형. */
const CVB = (() => {
  'use strict';
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const REDUCE = C3.REDUCE;
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const rnd = (a, b) => a + Math.random() * (b - a);
  (function css() { const c = document.createElement('style'); c.textContent = '.hl{position:absolute;left:0;top:0;z-index:4;font:700 clamp(13px,1.25vw,16px)/1.2 Pretendard,sans-serif;color:#14263b;white-space:nowrap;pointer-events:none;background:rgba(255,255,255,.82);padding:1px 6px;border-radius:5px}.hl.b{font-weight:800;font-size:clamp(15px,1.5vw,19px)}.hl.off{display:none}'; document.head.appendChild(c); })();

  function stage(host, o = {}) {
    const st = C3.makeStage(host, { hold: true, fov: o.fov || 24, minD: .5, maxD: 80, scroll: !!o.scroll, fitWidth: true, exposure: o.exposure || 1.02 });
    st.scene.background = new THREE.Color(o.bg || 0xffffff);
    st.scene.environment = null;
    st.scene.children.filter((x) => x.isHemisphereLight).forEach((x) => { x.intensity = 1.3; x.color.set(0xffffff); x.groundColor.set(0xa89a92); });
    st.sun.castShadow = false; st.sun.intensity = 2.2; st.sun.position.set(-5, 8, 10);
    const fill = new THREE.DirectionalLight(0xdfeaff, .6); fill.position.set(8, -2, 5); st.scene.add(fill);
    st.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    return st;
  }
  const clock = (st, fn) => { let tt = 0; st.onFrame((dt) => { if (window.__bakeT !== undefined) { const n = window.__bakeT; dt = Math.max(0, n - tt); tt = n; } fn(REDUCE ? 0 : dt); }); };
  /* 이름표: at 3D 위치(또는 함수)에서 (x,y: 칸 비율) 글자까지 얇은 선 */
  function labels(st) {
    const host = st.host, ov = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ov.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3'); host.appendChild(ov);
    const L = [], p = V();
    st.onFrame(() => { const { W, H } = st.size(); L.forEach((a) => { const on = a.show; a.e.classList.toggle('off', !on); a.ln.style.display = on && a.at ? '' : 'none'; if (!on) return; const tx = a.x * W, ty = a.y * H; a.e.style.transform = `translate(${tx}px,${ty}px) translate(${a.ax},-50%)`; if (!a.at) return; p.copy(typeof a.at === 'function' ? a.at() : a.at).project(st.camera); a.ln.setAttribute('x1', (p.x + 1) / 2 * W); a.ln.setAttribute('y1', (1 - p.y) / 2 * H); a.ln.setAttribute('x2', tx + (a.ax === '-100%' ? 4 : a.ax === '0' ? -4 : 0)); a.ln.setAttribute('y2', ty + (a.ax === '-50%' ? 12 : 0)); }); });
    return (t, at, x, y, cls = '', ax = x < .5 ? '-100%' : '0') => { const e = document.createElement('div'); e.className = 'hl ' + cls; e.innerHTML = t; host.appendChild(e); const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line'); ln.setAttribute('stroke', '#14263b'); ln.setAttribute('stroke-width', '1'); ov.appendChild(ln); const a = { e, ln, at, x, y, ax, show: true }; L.push(a); return a; };
  }
  function rbcGeo() {
    const g = new THREE.LatheGeometry([[0, -.2], [.42, -.26], [.8, -.36], [1, -.12], [1, .12], [.8, .36], [.42, .26], [0, .2]].map(([x, y]) => new THREE.Vector2(x, y)), 26);
    const c = new THREE.CatmullRomCurve3([[0, -.2], [.42, -.26], [.8, -.36], [1, -.1], [1, .1], [.8, .36], [.42, .26], [0, .2]].map(([x, y]) => V(x, y, 0)));
    const pts = c.getPoints(30).map((q) => new THREE.Vector2(Math.max(0, q.x), q.y));
    const out = new THREE.LatheGeometry(pts, 28); out.computeVertexNormals(); g.dispose(); return out;
  }
  function lumpy(detail, amp, f, seed = 1) {
    const g = new THREE.SphereGeometry(1, 16 * detail, 11 * detail), p = g.attributes.position, v = V();
    const n = (x, y, z) => Math.sin(x * f + seed) * Math.cos(y * f * 1.3 + seed * 2) + Math.sin(z * f * 1.1 + seed * 3) * .7 + Math.sin((x + y + z) * f * 1.9) * .35;
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const L = 1 + amp * n(v.x, v.y, v.z); p.setXYZ(i, v.x * L, v.y * L, v.z * L); }
    g.computeVertexNormals();
    /* 구의 이음매 법선을 맞춘다 */
    const nn = g.attributes.normal, seg = 16 * detail, rows = 11 * detail; for (let r = 0; r <= rows; r++) { const a0 = r * (seg + 1), a1 = a0 + seg; const x = nn.getX(a0) + nn.getX(a1), y = nn.getY(a0) + nn.getY(a1), z = nn.getZ(a0) + nn.getZ(a1), l = Math.hypot(x, y, z) || 1; nn.setXYZ(a0, x / l, y / l, z / l); nn.setXYZ(a1, x / l, y / l, z / l); }
    return g;
  }
  /* 물질 입자 */
  function molGeos() {
    const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: .55 });
    const o2 = new THREE.Group(); [-.42, .42].forEach((x) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.5, 18, 14), mat('#e23b2e')); m.position.x = x; o2.add(m); });
    const co2 = new THREE.Group(); const cc = new THREE.Mesh(new THREE.SphereGeometry(.5, 18, 14), mat('#3b4048')); co2.add(cc); [-.72, .72].forEach((x) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.42, 18, 14), mat('#e23b2e')); m.position.x = x; co2.add(m); });
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .36, 6), mat('#f2b632'));
    const wst = new THREE.Mesh(new THREE.BoxGeometry(.72, .72, .72), mat('#8d8578'));
    return { o2, co2, nut, wst };
  }

  /* ===== 혈관 무대: 연결(net) · 비교(cmp) · 물질 교환(ex) ===== */
  async function vessels(host, opt = {}) {
    const st = stage(host, { scroll: opt.scroll });
    const G = { net: new THREE.Group(), cmp: new THREE.Group(), ex: new THREE.Group() };
    Object.values(G).forEach((g) => st.scene.add(g));
    const lab = labels(st), LB = { net: [], cmp: [], ex: [] };
    const RB = rbcGeo();
    const tick = { net: null, cmp: null, ex: null };
    const dummy = new THREE.Object3D(), tp = V(), tq = V();

    /* --- 비교: 앞쪽을 잘라 낸 세 혈관 --- */
    const pipe = (ro, ri, L, wallC, capC) => {
      const a = .95, S = new THREE.Shape(); S.absarc(0, 0, ro, -Math.PI + a, Math.PI - a, false); S.absarc(0, 0, ri, Math.PI - a, -Math.PI + a, true);
      const g = new THREE.ExtrudeGeometry(S, { depth: L, bevelEnabled: false, curveSegments: 40 }); g.translate(0, 0, -L / 2); g.rotateY(Math.PI / 2);
      return new THREE.Mesh(g, [new THREE.MeshStandardMaterial({ color: capC, roughness: .85 }), new THREE.MeshStandardMaterial({ color: wallC, roughness: .7 })]);
    };
    const L = 8;
    const defs = [
      { k: 'art', y: 2.35, ro: 1.05, ri: .62, wall: '#e0806c', cap: '#c9473c', blood: '#d93a2f', lum: '#a82a20', n: 34, sp: 2.5, s: .17 },
      { k: 'cap', y: .25, ro: .2, ri: .16, wall: '#eba797', cap: '#d9766a', blood: '#b0408a', lum: '#8e3c70', n: 9, sp: .55, s: .115 },
      { k: 'vei', y: -1.95, ro: 1.05, ri: .9, wall: '#8fa6d8', cap: '#6a86c6', blood: '#3c5fbc', lum: '#2c478f', n: 34, sp: 1.1, s: .17 },
    ];
    const CMP = {};
    defs.forEach((d) => {
      const g = new THREE.Group(); g.position.y = d.y; G.cmp.add(g);
      const wall = pipe(d.ro, d.ri, L, d.wall, d.cap); g.add(wall);
      const lum = new THREE.Mesh(new THREE.CylinderGeometry(d.ri * .995, d.ri * .995, L, 40, 1, true), new THREE.MeshStandardMaterial({ color: d.lum, roughness: .8, side: THREE.BackSide })); lum.rotation.z = Math.PI / 2; g.add(lum);
      const im = new THREE.InstancedMesh(RB, new THREE.MeshStandardMaterial({ color: d.blood, roughness: .55 }), d.n); im.frustumCulled = false; g.add(im);
      const it = Array.from({ length: d.n }, () => ({ x: rnd(-L / 2, L / 2), r: d.k === 'cap' ? 0 : Math.sqrt(Math.random()) * d.ri * .72, th: rnd(0, 6.28), rx: rnd(0, 6), ry: rnd(0, 6), v: rnd(.85, 1.15) }));
      CMP[d.k] = { ...d, g, wall, im, it, lum };
    });
    /* 정맥 판막: 관 벽에 붙은 주머니 두 장, 끝이 흐름 쪽을 향한다 */
    const valves = [];
    const vv = CMP.vei; const mkCusp = (x0, sgn) => {
      const g = new THREE.PlaneGeometry(1, 1, 14, 10), m = new THREE.MeshStandardMaterial({ color: '#e8eefb', roughness: .55, side: THREE.DoubleSide }), me = new THREE.Mesh(g, m); vv.g.add(me);
      return { g, x0, sgn, close: -1 };
    };
    [-2, 1.5].forEach((x) => { valves.push(mkCusp(x, 1), mkCusp(x, -1)); });
    const setCusp = (c, close) => {
      if (Math.abs(c.close - close) < .005) return; c.close = close; const p = c.g.attributes.position, ri = vv.ri * .985, len = 1.05, gap = ri * (.58 * (1 - close) + .015);
      for (let i = 0; i < p.count; i++) {
        const uvA = c.g.attributes.uv, u = uvA.getY(i), v = uvA.getX(i) * 2 - 1, th = (Math.PI / 2) * c.sgn + v * 1.45;
        const ry = Math.sin(th) * ri, rz = Math.cos(th) * ri, ey = c.sgn * gap, ez = rz * .97;
        const belly = Math.sin(u * Math.PI) * (1 - v * v) * .16 * c.sgn;
        p.setXYZ(i, c.x0 + u * len, ry + (ey - ry) * u + belly, rz + (ez - rz) * u);
      }
      p.needsUpdate = true; c.g.computeVertexNormals(); c.g.computeBoundingSphere();
    };
    let reverse = 0, revT = 0;
    const pulseOf = (t) => Math.pow(Math.max(0, Math.sin(t * 2 * Math.PI * .85)), 3);
    let tAll = 0, focus = null;
    tick.cmp = (dt) => {
      tAll += dt; const pu = pulseOf(tAll);
      const ar = CMP.art; ar.wall.scale.set(1, 1 + pu * .05, 1 + pu * .05); ar.lum.scale.set(1 + pu * .05, 1, 1 + pu * .05);
      if (reverse) { revT += dt; if (revT > 3.2) { reverse = 0; revT = 0; } }
      const close = reverse ? smooth(0, .35, revT) : 0; valves.forEach((c) => setCusp(c, close));
      Object.values(CMP).forEach((d) => {
        const base = d.k === 'art' ? d.sp * (.35 + 2.2 * pu) : d.sp;
        d.it.forEach((it, i) => {
          let nx = it.x + base * it.v * dt * (d.k === 'vei' && reverse ? -.45 : 1);
          if (d.k === 'vei') {
            /* 판막이 닫히면 거꾸로 가던 혈구가 판막 앞에서 멈춘다 */
            if (reverse) [-2, 1.5].forEach((vx) => { if (it.x > vx + .9 && nx <= vx + .9) nx = vx + .9 + rnd(0, .3); });
          }
          if (nx > L / 2) nx = -L / 2; if (nx < -L / 2) nx = L / 2; it.x = nx;
          const edge = Math.min(1, (L / 2 - Math.abs(nx)) / .3);
          let yy = Math.sin(it.th) * it.r; if (d.k === 'vei') [-2, 1.5].forEach((vx) => { const q = (nx - vx) / 1.05; if (q > -.1 && q < 1.1) { const lim = d.ri * (.92 - .6 * Math.max(0, Math.min(1, q))) - .15; if (Math.abs(yy) > lim) yy = Math.sign(yy || 1) * Math.max(0, lim); } }); dummy.position.set(nx, yy, Math.cos(it.th) * it.r); dummy.rotation.set(it.rx + nx * .4, it.ry, d.k === 'cap' ? 1.57 : it.ry * .5); dummy.scale.setScalar(d.s * (d.k === 'art' || d.k === 'vei' ? 1.5 : 1) * edge); dummy.updateMatrix(); d.im.setMatrixAt(i, dummy.matrix);
        });
        d.im.instanceMatrix.needsUpdate = true;
      });
    };
    LB.cmp.push(lab('동맥', V(4.0, 2.35 + 1.05, 0), .9, .13, 'b'), lab('모세혈관', V(4.0, .45, 0), .9, .47, 'b'), lab('정맥', V(4.0, -1.95 + 1.05, 0), .9, .7, 'b'), lab('판막', V(-1.35, -1.95 + .72, .25), .08, .9));
    LB.cmp.forEach((x) => { x.e.style.textAlign = 'left'; });

    /* --- 연결: 동맥 → 모세혈관 → 정맥 (그림 Ⅵ-9 형식) --- */
    const lerpC = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
    const RED = '#d8392e', PUR = '#a24a94', BLU = '#3d62c2';
    const tubeC = (pts, r0, r1, cA, cB) => {
      const c = new THREE.CatmullRomCurve3(pts.map((p) => V(...p)), false, 'centripetal'), seg = 80, rs = 12, g = new THREE.TubeGeometry(c, seg, 1, rs, false), p = g.attributes.position, col = new Float32Array(p.count * 3);
      for (let i = 0; i <= seg; i++) { const t = i / seg, ce = c.getPointAt(t), r = r0 + (r1 - r0) * t, cc = lerpC(cA, cB, t); for (let j = 0; j <= rs; j++) { const k = i * (rs + 1) + j; tp.fromBufferAttribute(p, k).sub(c.getPoint(t)); p.setXYZ(k, ...tq.copy(c.getPoint(t)).addScaledVector(tp, r).toArray()); col[k * 3] = cc.r; col[k * 3 + 1] = cc.g; col[k * 3 + 2] = cc.b; } }
      p.needsUpdate = true; g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .62 })); G.net.add(m); return c;
    };
    const artC = tubeC([[-5.2, -2.6, 0], [-4.7, -.6, 0], [-3.4, 1.0, 0], [-1.9, 1.6, 0]], .62, .2, RED, RED);
    const veiC = tubeC([[1.9, 1.6, 0], [3.4, 1.0, 0], [4.7, -.6, 0], [5.2, -2.6, 0]], .24, .72, BLU, BLU);
    const caps = []; const NCAP = 9;
    for (let i = 0; i < NCAP; i++) {
      const k = i / (NCAP - 1) - .5, y0 = 1.6 + k * .28, amp = (i % 2 ? 1 : -1) * rnd(.18, .36), yy = 1.6 + k * 2.5, z = rnd(-.5, .5);
      const pts = [[-1.9, y0, 0], [-1.1, yy * .7 + y0 * .3, z * .6], [-.45, yy + amp * .6, z], [.45, yy - amp * .6, -z * .5], [1.1, yy * .7 + y0 * .3, z * .3], [1.9, y0, 0]];
      caps.push(tubeC(pts, .05, .05, RED, BLU));
      /* 가로로 잇는 가지 */
      if (i) { const p0 = caps[i - 1].getPointAt(.4 + (i % 3) * .08), p1 = caps[i].getPointAt(.46 + (i % 3) * .08); tubeC([p0.toArray(), [(p0.x + p1.x) / 2 + rnd(-.1, .1), (p0.y + p1.y) / 2, (p0.z + p1.z) / 2], p1.toArray()], .035, .035, PUR, PUR); }
    }
    const NF = 46, fm = new THREE.InstancedMesh(RB, new THREE.MeshStandardMaterial({ roughness: .5, depthTest: false }), NF); fm.frustumCulled = false; fm.renderOrder = 20; G.net.add(fm);
    const flow = Array.from({ length: NF }, () => ({ u: Math.random() * 3, cap: Math.floor(Math.random() * NCAP), rx: rnd(0, 6), ry: rnd(0, 6), off: V(rnd(-.2, .2), rnd(-.2, .2), rnd(-.2, .2)), c: new THREE.Color() }));
    tick.net = (dt) => {
      tAll += dt; const pu = pulseOf(tAll);
      flow.forEach((f, i) => {
        const seg = Math.floor(f.u), sp = seg === 0 ? .32 * (.5 + 1.8 * pu) : seg === 1 ? .14 : .26; f.u += sp * dt; if (f.u >= 3) { f.u = 0; f.cap = Math.floor(Math.random() * NCAP); }
        const t = f.u - Math.floor(f.u), s = Math.floor(f.u); let scale = .07;
        if (s === 0) { artC.getPointAt(t, tp); tp.addScaledVector(f.off, (1 - t) * 1.4); scale = .2 - t * .1; f.c.set('#8e1610'); }
        else if (s === 1) { caps[f.cap].getPointAt(t, tp); scale = .09; f.c.copy(lerpC('#8e1610', '#17306f', t)); }
        else { veiC.getPointAt(t, tp); tp.addScaledVector(f.off, t * 1.4); scale = .1 + t * .1; f.c.set('#17306f'); }
        dummy.position.copy(tp); dummy.rotation.set(f.rx + f.u * 3, f.ry, 0); dummy.scale.setScalar(scale); dummy.updateMatrix(); fm.setMatrixAt(i, dummy.matrix); fm.setColorAt(i, f.c);
      });
      fm.instanceMatrix.needsUpdate = true; fm.instanceColor.needsUpdate = true;
    };
    LB.net.push(lab('동맥', V(-4.6, -.8, 0), .08, .7, 'b'), lab('모세혈관', V(0, .55, 0), .5, .84, 'b', '-50%'), lab('정맥', V(4.6, -.8, 0), .92, .7, 'b'), lab('심장에서 나온 혈액', null, .17, .9, '', '-50%'), lab('심장으로 돌아가는 혈액', null, .83, .9, '', '-50%'));

    /* --- 물질 교환 --- */
    const cG = lumpy(3, .03, 2.6, 2), nucG = new THREE.SphereGeometry(.34, 16, 12);
    const cellM = new THREE.MeshStandardMaterial({ color: '#ffc75e', roughness: .7 }), nucM = new THREE.MeshStandardMaterial({ color: '#b4849a', roughness: .7 });
    const cells = [];
    const placeC = (x, y, z, s) => { const m = new THREE.Mesh(cG, cellM); m.position.set(x, y, z); m.scale.setScalar(s); m.rotation.set(rnd(0, 6), rnd(0, 6), 0); G.ex.add(m); cells.push(m); return m; };
    for (let ix = -3; ix <= 3; ix++) { [[2.15, 0], [-2.15, 0], [3.8, -.5], [-3.8, -.5], [.05, -2.6], [1.8, -2.5], [-1.8, -2.5]].forEach(([y, z], j) => { placeC(ix * 1.6 + (j % 2) * .8 + rnd(-.1, .1), y + rnd(-.12, .12), z + rnd(-.2, .2), rnd(.85, 1)); }); }
    const capR = .78, capL = 12.5;
    const capWall = new THREE.Mesh(new THREE.CylinderGeometry(capR, capR, capL, 40, 1, true), new THREE.MeshStandardMaterial({ color: '#e8927f', roughness: .6, transparent: true, opacity: .34, side: THREE.DoubleSide, depthWrite: false })); capWall.rotation.z = Math.PI / 2; capWall.renderOrder = 5; G.ex.add(capWall);
    const capBack = new THREE.Mesh(new THREE.CylinderGeometry(capR * .98, capR * .98, capL, 40, 1, true, Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: '#efc3b4', roughness: .8, side: THREE.DoubleSide })); capBack.rotation.z = Math.PI / 2; G.ex.add(capBack);
    const NR = 9, rm = new THREE.InstancedMesh(RB, new THREE.MeshStandardMaterial({ roughness: .55 }), NR); rm.frustumCulled = false; G.ex.add(rm);
    const rb = Array.from({ length: NR }, (_, i) => ({ x: -capL / 2 + i * capL / NR, c: new THREE.Color() }));
    const M = molGeos(), mols = [];
    const pool = (key, n, s) => { for (let i = 0; i < n; i++) { const o = M[key].clone(); o.visible = false; o.scale.setScalar(s); G.ex.add(o); mols.push({ o, key, t: rnd(0, 1), dur: rnd(2.2, 3.4), s, a: V(), b: V(), active: false, wait: rnd(0, 3) }); } };
    pool('o2', 9, .27); pool('nut', 7, .34); pool('co2', 8, .25); pool('wst', 6, .27);
    const spawn = (m) => { const c = cells[Math.floor(Math.random() * cells.length)], x = rnd(-5, 5), ty = (Math.random() < .5 ? 1 : -1), inward = m.key === 'co2' || m.key === 'wst', cx = x + rnd(-.8, .8), cy = ty * rnd(1.6, 2.0), cz = rnd(-.5, .5); const pIn = V(x, ty * .3, rnd(-.2, .2)), pOut = V(cx, cy, cz); m.a.copy(inward ? pOut : pIn); m.b.copy(inward ? pIn : pOut); m.active = true; m.t = 0; m.o.visible = true; };
    tick.ex = (dt) => {
      rb.forEach((r, i) => { r.x += .42 * dt; if (r.x > capL / 2) r.x = -capL / 2; const t = (r.x + capL / 2) / capL; r.c.copy(lerpC('#d8392e', '#5a4aa8', smooth(.1, .95, t))); dummy.position.set(r.x, Math.sin(i * 1.7 + r.x * .4) * .09, Math.cos(i) * .05); dummy.rotation.set(1.2, .35 + Math.sin(r.x) * .4, 0); dummy.scale.setScalar(.55); dummy.updateMatrix(); rm.setMatrixAt(i, dummy.matrix); rm.setColorAt(i, r.c); });
      rm.instanceMatrix.needsUpdate = true; rm.instanceColor.needsUpdate = true;
      mols.forEach((m) => { if (!m.active) { m.wait -= dt; if (m.wait <= 0) spawn(m); return; } m.t += dt / m.dur; if (m.t >= 1) { m.active = false; m.o.visible = false; m.wait = rnd(.2, 1.4); return; } const e = m.t * m.t * (3 - 2 * m.t); m.o.position.lerpVectors(m.a, m.b, e); m.o.rotation.set(m.t * 3, m.t * 4, 0); m.o.scale.setScalar(m.s * Math.min(1, Math.min(m.t, 1 - m.t) * 8)); });
    };
    LB.ex.push(lab('적혈구', () => { const r = rb[4]; return V(r.x, 0, .3); }, .5, .4, 'b', '-50%'), lab('세포', V(-2.4, 2.1, .9), .06, .07, 'b'), lab('모세혈관', V(3.2, .75, 0), .8, .07, 'b'));
    LB.ex[0].ln.style.opacity = 0; LB.ex[0].at = null;

    let mode = opt.mode || 'cmp';
    const box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)); box.visible = false; st.scene.add(box);
    const view = { cmp: [V(.32, .16, 1), [10.4, 8, .5], V(0, .2, 0)], net: [V(0, .12, 1), [12, 6.6, .5], V(0, -.3, 0)], ex: [V(0, 0, 1), [10.5, 6.4, .5], V(0, 0, 0)] };
    const apply = (dur = 0) => {
      Object.entries(G).forEach(([k, g]) => { g.visible = k === mode; }); Object.entries(LB).forEach(([k, a]) => a.forEach((x) => { x.show = k === mode; }));
      const [d, s, c] = view[mode]; box.scale.set(...s); box.position.copy(c); st.controls.target.copy(c); st.fit([box], { dir: d, margin: 1.01, target: c, dur });
    };
    apply();
    clock(st, (dt) => { tick[mode](dt); });
    const api = {
      st, get mode() { return mode; },
      mode_(m) { mode = m; apply(.01); },
      focus(k) { focus = k; Object.values(CMP).forEach((d) => { const on = !k || d.k === k; [d.wall.material[0], d.wall.material[1], d.im.material, d.lum.material].forEach((x) => { x.transparent = !on; x.opacity = on ? 1 : .18; x.depthWrite = on; x.needsUpdate = true; }); }); if (mode === 'cmp') { const d = k ? CMP[k] : null; if (d) { const c = V(0, d.y, 0); st.flyTo(c.clone().add(V(.32, .16, 1).normalize().multiplyScalar(k === 'vei' ? 15 : 16)), c, .9); LB.cmp.forEach((x, i) => { x.show = ['art', 'cap', 'vei', 'val'][i] === k || (k === 'vei' && i === 3); }); } else apply(.8); } },
      reverse() { reverse = 1; revT = 0; },
    };
    valves.forEach((c) => setCusp(c, 0));
    await C3.prepare(st);
    return api;
  }

  /* ===== 혈액 성분 ===== */
  async function blood(host, opt = {}) {
    const st = stage(host, { bg: '#f3dca4', fov: 30, scroll: opt.scroll });
    const S = st.scene; S.fog = new THREE.Fog('#f3dca4', 7, 15);
    /* 혈관 벽 */
    const wallT = C3.canvasTex(1024, 512, (g, w, h) => { g.fillStyle = '#d9806e'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { g.strokeStyle = Math.random() < .5 ? `rgba(170,70,60,${rnd(.06, .2)})` : `rgba(240,170,150,${rnd(.05, .18)})`; g.lineWidth = rnd(.8, 2.4); const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd(20, 70), y + rnd(-5, 5)); g.stroke(); } });
    wallT.wrapS = wallT.wrapT = THREE.RepeatWrapping; wallT.repeat.set(3, 2);
    const tun = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 40, 48, 1, true), new THREE.MeshStandardMaterial({ map: wallT, roughness: .85, side: THREE.BackSide })); tun.rotation.z = Math.PI / 2; S.add(tun);
    const RB = rbcGeo();
    const rbcM = new THREE.MeshStandardMaterial({ color: '#d4372c', roughness: .5 });
    const NR = 58, rm = new THREE.InstancedMesh(RB, rbcM, NR); rm.frustumCulled = false; S.add(rm);
    const col = new THREE.Color(), dummy = new THREE.Object3D();
    const W = 11;
    const rb = Array.from({ length: NR }, () => { const th = rnd(0, 6.28), r = Math.sqrt(Math.random()) * 2.75; return { x: rnd(-W, W), y: Math.sin(th) * r, z: Math.cos(th) * r - .3, v: rnd(.42, .7), rx: rnd(0, 6), ry: rnd(0, 6), s: rnd(.3, .36), sp: rnd(.2, .6) }; });
    const plG = lumpy(2, .14, 3.4, 5); plG.scale(1, .55, 1);
    const pm = new THREE.InstancedMesh(plG, new THREE.MeshStandardMaterial({ color: '#e9c45e', roughness: .7 }), 30); pm.frustumCulled = false; S.add(pm);
    const pl = Array.from({ length: 30 }, () => { const th = rnd(0, 6.28), r = Math.sqrt(Math.random()) * 2.8; return { x: rnd(-W, W), y: Math.sin(th) * r, z: Math.cos(th) * r - .3, v: rnd(.45, .7), rx: rnd(0, 6), ry: rnd(0, 6), s: rnd(.07, .1), go: 0, gx: 0, gy: 0, gz: 0 }; });
    /* 백혈구 */
    const wG = lumpy(4, .03, 8, 3), wM = new THREE.MeshStandardMaterial({ color: '#f1eef6', roughness: .78, transparent: true, opacity: .72, depthWrite: false, side: THREE.FrontSide });
    const nM = new THREE.MeshStandardMaterial({ color: '#6c52ab', roughness: .65 });
    const wb = [[-3.2, .9, .4], [2.6, -1.1, -.4], [7, .6, -.8]].map(([x, y, z]) => { const g = new THREE.Group(); g.position.set(x, y, z); const b = new THREE.Mesh(wG, wM); g.add(b); [[-.2, .12, 0, .24], [.17, .2, .06, .22], [.08, -.2, -.05, .25]].forEach(([a, c, d, r]) => { const n = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), nM); n.position.set(a, c, d); n.scale.set(1.1, .9, .9); g.add(n); }); g.scale.setScalar(.62); S.add(g); return { g, b, v: rnd(.28, .4), base: V(x, y, z) }; });
    /* 세균 */
    const bacG = new THREE.CapsuleGeometry(.09, .22, 8, 14), bacM = new THREE.MeshStandardMaterial({ color: '#6ea843', roughness: .6 });
    const bac = Array.from({ length: 3 }, () => { const m = new THREE.Mesh(bacG, bacM.clone()); m.visible = false; S.add(m); return { m, t: 0 }; });
    /* 산소: 적혈구에 붙어 간다 */
    const M = molGeos(), oxy = Array.from({ length: 14 }, (_, i) => { const o = M.o2.clone(); o.scale.setScalar(.12); o.visible = false; S.add(o); return { o, r: rb[i * 2 + 2] }; });
    /* 혈장 속 물질 */
    const pmol = []; [['nut', 10, .15], ['co2', 10, .12], ['wst', 10, .12]].forEach(([k, n, s]) => { for (let i = 0; i < n; i++) { const o = M[k].clone(); o.scale.setScalar(s); o.visible = false; S.add(o); const th = rnd(0, 6.28), r = Math.sqrt(Math.random()) * 2.6; pmol.push({ o, x: rnd(-7, 7), y: Math.sin(th) * r, z: Math.cos(th) * r, v: rnd(.4, .65), k, rx: rnd(0, 6) }); } });
    /* 상처 */
    const woundP = V(0, 3.1, -3.5);
    const tear = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), new THREE.MeshStandardMaterial({ color: '#6c1f18', roughness: .9 })); tear.scale.set(1.15, .22, .55); tear.position.copy(woundP); tear.rotation.x = -.62; tear.visible = false; S.add(tear);
    const crust = new THREE.Mesh(lumpy(4, .1, 6, 9), new THREE.MeshStandardMaterial({ color: '#5a2418', roughness: .95 })); crust.scale.setScalar(.001); crust.position.copy(woundP).add(V(0, -.04, .05)); crust.rotation.x = -.62; crust.visible = false; S.add(crust);
    const lab = labels(st);
    const LB = { rbc: lab('적혈구', null, .5, .08, 'b', '-50%'), wbc: lab('백혈구', () => wb[0].g.position, .08, .12, 'b'), plt: lab('혈소판', null, .5, .08, 'b', '-50%'), pla: lab('혈장', null, .1, .9, 'b', '-50%') };
    const LEG = lab('', null, .5, .93, '', '-50%');
    const setL = () => { Object.entries(LB).forEach(([k, a]) => { a.show = mode === k || (!mode && k === 'pla'); }); LEG.show = mode === 'pla' || mode === 'rbc' || mode === 'wbc' || mode === 'plt'; };
    const box = new THREE.Mesh(new THREE.BoxGeometry(11.5, 7.2, .3)); box.visible = false; S.add(box);
    st.controls.enableRotate = false; st.controls.enableZoom = false;
    st.controls.target.set(0, 0, 0); st.camera.position.set(0, 0, 12); st.fit([box], { dir: V(0, 0, 1), margin: 1, target: V(0, 0, 0) });
    const camHome = st.camera.position.clone();
    st.onFrame(() => { const d = st.camera.position.distanceTo(st.controls.target); S.fog.near = d - 1.5; S.fog.far = d + 9.5; });
    let mode = null, mt = 0, tgtWbc = 0;
    const dimCol = new THREE.Color('#d9c28a');
    tun.visible = true;
    clock(st, (dt) => {
      mt += dt; const now = performance.now() / 1000;
      const slow = mode === 'pla' ? .9 : 1;
      rb.forEach((r, i) => { r.x += r.v * dt * slow; if (r.x > W) r.x = -W; r.rx += r.sp * dt; dummy.position.set(r.x, r.y + Math.sin(now * .6 + i) * .08, r.z); dummy.rotation.set(r.rx, r.ry, 0); dummy.scale.setScalar(r.s); dummy.updateMatrix(); rm.setMatrixAt(i, dummy.matrix); });
      rm.instanceMatrix.needsUpdate = true;
      pl.forEach((p, i) => {
        if (mode === 'plt' && p.go) { const k = Math.min(1, dt * 1.2); p.x += (p.gx - p.x) * k; p.y += (p.gy - p.y) * k; p.z += (p.gz - p.z) * k; }
        else { p.x += p.v * dt; if (p.x > W) p.x = -W; }
        dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(p.rx + now * .3, p.ry, 0); dummy.scale.setScalar(p.s * (p.go ? 1.5 : 1)); dummy.updateMatrix(); pm.setMatrixAt(i, dummy.matrix);
      });
      pm.instanceMatrix.needsUpdate = true;
      wb.forEach((w, i) => { w.g.position.x += w.v * dt * (mode === 'wbc' ? .25 : 1); if (w.g.position.x > W) w.g.position.x = -W; w.g.position.y = w.base.y + Math.sin(now * .4 + i * 2) * .14; w.g.rotation.z = now * .08; w.b.rotation.y = now * .2; });
      oxy.forEach((a, i) => { a.o.visible = mode === 'rbc'; if (a.o.visible) { a.o.position.set(a.r.x + Math.cos(i) * .2, a.r.y + Math.sin(now * .6 + i * 2 + 1) * .08 + .22, a.r.z + .28); a.o.rotation.set(now * .4, i, 0); } });
      pmol.forEach((m) => { m.o.visible = mode === 'pla'; if (m.o.visible) { m.x += m.v * dt; if (m.x > 7.5) m.x = -7.5; m.o.position.set(m.x, m.y, m.z); m.o.rotation.set(m.rx + now * .3, now * .25, 0); } });
      /* 세균을 잡아먹는 백혈구 */
      bac.forEach((b, i) => { b.m.visible = mode === 'wbc' && b.t >= 0; if (mode !== 'wbc') return; const w = wb[i % 2].g; b.t += dt / 4.2; if (b.t > 1.25) b.t = 0; const e = Math.min(1, b.t / .75), ang = i * 2 + .9, sx = w.position.x + Math.cos(ang) * 1.9, sy = w.position.y + Math.sin(ang) * 1.2; const ee = e * e * (3 - 2 * e); b.m.position.set(sx + (w.position.x - sx) * ee, sy + (w.position.y - sy) * ee, w.position.z + .1); b.m.rotation.z = now + i; const sc = b.t > .75 ? Math.max(0, 1 - (b.t - .75) * 3) : 1; b.m.scale.setScalar(sc); const wob = b.t > .55 && b.t < .95 ? Math.sin((b.t - .55) / .4 * Math.PI) : 0; w.scale.set(.62 * (1 + wob * .1), .62 * (1 - wob * .07), .62); });
      if (mode === 'plt') {
        tear.visible = true; crust.visible = mt > 3.2;
        pl.forEach((p, i) => { if (!p.go && mt > i * .1 && i < 22) { p.go = 1; const a = rnd(0, 6.28), r = Math.sqrt(Math.random()); p.gx = woundP.x + Math.cos(a) * r * .95; p.gy = woundP.y - .05 + Math.sin(a) * r * .1 - rnd(0, .18); p.gz = woundP.z + Math.sin(a) * r * .32 + .18; } });
        const c = smooth(3.2, 5.5, mt); crust.scale.set(1.2 * c + .001, .22 * c + .001, .55 * c + .001); tear.visible = c < .98;
      }
    });
    const dim = (k) => {
      const f = (m, on) => { m.transparent = true; m.opacity = on ? (m === wM ? .72 : 1) : .14; m.depthWrite = on && m !== wM; m.needsUpdate = true; };
      f(rbcM, !k || k === 'rbc'); f(pm.material, !k || k === 'plt'); f(wM, !k || k === 'wbc'); f(nM, !k || k === 'wbc');
      tun.material.color.set(0xffffff);
    };
    const api = {
      st,
      show(k) {
        mode = k; mt = 0; dim(k === 'pla' ? '-' : k); setL();
        pl.forEach((p) => { p.go = 0; }); tear.visible = false; crust.visible = false; crust.scale.setScalar(.001);
        bac.forEach((b, i) => { b.t = -i * .3; });
        wb.forEach((w) => w.g.scale.setScalar(.62));
        const P = k === 'plt' ? [V(0, .6, 5.5), V(0, 2.5, -3.2)] : k === 'rbc' ? [V(0, 0, 8.5), V(0, 0, 0)] : k === 'wbc' ? [V(wb[0].g.position.x + .3, wb[0].g.position.y, 7.5), V(wb[0].g.position.x + .3, wb[0].g.position.y, 0)] : [camHome, V(0, 0, 0)];
        st.flyTo(P[0], P[1], 1.2);
        LEG.e.innerHTML = { pla: '노란 조각은 영양소, 검은 입자는 이산화 탄소, 회색 조각은 노폐물이에요', rbc: '붉은 쌍둥이 공이 산소예요', wbc: '초록 막대가 세균이에요', plt: '혈소판이 상처로 모여 딱지를 만들어요' }[k] || '';
      },
    };
    setL();
    await C3.prepare(st);
    return api;
  }
  return { vessels, blood };
})();
window.CVB = CVB;
