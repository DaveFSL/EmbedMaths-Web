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
    const trickyRaw = params.get('tricky');
    let tricky = trickyRaw == null || trickyRaw === ''
      ? (t === 'mix' ? 1 : 0)
      : parseInt(trickyRaw, 10);
    if (!isFinite(tricky) || tricky < 0) tricky = 0;
    if (tricky > 3) tricky = 3;
    const go = params.get('go') === '1';
    let msg = params.get('msg') || '';
    msg = msg.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 40);
    const hasLink = t === 'mix' || !!(t && lvl && !isNaN(lvl));
    return { t: t, lvl: lvl, q: q, est: est, strat: strat, tricky: tricky, go: go, msg: msg, hasLink: hasLink };
  }

  function escapeHtml(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function describeLink(info) {
    const qWord = info.q === 1 ? 'question' : 'questions';
    const trickyBit = info.tricky ? ', including ' + info.tricky + ' tricky' : '';
    if (info.t === 'mix') {
      return {
        title: 'Daily mix',
        detail: info.q + ' ' + qWord + ' across the topics' + trickyBit,
        msg: info.msg || ''
      };
    }
    const topic = topics[info.t];
    const meta = topic ? levelMeta(topic, info.lvl) : null;
    const title = (topic ? topic.name : 'This practice') + ' · Level ' + info.lvl;
    const detail = meta
      ? meta.name + ', like ' + meta.example + ' · ' + info.q + ' ' + qWord + trickyBit
      : 'Level ' + info.lvl + ' · ' + info.q + ' ' + qWord;
    return { title: title, detail: detail, msg: info.msg || '' };
  }

  function teacherStrip(info, actions) {
    const described = describeLink(info);
    const msg = described.msg ? '<p class="teacher-msg">' + escapeHtml(described.msg) + '</p>' : '';
    return '<section class="teacher"><div><p class="eyebrow light">Set by your teacher</p><h2>' +
      escapeHtml(described.title) + '</h2>' + msg + '<p>' + escapeHtml(described.detail) + '</p></div>' +
      (actions || '') + '</section>';
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
    const conv = topics.conv;
    const convMeta = 'Level ' + Store.progressFor('conv').level + ' of ' + conv.levels.length;
    let strip = '';
    if (link && link.hasLink) {
      strip = teacherStrip(link, '<div class="teacher-actions"><button type="button" class="btn light" id="teacherStart">Start ' +
        ICONS.arrow + '</button><button type="button" class="btn dark" id="dailyMix">Daily mix instead</button></div>');
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
      tile(ICONS.ruler, 'Converting units', convMeta, { action: 'conv' }) +
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
    const convBtn = app.querySelector('[data-go="conv"]');
    if (convBtn) convBtn.onclick = function () { openLevels('conv'); };
    document.getElementById('classLink').onclick = function () { LinkBuilder.open(); };
    const start = document.getElementById('teacherStart');
    if (start) {
      start.onclick = function () {
        if (link.t === 'mix') {
          startMix({ count: link.q, tricky: link.tricky, est: link.est, strat: link.strat, msg: link.msg });
          return;
        }
        if (!topics[link.t]) {
          showNote('That topic is not ready yet.');
          return;
        }
        startSession({
          topicId: link.t,
          level: link.lvl,
          count: link.q,
          tricky: link.tricky,
          est: link.est,
          strat: link.strat,
          msg: link.msg
        });
      };
    }
    const mix = document.getElementById('dailyMix');
    if (mix) mix.onclick = function () {
      startMix({ count: 8, tricky: 1, est: true, strat: true, msg: link.msg });
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
      const made = topic.makeQuestion(level, { tricky: false, focus: focus });
      made.topicId = opts.topicId;
      questions.push(made);
    }
    for (let i = 0; i < trickyN; i++) {
      const made = topic.makeQuestion(level, { tricky: true });
      made.topicId = opts.topicId;
      questions.push(made);
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
      msg: opts.msg || '',
      focus: focus,
      questions: questions,
      index: 0,
      results: []
    };
    screen = 'player';
    Player.open();
  }

  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  function mixLevel(topicId) {
    const topic = topics[topicId];
    let level = topicId === 'conv' ? 2 : 3;
    const row = Store.load().progress[topicId];
    if (row && typeof row.level === 'number') level = row.level;
    if (level < 1) level = 1;
    if (topic && level > topic.levels.length) level = topic.levels.length;
    return level;
  }

  function buildMixQuestions(opts) {
    const ids = ['add', 'sub', 'mul', 'pv', 'conv'];
    const count = opts.count === 5 || opts.count === 10 ? opts.count : 8;
    let trickyN = opts.tricky == null ? 1 : opts.tricky;
    if (!isFinite(trickyN) || trickyN < 0) trickyN = 0;
    if (trickyN > count) trickyN = count;
    if (trickyN > 3) trickyN = 3;
    const counts = {};
    ids.forEach(function (id) { counts[id] = 0; });
    let left = count;
    shuffle(ids.slice()).forEach(function (id) {
      if (left <= 0) return;
      counts[id] += 1;
      left -= 1;
    });
    shuffle(ids.slice()).forEach(function (id) {
      if (left <= 0 || counts[id] >= 2) return;
      counts[id] += 1;
      left -= 1;
    });
    const slots = [];
    ids.forEach(function (id) {
      for (let i = 0; i < counts[id]; i++) slots.push(id);
    });
    shuffle(slots);
    const trickyAt = {};
    shuffle(slots.map(function (_, i) { return i; })).slice(0, trickyN).forEach(function (i) {
      trickyAt[i] = true;
    });
    return slots.map(function (id, i) {
      const level = mixLevel(id);
      const made = topics[id].makeQuestion(level, { tricky: !!trickyAt[i] });
      made.topicId = id;
      made.mixLevel = level;
      return made;
    });
  }

  function startMix(opts) {
    opts = opts || {};
    const questions = buildMixQuestions(opts);
    EM.session = {
      topicId: 'mix',
      mix: true,
      level: 0,
      levelName: 'Daily mix',
      count: questions.length,
      est: opts.est !== false,
      strat: opts.strat !== false,
      msg: opts.msg || '',
      focus: null,
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
    if (link.go && link.t === 'mix') {
      startMix({ count: link.q, tricky: link.tricky, est: link.est, strat: link.strat, msg: link.msg });
      return;
    }
    if (link.go && link.hasLink && topics[link.t]) {
      startSession({
        topicId: link.t,
        level: link.lvl,
        count: link.q,
        tricky: link.tricky,
        est: link.est,
        strat: link.strat,
        msg: link.msg
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
    startMix: startMix,
    buildMixQuestions: buildMixQuestions,
    showNote: showNote,
    levelMeta: levelMeta,
    escapeHtml: escapeHtml,
    describeLink: describeLink,
    teacherStrip: teacherStrip
  };
})();
