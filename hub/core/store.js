/* localStorage for this device only. Every read and write is inside try/catch. */
const Store = (function () {
  const KEY = 'embedmaths.v1';

  function empty() {
    return { progress: {}, history: [], extensions: {} };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return empty();
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return empty();
      if (!data.progress || typeof data.progress !== 'object') data.progress = {};
      if (!Array.isArray(data.history)) data.history = [];
      if (!data.extensions || typeof data.extensions !== 'object') data.extensions = {};
      delete data.teacherPin;
      return data;
    } catch (err) {
      return empty();
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      return false;
    }
  }

  function progressFor(topicId) {
    const data = load();
    const row = data.progress[topicId];
    if (!row || typeof row.level !== 'number') return { level: 1, streak: 0 };
    return { level: row.level, streak: row.streak || 0 };
  }

  function doneLevels(topicId) {
    const data = load();
    const set = new Set();
    data.history.forEach(function (row) {
      if (row && row.t === topicId && typeof row.lvl === 'number') set.add(row.lvl);
    });
    return set;
  }

  function recentScores(topicId, n) {
    const data = load();
    const rows = data.history.filter(function (row) { return row && row.t === topicId; });
    return rows.slice(-n).map(function (row) { return row.score; });
  }

  function recordSession(entry) {
    const data = load();
    const prev = data.progress[entry.t] || { level: 1, streak: 0 };
    const share = entry.of > 0 ? entry.score / entry.of : 0;
    const passed = share + 1e-9 >= 7 / 8;
    let streak = 0;
    if (passed) streak = prev.level === entry.lvl ? (prev.streak || 0) + 1 : 1;
    data.progress[entry.t] = { level: entry.lvl, streak: streak };
    data.history.push({
      t: entry.t,
      lvl: entry.lvl,
      date: entry.date,
      score: entry.score,
      of: entry.of,
      errors: entry.errors
    });
    if (data.history.length > 30) data.history = data.history.slice(-30);
    save(data);
    return { streak: streak, passed: passed };
  }

  function extensionsFor(topicId) {
    const row = load().extensions[topicId];
    if (!row || typeof row.score !== 'number') return null;
    return { score: row.score, of: row.of };
  }

  function setExtensions(topicId, score, of) {
    const data = load();
    if (!data.extensions) data.extensions = {};
    data.extensions[topicId] = { score: score, of: of };
    save(data);
  }

  return {
    load: load,
    save: save,
    extensionsFor: extensionsFor,
    setExtensions: setExtensions,
    progressFor: progressFor,
    doneLevels: doneLevels,
    recentScores: recentScores,
    recordSession: recordSession
  };
})();
