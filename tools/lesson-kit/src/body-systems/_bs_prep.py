# 기관계 한 몸 3D 모형 자료 만들기 (자주 돌릴 일 없음. 결과 lessons/body-systems/media/bs.bin·bs.json)
# 뼈·소화계·순환계·호흡계(숨관·숨관가지)·배설계·넓적다리 근육: BodyParts3D 4.0, (c) The Database Center for Life Science, CC BY 4.0
#   https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html  (내려받기: github.com/ashemag/human-atlas 가 나눠 둔 파일)
# 폐 표면: HuBMAP CCF 3D Reference Object Library v1.2 VH_M_Lung.glb, CC BY 4.0
#   https://hubmapconsortium.github.io/ccf/pages/ccf-3d-reference-library.html
# 사용: python -I _bs_prep.py <atlas.json·b<N>.gz 폴더> <VH_M_Lung.glb> <lessons/body-systems/media>
# 좌표: (0, 1.15 m, 0)을 원점으로 1 m = 40. x+ 는 몸의 왼쪽, y+ 위, z+ 앞. (배설 수업 ex.bin 과 같은 축, 원점만 다름)
# 학생용 그림이라 생식기 쪽과 피부는 넣지 않는다. 다리는 넓적다리 중간에서 자른다.
import json, gzip, os, re, struct, sys, urllib.request
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


C = np.array([0, 1.15, 0])
S = 40.0
T = lambda v: (np.asarray(v, float) - C) * S
YCUT = .63  # 넓적다리를 자르는 높이


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


def allnamed(n, quiet=False):
    ps = [p for p in P if p['name'] == n]
    if not ps and not quiet:
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


def legcut(n, v, i):
    return i[v[i].min(1)[:, 1] > YCUT]


def group(gk, names, keep=1, filt=None, sub=0, every=True, sel=None):
    g0 = ni
    for n in names:
        for p in (allnamed(n) if every else allnamed(n)[:1]):
            if sel and not sel(p):
                continue
            v, i = mesh(p)
            if filt:
                i = filt(n, v, i)
                if not len(i):
                    continue
            put(v, i, keep, sub)
    man['groups'][gk] = [g0, ni - g0]
    print(gk, (ni - g0) // 3)
    return man['groups'][gk]


NAMES = set(p['name'] for p in P)
ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth']
# ===== 뼈 =====
SKULL = ['Frontal bone', 'Occipital bone', 'Left parietal bone', 'Right parietal bone', 'Left temporal bone', 'Right temporal bone', 'Left maxilla', 'Right maxilla', 'Mandible',
         'Left zygomatic bone', 'Right zygomatic bone', 'Sphenoid bone', 'Left nasal bone', 'Right nasal bone']
group('skull', SKULL, .3, every=False)
VERT = [n for n in NAMES if re.fullmatch(r'(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth) (cervical|thoracic|lumbar) vertebra', n)] + [n for n in ('Atlas', 'Axis') if n in NAMES]
group('spine', sorted(VERT) + ['Sacrum'], .3, every=False)
RIBS = [f'{s} {o} rib' for s in ('Left', 'Right') for o in ORD]
group('rib', RIBS + [n for n in NAMES if re.fullmatch(r'(Manubrium|Body) of sternum|Xiphoid process', n)] + ['Left clavicle', 'Right clavicle'], .45, every=False)
group('hip', ['Left hip bone', 'Right hip bone'], .6, every=False)
group('femur', ['Left femur', 'Right femur'], .8, filt=legcut, every=False)
# 넓적다리 근육 (조직세포의 예)
group('musR', ['Right rectus femoris', 'Right vastus lateralis', 'Right vastus medialis'], .7, filt=legcut, every=False)
group('musL', ['Left rectus femoris', 'Left vastus lateralis', 'Left vastus medialis'], .7, filt=legcut, every=False)
# ===== 소화계 =====
group('eso', ['Esophagus'], 1, sub=1, every=False)
group('sto', ['Stomach'], 1, sub=1, every=False)
SI = ['Duodenum'] + [n for n in NAMES if re.fullmatch(r'(Proximal|Middle|Distal) part of (jejunum|ileum)', n)]
group('si', SI, .8)
group('li', ['Ascending colon', 'Transverse colon', 'Descending colon', 'Rectum', 'Appendix'] + [n for n in NAMES if re.fullmatch(r'Sigmoid colon|Cecum|Caecum', n)], .8, every=False)
LIVER = ['Caudate lobe of liver'] + [f'Hepatovenous segment {r}' for r in ('II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII')]
group('liver', LIVER, .45)
group('gall', ['Gallbladder'], .8, every=False)
group('pan', ['Parenchyma of pancreas'], .6, every=False)
# ===== 호흡계 (숨관·숨관가지) =====
group('tra', ['Trachea'], .7, every=False)
BR = ['Right main bronchus proper', 'Left main bronchus'] + [n for n in NAMES if n.endswith('bronchial tree')]
group('bro', BR, .6, sel=lambda p: p['bounds'][1][1] > 1.14)
group('dia', ['Diaphragm'], .22, every=False)
# ===== 순환계 =====
group('heart', ['Wall of ventricle', 'Wall of left atrium', 'Wall of right atrium'], .3, every=False)
ART = ['Ascending aorta', 'Arch of aorta', 'Descending thoracic aorta', 'Abdominal aorta', 'Brachiocephalic artery', 'Left common carotid artery', 'Right common carotid artery',
       'Left subclavian artery', 'Right subclavian artery', 'Celiac trunk', 'Superior mesenteric artery', 'Left common iliac artery', 'Right common iliac artery',
       'Left external iliac artery', 'Right external iliac artery', 'Left femoral artery', 'Right femoral artery',
       'Trunk of left renal artery', 'Left renal artery', 'Trunk of right renal artery', 'Right renal artery']
group('art', ART, .7, filt=legcut, every=False)
VEI = ['Superior vena cava', 'Inferior vena cava', 'Left brachiocephalic vein', 'Right brachiocephalic vein', 'Left internal jugular vein', 'Right internal jugular vein',
       'Left subclavian vein', 'Right subclavian vein', 'Left common iliac vein', 'Right common iliac vein', 'Left external iliac vein', 'Right external iliac vein',
       'Left femoral vein', 'Right femoral vein', 'Left renal vein', 'Right renal vein', 'Superior mesenteric vein', 'Splenic vein', 'Hepatic portal vein']
group('vei', VEI, .7, filt=legcut)
group('pa', ['Pulmonary trunk', 'Left pulmonary artery', 'Right pulmonary artery'], .7, every=False)
group('pv', [n for n in NAMES if re.fullmatch(r'(Left|Right) (superior|inferior) pulmonary vein', n)], .8, every=False)
# ===== 배설계 =====
group('kid', ['Left kidney', 'Right kidney'], 1, sub=1, every=False)
group('ure', ['Left ureter', 'Right ureter'], 1, sub=1, every=False)
group('blad', ['Urinary bladder'], 1, sub=2, every=False)
group('ureth', ['Urethra'], 1, filt=lambda n, v, i: i[(v[i].min(1)[:, 1] > .846) & (v[i].max(1)[:, 2] < .03)], sub=1, every=False)


# ===== 폐 표면 (HuBMAP) =====
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


def under(name):
    root = next(i for i, n in enumerate(J['nodes']) if n.get('name') == name)
    res, st = [], [root]
    while st:
        x = st.pop()
        st += J['nodes'][x].get('children', [])
        if 'mesh' in J['nodes'][x]:
            res.append(x)
    return res


PVs = []
for name in ('VH_M_lungs_L', 'VH_M_lungs_R'):
    vs, ids, off = [], [], 0
    for nd in under(name):
        if 'hilum' in J['nodes'][nd]['name']:
            continue
        for pr in J['meshes'][J['nodes'][nd]['mesh']]['primitives']:
            v = acc(pr['attributes']['POSITION']).astype(np.float64)
            i = acc(pr['indices']).reshape(-1, 3).astype(np.int64)
            vs.append(v)
            ids.append(i + off)
            off += len(v)
    PVs.append((np.vstack(vs), np.vstack(ids)))
LO = np.array([-.128, 1.118, -.088])  # 호흡 수업 _br_prep.py 와 같은 상자(갈비뼈 안쪽)
HI = np.array([.128, 1.447, .082])
allv = np.vstack([a for a, _ in PVs])
slo, shi = allv.min(0), allv.max(0)
LUNGV = {}
for nm, (v, i) in zip(('L', 'R'), PVs):
    w = LO + (v - slo) / (shi - slo) * (HI - LO)
    LUNGV[nm] = w
    g0 = ni
    w2, i2 = simplify(w, i, min(1, 7000 / len(i)))
    out_pos.append(T(w2))
    out_nor.append(normals(w2, i2))
    out_idx.append(i2 + nv)
    nv += len(w2)
    ni += len(i2) * 3
    man['groups']['lung' + nm] = [g0, ni - g0]
# 폐의 왼쪽(x+)·오른쪽이 맞는지
print('lungL x', LUNGV['L'][:, 0].mean().round(3), 'lungR x', LUNGV['R'][:, 0].mean().round(3))


# ===== 길: 안내선을 따라 메시 점을 나눠 평균한 가운데 선 =====
def pts_of(names, sel=None):
    vs = []
    for n in names:
        for p in allnamed(n):
            v = mesh(p)[0]
            vs.append(v)
    v = np.vstack(vs)
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


def cline(names, guide, nb=None, maxd=.03, sel=None):
    v = pts_of(names, sel)
    s, d = proj(guide, v)
    g = np.asarray(guide, float)
    tot = np.linalg.norm(np.diff(g, axis=0), axis=1).sum()
    nb = nb or max(4, int(tot / .006))
    out = []
    for k in range(nb):
        m = (s >= k / nb) & (s < (k + 1) / nb) & (d < maxd)
        if m.sum() >= 2:
            out.append(v[m].mean(0))
    if len(out) < max(3, nb // 3):
        print('  안내선 사용', names, len(out), '/', nb)
        return resample(g, .006)
    return np.array(out)


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


def cent(n):
    return pts_of([n]).mean(0)


# --- 기준점 (m) ---
NOSE = np.array([0, 1.585, .095])
MOUTH = np.array([0, 1.538, .085])
PHX = np.array([0, 1.515, .0])
# 폐 속 깊은 곳 (허파꽈리가 모인 곳의 예)
lungR = LUNGV['R'].mean(0) + np.array([-.012, -.01, 0])
lungL = LUNGV['L'].mean(0) + np.array([.012, -.02, 0])
if lungR[0] > 0:
    lungR, lungL = lungL, lungR
# 심장 방
hv_ = pts_of(['Wall of right atrium'])
RA = hv_.mean(0)
RV = pts_of(['Wall of ventricle']).mean(0) + np.array([-.012, -.004, .018])
LV = pts_of(['Wall of ventricle']).mean(0) + np.array([.018, -.008, -.006])
LA = pts_of(['Wall of left atrium']).mean(0)
print('RA', RA.round(3), 'RV', RV.round(3), 'LA', LA.round(3), 'LV', LV.round(3))

# --- 공기 길 ---
TRA = cline(['Trachea'], [[0, 1.476, -.004], [0, 1.36, -.012]], maxd=.02)
BRR = cline(['Right main bronchus proper'], [[-.004, 1.37, -.018], [-.03, 1.33, -.022], [-.05, 1.29, -.025]], maxd=.016)
BRL = cline(['Left main bronchus'], [[.004, 1.37, -.018], [.04, 1.35, -.022], [.07, 1.31, -.02]], maxd=.016)
AIR_R = np.vstack([[NOSE + [0, .012, .022], NOSE, PHX], TRA, BRR, [lungR]])
AIR_L = np.vstack([[MOUTH + [0, 0, .035], MOUTH, PHX], TRA, BRL, [lungL]])

# --- 혈관 길 ---
AO = np.vstack([cline(['Ascending aorta'], [[.01, 1.31, .02], [.012, 1.36, .032]], maxd=.02),
                cline(['Arch of aorta'], [[.01, 1.36, .03], [.012, 1.39, .01], [.022, 1.385, -.02], [.022, 1.37, -.035]], maxd=.022),
                cline(['Descending thoracic aorta'], [[.02, 1.375, -.035], [.015, 1.21, -.01]], maxd=.02),
                cline(['Abdominal aorta'], [[.014, 1.214, -.006], [.01, 1.03, .015]], maxd=.02)])
ILA = np.vstack([cline(['Right common iliac artery'], [[.008, 1.04, .018], [-.03, .985, .016]], maxd=.016),
                 cline(['Right external iliac artery'], [[-.03, .99, .01], [-.05, .89, .03]], maxd=.016),
                 cline(['Right femoral artery'], [[-.05, .9, .03], [-.056, .72, .02]], maxd=.014, sel=lambda v: v[:, 1] > .7)])
CELLS = ILA[-1] + np.array([-.018, -.004, .016])  # 넓적다리 근육 속 조직세포
VEN_LEG = np.vstack([cline(['Right femoral vein'], [[-.06, .72, .015], [-.05, .88, .03]], maxd=.016, sel=lambda v: v[:, 1] > .7),
                     cline(['Right external iliac vein'], [[-.05, .88, .03], [-.03, .98, .0]], maxd=.016),
                     cline(['Right common iliac vein'], [[-.03, .98, .0], [-.012, 1.04, .015]], maxd=.016)])
IVC = cline(['Inferior vena cava'], [[-.012, 1.03, .016], [-.015, 1.17, .016], [-.016, 1.27, .016]], maxd=.02)
PT = cline(['Pulmonary trunk'], [[.02, 1.338, .05], [.03, 1.37, .03]], maxd=.02)
PAR = cline(['Right pulmonary artery'], [[.02, 1.36, .0], [-.02, 1.35, -.01], [-.055, 1.33, -.02]], maxd=.02)
PAL = cline(['Left pulmonary artery'], [[.03, 1.36, .02], [.05, 1.36, -.01], [.075, 1.33, -.02]], maxd=.02)
PVR = smooth([lungR, [-.04, 1.31, -.015], [-.022, 1.314, -.01], LA], 2)
PVL = smooth([lungL, [.05, 1.32, -.02], [.04, 1.32, -.012], LA], 2)
HEART_R = [RA, RV + [0, -.01, 0], RV + [0, .02, .005]]  # 우심방 → 우심실 → 폐동맥으로
HEART_L = [LA, LV + [0, -.01, 0], LV + [-.01, .02, .01], AO[0]]  # 좌심방 → 좌심실 → 대동맥으로


def ivc_from(y):
    k = np.argmin(np.abs(IVC[:, 1] - y))
    return IVC[k:]


def ao_to(y):
    k = np.argmin(np.abs(AO[:, 1] - y) + (np.arange(len(AO)) < len(AO) * .3) * 9)
    return AO[:k + 1]


# 콩팥 (왼쪽) — 배설 수업과 같은 방법
kLv = pts_of(['Left kidney'])
kL = kLv.mean(0)
LRA = cline(['Trunk of left renal artery', 'Left renal artery'], [[.012, 1.1, .0], [.03, 1.1, -.01], [.045, 1.105, -.016]], maxd=.012)
c = kL
hL = (LRA[-1] + kL) / 2
URL = cline(['Left ureter'], [[.04, 1.08, -.02], [.035, 1.0, -.025], [.03, .92, -.03], [.02, .9, -.01]], maxd=.014)
bc = pts_of(['Urinary bladder']).mean(0)
URI = np.vstack([[kL + (hL - kL) * .3], [hL + [0, -.01, 0]], URL, [bc + [0, .004, 0], bc + [0, -.012, .004], [0, .862, -.001], [0, .85, .004]]])
LRV = cline(['Left renal vein'], [[.045, 1.11, -.01], [.02, 1.11, .0], [-.01, 1.11, .012]], maxd=.014, sel=lambda v: v[:, 1] > 1.09)

# --- 소화관 ---
ESO = cline(['Esophagus'], [[.0, 1.468, -.01], [.0, 1.36, -.025], [.008, 1.27, -.02], [.02, 1.2, .005]], maxd=.02)
STO = smooth([[.03, 1.215, .015], [.06, 1.21, .04], [.07, 1.17, .06], [.04, 1.145, .065], [.005, 1.145, .055], [-.02, 1.15, .045]], 2)
DUO = cline(['Duodenum'], [[-.02, 1.15, .045], [-.05, 1.13, .03], [-.05, 1.09, .025], [-.02, 1.07, .025], [.02, 1.08, .02]], maxd=.025)
JEJ = smooth([[.03, 1.085, .035], [.06, 1.08, .055], [.08, 1.05, .065], [.05, 1.03, .072], [.02, 1.04, .075], [.0, 1.02, .07]], 2)
ABS = JEJ[3]  # 작은창자에서 흡수되는 곳
FOOD = np.vstack([[MOUTH + [0, .005, .03], MOUTH, PHX], ESO, STO, DUO, JEJ[:4]])
SMV = cline(['Superior mesenteric vein'], [[-.03, 1.0, .03], [-.02, 1.08, .035], [-.012, 1.14, .03]], maxd=.016)
POR = cline(['Hepatic portal vein'], [[-.013, 1.14, .03], [-.018, 1.19, .036]], maxd=.014)
LIVc = cent('Hepatovenous segment V') if 'Hepatovenous segment V' in NAMES else np.array([-.06, 1.2, .03])
NUT_IN = np.vstack([[ABS, ABS + [-.02, -.01, -.02], [-.025, 1.03, .03]], SMV, POR, [[-.03, 1.215, .035], [-.02, 1.245, .02]], ivc_from(1.25)])

# ===== 이어 붙인 길과 이름 표시 =====
R, MARKS = {}, {}


def route(key, legs):
    """legs: [(이름, 점들)...] → 하나의 길과 각 이름이 시작되는 비율"""
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
    sm = smooth(pts, 3)
    rs = resample(sm, .004)
    marks, last = [], None
    for x, nm, dd in zip(pts, names, d):
        if nm != last:
            marks.append([round(float(dd / d[-1]), 4), nm])
            last = nm
    R[key] = np.round(T(rs), 3).tolist()
    MARKS[key] = marks


LUNG_TO_CELLS = lambda lung, pv: [('폐정맥', [lung] + list(pv[1:-1])), ('심장(좌심방 → 좌심실)', HEART_L), ('대동맥', AO), ('온몸으로 가는 동맥', ILA), ('조직세포', [CELLS])]
CELLS_TO_LUNG = lambda pa, lung: [('조직세포', [CELLS]), ('온몸에서 오는 정맥', VEN_LEG), ('대정맥', IVC), ('심장(우심방 → 우심실)', HEART_R), ('폐동맥', np.vstack([PT, pa])), ('폐', [lung])]
# 산소: 코 → 숨관 → 폐 → 혈액 → 심장 → 대동맥 → 조직세포
route('o2', [('코', AIR_R[:2]), ('숨관', np.vstack([AIR_R[2:3], TRA])), ('숨관가지', BRR), ('폐(허파꽈리)', [lungR])] + LUNG_TO_CELLS(lungR, PVR))
# 이산화 탄소: 조직세포 → 정맥 → 심장 → 폐 → 숨관 → 코
route('co2', CELLS_TO_LUNG(PAL, lungL) + [('숨관가지', BRL[::-1]), ('숨관', TRA[::-1]), ('입·코 밖으로', [PHX, MOUTH, MOUTH + [0, 0, .035]])])
# 영양소: 입 → 식도 → 위 → 작은창자에서 흡수 → 간 → 대정맥 → 심장 → 폐 → 심장 → 대동맥 → 조직세포
route('nut', [('입', FOOD[:3]), ('식도', ESO), ('위', STO), ('작은창자', np.vstack([DUO, JEJ[:4]])), ('흡수되어 혈액으로', NUT_IN[:3]), ('혈액을 따라 심장으로', NUT_IN[3:-len(ivc_from(1.25))]),
              ('대정맥', ivc_from(1.25)), ('심장(우심방 → 우심실)', HEART_R), ('폐동맥', np.vstack([PT, PAR])), ('폐를 지나', [lungR])] + LUNG_TO_CELLS(lungR, PVR))
# 노폐물: 조직세포 → 정맥 → 심장 → 폐 → 심장 → 대동맥 → 콩팥동맥 → 콩팥 → 오줌관 → 방광 → 요도
route('was', CELLS_TO_LUNG(PAR, lungR)[:-1] + [('폐를 지나', [lungR]), ('폐정맥', PVR[1:-1]), ('심장(좌심방 → 좌심실)', HEART_L), ('대동맥', ao_to(1.1)), ('콩팥동맥', LRA), ('콩팥', [hL, kL + (hL - kL) * .3]),
              ('오줌관', URI[1:-4]), ('방광', URI[-4:-2]), ('요도', URI[-2:])])
# 계속 흐르는 혈액 고리(심장 → 온몸 → 심장, 심장 → 폐 → 심장)
route('sys', [('대동맥', HEART_L[1:] + list(AO)), ('동맥', ILA), ('조직세포', [CELLS]), ('정맥', VEN_LEG), ('대정맥', IVC), ('심장', HEART_R[:1])])
route('pul', [('심장', HEART_R), ('폐동맥', np.vstack([PT, PAR])), ('폐', [lungR]), ('폐정맥', PVR[1:]), ('심장', HEART_L[:2])])
route('pulL', [('심장', HEART_R), ('폐동맥', np.vstack([PT, PAL])), ('폐', [lungL]), ('폐정맥', PVL[1:]), ('심장', HEART_L[:2])])
man['routes'] = R
man['marks'] = MARKS
man['pts'] = {k: np.round(T(v), 3).tolist() for k, v in dict(cells=CELLS, lungR=lungR, lungL=lungL, RA=RA, RV=RV, LA=LA, LV=LV, kL=kL, hL=hL, abs=ABS, bc=bc, liv=LIVc, mouth=MOUTH, nose=NOSE,
                                                                  sto=np.array([.06, 1.18, .05]), heart=pts_of(['Wall of ventricle']).mean(0)).items()}

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
open(OUT + '/bs.bin', 'wb').write(blob)
json.dump(man, open(OUT + '/bs.json', 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print('verts', len(pos), 'tris', len(idx) // 3, 'MB', round(len(blob) / 1048576, 2), 'K', K, 'bbox', pos.min(0).round(2), pos.max(0).round(2))
print({k: len(v) for k, v in R.items()})
for k, m in MARKS.items():
    print(k, m)
