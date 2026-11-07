# 심장 3D 모형 자료 만들기 (자주 돌릴 일 없음. 결과 lessons/circulatory-system/media/heart.bin·heart.json)
# 원자료: BodyParts3D 4.0, The Database Center for Life Science, CC BY 4.0
#   https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
# 내려받기 편하게 Human Atlas(github.com/ashemag/human-atlas, 자료 CC BY 4.0)가 나눠 둔 파일을 쓴다.
# 사용: python -I _anat_prep.py <atlas.json과 b<N>.gz를 둘 폴더> <저장소의 lessons/circulatory-system/media>
import json, gzip, os, sys, struct, urllib.request
from array import array

D, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
BASE = 'https://raw.githubusercontent.com/ashemag/human-atlas/main/public/models/'
if not os.path.exists(D + '/atlas.json'):
    urllib.request.urlretrieve(BASE + 'atlas.json', D + '/atlas.json')
A = json.load(open(D + '/atlas.json', encoding='utf8'))
P = A['parts']

GROUPS = {
    'wallV': ['Wall of ventricle'],
    'wallLA': ['Wall of left atrium'],
    'wallRA': ['Wall of right atrium'],
    'cavRA': ['Cavity of right atrium'],
    'cavRV': ['Cavity of right ventricle'],
    'cavLA': ['Cavity of left atrium'],
    'cavLV': ['Cavity of left ventricle'],
    'valTV': ['Anterior leaflet of tricuspid valve', 'Posterior leaflet of tricuspid valve', 'Septal leaflet of tricuspid valve'],
    'valMV': ['Anterior leaflet of mitral valve', 'Posterior leaflet of mitral valve'],
    'valPV': ['Left anterior cusp of pulmonary valve', 'Posterior cusp of pulmonary valve', 'Right anterior cusp of pulmonary valve'],
    'valAV': ['Anterior cusp of aortic valve', 'Left posterior cusp of aortic valve', 'Right posterior cusp of aortic valve'],
    'aorta': ['Ascending aorta', 'Arch of aorta'],
    'pa': ['Pulmonary trunk', 'Left pulmonary artery', 'Right pulmonary artery'],
    'pv': ['Left superior pulmonary vein', 'Left inferior pulmonary vein', 'Right superior pulmonary vein', 'Right inferior pulmonary vein'],
    'svc': ['Superior vena cava'],
    'ivc': ['Inferior vena cava'],
}

parts = {k: [p for p in P if p['name'] in v] for k, v in GROUPS.items()}
need = sorted({p['chunk'] for L in parts.values() for p in L})
buf = {}
for c in need:
    f = f'{D}/b{c}.gz'
    if not os.path.exists(f):
        urllib.request.urlretrieve(BASE + f'body-{c}.bin.gz', f)
    buf[c] = gzip.open(f).read()

# 심장 중심(벽과 방 모양의 범위)을 원점으로, 심장 크기가 약 4가 되도록 맞춘다
HB = [p['bounds'] for k in ('wallV', 'wallLA', 'wallRA') for p in parts[k]]
mn = [min(b[0][i] for b in HB) for i in range(3)]
mx = [max(b[1][i] for b in HB) for i in range(3)]
C = [(mn[i] + mx[i]) / 2 for i in range(3)]
S = 4.0 / max(mx[i] - mn[i] for i in range(3))
LIM = {'ivc': (mn[1] - .02, None), 'pa': (None, .085), 'pv': (None, .082), 'aorta': (None, .13), 'svc': (None, .13)}

pos, nor, idx = array('f'), array('h'), array('I')
man = {'scale': S, 'groups': {}}
for k, L in parts.items():
    g0v, g0i = len(pos) // 3, len(idx)
    lo = [1e9] * 3
    hi = [-1e9] * 3
    for p in L:
        b = buf[p['chunk']]
        v, n = p['vertexCount'], p['indexCount']
        ps = struct.unpack_from(f'<{v*3}f', b, p['positions'])
        ns = struct.unpack_from(f'<{v*3}h', b, p['normals'])
        ix = struct.unpack_from(f'<{n}I', b, p['indices'])
        base = len(pos) // 3
        for i in range(v):
            for a in range(3):
                x = (ps[i * 3 + a] - C[a]) * S
                pos.append(x)
                nor.append(ns[i * 3 + a])
                lo[a] = min(lo[a], x)
                hi[a] = max(hi[a], x)
        ymin, rad = LIM.get(k, (None, None))
        for t in range(0, n, 3):
            tri = ix[t:t + 3]
            if ymin is not None and min(ps[j * 3 + 1] for j in tri) < ymin:
                continue
            if rad is not None and max(sum((ps[j * 3 + a] - C[a]) ** 2 for a in range(3)) ** .5 for j in tri) > rad:
                continue
            idx.extend(j + base for j in tri)
    man['groups'][k] = {'v': [g0v, len(pos) // 3 - g0v], 'i': [g0i, len(idx) - g0i], 'lo': [round(x, 3) for x in lo], 'hi': [round(x, 3) for x in hi]}

man['counts'] = [len(pos) // 3, len(idx)]
man['bytes'] = [len(pos) * 4, len(nor) * 2, len(idx) * 4]
with open(OUT + '/heart.bin', 'wb') as f:
    f.write(pos.tobytes())
    f.write(nor.tobytes())
    if (len(nor) * 2) % 4:
        f.write(b'\0\0')
        man['pad'] = 2
    f.write(idx.tobytes())
json.dump(man, open(OUT + '/heart.json', 'w'), ensure_ascii=False)
open(OUT + '/ATTRIBUTION.txt', 'w', encoding='utf8').write(
    'heart.bin: BodyParts3D, (c) The Database Center for Life Science, licensed under CC Attribution 4.0 International.\n'
    'License: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html\n'
    'Changes: picked heart and great vessel meshes, trimmed long vessels, recentred and rescaled, packed for the web.\n')
print('verts', man['counts'][0], 'tris', man['counts'][1] // 3, 'bytes', sum(man['bytes']) // 1024, 'KB')
for k, g in man['groups'].items():
    print(k, g['i'][1] // 3, g['lo'], g['hi'])
