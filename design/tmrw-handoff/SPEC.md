# tmrw web app: build spec (laptop, v1)

Hand this folder to Claude Code. Read this file first, then `prototype/prototype.dc.html` for exact values.

- **This file:** what to build and how it should feel.
- **The prototype:** the working reference. Every number in this spec comes from it.

---

## 1. What tmrw is

tmrw is a money planner for small shops that sell through PayPal. It reads PayPal history and lays out every bill, supplier order and auto-debit. It finds days where money due is more than money available ("short days") a week early. Then it helps the owner fix them. Money only moves when the owner taps.

**Demo story, used everywhere:**
- **Shop:** Dunder Mifflin & Co., a café-bakery.
- **People:** Penny is the owner. Flo (head baker), Marco (barista) and Pam (front counter) are staff.
- **Suppliers:** Bean There (coffee beans, about $400 every 10 days) and Oat of Office (oat milk, $180 bank auto-debit on the 15th).
- **Customer who owes:** Ivory & Vow, a wedding planner, owes $240.
- **Today:** Thu 5 Nov.
- **The short day:** Thu 12 Nov. Rent $1,500 plus beans $400 is $1,900 due, with $1,780 free above the $200 cushion, so it is $120 short.

**Writing rules:**
- Short sentences, real amounts, dates written like "Thu 12 Nov".
- No exclamation marks.
- Use a hyphen, never a middle dot ("Bean There - coffee beans").
- No lightning-bolt icons.
- Anything simulated says "Simulated".

---

## 2. Flow (one screen, driven by scroll)

Laptop first: a 1440 × 900 frame. The page does not scroll. A mouse wheel or trackpad "notch" moves one step forward or back. Debounce it to 1 step per 1100 ms. Up and down arrow buttons (bottom right) do the same.

| # | Stage | How you get there | What happens |
|---|---|---|---|
| 1 | Login | App opens | Station painting, blurred (10px blur, brightness .85), behind a glass card. |
| 2 | Setup | "Continue with PayPal" / "Continue with email" | 9 one-tap steps over the same blurred painting. |
| 3 | Station | "Start my day" on step 9 | The station painting, unblurred, with wind and light (see 4.1). |
| 4 | Train | Scroll down | The train rolls in, stops, and the doors slide open (see 4.2). |
| 5 | Seat: Calendar | Scroll down | Zoom through the door into the window seat (see 4.3). |
| 6 | Seat: Ventures | Scroll down | The scenery keeps moving. The Calendar icon slides out left and Ventures slides in from the right. |
| 7 | Seat: Insights | Scroll down | Same transition. |

Scrolling up reverses each step. Going back up from a seat to the train shows the doors already open.

**Clicking a window icon opens that window** (see section 6). While a window is open, the wheel scrolls the window's own content and does not change stage.

---

## 3. Coordinates

Every painting is 1672 × 941. Draw each one in a 1600 × 900 box at `left: -80px` (cover-fit, centred) inside the 1440 × 900 frame. All positions below are percentages of that 1600 × 900 box, so they hold at any size.

---

## 4. Scenes and animation

### 4.1 Station (`assets/scenes/station-bench.webp`)

- **Slow drift (Ken Burns):** scale 1 → 1.045, translate (-0.6%, -0.4%), 26s, ease-in-out, infinite alternate.
- **Wind:** 12 small leaves, each 12 × 7px with border-radius `12px 0 12px 0`. Colours: #5E9E3C, #7DB24A, #A7C35A, #4C8A34.
  - Start positions: left 60–105%, top 5–65%.
  - Keyframes: fade in at 10%, then translate (-520px, 90px) rotate 260deg at 50%, then (-1100px, 40px) rotate 560deg at 100%, fading out at 90%.
  - Duration 9–17s, linear, staggered negative delays.
- **Lamp glow:**
  - A 140px radial gradient (rgba(255,236,190,.55) → transparent at 65%) at left 25.5%, top 9%.
  - Opacity pulses 1 → .55 → 1 over 4s.
- **Hint:** "Scroll to continue" plus a chevron, bottom centre, white text with a dark text-shadow. The chevron bobs 6px over 1.8s.

### 4.2 Train arrives (`train-doors-open.webp` + layers)

**Layers, back to front:**
1. **`scenes/train-doors-open.webp`:** full frame.
2. **Door leaves:** a door box at left 39.89%, top 32.31%, width 20.27%, height 43.78%, with `overflow: hidden`.
   - It holds `layers/door-left.webp` (left half) and `layers/door-right.webp` (right half).
   - Both are cut from the doors-closed painting, so when closed they match it pixel for pixel.
3. **Moving train band:**
   - The band box is at top 21.79%, height 58.98%, full width, `overflow: hidden`.
   - Inside it is a strip of 3 copies of `layers/train-band-doors-closed.webp`, each 1600px wide (4800px total).

**Timeline (from the moment you scroll down from the station):**

| t (ms) | State | Band strip | Motion blur |
|---|---|---|---|
| 0 | start | translateX(0), no transition | horizontal blur 9px |
| 60 | moving | transition to translateX(-3200px) over 4600ms, `cubic-bezier(.18,.6,.2,1)` | 9px |
| 2100 | slowing | (still moving) | 3px |
| 3300 | settle | (still moving) | none |
| 4700 | stopped | band hidden (opacity 0). It now matches the painting underneath. | none |
| 5200 | open | door leaves translateX(-101%) / (+101%) over 1900ms, `cubic-bezier(.5,0,.2,1)` | none |

- Motion blur is an SVG `feGaussianBlur stdDeviation="9 0"` (then "3 0"), so it blurs horizontally only.
- The station layer stays underneath and does not fade, so nothing flashes.

### 4.3 Into the seat

- **Zoom:** the train layer scales to 3.2 around the door centre (transform-origin 50.1% 54.7%) over 1.1s, `cubic-bezier(.7,0,.3,1)`. Its opacity fades over .5s, starting after .6s.
- **Seat fade-in:** the seat layer fades in over .8s, starting after .55s.

**Seat layers, back to front:**
1. **Sky strip:** `layers/scenery-sky-tile.webp`, repeat-x. Box top 63px, height 387px, `background-size: auto 100%`.
   - Animate background-position-x 0 → -1356px over **140s**, linear, infinite. The clouds drift slowly.
2. **Ground strip:** `layers/scenery-ground-tile.webp`, repeat-x. Top 410px, height 190px.
   - Same animation over **9s**. The fields pass fast, like parallax from a moving train.
3. **Seat painting with glass cut out:** `layers/seat-window-glass-cut.webp`. All three windows are see-through. The seat backs and the plate above the main window stay solid.
4. **Gentle rocking:** the whole seat group moves translateY 0 → 1.4px → -0.6px over 3.4s, ease-in-out, infinite. No rotation, because rotation shows the edges.

**Window icons (one per seat):**
- 250 × 250, centred on the main window at (800px, 322px) in the 1600 box, with `drop-shadow(0 18px 30px rgba(10,30,60,.3))`.
- Under each icon is a dark pill label (rgba(22,22,24,.82), blur 12px, white 16px semibold, height 40px).
- **Moving between seats:** each icon sits at translateX((index - activeSeat) × 820px). Inactive icons have opacity 0.
  - Transition: transform 1.3s `cubic-bezier(.45,.05,.2,1)`, opacity .9s.

| Seat | Name | Icon | Opens |
|---|---|---|---|
| 0 | Calendar | `icons/calendar.png` (white page, red header "THU", big "5", metal rings) | Calendar window |
| 1 | Ventures | `icons/ventures.png` (arrow in a red-and-white target) | Ventures window (growth plans) |
| 2 | Insights | `icons/insights.png` (magnifying glass showing a red pulse line) | Insights window (the business told as a story) |

### 4.4 Always-on dock (inside the train only)

- **Position:** top centre, top 12px, gap 10px. It sits just above the window frame.
- **Each item:** a pill, height 46px, padding `0 18px 0 10px`, background rgba(22,22,24,.86), `backdrop-filter: blur(16px)`, white 15px semibold, shadow `0 10px 30px rgba(0,0,0,.3)`. Inside: a 30px icon (the object itself, no tile behind it), then the label.
- **Order:** Settings (`settings.png`, machined gear), Daily brief (`brief.png`, sun on the horizon), Requests (`requests.png`, envelope with a letter; red badge "3" at top 5px, left 28px), Pro (`pro.png`, cut sapphire).
- **Nav arrows:** bottom right, 40px glass circles. Between them are 5 dots for the stages; the active dot is 18px tall.

---

## 5. Login and setup

**Glass card:**
- Background rgba(255,255,255,.82), `backdrop-filter: blur(18px)`, radius 28px, shadow `0 30px 80px rgba(0,0,0,.25)`.
- Login card is 420px wide. Setup card is 660px.

**Wordmark:**
- "tmrw" in Plus Jakarta Sans ExtraBold Italic, 58px, letter-spacing -1.5px.
- "tm" is #003087 and "rw" is #009CDE (PayPal's two blues, split the way "Pay" and "Pal" are).
- Tagline under it: "Know tomorrow before it arrives."

**Setup:** a progress label "Setting up your calendar: N of 9" and a 4px bar (#0071E3, width animates over .5s). The primary button says "Looks right" ("Continue" on step 2, "Start my day" on step 9). Steps 7 and 8 also have "Skip". Each step fades up as it appears.

| # | Title | Content |
|---|---|---|
| 1 | Your business | Name field. Type chips: Bakery and café selected. Busiest days: Sat and Sun selected. Seasons: Christmas and Weddings selected. |
| 2 | Connect PayPal | A card with "Connected - 14 months of history read" in semibold green, and a solid green tick circle. |
| 3 | Your regular payments | "8 found in your PayPal history." Two sections in one table, PAYMENT / AMOUNT / WHEN (+ how it's paid) / DATE. GOING OUT: 6 rows, each with a Fixed date / Can move switch, total "about $4,839". COMING IN: Daily sales $180-$320 (PayPal, more on weekends) and Ivory & Vow - wedding cake $240 (invoice, due 18 Nov, usually 5 days late), total "about $6,900". |
| 4 | Any payments you make or receive outside PayPal? | "Add them so your calendar is complete." Oat of Office - oat milk (Out). Weekend market - cash sales (In). Buttons: + Add a payment, Upload a statement or bill. |
| 5 | Who pays you later? | Ivory & Vow - wedding planner, "usually pays 5 days late". A Payment reminders toggle. Tone: Gentle / Firm. |
| 6 | Your safety cushion | $200, with a slider from $0 to $1,000. |
| 7 | Anything you're planning to grow? | Stall at the Winter Makers' Market, $300, Sun 6 Dec. Launch Christmas cookie boxes, $450, Sat 12 Dec. |
| 8 | Your team | Staff only, added directly with no invitations: Flo (Head baker), Marco (Barista), Pam (Front counter). |
| 9 | Your daily brief | Time 8:00 AM. Where: pick any of In the app, Notification, WhatsApp, Email. |

---

## 6. Windows (the work surfaces)

Opening any seat icon or dock item opens a window. Windows switch from the painted world to a calm, Apple-style UI.

- **Unfocus** (the default): the window floats over the seat, which is dimmed with rgba(8,14,10,.42). Radius 22.
  - **Seat windows** (Calendar, Ventures, Insights) are large: left 70, top 40, 1300 × 820.
  - **Dock windows** (Settings, Daily brief, Requests, Pro) are smaller: left 310, top 170, 820 × 560.
- **Placeholder content for now:** the item's icon (200px in seat windows, 140px in dock windows), its title, and "Coming soon."
- **Focus:** the window fills the 1440 × 900 frame with radius 0. Toggle with the Focus / Unfocus button in the header. Animate left, top, width, height and radius over .5s, `cubic-bezier(.2,.8,.2,1)`.
- **Opening:** scale .96 → 1 and fade in over .55s.
- **Header** (56px): a tinted icon chip, the title, the Focus/Unfocus button, and a close button.

Windows: Calendar, Ventures, Insights, Settings, Daily brief, Requests, Pro. **They will be designed separately as static screens (next step).** The prototype has first versions you can use as a content reference.

---

## 7. Design tokens

| Token | Value |
|---|---|
| UI font | `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', sans-serif`, letter-spacing -0.01em |
| Wordmark | Plus Jakarta Sans 800 italic |
| Text primary | #1D1D1F |
| Text secondary | #6E6E73 (use #3A3A3C with weight 500+ for anything important) |
| Window background | #F5F5F7 |
| Card | #FFFFFF, radius 18, shadow `0 1px 2px rgba(0,0,0,.04), 0 4px 18px rgba(0,0,0,.05)` |
| Primary button | #0071E3, white, 44px tall, pill |
| Ghost button | rgba(0,0,0,.05) |
| PayPal navy / blue | #003087 / #009CDE (wordmark), #0070E0 (PayPal button) |
| Money in | #34C759 (dots), #1E7F3C (text) |
| Money out | #FF3B30 (dots), #C4161C (text) |
| Short day | 1.5px inset #FF3B30 outline on the day cell, plus "Short $120 - Fix" in red |
| Dark pill | rgba(22,22,24,.86) + blur 16px |
| Segmented control | track rgba(0,0,0,.06), selected item white with shadow `0 1px 3px rgba(0,0,0,.12)` |
| Reduced motion | `prefers-reduced-motion`: stop every loop (wind, drift, scenery, rocking). Transitions stay instant. |

---

## 8. Asset list

| File | Use |
|---|---|
| `assets/scenes/station-bench.webp` | Station background, also blurred behind login and setup |
| `assets/scenes/train-doors-open.webp` | Train background (doors open) |
| `assets/layers/train-band-doors-closed.webp` | The moving train band (rows 205–760 of the doors-closed painting) |
| `assets/layers/door-left.webp`, `door-right.webp` | Door leaves cut from the doors-closed painting (x 667–837 and 836–1006, y 304–716) |
| `assets/layers/seat-window-glass-cut.webp` | Seat painting with transparent glass |
| `assets/layers/scenery-sky-tile.webp`, `scenery-ground-tile.webp` | Seamless scenery strips (mirrored, so they loop) |
| `assets/scenes/seat-window-full.webp` | Seat painting without the cut (for posters or fallback) |
| `assets/icons/*.png` | 256px icons with transparent backgrounds |
| `source-art/` | The original generated paintings |
| `scripts/` | The Python (Pillow + numpy) used to cut the layers and draw the icons, so they can be regenerated at higher resolution |

---

## 9. Suggested build (Next.js)

- **Scenes:** one `<Stage>` client component holds `stage`, `seat`, `arrivalState` and `openWindow`.
  - Each scene is an absolutely positioned layer with CSS transitions, as in the prototype.
  - Framer Motion is optional; plain CSS transitions match the timings above exactly.
- **Wheel:** handle with a 1100 ms debounce; ignore it while a window is open or during login and setup. Also support keyboard ↑/↓ and touch swipe.
- **Arrival:** a small timeline array of `[ms, state]` run with `setTimeout`, cleared on unmount or when the stage changes.
- **Windows:** separate route segments or components, rendered in a portal above the scene.
- **Images:** serve `.webp` with `width` and `height` set, and preload the next scene while the current one plays.
- **Phone:** not designed yet. Plan for the same stages with swipe in place of scroll, and a bottom dock.

---

## 10. Prototype file

`prototype/prototype.dc.html` is a single-file component in a canvas format:
- `{{…}}` are template holes, `<sc-for>` is a loop and `<sc-if>` is a conditional.
- The `Component` class at the bottom holds all state, data and timings.
- Image paths already point to `../assets/...`.

Treat it as an executable spec: copy values from it rather than guessing.
