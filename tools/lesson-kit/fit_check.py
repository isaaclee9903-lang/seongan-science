# 한 화면 검사: 시뮬레이션 페이지가 태블릿 한 화면(탭 껍데기 안 iframe 크기)에 스크롤 없이 들어가는지 잰다.
# 사용: python tools/lesson-kit/fit_check.py <수업> [--base http://localhost:8770] [--shots 폴더]
#   src/<수업>/fit.json: [{"page": "sim1-lab.html", "clicks": ["#go", "wait600"]}, ...]  (없으면 sim*.html 첫 화면만)
# 기준: 가로 1280×740, 세로 800×1220 (태블릿 1280×800·800×1280에서 위쪽 탭 줄 60px을 뺀 크기).
# 넘치면 몇 px 넘치는지와 가장 아래에 있는 요소를 알려 준다. 0이 되도록 배치를 고친다.
import sys, json, asyncio, pathlib, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.async_api import async_playwright

KIT = pathlib.Path(__file__).resolve().parent
SIZES = [(1280, 740), (800, 1220)]

async def main(name, base, shots):
    src = KIT / 'src' / name
    f = src / 'fit.json'
    cases = json.loads(f.read_text(encoding='utf-8')) if f.exists() else [{'page': p.name.replace('.tpl.html', '.html')} for p in sorted(src.glob('sim*.tpl.html'))]
    cfg = json.loads((src / 'lesson.json').read_text(encoding='utf-8'))
    bad = 0
    async with async_playwright() as p:
        b = await p.chromium.launch(channel='chrome')
        for w, h in SIZES:
            pg = await b.new_page(viewport={'width': w, 'height': h})
            for c in cases:
                await pg.goto(f"{base}/{cfg['out']}/{c['page']}", wait_until='networkidle')
                for k in c.get('clicks', []):
                    if k.startswith('wait'): await pg.wait_for_timeout(int(k[4:])); continue
                    await pg.click(k); await pg.wait_for_timeout(250)
                await pg.wait_for_timeout(500)
                r = await pg.evaluate("""() => { const H = document.documentElement.scrollHeight, V = innerHeight;
                  let low = null, y = 0; document.querySelectorAll('body *').forEach(e => { const b = e.getBoundingClientRect(); if (b.height && !e.children.length && b.bottom > y && getComputedStyle(e).visibility !== 'hidden') { y = b.bottom; low = e; } });
                  return { over: Math.max(0, H - V), low: low ? (low.id ? '#' + low.id : low.className || low.tagName) : '' }; }""")
                tag = '통과' if r['over'] <= 2 else f"넘침 {r['over']}px (맨 아래: {r['low']})"
                if r['over'] > 2: bad += 1
                print(f"{w}x{h}  {c['page']}{' ' + ' '.join(c.get('clicks', [])) if c.get('clicks') else ''}  →  {tag}")
                if shots:
                    pathlib.Path(shots).mkdir(parents=True, exist_ok=True)
                    await pg.screenshot(path=str(pathlib.Path(shots) / f"fit_{w}_{c['page'].split('.')[0]}_{cases.index(c)}.png"))
            await pg.close()
        await b.close()
    print('한 화면 검사:', '모두 통과' if not bad else f'{bad}곳 넘침')

if __name__ == '__main__':
    a = sys.argv[1:]
    base = a[a.index('--base') + 1] if '--base' in a else 'http://localhost:8770'
    shots = a[a.index('--shots') + 1] if '--shots' in a else None
    asyncio.run(main(a[0], base, shots))
