/* ===== 원소 수업 그림 도구: 원소 기호 목록과 그림 Ⅳ-3 화학식 =====
   EL.SYM       교과서 140~141쪽에 나온 원소 기호 18개 [기호, 이름, 라틴어나 영어 이름, '영어'|'라틴어']
   EL.FORMULA   그림 Ⅳ-3 화학식 6개 { id, parts:[[기호, 숫자]], name, els, unit|lattice }
   EL.fhtml(f)  화학식 HTML(숫자는 아래 첨자)
   EL.formula(host)  고른 물질의 입자 모형을 천천히 돌려 보여 줌 → .set(id)
   입자 모형의 개수 풀이는 다음 차시 내용이라 화면 글에서 다루지 않는다. */
(() => {
  const { TAU, ease, lerp, surface, overlay, addLoop, tweens, white, contact, ball, PT } = EL;
  EL.SYM = [
    ['H', '수소', 'Hydrogen', '영어'], ['He', '헬륨', 'Helium', '영어'], ['Li', '리튬', 'Lithium', '영어'], ['Be', '베릴륨', 'Beryllium', '영어'],
    ['C', '탄소', 'Carbon', '영어'], ['N', '질소', 'Nitrogen', '영어'], ['O', '산소', 'Oxygen', '영어'], ['Ne', '네온', 'Neon', '영어'],
    ['Na', '나트륨', 'Natrium', '라틴어'], ['Mg', '마그네슘', 'Magnesium', '영어'], ['Al', '알루미늄', 'Aluminium', '영어'], ['Si', '규소', 'Silicon', '영어'],
    ['S', '황', 'Sulfur', '영어'], ['Cl', '염소', 'Chlorine', '영어'], ['Ca', '칼슘', 'Calcium', '영어'], ['Fe', '철', 'Ferrum', '라틴어'],
    ['Cu', '구리', 'Cuprum', '라틴어'], ['Hg', '수은', 'Hydrargyrum', '라틴어'],
  ];
  EL.FORMULA = [
    { id: 'NH3', parts: [['N', ''], ['H', '3']], name: '암모니아', els: ['N', 'H'], unit: 'NH3' },
    { id: 'NaCl', parts: [['Na', ''], ['Cl', '']], name: '염화 나트륨', els: ['Na', 'Cl'], lattice: true },
    { id: 'H2O', parts: [['H', '2'], ['O', '']], name: '물', els: ['H', 'O'], unit: 'H2O' },
    { id: 'CH4', parts: [['C', ''], ['H', '4']], name: '메테인', els: ['C', 'H'], unit: 'CH4' },
    { id: 'CO2', parts: [['C', ''], ['O', '2']], name: '이산화 탄소', els: ['C', 'O'], unit: 'CO2' },
    { id: 'CO', parts: [['C', ''], ['O', '']], name: '일산화 탄소', els: ['C', 'O'], unit: 'CO' },
  ];
  EL.fhtml = (f) => f.parts.map(([s, n]) => s + (n ? `<sub>${n}</sub>` : '')).join('');
  const symName = (s) => (EL.SYM.find((x) => x[0] === s) || [s, s])[1];
  EL.symName = symName;

  // 입체 모양(산소 반지름 단위, z는 앞뒤)
  const M3 = {
    NH3: [['N', 0, -0.25, 0], ['H', -0.85, 0.45, 0.45], ['H', 0.85, 0.45, 0.45], ['H', 0, 0.45, -0.95]],
    H2O: [['O', 0, 0, 0], ['H', -0.8, 0.62, 0], ['H', 0.8, 0.62, 0]],
    CH4: [['C', 0, 0, 0], ['H', 0, -1, 0], ['H', 0.94, 0.34, 0], ['H', -0.47, 0.34, 0.82], ['H', -0.47, 0.34, -0.82]],
    CO2: [['C', 0, 0, 0], ['O', -1.05, 0, 0], ['O', 1.05, 0, 0]],
    CO: [['C', -0.48, 0, 0], ['O', 0.52, 0, 0]],
  };

  EL.formula = function (host, o = {}) {
    const W = 1000, H = 640, S = surface(host, W, H, o.crop), ctx = S.ctx, ol = overlay(S), tw = tweens();
    const st = { f: EL.FORMULA[2], a: 0.6, pop: 1, t: 0 };
    function proj(x, y, z, a, tilt) {
      const X = x * Math.cos(a) - z * Math.sin(a), Z0 = x * Math.sin(a) + z * Math.cos(a);
      const Y = y * Math.cos(tilt) - Z0 * Math.sin(tilt), Z = y * Math.sin(tilt) + Z0 * Math.cos(tilt);
      return [X, Y, Z];
    }
    function draw(dt) {
      st.t += dt; tw.step(dt); if (!EL.reduce) st.a += dt * 0.45;
      S.begin(); white(S);
      const cx = 500, cy = 318, f = st.f;
      // 바닥 그림자와 옅은 원판
      ctx.fillStyle = '#f3f7fb'; ctx.beginPath(); ctx.arc(cx, cy, 236, 0, TAU); ctx.fill();
      contact(ctx, cx, cy + 210, 340, 0.16, 0.14);
      const k = 0.85 + 0.15 * ease(st.pop);
      const pts = [];
      if (f.lattice) {
        const sp = 92 * k;
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let l = -1; l <= 1; l++) {
          const e = (i + j + l + 3) % 2 ? 'Na' : 'Cl';
          const [X, Y, Z] = proj(i * sp, j * sp, l * sp, st.a * 0.6 + 0.5, -0.42);
          pts.push({ e, X, Y, Z, r: (e === 'Cl' ? 44 : 34) * k });
        }
        // 이웃끼리 얇은 선
        ctx.strokeStyle = 'rgba(90,107,126,.25)'; ctx.lineWidth = 2;
      } else {
        const R = 96 * k;
        M3[f.unit].forEach(([e, x, y, z]) => { const [X, Y, Z] = proj(x * R, y * R, z * R, st.a, -0.18); pts.push({ e, X, Y, Z, r: R * PT[e].s }); });
      }
      pts.sort((p, q) => q.Z - p.Z).forEach((p) => { const sc = 1 - p.Z / 1400; ball(ctx, cx + p.X * sc, cy + p.Y * sc, p.r * sc, p.e); });
      ol.put('fm', cx, 40, `<span class="fx">${EL.fhtml(f)}</span><span class="fn">${f.name}</span>`, 'tx fhead');
      ol.put('cp', cx, 600, f.els.map((e) => `${EL.dot(e)}${symName(e)}(${e})`).join('<span class="pl">+</span>'), 'tx fcomp');
    }
    addLoop(host, draw);
    return {
      st, S,
      set(id) { st.f = EL.FORMULA.find((x) => x.id === id) || st.f; st.pop = 0; tw.clear(); tw.add(0.5, (k) => (st.pop = k)); },
    };
  };
})();
