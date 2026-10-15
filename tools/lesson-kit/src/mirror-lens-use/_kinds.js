/* ===== 거울과 렌즈 다섯 종류 (옆에서 본 모습 아이콘) ===== */
window.KINDS = [
  { id: 'plane', name: '평면거울' },
  { id: 'convex-mirror', name: '볼록 거울' },
  { id: 'concave-mirror', name: '오목 거울' },
  { id: 'convex-lens', name: '볼록 렌즈' },
  { id: 'concave-lens', name: '오목 렌즈' },
];
window.KICON = (() => {
  const back = (d) => `<path d="${d}" fill="none" stroke="#8a96a3" stroke-width="5" stroke-dasharray="1.6 2.6"/>`;
  const face = (d) => `<path d="${d}" fill="none" stroke="#14263b" stroke-width="3" stroke-linecap="round"/>`;
  const glass = (d) => `<path d="${d}" fill="#cfe6f6" stroke="#0e63b3" stroke-width="2"/>`;
  const s = (b) => `<svg viewBox="0 0 34 46" aria-hidden="true">${b}</svg>`;
  return {
    'plane': s(back('M20 4V42') + face('M16 4V42')),
    'convex-mirror': s(back('M24 4Q10 23 24 42') + face('M20 4Q6 23 20 42')),
    'concave-mirror': s(back('M18 4Q32 23 18 42') + face('M14 4Q28 23 14 42')),
    'convex-lens': s(glass('M17 3Q29 23 17 43Q5 23 17 3Z')),
    'concave-lens': s(glass('M9 3H25Q18 23 25 43H9Q16 23 9 3Z')),
  };
})();
