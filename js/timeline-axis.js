/* ==========================================================================
   MARVEL 宇宙观影指挥中心 — 动态年代轴(横向可缩放时间线)
   ========================================================================== */

(function () {
  const S = () => MARVEL.store;
  const PX_PER_YEAR = 170;
  const START = new Date('2000-01-01T00:00:00');
  const END_YEAR = 2028;
  const AXIS_H = 560;
  const LANES = [
    { key: 'movie', name: 'MCU 电影', y: 180 },
    { key: 'series', name: 'MCU 剧集 · 动画 · 特别篇', y: 312 },
    { key: 'legacy', name: '前代与番外', y: 444 },
  ];
  let geom = null;

  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const xOf = dateStr => {
    const d = new Date(dateStr + 'T00:00:00');
    return 60 + (d - START) / (365.25 * 864e5) * PX_PER_YEAR;
  };
  const laneOf = w => w.universe !== 'mcu' ? 'legacy' : (w.type === 'movie' ? 'movie' : 'series');
  const colorOf = w => w.phase >= 1 ? MARVEL.PHASES[w.phase].color : ((MARVEL.UNIVERSES[w.universe] || {}).color || '#7f8da3');
  const shortTitle = w => {
    if (w.title.length <= 7) return w.title;
    const parts = w.title.split(/[::]/);
    if (parts.length < 2) return w.title;
    if (/\d/.test(parts[0])) return parts[0];
    return parts[1].length <= 6 ? parts[1] : parts[0];
  };

  function html() {
    const W = xOf(`${END_YEAR}-07-01`) + 60;
    geom = { W, H: AXIS_H };
    const works = MARVEL.WORKS.slice().sort((a, b) => a.release.localeCompare(b.release));
    const todayX = xOf(S().today());

    // 阶段色带
    let bands = '';
    [1, 2, 3, 4, 5, 6].forEach(n => {
      const ph = MARVEL.WORKS.filter(w => w.phase === n);
      if (!ph.length) return;
      const xs = ph.map(w => xOf(w.release));
      const x1 = Math.min(...xs) - 14, x2 = Math.max(...xs) + 14;
      const c = MARVEL.PHASES[n].color;
      bands += `<rect x="${x1}" y="120" width="${x2 - x1}" height="${AXIS_H - 200}" fill="${c}" opacity="0.07" rx="10"/>
        <rect x="${x1}" y="120" width="${x2 - x1}" height="4" fill="${c}" opacity="0.8" rx="2"/>
        <text x="${(x1 + x2) / 2}" y="110" text-anchor="middle" class="ax-phase" fill="${c}">${MARVEL.PHASES[n].en}</text>`;
    });
    // 传奇标签
    const sagaX = (a, b) => {
      const ws = MARVEL.WORKS.filter(w => w.phase >= a && w.phase <= b).map(w => xOf(w.release));
      return [Math.min(...ws), Math.max(...ws)];
    };
    const [i1, i2] = sagaX(1, 3), [m1, m2] = sagaX(4, 6);
    bands += `<text x="${(i1 + i2) / 2}" y="70" text-anchor="middle" class="ax-saga">THE INFINITY SAGA · 无限传奇</text>
      <line x1="${i1}" y1="82" x2="${i2}" y2="82" class="ax-saga-line"/>
      <text x="${(m1 + m2) / 2}" y="70" text-anchor="middle" class="ax-saga">THE MULTIVERSE SAGA · 多元宇宙传奇</text>
      <line x1="${m1}" y1="82" x2="${m2}" y2="82" class="ax-saga-line"/>`;

    // 年份刻度
    let ticks = '';
    for (let y = 2000; y <= END_YEAR; y++) {
      const x = xOf(`${y}-01-01`);
      ticks += `<line x1="${x}" y1="${AXIS_H - 70}" x2="${x}" y2="${AXIS_H - 58}" class="ax-tick"/>
        <text x="${x}" y="${AXIS_H - 36}" text-anchor="middle" class="ax-year">${y}</text>
        <line x1="${x}" y1="120" x2="${x}" y2="${AXIS_H - 80}" class="ax-grid"/>`;
    }
    ticks += `<line x1="60" y1="${AXIS_H - 64}" x2="${W - 40}" y2="${AXIS_H - 64}" class="ax-base"/>`;

    // 泳道
    const lanes = LANES.map(l => `<text x="30" y="${l.y - 52}" class="ax-lane">${l.name}</text><line x1="60" y1="${l.y + 62}" x2="${W - 40}" y2="${l.y + 62}" class="ax-lane-sep"/>`).join('');

    // 作品节点(同泳道相邻过近时上下交错)
    const byLane = { movie: [], series: [], legacy: [] };
    works.forEach(w => byLane[laneOf(w)].push(w));
    let items = '';
    Object.entries(byLane).forEach(([key, list]) => {
      const lane = LANES.find(l => l.key === key);
      let lastX = -999, flip = false;
      list.forEach(w => {
        const x = xOf(w.release);
        if (x - lastX < 56) flip = !flip; else flip = false;
        lastX = x;
        const dy = flip ? 34 : -22;
        const y = lane.y + (flip ? 22 : -10);
        const watched = S().isWatched(w.id);
        const labelY = flip ? 44 : -30;
        items += `
        <g class="ax-item ${watched ? 'watched' : ''} ${w.upcoming ? 'upcoming' : ''}" data-open="${w.id}" transform="translate(${x.toFixed(1)},${y})" style="--c:${colorOf(w)}">
          <circle class="ax-dot" r="15"></circle>
          <text class="ax-emoji" text-anchor="middle" dy="5">${w.emoji}</text>
          <text class="ax-label" text-anchor="middle" y="${labelY}">${esc(shortTitle(w))}</text>
          <title>${esc(w.title)} · ${w.release}</title>
        </g>`;
      });
    });

    const todayLine = `<line x1="${todayX}" y1="96" x2="${todayX}" y2="${AXIS_H - 64}" class="ax-today"/>
      <text x="${todayX}" y="${AXIS_H - 12}" text-anchor="middle" class="ax-today-label">▲ 今天</text>`;

    return `
    <div class="graph-wrap">
      <svg id="axis-svg" viewBox="0 0 ${W} ${AXIS_H}">${bands}${ticks}${lanes}${todayLine}${items}</svg>
      <div class="graph-tools">
        <button class="gt-btn" id="ax-zoomin" title="放大">＋</button>
        <button class="gt-btn" id="ax-zoomout" title="缩小">－</button>
        <button class="gt-btn" id="ax-fit" title="全览">⛶</button>
        <button class="gt-btn" id="ax-today" title="跳到今天">📍</button>
      </div>
    </div>
    <div class="map-hint">💡 横向年代轴:滚轮缩放 · 拖拽平移 · 点击节点看详情。色带为各阶段跨度,金圈为已看,虚线圈为未上映。</div>`;
  }

  function init() {
    const svg = document.getElementById('axis-svg');
    if (!svg || !geom) return;
    const { W, H } = geom;
    const rect = svg.getBoundingClientRect();
    const aspect = rect.width / rect.height || 2;
    const ZOOM0 = 1.55; // 初始视野:约 6-8 年
    let vb = { x: 0, y: 0, w: H * aspect * ZOOM0, h: H * ZOOM0 };
    const laneLabels = svg.querySelectorAll('.ax-lane');
    const applyVB = () => {
      svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
      laneLabels.forEach(t => t.setAttribute('x', vb.x + 18)); // 泳道标签固定跟随视口
    };
    const goto = x => { vb.x = Math.max(-40, Math.min(W - vb.w + 40, x)); vb.y = (H - vb.h) / 2; applyVB(); };

    // 初始聚焦 2008(MCU 起点)
    goto(xOf('2008-01-01') - 80);

    let pan = null;
    svg.addEventListener('pointerdown', e => {
      if (e.target.closest('.ax-item')) return;
      pan = { px: e.clientX, py: e.clientY };
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener('pointermove', e => {
      if (!pan) return;
      const s = vb.w / svg.getBoundingClientRect().width;
      vb.x -= (e.clientX - pan.px) * s;
      vb.y -= (e.clientY - pan.py) * s;
      vb.x = Math.max(-40, Math.min(W - vb.w + 40, vb.x));
      vb.y = Math.max(-40, Math.min(H - vb.h + 40, vb.y));
      pan.px = e.clientX; pan.py = e.clientY;
      applyVB();
    });
    svg.addEventListener('pointerup', () => { pan = null; });

    function zoomAt(factor, cx, cy) {
      const nw = Math.max(420, Math.min(W + 80, vb.w * factor));
      const k = nw / vb.w;
      vb.x = cx - (cx - vb.x) * k;
      vb.y = cy - (cy - vb.y) * k;
      vb.w = nw; vb.h = vb.h * k;
      applyVB();
    }
    svg.addEventListener('wheel', e => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      const cx = vb.x + (e.clientX - r.left) / r.width * vb.w;
      const cy = vb.y + (e.clientY - r.top) / r.height * vb.h;
      zoomAt(e.deltaY > 0 ? 1.12 : 0.89, cx, cy);
    }, { passive: false });

    const btn = id => document.getElementById(id);
    const center = () => ({ cx: vb.x + vb.w / 2, cy: vb.y + vb.h / 2 });
    btn('ax-zoomin').onclick = () => { const c = center(); zoomAt(0.8, c.cx, c.cy); };
    btn('ax-zoomout').onclick = () => { const c = center(); zoomAt(1.25, c.cx, c.cy); };
    btn('ax-fit').onclick = () => { vb = { x: 0, y: 0, w: W, h: W / aspect }; vb.y = (H - vb.h) / 2; applyVB(); };
    btn('ax-today').onclick = () => { vb.h = H * ZOOM0; vb.w = H * aspect * ZOOM0; goto(xOf(S().today()) - vb.w / 2); };
  }

  MARVEL.axis = { html, init };
})();
