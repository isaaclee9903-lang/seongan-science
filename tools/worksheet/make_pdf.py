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
