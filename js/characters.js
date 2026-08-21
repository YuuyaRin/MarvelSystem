/* ==========================================================================
   MARVEL 宇宙观影指挥中心 — 角色数据库 & 关系网
   aliases 用于匹配 data.js 中各作品的 characters 列表,自动生成登场作品线。
   intro 无剧透;arc 含剧透(受「剧透保护」遮罩)。
   ========================================================================== */

window.MARVEL = window.MARVEL || {};

MARVEL.FACTIONS = {
  founders: { name: '初代复仇者', color: '#e62429' },
  newgen:   { name: '新生代英雄', color: '#4d7cfe' },
  cosmic:   { name: '宇宙战线',   color: '#ff9800' },
  mystic:   { name: '魔法侧',     color: '#26c6da' },
  street:   { name: '街头英雄',   color: '#f0b429' },
  spy:      { name: '情报与棋手', color: '#78909c' },
  villain:  { name: '大反派',     color: '#9c27b0' },
  xmen:     { name: 'X战警与变体', color: '#66bb6a' },
};

MARVEL.CHARACTERS = [
/* ---------- 初代复仇者 ---------- */
{
  id: 'tony', title: '钢铁侠', name: '托尼·斯塔克', en: 'Iron Man', actor: '小罗伯特·唐尼', emoji: '🦾', faction: 'founders',
  aliases: ['钢铁侠', '托尼·斯塔克'],
  intro: '天才、亿万富翁、花花公子、慈善家。一切开始的地方,复仇者联盟的发动机与钱包。',
  arc: '从军火商到自我牺牲的英雄,十一年弧光在《终局之战》以一个响指与「爱你三千遍」落幕。他的遗产仍在:斯塔克科技、彼得、以及整个新生代。',
},
{
  id: 'steve', title: '美国队长', name: '史蒂夫·罗杰斯', en: 'Captain America', actor: '克里斯·埃文斯', emoji: '🛡️', faction: 'founders',
  aliases: ['美国队长', '史蒂夫·罗杰斯'],
  intro: '1943 年的瘦弱青年,超级士兵血清造就的精神领袖。「我可以打上一整天。」',
  arc: '《终局之战》归还宝石后留在过去,与佩姬跳完了那支迟到七十年的舞,以老人身份归来,将盾牌交给山姆。',
},
{
  id: 'thor', title: '雷神', name: '索尔', en: 'Thor', actor: '克里斯·海姆斯沃斯', emoji: '🔨', faction: 'founders',
  aliases: ['雷神', '索尔'],
  intro: '阿斯加德之王、雷霆之神,复仇者中唯一的正牌神明,也是最惨的一位。',
  arc: '失去母亲、父亲、弟弟、家园与半数子民后一度崩溃发福,在《爱与雷霆》送别简·福斯特,如今带着养女「爱」继续流浪宇宙。',
},
{
  id: 'hulk', title: '浩克', name: '布鲁斯·班纳', en: 'Hulk', actor: '马克·鲁法洛', emoji: '💚', faction: 'founders',
  aliases: ['浩克', '布鲁斯·班纳'],
  intro: '七位博士学位与一身绿色肌肉的矛盾体。「我一直都在愤怒。」',
  arc: '在《终局之战》达成人格融合成为「智慧浩克」,并亲手打了逆转响指。如今多在幕后客串,儿子斯卡尔已在《女浩克》登场。',
},
{
  id: 'natasha', title: '黑寡妇', name: '娜塔莎·罗曼诺夫', en: 'Black Widow', actor: '斯嘉丽·约翰逊', emoji: '⌛', faction: 'founders',
  aliases: ['黑寡妇', '娜塔莎'],
  intro: '红房子训练出的顶级特工,复仇者的粘合剂,账本上写满红字的救赎者。',
  arc: '为换取灵魂宝石在沃米尔纵身一跃,是唯一没有被逆转响指带回的牺牲。她的妹妹叶莲娜接过了衣钵与遗志。',
},
{
  id: 'clint', title: '鹰眼', name: '克林特·巴顿', en: 'Hawkeye', actor: '杰瑞米·雷纳', emoji: '🏹', faction: 'founders',
  aliases: ['鹰眼', '克林特·巴顿'],
  intro: '从不脱靶的神射手,复仇者里唯一有农场、有家庭的普通人。',
  arc: '响指夺走全家后化身「浪人」滥杀五年;家人归来后只想退休,在《鹰眼》把弓箭与「鹰眼」之名传给了凯特·毕肖普。',
},

/* ---------- 新生代英雄 ---------- */
{
  id: 'peter', title: '蜘蛛侠', name: '彼得·帕克', en: 'Spider-Man', actor: '汤姆·赫兰德', emoji: '🕷️', faction: 'newgen',
  aliases: ['蜘蛛侠', '彼得·帕克'],
  intro: '皇后区的高中生英雄,托尼·斯塔克选中的接班人。能力越大,责任越大。',
  arc: '《英雄无归》结尾让全世界忘记了彼得·帕克的存在——失去了梅姨、MJ、内德和一切,独自缝制新战衣回归街头,这正是《崭新的一天》的起点。',
},
{
  id: 'sam', title: '美国队长', name: '山姆·威尔逊', en: 'Captain America (Falcon)', actor: '安东尼·麦凯', emoji: '🪽', faction: 'newgen',
  aliases: ['猎鹰', '山姆·威尔逊', '美国队长'],
  intro: '前伞兵救援队员,史蒂夫最信任的战友,从「猎鹰」到第二任美国队长。',
  arc: '经历上交盾牌、官方美队闹剧后正式接棒,《美丽新世界》直面红浩克总统危机,《毁灭日》前正在组建自己的复仇者。',
},
{
  id: 'bucky', title: '冬兵', name: '巴基·巴恩斯', en: 'The Winter Soldier', actor: '塞巴斯蒂安·斯坦', emoji: '❄️', faction: 'newgen',
  aliases: ['冬兵', '巴基'],
  intro: '史蒂夫的发小,坠落后被九头蛇改造成传奇杀手「冬日战士」,一条挣扎赎罪的路。',
  arc: '在瓦坎达洗净洗脑代码获得新生,如今甚至当选国会议员,并在《雷霆特攻队*》成为新复仇者的一员。',
},
{
  id: 'yelena', title: '黑寡妇', name: '叶莲娜·贝洛娃', en: 'Yelena Belova', actor: '弗洛伦丝·皮尤', emoji: '🕸️', faction: 'newgen',
  aliases: ['叶莲娜'],
  intro: '黑寡妇的「妹妹」,红房子出身的毒舌特工,新生代人气天花板。',
  arc: '为姐姐之死一度追杀鹰眼,后受雇于瓦伦蒂娜;在《雷霆特攻队*》直面自己的抑郁与过去,现为新复仇者事实上的核心。',
},
{
  id: 'kate', title: '鹰眼', name: '凯特·毕肖普', en: 'Kate Bishop', actor: '海莉·斯坦菲尔德', emoji: '🎯', faction: 'newgen',
  aliases: ['凯特·毕肖普'],
  intro: '纽约之战时目睹鹰眼救场的小女孩,长成了自封的「世界最强女弓箭手」。',
  arc: '《鹰眼》中与克林特并肩清算旧账,正式继承「鹰眼」之名,是未来「青年复仇者」的种子选手。',
},
{
  id: 'kamala', title: '惊奇少女', name: '卡玛拉·汗', en: 'Ms. Marvel', actor: '伊曼·韦拉尼', emoji: '✨', faction: 'newgen',
  aliases: ['惊奇少女', '卡玛拉·汗'],
  intro: '惊奇队长的头号迷妹,新泽西高中生,手镯唤醒了她的光能——还有一个更大的秘密。',
  arc: '《惊奇少女》结尾被点明是 MCU 首位「变种人」;《惊奇队长2》片尾她已开始照着偶像的样子,拉起青年复仇者的名单。',
},
{
  id: 'tchalla', title: '黑豹', name: '特查拉', en: 'Black Panther', actor: '查德维克·博斯曼', emoji: '🐈‍⬛', faction: 'newgen',
  aliases: ['黑豹', '特查拉'],
  intro: '瓦坎达国王与守护神「黑豹」,让世界看见振金之国的君主。',
  arc: '因主演博斯曼病逝,《瓦坎达万岁》中角色亦因病离世,全片成为一场盛大告别;彩蛋揭示他留有一子,名为特查拉。',
},
{
  id: 'shuri', title: '黑豹', name: '苏睿', en: 'Shuri', actor: '利蒂希娅·赖特', emoji: '🐆', faction: 'newgen',
  aliases: ['苏睿'],
  intro: '瓦坎达公主与首席科学家,嘴上不饶人的天才少女。',
  arc: '在失去哥哥后合成心形草药继承黑豹衣钵,击败纳摩却选择放下复仇,把王位让给姆巴库,自己走向实验室与远方。',
},
{
  id: 'scott', title: '蚁人', name: '斯科特·朗格', en: 'Ant-Man', actor: '保罗·路德', emoji: '🐜', faction: 'newgen',
  aliases: ['蚁人', '斯科特·朗格'],
  intro: '前小偷、现英雄、永远的好爸爸。整个宇宙欠他一句谢谢——没有蚁人就没有时间劫案。',
  arc: '《量子狂潮》全家迎战征服者康侥幸生还;表面回归日常,但他比谁都清楚:康的变体们还在路上。',
},
{
  id: 'bob', title: '哨兵', name: '鲍勃·雷诺兹', en: 'Sentry / The Void', actor: '刘易斯·普尔曼', emoji: '🌗', faction: 'newgen',
  aliases: ['哨兵', '鲍勃'],
  intro: '「万个太阳之力」的实验体哨兵,内心却住着吞噬一切的「虚空」——MCU 最强也最脆弱的人。',
  arc: '在《雷霆特攻队*》被叶莲娜从虚空中拉回,如今以「鲍勃」的身份留在新复仇者身边;所有人都知道,那层平衡薄如蝉翼。',
},

/* ---------- 宇宙战线 ---------- */
{
  id: 'carol', title: '惊奇队长', name: '卡罗尔·丹弗斯', en: 'Captain Marvel', actor: '布丽·拉尔森', emoji: '🌟', faction: 'cosmic',
  aliases: ['惊奇队长', '卡罗尔·丹弗斯'],
  intro: '空军试飞员融合空间宝石能量而成的单兵天花板,「更高,更远,更快」。',
  arc: '摧毁克里至高智慧后常年在深空善后,《惊奇队长2》中与卡玛拉、莫妮卡完成和解与传承;弗瑞的寻呼机始终为她保留。',
},
{
  id: 'quill', title: '星爵', name: '彼得·奎尔', en: 'Star-Lord', actor: '克里斯·普拉特', emoji: '🚀', faction: 'cosmic',
  aliases: ['星爵'],
  intro: '地球混混+半神血统,揣着 80 年代磁带拯救银河系的「传奇法外之徒」。',
  arc: '痛失卡魔拉又眼看「另一个她」离开,《银护3》解散队伍回地球寻根;字幕承诺「传奇的星爵将会回归」。',
},
{
  id: 'gamora', name: '卡魔拉', en: 'Gamora', actor: '佐伊·索尔达娜', emoji: '🔪', faction: 'cosmic',
  aliases: ['卡魔拉'],
  intro: '灭霸养女、「全银河最危险的女人」,银河护卫队的良心。',
  arc: '原时间线的她被灭霸推下沃米尔换取灵魂宝石;如今宇宙中的是 2014 年穿越来的变体,记忆里没有与星爵的爱情,现与掠夺者同行。',
},
{
  id: 'rocket', name: '火箭', en: 'Rocket Raccoon', actor: '布莱德利·库珀(配音)', emoji: '🦝', faction: 'cosmic',
  aliases: ['火箭浣熊'],
  intro: '毒舌军火专家,别叫他浣熊。银护的战术大脑与灵魂。',
  arc: '《银护3》揭开至高进化实验室的至暗身世,直面童年伙伴的亡魂后完成救赎,如今是新一代银河护卫队的队长。',
},
{
  id: 'groot', name: '格鲁特', en: 'Groot', actor: '范·迪塞尔(配音)', emoji: '🌳', faction: 'cosmic',
  aliases: ['格鲁特'],
  intro: '「我是格鲁特。」翻译:宇宙第一暖树,火箭的生死之交。',
  arc: '初代格鲁特牺牲于陨落舰,现在的格鲁特是他的「儿子」;《银护3》里那句让所有人听懂的「我爱你们」,值得单独裱起来。',
},
{
  id: 'nebula', name: '涅布拉', en: 'Nebula', actor: '凯伦·吉兰', emoji: '🔧', faction: 'cosmic',
  aliases: ['涅布拉'],
  intro: '灭霸养女、半机械改造人,在父亲的「锻造」中长大的复仇之刃。',
  arc: '从反派一路走成《终局之战》的关键功臣(亲手击杀过去的自己),现留在「无处」管理新家园,是银护解散后最踏实的一个。',
},

/* ---------- 魔法侧 ---------- */
{
  id: 'strange', title: '奇异博士', name: '斯蒂芬·斯特兰奇', en: 'Doctor Strange', actor: '本尼迪克特·康伯巴奇', emoji: '🌀', faction: 'mystic',
  aliases: ['奇异博士', '斯特兰奇'],
  intro: '从傲慢的神外医生到至圣所之主,看过一千四百万分之一未来的男人。',
  arc: '《疯狂多元宇宙》为救美国队回收拾了黑化变体与旺达的烂摊子,代价是第三只眼;与克莉的感情线止于「我爱你,在每一个宇宙」。',
},
{
  id: 'wanda', title: '绯红女巫', name: '旺达·马克西莫夫', en: 'Scarlet Witch', actor: '伊丽莎白·奥尔森', emoji: '❤️‍🔥', faction: 'mystic',
  aliases: ['绯红女巫', '旺达'],
  intro: '索科维亚孤儿,心灵宝石唤醒的混沌魔法容器,MCU 悲剧浓度最高的角色。',
  arc: '失去幻视后在西景镇造梦,又为寻回双子在《疯狂多元宇宙》黑化屠戮;最终推塌黑暗神书自我埋葬——但《阿加莎》证明她的儿子比利已转世归来,母子重逢只是时间问题。',
},
{
  id: 'vision', name: '幻视', en: 'Vision', actor: '保罗·贝坦尼', emoji: '🧿', faction: 'mystic',
  aliases: ['幻视'],
  intro: '心灵宝石+振金之躯+贾维斯人格的合成生命,能举起雷神之锤的「人」。',
  arc: '被灭霸挖走宝石死于瓦坎达;《旺达幻视》中的「白幻视」带着完整记忆飞走至今未归——这条线是未来《幻视》剧集的引信。',
},
{
  id: 'loki', name: '洛基', en: 'Loki', actor: '汤姆·希德勒斯顿', emoji: '⏳', faction: 'mystic',
  aliases: ['洛基'],
  intro: '诡计之神、抢戏之王,从头号反派一路演成全宇宙最受爱戴的角色。',
  arc: '2012 变体被 TVA 逮捕后完成了十二年最完整的弧光:在时间尽头独坐王座,以千年孤独为代价撑起整棵多元宇宙之树——「故事之神」名副其实。',
},

/* ---------- 街头英雄 ---------- */
{
  id: 'matt', title: '夜魔侠', name: '马特·默多克', en: 'Daredevil', actor: '查理·考克斯', emoji: '🦯', faction: 'street',
  aliases: ['夜魔侠', '马特·默多克'],
  intro: '白天是盲人律师,夜里是地狱厨房的守护神。天主教式自我折磨的集大成者。',
  arc: '网飞三季与金并缠斗后,在《重生》中经历挚友之死、封印再披甲;金并当上市长,这场城市攻防战远未结束。',
},
{
  id: 'fisk', title: '金并', name: '威尔逊·菲斯克', en: 'Kingpin', actor: '文森特·多诺费奥', emoji: '👔', faction: 'street',
  aliases: ['金并'],
  intro: '纽约地下世界之王「金并」,西装革履的暴力本身。',
  arc: '从网飞《夜魔侠》一路活到《鹰眼》《回声》,如今竟以合法身份当选纽约市长——把整座城市变成他的办公室。',
},

/* ---------- 情报与棋手 ---------- */
{
  id: 'fury', name: '尼克·弗瑞', en: 'Nick Fury', actor: '塞缪尔·杰克逊', emoji: '🕶️', faction: 'spy',
  aliases: ['尼克·弗瑞'],
  intro: '神盾局传奇局长,复仇者计划的缔造者。独眼看穿一切,谎话说尽、初心未改。',
  arc: '眼睛毁于噬元兽咕咕(惊奇队长时期);《秘密入侵》中拖着老迈之躯独自清理斯克鲁人渗透,把最后的体面留给了老朋友塔洛斯。',
},
{
  id: 'valentina', name: '瓦伦蒂娜', en: 'Valentina Allegra de Fontaine', actor: '朱莉娅·路易斯-德瑞弗斯', emoji: '💼', faction: 'spy',
  aliases: ['瓦伦蒂娜'],
  intro: '中情局局长,后弗瑞时代的头号棋手,专收「二线英雄」为己所用。',
  arc: '哨兵计划的始作俑者;《雷霆特攻队*》翻车后顺水推舟把这支队伍包装成「新复仇者」——发布会开得比谁都快。',
},

/* ---------- 大反派 ---------- */
{
  id: 'thanos', name: '灭霸', en: 'Thanos', actor: '乔什·布洛林', emoji: '🧤', faction: 'villain',
  aliases: ['灭霸'],
  intro: '泰坦星的「疯狂泰坦」,坚信宇宙资源有限、必须随机抹除一半生命的哲学家暴君。',
  arc: '《无限战争》集齐宝石打响完美响指;《终局之战》开场被雷神斩首,2014 变体又在决战中被托尼的响指化灰——两度死亡,一个时代的落幕。',
},
{
  id: 'kang', name: '康', en: 'Kang the Conqueror', actor: '乔纳森·梅杰斯', emoji: '⏰', faction: 'villain',
  aliases: ['康', '征服者康', '残存者', '维克多·泰姆利'],
  intro: '31 世纪的科学家,无数变体散布多元宇宙:残存者、征服者、幻术师……每一个都是他。',
  arc: '残存者死于西尔维剑下引爆时间线分裂;征服者被蚁人一家挫败。随着现实层面的选角变动,康的故事让位于毁灭博士——但康议会仍悬在设定之中。',
},
{
  id: 'doom', title: '毁灭博士', name: '维克多·冯·杜姆', en: 'Doctor Doom', actor: '小罗伯特·唐尼', emoji: '🎭', faction: 'villain',
  aliases: ['毁灭博士'],
  intro: '拉脱维尼亚君主、科学与魔法双修的完美主义暴君,漫威漫画史上最伟大的反派。',
  arc: '《神奇四侠:初露锋芒》彩蛋中现身 828 宇宙,带走了富兰克林面前的悬念;由唐尼出演的这位毁灭博士,将是《毁灭日》与《秘密战争》的轴心。',
},

/* ---------- X战警与变体 ---------- */
{
  id: 'wade', title: '死侍', name: '韦德·威尔逊', en: 'Deadpool', actor: '瑞安·雷诺兹', emoji: '🌶️', faction: 'xmen',
  aliases: ['死侍', '韦德'],
  intro: '不死嘴炮雇佣兵,唯一知道自己活在电影里的人。漫威的「第四面墙爆破专家」。',
  arc: '《死侍与金刚狼》里为拯救家园时间线大闹 TVA,拉着罗根完成双人救赎,正式把 R 级贱气带进 MCU。',
},
{
  id: 'logan', title: '金刚狼', name: '罗根', en: 'Wolverine', actor: '休·杰克曼', emoji: '🌵', faction: 'xmen',
  aliases: ['金刚狼', '罗根'],
  intro: '艾德曼合金骨架+自愈因子+两百年的疲惫。X战警的灵魂,超英电影史的图腾。',
  arc: '《金刚狼3》完成了他的死亡与安息;《死侍与金刚狼》登场的是「最差劲的变体罗根」——一个辜负过所有人、终于抓住救赎机会的他。',
},
];

/* ---------- 角色关系(a、b 为角色 id) ----------
   type: family 亲缘 / love 爱人 / mentor 师承 / comrade 战友挚友 / rival 宿敌对立 */
MARVEL.RELATIONS = [
  { a: 'tony', b: 'peter', type: 'mentor', label: '师徒' },
  { a: 'tony', b: 'steve', type: 'rival', label: '理念对立 → 并肩赴死' },
  { a: 'tony', b: 'hulk', type: 'comrade', label: '科学兄弟' },
  { a: 'tony', b: 'vision', type: 'family', label: '创造者与造物' },
  { a: 'tony', b: 'thanos', type: 'rival', label: '泰坦星宿敌' },
  { a: 'steve', b: 'bucky', type: 'comrade', label: '生死之交' },
  { a: 'steve', b: 'sam', type: 'mentor', label: '传盾人' },
  { a: 'steve', b: 'scott', type: 'comrade', label: '内战盟友' },
  { a: 'bucky', b: 'tony', type: 'rival', label: '冬兵旧账' },
  { a: 'bucky', b: 'sam', type: 'comrade', label: '欢喜冤家搭档' },
  { a: 'bucky', b: 'yelena', type: 'comrade', label: '新复仇者战友' },
  { a: 'thor', b: 'loki', type: 'family', label: '相爱相杀的兄弟' },
  { a: 'thor', b: 'hulk', type: 'comrade', label: '复仇者B队' },
  { a: 'thor', b: 'thanos', type: 'rival', label: '「你该砍头的」' },
  { a: 'natasha', b: 'clint', type: 'comrade', label: '生死搭档' },
  { a: 'natasha', b: 'yelena', type: 'family', label: '姐妹' },
  { a: 'natasha', b: 'fury', type: 'comrade', label: '最信任的干将' },
  { a: 'clint', b: 'kate', type: 'mentor', label: '新老鹰眼' },
  { a: 'wanda', b: 'vision', type: 'love', label: '恋人' },
  { a: 'wanda', b: 'strange', type: 'rival', label: '至尊法师 vs 绯红女巫' },
  { a: 'strange', b: 'peter', type: 'comrade', label: '一咒之缘' },
  { a: 'thanos', b: 'gamora', type: 'family', label: '养父女' },
  { a: 'thanos', b: 'nebula', type: 'family', label: '养父女' },
  { a: 'gamora', b: 'nebula', type: 'family', label: '姐妹' },
  { a: 'quill', b: 'gamora', type: 'love', label: '恋人(与她的变体)' },
  { a: 'rocket', b: 'groot', type: 'comrade', label: '最佳拍档' },
  { a: 'carol', b: 'fury', type: 'comrade', label: '90年代老友' },
  { a: 'carol', b: 'kamala', type: 'mentor', label: '偶像与继承者' },
  { a: 'matt', b: 'fisk', type: 'rival', label: '地狱厨房宿敌' },
  { a: 'wade', b: 'logan', type: 'comrade', label: '欢喜冤家' },
  { a: 'tchalla', b: 'shuri', type: 'family', label: '兄妹' },
  { a: 'yelena', b: 'bob', type: 'comrade', label: '把彼此拉出深渊' },
  { a: 'valentina', b: 'yelena', type: 'rival', label: '操控与反抗' },
  { a: 'valentina', b: 'bob', type: 'rival', label: '造神者' },
  { a: 'kang', b: 'loki', type: 'rival', label: '残存者与故事之神' },
  { a: 'kang', b: 'scott', type: 'rival', label: '量子领域之战' },
  { a: 'doom', b: 'kang', type: 'rival', label: '前后两任大威胁' },
  { a: 'peter', b: 'kamala', type: 'comrade', label: '青年英雄同辈' },
  { a: 'sam', b: 'valentina', type: 'rival', label: '新复仇者话语权之争' },
  { a: 'fisk', b: 'kate', type: 'rival', label: '毕肖普家的旧债' },
];

/* 别名 → 角色 id 索引(用于作品详情页的角色点击跳转) */
MARVEL.charByAlias = {};
MARVEL.CHARACTERS.forEach(c => {
  [c.name, ...c.aliases].forEach(a => { MARVEL.charByAlias[a] = c.id; });
});
MARVEL.charById = {};
MARVEL.CHARACTERS.forEach(c => { MARVEL.charById[c.id] = c; });
