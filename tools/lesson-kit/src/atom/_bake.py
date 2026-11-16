# 읽기 페이지 그림과 카드 사진 찍기. 사용: python -X utf8 _bake.py http://localhost:8793
# 3D 장면(_fig.html?k=…)을 정해진 크기로 열어 찍고 lessons/atom/media/ 와 card.jpg 로 저장한다.
import asyncio, pathlib, sys
from playwright.async_api import async_playwright
from PIL import Image

BASE = sys.argv[1].rstrip('/') + '/lessons/atom/'
REPO = pathlib.Path(__file__).resolve().parents[4]
OUT = REPO / 'lessons/atom/media'
ARGS = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
# 장면, 크기, 저장 이름
SHOTS = [
    ('he-detail', (720, 720), 'p-he-detail.jpg'),
    ('he-simple', (520, 520), 'p-he-simple.jpg'),
    ('gold-bars', (760, 520), 'p-gold-bars.jpg'),
    ('gold-atoms', (600, 600), 'p-gold-atoms.jpg'),
    ('struct', (720, 720), 'p-struct.jpg'),
    ('card', (900, 680), 'p-hero.jpg'),
    ('card', (760, 570), '../card.jpg'),
]


async def main():
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(channel='chrome', args=ARGS)
        for k, size, name in SHOTS:
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
