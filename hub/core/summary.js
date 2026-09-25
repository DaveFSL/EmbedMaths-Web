const Summary = (function () {
  function today() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function watchLine(tag, count, all) {
    const name = tag === 'Trading' ? 'trading step' : tag.toLowerCase() + ' step';
    if (all && count === 1) return 'The error was in the ' + name + '.';
    if (all && count === 2) return 'Both errors were in the ' + name + '.';
    return count + (count === 1 ? ' error was' : ' errors were') + ' in the ' + name + '.';
  }

  function open() {
    const session = EM.session;
    const topic = EM.topics[session.topicId];
    const score = session.results.filter(function (r) { return r.correct; }).length;
    const total = session.results.length;
    const errors = {};
    session.results.forEach(function (r) {
      if (!r.correct && r.tag) errors[r.tag] = (errors[r.tag] || 0) + 1;
    });
    const saved = Store.recordSession({
      t: session.topicId,
      lvl: session.level,
      date: today(),
      score: score,
      of: total,
      errors: errors
    });
    const next = topic.levels.filter(function (level) { return level.id === session.level + 1; })[0];
    const suggestNext = saved.streak >= 2 && !!next;
    const counts = Object.keys(errors).map(function (key) { return { tag: key, n: errors[key] }; });
    counts.sort(function (a, b) {
      if (b.n !== a.n) return b.n - a.n;
      return topic.errorTags.indexOf(a.tag) - topic.errorTags.indexOf(b.tag);
    });
    const top = counts[0];
    const errorCount = session.results.filter(function (r) { return !r.correct; }).length;

    const tiles = session.results.map(function (r, i) {
      if (r.correct) {
        return '<li class="q-tile good"><span>Q' + (i + 1) + '</span>' + EM.icons.check + '</li>';
      }
      return '<li class="q-tile bad"><span>Q' + (i + 1) + '</span><b>' + (r.tag || 'Error') + '</b></li>';
    }).join('');

    const watch = top
      ? '<section class="watch"><p class="eyebrow warn">What to watch</p><h2>' + watchLine(top.tag, top.n, top.n === errorCount) +
        '</h2><p>' + (topic.tips[top.tag] || '') + '</p><button type="button" class="btn peach" id="more">Try 4 more like these</button></section>'
      : (errorCount
        ? '<section class="watch"><p class="eyebrow warn">What to watch</p><h2>' + errorCount + (errorCount === 1 ? ' error was' : ' errors were') + ' marked.</h2><p>No step was chosen, so there is no pattern to show yet.</p></section>'
        : '<section class="watch"><p class="eyebrow warn">What to watch</p><h2>Every question was right.</h2><p>Nothing to go over from this round.</p></section>');

    const nextHtml = suggestNext
      ? '<h2>Try Level ' + next.id + ' tomorrow.</h2><p>You scored 7 or more twice in a row. Level ' + next.id + ', ' + next.name.toLowerCase() + ', is suggested next.</p>'
      : '<h2>Stay on Level ' + session.level + ' tomorrow.</h2><p>' + (next
        ? 'Get 7 or more twice in a row and Level ' + next.id + ', ' + next.name.toLowerCase() + ', is suggested next.'
        : 'This is the last subtraction level. Another strong round will keep it steady.') + '</p>';

    const recent = Store.recentScores(session.topicId, 5);
    const ext = Store.extensionsFor(session.topicId);
    const extLine = ext ? '<p class="ext-line">Extensions: ' + ext.score + ' of ' + ext.of + '</p>' : '';
    document.getElementById('app').innerHTML =
      '<div class="shell summary"><p class="eyebrow">' + topic.name + ' · Level ' + session.level + ' · ' + session.levelName +
      '</p><h1>' + score + ' out of ' + total + '. Nice work.</h1>' + extLine + '<ol class="q-row">' + tiles + '</ol>' +
      '<div class="summary-grid">' + watch + '<section class="next-card"><p class="eyebrow light">Next time</p>' +
      nextHtml + '<button type="button" class="btn light" id="homeBtn">Back to home</button></section></div>' +
      '<footer class="summary-foot"><span>Show your teacher: this summary is saved on this device.</span><span>Last 5 sessions: ' +
      (recent.length ? recent.join(', ') : 'none yet') + '</span></footer></div>';

    document.getElementById('homeBtn').onclick = function () { EM.home(); };
    const more = document.getElementById('more');
    if (more) {
      more.onclick = function () {
        EM.startSession({
          topicId: session.topicId,
          level: session.level,
          count: 4,
          tricky: 0,
          est: session.est,
          strat: session.strat,
          focus: top.tag
        });
      };
    }
    window.scrollTo(0, 0);
  }

  return { open: open };
})();
