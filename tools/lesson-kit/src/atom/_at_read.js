/* ===== 원자 수업 그림 도구: 읽기 그림 · 주기율표 =====
   AT.gold(host)            그림 Ⅳ-4 형식: 금괴(금 원소) → 둥근 창 속 금 원자
   AT.helium(host)          그림 Ⅳ-6 → Ⅳ-7: 헬륨 원자 모형(자세히 ↔ 간단히)과 총전하량 → { setMode('detail'|'simple') }
   AT.table(box, o)         그림 Ⅳ-8 형식 주기율표(1~20번, 1·2·13~18족) → { select(z), mark('period'|'group'|null, n) }
   AT.fullTable(box)        아래쪽 작은 전체 표(7주기 × 18족, 1~20번만 색) */
(() => {
  const { TAU, clamp, lerp, ease, surface, overlay, addLoop, tweens, white, contact, shade, rgba } = EL;

  /* ---- 금괴와 금 원자 ---- */
  AT.gold = function (host) {
    const W = 1000, H = 560, S = surface(host, W, H), ol = overlay(S), ctx = S.ctx;
    // 금괴 하나: 길이 L, 폭 D, 높이 h, 윗면이 좁아지는 정도 tp
    const P = (o, u, v, z) => [o[0] + u * 0.92 - v * 0.62, o[1] + u * 0.3 + v * 0.42 - z];
    function bar(o, L = 230, D = 110, h = 62, tp = 16) {
      const b = [[-L / 2, -D / 2], [L / 2, -D / 2], [L / 2, D / 2], [-L / 2, D / 2]].map(([u, v]) => P(o, u, v, 0));
      const t = [[-L / 2 + tp, -D / 2 + tp], [L / 2 - tp, -D / 2 + tp], [L / 2 - tp, D / 2 - tp], [-L / 2 + tp, D / 2 - tp]].map(([u, v]) => P(o, u, v, h));
      const face = (pts, c0, c1, gx0, gy0, gx1, gy1) => {
        const g = ctx.createLinearGradient(gx0, gy0, gx1, gy1); g.addColorStop(0, c0); g.addColorStop(1, c1);
        ctx.fillStyle = g; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(120,80,10,.25)'; ctx.lineWidth = 1; ctx.stroke();
      };
      contact(ctx, (b[0][0] + b[2][0]) / 2, (b[0][1] + b[2][1]) / 2 + 8, L * 1.5, 0.2, 0.3);
      face([b[3], b[2], t[2], t[3]], '#f0bf3e', '#c98b18', t[3][0], t[3][1], b[3][0], b[3][1]); // 앞면
      face([b[1], b[2], t[2], t[1]], '#d9a028', '#a8700f', t[1][0], t[1][1], b[2][0], b[2][1]); // 끝면
      face(t, '#fff0a8', '#f2c444', t[0][0], t[0][1], t[2][0], t[2][1]); // 윗면
      // 윗면 가장자리의 부드러운 빛
      ctx.strokeStyle = 'rgba(255,250,215,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(t[3][0], t[3][1]); ctx.lineTo(t[2][0], t[2][1]); ctx.stroke();
    }
    // 금 원자를 빽빽이 쌓은 둥근 창
    const LX = 740, LY = 262, LR = 200, br = 27;
    const balls = [];
    for (let row = -6; row <= 6; row++) for (let col = -6; col <= 6; col++) {
      const x = LX + col * br * 2 + (row % 2 ? br : 0), y = LY + row * br * 1.74;
      if (Math.hypot(x - LX, y - LY) < LR + br) balls.push([x, y]);
    }
    let t = 0;
    addLoop(host, (dt) => {
      t += dt; S.begin(); white(S);
      const g0 = ctx.createLinearGradient(0, 470, 0, 560); g0.addColorStop(0, '#f1f4f7'); g0.addColorStop(1, '#fafbfc');
      ctx.fillStyle = g0; ctx.fillRect(-500, 470, 2000, 300);
      bar([200, 420]); bar([360, 450]); bar([270, 360], 230, 110, 62, 16);
      // 창
      ctx.save(); contact(ctx, LX, LY + LR + 14, LR * 1.6, 0.14, 0.18);
      ctx.beginPath(); ctx.arc(LX, LY, LR, 0, TAU); ctx.fillStyle = '#7a5410'; ctx.fill(); ctx.clip();
      balls.forEach(([x, y]) => {
        const g = ctx.createRadialGradient(x - br * 0.35, y - br * 0.4, br * 0.08, x, y, br * 1.02);
        g.addColorStop(0, '#fff3b8'); g.addColorStop(0.5, '#f3c43a'); g.addColorStop(1, '#b07b14');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, br * 0.97, 0, TAU); ctx.fill();
      });
      ctx.restore();
      ctx.strokeStyle = '#c9d3dd'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(LX, LY, LR + 4, 0, TAU); ctx.stroke();
      // 금괴에서 창으로 가는 얇은 화살표 하나
      ctx.strokeStyle = '#8a9bad'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(400, 300); ctx.quadraticCurveTo(460, 210, 520, 225); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(505, 212); ctx.lineTo(524, 226); ctx.lineTo(504, 238); ctx.stroke();
      ol.put('a', 240, 526, '<b>금 원소</b><span class="u2">금을 이루는 물질</span>', 'tx inm2');
      ol.put('b', LX, 506, '<b>금 원자</b><span class="u2">금 원소를 구성하는 입자</span>', 'tx inm2');
    });
  };

  /* ---- 헬륨 원자 모형: 자세히 ↔ 간단히 ---- */
  AT.helium = function (host) {
    const W = 1000, H = 600, X = 300, Y = 290, R = 230;
    const S = surface(host, W, H), ol = overlay(S), ctx = S.ctx, tw = tweens();
    const orb = AT.orbits(2, 4), st = { k: 0, t: 0, mode: 'detail' };
    addLoop(host, (dt) => {
      st.t += dt; tw.step(dt); S.begin(); white(S);
      AT.cloud(ctx, X, Y, R);
      if (st.k < 1) { ctx.save(); ctx.globalAlpha = 1 - st.k; AT.nucleus(ctx, X, Y, R * 0.125 * (1 - st.k * 0.4), ['p', 'n', 'p', 'n'], st.t); ctx.restore(); }
      if (st.k > 0) { ctx.save(); ctx.globalAlpha = st.k; AT.atom(ctx, X, Y, R, { mode: 'simple', e: 0, nr: lerp(0.08, 0.15, st.k), noCloud: true }); ctx.restore(); }
      const r = AT.atom(ctx, X, Y, R, { mode: 'simple', e: 2, orb, t: st.t, noCloud: true, nr: 0.001, er: 0.06 });
      // 오른쪽 계산 칸으로 가는 얇은 선
      const e = r.es[0];
      ctx.save(); ctx.strokeStyle = 'rgba(90,107,126,.55)'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(X + 30, Y - 22); ctx.lineTo(560, 150); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(560, 380); ctx.stroke();
      ctx.fillStyle = 'rgba(90,107,126,.85)'; [[X + 30, Y - 22], [e.x, e.y]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b, 3.2, 0, TAU); ctx.fill(); });
      ctx.restore();
      if (st.k > 0.6) ol.put('nq', X, Y, '+2', 'tx nq'); else ol.hide('nq');
      ol.put('c1', 572, 150, '<span class="ct">원자 1개의 양성자 총전하량</span><span class="cf">(+)전하 × 양성자의 수</span><span class="cv">(+1) × (2) = <b>+2</b></span>', 'tx calc');
      ol.put('c2', 572, 380, '<span class="ct">원자 1개의 전자 총전하량</span><span class="cf">(−)전하 × 전자의 수</span><span class="cv">(−1) × (2) = <b>−2</b></span>', 'tx calc');
      ol.put('lb', X, Y + R + 34, st.mode === 'detail' ? '<b>헬륨(He)</b>의 원자 모형' : '<b>간단히 나타낸</b> 헬륨(He)의 원자 모형', 'tx cap2');
    });
    return {
      setMode(m) {
        if (m === st.mode) return; st.mode = m; const a = st.k, b = m === 'simple' ? 1 : 0;
        tw.clear(); tw.add(0.9, (k) => (st.k = lerp(a, b, ease(k))));
      },
    };
  };

  /* ---- 주기율표 (그림 Ⅳ-8 형식) ---- */
  const COLS = [1, 2, 0, 13, 14, 15, 16, 17, 18];
  AT.table = function (box, o = {}) {
    let h = `<div class="pt-h pt-corner"><span>족</span><span>주기</span></div>`;
    COLS.forEach((g) => (h += `<div class="pt-h" data-g="${g}">${g || '⋯'}</div>`));
    for (let per = 1; per <= 4; per++) {
      h += `<div class="pt-h pt-row" data-per="${per}">${per}</div>`;
      COLS.forEach((g) => {
        const e = AT.EL20.find((x) => x[3] === per && x[4] === g);
        if (!g) h += `<div class="pt-gap">${per === 4 ? '' : ''}</div>`;
        else if (e) h += `<button type="button" class="pt-c" data-z="${e[0]}" data-per="${per}" data-g="${g}" aria-pressed="false"><i>${e[0]}</i><b>${e[1]}</b><span>${e[2]}</span></button>`;
        else h += `<div class="pt-e" data-per="${per}" data-g="${g}"></div>`;
      });
    }
    box.classList.add('ptab'); box.innerHTML = h;
    const cells = Array.from(box.querySelectorAll('.pt-c'));
    cells.forEach((c) => c.addEventListener('click', () => o.onPick && o.onPick(+c.dataset.z)));
    const API = {
      select(z) { cells.forEach((c) => c.setAttribute('aria-pressed', String(+c.dataset.z === z))); },
      mark(type, n) {
        box.querySelectorAll('[data-per],[data-g]').forEach((e) => e.classList.remove('mk'));
        box.dataset.mark = type || '';
        if (!type) return;
        const key = type === 'period' ? 'per' : 'g';
        box.querySelectorAll(`.pt-c[data-${key}="${n}"], .pt-e[data-${key}="${n}"], .pt-h[data-${key}="${n}"]`).forEach((e) => e.classList.add('mk'));
      },
      cells,
    };
    return API;
  };
  AT.fullTable = function (box) {
    let h = '';
    for (let per = 1; per <= 7; per++) for (let g = 1; g <= 18; g++) {
      const has = per === 1 ? (g === 1 || g === 18) : per <= 3 ? (g <= 2 || g >= 13) : true;
      const on = per <= 3 ? has : per === 4 && g <= 2;
      h += `<i class="${has ? (on ? 'on' : 'off') : 'no'}"></i>`;
    }
    box.classList.add('ftab'); box.innerHTML = h;
  };
})();
