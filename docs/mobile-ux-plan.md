# Mobile UX plan

Goal: make Fun Mandarin usable on phones — less cramped, games playable, navigation that doesn’t wrap into a dense header.

## Problem summary

Main causes:

1. **Site-wide padding bug** — `app/globals.css` overrides `.px-4` to ~72px per side (Tailwind’s normal is ~16px). On a ~375px phone, content width collapses to ~230px.
2. **Landing mobile menu hidden behind the page** — On `/`, the mobile menu control (hamburger / menu icon) opens Sign In / Sign Up, but the dropdown is clipped or stacked under page content. Root cause in `app/page.tsx`: the header inner bar uses `overflow-hidden`, which clips the absolutely positioned menu panel.
3. **Desktop-first layouts** — fixed-size game slots, a 9-column typing board, and portal nav that wraps instead of collapsing.

Related: `.h-16` / `.h-17` in the same file inflate logos/header height and eat vertical space.

---

## Phases

### Phase 0 — Fix global CSS overrides (P0) ✅ done

**Files:** `app/globals.css`

- Removed `.px-4`, `.h-16`, `.h-17` overrides so Tailwind defaults apply (`px-4` ≈ 16px, `h-16` = 4rem, `h-17` = 4.25rem)
- Keep large gutters only where intentional, via `md:px-*` (or similar) on specific layouts — defer any follow-up spacing tweaks until after phone check
- Spot-check landing, login, student dashboard after the change

**Outcome:** Usable content width everywhere.

---

### Phase 0b — Landing mobile menu visible & tappable (P0) ✅ done

**File:** `app/page.tsx` (header `<details>` mobile menu)

**Bug:** Opening the mobile menu shows Sign In / Sign Up, but the panel is hidden behind the page (clipped / under content).

**Fix applied:**

- Removed `overflow-hidden` from the header bar that wraps the logo + menu so the dropdown can paint outside the bar (desktop nav keeps its own `overflow-hidden`)
- Raised stacking on the `<details>` + panel (`z-[60]`) so it sits above hero content

**Outcome:** Sign In and Sign Up are fully visible and tappable on phone.

---

### Phase 1 — Games playable on phones (P1) ✅ done

**Files:**

- `components/mandarin-typing-game.tsx`
- `components/typing-game.tsx`

**Mandarin typing game — applied**

- Hanzi slots use flex-wrap with readable sizes (no fixed 56px grid crush)
- Tighter mobile spacing; content aligns to top on small screens (better with keyboard)
- Finish-screen score cards stack on narrow widths
- Full-width primary actions with ~44px+ min height on mobile

**Assignment typing game — applied**

- Word board: `grid-cols-3` → `sm:grid-cols-5` → `md:grid-cols-9` (game logic / 18-word queue unchanged)
- Smaller tile text + live-stats gap on phone; finish CTAs stack

**Outcome:** No crushed tiles or horizontal overflow while playing.

---

### Phase 2 — Portal chrome (P2) ✅ done

**File:** `components/layout/marketing-shell.tsx` (student / teacher / admin)

**Applied:**

- Multi-link portals (admin’s 6 items): desktop keeps horizontal nav; mobile uses a hamburger that expands a panel inside the header card (not clipped behind the page)
- Single-link portals (student / teacher Dashboard): stay inline on all sizes — no unnecessary hamburger
- Sign Out stays in the header row; label hides on very small screens (icon + screen-reader text) to keep one clean row
- Menu closes on route change / link tap

**Outcome:** Navigation stops competing with content on phone.

#### Phase 2 spot-check

**Desktop (≥768px):**

1. Admin — all 6 links still in a horizontal header row; active state still works
2. Student / teacher — Dashboard link + Sign Out unchanged
3. Sign Out still shows full label

**Phone or DevTools (&lt;768px):**

1. Admin — header is one row: logo | menu | sign-out icon; **no** wrapping multi-row link strip
2. Tap menu — panel opens **below** the bar with all 6 links; active link highlighted
3. Tap a link — navigates and menu closes
4. Student / teacher — still see Dashboard inline (no hamburger); Sign Out reachable
5. Sign Out still works (icon-only is OK on narrow widths)

#### Phase 2 follow-up — fuller mobile width ✅

Portal + landing chrome on small screens is closer to edge-to-edge:

- Header: full-bleed on mobile (no floating side gap); rounded floating card returns at `sm+`
- Main: `px-3 py-4` on mobile (was `px-4 py-8`)
- Games: less outer padding; softer full-bleed card on xs
- Auth pages: tighter mobile padding

Desktop keeps the inset / rounded look.

**Spot-check:** phone — content uses most of the width; desktop — floating header still inset.

---

### Phase 3 — Student + course surfaces (P3) ✅ done

**Files:** `chapter-tabs.tsx`, `chapter-detail-content.tsx`, `assignment-flow.tsx`, `assignment-retry-button.tsx`, `app/course/[id]/page.tsx`

**Applied:**

- Slimmer chapter tabs on xs (shorter min-height, smaller icons/padding; descriptions still `sm+`)
- Full-width assignment CTAs on phone (`Start` / `Continue` / hanzi / retry / locked)
- Course detail stats: stack to 1 column on mobile, 3 columns from `sm+`
- Slightly tighter chapter / course headings on phone

**Outcome:** Less vertical density, clearer next actions.

#### Phase 3 spot-check

**Desktop (≥640px):**

1. Chapter tabs still large with descriptions
2. Assignment buttons sit beside text (not forced full-width)
3. Course stats still 3-across

**Phone or DevTools (~375px):**

1. Student chapter — tabs are compact (one short row), not huge cards
2. Assignment Start / Continue / Retry are full-width and easy to tap
3. Course detail (`/course/...`) — stats stack vertically, readable; title not oversized

---

### Phase 4 — Touch & polish (P4) ✅ done

**Applied:**

- Shared `Button` sizes: ~44px (`h-11`) on mobile, previous heights from `md+`
- `viewportFit: 'cover'` in `app/layout.tsx` so `env(safe-area-inset-*)` works on notched phones
- Safe-area padding on portal shell, loading shell, landing header, and both games
- Games already top-align on small screens so keyboard doesn’t hide primary actions

**Outcome:** Comfortable touch targets + content clears notches / home indicator.

#### Phase 4 spot-check (prefer real phone)

**Desktop:** buttons return to prior height (`md:h-9`); layouts unchanged.

**Phone (~375px and ~390px):**

1. Landing / dashboard — header clears notch; content not under home indicator
2. Tap primary buttons — feel ~thumb-sized
3. Hanzi + typing games — open keyboard; Submit / input still reachable
4. Quick smoke: `/` → login → student chapter → start assignment

---

## Priority order

| Priority | Work | Why |
|----------|------|-----|
| P0 | Fix `globals.css` overrides | Unlocks width for everything |
| P0 | Landing mobile menu stacking (`app/page.tsx`) | Sign In / Sign Up blocked on phone |
| P1 | Mandarin + typing game layouts | Core learner experience |
| P2 | MarketingShell mobile nav | Admin/teacher/student chrome |
| P3 | Chapter/course polish | Secondary density |
| P4 | Touch targets / safe areas | Quality finish |

## Out of scope (for now)

- Full brand / visual redesign
- Separate mobile app
- New breakpoint system — keep existing `sm` / `md` / `lg` and fix overrides + layouts

---

## How to spot-check (desktop vs phone)

Use **both**:

| Where | Best for | Not enough alone for |
|-------|----------|----------------------|
| **Desktop browser** (full width) | Regression — did we break desktop layouts? | Mobile menu, cramped phone gutters, real touch |
| **Desktop DevTools** device mode | Fast layout iteration at ~375px | Real keyboard, notches, Safari quirks |
| **Real phone** (same Wi‑Fi) | Final “does it feel right?” for each phase | — |

**Rule of thumb:** after each phase, do a quick desktop check, then phone (or DevTools first if phone is inconvenient). For Phase 0b / games / keyboard issues, prefer a **real phone**.

### Spot-check by phase

#### Phase 0 (padding / heights) — do both desktop + phone

**Desktop (full window, ≥1024px):**

1. Open `/` — hero and sections still look balanced (not oddly tight or broken)
2. Open `/login` — card still centered, page not sparse in a broken way
3. Student dashboard (if logged in) — header + content still aligned

**Phone or DevTools (~375px width):**

1. Open `/` — side gutters feel like ~16px, content wider than before (not a thin column)
2. Header logo not oversized / crushing the bar
3. `/login` — form uses most of the width comfortably

#### Phase 0b (landing menu) — primarily phone / narrow viewport

Desktop full-width uses Sign In / Sign Up buttons in the header (no hamburger). You won’t see this bug on wide desktop.

**Phone or DevTools width &lt; 768px:**

1. Open `/`
2. Tap/click the **menu icon** (top-right of the floating header)
3. Confirm the panel sits **on top** of the hero (not clipped / not behind the page)
4. Confirm you see nav links + **Sign In** + **SignUp**
5. Tap **Sign In** → lands on `/login`
6. Back → open menu → tap **SignUp** → lands on `/signup`
7. Optional: tap a section link (e.g. Kursus) → page scrolls; menu can stay open (ok for now)

**Desktop regression:** at full width, header still shows inline Sign In / SignUp; nav links still visible.

#### Phase 1 (games) — desktop + phone (prefer real phone for keyboard)

**Desktop (≥768px / full window):**

1. Mandarin game — slots still large in a row; Submit / next still centered (not forced full-width)
2. Typing game — 9 columns on `md+`; space/enter still advances words as before
3. Finish screens look balanced side-by-side

**Phone or DevTools (~375px):**

1. Chapter → Assignment A (hanzi) game
2. Long answers: slots wrap instead of crushing
3. Tap input → keyboard open → Submit / Soal Berikutnya still reachable
4. Finish: score cards stacked; Dashboard / Retry full-width
5. Assignment B typing: tiles readable in 3 columns
6. Type with space/enter — highlight advances; after 18 words board still refreshes
7. Live KPM / Akurasi don’t force a huge gap

**Unchanged on purpose:** scoring, IME/hanzi filtering, typing board shift every 18 words.

#### Phase 2 (portal chrome) — desktop + phone

**Desktop (≥768px):**

1. Admin — 6 links still horizontal; active highlight works
2. Student / teacher — Dashboard + Sign Out unchanged

**Phone or DevTools (&lt;768px):**

1. Admin — single header row (logo | menu | sign out); open menu → all links visible in panel
2. Tap a nav link → navigates; menu closes
3. Student / teacher — Dashboard stays inline (no hamburger); Sign Out works

#### Phase 3 (student + course) — desktop + phone

**Desktop (≥640px):**

1. Chapter tabs still show descriptions; CTAs beside copy
2. Course stats still 3-across

**Phone (~375px):**

1. Chapter tabs compact (no tall dual cards)
2. Start / Continue / Retry full-width
3. `/course/[id]` stats stacked and readable

#### Phase 4 (touch + safe-area) — prefer real phone

**Desktop:** button heights look like before at `md+`.

**Phone (~375 / ~390):**

1. Header clears notch; bottom content clears home indicator
2. Primary buttons feel easy to tap
3. Games with keyboard open — Submit / input reachable
4. Smoke: landing → login → chapter → game

---

## How to open the site on your phone

### 1. Start the dev server so the network can reach it

From the project root:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

By default `next dev` may only listen on localhost; binding to `0.0.0.0` lets other devices on your network connect.

### 2. Find your Mac’s local IP

```bash
ipconfig getifaddr en0
```

If that prints nothing (e.g. you’re on Ethernet or a different interface), try:

```bash
ipconfig getifaddr en1
# or list interfaces:
ifconfig | grep "inet "
```

You want an address like `192.168.x.x` (not `127.0.0.1`).

### 3. Open on your phone

On Safari (iOS) or Chrome (Android):

```text
http://YOUR_IP:3000
```

Example: `http://192.168.1.42:3000`

Phone and Mac must be on the **same Wi‑Fi**. Guest networks or client isolation can block this.

### 4. If it won’t load

- Confirm the Mac firewall allows Node/incoming connections for that port
- Confirm you’re not on VPN (or try with VPN off)
- Retry with a tunnel if LAN access is blocked (optional):

```bash
npx localtunnel --port 3000
# or: ngrok http 3000
```

Use the HTTPS URL the tool prints on your phone.

### 5. Desktop DevTools (quick narrow check)

Chrome → DevTools → Toggle device toolbar → iPhone / Pixel presets (~375–390px).

Good for Phase 0 / 0b layout; still re-check menu + touch on a real phone when you can.

---

## Definition of done (per phase)

- Content has comfortable side padding on ~375px width
- Landing mobile menu: Sign In / Sign Up fully visible and tappable (not clipped under the page)
- Primary learner path works with one hand / thumb reach for main CTAs
- Games playable without horizontal scroll of the whole page (slot scroll OK if intentional)
- Portal header is a single usable row + menu on small screens (Phase 2+)
- Primary buttons ~44px on mobile; safe-area clears notch / home indicator (Phase 4)
- Desktop layouts still look intentional after each change (no accidental regressions)

## Plan status

All phases **0 → 4** are implemented. Remaining work is optional iteration from real-device feedback.

### Follow-up — keyboard keeps page static ✅

Assignment games no longer jump when the mobile keyboard opens:

- Root viewport uses `interactiveWidget: "overlays-content"` (keyboard overlays instead of resizing the page)
- `useStableKeyboardViewport` locks body scroll on hanzi / typing games
- Game shells are `fixed inset-0`; focus uses `preventScroll: true`

**Spot-check on phone:** open an assignment → tap input → keyboard appears → page content stays put (may overlay bottom; scroll inside the game card if needed).
