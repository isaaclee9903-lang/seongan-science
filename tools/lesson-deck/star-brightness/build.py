"""별의 밝기 수업 발표 조립. 저장소 맨 위에서: python tools/lesson-deck/star-brightness/build.py

라스 수업 lessons/star-brightness의 페이지 네 개를 복사해 '발표 그림 페이지'로 만든다.
주소 끝에 ?fig=이름 을 붙이면 그 그림 하나만 화면 가득 보이고, 발표 틀(index.html)이
window.DECKFIG.set(상태)로 장마다 그림 상태를 바꾼다. 그림 그리는 코드는 라스 수업 그대로다.
그림 페이지는 <base>로 lessons/star-brightness/를 가리켜 하늘 자료(sky/)를 그대로 쓴다.
  fig-reading.html  ?fig=hero(겨울철 하늘) · lad(1~6 등급 계단) · scale(등급 눈금) · lamp(같은 가로등)
  fig-sky.html      ?fig=sky(등급 하늘 지도) · ladder(밝기 계단과 빛 알갱이 상자)
  fig-light.html    ?fig=light(3D 빛이 퍼지는 모습) · street(3D 같은 가로등, 다른 거리)
  fig-ten.html      ?fig=ten(3D 10 pc 구, 지구에서 본 하늘)
deck.tpl.html은 그대로 index.html로 복사한다(장 내용·넘기기·영상)."""
import os
SP = os.path.dirname(os.path.abspath(__file__))
SRC = 'lessons/star-brightness/'
OUT = 'presentations/star-brightness/'
os.makedirs(OUT, exist_ok=True)


def rep(a, b, s, n=1):
    assert s.count(a) == n, (a[:60], s.count(a))
    return s.replace(a, b)


def read(p):
    return open(p, encoding='utf-8').read()


def write(p, s):
    open(OUT + p, 'w', encoding='utf-8', newline='\n').write(s)
    print(p, len(s))


# 모든 그림 페이지에 공통으로 넣는 것: ?fig가 있으면 다른 것은 숨기고 그림 칸(dfStage)만 보여 줌
CORE = """
<style>
  html.deckfig,html.deckfig body{height:100%;min-height:0!important;overflow:hidden!important;margin:0;padding:0}
  html.deckfig body>*:not(#dfStage){display:none!important}
  #dfStage{display:none}
  html.deckfig #dfStage{display:block;position:fixed;inset:0;overflow:hidden}
  #dfStage>svg{display:block;width:100%;height:100%}
  #dfStage>canvas{display:block;width:100%!important;height:100%!important;aspect-ratio:auto!important;border-radius:0!important}
  #dfStage>.gl-host{position:absolute!important;inset:0;width:auto!important;height:auto!important;min-height:0!important;border-radius:0}
  #dfStage .vt,#dfStage .fail3d:not(.show){display:none!important}
  #dfStage .lb{font-size:20px!important;padding:5px 12px!important;border-radius:11px!important}
  #dfStage .skybox{width:36%!important;max-width:none!important;border-radius:18px;bottom:52px!important}
  #dfStage .skybox .it{font-size:17px!important;padding:4px 10px!important}
  #dfStage .legend{font-size:16px!important;top:12px;bottom:auto!important}
</style>
<script>
/* 발표용 그림 칸: 발표 틀(presentations/star-brightness/index.html)이 DECKFIG.set(상태)를 불러요 */
window.DECKFIG = window.DECKFIG || {};
(function () {
  'use strict';
  try {
    var f = new URLSearchParams(location.search).get('fig');
    if (!f) return;
    document.documentElement.classList.add('deckfig');
    var st = document.createElement('div'); st.id = 'dfStage'; st.dataset.fig = f; document.body.appendChild(st);
    var $ = function (s) { return document.querySelector(s); }, $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
    function move(sel, bg) { var n = $(sel); st.appendChild(n); n.removeAttribute('style'); st.style.background = bg; return n; }
    var FIGS = {};
    /*@@FIGS@@*/
    var D = FIGS[f];
    if (!D) throw new Error('없는 그림 이름: ' + f);
    D.init(st, $, $$);
    window.DECKFIG.f = f;
    window.DECKFIG.set = function (s) { try { D.set(s || {}, $, $$); } catch (e) { (window.SM_err || window.RD_err || console.error)('발표 그림 바꾸기', e); } };
    // 3D·하늘 자료를 다 불러온 뒤에 발표 틀에 '준비됨'을 알려요
    var tries = 0;
    (function wait() {
      if (D.ready && !D.ready() && tries++ < 600) { setTimeout(wait, 50); return; }
      window.DECKFIG.ok = true;
      try { parent.postMessage({ type: 'deckfig-ready', fig: f }, '*'); } catch (e) {}
    })();
  } catch (err) { (window.SM_err || window.RD_err || console.error)('발표 그림 칸', err); }
})();
</script>
"""


SHIM = """<head>
<base href="../../lessons/star-brightness/">
<script>/* 화면 검사용: 주소 끝에 raf=timer가 있으면 창이 가려져 있어도 그림이 움직여요 */
if (/[?&]raf=timer/.test(location.search)) window.requestAnimationFrame = function (cb) { return setTimeout(function () { cb(performance.now()); }, 16); };</script>"""


def inject(src, figs):
    src = rep('<head>', SHIM, src)
    return rep('</body>', CORE.replace('/*@@FIGS@@*/', figs) + '</body>', src)


# ---------- 읽기 페이지의 그림 넷 ----------
FIG_READING = r"""
    FIGS.hero = { init: function () { move('#heroCv', '#050a17'); }, set: function () {} };
    FIGS.lad = { init: function () { move('#ladCv', '#050a17'); }, set: function () {} };
    FIGS.scale = { init: function () { move('#scaleSvg', '#0b1328'); }, set: function () {} };
    FIGS.lamp = { init: function () { var s = move('#lampSvg', '#060b1a'); s.setAttribute('preserveAspectRatio', 'xMidYMid slice'); }, set: function () {} };
"""
src = read(SRC + 'reading.html')
# 큰 화면에서 읽히도록 별 이름 글씨를 키움
src = rep("c.font = '800 13px Pretendard, sans-serif'; c.fillStyle = '#ffe6a8';", "c.font = '800 20px Pretendard, sans-serif'; c.fillStyle = '#ffe6a8';", src)
# 등급 눈금: '밝다'가 '시리우스 −1.5' 이름표와 겹치지 않게 위로 올림
src = rep('<text x="40" y="34"', '<text x="40" y="20"', src)
src = rep('<text x="680" y="34"', '<text x="680" y="20"', src)
write('fig-reading.html', inject(src, FIG_READING))

# ---------- 등급 하늘 지도 · 밝기 계단 ----------
FIG_SKY = r"""
    // 하늘 지도: place 'cma'|'ori'|'uma', tel 천체 망원경, lim 보이는 등급(맨눈 -1~6, 망원경 ~8), pick 'sirius'|'mirzam'
    var PICK = { sirius: { i: 0, m: -1.5, name: '시리우스' }, mirzam: { i: 47, m: 2.0, name: '미르잠' } };
    FIGS.sky = {
      init: function () { move('#host', '#060c1c'); },
      ready: function () { return !!window.SM.ok3d; },
      set: function (s, $) {
        var S = window.SM;
        var b = $('#goTo [data-go="' + (s.place || 'cma') + '"]'); if (b && !b.classList.contains('sel')) b.click();
        var tel = !!s.tel; if (tel !== !!S.tel) $(tel ? '#vTel' : '#vEye').click();
        var lim = s.lim == null ? (tel ? 8 : 6) : s.lim;
        if (lim !== S.lim) { var r = $('#rLim'); r.value = lim; r.dispatchEvent(new Event('input')); }
        if (s.pick) S.showPick(PICK[s.pick]); else S.pick = null;
        // zoom: 처음 크기를 1로 한 확대 배율
        var z = s.zoom || 1, cur = Celestial.zoomBy(); if (cur && Math.abs(cur - z) > 0.03) Celestial.zoomBy(z / cur);
        S.skyRedraw();
      }
    };
    // 밝기 계단: a, b = 비교할 두 등급
    FIGS.ladder = {
      init: function ($s, $) { move('#host', '#050a17'); $('#mB').click(); },
      set: function (s, $) {
        $('#bClr').click();
        if (s.a) $('#pair [data-m="' + s.a + '"]').click();
        if (s.b) $('#pair [data-m="' + s.b + '"]').click();
      }
    };
"""
src = read(SRC + 'sim1-magnitude-sky.html')
# 큰 화면에서 읽히도록 지도·계단의 글씨를 키움
for a, b in [("font: ['700 15px Pretendard, sans-serif', '700 13px Pretendard, sans-serif', '600 12px Pretendard, sans-serif']",
              "font: ['700 21px Pretendard, sans-serif', '700 18px Pretendard, sans-serif', '600 16px Pretendard, sans-serif']"),
             ("'800 14px Pretendard, sans-serif'", "'800 21px Pretendard, sans-serif'"),     # 하늘 지도 별 이름
             ("'800 15px Pretendard, sans-serif'", "'800 21px Pretendard, sans-serif'"),     # 계단: 밝다·어둡다
             ("'800 16px Pretendard, sans-serif'", "'800 23px Pretendard, sans-serif'"),     # 계단: ○ 등급
             ("'800 13px Pretendard, sans-serif'", "'800 18px Pretendard, sans-serif'"),     # 계단: 약 2.5 배
             ("'900 17px Pretendard, sans-serif'", "'900 25px Pretendard, sans-serif'"),     # 계단: 약 100 배
             ("'700 12.5px Pretendard, sans-serif'", "'700 16px Pretendard, sans-serif'")]:  # 계단: 상자 설명
    src = rep(a, b, src)
write('fig-sky.html', inject(src, FIG_SKY))

# ---------- 3D 거리와 빛의 세기 ----------
FIG_LIGHT = r"""
    // 빛이 퍼지는 모습: d = 1~4 (거리 배)
    FIGS.light = {
      init: function () { move('#host', '#060b1a'); },
      ready: function () { return !!window.SM.ok3d; },
      set: function (s) {
        var S = window.SM; S.setD(s.d || 1);
      }
    };
    // 같은 가로등: k = 고른 가로등(1~4), eye = 내 자리에서 보기
    var eyeNow = false;
    FIGS.street = {
      init: function ($s, $) { move('#host', '#060b1a'); $('#mB').click(); },
      ready: function () { return !!window.SM.ok3d; },
      set: function (s) {
        var S = window.SM, eye = !!s.eye;
        S.setLamp(s.k || 1);
        if (eye !== eyeNow) { if (eye) S.eye++; else S.home++; eyeNow = eye; S.on3d(); }
      }
    };
"""
src = read(SRC + 'sim2-light-distance.html')
src = rep("  S.on3d = () => { apply(); camera(); };\n",
          "  S.on3d = () => { apply(); camera(); };\n  window.SM.api = { st: st, A: A, B: B, V: V };   // 발표용\n", src)
write('fig-light.html', inject(src, FIG_LIGHT))

# ---------- 3D 10 pc로 옮기기 ----------
FIG_TEN = r"""
    // sel 고른 별('sirius'|'mirzam'|'sun'|'ten'), moved 10 pc로 옮긴 별('sirius,mirzam'), top 위에서 보기
    var topNow = false;
    FIGS.ten = {
      init: function () { move('#host', '#050816'); },
      ready: function () { return !!window.SM.ok3d; },
      set: function (s) {
        var S = window.SM;
        S.sel = s.sel || 'sirius';
        S.moved = {}; (s.moved || '').split(',').forEach(function (id) { if (id) S.moved[id] = true; });
        var top = !!s.top; if (top !== topNow) { if (top) S.top++; else S.home++; topNow = top; }
        S.paint(); S.on3d();
      }
    };
"""
src = read(SRC + 'sim3-ten-parsec.html')
src = rep("c.font = '800 12.5px Pretendard, sans-serif';", "c.font = '800 18px Pretendard, sans-serif';", src)   # 지구에서 본 하늘의 별 이름
write('fig-ten.html', inject(src, FIG_TEN))

# ---------- 발표 틀 ----------
tpl = read(SP + '/deck.tpl.html')
assert '@@' not in tpl
write('index.html', tpl)
