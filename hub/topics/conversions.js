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
    const whole = dpOf(q.fromMilli) === 0 && dpOf(q.resultMilli) === 0;
    if (level === 1) return q.kind === 'convert' && q.measure === 'length' && q.factor !== 1000 && whole;
    if (level === 2) return q.kind === 'convert' && q.big === 'km' && whole;
    if (level === 3) return q.kind === 'convert' && q.measure !== 'length' && whole;
    if (level === 4) return q.kind === 'convert' && !whole;
    if (level === 5) return q.kind === 'mixed';
    if (level === 6) return q.kind === 'compare' || q.kind === 'order';
    if (level === 7) return q.kind === 'choice';
    return false;
  }

  function wholeDown(measure, big, cap) {
    const row = rowOf(measure, big);
    return convert(measure, big, true, ri(2, cap || Math.min(40, Math.floor(90000 / row.factor))) * 1000);
  }
  function wholeUp(measure, big, cap) {
    const row = rowOf(measure, big);
    const result = ri(2, cap || 40);
    return convert(measure, big, false, result * row.factor * 1000);
  }
  function gen1() {
    const big = pick(['m', 'cm']);
    return Math.random() < 0.5 ? wholeDown('length', big, 40) : wholeUp('length', big, 40);
  }
  function gen2() {
    return Math.random() < 0.5 ? wholeDown('length', 'km', 40) : wholeUp('length', 'km', 40);
  }
  function gen3() {
    const choice = pick([{ m: 'mass', b: 't' }, { m: 'mass', b: 'kg' }, { m: 'capacity', b: 'L' }]);
    return Math.random() < 0.5 ? wholeDown(choice.m, choice.b, 40) : wholeUp(choice.m, choice.b, 20);
  }
  function gen4() {
    const choice = pick([
      { m: 'length', b: 'km' }, { m: 'length', b: 'm' }, { m: 'mass', b: 'kg' }, { m: 'capacity', b: 'L' }
    ]);
    const row = rowOf(choice.m, choice.b);
    if (Math.random() < 0.5) {
      const dp = pick([1, 2]);
      const whole = ri(0, 12);
      const frac = ri(1, Math.pow(10, dp) - 1);
      const milli = whole * 1000 + frac * Math.pow(10, 3 - dp);
      return convert(choice.m, choice.b, true, milli);
    }
    const dp = pick([1, 2]);
    const whole = ri(0, 9);
    const frac = ri(1, Math.pow(10, dp) - 1);
    const resultMilli = whole * 1000 + frac * Math.pow(10, 3 - dp);
    return convert(choice.m, choice.b, false, resultMilli * row.factor);
  }
  function gen5() {
    if (Math.random() < 0.5) {
      const metres = ri(1, 9);
      const cm = ri(1, 99);
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
    const m = ri(1, 999);
    const fromMilli = (km * 1000 + m) * 1000;
    const q = convert('length', 'km', false, fromMilli, (km * 1000 + m) + ' m');
    q.kind = 'mixed';
    q.equation = (km * 1000 + m) + ' m = ? km ? m';
    q.solvedEquation = (km * 1000 + m) + ' m = ' + km + ' km ' + m + ' m';
    q.another = (km * 1000 + m) + ' m = ' + fmt(q.resultMilli) + ' km = ' + km + ' km ' + m + ' m';
    q.revealLines[q.revealLines.length - 1] = 'Say it another way: ' + q.another + '.';
    return q;
  }
  function gen6() {
    if (Math.random() < 0.5) {
      const metresMilli = ri(1, 20) * 100 + ri(0, 9) * 10;
      const cm = ri(20, 400);
      const q = convert('length', 'm', true, metresMilli);
      const leftCm = q.resultMilli / 1000;
      const longer = leftCm === cm ? 'the same' : (leftCm > cm ? q.fromText : cm + ' cm');
      q.kind = 'compare';
      q.equation = 'Which is longer: ' + q.fromText + ' or ' + cm + ' cm?';
      q.solvedEquation = longer === 'the same'
        ? q.fromText + ' and ' + cm + ' cm are the same length'
        : longer + ' is longer';
      q.revealLines[q.revealLines.length - 1] = 'Say it another way: ' + q.fromText + ' = ' + fmt(q.resultMilli) +
        ' cm. ' + (longer === 'the same' ? 'They are the same length.' : longer + ' is longer.');
      q.answer = leftCm;
      return q;
    }
    const a = ri(1, 9) * 100;
    const b = ri(100, 900);
    const c = ri(1, 9) * 100 + ri(1, 9) * 10;
      const items = [
      { text: fmt(a) + ' kg', grams: a },
      { text: b + ' g', grams: b },
      { text: fmt(c) + ' kg', grams: c }
    ];
    items.sort(function (x, y) { return x.grams - y.grams; });
    const q = convert('mass', 'kg', true, a);
    q.kind = 'order';
    q.equation = 'Order from smallest: ' + fmt(a) + ' kg, ' + b + ' g, ' + fmt(c) + ' kg';
    q.solvedEquation = items.map(function (item) { return item.text; }).join(', ');
    q.revealLines[q.revealLines.length - 1] = 'Say it another way: ' + fmt(a) + ' kg = ' + a + ' g and ' + fmt(c) +
      ' kg = ' + c + ' g. Smallest to largest: ' + q.solvedEquation + '.';
    q.answer = a;
    return q;
  }
  function pointShift(text, places) {
    const negative = false;
    const raw = text.replace('.', '');
    const point = text.indexOf('.') === -1 ? text.length : text.indexOf('.');
    const at = point - places;
    const padded = (at < 0 ? '0'.repeat(-at) : '') + raw + (at > raw.length ? '0'.repeat(at - raw.length) : '');
    const cut = at < 0 ? 0 : at;
    let body = padded.slice(0, cut) + '.' + padded.slice(cut);
    if (body.charAt(0) === '.') body = '0' + body;
    return body.replace(/^0+(?=\d)/, '').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '') || '0';
  }
  function gen7() {
    const whole = ri(1, 8);
    const rem = pick([25, 35, 5, 50, 75]);
    const milli = whole * 1000 + rem * 10;
    const cm = whole * 100 + rem;
    const mm = cm * 10;
    const mixed = whole + ' m ' + rem + ' cm';
    const kmText = pointShift(fmt(milli), 3);
    if (Math.random() < 0.5) {
      const wrong = pointShift(fmt(milli), 2);
      const q = convert('length', 'm', true, milli);
      q.kind = 'choice';
      q.equation = 'Which is NOT equal to ' + fmt(milli) + ' m?  ' + cm + ' cm, ' + mm + ' mm, ' + wrong + ' km, ' + mixed;
      q.solvedEquation = wrong + ' km is not equal';
      q.another = fmt(milli) + ' m = ' + cm + ' cm = ' + mm + ' mm = ' + kmText + ' km = ' + mixed;
      q.revealLines[q.revealLines.length - 1] = 'Say it another way: ' + q.another + '.';
      q.revealLines.push(wrong + ' km is not equal to ' + fmt(milli) + ' m.');
      q.answerText = wrong + ' km';
      return q;
    }
    const q = convert('length', 'm', true, milli);
    q.kind = 'choice';
    q.equation = 'Which unit would a builder use for ' + fmt(milli) + ' m?  m, cm, mm or km?';
    q.solvedEquation = 'm — a builder\'s plan';
    q.revealLines.push('A builder\'s plan uses metres. ' + fmt(milli) + ' m is a number you can hold in your head.');
    q.answerText = 'm';
    return q;
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

  function predict() {
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
    section: 'measurement',
    plain: true,
    levels: [
      { id: 1, name: 'm ↔ cm, cm ↔ mm', example: '3 m → cm' },
      { id: 2, name: 'km ↔ m', example: '4 km → m' },
      { id: 3, name: 'Mass and capacity', example: '2 kg → g' },
      { id: 4, name: 'Decimal amounts', example: '2.5 km → m' },
      { id: 5, name: 'Mixed units', example: '2 m 35 cm → cm' },
      { id: 6, name: 'Compare and order', example: '1.2 m or 115 cm?' },
      { id: 7, name: 'One measurement, many ways', example: 'Which is not equal to 2.35 m?' }
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
