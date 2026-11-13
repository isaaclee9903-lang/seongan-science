/* ===== 식물의 호흡 3D (RS3) =====
   토마토: 실제 토마토의 생김새(겹잎 — 큰 작은잎 3~4쌍 사이에 작은 작은잎, 톱니가 있는 잎 가장자리, 줄기 마디 사이의 꽃송이·열매송이,
   곧은뿌리와 곁뿌리)를 따라 이 수업을 위해 새로 만든 모형이다. 흙은 줄기를 지나는 면으로 잘라 뿌리를 보여 준다.
   실험대: 교과서 172·184쪽 탐구 장치(투명 밀폐 장치·상추·산소 센서·이산화 탄소 센서·LED등·스마트 기기)를 따라 새로 만든 모형.
   기체 알갱이의 수와 빠르기, 에너지 별은 잘 보이게 정한 모형이다. */
const RS3 = (() => {
  'use strict';
  const { V, canvasTex, makeStage, prepare, REDUCE } = C3;
  const R = Math.random;
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const mkR = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  /* ---------- 잎 그림(캔버스) ---------- */
  // 토마토 작은잎: 끝이 뾰족한 달걀꼴, 가장자리에 고르지 않은 톱니와 얕은 갈래
  function leafletTex(seed, pal) {
    const r = mkR(seed);
    return canvasTex(256, 512, (g, w, h) => {
      const cx = w / 2, base = h - 18, top = 14, L = base - top;
      const lobes = 7 + Math.floor(r() * 3), ph = r() * 6;
      const half = (t, sd) => {
        // t: 0(밑) → 1(끝)
        let wd = Math.pow(Math.sin(Math.PI * Math.pow(t, .78)), .95) * (w * .42);
        wd *= 1 + .05 * Math.sin(t * 9 + sd * ph);
        const tooth = Math.pow(Math.abs(Math.sin(t * Math.PI * lobes * 2 + sd * .7)), 3) * 9 * (1 - t * .6);
        const lobe = t < .45 ? Math.max(0, Math.sin(t * Math.PI * 4.4 + sd)) * 10 * (1 - t) : 0;
        return Math.max(0, wd + tooth * .55 - 4 + lobe * .5);
      };
      g.beginPath();
      const N = 120;
      for (let i = 0; i <= N; i++) { const t = i / N; g.lineTo(cx - half(t, -1), base - t * L); }
      for (let i = N; i >= 0; i--) { const t = i / N; g.lineTo(cx + half(t, 1), base - t * L); }
      g.closePath();
      const gr = g.createLinearGradient(0, base, w * .2, top);
      gr.addColorStop(0, pal[0]); gr.addColorStop(.55, pal[1]); gr.addColorStop(1, pal[2]);
      g.fillStyle = gr; g.fill();
      g.save(); g.clip();
      // 잎살 무늬(엷은 얼룩)
      for (let i = 0; i < 220; i++) { g.fillStyle = `rgba(${r() < .5 ? '255,255,220' : '10,50,10'},${.025 + r() * .04})`; g.beginPath(); g.arc(r() * w, r() * h, 3 + r() * 10, 0, 6.3); g.fill(); }
      // 가장자리 쪽 조금 진하게
      g.lineWidth = 10; g.strokeStyle = 'rgba(15,60,20,.16)'; g.stroke();
      // 곁맥
      g.lineCap = 'round';
      for (let i = 1; i < 9; i++) {
        const t = i / 9.3, y = base - t * L;
        [-1, 1].forEach((sd) => {
          const wd = half(Math.min(1, t + .1), sd) * .92;
          g.strokeStyle = 'rgba(205,235,165,.55)'; g.lineWidth = 2.2 * (1 - t * .5);
          g.beginPath(); g.moveTo(cx, y); g.quadraticCurveTo(cx + sd * wd * .55, y - 10, cx + sd * wd, y - 34 - t * 10); g.stroke();
        });
      }
      // 잔맥
      g.strokeStyle = 'rgba(205,235,165,.18)'; g.lineWidth = 1;
      for (let i = 0; i < 60; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 26, y + (r() - .5) * 26); g.stroke(); }
      g.restore();
      // 가운데 잎맥
      g.strokeStyle = 'rgba(214,240,175,.9)'; g.lineWidth = 5; g.beginPath(); g.moveTo(cx, base + 10); g.quadraticCurveTo(cx + 3, base - L * .5, cx, top + 20); g.stroke();
      g.strokeStyle = 'rgba(120,170,80,.5)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx + 2, base + 10); g.quadraticCurveTo(cx + 5, base - L * .5, cx + 1, top + 20); g.stroke();
    });
  }
  // 상추 잎: 넓고 가장자리가 물결치며 가운데 잎맥이 하얗고 굵다
  function lettuceTex(seed) {
    const r = mkR(seed);
    return canvasTex(512, 512, (g, w, h) => {
      const cx = w / 2, base = h - 8;
      g.beginPath();
      const N = 160;
      const rad = (a) => { const t = a / Math.PI; return (w * .47) * (0.62 + .38 * Math.sin(Math.PI * t)) * (1 + .045 * Math.sin(a * 23 + seed) + .03 * Math.sin(a * 41)); };
      for (let i = 0; i <= N; i++) { const a = Math.PI * i / N; const rr = rad(a); g.lineTo(cx - Math.cos(a) * rr * .98, base - 60 - Math.sin(a) * rr * 1.02); }
      g.lineTo(cx + 22, base); g.lineTo(cx - 22, base); g.closePath();
      const gr = g.createRadialGradient(cx, base - 40, 20, cx, base - 220, 330);
      gr.addColorStop(0, '#d6eda6'); gr.addColorStop(.3, '#8cc952'); gr.addColorStop(.75, '#58a032'); gr.addColorStop(1, '#3d8424');
      g.fillStyle = gr; g.fill(); g.save(); g.clip();
      for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${r() < .5 ? '255,255,230' : '30,80,20'},${.03 + r() * .05})`; g.beginPath(); g.arc(r() * w, r() * h, 4 + r() * 14, 0, 6.3); g.fill(); }
      g.lineCap = 'round';
      for (let i = 0; i < 9; i++) { const t = (i + .5) / 9; [-1, 1].forEach((sd) => { g.strokeStyle = 'rgba(240,250,215,.6)'; g.lineWidth = 4 * (1 - t * .6); g.beginPath(); g.moveTo(cx, base - 30 - t * 300); g.quadraticCurveTo(cx + sd * 90, base - 60 - t * 300, cx + sd * (150 + 60 * Math.sin(t * 3)), base - 120 - t * 310); g.stroke(); }); }
      g.lineWidth = 8; g.strokeStyle = 'rgba(40,100,25,.18)'; g.stroke();
      g.restore();
      g.strokeStyle = '#f4fbe6'; g.lineWidth = 18; g.beginPath(); g.moveTo(cx, base); g.lineTo(cx, base - 330); g.stroke();
    });
  }
  // 잎 하나: 평면을 오목하게 휘고 끝을 늘어뜨린다. 밑이 원점, +y가 잎끝 방향
  function bentPlane(len, wid, cup, droop, twist = 0, nx = 6, ny = 12) {
    const geo = new THREE.PlaneGeometry(wid, len, nx, ny); geo.translate(0, len / 2, 0);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), u = y / len, v = x / (wid / 2);
      let z = cup * v * v * wid * .5 - droop * u * u * len + twist * v * u * wid * .3;
      z += Math.sin(u * 9 + v * 3) * .006 * len;
      p.setZ(i, z);
    }
    geo.computeVertexNormals(); return geo;
  }
  // 굵기가 줄어드는 관
  function taperTube(pts, r0, r1, mat, seg = 40, rad = 10) {
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const geo = new THREE.TubeGeometry(curve, seg, 1, rad, false), p = geo.attributes.position, n = geo.attributes.normal;
    const ctr = V();
    for (let i = 0; i <= seg; i++) {
      const t = i / seg, r = lerp(r0, r1, Math.pow(t, .8)); curve.getPointAt(t, ctr);
      for (let j = 0; j <= rad; j++) { const k = i * (rad + 1) + j; p.setXYZ(k, ctr.x + n.getX(k) * r, ctr.y + n.getY(k) * r, ctr.z + n.getZ(k) * r); }
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; m.curve = curve; return m;
  }
  const basisMesh = (geo, mat, pos, fwd, up) => {
    const f = fwd.clone().normalize(), s = V().crossVectors(f, up).normalize(), n = V().crossVectors(s, f).normalize();
    const m = new THREE.Mesh(geo, mat); m.matrixAutoUpdate = false;
    m.matrix.makeBasis(s, f, n); m.matrix.setPosition(pos); m.castShadow = true; m.receiveShadow = true; return m;
  };

  /* ---------- 기체 알갱이 ---------- */
  function molKit(scale = .042) {
    const sph = new THREE.SphereGeometry(1, 18, 12);
    const MO = new THREE.MeshStandardMaterial({ color: 0xd9472f, roughness: .55 }), MC = new THREE.MeshStandardMaterial({ color: 0x3b4048, roughness: .5 });
    const make = (k) => {
      const g = new THREE.Group();
      const add = (mat, x, s) => { const m = new THREE.Mesh(sph, mat); m.position.x = x; m.scale.setScalar(s); g.add(m); };
      if (k === 'c') { add(MC, 0, 1.05); add(MO, -1.55, .95); add(MO, 1.55, .95); }
      else { add(MO, -.72, .95); add(MO, .72, .95); }
      g.scale.setScalar(scale); g.userData.s = scale; return g;
    };
    return { make };
  }
  // 에너지 별(노란 빛 조각)
  function starTex() {
    return canvasTex(128, 128, (g, w, h) => {
      g.translate(w / 2, h / 2);
      const rg = g.createRadialGradient(0, 0, 0, 0, 0, 60); rg.addColorStop(0, 'rgba(255,240,150,.9)'); rg.addColorStop(.4, 'rgba(255,205,60,.35)'); rg.addColorStop(1, 'rgba(255,190,40,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(0, 0, 60, 0, 6.3); g.fill();
      g.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, r = i % 2 ? 11 : 30; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath();
      const sg = g.createRadialGradient(0, 0, 0, 0, 0, 30); sg.addColorStop(0, '#fff7c4'); sg.addColorStop(.6, '#ffc62e'); sg.addColorStop(1, '#f29312');
      g.fillStyle = sg; g.fill(); g.strokeStyle = '#c8700a'; g.lineWidth = 1.4; g.stroke();
    });
  }
  // 알갱이 무리: 길을 따라 움직이고 끝나면 사라짐
  function swarm(parent, kit) {
    const live = [], pool = { c: [], o: [] };
    const take = (k) => { const m = pool[k].pop() || kit.make(k); parent.add(m); m.visible = true; return m; };
    return {
      get n() { return live.length; },
      add(k, pts, o = {}) {
        const m = take(k); const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
        const it = { m, k, curve, t: 0, dur: o.dur || 2, cb: o.cb, fi: o.fi ?? .15, fo: o.fo ?? .12, spin: V(R() - .5, R() - .5, R() - .5).multiplyScalar(3), s: o.s || 1 };
        m.rotation.set(R() * 6, R() * 6, R() * 6); live.push(it); return it;
      },
      step(dt) {
        for (let i = live.length - 1; i >= 0; i--) {
          const it = live[i]; it.t += dt / it.dur;
          if (it.t >= 1) { live.splice(i, 1); parent.remove(it.m); pool[it.k].push(it.m); const cb = it.cb; cb && cb(); continue; }
          it.curve.getPointAt(ease(it.t) * .25 + it.t * .75, it.m.position);
          it.m.rotation.x += it.spin.x * dt; it.m.rotation.y += it.spin.y * dt;
          const a = Math.min(1, it.t / it.fi, (1 - it.t) / it.fo);
          it.m.scale.setScalar(it.m.userData.s * it.s * Math.max(.001, a));
        }
      },
      clear() { live.splice(0).forEach((it) => { parent.remove(it.m); pool[it.k].push(it.m); }); },
    };
  }

  /* ---------- 하늘 ---------- */
  function skyTex() {
    const c = document.createElement('canvas'); c.width = 4; c.height = 256;
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const D = [[0, '#8cc8ef'], [.6, '#cfe9f8'], [1, '#eef7f4']], N = [[0, '#0b1636'], [.6, '#1b2b5c'], [1, '#33447a']];
    const mix = (a, b, k) => { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const ch = (s) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, k)); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; };
    t.set = (day) => { const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); D.forEach((s, i) => gr.addColorStop(s[0], mix(N[i][1], s[1], day))); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); t.needsUpdate = true; };
    t.set(1); return t;
  }
  function discTex(kind) {
    return canvasTex(256, 256, (g, w, h) => {
      g.translate(w / 2, h / 2);
      if (kind === 'sun') {
        const rg = g.createRadialGradient(0, 0, 20, 0, 0, 128); rg.addColorStop(0, 'rgba(255,244,190,.95)'); rg.addColorStop(.35, 'rgba(255,236,160,.35)'); rg.addColorStop(1, 'rgba(255,236,160,0)');
        g.fillStyle = rg; g.fillRect(-128, -128, 256, 256);
        const sg = g.createRadialGradient(-12, -14, 4, 0, 0, 46); sg.addColorStop(0, '#fff3b5'); sg.addColorStop(.7, '#fbbd34'); sg.addColorStop(1, '#ef9118');
        g.fillStyle = sg; g.beginPath(); g.arc(0, 0, 46, 0, 6.3); g.fill();
      } else {
        const rg = g.createRadialGradient(0, 0, 20, 0, 0, 128); rg.addColorStop(0, 'rgba(255,250,220,.4)'); rg.addColorStop(1, 'rgba(255,250,220,0)');
        g.fillStyle = rg; g.fillRect(-128, -128, 256, 256);
        g.fillStyle = '#f6e7a8'; g.beginPath(); g.arc(0, 0, 44, 0, 6.3); g.fill();
        g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(20, -12, 40, 0, 6.3); g.fill();
      }
    });
  }

  /* ---------- 흙 ---------- */
  function soilTex(face) {
    const r = mkR(face === 'top' ? 3 : 7);
    return canvasTex(1024, 512, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      if (face === 'top') { gr.addColorStop(0, '#8a5b34'); gr.addColorStop(1, '#7a4e2b'); }
      else { gr.addColorStop(0, '#4b2e18'); gr.addColorStop(.12, '#6a4126'); gr.addColorStop(.5, '#7d5130'); gr.addColorStop(1, '#8e6640'); }
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { const x = r() * w, y = r() * h, s = .6 + r() * 2.6; g.fillStyle = r() < .5 ? `rgba(40,22,10,${.15 + r() * .3})` : `rgba(210,170,120,${.1 + r() * .25})`; g.beginPath(); g.ellipse(x, y, s, s * (.6 + r() * .5), r() * 3, 0, 6.3); g.fill(); }
      for (let i = 0; i < 18; i++) { const x = r() * w, y = (face === 'top' ? r() : .2 + r() * .8) * h, s = 3 + r() * 6; const pg = g.createRadialGradient(x - s * .3, y - s * .3, 1, x, y, s); pg.addColorStop(0, '#a89880'); pg.addColorStop(1, '#6e5f4c'); g.fillStyle = pg; g.beginPath(); g.ellipse(x, y, s, s * .7, r() * 3, 0, 6.3); g.fill(); }
      if (face !== 'top') { g.fillStyle = 'rgba(30,18,8,.25)'; for (let i = 0; i < 90; i++) { g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 5, 1 + r() * 2, 0, 0, 6.3); g.fill(); } }
    });
  }

  /* ========== 낮과 밤의 토마토 ========== */
  function tomato(host, o = {}) {
    const st = makeStage(host, { hold: true, fov: 30, top: '#8cc8ef', bottom: '#eef7f4', minD: 4.5, maxD: 13, fitWidth: true, scroll: o.scroll, exposure: 1.0 });
    const { scene, camera, controls, renderer } = st;
    controls.target.set(0, .75, 0); camera.position.set(1.6, 1.9, 8.2); controls.maxPolarAngle = Math.PI * .62; controls.minPolarAngle = Math.PI * .22;
    const sky = skyTex(); scene.background = sky;
    // 조명: 해 또는 달
    st.sun.position.set(-5, 9, 6); st.sun.intensity = 2.2; st.sun.color.set(0xfff4e0);
    const sc = st.sun.shadow.camera; sc.left = -3; sc.right = 3; sc.top = 4; sc.bottom = -2; sc.updateProjectionMatrix(); st.sun.shadow.mapSize.set(2048, 2048);
    const hemi = scene.children.find((c) => c.isHemisphereLight); hemi.intensity = .75; hemi.color.set(0xdff0ff); hemi.groundColor.set(0x6b5a40);
    const W = new THREE.Group(); scene.add(W);

    /* 하늘의 해·달·별 */
    const sunS = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex('sun'), depthWrite: false, fog: false })); sunS.scale.set(1.9, 1.9, 1); sunS.position.set(-2.6, 3.2, -4); scene.add(sunS);
    const moonS = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex('moon'), depthWrite: false, transparent: true })); moonS.scale.set(1.5, 1.5, 1); moonS.position.set(2.4, 3.1, -4); scene.add(moonS);
    const sg = new THREE.BufferGeometry(), sp = []; const rs = mkR(4);
    for (let i = 0; i < 260; i++) { const a = (rs() - .5) * 2.6, e = .12 + rs() * .9; sp.push(Math.sin(a) * 14 * Math.cos(e), Math.sin(e) * 12 - 1, -Math.cos(a) * 14 * Math.cos(e)); }
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false })); scene.add(stars);

    /* 흙: 줄기를 지나는 면으로 자른 모습 */
    const SW = 2.9, SD = 1.3, SH = 1.0, FZ = .03;
    const topM = new THREE.MeshStandardMaterial({ map: soilTex('top'), roughness: .95 }), cutM = new THREE.MeshStandardMaterial({ map: soilTex('cut'), roughness: .95 });
    const soil = new THREE.Mesh(new THREE.BoxGeometry(SW, SH, SD), [cutM, cutM, topM, cutM, cutM, cutM]); soil.position.set(0, -SH / 2, FZ - SD / 2); soil.receiveShadow = true; W.add(soil);
    // 자른 면 위쪽 흙 가장자리(살짝 부서진 덩이)
    const crumbM = new THREE.MeshStandardMaterial({ color: 0x6e4527, roughness: 1 }), rc = mkR(11);
    for (let i = 0; i < 0; i++) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(.03 + rc() * .05, 0), crumbM); m.position.set((rc() - .5) * SW * .96, -.01 + rc() * .02, FZ - rc() * .06); m.rotation.set(rc() * 3, rc() * 3, 0); m.castShadow = true; W.add(m); }
    // 흙 위 그림자 받이
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(SW, SD), new THREE.ShadowMaterial({ opacity: .22 })); shadowPlane.rotation.x = -Math.PI / 2; shadowPlane.position.set(0, .002, FZ - SD / 2); shadowPlane.receiveShadow = true; W.add(shadowPlane);

    /* 뿌리: 자른 면 위에 반쯤 드러남 */
    const rootM = new THREE.MeshStandardMaterial({ color: 0xdcc596, roughness: .85 });
    const roots = new THREE.Group(); W.add(roots); const rootPts = [];
    const rr = mkR(5);
    const rootLine = (p0, dir, len, r0, depth) => {
      const pts = [p0.clone()]; let p = p0.clone(), d = dir.clone();
      const n = 6; for (let i = 1; i <= n; i++) { d.x += (rr() - .5) * .5; d.y += (rr() - .5) * .25 - .05; d.normalize(); p = p.clone().addScaledVector(d, len / n); p.y = Math.max(-SH + .06, p.y); p.x = clamp(p.x, -SW / 2 + .06, SW / 2 - .06); p.z = FZ + .002; pts.push(p); }
      roots.add(taperTube(pts, r0, r0 * .25, rootM, 24, 8));
      pts.forEach((q, i) => { if (i > 1) rootPts.push(q); });
      if (depth > 0) for (let i = 2; i < n; i += 1 + Math.floor(rr() * 2)) { const sd = rr() < .5 ? -1 : 1; rootLine(pts[i], V(d.x + sd * .9, d.y * .4 - .2, 0).normalize(), len * (.35 + rr() * .2), r0 * .45, depth - 1); }
    };
    rootLine(V(0, .01, FZ), V(0, -1, 0), .85, .05, 2);
    [[-.95, -.45], [.95, -.4], [-.8, -.75], [.8, -.8]].forEach(([x, y]) => rootLine(V(0, -.05, FZ), V(x, y, 0).normalize(), .75 + rr() * .2, .03, 1));

    /* 줄기 */
    const stemM = new THREE.MeshStandardMaterial({ color: 0x4f8f36, roughness: .7 });
    const rachM = new THREE.MeshStandardMaterial({ color: 0x5a9a3e, roughness: .7 });
    const HT = 2.55, stemP = []; const rsm = mkR(2);
    for (let i = 0; i <= 8; i++) { const t = i / 8; stemP.push(V(Math.sin(t * 5) * .05 + (rsm() - .5) * .03, t * HT, Math.cos(t * 4) * .04)); }
    const stem = taperTube(stemP, .055, .016, stemM, 60, 12); W.add(stem);
    const stemCurve = stem.curve;
    const stemAt = (y) => stemCurve.getPointAt(clamp(y / HT, 0, 1));
    // 줄기 털(가는 점)
    const hairG = new THREE.BufferGeometry(), hp = []; for (let i = 0; i < 500; i++) { const t = R(), c = stemCurve.getPointAt(t), a = R() * 6.283, r = lerp(.06, .02, t); hp.push(c.x + Math.cos(a) * r, c.y, c.z + Math.sin(a) * r); }
    hairG.setAttribute('position', new THREE.Float32BufferAttribute(hp, 3));
    W.add(new THREE.Points(hairG, new THREE.PointsMaterial({ color: 0xcfe8b8, size: 1.3, sizeAttenuation: false, transparent: true, opacity: .55 })));

    /* 겹잎 */
    const PAL = [['#164d1c', '#22682a', '#3c8a34'], ['#1a5520', '#2b742d', '#47933a'], ['#134518', '#1f6026', '#357f30']];
    const leafMats = PAL.map((p, i) => new THREE.MeshStandardMaterial({ map: leafletTex(10 + i * 7, p), alphaTest: .5, side: THREE.DoubleSide, roughness: .72 }));
    const leafPts = []; const leafMeshes = [];
    const rl = mkR(8);
    const UP = V(0, 1, 0);
    function compound(node, az, L, lift = .55) {
      const out = V(Math.cos(az), 0, Math.sin(az));
      const p0 = node.clone();
      const pts = [p0, p0.clone().addScaledVector(out, L * .3).add(V(0, L * lift * .45, 0)), p0.clone().addScaledVector(out, L * .68).add(V(0, L * lift * .4, 0)), p0.clone().addScaledVector(out, L).add(V(0, L * (lift * .1 - .1), 0))];
      const rach = taperTube(pts, .014, .006, rachM, 20, 6); W.add(rach);
      const c = rach.curve, tan = V(), pos = V();
      const leaflet = (t, side, size) => {
        c.getPointAt(t, pos); c.getTangentAt(t, tan);
        const sideV = V().crossVectors(tan, UP).normalize().multiplyScalar(side);
        const dir = tan.clone().multiplyScalar(.55).add(sideV).normalize();
        dir.y += .12 + (rl() - .5) * .2;
        const ll = L * size * 1.3, ww = ll * .7;
        const geo = bentPlane(ll, ww, .16 + rl() * .12, .08 + rl() * .14, (rl() - .5) * .5);
        const up = V(0, 1, 0).addScaledVector(sideV, -.25 * side * 0).add(V((rl() - .5) * .4, 0, (rl() - .5) * .4)).normalize();
        const m = basisMesh(geo, leafMats[Math.floor(rl() * 3)], pos.clone().addScaledVector(dir, .012), dir, up);
        W.add(m); leafMeshes.push(m);
        leafPts.push(pos.clone().addScaledVector(dir, ll * .5).add(V(0, .02, 0)));
      };
      [[.22, .2], [.42, .3], [.62, .32], [.8, .28]].forEach(([t, s], i) => { leaflet(t, 1, s); leaflet(t + .02, -1, s * (.92 + rl() * .1)); if (i < 3) { leaflet(t + .1, 1, .09); leaflet(t + .11, -1, .08); } });
      // 끝 작은잎
      c.getPointAt(1, pos); c.getTangentAt(1, tan);
      const geo = bentPlane(L * .42, L * .26, .18, .12, 0);
      const m = basisMesh(geo, leafMats[1], pos, tan.clone().add(V(0, .05, 0)), UP); W.add(m); leafMeshes.push(m);
      leafPts.push(pos.clone().addScaledVector(tan, L * .15));
    }
    const NODES = [[.28, 1.0], [.5, 1.08], [.74, 1.1], [.98, 1.05], [1.22, 1.0], [1.46, .92], [1.68, .84], [1.88, .74], [2.06, .62], [2.24, .5], [2.4, .36]];
    NODES.forEach(([y, L], i) => compound(stemAt(y), i * 2.4 + .3, L, i > 7 ? .9 : .5));
    /* 곁가지 두 개: 아래 마디에서 비스듬히 자라 잎을 단다 */
    [[.62, -1.0, 1], [.86, 2.3, .85]].forEach(([y, az, k]) => {
      const n0 = stemAt(y), out = V(Math.cos(az), 0, Math.sin(az));
      const pts = [n0, n0.clone().addScaledVector(out, .22 * k).add(V(0, .3 * k, 0)), n0.clone().addScaledVector(out, .4 * k).add(V(0, .78 * k, 0)), n0.clone().addScaledVector(out, .5 * k).add(V(0, 1.15 * k, 0))];
      const br = taperTube(pts, .03, .012, stemM, 30, 10); W.add(br);
      [[.3, .82], [.55, .72], [.78, .56], [.95, .4]].forEach(([t, L], i) => compound(br.curve.getPointAt(t), az + (i % 2 ? 1.3 : -1.3) + i * .4, L * k, .55));
    });
    // 꼭대기 어린잎
    for (let i = 0; i < 4; i++) { const a = i * 1.7; const geo = bentPlane(.16, .1, .5, .1, 0); const m = basisMesh(geo, leafMats[2], stemAt(HT), V(Math.cos(a), 1.6, Math.sin(a)), V(Math.cos(a + 1.6), 0, Math.sin(a + 1.6))); W.add(m); }

    /* 꽃송이·열매송이 */
    const fruits = [];
    const fruitGeo = (() => { const g = new THREE.SphereGeometry(1, 40, 28), p = g.attributes.position, v = V(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const a = Math.atan2(v.z, v.x), lob = 1 + .045 * Math.cos(a * 5) * (1 - Math.abs(v.y)); v.x *= lob; v.z *= lob; v.y *= .84; if (v.y > .7) v.y -= (v.y - .7) * .5; p.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); return g; })();
    const FM = { r: new THREE.MeshStandardMaterial({ color: 0xd8321f, roughness: .42 }), o: new THREE.MeshStandardMaterial({ color: 0xec7a2a, roughness: .45 }), g: new THREE.MeshStandardMaterial({ color: 0x86b648, roughness: .5 }) };
    const sepM = new THREE.MeshStandardMaterial({ color: 0x3f8a33, roughness: .7, side: THREE.DoubleSide });
    const sepGeo = bentPlane(.07, .018, .3, -.6, 0, 2, 4);
    function truss(y, az, kinds) {
      const n0 = stemAt(y), out = V(Math.cos(az), 0, Math.sin(az));
      const pts = [n0, n0.clone().addScaledVector(out, .14).add(V(0, .03, 0)), n0.clone().addScaledVector(out, .28).add(V(0, -.04, 0)), n0.clone().addScaledVector(out, .4).add(V(0, -.14, 0))];
      const ped = taperTube(pts, .012, .008, rachM, 16, 6); W.add(ped);
      kinds.forEach((k, i) => {
        const t = .35 + i / kinds.length * .62, a = ped.curve.getPointAt(t), side = V(-out.z, 0, out.x).multiplyScalar(i % 2 ? .07 : -.07);
        const r = k === 'g' ? .1 : .13 + (i === 0 ? .02 : 0);
        const c = a.clone().add(side).add(V(0, -.07 - r, 0));
        W.add(taperTube([a, a.clone().add(side.clone().multiplyScalar(.6)).add(V(0, -.04, 0)), c.clone().add(V(0, r * .8, 0))], .006, .005, rachM, 8, 5));
        const f = new THREE.Mesh(fruitGeo, FM[k]); f.scale.setScalar(r); f.position.copy(c); f.rotation.y = R() * 6; f.castShadow = true; W.add(f); fruits.push(c.clone());
        for (let s = 0; s < 5; s++) { const sa = s / 5 * 6.283 + R(); const d = V(Math.cos(sa), .25, Math.sin(sa)); const m = basisMesh(sepGeo, sepM, c.clone().add(V(0, r * .78, 0)), d, UP); W.add(m); }
      });
    }
    truss(.98, 1.1, ['r', 'r', 'o', 'g']);
    truss(1.5, .4, ['o', 'g', 'g']);
    // 노란 꽃
    const petM = new THREE.MeshStandardMaterial({ color: 0xf5cf2a, roughness: .6, side: THREE.DoubleSide }), petGeo = bentPlane(.06, .022, .1, .5, 0, 2, 4);
    (() => {
      const n0 = stemAt(2.02), az = 2.3, out = V(Math.cos(az), 0, Math.sin(az));
      const ped = taperTube([n0, n0.clone().addScaledVector(out, .14).add(V(0, .05, 0)), n0.clone().addScaledVector(out, .26).add(V(0, .0, 0))], .009, .006, rachM, 10, 5); W.add(ped);
      [.5, .8, 1].forEach((t, i) => { const c = ped.curve.getPointAt(t).add(V(0, -.05 - i * .01, (i - 1) * .05)); for (let s = 0; s < 5; s++) { const sa = s / 5 * 6.283; const m = basisMesh(petGeo, petM, c, V(Math.cos(sa), -.6, Math.sin(sa)), UP); W.add(m); } });
    })();

    /* 기체·에너지 */
    const kit = molKit(.04), sw = swarm(W, kit);
    const sTex = starTex(), sparks = [];
    const spark = (p, s = .22) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: sTex, transparent: true, depthWrite: false, depthTest: false })); sp.position.copy(p); sp.renderOrder = 5; W.add(sp); sparks.push({ sp, t: 0, s }); };
    // 세포 자리: 잎·줄기·열매·뿌리
    const stemPts = []; for (let i = 1; i < 12; i++) stemPts.push(stemAt(i / 12 * HT * .95).add(V(0, 0, .05)));
    const CELLS = { leaf: leafPts, stem: stemPts, fruit: fruits.map((f) => f.clone().add(V(0, 0, .1))), root: rootPts.map((p) => p.clone().add(V(0, 0, .04))) };
    const allCells = () => { const r = R(); return r < .6 ? CELLS.leaf : r < .74 ? CELLS.stem : r < .84 ? CELLS.fruit : CELLS.root; };
    const pick = (a) => a[Math.floor(R() * a.length)];
    const airL = () => V(-2.5 + R() * .5, .6 + R() * 1.7, -.2 + R() * .8), airR = () => V(2.1 + R() * .5, .6 + R() * 1.7, -.2 + R() * .8);
    const via = (a, b) => a.clone().lerp(b, .5).add(V((R() - .5) * .3, (R() - .5) * .4, (R() - .5) * .3));

    /* 이름표 */
    const gtag = (c) => { const e = document.createElement('div'); e.className = 'gtag ' + c; host.appendChild(e); return { set(h) { if (e.innerHTML !== h) e.innerHTML = h; } }; };
    const lIn = gtag('l'), lOut = gtag('r');
    let day = o.day !== false, tt = day ? 1 : 0, showP = true, showR = true, part = null;
    const acc = [0, 0, 0, 0];
    const words = () => {
      const pOn = day && showP;
      const w = (k, c) => `<b>${k}</b><small>${c}</small>`;
      if (pOn) { lIn.set(w('이산화 탄소', '흡수')); lOut.set(w('산소', '방출')); }
      else if (showR) { lIn.set(w('이산화 탄소', '방출')); lOut.set(w('산소', '흡수')); }
      else { lIn.set(''); lOut.set(''); }
      host.classList.toggle('night', tt < .5);
    };
    const place = () => {
      sky.set(tt);
      sunS.position.set(lerp(-3.4, -2.3, tt), lerp(-.4, 2.75, Math.sqrt(tt)), -4); sunS.material.opacity = tt; sunS.visible = tt > .02;
      moonS.position.set(lerp(2.2, 3.2, tt), lerp(2.7, -.2, tt), -4); moonS.material.opacity = 1 - tt; moonS.visible = tt < .98;
      stars.material.opacity = (1 - tt) * .85;
      st.sun.position.set(lerp(6, -5, tt), lerp(7, 9, tt), 6);
      st.sun.intensity = lerp(.55, 2.2, tt); st.sun.color.set(tt > .5 ? 0xfff4e0 : 0xb9c8ff);
      hemi.intensity = lerp(.32, .75, tt); hemi.color.set(tt > .5 ? 0xdff0ff : 0x7d8fc8);
      renderer.toneMappingExposure = lerp(.82, 1.0, tt);
    };
    place(); words();

    let tw = null;
    const api = {
      st,
      setDay(v, cb) { day = v; words(); const a = tt, b = v ? 1 : 0; if (REDUCE) { tt = b; place(); words(); cb && cb(); return; } tw = { a, b, k: 0, cb }; },
      jump(v) { day = v; tt = v ? 1 : 0; place(); words(); },
      show(p, r) { showP = p; showR = r; words(); },
      focus(k) {
        part = k;
        const T = { leaf: [V(-.55, 1.45, 0), V(-1.4, 2.0, 4.6)], stem: [V(0, 1.0, 0), V(.6, 1.4, 4.4)], fruit: [V(.6, .82, .2), V(1.8, 1.2, 4.3)], root: [V(0, -.45, 0), V(.4, -.1, 4.4)] };
        if (!k) { st.fit(frame, { dir: V(.2, .2, 1), margin: 1.0, dur: .9 }); return; }
        const [t, p] = T[k]; st.flyTo(p, t, 1);
      },
      screenOf(k) { const a = CELLS[k]; if (!a || !a.length) return null; const p = a[Math.floor(a.length / 2)].clone(); p.project(camera); const s = st.size(); return [(p.x + 1) / 2 * s.W, (1 - p.y) / 2 * s.H]; },
      get day() { return day; },
      cells: CELLS,
    };
    // 처음 구도: 식물 전체가 꼭 들어오게
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.7, 3.95, .6)); frame.position.set(0, .9, 0); frame.visible = false; W.add(frame);
    st.fit(frame, { dir: V(.2, .2, 1), margin: 1.0, dur: 0 });
    st.onFrame((dt) => {
      if (tw) { tw.k = Math.min(1, tw.k + dt / 1.8); tt = lerp(tw.a, tw.b, ease(tw.k)); place(); if (tw.k >= 1) { const cb = tw.cb; tw = null; words(); cb && cb(); } }
      sw.step(dt);
      for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.t += dt / 1.1; if (s.t >= 1) { W.remove(s.sp); s.sp.material.dispose(); sparks.splice(i, 1); continue; } const k = Math.sin(s.t * Math.PI); s.sp.scale.setScalar(s.s * (.5 + k * .7)); s.sp.material.opacity = k; s.sp.material.rotation = s.t * 1.2; }
      if (REDUCE) return;
      const pOn = day && showP && tt > .6, rOn = showR;
      const lim = 46;
      // 광합성: 들어오는 이산화 탄소가 잎으로, 잎에서 산소가 나감 (호흡과 함께면 바깥과 주고받는 양이 조금 줄어듦)
      acc[0] += dt * (pOn ? (rOn ? 3.6 : 4.4) : 0);
      // 밤(또는 호흡만): 산소가 들어오고 이산화 탄소가 나감
      acc[1] += dt * (rOn && !pOn ? 2.4 : 0);
      // 에너지 별: 호흡이 일어나는 모든 세포
      acc[2] += dt * (rOn ? 3.2 : 0);
      // 낮에 함께 일어날 때: 잎 안에서 산소는 호흡으로, 이산화 탄소는 광합성으로 (짧게 오감)
      acc[3] += dt * (pOn && rOn ? 1.4 : 0);
      while (acc[0] > 1) { acc[0] -= 1; if (sw.n > lim) continue; const t = pick(CELLS.leaf), a = airL(); sw.add('c', [a, via(a, t), t], { dur: 2.3, cb: () => { if (sw.n > lim) return; const b = airR(); sw.add('o', [t, via(t, b), b], { dur: 2.6, fi: .08 }); } }); }
      while (acc[1] > 1) { acc[1] -= 1; if (sw.n > lim) continue; const t = pick(R() < .8 ? CELLS.leaf : CELLS.fruit), a = airR(); sw.add('o', [a, via(a, t), t], { dur: 2.5, cb: () => { spark(t, .2); if (sw.n > lim) return; const b = airL(); sw.add('c', [t, via(t, b), b], { dur: 2.6, fi: .08 }); } }); }
      while (acc[2] > 1) { acc[2] -= 1; const arr = part ? CELLS[part] : allCells(); if (arr.length) spark(pick(arr).clone().add(V((R() - .5) * .06, (R() - .5) * .06, .03)), part ? .26 : .2); }
      while (acc[3] > 1) { acc[3] -= 1; if (sw.n > lim) continue; const a = pick(CELLS.leaf), b = pick(CELLS.leaf); if (a.distanceTo(b) > .9) continue; const k = R() < .5 ? 'o' : 'c'; sw.add(k, [a, a.clone().lerp(b, .5).add(V(0, .12, .05)), b], { dur: 1.4, s: .8 }); }
    });
    prepare(st);
    return api;
  }

  /* ========== 세포 돋보기 (2D 캔버스) ==========
     고른 부분의 세포 하나에서 포도당과 산소가 만나 이산화 탄소와 물이 되고 에너지가 나오는 모습. */
  function cellLens(cv) {
    const g = cv.getContext('2d'); let kind = 'leaf', T = 0, raf = 0, on = false;
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const size = () => { const r = cv.getBoundingClientRect(); cv.width = Math.max(10, r.width * DPR); cv.height = Math.max(10, r.height * DPR); };
    const STY = {
      leaf: { bg: '#d9efc2', wall: '#7fb35a', cell: '#e9f7d8', chl: true, shape: 'col' },
      stem: { bg: '#d6ecc9', wall: '#86b26a', cell: '#eef8e6', chl: true, shape: 'long' },
      fruit: { bg: '#f8d2c4', wall: '#d9785c', cell: '#fde7de', chl: false, shape: 'round' },
      root: { bg: '#efe2c6', wall: '#bfa275', cell: '#fbf4e4', chl: false, shape: 'brick' },
    };
    const hex = (x, y, r) => { g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + .52; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); };
    const atom = (x, y, r, c) => { const gr = g.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r); gr.addColorStop(0, c === 'o' ? '#ff8b72' : c === 'c' ? '#6c737c' : '#ffffff'); gr.addColorStop(1, c === 'o' ? '#c2311d' : c === 'c' ? '#262a30' : '#b9c3cc'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); };
    const mol = (k, x, y, s, a = 1) => { g.globalAlpha = a; if (k === 'o2') { atom(x - s * .7, y, s, 'o'); atom(x + s * .7, y, s, 'o'); } else if (k === 'co2') { atom(x - s * 1.5, y, s * .9, 'o'); atom(x + s * 1.5, y, s * .9, 'o'); atom(x, y, s, 'c'); } else if (k === 'h2o') { atom(x - s * .75, y + s * .55, s * .55, 'h'); atom(x + s * .75, y + s * .55, s * .55, 'h'); atom(x, y, s, 'o'); } else if (k === 'glu') { hex(x, y, s * 1.6); const gr = g.createLinearGradient(x, y - s, x, y + s); gr.addColorStop(0, '#b78ad6'); gr.addColorStop(1, '#7a4aa3'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#5c3580'; g.lineWidth = s * .14; g.stroke(); } g.globalAlpha = 1; };
    const star = (x, y, r, a) => { g.globalAlpha = a; g.beginPath(); for (let i = 0; i < 16; i++) { const an = i / 16 * 6.283 + T, rr = i % 2 ? r * .4 : r; g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } g.closePath(); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, '#fff6c0'); gr.addColorStop(.6, '#ffc62e'); gr.addColorStop(1, '#f08a12'); g.fillStyle = gr; g.fill(); g.globalAlpha = 1; };
    function draw() {
      const w = cv.width, h = cv.height, s = STY[kind], cx = w / 2, cy = h / 2, R0 = Math.min(w, h) / 2;
      g.clearRect(0, 0, w, h); g.save(); g.beginPath(); g.arc(cx, cy, R0 - 2, 0, 6.3); g.clip();
      g.fillStyle = s.bg; g.fillRect(0, 0, w, h);
      // 둘레 세포
      const cw = R0 * (s.shape === 'long' ? .5 : s.shape === 'col' ? .34 : .5), ch = R0 * (s.shape === 'long' ? .3 : s.shape === 'col' ? .62 : s.shape === 'brick' ? .34 : .48);
      const rr = mkR(kind.length * 13);
      for (let j = -3; j <= 3; j++) for (let i = -4; i <= 4; i++) {
        const x = cx + i * cw + (j % 2 ? cw / 2 : 0), y = cy + j * ch;
        if (Math.hypot(x - cx, y - cy) < R0 * .42) continue;
        g.fillStyle = s.cell; g.strokeStyle = s.wall; g.lineWidth = R0 * .025;
        g.beginPath(); if (g.roundRect) g.roundRect(x - cw / 2 + 2, y - ch / 2 + 2, cw - 4, ch - 4, Math.min(cw, ch) * .3); else g.rect(x - cw / 2 + 2, y - ch / 2 + 2, cw - 4, ch - 4); g.fill(); g.stroke();
        if (s.chl) for (let k = 0; k < 4; k++) { g.fillStyle = '#4c9a3a'; g.beginPath(); g.ellipse(x + (rr() - .5) * cw * .55, y + (rr() - .5) * ch * .6, cw * .09, cw * .055, rr() * 3, 0, 6.3); g.fill(); }
      }
      // 가운데 세포(크게)
      const bw = R0 * .78, bh = R0 * .62;
      g.fillStyle = s.cell; g.strokeStyle = s.wall; g.lineWidth = R0 * .04;
      g.beginPath(); if (g.roundRect) g.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, R0 * .14); else g.rect(cx - bw / 2, cy - bh / 2, bw, bh); g.fill(); g.stroke();
      if (s.chl) { const r2 = mkR(5); for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283; g.fillStyle = '#58a845'; g.beginPath(); g.ellipse(cx + Math.cos(a) * bw * .38, cy + Math.sin(a) * bh * .36, R0 * .05, R0 * .03, a, 0, 6.3); g.fill(); } }
      // 반응: 3초마다 한 번
      const p = (T % 3.2) / 3.2, m = R0 * .07;
      const inK = clamp(p / .4), outK = clamp((p - .45) / .45);
      if (p < .45) {
        mol('glu', lerp(cx - bw * .3, cx - m * 1.2, ease(inK)), cy - m * .2, m, 1);
        mol('o2', lerp(cx + R0 * .9, cx + m * 1.4, ease(inK)), lerp(cy - R0 * .5, cy, ease(inK)), m * .9, 1);
      } else {
        const e = ease(outK);
        mol('co2', lerp(cx, cx - R0 * .95, e), lerp(cy, cy - R0 * .45, e), m * .9, 1 - clamp((outK - .75) / .25));
        mol('h2o', lerp(cx, cx + bw * .25, e), lerp(cy, cy + bh * .28, e), m, 1 - clamp((outK - .8) / .2));
        star(cx, cy, m * (1.4 + Math.sin(outK * Math.PI) * 1.6), Math.sin(Math.min(1, outK * 1.4) * Math.PI));
      }
      g.restore();
      g.lineWidth = Math.max(3, R0 * .03); g.strokeStyle = '#fff'; g.beginPath(); g.arc(cx, cy, R0 - 2, 0, 6.3); g.stroke();
    }
    let last = 0;
    const tick = (now) => { raf = requestAnimationFrame(tick); const dt = Math.min(.05, (now - last) / 1000 || 0); last = now; if (!on) return; T += REDUCE ? 0 : dt; draw(); };
    size(); try { new ResizeObserver(() => { size(); draw(); }).observe(cv); } catch (e) {}
    raf = requestAnimationFrame(tick);
    return { set(k) { kind = k || 'leaf'; T = REDUCE ? 1.9 : 0; draw(); }, play(v) { on = v; if (v) draw(); }, draw };
  }

  return { tomato, cellLens, molKit, swarm, starTex, leafletTex, lettuceTex, bentPlane, taperTube, basisMesh, skyTex, mkR };
})();
