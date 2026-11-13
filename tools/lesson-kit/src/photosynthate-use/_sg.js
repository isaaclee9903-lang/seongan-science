/* ===== 광합성산물의 저장과 이용: 작물 사진과 네 칸 창고 SG =====
   작물 사진(media/crop-*.png)은 이 수업을 위해 만든 3D 모형(_crops3.js)을 찍은 것이에요(교과서 사진을 쓰지 않음). */
window.SG = (() => {
  'use strict';
  const CROPS = [
    { k: 'cane', n: '사탕수수', organ: '줄기', form: '설탕' }, { k: 'potato', n: '감자', organ: '줄기', form: '녹말' },
    { k: 'beet', n: '사탕무', organ: '뿌리', form: '설탕' }, { k: 'sweet', n: '고구마', organ: '뿌리', form: '녹말' },
    { k: 'corn', n: '옥수수', organ: '열매', form: '녹말' }, { k: 'grape', n: '포도', organ: '열매', form: '포도당' },
    { k: 'sesame', n: '참깨', organ: '씨앗', form: '지방' }, { k: 'pea', n: '완두', organ: '씨앗', form: '단백질' },
  ];
  const by = (k) => CROPS.find((c) => c.k === k);
  const src = (k) => `media/crop-${k}.png`;
  const josa = (w) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c % 28 && c % 28 !== 8 ? '으로' : '로'; };
  function cropIn(host, k) { host.innerHTML = `<img class="cropimg" src="${src(k)}" alt="${by(k).n}" draggable="false">`; return host.firstChild; }
  /* 네 칸 창고(그림 Ⅴ-5 형식). o.all: 모두 채운 상태 */
  function shelf(host, o = {}) {
    const ROOMS = ['줄기', '뿌리', '열매', '씨앗'];
    host.innerHTML = `<div class="shelf">${ROOMS.map((r) => `<div class="room" data-r="${r}"><b class="rt">${r}에</b><div class="slots"><div class="slot2"></div><div class="slot2"></div></div></div>`).join('')}</div>`;
    const put = (k, anim) => {
      const c = by(k), room = host.querySelector(`.room[data-r="${c.organ}"]`), sl = Array.from(room.querySelectorAll('.slot2')).find((s) => !s.dataset.k);
      if (!sl) return; sl.dataset.k = k;
      sl.innerHTML = `<img class="cropimg" src="${src(k)}" alt="" draggable="false"><span class="cn">${c.n}</span><span class="cf"><b>${c.form}</b>${josa(c.form)} 저장</span>`;
      if (anim) { sl.classList.add('pop'); setTimeout(() => sl.classList.remove('pop'), 700); }
    };
    if (o.all) CROPS.forEach((c) => put(c.k));
    return { reveal: (k) => put(k, true), host };
  }
  return { CROPS, by, src, josa, cropIn, shelf };
})();
