"""한 권 묶기: 속지(대단원·중단원)와 표지 PDF를 뽑고, 차시 학습지와 차례대로 한 파일로 묶는다.

쓰는 법:
    python tools/worksheet/make_book.py 8                     # Ⅷ 별과 우주만 (표지 없이)
    python tools/worksheet/make_book.py 7 8 --cover front     # Ⅶ·Ⅷ 한 권, 앞표지·뒷표지 포함
    python tools/worksheet/make_book.py 7 8 --cover front --remake   # 차시 학습지 PDF도 먼저 다시 뽑기
    python tools/worksheet/make_book.py 7 --png 폴더          # 속지 쪽 그림(검사용)

순서와 차시 폴더는 worksheets/divider/index.html 의 UNITS(대단원 → parts → lessons[].ws)에서 읽는다.
표지는 UNITS 의 kind:'cover'(앞, ?d=front)와 kind:'back'(뒤, ?d=back).
결과:
    worksheets/divider/<번호>-<이름>-대단원.pdf, <번호>-<n>-<이름>-중단원.pdf, 앞표지.pdf, 뒷표지.pdf
    표지 없이: worksheets/<번호>-<대단원 이름>-학생.pdf, -교사.pdf
    표지 있음: worksheets/<표지 제목>-학생.pdf, -교사.pdf
      양면 인쇄용으로 앞표지 뒤와 뒷표지 앞에 빈 쪽을 넣고, 전체 쪽 수가 짝수가 되게 한다.
책갈피: (표지) > 대단원 > 중단원 > 차시
학습지 PDF가 없는 차시는 건너뛰고 알려 준다. 한 학습지가 두 차시를 다루면(lessons 에 같은 ws 두 번) 한 번만 넣고 책갈피에 "03·04".
PDF는 저장소에 올리지 않는다(.gitignore).
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
    ap.add_argument("units", nargs="+", help="UNITS 의 대단원 열쇠, 예: 7 8")
    ap.add_argument("--cover", help="앞표지 열쇠(예: front). 주면 앞표지·뒷표지를 붙여 한 권으로")
    ap.add_argument("--remake", action="store_true", help="차시 학습지 PDF를 먼저 다시 뽑기")
    ap.add_argument("--png")
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    src = (DV / "index.html").as_uri()
    dvs = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page()
        errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.goto(src, wait_until="networkidle")
        units = pg.evaluate("UNITS")
        jobs = []
        for uk in a.units:
            u = units.get(uk)
            if not u or u.get("kind") != "unit":
                sys.exit(f"UNITS 에 대단원 '{uk}' 이 없음")
            jobs.append((uk, f"{u['no']}-{slug(u['title'])}-대단원"))
            jobs += [(pk, f"{u['no']}-{units[pk]['n']}-{slug(units[pk]['title'])}-중단원") for pk in u["parts"]]
        if a.cover:
            if units.get(a.cover, {}).get("kind") != "cover":
                sys.exit(f"UNITS 에 앞표지 '{a.cover}' 이 없음")
            back = next((k for k, v in units.items() if v.get("kind") == "back"), None)
            jobs = [(a.cover, "앞표지")] + jobs + ([(back, "뒷표지")] if back else [])
        for key, name in jobs:
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

    if a.remake:
        seen = set()
        for uk in a.units:
            for pk in units[uk]["parts"]:
                for l in units[pk]["lessons"]:
                    ws = l.get("ws") or ""
                    if ws and ws not in seen and (WS / ws / "index.html").exists():
                        seen.add(ws)
                        subprocess.run([sys.executable, str(ROOT / "tools/worksheet/make_pdf.py"), ws], check=True)

    for kind in ("학생", "교사"):
        book, toc, skipped = fitz.open(), [], []
        lv = 1 if a.cover else 0

        def add(path, level, title):
            toc.append([level, title, book.page_count + 1])
            book.insert_pdf(fitz.open(path))

        def blank():
            book.new_page(width=book[0].rect.width, height=book[0].rect.height)

        if a.cover:
            add(dvs[a.cover], 1, "앞표지")
            blank()
        for uk in a.units:
            u = units[uk]
            add(dvs[uk], lv + 1, f"대단원 {u['no']} {u['title']}")
            for pk in u["parts"]:
                part = units[pk]
                add(dvs[pk], lv + 2, f"{part['n']}. {part['title']}")
                done = {}
                for l in part["lessons"]:
                    ws = l.get("ws") or ""
                    if ws in done:
                        t = toc[done[ws]]
                        no = t[1].split(" ", 1)[0]
                        t[1] = f"{no}·{l['no']} {l['q']}"  # 묶은 학습지 제목은 뒤 차시 질문(Ⅶ 옴의 법칙)
                        continue
                    f = WS / ws / f"{ws}-{kind}.pdf"
                    if ws and f.exists():
                        done[ws] = len(toc)
                        add(f, lv + 3, f"{l['no']} {l['q']}")
                    else:
                        skipped.append(f"{u['no']}-{l['no']}({ws or '학습지 없음'})")
        if a.cover:
            blank()
            if book.page_count % 2 == 0:  # 뒷표지가 짝수 쪽(바깥 뒷면)에 오게
                blank()
            if "뒷표지" in [p.stem for p in dvs.values()]:
                add(next(p for p in dvs.values() if p.stem == "뒷표지"), 1, "뒷표지")
        book.set_toc(toc)
        name = slug(units[a.cover]["title"]) if a.cover else f"{units[a.units[0]]['no']}-{slug(units[a.units[0]]['title'])}"
        if a.cover:
            name = units[a.cover]["title"].replace(" ", "-")
        out = WS / f"{name}-{kind}.pdf"
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
