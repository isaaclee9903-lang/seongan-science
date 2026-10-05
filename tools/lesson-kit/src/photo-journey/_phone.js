/* ===== 스마트폰 속 기판: 사진 한 장의 여행 =====
   단계(phase) 0~6: 1 빛이 센서로 → 2 숫자로 바꿔 AP로 → 3 여러 장을 D램에 잠깐 → 4 AP가 합치고 다듬기 → 5 압축해서 낸드에 저장 → 6 화면에.
   부품의 크기·위치·빛 알갱이·데이터 알갱이는 개념 이해를 위한 모형이에요. */
const PHONE = (() => {
  const { V, mesh, canvasTex, clamp01, ease } = C3;
  function pcbTex() {
    return canvasTex(1024, 640, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#173d33'); gr.addColorStop(1, '#0e2922'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(205,170,90,.32)'; g.lineWidth = 3; g.lineCap = 'round';
      const r = PHOTO.seeded(11);
      for (let i = 0; i < 90; i++) { let x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { if (r() < 0.5) x += (r() - 0.5) * 220; else y += (r() - 0.5) * 220; g.lineTo(x, y); } g.stroke(); }
      g.fillStyle = 'rgba(205,170,90,.55)'; for (let i = 0; i < 220; i++) { g.beginPath(); g.arc(r() * w, r() * h, 3, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,.035)'; for (let i = 0; i < 4000; i++) g.fillRect(r() * w, r() * h, 2, 2);
    });
  }
  function chipTex(name, sub) {
    return canvasTex(512, 512, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2c3038'); gr.addColorStop(1, '#14161b'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      g.fillStyle = 'rgba(205,212,222,.55)'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '800 104px Pretendard, Arial, sans-serif'; g.fillText(name, w / 2, h / 2 - (sub ? 26 : 0));
      if (sub) { g.font = '700 44px Pretendard, Arial, sans-serif'; g.fillStyle = 'rgba(205,212,222,.35)'; g.fillText(sub, w / 2, h / 2 + 66); }
      g.beginPath(); g.arc(52, 52, 16, 0, 7); g.fillStyle = 'rgba(205,212,222,.3)'; g.fill();
    });
  }
  function sensorTex() {
    return canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#1b1d24'; g.fillRect(0, 0, w, h);
      const n = 48, s = w / n;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const f = SENSOR.filterOf(i, j), l = 0.55 + Math.random() * 0.25;
        g.fillStyle = f === 'R' ? `rgba(229,72,77,${l})` : f === 'G' ? `rgba(48,164,108,${l})` : `rgba(62,99,221,${l})`;
        g.fillRect(i * s + 1, j * s + 1, s - 2, s - 2);
      }
      const sh = g.createLinearGradient(0, 0, w, h); sh.addColorStop(0, 'rgba(255,120,220,.28)'); sh.addColorStop(0.35, 'rgba(120,220,255,.22)'); sh.addColorStop(0.7, 'rgba(255,240,140,.22)'); sh.addColorStop(1, 'rgba(160,120,255,.28)');
      g.fillStyle = sh; g.fillRect(0, 0, w, h);
    });
  }
  function glowSprite(color, size) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: BULB.haloTex(), color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.scale.setScalar(size); return s;
  }
  function chip(root, o) {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z); root.add(g);
    g.add(mesh(new RoundedBoxGeometry(o.w, 0.06, o.d, 2, 0.015), new THREE.MeshStandardMaterial({ color: 0x2f5a48, roughness: 0.6 }), 0, 0.03, 0));
    const top = new THREE.MeshStandardMaterial({ map: o.map || chipTex(o.name, o.sub), roughness: 0.38, metalness: 0.25, emissive: new THREE.Color(o.glow), emissiveIntensity: 0 });
    const die = mesh(new RoundedBoxGeometry(o.w * 0.86, o.h || 0.14, o.d * 0.86, 3, 0.03), top, 0, 0.06 + (o.h || 0.14) / 2, 0); g.add(die);
    const halo = glowSprite(o.glow, Math.max(o.w, o.d) * 2.4); halo.position.y = 0.3; g.add(halo);
    g.topY = 0.06 + (o.h || 0.14);
    g.setGlow = (k) => { top.emissiveIntensity = k * 0.35; halo.material.opacity = k * 0.75; };
    return g;
  }

  function build(st, opt = {}) {
    const { scene, label } = st;
    const root = new THREE.Group(); scene.add(root);
    root.add(mesh(new RoundedBoxGeometry(9.2, 0.16, 5.0, 3, 0.06), new THREE.MeshStandardMaterial({ map: pcbTex(), roughness: 0.55, metalness: 0.12 }), 0.3, -0.08, 0));
    const SEN = { x: -3.3, z: -0.9 }, AP = { x: -0.7, z: 0.15 }, DR = { x: 1.75, z: -1.15 }, NA = { x: 1.75, z: 1.3 };
    // 이미지 센서 + 위로 띄운 렌즈(펼쳐 보인 모습)
    const sen = chip(root, { x: SEN.x, z: SEN.z, w: 1.3, d: 1.3, h: 0.1, glow: 0xffc864, map: sensorTex() });
    const lensY = 1.55;
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.6, 0.42, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x1d2027, metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide }));
    barrel.position.set(SEN.x, lensY, SEN.z); barrel.castShadow = true; root.add(barrel);
    const ringM = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.9, roughness: 0.25 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.04, 10, 48), ringM); rim.rotation.x = Math.PI / 2; rim.position.set(SEN.x, lensY + 0.21, SEN.z); root.add(rim);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.54, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x9fc4ff, roughness: 0.03, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.45, depthWrite: false }));
    lens.scale.y = 0.32; lens.position.set(SEN.x, lensY + 0.12, SEN.z); root.add(lens);
    [-1, 1].forEach((s) => root.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, lensY - 0.4, 8), new THREE.MeshStandardMaterial({ color: 0x5b6470, metalness: 0.7, roughness: 0.4 }), SEN.x + s * 0.5, (lensY - 0.2) / 2 + 0.1, SEN.z + 0.5)));
    // 빛기둥
    const coneM = new THREE.MeshBasicMaterial({ color: 0xffe2a8, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 0.5, 2.9, 40, 1, true), coneM); cone.position.set(SEN.x, lensY + 0.2 + 1.45, SEN.z); root.add(cone);
    const cone2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, lensY - 0.15, 40, 1, true), coneM); cone2.position.set(SEN.x, (lensY + 0.15) / 2, SEN.z); root.add(cone2);
    // 칩들
    const ap = chip(root, { x: AP.x, z: AP.z, w: 1.9, d: 1.9, h: 0.16, name: 'AP', sub: 'ISP', glow: 0x7c8cff });
    const dr = chip(root, { x: DR.x, z: DR.z, w: 1.5, d: 1.0, name: 'DRAM', glow: 0x37c6c0 });
    const na = chip(root, { x: NA.x, z: NA.z, w: 1.5, d: 1.0, name: 'NAND', sub: 'UFS', glow: 0xb48cff });
    // MLCC(작은 갈색 조각)
    const bodyG = new THREE.BoxGeometry(0.2, 0.1, 0.1), capG = new THREE.BoxGeometry(0.05, 0.11, 0.11);
    const bodyM = new THREE.MeshStandardMaterial({ color: 0xa0714a, roughness: 0.75 }), capM = new THREE.MeshStandardMaterial({ color: 0xc7ccd3, metalness: 0.95, roughness: 0.3 });
    [[-1.95, 0.9], [-1.95, 0.6], [-1.95, 0.3], [-1.95, 0], [-1.95, -0.3], [-1.95, -0.6], [-1.2, 1.35], [-0.9, 1.35], [-0.6, 1.35], [-0.3, 1.35], [0.0, 1.35], [0.45, -0.85], [0.45, -0.55]].forEach(([x, z], i) => {
      const g = new THREE.Group(); g.position.set(x, 0.05, z); if (i < 6) g.rotation.y = Math.PI / 2;
      g.add(mesh(bodyG, bodyM)); g.add(mesh(capG, capM, -0.1, 0, 0)); g.add(mesh(capG, capM, 0.1, 0, 0)); root.add(g);
    });
    // 화면(세워 둔 휴대폰 화면)
    const scr = new THREE.Group(); scr.position.set(5.2, 2.05, -0.9); scr.rotation.y = -0.5; root.add(scr);
    scr.add(mesh(new RoundedBoxGeometry(2.05, 3.95, 0.14, 4, 0.22), new THREE.MeshStandardMaterial({ color: 0x0b0d12, metalness: 0.4, roughness: 0.3 })));
    const scrM = new THREE.MeshBasicMaterial({ map: PHOTO.screenTex(), color: 0x222630 });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.86, 3.72), scrM); panel.position.z = 0.072; scr.add(panel);
    const scrGlow = glowSprite(0xbfd4ff, 5.2); scrGlow.position.z = 0.2; scr.add(scrGlow);
    // 기판 위 금색 길과 데이터 알갱이
    const gold = new THREE.MeshStandardMaterial({ color: 0xd6b45a, metalness: 1, roughness: 0.3 });
    const Y = 0.035;
    const routes = {
      sa: [V(SEN.x + 0.66, Y, SEN.z), V(-2.3, Y, SEN.z), V(-1.9, Y, -0.35), V(AP.x - 0.96, Y, -0.35)],
      ad: [V(AP.x + 0.96, Y, -0.45), V(0.8, Y, -0.45), V(0.95, Y, DR.z), V(DR.x - 0.76, Y, DR.z)],
      da: [V(DR.x - 0.76, Y, DR.z + 0.25), V(0.95, Y, DR.z + 0.25), V(0.8, Y, -0.15), V(AP.x + 0.96, Y, -0.15)],
      an: [V(AP.x + 0.96, Y, 0.55), V(0.8, Y, 0.55), V(0.95, Y, NA.z), V(NA.x - 0.76, Y, NA.z)],
      as: [V(AP.x, Y, AP.z + 0.96), V(AP.x, Y, 2.1), V(3.4, Y, 2.1), V(4.3, 0.25, 0.9), V(4.75, 0.25, -0.35)],
    };
    Object.values(routes).forEach((pts) => { const t = C3.tube(pts.map((v) => v.clone()), 0.022, gold, 60); t.castShadow = false; root.add(t); });
    const dots = {};
    const dotCol = { sa: 0xffc864, ad: 0x37c6c0, da: 0x37c6c0, an: 0xb48cff, as: 0x9fd2ff };
    Object.keys(routes).forEach((k) => { const d = C3.makeDots(12, dotCol[k], 1.7); d.setPath(routes[k].map((v) => v.clone().setY(v.y + 0.07))); d.mesh.visible = false; root.add(d.mesh); dots[k] = d; });
    // 빛 알갱이(사진 속 색을 그대로 띤 빛)
    const NP = 120, partM = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95, depthWrite: false });
    const parts = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), partM, NP); parts.frustumCulled = false; root.add(parts);
    const PP = []; const col = new THREE.Color();
    for (let k = 0; k < NP; k++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()), dx = Math.cos(a) * r, dz = Math.sin(a) * r;
      const c = PHOTO.sample((dx + 1) / 2, (dz + 1) / 2); col.setRGB(c[0] / 255, c[1] / 255, c[2] / 255).convertSRGBToLinear(); parts.setColorAt(k, col);
      PP.push({ dx, dz, s: Math.random() });
    }
    // 사진 장들: D램 위에 잠깐 놓이는 여러 장, AP 위에서 합친 한 장, 낸드 위에 저장된 사진들
    const rawM = [], frames = [];
    for (let i = 0; i < 4; i++) { const m = new THREE.MeshBasicMaterial({ map: PHOTO.tex('raw'), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }); rawM.push(m); const f = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.83), m); f.visible = false; root.add(f); frames.push(f); }
    const cleanT = PHOTO.tex('clean');
    const mergedM = new THREE.MeshBasicMaterial({ map: cleanT, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const merged = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.83), mergedM); merged.visible = false; root.add(merged);
    const edgeM = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const mergedEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.25, 0.83)), edgeM); merged.add(mergedEdge);
    const thumbs = [];
    for (let i = 0; i < 4; i++) { const m = new THREE.MeshBasicMaterial({ map: cleanT, transparent: true, opacity: 1, side: THREE.DoubleSide }); const t = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.47), m); t.rotation.x = -1.2; t.position.set(NA.x - 0.12 + i * 0.08, 0.42 + i * 0.09, NA.z - 0.05 - i * 0.04); t.visible = false; root.add(t); thumbs.push(t); }
    const tilt = -1.05;
    const frameAt = (i) => V(DR.x - 0.2 + i * 0.12, 0.62 + i * 0.22, DR.z - 0.1 - i * 0.06);
    const apAbove = V(AP.x, 1.25, AP.z);
    const naAbove = V(NA.x + 0.2, 0.75, NA.z);

    // 이름표
    const L = {};
    if (opt.labels !== false) {
      L.sen = label('이미지 센서 <small>눈</small>', 'S', V(SEN.x - 0.2, 0.25, SEN.z + 1.25));
      L.lens = label('렌즈', 'small', V(SEN.x + 0.85, lensY + 0.25, SEN.z));
      L.ap = label('AP <small>두뇌 · 속에 ISP</small>', 'A', V(AP.x - 0.3, 0.25, AP.z + 1.75));
      L.dr = label('D램 <small>잠깐 올려 두는 곳</small>', 'D', V(DR.x + 1.55, 0.05, DR.z + 0.75));
      L.na = label('낸드 플래시 <small>오래 보관하는 곳</small>', 'N', V(NA.x + 0.4, 0.05, NA.z + 1.35));
      L.sc = label("화면", "Sc", V(5.2, 4.35, -0.9));
      if (opt.mlcc) L.mc = label('MLCC', 'C', V(-1.95, 0.35, 1.25));
    }

    const STATE = { p: 0, power: true, saved: 0, savedRun: false };
    function setPhase(p) { STATE.p = p; if (p >= 4.95 && !STATE.savedRun) { STATE.savedRun = true; STATE.saved = Math.min(4, STATE.saved + 1); } }
    function reset() { STATE.p = 0; STATE.savedRun = false; }
    const tmp = V();
    function update(dt, t) {
      const p = STATE.p, on = STATE.power;
      const win = (a, b) => (p > a && p <= b + 0.001 ? 1 : 0);
      // 1 빛
      const lightK = on ? (p > 0.02 && p <= 1.0 ? 1 : p > 1 && p < 1.3 ? (1.3 - p) / 0.3 : 0) : 0;
      coneM.opacity = lightK * 0.14;
      parts.visible = lightK > 0.01;
      if (parts.visible) {
        const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V(1, 1, 1);
        const top = lensY + 3.1;
        for (let k = 0; k < NP; k++) {
          const a = PP[k]; a.s += dt * 0.42; if (a.s > 1) a.s -= 1;
          if (a.s < 0.72) { const e = a.s / 0.72; tmp.set(SEN.x + a.dx * (1.1 - 0.75 * e), top - (top - lensY - 0.15) * e, SEN.z + a.dz * (1.1 - 0.75 * e)); }
          else { const e = (a.s - 0.72) / 0.28; tmp.set(SEN.x + a.dx * (0.35 - 0.75 * e), lensY + 0.15 - (lensY + 0.15 - 0.22) * e, SEN.z + a.dz * (0.35 - 0.75 * e)); }
          sc.setScalar(lightK); m4.compose(tmp, q, sc); parts.setMatrixAt(k, m4);
        }
        parts.instanceMatrix.needsUpdate = true;
      }
      sen.setGlow(on ? clamp01(lightK * 0.9 + win(1, 2) * 0.6) : 0);
      // 2~6 데이터 알갱이
      const act = { sa: win(1, 2), ad: win(2, 3), da: win(3, 3.6), an: win(4, 5), as: win(5, 6) };
      Object.keys(dots).forEach((k) => { const v = on && act[k]; dots[k].mesh.visible = !!v; if (v) dots[k].update(dt, 2.6); });
      const pulse = 0.65 + 0.35 * Math.sin(t * 6);
      ap.setGlow(on ? Math.max(win(1, 2) * 0.5, win(3, 4) * pulse, win(4, 5) * 0.45, win(5, 6) * 0.5) : 0);
      dr.setGlow(on ? Math.max(win(2, 3) * 0.8, win(3, 3.6) * 0.5) : 0);
      na.setGlow(on ? win(4, 5) * 0.85 : 0);
      // 3 D램 위 여러 장 → 4 AP 위에서 한 장으로
      const nF = p <= 2 ? 0 : p <= 3 ? Math.min(4, Math.ceil((p - 2) * 4.2)) : 4;
      frames.forEach((f, i) => {
        let vis = on && p > 2 && p < 4 && i < nF, op = 0.95;
        if (p > 3) { const m = ease(clamp01((p - 3) / 0.8)); f.position.lerpVectors(frameAt(i), tmp.copy(apAbove).add(V(0, i * 0.02, 0)), m); f.rotation.set(tilt, 0, (1 - m) * (i - 1.5) * 0.06); op = 0.95 * (1 - clamp01((p - 3.6) / 0.4)); }
        else { f.position.copy(frameAt(i)); f.rotation.set(tilt, 0, (i - 1.5) * 0.06); }
        f.visible = vis && op > 0.01; f.material.opacity = op;
      });
      // 합친 한 장 → 압축해서 낸드로
      let mv = false, mop = 0;
      if (on && p > 3.55 && p < 5.05) {
        mv = true;
        if (p <= 4) { mop = clamp01((p - 3.55) / 0.35); merged.position.copy(apAbove); merged.scale.setScalar(1); }
        else { const m = ease(clamp01((p - 4) / 0.95)); merged.position.lerpVectors(apAbove, naAbove, m); merged.scale.setScalar(1 - 0.55 * m); mop = 1 - clamp01((p - 4.85) / 0.2); }
        merged.rotation.set(tilt, 0, 0);
      }
      merged.visible = mv; mergedM.opacity = mop; edgeM.opacity = mop * (p > 3.6 && p < 4.05 ? pulse : 0.6);
      thumbs.forEach((th, i) => (th.visible = i < STATE.saved));
      // 6 화면
      const scrK = !on ? 0 : p > 5 ? 0.1 + 0.9 * clamp01((p - 5) / 0.7) : 0.1;
      scrM.color.setRGB(0.12 + 0.88 * scrK, 0.13 + 0.87 * scrK, 0.16 + 0.84 * scrK); if (!on) scrM.color.setRGB(0.015, 0.017, 0.02);
      scrGlow.material.opacity = on && p > 5 ? clamp01((p - 5) / 0.7) * 0.35 : 0;
      if (L.dr) L.dr.set(on ? 'D램 <small>잠깐 올려 두는 곳</small>' : 'D램 <small>전원이 꺼지면 비어요</small>');
      if (L.na) L.na.set(on ? '낸드 플래시 <small>오래 보관하는 곳</small>' : '낸드 플래시 <small>사진이 그대로 남아요</small>');
    }
    return { STATE, setPhase, reset, update, setPower: (v) => (STATE.power = !!v), root };
  }
  return { build };
})();
