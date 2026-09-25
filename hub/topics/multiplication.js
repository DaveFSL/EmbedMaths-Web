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
      phOnes: state.phOnes
    };
  }

  function pushCalc(steps, state, text, col, chip, tags) {
    const algo = clone(state);
    algo.col = col;
    steps.push({ text: text, chip: chip, tags: tags || [], algo: algo, hiCols: [col] });
  }

  function multiplyByDigit(steps, state, aInt, digit, shift, chip) {
    const digs = digitsOf(aInt);
    let carry = 0;
    for (let i = 0; i < digs.length; i++) {
      const prod = digs[i] * digit;
      const sum = prod + carry;
      const write = sum % 10;
      const nc = Math.floor(sum / 10);
      const place = colName(i + shift);
      const incoming = carry;
      let calc = titleCase(place) + ': ' + digs[i] + ' × ' + digit + ' = ' + prod;
      if (incoming > 0) calc += ', plus the ' + incoming + ' carried = ' + sum;
      calc += '.';
      const simple = incoming === 0 && nc === 0;
      if (simple) {
        if (state.phase === 1) state.p1[i] = write;
        else state.p2[i + shift] = write;
        pushCalc(steps, state, calc.slice(0, -1) + '. Write ' + write + '.', i + shift, chip, []);
        continue;
      }
      pushCalc(steps, state, calc, i + shift, chip, []);
      if (incoming > 0) state.used[i] = true;
      if (state.phase === 1) state.p1[i] = write;
      else state.p2[i + shift] = write;
      pushCalc(steps, state, 'Write ' + write + '.', i + shift, chip, []);
      carry = nc;
      if (nc > 0) {
        state.carries[i + 1] = nc;
        pushCalc(steps, state, 'Carry ' + nc + '.', i + shift, chip, ['Carrying']);
      }
    }
    if (carry > 0) {
      const at = digs.length + shift;
      if (state.phase === 1) state.p1[at] = carry;
      else state.p2[at] = carry;
      state.used[digs.length] = true;
      pushCalc(steps, state, 'Write ' + carry + '.', at, 'Carrying', ['Carrying']);
    }
  }

  function addRows(steps, state, p1, p2) {
    const L = Math.max(String(p1).length, String(p2).length);
    const d1 = digitsOf(p1);
    const d2 = digitsOf(p2);
    let carry = 0;
    state.phase = 3;
    state.showTotal = true;
    state.carries = state.carries.map(function (c) { return c; });
    for (let i = 0; i < state.used.length; i++) if (state.carries[i]) state.used[i] = true;
    for (let i = 0; i < L; i++) {
      const present = [];
      if (d1.length > i) present.push(d1[i]);
      if (d2.length > i) present.push(d2[i]);
      const incoming = carry;
      const sum = present.reduce(function (n, v) { return n + v; }, 0) + incoming;
      const write = sum % 10;
      const nc = Math.floor(sum / 10);
      const place = colName(i);
      const missing = d1.length <= i || d2.length <= i;
      if (present.length === 1 && incoming === 0 && nc === 0 && missing) {
        state.total[i] = write;
        pushCalc(steps, state, titleCase(place) + ': Nothing to add, so write ' + write + '.', i, 'Adding the rows', []);
        continue;
      }
      let calc = titleCase(place) + ': ' + present.join(' + ');
      if (incoming > 0) calc += ' + the ' + incoming + ' carried';
      calc += ' = ' + sum + '.';
      if (incoming === 0 && nc === 0) {
        state.total[i] = write;
        pushCalc(steps, state, calc.slice(0, -1) + '. Write ' + write + '.', i, 'Adding the rows', []);
        continue;
      }
      pushCalc(steps, state, calc, i, 'Adding the rows', []);
      if (incoming > 0) state.addUsed[i] = true;
      state.total[i] = write;
      pushCalc(steps, state, 'Write ' + write + '.', i, 'Adding the rows', []);
      carry = nc;
      if (nc > 0) {
        state.addCarries[i + 1] = nc;
        pushCalc(steps, state, 'Carry ' + nc + '.', i, 'Adding the rows', ['Carrying']);
      }
    }
    if (carry > 0) {
      state.total[L] = carry;
      state.addUsed[L] = true;
      pushCalc(steps, state, 'The ' + carry + ' carried makes a new ' + colName(L) + ' digit. Write ' + carry + '.', L, 'Adding the rows', ['Carrying']);
    }
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
      col: -1
    };
  }

  function buildSteps(q) {
    const width = String(q.aInt * q.bInt).length + 1;
    const state = blankState(width);
    const steps = [];
    const ones = q.bInt % 10;
    const tens = Math.floor(q.bInt / 10);

    if (!q.long) {
      multiplyByDigit(steps, state, q.aInt, q.bInt, 0, 'Times fact');
    } else {
      steps.push({
        title: 'Row 1',
        text: 'Multiply by the ones digit (' + ones + ').',
        stepTag: null,
        kind: 'lineup',
        algo: clone(state),
        hiCols: []
      });
      multiplyByDigit(steps, state, q.aInt, ones, 0, 'Times fact');
      state.p1Carries = state.carries.slice();
      state.p1Used = state.carries.map(function (c) { return c ? true : null; });
      state.phase = 2;
      state.showP2 = true;
      state.carries = fresh(width);
      state.used = fresh(width);
      steps.push({
        title: 'Row 2',
        text: 'Multiply by the tens digit (' + tens + ').',
        stepTag: null,
        kind: 'lineup',
        algo: clone(state),
        hiCols: []
      });
      state.p2[0] = 0;
      state.phOnes = true;
      pushCalc(steps, state, 'We are multiplying by the tens digit, so write a 0 in the ones column as a placeholder.', 0, 'Placeholder zero', ['Placeholder zero']);
      multiplyByDigit(steps, state, q.aInt, tens, 1, 'Times fact');
      const p1 = q.aInt * ones;
      const p2 = q.aInt * tens * 10;
      steps.push({
        title: 'Add the rows',
        text: 'Add the two rows, starting at the ones.',
        stepTag: 'Adding the rows',
        kind: 'lineup',
        algo: clone(state),
        hiCols: []
      });
      addRows(steps, state, p1, p2);
    }

    if (q.dpTotal > 0) {
      state.showDecimal = true;
      const places = q.dpA + ' + ' + q.dpB + ' = ' + q.dpTotal;
      pushCalc(steps, state, 'Count the decimal places: ' + places + '. Put the decimal point so the answer has ' + q.dpTotal + ' decimal place' + (q.dpTotal === 1 ? '' : 's') + '.', 0, 'Decimal point', ['Decimal point']);
      const ra = q.a >= 1 ? Math.round(q.a) : q.a;
      const rb = q.b < 1 ? q.b : Math.round(q.b);
      const right = q.b < 1 ? q.textB : String(rb);
      const left = String(ra);
      const product = Math.round(ra * rb * 1000) / 1000;
      pushCalc(steps, state, 'Check with an estimate: ' + q.textA + ' × ' + q.textB + ' ≈ ' + left + ' × ' + right + ' = ' + product + '.', 0, 'Decimal point', []);
    }

    const answer = (q.aInt * q.bInt) / Math.pow(10, q.dpTotal);
    const answerText = q.dpTotal ? answer.toFixed(q.dpTotal) : String(answer);
    const ui = steps.map(function (s, idx) {
      if (s.kind === 'lineup') return s;
      let text = s.text;
      if (idx === steps.length - 1) text += ' Answer ' + answerText + '.';
      return {
        title: s.chip || '',
        text: text,
        stepTag: s.chip,
        tags: s.tags,
        kind: 'calc',
        algo: s.algo,
        hiCols: s.hiCols
      };
    });
    q.answer = answer;
    return ui;
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
    const cols = Math.max(aDigs.length, bDigs.length, productLen);
    const hi = {};
    ((step && step.hiCols) || []).forEach(function (c) { hi[c] = true; });

    function digitCell(fromRight, value, cls) {
      const active = hi[fromRight] ? ' on' : '';
      return '<div class="dc' + active + '"><span class="d' + (cls || '') + '">' + (value === '' || value == null ? '' : value) + '</span></div>';
    }

    function carryRow(arr, used, active) {
      if (!arr) return '';
      return rowHtml('', cols, function (fromRight) {
        const c = arr[fromRight];
        const on = active && c ? '<span class="carry' + (used && used[fromRight] ? ' used' : '') + '">' + c + '</span>' : '';
        return '<div class="dc">' + on + '</div>';
      });
    }

    let html = '<div class="algo-grid-wrap">';
    if (snap && snap.phase === 1) html += carryRow(snap.carries, snap.used, true);
    else if (snap && snap.p1Carries) html += carryRow(snap.p1Carries, snap.p1Used, true);
    html += rowHtml('', cols, function (fromRight) {
      return digitCell(fromRight, fromRight < aDigs.length ? aDigs[fromRight] : '');
    });
    html += rowHtml('×', cols, function (fromRight) {
      return digitCell(fromRight, fromRight < bDigs.length ? bDigs[fromRight] : '');
    });
    html += '<div class="algo-row sep-row"><div class="dc spacer"></div>';
    for (let ci = 0; ci < cols; ci++) html += '<div class="dc"></div>';
    html += '</div>';

    if (!q.long) {
      html += rowHtml('', cols, function (fromRight) {
        const rv = snap && snap.p1 ? snap.p1[fromRight] : null;
        const shown = rv !== null && rv !== undefined;
        let extra = '';
        if (snap && snap.showDecimal && q.dpTotal > 0 && fromRight === q.dpTotal) extra = '<div class="dc dot">.</div>';
        return digitCell(fromRight, shown ? rv : '', shown ? ' res' : '') + extra;
      });
    } else if (snap) {
      html += rowHtml('', cols, function (fromRight) {
        const rv = snap.p1[fromRight];
        const shown = rv !== null && rv !== undefined;
        return digitCell(fromRight, shown ? rv : '', shown ? ' res' : '');
      });
      if (snap.showP2) {
        html += carryRow(snap.phase === 2 ? snap.carries : null, snap.used, snap.phase === 2);
        html += rowHtml('', cols, function (fromRight) {
          const rv = snap.p2[fromRight];
          const shown = rv !== null && rv !== undefined;
          const ph = fromRight === 0 && snap.phOnes && shown;
          return digitCell(fromRight, shown ? rv : '', ph ? ' ph' : (shown ? ' res' : ''));
        });
      }
      if (snap.showTotal) {
        html += carryRow(snap.addCarries, snap.addUsed, true);
        html += '<div class="algo-row sep-row"><div class="dc spacer"></div>';
        for (let ci = 0; ci < cols; ci++) html += '<div class="dc"></div>';
        html += '</div>';
        html += rowHtml('', cols, function (fromRight) {
          const rv = snap.total[fromRight];
          const shown = rv !== null && rv !== undefined;
          let extra = '';
          if (snap.showDecimal && q.dpTotal > 0 && fromRight === q.dpTotal) extra = '<div class="dc dot">.</div>';
          return digitCell(fromRight, shown ? rv : '', shown ? ' res' : '') + extra;
        });
      }
    }
    html += '</div>';
    return html;
  }

  function estimate(q) {
    if (q.dpTotal > 0) {
      const ra = q.a >= 1 ? Math.round(q.a) : q.a;
      const rb = q.b < 1 ? q.b : Math.round(q.b);
      const left = fmtDp(ra, q.a >= 1 ? 0 : q.dpA);
      const right = q.b < 1 ? q.textB : fmtDp(rb, 0);
      return { prompt: left + ' × ' + right, answer: ra * rb };
    }
    const rb = Math.round(q.b / 10) * 10 || q.b;
    if (rb !== q.b) return { prompt: q.a + ' × ' + rb, answer: q.a * rb };
    return { prompt: (Math.round(q.a / 10) * 10) + ' × ' + q.b, answer: (Math.round(q.a / 10) * 10) * q.b };
  }

  function strategy(q) {
    if (q.dpTotal > 0) {
      return '<strong>Ignore the decimal points.</strong> ' + q.aInt + ' × ' + q.bInt + ' = ' + (q.aInt * q.bInt) +
        '.<br>Then count ' + q.dpTotal + ' decimal place' + (q.dpTotal === 1 ? '' : 's') + ': <strong>' + fmtDp(q.answer, q.dpTotal) + '</strong>';
    }
    const tens = Math.floor(q.a / 10) * 10;
    const ones = q.a - tens;
    if (!ones) return '<strong>Use place value.</strong> ' + q.equation + ' = <strong>' + (q.a * q.b) + '</strong>';
    return '<strong>Split the first number.</strong> ' + tens + ' × ' + q.b + ' = ' + (tens * q.b) +
      ', and ' + ones + ' × ' + q.b + ' = ' + (ones * q.b) +
      '.<br>Add: <strong>' + (q.a * q.b) + '</strong>';
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
    'Times fact': 'Multiply the digits in this column, then add any carry.',
    'Carrying': 'Write the ones digit of the product and carry the rest to the next column.',
    'Placeholder zero': 'Multiplying by the tens digit shifts the row one place left, so the ones column is a 0.',
    'Adding the rows': 'Add the partial rows the same way as a column addition.',
    'Decimal point': 'Count the decimal places in both factors. The answer has that many decimal places.'
  };

  EM.registerTopic({
    id: 'mul',
    name: 'Multiplication',
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
      { id: 'carry', tags: ['Carrying', 'Times fact'], levels: [1, 2, 3, 6] },
      { id: 'long', tags: ['Placeholder zero', 'Adding the rows'], levels: [4, 5] },
      { id: 'decimal', tags: ['Decimal point'], levels: [7] }
    ],
    errorTags: ['Times fact', 'Carrying', 'Placeholder zero', 'Adding the rows', 'Decimal point'],
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
      const steps = q.steps || [];
      el.innerHTML = renderAlgo(q, stepIndex >= 0 ? steps[stepIndex] : null);
    },
    strategy: strategy,
    chipsFor: function (q) {
      const used = {};
      (q.steps || []).forEach(function (s) {
        if (s.stepTag) used[s.stepTag] = true;
        (s.tags || []).forEach(function (tag) { used[tag] = true; });
      });
      return this.errorTags.filter(function (tag) { return used[tag]; });
    },
    extensions: function (level) { return extBank(level); }
  });
})();
