const Player = (function () {
  let phase = 'layout';
  let step = -1;
  let col = -1;
  let revealAll = false;
  let walking = false;
  let choice = null;
  let tag = null;

  function q() { return EM.session.questions[EM.session.index]; }
  function topic() {
    const question = q();
    const id = (question && question.topicId) || EM.session.topicId;
    return EM.topics[id];
  }

  function resetQuestion() {
    phase = EM.session.est ? 'estimate' : 'ready';
    step = -1;
    col = -1;
    revealAll = false;
    walking = false;
    choice = null;
    tag = null;
  }

  function paint(scrollTop) {
    const session = EM.session;
    const question = q();
    const steps = question.steps;
    const row = step >= 0 ? steps[step] : null;
    const inCols = row && col >= 0 && row.columns && row.columns[col];
    const revealed = phase === 'steps';
    const whole = revealed && revealAll;
    const segments = session.questions.map(function (_, i) {
      const result = session.results[i];
      let cls = 'seg-bit';
      if (result) cls += result.correct ? ' right' : ' wrong';
      else if (i === session.index) cls += ' now';
      return '<span class="' + cls + '"></span>';
    }).join('');

    let estimateHtml = '';
    const plain = !!(topic().plain);
    if (topic().predict && !revealed) {
      const pred = topic().predict(question);
      const lines = pred.lines || [pred.before];
      estimateHtml = lines.map(function (line) { return '<p class="estimate">' + line + '</p>'; }).join('');
    } else if (session.est && !plain) {
      if (!revealed) {
        const cue = topic().estimateCue && topic().estimateCue(question);
        const lead = topic().cueLead;
        const line = cue ? (lead ? lead + ' ' + cue : cue) : 'Estimate first. Write a reasonable estimate on your paper.';
        estimateHtml = '<p class="estimate">' + line + '</p>';
      } else if (!topic().cueLead) {
        const est = topic().estimate(question);
        estimateHtml = '<p class="estimate">Estimate: ' + est.prompt + ' = ' + est.answer + '</p>';
      }
    }

    let instructionHtml = '';
    if (topic().instruction) {
      const line = topic().instruction(question);
      if (line) instructionHtml = '<p class="q-instruction">' + EM.escapeHtml(line) + '</p>';
    }

    let foot = '';
    if (whole && session.est && !topic().predict && topic().id !== 'div' && !topic().hidesCloseness) {
      const est = topic().estimate(question);
      const answer = Math.round(question.answer * Math.pow(10, question.dp)) / Math.pow(10, question.dp);
      const shown = question.dp ? answer.toFixed(question.dp) : String(Math.round(answer));
      const gap = Math.abs(answer - est.answer);
      const close = gap <= Math.max(1, Math.abs(est.answer) * 0.2);
      foot = '<p class="closeness">' + (close
        ? shown + ' is close to the estimate of ' + est.answer + '\u00a0\u2713'
        : 'The answer is ' + shown + ', and the estimate was ' + est.answer) + '</p>';
    }

    function stepBody(s) {
      if (!s) return '';
      if (s.kind === 'trade' || s.kind === 'lineup' || s.kind === 'teach') {
        return '<p class="step-title">' + (s.title || '') + '</p><p>' + (s.text || '') + '</p>';
      }
      return '<p>' + (s.text || s.title || s.label || '') + '</p>';
    }
    function doneLine(label) {
      return '<li class="step done"><span class="n">✓</span><div><p>' + label + '</p></div></li>';
    }
    function fullLine(s, extra) {
      return '<li class="step current"><span class="n">•</span><div>' + stepBody(s) + (extra || '') + '</div></li>';
    }
    function fold(inner, forceOpen) {
      const wide = window.matchMedia('(min-width: 601px)').matches;
      return '<details class="step-fold"' + (forceOpen || wide ? ' open' : '') +
        '><summary>Show the steps</summary>' + inner + '</details>';
    }
    let stepHtml = '';
    if (plain && revealed) {
      const lines = (question.revealLines || []).map(function (text) {
        return '<p class="reveal-line">' + text + '</p>';
      }).join('');
      stepHtml = fold('<div class="reveal-lines">' + lines + '</div>', false);
    } else if (revealed && steps && steps.length && steps.some(function (s) { return s.kind === 'digit' || s.group; })) {
      let n = 0;
      let lastGroup = '';
      const lines = [];
      steps.forEach(function (s, i) {
        if (s.group && s.group !== lastGroup) {
          lines.push('<li class="step-head">' + s.group + '</li>');
          lastGroup = s.group;
        }
        n += 1;
        let cls = 'step';
        if (walking && i === step) cls += ' current';
        else if (walking && i > step) cls += ' later';
        lines.push('<li class="' + cls + '"><span class="n">' + n + '</span><div>' + stepBody(s) + '</div></li>');
      });
      stepHtml = fold('<ol class="steps digit-steps">' + lines.join('') + '</ol>', true);
    } else if (revealed && steps && steps.length) {
      if (walking) {
        const lines = [];
        steps.forEach(function (s, i) {
          if (i > step) return;
          const name = s.label || s.title || 'Step';
          if (i < step) {
            lines.push(doneLine(name));
            return;
          }
          if (inCols) {
            s.columns.forEach(function (c, ci) {
              if (ci < col) lines.push(doneLine(c.label || 'Column'));
            });
            lines.push(fullLine(s.columns[col]));
            return;
          }
          const link = s.columns && s.columns.length
            ? '<button type="button" class="col-link" id="eachCol">Show me each column</button>'
            : '';
          lines.push(fullLine(s, link));
        });
        stepHtml = fold('<ol class="steps">' + lines.join('') + '</ol>', true);
      } else {
        const lines = steps.map(function (s, i) {
          return '<li class="step"><span class="n">' + (i + 1) + '</span><div>' + stepBody(s) + '</div></li>';
        }).join('');
        stepHtml = fold('<ol class="steps">' + lines + '</ol>', false);
      }
    }

    let check = '';
    if (revealed) {
      const chips = topic().chipsFor(question).map(function (name, i) {
        const on = tag === name ? ' on' : '';
        return '<button type="button" class="chip' + on + '" data-tag="' + name + '">' + (i + 1) + ' · ' + name + '</button>';
      }).join('');
      const nextLabel = session.index + 1 >= session.count ? 'See my summary' : 'Next question';
      check = '<section class="check"><h3>How did you go?</h3><div class="check-row">' +
        '<button type="button" class="choice right' + (choice === 'right' ? ' on' : '') + '" data-choice="right">' +
        EM.icons.check + ' I got it right</button>' +
        '<button type="button" class="choice wrong' + (choice === 'error' ? ' on' : '') + '" data-choice="error">I made an error</button>' +
        '</div>' + (choice === 'error'
          ? '<p class="which">Which step went wrong?</p><div class="chips">' + chips + '</div>' +
            '<button type="button" class="btn primary" id="nextQ">' + nextLabel + ' ' + EM.icons.arrow + '</button>'
          : '') + '</section>';
    }

    let strategy = '';
    if (whole && session.strat && !plain && topic().id !== 'div') {
      strategy = '<aside class="strategy"><p class="eyebrow">One way in your head</p>' + topic().strategy(question) + '</aside>';
    }

    const actions = !revealed
      ? '<button type="button" class="btn primary" id="showSolution">Show solution ' + EM.icons.arrow + '</button>'
      : (walking
        ? '<button type="button" class="btn ghost" id="prevStep">Back</button>' +
          '<button type="button" class="btn ghost" id="nextStep">Next step ' + EM.icons.arrow + '</button>'
        : '<button type="button" class="btn ghost" id="prevStep">Back</button>' +
          (plain ? '' : '<button type="button" class="btn ghost" id="eachStep">Show me each step ' + EM.icons.arrow + '</button>'));

    const assigned = !!(session.set || session.mix || session.assigned);
    const leaveLabel = assigned ? '\u2190 Exit' : '\u2190 Levels';
    const roomy = topic().id === 'frac';
    const pctPaper = topic().id === 'pct';
    document.getElementById('app').innerHTML =
      '<div class="shell play"><header class="play-top"><div class="play-nav">' +
      '<button type="button" class="btn ghost" id="leave">' + leaveLabel + '</button>' +
      '<button type="button" class="btn ghost icon-btn" id="toHome" aria-label="Home">' + EM.icons.home + '</button>' +
      '</div><div class="progress-wrap"><p>' +
      EM.escapeHtml(progressLabel()) + '</p>' +
      (session.msg ? '<p class="session-msg">' + EM.escapeHtml(session.msg) + '</p>' : '') +
      '<div class="progress" aria-hidden="true">' + segments +
      '</div></div>' + (question.tricky ? '<span class="tricky-tag">Tricky one</span>' : '<span></span>') + '</header>' +
      '<div class="work' + (roomy ? ' frac-work' : '') + '"><section class="paper' + (roomy ? ' roomy' : '') + (pctPaper ? ' pct-paper' : '') + '">' +
      '<div class="paper-fit">' + instructionHtml + '<p class="equation' + (question.kind === 'discount' ? ' eq-prose' : '') + '">' +
      ((revealed && question.solvedEquation) ? question.solvedEquation : (question.equation || (question.textA + ' − ' + question.textB))) + '</p>' +
      estimateHtml + '<div id="algo"></div>' + foot + '</div></section><section class="steps-col">' +
      (revealed ? stepHtml : '<p class="wait-note">The working stays hidden until you are ready.</p>') +
      strategy + '</section></div><div class="dock"><div class="dock-left">' + check + '</div><div class="action-row">' + actions + '</div></div></div>';

    question.view = { col: col, reveal: revealAll, walking: walking, step: step };
    if (phase === 'steps' || topic().showsPrep) {
      topic().render(question, phase === 'steps' ? (revealAll ? steps.length - 1 : step) : -1, document.getElementById('algo'));
    }
    document.querySelectorAll('.mult-closed, .mult-toggle').forEach(function (btn) {
      btn.onclick = function () {
        const open = btn.getAttribute('aria-expanded') === 'true';
        EM.session.multiplesOpen = !open;
        paint(false);
      };
    });
    document.querySelectorAll('.method-tab').forEach(function (btn) {
      btn.onclick = function () {
        if (!topic().setMethod) return;
        topic().setMethod(question, btn.getAttribute('data-method'));
        phase = 'steps';
        revealAll = true;
        walking = false;
        col = -1;
        step = (question.steps || []).length - 1;
        paint(false);
      };
    });

    function confirmLeave() {
      if (!assigned) return true;
      return window.confirm('Leave this practice? Your answers so far won\u2019t be saved.');
    }
    document.getElementById('leave').onclick = function () {
      if (!confirmLeave()) return;
      if (assigned) EM.home();
      else EM.openLevels(session.topicId);
    };
    document.getElementById('toHome').onclick = function () {
      if (!confirmLeave()) return;
      EM.home();
    };
    const show = document.getElementById('showSolution');
    if (show) show.onclick = function () {
      phase = 'steps';
      revealAll = true;
      walking = false;
      col = -1;
      step = steps.length - 1;
      paint(false);
    };
    const eachStep = document.getElementById('eachStep');
    if (eachStep) eachStep.onclick = function () {
      walking = true;
      revealAll = false;
      col = -1;
      step = 0;
      paint(false);
    };
    const each = document.getElementById('eachCol');
    if (each) each.onclick = function () { col = 0; paint(false); };
    const next = document.getElementById('nextStep');
    if (next) next.onclick = function () {
      const current = steps[step];
      if (col >= 0 && current && current.columns) {
        if (col < current.columns.length - 1) col += 1;
        else col = -1;
      } else if (step >= steps.length - 1) {
        walking = false;
        revealAll = true;
        col = -1;
        step = steps.length - 1;
      } else {
        step += 1;
        col = -1;
      }
      paint(false);
    };
    const prev = document.getElementById('prevStep');
    if (prev) prev.onclick = function () {
      if (walking && step <= 0 && col <= 0) {
        walking = false;
        revealAll = true;
        col = -1;
        step = steps.length - 1;
        paint(false);
        return;
      }
      if (revealAll || !walking) {
        phase = EM.session.est ? 'estimate' : 'ready';
        step = -1;
        col = -1;
        revealAll = false;
        walking = false;
        paint(false);
        return;
      }
      if (col > 0) { col -= 1; paint(false); return; }
      if (col === 0) { col = -1; paint(false); return; }
      if (step <= 0) {
        revealAll = true;
        col = -1;
        step = steps.length - 1;
      } else {
        step -= 1;
        col = -1;
      }
      paint(false);
    };
    document.querySelectorAll('[data-choice]').forEach(function (btn) {
      btn.onclick = function () {
        choice = btn.getAttribute('data-choice');
        if (choice === 'right') { tag = null; commit(); return; }
        paint(false);
      };
    });
    document.querySelectorAll('[data-tag]').forEach(function (btn) {
      btn.onclick = function () {
        const name = btn.getAttribute('data-tag');
        tag = tag === name ? null : name;
        paint(false);
      };
    });
    const nextQ = document.getElementById('nextQ');
    if (nextQ) nextQ.onclick = commit;
    fitLayouts();
    showCurrentStep();
    if (scrollTop !== false) window.scrollTo(0, 0);
  }

  function showCurrentStep() {
    const current = document.querySelector('.steps-col .step.current');
    const scroller = document.querySelector('.shell.play .steps-col');
    if (!current || !scroller) return;
    if (window.matchMedia('(max-width: 700px)').matches) {
      current.scrollIntoView({ block: 'center', inline: 'nearest' });
      return;
    }
    const cRect = current.getBoundingClientRect();
    const sRect = scroller.getBoundingClientRect();
    const pad = 28;
    if (cRect.bottom > sRect.bottom - pad) scroller.scrollTop += cRect.bottom - sRect.bottom + pad;
    else if (cRect.top < sRect.top + 8) scroller.scrollTop -= sRect.top - cRect.top + 12;
  }

  function progressLabel() {
    const session = EM.session;
    const question = q();
    const current = topic();
    const level = (question && (question.mixLevel || question.level)) || session.level;
    let name = '';
    if (current && current.levels) {
      current.levels.forEach(function (row) {
        if (row.id === level) name = row.name;
      });
    }
    let label = current && current.name ? current.name : '';
    if (level) {
      label += (label ? ' \u00b7 ' : '') + 'Level ' + level;
      if (name) label += ', ' + name;
    }
    return label + ' \u00b7 Question ' + (session.index + 1) + ' of ' + session.count;
  }

  function fitFont(el, box) {
    if (!el || !box) return;
    el.style.fontSize = '';
    const avail = box.clientWidth;
    if (avail <= 0) return;
    if (el.scrollWidth <= avail + 1) return;
    const size = parseFloat(getComputedStyle(el).fontSize);
    let next = Math.max(15, size * avail / el.scrollWidth * 0.97);
    el.style.fontSize = next + 'px';
    if (el.scrollWidth > avail + 1) {
      next = Math.max(15, parseFloat(el.style.fontSize) * avail / el.scrollWidth * 0.97);
      el.style.fontSize = next + 'px';
    }
  }

  function fitDivision(layout) {
    const piece = layout.querySelector('.bus, .frac-board');
    const work = layout.querySelector('.div-work');
    const lists = layout.querySelector('.mult-wrap.multi');
    if (!work) return;
    layout.classList.remove('stacked');
    if (piece) piece.style.fontSize = '';
    if (lists) {
      const prev = lists.style.width;
      lists.style.width = 'max-content';
      const listW = lists.scrollWidth;
      lists.style.width = prev;
      const total = layout.clientWidth;
      const room = total - listW - 18;
      const boardW = piece ? piece.scrollWidth : 0;
      const preferred = piece ? parseFloat(getComputedStyle(piece).fontSize) : 40;
      const fitted = boardW > room && room > 0 ? preferred * room / boardW : preferred;
      if (room < 160 || fitted < 22 || listW > total - 40) layout.classList.add('stacked');
    } else if (piece && piece.scrollWidth > work.clientWidth + 1) {
      const preferred = parseFloat(getComputedStyle(piece).fontSize);
      const fitted = preferred * work.clientWidth / piece.scrollWidth;
      if (fitted < 22 || work.clientWidth < 150) layout.classList.add('stacked');
    }
    if (piece) {
      piece.style.fontSize = '';
      fitFont(piece, work);
    }
  }

  function fitLayouts() {
    document.querySelectorAll('.paper.roomy .equation').forEach(function (el) {
      fitFont(el, el.parentElement);
    });
    const layout = document.querySelector('.div-layout');
    if (layout) fitDivision(layout);
    document.querySelectorAll('.frac-board').forEach(function (el) {
      if (el.closest('.div-layout')) return;
      fitFont(el, el.parentElement);
    });
    document.querySelectorAll('.algo-grid-wrap').forEach(function (el) {
      fitFont(el, el.parentElement);
    });
    document.querySelectorAll('.paper.pct-paper .equation, .pct-grid, .pct-final, .pct-frac').forEach(function (el) {
      fitFont(el, el.parentElement);
    });
    document.querySelectorAll('.pv').forEach(function (el) {
      const grid = el.querySelector('.pv-grid');
      if (grid && el.scrollWidth > el.clientWidth + 1) fitFont(grid, el);
    });
    document.querySelectorAll('.pct-bus').forEach(function (el) {
      const bus = el.querySelector('.bus');
      if (bus) fitFont(bus, el);
    });
    fitPaperHeight();
    pinDock();
  }

  function fitPaperHeight() {
    const fit = document.querySelector('.shell.play .paper-fit');
    if (!fit) return;
    fit.style.zoom = '1';
    if (window.matchMedia('(max-width: 700px)').matches) return;
    const paper = fit.parentElement;
    const style = getComputedStyle(paper);
    const pad = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const avail = paper.clientHeight - pad;
    const need = fit.scrollHeight;
    if (avail < 80 || need <= avail + 2) return;
    let floor = 0.72;
    const sample = fit.querySelector('.algo-grid-wrap, .bus, .frac-board, .equation');
    if (sample) {
      const size = parseFloat(getComputedStyle(sample).fontSize);
      if (size > 0) floor = Math.max(floor, Math.min(1, 16 / size));
    }
    fit.style.zoom = String(Math.max(floor, Math.min(1, avail / need)));
  }

  function pinDock() {
    const shell = document.querySelector('.shell.play');
    const dock = shell && shell.querySelector('.dock');
    if (!shell || !dock) return;
    if (window.matchMedia('(max-width: 700px)').matches) {
      shell.style.paddingBottom = (dock.offsetHeight + 28) + 'px';
    } else shell.style.paddingBottom = '';
  }

  window.addEventListener('resize', function () {
    if (document.querySelector('.shell.play')) {
      fitLayouts();
      showCurrentStep();
    }
  });

  function commit() {
    const session = EM.session;
    session.results.push({
      correct: choice === 'right',
      tag: choice === 'error' ? tag : null,
      tricky: !!q().tricky,
      topicId: topic().id
    });
    session.index += 1;
    if (session.index >= session.questions.length) {
      Summary.open();
      return;
    }
    resetQuestion();
    paint(true);
  }

  return {
    open: function () {
      resetQuestion();
      paint(true);
    }
  };
})();
