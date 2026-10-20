#!/usr/bin/env bash
# 라스 홍보 영상: 네 화면 동영상 만들기
# 원본: assets/clips/*.mp4 (claude/ras-intro-video 의 record_pages.cjs 로 coil-field 수업을 녹화한 것)
# 각 칸 영상은 12.2초(전체 영상 2.2초~14.4초에 보임). 자기 차례(크게 보이는 2.2초) 동안만 움직이고 나머지는 멈춘 장면.
# 실행: bash make_clips.sh  ->  assets/tiles/t1.mp4 ~ t4.mp4
set -e
cd "$(dirname "$0")/assets"
mkdir -p tiles
LEN=12.2
# 이름  원본  시작  끝  배속  앞쪽멈춤(초)
make() {
  ffmpeg -v error -y -i "clips/$2.mp4" -an -vf "trim=start=$3:end=$4,setpts=(PTS-STARTPTS)/$5,fps=30,tpad=start_mode=clone:start_duration=$6:stop_mode=clone:stop_duration=30,trim=duration=$LEN,setpts=PTS-STARTPTS,format=yuv420p" \
    -c:v libx264 -crf 17 -preset slow -movflags +faststart "tiles/$1.mp4"
}
make t1 reading 0.5 5.5 2 2.0     # 낱말 눌러 뜻 보기 → 퀴즈 O 고르기
make t2 explore 1.0 6.0 2 3.6     # 스위치 켜기 → 자기장 모습 → 나침반 가득
make t3 lab 13.0 21.5 3.5 6.5     # 나침반 바늘 방향 기록이 쌓임
make t4 summary 0.5 6.5 3 8.7     # 낱말 카드로 빈칸 채우기
ls -la tiles
