/* Short division (bus stop). Digits stay in their places. Remainders are regrouped. */
const Division = (function () {
  const DIGIT_DIVS = [2, 3, 4, 5, 6, 7, 8, 9];
  const TERM_DIVS = [2, 4, 5, 8];
  const WHOLE = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands'];
  const DECIMALS = ['tenths', 'hundredths', 'thousandths'];
  const WORD = {
    one: 'one', two: 'two', three: 'three', four: 'four', five: 'five',
    six: 'six', seven: 'seven', eight: 'eight', nine: 'nine', ten: 'ten'
  };
  const NUM_WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const DENOM = {
    2: 'half', 3: 'third', 4: 'quarter', 5: 'fifth', 6: 'sixth', 7: 'seventh',
    8: 'eighth', 9: 'ninth', 10: 'tenth', 11: 'eleventh', 12: 'twelfth',
    15: 'fifteenth', 20: 'twentieth', 25: 'twenty-fifth'
  };

  function irand(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }
  function pick(list) { return list[irand(0, list.length - 1)]; }
  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) {
      const t = x % y;
      x = y;
      y = t;
    }
    return x || 1;
  }
  function pluralDenom(d) {
    const name = DENOM[d] || (d + 'th');
    if (name === 'half') return 'halves';
    return name + 's';
  }
  function fractionWords(n, d) {
    const g = gcd(n, d);
    const nn = n / g;
    const dd = d / g;
    const num = NUM_WORD[nn] || String(nn);
    if (nn === 1) return num + ' ' + (DENOM[dd] || (dd + 'th'));
    return num + ' ' + pluralDenom(dd);
  }
  function phrase(n, place) {
    const pair = {
      ones: ['one', 'ones'],
      tens: ['ten', 'tens'],
      hundreds: ['hundred', 'hundreds'],
      thousands: ['thousand', 'thousands'],
      'ten-thousands': ['ten-thousand', 'ten-thousands'],
      tenths: ['tenth', 'tenths'],
      hundredths: ['hundredth', 'hundredths'],
      thousandths: ['thousandth', 'thousandths']
    }[place] || [place, place];
    return n + ' ' + (n === 1 ? pair[0] : pair[1]);
  }
  function cap(text) { return text.charAt(0).toUpperCase() + text.slice(1); }
  function placeAt(index, decimalAt) {
    if (index < decimalAt) return WHOLE[decimalAt - 1 - index] || 'places';
    return DECIMALS[index - decimalAt] || 'places';
  }
  function fracHtml(n, d) {
    return '<span class="frac"><span class="frac-n">' + n + '</span><span class="frac-d">' + d + '</span></span>';
  }
  function fmtUnits(units, places) {
    if (!places) return String(units);
    const sign = units < 0 ? '-' : '';
    const body = String(Math.abs(units)).padStart(places + 1, '0');
    const whole = body.slice(0, -places);
    const frac = body.slice(-places).replace(/0+$/, '');
    if (!frac) return sign + whole;
    return sign + whole + '.' + frac;
  }
  function roundSig(n) {
    if (n <= 0) return 0;
    const exp = Math.floor(Math.log10(n));
    const pow = Math.pow(10, exp);
    const rounded = Math.round(n / pow) * pow;
    const digits = Math.max(0, -exp);
    return Number(rounded.toFixed(digits + 8));
  }

  function run(digits, divisor, decimalAt, keepGoing) {
    const cols = [];
    let rem = 0;
    let started = false;
    function pushDigit(digit, index, added) {
      const value = rem * 10 + digit;
      const q = Math.floor(value / divisor);
      const r = value % divisor;
      const leading = q === 0 && !started;
      cols.push({
        digit: digit,
        place: placeAt(index, decimalAt),
        value: value,
        q: q,
        r: r,
        remIn: rem,
        placeholder: q === 0,
        inAnswer: !leading,
        added: !!added,
        pointBefore: index === decimalAt && decimalAt < (keepGoing ? 99 : digits.length + (keepGoing ? 3 : 0))
      });
      if (q !== 0) started = true;
      rem = r;
    }
    for (let i = 0; i < digits.length; i++) pushDigit(digits[i], i, false);
    const wholeRem = rem;
    let extra = 0;
    if (keepGoing) {
      while (rem > 0 && extra < 3) {
        pushDigit(0, digits.length + extra, true);
        extra += 1;
      }
    }
    cols.forEach(function (col, i) {
      col.pointBefore = col.added ? (i > 0 && !cols[i - 1].added && decimalAt === digits.length) || (decimalAt < digits.length && i === decimalAt) : i === decimalAt && decimalAt < digits.length;
    });
    if (decimalAt < digits.length) {
      cols.forEach(function (col, i) { col.pointBefore = i === decimalAt; });
    } else if (extra) {
      cols.forEach(function (col, i) { col.pointBefore = i === digits.length; });
    } else {
      cols.forEach(function (col) { col.pointBefore = false; });
    }
    return { cols: cols, rem: rem, extra: extra, wholeRem: wholeRem };
  }

  function shownAnswer(cols) {
    let text = '';
    let seen = false;
    cols.forEach(function (col) {
      if (col.pointBefore) {
        if (!seen) text += '0';
        text += '.';
        seen = true;
      }
      if (!col.inAnswer) return;
      text += String(col.q);
      seen = true;
    });
    return text || '0';
  }
  function wholePart(cols) {
    let n = 0;
    let seenPoint = false;
    cols.forEach(function (col) {
      if (col.pointBefore) seenPoint = true;
      if (seenPoint || !col.inAnswer) return;
      n = n * 10 + col.q;
    });
    return n;
  }
  function zeroInShown(cols) {
    let seen = false;
    let found = false;
    cols.forEach(function (col) {
      if (!col.inAnswer || col.pointBefore) return;
      if (seen && col.q === 0) found = true;
      if (col.q !== 0) seen = true;
      else if (seen) found = true;
    });
    return found;
  }
  function hasRegroup(cols) {
    return cols.some(function (col, i) { return col.r > 0 && i < cols.length - 1; }) ||
      cols.some(function (col) { return col.remIn > 0; });
  }
  function regroups(cols) {
    let n = 0;
    cols.forEach(function (col, i) {
      if (!col.added && col.r > 0 && i < cols.length - 1) n += 1;
    });
    return n;
  }

  function buildRecord(text, divisor, level, mode) {
    const bits = String(text).split('.');
    const whole = bits[0];
    const frac = bits[1] || '';
    const digits = (whole + frac).split('').map(Number);
    const decimalAt = whole.length;
    const keep = mode === 'decimal';
    const ran = run(digits, divisor, decimalAt, keep);
    const cols = ran.cols;
    const answerText = shownAnswer(cols);
    const wholeAns = wholePart(cols);
    const rem = mode === 'decimal' ? 0 : ran.rem;
    const g = gcd(rem, divisor);
    const record = {
      level: level,
      mode: mode,
      divisor: divisor,
      dividendText: String(text),
      digits: digits,
      decimalAt: decimalAt,
      cols: cols,
      rem: rem,
      exact: ran.rem === 0,
      wholeRem: ran.wholeRem,
      len: whole.length,
      dp: frac.length,
      extra: ran.extra,
      answerText: answerText,
      wholeAns: wholeAns,
      leadingPh: cols.length > 0 && !cols[0].inAnswer,
      zeroInNumber: digits.indexOf(0) >= 0,
      zeroInAnswer: zeroInShown(cols),
      hasRegroup: hasRegroup(cols),
      fracN: rem / g,
      fracD: rem ? divisor / g : 1,
      rawN: rem,
      rawD: divisor
    };
    record.decimalText = decimalString(record);
    record.equation = record.dividendText + ' \u00f7 ' + divisor + ' = ?';
    record.solvedEquation = record.dividendText + ' \u00f7 ' + divisor;
    record.answer = numericAnswer(record);
    record.dp = answerDp(record);
    record.steps = buildSteps(record);
    record.usedMultiples = usedFacts(cols);
    return record;
  }

  function numericAnswer(q) {
    if (q.mode === 'remainder' || q.mode === 'fraction') return q.wholeAns;
    const text = q.answerText;
    if (text.indexOf('.') < 0) return parseInt(text, 10);
    return Number(text);
  }
  function answerDp(q) {
    if (q.mode === 'remainder' || q.mode === 'fraction') return 0;
    const i = q.answerText.indexOf('.');
    return i < 0 ? 0 : q.answerText.length - i - 1;
  }
  function decimalString(q) {
    if (q.mode === 'decimal' || q.mode === 'exact') return q.answerText;
    const num = q.wholeAns * q.divisor + q.rem;
    const milli = num * 1000 / q.divisor;
    return fmtUnits(milli, 3);
  }

  function usedFacts(cols) {
    const used = {};
    cols.forEach(function (col) {
      if (col.inAnswer && col.q > 0) used[col.q] = true;
    });
    return used;
  }

  function nextCol(cols, i) {
    return i + 1 < cols.length ? cols[i + 1] : null;
  }
  function isDecimalCol(col, q) {
    return col.added || DECIMALS.indexOf(col.place) >= 0 && q.decimalAt < q.digits.length && col.pointBefore || col.added;
  }

  function regroupLine(col, next) {
    return ' Regroup the ' + phrase(col.r, col.place) + ': ' + phrase(next.value, next.place) + '.';
  }
  function remainderLine(q) {
    return ' Write the remainder beside the answer: ' + q.wholeAns + ' r' + q.rem + '.';
  }

  function columnText(col, q, i) {
    const d = q.divisor;
    const next = nextCol(q.cols, i);
    const two = d >= 10;
    const heading = phrase(col.value, col.place);
    if (col.q === 0) {
      let line = heading + ' \u00f7 ' + d + " won't go. Write a placeholder 0.";
      if (next) line += regroupLine(col, next);
      else if (q.mode === 'remainder' && col.r > 0) line += remainderLine(q);
      else if (col.r > 0) line += ' Remainder ' + col.r + '.';
      return line;
    }
    if (two) {
      const multiple = col.q * d;
      let line = heading + ' \u00f7 ' + d + '. The largest multiple that isn\u2019t bigger than ' + col.value +
        ' is ' + multiple + ' (' + col.q + ' \u00d7 ' + d + '). Write ' + col.q;
      if (col.r > 0) line += ', remainder ' + col.r;
      line += '.';
      if (next && col.r > 0) line += regroupLine(col, next);
      else if (!next && q.mode === 'remainder' && q.rem > 0) line += remainderLine(q);
      return line;
    }
    let line = heading + ' \u00f7 ' + d + ' = ' + col.q;
    if (col.r > 0) line += ', remainder ' + col.r;
    line += '. Write ' + col.q + '.';
    if (next && next.added && col.r > 0 && q.mode === 'decimal' && !col.added) {
      /* The regroup is told in the "keep going" step. */
    } else if (col.added && next && next.added && col.r > 0) {
      line += ' Add another 0.' + regroupLine(col, next);
    } else if (next && col.r > 0) {
      line += regroupLine(col, next);
    }
    if (!next && col.r === 0 && (col.added || q.mode === 'decimal')) line += ' No remainder, so stop.';
    if (!next && q.mode === 'remainder' && q.rem > 0) line += remainderLine(q);
    return line;
  }

  function teach(title, text, tags) {
    return { kind: 'teach', title: title, text: text, stepTag: tags[0], tags: tags };
  }

  function buildSteps(q) {
    const cols = q.cols;
    if (q.mode === 'fraction') return fractionSteps(q);
    const steps = [];
    if (q.divisor >= 10) {
      const list = [];
      for (let n = 1; n <= 10; n++) list.push(n * q.divisor);
      steps.push(teach('Start a list', 'Write the multiples of ' + q.divisor + ' down the side: ' +
        list.slice(0, 3).join(', ') + ' \u2026 ' + list[9] + '.', ['Times fact']));
    }
    let jumped = false;
    cols.forEach(function (col, i) {
      if (q.mode === 'decimal' && col.added && !jumped) {
        steps.push(teach('Keep going past the remainder',
          'Write the decimal point and a placeholder 0.' + regroupLine(q.cols[i - 1], col),
          ['Decimal point', 'Placeholder zero', 'Regrouping']));
        jumped = true;
      }
      if (col.pointBefore && !col.added) {
        steps.push(teach('Decimal point',
          'Write the decimal point in the answer, straight above the one in ' + q.dividendText + '.',
          ['Decimal point']));
      }
      const tags = ['Times fact'];
      if (col.placeholder) tags.push('Placeholder zero');
      if (col.remIn > 0 || (col.r > 0 && i < cols.length - 1)) tags.push('Regrouping');
      if (col.r > 0 && !nextCol(cols, i)) tags.push('Remainder');
      if (col.pointBefore || col.added) tags.push('Decimal point');
      const title = col.added && !jumped ? cap(col.place) : cap(col.place);
      steps.push(teach(title, columnText(col, q, i), tags));
    });
    return steps;
  }

  function fractionSteps(q) {
    const story = q.cols.map(function (col, i) { return columnText(col, q, i); }).join(' ');
    const simplified = q.fracN !== q.rawN;
    const mixed = q.wholeAns + ' ' + fracHtml(q.fracN, q.fracD);
    const rawMixed = q.wholeAns + ' ' + fracHtml(q.rawN, q.rawD);
    const why = q.rem === 1
      ? "There's 1 remainder, but it still has to be shared between " + q.divisor + '. Each share is ' + fractionWords(1, q.divisor) + '.'
      : 'There are ' + q.rem + ' remainder, but they still have to be shared between ' + q.divisor + '. Each share is ' + fractionWords(1, q.divisor) + '.';
    let simplify = 'e.g. 26 \u00f7 4 = 6 r2 = 6 ' + fracHtml(2, 4) + ' = 6' + fracHtml(1, 2) + '.';
    if (simplified) {
      simplify = q.wholeAns + ' r' + q.rem + ' = ' + rawMixed + ' = ' + mixed + '. ' + simplify;
    }
    return [
      teach('Divide as usual', story, ['Times fact', 'Regrouping', 'Placeholder zero']),
      teach('Write the remainder as a fraction', 'The remainder goes on top, the number we divided by goes underneath.', ['Remainder']),
      teach('Why?', why, ['Remainder']),
      teach('Simplify if you can', simplify, ['Remainder']),
      teach('Answer', q.dividendText + ' \u00f7 ' + q.divisor + ' = ' + mixed + ' (the same as ' + q.decimalText + ').', ['Remainder', 'Decimal point'])
    ];
  }

  function answerLabel(q) {
    if (q.mode === 'remainder') return q.wholeAns + ' r' + q.rem;
    if (q.mode === 'fraction') return q.wholeAns + ' ' + fracHtml(q.fracN, q.fracD);
    return q.answerText;
  }
  function checkLine(q) {
    if (q.mode === 'remainder' || q.mode === 'fraction') {
      const prod = q.wholeAns * q.divisor;
      return 'Check: ' + q.wholeAns + ' \u00d7 ' + q.divisor + ' = ' + prod +
        ', plus the remainder ' + q.rem + ' = ' + q.dividendText + '\u00a0\u2713';
    }
    return 'Check: ' + q.answerText + ' \u00d7 ' + q.divisor + ' = ' + q.dividendText + '\u00a0\u2713';
  }

  function listOpen(q) {
    if (EM.session && EM.session.multiplesOpen != null) return EM.session.multiplesOpen;
    if (EM.session && EM.session.mulDefault) return true;
    return q.level === 11;
  }

  function multiplesHtml(q, revealed) {
    const open = listOpen(q);
    const label = 'Multiples of ' + q.divisor;
    if (!open) {
      return '<button type="button" class="mult-closed" id="multToggle" aria-expanded="false">' +
        label + ' <span aria-hidden="true">\u25bc</span></button>' +
        '<p class="mult-note">If you\u2019re using the list, find the largest multiple that isn\u2019t bigger than your number.</p>';
    }
    let rows = '';
    for (let n = 1; n <= 10; n++) {
      const on = revealed && q.usedMultiples[n] ? ' used' : '';
      rows += '<div class="mult-row' + on + '"><span>' + n + ' \u00d7</span><span>' + (n * q.divisor) + '</span></div>';
    }
    return '<div class="mult-panel"><button type="button" class="mult-toggle" id="multToggle" aria-expanded="true">' +
      label + ' <span aria-hidden="true">\u25b2</span></button>' + rows + '</div>' +
      '<p class="mult-note">If you\u2019re using the list, find the largest multiple that isn\u2019t bigger than your number.</p>';
  }

  function busHtml(q, through) {
    const showAll = through == null || through >= q.cols.length;
    let template = '';
    let ans = '';
    let digs = '';
    let gi = 1;
    let bracketed = false;
    q.cols.forEach(function (col, i) {
      const reached = showAll || i <= through;
      const born = showAll || i <= through + 1;
      if (col.added && !born) return;
      if (col.pointBefore) {
        template += (template ? ' ' : '') + '0.42em';
        ans += '<span class="bus-ans" style="grid-column:' + gi + '">' + (reached ? '.' : '') + '</span>';
        digs += '<span class="bus-slot" style="grid-column:' + gi + '">.</span>';
        gi += 1;
      }
      template += (template ? ' ' : '') + '1.6em';
      const fig = reached ? String(col.q) : '';
      ans += '<span class="bus-ans' + (reached && col.placeholder ? ' ph' : '') + '" style="grid-column:' + gi + '">' + fig + '</span>';
      const rem = born && col.remIn > 0 ? '<sup class="bus-rem">' + col.remIn + '</sup>' : '';
      const digCls = col.added ? ' ph' : '';
      const bracket = !bracketed ? ' bracket' : '';
      bracketed = true;
      digs += '<span class="bus-slot' + bracket + '" style="grid-column:' + gi + '"><span class="bus-figwrap">' +
        rem + '<span class="bus-fig' + digCls + '">' + col.digit + '</span></span></span>';
      gi += 1;
    });
    if (showAll && (q.mode === 'remainder' || q.mode === 'fraction') && q.rem > 0) {
      template += ' max-content';
      ans += '<span class="bus-ans bus-r" style="grid-column:' + gi + '">r ' + q.rem + '</span>';
      digs += '<span class="bus-slot" style="grid-column:' + gi + '"></span>';
    }
    return '<div class="bus" aria-hidden="true"><div class="bus-divisor">' + q.divisor + '</div>' +
      '<div class="bus-board" style="grid-template-columns:' + template + '">' + ans + digs + '</div></div>';
  }

  function shareHtml(q) {
    let parts = '';
    for (let i = 0; i < q.divisor && i < 12; i++) {
      parts += '<span class="share-part' + (i < q.rem ? ' on' : '') + '">' + fracHtml(1, q.divisor) + '</span>';
    }
    return '<p class="share-note">The remainder ' + q.rem + ' is shared between ' + q.divisor + '. Each share is ' +
      fracHtml(1, q.divisor) + '.</p><div class="share-bar">' + parts + '</div>' +
      '<p class="share-eq">' + q.wholeAns + ' r' + q.rem + ' = ' + q.wholeAns + ' ' + fracHtml(q.rawN, q.rawD) +
      (q.fracN !== q.rawN ? ' = ' + q.wholeAns + ' ' + fracHtml(q.fracN, q.fracD) : '') +
      ' = ' + q.decimalText + '</p>';
  }

  function legendHtml(q) {
    const bits = ['<span><sup class="bus-rem">1</sup> Remainder, regrouped</span>',
      '<span><span class="ph-key">0</span> Placeholder zero</span>'];
    if (q.answerText.indexOf('.') >= 0 || q.mode === 'decimal') {
      bits.push('<span>Decimal points line up</span>');
    }
    return '<p class="bus-key">' + bits.join('') + '</p>';
  }

  function renderWorking(q, stepIndex) {
    const steps = q.steps || [];
    const last = !steps.length || stepIndex >= steps.length - 1;
    let through = q.cols.length;
    if (stepIndex >= 0 && stepIndex < steps.length - 1 && q.mode !== 'fraction') {
      const title = steps[stepIndex].title;
      if (title === 'Start a list') through = -1;
      else if (title === 'Keep going past the remainder') {
        through = -1;
        q.cols.forEach(function (col, i) { if (!col.added && i > through) through = i; });
      } else {
        through = -1;
        q.cols.forEach(function (col, i) {
          if (cap(col.place) === title) through = i;
        });
        const seen = {};
        q.cols.forEach(function (col, i) {
          const name = cap(col.place);
          if (name === title && seen[name]) through = i;
          seen[name] = true;
        });
      }
    }
    let work = busHtml(q, through < 0 ? -1 : through);
    if (q.mode === 'fraction' && stepIndex >= 2) work += shareHtml(q);
    if (last) {
      work += '<p class="div-answer"><strong>Answer: ' + answerLabel(q) + '</strong><span class="div-check">' + checkLine(q) + '</span></p>';
      if (EM.session && EM.session.est !== false) {
        const est = estimate(q);
        const shown = (q.mode === 'remainder' || q.mode === 'fraction') ? String(q.wholeAns) : q.answerText;
        work += '<p class="closeness">' + shown + ' is close to the estimate of ' + est.answer + ' \u2713</p>';
      }
      if (q.leadingPh && q.mode !== 'remainder' && q.mode !== 'fraction') {
        work += '<p class="mult-note">The placeholder 0 at the front isn\u2019t needed when we write the answer: ' + q.answerText + '.</p>';
      }
      work += legendHtml(q);
    }
    return '<div class="div-layout"><div class="div-work">' + work + '</div><div class="mult-wrap">' +
      multiplesHtml(q, true) + '</div></div>';
  }

  function render(q, stepIndex, el) {
    const revealed = q.view && (q.view.reveal || q.view.walking || (q.view.step != null && q.view.step >= 0 && stepIndex >= 0));
    if (!revealed) {
      el.innerHTML = '<div class="mult-wrap">' + multiplesHtml(q, false) + '</div>';
      return;
    }
    el.innerHTML = renderWorking(q, q.view && q.view.reveal ? q.steps.length - 1 : stepIndex);
  }

  function estimate(q) {
    const rounded = roundSig(q.answer);
    const friendlyQ = rounded || q.divisor;
    const friendlyN = friendlyQ * q.divisor;
    const left = Number.isInteger(friendlyN) ? String(friendlyN) : String(Math.round(friendlyN * 1000) / 1000);
    return { prompt: left + ' \u00f7 ' + q.divisor, answer: friendlyQ };
  }

  function strategy(q) {
    const est = estimate(q);
    return '<strong>Round to a friendly multiple of ' + q.divisor + '.</strong> ' +
      est.prompt + ' = <strong>' + est.answer + '</strong>';
  }

  function makeFrom(text, divisor, level, mode) {
    return buildRecord(text, divisor, level, mode);
  }

  function modeFor(level) {
    if (level === 7) return 'remainder';
    if (level === 8) return 'fraction';
    if (level === 9) return 'decimal';
    if (level === 10) return 'exact';
    return 'exact';
  }

  function fits(level, q) {
    if (!q) return false;
    if (level === 11) {
      if (q.divisor < 11 || q.divisor > 25 || q.dp) return false;
      if (q.len !== 3 && q.len !== 4) return false;
      if (regroups(q.cols) < 2) return false;
      if (q.rem > 0) return q.mode === 'remainder';
      return q.exact && q.rem === 0;
    }
    if (q.divisor < 2 || q.divisor > 9) return false;
    if (level === 1) return q.len === 2 && q.exact && !q.dp && !q.hasRegroup && !q.leadingPh && !q.zeroInNumber && !q.zeroInAnswer;
    if (level === 2) return q.len === 2 && q.exact && !q.dp && q.hasRegroup && !q.leadingPh && !q.zeroInNumber && !q.zeroInAnswer;
    if (level === 3) return q.len === 3 && q.exact && !q.dp && q.hasRegroup && !q.leadingPh && !q.zeroInNumber && !q.zeroInAnswer;
    if (level === 4) return q.len === 3 && q.exact && !q.dp && q.leadingPh && !q.zeroInNumber && !q.zeroInAnswer;
    if (level === 5) return q.exact && !q.dp && q.zeroInAnswer && q.len >= 3 && q.len <= 4;
    if (level === 6) return q.len === 4 && q.exact && !q.dp;
    if (level === 7) return q.rem > 0 && !q.dp && q.len >= 2 && q.len <= 3 && q.mode === 'remainder';
    if (level === 8) return TERM_DIVS.indexOf(q.divisor) >= 0 && q.rem > 0 && !q.dp && q.len >= 2 && q.len <= 3;
    if (level === 9) return TERM_DIVS.indexOf(q.divisor) >= 0 && q.wholeRem > 0 && q.exact && q.extra > 0 && q.dp > 0 && q.len >= 2 && q.len <= 3;
    if (level === 10) return q.dp > 0 && q.exact && q.rem === 0 && q.extra === 0;
    return false;
  }

  function candidate(level, wantZero) {
    const mode = modeFor(level);
    if (level === 1) {
      const d = pick(DIGIT_DIVS);
      const maxQ = Math.floor(9 / d);
      const a = irand(1, maxQ) * d;
      const b = irand(1, maxQ) * d;
      return makeFrom(String(a) + String(b), d, level, mode);
    }
    if (level === 10) {
      const d = pick(DIGIT_DIVS);
      const places = Math.random() < 0.45 ? 1 : 2;
      const scale = Math.pow(10, places);
      const qUnits = irand(scale + 1, 30 * scale);
      if (qUnits % scale === 0) return null;
      const divUnits = qUnits * d;
      if (divUnits % 10 === 0 && places === 2) return null;
      const text = fmtUnits(divUnits, places);
      if (text.indexOf('.') < 0) return null;
      if (wantZero && text.indexOf('0') < 0) return null;
      return makeFrom(text, d, level, 'exact');
    }
    if (level === 11) {
      const d = irand(11, 25);
      const withRem = Math.random() < 0.33;
      const four = Math.random() < 0.45;
      const len = four ? 4 : 3;
      const minN = four ? 1000 : 100;
      const maxN = four ? 9999 : 999;
      const rem = withRem ? irand(1, d - 1) : 0;
      const minQ = Math.ceil(minN / d);
      const maxQ = Math.floor((maxN - rem) / d);
      if (maxQ < minQ) return null;
      let quot = irand(minQ, maxQ);
      if (Math.random() < 0.35) {
        const s = String(quot);
        if (s.length >= 2 && s.indexOf('0') < 0) {
          const pos = irand(1, s.length - 1);
          const nudged = parseInt(s.slice(0, pos) + '0' + s.slice(pos + 1), 10);
          if (nudged >= 1) quot = nudged;
        }
      }
      const dividend = quot * d + rem;
      if (String(dividend).length !== len) return null;
      return makeFrom(String(dividend), d, 11, rem ? 'remainder' : 'exact');
    }
    let d = pick(level === 8 || level === 9 ? TERM_DIVS : DIGIT_DIVS);
    let q;
    let rem = 0;
    if (level === 7 || level === 8 || level === 9) {
      const len = Math.random() < 0.35 ? 2 : 3;
      const min = len === 2 ? 10 : 100;
      const max = len === 2 ? 99 : 999;
      q = irand(Math.max(1, Math.ceil(min / d) - 1), Math.floor((max - (d - 1)) / d));
      rem = irand(1, d - 1);
    } else if (level === 5) {
      const withZero = ['101', '102', '103', '104', '105', '201', '202', '203', '204', '206', '301', '302', '303', '304', '305', '306', '308', '401', '402', '404', '405', '406', '408', '501', '502', '504', '505', '506', '508', '602', '603', '604', '605', '606', '608', '702', '704', '706', '708', '801', '802', '804', '805', '806', '808'];
      q = parseInt(pick(withZero), 10);
      if (q % d === 0 && Math.random() < 0.5) {
        /* keep a quotient that may not divide this d; retry via fits */
      }
    } else if (level === 6) {
      q = irand(Math.ceil(1000 / d), Math.floor(9999 / d));
    } else if (level === 4) {
      q = irand(10, Math.floor(999 / d));
    } else if (level === 3) {
      q = irand(Math.ceil(100 / d), Math.floor(999 / d));
    } else {
      q = irand(10, Math.floor(99 / d));
    }
    if (!q || q < 1) return null;
    const dividend = q * d + rem;
    const text = String(dividend);
    if (level <= 4 && text.indexOf('0') >= 0) return null;
    if (level === 6 && text.length !== 4) return null;
    if ((level === 2 || level === 3 || level === 4) && text.length !== (level === 2 ? 2 : 3)) return null;
    if (wantZero && text.indexOf('0') < 0 && level >= 5) return null;
    const built = makeFrom(text, d, level, mode);
    return built;
  }

  function normal(level) {
    const wantZero = level >= 5 && level !== 8 && level !== 9 && Math.random() < 0.45;
    for (let i = 0; i < 80; i++) {
      const q = candidate(level, wantZero && i < 50);
      if (fits(level, q)) return q;
    }
    for (let i = 0; i < 80; i++) {
      const q = candidate(level, false);
      if (fits(level, q)) return q;
    }
    return null;
  }

  function extBank(level) {
    const base = normal(level === 10 || level === 1 ? 7 : level) || makeFrom('157', 4, 7, 'remainder');
    const remQ = base.rem > 0 ? base : makeFrom('157', 4, 7, 'remainder');
    const d = base.divisor;
    const cups = 4 + irand(0, 3) * 2;
    const boxes = pick([3, 4, 5, 6, 8]);
    const left = irand(1, boxes - 1);
    const each = irand(3, 9);
    const total = each * boxes + left;
    const biggerN = Math.ceil(base.answer / 10) * 10 * d || d * 10;
    const bigger = biggerN / d;
    return [
      {
        type: 'Word problem',
        kind: 'number',
        expect: each + ' r' + left,
        hint: 'Share them into equal groups first. What is left is the remainder.',
        p: total + ' cupcakes are shared between ' + boxes + ' boxes. How many in each box, and what is the remainder? Write it like ' + each + ' r' + left + '.',
        a: each + ' \u00d7 ' + boxes + ' = ' + (each * boxes) + ', plus the remainder ' + left + ' = ' + total + '. <strong>' + each + ' r' + left + '</strong>'
      },
      {
        type: 'True or False',
        kind: 'tf',
        expect: 'false',
        hint: 'A remainder is not the same as that many tenths.',
        p: 'True or false: ' + remQ.wholeAns + ' r' + remQ.rem + ' is the same as ' + remQ.wholeAns + '.' + remQ.rem,
        a: '<strong>False.</strong> ' + remQ.wholeAns + ' r' + remQ.rem + ' means ' + remQ.wholeAns + ' and ' + fractionWords(remQ.rem, remQ.divisor) + ', not ' + remQ.wholeAns + '.' + remQ.rem + '.'
      },
      {
        type: 'Which is bigger?',
        kind: 'number',
        expect: String(bigger),
        hint: 'Work out each one, or round to a friendly multiple of the divisor.',
        p: 'Which is bigger: ' + base.dividendText + ' \u00f7 ' + d + ' or ' + biggerN + ' \u00f7 ' + d + '? Write the bigger answer.',
        a: biggerN + ' \u00f7 ' + d + ' = <strong>' + bigger + '</strong>'
      },
      {
        type: 'Fraction',
        kind: 'number',
        expect: '6 1/2',
        hint: 'Divide first. The remainder goes on top, and 4 goes underneath. Then simplify.',
        p: 'Write 26 \u00f7 4 as a mixed number, simplified.',
        a: '26 \u00f7 4 = 6 r2 = 6 ' + fracHtml(2, 4) + ' = <strong>6' + fracHtml(1, 2) + '</strong>'
      }
    ];
  }

  const TIPS = {
    'Times fact': 'Find the largest multiple of the divisor that is not bigger than the number in that place.',
    'Regrouping': 'A remainder is regrouped in front of the next digit. It becomes part of that place.',
    'Placeholder zero': 'If a digit will not go, write a placeholder 0 so the other digits keep their places.',
    'Remainder': 'What is left is the remainder. As a fraction, the remainder goes on top and the divisor underneath.',
    'Decimal point': 'The decimal point in the answer lines up with the decimal point in the number.'
  };

  EM.registerTopic({
    id: 'div',
    name: 'Division',
    homeExample: 'e.g. 852 \u00f7 4',
    section: 'written',
    showsPrep: true,
    lede: 'Short division. Pick a level. The highlighted one is where you are up to.',
    levels: [
      { id: 1, name: 'No regrouping', example: '84 \u00f7 4' },
      { id: 2, name: 'Regrouping', example: '72 \u00f7 3' },
      { id: 3, name: '3-digit numbers', example: '456 \u00f7 3' },
      { id: 4, name: 'First digit too small', example: '256 \u00f7 4' },
      { id: 5, name: 'Zero in the answer', example: '618 \u00f7 3' },
      { id: 6, name: '4-digit numbers', example: '5868 \u00f7 6' },
      { id: 7, name: 'Remainders', example: '157 \u00f7 4 = 39 r1' },
      { id: 8, name: 'Remainders as fractions', example: '157 \u00f7 4 = 39\u00bc' },
      { id: 9, name: 'Remainders as decimals', example: '157 \u00f7 4 = 39.25' },
      { id: 10, name: 'Decimal \u00f7 whole number', example: '7.56 \u00f7 3' },
      { id: 11, name: 'Extension: 2-digit divisors', example: '1534 \u00f7 13', extension: true }
    ],
    tricky: [
      { id: 'zero', tags: ['Placeholder zero'], levels: [4, 5, 6] },
      { id: 'remainder', tags: ['Remainder'], levels: [7, 8, 9] },
      { id: 'decimal', tags: ['Decimal point'], levels: [9, 10] }
    ],
    errorTags: ['Times fact', 'Regrouping', 'Placeholder zero', 'Remainder', 'Decimal point'],
    tips: TIPS,
    makeQuestion: function (level, opts) {
      opts = opts || {};
      if (opts.force) {
        const q = makeFrom(opts.force.text, opts.force.divisor, level, opts.force.mode || modeFor(level));
        q.level = level;
        q.tricky = !!opts.tricky;
        return q;
      }
      const q = normal(level) || makeFrom('84', 4, 1, 'exact');
      q.level = level;
      q.tricky = !!opts.tricky;
      q.steps = buildSteps(q);
      return q;
    },
    estimate: estimate,
    instruction: function (q) {
      if (q.mode === 'remainder') return 'Give the remainder as a remainder.';
      if (q.mode === 'fraction') return 'Write the remainder as a fraction.';
      if (q.mode === 'decimal') return 'Write the answer as a decimal.';
      return '';
    },
    estimateCue: function (q) {
      return 'Estimate first: round to a friendly multiple of ' + q.divisor + '.';
    },
    buildSteps: function (q) { return q.steps || buildSteps(q); },
    render: render,
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
