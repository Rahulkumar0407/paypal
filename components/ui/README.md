# components/ui/

**Owner:** Person 1. The NeverShort design system. See it live at `/design`.

**The four signature elements (use these, don't rebuild them):**
- `HeadlineSentence`: the forecast read aloud, large Fraunces. Text comes from `buildHeadline()` (lib/forecast). `PageSentence` opens every other page.
- `MoneyStrip`: 14 days: the day, a coloured block with the closing balance, the condition word. Phone: scrolling row; laptop: two rows of seven.
- `RefereeCard`: a tilted card plus the word: Approved (green), Needs your OK (amber), Blocked (red).
- `Receipt`: a thermal receipt for a Guard decision: mono, dashed dividers, zig-zag edges, PASS / FAIL / N/A, BLOCKED stamp.

- `BanknotePanel` (and `NOTE_ROOM`): the deep green engraved note that holds the home screen's headline and strip. Its medallion, seal and signatures appear by the note's own width (container queries).

**Parts:** `Money` and `BigAmount` (whole dollars, exact cents, shortfalls rounded up), `Button` / `ButtonLink`
(primary, secondary, quiet), `Card`, `CardTitle`, `SimulatedTag`, `SandboxTag` (real PayPal sandbox, no real money), `ReadyMeter`, `EmptyState`, `LoadingState`,
`ErrorState`, and `meaning.ts` (the only state-to-colour mapping).

**Rules:** colours only from the tokens in `app/globals.css`; meaning colours are fills, never small text on white;
every colour travels with a word; only two animations (tile turns green, stamp lands), both off for reduced motion.
