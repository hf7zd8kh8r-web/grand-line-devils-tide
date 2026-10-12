// Quest board helpers: multi-track (up to 3), repeatable clears with cooldown, unique loot once.
import { QUESTS } from './data.js';
export const MAX_ACTIVE = 3;
export const REPEAT_CD = 90 * 1000; // full XP/Berries again after 90s
export function migrateQuests(S) {
  if (!S) return S;
  S.quests = Array.isArray(S.quests) ? S.quests : [];
  S.qcd = S.qcd && typeof S.qcd === 'object' ? S.qcd : {};
  S.qdone = Array.isArray(S.qdone) ? S.qdone : [];
  if (S.quest && !S.quests.some(q => q && q.id === S.quest.id)) S.quests.unshift(S.quest);
  S.quests = S.quests.filter(Boolean).slice(0, MAX_ACTIVE);
  S.quest = S.quests[0] || null;
  return S;
}
export const islandQuests = (isl) => QUESTS[isl] || [];
export const isUnique = (q) => !!(q && (q.sword || q.reward || q.once || q.secret));
export const hasDone = (S, id) => (S.qdone || []).includes(id);
export const isActive = (S, id) => (S.quests || []).some(q => q.id === id);
export const activeQuest = (S, id) => (S.quests || []).find(q => q.id === id);
export function cdLeft(S, id, now = Date.now()) { return Math.max(0, ((S.qcd || {})[id] || 0) - now); }
export function rewardOf(S, q, now = Date.now()) {
  if (!hasDone(S, q.id)) return { xp: q.xp, ber: q.ber, unique: true, mul: 1, cd: 0 };
  const cd = cdLeft(S, q.id, now);
  // On cooldown: show reduced preview but Accept/Repeat stays locked until ready (full rewards).
  if (cd > 0) return { xp: q.xp, ber: q.ber, unique: false, mul: 1, cd };
  return { xp: q.xp, ber: q.ber, unique: false, mul: 1, cd: 0 };
}
export function syncPrimary(S) { S.quest = (S.quests && S.quests[0]) || null; }
export function takeQuest(S, def) {
  migrateQuests(S);
  if (!def || isActive(S, def.id) || S.quests.length >= MAX_ACTIVE) return 'full';
  if ((S.lvl || 1) < (def.lvl || 0)) return 'lvl';
  if (hasDone(S, def.id) && cdLeft(S, def.id) > 0) return 'cd';
  const q = { ...def, have: def.type === 'mat' ? Math.min(def.n - 1, (S.inv.mats && S.inv.mats[def.target]) || 0) : 0, repeat: hasDone(S, def.id) };
  S.quests.push(q); syncPrimary(S); return q;
}
export function dropQuest(S, id) {
  migrateQuests(S);
  S.quests = S.quests.filter(q => q.id !== id); syncPrimary(S);
}
export function completeOne(S, q, now = Date.now()) {
  migrateQuests(S);
  const first = !hasDone(S, q.id);
  const rw = rewardOf(S, q, now);
  S.quests = S.quests.filter(x => x.id !== q.id);
  if (first) S.qdone.push(q.id);
  S.qcd[q.id] = now + REPEAT_CD;
  syncPrimary(S);
  return { first, xp: rw.xp, ber: rw.ber, giveUnique: first && isUnique(q) };
}
export const fmtCd = (ms) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
