/* ===== 3D 광물 표본 모형 =====
   실제 표본 사진의 생김새(결정 모양, 빛깔, 투명도, 표면 줄무늬, 변색)를 참고해 three.js로 만든 모형이에요. 사진이 아니에요.
   - 형태: 결정은 면을 하나하나 계산해 만들고(석영 육각기둥, 방해석 마름모 덩어리, 황철석 정육면체, 자철석 팔면체),
           덩어리는 울퉁불퉁한 공에 깨진 면(평평한 단면)을 깎아 만들어요.
   - 재질: 물리 기반 재질(투과·굴절, 금속, 무지갯빛 얇은 막) 위에 셰이더 잡음으로 얼룩·줄무늬·알갱이를 그려요.
   - 잡음 함수 snoise: Ashima Arts / Stefan Gustavson (MIT 라이선스)
   이 조각 앞에 THREE, mergeVertices, ConvexGeometry가 있어야 해요. */
const MIN3D = (() => {
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  /* ---------- 자바스크립트 잡음 (모양 만들기용) ---------- */
  function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function hash(i, j, k, s) { let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(k, 1442695041) ^ Math.imul(s + 7, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function vnoise(x, y, z, s) {
    const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), fx = x - X, fy = y - Y, fz = z - Z;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz), L = (a, b, t) => a + (b - a) * t;
    return L(L(L(hash(X, Y, Z, s), hash(X + 1, Y, Z, s), u), L(hash(X, Y + 1, Z, s), hash(X + 1, Y + 1, Z, s), u), v),
      L(L(hash(X, Y, Z + 1, s), hash(X + 1, Y, Z + 1, s), u), L(hash(X, Y + 1, Z + 1, s), hash(X + 1, Y + 1, Z + 1, s), u), v), w);
  }
  function fbm(x, y, z, s, oct = 4) { let a = 0.5, t = 0, n = 0; for (let i = 0; i < oct; i++) { t += a * vnoise(x, y, z, s + i * 31); n += a; x = x * 2.03 + 5.1; y = y * 2.03 + 1.7; z = z * 2.03 + 3.3; a *= 0.5; } return t / n; }

  /* ---------- 셰이더 잡음 (무늬 그리기용) ---------- */
  const GLSL = `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy; i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx; vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_); vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw); vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 nm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3))); p0*=nm.x;p1*=nm.y;p2*=nm.z;p3*=nm.w;
    vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
    return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
  float fbm3(vec3 p){float s=0.0,a=0.5;for(int i=0;i<5;i++){s+=a*snoise(p);p=p*2.02+vec3(13.1,7.7,3.3);a*=0.5;}return s*0.5+0.5;}
  float fbm2(vec3 p){float s=0.0,a=0.5;for(int i=0;i<3;i++){s+=a*snoise(p);p=p*2.02+vec3(13.1,7.7,3.3);a*=0.5;}return s*0.57+0.5;}
  vec3 hash33(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.xxy+p.yxx)*p.zyx);}
  vec3 cells(vec3 p){vec3 i=floor(p),f=fract(p);float d1=8.0,d2=8.0,id=0.0;
    for(int z=-1;z<=1;z++)for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec3 g=vec3(float(x),float(y),float(z));vec3 r=g+hash33(i+g)-f;float d=dot(r,r);
      if(d<d1){d2=d1;d1=d;id=hash33(i+g+17.0).x;}else if(d<d2){d2=d;}}
    return vec3(sqrt(d1),sqrt(d2)-sqrt(d1),id);}
  vec3 sr(vec3 c){return pow(c,vec3(2.2));}
  vec3 bumpN(vec3 n,float h){vec3 p=-vViewPosition;vec3 dpx=dFdx(p),dpy=dFdy(p);float dhx=dFdx(h),dhy=dFdy(h);
    vec3 r1=cross(dpy,n),r2=cross(n,dpx);float det=dot(dpx,r1);if(abs(det)<1e-12)return n;vec3 g=sign(det)*(dhx*r1+dhy*r2);return normalize(abs(det)*n-g);}
  `;

  /* 셰이더 고리: pre(main 처음, 공용 변수), color(diffuseColor), rough(roughnessFactor), metal(metalnessFactor),
     bump(높이 식), irid(material.iridescence), trans(material.transmission). vPo = 물체 좌표, vNo = 물체 법선 */
  let keyN = 0;
  function procMat(params, o = {}) {
    const m = new THREE.MeshPhysicalMaterial(params);
    const key = 'min' + (o.key || ++keyN);
    m.userData.u = { uSeed: { value: o.seed || 0 }, uBump: { value: o.bumpAmt == null ? 1 : o.bumpAmt }, uT: { value: 0 } };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, m.userData.u);
      sh.vertexShader = 'varying vec3 vPo;\nvarying vec3 vNo;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vPo = position; vNo = objectNormal;');
      let fs = sh.fragmentShader;
      fs = fs.replace('void main() {', 'varying vec3 vPo;\nvarying vec3 vNo;\nuniform float uSeed;\nuniform float uBump;\nuniform float uT;\n' + GLSL + '\nvoid main() {\n' + (o.pre || ''));
      if (o.color) fs = fs.replace('#include <color_fragment>', '#include <color_fragment>\n{' + o.color + '}');
      if (o.rough) fs = fs.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n{' + o.rough + '}');
      if (o.metal) fs = fs.replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n{' + o.metal + '}');
      if (o.bump) fs = fs.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = bumpN(normal, (' + o.bump + ') * uBump);');
      if (o.irid) fs = fs.replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n#ifdef USE_IRIDESCENCE\n{' + o.irid + '}\n#endif');
      if (o.trans) fs = fs.replace('#include <transmission_fragment>', THREE.ShaderChunk.transmission_fragment.replace('material.transmission = transmission;', 'material.transmission = transmission;\n{' + o.trans + '}'));
      sh.fragmentShader = fs;
    };
    m.customProgramCacheKey = () => key;
    return m;
  }

  /* ---------- 모양 ---------- */
  // 울퉁불퉁한 덩어리 + 깨진 면
  function lump(o = {}) {
    const R = rng(o.seed || 1), seed = o.seed || 1;
    let g = new THREE.IcosahedronGeometry(1, o.detail == null ? 5 : o.detail); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g);
    const pos = g.attributes.position, v = V(), u = V(), st = o.stretch || [1, 1, 1], amp = o.rough == null ? 0.2 : o.rough, fq = o.freq || 1.5;
    const cuts = [];
    for (let i = 0; i < (o.cuts || 0); i++) {
      let n = V(R() * 2 - 1, (R() * 2 - 1) * (o.cutY == null ? 1 : o.cutY), R() * 2 - 1); if (n.lengthSq() < 0.01) n = V(1, 0, 0); n.normalize();
      cuts.push({ n, d: (o.cutMin == null ? 0.62 : o.cutMin) + R() * (o.cutVar == null ? 0.25 : o.cutVar) });
    }
    for (let i = 0; i < pos.count; i++) {
      u.fromBufferAttribute(pos, i); v.copy(u);
      v.multiplyScalar(1 + amp * (fbm(u.x * fq + 11, u.y * fq, u.z * fq, seed, 4) - 0.5) * 2);
      v.set(v.x * st[0], v.y * st[1], v.z * st[2]);
      for (const c of cuts) { const k = v.dot(c.n); if (k > c.d) v.addScaledVector(c.n, -(k - c.d) + (o.ripple || 0.01) * (fbm(u.x * 7, u.y * 7, u.z * 7, seed + 9, 2) - 0.5)); }
      if (o.flat != null && v.y < -o.flat) v.y = -o.flat - 0.004 * vnoise(u.x * 20, u.z * 20, 0, seed);
      if (o.micro) v.addScaledVector(u, o.micro * (vnoise(u.x * 26, u.y * 26, u.z * 26, seed + 3) - 0.5));
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }
  // 면이 여러 개인 기둥 결정(석영·휘석·각섬석): 면마다 축에서 떨어진 거리가 조금씩 달라요
  function prism(o) {
    const R = rng(o.seed || 1), n = o.sides || 6, ds = [];
    for (let i = 0; i < n; i++) ds.push(o.r * (o.ds ? o.ds[i] : 1) * (1 - (o.jit == null ? 0.2 : o.jit) + R() * 2 * (o.jit == null ? 0.2 : o.jit)));
    const ring = [];
    for (let i = 0; i < n; i++) {
      const a1 = (i / n) * Math.PI * 2, a2 = ((i + 1) / n) * Math.PI * 2, d1 = ds[i], d2 = ds[(i + 1) % n], det = Math.sin(a2 - a1);
      ring.push([((d1 * Math.sin(a2) - d2 * Math.sin(a1)) / det) * (o.sx || 1), ((Math.cos(a1) * d2 - Math.cos(a2) * d1) / det)]);
    }
    const L = o.len, tip = o.tip, tp = o.taper || 1, ax = (R() - 0.5) * o.r * 0.35, az = (R() - 0.5) * o.r * 0.35;
    const P = [], push = (a, b, c, ref) => {
      const ab = b.clone().sub(a), ac = c.clone().sub(a), nn = ab.cross(ac), cen = a.clone().add(b).add(c).multiplyScalar(1 / 3);
      if (nn.dot(cen.sub(ref)) < 0) P.push(a, c, b); else P.push(a, b, c);
    };
    const B = ring.map(([x, z]) => V(x, 0, z)), T = ring.map(([x, z]) => V(x * tp, L, z * tp)), A = V(ax, L + tip, az);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, ref = V(0, L * 0.5, 0);
      push(B[i], B[j], T[j], ref); push(B[i], T[j], T[i], ref);
      if (o.flatTop) push(T[i], T[j], V(ax * 0.3, L + tip, az * 0.3), V(0, L, 0));
      else push(T[i], T[j], A, V(0, L, 0));
      push(B[j], B[i], V(0, 0, 0), V(0, 1, 0));
    }
    const g = new THREE.BufferGeometry(); g.setFromPoints(P); g.computeVertexNormals(); return g;
  }
  // 꼭짓점을 조금씩 깎은 볼록 다면체 (방해석 마름모 덩어리, 장석 덩어리)
  function chipped(verts, edges, o = {}) {
    const R = rng(o.seed || 1), pts = [];
    verts.forEach((p, i) => {
      const nb = edges.filter((e) => e[0] === i || e[1] === i).map((e) => verts[e[0] === i ? e[1] : e[0]]);
      nb.forEach((q) => pts.push(p.clone().lerp(q, (o.cmin || 0.03) + R() * (o.cvar || 0.12))));
    });
    const g = new ConvexGeometry(pts); return g;
  }
  function boxVerts(a, b, c) { // 평행육면체 꼭짓점 8개와 모서리 12개
    const vs = []; for (let i = 0; i < 8; i++) vs.push(V().addScaledVector(a, i & 1 ? 0.5 : -0.5).addScaledVector(b, i & 2 ? 0.5 : -0.5).addScaledVector(c, i & 4 ? 0.5 : -0.5));
    const es = []; for (let i = 0; i < 8; i++) for (const bit of [1, 2, 4]) if (!(i & bit)) es.push([i, i | bit]);
    return [vs, es];
  }
  const shadow = (m) => { m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = !(o.material && o.material.transmission > 0); } }); return m; };
  // 크기를 맞추고 바닥을 y=0에 놓아요
  function settle(grp, size) {
    const b = new THREE.Box3().setFromObject(grp), s = b.getSize(V()), k = size / Math.max(s.x, s.z, s.y * 0.9);
    grp.scale.multiplyScalar(k); const b2 = new THREE.Box3().setFromObject(grp), c = b2.getCenter(V());
    grp.position.x -= c.x; grp.position.z -= c.z; grp.position.y -= b2.min.y;
    const out = new THREE.Group(); out.add(grp); out.userData.h = b2.max.y - b2.min.y; out.userData.w = Math.max(b2.max.x - b2.min.x, b2.max.z - b2.min.z); return out;
  }


  /* 사진 촬영실 같은 반사 환경: 어두운 방에 밝은 조명판 몇 개. 금속·유리 광물의 광택이 살아나요 */
  function studioEnv(renderer, o = {}) {
    const sc = new THREE.Scene();
    // 위는 밝고 아래는 어두운 방 (금속 면마다 비치는 밝기가 달라져 광택이 살아나요)
    const rg = new THREE.SphereGeometry(14, 32, 16), rc = [], base = new THREE.Color(o.room || 0x8c8781);
    for (let i = 0; i < rg.attributes.position.count; i++) { const y = rg.attributes.position.getY(i) / 14, k = y > 0 ? 0.4 + y * 1.1 : 0.4 + y * 0.3; const c = base.clone().multiplyScalar(Math.max(0.12, k)); rc.push(c.r, c.g, c.b); }
    rg.setAttribute('color', new THREE.Float32BufferAttribute(rc, 3));
    const room = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })); room.position.y = 2; sc.add(room);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ color: o.floor || 0x8a7d6c })); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.9; sc.add(floor);
    const panel = (w, h, x, y, z, col, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); sc.add(m); };
    panel(8, 5, 0, 9, 2, '#ffffff', 7);      // 위 큰 조명
    panel(3, 6, -9, 3, 3, '#fff4e6', 4.5);  // 왼쪽 따뜻한 조명
    panel(2.5, 5, 9, 2.5, -2, '#eef4ff', 3.2); // 오른쪽 차가운 조명
    panel(6, 1.2, 0, 2, -9.5, '#ffffff', 2.2); // 뒤 띠 조명
    panel(4, 2, 2, 1, 9.5, '#ffffff', 1.4);   // 앞 약한 조명
    const pm = new THREE.PMREMGenerator(renderer); const t = pm.fromScene(sc, 0.02).texture; pm.dispose(); return t;
  }
  // 덩어리 표면 위의 점 찾기 (결정을 표면에 붙일 때)
  const _rc = new THREE.Raycaster();
  function surfaceY(mesh, x, z) { mesh.updateMatrixWorld(true); _rc.set(V(x, 10, z), V(0, -1, 0)); const h = _rc.intersectObject(mesh, false)[0]; return h ? h.point.y : null; }

  /* ---------- 공용 재질 ---------- */
  // 회색 모암(바탕 암석)
  const matrixMat = (seed, tone) => procMat({ color: 0xffffff, roughness: 0.9, metalness: 0 }, {
    key: 'matrix' + (tone || ''), seed,
    color: `float n=fbm3(vPo*3.0+uSeed); float k=fbm2(vPo*7.0); diffuseColor.rgb = mix(sr(vec3(${tone || '0.50,0.48,0.45'})), sr(vec3(${tone || '0.50,0.48,0.45'})*1.35), n) * (0.8+0.25*k);`,
    bump: 'fbm2(vPo*12.0)*0.004',
  });

  /* ---------- 광물 ---------- */
  const B = {};
  // 석영: 끝이 뾰족한 육각기둥 결정 무리. 밑동은 우윳빛으로 뿌옇고 끝으로 갈수록 맑아요. 기둥 면에 가로 줄무늬
  B.quartz = (seed = 3) => {
    const R = rng(seed), grp = new THREE.Group();
    const qm = procMat({ color: 0xffffff, metalness: 0, roughness: 0.035, transmission: 1, ior: 1.54, thickness: 0.8, attenuationColor: new THREE.Color('#e9e6df'), attenuationDistance: 1.6, specularIntensity: 1 }, {
      key: 'quartz', seed,
      pre: 'float milky = 1.0 - smoothstep(0.05, 0.75, vPo.y + 0.25*(fbm2(vPo*5.0+uSeed)-0.5));',
      color: 'diffuseColor.rgb = mix(vec3(1.0), sr(vec3(0.93,0.92,0.90)), milky);',
      rough: 'roughnessFactor = mix(roughnessFactor, 0.32, milky*0.8);',
      trans: 'material.transmission *= (1.0 - 0.72*milky);',
      bump: '(1.0-abs(vNo.y)) * (sin(vPo.y*150.0 + snoise(vPo*6.0)*4.0)*0.00025)',
    });
    const base = new THREE.Mesh(lump({ seed, detail: 4, rough: 0.25, freq: 1.4, stretch: [0.62, 0.22, 0.52], cuts: 5, flat: 0.15, micro: 0.01 }), matrixMat(seed, '0.55,0.53,0.50'));
    grp.add(base);
    const N = 9;
    for (let i = 0; i < N; i++) {
      const big = i === 0, r = big ? 0.17 : 0.07 + R() * 0.08, len = big ? 0.95 : 0.35 + R() * 0.5;
      const m = new THREE.Mesh(prism({ seed: seed * 10 + i, r, len, tip: r * 1.7, taper: 0.96, jit: 0.22 }), qm);
      const a = R() * Math.PI * 2, tilt = big ? 0.08 : 0.18 + R() * 0.4, rr = big ? 0.02 : 0.08 + R() * 0.22;
      m.position.set(Math.cos(a) * rr, 0.0, Math.sin(a) * rr * 0.85);
      m.rotation.set(Math.sin(a) * tilt, R() * 6.28, -Math.cos(a) * tilt, 'XZY');
      m.rotateY(R() * 6.28);
      grp.add(m);
    }
    return settle(shadow(grp), 1);
  };
  // 석영 한 덩어리(굳기 실험에서 손에 쥐는 결정)
  B.quartzPiece = (seed = 5) => {
    const grp = new THREE.Group();
    const qm = procMat({ color: 0xffffff, roughness: 0.04, transmission: 1, ior: 1.54, thickness: 0.4, attenuationColor: new THREE.Color('#efece6'), attenuationDistance: 2.4 }, {
      key: 'quartzP', seed,
      pre: 'float milky = 1.0 - smoothstep(0.0, 0.7, vPo.y + 0.25*(fbm2(vPo*5.0+uSeed)-0.5));',
      color: 'diffuseColor.rgb = mix(vec3(1.0), sr(vec3(0.94,0.93,0.91)), milky);',
      rough: 'roughnessFactor = mix(roughnessFactor, 0.3, milky*0.8);',
      trans: 'material.transmission *= (1.0 - 0.6*milky);',
      bump: '(1.0-abs(vNo.y)) * sin(vPo.y*150.0 + snoise(vPo*6.0)*4.0)*0.00025',
    });
    const m = new THREE.Mesh(prism({ seed, r: 0.26, len: 0.85, tip: 0.42, taper: 0.97, jit: 0.15 }), qm);
    m.rotation.z = Math.PI / 2; grp.add(m);
    return settle(shadow(grp), 1);
  };
  // 방해석: 비스듬한 마름모꼴 덩어리(쪼개진 조각). 무색투명하고 안쪽에 갈라진 면이 무지갯빛으로 비쳐요
  B.calcite = (seed = 7) => {
    const R = rng(seed), grp = new THREE.Group();
    const al = 66.4 * Math.PI / 180, E = [0, 1, 2].map((k) => V(Math.sin(al) * Math.cos(k * 2.094), Math.cos(al), Math.sin(al) * Math.sin(k * 2.094)).multiplyScalar(k === 0 ? 1.25 : 1));
    const [vs, es] = boxVerts(E[0], E[1], E[2]);
    const cm = procMat({ color: 0xffffff, roughness: 0.05, transmission: 1, ior: 1.6, thickness: 1.6, attenuationColor: new THREE.Color('#f3e4c4'), attenuationDistance: 1.1, specularIntensity: 1 }, {
      key: 'calcite', seed,
    });
    const body = new THREE.Mesh(chipped(vs, es, { seed, cmin: 0.03, cvar: 0.1 }), cm);
    grp.add(body);
    grp.rotation.set(0.15, R() * 6.28, 0.1);
    return settle(shadow(grp), 1);
  };
  // 황철석: 금속 광택이 나는 연한 놋쇠색 정육면체 결정. 면마다 줄무늬 방향이 엇갈려요
  B.pyrite = (seed = 11) => {
    const R = rng(seed), grp = new THREE.Group();
    const pm = procMat({ color: 0xffffff, metalness: 1, roughness: 0.1 }, {
      key: 'pyrite', seed,
      pre: `vec3 an = abs(vNo); float st = an.x > 0.5 ? vPo.z : (an.y > 0.5 ? vPo.x : vPo.y); float tn = smoothstep(0.62, 0.85, fbm2(vPo*3.0+uSeed));`,
      color: 'diffuseColor.rgb = mix(sr(vec3(0.99,0.91,0.64)), sr(vec3(0.80,0.66,0.40)), tn*0.5) * (0.94+0.08*fbm2(vPo*8.0));',
      rough: 'roughnessFactor = 0.05 + 0.18*tn + 0.05*fbm2(vPo*9.0);',
      bump: 'sin(st*90.0 + snoise(vPo*5.0)*2.0)*0.0006 + snoise(vPo*3.0)*0.002',
    });
    const cubes = [[0.62, 0, 0, 0, 0], [0.42, 0.34, -0.06, 0.22, 0.5], [0.34, -0.32, -0.1, -0.18, 0.25], [0.22, 0.05, 0.28, -0.28, 0.9]];
    cubes.forEach(([s, x, y, z, rot]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), pm); m.position.set(x, y + s / 2, z); m.rotation.set((R() - 0.5) * 0.3, rot, (R() - 0.5) * 0.3); grp.add(m);
    });
    const base = new THREE.Mesh(lump({ seed, detail: 4, rough: 0.3, stretch: [0.9, 0.3, 0.75], cuts: 4, flat: 0.22, micro: 0.02 }), matrixMat(seed, '0.36,0.35,0.33'));
    base.position.y = -0.05; grp.add(base);
    return settle(shadow(grp), 1);
  };
  // 황동석: 진한 놋쇠색 금속 덩어리. 겉이 변해 파랑·보라 무지갯빛을 띠는 곳과 어두운 바탕 암석이 섞여 있어요
  B.chalcopyrite = (seed = 13) => {
    const m = procMat({ color: 0xffffff, metalness: 1, roughness: 0.3 }, {
      key: 'chalco', seed,
      pre: `float ore = smoothstep(0.30, 0.36, fbm3(vPo*1.6+uSeed)); float tar = smoothstep(0.5, 0.68, fbm3(vPo*2.0+uSeed+7.0)) * ore; float hue = fbm2(vPo*2.6+uSeed+2.0); float gr = fbm2(vPo*7.0);`,
      color: 'vec3 brass = sr(vec3(0.80,0.63,0.25)); vec3 gang = mix(sr(vec3(0.12,0.11,0.10)), sr(vec3(0.26,0.23,0.20)), gr); diffuseColor.rgb = mix(gang, brass*(0.85+0.2*gr), ore); vec3 tc = mix(mix(sr(vec3(0.20,0.30,0.75)), sr(vec3(0.50,0.25,0.62)), smoothstep(0.35,0.6,hue)), sr(vec3(0.75,0.45,0.30)), smoothstep(0.62,0.8,hue)); diffuseColor.rgb = mix(diffuseColor.rgb, tc, tar*0.85);',
      metal: 'metalnessFactor = ore;',
      rough: 'roughnessFactor = mix(0.85, 0.24 + 0.15*gr, ore);',
      bump: 'fbm2(vPo*9.0)*0.004',
    });
    const g = new THREE.Mesh(lump({ seed, rough: 0.24, freq: 1.3, stretch: [1.25, 0.72, 1], cuts: 9, cutMin: 0.5, cutVar: 0.35, flat: 0.5, micro: 0.008, ripple: 0.02 }), m);
    const grp = new THREE.Group(); grp.add(g); return settle(shadow(grp), 1);
  };
  // 자철석: 검은 쇳빛 덩어리 위에 작은 팔면체 결정이 붙어 있어요
  B.magnetite = (seed = 17) => {
    const R = rng(seed), grp = new THREE.Group();
    const mm = procMat({ color: 0xffffff, metalness: 0.55, roughness: 0.5 }, {
      key: 'magnetite', seed,
      pre: 'float k = fbm2(vPo*5.0+uSeed); float rust = smoothstep(0.72, 0.85, fbm3(vPo*2.5+uSeed+3.0));',
      color: 'diffuseColor.rgb = mix(sr(vec3(0.15,0.15,0.16)), sr(vec3(0.27,0.27,0.29)), k); diffuseColor.rgb = mix(diffuseColor.rgb, sr(vec3(0.35,0.22,0.14)), rust*0.6);',
      rough: 'roughnessFactor = 0.42 + 0.25*k + rust*0.3;',
      metal: 'metalnessFactor = 0.6 * (1.0 - rust);',
      bump: 'fbm2(vPo*10.0)*0.004',
    });
    const body = new THREE.Mesh(lump({ seed, rough: 0.2, freq: 1.4, stretch: [1.2, 0.6, 0.95], cuts: 12, cutMin: 0.48, cutVar: 0.3, flat: 0.4, micro: 0.02, ripple: 0.02 }), mm);
    grp.add(body);
    const om = procMat({ color: 0xffffff, metalness: 0.85, roughness: 0.22 }, {
      key: 'magOct', seed,
      color: 'diffuseColor.rgb = sr(vec3(0.30,0.30,0.32)) * (0.85+0.3*fbm2(vPo*6.0));',
    });
    for (let i = 0; i < 9; i++) {
      const s = 0.1 + R() * 0.12, o = new THREE.Mesh(new THREE.OctahedronGeometry(s), om), a = R() * 6.28, r = R() * 0.6;
      const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.65, y = surfaceY(body, x, z); if (y == null) continue;
      o.position.set(x, y + s * 0.15, z); o.rotation.set(R() * 6, R() * 6, R() * 6); o.scale.y = 0.95 + R() * 0.15; grp.add(o);
    }
    return settle(shadow(grp), 1);
  };
  // 흑운모: 아주 얇은 판이 책장처럼 겹겹이 쌓인 검은 덩어리. 판 윗면은 반들반들하고 가장자리는 들떠 있어요
  B.biotite = (seed = 19) => {
    const R = rng(seed), grp = new THREE.Group();
    const top = procMat({ color: 0xffffff, metalness: 0, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.25, sheenColor: new THREE.Color('#5a4128'), sheenRoughness: 0.35 }, {
      key: 'bioTop', seed,
      color: 'float k=fbm2(vPo*5.0+uSeed); diffuseColor.rgb = mix(sr(vec3(0.06,0.05,0.04)), sr(vec3(0.16,0.12,0.08)), k*k);',
      bump: 'fbm2(vPo*vec3(3.0,1.0,3.0))*0.0008',
    });
    const side = procMat({ color: 0xffffff, metalness: 0, roughness: 0.6 }, {
      key: 'bioSide', seed,
      color: 'float l = sin(vPo.y*500.0 + snoise(vPo*8.0)*3.0)*0.5+0.5; diffuseColor.rgb = mix(sr(vec3(0.06,0.05,0.04)), sr(vec3(0.22,0.17,0.11)), l*0.5);',
    });
    const outline = (sc, sd) => {
      const r2 = rng(sd), sh = new THREE.Shape(), N = 54;
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2, hex = 1 / Math.cos(((a + 0.3) % (Math.PI / 3)) - Math.PI / 6) * 0.92;
        const rr = sc * (0.82 * hex + 0.18) * (1 + (fbm(Math.cos(a) * 2, Math.sin(a) * 2, sd, 4, 3) - 0.5) * 0.5) * (1 - (r2() < 0.12 ? r2() * 0.18 : 0));
        const x = Math.cos(a) * rr * 1.25, y = Math.sin(a) * rr; if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y);
      }
      return sh;
    };
    let y = 0; const L = 16;
    for (let i = 0; i < L; i++) {
      const th = 0.022 + R() * 0.02, sc = 0.48 * (0.86 + R() * 0.16) * (1 - Math.abs(i - L * 0.45) / L * 0.25);
      const g = new THREE.ExtrudeGeometry(outline(sc, seed * 7 + i), { depth: th, bevelEnabled: false, curveSegments: 1 });
      g.rotateX(-Math.PI / 2);
      // 위쪽 몇 장은 가장자리가 살짝 들떠요
      if (i >= L - 3) { const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const x = p.getX(k); if (x > 0.15) p.setY(k, p.getY(k) + Math.pow(x - 0.15, 2) * (0.5 + (i - L + 3) * 0.35)); } g.computeVertexNormals(); }
      const m = new THREE.Mesh(g, [top, side]); m.position.set((R() - 0.5) * 0.05, y, (R() - 0.5) * 0.05); m.rotation.y = (R() - 0.5) * 0.18; grp.add(m);
      y += th + 0.002;
    }
    grp.rotation.set(0.12, 0, -0.08);
    return settle(shadow(grp), 1);
  };
  // 금: 둥글둥글한 노란 금속 덩어리(자연금)
  B.gold = (seed = 23) => {
    const m = procMat({ color: 0xffffff, metalness: 1, roughness: 0.28 }, {
      key: 'gold', seed,
      pre: 'float cav = fbm3(vPo*4.0+uSeed);',
      color: 'diffuseColor.rgb = sr(vec3(0.98,0.76,0.33)) * (0.7 + 0.4*smoothstep(0.3,0.7,cav));',
      rough: 'roughnessFactor = 0.18 + 0.3*(1.0-cav);',
      bump: 'fbm2(vPo*5.0)*0.0015',
    });
    const grp = new THREE.Group(); grp.add(new THREE.Mesh(lump({ seed, rough: 0.34, freq: 1.8, stretch: [1.3, 0.6, 0.95], flat: 0.45, micro: 0.02 }), m));
    return settle(shadow(grp), 0.8);
  };
  // 장석: 불투명한 연분홍·크림색 덩어리 결정 (쪼개진 면이 직각에 가까워요)
  B.feldspar = (seed = 29) => {
    const R = rng(seed), grp = new THREE.Group();
    const fm = procMat({ color: 0xffffff, roughness: 0.55, metalness: 0, sheen: 0.3, sheenColor: new THREE.Color('#fff4ea') }, {
      key: 'feld', seed,
      color: 'float k=fbm3(vPo*3.0+uSeed); float s=fbm2(vPo*7.0); diffuseColor.rgb = mix(sr(vec3(0.78,0.52,0.42)), sr(vec3(0.90,0.72,0.60)), k) * (0.85+0.15*s);',
      rough: 'roughnessFactor = 0.4 + 0.3*fbm2(vPo*9.0);',
      bump: 'fbm2(vPo*10.0)*0.003',
    });
    for (let i = 0; i < 6; i++) {
      const s = 0.3 + R() * 0.25, [vs, es] = boxVerts(V(s * 1.3, 0, 0), V(0, s * 0.9, 0), V(0.1 * s, 0, s));
      const m = new THREE.Mesh(chipped(vs, es, { seed: seed + i, cmin: 0.04, cvar: 0.18 }), fm), a = R() * 6.28, r = i ? 0.25 + R() * 0.3 : 0;
      m.position.set(Math.cos(a) * r, s * 0.4 + (i ? R() * 0.1 : 0.05), Math.sin(a) * r * 0.8); m.rotation.set((R() - 0.5) * 0.7, R() * 6.28, (R() - 0.5) * 0.7); grp.add(m);
    }
    return settle(shadow(grp), 1);
  };
  // 감람석: 맑은 연두색 알갱이
  B.olivine = (seed = 31) => {
    const R = rng(seed), grp = new THREE.Group();
    const om = procMat({ color: new THREE.Color('#dcf29a'), roughness: 0.04, transmission: 1, ior: 1.66, thickness: 0.5, attenuationColor: new THREE.Color('#6fae2a'), attenuationDistance: 0.6, specularIntensity: 1 }, {
      key: 'oliv', seed,
      bump: 'fbm2(vPo*4.0)*0.001',
    });
    const big = new THREE.Mesh(lump({ seed, detail: 4, rough: 0.08, freq: 1.2, stretch: [0.8, 0.95, 0.65], cuts: 14, cutMin: 0.5, cutVar: 0.2, ripple: 0.002 }), om);
    big.scale.setScalar(0.62); big.position.y = 0.55; grp.add(big);
    for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(lump({ seed: seed + i + 1, detail: 3, rough: 0.08, cuts: 10, cutMin: 0.5, ripple: 0.002 }), om); const k = 0.22 + R() * 0.12; s.scale.setScalar(k); s.position.set((i - 1) * 0.55 + (R() - 0.5) * 0.15, k * 0.8, 0.45 + (R() - 0.5) * 0.2); grp.add(s); }
    return settle(shadow(grp), 1);
  };
  // 휘석: 짧고 뭉툭한 팔각기둥, 거의 검은 진녹색
  B.pyroxene = (seed = 37) => {
    const R = rng(seed), grp = new THREE.Group();
    const pm = procMat({ color: 0xffffff, roughness: 0.28, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.3 }, {
      key: 'pyrox', seed,
      color: 'float k=fbm2(vPo*6.0+uSeed); diffuseColor.rgb = mix(sr(vec3(0.07,0.08,0.06)), sr(vec3(0.20,0.21,0.15)), k);',
      rough: 'roughnessFactor = 0.25 + 0.3*fbm2(vPo*6.0);',
      bump: 'fbm2(vPo*8.0)*0.002',
    });
    [[0.3, 0.7, 0, 0], [0.22, 0.5, 0.42, 0.9]].forEach(([r, len, x, rot], i) => {
      const m = new THREE.Mesh(prism({ seed: seed + i, sides: 8, ds: [1, 0.8, 1, 0.8, 1, 0.8, 1, 0.8], r, len, tip: r * 0.35, jit: 0.08 }), pm);
      m.rotation.set(Math.PI / 2 - 0.25, rot, 0.2); m.position.set(x, r, (i - 0.5) * 0.3); grp.add(m);
    });
    return settle(shadow(grp), 1);
  };
  // 각섬석: 길쭉한 칼날 모양 기둥이 모인 짙은 녹흑색 덩어리
  B.amphibole = (seed = 41) => {
    const R = rng(seed), grp = new THREE.Group();
    const am = procMat({ color: 0xffffff, roughness: 0.35, metalness: 0, sheen: 0.35, sheenColor: new THREE.Color('#55634a') }, {
      key: 'amph', seed,
      color: 'float k=fbm2(vPo*vec3(4.0,0.6,4.0)+uSeed); diffuseColor.rgb = mix(sr(vec3(0.05,0.06,0.045)), sr(vec3(0.17,0.19,0.14)), k);',
      bump: '(1.0-abs(vNo.y))*snoise(vPo*vec3(30.0,1.5,30.0))*0.0005',
    });
    for (let i = 0; i < 14; i++) {
      const r = 0.05 + R() * 0.06, len = 0.7 + R() * 0.6;
      const m = new THREE.Mesh(prism({ seed: seed + i, sides: 6, r, len, tip: r * 0.6, sx: 2.1, jit: 0.15, flatTop: R() < 0.5 }), am);
      const k = i / 13 - 0.5;
      m.rotation.set(Math.PI / 2, k * 0.5 + (R() - 0.5) * 0.15, (R() - 0.5) * 0.6, 'YXZ'); m.position.set(k * 0.62 + (R() - 0.5) * 0.05, 0.06 + R() * 0.16 + (0.5 - Math.abs(k)) * 0.18, -len * 0.5 + (R() - 0.5) * 0.25); grp.add(m);
    }
    return settle(shadow(grp), 1);
  };
  // 화강암: 분홍빛 장석, 회색 석영, 검은 흑운모 알갱이가 섞인 암석
  B.granite = (seed = 43) => {
    const gm = procMat({ color: 0xffffff, roughness: 0.6, metalness: 0, clearcoat: 0.0 }, {
      key: 'granite', seed,
      pre: `vec3 wp = vPo*16.0 + uSeed + vec3(snoise(vPo*4.0), snoise(vPo*4.0+9.0), snoise(vPo*4.0+19.0))*0.7; vec3 C = cells(wp); float id = C.z; float bio = step(0.88, id); float qz = step(0.58, id)*(1.0-step(0.88, id)); float fd = 1.0 - bio - qz; float sp = fbm2(vPo*18.0);`,
      color: `vec3 fcol = mix(sr(vec3(0.84,0.56,0.48)), sr(vec3(0.93,0.82,0.75)), smoothstep(0.2,0.8,hash33(vec3(id*91.0)).x)) * (0.88+0.18*sp);
              vec3 qcol = sr(vec3(0.62,0.62,0.64)) * (0.8+0.3*fbm2(vPo*12.0));
              vec3 bcol = sr(vec3(0.06,0.05,0.045)) * (0.8+0.6*sp);
              diffuseColor.rgb = fcol*fd + qcol*qz + bcol*bio; diffuseColor.rgb *= 0.93 + 0.07*smoothstep(0.0,0.08,C.y);`,
      rough: 'roughnessFactor = 0.62*fd + 0.18*qz + 0.25*bio;',
      bump: 'smoothstep(0.0,0.08,C.y)*0.0006',
    });
    const grp = new THREE.Group(); grp.add(new THREE.Mesh(lump({ seed, rough: 0.22, freq: 1.1, stretch: [1.3, 0.75, 1.0], cuts: 6, cutMin: 0.62, cutVar: 0.25, flat: 0.55, ripple: 0.02, micro: 0.012 }), gm));
    return settle(shadow(grp), 1.2);
  };

  /* 탐구 표 기준 성질 (교과서) */
  const INFO = {
    quartz: { name: '석영', color: '무색투명', tone: '밝은색', streak: '나타나지 않음', sHex: null, magnet: false, acid: false },
    calcite: { name: '방해석', color: '무색투명', tone: '밝은색', streak: '흰색', sHex: '#f3f1ec', magnet: false, acid: true },
    pyrite: { name: '황철석', color: '노란색', tone: '노란색', streak: '검은색', sHex: '#23221f', magnet: false, acid: false },
    chalcopyrite: { name: '황동석', color: '노란색', tone: '노란색', streak: '녹흑색', sHex: '#2c3a24', magnet: false, acid: false },
    magnetite: { name: '자철석', color: '검은색', tone: '어두운색', streak: '검은색', sHex: '#1c1c1d', magnet: true, acid: false },
    biotite: { name: '흑운모', color: '검은색', tone: '어두운색', streak: '흰색', sHex: '#eeede8', magnet: false, acid: false },
    gold: { name: '금', color: '노란색', tone: '노란색', streak: '노란색', sHex: '#d6a52a', magnet: false, acid: false },
    feldspar: { name: '장석', tone: '밝은색' }, granite: { name: '화강암' }, olivine: { name: '감람석', tone: '어두운색' }, pyroxene: { name: '휘석', tone: '어두운색' }, amphibole: { name: '각섬석', tone: '어두운색' },
  };
  const cache = {};
  function make(id, seed) { const f = B[id]; if (!f) throw new Error('광물 모형 없음: ' + id); return f(seed); }

  return { make, INFO, studioEnv, surfaceY, procMat, lump, prism, chipped, boxVerts, settle, rng, fbm, vnoise, matrixMat, shadow, GLSL, cache };
})();
