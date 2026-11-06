/* ===== 문제 풀이 엔진 =====
   QE.render(host, q, {onAnswer})  문제 하나를 그려요. 핵심 넘기기와 문제 모음이 같이 씁니다.
   문제 종류 k: choice(고르기), ox, multi(보기에서 있는 대로), essay(서술형), calc(숫자만 바꿔 다시 내는 계산)
   기록은 남기지 않아요(페이지를 닫으면 사라짐). */
window.QE = (() => {
  const esc = (s) => String(s);
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmt = (x) => { const r = Math.round(x * 100) / 100; return String(r); };
  const KO = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ'];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function fb(host, ok, why, extra) {
    const f = host.querySelector('.qfb') || host.appendChild(el('div', 'qfb'));
    f.className = 'qfb ' + (ok ? 'ok' : 'no');
    f.innerHTML = `<b>${ok ? '맞음' : '다시 확인'}</b>${extra ? ' ' + extra : ''}<p>${why || ''}</p>`;
  }

  function choice(host, q, cb) {
    const opts = q.keep ? q.opts.slice() : shuffle(q.opts);
    const answer = q.opts[q.a];
    const wrap = el('div', 'qopts' + (opts.every((o) => String(o).length <= 12) ? ' short' : ''));
    let done = false;
    opts.forEach((o) => {
      const b = el('button', 'qopt', esc(o)); b.type = 'button';
      b.addEventListener('click', () => {
        if (done) return;
        done = true;
        const ok = o === answer;
        wrap.querySelectorAll('.qopt').forEach((x) => { x.disabled = true; if (x.innerHTML === b.innerHTML && !ok) x.classList.add('no'); });
        Array.from(wrap.children).forEach((x, i) => { if (opts[i] === answer) x.classList.add('ok'); });
        fb(host, ok, q.why);
        cb && cb(ok);
      });
      wrap.appendChild(b);
    });
    host.appendChild(wrap);
  }

  function ox(host, q, cb) {
    const wrap = el('div', 'qopts ox');
    let done = false;
    [[true, 'O'], [false, 'X']].forEach(([v, t]) => {
      const b = el('button', 'qopt', t); b.type = 'button';
      b.addEventListener('click', () => {
        if (done) return;
        done = true;
        const ok = v === q.a;
        wrap.querySelectorAll('.qopt').forEach((x, i) => { x.disabled = true; if ((i === 0) === q.a) x.classList.add('ok'); else if (x === b) x.classList.add('no'); });
        fb(host, ok, q.why, `정답 ${q.a ? 'O' : 'X'}`);
        cb && cb(ok);
      });
      wrap.appendChild(b);
    });
    host.appendChild(wrap);
  }

  function multi(host, q, cb) {
    const list = el('div', 'qmulti');
    const sel = new Set();
    q.items.forEach((it, i) => {
      const b = el('button', 'qitem', `<i>${KO[i]}.</i> ${esc(it)}`); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => { if (b.disabled) return; if (sel.has(i)) sel.delete(i); else sel.add(i); b.setAttribute('aria-pressed', String(sel.has(i))); });
      list.appendChild(b);
    });
    host.appendChild(list);
    const go = el('button', 'qgo', '답 확인하기'); go.type = 'button';
    go.addEventListener('click', () => {
      if (!sel.size) { fb(host, false, '맞는 것을 먼저 하나 이상 골라 주세요.'); return; }
      const ok = sel.size === q.a.length && q.a.every((i) => sel.has(i));
      Array.from(list.children).forEach((x, i) => { x.disabled = true; x.classList.toggle('ok', q.a.includes(i)); x.classList.toggle('no', sel.has(i) && !q.a.includes(i)); });
      go.hidden = true;
      fb(host, ok, q.why, `정답 ${q.a.map((i) => KO[i]).join(', ')}`);
      cb && cb(ok);
    });
    host.appendChild(go);
  }

  function essay(host, q, cb) {
    const go = el('button', 'qgo', '모범 답안 보기'); go.type = 'button';
    const hint = el('p', 'qhint', '공책에 답을 쓴 뒤 모범 답안과 비교해요.');
    host.appendChild(hint); host.appendChild(go);
    go.addEventListener('click', () => {
      go.hidden = true; hint.hidden = true;
      const m = el('div', 'qmodel', `<p>${q.model}</p><div class="qkeys"><span>꼭 들어갈 말</span> ${q.keys.map((k) => `<b>${k}</b>`).join(' · ')}</div>`);
      host.appendChild(m);
      const row = el('div', 'qself');
      [['맞게 썼음', true], ['빠진 말이 있음', false]].forEach(([t, v]) => {
        const b = el('button', 'qopt', t); b.type = 'button';
        b.addEventListener('click', () => { row.querySelectorAll('button').forEach((x) => { x.disabled = true; }); b.classList.add(v ? 'ok' : 'no'); cb && cb(v); });
        row.appendChild(b);
      });
      host.appendChild(row);
    });
  }

  // 계산: gen()이 {q, a, unit, why, d:[오답 숫자]}를 돌려줘요
  function calc(host, q, cb) {
    const g = q.gen();
    const a = fmt(g.a) + ' ' + g.unit;
    const seen = new Set([a]);
    const opts = [a];
    g.d.forEach((v) => { const s = fmt(v) + ' ' + g.unit; if (!seen.has(s) && opts.length < 4 && v >= 0) { seen.add(s); opts.push(s); } });
    let k = 2; while (opts.length < 4) { const s = fmt(g.a * k) + ' ' + g.unit; if (!seen.has(s)) { seen.add(s); opts.push(s); } k++; }
    const stem = host.querySelector('.qtext'); if (stem) stem.innerHTML = g.q;
    const sub = el('div', 'qsub');
    choice(sub, { opts, a: 0, why: g.why }, cb);
    host.appendChild(sub);
    const again = el('button', 'qagain', '숫자 바꿔 다시 풀기'); again.type = 'button';
    again.addEventListener('click', () => { sub.remove(); again.remove(); calc(host, q, null); });
    host.appendChild(again);
  }

  function render(host, q, o = {}) {
    host.innerHTML = '';
    host.classList.add('qbox');
    host.appendChild(el('div', 'qmeta', `<span>${q.t || ''}</span>${q.p ? `<span>교과서 ${q.p}쪽</span>` : ''}`));
    host.appendChild(el('div', 'qtext', q.q || ''));
    const cb = o.onAnswer;
    ({ choice, blank: choice, ox, multi, essay, calc }[q.k] || choice)(host, q, cb);
  }
  return { render, pick, fmt, shuffle };
})();
