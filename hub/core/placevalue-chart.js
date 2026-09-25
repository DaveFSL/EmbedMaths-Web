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
    if (model.arrow && model.answer) {
      const from = cols.findIndex(function (col) { return col.id === model.arrow.from; });
      const to = cols.findIndex(function (col) { return col.id === model.arrow.to; });
      if (from >= 0 && to >= 0) {
        const n = cols.length;
        const x1 = (from + 0.5) / n * 100;
        const x2 = (to + 0.5) / n * 100;
        const mid = (x1 + x2) / 2;
        const head = 'M ' + (x2 - 1.4) + ' 80 L ' + x2 + ' 96 L ' + (x2 + 1.4) + ' 80';
        html += '<span class="pv-lab"></span><span class="pv-arrow"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
          '<path d="M ' + x1 + ' 4 C ' + x1 + ' 50, ' + x2 + ' 50, ' + x2 + ' 96" fill="none" stroke="#B85A1E" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-dasharray="4 3"/>' +
          '<path d="' + head + '" fill="none" stroke="#B85A1E" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '<span class="pv-move" style="left:' + mid + '%">' + model.arrow.label + '</span></span>';
      }
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
