#!/usr/bin/env bash
# 웹툰 영상을 화면에 맞게 자르고 줄인다.
#
#   bash scripts/optimize-webtoon-videos.sh [대상폴더]
#
# 생성기(fal.ai)가 내놓는 영상은 1228x1684(3:4)에 5~7MB다. 두 가지가 문제다.
#
#  1) 비율 — 스테이지는 세로로 꽉 찬 9:16 에 가깝다. 3:4 영상을 object-cover 로 깔면
#     폰에서 가로 37% 가 잘려 나간다. 미리 9:16 으로 잘라 두면 잘릴 것이 없다.
#  2) 용량 — 폰 화면은 가로 390px 인데 1228px 을 보낸다. 3배 넘는 픽셀을 받느라
#     첫 장면이 늦게 뜨고, 그 지연이 "영상이 안 움직인다"처럼 느껴진다.
#
# 중앙 크롭을 쓴다. 생성 프롬프트가 인물과 달을 가운데 두게 쓰여 있어 중앙이 안전하다.
# 새 영상을 받으면 이 스크립트를 다시 돌린다.
set -euo pipefail

DIR="${1:-public/webtoon}"
WIDTH=720
HEIGHT=1280
# crf 26 은 이 그림체에서 눈에 띄는 손실 없이 1/15 로 줄어드는 지점이었다
CRF=26

command -v ffmpeg >/dev/null || { echo "ffmpeg 이 필요합니다"; exit 1; }

total_before=0
total_after=0

while IFS= read -r -d '' file; do
  before=$(stat -f%z "$file")
  size=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$file")
  if [ "$size" = "${WIDTH},${HEIGHT}" ]; then
    echo "건너뜀 (이미 변환됨): ${file#public/webtoon/}"
    continue
  fi

  tmp="${file}.tmp.mp4"
  # -nostdin 이 없으면 ffmpeg 이 find 의 파일 목록을 stdin 에서 먹어 치워
  # 다음 경로가 잘린 채로 넘어온다
  ffmpeg -nostdin -v error -i "$file" \
    -vf "crop='min(iw,ih*9/16)':ih,scale=${WIDTH}:${HEIGHT}:flags=lanczos" \
    -c:v libx264 -preset slow -crf "$CRF" -profile:v high -pix_fmt yuv420p \
    -movflags +faststart -an -y "$tmp"
  mv "$tmp" "$file"

  after=$(stat -f%z "$file")
  total_before=$((total_before + before))
  total_after=$((total_after + after))
  printf "%-34s %5sMB → %5sMB\n" "${file#public/webtoon/}" \
    "$((before / 1048576))" "$(echo "scale=1; $after/1048576" | bc)"
done < <(find "$DIR" -name "*.mp4" -print0)

if [ "$total_before" -gt 0 ]; then
  printf "\n합계 %sMB → %sMB (%s%%)\n" \
    "$((total_before / 1048576))" \
    "$(echo "scale=1; $total_after/1048576" | bc)" \
    "$((total_after * 100 / total_before))"
fi
