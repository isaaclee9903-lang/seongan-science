/* ===== 측정 실험대 3D (RS3L) — 교과서 172·184쪽 장치를 따라 새로 만든 모형 =====
   투명 밀폐 장치 속 상추, 뚜껑의 산소 센서·이산화 탄소 센서, 옆의 LED등, 그래프가 나오는 스마트 기기.
   LED등을 켜면 광합성과 호흡이 함께, 끄면 호흡만 일어난다. 그래프는 눈금 숫자 없이 변화의 방향만 그린 모형이다. */
const RS3L = (() => {
  'use strict';
  const { V, canvasTex, makeStage, prepare, REDUCE } = C3;
  const { molKit, swarm, starTex, lettuceTex, bentPlane, basisMesh, taperTube, mkR } = RS3;
  const R = Math.random, lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  function lab(host) {
    const st = makeStage(host, { hold: true, fov: 30, top: '#fbfdfe', bottom: '#e6eef4', minD: 4, maxD: 12, fitWidth: true, exposure: 1.02 });
    const { scene, camera, controls, renderer } = st;
    camera.position.set(.6, 2.6, 7.8); controls.target.set(.1, .95, 0); controls.maxPolarAngle = Math.PI * .5; controls.minPolarAngle = Math.PI * .2;
    st.sun.position.set(3, 8, 6); st.sun.intensity = 1.5;
    const sc = st.sun.shadow.camera; sc.left = -4; sc.right = 4; sc.top = 4; sc.bottom = -3; sc.updateProjectionMatrix(); st.sun.shadow.mapSize.set(2048, 2048);
    const hemi = scene.children.find((c) => c.isHemisphereLight);
    const W = new THREE.Group(); scene.add(W);

    /* 실험대 */
    const topTex = canvasTex(1024, 512, (g, w, h) => { g.fillStyle = '#f3f2ee'; g.fillRect(0, 0, w, h); const r = mkR(3); for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${r() < .5 ? '255,255,255' : '120,130,140'},${r() * .12})`; g.fillRect(r() * w, r() * h, 2, 2); } });
    const bench = new THREE.Mesh(new THREE.BoxGeometry(9, .16, 6), [0, 0, 0, 0, 0, 0].map((_, i) => new THREE.MeshStandardMaterial(i === 2 ? { map: topTex, roughness: .7 } : { color: 0xc7ccd1, roughness: .7 })));
    bench.position.set(0, -.08, 1.2); bench.receiveShadow = true; W.add(bench);

    /* 투명 밀폐 장치 */
    const CX = -.35, CR = .62, CH = 1.45;
    const baseM = new THREE.MeshStandardMaterial({ color: 0x4d5863, roughness: .55 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(CR + .1, CR + .12, .08, 64), baseM); base.position.set(CX, .04, 0); base.castShadow = base.receiveShadow = true; W.add(base);
    const acryl = new THREE.MeshStandardMaterial({ color: 0xdfeef7, transparent: true, opacity: .2, roughness: .08, metalness: 0, side: THREE.DoubleSide, depthWrite: false });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(CR, CR, CH, 72, 1, true), acryl); wall.position.set(CX, .08 + CH / 2, 0); wall.renderOrder = 3; W.add(wall);
    const rimM = new THREE.MeshStandardMaterial({ color: 0xbfd3e0, roughness: .3, transparent: true, opacity: .7 });
    [.1, .08 + CH].forEach((y) => { const t = new THREE.Mesh(new THREE.TorusGeometry(CR, .012, 8, 96), rimM); t.rotation.x = Math.PI / 2; t.position.set(CX, y, 0); W.add(t); });
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(CR + .06, CR + .06, .07, 64), new THREE.MeshStandardMaterial({ color: 0xf2f4f6, roughness: .45 })); lid.position.set(CX, .08 + CH + .035, 0); lid.castShadow = true; W.add(lid);
    const gasket = new THREE.Mesh(new THREE.TorusGeometry(CR + .01, .02, 8, 96), new THREE.MeshStandardMaterial({ color: 0xc9483a, roughness: .6 })); gasket.rotation.x = Math.PI / 2; gasket.position.set(CX, .08 + CH, 0); W.add(gasket);

    /* 상추: 밑동에서 펼쳐진 잎 여러 장 */
    const lettuce = new THREE.Group(); lettuce.position.set(CX, .1, 0); W.add(lettuce);
    const lmats = [3, 9, 15].map((s) => new THREE.MeshStandardMaterial({ map: lettuceTex(s), alphaTest: .5, side: THREE.DoubleSide, roughness: .75 }));
    const leafSpots = []; const rl = mkR(6);
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * 6.283 + rl() * .4, tilt = i < 5 ? 1.0 : 1.9, L = i < 5 ? .78 : .64;
      const geo = bentPlane(L, L * .95, .35, .25 + rl() * .2, (rl() - .5) * .6, 10, 12);
      const p = geo.attributes.position; for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k); p.setZ(k, p.getZ(k) + Math.sin(x * 38 + y * 9) * .018 * (y / L)); } geo.computeVertexNormals();
      const dir = V(Math.cos(a), tilt, Math.sin(a)), up = V(-Math.cos(a), 1.2, -Math.sin(a));
      lettuce.add(basisMesh(geo, lmats[i % 3], V(Math.cos(a) * .04, .02 + i * .006, Math.sin(a) * .04), dir, up));
      const d = dir.clone().normalize();
      leafSpots.push(V(CX + d.x * L * .5, .1 + d.y * L * .5 + .03, d.z * L * .5));
    }
    const lcore = new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, .1, 16), new THREE.MeshStandardMaterial({ color: 0xe6f0c8, roughness: .7 })); lcore.position.y = .05; lettuce.add(lcore);

    /* 센서 두 개: 뚜껑에 꽂힌 막대 + 몸통 */
    const bodyM = new THREE.MeshStandardMaterial({ color: 0x2c8fc9, roughness: .45 });
    const scrM = (txt) => new THREE.MeshStandardMaterial({ map: canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#16242e'; g.fillRect(0, 0, w, h); g.fillStyle = '#7fe0ff'; g.font = '800 46px Pretendard, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 2); }), roughness: .4, emissive: 0x0a2230, emissiveIntensity: .4 });
    const sensors = [];
    [['CO₂', -.22], ['O₂', .22]].forEach(([t, dx]) => {
      const g = new THREE.Group(); g.position.set(CX + dx, .08 + CH + .07, 0); W.add(g);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .5, 16), new THREE.MeshStandardMaterial({ color: 0x9aa6b0, roughness: .35, metalness: .3 })); rod.position.y = -.22; g.add(rod);
      const body = new THREE.Mesh(new THREE.BoxGeometry(.2, .38, .14), bodyM); body.position.y = .22; body.castShadow = true; g.add(body);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .06, 16), new THREE.MeshStandardMaterial({ color: 0x1d2f3a })); cap.position.y = .44; g.add(cap);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(.15, .075), scrM(t)); scr.position.set(0, .27, .071); g.add(scr);
      sensors.push(g);
    });

    /* 스마트 기기: 받침대 위 태블릿, 화면은 그래프 */
    const TX = 1.25;
    const tab = new THREE.Group(); tab.position.set(TX, 0, .25); tab.rotation.y = -.32; W.add(tab);
    const standM = new THREE.MeshStandardMaterial({ color: 0x9aa7b3, roughness: .5 });
    const stand = new THREE.Mesh(new THREE.BoxGeometry(.5, .05, .4), standM); stand.position.set(0, .025, -.1); stand.castShadow = true; tab.add(stand);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(.12, .5, .04), standM); arm.position.set(0, .26, -.22); arm.rotation.x = -.25; tab.add(arm);
    const TW = 1.2, TH = .82;
    const slate = new THREE.Mesh(new THREE.BoxGeometry(TW + .08, TH + .08, .05), new THREE.MeshStandardMaterial({ color: 0x1e2328, roughness: .4 })); slate.position.set(0, .2 + TH / 2 + .05, -.12); slate.rotation.x = -.18; slate.castShadow = true; tab.add(slate);
    const GC = document.createElement('canvas'); GC.width = 1100; GC.height = 750;
    const gtex = new THREE.CanvasTexture(GC); gtex.colorSpace = THREE.SRGBColorSpace; gtex.anisotropy = 8;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(TW, TH), new THREE.MeshBasicMaterial({ map: gtex, toneMapped: false })); screen.position.set(0, 0, .027); slate.add(screen);
    /* 전선: 센서 → 기기 */
    const cabM = new THREE.MeshStandardMaterial({ color: 0x2b3238, roughness: .6 });
    sensors.forEach((s, i) => { const a = s.position.clone().add(V(0, .47, 0)), b = V(TX - .55, .25, .1 - i * .08); W.add(taperTube([a, a.clone().add(V(.25, .25, 0)), V(lerp(a.x, b.x, .6), 1.6 - i * .08, .1), V(b.x - .2, .35, b.z), b], .012, .012, cabM, 40, 6)); });

    /* LED등: 받침·기둥·네모난 판(작은 LED 여러 개) */
    const LX = -1.95;
    const led = new THREE.Group(); led.position.set(LX, 0, .1); led.rotation.y = .5; W.add(led);
    const metal = new THREE.MeshStandardMaterial({ color: 0x8e9aa5, roughness: .35, metalness: .4 });
    const lbase = new THREE.Mesh(new THREE.CylinderGeometry(.24, .28, .06, 40), metal); lbase.position.y = .03; lbase.castShadow = true; led.add(lbase);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.25, 16), metal); pole.position.y = .65; led.add(pole);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(.62, .9, .06), new THREE.MeshStandardMaterial({ color: 0x5d6873, roughness: .45, metalness: .2 })); panel.position.set(0, 1.12, .04); panel.castShadow = true; led.add(panel);
    const ledTex = canvasTex(256, 384, (g, w, h) => { g.fillStyle = '#e8ecef'; g.fillRect(0, 0, w, h); for (let y = 0; y < 9; y++) for (let x = 0; x < 6; x++) { const cx = 22 + x * 42.4, cy = 22 + y * 42.5; const rg = g.createRadialGradient(cx, cy, 1, cx, cy, 14); rg.addColorStop(0, '#ffffff'); rg.addColorStop(1, '#c9d2d9'); g.fillStyle = rg; g.beginPath(); g.arc(cx, cy, 13, 0, 6.3); g.fill(); } });
    const ledFace = new THREE.MeshStandardMaterial({ map: ledTex, emissive: 0xfff6dc, emissiveMap: ledTex, emissiveIntensity: 0, roughness: .5 });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(.56, .84), ledFace); face.position.set(0, 1.12, .072); led.add(face);
    const spot = new THREE.SpotLight(0xfff3d6, 0, 7, .55, .6, 1.2); spot.position.set(LX + .1, 1.15, .2); spot.target.position.set(CX, .45, 0); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); W.add(spot, spot.target);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.62, .3, 1.4, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff4c8, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.set((LX + CX) / 2 - .1, .95, .06); beam.rotation.z = Math.PI / 2 + .12; W.add(beam);

    /* 이름표 */
    const tag = (t, at) => st.label(t, 'dev', at);
    tag('LED등', V(LX, 1.75, .1)); tag('산소 센서', () => sensors[1].position.clone().add(V(.16, .64, 0))); tag('이산화 탄소 센서', () => sensors[0].position.clone().add(V(-.2, .64, 0)));
    tag('투명 밀폐 장치', V(CX, -.02, CR + .16)); tag('스마트 기기', V(TX - .05, -.02, .62)); tag('상추', V(CX + .55, .32, .55));

    /* 기체 알갱이: 장치 안의 수 = 농도 */
    const kit = molKit(.032), sw = swarm(W, kit), free = [];
    const sTex = starTex(), sparks = [];
    const spark = (p) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: sTex, transparent: true, depthWrite: false, depthTest: false })); sp.position.copy(p); sp.renderOrder = 6; W.add(sp); sparks.push({ sp, t: 0 }); };
    const inside = () => { const a = R() * 6.283, r = Math.sqrt(R()) * (CR - .1); return V(CX + Math.cos(a) * r, .62 + R() * (CH - .7), Math.sin(a) * r); };
    const addFree = (k, p) => { const m = kit.make(k); m.position.copy(p || inside()); m.rotation.set(R() * 6, R() * 6, 0); W.add(m); free.push({ m, k, v: V((R() - .5) * .2, (R() - .5) * .1, (R() - .5) * .2) }); };
    const O0 = .45, C0 = .55;
    let O = O0, C = C0, light = false;
    const want = () => ({ o: Math.round(lerp(5, 22, O)), c: Math.round(lerp(4, 20, C)) });
    for (let i = 0; i < want().o; i++) addFree('o'); for (let i = 0; i < want().c; i++) addFree('c');

    /* 그래프(스마트 기기 화면) */
    const SEGN = 4, segs = []; let ptsO = [[0, O]], ptsC = [[0, C]];
    function drawGraph(status) {
      const g = GC.getContext('2d'), w = GC.width;
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, GC.height);
      g.fillStyle = '#f1f5f9'; g.fillRect(0, 0, w, 84);
      g.fillStyle = '#14263b'; g.font = '800 40px Pretendard, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText('센서 측정', 34, 44);
      g.font = '700 32px Pretendard, sans-serif'; g.fillStyle = status === 'on' ? '#9a6a00' : status === 'off' ? '#33466e' : '#5a6b7e'; g.textAlign = 'right';
      g.fillText(status === 'on' ? 'LED등 켬 · 측정 중' : status === 'off' ? 'LED등 끔 · 측정 중' : (segs.length ? '측정 멈춤' : '측정 전'), w - 34, 44);
      const X0 = 120, X1 = w - 40, px = (t) => X0 + (X1 - X0) * t / SEGN;
      [['산소', '#d9472f', ptsO, 112], ['이산화 탄소', '#2f363d', ptsC, 410]].forEach(([nm, col, pts, Y]) => {
        const H = 248;
        segs.forEach((s) => { g.fillStyle = s.on ? '#fff1c2' : '#e1e7f2'; g.fillRect(px(s.a), Y, px(s.b) - px(s.a), H); });
        g.strokeStyle = '#e3e9ef'; g.lineWidth = 2; for (let i = 1; i < SEGN; i++) { g.beginPath(); g.moveTo(px(i), Y); g.lineTo(px(i), Y + H); g.stroke(); }
        g.strokeStyle = '#34495e'; g.lineWidth = 3; g.beginPath(); g.moveTo(X0, Y); g.lineTo(X0, Y + H); g.lineTo(X1, Y + H); g.stroke();
        g.save(); g.translate(60, Y + H / 2); g.rotate(-Math.PI / 2); g.fillStyle = col; g.font = '800 34px Pretendard, sans-serif'; g.textAlign = 'center'; g.fillText(nm, 0, 0); g.restore();
        g.strokeStyle = col; g.lineWidth = 7; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath();
        pts.forEach((p, i) => { const x = px(p[0]), y = Y + H - 20 - p[1] * (H - 40); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
        segs.forEach((s) => { if (s.b - s.a < .25) return; g.fillStyle = s.on ? '#9a6a00' : '#33466e'; g.font = '800 26px Pretendard, sans-serif'; g.textAlign = 'center'; g.fillText(s.on ? '켬' : '끔', px((s.a + s.b) / 2), Y + 24); });
      });
      g.fillStyle = '#5a6b7e'; g.font = '700 28px Pretendard, sans-serif'; g.textAlign = 'center';
      for (let i = 0; i <= SEGN; i++) g.fillText(String(i * 10), px(i), 688);
      g.fillText('시간(분)', (X0 + X1) / 2, 728);
      gtex.needsUpdate = true;
      const c2 = big.getContext('2d'); c2.drawImage(GC, 0, 0);
    }
    /* 기기 화면 크게 보기(그림 위 오른쪽) */
    const devBox = document.createElement('div'); devBox.className = 'devscr'; devBox.innerHTML = '<span class="dt">스마트 기기 화면</span>'; const big = document.createElement('canvas'); big.width = GC.width; big.height = GC.height; devBox.prepend(big); host.appendChild(devBox);
    drawGraph('idle');

    function setLight(v) {
      light = v; ledFace.emissiveIntensity = v ? 1.6 : 0; spot.intensity = v ? 9 : 0; beam.material.opacity = v ? .08 : 0;
      st.sun.intensity = v ? 1.4 : .8; hemi.intensity = v ? .55 : .32; renderer.toneMappingExposure = v ? 1.02 : .88;
      host.classList.toggle('dark', !v);
    }
    setLight(false);
    let run = null;
    const DO = { on: .2, off: -.12 }, DC = { on: -.22, off: .14 };
    const api = {
      st,
      get left() { return SEGN - segs.length; },
      get running() { return !!run; },
      setLight,
      measure(on, cb) {
        if (run || segs.length >= SEGN) return;
        setLight(on); const s = { a: segs.length, b: segs.length, on }; segs.push(s);
        run = { s, k: 0, o0: O, c0: C, dO: DO[on ? 'on' : 'off'], dC: DC[on ? 'on' : 'off'], cb, gT: 0 };
      },
      jump(list) {
        list.forEach((on) => { const s = { a: segs.length, b: segs.length + 1, on }; segs.push(s); const k = on ? 'on' : 'off'; for (let i = 1; i <= 30; i++) { const u = i / 30; ptsO.push([s.a + u, O + DO[k] * u + (R() - .5) * .008]); ptsC.push([s.a + u, C + DC[k] * u + (R() - .5) * .008]); } O += DO[k]; C += DC[k]; setLight(on); });
        free.splice(0).forEach((f) => W.remove(f.m)); for (let i = 0; i < want().o; i++) addFree('o'); for (let i = 0; i < want().c; i++) addFree('c');
        drawGraph('idle');
      },
      reset() { segs.length = 0; ptsO = [[0, O0]]; ptsC = [[0, C0]]; O = O0; C = C0; run = null; sw.clear(); free.splice(0).forEach((f) => W.remove(f.m)); for (let i = 0; i < want().o; i++) addFree('o'); for (let i = 0; i < want().c; i++) addFree('c'); setLight(false); drawGraph('idle'); },
    };
    const frame = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.1, 1.0)); frame.position.set(.45, .95, .1); frame.visible = false; W.add(frame);
    st.fit(frame, { dir: V(.08, .3, 1), margin: 1.0, dur: 0 });
    api.view = () => st.fit(frame, { dir: V(.08, .3, 1), margin: 1.0, dur: .8 });
    const DUR = REDUCE ? .2 : 6;
    let accP = 0, accR = 0;
    st.onFrame((dt) => {
      if (run) {
        run.k = Math.min(1, run.k + dt / DUR); const u = run.k; run.s.b = run.s.a + u;
        O = run.o0 + run.dO * u; C = run.c0 + run.dC * u;
        run.gT += dt; if (run.gT > .1) { run.gT = 0; ptsO.push([run.s.b, O + (R() - .5) * .01]); ptsC.push([run.s.b, C + (R() - .5) * .01]); drawGraph(run.s.on ? 'on' : 'off'); }
        if (u >= 1) { const cb = run.cb; ptsO.push([run.s.b, O]); ptsC.push([run.s.b, C]); run = null; drawGraph('idle'); cb && cb(); }
      }
      free.forEach((f) => { f.v.x += (R() - .5) * dt * .4; f.v.y += (R() - .5) * dt * .3; f.v.z += (R() - .5) * dt * .4; f.v.clampLength(0, .22); f.m.position.addScaledVector(f.v, dt); const p = f.m.position, dx = p.x - CX, dz = p.z, r = Math.hypot(dx, dz); if (r > CR - .08) { p.x = CX + dx / r * (CR - .08); p.z = dz / r * (CR - .08); f.v.x *= -1; f.v.z *= -1; } if (p.y < .6) { p.y = .6; f.v.y = Math.abs(f.v.y); } if (p.y > CH - .02) { p.y = CH - .02; f.v.y = -Math.abs(f.v.y); } f.m.rotation.y += dt; });
      sw.step(dt);
      for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.t += dt; if (s.t >= 1) { W.remove(s.sp); s.sp.material.dispose(); sparks.splice(i, 1); continue; } const k = Math.sin(s.t * Math.PI); s.sp.scale.setScalar(.15 * (.5 + k * .7)); s.sp.material.opacity = k; }
      if (!light && segs.length) { accR += dt; if (accR > .55) { accR = 0; spark(leafSpots[Math.floor(R() * leafSpots.length)]); } }
      if (!run) return;
      // 농도에 맞게 알갱이 수 맞추기: 줄 때는 잎으로 들어가고, 늘 때는 잎에서 나온다
      const wnt = want(), nO = free.filter((f) => f.k === 'o').length, nC = free.filter((f) => f.k === 'c').length;
      const toLeaf = (k) => { const i = free.findIndex((f) => f.k === k); if (i < 0) return; const f = free.splice(i, 1)[0]; const p0 = f.m.position.clone(); W.remove(f.m); const t = leafSpots[Math.floor(R() * leafSpots.length)]; sw.add(k, [p0, p0.clone().lerp(t, .5).add(V(0, .1, 0)), t], { dur: 1.5, fi: .01 }); };
      const fromLeaf = (k) => { const t = leafSpots[Math.floor(R() * leafSpots.length)], d = inside(); sw.add(k, [t, t.clone().lerp(d, .5).add(V(0, .15, 0)), d], { dur: 1.6, fo: .01, cb: () => addFree(k, d) }); };
      accP += dt; if (accP > .3) { accP = 0;
        if (nC > wnt.c) toLeaf('c'); else if (nC < wnt.c) fromLeaf('c');
        if (nO > wnt.o) toLeaf('o'); else if (nO < wnt.o) fromLeaf('o'); }
    });
    prepare(st);
    return api;
  }

  /* ========== 맑은 날 하루 (교과서 184쪽 9번 형식, 2D 캔버스) ==========
     이산화 탄소 흡수량(위)과 방출량(아래)의 상댓값. 낮에는 광합성량이 호흡량보다 많아 흡수, 밤에는 호흡만 일어나 방출. 곡선 모양은 개념 이해를 위한 모형. */
  function dayGraph(cv) {
    const g = cv.getContext('2d'), DPR = Math.min(2, window.devicePixelRatio || 1);
    let W = 1, H = 1, hour = 0, shown = 0;
    const light = (h) => clamp(Math.sin((h - 6) / 12 * Math.PI));
    const P = (h) => 4 * Math.pow(light(h), 1.5);
    const Rr = () => 1;
    const net = (h) => P(h) - Rr();
    const rrect = (x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); };
    function sky(x, y, w, h) {
      const k = light(hour), d = clamp(k * 3);
      const mix = (a, b) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], d))).join(',')})`;
      const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, mix([16, 26, 60], [140, 200, 240])); gr.addColorStop(1, mix([50, 66, 118], [222, 241, 251]));
      g.save(); rrect(x, y, w, h, 14); g.fillStyle = gr; g.fill(); g.clip();
      if (k > 0) { const t = (hour - 6) / 12, sx = x + w * (.06 + .88 * t), sy = y + h * (.95 - .75 * Math.sin(t * Math.PI)); const rg = g.createRadialGradient(sx, sy, 2, sx, sy, 44); rg.addColorStop(0, 'rgba(255,240,170,.9)'); rg.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = rg; g.fillRect(sx - 44, sy - 44, 88, 88); g.fillStyle = '#fbb92e'; g.beginPath(); g.arc(sx, sy, 13, 0, 6.3); g.fill(); }
      else { const r = mkR(2); g.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 46; i++) g.fillRect(x + r() * w, y + r() * h * .75, 1.6, 1.6); const t = ((hour + 6) % 24) / 12, mx = x + w * (.08 + .84 * t), my = y + h * (.9 - .65 * Math.sin(t * Math.PI)); g.fillStyle = '#f6e7a8'; g.beginPath(); g.arc(mx, my, 11, 0, 6.3); g.fill(); g.fillStyle = mix([16, 26, 60], [140, 200, 240]); g.beginPath(); g.arc(mx + 5, my - 3, 10, 0, 6.3); g.fill(); }
      // 땅과 토마토
      g.fillStyle = '#7a4e2b'; g.fillRect(x, y + h - 14, w, 14);
      const px = x + w * .5, py = y + h - 14, lit = d > .3;
      g.strokeStyle = lit ? '#3e8a35' : '#2c5a33'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + 3, py - h * .3, px, py - h * .62); g.stroke();
      for (let i = 0; i < 7; i++) { const yy = py - h * (.1 + i * .072), sd = i % 2 ? 1 : -1, s = 1 - i * .08; g.fillStyle = lit ? (i % 2 ? '#3f9a3a' : '#2f7d2f') : (i % 2 ? '#2b5c37' : '#24502f'); g.beginPath(); g.ellipse(px + sd * 17 * s, yy - 3, 16 * s, 6 * s, sd * -.45, 0, 6.3); g.fill(); }
      g.fillStyle = lit ? '#d8321f' : '#7c2c25'; g.beginPath(); g.arc(px + 12, py - h * .3, 6, 0, 6.3); g.fill();
      g.restore();
    }
    function draw() {
      g.clearRect(0, 0, W, H);
      const pad = 12, skyH = Math.max(90, Math.min(150, H * .24));
      sky(pad, pad, W - pad * 2, skyH);
      const gx = 64, gy = pad + skyH + 30, gw = W - gx - 22, gh = H - gy - 40;
      const unit = gh / 6, y0 = gy + unit * 4;
      const X = (h) => gx + gw * h / 24, Y = (v) => y0 - v * unit;
      g.fillStyle = '#fff6d8'; g.fillRect(X(6), gy, X(18) - X(6), gh);
      g.strokeStyle = '#e1e8ef'; g.lineWidth = 1; for (let v = -2; v <= 4; v++) { g.beginPath(); g.moveTo(gx, Y(v)); g.lineTo(gx + gw, Y(v)); g.stroke(); }
      g.setLineDash([3, 4]); [6, 12, 18].forEach((h) => { g.beginPath(); g.moveTo(X(h), gy); g.lineTo(X(h), gy + gh); g.stroke(); }); g.setLineDash([]);
      g.strokeStyle = '#34495e'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx, gy + gh); g.stroke(); g.beginPath(); g.moveTo(gx, y0); g.lineTo(gx + gw, y0); g.stroke();
      g.fillStyle = '#5a6b7e'; g.font = '700 12.5px Pretendard, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle';
      for (let v = -2; v <= 4; v++) g.fillText(String(Math.abs(v)), gx - 6, Y(v));
      g.textAlign = 'center'; [[0, '0시'], [6, '오전 6시'], [12, '12시'], [18, '오후 6시'], [24, '0시']].forEach(([h, t]) => g.fillText(t, X(h), gy + gh + 16));
      const vt = (t, x, y, c) => { g.save(); g.translate(x, y); g.rotate(-Math.PI / 2); g.font = '800 13px Pretendard, sans-serif'; g.fillStyle = c; g.fillText(t, 0, 0); g.restore(); };
      vt('흡수량', 20, (gy + y0) / 2, '#0b3f73'); vt('방출량', 20, (y0 + gy + gh) / 2, '#8a3b2c');
      g.font = '700 12.5px Pretendard, sans-serif'; g.fillStyle = '#5a6b7e'; g.textAlign = 'left'; g.fillText('이산화 탄소 흡수량과 방출량 (상댓값)', gx + 8, gy + 11);
      g.strokeStyle = '#d9472f'; g.lineWidth = 3.5; g.lineJoin = 'round'; g.beginPath();
      for (let i = 0; i <= shown * 8; i++) { const h = i / 8; i ? g.lineTo(X(h), Y(net(h))) : g.moveTo(X(h), Y(net(h))); } g.stroke();
      const cx = X(hour), cy = Y(net(hour));
      g.strokeStyle = 'rgba(14,99,179,.55)'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(cx, gy); g.lineTo(cx, gy + gh); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#0e63b3'; g.beginPath(); g.arc(cx, cy, 6.5, 0, 6.3); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
    }
    const size = () => { const r = cv.getBoundingClientRect(); W = Math.max(10, r.width); H = Math.max(10, r.height); cv.width = W * DPR; cv.height = H * DPR; g.setTransform(DPR, 0, 0, DPR, 0, 0); draw(); };
    size(); try { new ResizeObserver(size).observe(cv); } catch (e) {}
    return {
      set(h) { hour = h; shown = Math.max(shown, h); draw(); },
      showAll() { shown = 24; draw(); }, reset() { shown = 0; hour = 0; draw(); },
      P, Rr, net, light,
      get hour() { return hour; },
    };
  }
  return { lab, dayGraph };
})();
