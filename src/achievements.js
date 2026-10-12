// Achievements (checked every few seconds), stats charts and stats export.
import { FRUITS, SWORDS, ISLANDS, ENEMIES } from './data.js';
import * as ST from './state.js';
const st = (S, k) => (S.stats && S.stats[k]) || 0;
const maxM = (S, p) => Math.max(0, ...Object.entries(S.mastery || {}).filter(([k]) => k.startsWith(p)).map(([, m]) => m.lvl));
// [id, icon, name, description, progress(S) -> [have, need], reward ฿]
export const ACH = [
  ['k1', '👊', 'First Blood', 'Defeat your first enemy', S => [st(S, 'kills'), 1], 200],
  ['k100', '⚔️', 'Bandit Bane', 'Defeat 100 enemies', S => [st(S, 'kills'), 100], 5000],
  ['k1000', '💀', 'One-Pirate Army', 'Defeat 1,000 enemies', S => [st(S, 'kills'), 1000], 80000],
  ['b1', '👑', 'Giant Slayer', 'Defeat a boss', S => [st(S, 'bosses'), 1], 1000],
  ['b10', '🏆', 'Boss Hunter', 'Defeat 10 bosses', S => [st(S, 'bosses'), 10], 50000],
  ['bu', '🗺', 'Grand Line Conqueror', 'Defeat 15 different bosses', S => [Object.keys(S.kills || {}).filter(k => ENEMIES[k] && ENEMIES[k].boss).length, 15], 250000],
  ['l10', '⭐', 'Rising Star', 'Reach level 10', S => [S.lvl, 10], 2000],
  ['l50', '🌟', 'Supernova', 'Reach level 50', S => [S.lvl, 50], 40000],
  ['l150', '💫', 'Yonko Material', 'Reach level 150', S => [S.lvl, 150], 300000],
  ['isl5', '⛵', 'Explorer', 'Visit 5 islands', S => [(S.unlocked || []).length, 5], 5000],
  ['isl15', '🧭', 'Navigator', 'Visit 15 islands', S => [(S.unlocked || []).length, 15], 60000],
  ['fr1', '🍇', 'Cursed Bite', 'Eat a Devil Fruit', S => [S.eq && S.eq.fruit ? 1 : 0, 1], 1000],
  ['frl', '🔥', 'Legendary Power', 'Own a Legendary or better fruit', S => [[...(S.inv.fruits || []), S.eq.fruit].some(f => FRUITS[f] && FRUITS[f].rar >= 4) ? 1 : 0, 1], 20000],
  ['fru', '🌈', 'Ultra Instinct', 'Own an Ultra fruit', S => [[...(S.inv.fruits || []), S.eq.fruit].some(f => FRUITS[f] && FRUITS[f].rar === 7) ? 1 : 0, 1], 500000],
  ['aw', '✦', 'Awakened', 'Awaken a fruit', S => [Object.keys(S.awake || {}).length, 1], 100000],
  ['sw10', '🗡', 'Blade Collector', 'Own 10 swords', S => [(S.inv.swords || []).length, 10], 30000],
  ['sws', '🌀', 'Secret Blade', 'Earn a secret quest sword', S => [(S.inv.swords || []).filter(s => SWORDS[s] && SWORDS[s].secret).length, 1], 80000],
  ['m25', '📈', 'Dedicated', 'Reach mastery 25 on anything', S => [maxM(S, ''), 25], 10000],
  ['m100', '🥇', 'Grandmaster', 'Reach mastery 100 on anything', S => [maxM(S, ''), 100], 500000],
  ['sty5', '🥋', 'Martial Artist', 'Learn 5 fighting styles', S => [(S.styles || []).length, 5], 25000],
  ['haki', '🛡', 'Will of Steel', 'Unlock all three Haki', S => [['buso', 'ken', 'conq'].filter(k => (S.hakiT || {})[k]).length, 3], 150000],
  ['fish50', '🎣', 'Angler', 'Catch 50 fish', S => [st(S, 'fish'), 50], 15000],
  ['dex', '🐟', 'Fish Scholar', 'Log 20 fish species', S => [Object.keys(S.fishdex || {}).length, 20], 40000],
  ['ffr', '🍑', 'Lucky Hook', 'Fish up a Devil Fruit', S => [st(S, 'fishFruits'), 1], 20000],
  ['chest', '💰', 'Treasure Hunter', 'Open 10 treasure chests', S => [st(S, 'chests'), 10], 20000],
  ['ev10', '🎲', 'Thrill Seeker', 'Clear 10 random events', S => [st(S, 'events'), 10], 50000],
  ['davy', '🏴‍☠️', 'Davy Back Champion', 'Win a Davy Back Fight', S => [(S.evDone || {}).davy || 0, 1], 30000],
  ['buster', '💥', 'Buster Call Survivor', 'Survive a Buster Call', S => [(S.evDone || {}).buster || 0, 1], 60000],
  ['sk', '🐉', 'Sea King Slayer', 'Defeat a Sea King', S => [(S.kills || {}).seaking || 0, 1], 25000],
  ['q25', '📜', 'Helping Hand', 'Complete 25 quests', S => [(S.qdone || []).length, 25], 30000],
  ['trade', '⚖', 'Merchant', 'Complete a trade', S => [st(S, 'trades'), 1], 3000],
  ['sp', '🎬', 'Showtime', 'Use a cutscene Special', S => [st(S, 'specials'), 1], 10000],
  ['tf', '🐾', 'Beast Within', 'Transform with a Zoan fruit', S => [st(S, 'transforms'), 1], 10000],
  ['ship', '🚢', 'Shipwright\'s Friend', 'Own 3 ships', S => [(S.ships || []).length, 3], 40000],
  ['rank', '🎖', 'Top Brass / Emperor', 'Reach faction tier 5', S => [ST.factionRank(S).tier, 5], 400000],
  ['crew', '🤝', 'Nakama', 'Recruit 2 crewmates', S => [(S.crew || []).length, 2], 30000],
];
export function checkAch(g) { const S = g.save; S.ach = S.ach || {}; let any = false;
  for (const [id, ic, name, , fn, ber] of ACH) { if (S.ach[id]) continue; let ok = false; try { const [h, n] = fn(S); ok = h >= n; } catch (_) {} if (ok) { S.ach[id] = Date.now(); any = true; g.addBerries(ber); g.ui.banner('🏆 ACHIEVEMENT', `${ic} ${name} · +฿${ber.toLocaleString()}`); g.ui.toast(`🏆 ${name} unlocked!`, 'rare'); break; } }
  if (any) ST.save(S); }
export function achHtml(S, fmt) { S.ach = S.ach || {}; const got = ACH.filter(a => S.ach[a[0]]).length;
  return `<p class="dim">Trophies: <b class="gold">${got}/${ACH.length}</b> · each pays a Berry reward when unlocked.</p><div class="achs">${ACH.map(([id, ic, name, desc, fn, ber]) => { let h = 0, n = 1; try { [h, n] = fn(S); } catch (_) {} const done = !!S.ach[id]; const k = Math.min(1, h / n);
    return `<div class="ach ${done ? 'done' : ''}"><i>${ic}</i><div><b>${name}</b><small>${desc}</small><span class="pb"><span style="width:${Math.round(k * 100)}%"></span></span><small class="dim">${done ? '✔ Unlocked' : `${fmt(Math.min(h, n))}/${fmt(n)}`} · ฿${fmt(ber)}</small></div></div>`; }).join('')}</div>`; }
// simple bar charts drawn into canvases inside the Stats tab
export function drawStatCharts(S) { const bars = (cv, title, rows, col) => { if (!cv) return; const dpr = Math.min(2, devicePixelRatio || 1); const W = cv.clientWidth || 300, H = 22 * Math.max(1, rows.length) + 28; cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px'; const c = cv.getContext('2d'); c.scale(dpr, dpr);
    c.fillStyle = '#ffd36a'; c.font = 'bold 12px sans-serif'; c.fillText(title, 4, 14); const mx = Math.max(1, ...rows.map(r => r[1]));
    rows.forEach(([n, v], i) => { const y = 24 + i * 22; c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(110, y, W - 160, 16); c.fillStyle = col; c.fillRect(110, y, (W - 160) * v / mx, 16); c.fillStyle = '#fff'; c.font = '11px sans-serif'; c.fillText(String(n).slice(0, 17), 4, y + 12); c.fillText(String(v), W - 44, y + 12); });
    if (!rows.length) { c.fillStyle = '#aaa'; c.fillText('Nothing yet', 4, 40); } };
  const kills = Object.entries(S.kills || {}).map(([k, v]) => [(ENEMIES[k] && ENEMIES[k].name) || (k === 'seaking' ? 'Sea King' : k), v]).sort((a, b) => b[1] - a[1]).slice(0, 8);
  bars(document.getElementById('chK'), 'Enemies defeated (top 8)', kills, '#ff7a5a');
  const nm = k => { const [t, id] = k.split(':'); return t === 'fr' ? (FRUITS[id] ? FRUITS[id].short : id) : t === 'sw' ? (SWORDS[id] ? SWORDS[id].name : id) : id; };
  bars(document.getElementById('chM'), 'Mastery levels (top 8)', Object.entries(S.mastery || {}).map(([k, m]) => [nm(k), m.lvl]).sort((a, b) => b[1] - a[1]).slice(0, 8), '#5ad0ff');
  const src = [['Kills', st(S, 'kills')], ['Fish', st(S, 'fish')], ['Chests', st(S, 'chests')], ['Events', st(S, 'events')], ['Quests', (S.qdone || []).length], ['Specials', st(S, 'specials')], ['Trades', st(S, 'trades')]];
  bars(document.getElementById('chA'), 'Activity', src, '#7dffb0'); }
export function exportStats(S, kind) { const fr = ST.factionRank(S); const rows = [['Name', S.name], ['Faction', S.faction], ['Rank', fr.title], [fr.unit, fr.value], ['Race', S.race], ['Level', S.lvl], ['Berries', S.ber], ['Islands visited', (S.unlocked || []).length],
    ...Object.entries(S.stats || {}).map(([k, v]) => ['stat:' + k, v]), ...Object.entries(S.kills || {}).map(([k, v]) => ['kills:' + k, v]), ...Object.entries(S.mastery || {}).map(([k, m]) => ['mastery:' + k, m.lvl]), ['Achievements', Object.keys(S.ach || {}).length + '/' + ACH.length]];
  const txt = kind === 'json' ? JSON.stringify(S, null, 1) : rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([txt], { type: kind === 'json' ? 'application/json' : 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `devils-tide-${S.name.replace(/\W+/g, '_')}-${kind === 'json' ? 'save.json' : 'stats.csv'}`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); return txt.length; }
