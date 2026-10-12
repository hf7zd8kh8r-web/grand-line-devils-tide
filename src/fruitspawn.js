// World Devil Fruit spawns: one fruit every 30 real minutes on a reachable island. Pure module (shared by client + server).
import { FRUITS, ISLANDS, SEAS } from './data.js';
import { rollRarity } from './fruitshop.js';
export const SF_PERIOD = 30 * 60 * 1000;
export const sfWindow = (now = Date.now()) => Math.floor(now / SF_PERIOD);
export const sfLeft = (now = Date.now()) => SF_PERIOD - (now % SF_PERIOD);
export const hashS = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
export const rngOf = (seed) => { let x = seed || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
export const BUILT = ISLANDS.filter(i => i.built && !i.secret);
// islands a player (or the best player in a crew) can reach: built + level gate (incl. sea gate) or already visited
export function reachable(lvl, unlocked = []) { const out = BUILT.filter(i => unlocked.includes(i.id) || (lvl >= i.lvl && lvl >= ((SEAS.find(s => s.id === i.sea) || {}).lvl || 1))); return out.length ? out : [BUILT[0]]; }
export function rollSpawn(seedStr, isl) { const r = rngOf(hashS(seedStr) || 7); for (let k = 0; k < 3; k++) r(); const I = isl[Math.floor(r() * isl.length)];
  const rar = rollRarity(r); const pool = Object.keys(FRUITS).filter(k => FRUITS[k].rar === rar); const fruit = pool[Math.floor(r() * pool.length)];
  return { island: I.id, fruit, rar, seed: Math.floor(r() * 1e9) }; }
export const seaName = id => { const I = ISLANDS.find(i => i.id === id); const s = I && SEAS.find(x => x.id === I.sea); return s ? s.name : ''; };
