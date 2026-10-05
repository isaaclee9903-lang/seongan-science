# 화면 검사 모음: 장면 목록(src/<수업>/qa.json)을 가로 1280×800, 세로 800×1280에서 한 번에 찍어
# 장면 이름이 붙은 모음 사진 2장(qa_1280.png, qa_800.png)으로 만든다. 오류 상자·콘솔 오류도 함께 보고한다.
# 사용: python tools/lesson-kit/qa_sheet.py <수업이름> [출력 폴더] [--base http://localhost:8770]
# 준비: 저장소를 로컬 서버로 연다(예: python -m http.server 8770 --directory <저장소>). Playwright + 설치된 Chrome 사용.
#
# qa.json 예:
# [ {"name": "읽기 첫 화면", "page": "reading.html", "wait": 4},
#   {"name": "센서 어두운 곳", "page": "reading.html", "scroll": "#senHost", "clicks": ["#sDark", "wait800"], "wait": 2},
#   {"name": "밝기 최대", "page": "sim1.html", "fill": {"#rB": "100"}, "clip": "#host"} ]
# scroll: 그 요소가 화면 위에 오도록 스크롤, clicks: 차례로 누름("waitN"은 N밀리초 쉼), fill: 슬라이더·입력값,
# clip: 그 요소만 잘라 찍기(생략하면 화면 전체)
import asyncio, json, pathlib, sys
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

KIT = pathlib.Path(__file__).resolve().parent
REPO = KIT.parent.parent

def font(n):
    for f in ["C:/Windows/Fonts/malgunbd.ttf", "C:/Windows/Fonts/malgun.ttf"]:
        try: return ImageFont.truetype(f, n)
        except Exception: pass
    return ImageFont.load_default()

async def shoot(br, url, st, vw, vh, path, log):
    pg = await br.new_page(viewport={"width": vw, "height": vh})
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "404" not in m.text else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto(url, wait_until="networkidle")
    if st.get("scroll"):
        await pg.evaluate("(s)=>{const e=document.querySelector(s); if(e){e.scrollIntoView({block:'start'}); window.scrollBy(0,-70);}}", st["scroll"])
    for sel, v in (st.get("fill") or {}).items():
        await pg.fill(sel, str(v)); await pg.dispatch_event(sel, "input")
    for c in st.get("clicks", []):
        if c.startswith("wait"): await pg.wait_for_timeout(int(c[4:])); continue
        await pg.click(c); await pg.wait_for_timeout(250)
    await pg.wait_for_timeout(int(st.get("wait", 3) * 1000))
    if st.get("clip"):
        await pg.locator(st["clip"]).first.screenshot(path=path)
    else:
        await pg.screenshot(path=path)
    box = await pg.evaluate("(()=>{const b=document.getElementById('rdErr')||document.getElementById('smErr')||document.getElementById('swErr');return b?b.textContent:''})()")
    if box: errs.append("빨간 상자: " + box)
    for e in errs: log.append(f"[{vw}] {st['name']}: {e}")
    await pg.close()

def sheet(items, out, cell_w):
    ims = [(n, Image.open(p).convert("RGB")) for n, p in items]
    ims = [(n, im.resize((cell_w, int(im.height * cell_w / im.width)))) for n, im in ims]
    cols = 3 if cell_w <= 640 else 2
    rows = [ims[i:i + cols] for i in range(0, len(ims), cols)]
    pad, head = 12, 34
    H = sum(max(im.height for _, im in r) + head + pad for r in rows) + pad
    W = cols * (cell_w + pad) + pad
    S = Image.new("RGB", (W, H), (236, 241, 246)); d = ImageDraw.Draw(S); f = font(20); y = pad
    for r in rows:
        x = pad
        for n, im in r:
            d.text((x + 4, y + 6), n, fill=(20, 38, 59), font=f); S.paste(im, (x, y + head)); x += cell_w + pad
        y += max(im.height for _, im in r) + head + pad
    S.save(out); return out

async def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    base = "http://localhost:8770"
    if "--base" in sys.argv: base = sys.argv[sys.argv.index("--base") + 1]; args = [a for a in args if a != base]
    name = args[0]; outdir = pathlib.Path(args[1] if len(args) > 1 else KIT / "_qa" / name); outdir.mkdir(parents=True, exist_ok=True)
    cfg = json.loads((KIT / "src" / name / "lesson.json").read_text(encoding="utf-8"))
    states = json.loads((KIT / "src" / name / "qa.json").read_text(encoding="utf-8"))
    log = []
    async with async_playwright() as p:
        br = await p.chromium.launch(channel="chrome", args=["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"])
        for vw, vh in [(1280, 800), (800, 1280)]:
            items = []
            for k, st in enumerate(states):
                url = f"{base}/{cfg['out']}/{st['page']}"
                path = str(outdir / f"{vw}_{k:02d}.png")
                try:
                    await shoot(br, url, st, vw, vh, path, log); items.append((f"{k + 1}. {st['name']}", path))
                except Exception as e:
                    log.append(f"[{vw}] {st['name']}: 찍기 실패 {e}")
            if items: print("sheet:", sheet(items, outdir / f"qa_{vw}.png", 560 if vw == 1280 else 380))
        await br.close()
    print("문제 없음" if not log else "\n".join(log))

asyncio.run(main())
