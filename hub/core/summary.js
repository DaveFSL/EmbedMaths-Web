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

  function completedStamp() {
    const d = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    let h = d.getHours();
    const am = h < 12 ? 'am' : 'pm';
    h = h % 12 || 12;
    const min = String(d.getMinutes()).padStart(2, '0');
    return days[d.getDay()] + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + ', ' + h + ':' + min + ' ' + am;
  }

  function weakestChip(results) {
    const errors = {};
    results.forEach(function (r) {
      if (r && !r.correct && r.tag) errors[r.tag] = (errors[r.tag] || 0) + 1;
    });
    let top = '';
    let n = 0;
    Object.keys(errors).forEach(function (tag) {
      if (errors[tag] > n) { top = tag; n = errors[tag]; }
    });
    return top;
  }

  function scoreParts(results, order) {
    const by = {};
    results.forEach(function (r) {
      const id = r.topicId;
      if (!id) return;
      if (!by[id]) by[id] = { right: 0, of: 0 };
      by[id].of += 1;
      if (r.correct) by[id].right += 1;
    });
    const ids = [];
    (order || []).forEach(function (id) { if (by[id] && ids.indexOf(id) < 0) ids.push(id); });
    Object.keys(by).forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); });
    const parts = [];
    let weakest = null;
    ids.forEach(function (id) {
      const row = by[id];
      const name = EM.topics[id] ? EM.topics[id].name : id;
      parts.push(name + ' ' + row.right + '/' + row.of);
      const share = row.of ? row.right / row.of : 1;
      const miss = row.of - row.right;
      if (!weakest || share < weakest.share || (share === weakest.share && miss > weakest.miss)) {
        weakest = { name: name, share: share, miss: miss };
      }
    });
    return { parts: parts, weakest: weakest };
  }

  function scoreHeading(score, total) {
    if (score === total) return 'All ' + total + ' correct!';
    return score + ' out of ' + total;
  }

  function finishLine(session) {
    const text = (session.fin && String(session.fin).trim()) ||
      'Take a screenshot of this card and share it with your teacher.';
    return '<p class="hw-fin">' + EM.escapeHtml(text) + '</p>';
  }

  function hwCard(session, score, total, parts) {
    if (!(session.set || session.title || session.due || session.fin)) return '';
    const title = session.title || (session.set ? 'A set' : (session.levelName || 'Homework'));
    const due = session.due ? '<p>Due: ' + EM.escapeHtml(EM.formatDue(session.due)) + '</p>' : '';
    return '<section class="hw-card" id="homeworkCard"><p class="eyebrow">Homework done</p><h2>' +
      EM.escapeHtml(title) + '</h2>' + due +
      '<p>Completed ' + completedStamp() + '</p>' +
      '<p class="hw-score">' + scoreHeading(score, total) + '</p>' +
      '<p>' + parts.join(' · ') + '</p>' +
      finishLine(session) + '</section>';
  }

  function openMix() {
    const session = EM.session;
    const score = session.results.filter(function (r) { return r.correct; }).length;
    const total = session.results.length;
    const grouped = scoreParts(session.results, ['add', 'sub', 'mul', 'pv', 'conv']);
    const parts = grouped.parts;
    const weakest = grouped.weakest;
    Store.appendHistory({ t: 'mix', lvl: 0, date: today(), score: score, of: total, errors: {} });
    const tiles = session.results.map(function (r, i) {
      if (r.correct) return '<li class="q-tile good"><span>Q' + (i + 1) + '</span>' + EM.icons.check + '</li>';
      const name = EM.topics[r.topicId] ? EM.topics[r.topicId].name : 'Error';
      return '<li class="q-tile bad"><span>Q' + (i + 1) + '</span><b>' + (r.tag || name) + '</b></li>';
    }).join('');
    const allRight = score === total;
    const watch = allRight
      ? ''
      : '<section class="watch"><p class="eyebrow warn">What to watch</p><h2>' + weakest.name + ' was the weakest.</h2><p>' + parts.join(' · ') + '</p></section>';
    const recent = Store.recentScores('mix', 5);
    document.getElementById('app').innerHTML =
      '<div class="shell summary"><p class="eyebrow">Daily mix</p><h1>' + scoreHeading(score, total) + '</h1>' +
      hwCard(session, score, total, parts) +
      '<ol class="q-row">' + tiles + '</ol><div class="summary-grid">' + watch +
      '<section class="next-card"><p class="eyebrow light">Next time</p><h2>Each topic stays on its saved level.</h2>' +
      '<p>A daily mix uses the level saved on this device for each topic.</p>' +
      '<button type="button" class="btn light" id="homeBtn">Back to home</button></section></div>' +
      '<footer class="summary-foot"><span>Show your teacher: this summary is saved on this device.</span><span>Last 5 sessions: ' +
      (recent.length ? recent.join(', ') : 'none yet') + '</span></footer></div>';
    document.getElementById('homeBtn').onclick = function () { EM.home(); };
    window.scrollTo(0, 0);
  }

  function openSet() {
    const session = EM.session;
    const score = session.results.filter(function (r) { return r.correct; }).length;
    const total = session.results.length;
    const order = (session.rows || []).map(function (row) { return row.topic; });
    const grouped = scoreParts(session.results, order);
    Store.appendHistory({ t: 'set', lvl: 0, date: today(), score: score, of: total, errors: {} });
    const tiles = session.results.map(function (r, i) {
      if (r.correct) return '<li class="q-tile good"><span>Q' + (i + 1) + '</span>' + EM.icons.check + '</li>';
      return '<li class="q-tile bad"><span>Q' + (i + 1) + '</span><b>' + (r.tag || 'Error') + '</b></li>';
    }).join('');
    const allRight = score === total;
    const watch = allRight
      ? ''
      : '<section class="watch"><p class="eyebrow warn">What to watch</p><h2>' + grouped.weakest.name + ' was the weakest.</h2><p>' + grouped.parts.join(' · ') + '</p></section>';
    document.getElementById('app').innerHTML =
      '<div class="shell summary"><p class="eyebrow">Set by your teacher</p>' +
      hwCard(session, score, total, grouped.parts) +
      '<h1>' + scoreHeading(score, total) + '</h1><ol class="q-row">' + tiles + '</ol>' +
      (watch ? '<div class="summary-grid">' + watch + '</div>' : '') +
      '<button type="button" class="btn ghost" id="homeBtn">Back to home</button></div>';
    document.getElementById('homeBtn').onclick = function () { EM.home(); };
    window.scrollTo(0, 0);
  }

  function open() {
    const session = EM.session;
    if (session.set) { openSet(); return; }
    if (session.mix) { openMix(); return; }
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
        : '');

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
      '</p><h1>' + scoreHeading(score, total) + '</h1>' +
      hwCard(session, score, total, [topic.name + ' ' + score + '/' + total]) +
      extLine + '<ol class="q-row">' + tiles + '</ol>' +
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
