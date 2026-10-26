/* ===== 원소 수업 그림 도구: 그림 Ⅳ-1 우리 주변의 원소와 화합물 =====
   EL.sort(host, o)  위: 물체 10가지(처음엔 섞여 있음), 아래: 고른 물체의 큰 입자 돋보기
     .select(id)          물체 고르기(그림을 눌러도 됨)  → onSelect(item)
     .classify('el'|'cp') 고른 물체를 원소/화합물로 나누기 → 맞으면 true
     .group(on)           그림 Ⅳ-1처럼 원소와 화합물로 모아 놓기
     o.grouped: true      처음부터 모아 놓은 모습(읽기 그림)  */
(() => {
  const { TAU, BLUE, lerp, ease, surface, overlay, addLoop, tweens, rr, white, swarm, lens, PT } = EL;
  const W = 1000, H = 820;
  const ORDER = ['balloon', 'plastic', 'salt', 'copper', 'soap', 'diamond', 'water', 'glass', 'capsule', 'dryice'];
  const ROW = [148, 352];
  const gridPos = (i) => [100 + (i % 5) * 200, ROW[Math.floor(i / 5)]];
  function groupPos(it, idx) {
    if (it.kind === 'el') { const k = idx; return [95 + (k % 2) * 190, ROW[Math.floor(k / 2)]]; }
    const k = idx; return [505 + (k % 3) * 195, ROW[Math.floor(k / 3)]];
  }
  const names = (it) => it.els.map((e) => PT[e].name).join(', ') + (it.etc ? ' 등' : '');

  EL.sort = function (host, o = {}) {
    const S = surface(host, W, H, o.crop), ctx = S.ctx, ol = overlay(S), tw = tweens();
    const items = ORDER.map((id, i) => { const it = EL.ITEMS.find((x) => x.id === id); const p = gridPos(i); return { it, x: p[0], y: p[1], done: !!o.grouped, wrong: 0 }; });
    const st = { sel: null, grouped: false, t: 0 };
    const cache = {};
    const swOf = (it) => cache[it.id] || (cache[it.id] = swarm(Object.assign({ seed: 5 }, it.sw)));
    const api = { st, items, onSelect: null };
    function layoutGroup(animate) {
      let e = 0, c = 0;
      items.forEach((m) => {
        const p = groupPos(m.it, m.it.kind === 'el' ? e++ : c++);
        if (animate) { const f = [m.x, m.y]; tw.add(0.9, (k) => { const q = ease(k); m.x = lerp(f[0], p[0], q); m.y = lerp(f[1], p[1], q) - Math.sin(Math.PI * k) * 26; }); }
        else { m.x = p[0]; m.y = p[1]; }
      });
      st.grouped = true;
    }
    if (o.grouped) layoutGroup(false);

    function draw(dt) {
      st.t += dt; tw.step(dt);
      S.begin(); white(S);
      // 모아 놓은 모습: 가운데 얇은 선과 제목
      if (st.grouped) {
        ctx.strokeStyle = '#dde6ee'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(400, 60); ctx.lineTo(400, 450); ctx.stroke();
        ol.put('hg1', 190, 34, '<b>원소</b> <span class="u">한 종류의 입자로 이루어진 물질</span>', 'tx grp2');
        ol.put('hg2', 700, 34, '<b>화합물</b> <span class="u">두 종류 이상의 입자가 모여 만들어진 물질</span>', 'tx grp2');
      } else { ol.hide('hg1'); ol.hide('hg2'); }
      // 물체
      items.forEach((m, i) => {
        const on = st.sel === m;
        if (on) { ctx.fillStyle = '#eef5fc'; rr(ctx, m.x - 90, m.y - 80, 180, 200, 18); ctx.fill(); ctx.strokeStyle = BLUE; ctx.lineWidth = 2; ctx.stroke(); }
        const sh = m.wrong > 0 ? Math.sin(m.wrong * 40) * 6 * m.wrong : 0;
        m.it.draw(ctx, m.x + sh, m.y - 8, 128, st.t + i);
        const tag = m.done ? `<span class="u2">${names(m.it)}</span>` : '';
        ol.put('n' + i, m.x, m.y + 78, `${m.it.name}${tag}`, 'tx inm' + (on ? ' on' : '') + (m.done ? ' dn2' : ''));
        if (m.done && !st.grouped) ol.put('k' + i, m.x, m.y - 84, m.it.kind === 'el' ? '원소' : '화합물', 'tx kd'); else ol.hide('k' + i);
      });
      items.forEach((m) => { if (m.wrong > 0) m.wrong = Math.max(0, m.wrong - dt * 2); });
      // 아래: 돋보기
      ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(30, 476); ctx.lineTo(970, 476); ctx.stroke();
      const m = st.sel;
      if (m) { const s = swOf(m.it); s.step(dt); lens(ctx, 200, 650, 150, s); }
      else lens(ctx, 200, 650, 150, null);
      if (!m) {
        ol.put('ph', 200, 650, '물체를 누르면<br>속의 입자가 보여요', 'tx ph2');
        ol.put('lt', 410, 600, '<b>입자 돋보기</b>', 'tx lt'); ol.hide('lg'); ol.hide('lk');
      } else {
        ol.hide('ph');
        const it = m.it;
        ol.put('lt', 410, 560, `<b>${it.name}</b>`, 'tx lt');
        ol.put('lg', 410, 618, EL.legend(it.els) + (it.etc ? '<span class="lg">등</span>' : ''), 'tx lgd2');
        ol.put('lk', 410, 676, m.done ? `입자의 종류: <b>${it.els.length}가지${it.etc ? ' 이상' : ''}</b> → <b>${it.kind === 'el' ? '원소' : '화합물'}</b>` : '입자가 몇 종류인지 세어 봐요', 'tx lk' + (m.done ? ' dn' : ''));
      }
    }
    addLoop(host, draw);
    S.cv.addEventListener('click', (e) => {
      const [x, y] = S.toLocal(e);
      const m = items.find((q) => Math.abs(q.x - x) < 95 && y > q.y - 100 && y < q.y + 100);
      if (m) api.select(m.it.id);
    });
    api.select = (id) => { const m = items.find((q) => q.it.id === id); st.sel = m || null; api.onSelect && api.onSelect(m ? m.it : null, m); };
    api.classify = (kind) => {
      const m = st.sel; if (!m) return null;
      if (m.it.kind === kind) { m.done = true; return true; }
      m.wrong = 1; return false;
    };
    api.group = () => layoutGroup(true);
    api.reset = () => { tw.clear(); st.sel = null; st.grouped = false; items.forEach((m, i) => { const p = gridPos(i); m.x = p[0]; m.y = p[1]; m.done = false; m.wrong = 0; }); };
    api.names = names;
    api.S = S;
    return api;
  };
})();
