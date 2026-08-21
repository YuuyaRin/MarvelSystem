/* ==========================================================================
   MARVEL 宇宙观影指挥中心 — 「我的漫威战报」分享卡(Canvas 生成)
   ========================================================================== */

(function () {
  const S = () => MARVEL.store;
  const W = 1080, H = 1350;

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function loadImage(src, timeout) {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const timer = setTimeout(() => resolve(null), timeout || 3500);
      img.onload = () => { clearTimeout(timer); resolve(img); };
      img.onerror = () => { clearTimeout(timer); resolve(null); };
      img.src = src;
    });
  }

  async function build() {
    const st = S().state;
    const works = MARVEL.WORKS;
    const total = works.filter(w => !w.upcoming).length;
    const count = S().watchedCount();
    const pct = Math.round(count / total * 100);
    const hours = Math.round(S().minutesWatched() / 60 * 10) / 10;
    const streak = S().streaks();
    const unlocked = Object.keys(st.unlocked).length;
    const route = MARVEL.ROUTES.find(r => r.id === st.activeRoute) || MARVEL.ROUTES[0];
    const rp = S().routeProgress(route);
    const stones = S().stonesLit();

    try { await document.fonts.load('60px "Bebas Neue"'); await document.fonts.load('700 30px "Noto Sans SC"'); } catch (e) { /* 离线时用回退字体 */ }
    const DISPLAY = '"Bebas Neue", Impact, "Arial Narrow", sans-serif';
    const BODY = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';

    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');

    /* ---------- 背景 ---------- */
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, W, H);
    let g = ctx.createRadialGradient(W * 0.85, -80, 40, W * 0.85, -80, 760);
    g.addColorStop(0, 'rgba(230,36,41,0.35)'); g.addColorStop(1, 'rgba(230,36,41,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    g = ctx.createRadialGradient(-60, H + 60, 40, -60, H + 60, 700);
    g.addColorStop(0, 'rgba(77,124,254,0.25)'); g.addColorStop(1, 'rgba(77,124,254,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 半调网点
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    for (let y = 12; y < H; y += 22) for (let x = 12; x < W; x += 22) { ctx.beginPath(); ctx.arc(x, y, 1.3, 0, 7); ctx.fill(); }
    // 右上斜条纹
    ctx.save();
    ctx.translate(W, 0); ctx.rotate(Math.PI / 4);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? 'rgba(230,36,41,0.18)' : 'rgba(230,36,41,0.08)'; ctx.fillRect(-60 + i * 34, -400, 16, 900); }
    ctx.restore();

    /* ---------- 头部 ---------- */
    ctx.save();
    ctx.translate(70, 70);
    ctx.transform(1, 0, -0.08, 1, 0, 0);
    ctx.fillStyle = '#e62429';
    ctx.shadowColor = 'rgba(230,36,41,0.5)'; ctx.shadowBlur = 30;
    ctx.fillRect(0, 0, 236, 74);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = `62px ${DISPLAY}`;
    ctx.textBaseline = 'middle';
    ctx.fillText('MARVEL', 22, 40);
    ctx.restore();

    ctx.fillStyle = '#8b94a7';
    ctx.font = `700 22px ${BODY}`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('宇宙观影指挥中心 · 我的战报', 70, 186);

    const today = S().today();
    ctx.textAlign = 'right';
    ctx.fillStyle = '#5a6376';
    ctx.font = `26px ${DISPLAY}`;
    ctx.fillText(today.replace(/-/g, '.'), W - 70, 100);
    ctx.fillStyle = '#f0b429';
    ctx.font = `700 18px ${BODY}`;
    ctx.fillText(count === 0 ? '旅程待启' : pct >= 100 ? '全宇宙制霸' : `已征服 ${count} 部作品`, W - 70, 134);
    ctx.textAlign = 'left';

    /* ---------- 完成度大环 ---------- */
    const cx = 250, cy = 400, R = 132;
    ctx.lineWidth = 22; ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a2133';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    const grad = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    grad.addColorStop(0, '#e62429'); grad.addColorStop(1, '#f0b429');
    ctx.strokeStyle = grad;
    ctx.shadowColor = 'rgba(240,180,41,0.45)'; ctx.shadowBlur = 24;
    ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.004, pct / 100)); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = `110px ${DISPLAY}`;
    ctx.fillText(`${pct}%`, cx, cy + 36);
    ctx.fillStyle = '#8b94a7';
    ctx.font = `700 20px ${BODY}`;
    ctx.fillText('宇宙完成度', cx, cy + 76);
    ctx.textAlign = 'left';

    /* ---------- 统计格 ---------- */
    const stats = [
      [`${count}`, `/${total} 部`, '已看作品', '#fff'],
      [`${hours}`, 'h', '累计时长', '#f0b429'],
      [`${streak.current}`, '天', '当前连击', '#ff7a1a'],
      [`${unlocked}`, `/${MARVEL.ACHIEVEMENTS.length}`, '成就解锁', '#3ecf8e'],
    ];
    stats.forEach((s, i) => {
      const x = 450 + (i % 2) * 290, y = 262 + Math.floor(i / 2) * 150;
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      roundRect(ctx, x, y, 270, 126, 18); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = s[3];
      ctx.font = `64px ${DISPLAY}`;
      ctx.fillText(s[0], x + 24, y + 74);
      const w0 = ctx.measureText(s[0]).width;
      ctx.fillStyle = '#8b94a7';
      ctx.font = `30px ${DISPLAY}`;
      ctx.fillText(s[1], x + 28 + w0, y + 74);
      ctx.font = `700 17px ${BODY}`;
      ctx.fillText(s[2], x + 24, y + 106);
    });

    /* ---------- 无限宝石 ---------- */
    let y0 = 600;
    ctx.fillStyle = '#e62429';
    ctx.font = `34px ${DISPLAY}`;
    ctx.fillText('INFINITY STONES', 70, y0);
    ctx.fillStyle = '#5a6376';
    ctx.font = `700 16px ${BODY}`;
    ctx.fillText(`无限宝石 · 已点亮 ${stones.filter(s => s.lit).length} / 6`, 350, y0 - 2);
    stones.forEach((s, i) => {
      const x = 110 + i * 176, y = y0 + 70;
      ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI * 2);
      if (s.lit) {
        const gg = ctx.createRadialGradient(x - 10, y - 10, 4, x, y, 32);
        gg.addColorStop(0, '#ffffffcc'); gg.addColorStop(0.35, s.color); gg.addColorStop(1, s.color + '66');
        ctx.fillStyle = gg;
        ctx.shadowColor = s.color; ctx.shadowBlur = 28;
        ctx.fill(); ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#1d2436'; ctx.fill();
        ctx.strokeStyle = '#2c3650'; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.fillStyle = s.lit ? '#e8ecf4' : '#5a6376';
      ctx.font = `700 16px ${BODY}`;
      ctx.textAlign = 'center';
      ctx.fillText(s.name, x, y + 62);
      ctx.textAlign = 'left';
    });

    /* ---------- 当前路线 ---------- */
    y0 = 800;
    ctx.fillStyle = '#e62429';
    ctx.font = `34px ${DISPLAY}`;
    ctx.fillText('CURRENT ROUTE', 70, y0);
    ctx.fillStyle = '#fff';
    ctx.font = `700 24px ${BODY}`;
    ctx.fillText(`${route.emoji} ${route.name}`, 70, y0 + 44);
    ctx.fillStyle = '#8b94a7';
    ctx.font = `700 18px ${BODY}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${rp.done} / ${rp.total} · ${rp.pct}%`, W - 70, y0 + 44);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1a2133';
    roundRect(ctx, 70, y0 + 64, W - 140, 16, 8); ctx.fill();
    if (rp.pct > 0) {
      const pg = ctx.createLinearGradient(70, 0, W - 70, 0);
      pg.addColorStop(0, '#e62429'); pg.addColorStop(1, '#f0b429');
      ctx.fillStyle = pg;
      roundRect(ctx, 70, y0 + 64, Math.max(16, (W - 140) * rp.pct / 100), 16, 8); ctx.fill();
    }

    /* ---------- 最近看完(海报) ---------- */
    y0 = 930;
    const recent = Object.entries(st.watched)
      .map(([id, r]) => ({ w: MARVEL.byId[id], date: r.date || '' }))
      .filter(x => x.w)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
    ctx.fillStyle = '#e62429';
    ctx.font = `34px ${DISPLAY}`;
    ctx.fillText('RECENTLY WATCHED', 70, y0);
    if (!recent.length) {
      ctx.fillStyle = '#5a6376';
      ctx.font = `700 18px ${BODY}`;
      ctx.fillText('还没有打卡记录 —— 从《钢铁侠》开始吧。', 70, y0 + 50);
    } else {
      const imgs = await Promise.all(recent.map(x => MARVEL.POSTERS && MARVEL.POSTERS[x.w.id] ? loadImage(MARVEL.POSTERS[x.w.id]) : Promise.resolve(null)));
      recent.forEach((x, i) => {
        const px = 70 + i * 192, py = y0 + 24, pw = 172, ph = 250;
        ctx.save();
        roundRect(ctx, px, py, pw, ph, 12); ctx.clip();
        const color = x.w.phase >= 1 ? MARVEL.PHASES[x.w.phase].color : '#7f8da3';
        const gg = ctx.createLinearGradient(px, py, px + pw, py + ph);
        gg.addColorStop(0, color); gg.addColorStop(1, '#0a0d14');
        ctx.fillStyle = gg; ctx.fillRect(px, py, pw, ph);
        if (imgs[i]) {
          const img = imgs[i];
          const scale = Math.max(pw / img.width, ph / img.height);
          const dw = img.width * scale, dh = img.height * scale;
          ctx.drawImage(img, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh);
        } else {
          ctx.font = '72px serif'; ctx.textAlign = 'center';
          ctx.fillText(x.w.emoji, px + pw / 2, py + ph / 2 + 24);
          ctx.textAlign = 'left';
        }
        const sh = ctx.createLinearGradient(0, py + ph - 90, 0, py + ph);
        sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = sh; ctx.fillRect(px, py + ph - 90, pw, 90);
        ctx.restore();
        ctx.fillStyle = '#fff';
        ctx.font = `700 15px ${BODY}`;
        const title = x.w.title.length > 9 ? x.w.title.slice(0, 9) + '…' : x.w.title;
        ctx.fillText(title, px + 12, py + ph - 32);
        ctx.fillStyle = '#f0b429';
        ctx.font = `16px ${DISPLAY}`;
        ctx.fillText(x.date.replace(/-/g, '.'), px + 12, py + ph - 12);
      });
    }

    /* ---------- 成就徽章 ---------- */
    y0 = 1240;
    const badges = MARVEL.ACHIEVEMENTS.filter(a => st.unlocked[a.id]).slice(-8);
    ctx.fillStyle = '#e62429';
    ctx.font = `34px ${DISPLAY}`;
    ctx.fillText('ACHIEVEMENTS', 70, y0);
    if (!badges.length) {
      ctx.fillStyle = '#5a6376'; ctx.font = `700 17px ${BODY}`;
      ctx.fillText('尚未解锁成就', 70, y0 + 44);
    } else {
      badges.forEach((a, i) => {
        const x = 70 + i * 120, y = y0 + 22;
        ctx.fillStyle = 'rgba(240,180,41,0.12)';
        roundRect(ctx, x, y, 108, 60, 12); ctx.fill();
        ctx.strokeStyle = 'rgba(240,180,41,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.font = '26px serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(a.emoji, x + 54, y + 30);
        ctx.font = `700 12px ${BODY}`; ctx.fillStyle = '#e8ecf4';
        ctx.fillText(a.name.length > 6 ? a.name.slice(0, 6) : a.name, x + 54, y + 50);
        ctx.textAlign = 'left';
      });
    }

    /* ---------- 页脚 ---------- */
    const q = MARVEL.QUOTES[Math.floor(Math.random() * MARVEL.QUOTES.length)];
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, H - 8, W, 8);
    ctx.fillStyle = '#5a6376';
    ctx.font = `700 14px ${BODY}`;
    ctx.textAlign = 'right';
    ctx.fillText(`“${q.cn}” — ${q.en}`, W - 70, H - 22);
    ctx.textAlign = 'left';

    return cv;
  }

  async function open() {
    const backdrop = document.getElementById('modal-backdrop');
    const card = document.getElementById('modal-card');
    card.innerHTML = `
      <div class="modal-body" style="text-align:center;padding:40px">
        <div style="font-size:40px">📸</div>
        <div style="font-weight:900;font-size:16px;margin-top:8px">正在生成战报…</div>
        <div style="color:var(--muted);font-size:12.5px;margin-top:4px">加载海报与字体中,最多几秒</div>
      </div>`;
    backdrop.classList.remove('hidden');

    let cv;
    try { cv = await build(); }
    catch (e) {
      console.error(e);
      card.innerHTML = `<div class="modal-body"><button class="modal-close" id="modal-close">✕</button><div class="empty-state">生成失败:${e.message}</div></div>`;
      return;
    }
    const url = cv.toDataURL('image/png');
    const canShare = !!(navigator.clipboard && window.ClipboardItem);

    card.innerHTML = `
      <button class="modal-close" id="modal-close">✕</button>
      <div class="modal-body report-body">
        <div class="mb-label" style="text-align:center;margin-bottom:14px">我的漫威战报 · ${S().today()}</div>
        <img class="report-img" src="${url}" alt="我的漫威战报">
        <div class="report-actions">
          <a class="btn btn-gold" id="btn-report-save" href="${url}" download="marvel-report-${S().today()}.png">💾 保存图片</a>
          ${canShare ? '<button class="btn btn-ghost" id="btn-report-copy">📋 复制到剪贴板</button>' : ''}
          <button class="btn btn-ghost" id="btn-report-regen">🎲 换句台词</button>
        </div>
        <div class="footnote" style="text-align:center">长按/右键图片也可直接保存。海报含维基百科图片,仅供个人分享。</div>
      </div>`;

    const copyBtn = document.getElementById('btn-report-copy');
    if (copyBtn) copyBtn.onclick = async () => {
      try {
        const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        copyBtn.textContent = '✅ 已复制';
      } catch (e) { copyBtn.textContent = '⚠️ 浏览器不允许,请保存图片'; }
    };
    document.getElementById('btn-report-regen').onclick = open;
  }

  MARVEL.report = { open };
})();
