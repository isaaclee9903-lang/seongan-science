# 읽기 페이지 그림과 카드 사진 찍기. 사용: python -X utf8 _bake.py http://localhost:8793
# 3D 장면(MI3.still)(_fig.html?k=…)을 정해진 크기로 열어 찍고 lessons/molecules-ions/media/ 와 card.jpg 로 저장한다.
import asyncio, pathlib, sys
from playwright.async_api import async_playwright
from PIL import Image

BASE = sys.argv[1].rstrip('/') + '/lessons/molecules-ions/'
REPO = pathlib.Path(__file__).resolve().parents[4]
OUT = REPO / 'lessons/molecules-ions/media'
ARGS = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
# 장면, 크기, 저장 이름
SHOTS = [
    ('hero', (900, 560), 'p-hero.jpg'),
    ('hero', (760, 570), '../card.jpg'),
    ('a-He', (300, 300), 'a-He.jpg'),
    ('a-O', (240, 240), 'a-O.jpg'),
    ('a-H', (200, 200), 'a-H.jpg'),
    ('m-O2', (360, 300), 'm-O2.jpg'),
    ('m-H2O', (480, 400), 'm-H2O.jpg'),
    ('m-H2', (500, 340), 'm-H2.jpg'),
    ('m-CO', (500, 340), 'm-CO.jpg'),
    ('m-CO2', (500, 340), 'm-CO2.jpg'),
    ('m-CH4', (500, 340), 'm-CH4.jpg'),
    ('m-NH3', (500, 340), 'm-NH3.jpg'),
    ('m-HCl', (500, 340), 'm-HCl.jpg'),
    ('i-Li', (460, 460), 'i-Li.jpg'),
    ('i-Li+', (460, 460), 'i-Li+.jpg'),
    ('i-F', (460, 460), 'i-F.jpg'),
    ('i-F-', (460, 460), 'i-F-.jpg'),
]


async def main():
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(channel='chrome', args=ARGS)
        for k, size, name in SHOTS:
            pg = await br.new_page(viewport={'width': size[0], 'height': size[1]}, device_scale_factor=1.5)
            await pg.goto(BASE + '_fig.html?k=' + k.replace('+','%2B'), wait_until='load', timeout=90000)
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
