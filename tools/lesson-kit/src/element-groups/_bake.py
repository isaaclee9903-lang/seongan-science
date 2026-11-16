# 같은 족 원소 수업 3D 사진 굽기. 사용: python -X utf8 _bake.py http://localhost:8796 [이름 일부]
# _fig.html?k=... 를 열어 lessons/element-groups/media/ 에 저장하고, 실험 장면은 sim1-lab.html?shot=1 화면을 찍는다.
import asyncio, base64, io, pathlib, sys
from playwright.async_api import async_playwright
from PIL import Image, ImageChops

BASE = sys.argv[1].rstrip('/') + '/lessons/element-groups/'
ONLY = sys.argv[2] if len(sys.argv) > 2 else ''
REPO = pathlib.Path(__file__).resolve().parents[4]
OUT = REPO / 'lessons/element-groups/media'
OUT.mkdir(exist_ok=True)
ARGS = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
# (주소 키, 저장 이름, 가로, 세로, 덧붙일 주소)
JOBS = [(f'cut-{e}', f'sm-{e}.jpg', 640, 480, '&az=0.55&el=0.4') for e in ['Li', 'Na', 'K']] + \
       [(f'fl-{e}', f'sm-{e}.jpg', 400, 500, '') for e in ['He', 'Ne', 'Ar']] + \
       [('blimp', 'u-He.jpg', 720, 420, ''), ('sign', 'u-Ne.jpg', 620, 480, '&el=0.15&az=0.15'), ('bulb', 'u-Ar.jpg', 420, 560, '&el=0.2'),
        ('row', 'row.jpg', 1500, 520, '&el=0.32&az=0.12&m=1.04')]
LAB = [  # sim1-lab.html 장면: (주소, 저장 이름, 가로, 세로)
    ('el=K&at=react&wait=2000', 'rx-K.jpg', 760, 560),
    ('el=K&at=react&wait=2000&nolab=1', '../card.jpg', 900, 700),
]


def trim(im, pad=8):
    rgb = im.convert('RGB'); bb = ImageChops.difference(rgb, Image.new('RGB', rgb.size, 'white')).point(lambda v: 255 if v > 6 else 0).getbbox()
    if bb:
        im = im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad)))
    return im.convert('RGB')


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(channel='chrome', args=ARGS)
        for key, name, w, h, extra in JOBS:
            if ONLY and ONLY not in key and ONLY not in name:
                continue
            pg = await br.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1.5)
            errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(BASE + '_fig.html?k=' + key + extra, wait_until='commit', timeout=90000)
            await pg.wait_for_function('window.__ready===true', timeout=240000)
            await pg.wait_for_timeout(500)
            url = await pg.evaluate('window.__shot()')
            im = trim(Image.open(io.BytesIO(base64.b64decode(url.split(',', 1)[1]))))
            im.save(OUT / name, quality=86)
            print(name, im.size, *errs)
            await pg.close()
        for q, name, w, h in LAB:
            if ONLY and ONLY not in q and ONLY not in name:
                continue
            pg = await br.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1.5)
            await pg.goto(BASE + 'sim1-lab.html?shot=1&' + q, wait_until='commit', timeout=90000)
            await pg.wait_for_function('window.__shotReady===true', timeout=240000)
            f = OUT / 'tmp.png'
            await pg.locator('#lab').screenshot(path=str(f))
            im = Image.open(f).convert('RGB')
            if 'card' in name:
                W2, H2 = im.size; ch = int(W2 * 0.75); top = max(0, (H2 - ch) // 2); im = im.crop((0, top, W2, min(H2, top + ch))).resize((760, 570))
            else:
                im = im.resize((int(im.width / 1.5 * 1.2), int(im.height / 1.5 * 1.2)))
            im.save(OUT / name, quality=84)
            f.unlink()
            print(name)
            await pg.close()
        await br.close()

asyncio.run(main())
