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
  - `lesson.json`: 출력 폴더, 제목, 로고, 탭 목록. `"shell": false`면 탭 껍데기 없이 `index.tpl.html` 한 장만 만들어요(예: `career-map`)
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
템플릿 안에서 `/*@@PART:c3.js@@*/`처럼 쓰면 공통 조각이, `/*@@LOCAL:_photo.js@@*/`처럼 쓰면 수업 전용 조각이 들어가요. 빌드는 남은 표시, 숨은 문자(BOM), 제작자 표기가 남아 있는지(2026-10-07부터 넣지 않음)를 검사해요.

**`lessons/` 안의 HTML을 직접 고치지 말고 `src/`를 고친 뒤 다시 빌드해요.** GAS 같은 곳에 옮길 때도 빌드된 단독 HTML을 그대로 쓰면 돼요.

## 3D와 2D 고르기
- **3D (three.js):** 물체의 구조·공간 관계가 핵심일 때. 예: 웨이퍼, MLCC 단면, 회로 키트, 이미지 센서 층
- **2D 도식·그래프 (SVG + flow.js):** 흐름, 양의 비교, 순환, 과정, 계산이 핵심일 때. 예: 전기·물·열의 흐름, 물의 순환, 전력량 비교, 사회 쟁점
- 한 수업 안에서 섞어도 돼요. 어느 쪽이든 그라디언트·그림자·움직임을 갖춘 완성도로 만들어요.

## 화면 검사 순서
1. `qa.json`에 핵심 장면(버튼 누른 상태 포함)을 적어요.
2. `qa_sheet.py`로 가로·세로 모음 사진을 만들어 한 번에 보고, 잘림·겹침·멈춤을 고쳐요.
3. 오류 보고가 "문제 없음"인지 확인해요(404 favicon은 무시).
4. `python tools/lesson-kit/fit_check.py <수업> --shots <폴더>`로 시뮬레이션이 태블릿 한 화면(가로 1280×740, 세로 800×1220)에 스크롤 없이 들어가는지 재요. 버튼을 누른 뒤 화면은 `src/<수업>/fit.json`에 적어요.

## 3D 로딩 빠르게 하기 (2026-10-12, 광물·암석 수업에서 정리)
3D 재질(특히 셰이더로 무늬를 그리는 암석·광물)은 처음 그릴 때 번역(셰이더 컴파일)에 오래 걸려요. 화면이 수십 초 멈췄던 적이 있어요. 새 3D 수업은 처음부터 이렇게 만들어요.
- **보기만 하는 3D 그림 → 영상**: `C3.video(host, () => { …3D 만들기… })`. host에 `data-video="media/v-이름.mp4" data-poster="media/v-이름.jpg"`. 영상은 `bake.py`가 만들어요.
- **손으로 돌리거나 버튼이 있는 3D 그림 → 가까워지면 켜기 + 멈추지 않는 준비**: `C3.lazy(host, () => { const st = C3.makeStage(host, {…, hold: true}); …; C3.prepare(st); })`. host에 `data-poster="media/p-이름.jpg"`를 붙이면 준비되는 동안 사진을 보여 줘요.
- **실험실처럼 바로 쓰는 3D**: `makeStage(…, { hold: true })` 뒤 `C3.prepare(st)`. 실험 중에 새 물체를 넣을 때는 `renderer.compileAsync(임시 장면, camera, st.scene)`로 먼저 준비해요.
- **카드 사진은 미리 찍은 그림 파일로** (`media/th-*.png`). 페이지에서 즉석으로 찍지 않아요.
- 실험 도구의 유리는 `transmission` 대신 반투명(`transparent`, `opacity`)으로. transmission은 재질 번역을 한 번 더 해야 해요.
- `python tools/lesson-kit/bake.py <수업> [이름 일부]`: `src/<수업>/bake.json` 목록대로 사진·영상을 `lessons/<수업>/media/`에 만들어요(로컬 서버 필요, `pip install imageio-ffmpeg`). 영상 하나에 10분쯤 걸려요. 3D 모형을 고치면 다시 구워요.

## 수업별 재사용 도구
2026-10-22에 프로젝트 규칙 문서(`CLAUDE.md`)에서 옮겨 왔어요. 새 수업을 만들 때 같은 대단원 도구를 먼저 찾아 다시 써요. 새 도구를 만들면 여기에 한 줄 더해요.

- 밀도(Ⅰ 물질의 특성): `tools/lesson-kit/src/density/_den.js`(DEN: 비커 속 구슬 beakers, 1 cm³ 조각 cubes, 밀도 막대 chart(그림 Ⅰ-2 값), 입자 모형 particles, 뜨고 가라앉는 컵 jar(방울이 제 층을 찾아감·고체 뜨고 가라앉기), 전자저울·눈금실린더 실험실 lab). 다음 Ⅰ 수업도 재사용한다.
- 용해도(Ⅰ 물질의 특성): `tools/lesson-kit/src/solubility/_sol.js`(SOL: 용해도 자료·보간 solu/label, 입자 모형 dissolve, 포화·불포화 satur, 용해도 곡선 curve, 결정 알갱이 무더기 pile, 시험관 그리기)와 `_sol2.js`(SOL.tube 시험관 실험실, SOL.beaker 물 100 g 비커, SOL.soda 탄산음료·주사기). 그림 칸을 화면에 맞게 자르는 `surface(…, crop)`/`setCrop`도 여기 있다. 다음 Ⅰ 수업(녹는점·끓는점 등)도 재사용한다.
- 녹는점과 끓는점(Ⅰ 물질의 특성): `tools/lesson-kit/src/melting-boiling/_mb.js`(MB: 핫플레이트·스탠드·온도 센서·디지털 온도계·삼각 플라스크, 온도-시간 그래프 tgraph, 끓는점 실험실 boil, 녹는점 실험실 melt, 그림 Ⅰ-8 mgraph, 그림 Ⅰ-7·Ⅰ-9 ladder, 신기한 물질 도감 atlas, 찻주전자와 솥 pots). `_sol.js`(용해도 SOL) 사본의 그리기 도구를 빌려 쓴다.
- 순물질과 혼합물(Ⅰ 물질의 특성): `tools/lesson-kit/src/pure-mixture/_mix.js`(MIX: 입자 돋보기 lens·lensCore(Matter.js로 입자 움직임 계산, 기체·액체·고체, 붓기·젓기·가라앉기), 물과 소금물 실험실 ws·읽기용 그래프 wsGraphs, 컵 그림+돋보기 sample, 조사 카드 그래프 sketch). `_mb.js` 사본이 기구 그림을 `MB._`로 내보낸다. 끌어다 놓기는 SortableJS. 둘 다 jsdelivr에서 불러오고, 못 불러오면 자체 계산·누르기 방식으로 대신한다.
- 밀도 차를 이용한 분리(Ⅰ 혼합물의 분리): `tools/lesson-kit/src/density-separation/_sep.js`(SEP: 그릇 부피↔높이 vessel, 콩기름 방울이 떠올라 층이 되는 emulsion, 흔드는 병 bottle, 스탠드·링·분별 깔때기·비커 3개 funnel(꼭지 3단계, 비커 바꾸기, 입구로 따르기), 키질 winnow, 기름막이 boom). 다음 혼합물의 분리 수업도 재사용한다.
- 용해도 차를 이용한 분리(Ⅰ 혼합물의 분리): `tools/lesson-kit/src/solubility-separation/_ss.js`(SS: 해 보기 실험실 lab(시약포지·200 mL 비커·유리 막대·500 mL 얼음물 비커·거름 장치, 붕산 결정 석출·거르기·거름종이 확대), 그림 Ⅰ-12 곡선+비커 curve, 용해도 solu(그림 Ⅰ-12 값)). 첫 탭을 영상으로 열려면 `lesson.json`에 `"start": "video"`(build.py가 탭 껍데기 기본 탭으로 넣음, 없으면 reading).
- 혼합물 분리 실험 설계(Ⅰ 혼합물의 분리, 단원 총정리): `tools/lesson-kit/src/mixture-design/_mx.js`(MX: 물질 8가지 그릇 계산 mk·ops(물 붓기, 뜨거운 물, 거르기, 분별 깔때기, 뜬 것 건지기, 얼음물, 가열하여 물 날려 보내기)·계획 점검 dryRun, 실험대 lab(가운데 그릇 + 기구 자리, 기울여 따르기·수면 수평 계산, 구슬·알갱이 날아가기), 선반 칸 thumb). 다른 Ⅰ 수업에서 여러 분리 기구를 함께 보일 때 재사용한다.
- 지권(Ⅱ) 3D 모형: 광물은 `tools/lesson-kit/src/minerals/_min3d.js`(MIN3D), 암석 12종·퇴적물·층리·화석은 `src/rocks/_rock3d.js`(ROCK3D, MIN3D 사본이 `src/rocks/_min3d.js`에 있음). `ROCK3D.thumbs(ids)`로 카드용 사진을 만들 수 있다. 다음 Ⅱ 수업(암석의 순환 등)도 재사용한다.
- 대륙 지도(Ⅱ 지권의 운동): `tools/lesson-kit/src/continental-drift/_geo.js`(Natural Earth 1:50m 대륙 모양), `_globe.js`(GLOBE: 판게아↔현재 대륙 회전, 캔버스 지구본), `_gond.js`(EVID 화석·빙하 증거, GOND 평면 대륙 조각판). 다음 판 구조 수업도 재사용한다.
- 지진·화산 지도(Ⅱ 지권의 운동): `tools/lesson-kit/src/quake-volcano/_map.js`(WMAP: 실제 지진·화산·판의 경계 캔버스 지도, 재생·확대·판 강조·띠 칠하기, USGS 실시간 자료), `_bound2d.js`(BND: 교과서 그림 Ⅱ-16 형식 덩어리 그림, 부딪침·갈라짐·어긋남). 자료는 `lessons/quake-volcano/data/`(만드는 법 `_data_prep.py`). 다음 지권의 운동 수업도 재사용한다.
- 3D 로딩: 보기만 하는 3D 그림은 영상(`C3.video`), 나머지는 `C3.lazy` + `C3.prepare`(멈추지 않는 셰이더 준비)와 미리 찍은 사진을 쓴다. 사진·영상은 `tools/lesson-kit/bake.py`로 만든다 (2026-10-12, 로딩이 길다는 선생님 의견으로 도입. 자세한 것은 `tools/lesson-kit/README.md`).
- 빛 그림(Ⅲ 빛과 파동): `tools/lesson-kit/src/light-path/_optics.js`(OP: 레이저 광선·각도기·슬릿 레이저·빛 알갱이·눈·HTML 이름표), `_art.js`(OPA: 전등·태양·공·책·통·반사판·화분·촬영기 일러스트). 평면거울 작도 장면은 `src/plane-mirror/_mirror.js`(MR: 방·세운 거울·꽃 화분, 단계별 작도 render(0~7)). 볼록·오목 거울과 렌즈는 `src/mirror-lens/_ml.js`(ML: F 모양 물체, 받침대의 둥근 거울·렌즈 속 상, 옆 배치도, 기구 단면 그림)와 `_rays.js`(ML.rays: 나란한 빛의 반사·굴절 실제 계산). 다음 Ⅲ 수업도 재사용한다. 파동 그림(Ⅲ-2 파동)은 `src/wave/_wave.js`(WV: 옆에서 본 물결파 수조 tank, 모눈 파동 graph(마루·골·파장·진폭 표시, 목표 파동), 매질 한 점 높이 기록 timeline, 차례 사진 strip, 위에서 본 물결 ripple). 다음 파동 수업(소리 등)도 재사용한다. 거울·렌즈로 본 모습(캔버스 왜곡)은 `src/mirror-lens-use/_loupe.js`(LP), 비스듬히 내려다본 마을 그림은 `_town.js`(TOWN), 다섯 종류 아이콘은 `_kinds.js`(KINDS·KICON).
- 마찰 전기(Ⅶ-1 전기): `tools/lesson-kit/src/friction-electricity/_chg.js`(CHG: 원자 구조 atom, 털과 풍선 rub(끌어서 문지르기·전자 이동·떼어 놓으면 털이 끌림), 숟가락 실험실 spoon(장갑으로 문지르기·㉯/장갑 가까이·회전), 매단 두 공 pend, 전하 기호 plus/minus). (−)는 파란 동그라미, (+)는 짙은 회색 테두리. 다음 전기 수업(정전기 유도 등)도 재사용한다.
- 소리(Ⅲ-2 파동): `tools/lesson-kit/src/sound/_snd.js`(SND: 실제 악기 녹음 재생·소리 분석 화면 scope·기록용 shot, 녹음은 `lessons/sound/audio/`, 만드는 법 `_audio_prep.py`, 출처 `audio/LICENSE.txt` CC BY 3.0), `_inst.js`(ART: 악기 14가지 SVG 그림), `_pair.js`(PAIR: 두 소리 기록 칸), `_fig.js`(FIG.travel: 북→공기 입자→귀). 다음 소리 수업도 재사용한다.
- 별 그림: Ⅷ 단원은 캔버스로 빛 번짐 별을 그린다(`parallax` sim2의 `window.SKY`, `star-brightness`의 `_glow.js` `window.GLOW`). 실제 하늘 지도는 d3-celestial(BSD-3)을 `lessons/star-brightness/sky/`에 복사해 쓴다(별 목록은 `stars6.json`·`stars8.json`으로 줄임, 라이선스 `sky/LICENSE.txt`). 다음 Ⅷ 수업도 이 폴더를 재사용한다. 별의 밝기 차시까지는 별을 흰색으로 그리고, `star-color`부터는 `_color.js`의 `window.SC`로 색을 칠한다(별 목록 `sky/data/stars6c.json`에 색 정보 포함, 교과서 색 띠 별은 교과서 색).
