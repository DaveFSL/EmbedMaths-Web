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
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Home</button></div>' +
      '<h1>' + topic.name + '</h1><p class="lede">Pick a level. The highlighted one is where you are up to.</p>' +
      '<div class="level-grid">' + cards +
      '<button type="button" class="level-card ext-card" id="extOpen"><span class="level-name">Finished your level? Try the extension challenges \u2192</span></button></div>' +
      '<div class="picker-bar"><div class="q-block"><span class="eyebrow">Questions</span>' +
      seg('q', EM.prefs.q, [{ value: 5, label: '5' }, { value: 8, label: '8' }, { value: 10, label: '10' }], 'Number of questions') +
      '</div><label class="check-row"><input type="checkbox" id="trickyBox"' + (trickyOn ? ' checked' : '') +
      '><span>' + trickyLabel + '</span></label>' +
      '<button type="button" class="btn primary" id="startLevel">Start Level ' + selected + ' ' + EM.icons.arrow + '</button></div></div>';

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
    document.getElementById('extOpen').onclick = function () { Extend.open(topic, selected); };
  }

  return {
    open: function (nextTopic, level) {
      topic = nextTopic;
      selected = level;
      paint();
    }
  };
})();
