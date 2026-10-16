"""소리의 특성 수업: 악기 녹음 소리 만들기

실제 악기 녹음(공개 소리 묶음)을 내려받아 한 음씩 짧게(2.2초) 다듬고,
소리 크기를 고르게 맞춘 뒤 lessons/sound/audio/ 에 mp3로 저장한다.

  python tools/lesson-kit/src/sound/_audio_prep.py <내려받을_임시_폴더>

출처 (lessons/sound/audio/LICENSE.txt 에도 적음)
- tonejs-instruments (Nicholaus Brosowsky) 소리: CC-BY 3.0
  (원 녹음: VSCO 2 Community Edition, Freesound 12408 flcellogrl)
- 리코더·팀파니: FluidR3_GM (Frank Wen) — midi-js-soundfonts (Benjamin Gleitzman) 배포본, CC-BY 3.0
"""
import os, sys, subprocess, urllib.request, wave
import numpy as np
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
TJ = 'https://cdn.jsdelivr.net/gh/nbrosowsky/tonejs-instruments@master/samples/{inst}/{note}.mp3'
FL = 'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/{inst}-mp3/{note}.mp3'

# id: (주소 틀, 원본 이름, [음 이름(샵은 s)])
SETS = {
    'violin':     (TJ, 'violin',      ['C4', 'E4', 'G4', 'A4', 'C5']),
    'cello':      (TJ, 'cello',       ['C3', 'E3', 'G3', 'A3', 'C4', 'G4']),
    'contrabass': (TJ, 'contrabass',  ['C2', 'E2', 'Gs2', 'Cs3']),
    'harp':       (TJ, 'harp',        ['B3', 'D4', 'F4', 'A4', 'C5']),
    'flute':      (TJ, 'flute',       ['A4', 'C5', 'E5', 'A5', 'C6']),
    'clarinet':   (TJ, 'clarinet',    ['D4', 'F4', 'As4', 'D5']),
    'bassoon':    (TJ, 'bassoon',     ['C3', 'G3', 'A3', 'C4', 'G4']),
    'trumpet':    (TJ, 'trumpet',     ['C4', 'Ds4', 'F4', 'G4', 'As4', 'D5']),
    'horn':       (TJ, 'french-horn', ['D3', 'F3', 'A3', 'C4']),
    'trombone':   (TJ, 'trombone',    ['C3', 'Ds3', 'F3', 'Gs3', 'C4', 'F4']),
    'tuba':       (TJ, 'tuba',        ['As1', 'Ds2', 'F2', 'As2']),
    'xylophone':  (TJ, 'xylophone',   ['G4', 'C5', 'G5', 'C6']),
    'recorder':   (FL, 'recorder',    ['G4', 'C5', 'E5', 'G5', 'C6']),
    'timpani':    (FL, 'timpani',     ['C2', 'E2', 'G2', 'C3']),
}
SR = 44100
LEN = 2.2      # 초
FADE = 0.35    # 끝 부분 줄이기 (초)
TARGET = 0.30  # 가장 큰 50 ms 구간의 RMS를 이 값으로


def fl_name(n):  # FluidR3는 샵 대신 플랫 이름
    return n


def read_wav(p):
    with wave.open(p) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return a


def write_wav(p, a):
    b = (np.clip(a, -1, 1) * 32767).astype(np.int16)
    with wave.open(p, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(b.tobytes())


def main(tmp):
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
    out = os.path.join(root, 'lessons', 'sound', 'audio')
    os.makedirs(out, exist_ok=True); os.makedirs(tmp, exist_ok=True)
    total = 0
    for sid, (url, inst, notes) in SETS.items():
        for n in notes:
            src = os.path.join(tmp, f'{sid}-{n}.mp3')
            if not os.path.exists(src):
                urllib.request.urlretrieve(url.format(inst=inst, note=fl_name(n)), src)
            wv = os.path.join(tmp, f'{sid}-{n}.wav')
            subprocess.run([FF, '-y', '-loglevel', 'error', '-i', src, '-ac', '1', '-ar', str(SR), wv], check=True)
            a = read_wav(wv)
            # 앞의 조용한 부분 자르기
            thr = np.max(np.abs(a)) * 0.04
            i0 = int(np.argmax(np.abs(a) > thr))
            a = a[max(0, i0 - int(0.004 * SR)):]
            a = a[:int(LEN * SR)]
            if len(a) < int(LEN * SR):
                a = np.pad(a, (0, int(LEN * SR) - len(a)))
            # 크기 맞추기
            fr = int(0.05 * SR)
            rms = max(np.sqrt(np.mean(a[k:k + fr] ** 2)) for k in range(0, len(a) - fr, fr // 2))
            a = a * (TARGET / max(rms, 1e-6))
            pk = np.max(np.abs(a))
            if pk > 0.97:
                a = a * (0.97 / pk)
            # 시작 2 ms 부드럽게, 끝 줄이기
            a[:88] *= np.linspace(0, 1, 88)
            nf = int(FADE * SR)
            a[-nf:] *= np.linspace(1, 0, nf) ** 2
            tw = os.path.join(tmp, f'{sid}-{n}.out.wav')
            write_wav(tw, a)
            dst = os.path.join(out, f'{sid}-{n}.mp3')
            subprocess.run([FF, '-y', '-loglevel', 'error', '-i', tw, '-codec:a', 'libmp3lame', '-b:a', '80k', dst], check=True)
            total += os.path.getsize(dst)
            print(sid, n, os.path.getsize(dst))
    print('합계', total // 1024, 'KB')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '_audio_tmp')
