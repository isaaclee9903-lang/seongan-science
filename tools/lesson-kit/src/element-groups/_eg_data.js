/* ===== 같은 족 원소 수업 자료 (교과서 146~148쪽, 161쪽 대단원 문제 5) =====
   EG.D[원소] : 이름·양성자수·족·주기와 원소 카드 네 칸의 바른 답.
   '그 밖의 특징'에서 교과서에 없는 조사 내용(무름·보관·쓰임)은 curriculum 문서 '교과서 밖 조사 내용'에 적어 둠. */
window.EG = window.EG || {};
EG.ORDER = ['Na', 'He', 'Li', 'Ar', 'K', 'Ne']; // 교과서 146쪽 순서
EG.D = {
  Li: { ko: '리튬', en: 'Lithium', z: 3, g: 1, p: 2, kind: 'metal', state: '고체', water: 'hard', stab: 'react',
    more: ['칼로 자를 수 있을 만큼 물러요.', '자른 면은 은백색 광택이 나다가 공기 중에서 곧 흐려져요.', '석유 속에 넣어 보관해요.'] },
  Na: { ko: '나트륨', en: 'Sodium', z: 11, g: 1, p: 3, kind: 'metal', state: '고체', water: 'hard', stab: 'react',
    more: ['칼로 쉽게 잘릴 만큼 물러요.', '자른 면은 은백색 광택이 나다가 공기 중에서 곧 흐려져요.', '석유 속에 넣어 보관해요.'] },
  K: { ko: '칼륨', en: 'Potassium', z: 19, g: 1, p: 4, kind: 'metal', state: '고체', water: 'hard', stab: 'react',
    more: ['칼로 아주 쉽게 잘릴 만큼 물러요.', '자른 면의 은백색 광택이 공기 중에서 금방 흐려져요.', '물과 만나면 불꽃이 일기도 해요.'] },
  He: { ko: '헬륨', en: 'Helium', z: 2, g: 18, p: 1, kind: 'gas', state: '기체', water: 'none', stab: 'stable',
    more: ['색과 냄새가 없는 기체예요.', '공기보다 가벼워 비행선이나 풍선에 넣어요.'] },
  Ne: { ko: '네온', en: 'Neon', z: 10, g: 18, p: 2, kind: 'gas', state: '기체', water: 'none', stab: 'stable',
    more: ['색과 냄새가 없는 기체예요.', '유리관에 넣고 전기를 흘리면 붉은빛을 내요. 그래서 간판에 써요.'] },
  Ar: { ko: '아르곤', en: 'Argon', z: 18, g: 18, p: 3, kind: 'gas', state: '기체', water: 'none', stab: 'stable',
    more: ['색과 냄새가 없는 기체예요.', '공기 속에 조금 들어 있어요.', '전구 속에 넣기도 해요.'] },
};
// 원소 카드 칸(교과서 146쪽 카드 항목과 말풍선 질문)
EG.ROWS = [
  { k: 'state', t: '실온에서 물질의 상태', q: '실온에서 고체, 액체, 기체 중 어떤 상태로 존재할까?', opts: [['고체', '고체'], ['액체', '액체'], ['기체', '기체']] },
  { k: 'water', t: '물과의 반응', q: '물에 넣었을 때 어떤 변화가 나타날까?', opts: [['hard', '격렬히 반응함'], ['none', '거의 반응하지 않음']] },
  { k: 'stab', t: '원소의 안정성', q: '다른 원소와 만났을 때 반응이 잘 일어날까?', opts: [['react', '반응이 잘 일어남'], ['stable', '거의 반응하지 않음']] },
  { k: 'more', t: '그 밖의 특징', q: '단단하고 무른 정도는 어떠할까?' },
];
EG.ANS = (el, k) => { const d = EG.D[el], r = EG.ROWS.find((x) => x.k === k); if (k === 'more') return d.more[0]; const o = r.opts.find((x) => x[0] === d[k]); return o ? o[1] : d[k]; };
// 1~20번 원소(교과서 145쪽 주기율표 범위). [기호, 이름, 영어 이름, 족, 주기]
EG.EL20 = [
  ['H', '수소', 'Hydrogen', 1, 1], ['He', '헬륨', 'Helium', 18, 1], ['Li', '리튬', 'Lithium', 1, 2], ['Be', '베릴륨', 'Beryllium', 2, 2],
  ['B', '붕소', 'Boron', 13, 2], ['C', '탄소', 'Carbon', 14, 2], ['N', '질소', 'Nitrogen', 15, 2], ['O', '산소', 'Oxygen', 16, 2],
  ['F', '플루오린', 'Fluorine', 17, 2], ['Ne', '네온', 'Neon', 18, 2], ['Na', '나트륨', 'Sodium', 1, 3], ['Mg', '마그네슘', 'Magnesium', 2, 3],
  ['Al', '알루미늄', 'Aluminium', 13, 3], ['Si', '규소', 'Silicon', 14, 3], ['P', '인', 'Phosphorus', 15, 3], ['S', '황', 'Sulfur', 16, 3],
  ['Cl', '염소', 'Chlorine', 17, 3], ['Ar', '아르곤', 'Argon', 18, 3], ['K', '칼륨', 'Potassium', 1, 4], ['Ca', '칼슘', 'Calcium', 2, 4],
];
EG.GROUPS = [1, 2, 13, 14, 15, 16, 17, 18]; // 교과서 147쪽 표에 보이는 족(3~12족은 '…')
