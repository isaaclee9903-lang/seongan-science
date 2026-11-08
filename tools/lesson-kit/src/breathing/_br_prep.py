# 호흡계 3D 모형 자료 만들기 (자주 돌릴 일 없음. 결과 lessons/breathing/media/chest.bin·chest.json)
# 뼈·가로막·숨관·숨관가지·심장: BodyParts3D 4.0, (c) The Database Center for Life Science, CC BY 4.0
#   https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html  (내려받기: github.com/ashemag/human-atlas 가 나눠 둔 파일)
# 폐 표면: HuBMAP CCF 3D Reference Object Library v1.2 VH_M_Lung.glb, CC BY 4.0
#   https://hubmapconsortium.github.io/ccf/pages/ccf-3d-reference-library.html
# 사용: python -I _br_prep.py <atlas.json·b<N>.gz 폴더> <VH_M_Lung.glb> <lessons/breathing/media>
# 좌표: 가슴 가운데(0, 1.30 m, 0)를 원점으로 1 m = 40. x+ 는 몸의 왼쪽, y+ 위, z+ 앞.
# 갈비뼈는 하나씩 따로 저장하고, 머리(갈비뼈머리)·목 쪽 점·앞 끝을 함께 적어 페이지에서 돌린다.
import json, gzip, os, re, struct, sys, heapq, urllib.request
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


C = np.array([0, 1.30, 0.0])
S = 40.0
T = lambda v: (v - C) * S


def simplify(v, i, keep):
    if len(i) < 120 or keep >= 1:
        return v, i
    a, b = fs.simplify(v.astype(np.float32), i.astype(np.int32), target_reduction=1 - keep)
    return a.astype(np.float64), b.astype(np.int64)


def normals(v, i):
    n = np.zeros_like(v)
    f = np.cross(v[i[:, 1]] - v[i[:, 0]], v[i[:, 2]] - v[i[:, 0]])
    for k in range(3):
        np.add.at(n, i[:, k], f)
    l = np.linalg.norm(n, axis=1, keepdims=True)
    l[l == 0] = 1
    return n / l


def byname(n, pick='big'):
    ps = [p for p in P if p['name'] == n]
    if not ps:
        print('  없음', n)
        return None
    return sorted(ps, key=lambda p: -p['indexCount'])[0]


out_pos, out_nor, out_idx = [], [], []
nv = ni = 0
man = {'S': S, 'C': C.tolist(), 'parts': {}, 'groups': {}}


def put(key, v, i, keep):
    """v는 원래 좌표(m). 줄여서 넣고 [시작, 개수]를 돌려준다"""
    global nv, ni
    u, inv = np.unique(i, return_inverse=True)
    v, i = v[u], inv.reshape(-1, 3)
    v, i = simplify(v, i, keep)
    out_pos.append(T(v))
    out_nor.append(normals(v, i))
    out_idx.append(i + nv)
    r = [ni, len(i) * 3]
    man['parts'].setdefault(key, []).append(r)
    nv += len(v)
    ni += len(i) * 3
    return r


def group(gk, names, keep, filt=None):
    g0 = ni
    for n in names:
        p = byname(n)
        if not p:
            continue
        v, i = mesh(p)
        if filt:
            i = filt(n, v, i)
        put(n, v, i, keep)
    man['groups'][gk] = [g0, ni - g0]


ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth']
# ===== 갈비뼈: 하나씩, 돌리는 축 정보 =====
man['ribs'] = []
for side in ('Left', 'Right'):
    for k, o in enumerate(ORD):
        n = f'{side} {o} rib'
        p = byname(n)
        v, i = mesh(p)
        r = put(n, v, i, .55)
        # 갈비뼈머리: 가운데에 가장 가까운 뒤쪽 점
        back = v[v[:, 2] < (v[:, 2].min() + v[:, 2].max()) / 2]
        head = back[np.abs(back[:, 0]).argmin()]
        d = np.linalg.norm(v - head, axis=1)
        neck = v[(d > .022) & (d < .032)]
        neck = neck[neck[:, 2] < head[2] + .01].mean(0) if len(neck) else head + np.array([np.sign(head[0]) * .02, 0, -.005])
        tip = v[v[:, 2].argmax()] if k < 10 else v[d.argmax()]
        man['ribs'].append({'n': n, 'side': side[0], 'k': k + 1, 'r': r, 'head': T(head).round(3).tolist(), 'neck': T(neck).round(3).tolist(), 'tip': T(tip).round(3).tolist()})
man['groups']['rib'] = [man['ribs'][0]['r'][0], ni - man['ribs'][0]['r'][0]]
# ===== 갈비연골 =====
man['carts'] = []
g0 = ni
for side in ('Left', 'Right'):
    for k, o in enumerate(ORD[:7]):
        n = f'{side} {o} costal cartilage'
        p = byname(n)
        if not p:
            continue
        v, i = mesh(p)
        r = put(n, v, i, .8)
        man['carts'].append({'n': n, 'side': side[0], 'k': k + 1, 'r': r, 'x0': round(float(np.abs(T(v)[:, 0]).min()), 3), 'x1': round(float(np.abs(T(v)[:, 0]).max()), 3)})
man['groups']['cart'] = [g0, ni - g0]
group('stern', ['Manubrium', 'Body of sternum', 'Xiphoid process'], .7)
VERT = ['Atlas', 'Axis'] + [f'{o.capitalize()} cervical vertebra' for o in ORD[2:7]] + [f'{o.capitalize()} thoracic vertebra' for o in ORD] + [f'{o.capitalize()} lumbar vertebra' for o in ORD[:3]]
DISK = [p['name'] for p in P if p['name'].startswith('Intervertebral disk') and p['bounds'][0][1] > 1.03]
group('spine', VERT + sorted(set(DISK)), .3)
group('clav', ['Left clavicle', 'Right clavicle'], .6)
SKULL = ['Frontal bone', 'Left parietal bone', 'Right parietal bone', 'Left temporal bone', 'Right temporal bone', 'Occipital bone', 'Sphenoid bone', 'Ethmoid', 'Left maxilla', 'Right maxilla', 'Left zygomatic bone', 'Right zygomatic bone', 'Left nasal bone', 'Right nasal bone', 'Left palatine bone', 'Right palatine bone', 'Vomer', 'Mandible', 'Hyoid bone']
group('skull', SKULL, .3)
TEETH = [p['name'] for p in P if 'tooth' in p['name']]
group('teeth', sorted(set(TEETH)), .25)
group('nose', ['Left lateral nasal cartilage', 'Right lateral nasal cartilage', 'Septal nasal cartilage', 'Left major alar cartilage', 'Right major alar cartilage'], .8)
group('larynx', ['Thyroid cartilage', 'Cricoid cartilage', 'Epiglottis'], .45)
group('trachea', ['Trachea'], .6)
group('bronchi', ['Left main bronchus', 'Right main bronchus proper'], .6)
TREE = [p for p in P if 'bronchial tree' in p['name']]
g0 = ni
for p in TREE:
    v, i = mesh(p)
    put('tree', v, i, .5)
man['groups']['tree'] = [g0, ni - g0]
group('diaph', ['Diaphragm'], .5)
group('heart', ['Wall of ventricle', 'Wall of left atrium', 'Wall of right atrium'], .35)
group('vessel', ['Ascending aorta', 'Arch of aorta', 'Pulmonary trunk', 'Superior vena cava', 'Descending thoracic aorta'], .5)


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


PV = []
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
    PV.append((np.vstack(vs), np.vstack(ids)))
# 갈비뼈 안쪽에 맞춘다 (자료마다 사람이 달라 축마다 늘리고 줄인다)
LO = np.array([-.128, 1.118, -.088])
HI = np.array([.128, 1.447, .082])
allv = np.vstack([a for a, _ in PV])
slo, shi = allv.min(0), allv.max(0)
print('lung src bbox', slo, shi)
man['lung'] = {}
for nm, (v, i) in zip(('L', 'R'), PV):
    w = LO + (v - slo) / (shi - slo) * (HI - LO)
    w, i = simplify(w, i, min(1, 8000 / len(i)))
    out_pos.append(T(w))
    out_nor.append(normals(w, i))
    out_idx.append(i + nv)
    man['lung'][nm] = [ni, len(i) * 3]
    nv += len(w)
    ni += len(i) * 3


# ===== 공기 길: 숨관 → 숨관가지 → 구역 숨관가지 끝 =====
def graph(v, i):
    adj = [[] for _ in range(len(v))]
    e = np.vstack([i[:, [0, 1]], i[:, [1, 2]], i[:, [2, 0]]])
    w = np.linalg.norm(v[e[:, 0]] - v[e[:, 1]], axis=1)
    for (a, b), c in zip(e.tolist(), w.tolist()):
        adj[a].append((b, c))
        adj[b].append((a, c))
    return adj


def dijk(adj, s, t):
    dist = {s: 0}
    prev = {}
    h = [(0, s)]
    while h:
        d, x = heapq.heappop(h)
        if x == t:
            break
        if d > dist.get(x, 1e18):
            continue
        for y, c in adj[x]:
            nd = d + c
            if nd < dist.get(y, 1e18):
                dist[y] = nd
                prev[y] = x
                heapq.heappush(h, (nd, y))
    if t not in prev and t != s:
        return None
    o = [t]
    while o[-1] != s:
        o.append(prev[o[-1]])
    return o[::-1]


def resample(pts, step):
    pts = np.array(pts)
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    if d[-1] < step:
        return np.array([pts[0], pts[-1]])
    n = max(2, int(d[-1] / step))
    s = np.linspace(0, d[-1], n + 1)
    return np.stack([np.interp(s, d, pts[:, a]) for a in range(3)], 1)


def smooth(pts, it=4):
    q = pts.copy()
    for _ in range(it):
        q[1:-1] = .25 * q[:-2] + .5 * q[1:-1] + .25 * q[2:]
    return q


def center(v, path):
    q = resample(path, .003)
    for _ in range(3):
        for j in range(len(q)):
            d = np.linalg.norm(v - q[j], axis=1)
            m = d < max(d.min() * 1.7, .004)
            if m.any():
                q[j] = v[m].mean(0)
    return smooth(q, 6)


def closest(a, b):
    ia = np.linspace(0, len(a) - 1, min(len(a), 700)).astype(int)
    ib = np.linspace(0, len(b) - 1, min(len(b), 700)).astype(int)
    d = np.linalg.norm(a[ia][:, None] - b[ib][None], axis=2)
    x, y = np.unravel_index(d.argmin(), d.shape)
    return a[ia[x]], b[ib[y]]


def route(names):
    ms = [mesh(byname(n)) for n in names]
    pts = []
    for k, (v, i) in enumerate(ms):
        adj = graph(v, i)
        if k:
            A_ = closest(ms[k - 1][0], v)[1]
            sa = int(np.linalg.norm(v - A_, axis=1).argmin())
        if k < len(ms) - 1:
            B_ = closest(v, ms[k + 1][0])[0]
            sb = int(np.linalg.norm(v - B_, axis=1).argmin())
        if not k:
            sa = int(np.argmax(v[:, 1]))  # 숨관 맨 위에서 시작
        if k == len(ms) - 1:
            sb = int(np.linalg.norm(v - v[sa], axis=1).argmax())
        pth = dijk(adj, sa, sb)
        if pth is None or len(pth) < 2:
            pts += [v[sa].tolist(), v[sb].tolist()]
            continue
        pts += center(v, v[pth]).tolist()
    return T(smooth(resample(pts, .004), 8))


R = {}
for key, last in [('L1', 'Left anterior segmental bronchial tree'), ('L2', 'Left lateral basal segmental bronchial tree'), ('L3', 'Superior lingular bronchial tree'), ('L4', 'Left posterior basal segmental bronchial tree'), ('L5', 'Left apical segmental bronchial tree'),
                  ('R1', 'Right anterior segmental bronchial tree'), ('R2', 'Right lateral basal segmental bronchial tree'), ('R3', 'Lateral segmental bronchial tree'), ('R4', 'Right posterior basal segmental bronchial tree'), ('R5', 'Right apical segmental bronchial tree')]:
    main = 'Left main bronchus' if key[0] == 'L' else 'Right main bronchus proper'
    q = route(['Trachea', main, last])
    R[key] = np.round(q, 3).tolist()
    print(key, len(q), np.round(q[0], 2), np.round(q[-1], 2))
# 코에서 숨관 위까지 (콧속 → 목): 머리뼈 자료를 보고 정한 점
UP = np.array([[0, 1.566, .112], [0, 1.570, .088], [0, 1.574, .060], [0, 1.573, .032], [0, 1.566, .008], [0, 1.548, -.004], [0, 1.525, -.004], [0, 1.503, .002], [0, 1.488, .002], [0, 1.474, -.004]])
R['up'] = np.round(T(smooth(resample(UP, .003), 10)), 3).tolist()
man['routes'] = R

# ===== 저장: 위치는 16비트로 줄인다 =====
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
open(OUT + '/chest.bin', 'wb').write(blob)
json.dump(man, open(OUT + '/chest.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('verts', len(pos), 'tris', len(idx) // 3, 'MB', round(len(blob) / 1048576, 2), 'K', K, 'bbox', pos.min(0), pos.max(0))
print({k: v[1] // 3 for k, v in man['groups'].items()})
