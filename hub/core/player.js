const Player = (function () {
  let phase = 'layout';
  let step = -1;
  let choice = null;
  let tag = null;

  function q() { return EM.session.questions[EM.session.index]; }
  function topic() { return EM.topics[EM.session.topicId]; }

  function resetQuestion() {
    phase = EM.session.est ? 'estimate' : 'layout';
    step = -1;
    choice = null;
    tag = null;
  }

  function paint(scrollTop) {
    const session = EM.session;
    const question = q();
    const steps = question.steps;
    const last = step >= steps.length - 1 && phase === 'steps';
    const segments = session.questions.map(function (_, i) {
      const result = session.results[i];
      let cls = 'seg-bit';
      if (result) cls += result.correct ? ' right' : ' wrong';
      else if (i === session.index) cls += ' now';
      return '<span class="' + cls + '"></span>';
    }).join('');

    let estimateHtml = '';
    if (session.est) {
      if (phase === 'estimate') {
        estimateHtml = '<p class="estimate">Estimate first. Write a reasonable estimate on your paper.</p>';
      } else {
        const est = topic().estimate(question);
        estimateHtml = '<p class="estimate">Estimate: ' + est.prompt + ' = ' + est.answer + '</p>';
      }
    }

    let foot = '';
    if (last && session.est) {
      const est = topic().estimate(question);
      const answer = Math.round(question.answer * Math.pow(10, question.dp)) / Math.pow(10, question.dp);
      const shown = question.dp ? answer.toFixed(question.dp) : String(Math.round(answer));
      const gap = Math.abs(answer - est.answer);
      const close = gap <= Math.max(1, Math.abs(est.answer) * 0.15);
      foot = '<p class="closeness">' + (close
        ? shown + ' is close to the estimate of ' + est.answer + '.'
        : 'The answer is ' + shown + '. The estimate was ' + est.answer + '.') + '</p>';
    }

    const stepHtml = phase !== 'steps' ? '' : steps.map(function (s, i) {
      if (i > step) return '';
      let cls = 'step';
      if (i === step) cls += ' current';
      else cls += ' done';
      const body = s.kind === 'trade' || s.kind === 'lineup'
        ? '<p class="step-title">' + s.title + '</p><p>' + s.text + '</p>'
        : '<p>' + s.text + '</p>';
      return '<li class="' + cls + '"><span class="n">' + (i + 1) + '</span><div>' + body + '</div></li>';
    }).join('');

    let check = '';
    if (last) {
      const chips = topic().chipsFor(question).map(function (name, i) {
        const on = tag === name ? ' on' : '';
        return '<button type="button" class="chip' + on + '" data-tag="' + name + '">' + (i + 1) + ' · ' + name + '</button>';
      }).join('');
      check = '<section class="check"><h3>How did you go?</h3><div class="check-row">' +
        '<button type="button" class="choice right' + (choice === 'right' ? ' on' : '') + '" data-choice="right">' +
        EM.icons.check + ' I got it right</button>' +
        '<button type="button" class="choice wrong' + (choice === 'error' ? ' on' : '') + '" data-choice="error">I made an error</button>' +
        '</div>' + (choice === 'error'
          ? '<p class="which">Which step went wrong?</p><div class="chips">' + chips + '</div>'
          : '') + '</section>';
    }

    let strategy = '';
    if (last && session.strat) {
      strategy = '<aside class="strategy"><p class="eyebrow">One way in your head</p>' + topic().strategy(question) + '</aside>';
    }

    const showNext = last && choice;
    const actions = phase === 'estimate'
      ? '<button type="button" class="btn primary" id="showSolution">Show solution ' + EM.icons.arrow + '</button>'
      : (phase === 'layout'
        ? '<button type="button" class="btn primary" id="nextStep">Next step ' + EM.icons.arrow + '</button>'
        : '<button type="button" class="btn ghost" id="prevStep">Back</button>' +
          (last ? '' : '<button type="button" class="btn primary" id="nextStep">Next step ' + EM.icons.arrow + '</button>'));

    document.getElementById('app').innerHTML =
      '<div class="shell play"><header class="play-top"><button type="button" class="btn ghost" id="stop">' +
      EM.icons.close + ' Stop</button><div class="progress-wrap"><p>Level ' + session.level + ' · Question ' +
      (session.index + 1) + ' of ' + session.count + '</p><div class="progress" aria-hidden="true">' + segments +
      '</div></div>' + (question.tricky ? '<span class="tricky-tag">Tricky one</span>' : '<span></span>') + '</header>' +
      '<div class="work"><section class="paper"><p class="equation">' + (question.equation || (question.textA + ' − ' + question.textB)) + '</p>' +
      estimateHtml + '<div id="algo"></div>' + foot + '</section><section class="steps-col"><p class="eyebrow">The steps</p>' +
      (phase === 'steps' ? '<ol class="steps">' + stepHtml + '</ol>' : '<p class="wait-note">' +
        (phase === 'estimate' ? 'The working stays hidden until you are ready.' : 'Setting out is shown. Tap Next step to work through it.') + '</p>') +
      strategy + check + '</section></div><div class="action-row">' + actions +
      (showNext ? '<button type="button" class="btn primary" id="nextQ">' +
        (session.index + 1 >= session.count ? 'See summary' : 'Next question') + ' ' + EM.icons.arrow + '</button>' : '') +
      '</div></div>';

    if (phase !== 'estimate') topic().render(question, step, document.getElementById('algo'));

    document.getElementById('stop').onclick = function () { EM.home(); };
    const show = document.getElementById('showSolution');
    if (show) show.onclick = function () { phase = 'layout'; step = -1; paint(false); };
    const next = document.getElementById('nextStep');
    if (next) next.onclick = function () {
      phase = 'steps';
      step = Math.min(steps.length - 1, step + 1);
      paint(false);
    };
    const prev = document.getElementById('prevStep');
    if (prev) prev.onclick = function () {
      if (step <= 0) { phase = 'layout'; step = -1; }
      else step -= 1;
      paint(false);
    };
    document.querySelectorAll('[data-choice]').forEach(function (btn) {
      btn.onclick = function () {
        choice = btn.getAttribute('data-choice');
        if (choice === 'right') tag = null;
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
    if (scrollTop !== false) window.scrollTo(0, 0);
  }

  function commit() {
    const session = EM.session;
    session.results.push({
      correct: choice === 'right',
      tag: choice === 'error' ? tag : null,
      tricky: !!q().tricky
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
