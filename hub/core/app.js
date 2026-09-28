const EM = (function () {
  const topics = {};
  const prefs = { q: 8, est: true, strat: true, tricky: 0 };
  let link = null;
  let screen = 'home';

  const ICONS = {
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
    const q = qRaw >= 1 && qRaw <= 30 ? qRaw : 8;
    const est = params.get('est') === '0' ? false : true;
    const strat = params.get('strat') === '0' ? false : true;
    const trickyRaw = params.get('tricky');
    let tricky = trickyRaw == null || trickyRaw === ''
      ? (t === 'mix' ? 1 : 0)
      : parseInt(trickyRaw, 10);
    if (!isFinite(tricky) || tricky < 0) tricky = 0;
    if (tricky > 3) tricky = 3;
    const go = params.get('go') === '1';
    const ttl = cleanText(params.get('ttl'), 50);
    const msg = cleanText(params.get('msg'), 80);
    const fin = cleanText(params.get('fin'), 80);
    const due = parseDue(params.get('due'));
    const order = params.get('order') === 'm' ? 'm' : 'g';
    let seed = params.get('seed') || '';
    if (!/^[a-z0-9]{4,12}$/i.test(seed)) seed = '';
    const rows = parseSet(params.get('set'));
    const hasLink = t === 'mix' || rows.length > 0 || !!(t && topics[t] && lvl && !isNaN(lvl));
    return {
      t: t, lvl: lvl, q: rows.length ? rowsTotal(rows) : q,
      est: est, strat: strat, tricky: tricky, go: go,
      ttl: ttl, msg: msg, fin: fin, due: due, order: order, seed: seed, rows: rows, hasLink: hasLink
    };
  }

  function cleanText(raw, max) {
    return String(raw || '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
  }

  function parseDue(raw) {
    if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return '';
    const y = parseInt(raw.slice(0, 4), 10);
    const m = parseInt(raw.slice(5, 7), 10);
    const d = parseInt(raw.slice(8, 10), 10);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return '';
    return raw;
  }

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const SHORT = { add: 'Addition', sub: 'Subtraction', mul: 'Multiplication', pv: 'Place value', conv: 'Converting units' };

  function formatDue(iso) {
    if (!iso) return '';
    const y = parseInt(iso.slice(0, 4), 10);
    const m = parseInt(iso.slice(5, 7), 10);
    const d = parseInt(iso.slice(8, 10), 10);
    const date = new Date(y, m - 1, d);
    return WEEKDAYS[date.getDay()] + ' ' + d + ' ' + MONTHS[m - 1];
  }

  function duePassed(iso) {
    if (!iso) return false;
    const y = parseInt(iso.slice(0, 4), 10);
    const m = parseInt(iso.slice(5, 7), 10);
    const d = parseInt(iso.slice(8, 10), 10);
    const due = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }

  function parseSet(raw) {
    if (!raw) return [];
    const found = [];
    String(raw).split(',').forEach(function (part) {
      const match = String(part).trim().match(/^(add|sub|mul|pv|conv)(\d+)x(\d+)$/i);
      if (!match) return;
      const id = match[1].toLowerCase();
      const topic = topics[id];
      if (!topic) return;
      let level = parseInt(match[2], 10);
      let count = parseInt(match[3], 10);
      if (!isFinite(level) || level < 1) level = 1;
      if (level > topic.levels.length) level = topic.levels.length;
      if (!isFinite(count) || count < 1) count = 1;
      if (count > 20) count = 20;
      found.push({ topic: id, level: level, count: count });
    });
    const kept = [];
    let total = 0;
    found.slice(0, 6).forEach(function (row) {
      if (total >= 30) return;
      const room = 30 - total;
      const count = row.count > room ? room : row.count;
      if (count < 1) return;
      kept.push({ topic: row.topic, level: row.level, count: count });
      total += count;
    });
    return kept;
  }

  function rowsTotal(rows) {
    return (rows || []).reduce(function (n, row) { return n + row.count; }, 0);
  }

  function qPhrase(n) {
    return n + (n === 1 ? ' question' : ' questions');
  }

  function studentLine(rows) {
    return rows.map(function (row) {
      return (SHORT[row.topic] || row.topic) + ' \u00b7 ' + qPhrase(row.count);
    }).join(' \u00b7 ');
  }

  function setLine(rows, style) {
    if (style === 'student') return studentLine(rows);
    const bits = rows.map(function (row) {
      return (SHORT[row.topic] || row.topic) + ' L' + row.level + ' \u00d7' + row.count;
    });
    const total = rowsTotal(rows);
    const qWord = total === 1 ? 'question' : 'questions';
    if (style === 'paren') return bits.join(' \u00b7 ') + ' (' + total + ' ' + qWord + ')';
    return bits.join(' \u00b7 ') + ' \u00b7 ' + total + ' ' + qWord;
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
    const due = parseDue(info.due);
    const shared = { msg: info.msg || '', due: due, dueText: due ? formatDue(due) : '', dueLate: duePassed(due) };
    if (info.rows && info.rows.length) {
      const friendly = studentLine(info.rows);
      return {
        title: info.ttl || 'A set',
        detail: friendly,
        teams: friendly,
        cardLine: friendly,
        msg: shared.msg, due: shared.due, dueText: shared.dueText, dueLate: shared.dueLate
      };
    }
    if (info.t === 'mix') {
      const friendly = 'Daily mix \u00b7 ' + qPhrase(info.q);
      return {
        title: info.ttl || 'Daily mix',
        detail: friendly + trickyBit,
        teams: friendly,
        cardLine: friendly,
        msg: shared.msg, due: shared.due, dueText: shared.dueText, dueLate: shared.dueLate
      };
    }
    const topic = topics[info.t];
    const fallback = (topic ? topic.name : 'This practice') + ' · Level ' + info.lvl;
    const friendly = (topic ? topic.name : 'Practice') + ' \u00b7 ' + qPhrase(info.q);
    return {
      title: info.ttl || fallback,
      detail: friendly + trickyBit,
      teams: friendly,
      cardLine: friendly,
      msg: shared.msg, due: shared.due, dueText: shared.dueText, dueLate: shared.dueLate
    };
  }

  function teacherStrip(info, actions) {
    const described = describeLink(info);
    const due = described.dueText
      ? '<p class="teacher-due' + (described.dueLate ? ' late' : '') + '">Due ' + escapeHtml(described.dueText) + '</p>'
      : '';
    const msg = described.msg ? '<p class="teacher-msg">' + escapeHtml(described.msg) + '</p>' : '';
    return '<section class="teacher"><div><p class="eyebrow light">Your practice</p><h2>' +
      escapeHtml(described.title) + '</h2>' + due + '<p>' + escapeHtml(described.detail) + '</p>' + msg +
      '</div>' + (actions || '') + '</section>';
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
      '<div class="shell"><header class="top"><div class="brand">' + waveMark() + '<span>EmbedMaths</span></div>' +
      '<button type="button" class="btn ghost" id="classLink">' + ICONS.link + ' For teachers &amp; parents</button></header>' +
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
        if (link.rows && link.rows.length) {
          startSet(fromLink(link));
          return;
        }
        if (link.t === 'mix') {
          startMix(fromLink(link));
          return;
        }
        if (!topics[link.t]) {
          showNote('That topic is not ready yet.');
          return;
        }
        startSession(fromLink(link));
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
    const focus = opts.focus || null;
    const count = opts.count;
    const trickyN = focus ? 0 : Math.min(opts.tricky || 0, count);
    const questions = withSeed(opts.seed, function () {
      const list = [];
      for (let i = 0; i < count - trickyN; i++) {
        const made = topic.makeQuestion(level, { tricky: false, focus: focus });
        made.topicId = opts.topicId;
        list.push(made);
      }
      for (let i = 0; i < trickyN; i++) {
        const made = topic.makeQuestion(level, { tricky: true });
        made.topicId = opts.topicId;
        list.push(made);
      }
      return shuffle(list);
    });
    const meta = levelMeta(topic, level);
    EM.session = {
      topicId: opts.topicId,
      level: level,
      levelName: meta ? meta.name : '',
      count: questions.length,
      est: opts.est !== false,
      strat: opts.strat !== false,
      msg: opts.msg || '',
      title: opts.title || '',
      due: opts.due || '',
      fin: opts.fin || '',
      seed: opts.seed || '',
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
    let count = parseInt(opts.count, 10);
    if (!isFinite(count) || count < 1 || count > 30) count = 8;
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

  function hashSeed(text) {
    let h = 2166136261;
    const s = String(text);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function withSeed(seed, fn) {
    if (!seed) return fn();
    const prev = Math.random;
    let a = hashSeed(seed) || 1;
    Math.random = function () {
      a |= 0;
      a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    try { return fn(); }
    finally { Math.random = prev; }
  }

  function fromLink(info) {
    return {
      topicId: info.t,
      level: info.lvl,
      count: info.q,
      tricky: info.tricky,
      est: info.est,
      strat: info.strat,
      msg: info.msg,
      fin: info.fin,
      title: info.ttl,
      due: info.due,
      seed: info.seed,
      order: info.order,
      rows: info.rows
    };
  }

  function startSet(opts) {
    opts = opts || {};
    const rows = opts.rows || [];
    if (!rows.length) return;
    const questions = withSeed(opts.seed, function () {
      const list = [];
      rows.forEach(function (row) {
        const topic = topics[row.topic];
        if (!topic) return;
        let level = row.level;
        if (level < 1) level = 1;
        if (level > topic.levels.length) level = topic.levels.length;
        for (let i = 0; i < row.count; i++) {
          const made = topic.makeQuestion(level, { tricky: false });
          made.topicId = row.topic;
          made.mixLevel = level;
          list.push(made);
        }
      });
      return opts.order === 'm' ? shuffle(list) : list;
    });
    EM.session = {
      topicId: 'set',
      set: true,
      rows: rows,
      title: opts.title || '',
      due: opts.due || '',
      fin: opts.fin || '',
      msg: opts.msg || '',
      seed: opts.seed || '',
      order: opts.order === 'm' ? 'm' : 'g',
      level: 0,
      levelName: opts.title || 'Set',
      count: questions.length,
      est: opts.est !== false,
      strat: opts.strat !== false,
      focus: null,
      questions: questions,
      index: 0,
      results: []
    };
    screen = 'player';
    Player.open();
  }

  function startMix(opts) {
    opts = opts || {};
    const questions = withSeed(opts.seed, function () { return buildMixQuestions(opts); });
    EM.session = {
      topicId: 'mix',
      mix: true,
      level: 0,
      levelName: 'Daily mix',
      count: questions.length,
      est: opts.est !== false,
      strat: opts.strat !== false,
      msg: opts.msg || '',
      title: opts.title || '',
      due: opts.due || '',
      fin: opts.fin || '',
      seed: opts.seed || '',
      focus: null,
      questions: questions,
      index: 0,
      results: []
    };
    screen = 'player';
    Player.open();
  }

  let waveCount = 0;

  function waveMark() {
    waveCount += 1;
    const id = 'emWave' + waveCount;
    return '<svg class="waves" width="40" height="26" viewBox="4 3 40 26" fill="none" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#5CC6D0"/><stop offset="1" stop-color="#3A98A4"/>' +
      '</linearGradient></defs>' +
      '<path d="M12 8.5C16.5 6 20.5 7 24.5 11.5S33.5 17.5 39 11.5" stroke="url(#' + id + ')" stroke-width="3.3" stroke-linecap="round"/>' +
      '<path d="M9 19.5C13 13 17.5 12.5 21.5 16.5S31 23.5 38 18.5" stroke="#226E78" stroke-width="3.3" stroke-linecap="round"/>' +
      '</svg>';
  }

  const FEEDBACK_MAIL = (function () {
    const body = [
      'Hi Dave,',
      '',
      "I'm a: (teacher / parent / other)",
      'Year level:',
      'My idea or feedback:',
      '',
      '',
      'Thanks!'
    ].join('\r\n');
    return 'mailto:dave@flowstatelearning.com.au?subject=' +
      encodeURIComponent('EmbedMaths idea') + '&body=' + encodeURIComponent(body);
  })();

  function boot() {
    link = readLink();
    if (link.q === 5 || link.q === 8 || link.q === 10) prefs.q = link.q;
    prefs.est = link.est;
    prefs.strat = link.strat;
    prefs.tricky = link.tricky;
    if (link.go && link.rows && link.rows.length) {
      startSet(fromLink(link));
      return;
    }
    if (link.go && link.t === 'mix') {
      startMix(fromLink(link));
      return;
    }
    if (link.go && link.hasLink && topics[link.t]) {
      startSession(fromLink(link));
      return;
    }
    try {
      if (new URLSearchParams(window.location.search).get('teachers') === '1') {
        LinkBuilder.open();
        return;
      }
    } catch (err) {}
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
    startSet: startSet,
    buildMixQuestions: buildMixQuestions,
    formatDue: formatDue,
    setLine: setLine,
    rowsTotal: rowsTotal,
    shortName: function (id) { return SHORT[id] || id; },
    showNote: showNote,
    levelMeta: levelMeta,
    escapeHtml: escapeHtml,
    describeLink: describeLink,
    teacherStrip: teacherStrip,
    waveMark: waveMark,
    feedbackMail: FEEDBACK_MAIL
  };
})();
