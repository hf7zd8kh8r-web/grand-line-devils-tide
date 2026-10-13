// Avatar look + cosmetics (pure data + helpers; no Three here)
import { HAIRS, MOUTHS } from './chars.js';
export const SKINS = [['Fair', 0xf6cfa8], ['Peach', 0xf2c49b], ['Tan', 0xd9a274], ['Bronze', 0xb07a4a], ['Brown', 0x8d5a3b], ['Deep', 0x5e3a24]];
export const HAIRC = [['Black', 0x111111], ['Brown', 0x5a3a1a], ['Blonde', 0xf0d050], ['Ginger', 0xe06a2a], ['Red', 0xc02020], ['Pink', 0xf07ab0], ['Green', 0x2aa04a], ['Blue', 0x2a6ae0], ['Silver', 0xd8d8e0], ['Purple', 0x7a3ab0], ['Teal', 0x2ab0b0], ['White', 0xf4f4f4]];
export const EYEC = [['Brown', 0x3a2410], ['Black', 0x111111], ['Blue', 0x2a6ae0], ['Green', 0x2a9a4a], ['Amber', 0xd09020], ['Red', 0xc02020], ['Violet', 0x8a4ad0], ['Grey', 0x8a9098]];
export const CLOTH = [['Red', 0xc8202a], ['Blue', 0x2a4a9a], ['Navy', 0x1a2a4a], ['White', 0xf4f4f4], ['Black', 0x1a1a1a], ['Green', 0x2a7a3a], ['Yellow', 0xf0c030], ['Orange', 0xe0702a], ['Purple', 0x6a3a9a], ['Pink', 0xe86a9a], ['Brown', 0x6a4a2a], ['Teal', 0x2a8a8a], ['Grey', 0x6a6a72], ['Gold', 0xc9a23a]];
export const OUTFITS = [['vest', 'Open Vest'], ['tee', 'Shirt'], ['open', 'Open Shirt'], ['tank', 'Sleeveless'], ['jacket', 'Jacket'], ['suit', 'Suit & Tie'], ['kimono', 'Kimono + Sash']];
export const FREE_HATS = ['none', 'bandana', 'beanie'];
export const HAIR_NAMES = { spiky: 'Spiky', short: 'Short', messy: 'Messy', slick: 'Slicked Back', long: 'Long', ponytail: 'Ponytail', bun: 'Top Bun', pigtails: 'Pigtails', afro: 'Afro', mohawk: 'Mohawk', buzz: 'Buzz Cut', swept: 'Swept Up', bald: 'Bald', wild: 'Wild Spikes', pompadour: 'Pompadour' };
export const MOUTH_NAMES = { smile: 'Smile', grin: 'Big Grin', line: 'Serious', frown: 'Scowl', teeth: 'Toothy' };
export const BROWS = [['normal', 'Normal'], ['angry', 'Fierce'], ['kind', 'Kind'], ['sad', 'Worried']];
// premium cosmetics (Berries) — slot: hat | back | face | neck | extra
export const COSMETICS = {
  straw: { name: 'Straw Hat', slot: 'hat', price: 1500, icon: '👒', o: { hat: 'straw' } },
  marinecap: { name: 'Marine Cap', slot: 'hat', price: 800, icon: '🧢', o: { hat: 'marine' } },
  tricorn: { name: 'Captain\'s Tricorn', slot: 'hat', price: 6000, icon: '🏴‍☠️', o: { hat: 'tricorn' } },
  tophat: { name: 'Gentleman\'s Top Hat', slot: 'hat', price: 4500, icon: '🎩', o: { hat: 'top' } },
  cowboy: { name: 'Fire Fist Hat', slot: 'hat', price: 9000, icon: '🤠', o: { hat: 'cowboy' } },
  chef: { name: 'Baratie Chef Hat', slot: 'hat', price: 3000, icon: '👨‍🍳', o: { hat: 'chef' } },
  crown: { name: 'Pirate Empress Crown', slot: 'hat', price: 25000, icon: '👑', o: { hat: 'crown' } },
  turban: { name: 'Desert Turban', slot: 'hat', price: 3500, icon: '🧕', o: { hat: 'turban' } },
  horned: { name: 'Beast Pirate Helm', slot: 'hat', price: 40000, icon: '🐉', o: { hat: 'horned' } },
  justice: { name: 'Justice Cape (Marine)', slot: 'back', price: 12000, icon: '⚖️', o: { cape: 0xffffff } },
  capRed: { name: 'Captain\'s Red Cape', slot: 'back', price: 15000, icon: '🟥', o: { cape: 0xc02020 } },
  capBlack: { name: 'Emperor\'s Black Cape', slot: 'back', price: 30000, icon: '⬛', o: { cape: 0x1a1a1a } },
  longcoat: { name: 'Long Coat', slot: 'back', price: 8000, icon: '🧥', o: { coat: 'top' } },
  pinkfur: { name: 'Pink Feather Coat', slot: 'back', price: 60000, icon: '🦩', o: { fur: 0xe8608a, cape: 0xe8608a } },
  angelw: { name: 'Sky Wings', slot: 'extra', price: 20000, icon: '🪽', o: { wings: true, wingC: 0xffffff } },
  shades: { name: 'Shades', slot: 'face', price: 2500, icon: '🕶️', o: { glasses: 'shades' } },
  redshades: { name: 'Heavenly Demon Shades', slot: 'face', price: 18000, icon: '🔴', o: { glasses: 'shades', shadeC: 0xd02020 } },
  roundg: { name: 'Round Glasses', slot: 'face', price: 1200, icon: '👓', o: { glasses: 'round' } },
  scar: { name: 'Battle Scar', slot: 'face', price: 2000, icon: '⚔️', o: { scar: true } },
  xscar: { name: 'Cross Scar', slot: 'face', price: 7000, icon: '❌', o: { scar: 'x' } },
  mustache: { name: 'Pirate Mustache', slot: 'face', price: 3000, icon: '🥸', o: { mustache: true } },
  beard: { name: 'Full Beard', slot: 'face', price: 3000, icon: '🧔', o: { beard: true } },
  cigar: { name: 'Twin Cigars', slot: 'face', price: 5000, icon: '🚬', o: { cigar: 2 } },
  scarf: { name: 'Battle Scarf', slot: 'neck', price: 4000, icon: '🧣', o: { scarf: 0x6a1a2a } },
  sash: { name: 'Samurai Sash', slot: 'neck', price: 3000, icon: '🎌', o: { sash: 0xc02020 } },
  gloves: { name: 'Fighting Gloves', slot: 'neck', price: 2500, icon: '🥊', o: { gloves: 0x2a2a2a } },
  horns: { name: 'Oni Horns', slot: 'extra', price: 35000, icon: '👹', o: { horns: true } },
};
export function defaultLook(faction, race) {
  const L = { skin: 1, hairS: 'spiky', hairC: 0, eye: 0, mouth: 'grin', brow: 'normal', outfit: faction === 'Marine' ? 'jacket' : 'vest', top: faction === 'Marine' ? 3 : 0, pants: faction === 'Marine' ? 2 : 1, hat: faction === 'Marine' ? 'none' : 'none' };
  if (race === 'Mink') L.hairC = 3; if (race === 'Skypiean') L.hairC = 2; if (race === 'Lunarian') L.hairC = 11; if (race === 'Fish-Man') L.hairC = 7;
  return L;
}
// turn a saved look + race + equipped cosmetics into makeChar overrides
export function lookOverrides(look, race, faction, cosEq = {}) {
  const L = look || defaultLook(faction, race);
  const top = CLOTH[L.top % CLOTH.length][1], pants = CLOTH[L.pants % CLOTH.length][1];
  const o = { skin: SKINS[L.skin % SKINS.length][1], hair: HAIRC[L.hairC % HAIRC.length][1], hairS: L.hairS, eye: EYEC[L.eye % EYEC.length][1], mouth: L.mouth, brow: L.brow, shirt: top, pants, hat: L.hat === 'none' ? undefined : L.hat };
  if (L.outfit === 'vest') o.open = true; if (L.outfit === 'open') { o.open = true; o.shirt = top; } if (L.outfit === 'tank') o.sleeveless = true;
  if (L.outfit === 'jacket') { o.coat = top; o.collar = faction === 'Marine' ? 0x2a5bb8 : undefined; o.shirt = 0xf0f0f0; }
  if (L.outfit === 'suit') { o.longSleeve = true; o.tie = 0x1a1a1a; }
  if (L.outfit === 'kimono') { o.longSleeve = true; o.sash = 0x2a2a2a; o.collar = 0xf0f0f0; }
  if (race === 'Fish-Man') { o.skin = 0x5fa8c9; o.fin = true; } if (race === 'Mink') { o.mink = true; o.skin = 0xe9c38a; } if (race === 'Skypiean') { o.wings = true; o.wingC = 0xffffff; }
  if (race === 'Lunarian') { o.wings = true; o.wingC = 0x1a1a1a; o.skin = 0x9a6a50; } if (race === 'Giant') o.scale = 1.3;
  for (const id of Object.values(cosEq)) { const c = COSMETICS[id]; if (!c) continue; for (const [k, v] of Object.entries(c.o)) o[k] = v === 'top' ? top : v; }
  for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
  return o;
}
// curated, coordinated outfits so fake players look like stylish real players rather than random noise
const STYLE_PRESETS = [
  { outfit: 'kimono', top: 5, pants: 4, hairS: 'short', hairC: 6, cos: { hat: 'none', neck: 'sash', face: 'scar' }, mouth: 'line', brow: 'angry' },
  { outfit: 'jacket', top: 1, pants: 4, cos: { hat: 'tricorn', back: 'capRed', face: 'mustache' }, mouth: 'grin' },
  { outfit: 'jacket', top: 3, pants: 3, cos: { hat: 'marinecap', back: 'justice', neck: 'gloves' }, mouth: 'line', marine: true },
  { outfit: 'suit', top: 4, pants: 4, hairS: 'swept', hairC: 2, cos: { face: 'cigar' }, mouth: 'smile' },
  { outfit: 'open', top: 7, pants: 4, hairS: 'messy', hairC: 0, cos: { hat: 'cowboy', neck: 'scarf' }, mouth: 'grin' },
  { outfit: 'vest', top: 9, pants: 1, hairS: 'slick', hairC: 2, cos: { back: 'pinkfur', face: 'redshades' }, mouth: 'grin' },
  { outfit: 'tank', top: 3, pants: 0, hairS: 'buzz', cos: { extra: 'angelw', neck: 'sash' }, mouth: 'smile' },
  { outfit: 'kimono', top: 8, pants: 4, hairS: 'long', hairC: 0, cos: { extra: 'horns', back: 'capBlack' }, mouth: 'teeth', brow: 'angry' },
  { outfit: 'suit', top: 4, pants: 4, cos: { hat: 'tophat', face: 'roundg' }, mouth: 'line' },
  { outfit: 'jacket', top: 10, pants: 2, hairS: 'ponytail', cos: { hat: 'turban', neck: 'scarf' }, mouth: 'smile' },
  { outfit: 'open', top: 0, pants: 1, hairS: 'spiky', hairC: 0, cos: { hat: 'straw' }, mouth: 'grin' },
  { outfit: 'vest', top: 4, pants: 4, hairS: 'mohawk', hairC: 5, cos: { face: 'shades', neck: 'gloves' }, mouth: 'teeth' },
  { outfit: 'jacket', top: 2, pants: 2, hairS: 'afro', cos: { face: 'shades', back: 'longcoat' }, mouth: 'grin' },
  { outfit: 'tee', top: 6, pants: 1, hairS: 'bun', hairC: 3, cos: { hat: 'chef' }, mouth: 'smile' },
];
export function randomLook(r, faction) {
  const pick = a => a[Math.floor(r() * a.length)];
  if (r() < 0.8) { const pool = STYLE_PRESETS.filter(p => !p.marine || faction === 'Marine'); const P = pick(pool); const L = { skin: Math.floor(r() * SKINS.length), hairS: P.hairS || pick(HAIRS.filter(h => h !== 'bald')), hairC: P.hairC ?? Math.floor(r() * HAIRC.length), eye: Math.floor(r() * EYEC.length), mouth: P.mouth || pick(MOUTHS), brow: P.brow || pick(BROWS)[0], outfit: P.outfit, top: (P.top + (r() < 0.3 ? Math.floor(r() * 3) : 0)) % CLOTH.length, pants: P.pants, hat: 'none' };
    const cos = {}; for (const [slot, id] of Object.entries(P.cos)) if (id !== 'none' && COSMETICS[id]) cos[slot] = id; return { look: L, cos }; }
  const L = { skin: Math.floor(r() * SKINS.length), hairS: pick(HAIRS.filter(h => h !== 'bald' || r() < 0.3)), hairC: Math.floor(r() * HAIRC.length), eye: Math.floor(r() * EYEC.length), mouth: pick(MOUTHS), brow: pick(BROWS)[0], outfit: pick(OUTFITS)[0], top: Math.floor(r() * CLOTH.length), pants: Math.floor(r() * CLOTH.length), hat: pick(['none', 'none', 'bandana', 'beanie']) };
  const cos = {}; const ids = Object.keys(COSMETICS); for (let i = 0; i < 2; i++) if (r() < 0.6) { const id = pick(ids); cos[COSMETICS[id].slot] = id; }
  return { look: L, cos };
}
