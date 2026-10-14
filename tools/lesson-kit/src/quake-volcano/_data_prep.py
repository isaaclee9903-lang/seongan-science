# 지진대·화산대 수업(quake-volcano) 지도 자료 다시 만들기
# 1) 원자료 받기 (빈 폴더 dl/ 에):
#    curl -o dl/land50.json https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-50m.json
#    curl -o dl/pb.json https://cdn.jsdelivr.net/gh/fraxen/tectonicplates@master/GeoJSON/PB2002_boundaries.json
#    curl -o dl/pl.json https://cdn.jsdelivr.net/gh/fraxen/tectonicplates@master/GeoJSON/PB2002_plates.json
#    지진(USGS, 규모 5.5 이상, 2만 개 제한이 있어 10년씩): https://earthquake.usgs.gov/fdsnws/event/1/query?format=csv&starttime=2020-01-01&endtime=2030-01-01&minmagnitude=5.5&orderby=time-asc  → dl/eq_2020-01-01.csv (1980, 1990, 2000, 2010도 같은 방식)
#    화산(스미스소니언 GVP): https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=GVP-VOTW:Smithsonian_VOTW_Holocene_Volcanoes&outputFormat=application/json → dl/vo.json
#    분출(1960년~): https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GVP-VOTW:E3WebApp_Eruptions1960&outputFormat=application/json → dl/er.json
# 2) python -I tools/lesson-kit/src/quake-volcano/_data_prep.py dl lessons/quake-volcano/data
# 지진대·화산대 수업 자료 만들기: 받은 원자료(dl/) → lessons/quake-volcano/data/*.js
import json, csv, sys, pathlib, datetime, math
DL = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)

def simplify(pts, tol):
    # Douglas-Peucker
    if len(pts) < 4: return pts
    keep = [False]*len(pts); keep[0] = keep[-1] = True
    st = [(0, len(pts)-1)]
    while st:
        a, b = st.pop(); ax, ay = pts[a]; bx, by = pts[b]; dx, dy = bx-ax, by-ay; L = math.hypot(dx, dy) or 1e-9
        best, bi = -1, -1
        for i in range(a+1, b):
            px, py = pts[i]; d = abs(dy*px - dx*py + bx*ay - by*ax)/L if L > 1e-9 else math.hypot(px-ax, py-ay)
            if d > best: best, bi = d, i
        if best > tol: keep[bi] = True; st += [(a, bi), (bi, b)]
    return [p for p, k in zip(pts, keep) if k]

# ---------- 육지 (world-atlas land-50m, Natural Earth 공공 저작물) ----------
T = json.load(open(DL/'land50.json', encoding='utf-8'))
sc, tr = T['transform']['scale'], T['transform']['translate']
arcs = []
for arc in T['arcs']:
    x = y = 0; out = []
    for dx, dy in arc: x += dx; y += dy; out.append((x*sc[0]+tr[0], y*sc[1]+tr[1]))
    arcs.append(out)
def ring(idx):
    pts = []
    for i in idx:
        a = arcs[i] if i >= 0 else arcs[~i][::-1]
        pts += a if not pts else a[1:]
    return pts
rings = []
for g in T['objects']['land']['geometries']:
    polys = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
    for poly in polys:
        for k, r in enumerate(poly):
            pts = ring(r)
            # 날짜 변경선(경도 ±180)에서 끊긴 고리를 이어 붙여요: 경도를 연속으로 펴고, 남극처럼 한 바퀴 도는 고리는 극으로 닫아요
            un = [pts[0]]
            for q in pts[1:]:
                lo = q[0]
                while lo - un[-1][0] > 180: lo -= 360
                while lo - un[-1][0] < -180: lo += 360
                un.append((lo, q[1]))
            if abs(un[-1][0] - un[0][0]) > 180:
                pole = -90 if sum(q[1] for q in un) < 0 else 90
                un += [(un[-1][0], pole), (un[0][0], pole)]
            pts = un
            xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
            area = (max(xs)-min(xs))*(max(ys)-min(ys))
            if area < 0.15: continue
            s = simplify(pts, 0.08)
            if len(s) < 4: continue
            rings.append([v for p in s for v in (round(p[0]*10), round(p[1]*10))])
(OUT/'land.js').write_text('/* 육지: Natural Earth 1:50m (공공 저작물) · world-atlas(ISC). 경도·위도 ×10, [x0,y0,x1,y1,…] */\nwindow.LAND=' + json.dumps(rings, separators=(',', ':')) + ';\n', encoding='utf-8')
print('land rings', len(rings), sum(len(r) for r in rings)//2)

# ---------- 판의 경계 (Bird 2003 PB2002, ODC-By 1.0, fraxen/tectonicplates) ----------
P = json.load(open(DL/'pb.json', encoding='utf-8'))
lines = []
for f in P['features']:
    g = f['geometry']; parts = g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
    for c in parts:
        s = simplify([(p[0], p[1]) for p in c], 0.05)
        lines.append({'s': 1 if f['properties'].get('Type') == 'subduction' else 0, 'p': [v for p in s for v in (round(p[0]*10), round(p[1]*10))]})
(OUT/'plates.js').write_text('/* 판의 경계: Bird (2003) PB2002 · fraxen/tectonicplates (Open Data Commons Attribution 1.0). s=1 해구 쪽 경계. 경도·위도 ×10 */\nwindow.PB=' + json.dumps(lines, separators=(',', ':')) + ';\n', encoding='utf-8')
print('plate lines', len(lines))

# ---------- 지진 (USGS ComCat, 규모 5.5 이상, 1980~) ----------
D0 = datetime.datetime(1980, 1, 1, tzinfo=datetime.timezone.utc)
eq = []
for f in sorted(DL.glob('eq_*.csv')):
    for r in csv.DictReader(open(f, encoding='utf-8')):
        if r['type'] != 'earthquake': continue
        t = datetime.datetime.fromisoformat(r['time'].replace('Z', '+00:00'))
        eq.append((round(float(r['longitude'])*10), round(float(r['latitude'])*10), max(0, round(float(r['depth']))), round(float(r['mag'])*10), (t-D0).days))
eq.sort(key=lambda e: e[4])
last = eq[-1][4]
(OUT/'quakes.js').write_text('/* 지진: 미국 지질 조사국(USGS) 지진 목록, 규모 5.5 이상, 1980-01-01부터 ' + (D0+datetime.timedelta(days=last)).strftime('%Y-%m-%d') + '까지 (공공 자료). [경도×10, 위도×10, 깊이 km, 규모×10, 1980-01-01부터 지난 날 수] */\nwindow.EQ=' + json.dumps([v for e in eq for v in e], separators=(',', ':')) + ';window.EQ_END=' + str(last) + ';\n', encoding='utf-8')
print('quakes', len(eq), 'last', D0+datetime.timedelta(days=last))

# ---------- 화산 (스미스소니언 세계 화산 계획 GVP) ----------
V = json.load(open(DL/'vo.json', encoding='utf-8'))
vol = []; vidx = {}
for f in V['features']:
    p = f['properties']; c = f['geometry']['coordinates']
    vidx[p['Volcano_Number']] = len(vol)
    ly = p.get('Last_Eruption_Year'); ly = ly if isinstance(ly, int) else -99999
    vol.append([round(c[0]*10), round(c[1]*10), ly, p['Volcano_Name']])
E = json.load(open(DL/'er.json', encoding='utf-8'))
er = []
def day(y, m, d):
    try: return (datetime.datetime(y, max(1, m or 1), max(1, d or 1), tzinfo=datetime.timezone.utc)-D0).days
    except Exception: return None
for f in E['features']:
    p = f['properties']
    if (p.get('StartDateYear') or 0) < 1980: continue
    s = day(p['StartDateYear'], p.get('StartDateMonth'), p.get('StartDateDay'))
    if s is None: continue
    cont = p.get('ContinuingEruption') == 'True'
    e = -1 if cont else (day(p['EndDateYear'], p.get('EndDateMonth'), p.get('EndDateDay')) if p.get('EndDateYear') else s)
    vi = vidx.get(p['VolcanoNumber'])
    if vi is None:
        vi = len(vol); vol.append([round(p['LongitudeDecimal']*10), round(p['LatitudeDecimal']*10), p['StartDateYear'], p['VolcanoName']]); vidx[p['VolcanoNumber']] = vi
    er.append([vi, s, e if e is not None else s, p.get('ExplosivityIndexMax') if isinstance(p.get('ExplosivityIndexMax'), int) else -1])
er.sort(key=lambda x: x[1])
(OUT/'volcano.js').write_text('/* 화산: 스미스소니언 연구소 세계 화산 계획(GVP) Volcanoes of the World. VO=[경도×10, 위도×10, 마지막 분출 연도, 이름], ER=[화산 번호, 시작 날, 끝 날(-1 계속), 폭발 지수] (날은 1980-01-01부터 지난 날 수) */\nwindow.VO=' + json.dumps(vol, separators=(',', ':'), ensure_ascii=False) + ';\nwindow.ER=' + json.dumps(er, separators=(',', ':')) + ';\n', encoding='utf-8')
print('volcanoes', len(vol), 'eruptions', len(er))

# ---------- 판 모양 (PB2002 판, 눌러서 강조용) ----------
PL = json.load(open(DL/'pl.json', encoding='utf-8'))
plates = []; tot = 0
for f in PL['features']:
    g = f['geometry']; rs = [g['coordinates'][0]] if g['type'] == 'Polygon' else [p[0] for p in g['coordinates']]
    area = 0; rings2 = []
    for r in rs:
        a = 0
        for k in range(len(r) - 1):
            x0, y0 = math.radians(r[k][0]), math.sin(math.radians(r[k][1])); x1, y1 = math.radians(r[k+1][0]), math.sin(math.radians(r[k+1][1]))
            a += x0 * y1 - x1 * y0
        area += abs(a) / 2
        s2 = simplify([(p[0], p[1]) for p in r], 0.12)
        rings2.append([v for p in s2 for v in (round(p[0]*10), round(p[1]*10))])
    tot += area
    code = f['properties']['Code']
    ex = next((q for q in plates if q['c'] == code), None)
    if ex: ex['r'] += rings2; ex['a'] += area
    else: plates.append({'c': code, 'r': rings2, 'a': area})
for q in plates: q['a'] = round(q['a'] / tot * 1000) / 10
plates.sort(key=lambda q: -q['a'])
(OUT/'plateshape.js').write_text('/* 판 모양: Bird (2003) PB2002 · fraxen/tectonicplates (Open Data Commons Attribution 1.0). a=지구 표면에서 차지하는 비율(%), 경도·위도 ×10 */\nwindow.PLATES=' + json.dumps(plates, separators=(',', ':')) + ';\n', encoding='utf-8')
print('plates', len(plates), [(q['c'], q['a']) for q in plates[:16]])
