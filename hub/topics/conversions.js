/* Converting metric units. Digits move. The decimal point stays still. */
const Conversions = (function () {
  const PLACE = {
    4: 'ten-thousands', 3: 'thousands', 2: 'hundreds', 1: 'tens', 0: 'ones',
    '-1': 'tenths', '-2': 'hundredths', '-3': 'thousandths'
  };
  const MEASURES = {
    length: { name: 'Length', color: '#1D5A9E', rows: [
      { big: 'km', small: 'm', factor: 1000 },
      { big: 'm', small: 'cm', factor: 100 },
      { big: 'cm', small: 'mm', factor: 10 }
    ] },
    mass: { name: 'Mass', color: '#7B4FBF', rows: [
      { big: 't', small: 'kg', factor: 1000 },
      { big: 'kg', small: 'g', factor: 1000 }
    ] },
    capacity: { name: 'Capacity', color: '#2E9E60', rows: [
      { big: 'L', small: 'mL', factor: 1000 }
    ] }
  };

  function ri(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
  function pick(list) { return list[ri(0, list.length - 1)]; }
  function placesOf(factor) { return factor === 10 ? 1 : factor === 100 ? 2 : 3; }
  function fmt(milli) {
    const v = Math.abs(Math.round(milli));
    const whole = Math.floor(v / 1000);
    const frac = v % 1000;
    if (!frac) return String(whole);
    return whole + '.' + String(frac).padStart(3, '0').replace(/0+$/, '');
  }
  function dpOf(milli) {
    const frac = Math.abs(Math.round(milli)) % 1000;
    if (!frac) return 0;
    if (frac % 100 === 0) return 1;
    if (frac % 10 === 0) return 2;
    return 3;
  }
  function parseDigits(milli) {
    const abs = Math.abs(Math.round(milli));
    const raw = [];
    let v = abs;
    let pos = -3;
    if (!v) return { map: { 0: 0 }, sigMin: 0, sigMax: 0 };
    while (v > 0) {
      raw.push({ pos: pos, d: v % 10 });
      v = Math.floor(v / 10);
      pos += 1;
    }
    while (raw.length && raw[0].d === 0 && raw[0].pos < 0) raw.shift();
    const map = {};
    let sigMin = null;
    let sigMax = null;
    raw.forEach(function (item) {
      map[item.pos] = item.d;
      if (!item.d) return;
      if (sigMin === null || item.pos < sigMin) sigMin = item.pos;
      if (sigMax === null || item.pos > sigMax) sigMax = item.pos;
    });
    if (sigMin === null) { sigMin = 0; sigMax = 0; map[0] = 0; }
    for (let pos = Math.max(0, sigMax); pos >= sigMin; pos--) {
      if (map[pos] == null) map[pos] = 0;
    }
    return { map: map, sigMin: sigMin, sigMax: sigMax };
  }
  function shiftDigits(parsed, delta) {
    const moved = {};
    for (let pos = parsed.sigMin; pos <= parsed.sigMax; pos++) moved[pos + delta] = parsed.map[pos] || 0;
    return moved;
  }
  function gapsFor(moved) {
    const keys = Object.keys(moved).map(Number);
    const lo = Math.min.apply(null, keys);
    const hi = Math.max.apply(null, keys);
    const gaps = [];
    if (lo > 0) { for (let pos = lo - 1; pos >= 0; pos--) gaps.push(pos); }
    if (hi < 0) { for (let pos = 0; pos > hi; pos--) gaps.push(pos); }
    return gaps;
  }
  function sourceName(pos, digit) {
    if (pos === 0) return digit === 1 ? 'one' : 'ones';
    return PLACE[pos];
  }
  function jumpsLine(q) {
    const named = [];
    for (let pos = q.parsed.sigMax; pos >= q.parsed.sigMin; pos--) {
      const digit = q.parsed.map[pos];
      if (!digit) continue;
      named.push(digit + ' ' + sourceName(pos, digit) + ' jumps to the ' + PLACE[pos + q.delta]);
    }
    if (named.length > 3) {
      return 'Do the jumps. Every digit jumps ' + q.places + ' place' + (q.places === 1 ? '' : 's') + ' ' + q.dir + '.';
    }
    return 'Do the jumps. ' + named.join(', ') + ': ' + q.amount + '.';
  }
  function zerosLine(q) {
    if (!q.gaps.length) return '';
    if (q.resultMilli < 1000) {
      const extras = q.gaps.filter(function (pos) { return pos !== 0; });
      let line = 'Zeros hold the place. There are no ones, so a 0 holds the ones place';
      if (!extras.length) return line + ': ' + q.amount + '.';
      const names = extras.map(function (pos) { return 'the ' + PLACE[pos]; });
      return line + '. ' + names.join(' and ').replace(/^the/, 'The') + (extras.length === 1 ? ' is' : ' are') +
        ' empty, so a 0 holds ' + (extras.length === 1 ? 'it' : 'each') + ': ' + q.amount + '.';
    }
    if (q.gaps.length === 1) {
      return 'Zeros hold the place. The ' + PLACE[q.gaps[0]] + ' place is empty, so a 0 holds it: ' + q.amount + '.';
    }
    const names = q.gaps.map(function (pos) { return 'the ' + PLACE[pos]; });
    return 'Zeros hold the place. ' + names.join(' and ').replace(/^the/, 'The') + ' are empty, so a 0 holds each: ' + q.amount + '.';
  }
  function rowOf(measure, big) {
    const rows = MEASURES[measure].rows;
    for (let i = 0; i < rows.length; i++) if (rows[i].big === big) return rows[i];
    return null;
  }

  function slide(fromMilli, factor, down) {
    const places = placesOf(factor);
    const delta = down ? places : -places;
    const resultMilli = down ? fromMilli * factor : fromMilli / factor;
    const parsed = parseDigits(fromMilli);
    const moved = shiftDigits(parsed, delta);
    return {
      places: places, delta: delta, resultMilli: resultMilli, parsed: parsed, moved: moved,
      gaps: gapsFor(moved), dir: down ? 'left' : 'right'
    };
  }

  function anotherWay(fromText, resultText, smallMilli, factor, big, small) {
    const whole = Math.floor(smallMilli / 1000 / factor);
    const rem = Math.round(smallMilli / 1000 - whole * factor);
    const mixed = whole + ' ' + big + ' ' + fmt(rem * 1000) + ' ' + small;
    if (whole > 0 && rem > 0 && mixed !== fromText && mixed !== resultText) {
      return fromText + ' = ' + resultText + ' = ' + mixed;
    }
    return fromText + ' = ' + resultText;
  }

  function pack(base) {
    const moved = slide(base.fromMilli, base.factor, base.down);
    const q = {
      kind: base.kind,
      measure: base.measure,
      big: base.big,
      small: base.small,
      factor: base.factor,
      down: base.down,
      fromUnit: base.fromUnit,
      toUnit: base.toUnit,
      fromMilli: base.fromMilli,
      fromText: base.fromText,
      amount: fmt(moved.resultMilli),
      resultText: fmt(moved.resultMilli) + ' ' + base.toUnit,
      resultMilli: moved.resultMilli,
      places: moved.places,
      delta: moved.delta,
      dir: moved.dir,
      parsed: moved.parsed,
      moved: moved.moved,
      gaps: moved.gaps,
      answer: moved.resultMilli / 1000,
      dp: dpOf(moved.resultMilli)
    };
    q.check = base.down
      ? 'Going to a SMALLER unit? Then my number gets BIGGER.'
      : 'Going to a BIGGER unit? Then my number gets SMALLER.';
    const op = base.down ? '×' : '÷';
    const placeWord = q.places === 1 ? 'place' : 'places';
    q.revealLines = [
      'Which rule? ' + q.fromUnit + ' → ' + q.toUnit + ' is ' + op + ' ' + q.factor + '.',
      'Which way? ' + (base.down ? 'Left' : 'Right') + ' — ' + (base.down ? '× makes it bigger.' : '÷ makes it smaller.'),
      'How many places? ' + q.places + ' — ' + op + ' ' + q.factor + ' is ' + q.places + ' ' + placeWord + '.',
      jumpsLine(q)
    ];
    const zeros = zerosLine(q);
    if (zeros) q.revealLines.push(zeros);
    q.another = base.another || anotherWay(q.fromText, q.resultText, base.down ? q.resultMilli : q.fromMilli, q.factor, q.big, q.small);
    q.revealLines.push('Say it another way: ' + q.another + '.');
    if (base.extraLine) q.revealLines.push(base.extraLine);
    q.equation = base.equation;
    q.solvedEquation = base.solved || (q.fromText + ' = ' + q.resultText);
    q.hasDecimal = dpOf(q.fromMilli) > 0 || dpOf(q.resultMilli) > 0 || String(q.fromText).indexOf('.') >= 0;
    q.steps = q.revealLines.map(function (text) { return { text: text }; });
    return q;
  }

  function convert(measure, big, down, fromMilli, fromText) {
    const row = rowOf(measure, big);
    const fromUnit = down ? row.big : row.small;
    const toUnit = down ? row.small : row.big;
    return pack({
      kind: 'convert', measure: measure, big: row.big, small: row.small, factor: row.factor, down: down,
      fromUnit: fromUnit, toUnit: toUnit, fromMilli: fromMilli,
      fromText: fromText || (fmt(fromMilli) + ' ' + fromUnit),
      equation: (fromText || (fmt(fromMilli) + ' ' + fromUnit)) + ' = ? ' + toUnit
    });
  }

  function fits(level, q) {
    if (!q || q.resultMilli % 1 !== 0) return false;
    if (dpOf(q.fromMilli) > 3 || dpOf(q.resultMilli) > 3) return false;
    if (q.parsed.sigMax > 4 || parseDigits(q.resultMilli).sigMax > 4) return false;
    if (q.parsed.sigMin < -3 || parseDigits(q.resultMilli).sigMin < -3) return false;
    if (level === 1) return q.kind === 'convert' && q.measure === 'length' && q.factor !== 1000;
    if (level === 2) return q.kind === 'convert' && q.big === 'km';
    if (level === 3) return q.kind === 'convert' && q.measure !== 'length';
    if (level === 4) return q.kind === 'convert';
    if (level === 5) return q.kind === 'mixed';
    if (level === 6) return q.kind === 'order' && q.count >= 3 && q.count <= 5;
    if (level === 7) return q.kind === 'choice';
    return false;
  }

  function category(q) {
    if (q.gaps && q.gaps.length) return 'placeholder';
    if (dpOf(q.fromMilli) > 0 || dpOf(q.resultMilli) > 0) return 'decimal';
    return 'clean';
  }
  function cleanConvert(measure, big) {
    const row = rowOf(measure, big);
    const n = ri(2, 9);
    return convert(measure, big, false, n * row.factor * 1000);
  }
  function decimalConvert(measure, big) {
    const row = rowOf(measure, big);
    const places = placesOf(row.factor);
    if (Math.random() < 0.5) {
      const digits = places + ri(1, 2);
      let n = ri(1, 9);
      for (let i = 1; i < digits - 1; i++) n = n * 10 + ri(0, 9);
      n = n * 10 + ri(1, 9);
      return convert(measure, big, false, n * 1000);
    }
    let frac = 0;
    for (let i = 0; i < places; i++) frac = frac * 10 + (i === places - 1 ? ri(1, 9) : ri(0, 9));
    const milli = ri(1, 9) * 1000 + frac * Math.pow(10, 3 - places);
    return convert(measure, big, true, milli);
  }
  function placeholderConvert(measure, big) {
    const row = rowOf(measure, big);
    const places = placesOf(row.factor);
    if (places === 1 || Math.random() < 0.55) {
      const digits = ri(1, places);
      let n = ri(1, 9);
      for (let i = 1; i < digits; i++) n = n * 10 + ri(1, 9);
      return convert(measure, big, false, n * 1000);
    }
    const depth = ri(1, places - 1);
    const whole = Math.random() < 0.45 ? 0 : ri(1, 9);
    const milli = whole * 1000 + ri(1, 9) * Math.pow(10, 3 - depth);
    return convert(measure, big, true, milli);
  }
  function messy(measure, big) {
    const roll = Math.random();
    const want = roll < 0.3 ? 'clean' : (roll < 0.5 ? 'placeholder' : 'decimal');
    for (let i = 0; i < 40; i++) {
      const q = want === 'clean' ? cleanConvert(measure, big) : (want === 'placeholder' ? placeholderConvert(measure, big) : decimalConvert(measure, big));
      if (category(q) === want) { q.mix = want; return q; }
    }
    const q = cleanConvert(measure, big);
    q.mix = category(q);
    return q;
  }
  function gen1() { return messy('length', pick(['m', 'cm'])); }
  function gen2() { return messy('length', 'km'); }
  function gen3() {
    const choice = pick([{ m: 'mass', b: 't' }, { m: 'mass', b: 'kg' }, { m: 'capacity', b: 'L' }]);
    return messy(choice.m, choice.b);
  }
  function gen4() {
    const choice = pick([
      { m: 'length', b: 'km' }, { m: 'length', b: 'm' }, { m: 'length', b: 'cm' },
      { m: 'mass', b: 'kg' }, { m: 'mass', b: 't' }, { m: 'capacity', b: 'L' }
    ]);
    return messy(choice.m, choice.b);
  }
  function gen5() {
    if (Math.random() < 0.5) {
      const metres = ri(1, 9);
      const cm = Math.random() < 0.3 ? pick([20, 50, 200, 500]) : (ri(1, 9) * 10 + ri(1, 9));
      const milli = metres * 1000 + cm * 10;
      const q = convert('length', 'm', true, milli, metres + ' m ' + cm + ' cm');
      q.kind = 'mixed';
      q.equation = metres + ' m ' + cm + ' cm = ? cm';
      q.solvedEquation = metres + ' m ' + cm + ' cm = ' + q.resultText;
      q.another = metres + ' m ' + cm + ' cm = ' + q.resultText;
      q.revealLines[q.revealLines.length - 1] = 'Say it another way: ' + q.another + '.';
      return q;
    }
    const km = ri(1, 9);
    const m = Math.random() < 0.3 ? pick([200, 250, 500]) : (ri(1, 9) * 100 + ri(0, 9) * 10 + ri(1, 9));
    const fromMilli = (km * 1000 + m) * 1000;
    const q = convert('length', 'km', false, fromMilli, (km * 1000 + m) + ' m');
    q.kind = 'mixed';
    q.equation = (km * 1000 + m) + ' m = ? km ? m';
    q.solvedEquation = (km * 1000 + m) + ' m = ' + km + ' km ' + m + ' m';
    q.another = (km * 1000 + m) + ' m = ' + fmt(q.resultMilli) + ' km = ' + km + ' km ' + m + ' m';
    q.revealLines[q.revealLines.length - 1] = 'Say it another way: ' + q.another + '.';
    return q;
  }
  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = ri(0, i);
      const tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }
  function gen6() {
    const count = Math.random() < 1 / 3 ? 5 : (Math.random() < 0.5 ? 3 : 4);
    const descending = Math.random() < 0.5;
    const pair = pick([
      { measure: 'mass', big: 'kg', small: 'g', factor: 1000 },
      { measure: 'length', big: 'm', small: 'cm', factor: 100 },
      { measure: 'length', big: 'cm', small: 'mm', factor: 10 },
      { measure: 'capacity', big: 'L', small: 'mL', factor: 1000 },
      { measure: 'length', big: 'km', small: 'm', factor: 1000 }
    ]);
    const anchor = ri(2, 9) * (pair.factor / 10) * ri(1, 4);
    const smalls = [anchor, anchor + ri(2, 18)];
    const used = {};
    used[smalls[0]] = true;
    used[smalls[1]] = true;
    while (smalls.length < count) {
      const v = anchor + ri(-40, 40);
      if (v < 1 || used[v]) continue;
      used[v] = true;
      smalls.push(v);
    }
    const items = shuffle(smalls.map(function (small, i) {
      const asBig = i < 2 ? i === 0 : Math.random() < 0.5;
      const text = asBig ? (fmt(Math.round(small * 1000 / pair.factor)) + ' ' + pair.big) : (small + ' ' + pair.small);
      return { text: text, small: small, asBig: asBig };
    }));
    const bigItem = items.filter(function (item) { return item.asBig; })[0] || items[0];
    const q = convert(pair.measure, pair.big, true, Math.round(bigItem.small * 1000 / pair.factor));
    const sorted = items.slice().sort(function (a, b) { return descending ? b.small - a.small : a.small - b.small; });
    const heading = descending ? 'Order from largest to smallest:' : 'Order from smallest to largest:';
    const amounts = items.map(function (item) { return item.text; }).join(' · ');
    q.kind = 'order';
    q.count = count;
    q.mix = category(q);
    q.equation = heading + '<span class="eq-amounts">' + amounts + '</span>';
    q.solvedEquation = q.equation;
    q.revealLines = ['Change them all to ' + pair.small + '.'].concat(items.map(function (item) {
      return item.text + ' = ' + item.small + ' ' + pair.small;
    })).concat([(descending ? 'Largest to smallest: ' : 'Smallest to largest: ') + sorted.map(function (item) { return item.text; }).join(' · ')]);
    q.steps = q.revealLines.map(function (text) { return { text: text }; });
    q.hasDecimal = items.some(function (item) { return item.text.indexOf('.') >= 0; });
    q.answer = sorted[0].small;
    return q;
  }
  function nb(amount, unit) { return amount + '\u00a0' + unit; }
  function choiceRow(options) {
    return '<span class="eq-choices">' + options.map(function (opt, i) {
      opt.letter = 'ABCD'[i];
      return '<span class="eq-choice"><span class="eq-letter">' + opt.letter + '</span>' + opt.label + '</span>';
    }).join('') + '</span>';
  }
  function finishChoice(q, options) {
    q.kind = 'choice';
    q.options = options;
    q.solvedEquation = q.equation;
    q.steps = q.revealLines.map(function (text) { return { text: text }; });
    q.hasDecimal = true;
    return q;
  }
  function gen7() {
    const whole = ri(1, 9);
    const rem = Math.random() < 0.5 ? ri(1, 9) * 10 : (ri(1, 9) * 10 + ri(1, 9));
    const metresMilli = whole * 1000 + rem * 10;
    const cm = whole * 100 + rem;
    const mm = cm * 10;
    const metresText = nb(fmt(metresMilli), 'm');
    const cmText = nb(String(cm), 'cm');
    const mmText = nb(String(mm), 'mm');
    const mixedText = whole + '\u00a0m ' + rem + '\u00a0cm';
    const q = convert('length', 'm', true, metresMilli);
    if (Math.random() < 0.35) {
      const options = shuffle([
        { label: 'm', shown: metresText, ok: true },
        { label: 'cm', shown: cmText, ok: false },
        { label: 'mm', shown: mmText, ok: false },
        { label: 'm and cm', shown: mixedText, ok: false }
      ]);
      q.choiceKind = 'builder';
      q.equation = 'Which unit would a builder use for ' + metresText + '?' + choiceRow(options);
      q.revealLines = options.map(function (opt) {
        return opt.letter + ' ' + opt.label + ' → ' + opt.shown + (opt.ok ? ' ✓' : '');
      }).concat(['A builder would use metres. ' + fmt(metresMilli) + ' is easy to hold in your head.']);
      q.answerText = 'm';
      return finishChoice(q, options);
    }
    const slipKind = pick(['cm', 'mm', 'mixed']);
    const slipCm = rem % 10 === 0 ? rem / 10 : Math.floor(rem / 10);
    const wrong = slipKind === 'cm'
      ? { label: nb(String(cm / 10), 'cm'), mm: cm, ok: false, slip: 'cm' }
      : (slipKind === 'mm'
        ? { label: nb(String(mm / 10), 'mm'), mm: mm / 10, ok: false, slip: 'mm' }
        : { label: whole + '\u00a0m ' + slipCm + '\u00a0cm', mm: whole * 1000 + slipCm * 10, ok: false, slip: 'mixed' });
    const options = shuffle([
      { label: cmText, mm: mm, ok: true },
      { label: mmText, mm: mm, ok: true },
      { label: mixedText, mm: mm, ok: true },
      wrong
    ]);
    q.choiceKind = 'notequal';
    q.equation = 'Which is NOT equal to ' + metresText + '?' + choiceRow(options);
    q.revealLines = options.map(function (opt) {
      return opt.letter + ' ' + opt.label + ' = ' + nb(fmt(opt.mm), 'm') + ' ' + (opt.ok ? '✓' : '✗');
    });
    const odd = options.filter(function (opt) { return !opt.ok; })[0];
    q.revealLines.push('The odd one out is ' + odd.letter + ', ' + odd.label + '.');
    q.answerText = odd.label;
    return finishChoice(q, options);
  }

  const GENS = { 1: gen1, 2: gen2, 3: gen3, 4: gen4, 5: gen5, 6: gen6, 7: gen7 };
  function normal(level) { return GENS[level](); }

  function render(q, stepIndex, el) {
    const tabs = ['length', 'mass', 'capacity'].map(function (id) {
      const on = id === q.measure ? ' on' : '';
      return '<span class="measure-tab' + on + '" style="' + (on ? 'background:' + MEASURES[id].color : '') + '">' + MEASURES[id].name + '</span>';
    }).join('');
    const rows = MEASURES[q.measure].rows.map(function (row) {
      const on = row.big === q.big;
      const used = q.down ? '× ' + row.factor : '÷ ' + row.factor;
      return '<div class="unit-row' + (on ? '' : ' fade') + '" style="color:' + MEASURES[q.measure].color + '">' +
        '<span class="unit-pill">' + row.big + '</span>' +
        '<span class="unit-arrows"><b>' + (q.down && on ? used : '× ' + row.factor) + ' →</b><br>← ' +
        ( !q.down && on ? '<b>÷ ' + row.factor + '</b>' : '÷ ' + row.factor) + '</span>' +
        '<span class="unit-pill">' + row.small + '</span></div>';
    }).join('');
    const start = {};
    Object.keys(q.parsed.map).forEach(function (key) {
      const digit = q.parsed.map[key];
      const highlight = Number(key) >= q.parsed.sigMin && Number(key) <= q.parsed.sigMax && digit;
      start[key] = { text: String(digit), kind: highlight ? 'move' : '' };
    });
    const answer = {};
    Object.keys(q.moved).forEach(function (key) {
      answer[key] = { text: String(q.moved[key]), kind: 'move' };
    });
    q.gaps.forEach(function (pos) { answer[String(pos)] = { text: '0', kind: 'ph' }; });
    const answerMap = {};
    Object.keys(q.moved).forEach(function (key) { answerMap[key] = q.moved[key]; });
    q.gaps.forEach(function (pos) { answerMap[pos] = 0; });
    el.innerHTML = '<div class="unit-set">' + tabs + rows + '</div>' +
      '<div class="check-you"><p class="eyebrow">Check yourself</p><p>' + q.check + '</p></div>' +
      PlaceChart.render({
        columns: (function () {
          let min = 0;
          let max = 0;
          [q.parsed.map, answerMap].forEach(function (map) {
            Object.keys(map).forEach(function (key) {
              const pos = Number(key);
              if (pos < min) min = pos;
              if (pos > max) max = pos;
            });
          });
          min = Math.max(-3, min - 1);
          max = Math.min(4, max + 1);
          const labels = { 4: 'TTh', 3: 'Th', 2: 'H', 1: 'T', 0: 'O', '-1': 't', '-2': 'h', '-3': 'th' };
          const cols = [];
          for (let pos = max; pos >= 0; pos--) cols.push({ id: String(pos), label: labels[pos] });
          cols.push({ id: 'dot', label: '·' });
          for (let pos = -1; pos >= min; pos--) cols.push({ id: String(pos), label: labels[pos] });
          return cols;
        })(),
        startLabel: q.fromUnit,
        start: start,
        answer: answer,
        answerLabel: q.toUnit,
        arrow: {
          from: String(q.parsed.sigMax),
          to: String(q.parsed.sigMax + q.delta),
          label: q.places + ' place' + (q.places === 1 ? '' : 's') + ' ' + q.dir
        }
      });
  }

  function predict(q) {
    if (q && q.kind === 'order') {
      return { lines: ['Change them all to the same unit first. Which unit will you use?'] };
    }
    if (q && q.kind === 'choice') {
      return { lines: [q.choiceKind === 'builder'
        ? 'Which unit gives a number that\'s easy to hold in your head?'
        : 'Change each one into the same unit. Which one doesn\'t match?'] };
    }
    return { lines: [
      'Going to a bigger or smaller unit?',
      'Will your number get bigger or smaller?',
      'Which way will the digits move — left or right?'
    ] };
  }

  function extBank() {
    return [
      { type: 'Word problem', kind: 'number', expect: '250', hint: '1 L = 1000 mL. Take 750 away from 1000.', p: 'A recipe needs 750 mL of milk. You have a 1 L carton. How many millilitres are left?', a: '1 L = 1000 mL. 1000 − 750 = <strong>250 mL</strong>.' },
      { type: 'Word problem', kind: 'number', expect: '2500', hint: 'km → m is × 1000. The digits jump 3 places left.', p: 'A cross-country course is 2.5 km long. How many metres is that?', a: '2.5 km = <strong>2500 m</strong>.' },
      { type: 'Word problem', kind: 'number', expect: '0.45', hint: 'g → kg is ÷ 1000. The digits jump 3 places right.', p: 'A bag of flour weighs 450 g. How many kilograms is that?', a: '450 g = <strong>0.45 kg</strong>.' },
      { type: 'Compare', kind: 'tf', expect: 'true', hint: 'Change 1.2 m into centimetres, then compare.', p: 'True or false?<br><strong>1.2 m is longer than 115 cm</strong>', a: '1.2 m = 120 cm. 120 is more than 115. <strong>True</strong>.' },
      { type: 'Missing number', kind: 'number', expect: '235', hint: '2 m = 200 cm. Then add the 35 cm.', p: '2 m 35 cm = ___ cm', a: '2 m = 200 cm. 200 + 35 = <strong>235 cm</strong>.' },
      { type: 'True or False', kind: 'tf', expect: 'false', hint: '2.35 m in kilometres is 3 places right, not 2.', p: 'True or false?<br><strong>2.35 m = 0.0235 km</strong>', a: '2.35 m = 0.00235 km. <strong>False</strong>.' }
    ];
  }

  const TIPS = {
    'Which rule': 'Find the pair on the chart. Smaller unit means ×. Bigger unit means ÷.',
    'Which way': '× makes the number bigger, so the digits jump left. ÷ makes it smaller, so they jump right.',
    'How many places': '× or ÷ 10 is 1 place, 100 is 2 places, and 1000 is 3 places.',
    'Zeros hold the place': 'If a place between the digits and the decimal point is empty, a 0 holds it.',
    'Decimal point': 'The decimal point stays in its column. Only the digits move.'
  };

  EM.registerTopic({
    id: 'conv',
    name: 'Converting units',
    homeExample: 'e.g. 2.5 km = ? m',
    section: 'measurement',
    plain: true,
    levels: [
      { id: 1, name: 'm ↔ cm, cm ↔ mm', example: '352 cm → m' },
      { id: 2, name: 'km ↔ m', example: '4 km → m' },
      { id: 3, name: 'Mass and capacity', example: '2 kg → g' },
      { id: 4, name: 'Decimal amounts', example: '2.5 km → m' },
      { id: 5, name: 'Mixed units', example: '2 m 35 cm → cm' },
      { id: 6, name: 'Order amounts', example: '0.4 kg · 412 g · 0.5 kg' },
      { id: 7, name: 'One measurement, many ways', example: 'Which is NOT equal to 6.35 m?' }
    ],
    tricky: [
      { id: 'decimal', tags: ['Decimal point'], levels: [4, 7] },
      { id: 'compare', tags: ['Which rule'], levels: [6] }
    ],
    errorTags: ['Which rule', 'Which way', 'How many places', 'Zeros hold the place', 'Decimal point'],
    tips: TIPS,
    makeQuestion: function (level, opts) {
      opts = opts || {};
      const want = opts.tricky ? (level >= 6 ? 6 : 4) : level;
      for (let i = 0; i < 80; i++) {
        const q = normal(want);
        if (!fits(want, q)) continue;
        q.level = level;
        q.tricky = !!opts.tricky;
        return q;
      }
      const q = normal(level);
      q.level = level;
      q.tricky = !!opts.tricky;
      return q;
    },
    estimate: function (q) { return { prompt: q.fromText, answer: q.answer }; },
    predict: predict,
    buildSteps: function (q) { return q.steps || []; },
    render: render,
    strategy: function () { return ''; },
    chipsFor: function (q) {
      const chips = ['Which rule', 'Which way', 'How many places'];
      if (q.gaps && q.gaps.length) chips.push('Zeros hold the place');
      if (q.hasDecimal) chips.push('Decimal point');
      return chips;
    },
    extensions: function () { return extBank(); }
  });
})();
