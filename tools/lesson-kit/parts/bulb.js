/* ===== 전구 모형 =====
   kind: 'mini'(실험용 꼬마전구), 'filament'(백열전구), 'led'(LED 전구). tint: 켜졌을 때 빛 색.
   set(k): 0(꺼짐)~1(가장 밝게). 반환 group.light 는 주변을 비추는 점광원(없을 수도 있음). */
const BULB = (() => {
  const { mesh } = C3;
  const metal = () => new THREE.MeshStandardMaterial({ color: 0xc9ced6, metalness: 0.95, roughness: 0.28 });
  function make(o = {}) {
    const kind = o.kind || 'mini', tint = new THREE.Color(o.tint || 0xffc96b), s = o.size || 1, withLight = o.light !== false;
    const g = new THREE.Group();
    // 받침(소켓)
    if (kind === 'mini') {
      g.add(mesh(new THREE.CylinderGeometry(0.2 * s, 0.24 * s, 0.22 * s, 28), new THREE.MeshStandardMaterial({ color: 0x2c323c, roughness: 0.5 }), 0, 0.11 * s, 0));
      const th = mesh(new THREE.CylinderGeometry(0.15 * s, 0.15 * s, 0.2 * s, 24), metal(), 0, 0.32 * s, 0); g.add(th);
      for (let i = 0; i < 4; i++) g.add(mesh(new THREE.TorusGeometry(0.152 * s, 0.012 * s, 6, 24), metal(), 0, (0.25 + i * 0.045) * s, 0)).children;
    } else {
      g.add(mesh(new THREE.CylinderGeometry(0.22 * s, 0.26 * s, 0.34 * s, 28), new THREE.MeshStandardMaterial({ color: kind === 'led' ? 0xeef1f5 : 0x8a919c, roughness: kind === 'led' ? 0.45 : 0.3, metalness: kind === 'led' ? 0 : 0.8 }), 0, 0.17 * s, 0));
    }
    const gy = kind === 'mini' ? 0.62 * s : 0.7 * s, gr = kind === 'mini' ? 0.28 * s : 0.42 * s;
    // 유리
    const glass = new THREE.MeshPhysicalMaterial({
      color: kind === 'led' ? 0xf4f6fa : 0xfffaf0, roughness: kind === 'led' ? 0.55 : 0.05, metalness: 0,
      transparent: true, opacity: kind === 'led' ? 0.92 : 0.38, emissive: tint.clone(), emissiveIntensity: 0, depthWrite: false,
    });
    const gl = new THREE.Mesh(new THREE.SphereGeometry(gr, 36, 26), glass); gl.position.y = gy; gl.scale.y = kind === 'mini' ? 1.15 : 1.1; g.add(gl);
    // 속 빛나는 부분: 필라멘트(코일) 또는 LED 칩
    const coreM = new THREE.MeshStandardMaterial({ color: kind === 'led' ? 0xe8e2c8 : 0x4a3520, emissive: tint.clone(), emissiveIntensity: 0, roughness: 0.4 });
    if (kind === 'led') {
      const plate = mesh(new THREE.CylinderGeometry(0.2 * s, 0.2 * s, 0.03 * s, 24), new THREE.MeshStandardMaterial({ color: 0xd9dde3, metalness: 0.6, roughness: 0.35 }), 0, gy - 0.12 * s, 0); g.add(plate);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.add(mesh(new THREE.BoxGeometry(0.06 * s, 0.025 * s, 0.06 * s), coreM, Math.cos(a) * 0.12 * s, gy - 0.1 * s, Math.sin(a) * 0.12 * s)); }
    } else {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.07 * s, 0.012 * s, 6, 24, Math.PI * 1.6), coreM); coil.position.y = gy + 0.02 * s; coil.rotation.x = Math.PI / 2; g.add(coil);
      [-1, 1].forEach((d) => g.add(mesh(new THREE.CylinderGeometry(0.008 * s, 0.008 * s, gy * 0.75, 6), new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.8, roughness: 0.4 }), d * 0.06 * s, gy * 0.6, 0)));
    }
    // 번짐(후광)
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: tint.clone(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.setScalar(gr * (kind === 'mini' ? 3.4 : 3.2)); halo.position.y = gy; g.add(halo);
    let light = null;
    if (withLight) { light = new THREE.PointLight(tint.clone(), 0, 4.5 * s, 1.6); light.position.y = gy; g.add(light); }
    let cur = 0;
    g.set = (k) => {
      cur = k;
      glass.emissiveIntensity = k * (kind === 'led' ? 0.4 : kind === 'mini' ? 1.1 : 0.7);
      coreM.emissiveIntensity = k * 4.0; glass.opacity = kind === 'led' ? 0.92 : kind === 'mini' ? 0.38 + k * 0.25 : 0.38;
      halo.material.opacity = k * (kind === 'mini' ? 0.6 : 0.35);
      if (light) light.intensity = k * 2.4 * (o.lightGain || 1);
    };
    g.get = () => cur;
    g.glass = gl; g.top = gy + gr;
    g.set(0);
    return g;
  }
  let _halo = null;
  function haloTex() {
    if (_halo) return _halo;
    _halo = C3.canvasTex(128, 128, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
    return _halo;
  }
  // 똑딱 스위치: set(true)면 닫힘(누움), false면 열림(들림)
  function toggle(o = {}) {
    const s = o.size || 1, g = new THREE.Group();
    g.add(mesh(new RoundedBoxGeometry(0.62 * s, 0.14 * s, 0.4 * s, 2, 0.04 * s), new THREE.MeshStandardMaterial({ color: 0x2d3440, roughness: 0.5 }), 0, 0.07 * s, 0));
    const pivot = new THREE.Group(); pivot.position.set(-0.2 * s, 0.17 * s, 0); g.add(pivot);
    const cu = new THREE.MeshStandardMaterial({ color: 0xc0703a, metalness: 1, roughness: 0.3 });
    pivot.add(mesh(new RoundedBoxGeometry(0.46 * s, 0.04 * s, 0.1 * s, 2, 0.015 * s), cu, 0.23 * s, 0, 0));
    pivot.add(mesh(new THREE.SphereGeometry(0.05 * s, 14, 10), new THREE.MeshStandardMaterial({ color: 0xd8433b, roughness: 0.4 }), 0.43 * s, 0.03 * s, 0));
    g.add(mesh(new THREE.BoxGeometry(0.06 * s, 0.08 * s, 0.14 * s), cu, 0.22 * s, 0.17 * s, 0));
    let want = false, ang = -0.75;
    g.set = (v) => { want = !!v; };
    g.step = (dt) => { const tgt = want ? 0 : -0.75; ang += (tgt - ang) * Math.min(1, dt * 12); pivot.rotation.z = -ang; };
    g.isOn = () => want;
    g.step(1);
    return g;
  }
  return { make, toggle, haloTex };
})();
