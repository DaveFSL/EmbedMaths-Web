# EmbedMaths hub — build brief

One page where students, teachers and parents choose what to practise. It replaces the separate add/sub and multiplication pages and the old Daily-Add-Sub-Algorithm repo.

- Repo: `DaveFSL/EmbedMaths-Web` (GitHub Pages). Future domain: embedmaths.com.au.
- Audience: Years 4–6 students on 1:1 iPads (main target), plus teachers on a board and parents on phones.
- Routine stays the same: **estimate → work it out on paper or whiteboard → check step by step**. Students never type answers into columns.
- Plain HTML, CSS and JS. No framework and no build step. It must not depend on a CDN; put small libraries in `core/vendor/`.

---

## 1. Build order

1. **Core + Subtraction.** Hub shell, level picker, question and self-check screen, summary, link settings. Port subtraction from the existing page. This proves the pattern.
2. **Addition and Multiplication.** Port from the existing pages into topic files.
3. **Place value: × ÷ by 10, 100, 1000.** New topic with the place value slide.
4. **Converting units.** New topic that reuses the place value slide.
5. **Class link builder + QR code.**
6. **Redirects.** Hub becomes `index.html`. Old pages forward to the matching topic. Daily-Add-Sub-Algorithm forwards, then gets archived.
7. Later: Division, Time, area units, Daily mix across topics.

Build steps 1–5 in `/hub/` until they're tested with a class, then do step 6.

---

## 2. Folder layout

```
EmbedMaths-Web/
  index.html                 hub (after step 6; build in /hub/ until then)
  core/
    app.js                   router, screens, reads/writes link settings
    levels.js                level picker, "you are here", level suggestions
    player.js                question → estimate → reveal steps → self-check
    summary.js               end-of-session summary + history
    store.js                 localStorage (wrapped in try/catch)
    linkbuilder.js           teacher/parent link + QR code
    placevalue-chart.js      shared place value chart + digit slide renderer
    styles.css
    vendor/qrcode.js         small MIT QR library, stored in the repo
  topics/
    addition.js
    subtraction.js
    multiplication.js
    place-value.js
    conversions.js
    division.js              later
  icons/  manifest.webmanifest   keep existing
  embedmaths-addition-subtraction.html   → later becomes a redirect
  embedmaths-multiplication.html         → later becomes a redirect
```

### Topic file contract

Every topic registers the same shape, so adding an area means adding one file:

```js
EM.registerTopic({
  id: 'sub',                       // used in links: ?t=sub
  name: 'Subtraction',
  section: 'written',              // written | placevalue | measurement | facts
  levels: [ { id: 1, name: '2-digit, no trading', example: '87 − 34' }, … ],
  tricky: [ … ],                   // generators for the "tricky ones" option
  makeQuestion(level, opts) {},    // → question object
  estimate(q) {},                  // → { prompt, answer } or null
  buildSteps(q) {},                // → [{ title, text, highlight?, stepTag }]
  render(q, stepIndex, el) {},     // draws the written layout / chart at that step
  strategy(q) {},                  // optional mental strategy text
  errorTags: ['Trading', 'Ones', 'Tens', 'Hundreds / thousands'],  // self-check chips
  extensions(level) {}             // optional extension challenges (existing feature)
});
```

---

## 3. Screens

The mockup canvas has nine screens. Build these:

### Home (grouped by area)
- Top strip: **Set by your teacher**. Shows the practice from the link (topic, level, number of questions), a Start button and "Daily mix instead". Hide it if there's no link.
- Sections:
  - **Written methods**: Addition, Subtraction, Multiplication, Division (coming soon)
  - **Place value**: × and ÷ by 10, 100, 1000
  - **Measurement**: Converting units, Time (coming soon)
  - **Number facts**: Times tables → opens `https://davefsl.github.io/FlashFlips-Web/`
- Each tile shows "Level X of Y" from saved progress.
- Top right: **Make a class link**.
- Footer: "Progress is saved on this device only."
- On a phone: one column with the same order.

### Level picker (one per topic)
- A grid of level cards: level number, name and an example sum. Done levels get a tick; the current level is filled teal with "YOU ARE HERE".
- Bottom bar: questions **5 / 8 / 10** (segmented control), an **Add 2 tricky ones** tick box, and **Start Level N**.
- A **Custom settings (teachers)** link opens the full options (the old setup panels) for teachers who want them.
- Use real radio-style segmented controls, not checkbox-looking buttons that only allow one choice.

### Question + self-check
- Top: Stop, "Level N · Question x of y", a progress strip of coloured segments (teal = right, orange = error, grey = to do), and a "Tricky one" tag when relevant.
- Left card: the question in large type, the estimate line, then the written layout drawn by the topic's `render()`.
- Right: the step list. The current or key step is highlighted.
- After the full reveal: **How did you go?** with the buttons **I got it right** / **I made an error**. If error, show "Which step went wrong?" chips from `errorTags`. One tap each; it's optional to pick a chip.
- **Reference first.** The heading stays the question (`31 ÷ 10 = ?`, or the plain sum for written methods) until **Show solution**. That opens the complete working, the full answer, and **How did you go?** **Next question** (or **See my summary**) appears after a self-check tap. **Show me each step** is optional: Next walks the steps (one column at a time for addition and subtraction, one row at a time for multiplication, with **Show me each column** inside a row), then returns to the whole answer. Back from the first step returns there too. Estimate first is still optional. Place value asks "Will the answer be bigger or smaller?" instead of an estimate.

### Summary
- "6 out of 8. Nice work." with a row of question tiles (tick, or the error tag in orange).
- **What to watch**: the most common error tag plus a short tip from the topic. Button: **Try 4 more like these**, which makes a mini-session of the same tricky type.
- **Next time**: the level suggestion (rule below). Button: Back to home.
- Footer: "Show your teacher: this summary is saved on this device." and "Last 5 sessions: 5, 6, 5, 7, 6".

### Class link builder (teachers and parents)
- Pick topic, level, number of questions, and tick boxes for Estimate first, Mental strategy and Add 2 tricky ones.
- Shows the link, a **Copy link** button and a **QR code** so students can scan from the board.
- Extension challenges use commit-before-reveal: the student writes an answer (or taps True / False) before **Show answer** is available. A hint shows the first step only.

---

## 4. Link settings

The hub reads these on load. A link with `t=` and `lvl=` fills the "Set by your teacher" strip.

| Param | Meaning | Example |
|---|---|---|
| `t` | topic id | `sub`, `add`, `mul`, `pv`, `conv`, `mix` |
| `lvl` | level number | `6` |
| `q` | questions | `5`, `8`, `10` |
| `est` | estimate first | `1` / `0` |
| `strat` | show mental strategy | `1` / `0` |
| `tricky` | tricky questions included in `q` | `0`–`3` |
| `go` | skip home, start straight away | `1` |

Example: `…/?t=sub&lvl=6&q=8&est=1&strat=1&tricky=2`

`tricky` is part of `q`, not added on top. `q=8` and `tricky=2` is 8 questions: 6 at the level and 2 tricky.

---

## 5. Levels

### Subtraction
1. 2-digit, no trading (87 − 34)
2. 2-digit with trading (82 − 47)
3. 3-digit, no trading (586 − 243)
4. 3-digit with trading (624 − 258)
5. 4-digit with trading (7257 − 1455)
6. **Trading across zeros** (4003 − 1257): generate these on purpose
7. **Different lengths** (3456 − 87)
8. Decimals, same places (34.6 − 12.9)
9. **Decimals, different places** (12.5 − 3.47): show the placeholder zero

### Addition
1. 2-digit, no carrying
2. 2-digit with carrying
3. 3-digit with carrying
4. **Carrying into a new column** (986 + 47)
5. 4-digit, different lengths (3456 + 87)
6. Three numbers (234 + 156 + 78)
7. Decimals, different places (12.5 + 3.47)

### Multiplication
1. 2-digit × 1-digit
2. 3-digit × 1-digit
3. 4-digit × 1-digit
4. 2-digit × 2-digit
5. 3-digit × 2-digit
6. Decimal × whole (3.4 × 6, 2.35 × 4)
7. Decimal × decimal (3.4 × 0.6)

### × and ÷ by 10, 100, 1000
1. Whole numbers × 10, 100, 1000 (45 × 100)
2. Whole numbers ÷ with whole answers (4500 ÷ 100)
3. Decimals × (3.45 × 100)
4. ÷ giving a decimal (45 ÷ 100 = 0.45)
5. Placeholder zeros (0.06 × 1000, 7 ÷ 1000)
6. Missing numbers (3.2 × ___ = 320)
7. Mixed

### Converting units
1. m ↔ cm, cm ↔ mm
2. km ↔ m
3. kg ↔ g, t ↔ kg, L ↔ mL
4. Decimal amounts (2.5 km → m, 450 g → kg)
5. Compare and order mixed units (1.2 m or 115 cm?)
6. Word problems with mixed units
7. **One measurement, many ways**: "Which is not equal to 2.35 m?" or "Which unit would a builder use?"
8. Later: area units (1 m² = 10 000 cm², not 100)

### Level suggestion rule
- 7 or more out of 8 (or the same share of 5 or 10) in **two sessions in a row** → suggest the next level.
- Otherwise suggest staying on the same level.
- It only suggests. Students and teachers can always pick any level.

---

## 6. Teaching approach to keep (Dave's wording)

### Place value slide (screens 8 and 9)
- Columns: Th · H · T · O · **.** · t · h (add th for 3 dp). The decimal point has its own fixed column.
- **The digits move. The decimal point never moves.** Never teach "add a zero" or "move the decimal point".
- Step titles: **Which way?** (× makes it bigger, so the digits move left; ÷ makes it smaller, so the digits move right), then **How far?** (10 = 1 place, 100 = 2, 1000 = 3), then **Fill the gaps** (placeholder zeros in empty places between the digits and the decimal point, and a 0 in the ones place when the answer is less than 1, e.g. 0.45).
- The finished chart and the answer show first. **Show me each step** walks Which way, How far, then Fill the gaps.
- Draw an arrow showing the move ("3 places left").
- Colours: the digit that moves has a teal fill; a placeholder zero is orange with a dashed border.

### Converting units (match the laminated Metric Place Value Chart)
- Tabs: **Length** (blue), **Mass** (purple), **Capacity** (green), using the chart's colours.
- Pairs with arrows both ways: km ⇄ m (× 1000 / ÷ 1000), m ⇄ cm (× 100 / ÷ 100), cm ⇄ mm (× 10 / ÷ 10), t ⇄ kg and kg ⇄ g (× 1000), L ⇄ mL (× 1000). Highlight the pair in the question and fade the others.
- Orange box before calculating, **"Check yourself before you calculate"**:
  - "Am I going to a BIGGER unit? Then my number gets SMALLER."
  - "Am I going to a SMALLER unit? Then my number gets BIGGER."
- Then use the place value slide for the × or ÷.
- Finish with **"Say it another way"**: 2.5 km = 2500 m = 2 km 500 m.
- Level 7 uses the chart's "one measurement, five ways" idea: pick the unit that gives a number you can hold in your head.

### Written methods
- Keep "trading" as the classroom word (ACARA v9 says "regrouping"; mention it once in the teacher settings).
- Keep the crossed-out digit with the new value above it. For trading across zeros, show every 0 becoming 9.
- For multiplication, keep the carry digits visible (greyed) on the final step instead of hiding them.

---

## 7. Saved data (this device only)

`localStorage` key `embedmaths.v1`, always wrapped in try/catch:

```js
{
  progress: { sub: { level: 6, streak: 1 }, mul: { level: 4, streak: 0 }, … },
  history: [ { t:'sub', lvl:6, date:'2026-09-24', score:6, of:8, errors:{ Trading:2 } }, … ],  // keep last 30
  extensions: { sub: { score: 5, of: 8 } }
}
```

No accounts and no server. A class dashboard would need a back end; not in scope.

---

## 8. Reuse from the existing pages

Port these instead of rewriting:

- `embedmaths-addition-subtraction.html`: `buildAddSteps`, `buildSubSteps`, `renderAlgo`, `mentalStrategy`, `genExtBank` / `genExtProblems`.
- `embedmaths-multiplication.html`: `buildShortSteps`, `buildLongSteps`, `renderShortAlgo`, `renderLongAlgo`, `buildMentalStrategy`, and the extension bank.

---

## 9. Bugs and fixes to carry over

- **The generators never make the hardest cases.** Both numbers are always the same length and decimals always have the same number of places. Generate them on purpose for the levels above: different lengths, trading across zeros, different decimal places.
- **Extension answers stay hidden until the student commits.** Each challenge has a My answer box (True / False buttons on those questions). Show answer stays unavailable until something is entered, and says "Write your answer first" if it is tapped early. The reveal puts their answer beside the correct one. A hint shows the first step only, not the answer. There is no teacher PIN.
- The session badge text reads "mixeddp decimals" and "4d"; replace these with the level name.
- Choosing "1dp × 1dp" with 2-digit × 1-digit quietly becomes 1dp × whole. Level-based generation removes this.
- The mental strategy's "round and adjust" picks awkward numbers (e.g. 1455 → 1460). Round to the nearest number that makes the sum easy (7257 − 1457 = 5800, then + 2).
- Multiplication step text repeats itself ("STEP 1 · Step 1: …"). Group the steps as Row 1 / Row 2 / Add.
- On phones the background gradient cuts off partway down the long settings page.
- Checkbox-style buttons that only allow one choice → use segmented controls.

---

## 10. Look and feel

- Colours: teal `#0E5D66` (main), ground `#F4F8F7`, ink `#16302F`, muted text `#4F6B6D`, orange `#B85A1E` (errors, trading, placeholders; tint `#FFF6EF`). Length blue `#1D5A9E`. Mass purple and capacity green to match the laminated chart.
- Fonts: **Bricolage Grotesque** for headings, **Lexend** for body text and numbers, with `font-variant-numeric: tabular-nums` so columns line up. Save the font files in the repo; don't load them from Google at runtime.
- Tap targets at least 44 px. Tested at iPad landscape (1180 × 820) and phone (390 wide).
- Icons: simple inline SVG line icons, no emoji.

---

## 11. Done when (steps 1–5)

- [ ] A link like `?t=sub&lvl=6&q=8` opens with the "Set by your teacher" strip filled in, and Start runs that session.
- [ ] Subtraction levels 1–9 each make the right kind of question (check 50 generated per level).
- [ ] Self-check and summary work, and the summary names the most common error step.
- [ ] Progress and history survive closing and reopening Safari on an iPad.
- [ ] × ÷ 10/100/1000 and conversions show the place value slide with placeholder zeros.
- [ ] The QR code from the link builder opens the right session when scanned on an iPad.
- [ ] It loads nothing from outside the repo (no CDN or Google Fonts requests). Full offline use would need a service worker, which is optional.
- [ ] The old page URLs still work (redirects in place, step 6).
