# 수업 페이지 빌드: 템플릿(src/<수업>/*.tpl.html)에 공통 블록을 끼워 단독 HTML을 만든다.
# 사용: python tools/lesson-kit/build.py <수업이름>      예) python tools/lesson-kit/build.py photo-journey
#
# 템플릿 안의 표시
#   /*@@PART:파일@@*/ 또는 <!--@@PART:파일@@-->   → parts/파일 (공통: 오류 상자, CSS, 퀴즈 엔진, 3D 도구 c3.js, bulb.js)
#   /*@@LOCAL:파일@@*/ 또는 <!--@@LOCAL:파일@@--> → src/<수업>/파일 (이 수업 전용 조각)
# 결과는 lesson.json의 out 폴더(저장소 기준)에 쓰고, 탭 껍데기 index.html도 lesson.json으로 만든다.
import json, pathlib, re, sys

KIT = pathlib.Path(__file__).resolve().parent
REPO = KIT.parent.parent

def main(name):
    src = KIT / "src" / name
    cfg = json.loads((src / "lesson.json").read_text(encoding="utf-8"))
    out = REPO / cfg["out"]
    out.mkdir(parents=True, exist_ok=True)
    pat = re.compile(r"(?:/\*|<!--)@@(PART|LOCAL):([\w.\-]+)@@(?:\*/|-->)")

    def fill(s, where):
        def rep(m):
            base = KIT / "parts" if m.group(1) == "PART" else src
            f = base / m.group(2)
            if not f.exists():
                sys.exit(f"{where}: 조각 없음 {m.group(0)}")
            return f.read_text(encoding="utf-8").rstrip("\n")
        return pat.sub(rep, s)

    for tpl in sorted(src.glob("*.tpl.html")):
        s = fill(tpl.read_text(encoding="utf-8"), tpl.name)
        left = re.findall(r"@@[A-Z]+:[^@]*@@", s)
        if left:
            sys.exit(f"{tpl.name}: 남은 표시 {left}")
        if "﻿" in s or "​" in s:
            sys.exit(f"{tpl.name}: 숨은 문자(BOM·폭 없는 공백)")
        if "성안중학교 이삭 T" in s:
            sys.exit(f"{tpl.name}: 제작자 표기가 남아 있음(2026-10-07부터 넣지 않음)")
        name_out = tpl.name.replace(".tpl.html", ".html")
        (out / name_out).write_text(s, encoding="utf-8", newline="\n")
        print("wrote", name_out, len(s.encode("utf-8")), "bytes")

    # 탭 껍데기 (lesson.json에 "shell": false면 만들지 않음: 한 장짜리 페이지)
    if cfg.get("shell", True) is False:
        return
    tabs = cfg["tabs"]
    shell = (KIT / "parts" / "shell.html").read_text(encoding="utf-8")
    tab_html = "\n".join(f'      <button class="tab" role="tab" data-page="{t["id"]}" aria-selected="false"><span class="n">{i + 1}</span>{t["label"]}</button>' for i, t in enumerate(tabs))
    frame_html = "\n".join(f'    <iframe data-page="{t["id"]}" data-embed="1" title="{t["title"]}"></iframe>' for t in tabs)
    page_js = "\n".join(f"    {t['id']}: '{t['file']}'," for t in tabs)
    for k, v in {"{{TITLE}}": cfg["title"], "{{SHORT}}": cfg["short"], "{{KIND}}": cfg.get("kind", "읽기 자료"), "{{SUB}}": cfg["sub"],
                 "{{LOGO_BG}}": cfg["logo_bg"], "{{LOGO_SVG}}": cfg["logo_svg"], "{{TABS}}": tab_html, "{{FRAMES}}": frame_html, "{{PAGES}}": page_js}.items():
        shell = shell.replace(k, v)
    if "{{" in shell:
        sys.exit("index: 남은 {{ }} 표시")
    (out / "index.html").write_text(shell, encoding="utf-8", newline="\n")
    print("wrote index.html")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("사용: python tools/lesson-kit/build.py <수업이름>")
    main(sys.argv[1])
