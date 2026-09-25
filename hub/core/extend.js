/* Extension challenges. Students commit an answer before the worked answer is shown. */
const Extend = (function () {
  let topic = null;
  let bank = [];
  let index = 0;
  let revealed = false;
  let hinted = false;
  let committed = '';
  let marks = [];
  let warn = '';

  function sameAnswer(given, expected) {
    function norm(value) {
      return String(value).toLowerCase().replace(/[$,\s]/g, '').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    }
    const a = norm(given);
    const b = norm(expected);
    if (a === b) return true;
    const fa = parseFloat(a);
    const fb = parseFloat(b);
    return a !== '' && b !== '' && !isNaN(fa) && !isNaN(fb) && Math.abs(fa - fb) < 1e-6;
  }

  function paint() {
    const item = bank[index];
    const ready = committed !== '';
    const matched = revealed && sameAnswer(committed, item.expect);
    const entry = item.kind === 'tf'
      ? '<div class="check-row"><button type="button" class="choice tf-pick' + (committed === 'true' ? ' on' : '') + '" data-tf="true">True</button>' +
        '<button type="button" class="choice tf-pick' + (committed === 'false' ? ' on' : '') + '" data-tf="false">False</button></div>'
      : '<label class="setting"><span>My answer</span><input class="my-answer" id="myAnswer" inputmode="decimal" autocomplete="off" value="' + committed.replace(/"/g, '') + '"></label>';
    const revealBlock = revealed
      ? '<p class="mark-line ' + (matched ? 'good' : 'bad') + '">' + (matched ? '✓ ' : '') + 'Your answer: ' + (item.kind === 'tf' ? (committed === 'true' ? 'True' : 'False') : committed) +
        (matched ? '' : '. Not quite — have another look') + '</p><div class="ext-ans">' + item.a + '</div>'
      : '';
    document.getElementById('app').innerHTML =
      '<div class="shell ext"><header class="play-top"><button type="button" class="btn ghost" id="extBack">Back</button>' +
      '<p>Challenge ' + (index + 1) + ' of ' + bank.length + '</p><span></span></header>' +
      '<article class="paper"><p class="eyebrow">' + item.type + '</p><div class="ext-q">' + item.p + '</div></article>' +
      '<section class="paper"><h2>My answer</h2>' + entry +
      '<p class="need-first" id="needFirst">' + warn + '</p>' +
      (hinted ? '<div class="hint-box"><p class="eyebrow">Hint</p><p>' + item.hint + '</p></div>' : '') +
      revealBlock + '</section>' +
      '<div class="action-row"><button type="button" class="btn ghost" id="showHint">Show me a hint</button>' +
      '<button type="button" class="btn primary' + (ready ? '' : ' ghost') + '" id="showAnswer"' + (ready ? '' : ' aria-disabled="true"') + '>Show answer</button>' +
      (revealed ? '<button type="button" class="btn primary" id="extNext">' + (index + 1 >= bank.length ? 'Done' : 'Next challenge') + '</button>' : '') +
      '</div></div>';

    document.getElementById('extBack').onclick = function () { EM.openLevels(topic.id); };
    const field = document.getElementById('myAnswer');
    if (field) {
      field.oninput = function () { committed = field.value.trim(); warn = ''; };
    }
    document.querySelectorAll('[data-tf]').forEach(function (btn) {
      btn.onclick = function () { committed = btn.getAttribute('data-tf'); warn = ''; paint(); };
    });
    document.getElementById('showHint').onclick = function () {
      const live = document.getElementById('myAnswer');
      if (live) committed = live.value.trim();
      hinted = true;
      paint();
    };
    document.getElementById('showAnswer').onclick = function () {
      const live = document.getElementById('myAnswer');
      if (live) committed = live.value.trim();
      if (!committed) { warn = 'Write your answer first.'; paint(); return; }
      revealed = true;
      marks[index] = sameAnswer(committed, item.expect);
      paint();
    };
    const next = document.getElementById('extNext');
    if (next) next.onclick = function () {
      if (index + 1 >= bank.length) {
        const score = marks.filter(function (ok) { return ok; }).length;
        Store.setExtensions(topic.id, score, bank.length);
        EM.openLevels(topic.id);
        return;
      }
      index += 1;
      revealed = false;
      hinted = false;
      committed = '';
      warn = '';
      paint();
    };
  }

  return {
    open: function (nextTopic) {
      topic = nextTopic;
      bank = topic.extensions(arguments[1]);
      index = 0;
      revealed = false;
      hinted = false;
      committed = '';
      marks = [];
      warn = '';
      paint();
      window.scrollTo(0, 0);
    }
  };
})();
