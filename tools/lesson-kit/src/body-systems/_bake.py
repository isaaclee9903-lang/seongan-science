# 읽기 페이지용 영상·사진 찍기. 사용: python -X utf8 _bake.py <주소 예: http://localhost:8791> [이름 일부]
# _fig.html?k=… 를 정해진 크기로 열어 window.__bakeT 로 시간을 한 칸씩 넘기며 찍는다. 결과는 lessons/body-systems/media/.
# (배설 수업 _bake.py 와 같은 방식)
import asyncio, pathlib, shutil, subprocess, sys, tempfile
from playwright.async_api import async_playwright
from PIL import Image
import imageio_ffmpeg

BASE = sys.argv[1].rstrip('/') + '/lessons/body-systems/_fig.html?k='
ONLY = sys.argv[2] if len(sys.argv) > 2 else ''
REPO = pathlib.Path(__file__).resolve().parents[4]
OUT = REPO / 'lessons/body-systems/media'
FF = imageio_ffmpeg.get_ffmpeg_exe()
ARGS = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
FPS = 24
PORT = (600, 840)
CAP = "W.lab.add('cap','',null,.5,.05,'cap3',{c:true});W.lab.L.cap.show=true;const setCap=(t)=>{W.lab.L.cap.e.textContent=t};window.setCap=setCap;"
SYS_LB = {
    'dig': "W.place({eso:[.76,.2],sto:[.78,.38],liv:[.22,.4],si:[.78,.56],li:[.22,.58]});W.short(true);",
    'res': "W.place({nose:[.24,.12],tra:[.76,.2],bro:[.22,.3],lung:[.78,.32],dia:[.78,.46]});W.short(true);",
    'cir': "W.place({hrt:[.78,.3],ao:[.78,.46],ivc:[.22,.48],pa:[.78,.18],pv:[.22,.26]});W.short(true);",
    'exc': "W.place({kid:[.78,.5],ure:[.78,.64],blad:[.78,.78]});W.short(true);",
}
SYS_N = {'dig': '소화계', 'res': '호흡계', 'cir': '순환계', 'exc': '배설계'}
def sysEv(k):
    flows = {'dig': "{o2:false,co2:false,nut:true,was:false}", 'res': "{o2:true,co2:true,nut:false,was:false}", 'cir': "{o2:true,co2:true,nut:true,was:true}", 'exc': "{o2:false,co2:false,nut:false,was:true}"}[k]
    return f"W.highlight('{k}');W.flow({flows});{SYS_LB[k]}W.showLabs(W.LABS['{k}'].filter(x=>x!=='cell').concat(['cap']));setCap('{SYS_N[k]}');"
# 이름, 그림, 크기, 초, 시작 스크립트, (초, 스크립트) 목록
VID = [
    ('v-hero', 'all', PORT, 12, "W.flow({o2:true,co2:true,nut:true,was:true});W.showLabs([]);W.spin(12,1)", []),
    ('v-sys', 'sysv', (760, 760), 16, CAP + sysEv('dig'), [(4, sysEv('res')), (8, sysEv('cir')), (12, sysEv('exc'))]),
    ('v-o2', 'all', PORT, 17, "W.flow({o2:true,co2:false,nut:false,was:false});W.showLabs([]);W.tour('o2',null,1.02)", []),
    ('v-run', 'chest', (760, 560), 12, CAP + "W.highlight('res');['heart'].forEach(k=>{const m=W.parts[k].material;m.opacity=1;m.transparent=false;m.depthWrite=true;m.needsUpdate=true});W.flow({o2:true,co2:true,nut:false,was:false});W.place({lung:[.8,.24],hrt:[.2,.5],dia:[.8,.72]});W.short(true);W.showLabs(['lung','hrt','dia','cap']);setCap('쉴 때');W.activity(1)",
     [(6, "W.activity(2);setCap('격렬한 운동')")]),
]
STILL = [
    ('p-heart', 'chest', (760, 640), "W.highlight('cir');W.flow({o2:false,co2:false,nut:false,was:false});W.parts.lungL.material.opacity=.3;W.parts.lungR.material.opacity=.3;W.place({hrt:[.8,.5],ao:[.8,.78],pa:[.8,.22],pv:[.2,.3],ivc:[.2,.7]});W.short(true);W.showLabs(['hrt','ao','pa','pv','ivc'])"),
    ('p-map', 'map', (600, 667), "1"),
    ('card', 'card', (760, 570), "W.flow({o2:true,co2:true,nut:true,was:true});W.showLabs([])"),
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
            await pg.evaluate('window.W=window.__W;window.__bakeT=0;W.setView(%r);' % k + js)
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
            await pg.evaluate('window.W=window.__W;' + ('W.setView(%r);' % k if k != 'map' else '') + js)
            await pg.wait_for_timeout(2200)
            f = OUT / (name + '.png')
            await pg.locator('#fig').screenshot(path=str(f))
            dest = (OUT.parent / 'card.jpg') if name == 'card' else OUT / (name + '.jpg')
            Image.open(f).convert('RGB').save(dest, quality=86)
            f.unlink()
            print(name)
            await pg.close()
        await br.close()

asyncio.run(main())
