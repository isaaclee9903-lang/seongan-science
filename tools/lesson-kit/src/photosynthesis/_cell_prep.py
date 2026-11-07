# SwissBioPics 식물세포 그림(CC BY 4.0, duerrsimon/bioicons 경유)을 수업용으로 줄이고 색을 입혀 _cell.js로 만든다.
# 사용: python _cell_prep.py <Plant_cells.svg 경로>
import re, sys, json, pathlib
from xml.etree import ElementTree as ET
NS = '{http://www.w3.org/2000/svg}'
HERE = pathlib.Path(__file__).parent
# 그룹 id → (어두운 색, 밝은 색). 회색 밝기를 이 두 색 사이로 옮긴다. 교과서 범위 밖 구조(잔 소포체, 세포 골격, 잎 밖 세포)는 뺀다.
RAMP = {
  'SL0086': ('#3f7d3a', '#dcefc9'),  # 세포질
  'SL0041': ('#2f6b2c', '#a9d27c'),  # 세포벽
  'SL0019': ('#2f6b2c', '#8fc465'),
  'SL0039': ('#2f6b2c', '#cfe6ae'),
  'SL0191': ('#4b2f7a', '#d9c6ef'),  # 핵
  'SL0173': ('#a4481f', '#f6b083'),  # 미토콘드리아
  'SL0132': ('#7a5a1c', '#ecd69b'),  # 골지체
  'SL0235': ('#6b4a8a', '#e3d6ef'),  # 거친 소포체
  'SL0049': ('#14511f', '#58b947'),  # 엽록체
  'SL0272': ('#3f7fae', '#d7ecf8'),  # 액포
}
def hx(c): c = c.lstrip('#'); return [int(c[i:i+2], 16) for i in (0, 2, 4)]
def mix(a, b, t): return '#%02x%02x%02x' % tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))
def tint(col, r):
    if not col or not col.startswith('#') or len(col) != 7: return col
    v = hx(col); l = (v[0] * .3 + v[1] * .59 + v[2] * .11) / 255
    return mix(hx(r[0]), hx(r[1]), l)
def num(s): return re.sub(r'-?\d+\.\d+', lambda m: ('%.1f' % float(m.group())).rstrip('0').rstrip('.'), s)
def ser(e, r):
    tag = e.tag.split('}')[1]
    if tag in ('text', 'a', 'title', 'desc', 'clipPath', 'radialGradient', 'linearGradient', 'defs'): return ''
    if tag == 'g':
        kids = ''.join(ser(c, r) for c in e)
        t = e.get('transform'); return f'<g transform="{t}">{kids}</g>' if t and kids else kids
    if tag not in ('path', 'ellipse', 'circle', 'polygon', 'rect', 'line', 'polyline'): return ''
    a = []
    for k in ('d', 'cx', 'cy', 'rx', 'ry', 'r', 'points', 'x', 'y', 'width', 'height', 'x1', 'y1', 'x2', 'y2', 'transform'):
        v = e.get(k)
        if v is not None: a.append(f'{k}="{v if k == "transform" else num(v)}"')
    f = e.get('fill')
    if f and f.startswith('url('): f = '#b8d8a0'
    a.append(f'fill="{tint(f, r) if f else "none"}"')
    s = e.get('stroke')
    if s and not s.startswith('url('): a.append(f'stroke="{tint(s, r)}" stroke-width="{num(e.get("stroke-width", "0.7"))}"')
    return f'<{tag} {" ".join(a)}/>'
EXTRA = [(105, 312, 80), (435, 300, -35), (405, -8, 30)]
root = ET.parse(sys.argv[1]).getroot()
out = []
ORDER = ['SL0086', 'SL0041', 'SL0019', 'SL0039', 'SL0272', 'SL0191', 'SL0235', 'SL0132', 'SL0173', 'SL0049']
for sid in ORDER:
    g = next((x for x in root.iter(NS + 'g') if x.get('id') == sid), None)
    if g is None: print('없음', sid); continue
    body = ser(g, RAMP[sid])
    if sid == 'SL0049':   # 엽록체 하나씩 묶고, 교과서 그림처럼 몇 개를 더 놓는다
        parts = [ser(c, RAMP[sid]) for c in g if c.tag == NS + 'g']; parts = [x for x in parts if x]
        print('엽록체 묶음', [len(x) for x in parts])
        extra = ''.join(f'<g transform="translate({dx} {dy}) rotate({r} 345 280)">{parts[0]}</g>' for dx, dy, r in EXTRA)
        body = ''.join(f'<g class="clp">{x}</g>' for x in parts) + ''.join(f'<g class="clp" transform="translate({dx} {dy}) rotate({r} 345 280)">{parts[0]}</g>' for dx, dy, r in EXTRA)
    if sid == 'SL0086':   # 세포질에서 하위 항목을 뺀 첫 바탕만
        pass
    out.append(f'<g data-o="{sid}">{body}</g>')
    print(sid, len(body))
svg = ''.join(out)
(HERE / '_cell.js').write_text('/* 식물세포 그림: SwissBioPics(SIB Swiss Institute of Bioinformatics), CC BY 4.0. 구조를 줄이고 색을 입혀 고침(_cell_prep.py). */\nwindow.PS_CELL = ' + json.dumps(svg, ensure_ascii=False) + ';\n', encoding='utf-8')
print('합계', len(svg))
pathlib.Path(sys.argv[2]).write_text(f'<body style="margin:0;background:#fff"><svg viewBox="0 0 1050 882" width="1050" height="882">{svg}</svg>', encoding='utf-8') if len(sys.argv) > 2 else None
