# 읽기 페이지용 영상·사진 찍기. 사용: python -X utf8 _bake.py <주소 예: http://localhost:8783> [이름 일부]
# _fig.html?k=… 를 정해진 크기로 열어 window.__bakeT 로 시간을 한 칸씩 넘기며 찍는다. 결과는 lessons/excretion/media/.
import asyncio, pathlib, shutil, subprocess, sys, tempfile
from playwright.async_api import async_playwright
from PIL import Image
import imageio_ffmpeg

BASE = sys.argv[1].rstrip('/') + '/lessons/excretion/_fig.html?k='
ONLY = sys.argv[2] if len(sys.argv) > 2 else ''
REPO = pathlib.Path(__file__).resolve().parents[4]
OUT = REPO / 'lessons/excretion/media'
FF = imageio_ffmpeg.get_ffmpeg_exe()
ARGS = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
FPS = 24
TALL = (760, 700)
WIDE = (760, 460)
PORT = (600, 840)
LB = "W.place({hrt:[.74,.06],ao:[.24,.2],ivc:[.24,.3],kid:[.78,.4],ra:[.24,.46],rv:[.24,.58],ure:[.78,.6],blad:[.78,.78],ureth:[.78,.92]});"
# 이름, 그림, 크기, 초, 시작 스크립트, (초, 스크립트) 목록
VID = [
    ('v-hero', 'sys', PORT, 12, "W.flow({blood:true,urine:true});W.showLabs([]);W.spin(12,1)", []),
    ('v-system', 'front', (760, 760), 10, LB + "W.flow({blood:true,urine:true});W.showLabs(['hrt','ao','ivc','kid','ra','rv','ure','blad','ureth'])", []),
    ('v-neph', 'neph', TALL, 12, "W.showLabs(['glo','bow','tub','cap','cd']);W.place({glo:[.3,.1],bow:[.3,.4],tub:[.3,.74],cap:[.8,.56],cd:[.8,.88]});W.spin(12,1)", []),
]
STILL = [
    ('p-back', 'back', (760, 640), "W.place({kid:[.78,.34],kidR:[.22,.34],rib:[.78,.12],spine:[.78,.64]});W.showLabs(['kid','kidR','rib','spine'])"),
    ('p-kidney', 'cut', (760, 640), "W.cut(true);W.place({kra:[.2,.3],krv:[.2,.46],kpel:[.2,.64],kure:[.2,.84]});W.showLabs(['kra','krv','kpel','kure'])"),
    ('p-num', 'front', (600, 760), "W.place({kid:[.82,.44],ure:[.82,.62],blad:[.82,.78],ureth:[.82,.92],ra:[.82,.3]});['kid','ure','blad','ureth','ra'].forEach((k,i)=>{W.lab.L[k].e.textContent=String(i+1);W.lab.L[k].e.className='hl b'});W.showLabs(['kid','ure','blad','ureth','ra'])"),
    ('card', 'card', (760, 570), "W.flow({blood:true,urine:true});W.showLabs([])"),
]


def enc(tmp, name):
    outp = OUT / (name + '.mp4')
    subprocess.run([FF, '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', str(tmp / 'f%04d.png'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '27', '-preset', 'slow', '-movflags', '+faststart', str(outp)], check=True)
    n = len(list(tmp.glob('f*.png')))
    Image.open(tmp / f'f{min(n - 1, FPS * 2):04d}.png').convert('RGB').save(OUT / (name + '.jpg'), quality=84)
    print(name, outp.stat().st_size // 1024, 'KB')


async def open_fig(br, k, size):
    pg = await br.new_page(viewport={'width': size[0], 'height': size[1]}, reduced_motion='no-preference')
    pg.on('pageerror', lambda e: print('ERR', e))
    await pg.goto(BASE + k, wait_until='domcontentloaded', timeout=120000)
    await pg.wait_for_function('window.__ready===true', timeout=120000)
    await pg.add_style_tag(content='#fig{width:%dpx!important;height:%dpx!important}' % size)
    await pg.evaluate('window.dispatchEvent(new Event("resize"))')
    await pg.wait_for_timeout(1500)
    return pg


async def main():
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(channel='chrome', args=ARGS)
        for name, k, size, secs, js, ev in VID:
            if ONLY and ONLY not in name:
                continue
            pg = await open_fig(br, k, size)
            await pg.evaluate('window.W=window.__W;window.__bakeT=0;' + js)
            await pg.wait_for_timeout(400)
            tmp = pathlib.Path(tempfile.mkdtemp())
            loc = pg.locator('#fig')
            todo = list(ev)
            for i in range(int(FPS * secs)):
                t = i / FPS
                while todo and t >= todo[0][0]:
                    await pg.evaluate(todo.pop(0)[1])
                await pg.evaluate(f'new Promise(r=>{{window.__bakeT={t};requestAnimationFrame(()=>requestAnimationFrame(r))}})')
                await loc.screenshot(path=str(tmp / f'f{i:04d}.png'))
            enc(tmp, name)
            shutil.rmtree(tmp)
            await pg.close()
        for name, k, size, js in STILL:
            if ONLY and ONLY not in name:
                continue
            pg = await open_fig(br, k, size)
            await pg.evaluate('window.W=window.__W;' + js)
            await pg.wait_for_timeout(1800)
            f = OUT / (name + '.png')
            await pg.locator('#fig').screenshot(path=str(f))
            if name.startswith('fig-'):
                print(name, 'png')
            else:
                dest = (OUT.parent / 'card.jpg') if name == 'card' else OUT / (name + '.jpg')
                Image.open(f).convert('RGB').save(dest, quality=84)
                f.unlink()
                print(name)
            await pg.close()
        await br.close()

asyncio.run(main())
