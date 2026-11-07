# 읽기 페이지용 영상·사진 찍기. 사용: python -X utf8 _anat_bake.py <atlas 자료 폴더> [이름 일부]
# 로컬 서버 http://localhost:8770 이 저장소를 열고 있어야 한다. 결과는 lessons/circulatory-system/media/.
import asyncio, json, gzip, os, pathlib, shutil, struct, subprocess, sys, tempfile, urllib.request
from array import array
from playwright.async_api import async_playwright
from PIL import Image
import imageio_ffmpeg

D = sys.argv[1]
ONLY = sys.argv[2] if len(sys.argv) > 2 else ''
HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[3]
OUT = REPO / 'lessons/circulatory-system/media'
BASE = 'http://localhost:8770/lessons/circulatory-system/'
FF = imageio_ffmpeg.get_ffmpeg_exe()
ARGS = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--allow-file-access-from-files']

def body_data():
    tmp = pathlib.Path(D) / 'body4'
    tmp.mkdir(exist_ok=True)
    if (tmp / 'body.bin').exists():
        return tmp
    A = json.load(open(D + '/atlas.json', encoding='utf8'))
    import re
    # 학생용 그림이라 생식기 쪽 혈관과 알몸 피부는 넣지 않는다. 간 속·갈비뼈 사이의 빽빽한 혈관도 뺀다
    NO = re.compile(r'penis|testic|pudend|obturator|rectal|segmental|tributary|portal|hepatic|intercostal|caudate|coronary sinus', re.I)
    LV = [p['bounds'] for p in A['parts'] if p['system'] == 'digestive' and ('biliary' in p['name'] or p['name'] == 'Caudate lobe of liver' or 'hepatic duct' in p['name'])]
    lo = [min(b[0][i] for b in LV) - .025 for i in range(3)]; hi = [max(b[1][i] for b in LV) + .025 for i in range(3)]
    inl = lambda p: all(p['bounds'][0][i] >= lo[i] and p['bounds'][1][i] <= hi[i] for i in range(3)) and 'vena cava' not in p['name'] and 'aorta' not in p['name']
    sel = [('art', '#d6382c', lambda p: p['system'] == 'arterial' and not NO.search(p['name']) and not inl(p)), ('vei', '#3a62c4', lambda p: p['system'] == 'venous' and not NO.search(p['name']) and not inl(p)), ('hrt', '#a9463f', lambda p: p['name'] in ('Wall of ventricle', 'Wall of left atrium', 'Wall of right atrium'))]
    buf = {}
    blob = bytearray()
    man = {'groups': []}
    for k, col, f in sel:
        for p in [x for x in A['parts'] if f(x)]:
            c = p['chunk']
            if c not in buf:
                fn = f'{D}/b{c}.gz'
                if not os.path.exists(fn):
                    urllib.request.urlretrieve(f'https://raw.githubusercontent.com/ashemag/human-atlas/main/public/models/body-{c}.bin.gz', fn)
                buf[c] = gzip.open(fn).read()
            b = buf[c]
            v, n = p['vertexCount'], p['indexCount']
            g = {'k': k, 'col': col, 'v': v, 'c': n}
            for key, off, size in (('p', p['positions'], v * 12), ('n', p['normals'], v * 6), ('i', p['indices'], n * 4)):
                while len(blob) % 4:
                    blob.append(0)
                g[key] = len(blob)
                blob += b[off:off + size]
            man['groups'].append(g)
    (tmp / 'body.bin').write_bytes(blob)
    (tmp / 'body.json').write_text(json.dumps(man))
    print('body', len(blob) // 1048576, 'MB')
    return tmp

def enc(tmp, name, fps, crf=26):
    outp = OUT / (name + '.mp4')
    subprocess.run([FF, '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', str(tmp / 'f%04d.png'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', str(crf), '-preset', 'slow', '-movflags', '+faststart', str(outp)], check=True)
    Image.open(tmp / 'f0000.png').convert('RGB').save(OUT / (name + '.jpg'), quality=84)
    print(name, outp.stat().st_size // 1024, 'KB')

VID = [
    ('v-heart', 'sim1-heart.html', 5.2, (1500, 860), []),
    ('v-net', 'sim2-vessel.html?m=net', 6, (1500, 860), []),
    ('v-cmp', 'sim2-vessel.html?m=cmp', 6, (1500, 860), []),
    ('v-ex', 'sim2-vessel.html?m=ex', 8, (1500, 860), []),
    ('v-blood', 'sim3-blood.html', 7, (1500, 860), []),
]
STILL = [
    ('p-out', 'sim1-heart.html', 1200, ['#vOut'], None),
    ('p-rbc', 'sim3-blood.html?k=rbc', 2600, [], None),
    ('p-wbc', 'sim3-blood.html?k=wbc', 3300, [], None),
    ('p-plt', 'sim3-blood.html?k=plt', 6600, [], None),
    ('p-pla', 'sim3-blood.html?k=pla', 2600, [], None),
    ('p-quiz', 'sim1-heart.html', 1500, [], 'num'),
    ('p-card', 'sim1-heart.html', 1200, ['#vOut'], 'hide'),
]

async def main():
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(channel='chrome', args=ARGS)
        if not ONLY or 'body' in ONLY:
            bd = body_data()
            shutil.copy(HERE / '_body_render.html', bd / 'r.html')
            pg = await br.new_page(viewport={'width': 720, 'height': 900})
            pg.on('pageerror', lambda e: print('ERR', e))
            await pg.goto((bd / 'r.html').as_uri())
            await pg.wait_for_function('window.__ok', timeout=180000)
            tmp = pathlib.Path(tempfile.mkdtemp())
            N = 192
            for i in range(N):
                await pg.evaluate(f'window.setA({i / N * 6.28319})')
                await pg.screenshot(path=str(tmp / f'f{i:04d}.png'))
            enc(tmp, 'v-body', 24, 27)
            shutil.rmtree(tmp)
            await pg.close()
        for name, page, secs, vp, clicks in VID:
            if ONLY and ONLY not in name:
                continue
            pg = await br.new_page(viewport={'width': vp[0], 'height': vp[1]}, reduced_motion='no-preference')
            pg.on('pageerror', lambda e: print('ERR', e))
            await pg.goto(BASE + page, wait_until='load')
            await pg.wait_for_function('window.__ready===true', timeout=60000)
            await pg.wait_for_timeout(1500)
            tmp = pathlib.Path(tempfile.mkdtemp())
            loc = pg.locator('#fig')
            fps = 24
            for i in range(int(fps * secs)):
                await pg.evaluate(f'new Promise(r=>{{window.__bakeT={i / fps};requestAnimationFrame(()=>requestAnimationFrame(r))}})')
                await loc.screenshot(path=str(tmp / f'f{i:04d}.png'))
            enc(tmp, name, fps)
            shutil.rmtree(tmp)
            await pg.close()
        for name, page, wait, clicks, mode in STILL:
            if ONLY and ONLY not in name:
                continue
            pg = await br.new_page(viewport={'width': 1500, 'height': 860}, reduced_motion='no-preference')
            await pg.goto(BASE + page, wait_until='load')
            await pg.wait_for_function('window.__ready===true', timeout=60000)
            for c in clicks:
                await pg.click(c)
            await pg.wait_for_timeout(wait)
            if mode == 'num':
                await pg.evaluate("document.querySelectorAll('#fig .hl').forEach((e,i)=>{e.textContent=String(i+1);e.className='hl b'})")
                await pg.wait_for_timeout(200)
            if mode == 'hide':
                await pg.add_style_tag(content='#fig .hl,#fig svg{display:none!important}')
                await pg.wait_for_timeout(200)
            f = OUT / (name + '.png')
            await pg.locator('#fig').screenshot(path=str(f))
            Image.open(f).convert('RGB').save(OUT / (name + '.jpg'), quality=84)
            f.unlink()
            print(name)
            await pg.close()
        await br.close()

asyncio.run(main())
