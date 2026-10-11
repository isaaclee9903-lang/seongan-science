/* ===== 3D 지구 단면 모형 (교과서 그림 Ⅱ-3처럼) =====
   - 지구에서 4분의 1 조각을 잘라 내어 두 단면에 층이 보이게 해요. 두 단면이 만나는 선이 지표(위)에서 지구 중심까지 내려가는 길이에요.
   - 지각 두께는 실제보다 두껍게(CRUST_K) 그려요. 맨틀·외핵·내핵의 두께는 깊이(2900·5100·6400 km)에 맞춰요.
   - 대륙 모양은 Natural Earth(공개 자료, world-atlas)를 불러와 그려요. 못 불러오면 바다만 그려요.
   - 층의 색은 교과서 그림을 따른 것이고 온도를 뜻하지 않아요. 외핵의 일렁임은 액체 상태를 나타내는 그림 표현이에요.
   이 조각 앞에 THREE, C3가 있어야 해요. */
const EARTH3D = (() => {
  const CRUST_K = 0.045;
  const R_IC = 1300 / 6400, R_OC = 3500 / 6400;
  /* 깊이(km) → 반지름 비율 (지각만 부풀림) */
  function rVis(km) {
    const cb = 1 - CRUST_K;
    if (km <= 35) return 1 - (km / 35) * CRUST_K;
    if (km <= 2900) return cb - (km - 35) / (2900 - 35) * (cb - R_OC);
    return Math.max(0, 1 - km / 6400);
  }

  /* 단면 무늬 (셰이더): 반지름에 따라 층 색, 잡음 무늬, 외핵은 천천히 일렁여요 */
  const FACE_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
  const FACE_FS = `
    precision highp float; varying vec2 vUv; uniform float uTime; uniform float uCB; uniform float uSeed; uniform float uHi;
    float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
    float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
    float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<5;i++){ s+=a*vn(p); p=p*2.03+vec2(17.1,9.2); a*=0.5; } return s; }
    void main(){
      vec2 p = vUv*2.0-1.0; float r = length(p); if (r > 1.0) discard;
      const float RIC = ${R_IC.toFixed(5)}; const float ROC = ${R_OC.toFixed(5)};
      float n = fbm(p*6.0 + uSeed); float m = fbm(p*2.6 + 40.0 + uSeed);
      vec3 col;
      if (r > uCB) {                                   // 지각: 여러 가지 암석 (갈색 결)
        float g = fbm(vec2(atan(p.y,p.x)*30.0, r*120.0));
        col = mix(vec3(0.42,0.30,0.20), vec3(0.62,0.47,0.31), g);
        col = mix(col, vec3(0.30,0.22,0.15), smoothstep(0.75,1.0,(r-uCB)/(1.0-uCB))*0.5);
      } else if (r > ROC) {                            // 맨틀: 고체 암석, 군데군데 녹아 흐르는 곳
        float u = (r-ROC)/(uCB-ROC);
        col = mix(vec3(0.93,0.40,0.15), vec3(0.58,0.15,0.08), pow(u,0.8));
        col = mix(col, vec3(0.40,0.08,0.04), (1.0-n)*0.38);
        col += vec3(1.0,0.55,0.2)*smoothstep(0.66,0.8,m)*0.32;
      } else if (r > RIC) {                            // 외핵: 액체, 천천히 일렁임
        float u = (r-RIC)/(ROC-RIC);
        float a = atan(p.y,p.x);
        vec2 q = vec2(a*3.0 + uTime*0.12 + 1.5*fbm(p*3.0 - uTime*0.05), r*9.0 - uTime*0.08);
        float f = fbm(q);
        col = mix(vec3(1.0,0.84,0.40), vec3(0.95,0.55,0.12), u);
        col = mix(col, vec3(1.0,0.95,0.70), smoothstep(0.55,0.85,f)*0.55);
        col = mix(col, vec3(0.85,0.42,0.08), smoothstep(0.5,0.2,f)*0.25);
      } else {                                          // 내핵: 고체, 가장 안쪽
        float u = r/RIC;
        col = mix(vec3(1.0,0.99,0.93), vec3(1.0,0.88,0.55), pow(u,1.6));
        col = mix(col, vec3(1.0), smoothstep(0.62,0.8,n)*0.5);
      }
      float e = 1.0;
      e = min(e, 0.6 + 0.4*smoothstep(0.0,0.006,abs(r-uCB)));
      e = min(e, 0.6 + 0.4*smoothstep(0.0,0.006,abs(r-ROC)));
      e = min(e, 0.7 + 0.3*smoothstep(0.0,0.006,abs(r-RIC)));
      col *= e;
      col += vec3(1.0,0.97,0.85) * (1.0 - smoothstep(0.0, RIC*1.7, r)) * 0.35;   // 가운데 빛
      col *= uHi;
      gl_FragColor = vec4(col, 1.0);
    }`;

  /* Natural Earth 육지(110m)를 원통 지도로 그린 지구 겉면 */
  async function landRings() {
    const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json');
    const topo = await res.json();
    const tf = topo.transform, arcs = topo.arcs.map((a) => { let x = 0, y = 0; return a.map((d) => { x += d[0]; y += d[1]; return tf ? [x * tf.scale[0] + tf.translate[0], y * tf.scale[1] + tf.translate[1]] : d; }); });
    const arc = (i) => (i >= 0 ? arcs[i] : arcs[~i].slice().reverse());
    const ring = (ids) => { const out = []; ids.forEach((i, k) => { const a = arc(i); out.push(...(k ? a.slice(1) : a)); }); return out; };
    const rings = [];
    const geom = (g) => { if (g.type === 'GeometryCollection') g.geometries.forEach(geom); else if (g.type === 'Polygon') g.arcs.forEach((r) => rings.push(ring(r))); else if (g.type === 'MultiPolygon') g.arcs.forEach((p) => p.forEach((r) => rings.push(ring(r)))); };
    geom(topo.objects.land);
    return rings;
  }
  function paintEarth(g, W, H, rings) {
    const sea = g.createLinearGradient(0, 0, 0, H);
    sea.addColorStop(0, '#1d4d86'); sea.addColorStop(0.5, '#1d6bb0'); sea.addColorStop(1, '#1d4d86');
    g.fillStyle = sea; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '120,190,240' : '10,40,90'},${0.04 + Math.random() * 0.06})`; g.beginPath(); g.ellipse(Math.random() * W, Math.random() * H, 4 + Math.random() * 30, 2 + Math.random() * 8, 0, 0, Math.PI * 2); g.fill(); }
    if (!rings) return;
    const P = (p) => [(p[0] + 180) / 360 * W, (90 - p[1]) / 180 * H];
    const pathAll = () => { g.beginPath(); rings.forEach((r) => { let px = null; r.forEach((p, k) => { const q = P(p); if (k === 0 || (px !== null && Math.abs(q[0] - px) > W / 2)) g.moveTo(q[0], q[1]); else g.lineTo(q[0], q[1]); px = q[0]; }); g.closePath(); }); };
    /* 얕은 바다 빛 */
    g.save(); pathAll(); g.strokeStyle = 'rgba(90,190,230,.45)'; g.lineWidth = 7; g.lineJoin = 'round'; g.stroke(); g.restore();
    /* 육지: 위도에 따라 색 (적도 초록, 건조한 곳 황토, 극지 흰색) */
    g.save(); pathAll(); g.clip('evenodd');
    const land = g.createLinearGradient(0, 0, 0, H);
    [[0, '#eef3f6'], [0.12, '#dfe7e4'], [0.17, '#6d8a4c'], [0.28, '#4f7d3a'], [0.36, '#b49a62'], [0.42, '#a8894f'], [0.5, '#3f7a34'], [0.58, '#a68a52'], [0.66, '#8a8a52'], [0.74, '#5d7d3e'], [0.84, '#dfe7e4'], [1, '#f4f7f9']].forEach(([s, col]) => land.addColorStop(s, col));
    g.fillStyle = land; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++) { const x = Math.random() * W, y = Math.random() * H; g.fillStyle = `rgba(${Math.random() < 0.5 ? '40,60,20' : '230,215,170'},${0.05 + Math.random() * 0.1})`; g.fillRect(x, y, 2 + Math.random() * 7, 1 + Math.random() * 4); }
    g.restore();
  }
  function cloudTex() {
    return C3.canvasTex(1024, 512, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      for (let i = 0; i < 520; i++) {
        const y = h * (0.5 + (Math.random() - 0.5) * 0.9), lat = Math.abs(y / h - 0.5);
        if (lat < 0.08 && Math.random() < 0.5) continue;
        const x = Math.random() * w, rx = 10 + Math.random() * 46, ry = 4 + Math.random() * 12;
        g.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.12})`;
        for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x + (Math.random() - 0.5) * rx, y + (Math.random() - 0.5) * ry, rx * (0.5 + Math.random() * 0.6), ry * (0.6 + Math.random() * 0.5), 0, 0, Math.PI * 2); g.fill(); }
      }
    });
  }

  /* 지구 모형 만들기. R: 반지름. 돌려주는 것: group, faces(단면 재질), axisPoint(km)(길 위의 점), wedgeDir(잘라 낸 쪽 방향) */
  function make(opt = {}) {
    const R = opt.R || 3, seg = opt.seg || 96;
    const group = new THREE.Group();
    /* 겉면: 3/4 구 (잘라 낸 쪽은 x<0, z>0) */
    const earthCv = document.createElement('canvas'); earthCv.width = 2048; earthCv.height = 1024;
    const eg = earthCv.getContext('2d'); paintEarth(eg, 2048, 1024, null);
    const earthTex = new THREE.CanvasTexture(earthCv); earthTex.colorSpace = THREE.SRGBColorSpace; earthTex.anisotropy = 8;
    earthTex.wrapS = THREE.RepeatWrapping; earthTex.repeat.set(0.75, 1); earthTex.offset.set(0.25 - (opt.lonShift || 0.07), 0);   /* 아시아가 보이게 돌려 놓음 */
    const shellMat = new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.78, metalness: 0, emissive: 0x0a1830, emissiveIntensity: 0.25 });
    const shell = new THREE.Mesh(new THREE.SphereGeometry(R, seg, seg / 2, Math.PI / 2, Math.PI * 1.5), shellMat);
    group.add(shell);
    landRings().then((rings) => { paintEarth(eg, 2048, 1024, rings); earthTex.needsUpdate = true; }).catch(() => {});
    /* 구름 */
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, seg, seg / 2, Math.PI / 2, Math.PI * 1.5), new THREE.MeshStandardMaterial({ map: cloudTex(), transparent: true, depthWrite: false, roughness: 1 }));
    clouds.material.map.wrapS = THREE.RepeatWrapping; clouds.material.map.repeat.set(0.75, 1); clouds.material.map.offset.set(0.25, 0);
    group.add(clouds);
    /* 대기 빛 테두리 */
    const atm = new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 64, 32), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.2); gl_FragColor = vec4(0.35,0.62,1.0, f*0.55); }`,
    }));
    if (opt.atmosphere !== false) group.add(atm);
    /* 단면 두 장 */
    const uni = { uTime: { value: 0 }, uCB: { value: 1 - CRUST_K }, uSeed: { value: 0 }, uHi: { value: 1 } };
    const mkFace = (seed) => new THREE.ShaderMaterial({ uniforms: { uTime: uni.uTime, uCB: uni.uCB, uSeed: { value: seed }, uHi: uni.uHi }, vertexShader: FACE_VS, fragmentShader: FACE_FS, side: THREE.DoubleSide });
    const faceA = new THREE.Mesh(new THREE.CircleGeometry(R, 160, Math.PI / 2, Math.PI), mkFace(0.0));            /* z=0 면, x<0 반쪽 */
    const faceB = new THREE.Mesh(new THREE.CircleGeometry(R, 160, -Math.PI / 2, Math.PI), mkFace(7.3)); faceB.rotation.y = -Math.PI / 2;   /* x=0 면, z>0 반쪽 */
    group.add(faceA, faceB);
    /* 단면 테두리 (겉 지표선) */
    const rimMat = new THREE.LineBasicMaterial({ color: 0x3b2a1c, transparent: true, opacity: 0.8 });
    const rimPts = (rot) => { const P = []; for (let i = 0; i <= 96; i++) { const a = Math.PI / 2 + (i / 96) * Math.PI; P.push(new THREE.Vector3(Math.cos(a) * R * 1.001, Math.sin(a) * R * 1.001, 0.002)); } return P.map((p) => p.applyAxisAngle(new THREE.Vector3(0, 1, 0), rot)); };
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rimPts(0)), rimMat));
    const rb = rimPts(0).map((p) => new THREE.Vector3(-p.x, p.y, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2));
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rb), rimMat));

    const wedgeDir = new THREE.Vector3(-1, 0, 1).normalize();
    /* 길 위의 점: 지표(맨 위) → 중심, 잘라 낸 쪽으로 off만큼 띄움 */
    const axisPoint = (km, offK = 0) => new THREE.Vector3(0, R * rVis(km), 0).addScaledVector(wedgeDir, R * offK);
    /* 단면 위 점: 깊이 km, 각도 a(라디안, 면 A에서 위쪽 축으로부터 바깥으로) */
    const facePoint = (km, a, face = 'A', lift = 0.01) => {
      const r = R * rVis(km); const p = new THREE.Vector3(-Math.sin(a) * r, Math.cos(a) * r, lift * R);
      return face === 'A' ? p : new THREE.Vector3(-lift * R, p.y, -p.x);
    };
    const update = (dt, t) => { uni.uTime.value = C3.REDUCE ? 0 : t; clouds.rotation.y += dt * 0.01; };
    return { group, shell, clouds, faces: [faceA, faceB], uni, axisPoint, facePoint, wedgeDir, R, update, CRUST_K, rVis };
  }

  /* 우주 배경 별 */
  function stars(n = 1400, rad = 60) {
    const g = new THREE.BufferGeometry(), P = new Float32Array(n * 3), C = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u), r = rad * (0.8 + Math.random() * 0.4);
      P.set([Math.cos(a) * s * r, u * r, Math.sin(a) * s * r], i * 3);
      const k = 0.55 + Math.random() * 0.45, b = Math.random() < 0.3; C.set(b ? [k * 0.8, k * 0.88, k] : [k, k, k * 0.95], i * 3);
    }
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }));
  }
  return { make, stars, rVis, CRUST_K };
})();
