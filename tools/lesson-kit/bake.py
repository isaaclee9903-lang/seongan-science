# 3D 그림을 미리 찍어 두기: 카드 사진(PNG), 3D 준비 중에 보여 줄 사진(JPG), 보기만 하는 그림의 영상(MP4)
# 사용: python tools/lesson-kit/bake.py <수업이름> [이름 일부(그것만 다시 만들기)]
# 준비: 저장소를 로컬 서버로 연다(python -m http.server 8770 --directory <저장소>). Playwright + Chrome, pip install imageio-ffmpeg
# 목록: src/<수업>/bake.json
#   {"type": "thumbs", "page": "reading.html?bake=none", "ids": [...], "size": 320}      → media/th-<id>.png (ROCK3D.thumbs)
#   {"type": "poster", "page": "reading.html?bake=heroHost", "host": "#heroHost", "out": "media/p-hero.jpg"}
#   {"type": "video",  "page": "reading.html?bake=sedHost", "host": "#sedHost", "out": "media/v-sed", "seconds": 12}
# 페이지는 ?bake=<그림 id> 이면 그 그림만 3D로 그리고(C3.BAKE), 영상은 sway가 seconds초에 한 바퀴 돌아 끊김 없이 이어져요.
import asyncio, base64, json, pathlib, shutil, subprocess, sys, tempfile
from playwright.async_api import async_playwright
from PIL import Image

KIT = pathlib.Path(__file__).resolve().parent
REPO = KIT.parent.parent
BASE = "http://localhost:8770/"

def ffmpeg():
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()

async def ready(pg, host):
    await pg.wait_for_function(f"(()=>{{const h=document.querySelector('{host}');return h&&h.classList.contains('ready')&&h.querySelector('canvas')}})()", timeout=180000)
    await pg.wait_for_timeout(2500)

async def job(br, out_dir, cfg, j):
    pg = await br.new_page(viewport={"width": 1280, "height": 800}, device_scale_factor=j.get("scale", 1.5), reduced_motion="no-preference")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    url = BASE + cfg["out"] + "/" + j["page"]
    if j["type"] == "video": url += ("&" if "?" in url else "?") + "loop=" + str(j.get("seconds", 12))
    await pg.goto(url, wait_until="networkidle")
    if j["type"] == "thumbs":
        await pg.wait_for_function("!!window.ROCK3D", timeout=60000)
        th = await pg.evaluate(f"(()=>ROCK3D.thumbs({json.dumps(j['ids'])}, {j.get('size', 320)}))()")
        for k, v in th.items():
            (out_dir / f"th-{k}.png").write_bytes(base64.b64decode(v.split(",", 1)[1]))
        print("thumbs", len(th))
    else:
        host = j["host"]
        await pg.evaluate(f"(()=>{{const h=document.querySelector('{host}');h.scrollIntoView({{block:'center'}});h.parentElement.querySelectorAll('.hint').forEach(e=>e.style.visibility='hidden')}})()")
        await ready(pg, host)
        loc = pg.locator(host).first
        if j["type"] == "poster":
            p = REPO / cfg["out"] / j["out"]; await loc.screenshot(path=str(p.with_suffix(".png")))
            Image.open(p.with_suffix(".png")).convert("RGB").save(p, quality=84); p.with_suffix(".png").unlink()
            print("poster", j["out"])
        else:
            fps, secs = j.get("fps", 24), j.get("seconds", 12)
            tmp = pathlib.Path(tempfile.mkdtemp())
            # 장면마다 시간(window.__bakeT)을 정해 두고 몇 번 그린 뒤 찍어요 → 찍는 데 걸린 시간과 상관없이 고르게 움직여요
            for i in range(fps * secs):
                await pg.evaluate(f"new Promise(r=>{{window.__bakeT={i / fps};requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r)))}})")
                await loc.screenshot(path=str(tmp / f"f{i:04d}.png"))
            outp = REPO / cfg["out"] / (j["out"] + ".mp4")
            subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-framerate", str(fps), "-i", str(tmp / "f%04d.png"), "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
                            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", str(j.get("crf", 27)), "-preset", "slow", "-movflags", "+faststart", str(outp)], check=True)
            Image.open(tmp / "f0000.png").convert("RGB").save(REPO / cfg["out"] / (j["out"] + ".jpg"), quality=82)
            shutil.rmtree(tmp)
            print("video", j["out"], f"{outp.stat().st_size // 1024} KB")
    for e in errs: print("  오류:", e)
    await pg.close()

async def main(name, only):
    cfg = json.loads((KIT / "src" / name / "lesson.json").read_text(encoding="utf-8"))
    jobs = json.loads((KIT / "src" / name / "bake.json").read_text(encoding="utf-8"))
    out_dir = REPO / cfg["out"] / "media"; out_dir.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(channel="chrome", args=["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"])
        for j in jobs:
            if only and only not in json.dumps(j): continue
            await job(br, out_dir, cfg, j)
        await br.close()

if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit("사용: python tools/lesson-kit/bake.py <수업이름> [이름 일부]")
    asyncio.run(main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else ""))
