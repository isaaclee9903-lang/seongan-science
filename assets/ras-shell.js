// 라스 수업 껍데기 공통 손질 (모든 lessons/<수업>/index.html 끝에서 불러온다)
// 1. 세로 화면에서 탭 줄이 넘치면 탭을 좁혀 한 줄에 다 보이게 한다
// 2. 이 수업 이름을 기억해 두어, 허브로 돌아가면 이 수업이 있는 단원을 펼쳐 보여 준다
// 3. 마지막 탭(정리) 페이지 끝에 '수업 목록으로 · 다음 수업 · 이 단원 한자어' 길을 붙인다
//    다음 수업 차례는 허브(index.html)의 LESSONS·TABS를 그대로 읽어 정한다 (목차는 허브 한 곳에서만 고친다)
(function () {
  var lesson = (location.pathname.match(/\/lessons\/([^/]+)\//) || [])[1];

  // ── 1. 세로 탭 줄 ──
  try {
    var st = document.createElement('style');
    st.textContent =
      'nav.ras-tight{gap:3px}' +
      'nav.ras-tight .tab{padding:0 9px;gap:6px;font-size:14px}' +
      'nav.ras-tighter .tab .n{display:none}' +
      'nav.ras-tighter .tab{padding:0 10px}';
    document.head.appendChild(st);
    var nav = document.querySelector('header nav');
    var fit = function () {
      if (!nav) return;
      nav.classList.remove('ras-tight', 'ras-tighter');
      if (nav.scrollWidth > nav.clientWidth + 1) nav.classList.add('ras-tight');
      if (nav.scrollWidth > nav.clientWidth + 1) nav.classList.add('ras-tighter');
      var on = nav.querySelector('.tab[aria-selected="true"]');
      if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    };
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    addEventListener('resize', fit);
  } catch (e) { if (window.console) console.warn('탭 줄', e); }

  // ── 2. 허브가 이 수업을 찾아 펼치도록 기억 ──
  try { if (lesson) sessionStorage.setItem('ras-last', lesson); } catch (e) {}

  // ── 3. 마지막 탭 끝의 길 ──
  if (!lesson) return;
  var tabs = document.querySelectorAll('header .tab[data-page]');
  if (tabs.length < 2) return;
  var lastId = tabs[tabs.length - 1].getAttribute('data-page');
  var frame = document.querySelector('iframe[data-page="' + lastId + '"]');
  if (!frame) return;

  function catalog() {
    return fetch('../../index.html', { cache: 'no-cache' }).then(function (r) { return r.text(); }).then(function (t) {
      var a = t.match(/const LESSONS = (\{[\s\S]*?\n\});/), b = t.match(/const TABS = (\[[\s\S]*?\n\]);/);
      if (!a || !b) throw new Error('허브 목차를 읽지 못함');
      return { L: new Function('return ' + a[1])(), T: new Function('return ' + b[1])() };
    });
  }

  function plan(c) {
    var out = { next: null, hanja: null };
    for (var i = 0; i < c.T.length; i++) {
      var tab = c.T[i], units = tab.units || [];
      for (var j = 0; j < units.length; j++) {
        var k = units[j].lessons.indexOf(lesson);
        if (k < 0) continue;
        if (units[j].no === '시험') return null;          // 시험 정리본은 한 화면 틀이라 붙이지 않는다(자체 넘김 단추가 있음)
        // 다음 수업: 같은 단원의 다음 → 없으면 같은 학년의 다음 단원 첫 수업(시험 대비는 건너뜀)
        var nx = units[j].lessons[k + 1];
        for (var u = j + 1; !nx && u < units.length; u++) if (units[u].no !== '시험') nx = units[u].lessons[0];
        if (nx && c.L[nx]) out.next = { id: nx, title: c.L[nx].title, href: c.L[nx].href || ('lessons/' + nx + '/') };
        // 이 단원 한자어: 한자어 탭에 같은 이름의 단원이 있으면
        var hj = c.T.filter(function (t) { return t.id === 'hanja'; })[0];
        if (hj) hj.units.forEach(function (hu) { if (hu.name === units[j].name && c.L[hu.lessons[0]]) out.hanja = c.L[hu.lessons[0]].href; });
        return out;
      }
    }
    return out;
  }

  var arrow = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var CSS =
    '.ras-end{box-sizing:border-box;max-width:1100px;margin:28px auto 0;padding:20px 16px 36px;border-top:1px solid #dde6ee;' +
    'display:flex;flex-wrap:wrap;gap:10px;font-family:"Pretendard",-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif}' +
    '.ras-end a{box-sizing:border-box;display:flex;align-items:center;gap:10px;min-height:52px;padding:8px 18px;border-radius:12px;' +
    'border:1px solid #d3dfeb;background:#fff;color:#14263b;text-decoration:none;font-size:15px;font-weight:700;line-height:1.35}' +
    '.ras-end a:focus-visible{outline:3px solid rgba(14,99,179,.35);outline-offset:2px}' +
    '.ras-end a.next{flex:1 1 320px;min-width:0;background:#0e63b3;border-color:#0e63b3;color:#fff;justify-content:space-between}' +
    '.ras-end a.next span{min-width:0;display:flex;flex-direction:column}' +
    '.ras-end a.next small{font-size:12.5px;font-weight:600;opacity:.85}' +
    '.ras-end a.next b{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.ras-end a svg{flex:none}';

  var info = null;
  function inject() {
    var d; try { d = frame.contentDocument; } catch (e) { return; }
    if (!d || !d.body || d.querySelector('.ras-end') || !info) return;
    var s = d.createElement('style'); s.textContent = CSS; d.head.appendChild(s);
    var box = d.createElement('nav'); box.className = 'ras-end'; box.setAttribute('aria-label', '다음에 갈 곳');
    var h = '<a href="../../" target="_top">수업 목록으로</a>';
    if (info.hanja && !d.querySelector('a[href*="hanja"]')) h += '<a href="../../' + info.hanja + '" target="_top">이 단원 한자어 풀어 보기</a>';
    if (info.next) h += '<a class="next" href="../../' + info.next.href + '" target="_top"><span><small>다음 수업</small><b></b></span>' + arrow + '</a>';
    box.innerHTML = h;
    if (info.next) box.querySelector('a.next b').textContent = info.next.title;
    d.body.appendChild(box);
  }

  catalog().then(function (c) { info = plan(c); inject(); }).catch(function (e) { if (window.console) console.warn('다음 수업 길', e); });
  frame.addEventListener('load', inject);
})();
