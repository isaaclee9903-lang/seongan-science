"""별까지의 거리 수업 발표 조립. 저장소 맨 위에서: python tools/lesson-deck/parallax/build.py

라스 수업 lessons/parallax의 페이지 세 개를 복사해 '발표 그림 페이지'로 만든다.
주소 끝에 ?fig=이름 을 붙이면 그 그림 하나만 화면 가득 보이고, 발표 틀(index.html)이
window.DECKFIG.set(상태)로 장마다 그림 상태를 바꾼다. 그림 그리는 코드는 라스 수업 그대로다.
  fig-reading.html  ?fig=room(칠판 앞 선생님) · ab(시차와 거리) · ap(그림 Ⅷ-2) · zeta(1°→1′→1″)
  fig-board.html    ?fig=board(시차 측정 판: 구멍으로 본 모습 + 위에서 본 판)
  fig-orbit.html    ?fig=orbit(연주 시차 관측소 + 망원경) · gaia(가이아 사진 (가)(나))
deck.tpl.html은 그대로 index.html로 복사한다(장 내용·넘기기·영상)."""
import os
SP = os.path.dirname(os.path.abspath(__file__))
OUT = 'presentations/parallax/'
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
</style>
<script>
/* 발표용 그림 칸: 발표 틀(presentations/parallax/index.html)이 DECKFIG.set(상태)를 불러요 */
window.DECKFIG = window.DECKFIG || {};
(function () {
  'use strict';
  try {
    var f = new URLSearchParams(location.search).get('fig');
    if (!f) return;
    document.documentElement.classList.add('deckfig');
    var st = document.createElement('div'); st.id = 'dfStage'; st.dataset.fig = f; document.body.appendChild(st);
    var $ = function (s) { return document.querySelector(s); }, $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
    var FIGS = {};
    /*@@FIGS@@*/
    var D = FIGS[f];
    if (!D) throw new Error('없는 그림 이름: ' + f);
    D.init(st, $, $$);
    window.DECKFIG.f = f;
    window.DECKFIG.set = function (s) { try { D.set(s || {}, $, $$); } catch (e) { (window.RD_err || console.error)('발표 그림 바꾸기', e); } };
    window.DECKFIG.ok = true;
    try { parent.postMessage({ type: 'deckfig-ready', fig: f }, '*'); } catch (e) {}
  } catch (err) { (window.RD_err || console.error)('발표 그림 칸', err); }
})();
</script>
"""


SHIM = """<head>
<script>/* 화면 검사용: 주소 끝에 raf=timer가 있으면 창이 가려져 있어도 그림이 움직여요 */
if (/[?&]raf=timer/.test(location.search)) window.requestAnimationFrame = function (cb) { return setTimeout(function () { cb(performance.now()); }, 16); };</script>"""


def inject(src, figs):
    src = rep('<head>', SHIM, src)
    return rep('</body>', CORE.replace('/*@@FIGS@@*/', figs) + '</body>', src)


# ---------- 읽기 페이지의 그림 넷 ----------
FIG_READING = r"""
    function move(st, sel, bg) { var n = document.querySelector(sel); st.appendChild(n); n.removeAttribute('style'); st.style.background = bg; return n; }
    // 칠판 앞 선생님: seat = -1 왼쪽, 0 가운데, 1 오른쪽 자리
    FIGS.room = {
      init: function (st) { move(st, '#classSvg', 'linear-gradient(#f4efe6 50%,#d9c3a2 50%)'); },
      set: function (s, $) { var b = $('[data-seat="' + (s.seat || 0) + '"]'); if (b) b.click(); }
    };
    // 시차와 거리: v = 0(가깝게) ~ 100(멀게). 바뀌면 천천히 움직여요
    var abV = null, abRaf = 0;
    FIGS.ab = {
      init: function (st) { move(st, '#pxSvg', 'linear-gradient(#e6f2ff 50%,#e3ead2 50%)'); },
      set: function (s, $) {
        var r = $('#pxR'), to = s.v == null ? 20 : s.v;
        cancelAnimationFrame(abRaf);
        if (abV == null || window.RD.reduce) { abV = to; r.value = to; r.dispatchEvent(new Event('input')); return; }
        var from = abV, t0 = performance.now();
        (function go(now) {
          var k = Math.min(1, (now - t0) / 900), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          abV = from + (to - from) * e; r.value = abV; r.dispatchEvent(new Event('input'));
          if (k < 1) abRaf = requestAnimationFrame(go);
        })(t0);
      }
    };
    // 그림 Ⅷ-2 (움직이지 않음)
    FIGS.ap = { init: function (st) { move(st, '#apSvg', '#0b1427'); }, set: function () {} };
    // 1° → 1′ → 1″ : z = 0, 1, 2
    FIGS.zeta = {
      init: function (st) { move(st, '#zSvg', '#fff'); st.style.padding = '1.5% 3%'; },
      set: function (s, $) { var b = $('[data-z="' + (s.z || 0) + '"]'); if (b) b.click(); }
    };
"""

src = read('lessons/parallax/reading.html')
write('fig-reading.html', inject(src, FIG_READING))

# ---------- 시차 측정 판 ----------
FIG_BOARD = r"""
    // 위: 구멍으로 본 모습, 아래: 위에서 본 판
    // 상태: target 'ga'|'na', eye 'L'|'R'|'B', marks {ga:'LR'}, line {ga:true}, proto {ga:true}
    FIGS.board = {
      init: function (st, $) {
        st.style.cssText = 'display:grid;grid-template-rows:50fr 50fr;background:#f6f9fc';
        var a = $('.eye .cvw'), b = $('.topv .cvw');
        [a, b].forEach(function (n) { n.style.cssText = 'position:relative;min-height:0;height:auto;flex:none'; st.appendChild(n); });
      },
      set: function (s) {
        var A = window.RD.api, S = A.S;
        S.mode = 'guided'; S.target = s.target || 'ga';
        ['ga', 'na'].forEach(function (k) {
          var m = (s.marks || {})[k] || '';
          S.marks[k] = { L: m.indexOf('L') >= 0 ? A.markOf(k, 'L') : null, R: m.indexOf('R') >= 0 ? A.markOf(k, 'R') : null };
          if ((s.line || {})[k]) S.lineGo[k] = true; else { S.lineGo[k] = false; S.line[k] = 0; }
          if ((s.proto || {})[k]) S.protoGo[k] = true; else { S.protoGo[k] = false; S.proto[k] = 0; S.measured[k] = null; }
          if (window.RD.reduce) { if (S.lineGo[k]) S.line[k] = 1; if (S.protoGo[k]) S.proto[k] = 1; }
        });
        A.setEye(s.eye || 'L');
      }
    };
"""

src = read('lessons/parallax/sim1-parallax-board.html')
src = rep("  setEye('L'); setMode('guided');\n",
          "  setEye('L'); setMode('guided');\n"
          "  // 발표용: 발표 틀이 상태를 바꿀 수 있게 열어 둬요\n"
          "  window.RD.reduce = REDUCE;\n"
          "  window.RD.api = { S: S, setEye: setEye, markOf: function (k, e) { return Math.round(numAt(hitY(holeY(e), S.stars[k]))); } };\n", src)
write('fig-board.html', inject(src, FIG_BOARD))

# ---------- 연주 시차 관측소 · 가이아 ----------
FIG_ORBIT = r"""
    // 연주 시차 관측소: at 'A'|'B'|'play', snapB, showY, stop, d(0 가깝게~100 멀게), scope(망원경 창), blink(A·B 번갈아)
    FIGS.orbit = {
      init: function (st, $) {
        st.style.background = '#070d1c';
        var c = $('.scene .cvw'); c.style.cssText = 'position:absolute;inset:0;min-height:0'; st.appendChild(c);
        var sc = $('.scope'); sc.style.cssText = 'position:absolute;left:2.5%;top:21%;width:31%;max-width:none;aspect-ratio:1/1;margin:0;display:none'; st.appendChild(sc);
      },
      set: function (s, $) {
        var A = window.RD.api2, S = A.S, TAU = Math.PI * 2;
        S.showY = !!s.showY;
        var d = A.sliderToD(s.d == null ? 23 : s.d); if (Math.abs(d - S.dX) > 1e-6) { S.dX = d; S.trail = []; }
        if (s.stop) { if (!S.stop) { S.trail = []; } S.stop = true; A.setPlay(false); S.th = 0; S.goTo = null; S.snapA = true; S.snapB = false; }
        else {
          if (S.stop) { S.stop = false; S.th = 0; }
          if (s.at === 'play') { if (!S.play) A.setPlay(true); }
          else {
            if (S.play) A.setPlay(false);
            var to = s.at === 'B' ? Math.PI : 0, cur = ((S.th % TAU) + TAU) % TAU;
            if (Math.abs(cur - to) > 0.01) S.goTo = to; else S.goTo = null;
            S.snapA = true;
            if (!s.snapB) S.snapB = false; else if (s.at !== 'B' || Math.abs(cur - to) <= 0.01) S.snapB = true;
          }
        }
        S.blink = !!s.blink && S.snapA && (S.snapB || !!s.snapB);
        $('.scope').style.display = s.scope ? 'block' : 'none';
        A.say();
      }
    };
    // 가이아 사진: blink (가)·(나) 번갈아, grid 모눈
    FIGS.gaia = {
      init: function (st, $) {
        $('[data-mode="mis"]').click();
        st.style.cssText = 'background:#101b30;display:flex;flex-direction:column;justify-content:center;gap:2.2%;padding:3% 4%';
        var g = $('.gaia'); g.style.cssText = 'width:100%;height:auto;flex:none'; st.appendChild(g);
        var p = $('.mphotos'); p.style.cssText = 'flex:none'; st.appendChild(p);
      },
      set: function (s, $) {
        var b = $('#mBlinkBtn'), on = b.getAttribute('aria-pressed') === 'true'; if (!!s.blink !== on) b.click();
        var gb = $('#mGrid'), gon = gb.getAttribute('aria-pressed') === 'true'; if (!!s.grid !== gon) gb.click();
      }
    };
"""

src = read('lessons/parallax/sim2-annual-parallax.html')
src = rep("  S.snapA = true; snapPhoto('A');   // 지구는 A에서 출발해요\n",
          "  S.snapA = true; snapPhoto('A');   // 지구는 A에서 출발해요\n"
          "  window.RD.api2 = { S: S, setPlay: setPlay, sliderToD: sliderToD, say: say };   // 발표용\n", src)
# 발표에서는 해 보기 사진을 늘 같게 (정답이 장 글과 맞도록)
src = rep("var R = K.rng(Date.now() % 100000 + round * 13);",
          "var R = K.rng((/[?&]fig=/.test(location.search) ? 5150 : Date.now() % 100000) + round * 13);", src)
src = rep("  newRound(); score(); requestAnimationFrame(frame);\n",
          "  newRound(); score(); requestAnimationFrame(frame);\n  window.RD.mis = function () { return cur; };   // 발표용\n", src)
write('fig-orbit.html', inject(src, FIG_ORBIT))

# ---------- 발표 틀 ----------
tpl = read(SP + '/deck.tpl.html')
# 해 보기 사진(씨앗 5150)에서 더 멀리 있는 별. 씨앗을 바꾸면 발표 화면에서 RD.mis().far로 다시 확인
FAR = 'A'
tpl = rep('@@FAR@@', FAR, tpl)
assert '@@' not in tpl
write('index.html', tpl)
