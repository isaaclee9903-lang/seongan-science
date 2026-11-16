/* ===== 원자 수업 그림 도구: 원자 모형 (캔버스 2D) =====
   AT.part(ctx, x, y, r, kind, a)        구성 입자 하나: 'p' 양성자(빨강 +), 'n' 중성자(초록), 'e' 전자(파랑 −)
   AT.cloud(ctx, x, y, R, o)             원자를 나타내는 하늘색 공(교과서 그림 Ⅳ-6·Ⅳ-7 형식)
   AT.orbits(n, seed)                    전자가 움직이는 길(기울어진 타원, 껍질 개념 없음)
   AT.atom(ctx, x, y, R, o)              원자 모형 하나: o.mode 'detail'(양성자·중성자 덩어리) | 'simple'(원자핵 하나)
   AT.EL20                               그림 Ⅳ-8의 1~20번 원소 [원자 번호, 기호, 이름, 주기, 족]
   그림 원칙: 화면 틀은 라스 파랑 하나, 그림 속 입자는 교과서 색(양성자 빨강, 중성자 초록, 전자 파랑, 원자 하늘색).
   빛은 왼쪽 위 하나, 매트한 질감, 그림 속 글씨는 HTML 이름표. 전자의 수·위치·빠르기는 보기 좋게 정한 모형. */
window.AT = (() => {
  const { TAU, clamp, lerp, shade, rgba, rng, contact } = EL;
  const COL = { p: '#e2463d', n: '#74b843', e: '#2f86d6' };

  function part(ctx, x, y, r, kind, a = 1) {
    if (a <= 0 || r <= 0.2) return;
    const c = COL[kind];
    ctx.save(); ctx.globalAlpha *= a;
    const g = ctx.createRadialGradient(x - r * 0.36, y - r * 0.4, r * 0.06, x, y, r * 1.02);
    g.addColorStop(0, shade(c, 0.45)); g.addColorStop(0.5, c); g.addColorStop(1, shade(c, -0.3));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba('#14263b', 0.2); ctx.lineWidth = Math.max(0.5, r * 0.05); ctx.stroke();
    if (kind !== 'n' && r > 3.2) {
      ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.1, r * 0.2);
      const w = r * 0.48;
      ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x + w, y);
      if (kind === 'p') { ctx.moveTo(x, y - w); ctx.lineTo(x, y + w); }
      ctx.stroke();
    }
    ctx.restore();
  }

  function cloud(ctx, x, y, R, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.a == null ? 1 : o.a;
    if (o.shadow !== false) contact(ctx, x, y + R * 1.02, R * 1.6, 0.13, 0.16);
    const g = ctx.createRadialGradient(x - R * 0.32, y - R * 0.36, R * 0.05, x, y, R);
    g.addColorStop(0, '#f6fcff'); g.addColorStop(0.45, '#d6eefa'); g.addColorStop(0.85, '#a9daf2'); g.addColorStop(1, '#8ccbeb');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba('#3b8fc4', 0.28); ctx.lineWidth = Math.max(0.8, R * 0.008); ctx.stroke();
    if (o.ring) { ctx.strokeStyle = '#0e63b3'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, R + 6, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }

  // 전자가 움직이는 길: 원자 반지름 1 기준
  function orbits(n, seed = 3) {
    const R = rng(seed), list = [];
    for (let i = 0; i < n; i++) {
      list.push({ r: 0.5 + R() * 0.32, inc: 0.3 + R() * 0.65, tilt: (i / Math.max(1, n)) * Math.PI + R() * 0.6, ph: R() * TAU, sp: (0.32 + R() * 0.22) * (R() < 0.5 ? 1 : -1) });
    }
    return list;
  }
  function epos(o, t) {
    const th = o.ph + o.sp * t, lx = Math.cos(th) * o.r, ly = Math.sin(th) * o.r * Math.cos(o.inc), z = Math.sin(th) * Math.sin(o.inc);
    const c = Math.cos(o.tilt), s = Math.sin(o.tilt);
    return { x: lx * c - ly * s, y: lx * s + ly * c, z };
  }

  // 원자핵 속 입자 배치(공 덩어리): 개수별로 한 번 계산해 둔다
  const packCache = {};
  function pack(k) {
    if (packCache[k]) return packCache[k];
    // 헬륨(양성자 2·중성자 2): 양성자가 대각선에 오게 고정(그림 Ⅳ-6 형식)
    if (k === 4) return (packCache[4] = [{ x: -0.5, y: -0.44, z: 0.1 }, { x: 0.52, y: -0.4, z: -0.2 }, { x: 0.5, y: 0.46, z: 0.3 }, { x: -0.48, y: 0.5, z: -0.1 }]);
    const R = rng(11 + k), P = [];
    for (let i = 0; i < k; i++) P.push({ x: (R() - 0.5) * 0.4, y: (R() - 0.5) * 0.4, z: (i % 2 ? 0.3 : -0.3) + (R() - 0.5) * 0.2 });
    for (let it = 0; it < 260; it++) {
      for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
        const a = P[i], b = P[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001;
        if (d < 1.72) { const m = (1.72 - d) / d * 0.5; a.x -= dx * m; a.y -= dy * m; b.x += dx * m; b.y += dy * m; }
      }
      P.forEach((p) => { p.x *= 0.97; p.y *= 0.97; });
    }
    return (packCache[k] = P);
  }
  // kinds: ['p','n',…] 순서대로 섞어 배치
  function nucleus(ctx, x, y, r, kinds, t = 0, a = 1) {
    const P = pack(kinds.length);
    const list = P.map((p, i) => ({ k: kinds[i], x: p.x, y: p.y, z: p.z, i })).sort((p, q) => p.z - q.z);
    list.forEach((p) => {
      const w = Math.sin(t * 7 + p.i * 2.1) * 0.03;
      const s = 1 + p.z * 0.06;
      part(ctx, x + (p.x + w) * r, y + (p.y - w) * r, r * s, p.k, a);
    });
  }

  /* 원자 모형 하나
     o: { mode:'detail'|'simple', p, n, e(전자 수), t, orb(orbits 결과), shadow, ring, nr(원자핵 반지름 비율), er(전자 반지름 비율), ea(전자별 투명도 배열), noCloud } */
  function atom(ctx, x, y, R, o) {
    const t = o.t || 0, orb = o.orb || orbits(o.e || 0), ne = o.e || 0;
    if (!o.noCloud) cloud(ctx, x, y, R, { shadow: o.shadow, ring: o.ring });
    const er = R * (o.er || 0.052);
    const es = [];
    for (let i = 0; i < ne && i < orb.length; i++) { const q = epos(orb[i], t); es.push({ x: x + q.x * R, y: y + q.y * R, z: q.z, a: o.ea ? o.ea[i] : 1 }); }
    es.filter((q) => q.z < 0).forEach((q) => part(ctx, q.x, q.y, er * (1 + q.z * 0.12), 'e', q.a));
    let nr;
    if (o.mode === 'detail') {
      const kinds = []; for (let i = 0; i < Math.max(o.p, o.n || 0); i++) { if (i < o.p) kinds.push('p'); if (i < (o.n || 0)) kinds.push('n'); }
      nr = R * (o.nr || 0.085); nucleus(ctx, x, y, nr, kinds, t);
    } else {
      nr = R * (o.nr || 0.15);
      contact(ctx, x + nr * 0.1, y + nr * 0.95, nr * 1.6, 0.12, 0.25);
      const g = ctx.createRadialGradient(x - nr * 0.35, y - nr * 0.4, nr * 0.05, x, y, nr);
      g.addColorStop(0, '#f6877e'); g.addColorStop(0.55, '#e2463d'); g.addColorStop(1, '#b52c25');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, nr, 0, TAU); ctx.fill();
      ctx.strokeStyle = rgba('#14263b', 0.2); ctx.lineWidth = 1; ctx.stroke();
    }
    es.filter((q) => q.z >= 0).forEach((q) => part(ctx, q.x, q.y, er * (1 + q.z * 0.12), 'e', q.a));
    return { nr, es };
  }

  const EL20 = [
    [1, 'H', '수소', 1, 1], [2, 'He', '헬륨', 1, 18], [3, 'Li', '리튬', 2, 1], [4, 'Be', '베릴륨', 2, 2], [5, 'B', '붕소', 2, 13],
    [6, 'C', '탄소', 2, 14], [7, 'N', '질소', 2, 15], [8, 'O', '산소', 2, 16], [9, 'F', '플루오린', 2, 17], [10, 'Ne', '네온', 2, 18],
    [11, 'Na', '나트륨', 3, 1], [12, 'Mg', '마그네슘', 3, 2], [13, 'Al', '알루미늄', 3, 13], [14, 'Si', '규소', 3, 14], [15, 'P', '인', 3, 15],
    [16, 'S', '황', 3, 16], [17, 'Cl', '염소', 3, 17], [18, 'Ar', '아르곤', 3, 18], [19, 'K', '칼륨', 4, 1], [20, 'Ca', '칼슘', 4, 2],
  ];

  return { COL, part, cloud, orbits, epos, nucleus, atom, EL20 };
})();
