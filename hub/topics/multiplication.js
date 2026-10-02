/* Multiplication topic. Short and long steps are ported from
   embedmaths-multiplication.html and split so each column finishes
   before the next one starts. */
(function () {
  const PLACE = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands'];

  function ri(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function colName(idx) {
    return PLACE[idx] || 'place';
  }

  function titleCase(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  function singular(name, n) {
    const map = {
      ones: 'one', tens: 'ten', hundreds: 'hundred', thousands: 'thousand',
      'ten-thousands': 'ten-thousand', 'hundred-thousands': 'hundred-thousand'
    };
    return n === 1 ? (map[name] || name) : name;
  }

  function regroupInto(n, place) {
    return 'regroup ' + n + ' ' + singular(place, n) + ' into the ' + place;
  }

  function digitsOf(n) {
    return String(n).split('').reverse().map(Number);
  }

  function fmtDp(n, dp) {
    if (!dp) return String(Math.round(n));
    return Number(n).toFixed(dp);
  }

  function makeWhole(aDigits, bDigits) {
    const a = ri(Math.pow(10, aDigits - 1), Math.pow(10, aDigits) - 1);
    let b = ri(bDigits === 1 ? 2 : Math.pow(10, bDigits - 1), Math.pow(10, bDigits) - 1);
    if (bDigits > 1 && b % 10 === 0) b += ri(1, 9);
    return { a: a, b: b, dpA: 0, dpB: 0 };
  }

  function makeDecWhole() {
    const two = Math.random() < 0.5;
    const b = ri(2, 9);
    if (two) {
      let n = ri(100, 999);
      if (n % 10 === 0) n += ri(1, 9);
      return { a: n / 100, b: b, dpA: 2, dpB: 0, aInt: n, bInt: b };
    }
    let n = ri(11, 99);
    if (n % 10 === 0) n += ri(1, 9);
    return { a: n / 10, b: b, dpA: 1, dpB: 0, aInt: n, bInt: b };
  }

  function makeDecDec(longForm) {
    if (!longForm) {
      let n = ri(11, 99);
      if (n % 10 === 0) n += 1;
      const b = ri(2, 9);
      const under = Math.random() < 0.5;
      return { a: n / 10, b: under ? b / 10 : b / 10, dpA: 1, dpB: 1, aInt: n, bInt: b };
    }
    let a = ri(11, 99);
    let b = ri(11, 99);
    if (a % 10 === 0) a += 1;
    if (b % 10 === 0) b += 1;
    return { a: a / 10, b: b / 10, dpA: 1, dpB: 1, aInt: a, bInt: b };
  }

  function pack(spec, tricky) {
    const dpTotal = spec.dpA + spec.dpB;
    const aInt = spec.aInt != null ? spec.aInt : spec.a;
    const bInt = spec.bInt != null ? spec.bInt : spec.b;
    const textA = fmtDp(spec.a, spec.dpA);
    const textB = fmtDp(spec.b, spec.dpB);
    const long = String(bInt).length > 1;
    return {
      a: spec.a,
      b: spec.b,
      aInt: aInt,
      bInt: bInt,
      dpA: spec.dpA,
      dpB: spec.dpB,
      dp: dpTotal,
      dpTotal: dpTotal,
      textA: textA,
      textB: textB,
      equation: textA + ' × ' + textB,
      sign: '×',
      op: 'multiplication',
      long: long,
      tricky: !!tricky
    };
  }

  function normal(level) {
    if (level === 1) return pack(makeWhole(2, 1), false);
    if (level === 2) return pack(makeWhole(3, 1), false);
    if (level === 3) return pack(makeWhole(4, 1), false);
    if (level === 4) return pack(makeWhole(2, 2), false);
    if (level === 5) return pack(makeWhole(3, 2), false);
    if (level === 6) {
      const spec = makeDecWhole();
      spec.b = spec.bInt;
      spec.a = spec.aInt / Math.pow(10, spec.dpA);
      return pack(spec, false);
    }
    const spec = makeDecDec(Math.random() < 0.45);
    spec.a = spec.aInt / 10;
    spec.b = spec.bInt / 10;
    return pack(spec, false);
  }

  function trickyQ(level) {
    if (level >= 6) return normal(level);
    if (level <= 3) {
      const q = normal(level);
      return q;
    }
    return normal(level);
  }

  function fits(level, q) {
    const aLen = String(q.aInt).length;
    const bLen = String(q.bInt).length;
    if (q.aInt < 2 || q.bInt < 2) return false;
    if (level === 1) return q.dpTotal === 0 && aLen === 2 && bLen === 1;
    if (level === 2) return q.dpTotal === 0 && aLen === 3 && bLen === 1;
    if (level === 3) return q.dpTotal === 0 && aLen === 4 && bLen === 1;
    if (level === 4) return q.dpTotal === 0 && aLen === 2 && bLen === 2;
    if (level === 5) return q.dpTotal === 0 && aLen === 3 && bLen === 2;
    if (level === 6) return q.dpA > 0 && q.dpB === 0 && bLen === 1 && (q.dpA === 1 || q.dpA === 2);
    if (level === 7) return q.dpA > 0 && q.dpB > 0;
    return false;
  }

  function fresh(len) {
    const row = [];
    for (let i = 0; i < len; i++) row.push(null);
    return row;
  }

  function clone(state) {
    return {
      phase: state.phase,
      p1: state.p1.slice(),
      p2: state.p2.slice(),
      total: state.total.slice(),
      carries: state.carries.slice(),
      used: state.used.slice(),
      p1Carries: state.p1Carries.slice(),
      p1Used: state.p1Used.slice(),
      addCarries: state.addCarries.slice(),
      addUsed: state.addUsed.slice(),
      showP2: state.showP2,
      showTotal: state.showTotal,
      showDecimal: state.showDecimal,
      phOnes: state.phOnes,
      phCount: state.phCount,
      p1Struck: state.p1Struck,
      row2Carries: state.row2Carries.slice()
    };
  }

  function pushCalc(steps, state, text, col, chip, tags) {
    const algo = clone(state);
    algo.col = col;
    steps.push({ text: text, chip: chip, tags: tags || [], algo: algo, hiCols: [col] });
  }

  function cleanNum(n) {
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    return String(Math.round(n * 1000) / 1000);
  }

  function nonZeroPlaces(n) {
    const out = [];
    digitsOf(n).forEach(function (digit, shift) {
      if (digit) out.push({ digit: digit, shift: shift });
    });
    return out;
  }

  function orderFactors(q) {
    if (String(q.aInt).length >= String(q.bInt).length) return;
    const top = q.aInt;
    q.aInt = q.bInt;
    q.bInt = top;
    const dp = q.dpA;
    q.dpA = q.dpB;
    q.dpB = dp;
  }

  function decimalBits(q) {
    const bits = [];
    if (q.dpA > 0 && q.textA) bits.push({ text: q.textA, dp: q.dpA });
    if (q.dpB > 0 && q.textB) bits.push({ text: q.textB, dp: q.dpB });
    if (!bits.length) {
      if (q.dpA > 0) bits.push({ text: fmtDp(q.a, q.dpA), dp: q.dpA });
      if (q.dpB > 0) bits.push({ text: fmtDp(q.b, q.dpB), dp: q.dpB });
    }
    return bits;
  }

  function decimalSentence(bits, dpTotal, intProduct, answerShown) {
    function place(n) { return n === 1 ? '1 decimal place' : n + ' decimal places'; }
    const who = bits.map(function (bit) { return bit.text + ' has ' + place(bit.dp); }).join(' and ');
    return who + ', so the answer has ' + place(dpTotal) + ': ' + intProduct + ' \u2192 ' + answerShown;
  }

  function roundPlace(n) {
    const sign = n < 0 ? -1 : 1;
    const abs = Math.abs(n);
    let unit = 1;
    if (abs >= 1000) unit = 1000;
    else if (abs >= 100) unit = 100;
    else if (abs >= 10) unit = 10;
    else if (abs >= 1) unit = 1;
    else unit = 0.1;
    return sign * Math.round(abs / unit) * unit;
  }

  function easyChoices(n) {
    const sign = n < 0 ? -1 : 1;
    const abs = Math.abs(n);
    const bag = {};
    function add(v) {
      const r = Math.round(Math.abs(v) * 1000) / 1000;
      if (r) bag[sign * r] = true;
    }
    add(n);
    add(roundPlace(n));
    if (abs >= 1000) {
      add(Math.round(abs / 100) * 100);
      add(Math.round(abs / 1000) * 1000);
    } else if (abs >= 100) {
      add(Math.round(abs / 10) * 10);
      add(Math.round(abs / 50) * 50);
      add(Math.round(abs / 100) * 100);
    } else if (abs >= 10) {
      add(Math.round(abs / 5) * 5);
      add(Math.round(abs / 10) * 10);
    } else if (abs >= 1) {
      add(Math.round(abs));
      add(Math.round(abs * 2) / 2);
    } else {
      add(Math.round(abs * 10) / 10);
      add(0.5);
      add(1);
    }
    return Object.keys(bag).map(Number);
  }

    function easyPair(a, b) {
    function round10(n) {
      const v = Math.abs(n);
      return v < 10 || (v >= 10 && v % 10 === 0);
    }
    function small(n) { return Math.abs(n) < 100; }
    if (round10(a) && round10(b)) return true;
    if (round10(a) && small(b)) return true;
    if (round10(b) && small(a)) return true;
    return false;
  }

  function roundness(n) {
    const v = Math.abs(n);
    if (v >= 10 && v % 10 === 0) return 0;
    if (v < 10) return 0;
    return 0.05;
  }

  function closerEstimate(a, b) {
    const exact = a * b;
    const stdA = roundPlace(a);
    const stdB = roundPlace(b);
    const std = stdA * stdB;
    if (Math.abs(std - exact) <= Math.abs(exact) * 0.2 + 1e-6) {
      return { left: cleanNum(stdA), right: cleanNum(stdB), product: Math.round(std * 1000) / 1000 };
    }
    let best = null;
    easyChoices(a).forEach(function (x) {
      easyChoices(b).forEach(function (y) {
        if (!easyPair(x, y)) return;
        if (Math.abs(x - a) < 1e-9 && Math.abs(y - b) < 1e-9) return;
        const prod = x * y;
        const score = Math.abs(prod - exact) / Math.max(1, Math.abs(exact)) + roundness(x) + roundness(y);
        if (!best || score < best.score) best = { x: x, y: y, prod: prod, score: score };
      });
    });
    if (!best) return { left: cleanNum(stdA), right: cleanNum(stdB), product: Math.round(std * 1000) / 1000 };
    return { left: cleanNum(best.x), right: cleanNum(best.y), product: Math.round(best.prod * 1000) / 1000 };
  }

  function rowHeading(which, digit, shift) {
    const place = colName(shift);
    return 'Row ' + which + ' \u00b7 times by the ' + digit + ' ' + singular(place, digit);
  }

  function crossSentence(carries) {
    const vals = [];
    (carries || []).forEach(function (c) { if (c) vals.push(c); });
    if (!vals.length) return '';
    if (vals.length > 1) return ' Cross out the old regrouped digits.';
    return ' Cross out the old ' + vals[0] + '.';
  }

  function addSentence(p1, p2) {
    const d1 = digitsOf(p1);
    const d2 = digitsOf(p2);
    const L = Math.max(String(p1).length, String(p2).length);
    const parts = [];
    let carry = 0;
    for (let i = 0; i < L; i++) {
      const present = [];
      if (d1.length > i) present.push(d1[i]);
      if (d2.length > i) present.push(d2[i]);
      if (carry) present.push(carry);
      const sum = (d1[i] || 0) + (d2[i] || 0) + carry;
      const write = sum % 10;
      const nc = Math.floor(sum / 10);
      const place = titleCase(colName(i));
      const lively = present.filter(function (n) { return n; }).length;
      let bit;
      if (nc > 0) {
        bit = place + ': ' + present.join(' + ') + ' = ' + sum + ', write ' + write + ', regroup ' +
          nc + ' ' + singular(colName(i + 1), nc);
      } else if (lively <= 1) {
        bit = place + ': ' + sum;
      } else {
        bit = place + ': ' + present.join(' + ') + ' = ' + sum;
      }
      parts.push(bit);
      carry = nc;
    }
    if (carry) parts.push(titleCase(colName(L)) + ': ' + carry);
    return p1 + ' + ' + p2 + '. ' + parts.join('. ') + '. Answer ' + (p1 + p2);
  }

  function blankState(width) {
    return {
      phase: 1,
      p1: fresh(width),
      p2: fresh(width),
      total: fresh(width),
      carries: fresh(width),
      used: fresh(width),
      p1Carries: fresh(width),
      p1Used: fresh(width),
      addCarries: fresh(width),
      addUsed: fresh(width),
      showP2: false,
      showTotal: false,
      showDecimal: false,
      phOnes: false,
      phCount: 0,
      p1Struck: false,
      row2Carries: fresh(width),
      col: -1
    };
  }

  function buildSteps(q) {
    const saved = decimalBits(q);
    orderFactors(q);
    const places = nonZeroPlaces(q.bInt);
    q.long = places.length > 1;
    const headings = !(places.length === 1 && places[0].shift === 0);
    const width = String(q.aInt * q.bInt).length + 2;
    const state = blankState(width);
    const steps = [];
    const topDigs = digitsOf(q.aInt);
    let sawRow1 = false;
    let sawRow2 = false;
    let sawAdd = false;

    function snapStep(group, text, tags, shadeA, shadeB, fresh, freshRow) {
      steps.push({
        kind: 'digit',
        group: group,
        label: text,
        title: text,
        text: text,
        stepTag: tags[0] || null,
        tags: tags,
        algo: clone(state),
        shadeA: shadeA,
        shadeB: shadeB,
        fresh: fresh || [],
        freshRow: freshRow || ''
      });
    }

    if (q.dpTotal > 0) {
      steps.push({
        label: 'Whole numbers',
        title: 'Whole numbers',
        text: 'Ignore the decimal points for now. Work out ' + q.aInt + ' \u00d7 ' + q.bInt,
        stepTag: null,
        kind: 'lineup',
        columns: [],
        algo: clone(state),
        hiCols: []
      });
    }

    function multiplyRow(part, which) {
      const row = which === 1 ? state.p1 : state.p2;
      const group = headings ? rowHeading(which, part.digit, part.shift) : null;
      let toldCross = false;
      if (part.shift > 0) {
        for (let z = 0; z < part.shift; z++) row[z] = 0;
        state.phOnes = true;
        state.phCount = part.shift;
        if (which === 2) state.p1Struck = true;
        snapStep(group, 'Write the placeholder 0 in the ' + colName(0) + '.', ['Placeholder zero'], -1, -1, [0], which === 1 ? 'p1' : 'p2');
      }
      let carry = 0;
      topDigs.forEach(function (dig, i) {
        const place = colName(i);
        const prodPlace = colName(i + part.shift);
        const prod = dig * part.digit;
        const incoming = carry;
        const sum = prod + incoming;
        const write = sum % 10;
        const nc = Math.floor(sum / 10);
        const at = i + part.shift;
        const last = i === topDigs.length - 1;
        const botBit = part.shift ? part.digit + ' ' + singular(colName(part.shift), part.digit) : String(part.digit);
        let text = dig + ' ' + singular(place, dig) + ' \u00d7 ' + botBit + ' = ' + prod + ' ' + singular(prodPlace, prod);
        if (incoming) text += ', + ' + incoming + ' = ' + sum + ' ' + singular(prodPlace, sum);
        const fresh = [];
        row[at] = write;
        fresh.push(at);
        const tags = ['Times fact'];
        let cross = '';
        if (which === 2 && !toldCross) {
          cross = crossSentence(state.p1Carries);
          toldCross = true;
        }
        if (last && sum >= 10) {
          row[at + 1] = nc;
          fresh.push(at + 1);
          text += '. Write ' + sum + '.';
          if (cross) text += cross;
          carry = 0;
        } else {
          text += '. Write ' + write + '.';
          if (cross) text += cross;
          if (nc > 0) {
            const next = colName(at + 1);
            text += ' Regroup ' + nc + ' ' + singular(next, nc) + '.';
            tags.push('Regrouping');
            if (which === 1) {
              state.carries[i + 1] = nc;
              sawRow1 = true;
            } else {
              state.row2Carries[i + 1] = nc;
              sawRow2 = true;
            }
            carry = nc;
          } else {
            carry = 0;
          }
        }
        if (cross && tags.indexOf('Regrouping') < 0) tags.push('Regrouping');
        snapStep(group, text, tags, i, part.shift, fresh, which === 1 ? 'p1' : 'p2');
      });
    }

    multiplyRow(places[0], 1);
    if (places.length > 1) {
      state.p1Carries = state.carries.slice();
      state.p1Used = state.carries.map(function (c) { return c ? true : null; });
      state.phase = 2;
      state.showP2 = true;
      state.carries = fresh(width);
      state.used = fresh(width);
      state.row2Carries = fresh(width);
      multiplyRow(places[1], 2);
      const p1 = q.aInt * places[0].digit * Math.pow(10, places[0].shift);
      const p2 = q.aInt * places[1].digit * Math.pow(10, places[1].shift);
      state.p2Carries = state.row2Carries.slice();
      state.phase = 3;
      state.showTotal = true;
      const d1 = digitsOf(p1);
      const d2 = digitsOf(p2);
      const L = Math.max(String(p1).length, String(p2).length);
      let carry = 0;
      const freshTotal = [];
      for (let i = 0; i < L; i++) {
        const sum = (d1[i] || 0) + (d2[i] || 0) + carry;
        const write = sum % 10;
        const nc = Math.floor(sum / 10);
        state.total[i] = write;
        freshTotal.push(i);
        if (nc > 0 && i < L - 1) {
          state.addCarries[i + 1] = nc;
          sawAdd = true;
        } else if (nc > 0) {
          state.total[i + 1] = nc;
          freshTotal.push(i + 1);
        }
        carry = i < L - 1 ? nc : 0;
      }
      if (carry) {
        state.total[L] = carry;
        freshTotal.push(L);
      }
      snapStep('Add the rows', addSentence(p1, p2), ['Adding the rows'], -1, -1, freshTotal, 'total');
    }

    q.key = { row1: sawRow1, row2: sawRow2, add: sawAdd, long: q.long };
    const intProduct = q.aInt * q.bInt;
    if (q.dpTotal > 0) {
      state.showDecimal = true;
      const answerShown = (intProduct / Math.pow(10, q.dpTotal)).toFixed(q.dpTotal);
      q.decimalLine = decimalSentence(saved, q.dpTotal, intProduct, answerShown);
      steps.push({
        label: 'Decimal point',
        title: 'Decimal point',
        text: q.decimalLine,
        stepTag: 'Decimal point',
        tags: ['Decimal point'],
        kind: 'calc',
        columns: [],
        algo: clone(state)
      });
      const est = closerEstimate(q.a, q.b);
      steps.push({
        label: 'Check',
        title: 'Check',
        text: 'Check: ' + q.textA + ' \u00d7 ' + q.textB + ' is about ' + est.left + ' \u00d7 ' + est.right + ' = ' + cleanNum(est.product) + ', and ' + cleanNum(q.a * q.b) + ' is close to that, so it makes sense.',
        stepTag: 'Decimal point',
        kind: 'calc',
        columns: [],
        algo: clone(state)
      });
    }

    q.answer = intProduct / Math.pow(10, q.dpTotal || 0);
    q.finalAlgo = clone(state);
    return steps;
  }

  function rowHtml(label, cols, draw) {
    let html = '<div class="algo-row"><div class="dc ' + (label ? 'op' : 'spacer') + '">' + (label || '') + '</div>';
    for (let ci = 0; ci < cols; ci++) html += draw(cols - 1 - ci, ci);
    html += '</div>';
    return html;
  }

  function renderAlgo(q, step) {
    const snap = step && step.algo ? step.algo : (step && step.phase ? step : null);
    const aDigs = digitsOf(q.aInt);
    const bDigs = digitsOf(q.bInt);
    const productLen = String(q.aInt * q.bInt).length;
    const showDp = !!(snap && snap.showDecimal && q.dpTotal > 0);
    const cols = Math.max(aDigs.length, bDigs.length, productLen, showDp ? q.dpTotal + 1 : 0);
    const fresh = {};
    ((step && step.fresh) || []).forEach(function (c) { fresh[c] = true; });

    function digitCell(fromRight, value, cls, answerRow, shaded) {
      const counted = answerRow && showDp && value !== '' && value != null && fromRight < q.dpTotal ? ' counted' : '';
      const shade = shaded ? ' shade' : '';
      if (answerRow && showDp && fromRight === q.dpTotal && (value === '' || value == null)) {
        return '<div class="dc dot dp-arrow">.</div>';
      }
      return '<div class="dc' + counted + shade + '"><span class="d' + (cls || '') + '">' + (value === '' || value == null ? '' : value) + '</span></div>';
    }

    function topCarryRow() {
      if (!snap) return '';
      let any = false;
      let html = '<div class="algo-row carry-row"><div class="dc spacer"></div>';
      for (let ci = 0; ci < cols; ci++) {
        const fromRight = cols - 1 - ci;
        let inner = '';
        if (snap.phase === 1) {
          const c = snap.carries && snap.carries[fromRight];
          if (c) inner += '<span class="carry">' + c + '</span>';
        } else {
          const oldC = snap.p1Carries && snap.p1Carries[fromRight];
          const neu = snap.row2Carries && snap.row2Carries[fromRight];
          if (oldC) inner += '<span class="carry' + (snap.p1Struck ? ' struck' : '') + '">' + oldC + '</span>';
          if (neu) inner += '<span class="carry">' + neu + '</span>';
        }
        if (inner) any = true;
        html += '<div class="dc">' + inner + '</div>';
      }
      html += '</div>';
      return any ? html : '';
    }

    function addCarryRow() {
      if (!snap || !snap.showTotal || !snap.addCarries) return '';
      if (!snap.addCarries.some(function (c) { return c; })) return '';
      let html = '<div class="algo-row carry-row add-carry"><div class="dc spacer"></div>';
      for (let ci = 0; ci < cols; ci++) {
        const fromRight = cols - 1 - ci;
        const c = snap.addCarries[fromRight];
        html += '<div class="dc">' + (c ? '<span class="carry quiet">' + c + '</span>' : '') + '</div>';
      }
      html += '</div>';
      return html;
    }

    function answerDigits(arr, placeholder, rowName) {
      return rowHtml('', cols, function (fromRight) {
        const rv = arr ? arr[fromRight] : null;
        const shown = rv !== null && rv !== undefined;
        let extra = '';
        if (showDp && fromRight === q.dpTotal && shown) extra = '<div class="dc dot dp-arrow">.</div>';
        const phN = placeholder && snap && snap.phOnes ? (snap.phCount || 1) : 0;
        const ph = phN && fromRight < phN && shown && rv === 0;
        const just = answerRowFresh(rowName, fromRight);
        return digitCell(fromRight, shown ? rv : '', (ph ? ' ph' : (shown ? ' res' : '')) + (just ? ' fresh' : ''), true) + extra;
      });
    }
    function answerRowFresh(rowName, fromRight) {
      return !!(step && step.freshRow === rowName && fresh[fromRight]);
    }

    let html = '<div class="algo-grid-wrap mul-grid' + (showDp ? ' has-dp' : '') + '">';
    html += topCarryRow();
    html += rowHtml('', cols, function (fromRight) {
      const shaded = step && step.shadeA === fromRight;
      return digitCell(fromRight, fromRight < aDigs.length ? aDigs[fromRight] : '', '', false, shaded);
    });
    html += rowHtml('×', cols, function (fromRight) {
      const shaded = step && step.shadeB === fromRight;
      return digitCell(fromRight, fromRight < bDigs.length ? bDigs[fromRight] : '', '', false, shaded);
    });
    html += '<div class="algo-row sep-row"><div class="dc spacer"></div>';
    for (let ci = 0; ci < cols; ci++) html += '<div class="dc"></div>';
    html += '</div>';

    if (!q.long) {
      html += answerDigits(snap && snap.p1, true, 'p1');
    } else if (snap) {
      html += answerDigits(snap.p1, false, 'p1');
      if (snap.showP2) html += answerDigits(snap.p2, true, 'p2');
      if (snap.showTotal) {
        html += addCarryRow();
        html += '<div class="algo-row sep-row"><div class="dc spacer"></div>';
        for (let ci = 0; ci < cols; ci++) html += '<div class="dc"></div>';
        html += '</div>';
        html += answerDigits(snap.total, false, 'total');
      }
    }
    html += '</div>';
    if (q.key && (q.key.row1 || q.key.row2 || q.key.add)) {
      html += '<ul class="mul-key">';
      if (q.key.long && q.key.row1) html += '<li><span class="k struck"></span> regrouped in row 1, crossed out when row 2 starts</li>';
      if (q.key.long && q.key.row2) html += '<li><span class="k"></span> regrouped in row 2</li>';
      if (q.key.long && q.key.add) html += '<li><span class="k quiet"></span> regrouped when adding the rows</li>';
      if (!q.key.long && q.key.row1) html += '<li><span class="k"></span> regrouped into the next column</li>';
      html += '</ul>';
    }
    if (showDp && q.decimalLine) html += '<p class="algo-dp-note">' + q.decimalLine + '</p>';
    return html;
  }

  function estimate(q) {
    const est = closerEstimate(q.a, q.b);
    return { prompt: est.left + ' × ' + est.right, answer: est.product };
  }

  function zerosOf(n) {
    let v = Math.abs(Math.round(n));
    let z = 0;
    if (!v) return { core: 0, zeros: 0 };
    while (v % 10 === 0) {
      v = v / 10;
      z++;
    }
    return { core: v, zeros: z };
  }

  /* A product is easy when it is a times table, a double, a friendly chunk
     (25, 50, 75), or a small digit times a 2-digit number. */
  function isEasy(a, b) {
    const A = zerosOf(a);
    const B = zerosOf(b);
    const x = A.core;
    const y = B.core;
    if (x < 10 && y < 10) return true;
    let digit = 0;
    let other = 0;
    if (x < 10) { digit = x; other = y; }
    else if (y < 10) { digit = y; other = x; }
    else return false;
    if (digit === 1 || digit === 2) return other < 10000;
    if (other === 25 || other === 50 || other === 75) return true;
    if (other <= 20) return true;
    if (other < 100 && digit <= 5) return true;
    return false;
  }

  function placeParts(n) {
    const s = String(Math.abs(Math.round(n)));
    const parts = [];
    for (let i = 0; i < s.length; i++) {
      const d = Number(s[i]);
      if (!d) continue;
      parts.push(d * Math.pow(10, s.length - 1 - i));
    }
    return parts;
  }

  function mergeEasy(parts, by, original) {
    const list = parts.slice();
    let changed = true;
    while (changed && list.length > 1) {
      changed = false;
      for (let i = list.length - 2; i >= 0; i--) {
        const merged = list[i] + list[i + 1];
        if (original && merged === original) continue;
        if (isEasy(merged, by)) {
          list.splice(i, 2, merged);
          changed = true;
          break;
        }
      }
    }
    return list;
  }

  function canScale(a, b) {
    const A = zerosOf(a);
    const B = zerosOf(b);
    if (!A.zeros && !B.zeros) return false;
    return isEasy(A.core, B.core);
  }

  function soText(a, b) {
    const A = zerosOf(a);
    const B = zerosOf(b);
    return cleanNum(A.core) + ' \u00d7 ' + cleanNum(B.core) + ' = ' + cleanNum(A.core * B.core) +
      ', so ' + cleanNum(a) + ' \u00d7 ' + cleanNum(b) + ' = ' + cleanNum(a * b);
  }

  function productLine(x, y) {
    const A = zerosOf(x);
    const B = zerosOf(y);
    const zeros = A.zeros + B.zeros;
    const multi = A.core >= 10 || B.core >= 10;
    const tiny =
      (A.zeros && !B.zeros && A.core <= 2 && B.core >= 10) ||
      (B.zeros && !A.zeros && B.core <= 2 && A.core >= 10);
    if (zeros && multi && !tiny) return soText(x, y);
    return cleanNum(x) + ' \u00d7 ' + cleanNum(y) + ' = ' + cleanNum(x * y);
  }

  function splitSide(keep, split, onRight) {
    if (placeParts(split).length < 2) return null;
    const parts = mergeEasy(placeParts(split), keep, split);
    if (parts.length < 2) return null;
    if (!parts.every(function (p) { return isEasy(p, keep); })) return null;
    const pairs = parts.map(function (p) { return onRight ? [keep, p] : [p, keep]; });
    return pairs;
  }

  function deepPieces(a, b) {
    if (isEasy(a, b)) return [[a, b]];
    const pa = placeParts(a);
    const pb = placeParts(b);
    if (pa.length > 1 && (pa.length >= pb.length || pb.length < 2)) {
      let out = [];
      pa.forEach(function (p) { out = out.concat(deepPieces(p, b)); });
      return out;
    }
    if (pb.length > 1) {
      let out = [];
      pb.forEach(function (p) { out = out.concat(deepPieces(a, p)); });
      return out;
    }
    return [[a, b]];
  }

  function mentalPairs(a, b) {
    const left = splitSide(b, a, false);
    const right = splitSide(a, b, true);
    if (left && right) return left.length <= right.length ? left : right;
    if (left || right) return left || right;
    return deepPieces(a, b);
  }

  function intFromText(text) {
    const dp = (String(text).split('.')[1] || '').length;
    return Math.round(Number(text) * Math.pow(10, dp));
  }

  function mentalHtml(a, b) {
    if (canScale(a, b)) {
      const A = zerosOf(a);
      const B = zerosOf(b);
      return '<strong>Use place value.</strong> ' +
        cleanNum(A.core) + ' \u00d7 ' + cleanNum(B.core) + ' = ' + cleanNum(A.core * B.core) +
        ', so ' + cleanNum(a) + ' \u00d7 ' + cleanNum(b) + ' = <strong>' + cleanNum(a * b) + '</strong>';
    }
    const pairs = mentalPairs(a, b);
    if (pairs.length < 2) {
      return '<strong>Use place value.</strong> ' + productLine(a, b).replace(
        /= (\d+)$/,
        '= <strong>$1</strong>'
      );
    }
    const lines = pairs.map(function (p) { return productLine(p[0], p[1]); });
    const total = pairs.reduce(function (n, p) { return n + p[0] * p[1]; }, 0);
    return '<strong>Split by place value.</strong><br>' + lines.join('<br>') +
      '<br>Add: <strong>' + cleanNum(total) + '</strong>';
  }

  function strategy(q) {
    const a = intFromText(q.textA);
    const b = intFromText(q.textB);
    if (q.dpTotal > 0) {
      const places = q.dpTotal === 1 ? '1 decimal place' : q.dpTotal + ' decimal places';
      return '<strong>Ignore the decimal points.</strong><br>' + mentalHtml(a, b) +
        '<br>Then count ' + places + ': <strong>' + fmtDp(q.answer, q.dpTotal) + '</strong>';
    }
    return mentalHtml(a, b);
  }

  function extBank(level) {
    const q = normal(level);
    const af = q.textA;
    const bf = q.textB;
    const rf = q.dpTotal ? ((q.aInt * q.bInt) / Math.pow(10, q.dpTotal)).toFixed(q.dpTotal) : String(q.aInt * q.bInt);
    return [
      { type: 'Word problem', kind: 'number', expect: rf, hint: 'Multiply the number in each group by the number of groups.', p: 'There are ' + bf + ' boxes with ' + af + ' pencils in each. How many pencils?', a: af + ' × ' + bf + ' = <strong>' + rf + '</strong>' },
      { type: 'Word problem', kind: 'number', expect: rf, hint: 'Multiply the rows by the number in each row.', p: 'A garden has ' + bf + ' rows with ' + af + ' plants in each row. How many plants?', a: bf + ' × ' + af + ' = <strong>' + rf + ' plants</strong>' },
      { type: 'Missing number', kind: 'number', expect: bf, hint: 'The missing number is the one you multiply by.', p: 'Find the missing number:<br><strong>' + af + ' × ___ = ' + rf + '</strong>', a: 'Missing number = <strong>' + bf + '</strong>' },
      { type: 'Missing number', kind: 'number', expect: af, hint: 'The missing number is the one you start with.', p: 'Find the missing number:<br><strong>___ × ' + bf + ' = ' + rf + '</strong>', a: 'Missing number = <strong>' + af + '</strong>' },
      { type: 'True or False', kind: 'tf', expect: 'true', hint: 'Swap the two numbers and multiply again.', p: 'True or False?<br><strong>' + af + ' × ' + bf + ' = ' + bf + ' × ' + af + '</strong>', a: '<strong>True</strong> — the order of the factors does not change the product.' },
      { type: 'True or False', kind: 'tf', expect: 'true', hint: 'Multiply first, then divide by the same number.', p: 'True or False?<br><strong>(' + af + ' × ' + bf + ') ÷ ' + bf + ' = ' + af + '</strong>', a: af + ' × ' + bf + ' = ' + rf + '. Dividing by ' + bf + ' gets back to ' + af + '. <strong>True</strong>' },
      { type: 'Multi-step', kind: 'number', expect: String(Number(rf) * 2), hint: 'Double one factor. The product doubles too.', p: 'If ' + af + ' × ' + bf + ' = ' + rf + ', what is ' + fmtDp(q.a * 2, q.dpA) + ' × ' + bf + '?', a: 'Double the product: <strong>' + fmtDp(q.a * 2 * q.b, q.dpTotal) + '</strong>' },
      { type: 'Estimation', kind: 'tf', expect: 'false', hint: 'Round, then multiply. Compare that with the claim.', p: 'A student says ' + af + ' × ' + bf + ' = ' + fmtDp(q.a * q.b * 1.5, q.dpTotal) + '. Is this reasonable?', a: 'The product is <strong>' + rf + '</strong>. That claim is too big.' }
    ];
  }

  const TIPS = {
    'Times fact': 'Multiply the digits in this column, then add anything regrouped.',
    'Regrouping': 'Write the ones digit of the product and regroup the rest into the next column.',
    'Placeholder zero': 'Multiplying by the tens digit shifts the row one place left, so the ones column is a 0.',
    'Adding the rows': 'Add the partial rows the same way as a column addition.',
    'Decimal point': 'Count the decimal places in both factors. The answer has that many decimal places.'
  };

  EM.registerTopic({
    id: 'mul',
    name: 'Multiplication',
    homeExample: 'e.g. 347 \u00d7 26',
    section: 'written',
    levels: [
      { id: 1, name: '2-digit × 1-digit', example: '34 × 6' },
      { id: 2, name: '3-digit × 1-digit', example: '248 × 7' },
      { id: 3, name: '4-digit × 1-digit', example: '1426 × 5' },
      { id: 4, name: '2-digit × 2-digit', example: '46 × 23' },
      { id: 5, name: '3-digit × 2-digit', example: '388 × 79' },
      { id: 6, name: 'Decimal × whole', example: '3.4 × 6' },
      { id: 7, name: 'Decimal × decimal', example: '3.4 × 0.6' }
    ],
    tricky: [
      { id: 'carry', tags: ['Regrouping', 'Times fact'], levels: [1, 2, 3, 6] },
      { id: 'long', tags: ['Placeholder zero', 'Adding the rows'], levels: [4, 5] },
      { id: 'decimal', tags: ['Decimal point'], levels: [7] }
    ],
    errorTags: ['Times fact', 'Regrouping', 'Placeholder zero', 'Adding the rows', 'Decimal point'],
    tips: TIPS,
    makeQuestion: function (level, opts) {
      opts = opts || {};
      for (let i = 0; i < 30; i++) {
        const q = (opts.tricky ? trickyQ(level) : normal(level));
        if (!fits(level, q)) continue;
        q.level = level;
        q.tricky = !!opts.tricky;
        q.steps = buildSteps(q);
        return q;
      }
      const q = normal(level);
      q.level = level;
      q.steps = buildSteps(q);
      return q;
    },
    estimate: estimate,
    buildSteps: function (q) { return q.steps || buildSteps(q); },
    render: function (q, stepIndex, el) {
      if (q.view && q.view.reveal && q.finalAlgo) {
        el.innerHTML = renderAlgo(q, { algo: q.finalAlgo });
        return;
      }
      const steps = q.steps || [];
      const row = stepIndex >= 0 ? steps[stepIndex] : null;
      const col = q.view ? q.view.col : -1;
      const shown = row && col >= 0 && row.columns && row.columns[col] ? row.columns[col] : row;
      el.innerHTML = renderAlgo(q, shown);
    },
    strategy: strategy,
    chipsFor: function (q) {
      const used = {};
      (q.steps || []).forEach(function (s) {
        if (s.stepTag) used[s.stepTag] = true;
        (s.tags || []).forEach(function (tag) { used[tag] = true; });
        (s.columns || []).forEach(function (c) {
          if (c.chip) used[c.chip] = true;
          (c.tags || []).forEach(function (tag) { used[tag] = true; });
        });
      });
      return this.errorTags.filter(function (tag) { return used[tag]; });
    },
    extensions: function (level) { return extBank(level); }
  });
})();
