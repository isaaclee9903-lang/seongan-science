/* ===== 호흡계 3D 도구 CH3 =====
   뼈·가로막·숨관·숨관가지·심장: BodyParts3D 4.0(CC BY 4.0), 폐 표면: HuBMAP CCF 3D Reference Object Library(CC BY 4.0). media/ATTRIBUTION.txt
   갈비뼈는 실제처럼 갈비뼈머리와 목을 잇는 축으로 돌고, 가로막은 둥근 지붕이 내려가며 납작해진다.
   움직이는 크기, 공기 알갱이의 수와 빠르기는 잘 보이게 정한 모형이다. C3와 같은 모듈 안에 넣는다. */
const CH3 = (() => {
  'use strict';
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const REDUCE = C3.REDUCE;
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const COL = { bone: '#e2d6bd', cart: '#c9d8de', diaph: '#b4513f', lung: '#e98a7e', tree: '#f6eedf', trachea: '#d9c7ab', heart: '#bf4d40', vessel: '#c96b5f', air: '#2f8fe0', skull: '#e6dcc7' };
  const RIB_A = .13; // 들숨 때 갈비뼈가 도는 각(라디안), 잘 보이게 크게 정함
  const DIA_D = 1.25; // 들숨 때 가로막 꼭대기가 내려가는 거리

  let dataP = null;
  function data() {
    if (dataP) return dataP;
    dataP = Promise.all([fetch('media/chest.json').then((r) => r.json()), fetch('media/chest.bin').then((r) => r.arrayBuffer())]).then(([m, b]) => {
      const n = m.counts[0], pos = new Int16Array(b, 0, n * 3), nor = new Int16Array(b, n * 6, n * 3), idx = new Uint32Array(b, m.iOff, m.counts[1]);
      const pa = new THREE.BufferAttribute(pos, 3, true), na = new THREE.BufferAttribute(nor, 3, true);
      /* 움직이지 않는 조각: 같은 꼭짓점 묶음을 함께 쓴다 */
      const geo = (ranges) => { let c = 0; ranges.forEach((r) => { c += r[1]; }); const ix = new Uint32Array(c); let o = 0; ranges.forEach((r) => { ix.set(idx.subarray(r[0], r[0] + r[1]), o); o += r[1]; }); const G = new THREE.BufferGeometry(); G.setAttribute('position', pa); G.setAttribute('normal', na); G.setIndex(new THREE.BufferAttribute(ix, 1)); return G; };
      /* 모양이 바뀌는 조각: 꼭짓점을 따로 꺼내 실제 크기로 */
      const own = (ranges) => {
        const map = new Map(), P = [], N = [], I = [];
        ranges.forEach((r) => { for (let k = r[0]; k < r[0] + r[1]; k++) { const v = idx[k]; let j = map.get(v); if (j === undefined) { j = P.length / 3; map.set(v, j); P.push(pos[v * 3] / 32767 * m.K, pos[v * 3 + 1] / 32767 * m.K, pos[v * 3 + 2] / 32767 * m.K); N.push(nor[v * 3] / 32767, nor[v * 3 + 1] / 32767, nor[v * 3 + 2] / 32767); } I.push(j); } });
        const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); G.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3)); G.setIndex(I); G.userData.base = new Float32Array(P); return G;
      };
      return { m, geo, own };
    });
    return dataP;
  }

  /* 이름표: 3D 위치에서 칸 비율 (x,y)의 글자까지 얇은 선 */
  (function css() { const c = document.createElement('style'); c.textContent = '.hl{position:absolute;left:0;top:0;z-index:4;font:700 clamp(13px,1.25vw,16px)/1.2 Pretendard,sans-serif;color:#14263b;white-space:nowrap;pointer-events:none;background:rgba(255,255,255,.86);padding:2px 7px;border-radius:6px}.hl.b{font-weight:800;font-size:clamp(14px,1.45vw,18px)}.hl small{display:block;font-size:.78em;font-weight:800;color:#0e63b3;margin-top:1px}.hl.on{color:#0e63b3}'; document.head.appendChild(c); })();
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
    return { add, only, L };
  }

  class Path {
    constructor(pts) { this.p = pts; this.c = new Float32Array(pts.length); for (let i = 1; i < pts.length; i++) this.c[i] = this.c[i - 1] + pts[i].distanceTo(pts[i - 1]); this.len = this.c[pts.length - 1] || 1; }
    at(u, out = V()) { const s = Math.max(0, Math.min(1, u)) * this.len, c = this.c; let a = 0, b = c.length - 1; while (b - a > 1) { const m = (a + b) >> 1; if (c[m] <= s) a = m; else b = m; } const t = (s - c[a]) / Math.max(1e-6, c[b] - c[a]); return out.lerpVectors(this.p[a], this.p[b], t); }
  }

  /* ===== 가슴 무대 =====
     opt.head: 머리뼈와 코까지 보이기, opt.heart: 심장 보이기, opt.scroll: 읽기 페이지(손가락 확대 막기) */
  async function chest(host, opt = {}) {
    const D = await data(), M = D.m;
    const st = C3.makeStage(host, { fov: 30, minD: 6, maxD: 120, hold: !!opt.hold, scroll: !!opt.scroll, exposure: .94, sunX: 6, sunZ: 9 });
    st.scene.environmentIntensity = .55; st.scene.traverse((o) => { if (o.isHemisphereLight) o.intensity = .42; });
    st.scene.background = new THREE.Color('#ffffff');
    st.camera.far = 400; st.camera.updateProjectionMatrix();
    st.sun.position.set(9, 14, 16); st.sun.castShadow = false;
    const fill = new THREE.DirectionalLight(0xffffff, .55); fill.position.set(-10, 4, 8); st.scene.add(fill);
    const back = new THREE.DirectionalLight(0xfff2ea, .35); back.position.set(0, 6, -14); st.scene.add(back);
    const K = M.K, G = M.groups, root = new THREE.Group(); st.scene.add(root);
    const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .78, metalness: 0 }, o));
    const stat = (ranges, m) => { const me = new THREE.Mesh(D.geo(ranges), m); me.scale.setScalar(K); me.frustumCulled = false; root.add(me); return me; };
    const boneM = mat(COL.bone, { roughness: .9 }), cartM = mat(COL.cart, { roughness: .62 }), skullM = mat(COL.skull, { roughness: .9, transparent: true, opacity: .42, depthWrite: false });
    const parts = {};
    parts.spine = stat([G.spine], boneM); parts.clav = stat([G.clav], boneM);
    parts.skull = stat([G.skull, G.teeth], skullM); parts.nose = stat([G.nose, G.larynx], cartM);
    parts.trachea = stat([G.trachea, G.bronchi], mat(COL.trachea, { roughness: .6 }));
    parts.tree = stat([G.tree], mat(COL.tree, { roughness: .6, emissive: '#3a2a1a', emissiveIntensity: .04 }));
    parts.heart = stat([G.heart], mat(COL.heart, { roughness: .6 })); parts.vessel = stat([G.vessel], mat(COL.vessel, { roughness: .6 }));
    parts.skull.renderOrder = 30; parts.nose.material = cartM.clone(); parts.nose.material.color.set('#b9cdd6');
    const headOn = !!opt.head; parts.skull.visible = headOn; parts.nose.visible = headOn;
    parts.heart.visible = parts.vessel.visible = opt.heart !== false;

    /* 갈비뼈: 하나씩 축을 따라 돈다 */
    const ribs = M.ribs.map((r) => {
      const head = V(...r.head), neck = V(...r.neck), tip = V(...r.tip), axis = neck.clone().sub(head).normalize();
      const piv = new THREE.Group(); piv.position.copy(head); root.add(piv);
      const me = new THREE.Mesh(D.geo([r.r]), boneM); me.scale.setScalar(K); me.position.copy(head).multiplyScalar(-1); me.frustumCulled = false; piv.add(me);
      /* 앞 끝이 올라가는 쪽으로 돈다 */
      const q = new THREE.Quaternion().setFromAxisAngle(axis, .1), t2 = tip.clone().sub(head).applyQuaternion(q).add(head); const sgn = t2.y > tip.y ? 1 : -1;
      return { ...r, head, tip, axis, sgn, piv, me, q: new THREE.Quaternion() };
    });
    const ribOf = (side, k) => ribs.find((r) => r.side === side && r.k === k);
    const latPt = (r) => { const g = r.me.geometry, P = g.attributes.position, I = g.index; let best = 0, bi = 0; for (let k = 0; k < I.count; k++) { const v = I.getX(k), x = Math.abs(P.getX(v)); if (x > best) { best = x; bi = v; } } return V(P.getX(bi), P.getY(bi), P.getZ(bi)).multiplyScalar(K); };
    ribs.forEach((r) => { r.lat = latPt(r); });
    const ribMove = (r, p, out) => out.copy(p).sub(r.head).applyQuaternion(r.q).add(r.head);
    /* 갈비연골: 가운데 쪽은 가슴뼈를, 바깥쪽은 갈비뼈를 따라간다 */
    const carts = M.carts.map((c) => { const g = D.own([c.r]); const me = new THREE.Mesh(g, cartM); me.frustumCulled = false; root.add(me); return { ...c, g, me, rib: ribOf(c.side, c.k) }; });
    const sternG = new THREE.Group(); root.add(sternG); const stern = new THREE.Mesh(D.geo([G.stern]), cartM.clone()); stern.material.color.set('#e4ddd0'); stern.scale.setScalar(K); stern.frustumCulled = false; sternG.add(stern);
    /* 가로막 */
    const diaG = D.own([G.diaph]), diaM = mat(COL.diaph, { roughness: .66, side: THREE.DoubleSide }), dia = new THREE.Mesh(diaG, diaM); dia.frustumCulled = false; root.add(dia);
    /* 폐: 깊이를 먼저 그려 가장 앞면만 비치게 한다 */
    const lungG = D.own([M.lung.L, M.lung.R]);
    const lungD = new THREE.Mesh(lungG, new THREE.MeshBasicMaterial({ colorWrite: false })); lungD.renderOrder = 20; lungD.frustumCulled = false; root.add(lungD);
    const LO = opt.lungO || .56;
    const lungM = mat(COL.lung, { transparent: true, opacity: LO, roughness: .85, depthWrite: false, depthFunc: THREE.LessEqualDepth });
    const lung = new THREE.Mesh(lungG, lungM); lung.renderOrder = 21; lung.frustumCulled = false; root.add(lung);

    const cut = (on) => { ribs.forEach((r) => { if (r.side === 'L') r.me.visible = !on; }); carts.forEach((c) => { if (c.side === 'L') c.me.visible = !on; }); };
    if (opt.cut) cut(true);
    /* ===== 숨 쉬기: b = 0(날숨 끝) ~ 1(들숨 끝) ===== */
    let b = 0, shown = -1;
    const tv = V(), tw = V(), dS = V();
    const apply = () => {
      if (Math.abs(b - shown) < 1e-4) return; shown = b;
      ribs.forEach((r) => { r.q.setFromAxisAngle(r.axis, r.sgn * RIB_A * b * (r.k > 10 ? .6 : 1)); r.piv.quaternion.copy(r.q); });
      /* 가슴뼈: 2~6번 갈비뼈 앞 끝이 움직인 만큼 */
      dS.set(0, 0, 0); let n = 0; ribs.forEach((r) => { if (r.k >= 2 && r.k <= 6) { ribMove(r, r.tip, tw); dS.add(tw.sub(r.tip)); n++; } }); dS.multiplyScalar(1 / n); sternG.position.copy(dS);
      carts.forEach((c) => { const P = c.g.attributes.position, B = c.g.userData.base; for (let i = 0; i < P.count; i++) { tv.set(B[i * 3], B[i * 3 + 1], B[i * 3 + 2]); const w = smooth(c.x0, c.x1, Math.abs(tv.x)); ribMove(c.rib, tv, tw); tw.sub(tv); P.setXYZ(i, tv.x + dS.x * (1 - w) + tw.x * w, tv.y + dS.y * (1 - w) + tw.y * w, tv.z + dS.z * (1 - w) + tw.z * w); } P.needsUpdate = true; });
      { const P = diaG.attributes.position, B = diaG.userData.base; for (let i = 0; i < P.count; i++) { const x = B[i * 3], y = B[i * 3 + 1], z = B[i * 3 + 2]; const w = smooth(-8.2, -2.4, y); P.setXYZ(i, x, y - DIA_D * b * w, z + .18 * b * w); } P.needsUpdate = true; diaG.computeVertexNormals(); }
      { const P = lungG.attributes.position, B = lungG.userData.base; for (let i = 0; i < P.count; i++) { const x = B[i * 3], y = B[i * 3 + 1], z = B[i * 3 + 2]; const wb = smooth(4.5, -5.5, y), wr = smooth(6, -1, y); const s = .055 * b * wr; P.setXYZ(i, x + (x - Math.sign(x) * 1.2) * s, y - DIA_D * .95 * b * wb, z + (z + 3) * s); } P.needsUpdate = true; lungG.computeVertexNormals(); }
    };
    apply();

    /* ===== 공기 알갱이 ===== */
    const R = M.routes, up = R.up.map((q) => V(...q));
    const paths = Object.keys(R).filter((k) => k !== 'up').map((k) => new Path((headOn ? up : []).concat(R[k].map((q) => V(...q)))));
    const NA = 140, airM = new THREE.MeshStandardMaterial({ color: COL.air, roughness: .45, transparent: true, depthTest: false }), aim = new THREE.InstancedMesh(new THREE.SphereGeometry(.13, 12, 9), airM, NA); aim.renderOrder = 40; aim.frustumCulled = false; root.add(aim);
    const AIR = Array.from({ length: NA }, (_, i) => ({ p: paths[i % paths.length], u: Math.random(), sp: rnd(.8, 1.2), j: V(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(.12) }));
    const dum = new THREE.Object3D(), tp = V();
    let airOn = true, flow = 0, airAll = false;
    /* 들숨 때 폐 안으로 들어가면 폐 속에 흩어진다 */
    const spread = (a, u, out) => { a.p.at(Math.min(u, 1), out); if (u > 1) { const k = u - 1; out.add(tw.copy(a.j).multiplyScalar(k * 22)); } return out; };

    /* ===== 이름표 ===== */
    const lab = labels(st);
    const rib6 = ribOf('R', 6), rib5L = ribOf('L', 5);
    lab.add('rib', '갈비뼈', () => ribMove(rib6, rib6.lat, V()), .1, .3, 'b', { px: .08, py: .27 });
    lab.add('dia', '가로막', () => V(-2.2, -3.3 - DIA_D * b, 1.2), .1, .74, 'b', { px: .08, py: .72 });
    lab.add('lung', '폐', () => V(4.2, 1.2, 1.5), .9, .44, 'b', { px: .92, py: .42 });
    lab.add('tra', '숨관', V(0, 6.0, .05), .9, .12, 'b', { px: .92, py: .1 });
    lab.add('bro', '숨관가지', V(1.6, 2.7, -.7), .9, .27, 'b', { px: .92, py: .26 });
    lab.add('nose', '코', V(0, 10.7, 4.3), .9, .06, 'b', { px: .92, py: .05 });
    lab.add('hrt', '심장', V(.8, -.6, 2.2), .9, .62, '', { px: .92, py: .62 });
    lab.add('cav', '흉강', () => V(-1.6, -1.5 - .4 * b, -1.2), .1, .52, 'b', { px: .08, py: .52 });

    /* ===== 시점 ===== */
    const box = (x0, x1, y0, y1, z0 = -4, z1 = 4) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0)); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.visible = false; st.scene.add(m); return m; };
    const VIEW = { chest: box(-6, 6, -10, 7.4), side: box(-1, 1, -10.4, 7.4, -5.2, 5.2), system: box(-6, 6, -9.6, 17), card: box(-6.6, 6.6, -10.4, 7.2), lh: box(-5.4, 5.4, -7.6, 7.6) };
    const DIR = { chest: V(0, .06, 1), side: V(-1, .06, .08), system: V(.16, .05, 1), card: V(.32, .14, 1) };
    const setView = (k, dur = 0) => { st.fit([VIEW[k]], { dir: DIR[k], margin: 1.02, dur: window.__bakeT !== undefined ? 0 : dur, target: VIEW[k].position.clone() }); };
    setView(opt.view || (headOn ? 'system' : 'chest'));

    /* ===== 시간 ===== */
    const clk = { dt: 0, last: 0 };
    st.onFrame((d) => { if (window.__bakeT !== undefined) { const n = window.__bakeT; clk.dt = Math.max(0, n - clk.last); clk.last = n; } else clk.dt = d; });
    let anim = null, auto = null, onB = null;
    st.onFrame(() => {
      const dt = clk.dt, b0 = b;
      if (auto) { auto.t += dt; const ph = (auto.t % auto.T) / auto.T; b = .5 - .5 * Math.cos(ph * Math.PI * 2); }
      else if (anim) { anim.t += REDUCE ? 1 : dt / anim.dur; const t = Math.min(1, anim.t), e = .5 - .5 * Math.cos(t * Math.PI); b = anim.a + (anim.b - anim.a) * e; if (t >= 1) { const cb = anim.cb; anim = null; cb && cb(); } }
      flow = dt > 0 ? (b - b0) / dt : 0;
      apply(); onB && onB(b, flow);
      /* 공기 */
      const s = airOn ? Math.min(1, Math.abs(flow) * 1.6) : 0;
      AIR.forEach((a, i) => {
        if (s > 0 || airAll) { a.u += (flow >= 0 ? 1 : -1) * dt * (airAll ? .25 : .55 * Math.max(.35, Math.abs(flow))) * a.sp; }
        if (a.u > 1.18) a.u = flow >= 0 ? rnd(-.05, .05) : a.u; if (a.u < -.02) a.u = 1.18 - rnd(0, .05);
        const vis = (s > .02 || airAll) && airOn; spread(a, a.u, tp);
        const fade = Math.min(1, (a.u + .02) / .06, (1.18 - a.u) / .1);
        dum.position.copy(tp); dum.scale.setScalar(vis ? Math.max(0, fade) * (airAll ? 1 : Math.min(1, s * 1.4 + .2)) : 0); dum.updateMatrix(); aim.setMatrixAt(i, dum.matrix);
      });
      aim.instanceMatrix.needsUpdate = true;
    });

    /* 돌리는 영상: 빛도 함께 돈다 */
    const spinRig = { on: false };
    st.onFrame(() => { if (!spinRig.on) return; const T = window.__bakeT || 0, a = spinRig.a0 + T / spinRig.T * Math.PI * 2 * spinRig.turn; const t = st.controls.target; st.camera.position.set(t.x + Math.sin(a) * spinRig.d, t.y + spinRig.dy, t.z + Math.cos(a) * spinRig.d); [st.sun, fill, back].forEach((o) => { if (!o.userData.p0) o.userData.p0 = o.position.clone(); o.position.copy(o.userData.p0).applyAxisAngle(V(0, 1, 0), a - spinRig.a0); }); });

    const api = {};
    Object.defineProperties(api, Object.getOwnPropertyDescriptors({
      st, parts, ribs, lab, VIEW, COL,
      get b() { return b; }, get flow() { return flow; },
      set(v) { anim = null; auto = null; b = v; apply(); },
      to(v, dur, cb) { auto = null; anim = { a: b, b: v, t: 0, dur: dur || 2.4, cb }; },
      breathe(T) { anim = null; auto = T ? { T, t: Math.acos(1 - 2 * b) / (Math.PI * 2) * T } : null; },
      onB(f) { onB = f; },
      air(v, all) { airOn = v; airAll = !!all; },
      head(v) { parts.skull.visible = parts.nose.visible = v; },
      cut,
      heart(v) { parts.heart.visible = parts.vessel.visible = v; },
      lungOpacity(o) { lungM.opacity = o; },
      setView, showLabs: (k) => lab.only(k),
      figure(k) {
        lab.only([]); airOn = false;
        if (k === 'lh') { ['spine', 'clav', 'skull', 'nose'].forEach((n) => { parts[n].visible = false; }); ribs.forEach((r) => { r.me.visible = false; }); carts.forEach((c) => { c.me.visible = false; }); stern.visible = false; dia.visible = false; lungM.opacity = .82; parts.heart.visible = parts.vessel.visible = true; parts.tree.visible = false; st.fit([VIEW.lh], { dir: V(0, 0, 1), margin: 1.01, dur: 0, target: VIEW.lh.position.clone() }); }
      },
      spin(T, turn = 1, a0 = 0) { spinRig.on = true; spinRig.T = T; spinRig.turn = turn; spinRig.a0 = a0; const t = st.controls.target; spinRig.d = Math.hypot(st.camera.position.x - t.x, st.camera.position.z - t.z); spinRig.dy = st.camera.position.y - t.y; },
    }));
    return api;
  }
  return { chest, data, labels, Path, COL };
})();
window.CH3 = CH3;
