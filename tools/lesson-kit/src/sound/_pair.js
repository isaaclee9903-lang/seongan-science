/* ===== PAIR: 두 소리를 나란히 기록해 비교하는 칸 (읽기·정리 페이지용) =====
   PAIR(host, [cfgA, cfgB], { win, cols }) — cfg: { id, m, vel, lab, norm }
   버튼을 누르면 소리가 나고, 0.65초 뒤 파형이 모눈에 남아요. 처음부터 파형을 보여 주려면 { pre: true } */
(() => {
  'use strict';
  const PLAY = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z"/></svg>';
  window.PAIR = function (host, cfgs, o) {
    o = Object.assign({ win: 0.008, rows: 4, pre: false, amp: 1 }, o || {});
    host.classList.add('pair');
    host.innerHTML = cfgs.map((c, i) => `<div class="rec" data-i="${i}"><div class="rh"><b>${c.lab}</b><span class="sp"></span><span class="st">${o.pre ? '' : '기록 전'}</span><button type="button" class="pbtn">${PLAY}<span>${o.pre ? '듣기' : '소리 내기'}</span></button></div><div class="scope"></div></div>`).join('');
    const tag = 'p' + Math.random().toString(36).slice(2, 7);
    const R = cfgs.map((c, i) => {
      const el = host.children[i];
      const sc = SND.scope(el.querySelector('.scope'), { win: o.win, rows: o.rows, amp: o.amp, only: (v) => v.box === tag + i });
      return { el, sc, c, done: false };
    });
    const out = { R, onDone: null };
    const snap = (r) => r.sc.freeze(SND.shot(r.c.id, r.c.m, SND.VEL[r.c.vel], o.win, SND.N, r.c.norm));
    async function go(i) {
      const r = R[i], c = r.c, st = r.el.querySelector('.st');
      if (!SND.ready(c.id)) { st.textContent = '불러오는 중…'; try { await SND.load(c.id); } catch (e) { st.textContent = '소리 파일을 불러오지 못했어요'; return; } }
      const v = SND.play(c.id, c.m, SND.VEL[c.vel]); if (!v) return; v.box = tag + i;
      if (c.norm) { const ref = SND.shot(c.id, c.m, 1, o.win, 200); let q = 0; ref.forEach((y) => (q += y * y)); v.gain = c.norm / (Math.sqrt(q / ref.length) || 1); }
      r.sc.clear(); st.textContent = '소리 나는 중';
      clearTimeout(r.t);
      r.t = setTimeout(() => { snap(r); st.textContent = '기록됨'; r.el.classList.add('done'); r.done = true; if (out.onDone && R.every((x) => x.done)) out.onDone(); }, 650);
    }
    R.forEach((r, i) => r.el.querySelector('.pbtn').addEventListener('click', () => go(i)));
    if (o.pre) Promise.all(cfgs.map((c) => SND.load(c.id))).then(() => R.forEach((r) => { snap(r); r.done = true; r.el.classList.add('done'); })).catch(() => {});
    out.mark = (m) => R.forEach((r) => r.sc.mark(m));
    out.fill = () => Promise.all(cfgs.map((c) => SND.load(c.id))).then(() => R.forEach((r) => { snap(r); r.done = true; r.el.classList.add('done'); r.el.querySelector('.st').textContent = '기록됨'; }));
    return out;
  };
})();
