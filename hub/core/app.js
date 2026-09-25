const EM = (function () {
  const topics = {};
  const prefs = { q: 8, est: true, strat: true, tricky: 0 };
  let link = null;
  let screen = 'home';

  const ICONS = {
    wave: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 20c2.2-3.2 3.6-3.2 5.4 0s3.4 3.2 5.2 0 3.2-3.2 5.4 0 3.4 3.2 5.6 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    times: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    divide: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7" r="1.3" fill="currentColor"/><circle cx="12" cy="17" r="1.3" fill="currentColor"/></svg>',
    place: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8h4M7 12h10M7 16h7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M15 6l2 2-2 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ruler: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 7v3M11 7v4M15 7v3M19 7v4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v5l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3L6 13h6l-1 8 7-10h-6l1-8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    out: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M7 17L17 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  };

  function readLink() {
    let params;
    try { params = new URLSearchParams(window.location.search); }
    catch (err) { params = new URLSearchParams(); }
    const t = params.get('t');
    const lvlRaw = params.get('lvl');
    const lvl = lvlRaw ? parseInt(lvlRaw, 10) : null;
    const qRaw = parseInt(params.get('q') || '', 10);
    const q = qRaw === 5 || qRaw === 8 || qRaw === 10 ? qRaw : 8;
    const est = params.get('est') === '0' ? false : true;
    const strat = params.get('strat') === '0' ? false : true;
    let tricky = parseInt(params.get('tricky') || '0', 10);
    if (!isFinite(tricky) || tricky < 0) tricky = 0;
    if (tricky > 3) tricky = 3;
    const go = params.get('go') === '1';
    const hasLink = !!(t && lvl && !isNaN(lvl));
    return { t: t, lvl: lvl, q: q, est: est, strat: strat, tricky: tricky, go: go, hasLink: hasLink };
  }

  function levelMeta(topic, level) {
    if (!topic) return null;
    for (let i = 0; i < topic.levels.length; i++) {
      if (topic.levels[i].id === level) return topic.levels[i];
    }
    return null;
  }

  function showNote(text) {
    const note = document.getElementById('note');
    note.classList.remove('hidden');
    note.innerHTML = '<div class="modal-card"><p id="noteText">' + text + '</p><button type="button" class="btn primary" id="noteOk">OK</button></div>';
    document.getElementById('noteOk').onclick = function () { note.classList.add('hidden'); };
  }

  function tile(icon, name, meta, opts) {
    const soon = opts.soon;
    const href = opts.href;
    const action = opts.action;
    const cls = 'tile' + (soon ? ' soon' : '') + (opts.warm ? ' warm' : '');
    const body = '<span class="tile-icon">' + icon + '</span><span class="tile-copy"><span class="tile-name">' + name +
      '</span><span class="tile-meta">' + meta + '</span></span>' + (opts.warm ? '<span class="tile-go">' + ICONS.out + '</span>' : '');
    if (href) return '<a class="' + cls + '" href="' + href + '" target="_blank" rel="noopener noreferrer">' + body + '</a>';
    if (soon) return '<div class="' + cls + '">' + body + '</div>';
    return '<button type="button" class="' + cls + '" data-go="' + action + '">' + body + '</button>';
  }

  function renderHome() {
    screen = 'home';
    const sub = topics.sub;
    const add = topics.add;
    const mul = topics.mul;
    const pv = topics.pv;
    const prog = Store.progressFor('sub');
    const subMeta = 'Level ' + prog.level + ' of ' + sub.levels.length;
    const addMeta = 'Level ' + Store.progressFor('add').level + ' of ' + add.levels.length;
    const mulMeta = 'Level ' + Store.progressFor('mul').level + ' of ' + mul.levels.length;
    const pvMeta = 'Level ' + Store.progressFor('pv').level + ' of ' + pv.levels.length;
    let strip = '';
    if (link && link.hasLink) {
      const topic = topics[link.t];
      const meta = topic ? levelMeta(topic, link.lvl) : null;
      const title = (topic ? topic.name : 'This practice') + ' · Level ' + link.lvl;
      const detail = meta
        ? meta.name + ', like ' + meta.example + ' · ' + link.q + ' question' + (link.q === 1 ? '' : 's') +
          (link.tricky ? ', including ' + link.tricky + ' tricky' : '')
        : 'Level ' + link.lvl + ' · ' + link.q + ' questions';
      strip = '<section class="teacher"><div><p class="eyebrow light">Set by your teacher</p><h2>' + title +
        '</h2><p>' + detail + '</p></div><div class="teacher-actions"><button type="button" class="btn light" id="teacherStart">Start ' +
        ICONS.arrow + '</button><button type="button" class="btn dark" id="dailyMix">Daily mix instead</button></div></section>';
    }
    const app = document.getElementById('app');
    app.innerHTML =
      '<div class="shell"><header class="top"><div class="brand"><span class="logo">' + ICONS.wave + '</span><span>EmbedMaths</span></div>' +
      '<button type="button" class="btn ghost" id="classLink">' + ICONS.link + ' Make a class link</button></header>' +
      strip +
      '<div class="home-grid"><section class="panel wide"><div class="panel-head"><h2>Written methods</h2><p>Work it out, then check each step</p></div>' +
      '<div class="tile-grid">' +
      tile(ICONS.plus, 'Addition', addMeta, { action: 'add' }) +
      tile(ICONS.minus, 'Subtraction', subMeta, { action: 'sub' }) +
      tile(ICONS.times, 'Multiplication', mulMeta, { action: 'mul' }) +
      tile(ICONS.divide, 'Division', 'Coming soon', { soon: true }) +
      '</div></section><div class="side-col">' +
      '<section class="panel"><h2>Place value</h2><div class="tile-row">' +
      tile(ICONS.place, '× and ÷ by 10, 100, 1000', pvMeta, { action: 'pv' }) +
      '</div></section>' +
      '<section class="panel"><h2>Measurement</h2><div class="tile-row two">' +
      tile(ICONS.ruler, 'Converting units', 'Coming soon', { soon: true }) +
      tile(ICONS.clock, 'Time', 'Coming soon', { soon: true }) +
      '</div></section>' +
      '<section class="panel"><h2>Number facts</h2><div class="tile-row">' +
      tile(ICONS.bolt, 'Times tables', 'Open FlashFlips', { href: 'https://davefsl.github.io/FlashFlips-Web/', warm: true }) +
      '</div></section></div></div>' +
      '<p class="foot">Progress is saved on this device only.</p>' +
      '<p class="ver">' + VERSION + '</p></div>';

    const subBtn = app.querySelector('[data-go="sub"]');
    if (subBtn) subBtn.onclick = function () { openLevels('sub'); };
    const addBtn = app.querySelector('[data-go="add"]');
    if (addBtn) addBtn.onclick = function () { openLevels('add'); };
    const mulBtn = app.querySelector('[data-go="mul"]');
    if (mulBtn) mulBtn.onclick = function () { openLevels('mul'); };
    const pvBtn = app.querySelector('[data-go="pv"]');
    if (pvBtn) pvBtn.onclick = function () { openLevels('pv'); };
    document.getElementById('classLink').onclick = function () {
      showNote('The class link builder is coming in a later step.');
    };
    const start = document.getElementById('teacherStart');
    if (start) {
      start.onclick = function () {
        if (!topics[link.t]) {
          showNote('That topic is coming in a later step. Subtraction is ready now.');
          return;
        }
        startSession({
          topicId: link.t,
          level: link.lvl,
          count: link.q,
          tricky: link.tricky,
          est: link.est,
          strat: link.strat
        });
      };
    }
    const mix = document.getElementById('dailyMix');
    if (mix) mix.onclick = function () {
      showNote('Daily mix across topics is coming in a later step.');
    };
    window.scrollTo(0, 0);
  }

  function openLevels(topicId) {
    screen = 'levels';
    const topic = topics[topicId];
    let selected = Store.progressFor(topicId).level;
    if (link && link.hasLink && link.t === topicId) selected = link.lvl;
    if (selected < 1 || selected > topic.levels.length) selected = 1;
    Levels.open(topic, selected);
    window.scrollTo(0, 0);
  }

  function startSession(opts) {
    const topic = topics[opts.topicId];
    if (!topic) return;
    let level = opts.level;
    if (level < 1) level = 1;
    if (level > topic.levels.length) level = topic.levels.length;
    const questions = [];
    const focus = opts.focus || null;
    const count = opts.count;
    const trickyN = focus ? 0 : Math.min(opts.tricky || 0, count);
    for (let i = 0; i < count - trickyN; i++) {
      questions.push(topic.makeQuestion(level, { tricky: false, focus: focus }));
    }
    for (let i = 0; i < trickyN; i++) {
      questions.push(topic.makeQuestion(level, { tricky: true }));
    }
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = questions[i];
      questions[i] = questions[j];
      questions[j] = tmp;
    }
    const meta = levelMeta(topic, level);
    EM.session = {
      topicId: opts.topicId,
      level: level,
      levelName: meta ? meta.name : '',
      count: questions.length,
      est: opts.est !== false,
      strat: opts.strat !== false,
      focus: focus,
      questions: questions,
      index: 0,
      results: []
    };
    screen = 'player';
    Player.open();
  }

  function boot() {
    link = readLink();
    prefs.q = link.q;
    prefs.est = link.est;
    prefs.strat = link.strat;
    prefs.tricky = link.tricky;
    if (link.go && link.hasLink && topics[link.t]) {
      startSession({
        topicId: link.t,
        level: link.lvl,
        count: link.q,
        tricky: link.tricky,
        est: link.est,
        strat: link.strat
      });
      return;
    }
    renderHome();
  }

  return {
    topics: topics,
    prefs: prefs,
    icons: ICONS,
    registerTopic: function (topic) { topics[topic.id] = topic; },
    boot: boot,
    home: renderHome,
    openLevels: openLevels,
    startSession: startSession,
    showNote: showNote,
    levelMeta: levelMeta
  };
})();
