# 한자어 단어 표(구글 시트에서 내려받은 탭 구분 파일)를 한자어 공부 페이지용 자료로 바꾼다.
# 사용: python tools/hanja/convert.py [표 파일(.tsv 또는 .xlsx)]   기본: tools/hanja/words.tsv
#       --check 를 붙이면 검사만 하고 자료는 쓰지 않는다 (원본 시트 전체 검수용)
#       → tools/lesson-kit/src/hanja/_words.js 를 쓰고, 이어서 build.py hanja 로 페이지를 만든다.
#
# 열 이름(첫 줄)으로 찾으므로 열 순서가 바뀌어도 된다: 교과, 대단원, 중단원, 소단원, 단어, 한자, 정의,
# 어원맥락, 한자분해_JSON, 선택지_JSON, 관련단어_JSON, 생성완료 (예문, 이미지 열은 있으면 쓴다)
# 수업과 단어의 연결은 tools/hanja/lessons.json 에 적는다.
#
# 검사(하나라도 걸리면 자료를 쓰지 않는다. 꼭 써야 하면 --force):
#   빈 칸, 단어와 한자 글자 수, 한자 풀이 글자가 단어 한자에 들어 있는지, 예시 낱말에 그 글자가 들어 있는지,
#   예시 낱말의 한글과 한자 글자 수, 선택지 4개·중복·정답 번호, 정의와 정답 문장이 같은지,
#   관련 단어의 공유 한자가 관련 단어와 원래 단어 양쪽에 들어 있는지, 같은 글자를 다른 모양(岩/巖)으로 섞어 썼는지
import csv, json, pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent.parent
OUT = REPO / "tools" / "lesson-kit" / "src" / "hanja" / "_words.js"
VARIANTS = [("岩", "巖")]   # 같은 글자의 다른 모양: 하나로 통일해야 관계망이 갈라지지 않는다
HAN = re.compile(r"[㐀-鿿豈-﫿]")

def safe_html(s):
    # 어원맥락은 <em>만 허용하고 나머지는 글자 그대로 보이게 바꾼다
    s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return s.replace("&lt;em&gt;", "<em>").replace("&lt;/em&gt;", "</em>")

def main(argv):
    force = "--force" in argv
    check = "--check" in argv
    args = [a for a in argv if not a.startswith("--")]
    src = pathlib.Path(args[0]) if args else HERE / "words.tsv"
    lessons = json.loads((HERE / "lessons.json").read_text(encoding="utf-8"))
    if src.suffix.lower() == ".xlsx":
        import openpyxl
        ws = openpyxl.load_workbook(src, read_only=True).worksheets[0]
        rows = [["" if c is None else str(c) for c in r] for r in ws.iter_rows(values_only=True)]
    else:
        rows = list(csv.reader(src.read_text(encoding="utf-8-sig").splitlines(), delimiter="\t", quotechar=None))
    head = [h.strip() for h in rows[0]]
    col = {h: i for i, h in enumerate(head)}
    need = ["교과", "대단원", "중단원", "단어", "한자", "정의", "한자분해_JSON", "선택지_JSON", "관련단어_JSON"]
    miss = [h for h in need if h not in col]
    if miss:
        sys.exit(f"열 없음: {miss}")
    get = lambda r, h: (r[col[h]].strip() if h in col and col[h] < len(r) else "")

    errs, warns, words = [], [], []
    for n, r in enumerate(rows[1:], start=2):
        if not any(c.strip() for c in r):
            continue
        w = get(r, "단어")
        at = f"{n}행 {w or '(단어 없음)'}"
        if "생성완료" in col and get(r, "생성완료").upper() != "TRUE":
            continue
        def E(m): errs.append(f"{at}: {m}")
        def W(m): warns.append(f"{at}: {m}")
        hanja, d = get(r, "한자"), get(r, "정의")
        for h in ["단어", "한자", "정의"]:
            if not get(r, h): E(f"{h} 칸이 비어 있음")
        if not get(r, "어원맥락"): W("어원맥락이 비어 있음")
        if w and hanja and len(w) != len(hanja): E(f"단어({len(w)}자)와 한자({len(hanja)}자) 글자 수가 다름")
        try:
            chars = json.loads(get(r, "한자분해_JSON") or "[]")
            ch = json.loads(get(r, "선택지_JSON") or "{}")
            rv = json.loads(get(r, "관련단어_JSON") or "[]")
        except json.JSONDecodeError as e:
            E(f"JSON을 읽지 못함 ({e})"); continue
        for c in chars:
            k = c.get("char", "")
            if k not in hanja: E(f"한자 풀이 글자 {k}가 {hanja}에 없음")
            if not c.get("sound") or not c.get("meaning"): E(f"{k}의 소리나 뜻이 비어 있음")
            for ex in c.get("examples", []):
                m = re.match(r"^(.+?)\((.+)\)$", ex)
                if not m: E(f"{k} 예시 '{ex}'가 '낱말(漢字)' 모양이 아님"); continue
                if k not in m.group(2): E(f"{k} 예시 '{ex}'에 {k}가 들어 있지 않음")
                if len(m.group(1)) != len(m.group(2)): E(f"{k} 예시 '{ex}'의 한글과 한자 글자 수가 다름")
                if m.group(1) == w: W(f"{k} 예시에 원래 단어 '{ex}'가 들어 있음")
        cs, ai = ch.get("choices", []), ch.get("answerIdx", 0)
        if len(cs) != 4 or len(set(cs)) != 4: E("선택지가 4개가 아니거나 같은 문장이 있음")
        elif not (0 <= ai < 4): E("정답 번호가 0~3이 아님")
        elif cs[ai] != d: W("정의와 정답 선택지 문장이 다름 (화면에는 정의를 정답 풀이로 보여 줌)")
        for x in rv:
            at2 = f"관련 단어 {x.get('word', '?')}({x.get('hanja', '?')})"
            s = x.get("shared", "")
            if s not in x.get("hanja", ""): E(f"{at2}에 공유 한자 {s}가 없음")
            if s not in hanja: E(f"{at2}의 공유 한자 {s}가 원래 단어 {hanja}에 없음")
            if len(x.get("word", "")) != len(x.get("hanja", "")): E(f"{at2}의 한글과 한자 글자 수가 다름")
            xc, xa = x.get("choices", []), x.get("answerIdx")
            if len(xc) != 4 or len(set(xc)) != 4: E(f"{at2} 선택지가 4개가 아니거나 같은 문장이 있음")
            if xa is None: xa = xc.index(x.get("meaning")) if x.get("meaning") in xc else -1
            if not (0 <= xa < len(xc)): E(f"{at2} 정답을 찾을 수 없음")
            elif xc[xa] != x.get("meaning"): W(f"{at2}의 뜻(meaning)과 정답 선택지 문장이 다름")
            x["answerIdx"] = xa
        words.append({
            "word": w, "hanja": hanja, "definition": d, "context": safe_html(get(r, "어원맥락")) or None,
            "subject": get(r, "교과"), "unit": get(r, "대단원"), "sub": get(r, "중단원"),
            "chars": chars, "choices": cs, "answerIdx": ai, "reviewWords": rv,
            "example": get(r, "예문") or None,
        })

    text = "".join(x["hanja"] + "".join(rv["hanja"] for rv in x["reviewWords"]) + "".join(e for c in x["chars"] for e in c.get("examples", [])) for x in words)
    for a, b in VARIANTS:
        if a in text and b in text: errs.append(f"전체: {a}와 {b}를 섞어 씀 (하나로 통일해야 관계망이 갈라지지 않음)")
    names = {x["word"] for x in words}
    for k, L in ({} if check else lessons).items():
        for w in L["words"]:
            if w not in names: errs.append(f"lessons.json {k}: '{w}'가 단어 표에 없음")
    dup = {w for w in names if [x["word"] for x in words].count(w) > 1}
    if dup: errs.append(f"전체: 같은 단어가 두 번 나옴 {sorted(dup)}")

    for m in warns: print("[알림]", m)
    for m in errs: print("[오류]", m)
    print(f"단어 {len(words)}개, 오류 {len(errs)}개, 알림 {len(warns)}개")
    if check:
        return
    if errs and not force:
        sys.exit("오류가 있어 자료를 쓰지 않았어요. 표를 고친 뒤 다시 실행해 주세요.")
    data = {"words": words, "lessons": lessons}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("// tools/hanja/convert.py 가 만든 파일 (직접 고치지 말고 단어 표를 고쳐요)\nwindow.HANJA_DATA = "
                   + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8", newline="\n")
    print("wrote", OUT.relative_to(REPO))

if __name__ == "__main__":
    main(sys.argv[1:])
