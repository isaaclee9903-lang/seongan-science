# 그림 Ⅴ-5 작물 8가지 3D 사진을 lessons/photosynthate-use/media/crop-<이름>.png로 저장해요.
# 준비: 저장소를 로컬 서버로 연다(python -m http.server 8770 --directory <저장소>). 사용: python _bake_crops.py [주소 앞부분]
import asyncio, base64, pathlib, sys
from playwright.async_api import async_playwright
REPO = pathlib.Path(__file__).resolve().parents[4]
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8770'
async def main():
    out = REPO / 'lessons' / 'photosynthate-use' / 'media'; out.mkdir(exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(channel='chrome', args=['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1300, 'height': 800})
        pg.on('pageerror', lambda e: print('ERR', e))
        await pg.goto(f'{BASE}/lessons/photosynthate-use/_crops.html', wait_until='load')
        await pg.wait_for_function('window.__done === true', timeout=120000)
        d = await pg.evaluate('window.__crops')
        for k, u in d.items():
            from PIL import Image; import io
            im = Image.open(io.BytesIO(base64.b64decode(u.split(',')[1]))).convert('RGBA'); a = im.getchannel('A').point(lambda v: 255 if v > 8 else 0); bb = a.getbbox()
            w, h = bb[2] - bb[0], bb[3] - bb[1]; W, H = int(max(w, h * 4 / 3) * 1.1), int(max(h, w * 3 / 4) * 1.1); c = Image.new('RGBA', (W, H)); c.paste(im.crop(bb), ((W - w) // 2, (H - h) // 2))
            c.resize((480, 360), Image.LANCZOS).save(out / f'crop-{k}.png', optimize=True); print('wrote', k)
        await pg.screenshot(path=str(out.parent / '_crops_preview.png'))
        # 감자 식물 3D 사진: 모형 만들기 판, 읽기 머리 그림, 수업 카드
        for m, path, q in [('board', out / 'board.jpg', 88), ('hero', out / 'hero.jpg', 86), ('card', out.parent / 'card.jpg', 85)]:
            await pg.goto(f'{BASE}/lessons/photosynthate-use/_board.html?m={m}', wait_until='load')
            await pg.wait_for_function('window.__done === true', timeout=120000); await pg.wait_for_timeout(2500)
            await pg.locator('#fig').screenshot(path=str(path), type='jpeg', quality=q); print('wrote', path.name)
        await br.close()
asyncio.run(main())
