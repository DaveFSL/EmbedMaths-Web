/* Shared place value chart. The decimal point column never moves. */
var PlaceChart = (function () {
  function cell(kind, text) {
    let cls = 'pv-cell';
    if (kind === 'move') cls += ' move';
    if (kind === 'ph') cls += ' ph';
    if (kind === 'point') cls += ' point';
    return '<span class="' + cls + '">' + (text == null ? '' : text) + '</span>';
  }

  function render(model) {
    const cols = model.columns;
    let html = '<div class="pv"><div class="pv-grid" style="--pv-cols:' + cols.length + '">';
    html += '<span class="pv-lab"></span>';
    cols.forEach(function (col) {
      html += '<span class="pv-head">' + col.label + '</span>';
    });
    html += '<span class="pv-lab">Start</span>';
    cols.forEach(function (col) {
      if (col.id === 'dot') { html += cell('point', '·'); return; }
      const item = model.start[col.id];
      html += cell(item ? item.kind : '', item ? item.text : '');
    });
    if (model.arrow) {
      html += '<span class="pv-lab"></span><span class="pv-arrow">' + model.arrow + '</span>';
    }
    if (model.answer) {
      html += '<span class="pv-lab">' + model.answerLabel + '</span>';
      cols.forEach(function (col) {
        if (col.id === 'dot') { html += cell('point', '·'); return; }
        const item = model.answer[col.id];
        html += cell(item ? item.kind : '', item ? item.text : '');
      });
    }
    html += '</div><p class="pv-legend"><i class="swatch move"></i> The digit that moves' +
      '<i class="swatch ph"></i> Placeholder zero <span>The decimal point never moves</span></p></div>';
    return html;
  }

  return { render: render };
})();
