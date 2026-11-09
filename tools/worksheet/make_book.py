"""대단원 한 권 묶기: 속지(대단원·중단원) PDF를 뽑고, 차시 학습지와 차례대로 한 파일로 묶는다.

쓰는 법:
    python tools/worksheet/make_book.py 8               # Ⅷ 별과 우주
    python tools/worksheet/make_book.py 8 --remake      # 차시 학습지 PDF도 먼저 다시 뽑기
    python tools/worksheet/make_book.py 8 --png 폴더    # 속지 쪽 그림(검사용)

순서와 차시 폴더는 worksheets/divider/index.html 의 UNITS(대단원 → parts → lessons[].ws)에서 읽는다.
결과:
    worksheets/divider/<번호>-<이름>-대단원.pdf, <번호>-<n>-<이름>-중단원.pdf
    worksheets/<번호>-<대단원 이름>-학생.pdf, -교사.pdf  (책갈피: 대단원 > 중단원 > 차시)
학습지 PDF가 없는 차시는 건너뛰고 알려 준다. PDF는 저장소에 올리지 않는다(.gitignore).
"""
import argparse
import pathlib
import subprocess
import sys

import fitz
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
WS = ROOT / "worksheets"
DV = WS / "divider"


def slug(t: str) -> str:
    return t.replace(" ", "")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("unit", help="UNITS 의 대단원 열쇠, 예: 8")
    ap.add_argument("--remake", action="store_true", help="차시 학습지 PDF를 먼저 다시 뽑기")
    ap.add_argument("--png")
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    src = (DV / "index.html").as_uri()
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page()
        errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.goto(src, wait_until="networkidle")
        units = pg.evaluate("UNITS")
        u = units.get(a.unit)
        if not u or u.get("kind") != "unit":
            sys.exit(f"UNITS 에 대단원 '{a.unit}' 이 없음")
        # 속지 뽑기
        dvs = {}
        for key in [a.unit] + u["parts"]:
            d = units[key]
            name = f"{u['no']}-{slug(u['title'])}-대단원" if key == a.unit else f"{u['no']}-{d['n']}-{slug(d['title'])}-중단원"
            pg.goto(src + "?d=" + key, wait_until="networkidle")
            pg.evaluate("document.fonts.ready")
            pg.wait_for_timeout(300)
            out = DV / f"{name}.pdf"
            pg.pdf(path=str(out), prefer_css_page_size=True, print_background=True)
            n = fitz.open(out).page_count
            print(f"속지 {out.name}: {n}쪽" + ("  ← 한 쪽이 아님, 확인 필요" if n != 1 else ""))
            if a.png:
                pathlib.Path(a.png).mkdir(parents=True, exist_ok=True)
                fitz.open(out)[0].get_pixmap(dpi=110).save(str(pathlib.Path(a.png) / f"{name}.png"))
            dvs[key] = out
        b.close()
    if errs:
        print("페이지 오류:", errs)

    lessons = [l for pk in u["parts"] for l in units[pk]["lessons"]]
    if a.remake:
        for l in lessons:
            if (WS / l["ws"] / "index.html").exists():
                subprocess.run([sys.executable, str(ROOT / "tools/worksheet/make_pdf.py"), l["ws"]], check=True)

    for kind in ("학생", "교사"):
        book, toc, skipped = fitz.open(), [], []
        def add(path, level, title):
            toc.append([level, title, book.page_count + 1])
            book.insert_pdf(fitz.open(path))
        add(dvs[a.unit], 1, f"대단원 {u['no']} {u['title']}")
        for pk in u["parts"]:
            part = units[pk]
            add(dvs[pk], 2, f"{part['n']}. {part['title']}")
            for l in part["lessons"]:
                f = WS / l["ws"] / f"{l['ws']}-{kind}.pdf"
                if f.exists():
                    add(f, 3, f"{l['no']} {l['q']}")
                else:
                    skipped.append(f"{l['no']}({l['ws']})")
        book.set_toc(toc)
        out = WS / f"{u['no']}-{slug(u['title'])}-{kind}.pdf"
        try:
            book.save(out, garbage=3, deflate=True)
        except Exception:  # 같은 이름 파일이 PDF 보기 프로그램에 열려 있으면 덮어쓰지 못함
            out = out.with_name(out.stem + "-새.pdf")
            book.save(out, garbage=3, deflate=True)
            print(f"  ※ 기존 파일이 열려 있어 {out.name} 으로 저장함")
        print(f"{out.name}: {book.page_count}쪽, 시작 쪽 " + ", ".join(f"{t[1].split()[0]}→{t[2]}" for t in toc)
              + (f"  / 학습지 없어 건너뜀: {', '.join(skipped)}" if skipped else ""))


if __name__ == "__main__":
    main()
