/* Subtraction topic. buildSubSteps, renderAlgo and mentalStrategy are ported
   from embedmaths-addition-subtraction.html, with the section 9 fixes. */
(function () {
  const PLACE_INT = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands'];
  const PLACE_DEC = ['tenths', 'hundredths', 'thousandths'];

  function ri(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function colName(idxFromRight, dp) {
    if (idxFromRight < dp) return PLACE_DEC[dp - 1 - idxFromRight] || 'decimal';
    return PLACE_INT[idxFromRight - dp] || 'place';
  }

  function titleCase(name) {
    if (name === 'hundreds / thousands') return 'Hundreds / thousands';
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  function singular(name, n) {
    const map = {
      ones: 'one', tens: 'ten', hundreds: 'hundred', thousands: 'thousand',
      'ten-thousands': 'ten-thousand', tenths: 'tenth', hundredths: 'hundredth'
    };
    return n === 1 ? (map[name] || name) : name;
  }

  function joinAnd(parts) {
    if (parts.length <= 1) return parts[0] || '';
    if (parts.length === 2) return parts[0] + ' and ' + parts[1];
    return parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];
  }

  function fmtScaled(intVal, dp, showDp) {
    if (dp <= 0) return String(intVal);
    const s = String(Math.abs(intVal)).padStart(dp + 1, '0');
    const cut = s.length - dp;
    const intPart = s.slice(0, cut);
    if (showDp <= 0) return intPart;
    return intPart + '.' + s.slice(cut, cut + showDp);
  }

  function crossesZero(aInt, bInt) {
    const a = String(aInt).split('').map(Number);
    const b = String(bInt).padStart(a.length, '0').split('').map(Number);
    if (String(bInt).length > a.length) return false;
    const top = a.slice();
    let across = false;
    for (let i = a.length - 1; i >= 0; i--) {
      if (top[i] < b[i]) {
        let from = i - 1;
        let crossed = false;
        while (from >= 0 && top[from] === 0) {
          crossed = true;
          from--;
        }
        if (from < 0) return false;
        if (crossed) across = true;
        top[from]--;
        for (let k = from + 1; k < i; k++) top[k] = 9;
        top[i] += 10;
      }
      top[i] -= b[i];
    }
    return across;
  }

  function hasTrade(aInt, bInt) {
    const a = String(aInt).split('').map(Number);
    const b = String(bInt).padStart(a.length, '0').split('').map(Number);
    const top = a.slice();
    for (let i = a.length - 1; i >= 0; i--) {
      if (top[i] < b[i]) return true;
      top[i] -= b[i];
    }
    return false;
  }

  function makeQ(aInt, bInt, dp, dpA, dpB, tricky) {
    const textA = fmtScaled(aInt, dp, dpA);
    const textB = fmtScaled(bInt, dp, dpB);
    const phA = [];
    const phB = [];
    for (let i = 0; i < dp - dpA; i++) phA.push(i);
    for (let i = 0; i < dp - dpB; i++) phB.push(i);
    return {
      a: aInt / Math.pow(10, dp),
      b: bInt / Math.pow(10, dp),
      aInt: aInt,
      bInt: bInt,
      dp: dp,
      dpA: dpA,
      dpB: dpB,
      textA: textA,
      textB: textB,
      phA: phA,
      phB: phB,
      op: 'subtraction',
      tricky: !!tricky
    };
  }

  function noTrade(len) {
    for (let attempt = 0; attempt < 40; attempt++) {
      const a = [];
      const b = [];
      let greater = false;
      for (let i = 0; i < len; i++) {
        const da = ri(i === 0 ? 1 : 0, 9);
        const db = ri(i === 0 ? 1 : 0, da);
        a.push(da);
        b.push(db);
        if (da > db) greater = true;
      }
      if (!greater) {
        if (a[0] < 9) a[0]++;
        else if (b[0] > 1) b[0]--;
      }
      const A = a.reduce(function (n, d) { return n * 10 + d; }, 0);
      const B = b.reduce(function (n, d) { return n * 10 + d; }, 0);
      if (A > B && !hasTrade(A, B) && String(A).length === len && String(B).length === len) {
        return [A, B];
      }
    }
    return len === 2 ? [87, 34] : [586, 243];
  }

  function withTrade(len) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const a = [];
      const b = [];
      for (let i = 0; i < len; i++) {
        a.push(ri(i === 0 ? 2 : 1, 9));
        b.push(ri(i === 0 ? 1 : 0, 9));
      }
      const col = ri(1, len - 1);
      b[col] = ri(2, 9);
      a[col] = ri(0, b[col] - 1);
      if (a[col - 1] < 1) a[col - 1] = ri(2, 9);
      const A = a.reduce(function (n, d) { return n * 10 + d; }, 0);
      const B = b.reduce(function (n, d) { return n * 10 + d; }, 0);
      if (A > B && hasTrade(A, B) && !crossesZero(A, B) && String(A).length === len && String(B).length === len) {
        return [A, B];
      }
    }
    return len === 2 ? [82, 47] : len === 3 ? [624, 258] : [7257, 1455];
  }

  function digitZeros(n) {
    return String(n).split('').filter(function (d) { return d === '0'; }).length;
  }

  function countTrades(aInt, bInt) {
    const a = String(aInt).split('').map(Number);
    const b = String(bInt).padStart(a.length, '0').split('').map(Number);
    const top = a.slice();
    let n = 0;
    let nonZero = 0;
    for (let i = a.length - 1; i >= 0; i--) {
      if (top[i] < b[i]) {
        n++;
        if (top[i] !== 0) nonZero++;
        let from = i - 1;
        while (from >= 0 && top[from] === 0) from--;
        if (from < 0) return { n: 0, nonZero: 0 };
        top[from]--;
        for (let k = from + 1; k < i; k++) top[k] = 9;
        top[i] += 10;
      }
      top[i] -= b[i];
    }
    return { n: n, nonZero: nonZero };
  }

  function gen6() {
    const roll = Math.random();
    const kind = roll < 0.4 ? 1 : roll < 0.7 ? 2 : roll < 0.85 ? 3 : 0;
    for (let attempt = 0; attempt < 80; attempt++) {
      const thou = ri(2, 9);
      let hun = ri(1, 9);
      let tens = ri(1, 9);
      let ones = ri(1, 9);
      if (kind === 3) {
        hun = 0; tens = 0; ones = 0;
      } else if (kind === 2) {
        const shape = ri(0, 2);
        hun = shape === 2 ? ri(1, 8) : 0;
        tens = shape === 1 ? ri(1, 8) : 0;
        ones = shape === 0 ? ri(1, 8) : 0;
      } else if (kind === 1) {
        const slot = ri(0, 2);
        hun = slot === 0 ? 0 : ri(1, 9);
        tens = slot === 1 ? 0 : ri(1, 8);
        ones = slot === 2 ? 0 : ri(1, 8);
      } else {
        hun = ri(1, 8); tens = ri(1, 8); ones = ri(1, 8);
      }
      const A = thou * 1000 + hun * 100 + tens * 10 + ones;
      const bThou = ri(1, thou - 1);
      let bHun = ri(0, 9);
      let bTens = ri(0, 9);
      let bOnes = ri(0, 9);
      if (kind === 0) {
        bOnes = ri(ones + 1, 9);
        bTens = ri(tens + 1, 9);
        bHun = ri(0, hun);
      } else if (kind === 3) {
        bOnes = ri(1, 9);
        bHun = ri(1, 9);
      } else if (ones === 0 && tens > 0) {
        bOnes = ri(1, 9);
        bTens = ri(tens + 1, 9);
      } else if (tens === 0 && ones > 0) {
        bOnes = ri(ones + 1, 9);
      } else if (hun === 0 && tens > 0) {
        bTens = ri(tens + 1, 9);
      } else if (ones === 0) {
        bOnes = ri(1, 9);
      }
      const B = bThou * 1000 + bHun * 100 + bTens * 10 + bOnes;
      if (A - B < 100 || String(A).length !== 4 || String(B).length !== 4) continue;
      if (digitZeros(A) !== kind) continue;
      const trades = countTrades(A, B);
      if (trades.n < 1) continue;
      if (kind === 0 && trades.n < 2) continue;
      if (kind === 1 && (trades.nonZero < 1 || !crossesZero(A, B))) continue;
      if (kind >= 2 && !crossesZero(A, B)) continue;
      return [A, B];
    }
    return [4003, 1257];
  }

  function gen7() {
    const roll = Math.random();
    const aLen = roll < 0.75 ? 4 : 3;
    const bLen = roll < 0.5 ? 2 : (aLen === 4 ? 3 : 2);
    const A = ri(Math.pow(10, aLen - 1), Math.pow(10, aLen) - 1);
    const B = ri(Math.pow(10, bLen - 1), Math.min(A - 1, Math.pow(10, bLen) - 1));
    if (A > B && String(A).length !== String(B).length) return [A, B];
    return [3456, 87];
  }

  function gen8(forceTrade) {
    for (let attempt = 0; attempt < 40; attempt++) {
      const dp = Math.random() < 0.5 ? 1 : 2;
      const scale = Math.pow(10, dp);
      const aInt = ri(10, 90);
      let bInt = ri(10, aInt);
      let aDec = ri(1, scale - 1);
      let bDec = ri(1, scale - 1);
      if (forceTrade || Math.random() < 0.65) {
        const aLast = aDec % 10;
        const low = aLast === 9 ? 8 : aLast;
        if (aLast === 9) aDec = aDec - 1;
        bDec = Math.floor(bDec / 10) * 10 + ri((aDec % 10) + 1, 9);
      }
      const A = aInt * scale + aDec;
      const B = bInt * scale + bDec;
      if (A > B && aDec % 10 !== 0 && bDec % 10 !== 0) return { A: A, B: B, dp: dp };
    }
    return { A: 346, B: 129, dp: 1 };
  }

  function gen9(placeholderOnTop) {
    const onTop = placeholderOnTop || Math.random() < 2 / 3;
    for (let attempt = 0; attempt < 40; attempt++) {
      if (onTop) {
        const intPart = ri(4, 40);
        const tenths = ri(1, 9);
        const A = (intPart * 10 + tenths) * 10;
        let B = ri(100, A - 1);
        if (B % 10 === 0) B += ri(1, 9);
        if (B < A && B % 10 !== 0 && String(A).length >= 3) {
          return { A: A, B: B, dpA: 1, dpB: 2 };
        }
      } else {
        const intPart = ri(4, 40);
        const tenths = ri(1, 9);
        const hund = ri(1, 9);
        const A = intPart * 100 + tenths * 10 + hund;
        const bInt = ri(1, intPart);
        const bTenths = ri(1, 9);
        const B = (bInt * 10 + bTenths) * 10;
        if (A > B && B % 10 === 0) return { A: A, B: B, dpA: 2, dpB: 1 };
      }
    }
    return { A: 1250, B: 347, dpA: 1, dpB: 2 };
  }

  function normal(level) {
    if (level === 1) { const p = noTrade(2); return makeQ(p[0], p[1], 0, 0, 0, false); }
    if (level === 2) { const p = withTrade(2); return makeQ(p[0], p[1], 0, 0, 0, false); }
    if (level === 3) { const p = noTrade(3); return makeQ(p[0], p[1], 0, 0, 0, false); }
    if (level === 4) { const p = withTrade(3); return makeQ(p[0], p[1], 0, 0, 0, false); }
    if (level === 5) { const p = withTrade(4); return makeQ(p[0], p[1], 0, 0, 0, false); }
    if (level === 6) { const p = gen6(false); return makeQ(p[0], p[1], 0, 0, 0, false); }
    if (level === 7) { const p = gen7(); return makeQ(p[0], p[1], 0, 0, 0, false); }
    if (level === 8) { const p = gen8(false); return makeQ(p.A, p.B, p.dp, p.dp, p.dp, false); }
    const p = gen9(false);
    return makeQ(p.A, p.B, 2, p.dpA, p.dpB, false);
  }

  function trickyQ(level, focus) {
    if (level === 6 || focus === 'Trading') {
      if (level === 6) { const p = gen6(); return makeQ(p[0], p[1], 0, 0, 0, true); }
    }
    if (level === 7) { const p = [ri(1000, 9999), ri(10, 99)]; return makeQ(p[0], p[1], 0, 0, 0, true); }
    if (level === 9 || focus === 'Hundredths' || focus === 'Tenths') {
      if (level === 9) { const p = gen9(true); return makeQ(p.A, p.B, 2, p.dpA, p.dpB, true); }
    }
    if (level === 1 || level === 3) {
      const len = level === 1 ? 2 : 3;
      const p = noTrade(len);
      return makeQ(p[0], p[1], 0, 0, 0, true);
    }
    if (level === 8) {
      const p = gen8(true);
      return makeQ(p.A, p.B, p.dp, p.dp, p.dp, true);
    }
    const len = level === 2 ? 2 : level === 4 ? 3 : 4;
    const p = withTrade(len);
    return makeQ(p[0], p[1], 0, 0, 0, true);
  }

  function fits(level, q) {
    const sameLen = String(q.aInt).length === String(q.bInt).length;
    if (q.aInt <= q.bInt) return false;
    if (level === 1) return sameLen && String(q.aInt).length === 2 && !hasTrade(q.aInt, q.bInt);
    if (level === 2) return sameLen && String(q.aInt).length === 2 && hasTrade(q.aInt, q.bInt) && !crossesZero(q.aInt, q.bInt);
    if (level === 3) return sameLen && String(q.aInt).length === 3 && !hasTrade(q.aInt, q.bInt);
    if (level === 4) return sameLen && String(q.aInt).length === 3 && hasTrade(q.aInt, q.bInt) && !crossesZero(q.aInt, q.bInt);
    if (level === 5) return sameLen && String(q.aInt).length === 4 && hasTrade(q.aInt, q.bInt) && !crossesZero(q.aInt, q.bInt);
    if (level === 6) return sameLen && String(q.aInt).length === 4 && hasTrade(q.aInt, q.bInt) && q.aInt - q.bInt >= 100;
    if (level === 7) return q.dp === 0 && String(q.aInt).length !== String(q.bInt).length;
    if (level === 8) return q.dpA === q.dpB && q.dpA > 0 && q.textA.indexOf('.') > 0 && q.textB.indexOf('.') > 0;
    if (level === 9) return q.dpA !== q.dpB && (q.phA.length + q.phB.length) > 0;
    return false;
  }

  function toInt(n, dp) { return Math.round(n * Math.pow(10, dp)); }

  function fmt(n, dp) {
    if (!dp) return String(Math.round(n));
    return Number(n).toFixed(dp);
  }

  /* Ported from embedmaths-addition-subtraction.html */
  function buildSubSteps(a, b, dp) {
    const mult = Math.pow(10, dp);
    const ai = toInt(a, dp);
    const bi = toInt(b, dp);
    const L = Math.max(String(ai).length, String(bi).length);
    const origTop = String(ai).padStart(L, '0').split('').reverse().map(Number);
    const bd = String(bi).padStart(L, '0').split('').reverse().map(Number);
    const wTop = origTop.slice();
    const tradedFrom = new Array(L).fill(false);
    const tradedTo = new Array(L).fill(false);
    const newVals = new Array(L).fill(null);
    const steps = [];
    const results = new Array(L).fill(null);

    for (let i = 0; i < L; i++) {
      let ad = wTop[i];
      const b2 = bd[i];
      const cn = colName(i, dp);
      let text;
      let calc;
      let tradeInfo = null;
      function snap(extra) {
        return {
          text: extra.text || '',
          calc: extra.calc || '',
          col: i,
          wTop: wTop.slice(),
          origTop: origTop.slice(),
          bd: bd.slice(),
          tradedFrom: tradedFrom.slice(),
          tradedTo: tradedTo.slice(),
          newVals: newVals.slice(),
          results: results.slice(),
          isTrade: !!extra.isTrade,
          tradeInfo: extra.tradeInfo || null,
          dp: dp,
          final: false,
          readyText: extra.readyText || null,
          chip: extra.chip || null,
          hiCols: extra.hiCols || [i]
        };
      }
      if (ad < b2) {
        let from = i + 1;
        while (from < L && wTop[from] === 0) from++;
        if (from >= L) break;
        const hereBefore = ad;
        const zeroIdx = [];
        for (let z = i + 1; z < from; z++) zeroIdx.push(z);
        const hops = [];
        let k = from;
        while (k > i) {
          const to = k - 1;
          const fromBefore = k === from ? wTop[k] : 10;
          hops.push({
            fromCol: k,
            toCol: to,
            fromName: colName(k, dp),
            toName: colName(to, dp),
            fromBefore: fromBefore,
            fromAfter: fromBefore - 1,
            toBefore: wTop[to],
            toAfter: wTop[to] + 10
          });
          k = to;
        }
        tradeInfo = {
          place: cn,
          dp: dp,
          origHere: hereBefore,
          sub: b2,
          donor: from,
          donorName: colName(from, dp),
          zeros: zeroIdx,
          hops: hops
        };
        if (zeroIdx.length) {
          const zeroNames = zeroIdx.map(function (idx) { return colName(idx, dp); });
          let intro = hereBefore + ' is not enough to take ' + b2 + '. ';
          if (zeroNames.length === 1) intro += 'The ' + zeroNames[0] + ' is 0, so we go to the ' + tradeInfo.donorName + '.';
          else intro += 'The ' + joinAnd(zeroNames) + ' are 0, so we go to the ' + tradeInfo.donorName + '.';
          steps.push(snap({ readyText: intro, isTrade: true, chip: 'Trading', hiCols: [i] }));
          hops.forEach(function (hop) {
            tradedFrom[hop.fromCol] = true;
            newVals[hop.fromCol] = hop.fromAfter;
            wTop[hop.fromCol] = hop.fromAfter;
            wTop[hop.toCol] = hop.toAfter;
            if (hop.toCol === i) {
              tradedTo[i] = true;
              newVals[i] = hop.toAfter;
            } else {
              tradedFrom[hop.toCol] = true;
              newVals[hop.toCol] = hop.toAfter;
            }
            steps.push(snap({
              readyText: hopPhrase(hop) + '.',
              isTrade: true,
              chip: 'Trading',
              hiCols: [hop.fromCol, hop.toCol]
            }));
          });
          ad = wTop[i];
          tradeInfo.nowHere = ad;
          results[i] = ad - b2;
          steps.push(snap({
            readyText: ad + ' − ' + b2 + ' = ' + results[i] + '. Write ' + results[i] + '.',
            isTrade: true,
            tradeInfo: tradeInfo,
            chip: 'Trading',
            calc: ad + ' − ' + b2 + ' = ' + results[i],
            hiCols: [i]
          }));
          continue;
        }
        hops.forEach(function (hop) {
          tradedFrom[hop.fromCol] = true;
          newVals[hop.fromCol] = hop.fromAfter;
          wTop[hop.fromCol] = hop.fromAfter;
          wTop[hop.toCol] = hop.toAfter;
          if (hop.toCol === i) {
            tradedTo[i] = true;
            newVals[i] = hop.toAfter;
          }
        });
        ad = wTop[i];
        tradeInfo.nowHere = ad;
        text = 'Trade for the ' + cn;
        calc = ad + ' − ' + b2 + ' = ' + (ad - b2);
      } else {
        text = 'Subtract the ' + cn + ': ' + ad + ' − ' + b2;
        calc = '= ' + (ad - b2);
      }
      results[i] = ad - b2;
      steps.push(snap({
        text: text,
        calc: calc,
        isTrade: !!tradeInfo,
        tradeInfo: tradeInfo,
        hiCols: tradeInfo ? [i, tradeInfo.donor].concat(tradeInfo.zeros) : [i]
      }));
    }
    return { steps: steps, result: (ai - bi) / mult };
  }

  function hopPhrase(hop) {
    return hop.fromBefore + ' ' + singular(hop.fromName, hop.fromBefore) + ' becomes ' + hop.fromAfter + ', ' +
      hop.toBefore + ' ' + singular(hop.toName, hop.toBefore) + ' becomes ' + hop.toAfter;
  }

  function bottomEmpty(q, col) {
    if (q.phB && q.phB.indexOf(col) !== -1) return true;
    return col >= String(q.bInt).length;
  }

  function columnText(s, q) {
    const place = colName(s.col, s.dp);
    const digit = s.results[s.col];
    if (s.tradeInfo) {
      const info = s.tradeInfo;
      return titleCase(place) + ': ' + info.origHere + ' is not enough to take ' + info.sub + '. Trade from the ' +
        info.donorName + ': ' + hopPhrase(info.hops[0]) + '. ' + info.nowHere + ' − ' + info.sub + ' = ' + digit + '. Write ' + digit + '.';
    }
    if (bottomEmpty(q, s.col)) return titleCase(place) + ': Nothing to take away, so write ' + digit + '.';
    return titleCase(place) + ': ' + s.wTop[s.col] + ' − ' + s.bd[s.col] + ' = ' + digit + '. Write ' + digit + '.';
  }

  function buildSteps(q) {
    const raw = buildSubSteps(q.a, q.b, q.dp);
    const ui = [];
    if (q.phA.length || q.phB.length) {
      const shortText = q.phA.length ? q.textA : q.textB;
      const padded = q.phA.length ? fmtScaled(q.aInt, q.dp, q.dp) : fmtScaled(q.bInt, q.dp, q.dp);
      ui.push({
        title: 'Line up the places',
        text: shortText + ' has no hundredths. Write a placeholder 0 to make ' + padded + ', and keep the decimal points in a line.',
        stepTag: null,
        kind: 'lineup',
        algo: null,
        hiCols: []
      });
    }
    const answerText = q.dp ? Number(raw.result).toFixed(q.dp) : String(Math.round(raw.result));
    raw.steps.forEach(function (s, idx) {
      const place = colName(s.col, q.dp);
      const tag = s.chip || ((place === 'hundreds' || place === 'thousands' || place === 'ten-thousands')
        ? 'Hundreds / thousands'
        : titleCase(place));
      let text = s.readyText || columnText(s, q);
      if (idx === raw.steps.length - 1) text += ' Answer ' + answerText + '.';
      ui.push({
        title: titleCase(place),
        text: text,
        stepTag: tag,
        kind: 'calc',
        place: place,
        traded: s.isTrade,
        algo: s,
        hiCols: s.hiCols || [s.col]
      });
    });
    q.answer = raw.result;
    return ui;
  }

  /* Ported from embedmaths-addition-subtraction.html and fixed for
     different lengths, placeholder zeros, and orange trading digits. */
  function renderAlgo(q, step) {
    const dp = q.dp;
    const ai = q.aInt;
    const bi = q.bInt;
    const L = Math.max(String(ai).length, String(bi).length, dp + 1);
    const aStr = String(ai).padStart(L, ' ');
    const bStr = String(bi).padStart(L, ' ');
    const dotAfter = dp > 0 ? L - dp - 1 : -1;
    const hi = {};
    if (step && step.hiCols) step.hiCols.forEach(function (c) { hi[c] = true; });
    else if (step && step.algo && step.algo.col >= 0) hi[step.algo.col] = true;
    const snap = step && step.algo ? step.algo : (step && step.origTop ? step : null);

    function cell(ch, fromRight, row) {
      if (ch === ' ') return '<div class="dc empty"></div>';
      const active = !!hi[fromRight];
      const phList = row === 'a' ? q.phA : q.phB;
      const isPh = phList.indexOf(fromRight) !== -1;
      const traded = snap && (snap.tradedFrom[fromRight] || snap.tradedTo[fromRight]);
      if (row === 'a' && snap && traded) {
        const crossed = snap.tradedFrom[fromRight] || snap.tradedTo[fromRight];
        const nv = snap.newVals[fromRight];
        const orig = snap.origTop[fromRight];
        return '<div class="dc' + (active ? ' on' : '') + '"><span class="d' +
          (crossed ? ' crossed' : '') + (active ? ' hi' : '') + '">' + orig + '</span>' +
          (nv !== null && nv !== undefined ? '<span class="newval">' + nv + '</span>' : '') + '</div>';
      }
      const ph = isPh && !(row === 'a' && traded);
      return '<div class="dc' + (active ? ' on' : '') + '"><span class="d' +
        (ph ? ' ph' : '') + (active && !ph ? ' hi' : '') + '">' + ch + '</span></div>';
    }

    function rowHtml(str, row, op) {
      let html = '<div class="algo-row"><div class="dc ' + (op ? 'op' : 'spacer') + '">' + (op || '') + '</div>';
      for (let ci = 0; ci < L; ci++) {
        html += cell(str[ci], L - 1 - ci, row);
        if (dp > 0 && ci === dotAfter) html += '<div class="dc dot">.</div>';
      }
      html += '</div>';
      return html;
    }

    const anyResult = snap && snap.results && snap.results.some(function (v) { return v !== null && v !== undefined; });
    let res = '<div class="algo-row sep-row"><div class="dc spacer"></div>';
    for (let ci = 0; ci < L; ci++) {
      const fromRight = L - 1 - ci;
      const rv = snap && snap.results ? snap.results[fromRight] : null;
      const shown = rv !== null && rv !== undefined;
      res += '<div class="dc"><span class="d' + (shown ? ' res' : ' wait') + '">' + (shown ? rv : '') + '</span></div>';
      if (dp > 0 && ci === dotAfter && anyResult) res += '<div class="dc dot">.</div>';
    }
    res += '</div>';

    return '<div class="algo-grid-wrap">' + rowHtml(aStr, 'a', '') + rowHtml(bStr, 'b', '−') + res + '</div>';
  }

  /* Ported from embedmaths-addition-subtraction.html.
     Round-and-adjust now aims at an easy result (7257 − 1457 = 5800, then + 2). */
  function mentalStrategy(a, b, op, dp) {
    if (dp > 0) {
      const mult = Math.pow(10, dp);
      const ai = toInt(a, dp);
      const bi = toInt(b, dp);
      const res = op === 'addition' ? ai + bi : ai - bi;
      return '<strong>Think in whole numbers first.</strong> Ignore the decimal point for a moment.<br>' +
        ai + ' ' + (op === 'addition' ? '+' : '−') + ' ' + bi + ' = ' + res +
        '<br>Then put the decimal point back: <strong>' + fmt(res / mult, dp) + '</strong>';
    }
    if (op === 'addition') return addStrategy(a, b);
    return subStrategy(a, b);
  }

  function subStrategy(a, b) {
    const diff = a - b;
    const units = a >= 1000 ? [1000, 100, 10] : [100, 10];
    for (let tweakAbs = 1; tweakAbs <= 5; tweakAbs++) {
      for (let sign = 1; sign >= -1; sign -= 2) {
        const bPrime = b + sign * tweakAbs;
        const target = a - bPrime;
        if (bPrime <= 0 || target <= 0) continue;
        const unit = units.find(function (u) { return target % u === 0; });
        if (!unit) continue;
        if (a >= 1000 && unit < 100 && tweakAbs > 2) continue;
        const dir = sign > 0 ? 'add' : 'subtract';
        return '<strong>Round and adjust.</strong> Change ' + b + ' to ' + bPrime + '.<br>' +
          a + ' − ' + bPrime + ' = ' + target + ', then ' + dir + ' ' + tweakAbs +
          ' = <strong>' + diff + '</strong>';
      }
    }
    const rb = Math.round(b / 10) * 10;
    const gap = rb - b;
    if (gap !== 0) {
      const dir = gap > 0 ? 'add' : 'subtract';
      return '<strong>Round and adjust.</strong> Round ' + b + ' to ' + rb + '.<br>' +
        a + ' − ' + rb + ' = ' + (a - rb) + ', then ' + dir + ' ' + Math.abs(gap) +
        ' = <strong>' + diff + '</strong>';
    }
    return '<strong>Count up.</strong> From ' + b + ' up to ' + a + ' is <strong>' + diff + '</strong>.';
  }

  function addStrategy(a, b) {
    const units = a >= 1000 ? [1000, 100, 10] : [100, 10];
    for (let tweakAbs = 1; tweakAbs <= 5; tweakAbs++) {
      for (let sign = 1; sign >= -1; sign -= 2) {
        const bPrime = b + sign * tweakAbs;
        const target = a + bPrime;
        if (bPrime <= 0) continue;
        const unit = units.find(function (u) { return target % u === 0; });
        if (!unit) continue;
        const dir = sign > 0 ? 'subtract' : 'add';
        return '<strong>Round and adjust.</strong> Change ' + b + ' to ' + bPrime + '.<br>' +
          a + ' + ' + bPrime + ' = ' + target + ', then ' + dir + ' ' + tweakAbs +
          ' = <strong>' + (a + b) + '</strong>';
      }
    }
    return '<strong>Split the tens and ones.</strong> ' + a + ' + ' + b + ' = <strong>' + (a + b) + '</strong>.';
  }

  function estimate(q) {
    const mag = Math.max(Math.abs(q.a), Math.abs(q.b));
    let place = 10;
    if (q.dp > 0) place = 1;
    else if (mag >= 1000) place = 100;
    else place = 10;
    const ra = Math.round(q.a / place) * place;
    const rb = Math.round(q.b / place) * place;
    return {
      prompt: fmt(ra, 0) + ' − ' + fmt(rb, 0),
      answer: ra - rb
    };
  }

  /* Ported from genExtProblems / genExtBank in embedmaths-addition-subtraction.html. */
  function genExtProblems(q) {
    const dp = q.dp;
    const a = q.a;
    const b = q.b;
    const res = a - b;
    function fmtN(n) {
      if (!dp) return String(Math.round(n));
      const f = Number(n).toFixed(dp);
      return f;
    }
    const r = fmtN(res);
    const af = q.textA;
    const bf = q.textB;
    const sumVal = a + b;
    const sumF = fmtN(sumVal);
    const smaller = Math.min(a, b);
    const pays = fmtN(Math.ceil(sumVal / 10) * 10);
    const change = fmtN(Math.ceil(sumVal / 10) * 10 - sumVal);
    const half = fmtN(Math.round(smaller * 0.5 * Math.pow(10, dp)) / Math.pow(10, dp));
    const ninety = fmtN(Math.round(res * 0.9 * Math.pow(10, dp)) / Math.pow(10, dp));
    const dbl = fmtN(a * 2);
    const left = fmtN(sumVal - parseFloat(half));
    const near = fmtN(Math.round(res / 100) * 100);
    return [
      { type: 'Word problem', kind: 'number', expect: sumF, hint: 'Add the two weeks together.', p: 'A school fundraiser collected $' + af + ' in Week 1 and $' + bf + ' in Week 2. How much was collected altogether?', a: '$' + af + ' + $' + bf + ' = <strong>$' + sumF + '</strong>' },
      { type: 'Word problem', kind: 'number', expect: r, hint: 'Start with the litres in the tank, then subtract what was used.', p: 'A water tank held ' + af + ' litres. After ' + bf + ' litres was used, how many litres remain?', a: af + ' − ' + bf + ' = <strong>' + r + ' litres</strong>' },
      { type: 'Word problem', kind: 'number', expect: sumF, hint: 'Add the two distances.', p: 'The distance from school to the park is ' + af + ' km and from the park to the oval is ' + bf + ' km. What is the total distance from school to the oval via the park?', a: af + ' + ' + bf + ' = <strong>' + sumF + ' km</strong>' },
      { type: 'Word problem', kind: 'number', expect: left, hint: 'First add what Mia saved. Do not subtract the book yet.', p: 'Mia saves $' + af + ' in January and $' + bf + ' in February. She then spends $' + half + ' on a book. How much does she have left?', a: 'Step 1: $' + af + ' + $' + bf + ' = $' + sumF + '<br>Step 2: $' + sumF + ' − $' + half + ' = <strong>$' + left + '</strong>' },
      { type: 'Missing number', kind: 'number', expect: af, hint: 'The missing number is the one you start with.', p: 'Find the missing number:<br><strong>___ − ' + bf + ' = ' + r + '</strong>', a: 'Missing number = <strong>' + af + '</strong><br>Check: ' + af + ' − ' + bf + ' = ' + r },
      { type: 'Missing number', kind: 'number', expect: bf, hint: 'The missing number is the one you subtract.', p: 'Find the missing number:<br><strong>' + af + ' − ___ = ' + r + '</strong>', a: 'Missing number = <strong>' + bf + '</strong><br>Check: ' + af + ' − ' + bf + ' = ' + r },
      { type: 'True or False', kind: 'tf', expect: 'true', hint: 'Work out the subtraction, then compare it with the other number.', p: 'True or False?<br><strong>' + af + ' − ' + bf + ' &gt; ' + ninety + '</strong>', a: af + ' − ' + bf + ' = ' + r + '<br>' + r + ' &gt; ' + ninety + ' → <strong>TRUE</strong>' },
      { type: 'True or False', kind: 'tf', expect: 'true', hint: 'Try swapping the two amounts. Does the total change?', p: 'True or False?<br><strong>' + af + ' + ' + bf + ' = ' + bf + ' + ' + af + '</strong>', a: '<strong>TRUE</strong> — This is the commutative property of addition: the order of the addends does not change the sum.' },
      { type: 'True or False', kind: 'tf', expect: 'true', hint: 'Add first. Subtracting the same amount you just added should undo it.', p: 'True or False?<br><strong>(' + af + ' + ' + bf + ') − ' + bf + ' = ' + af + '</strong>', a: 'Step 1: ' + af + ' + ' + bf + ' = ' + sumF + '<br>Step 2: ' + sumF + ' − ' + bf + ' = ' + af + '<br><strong>TRUE</strong> — Addition and subtraction are inverse operations.' },
      { type: 'Multi-step', kind: 'number', expect: left, hint: 'Solve the brackets first. Add, and stop before you subtract.', p: 'Evaluate — show your working:<br><strong>(' + af + ' + ' + bf + ') − ' + half + '</strong>', a: 'Step 1: ' + af + ' + ' + bf + ' = ' + sumF + '<br>Step 2: ' + sumF + ' − ' + half + ' = <strong>' + left + '</strong>' },
      { type: 'Multi-step', kind: 'number', expect: change, hint: 'Add the two prices first. Do not take them away from the note yet.', p: 'A customer buys two items priced $' + af + ' and $' + bf + '. They pay with a $' + pays + ' note. What change do they receive?', a: 'Total: $' + af + ' + $' + bf + ' = $' + sumF + '<br>Change: $' + pays + ' − $' + sumF + ' = <strong>$' + change + '</strong>' },
      { type: 'Multi-step', kind: 'number', expect: fmtN(a * 2 - b), hint: 'Double the first number, then subtract the same second number.', p: 'If ' + af + ' − ' + bf + ' = ' + r + ', what is ' + dbl + ' − ' + bf + '?', a: dbl + ' is double ' + af + '.<br>' + dbl + ' − ' + bf + ' = <strong>' + fmtN(a * 2 - b) + '</strong>' },
      { type: 'Estimation', kind: 'tf', expect: 'false', hint: 'Round each number and subtract. Compare that estimate with the student\'s answer.', p: 'A student calculated ' + af + ' − ' + bf + ' = ' + fmtN(res * 1.25) + '. Is this reasonable?', a: 'Actual: <strong>' + r + '</strong><br>' + fmtN(res * 1.25) + ' is <strong>not reasonable</strong> — it is too large.' },
      { type: 'Estimation', kind: 'number', expect: near, hint: 'Round each number, then subtract. Do not work out the exact answer yet.', p: 'Without calculating exactly — is ' + af + ' − ' + bf + ' closer to ' + fmtN(Math.round(res / 100) * 100 - 100) + ', ' + near + ', or ' + fmtN(Math.round(res / 100) * 100 + 100) + '?', a: 'The answer ' + r + ' is closest to <strong>' + near + '</strong>.' }
    ];
  }

  function buildExtBank(level) {
    const bank = [];
    let attempt = 0;
    while (bank.length < 12 && attempt < 20) {
      attempt++;
      const q = normal(level);
      genExtProblems(q).forEach(function (item) {
        if (item && item.p && item.a) bank.push(item);
      });
    }
    const shuffled = bank.slice().sort(function () { return Math.random() - 0.5; });
    const seen = {};
    const final = [];
    shuffled.forEach(function (item) {
      if (final.length >= 5) return;
      if (!seen[item.type]) { seen[item.type] = true; final.push(item); }
    });
    shuffled.forEach(function (item) {
      if (final.length >= 8) return;
      if (final.indexOf(item) === -1) final.push(item);
    });
    return final.slice(0, 8);
  }

  const TIPS = {
    'Trading': 'When the next column is 0, keep going left until you find a digit to trade from. Every 0 you pass over becomes a 9.',
    'Ones': 'Start at the ones. If the top digit is smaller, trade before you subtract.',
    'Tens': 'After a trade, use the new tens digit above the crossed-out one.',
    'Hundreds / thousands': 'Check the column you traded from. Subtract with the new digit, not the one you crossed out.',
    'Tenths': 'Keep the decimal points in a line, then subtract the tenths in that column.',
    'Hundredths': 'If one number has fewer decimal places, write a placeholder 0 so the hundredths line up.'
  };

  EM.registerTopic({
    id: 'sub',
    name: 'Subtraction',
    section: 'written',
    levels: [
      { id: 1, name: '2-digit, no trading', example: '87 − 34' },
      { id: 2, name: '2-digit with trading', example: '82 − 47' },
      { id: 3, name: '3-digit, no trading', example: '586 − 243' },
      { id: 4, name: '3-digit with trading', example: '624 − 258' },
      { id: 5, name: '4-digit with trading', example: '7257 − 1455' },
      { id: 6, name: 'Trading across zeros', example: '4003 − 1257' },
      { id: 7, name: 'Different lengths', example: '3456 − 87' },
      { id: 8, name: 'Decimals, same places', example: '34.6 − 12.9' },
      { id: 9, name: 'Decimals, different places', example: '12.5 − 3.47' }
    ],
    tricky: [
      { id: 'across-zeros', tags: ['Trading'], levels: [6] },
      { id: 'different-lengths', tags: ['Tens', 'Hundreds / thousands'], levels: [7] },
      { id: 'placeholder', tags: ['Hundredths', 'Tenths'], levels: [9] },
      { id: 'must-trade', tags: ['Trading', 'Ones'], levels: [2, 4, 5, 8] }
    ],
    errorTags: ['Trading', 'Ones', 'Tens', 'Hundreds / thousands', 'Tenths', 'Hundredths'],
    tips: TIPS,
    makeQuestion: function (level, opts) {
      opts = opts || {};
      const focus = opts.focus || null;
      for (let i = 0; i < 30; i++) {
        const q = (opts.tricky || focus) ? trickyQ(level, focus) : normal(level);
        if (!fits(level, q)) continue;
        if (level === 6 && focus === 'Trading' && !crossesZero(q.aInt, q.bInt)) continue;
        q.level = level;
        q.tricky = !!(opts.tricky || focus);
        q.steps = buildSteps(q);
        return q;
      }
      const q = normal(level);
      q.level = level;
      q.tricky = !!(opts.tricky || focus);
      q.steps = buildSteps(q);
      return q;
    },
    estimate: estimate,
    buildSteps: function (q) { return q.steps || buildSteps(q); },
    render: function (q, stepIndex, el) {
      const steps = q.steps || [];
      const step = stepIndex >= 0 ? steps[stepIndex] : null;
      el.innerHTML = renderAlgo(q, step);
    },
    strategy: function (q) { return mentalStrategy(q.a, q.b, 'subtraction', q.dp); },
    chipsFor: function (q) {
      const used = {};
      (q.steps || []).forEach(function (s) { if (s.stepTag) used[s.stepTag] = true; });
      used.Trading = true;
      return this.errorTags.filter(function (tag) { return used[tag]; });
    },
    extensions: function (level) { return buildExtBank(level); }
  });
})();
