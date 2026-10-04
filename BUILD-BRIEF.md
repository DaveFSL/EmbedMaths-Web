# EmbedMaths hub — build brief

One page where students, teachers and parents choose what to practise. It replaces the separate add/sub and multiplication pages and the old Daily-Add-Sub-Algorithm repo.

- Repo: `DaveFSL/EmbedMaths-Web` (GitHub Pages). Live domain: https://embedmaths.com.au
- **Live (steps 1–6 done):** https://embedmaths.com.au/hub/ — the hub stays in `/hub/` so existing links and QR codes keep working. The link builder, QR card and Copy message use the current address (`location.origin` + path), not a fixed domain.
- Audience: Years 4–6 students on 1:1 iPads (main target), plus teachers on a board and parents on phones.
- Routine stays the same: **estimate → work it out on paper or whiteboard → check step by step**. Students never type answers into columns.
- Plain HTML, CSS and JS. No framework and no build step. It must not depend on a CDN; put small libraries in `core/vendor/`.
- **Version line.** Home shows `VERSION` from `hub/index.html`. The same id is in `hub/about.html`. It is the short commit id, and it is what refreshes cached scripts and styles. Every commit that changes the app must update both, so the line matches what is live. `.github/workflows/version.yml` does this on each push to `main`: it writes that commit's short id into both pages, deploys the site, and pushes a "Stamp version …" commit so the repo matches the live page. A commit cannot contain its own id, so the line shows the app commit, and the stamp commit only records it.

---

## 1. Build order

1. **Core + Subtraction.** Hub shell, level picker, question and self-check screen, summary, link settings. Port subtraction from the existing page. This proves the pattern.
2. **Addition and Multiplication.** Port from the existing pages into topic files.
3. **Place value: × ÷ by 10, 100, 1000.** New topic with the place value slide.
4. **Converting units.** New topic that reuses the place value slide.
5. **Class link builder + QR code**, and Daily mix across the topics that are ready.
6. **Redirects (done).** Root `index.html` forwards to `/hub/` and keeps the query string. The old add/sub and multiplication pages forward to `/hub/?t=sub` and `/hub/?t=mul`; the originals are in `/archive/`. The hub was not moved.
7. **Division (done).** Short division, 11 levels, in `topics/division.js`. Measurement on Home is Converting units only. Time is not a tile and not in Set practice.
8. **Fractions (done).** Eight levels in `topics/fractions.js`. Home has a Fractions tile.
9. **Percentages (done).** Six levels in `topics/percentages.js`. Home has a Percentages tile. Fractions–decimals–percentages stays as Coming soon.

---

## 2. Folder layout

```
EmbedMaths-Web/
  index.html                 forwards to /hub/, keeping the query string
  hub/                       the app (do not move; links and QR codes point here)
    core/
      app.js                 router, screens, reads/writes link settings
      levels.js              level picker, "you are here", level suggestions
      player.js              question → estimate → reveal steps → self-check
      summary.js             end-of-session summary + history
      store.js               localStorage (wrapped in try/catch)
      linkbuilder.js         teacher/parent link + QR code
      placevalue-chart.js    shared place value chart + digit slide renderer
      styles.css
      vendor/qrcode.js       small MIT QR library, stored in the repo
    topics/
      addition.js
      subtraction.js
      multiplication.js
      place-value.js
      conversions.js
      division.js            short division, 11 levels
      fractions.js           eight fraction levels
      percentages.js         six percentage levels
    index.html               links the manifest and apple-touch-icon
  archive/                   original add/sub and multiplication pages
  icons/  manifest.webmanifest   icons stay here; start_url and scope are https://embedmaths.com.au/hub/
  embedmaths-addition-subtraction.html   forwards to /hub/?t=sub
  embedmaths-multiplication.html         forwards to /hub/?t=mul
```

### Topic file contract

Every topic registers the same shape, so adding an area means adding one file:

```js
EM.registerTopic({
  id: 'sub',                       // used in links: ?t=sub
  name: 'Subtraction',
  homeExample: 'e.g. 5 002 − 1 738',  // third line on the home tile
  instruction(q) {},               // optional bold line above the question
  section: 'written',              // written | placevalue | measurement | facts
  levels: [ { id: 1, name: '2-digit, no regrouping', example: '87 − 34' }, … ],
  tricky: [ … ],                   // generators for the "tricky ones" option
  makeQuestion(level, opts) {},    // → question object
  estimate(q) {},                  // → { prompt, answer } or null
  buildSteps(q) {},                // → [{ title, text, highlight?, stepTag }]
  render(q, stepIndex, el) {},     // draws the written layout / chart at that step
  strategy(q) {},                  // optional mental strategy text
  errorTags: ['Regrouping', 'Ones', 'Tens', 'Hundreds / thousands'],  // self-check chips
  extensions(level) {}             // optional extension challenges (existing feature)
});
```

---

## 3. Screens

The mockup canvas has nine screens. Build these:

### Home (grouped by area)
- Top right: **For teachers & parents**.
- When a class link is used, the **Your practice** banner (topic, level, questions, Start, and "Daily mix instead") sits under the logo row. Hide it if there's no link.
- Under that, a teal **How it works** strip: 1 Pick a topic (Start at Level 1) → 2 Work it out on paper (Show your working) → 3 Check each step (Then mark yourself). The three steps spread evenly across the strip, each arrow sits halfway between two steps, and **Hide** stays on the far right. The "How it works" kicker is small Lexend, uppercase, with letter-spacing. The strip stays open until the student finishes a session or taps Hide. After that, a small **How it works** link shows the strip again. The choice is saved on this device (`guide` in localStorage).
- Two columns, stretching so they end at the same height:
  - Left: **Written methods** (Addition, Subtraction, Multiplication, Division, in a 2 × 2 grid), then **Fractions, decimals & percentages**. That group is three tiles in a row, with the icon above the words: Fractions, Percentages, Convert (Coming soon).
  - Right: **Place value & measurement** (× and ÷ by 10, 100, 1000, then Converting units, stacked), then **Number facts** (Times tables → `https://davefsl.github.io/FlashFlips-Web/`). The place-value icon is ×10 above ÷10, centred in the box at a size that fits.
- Each working tile shows "Level X of Y" from saved progress, then a small bold teal example from the topic's `homeExample`. Coming soon examples are grey.
- Footer, bottom-left: "Progress is saved on this device only." and the version number (the short id of the commit that is live). It stays pinned there, inside the iPhone/iPad safe area. If the page content would reach the bottom, the footer sits at the end of the page instead, and never covers a tile.
- On a phone, one column: Written methods, Fractions…, Place value & measurement, Number facts. The How it works steps stack. Long tile names wrap.

### Level picker (one per topic)
- A grid of level cards: level number, name and an example sum. Done levels get a tick; the current level is filled teal with "YOU ARE HERE".
- Bottom bar: questions **5 / 8 / 10** (segmented control), an **Add 2 tricky ones** tick box, and **Start Level N**.
- Under the grid: **Finished your level? Try the extension challenges →**, an orange card in the same style as the level cards.
- Estimate first, mental strategy and tricky count (0–3) are set in **Set practice**. A link can still set `est`, `strat` and `tricky`.
- Use real radio-style segmented controls, not checkbox-looking buttons that only allow one choice.

### Question + self-check
- Top: **← Levels** (back to that topic's level page) and a Home icon (main menu). For a teacher set, homework link or Daily mix, which have no level page, the button is **← Exit**. Both Exit and Home then ask "Leave this practice? Your answers so far won't be saved." A level the student picked does not ask. Beside that: the topic and level name, e.g. "Fractions · Level 2, Simplifying · Question 1 of 5", on every topic (a mix uses the current question's topic and level). Then a progress strip of coloured segments (teal = right, orange = error, grey = to do), and a "Tricky one" tag when relevant. Back / Next step stay at the bottom for moving between steps.
- Above the question, a short bold instruction when the task is not obvious. The topic sets it with `instruction(q)`. Addition, subtraction and multiplication have none.
- Left card: the question in large type, the estimate or tip line, then the written layout drawn by the topic's `render()`. A fraction question is about twice the usual size, and its card takes more of the width. It scales down to the width, and on iPad and laptop it also scales down to the height left above the bottom bar. It does not go below a readable size; if it still will not fit, that card scrolls inside itself.
- Right: the step list. The current or key step is highlighted. On iPad and laptop the list scrolls inside its own card, and "Show me each step" scrolls the current step into view. On a phone the page scrolls as usual.
- On iPad (portrait and landscape) and laptop the question screen fits the window, with no page scrolling, at every step and after the reveal. A bar is pinned to the bottom: **How did you go?** and both buttons on the left, Back and **Show me each step** on the right. It stays visible and does not cover the working. On a phone the page scrolls, and that same bar stays pinned to the bottom.
- After the full reveal: **How did you go?** **I got it right** records the result and goes straight to the next question (or the summary after the last one). **I made an error** shows "Which step went wrong?" chips from `errorTags`, plus **Next question**. The chip is optional. Stepping through the working never blocks moving on.
- **Reference first.** The heading stays the question (`31 ÷ 10 = ?`, or the plain sum for written methods) until **Show solution**. That opens the complete working and the full answer. **Show me each step** is optional on written methods: Next walks one digit at a time. The two digits in use are shaded, the digit just written is orange, the current step is highlighted, and later steps are grey. Back from the first step returns to the whole answer. Estimate first is still optional on the calculation topics. Fractions show **Tip:** instead, because that line is not an estimate. Place value and converting units use the same numbered step cards as the other topics, and **Show me each step** highlights the current step and greys the later ones. The digits appear in their new places on the **Do the jumps** step.

### Summary
- "6 out of 8. Nice work." with a row of question tiles (tick, or the error tag in orange).
- **What to watch**: the most common error tag plus a short tip from the topic. Button: **Try 4 more like these**, which makes a mini-session of the same tricky type.
- **Next time**: the level suggestion (rule below). Button: Back to home.
- Footer: "Show your teacher: this summary is saved on this device." and "Last 5 sessions: 5, 6, 5, 7, 6".

### Class link builder (teachers and parents)
- Pick topic, level, number of questions, and tick boxes for Estimate first, Mental strategy and Add 2 tricky ones.
- Shows the link, a **Copy link** button, a **Copy message** button and a **QR code** so students can scan from the board. The link, the message and the address printed on the QR card are built from the current address. On the live site that is `https://embedmaths.com.au/hub/`.
- Extension challenges use commit-before-reveal: the student writes an answer (or taps True / False) before **Show answer** is available. A hint shows the first step only.

---

## 4. Link settings

The hub reads these on load. A link with `t=` and `lvl=` fills the "Your practice" strip.

| Param | Meaning | Example |
|---|---|---|
| `t` | topic id | `sub`, `add`, `mul`, `div`, `frac`, `pv`, `conv`, `mix` |
| `mul` | open the multiples list (division, or fractions) | `1` |
| `lvl` | level number | `6` |
| `q` | questions | `5`, `8`, `10` |
| `est` | estimate first | `1` / `0` |
| `strat` | show mental strategy | `1` / `0` |
| `tricky` | tricky questions included in `q` | `0`–`3` |
| `go` | skip home, start straight away | `1` |
| `msg` | message to students (max 80) | `Show your working` |
| `ttl` | homework title (max 50) | `Week 3 homework` |
| `due` | due date | `2026-10-03` |
| `set` | topic, level and count rows | `sub6x3,conv4x4,mul5x3` |
| `order` | set order | `g` grouped, `m` mixed |
| `seed` | same questions on every device | `k4np2w` |
| `fin` | note shown when they finish (max 80) | `Screenshot this card` |

Example: `…/?t=sub&lvl=6&q=8&est=1&strat=1&tricky=2`

A set link uses `t=set` plus `set=`. `q` may be any count from 1 to 30. Invalid values are ignored or clamped.

`tricky` is part of `q`, not added on top. `q=8` and `tricky=2` is 8 questions: 6 at the level and 2 tricky.

---

## 5. Levels

### Subtraction
1. 2-digit, no regrouping (87 − 34)
2. 2-digit with regrouping (82 − 47)
3. 3-digit, no regrouping (586 − 243)
4. 3-digit with regrouping (624 − 258)
5. 4-digit with regrouping (7257 − 1455)
6. **Regrouping across zeros** (4003 − 1257): generate these on purpose
7. **Different lengths** (3456 − 87)
8. Decimals, same places (34.6 − 12.9)
9. **Decimals, different places** (12.5 − 3.47): show the placeholder zero

### Addition
1. 2-digit, no regrouping
2. 2-digit with regrouping
3. 3-digit with regrouping
4. **Regrouping into a new column** (986 + 47)
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

Each step is one digit times one digit, named with its place. Never multiply a whole row in one step. Two-digit multipliers are grouped: "Row 1 · times by the 5 ones", "Row 2 · times by the 7 tens", "Add the rows". A 1-digit multiplier is just those digit steps, with no headings. 4 ones × 5 = 20 ones. Write 0. Regroup 2 tens. Row 1's regrouped digits sit small above the top-number digit they are added to, including when the multiplier is tens (in 73 × 40 the regrouped 1 sits above the 7, not in the hundreds column). When row 2 starts they are crossed out, and row 2's regrouped digits are written beside them in orange. Digits regrouped while adding the rows are small and grey, under row 2. The key under the working uses coloured marks, never a digit: an orange bar, a grey struck-through bar, and a grey dot. Only the marks that appear in that question are listed. A 1-digit multiplier shows only the orange bar.

The estimate rounds each number to the nearest 10 (nearest 100 for a 3-digit number): 64 × 75 → 60 × 80 = 4800. If that is more than about 20% off, use a closer rounding that is still easy: 60 × 16 → 60 × 15 = 900. The line under the answer is "4800 is close to the estimate of 4800 ✓". One way in your head splits by place value into easy parts: 875 × 8 is 800 × 8 = 6400 and 75 × 8 = 600, then add 7000. 182 × 22 is 182 × 20 = 3640 and 182 × 2 = 364, then add 4004. A multiple of 10 can drop its zeros when that stays easy: 54 × 3 = 162, so 540 × 3 = 1620. A step is never itself a hard multiplication, such as 87 × 8 or 18 × 22.

### Division (short division)
1. No regrouping (84 ÷ 4)
2. Regrouping (72 ÷ 3)
3. 3-digit numbers (456 ÷ 3)
4. First digit too small (256 ÷ 4): placeholder 0 above the first digit
5. Zero in the answer (618 ÷ 3 = 206)
6. 4-digit numbers (5868 ÷ 6)
7. Remainders (157 ÷ 4 = 39 r1)
8. Remainders as fractions (157 ÷ 4 = 39¼)
9. Remainders as decimals (157 ÷ 4 = 39.25). About half the questions need 2 decimal places (913 ÷ 4 = 228.25, 87 ÷ 4 = 21.75), mixed with 1 decimal place, so students keep going until the remainder is 0. Divisors 2, 4 and 5 only. Nothing needs more than 2 decimal places.
10. Decimal ÷ whole number (7.56 ÷ 3 = 2.52)
11. Extension: 2-digit divisors (1534 ÷ 13 = 118). Divisors 11 to 25. 3- and 4-digit numbers, regrouping at most steps, some zeros in the answer, and about a third with a remainder (1000 ÷ 13 = 76 r12). Dashed orange card. The multiples list opens by default.
12. Recurring decimals (extension). Dashed orange card, same as level 11. Instruction: "Write the answer as a decimal. Round to 2 decimal places." Divisors 3, 6 and 9 only, so one digit repeats (457 ÷ 3 = 152.333…, 250 ÷ 6 = 41.666…, 85 ÷ 9 = 9.444…). The working continues to 3 decimal places. Then: "Remainder 1 again. The same thing will keep happening, so the 3 repeats forever." "Write it with a dot over the digit that repeats", shown as 152.3 with a small dot centred above the 3. The dot is drawn in the same colour as the digit, not a font's combining character. "Round to 2 decimal places. Look at the thousandths digit: 3. It's less than 5, so the hundredths digit stays the same: 152.33" When the thousandths digit is 5 or more: "It's 5 or more, so round the hundredths up: 41.67" Answer box: "Answer: 152.3 (dot above the 3) ≈ 152.33". Check: "152.33 × 3 = 456.99, very close to 457 ✓" and, once, "It isn't exact because we rounded."

Levels 1–6 and 10 divide exactly. Level 7 always has a remainder. Level 8 uses divisors 2, 4, 5 and 8. Level 9 uses 2, 4 and 5. Level 12 uses 3, 6 and 9. Level 12 is in the class link level list, and in tricky ones, the same way as level 11: an extension level is only used when that extension level is the one selected.

**Bus stop.** The answer row sits above one continuous horizontal line. The line sits just above the dividend digits and joins the top of the upright line, at the same height on every question, including when a regrouped digit sits over a placeholder 0. Regrouped digits go in the space between the line and the dividend. That space is made by padding inside the row, so the line itself does not move up. The vertical line is only as tall as the number row. A regrouped remainder sits raised at the top-left of the digit it joins (like a superscript, ²4), and it appears in the same step that creates it. On a placeholder 0 it sits just above and to the left of the dashed box, clear of the border and clear of the line. A digit that will not go is a placeholder 0 (orange, dashed). Decimal points in the answer line up with the decimal point in the number. The note about a placeholder 0 at the front uses the same answer as the answer box; on a recurring question that is the dotted form (8.3 with a dot above the 3). A ✓ stays on the same line as the word before it. The remainder (`r 12`) is part of the answer row and stays fully visible. If the working is wider than its column, the digits scale down to fit.

**Wording.** Each part of a column is its own line: "9 hundreds ÷ 5 = 1, remainder 4. Write 1" then "Regroup the 4 hundreds: 41 tens". Level 7's last step also writes the remainder beside the answer: "Write the remainder beside the answer: 39 r1." The answer row shows "r 1". Level 9 adds a placeholder 0 for each extra decimal place, in the dashed orange box, and the decimal points line up. The first extra place is "Keep going past the remainder" / "Write the decimal point and a placeholder 0" / "Regroup the 1 one: 10 tenths". Each further place is its own step: "Keep going past the remainder" / "Write a placeholder 0" / "Regroup the 2 tenths: 20 hundredths", then "Hundredths" / "20 hundredths ÷ 4 = 5. Write 5" / "No remainder, so stop." Level 10 adds a decimal-point step: "Write the decimal point in the answer, straight above the decimal point in 7.56." For a 2-digit divisor, each step uses the list: "The largest multiple that isn't bigger than 100 is 91 (7 × 13)."

**Remainders as fractions** (level 8): one step per column, then the fraction. The remainder goes on top, the divisor underneath. "The remainder is 2, but it still has to be shared between 5. Each share is one fifth." The working does not show the decimal equivalent.

Above the question on a remainder level: "Give the remainder as a remainder." (level 7), "Write the remainder as a fraction." (level 8), "Write the answer as a decimal." (level 9), or "Write the answer as a decimal. Round to 2 decimal places." (level 12). Other division levels have no instruction line.

**Multiples list.** A **Multiples of n** dropdown sits in its own column beside the working, with a gap. When there isn't room it moves underneath. It can be opened before the reveal (`mul=1` opens it for the session; level 11 opens it by default). Rows are not highlighted until the working is revealed.

### Fractions
1. Equivalent fractions (3/4 = ?/12). Denominators up to 12, and sometimes 100. The missing number is the new numerator, so 9/12 stays as twelfths.
2. Simplifying (18/24 → 3/4). Always fully, using the highest common factor.
3. Improper ↔ mixed numbers (17/5 → 3 2/5, and 2 3/8 → 19/8). Both directions. Writing as an improper fraction keeps that improper fraction as the answer.
4. Fraction of an amount (3/5 of 45). Whole-number answers only. Amounts up to 120, then up to 1000 in the extension questions.
5. Add and subtract with the same denominator, including mixed numbers (2 3/8 + 1 7/8 = 4 2/8 = 4 1/4).
6. Add and subtract where one denominator is a multiple of the other (2/3 + 5/12).
7. Compare and order (3/4, 2/3, 5/8, smallest first). Use a common denominator.
8. Extension: add and subtract with unrelated denominators (3/4 + 2/3). Dashed orange card.

Final answers are fully simplified. An improper answer becomes a mixed number, except on level 3 when the question asks for the improper fraction.

**On screen.** Fractions are stacked numbers with a horizontal line, never a slash. Working is in rows, and every fraction in a column has the same width:

3/4 + 2/3
= 9/12 + 8/12
= 17/12
= 1 5/12

The small orange × labels (×3, ×4) sit just to the right of the numerator and the denominator and take up no layout space, so the lines, the + and = signs and the answers line up from row to row. No circles, ovals or arrows.

**Fraction of an amount.** The tip is "Divide by the denominator, times by the numerator." A small orange × sits to the left of the numerator and a small orange ÷ to the left of the denominator. Underneath, a bar of equal parts: for 3/5 of 45, five parts labelled 9, three shaded, giving 27. No reminder caption.

**Common denominator.** Write the multiples of each denominator and use the first number in both lists. The same **Multiples of n** dropdown as division. Two lists sit side by side (Multiples of 12 next to Multiples of 5). Each list shows in full, with no inner scroll, and goes at least as far as the common multiple. On a narrow screen the pair drops underneath the working and stays side by side. It never covers the working. It can be opened before the reveal. Nothing is highlighted until after the reveal, then the common multiple is highlighted in each list. Skip any step that is not needed. For 3/4 + 2/3 the steps are numbered 1, 2, 3…: find the common denominator and write 12 as both denominators; "What you do to the top, you do to the bottom" (4 × 3 = 12, so 3 × 3 = 9, and 3 × 4 = 12, so 2 × 4 = 8); add the numerators (9 + 8 = 17); write 17/12; change to a mixed number (1 5/12).

The + or − in the question is the same size as the signs in the working, centred on the fraction line, with the same gap either side. Fractions in the Answer box and in the steps are at least as big as the words around them.

Self-check chips: Common denominator, Top and bottom, Adding / subtracting, Simplifying, Mixed numbers, Divide and times. A chip only shows when that step was used.

### × and ÷ by 10, 100, 1000
1. Whole numbers × 10, 100, 1000 (45 × 100)
2. Whole numbers ÷ with whole answers (4500 ÷ 100)
3. Decimals × (3.45 × 100)
4. ÷ giving a decimal (45 ÷ 100 = 0.45)
5. Placeholder zeros (0.06 × 1000, 7 ÷ 1000)
6. Missing numbers (3.2 × ___ = 320)
7. Mixed

### Converting units
1. m ↔ cm, cm ↔ mm (including decimal answers, such as 352 cm → 3.52 m)
2. km ↔ m
3. Mass and capacity: t ↔ kg, kg ↔ g, L ↔ mL
4. Decimal amounts (2.5 km → m, 450 g → kg, 0.75 L → mL)
5. Mixed units (2 m 35 cm = ___ cm, 3450 m = ___ km ___ m)
6. Order 3, 4 or 5 amounts, including close values (0.4 kg · 412 g · 0.71 kg). Change them all to the same unit first.
7. **One measurement, many ways**: "Which is NOT equal to 5.5 m?" with lettered tiles. The odd one out is a one-step mistake (55 cm, 550 mm, or 5 m 5 cm). No km for a length under 10 m. Or "Which unit would a builder use?"
8. Later: area units (1 m² = 10 000 cm², not 100)

### Level suggestion rule
- 7 or more out of 8 (or the same share of 5 or 10) in **two sessions in a row** → suggest the next level.
- Otherwise suggest staying on the same level.
- It only suggests. Students and teachers can always pick any level.

---

## 6. Teaching approach to keep (Dave's wording)

### Place value slide (screens 8 and 9)
- Above the question: "Work it out."
- Columns: Th · H · T · O · **.** · t · h (add th for 3 dp). The decimal point has its own fixed column.
- **The digits move. The decimal point never moves.** Never teach "add a zero" or "move the decimal point".
- Before the reveal, two prompts only: "Will the answer be bigger or smaller?" and "Which way will the digits move — left or right?"
- On reveal, numbered step cards: **Which way?** ("Left — × makes it bigger." or "Right — ÷ makes it smaller."), **How many places?** (10 = 1, 100 = 2, 1000 = 3), **Do the jumps** (name each digit's jump, or "Every digit jumps 2 places left." when there are more than 3). When a place is empty: **Zeros hold the place** ("The ones place is empty, so a 0 holds it: 60." or "There are no ones, so a 0 holds the ones place: 0.45."). **Show me each step** highlights the current card and greys the later ones. The digits appear in their new places on the **Do the jumps** step. A placeholder zero appears on **Zeros hold the place**.
- Self-check chips: Which way, How many places, The jumps, Zeros hold the place.
- Draw an arrow showing the move ("3 places left").
- Colours: the digit that moves has a teal fill; a placeholder zero is orange with a dashed border.

### Converting units (match the laminated Metric Place Value Chart)
- Tabs: **Length** (blue), **Mass** (purple), **Capacity** (green), using the chart's colours.
- Pairs with arrows both ways: km ⇄ m (× 1000 / ÷ 1000), m ⇄ cm (× 100 / ÷ 100), cm ⇄ mm (× 10 / ÷ 10), t ⇄ kg and kg ⇄ g (× 1000), L ⇄ mL (× 1000). Highlight the pair in the question and fade the others.
- Above a conversion: "Convert to metres." (the target unit, written out). A mixed kilometres question says "Convert to kilometres and metres." Ordering and "which unit" questions have no instruction line.
- Before the reveal: "Going to a bigger or smaller unit?", "Will your number get bigger or smaller?", "Which way will the digits move — left or right?"
- On reveal: the unit chart (highlight the pair), the orange **Check yourself** box ("Going to a SMALLER unit? Then my number gets BIGGER." or "Going to a BIGGER unit? Then my number gets SMALLER."), and numbered step cards: **Which rule?**, **Which way?**, **How many places?**, **Do the jumps**, **Zeros hold the place** only when a place is empty, and **Say it another way** (2.5 km = 2500 m = 2 km 500 m). **Show me each step** works as in the other topics: the current step is highlighted and later steps are grey. The digits appear in their new places on the **Do the jumps** step.
- Self-check chips: Which rule, Which way, How many places, Zeros hold the place, Decimal point.
- Level 7 uses the chart's "one measurement, five ways" idea: pick the unit that gives a number you can hold in your head.

### Fractions
- A bold instruction sits above the question: Find the missing number. / Simplify this fraction. / Change to a mixed number. or Change to an improper fraction. / Find the fraction of the amount. / Add. Simplify your answer. or Subtract. Simplify your answer. / Put these in order, smallest first.
- The line under the question is **Tip:**, not Estimate first. Level 1: "What you do to the top, you do to the bottom." Level 2: "Find the highest number that divides into both 18 and 24" (it names the numerator and the denominator). Level 3: "How many wholes can you make?" Level 4: "Divide by the denominator, times by the numerator." Level 5: "Same denominator: just add (or subtract) the numerators." Levels 6 and 8: "Find a common denominator. Use the multiples lists." Level 7: "Change them all to the same denominator first."
- Equivalent fractions: "What you do to the top, you do to the bottom." Example: "4 × 3 = 12, so 3 × 3 = 9."
- Simplifying uses the same sentence, dividing by the highest common factor: "24 ÷ 6 = 4, so 18 ÷ 6 = 3." The tip is "Divide the numerator and the denominator by the highest common factor."
- Fraction of an amount: "Divide by the denominator, times by the numerator." Example: "45 ÷ 5 = 9, 9 × 3 = 27."
- A common denominator comes from the multiples lists: the first number that is in both lists.
- Same-denominator subtraction that needs a whole uses **Regroup**. Never "carry", "trade" or "left over".

### Percentages
- Six levels in `topics/percentages.js` (`?t=pct`). Answers are whole numbers or have at most 2 decimal places. A discount's sale price is always 2 decimal places (`$51.00`). Other amounts are written as they appear (`$60`, `$6`).
- A bold instruction sits above the question: Find the percentage of the amount. (levels 1–4) / Find the sale price. / Write as a percentage.
- The line under the question is **Tip:**. Level 1: "50% is half. 10% is divide by 10" Level 2: "Build it up from 10%, 5% and 1%." Level 3: "Find the nearest easy percentage, then add or take away." Level 4: "Change the percentage to a decimal first." Level 5: "Find the discount, then take it off." Level 6: "Make the denominator 100, or divide the numerator by the denominator and × 100."
- After the reveal, percent-of-amount questions can show method tabs: **Build up**, **Near a benchmark**, **Decimal × amount**. Level 1 has one method only, so it has no tabs. Levels 1–2 open on Build up, level 3 on Near a benchmark, level 4 on Decimal × amount. A tab is shown only when that method makes sense for the question.
- Wording: 50% is "halve it." 25% is "halve it, then halve it again." 10% is "divide by 10" 5% is "half of 10%." 1% is "divide by 100"
- Build up writes one line per part, then adds them. 35% of 80 is 10% = 8, 30% = 24, 5% = 4, then 35% = 24 + 4 = 28.
- Near a benchmark writes each part on its own line, then the whole comparison on one line that does not wrap. A gap of 2 is 2%, not 1% + 1%. 48% of 75 is 50% − 2% = 37.5 − 1.5 = 36.
- Decimal × amount is level 4, and it is the method that opens first. The question is still a percentage of an amount (33% of 40), with the instruction "Find the percentage of the amount." It uses percentages that are awkward to build up (8%, 17%, 35%, 52%, 64%), not 50%, 25% or 10%. The working starts "33% = 0.33", then the same digit-by-digit multiplication as the Multiplication topic, followed by the decimal-places step. The number with more digits goes on top. A one-digit multiplier is one row, and a row that would be only 0 is left out. Under the answer, the decimal places are counted in from the right with a small orange mark: "0.2 has 1 decimal place, so the answer has 1 decimal place: 160 → 16.0". If the written product has a zero on the end (29.20), one line reads "29.20 = 29.2 (the zero on the end isn't needed)". The answer box is only the answer and the check. The check rounds the percentage to the nearest 10%: "64% ≈ 60%. 60% of 75 = 45, so 48 makes sense." Half, a quarter or three quarters is used only when the percentage is within 3% of 50, 25 or 75, and only when that amount is a friendly number.
- A discount is two steps: find the discount, then take it off the price. The question is smaller than a short sum, so it fits on about two lines. Working amounts are written as they appear ($60, $6, $12). Only the sale price uses .00 ($48.00). Every working line uses the same style. A rule and its sum are on separate lines ("5%: half of 10%" then "5% of $20 = $1"). The check uses the other method: "20% off means you pay 80%. 80% of $60 = $48". Also show "Another way: 15% off means you pay 85%."
- One amount as a percentage of another is written as a fraction. About half the questions have a denominator that goes into 100 (2, 4, 5, 10, 20, 25, 50). Those open on **Make the denominator 100**, and both method tabs are available. "What you do to the top, you do to the bottom." The fraction is the same stacked drawing as Fractions, with the small orange × labels. 18/25 ×4 = 72/100 = 72%. About half have a denominator that does not (8, 40, 16, 80), such as 3 out of 8 or 14 out of 40. Those open on **Divide, then × 100**, and the other tab is hidden. The answer has at most one decimal place, such as 37.5%. That method is: write the stacked fraction; divide the numerator by the denominator with the same short-division layout as Division, continuing past the decimal point (3 ÷ 8 = 0.375); times by 100, with the digits moving 2 places left on the place-value chart and the decimal point staying still (0.375 × 100 = 37.5); answer 37.5%. One way in your head, for a divide question: 1/8 = 12.5%, so 3/8 = 37.5%.
- Self-check chips, only the ones that question used: Finding 10%, Finding 1%, Adding the parts, Decimal point, Taking off the discount, Making it out of 100.

### Written methods
- Student-facing text uses Australian Curriculum (ACARA v9) words in every step, level name and self-check chip: **regroup** and **remainder**. Never "carry", "trade" or "left over".
- Keep the crossed-out digit with the new value above it. For regrouping across zeros, show every 0 becoming 9.
- Every written method is explained digit by digit, with the place named. A step never does a whole number in one go. Addition and subtraction read "Tens: 2 + 8 = 10, write 0, regroup 1 hundred." Division stays one column at a time.
- For multiplication, row 1's regrouped digits stay visible and are crossed out when row 2 starts. Row 2's regrouped digits sit beside them. The digits regrouped while adding stay visible under row 2.

### Layout (every topic)
- Nothing may overlap: the working, a multiples list, a legend, a label or a button each keep their own space, with a gap.
- If the working is too wide for its column, scale the digits down to fit. On iPad and laptop, also scale it down to the height left above the bottom bar, and scroll that card if it would become unreadable.
- When there isn't room (long numbers, narrower screens), move the side panel underneath the working.
- Shaded boxes (the answer/check box, hints, Check yourself, steps) are the full width of their column and grow with their text. Text wraps inside the box.
- Check the longest cases at 1180×820, 1024×768 and 390 wide, with the multiples list open and closed: 4-digit ÷ 2-digit with a remainder, a decimal division, 3-digit × 2-digit, 2 dp × 1 dp, subtraction level 9, addition of three numbers, converting units with 5 amounts, converting units multiple choice, fraction of an amount with the bar, adding fractions with two multiples lists, a percentage near a benchmark (the final line on one line), a discount, and one amount as a percentage of another.

---

## 7. Saved data (this device only)

`localStorage` key `embedmaths.v1`, always wrapped in try/catch:

```js
{
  progress: { sub: { level: 6, streak: 1 }, mul: { level: 4, streak: 0 }, … },
  history: [ { t:'sub', lvl:6, date:'2026-09-24', score:6, of:8, errors:{ Regrouping:2 } }, … ],  // keep last 30
  extensions: { sub: { score: 5, of: 8 } },
  guide: 'hide'   // How it works: 'show', 'hide', or absent (open until the first finished session)
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

- **The generators never make the hardest cases.** Both numbers are always the same length and decimals always have the same number of places. Generate them on purpose for the levels above: different lengths, regrouping across zeros, different decimal places.
- **Extension answers stay hidden until the student commits.** Each challenge has a My answer box (True / False buttons on those questions). Show answer stays unavailable until something is entered, and says "Write your answer first" if it is tapped early. The reveal puts their answer beside the correct one. A hint shows the first step only, not the answer. There is no teacher PIN.
- The session badge text reads "mixeddp decimals" and "4d"; replace these with the level name.
- Choosing "1dp × 1dp" with 2-digit × 1-digit quietly becomes 1dp × whole. Level-based generation removes this.
- The mental strategy's "round and adjust" picks awkward numbers (e.g. 1455 → 1460). Round to the nearest number that makes the sum easy (7257 − 1457 = 5800, then + 2).
- Multiplication step text repeats itself ("STEP 1 · Step 1: …"). Group the steps as Row 1 / Row 2 / Add.
- On phones the background gradient cuts off partway down the long settings page.
- Checkbox-style buttons that only allow one choice → use segmented controls.

---

## 10. Look and feel

- Colours: teal `#0E5D66` (main), ground `#F4F8F7`, ink `#16302F`, muted text `#4F6B6D`, orange `#B85A1E` (errors, regrouping, placeholders; tint `#FFF6EF`). Length blue `#1D5A9E`. Mass purple and capacity green to match the laminated chart.
- Fonts: **Bricolage Grotesque** for headings, **Lexend** for body text and numbers, with `font-variant-numeric: tabular-nums` so columns line up. Save the font files in the repo; don't load them from Google at runtime.
- Tap targets at least 44 px. Tested at 1180 × 820, 1024 × 768 and 390 wide.
- Icons: simple inline SVG line icons, no emoji.

---

## 11. Done when (steps 1–6)

Live: https://embedmaths.com.au/hub/

- [x] A link like `?t=sub&lvl=6&q=8` opens with the "Your practice" strip filled in, and Start runs that session.
- [x] Subtraction levels 1–9 each make the right kind of question (check 50 generated per level).
- [x] Self-check and summary work, and the summary names the most common error step.
- [x] Progress and history survive closing and reopening Safari on an iPad.
- [x] × ÷ 10/100/1000 and conversions show the place value slide with placeholder zeros.
- [x] The QR code from the link builder opens the right session when scanned on an iPad.
- [x] It loads nothing from outside the repo (no CDN or Google Fonts requests). Full offline use would need a service worker, which is optional.
- [x] The old page URLs still work. `/`, `/?t=sub&lvl=6`, `/embedmaths-addition-subtraction.html` and `/embedmaths-multiplication.html` forward to the hub.

---

## Next topics

Not on Home as a working tile, and not in Set practice, until they are built. Home shows them as Coming soon:

- Fractions–decimals–percentages
