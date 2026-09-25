/* × and ÷ by 10, 100, 1000. Digits move. The decimal point stays still. */
const PlaceValue = (function () {
  const LABELS = { 4: 'TTh', 3: 'Th', 2: 'H', 1: 'T', 0: 'O', '-1': 't', '-2': 'h', '-3': 'th' };
  const PLACE = {
    4: 'ten-thousands', 3: 'thousands', 2: 'hundreds', 1: 'tens', 0: 'ones',
    '-1': 'tenths', '-2': 'hundredths', '-3': 'thousandths'
  };

  function ri(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
  function pick(list) { return list[ri(0, list.length - 1)]; }
  function placesOf(power) { return power === 10 ? 1 : power === 100 ? 2 : 3; }

  function fmt(milli) {
    const sign = milli < 0 ? '-' : '';
    const v = Math.abs(Math.round(milli));
    const whole = Math.floor(v / 1000);
    const frac = v % 1000;
    if (!frac) return sign + String(whole);
    return sign + whole + '.' + String(frac).padStart(3, '0').replace(/0+$/, '');
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
    const top = Math.max(0, sigMax);
    for (let pos = top; pos >= sigMin; pos--) {
      if (map[pos] == null) map[pos] = 0;
    }
    return { map: map, sigMin: sigMin, sigMax: sigMax };
  }

  function shiftDigits(parsed, delta) {
    const moved = {};
    for (let pos = parsed.sigMin; pos <= parsed.sigMax; pos++) {
      moved[pos + delta] = parsed.map[pos] || 0;
    }
    return moved;
  }

  function placeholderPositions(moved) {
    const keys = Object.keys(moved).map(Number);
    const lo = Math.min.apply(null, keys);
    const hi = Math.max.apply(null, keys);
    const gaps = [];
    if (lo > 0) { for (let pos = lo - 1; pos >= 0; pos--) gaps.push(pos); }
    if (hi < 0) { for (let pos = 0; pos > hi; pos--) gaps.push(pos); }
    return gaps;
  }

  function hasInternalZero(parsed) {
    for (let pos = parsed.sigMin; pos <= parsed.sigMax; pos++) {
      if (!parsed.map[pos]) return true;
    }
    return false;
  }

  function gapBeforeDigit(parsed) {
    return parsed.sigMax < 0 && parsed.sigMax < -1;
  }

  function columnsFor(maps) {
    let min = 0;
    let max = 0;
    maps.forEach(function (map) {
      Object.keys(map).forEach(function (key) {
        const pos = Number(key);
        if (pos < min) min = pos;
        if (pos > max) max = pos;
      });
    });
    min = Math.max(-3, min - 1);
    max = Math.min(4, max + 1);
    const cols = [];
    for (let pos = max; pos >= 0; pos--) cols.push({ id: String(pos), label: LABELS[pos] });
    cols.push({ id: 'dot', label: '·' });
    for (let pos = -1; pos >= min; pos--) cols.push({ id: String(pos), label: LABELS[pos] });
    return cols;
  }

  function howPhrase(power, places) {
    if (places === 1) return '10 is one ten, so each digit moves 1 place.';
    if (places === 2) return '100 is 10 × 10, so each digit moves 2 places.';
    return '1000 is 10 × 10 × 10, so each digit moves 3 places.';
  }

  function fillText(parsed, delta, gaps, resultText) {
    const bits = [];
    for (let pos = parsed.sigMax; pos >= parsed.sigMin; pos--) {
      const digit = parsed.map[pos];
      if (!digit) continue;
      bits.push('the ' + digit + ' lands in the ' + PLACE[pos + delta]);
    }
    const landed = bits.join(' and ');
    if (!gaps.length) return 'No gaps to fill this time.';
    const names = gaps.map(function (pos) { return 'the ' + PLACE[pos]; });
    const where = names.length === 1 ? names[0] + ' place is' : names.join(' and ') + ' are';
    const zeros = gaps.length === 1 ? 'a 0' : 'a 0 in each';
    return landed.charAt(0).toUpperCase() + landed.slice(1) + '. ' + where.charAt(0).toUpperCase() + where.slice(1) +
      ' empty, so put ' + zeros + ' to hold the place: ' + resultText + '.';
  }

  function make(spec) {
    const places = placesOf(spec.power);
    const delta = spec.op === '×' ? places : -places;
    const startMilli = spec.startMilli;
    const resultMilli = spec.op === '×' ? startMilli * Math.pow(10, places) : startMilli / Math.pow(10, places);
    const parsed = parseDigits(startMilli);
    const moved = shiftDigits(parsed, delta);
    const gaps = placeholderPositions(moved);
    const startText = fmt(startMilli);
    const resultText = fmt(resultMilli);
    const dir = delta > 0 ? 'left' : 'right';
    const way = spec.op === '×' ? 'bigger' : 'smaller';
    const q = {
      op: spec.op,
      power: spec.power,
      places: places,
      delta: delta,
      dir: dir,
      missing: !!spec.missing,
      startMilli: startMilli,
      resultMilli: resultMilli,
      startText: startText,
      resultText: resultText,
      parsed: parsed,
      moved: moved,
      gaps: gaps,
      internalZero: hasInternalZero(parsed),
      gapBefore: gapBeforeDigit(parsed),
      wholeStart: startMilli % 1000 === 0,
      wholeResult: resultMilli % 1000 === 0,
      answer: spec.missing ? spec.power : resultMilli / 1000,
      dp: spec.missing ? 0 : dpOf(resultMilli)
    };
    if (spec.missing) {
      q.equation = startText + ' ' + spec.op + ' ___ = ' + resultText;
      q.solvedEquation = startText + ' ' + spec.op + ' ' + spec.power + ' = ' + resultText;
    } else {
      q.equation = startText + ' ' + spec.op + ' ' + spec.power + ' = ?';
      q.solvedEquation = startText + ' ' + spec.op + ' ' + spec.power + ' = ' + resultText;
    }
    q.steps = buildSteps(q);
    return q;
  }

  function buildSteps(q) {
    const which = q.missing
      ? (q.op === '×'
        ? q.resultText + ' is bigger than ' + q.startText + ', so the number got bigger. The digits move left. This is multiplying.'
        : q.resultText + ' is smaller than ' + q.startText + ', so the number got smaller. The digits move right. This is dividing.')
      : (q.op === '×'
        ? 'Multiplying by ' + q.power + ' makes the number bigger, so the digits move left.'
        : 'Dividing by ' + q.power + ' makes the number smaller, so the digits move right.');
    let far;
    if (q.missing) {
      const from = PLACE[q.parsed.sigMax];
      const to = PLACE[q.parsed.sigMax + q.delta];
      const digit = q.parsed.map[q.parsed.sigMax];
      far = 'The ' + digit + ' moves from the ' + from + ' place to the ' + to + ' place. That is ' +
        q.places + ' place' + (q.places === 1 ? '' : 's') + '. ' + q.places + ' place' + (q.places === 1 ? '' : 's') +
        ' means ' + q.op + ' ' + q.power + '.';
    } else {
      far = howPhrase(q.power, q.places);
    }
    let fill = fillText(q.parsed, q.delta, q.gaps, q.resultText);
    if (q.missing) fill += ' The missing number is ' + q.power + '.';
    const tags = ['Which way', 'How far'];
    if (q.gaps.length) tags.push('Placeholder zero');
    tags.push('Decimal point');
    return [
      { kind: 'teach', title: 'Which way?', label: 'Which way?', text: which, stepTag: 'Which way', tags: tags },
      { kind: 'teach', title: 'How far?', label: 'How far?', text: far, stepTag: 'How far', tags: tags },
      { kind: 'teach', title: 'Fill the gaps', label: 'Fill the gaps', text: fill, stepTag: q.gaps.length ? 'Placeholder zero' : 'How far', tags: tags }
    ];
  }

  function rowCells(map, highlight) {
    const cells = {};
    Object.keys(map).forEach(function (key) {
      cells[key] = { text: String(map[key]), kind: highlight && highlight[key] ? 'move' : '' };
    });
    return cells;
  }

  function render(q, stepIndex, el) {
    const showAnswer = stepIndex >= 1;
    const showGaps = stepIndex >= 2;
    const startHighlight = {};
    for (let pos = q.parsed.sigMin; pos <= q.parsed.sigMax; pos++) {
      if (q.parsed.map[pos]) startHighlight[String(pos)] = true;
    }
    const answer = {};
    if (showAnswer) {
      Object.keys(q.moved).forEach(function (key) {
        answer[key] = { text: String(q.moved[key]), kind: 'move' };
      });
      if (showGaps) {
        q.gaps.forEach(function (pos) {
          answer[String(pos)] = { text: '0', kind: 'ph' };
        });
      }
    }
    const start = rowCells(q.parsed.map, showAnswer ? startHighlight : {});
    if (q.startMilli < 1000 && !start['0']) start['0'] = { text: '0', kind: '' };
    const answerMap = {};
    Object.keys(q.moved).forEach(function (key) { answerMap[key] = q.moved[key]; });
    if (showGaps) q.gaps.forEach(function (pos) { answerMap[pos] = 0; });
    const placesWord = q.places + ' place' + (q.places === 1 ? '' : 's') + ' ' + q.dir;
    el.innerHTML = PlaceChart.render({
      columns: columnsFor([q.parsed.map, showAnswer ? answerMap : { 0: 0 }]),
      start: start,
      answer: showAnswer ? answer : null,
      answerLabel: q.op + ' ' + (q.missing && stepIndex < 1 ? '?' : q.power),
      arrow: showAnswer ? {
        from: String(q.parsed.sigMax),
        to: String(q.parsed.sigMax + q.delta),
        label: placesWord
      } : null
    });
  }

  function level5(q) {
    return q.gaps.length >= 2 || q.internalZero || q.gapBefore || (q.places === 3 && q.gaps.length >= 1);
  }

  function fits(level, q) {
    if (!q || q.resultMilli % 1 !== 0 || dpOf(q.resultMilli) > 3) return false;
    if (parseDigits(q.startMilli).sigMax > 4 || parseDigits(q.resultMilli).sigMax > 4) return false;
    if (parseDigits(q.resultMilli).sigMin < -3) return false;
    if (level === 1) return !q.missing && q.op === '×' && q.wholeStart && q.wholeResult;
    if (level === 2) return !q.missing && q.op === '÷' && q.wholeStart && q.wholeResult;
    if (level === 3) return !q.missing && q.op === '×' && !q.wholeStart && !level5(q);
    if (level === 4) return !q.missing && q.op === '÷' && !q.wholeResult && !level5(q);
    if (level === 5) return !q.missing && level5(q);
    if (level === 6) return q.missing && (q.power === 10 || q.power === 100 || q.power === 1000);
    if (level === 7) return true;
    return false;
  }

  function wholeMilli(n) { return n * 1000; }

  function decimalMilli() {
    const dp = pick([1, 2, 3]);
    const whole = ri(0, 40);
    const frac = ri(1, Math.pow(10, dp) - 1);
    return whole * 1000 + frac * Math.pow(10, 3 - dp);
  }

  function gen1() {
    const power = pick([10, 100, 1000]);
    return make({ op: '×', power: power, startMilli: wholeMilli(ri(2, Math.floor(9000 / power))), missing: false });
  }
  function gen2() {
    const power = pick([10, 100, 1000]);
    return make({ op: '÷', power: power, startMilli: wholeMilli(ri(2, Math.floor(9000 / power)) * power), missing: false });
  }
  function gen3() {
    const power = pick([10, 100, 1000]);
    return make({ op: '×', power: power, startMilli: decimalMilli(), missing: false });
  }
  function gen4() {
    const power = pick([10, 100, 1000]);
    const places = placesOf(power);
    const dp = ri(1, Math.min(3, places));
    const head = ri(1, 9);
    const tail = ri(1, 9);
    const start = (head * 10 + tail) * Math.pow(10, places - dp);
    return make({ op: '÷', power: power, startMilli: wholeMilli(start), missing: false });
  }
  function gen5() {
    const roll = Math.random();
    if (roll < 0.34) {
      const power = pick([100, 1000]);
      const dp = power === 100 ? 2 : pick([2, 3]);
      return make({ op: '×', power: power, startMilli: ri(1, 9) * Math.pow(10, 3 - dp), missing: false });
    }
    if (roll < 0.67) {
      return make({ op: '÷', power: pick([100, 1000]), startMilli: wholeMilli(ri(1, 9)), missing: false });
    }
    const tens = ri(1, 9);
    const frac = ri(1, 9);
    return make({ op: '×', power: pick([10, 100]), startMilli: tens * 10000 + frac * 100, missing: false });
  }
  function gen6() {
    const power = pick([10, 100, 1000]);
    const op = Math.random() < 0.5 ? '×' : '÷';
    if (op === '×') {
      const start = Math.random() < 0.5 ? wholeMilli(ri(2, 80)) : decimalMilli();
      return make({ op: '×', power: power, startMilli: start, missing: true });
    }
    const resultIsWhole = Math.random() < 0.5;
    const result = resultIsWhole ? wholeMilli(ri(2, 80)) : decimalMilli();
    return make({ op: '÷', power: power, startMilli: result * Math.pow(10, placesOf(power)), missing: true });
  }

  const GENS = { 1: gen1, 2: gen2, 3: gen3, 4: gen4, 5: gen5, 6: gen6 };
  function normal(level) {
    if (level === 7) return GENS[ri(1, 6)]();
    return GENS[level]();
  }

  function predict(q) {
    return q.op === '×'
      ? { before: 'Will the answer be bigger or smaller?', after: 'Bigger — we multiplied' }
      : { before: 'Will the answer be bigger or smaller?', after: 'Smaller — we divided' };
  }

  function estimate(q) {
    if (q.missing) return { prompt: q.startText + ' ' + q.op + ' ?', answer: q.power };
    const rounded = q.wholeStart ? Math.round(q.startMilli / 1000 / 10) * 10 : Math.round(q.startMilli / 1000);
    const base = rounded || (q.startMilli / 1000);
    const value = q.op === '×' ? base * q.power : base / q.power;
    return { prompt: base + ' ' + q.op + ' ' + q.power, answer: value };
  }

  function strategy(q) {
    return '<strong>The digits move ' + q.dir + '.</strong> The decimal point stays where it is. ' +
      q.places + ' place' + (q.places === 1 ? '' : 's') + ' gives <strong>' +
      (q.missing ? q.power : q.resultText) + '</strong>.';
  }

  function extBank() {
    const bigger = Math.random() < 0.5;
    return [
      {
        type: 'Compare', kind: 'tf', expect: bigger ? 'true' : 'false',
        hint: 'Work out each one. Multiplying moves the digits left. Dividing moves them right.',
        p: 'True or false?<br><strong>0.4 × 100 is bigger than 400 ÷ ' + (bigger ? '100' : '10') + '</strong>',
        a: bigger
          ? '0.4 × 100 = 40 and 400 ÷ 100 = 4. <strong>True</strong> — 40 is bigger.'
          : '0.4 × 100 = 40 and 400 ÷ 10 = 40. <strong>False</strong> — they are the same.'
      },
      {
        type: 'True or False', kind: 'tf', expect: 'false',
        hint: 'Multiplying by 10 moves every digit one place left. The decimal point stays still.',
        p: 'True or false?<br><strong>2.5 × 10 = 2.50</strong>',
        a: '2.5 × 10 = 25. The digits move one place left. <strong>False</strong>.'
      },
      {
        type: 'Missing number', kind: 'number', expect: '3.7',
        hint: '1000 times smaller means the digits move 3 places right.',
        p: 'What number is 1000 times smaller than 3700?',
        a: '3700 ÷ 1000 = <strong>3.7</strong>'
      },
      {
        type: 'True or False', kind: 'tf', expect: 'true',
        hint: 'Dividing by 100 moves the digits 2 places right.',
        p: 'True or false?<br><strong>45 ÷ 100 = 0.45</strong>',
        a: 'The 4 moves to the tenths and the 5 to the hundredths. Put a 0 in the ones: <strong>0.45. True</strong>.'
      },
      {
        type: 'Missing number', kind: 'number', expect: '60',
        hint: 'Multiplying by 1000 moves the digits 3 places left.',
        p: 'Fill the gap: 0.06 × 1000 = ___',
        a: 'The 6 moves from the hundredths to the tens. Put a 0 in the ones: <strong>60</strong>'
      },
      {
        type: 'Word problem', kind: 'number', expect: '4.5',
        hint: '100 times smaller means the digits move 2 places right.',
        p: 'A length is 450 cm. What is it in metres? (100 cm = 1 m)',
        a: '450 ÷ 100 = <strong>4.5 m</strong>'
      }
    ];
  }

  const TIPS = {
    'Which way': 'Multiplying makes the number bigger, so the digits move left. Dividing makes it smaller, so they move right.',
    'How far': '10 is 1 place, 100 is 2 places, and 1000 is 3 places.',
    'Placeholder zero': 'If a place between the digits and the decimal point is empty, write a 0 there. Do not say "add a zero".',
    'Decimal point': 'The decimal point stays in its column. Only the digits move.'
  };

  EM.registerTopic({
    id: 'pv',
    name: '× and ÷ by 10, 100, 1000',
    section: 'placevalue',
    levels: [
      { id: 1, name: 'Whole numbers × 10, 100, 1000', example: '45 × 100' },
      { id: 2, name: 'Whole numbers ÷, whole answers', example: '4500 ÷ 100' },
      { id: 3, name: 'Decimals ×', example: '3.45 × 100' },
      { id: 4, name: '÷ giving a decimal', example: '45 ÷ 100' },
      { id: 5, name: 'Placeholder zeros', example: '0.06 × 1000' },
      { id: 6, name: 'Missing numbers', example: '3.2 × ___ = 320' },
      { id: 7, name: 'Mixed', example: '7 ÷ 1000' }
    ],
    tricky: [
      { id: 'gaps', tags: ['Placeholder zero'], levels: [5, 7] },
      { id: 'missing', tags: ['Which way', 'How far'], levels: [6, 7] }
    ],
    errorTags: ['Which way', 'How far', 'Placeholder zero', 'Decimal point'],
    tips: TIPS,
    makeQuestion: function (level, opts) {
      opts = opts || {};
      for (let i = 0; i < 60; i++) {
        const q = opts.tricky ? (level >= 6 ? gen6() : gen5()) : normal(level);
        if (!fits(opts.tricky ? (level >= 6 ? 6 : 5) : level, q)) continue;
        q.level = level;
        q.tricky = !!opts.tricky;
        return q;
      }
      const q = normal(level);
      q.level = level;
      q.tricky = !!opts.tricky;
      return q;
    },
    estimate: estimate,
    predict: predict,
    buildSteps: function (q) { return q.steps || buildSteps(q); },
    render: render,
    strategy: strategy,
    chipsFor: function (q) {
      const used = {};
      (q.steps || []).forEach(function (s) {
        (s.tags || []).forEach(function (tag) { used[tag] = true; });
      });
      return this.errorTags.filter(function (tag) { return used[tag]; });
    },
    extensions: function () { return extBank(); }
  });
})();
