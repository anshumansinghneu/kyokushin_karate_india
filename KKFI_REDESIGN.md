# KKFI homepage redesign: the scroll film

One brief for the whole job: the asset prompts (for Anshuman), the media pipeline, and the build spec (for Claude Code).

## How to use this file

**Anshuman**

1. Save this file as `KKFI_REDESIGN.md` in the root of the kyokushinfoundation.com repo.
2. Generate the assets in Part 2 and save them into `media-src/` with the exact filenames given. They don't have to be finished before Claude starts: the media script can generate placeholder footage, so the build can begin now and the real assets drop in later.
3. Open Claude in VS Code and send:

```
Read KKFI_REDESIGN.md in the repo root from start to finish. Part 2 is mine (asset generation); you implement Parts 3–6. Work on a new branch called redesign/scroll-film. Start with Phase 0 in Part 5 and stop after every phase so I can review.
```

**Claude**

- Part 1: context. Read first.
- Part 2: asset production. Done by hand in Google's tools; read it for filenames, specs and shot contents only.
- Part 3: media pipeline. Create and run the script.
- Part 4: build spec.
- Part 5: phases, with a stop after each.
- Part 6: acceptance checklist.

---

## Part 1: Context

**What we're building.** The homepage of kyokushinfoundation.com (Kyokushin Karate Foundation of India, KKFI, a Next.js site) becomes a dark, cinematic, scroll-driven page built on the technique of Scrolltide's "Katana" template: continuous film shots whose playback is driven by the scrollbar instead of a timeline, with thin hairline callouts pinned to coordinates inside the film frame so they stay on the subject at any viewport crop. Katana uses a lone samurai and then a duel. This page uses a lone karateka, then a kumite exchange, then the osu bow.

**What must keep working.** Every other route (find-a-dojo, events, calendar, gallery, belt-system, what-is-kyokushin, team-india, store, verify, login, register, syllabus, contact, privacy, terms), the nav, auth, the footer, all SEO metadata, and every piece of data the homepage loads today (events, testimonials, gallery images). Only the homepage changes.

**Current homepage content, all of which carries over.** Read the existing homepage code for the exact text and data sources; this list is a map, not the source of truth.

- Hero: 極真, "Forge your spirit.", the subline "Full-contact karate in the lineage of Sosai Mas Oyama. Discipline, respect, and the relentless pursuit of strength, taught in dojos across India.", and the CTAs "Join the dojo" (/register) and "Find a dojo near you" (/find-a-dojo).
- Three ways in: Learn the Way (/what-is-kyokushin), Earn the Belt (/belt-system), Find your Dojo (/find-a-dojo).
- The Oyama quote with /history/oyama.jpg.
- "Keep your head low, eyes high." and "Full contact. Full respect."
- Events: "The next dates are being set.", with links to /calendar and /events.
- Lineage: "One lineage, from the Honbu dojo to India.", with Daihyo Ryuko Take and Shihan Vasant K. Singh.
- Testimonials: "From the dojo floor".
- Gallery: "On the mats." (/gallery-thumbs/ring-01.jpg to ring-16.jpg).
- Final CTA: "Every black belt began as a white belt.", "Become a member" (/register), "See the belt path" (/belt-system).

---

## Part 2: Asset production (Anshuman)

> Claude: this part happens by hand in Google's tools (Veo for video, Nano Banana or Imagen for stills). Read it for filenames, specs and what each shot contains. Don't generate anything.

### 2.1 Rules for every video

These matter more than the prompts.

- **One continuous take, no cuts.** Scrubbing exposes every cut, so reject any take where Veo jumps to a new angle.
- **Slow, perfectly smooth camera and slow-motion action.** The scroll is the playhead, so shaky or fast footage turns into a choppy slideshow.
- **Key action near the center.** A phone held upright sees only about the middle third of a 16:9 frame. The build pans the crop to follow the action, but it can't show what isn't in the frame.
- **No text, kanji, logos or patches in the footage.** AI garbles kanji almost every time; 極真 is set on top in real type.
- **Backgrounds that fall off to pure black.** The page background is pure black, so the film edges disappear into it.
- **16:9 at the highest resolution offered (1080p).** Eight seconds is enough, because scroll length sets the pace, not clip length. Audio gets stripped.

### 2.2 Workflow

1. Make the stills first (character refs and start frames). Iterating on stills is fast and cheap.
2. Animate in Veo with the start frame as the first frame, and add the character refs as reference images if your Veo version supports them.
3. Do 3–4 takes per shot. Keep the one with no cuts, no morphing and clean hands.
4. Set the aspect ratio in the tool as well as in the prompt; the text alone isn't always obeyed.
5. Download the highest resolution available. If downloads carry a visible watermark, run the media script with `TRIM=0.94` (Part 3).

Paste this into the negative prompt field whenever the tool has one:

```
cut, scene change, transition, text, letters, subtitles, watermark, logo, kanji, embroidery, patch, gloves, pads, headgear, blood, injury, camera shake, handheld, zoom, extra fingers, distorted hands, morphing, cartoon, CGI
```

Every prompt below is complete, with the style built in. Copy it as is and save the result under the path shown.

### 2.3 Character references

**`media-src/refs/fighter-a.png`**: the lone karateka, and the kicker in the kumite. Image model, 3:4.

```
Photorealistic full-body character reference photo, three-quarter view, standing relaxed with arms at his sides against a plain dark charcoal studio backdrop, soft even light. An Indian man in his late 20s with a lean, athletic, muscular build, short neat black hair, light stubble and calm, focused eyes. He wears a heavy, plain white canvas Kyokushin karate gi (jacket sleeves cut just below the elbow, trousers ending at mid-shin, no markings of any kind) and a worn, faded black belt tied in a flat square knot with even ends. Barefoot. High detail on face, hands and fabric texture. 3:4 portrait.
```

**`media-src/refs/fighter-b.png`**: his opponent. Image model, 3:4.

```
Photorealistic full-body character reference photo, three-quarter view, standing relaxed with arms at his sides against a plain dark charcoal studio backdrop, soft even light. An Indian man in his early 30s with a stocky, powerful build, broad shoulders, thick forearms, short black hair with a faded undercut, a short trimmed full beard and a stern expression. He wears the same plain white Kyokushin gi (sleeves just below the elbow, no markings) with a worn brown belt in a flat square knot. Barefoot. High detail on face, hands and fabric texture. 3:4 portrait.
```

### 2.4 Scroll films (these get scrubbed)

**`media-src/frames/karateka-start.png`**: start frame for chapter one. Image model, 16:9, with fighter-a.png as the reference.

```
16:9 cinematic frame. The man from the reference image stands alone at the exact center of a dark, minimalist Japanese wooden dojo before dawn, in a Kyokushin fighting stance: fists closed and raised to chin height, elbows tucked, chin lowered, eyes looking up from under his brow. Full body in frame with generous dark space around him, camera at chest height. Polished dark wooden floor with a faint reflection, wooden walls dissolving into black. A single narrow shaft of cold blue-white dawn light falls diagonally from a high window across his face, fists and chest, with dust motes hanging in the beam.

Style: photorealistic and cinematic, shot on ARRI Alexa with anamorphic lenses. Low-key chiaroscuro lighting, deep blacks falling off to pure black at the frame edges, steady exposure, soft atmospheric haze, fine dust drifting in the light. Muted, nearly monochrome palette of near-black, bone white and natural skin tones. Subtle 35mm film grain, realistic anatomy and hands, sharp focus on the subject, clean frame with no on-screen text.
```

**`media-src/video/karateka.mp4`**: chapter one, the hero. Veo, 16:9, 8 s, starting from karateka-start.png. The six still seconds carry the callouts; the punch is the payoff.

```
One continuous 8-second shot, no cuts, starting from the provided frame. A lone Kyokushin karateka (Indian man, late 20s, lean and muscular, short black hair, light stubble, plain white gi with sleeves cut just below the elbow, worn black belt, barefoot) holds a fighting stance at the center of a dark wooden dojo before dawn: fists at chin height, chin down, eyes up. A narrow shaft of cold dawn light from a high window falls across his face and fists while dust motes drift slowly through the beam. The camera glides on a perfectly smooth dolly at chest height in one slow 90-degree arc around him, from his front-left to his front-right, gently pushing in from full body to a waist-up shot and keeping him centered throughout. For the first six seconds he stays almost completely still, breathing slowly and deeply, his chest rising and falling. In the final two seconds he throws one straight right punch in high-speed slow motion, the sleeve snapping taut, and freezes at full extension.

Style: photorealistic and cinematic, shot on ARRI Alexa with anamorphic lenses. Low-key chiaroscuro lighting, deep blacks falling off to pure black at the frame edges, steady exposure, soft atmospheric haze, fine dust drifting in the light. Muted, nearly monochrome palette of near-black, bone white and natural skin tones. Subtle 35mm film grain, realistic anatomy and hands, sharp focus on the subject, clean frame with no on-screen text.
```

**`media-src/frames/kumite-start.png`**: start frame for chapter two. Image model, 16:9, with both refs.

```
16:9 cinematic frame. Two Kyokushin karateka face each other in fighting stance, within kicking range, near the center of the frame: the man from reference 1 on the left wearing the black belt, the man from reference 2 on the right wearing the brown belt. They stand on a square of pale tatami mats lit by one hard overhead spotlight in an otherwise dark, empty space, and beyond the mat everything dissolves into black haze. Plain white gis, bare hands, bare feet. Camera side-on at chest height with both fighters fully in frame.

Style: photorealistic and cinematic, shot on ARRI Alexa with anamorphic lenses. Low-key chiaroscuro lighting, deep blacks falling off to pure black at the frame edges, steady exposure, soft atmospheric haze, fine dust drifting in the light. Muted, nearly monochrome palette of near-black, bone white and natural skin tones. Subtle 35mm film grain, realistic anatomy and hands, sharp focus on the subject, clean frame with no on-screen text.
```

**`media-src/video/kumite.mp4`**: chapter two. Veo, 16:9, 8 s, starting from kumite-start.png.

```
One continuous 8-second shot in high-speed slow motion, no cuts, starting from the provided frame. Two Kyokushin karateka in plain white gis, bare hands and bare feet, face each other on a square of pale tatami under a single hard overhead light, with black haze beyond the mat. Fighter A (Indian man, late 20s, lean, black belt, on the left) pivots on his standing foot and throws a high roundhouse kick with his right leg. Fighter B (Indian man, early 30s, stocky, short beard, brown belt, on the right) raises his left forearm and blocks the kick beside his head. As shin meets forearm, the white sleeves and trousers ripple, droplets of sweat spray off and glitter in the top light, and both bodies absorb the impact. Fighter A sets his foot down and both settle back into stance. The camera tracks slowly and smoothly from left to right at chest height, keeping the point of contact near the center of the frame.

Style: photorealistic and cinematic, shot on ARRI Alexa with anamorphic lenses. Low-key chiaroscuro lighting, deep blacks falling off to pure black at the frame edges, steady exposure, soft atmospheric haze, fine dust drifting in the light. Muted, nearly monochrome palette of near-black, bone white and natural skin tones. Subtle 35mm film grain, realistic anatomy and hands, sharp focus on the subject, clean frame with no on-screen text.
```

**`media-src/video/osu.mp4`**: chapter three. Veo, 16:9, 8 s. Use the last frame of your chosen kumite take as this shot's first frame, so the two chapters play as one continuous film.

```
One continuous 8-second shot at real-time speed, no cuts, starting from the provided frame. The same two Kyokushin karateka, breathing hard with sweat on their faces, step back to distance on the pale tatami under the single overhead light. Facing each other, each crosses his forearms in an X in front of his chest, then sweeps both arms down to his sides and bows deeply from the waist in the Kyokushin osu salute, holds the bow for a beat, and rises. The camera slowly pulls back from a waist-up two-shot to a wide shot as the black haze closes in around the lit mat. Calm and solemn.

Style: photorealistic and cinematic, shot on ARRI Alexa with anamorphic lenses. Low-key chiaroscuro lighting, deep blacks falling off to pure black at the frame edges, steady exposure, soft atmospheric haze, fine dust drifting in the light. Muted, nearly monochrome palette of near-black, bone white and natural skin tones. Subtle 35mm film grain, realistic anatomy and hands, sharp focus on the subject, clean frame with no on-screen text.
```

**`media-src/video/eyes.mp4`**: the "Keep your head low, eyes high." section. Veo, 16:9, 8 s, with fighter-a.png as a reference if supported.

```
One continuous 8-second shot, no cuts. Extreme close-up of a Kyokushin karateka (Indian man, late 20s, light stubble): his raised fists fill the bottom of the frame, softly out of focus, and above them his eyes look up intensely from under a lowered brow, straight into the lens. A single bead of sweat slides slowly down his temple. Hard side light from the left, the rest of his face falling into shadow. Locked-off camera with an extremely slow push-in; he blinks once, slowly. Shallow depth of field, eyes razor sharp.

Style: photorealistic and cinematic, shot on ARRI Alexa with anamorphic lenses. Low-key chiaroscuro lighting, deep blacks falling off to pure black at the frame edges, steady exposure, soft atmospheric haze, fine dust drifting in the light. Muted, nearly monochrome palette of near-black, bone white and natural skin tones. Subtle 35mm film grain, realistic anatomy and hands, sharp focus on the subject, clean frame with no on-screen text.
```

### 2.5 Ambient loop

**`media-src/video/arena.mp4`**: the events background, an empty mat waiting for the next event. Veo, 16:9, 8 s. The media script turns it into a seamless loop.

```
One continuous 8-second shot from a completely locked-off camera. An empty, darkened sports hall on the eve of a karate tournament: a square of pale tatami in the center lit by a single overhead spotlight, slow haze drifting and curling through the beam, tiers of empty seats fading into darkness beyond. No people. The only motion is the slowly drifting haze. Calm and expectant.

Style: photorealistic and cinematic, shot on ARRI Alexa with anamorphic lenses. Low-key lighting, deep blacks falling off to pure black at the frame edges, steady exposure, soft atmospheric haze. Muted, nearly monochrome palette of near-black, bone white and natural materials. Subtle 35mm film grain, clean frame with no on-screen text.
```

### 2.6 Stills

Any of .png, .jpg, .jpeg or .webp works.

**`media-src/stills/mountain.png`**: the Learn the Way panel. It refers to Oyama's mountain years without depicting him. Image model, 3:4.

```
3:4 portrait photograph. A lone karateka in a white gi, seen from behind and far away, stands on wet black rocks at the base of a narrow mountain waterfall in an ancient cedar forest at dawn, palms pressed together at his chest. Mist rises off the water, cold blue light filters through the trees, and the figure is small in the frame. His face is not visible.

Style: photorealistic and cinematic, shot on ARRI Alexa with anamorphic lenses. Low-key lighting, deep blacks falling off to pure black at the frame edges, steady exposure, soft atmospheric haze. Muted, nearly monochrome palette of near-black, bone white and natural materials. Subtle 35mm film grain, clean frame with no on-screen text.
```

**`media-src/stills/belts.png`**: the Earn the Belt panel, in KKFI's belt order. Image model, 3:4.

```
3:4 portrait still life. Seven worn cotton karate belts hang side by side from wooden pegs on a dark, aged wooden dojo wall, ordered left to right: white, orange, blue, yellow, green, brown, black. Each belt is folded over its peg with both ends hanging straight down, with frayed edges and faded fabric, the black belt the most worn of all. A single soft beam of side light grazes the fabric texture while the wall falls into black.

Style: photorealistic still life, low-key lighting, deep blacks falling off to pure black at the edges, subtle 35mm film grain. The belt colors stay true but slightly faded; everything else is muted. Clean frame with no text or lettering.
```

**`media-src/stills/hands-white.png`** and **`media-src/stills/hands-black.png`**: the final CTA. One crossfades into the other on scroll, like years passing. Image model, 16:9. Make the white one first, then edit it into the black one so the framing matches exactly.

hands-white:

```
16:9 overhead close-up. A child's small hands, around seven years old, tie a brand-new, stiff white cotton karate belt into a square knot over a crisp white gi. The knot sits at the center of the frame. Dark background, soft warm top light, shallow depth of field.

Style: photorealistic and cinematic, shot on ARRI Alexa with anamorphic lenses. Low-key chiaroscuro lighting, deep blacks falling off to pure black at the frame edges, steady exposure, soft atmospheric haze, fine dust drifting in the light. Muted, nearly monochrome palette of near-black, bone white and natural skin tones. Subtle 35mm film grain, realistic anatomy and hands, sharp focus on the subject, clean frame with no on-screen text.
```

hands-black (an edit of hands-white):

```
Edit this image. Keep the exact same composition, camera angle, framing, lighting and knot position. Replace the child's hands with an older man's strong, weathered, calloused hands, and replace the white belt with a worn, frayed, faded black belt. The gi is now old, softened canvas.
```

### 2.7 Keep these real

Sosai Oyama's photo, the portraits of Daihyo Take and Shihan Vasant, the gallery and the testimonials stay real photos. Anything that says "this is us" should be real; generated people there would undercut trust.

### 2.8 Checklist

All paths are relative to `media-src/`.

| File | Tool | Used for |
|---|---|---|
| refs/fighter-a.png | Image | Consistency reference (not on the site) |
| refs/fighter-b.png | Image | Consistency reference (not on the site) |
| frames/karateka-start.png | Image | First frame of karateka.mp4 (not on the site) |
| frames/kumite-start.png | Image | First frame of kumite.mp4 (not on the site) |
| video/karateka.mp4 | Veo | Chapter one scroll film, the hero |
| video/kumite.mp4 | Veo | Chapter two scroll film |
| video/osu.mp4 | Veo | Chapter three scroll film |
| video/eyes.mp4 | Veo | "Keep your head low, eyes high." scroll film |
| video/arena.mp4 | Veo | Events background loop |
| stills/mountain | Image | Learn the Way panel |
| stills/belts | Image | Earn the Belt panel |
| stills/hands-white | Image | Final CTA, start |
| stills/hands-black | Image (edit) | Final CTA, end |

---

## Part 3: Media pipeline (Claude)

Create `scripts/prepare-media.sh` exactly as below, make it executable, and add `media-src/` to `.gitignore`. The script turns the raw files in `media-src/` into web-ready files in `public/media/` and writes a manifest the site reads at runtime. With `--placeholders` it first generates test footage for anything missing, so the build can start before the real assets exist; real files always win over placeholders, so rerunning after the real assets arrive is all it takes. It has been tested end to end (placeholders, real files overriding placeholders, `TRIM`) and runs on the stock macOS bash.

```bash
#!/usr/bin/env bash
# Turns raw assets in media-src/ into web-ready files in public/media/.
#
#   bash scripts/prepare-media.sh                  process whatever is in media-src/
#   bash scripts/prepare-media.sh --placeholders   also generate test footage for anything missing
#   TRIM=0.94 bash scripts/prepare-media.sh        crop 6% off every edge first (e.g. a corner watermark)
#
# Real files always win over placeholders (*.placeholder.*), so drop real assets in and rerun.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="media-src"
OUT="public/media"
FILMS=(karateka kumite osu eyes)
LOOPS=(arena)
STILLS=(mountain belts hands-white hands-black)
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
```

Output layout:

```
public/media/
  manifest.json                    { ext, src: [1920, 1080], mCropX: 420, films: { <name>: { d, m } } }
  seq/<film>/d/0001.<ext> …        desktop: 1600 px wide, every frame (24 fps)
  seq/<film>/m/0001.<ext> …        mobile: center 1080×1080 crop of the 1920×1080 frame,
                                   every 2nd frame (12 fps); the crop starts at source x = 420
  loops/arena.mp4                  muted, seamless (forward, then reversed)
  stills/<name>.jpg
```

`ext` is `webp` when the local ffmpeg has libwebp and `jpg` otherwise; the site must read it from the manifest rather than assume.

`public/media` can reach roughly 100 MB once all four real films are in. Committing it is fine if the host accepts that; otherwise upload the folder to S3/CloudFront or R2 and point `NEXT_PUBLIC_MEDIA_BASE` at it (Part 4.1).

---

## Part 4: Build spec (Claude)

### 4.1 Ground rules

- Homepage only. If the nav or footer are shared components, give them a homepage variant instead of restyling them globally.
- Follow the repo's existing conventions: detect App Router vs Pages Router, TypeScript, lint rules and the styling approach, and match them.
- New dependencies: `gsap` and `lenis` only.
- Lenis runs only on the homepage and is destroyed on unmount, so other pages keep native scrolling.
- Every media URL goes through one helper, `mediaUrl(path)`, built on `NEXT_PUBLIC_MEDIA_BASE` (default `/media`), so the frames can move to a CDN without code changes.
- Real people stay real photos (Part 2.7).

### 4.2 Stack

GSAP with ScrollTrigger, and Lenis, synced like this:

```ts
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```

All scroll components are client components and kill their ScrollTriggers on unmount.

### 4.3 Design system

These choices are deliberate; don't swap them for defaults. The concept is the dojo before dawn: a dark room, one shaft of light, one fighter. The film is the single bold element on the page, and everything around it stays quiet and disciplined.

**Color**

| Token | Hex | Role |
|---|---|---|
| night | `#000000` | Page background. Pure black on purpose: the footage falls off to black, so the canvas edges vanish into the page. |
| canvas | `#E8E2D4` | Primary text. The color of an unbleached dogi. |
| ash | `#8F887B` | Secondary text (about 6:1 on night). |
| worn-belt | `#26221E` | Rules, borders and quiet surfaces. A black belt worn soft. |
| dan-gold | `#B89A5A` | Hairlines, callout anchors, focus rings and active states, taken from the gold rank stripes on a black belt. Only for things that point at something. |

No other accent colors and no gradients, apart from a local scrim behind any text that sits over film.

**Type**

- **Shippori Mincho B1** for display text and every kanji, weights 500 and 800. Its slight ink bleed suits sumi and letterpress, and it covers both Latin and Japanese, so kanji and English match.
- **Zen Kaku Gothic New** for body, UI and callout text, weights 400 and 700.
- Load both through next/font; Japanese glyphs should load on demand rather than up front.
- Scale (ratio 1.25): 0.8, 1, 1.25, 1.563, 1.953, 2.441, 3.052 rem. Hero H1: `clamp(3.5rem, 9vw, 9rem)`, line-height 0.95, letter-spacing -0.02em. Body: 1rem with line-height 1.6, measure under 65ch.
- **The signature move: kanji set vertically** (`writing-mode: vertical-rl`), like a hanging scroll. It appears in the hero (極真, large, down the left edge, with "Kyokushin Karate Foundation of India" running sideways beneath it in small Zen Kaku Gothic), in the chapter marks, and in every callout.
- Sentence case everywhere. No all-caps labels, no eyebrow labels above headings, no monospace, no arrows appended to links, no single word picked out in a headline, and no "A · B · C" meta strings.
- Numbering only where the content really is a sequence: the three film chapters (marked 一, 二, 三) and the belt path. The three ways in are options, not steps, so they get no numbers.

**Layout**

Left-aligned throughout. Text over film sits in a corner with a local scrim behind it; the film itself stays full-bleed.

Hero, desktop:

```
┌──────────────────────────────────────────────────────────────────┐
│ nav (transparent over the film)                                  │
│                                                                  │
│ 極                                                               │
│ 真           full-bleed canvas: the karateka, centered            │
│                                                                  │
│ K  ← org name set sideways                                       │
│ y    beneath the kanji                                           │
│ …                                                                │
│                                                                  │
│ Forge your spirit.                         H1, Mincho 800        │
│ Full-contact karate in the lineage of …    Gothic, max 46ch      │
│ [Join the dojo]   Find a dojo near you                           │
└──────────────────────────────────────────────────────────────────┘
```

Hero, mobile:

```
┌────────────────────┐
│ nav                │
│ 極                 │
│ 真   film: center  │
│      crop, follows │
│      focal track   │
│                    │
│ Forge your         │
│ spirit.            │
│ subline            │
│ [Join the dojo]    │
│ Find a dojo near   │
│ you                │
└────────────────────┘
```

Callout anatomy:

```
 ●────────────────────┐
 dan-gold anchor,     │  正   Seiken
 6 px, pinned to      │  拳   Strikes land on the first two
 the body             │       knuckles, bare.

 1 px dan-gold hairline with one elbow. Kanji set vertically in Mincho,
 name in Gothic 700 (canvas), one sentence in Gothic 400 (ash), max-width 28ch.
```

Chapter marks: the kanji numeral and the chapter's kanji set vertically at the right edge in Mincho, with the English name small in Gothic beneath. Chapter one: 一 空手家, "The karateka". Chapter two: 二 組手, "Kumite". Chapter three: 三 押忍, "Osu".

**Motion**

- The scroll film is the one bold moment. Outside the film chapters only two things move: the lineage hairline (drawn by scroll) and the arena loop's slow haze.
- No fade-and-slide-up entrances on every section, no hover animations on panels, no parallax, no autoplaying marquee.
- Text inside the film chapters is tied to scroll progress, never to timers.
- No transition effects between chapters: each starts on its own first frame. (Kumite into osu reads as one continuous shot because osu starts on kumite's last frame.)
- For anything that isn't scrubbed: `cubic-bezier(0.2, 0.7, 0.1, 1)` over 400–700 ms.

If a browser or screenshot tool is available, screenshot each phase at 1440×900 and 390×844 and critique it against this section before moving on.

### 4.4 ScrubFilm, the core component

- A pinned section containing a `<canvas>`. The frame index is `Math.round(progress * (frames - 1))`, with `scrub: true` (Lenis already smooths the scroll).
- Frame counts and the file extension come from `public/media/manifest.json`. Never hardcode them.
- Use the `/m` frames when the viewport is portrait or narrower than 768 px, and `/d` otherwise. The `/m` frames are the center 1080×1080 crop of the 1920×1080 source, so subtract `mCropX` (420) from source x for callout anchors and focal points whenever `/m` is in use.
- **Memory:** keep every frame as a preloaded `HTMLImageElement` (compressed in memory) and maintain a sliding window of about 24 decoded `ImageBitmap`s around the current frame, decoding ahead in the scroll direction and calling `close()` on the rest. Don't decode every frame up front: 192 frames at 1600×900 is about 1 GB of RAM.
- If the needed frame hasn't loaded, draw the nearest loaded one. The canvas never goes blank.
- **Loading order:** karateka first, behind a real-progress preloader that waits for the first 30% of its frames; the rest of karateka streams in the background, and each other film starts loading when its section is one viewport away.
- Draw with cover-fit (`scale = max(cw / iw, ch / ih)`), devicePixelRatio capped at 2, and redraw on resize via ResizeObserver.
- **Focal track:** an optional `[{ p, fx }]` in source pixels. On narrow screens the crop centers on the interpolated `fx`, clamped to the frame edges, instead of the frame center.
- Show frame 0001 as a priority `<img>` poster (`fetchpriority="high"`) until the canvas has drawn, so it becomes the LCP element.

### 4.5 Hairline callouts

- Defined in source pixels (1920×1080) with keyframes over scroll progress, linearly interpolated.
- Anchors map to the screen through the exact same cover-fit and focal transform as the canvas, so they stay glued to the body at any crop.
- Each callout draws in when progress enters `show[0]` (the anchor appears, the hairline draws via stroke-dashoffset, the label fades in) and draws out after `show[1]`. If the label would leave the viewport, it flips to the other side.
- A visually hidden list of all callout text, for screen readers.
- **Debug mode** (`?debug=1`): overlay the progress value and frame number; clicking the canvas logs `{ p, x, y }` in source pixels, so tracks can be authored by clicking. Every track starts with placeholder coordinates.
- Keep all film config in one file, for example `components/home/films.ts`:

```ts
type Key = { p: number; x: number; y: number };

type Callout = {
  id: string;
  kanji: string;          // set vertically
  name: string;           // romaji, sentence case
  text: string;           // one plain sentence
  side: 'left' | 'right';
  show: [number, number]; // progress window
  track: Key[];           // source px, 1920×1080
};

type Overlay = { id: string; show: [number, number] }; // text tied to progress, content in the component

type Film = {
  name: 'karateka' | 'kumite' | 'osu' | 'eyes';
  pinVh: number;
  focal?: { p: number; fx: number }[];
  callouts: Callout[];
  overlays: Overlay[];
};

// Placeholder coordinates: tune with ?debug=1 once the real frames exist.
export const karateka: Film = {
  name: 'karateka',
  pinVh: 400,
  overlays: [
    { id: 'hero', show: [0, 0.1] },
    { id: 'chapter-mark', show: [0.1, 0.18] },
  ],
  callouts: [
    { id: 'eyes', kanji: '目', name: 'Eyes', text: 'Head low, eyes high: stay humble, aim high.', side: 'right', show: [0.12, 0.32], track: [{ p: 0.12, x: 960, y: 250 }, { p: 0.32, x: 955, y: 230 }] },
    { id: 'ibuki', kanji: '息吹', name: 'Ibuki', text: 'A slow, forced exhale that braces the body to take a strike.', side: 'left', show: [0.25, 0.45], track: [{ p: 0.25, x: 960, y: 420 }, { p: 0.45, x: 950, y: 440 }] },
    { id: 'seiken', kanji: '正拳', name: 'Seiken', text: 'Strikes land on the first two knuckles, bare.', side: 'right', show: [0.4, 0.62], track: [{ p: 0.4, x: 1010, y: 330 }, { p: 0.62, x: 1040, y: 340 }] },
    { id: 'obi', kanji: '帯', name: 'Obi', text: 'The black belt test ends with 20 full-contact fights in a row.', side: 'left', show: [0.55, 0.75], track: [{ p: 0.55, x: 960, y: 600 }, { p: 0.75, x: 960, y: 700 }] },
  ],
};

export const kumite: Film = {
  name: 'kumite',
  pinVh: 350,
  focal: [{ p: 0, fx: 960 }, { p: 0.5, fx: 1080 }, { p: 1, fx: 1000 }],
  overlays: [
    { id: 'chapter-mark', show: [0, 0.1] },
    { id: 'rules', show: [0.65, 0.95] },
  ],
  callouts: [
    { id: 'jodan', kanji: '上段回し蹴り', name: 'Jodan mawashi geri', text: 'The high roundhouse kick. Kicks to the head are legal.', side: 'left', show: [0.3, 0.6], track: [{ p: 0.3, x: 1060, y: 380 }, { p: 0.6, x: 1080, y: 370 }] },
    { id: 'uke', kanji: '受け', name: 'Uke', text: 'The block. Forearm meets shin.', side: 'right', show: [0.38, 0.62], track: [{ p: 0.38, x: 1120, y: 330 }, { p: 0.62, x: 1130, y: 320 }] },
  ],
};

export const osu: Film = {
  name: 'osu',
  pinVh: 200,
  overlays: [
    { id: 'chapter-mark', show: [0, 0.12] },
    { id: 'full-contact', show: [0.2, 1] },
    { id: 'full-respect', show: [0.5, 1] },
  ],
  callouts: [],
};

export const eyes: Film = {
  name: 'eyes',
  pinVh: 150,
  overlays: [
    { id: 'head-low', show: [0.15, 1] },
    { id: 'eyes-high', show: [0.3, 1] },
  ],
  callouts: [],
};
```

### 4.6 The page, in order

1. **Preloader.** Vertical 極真 and a live percentage in Zen Kaku Gothic. It fades into the hero once the first 30% of the karateka frames are ready.
2. **Chapter 一, the karateka.** ScrubFilm karateka, pinned 400vh. From 0 to 0.1 the hero copy is visible: vertical 極真 with the org name beneath it, the H1 "Forge your spirit." as real DOM text, the current subline, and "Join the dojo" and "Find a dojo near you". Then the chapter mark and the four callouts. The punch, in the last 20%, plays with nothing on top.
3. **Chapter 二, kumite.** ScrubFilm kumite, pinned 350vh. Chapter mark, the two callouts, then from 0.65 to 0.95: "Bare knuckles to the body. Kicks to the legs, body and head. No punches to the face."
4. **Chapter 三, osu.** ScrubFilm osu, pinned 200vh. "Full contact." builds word by word from 0.2 and "Full respect." from 0.5, in large Mincho.
5. **Three ways in.** Three tall images side by side (stacked on mobile), each with its title and one sentence beneath, each panel a single link. No cards, shadows or rounded corners; hover and focus give the title a dan-gold underline. Learn the Way uses mountain.jpg and links to /what-is-kyokushin. Earn the Belt uses belts.jpg and links to /belt-system. Find your Dojo links to /find-a-dojo and shows a map of India with a dan-gold dot per dojo if the dojo data has coordinates. The outline must follow India's official boundary as published by the Survey of India; generic world-map data draws Jammu and Kashmir and Arunachal Pradesh differently, which is a real problem for an Indian organization. If the dojo data has no coordinates, use a real dojo photo from the gallery instead.
6. **The Oyama quote.** The real /history/oyama.jpg in grayscale, the quote in large Mincho, and the attribution. Static.
7. **Head low, eyes high.** ScrubFilm eyes, pinned 150vh. "Keep your head low," sits above his eyes and "eyes high." below them, both in huge Mincho, so the line frames the eyes.
8. **Events.** arena.mp4 as a muted, autoplaying, looping, playsinline background behind a scrim, with the existing events and calendar content and links on top. Paused under reduced motion.
9. **Lineage.** The real portraits and copy for Daihyo Ryuko Take and Shihan Vasant K. Singh, joined by a vertical dan-gold hairline that draws with scroll, from the Honbu dojo to India.
10. **From the dojo floor.** The existing testimonials as a quiet typographic block: the quote in Mincho, then name, belt and dojo in ash, written with commas ("Rahul Sharma, green belt, Mumbai Central Dojo").
11. **On the mats.** The real gallery photos in one horizontal row with native scrolling and scroll-snap, at their natural aspect ratios, plus "Open the gallery" linking to /gallery. Nothing autoplays.
12. **Final CTA.** hands-white.jpg crossfades into hands-black.jpg across a 200vh pin, with "Every black belt began as a white belt." and the links "Become a member" (/register) and "See the belt path" (/belt-system).
13. **Footer.** Same content, restyled to the tokens.

On the homepage the nav is transparent with canvas-colored text over the film chapters; after chapter 三 it takes a night background and a worn-belt bottom rule.

### 4.7 Accessibility and performance

- `prefers-reduced-motion`: no Lenis and no pinning. Each film shows its poster frame with its callouts placed statically, and the arena loop is paused.
- Visible dan-gold focus rings on every interactive element, and a logical tab order through the pinned sections.
- Text over film always has a local scrim and meets 4.5:1 contrast.
- Real alt text on real photos; decorative film frames are aria-hidden.
- No layout shift. LCP under 2.5 s on a fast 4G profile, with the poster as the LCP element.
- Smooth scrubbing on a mid-range Android phone.

---

## Part 5: Phases (Claude)

Stop after each phase with a short summary of what changed and anything that needs a decision.

**Phase 0: inspect and plan.** Read the homepage code, the router type, the styling approach, where the nav and footer live, and where the events, testimonials, gallery and dojo data come from, including whether dojos have coordinates. Report the plan and any conflicts with this brief. Change nothing.

**Phase 1: pipeline and placeholders.** Create `scripts/prepare-media.sh` (Part 3), add `media-src/` to `.gitignore`, and run the script with `--placeholders`. Install gsap and lenis. Add `mediaUrl()`, the design tokens and the fonts.

**Phase 2: the scroll engine.** Build ScrubFilm, the hairline callouts and debug mode on the karateka film only, using the placeholder footage. Verify scrubbing in both directions, resizing, and the switch to the mobile frame set.

**Phase 3: the page.** Build every section in Part 4.6 with the design system, wired to the existing data.

**Phase 4: real assets.** Once the real files are in `media-src/`, rerun the script. If you can view images, open the frames inside each callout's show window and estimate first-pass anchors and focal points; otherwise keep the placeholders. Anshuman fine-tunes them with `?debug=1`.

**Phase 5: polish and QA.** Reduced motion, mobile, Safari, performance, and everything in Part 6. `next build` must pass.

---

## Part 6: Acceptance checklist

- [ ] Only the homepage, new components, the script, `.gitignore` and `package.json` changed; every other page behaves exactly as before.
- [ ] `next build`, type checks and lint pass, with no console errors at runtime.
- [ ] Scrubbing is smooth in both directions, and the canvas never shows a blank frame while loading.
- [ ] Callouts stay on the body while the window resizes from 1440×900 down to 390×844.
- [ ] Mobile uses the `/m` frames, and the focal track keeps the kumite contact point in view.
- [ ] The H1 is real DOM text and readable over the film.
- [ ] Reduced motion shows posters with static callouts, with no pinning and no Lenis.
- [ ] Lenis is active only on the homepage.
- [ ] Every link works: /register, /find-a-dojo, /what-is-kyokushin, /belt-system, /calendar, /events, /gallery.
- [ ] Focus is visible on every interactive element.
- [ ] Nothing uses all-caps labels, monospace, gradients, or colors outside the token table.
