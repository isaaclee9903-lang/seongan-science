/* ===== 블록: 칸 안의 작은 탭 (한 화면 배치) ===== */
(() => {
  'use strict';
  try {
    const groups = Array.from(document.querySelectorAll('.stabs'));
    groups.forEach((tb) => {
      const bs = Array.from(tb.querySelectorAll('button[data-s]'));
      const go = (id) => bs.forEach((b) => {
        const on = b.dataset.s === id, p = document.getElementById(b.dataset.s);
        b.setAttribute('aria-selected', String(on));
        if (p) { p.classList.toggle('off', !on); p.setAttribute('aria-hidden', String(!on)); }
      });
      bs.forEach((b) => b.addEventListener('click', () => go(b.dataset.s)));
      tb.goSub = go;
      go((bs.find((b) => b.getAttribute('aria-selected') === 'true') || bs[0]).dataset.s);
    });
    window.FIT = { go: (id) => { const b = document.querySelector(`.stabs button[data-s="${id}"]`); if (b) b.closest('.stabs').goSub(id); } };
  } catch (err) { window.SM_err ? window.SM_err('칸 안의 탭', err) : console.error(err); }
})();
