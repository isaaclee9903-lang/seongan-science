# 소화계 3D 모형 자료 만들기 (자주 돌릴 일 없음. 결과 lessons/digestion/media/dg.bin·dg.json)
# 입(입술·이·혀·침샘)·식도·위·샘창자·작은창자·큰창자·곧창자·항문·간·쓸개·쓸개즙 관·이자·이자관·뼈:
#   BodyParts3D 4.0, (c) The Database Center for Life Science, CC BY 4.0
#   https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html  (내려받기: github.com/ashemag/human-atlas 가 나눠 둔 파일)
# 인두(입 안쪽 → 식도)와 구불잘록창자(큰창자 끝 → 곧창자)는 이 자료에 관 모양이 없어 가운데 길을 따라 관을 새로 만든다.
# 간 겉모양: HuBMAP CCF 3D Reference Object Library VH_M_Liver.glb(VH_M_liver_capsule), CC BY 4.0 — BodyParts3D 간 조각들의 상자에 맞춘다
#   https://hubmapconsortium.github.io/ccf/pages/ccf-3d-reference-library.html
# 사용: python -I _dg_prep.py <atlas.json·b<N>.gz 폴더> <lessons/digestion/media> <VH_M_Liver.glb>
# 좌표: (0, 1.19 m, 0)을 원점으로 1 m = 40. x+ 는 몸의 왼쪽, y+ 위, z+ 앞. (배설·기관계 수업과 같은 축, 원점만 다름)
# 학생용 그림이라 피부·생식기 쪽은 넣지 않는다.
import json, gzip, os, re, struct, sys, urllib.request
import numpy as np
import fast_simplification as fs

D, OUT, LGLB = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True)
BASE = 'https://raw.githubusercontent.com/ashemag/human-atlas/main/public/models/'
A = json.load(open(D + '/atlas.json', encoding='utf8'))
P = A['parts']
NAMES = set(p['name'] for p in P)
_buf = {}


def chunk(c):
    if c not in _buf:
        f = f'{D}/b{c}.gz'
        if not os.path.exists(f):
            urllib.request.urlretrieve(BASE + f'body-{c}.bin.gz', f)
        _buf[c] = gzip.open(f).read()
    return _buf[c]


def mesh(p):
    b = chunk(p['chunk'])
    v = np.frombuffer(b, '<f4', p['vertexCount'] * 3, p['positions']).reshape(-1, 3).astype(np.float64)
    i = np.frombuffer(b, '<u4', p['indexCount'], p['indices']).reshape(-1, 3).astype(np.int64)
    return v, i


C = np.array([0, 1.19, 0])
S = 40.0
T = lambda v: (np.asarray(v, float) - C) * S


def simplify(v, i, keep):
    if len(i) < 120 or keep >= 1:
        return v, i
    a, b = fs.simplify(v.astype(np.float32), i.astype(np.int32), target_reduction=1 - keep)
    return a.astype(np.float64), b.astype(np.int64)


def weld(v, i, tol=1e-6):
    q = np.round(v / tol).astype(np.int64)
    _, first, inv = np.unique(q, axis=0, return_index=True, return_inverse=True)
    inv = inv.reshape(-1)
    i = inv[i]
    i = i[(i[:, 0] != i[:, 1]) & (i[:, 1] != i[:, 2]) & (i[:, 0] != i[:, 2])]
    return v[first], i


def subdivide(v, i, n=1, smooth=4):
    for _ in range(n):
        e = np.sort(np.vstack([i[:, [0, 1]], i[:, [1, 2]], i[:, [2, 0]]]), axis=1)
        ue, inv = np.unique(e, axis=0, return_inverse=True)
        inv = inv.reshape(-1)
        m = len(v) + np.arange(len(ue))
        v = np.vstack([v, (v[ue[:, 0]] + v[ue[:, 1]]) / 2])
        ab, bc, ca = m[inv[:len(i)]], m[inv[len(i):2 * len(i)]], m[inv[2 * len(i):]]
        a, b, c = i[:, 0], i[:, 1], i[:, 2]
        i = np.vstack([np.stack([a, ab, ca], 1), np.stack([ab, b, bc], 1), np.stack([ca, bc, c], 1), np.stack([ab, bc, ca], 1)])
    nb = [set() for _ in range(len(v))]
    for t in i.tolist():
        for x in range(3):
            nb[t[x]].update((t[(x + 1) % 3], t[(x + 2) % 3]))
    nbl = [list(s) for s in nb]
    for k in range(smooth):
        lam = .5 if k % 2 == 0 else -.52
        avg = np.array([v[s].mean(0) if s else v[j] for j, s in enumerate(nbl)])
        v = v + lam * (avg - v)
    return v, i


def normals(v, i):
    n = np.zeros_like(v)
    f = np.cross(v[i[:, 1]] - v[i[:, 0]], v[i[:, 2]] - v[i[:, 0]])
    for k in range(3):
        np.add.at(n, i[:, k], f)
    l = np.linalg.norm(n, axis=1, keepdims=True)
    l[l == 0] = 1
    return n / l


def allnamed(n):
    ps = [p for p in P if p['name'] == n]
    if not ps:
        print('  없음', n)
    seen, out = set(), []
    for p in sorted(ps, key=lambda p: -p['indexCount']):
        k = tuple(np.round(np.array(p['bounds']).reshape(-1), 3))
        if k in seen:
            continue
        seen.add(k)
        out.append(p)
    return out


out_pos, out_nor, out_idx = [], [], []
nv = ni = 0
man = {'S': S, 'C': C.tolist(), 'groups': {}}


def put(v, i, keep=1, sub=0):
    global nv, ni
    u, inv = np.unique(i, return_inverse=True)
    v, i = v[u], inv.reshape(-1, 3)
    if sub:
        v, i = weld(v, i)
        v, i = subdivide(v, i, sub)
    v, i = simplify(v, i, keep)
    out_pos.append(T(v))
    out_nor.append(normals(v, i))
    out_idx.append(i + nv)
    nv += len(v)
    ni += len(i) * 3


def group(gk, names, keep=1, sub=0, every=True):
    g0 = ni
    for n in names:
        for p in (allnamed(n) if every else allnamed(n)[:1]):
            v, i = mesh(p)
            put(v, i, keep, sub)
    man['groups'][gk] = [g0, ni - g0]
    print(gk, (ni - g0) // 3)


def pts_of(names, sel=None):
    v = np.vstack([mesh(p)[0] for n in names for p in allnamed(n)])
    return v[sel(v)] if sel is not None else v


def proj(guide, v):
    g = np.asarray(guide, float)
    seg = np.diff(g, axis=0)
    L = np.linalg.norm(seg, axis=1)
    cum = np.r_[0, np.cumsum(L)]
    best_d = np.full(len(v), 1e9)
    best_s = np.zeros(len(v))
    for k in range(len(seg)):
        t = np.clip(((v - g[k]) @ seg[k]) / (L[k] ** 2), 0, 1)
        q = g[k] + t[:, None] * seg[k]
        d = np.linalg.norm(v - q, axis=1)
        m = d < best_d
        best_d[m] = d[m]
        best_s[m] = cum[k] + t[m] * L[k]
    return best_s / cum[-1], best_d


def cline_v(v, guide, maxd=.03, step=.006):
    s, d = proj(guide, v)
    g = np.asarray(guide, float)
    tot = np.linalg.norm(np.diff(g, axis=0), axis=1).sum()
    nb = max(4, int(tot / step))
    out = []
    for k in range(nb):
        m = (s >= k / nb) & (s < (k + 1) / nb) & (d < maxd)
        if m.sum() >= 2:
            out.append(v[m].mean(0))
    if len(out) < max(3, nb // 3):
        print('  안내선 사용', len(out), '/', nb)
        return resample(g, step)
    return np.array(out)


def cline(names, guide, maxd=.03, sel=None, step=.006):
    return cline_v(pts_of(names, sel), guide, maxd, step)


def smooth(q, it=6):
    q = np.array(q, float)
    for _ in range(it):
        q[1:-1] = .25 * q[:-2] + .5 * q[1:-1] + .25 * q[2:]
    return q


def resample(pts, step=.004):
    pts = np.array(pts, float)
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    n = max(2, int(d[-1] / step))
    s = np.linspace(0, d[-1], n + 1)
    return np.stack([np.interp(s, d, pts[:, a]) for a in range(3)], 1)


def tube(path, r0, r1=None, seg=18):
    """가운데 길을 따라 관을 만든다(양 끝은 열림). r0→r1로 굵기가 바뀐다."""
    r1 = r0 if r1 is None else r1
    p = resample(smooth(path, 3), .003)
    n = len(p)
    tg = np.gradient(p, axis=0)
    tg /= np.linalg.norm(tg, axis=1, keepdims=True)
    up = np.array([0, 0, 1.0]) if abs(tg[0] @ [0, 0, 1]) < .9 else np.array([1.0, 0, 0])
    nn = np.cross(tg[0], up)
    nn /= np.linalg.norm(nn)
    vs = []
    for k in range(n):
        nn = nn - (nn @ tg[k]) * tg[k]
        nn /= np.linalg.norm(nn)
        bb = np.cross(tg[k], nn)
        r = r0 + (r1 - r0) * k / (n - 1)
        r *= min(1, .55 + .45 * min(k, n - 1 - k) / 4)  # 끝을 살짝 좁혀 메시와 이어지게
        a = np.linspace(0, 2 * np.pi, seg, endpoint=False)
        vs.append(p[k] + r * (np.cos(a)[:, None] * nn + np.sin(a)[:, None] * bb))
    v = np.vstack(vs)
    idx = []
    for k in range(n - 1):
        for j in range(seg):
            a, b = k * seg + j, k * seg + (j + 1) % seg
            c, d = a + seg, b + seg
            idx += [[a, c, b], [b, c, d]]
    return v, np.array(idx)


ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth']
# ===== 뼈 (흐리게, 위치를 알 수 있게) =====
SKULL = ['Frontal bone', 'Occipital bone', 'Left parietal bone', 'Right parietal bone', 'Left temporal bone', 'Right temporal bone', 'Left maxilla', 'Right maxilla',
         'Left zygomatic bone', 'Right zygomatic bone', 'Sphenoid bone', 'Left nasal bone', 'Right nasal bone']
group('skull', SKULL, .5, every=False)
group('jaw', ['Mandible'], .5, every=False)
VERT = [n for n in NAMES if re.fullmatch(r'(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth) (cervical|thoracic|lumbar) vertebra', n)] + [n for n in ('Atlas', 'Axis') if n in NAMES]
group('spine', sorted(VERT) + ['Sacrum'], .3, every=False)
RIBS = [f'{s} {o} rib' for s in ('Left', 'Right') for o in ORD]
group('rib', RIBS + [n for n in NAMES if re.fullmatch(r'(Manubrium|Body) of sternum|Xiphoid process', n)] + ['Left clavicle', 'Right clavicle'], .45, every=False)
group('hip', ['Left hip bone', 'Right hip bone'], .6, every=False)
# ===== 입 =====
TEETH = sorted(n for n in NAMES if re.search(r'secondary .*tooth$', n))
group('teeth', TEETH, .35, every=False)
group('tongue', ['Tongue'], 1, sub=1, every=False)
group('lip', ['Lip'], .8, every=False)
group('saliv', ['Left submandibular gland', 'Right submandibular gland', 'Left sublingual gland', 'Right sublingual gland'], 1, sub=1, every=False)
# ===== 소화관 =====
group('eso', ['Esophagus'], 1, sub=1, every=False)
group('sto', ['Stomach'], 1, sub=1, every=False)
group('duo', ['Duodenum'], 1, sub=1, every=False)
SI = sorted(n for n in NAMES if re.fullmatch(r'(Proximal|Middle|Distal) part of (jejunum|ileum)', n)) + ['Ileocecal junction']
group('si', SI, 1)
group('li', ['Ascending colon', 'Transverse colon', 'Descending colon', 'Appendix'], .5, sub=1, every=False)
group('rect', ['Rectum'], 1, sub=1, every=False)
group('anus', ['External anal sphincter'], 1, sub=1, every=False)
# ===== 소화샘 =====
LIVER = ['Caudate lobe of liver'] + [f'Hepatovenous segment {r}' for r in ('II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII')]


def liver_hra():
    f = open(LGLB, 'rb')
    f.read(12)
    cl, _ = struct.unpack('<II', f.read(8))
    J = json.loads(f.read(cl))
    bl, _ = struct.unpack('<II', f.read(8))
    B = f.read(bl)

    def acc(a):
        x = J['accessors'][a]
        bv = J['bufferViews'][x['bufferView']]
        off = bv.get('byteOffset', 0) + x.get('byteOffset', 0)
        n = {'SCALAR': 1, 'VEC3': 3}[x['type']]
        dt = {5123: '<u2', 5125: '<u4', 5126: '<f4'}[x['componentType']]
        return np.frombuffer(B, dt, x['count'] * n, off).reshape(-1, n)
    nd = next(n for n in J['nodes'] if n.get('name') == 'VH_M_liver_capsule')
    vs, ids, o = [], [], 0
    for pr in J['meshes'][nd['mesh']]['primitives']:
        v = acc(pr['attributes']['POSITION']).astype(np.float64)
        vs.append(v)
        ids.append(acc(pr['indices']).reshape(-1, 3).astype(np.int64) + o)
        o += len(v)
    v, i = np.vstack(vs), np.vstack(ids)
    tv = pts_of(LIVER)
    lo, hi, slo, shi = tv.min(0), tv.max(0), v.min(0), v.max(0)
    w = lo + (v - slo) / (shi - slo) * (hi - lo)
    return w, i


g0 = ni
lv, li_ = liver_hra()
put(lv, li_, min(1, 9000 / len(li_)))
man['groups']['liver'] = [g0, ni - g0]
print('liver(HRA)', (ni - g0) // 3)
group('gall', ['Gallbladder'], 1, sub=1, every=False)
BILE = ['Common hepatic duct', 'Cystic duct', 'Left hepatic duct', 'Right hepatic duct'] + sorted(n for n in NAMES if 'tributary of' in n and 'hepatic duct' in n)
group('bile', [n for n in BILE if n in NAMES], .8)
group('pan', ['Parenchyma of pancreas'], .8, every=False)
group('pduct', ['Pancreatic duct'], .5, every=False)

# ===== 길 =====
MOUTH = np.array([0, 1.536, .088])
ORAL = np.array([0, 1.528, .05])
PHX = np.array([0, 1.515, .002])
ESO = cline(['Esophagus'], [[.0, 1.468, -.01], [.0, 1.36, -.025], [.008, 1.27, -.02], [.02, 1.2, .005]], maxd=.02)
PHAR = smooth(np.vstack([[ORAL, ORAL + [0, -.004, -.024], PHX, [0, 1.495, -.006], [0, 1.48, -.009]], ESO[:1]]), 2)
STO = smooth(cline(['Stomach'], [[.02, 1.205, .01], [.05, 1.225, .03], [.075, 1.205, .055], [.07, 1.17, .07], [.04, 1.145, .07], [.005, 1.145, .058], [-.02, 1.15, .045]], maxd=.05, step=.008), 2)
DUO = cline(['Duodenum'], [[-.02, 1.15, .045], [-.05, 1.135, .03], [-.055, 1.1, .022], [-.03, 1.075, .025], [.0, 1.08, .03], [.029, 1.1, .041]], maxd=.03)


# 작은창자: 짧은 관 조각을 가장 가까운 끝끼리 이어 한 줄로
def piece_line(v):
    c = v.mean(0)
    w, Vv = np.linalg.eigh(np.cov((v - c).T))
    ax = Vv[:, 2]
    s = (v - c) @ ax
    nb = max(3, int((s.max() - s.min()) / .006))
    out = []
    for k in range(nb):
        lo = s.min() + (s.max() - s.min()) * k / nb
        m = (s >= lo) & (s < lo + (s.max() - s.min()) / nb)
        if m.sum() >= 3:
            out.append(v[m].mean(0))
    return np.array(out)


pieces = []
for n in SI[:-1]:
    for p in allnamed(n):
        pieces.append(piece_line(mesh(p)[0]))
icj = piece_line(pts_of(['Ileocecal junction']))
if icj[0][1] < icj[-1][1]:
    icj = icj[::-1]  # 위(작은창자 쪽) → 아래(막창자 쪽)
cur = DUO[-1]
chain = []
left = list(range(len(pieces)))
while left:
    best = None
    for k in left:
        q = pieces[k]
        for rev in (False, True):
            e = q[-1] if rev else q[0]
            d = np.linalg.norm(e - cur)
            if best is None or d < best[0]:
                best = (d, k, rev)
    d, k, rev = best
    q = pieces[k][::-1] if rev else pieces[k]
    chain.append(q)
    cur = q[-1]
    left.remove(k)
SIP = np.vstack(chain + [icj])
print('작은창자 길', len(SIP), '조각', len(pieces))
ASC = cline(['Ascending colon'], [[-.101, .955, .017], [-.1, 1.03, .015], [-.085, 1.126, .017]], maxd=.03)
TRA = cline(['Transverse colon'], [[-.08, 1.13, .02], [-.06, 1.11, .06], [-.02, 1.085, .08], [.03, 1.09, .075], [.07, 1.12, .045], [.085, 1.135, .015]], maxd=.03)
DES = cline(['Descending colon'], [[.085, 1.134, .008], [.105, 1.06, .0], [.1, .98, .0], [.07, .925, .0], [.023, .906, -.014]], maxd=.035)
SIG = smooth([DES[-1], [.005, .908, -.022], [-.008, .922, -.036], [-.004, .94, -.046], [.001, .947, -.048]], 2)
REC = cline(['Rectum'], [[.001, .947, -.048], [.006, .9, -.06], [-.001, .845, -.063]], maxd=.03)
ANUS = np.array([.0, .836, -.075])
# 인두·구불잘록창자 관
g0 = ni
v, i = tube(PHAR[1:], .007, .009)
put(v, i)
man['groups']['phar'] = [g0, ni - g0]
g0 = ni
v, i = tube(SIG, .014, .013)
put(v, i)
man['groups']['sig'] = [g0, ni - g0]

# 음식물이 지나는 길 (이름이 바뀌는 곳을 비율로)
R, MARKS = {}, {}


def route(key, legs, step=.004):
    pts, names = [], []
    for nm, q in legs:
        q = np.asarray(q, float).reshape(-1, 3)
        if pts and np.linalg.norm(pts[-1] - q[0]) < 1e-6:
            q = q[1:]
        for x in q:
            pts.append(x)
            names.append(nm)
    pts = np.array(pts)
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    rs = resample(smooth(pts, 3), step)
    marks, last = [], None
    for nm, dd in zip(names, d):
        if nm != last:
            marks.append([round(float(dd / d[-1]), 4), nm])
            last = nm
    R[key] = np.round(T(rs), 3).tolist()
    MARKS[key] = marks
    print(key, '길이 m', round(d[-1], 2), len(rs))


route('food', [('입', [MOUTH + [0, .006, .03], MOUTH, ORAL]), ('식도', np.vstack([PHAR[1:], ESO])), ('위', STO), ('작은창자', np.vstack([DUO, SIP])),
               ('큰창자', np.vstack([ASC, TRA, DES, SIG])), ('항문', np.vstack([REC, [ANUS, ANUS + [0, -.006, -.012]]]))])
# 쓸개즙: 간 → 간의 관 → 쓸개(저장) / 쓸개 → 샘창자
CHD = cline(['Common hepatic duct'], [[-.03, 1.18, .042], [-.028, 1.15, .035], [-.035, 1.12, .02], [-.042, 1.1, .01]], maxd=.012, step=.004)
GB = pts_of(['Gallbladder']).mean(0)
CYS = cline(['Cystic duct'], [[-.022, 1.165, .035], [-.03, 1.16, .032]], maxd=.01, step=.003)
LIVIN = np.array([-.06, 1.2, .035])
jn = CHD[np.argmin(np.linalg.norm(CHD - CYS[0], axis=1))]
k = int(np.argmin(np.linalg.norm(CHD - jn, axis=1)))
route('bileIn', [('간', [LIVIN, [-.045, 1.19, .04]]), ('간에서 나오는 관', CHD[:k + 1]), ('쓸개', np.vstack([CYS, [GB]]))], .002)
route('bileOut', [('쓸개', [GB]), ('쓸개에서 나오는 관', np.vstack([CYS[::-1], CHD[k:]])), ('샘창자', [CHD[-1] + [-.006, -.004, .0]])], .002)
PD = cline(['Pancreatic duct'], [[.06, 1.14, .02], [.03, 1.13, .02], [.0, 1.125, .03], [-.03, 1.115, .025], [-.045, 1.1, .012]], maxd=.012, step=.004)
route('panc', [('이자', [PD[0] + [.008, .004, 0]]), ('이자관', PD), ('샘창자', [PD[-1] + [-.006, -.004, .0]])], .002)
man['routes'] = R
man['marks'] = MARKS
LIVc = pts_of(LIVER).mean(0)
man['pts'] = {k: np.round(T(v), 3).tolist() for k, v in dict(
    mouth=MOUTH, oral=ORAL, saliv=pts_of(['Right submandibular gland']).mean(0), tongue=pts_of(['Tongue']).mean(0), eso=ESO[len(ESO) // 2], sto=pts_of(['Stomach']).mean(0),
    duo=DUO[len(DUO) // 3], si=pts_of(SI[:-1]).mean(0), asc=ASC[len(ASC) // 2], des=DES[len(DES) // 3], rect=REC[len(REC) // 2], anus=ANUS, liver=LIVc, gall=GB,
    pan=pts_of(['Parenchyma of pancreas']).mean(0), teeth=np.array([0, 1.53, .075])).items()}

# ===== 저장 =====
pos = np.vstack(out_pos)
nor = np.vstack(out_nor)
idx = np.vstack(out_idx).reshape(-1)
K = float(np.abs(pos).max()) * 1.001
man['K'] = K
pq = np.round(pos / K * 32767).astype('<i2')
nq = np.round(nor * 32767).astype('<i2')
man['counts'] = [len(pos), len(idx)]
blob = pq.tobytes() + nq.tobytes()
if len(blob) % 4:
    blob += b'\0\0'
man['iOff'] = len(blob)
blob += idx.astype('<u4').tobytes()
open(OUT + '/dg.bin', 'wb').write(blob)
json.dump(man, open(OUT + '/dg.json', 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print('verts', len(pos), 'tris', len(idx) // 3, 'MB', round(len(blob) / 1048576, 2), 'K', K, 'bbox', pos.min(0).round(2), pos.max(0).round(2))
print({k: v[1] // 3 for k, v in man['groups'].items()})
