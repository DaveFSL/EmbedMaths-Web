/* Addition topic. Column steps follow the subtraction rules:
   one column at a time, carries appear when they are made, and a column
   that calculates, writes and carries is split into one tap each. */
(function () {
  const PLACE_INT = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands'];
  const PLACE_DEC = ['tenths', 'hundredths', 'thousandths'];

  function ri(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function colName(idx, dp) {
    if (idx < dp) return PLACE_DEC[dp - 1 - idx] || 'decimal';
    return PLACE_INT[idx - dp] || 'place';
  }

  function titleCase(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  function placeTag(place) {
    if (place === 'hundreds' || place === 'thousands' || place === 'ten-thousands' || place === 'hundred-thousands') {
      return 'Hundreds / thousands';
    }
    return titleCase(place);
  }

  function digitsOf(n) {
    return String(n).split('').reverse().map(Number);
  }

  function fmtScaled(intVal, dp, showDp) {
    if (dp <= 0) return String(intVal);
    const s = String(Math.abs(intVal)).padStart(dp + 1, '0');
    const cut = s.length - dp;
    const body = s.slice(0, cut) + '.' + s.slice(cut);
    if (showDp >= dp) return body;
    return s.slice(0, cut) + '.' + s.slice(cut, cut + showDp);
  }

  function makeQ(ints, dp, dps, tricky) {
    const texts = ints.map(function (n, i) { return fmtScaled(n, dp, dps[i]); });
    const phs = dps.map(function (show) {
      const ph = [];
      for (let i = 0; i < dp - show; i++) ph.push(i);
      return ph;
    });
    const values = ints.map(function (n) { return n / Math.pow(10, dp); });
    return {
      a: values[0],
      b: values[1],
      c: values.length > 2 ? values[2] : null,
      ints: ints,
      dp: dp,
      dps: dps,
      texts: texts,
      textA: texts[0],
      textB: texts[1],
      phs: phs,
      equation: texts.join(' + '),
      sign: '+',
      op: 'addition',
      tricky: !!tricky
    };
  }

  function columnSums(ints) {
    const digs = ints.map(digitsOf);
    const L = Math.max.apply(null, digs.map(function (d) { return d.length; }));
    let carry = 0;
    let carries = 0;
    let big = 0;
    for (let i = 0; i < L; i++) {
      let sum = carry;
      digs.forEach(function (d) { if (d.length > i) sum += d[i]; });
      if (carry > 0 || sum >= 10) carries++;
      if (Math.floor(sum / 10) >= 2) big++;
      carry = Math.floor(sum / 10);
    }
    return { carries: carries, big: big, extra: carry > 0, total: ints.reduce(function (n, v) { return n + v; }, 0) };
  }

  function genPair(lenA, lenB, opts) {
    opts = opts || {};
    for (let attempt = 0; attempt < 80; attempt++) {
      const A = ri(Math.pow(10, lenA - 1), Math.pow(10, lenA) - 1);
      const B = ri(Math.pow(10, lenB - 1), Math.pow(10, lenB) - 1);
      const info = columnSums([A, B]);
      if (opts.noCarry && info.carries) continue;
      if (opts.mustCarry && !info.carries) continue;
      if (opts.noExtra && info.extra) continue;
      if (opts.mustExtra && !info.extra) continue;
      if (opts.carryCol != null) {
        const da = digitsOf(A);
        const db = digitsOf(B);
        const sum = (da[opts.carryCol] || 0) + (db[opts.carryCol] || 0);
        if (sum < 10) continue;
      }
      return [A, B];
    }
    return opts.noCarry ? [34, 21] : [48, 36];
  }

  function gen6(forceBig) {
    for (let attempt = 0; attempt < 80; attempt++) {
      const lens = [ri(2, 3), ri(2, 3), ri(2, 3)];
      if (lens[0] === lens[1] && lens[1] === lens[2] && Math.random() < 0.7) lens[2] = lens[2] === 2 ? 3 : 2;
      const ints = lens.map(function (len) { return ri(Math.pow(10, len - 1), Math.pow(10, len) - 1); });
      const info = columnSums(ints);
      if (!info.carries) continue;
      if (forceBig && !info.big) continue;
      if (!forceBig && Math.random() < 0.5 && !info.big) continue;
      return ints;
    }
    return [234, 156, 78];
  }

  function gen7(phOnFirst) {
    for (let attempt = 0; attempt < 40; attempt++) {
      const onFirst = phOnFirst || Math.random() < 0.5;
      if (onFirst) {
        const A = ri(1, 40) * 10 + ri(1, 9);
        const B = ri(1, 9) * 100 + ri(1, 9) * 10 + ri(1, 9);
        const scaledA = A * 10;
        if (columnSums([scaledA, B]).carries || Math.random() < 0.4) return { ints: [scaledA, B], dps: [1, 2] };
      } else {
        const A = ri(1, 40) * 100 + ri(1, 9) * 10 + ri(1, 9);
        const B = (ri(1, 9) * 10 + ri(1, 9)) * 10;
        if (A % 10 !== 0) return { ints: [A, B], dps: [2, 1] };
      }
    }
    return { ints: [1250, 347], dps: [1, 2] };
  }

  function normal(level) {
    if (level === 1) { const p = genPair(2, 2, { noCarry: true }); return makeQ(p, 0, [0, 0], false); }
    if (level === 2) { const p = genPair(2, 2, { mustCarry: true, noExtra: true }); return makeQ(p, 0, [0, 0], false); }
    if (level === 3) { const p = genPair(3, 3, { mustCarry: true, noExtra: true }); return makeQ(p, 0, [0, 0], false); }
    if (level === 4) {
      const form = ri(0, 2);
      const lens = form === 0 ? [2, 2] : form === 1 ? [3, 2] : [3, 3];
      const p = genPair(lens[0], lens[1], { mustExtra: true });
      return makeQ(p, 0, [0, 0], false);
    }
    if (level === 5) {
      const short = Math.random() < 0.5 ? 2 : 3;
      const p = genPair(4, short, { mustCarry: true, noExtra: true });
      return makeQ(p, 0, [0, 0], false);
    }
    if (level === 6) return makeQ(gen6(false), 0, [0, 0, 0], false);
    const p = gen7(false);
    return makeQ(p.ints, 2, p.dps, false);
  }

  function trickyQ(level) {
    if (level === 6) return makeQ(gen6(true), 0, [0, 0, 0], true);
    if (level === 7) { const p = gen7(true); return makeQ(p.ints, 2, p.dps, true); }
    if (level === 4 || level === 5) return normal(level);
    if (level === 1) { const p = genPair(2, 2, { noCarry: true }); return makeQ(p, 0, [0, 0], true); }
    const len = level === 2 ? 2 : 3;
    const p = genPair(len, len, { mustCarry: true, noExtra: true, carryCol: 0 });
    return makeQ(p, 0, [0, 0], true);
  }

  function fits(level, q) {
    const lens = q.ints.map(function (n) { return String(n).length; });
    const info = columnSums(q.ints);
    const longest = Math.max.apply(null, lens);
    if (level === 1) return lens.length === 2 && lens[0] === 2 && lens[1] === 2 && !info.carries;
    if (level === 2) return lens[0] === 2 && lens[1] === 2 && info.carries > 0 && !info.extra;
    if (level === 3) return lens[0] === 3 && lens[1] === 3 && info.carries > 0 && !info.extra;
    if (level === 4) return info.extra && String(info.total).length === longest + 1;
    if (level === 5) return longest === 4 && Math.min.apply(null, lens) < 4 && info.carries > 0 && !info.extra;
    if (level === 6) return q.ints.length === 3 && info.carries > 0 && lens.every(function (n) { return n === 2 || n === 3; });
    if (level === 7) return q.dp === 2 && q.dps[0] !== q.dps[1] && q.phs.some(function (ph) { return ph.length > 0; });
    return false;
  }

  function buildWorking(q) {
    const dp = q.dp;
    const digs = q.ints.map(digitsOf);
    const L = Math.max.apply(null, digs.map(function (d) { return d.length; }));
    const carries = [];
    const used = [];
    const results = [];
    const steps = [];
    let carry = 0;

    function snap(extra) {
      return {
        carries: carries.slice(),
        used: used.slice(),
        results: results.slice(),
        col: extra.col,
        hiCols: extra.hiCols || [extra.col],
        readyText: extra.text,
        chip: extra.chip,
        tags: extra.tags || [],
        dp: dp
      };
    }

    for (let i = 0; i < L; i++) {
      const present = digs.map(function (d) { return d.length > i ? d[i] : null; });
      const vals = present.filter(function (v) { return v !== null; });
      const incoming = carry;
      const sum = vals.reduce(function (n, v) { return n + v; }, 0) + incoming;
      const write = sum % 10;
      const nc = Math.floor(sum / 10);
      const place = colName(i, dp);
      const tag = placeTag(place);
      const missing = present.some(function (v) { return v === null; });
      if (vals.length === 1 && incoming === 0 && nc === 0 && missing) {
        results[i] = write;
        steps.push(snap({ col: i, chip: tag, text: titleCase(place) + ': Nothing to add, so write ' + write + '.' }));
        continue;
      }
      let calc = titleCase(place) + ': ' + vals.join(' + ');
      if (incoming > 0) calc += ' + the ' + incoming + ' carried';
      calc += ' = ' + sum + '.';
      if (incoming > 0) used[i] = true;
      results[i] = write;
      carry = nc;
      const tags = [];
      if (nc > 0) {
        carries[i + 1] = nc;
        tags.push('Carrying');
        if (i === L - 1) {
          results[i + 1] = nc;
          used[i + 1] = true;
          calc += ' Write ' + sum + '.';
        } else {
          calc += ' Write ' + write + ', carry ' + nc + '.';
        }
      } else {
        calc += ' Write ' + write + '.';
      }
      steps.push(snap({ col: i, chip: tag, tags: tags, hiCols: nc && i === L - 1 ? [i, i + 1] : [i], text: calc }));
    }
    return { steps: steps, total: q.ints.reduce(function (n, v) { return n + v; }, 0) };
  }

  function buildSteps(q) {
    const ui = [];
    q.phs.forEach(function (ph, row) {
      if (!ph.length) return;
      const padded = fmtScaled(q.ints[row], q.dp, q.dp);
      ui.push({
        title: 'Line up the places',
        text: q.texts[row] + ' has no hundredths. Write a placeholder 0 to make ' + padded + ', and keep the decimal points in a line.',
        stepTag: null,
        kind: 'lineup',
        algo: null,
        hiCols: []
      });
    });
    const raw = buildWorking(q);
    const answerText = q.dp ? (raw.total / Math.pow(10, q.dp)).toFixed(q.dp) : String(raw.total);
    raw.steps.forEach(function (s, idx) {
      let text = s.readyText;
      if (idx === raw.steps.length - 1) text += ' Answer ' + answerText + '.';
      ui.push({
        title: titleCase(colName(s.col, q.dp)),
        text: text,
        stepTag: s.chip,
        tags: s.tags,
        kind: 'calc',
        algo: s,
        hiCols: s.hiCols
      });
    });
    q.answer = raw.total / Math.pow(10, q.dp);
    return ui;
  }

  function renderAlgo(q, step) {
    const dp = q.dp;
    const snap = step && step.algo ? step.algo : null;
    const lengths = q.ints.map(function (n) { return String(n).length; });
    let cols = Math.max.apply(null, lengths.concat([dp + 1]));
    if (snap && snap.results && snap.results.length > cols) cols = snap.results.length;
    const dotAfter = dp > 0 ? cols - dp - 1 : -1;
    const hi = {};
    const hiCols = (step && step.hiCols) || (snap && snap.hiCols) || [];
    hiCols.forEach(function (c) { hi[c] = true; });

    function cells(rowKind, rowIndex) {
      let html = '<div class="algo-row"><div class="dc ' + (rowKind === 'op' ? 'op' : 'spacer') + '">' + (rowKind === 'op' ? '+' : '') + '</div>';
      for (let ci = 0; ci < cols; ci++) {
        const fromRight = cols - 1 - ci;
        const active = hi[fromRight] ? ' on' : '';
        if (rowKind === 'carry') {
          const c = snap && snap.carries ? snap.carries[fromRight] : null;
          const used = snap && snap.used && snap.used[fromRight];
          html += '<div class="dc' + active + '">' + (c ? '<span class="carry' + (used ? ' used' : '') + '">' + c + '</span>' : '') + '</div>';
        } else if (rowKind === 'add' || rowKind === 'op') {
          const digs = digitsOf(q.ints[rowIndex]);
          const ph = q.phs[rowIndex] || [];
          const missing = fromRight >= digs.length && ph.indexOf(fromRight) === -1;
          const ch = missing ? '' : String(digs[fromRight] || 0);
          const isPh = ph.indexOf(fromRight) !== -1;
          html += '<div class="dc' + active + '"><span class="d' + (isPh ? ' ph' : '') + '">' + ch + '</span></div>';
        } else {
          const rv = snap && snap.results ? snap.results[fromRight] : null;
          const shown = rv !== null && rv !== undefined;
          html += '<div class="dc' + active + '"><span class="d' + (shown ? ' res' : '') + '">' + (shown ? rv : '') + '</span></div>';
        }
        if (dp > 0 && ci === dotAfter && rowKind !== 'carry') html += '<div class="dc dot">.</div>';
      }
      html += '</div>';
      return html;
    }

    let html = '<div class="algo-grid-wrap">' + cells('carry');
    q.ints.forEach(function (_, row) {
      html += cells(row === q.ints.length - 1 ? 'op' : 'add', row);
    });
    const any = snap && snap.results && snap.results.some(function (v) { return v !== null && v !== undefined; });
    html += '<div class="algo-row sep-row"><div class="dc spacer"></div>';
    for (let ci = 0; ci < cols; ci++) {
      const fromRight = cols - 1 - ci;
      const rv = snap && snap.results ? snap.results[fromRight] : null;
      const shown = rv !== null && rv !== undefined;
      html += '<div class="dc"><span class="d' + (shown ? ' res' : '') + '">' + (shown ? rv : '') + '</span></div>';
      if (dp > 0 && ci === dotAfter && any) html += '<div class="dc dot">.</div>';
    }
    html += '</div></div>';
    return html;
  }

  function estimate(q) {
    const place = q.dp > 0 ? 1 : (Math.max(q.a, q.b) >= 1000 ? 100 : 10);
    const parts = [q.a, q.b].concat(q.c == null ? [] : [q.c]).map(function (n) { return Math.round(n / place) * place; });
    return { prompt: parts.join(' + '), answer: parts.reduce(function (n, v) { return n + v; }, 0) };
  }

  function strategy(q) {
    if (q.c != null) {
      return '<strong>Add two first.</strong> ' + q.textA + ' + ' + q.textB + ' = ' + (q.a + q.b) +
        ', then add ' + q.texts[2] + ' = <strong>' + (q.a + q.b + q.c) + '</strong>';
    }
    if (q.dp > 0) {
      return '<strong>Line up the decimal points.</strong> ' + q.equation + ' = <strong>' + q.answer.toFixed(q.dp) + '</strong>';
    }
    const units = q.a >= 1000 ? [1000, 100, 10] : [100, 10];
    for (let tweak = 1; tweak <= 5; tweak++) {
      for (let sign = 1; sign >= -1; sign -= 2) {
        const b2 = q.b + sign * tweak;
        const sum = q.a + b2;
        const unit = units.filter(function (u) { return sum % u === 0; })[0];
        if (!unit || b2 <= 0) continue;
        const dir = sign > 0 ? 'subtract' : 'add';
        return '<strong>Round and adjust.</strong> Change ' + q.b + ' to ' + b2 + '.<br>' +
          q.a + ' + ' + b2 + ' = ' + sum + ', then ' + dir + ' ' + tweak + ' = <strong>' + (q.a + q.b) + '</strong>';
      }
    }
    return '<strong>Add the places.</strong> ' + q.equation + ' = <strong>' + (q.a + q.b) + '</strong>';
  }

  function extBank(level) {
    const q = normal(level);
    const af = q.textA;
    const bf = q.textB;
    const sum = q.ints.reduce(function (n, v) { return n + v; }, 0) / Math.pow(10, q.dp);
    const sumF = q.dp ? sum.toFixed(q.dp) : String(sum);
    const half = q.dp ? (sum / 2).toFixed(q.dp) : String(Math.round(sum / 2));
    const items = [
      { type: 'Word problem', kind: 'number', expect: sumF, hint: 'Add the two amounts.', p: 'A class collected $' + af + ' and then $' + bf + '. How much altogether?', a: af + ' + ' + bf + ' = <strong>' + sumF + '</strong>' },
      { type: 'Missing number', kind: 'number', expect: af, hint: 'The missing number is the one you start with.', p: 'Find the missing number:<br><strong>___ + ' + bf + ' = ' + sumF + '</strong>', a: 'Missing number = <strong>' + af + '</strong>' },
      { type: 'Missing number', kind: 'number', expect: bf, hint: 'The missing number is the one you add.', p: 'Find the missing number:<br><strong>' + af + ' + ___ = ' + sumF + '</strong>', a: 'Missing number = <strong>' + bf + '</strong>' },
      { type: 'True or False', kind: 'tf', expect: 'true', hint: 'Add the numbers, then compare.', p: 'True or False?<br><strong>' + af + ' + ' + bf + ' = ' + bf + ' + ' + af + '</strong>', a: '<strong>True</strong> — the order of the numbers does not change the total.' },
      { type: 'True or False', kind: 'tf', expect: 'true', hint: 'Add first. Taking away the same amount undoes the add.', p: 'True or False?<br><strong>(' + af + ' + ' + bf + ') − ' + bf + ' = ' + af + '</strong>', a: af + ' + ' + bf + ' = ' + sumF + ', then subtract ' + bf + ' = ' + af + '. <strong>True</strong>' },
      { type: 'Multi-step', kind: 'number', expect: half, hint: 'Add first, then find half. Do not halve before you add.', p: 'Add ' + af + ' and ' + bf + ', then find half of the total.', a: af + ' + ' + bf + ' = ' + sumF + '. Half is <strong>' + half + '</strong>' },
      { type: 'Estimation', kind: 'tf', expect: 'false', hint: 'Round each number and add. Compare that with the claim.', p: 'A student says ' + af + ' + ' + bf + ' = ' + (q.dp ? (sum * 1.5).toFixed(q.dp) : String(Math.round(sum * 1.5))) + '. Is this reasonable?', a: 'The total is <strong>' + sumF + '</strong>. That claim is too big, so it is not reasonable.' },
      { type: 'Word problem', kind: 'number', expect: sumF, hint: 'Add the two distances.', p: 'A walk is ' + af + ' km, then another ' + bf + ' km. How far is the whole walk?', a: af + ' + ' + bf + ' = <strong>' + sumF + ' km</strong>' }
    ];
    return items;
  }

  const TIPS = {
    'Carrying': 'When a column makes 10 or more, write the ones digit and carry the tens digit to the next column.',
    'Ones': 'Start at the ones. Finish writing that digit, and the carry, before you move left.',
    'Tens': 'Add the carry from the ones as well as the tens digits.',
    'Hundreds / thousands': 'A final carry becomes a new digit on the left. Do not leave it off the answer.',
    'Tenths': 'Keep the decimal points in a line, then add the tenths in that column.',
    'Hundredths': 'If one number has fewer decimal places, write a placeholder 0 so the hundredths line up.'
  };

  EM.registerTopic({
    id: 'add',
    name: 'Addition',
    section: 'written',
    levels: [
      { id: 1, name: '2-digit, no carrying', example: '34 + 21' },
      { id: 2, name: '2-digit with carrying', example: '48 + 36' },
      { id: 3, name: '3-digit with carrying', example: '276 + 148' },
      { id: 4, name: 'Carrying into a new column', example: '986 + 47' },
      { id: 5, name: '4-digit, different lengths', example: '3456 + 87' },
      { id: 6, name: 'Three numbers', example: '234 + 156 + 78' },
      { id: 7, name: 'Decimals, different places', example: '12.5 + 3.47' }
    ],
    tricky: [
      { id: 'carry-both', tags: ['Carrying', 'Ones'], levels: [2, 3] },
      { id: 'new-column', tags: ['Hundreds / thousands'], levels: [4, 5] },
      { id: 'carry-two', tags: ['Carrying'], levels: [6] },
      { id: 'placeholder', tags: ['Hundredths'], levels: [7] }
    ],
    errorTags: ['Carrying', 'Ones', 'Tens', 'Hundreds / thousands', 'Tenths', 'Hundredths'],
    tips: TIPS,
    makeQuestion: function (level, opts) {
      opts = opts || {};
      for (let i = 0; i < 40; i++) {
        const q = opts.tricky ? trickyQ(level) : normal(level);
        if (!fits(level, q)) continue;
        q.level = level;
        q.tricky = !!opts.tricky;
        q.steps = buildSteps(q);
        return q;
      }
      const q = normal(level);
      q.level = level;
      q.tricky = !!opts.tricky;
      q.steps = buildSteps(q);
      return q;
    },
    estimate: estimate,
    buildSteps: function (q) { return q.steps || buildSteps(q); },
    render: function (q, stepIndex, el) {
      const steps = q.steps || [];
      const shown = stepIndex >= 0 ? steps[stepIndex] : null;
      el.innerHTML = renderAlgo(q, shown);
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
