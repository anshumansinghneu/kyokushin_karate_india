#!/usr/bin/env bash
# Turns raw assets in media-src/ into web-ready files in frontend/public/media/.
#
#   bash scripts/prepare-media.sh                  process whatever is in media-src/
#   bash scripts/prepare-media.sh --placeholders   also generate test footage for anything missing
#   TRIM=0.94 bash scripts/prepare-media.sh        crop 6% off every edge first (e.g. a corner watermark)
#
# Real files always win over placeholders (*.placeholder.*), so drop real assets in and rerun.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="media-src"
OUT="frontend/public/media"   # this repo keeps the Next.js app in frontend/
FILMS=(karateka kumite osu eyes)
LOOPS=(arena)
STILLS=(mountain belts hands-white hands-black statue weapon-fist weapon-shin weapon-eyes weapon-knot)
TRIM="${TRIM:-1}"
NORM="crop=iw*${TRIM}:ih*${TRIM},scale=1920:1080:flags=lanczos"

command -v ffmpeg >/dev/null || { echo "ffmpeg not found (macOS: brew install ffmpeg)"; exit 1; }
mkdir -p "$SRC/video" "$SRC/stills" "$OUT/seq" "$OUT/loops" "$OUT/stills"

# WebP frames when this ffmpeg has libwebp, JPEG otherwise. The manifest records which.
encoders="$(ffmpeg -hide_banner -encoders 2>/dev/null || true)"
if [[ "$encoders" == *libwebp* ]]; then
  EXT="webp"; ENC_D=(-c:v libwebp -quality 70); ENC_M=(-c:v libwebp -quality 65)
else
  echo "note: this ffmpeg has no libwebp, writing JPEG frames instead"
  EXT="jpg"; ENC_D=(-q:v 4); ENC_M=(-q:v 5)
fi

video_for() { # real file first, then placeholder
  local f
  for f in "$SRC/video/$1.mp4" "$SRC/video/$1.mov" "$SRC/video/$1.placeholder.mp4"; do
    [[ -f "$f" ]] && { echo "$f"; return 0; }
  done
  return 0
}

still_for() { # real file first, then placeholder
  local f
  for f in "$SRC/stills/$1".{png,jpg,jpeg,webp} "$SRC/stills/$1.placeholder.jpg"; do
    [[ -f "$f" ]] && { echo "$f"; return 0; }
  done
  return 0
}

# Placeholders: test footage for anything missing, so the build can start before real assets exist
if [[ "${1:-}" == "--placeholders" ]]; then
  for f in "${FILMS[@]}" "${LOOPS[@]}"; do
    [[ -n "$(video_for "$f")" ]] && continue
    ffmpeg -loglevel error -y -f lavfi -i "testsrc=size=1920x1080:rate=24" -t 8 \
      -c:v libx264 -pix_fmt yuv420p "$SRC/video/$f.placeholder.mp4"
    echo "placeholder video: $f"
  done
  for s in "${STILLS[@]}"; do
    [[ -n "$(still_for "$s")" ]] && continue
    case "$s" in hands-*) size="1920x1080" ;; *) size="1200x1600" ;; esac
    ffmpeg -loglevel error -y -f lavfi -i "testsrc=size=$size:rate=1" -frames:v 1 \
      "$SRC/stills/$s.placeholder.jpg"
    echo "placeholder still: $s"
  done
fi

# Scroll films -> image sequences
for f in "${FILMS[@]}"; do
  in="$(video_for "$f")"
  [[ -n "$in" ]] || { echo "skip film $f (nothing in $SRC/video)"; continue; }
  rm -rf "${OUT:?}/seq/$f"
  mkdir -p "$OUT/seq/$f/d" "$OUT/seq/$f/m"
  # desktop: every frame, 1600 px wide
  ffmpeg -loglevel error -y -i "$in" -vf "$NORM,fps=24,scale=1600:-2" \
    "${ENC_D[@]}" "$OUT/seq/$f/d/%04d.$EXT"
  # mobile: every 2nd frame, center 1080x1080 crop (starts at source x = 420)
  ffmpeg -loglevel error -y -i "$in" -vf "$NORM,fps=12,crop=1080:1080" \
    "${ENC_M[@]}" "$OUT/seq/$f/m/%04d.$EXT"
  echo "film $f from $(basename "$in"): $(ls "$OUT/seq/$f/d" | wc -l | tr -d ' ') desktop, $(ls "$OUT/seq/$f/m" | wc -l | tr -d ' ') mobile frames"
done

# Ambient loops -> seamless muted mp4 (forward, then reversed)
for f in "${LOOPS[@]}"; do
  in="$(video_for "$f")"
  [[ -n "$in" ]] || { echo "skip loop $f (nothing in $SRC/video)"; continue; }
  ffmpeg -loglevel error -y -i "$in" \
    -filter_complex "[0:v]$NORM,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0[v]" \
    -map "[v]" -an -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart \
    "$OUT/loops/$f.mp4"
  echo "loop $f from $(basename "$in"): done"
done

# Stills -> jpg
for s in "${STILLS[@]}"; do
  in="$(still_for "$s")"
  [[ -n "$in" ]] || { echo "skip still $s (nothing in $SRC/stills)"; continue; }
  ffmpeg -loglevel error -y -i "$in" -q:v 2 "$OUT/stills/$s.jpg"
  echo "still $s from $(basename "$in"): done"
done

# Manifest: frame format and counts, read by the site at runtime
{
  printf '{\n  "ext": "%s",\n  "src": [1920, 1080],\n  "mCropX": 420,\n  "films": {\n' "$EXT"
  sep=""
  for f in "${FILMS[@]}"; do
    [[ -d "$OUT/seq/$f/d" ]] || continue
    d="$(ls "$OUT/seq/$f/d" | wc -l | tr -d ' ')"
    m="$(ls "$OUT/seq/$f/m" | wc -l | tr -d ' ')"
    printf '%s    "%s": { "d": %s, "m": %s }' "$sep" "$f" "$d" "$m"
    sep=$',\n'
  done
  printf '\n  }\n}\n'
} > "$OUT/manifest.json"
echo "wrote $OUT/manifest.json"
