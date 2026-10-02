/* Percentages. Six levels. Of-amount questions can be shown three ways
   after the reveal: build up, near a benchmark, and decimal × amount. */
(function () {
  const TIPS = {
    1: '50% is half. 10% is divide by 10',
    2: 'Build it up from 10%, 5% and 1%.',
    3: 'Find the nearest easy percentage, then add or take away.',
    4: 'Change the percentage to a decimal first.',
    5: 'Find the discount, then take it off.',
    6: 'Make the denominator 100'
  };
  const METHOD_LABEL = {
    build: 'Build up',
    bench: 'Near a benchmark',
    decimal: 'Decimal \u00d7 amount'
  };
  const ITEMS = ['jumper', 'hat', 'book', 'game', 'shirt', 'ball'];

  function ri(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick(list) {
    return list[ri(0, list.length - 1)];
  }
  function num(n) {
    const r = Math.round(n * 100) / 100;
    if (Math.abs(r - Math.round(r)) < 1e-9) return String(Math.round(r));
    return r.toFixed(2).replace(/0$/, '');
  }
  function money(n) {
    return '$' + (Math.round(n * 100) / 100).toFixed(2);
  }
  function decText(pct) {
    return num(pct / 100);
  }
  function partValue(pct, amount) {
    return Math.round(amount * pct) / 100;
  }
  function teach(title, text, tag) {
    return { kind: 'teach', title: title, text: text, stepTag: tag || null, tags: tag ? [tag] : [] };
  }
  function shown(q, n) {
    return q.money ? money(n) : num(n);
  }
  function amt(q) {
    return q.money ? money(q.amount) : String(q.amount);
  }

  function benchmark(pct) {
    const options = [50, 25, 10];
    for (let i = 0; i < options.length; i++) {
      const diff = pct - options[i];
      const gap = Math.abs(diff);
      if (gap >= 1 && gap <= 2) return { bench: options[i], diff: diff, gap: gap };
    }
    return null;
  }

  function methodsFor(q) {
    if (!q || q.kind !== 'of') return [];
    if (q.level === 1) return ['build'];
    const list = ['build'];
    if (benchmark(q.pct)) list.push('bench');
    list.push('decimal');
    return list;
  }

  function defaultMethod(q) {
    if (q.level === 3 && benchmark(q.pct)) return 'bench';
    if (q.level === 4) return 'decimal';
    return 'build';
  }

  function ruleFor(pct) {
    if (pct === 50) return '50%: halve it.';
    if (pct === 25) return '25%: halve it, then halve it again.';
    if (pct === 10) return '10%: divide by 10';
    if (pct === 5) return '5%: half of 10%';
    if (pct === 1) return '1%: divide by 100';
    return '';
  }

  function linePhrase(pct, q) {
    const value = shown(q, partValue(pct, q.amount));
    const line = pct + '% of ' + amt(q) + ' = ' + value;
    if (pct === 10) return '10%: divide by 10, then ' + line;
    if (pct === 5) return '5%: half of 10%, so ' + line;
    if (pct === 1) return '1%: divide by 100, then ' + line;
    if (pct === 50) return '50%: halve it. ' + line;
    if (pct === 25) return '25%: halve it, then halve it again. ' + line;
    return line;
  }

  function tagFor(pct) {
    if (pct === 10 || pct === 5 || (pct % 10 === 0 && pct > 0)) return 'Finding 10%';
    if (pct === 1 || pct === 2 || pct === 3 || pct === 4) return 'Finding 1%';
    if (pct % 10 === 0) return 'Finding 10%';
    return null;
  }

  function halfCheck(q) {
    const half = q.amount / 2;
    const answer = q.answer;
    const text = q.answerText;
    if (q.pct === 50) {
      return 'Check: 50% is half, and ' + text + ' is half of ' + q.amount + '\u00a0\u2713';
    }
    const just = Math.abs(q.pct - 50) <= 2;
    const under = q.pct < 50;
    const pctWord = (just ? 'just ' : '') + (under ? 'under half' : 'over half');
    const gap = Math.abs(answer - half);
    const ansJust = gap <= Math.max(1, q.amount * 0.03);
    let ansWord = 'half';
    if (answer < half - 1e-9) ansWord = ((just && ansJust) ? 'just ' : '') + 'under half';
    else if (answer > half + 1e-9) ansWord = ((just && ansJust) ? 'just ' : '') + 'over half';
    return 'Check: ' + q.pct + '% is ' + pctWord + ', and ' + text + ' is ' + ansWord + ' of ' + q.amount + '\u00a0\u2713';
  }

  function estimateCheck(q) {
    const pct = q.pct;
    const amount = q.amount;
    const answer = q.answer;
    const benches = [
      { dist: Math.abs(pct - 50), about: 'about half', label: 'Half', value: amount / 2 },
      { dist: Math.abs(pct - 25), about: 'about a quarter', label: 'A quarter', value: amount / 4 },
      { dist: Math.abs(pct - 10), about: 'about 10%', label: '10%', value: amount / 10 }
    ];
    const ten = Math.round(pct / 10) * 10;
    if (ten >= 10 && ten !== 50 && ten !== 25 && ten !== 10) {
      benches.push({ dist: Math.abs(pct - ten), about: 'about ' + ten + '%', label: ten + '%', value: amount * ten / 100 });
    }
    benches.sort(function (a, b) { return a.dist - b.dist; });
    let pick = null;
    for (let i = 0; i < benches.length; i++) {
      const value = Math.round(benches[i].value * 100) / 100;
      if (Math.abs(value - answer) > 0.05) {
        pick = benches[i];
        pick.value = value;
        break;
      }
    }
    if (!pick) {
      const other = pct >= 50 ? Math.max(10, pct - 10) : pct + 10;
      const more = other < pct;
      pick = {
        about: (more ? 'a bit more than ' : 'a bit less than ') + other + '%',
        label: other + '%',
        value: Math.round(amount * other) / 100
      };
    }
    return 'Check: ' + pct + '% is ' + pick.about + '. ' + pick.label + ' of ' + amount + ' is ' + num(pick.value) + ', so ' + num(answer) + ' makes sense.';
  }

  function ofQuestion(pct, amount, tricky) {
    const answer = partValue(pct, amount);
    return {
      kind: 'of',
      pct: pct,
      amount: amount,
      answer: answer,
      answerText: num(answer),
      equation: pct + '% of ' + amount,
      money: false,
      tricky: !!tricky
    };
  }

  function decimalQuestion(pct, amount, tricky) {
    const q = ofQuestion(pct, amount, tricky);
    q.equation = decText(pct) + ' \u00d7 ' + amount;
    return q;
  }

  function discountQuestion(pct, price, item, tricky) {
    const discount = partValue(pct, price);
    const sale = Math.round((price - discount) * 100) / 100;
    return {
      kind: 'discount',
      pct: pct,
      amount: price,
      price: price,
      item: item,
      discount: discount,
      pay: 100 - pct,
      answer: sale,
      answerText: money(sale),
      equation: 'A ' + money(price).replace(/\.00$/, '') + ' ' + item + ' is ' + pct + '% off. What is the sale price?',
      money: true,
      tricky: !!tricky,
      check: 'Check: ' + money(price) + ' \u2212 ' + money(discount) + ' = ' + money(sale) + '\u00a0\u2713'
    };
  }

  function outQuestion(n, d, tricky) {
    const mul = 100 / d;
    const percent = n * mul;
    return {
      kind: 'outof',
      n: n,
      d: d,
      mul: mul,
      percent: percent,
      answer: percent,
      answerText: percent + '%',
      equation: n + ' out of ' + d,
      tricky: !!tricky,
      check: 'Check: ' + percent + ' out of 100 is ' + percent + '%\u00a0\u2713'
    };
  }

  function normal(level) {
    if (level === 1) {
      const kind = pick([50, 25, 10]);
      if (kind === 50) return ofQuestion(50, pick([20, 24, 40, 48, 60, 80, 100, 120, 160, 200]), false);
      if (kind === 25) return ofQuestion(25, pick([16, 24, 32, 40, 48, 64, 80, 100, 120, 160, 200]), false);
      return ofQuestion(10, pick([20, 30, 40, 50, 60, 80, 90, 100, 120, 150, 200]), false);
    }
    if (level === 2) {
      return ofQuestion(pick([15, 20, 30, 35, 40, 45]), pick([40, 60, 80, 100, 120, 160, 200]), false);
    }
    if (level === 3) {
      return ofQuestion(pick([8, 9, 11, 12, 23, 24, 26, 27, 48, 49, 51, 52]), pick([40, 60, 75, 80, 90, 100, 120, 200]), false);
    }
    if (level === 4) {
      return decimalQuestion(pick([20, 25, 35, 40, 50]), pick([20, 40, 60, 80]), false);
    }
    if (level === 5) {
      return discountQuestion(pick([5, 10, 15, 20, 25, 50]), pick([20, 40, 60, 80, 100]), pick(ITEMS), false);
    }
    const pairs = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10]];
    const pair = pick(pairs);
    return outQuestion(pair[0], pair[1], false);
  }

  function trickyQ(level) {
    if (level === 1) {
      const kind = pick([50, 25, 10]);
      if (kind === 50) return ofQuestion(50, pick([180, 240, 360, 480]), true);
      if (kind === 25) return ofQuestion(25, pick([140, 180, 240, 320, 360]), true);
      return ofQuestion(10, pick([250, 360, 480, 750, 900]), true);
    }
    if (level === 2) {
      return ofQuestion(pick([11, 12, 16, 21, 31, 36, 41, 42]), pick([75, 85, 125, 150, 240]), true);
    }
    if (level === 3) {
      return ofQuestion(pick([48, 49, 52, 26, 27, 11, 12, 8]), pick([75, 90, 125, 150, 250]), true);
    }
    if (level === 4) {
      return decimalQuestion(pick([12, 15, 18, 36, 48, 65]), pick([25, 75, 80, 125, 240]), true);
    }
    if (level === 5) {
      return discountQuestion(pick([5, 12, 15, 35]), pick([48, 60, 75, 85, 120, 250]), pick(ITEMS), true);
    }
    const pairs = [[18, 25], [9, 20], [7, 20], [11, 20], [13, 25], [17, 25], [19, 25], [7, 50], [13, 50], [21, 50], [33, 50]];
    const pair = pick(pairs);
    return outQuestion(pair[0], pair[1], true);
  }

  function rowStep(pct, q) {
    return teach(pct + '%', linePhrase(pct, q), tagFor(pct));
  }

  function buildWorking(q) {
    const found = partValue(q.pct, q.amount);
    if (q.pct === 50) {
      const line = '50% of ' + amt(q) + ' = ' + shown(q, found);
      return {
        rule: '50%: halve it.',
        rows: [],
        final: line,
        steps: [teach('50%', '50%: halve it. ' + line, null)]
      };
    }
    if (q.pct === 25) {
      const half = partValue(50, q.amount);
      const line = '25% of ' + amt(q) + ' = ' + shown(q, found);
      return {
        rule: '25%: halve it, then halve it again.',
        rows: [{ left: 'Half of ' + amt(q), right: shown(q, half) }],
        final: line,
        steps: [
          teach('Halve it', 'Half of ' + amt(q) + ' = ' + shown(q, half), null),
          teach('Halve it again', '25%: halve it, then halve it again. ' + line, null)
        ]
      };
    }

    const tens = Math.floor(q.pct / 10);
    const rem = q.pct % 10;
    const five = rem >= 5;
    const ones = rem % 5;
    const rows = [];
    const steps = [];
    function add(pct) {
      rows.push({ left: pct + '% of ' + amt(q), right: shown(q, partValue(pct, q.amount)) });
      steps.push(rowStep(pct, q));
    }
    if (tens || five) add(10);
    if (tens > 1) add(tens * 10);
    if (five) add(5);
    if (ones) add(1);
    if (ones > 1) add(ones);

    const bits = [];
    if (tens) bits.push(tens * 10);
    if (five) bits.push(5);
    if (ones) bits.push(ones);
    let final = '';
    if (bits.length > 1) {
      const values = bits.map(function (pct) { return shown(q, partValue(pct, q.amount)); });
      final = q.pct + '% of ' + amt(q) + ' = ' + values.join(' + ') + ' = ' + shown(q, found);
      steps.push(teach('Add the parts', final, 'Adding the parts'));
    } else if (rows.length && rows[rows.length - 1].left.indexOf(q.pct + '%') === 0) {
      const last = rows.pop();
      steps.pop();
      final = last.left + ' = ' + last.right;
      const rule = ruleFor(q.pct);
      steps.push(teach(q.pct + '%', (rule ? rule + ' ' : '') + final, tagFor(q.pct)));
    } else {
      final = q.pct + '% of ' + amt(q) + ' = ' + shown(q, found);
      steps.push(teach(q.pct + '%', final, tagFor(q.pct)));
    }
    return { rule: ruleFor(q.pct), rows: rows, final: final, steps: steps };
  }

  function benchWorking(q) {
    const info = benchmark(q.pct);
    const sign = info.diff < 0 ? '\u2212' : '+';
    const rows = [];
    const steps = [];
    function add(pct, tag) {
      const line = pct + '% of ' + amt(q) + ' = ' + shown(q, partValue(pct, q.amount));
      rows.push({ left: pct + '% of ' + amt(q), right: shown(q, partValue(pct, q.amount)) });
      const rule = ruleFor(pct);
      steps.push(teach(pct + '%', (rule ? rule + ' ' : '') + line, tag));
    }
    const benchTag = info.bench === 10 ? 'Finding 10%' : null;
    add(info.bench, benchTag);
    add(1, 'Finding 1%');
    if (info.gap === 2) add(2, 'Finding 1%');
    const gapValue = shown(q, partValue(info.gap, q.amount));
    const benchValue = shown(q, partValue(info.bench, q.amount));
    const final = q.pct + '% = ' + info.bench + '% ' + sign + ' ' + info.gap + '% = ' + benchValue + ' ' + sign + ' ' + gapValue + ' = ' + shown(q, q.answer);
    steps.push(teach('Add or take away', final, 'Adding the parts'));
    return { rule: '', rows: rows, final: final, steps: steps };
  }

  function ensureMul(q) {
    if (q.mulQ) return q.mulQ;
    const textA = decText(q.pct);
    const dpA = (textA.split('.')[1] || '').length;
    const mulQ = {
      a: q.pct / 100,
      b: q.amount,
      aInt: Math.round(q.pct * Math.pow(10, dpA) / 100),
      bInt: q.amount,
      dpA: dpA,
      dpB: 0,
      dp: dpA,
      dpTotal: dpA,
      textA: textA,
      textB: String(q.amount),
      equation: textA + ' \u00d7 ' + q.amount,
      sign: '\u00d7',
      op: 'multiplication',
      long: String(q.amount).length > 1
    };
    mulQ.steps = EM.topics.mul.buildSteps(mulQ);
    q.mulQ = mulQ;
    return mulQ;
  }

  function decimalWorking(q) {
    const mulQ = ensureMul(q);
    const steps = mulQ.steps.map(function (s, i) {
      const copy = {};
      Object.keys(s).forEach(function (key) { copy[key] = s[key]; });
      if (i === 0) {
        copy.title = 'Change to a decimal';
        copy.label = 'Change to a decimal';
        copy.text = q.pct + '% = ' + decText(q.pct) + '<br>' + (s.text || '');
        copy.stepTag = 'Decimal point';
        copy.tags = ['Decimal point'].concat(s.tags || []);
      }
      if (s.label === 'Check' || s.title === 'Check') {
        copy.title = 'Check';
        copy.label = 'Check';
        copy.text = estimateCheck(q);
      }
      return copy;
    });
    return { steps: steps, mul: true };
  }

  function discountWorking(q) {
    const built = buildWorking(q);
    const take = amt(q) + ' \u2212 ' + money(q.discount) + ' = ' + q.answerText;
    const steps = built.steps.map(function (s, i) {
      if (i > 0) return s;
      return teach('Find the discount', 'Step 1: find the discount. ' + s.text, s.stepTag);
    });
    steps.push(teach('Take it off the price', 'Step 2: take it off the price. ' + take, 'Taking off the discount'));
    return {
      discount: true,
      rule: '',
      rows: built.rows,
      sum: built.final,
      final: take,
      note: 'Another way: ' + q.pct + '% off means you pay ' + q.pay + '%.',
      steps: steps
    };
  }

  function miniFrac(n, d) {
    return '<span class="frac"><span class="frac-n">' + n + '</span><span class="frac-d">' + d + '</span></span>';
  }

  function outWorking(q) {
    const top = q.n * q.mul;
    return {
      out: true,
      steps: [
        teach('Write it as a fraction', q.n + ' out of ' + q.d + ' is ' + miniFrac(q.n, q.d), 'Making it out of 100'),
        teach('What you do to the top, you do to the bottom', q.d + ' \u00d7 ' + q.mul + ' = 100, so ' + q.n + ' \u00d7 ' + q.mul + ' = ' + top, 'Making it out of 100'),
        teach('Out of 100', miniFrac(top, 100) + ' = ' + q.percent + '%', 'Making it out of 100')
      ]
    };
  }

  function workingFor(q, method) {
    if (q.kind === 'discount') return discountWorking(q);
    if (q.kind === 'outof') return outWorking(q);
    if (method === 'bench' && benchmark(q.pct)) return benchWorking(q);
    if (method === 'decimal') return decimalWorking(q);
    return buildWorking(q);
  }

  function stack(n, d, mul) {
    function fig(value) {
      const right = mul > 1 ? '<sup class="frac-mul">\u00d7' + mul + '</sup>' : '';
      return '<span class="frac-fig">' + value + right + '</span>';
    }
    const cls = mul > 1 ? 'frac-stack has-mul' : 'frac-stack';
    return '<span class="' + cls + '"><span class="frac-n">' + fig(n) + '</span><span class="frac-d">' + fig(d) + '</span></span>';
  }

  function tabsHtml(q) {
    const methods = methodsFor(q);
    if (methods.length < 2) return '';
    return '<p class="pct-hint">Tap a method to see this question another way.</p><div class="method-tabs" role="tablist">' +
      methods.map(function (id) {
        const on = id === q.method;
        return '<button type="button" class="method-tab' + (on ? ' on' : '') + '" data-method="' + id + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + METHOD_LABEL[id] + '</button>';
      }).join('') + '</div>';
  }

  function gridHtml(rows) {
    if (!rows || !rows.length) return '';
    return '<div class="pct-box"><div class="pct-grid">' + rows.map(function (row) {
      return '<span>' + row.left + '</span><span class="pct-eq">=</span><span>' + row.right + '</span>';
    }).join('') + '</div></div>';
  }

  function answerBox(text, check) {
    return '<p class="div-answer"><strong>Answer: ' + text + '</strong><span class="div-check">' + check + '</span></p>';
  }

  function render(q, stepIndex, el) {
    const pack = workingFor(q, q.method);
    let html = '<div class="pct-work">' + tabsHtml(q);
    if (pack.out) {
      html += '<p class="pct-rule">What you do to the top, you do to the bottom.</p>' +
        '<div class="frac-board of-line pct-frac">' + stack(q.n, q.d, q.mul) +
        '<span class="frac-op">=</span>' + stack(q.n * q.mul, 100, 0) +
        '<span class="frac-op">=</span><span class="frac-res">' + q.percent + '%</span></div>';
    } else if (pack.mul) {
      html += '<p class="pct-lead">' + q.pct + '% = ' + decText(q.pct) + '</p><div class="pct-mul"></div>';
      const dp = (decText(q.pct).split('.')[1] || '').length;
      const fixed = Number(q.answer).toFixed(dp);
      if (fixed !== num(q.answer)) {
        html += '<p class="pct-final">' + fixed + ' = ' + num(q.answer) + '</p>';
        html += '<p class="pct-note">The zero on the end isn\u2019t needed.</p>';
      }
    } else if (pack.discount) {
      html += '<p class="pct-kicker">Step 1: find the discount.</p>' + gridHtml(pack.rows) +
        (pack.sum ? '<p class="pct-line">' + pack.sum + '</p>' : '') +
        '<p class="pct-kicker">Step 2: take it off the price.</p>' +
        '<p class="pct-final">' + pack.final + '</p>' +
        '<p class="pct-note">' + pack.note + '</p>';
    } else {
      if (pack.rule && (q.pct === 50 || q.pct === 25 || q.pct === 10 || q.pct === 5 || q.pct === 1)) {
        html += '<p class="pct-rule">' + pack.rule + '</p>';
      }
      html += gridHtml(pack.rows);
      if (pack.final) html += '<p class="pct-final">' + pack.final + '</p>';
    }
    const check = q.kind === 'of' && q.method === 'decimal' ? estimateCheck(q) : (q.kind === 'of' ? halfCheck(q) : q.check);
    html += answerBox(q.answerText, check) + '</div>';
    el.innerHTML = html;
    if (pack.mul) {
      const holder = el.querySelector('.pct-mul');
      const mulQ = q.mulQ;
      const full = q.view && q.view.reveal;
      if (full) {
        mulQ.view = { reveal: true, walking: false, step: mulQ.steps.length - 1, col: -1 };
        EM.topics.mul.render(mulQ, mulQ.steps.length - 1, holder);
      } else {
        const idx = stepIndex < 0 ? 0 : stepIndex;
        mulQ.view = { reveal: false, walking: true, step: idx, col: q.view ? q.view.col : -1 };
        EM.topics.mul.render(mulQ, idx, holder);
      }
    }
  }

  function applyMethod(q, method) {
    q.method = method;
    q.steps = workingFor(q, method).steps;
  }

  function makeQuestion(level, opts) {
    opts = opts || {};
    const q = opts.tricky ? trickyQ(level) : normal(level);
    q.level = level;
    q.tricky = !!opts.tricky;
    if (q.kind === 'of') q.check = halfCheck(q);
    applyMethod(q, q.kind === 'of' ? defaultMethod(q) : 'build');
    return q;
  }

  function strategy(q) {
    if (q.kind === 'discount') {
      return '<strong>Another way:</strong> ' + q.pct + '% off means you pay ' + q.pay + '%.';
    }
    if (q.kind === 'outof') {
      return '<strong>Make the denominator 100</strong><br>What you do to the top, you do to the bottom.';
    }
    if (q.method === 'decimal') {
      return '<strong>Change it to a decimal first.</strong> ' + q.pct + '% = ' + decText(q.pct);
    }
    if (q.method === 'bench') {
      return '<strong>Find the nearest easy percentage, then add or take away.</strong>';
    }
    if (q.pct === 50) return '<strong>50%: halve it.</strong>';
    if (q.pct === 25) return '<strong>25%: halve it, then halve it again.</strong>';
    if (q.pct === 10) return '<strong>10%: divide by 10</strong>';
    return '<strong>Build it up from 10%, 5% and 1%.</strong>';
  }

  function extensions(level) {
    const bank = [];
    const seen = {};
    let guard = 0;
    while (bank.length < 6 && guard < 40) {
      guard += 1;
      const q = makeQuestion(level, { tricky: guard % 2 === 0 });
      if (seen[q.equation]) continue;
      seen[q.equation] = true;
      if (q.kind === 'outof') {
        bank.push({
          type: 'Percentage',
          kind: 'number',
          expect: String(q.percent),
          hint: 'Make the denominator 100',
          p: 'Write ' + q.n + ' out of ' + q.d + ' as a percentage. Give the number only.',
          a: q.n + '/' + q.d + ' = ' + (q.n * q.mul) + '/100 = <strong>' + q.percent + '%</strong>'
        });
      } else if (q.kind === 'discount') {
        bank.push({
          type: 'Sale price',
          kind: 'number',
          expect: num(q.answer),
          hint: 'Find the discount, then take it off.',
          p: q.equation + ' Give the price in dollars.',
          a: money(q.price) + ' \u2212 ' + money(q.discount) + ' = <strong>' + q.answerText + '</strong>'
        });
      } else {
        bank.push({
          type: 'Percentage of an amount',
          kind: 'number',
          expect: q.answerText,
          hint: TIPS[level] || TIPS[2],
          p: 'What is ' + q.pct + '% of ' + q.amount + '?',
          a: q.pct + '% of ' + q.amount + ' = <strong>' + q.answerText + '</strong>'
        });
      }
    }
    return bank;
  }

  EM.registerTopic({
    id: 'pct',
    name: 'Percentages',
    homeExample: 'e.g. 48% of 75',
    section: 'fractions',
    lede: 'Pick a level. The highlighted one is where you are up to.',
    levels: [
      { id: 1, name: '50%, 25% and 10%', example: '25% of 64' },
      { id: 2, name: 'Build up', example: '35% of 80' },
      { id: 3, name: 'Near a benchmark', example: '48% of 75' },
      { id: 4, name: 'Decimal \u00d7 amount', example: '0.35 \u00d7 80' },
      { id: 5, name: 'Discounts', example: 'A $60 jumper is 15% off' },
      { id: 6, name: 'One amount as a percentage of another', example: '18 out of 25' }
    ],
    tricky: [
      { id: 'parts', tags: ['Finding 10%', 'Finding 1%', 'Adding the parts'], levels: [1, 2, 3, 5] },
      { id: 'decimal', tags: ['Decimal point'], levels: [4] },
      { id: 'hundred', tags: ['Making it out of 100'], levels: [6] }
    ],
    errorTags: ['Finding 10%', 'Finding 1%', 'Adding the parts', 'Decimal point', 'Taking off the discount', 'Making it out of 100'],
    tips: TIPS,
    hidesCloseness: true,
    cueLead: 'Tip:',
    estimateCue: function (q) { return TIPS[q.level] || ''; },
    estimate: function (q) { return { prompt: TIPS[q.level] || '', answer: q.answer }; },
    instruction: function (q) {
      if (q.level <= 3) return 'Find the percentage of the amount.';
      if (q.level === 4) return 'Work it out.';
      if (q.level === 5) return 'Find the sale price.';
      return 'Write as a percentage.';
    },
    makeQuestion: makeQuestion,
    buildSteps: function (q) { return q.steps || []; },
    render: render,
    setMethod: function (q, id) {
      if (methodsFor(q).indexOf(id) < 0) return;
      applyMethod(q, id);
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
    extensions: extensions
  });
})();
