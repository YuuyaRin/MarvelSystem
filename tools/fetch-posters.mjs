/**
 * 从英文维基百科抓取每部作品的海报缩略图 URL,生成 js/posters.js
 * 用法: node tools/fetch-posters.mjs
 */

const TITLES = {
  'iron-man': 'Iron Man (2008 film)',
  'hulk': 'The Incredible Hulk (film)',
  'iron-man-2': 'Iron Man 2',
  'thor': 'Thor (film)',
  'cap-1': 'Captain America: The First Avenger',
  'avengers': 'The Avengers (2012 film)',
  'iron-man-3': 'Iron Man 3',
  'thor-2': 'Thor: The Dark World',
  'cap-2': 'Captain America: The Winter Soldier',
  'gotg': 'Guardians of the Galaxy (film)',
  'aou': 'Avengers: Age of Ultron',
  'ant-man': 'Ant-Man (film)',
  'civil-war': 'Captain America: Civil War',
  'doctor-strange': 'Doctor Strange (2016 film)',
  'gotg2': 'Guardians of the Galaxy Vol. 2',
  'spider-man-1': 'Spider-Man: Homecoming',
  'thor-ragnarok': 'Thor: Ragnarok',
  'black-panther': 'Black Panther (film)',
  'infinity-war': 'Avengers: Infinity War',
  'ant-man-wasp': 'Ant-Man and the Wasp',
  'captain-marvel': 'Captain Marvel (film)',
  'endgame': 'Avengers: Endgame',
  'spider-man-2': 'Spider-Man: Far From Home',
  'wandavision': 'WandaVision',
  'falcon-ws': 'The Falcon and the Winter Soldier',
  'loki-s1': 'Loki (season 1)',
  'what-if-s1': 'What If...? (TV series)',
  'shang-chi': 'Shang-Chi and the Legend of the Ten Rings',
  'eternals': 'Eternals (film)',
  'spider-man-3': 'Spider-Man: No Way Home',
  'mom': 'Doctor Strange in the Multiverse of Madness',
  'hawkeye': 'Hawkeye (TV series)',
  'black-widow': 'Black Widow (2021 film)',
  'moon-knight': 'Moon Knight (TV series)',
  'ms-marvel': 'Ms. Marvel (TV series)',
  'thor-lt': 'Thor: Love and Thunder',
  'she-hulk': 'She-Hulk: Attorney at Law',
  'werewolf': 'Werewolf by Night',
  'wakanda-forever': 'Black Panther: Wakanda Forever',
  'holiday-special': 'The Guardians of the Galaxy Holiday Special',
  'quantumania': 'Ant-Man and the Wasp: Quantumania',
  'gotg3': 'Guardians of the Galaxy Vol. 3',
  'secret-invasion': 'Secret Invasion (miniseries)',
  'loki-s2': 'Loki (season 2)',
  'what-if-s2': 'What If...? (season 2)',
  'echo': 'Echo (miniseries)',
  'marvels': 'The Marvels',
  'deadpool-wolverine': 'Deadpool & Wolverine',
  'agatha': 'Agatha All Along',
  'what-if-s3': 'What If...? (season 3)',
  'daredevil-ba': 'Daredevil: Born Again',
  'brave-new-world': 'Captain America: Brave New World',
  'thunderbolts': 'Thunderbolts*',
  'ironheart': 'Ironheart (TV series)',
  'eyes-of-wakanda': 'Eyes of Wakanda',
  'marvel-zombies': 'Marvel Zombies (miniseries)',
  'wonder-man': 'Wonder Man (TV series)',
  'fantastic-four': 'The Fantastic Four: First Steps',
  'brand-new-day': 'Spider-Man: Brand New Day',
  'doomsday': 'Avengers: Doomsday',
  'secret-wars': 'Avengers: Secret Wars',
  'raimi-1': 'Spider-Man (2002 film)',
  'raimi-2': 'Spider-Man 2',
  'raimi-3': 'Spider-Man 3',
  'tasm-1': 'The Amazing Spider-Man (film)',
  'tasm-2': 'The Amazing Spider-Man 2',
  'xmen-1': 'X-Men (film)',
  'xmen-2': 'X2 (film)',
  'xmen-3': 'X-Men: The Last Stand',
  'first-class': 'X-Men: First Class',
  'dofp': 'X-Men: Days of Future Past',
  'logan': 'Logan (film)',
  'deadpool-1': 'Deadpool (film)',
  'deadpool-2': 'Deadpool 2',
  'dd-netflix': 'Daredevil (TV series)',
  'agents-shield': 'Agents of S.H.I.E.L.D.',
  'venom-1': 'Venom (2018 film)',
  'venom-2': 'Venom: Let There Be Carnage',
  'spider-verse-1': 'Spider-Man: Into the Spider-Verse',
  'spider-verse-2': 'Spider-Man: Across the Spider-Verse',
};

const API = 'https://en.wikipedia.org/w/api.php';

/* 批量查询:一次最多 25 个标题,大幅减少请求数避免限流 */
async function fetchBatch(titles) {
  const url = `${API}?action=query&prop=pageimages&piprop=thumbnail&pithumbsize=500&pilicense=any&pilimit=50&format=json&redirects=1&titles=${encodeURIComponent(titles.join('|'))}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'MarvelSystem/1.0 (personal watchlist project; contact: local)' } });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error('API 返回非 JSON(可能被限流): ' + text.slice(0, 80)); }

  // 标题可能被 normalize / redirect,建立「最终标题 → 原始标题」映射
  const toOriginal = {};
  titles.forEach(t => { toOriginal[t] = t; });
  (json.query.normalized || []).forEach(n => { toOriginal[n.to] = toOriginal[n.from] || n.from; });
  (json.query.redirects || []).forEach(r => { toOriginal[r.to] = toOriginal[r.from] || r.from; });

  const result = {};
  Object.values(json.query.pages || {}).forEach(page => {
    const orig = toOriginal[page.title] || page.title;
    const src = page.thumbnail && page.thumbnail.source;
    if (src) result[orig] = src.split('?')[0];
  });
  return result;
}

const out = {};
const failed = [];
const entries = Object.entries(TITLES);
const CHUNK = 25;

for (let i = 0; i < entries.length; i += CHUNK) {
  const chunk = entries.slice(i, i + CHUNK);
  try {
    const found = await fetchBatch(chunk.map(([, t]) => t));
    chunk.forEach(([id, title]) => {
      if (found[title]) { out[id] = found[title]; console.log(`ok   ${id}`); }
      else { failed.push([id, title]); console.log(`MISS ${id}  (${title})`); }
    });
  } catch (e) {
    console.log(`批次失败: ${e.message}`);
    chunk.forEach(([id, title]) => failed.push([id, title]));
  }
  await new Promise(r => setTimeout(r, 2500));
}

const banner = `/* 由 tools/fetch-posters.mjs 自动生成 · ${new Date().toISOString().slice(0, 10)}
   海报缩略图来自英文维基百科(upload.wikimedia.org),离线时自动回退渐变卡面。 */\n`;
const body = `window.MARVEL = window.MARVEL || {};\nMARVEL.POSTERS = ${JSON.stringify(out, null, 2)};\n`;

const fs = await import('fs');
fs.writeFileSync(new URL('../js/posters.js', import.meta.url), banner + body);
console.log(`\n生成 js/posters.js: ${Object.keys(out).length} 张海报, ${failed.length} 个缺失`);
if (failed.length) console.log('缺失:', failed.map(f => f[0]).join(', '));
