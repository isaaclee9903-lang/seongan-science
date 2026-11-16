# 읽기 페이지 그림과 카드 사진 찍기. 사용: python -X utf8 _bake.py http://127.0.0.1:8795 [이름 일부]
# 3D 장면(ES3.still)(_fig.html?k=…)을 정해진 크기로 열어 찍고 lessons/earth-substances/media/ 와 card.jpg 로 저장한다.
import asyncio, pathlib, sys
from playwright.async_api import async_playwright
from PIL import Image

BASE = sys.argv[1].rstrip('/') + '/lessons/earth-substances/'
ONLY = sys.argv[2] if len(sys.argv) > 2 else ''
REPO = pathlib.Path(__file__).resolve().parents[4]
OUT = REPO / 'lessons/earth-substances/media'
ARGS = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
# 장면, 크기, 저장 이름
SHOTS = [
    ('w-all', (900, 640), 'w-all.jpg'),
    ('w-all', (760, 570), '../card.jpg'),
    ('w-sky', (720, 450), 'w-sky.jpg'),
    ('w-city', (720, 450), 'w-city.jpg'),
    ('w-forest', (720, 450), 'w-forest.jpg'),
    ('w-forest2', (720, 450), 'w-forest2.jpg'),
    ('one:CO2', (320, 320), 'm-CO2.jpg'),
    ('one:O3', (320, 320), 'm-O3.jpg'),
    ('one:N2O', (320, 320), 'm-N2O.jpg'),
    ('one:Hg', (320, 320), 'm-Hg.jpg'),
    ('one:O2', (360, 300), 'one-O2.jpg'),
    ('one:O3', (360, 300), 'one-O3.jpg'),
]


async def main():
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(channel='chrome', args=ARGS)
        for k, size, name in SHOTS:
            if ONLY and ONLY not in name: continue
            pg = await br.new_page(viewport={'width': size[0], 'height': size[1]}, device_scale_factor=1.5)
            await pg.goto(BASE + '_fig.html?k=' + k, wait_until='load', timeout=90000)
            await pg.wait_for_function('window.__ready===true', timeout=120000)
            await pg.wait_for_timeout(1500)
            f = OUT / 'tmp.png'
            await pg.locator('#fig').screenshot(path=str(f))
            Image.open(f).convert('RGB').save(OUT / name, quality=86)
            f.unlink()
            print(name, flush=True)
            await pg.close()
        await br.close()

asyncio.run(main())
