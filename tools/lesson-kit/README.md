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

- 인체 3D(Ⅵ 동물과 에너지): `tools/lesson-kit/src/circulatory-system/_cv3.js`(CV3.heart: 실제 심장 모형, 네 방 단면, 뛰는 모습, 판막, 혈액 흐름), `_cv3b.js`(CVB.vessels: 혈관 연결·세 혈관·물질 교환, CVB.blood: 혈액 성분). 모형 자료는 BodyParts3D 4.0(CC BY 4.0, 출처 표기 필요), 뽑는 법은 `_anat_prep.py`, 읽기용 영상 찍기는 `_anat_bake.py`. 학생용 그림이라 생식기 쪽 혈관과 알몸 피부는 넣지 않는다. 폐 표면과 간 전체는 이 자료에 없어 Human Reference Atlas(CC BY 4.0)에서 가져온다.
- 밀도(Ⅰ 물질의 특성): `tools/lesson-kit/src/density/_den.js`(DEN: 비커 속 구슬 beakers, 1 cm³ 조각 cubes, 밀도 막대 chart(그림 Ⅰ-2 값), 입자 모형 particles, 뜨고 가라앉는 컵 jar(방울이 제 층을 찾아감·고체 뜨고 가라앉기), 전자저울·눈금실린더 실험실 lab). 다음 Ⅰ 수업도 재사용한다.
- 용해도(Ⅰ 물질의 특성): `tools/lesson-kit/src/solubility/_sol.js`(SOL: 용해도 자료·보간 solu/label, 입자 모형 dissolve, 포화·불포화 satur, 용해도 곡선 curve, 결정 알갱이 무더기 pile, 시험관 그리기)와 `_sol2.js`(SOL.tube 시험관 실험실, SOL.beaker 물 100 g 비커, SOL.soda 탄산음료·주사기). 그림 칸을 화면에 맞게 자르는 `surface(…, crop)`/`setCrop`도 여기 있다. 다음 Ⅰ 수업(녹는점·끓는점 등)도 재사용한다.
- 녹는점과 끓는점(Ⅰ 물질의 특성): `tools/lesson-kit/src/melting-boiling/_mb.js`(MB: 핫플레이트·스탠드·온도 센서·디지털 온도계·삼각 플라스크, 온도-시간 그래프 tgraph, 끓는점 실험실 boil, 녹는점 실험실 melt, 그림 Ⅰ-8 mgraph, 그림 Ⅰ-7·Ⅰ-9 ladder, 신기한 물질 도감 atlas, 찻주전자와 솥 pots). `_sol.js`(용해도 SOL) 사본의 그리기 도구를 빌려 쓴다.
- 순물질과 혼합물(Ⅰ 물질의 특성): `tools/lesson-kit/src/pure-mixture/_mix.js`(MIX: 입자 돋보기 lens·lensCore(Matter.js로 입자 움직임 계산, 기체·액체·고체, 붓기·젓기·가라앉기), 물과 소금물 실험실 ws·읽기용 그래프 wsGraphs, 컵 그림+돋보기 sample, 조사 카드 그래프 sketch). `_mb.js` 사본이 기구 그림을 `MB._`로 내보낸다. 끌어다 놓기는 SortableJS. 둘 다 jsdelivr에서 불러오고, 못 불러오면 자체 계산·누르기 방식으로 대신한다.
- 밀도 차를 이용한 분리(Ⅰ 혼합물의 분리): `tools/lesson-kit/src/density-separation/_sep.js`(SEP: 그릇 부피↔높이 vessel, 콩기름 방울이 떠올라 층이 되는 emulsion, 흔드는 병 bottle, 스탠드·링·분별 깔때기·비커 3개 funnel(꼭지 3단계, 비커 바꾸기, 입구로 따르기), 키질 winnow, 기름막이 boom). 다음 혼합물의 분리 수업도 재사용한다.
- 용해도 차를 이용한 분리(Ⅰ 혼합물의 분리): `tools/lesson-kit/src/solubility-separation/_ss.js`(SS: 해 보기 실험실 lab(시약포지·200 mL 비커·유리 막대·500 mL 얼음물 비커·거름 장치, 붕산 결정 석출·거르기·거름종이 확대), 그림 Ⅰ-12 곡선+비커 curve, 용해도 solu(그림 Ⅰ-12 값)). 첫 탭을 영상으로 열려면 `lesson.json`에 `"start": "video"`(build.py가 탭 껍데기 기본 탭으로 넣음, 없으면 reading).
- 끓는점 차를 이용한 분리(Ⅰ 혼합물의 분리): `tools/lesson-kit/src/boiling-separation/_bs.js`(BS: 그림 Ⅰ-14 가열 장치 실험실 still(가지 달린 시험관·디지털 온도계·고무관·얼음물 시험관, 시험관 바꾸기, 가열 곡선, 입자 돋보기 lens), 가열 곡선 구간 읽기 curve, 고깃국 기름 식혀 걷기 soup, 원유를 분리하는 탑+생활 속 쓰임 마을 tower). 입자 돋보기 `lensGroup`은 다른 혼합물 수업에도 쓸 수 있다.
- 혼합물 분리 실험 설계(Ⅰ 혼합물의 분리, 단원 총정리): `tools/lesson-kit/src/mixture-design/_mx.js`(MX: 물질 8가지 그릇 계산 mk·ops(물 붓기, 뜨거운 물, 거르기, 분별 깔때기, 뜬 것 건지기, 얼음물, 가열하여 물 날려 보내기)·계획 점검 dryRun, 실험대 lab(가운데 그릇 + 기구 자리, 기울여 따르기·수면 수평 계산, 구슬·알갱이 날아가기), 선반 칸 thumb). 다른 Ⅰ 수업에서 여러 분리 기구를 함께 보일 때 재사용한다.
- 전자기 유도와 에너지 전환(중3 Ⅵ): `tools/lesson-kit/src/energy-induction/_emi.js`(EMI: 코일·검류계·막대자석 실험실 lab(끌기, 실험하기 1~3 기록, 자기장 선), 자가 발전 손전등 속 flash(흔들기·관성으로 움직이는 자석·전구), 말굽 자석 발전기 gen(손잡이·물레·회전 날개), 떨어지는 자석 (가)(나) drop(에너지 막대), 자전거 발전기와 에너지 띠 bike). 읽기 페이지의 눌러서 여는 빈칸(`.bk`)은 이 수업 `reading.tpl.html`에 있다. 다음 중3 에너지 수업도 재사용한다.
- 물질의 구성(Ⅳ): `tools/lesson-kit/src/elements/_el_core.js`(EL: 입자 공 ball·묶음 unit(H2O·H2·O2·CO2·CH4·NH3 등), 돋보기 속 입자 무리 swarm(기체·액체·고체 격자·사슬)과 둥근 돋보기 lens, 입자 색 PT), `_el_water.js`(물 분해 장치: 수조·관 두 개·전원 장치·향불 시험·입자 돋보기), `_el_items.js`(그림 Ⅳ-1 물체 10가지 ITEMS, 원소 표본 그림 SAMPLE 18가지, 작은 캔버스 thumb), `_el_sort.js`(원소·화합물 나누기), `_el_formula.js`(원소 기호 목록 SYM, 화학식 FORMULA와 돌아가는 입자 모형), `_el_read.js`(수소+산소→물 돋보기, 그림 Ⅳ-2 카드 부채꼴, 원소 기호 규칙 움직임). 다음 Ⅳ 수업(원자·분자·이온)도 재사용한다. 2026-10-26 선생님 요청으로 그림 속 물질 색을 더 다채롭게 했다(틀은 라스 파랑).
- 지권(Ⅱ) 3D 모형: 광물은 `tools/lesson-kit/src/minerals/_min3d.js`(MIN3D), 암석 12종·퇴적물·층리·화석은 `src/rocks/_rock3d.js`(ROCK3D, MIN3D 사본이 `src/rocks/_min3d.js`에 있음). `ROCK3D.thumbs(ids)`로 카드용 사진을 만들 수 있다. 다음 Ⅱ 수업(암석의 순환 등)도 재사용한다.
- 대륙 지도(Ⅱ 지권의 운동): `tools/lesson-kit/src/continental-drift/_geo.js`(Natural Earth 1:50m 대륙 모양), `_globe.js`(GLOBE: 판게아↔현재 대륙 회전, 캔버스 지구본), `_gond.js`(EVID 화석·빙하 증거, GOND 평면 대륙 조각판). 다음 판 구조 수업도 재사용한다.
- 지진·화산 지도(Ⅱ 지권의 운동): `tools/lesson-kit/src/quake-volcano/_map.js`(WMAP: 실제 지진·화산·판의 경계 캔버스 지도, 재생·확대·판 강조·띠 칠하기, USGS 실시간 자료), `_bound2d.js`(BND: 교과서 그림 Ⅱ-16 형식 덩어리 그림, 부딪침·갈라짐·어긋남). 자료는 `lessons/quake-volcano/data/`(만드는 법 `_data_prep.py`). 다음 지권의 운동 수업도 재사용한다.
- 3D 로딩: 보기만 하는 3D 그림은 영상(`C3.video`), 나머지는 `C3.lazy` + `C3.prepare`(멈추지 않는 셰이더 준비)와 미리 찍은 사진을 쓴다. 사진·영상은 `tools/lesson-kit/bake.py`로 만든다 (2026-10-12, 로딩이 길다는 선생님 의견으로 도입. 자세한 것은 `tools/lesson-kit/README.md`).
- 빛 그림(Ⅲ 빛과 파동): `tools/lesson-kit/src/light-path/_optics.js`(OP: 레이저 광선·각도기·슬릿 레이저·빛 알갱이·눈·HTML 이름표), `_art.js`(OPA: 전등·태양·공·책·통·반사판·화분·촬영기 일러스트). 평면거울 작도 장면은 `src/plane-mirror/_mirror.js`(MR: 방·세운 거울·꽃 화분, 단계별 작도 render(0~7)). 볼록·오목 거울과 렌즈는 `src/mirror-lens/_ml.js`(ML: F 모양 물체, 받침대의 둥근 거울·렌즈 속 상, 옆 배치도, 기구 단면 그림)와 `_rays.js`(ML.rays: 나란한 빛의 반사·굴절 실제 계산). 다음 Ⅲ 수업도 재사용한다. 파동 그림(Ⅲ-2 파동)은 `src/wave/_wave.js`(WV: 옆에서 본 물결파 수조 tank, 모눈 파동 graph(마루·골·파장·진폭 표시, 목표 파동), 매질 한 점 높이 기록 timeline, 차례 사진 strip, 위에서 본 물결 ripple). 다음 파동 수업(소리 등)도 재사용한다. 거울·렌즈로 본 모습(캔버스 왜곡)은 `src/mirror-lens-use/_loupe.js`(LP), 비스듬히 내려다본 마을 그림은 `_town.js`(TOWN), 다섯 종류 아이콘은 `_kinds.js`(KINDS·KICON).
- 마찰 전기(Ⅶ-1 전기): `tools/lesson-kit/src/friction-electricity/_chg.js`(CHG: 원자 구조 atom, 털과 풍선 rub(끌어서 문지르기·전자 이동·떼어 놓으면 털이 끌림), 숟가락 실험실 spoon(장갑으로 문지르기·㉯/장갑 가까이·회전), 매단 두 공 pend, 전하 기호 plus/minus). (−)는 파란 동그라미, (+)는 짙은 회색 테두리. 다음 전기 수업(정전기 유도 등)도 재사용한다.
- 광합성(Ⅴ 식물과 에너지): `tools/lesson-kit/src/photosynthesis/_ps.js`(PS: 잎 leafData·drawLeaf(가운데 잎맥·곁맥·잔맥, 잎맥은 공간 군집화 방법을 새로 구현), 입자 모형 mCO2·mH2O·mO2·mGlu, 길 따라 움직이는 입자 flock, 무대+HTML 이름표 stage), `_ps_journey.js`(해바라기→잎→식물세포→엽록체 확대 journey), `_ps_starch.js`(잎 가리기·물중탕·페트리 접시 starchLab, 그림 Ⅴ-1 starchFig), `_ps_gas.js`(센서 측정 gasLab). 식물세포 그림 `_cell.js`는 SwissBioPics(CC BY 4.0)를 `_cell_prep.py`로 줄이고 색을 입힌 것. 다음 Ⅴ 수업도 재사용한다.
- 광합성의 환경요인(Ⅴ 식물과 에너지): `tools/lesson-kit/src/photosynthesis-factors/_pf.js`(PF: 그림 Ⅴ-3 곡선 F·rate, 비스듬히 본 스마트팜 온실 farm(상추 초록·붉은·시든 3종, LED등·난방관·입자 흐름, grow), 읽기용 곡선 one, 작은 곡선 mini, 밀폐 장치+손으로 그리는 그래프 실험실 lab). 상추 기호 `PF.lettuce`는 다른 Ⅴ 수업에 다시 쓸 수 있다.
- 배설(Ⅵ 동물과 에너지): `tools/lesson-kit/src/excretion/_ex.js`(EX: 네프론 nephron, 인공소변 urine). 기관계 지도는 `src/body-systems/_bs2.js`(BY.map). 생성 틀은 앞 수업 읽기·정리 페이지.
- 순환계(Ⅵ 동물과 에너지): `tools/lesson-kit/src/circulatory-system/_cr.js`(CR: 심장 단면 heart, 세 혈관 vessels, 물질 교환 exchange, 혈액 blood). 호흡 모형과 기체 교환은 `src/breathing/_br.js`(BR).
- 혈액 순환(Ⅵ 동물과 에너지): `tools/lesson-kit/src/blood-circulation/_bc3.js`(BC3.world: `CV3.heart` 무대에 온몸 혈관·폐를 얹은 3D, 혈관 가운데 길 routes, 적혈구 따라가기 goto, 모세혈관 확대 enterMicro(lung·body), 정맥 주사 startIV, 무릎 굽히기 setLeg·kneel), `_bc.js`(BC.eight: 그림 Ⅵ-11 형식 지도), 자료 만들기 `_circ_prep.py`(BodyParts3D 혈관·뼈 + HuBMAP CCF 폐, 16비트 묶음 body.bin), 영상 굽기 `_bake.py`. 호흡·배설 수업의 폐·온몸 장면에 다시 쓸 수 있다.
- 소화(Ⅵ 동물과 에너지): `tools/lesson-kit/src/digestion/_dg.js`(DG: 시험관 saliva, 소화계+영양소 돋보기 journey, 융털 villus, 주름 비교 fold).
- 영양소(Ⅵ 동물과 에너지): `tools/lesson-kit/src/nutrients/_nt.js`(NT: 24홈판+시험관 bench, 음식 그림 food·foodIn, 식판 tray).
- 광합성산물(Ⅴ 식물과 에너지): `tools/lesson-kit/src/photosynthate-use/_sg.js`(SG: 감자 식물 단면 plant(엽록체 돋보기·체관·설탕 운반), 작물 8가지 crop·cropIn, 네 칸 창고 shelf).
- 호흡(Ⅴ 식물과 에너지): `tools/lesson-kit/src/plant-respiration/_rs.js`(RS: 토마토 낮밤 tomato(뿌리 단면·기체·에너지 별), 호흡 입자 eq, 잎 순환 cycle, 밀폐 장치 낮밤 그래프 room, 겹잎 compound).
- 소리(Ⅲ-2 파동): `tools/lesson-kit/src/sound/_snd.js`(SND: 실제 악기 녹음 재생·소리 분석 화면 scope·기록용 shot, 녹음은 `lessons/sound/audio/`, 만드는 법 `_audio_prep.py`, 출처 `audio/LICENSE.txt` CC BY 3.0), `_inst.js`(ART: 악기 14가지 SVG 그림), `_pair.js`(PAIR: 두 소리 기록 칸), `_fig.js`(FIG.travel: 북→공기 입자→귀). 다음 소리 수업도 재사용한다.
- 별 그림: Ⅷ 단원은 캔버스로 빛 번짐 별을 그린다(`parallax` sim2의 `window.SKY`, `star-brightness`의 `_glow.js` `window.GLOW`). 실제 하늘 지도는 d3-celestial(BSD-3)을 `lessons/star-brightness/sky/`에 복사해 쓴다(별 목록은 `stars6.json`·`stars8.json`으로 줄임, 라이선스 `sky/LICENSE.txt`). 다음 Ⅷ 수업도 이 폴더를 재사용한다. 별의 밝기 차시까지는 별을 흰색으로 그리고, `star-color`부터는 `_color.js`의 `window.SC`로 색을 칠한다(별 목록 `sky/data/stars6c.json`에 색 정보 포함, 교과서 색 띠 별은 교과서 색).
- 소비 전력과 전력량(중3 Ⅵ): `tools/lesson-kit/src/power-energy/_pw.js`(PW: 헤어드라이어 dryer·선풍기 fan·전력 측정기 plugMeter, 헤어드라이어 표시 확대 plate, 우재·지우 전기 에너지 막대 race, 밝기가 같은 두 전등·열화상·1 J 알갱이 lamps, 거실·회전판 전력량계·멀티탭·대기전력 room, 시간-전력량 그래프와 기울기 계단·차근차근 단계 graph, 기구 8가지 그림과 에너지 띠 devmap·버튼 그림 thumb). 다음 전기 에너지 수업도 재사용한다.
- 시험 대비(중2 Ⅶ·Ⅷ): `tools/lesson-kit/src/exam-electric-space/_ex1.js`(EX: 원자, 털과 풍선, 매단 두 공, 금속 캔, 검전기, 전선 속 전자, 수로 모형, 전류계·전압계, 저항, 옴의 법칙 그래프, 직렬·병렬, 전기 기구 전환, 소비 전력, 전력량, LED등, 막대자석·코일과 나침반, 전기 그네, 오른손, 전동기), `_ex2.js`(시차, 연주 시차, 등급, 거리와 빛의 세기, 10 pc, 별의 색, 우리은하, 성단, 성운, 풍선, 대폭발, 인공위성, 탐사 성과). 모두 SVG이고 `{play, stop}`을 돌려줘요. `_3d.js`는 motor-force의 전기 그네·오른손·전동기와 star-brightness의 빛 세기 3D를 처음 볼 때 불러와요.
- 시험 대비(중3): `tools/lesson-kit/src/exam-energy/_qe.js`(QE: 고르기·O·X·있는 대로·서술형·숫자 바꾸는 계산 문제 엔진), `_bank.js`(문제 데이터), `_ex.js`(EX: 수평면 용수철저울, 화분 위치 에너지, 수레와 나무 도막, 낙하·던져 올리기 에너지 막대, 질량 다른 두 공, 롤러코스터). 틀은 `_exam.css`(가로 기본, 세로·휴대 전화 대응). 전자기·전력 그림은 `_emi.js`, `_pw.js` 사본을 씀.
