const Levels = (function () {
  let topic = null;
  let selected = 1;

  function seg(name, value, options, label) {
    return '<div class="seg" role="radiogroup" aria-label="' + label + '">' +
      options.map(function (opt) {
        const on = String(opt.value) === String(value);
        return '<label class="seg-opt' + (on ? ' on' : '') + '"><input type="radio" name="' + name +
          '" value="' + opt.value + '"' + (on ? ' checked' : '') + '><span>' + opt.label + '</span></label>';
      }).join('') + '</div>';
  }

  function paint() {
    const prog = Store.progressFor(topic.id);
    const done = Store.doneLevels(topic.id);
    const cards = topic.levels.map(function (level) {
      const here = level.id === prog.level;
      const on = level.id === selected;
      const ticked = done.has(level.id) && !here;
      const cls = 'level-card' + (on ? ' on' : '') + (ticked ? ' done' : '');
      const kicker = 'Level ' + level.id + (here && on ? ' · You are here' : '');
      return '<button type="button" class="' + cls + '" data-level="' + level.id + '"><span class="kicker">' +
        kicker + '</span><span class="level-name">' + level.name + '</span><span class="level-ex">' +
        level.example + '</span>' + (ticked ? '<span class="tick">' + EM.icons.check + '</span>' : '') + '</button>';
    }).join('');

    const trickyOn = EM.prefs.tricky > 0;
    const trickyLabel = EM.prefs.tricky > 0 && EM.prefs.tricky !== 2
      ? 'Add ' + EM.prefs.tricky + ' tricky ones'
      : 'Add 2 tricky ones';

    document.getElementById('app').innerHTML =
      '<div class="shell picker"><div class="picker-top"><button type="button" class="btn ghost" id="backHome">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Home</button>' +
      '<span class="picker-links"><button type="button" class="text-link" id="extOpen">Extension challenges</button>' +
      '<button type="button" class="text-link" id="customOpen">Custom settings (teachers)</button></span></div>' +
      '<h1>' + topic.name + '</h1><p class="lede">Pick a level. The highlighted one is where you are up to.</p>' +
      '<div class="level-grid">' + cards + '</div>' +
      '<div class="picker-bar"><div class="q-block"><span class="eyebrow">Questions</span>' +
      seg('q', EM.prefs.q, [{ value: 5, label: '5' }, { value: 8, label: '8' }, { value: 10, label: '10' }], 'Number of questions') +
      '</div><label class="check-row"><input type="checkbox" id="trickyBox"' + (trickyOn ? ' checked' : '') +
      '><span>' + trickyLabel + '</span></label>' +
      '<button type="button" class="btn primary" id="startLevel">Start Level ' + selected + ' ' + EM.icons.arrow + '</button></div>' +
      '<div id="custom" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="customTitle"></div></div>';

    document.getElementById('backHome').onclick = function () { EM.home(); };
    document.getElementById('app').querySelectorAll('[data-level]').forEach(function (btn) {
      btn.onclick = function () {
        selected = parseInt(btn.getAttribute('data-level'), 10);
        paint();
      };
    });
    document.getElementById('app').querySelectorAll('input[name="q"]').forEach(function (input) {
      input.onchange = function () {
        EM.prefs.q = parseInt(input.value, 10);
        paint();
      };
    });
    document.getElementById('trickyBox').onchange = function (ev) {
      EM.prefs.tricky = ev.target.checked ? 2 : 0;
      paint();
    };
    document.getElementById('startLevel').onclick = function () {
      EM.startSession({
        topicId: topic.id,
        level: selected,
        count: EM.prefs.q,
        tricky: EM.prefs.tricky,
        est: EM.prefs.est,
        strat: EM.prefs.strat
      });
    };
    document.getElementById('customOpen').onclick = openCustom;
    document.getElementById('extOpen').onclick = function () { Extend.open(topic, selected); };
  }

  function openCustom() {
    const modal = document.getElementById('custom');
    modal.classList.remove('hidden');
    modal.innerHTML =
      '<div class="modal-card wide"><h2 id="customTitle">Custom settings</h2>' +
      '<p class="note">In class we say trading. The Australian Curriculum (ACARA v9) calls this regrouping.</p>' +
      '<div class="setting"><span>Estimate first</span>' +
      seg('est', EM.prefs.est ? '1' : '0', [{ value: '1', label: 'On' }, { value: '0', label: 'Off' }], 'Estimate first') +
      '</div><div class="setting"><span>Mental strategy</span>' +
      seg('strat', EM.prefs.strat ? '1' : '0', [{ value: '1', label: 'On' }, { value: '0', label: 'Off' }], 'Mental strategy') +
      '</div><div class="setting"><span>Tricky ones</span>' +
      seg('trickyN', EM.prefs.tricky, [
        { value: 0, label: '0' }, { value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }
      ], 'Tricky questions') +
      '</div><button type="button" class="btn primary" id="customDone">Done</button></div>';

    modal.querySelectorAll('input').forEach(function (input) {
      input.onchange = function () {
        if (input.name === 'est') EM.prefs.est = input.value === '1';
        if (input.name === 'strat') EM.prefs.strat = input.value === '1';
        if (input.name === 'trickyN') EM.prefs.tricky = parseInt(input.value, 10);
        modal.querySelectorAll('.seg-opt').forEach(function (lab) {
          const radio = lab.querySelector('input');
          lab.classList.toggle('on', radio && radio.checked);
        });
      };
    });
    document.getElementById('customDone').onclick = function () {
      modal.classList.add('hidden');
      paint();
    };
  }

  return {
    open: function (nextTopic, level) {
      topic = nextTopic;
      selected = level;
      paint();
    }
  };
})();
