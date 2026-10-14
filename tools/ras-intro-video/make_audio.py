"""라스 소개 영상 소리 만들기 (배경 음악 + 효과음).

모든 소리를 이 코드로 직접 합성한다. 외부 음원을 쓰지 않으므로 공개 저장소에 올려도 된다.
실행: python -I make_audio.py  ->  assets/music/bed.wav, assets/sfx/*.wav
"""
import os
import wave

import numpy as np

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(20261014)


def save(path, x):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    peak = np.max(np.abs(x)) or 1.0
    x = x / peak * 0.89
    full = os.path.join(HERE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with wave.open(full, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def t_(dur):
    return np.arange(int(dur * SR)) / SR


def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def lp(x, fc, order=2):
    for _ in range(order):
        x = onepole_lp(x, fc)
    return x


def hp(x, fc):
    return x - lp(x, fc, 1)


def env_ad(n, a, d):
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na)
    tail = np.arange(n - na) / SR
    e[na:] = np.exp(-tail / d)
    return e


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ───────────── 배경 음악 ─────────────
def epiano(freq, dur, vel=1.0, decay=1.6):
    t = t_(dur)
    tone = (np.sin(2 * np.pi * freq * t)
            + 0.35 * np.sin(2 * np.pi * freq * 2.0 * t) * np.exp(-t / 0.4)
            + 0.12 * np.sin(2 * np.pi * freq * 3.0 * t) * np.exp(-t / 0.18)
            + 0.5 * np.sin(2 * np.pi * freq * 1.003 * t))
    return tone * env_ad(len(t), 0.006, decay) * vel


def pad(freqs, dur, vol=0.18):
    t = t_(dur)
    x = np.zeros_like(t)
    for f in freqs:
        for det in (0.997, 1.0, 1.004):
            x += np.sin(2 * np.pi * f * det * t + rng.uniform(0, 6.28))
    a = np.minimum(1, t / 1.6)
    r = np.minimum(1, (dur - t) / 1.8)
    return lp(x, 900) * a * np.clip(r, 0, 1) * vol / len(freqs)


def mix_at(buf, x, start):
    i = int(start * SR)
    j = min(len(buf), i + len(x))
    buf[i:j] += x[: j - i]


def music(total=52.5):
    L = int(total * SR)
    left = np.zeros(L)
    right = np.zeros(L)
    beat = 60 / 76  # 한 박

    # 화음 (MIDI) : 처음은 차분한 단조, 머릿속부터 밝아지고, 끝은 장조로 풀림
    chords = [
        (0.0, 6.2, [57, 60, 64, 67]),      # Am7  — 하굣길
        (6.2, 6.7, [53, 57, 60, 64]),      # Fmaj7 — 방, 눈
        (12.9, 7.5, [48, 55, 60, 64]),     # C — 읽기
        (20.4, 6.9, [47, 55, 59, 62]),     # G/B — 탐험
        (27.3, 8.6, [45, 52, 57, 60]),     # Am — 가상 실험
        (35.9, 6.55, [41, 48, 57, 60, 64]), # Fmaj7 — 정리
        (42.45, 3.2, [43, 50, 55, 59, 62]), # G — 밖으로
        (45.65, 6.3, [48, 55, 60, 62, 64]), # Cadd9 — 표어
    ]
    INTRO, OUTRO = 12.9, 45.65  # 머릿속에 들어가기 전, 표어
    for start, dur, notes in chords:
        p = pad([midi(n) for n in notes], dur + 1.2, vol=0.16 if start < INTRO else 0.12)
        mix_at(left, p, start)
        mix_at(right, p, start)
        # 아르페지오: 하굣길은 드문드문, 머릿속부터 8분음표
        step = beat if start < INTRO or start >= OUTRO else beat / 2
        k = 0
        tt = start
        order = [0, 2, 1, 3, 2, 4 if len(notes) > 4 else 3, 1, 3]
        while tt < start + dur - 0.05:
            n = notes[order[k % len(order)] % len(notes)] + 12
            vel = 0.55 if k % 2 == 0 else 0.4
            if start < INTRO:
                vel *= 0.8
            tone = epiano(midi(n), 2.6, vel)
            pan = 0.5 + 0.25 * np.sin(k * 1.3)
            mix_at(left, tone * (1 - pan) * 2 * 0.22, tt)
            mix_at(right, tone * pan * 2 * 0.22, tt)
            k += 1
            tt += step
        # 베이스
        b = epiano(midi(notes[0] - 12), dur, 0.7, decay=2.5)
        mix_at(left, b * 0.3, start)
        mix_at(right, b * 0.3, start)

    # 마지막 종소리 같은 높은 음
    for i, n in enumerate([76, 79, 84]):
        tone = epiano(midi(n), 4.0, 0.35, decay=2.2)
        mix_at(left, tone * 0.25, OUTRO + 1.1 + i * 0.18)
        mix_at(right, tone * 0.25, OUTRO + 1.1 + i * 0.18)

    # 울림(간단한 지연 반사)
    def echo(x, d, g):
        y = x.copy()
        n = int(d * SR)
        y[n:] += x[:-n] * g
        return y
    left = echo(echo(left, 0.29, 0.28), 0.53, 0.18)
    right = echo(echo(right, 0.37, 0.28), 0.61, 0.18)
    st = np.stack([left, right], axis=1)
    # 끝 페이드
    fade = np.ones(L)
    fade[-int(2.0 * SR):] = np.linspace(1, 0, int(2.0 * SR))
    st *= fade[:, None]
    save("assets/music/bed.wav", st)


# ───────────── 효과음 ─────────────
def noise(dur):
    return rng.standard_normal(int(dur * SR))


def sfx():
    # 거리 소리: 낮은 웅웅 + 먼 바람
    n = noise(6.5)
    amb = lp(n, 350, 2) * 0.8 + hp(lp(noise(6.5), 2500, 1), 800) * 0.05
    t = t_(6.5)
    amb *= np.minimum(1, t / 0.8) * np.clip((6.5 - t) / 1.0, 0, 1)
    save("assets/sfx/street.wav", amb)

    # 낱말이 흐려지며 사라지는 소리 (부드러운 숨)
    t = t_(0.9)
    s = hp(lp(noise(0.9), 3000, 2), 600) * np.sin(np.pi * t / 0.9) ** 2
    save("assets/sfx/fade.wav", s)

    # 화면 두드림: 짧은 딸깍
    t = t_(0.12)
    c = (np.sin(2 * np.pi * 1800 * t) * np.exp(-t / 0.012) * 0.6
         + hp(noise(0.12), 2000) * np.exp(-t / 0.006) * 0.5)
    save("assets/sfx/tap.wav", c)

    # 말풍선이 열릴 때: 짧게 올라가는 퐁
    t = t_(0.25)
    f = 520 + 380 * (t / 0.25)
    p = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(len(t), 0.005, 0.07)
    save("assets/sfx/pop.wav", p)

    # 조각이 제자리에 맞을 때: 탁 + 맑은 음
    t = t_(0.5)
    sn = (np.sin(2 * np.pi * 1320 * t) * env_ad(len(t), 0.002, 0.12) * 0.5
          + np.sin(2 * np.pi * 1980 * t) * env_ad(len(t), 0.002, 0.07) * 0.25
          + hp(noise(0.5), 1500) * np.exp(-t / 0.004) * 0.6)
    save("assets/sfx/snap.wav", sn)

    # 정답: 두 음이 올라가는 작은 종
    t = t_(0.8)
    a = np.sin(2 * np.pi * midi(84) * t) * env_ad(len(t), 0.003, 0.25)
    b = np.zeros_like(t)
    k = int(0.11 * SR)
    b[k:] = np.sin(2 * np.pi * midi(88) * t[: len(t) - k]) * env_ad(len(t) - k, 0.003, 0.3)
    save("assets/sfx/correct.wav", (a + b) * 0.5)

    # 바늘이 돌아가는 소리: 짧은 휙
    t = t_(0.45)
    sw = hp(lp(noise(0.45), 4000, 2), 1200) * np.sin(np.pi * t / 0.45) ** 3
    save("assets/sfx/swish.wav", sw)

    # 전류가 흐르는 낮은 웅
    t = t_(2.6)
    h = (np.sin(2 * np.pi * 60 * t) + 0.5 * np.sin(2 * np.pi * 120 * t) + 0.2 * np.sin(2 * np.pi * 180 * t))
    h *= np.minimum(1, t / 0.15) * np.clip((2.6 - t) / 0.6, 0, 1)
    save("assets/sfx/hum.wav", h * 0.4)

    # 튀어나올 때: 낮은 쪽에서 올라오는 바람
    t = t_(0.7)
    wn = noise(0.7)
    w = lp(wn, 1800, 2) * (t / 0.7) ** 2 * np.clip((0.7 - t) / 0.12, 0, 1)
    save("assets/sfx/rise.wav", w)

    # 연필 사각사각
    t = t_(2.2)
    strokes = np.zeros_like(t)
    for i in range(14):
        s0 = 0.05 + i * 0.15 + rng.uniform(-0.02, 0.02)
        seg = (t >= s0) & (t < s0 + 0.11)
        strokes[seg] = np.sin(np.pi * (t[seg] - s0) / 0.11)
    pen = hp(lp(noise(2.2), 6000, 1), 2500) * strokes
    save("assets/sfx/pencil.wav", pen * 0.6)

    # 머릿속 밖으로 나올 때: 거꾸로 빨려 나오는 바람
    t = t_(0.8)
    r = lp(noise(0.8), 2200, 2) * np.exp(-((t - 0.25) ** 2) / 0.02)
    save("assets/sfx/whoosh-out.wav", r)

    # 얼굴로 다가갈 때 / 눈동자 속으로 들어갈 때: 점점 커지는 바람
    for name, dur, fc in (("whoosh-face", 0.5, 900), ("whoosh-in", 0.75, 2600)):
        t = t_(dur)
        w = hp(lp(noise(dur), fc, 2), 200) * (t / dur) ** 2.2 * np.clip((dur - t) / 0.12, 0, 1)
        save(f"assets/sfx/{name}.wav", w)

    # 머릿속에 닿을 때: 낮고 둥근 울림
    t = t_(1.2)
    d = (np.sin(2 * np.pi * 110 * t) + np.sin(2 * np.pi * 165 * t)) * env_ad(len(t), 0.02, 0.45)
    save("assets/sfx/drop-mind.wav", d * 0.5)

    # 로고가 맞춰질 때: 네 번 톡
    t = t_(0.18)
    tk = np.sin(2 * np.pi * 980 * t) * env_ad(len(t), 0.002, 0.03)
    save("assets/sfx/tick.wav", tk)


if __name__ == "__main__":
    music()
    sfx()
    print("ok")

