// Ships: bought from Shipwrights. Needed to sail; better ships unlock later seas.
import { THREE, Builder, mat, WORLD_MAT } from './engine.js';
const B = THREE;
// tier: Second Sea needs tier >= 3 (coated hull), Third Sea needs tier >= 5.
export const SHIPS = {
  dinghy:   { tier: 1, name: 'Small Sailboat',              price: 500,      lvl: 1,   spd: 1.0, hull: 100,  cannons: 0,  dmg: 0,   size: 0.62, masts: 1, fig: null,     desc: 'A one-sail dinghy. Fine for the calm East Blue.' },
  caravel:  { tier: 2, name: 'Caravel (Merry-class)',       price: 30000,    lvl: 15,  spd: 1.2, hull: 260,  cannons: 2,  dmg: 60,  size: 0.85, masts: 1, fig: 'ram',    desc: 'A sturdy caravel with a ram figurehead and two cannons.' },
  brig:     { tier: 3, name: 'Coated Brig',                 price: 400000,   lvl: 100, spd: 1.4, hull: 600,  cannons: 4,  dmg: 140, size: 1.0,  masts: 2, fig: 'bust',   desc: 'Resin-coated by Sabaody craftsmen: can dive to Fish-Man Island and enter the SECOND SEA.' },
  sunny:    { tier: 4, name: 'Brigantine (Sunny-class)',    price: 1500000,  lvl: 150, spd: 1.7, hull: 1000, cannons: 6,  dmg: 260, size: 1.12, masts: 2, fig: 'lion',   desc: 'Adam-wood brigantine with a lion figurehead. Fast and tough. Press DASH for Coup de Burst.' },
  galleon:  { tier: 5, name: 'War Galleon',                 price: 6000000,  lvl: 240, spd: 1.8, hull: 1800, cannons: 8,  dmg: 420, size: 1.3,  masts: 3, fig: 'dragon', desc: 'A three-masted war galleon. Strong enough for the THIRD SEA.' },
  flagship: { tier: 6, name: 'Emperor Flagship (Moby-class)', price: 20000000, lvl: 300, spd: 2.1, hull: 3000, cannons: 12, dmg: 700, size: 1.5,  masts: 3, fig: 'whale',  desc: 'A whale-headed flagship fit for an Emperor of the Sea.' },
};
export const SHIP_IDS = Object.keys(SHIPS);
export const seaTier = sea => sea >= 3 ? 5 : sea >= 2 ? 3 : 1;
export const shipOf = S => SHIPS[S.ship] || null;
export function migrateShips(S) { S.ships = S.ships || (S.boat ? ['dinghy'] : []); if (S.boat && !S.ships.length) S.ships.push('dinghy'); if (!S.ship && S.ships.length) S.ship = S.ships[S.ships.length - 1]; S.boat = !!S.ship; }
// procedural ship model. Bow points -Z. Returns group with userData { deckY, len, cannons: [local positions], wheel }.
export function makeShipModel(id, faction = 'Pirate', o = {}) {
  const D = SHIPS[id] || SHIPS.dinghy; const s = D.size; const b = new Builder(); const box = (x, y, z) => new B.BoxGeometry(x, y, z); const cyl = (a, c, h, n = 8) => new B.CylinderGeometry(a, c, h, n); const sph = (r, w = 10, h = 8) => new B.SphereGeometry(r, w, h);
  const marine = faction === 'Marine'; const hull = o.hull ?? (marine ? 0xf2f2f2 : [0, 0x9a6a35, 0xb07a40, 0x6a4a2a, 0x8a5a2a, 0x4a2a1a, 0xf0f0f0][D.tier]);
  const trim = marine ? 0x2a5bb8 : [0, 0x5a3a1a, 0xf0e8d0, 0x3a7a5a, 0x3a8ad0, 0xc0a040, 0x7a2a2a][D.tier]; const sailC = o.sail ?? (marine ? 0xffffff : 0xf3ecd8); const deck = 0xc89a5a;
  const L = 6 * s * (D.tier >= 5 ? 1.25 : 1), W = 2.2 * s, H = 1.1 * s;
  b.add(box(W, H, L), hull, mat(0, H / 2, 0), { grad: 0.45 });                         // hull
  b.add(box(W * 0.8, H * 0.7, L * 0.12), hull, mat(0, H * 0.45, -L * 0.53, 0, 0, 0, 1, 1, 1));
  b.add(new B.ConeGeometry(W * 0.48, L * 0.32, 4), hull, mat(0, H * 0.55, -L * 0.62, -Math.PI / 2, Math.PI / 4, 0, 1, 1, 0.55), {}); // bow
  b.add(box(W * 1.02, 0.16 * s, L * 1.0), trim, mat(0, H * 0.82, 0), { outline: false }); // trim stripe
  b.add(box(W * 0.94, 0.08 * s, L * 0.98), deck, mat(0, H + 0.02, 0), { outline: false });           // deck
  for (const x of [-1, 1]) b.add(box(0.08 * s, 0.35 * s, L * 0.92), hull, mat(x * W * 0.47, H + 0.2 * s, 0));   // rails
  // stern castle + wheel
  b.add(box(W * 0.95, 0.9 * s, L * 0.22), hull, mat(0, H + 0.45 * s, L * 0.38)); b.add(box(W * 0.98, 0.1 * s, L * 0.23), trim, mat(0, H + 0.92 * s, L * 0.38));
  for (let i = 0; i < 3; i++) b.add(box(0.28 * s, 0.22 * s, 0.05), 0xffe08a, mat((i - 1) * 0.5 * s, H + 0.5 * s, L * 0.495), { outline: false }); // stern windows
  const wheel = new B.Vector3(0, H + 0.95 * s + 0.55, L * 0.33);
  b.add(new B.TorusGeometry(0.32, 0.04, 6, 14), 0x6a3a1a, mat(0, wheel.y, wheel.z - 0.2), { outline: false }); for (let i = 0; i < 4; i++) b.add(box(0.7, 0.04, 0.04), 0x6a3a1a, mat(0, wheel.y, wheel.z - 0.2, 0, 0, i * Math.PI / 4), { outline: false });
  b.add(cyl(0.05, 0.06, 0.6), 0x5a3a1a, mat(0, wheel.y - 0.35, wheel.z - 0.15));
  // masts + sails
  const mz = D.masts === 1 ? [-0.05] : D.masts === 2 ? [-0.2, 0.12] : [-0.28, -0.02, 0.22];
  for (const [k, zf] of mz.entries()) { const z = zf * L; const mh = (6.2 + (k === 0 && D.masts > 1 ? 0.8 : 0)) * s; b.add(cyl(0.1 * s, 0.14 * s, mh, 6), 0x5a3a1a, mat(0, H + mh / 2, z));
    const sw = (D.tier === 1 ? 2.4 : 3.3) * s, sh = 2.3 * s; const sy = H + mh * 0.74; b.add(box(sw, sh, 0.08 * s), sailC, mat(0, sy, z - 0.12 * s, 0.1, 0, 0), {}); b.add(cyl(0.05 * s, 0.05 * s, sw * 1.05, 5), 0x5a3a1a, mat(0, sy + sh / 2, z, 0, 0, Math.PI / 2)); b.add(cyl(0.04 * s, 0.04 * s, sw * 1.0, 5), 0x5a3a1a, mat(0, sy - sh / 2, z - 0.1 * s, 0, 0, Math.PI / 2));
    if (D.tier >= 3) b.add(box(sw * 0.62, sh * 0.5, 0.07 * s), sailC, mat(0, H + mh * 0.97, z - 0.1 * s, 0.08, 0, 0));
    if (k === 0 || D.masts === 1) { const mark = marine ? 0x2a5bb8 : 0x1a1a1a; b.add(box(1.0 * s, 1.0 * s, 0.04), mark, mat(0, H + mh * 0.74, z - 0.2 * s), { outline: false }); b.add(sph(0.25 * s), marine ? 0xffffff : 0xf0f0f0, mat(0, H + mh * 0.76, z - 0.23 * s, 0, 0, 0, 1, 1, 0.3), { outline: false }); }
    b.add(box(0.7 * s, 0.4 * s, 0.03), marine ? 0x2a5bb8 : 0x111111, mat(0.35 * s, H + mh + 0.2 * s, z), { outline: false }); }   // flag
  if (D.tier >= 3) b.add(cyl(0.06 * s, 0.06 * s, 3.2 * s, 5), 0x5a3a1a, mat(0, H + 0.9 * s, -L * 0.72, -1.1, 0, 0)); // bowsprit
  // figureheads
  const fz = -L * 0.78, fy = H + 0.35 * s;
  if (D.fig === 'ram') { b.add(sph(0.45 * s), 0xf4f0e0, mat(0, fy, fz)); for (const x of [-1, 1]) b.add(new B.TorusGeometry(0.2 * s, 0.07 * s, 5, 10), 0xc8a060, mat(x * 0.38 * s, fy + 0.1 * s, fz, 0, Math.PI / 2, 0)); }
  if (D.fig === 'lion') { b.add(sph(0.62 * s, 14, 10), 0xffb030, mat(0, fy + 0.15 * s, fz, 0, 0, 0, 1, 1, 0.5)); b.add(sph(0.4 * s), 0xffe070, mat(0, fy + 0.15 * s, fz - 0.15 * s)); }
  if (D.fig === 'bust') b.add(sph(0.35 * s), 0xd0c0a0, mat(0, fy + 0.2 * s, fz));
  if (D.fig === 'dragon') { b.add(new B.ConeGeometry(0.35 * s, 1.4 * s, 6), 0x3a8a5a, mat(0, fy + 0.4 * s, fz - 0.3 * s, -1.0, 0, 0)); b.add(sph(0.3 * s), 0x3a8a5a, mat(0, fy + 0.85 * s, fz - 0.8 * s)); }
  if (D.fig === 'whale') { b.add(sph(1.0 * s, 14, 10), 0xf4f4f4, mat(0, H * 0.7, -L * 0.6, 0, 0, 0, 1, 0.8, 1.3)); for (const x of [-1, 1]) b.add(sph(0.12 * s), 0x111111, mat(x * 0.7 * s, H * 0.9, -L * 0.75)); }
  // cannons
  const cannons = []; const per = Math.ceil(D.cannons / 2);
  for (let i = 0; i < per; i++) for (const x of [-1, 1]) { const z = (-0.25 + (per === 1 ? 0.25 : i / (per - 1) * 0.5)) * L; const p = new B.Vector3(x * W * 0.5, H * 0.65, z); cannons.push(p); b.add(cyl(0.11 * s, 0.13 * s, 0.7 * s, 8), 0x2a2a2a, mat(x * W * 0.52, H * 0.65, z, 0, 0, Math.PI / 2)); }
  const g = b.build(WORLD_MAT); g.userData = { deckY: H, len: L, wid: W, cannons, wheel, tier: D.tier };
  return g;
}
