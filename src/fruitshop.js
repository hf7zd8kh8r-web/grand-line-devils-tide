// Rotating Fruit Dealer stock: rerolls every 5 real minutes, rarity-weighted per slot.
// Shared stock is deterministic per (island, window). A per-player nonce (paid Restock Now)
// mixes into the seed so only that player sees a different roll; co-op peers keep shared stock.
import { FRUITS, RARITY, RCOL } from './data.js';
export const PERIOD = 5 * 60 * 1000;
export const WEIGHTS = [40, 25, 15, 10, 6, 3, 0.9, 0.1]; // % per slot: Common .. Ultra
export const PRICE = [350, 1200, 4000, 12000, 45000, 150000, 600000, 3500000];
const SLOTS = 6;
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const rngOf = (seed) => { let x = seed || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
export const windowId = (now = Date.now()) => Math.floor(now / PERIOD);
export const msLeft = (now = Date.now()) => PERIOD - (now % PERIOD);
export function rollRarity(r) { let x = r() * 100; for (let i = 0; i < WEIGHTS.length; i++) { if (x < WEIGHTS[i]) return i; x -= WEIGHTS[i]; } return 0; }
export function stockFor(island, w = windowId(), nonce = 0) {
  const r = rngOf(hash(island + ':' + w + (nonce ? ':r' + nonce : ''))); const out = [];
  for (let i = 0; i < SLOTS; i++) { const rar = rollRarity(r); const pool = Object.keys(FRUITS).filter(k => FRUITS[k].rar === rar); const id = pool[Math.floor(r() * pool.length)]; out.push({ slot: i, id, rar, price: Math.round(PRICE[rar] * (0.9 + r() * 0.2) / 10) * 10 }); }
  return out;
}
// Personal Restock Now: base = 250×level (min 500), doubles each use in the same window.
export const rerollPrice = (lvl, uses = 0) => Math.round(Math.max(500, 250 * Math.max(1, lvl | 0)) * Math.pow(2, uses | 0) / 10) * 10;
export const fmtLeft = (ms) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
export { RARITY, RCOL };
