import { SKINS, HAIRC, EYEC, CLOTH, OUTFITS, HAIR_NAMES, MOUTH_NAMES, BROWS, FREE_HATS } from './style.js';
import { HAIRS, MOUTHS } from './chars.js';
const hex = c => '#' + c.toString(16).padStart(6, '0');
export const ROWS = [
  ['skin', 'Skin', () => SKINS.length, (L) => [SKINS[L.skin][0], SKINS[L.skin][1]]],
  ['hairS', 'Hair', HAIRS, (L) => [HAIR_NAMES[L.hairS]]],
  ['hairC', 'Hair Col', () => HAIRC.length, (L) => [HAIRC[L.hairC][0], HAIRC[L.hairC][1]]],
  ['eye', 'Eyes', () => EYEC.length, (L) => [EYEC[L.eye][0], EYEC[L.eye][1]]],
  ['brow', 'Brows', BROWS.map(b => b[0]), (L) => [BROWS.find(b => b[0] === L.brow)[1]]],
  ['mouth', 'Mouth', MOUTHS, (L) => [MOUTH_NAMES[L.mouth]]],
  ['outfit', 'Outfit', OUTFITS.map(o => o[0]), (L) => [OUTFITS.find(o => o[0] === L.outfit)[1]]],
  ['top', 'Top', () => CLOTH.length, (L) => [CLOTH[L.top][0], CLOTH[L.top][1]]],
  ['pants', 'Pants', () => CLOTH.length, (L) => [CLOTH[L.pants][0], CLOTH[L.pants][1]]],
  ['hat', 'Hat', FREE_HATS, (L) => [L.hat === 'none' ? 'None' : L.hat[0].toUpperCase() + L.hat.slice(1)]],
];
export function rowsHtml(L) { return ROWS.map(([k, lab, , show]) => { const [name, col] = show(L); return `<div class="lrow"><span>${lab}</span><button data-lk="${k}" data-ld="-1">‹</button><b>${col !== undefined ? `<i style="background:${hex(col)}"></i>` : ''}${name}</b><button data-lk="${k}" data-ld="1">›</button></div>`; }).join(''); }
export function stepLook(L, k, d) { const row = ROWS.find(r => r[0] === k); const opts = row[2];
  if (typeof opts === 'function') { const n = opts(); L[k] = ((L[k] || 0) + d + n) % n; }
  else { if (k === 'hat' && !opts.includes(L.hat)) L.hat = 'none'; const i = opts.indexOf(L[k]); L[k] = opts[(i + d + opts.length) % opts.length]; } }
