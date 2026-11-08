# 온몸 혈액 순환 3D 모형 자료 만들기 (자주 돌릴 일 없음. 결과 lessons/blood-circulation/media/body.bin·body.json)
# 혈관·뼈: BodyParts3D 4.0, (c) The Database Center for Life Science, CC BY 4.0
#   https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html  (내려받기: github.com/ashemag/human-atlas 가 나눠 둔 파일)
# 폐 표면: HuBMAP CCF 3D Reference Object Library v1.2 VH_M_Lung.glb, CC BY 4.0
#   https://hubmapconsortium.github.io/ccf/pages/ccf-3d-reference-library.html
# 사용: python -I _circ_prep.py <atlas.json·b<N>.gz 폴더> <VH_M_Lung.glb> <lessons/blood-circulation/media>
# 좌표는 순환계 수업 heart.bin 과 같다(심장 중심 원점, 심장 크기 약 4). 그래서 CV3.heart 무대에 그대로 얹을 수 있다.
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


def L(p):
    b = p['bounds']
    return max(b[1][i] - b[0][i] for i in range(3))


# 심장 기준 좌표 (_anat_prep.py 와 같게)
HB = [p['bounds'] for p in P if p['name'] in ('Wall of ventricle', 'Wall of left atrium', 'Wall of right atrium')]
mn = np.array([min(b[0][i] for b in HB) for i in range(3)])
mx = np.array([max(b[1][i] for b in HB) for i in range(3)])
C = (mn + mx) / 2
S = 4.0 / float((mx - mn).max())
print('C', C, 'S', S)
T = lambda v: (v - C) * S

# 학생용 그림이라 생식기 쪽 혈관은 넣지 않는다. 간 속·갈비뼈 사이의 빽빽한 혈관, 심장 표면 혈관도 뺀다
NO = re.compile(r'penis|testic|pudend|obturator|rectal|hepatic|hepatovenous|portal|tributary|intercostal|caudate|coronary|interventricular|cardiac|marginal vein|phrenic|epigastric|lumbar|sacral|gluteal', re.I)
IN_HEART = {'Ascending aorta', 'Arch of aorta', 'Superior vena cava'}
isPA = lambda n: n in ('Pulmonary trunk', 'Left pulmonary artery', 'Right pulmonary artery') or (re.search(r'(segmental|lingular) artery', n) is not None)
isPV = lambda n: re.search(r'pulmonary vein|(segmental|lingular) vein', n) is not None

groups = {'pa': [], 'pv': [], 'art': [], 'vei': []}
for p in P:
    n = p['name']
    if NO.search(n) or n in IN_HEART:
        continue
    # 간의 구역 동맥도 이름이 같아서 높이로 가른다 (간은 폐보다 아래)
    inLung = p['bounds'][1][1] > 1.14
    if p['system'] == 'arterial':
        if isPA(n) and inLung:
            groups['pa'].append(p)
        elif L(p) > .045:
            groups['art'].append(p)
    if p['system'] == 'venous':
        if isPV(n) and inLung:
            groups['pv'].append(p)
        elif L(p) > .045:
            groups['vei'].append(p)
print({k: (len(v), sum(p['indexCount'] for p in v) // 3) for k, v in groups.items()})


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


HEART_R = {'pa': .085, 'pv': .082}
IVC_YMIN = float(mn[1] - .02)
out_pos, out_nor, out_idx = [], [], []
nv = ni = 0
man = {'S': S, 'C': C.tolist(), 'groups': {}, 'parts': {}}


def trim(p, k, v, i):
    # 순환계 심장 자료에 이미 들어 있는 부분(심장 가까운 큰 혈관)은 겹치지 않게 뺀다
    if k in HEART_R and (p['name'] in ('Pulmonary trunk', 'Left pulmonary artery', 'Right pulmonary artery') or 'pulmonary vein' in p['name']):
        d = np.linalg.norm(v[i] - C, axis=2).max(axis=1)
        i = i[d > HEART_R[k]]
    if p['name'] == 'Inferior vena cava':
        i = i[v[i][:, :, 1].min(axis=1) < IVC_YMIN]
    return i


for k, L_ in groups.items():
    g0 = ni
    keep = .4 if k in ('art', 'vei') else .6
    for p in L_:
        v, i = mesh(p)
        i = trim(p, k, v, i)
        if not len(i):
            continue
        u, inv = np.unique(i, return_inverse=True)
        v, i = v[u], inv.reshape(-1, 3)
        v, i = simplify(v, i, keep)
        nn = normals(v, i)
        out_pos.append(T(v))
        out_nor.append(nn)
        out_idx.append(i + nv)
        man['parts'].setdefault(p['name'], []).append([ni, len(i) * 3])
        nv += len(v)
        ni += len(i) * 3
    man['groups'][k] = [g0, ni - g0]


# 폐 표면
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
# 혈관 자료에 맞춰 폐 틀을 맞춘다 (자료마다 사람이 달라 축마다 늘리고 줄인다)
vb = [p['bounds'] for p in groups['pa'] + groups['pv'] if re.search('segmental|lingular', p['name'])]
tlo = np.array([min(b[0][i] for b in vb) for i in range(3)])
thi = np.array([max(b[1][i] for b in vb) for i in range(3)])
tlo2 = tlo + np.array([-.006, .022, -.012])
thi2 = thi + np.array([.006, .035, .018])
allv = np.vstack([a for a, _ in PV])
slo, shi = allv.min(0), allv.max(0)
man['lung'] = {}
for nm, (v, i) in zip(('L', 'R'), PV):
    w = tlo2 + (v - slo) / (shi - slo) * (thi2 - tlo2)
    w, i = simplify(w, i, min(1, 7000 / len(i)))
    nn = normals(w, i)
    out_pos.append(T(w))
    out_nor.append(nn)
    out_idx.append(i + nv)
    man['lung'][nm] = [ni, len(i) * 3]
    nv += len(w)
    ni += len(i) * 3

# 다리 뼈 (무릎 구부리기 장면에서 쓴다)
BONES = ['Left femur', 'Left tibia', 'Left fibula', 'Left patella', 'Right femur', 'Right tibia', 'Right fibula', 'Right patella']
g0 = ni
for p in P:
    if p['name'] in BONES:
        v, i = mesh(p)
        v, i = simplify(v, i, .9)
        out_pos.append(T(v))
        out_nor.append(normals(v, i))
        out_idx.append(i + nv)
        man['parts'].setdefault(p['name'], []).append([ni, len(i) * 3])
        nv += len(v)
        ni += len(i) * 3
man['groups']['bone'] = [g0, ni - g0]

# ===== 혈관 가운데 길 =====
byname = {}
for p in P:
    if p['system'] in ('arterial', 'venous', 'cardiac'):
        byname.setdefault(p['name'], []).append(p)


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
    # 벽을 따라간 길을 관 가운데로 옮긴다
    q = resample(path, .004)
    for _ in range(3):
        for j in range(len(q)):
            d = np.linalg.norm(v - q[j], axis=1)
            m = d < max(d.min() * 1.7, .004)
            if m.any():
                q[j] = v[m].mean(0)
    return smooth(q, 6)


def part_chain(names):
    L_ = []
    for n in names:
        ps = byname.get(n)
        if not ps:
            print('  없음', n)
            continue
        L_.append(sorted(ps, key=lambda p: -p['bounds'][1][1])[0] if 'segmental' in n else sorted(ps, key=lambda p: -p['indexCount'])[0])
    return L_


def closest(a, b):
    ia = np.linspace(0, len(a) - 1, min(len(a), 700)).astype(int)
    ib = np.linspace(0, len(b) - 1, min(len(b), 700)).astype(int)
    d = np.linalg.norm(a[ia][:, None] - b[ib][None], axis=2)
    x, y = np.unravel_index(d.argmin(), d.shape)
    return a[ia[x]], b[ib[y]]


def route(names):
    ps = part_chain(names)
    ms = [mesh(p) for p in ps]
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
            # 첫 관: 다음 관에서 가장 먼 쪽에서 시작
            sa = int(np.linalg.norm(v - v[sb], axis=1).argmax())
        if k == len(ms) - 1:
            # 마지막 관: 들어온 곳에서 가장 먼 쪽까지
            sb = int(np.linalg.norm(v - v[sa], axis=1).argmax())
        pth = dijk(adj, sa, sb)
        if pth is None or len(pth) < 2:
            pts += [v[sa].tolist(), v[sb].tolist()]
            continue
        pts += center(v, v[pth]).tolist()
    return T(smooth(resample(pts, .006), 8))


R = {}


def go(key, names):
    q = route(names)
    R[key] = np.round(q, 3).tolist()
    print(key, len(q), np.round(q[0], 2), np.round(q[-1], 2))


go('pa_L', ['Pulmonary trunk', 'Left pulmonary artery', 'Left anterior segmental artery'])
go('pa_R', ['Pulmonary trunk', 'Right pulmonary artery', 'Anterior branch of right anterior segmental artery'])
go('pa_L2', ['Pulmonary trunk', 'Left pulmonary artery', 'Left lateral basal segmental artery'])
go('pa_R2', ['Pulmonary trunk', 'Right pulmonary artery', 'Lateral branch of right lateral basal segmental artery'])
go('pv_L', ['Left anterior segmental vein', 'Left superior pulmonary vein'])
go('pv_R', ['Right anterior segmental vein', 'Right superior pulmonary vein'])
go('pv_L2', ['Left lateral basal segmental vein', 'Left inferior pulmonary vein'])
go('pv_R2', ['Right lateral basal segmental vein', 'Right inferior pulmonary vein'])
go('ao', ['Ascending aorta', 'Arch of aorta'])
go('ao_d', ['Ascending aorta', 'Arch of aorta', 'Descending aorta'])
go('head', ['Ascending aorta', 'Arch of aorta', 'Brachiocephalic artery', 'Right common carotid artery', 'Right internal carotid artery'])
go('arm', ['Ascending aorta', 'Arch of aorta', 'Brachiocephalic artery', 'Right subclavian artery', 'Right axillary artery', 'Right brachial artery', 'Right radial artery'])
go('leg', ['Ascending aorta', 'Arch of aorta', 'Descending aorta', 'Right common iliac artery', 'Right external iliac artery', 'Right femoral artery', 'Right popliteal artery', 'Right posterior tibial artery'])
go('leg_l', ['Ascending aorta', 'Arch of aorta', 'Descending aorta', 'Left common iliac artery', 'Left external iliac artery', 'Left femoral artery', 'Left popliteal artery', 'Left posterior tibial artery'])
go('arm_l', ['Ascending aorta', 'Arch of aorta', 'Left subclavian artery', 'Left axillary artery', 'Left brachial artery', 'Left radial artery'])
go('head_l', ['Ascending aorta', 'Arch of aorta', 'Left common carotid artery', 'Left internal carotid artery'])
go('v_head', ['Right internal jugular vein', 'Right brachiocephalic vein', 'Superior vena cava'])
go('v_arm', ['Right radial vein', 'Right medial brachial vein', 'Right axillary vein', 'Right subclavian vein', 'Right brachiocephalic vein', 'Superior vena cava'])
go('v_leg', ['Right posterior tibial vein', 'Right popliteal vein', 'Right femoral vein', 'Right external iliac vein', 'Right common iliac vein', 'Inferior vena cava'])
go('v_leg_l', ['Left posterior tibial vein', 'Left popliteal vein', 'Left femoral vein', 'Left external iliac vein', 'Left common iliac vein', 'Inferior vena cava'])
go('v_arm_l', ['Left radial vein', 'Left medial brachial vein', 'Left axillary vein', 'Left subclavian vein', 'Left brachiocephalic vein', 'Superior vena cava'])
go('v_head_l', ['Left internal jugular vein', 'Left brachiocephalic vein', 'Superior vena cava'])
go('iv', ['Right median cubital vein', 'Right basilic vein', 'Right axillary vein', 'Right subclavian vein', 'Right brachiocephalic vein', 'Superior vena cava'])
man['routes'] = R
man['routeParts'] = {
    'head': ['Brachiocephalic artery', 'Right common carotid artery', 'Right internal carotid artery', 'Right internal jugular vein', 'Right brachiocephalic vein'],
    'arm': ['Brachiocephalic artery', 'Right subclavian artery', 'Right axillary artery', 'Right brachial artery', 'Right radial artery', 'Right radial vein', 'Right medial brachial vein', 'Right axillary vein', 'Right subclavian vein', 'Right brachiocephalic vein'],
    'leg': ['Descending aorta', 'Abdominal aorta', 'Right common iliac artery', 'Right external iliac artery', 'Right femoral artery', 'Right popliteal artery', 'Right posterior tibial artery', 'Right posterior tibial vein', 'Right popliteal vein', 'Right femoral vein', 'Right external iliac vein', 'Right common iliac vein', 'Inferior vena cava'],
}

# 저장: 위치는 16비트로 줄인다
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
open(OUT + '/body.bin', 'wb').write(blob)
json.dump(man, open(OUT + '/body.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('verts', len(pos), 'tris', len(idx) // 3, 'MB', round(len(blob) / 1048576, 2), 'K', K, 'bbox', pos.min(0), pos.max(0))
