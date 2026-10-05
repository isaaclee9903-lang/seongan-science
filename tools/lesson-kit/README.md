# 수업 페이지 제작 도구 (lesson-kit)

새 수업을 만들 때 공통 부분(오류 상자, CSS, 퀴즈 엔진, 3D 도구, 2D 도식 도구, 탭 껍데기)을 다시 쓰지 않도록 모아 둔 곳이에요. 2026-10-05에 「사진 한 장의 여행」을 만들며 정리했어요.

## 폴더
- `parts/` 공통 조각
  - `errbox_read.html`, `errbox_sim.html`, `errbox_sum.html`: 실패하면 빨간 상자로 알리는 머리 스크립트
    - 읽기: `RD.ok1`(기본·퀴즈), `RD.ok2`(그림 조작, 없으면 `RD.need2 = false`), `.fail3d`가 있을 때만 `RD.ok3d`
    - 시뮬레이션: `SM.okUI`, `#fail3d`가 있을 때만 `SM.ok3d`
    - 정리: `window.SW_CHECKS = [['ok1','이름'], …]`
  - `css_read.css`, `css_sim.css`, `css_sum.css`: 페이지 종류별 기본 CSS(색·서체·카드·퀴즈·3D 화면)
  - `quiz_engine.js`: 퀴즈 엔진. 읽기 페이지의 기본형(r1, r2, q1, r3, r4, q2)을 가정해요. 앞에 `QUIZ`, `LINKS`, `GLOSSARY`, `EMBED`를 정의해요
  - `c3.js`: three.js 3D 도구(무대, 이름표, 전선, 흐르는 알갱이, 책상). `st.fit(물체, {dir, margin, dur})`는 물체가 화면에 꼭 들어오게 카메라를 맞추고, 가로↔세로가 바뀌면 다시 맞춰요
  - `bulb.js`: 전구(꼬마·백열·LED)와 똑딱 스위치 3D 모형
  - `flow.js`: 2D SVG 도식 도구. `FLOW.dots(path, {n, r, color, speed})`로 길을 따라 알갱이를 흐르게 하고, `.set({rate})`로 양을 바꿔요
  - `shell.html`: 탭 껍데기 틀
- `src/<수업>/`: 수업 원본
  - `lesson.json`: 출력 폴더, 제목, 로고, 탭 목록
  - `*.tpl.html`: 페이지 템플릿
  - `_*.js`: 이 수업 전용 조각
  - `qa.json`: 화면 검사 장면 목록
- `build.py`, `qa_sheet.py`, `shot.py`: 만들기와 검사

## 쓰는 법
```
python tools/lesson-kit/build.py chip-earth          # lessons/chip-earth/ 에 단독 HTML 5개 생성
python -m http.server 8770 --directory .              # 저장소 루트에서 미리보기 서버
python tools/lesson-kit/qa_sheet.py chip-earth        # 가로·세로 모음 사진 + 오류 보고 (tools/lesson-kit/_qa/)
python tools/lesson-kit/shot.py URL out.png 1280 800 "#선택자" 3 "#버튼1,wait800,#버튼2"   # 한 장면만
```
템플릿 안에서 `/*@@PART:c3.js@@*/`처럼 쓰면 공통 조각이, `/*@@LOCAL:_photo.js@@*/`처럼 쓰면 수업 전용 조각이 들어가요. 빌드는 남은 표시, 숨은 문자(BOM), 제작 표기 누락을 검사해요.

**`lessons/` 안의 HTML을 직접 고치지 말고 `src/`를 고친 뒤 다시 빌드해요.** GAS 같은 곳에 옮길 때도 빌드된 단독 HTML을 그대로 쓰면 돼요.

## 3D와 2D 고르기
- **3D (three.js):** 물체의 구조·공간 관계가 핵심일 때. 예: 웨이퍼, MLCC 단면, 회로 키트, 이미지 센서 층
- **2D 도식·그래프 (SVG + flow.js):** 흐름, 양의 비교, 순환, 과정, 계산이 핵심일 때. 예: 전기·물·열의 흐름, 물의 순환, 전력량 비교, 사회 쟁점
- 한 수업 안에서 섞어도 돼요. 어느 쪽이든 그라디언트·그림자·움직임을 갖춘 완성도로 만들어요.

## 화면 검사 순서
1. `qa.json`에 핵심 장면(버튼 누른 상태 포함)을 적어요.
2. `qa_sheet.py`로 가로·세로 모음 사진을 만들어 한 번에 보고, 잘림·겹침·멈춤을 고쳐요.
3. 오류 보고가 "문제 없음"인지 확인해요(404 favicon은 무시).
