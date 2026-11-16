/* ===== 그림 Ⅳ-1 물체판 (3D로 구운 사진 + 돌려 보는 입자 모형) =====
   EL3.ITEMS         물체 10가지 { id, name, kind:'el'|'cp', els, etc }
   EL3.board(host, o) 위: 물체 사진 10장, 아래: 입자 돋보기(3D) + 입자 이름
     .select(id) / .classify('el'|'cp') / .group() / .reset() / onSelect(it, m)
     o.grouped: 처음부터 그림 Ⅳ-1처럼 모아 놓기(읽기 그림)  */
(() => {
  EL3.ITEMS = [
    { id: 'balloon', name: '헬륨 풍선', kind: 'el', els: ['He'] },
    { id: 'plastic', name: '플라스틱', kind: 'cp', els: ['C', 'H', 'O'], etc: true },
    { id: 'salt', name: '염화 나트륨', kind: 'cp', els: ['Cl', 'Na'] },
    { id: 'copper', name: '구리선', kind: 'el', els: ['Cu'] },
    { id: 'soap', name: '비누', kind: 'cp', els: ['C', 'H', 'O', 'Na'], etc: true },
    { id: 'diamond', name: '다이아몬드', kind: 'el', els: ['C'] },
    { id: 'water', name: '물', kind: 'cp', els: ['H', 'O'] },
    { id: 'glass', name: '유리', kind: 'cp', els: ['Si', 'O'], etc: true },
    { id: 'capsule', name: '알루미늄 커피 캡슐', kind: 'el', els: ['Al'] },
    { id: 'dryice', name: '드라이아이스', kind: 'cp', els: ['C', 'O'] },
  ];
  const PT = EL3.PT;
  EL3.names = (it) => it.els.map((e) => PT[e].n).join(', ') + (it.etc ? ' 등' : '');
  EL3.legend = (els, etc) => els.map((e) => `<span><i style="background:${PT[e].c}"></i>${PT[e].n}</span>`).join('') + (etc ? '<span>등</span>' : '');

  EL3.board = function (host, o = {}) {
    host.classList.add('board');
    host.innerHTML = `<div class="bgrid"><div class="bh bh1"><b>원소</b> 한 종류의 입자로 이루어진 물질</div><div class="bh bh2"><b>화합물</b> 두 종류 이상의 입자가 모여 만들어진 물질</div></div>
      <div class="blow"><div class="pview blens"></div><div class="binfo"><div class="bt">입자 돋보기</div><div class="pkey"></div><div class="bk">위의 물체를 누르면 속의 입자가 보여요</div></div></div>`;
    const grid = host.querySelector('.bgrid');
    const items = EL3.ITEMS.map((it) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'bt-it'; b.dataset.id = it.id;
      b.innerHTML = `<img src="media/ob-${it.id}.png" alt="" draggable="false"><span class="nm">${it.name}</span><span class="tg"></span>`;
      grid.appendChild(b); return { it, el: b, done: !!o.grouped };
    });
    const st = { sel: null, grouped: false };
    let VW = null;
    const api = { st, items, onSelect: null, names: EL3.names };
    const info = host.querySelector('.binfo');
    function paint() {
      items.forEach((m) => {
        m.el.classList.toggle('on', st.sel === m); m.el.classList.toggle('done', m.done);
        m.el.querySelector('.tg').innerHTML = m.done ? (st.grouped ? EL3.names(m.it) : (m.it.kind === 'el' ? '원소' : '화합물')) : '';
      });
      const m = st.sel;
      if (!m) { info.querySelector('.bt').textContent = '입자 돋보기'; info.querySelector('.pkey').innerHTML = ''; info.querySelector('.bk').innerHTML = '위의 물체를 누르면 속의 입자가 보여요'; return; }
      info.querySelector('.bt').textContent = m.it.name;
      info.querySelector('.pkey').innerHTML = EL3.legend(m.it.els, m.it.etc);
      info.querySelector('.bk').innerHTML = m.done ? `입자의 종류: <b>${m.it.els.length === 1 ? '한 종류' : '두 종류 이상'}</b> → <b>${m.it.kind === 'el' ? '원소' : '화합물'}</b>` : '입자가 몇 종류인지 세어 봐요. 손가락으로 돌려 볼 수 있어요.';
    }
    api.select = (id) => {
      const m = items.find((q) => q.it.id === id); st.sel = m || null;
      if (m) { if (!VW) VW = EL3.viewer(host.querySelector('.blens'), { spin: 0.3, margin: 1.05 }); VW.show(m.it.id); }
      paint(); api.onSelect && api.onSelect(m ? m.it : null, m);
    };
    api.classify = (kind) => {
      const m = st.sel; if (!m) return false;
      if (m.it.kind !== kind) { m.el.classList.remove('shake'); void m.el.offsetWidth; m.el.classList.add('shake'); return false; }
      m.done = true; paint(); return true;
    };
    // 그림 Ⅳ-1처럼 원소는 왼쪽, 화합물은 오른쪽으로 모으기(자리 이동은 transform으로)
    api.group = (animate = true) => {
      const first = items.map((m) => m.el.getBoundingClientRect());
      st.grouped = true; host.classList.add('grouped');
      let e = 0, c = 0;
      items.forEach((m) => { if (m.it.kind === 'el') { m.el.style.gridColumn = String(1 + (e % 2)); m.el.style.gridRow = String(2 + Math.floor(e / 2)); e++; } else { m.el.style.gridColumn = String(3 + (c % 3)); m.el.style.gridRow = String(2 + Math.floor(c / 3)); c++; } });
      paint();
      if (!animate || EL3.REDUCE) return;
      items.forEach((m, i) => { const l = m.el.getBoundingClientRect(), f = first[i]; m.el.animate([{ transform: `translate(${f.left - l.left}px,${f.top - l.top}px)` }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.3,.7,.2,1)' }); });
    };
    api.reset = () => { items.forEach((m) => { m.done = false; m.el.style.gridColumn = m.el.style.gridRow = ''; }); st.grouped = false; host.classList.remove('grouped'); st.sel = null; paint(); };
    items.forEach((m) => m.el.addEventListener('click', () => api.select(m.it.id)));
    if (o.grouped) api.group(false);
    paint();
    return api;
  };
  EL3.REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
})();
