# 사용: python shot.py URL OUT.png W H [스크롤할 선택자 또는 -] [기다릴 초] [클릭할 선택자들(쉼표)]
import sys, asyncio
from playwright.async_api import async_playwright

async def main():
    url, out, w, h = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
    sel = sys.argv[5] if len(sys.argv) > 5 else '-'
    wait = float(sys.argv[6]) if len(sys.argv) > 6 else 4
    clicks = sys.argv[7].split(',') if len(sys.argv) > 7 and sys.argv[7] else []
    async with async_playwright() as p:
        b = await p.chromium.launch(channel='chrome', args=['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': w, 'height': h})
        logs = []
        pg.on('console', lambda m: logs.append(f'[{m.type}] {m.text}') if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
        await pg.goto(url, wait_until='networkidle')
        if sel != '-':
            await pg.evaluate(f"document.querySelector({sel!r}).scrollIntoView({{block:'start'}})")
            await pg.evaluate("window.scrollBy(0,-70)")
        for c in clicks:
            if c.startswith('wait'):
                await pg.wait_for_timeout(int(c[4:]))
                continue
            await pg.click(c)
            await pg.wait_for_timeout(300)
        await pg.wait_for_timeout(int(wait * 1000))
        await pg.screenshot(path=out)
        err = await pg.evaluate("(document.getElementById('rdErr')||document.getElementById('smErr')||document.getElementById('swErr')||{}).textContent||''")
        print('ERRBOX:', err)
        for l in logs[:15]: print(l)
        await b.close()

asyncio.run(main())
