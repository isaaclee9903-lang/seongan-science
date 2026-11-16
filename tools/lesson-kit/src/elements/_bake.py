# 원소 수업 3D 사진 굽기. 사용: python -X utf8 _bake.py http://localhost:8771 [이름 일부]
# _fig.html?k=... 를 열어 투명 바탕 PNG로 lessons/elements/media/ 에 저장한다(웹용으로 줄여 저장).
# 실험실 사진(읽기 그림 ①, 카드)은 sim1-water.html?shot=... 화면을 찍는다.
import asyncio, base64, io, pathlib, sys
from playwright.async_api import async_playwright
from PIL import Image

BASE = sys.argv[1].rstrip('/') + '/lessons/elements/'
ONLY = sys.argv[2] if len(sys.argv) > 2 else ''
REPO = pathlib.Path(__file__).resolve().parents[4]
OUT = REPO / 'lessons/elements/media'
OUT.mkdir(exist_ok=True)
ARGS = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']

OBJ = ['balloon', 'diamond', 'capsule', 'copper', 'soap', 'dryice', 'salt', 'water', 'glass', 'plastic']
SAM = ['H', 'He', 'Li', 'Be', 'C', 'N', 'O', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'S', 'Cl', 'Ca', 'Fe', 'Cu', 'Hg']
PM = OBJ + ['NH3', 'NaCl', 'H2O', 'CH4', 'CO2', 'CO', 'O2', 'H2']
# (주소 키, 저장 이름, 가로, 세로)
JOBS = [(f'ob-{k}', f'ob-{k}.png', 440, 400) for k in OBJ] + [(f'sm-{k}', f'sm-{k}.png', 400, 320) for k in SAM] + [(f'pm-{k}', f'pm-{k}.png', 420, 420) for k in PM]
LAB = [  # sim1-water.html 장면
    ('shot=hero', 'p-lab.jpg', 900, 760),
    ('shot=plus', 'p-plus.jpg', 520, 600),
    ('shot=minus', 'p-minus.jpg', 520, 600),
    ('shot=card', '../card.jpg', 900, 760),
]


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(channel='chrome', args=ARGS)
        for key, name, w, h in JOBS:
            if ONLY and ONLY not in key:
                continue
            pg = await br.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
            errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(BASE + '_fig.html?k=' + key + '&' + '', wait_until='commit', timeout=90000)
            await pg.wait_for_function('window.__ready===true', timeout=240000)
            await pg.wait_for_timeout(400)
            url = await pg.evaluate('window.__shot()')
            im = Image.open(io.BytesIO(base64.b64decode(url.split(',', 1)[1]))).convert('RGBA')
            if key.startswith('pm-'):
                bb = im.getbbox()
            else:
                from PIL import ImageChops
                rgb = im.convert('RGB'); bb = ImageChops.difference(rgb, Image.new('RGB', rgb.size, 'white')).point(lambda v: 255 if v > 6 else 0).getbbox()
            if bb:
                pad = 6
                im = im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(w, bb[2] + pad), min(h, bb[3] + pad)))
            (im if key.startswith('pm-') else im.convert('RGB')).save(OUT / name, optimize=True)
            print(name, im.size, *errs)
            await pg.close()
        for q, name, w, h in LAB:
            if ONLY and ONLY not in q:
                continue
            pg = await br.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1.5)
            await pg.goto(BASE + 'sim1-water.html?' + q, wait_until='commit', timeout=90000)
            await pg.wait_for_function('window.__shotReady===true', timeout=240000)
            await pg.wait_for_timeout(600)
            f = OUT / 'tmp.png'
            await pg.locator('#lab').screenshot(path=str(f))
            im = Image.open(f).convert('RGB')
            if 'card' in name:  # 카드는 4:3으로 잘라 가운데 장치만
                W2, H2 = im.size; ch = int(W2 * 0.75); top = max(0, (H2 - ch) // 2 + int(H2 * 0.04)); im = im.crop((0, top, W2, min(H2, top + ch))).resize((760, 570))
            im.save(OUT / name, quality=84)
            f.unlink()
            print(name)
            await pg.close()
        await br.close()

asyncio.run(main())
