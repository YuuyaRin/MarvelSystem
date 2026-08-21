/* ==========================================================================
   MARVEL 宇宙观影指挥中心 — 应用主逻辑
   ========================================================================== */

(function () {
  const S = MARVEL.store;
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  /* ---------- 工具 ---------- */
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function colorOf(w) {
    if (w.phase >= 1) return MARVEL.PHASES[w.phase].color;
    const u = MARVEL.UNIVERSES[w.universe];
    return (u && u.color) || '#7f8da3';
  }

  function phaseLabel(w) {
    if (w.phase >= 1) return MARVEL.PHASES[w.phase].en;
    const u = MARVEL.UNIVERSES[w.universe];
    return u ? u.short : '番外';
  }

  const TYPE_LABEL = { movie: '电影', series: '剧集', special: '特别篇', anim: '动画' };
  const TYPE_ICO = { movie: '🎬', series: '📺', special: '🎁', anim: '✏️' };

  function runtimeText(w) {
    if (w.upcoming && !w.runtime) return '片长待定';
    if (w.type === 'series' || w.type === 'anim') {
      return `${w.episodes} 集 · 约 ${Math.round(w.runtime / 60)} 小时`;
    }
    return `${w.runtime} 分钟`;
  }

  function yearOf(w) { return w.release.slice(0, 4); }

  function tierBadge(w) {
    const map = { core: ['主线', 'tier-core'], recommended: ['推荐', 'tier-recommended'], optional: ['选看', 'tier-optional'] };
    const [txt, cls] = map[w.tier];
    return `<span class="tier-badge ${cls}">${txt}</span>`;
  }

  const AMBIG_PREFIX = ['复仇者联盟', '蜘蛛侠', '奇异博士', '美国队长', '雷神', '银河护卫队', '惊奇队长', '黑豹', '蚁人', '洛基', '夜魔侠'];

  function shortTitle(w) {
    if (w.title.length <= 7) return w.title;
    const parts = w.title.split(/[::]/);
    if (parts.length < 2) return w.title;
    const prefix = parts[0];
    if (/\d/.test(prefix) || !AMBIG_PREFIX.includes(prefix)) return prefix;
    return parts[1];
  }

  /* ---------- Toast ---------- */
  function toast(title, sub, gold) {
    const zone = $('#toast-zone');
    const el = document.createElement('div');
    el.className = 'toast' + (gold ? ' gold' : '');
    el.innerHTML = `<div class="toast-title">${title}</div>${sub ? `<div class="toast-sub">${sub}</div>` : ''}`;
    zone.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 350);
    }, 3600);
  }

  function announceUnlocks(fresh) {
    (fresh || []).forEach((a, i) => {
      setTimeout(() => toast(`${a.emoji} 成就解锁:${esc(a.name)}`, esc(a.desc), true), 500 + i * 700);
    });
  }

  /* ---------- 打卡核心 ---------- */
  function handleToggle(id) {
    const w = MARVEL.byId[id];
    if (!w) return;
    if (w.upcoming) {
      toast('⏳ 尚未上映', `《${esc(w.title)}》${esc(w.release)} 见!`);
      return;
    }
    const wasWatched = S.isWatched(id);
    const fresh = S.toggleWatched(id);
    if (!wasWatched) {
      const q = MARVEL.QUOTES[Math.floor(Math.random() * MARVEL.QUOTES.length)];
      toast(`✅ 已看完《${esc(w.title)}》`, `“${q.cn}” — ${q.en}`);
      const stone = MARVEL.STONES.find(s => s.workId === id);
      if (stone) {
        setTimeout(() => toast(`💎 点亮了${stone.name}!`, '到指挥中心看看你的收集台。', true), 400);
      }
    }
    announceUnlocks(fresh);
    render();
  }

  /* ---------- 作品卡片 ---------- */
  function posterOf(w) {
    return (MARVEL.POSTERS && MARVEL.POSTERS[w.id]) || null;
  }

  function statusBadge(w) {
    const st = S.statusOf(w.id);
    if (st === 'want') return '<span class="st-badge st-want">🤍 想看</span>';
    if (st === 'watching') return `<span class="st-badge st-watching">▶ ${S.state.progress[w.id]}/${w.episodes}</span>`;
    if (st === 'dropped') return '<span class="st-badge st-dropped">🚫 已弃</span>';
    return '';
  }

  function workCard(w) {
    const watched = S.isWatched(w.id);
    const poster = posterOf(w);
    return `
    <div class="work-card ${watched ? 'watched' : ''} ${w.upcoming ? 'upcoming' : ''}" data-open="${w.id}" style="--pc:${colorOf(w)}">
      <div class="wc-poster">
        ${poster ? `<img class="wc-img" src="${poster}" alt="" loading="lazy" onerror="this.remove()">` : ''}
        <div class="wc-top">
          <span class="wc-phase">${phaseLabel(w)}</span>
          <span class="wc-type-ico" title="${TYPE_LABEL[w.type]}">${TYPE_ICO[w.type]}</span>
        </div>
        <div class="wc-emoji">${w.emoji}</div>
        <div class="wc-en">${esc(w.enTitle)}</div>
        ${watched ? '<div class="wc-stamp">已观看</div>' : ''}
        ${w.upcoming ? '<div class="wc-upcoming-tag">未上映</div>' : ''}
        ${w.upcoming ? '' : `<button class="wc-check" data-toggle="${w.id}" title="${watched ? '取消标记' : '标记为已看'}">${watched ? '✓' : '＋'}</button>`}
      </div>
      <div class="wc-info">
        <div class="wc-title">${esc(w.title)}</div>
        <div class="wc-meta">
          <span>${yearOf(w)}</span>
          <span>${w.rating ? '⭐ ' + w.rating.toFixed(1) : '——'}</span>
          ${tierBadge(w)}
          ${statusBadge(w)}
        </div>
      </div>
    </div>`;
  }

  /* ==========================================================================
     视图:指挥中心
     ========================================================================== */
  function viewDashboard() {
    const total = MARVEL.WORKS.filter(w => !w.upcoming).length;
    const count = S.watchedCount();
    const hours = Math.round(S.minutesWatched() / 60 * 10) / 10;
    const pct = Math.round(count / total * 100);
    const unlockedCount = Object.keys(S.state.unlocked).length;

    const route = MARVEL.ROUTES.find(r => r.id === S.state.activeRoute) || MARVEL.ROUTES[0];
    const next = S.nextInRoute(route);
    const stones = S.stonesLit();
    const allLit = stones.every(s => s.lit);

    const greetings = count === 0
      ? '欢迎来到漫威宇宙——你的旅程从此刻开始'
      : pct >= 100 ? '全宇宙制霸,向你致敬' : `已完成 ${pct}%,宇宙正在你眼前展开`;

    const upcoming = MARVEL.WORKS.filter(w => w.upcoming).sort((a, b) => a.release.localeCompare(b.release));

    return `
    <div class="dash-hero">
      <div class="dash-hero-left">
        <div class="dash-greeting">MISSION CONTROL</div>
        <div class="dash-title">${count === 0 ? '从<em>零</em>开始,补全漫威宇宙' : `你已征服 <em>${count}</em> 部作品`}</div>
        <div class="dash-sub">${greetings}。当前路线:${route.emoji}「${route.name}」</div>
        <div class="dash-actions">
          <button class="btn btn-gold btn-sm" id="btn-report">📸 生成我的战报</button>
          <button class="btn btn-ghost btn-sm" id="btn-lab3d">🪐 3D 宝石展示台 <span class="lab-tag">实验</span></button>
        </div>
      </div>
      <div class="dash-stats">
        <div class="stat-card clickable" data-goto-watched="1" title="查看已看作品"><div class="stat-num">${count}<small>/${total}</small></div><div class="stat-label">已看作品</div></div>
        <div class="stat-card gold"><div class="stat-num">${hours}<small>h</small></div><div class="stat-label">累计时长</div></div>
        <div class="stat-card red"><div class="stat-num">${pct}<small>%</small></div><div class="stat-label">宇宙完成度</div></div>
        <div class="stat-card green clickable" data-goto-ach="1" title="查看成就墙"><div class="stat-num">${unlockedCount}<small>/${MARVEL.ACHIEVEMENTS.length}</small></div><div class="stat-label">成就解锁 →</div></div>
      </div>
    </div>

    <div class="section-title"><span class="st-main">INFINITY STONES</span><span class="st-sub">无限宝石收集台 · 看完对应作品即点亮</span></div>
    <div class="panel gauntlet-panel">
      <div class="gauntlet-stones">
        ${stones.map(s => `
          <div class="big-stone ${s.lit ? 'lit' : ''}" style="--c:${s.color}" data-open="${s.workId}" title="来自《${MARVEL.byId[s.workId].title}》">
            <div class="gem"></div>
            <div class="gem-name">${s.name}</div>
            <div class="gem-src">${s.src}</div>
          </div>`).join('')}
      </div>
      <div style="flex:1;min-width:200px">
        ${allLit
          ? (S.state.snapped
            ? `<div style="font-weight:900;color:var(--gold)">🧤 你已经打过响指了。</div><div style="font-size:12.5px;color:var(--muted);margin-top:4px">宇宙尚在恢复中……不过你随时可以再来一次。</div><button class="btn btn-gold btn-sm" id="btn-snap" style="margin-top:10px">再打一次</button>`
            : `<div style="font-weight:900;color:var(--gold)">六颗宝石已集齐。</div><div style="font-size:12.5px;color:var(--muted);margin:4px 0 10px">命运仍将到来。要不要……试试那个响指?</div><button class="btn btn-gold" id="btn-snap">🧤 打个响指</button>`)
          : `<div style="font-weight:700">已点亮 ${stones.filter(s => s.lit).length} / 6 颗</div><div style="font-size:12.5px;color:var(--muted);margin-top:4px">集齐六颗宝石会发生什么?试试就知道了。</div>`}
      </div>
    </div>

    <div class="section-title"><span class="st-main">NEXT UP</span><span class="st-sub">下一站 · 按当前路线推荐</span></div>
    ${next ? `
    <div class="next-up">
      <div class="next-poster" style="--pc:${colorOf(next)}" data-open="${next.id}">
        ${posterOf(next) ? `<img class="np-img" src="${posterOf(next)}" alt="" onerror="this.remove()">` : ''}
        <span class="np-emoji">${next.emoji}</span>
      </div>
      <div class="next-info">
        <div class="next-tag">MISSION ${route.items.indexOf(next.id) + 1} / ${route.items.length}</div>
        <div class="next-title">${esc(next.title)}</div>
        <div class="next-en">${esc(next.enTitle)} · ${yearOf(next)} · ${runtimeText(next)}</div>
        <div class="next-why">${esc((route.notes && route.notes[next.id]) || next.tagline)}</div>
        <div class="next-actions">
          <button class="btn btn-primary" data-toggle="${next.id}">✓ 标记看完</button>
          <button class="btn btn-ghost" data-open="${next.id}">查看资料</button>
          <button class="btn btn-ghost" data-nav="routes">全部任务</button>
        </div>
      </div>
    </div>` : `
    <div class="panel" style="text-align:center">
      <div style="font-size:34px">🎉</div>
      <div style="font-weight:900;font-size:17px;margin-top:6px">当前路线已全部完成!</div>
      <div style="color:var(--muted);font-size:13px;margin:6px 0 14px">去挑一条新路线,或在资料库里自由探索。</div>
      <button class="btn btn-primary" data-nav="routes">选择新路线</button>
    </div>`}

    ${S.watchingList().length ? `
    <div class="section-title"><span class="st-main">NOW WATCHING</span><span class="st-sub">正在追的剧集</span></div>
    <div class="watching-strip">
      ${S.watchingList().map(w => {
        const n = S.state.progress[w.id];
        const pct = Math.round(n / w.episodes * 100);
        return `
        <div class="watching-card" style="--pc:${colorOf(w)}">
          <div class="watching-head" data-open="${w.id}">
            <span style="font-size:22px">${w.emoji}</span>
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(w.title)}</div>
              <div style="font-size:11.5px;color:var(--muted)">第 ${n} / ${w.episodes} 集 · ${pct}%</div>
            </div>
          </div>
          <div class="watching-bar"><i style="width:${pct}%"></i></div>
          <button class="btn btn-ghost btn-sm" data-ep-work="${w.id}" data-ep="1" style="width:100%;justify-content:center">＋ 看完一集</button>
        </div>`;
      }).join('')}
    </div>` : ''}

    <div class="dash-grid" style="margin-top:34px">
      <div>
        <div class="section-title"><span class="st-main">ROUTES</span><span class="st-sub">全部观影路线 · 点击切换</span></div>
        <div class="route-mini-list">
          ${MARVEL.ROUTES.map(r => {
            const p = S.routeProgress(r);
            return `
            <div class="route-mini ${r.id === S.state.activeRoute ? 'active-route' : ''}" data-route="${r.id}">
              <div class="route-mini-ico">${r.emoji}</div>
              <div>
                <div class="route-mini-name">${esc(r.name)}</div>
                <div class="route-mini-desc">${p.done} / ${p.total} 已完成</div>
                <div class="route-mini-bar"><i style="width:${p.pct}%"></i></div>
              </div>
              <div class="route-mini-right">
                <div class="route-mini-pct">${p.pct}%</div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div>
        <div class="section-title"><span class="st-main">COMING SOON</span><span class="st-sub">未上映档期</span></div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${upcoming.map(w => `
            <div class="up-card" style="width:auto" data-open="${w.id}">
              <div class="up-date">${w.release.replace(/-/g, '.')}</div>
              <div class="up-name">${w.emoji} ${esc(w.title)}</div>
              <div class="up-en">${esc(w.enTitle)}</div>
            </div>`).join('')}
        </div>
        <div class="footnote">档期与内容以官方最新公布为准。</div>
      </div>
    </div>`;
  }

  /* ==========================================================================
     视图:观影路线
     ========================================================================== */
  function viewRoutes() {
    const active = MARVEL.ROUTES.find(r => r.id === S.state.activeRoute) || MARVEL.ROUTES[0];
    const p = S.routeProgress(active);
    const nextId = active.items.find(id => !S.isWatched(id) && !MARVEL.byId[id].upcoming);

    const r = 40, circ = 2 * Math.PI * r;
    const offset = circ * (1 - p.pct / 100);

    const totalMin = active.items.reduce((s, id) => s + (MARVEL.byId[id].runtime || 0), 0);

    return `
    <div class="section-title"><span class="st-main">CHOOSE YOUR PATH</span><span class="st-sub">选择一条路线,像做任务一样补完宇宙</span></div>
    <div class="routes-header-grid">
      ${MARVEL.ROUTES.map(rt => {
        const rp = S.routeProgress(rt);
        return `
        <div class="route-card ${rt.id === active.id ? 'selected' : ''}" data-route="${rt.id}">
          ${rt.badge ? `<div class="rc-badge">${rt.badge}</div>` : ''}
          <div class="rc-ico">${rt.emoji}</div>
          <div class="rc-name">${esc(rt.name)}</div>
          <div class="rc-desc">${esc(rt.desc)}</div>
          <div class="rc-meta">
            <span>📋 ${rt.items.length} 部</span>
            <span>✅ ${rp.done} 完成</span>
            <span style="margin-left:auto;color:var(--gold);font-weight:700">${rp.pct}%</span>
          </div>
        </div>`;
      }).join('')}
    </div>

    <div class="section-title"><span class="st-main">${esc(active.name.toUpperCase())}</span><span class="st-sub">任务清单</span></div>
    <div class="panel">
      <div class="route-progress-panel">
        <div class="progress-ring-wrap">
          <svg width="92" height="92">
            <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#e62429"/><stop offset="100%" stop-color="#f0b429"/>
            </linearGradient></defs>
            <circle class="ring-bg" cx="46" cy="46" r="${r}" fill="none" stroke-width="8"/>
            <circle class="ring-fg" cx="46" cy="46" r="${r}" fill="none" stroke-width="8"
              stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
          </svg>
          <div class="ring-center"><div class="ring-pct">${p.pct}%</div><div class="ring-label">${p.done}/${p.total}</div></div>
        </div>
        <div style="flex:1;min-width:220px">
          <div style="font-weight:900;font-size:17px">${active.emoji} ${esc(active.name)}</div>
          <div style="color:var(--muted);font-size:13px;margin-top:4px">${esc(active.desc)}</div>
          <div style="color:var(--faint);font-size:12px;margin-top:8px">总时长约 ${Math.round(totalMin / 60)} 小时 · 剩余约 ${Math.round(active.items.filter(id => !S.isWatched(id)).reduce((s, id) => s + (MARVEL.byId[id].runtime || 0), 0) / 60)} 小时</div>
        </div>
        ${nextId ? `<button class="btn btn-primary" data-open="${nextId}">▶ 继续:${esc(shortTitle(MARVEL.byId[nextId]))}</button>` : ''}
      </div>

      <div class="mission-list">
        ${active.items.map((id, i) => {
          const w = MARVEL.byId[id];
          const done = S.isWatched(id);
          const isCurrent = id === nextId;
          const note = active.notes && active.notes[id];
          return `
          <div class="mission-item ${done ? 'done' : ''} ${isCurrent ? 'current' : ''}">
            <button class="mission-check" data-toggle="${id}" title="${done ? '取消标记' : '标记为已看'}">
              ${done ? '✔' : `<span class="mc-num">${i + 1}</span>`}
            </button>
            <div class="mission-body" data-open="${id}">
              <div class="mission-title">
                ${w.emoji} ${esc(w.title)}
                ${tierBadge(w)}
                ${isCurrent ? '<span class="current-tag">当前任务</span>' : ''}
                ${w.upcoming ? '<span class="chip">未上映</span>' : ''}
              </div>
              <div class="mission-sub">${esc(w.enTitle)} · ${TYPE_LABEL[w.type]} · ${runtimeText(w)}</div>
              ${note ? `<div class="mission-note">${esc(note)}</div>` : ''}
            </div>
            <div class="mission-right">
              <span class="mission-year">${yearOf(w)}</span>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  /* ==========================================================================
     视图:资料库
     ========================================================================== */
  const dbFilter = { phase: 'all', type: 'all', tier: 'all', watch: 'all' };

  function viewDatabase() {
    let list = MARVEL.WORKS.slice().sort((a, b) => a.release.localeCompare(b.release));

    if (dbFilter.phase !== 'all') {
      if (dbFilter.phase === 'legacy') list = list.filter(w => w.phase === 0);
      else list = list.filter(w => w.phase === Number(dbFilter.phase));
    }
    if (dbFilter.type !== 'all') list = list.filter(w => w.type === dbFilter.type);
    if (dbFilter.tier !== 'all') list = list.filter(w => w.tier === dbFilter.tier);
    if (dbFilter.watch === 'watched') list = list.filter(w => S.statusOf(w.id) === 'done');
    if (dbFilter.watch === 'unwatched') list = list.filter(w => S.statusOf(w.id) !== 'done' && !w.upcoming);
    if (dbFilter.watch === 'want') list = list.filter(w => S.statusOf(w.id) === 'want');
    if (dbFilter.watch === 'watching') list = list.filter(w => S.statusOf(w.id) === 'watching');
    if (dbFilter.watch === 'dropped') list = list.filter(w => S.statusOf(w.id) === 'dropped');

    const fc = (group, val, label) =>
      `<span class="f-chip ${dbFilter[group] === String(val) ? 'on' : ''}" data-filter="${group}:${val}">${label}</span>`;

    return `
    <div class="section-title"><span class="st-main">DATABASE</span><span class="st-sub">漫威影视资料库 · 点击卡片查看详情与前后关联</span></div>
    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">阶段</span>
        ${fc('phase', 'all', '全部')}
        ${[1, 2, 3, 4, 5, 6].map(n => fc('phase', n, 'P' + n)).join('')}
        ${fc('phase', 'legacy', '前代番外')}
      </div>
      <div class="filter-sep"></div>
      <div class="filter-group">
        <span class="filter-label">类型</span>
        ${fc('type', 'all', '全部')}${fc('type', 'movie', '电影')}${fc('type', 'series', '剧集')}${fc('type', 'special', '特别篇')}${fc('type', 'anim', '动画')}
      </div>
      <div class="filter-sep"></div>
      <div class="filter-group">
        <span class="filter-label">重要度</span>
        ${fc('tier', 'all', '全部')}${fc('tier', 'core', '主线')}${fc('tier', 'recommended', '推荐')}${fc('tier', 'optional', '选看')}
      </div>
      <div class="filter-sep"></div>
      <div class="filter-group">
        ${fc('watch', 'all', '全部')}${fc('watch', 'unwatched', '未看')}${fc('watch', 'want', '🤍想看')}${fc('watch', 'watching', '▶在看')}${fc('watch', 'watched', '✔已看')}${fc('watch', 'dropped', '🚫已弃')}
      </div>
      <span class="result-count">${list.length} 部作品</span>
    </div>
    <div class="works-grid">${list.map(workCard).join('')}</div>
    ${list.length === 0 ? '<div class="empty-state"><div class="es-ico">🔍</div>没有符合条件的作品</div>' : ''}`;
  }

  /* ==========================================================================
     视图:时间线
     ========================================================================== */
  let tlMode = 'release';

  function tlItem(w, dateLabel) {
    const watched = S.isWatched(w.id);
    return `
    <div class="tl-item ${watched ? 'watched' : ''}" data-open="${w.id}" style="--dc:${colorOf(w)}">
      <span class="tl-date">${dateLabel}</span>
      <span class="tl-emoji">${w.emoji}</span>
      <span class="tl-name">${esc(w.title)}</span>
      <span class="tl-en">${esc(w.enTitle)}</span>
      ${w.upcoming ? '<span class="chip">未上映</span>' : ''}
      ${watched ? '<span class="tl-check">✔ 已看</span>' : ''}
    </div>`;
  }

  function viewTimeline() {
    let content = '';

    if (tlMode === 'release') {
      const eras = [1, 2, 3, 4, 5, 6].map(n => ({
        badge: `${MARVEL.PHASES[n].en} · ${MARVEL.PHASES[n].name}`,
        color: MARVEL.PHASES[n].color,
        desc: MARVEL.PHASES[n].desc,
        works: MARVEL.WORKS.filter(w => w.phase === n).sort((a, b) => a.release.localeCompare(b.release)),
      }));
      eras.push({
        badge: 'LEGACY · 前代与番外',
        color: '#7f8da3',
        desc: 'MCU 之外的漫威影视:蜘蛛侠老三部曲、X战警、网飞剧集等。按各自上映时间排列。',
        works: MARVEL.WORKS.filter(w => w.phase === 0).sort((a, b) => a.release.localeCompare(b.release)),
      });
      content = eras.map(era => `
        <div class="tl-era" style="--ec:${era.color}">
          <span class="tl-era-badge">${era.badge}</span>
          <div class="tl-era-desc">${era.desc}</div>
        </div>
        ${era.works.map(w => tlItem(w, w.release.slice(0, 7).replace('-', '.'))).join('')}
      `).join('');
    } else {
      const chronoWorks = MARVEL.WORKS.filter(w => w.universe === 'mcu' && w.chron !== null).sort((a, b) => a.chron - b.chron);
      const outside = MARVEL.WORKS.filter(w => w.universe === 'mcu' && w.chron === null).sort((a, b) => a.release.localeCompare(b.release));
      const merged = [
        ...chronoWorks.map(w => ({ kind: 'work', chron: w.chron, w })),
        ...(MARVEL.EVENTS || []).map(ev => ({ kind: 'event', chron: ev.chron, ev })),
      ].sort((a, b) => a.chron - b.chron);
      content = `
        <div class="tl-era" style="--ec:#22c1dc">
          <span class="tl-era-badge">CHRONOLOGY · 故事时间线</span>
          <div class="tl-era-desc">按故事发生顺序排列(参考官方时间线,细节处存在粉丝争议)。标签为故事发生年份,💥 为宇宙大事件(点击可去百科查看)。⚠️ 首刷此顺序会剧透部分悬念,推荐二刷使用。</div>
        </div>
        ${merged.map(item => {
          if (item.kind === 'event') {
            const ev = item.ev;
            return `
            <div class="tl-item tl-event" data-goto-lore="1">
              <span class="tl-date" style="color:var(--gold)">💥</span>
              <span class="tl-emoji">${ev.emoji}</span>
              <span class="tl-name" style="color:var(--gold)">${esc(ev.name)}</span>
              <span class="tl-en">${esc(ev.year)}</span>
            </div>`;
          }
          const w = item.w;
          return `
          <div class="tl-item ${S.isWatched(w.id) ? 'watched' : ''}" data-open="${w.id}" style="--dc:${colorOf(w)}">
            <span class="tl-date">${yearOf(w)}</span>
            <span class="tl-emoji">${w.emoji}</span>
            <span class="tl-name">${esc(w.title)}</span>
            <span class="tl-story-year">📍 ${esc(w.storyYear)}</span>
            ${w.upcoming ? '<span class="chip">未上映</span>' : ''}
            ${S.isWatched(w.id) ? '<span class="tl-check">✔ 已看</span>' : ''}
          </div>`;
        }).join('')}
        <div class="tl-era" style="--ec:#9b59ff">
          <span class="tl-era-badge">OUTSIDE TIME · 时间之外</span>
          <div class="tl-era-desc">发生在多元宇宙 / 历史长河中的作品,不占用主时间线。</div>
        </div>
        ${outside.map(w => tlItem(w, w.release.slice(0, 7).replace('-', '.'))).join('')}`;
    }

    return `
    <div class="section-title"><span class="st-main">TIMELINE</span><span class="st-sub">两种视角看宇宙</span></div>
    <div class="tl-tabs">
      <button class="btn ${tlMode === 'release' ? 'btn-primary' : 'btn-ghost'}" data-tlmode="release">🎬 上映顺序</button>
      <button class="btn ${tlMode === 'chrono' ? 'btn-primary' : 'btn-ghost'}" data-tlmode="chrono">📖 故事时间线</button>
      <button class="btn ${tlMode === 'axis' ? 'btn-primary' : 'btn-ghost'}" data-tlmode="axis">🧭 动态年代轴</button>
      <button class="btn ${tlMode === 'corridor' ? 'btn-primary' : 'btn-ghost'}" data-tlmode="corridor">✨ 年代长廊</button>
    </div>
    ${tlMode === 'corridor'
      ? threeHost('corridor', '<button class="gt-btn" id="three-today" title="跳到今天">📍</button>') + '<div class="map-hint">✨ 年代长廊:滚轮沿时间前进/后退 · 拖拽微调视角 · 海报立牌按三列排布,金框为已看,阶段色带铺地,金门为今天。点击海报看详情。</div>'
      : (tlMode === 'axis' ? MARVEL.axis.html() : `<div class="tl-wrap">${content}</div>`)}`;
  }

  /* ==========================================================================
     视图:宇宙链路(地铁图)
     ========================================================================== */
  let activeThread = null;
  let metroGeom = null;

  function viewMap() {
    const works = MARVEL.WORKS
      .filter(w => w.universe === 'mcu' && w.threads && w.threads.length > 0)
      .sort((a, b) => a.release.localeCompare(b.release));

    // 蛇形布局
    const perRow = 6;
    const stepX = 168, stepY = 152, mx = 96, my = 84;
    const pos = {};
    works.forEach((w, i) => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const x = mx + (row % 2 === 0 ? col : perRow - 1 - col) * stepX;
      const y = my + row * stepY;
      pos[w.id] = { x, y };
    });
    const rows = Math.ceil(works.length / perRow);
    const W = mx * 2 + (perRow - 1) * stepX;
    const H = my * 2 + (rows - 1) * stepY;
    metroGeom = { W, H };

    // 线路路径
    const threadIds = Object.keys(MARVEL.THREADS);
    const paths = threadIds.map((tid, ti) => {
      const t = MARVEL.THREADS[tid];
      const members = works.filter(w => w.threads.includes(tid));
      if (members.length < 2) return '';
      const off = (ti - (threadIds.length - 1) / 2) * 5;
      const pts = members.map(w => ({ x: pos[w.id].x, y: pos[w.id].y + off }));
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const midX = (a.x + b.x) / 2;
        d += ` C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`;
      }
      const cls = activeThread
        ? (activeThread === tid ? 'thread-path hl' : 'thread-path faded')
        : 'thread-path';
      return `<path class="${cls}" data-thread-path="${tid}" pathLength="1000" d="${d}" stroke="${t.color}" style="--c:${t.color}"/>`;
    }).join('');

    // 高亮线的顺序号与「下一站」
    const activeMembers = activeThread ? works.filter(w => w.threads.includes(activeThread)) : [];
    const orderMap = {};
    activeMembers.forEach((w, i) => { orderMap[w.id] = i + 1; });
    const nextWork = activeThread ? activeMembers.find(w => !S.isWatched(w.id) && !w.upcoming) : null;
    const tcolor = activeThread ? MARVEL.THREADS[activeThread].color : null;

    // 站点
    const stations = works.map(w => {
      const p = pos[w.id];
      const inActive = !activeThread || w.threads.includes(activeThread);
      const watched = S.isWatched(w.id);
      const isNext = nextWork && w.id === nextWork.id;
      return `
      <g class="metro-station ${watched ? 'watched' : ''} ${inActive ? '' : 'dimmed'} ${isNext ? 'next-station' : ''}"
         data-open="${w.id}" data-threads="${w.threads.join(' ')}" transform="translate(${p.x},${p.y})">
        ${isNext ? '<circle class="st-pulse" r="22"></circle>' : ''}
        <circle class="st-outer" r="17"></circle>
        <text class="st-emoji" text-anchor="middle" dy="5">${w.emoji}</text>
        <text class="st-label" text-anchor="middle" y="34">${esc(shortTitle(w))}</text>
        <text class="st-label" text-anchor="middle" y="47" style="font-size:9px;opacity:.65">${yearOf(w)}</text>
        ${orderMap[w.id] ? `<g class="st-order" transform="translate(15,-15)" style="--c:${tcolor}"><circle r="8.5"></circle><text text-anchor="middle" dy="3.5">${orderMap[w.id]}</text></g>` : ''}
        ${isNext ? '<text class="st-next-label" text-anchor="middle" y="-28">▼ 下一站</text>' : ''}
      </g>`;
    }).join('');

    const t = activeThread ? MARVEL.THREADS[activeThread] : null;
    const threadDetail = t ? (() => {
      const done = activeMembers.filter(w => S.isWatched(w.id)).length;
      const pct = activeMembers.length ? Math.round(done / activeMembers.length * 100) : 0;
      return `
      <div class="thread-info" style="--c:${t.color}">
        <h3>${t.emoji} ${esc(t.name)}</h3>
        <p>${esc(t.desc)}</p>
        <div class="ti-progress">
          <div class="ti-bar"><i style="width:${pct}%"></i></div>
          <span class="ti-num">${done}/${activeMembers.length} 已看 · ${pct}%</span>
          ${nextWork
            ? `<button class="btn btn-ghost btn-sm" data-open="${nextWork.id}">▶ 下一站:${esc(shortTitle(nextWork))}</button>`
            : (done === activeMembers.length ? '<span class="chip chip-done">✔ 本线全通,恭喜!</span>' : '')}
        </div>
        <div class="thread-works">
          ${activeMembers.map((w, i) => `<span class="chip clickable ${S.isWatched(w.id) ? 'chip-done' : ''}" data-open="${w.id}">${i + 1}. ${S.isWatched(w.id) ? '✔ ' : ''}${esc(shortTitle(w))}</span>`).join('')}
        </div>
      </div>`;
    })() : '';

    return `
    <div class="section-title"><span class="st-main">UNIVERSE MAP</span><span class="st-sub">宇宙链路图 · ${mode3d().map ? '立体地铁模式' : '像地铁线路一样追踪每条故事线'}</span>${modeToggle('map')}</div>
    <div class="map-legend">
      ${threadIds.map(tid => {
        const th = MARVEL.THREADS[tid];
        const members = works.filter(w => w.threads.includes(tid));
        const done = members.filter(w => S.isWatched(w.id)).length;
        return `<span class="legend-chip ${activeThread === tid ? 'on' : ''}" data-thread="${tid}" style="--c:${th.color}"><span class="lc-dot"></span>${th.emoji} ${esc(th.name)}<i class="lc-count">${done}/${members.length}</i></span>`;
      }).join('')}
      ${activeThread ? '<span class="legend-chip" data-thread="">✕ 清除高亮</span>' : ''}
    </div>
    ${mode3d().map ? threeHost('map') + threadDetail + `
    <div class="map-hint">✨ 立体地铁:9 条故事线分层悬浮,竖井表示换乘;点击图例锁定线路后该线升亮并出现粒子流与顺序号,金色光柱为「下一站」。拖拽旋转 · Shift+拖拽平移 · 滚轮缩放。</div>` : `
    <div class="graph-wrap">
      <svg id="metro-svg" viewBox="0 0 ${W} ${H}">
        ${paths}
        ${stations}
      </svg>
      <div class="graph-tools">
        <button class="gt-btn" id="mt-zoomin" title="放大">＋</button>
        <button class="gt-btn" id="mt-zoomout" title="缩小">－</button>
        <button class="gt-btn" id="mt-reset" title="复位视角">⛶</button>
      </div>
    </div>
    ${threadDetail}
    <div class="map-hint">💡 点击图例锁定一条故事线(未锁定时悬停图例可预览);高亮线会画出行进动画,并标出观看顺序号与「下一站」。滚轮缩放 · 拖拽空白平移 · 金色站点已观看。</div>`}`;
  }

  /* 宇宙链路:缩放 / 平移 / 图例悬停预览 */
  function initMetroMap() {
    const svg = $('#metro-svg');
    if (!svg || !metroGeom) return;
    const { W, H } = metroGeom;
    let vb = { x: 0, y: 0, w: W, h: H };
    const applyVB = () => svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);

    let pan = null;
    svg.addEventListener('pointerdown', e => {
      if (e.target.closest('.metro-station')) return;
      pan = { px: e.clientX, py: e.clientY };
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener('pointermove', e => {
      if (!pan) return;
      const s = vb.w / svg.getBoundingClientRect().width;
      vb.x -= (e.clientX - pan.px) * s;
      vb.y -= (e.clientY - pan.py) * s;
      pan.px = e.clientX; pan.py = e.clientY;
      applyVB();
    });
    svg.addEventListener('pointerup', () => { pan = null; });

    function zoomAt(factor, cx, cy) {
      const nw = Math.max(360, Math.min(2400, vb.w * factor));
      const k = nw / vb.w;
      vb.x = cx - (cx - vb.x) * k;
      vb.y = cy - (cy - vb.y) * k;
      vb.w = nw; vb.h = vb.h * k;
      applyVB();
    }

    svg.addEventListener('wheel', e => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const cx = vb.x + (e.clientX - rect.left) / rect.width * vb.w;
      const cy = vb.y + (e.clientY - rect.top) / rect.height * vb.h;
      zoomAt(e.deltaY > 0 ? 1.12 : 0.89, cx, cy);
    }, { passive: false });

    const btn = id => document.getElementById(id);
    const center = () => ({ cx: vb.x + vb.w / 2, cy: vb.y + vb.h / 2 });
    if (btn('mt-zoomin')) btn('mt-zoomin').onclick = () => { const c = center(); zoomAt(0.8, c.cx, c.cy); };
    if (btn('mt-zoomout')) btn('mt-zoomout').onclick = () => { const c = center(); zoomAt(1.25, c.cx, c.cy); };
    if (btn('mt-reset')) btn('mt-reset').onclick = () => { vb = { x: 0, y: 0, w: W, h: H }; applyVB(); };

    // 图例悬停预览(未锁定时)
    $$('.map-legend .legend-chip[data-thread]').forEach(chip => {
      const tid = chip.dataset.thread;
      if (!tid) return;
      chip.addEventListener('mouseenter', () => {
        if (activeThread) return;
        svg.querySelectorAll('[data-thread-path]').forEach(p => {
          p.classList.toggle('pre', p.dataset.threadPath === tid);
          p.classList.toggle('faded-tmp', p.dataset.threadPath !== tid);
        });
        svg.querySelectorAll('.metro-station').forEach(st => {
          st.classList.toggle('dimmed-tmp', !st.dataset.threads.split(' ').includes(tid));
        });
      });
      chip.addEventListener('mouseleave', () => {
        svg.querySelectorAll('.pre, .faded-tmp').forEach(el => el.classList.remove('pre', 'faded-tmp'));
        svg.querySelectorAll('.dimmed-tmp').forEach(el => el.classList.remove('dimmed-tmp'));
      });
    });
  }

  /* ==========================================================================
     视图:角色图谱
     ========================================================================== */
  const REL_STYLE = {
    family: { name: '亲缘', color: '#f0b429' },
    love: { name: '爱人', color: '#ff5ca8' },
    mentor: { name: '师承', color: '#4d9fff' },
    comrade: { name: '战友', color: '#3ecf8e' },
    rival: { name: '宿敌', color: '#e62429' },
  };

  let activeFaction = null;
  let graphDragged = false;
  const graphPos = {};   // 记住节点拖拽位置,切换视图后保留

  function charWorks(c) {
    const names = new Set([c.name, ...c.aliases]);
    return MARVEL.WORKS
      .filter(w => (w.characters || []).some(n => names.has(n)))
      .sort((a, b) => a.release.localeCompare(b.release));
  }

  /* 高阶版(2.5D)开关 */
  const mode3d = () => S.state.settings.mode3d || {};
  const modeToggle = kind => `<button class="btn btn-sm ${mode3d()[kind] ? 'btn-gold' : 'btn-ghost'} mode-toggle" data-mode3d="${kind}">${mode3d()[kind] ? '📄 切回扁平版' : '✨ 切换高阶版'}</button>`;
  const threeHost = (kind, extraBtns) => `
    <div class="three-wrap" id="three-host" data-kind="${kind}">
      <div class="graph-tools">
        <button class="gt-btn" id="three-reset" title="复位视角">⛶</button>
        ${extraBtns || ''}
      </div>
    </div>`;

  /* 称号优先展示:钢铁侠(托尼·斯塔克) */
  function charLabel(c) { return c.title || c.name; }
  function charSub(c) { return c.title && c.title !== c.name ? c.name : ''; }
  function charFull(c) { const sub = charSub(c); return sub ? `${charLabel(c)}(${sub})` : c.name; }

  function viewCharacters() {
    const factions = Object.entries(MARVEL.FACTIONS);
    return `
    <div class="section-title"><span class="st-main">CHARACTER WEB</span><span class="st-sub">角色关系图谱 · ${mode3d().characters ? '星系模式' : '拖拽节点'} · 点击查看角色档案</span>${modeToggle('characters')}</div>
    <div class="map-legend">
      ${factions.map(([fid, f]) => `<span class="legend-chip ${activeFaction === fid ? 'on' : ''}" data-faction="${fid}" style="--c:${f.color}"><span class="lc-dot"></span>${f.name}</span>`).join('')}
      ${activeFaction ? '<span class="legend-chip" data-faction="">✕ 清除</span>' : ''}
    </div>
    <div class="map-legend rel-legend">
      ${Object.entries(REL_STYLE).map(([t, r]) => `<span class="rel-key"><i style="background:${r.color}"></i>${r.name}</span>`).join('')}
    </div>
    ${mode3d().characters ? threeHost('characters') + `
    <div class="map-hint">✨ 星系模式:拖拽旋转星盘 · Shift+拖拽平移 · 滚轮缩放 · 悬停聚焦关系 · 点击星体看档案。阵营聚为星云,关系为弧形光轨。</div>` : `
    <div class="graph-wrap">
      <svg id="char-svg"></svg>
      <div class="graph-tools">
        <button class="gt-btn" id="gt-zoomin" title="放大">＋</button>
        <button class="gt-btn" id="gt-zoomout" title="缩小">－</button>
        <button class="gt-btn" id="gt-reset" title="复位视角">⛶</button>
        <button class="gt-btn" id="gt-relayout" title="重新布局">🔄</button>
      </div>
    </div>
    <div class="map-hint">💡 滚轮缩放 · 拖拽空白处平移 · 拖拽节点重排 · 悬停聚焦一位角色的所有关系 · 点击节点看档案。</div>`}

    <div class="section-title"><span class="st-main">ROSTER</span><span class="st-sub">角色名册 · ${MARVEL.CHARACTERS.length} 位</span></div>
    <div class="roster-grid">
      ${MARVEL.CHARACTERS.filter(c => !activeFaction || c.faction === activeFaction).map(c => {
        const f = MARVEL.FACTIONS[c.faction];
        const n = charWorks(c).length;
        return `
        <div class="roster-card" data-char="${c.id}" style="--fc:${f.color}">
          <div class="roster-emoji">${c.emoji}</div>
          <div class="roster-name">${esc(charLabel(c))}</div>
          ${charSub(c) ? `<div class="roster-sub">${esc(charSub(c))}</div>` : ''}
          <div class="roster-en">${esc(c.en)}</div>
          <div class="roster-meta"><span class="chip" style="border-color:${f.color};color:${f.color}">${f.name}</span></div>
          <div class="roster-actor">${esc(c.actor)} · 登场 ${n} 部</div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function initCharGraph() {
    const svg = $('#char-svg');
    if (!svg) return;
    const W = 1150, H = 720;
    let vb = { x: 0, y: 0, w: W, h: H };
    const applyVB = () => svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    applyVB();

    const chars = MARVEL.CHARACTERS;
    const factionIds = Object.keys(MARVEL.FACTIONS);
    const anchors = {};
    factionIds.forEach((fid, i) => {
      const ang = (i / factionIds.length) * Math.PI * 2 - Math.PI / 2;
      anchors[fid] = { x: W / 2 + Math.cos(ang) * 320, y: H / 2 + Math.sin(ang) * 235 };
    });

    const nodes = chars.map(c => {
      const a = anchors[c.faction];
      const saved = graphPos[c.id];
      return {
        c,
        x: saved ? saved.x : a.x + (Math.random() - 0.5) * 140,
        y: saved ? saved.y : a.y + (Math.random() - 0.5) * 140,
        vx: 0, vy: 0,
        pinned: !!saved,
      };
    });
    const byId = {};
    nodes.forEach(n => { byId[n.c.id] = n; });
    const edges = MARVEL.RELATIONS
      .filter(r => byId[r.a] && byId[r.b])
      .map(r => ({ ...r, na: byId[r.a], nb: byId[r.b] }));

    /* ---------- 构建 DOM ---------- */
    svg.innerHTML = `
      ${edges.map((e, i) => `<path id="cedge-${i}" class="char-edge" stroke="${REL_STYLE[e.type].color}"><title>${esc(charFull(MARVEL.charById[e.a]))} — ${esc(e.label)} — ${esc(charFull(MARVEL.charById[e.b]))}</title></path>`).join('')}
      ${nodes.map(n => {
        const f = MARVEL.FACTIONS[n.c.faction];
        const dim = activeFaction && n.c.faction !== activeFaction;
        return `
        <g class="char-node ${dim ? 'dimmed' : ''}" data-char="${n.c.id}" style="--fc:${f.color}">
          <circle class="cn-circle" r="25"></circle>
          <text class="cn-emoji" text-anchor="middle" dy="8">${n.c.emoji}</text>
          <text class="cn-name" text-anchor="middle" y="42">${esc(charLabel(n.c))}</text>
          ${charSub(n.c) ? `<text class="cn-sub" text-anchor="middle" y="55">${esc(charSub(n.c))}</text>` : ''}
        </g>`;
      }).join('')}`;

    const edgeEls = edges.map((e, i) => svg.querySelector(`#cedge-${i}`));
    const nodeEls = {};
    svg.querySelectorAll('.char-node').forEach(g => { nodeEls[g.dataset.char] = g; });

    if (activeFaction) {
      edges.forEach((e, i) => {
        if (e.na.c.faction !== activeFaction && e.nb.c.faction !== activeFaction) {
          edgeEls[i].classList.add('faded');
        }
      });
    }

    /* ---------- 绘制:曲线边 + 节点位移 ---------- */
    function edgePath(e) {
      const dx = e.nb.x - e.na.x, dy = e.nb.y - e.na.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const bend = Math.min(34, d * 0.16);
      const cx = (e.na.x + e.nb.x) / 2 - dy / d * bend;
      const cy = (e.na.y + e.nb.y) / 2 + dx / d * bend;
      return `M ${e.na.x.toFixed(1)} ${e.na.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${e.nb.x.toFixed(1)} ${e.nb.y.toFixed(1)}`;
    }

    function draw() {
      edges.forEach((e, i) => edgeEls[i].setAttribute('d', edgePath(e)));
      nodes.forEach(n => nodeEls[n.c.id].setAttribute('transform', `translate(${n.x.toFixed(1)},${n.y.toFixed(1)})`));
    }

    /* ---------- 实时物理模拟 ---------- */
    let alpha = Object.keys(graphPos).length ? 0.35 : 1;
    let running = false;
    let dragNode = null;

    function tick() {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          let dx = b.x - a.x, dy = b.y - a.y;
          const d2 = Math.max(dx * dx + dy * dy, 100);
          if (d2 < 34000) {
            const d = Math.sqrt(d2);
            const f = 2800 * alpha / d2;
            dx /= d; dy /= d;
            a.vx -= dx * f * 9; a.vy -= dy * f * 9;
            b.vx += dx * f * 9; b.vy += dy * f * 9;
          }
        }
      }
      edges.forEach(e => {
        const dx = e.nb.x - e.na.x, dy = e.nb.y - e.na.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (d - 150) * 0.03 * alpha;
        e.na.vx += dx / d * f; e.na.vy += dy / d * f;
        e.nb.vx -= dx / d * f; e.nb.vy -= dy / d * f;
      });
      nodes.forEach(n => {
        if (n === dragNode || (n.pinned && alpha < 0.5)) { n.vx = 0; n.vy = 0; return; }
        const a = anchors[n.c.faction];
        n.vx += (a.x - n.x) * 0.015 * alpha;
        n.vy += (a.y - n.y) * 0.015 * alpha;
        n.vx *= 0.78; n.vy *= 0.78;
        n.x = Math.max(70, Math.min(W - 70, n.x + n.vx));
        n.y = Math.max(56, Math.min(H - 68, n.y + n.vy));
      });
    }

    function loop() {
      if (!document.body.contains(svg)) { running = false; return; } // 视图已切走,停表
      alpha *= 0.986;
      if (alpha < 0.02 && !dragNode) { running = false; draw(); return; }
      tick();
      draw();
      requestAnimationFrame(loop);
    }

    function reheat(a) {
      alpha = Math.max(alpha, a);
      if (!running) { running = true; requestAnimationFrame(loop); }
    }

    reheat(alpha);

    /* ---------- 悬停聚焦 ---------- */
    const adj = {};
    edges.forEach((e, i) => {
      (adj[e.a] = adj[e.a] || []).push({ i, other: e.b });
      (adj[e.b] = adj[e.b] || []).push({ i, other: e.a });
    });
    Object.entries(nodeEls).forEach(([id, g]) => {
      g.addEventListener('mouseenter', () => {
        const keep = new Set([id, ...(adj[id] || []).map(x => x.other)]);
        const keepEdges = new Set((adj[id] || []).map(x => x.i));
        Object.entries(nodeEls).forEach(([nid, el]) => el.classList.toggle('hover-dim', !keep.has(nid)));
        edgeEls.forEach((el, i) => el.classList.toggle('hover-dim', !keepEdges.has(i)));
      });
      g.addEventListener('mouseleave', () => {
        svg.querySelectorAll('.hover-dim').forEach(el => el.classList.remove('hover-dim'));
      });
    });

    /* ---------- 拖拽节点 / 平移画布 ---------- */
    const toSVGScale = () => vb.w / svg.getBoundingClientRect().width;
    let pan = null;

    svg.addEventListener('pointerdown', e => {
      const g = e.target.closest('.char-node');
      if (g) {
        dragNode = byId[g.dataset.char];
        dragNode.moved = 0;
        reheat(0.25); // 邻居跟着让位,拖起来是"活"的
      } else {
        pan = { px: e.clientX, py: e.clientY };
      }
      svg.setPointerCapture(e.pointerId);
    });

    svg.addEventListener('pointermove', e => {
      const s = toSVGScale();
      if (dragNode) {
        dragNode.x = Math.max(70, Math.min(W - 70, dragNode.x + e.movementX * s));
        dragNode.y = Math.max(56, Math.min(H - 68, dragNode.y + e.movementY * s));
        dragNode.moved = (dragNode.moved || 0) + Math.abs(e.movementX) + Math.abs(e.movementY);
        if (!running) draw();
      } else if (pan) {
        vb.x -= (e.clientX - pan.px) * s;
        vb.y -= (e.clientY - pan.py) * s;
        pan.px = e.clientX; pan.py = e.clientY;
        applyVB();
      }
    });

    svg.addEventListener('pointerup', () => {
      if (dragNode) {
        if (dragNode.moved > 6) {
          graphDragged = true;
          dragNode.pinned = true;
          graphPos[dragNode.c.id] = { x: dragNode.x, y: dragNode.y };
        }
        dragNode = null;
      }
      pan = null;
    });

    /* ---------- 缩放 ---------- */
    function zoomAt(factor, cx, cy) {
      const nw = Math.max(380, Math.min(2200, vb.w * factor));
      const k = nw / vb.w;
      vb.x = cx - (cx - vb.x) * k;
      vb.y = cy - (cy - vb.y) * k;
      vb.w = nw; vb.h = vb.h * k;
      applyVB();
    }

    svg.addEventListener('wheel', e => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const cx = vb.x + (e.clientX - rect.left) / rect.width * vb.w;
      const cy = vb.y + (e.clientY - rect.top) / rect.height * vb.h;
      zoomAt(e.deltaY > 0 ? 1.12 : 0.89, cx, cy);
    }, { passive: false });

    const center = () => ({ cx: vb.x + vb.w / 2, cy: vb.y + vb.h / 2 });
    const btn = id => document.getElementById(id);
    if (btn('gt-zoomin')) btn('gt-zoomin').onclick = () => { const c = center(); zoomAt(0.8, c.cx, c.cy); };
    if (btn('gt-zoomout')) btn('gt-zoomout').onclick = () => { const c = center(); zoomAt(1.25, c.cx, c.cy); };
    if (btn('gt-reset')) btn('gt-reset').onclick = () => { vb = { x: 0, y: 0, w: W, h: H }; applyVB(); };
    if (btn('gt-relayout')) btn('gt-relayout').onclick = () => {
      Object.keys(graphPos).forEach(k => delete graphPos[k]);
      nodes.forEach(n => { n.pinned = false; });
      vb = { x: 0, y: 0, w: W, h: H }; applyVB();
      reheat(1);
    };
  }

  function openCharacter(id) {
    const c = MARVEL.charById[id];
    if (!c) return;
    const f = MARVEL.FACTIONS[c.faction];
    const works = charWorks(c);
    const guard = S.state.settings.spoilerGuard;
    const mask = html => guard ? `<span class="spoiler-mask" title="剧透保护 · 点击显示">${html}</span>` : html;
    const rels = MARVEL.RELATIONS
      .filter(r => r.a === id || r.b === id)
      .map(r => ({ other: MARVEL.charById[r.a === id ? r.b : r.a], label: r.label, type: r.type }));

    $('#modal-card').innerHTML = `
    <div class="modal-head" style="--pc:${f.color}">
      <button class="modal-close" id="modal-close">✕</button>
      <div class="mh-emoji">${c.emoji}</div>
      <div class="mh-titles">
        <div class="mh-cn">${esc(charLabel(c))}</div>
        <div class="mh-en">${esc(c.en)}</div>
        <div class="mh-meta">
          ${charSub(c) ? `<span class="chip">👤 本名 ${esc(c.name)}</span>` : ''}
          <span class="chip" style="border-color:${f.color};color:${f.color}">${f.name}</span>
          <span class="chip">🎭 ${esc(c.actor)}</span>
          <span class="chip">🎬 登场 ${works.length} 部</span>
        </div>
      </div>
    </div>
    <div class="modal-body">
      <div class="mb-section">
        <div class="mb-label">人物档案</div>
        <div class="mb-text">${esc(c.intro)}</div>
      </div>
      <div class="mb-section">
        <div class="mb-label">弧光与现状(剧透)</div>
        <div class="mb-text">${mask(esc(c.arc))}</div>
      </div>
      ${rels.length ? `
      <div class="mb-section">
        <div class="mb-label">关系网</div>
        <div class="rel-list">
          ${rels.map(r => `
            <div class="rel-item" data-char="${r.other.id}">
              <span class="rel-tag" style="background:${REL_STYLE[r.type].color}22;color:${REL_STYLE[r.type].color};border:1px solid ${REL_STYLE[r.type].color}66">${REL_STYLE[r.type].name}</span>
              <span style="font-weight:700">${r.other.emoji} ${esc(charLabel(r.other))}</span>
              ${charSub(r.other) ? `<span style="color:var(--faint);font-size:12px">${esc(charSub(r.other))}</span>` : ''}
              <span style="color:var(--muted);font-size:12.5px">${esc(r.label)}</span>
            </div>`).join('')}
        </div>
      </div>` : ''}
      <div class="mb-section">
        <div class="mb-label">登场作品线(按上映顺序)</div>
        <div class="mb-chips">
          ${works.map(w => `<span class="chip clickable ${S.isWatched(w.id) ? 'chip-done' : ''}" data-open="${w.id}">${S.isWatched(w.id) ? '✔ ' : ''}${esc(w.title)} · ${yearOf(w)}</span>`).join('')}
        </div>
      </div>
    </div>`;
    $('#modal-backdrop').classList.remove('hidden');
  }

  /* ==========================================================================
     视图:宇宙百科
     ========================================================================== */
  let loreMode = 'events';
  let glossaryQuery = '';

  function viewLore() {
    const guard = S.state.settings.spoilerGuard;
    let content = '';

    if (loreMode === 'events') {
      content = `<div class="events-list">
      ${MARVEL.EVENTS.map(ev => {
        const locked = guard && !S.isWatched(ev.keyWork);
        const mask = html => locked ? `<span class="spoiler-mask" title="剧透保护 · 点击显示">${html}</span>` : html;
        return `
        <div class="event-card">
          <div class="event-head">
            <span class="event-emoji">${ev.emoji}</span>
            <div>
              <div class="event-name">${esc(ev.name)} <span class="event-en">${esc(ev.en)}</span></div>
              <div class="event-year">📍 ${esc(ev.year)}${locked && MARVEL.byId[ev.keyWork] ? ' · 🙈 看完《' + esc(MARVEL.byId[ev.keyWork].title) + '》再来读更安全' : ''}</div>
            </div>
          </div>
          <div class="event-row"><b>起因</b><span>${esc(ev.cause)}</span></div>
          <div class="event-row"><b>经过</b><span>${mask(esc(ev.desc))}</span></div>
          <div class="event-row"><b>余波</b><span>${mask(esc(ev.consequence))}</span></div>
          <div class="mb-chips" style="margin-top:10px">
            ${ev.works.map(id => MARVEL.byId[id] ? `<span class="chip clickable ${S.isWatched(id) ? 'chip-done' : ''}" data-open="${id}">${S.isWatched(id) ? '✔ ' : ''}${esc(MARVEL.byId[id].title)}</span>` : '').join('')}
          </div>
        </div>`;
      }).join('')}</div>`;
    } else {
      const q = glossaryQuery.trim().toLowerCase();
      const list = MARVEL.GLOSSARY.filter(g =>
        !q || g.term.toLowerCase().includes(q) || g.en.toLowerCase().includes(q) || g.def.toLowerCase().includes(q));
      content = `
      <input id="glossary-search" class="glossary-search" type="search" placeholder="搜索词条…(共 ${MARVEL.GLOSSARY.length} 条)" value="${esc(glossaryQuery)}">
      <div class="glossary-grid">
      ${list.map(g => `
        <div class="glossary-card">
          <div class="glossary-term">${g.emoji} ${esc(g.term)} <span class="event-en">${esc(g.en)}</span></div>
          <div class="glossary-def">${esc(g.def)}</div>
          ${g.spoiler ? `<div class="glossary-spoiler"><b>进阶剧透</b> ${guard ? `<span class="spoiler-mask" title="点击显示">${esc(g.spoiler)}</span>` : esc(g.spoiler)}</div>` : ''}
          <div class="mb-chips" style="margin-top:10px">
            ${(g.works || []).map(id => MARVEL.byId[id] ? `<span class="chip clickable" data-open="${id}">${esc(MARVEL.byId[id].title)}</span>` : '').join('')}
          </div>
        </div>`).join('')}
      </div>
      ${list.length === 0 ? '<div class="empty-state"><div class="es-ico">📖</div>没有匹配的词条</div>' : ''}`;
    }

    return `
    <div class="section-title"><span class="st-main">ENCYCLOPEDIA</span><span class="st-sub">宇宙百科 · 大事件编年与新手名词典</span></div>
    <div class="tl-tabs">
      <button class="btn ${loreMode === 'events' ? 'btn-primary' : 'btn-ghost'}" data-loremode="events">💥 大事件</button>
      <button class="btn ${loreMode === 'glossary' ? 'btn-primary' : 'btn-ghost'}" data-loremode="glossary">📖 名词典</button>
    </div>
    ${content}`;
  }

  /* ==========================================================================
     视图:我的档案
     ========================================================================== */
  const WEEKS_SHOWN = 26;

  function heatmapHTML() {
    const act = S.state.activity;
    const todayStr = S.today();

    // 从本周开始往前推 26 周,列 = 周(周一为首)
    const t = new Date(todayStr + 'T00:00:00');
    const dow = (t.getDay() + 6) % 7;               // 0 = 周一
    let cursor = S.shiftDate(todayStr, -dow - (WEEKS_SHOWN - 1) * 7);

    let firstDate = cursor;
    const cells = [];
    for (let wk = 0; wk < WEEKS_SHOWN; wk++) {
      for (let d = 0; d < 7; d++) {
        const future = cursor > todayStr;
        const n = act[cursor] || 0;
        const lv = n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n <= 4 ? 3 : 4;
        cells.push(`<i class="hm-cell lv${lv} ${future ? 'future' : ''}" title="${cursor} · ${n} 次打卡"></i>`);
        cursor = S.shiftDate(cursor, 1);
      }
    }

    const st = S.streaks();
    return `
    <div class="section-title"><span class="st-main">ACTIVITY</span><span class="st-sub">打卡热力图 · 近半年(${firstDate} 起)</span></div>
    <div class="panel">
      <div class="hm-stats">
        <div class="hm-stat"><b>${st.current}</b><span>当前连击(天)</span>${st.current >= 3 ? '<em>🔥</em>' : ''}</div>
        <div class="hm-stat"><b>${st.best}</b><span>最长连击</span></div>
        <div class="hm-stat"><b>${st.totalDays}</b><span>累计活跃天数</span></div>
      </div>
      <div class="hm-scroll">
        <div class="heatmap">${cells.join('')}</div>
      </div>
      <div class="hm-legend">少 <i class="hm-cell lv0"></i><i class="hm-cell lv1"></i><i class="hm-cell lv2"></i><i class="hm-cell lv3"></i><i class="hm-cell lv4"></i> 多 · 每完成一部作品或打卡一集记 1 次</div>
    </div>`;
  }

  function viewProfile() {
    const count = S.watchedCount();
    const minutes = S.minutesWatched();
    const hours = Math.round(minutes / 60 * 10) / 10;
    const records = S.recordCount();
    const unlocked = Object.keys(S.state.unlocked).length;

    const phaseRows = [1, 2, 3, 4, 5, 6].map(n => {
      const p = S.phaseProgress(n);
      const ph = MARVEL.PHASES[n];
      return `
      <div class="phase-bar-row">
        <span class="pb-name">${ph.name} <span style="color:var(--faint);font-weight:400">${ph.en}</span></span>
        <div class="pb-track"><div class="pb-fill" style="--c:${ph.color};width:${p.pct}%"></div></div>
        <span class="pb-num">${p.done}/${p.total}</span>
      </div>`;
    }).join('');

    const legacy = MARVEL.WORKS.filter(w => w.phase === 0 && !w.upcoming);
    const legacyDone = legacy.filter(w => S.isWatched(w.id)).length;
    const legacyPct = Math.round(legacyDone / legacy.length * 100);

    const notesList = Object.entries(S.state.records)
      .map(([id, r]) => ({ w: MARVEL.byId[id], r, date: (S.state.watched[id] && S.state.watched[id].date) || '' }))
      .filter(x => x.w && ((x.r.rating && x.r.rating > 0) || (x.r.note && x.r.note.trim())))
      .sort((a, b) => b.date.localeCompare(a.date));

    return `
    <div class="section-title"><span class="st-main">MY PROFILE</span><span class="st-sub">观影档案 · 成就 · 数据管理</span></div>

    <div class="dash-stats" style="margin-bottom:26px">
      <div class="stat-card"><div class="stat-num">${count}</div><div class="stat-label">已看作品</div></div>
      <div class="stat-card gold"><div class="stat-num">${hours}<small>h</small></div><div class="stat-label">累计时长</div></div>
      <div class="stat-card green"><div class="stat-num">${records}</div><div class="stat-label">评分/短评</div></div>
      <div class="stat-card red"><div class="stat-num">${unlocked}<small>/${MARVEL.ACHIEVEMENTS.length}</small></div><div class="stat-label">成就</div></div>
    </div>

    <div class="section-title"><span class="st-main">PROGRESS</span><span class="st-sub">各阶段完成度</span></div>
    <div class="panel phase-bars">
      ${phaseRows}
      <div class="phase-bar-row">
        <span class="pb-name">前代与番外 <span style="color:var(--faint);font-weight:400">LEGACY</span></span>
        <div class="pb-track"><div class="pb-fill" style="--c:#7f8da3;width:${legacyPct}%"></div></div>
        <span class="pb-num">${legacyDone}/${legacy.length}</span>
      </div>
    </div>

    ${heatmapHTML()}

    <div class="section-title" id="ach-wall"><span class="st-main">ACHIEVEMENTS</span><span class="st-sub">成就墙 · ${unlocked}/${MARVEL.ACHIEVEMENTS.length}</span></div>
    <div class="badge-grid">
      ${MARVEL.ACHIEVEMENTS.map(a => {
        const at = S.state.unlocked[a.id];
        const RN = { bronze: '青铜', silver: '白银', gold: '黄金', vibranium: '振金' };
        const secret = a.hidden && !at;
        return `
        <div class="badge-card r-${a.rarity || 'bronze'} ${at ? 'unlocked' : ''}">
          <span class="badge-rarity">${RN[a.rarity] || '青铜'}</span>
          <div class="badge-ico">${secret ? '❓' : a.emoji}</div>
          <div class="badge-name">${secret ? '???' : esc(a.name)}</div>
          <div class="badge-desc">${secret ? '隐藏成就 · 继续探索,总会撞见它。' : esc(a.desc)}</div>
          ${at ? `<div class="badge-date">🏅 ${at.slice(0, 10)} 解锁</div>` : '<div class="badge-date" style="color:var(--faint)">未解锁</div>'}
        </div>`;
      }).join('')}
    </div>

    ${notesList.length ? `
    <div class="section-title"><span class="st-main">MY NOTES</span><span class="st-sub">我的评分与短评</span></div>
    <div class="panel" style="display:flex;flex-direction:column;gap:12px">
      ${notesList.map(({ w, r, date }) => `
        <div style="display:flex;gap:12px;align-items:flex-start;border-bottom:1px solid var(--line);padding-bottom:12px">
          <span style="font-size:24px">${w.emoji}</span>
          <div style="flex:1">
            <div style="font-weight:700;cursor:pointer" data-open="${w.id}">${esc(w.title)}
              <span style="color:var(--gold);margin-left:8px">${'★'.repeat(r.rating || 0)}${'☆'.repeat(Math.max(0, 5 - (r.rating || 0)))}</span>
              <span style="color:var(--faint);font-size:12px;margin-left:8px">${esc(date)}</span>
            </div>
            ${r.note ? `<div style="color:var(--muted);font-size:13px;margin-top:3px">${esc(r.note)}</div>` : ''}
          </div>
        </div>`).join('')}
    </div>` : ''}

    <div class="section-title"><span class="st-main">DATA</span><span class="st-sub">数据管理 · 进度保存在本机浏览器中</span></div>
    <div class="panel">
      <div class="data-actions">
        <button class="btn btn-gold" id="btn-report">📸 生成我的战报</button>
        <button class="btn btn-ghost" id="btn-export">📤 导出存档</button>
        <button class="btn btn-ghost" id="btn-import">📥 导入存档</button>
        <input type="file" id="import-file" accept=".json,application/json" class="hidden">
        <button class="btn btn-ghost" id="btn-reset" style="color:var(--red2)">🗑️ 重置全部进度</button>
      </div>
      <div class="footnote">
        进度数据保存在浏览器 localStorage 中,清除浏览器数据前请先导出存档。<br>
        本系统为个人学习交流用途,资料整理自公开信息;未上映作品信息以官方为准。
      </div>
    </div>`;
  }

  /* ==========================================================================
     详情弹窗
     ========================================================================== */
  /* 观后解读:看完打卡后解锁 */
  function insightHTML(w, watched) {
    const ins = (MARVEL.INSIGHTS && MARVEL.INSIGHTS[w.id]) || null;
    if (!ins) return '';
    const nE = (ins.eggs || []).length, nS = (ins.seeds || []).length, nT = (ins.trivia || []).length;
    if (!nE && !nS && !nT) return '';

    if (!watched && !w.upcoming) {
      const parts = [];
      if (nE) parts.push(`${nE} 条彩蛋解析`);
      if (nS) parts.push(`${nS} 条伏笔追踪`);
      if (nT) parts.push(`${nT} 条幕后冷知识`);
      return `
      <div class="mb-section">
        <div class="insight-locked">
          <span class="il-lock">🔒</span>
          <div>
            <div class="il-title">观后解读 · 尚未解锁</div>
            <div class="il-sub">看完并打卡后,这里将解锁:${parts.join(' · ')}。先看片,再来对答案!</div>
          </div>
        </div>
      </div>`;
    }
    if (!watched) return '';

    return `
    <div class="mb-section insight-box">
      <div class="mb-label">🔓 观后解读 · 已解锁</div>
      ${nE ? `
      <div class="insight-block">
        <div class="ib-head">🥚 彩蛋全解</div>
        ${ins.eggs.map(e => `<div class="ib-item"><b>${esc(e.t)}</b><span>${esc(e.d)}</span></div>`).join('')}
      </div>` : ''}
      ${nS ? `
      <div class="insight-block">
        <div class="ib-head">🌱 伏笔追踪</div>
        ${ins.seeds.map(s => `<div class="ib-item ib-seed">${esc(s)}</div>`).join('')}
      </div>` : ''}
      ${nT ? `
      <div class="insight-block">
        <div class="ib-head">🎬 幕后冷知识</div>
        ${ins.trivia.map(s => `<div class="ib-item ib-seed">${esc(s)}</div>`).join('')}
      </div>` : ''}
    </div>`;
  }

  function openDetail(id) {
    const w = MARVEL.byId[id];
    if (!w) return;
    const watched = S.isWatched(id);
    const status = S.statusOf(id);
    const rec = S.state.records[id] || {};
    const wdate = S.state.watched[id] && S.state.watched[id].date;
    const poster = posterOf(w);
    const guardOn = S.state.settings.spoilerGuard && status !== 'done';
    const mask = html => guardOn ? `<span class="spoiler-mask" title="剧透保护 · 点击显示">${html}</span>` : html;

    const prereqChips = (w.prereq || []).map(pid => {
      const p = MARVEL.byId[pid];
      if (!p) return '';
      return `<span class="chip clickable ${S.isWatched(pid) ? 'chip-done' : ''}" data-open="${pid}">${S.isWatched(pid) ? '✔ ' : ''}${esc(p.title)}</span>`;
    }).join('');

    const leadsChips = (w.leadsTo || []).map(pid => {
      const p = MARVEL.byId[pid];
      if (!p) return '';
      return `<span class="chip clickable ${S.isWatched(pid) ? 'chip-done' : ''}" data-open="${pid}">${esc(p.title)} →</span>`;
    }).join('');

    const threadChips = (w.threads || []).map(tid => {
      const t = MARVEL.THREADS[tid];
      return `<span class="chip clickable" data-goto-thread="${tid}" style="border-color:${t.color};color:${t.color}">${t.emoji} ${esc(t.name)}</span>`;
    }).join('');

    $('#modal-card').innerHTML = `
    <div class="modal-head" style="--pc:${colorOf(w)}">
      <button class="modal-close" id="modal-close">✕</button>
      ${poster ? `<img class="mh-poster" src="${poster}" alt="" onerror="this.remove()">` : ''}
      <div class="mh-emoji">${w.emoji}</div>
      <div class="mh-titles">
        <div class="mh-cn">${esc(w.title)}</div>
        <div class="mh-en">${esc(w.enTitle)}</div>
        <div class="mh-meta">
          <span class="chip">${phaseLabel(w)}</span>
          <span class="chip">${TYPE_ICO[w.type]} ${TYPE_LABEL[w.type]}</span>
          <span class="chip">📅 ${w.release.replace(/-/g, '.')}</span>
          <span class="chip">⏱️ ${runtimeText(w)}</span>
          ${w.rating ? `<span class="chip">⭐ ${w.rating.toFixed(1)}</span>` : ''}
          ${tierBadge(w)}
          ${w.storyYear ? `<span class="tl-story-year">📍 故事发生于 ${esc(w.storyYear)}</span>` : ''}
        </div>
      </div>
    </div>
    <div class="modal-body">
      <div class="mb-section">
        <div class="mb-label">「${esc(w.tagline)}」</div>
        <div class="mb-text">${mask(esc(w.synopsis))}</div>
      </div>
      <div class="mb-section">
        <div class="mb-label">为什么要看</div>
        <div class="mb-text">${mask(esc(w.whyWatch))}</div>
      </div>
      ${prereqChips ? `<div class="mb-section"><div class="mb-label">建议先看</div><div class="mb-chips">${prereqChips}</div></div>` : ''}
      ${leadsChips ? `<div class="mb-section"><div class="mb-label">直接引出</div><div class="mb-chips">${leadsChips}</div></div>` : ''}
      ${threadChips ? `<div class="mb-section"><div class="mb-label">所属故事线</div><div class="mb-chips">${threadChips}</div></div>` : ''}
      ${w.characters && w.characters.length ? `<div class="mb-section"><div class="mb-label">主要角色</div><div class="mb-chips">${w.characters.map(c => {
        const cid = MARVEL.charByAlias && MARVEL.charByAlias[c];
        return cid ? `<span class="chip clickable" data-char="${cid}">👤 ${esc(c)}</span>` : `<span class="chip">${esc(c)}</span>`;
      }).join('')}</div></div>` : ''}
      ${w.postCredits != null ? `
      <div class="mb-section">
        <div class="mb-label">片尾彩蛋 × ${w.postCredits}</div>
        ${w.eggTip ? `<details class="egg-details"><summary>👀 展开彩蛋提示(轻微剧透)</summary><p>${esc(w.eggTip)}</p></details>` : ''}
      </div>` : (w.eggTip ? `<div class="mb-section"><details class="egg-details"><summary>👀 观影小贴士</summary><p>${esc(w.eggTip)}</p></details></div>` : '')}

      ${insightHTML(w, watched)}

      <div class="my-record">
        <div class="mb-label">我的记录</div>
        ${w.upcoming ? `
        <div class="mr-row">
          <span class="chip">⏳ 未上映 · ${w.release.replace(/-/g, '.')} 见</span>
          <button class="btn-status ${status === 'want' ? 'on' : ''}" data-set-status="want" data-status-work="${id}">🤍 想看</button>
        </div>` : `
        <div class="mr-row">
          <div class="status-group">
            <button class="btn-status ${status === 'want' ? 'on' : ''}" data-set-status="want" data-status-work="${id}">🤍 想看</button>
            <button class="btn-status ${status === 'done' ? 'on done' : ''}" data-toggle="${id}">✓ 看过</button>
            <button class="btn-status ${status === 'dropped' ? 'on' : ''}" data-set-status="dropped" data-status-work="${id}">🚫 弃了</button>
          </div>
          ${watched && wdate ? `<span class="mr-date">📅 ${esc(wdate)} 打卡</span>` : ''}
        </div>
        ${w.episodes ? `
        <div class="mr-row ep-row">
          <span style="font-size:13px;color:var(--muted)">追剧进度:</span>
          <button class="ep-btn" data-ep-work="${id}" data-ep="-1" title="回退一集">–</button>
          <div class="ep-bar"><i style="width:${Math.round((S.state.progress[id] || 0) / w.episodes * 100)}%"></i></div>
          <button class="ep-btn" data-ep-work="${id}" data-ep="1" title="看完一集">＋</button>
          <span class="ep-num">${S.state.progress[id] || 0} / ${w.episodes} 集</span>
        </div>
        <div class="mr-hint">看到最后一集会自动标记为「看过」。</div>` : ''}
        <div class="mr-row">
          <span style="font-size:13px;color:var(--muted)">评分:</span>
          <div class="star-row">
            ${[1, 2, 3, 4, 5].map(n => `<span class="star ${(rec.rating || 0) >= n ? 'on' : ''}" data-star="${n}" data-star-work="${id}">★</span>`).join('')}
          </div>
        </div>
        <textarea class="mr-note" id="note-input" placeholder="写点观后感…(点「保存短评」存储)">${esc(rec.note || '')}</textarea>
        <div class="mr-row" style="margin-top:10px;margin-bottom:0">
          <button class="btn btn-ghost btn-sm" id="btn-save-note" data-note-work="${id}">💾 保存短评</button>
        </div>`}
      </div>
    </div>`;

    $('#modal-backdrop').classList.remove('hidden');
  }

  function closeModal() {
    $('#modal-backdrop').classList.add('hidden');
  }

  /* ==========================================================================
     响指彩蛋
     ========================================================================== */
  function doSnap() {
    const layer = $('#snap-layer');
    layer.innerHTML = `
      <div class="snap-fist">🫰</div>
      <div class="snap-text">*啪*</div>
      <div class="snap-sub">宇宙的一半正在化为尘埃……(点击任意处提前恢复)</div>`;
    layer.classList.remove('hidden');

    setTimeout(() => {
      layer.classList.add('hidden');
      const cards = $$('#view-container .work-card, #view-container .mission-item, #view-container .route-mini, #view-container .up-card, #view-container .stat-card');
      const half = cards.filter(() => Math.random() < 0.5);
      half.forEach((el, i) => setTimeout(() => el.classList.add('dusting'), i * 60));
      const fresh = S.markSnapped();
      setTimeout(() => {
        toast('🧤 完美平衡', '一如万物应有的样子。……好了,都回来吧。', true);
        announceUnlocks(fresh);
        render();
      }, half.length * 60 + 1900);
    }, 1500);

    layer.onclick = () => layer.classList.add('hidden');
  }

  /* ==========================================================================
     搜索
     ========================================================================== */
  function runSearch(q) {
    const box = $('#search-results');
    q = q.trim().toLowerCase();
    if (!q) { box.classList.add('hidden'); box.innerHTML = ''; return; }

    const hits = MARVEL.WORKS.filter(w => {
      const hay = [w.title, w.enTitle, w.tagline, (w.characters || []).join(' ')].join(' ').toLowerCase();
      return hay.includes(q);
    }).slice(0, 12);

    box.innerHTML = hits.length
      ? hits.map(w => `
        <div class="sr-item" data-open="${w.id}">
          <span class="sr-emoji">${w.emoji}</span>
          <div>
            <div class="sr-title">${esc(w.title)}</div>
            <div class="sr-sub">${esc(w.enTitle)} · ${yearOf(w)} · ${TYPE_LABEL[w.type]}</div>
          </div>
          ${S.isWatched(w.id) ? '<span class="sr-watched">✔ 已看</span>' : ''}
        </div>`).join('')
      : '<div class="sr-empty">没有找到相关作品,换个关键词试试?</div>';
    box.classList.remove('hidden');
  }

  /* ==========================================================================
     路由 & 渲染
     ========================================================================== */
  const VIEWS = {
    dashboard: viewDashboard,
    routes: viewRoutes,
    database: viewDatabase,
    characters: viewCharacters,
    timeline: viewTimeline,
    map: viewMap,
    lore: viewLore,
    profile: viewProfile,
  };

  function currentView() {
    const hash = location.hash.replace('#/', '');
    return VIEWS[hash] ? hash : 'dashboard';
  }

  function render() {
    const view = currentView();
    $$('#sidebar .nav-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
    if (MARVEL.three) MARVEL.three.unmount();
    $('#view-container').innerHTML = VIEWS[view]();
    const host = $('#three-host');
    if (view === 'characters') { if (host) MARVEL.three.mount('characters', host, { activeFaction }); else initCharGraph(); }
    if (view === 'map') { if (host) MARVEL.three.mount('map', host, { activeThread }); else initMetroMap(); }
    if (view === 'timeline' && tlMode === 'axis') MARVEL.axis.init();
    if (view === 'timeline' && tlMode === 'corridor' && host) MARVEL.three.mount('corridor', host, {});
    updateSidebar();
  }

  function updateSidebar() {
    const total = MARVEL.WORKS.filter(w => !w.upcoming).length;
    const count = S.watchedCount();
    $('#side-progress-text').textContent = `${count} / ${total}`;
    $('#side-progress-fill').style.width = `${Math.round(count / total * 100)}%`;
    $('#stones-mini').innerHTML = S.stonesLit().map(s =>
      `<span class="stone-dot ${s.lit ? 'lit' : ''}" style="--c:${s.color}" title="${s.name}${s.lit ? ' ✔' : ''}"></span>`
    ).join('');
  }

  function navigate(view) {
    location.hash = '#/' + view;
  }

  /* ==========================================================================
     全局事件绑定(事件委托)
     ========================================================================== */
  document.addEventListener('click', e => {
    const t = e.target;

    // 打卡按钮(优先于打开详情)
    const toggleEl = t.closest('[data-toggle]');
    if (toggleEl) {
      e.stopPropagation();
      const id = toggleEl.dataset.toggle;
      const inModal = !!t.closest('#modal-card');
      handleToggle(id);
      if (inModal) openDetail(id);
      return;
    }

    // 评分星星
    const starEl = t.closest('[data-star]');
    if (starEl) {
      const id = starEl.dataset.starWork;
      const n = Number(starEl.dataset.star);
      const cur = (S.state.watched[id] && S.state.watched[id].rating) || 0;
      const fresh = S.setRecord(id, { rating: cur === n ? 0 : n });
      announceUnlocks(fresh);
      render();
      openDetail(id);
      return;
    }

    // 保存短评
    const noteBtn = t.closest('[data-note-work]');
    if (noteBtn) {
      const id = noteBtn.dataset.noteWork;
      const note = $('#note-input').value.trim();
      const fresh = S.setRecord(id, { note });
      toast('💾 已保存', '短评已写入你的观影档案。');
      announceUnlocks(fresh);
      return;
    }

    // 想看 / 弃了
    const stEl = t.closest('[data-set-status]');
    if (stEl) {
      const id = stEl.dataset.statusWork;
      const w = MARVEL.byId[id];
      const inModal = !!t.closest('#modal-card');
      if (stEl.dataset.setStatus === 'want') {
        const on = S.setWant(id);
        if (on) toast('🤍 已加入想看', `《${esc(w.title)}》在资料库筛选「想看」里等你。`);
      } else {
        const on = S.setDropped(id);
        if (on) toast('🚫 已标记弃看', '合不来就换一部,没毛病。');
      }
      render();
      if (inModal) openDetail(id);
      return;
    }

    // 剧集进度 ±1
    const epEl = t.closest('[data-ep-work]');
    if (epEl) {
      const id = epEl.dataset.epWork;
      const w = MARVEL.byId[id];
      const inModal = !!t.closest('#modal-card');
      const cur = S.state.progress[id] || 0;
      const result = S.setProgress(id, cur + Number(epEl.dataset.ep));
      if (result.completed) {
        const q = MARVEL.QUOTES[Math.floor(Math.random() * MARVEL.QUOTES.length)];
        toast(`🎉 追完了《${esc(w.title)}》!`, `“${q.cn}” — ${q.en}`);
      }
      announceUnlocks(result.fresh);
      render();
      if (inModal) openDetail(id);
      return;
    }

    // 剧透遮罩:点击显示
    const maskEl = t.closest('.spoiler-mask');
    if (maskEl) { maskEl.classList.add('revealed'); return; }

    // 剧透保护开关
    if (t.closest('#btn-spoiler')) {
      const on = !S.state.settings.spoilerGuard;
      S.setSetting('spoilerGuard', on);
      updateSpoilerBtn();
      toast(on ? '🙈 剧透保护已开启' : '👁️ 剧透保护已关闭', on ? '未看作品的简介与看点会被遮罩,点击可临时显示。' : '所有简介将直接可见。');
      return;
    }

    // 打开详情
    const openEl = t.closest('[data-open]');
    if (openEl) {
      openDetail(openEl.dataset.open);
      $('#search-results').classList.add('hidden');
      return;
    }

    // 角色档案(拖拽后不触发点击)
    const charEl = t.closest('[data-char]');
    if (charEl) {
      if (graphDragged) { graphDragged = false; return; }
      openCharacter(charEl.dataset.char);
      return;
    }

    // 阵营筛选
    const facEl = t.closest('[data-faction]');
    if (facEl) {
      const fid = facEl.dataset.faction;
      activeFaction = (fid && activeFaction !== fid) ? fid : null;
      render();
      return;
    }

    // 百科切换
    const loreBtn = t.closest('[data-loremode]');
    if (loreBtn) { loreMode = loreBtn.dataset.loremode; render(); return; }

    // 时间线事件 → 跳转百科
    if (t.closest('[data-goto-lore]')) {
      loreMode = 'events';
      navigate('lore');
      return;
    }

    // 指挥中心统计卡直达
    if (t.closest('[data-goto-ach]')) {
      if (currentView() !== 'profile') navigate('profile');
      setTimeout(() => {
        const el = $('#ach-wall');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return;
    }
    if (t.closest('[data-goto-watched]')) {
      dbFilter.watch = 'watched';
      navigate('database');
      if (currentView() === 'database') render();
      return;
    }

    // 切换路线
    const routeEl = t.closest('[data-route]');
    if (routeEl) {
      S.setActiveRoute(routeEl.dataset.route);
      if (currentView() !== 'routes') navigate('routes');
      render();
      return;
    }

    // 导航
    const navEl = t.closest('[data-nav]');
    if (navEl) { navigate(navEl.dataset.nav); return; }

    const navItem = t.closest('.nav-item');
    if (navItem) { navigate(navItem.dataset.view); return; }

    if (t.closest('#logo-home')) { navigate('dashboard'); return; }

    // 时间线切换
    const tlBtn = t.closest('[data-tlmode]');
    if (tlBtn) { tlMode = tlBtn.dataset.tlmode; render(); return; }

    // 资料库筛选
    const fEl = t.closest('[data-filter]');
    if (fEl) {
      const [group, val] = fEl.dataset.filter.split(':');
      dbFilter[group] = val;
      render();
      return;
    }

    // 链路高亮
    const thEl = t.closest('[data-thread]');
    if (thEl) {
      const tid = thEl.dataset.thread;
      activeThread = (tid && activeThread !== tid) ? tid : null;
      render();
      return;
    }

    // 从详情跳转到链路图
    const gotoTh = t.closest('[data-goto-thread]');
    if (gotoTh) {
      activeThread = gotoTh.dataset.gotoThread;
      closeModal();
      navigate('map');
      render();
      return;
    }

    // 响指
    if (t.closest('#btn-snap')) { doSnap(); return; }

    // 高阶版开关 / 相机按钮
    const mt = t.closest('[data-mode3d]');
    if (mt) {
      const kind = mt.dataset.mode3d;
      const m = Object.assign({}, mode3d()); m[kind] = !m[kind];
      S.setSetting('mode3d', m);
      render();
      return;
    }
    if (t.closest('#three-reset')) { MARVEL.three.resetCamera(); return; }
    if (t.closest('#three-today')) { MARVEL.three.jumpToday(); return; }

    // 战报分享卡 / 3D 实验室
    if (t.closest('#btn-report')) { MARVEL.report.open(); return; }
    if (t.closest('#btn-lab3d')) { MARVEL.lab.openStones(); return; }

    // 随机一部
    if (t.closest('#btn-random')) {
      const pool = MARVEL.WORKS.filter(w => !S.isWatched(w.id) && !w.upcoming);
      if (!pool.length) { toast('👑 无片可抽', '你已经全部看完了!'); return; }
      const pick = pool[Math.floor(Math.random() * pool.length)];
      toast('🎲 命运选中了……', `《${esc(pick.title)}》(${yearOf(pick)})`);
      openDetail(pick.id);
      announceUnlocks(S.bumpFlag('randomCount'));
      return;
    }

    // 数据管理
    if (t.closest('#btn-export')) {
      const blob = new Blob([S.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `marvel-system-存档-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast('📤 已导出', '存档文件已开始下载。');
      return;
    }
    if (t.closest('#btn-import')) { $('#import-file').click(); return; }
    if (t.closest('#btn-reset')) {
      if (confirm('确定要清空全部观影进度、评分与成就吗?此操作不可撤销(建议先导出存档)。')) {
        S.resetAll();
        toast('🗑️ 已重置', '一切归零,新的旅程开始了。');
        render();
      }
      return;
    }

    // 弹窗关闭
    if (t.closest('#modal-close')) { closeModal(); return; }
    if (t.id === 'modal-backdrop') { closeModal(); return; }

    // 点击其它区域关闭搜索
    if (!t.closest('.search-wrap')) $('#search-results').classList.add('hidden');
  });

  // 名词典搜索(重渲染后保持焦点)
  document.addEventListener('input', e => {
    if (e.target.id !== 'glossary-search') return;
    glossaryQuery = e.target.value;
    render();
    const inp = $('#glossary-search');
    if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
  });

  // 导入文件
  document.addEventListener('change', e => {
    if (e.target.id !== 'import-file') return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        S.importJSON(reader.result);
        toast('📥 导入成功', '观影进度已恢复。');
        render();
      } catch (err) {
        toast('⚠️ 导入失败', err.message || '文件格式不正确。');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });

  // 搜索
  $('#global-search').addEventListener('input', e => runSearch(e.target.value));
  $('#global-search').addEventListener('focus', e => runSearch(e.target.value));

  // 键盘
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); $('#search-results').classList.add('hidden'); }
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      $('#global-search').focus();
    }
  });

  window.addEventListener('hashchange', () => {
    closeModal();
    render();
    $('#view-container').scrollTop = 0;
  });

  /* ---------- 剧透保护开关按钮 ---------- */
  function updateSpoilerBtn() {
    const btn = $('#btn-spoiler');
    if (!btn) return;
    const on = S.state.settings.spoilerGuard;
    btn.textContent = on ? '🙈 剧透保护:开' : '👁️ 剧透保护:关';
    btn.classList.toggle('guard-on', on);
  }

  /* 供扩展模块(战报卡 / 3D 实验室)调用 */
  MARVEL.ui = { openDetail, openCharacter, render, closeModal };

  /* ---------- 启动 ---------- */
  S.checkAchievements();
  updateSpoilerBtn();
  render();

  // PWA:注册 Service Worker(file:// 打开时自动跳过)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
