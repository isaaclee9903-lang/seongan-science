/* ===== 읽기 그림: 원소 기호 규칙 움직임, 그림 Ⅳ-2 원소 카드 =====
   EL.rule(box, bar)   이름 글자가 떠올라 기호가 되는 모습(교과서 예 4가지)
   EL.cards(box, syms) 원소 카드(사진은 3D로 구운 media/sm-*.png) */
window.EL = window.EL || {};
(() => {
  const EL = window.EL;
  const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const EX = [['H', '수소', 'Hydrogen', [0]], ['C', '탄소', 'Carbon', [0]], ['He', '헬륨', 'Helium', [0, 1]], ['Cl', '염소', 'Chlorine', [0, 2]]];
  EL.rule = function (box, bar) {
    let timers = [];
    function show(i) {
      const [sym, ko, nm, idx] = EX[i];
      box.innerHTML = `<div class="rk">${ko}</div><div class="rw">${nm.split('').map((c, j) => `<span data-j="${j}">${c}</span>`).join('')}</div><div class="ra">→</div><div class="rs">${sym.split('').map((c) => `<i>${c}</i>`).join('')}</div><div class="rn">${idx.length === 1 ? '규칙 ① 첫 글자를 대문자로' : `규칙 ② 첫 글자가 같은 ${sym[0] === 'H' ? '수소(H)' : '탄소(C)'}가 있어서 중간 글자를 소문자로`}</div>`;
      timers.forEach(clearTimeout); timers = [];
      const spans = box.querySelectorAll('.rw span'), out = box.querySelectorAll('.rs i');
      idx.forEach((j, n) => { timers.push(setTimeout(() => { spans[j].classList.add('on'); out[n].classList.add('on'); }, REDUCE ? 0 : 350 + n * 550)); });
      bar.querySelectorAll('[data-r]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.r === i)));
    }
    bar.insertAdjacentHTML('afterbegin', EX.map(([s, ko], i) => `<button type="button" data-r="${i}" aria-pressed="false">${ko} ${s}</button>`).join(''));
    bar.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => show(+b.dataset.r)));
    show(0);
    return { show };
  };
  EL.cards = function (box, syms) {
    const rows = [syms.slice(0, Math.ceil(syms.length / 2)), syms.slice(Math.ceil(syms.length / 2))];
    box.innerHTML = rows.map((r) => `<div class="crow">${r.map((s) => `<div class="ecard"><img src="media/sm-${s}.png" alt="" loading="lazy"><b>${s}</b><span>${EL.symName(s)}</span></div>`).join('')}</div>`).join('');
  };
})();
