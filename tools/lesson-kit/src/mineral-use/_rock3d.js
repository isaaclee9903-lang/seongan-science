/* ===== 3D 암석 표본 모형 =====
   교과서 사진과 실제 표본의 생김새(색, 알갱이 크기, 구멍, 둥근 자갈, 층리, 줄무늬)를 참고해 three.js로 만든 모형이에요. 사진이 아니에요.
   - 형태: 울퉁불퉁한 덩어리에 깨진 면을 깎아 만들어요(_min3d.js의 lump). 편암은 얇은 판을 겹쳐 만들어요.
   - 무늬: 셰이더 잡음과 세포 무늬(cells)로 알갱이·자갈·줄무늬를 그려요. 물체 좌표로 그리므로 가까이 가도 무늬가 깨지지 않아요(돋보기).
   이 조각 앞에 THREE, MIN3D(_min3d.js)가 있어야 해요. */
const ROCK3D = (() => {
  const { procMat, lump, settle, rng, surfaceY, shadow } = MIN3D;
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const one = (geo, mat, size = 1) => { const g = new THREE.Group(); g.add(new THREE.Mesh(geo, mat)); return settle(shadow(g), size); };
  const body = (seed, o = {}) => lump(Object.assign({ seed, rough: 0.2, freq: 1.25, stretch: [1.25, 0.72, 1], cuts: 8, cutMin: 0.5, cutVar: 0.32, flat: 0.5, ripple: 0.02, micro: 0.008 }, o));
  const M = (key, seed, o, p = {}) => procMat(Object.assign({ color: 0xffffff, roughness: 0.85, metalness: 0 }, p), Object.assign({ key, seed }, o));

  const B = {};
  /* ---------- 화성암 ---------- */
  // 현무암: 검은 회색, 알갱이가 너무 작아 보이지 않아요. 크고 작은 구멍이 흩어져 있어요(교과서 사진)
  B.basalt = (seed = 101) => one(body(seed, { cuts: 9, rough: 0.24 }), M('basalt', seed, {
    pre: `vec3 C1 = cells(vPo*6.5+uSeed); float r1 = 0.10+0.24*hash33(vec3(C1.z*57.0)).x; float h1 = step(0.42,C1.z)*smoothstep(r1, r1-0.07, C1.x);
          vec3 C2 = cells(vPo*15.0+uSeed+3.0); float r2 = 0.10+0.20*hash33(vec3(C2.z*31.0)).y; float h2 = step(0.48,C2.z)*smoothstep(r2, r2-0.06, C2.x);
          float hole = max(h1,h2); float deep = max(h1*smoothstep(r1-0.03, 0.0, C1.x), h2*smoothstep(r2-0.03, 0.0, C2.x));
          float gr = fbm2(vPo*80.0); float mot = fbm3(vPo*2.6+uSeed); float sp = step(0.86, hash33(floor(vPo*150.0)).x);`,
    color: `vec3 base = mix(sr(vec3(0.115,0.115,0.12)), sr(vec3(0.25,0.24,0.235)), clamp(mot*0.85+gr*0.35-0.1,0.0,1.0)); base *= 0.9+0.25*sp;
            diffuseColor.rgb = mix(base, base*0.32, hole) * (1.0-0.5*deep);`,
    rough: 'roughnessFactor = 0.8 + 0.15*hole;',
    bump: '-hole*0.011 - deep*0.006 + gr*0.0012',
  }));
  // 유문암: 밝은 회색·연분홍, 알갱이가 매우 작아요. 흐른 자국처럼 희미한 줄이 있어요
  B.rhyolite = (seed = 103) => one(body(seed, { cuts: 10, rough: 0.16, stretch: [1.3, 0.68, 0.95] }), M('rhyolite', seed, {
    pre: `float band = sin(vPo.y*20.0 + snoise(vPo*vec3(1.4,0.6,1.4)+uSeed)*5.0)*0.5+0.5; float gr = fbm2(vPo*70.0); float mot = fbm3(vPo*2.4+uSeed); float sp = step(0.94, hash33(floor(vPo*110.0+uSeed)).x);`,
    color: `vec3 a = sr(vec3(0.76,0.73,0.70)), b = sr(vec3(0.62,0.57,0.56)); diffuseColor.rgb = mix(a, b, clamp(band*0.45+mot*0.6-0.05,0.0,1.0)) * (0.94+0.1*gr); diffuseColor.rgb = mix(diffuseColor.rgb, sr(vec3(0.28,0.25,0.23)), sp*0.55);`,
    rough: 'roughnessFactor = 0.78;',
    bump: 'gr*0.0014 + band*0.0006',
  }));
  // 반려암: 어두운 광물 알갱이(검은 녹색)와 회백색 알갱이가 눈에 보일 만큼 커요. 전체가 어두워요
  B.gabbro = (seed = 105) => one(body(seed, { cuts: 7, rough: 0.22 }), M('gabbro', seed, {
    pre: `vec3 wp = vPo*19.0 + uSeed + vec3(snoise(vPo*4.0), snoise(vPo*4.0+9.0), snoise(vPo*4.0+19.0))*0.25; vec3 C = cells(wp); float id = C.z; float pl = step(0.55, id); float sp = fbm2(vPo*32.0); float edge = smoothstep(0.0,0.07,C.y);`,
    color: `vec3 dk = mix(sr(vec3(0.04,0.045,0.04)), sr(vec3(0.13,0.14,0.12)), hash33(vec3(id*71.0)).x) * (0.8+0.4*sp);
            vec3 lt = mix(sr(vec3(0.27,0.29,0.29)), sr(vec3(0.42,0.43,0.42)), hash33(vec3(id*13.0)).y) * (0.9+0.15*sp);
            diffuseColor.rgb = mix(dk, lt, pl) * (0.88+0.12*edge);`,
    rough: 'roughnessFactor = mix(0.32, 0.62, pl);',
    bump: 'sp*0.0006',
  }, { roughness: 0.5 }));
  // 화강암: 흰색·연분홍 장석, 회색 석영, 검은 알갱이가 섞여 있어요. 알갱이가 눈에 보일 만큼 크고 전체가 밝아요
  const graniteMat = (seed, pink) => M(pink ? 'graniteP' : 'graniteW', seed, {
    pre: `vec3 wp = vPo*20.0 + uSeed + vec3(snoise(vPo*4.0), snoise(vPo*4.0+9.0), snoise(vPo*4.0+19.0))*0.25; vec3 C = cells(wp); float id = C.z; float bio = step(0.925, id); float qz = step(0.64, id)*(1.0-bio); float fd = 1.0-bio-qz; float sp = fbm2(vPo*20.0); float edge = smoothstep(0.0,0.08,C.y); vec3 h = hash33(vec3(id*91.0));`,
    color: `vec3 fcol = mix(sr(vec3(0.88,0.86,0.82)), sr(vec3(${pink ? '0.88,0.62,0.55' : '0.90,0.80,0.74'})), smoothstep(${pink ? '0.25,0.6' : '0.62,0.9'}, h.x)) * (0.9+0.14*sp);
            vec3 qcol = sr(vec3(0.64,0.65,0.66)) * (0.82+0.3*fbm2(vPo*14.0));
            vec3 bcol = sr(vec3(0.10,0.09,0.08)) * (0.8+0.6*sp);
            diffuseColor.rgb = (fcol*fd + qcol*qz + bcol*bio) * (0.92+0.08*edge);`,
    rough: 'roughnessFactor = 0.62*fd + 0.18*qz + 0.28*bio;',
    bump: 'fbm2(vPo*40.0)*0.0006',
  }, { roughness: 0.6 });
  B.granite = (seed = 107) => one(body(seed, { cuts: 7 }), graniteMat(seed, false));
  B.graniteP = (seed = 108) => one(body(seed, { cuts: 6, stretch: [1.2, 0.8, 1] }), graniteMat(seed, true));

  /* ---------- 퇴적암 ---------- */
  // 역암: 모래와 진흙 바탕에 모서리가 깎여 둥근 자갈이 크기도 색도 여러 가지로 박혀 있어요
  const pebbleMat = (seed, col) => M('pebble' + col, seed, {
    color: `float k = fbm3(vPo*3.0+uSeed); diffuseColor.rgb = sr(vec3(${col})) * (0.82+0.3*k) * (0.95+0.08*fbm2(vPo*30.0));`,
    rough: 'roughnessFactor = 0.55 + 0.25*fbm2(vPo*8.0);',
    bump: 'fbm2(vPo*20.0)*0.001',
  }, { roughness: 0.6 });
  const PEB = ['0.84,0.82,0.78', '0.42,0.42,0.45', '0.64,0.45,0.36', '0.26,0.25,0.25', '0.76,0.67,0.53', '0.55,0.56,0.52'];
  const pebbleGeo = (seed, s = [1, 0.7, 0.85]) => lump({ seed, detail: 3, rough: 0.12, freq: 0.9, stretch: s, micro: 0.004 });
  B.conglomerate = (seed = 111) => {
    const R = rng(seed), grp = new THREE.Group();
    const m = M('conglom', seed, {
      pre: `vec3 Cb = cells(vPo*vec3(3.0,4.0,3.0)+uSeed); float rb = 0.20+0.22*hash33(vec3(Cb.z*17.0)).x; float pb = step(0.22,Cb.z)*smoothstep(rb+0.015, rb-0.035, Cb.x); float hb = sqrt(max(0.0,1.0-pow(Cb.x/max(rb,0.01),2.0)));
            vec3 Cs = cells(vPo*vec3(7.5,9.5,7.5)+uSeed+5.0); float rs = 0.16+0.22*hash33(vec3(Cs.z*23.0)).y; float ps = (1.0-pb)*step(0.3,Cs.z)*smoothstep(rs+0.015, rs-0.035, Cs.x); float hs = sqrt(max(0.0,1.0-pow(Cs.x/max(rs,0.01),2.0)));
            vec3 Ct = cells(vPo*vec3(18.0,22.0,18.0)+uSeed+9.0); float rt = 0.18+0.2*hash33(vec3(Ct.z*7.0)).z; float pt = (1.0-pb)*(1.0-ps)*step(0.45,Ct.z)*smoothstep(rt+0.02, rt-0.04, Ct.x);
            float pid = pb > 0.5 ? Cb.z : (ps > 0.5 ? Cs.z : Ct.z); float peb = max(max(pb,ps),pt); float gr = fbm2(vPo*55.0); vec3 ph = hash33(vec3(pid*91.0));`,
      color: `vec3 pc = ph.x < 0.28 ? sr(vec3(0.84,0.82,0.78)) : ph.x < 0.52 ? sr(vec3(0.42,0.42,0.45)) : ph.x < 0.72 ? sr(vec3(0.64,0.45,0.36)) : ph.x < 0.88 ? sr(vec3(0.24,0.23,0.23)) : sr(vec3(0.76,0.67,0.53));
              pc *= 0.82 + 0.3*fbm2(vPo*10.0 + pid*13.0);
              vec3 mx = mix(sr(vec3(0.60,0.50,0.40)), sr(vec3(0.72,0.62,0.50)), fbm3(vPo*4.0)) * (0.82+0.28*gr);
              float shade = pb > 0.5 ? hb : (ps > 0.5 ? hs : 1.0);
              diffuseColor.rgb = mix(mx, pc * (0.72+0.28*shade), peb);`,
      rough: 'roughnessFactor = mix(0.92, 0.5, peb);',
      bump: 'pb*hb*0.018 + ps*hs*0.009 + pt*0.002 + gr*0.0016',
    });
    const b = new THREE.Mesh(body(seed, { cuts: 6, rough: 0.26, stretch: [1.3, 0.75, 1.0] }), m); grp.add(b);
    // 겉으로 튀어나온 자갈 몇 개 (진짜 입체)
    for (let i = 0; i < 9; i++) {
      const a = R() * 6.28, r = 0.15 + R() * 0.75, x = Math.cos(a) * r, z = Math.sin(a) * r * 0.7, y = surfaceY(b, x, z); if (y == null) continue;
      const s = 0.08 + R() * 0.14, p = new THREE.Mesh(pebbleGeo(seed + i * 7, [1, 0.62 + R() * 0.2, 0.75 + R() * 0.2]), pebbleMat(seed + i, PEB[i % PEB.length]));
      p.scale.setScalar(s); p.position.set(x, y - s * 0.35, z); p.rotation.set(R() * 0.6, R() * 6.28, R() * 0.6); grp.add(p);
    }
    return settle(shadow(grp), 1);
  };
  // 사암: 모래 알갱이가 다져져 굳은 암석. 멀리서는 고운 얼룩, 가까이서는 둥근 모래 알갱이가 보여요. 희미한 층이 있어요
  const sandMat = (seed, key, pal) => M(key, seed, {
    pre: `vec3 C = cells(vPo*46.0+uSeed); float gid = C.z; float rr = 0.58+0.14*hash33(vec3(gid*19.0)).z; float edge = smoothstep(rr, rr-0.14, C.x) * smoothstep(0.0, 0.07, C.y); float dome = clamp(1.0-pow(C.x/rr,2.0), 0.0, 1.0); float lay = sin(vPo.y*13.0 + snoise(vPo*vec3(1.0,0.3,1.0)+uSeed)*2.0)*0.5+0.5; float mot = fbm3(vPo*3.0+uSeed); vec3 gh = hash33(vec3(gid*37.0));`,
    color: `vec3 g = mix(sr(vec3(${pal[0]})), sr(vec3(${pal[1]})), clamp(mot*0.65+lay*0.35,0.0,1.0)); g *= 0.8+0.32*gh.x;
            g = mix(g, sr(vec3(0.93,0.91,0.87)), step(0.9,gh.y)*0.65); g = mix(g, sr(vec3(0.28,0.24,0.21)), step(0.965,gh.z)*0.75);
            vec3 cem = mix(sr(vec3(${pal[0]})), sr(vec3(${pal[1]})), 0.4) * 0.6;
            diffuseColor.rgb = mix(cem, g * (0.82+0.22*dome), edge);`,
    rough: 'roughnessFactor = 0.92;',
    bump: 'lay*0.0006 + fbm2(vPo*30.0)*0.0006',
  });
  B.sandstone = (seed = 113) => one(body(seed, { cuts: 8, rough: 0.16, stretch: [1.3, 0.72, 1.0] }), sandMat(seed, 'sandstone', ['0.70,0.52,0.40', '0.84,0.68,0.54']));
  // 이암: 진흙이 굳은 암석. 알갱이가 보이지 않을 만큼 곱고 매끈하며, 얇은 층이 희미하게 보여요
  B.mudstone = (seed = 115) => one(body(seed, { cuts: 11, rough: 0.12, cutMin: 0.48, stretch: [1.3, 0.7, 1.0] }), M('mudstone', seed, {
    pre: `float lay = sin(vPo.y*34.0 + snoise(vPo*vec3(0.8,0.2,0.8)+uSeed)*1.6)*0.5+0.5; float mot = fbm3(vPo*2.0+uSeed); float gr = fbm2(vPo*90.0); float sp = fbm2(vPo*24.0+uSeed); float pit = smoothstep(0.66,0.8,fbm2(vPo*16.0+uSeed+4.0));`,
    color: `diffuseColor.rgb = mix(sr(vec3(0.74,0.71,0.64)), sr(vec3(0.58,0.55,0.50)), clamp(mot*0.7+lay*0.35-0.1,0.0,1.0)) * (0.9+0.14*gr) * (0.94+0.1*sp) * (1.0-0.15*pit);`,
    rough: 'roughnessFactor = 0.86;',
    bump: 'gr*0.0012 + lay*0.0012 + sp*0.0015 - pit*0.002',
  }));
  // 석회암: 밝은 회색, 알갱이가 곱고 군데군데 조개껍데기 조각 같은 흰 무늬가 있어요
  B.limestone = (seed = 117) => one(body(seed, { cuts: 9, rough: 0.2 }), M('limestone', seed, {
    pre: `float mot = fbm3(vPo*2.4+uSeed); float gr = fbm2(vPo*70.0); vec3 C = cells(vPo*9.0+uSeed); float rr = 0.25+0.15*hash33(vec3(C.z*5.0)).x; float arc = step(0.82,C.z)*smoothstep(0.035,0.0,abs(C.x-rr))*step(0.0, (C.x>0.0? 1.0:0.0)); float pit = smoothstep(0.62,0.75,fbm2(vPo*18.0+uSeed));`,
    color: `vec3 c = mix(sr(vec3(0.62,0.63,0.62)), sr(vec3(0.78,0.78,0.75)), mot) * (0.94+0.1*gr); c = mix(c, sr(vec3(0.92,0.91,0.88)), arc*0.8); diffuseColor.rgb = c * (1.0-0.18*pit);`,
    rough: 'roughnessFactor = 0.82;',
    bump: 'gr*0.0008 - pit*0.003 + arc*0.0015',
  }));

  /* ---------- 변성암 ---------- */
  // 규암: 사암이 변한 암석. 알갱이가 서로 붙어 치밀하고, 흰색·주황빛이 돌며 살짝 반짝여요
  B.quartzite = (seed = 121) => one(body(seed, { cuts: 9, rough: 0.2, cutMin: 0.46 }), M('quartzite', seed, {
    pre: `vec3 C = cells(vPo*30.0+uSeed); float edge = smoothstep(0.0,0.06,C.y); float st = fbm3(vPo*vec3(2.0,4.5,2.0)+uSeed); vec3 gh = hash33(vec3(C.z*53.0));`,
    color: `vec3 a = sr(vec3(0.94,0.90,0.85)), b = sr(vec3(0.90,0.62,0.46)); diffuseColor.rgb = mix(a, b, smoothstep(0.38,0.78,st)) * (0.88+0.17*gh.x) * (0.94+0.06*edge);`,
    rough: 'roughnessFactor = 0.26 + 0.28*gh.y;',
    bump: 'fbm2(vPo*40.0)*0.0005',
  }, { roughness: 0.4, sheen: 0.3, sheenColor: new THREE.Color('#fff2e6') }));
  // 대리암: 석회암이 변한 암석. 흰색·푸른 회색에 구름 같은 무늬와 맥이 있고, 알갱이 면이 반짝여요
  B.marble = (seed = 123) => one(body(seed, { cuts: 8, rough: 0.2 }), M('marble', seed, {
    pre: `float v1 = abs(sin(vPo.x*2.2 + vPo.y*1.4 + fbm3(vPo*1.4+uSeed)*7.0)); float vein = smoothstep(0.93,0.995,v1); float mot = fbm3(vPo*2.2+uSeed); vec3 C = cells(vPo*55.0+uSeed); vec3 gh = hash33(vec3(C.z*11.0));`,
    color: `vec3 c = mix(sr(vec3(0.88,0.90,0.91)), sr(vec3(0.60,0.67,0.74)), smoothstep(0.32,0.82,mot)); c = mix(c, sr(vec3(0.40,0.47,0.55)), vein*0.55); diffuseColor.rgb = c * (0.95+0.07*gh.x);`,
    rough: 'roughnessFactor = 0.3 + 0.32*gh.y;',
    bump: 'fbm2(vPo*30.0)*0.0004',
  }, { roughness: 0.45 }));
  // 편암: 얇은 판이 겹친 짙은 푸른 회색 암석. 판 면이 은빛으로 반짝이고 옆면에 촘촘한 물결 줄무늬(엽리)가 보여요
  const schistMat = (seed) => M('schist', seed, {
    pre: `float w = vPo.y*55.0 + snoise(vPo*vec3(1.6,0.5,1.6)+uSeed)*7.0; float band = sin(w)*0.5+0.5; float fb = sin(w*2.7 + snoise(vPo*6.0)*2.0)*0.5+0.5; float mot = fbm3(vPo*3.0+uSeed); float flake = fbm2(vPo*vec3(26.0,4.0,26.0));`,
    color: `float top = smoothstep(0.75,0.95,abs(vNo.y)); vec3 side = mix(sr(vec3(0.16,0.20,0.24)), sr(vec3(0.50,0.54,0.58)), clamp(band*0.6+fb*0.3,0.0,1.0)); vec3 face = mix(sr(vec3(0.30,0.34,0.38)), sr(vec3(0.46,0.50,0.53)), mot) * (0.85+0.3*flake); diffuseColor.rgb = mix(side, face, top);`,
    rough: 'roughnessFactor = 0.26 + 0.28*(1.0-band);',
    metal: 'metalnessFactor = 0.3*band*flake;',
    bump: 'fb*0.0014 + band*0.0018 + flake*0.001',
  }, { roughness: 0.4 });
  B.schist = (seed = 125) => {
    const R = rng(seed), grp = new THREE.Group(), mat = schistMat(seed);
    let y = 0;
    for (let i = 0; i < 7; i++) {
      const th = 0.1 + R() * 0.05, w = 1 - Math.abs(i - 3) * 0.07 - R() * 0.08;
      const g = lump({ seed: seed + i * 3, detail: 4, rough: 0.1, freq: 1.1, stretch: [1.4 * w, th, 1.0 * w], cuts: 9, cutY: 0.08, cutMin: 0.45, cutVar: 0.35, ripple: 0.01 });
      const m = new THREE.Mesh(g, mat); m.position.set((R() - 0.5) * 0.14, y + th * 0.6, (R() - 0.5) * 0.12); m.rotation.set((R() - 0.5) * 0.04, (R() - 0.5) * 0.3, (R() - 0.5) * 0.04); grp.add(m);
      y += th * 1.05;
    }
    grp.rotation.z = -0.06;
    return settle(shadow(grp), 1);
  };
  // 편마암: 밝은 띠(흰색·분홍빛 알갱이)와 어두운 띠(검은 알갱이)가 번갈아 나타나요. 알갱이가 눈에 보이고 띠를 따라 납작해요
  const gneissMat = (seed, dark) => M(dark ? 'gneissD' : 'gneiss', seed, {
    pre: `float w = vPo.y*${dark ? '17.0' : '12.0'} + snoise(vPo*vec3(1.2,0.45,1.2)+uSeed)*3.2; float band = smoothstep(-0.25,0.25, sin(w)${dark ? '-0.25' : '+0.3'} + 0.35*snoise(vPo*vec3(4.0,1.0,4.0)));
          vec3 C = cells(vPo*vec3(36.0,64.0,36.0)+uSeed); vec3 gh = hash33(vec3(C.z*29.0)); float edge = smoothstep(0.0,0.08,C.y);`,
    color: `vec3 lt = mix(sr(vec3(0.88,0.86,0.82)), sr(vec3(0.80,0.70,0.66)), gh.x); lt = mix(lt, sr(vec3(0.14,0.14,0.15)), step(0.9,gh.y));
            vec3 dk = mix(sr(vec3(0.09,0.09,0.10)), sr(vec3(0.30,0.31,0.33)), gh.x); dk = mix(dk, sr(vec3(0.78,0.77,0.74)), step(0.86,gh.y));
            diffuseColor.rgb = mix(dk, lt, band) * (0.9+0.1*edge);`,
    rough: 'roughnessFactor = mix(0.35, 0.6, band);',
    bump: 'fbm2(vPo*40.0)*0.0006 + band*0.0012',
  }, { roughness: 0.5 });
  B.gneiss = (seed = 127) => one(body(seed, { cuts: 8, stretch: [1.35, 0.7, 1.0] }), gneissMat(seed, false));
  B.gneissD = (seed = 129) => one(body(seed, { cuts: 8, stretch: [1.4, 0.6, 1.0], rough: 0.22 }), gneissMat(seed, true));

  /* ---------- 퇴적물과 생물의 유해 (그림 Ⅱ-7) ---------- */
  // 자갈 더미
  B.gravel = (seed = 141) => {
    const R = rng(seed), grp = new THREE.Group(), mats = PEB.map((c, i) => pebbleMat(seed + i, c));
    for (let i = 0; i < 26; i++) {
      const a = R() * 6.28, r = Math.sqrt(R()) * 0.75, s = 0.13 + R() * 0.13, h = (1 - r / 0.8) * 0.35;
      const p = new THREE.Mesh(pebbleGeo(seed + i * 5, [1, 0.6 + R() * 0.25, 0.7 + R() * 0.3]), mats[i % mats.length]);
      p.scale.setScalar(s); p.position.set(Math.cos(a) * r, s * 0.55 + h * R(), Math.sin(a) * r * 0.8); p.rotation.set(R() * 0.5, R() * 6.28, R() * 0.5); grp.add(p);
    }
    return settle(shadow(grp), 1);
  };
  // 모래 더미 (원뿔처럼 쌓인 고운 알갱이)
  B.sand = (seed = 143) => {
    const g = lump({ seed, detail: 5, rough: 0.06, freq: 1.0, stretch: [1, 0.75, 0.85], flat: 0.02, micro: 0.004 });
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i); if (y > 0) p.setY(i, y * (1.25 - 0.55 * Math.hypot(x, z / 0.85))); } g.computeVertexNormals();
    return one(g, M('sand', seed, {
      pre: `vec3 C = cells(vPo*120.0+uSeed); vec3 gh = hash33(vec3(C.z*17.0)); float edge = smoothstep(0.0,0.2,C.y);`,
      color: `vec3 c = mix(sr(vec3(0.80,0.66,0.48)), sr(vec3(0.90,0.78,0.60)), gh.x); c = mix(c, sr(vec3(0.95,0.94,0.9)), step(0.9,gh.y)*0.7); c = mix(c, sr(vec3(0.3,0.26,0.22)), step(0.95,gh.z)*0.8); diffuseColor.rgb = c*(0.75+0.25*edge);`,
      rough: 'roughnessFactor = 0.95;',
      bump: 'edge*0.0012',
    }));
  };
  // 진흙 (물기를 머금어 번들거리는 고운 흙)
  B.mud = (seed = 145) => {
    const g = lump({ seed, detail: 5, rough: 0.1, freq: 1.4, stretch: [1, 0.3, 0.85], flat: 0.02, micro: 0.003 });
    return one(g, M('mud', seed, {
      pre: `float mot = fbm3(vPo*3.0+uSeed); float wet = smoothstep(0.45,0.7,fbm2(vPo*5.0+uSeed+3.0)); float cr = smoothstep(0.03,0.0,cells(vPo*vec3(5.0,1.0,5.0)+uSeed).y)*step(0.0,vPo.y-0.05);`,
      color: `diffuseColor.rgb = mix(sr(vec3(0.36,0.29,0.22)), sr(vec3(0.50,0.42,0.33)), mot) * (1.0-0.3*wet) * (1.0-0.55*cr);`,
      rough: 'roughnessFactor = mix(0.7, 0.18, wet);',
      bump: 'fbm2(vPo*12.0)*0.003 - cr*0.006',
    }, { roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.3 }));
  };
  // 산호와 조개껍데기 (석회 물질로 된 생물의 유해)
  B.coral = (seed = 147) => {
    const R = rng(seed), grp = new THREE.Group();
    const cm = M('coral', seed, {
      pre: 'vec3 C = cells(vPo*40.0+uSeed); float pol = smoothstep(0.22,0.1,C.x);',
      color: 'diffuseColor.rgb = mix(sr(vec3(0.93,0.88,0.80)), sr(vec3(0.80,0.72,0.62)), pol*0.8) * (0.92+0.1*fbm2(vPo*9.0));',
      rough: 'roughnessFactor = 0.8;',
      bump: '-pol*0.004',
    });
    const branch = (p, dir, len, r, depth) => {
      const q = p.clone().addScaledVector(dir, len), mid = p.clone().lerp(q, 0.5).add(V((R() - 0.5) * len * 0.25, 0, (R() - 0.5) * len * 0.25));
      const tb = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p, mid, q), 10, r, 10, false), cm); grp.add(tb);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(r * 1.02, 12, 8), cm); cap.position.copy(q); grp.add(cap);
      if (depth <= 0) return;
      const n = depth > 1 ? 3 : 2 + (R() < 0.5 ? 1 : 0);
      for (let i = 0; i < n; i++) { const d = dir.clone().add(V((R() - 0.5) * 1.3, 0.2 + R() * 0.3, (R() - 0.5) * 1.3)).normalize(); branch(q, d, len * (0.62 + R() * 0.2), r * 0.72, depth - 1); }
    };
    branch(V(0, 0, 0), V(0, 1, 0), 0.32, 0.1, 3); branch(V(0.12, 0, 0.05), V(0.6, 0.8, 0.2).normalize(), 0.28, 0.08, 2); branch(V(-0.1, 0, -0.05), V(-0.6, 0.8, -0.1).normalize(), 0.3, 0.085, 2);
    // 조개껍데기 두 개
    const sm = M('shell', seed, {
      pre: 'float ang = atan(vPo.x, vPo.z); float rib = sin(ang*26.0)*0.5+0.5; float ring = sin(length(vPo.xz)*60.0)*0.5+0.5;',
      color: 'diffuseColor.rgb = mix(sr(vec3(0.92,0.86,0.78)), sr(vec3(0.74,0.58,0.46)), ring*0.35+rib*0.2);',
      rough: 'roughnessFactor = 0.55;',
      bump: 'rib*0.003',
    }, { roughness: 0.5, side: THREE.DoubleSide });
    [[0.55, 0.35, 0.3], [-0.5, 0.4, 0.26], [0.1, 0.62, 0.22]].forEach(([x, z, s], i) => {
      const g = new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.42); const m = new THREE.Mesh(g, sm);
      m.scale.set(s, s * 0.9, s * 0.85); m.rotation.set(0.15, i * 2 + 0.5, 0.1); m.position.set(x, 0, z); grp.add(m);
    });
    return settle(shadow(grp), 1);
  };

  /* ---------- 층리와 화석 ---------- */
  // 층리가 보이는 퇴적암 덩어리: 크기·색이 다른 층이 나란히 쌓여 있어요
  B.strata = (seed = 151) => {
    const m = M('strata', seed, {
      pre: `float y = vPo.y*3.4 + snoise(vPo*vec3(0.6,0.15,0.6)+uSeed)*0.25; float k = floor(y*2.2); float f = fract(y*2.2); vec3 lh = hash33(vec3(k*7.0+3.0)); float edge = smoothstep(0.0,0.06,f)*smoothstep(1.0,0.94,f); vec3 C = cells(vPo*60.0+uSeed); vec3 gh = hash33(vec3(C.z*3.0));`,
      color: `vec3 c = lh.x < 0.35 ? sr(vec3(0.78,0.68,0.54)) : lh.x < 0.6 ? sr(vec3(0.56,0.50,0.45)) : lh.x < 0.8 ? sr(vec3(0.70,0.58,0.46)) : sr(vec3(0.42,0.39,0.37));
              c *= (0.85+0.2*lh.y) * (0.88+0.16*gh.x) * (0.85+0.15*edge); diffuseColor.rgb = c;`,
      rough: 'roughnessFactor = 0.9;',
      bump: 'gh.x*0.0012 + lh.z*0.002',
    });
    const g = lump({ seed, detail: 5, rough: 0.12, freq: 1.0, stretch: [1.7, 0.75, 1.1], cuts: 8, cutY: 0.2, cutMin: 0.62, cutVar: 0.12, flat: 0.55, ripple: 0.02, micro: 0.008 });
    // 층마다 조금씩 들어가고 나와 계단 같은 절벽 면이 돼요
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) { if (p.getY(i) > 0.5) p.setY(i, 0.5 + (p.getY(i) - 0.5) * 0.08); }
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = Math.floor((y * 3.4) * 2.2), d = 1 - 0.035 * ((Math.sin(k * 12.9898) * 43758.5) % 1 + 1) % 1; p.setX(i, p.getX(i) * d); p.setZ(i, p.getZ(i) * d); }
    g.computeVertexNormals();
    return one(g, m, 1.4);
  };
  // 공룡 발자국 화석이 남은 평평한 퇴적암 판
  B.footprint = (seed = 153) => {
    const m = M('footprint', seed, {
      pre: `vec2 q = vPo.xz/1.5 - vec2(0.0,-0.02);
            float heel = length((q - vec2(0.0,0.2))*vec2(1.0,0.85)) - 0.1;
            vec2 b0 = vec2(0.0,0.14);
            float t1 = length(vec2(q.x, q.y - clamp(q.y,-0.36,0.14))) - (0.055 + 0.02*smoothstep(-0.36,0.14,q.y));
            vec2 q2 = mat2(0.88,0.47,-0.47,0.88)*(q-b0); float t2 = length(vec2(q2.x, q2.y - clamp(q2.y,-0.32,0.0))) - (0.05 + 0.02*smoothstep(-0.32,0.0,q2.y));
            vec2 q3 = mat2(0.88,-0.47,0.47,0.88)*(q-b0); float t3 = length(vec2(q3.x, q3.y - clamp(q3.y,-0.32,0.0))) - (0.05 + 0.02*smoothstep(-0.32,0.0,q3.y));
            float d = min(min(heel, t1), min(t2, t3));
            float print = smoothstep(0.03,-0.03,d) * step(0.0, vNo.y-0.6); float rim = smoothstep(0.07,0.0,abs(d-0.02))*step(0.0,vNo.y-0.6);
            float mot = fbm3(vPo*3.0+uSeed); vec3 C = cells(vPo*70.0+uSeed); vec3 gh = hash33(vec3(C.z*13.0)); float wave = sin(vPo.x*30.0+snoise(vPo*2.0)*2.0)*0.5+0.5;`,
      color: `vec3 c = mix(sr(vec3(0.52,0.50,0.46)), sr(vec3(0.66,0.63,0.57)), mot)*(0.88+0.14*gh.x); c *= 1.0-0.38*print; c = mix(c, sr(vec3(0.45,0.5,0.4)), print*smoothstep(0.55,0.75,fbm2(vPo*9.0))*0.5); diffuseColor.rgb = c*(1.0+0.08*rim);`,
      rough: 'roughnessFactor = 0.88;',
      bump: '-print*0.07 + rim*0.008 + wave*0.0012 + gh.x*0.0008',
    });
    const g = lump({ seed, detail: 6, rough: 0.08, freq: 0.9, stretch: [1.25, 0.2, 1.05], cuts: 6, cutY: 0.15, cutMin: 0.7, cutVar: 0.15, flat: 0.14, ripple: 0.01, micro: 0.003 });
    // 윗면을 평평하게 깎아요
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0.13) p.setY(i, 0.13 + (p.getY(i) - 0.13) * 0.15); g.computeVertexNormals();
    return one(g, m, 1.3);
  };

  /* 탐구 표·분류 기준 성질 (교과서) */
  const INFO = {
    basalt: { name: '현무암', kind: '화성암', sub: '화산암', tone: '어둡다', stripe: false, big: false, acid: false, from: '마그마가 지표로 분출하여 빠르게 식음' },
    rhyolite: { name: '유문암', kind: '화성암', sub: '화산암', tone: '밝다', stripe: false, big: false, acid: false, from: '마그마가 지표로 분출하여 빠르게 식음' },
    gabbro: { name: '반려암', kind: '화성암', sub: '심성암', tone: '어둡다', stripe: false, big: true, round: false, acid: false, from: '마그마가 지하 깊은 곳에서 천천히 식음' },
    granite: { name: '화강암', kind: '화성암', sub: '심성암', tone: '밝다', stripe: false, big: true, round: false, acid: false, from: '마그마가 지하 깊은 곳에서 천천히 식음' },
    graniteP: { name: '화강암', kind: '화성암', sub: '심성암', tone: '밝다' },
    conglomerate: { name: '역암', kind: '퇴적암', sed: '자갈', tone: '여러 색', stripe: false, big: true, round: true, varied: true, acid: false, from: '주로 자갈이 쌓여 굳음' },
    sandstone: { name: '사암', kind: '퇴적암', sed: '모래', tone: '밝다', stripe: false, big: true, round: true, varied: false, acid: false, from: '주로 모래가 쌓여 굳음' },
    mudstone: { name: '이암', kind: '퇴적암', sed: '진흙', tone: '밝다', stripe: false, big: false, acid: false, from: '진흙이 쌓여 굳음' },
    limestone: { name: '석회암', kind: '퇴적암', sed: '석회 물질', tone: '밝다', stripe: false, big: false, from: '석회 물질이나 산호·조개껍데기가 쌓여 굳음' },
    quartzite: { name: '규암', kind: '변성암', parent: '사암', tone: '밝다', from: '사암이 열과 압력을 받아 변함' },
    marble: { name: '대리암', kind: '변성암', parent: '석회암', tone: '밝다', stripe: false, big: false, acid: true, from: '석회암이 열과 압력을 받아 변함' },
    schist: { name: '편암', kind: '변성암', parent: '이암', tone: '어둡다', stripe: true, from: '이암이 열과 압력을 받아 변함' },
    gneiss: { name: '편마암', kind: '변성암', parent: '화강암', tone: '어두운 줄과 밝은 줄', stripe: true, big: true, acid: false, from: '화강암, 이암 등이 열과 압력을 받아 변함' },
    gneissD: { name: '편마암', kind: '변성암', parent: '편암', tone: '어둡다', stripe: true },
    gravel: { name: '자갈' }, sand: { name: '모래' }, mud: { name: '진흙' }, coral: { name: '산호 등 석회 물질' }, strata: { name: '층리' }, footprint: { name: '공룡 발자국 화석' },
  };
  function make(id, seed) { const f = B[id]; if (!f) throw new Error('암석 모형 없음: ' + id); const m = f(seed); m.userData.rock = id; return m; }

  /* 표본 사진(썸네일): 화면 밖 렌더러 하나로 모형을 찍어 그림 주소(dataURL)로 돌려줘요 */
  let TR = null;
  function thumbs(ids, size = 256, o = {}) {
    if (!TR) {
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.setPixelRatio(1);
      const scene = new THREE.Scene(); scene.environment = MIN3D.studioEnv(renderer);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7d6c, 0.5));
      const sun = new THREE.DirectionalLight(0xffffff, 1.7); sun.position.set(-2.5, 5, 3.5); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 20 }); sun.shadow.radius = 6; scene.add(sun);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShadowMaterial({ opacity: 0.28 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
      const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
      TR = { renderer, scene, cam };
    }
    const { renderer, scene, cam } = TR, out = {};
    renderer.setSize(size, Math.round(size * (o.aspect || 1)), false); cam.aspect = 1 / (o.aspect || 1); cam.updateProjectionMatrix();
    ids.forEach((id) => {
      const m = make(id, o.seed); m.rotation.y = o.ry == null ? -0.5 : o.ry; scene.add(m);
      const b = new THREE.Box3().setFromObject(m), c = b.getCenter(V()), s = b.getSize(V()), r = Math.max(s.x, s.y * 1.3, s.z) * 0.62;
      const d = r / Math.tan((cam.fov * Math.PI) / 360) * 1.02;
      cam.position.set(c.x, c.y + d * 0.55, c.z + d * 0.84); cam.lookAt(c.x, c.y - s.y * 0.06, c.z);
      renderer.render(scene, cam); out[id] = renderer.domElement.toDataURL('image/png');
      scene.remove(m); m.traverse((x) => { if (x.isMesh) x.geometry.dispose(); });
    });
    return out;
  }
  return { make, INFO, thumbs, B };
})();
