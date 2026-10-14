// 라스 실제 페이지를 자동으로 눌러 가며 녹화한다 (영상 속 수업 화면용).
// 준비: 저장소 루트에서 python -m http.server 8765 --bind 127.0.0.1
// 실행: node record_pages.cjs <puppeteer-core가 설치된 폴더> [clip 이름...]
// 결과: assets/clips/<이름>.webm  (누른 자리에 파란 원이 잠깐 나타남)
const path = require("path");
const puppeteer = require(path.join(process.argv[2], "node_modules", "puppeteer-core"));
const BASE = "http://127.0.0.1:8765/";
const OUT = path.join(__dirname, "assets", "clips");
const only = process.argv.slice(3);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 누른 자리 표시 (휴대폰 화면 녹화의 터치 표시처럼)
const TOUCH_CSS = `
.__t{position:fixed;z-index:99999;pointer-events:none;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;
  background:rgba(14,99,179,.22);border:2px solid rgba(14,99,179,.85);transform:scale(.6);opacity:0;
  transition:transform .18s cubic-bezier(.2,.8,.2,1),opacity .18s}
.__t.on{transform:scale(1);opacity:1}
.__t.off{transform:scale(1.5);opacity:0;transition:transform .45s ease-out,opacity .45s ease-out}`;

async function tapAt(page, x, y) {
  await page.evaluate((x, y) => {
    const d = document.createElement("i"); d.className = "__t"; d.style.left = x + "px"; d.style.top = y + "px";
    document.body.appendChild(d); requestAnimationFrame(() => d.classList.add("on"));
    setTimeout(() => d.classList.add("off"), 260); setTimeout(() => d.remove(), 900);
  }, x, y);
  await wait(140);
  await page.mouse.click(x, y);
}
async function tap(page, sel, idx = 0) {
  const el = (await page.$$(sel))[idx];
  if (!el) throw new Error("없음: " + sel);
  const b = await el.boundingBox();
  await tapAt(page, b.x + b.width / 2, b.y + b.height / 2);
}
async function scrollTo(page, sel, offset = 120) {
  await page.evaluate((sel, offset) => {
    const el = document.querySelector(sel); const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: "instant" });
  }, sel, offset);
}

const CLIPS = {
  // 허브: 전기와 자기 → 코일 수업 카드 누르기
  async hub(page) {
    await page.goto(BASE + "index.html", { waitUntil: "networkidle0" });
    await page.evaluate(() => { const b = [...document.querySelectorAll("button, a")].find((x) => /전기와 자기/.test(x.textContent)); b && b.click(); });
    await wait(600);
    const card = await page.$('a[href*="coil-field"]');
    await page.evaluate((el) => el.scrollIntoView({ block: "center" }), card);
    await wait(400);
    return async () => {
      await wait(900);
      const b = await card.boundingBox();
      await tapAt(page, b.x + b.width / 2, b.y + b.height / 2 - 20);
      await wait(1500);
    };
  },
  // 1. 읽기·퀴즈: '자기장' 낱말 누르기 → 퀴즈 ① 첫 문제 O
  async reading(page) {
    await page.goto(BASE + "lessons/coil-field/reading.html", { waitUntil: "networkidle0" });
    await scrollTo(page, "#r1 h2", 250);
    await wait(500);
    return async () => {
      await wait(700);
      await tap(page, '#r1 .term[data-term="자기장"]');
      await wait(1800);
      await scrollTo(page, "#q1", 90);
      await wait(900);
      await tap(page, "#q1 .oxb.o");
      await wait(1900);
    };
  },
  // 2. 모형·시뮬레이션: 코일 → 스위치 닫기 → 자기장 모습 → 나침반 가득 → 전류 방향 바꾸기
  async explore(page) {
    await page.goto(BASE + "lessons/coil-field/sim1-field-explorer.html", { waitUntil: "networkidle0" });
    await wait(400);
    return async () => {
      await wait(500);
      await tap(page, "#mCoil"); await wait(900);
      await tap(page, "#sw"); await wait(1300);
      await tap(page, "#tLines"); await wait(900);
      await tap(page, "#tGrid"); await wait(1500);
      await tap(page, "#rev"); await wait(2200);
    };
  },
  // 3. 가상 실험: 회로 연결 → 나침반 놓기 → 전원 → 스위치 → 기록지 나침반 그리기
  async lab(page) {
    await page.goto(BASE + "lessons/coil-field/sim2-coil-lab.html", { waitUntil: "networkidle0" });
    await wait(400);
    // 앞 준비(장갑·회로·나침반·전원)는 녹화 전에 해 둔다
    await page.evaluate(() => { const c = document.querySelector('input[type="checkbox"]'); if (c && !c.checked) c.click(); });
    await page.click("#bWire"); await wait(900);
    await page.click("#bComp"); await wait(1200);
    await page.evaluate(() => { const b = document.querySelector('.nextp[data-to="2"]') || document.querySelector('.stp[data-s="2"]'); b && b.click(); });
    await wait(700);
    await page.evaluate(() => document.querySelector("#bPow").click()); await wait(600);
    return async () => {
      await wait(500);
      await tap(page, "#bSw"); await wait(1500);
      await page.evaluate(() => document.querySelector("#rec1").scrollIntoView({ block: "center" }));
      await wait(500);
      // 각 나침반을 실제 방향(45° 단위)이 될 때까지 누른다
      const need = await page.evaluate(() => {
        const C = window.CL;
        return C.RING.map(([x, y]) => { const [bx, by] = C.vecAt(x, y, 3, false); const a = (Math.atan2(bx, -by) * 180) / Math.PI; return (Math.round(a / 45) + 8) % 8; });
      });
      const dials = await page.$$("#rec1 .dial");
      for (let i = 0; i < dials.length; i++) {
        const b = await dials[i].boundingBox();
        for (let k = 0; k <= need[i]; k++) { await tapAt(page, b.x + b.width / 2, b.y + b.height / 2); await wait(70); }
        await wait(120);
      }
      await wait(400);
      await tap(page, "#bChk1"); await wait(2000);
    };
  },
  // 4. 정리·글쓰기: 정리표 빈칸 채우기 → 글쓰기
  async summary(page) {
    await page.goto(BASE + "lessons/coil-field/summary-writing.html", { waitUntil: "networkidle0" });
    await page.click('.tab[data-s="2"]'); await wait(500);
    await scrollTo(page, "#tbody", 160);
    await wait(400);
    return async () => {
      await wait(500);
      const order = ["자기력이 미치는 공간", "나침반 바늘의 N극이 가리키는 방향", "막대자석 주위와 비슷한 모습의 자기장이 생긴다", "자기장의 방향이 반대로 바뀐다"];
      const rows = [1, 2, 3, 4];
      for (let j = 0; j < order.length; j++) {
        await tap(page, "#tbody .cell", rows[j]); await wait(350);
        const idx = await page.evaluate((w) => [...document.querySelectorAll("#bank2 .chip")].findIndex((c) => c.textContent === w), order[j]);
        await tap(page, "#bank2 .chip", idx); await wait(450);
      }
      await wait(600);
      await page.click('.tab[data-s="4"]'); await wait(500);
      await scrollTo(page, "#txt", 220); await wait(400);
      await tap(page, "#txt"); await wait(200);
      await page.keyboard.type("코일에 전류가 흐르면 주위에 자기장이 생겨서 나침반 바늘이 돌아가요.", { delay: 55 });
      await wait(1500);
    };
  },
};

(async () => {
  const fs = require("fs");
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--hide-scrollbars"] });
  for (const [name, setup] of Object.entries(CLIPS)) {
    if (only.length && !only.includes(name)) continue;
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    const run = await setup(page);
    await page.addStyleTag({ content: TOUCH_CSS });
    const rec = await page.screencast({ path: path.join(OUT, name + ".webm") });
    await run();
    await rec.stop();
    await page.close();
    console.log("ok", name);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

