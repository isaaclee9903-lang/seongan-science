/* ===== 원소 수업 자료: 교과서 140~141쪽에 나온 원소 기호 18개와 그림 Ⅳ-3 화학식 6개 =====
   EL.SYM [기호, 이름, 라틴어나 영어 이름, '영어'|'라틴어'],  EL.FORMULA { id, parts, name, els } */
window.EL = window.EL || {};
(() => {
  const EL = window.EL;
  EL.SYM = [
    ['H', '수소', 'Hydrogen', '영어'], ['He', '헬륨', 'Helium', '영어'], ['Li', '리튬', 'Lithium', '영어'], ['Be', '베릴륨', 'Beryllium', '영어'],
    ['C', '탄소', 'Carbon', '영어'], ['N', '질소', 'Nitrogen', '영어'], ['O', '산소', 'Oxygen', '영어'], ['Ne', '네온', 'Neon', '영어'],
    ['Na', '나트륨', 'Natrium', '라틴어'], ['Mg', '마그네슘', 'Magnesium', '영어'], ['Al', '알루미늄', 'Aluminium', '영어'], ['Si', '규소', 'Silicon', '영어'],
    ['S', '황', 'Sulfur', '영어'], ['Cl', '염소', 'Chlorine', '영어'], ['Ca', '칼슘', 'Calcium', '영어'], ['Fe', '철', 'Ferrum', '라틴어'],
    ['Cu', '구리', 'Cuprum', '라틴어'], ['Hg', '수은', 'Hydrargyrum', '라틴어'],
  ];
  EL.FORMULA = [
    { id: 'NH3', parts: [['N', ''], ['H', '3']], name: '암모니아', els: ['N', 'H'] },
    { id: 'NaCl', parts: [['Na', ''], ['Cl', '']], name: '염화 나트륨', els: ['Na', 'Cl'] },
    { id: 'H2O', parts: [['H', '2'], ['O', '']], name: '물', els: ['H', 'O'] },
    { id: 'CH4', parts: [['C', ''], ['H', '4']], name: '메테인', els: ['C', 'H'] },
    { id: 'CO2', parts: [['C', ''], ['O', '2']], name: '이산화 탄소', els: ['C', 'O'] },
    { id: 'CO', parts: [['C', ''], ['O', '']], name: '일산화 탄소', els: ['C', 'O'] },
  ];
  // 입자 모형 색(EL3.PT와 같은 값)
  EL.COL = { H: '#f4f6f8', He: '#8fe3ef', C: '#3b4048', N: '#3d6fe0', O: '#e2402f', Na: '#9c5bd6', Cl: '#3fbf5a', Si: '#e6b98a', Al: '#b9bfca', Cu: '#d0773f', S: '#f2cf33', Fe: '#8a5a3c' };
  EL.fhtml = (f) => f.parts.map(([s, n]) => s + (n ? `<sub>${n}</sub>` : '')).join('');
  EL.symName = (s) => (EL.SYM.find((x) => x[0] === s) || [s, s])[1];
  EL.dot = (e) => `<i class="pdot" style="background:${EL.COL[e] || '#999'};border:1px solid rgba(20,38,59,.2)"></i>`;
})();
