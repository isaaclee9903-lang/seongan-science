"""종이 학습지 PDF 뽑기 (학생판 + 교사판)

쓰는 법:
    python tools/worksheet/make_pdf.py parallax            # worksheets/parallax/index.html
    python tools/worksheet/make_pdf.py parallax --png 쪽그림폴더   # 쪽마다 그림도 뽑기(검사용)

결과: worksheets/<이름>/<이름>-학생.pdf, <이름>-교사.pdf
교사판은 같은 파일을 주소 끝 ?teacher=1 로 열어 정답을 보이게 해서 뽑는다(쪽 나뉨이 학생판과 같다).
"""
import argparse
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
PAGE_H_MM = 297 - 15 - 17   # _ws.css @page 위·아래 여백을 뺀 판면 높이
# .page 묶음이 있으면 쪽마다 내용 높이(mm)를 잰다. 남음이 크면 빈 곳, 넘침이면 다음 쪽으로 밀림
FILL_JS = """() => { const mm = 96 / 25.4; return [...document.querySelectorAll('.page')].map(p => {
  const a = p.firstElementChild.getBoundingClientRect().top, b = p.lastElementChild.getBoundingClientRect().bottom;
  return (b - a) / mm; }); }"""


def render(name: str, png_dir: str | None):
    src = ROOT / "worksheets" / name / "index.html"
    if not src.exists():
        sys.exit(f"없음: {src}")
    outs = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        for label, query in (("학생", ""), ("교사", "?teacher=1")):
            page.goto(src.as_uri() + query, wait_until="networkidle")
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(300)
            fills = page.evaluate(FILL_JS)
            if fills:
                print(f"[{label}] 쪽마다 찬 높이(판면 {PAGE_H_MM}mm): " + ", ".join(f"{i + 1}쪽 {h:.0f}mm" + (" 넘침" if h > PAGE_H_MM else f" (남음 {PAGE_H_MM - h:.0f})") for i, h in enumerate(fills)))
            out = src.parent / f"{name}-{label}.pdf"
            page.pdf(path=str(out), prefer_css_page_size=True, print_background=True)
            outs.append(out)
        browser.close()
    for out in outs:
        import fitz
        doc = fitz.open(out)
        print(f"{out.name}: {doc.page_count}쪽")
        if png_dir:
            d = pathlib.Path(png_dir)
            d.mkdir(parents=True, exist_ok=True)
            for i, pg in enumerate(doc):
                pg.get_pixmap(dpi=110).save(str(d / f"{out.stem}-{i + 1}.png"))
    return outs


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("name")
    ap.add_argument("--png")
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    render(a.name, a.png)
