# 읽기 페이지용 영상·사진 찍기. 사용: python -X utf8 _bake.py <주소 예: http://localhost:8777> [이름 일부]
# 3D 페이지를 정해진 크기로 열어 window.__bakeT 로 시간을 한 칸씩 넘기며 찍는다. 결과는 lessons/blood-circulation/media/.
import asyncio, pathlib, shutil, subprocess, sys, tempfile
from playwright.async_api import async_playwright
from PIL import Image
import imageio_ffmpeg

BASE = sys.argv[1].rstrip('/') + '/lessons/blood-circulation/'
ONLY = sys.argv[2] if len(sys.argv) > 2 else ''
REPO = pathlib.Path(__file__).resolve().parents[4]
OUT = REPO / 'lessons/blood-circulation/media'
FF = imageio_ffmpeg.get_ffmpeg_exe()
ARGS = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
FPS = 24
TALL = (760, 700)
WIDE = (760, 460)
PORT = (600, 840)
# 이름, 페이지, 크기, 초, 시작 스크립트, (초, 스크립트) 목록
VID = [
    ('v-whole', 'sim1-route.html', PORT, 12, "W.figure('whole');W.flows(true);W.spin(12,W.st.camera.position.distanceTo(W.st.controls.target),1);W.showLabs('none')", []),
    ('v-lung', 'sim1-route.html', TALL, 6, "W.hero(false);W.heartView('thorax');W.setCam('thorax',0);W.focus('p');W.showLabs('thorax')", []),
    ('v-sys', 'sim1-route.html', PORT, 7, "W.hero(false);W.heartView('all');W.setCam('all',0);W.focus('b');W.showLabs(['hrt','ao1','vc1','hd','am','lg'])", []),
    ('v-xl', 'sim1-route.html', WIDE, 7, "W.enterMicro('lung')", []),
    ('v-xb', 'sim1-route.html', WIDE, 7, "W.enterMicro('body')", []),
    ('v-iv', 'sim2-case.html', PORT, 15, "W.flowTint(.72);W.heartView('all');W.setCam('all',0);W.showLabs(['ivp','hrt','lng','hd','am','lg']);W.startIV()", []),
    ('v-knee', 'sim2-case.html?a=knee', TALL, 10, "W.setCam('legAll',0);W.showLabs(['kne'])", [(1, 'W.kneel(1)'), (6.2, 'W.kneel(0)')]),
]
STILL = [
    ('p-quiz', 'sim1-route.html', TALL, "W.hero(false);W.flows(false);W.H.flows.forEach(f=>{f.im.visible=false});W.numberHeart()"),
    ('card', 'sim1-route.html', (760, 570), "W.figure('card')"),
]


def enc(tmp, name):
    outp = OUT / (name + '.mp4')
    subprocess.run([FF, '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', str(tmp / 'f%04d.png'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '27', '-preset', 'slow', '-movflags', '+faststart', str(outp)], check=True)
    n = len(list(tmp.glob('f*.png')))
    Image.open(tmp / f'f{min(n - 1, FPS * 2):04d}.png').convert('RGB').save(OUT / (name + '.jpg'), quality=84)
    print(name, outp.stat().st_size // 1024, 'KB')


async def fixsize(pg, size):
    await pg.add_style_tag(content='#fig{position:fixed!important;left:0;top:0;width:%dpx!important;height:%dpx!important;z-index:99;flex:none!important;min-height:0!important}.card.pad,header.top,.vctl{visibility:hidden}' % size)


async def main():
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(channel='chrome', args=ARGS)
        for name, page, size, secs, js, ev in VID:
            if ONLY and ONLY not in name:
                continue
            pg = await br.new_page(viewport={'width': 1300, 'height': 900}, reduced_motion='no-preference')
            pg.on('pageerror', lambda e: print('ERR', e))
            await pg.goto(BASE + page, wait_until='load')
            await pg.wait_for_function('window.__ready===true', timeout=90000)
            await fixsize(pg, size)
            await pg.wait_for_timeout(1200)
            await pg.evaluate('window.W=window.__W;window.__bakeT=0;' + js)
            await pg.wait_for_timeout(400)
            tmp = pathlib.Path(tempfile.mkdtemp())
            loc = pg.locator('#fig')
            n = int(FPS * secs)
            todo = list(ev)
            for i in range(n):
                t = i / FPS
                while todo and t >= todo[0][0]:
                    await pg.evaluate(todo.pop(0)[1])
                await pg.evaluate(f'new Promise(r=>{{window.__bakeT={t};requestAnimationFrame(()=>requestAnimationFrame(r))}})')
                await loc.screenshot(path=str(tmp / f'f{i:04d}.png'))
            enc(tmp, name)
            shutil.rmtree(tmp)
            await pg.close()
        for name, page, size, js in STILL:
            if ONLY and ONLY not in name:
                continue
            pg = await br.new_page(viewport={'width': 1300, 'height': 900}, reduced_motion='no-preference')
            pg.on('pageerror', lambda e: print('ERR', e))
            await pg.goto(BASE + page, wait_until='load')
            await pg.wait_for_function('window.__ready===true', timeout=90000)
            await fixsize(pg, size)
            await pg.wait_for_timeout(800)
            await pg.evaluate('window.W=window.__W;' + js)
            await pg.wait_for_timeout(1800)
            f = OUT / (name + '.png')
            await pg.locator('#fig').screenshot(path=str(f))
            dest = (OUT.parent / 'card.jpg') if name == 'card' else OUT / (name + '.jpg')
            Image.open(f).convert('RGB').save(dest, quality=84)
            f.unlink()
            print(name)
            await pg.close()
        await br.close()

asyncio.run(main())
