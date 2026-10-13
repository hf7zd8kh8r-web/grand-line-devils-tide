// v3 characters: one skinned mesh + outline per character, 11 bones, anime-ish proportions,
// real faces (eyes w/ iris+highlight, brows, nose, mouth), hair styles, hats, coats/capes/vests.
import { THREE, Builder, mat, toonMat, OUTLINE_MAT, qv } from './engine.js';
import { buildFace } from './face.js';
const B = THREE;
const box = (w, h, d) => new B.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, s = 10) => new B.CylinderGeometry(rt, rb, h, s);
const sph = (r, w = 12, h = 9) => new B.SphereGeometry(r, w, h);
const cone = (r, h, s = 6) => new B.ConeGeometry(r, h, s);
const disc = (r, s = 12) => new B.CircleGeometry(r, s);
export const SKIN = { light: 0xf6cfa8, tan: 0xd9a274, dark: 0x8d5a3b, fish: 0x5fa8c9, mink: 0xe9c38a, pale: 0xfbe3cf };
const shade = (c, k) => new B.Color(c).multiplyScalar(k).getHex();

export const LOOKS = {
  bandit: { skin: 'tan', shirt: 0x7a4b2a, pants: 0x3b3550, band: 0xb3262a, hair: 0x2a1a10, hairS: 'short', beard: 'stubble', brow: 'angry', mouth: 'grin', vest: 0x4a2e1a },
  thug: { skin: 'tan', shirt: 0x3f6b3a, pants: 0x2d2a26, bald: true, big: 1.2, beard: true, hair: 0x2a1a10, brow: 'angry', mouth: 'frown' },
  marine: { skin: 'light', shirt: 0xf4f4f4, collar: 0x2a5bb8, pants: 0xeeeeee, hat: 'marine', hair: 0x3a2a1a, hairS: 'short', mouth: 'line' },
  higuma: { body: 'brute', skin: 'tan', shirt: 0x5b2d20, pants: 0x2c2c38, band: 0x7a1d18, hair: 0x111111, hairS: 'spiky', beard: 'big', big: 1.1, weapon: 'sabre', brow: 'angry', mouth: 'grin', cape: 0x3a1a12, scar: true },
  morgan: { body: 'brute', skin: 'light', shirt: 0xe9e9e9, cape: 0xffffff, pants: 0x2a3a6a, hair: 0xe8c95a, hairS: 'buzz', jaw: true, big: 1.3, weapon: 'axe', brow: 'angry', mouth: 'frown' },
  makino: { body: 'longleg', skin: 'light', shirt: 0xf3e3b8, pants: 0x5e7f3a, band: 0x3d8b3a, hair: 0x1f5a3a, hairS: 'long', dress: true, brow: 'kind', mouth: 'smile', fem: true },
  mayor: { body: 'fat', skin: 'light', shirt: 0x6b4a8a, pants: 0x3a3a3a, hair: 0xe0e0e0, hairS: 'buzz', beard: 'white', mustache: true, old: true, brow: 'kind', mouth: 'line', hat: 'top', hatC: 0x3a2a4a },
  gen: { skin: 'light', shirt: 0x8a8a8a, pants: 0x3a3a3a, hair: 0x2a1a10 },
  villager: { skin: 'tan', shirt: 0x4a7fb8, pants: 0x6b5a3a, hair: 0x5a3a1a, hairS: 'short', mouth: 'smile' },
  smith: { body: 'brute', skin: 'dark', shirt: 0x6a6a6a, pants: 0x3a2a1a, band: 0x222222, hair: 0x111111, hairS: 'buzz', big: 1.15, apron: 0x5a3a1a, mustache: true },
  coby: { body: 'lanky', skin: 'light', shirt: 0xf4f4f4, collar: 0x2a5bb8, pants: 0xeeeeee, hat: 'marine', hair: 0xe07ab8, hairS: 'short', glasses: 'round', mouth: 'smile', brow: 'kind' },
  rika: { body: 'kid', skin: 'light', shirt: 0xf27aa0, pants: 0x6a3a2a, hair: 0x6a3a1a, hairS: 'pigtails', dress: true, small: true, mouth: 'smile', fem: true },
  player_pirate: { skin: 'light', shirt: 0xc8202a, pants: 0x2a4a8a, hair: 0x111111, hairS: 'spiky', hat: 'straw', open: true, mouth: 'grin' },
  player_marine: { skin: 'light', shirt: 0xf4f4f4, collar: 0x2a5bb8, pants: 0x2a3a6a, cape: 0xffffff, hair: 0x3a2a1a, hairS: 'short', hat: 'marine', mouth: 'smile' },
};
export const HAIRS = ['spiky', 'wild', 'pompadour', 'short', 'messy', 'slick', 'long', 'ponytail', 'bun', 'pigtails', 'afro', 'mohawk', 'buzz', 'swept', 'bald'];
export const HATS = ['none', 'straw', 'marine', 'bandana', 'tricorn', 'top', 'beanie', 'cowboy', 'chef', 'crown', 'turban', 'horned'];
export const MOUTHS = ['smile', 'grin', 'line', 'frown', 'teeth'];

// One Piece-style exaggerated body archetypes. leg/torso/arm = length scales, chest/waist = width (x), *D = depth (z), *W = limb thickness, head = head scale.
export const BODIES = {
  standard: { leg: 1, torso: 1, arm: 1, chest: 1.08, waist: 0.92, armW: 1, legW: 1, head: 1.06 },
  lanky:    { leg: 1.2, torso: 1.12, arm: 1.16, chest: 0.9, waist: 0.74, armW: 0.78, legW: 0.76, head: 0.98 },
  longleg:  { leg: 1.32, torso: 0.98, arm: 1.12, chest: 1.12, waist: 0.78, armW: 0.9, legW: 0.84, head: 0.94 },
  stocky:   { leg: 0.78, torso: 0.94, arm: 0.92, chest: 1.3, waist: 1.12, armW: 1.3, legW: 1.3, head: 1.12 },
  brute:    { leg: 0.86, torso: 1.16, arm: 1.14, chest: 1.75, waist: 0.95, chestD: 1.45, waistD: 0.95, armW: 1.75, legW: 1.2, head: 0.86 },
  fat:      { leg: 0.74, torso: 1.06, arm: 0.95, chest: 1.38, waist: 1.55, chestD: 1.35, waistD: 1.5, belly: 0.35, armW: 1.35, legW: 1.4, head: 1.02 },
  kid:      { leg: 0.7, torso: 0.8, arm: 0.8, chest: 0.86, waist: 0.84, armW: 0.85, legW: 0.88, head: 1.25 },
};
const OT = 0.021; // bolder ink outlines
const hashS = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0) / 4294967296; };
export function bodyOf(L, lookId) {
  let id = L.body;
  if (!id) { const r = hashS(lookId + ':' + (L.seed ?? '') + ':' + (L.shirt ?? '') + ':' + (L.hair ?? '') + ':' + (L.hairS ?? '') + (L.pants ?? ''));
    if (L.player || /^player_/.test(lookId)) id = 'standard';
    else if (lookId === 'thug' || (L.big || 1) >= 1.2) id = 'brute';
    else if (L.small) id = 'kid';
    else if (lookId === 'villager' || lookId === 'gen') id = ['standard', 'lanky', 'stocky', 'fat', 'longleg', 'brute', 'standard', 'lanky'][Math.floor(r * 8)];
    else id = ['standard', 'lanky', 'stocky', 'longleg', 'brute'][Math.floor(r * 5)]; }
  return { id, ...(BODIES[id] || BODIES.standard) };
}
export function makeChar(lookId, overrides = {}) {
  const L = { ...(LOOKS[lookId] || LOOKS.villager), ...overrides };
  if (L.cap && !L.hat) L.hat = L.cap; // legacy key
  if (L.bald) L.hairS = 'bald';
  if (!L.hairS) L.hairS = L.dress ? 'long' : 'short';
  const sk = typeof L.skin === 'number' ? L.skin : SKIN[L.skin || 'light'];
  const g = L.big || 1, sm = L.small ? 0.86 : 1;
  const b = new Builder(true);
  const W = 0.2 * g;              // half shoulder width
  const hipY = 0.95, kneeY = 0.5, shY = 1.47, elY = shY - 0.36;
  const hr = 0.185 * (L.big ? 1.02 : 1), hy = shY + 0.25;
  // ---- body archetype: parts are authored on the standard rig, then remapped per bone (legs/torso/arms/head) ----
  const P = bodyOf(L, lookId), AX0 = W + 0.07 * g;
  const hipN = hipY * P.leg, shN = hipN + (shY - hipY) * P.torso, hyN = shN + (hy - shY) * P.head;
  const _v = new B.Vector3(), _n = new B.Vector3();
  const deform = (geo, m, bone) => {
    if (m) geo.applyMatrix4(m); const pos = geo.attributes.position, nor = geo.attributes.normal; geo.computeBoundingBox(); const bb = geo.boundingBox, cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
    const isArm = bone === 3 || bone === 4 || bone === 7 || bone === 8, sideA = bone === 3 || bone === 7 ? -1 : 1, sideL = bone === 5 || bone === 9 ? -1 : 1;
    const thin = isArm && (Math.abs(cx - sideA * AX0) > 0.12 || Math.abs(cz) > 0.12 || bb.max.z - bb.min.z > 0.3); // weapons/props held in the hand: move, don't fatten
    for (let i = 0; i < pos.count; i++) { _v.fromBufferAttribute(pos, i); let sx = 1, sz = 1;
      if (bone === 2) { sx = sz = P.head; _v.set(_v.x * P.head, hyN + (_v.y - hy) * P.head, _v.z * P.head); }
      else if (bone === 5 || bone === 6 || bone === 9 || bone === 10) { const c0 = sideL * 0.1 * g; sx = sz = P.legW; _v.x = c0 * P.waist + (_v.x - c0) * P.legW; _v.z *= P.legW; _v.y *= P.leg; }
      else if (isArm) { const c0 = sideA * AX0; if (!thin) { sx = sz = P.armW; _v.x = c0 + (_v.x - c0) * P.armW; _v.z *= P.armW; } _v.x += c0 * (P.chest - 1) * 0.82; _v.y = shN + (_v.y - shY) * P.arm; }
      else { const t = Math.min(1, Math.max(0, (_v.y - hipY) / (shY - hipY))), te = bone === 0 ? 0 : Math.pow(t, 0.8); sx = P.waist + (P.chest - P.waist) * te; sz = (P.waistD || P.waist) + ((P.chestD || P.chest) - (P.waistD || P.waist)) * te;
        if (P.belly && _v.z > 0) sz *= 1 + P.belly * Math.sin(Math.PI * Math.min(1, Math.max(0, (_v.y - hipY + 0.15) / 0.55)));
        _v.x *= sx; _v.z *= sz; _v.y = bone === 0 ? hipN + (_v.y - hipY) : hipN + (_v.y - hipY) * P.torso; }
      pos.setXYZ(i, _v.x, _v.y, _v.z); if (nor) { _n.fromBufferAttribute(nor, i); _n.set(_n.x / sx, _n.y, _n.z / sz).normalize(); nor.setXYZ(i, _n.x, _n.y, _n.z); } }
    pos.needsUpdate = true; return geo; };
  const A = (geo, col, m, bone, o = {}) => b.add(deform(geo.index ? geo : geo, m, bone), col, null, { bone, ot: OT, ...o, ...(o.ot ? { ot: o.ot * 1.25 } : {}) });
  const F = (geo, col, m) => b.add(deform(geo, m, 2), col, null, { bone: 2, outline: false });
  const top = L.coat || L.shirt;
  // ---------- legs: thigh (5/6) + shin (9/10) ----------
  const sandal = L.sandals ?? (!L.boots && !L.shoes && !L.armor && (lookId === 'player_pirate' || ((lookId === 'villager' || lookId === 'bandit') && hashS(lookId + (L.shirt ?? '') + (L.seed ?? '')) < 0.45)));
  for (const [s, th, sh] of [[-1, 5, 9], [1, 6, 10]]) {
    const x = s * 0.1 * g;
    A(cyl(0.095 * g, 0.075 * g, 0.47), L.pants, mat(x, (hipY + kneeY) / 2, 0), th, { grad: 0.2 });
    A(sph(0.074 * g, 8, 6), L.pants, mat(x, kneeY, 0), sh, { outline: false });
    A(cyl(0.074 * g, 0.058 * g, 0.42), L.boots || L.pants, mat(x, kneeY - 0.22, 0), sh, { grad: 0.25 });
    if (sandal) { A(sph(0.08, 10, 7), sk, mat(x, 0.06, 0.05, 0, 0, 0, 0.95 * g, 0.6, 1.55), sh); A(box(0.15 * g, 0.03, 0.27), L.sole || 0x5a3a1e, mat(x, 0.015, 0.05), sh, { ot: 0.008 }); A(box(0.15 * g, 0.025, 0.035), L.strap || 0x7a4a22, mat(x, 0.075, 0.09, -0.35), sh, { outline: false }); }
    else A(sph(0.085, 10, 7), L.shoes || 0x2a1d14, mat(x, 0.055, 0.045, 0, 0, 0, 0.95 * g, 0.62, 1.55), sh);
  }
  // ---------- hips / torso ----------
  A(cyl(W * 0.86, W * 0.8, 0.2, 12), L.pants, mat(0, hipY + 0.04, 0, 0, 0, 0, 1, 1, 0.66), 0);
  A(cyl(W * 0.9, W * 0.9, 0.06, 12), L.belt || 0x3a2614, mat(0, hipY + 0.13, 0, 0, 0, 0, 1, 1, 0.68), 0, { outline: false });
  if (L.sash) A(cyl(W * 0.92, W * 0.92, 0.1, 12), L.sash, mat(0, hipY + 0.12, 0, 0, 0, 0, 1, 1, 0.7), 0);
  if (L.dress) A(cyl(W * 0.85, W * 1.35, 0.6, 12), L.pants, mat(0, hipY - 0.2, 0, 0, 0, 0, 1, 1, 0.8), 0, { grad: 0.2 });
  const chestC = L.open ? sk : L.shirt;
  A(cyl(W * 1.0, W * 0.78, 0.36, 12), chestC, mat(0, shY - 0.2, 0, 0, 0, 0, 1, 1, 0.6), 1, { grad: 0.15 });
  A(cyl(W * 0.78, W * 0.84, 0.22, 12), chestC, mat(0, hipY + 0.24, 0, 0, 0, 0, 1, 1, 0.64), 1);
  if (L.fem) A(sph(W * 0.42, 8, 6), chestC, mat(0, shY - 0.2, W * 0.42, 0, 0, 0, 1.6, 0.8, 0.6), 1, { outline: false });
  if (L.open) { // open vest / shirt: shell with a gap in front
    const gap = 0.75; A(new B.CylinderGeometry(W * 1.05, W * 0.84, 0.58, 14, 1, false, gap / 2, Math.PI * 2 - gap), L.shirt, mat(0, shY - 0.29, 0, 0, 0, 0, 1, 1, 0.64), 1, { ot: 0.01 });
    A(box(0.02, 0.18, 0.01), shade(sk, 0.8), mat(0, shY - 0.3, W * 0.5), 1, { outline: false });
  }
  if (L.vest) { const gap = 0.9; A(new B.CylinderGeometry(W * 1.06, W * 0.86, 0.52, 14, 1, false, gap / 2, Math.PI * 2 - gap), L.vest, mat(0, shY - 0.27, 0, 0, 0, 0, 1, 1, 0.66), 1, { ot: 0.01 }); }
  if (L.apron) A(box(W * 1.4, 0.7, 0.03), L.apron, mat(0, hipY + 0.05, W * 0.62), 1);
  if (L.stripes) for (let i = -2; i <= 2; i++) A(box(0.012, 0.56, 0.01), shade(L.shirt, 0.6), mat(i * W * 0.32, shY - 0.29, W * 0.6), 1, { outline: false });
  if (L.collar) A(cyl(W * 0.8, W * 0.95, 0.08, 12), L.collar, mat(0, shY - 0.02, 0, 0, 0, 0, 1, 1, 0.66), 1);
  if (L.tie) A(box(0.05, 0.22, 0.02), L.tie, mat(0, shY - 0.17, W * 0.6), 1, { outline: false });
  if (L.armor) { A(box(W * 1.7, 0.36, W * 1.25), L.armor, mat(0, shY - 0.2, 0), 1, { grad: 0.3 }); for (const s of [-1, 1]) A(sph(0.13 * g, 10, 7), L.armor, mat(s * (W + 0.05), shY, 0, 0, 0, 0, 1, 0.7, 1), 1); }
  // coat (with sleeves + tails) or cape (draped over shoulders, Marine "Justice" style)
  if (L.coat) {
    const gap = 0.6; A(new B.CylinderGeometry(W * 1.12, W * 0.95, 0.6, 14, 1, false, gap / 2, Math.PI * 2 - gap), L.coat, mat(0, shY - 0.29, 0, 0, 0, 0, 1, 1, 0.7), 1, { ot: 0.012 });
    A(box(W * 1.9, 0.5, 0.04), L.coat, mat(0, hipY - 0.2, -W * 0.68, -0.08), 0, { grad: 0.25 });
    for (const s of [-1, 1]) A(box(0.04, 0.5, W * 0.95), L.coat, mat(s * W * 0.98, hipY - 0.2, -W * 0.15, 0, 0, s * 0.08), 0, { grad: 0.25 });
    A(box(W * 2.0, 0.12, 0.04), L.coat, mat(0, shY + 0.04, -W * 0.58, -0.3), 1); // popped collar
  }
  // ---- v6 boss/iconic detail parts ----
  if (L.epaulets) for (const sd of [-1, 1]) { A(cyl(0.11 * g, 0.12 * g, 0.05, 10), L.epaulets, mat(sd * (W + 0.03), shY + 0.03, 0, 0, 0, sd * 0.25, 1, 1, 0.8), 1, { ot: 0.008 }); for (let i = 0; i < 6; i++) A(cyl(0.008, 0.008, 0.09, 4), L.epaulets, mat(sd * (W + 0.03) + Math.cos(i / 6 * 6.28) * 0.1 * g, shY - 0.03, Math.sin(i / 6 * 6.28) * 0.08, 0, 0, sd * 0.25), 1, { outline: false }); }
  if (L.collarUp) { const cc = L.collarUp === true ? (L.coat || L.cape || 0x1a1a1a) : L.collarUp; for (let i = 0; i < 9; i++) { const a2 = Math.PI * 0.3 + i / 8 * Math.PI * 1.4; const rr2 = hr * 1.12; A(box(hr * 0.5, 0.26, 0.025), cc, mat(Math.sin(a2) * rr2, shY + 0.13, Math.cos(a2) * rr2 - 0.02, 0, a2, 0), 1, { ot: 0.006 }); } }
  if (L.longCoat) { const lc = L.longCoat === true ? (L.coat || 0x1a1a1a) : L.longCoat; for (const sd of [-1, 1]) A(box(W * 0.9, 0.62, 0.04), lc, mat(sd * W * 0.55, hipY - 0.5, -W * 0.62, -0.06, 0, sd * 0.05), 0, { grad: 0.3 }); A(box(W * 1.9, 0.62, 0.04), lc, mat(0, hipY - 0.5, -W * 0.7, -0.08), 0, { grad: 0.3 }); }
  if (L.rope) { for (let i = 0; i < 10; i++) { const a2 = i / 10 * 6.283; A(sph(0.045, 6, 4), L.rope === true ? 0xe8d8a0 : L.rope, mat(Math.cos(a2) * W * 0.95, hipY + 0.14 + (i % 2) * 0.02, Math.sin(a2) * W * 0.68), 0, { outline: false }); } A(box(0.08, 0.22, 0.03), 0xe8d8a0, mat(-W * 0.4, hipY - 0.02, W * 0.7), 0, { outline: false }); }
  if (L.gourd) { A(sph(0.11, 10, 8), 0xc89a4a, mat(W * 0.9, hipY - 0.05, -0.08), 0, { ot: 0.008 }); A(sph(0.075, 10, 8), 0xc89a4a, mat(W * 0.9, hipY + 0.1, -0.08), 0, { ot: 0.008 }); A(cyl(0.02, 0.02, 0.05, 6), 0xb02020, mat(W * 0.9, hipY + 0.19, -0.08), 0, { outline: false }); }
  if (L.spikes) for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) A(cone(0.025, 0.09, 5), 0xd8d8d8, mat(sd * (W + 0.02), shY + 0.04 - i * 0.03, 0.04 - i * 0.05, 0, 0, -sd * 1.1), 1, { outline: false });
  if (L.necklace) for (let i = 0; i < 9; i++) { const a2 = (i / 8 - 0.5) * 2.2; A(sph(0.025, 6, 4), L.necklace, mat(Math.sin(a2) * W * 0.6, shY - 0.06 - Math.cos(a2) * 0.06, W * 0.62 * Math.cos(a2 * 0.5)), 1, { outline: false }); }
  if (L.rose) A(sph(0.04, 8, 6), L.rose, mat(-W * 0.5, shY - 0.08, W * 0.7), 1, { outline: false });
  if (L.earrings) for (const sd of [-1, 1]) A(new B.TorusGeometry(0.025, 0.006, 4, 10), L.earrings, mat(sd * hr * 0.98, hy - 0.08, 0, 0, Math.PI / 2), 2, { outline: false });
  if (L.cape) {
    A(box(W * 2.5, 1.0, 0.04), L.cape, mat(0, shY - 0.45, -W * 0.8, 0.06), 1, { grad: 0.2 });
    for (const s of [-1, 1]) { A(box(0.04, 0.95, W * 0.9), L.cape, mat(s * W * 1.28, shY - 0.43, -W * 0.38, 0, 0, s * 0.06), 1, { grad: 0.2 }); A(sph(0.1 * g, 10, 6), L.cape, mat(s * (W + 0.04), shY + 0.01, -0.01, 0, 0, 0, 1.2, 0.6, 1.1), 1); }
    if (L.capeTxt !== false && (L.cape === 0xffffff)) { const ez = -W * 0.83 - 0.025, ey = shY - 0.36, ec = L.capeEmblem || 0x2a4a9a; // original Tide Watch emblem: wave-ring + anchor bar + star (not the canon kanji)
      A(new B.TorusGeometry(0.11, 0.018, 5, 18), ec, mat(0, ey, ez), 1, { outline: false }); A(box(0.022, 0.2, 0.012), ec, mat(0, ey, ez - 0.004), 1, { outline: false }); A(box(0.14, 0.022, 0.012), ec, mat(0, ey + 0.06, ez - 0.004), 1, { outline: false });
      A(new B.TorusGeometry(0.06, 0.016, 4, 10, Math.PI), ec, mat(0, ey - 0.06, ez - 0.004, 0, 0, Math.PI), 1, { outline: false }); A(box(W * 1.3, 0.05, 0.01), ec, mat(0, shY - 0.12, ez), 1, { outline: false }); }
  }
  if (L.fur) { for (const s of [-1, 1]) for (let i = 0; i < 3; i++) A(sph(0.12 * g, 8, 6), L.fur, mat(s * (W * 0.5 + i * 0.09), shY + 0.02 - i * 0.03, -0.03 - i * 0.02), 1, { ot: 0.01 }); A(sph(0.2 * g, 8, 6), L.fur, mat(0, shY - 0.02, -W * 0.7, 0, 0, 0, 1.5, 0.6, 0.6), 1, { ot: 0.01 }); }
  if (L.feathers) { const fc = L.feathers; for (let i = 0; i < 16; i++) { const a = Math.PI * 0.35 + i / 15 * Math.PI * 1.3; const r2 = W * 1.35; A(sph(0.13 * g, 7, 5), i % 2 ? shade(fc, 0.85) : fc, mat(Math.sin(a) * r2, shY - 0.02 + (i % 3) * 0.03, Math.cos(a) * r2 * 0.85 - 0.02, 0, 0, 0, 1, 0.85, 1), 1, { ot: 0.01 }); }
    for (let r3 = 0; r3 < 3; r3++) for (let i = 0; i < 6; i++) A(sph(0.12 * g, 7, 5), (i + r3) % 2 ? shade(fc, 0.85) : fc, mat((i - 2.5) * W * 0.42, shY - 0.3 - r3 * 0.3, -W * 0.9 - 0.04, 0, 0, 0, 1, 1.2, 0.7), 1, { ot: 0.01 }); }
  if (L.scarf) A(cyl(W * 0.7, W * 0.85, 0.22, 12), L.scarf === true ? 0x6a1a2a : L.scarf, mat(0, shY + 0.06, 0.01, 0, 0, 0, 1, 1, 0.9), 1);
  if (L.wings) for (const s of [-1, 1]) { const wc = L.wingC || 0xffffff, rx = s * 0.12, ry = shY - 0.06, rz = -W * 0.72; // feathered Skypiean wings fanning out past the shoulders
    for (let i = 0; i < 5; i++) { const a = 0.95 - i * 0.32, len = 0.62 - i * 0.07; const dx = Math.cos(a) * s, dy = Math.sin(a); A(box(len, 0.11, 0.03), i % 2 ? shade(wc, 0.92) : wc, mat(rx + dx * len * 0.5, ry + dy * len * 0.5, rz - 0.03 - i * 0.012, 0, s * 0.35, s * a), 1, { ot: 0.008 }); }
    A(sph(0.07, 8, 6), wc, mat(rx, ry, rz - 0.02), 1, { outline: false }); }
  if (L.drums) for (let i = 0; i < 6; i++) { const a = (i / 5 - 0.5) * 2.6; A(cyl(0.08, 0.08, 0.07, 8), 0xe0b040, mat(Math.sin(a) * 0.42, hipY + 0.55 + Math.cos(a) * 0.42, -0.24, Math.PI / 2), 1); }
  if (L.pigeon) { A(sph(0.07, 8, 6), 0xffffff, mat(-W - 0.04, shY + 0.1, 0, 0, 0, 0, 1, 0.9, 1.3), 1); A(sph(0.04, 8, 6), 0xffffff, mat(-W - 0.04, shY + 0.18, 0.06), 1); A(cone(0.012, 0.03, 4), 0xe0a030, mat(-W - 0.04, shY + 0.18, 0.11, Math.PI / 2), 1, { outline: false }); }
  // ---------- arms: upper (3/4) + forearm (7/8) ----------
  const AX = W + 0.07 * g;
  for (const [s, up, fo] of [[-1, 3, 7], [1, 4, 8]]) {
    const ax = s * AX; const sl = L.coat || L.longSleeve ? top : (L.open || L.sleeveless ? (L.open ? L.shirt : sk) : L.shirt);
    A(sph(0.075 * g, 10, 7), L.open ? L.shirt : (L.coat || L.shirt), mat(ax, shY - 0.03, 0), up, { outline: !L.cape });
    A(cyl(0.068 * g, 0.056 * g, 0.34), L.sleeveless ? sk : sl, mat(ax, shY - 0.19, 0), up);
    A(sph(0.056 * g, 8, 6), L.coat || L.longSleeve ? top : sk, mat(ax, elY, 0), fo, { outline: false });
    A(cyl(0.055 * g, 0.046 * g, 0.3), L.coat || L.longSleeve ? top : sk, mat(ax, elY - 0.16, 0), fo);
    if (L.coat || L.longSleeve) A(cyl(0.06 * g, 0.06 * g, 0.05), shade(top, 0.8), mat(ax, elY - 0.29, 0), fo, { outline: false });
    if (L.gloves) A(cyl(0.052 * g, 0.05 * g, 0.12), L.gloves, mat(ax, elY - 0.25, 0), fo, { outline: false });
    // hand: palm + thumb
    A(sph(0.06 * g, 10, 7), L.gloves || sk, mat(ax, elY - 0.36, 0.01, 0, 0, 0, 0.85, 1.05, 1.05), fo);
    A(sph(0.025 * g, 6, 5), L.gloves || sk, mat(ax - s * 0.035, elY - 0.33, 0.05), fo, { outline: false });
  }
  const HX = AX, HY = elY - 0.37;
  if (L.weapon === 'sabre' || L.weapon === 'katana') { A(box(0.02, 0.06, 0.95), 0xdfe4ea, mat(HX, HY, 0.58), 8, { ot: 0.01 }); A(cyl(0.06, 0.06, 0.02, 10), 0xc9a23a, mat(HX, HY, 0.1, Math.PI / 2), 8, { outline: false }); A(cyl(0.02, 0.02, 0.18, 6), 0x2a1a2a, mat(HX, HY, 0.0, Math.PI / 2), 8); }
  if (L.weapon === 'axe') { A(cyl(0.05, 0.05, 0.55), 0x6a4a2a, mat(HX, HY - 0.1, 0.0), 8); A(box(0.05, 0.6, 0.55), 0xaab2bc, mat(HX + 0.02, HY - 0.2, 0.25), 8, { grad: 0.3 }); }
  if (L.weapon === 'claws') for (const [s, bo] of [[1, 8], [-1, 7]]) for (let i = -1; i <= 1; i++) A(box(0.015, 0.015, 0.5), 0xdddddd, mat(s * HX + i * 0.035, HY, 0.28), bo, { ot: 0.006 });
  if (L.weapon === 'jitte') { A(cyl(0.035, 0.035, 1.25, 8), 0x3a3a3a, mat(HX, HY, 0.55, Math.PI / 2), 8); A(sph(0.07, 8, 6), 0x5a5a6a, mat(HX, HY, 1.2), 8); }
  if (L.weapon === 'club') A(cyl(0.08, 0.15, 1.7, 8), 0x2a2a2a, mat(HX, HY, 0.8, Math.PI / 2), 8);
  if (L.weapon === 'kanabo') { // Hassaikai: long octagonal iron club with studs, rope-wrapped grip; held angled down-forward
    const RX = Math.PI * 0.72, dy = Math.cos(RX), dz = Math.sin(RX); const P = t => [HX, HY + dy * t, dz * t]; const vy = dz, vz = -dy; // perpendicular in y-z plane
    const at = (t, rz = 0) => { const [x, y, z] = P(t); return [x, y, z]; };
    { const [x, y, z] = at(0.02); A(cyl(0.032, 0.032, 0.42, 8), 0x5a2a1a, mat(x, y, z, RX), 8, { ot: 0.006 }); }
    for (let i = 0; i < 4; i++) { const [x, y, z] = at(-0.14 + i * 0.1); A(new B.TorusGeometry(0.036, 0.008, 4, 10), 0xc9a23a, mat(x, y, z, RX - Math.PI / 2), 8, { outline: false }); }
    { const [x, y, z] = at(0.26); A(cyl(0.075, 0.075, 0.05, 8), 0xc9a23a, mat(x, y, z, RX), 8, { ot: 0.006 }); }
    { const [x, y, z] = at(1.05); A(cyl(0.07, 0.135, 1.55, 8), 0x2a2a30, mat(x, y, z, RX), 8, { ot: 0.01, grad: 0.3 }); }
    { const [x, y, z] = at(1.83); A(cyl(0.14, 0.14, 0.06, 8), 0xc9a23a, mat(x, y, z, RX), 8, { ot: 0.006 }); }
    for (let j = 0; j < 6; j++) { const t = 0.48 + j * 0.24, r = 0.075 + (t - 0.28) / 1.55 * 0.06; const [x, y, z] = at(t); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + (j % 2) * Math.PI / 8; const ox = Math.cos(a) * (r + 0.025), ov = Math.sin(a) * (r + 0.025);
      A(sph(0.026, 5, 4), 0x9a9aa2, mat(x + ox, y + vy * ov, z + vz * ov), 8, { outline: false }); } } }
  if (L.weapon === 'knives') for (const [sx, bo] of [[1, 8], [-1, 7]]) for (let i = -1; i <= 1; i++) { A(box(0.012, 0.03, 0.28), 0xe8ecf0, mat(sx * HX + i * 0.035, HY + 0.02, 0.2), bo, { ot: 0.005 }); A(box(0.02, 0.025, 0.06), 0xc02020, mat(sx * HX + i * 0.035, HY + 0.02, 0.04), bo, { outline: false }); }
  if (L.weapon === 'spear') { A(cyl(0.035, 0.035, 2.2, 8), 0x8a6a3a, mat(HX, HY, 0.7, Math.PI / 2), 8); A(cone(0.09, 0.4, 4), 0xd8d8e0, mat(HX, HY, 1.95, Math.PI / 2), 8, { ot: 0.008 }); A(new B.TorusGeometry(0.1, 0.02, 4, 10), 0xd0a030, mat(HX, HY, 1.72), 8, { outline: false }); }
  if (L.weapon === 'kiribachi') { A(cyl(0.03, 0.03, 0.3, 6), 0x3a2a1a, mat(HX, HY, 0.05, Math.PI / 2), 8); A(box(0.03, 0.16, 1.3), 0xb8c0c8, mat(HX, HY + 0.02, 0.85), 8, { ot: 0.008 }); for (let i = 0; i < 9; i++) A(cone(0.03, 0.09, 3), 0xd8dde2, mat(HX, HY + 0.12, 0.3 + i * 0.13, 0, 0, 0), 8, { outline: false }); }
  if (L.weapon === 'staff') { A(cyl(0.03, 0.03, 1.9, 8), 0xe0b040, mat(HX, HY, 0.5, Math.PI / 2), 8, { ot: 0.006 }); A(sph(0.07, 8, 6), 0xffe070, mat(HX, HY, 1.45), 8, { outline: false }); }
  if (L.weapon === 'scissors') for (const sx of [-1, 1]) { A(box(0.04, 0.09, 1.4), 0xb0b0c0, mat(HX + sx * 0.05, HY, 0.8, 0, sx * 0.12, 0), 8, { ot: 0.008 }); A(new B.TorusGeometry(0.1, 0.025, 5, 10), 0x6a3a8a, mat(HX + sx * 0.06, HY, 0.02), 8, { outline: false }); }
  if (L.weapon === 'scimitars') for (const [sx, bo] of [[1, 8], [-1, 7]]) { A(cyl(0.03, 0.03, 0.22, 6), 0x3a2a1a, mat(sx * HX, HY, 0.05, Math.PI / 2), bo); A(box(0.03, 0.14, 1.1), 0xd0d8e0, mat(sx * HX, HY + 0.05, 0.72, -0.12, 0, 0), bo, { ot: 0.008 }); }
  if (L.weapon === 'mogura') { A(cyl(0.035, 0.035, 1.9, 8), 0x3a2a3a, mat(HX, HY, 0.6, Math.PI / 2), 8); A(new B.TorusGeometry(0.16, 0.05, 6, 12), 0x5a3a2a, mat(HX, HY, 1.55, 0, Math.PI / 2, 0), 8, { ot: 0.008 }); for (let i = -1; i <= 1; i++) A(cone(0.035, 0.28, 4), 0xd8d8e0, mat(HX + i * 0.1, HY, 1.75, Math.PI / 2), 8, { ot: 0.006 }); }
  if (L.weapon === 'lightsword') { A(cyl(0.03, 0.03, 0.22, 6), 0xd0a030, mat(HX, HY, 0.0, Math.PI / 2), 8); A(box(0.04, 0.07, 1.2), 0xfff6a0, mat(HX, HY, 0.72), 8, { outline: false }); }
  if (L.weapon === 'trident') { A(cyl(0.025, 0.025, 1.5, 6), 0xc9a23a, mat(HX, HY, 0.5, Math.PI / 2), 8); for (let i = -1; i <= 1; i++) A(cone(0.03, 0.18, 4), 0xdddddd, mat(HX + i * 0.06, HY, 1.3, Math.PI / 2), 8); }
  if (L.hook) A(new B.TorusGeometry(0.09, 0.02, 5, 10, Math.PI * 1.4), 0xe0c040, mat(-HX, HY - 0.06, 0.04, 0, Math.PI / 2, 0), 7, { ot: 0.008 });
  // ---------- head (2) ----------
  A(cyl(0.06 * g, 0.07 * g, 0.14), sk, mat(0, shY + 0.06, 0), 2, { outline: false });
  A(sph(hr, 16, 12), sk, mat(0, hy, 0, 0, 0, 0, 1, 1.04, 0.98), 2, { ot: 0.012 });
  A(sph(hr * 0.72, 10, 7), sk, mat(0, hy - hr * 0.42, hr * 0.18, 0, 0, 0, L.jawW || 1, 0.8, 0.9), 2, { outline: false }); // chin/jaw
  for (const s of [-1, 1]) A(sph(0.04, 8, 6), sk, mat(s * hr * 0.98, hy - 0.01, -0.01, 0, 0, 0, 0.5, 1, 0.8), 2, { outline: false }); // ears
  if (L.earlobes) for (const s of [-1, 1]) A(cyl(0.03, 0.04, 0.22, 6), sk, mat(s * hr * 0.98, hy - 0.15, 0), 2, { outline: false });
  // face — helper places a flat part on the head surface facing outward
  const on = (geo, col, x, y, dz = 0, rz = 0, sx = 1, sy = 1) => { const zz = Math.sqrt(Math.max(0.001, hr * hr - x * x - (y - hy) * (y - hy))) * 0.98 + 0.004 + dz; F(geo, col, mat(x, y, zz, -Math.asin((y - hy) / hr) * 0.9, Math.atan2(x, zz), rz, sx, sy, 1)); };
  const eyeC = L.eye || 0x2a1a10, ey = hy + 0.005, ex = 0.068; const FACE = !L.bakedFace;
  for (const s of [-1, 1]) {
    if (L.glasses === 'shades' || FACE) continue;
    on(disc(0.044, 14), 0xffffff, s * ex, ey, 0, 0, 0.85, 1.15);
    on(disc(0.03, 12), eyeC, s * (ex - 0.004), ey - 0.006, 0.002, 0, 0.9, 1.15);
    on(disc(0.017, 10), 0x0a0a0a, s * (ex - 0.004), ey - 0.008, 0.004);
    on(disc(0.009, 8), 0xffffff, s * (ex - 0.016), ey + 0.012, 0.006);
    on(box(0.06, 0.008, 0.002), 0x1a120c, s * ex, ey + 0.045, 0.002, s * 0.12); // upper lash line
    const br = L.brow === 'angry' ? 0.38 : L.brow === 'kind' ? -0.2 : L.brow === 'sad' ? -0.35 : -0.05;
    on(box(0.075, L.thickBrow ? 0.03 : 0.018, 0.004), L.hair && L.hairS !== 'bald' ? shade(L.hair, 0.8) : 0x2a1a10, s * ex, ey + 0.075, 0.004, s * br);
  }
  if (L.scar) on(box(0.04, 0.008, 0.003), 0x8a3a2a, -0.075, ey - 0.05, 0.003, 0.3);
  if (L.scar === 'bar') { on(box(0.3, 0.014, 0.003), 0x8a3a2a, 0, ey - 0.035, 0.006, 0.08); for (let i = -3; i <= 3; i++) on(box(0.006, 0.035, 0.003), 0x8a3a2a, i * 0.04, ey - 0.033 - i * 0.003, 0.007); }
  if (L.scar === 'x') { on(box(0.16, 0.012, 0.003), 0x8a3a2a, 0, ey - 0.02, 0.006, 0.5); }
  if (!L.saw && !L.clown) A(cone(0.018, 0.045, 5), shade(sk, 0.92), mat(0, hy - 0.035, hr * 0.98 + 0.012, Math.PI / 2), 2, { outline: false });
  const my = hy - 0.095, mo = FACE ? 'none' : (L.mouth || 'smile');
  if (mo === 'smile') on(new B.TorusGeometry(0.035, 0.007, 4, 10, Math.PI), 0x5a1e1a, 0, my + 0.012, 0, Math.PI);
  if (mo === 'grin') { on(new B.CircleGeometry(0.05, 12, Math.PI, Math.PI), 0x4a1010, 0, my + 0.012); on(box(0.085, 0.016, 0.002), 0xffffff, 0, my + 0.004, 0.004); }
  if (mo === 'teeth') { on(box(0.11, 0.035, 0.002), 0xffffff, 0, my, 0); for (let i = -2; i <= 2; i++) on(box(0.003, 0.035, 0.002), 0x555555, i * 0.022, my, 0.003); }
  if (mo === 'line') on(box(0.05, 0.008, 0.002), 0x5a1e1a, 0, my, 0);
  if (mo === 'frown') on(new B.TorusGeometry(0.03, 0.007, 4, 10, Math.PI), 0x5a1e1a, 0, my - 0.012, 0);
  if (L.blush) for (const s of [-1, 1]) on(disc(0.022, 10), 0xf08a8a, s * 0.095, ey - 0.045, 0.001, 0, 1.3, 0.7);
  if (L.mustache) for (const s of [-1, 1]) A(box(0.09, 0.025, 0.03), L.beard === 'white' ? 0xeeeeee : (L.hair || 0x222222), mat(s * 0.045, hy - 0.07, hr * 0.92, 0, 0, s * -0.35), 2, { ot: 0.006 });
  if (L.glasses === true || L.glasses === 'round') for (const s of [-1, 1]) on(new B.TorusGeometry(0.042, 0.007, 4, 12), 0x222222, s * ex, ey, 0.008);
  if (L.glasses === 'shades') { A(box(0.24, 0.06, 0.03), L.shadeC || 0x111111, mat(0, ey + 0.005, hr * 0.92), 2, { ot: 0.006 }); }
  if (L.beard) { const bc = L.beard === 'white' ? 0xeeeeee : L.hair || 0x2a1a10; const bs = L.beard === 'big' ? 1.4 : L.beard === 'stubble' ? 0.8 : 1;
    if (L.beard === 'stubble') on(new B.CircleGeometry(0.075, 12, Math.PI, Math.PI), shade(sk, 0.8), 0, my + 0.0, -0.002); else A(sph(0.12 * bs, 10, 7), bc, mat(0, hy - 0.12 - 0.02 * bs, hr * 0.55, 0.2, 0, 0, 1.15, 0.9, 0.8), 2, { ot: 0.01 }); }
  if (L.jaw) A(box(0.24, 0.1, 0.18), 0x9aa4b0, mat(0, hy - 0.13, hr * 0.55), 2, { ot: 0.01 });
  if (L.clown) A(sph(0.05, 8, 6), 0xff2020, mat(0, hy - 0.03, hr + 0.02), 2, { ot: 0.008 });
  if (L.saw) A(cone(0.045, 0.45, 5), 0xd0d0d0, mat(0, hy - 0.02, hr + 0.22, Math.PI / 2), 2, { ot: 0.008 });
  if (L.tusks) for (const s of [-1, 1]) A(cone(0.035, 0.32, 6), 0xf0ead0, mat(s * 0.08, hy - 0.06, hr + 0.1, 1.1, 0, -s * 0.3), 2, { ot: 0.008 });
  if (L.cigar) for (let i = 0; i < L.cigar; i++) { const x = (i - (L.cigar - 1) / 2) * 0.05; A(cyl(0.012, 0.012, 0.12, 6), 0x6a4a2a, mat(x + 0.03, my, hr + 0.04, Math.PI / 2 - 0.2, 0, 0.2), 2, { outline: false }); A(sph(0.014, 6, 4), 0xff7a2a, mat(x + 0.04, my + 0.012, hr + 0.1), 2, { outline: false }); }
  if (L.mask) A(box(0.3, 0.14, 0.12), L.mask, mat(0, hy - 0.07, hr * 0.72), 2, { ot: 0.008 });
  // hair
  const hc = L.hair || 0x222222, hs = L.hat === 'helmet' && L.hairS !== 'bald' ? 'buzz' : L.hairS;
  const capH = (k = 1.07, back = -0.32, sy = 1) => A(new B.SphereGeometry(hr * k, 16, 9, 0, Math.PI * 2, 0, Math.PI * 0.55), hc, mat(0, hy + 0.01, -0.012, back, 0, 0, 1, sy, 1), 2, { ot: 0.012 });
  const back = (len = 0.12, w = 1) => A(sph(hr * 1.02, 12, 8), hc, mat(0, hy - len * 0.3, -hr * 0.28, 0, 0, 0, w, 1 + len, 0.85), 2, { ot: 0.012 });
  const spike = (x, y, z, rx, rz, r = 0.05, h = 0.16) => A(cone(r, h, 5), hc, mat(x, y, z, rx, 0, rz), 2, { ot: 0.008 });
  if (hs !== 'bald') {
    if (hs === 'afro') A(sph(hr * 1.55, 12, 9), hc, mat(0, hy + 0.1, -0.04), 2, { ot: 0.012 });
    else if (hs === 'buzz') { capH(1.025, -0.4, 0.9); back(0.0); }
    else { capH(hs === 'slick' ? 1.05 : 1.08, hs === 'slick' ? -0.5 : -0.3); back(hs === 'long' || hs === 'pigtails' ? 0.25 : 0.05); }
    if (hs === 'spiky' || hs === 'messy') { // messy anime bangs + side/back spikes
      for (let i = -2; i <= 2; i++) spike(i * 0.055, hy + 0.11 - Math.abs(i) * 0.01, hr * 0.82, 1.9 + Math.abs(i) * 0.1, -i * 0.25, 0.045, hs === 'messy' ? 0.15 : 0.12);
      for (const s of [-1, 1]) for (let i = 0; i < 2; i++) spike(s * hr * 0.95, hy + 0.06 - i * 0.07, 0.02 - i * 0.05, 0.2, s * (2.1 + i * 0.25), 0.05, 0.15);
      for (let i = -1; i <= 1; i++) spike(i * 0.08, hy + 0.08, -hr * 0.92, -1.9, -i * 0.3, 0.06, 0.18);
    }
    if (hs === 'short') for (let i = -1; i <= 1; i++) spike(i * 0.06, hy + 0.12, hr * 0.8, 1.95, -i * 0.3, 0.045, 0.1);
    if (hs === 'swept') { for (let i = -2; i <= 2; i++) spike(i * 0.055, hy + 0.17, hr * 0.4, 0.9, -i * 0.15, 0.05, 0.2); }
    if (hs === 'mohawk') for (let i = 0; i < 5; i++) spike(0, hy + 0.18, hr * (0.6 - i * 0.35), -0.3 + i * 0.15, 0, 0.05, 0.22);
    if (hs === 'long') { A(box(hr * 1.9, 0.5, 0.1), hc, mat(0, hy - 0.25, -hr * 0.7), 2, { ot: 0.01, grad: 0.2 }); for (const s of [-1, 1]) A(box(0.07, 0.36, 0.12), hc, mat(s * hr * 0.92, hy - 0.12, hr * 0.15), 2, { ot: 0.008 }); for (let i = -2; i <= 2; i++) spike(i * 0.05, hy + 0.1, hr * 0.84, 1.95, -i * 0.15, 0.04, 0.1); }
    if (hs === 'ponytail') { A(sph(0.05, 8, 6), L.band || hc, mat(0, hy + 0.02, -hr * 1.0), 2); A(cone(0.08, 0.4, 7), hc, mat(0, hy - 0.18, -hr * 1.15, Math.PI - 0.25), 2, { ot: 0.01 }); }
    if (hs === 'pompadour') { A(sph(hr * 0.75, 12, 8), hc, mat(0, hy + hr * 0.95, hr * 0.55, 0, 0, 0, 1.15, 0.8, 1.6), 2, { ot: 0.012 }); A(cone(hr * 0.5, hr * 0.9, 7), hc, mat(0, hy + hr * 0.9, hr * 1.45, Math.PI / 2 + 0.25, 0, 0, 1.2, 1, 0.75), 2, { ot: 0.01 }); }
    if (hs === 'wild') { for (let i = 0; i < 9; i++) { const a = -1.25 + i / 8 * 2.5; spike(Math.sin(a) * hr * 0.8, hy + hr * 0.55 + Math.cos(a) * hr * 0.35, -hr * 0.25, -0.5, -a * 1.05, 0.075, 0.34); } for (let i = -2; i <= 2; i++) spike(i * 0.06, hy + 0.11, hr * 0.85, 2.0, -i * 0.3, 0.05, 0.16); for (let i = -1; i <= 1; i++) spike(i * 0.11, hy + 0.02, -hr * 0.95, -2.2, -i * 0.4, 0.08, 0.3); }
    if (hs === 'bun') A(sph(0.09, 10, 7), hc, mat(0, hy + 0.17, -hr * 0.55), 2, { ot: 0.01 });
    if (hs === 'pigtails') for (const s of [-1, 1]) A(cone(0.07, 0.3, 7), hc, mat(s * hr * 1.05, hy - 0.12, -0.03, Math.PI, 0, s * 0.3), 2, { ot: 0.01 });
  }
  if (L.mink) for (const s of [-1, 1]) A(cone(0.06, 0.16, 5), hc, mat(s * 0.12, hy + 0.2, -0.01, 0, 0, -s * 0.25), 2);
  if (L.horns) for (const s of [-1, 1]) A(cone(0.045, L.horns === 'big' ? 0.45 : 0.26, 6), 0xe8e0c8, mat(s * 0.12, hy + 0.2, 0.02, -0.2, 0, -s * 0.45), 2, { ot: 0.008 });
  if (L.fin) A(cone(0.07, 0.25, 4), shade(sk, 0.8), mat(0, hy + 0.2, -0.05, -0.3, 0, 0, 0.4, 1, 1.4), 2);
  // hats
  const hat = L.hat, hC = L.hatC;
  if (L.band && !hat) A(cyl(hr * 1.09, hr * 1.1, 0.07, 14), L.band, mat(0, hy + 0.09, -0.01, -0.12), 2, { ot: 0.008 });
  if (hat === 'jingasa') { A(cone(hr * 2.0, hr * 0.7, 14), hC || 0xc8a868, mat(0, hy + hr * 0.95, 0), 2, { ot: 0.01 }); A(cyl(hr * 0.2, hr * 0.2, 0.03, 8), 0x3a2a1a, mat(0, hy + hr * 1.32, 0), 2, { outline: false }); }
  if (hat === 'helmet') { const hcH = hC || 0xe0e4ea; A(new B.SphereGeometry(hr * 1.2, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), hcH, mat(0, hy + hr * 0.18, -0.01), 2, { ot: 0.012, grad: 0.35 }); // dome
    A(new B.TorusGeometry(hr * 1.2, 0.024, 5, 20), shade(hcH, 0.7), mat(0, hy + hr * 0.18, -0.01, Math.PI / 2), 2, { outline: false }); // rim
    A(new B.CylinderGeometry(hr * 1.2, hr * 1.12, hr * 0.36, 16, 1, true, -Math.PI * 0.34, Math.PI * 0.68), L.shadeC || 0x1a90c8, mat(0, hy + hr * 0.0, 0), 2, { outline: false }); // curved visor
    for (const s2 of [-1, 1]) A(cyl(0.05, 0.05, 0.05, 10), shade(hcH, 0.75), mat(s2 * hr * 1.13, hy - 0.01, 0, 0, 0, Math.PI / 2), 2, { outline: false });
    A(box(0.04, 0.07, hr * 0.9), shade(hcH, 0.85), mat(0, hy + hr * 1.15, -0.02), 2, { outline: false }); }
  if (hat === 'topknot') A(cyl(0.03, 0.04, 0.16, 8), hc, mat(0, hy + hr * 1.05, -0.02, -0.5), 2, { ot: 0.006 });
  if (hat === 'bandana') { A(new B.SphereGeometry(hr * 1.1, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), hC || L.band || 0x2a6a3a, mat(0, hy + 0.02, -0.01, -0.25), 2, { ot: 0.01 }); A(cone(0.05, 0.14, 4), hC || L.band || 0x2a6a3a, mat(0, hy - 0.02, -hr * 1.1, -2.2), 2); }
  if (hat === 'straw') { A(cyl(0.42, 0.44, 0.025, 22), 0xf1d36a, mat(0, hy + 0.12, -0.01, -0.12), 2, { ot: 0.01 }); A(cyl(0.19, 0.21, 0.16, 16), 0xf1d36a, mat(0, hy + 0.21, -0.02, -0.12), 2, { ot: 0.01 }); A(cyl(0.213, 0.213, 0.05, 16), 0xc8202a, mat(0, hy + 0.16, -0.015, -0.12), 2, { outline: false }); }
  if (hat === 'marine') { A(cyl(hr * 1.05, hr * 1.03, 0.15, 14), hC || 0xffffff, mat(0, hy + 0.15, 0, -0.05), 2, { ot: 0.008 }); A(cyl(hr * 1.06, hr * 1.06, 0.045, 14), 0x2a5bb8, mat(0, hy + 0.09, 0), 2, { outline: false }); A(box(0.2, 0.02, 0.12), 0x2a5bb8, mat(0, hy + 0.08, hr * 0.98, 0.15), 2, { ot: 0.006 }); A(box(0.05, 0.05, 0.01), 0x2a5bb8, mat(0, hy + 0.15, hr * 1.06), 2, { outline: false }); }
  if (hat === 'tricorn') { const c = hC || 0x1a1a1a; A(cyl(0.34, 0.34, 0.03, 3), c, mat(0, hy + 0.14, 0, 0, Math.PI, 0), 2, { ot: 0.01 }); A(cyl(0.18, 0.21, 0.15, 12), c, mat(0, hy + 0.22, 0), 2, { ot: 0.01 }); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + Math.PI; A(box(0.36, 0.11, 0.03), c, mat(Math.sin(a) * 0.16, hy + 0.19, Math.cos(a) * 0.16, 0, a, 0, 1, 1, 1), 2, { ot: 0.008 }); } A(sph(0.035, 8, 6), 0xffffff, mat(0, hy + 0.22, 0.2), 2, { outline: false }); }
  if (hat === 'top') { const c = hC || 0x1a1a1a; A(cyl(0.27, 0.27, 0.025, 16), c, mat(0, hy + 0.15, 0), 2, { ot: 0.01 }); A(cyl(0.16, 0.17, 0.32, 14), c, mat(0, hy + 0.32, 0), 2, { ot: 0.01 }); A(cyl(0.172, 0.172, 0.05, 14), 0x8a1a1a, mat(0, hy + 0.19, 0), 2, { outline: false }); }
  if (hat === 'beanie') { A(new B.SphereGeometry(hr * 1.12, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), hC || 0x3a6ab0, mat(0, hy + 0.04, -0.01, -0.15, 0, 0, 1, 1.1, 1), 2, { ot: 0.01 }); A(cyl(hr * 1.13, hr * 1.13, 0.06, 14), shade(hC || 0x3a6ab0, 0.75), mat(0, hy + 0.06, -0.01, -0.15), 2, { outline: false }); A(sph(0.05, 8, 6), 0xffffff, mat(0, hy + 0.26, -0.04), 2); }
  if (hat === 'cowboy') { const c = hC || 0xe0702a; A(cyl(0.36, 0.38, 0.025, 20), c, mat(0, hy + 0.13, -0.01, -0.1, 0, 0, 1, 1, 0.9), 2, { ot: 0.01 }); A(cyl(0.17, 0.2, 0.16, 14), c, mat(0, hy + 0.22, -0.01, -0.1), 2, { ot: 0.01 }); A(cyl(0.203, 0.203, 0.04, 14), 0x2a2a2a, mat(0, hy + 0.16, -0.01, -0.1), 2, { outline: false }); for (const s of [-1, 1]) A(sph(0.035, 8, 6), 0x3a6ae0, mat(s * 0.12, hy + 0.17, 0.17), 2, { outline: false }); }
  if (hat === 'chef') { A(cyl(hr * 1.02, hr * 1.02, 0.14, 14), 0xffffff, mat(0, hy + 0.14, 0), 2, { ot: 0.008 }); A(sph(0.2, 12, 8), 0xffffff, mat(0, hy + 0.3, 0, 0, 0, 0, 1.1, 0.8, 1.1), 2, { ot: 0.01 }); }
  if (hat === 'crown') { A(cyl(hr * 0.9, hr * 0.85, 0.08, 12), 0xf0c030, mat(0, hy + 0.17, 0), 2, { ot: 0.008 }); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; A(cone(0.03, 0.08, 4), 0xf0c030, mat(Math.sin(a) * hr * 0.85, hy + 0.24, Math.cos(a) * hr * 0.85), 2, { outline: false }); } A(sph(0.025, 6, 4), 0xe03050, mat(0, hy + 0.17, hr * 0.9), 2, { outline: false }); }
  if (hat === 'turban') { A(sph(hr * 1.2, 12, 8), hC || 0xf0e8d0, mat(0, hy + 0.12, -0.01, 0, 0, 0, 1, 0.75, 1), 2, { ot: 0.01 }); A(sph(0.03, 6, 4), 0x3ad0a0, mat(0, hy + 0.13, hr * 1.18), 2, { outline: false }); }
  if (hat === 'horned') { A(new B.SphereGeometry(hr * 1.12, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), hC || 0x8a8a90, mat(0, hy + 0.03, 0), 2, { ot: 0.01 }); for (const s of [-1, 1]) A(cone(0.05, 0.3, 6), 0xf0ead0, mat(s * 0.2, hy + 0.17, 0, 0, 0, -s * 1.0), 2, { ot: 0.008 }); }
  // ---------- skeleton ----------
  const { fill, line } = b.geos();
  const bones = []; const mk = (x, y, z, p) => { const bo = new B.Bone(); bo.position.set(x, y, z); if (p) p.add(bo); bones.push(bo); return bo; };
  const AXn = AX + AX * (P.chest - 1) * 0.82;
  const hips = mk(0, hipN, 0); const torso = mk(0, 0, 0, hips); const head = mk(0, shN + 0.02 - hipN, 0, torso);
  const armL = mk(-AXn, shN - hipN - 0.03, 0, torso); const armR = mk(AXn, shN - hipN - 0.03, 0, torso);
  const legL = mk(-0.1 * g * P.waist, 0, 0, hips); const legR = mk(0.1 * g * P.waist, 0, 0, hips);
  const foreL = mk(0, (elY - shY + 0.03) * P.arm, 0, armL); const foreR = mk(0, (elY - shY + 0.03) * P.arm, 0, armR);
  const shinL = mk(0, (kneeY - hipY) * P.leg, 0, legL); const shinR = mk(0, (kneeY - hipY) * P.leg, 0, legR);
  const skel = new B.Skeleton(bones);
  const material = toonMat({ emissive: 0x000000 });
  const root = new B.Group();
  const mesh = new B.SkinnedMesh(fill, material); mesh.add(hips); mesh.bind(skel); mesh.frustumCulled = false;
  const om = new B.SkinnedMesh(line, OUTLINE_MAT); om.bind(skel, mesh.bindMatrix); om.frustumCulled = false; om.userData.isOutline = true;
  // LOD: drop the ink outline (half the draw cost) for distant characters; quality setting still wins
  const _wp = new B.Vector3(); mesh.onBeforeRender = (r, sc2, cam) => { const on = qv().outline; if (!on) { om.visible = false; return; } mesh.getWorldPosition(_wp); om.visible = _wp.distanceToSquared(cam.position) < 45 * 45; };
  root.add(mesh, om);
  const sc = (L.scale || 1) * sm; root.scale.setScalar(sc);
  const C = { root, mesh, bones: { hips, torso, head, armL, armR, legL, legR, foreL, foreR, shinL, shinR }, material, hipY: hipN, height: (hyN + 0.3 * P.head) * sc, look: L, body: P.id };
  if (FACE) C.face = buildFace(C, L, { hr: hr * P.head, hy: hyN, headY: shN + 0.02 });
  return C;
}

// procedural animation: idle breathing, walk/run with knees+elbows, punch/slam, windup, aim, hit, taunt, talk, sit, wave, death
export function animChar(c, st, t) {
  const B_ = c.bones; const id = (c._seed ??= Math.random() * 10); const dtA = Math.min(0.1, Math.max(0, t - (c._lt ?? t))); c._lt = t;
  // smooth blend between idle / walk / run so starts and stops don't pop
  c._run = c._run == null ? (st.move || 0) : c._run + ((st.move || 0) - c._run) * (1 - Math.exp(-dtA * 10)); const run = c._run < 0.01 ? 0 : c._run; const ph = st.phase || 0;
  c._hit = Math.max(st.hit || 0, (c._hit || 0) - dtA * 3); if (st.hit > 0.9 && !c._hs) { c._hs = Math.random() < 0.5 ? -1 : 1; } if (!(st.hit > 0)) c._hs = 0;
  const sw = Math.sin(ph) * 0.75 * run;
  B_.legL.rotation.set(sw, 0, 0); B_.legR.rotation.set(-sw, 0, 0);
  B_.shinL.rotation.x = Math.max(0, -Math.cos(ph)) * 1.0 * run + 0.02; B_.shinR.rotation.x = Math.max(0, Math.cos(ph)) * 1.0 * run + 0.02;
  const breathe = Math.sin(t * 2 + id) * 0.025 * (1 - run);
  B_.armL.rotation.set(-sw * 0.85, 0, -0.14 - breathe); B_.armR.rotation.set(sw * 0.85, 0, 0.14 + breathe);
  B_.foreL.rotation.set(-0.25 - run * 0.7, 0, 0); B_.foreR.rotation.set(-0.25 - run * 0.7, 0, 0);
  B_.hips.position.y = c.hipY + Math.abs(Math.cos(ph)) * 0.05 * run - run * 0.02 + Math.sin(t * 2 + id) * 0.006;
  B_.hips.rotation.set(0, Math.sin(ph) * 0.12 * run, 0);
  B_.torso.rotation.set(0.1 * run + breathe * 0.5, -Math.sin(ph) * 0.2 * run, 0);
  B_.head.rotation.set(-0.06 * run, Math.sin(t * 0.5 + id) * 0.18 * (1 - run), 0);
  if (st.attack > 0) { // wind back, then strike forward
    const a = st.attack; const k = a > 0.45 ? (1 - a) / 0.55 : a / 0.45;
    if (a > 0.45) { B_.armR.rotation.x = -2.5 * k; B_.foreR.rotation.x = -1.2 * k; B_.torso.rotation.y = -0.45 * k; }
    else { B_.armR.rotation.x = -1.5 - 1.0 * k; B_.foreR.rotation.x = -0.1; B_.torso.rotation.y = 0.35 * k; B_.armL.rotation.x = -0.9; B_.foreL.rotation.x = -1.6; }
    B_.legL.rotation.x = -0.3 * k; B_.legR.rotation.x = 0.25 * k;
  }
  if (st.windup) { B_.armR.rotation.x = -2.7; B_.foreR.rotation.x = -0.9; B_.armL.rotation.x = -0.9; B_.foreL.rotation.x = -1.4; B_.torso.rotation.x = -0.22; B_.torso.rotation.y = -0.3; B_.legL.rotation.x = -0.35; B_.shinL.rotation.x = 0.4; }
  if (st.angry && run < 0.6 && !(st.attack > 0) && !st.windup && !st.aim && !st.taunt) { const bo = Math.sin(t * 7 + id) * 0.04; B_.armR.rotation.set(-1.25 + bo, 0, 0.35); B_.foreR.rotation.x = -1.5; B_.armL.rotation.set(-1.0 - bo, 0, -0.3); B_.foreL.rotation.x = -1.7; B_.torso.rotation.x += 0.12; B_.torso.rotation.y += 0.25; B_.legL.rotation.x += -0.25 * (1 - run); B_.legR.rotation.x += 0.15 * (1 - run); B_.shinL.rotation.x += 0.25 * (1 - run); B_.hips.position.y -= 0.04 * (1 - run) + Math.abs(bo) * 0.3; }
  else if (st.idleV && run < 0.05 && !st.talk && !(st.attack > 0) && !st.windup) { const cyc = (t * 0.11 + id) % 1;
    if (cyc > 0.82 && cyc < 0.92) { const k = Math.sin((cyc - 0.82) / 0.1 * Math.PI); B_.armR.rotation.set(-2.6 * k, 0, 0.3 * k); B_.armL.rotation.set(-2.6 * k, 0, -0.3 * k); B_.torso.rotation.x -= 0.15 * k; B_.head.rotation.x -= 0.25 * k; } // stretch
    else if (cyc > 0.4 && cyc < 0.47) { const k = Math.sin((cyc - 0.4) / 0.07 * Math.PI); B_.armR.rotation.set(-2.3 * k, 0, 0.9 * k); B_.foreR.rotation.x = -1.9 * k; B_.head.rotation.z = 0.15 * k; } // scratch head
    else if (cyc > 0.15 && cyc < 0.25) { const k = Math.sin((cyc - 0.15) / 0.1 * Math.PI); B_.head.rotation.y += Math.sin(t * 2.5) * 0.7 * k; } } // look around
  if (st.aim) { B_.armR.rotation.x = -1.5; B_.foreR.rotation.x = 0; B_.armL.rotation.x = -1.3; B_.armL.rotation.z = 0.5; B_.foreL.rotation.x = -0.5; }
  if (c._hit > 0.01) { const h = c._hit, sd = c._hs || 1; B_.torso.rotation.x = -0.55 * h; B_.torso.rotation.z = 0.25 * h * sd; B_.torso.rotation.y += 0.3 * h * sd; B_.head.rotation.x = -0.5 * h; B_.head.rotation.z = 0.2 * h * sd; B_.armL.rotation.x = 0.7 * h; B_.armR.rotation.x = 0.7 * h; B_.armL.rotation.z = -0.5 * h; B_.armR.rotation.z = 0.5 * h; B_.hips.position.y -= 0.06 * h; B_.legL.rotation.x += -0.25 * h; B_.shinL.rotation.x += 0.4 * h; }
  if (st.taunt) { B_.armR.rotation.x = -2.9 + Math.sin(t * 9) * 0.15; B_.armL.rotation.x = -2.9 - Math.sin(t * 9) * 0.15; B_.foreR.rotation.x = -0.3; B_.foreL.rotation.x = -0.3; B_.head.rotation.x = -0.25; B_.torso.rotation.x = -0.12; }
  if (st.talk) { B_.armR.rotation.x = -0.7 + Math.sin(t * 3) * 0.2; B_.foreR.rotation.x = -0.9 + Math.sin(t * 2.3) * 0.25; B_.head.rotation.y = Math.sin(t * 0.7) * 0.25; B_.head.rotation.x = Math.sin(t * 4) * 0.04; }
  if (st.wave) { B_.armR.rotation.set(-0.3, 0, 2.5); B_.foreR.rotation.set(0, 0, Math.sin(t * 9) * 0.5); }
  if (st.sit) { B_.hips.position.y = c.hipY - 0.42; B_.legL.rotation.x = B_.legR.rotation.x = -1.45; B_.shinL.rotation.x = B_.shinR.rotation.x = 1.45; B_.armL.rotation.x = B_.armR.rotation.x = -0.75; B_.foreL.rotation.x = B_.foreR.rotation.x = -0.75; B_.armR.rotation.z = 0.05; B_.armL.rotation.z = -0.05; B_.torso.rotation.x = 0.12; if (st.talk) B_.foreR.rotation.x = -0.9 + Math.sin(t * 3) * 0.3; }
  if (c.face) { c.face.update(dtA, st); if (st.look && st.dead === undefined) { const R = c.root, dx = st.look.x - R.position.x, dz = st.look.z - R.position.z; let yaw = Math.atan2(dx, dz) - R.rotation.y; yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw)); const pit = Math.atan2((st.look.y || 0) - (R.position.y + c.height), Math.hypot(dx, dz)); const ly = Math.max(-0.9, Math.min(0.9, yaw)), lp = Math.max(-0.4, Math.min(0.35, -pit)); c.face.lookYaw += (ly - c.face.lookYaw) * Math.min(1, dtA * 6); c.face.lookPitch += (lp - c.face.lookPitch) * Math.min(1, dtA * 6); } else { c.face.lookYaw *= 1 - Math.min(1, dtA * 3); c.face.lookPitch *= 1 - Math.min(1, dtA * 3); } B_.head.rotation.y += c.face.lookYaw; B_.head.rotation.x += c.face.lookPitch; }
  if (st.dead !== undefined) { // stagger, knees buckle, then topple backwards with a bounce
    const T = st.dead; const s = Math.min(1, T / 0.25); const f = Math.min(1, Math.max(0, (T - 0.15) / 0.45)); const d = f * f * (3 - 2 * f); const bounce = T > 0.6 && T < 0.9 ? Math.sin((T - 0.6) / 0.3 * Math.PI) * 0.12 : 0;
    c.root.rotation.x = -d * 1.5 + bounce; c.root.rotation.z = (c._seed % 1 - 0.5) * 0.5 * d; B_.torso.rotation.x = -0.4 * s * (1 - d) + 0.2 * d; B_.head.rotation.x = -0.5 * s; B_.armL.rotation.z = -1.3 * d - 0.4 * s; B_.armR.rotation.z = 1.3 * d + 0.4 * s; B_.armL.rotation.x = -0.6 * s; B_.armR.rotation.x = -0.6 * s; B_.shinL.rotation.x = 0.8 * s * (1 - d) + 0.4 * d; B_.shinR.rotation.x = 0.8 * s * (1 - d) + 0.3 * d; B_.legL.rotation.x = -0.4 * s * (1 - d); B_.hips.position.y = c.hipY - 0.15 * s * (1 - d); }
}
