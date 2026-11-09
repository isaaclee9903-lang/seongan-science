# HTML/CSS로 인쇄용 학습지·책 조판하고 PDF로 뽑기 (2025–2026 도구 현황)

조사일 2026-11-08. 대상: A4 흑백 한국어 학습지(장당 2–3쪽), 같은 원본에서 교사용 답지판, 나중에 전 차시를 목차와 이어지는 쪽 번호가 있는 책 PDF 한 권으로 묶기. 환경 Windows 11, Node·Python, 무료 도구 우선.
표기: "[사전 지식]"은 이번 조사에서 출처를 다시 확인하지 못한 내용이라 추론/공백 칸에만 둠.

## 1. 현재 Chromium(Chrome 131+)의 CSS Paged Media 지원 — 기본 Chrome/Puppeteer/Playwright page.pdf()로 되는 것과 Paged.js·Vivliostyle이 필요한 것

### Takeaway
Chrome 131부터 `@page` 여백 상자 16개(`@top-center`, `@bottom-center` 등)에 `counter(page)`를 넣을 수 있고, `:left`/`:right` 쪽 선택자, 이름 붙인 쪽(`page` 속성, Chrome 85+), 플렉스·그리드·표 쪽 나눔(103/106, 인쇄 108)도 기본 Chrome에서 됩니다. 하지만 `string-set`(쪽 머리에 장 제목), `target-counter`(목차 쪽 번호), 각주(`float: footnote`)는 여전히 안 되므로, 이 기능이 필요한 책 단계에서는 Paged.js나 Vivliostyle(또는 PDF 후처리)이 필요합니다.

### Cited Findings
- Chrome 131에서 `@page` 여백 상자 지원 추가: 머리·꼬리말을 CSS로 여백에 생성, 브라우저 기본 머리·꼬리말 대체 가능 — [Chrome for Developers: New in Chrome 131](https://developer.chrome.com/blog/new-in-chrome-131); [Chrome blog: print margins](https://developer.chrome.com/blog/print-margins)
- 여백 상자는 16개(모서리 4 + 위·아래·좌·우 각 3). 위·아래 상자 높이와 좌·우 상자 너비는 `@page` margin 크기로 정해짐 — [Chrome blog: print margins](https://developer.chrome.com/blog/print-margins)
- `counter(page)`로 현재 쪽 번호. 예시: `@page :right { @bottom-right { content: counter(page); } } @page :left { @bottom-left { content: counter(page); } }` → 바깥쪽 쪽 번호(제본용 좌우 구분이 Chrome에서 동작) — [Chrome blog: print margins](https://developer.chrome.com/blog/print-margins)
- 같은 글에서 `string-set`, `target-counter`(교차 참조), 각주(`float: footnote`)는 "향후 가능성"으로만 언급되고 Chromium 버그 링크만 있음 → 미지원 — [Chrome blog: print margins](https://developer.chrome.com/blog/print-margins)
- 주의: 브라우저가 여백에 자체 머리·꼬리말(날짜·주소)을 넣을 수 있음. 여백이 0이거나 너무 작으면 표시 안 됨. Chromium은 첫 쪽에 자동 내용 자리가 없으면 이후 쪽에서도 브라우저 머리·꼬리말을 숨김 — [Chrome blog: print margins](https://developer.chrome.com/blog/print-margins)
- Firefox는 당시 여백 상자를 구현하지 않았음(Chrome만 131에서 출시) — [Mozilla Bugzilla 1915958](https://bugzilla.mozilla.org/show_bug.cgi?id=1915958)
- `page` 속성(이름 붙인 쪽): Chrome 85, Firefox 110 — [MDN browser-compat-data page.json (Chromium 미러)](https://chromium.googlesource.com/external/github.com/mdn/browser-compat-data/+/HEAD/css/properties/page.json); 출시 의도문: 인쇄 미리보기와 생성 PDF에만 영향 — [blink-dev Intent to Ship: Named pages](https://groups.google.com/a/chromium.org/g/blink-dev/c/lExIv0Fh8fs/m/CeCx1xunAgAJ)
- LayoutNG 블록 쪽나눔: 플렉스·그리드 쪽나눔 Chrome 103, 표 106, 인쇄 경로 108. 그 전 레거시 엔진은 플렉스·그리드를 쪽 단위로 나누지 못했음 — [RenderingNG deep-dive: LayoutNG block fragmentation](https://developer.chrome.com/docs/chromium/renderingng-fragmentation)
- 2026 blink-dev 제안: `CSS.supports('size','a4')`가 true를 돌려주는 등 `@page` 서술자 노출 방식 문제 지적(제안 단계, 출시 미확인) — [blink-dev 메일 보관](https://mail-archive.com/blink-dev@chromium.org/msg17111.html)

### Inferences
- 학습지(2–3쪽, 쪽 머리에 "단원명 · 쪽/전체" 정도)는 Chrome 기본 기능만으로 충분: `@page { size: A4; margin: 15mm 15mm 18mm; @bottom-center { content: counter(page) } }`, 상자 쪼개짐 방지 `break-inside: avoid`, 새 문항 묶음 `break-before: page`.
- 책 단계에서 목차 쪽 번호(`target-counter`)와 쪽 머리 장 제목(`string-set`)은 기본 Chrome으로 안 됨 → 선택지 셋: (a) Vivliostyle CLI로 책 전체 조판, (b) Paged.js 폴리필, (c) 차시별 PDF를 Chrome으로 뽑고 쪽 수를 세어 목차 HTML을 계산해 따로 뽑은 뒤 병합(PyMuPDF로 셈). (c)가 가장 단순하고 견고.
- [사전 지식] `counter(pages)`(전체 쪽 수)는 Chrome 여백 상자에서 동작하는 것으로 알려져 있으나 이번에 출처로 재확인 못함 — 먼저 시험 출력해 확인.
- [사전 지식] `orphans`/`widows`는 Chromium에서 오래 전부터 지원(기본 2). `@page :first`, `:blank`는 Chrome에서 `:first`만 확실, `:blank`는 미지원으로 알려짐 — 확인 필요.

### Gaps
- Chrome 여백 상자 안에서 `counter(pages)` 지원 여부를 1차 출처로 확인하지 못함.
- `@page :blank`, `page-orientation`의 현재 Chrome 지원 상태는 미확인.
- Chromium의 `break-inside: avoid`가 플렉스/그리드 항목에서 얼마나 믿을 만한지 1차 자료 없음(쪽나눔 엔진 출시 사실만 확인).

## 2. Paged.js vs Vivliostyle CLI vs WeasyPrint vs Prince

### Takeaway
2026년 기준 가장 활발하고 기능이 많은 무료 도구는 Vivliostyle CLI(2025-11 v9.8.x, 목차 `target-counter`·각주·재단 여유·재단선 지원, Chromium 기반이라 한국어 글꼴·SVG 렌더링이 Chrome과 동일)입니다. WeasyPrint는 매우 활발(2026-09 v70, PDF/X·CMYK)하지만 자체 엔진이라 JS·캔버스가 안 돌아 이 저장소의 그림 방식과 맞지 않을 수 있습니다. Paged.js는 2.0 재구조 과도기라 새로 기대기 어렵고, Prince는 기능이 가장 좋지만 무료판은 비상업용·워터마크입니다.

### Cited Findings
**Paged.js**
- 2025-05-17 공지: 단일 관리자 → 소규모 핵심 팀 전환(Gijs de Heij 합류), 창시자 Fred Chasen은 Mozilla 업무로 시간 축소, Coko 재정 지원 종료 — [pagedjs.org: a new chapter](https://pagedjs.org/posts/en/a-new-chapter-in-paged.js-life/)
- 다음 버전 2.0은 하위 호환이 깨지는 변경(CSSTree→cssOM, 쪽을 웹 컴포넌트로, chunker 분리, break token 알고리즘 변경). 출시 일정 미정. NLnet NGIzero 지원 1년 — [pagedjs.org: a new chapter](https://pagedjs.org/posts/en/a-new-chapter-in-paged.js-life/)
- WeasyPrint와 공동 NGIzero 과제 "Pushing forward for CSS Print" — [같은 글](https://pagedjs.org/posts/en/a-new-chapter-in-paged.js-life/)
- Snyk: `pagedjs` npm은 지난 12개월 새 버전 없음, `pagedjs-cli`는 "inactive" 평가(페이지 날짜 불명) — [Snyk pagedjs](https://snyk.io/advisor/npm-package/pagedjs); [Snyk pagedjs-cli](https://snyk.io/advisor/npm-package/pagedjs-cli)

**Vivliostyle CLI**
- v9.8.0 2025-11-14, v9.8.2 2025-11-19(내장 Vivliostyle.js 2.36.2로 갱신) — [GitHub release v9.8.2](https://github.com/vivliostyle/vivliostyle-cli/releases/tag/v9.8.2); [v9.8.0](https://github.com/vivliostyle/vivliostyle-cli/releases/tag/v9.8.0)
- 문서는 영어·일본어만, 한국어 문서 없음 — [Vivliostyle CLI docs](https://docs.vivliostyle.org/en/cli/getting-started/)
- `target-counter()`, `target-counters()`, `target-text()` 지원(`content` 안에서만) → 목차 쪽 번호 가능 — [Vivliostyle Supported CSS Features](https://docs.vivliostyle.org/en/reference/supported-css-features/)
- 페이지 플로트는 기본 배치만(쌓기·충돌 회피 없음), `float-reference: page` — [같은 문서](https://docs.vivliostyle.org/en/reference/supported-css-features/)
- 각주: `::footnote-call`, `::footnote-marker` 지원. `@footnote` 규칙은 영어 문서에선 미지원, 일본어 문서에선 지원으로 서로 다름 — [영어](https://docs.vivliostyle.org/en/reference/supported-css-features/); [일본어](https://docs.vivliostyle.org/ja/reference/supported-css-features/)
- `marks`(재단선)와 `bleed`는 쪽 선택자 없는 `@page` 안에서만 지원. `crop-offset`, `crop-marks-line-color`는 비표준 확장 — [같은 문서](https://docs.vivliostyle.org/en/reference/supported-css-features/)

**WeasyPrint (Python, BSD)**
- 버전: 64.0(2025-01-30), 65.0(2025-03-20, flex gap, unicode-range), 66.0(2025-07-24, `lh`/`rlh`, PDF/UA, 각주 수정), 67.0(2025-12-02, CMYK·PDF/X·PDF/A 변형, 그리드 행 쪽나눔, CSS layers, calc()), 68.0(2026-01-19, 보안 수정 CVE-2025-68616), 69.0(2026-06-02, 논리 속성, 뷰포트 단위, output-intent), 70.0(2026-09-08, CSS Notes 초기 지원, 플로트 요소 쪽나눔, box-shadow) — [WeasyPrint changelog](https://doc.courtbouillon.org/weasyprint/stable/changelog.html)
- 2025–2026 변경 기록에 CJK/한국어 줄바꿈 관련 항목은 없음. 67.0부터 없는 글리프는 두부(tofu) 상자로 표시 — [WeasyPrint changelog](https://doc.courtbouillon.org/weasyprint/stable/changelog.html)

**Prince**
- 무료 비상업 라이선스(워터마크 있음), 유료 라이선스가 워터마크 제거. 비영리 기관도 비상업 목적에만 무료판 사용 가능 — [Prince License FAQ](https://www.princexml.com/purchase/license_faq/); [Download Prince 16.2](https://www.princexml.com/download/16/)
- 서버 라이선스 1개 $3800부터(FAQ 날짜 불명, 현재가 미확인) — [Prince License FAQ](https://www.princexml.com/purchase/license_faq/)
- `marks: crop cross` 켜면 사방 6pt 재단 여유 자동 추가 — [Prince docs: marks](https://princexml.com/doc/11/properties/marks)

### Inferences
- 이 저장소 그림은 SVG·캔버스·JS로 그려지므로, JS를 실행하는 Chromium 계열(Chrome 직접, Vivliostyle, Paged.js)이 맞음. WeasyPrint·Prince(Prince는 JS 일부만)는 캔버스·JS 그림이 빠질 위험.
- 추천 구성: 학습지 = Playwright/Puppeteer `page.pdf()` 직접. 책 = Vivliostyle CLI(목차·재단선 필요 시) 또는 Chrome PDF 병합 + 계산 목차.
- [사전 지식] 네 도구 모두 시스템/웹 글꼴로 한국어 출력 가능(글꼴만 있으면 됨). Vivliostyle은 일본어 조판(CJK) 중심 개발이라 CJK 처리 성숙도가 높은 편.
- 공립학교 수업 자료라도 Prince 무료판은 워터마크가 찍히므로 인쇄소 납품용으로 부적합.

### Gaps
- Paged.js 최신 npm 버전 번호·날짜(0.4.x 이후 신규 출시 여부) 확인 못함; 2.0 출시 여부 미확인.
- Vivliostyle의 한국어 `word-break: keep-all` 처리, 한국어 사례 블로그는 찾지 못함.
- Prince 16 현재 가격 확인 못함.

## 3. Windows에서 Node/Python으로 로컬 HTML → PDF (글꼴 내장, SVG 벡터 유지, preferCSSPageSize, printBackground)

### Takeaway
Puppeteer/Playwright의 `page.pdf()`에서 `preferCSSPageSize: true`(CSS `@page size: A4` 우선)와 `printBackground: true`(배경색·칸 음영 인쇄)를 반드시 켜고, 글꼴 로딩을 기다린 뒤(Puppeteer는 `waitForFonts` 기본 true) 출력합니다. 기본값은 Letter 용지·배경 없음이라 그대로 두면 A4가 아니게 나옵니다.

### Cited Findings
- Puppeteer PDFOptions: `preferCSSPageSize`(기본 false → 용지에 맞춰 축소), `printBackground`(기본 false), `tagged`(실험, 기본 true, 접근성 태그 PDF), `outline`(실험, 기본 false, 문서 개요/책갈피 생성), `displayHeaderFooter`(기본 false), `headerTemplate` 클래스 `date`·`title`·`url`·`pageNumber`·`totalPages`, `format` 기본 `letter`, `margin` 기본 없음, `scale` 0.1–2, `timeout` 30000ms, `waitForFonts` 기본 true(`document.fonts.ready` 대기) — [Puppeteer PDFOptions](https://pptr.dev/api/puppeteer.pdfoptions)
- Playwright `page.pdf()`: 기본으로 `print` 미디어 사용, 화면 스타일로 뽑으려면 `page.emulateMedia({ media: 'screen' })`. 색은 인쇄용으로 조정되며 `-webkit-print-color-adjust`로 정확한 색 강제. header/footer 템플릿은 `<script>` 실행 안 되고 페이지 스타일도 못 씀. `format` 기본 Letter, 단위 없는 값은 px — [Playwright Page.pdf](https://playwright.dev/docs/api/class-page#page-pdf)

### Inferences
- 최소 스크립트(Node, Playwright):
  ```js
  const { chromium } = require('playwright');
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file:///C:/.../worksheet.html?mode=student');
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: 'out.pdf', preferCSSPageSize: true, printBackground: true });
  ```
  경로에 한글·공백(OneDrive "바탕 화면")이 있으면 `pathToFileURL()`(Node `url` 모듈)로 변환. 또는 로컬 서버(http://localhost)로 열면 웹 글꼴 상대경로 문제 감소.
- 머리·꼬리말은 `displayHeaderFooter` 템플릿 대신 Chrome 131 `@page` 여백 상자를 쓰는 것이 페이지 CSS·글꼴을 그대로 쓸 수 있어 유리(템플릿은 페이지 스타일 못 씀).
- [사전 지식] Chrome PDF는 사용된 글꼴을 부분집합으로 내장하고, 인라인 SVG·SVG 파일은 벡터로 남음. 단 SVG `filter`, `mask` 일부, CSS `filter`/`backdrop-filter`, 반투명 혼합은 래스터화될 수 있음 → 흑백 인쇄용 그림은 필터 없이 선·채움만.
- [사전 지식] Pretendard는 OFL로 웹 글꼴 내장 허용. 로컬 woff2를 `@font-face`로 지정하고 `font-display: block` 권장(대체 글꼴로 찍히는 것 방지).
- Python 쪽 대안: `playwright` 파이썬 패키지가 같은 API(`page.pdf`) 제공 — 저장소에 이미 파이썬 검사 스크립트(fit_check.py)가 있다면 같은 언어로 통일 가능.

### Gaps
- Playwright 문서의 `preferCSSPageSize`/`outline`/`tagged` 항목 원문은 잘려서 확인 못함(Puppeteer와 동일 CDP 옵션으로 추정). Playwright `page.pdf()`가 Chromium 전용이라는 점도 이번에 원문 재확인 못함([사전 지식]으로는 Chromium 전용).
- Chrome PDF에서 SVG가 래스터화되는 정확한 조건 목록 1차 출처 없음.

## 4. 같은 HTML에서 교사용 답지판 만들기

### Takeaway
출처 있는 표준 방법은 따로 없고, 설계 패턴 문제입니다. 가장 단순·견고한 방식은 정답을 문항 바로 옆 `<span class="ans">`로 넣어 두고 학생판은 `visibility: hidden`(자리는 유지 → 쪽 넘김이 두 판에서 같음), 교사판은 `body.teacher .ans { visibility: visible }`로 보이게 한 뒤 URL 질의(`?mode=teacher`)로 같은 파일을 두 번 출력하는 것입니다.

### Cited Findings
- Playwright는 출력 전 미디어 에뮬레이션·페이지 스크립트 실행이 가능하므로 출력 전에 클래스 전환을 넣을 수 있음(`page.emulateMedia`, `page.evaluate`) — [Playwright Page.pdf](https://playwright.dev/docs/api/class-page#page-pdf)

### Inferences
- `display: none` 대신 `visibility: hidden`을 쓰면 학생판·교사판 쪽 번호와 쪽 나뉨이 완전히 같아져 "학생판 3쪽 = 교사판 3쪽" 대조가 쉬움. 빈칸 밑줄 길이도 정답 글자 폭과 무관하게 고정 폭(`min-width`)으로.
- 서술형처럼 정답이 칸보다 길면 제자리 표시 대신 문서 끝 "정답과 해설" 부록(`<section class="answers" style="break-before: page">`)을 교사판에서만 `display: block`. 부록은 쪽 수가 달라지므로 책 묶음에서는 교사용 책만 따로 묶기.
- 교사판 표시: 정답은 흑백 인쇄에서 구별되도록 손글씨체·굵게·밑줄 등 색이 아닌 수단으로(흑백 조건).
- 정답 데이터를 HTML에 직접 두면 공개 저장소에 노출됨 → 교사판 답이 공개돼도 되는지 선생님 판단 필요(이 저장소는 공개).

### Gaps
- 한국 교육용 HTML 학습지에서 교사판을 생성하는 공개 사례·블로그는 찾지 못함.

## 5. 책 제작: PDF 병합, 홀수 쪽 시작(빈 쪽), 거울 여백, 3mm 재단 여유·재단선, PDF/X·흑백 변환

### Takeaway
병합은 PyMuPDF(`insert_pdf` + 쪽 번호를 밀어 맞춘 `set_toc`로 책갈피까지)나 qpdf(`--empty --pages`)로 하고, 거울 여백은 `@page :left/:right`에서 안쪽 여백을 크게, 홀수 쪽 시작은 차시 PDF 쪽 수가 홀수면 빈 쪽을 하나 넣어 맞춥니다. 재단선·재단 여유는 Vivliostyle/Prince의 `marks`/`bleed`가 지원하고, 흑백 변환은 Ghostscript `-sColorConversionStrategy=Gray -sProcessColorModel=DeviceGray`로 하되 `inkcov`로 결과를 확인해야 합니다. WeasyPrint 67+는 PDF/X 출력도 지원합니다.

### Cited Findings
- PyMuPDF `insert_pdf`는 다른 PDF의 쪽 범위를 삽입. 원본 책갈피는 자동으로 안 옮겨짐. 각 파일의 TOC 쪽 번호를 현재 누적 쪽수만큼 밀어 이어 붙인 뒤 마지막에 `set_toc` 한 번 — [PyMuPDF wiki: Inserting pages](https://github.com/pymupdf/PyMuPDF/wiki/Inserting-Pages-from-other-PDFs); [Artifex: How to merge PDFs with PyMuPDF](https://artifex.com/blog/how-to-merge-pdfs-with-pymupdf-a-complete-guide)
- qpdf는 기본 입력(파일 또는 내장 빈 PDF, `--empty`)에서 새 PDF를 만들며, 예전 버전은 병합 시 쪽 라벨·양식 외 문서 수준 데이터(책갈피 등)를 무시 — [qpdf TODO-pages.md](https://www.github.com/qpdf/qpdf/blob/main/TODO-pages.md)
- Chrome에서 `@page :left`/`:right`별 여백 내용 지정 가능(좌우 쪽 구분 동작) — [Chrome blog: print margins](https://developer.chrome.com/blog/print-margins)
- Vivliostyle: `marks`, `bleed`는 선택자 없는 `@page`에서만 — [Vivliostyle Supported CSS Features](https://docs.vivliostyle.org/en/reference/supported-css-features/)
- Prince: `marks: crop`/`cross` 켜면 6pt 재단 여유 자동 — [Prince docs: marks](https://princexml.com/doc/11/properties/marks); 재단선 없이 `bleed`만 쓰는 경우 논의 — [W3C www-style 2013-11](https://lists.w3.org/Archives/Public/www-style/2013Nov/0229.html)
- WeasyPrint 67.0(2025-12) CMYK·PDF/X·PDF/A 변형, 69.0 output-intent 옵션 — [WeasyPrint changelog](https://doc.courtbouillon.org/weasyprint/stable/changelog.html)
- Ghostscript 흑백: `gs -o out.pdf -sDEVICE=pdfwrite -sColorConversionStrategy=Gray -sProcessColorModel=DeviceGray -dCompatibilityLevel=1.4 -f in.pdf`(Windows는 `gswin64c`). 주의: ICC 프로필에 따라 회색 농도가 달라짐, 일부 버전에서 출력에 CMY가 남은 사례, "Unable to convert color space to Gray, reverting strategy to LeaveColorUnchanged" 경고로 조용히 실패하는 경우, `-dOverrideICC`가 필요했던 사례 → `-sDEVICE=inkcov`로 잉크 확인 권장 — [PDF Kung Fu: color PDF to grayscale](https://leanpub.com/read/pdfkungfoo/color-pdf-to-grayscale); [Apple Discussions](https://discussions.apple.com/thread/255295053); [Stack Overflow 보관: wrong graylevel](https://kiwix.lema.org/stackoverflow.com_en_all_2023-11/questions/42410774/ghostscript-s-pdfwrite-to-grayscale-results-in-wrong-graylevel); [Ghostscript bug 694608](https://bugs.ghostscript.com/show_bug.cgi?id=694608)

### Inferences
- 책 조립 파이프라인(가장 단순): ① 차시별 학습지 PDF를 Chrome으로 출력(쪽 번호 없이 또는 임시) → ② PyMuPDF로 각 PDF 쪽 수를 세어 시작 쪽 계산, 홀수 쪽 시작 규칙이면 빈 쪽(`doc.new_page()`) 삽입 → ③ 계산한 쪽 번호로 목차 HTML 생성 후 Chrome 출력 → ④ 병합 + `set_toc` 책갈피 → ⑤ 이어지는 쪽 번호는 처음부터 책 전체를 한 HTML(차시를 이어 붙인 문서)로 출력하면 `counter(page)`가 자동으로 이어짐. 차시별 따로 출력한 뒤 병합할 경우엔 [사전 지식] CSS `@page { counter-reset: page N }` 대신 PyMuPDF `insert_text`로 쪽 번호를 덧찍거나, 책 전체 HTML 한 번 출력이 깔끔.
- 거울 여백 예: `@page :right { margin: 15mm 15mm 18mm 22mm } @page :left { margin: 15mm 22mm 18mm 15mm }`(안쪽 22mm, 제본 여유). [사전 지식] Chrome에서 첫 쪽은 오른쪽(:right)으로 취급.
- 학교 인쇄실·인쇄소가 흑백 A4 중철/무선 제본이면 재단 여유가 필요한 것은 쪽 끝까지 닿는 그림·배경이 있을 때뿐. 흰 여백이 있는 학습지라면 재단 여유·재단선 없이 A4 그대로 납품이 일반적 → 인쇄소에 먼저 확인.
- [사전 지식] Chrome으로 재단 여유를 만들려면 `@page { size: 216mm 303mm }`(A4+사방 3mm)로 키우고 내용 판을 3mm 안쪽에 두는 방식만 가능(재단선 자동 없음).
- [사전 지식] pdf-lib(Node): `PDFDocument.create()` → `copyPages(src, src.getPageIndices())` → `addPage`, 빈 쪽은 `addPage([595.28, 841.89])`. 책갈피(개요) API는 없어 PyMuPDF가 더 편함.

### Gaps
- pdf-lib `copyPages`, qpdf `--empty --pages a.pdf b.pdf -- out.pdf` 정확한 문법은 이번 검색에서 1차 문서로 재확인 못함.
- Chrome 출력 PDF를 PDF/X로 바꾸는 무료 경로(Ghostscript `-dPDFX`)의 신뢰성 자료는 찾지 못함.
- 한국 인쇄소의 재단 여유 요구(3mm 여부)는 업체별로 달라 일반 출처 없음.

## 6. 흔한 함정: 상자 쪼개짐, 그림 잘림, 대체 글꼴, 한국어 줄바꿈(word-break: keep-all), 캔버스 해상도

### Takeaway
쪼개짐은 `break-inside: avoid`(Chrome 108부터 LayoutNG 인쇄 경로로 플렉스·그리드·표도 쪽나눔 처리)로 막고, 한국어는 `word-break: keep-all`을 `:lang(ko)`에 걸어 어절 단위로 줄바꿈하며, 글리프 깨짐은 줄바꿈이 아니라 글꼴 부재 문제라 글꼴을 명시적으로 내장해야 합니다. 캔버스 그림은 인쇄 PDF에서 비트맵이 되므로 높은 배율로 다시 그리거나 SVG로 바꿔야 합니다.

### Cited Findings
- 플렉스·그리드(103)·표(106)·인쇄(108) LayoutNG 쪽나눔, 레거시 엔진은 플렉스·그리드 쪽나눔 불가 — [RenderingNG: block fragmentation](https://developer.chrome.com/docs/chromium/renderingng-fragmentation)
- 한국어는 공백(어절) 단위 또는 음절 단위로 줄바꿈 가능. `keep-all` 동작을 한국어에만 쓰려면 `:lang(ko)` 선택자로 범위 지정 제안. 어절 줄바꿈("keep-korean")은 종이 문서 전통에서 주로 쓰인다는 의견(반론도 있었음) — [W3C www-international 2015 (신정식)](https://lists.w3.org/Archives/Public/www-international/2015JanMar/0113.html); [W3C www-style 2015 (Florian Rivoal)](https://lists.w3.org/Archives/Public/www-style/2015Mar/0050.html)
- Bloomberg는 Chromium 포크에 비표준 `-bb-keep-all-if-korean`을 넣었을 정도로 `keep-all`의 한국어 처리 논의가 있었음 — [W3C www-style 2015 (Shezan Baig)](https://lists.w3.org/Archives/Public/www-style/2015Mar/0054.html)
- WeasyPrint 67+는 글꼴에 없는 글자를 두부 상자로 표시(조용히 대체되지 않음) — [WeasyPrint changelog](https://doc.courtbouillon.org/weasyprint/stable/changelog.html)
- Puppeteer `waitForFonts` 기본 true(`document.fonts.ready` 대기, 백그라운드 페이지면 `bringToFront()` 필요할 수 있음) — [Puppeteer PDFOptions](https://pptr.dev/api/puppeteer.pdfoptions)
- Playwright 출력은 색을 인쇄용으로 조정하므로 `-webkit-print-color-adjust: exact`(표준 `print-color-adjust`) 필요 — [Playwright Page.pdf](https://playwright.dev/docs/api/class-page#page-pdf)

### Inferences
- 권장 기본 CSS:
  ```css
  @page { size: A4; margin: 15mm; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  :lang(ko) { word-break: keep-all; overflow-wrap: anywhere; line-break: strict; }
  .q, figure, table, .box { break-inside: avoid; }
  h2, h3 { break-after: avoid; }
  p { orphans: 2; widows: 2; }
  img, svg, canvas { max-width: 100%; break-inside: avoid; }
  ```
  `keep-all`만 쓰면 긴 영문/URL이 넘칠 수 있어 `overflow-wrap: anywhere`(또는 `break-word`)를 같이.
- 상자가 한 쪽보다 크면 `break-inside: avoid`가 무시되고 잘림 → 학습지는 문항 상자 높이를 쪽 높이의 절반 이하로 설계.
- [사전 지식] 높이가 고정된 그리드/플렉스 상자(`height: 100vh` 등), `position: absolute`/`fixed` 요소, `overflow: hidden` 부모는 쪽 경계에서 잘리거나 매 쪽 반복됨 → 인쇄 CSS에서 `height: auto; overflow: visible; position: static`으로 풀기. 이 저장소의 태블릿 "한 화면" 레이아웃은 그대로 인쇄하면 안 되고 인쇄 전용 스타일/원본이 필요.
- [사전 지식] 캔버스 해상도: 캔버스는 인쇄에서 픽셀 그대로 들어감. A4 폭 180mm를 300dpi로 찍으려면 약 2126px 필요 → `canvas.width = cssWidth * 3`(또는 `deviceScaleFactor`/`devicePixelRatio` 3–4로 다시 그림)로 그린 뒤 `toDataURL('image/png')`을 `<img>`로 바꿔 넣고 출력. Playwright는 `browser.newContext({ deviceScaleFactor: 3 })`로 DPR을 올릴 수 있음. 흑백 인쇄에는 가능하면 SVG로 그리는 것이 선명·용량 모두 유리.
- [사전 지식] WebGL(Three.js 3D) 캔버스는 `preserveDrawingBuffer: true`가 없으면 출력 시 빈 칸으로 나올 수 있음 → 3D 그림은 미리 PNG로 찍어 넣기.
- 대체 글꼴: `font-family: 'Pretendard', 'Noto Sans KR', sans-serif`처럼 한국어 글꼴을 명시하고 로컬 woff2로 내장. 시스템 기본 대체(맑은 고딕)로 찍히면 컴퓨터마다 결과가 달라짐.

### Gaps
- headless Chrome PDF에서 `word-break: keep-all` 인쇄 버그 사례, 한국어 블로그(HTML→PDF 한글 깨짐) 1차 자료는 이번 검색에서 나오지 않음.
- `line-break: strict`의 한국어 효과, Chrome `text-wrap: pretty`의 인쇄 적용 여부는 미조사.
- 캔버스 DPR·`preserveDrawingBuffer` 관련 1차 출처(MDN) 재확인 못함.
