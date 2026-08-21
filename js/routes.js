/* ==========================================================================
   MARVEL 宇宙观影指挥中心 — 观影路线 & 成就
   ========================================================================== */

(function () {
  const W = MARVEL.WORKS;
  const isMcu = w => w.universe === 'mcu';
  const byRelease = (a, b) => a.release.localeCompare(b.release);

  const mcuAll = W.filter(isMcu).slice().sort(byRelease).map(w => w.id);
  const mcuMovies = W.filter(w => isMcu(w) && w.type === 'movie').slice().sort(byRelease).map(w => w.id);
  const chrono = W.filter(w => isMcu(w) && w.chron !== null).slice().sort((a, b) => a.chron - b.chron).map(w => w.id);
  const multiverseSaga = W.filter(w => isMcu(w) && w.phase >= 4).slice().sort(byRelease).map(w => w.id);

  MARVEL.ROUTES = [
    {
      id: 'essential',
      name: '无限传奇 · 精华速通',
      emoji: '⚡',
      badge: '新人首选',
      desc: '12 部电影走完 2008-2019 黄金主线,最快看懂《终局之战》。适合想快速入坑、之后再回头补全的你。',
      items: ['iron-man', 'avengers', 'cap-2', 'gotg', 'aou', 'civil-war', 'doctor-strange', 'thor-ragnarok', 'black-panther', 'infinity-war', 'captain-marvel', 'endgame'],
      notes: {
        'iron-man': '一切的起点,没有之一。',
        'avengers': '六大英雄首次集结,纽约之战。',
        'cap-2': '神盾局崩塌,宇宙格局改写。',
        'gotg': '把地图展开到银河系,认识灭霸势力。',
        'aou': '幻视诞生,心灵宝石定名,内战导火索。',
        'civil-war': '英雄阵营决裂,黑豹与蜘蛛侠登场。',
        'doctor-strange': '魔法体系与时间宝石,后期主线支柱。',
        'thor-ragnarok': '雷神线精华,结尾直通《复联3》开场。',
        'black-panther': '认识瓦坎达——《复联3》的主战场。',
        'infinity-war': '灭霸响指,史诗上篇。',
        'captain-marvel': '解锁《复联3》彩蛋里的寻呼机。',
        'endgame': '十一年传奇的终局,泪腺预警。',
      },
    },
    {
      id: 'release-all',
      name: '上映顺序 · 全收集',
      emoji: '🎬',
      badge: '完整体验',
      desc: '按上映顺序补完 MCU 全部电影、剧集与特别篇,和当年的观众用同一视角见证宇宙成长。战线最长、体验最原汁原味。',
      items: mcuAll,
    },
    {
      id: 'movies-only',
      name: '电影主线 · 上映顺序',
      emoji: '🍿',
      badge: '均衡之选',
      desc: '只看电影、跳过剧集的经典路线。个别与剧集强关联的剧情(旺达、洛基)可在需要时回头补。',
      items: mcuMovies,
    },
    {
      id: 'chrono',
      name: '故事时间线 · 编年史',
      emoji: '⏳',
      badge: '二刷推荐',
      desc: '按故事内时间顺序观看:从 1943 年的美国队长到多元宇宙终局。适合二刷或强迫症患者,首刷会剧透部分悬念。',
      items: chrono,
    },
    {
      id: 'multiverse-saga',
      name: '多元宇宙传奇',
      emoji: '🌀',
      desc: '第四阶段至今的全部作品,按上映顺序。前置要求:最好已完成无限传奇(至少精华线)。',
      items: multiverseSaga,
    },
    {
      id: 'doomsday-prep',
      name: '毁灭日 · 冲刺线',
      emoji: '🎭',
      badge: '赶进度',
      desc: '只为看懂《复仇者联盟:毁灭日》的最小必看集合:多元宇宙规则 + 新复仇者 + 神奇四侠。',
      items: ['loki-s1', 'spider-man-3', 'loki-s2', 'deadpool-wolverine', 'brave-new-world', 'thunderbolts', 'fantastic-four', 'doomsday'],
      notes: {
        'loki-s1': 'TVA 与时间分支——多元宇宙的规则书。',
        'spider-man-3': '多元宇宙灾难的第一次实感。',
        'loki-s2': '洛基成为多元宇宙之树的支撑者。',
        'deadpool-wolverine': 'TVA 后续 + 旧宇宙角色回归的方式。',
        'brave-new-world': '新任美队与政府格局。',
        'thunderbolts': '新复仇者成军。',
        'fantastic-four': '第一家庭与 828 宇宙。',
        'doomsday': '正片,2026 年 12 月见。',
      },
    },
    {
      id: 'spider-full',
      name: '蜘蛛侠 · 全制霸',
      emoji: '🕷️',
      desc: '横跨三代真人蜘蛛侠 + 毒液 + 动画宇宙。看完《英雄无归》的情怀核弹会加倍引爆。',
      items: ['raimi-1', 'raimi-2', 'raimi-3', 'tasm-1', 'tasm-2', 'civil-war', 'spider-man-1', 'spider-man-2', 'venom-1', 'venom-2', 'spider-man-3', 'spider-verse-1', 'spider-verse-2', 'brand-new-day'],
      notes: {
        'civil-war': '荷兰弟蜘蛛侠在此首次登场。',
        'venom-2': '片尾彩蛋连通《英雄无归》。',
        'spider-man-3': '三代同框,前面补的课在这里收获。',
        'spider-verse-1': '动画番外,但多元宇宙玩得最早最好。',
      },
    },
    {
      id: 'deadpool-prep',
      name: '死侍金刚狼 · 补课线',
      emoji: '🗡️',
      desc: '为《死侍与金刚狼》准备的 X 战警浓缩课:两位主角的前史 + 多元宇宙规则,最后验收。',
      items: ['xmen-1', 'xmen-2', 'first-class', 'dofp', 'deadpool-1', 'deadpool-2', 'logan', 'loki-s1', 'deadpool-wolverine'],
      notes: {
        'xmen-1': '休·杰克曼金刚狼的起点。',
        'dofp': '一部看懂新老两代 X 战警。',
        'logan': '不看它,接不住第三部的情感重量。',
        'loki-s1': 'TVA 是《死侍与金刚狼》的剧情引擎。',
        'deadpool-wolverine': '验收成果,梗浓度拉满。',
      },
    },
    {
      id: 'street',
      name: '街头暗巷 · 夜魔侠线',
      emoji: '🦯',
      desc: '离开天上的神仙打架,回到夜晚的纽约街头:网飞三季神剧到《重生》,顺路认识金并的势力网。',
      items: ['dd-netflix', 'hawkeye', 'echo', 'she-hulk', 'daredevil-ba'],
      notes: {
        'dd-netflix': '39 集,慢慢看,值得。',
        'hawkeye': '金并正式进入 MCU 主宇宙。',
        'she-hulk': '只想看夜魔侠可跳到第8集。',
        'daredevil-ba': '正统续作,暴力美学回归。',
      },
    },
    {
      id: 'witch-road',
      name: '魔法侧 · 绯红之路',
      emoji: '🔮',
      desc: '至圣所、混沌魔法与女巫团:魔法侧世界观一网打尽,顺便理解旺达的完整悲剧。',
      items: ['doctor-strange', 'aou', 'wandavision', 'spider-man-3', 'mom', 'agatha', 'ironheart'],
      notes: {
        'aou': '旺达的登场与创伤起点。',
        'wandavision': '悲伤织成的小镇,魔法侧最佳剧集。',
        'mom': '绯红女巫的黑暗面全面爆发。',
        'agatha': '女巫之路,青年复仇者伏笔。',
        'ironheart': '墨菲斯托掀开底牌。',
      },
    },
  ];

  /* ---------- 成就 ----------
     rarity: bronze 青铜 / silver 白银 / gold 黄金 / vibranium 振金
     hidden: true 的成就在解锁前显示为 ??? */
  MARVEL.ACHIEVEMENTS = [
    { id: 'first-step', name: '初入宇宙', emoji: '👣', rarity: 'bronze', desc: '看完第一部作品,旅程开始了。', check: c => c.watchedCount >= 1 },
    { id: 'first-note', name: '初执笔', emoji: '✍️', rarity: 'bronze', desc: '写下第一条评分或短评。', check: c => c.recordCount >= 1 },
    { id: 'assemble', name: '初代集结', emoji: '🅰️', rarity: 'bronze', desc: '看完《复仇者联盟》,见证纽约之战。', check: c => c.has('avengers') },
    { id: 'snap-witness', name: '响指见证者', emoji: '🫰', rarity: 'bronze', desc: '看完《无限战争》,你也在那一半里吗?', check: c => c.has('infinity-war') },
    { id: 'series-starter', name: '剧集入坑', emoji: '📺', rarity: 'bronze', desc: '看完任意一部 MCU 剧集。', check: c => MARVEL.WORKS.some(w => w.universe === 'mcu' && w.type === 'series' && c.has(w.id)) },
    { id: 'whatever-it-takes', name: '不惜一切代价', emoji: '♾️', rarity: 'silver', desc: '看完《终局之战》,爱你三千遍。', check: c => c.has('endgame') },
    { id: 'binge-day', name: '一日三连', emoji: '🍿', rarity: 'silver', desc: '单日打卡 3 次以上(电影或剧集均可)。', check: c => c.todayActivity >= 3 },
    { id: 'multiverse-traveler', name: '多元宇宙旅人', emoji: '🌀', rarity: 'silver', desc: '看完《洛基》S1、《英雄无归》与《疯狂多元宇宙》。', check: c => ['loki-s1', 'spider-man-3', 'mom'].every(id => c.has(id)) },
    { id: 'class-rep', name: '补课优等生', emoji: '🎓', rarity: 'silver', desc: '完成 X 战警核心补课(X1、X2、逆转未来、金刚狼3、死侍1、2)。', check: c => ['xmen-1', 'xmen-2', 'dofp', 'logan', 'deadpool-1', 'deadpool-2'].every(id => c.has(id)) },
    { id: 'gotg-family', name: '银河家人', emoji: '🦝', rarity: 'silver', desc: '看完银河护卫队 1、2、3 与圣诞特别篇。', check: c => ['gotg', 'gotg2', 'gotg3', 'holiday-special'].every(id => c.has(id)) },
    { id: 'hells-kitchen', name: '地狱厨房常客', emoji: '🥊', rarity: 'silver', desc: '看完网飞《夜魔侠》、《回声》与《夜魔侠:重生》。', check: c => ['dd-netflix', 'echo', 'daredevil-ba'].every(id => c.has(id)) },
    { id: 'marathon', name: '马拉松选手', emoji: '⏱️', rarity: 'silver', desc: '累计观看时长突破 48 小时。', check: c => c.minutes >= 2880 },
    { id: 'critic', name: '影评人', emoji: '📝', rarity: 'silver', desc: '写下 10 条评分或观后短评。', check: c => c.recordCount >= 10 },
    { id: 'five-star-general', name: '五星上将', emoji: '🌟', rarity: 'silver', desc: '为 5 部作品打出五星好评。', check: c => c.fiveStarCount >= 5 },
    { id: 'snapped', name: '打了个响指', emoji: '🧤', rarity: 'gold', desc: '集齐宝石后,亲手触发了那个响指……', check: c => c.state.snapped },
    { id: 'six-stones', name: '无限宝石收藏家', emoji: '💎', rarity: 'gold', desc: '集齐六颗无限宝石(看完六部宝石关键作品)。', check: c => MARVEL.STONES.every(s => c.has(s.workId)) },
    { id: 'infinity-saga', name: '无限传奇', emoji: '🏆', rarity: 'gold', desc: '看完第 1-3 阶段全部 23 部电影。', check: c => MARVEL.WORKS.filter(w => w.phase >= 1 && w.phase <= 3 && w.type === 'movie').every(w => c.has(w.id)) },
    { id: 'multiverse-saga', name: '多元宇宙传奇', emoji: '🌌', rarity: 'gold', desc: '看完第 4-6 阶段全部已上映作品。', check: c => MARVEL.WORKS.filter(w => w.phase >= 4 && !w.upcoming).every(w => c.has(w.id)) },
    { id: 'spider-master', name: '蜘蛛侠全制霸', emoji: '🕷️', rarity: 'gold', desc: '看完三代共 8 部真人蜘蛛侠电影。', check: c => ['raimi-1', 'raimi-2', 'raimi-3', 'tasm-1', 'tasm-2', 'spider-man-1', 'spider-man-2', 'spider-man-3'].every(id => c.has(id)) },
    { id: 'asgard-line', name: '诸神黄昏', emoji: '⚡', rarity: 'gold', desc: '看完雷神四部曲与《洛基》两季。', check: c => ['thor', 'thor-2', 'thor-ragnarok', 'thor-lt', 'loki-s1', 'loki-s2'].every(id => c.has(id)) },
    { id: 'streak-7', name: '七日连击', emoji: '🔥', rarity: 'gold', desc: '连续 7 天打卡不间断。', check: c => c.streakCurrent >= 7 },
    { id: 'hundred-hours', name: '百小时俱乐部', emoji: '💯', rarity: 'vibranium', desc: '累计观看时长突破 100 小时。', check: c => c.minutes >= 6000 },
    { id: 'all-clear', name: '全宇宙制霸', emoji: '👑', rarity: 'vibranium', desc: '看完资料库中全部已上映作品。你就是活着的漫威百科。', check: c => MARVEL.WORKS.filter(w => !w.upcoming).every(w => c.has(w.id)) },
    { id: 'night-owl', name: '守夜人', emoji: '🌙', rarity: 'silver', hidden: true, desc: '在凌晨 0-5 点打卡——月光骑士为你点赞。', check: c => !!c.flags.nightOwl },
    { id: 'random-fate', name: '听天由命', emoji: '🎲', rarity: 'bronze', hidden: true, desc: '使用「随机来一部」5 次——选择困难症患者认证。', check: c => (c.flags.randomCount || 0) >= 5 },
  ];
})();
