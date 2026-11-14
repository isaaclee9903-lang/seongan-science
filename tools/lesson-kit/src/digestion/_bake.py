# 읽기 페이지 사진과 카드 사진 찍기. 사용: python -X utf8 _bake.py <주소 예: http://localhost:8793>
# 3D 그림을 정해진 크기로 열어 찍고 lessons/digestion/media/ 와 card.jpg 로 저장한다.
import asyncio, pathlib, sys
from playwright.async_api import async_playwright
from PIL import Image

BASE = sys.argv[1].rstrip('/') + '/lessons/digestion/'
REPO = pathlib.Path(__file__).resolve().parents[4]
OUT = REPO / 'lessons/digestion/media'
ARGS = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
FIT = "document.getElementById('fig').style.cssText='width:%dpx;height:%dpx';dispatchEvent(new Event('resize'));"
LAB_FRONT = "W.place({mouth:[.3,.05],saliv:[.7,.05],teeth:[.7,.11],eso:[.3,.22],liver:[.24,.4],gall:[.24,.5],duo:[.24,.58],li:[.24,.72],sto:[.76,.37],pan:[.76,.47],si:[.76,.64],anus:[.76,.9]});W.showLabs(['mouth','saliv','teeth','eso','liver','gall','duo','li','sto','pan','si','anus']);"
LAB_GLAND = "W.place({liver:[.16,.18],gall:[.16,.5],duo:[.16,.74],pan:[.84,.62],sto:[.84,.2]});W.showLabs(['liver','gall','duo','pan','sto']);W.focus(['liver','gall','bile','pan','pduct','duo','si']);W.setOp('liver',.5);W.setOp('si',.35);W.juice({bile:true,panc:true,scale:1.2});"
# 이름, 주소, 찍을 요소, 크기, 스크립트, 기다릴 밀리초, 저장 이름
SHOTS = [
    ('_fig.html?k=card', '#fig', (560, 640), "W.flow({food:true});W.showLabs([]);", 2500, 'p-hero.jpg'),
    ('_fig.html?k=front', '#fig', (720, 900), "W.flow({food:true});" + LAB_FRONT, 2500, 'p-system.jpg'),
    ('_fig.html?k=gland', '#fig', (760, 520), LAB_GLAND, 3500, 'p-gland.jpg'),
    ('_fig.html?k=card', '#fig', (760, 570), "W.flow({food:true});W.showLabs([]);", 2500, '../card.jpg'),
]
PAGE = [
    ('sim4-villus.html', '#fig', (900, 520), "__A.showLabs(['fold','vil']);", 3000, 'p-wall.jpg'),
    ('sim4-villus.html?a=vil', '#fig2', (900, 620), "__B.release('glu',10);__B.release('fa',10);__B.release('ami',10);", 3200, 'p-villus.jpg'),
]


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(channel='chrome', args=ARGS)
        for url, sel, size, js, wait, name in SHOTS:
            pg = await br.new_page(viewport={'width': size[0], 'height': size[1]})
            await pg.goto(BASE + url, wait_until='domcontentloaded')
            await pg.wait_for_function('window.__ready===true', timeout=120000)
            await pg.wait_for_timeout(1200)
            await pg.evaluate('window.W=window.__W;W.setView(new URLSearchParams(location.search).get("k"));' + js)
            await pg.wait_for_timeout(wait)
            f = OUT / 'tmp.png'
            await pg.locator(sel).screenshot(path=str(f))
            Image.open(f).convert('RGB').save(OUT / name, quality=86)
            f.unlink()
            print(name)
            await pg.close()
        for url, sel, size, js, wait, name in PAGE:
            pg = await br.new_page(viewport={'width': 1280, 'height': 800})
            await pg.goto(BASE + url, wait_until='domcontentloaded')
            await pg.wait_for_function('window.__ready===true', timeout=120000)
            await pg.add_style_tag(content='.stage{display:block!important}.stage>.card.pad{display:none!important}.viewer{width:%dpx!important}%s{width:%dpx!important;height:%dpx!important;flex:none!important}.vctl{display:none!important}' % (size[0], sel, size[0], size[1]))
            await pg.evaluate('dispatchEvent(new Event("resize"))')
            await pg.wait_for_timeout(1500)
            await pg.evaluate(js)
            await pg.wait_for_timeout(wait)
            f = OUT / 'tmp.png'
            await pg.locator(sel).screenshot(path=str(f))
            Image.open(f).convert('RGB').save(OUT / name, quality=86)
            f.unlink()
            print(name)
            await pg.close()
        await br.close()

asyncio.run(main())
