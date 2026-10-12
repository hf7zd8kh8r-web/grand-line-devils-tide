import { RACES, SWORDS, GUNS, ACCESSORIES, FRUITS, xpNeed } from './data.js';
const KEY = 'gldt_save_v1';
export function newSave(name, faction, race) {
  return { v: 1, name, faction, race, lvl: 1, xp: 0, ber: 0, hp: null, island: 'windmill', unlocked: ['windmill'], boat: false,
    inv: { swords: [], guns: [], fruits: [], wear: [], mats: {}, fish: {} }, fishdex: {}, eq: { sword: null, gun: null, fruit: null, wear: [] }, slot: 'fist',
    mastery: {}, quest: null, qdone: [], kills: {}, stats: { kills: 0, bosses: 0, dmg: 0, time: 0, deaths: 0, punches: 0, created: Date.now() }, bossSeen: {} };
}
// fill any fields missing from older saves with fresh defaults (never crash on an old save)
export function fixSave(s) { const d = newSave(s.name || 'Pirate', s.faction || 'pirate', s.race || 'Human');
  for (const k of Object.keys(d)) { if (s[k] === undefined || s[k] === null && d[k] !== null) s[k] = d[k]; else if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) { if (typeof s[k] !== 'object' || Array.isArray(s[k])) s[k] = d[k]; else for (const k2 of Object.keys(d[k])) if (s[k][k2] === undefined || (Array.isArray(d[k][k2]) && !Array.isArray(s[k][k2]))) s[k][k2] = d[k][k2]; } else if (Array.isArray(d[k]) && !Array.isArray(s[k])) s[k] = d[k]; }
  { const ok = { swords: SWORDS, guns: GUNS, fruits: FRUITS, wear: ACCESSORIES }; for (const k of Object.keys(ok)) s.inv[k] = (s.inv[k] || []).filter(id => ok[k][id]);
    if (s.eq.sword && !SWORDS[s.eq.sword]) s.eq.sword = null; if (s.eq.gun && !GUNS[s.eq.gun]) s.eq.gun = null; if (s.eq.fruit && !FRUITS[s.eq.fruit]) s.eq.fruit = null; s.eq.wear = (s.eq.wear || []).filter(id => ACCESSORIES[id]).slice(0, 3);
    if (!['fist', 'sword', 'gun', 'fruit'].includes(s.slot) || (s.slot !== 'fist' && !s.eq[s.slot])) s.slot = 'fist'; }
  if (!s.unlocked.includes('windmill')) s.unlocked.unshift('windmill'); if (typeof s.lvl !== 'number' || !isFinite(s.lvl)) s.lvl = 1; if (typeof s.ber !== 'number' || !isFinite(s.ber)) s.ber = 0; return s; }
export function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return fixSave(s); } catch (_) {} return null; }
export const saveHooks = [];
export const lock = { on: false };
export function save(S) { if (lock.on) return; S.savedAt = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {} for (const f of saveHooks) try { f(S); } catch (_) {} }
export function wipe() { localStorage.removeItem(KEY); }
const ht = (S, k, t) => ((S.hakiT || {})[k] || 0) > t;
export function stats(S) {
  const R = RACES[S.race] || RACES.Human; let hp = 0, dmg = 0, spd = 0, def = 0;
  for (const w of S.eq.wear) { const a = ACCESSORIES[w]; if (!a) continue; hp += a.stat.hp || 0; dmg += a.stat.dmg || 0; spd += a.stat.spd || 0; def += a.stat.def || 0; }
  const r = statsRaw(S, R, hp, dmg, spd, def); { const fr = factionRank(S); if (fr.marine) r.def *= 1 - fr.tier * 0.03; else r.dmg *= 1 + fr.tier * 0.03; }
  const tf = S.tf | 0; if (tf) { r.dmg *= tf === 2 ? 1.3 : 1.15; r.def *= tf === 2 ? 0.7 : 0.85; r.spd *= tf === 2 ? 1.2 : 1.05; r.maxHp = Math.round(r.maxHp * (tf === 2 ? 1.2 : 1)); r.eye *= tf === 2 ? 1.35 : 1.05; r.jump *= tf === 2 ? 1.15 : 1; } return r;
}
function statsRaw(S, R, hp, dmg, spd, def) {
  return { maxHp: Math.round((100 + S.lvl * 14) * R.hp + hp), dmg: R.dmg * (1 + dmg) * (1 + (S.haki && S.haki.buso ? 0.25 + (ht(S, 'buso', 2) ? 0.1 : 0) + (ht(S, 'buso', 3) ? 0.2 : 0) : 0) + (ht(S, 'conq', 1) ? 0.1 : 0) + (ht(S, 'conq', 3) ? 0.15 : 0)), spd: 6.2 * R.spd * (1 + spd), def: (R.def || 1) * (1 - def) * (S.haki && S.haki.buso && ht(S, 'buso', 1) ? 0.9 : 1), xpM: R.xp, jump: R.jump, eye: R.h };
}
export function mastery(S, key) { return S.mastery[key] || { lvl: 1, xp: 0 }; }
export function addMastery(S, key, amt) { const m = S.mastery[key] || (S.mastery[key] = { lvl: 1, xp: 0 }); if (m.lvl >= 100) return false; m.xp += amt; const need = 6 + m.lvl * 2; if (m.xp >= need) { m.xp -= need; m.lvl++; return true; } return false; }
export const mastMul = (S, key) => 1 + (mastery(S, key).lvl - 1) * 0.012;
export { xpNeed };

// ---- faction progression: Pirates climb by bounty, Marines by merit; each tier gives a perk ----
export const PIRATE_TITLES = [[0, 'Rookie Pirate'], [1e6, 'Wanted Pirate'], [3e7, 'Notorious Pirate'], [1.2e8, 'Supernova'], [5e8, 'Warlord of the Sea'], [1.5e9, 'Yonko Commander'], [4e9, 'Emperor of the Sea']];
export const MARINE_RANKS = [[0, 'Seaman Recruit'], [3e3, 'Petty Officer'], [2e4, 'Lieutenant'], [8e4, 'Commander'], [2.5e5, 'Captain'], [6e5, 'Commodore'], [1.5e6, 'Vice Admiral'], [4e6, 'Admiral'], [1e7, 'Fleet Admiral']];
export const bountyOf = S => (S.stats.kills || 0) * 1500 + (S.stats.bosses || 0) * 400000 + S.lvl * S.lvl * 900 + (S.stats.events || 0) * 250000;
export const meritOf = S => (S.stats.kills || 0) * 12 + (S.stats.bosses || 0) * 2500 + S.lvl * S.lvl * 12 + (S.stats.events || 0) * 1500 + (S.qdone || []).length * 300;
export function factionRank(S) { const marine = S.faction === 'Marine'; const L = marine ? MARINE_RANKS : PIRATE_TITLES; const v = marine ? meritOf(S) : bountyOf(S); let t = 0; for (let i = 0; i < L.length; i++) if (v >= L[i][0]) t = i;
  const next = L[t + 1]; return { tier: t, title: L[t][1], value: v, next: next ? next[0] : null, nextTitle: next ? next[1] : null, marine, unit: marine ? 'Merit' : 'Bounty',
    perk: marine ? `+${t * 3}% defense, +${t * 5}% XP, ${t * 2}% shop discount` : `+${t * 3}% damage, +${t * 5}% Berries from enemies` }; }
