# 허브 카드 사진 만들기: card.html → lessons/mineral-use/card.jpg (800×448)
import asyncio, pathlib
from playwright.async_api import async_playwright
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent.parent.parent.parent

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 800, 'height': 448}, device_scale_factor=2)
        await pg.goto((HERE / 'card.html').as_uri(), wait_until='networkidle')
        await pg.wait_for_timeout(600)
        tmp = HERE / '_card.png'
        await pg.locator('#card').screenshot(path=str(tmp))
        await b.close()
    Image.open(tmp).convert('RGB').resize((800, 448), Image.LANCZOS).save(REPO / 'lessons/mineral-use/card.jpg', quality=88)
    tmp.unlink()
    print('card.jpg')

asyncio.run(main())
