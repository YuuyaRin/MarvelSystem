/* ==========================================================================
   MARVEL 宇宙观影指挥中心 — 状态管理(localStorage)

   数据模型:
   watched[id]  = { date }            已看完(打卡日期)
   records[id]  = { rating, note }    评分与短评(与观看状态独立保存)
   want[id]     = true                想看
   dropped[id]  = true                弃看
   progress[id] = n                   剧集已看集数(> 0 即视为「在看」)
   activity[YYYY-MM-DD] = n           每日打卡活动计数(热力图)
   settings     = { spoilerGuard }    偏好设置
   ========================================================================== */

(function () {
  const KEY = 'marvel-system-v1';
  // 本地时区的 YYYY-MM-DD(避免 UTC 偏移导致晚间打卡记到前一天)
  const fmtDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = () => fmtDate(new Date());

  const defaultState = () => ({
    watched: {},
    records: {},
    want: {},
    dropped: {},
    progress: {},
    activity: {},
    flags: {},
    settings: { spoilerGuard: true },
    activeRoute: 'essential',
    snapped: false,
    unlocked: {},
    createdAt: new Date().toISOString(),
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return migrate(Object.assign(defaultState(), parsed));
    } catch (e) {
      console.warn('存档读取失败,使用新档', e);
      return defaultState();
    }
  }

  /* 兼容旧版存档:watched 里的 rating/note 拆到 records;补建 activity */
  function migrate(st) {
    st.settings = Object.assign({ spoilerGuard: true }, st.settings || {});
    Object.entries(st.watched).forEach(([id, rec]) => {
      if (rec && (rec.rating || rec.note)) {
        if ((rec.rating && rec.rating > 0) || (rec.note && rec.note.trim())) {
          st.records[id] = Object.assign({ rating: rec.rating || 0, note: rec.note || '' }, st.records[id]);
        }
        st.watched[id] = { date: rec.date || today() };
      }
      if (rec && rec.date && Object.keys(st.activity).length === 0) {
        // 首次迁移时用历史打卡日期回填热力图
        st.activity[rec.date] = (st.activity[rec.date] || 0) + 1;
      }
    });
    return st;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn('存档写入失败', e); }
  }

  function logActivity(n) {
    const d = today();
    state.activity[d] = (state.activity[d] || 0) + (n || 1);
    if (new Date().getHours() < 6) state.flags.nightOwl = true; // 守夜人
  }

  function bumpFlag(key) {
    state.flags[key] = (state.flags[key] || 0) + 1;
    save();
    return checkAchievements();
  }

  /* ---------- 查询 ---------- */
  const isWatched = id => !!state.watched[id];

  function statusOf(id) {
    if (state.watched[id]) return 'done';
    if (state.dropped[id]) return 'dropped';
    if (state.progress[id] > 0) return 'watching';
    if (state.want[id]) return 'want';
    return 'none';
  }

  function watchedCount() { return Object.keys(state.watched).length; }

  function minutesWatched() {
    let sum = 0;
    MARVEL.WORKS.forEach(w => {
      if (state.watched[w.id]) sum += w.runtime || 0;
      else if (state.progress[w.id] > 0 && w.episodes) {
        sum += Math.round((w.runtime || 0) * state.progress[w.id] / w.episodes);
      }
    });
    return sum;
  }

  function recordCount() {
    return Object.values(state.records).filter(r => (r.rating && r.rating > 0) || (r.note && r.note.trim())).length;
  }

  function routeProgress(route) {
    const total = route.items.length;
    const done = route.items.filter(isWatched).length;
    return { done, total, pct: total ? Math.round(done / total * 100) : 0 };
  }

  function nextInRoute(route) {
    const id = route.items.find(rid => !isWatched(rid) && !(MARVEL.byId[rid] && MARVEL.byId[rid].upcoming));
    return id ? MARVEL.byId[id] : null;
  }

  function phaseProgress(phase) {
    const works = MARVEL.WORKS.filter(w => w.phase === phase && !w.upcoming);
    const done = works.filter(w => isWatched(w.id)).length;
    return { done, total: works.length, pct: works.length ? Math.round(done / works.length * 100) : 0 };
  }

  function stonesLit() {
    return MARVEL.STONES.map(s => ({ ...s, lit: isWatched(s.workId) }));
  }

  function watchingList() {
    return MARVEL.WORKS.filter(w => statusOf(w.id) === 'watching');
  }

  /* ---------- 热力图 / 连续打卡 ---------- */
  function streaks() {
    const days = Object.keys(state.activity).filter(d => state.activity[d] > 0).sort();
    if (!days.length) return { current: 0, best: 0, totalDays: 0 };

    const set = new Set(days);
    let best = 0;
    days.forEach(d => {
      const prev = shiftDate(d, -1);
      if (!set.has(prev)) { // 一段连续区间的起点
        let len = 1, cur = d;
        while (set.has(shiftDate(cur, 1))) { cur = shiftDate(cur, 1); len++; }
        if (len > best) best = len;
      }
    });

    let current = 0;
    let cursor = set.has(today()) ? today() : (set.has(shiftDate(today(), -1)) ? shiftDate(today(), -1) : null);
    while (cursor && set.has(cursor)) { current++; cursor = shiftDate(cursor, -1); }

    return { current, best, totalDays: days.length };
  }

  function shiftDate(dateStr, delta) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    return fmtDate(d);
  }

  /* ---------- 变更 ---------- */
  function toggleWatched(id) {
    if (state.watched[id]) {
      delete state.watched[id];
      delete state.progress[id];
    } else {
      state.watched[id] = { date: today() };
      delete state.want[id];
      delete state.dropped[id];
      const w = MARVEL.byId[id];
      if (w && w.episodes) state.progress[id] = w.episodes;
      logActivity();
    }
    save();
    return checkAchievements();
  }

  function setWant(id) {
    const on = !state.want[id];
    delete state.want[id]; delete state.dropped[id];
    if (on) {
      state.want[id] = true;
      delete state.watched[id];
      delete state.progress[id];
    }
    save();
    return on;
  }

  function setDropped(id) {
    const on = !state.dropped[id];
    delete state.want[id]; delete state.dropped[id];
    if (on) {
      state.dropped[id] = true;
      delete state.watched[id];
    }
    save();
    return on;
  }

  /* 剧集进度;看满全集自动标记已看。返回 { fresh(新成就), completed(本次看完) } */
  function setProgress(id, n) {
    const w = MARVEL.byId[id];
    if (!w || !w.episodes) return { fresh: [], completed: false };
    n = Math.max(0, Math.min(w.episodes, n));
    const old = state.progress[id] || 0;
    if (n === old) return { fresh: [], completed: false };

    state.progress[id] = n;
    if (n > old) { logActivity(); delete state.want[id]; delete state.dropped[id]; }

    let completed = false;
    if (n >= w.episodes && !state.watched[id]) {
      state.watched[id] = { date: today() };
      completed = true;
    }
    if (n < w.episodes && state.watched[id]) {
      delete state.watched[id]; // 回退集数 = 取消已看
    }
    if (n === 0) delete state.progress[id];
    save();
    return { fresh: checkAchievements(), completed };
  }

  function setRecord(id, patch) {
    if (!state.records[id]) state.records[id] = { rating: 0, note: '' };
    Object.assign(state.records[id], patch);
    save();
    return checkAchievements();
  }

  function setSetting(key, val) {
    state.settings[key] = val;
    save();
  }

  function setActiveRoute(routeId) {
    state.activeRoute = routeId;
    save();
  }

  function markSnapped() {
    state.snapped = true;
    save();
    return checkAchievements();
  }

  /* ---------- 成就判定,返回本次新解锁的成就列表 ---------- */
  function checkAchievements() {
    const ctx = {
      state,
      has: isWatched,
      watchedCount: watchedCount(),
      minutes: minutesWatched(),
      recordCount: recordCount(),
      todayActivity: state.activity[today()] || 0,
      streakCurrent: streaks().current,
      fiveStarCount: Object.values(state.records).filter(r => r.rating === 5).length,
      flags: state.flags || {},
    };
    const fresh = [];
    MARVEL.ACHIEVEMENTS.forEach(a => {
      if (!state.unlocked[a.id] && a.check(ctx)) {
        state.unlocked[a.id] = new Date().toISOString();
        fresh.push(a);
      }
    });
    if (fresh.length) save();
    return fresh;
  }

  /* ---------- 导入导出 ---------- */
  function exportJSON() {
    return JSON.stringify({ app: 'marvel-system', version: 2, exportedAt: new Date().toISOString(), data: state }, null, 2);
  }

  function importJSON(text) {
    const parsed = JSON.parse(text);
    const data = parsed && parsed.app === 'marvel-system' ? parsed.data : parsed;
    if (!data || typeof data.watched !== 'object') throw new Error('不是有效的存档文件');
    state = migrate(Object.assign(defaultState(), data));
    save();
    checkAchievements();
  }

  function resetAll() {
    state = defaultState();
    save();
  }

  MARVEL.store = {
    get state() { return state; },
    isWatched, statusOf, watchedCount, minutesWatched, recordCount,
    routeProgress, nextInRoute, phaseProgress, stonesLit, watchingList, streaks, shiftDate, today,
    toggleWatched, setWant, setDropped, setProgress, setRecord, setSetting, bumpFlag,
    setActiveRoute, markSnapped,
    checkAchievements, exportJSON, importJSON, resetAll,
  };
})();
