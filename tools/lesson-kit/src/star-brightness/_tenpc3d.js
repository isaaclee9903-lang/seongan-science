/* ===== 3D: 지구를 가운데 둔 반지름 10 pc의 구 (그림 Ⅷ-5) =====
   시리우스·미르잠·태양·10 pc 거리의 별. 등급 값은 교과서 값만 써요.
   별의 위치(거리 비율)는 실제와 다른 모형이에요. 3D 공간의 별 크기는 '실제 밝기(절대 등급)'의 느낌,
   '지구에서 본 하늘' 그림의 별 크기는 '지구에서 보이는 밝기'의 느낌이에요(별은 모두 흰색). */
const TENPC3D = (() => {
  const { V } = C3;
  const R = 6; // 10 pc
  const STARS = [
    { id: 'sirius', name: '시리우스', app: -1.5, abs: 1.4, pos: [-2.7, 1.5, 1.1], sky: [0.42, 0.56] },
    { id: 'mirzam', name: '미르잠', app: 2.0, abs: -4.1, pos: [7.4, 2.4, -3.6], sky: [0.7, 0.34] },
    { id: 'sun', name: '태양', app: -26.7, abs: 4.8, pos: [-0.95, 0.42, 0.62], sky: [0.5, 0.5] },
    { id: 'ten', name: '10 pc 거리의 별', app: 3.0, abs: 3.0, pos: null, dir: [1, -0.2, 0.42], sky: [0.22, 0.72], same: true },
  ];
  const fmt = (m) => (m < 0 ? '−' : '') + Math.abs(m).toFixed(1);
  function earthTex() {
    return C3.canvasTex(512, 256, (g, w, h) => {
      const o = g.createLinearGradient(0, 0, 0, h); o.addColorStop(0, '#2c5fa8'); o.addColorStop(0.5, '#1f6fc0'); o.addColorStop(1, '#2a5a9e'); g.fillStyle = o; g.fillRect(0, 0, w, h);
      const R2 = GLOWR(7);
      for (let i = 0; i < 26; i++) { const x = R2() * w, y = h * (0.18 + R2() * 0.64), r = 14 + R2() * 46; g.fillStyle = `rgba(${70 + R2() * 40},${120 + R2() * 40},${60 + R2() * 30},.95)`; g.beginPath(); for (let a = 0; a < 6.3; a += 0.4) { const rr = r * (0.6 + R2() * 0.5); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.7); } g.fill(); }
      g.fillStyle = 'rgba(240,246,255,.9)'; g.fillRect(0, 0, w, h * 0.07); g.fillRect(0, h * 0.93, w, h * 0.07);
      for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(R2() * w, R2() * h, 20 + R2() * 40, 4 + R2() * 6, R2(), 0, 6.3); g.fill(); }
    });
  }
  function GLOWR(seed) { let s = seed >>> 0; return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function starTex() {
    return C3.canvasTex(128, 128, (g, w, h) => {
      const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.1, 'rgba(255,255,255,.95)'); r.addColorStop(0.22, 'rgba(220,232,255,.6)'); r.addColorStop(0.5, 'rgba(190,210,255,.14)'); r.addColorStop(1, 'rgba(190,210,255,0)');
      g.fillStyle = r; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(235,242,255,.55)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(64, 6); g.lineTo(64, 122); g.moveTo(6, 64); g.lineTo(122, 64); g.stroke();
    });
  }
  function build(st, opt = {}) {
    const g = new THREE.Group(); st.scene.add(g);
    // 지구
    const earth = new THREE.Mesh(new THREE.SphereGeometry(0.42, 48, 32), new THREE.MeshStandardMaterial({ map: earthTex(), roughness: 0.7, metalness: 0 }));
    earth.rotation.z = 0.41; g.add(earth);
    const atm = LIGHT3D.glowSprite(1.5, 0.5, C3.canvasTex(128, 128, (c, w, h) => { const r = c.createRadialGradient(64, 64, 26, 64, 64, 64); r.addColorStop(0, 'rgba(120,180,255,.5)'); r.addColorStop(1, 'rgba(120,180,255,0)'); c.fillStyle = r; c.fillRect(0, 0, w, h); }));
    g.add(atm);
    const key = new THREE.PointLight(0xfff2d6, 18, 20, 1.5); key.position.set(-0.95, 0.42, 0.62); g.add(key);
    // 10 pc 구
    const shell = new THREE.Mesh(new THREE.SphereGeometry(R, 72, 48), new THREE.MeshPhysicalMaterial({ color: 0xb7a6ff, transparent: true, opacity: 0.1, roughness: 0.15, metalness: 0, side: THREE.DoubleSide, depthWrite: false, emissive: 0x4a3aa0, emissiveIntensity: 0.25 }));
    g.add(shell);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xcfc4ff, transparent: true, opacity: 0.5 });
    const eq = new THREE.Mesh(new THREE.TorusGeometry(R, 0.018, 8, 160), ringMat); eq.rotation.x = Math.PI / 2; g.add(eq);
    [0.5, -0.5].forEach((y) => { const rr = Math.sqrt(R * R - (y * R) ** 2); const t = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.01, 6, 120), new THREE.MeshBasicMaterial({ color: 0xcfc4ff, transparent: true, opacity: 0.22 })); t.rotation.x = Math.PI / 2; t.position.y = y * R; g.add(t); });
    const mer = new THREE.Mesh(new THREE.TorusGeometry(R, 0.01, 6, 160), new THREE.MeshBasicMaterial({ color: 0xcfc4ff, transparent: true, opacity: 0.22 })); g.add(mer);
    // 10 pc 반지름 점선
    const rDir = V(1, -0.2, 0.42).normalize();
    const dash = new THREE.Line(new THREE.BufferGeometry().setFromPoints([rDir.clone().multiplyScalar(0.55), rDir.clone().multiplyScalar(R)]), new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.18, gapSize: 0.12, transparent: true, opacity: 0.8 }));
    dash.computeLineDistances(); g.add(dash);
    // 별
    const tex = starTex();
    const stars = STARS.map((s) => {
      const p1 = (s.pos ? V(...s.pos) : V(...s.dir)).normalize().multiplyScalar(R);
      const p0 = s.pos ? V(...s.pos) : p1.clone();
      const isSun = s.id === 'sun';
      const core = new THREE.Mesh(new THREE.SphereGeometry(isSun ? 0.16 : 0.09, 24, 16), new THREE.MeshBasicMaterial({ color: isSun ? 0xfff3d2 : 0xffffff }));
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      // 3D 공간에서는 실제 밝기(절대 등급)가 클수록 크게
      const size = isSun ? 1.1 : 0.9 + Math.max(0, 5 - s.abs) * 0.32;
      spr.scale.set(size, size, 1);
      const grp = new THREE.Group(); grp.add(core, spr); grp.position.copy(p0); g.add(grp); grp.userData.tap = s.id;
      // 옮기는 길(점선)
      let path = null;
      if (s.pos && !isSun) { path = new THREE.Line(new THREE.BufferGeometry().setFromPoints([p0, p1]), new THREE.LineDashedMaterial({ color: 0xffd56b, dashSize: 0.16, gapSize: 0.12, transparent: true, opacity: 0 })); path.computeLineDistances(); g.add(path); }
      // 지구에서 별까지(보는 방향) 선
      const sight = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(), p0.clone()]), new THREE.LineBasicMaterial({ color: 0x9fb4ff, transparent: true, opacity: 0.25 }));
      g.add(sight);
      return Object.assign({}, s, { p0, p1, grp, spr, core, path, sight, t: 0, goal: 0, sel: false });
    });
    const byId = (id) => stars.find((s) => s.id === id);
    function setGoal(id, v) { const s = byId(id); if (s) s.goal = v; }
    function select(id) { stars.forEach((s) => (s.sel = s.id === id)); }
    const tmp = V();
    st.onFrame((dt, t) => {
      earth.rotation.y += dt * 0.25;
      stars.forEach((s) => {
        const sp = C3.REDUCE ? 1 : dt * 0.7;
        if (s.t < s.goal) s.t = Math.min(s.goal, s.t + sp); else if (s.t > s.goal) s.t = Math.max(s.goal, s.t - sp);
        const e = C3.ease(s.t);
        tmp.lerpVectors(s.p0, s.p1, e); s.grp.position.copy(tmp);
        const pos = s.sight.geometry.attributes.position; pos.setXYZ(1, tmp.x, tmp.y, tmp.z); pos.needsUpdate = true;
        s.sight.material.opacity = s.sel ? 0.6 : 0.2;
        if (s.path) s.path.material.opacity = s.sel || s.goal > 0 ? 0.85 : 0;
        const k = s.sel ? 1 + 0.08 * Math.sin(t * 4) : 1; s.core.scale.setScalar(k);
      });
    });
    // 지금 별의 등급(옮기는 중이면 사이 값으로 그림만 바뀌어요)
    const magNow = (s) => s.app + (s.abs - s.app) * C3.ease(s.t);
    return { g, R, stars, byId, setGoal, select, earth, shell, rDir, fmt, magNow };
  }
  /* 지구에서 본 하늘(2D 그림). sunOnly면 태양만 */
  function drawSky(cv, T, opt = {}) {
    const G = window.GLOW; const { c, w, h } = G.fit(cv);
    const sunM = T.magNow(T.byId('sun')), day = opt.sunOnly ? Math.max(0, Math.min(1, (-sunM - 4) / 16)) : 0; // 태양이 가까우면 낮 하늘
    const bg = c.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, day ? `rgb(${4 + 70 * day | 0},${8 + 140 * day | 0},${20 + 200 * day | 0})` : '#040814');
    bg.addColorStop(1, day ? `rgb(${13 + 150 * day | 0},${22 + 180 * day | 0},${48 + 190 * day | 0})` : '#0d1630');
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    const R2 = GLOWR(5); for (let i = 0; i < 70; i++) { c.globalAlpha = (0.25 + R2() * 0.5) * (1 - day); c.fillStyle = '#dfe8ff'; c.fillRect(R2() * w, R2() * h, 1, 1); } c.globalAlpha = 1;
    const list = T.stars.filter((s) => (opt.sunOnly ? s.id === 'sun' : s.id !== 'sun'));
    list.forEach((s) => {
      const m = T.magNow(s), x = s.sky[0] * w, y = s.sky[1] * h;
      const r = Math.min(window.GLOW.magR(Math.max(m, -12), 1.0) * 2.6, Math.min(w, h) * 0.42);
      window.GLOW.star(c, x, y, Math.max(2.2, r), 1, true);
      c.font = '800 12.5px Pretendard, sans-serif'; c.textAlign = 'center'; c.fillStyle = s.sel ? '#ffe08a' : '#dfe6f6';
      const lbl = s.same ? '10 pc 별' : s.name;
      c.fillText(lbl, x, Math.min(h - 6, y + Math.max(16, Math.min(r * 0.5, 40)) + 12));
    });
  }
  return { build, drawSky, STARS, R, fmt };
})();
