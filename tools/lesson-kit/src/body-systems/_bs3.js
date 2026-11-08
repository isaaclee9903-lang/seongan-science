/* ===== 기관계 한 몸 3D 도구 BS3 =====
   뼈·소화계·순환계·숨관·배설계·넓적다리 근육: BodyParts3D 4.0(CC BY 4.0), 폐 표면: HuBMAP CCF(CC BY 4.0). media/ATTRIBUTION.txt
   BS3.body: 한 몸 속 네 기관계, 산소·이산화 탄소·영양소·노폐물 알갱이가 실제 길(코·입 → 폐·작은창자 → 심장 → 조직세포 → 폐·콩팥)로 흐른다.
   기관계 강조 sys, 따라가기 tour, 운동 정도 activity(숨·심장 박동 빨라짐), 기관계 멈추기 off.
   알갱이의 크기·수·빠르기는 잘 보이게 정한 모형이다. 조직세포는 온몸에 있으며 넓적다리 근육을 예로 보인다. C3와 같은 모듈 안에 넣는다. */
const BS3 = (() => {
  'use strict';
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const REDUCE = C3.REDUCE;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const COL = {
    bone: '#e6dcc6', mus: '#b9594b', eso: '#dd9a86', sto: '#df9d86', si: '#e7b39a', li: '#d29a78', liver: '#8f3e2e', gall: '#7f9441', pan: '#e2bd88',
    tra: '#a9c8e2', bro: '#9dbfdc', lung: '#e4979c', dia: '#c46c5c', heart: '#bf4d40', art: '#cf3b2f', vei: '#4d6fb3', kid: '#a9473e', ure: '#e8cf93', blad: '#e8c8a0',
    o2: '#d8392b', co2: '#2f7fd0', nut: '#7d55c7', was: '#e3ad18',
  };
  /* 기관계마다 묶음 */
  const SYS = { dig: ['eso', 'sto', 'si', 'li', 'liver', 'gall', 'pan'], res: ['tra', 'bro', 'lungL', 'lungR', 'dia'], cir: ['heart', 'art', 'vei', 'pa', 'pv'], exc: ['kid', 'ure', 'blad', 'ureth'] };
  const SYSN = { dig: '소화계', res: '호흡계', cir: '순환계', exc: '배설계' };
  /* 길의 구간이 어느 기관계에 속하는지 (따라가기 이름표와 멈추기에 쓴다) */
  const OWN = (route, name) => {
    if (/^(코|숨관|숨관가지|폐\(허파꽈리\)|입·코 밖으로)$/.test(name)) return 'res';
    if (route === 'co2' && name === '폐') return 'res';
    if (/^(입|식도|위|작은창자)$/.test(name)) return 'dig';
    if (/^(콩팥|오줌관|방광|요도)$/.test(name)) return 'exc';
    if (name === '조직세포') return 'cell';
    return 'cir';
  };

  let dataP = null;
  function data() {
    if (dataP) return dataP;
    dataP = Promise.all([fetch('media/bs.json').then((r) => r.json()), fetch('media/bs.bin').then((r) => r.arrayBuffer())]).then(([m, b]) => {
      const n = m.counts[0], pos = new Int16Array(b, 0, n * 3), nor = new Int16Array(b, n * 6, n * 3), idx = new Uint32Array(b, m.iOff, m.counts[1]);
      const pa = new THREE.BufferAttribute(pos, 3, true), na = new THREE.BufferAttribute(nor, 3, true);
      const geo = (ranges) => { let c = 0; ranges.forEach((r) => { c += r[1]; }); const ix = new Uint32Array(c); let o = 0; ranges.forEach((r) => { ix.set(idx.subarray(r[0], r[0] + r[1]), o); o += r[1]; }); const G = new THREE.BufferGeometry(); G.setAttribute('position', pa); G.setAttribute('normal', na); G.setIndex(new THREE.BufferAttribute(ix, 1)); return G; };
      return { m, geo };
    });
    return dataP;
  }

  /* 이름표: 3D 위치에서 칸 비율 (x,y)의 글자까지 얇은 선 (배설 수업 EX3와 같은 모양) */
  (function css() { const c = document.createElement('style'); c.textContent = '.bsl{position:absolute;left:0;top:0;z-index:4;font:700 clamp(13px,1.2vw,15.5px)/1.2 Pretendard,sans-serif;color:#14263b;white-space:nowrap;pointer-events:none;background:rgba(255,255,255,.9);padding:2px 7px;border-radius:6px}.bsl.b{font-weight:800;font-size:clamp(14px,1.4vw,17px)}.bsl small{display:block;font-size:.76em;font-weight:700;color:#5a6b7e;margin-top:1px}.bsl.cap3{font-size:clamp(13px,1.2vw,15px);font-weight:800;color:#0b3f73;background:rgba(255,255,255,.95);border:1px solid #d6e5f5}'; document.head.appendChild(c); })();
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
    const add = (k, t, at, x, y, cls = '', extra = {}) => { const e = document.createElement('div'); e.className = 'bsl ' + cls; e.innerHTML = t; host.appendChild(e); const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line'); ln.setAttribute('stroke', '#14263b'); ln.setAttribute('stroke-width', '1'); ov.appendChild(ln); L[k] = Object.assign({ e, ln, at, x, y, show: false }, extra); return L[k]; };
    const only = (keys) => { Object.entries(L).forEach(([k, a]) => { a.show = keys.includes(k); }); };
    const place = (P) => { Object.entries(P).forEach(([k, a]) => { const l = L[k]; if (!l) return; [l.x, l.y] = a; l.px = a[2] !== undefined ? a[2] : a[0]; l.py = a[3] !== undefined ? a[3] : a[1]; }); };
    return { add, only, place, L, ov };
  }

  class Path {
    constructor(pts) { this.p = pts; this.c = new Float32Array(pts.length); for (let i = 1; i < pts.length; i++) this.c[i] = this.c[i - 1] + pts[i].distanceTo(pts[i - 1]); this.len = this.c[pts.length - 1] || 1; }
    at(u, out = V()) { const s = Math.max(0, Math.min(1, u)) * this.len, c = this.c; let a = 0, b = c.length - 1; while (b - a > 1) { const m = (a + b) >> 1; if (c[m] <= s) a = m; else b = m; } const t = (s - c[a]) / Math.max(1e-6, c[b] - c[a]); return out.lerpVectors(this.p[a], this.p[b], t); }
  }

  function baseStage(host, opt) {
    const st = C3.makeStage(host, { fov: opt.fov || 28, minD: opt.minD || 6, maxD: opt.maxD || 220, hold: !!opt.hold, scroll: !!opt.scroll, exposure: .95, sunX: 6, sunZ: 9 });
    st.scene.environmentIntensity = .55; st.scene.traverse((o) => { if (o.isHemisphereLight) o.intensity = .45; });
    st.scene.background = new THREE.Color('#ffffff');
    st.camera.far = 900; st.camera.updateProjectionMatrix();
    st.sun.position.set(12, 22, 26); st.sun.castShadow = false;
    const fill = new THREE.DirectionalLight(0xffffff, .55); fill.position.set(-16, 6, 12); st.scene.add(fill);
    const back = new THREE.DirectionalLight(0xfff2ea, .4); back.position.set(0, 10, -22); st.scene.add(back);
    const clk = { dt: 0, last: 0, t: 0 };
    st.onFrame((d) => { if (window.__bakeT !== undefined) { const n = window.__bakeT; clk.dt = Math.max(0, n - clk.last); clk.last = n; } else clk.dt = Math.min(.05, d); clk.t += clk.dt; });
    const spinRig = { on: false };
    st.onFrame(() => { if (!spinRig.on) return; const T = window.__bakeT || 0, a = spinRig.a0 + T / spinRig.T * Math.PI * 2 * spinRig.turn; const t = st.controls.target; st.camera.position.set(t.x + Math.sin(a) * spinRig.d, t.y + spinRig.dy, t.z + Math.cos(a) * spinRig.d); [st.sun, fill, back].forEach((o) => { if (!o.userData.p0) o.userData.p0 = o.position.clone(); o.position.copy(o.userData.p0).applyAxisAngle(V(0, 1, 0), a - spinRig.a0); }); });
    const spin = (T, turn = 1, a0) => { const t = st.controls.target, dx = st.camera.position.x - t.x, dz = st.camera.position.z - t.z; spinRig.on = true; spinRig.T = T; spinRig.turn = turn; spinRig.a0 = a0 === undefined ? Math.atan2(dx, dz) : a0; spinRig.d = Math.hypot(dx, dz); spinRig.dy = st.camera.position.y - t.y; };
    return { st, clk, spin };
  }
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .72, metalness: 0 }, o));

  async function body(host, opt = {}) {
    const D = await data(), M = D.m, G = M.groups;
    const { st, clk, spin } = baseStage(host, opt);
    const K = M.K, root = new THREE.Group(); st.scene.add(root);
    const parts = {}, base = {};
    const stat = (k, m, ro = 0) => { const me = new THREE.Mesh(D.geo([G[k]]), m); me.scale.setScalar(K); me.frustumCulled = false; me.renderOrder = ro; root.add(me); parts[k] = me; base[k] = { op: m.opacity, tr: m.transparent, dw: m.depthWrite }; return me; };
    const boneM = mat(COL.bone, { roughness: .9 });
    ['skull', 'spine', 'hip', 'femur'].forEach((k) => stat(k, boneM.clone()));
    stat('rib', mat(COL.bone, { roughness: .9, transparent: true, opacity: .5, depthWrite: false }), 9);
    stat('musR', mat(COL.mus, { roughness: .8, transparent: true, opacity: .42, depthWrite: false }), 5); stat('musL', mat(COL.mus, { roughness: .8, transparent: true, opacity: .3, depthWrite: false }), 5);
    stat('eso', mat(COL.eso, { roughness: .55 })); stat('sto', mat(COL.sto, { roughness: .55 })); stat('si', mat(COL.si, { roughness: .6 })); stat('li', mat(COL.li, { roughness: .6 }));
    stat('liver', mat(COL.liver, { roughness: .5, transparent: true, opacity: .82 }), 7); stat('gall', mat(COL.gall, { roughness: .5 })); stat('pan', mat(COL.pan, { roughness: .6 }));
    stat('tra', mat(COL.tra, { roughness: .6 })); stat('bro', mat(COL.bro, { roughness: .6 }));
    stat('dia', mat(COL.dia, { roughness: .8, transparent: true, opacity: .28, depthWrite: false, side: THREE.DoubleSide }), 6);
    stat('heart', mat(COL.heart, { roughness: .55 }));
    stat('art', mat(COL.art, { roughness: .5 })); stat('vei', mat(COL.vei, { roughness: .5 })); stat('pa', mat(COL.vei, { roughness: .5 })); stat('pv', mat(COL.art, { roughness: .5 }));
    stat('kid', mat(COL.kid, { roughness: .55 })); stat('ure', mat(COL.ure, { roughness: .6 })); stat('blad', mat(COL.blad, { roughness: .6 })); stat('ureth', mat(COL.ure, { roughness: .6 }));
    /* 폐: 반투명. 숨 쉴 때 커지고 작아지도록 가운데 기준 무리 */
    const lungG = {};
    ['L', 'R'].forEach((s) => { const me = new THREE.Mesh(D.geo([G['lung' + s]]), mat(COL.lung, { roughness: .78, transparent: true, opacity: .55, depthWrite: false, side: THREE.FrontSide })); me.frustumCulled = false; me.geometry.computeBoundingBox(); const bb = me.geometry.boundingBox, c = V((bb.min.x + bb.max.x) / 2 * K, bb.max.y * K, (bb.min.z + bb.max.z) / 2 * K); const g = new THREE.Group(); g.position.copy(c); me.scale.setScalar(K); me.position.copy(c).multiplyScalar(-1); me.renderOrder = 8; g.add(me); root.add(g); lungG[s] = g; parts['lung' + s] = me; base['lung' + s] = { op: .55, tr: true, dw: false }; });
    /* 심장은 가운데 기준으로 뛰게 */
    { const me = parts.heart; me.geometry.computeBoundingBox(); const bb = me.geometry.boundingBox, c = V((bb.min.x + bb.max.x) / 2 * K, (bb.min.y + bb.max.y) / 2 * K, (bb.min.z + bb.max.z) / 2 * K); const g = new THREE.Group(); g.position.copy(c); root.remove(me); me.position.copy(c).multiplyScalar(-1); g.add(me); root.add(g); parts.heartG = g; }
    const diaY0 = parts.dia.position.y;

    /* ----- 길과 알갱이 ----- */
    const R = M.routes, MK = M.marks;
    const PA = {}; Object.keys(R).forEach((k) => { PA[k] = new Path(R[k].map((q) => V(...q))); });
    /* 길의 구간 [시작 u, 끝 u, 이름, 기관계] */
    const SEG = {}; Object.entries(MK).forEach(([k, m]) => { SEG[k] = m.map(([u, n], i) => [u, i < m.length - 1 ? m[i + 1][0] : 1, n, OWN(k, n)]); });
    const segAt = (k, u) => { const s = SEG[k]; for (let i = s.length - 1; i >= 0; i--) if (u >= s[i][0]) return i; return 0; };
    const SH = {
      o2: (() => { const g = new THREE.SphereGeometry(.24, 14, 10); return g; })(),
      co2: new THREE.SphereGeometry(.24, 14, 10),
      nut: (() => { const g = new THREE.CylinderGeometry(.3, .3, .16, 6); g.rotateX(Math.PI / 2); return g; })(),
      was: new THREE.BoxGeometry(.32, .32, .32),
    };
    const NN = { o2: 44, co2: 44, nut: 40, was: 32 };
    const IM = {}, PT = {};
    Object.keys(NN).forEach((k, i) => {
      IM[k] = new THREE.InstancedMesh(SH[k], mat(COL[k], { roughness: .42, depthTest: false, transparent: true }), NN[k]); IM[k].renderOrder = 100 + i; IM[k].frustumCulled = false; root.add(IM[k]);
      PT[k] = Array.from({ length: NN[k] }, (_, j) => ({ u: j / NN[k], sp: rnd(.85, 1.15), j: V(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(0, .22)), r: V(rnd(0, 6), rnd(0, 6), 0), live: 1 }));
    });
    const flow = { o2: true, co2: true, nut: true, was: true };
    const off = { dig: false, res: false, cir: false, exc: false };
    let act = 1, actTo = 1, speedMul = 1, psz = 1;
    /* 멈춘 기관계를 지나는 구간: 그 앞에서 기다린다 */
    const blockedU = (k) => { const s = SEG[k]; for (const x of s) if (off[x[3]] || (x[3] === 'cell' && false)) return x[0]; return 2; };
    const dum = new THREE.Object3D(), tp = V();
    let arrive = { o2: 0, nut: 0 };
    const stepFlow = (k, dt) => {
      const P = PA[k], arr = PT[k], im = IM[k], on = flow[k], stopAt = blockedU(k);
      arr.forEach((a, i) => {
        if (on) {
          const nu = a.u + dt * 2.6 * act * speedMul * a.sp / P.len;
          if (a.u < stopAt && nu >= stopAt - .004) a.u = Math.max(a.u, stopAt - .004 - (i % 7) * .0025); else if (a.u >= stopAt) { /* 멈춘 곳 안: 그대로 */ } else a.u = nu;
          if (a.u >= 1) { a.u -= 1; if (k === 'o2' || k === 'nut') arrive[k] += 1; }
        }
        P.at(a.u, tp).add(a.j);
        const fade = Math.min(1, a.u / .02, (1 - a.u) / .02);
        dum.position.copy(tp); a.r.x += dt * 1.4; dum.rotation.set(a.r.x, a.r.y, 0);
        dum.scale.setScalar(on ? Math.max(0, fade) * psz : 0); dum.updateMatrix(); im.setMatrixAt(i, dum.matrix);
      });
      im.instanceMatrix.needsUpdate = true;
    };

    /* ----- 따라가기 ----- */
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.85, .09, 8, 40), new THREE.MeshBasicMaterial({ color: '#0e63b3', depthTest: false, transparent: true }));
    const MKG = new THREE.Group(); MKG.add(ring); MKG.visible = false; ring.renderOrder = 201; root.add(MKG);
    const markIn = {}; Object.keys(SH).forEach((k) => { const m = new THREE.Mesh(SH[k], mat(COL[k], { depthTest: false, transparent: true })); m.scale.setScalar(2); m.renderOrder = 202; m.visible = false; MKG.add(m); markIn[k] = m; });
    let tour = null, onTour = null;

    /* ----- 이름표 ----- */
    const lab = labels(st);
    const PTS = {}; Object.entries(M.pts).forEach(([k, q]) => { PTS[k] = V(...q); });
    const onRoute = (k, name, f = .5) => { const s = SEG[k].find((x) => x[2] === name); return () => PA[k].at(s ? s[0] + (s[1] - s[0]) * f : .5, V()); };
    lab.add('eso', '식도', onRoute('nut', '식도', .55), .74, .26, 'b');
    lab.add('sto', '위', onRoute('nut', '위', .4), .78, .44, 'b');
    lab.add('liv', '간', () => PTS.liv.clone().add(V(-.6, .3, 1.2)), .22, .45, 'b');
    lab.add('si', '작은창자<small>영양소를 흡수해요</small>', () => PTS.abs.clone(), .78, .58, 'b');
    lab.add('li', '큰창자', () => V(-3.8, -3.6, 1.2), .22, .6, 'b');
    lab.add('nose', '코', () => PTS.nose.clone(), .26, .07, 'b');
    lab.add('tra', '숨관', onRoute('o2', '숨관', .5), .74, .2, 'b');
    lab.add('bro', '숨관가지', onRoute('o2', '숨관가지', .6), .22, .28, 'b');
    lab.add('lung', '폐<small>산소를 받아들여요</small>', () => PTS.lungL.clone().add(V(.6, 1.2, 0)), .78, .32, 'b');
    lab.add('dia', '가로막', () => V(4.4, 3.4, 1.6), .78, .44);
    lab.add('hrt', '심장', () => PTS.heart.clone(), .78, .3, 'b');
    lab.add('ao', '대동맥', onRoute('sys', '대동맥', .55), .78, .48, 'b');
    lab.add('ivc', '대정맥', onRoute('sys', '대정맥', .5), .22, .5, 'b');
    lab.add('pa', '폐동맥', onRoute('pulL', '폐동맥', .7), .78, .22);
    lab.add('pv', '폐정맥', onRoute('pul', '폐정맥', .4), .22, .3);
    lab.add('kid', '콩팥<small>혈액 속 노폐물을 걸러요</small>', () => PTS.kL.clone().add(V(.5, 0, 0)), .78, .56, 'b');
    lab.add('ure', '오줌관', onRoute('was', '오줌관', .5), .78, .68, 'b');
    lab.add('blad', '방광', () => PTS.bc.clone().add(V(.6, .3, .6)), .78, .78, 'b');
    lab.add('cell', '조직세포<small>넓적다리 근육의 예</small>', () => PTS.cells.clone(), .22, .84, 'b');
    lab.add('tour', '', () => MKG.position, .5, .05, 'cap3', { c: true });
    const LABS = { all: ['eso', 'sto', 'liv', 'si', 'nose', 'lung', 'hrt', 'kid', 'blad', 'cell'], dig: ['eso', 'sto', 'liv', 'si', 'li'], res: ['nose', 'tra', 'bro', 'lung', 'dia'], cir: ['hrt', 'ao', 'ivc', 'pa', 'pv', 'cell'], exc: ['kid', 'ure', 'blad'] };

    /* ----- 시점 ----- */
    const box = (x0, x1, y0, y1, z0 = -5, z1 = 5) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0)); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.visible = false; st.scene.add(m); return m; };
    const VIEW = { all: box(-6.4, 6.4, -20.6, 22.8), trunk: box(-6.4, 6.4, -12, 14.5), dig: box(-5.6, 5.6, -12, 16.5), res: box(-6.2, 6.2, 2, 18.5), cir: box(-6.4, 6.4, -20.6, 13), exc: box(-4.6, 4.6, -12.5, 3.5), cells: box(-5.5, 1.5, -20.6, -11), card: box(-6.6, 6.6, -7, 11.5), sysv: box(-6.4, 6.4, -13, 17.5), chest: box(-6.6, 6.6, -1.5, 12.5) };
    const DIR = { all: V(0, .03, 1), trunk: V(.06, .04, 1), dig: V(.12, .05, 1), res: V(.08, .04, 1), cir: V(.1, .04, 1), exc: V(.1, .04, 1), cells: V(-.2, .05, 1), card: V(.4, .1, 1), sysv: V(.12, .05, 1), chest: V(.1, .04, 1) };
    let curView = 'all';
    const PSZ = { sysv: .85, chest: .6, all: 1, trunk: .8, dig: .7, res: .62, cir: .85, exc: .7, cells: .8, card: .85 };
    const setView = (k, dur = 0) => { curView = k; psz = PSZ[k] || 1; st.fit([VIEW[k]], { dir: DIR[k], margin: 1.02, dur: window.__bakeT !== undefined ? 0 : dur, target: VIEW[k].position.clone() }); };
    setView(opt.view || 'all');

    /* ----- 강조 ----- */
    let hiSys = null;
    const setOp = (k, op) => { const m = parts[k].material, b = base[k]; const o = Math.min(b.op !== undefined ? b.op : 1, op); m.transparent = b.tr || o < 1; m.opacity = o; m.depthWrite = o >= 1 ? b.dw !== false : false; m.needsUpdate = true; };
    const highlight = (s) => {
      hiSys = s;
      Object.keys(parts).forEach((k) => { if (k === 'heartG') return; const sys = Object.keys(SYS).find((x) => SYS[x].includes(k)); let op = 1; if (s) { if (!sys) op = /^mus/.test(k) ? .15 : .35; else if (sys !== s) op = .12; } if (off[sys]) op = Math.min(op, .18); setOp(k, op); });
    };
    highlight(null);

    /* ----- 매 장면 ----- */
    let breathT = 0, beatT = 0;
    st.onFrame(() => {
      const dt = clk.dt;
      act += (actTo - act) * Math.min(1, dt * 1.2);
      /* 숨: 들숨에 폐가 커지고 가로막이 내려간다. 운동하면 빨라지고 깊어진다 */
      if (!off.res) breathT += dt * (.25 + (act - 1) * .32);
      const b = (1 - Math.cos(breathT * Math.PI * 2)) / 2, deep = .06 + (act - 1) * .085;
      ['L', 'R'].forEach((s) => { lungG[s].scale.set(1 + b * deep * .6, 1 + b * deep * 1.1, 1 + b * deep * .8); });
      parts.dia.position.y = diaY0 - b * deep * 6;
      /* 심장 박동 */
      if (!off.cir) beatT += dt * (1.1 + (act - 1) * 1.1);
      const ph = beatT % 1, beat = ph < .12 ? Math.sin(ph / .12 * Math.PI) : 0; parts.heartG.scale.setScalar(1 - beat * .05);
      Object.keys(PT).forEach((k) => stepFlow(k, dt));
      /* 따라가기 */
      if (tour) {
        tour.t += dt * (REDUCE ? 3 : 1) * (tour.fast || 1);
        const P = PA[tour.k], u = Math.min(1, tour.t / tour.dur); P.at(u, MKG.position); MKG.visible = true; ring.lookAt(st.camera.position);
        Object.entries(markIn).forEach(([k, m]) => { m.visible = k === tour.k; m.rotation.x += dt * 1.5; });
        const si = segAt(tour.k, u), name = SEG[tour.k][si][2];
        if (si !== tour.si) { tour.si = si; lab.L.tour.e.textContent = name; onTour && onTour(tour.k, si, name, SEG[tour.k][si][3]); }
        if (u >= 1) { const k = tour.k; tour = null; MKG.visible = false; lab.L.tour.show = false; onTour && onTour(k, -1, '', ''); }
      }
    });

    const api = {};
    Object.defineProperties(api, Object.getOwnPropertyDescriptors({
      st, parts, lab, VIEW, COL, PA, SEG, SYS, SYSN, LABS, PTS,
      get view() { return curView; }, get touring() { return !!tour; }, get act() { return act; }, get breath() { return (1 - Math.cos(breathT * Math.PI * 2)) / 2; }, get beat() { return beatT; },
      get arrive() { return arrive; },
      setView, spin, highlight,
      /* 이름표 아래 작은 설명 감추기 (전체 보기에서 겹치지 않게) */
      short(v) { Object.values(lab.L).forEach((a) => { const sm = a.e.querySelector('small'); if (sm) sm.style.display = v ? 'none' : ''; }); },
      showLabs: (k) => lab.only(k.concat(tour ? ['tour'] : [])), place: (P) => lab.place(P),
      flow(o) { Object.assign(flow, o); },
      activity(v) { actTo = v; },
      set speed(v) { speedMul = v; },
      stop(o) { Object.assign(off, o); highlight(hiSys); },
      get off() { return Object.assign({}, off); },
      tour(k, cb, fast) { const P = PA[k]; tour = { k, t: 0, dur: P.len / (k === 'nut' ? 4.2 : 3.4), si: -1, fast }; onTour = cb || onTour; lab.L.tour.show = true; },
      stopTour() { tour = null; MKG.visible = false; lab.L.tour.show = false; },
      /* 조직세포 자리를 화면 좌표로 (2D 확대 그림의 선을 잇는 데 쓴다) */
      screenOf(v) { const p = v.clone().project(st.camera), { W, H } = st.size(); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; },
    }));
    return api;
  }
  return { body, data, labels, Path, COL, SYSN };
})();
window.BS3 = BS3;
