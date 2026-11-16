/* ===== 물 분해 실험실 3D (교과서 138쪽 해 보기 장치) =====
   EL3.lab(host) → { st, power(on), test('+'|'-', done), leave(), showLens(on), reset(), jump(o), onEvent, view() }
   장치: 흰 받침판, 전원 장치(손잡이·표시등·(+)(−) 단자), 그 위 투명한 아크릴 기둥(관 두 개, 아래 전극, 위 꼭지),
   옆에 눕힌 물통(관으로 기둥 아래와 이어짐). (+)극 관이 왼쪽, (−)극 관이 오른쪽(교과서 사진과 같음).
   기체가 모이는 빠르기·방울 수는 보기 좋게 정한 모형이고, (−)극 관에 더 많이 모이게만 그린다(수치는 쓰지 않음). */
(() => {
  const { V } = EL3;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const std = (c, r = 0.6, m = 0, ex = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: m }, ex));
  const M = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
  function glowTex(inner, outer) {
    return C3.canvasTex(128, 128, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, inner); r.addColorStop(0.35, outer); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
  }
  function smokeTex() { return C3.canvasTex(128, 128, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(150,158,168,.55)'); r.addColorStop(1, 'rgba(150,158,168,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); }); }

  EL3.lab = function (host, opt = {}) {
    const st = C3.makeStage(host, { top: '#f7fafc', bottom: '#dfe8f1', fov: 30, minD: 4, maxD: 18, fitWidth: true, sunX: -4, sunZ: 8, exposure: 1.0 });
    const { scene, camera, controls } = st;
    controls.maxPolarAngle = Math.PI * 0.55; controls.minPolarAngle = Math.PI * 0.18;
    const S = { busy: false, on: false, gR: 0, p: false, m: false, lens: false, valve: { '+': 0, '-': 0 } };
    const A = { onEvent: null, st: S };

    C3.addTable(scene, 14, 7, 0);
    const dev = new THREE.Group(); scene.add(dev);
    // 받침판
    dev.add(M(new RoundedBoxGeometry(4.2, 0.1, 1.9, 3, 0.04), std('#f4f5f6', 0.55), 0, 0.05, 0));
    // 전원 장치
    const box = M(new RoundedBoxGeometry(1.9, 0.82, 1.3, 4, 0.07), std('#22272e', 0.45, 0.15), 0.25, 0.51, 0); dev.add(box);
    const panel = M(new THREE.BoxGeometry(1.7, 0.6, 0.02), std('#2d333b', 0.6), 0.25, 0.5, 0.655); dev.add(panel);
    const scr = M(new THREE.BoxGeometry(0.42, 0.16, 0.02), std('#c9d4cf', 0.4), 0.25, 0.66, 0.67); dev.add(scr);
    const lamp = M(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshStandardMaterial({ color: '#5a2a24', emissive: '#ff3b2b', emissiveIntensity: 0 }), 0.6, 0.66, 0.67); dev.add(lamp);
    const knobG = new THREE.Group(); knobG.position.set(-0.15, 0.38, 0.68); dev.add(knobG);
    knobG.add(M(new THREE.CylinderGeometry(0.11, 0.12, 0.09, 32), std('#e9ecef', 0.5), 0, 0, 0)).rotation.x = Math.PI / 2;
    const knobMark = M(new THREE.BoxGeometry(0.02, 0.09, 0.02), std('#22272e', 0.5), 0, 0.05, 0.05); knobG.add(knobMark);
    const knob2 = M(new THREE.CylinderGeometry(0.07, 0.075, 0.07, 24), std('#d8dce1', 0.5), 0.7, 0.38, 0.68); knob2.rotation.x = Math.PI / 2; dev.add(knob2);
    // 단자
    const jack = (x, c) => { const j = M(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 20), std(c, 0.45), x, 0.95, 0.42); dev.add(j); return j; };
    jack(-0.05, '#d93a2c'); jack(0.55, '#1d2228');
    // 투명 기둥
    const acr = new THREE.MeshPhysicalMaterial({ color: '#e3edf5', roughness: 0.08, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide, clearcoat: 0.6 });
    const X0 = 0.25, Y0 = 1.3, H = 2.2, TR = 0.115, TX = [X0 - 0.16, X0 + 0.16]; // 관 두 개의 x (왼쪽 (+), 오른쪽 (−))
    const holder = M(new RoundedBoxGeometry(0.95, 0.38, 0.62, 3, 0.03), acr, X0, 1.11, 0); holder.castShadow = false; dev.add(holder);
    const col = M(new THREE.BoxGeometry(0.62, H, 0.42), acr, X0, Y0 + H / 2, 0); col.castShadow = false; dev.add(col);
    const frameM = std('#d5dbe2', 0.35, 0.6);
    [[-0.33, 0.23], [0.33, 0.23], [-0.33, -0.23], [0.33, -0.23]].forEach(([x, z]) => dev.add(M(new THREE.CylinderGeometry(0.018, 0.018, H, 10), frameM, X0 + x, Y0 + H / 2, z)));
    const cap = M(new RoundedBoxGeometry(0.72, 0.16, 0.5, 3, 0.03), std('#1f242a', 0.5), X0, Y0 + H + 0.08, 0); dev.add(cap);
    // 관 속 물·기체
    const waterM = new THREE.MeshPhysicalMaterial({ color: '#4ea6e3', roughness: 0.12, transparent: true, opacity: 0.78, depthWrite: false });
    const tubeGlass = new THREE.MeshPhysicalMaterial({ color: '#dfe9f1', roughness: 0.05, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide });
    const T = {};
    ['+', '-'].forEach((s, i) => {
      const x = TX[i], g = new THREE.Group(); g.position.set(x, 0, 0); dev.add(g);
      g.add(M(new THREE.CylinderGeometry(TR + 0.012, TR + 0.012, H - 0.08, 40, 1, true), tubeGlass, 0, Y0 + H / 2, 0));
      const w = M(new THREE.CylinderGeometry(TR, TR, 1, 40), waterM, 0, 0, 0); w.castShadow = false; g.add(w);
      const men = M(new THREE.TorusGeometry(TR - 0.006, 0.008, 8, 40), new THREE.MeshStandardMaterial({ color: '#5aa9da', roughness: 0.3, transparent: true, opacity: 0.9 }), 0, 0, 0); men.rotation.x = Math.PI / 2; g.add(men);
      const ele = M(new THREE.CylinderGeometry(0.022, 0.022, 0.42, 12), std('#b9c0c8', 0.25, 1), 0, Y0 + 0.2, 0); g.add(ele); // 전극
      const plate = M(new THREE.BoxGeometry(0.11, 0.26, 0.012), std('#c9cfd6', 0.2, 1), 0, Y0 + 0.28, 0); g.add(plate);
      // 꼭지
      const v = new THREE.Group(); v.position.set(0, Y0 + H + 0.16, 0); g.add(v);
      v.add(M(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 20), std('#2a3038', 0.4), 0, 0.1, 0));
      v.add(M(new THREE.CylinderGeometry(0.022, 0.022, 0.16, 12), std('#e4e8ec', 0.3, 0.1), 0, 0.27, 0)); // 끝 관
      const hdl = new THREE.Group(); hdl.position.set(0, 0.12, 0); v.add(hdl);
      hdl.add(M(new THREE.BoxGeometry(0.24, 0.05, 0.05), std(s === '+' ? '#e9edf1' : '#e9edf1', 0.45), 0.09, 0, 0));
      T[s] = { g, w, men, x, hdl, gas: 0, tip: () => V(x, Y0 + H + 0.45, 0) };
    });
    // 전선(전원 장치 단자 → 기둥 아래 전극)
    dev.add(C3.tube([V(-0.05, 1.0, 0.42), V(-0.1, 1.12, 0.3), V(TX[0], 1.02, 0.25), V(TX[0], 1.05, 0.05)], 0.022, std('#d93a2c', 0.5)));
    dev.add(C3.tube([V(0.55, 1.0, 0.42), V(0.55, 1.12, 0.3), V(TX[1], 1.02, 0.25), V(TX[1], 1.05, 0.05)], 0.022, std('#1d2228', 0.5)));
    // 물통(옆으로 눕힌 흰 통)과 관
    const bottle = new THREE.Group(); bottle.position.set(-1.25, 0.42, 0.1); bottle.rotation.z = Math.PI / 2; dev.add(bottle);
    bottle.add(M(new THREE.LatheGeometry([[0, -0.62], [0.3, -0.62], [0.34, -0.55], [0.34, 0.35], [0.2, 0.52], [0.13, 0.56], [0.13, 0.66], [0, 0.66]].map(([a, b]) => new THREE.Vector2(a, b)), 48), std('#eef1f4', 0.5)));
    const bcap = M(new THREE.CylinderGeometry(0.15, 0.15, 0.14, 24), std('#2f7fd0', 0.5), 0, 0.7, 0); bottle.add(bcap);
    const bw = M(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 32, 1, true), std('#bfe3f7', 0.4, 0, { transparent: true, opacity: 0.0 }), 0, -0.1, 0); bottle.add(bw);
    dev.add(C3.tube([V(-1.25, 0.42 + 0.0, 0.1).add(V(-0.75, 0.0, 0)).setX(-1.98), V(-2.2, 0.5, 0.2), V(-1.6, 1.05, 0.25), V(-0.7, 1.12, 0.1), V(X0 - 0.48, 1.08, 0)], 0.03, new THREE.MeshPhysicalMaterial({ color: '#e6f2fa', roughness: 0.2, transparent: true, opacity: 0.55 })));
    bottle.position.x = -1.45;

    // 기체 방울(InstancedMesh)
    const NB = 260, bubGeo = new THREE.SphereGeometry(1, 10, 8), bubMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.15, transparent: true, opacity: 0.85 });
    const bubs = new THREE.InstancedMesh(bubGeo, bubMat, NB); bubs.frustumCulled = false; dev.add(bubs);
    const B = Array.from({ length: NB }, () => ({ live: false }));
    const m4 = new THREE.Matrix4(), q1 = new THREE.Quaternion(), sv = V();
    function spawn(s) {
      const b = B.find((o) => !o.live); if (!b) return;
      const t = T[s], a = Math.random() * 6.28, rr = 0.03 + Math.random() * 0.04;
      Object.assign(b, { live: true, s, x: t.x + Math.cos(a) * rr, y: Y0 + 0.18 + Math.random() * 0.22, z: Math.sin(a) * rr, v: 0.15 + Math.random() * 0.1, r: 0.008 + Math.random() * 0.012, ph: Math.random() * 6 });
    }
    const level = (s) => Y0 + H - 0.04 - T[s].gas; // 물 높이(위에서 기체만큼 내려감)
    const GMAX = { '+': 0.55, '-': 1.1 }; // (−)극에 더 많이 모이게
    function setWater() {
      ['+', '-'].forEach((s) => { const t = T[s], top = level(s), bot = Y0 + 0.02; t.w.scale.y = top - bot; t.w.position.y = (top + bot) / 2; t.men.position.y = top - 0.004; });
      bw.material.opacity = 0;
    }
    setWater();

    // 작은 시험관(기체 모으기)
    const tt = new THREE.Group(); scene.add(tt); tt.visible = false;
    const ttGlass = new THREE.MeshPhysicalMaterial({ color: '#b9cfdf', roughness: 0.05, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
    tt.add(M(new THREE.LatheGeometry([[0, 0.0], [0.07, 0.01], [0.1, 0.05], [0.11, 0.12], [0.11, 0.78], [0.125, 0.8], [0.125, 0.82], [0.105, 0.82], [0.095, 0.8], [0.095, 0.12], [0, 0.03]].map(([a, b]) => new THREE.Vector2(a, b)), 32), ttGlass));
    const ttFill = M(new THREE.CylinderGeometry(0.093, 0.093, 1, 24), new THREE.MeshStandardMaterial({ color: '#dff1fb', transparent: true, opacity: 0.0, depthWrite: false }), 0, 0, 0); tt.add(ttFill);
    tt.rotation.z = Math.PI; // 입구가 아래
    // 집게

    // 향
    const stick = new THREE.Group(); scene.add(stick); stick.visible = false;
    stick.add(M(new THREE.CylinderGeometry(0.016, 0.016, 1.3, 10), std('#3e6b4f', 0.85), 0, -0.65, 0));
    const ember = M(new THREE.SphereGeometry(0.03, 14, 10), new THREE.MeshStandardMaterial({ color: '#4a2a1e', emissive: '#ff6a1f', emissiveIntensity: 1.2 }), 0, 0, 0); stick.add(ember);
    const eGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,236,190,1)', 'rgba(255,128,40,.7)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); eGlow.scale.setScalar(0.18); stick.add(eGlow);
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: C3.canvasTex(64, 128, (g, w, h) => { const r = g.createRadialGradient(w / 2, h * 0.72, 2, w / 2, h * 0.6, h * 0.55); r.addColorStop(0, 'rgba(255,250,220,1)'); r.addColorStop(0.3, 'rgba(255,190,70,.95)'); r.addColorStop(0.7, 'rgba(255,110,30,.5)'); r.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = r; g.beginPath(); g.ellipse(w / 2, h * 0.62, w * 0.42, h * 0.5, 0, 0, 6.3); g.fill(); }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    flame.center.set(0.5, 0.15); flame.scale.set(0.14, 0.3, 1); stick.add(flame); flame.visible = false;
    // 불티·연기
    const NS = 60, sparks = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: '#ffd27a', size: 0.035, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    sparks.geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(NS * 3), 3)); scene.add(sparks);
    const SP = Array.from({ length: NS }, () => ({ live: 0 }));
    const smk = Array.from({ length: 8 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex(), transparent: true, depthWrite: false, opacity: 0 })); scene.add(s); return { s, t: Math.random() * 3 }; });
    const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,255,240,1)', 'rgba(255,170,80,.75)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); scene.add(flash);
    const L = {
      p: st.label('(+)극', 'dev', () => V(TX[0] - 0.42, Y0 + 0.3, 0.2)), m: st.label('(−)극', 'dev', () => V(TX[1] + 0.42, Y0 + 0.3, 0.2)),
      pw: st.label('전원 장치', 'dev', V(0.25, 0.1, 0.8)), wb: st.label('물통', 'dev', V(-1.45, 0.95, 0.1)),
      gp: st.label('', 'gas', () => V(TX[0] - 0.55, level('+') + T['+'].gas / 2 + 0.02, 0)), gm: st.label('', 'gas', () => V(TX[1] + 0.6, level('-') + T['-'].gas / 2, 0)),
      say: st.label('', 'say', () => sayAt),
    };
    L.say.show = false;

    // 소리('퍽')
    let AC = null;
    function pop() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const n = AC.sampleRate * 0.18, buf = AC.createBuffer(1, n, AC.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); const s = AC.createBufferSource(); s.buffer = buf; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; const gn = AC.createGain(); gn.gain.value = 0.9; s.connect(f).connect(gn).connect(AC.destination); s.start(); } catch (e) {} }

    let sayAt = V(0, 0, 0); let anim = null; // 진행 중인 장면 { t, dur, fn, done }
    const play = (dur, fn, done) => { anim = { t: 0, dur, fn, done }; };
    function stickAt(p, rotZ = -0.9) { stick.position.copy(p); stick.rotation.set(0, 0, rotZ); }
    let stickMode = null; // 'ember' | 'flame' | 'bright'
    function setStick(mode) {
      stickMode = mode; stick.visible = !!mode;
      ember.material.emissiveIntensity = mode === 'bright' ? 3.2 : mode === 'flame' ? 2 : 0.9;
      eGlow.scale.setScalar(mode === 'bright' ? 0.42 : mode === 'flame' ? 0.24 : 0.13);
      flame.visible = mode === 'flame' || mode === 'bright';
      flame.scale.set(mode === 'bright' ? 0.22 : 0.13, mode === 'bright' ? 0.5 : 0.28, 1);
    }
    function sparkBurst(p, n, sp) { let k = 0; SP.forEach((s) => { if (k < n && s.live <= 0) { k++; Object.assign(s, { live: 0.5 + Math.random() * 0.5, x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * sp, vy: Math.random() * sp * 0.9, vz: (Math.random() - 0.5) * sp }); } }); }

    st.onFrame((dt, now) => {
      // 방울
      if (S.on) {
        const k = REDUCEd ? 0 : 1;
        if (Math.random() < dt * 22 * k) spawn('+'); if (Math.random() < dt * 44 * k) spawn('-');
        T['+'].gas = Math.min(GMAX['+'], T['+'].gas + dt * 0.055); T['-'].gas = Math.min(GMAX['-'], T['-'].gas + dt * 0.11);
        S.gR = T['-'].gas / GMAX['-'];
        knobMark.parent.rotation.z = -1.2; lamp.material.emissiveIntensity = 1.6;
        if (S.gR >= 0.999) { S.on = false; lamp.material.emissiveIntensity = 0; knobMark.parent.rotation.z = 0; A.onEvent && A.onEvent('full'); }
        setWater();
      }
      let n = 0;
      B.forEach((b) => {
        if (!b.live) return;
        b.v = Math.min(0.75, b.v + dt * 0.9); b.y += b.v * dt; b.ph += dt * 9;
        if (b.y > level(b.s) - 0.01) { b.live = false; return; }
        sv.set(b.r, b.r, b.r); m4.compose(V(b.x + Math.sin(b.ph) * 0.006, b.y, b.z), q1, sv); bubs.setMatrixAt(n++, m4);
      });
      bubs.count = n; bubs.instanceMatrix.needsUpdate = true;
      // 불티
      const pa = sparks.geometry.attributes.position.array; let k = 0;
      SP.forEach((s, i) => { if (s.live > 0) { s.live -= dt; s.vy -= dt * 1.4; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; } pa[i * 3] = s.live > 0 ? s.x : 0; pa[i * 3 + 1] = s.live > 0 ? s.y : -9; pa[i * 3 + 2] = s.live > 0 ? s.z : 0; k++; });
      sparks.geometry.attributes.position.needsUpdate = true;
      // 향 연기·불꽃 흔들림
      if (stick.visible) {
        const tip = ember.getWorldPosition(V());
        if (stickMode === 'bright' && Math.random() < dt * 40) sparkBurst(tip, 3, 1.0);
        flame.material.rotation = Math.sin(now * 13) * 0.05; flame.scale.y *= 1 + Math.sin(now * 23) * 0.01;
        smk.forEach((o) => { o.t += dt; if (o.t > 2.6) { o.t = 0; } const u = o.t / 2.6; o.s.position.set(tip.x + Math.sin(o.t * 2 + u * 3) * 0.05 * u, tip.y + 0.05 + u * 0.7, tip.z); o.s.scale.setScalar(0.06 + u * 0.22); o.s.material.opacity = stickMode === 'ember' ? 0.45 * Math.sin(u * Math.PI) : 0.12 * Math.sin(u * Math.PI); });
      } else smk.forEach((o) => (o.s.material.opacity = 0));
      if (flash.material.opacity > 0) { flash.material.opacity = Math.max(0, flash.material.opacity - dt * 1.3); flash.scale.multiplyScalar(1 + dt * 1.2); }
      // 장면 진행
      if (anim) {
        anim.t += dt; const u = clamp(anim.t / anim.dur, 0, 1);
        anim.fn(u, dt);
        if (u >= 1) { const d = anim.done; anim = null; d && d(); }
      }
      ['+', '-'].forEach((s) => { T[s].hdl.rotation.y = -S.valve[s] * Math.PI / 2; });
      L.gp.set(T['+'].gas > 0.12 ? '기체' : ''); L.gm.set(T['-'].gas > 0.12 ? '기체' : '');
    });
    const REDUCEd = C3.REDUCE;

    /* 기체 확인: 시험관을 꼭지에 거꾸로 대어 기체를 모은 뒤 옆으로 옮겨 향(불)을 아래에서 넣는다 */
    const SIDE = { '+': V(-1.45, 2.35, 0.95), '-': V(1.95, 2.35, 0.95) };
    function test(s, done) {
      if (S.busy || S.on || T[s].gas < 0.2) return false;
      S.busy = true; const t = T[s], top = t.tip(), start = V(s === '+' ? -2.2 : 2.6, 3.2, 0.6), side = SIDE[s];
      tt.visible = true; ttFill.material.opacity = 0; tt.position.copy(start);
      const gas0 = t.gas, gasEnd = gas0 * 0.25;
      L.say.show = false;
      // ① 시험관을 꼭지 위로
      play(1.0, (u) => { tt.position.lerpVectors(start, V(top.x, top.y + 0.78, 0), ease(u)); }, () => {
        // ② 꼭지 열기 → 물이 올라오고 기체가 시험관으로
        play(1.6, (u) => { S.valve[s] = Math.min(1, u * 4); t.gas = gas0 + (gasEnd - gas0) * ease(u); setWater(); ttFill.material.opacity = 0.35 * u; ttFill.scale.y = 0.62; ttFill.position.y = 0.45; }, () => {
          S.valve[s] = 0;
          // ③ 시험관을 옆으로 옮기기
          const p0 = tt.position.clone();
          play(1.0, (u) => { tt.position.lerpVectors(p0, side, ease(u)); }, () => {
            // ④ 향 가져오기
            setStick(s === '+' ? 'ember' : 'flame');
            const mouth = V(side.x, side.y - 0.06, side.z), from = V(side.x + (s === '+' ? -0.9 : 0.9), side.y - 1.2, side.z + 0.3);
            stick.rotation.set(0, 0, 0);
            play(1.3, (u) => { const p = from.clone().lerp(mouth.clone().add(V(0, 0.18, 0)), ease(u)); stick.position.copy(p); stick.rotation.z = (s === '+' ? 1 : -1) * 0.5 * (1 - u); }, () => {
              if (s === '+') {
                setStick('bright'); sparkBurst(mouth.clone().add(V(0, 0.2, 0)), 30, 1.2);
                L.say.set('향불이 다시 살아났어요'); sayAt = mouth.clone().add(V(0, 0.95, 0));
                L.say.show = true; S.p = true; S.busy = false; done && done(); A.onEvent && A.onEvent('p');
              } else {
                pop(); flash.position.copy(mouth.clone().add(V(0, 0.3, 0))); flash.scale.setScalar(1.1); flash.material.opacity = 1; sparkBurst(mouth.clone().add(V(0, 0.25, 0)), 24, 1.6);
                ttFill.material.opacity = 0;
                const tp = tt.position.clone();
                play(0.35, (u) => { tt.position.copy(tp).add(V(Math.sin(u * 40) * 0.03 * (1 - u), 0, 0)); }, () => {
                  L.say.set("'퍽' 소리를 내며 탔어요"); sayAt = mouth.clone().add(V(0, 0.95, 0)); L.say.show = true;
                  S.m = true; S.busy = false; done && done(); A.onEvent && A.onEvent('m');
                });
              }
            });
          });
        });
      });
      return true;
    }
    function leave() { setStick(null); tt.visible = false; L.say.show = false; anim = null; }
    function power(on) { if (S.busy) return; S.on = !!on; }

    // 입자 돋보기(HTML 원 + 작은 3D 칸)
    const lens = document.createElement('div'); lens.className = 'lens3'; lens.hidden = true;
    lens.innerHTML = '<div class="lv"></div><div class="lsel" role="group" aria-label="돋보기로 볼 곳"><button type="button" data-k="O2">(+)극 기체</button><button type="button" data-k="H2O">물</button><button type="button" data-k="H2">(−)극 기체</button></div><div class="lcap"></div>';
    host.appendChild(lens);
    const lline = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); lline.setAttribute('class', 'lline3'); lline.innerHTML = '<line stroke="#14263b" stroke-width="1.5" stroke-dasharray="4 4"/><circle r="5" fill="none" stroke="#14263b" stroke-width="1.5"/>'; lline.hidden = true; host.appendChild(lline);
    let VW = null, lensK = 'H2O';
    const CAP = { O2: '(+)극 기체: <b>산소 입자만</b> 있어요', H2: '(−)극 기체: <b>수소 입자만</b> 있어요', H2O: '물: <b>수소와 산소, 두 종류</b>의 입자가 모여 있어요' };
    const lensTarget = () => (lensK === 'O2' ? V(TX[0], level('+') + T['+'].gas / 2, 0) : lensK === 'H2' ? V(TX[1], level('-') + T['-'].gas / 2, 0) : V(TX[1], Y0 + 0.55, 0));
    function setLens(k) {
      lensK = k; if (!VW) VW = EL3.viewer(lens.querySelector('.lv'), { spin: 0.25, margin: 0.8 });
      VW.show(k === 'H2O' ? 'water' : k); lens.querySelector('.lcap').innerHTML = CAP[k];
      lens.querySelectorAll('[data-k]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === k)));
    }
    lens.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => setLens(b.dataset.k)));
    st.onFrame(() => {
      if (lens.hidden) return;
      const p = lensTarget().project(camera), r = host.getBoundingClientRect(), lr = lens.querySelector('.lv').getBoundingClientRect();
      const x = (p.x + 1) / 2 * r.width, y = (1 - p.y) / 2 * r.height, cx = lr.left - r.left + lr.width / 2, cy = lr.top - r.top + lr.height / 2;
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1, R = lr.width / 2;
      const ln = lline.querySelector('line'); ln.setAttribute('x1', cx + dx / d * R); ln.setAttribute('y1', cy + dy / d * R); ln.setAttribute('x2', x); ln.setAttribute('y2', y);
      const c = lline.querySelector('circle'); c.setAttribute('cx', x); c.setAttribute('cy', y);
    });
    function showLens(on) { S.lens = !!on; lens.hidden = !on; lline.hidden = !on; if (on) setLens(lensK || 'H2O'); }

    function reset() {
      anim = null; S.on = false; S.busy = false; S.p = false; S.m = false; S.gR = 0; S.valve['+'] = S.valve['-'] = 0;
      T['+'].gas = 0; T['-'].gas = 0; setWater(); B.forEach((b) => (b.live = false)); leave(); showLens(false); lamp.material.emissiveIntensity = 0; knobMark.parent.rotation.z = 0;
      view(0);
    }
    function jump(o = {}) {
      reset();
      const g = o.gas === undefined ? 1 : o.gas;
      T['+'].gas = GMAX['+'] * g; T['-'].gas = GMAX['-'] * g; S.gR = g; setWater();
      if (o.on) S.on = true;
      if (o.p || o.m) { T['+'].gas *= 0.25; S.p = true; }
      if (o.m) { T['-'].gas *= 0.25; S.m = true; }
      setWater();
      if (o.inc) {
        const s = o.inc, side = SIDE[s]; tt.visible = true; tt.position.copy(side); setStick(s === '+' ? 'bright' : 'flame');
        stick.position.copy(V(side.x, side.y + 0.12, side.z)); stick.rotation.set(0, 0, 0);
        L.say.set(s === '+' ? '향불이 다시 살아났어요' : "'퍽' 소리를 내며 탔어요"); sayAt = V(side.x, side.y + 0.9, side.z); L.say.show = true;
        if (s === '-') { flash.position.copy(V(side.x, side.y + 0.25, side.z)); flash.scale.setScalar(0.9); flash.material.opacity = 0.9; }
      }
      if (o.lens) showLens(true);
    }
    // 장면 진행용 anim이 sayAt만 있을 때도 멈추지 않게
    const _play = play; void _play;
    function view(dur = 0.8, mode) {
      const objs = [col, holder, bottle, box]; const extra = [V(-2.1, 0.2, 0.6), V(2.45, 2.6, 0.6), V(0.25, 4.75, 0)];
      if (mode === 'tall') extra.push(V(0, 4.3, 0));
      st.fit(objs, { dir: V(0.1, 0.16, 1), margin: opt.margin || 1.0, dur, extra });
    }
    function focus(s, dur = 0.9) { st.fit([tt, stick], { dir: V(s === '+' ? 0.3 : -0.3, 0.18, 1), margin: 1.12, dur, extra: [V(TX[s === '+' ? 0 : 1], Y0 + 0.6, 0), V(TX[s === '+' ? 0 : 1], Y0 + H + 0.3, 0), SIDE[s].clone().add(V(0, 0.95, 0))] }); }
    function tight(dur = 0) { st.fit([col, holder, bottle, box, cap], { dir: V(0.1, 0.2, 1), margin: 1.05, dur }); }
    view(0);
    Object.assign(A, { focus, tight, st: S, power, test, leave, showLens, setLens, reset, jump, view, stage: st, T });
    return A;
  };
})();
