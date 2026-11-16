# 읽기 페이지 그림과 카드 사진 찍기. 사용: python -X utf8 _bake.py http://127.0.0.1:8797 [이름 일부]
# 3D 장면(IM3.still)(_fig.html?k=…)을 정해진 크기로 열어 찍고 lessons/ion-migration/media/ 와 card.jpg 로 저장한다.
import asyncio, pathlib, sys
from playwright.async_api import async_playwright
from PIL import Image

BASE = sys.argv[1].rstrip('/') + '/lessons/ion-migration/'
ONLY = sys.argv[2] if len(sys.argv) > 2 else ''
REPO = pathlib.Path(__file__).resolve().parents[4]
OUT = REPO / 'lessons/ion-migration/media'
ARGS = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
SHOTS = [
    ('lab-cu-hero', (900, 600), 'p-hero.jpg'),
    ('lab-cu-card', (760, 570), '../card.jpg'),
    ('lab-cu-setup', (1000, 560), 'p-setup.jpg'),
    ('lab-cu-d0', (460, 340), 'r-cu-d0.jpg'),
    ('lab-cu-d1', (460, 340), 'r-cu-d1.jpg'),
    ('lab-mn-d0', (460, 340), 'r-mn-d0.jpg'),
    ('lab-mn-d1', (460, 340), 'r-mn-d1.jpg'),
    ('cell-cu', (640, 400), 'f13-cu.jpg'),
    ('cell-mn', (640, 400), 'f13-mn.jpg'),
]


async def main():
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(channel='chrome', args=ARGS)
        for k, size, name in SHOTS:
            if ONLY and ONLY not in k and ONLY not in name: continue
            pg = await br.new_page(viewport={'width': size[0], 'height': size[1]}, device_scale_factor=1.5)
            await pg.goto(BASE + '_fig.html?k=' + k, wait_until='load', timeout=90000)
            await pg.wait_for_function('window.__ready===true', timeout=120000)
            await pg.wait_for_timeout(1800)
            f = OUT / 'tmp.png'
            await pg.locator('#fig').screenshot(path=str(f))
            Image.open(f).convert('RGB').save(OUT / name, quality=86)
            f.unlink()
            print(name, flush=True)
            await pg.close()
        await br.close()

asyncio.run(main())
