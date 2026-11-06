#!/usr/bin/env python3
"""시험 정리본 검사. 미리보기 서버를 켠 뒤 실행한다.

사용: python .claude/skills/exam-review/scripts/check_exam.py exam-energy [--shots 폴더] [--base http://localhost:8770]

자료 검사: 중복 문제 id, 계산 문제 200회, 개념 장의 문제 연결, 요약의 개념 연결, 밑줄 없는 줄
화면 검사: 태블릿 가로·세로, 휴대 전화 가로·세로에서 개념 넘침, 문제 창, 요약 넘침, 개념 창, 인쇄 쪽수
끝에 '문제 없음' 또는 '확인 필요' 목록을 출력한다. 그림 속 글자 겹침은 못 잡으니 --shots 사진을 눈으로 본다.
"""
import argparse, json, os, pathlib, re, subprocess, sys, tempfile

sys.stdout.reconfigure(encoding="utf-8")
REPO = pathlib.Path(__file__).resolve().parents[4]
SIZES = {"태블릿 가로": (1280, 740), "태블릿 세로": (800, 1220), "휴대 전화 가로": (844, 350), "휴대 전화 세로": (390, 760)}
# 휴대 전화에서는 칸 안에서 밀어 보는 것을 허용하고, 태블릿에서는 넘치면 알린다
TABLET = {"태블릿 가로", "태블릿 세로"}

NODE = r"""
const fs = require('fs'); global.window = {};
eval(fs.readFileSync(process.argv[2], 'utf8'));
const out = { n: window.BANK.length, ids: [], dup: [], bad: [], types: {} };
const seen = new Set();
for (const q of window.BANK) {
  if (seen.has(q.id)) out.dup.push(q.id); seen.add(q.id); out.ids.push(q.id);
  const key = q.u + ' ' + q.t; out.types[key] = (out.types[key] || 0) + 1;
  if (q.k === 'calc') for (let i = 0; i < 200; i++) {
    const g = q.gen();
    if (!(g.a > 0) || !Number.isFinite(g.a) || !g.q || !g.unit || !g.why) { out.bad.push(q.id + ': ' + JSON.stringify(g.a)); break; }
  }
  if ((q.k === 'choice' || q.k === 'blank') && !(q.opts && q.opts[q.a] != null)) out.bad.push(q.id + ': 정답 번호');
  if (q.k === 'multi' && !q.a.every((i) => q.items[i] != null)) out.bad.push(q.id + ': 정답 번호');
}
console.log(JSON.stringify(out));
"""


def data_checks(name, problems):
    src = REPO / "tools" / "lesson-kit" / "src" / name
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(NODE)
    try:
        r = subprocess.run(["node", f.name, str(src / "_bank.js")], capture_output=True, text=True, encoding="utf-8")
    finally:
        os.unlink(f.name)
    if r.returncode:
        problems.append("문제 데이터를 읽지 못함: " + r.stderr.strip()[:200])
        return
    d = json.loads(r.stdout)
    print(f"문제 {d['n']}개:", d["types"])
    problems += [f"중복 문제 id {x}" for x in d["dup"]] + [f"문제 오류 {x}" for x in d["bad"]]
    cards = (src / "cards.tpl.html").read_text(encoding="utf-8")
    ids = set(d["ids"])
    for m in re.finditer(r'data-qs="([^"]+)"', cards):
        problems += [f"개념 장이 없는 문제 {i}를 가리킴" for i in m.group(1).split(",") if i not in ids]
    concepts = set(re.findall(r'data-id="([^"]+)"', cards))
    sheet = (src / "sheet.tpl.html").read_text(encoding="utf-8")
    for g in sorted(set(re.findall(r'data-go="([^"]+)"', sheet)) - concepts):
        problems.append(f"요약이 없는 개념 {g}을 가리킴")
    miss = sorted(concepts - set(re.findall(r'data-go="([^"]+)"', sheet)))
    if miss:
        print("요약에서 연결하지 않은 개념(괜찮은지 확인):", miss)
    for t in re.findall(r'<(?:li|div class="eqr")[^>]*data-go="[^"]+"[^>]*>.*?</(?:li|div)>', sheet, flags=re.S):
        if 'class="k"' not in t:
            problems.append("밑줄 없는 줄: " + re.sub(r"<[^>]+>", "", t)[:40])


def screen_checks(name, base, shots, problems):
    from playwright.sync_api import sync_playwright
    u = f"{base}/lessons/{name}/"
    with sync_playwright() as p:
        b = p.chromium.launch()
        for label, (w, h) in SIZES.items():
            errs = []
            pg = b.new_page(viewport={"width": w, "height": h})
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(u + "cards.html", wait_until="domcontentloaded")
            pg.wait_for_timeout(800)
            n = pg.evaluate("DECK.count")
            for i in range(n):
                pg.evaluate(f"DECK.go({i})")
                pg.wait_for_timeout(450 if shots else 120)
                d = pg.evaluate("[...document.querySelectorAll('.slide.on .txt')].map(e=>e.scrollHeight-e.clientHeight)")
                if label in TABLET and any(x > 1 for x in d):
                    problems.append(f"{label} 개념 {i + 1}장 글 넘침 {d}")
                if pg.evaluate("document.documentElement.scrollWidth-innerWidth") > 0:
                    problems.append(f"{label} 개념 {i + 1}장 옆으로 넘침")
                if shots:
                    pg.wait_for_timeout(900)
                    pg.screenshot(path=os.path.join(shots, f"{label}_개념{i + 1:02d}.png"))
                if pg.evaluate("!!document.querySelector('.slide.on').dataset.qs"):
                    pg.evaluate("DECK.openQ()")
                    if pg.locator(".qpanel .qbox").count() < 1:
                        problems.append(f"{label} 개념 {i + 1}장 문제 창이 비어 있음")
                    pg.click("#qpClose")
            q = b.new_page(viewport={"width": w, "height": h})
            q.on("pageerror", lambda e: errs.append(str(e)))
            q.goto(u + "sheet.html", wait_until="domcontentloaded")
            q.wait_for_timeout(500)
            for k in range(q.evaluate("SHEET.count")):
                q.evaluate(f"SHEET.go({k})")
                q.wait_for_timeout(100)
                over = q.evaluate("(()=>{const e=document.querySelector('.page.on');return e.scrollHeight-e.clientHeight})()")
                if label in TABLET and over > 1:
                    problems.append(f"{label} 요약 {k + 1}장 넘침 {over}px")
                if shots:
                    q.screenshot(path=os.path.join(shots, f"{label}_요약{k + 1}.png"))
            q.locator(".page.on [data-go]").first.click()
            q.wait_for_timeout(1500)
            f = q.frame_locator("#fwF")
            if f.locator(".slide.on .bk:not(.open)").count():
                problems.append(f"{label} 개념 창의 빈칸이 닫혀 있음")
            q.click("#fwClose")
            if q.evaluate("document.getElementById('fw').classList.contains('on')"):
                problems.append(f"{label} 개념 창이 닫히지 않음")
            if label == "태블릿 가로":
                pdf = os.path.join(tempfile.gettempdir(), f"{name}_요약.pdf")
                pages = q.evaluate("SHEET.count")
                q.emulate_media(media="print")
                q.pdf(path=pdf, prefer_css_page_size=True, print_background=True)
                try:
                    import fitz
                    got = len(fitz.open(pdf))
                    print(f"인쇄: {got}쪽 (요약 {pages}장)")
                    if got != pages:
                        problems.append(f"인쇄 쪽수 {got}쪽, 요약은 {pages}장")
                except ImportError:
                    print("인쇄 쪽수를 재지 못함(PyMuPDF 없음)")
            bk = b.new_page(viewport={"width": w, "height": h})
            bk.on("pageerror", lambda e: errs.append(str(e)))
            bk.goto(u + "bank.html", wait_until="domcontentloaded")
            bk.wait_for_timeout(400)
            for _ in range(bk.evaluate("BANK.length")):
                if bk.locator("#q .qgo,#q .qopt,#q .qitem").count() == 0:
                    problems.append(f"{label} 문제 화면에 답하는 칸 없음: " + bk.locator("#q").inner_text()[:40])
                if bk.is_enabled("#bNext"):
                    bk.click("#bNext")
                if label != "태블릿 가로":
                    break
            problems += [f"{label} 스크립트 오류: {e}" for e in errs[:3]]
            print(f"{label}: 개념 {n}장 검사 끝")
        b.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lesson")
    ap.add_argument("--shots")
    ap.add_argument("--base", default="http://localhost:8770")
    a = ap.parse_args()
    if a.shots:
        os.makedirs(a.shots, exist_ok=True)
    problems = []
    data_checks(a.lesson, problems)
    screen_checks(a.lesson, a.base.rstrip("/"), a.shots, problems)
    if problems:
        print("\n확인 필요:")
        for x in problems:
            print(" -", x)
        sys.exit(1)
    print("\n문제 없음. 그림은 사진으로 직접 확인할 것.")


if __name__ == "__main__":
    main()
