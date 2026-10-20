# KKFI full public-site redesign — design (2026-10-19)

Owner: Anshuman Singh. Source conversation: the scroll-film homepage (branch `redesign/scroll-film`),
the Scrolltide references (Katana, Plinth, Valmora, Earshot, Oddball, Vivant, Scowlby, House — summaries
only; every full template is paywalled, so nothing is copied, only the ideas are adapted), and the
Pahalwan Ji storefront spec as the format to follow.

## Intent

Make kyokushinfoundation.com feel like what it represents: a serious national Kyokushin institution with
real craft. Every public page joins one visual system (the dojo before dawn), gets one signature moment
that only Kyokushin could have, and says only things that are true. The owner's words: "something best
professional type for karate", and "only write authentic things about Kyokushin and Vasant Singh".

## Goals

- One design system across every public page (tokens, type, chrome, motion), replacing the current mix of
  red Montserrat pages and the new homepage.
- One signature, Kyokushin-specific interaction per page family (table below), built on scroll progress,
  never on timers.
- Every factual statement on the site is either sourced, confirmed by Shihan Vasant, or removed (see the
  authenticity ledger).
- Everything that works today keeps working: registration, vouchers, brackets, live scoring, PDF
  certificates, verification, uploads, the store cart, the dojo map.

## Non-goals

- The logged-in app (`/dashboard`, `/profile`, `/payments`, `/renew-membership`, `/management`) keeps its
  current look. It is a work tool; it may pick up tokens later, separately.
- No backend, schema or API changes except where a page needs a field that already exists.
- No new dependencies. Next 16, Tailwind 3, Framer Motion, GSAP + ScrollTrigger, Lenis and three.js are
  already in the repo.

## Anti-goals (a failure even if it works)

- Invented people, quotes, numbers or testimonials anywhere.
- Motion that runs on its own clock and fights the reader (marquees, autoplay carousels, timed reveals).
- A page that is slow on a mid-range Android phone or shifts layout while loading.
- Breaking an existing member flow to get a visual effect.

## Design system (extends the homepage tokens already in `tailwind.config.ts`)

| Token | Value | Role |
|---|---|---|
| night | `#000000` | page background everywhere |
| canvas | `#E8E2D4` | primary text (unbleached dogi) |
| ash | `#8F887B` | secondary text (about 6:1 on night) |
| worn-belt | `#26221E` | rules, borders, quiet surfaces |
| dan-gold | `#B89A5A` | anchors, hairlines, focus, active state; only things that point |
| kyokushin-red | `#B3261E` (new) | one use only: the kanku mark and live/danger states. Replaces `#FF0000` |

- Type: Shippori Mincho B1 (display, every kanji), Zen Kaku Gothic New (body, UI). Montserrat is retired from
  public pages. Scale 1.25. Sentence case. No all-caps labels, eyebrows, monospace or arrows on links.
- Kanji set vertically (`writing-mode: vertical-rl`) as the recurring signature: page marks, chapter marks,
  section numerals.
- Layout: left-aligned, 1400px max, 16px gutters on phones, generous vertical rhythm.
- Motion vocabulary: scroll-scrubbed (film, layers, drawn lines), one easing `cubic-bezier(0.2,0.7,0.1,1)`
  400–700ms for anything not scrubbed. Reduced motion: no pinning, no Lenis, static end states.
- Photography: real photos for real people, events and dojos; generated imagery only for atmosphere
  (stated in the footer: "Some imagery is illustrative").

## Shared chrome (Phase 1, applies to every public page)

1. **Navbar**: the homepage film variant becomes the site navbar: full-width bar, transparent over a
   page's opening film/stage, solid night + worn-belt rule after it (`data-nav-solid-after` on every page).
   Same menu structure as today. The spinning logo and the tricolour gradient text are retired.
2. **Footer**: FilmFooter becomes the site footer. One contact email everywhere (owner to choose, see
   ledger). "Tournament rules" and "Membership terms" stay greyed until those pages exist.
3. **Mobile bottom nav**: kept (members rely on it), restyled to tokens; hidden on `/login` and
   `/register` as well, where it currently covers the forms.
4. **Page transition (Vivant)**: InkWipe is replaced by a "belt pull": a horizontal band in the outgoing
   page's colour slides off like a belt being drawn through the knot. 600ms, opacity-only under reduced
   motion.
5. **First-visit preloader (Vivant)**: the homepage preloader (vertical 極真 + real %) becomes the site's
   only preloader, shown on the homepage only.
6. **Page hero**: `PageHero` is rebuilt on the new system: vertical kanji mark at the left edge, Mincho H1,
   Gothic lede, optional media. Every page's existing 3D scene stays available as `media`, restyled
   (gold/canvas instead of red).
7. **System pages**: 404, offline and error rebuilt on the system (they still use `#FF0000` and a fake
   "K" mark). The error page stops claiming "our team has been notified".

## Per-page plans

Signature column = the one interaction that page is remembered for. Everything else on the page is quiet.

### Home `/` (Phase 2) — Plinth + Katana

1. Preloader (exists).
2. **The exhibit (Plinth)**, new opening stage, pinned ~500vh, four acts:
   - Act I, arrival: a cut-out karateka centred on black, lit like marble; 極真 and "Kyokushin" rise behind
     and over him in huge condensed Mincho. H1 "Forge your spirit." as real text.
   - Act II, **where Kyokushin hits** (owner's pick): leader lines draw from his body to bracketed tags,
     numbered callouts down both sides: legal — kicks to the legs, body and head; punches to the body;
     an ✕ on the face — no hand strikes to the head. (Knockdown rules; wording in the ledger.)
   - Act III, **the four weapons**: close-ups of seiken (fist), shin, eyes, belt knot burst from behind him
     and lock into a diamond (Plinth). Each carries its kanji.
   - Act IV, **your first step (Pahalwan Act II)**: he glides left; a panel opens right: "Start at white
     belt", city select (live dojo list), nearest dojos, "Join KKFI" / "Find a dojo".
   - Phones: no glide; acts stack vertically; callouts become a numbered list under the figure.
3. Chapter 二 kumite and 三 osu films (exist), then Three ways in, Oyama quote, eyes film, events,
   lineage (rewritten per ledger), Team India, chronicles, gallery, closing (all exist).
4. Chapter 一 (the karateka film) moves after the exhibit as "the karateka", or is retired if the exhibit
   covers it; decided after the exhibit spike.

### Learn (Phase 3)

| Route | Signature | Plan |
|---|---|---|
| `/what-is-kyokushin` | **The history scroll (House)**: a vertical hanging-scroll timeline; each year unrolls as you scroll | Timeline rebuilt from sourced facts only (ledger). Principles, methods, comparison table and Dojo Kun kept and corrected. The Dojo Kun gets its own pinned moment: the seven lines land one per scroll beat, ending on 押忍 (from the earlier idea C). |
| `/belt-system` | **Pinned lookbook (Vivant)**: one belt per screen; the existing 3D belt dyes as you scroll; kyu, meaning, typical time | One source of truth for belts (`lib/belts.ts`) shared with `/syllabus`, `/black-belts` and the blog guide, so the four pages stop contradicting each other. Times, kata counts and the Shodan test confirmed by Shihan Vasant. |
| `/syllabus` | **Whiteboard (Oddball)**: each kata's floor pattern (embusen) draws itself in chalk-gold as you reach it | Same data file as belt-system. Print stylesheet kept. |
| `/intro` (About) | **Lineage line (House)**: Oyama → Daihyo Take → Shihan Vasant drawn as one dan-gold line down the page | Copy rewritten from the ledger; organisational relationship stated accurately (World Kyokushin Kaikan). |

### People (Phase 4) — Oddball flip cards

| Route | Plan |
|---|---|
| `/instructors` | Flip cards: front a grayscale portrait and vertical name; back rank, dojo, years, "Verify membership". Keyboard and touch flip (button, `aria-pressed`). Data unchanged (`/users/public-instructors`). |
| `/black-belts` | Tiers by dan as now, cards flip. Dan titles (Senpai/Sensei/Shihan) only after the owner confirms KKFI's rule. |
| `/team-india` | Keep the 3D globe; a trajectory line draws India → host country as you scroll (from the SELENE idea), distance counter. Squad as flip cards. |

### Events (Phase 5) — Oddball shot clock + Valmora

| Route | Plan |
|---|---|
| `/events` | Hero: a kumite **round clock** (3:00) as the countdown to the next event, counting down only as the page scrolls into the hero, then live. Filter and lists kept. |
| `/events/[id]` | Same hero language; the 3-step registration wizard, voucher and feedback flows untouched, restyled. Tournament perks line shown only when the event says so. |
| `/calendar` | Month grid restyled; kanji 暦 mark. |
| `/tournaments/[id]/view`, `/bracket` | Brackets restyled; live state uses kyokushin-red. Socket and SSE logic untouched. |
| `/tournaments/[id]/results` | **Unveiling (Valmora)**: the podium is revealed as a cloth pulls away on scroll; medal table counts up on a gauge. Certificates fixed to say "Foundation". |
| `/results`, `/results/[id]` | Quiet registry list; PDF viewer kept. Add the name search the copy promises, or change the copy. |
| `/live` | Scoreboards restyled; nothing scroll-driven (live data). |
| `/seminars` | Restyled; lightbox kept; stats only if confirmed. |
| `/low-kick` | Partner brand: its own logo and artwork untouched; frame and type to the system. |

### Find a dojo (Phase 6) — Earshot

| Route | Plan |
|---|---|
| `/find-a-dojo` | **The run (Earshot)**: a karateka (frame sequence) keeps moving while the background passes through the real KKFI cities (Guwahati, Dehradun, Amritsar, Bengaluru, Hyderabad, Bhilai, Kanpur, Haldwani, Aurangabad), each city name huge, with its dojo count. Then the existing full-screen Leaflet map, search and geolocation, untouched. The "Verified & Active" badge shows only real status. |
| `/dojos`, `/dojos/[id]` | Directory and profile restyled; india-map scene kept. |

### Gallery, media, store, blog (Phase 7)

| Route | Plan |
|---|---|
| `/gallery` | **Concave 3D carousel (Vivant)**: the existing gallery-ring scene reshaped as a concave wall you drag/scroll. Album browsing, lightbox, video, share and download kept. |
| `/gallery/all`, `/gallery/albums/[id]` | Masonry and upload/delete flows kept, restyled. |
| `/media` | Press list restyled. |
| `/store` | **Animated filters (Vivant)**: category changes re-flow the grid with layout animation (Framer `layout`). Cart, checkout and validation untouched. Metadata fixed to "Foundation". |
| `/blog`, `/blog/[slug]`, 4 guides | Article template on the system. Guides rewritten against the ledger (they hold most of the unsourced claims). |
| `/sponsors`, `/csr` | Restyled; sponsor ring kept. CSR numbers, timeline and testimonials removed until confirmed. |

### Join, sign-in, contact, verify (Phase 8) — Scowlby

| Route | Plan |
|---|---|
| `/login`, `/register`, `/forgot-password`, `/reset-password` | AuthShell's left panel: **a sensei whose head and eyes follow the cursor (Scowlby)**, frame sequence scrubbed by pointer x, idles when still; static frame on touch and reduced motion. Six-step registration logic untouched; "Sihan" corrected to "Shihan". |
| `/contact` | Same sensei, smaller; form and details kept; one email. |
| `/verify`, `/verify/[n]` | Certificate scene kept; record restyled for print. Metadata stops promising QR scanning (no scanner exists). |
| `/privacy`, `/terms` | Restyled reading layout. The terms' "6 months between promotions" reconciled with the belt data. |

## Assets to generate (owner, in Flow/Veo) — prompts delivered per phase

| Phase | Asset | Use |
|---|---|---|
| 2 | Karateka cut-out, full body, front, plain gi, transparent background (from fighter-a) | Home exhibit |
| 2 | Four close-ups: seiken fist, shin, eyes, belt knot (black, low-key) | Home Act III |
| 6 | 8 s side-on run/shuffle loop of the karateka on black, locked-off camera | Find a dojo run |
| 6 | 9 city backdrop plates (generic, recognisable: Brahmaputra for Guwahati, Ganga ghats for Kanpur, etc.) | Find a dojo run |
| 8 | 4 s head-turn left→right of a sensei, locked-off, eyes to camera | Scowlby panel |
| 5 | Podium under a cloth, cloth pulled away (8 s) | Results unveiling |

Every generated asset is illustrative and is never presented as a real KKFI person or event.

## Authenticity ledger

Rule: a statement ships only if it is (S) sourced, or (C) confirmed by Shihan Vasant / KKFI. Everything
else is (R) removed or reworded. Sources are linked in the PR for each phase.

### Keep (sourced)

- Mas Oyama born 1923 in Korea (Choi Yeong-eui); died April 1994. Trained in Japan; solitary mountain
  training (Mt. Minobu). Bull fights: present as his own account / legend, not as fact.
- Kyokushin (極真) means "the ultimate truth". The name dates from about 1957; the International Karate
  Organization Kyokushinkaikan and its Tokyo (Ikebukuro) Honbu, 1964. First World Open Tournament, 1975.
- Knockdown rules: full-contact strikes to the body and legs; kicks to the head allowed; no hand strikes to
  the head or face.
- The Dojo Kun (seven lines, composed by Eiji Yoshikawa with Oyama), with the full Japanese lines (the
  site currently shows truncated halves).
- "Keep your head low, eyes high" (from Oyama's motto).
- "The heart of our karate is real fighting…" (Oyama).
- "One thousand days to forge, ten thousand to polish": credit Miyamoto Musashi, as quoted by Oyama. One
  wording only.
- 100-man kumite: Oyama's legendary test; first completed after him by Steve Arneil (1965).
- KKFI founded in 2013 by Shihan Vasant Kumar Singh; HQ Shuklaganj (Unnao), Uttar Pradesh; affiliated to
  World Kyokushin Kaikan.
- Daihyo Ryuko Take: founder and head of World Kyokushin Kaikan, 8th dan, Kagoshima.
- Dojo and city counts: live from the database only (currently 21 dojos, 9 cities), never hard-coded.

### Confirm with Shihan Vasant (shown as removed until confirmed)

- His training start (site says 1987), his rank, his title (Chairman / Country Director / Branch Chief).
- "More than 100 dojos" (the database has 21).
- Daihyo Take "trained under Sosai Oyama from 18", "founded the Kagoshima branch in 1981, now 59 dojos".
- The lineage line "from the Honbu dojo to India" (WKK is not the Ikebukuro Honbu; proposed rewording:
  "One lineage, from Sosai Oyama to India.").
- Belt times, kata per belt, the Shodan test (20-man kumite?), grading frequency, minimum age (4 or 5),
  dan titles rule.
- Seminar stats, CSR impact numbers and timeline, the three CSR testimonials, the youth guide's stats
  ("250+", "15+ cities", "93%").
- Membership price "₹295".
- The one public email (info@kyokushinfoundation.com, kyokushinkarateindia@gmail.com, or
  contact@kyokushin.in, which cannot receive mail).

### Remove or reword

- "12 million practitioners across 120+ countries" (no source we can cite; reword to "practised
  worldwide").
- "The world's strongest / most combat-effective karate" stated as fact (keep only as "called the
  strongest karate").
- Health and academic claims in the youth guide ("burns more calories than an hour of running", "studies
  show…") unless a study is cited.
- "Kyokushin Karate Federation of India" (certificates, store metadata) → Foundation.
- "Our team has been notified" (error page), "Scan QR codes" (verify metadata), "Verified & Active" on
  every dojo.
- The homepage placeholder testimonials (already hidden).

## Phasing and process

Each phase: short write-up of anything that changed from this doc → build on the branch → screenshots at
1440×900 and 390×844 → `next build`, type check, lint on touched files → owner review → next phase.

1. Design system + shared chrome + system pages.
2. Home exhibit (needs the phase-2 assets; spike with placeholder silhouette first).
3. Learn. 4. People. 5. Events. 6. Find a dojo. 7. Gallery, media, store, blog. 8. Join, sign-in, contact,
   verify, legal.

## Left to the builder

Component structure, exact timings and scroll lengths, how the existing three.js scenes are recoloured,
and the order of work inside a phase.
