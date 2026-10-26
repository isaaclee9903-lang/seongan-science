/* ===== 원소 수업 그림 도구: 읽기 페이지 그림 =====
   EL.hero(host)        139쪽 그림처럼 수소 + 산소(원소) → 물(화합물)을 입자 돋보기 셋으로
   EL.cards(box, syms)  그림 Ⅳ-2 원소 카드(표본 그림 + 원소 기호 + 이름)를 두 줄 부채꼴로
   EL.rule(box)         원소 기호 규칙: 이름에서 글자를 골라 기호가 되는 모습 */
(() => {
  const { TAU, surface, overlay, addLoop, white, swarm, lens } = EL;

  EL.hero = function (host) {
    const W = 1200, H = 640, S = surface(host, W, H), ctx = S.ctx, ol = overlay(S);
    const sw = [swarm({ state: 'gas', unit: 'H2', n: 10, r: 0.11, seed: 2, speed: 0.55 }), swarm({ state: 'gas', unit: 'O2', n: 8, r: 0.11, seed: 6 }), swarm({ state: 'liquid', unit: 'H2O', n: 20, r: 0.105, seed: 4 })];
    const X = [200, 590, 1000], Y = 300, R = 150;
    addLoop(host, (dt) => {
      sw.forEach((s) => s.step(dt));
      S.begin(); white(S);
      X.forEach((x, i) => lens(ctx, x, Y, i === 2 ? 170 : R, sw[i], { tint: i === 2 ? '#3d8fdc' : null }));
      // + 와 화살표 하나
      ctx.strokeStyle = '#8a9bad'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(395, Y - 22); ctx.lineTo(395, Y + 22); ctx.moveTo(373, Y); ctx.lineTo(417, Y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(768, Y); ctx.lineTo(808, Y); ctx.moveTo(792, Y - 14); ctx.lineTo(810, Y); ctx.lineTo(792, Y + 14); ctx.stroke();
      ol.put('a', X[0], Y + R + 64, `<b>수소</b><span class="fl">원소</span>`, 'tx hnm');
      ol.put('b', X[1], Y + R + 64, `<b>산소</b><span class="fl">원소</span>`, 'tx hnm');
      ol.put('c', X[2], Y + 170 + 48, `<b>물</b><span class="fl">화합물</span>`, 'tx hnm');
    });
  };

  EL.cards = function (box, syms) {
    const half = Math.ceil(syms.length / 2);
    box.innerHTML = [syms.slice(0, half), syms.slice(half)].map((row, r) => `<div class="crow">${row.map((s, i) => {
      const k = i - (row.length - 1) / 2, rot = k * 4, dy = k * k * 3.2;
      return `<div class="ecard" style="transform:translateY(${dy}px) rotate(${rot}deg)"><canvas data-s="${s}"></canvas><b>${s}</b><span>${EL.symName(s)}</span></div>`;
    }).join('')}</div>`).join('');
    box.querySelectorAll('canvas').forEach((c) => EL.thumb(c, EL.SAMPLE[c.dataset.s], { anim: c.dataset.s === 'Ne', scale: 1.02 }));
  };

  const EX = [['H', '수소', 'Hydrogen', [0]], ['C', '탄소', 'Carbon', [0]], ['He', '헬륨', 'Helium', [0, 1]], ['Cl', '염소', 'Chlorine', [0, 2]]];
  EL.rule = function (box, bar) {
    let cur = -1, timer = null;
    function show(i) {
      cur = i; const [sym, ko, nm, idx] = EX[i];
      box.innerHTML = `<div class="rk">${ko}</div><div class="rw">${nm.split('').map((c, j) => `<span data-j="${j}">${c}</span>`).join('')}</div><div class="ra">→</div><div class="rs">${sym.split('').map((c) => `<i>${c}</i>`).join('')}</div><div class="rn">${idx.length === 1 ? '규칙 ① 첫 글자를 대문자로' : `규칙 ② 첫 글자가 같은 ${sym[0] === 'H' ? '수소(H)' : '탄소(C)'}가 있어서 중간 글자를 소문자로`}</div>`;
      clearTimeout(timer);
      const spans = box.querySelectorAll('.rw span'), out = box.querySelectorAll('.rs i');
      idx.forEach((j, n) => { timer = setTimeout(() => { spans[j].classList.add('on'); out[n].classList.add('on'); }, EL.reduce ? 0 : 350 + n * 550); });
      bar.querySelectorAll('[data-r]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.r === i)));
    }
    bar.insertAdjacentHTML('afterbegin', EX.map(([s, ko], i) => `<button type="button" data-r="${i}" aria-pressed="false">${ko} ${s}</button>`).join(''));
    bar.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => show(+b.dataset.r)));
    show(0);
    return { show };
  };
})();
