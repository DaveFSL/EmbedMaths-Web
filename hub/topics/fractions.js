/* Fractions. Stacked fractions, Dave's wording, multiples lists for a common denominator. */
const FractionsTopic = (function () {
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(list) { return list[ri(0, list.length - 1)]; }

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a || 1;
  }
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function lcmAll(list) {
    return list.reduce(function (n, d) { return lcm(n, d); }, 1);
  }
  function simplify(n, d) {
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
  }
  function toMixed(n, d) {
    const s = simplify(n, d);
    const whole = Math.floor(s.n / s.d);
    return { whole: whole, n: s.n % s.d, d: s.d };
  }
  function sameMix(a, b) {
    return a.whole === b.whole && a.n === b.n && a.d === b.d;
  }
  function improper(piece) {
    return piece.whole * piece.d + piece.n;
  }
  function valueOf(piece) {
    return improper(piece) / piece.d;
  }

  function frac(n, d) {
    return '<span class="frac"><span class="frac-n">' + n + '</span><span class="frac-d">' + d + '</span></span>';
  }
  function mixedHtml(piece) {
    if (!piece.n) return String(piece.whole || 0);
    const f = frac(piece.n, piece.d);
    if (!piece.whole) return f;
    return '<span class="mixed"><span class="frac-whole">' + piece.whole + '</span>' + f + '</span>';
  }
  function piece(whole, n, d) {
    const s = simplify(n, d);
    return { whole: whole || 0, n: s.n, d: s.d };
  }

  const UNIT = {
    2: ['half', 'halves'],
    3: ['third', 'thirds'],
    4: ['quarter', 'quarters'],
    5: ['fifth', 'fifths'],
    6: ['sixth', 'sixths'],
    7: ['seventh', 'sevenths'],
    8: ['eighth', 'eighths'],
    9: ['ninth', 'ninths'],
    10: ['tenth', 'tenths'],
    11: ['eleventh', 'elevenths'],
    12: ['twelfth', 'twelfths'],
    14: ['fourteenth', 'fourteenths'],
    15: ['fifteenth', 'fifteenths'],
    18: ['eighteenth', 'eighteenths'],
    20: ['twentieth', 'twentieths'],
    21: ['twenty-first', 'twenty-firsts'],
    24: ['twenty-fourth', 'twenty-fourths'],
    28: ['twenty-eighth', 'twenty-eighths'],
    30: ['thirtieth', 'thirtieths'],
    35: ['thirty-fifth', 'thirty-fifths'],
    36: ['thirty-sixth', 'thirty-sixths'],
    40: ['fortieth', 'fortieths'],
    45: ['forty-fifth', 'forty-fifths'],
    56: ['fifty-sixth', 'fifty-sixths'],
    60: ['sixtieth', 'sixtieths'],
    63: ['sixty-third', 'sixty-thirds'],
    70: ['seventieth', 'seventieths'],
    72: ['seventy-second', 'seventy-seconds'],
    90: ['ninetieth', 'ninetieths'],
    100: ['hundredth', 'hundredths']
  };
  function unitName(d, count) {
    const pair = UNIT[d] || [d + 'th', d + 'ths'];
    return count === 1 ? pair[0] : pair[1];
  }

  function teach(title, text, tag) {
    return { kind: 'teach', title: title, text: text, stepTag: tag, tags: [tag] };
  }

  function stack(n, d, opt) {
    opt = opt || {};
    function fig(value, side) {
      const left = side ? '<sup class="frac-side">' + side + '</sup>' : '';
      const right = opt.mul > 1 ? '<sup class="frac-mul">\u00d7' + opt.mul + '</sup>' : '';
      return '<span class="frac-fig">' + left + value + right + '</span>';
    }
    return '<span class="frac-stack"><span class="frac-n">' + fig(n, opt.top) + '</span><span class="frac-d">' + fig(d, opt.bottom) + '</span></span>';
  }
  function col(part, opt) {
    if (!part) return '<span class="frac-col"></span>';
    if (!part.n && part.whole) return '<span class="frac-col"><span class="frac-whole">' + part.whole + '</span></span>';
    const whole = part.whole ? '<span class="frac-whole">' + part.whole + '</span>' : '';
    return '<span class="frac-col">' + whole + stack(part.n, part.d, opt) + '</span>';
  }

  const RELATED = [[2, 4], [2, 6], [2, 8], [2, 10], [2, 12], [3, 6], [3, 9], [3, 12], [4, 8], [4, 12], [5, 10], [6, 12]];
  const UNRELATED = [[2, 3], [2, 5], [2, 7], [2, 9], [3, 4], [3, 5], [3, 7], [3, 8], [3, 10], [4, 5], [4, 7], [4, 9], [5, 6], [5, 7], [5, 8], [5, 9], [5, 12], [7, 8], [7, 9], [7, 10], [8, 9], [9, 10]];

  function proper(d) {
    const options = [];
    for (let n = 1; n < d; n++) if (gcd(n, d) === 1) options.push(n);
    return { whole: 0, n: pick(options), d: d };
  }

  function gen1(tricky) {
    if (tricky || Math.random() < 0.25) {
      const bank = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10], [1, 20], [3, 20], [7, 20], [1, 25], [2, 25], [3, 25], [4, 25]];
      const pair = pick(bank);
      const k = 100 / pair[1];
      return { n: pair[0], d: pair[1], k: k, target: 100, missing: pair[0] * k };
    }
    const d = ri(2, 6);
    const n = ri(1, d - 1);
    const g = gcd(n, d);
    const sn = n / g;
    const sd = d / g;
    const maxK = Math.floor(12 / sd);
    if (maxK < 2) return null;
    const k = tricky ? maxK : ri(2, maxK);
    return { n: sn, d: sd, k: k, target: sd * k, missing: sn * k };
  }

  function gen2(tricky) {
    const cap = tricky ? 96 : 48;
    const d = ri(6, cap);
    const n = ri(2, d - 1);
    const g = gcd(n, d);
    if (g < 2) return null;
    const sn = n / g;
    const sd = d / g;
    if (sn >= sd) return null;
    return { n: n, d: d, hcf: g, top: sn, bottom: sd };
  }

  function gen3(tricky) {
    const toMixed = Math.random() < 0.5;
    const d = ri(2, tricky ? 12 : 10);
    const whole = ri(1, tricky ? 8 : 4);
    let n = ri(1, d - 1);
    const g = gcd(n, d);
    n /= g;
    const dd = d / g;
    const imp = whole * dd + n;
    return { toMixed: toMixed, whole: whole, n: n, d: dd, imp: imp };
  }

  function gen4(tricky) {
    const d = ri(2, 12);
    let n = ri(1, d - 1);
    const g = gcd(n, d);
    n /= g;
    const dd = d / g;
    const maxK = Math.floor(120 / dd);
    const minK = tricky ? Math.max(2, Math.min(8, maxK)) : 2;
    if (maxK < minK) return null;
    const k = ri(minK, maxK);
    const amount = dd * k;
    if (amount < 4 || amount > 120) return null;
    return { n: n, d: dd, amount: amount, part: k, answer: n * k };
  }

  function genSame(tricky) {
    const d = ri(2, 12);
    const sub = Math.random() < 0.45;
    const mixed = tricky || Math.random() < 0.6;
    function one() {
      return { whole: mixed ? ri(0, tricky ? 6 : 3) : 0, n: ri(1, d - 1), d: d };
    }
    let a = one();
    let b = one();
    if (!a.whole && !b.whole && !mixed) {
      a.whole = 0;
      b.whole = 0;
    }
    if (sub) {
      if (improper(a) <= improper(b)) {
        const swap = a;
        a = b;
        b = swap;
      }
      if (improper(a) <= improper(b)) return null;
      if (tricky && a.n >= b.n) return null;
    }
    return { op: sub ? '\u2212' : '+', a: a, b: b, d: d };
  }

  function genRelated(tricky) {
    const pair = pick(RELATED);
    const sub = Math.random() < 0.4;
    const mixed = tricky || Math.random() < 0.35;
    let small = proper(pair[0], false);
    let big = proper(pair[1], false);
    if (mixed) {
      small = { whole: ri(1, 3), n: small.n, d: small.d };
      if (Math.random() < 0.5) big = { whole: ri(0, 2), n: big.n, d: big.d };
    }
    let a = small;
    let b = big;
    if (Math.random() < 0.5) { a = big; b = small; }
    if (sub && valueOf(a) <= valueOf(b)) { const s = a; a = b; b = s; }
    if (sub && valueOf(a) <= valueOf(b)) return null;
    return { op: sub ? '\u2212' : '+', a: a, b: b };
  }

  function genOrder(tricky) {
    const count = 3;
    const denoms = [];
    while (denoms.length < count) {
      const d = ri(2, 12);
      if (denoms.indexOf(d) < 0) denoms.push(d);
    }
    const common = lcmAll(denoms);
    if (denoms.some(function (d) { return common / d > 12; })) return null;
    const fracs = denoms.map(function (d) { return proper(d, tricky); });
    const values = fracs.map(valueOf);
    const uniq = {};
    values.forEach(function (v) { uniq[v] = true; });
    if (Object.keys(uniq).length < count) return null;
    return { fracs: fracs, common: common };
  }

  function genUnrelated(tricky) {
    const pair = pick(UNRELATED);
    const sub = Math.random() < 0.4;
    let a = proper(pair[0], false);
    let b = proper(pair[1], false);
    if (tricky && Math.random() < 0.7) {
      a = { whole: ri(1, 3), n: a.n, d: a.d };
    }
    if (sub && valueOf(a) <= valueOf(b)) { const s = a; a = b; b = s; }
    if (sub && valueOf(a) <= valueOf(b)) return null;
    const common = lcm(a.d, b.d);
    if (common / a.d > 12 || common / b.d > 12) return null;
    return { op: sub ? '\u2212' : '+', a: a, b: b };
  }

  function convertSentence(fromD, fromN, mul, common) {
    return fromD + ' \u00d7 ' + mul + ' = ' + common + ', so ' + fromN + ' \u00d7 ' + mul + ' = ' + (fromN * mul) + '.';
  }

  function topBottomStep(parts, common) {
    const bits = [];
    parts.forEach(function (part) {
      const mul = common / part.d;
      if (mul === 1) return;
      const fromN = improper(part);
      bits.push(convertSentence(part.d, fromN, mul, common));
    });
    if (!bits.length) return null;
    return teach('What you do to the top, you do to the bottom.', bits.join(' '), 'Top and bottom');
  }

  function commonStep(denoms, common) {
    const word = denoms.length > 2 ? 'all the lists' : 'both lists';
    return teach('Find the common denominator',
      'Use the multiples lists. The first number in ' + word + ' is ' + common + '. Write ' + common + ' as ' +
      (denoms.length > 2 ? 'the denominator for each fraction.' : 'both denominators.'),
      'Common denominator');
  }

  function mixedStep(rawWhole, rawN, rawD) {
    const wholes = Math.floor(rawN / rawD);
    const rem = rawN % rawD;
    const made = (rawWhole || 0) + wholes;
    if (!rem) {
      return teach('Change to a mixed number',
        rawN + ' ' + unitName(rawD, rawN) + ' make ' + made + (made === 1 ? ' whole.' : ' wholes.'),
        'Mixed numbers');
    }
    let text = rawD + ' ' + unitName(rawD, rawD) + ' make 1 whole, with ' + rem + ' ' + unitName(rawD, rem) + ' left';
    if (rawWhole) text += ', so that is ' + made + ' and ' + rem + ' ' + unitName(rawD, rem);
    text += ': ' + mixedHtml({ whole: made, n: rem, d: rawD }) + '.';
    return teach('Change to a mixed number', text, 'Mixed numbers');
  }

  function simplifyStep(n, d) {
    const g = gcd(n, d);
    if (g < 2) return null;
    const s = simplify(n, d);
    return teach('Simplify',
      'The highest common factor of ' + n + ' and ' + d + ' is ' + g + '. ' +
      d + ' \u00f7 ' + g + ' = ' + s.d + ', so ' + n + ' \u00f7 ' + g + ' = ' + s.n + '.',
      'Simplifying');
  }

  function steps1(q) {
    return [teach('What you do to the top, you do to the bottom.',
      q.d + ' \u00d7 ' + q.k + ' = ' + q.target + ', so ' + q.n + ' \u00d7 ' + q.k + ' = ' + q.missing + '.',
      'Top and bottom')];
  }
  function steps2(q) {
    return [
      teach('Simplify', 'The highest common factor of ' + q.n + ' and ' + q.d + ' is ' + q.hcf + '.', 'Simplifying'),
      teach('What you do to the top, you do to the bottom.',
        q.d + ' \u00f7 ' + q.hcf + ' = ' + q.bottom + ', so ' + q.n + ' \u00f7 ' + q.hcf + ' = ' + q.top + '.',
        'Top and bottom')
    ];
  }
  function steps3(q) {
    if (q.toMixed) {
      const whole = Math.floor(q.imp / q.d);
      const rem = q.imp % q.d;
      const steps = [teach('Change to a mixed number',
        q.imp + ' \u00f7 ' + q.d + ' = ' + whole + ' whole' + (whole === 1 ? '' : 's') + ', with ' + rem + ' ' + unitName(q.d, rem) + ' left: ' +
        mixedHtml({ whole: whole, n: rem, d: q.d }) + '.',
        'Mixed numbers')];
      const simple = simplifyStep(rem, q.d);
      if (simple) steps.push(simple);
      return steps;
    }
    return [teach('Change to an improper fraction',
      q.whole + ' wholes = ' + (q.whole * q.d) + ' ' + unitName(q.d, q.whole * q.d) + '. ' +
      (q.whole * q.d) + ' + ' + q.n + ' = ' + q.imp + '. Write ' + frac(q.imp, q.d) + '.',
      'Mixed numbers')];
  }
  function steps4(q) {
    return [
      teach('Divide by the bottom', q.amount + ' \u00f7 ' + q.d + ' = ' + q.part + '. Each part is ' + q.part + '.', 'Divide and times'),
      teach('Times by the top', q.part + ' \u00d7 ' + q.n + ' = ' + q.answer + '.', 'Divide and times'),
      teach('Check with the bar', q.d + ' equal parts of ' + q.part + ', ' + q.n + ' of them shaded: ' + q.answer + '.', 'Divide and times')
    ];
  }

  function shownKey(part) {
    if (!part.n) return 'w' + (part.whole || 0);
    if (!part.whole) return part.n + '/' + part.d;
    return part.whole + ' ' + part.n + '/' + part.d;
  }

  function resultRows(spec, common, sum) {
    const final = toMixed(sum, common);
    const raw = { whole: Math.floor(sum / common), n: sum % common, d: common };
    const imp = { whole: 0, n: sum, d: common };
    const rows = [];
    if (spec.a.d === spec.b.d && (spec.a.whole || spec.b.whole)) {
      rows.push(raw);
    } else {
      rows.push(imp);
      if (raw.whole && raw.n && shownKey(raw) !== shownKey(final)) rows.push(raw);
    }
    if (shownKey(rows[rows.length - 1]) !== shownKey(final)) rows.push(final);
    return rows;
  }

  function addHow(q) {
    const a = q.a;
    const b = q.b;
    if (a.d === b.d && (a.whole || b.whole)) {
      if (q.op === '\u2212' && a.n < b.n) {
        const leftW = a.whole - 1;
        let how = 'Regroup 1 whole as ' + a.d + ' ' + unitName(a.d, a.d) + '. ' +
          (a.d + a.n) + ' \u2212 ' + b.n + ' = ' + (a.d + a.n - b.n) + '.';
        if (leftW || b.whole) how += ' The wholes: ' + leftW + ' \u2212 ' + b.whole + ' = ' + (leftW - b.whole) + '.';
        return how;
      }
      if (q.op === '\u2212') {
        const wholeBit = a.whole && b.whole
          ? 'The wholes: ' + a.whole + ' \u2212 ' + b.whole + ' = ' + (a.whole - b.whole) + '. '
          : 'The whole is ' + a.whole + '. ';
        return wholeBit + a.n + ' \u2212 ' + b.n + ' = ' + (a.n - b.n) + '.';
      }
      const nSum = a.n + b.n;
      const wholeBit = a.whole && b.whole
        ? 'Add the wholes: ' + a.whole + ' + ' + b.whole + ' = ' + (a.whole + b.whole) + '. '
        : 'The whole is ' + (a.whole + b.whole) + '. ';
      let how = wholeBit + 'Add the numerators: ' + a.n + ' + ' + b.n + ' = ' + nSum + '.';
      if (nSum >= a.d) {
        const extra = Math.floor(nSum / a.d);
        const rem = nSum % a.d;
        how += ' ' + nSum + ' ' + unitName(a.d, nSum) + ' make ' + extra + ' whole' + (extra === 1 ? '' : 's');
        if (rem) how += ' and ' + rem + ' ' + unitName(a.d, rem);
        how += '.';
      }
      return how;
    }
    const sign = q.op === '\u2212' ? '\u2212' : '+';
    return q.leftNum + ' ' + sign + ' ' + q.rightNum + ' = ' + q.sumNum + '. The denominator stays ' + q.common + '.';
  }

  function improperStep(parts) {
    const bits = [];
    parts.forEach(function (part) {
      if (!part.whole) return;
      bits.push(mixedHtml(part) + ' = ' + frac(improper(part), part.d) + '.');
    });
    if (!bits.length) return null;
    return teach('Change to an improper fraction', bits.join(' '), 'Mixed numbers');
  }

  function addSteps(q) {
    const steps = [];
    const different = q.a.d !== q.b.d;
    if (different) {
      const asImp = improperStep([q.a, q.b]);
      if (asImp) steps.push(asImp);
      steps.push(commonStep([q.a.d, q.b.d].filter(function (d, i, list) { return list.indexOf(d) === i; }), q.common));
      const convert = topBottomStep([q.a, q.b], q.common);
      if (convert) steps.push(convert);
    }
    const verb = q.op === '\u2212' ? 'Subtract the numerators' : 'Add the numerators';
    steps.push(teach(verb, addHow(q), 'Adding / subtracting'));
    steps.push(teach('Write the answer', mixedHtml(q.rows[0]) + '.', 'Adding / subtracting'));
    for (let i = 1; i < q.rows.length; i++) {
      const prev = q.rows[i - 1];
      const row = q.rows[i];
      const prevImproper = !prev.whole && prev.n >= prev.d;
      if ((row.whole || !row.n) && prevImproper) steps.push(mixedStep(0, prev.n, prev.d));
      else {
        const sim = simplifyStep(prev.n, prev.d);
        if (sim) steps.push(sim);
      }
    }
    return steps;
  }

  function orderSteps(q) {
    const denoms = q.fracs.map(function (f) { return f.d; }).filter(function (d, i, list) { return list.indexOf(d) === i; });
    const steps = [commonStep(denoms, q.common)];
    const convert = topBottomStep(q.fracs, q.common);
    if (convert) steps.push(convert);
    const nums = q.fracs.map(function (f) { return f.n * (q.common / f.d); });
    steps.push(teach('Put them in order',
      'Compare the numerators: ' + nums.join(', ') + '. Smallest first: ' +
      q.ordered.map(mixedHtml).join(', ') + '.',
      'Top and bottom'));
    return steps;
  }

  function finishAdd(spec) {
    const a = spec.a;
    const b = spec.b;
    const common = lcm(a.d, b.d);
    const left = improper(a) * (common / a.d);
    const right = improper(b) * (common / b.d);
    const sum = spec.op === '\u2212' ? left - right : left + right;
    if (sum < 0) return null;
    const final = toMixed(sum, common);
    const rows = resultRows(spec, common, sum);
    return {
      kind: 'add',
      op: spec.op,
      a: a,
      b: b,
      common: common,
      leftNum: left,
      rightNum: right,
      sumNum: sum,
      rows: rows,
      final: final,
      answerValue: sum / common
    };
  }

  function question(level, raw) {
    if (!raw) return null;
    const q = raw;
    q.level = level;
    q.topicId = 'frac';
    if (level === 1) {
      q.kind = 'equivalent';
      q.equation = frac(q.n, q.d) + ' = ' + frac('?', q.target);
      q.final = { whole: 0, n: q.missing, d: q.target };
      q.answerValue = q.missing;
      q.estPrompt = q.n + ' \u00d7 ' + q.k;
      q.estAnswer = String(q.missing);
      q.steps = steps1(q);
    } else if (level === 2) {
      q.kind = 'simplify';
      q.equation = frac(q.n, q.d);
      q.final = { whole: 0, n: q.top, d: q.bottom };
      q.answerValue = q.top / q.bottom;
      q.estPrompt = q.n + ' \u00f7 ' + q.hcf;
      q.estAnswer = String(q.top);
      q.steps = steps2(q);
    } else if (level === 3) {
      q.kind = 'mixed';
      if (q.toMixed) {
        q.equation = frac(q.imp, q.d);
        const rem = q.imp % q.d;
        const g = gcd(rem, q.d);
        q.final = { whole: Math.floor(q.imp / q.d), n: rem / g, d: q.d / g };
      } else {
        q.equation = mixedHtml({ whole: q.whole, n: q.n, d: q.d });
        q.final = { whole: 0, n: q.imp, d: q.d };
      }
      q.answerValue = q.toMixed ? q.imp / q.d : q.imp / q.d;
      q.estPrompt = q.toMixed ? 'how many wholes' : 'wholes times the denominator';
      q.estAnswer = q.toMixed ? Math.floor(q.imp / q.d) : q.imp;
      q.steps = steps3(q);
    } else if (level === 4) {
      q.kind = 'amount';
      q.equation = frac(q.n, q.d) + ' of ' + q.amount;
      q.final = { whole: q.answer, n: 0, d: 1 };
      q.answerValue = q.answer;
      q.estPrompt = q.amount + ' \u00f7 ' + q.d + ', then \u00d7 ' + q.n;
      q.estAnswer = String(q.answer);
      q.steps = steps4(q);
    } else if (level === 7) {
      q.kind = 'order';
      q.equation = q.fracs.map(mixedHtml).join('<span class="frac-gap">, </span>') + ' <span class="frac-of">smallest first</span>';
      q.ordered = q.fracs.slice().sort(function (a, b) { return valueOf(a) - valueOf(b); });
      q.final = q.ordered[0];
      q.answerValue = valueOf(q.ordered[0]);
      q.estPrompt = 'the smallest fraction';
      q.estAnswer = 'smallest first';
      q.steps = orderSteps(q);
      q.lists = uniqueDenoms(q.fracs);
    } else {
      const built = finishAdd(raw);
      if (!built) return null;
      Object.keys(built).forEach(function (key) { q[key] = built[key]; });
      q.kind = 'add';
      q.equation = mixedHtml(q.a) + ' ' + q.op + ' ' + mixedHtml(q.b);
      const total = q.op === '\u2212' ? valueOf(q.a) - valueOf(q.b) : valueOf(q.a) + valueOf(q.b);
      q.estPrompt = total > 1 ? 'more than 1' : (total === 1 ? '1' : 'less than 1');
      q.estAnswer = mixedHtml(q.final);
      q.steps = addSteps(q);
      if (q.a.d !== q.b.d) q.lists = uniqueDenoms([q.a, q.b]);
    }
    q.answerText = mixedHtml(q.final);
    return q;
  }

  function uniqueDenoms(fracs) {
    const seen = {};
    const list = [];
    fracs.forEach(function (f) {
      if (seen[f.d]) return;
      seen[f.d] = true;
      list.push(f.d);
    });
    return list;
  }

  function makeLevel(level, tricky) {
    if (level === 1) return question(1, gen1(tricky));
    if (level === 2) return question(2, gen2(tricky));
    if (level === 3) return question(3, gen3(tricky));
    if (level === 4) return question(4, gen4(tricky));
    if (level === 5) return question(5, genSame(tricky));
    if (level === 6) return question(6, genRelated(tricky));
    if (level === 7) return question(7, genOrder(tricky));
    return question(8, genUnrelated(tricky));
  }

  function listOpen() {
    if (EM.session && EM.session.multiplesOpen != null) return EM.session.multiplesOpen;
    if (EM.session && EM.session.mulDefault) return true;
    return false;
  }

  function multiplesHtml(denom, common, revealed) {
    const open = listOpen();
    const label = 'Multiples of ' + denom;
    if (!open) {
      return '<button type="button" class="mult-closed" aria-expanded="false">' +
        label + ' <span aria-hidden="true">\u25bc</span></button>';
    }
    const need = common / denom;
    const rowsN = Math.max(6, need);
    let rows = '';
    for (let n = 1; n <= rowsN; n++) {
      const on = revealed && n * denom === common ? ' used' : '';
      rows += '<div class="mult-row' + on + '"><span>' + n + ' \u00d7</span><span>' + (n * denom) + '</span></div>';
    }
    return '<div class="mult-panel"><button type="button" class="mult-toggle" aria-expanded="true">' +
      label + ' <span aria-hidden="true">\u25b2</span></button>' + rows + '</div>';
  }

  function listsHtml(q, revealed) {
    return q.lists.map(function (d) { return multiplesHtml(d, q.common, revealed); }).join('');
  }

  function addBoard(q) {
    const showMul = q.a.d !== q.b.d;
    const hasWhole = !!(q.a.whole || q.b.whole);
    function opt(part) {
      if (!showMul) return null;
      const mul = q.common / part.d;
      return mul > 1 ? { mul: mul } : null;
    }
    function imp(part) { return { whole: 0, n: improper(part), d: part.d }; }
    let html = '<span class="frac-eq"></span>' + col(q.a, hasWhole ? null : opt(q.a)) +
      '<span class="frac-op">' + q.op + '</span>' + col(q.b, hasWhole ? null : opt(q.b));
    if (showMul && hasWhole) {
      html += '<span class="frac-eq">=</span>' + col(imp(q.a), opt(q.a)) + '<span class="frac-op">' + q.op + '</span>' + col(imp(q.b), opt(q.b));
    }
    if (showMul) {
      const a2 = { whole: 0, n: q.leftNum, d: q.common };
      const b2 = { whole: 0, n: q.rightNum, d: q.common };
      html += '<span class="frac-eq">=</span>' + col(a2) + '<span class="frac-op">' + q.op + '</span>' + col(b2);
    }
    q.rows.forEach(function (row) {
      html += '<span class="frac-eq">=</span>' + col(row) + '<span class="frac-op"></span><span class="frac-col"></span>';
    });
    return '<div class="frac-board">' + html + '</div>';
  }

  function orderBoard(q) {
    const top = q.fracs.map(function (f) {
      const mul = q.common / f.d;
      return col(f, mul > 1 ? { mul: mul } : null);
    }).join('');
    const bot = q.fracs.map(function (f) {
      return col({ whole: 0, n: f.n * (q.common / f.d), d: q.common });
    }).join('');
    return '<div class="frac-board order">' + top + bot + '</div>' +
      '<p class="order-line">Smallest first: ' + q.ordered.map(mixedHtml).join(', ') + '</p>';
  }

  function amountBoard(q) {
    const marked = stack(q.n, q.d, { top: '\u00d7', bottom: '\u00f7' });
    let cells = '';
    for (let i = 0; i < q.d; i++) cells += '<span' + (i < q.n ? ' class="on"' : '') + '>' + q.part + '</span>';
    const bits = [];
    for (let i = 0; i < q.n; i++) bits.push(String(q.part));
    const sum = q.n > 1 ? '<p class="bar-sum">' + bits.join(' + ') + ' = <span class="frac-res">' + q.answer + '</span></p>' : '';
    const word = q.n === 1 ? 'part' : 'parts';
    return '<div class="frac-board of-line">' + marked + '<span class="frac-of">of</span><span class="frac-amt">' + q.amount + '</span></div>' +
      '<p class="frac-calc"><span>' + q.amount + ' \u00f7 ' + q.d + ' = ' + q.part + '</span><span>' + q.part + ' \u00d7 ' + q.n + ' = <span class="frac-res">' + q.answer + '</span></span></p>' +
      '<div class="bar-model"><p class="bar-cap"><span>' + q.amount + ' shared into ' + q.d + ' equal parts</span><span>' + q.n + ' ' + word + ' shaded</span></p>' +
      '<div class="bar">' + cells + '</div>' + sum + '</div>';
  }

  function otherBoard(q) {
    if (q.kind === 'equivalent') {
      return '<div class="frac-board of-line">' + stack(q.n, q.d, { mul: q.k }) +
        '<span class="frac-op">=</span>' + stack(q.missing, q.target) + '</div>';
    }
    if (q.kind === 'simplify') {
      return '<div class="frac-board of-line">' + stack(q.n, q.d) +
        '<span class="frac-op">=</span>' + stack(q.top, q.bottom) + '</div>';
    }
    if (q.toMixed) {
      const whole = Math.floor(q.imp / q.d);
      const rem = q.imp % q.d;
      const raw = { whole: whole, n: rem, d: q.d };
      let html = stack(q.imp, q.d) + '<span class="frac-op">=</span>' + col(raw);
      if (shownKey(raw) !== shownKey(q.final)) html += '<span class="frac-op">=</span>' + col(q.final);
      return '<div class="frac-board of-line">' + html + '</div>';
    }
    return '<div class="frac-board of-line">' + col({ whole: q.whole, n: q.n, d: q.d }) +
      '<span class="frac-op">=</span>' + stack(q.imp, q.d) + '</div>';
  }

  function checkLine(q) {
    if (q.kind === 'amount') {
      const half = q.amount / 2;
      const side = q.answer === half ? 'half' : (q.answer > half ? 'more than half' : 'less than half');
      return 'Check: ' + q.answer + ' is ' + side + ' of ' + q.amount + '\u00a0\u2713';
    }
    if (q.kind === 'order') {
      return 'Check: same denominator ' + q.common + ', then compare the numerators\u00a0\u2713';
    }
    if (q.kind === 'equivalent') return 'Check: ' + q.d + ' \u00d7 ' + q.k + ' = ' + q.target + '\u00a0\u2713';
    if (q.kind === 'simplify') return 'Check: ' + q.hcf + ' \u00d7 ' + q.top + ' = ' + q.n + ' and ' + q.hcf + ' \u00d7 ' + q.bottom + ' = ' + q.d + '\u00a0\u2713';
    return 'Check: ' + q.answerText + ' is in its simplest form\u00a0\u2713';
  }

  function working(q) {
    let board = '';
    if (q.kind === 'add') board = addBoard(q);
    else if (q.kind === 'order') board = orderBoard(q);
    else if (q.kind === 'amount') board = amountBoard(q);
    else board = otherBoard(q);
    const answer = '<p class="div-answer"><strong>Answer: ' + q.answerText + '</strong><span class="div-check">' + checkLine(q) + '</span></p>';
    return board + answer;
  }

  function render(q, stepIndex, el) {
    const revealed = q.view && (q.view.reveal || q.view.walking || (q.view.step != null && q.view.step >= 0 && stepIndex >= 0));
    if (!revealed) {
      el.innerHTML = q.lists ? '<div class="mult-wrap multi">' + listsHtml(q, false) + '</div>' : '';
      return;
    }
    const work = working(q);
    if (!q.lists) {
      el.innerHTML = work;
      return;
    }
    el.innerHTML = '<div class="div-layout has-lists"><div class="div-work">' + work + '</div><div class="mult-wrap multi">' +
      listsHtml(q, true) + '</div></div>';
  }

  function extAmount() {
    const d = ri(2, 12);
    let n = ri(1, d - 1);
    const g = gcd(n, d);
    n /= g;
    const dd = d / g;
    const k = ri(2, Math.floor(1000 / dd));
    return { n: n, d: dd, amount: dd * k, answer: n * k };
  }

  function typed(part) {
    if (!part.n) return String(part.whole || 0);
    if (!part.whole) return part.n + '/' + part.d;
    return part.whole + ' ' + part.n + '/' + part.d;
  }

  function extensions() {
    const of = extAmount();
    const add = question(8, genUnrelated(false)) || question(8, { op: '+', a: { whole: 0, n: 3, d: 4 }, b: { whole: 0, n: 2, d: 3 } });
    return [
      { type: 'Fraction of an amount', kind: 'number', expect: String(of.answer), hint: 'Divide by the bottom, times by the top.', p: 'What is ' + frac(of.n, of.d) + ' of ' + of.amount + '?', a: of.amount + ' \u00f7 ' + of.d + ' = ' + (of.amount / of.d) + ', then \u00d7 ' + of.n + ' = <strong>' + of.answer + '</strong>' },
      { type: 'Word problem', kind: 'number', expect: String(of.answer), hint: 'The bottom is how many equal parts. The top is how many of those parts you want.', p: 'A ribbon is ' + of.amount + ' cm. You use ' + frac(of.n, of.d) + ' of it. How many centimetres do you use?', a: '<strong>' + of.answer + ' cm</strong>' },
      { type: 'Simplify', kind: 'number', expect: '3/4', hint: 'Divide the top and the bottom by the highest common factor.', p: 'Write ' + frac(18, 24) + ' in its simplest form. Type it as 3/4.', a: 'The highest common factor is 6. <strong>' + frac(3, 4) + '</strong>' },
      { type: 'Mixed number', kind: 'number', expect: '3 2/5', hint: 'How many 5s are in 17, and what is the remainder?', p: 'Write ' + frac(17, 5) + ' as a mixed number. Type it as 3 2/5.', a: '17 \u00f7 5 = 3 wholes, with 2 fifths left. <strong>3 ' + frac(2, 5) + '</strong>' },
      { type: 'Add', kind: 'number', expect: typed(add.final), hint: 'Use a common denominator. What you do to the top, you do to the bottom.', p: 'Add ' + mixedHtml(add.a) + ' and ' + mixedHtml(add.b) + '. Type a mixed number as 1 5/12.', a: 'The answer is <strong>' + mixedHtml(add.final) + '</strong>' },
      { type: 'True or false', kind: 'tf', expect: 'true', hint: 'What you do to the top, you do to the bottom.', p: 'True or false?<br>' + frac(1, 2) + ' = ' + frac(50, 100), a: '2 \u00d7 50 = 100, so 1 \u00d7 50 = 50. <strong>True</strong>' }
    ];
  }

  const TIPS = {
    'Common denominator': 'Write the multiples of each denominator. The first number in both lists is the common denominator.',
    'Top and bottom': 'What you do to the top, you do to the bottom.',
    'Adding / subtracting': 'Add or subtract the numerators. The denominator stays the same.',
    'Simplifying': 'Divide the top and the bottom by the highest common factor.',
    'Mixed numbers': 'An improper fraction is a whole number and a remainder. The remainder stays as the numerator.',
    'Divide and times': 'Divide by the bottom, times by the top.'
  };

  EM.registerTopic({
    id: 'frac',
    name: 'Fractions',
    section: 'fractions',
    showsPrep: true,
    hidesCloseness: true,
    lede: 'Fractions. Pick a level. The highlighted one is where you are up to.',
    levels: [
      { id: 1, name: 'Equivalent fractions', example: frac(3, 4) + ' = ' + frac('?', 12) },
      { id: 2, name: 'Simplifying', example: frac(18, 24) + ' \u2192 ' + frac(3, 4) },
      { id: 3, name: 'Improper and mixed numbers', example: frac(17, 5) + ' \u2192 3 ' + frac(2, 5) },
      { id: 4, name: 'Fraction of an amount', example: frac(3, 5) + ' of 45' },
      { id: 5, name: 'Same denominator', example: '2 ' + frac(3, 8) + ' + 1 ' + frac(7, 8) },
      { id: 6, name: 'Related denominators', example: frac(2, 3) + ' + ' + frac(5, 12) },
      { id: 7, name: 'Compare and order', example: frac(3, 4) + ', ' + frac(2, 3) + ', ' + frac(5, 8) },
      { id: 8, name: 'Extension: unrelated denominators', example: frac(3, 4) + ' + ' + frac(2, 3), extension: true }
    ],
    tricky: [
      { id: 'hundred', tags: ['Top and bottom'], levels: [1] },
      { id: 'hcf', tags: ['Simplifying'], levels: [2] },
      { id: 'mixed', tags: ['Mixed numbers'], levels: [3, 5] },
      { id: 'amount', tags: ['Divide and times'], levels: [4] },
      { id: 'common', tags: ['Common denominator'], levels: [6, 7, 8] }
    ],
    errorTags: ['Common denominator', 'Top and bottom', 'Adding / subtracting', 'Simplifying', 'Mixed numbers', 'Divide and times'],
    tips: TIPS,
    makeQuestion: function (level, opts) {
      opts = opts || {};
      for (let i = 0; i < 40; i++) {
        const q = makeLevel(level, !!opts.tricky);
        if (!q || !q.steps || !q.steps.length) continue;
        q.tricky = !!opts.tricky;
        return q;
      }
      const q = makeLevel(level, false) || question(8, { op: '+', a: { whole: 0, n: 3, d: 4 }, b: { whole: 0, n: 2, d: 3 } });
      q.tricky = !!opts.tricky;
      q.level = level;
      return q;
    },
    estimate: function (q) { return { prompt: q.estPrompt, answer: q.estAnswer }; },
    estimateCue: function (q) {
      if (q.kind === 'amount') return 'Estimate first: divide by the bottom, times by the top.';
      if (q.kind === 'add' || q.kind === 'order') return 'Estimate first: is the answer more than 1, or less than 1?';
      return 'Estimate first: what you do to the top, you do to the bottom.';
    },
    buildSteps: function (q) { return q.steps; },
    render: render,
    strategy: function (q) {
      if (q.kind === 'amount') return '<strong>Divide by the bottom, times by the top.</strong>';
      if (q.kind === 'add' && !q.lists) return '<strong>The denominator stays the same.</strong> Add or subtract the numerators.';
      if (q.lists) return '<strong>List the multiples.</strong> The first number in both lists is the common denominator. What you do to the top, you do to the bottom.';
      if (q.kind === 'simplify') return '<strong>Divide by the highest common factor.</strong> What you do to the top, you do to the bottom.';
      if (q.kind === 'mixed') return '<strong>Wholes and a remainder.</strong> The remainder stays on the top.';
      return '<strong>What you do to the top, you do to the bottom.</strong>';
    },
    chipsFor: function (q) {
      const used = {};
      (q.steps || []).forEach(function (s) {
        if (s.stepTag) used[s.stepTag] = true;
        (s.tags || []).forEach(function (tag) { used[tag] = true; });
      });
      return this.errorTags.filter(function (tag) { return used[tag]; });
    },
    extensions: function () { return extensions(); }
  });
})();
