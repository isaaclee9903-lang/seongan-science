/* ===== 소화계 3D 도구 DG3 =====
   입(입술·이·혀·침샘)·식도·위·샘창자·작은창자·큰창자·항문·간·쓸개·이자·뼈: BodyParts3D 4.0(CC BY 4.0). media/ATTRIBUTION.txt
   인두와 구불잘록창자 부분은 자료에 관 모양이 없어 가운데 길을 따라 새로 만든 관이다(_dg_prep.py).
   DG3.body: 음식물 흐름, 음식물 따라가기 tour, 소화관·소화샘 강조, 쓸개즙·이자액·침이 나오는 길.
   알갱이의 크기·수·빠르기는 잘 보이게 정한 모형이다. C3와 같은 모듈 안에 넣는다. */
const DG3 = (() => {
  'use strict';
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const REDUCE = C3.REDUCE;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const COL = { bone: '#e6dcc8', teeth: '#f4efe3', tongue: '#cc6a64', lip: '#c4695f', saliv: '#e3b25e', phar: '#cf8473', eso: '#cf8473', sto: '#d9826e', duo: '#e8a47e', si: '#ecb18c', li: '#d29a6c', rect: '#c98a60', anus: '#b8755a',
    liver: '#7c2f24', gall: '#4f8f45', bile: '#6f9f45', pan: '#e2b866', pduct: '#c99a3e', food: '#b98a4e', dig: '#e3c27a', waste: '#7a5232', spit: '#8cc4ea', gastric: '#c9a6e0', bileJ: '#5f9a3a', panJ: '#f0c230' };
  /* 이 수업의 이름 (교과서 표기) */
  const NAME = { mouth: '입', eso: '식도', sto: '위', si: '작은창자', li: '큰창자', anus: '항문', saliv: '침샘', liver: '간', gall: '쓸개', pan: '이자', duo: '샘창자' };
  const TUBE = ['lip', 'teeth', 'tongue', 'phar', 'eso', 'sto', 'duo', 'si', 'li', 'sig', 'rect', 'anus'];
  const GLAND = ['saliv', 'liver', 'gall', 'bile', 'pan', 'pduct'];

  let dataP = null;
  function data() {
    if (dataP) return dataP;
    dataP = Promise.all([fetch('media/dg.json').then((r) => r.json()), fetch('media/dg.bin').then((r) => r.arrayBuffer())]).then(([m, b]) => {
      const n = m.counts[0], pos = new Int16Array(b, 0, n * 3), nor = new Int16Array(b, n * 6, n * 3), idx = new Uint32Array(b, m.iOff, m.counts[1]);
      const pa = new THREE.BufferAttribute(pos, 3, true), na = new THREE.BufferAttribute(nor, 3, true);
      const geo = (ranges) => { let c = 0; ranges.forEach((r) => { c += r[1]; }); const ix = new Uint32Array(c); let o = 0; ranges.forEach((r) => { ix.set(idx.subarray(r[0], r[0] + r[1]), o); o += r[1]; }); const G = new THREE.BufferGeometry(); G.setAttribute('position', pa); G.setAttribute('normal', na); G.setIndex(new THREE.BufferAttribute(ix, 1)); return G; };
      return { m, geo };
    });
    return dataP;
  }

  /* 이름표: 3D 위치에서 칸 비율 (x,y)의 글자까지 얇은 선 (EX3와 같은 모양) */
  (function css() { const c = document.createElement('style'); c.textContent = '.hl{position:absolute;left:0;top:0;z-index:4;font:700 clamp(13px,1.25vw,16px)/1.2 Pretendard,sans-serif;color:#14263b;white-space:nowrap;pointer-events:none;background:rgba(255,255,255,.88);padding:2px 7px;border-radius:6px}.hl.b{font-weight:800;font-size:clamp(14px,1.45vw,18px)}.hl small{display:block;font-size:.76em;font-weight:700;color:#5a6b7e;margin-top:1px}.hl.on{color:#0e63b3}.hl.dim{color:#9aa8b6}.hl.cap3{font-size:clamp(13px,1.2vw,15px);font-weight:800;color:#0b3f73;background:rgba(255,255,255,.94);border:1px solid #d6e5f5}'; document.head.appendChild(c); })();
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

  function baseStage(host, opt) {
    const st = C3.makeStage(host, { fov: opt.fov || 30, minD: opt.minD || 4, maxD: opt.maxD || 160, hold: !!opt.hold, scroll: !!opt.scroll, exposure: .98, sunX: 6, sunZ: 9 });
    st.scene.environmentIntensity = .55; st.scene.traverse((o) => { if (o.isHemisphereLight) o.intensity = .5; });
    st.scene.background = new THREE.Color('#ffffff');
    st.camera.far = 700; st.camera.updateProjectionMatrix();
    st.sun.position.set(9, 14, 16); st.sun.castShadow = false;
    const fill = new THREE.DirectionalLight(0xffffff, .55); fill.position.set(-10, 4, 8); st.scene.add(fill);
    const back = new THREE.DirectionalLight(0xfff2ea, .45); back.position.set(0, 6, -14); st.scene.add(back);
    const clk = { dt: 0, last: 0 };
    st.onFrame((d) => { if (window.__bakeT !== undefined) { const n = window.__bakeT; clk.dt = Math.max(0, n - clk.last); clk.last = n; } else clk.dt = Math.min(.05, d); });
    const spinRig = { on: false };
    st.onFrame(() => { if (!spinRig.on) return; const Tt = window.__bakeT || 0, a = spinRig.a0 + Tt / spinRig.T * Math.PI * 2 * spinRig.turn; const t = st.controls.target; st.camera.position.set(t.x + Math.sin(a) * spinRig.d, t.y + spinRig.dy, t.z + Math.cos(a) * spinRig.d); [st.sun, fill, back].forEach((o) => { if (!o.userData.p0) o.userData.p0 = o.position.clone(); o.position.copy(o.userData.p0).applyAxisAngle(V(0, 1, 0), a - spinRig.a0); }); });
    const spin = (Tt, turn = 1, a0) => { const t = st.controls.target, dx = st.camera.position.x - t.x, dz = st.camera.position.z - t.z; spinRig.on = true; spinRig.T = Tt; spinRig.turn = turn; spinRig.a0 = a0 === undefined ? Math.atan2(dx, dz) : a0; spinRig.d = Math.hypot(dx, dz); spinRig.dy = st.camera.position.y - t.y; };
    return { st, clk, spin };
  }
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .72, metalness: 0 }, o));

  /* 울퉁불퉁한 덩어리 모양 (음식물·찌꺼기) */
  function lump(r, seed) {
    const g = new THREE.IcosahedronGeometry(r, 2), p = g.attributes.position, v = V();
    let s = seed; const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const k = [R() * 6, R() * 6, R() * 6];
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = 1 + .16 * Math.sin(v.x * 9 + k[0]) * Math.cos(v.y * 8 + k[1]) + .1 * Math.sin(v.z * 11 + k[2]); v.multiplyScalar(n); v.y *= .82; p.setXYZ(i, v.x, v.y, v.z); }
    g.computeVertexNormals(); return g;
  }

  /* ===================== 몸속 소화계 ===================== */
  async function body(host, opt = {}) {
    const D = await data(), M = D.m, G = M.groups, K = M.K;
    const { st, clk, spin } = baseStage(host, opt);
    const root = new THREE.Group(); st.scene.add(root);
    const parts = {};
    const stat = (k, m) => { const me = new THREE.Mesh(D.geo([G[k]]), m); me.scale.setScalar(K); me.frustumCulled = false; root.add(me); parts[k] = me; me.userData.op = m.opacity; me.userData.tr = m.transparent; return me; };
    const boneM = mat(COL.bone, { roughness: .9 });
    stat('skull', boneM); stat('jaw', boneM); stat('spine', boneM); stat('hip', boneM);
    stat('rib', mat(COL.bone, { roughness: .9, transparent: true, opacity: .32, depthWrite: false }));
    parts.rib.renderOrder = 30;
    stat('teeth', mat(COL.teeth, { roughness: .45 })); stat('tongue', mat(COL.tongue, { roughness: .6 })); stat('lip', mat(COL.lip, { roughness: .6 }));
    stat('saliv', mat(COL.saliv, { roughness: .66 }));
    stat('phar', mat(COL.phar, { roughness: .58 })); stat('eso', mat(COL.eso, { roughness: .58 }));
    stat('sto', mat(COL.sto, { roughness: .56 }));
    stat('duo', mat(COL.duo, { roughness: .6 })); stat('si', mat(COL.si, { roughness: .6 }));
    const liM = mat(COL.li, { roughness: .64 }); stat('li', liM); stat('sig', liM.clone()); stat('rect', mat(COL.rect, { roughness: .64 })); stat('anus', mat(COL.anus, { roughness: .7 }));
    stat('liver', mat(COL.liver, { roughness: .5 }));
    stat('gall', mat(COL.gall, { roughness: .5 })); stat('bile', mat(COL.bile, { roughness: .55 }));
    stat('pan', mat(COL.pan, { roughness: .7 })); stat('pduct', mat(COL.pduct, { roughness: .6 }));

    /* ----- 길 ----- */
    const R = M.routes, mk = (k) => new Path(R[k].map((q) => V(...q)));
    const PA = { food: mk('food'), bileIn: mk('bileIn'), bileOut: mk('bileOut'), panc: mk('panc') };
    const P = M.pts, pt = (k) => V(...P[k]);
    /* 음식물 길: 이름이 바뀌는 곳(marks)과 머무는 시간 비율. s(0~1, 시간) → u(0~1, 길) */
    const MK = M.marks.food.map((a) => a[0]).concat([1]), NM = M.marks.food.map((a) => a[1]);
    const WT = { 입: .07, 식도: .09, 위: .2, 작은창자: .34, 큰창자: .24, 항문: .06 };
    const SW = []; { let a = 0; NM.forEach((n) => { SW.push(a); a += WT[n] || .1; }); SW.push(a); for (let i = 0; i < SW.length; i++) SW[i] /= a; }
    const s2u = (s) => { s = Math.max(0, Math.min(1, s)); let i = 0; while (i < NM.length - 1 && s > SW[i + 1]) i++; const t = (s - SW[i]) / (SW[i + 1] - SW[i]); return MK[i] + (MK[i + 1] - MK[i]) * t; };
    const stageOf = (u) => { let i = 0; while (i < NM.length - 1 && u >= MK[i + 1]) i++; return i; };

    /* ----- 흐르는 음식물: 입·식도 덩어리 → 위·작은창자에서 작게 → 큰창자 찌꺼기 ----- */
    const NF = 64, geoF = lump(.17, 3);
    const imF = new THREE.InstancedMesh(geoF, mat('#ffffff', { roughness: .8, depthTest: false, transparent: true }), NF); imF.renderOrder = 120; imF.frustumCulled = false; root.add(imF);
    const AF = Array.from({ length: NF }, (_, i) => ({ s: i / NF + rnd(0, .01), sp: rnd(.85, 1.15), j: V(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(0, .1)), r: V(rnd(0, 6), rnd(0, 6), rnd(0, 6)) }));
    const cF = new THREE.Color(COL.food), cD = new THREE.Color(COL.dig), cW = new THREE.Color(COL.waste), tc = new THREE.Color();
    const flow = { food: false, speed: 1, scale: 1 };
    const dum = new THREE.Object3D(), tp = V();
    const foodLook = (u, out) => { const i = stageOf(u), n = NM[i]; if (n === '입' || n === '식도') { out.copy(cF); return 1.15; } if (n === '위') { const t = (u - MK[i]) / (MK[i + 1] - MK[i]); out.copy(cF).lerp(cD, t); return 1.1 - .35 * t; } if (n === '작은창자') { const t = (u - MK[i]) / (MK[i + 1] - MK[i]); out.copy(cD).lerp(cW, Math.max(0, t - .85) * 4); return .55 - .2 * t; } out.copy(cW); return .85; };
    /* ----- 소화액 알갱이 (침·위액·쓸개즙·이자액) ----- */
    const drop = new THREE.SphereGeometry(.09, 10, 8);
    const juice = { spit: false, gastric: false, bile: false, panc: false, scale: 1 };
    const JN = 26;
    const mkJ = (c) => { const im = new THREE.InstancedMesh(drop, mat(c, { roughness: .3, depthTest: false, transparent: true }), JN); im.renderOrder = 130; im.frustumCulled = false; root.add(im); return { im, a: Array.from({ length: JN }, (_, i) => ({ u: i / JN, sp: rnd(.8, 1.2), j: V(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(0, .06)) })) }; };
    const JS = { spit: mkJ(COL.spit), gastric: mkJ(COL.gastric), bileIn: mkJ(COL.bileJ), bileOut: mkJ(COL.bileJ), panc: mkJ(COL.panJ) };
    /* 침: 양쪽 침샘 → 입안 */
    const sgR = pt('saliv'), sgL = sgR.clone(); sgL.x *= -1; const oral = pt('oral');
    const spitPath = [new Path([sgR, sgR.clone().lerp(oral, .5).add(V(0, .25, .2)), oral]), new Path([sgL, sgL.clone().lerp(oral, .5).add(V(0, .25, .2)), oral])];
    /* 위액: 위 안쪽 벽에서 가운데로 */
    const stoU = [MK[NM.indexOf('위')], MK[NM.indexOf('위') + 1]];

    /* ----- 따라가기 ----- */
    const bolus = new THREE.Mesh(lump(.34, 11), mat(COL.food, { roughness: .8, depthTest: false, transparent: true })); bolus.renderOrder = 201;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.62, .05, 8, 40), new THREE.MeshBasicMaterial({ color: '#0e63b3', depthTest: false, transparent: true })); ring.renderOrder = 202;
    const MKG = new THREE.Group(); MKG.add(bolus, ring); MKG.visible = false; root.add(MKG);
    let tour = null, onTour = null;

    /* ----- 이름표 ----- */
    const lab = labels(st);
    const fu = (n, f = .5) => () => { const i = NM.indexOf(n); return PA.food.at(MK[i] + (MK[i + 1] - MK[i]) * f, V()); };
    lab.add('mouth', '입', () => pt('mouth').add(V(0, -.1, .2)), .26, .08, 'b');
    lab.add('saliv', '침샘', () => sgL.clone(), .74, .1, 'b');
    lab.add('teeth', '이와 혀', () => pt('tongue').add(V(.1, .2, .4)), .74, .16, 'b');
    lab.add('eso', '식도', () => pt('eso'), .26, .26, 'b');
    lab.add('liver', '간', () => pt('liver').add(V(-.9, .2, .6)), .2, .4, 'b');
    lab.add('gall', '쓸개', () => pt('gall'), .2, .52, 'b');
    lab.add('sto', '위', () => pt('sto').add(V(.6, .2, .6)), .8, .38, 'b');
    lab.add('pan', '이자', () => pt('pan').add(V(1.1, 0, 0)), .8, .48, 'b');
    lab.add('duo', '샘창자', () => pt('duo'), .2, .62, 'b');
    lab.add('si', '작은창자', () => pt('si').add(V(.4, -.3, .6)), .8, .66, 'b');
    lab.add('li', '큰창자', () => pt('asc'), .2, .74, 'b');
    lab.add('anus', '항문', () => pt('anus'), .8, .9, 'b');
    lab.add('tour', '', () => MKG.position, .5, .05, 'cap3', { c: true });

    /* ----- 시점 ----- */
    const box = (x0, x1, y0, y1, z0 = -3, z1 = 3) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0)); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.visible = false; st.scene.add(m); return m; };
    const mo = pt('mouth'), gl = pt('gall'), pn = pt('pan');
    const VIEW = { front: box(-5, 5, -15, 21.2), mouth: box(mo.x - 2.6, mo.x + 2.6, mo.y - 3.2, mo.y + 2.2, mo.z - 4, mo.z), gland: box(gl.x - 1.6, pn.x + 1.4, pn.y - 1.8, gl.y + 3.4, -1, 3.5), card: box(-4.6, 4.6, -15, 21.2), belly: box(-5, 5, -14.6, 2.8) };
    const DIR = { front: V(0, .03, 1), mouth: V(.85, .08, 1), gland: V(.08, .18, 1), card: V(.32, .1, 1), belly: V(0, .05, 1) };
    let curView = 'front';
    const setView = (k, dur = 0) => { curView = k; st.fit([VIEW[k]], { dir: DIR[k].clone().normalize(), margin: 1.02, dur: window.__bakeT !== undefined ? 0 : dur, target: VIEW[k].position.clone() }); };
    setView(opt.view || 'front');

    /* ----- 보이기·흐리게 ----- */
    const fadeTo = {};
    const setOp = (k, op) => { fadeTo[k] = op; };
    const focus = (keys) => { Object.keys(parts).forEach((k) => { if (['skull', 'jaw', 'spine', 'hip', 'rib'].includes(k)) return; setOp(k, !keys || keys.includes(k) ? 1 : .13); }); };
    const show = (o) => { Object.entries(o).forEach(([k, v]) => { if (parts[k]) parts[k].visible = v; }); };
    st.onFrame(() => {
      const dt = clk.dt;
      Object.entries(fadeTo).forEach(([k, to]) => {
        const m = parts[k].material, base = parts[k].userData.op === undefined ? 1 : parts[k].userData.op, target = to * base;
        const cur = m.userData.o === undefined ? base : m.userData.o, nx = window.__bakeT !== undefined || REDUCE ? target : cur + (target - cur) * Math.min(1, dt * 5);
        m.userData.o = nx; m.opacity = nx; const tr = nx < .99 || parts[k].userData.tr; if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } m.depthWrite = nx > .6;
        parts[k].renderOrder = nx < .99 ? 40 : 0;
      });
    });

    /* ----- 매 장면 ----- */
    st.onFrame(() => {
      const dt = clk.dt;
      /* 음식물 */
      AF.forEach((a, i) => {
        if (flow.food) a.s += dt * .022 * flow.speed * a.sp;
        if (a.s > 1) a.s -= 1;
        const u = s2u(a.s); PA.food.at(u, tp).add(a.j);
        const sc = foodLook(u, tc), fade = Math.min(1, a.s / .02, (1 - a.s) / .02);
        dum.position.copy(tp); a.r.x += dt * .8; dum.rotation.set(a.r.x, a.r.y, a.r.z); dum.scale.setScalar(flow.food ? Math.max(0, fade) * sc * flow.scale : 0); dum.updateMatrix(); imF.setMatrixAt(i, dum.matrix); imF.setColorAt(i, tc);
      });
      imF.instanceMatrix.needsUpdate = true; if (imF.instanceColor) imF.instanceColor.needsUpdate = true;
      /* 소화액 */
      const runJ = (key, on, pathOf, rate) => { const J = JS[key]; J.a.forEach((a, i) => { if (on) a.u += dt * rate * a.sp; if (a.u > 1) a.u -= 1; pathOf(a, i).at(a.u, tp).add(a.j); const f = Math.min(1, a.u / .08, (1 - a.u) / .1); dum.position.copy(tp); dum.rotation.set(0, 0, 0); dum.scale.setScalar(on ? Math.max(0, f) * juice.scale : 0); dum.updateMatrix(); J.im.setMatrixAt(i, dum.matrix); }); J.im.instanceMatrix.needsUpdate = true; };
      runJ('spit', juice.spit, (a, i) => spitPath[i % 2], .55);
      runJ('bileIn', juice.bile, () => PA.bileIn, .32);
      runJ('bileOut', juice.bile, () => PA.bileOut, .32);
      runJ('panc', juice.panc, () => PA.panc, .32);
      /* 위액: 위 벽 가까이에서 생겨 가운데로 퍼진다 */
      { const J = JS.gastric; J.a.forEach((a, i) => { if (juice.gastric) a.u += dt * .45 * a.sp; if (a.u > 1) { a.u -= 1; a.k = undefined; } if (a.k === undefined) { a.k = stoU[0] + (stoU[1] - stoU[0]) * (.15 + .7 * Math.random()); a.d = V(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize(); } PA.food.at(a.k, tp); tp.addScaledVector(a.d, .75 * (1 - a.u)); const f = Math.min(1, a.u / .15, (1 - a.u) / .25); dum.position.copy(tp); dum.scale.setScalar(juice.gastric ? Math.max(0, f) * .9 : 0); dum.updateMatrix(); J.im.setMatrixAt(i, dum.matrix); }); J.im.instanceMatrix.needsUpdate = true; }
      /* 따라가기 */
      if (tour) {
        tour.t += dt * (REDUCE ? 3 : 1) * tour.rate;
        const s = Math.min(1, tour.t / tour.dur), u = s2u(s);
        PA.food.at(u, MKG.position); MKG.visible = true; ring.lookAt(st.camera.position); bolus.rotation.x += dt * .9; bolus.rotation.z += dt * .5;
        const look = foodLook(u, tc); bolus.material.color.copy(tc); bolus.scale.setScalar(.6 + look * .45);
        const wi = stageOf(u), name = NM[wi];
        if (wi !== tour.wi) { tour.wi = wi; lab.L.tour.e.textContent = name; tour.auto && autoJuice(name); onTour && onTour(wi, name); }
        if (s >= 1) { tour = null; MKG.visible = false; lab.L.tour.show = false; onTour && onTour(-1, ''); }
      }
    });
    const autoJuice = (n) => { juice.spit = n === '입'; juice.gastric = n === '위'; juice.bile = juice.panc = n === '작은창자'; };

    const api = {};
    Object.defineProperties(api, Object.getOwnPropertyDescriptors({
      st, parts, lab, VIEW, COL, PA, NAME, TUBE, GLAND, marks: NM,
      get view() { return curView; }, get touring() { return !!tour; },
      setView, show, focus, spin, setOp,
      showLabs: (k) => lab.only(k.concat(tour ? ['tour'] : [])), place: (P_) => lab.place(P_),
      flow(o) { Object.assign(flow, o); }, juice(o) { Object.assign(juice, o); },
      tour(cb, o = {}) { tour = { t: 0, dur: o.dur || 34, rate: 1, wi: -1, auto: o.auto !== false }; onTour = cb || onTour; lab.L.tour.show = true; },
      set tourRate(v) { if (tour) tour.rate = v; },
      stopTour() { tour = null; MKG.visible = false; lab.L.tour.show = false; },
    }));
    return api;
  }
  return { body, data, labels, Path, COL, lump };
})();
window.DG3 = DG3;
