# 배설계 3D 모형 자료 만들기 (자주 돌릴 일 없음. 결과 lessons/excretion/media/ex.bin·ex.json)
# 콩팥·오줌관·방광·요도·콩팥동맥·콩팥정맥·대동맥·대정맥·간·심장·뼈: BodyParts3D 4.0, (c) The Database Center for Life Science, CC BY 4.0
#   https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html  (내려받기: github.com/ashemag/human-atlas 가 나눠 둔 파일)
# 콩팥 속(겉질·콩팥 기둥·콩팥 피라미드·유두·콩팥문): HuBMAP CCF 3D Reference Object Library v1.2 VH_M_Kidney_L.glb, CC BY 4.0
#   https://hubmapconsortium.github.io/ccf/pages/ccf-3d-reference-library.html
# 사용: python -I _ex_prep.py <atlas.json·b<N>.gz 폴더> <VH_M_Kidney_L.glb> <lessons/excretion/media>
# 좌표: 허리 가운데(0, 1.06 m, -0.02 m)를 원점으로 1 m = 40. x+ 는 몸의 왼쪽, y+ 위, z+ 앞.
# 요도는 방광 바로 아래 짧은 부분만 남긴다(학생용 그림이라 생식기 쪽은 넣지 않음).
import json, gzip, os, struct, sys, urllib.request
import numpy as np
import fast_simplification as fs

D, GLB, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True)
BASE = 'https://raw.githubusercontent.com/ashemag/human-atlas/main/public/models/'
A = json.load(open(D + '/atlas.json', encoding='utf8'))
P = A['parts']
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


C = np.array([0, 1.06, -0.02])
S = 40.0
T = lambda v: (v - C) * S


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
    """작은 덩어리(방광 등)를 매끈하게: 가운데 점으로 나누고 라플라스로 다듬기"""
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
    # 같은 이름이 둘 이상이면 모양이 같은 겹친 것(같은 bounds)은 하나만
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
man = {'S': S, 'C': C.tolist(), 'groups': {}, 'parts': {}}


def put(v, i, keep=1, sub=0, wld=False):
    global nv, ni
    u, inv = np.unique(i, return_inverse=True)
    v, i = v[u], inv.reshape(-1, 3)
    if wld or sub:
        v, i = weld(v, i)
    if sub:
        v, i = subdivide(v, i, sub)
    v, i = simplify(v, i, keep)
    out_pos.append(T(v))
    out_nor.append(normals(v, i))
    out_idx.append(i + nv)
    r = [ni, len(i) * 3]
    nv += len(v)
    ni += len(i) * 3
    return r


def group(gk, names, keep=1, filt=None, sub=0, every=True):
    g0 = ni
    for n in names:
        for p in (allnamed(n) if every else allnamed(n)[:1]):
            v, i = mesh(p)
            if filt:
                i = filt(n, v, i)
                if not len(i):
                    continue
            put(v, i, keep, sub)
    man['groups'][gk] = [g0, ni - g0]
    return man['groups'][gk]


ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth']
# ===== 뼈: 등뼈 아래쪽, 허리뼈, 엉치뼈, 볼기뼈, 아래쪽 갈비뼈 =====
VERT = [f'{o.capitalize()} thoracic vertebra' for o in ORD[7:]] + [f'{o.capitalize()} lumbar vertebra' for o in ORD[:5]]
DISK = sorted(set(p['name'] for p in P if p['name'].startswith('Intervertebral disk') and .96 < p['bounds'][0][1] < 1.27))
group('spine', VERT + DISK + ['Sacrum'], .35, every=False)
group('hip', ['Left hip bone', 'Right hip bone'], .7, every=False)
RIBS = [f'{s} {o} rib' for s in ('Left', 'Right') for o in ORD[6:]]
group('rib', RIBS, .55, every=False)
# ===== 간 (그림 Ⅵ-15: 암모니아 → 요소) =====
LIVER = ['Caudate lobe of liver'] + [f'Hepatovenous segment {r}' for r in ('II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII')]
group('liver', LIVER, .45)
# ===== 심장 =====
group('heart', ['Wall of ventricle', 'Wall of left atrium', 'Wall of right atrium'], .3, every=False)
# ===== 혈관 =====
group('aorta', ['Descending thoracic aorta', 'Abdominal aorta', 'Left common iliac artery', 'Right common iliac artery'], .8, every=False)
group('ivc', ['Inferior vena cava', 'Left common iliac vein', 'Right common iliac vein'], .8)
RA = ['Trunk of left renal artery', 'Left renal artery', 'Anterior division of left renal artery', 'Posterior division of left renal artery',
      'Trunk of right renal artery', 'Right renal artery', 'Anterior division of right renal artery', 'Posterior division of right renal artery']
group('rart', RA, .8)
group('rvein', ['Left renal vein', 'Right renal vein'], .8)
# ===== 배설계 =====
group('kidL', ['Left kidney'], 1, sub=1, every=False)
group('kidR', ['Right kidney'], 1, sub=1, every=False)
group('ureL', ['Left ureter'], 1, sub=1, every=False)
group('ureR', ['Right ureter'], 1, sub=1, every=False)
group('blad', ['Urinary bladder'], 1, sub=2, every=False)


def cut_urethra(n, v, i):
    keep = (v[i].min(1)[:, 1] > .846) & (v[i].max(1)[:, 2] < .03)
    return i[keep]


group('ureth', ['Urethra'], 1, filt=cut_urethra, sub=1, every=False)


# ===== 가운데 길 (대동맥·콩팥동맥·콩팥정맥·대정맥·오줌관) =====
def pts_of(names):
    vs = []
    for n in names:
        for p in allnamed(n):
            vs.append(mesh(p)[0])
    return np.vstack(vs)


def centerline(v, axis, lo, hi, step=.006, sel=None):
    """axis 방향으로 잘라 가운데를 잇는다"""
    if sel is not None:
        v = v[sel(v)]
    out = []
    for a in np.arange(lo, hi + 1e-9, step if hi > lo else -step) if hi > lo else np.arange(lo, hi - 1e-9, -step):
        m = np.abs(v[:, axis] - a) < step * .7
        if m.sum() >= 3:
            out.append(v[m].mean(0))
    return np.array(out)


def smooth(q, it=6):
    q = q.copy()
    for _ in range(it):
        q[1:-1] = .25 * q[:-2] + .5 * q[1:-1] + .25 * q[2:]
    return q


def resample(pts, step):
    pts = np.array(pts)
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    n = max(2, int(d[-1] / step))
    s = np.linspace(0, d[-1], n + 1)
    return np.stack([np.interp(s, d, pts[:, a]) for a in range(3)], 1)


def kcenter(n):
    v = mesh(allnamed(n)[0])[0]
    return v.mean(0), v


kL, kLv = kcenter('Left kidney')
kR, kRv = kcenter('Right kidney')
# 대동맥: 심장 아래(가슴대동맥) → 배대동맥 → 콩팥동맥 갈림 높이
ao = pts_of(['Descending thoracic aorta', 'Abdominal aorta'])
AO = centerline(ao, 1, 1.37, 1.0)
# 콩팥동맥 줄기: 대동맥에서 콩팥문까지 (x 방향)
la = pts_of(['Trunk of left renal artery'])
ra = pts_of(['Trunk of right renal artery'])
LA = centerline(la, 0, .006, .04, .004)
RA_ = centerline(ra, 0, -.006, -.04, .004)
lv = pts_of(['Left renal vein'])
rv = pts_of(['Right renal vein'])
LV = centerline(lv, 0, .045, -.012, .004, sel=lambda v: v[:, 1] > 1.095)
RV = centerline(rv, 0, -.045, -.012, .004, sel=lambda v: v[:, 1] > 1.096)
ivc = pts_of(['Inferior vena cava'])
IV = centerline(ivc, 1, 1.105, 1.268, .006)


def hilum(kv, toward):
    """콩팥문: 가운데 쪽(혈관 쪽) 오목한 곳 가운데"""
    c = kv.mean(0)
    d = toward - c
    d[1] = 0
    d /= np.linalg.norm(d)
    near = np.abs(kv[:, 1] - toward[1]) < .022
    s = (kv - c) @ d
    m = near & (s > np.percentile(s[near], 80))
    return kv[m].mean(0)


hL = hilum(kLv, LA[-1])
hR = hilum(kRv, RA_[-1])
ABR = np.argmin(np.abs(AO[:, 1] - LA[0][1]))


def path_blood(side):
    A_, V_, h, k = (LA, LV, hL, kL) if side == 'L' else (RA_, RV, hR, kR)
    ia = np.argmin(np.abs(AO[:, 1] - A_[0][1]))
    inside = [h, h + (k - h) * .55]
    art = np.vstack([AO[:ia + 1], A_, inside])
    # 콩팥 속에서 정맥으로: 콩팥문 조금 아래로 나온다
    vein = np.vstack([[h + (k - h) * .55 + np.array([0, -.006, .004])], [h + np.array([0, -.004, .006])], V_])
    iv = np.argmin(np.abs(IV[:, 1] - V_[-1][1]))
    ven = np.vstack([vein, IV[iv:], [[-.012, 1.275, .03], [-.004, 1.29, .04]]])
    return np.round(T(smooth(resample(art, .004), 6)), 3).tolist(), np.round(T(smooth(resample(ven, .004), 6)), 3).tolist()


R = {}
R['artL'], R['venL'] = path_blood('L')
R['artR'], R['venR'] = path_blood('R')
# 오줌: 콩팥 속(콩팥깔때기) → 오줌관 → 방광 → 요도
for side, k, h, n in (('L', kL, hL, 'Left ureter'), ('R', kR, hR, 'Right ureter')):
    uv = pts_of([n])
    U = centerline(uv, 1, uv[:, 1].max() - .004, .9, .006)
    bc = mesh(allnamed('Urinary bladder')[0])[0].mean(0)
    pelvis = h + (k - h) * .4
    seq = np.vstack([[pelvis], [h + np.array([0, -.008, 0])], U, [bc + np.array([0, .004, 0])], [bc + np.array([0, -.012, .004])], [[0, .862, -.001]], [[0, .85, .004]]])
    R['uri' + side] = np.round(T(smooth(resample(seq, .004), 5)), 3).tolist()
man['routes'] = R
man['pts'] = {'kL': np.round(T(kL), 3).tolist(), 'kR': np.round(T(kR), 3).tolist(), 'hL': np.round(T(hL), 3).tolist(), 'hR': np.round(T(hR), 3).tolist()}


# ===== 콩팥 속 (HuBMAP): 왼쪽 콩팥 상자에 맞춘다 =====
def read_glb(fn):
    f = open(fn, 'rb')
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
    return J, acc


J, acc = read_glb(GLB)


def node_mesh(name):
    nd = next(n for n in J['nodes'] if n.get('name') == name)
    vs, ids, off = [], [], 0
    for pr in J['meshes'][nd['mesh']]['primitives']:
        v = acc(pr['attributes']['POSITION']).astype(np.float64)
        i = acc(pr['indices']).reshape(-1, 3).astype(np.int64)
        vs.append(v)
        ids.append(i + off)
        off += len(v)
    return np.vstack(vs), np.vstack(ids)


KN = {'cap': ['VH_M_kidney_capsule_L'], 'cor': ['VH_M_outer_cortex_of_kidney_L'], 'col': ['VH_M_renal_column_L'], 'hil': ['VH_M_hilum_of_kidney_L'],
      'pyr': [f'VH_M_renal_pyramid_L_{c}' for c in 'abcdefghi'], 'pap': [f'VH_M_renal_papilla_L_{c}' for c in 'abcdefghi']}
src = {k: [node_mesh(n) for n in ns] for k, ns in KN.items()}
capv = src['cap'][0][0]
slo, shi = capv.min(0), capv.max(0)
print('hra kidney bbox', slo, shi, 'size', shi - slo)
klo, khi = kLv.min(0), kLv.max(0)
hv = src['hil'][0][0]


def pca(v):
    c = v.mean(0)
    w, V = np.linalg.eigh(np.cov((v - c).T))
    return c, V, np.sqrt(w)  # 작은 축 → 큰 축


Ch, Vh, sh = pca(capv)
Cb, Vb, sb = pca(kLv)
# 큰 축은 위쪽, 나머지 축은 콩팥문 쪽이 같도록 부호를 맞춘다
dh, db = hv.mean(0) - Ch, hL - Cb
for a in range(3):
    if a == 2:
        if Vh[1, a] < 0: Vh[:, a] *= -1
        if Vb[1, a] < 0: Vb[:, a] *= -1
    else:
        if dh @ Vh[:, a] < 0: Vh[:, a] *= -1
        if db @ Vb[:, a] < 0: Vb[:, a] *= -1
M_ = Vb @ np.diag(sb / sh) @ Vh.T
FLIP = np.linalg.det(M_) < 0
print('scale', (sb / sh).round(3), 'flip', FLIP)


def mapK(v, sg=None):
    return Cb + (v - Ch) @ M_.T


man['pts']['nL'] = np.round(Vb[:, 0], 4).tolist()  # 왼쪽 콩팥의 가장 얇은 축(자르는 면의 방향)
man['pts']['uL'] = np.round(Vb[:, 2], 4).tolist()
man['kin'] = {}
for k, lst in src.items():
    g0 = ni
    for v, i in lst:
        w = mapK(v)
        if FLIP:
            i = i[:, [0, 2, 1]]
        keep = min(1, (9000 if k in ('cap', 'cor', 'col') else 1600) / len(i))
        w, i2 = simplify(w, i, keep)
        out_pos.append(T(w))
        out_nor.append(normals(w, i2))
        out_idx.append(i2 + nv)
        nv += len(w)
        ni += len(i2) * 3
    man['kin'][k] = [g0, ni - g0]

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
open(OUT + '/ex.bin', 'wb').write(blob)
json.dump(man, open(OUT + '/ex.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('verts', len(pos), 'tris', len(idx) // 3, 'MB', round(len(blob) / 1048576, 2), 'K', K, 'bbox', pos.min(0).round(2), pos.max(0).round(2))
print({k: v[1] // 3 for k, v in man['groups'].items()}, {k: v[1] // 3 for k, v in man['kin'].items()})
print({k: len(v) for k, v in R.items()})
