"""자기장 속 코일이 받는 힘 수업 발표 조립. 저장소 맨 위에서: python tools/lesson-deck/motor-force/build.py
deck.tpl.html(장 내용, 넘기기, 빈칸)에 lessons/motor-force의 3D 장면 코드를 끼워 presentations/motor-force/index.html을 만든다."""
import os
SP = os.path.dirname(os.path.abspath(__file__))
src = open('lessons/motor-force/sim1-swing-3d.html', encoding='utf-8').read().split('\n')
c3 = '\n'.join(src[458:738])      # 459~738줄: 공통 3D 도구 (sim3와 같음)
sw = '\n'.join(src[738:978])      # 739~978줄: 전기 그네 장면
assert c3.startswith('const C3') and sw.startswith('try {'), (c3[:30], sw[:30])
msrc = open('lessons/motor-force/sim3-motor-3d.html', encoding='utf-8').read().split('\n')
mo = '\n'.join(msrc[541:751])     # 542~751줄: 전동기 장면
assert mo.startswith('try {') and mo.rstrip().endswith('}'), (mo[:20], mo[-80:])


def rep(a, b, s, n=1):
    assert s.count(a) == n, (a, s.count(a))
    return s.replace(a, b)


INSET_OLD = "const w = Math.round(Math.min(W * 0.32, H * 0.42, 270))"
INSET_NEW = "const w = Math.round(Math.min(W * (st.bigHand ? 0.5 : 0.36), H * (st.bigHand ? 0.66 : 0.46), st.bigHand ? 640 : 440))"

# ---- 전기 그네 ----
sw = rep("label('(가) 안쪽', 'P', V(-1.6, 2.7, -1.3));", "const lbGa = label('(가) 안쪽', 'P', V(-1.6, 2.7, -1.3));", sw)
sw = rep("label('(나) 바깥쪽', 'P', V(-1.6, 2.7, 1.35));", "const lbNa = label('(나) 바깥쪽', 'P', V(-1.6, 2.7, 1.35));", sw)
sw = rep("label('디지털 전원 장치', 'small'", "const lbSup = label('디지털 전원 장치', 'small'", sw)
sw = rep("label('니크롬선', 'small'", "const lbNi = label('니크롬선', 'small'", sw)
sw = rep("label('말굽자석', 'small'", "const lbMag = label('말굽자석', 'small'", sw)
sw = rep("label('전기 그네', 'small'", "const lbSw = label('전기 그네', 'small'", sw)
sw = rep("const Fz = sI * magSign * kI * kB;", "const Fz = st.freeze ? 0 : sI * magSign * kI * kB; // 붙잡아 두면(freeze) 힘 없이 전류 길만 보여요", sw)
sw = rep("    // 화살표\n", """    // 장마다 켜는 표시: (가)(나), 부분 이름표
    pk.visible = lbGa.show = lbNa.show = !!st.show.P;
    [[lbSup, 'sup'], [lbNi, 'ni'], [lbMag, 'mag'], [lbSw, 'sw']].forEach(([L, key]) => { L.show = st.parts === 'all' || st.parts === key; L.el.classList.toggle('hl', st.parts === key); });
    controls.autoRotate = !!st.spin && !C3.REDUCE;
    // 화살표
""", sw)
sw = rep("      hand.arrows.F.visible = kI > 0 && magHome;\n", """      hand.arrows.F.visible = kI > 0 && magHome && st.hs.includes('F');
      hand.arrows.B.visible = st.hs.includes('B'); hand.arrows.I.visible = st.hs.includes('I'); // 오른손 단계: 하나씩 보여 줘요
""", sw)
sw = rep(INSET_OLD, INSET_NEW, sw)
sw = rep("    near: [V(-3.1, 2.0, 2.7), V(0, 1.15, 0.2)],\n", """    near: [V(-3.1, 2.0, 2.7), V(0, 1.15, 0.2)],
    magnet: [V(-4.6, 2.7, 5.6), V(-0.3, 1.15, 0)],
    swingv: [V(-6.4, 4.6, 8.2), V(0, 3.0, 0)],
    sup: [V(1.2, 3.4, 8.4), V(4.4, 0.8, 1.6)],
    ni: [V(-2.8, 3.2, 8.8), V(-0.4, 0.4, 3.0)],
    coil: [V(-3.8, 3.3, 5.4), V(0, 1.8, 0)],
    coilF: [V(0.3, 1.6, 6.4), V(0, 1.05, 0)],
    sideP: [V(-12.4, 2.9, -4.2), V(0, 2.0, 0.2)],
    near3: [V(-4.6, 2.9, 4.4), V(0.1, 1.2, 0.2)],
""", sw)
sw = rep("    view(k) { const v = VIEWS[k];", "    spin(on) { controls.autoRotateSpeed = 0.7; st.spin = on; },\n    view(k) { const v = VIEWS[k];", sw)
sw = rep("  S.ok3d = true;", "  S.stage = stage; S.ok3d = true; S.render && S.render();", sw)

# ---- 전동기 ----
mo = rep("document.getElementById('host')", "document.getElementById('host2')", mo)
mo = rep("document.getElementById('inset'), insetT = document.getElementById('insetT')", "document.getElementById('inset2'), insetT = document.getElementById('insetT2')", mo)
mo = rep(INSET_OLD, INSET_NEW, mo)
mo = rep("    left: [V(-2.6, 2.2, 4.4), V(-A * 0.8, AXY, 0.2)],\n", """    left: [V(-2.6, 2.2, 4.4), V(-A * 0.8, AXY, 0.2)],
    rightW: [V(3.4, 3.6, 7.6), V(A * 0.6, AXY - 0.1, 0.2)],
    leftW: [V(-3.4, 3.6, 7.6), V(-A * 0.6, AXY - 0.1, 0.2)],
""", mo)
mo = rep("  S.ok3d = true;", "  S.stage = stage; S.ok3d = true; window.SG.render && window.SG.render();", mo)
mo = rep("window.MT_err('3D 전동기', err); const f = document.getElementById('fail3d'); if (f) f.classList.add('show');", "window.SG_err('3D 전동기', err);", mo)

tpl = open(SP + '/deck.tpl.html', encoding='utf-8').read()
out = tpl.replace('/*@@C3@@*/', c3).replace('/*@@SWING@@*/', sw).replace('/*@@MOTOR@@*/', mo)
assert '@@' not in out
open('presentations/motor-force/index.html', 'w', encoding='utf-8', newline='\n').write(out)
print(len(out))
