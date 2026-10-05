  const { $, $$ } = window.RD;
  $$('[data-link]').forEach((a) => {
    const key = a.dataset.link;
    a.href = LINKS[key];
    a.addEventListener('click', (e) => { if (!EMBED) return; e.preventDefault(); parent.postMessage({ type: 'ras-nav', target: key }, '*'); });
  });
  $$('[data-go]').forEach((b) => b.addEventListener('click', () => document.getElementById(b.dataset.go).scrollIntoView({ behavior: 'smooth', block: 'start' })));
  const fsN = $('#fsN'), fsB = $('#fsB');
  const setBig = (v) => { document.documentElement.classList.toggle('big', v); fsN.setAttribute('aria-pressed', String(!v)); fsB.setAttribute('aria-pressed', String(v)); };
  fsN.addEventListener('click', () => setBig(false)); fsB.addEventListener('click', () => setBig(true));

  const bar = $('#progress'), steps = $$('.step'), parts = ['r1', 'r2', 'q1', 'r3', 'r4', 'q2'].map((id) => document.getElementById(id));
  function onScroll() {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
    let cur = -1; parts.forEach((p, i) => { if (p.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
    steps.forEach((s, i) => s.classList.toggle('active', i === cur));
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  // 스크롤 등장 효과: 화면 감지 기능 없이 위치를 직접 계산해요. 글은 항상 보이고 위치만 살짝 움직여요
  const revs = $$('.reveal');
  document.documentElement.classList.add('js-reveal');
  function checkReveal() {
    const h = window.innerHeight || document.documentElement.clientHeight;
    if (!h) return;
    revs.forEach((el) => { if (!el.classList.contains('in')) { const r = el.getBoundingClientRect(); if (r.top < h * 0.92 && r.bottom > 0) el.classList.add('in'); } });
  }
  addEventListener('scroll', checkReveal, { passive: true });
  addEventListener('resize', checkReveal);
  checkReveal();
  const revTimer = setInterval(() => { checkReveal(); if (revs.every((el) => el.classList.contains('in'))) clearInterval(revTimer); }, 250);
  setTimeout(() => {
    const h = window.innerHeight || document.documentElement.clientHeight;
    const blind = !h || revs.every((el) => { const r = el.getBoundingClientRect(); return r.top === 0 && r.height === 0; });
    if (blind) document.documentElement.classList.remove('js-reveal');
  }, 1500);

  const pop = $('#pop'); let popFor = null;
  $$('.term').forEach((t) => t.addEventListener('click', (e) => {
    e.stopPropagation(); if (popFor === t) return hidePop();
    pop.innerHTML = `<b>${t.dataset.term}</b>${GLOSSARY[t.dataset.term] || ''}`; pop.classList.add('show');
    const r = t.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    let x = Math.max(scrollX + 10, Math.min(r.left + scrollX + r.width / 2 - pw / 2, scrollX + innerWidth - pw - 10));
    let y = r.top - ph - 10 < 60 ? r.bottom + scrollY + 10 : r.top + scrollY - ph - 10;
    pop.style.left = x + 'px'; pop.style.top = y + 'px'; popFor = t;
  }));
  function hidePop() { pop.classList.remove('show'); popFor = null; }
  document.addEventListener('click', hidePop);

  /* 퀴즈 엔진 */
  const results = {}, ALL = []; let qn = 0;
  Object.entries(QUIZ).forEach(([sec, list]) => {
    const host = document.querySelector(`[data-quiz="${sec}"]`);
    list.forEach((q, i) => {
      qn += 1; const id = `${sec}-${i}`, label = `문제 ${qn}`; ALL.push({ id, sec, label });
      const card = document.createElement('article'); card.className = 'card qcard'; card.id = id;
      card.innerHTML = `<div class="qhead"><span class="qno">${label}</span><span class="qtype">${{ ox: 'O / X', mc: '고르기', blank: '빈칸 채우기' }[q.type]}</span><span class="qstate"></span></div><div class="qbody"></div><div class="exp">${q.exp}</div>`;
      host.appendChild(card); build(card, q, id);
    });
  });
  $('#scoreT').textContent = ALL.length;
  function mark(card, id, ok) {
    results[id] = ok; card.classList.remove('right', 'wrong'); card.classList.add(ok ? 'right' : 'wrong', 'locked');
    $('.qstate', card).textContent = ok ? '정답' : '다시 보기';
    if (!ok && !$('.retry', card)) {
      const r = document.createElement('button'); r.type = 'button'; r.className = 'btn ghost retry'; r.textContent = '다시 풀기';
      r.addEventListener('click', () => { delete results[id]; card.classList.remove('right', 'wrong', 'locked'); r.remove(); build(card, card._q, id); update(); });
      card.appendChild(r);
    }
    update();
  }
  function build(card, q, id) {
    card._q = q; const body = $('.qbody', card);
    if (q.type === 'ox') {
      body.innerHTML = `<p class="qtext">${q.q}</p><div class="ox"><button type="button" class="oxb o" data-v="1">O</button><button type="button" class="oxb x" data-v="0">X</button></div>`;
      $$('.oxb', body).forEach((b) => b.addEventListener('click', () => { const ok = (b.dataset.v === '1') === q.answer; $$('.oxb', body).forEach((o) => { o.disabled = true; if ((o.dataset.v === '1') === q.answer) o.classList.add('good'); }); if (!ok) b.classList.add('bad'); mark(card, id, ok); }));
    } else if (q.type === 'mc') {
      body.innerHTML = `<p class="qtext">${q.q}</p><div class="mc">${q.options.map((o, i) => `<button type="button" class="mcb" data-i="${i}"><span class="k">${'①②③④'[i]}</span>${o}</button>`).join('')}</div>`;
      $$('.mcb', body).forEach((b) => b.addEventListener('click', () => { const ok = +b.dataset.i === q.answer; $$('.mcb', body).forEach((o, j) => { o.disabled = true; if (j === q.answer) o.classList.add('good'); }); if (!ok) b.classList.add('bad'); mark(card, id, ok); }));
    } else {
      const fill = q.answers.map(() => null); let cur = 0;
      body.innerHTML = `<p class="qtext" style="margin-bottom:6px">알맞은 말을 골라 빈칸을 채워 보세요.</p><p class="sentence">${q.parts.map((p) => typeof p === 'number' ? `<button type="button" class="slot">빈칸 ${p + 1}</button>` : `<span>${p}</span>`).join('')}</p>
        <div class="bank">${q.bank.slice().sort(() => Math.random() - 0.5).map((w) => `<button type="button" class="chip">${w}</button>`).join('')}</div><button type="button" class="btn primary check" disabled>확인하기</button>`;
      const slots = $$('.slot', body), chips = $$('.chip', body), check = $('.check', body);
      const paint = () => { slots.forEach((s, i) => { s.textContent = fill[i] ? fill[i].textContent : `빈칸 ${i + 1}`; s.classList.toggle('filled', !!fill[i]); s.classList.toggle('cur', i === cur && !card.classList.contains('locked')); }); if (check.isConnected) check.disabled = fill.some((f) => !f); };
      chips.forEach((c) => c.addEventListener('click', () => { if (card.classList.contains('locked')) return; if (fill[cur]) fill[cur].classList.remove('used'); fill[cur] = c; c.classList.add('used'); const n = fill.findIndex((f) => !f); cur = n < 0 ? cur : n; paint(); }));
      slots.forEach((s, i) => s.addEventListener('click', () => { if (card.classList.contains('locked')) return; if (fill[i]) { fill[i].classList.remove('used'); fill[i] = null; } cur = i; paint(); }));
      check.addEventListener('click', () => {
        let ok = true; slots.forEach((s, i) => { const g = fill[i].textContent === q.answers[i]; if (!g) ok = false; s.classList.add(g ? 'good' : 'bad'); s.disabled = true; });
        chips.forEach((c) => (c.disabled = true)); check.remove(); card.classList.add('locked');
        if (!ok) body.insertAdjacentHTML('beforeend', `<p class="qtext" style="margin:0;font-size:calc(var(--fs) - 1px);color:#6d4208">정답: ${q.answers.map((a, i) => `빈칸 ${i + 1} <b>${a}</b>`).join(' · ')}</p>`);
        mark(card, id, ok); paint();
      });
      paint();
    }
  }
  function update() {
    const done = ALL.filter((q) => q.id in results), right = done.filter((q) => results[q.id]);
    [['q1', 2], ['q2', 5]].forEach(([sec, si]) => steps[si].classList.toggle('done', ALL.filter((q) => q.sec === sec).every((q) => q.id in results)));
    $('#scoreV').textContent = right.length;
    $('#ringArc').style.strokeDashoffset = 314.16 * (1 - right.length / ALL.length);
    const t = $('#resTitle'), m = $('#resMsg'), wl = $('#wlist');
    if (done.length < ALL.length) { t.textContent = `${ALL.length}문항 중 ${done.length}문항을 풀었어요`; m.textContent = '남은 문제도 풀어 보세요. 틀린 문제는 다시 풀 수 있어요.'; }
    else if (right.length === ALL.length) { t.textContent = '모두 맞혔어요!'; m.textContent = '이제 시뮬레이션에서 직접 해 보고, 스스로 정리해 봐요.'; }
    else { t.textContent = `${ALL.length}문항 중 ${right.length}문항을 맞혔어요`; m.textContent = '틀린 문제를 눌러 다시 읽고 풀어 보세요.'; }
    wl.innerHTML = '';
    ALL.filter((q) => results[q.id] === false).forEach((q) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = `${q.label} 다시 보기`; b.addEventListener('click', () => document.getElementById(q.id).scrollIntoView({ behavior: 'smooth', block: 'center' })); wl.appendChild(b); });
  }
  update();
