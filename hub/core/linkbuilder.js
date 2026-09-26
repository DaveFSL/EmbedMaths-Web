/* Teacher and parent class links, with a QR code drawn in the page. */
const LinkBuilder = (function () {
  const TOPICS = [
    { id: 'add', label: 'Addition' },
    { id: 'sub', label: 'Subtraction' },
    { id: 'mul', label: 'Multiplication' },
    { id: 'pv', label: '× ÷ 10, 100, 1000' },
    { id: 'conv', label: 'Converting units' },
    { id: 'mix', label: 'Daily mix' }
  ];
  const state = { topic: 'sub', level: 6, q: 8, tricky: 2, est: true, strat: true, msg: '' };

  function usesWritten(id) {
    return id === 'add' || id === 'sub' || id === 'mul' || id === 'mix';
  }

  function cleanMsg(raw) {
    return String(raw || '').replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 40);
  }

  function pageBase() {
    return window.location.origin + window.location.pathname;
  }

  function currentLink() {
    const params = new URLSearchParams();
    params.set('t', state.topic);
    if (state.topic !== 'mix') params.set('lvl', String(state.level));
    params.set('q', String(state.q));
    const written = usesWritten(state.topic);
    params.set('est', written && state.est ? '1' : '0');
    params.set('strat', written && state.strat ? '1' : '0');
    params.set('tricky', String(state.tricky));
    params.set('go', '1');
    const msg = state.msg.trim();
    if (msg) params.set('msg', msg);
    return pageBase() + '?' + params.toString();
  }

  function qrSvg(text) {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 8, scalable: true });
  }

  function previewHtml() {
    const info = {
      t: state.topic,
      lvl: state.level,
      q: state.q,
      tricky: state.tricky,
      msg: state.msg.trim()
    };
    const actions = '<div class="teacher-actions"><span class="btn light">Start ' + EM.icons.arrow +
      '</span><span class="btn dark">Daily mix instead</span></div>';
    return EM.teacherStrip(info, actions);
  }

  function levelOptions() {
    if (state.topic === 'mix') return '';
    const topic = EM.topics[state.topic];
    return topic.levels.map(function (level) {
      const label = 'Level ' + level.id + ' · ' + level.name + ' — ' + level.example;
      return '<option value="' + level.id + '"' + (level.id === state.level ? ' selected' : '') + '>' +
        EM.escapeHtml(label) + '</option>';
    }).join('');
  }

  function seg(name, value, options, label) {
    return '<div class="seg" role="radiogroup" aria-label="' + label + '">' +
      options.map(function (opt) {
        const on = String(opt.value) === String(value);
        return '<label class="seg-opt' + (on ? ' on' : '') + '"><input type="radio" name="' + name +
          '" value="' + opt.value + '"' + (on ? ' checked' : '') + '><span>' + opt.label + '</span></label>';
      }).join('') + '</div>';
  }

  function paint() {
    const written = usesWritten(state.topic);
    const pills = TOPICS.map(function (topic) {
      return '<button type="button" class="topic-pill' + (topic.id === state.topic ? ' on' : '') +
        '" data-topic="' + topic.id + '">' + topic.label + '</button>';
    }).join('');
    document.getElementById('app').innerHTML =
      '<div class="shell builder"><div class="picker-top"><button type="button" class="btn ghost" id="backHome">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Home</button>' +
      '<span class="builder-for">For teachers and parents</span></div>' +
      '<h1>Make a class link</h1><p class="lede">Choose the practice, then share the link. Students land straight on it.</p>' +
      '<div class="link-layout"><section class="panel builder-form"><div class="field"><span class="field-label">Topic</span>' +
      '<div class="topic-pills">' + pills + '</div></div>' +
      '<div class="field" id="levelField"' + (state.topic === 'mix' ? ' hidden' : '') + '><label class="field-label" for="levelPick">Level</label>' +
      '<select id="levelPick" class="level-select">' + levelOptions() + '</select></div>' +
      '<div class="field-row"><div class="field"><span class="field-label">Questions</span>' +
      seg('q', state.q, [{ value: 5, label: '5' }, { value: 8, label: '8' }, { value: 10, label: '10' }], 'Questions') +
      '</div><div class="field"><span class="field-label">Add tricky ones</span>' +
      seg('tricky', state.tricky, [{ value: 0, label: '0' }, { value: 1, label: '1' }, { value: 2, label: '2' }], 'Tricky questions') +
      '</div></div>' +
      '<div class="field" id="writtenToggles"' + (written ? '' : ' hidden') + '>' +
      '<label class="check-line"><input type="checkbox" id="estOn"' + (state.est ? ' checked' : '') + '> Estimate first</label>' +
      '<label class="check-line"><input type="checkbox" id="stratOn"' + (state.strat ? ' checked' : '') + '> Show a mental strategy after the solution</label>' +
      '</div>' +
      '<div class="field"><label class="field-label" for="classMsg">Message for students</label>' +
      '<input id="classMsg" class="msg-input" maxlength="40" placeholder="Mr Cox\'s class — warm-up" value="' +
      EM.escapeHtml(state.msg) + '"><p class="msg-count"><span id="msgCount">' + state.msg.length + '</span>/40</p></div>' +
      '<div class="field"><span class="field-label">How students see it</span><div id="stripPreview">' + previewHtml() +
      '</div></div></section>' +
      '<aside class="link-card"><p class="eyebrow light">Your link</p><p class="link-url" id="classUrl"></p>' +
      '<button type="button" class="btn light" id="copyLink">Copy link</button>' +
      '<div class="qr-row"><div class="qr-box" id="qrBox"></div><p>Put the QR code on the board so students can scan it, or post the link in your class stream.</p></div>' +
      '<button type="button" class="btn light" id="showBoard">Show on the board</button></aside></div></div>';

    document.getElementById('backHome').onclick = function () { EM.home(); };
    document.querySelectorAll('[data-topic]').forEach(function (btn) {
      btn.onclick = function () {
        state.topic = btn.getAttribute('data-topic');
        if (state.topic !== 'mix') {
          const topic = EM.topics[state.topic];
          if (state.level > topic.levels.length) state.level = topic.levels.length;
          if (state.level < 1) state.level = 1;
        }
        paint();
      };
    });
    const levelPick = document.getElementById('levelPick');
    if (levelPick) levelPick.onchange = function () {
      state.level = parseInt(levelPick.value, 10);
      refresh();
    };
    document.querySelectorAll('input[name="q"]').forEach(function (input) {
      input.onchange = function () {
        state.q = parseInt(input.value, 10);
        paint();
      };
    });
    document.querySelectorAll('input[name="tricky"]').forEach(function (input) {
      input.onchange = function () {
        state.tricky = parseInt(input.value, 10);
        paint();
      };
    });
    const estOn = document.getElementById('estOn');
    if (estOn) estOn.onchange = function () { state.est = estOn.checked; refresh(); };
    const stratOn = document.getElementById('stratOn');
    if (stratOn) stratOn.onchange = function () { state.strat = stratOn.checked; refresh(); };
    const msg = document.getElementById('classMsg');
    msg.oninput = function () {
      state.msg = cleanMsg(msg.value);
      if (msg.value !== state.msg) msg.value = state.msg;
      document.getElementById('msgCount').textContent = String(state.msg.length);
      refresh();
    };
    document.getElementById('copyLink').onclick = function () { copyLink(this); };
    document.getElementById('showBoard').onclick = openBoard;
    refresh();
    window.scrollTo(0, 0);
  }

  function refresh() {
    const url = currentLink();
    const urlEl = document.getElementById('classUrl');
    if (!urlEl) return;
    urlEl.textContent = url;
    document.getElementById('qrBox').innerHTML = qrSvg(url);
    document.getElementById('stripPreview').innerHTML = previewHtml();
  }

  function copyLink(btn) {
    const url = document.getElementById('classUrl').textContent;
    function done() {
      btn.textContent = 'Copied!';
      window.setTimeout(function () { btn.textContent = 'Copy link'; }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { fallback(); });
    } else fallback();
    function fallback() {
      const area = document.createElement('textarea');
      area.value = url;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.left = '-999px';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); } catch (err) { /* the button still confirms the tap */ }
      area.remove();
      done();
    }
  }

  function openBoard() {
    const url = currentLink();
    const described = EM.describeLink({
      t: state.topic,
      lvl: state.level,
      q: state.q,
      tricky: state.tricky,
      msg: state.msg.trim()
    });
    const board = document.createElement('div');
    board.className = 'board';
    board.innerHTML = '<button type="button" class="btn ghost board-close" id="boardClose">' + EM.icons.close +
      ' Close</button><div class="qr-box board-qr">' + qrSvg(url) + '</div><h1>' + EM.escapeHtml(described.title) +
      '</h1><p class="board-detail">' + EM.escapeHtml(described.detail) + '</p>' +
      (described.msg ? '<p class="board-msg">' + EM.escapeHtml(described.msg) + '</p>' : '');
    document.body.appendChild(board);
    document.getElementById('boardClose').onclick = function () { board.remove(); };
  }

  return { open: paint };
})();
