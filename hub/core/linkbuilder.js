/* Teacher and parent class links, sets, and a printable QR card. */
const LinkBuilder = (function () {
  const TOPICS = [
    { id: 'add', label: 'Addition' },
    { id: 'sub', label: 'Subtraction' },
    { id: 'mul', label: 'Multiplication' },
    { id: 'pv', label: '× ÷ 10, 100, 1000' },
    { id: 'conv', label: 'Converting units' },
    { id: 'mix', label: 'Daily mix' }
  ];
  const ROW_TOPICS = TOPICS.filter(function (topic) { return topic.id !== 'mix'; });
  const state = {
    mode: 'one',
    title: '',
    due: '',
    msg: '',
    fin: '',
    topic: 'sub',
    level: 6,
    q: 8,
    tricky: 2,
    est: true,
    strat: true,
    rows: [{ topic: 'sub', level: 6, count: 8 }],
    order: 'g',
    same: false,
    seed: ''
  };

  function usesWritten(id) {
    return id === 'add' || id === 'sub' || id === 'mul' || id === 'mix';
  }

  function clean(raw, max) {
    return String(raw || '').replace(/[\u0000-\u001F\u007F]/g, '').slice(0, max);
  }

  function newSeed() {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let seed = '';
    for (let i = 0; i < 6; i++) seed += chars[Math.floor(Math.random() * chars.length)];
    return seed;
  }

  function pageBase() {
    return window.location.origin + window.location.pathname;
  }

  function activeRows() {
    return state.mode === 'set' ? state.rows : [];
  }

  function writtenOn() {
    if (state.mode === 'one') return usesWritten(state.topic);
    return state.rows.some(function (row) { return usesWritten(row.topic); });
  }

  function linkInfo() {
    if (state.mode === 'set') {
      return {
        t: 'set',
        rows: state.rows.map(function (row) { return { topic: row.topic, level: row.level, count: row.count }; }),
        q: EM.rowsTotal(state.rows),
        ttl: state.title.trim(),
        due: state.due,
        msg: state.msg.trim(),
        fin: state.fin.trim(),
        tricky: 0
      };
    }
    return {
      t: state.topic,
      lvl: state.level,
      q: state.q,
      tricky: state.tricky,
      ttl: state.title.trim(),
      due: state.due,
      msg: state.msg.trim(),
      fin: state.fin.trim()
    };
  }

  function currentLink() {
    const params = new URLSearchParams();
    const written = writtenOn();
    if (state.mode === 'set') {
      params.set('t', 'set');
      params.set('set', state.rows.map(function (row) {
        return row.topic + row.level + 'x' + row.count;
      }).join(','));
      params.set('order', state.order === 'm' ? 'm' : 'g');
      params.set('q', String(EM.rowsTotal(state.rows)));
    } else {
      params.set('t', state.topic);
      if (state.topic !== 'mix') params.set('lvl', String(state.level));
      params.set('q', String(state.q));
      params.set('tricky', String(state.tricky));
    }
    params.set('est', written && state.est ? '1' : '0');
    params.set('strat', written && state.strat ? '1' : '0');
    params.set('go', '1');
    if (state.title.trim()) params.set('ttl', state.title.trim());
    if (state.due) params.set('due', state.due);
    if (state.msg.trim()) params.set('msg', state.msg.trim());
    if (state.fin.trim()) params.set('fin', state.fin.trim());
    if (state.same && state.seed) params.set('seed', state.seed);
    return pageBase() + '?' + params.toString();
  }

  function makeQr(text) {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr;
  }

  function qrSvg(text) {
    return makeQr(text).createSvgTag({ cellSize: 4, margin: 8, scalable: true });
  }

  function wrapFill(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text || '').split(' ');
    let line = '';
    let yy = y;
    words.forEach(function (word) {
      const trial = line ? line + ' ' + word : word;
      if (line && ctx.measureText(trial).width > maxWidth) {
        ctx.fillText(line, x, yy);
        line = word;
        yy += lineHeight;
      } else line = trial;
    });
    if (line) ctx.fillText(line, x, yy);
    return yy;
  }

  function drawCard(canvas, url) {
    const described = EM.describeLink(linkInfo());
    const summary = described.cardLine || described.detail;
    const w = 640;
    const h = 1200;
    const scratch = document.createElement('canvas');
    scratch.width = w * 2;
    scratch.height = h * 2;
    const ctx = scratch.getContext('2d');
    ctx.scale(2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0E5D66';
    ctx.fillRect(0, 0, w, 78);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '700 30px "Bricolage Grotesque", Lexend, sans-serif';
    ctx.fillText('EmbedMaths', w / 2, 50);
    ctx.fillStyle = '#16302F';
    ctx.font = '760 40px "Bricolage Grotesque", Lexend, sans-serif';
    let y = wrapFill(ctx, described.title || 'Practice', w / 2, 128, 560, 48);
    y += 36;
    if (described.dueText) {
      ctx.fillStyle = '#4F6B6D';
      ctx.font = '650 22px Lexend, sans-serif';
      ctx.fillText('Due: ' + described.dueText, w / 2, y);
      y += 32;
    }
    const qr = makeQr(url);
    const n = qr.getModuleCount();
    const size = 400;
    const cell = size / n;
    const left = (w - size) / 2;
    const top = y + 16;
    canvas.dataset.qrLeft = String(left);
    canvas.dataset.qrTop = String(top);
    canvas.dataset.qrSize = String(size);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(left - 12, top - 12, size + 24, size + 24);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!qr.isDark(r, c)) continue;
        ctx.fillStyle = '#16302F';
        ctx.fillRect(left + c * cell, top + r * cell, Math.ceil(cell), Math.ceil(cell));
      }
    }
    y = top + size + 40;
    ctx.fillStyle = '#16302F';
    ctx.font = '650 24px Lexend, sans-serif';
    y = wrapFill(ctx, summary, w / 2, y, 580, 32) + 28;
    ctx.fillStyle = '#4F6B6D';
    ctx.font = '500 12px Lexend, sans-serif';
    const chunks = String(url).match(/.{1,64}/g) || [];
    chunks.forEach(function (chunk) {
      ctx.fillText(chunk, w / 2, y);
      y += 16;
    });
    const used = Math.min(h * 2, Math.ceil((y + 36) * 2));
    canvas.width = w * 2;
    canvas.height = used;
    canvas.getContext('2d').drawImage(scratch, 0, 0);
  }

  function teamsText(url) {
    const described = EM.describeLink(linkInfo());
    const lines = [];
    if (state.title.trim()) lines.push(state.title.trim());
    if (described.dueText) lines.push('Due: ' + described.dueText);
    lines.push(described.teams || described.detail);
    if (state.msg.trim()) lines.push(state.msg.trim());
    lines.push(url);
    return lines.join('\n');
  }

  function levelOptions(topicId, selected) {
    const topic = EM.topics[topicId];
    if (!topic) return '';
    return topic.levels.map(function (level) {
      const label = 'L' + level.id + ' · ' + level.name;
      return '<option value="' + level.id + '"' + (level.id === selected ? ' selected' : '') + '>' +
        EM.escapeHtml(label) + '</option>';
    }).join('');
  }

  function topicOptions(selected, includeMix) {
    const list = includeMix ? TOPICS : ROW_TOPICS;
    return list.map(function (topic) {
      return '<option value="' + topic.id + '"' + (topic.id === selected ? ' selected' : '') + '>' +
        topic.label + '</option>';
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

  function stepper(count, attr) {
    return '<span class="stepper"><button type="button" class="step-btn" data-dir="-1" ' + attr +
      ' aria-label="Fewer">−</button><span class="step-n">' + count +
      '</span><button type="button" class="step-btn" data-dir="1" ' + attr + ' aria-label="More">+</button></span>';
  }

  function paint() {
    const written = writtenOn();
    const total = state.mode === 'set' ? EM.rowsTotal(state.rows) : state.q;
    const rowsHtml = state.rows.map(function (row, i) {
      return '<div class="set-row"><select class="level-select row-topic" data-row="' + i + '">' +
        topicOptions(row.topic, false) + '</select><select class="level-select row-level" data-row="' + i + '">' +
        levelOptions(row.topic, row.level) + '</select>' + stepper(row.count, 'data-row="' + i + '"') +
        '<button type="button" class="text-link row-remove" data-row="' + i + '"' +
        (state.rows.length < 2 ? ' disabled' : '') + '>Remove</button></div>';
    }).join('');
    document.getElementById('app').innerHTML =
      '<div class="shell builder"><div class="picker-top"><button type="button" class="btn ghost" id="backHome">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Home</button>' +
      '<span class="builder-for">For teachers and parents</span></div>' +
      '<h1>Set practice</h1><p class="lede">Choose what to practise, then share a link or QR code — for a class or your own child.</p>' +
      '<div class="link-layout"><section class="panel builder-form">' +
      '<div class="field-row title-due"><div class="field"><label class="field-label" for="classTitle">Title</label>' +
      '<input id="classTitle" class="msg-input" maxlength="50" placeholder="Week 3 homework – Extension" value="' +
      EM.escapeHtml(state.title) + '"><p class="msg-count"><span id="titleCount">' + state.title.length + '</span>/50</p></div>' +
      '<div class="field"><label class="field-label" for="duePick">Due date</label>' +
      '<input id="duePick" class="msg-input" type="date" value="' + EM.escapeHtml(state.due) + '"></div></div>' +
      '<div class="field"><label class="field-label" for="classMsg">Message to students</label>' +
      '<input id="classMsg" class="msg-input" maxlength="80" placeholder="Show your working in your book." value="' +
      EM.escapeHtml(state.msg) + '"><p class="msg-count"><span id="msgCount">' + state.msg.length + '</span>/80</p></div>' +
      '<div class="field"><label class="field-label" for="classFin">When they finish</label>' +
      '<input id="classFin" class="msg-input" maxlength="80" placeholder="Take a screenshot of this card and share it with your teacher." value="' +
      EM.escapeHtml(state.fin) + '"><p class="msg-count"><span id="finCount">' + state.fin.length + '</span>/80</p></div>' +
      '<div class="field"><span class="field-label">Mode</span>' +
      seg('mode', state.mode, [{ value: 'one', label: 'One topic' }, { value: 'set', label: 'Build a set' }], 'Mode') +
      '</div>' +
      '<div id="oneMode"' + (state.mode === 'one' ? '' : ' hidden') + '>' +
      '<div class="field"><label class="field-label" for="topicPick">Topic</label>' +
      '<select id="topicPick" class="level-select">' + topicOptions(state.topic, true) + '</select></div>' +
      '<div class="field" id="levelField"' + (state.topic === 'mix' ? ' hidden' : '') + '>' +
      '<label class="field-label" for="levelPick">Level</label><select id="levelPick" class="level-select">' +
      levelOptions(state.topic, state.level) + '</select></div>' +
      '<div class="field"><span class="field-label">Questions</span><div class="q-controls">' +
      seg('q', [5, 8, 10].indexOf(state.q) >= 0 ? state.q : '', [{ value: 5, label: '5' }, { value: 8, label: '8' }, { value: 10, label: '10' }], 'Questions') +
      stepper(state.q, 'data-q="1"') + '</div></div>' +
      '<div class="field"><span class="field-label">Add tricky ones</span>' +
      seg('tricky', state.tricky, [{ value: 0, label: '0' }, { value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }], 'Tricky questions') +
      '</div></div>' +
      '<div id="setMode"' + (state.mode === 'set' ? '' : ' hidden') + '>' +
      '<div class="field"><span class="field-label">Set</span><div class="set-rows">' + rowsHtml + '</div>' +
      '<button type="button" class="btn ghost" id="addRow"' + (state.rows.length >= 6 || total >= 30 ? ' disabled' : '') +
      '>+ Add a row</button><p class="running-total" id="runningTotal">' + total + ' of 30 questions</p></div>' +
      '<div class="field"><span class="field-label">Order</span>' +
      seg('order', state.order, [{ value: 'g', label: 'Grouped by topic' }, { value: 'm', label: 'Mixed up' }], 'Order') +
      '</div></div>' +
      '<div class="field" id="writtenToggles"' + (written ? '' : ' hidden') + '>' +
      '<label class="check-line"><input type="checkbox" id="estOn"' + (state.est ? ' checked' : '') + '> Estimate first</label>' +
      '<label class="check-line"><input type="checkbox" id="stratOn"' + (state.strat ? ' checked' : '') + '> Show a mental strategy after the solution</label>' +
      '<p class="note">In class we say trading. The Australian Curriculum (ACARA v9) calls this regrouping.</p>' +
      '</div>' +
      '<label class="check-line"><input type="checkbox" id="sameOn"' + (state.same ? ' checked' : '') +
      '> Same questions for everyone</label>' +
      '<div class="field"><button type="button" class="btn ghost preview-toggle" id="previewToggle">Preview</button>' +
      '<div id="stripPreview" hidden></div></div>' +
      '</section><aside class="link-card"><p class="eyebrow light">Your link</p><p class="link-url" id="classUrl"></p>' +
      '<button type="button" class="btn light" id="copyLink">Copy link</button>' +
      '<button type="button" class="btn light" id="copyTeams">Copy message</button>' +
      '<p class="copy-note" id="copyNote" hidden>Message copied — paste it into Teams, email or your class page.</p>' +
      '<p class="card-label">QR card</p><canvas id="qrCard" class="qr-card"></canvas>' +
      '<button type="button" class="btn light" id="downloadCard">Download card</button>' +
      '<button type="button" class="btn light" id="showBoard">Show on the board</button></aside></div>' +
      '<p class="builder-links"><a href="https://flowstatelearning.com.au/about" target="_blank" rel="noopener noreferrer">About</a>' +
      '<a href="mailto:dave@flowstatelearning.com.au">Feedback</a></p></div>';

    document.getElementById('backHome').onclick = function () { EM.home(); };
    bindFields();
    refresh();
  }

  function markSeg(name, value) {
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (input) {
      const on = String(input.value) === String(value);
      input.checked = on;
      input.parentNode.classList.toggle('on', on);
    });
  }

  function rowsMarkup() {
    return state.rows.map(function (row, i) {
      return '<div class="set-row"><select class="level-select row-topic" data-row="' + i + '">' +
        topicOptions(row.topic, false) + '</select><select class="level-select row-level" data-row="' + i + '">' +
        levelOptions(row.topic, row.level) + '</select>' + stepper(row.count, 'data-row="' + i + '"') +
        '<button type="button" class="text-link row-remove" data-row="' + i + '"' +
        (state.rows.length < 2 ? ' disabled' : '') + '>Remove</button></div>';
    }).join('');
  }

  function syncChrome() {
    const one = document.getElementById('oneMode');
    const set = document.getElementById('setMode');
    if (one) one.hidden = state.mode !== 'one';
    if (set) set.hidden = state.mode !== 'set';
    const levelField = document.getElementById('levelField');
    if (levelField) levelField.hidden = state.topic === 'mix';
    const written = document.getElementById('writtenToggles');
    if (written) written.hidden = !writtenOn();
    markSeg('mode', state.mode);
    markSeg('order', state.order);
    markSeg('q', [5, 8, 10].indexOf(state.q) >= 0 ? String(state.q) : '');
    markSeg('tricky', String(state.tricky));
    const qn = document.querySelector('#oneMode .step-n');
    if (qn) qn.textContent = String(state.q);
    document.querySelectorAll('.set-row').forEach(function (rowEl, i) {
      const n = rowEl.querySelector('.step-n');
      if (n && state.rows[i]) n.textContent = String(state.rows[i].count);
    });
    const add = document.getElementById('addRow');
    if (add) add.disabled = state.rows.length >= 6 || EM.rowsTotal(state.rows) >= 30;
    const total = document.getElementById('runningTotal');
    if (total) total.textContent = EM.rowsTotal(state.rows) + ' of 30 questions';
  }

  function renderRows() {
    const box = document.querySelector('.set-rows');
    if (!box) return;
    box.innerHTML = rowsMarkup();
    bindRows();
    syncChrome();
    refresh();
  }

  function bindRows() {
    document.querySelectorAll('.row-topic').forEach(function (select) {
      select.onchange = function () {
        const row = state.rows[parseInt(select.getAttribute('data-row'), 10)];
        row.topic = select.value;
        const topic = EM.topics[row.topic];
        if (row.level > topic.levels.length) row.level = topic.levels.length;
        const levelSel = select.parentNode.querySelector('.row-level');
        if (levelSel) levelSel.innerHTML = levelOptions(row.topic, row.level);
        syncChrome();
        refresh();
      };
    });
    document.querySelectorAll('.row-level').forEach(function (select) {
      select.onchange = function () {
        state.rows[parseInt(select.getAttribute('data-row'), 10)].level = parseInt(select.value, 10);
        refresh();
      };
    });
    document.querySelectorAll('.stepper [data-row]').forEach(function (btn) {
      btn.onclick = function () {
        const row = state.rows[parseInt(btn.getAttribute('data-row'), 10)];
        const next = row.count + parseInt(btn.getAttribute('data-dir'), 10);
        const others = EM.rowsTotal(state.rows) - row.count;
        if (next < 1 || next > 20) return;
        if (others + next > 30) return;
        row.count = next;
        syncChrome();
        refresh();
      };
    });
    document.querySelectorAll('.row-remove').forEach(function (btn) {
      btn.onclick = function () {
        if (state.rows.length < 2) return;
        state.rows.splice(parseInt(btn.getAttribute('data-row'), 10), 1);
        renderRows();
      };
    });
  }

  function bindFields() {
    const title = document.getElementById('classTitle');
    title.oninput = function () {
      state.title = clean(title.value, 50);
      if (title.value !== state.title) title.value = state.title;
      document.getElementById('titleCount').textContent = String(state.title.length);
      refresh();
    };
    document.getElementById('duePick').onchange = function () {
      state.due = this.value || '';
      refresh();
    };
    const msg = document.getElementById('classMsg');
    msg.oninput = function () {
      state.msg = clean(msg.value, 80);
      if (msg.value !== state.msg) msg.value = state.msg;
      document.getElementById('msgCount').textContent = String(state.msg.length);
      refresh();
    };
    const fin = document.getElementById('classFin');
    fin.oninput = function () {
      state.fin = clean(fin.value, 80);
      if (fin.value !== state.fin) fin.value = state.fin;
      document.getElementById('finCount').textContent = String(state.fin.length);
      refresh();
    };
    document.querySelectorAll('input[name="mode"]').forEach(function (input) {
      input.onchange = function () {
        state.mode = input.value;
        syncChrome();
        refresh();
      };
    });
    const topicPick = document.getElementById('topicPick');
    if (topicPick) topicPick.onchange = function () {
      state.topic = topicPick.value;
      const topic = EM.topics[state.topic];
      if (topic && state.level > topic.levels.length) state.level = topic.levels.length;
      const levelPick = document.getElementById('levelPick');
      if (levelPick && topic) levelPick.innerHTML = levelOptions(state.topic, state.level);
      syncChrome();
      refresh();
    };
    const levelPick = document.getElementById('levelPick');
    if (levelPick) levelPick.onchange = function () {
      state.level = parseInt(levelPick.value, 10);
      refresh();
    };
    document.querySelectorAll('input[name="q"]').forEach(function (input) {
      input.onchange = function () {
        state.q = parseInt(input.value, 10);
        syncChrome();
        refresh();
      };
    });
    document.querySelectorAll('input[name="tricky"]').forEach(function (input) {
      input.onchange = function () {
        state.tricky = parseInt(input.value, 10);
        syncChrome();
        refresh();
      };
    });
    document.querySelectorAll('[data-q]').forEach(function (btn) {
      btn.onclick = function () {
        state.q = Math.max(1, Math.min(20, state.q + parseInt(btn.getAttribute('data-dir'), 10)));
        syncChrome();
        refresh();
      };
    });
    document.querySelectorAll('input[name="order"]').forEach(function (input) {
      input.onchange = function () {
        state.order = input.value;
        syncChrome();
        refresh();
      };
    });
    bindRows();
    const addRow = document.getElementById('addRow');
    if (addRow) addRow.onclick = function () {
      if (state.rows.length >= 6 || EM.rowsTotal(state.rows) >= 30) return;
      const used = {};
      state.rows.forEach(function (row) { used[row.topic] = true; });
      const next = ROW_TOPICS.filter(function (topic) { return !used[topic.id]; })[0] || ROW_TOPICS[0];
      const room = Math.min(3, 30 - EM.rowsTotal(state.rows));
      state.rows.push({ topic: next.id, level: next.id === 'conv' ? 2 : 3, count: Math.max(1, room) });
      renderRows();
    };
    const estOn = document.getElementById('estOn');
    if (estOn) estOn.onchange = function () { state.est = estOn.checked; refresh(); };
    const stratOn = document.getElementById('stratOn');
    if (stratOn) stratOn.onchange = function () { state.strat = stratOn.checked; refresh(); };
    document.getElementById('sameOn').onchange = function () {
      state.same = this.checked;
      if (state.same && !state.seed) state.seed = newSeed();
      refresh();
    };
    document.getElementById('previewToggle').onclick = function () {
      const box = document.getElementById('stripPreview');
      box.hidden = !box.hidden;
      this.classList.toggle('on', !box.hidden);
      if (!box.hidden) refresh();
    };
    document.getElementById('copyLink').onclick = function () {
      const note = document.getElementById('copyNote');
      if (note) note.hidden = true;
      copyText(currentLink(), this, 'Copy link');
    };
    document.getElementById('copyTeams').onclick = function () {
      copyText(teamsText(currentLink()), this, 'Copy message', true);
      const note = document.getElementById('copyNote');
      if (note) note.hidden = false;
    };
    document.getElementById('downloadCard').onclick = downloadCard;
    document.getElementById('showBoard').onclick = openBoard;
  }

  function refresh() {
    const url = currentLink();
    const urlEl = document.getElementById('classUrl');
    if (!urlEl) return;
    urlEl.textContent = url;
    const preview = document.getElementById('stripPreview');
    if (preview) {
      preview.innerHTML = EM.teacherStrip(linkInfo(), '<div class="teacher-actions"><span class="btn light">Start ' +
        EM.icons.arrow + '</span><span class="btn dark">Daily mix instead</span></div>');
    }
    const total = document.getElementById('runningTotal');
    if (total) total.textContent = EM.rowsTotal(state.rows) + ' of 30 questions';
    const canvas = document.getElementById('qrCard');
    if (canvas) drawCard(canvas, url);
  }

  function copyText(text, btn, label, keepLabel) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-999px';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); } catch (err) { /* the button still confirms the tap */ }
    area.remove();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
    }
    if (keepLabel) return;
    btn.textContent = 'Copied!';
    window.setTimeout(function () { btn.textContent = label; }, 1600);
  }

  function downloadCard() {
    const canvas = document.getElementById('qrCard');
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'embedmaths-qr-card.png';
    link.click();
  }

  function openBoard() {
    const url = currentLink();
    const described = EM.describeLink(linkInfo());
    const summary = described.cardLine || described.detail;
    const board = document.createElement('div');
    board.className = 'board';
    board.innerHTML = '<button type="button" class="btn ghost board-close" id="boardClose">' + EM.icons.close +
      ' Close</button><div class="board-card"><p class="board-brand">EmbedMaths</p><h1>' +
      EM.escapeHtml(described.title) + '</h1>' +
      (described.dueText ? '<p class="board-due">Due: ' + EM.escapeHtml(described.dueText) + '</p>' : '') +
      '<div class="qr-box board-qr">' + qrSvg(url) + '</div><p class="board-detail">' + EM.escapeHtml(summary) +
      '</p><p class="board-url">' + EM.escapeHtml(url) + '</p></div>';
    document.body.appendChild(board);
    document.getElementById('boardClose').onclick = function () { board.remove(); };
  }

  return {
    open: function () { window.scrollTo(0, 0); paint(); },
    teamsText: function () { return teamsText(currentLink()); }
  };
})();
