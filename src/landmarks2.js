// Arc-specific terrain, sea colours, lighting and big recognizable landmarks (visual pass v4).
import { THREE, Builder, mat, WORLD_MAT } from './engine.js';
const B = THREE;
const cyl = (a, b, h, n = 10) => new B.CylinderGeometry(a, b, h, n); const cone = (r, h, n = 8) => new B.ConeGeometry(r, h, n); const sph = (r, w = 12, h = 9) => new B.SphereGeometry(r, w, h); const box = (x, y, z) => new B.BoxGeometry(x, y, z);
// sea colours [deep, shallow] and light tint [hemiSky, hemiGround, sunColor, sunIntensity]
export const SEA = { skypiea: [0xdfe9f6, 0xffffff], fishman: [0x05284a, 0x1a7aa8], thriller: [0x1a1a2e, 0x3a3a5a], impel: [0x2a0f12, 0x5a2a2a], wci: [0x5a7ad0, 0xb0d0ff], wano: [0x0a3a6a, 0x2a8ab0], egghead: [0x0a4a7a, 0x3ad0e0], alabasta: [0x0a5a8a, 0x3ac8d8], enies: [0x0a3a6a, 0x3a8ac0], punk: [0x2a4a6a, 0x8ac0d8], amazon: [0x0a6a7a, 0x3ae0c8], mirro: [0x2a1a4a, 0x8a6ad0] };
export const LIGHT = { thriller: [0xa898d0, 0x3a2a4a, 0xc0b0ff, 1.7], impel: [0xd08a7a, 0x3a1a1a, 0xff9a7a, 1.6], fishman: [0x8ad0ff, 0x1a4a6a, 0xbfe8ff, 1.6], alabasta: [0xfff0d0, 0xa08a50, 0xffe0a0, 2.6], wano: [0xffe0e8, 0x5a4a3a, 0xffd0b0, 2.1], egghead: [0xd0f0ff, 0x4a6a8a, 0xffffff, 2.3], skypiea: [0xffffff, 0xd0d8f0, 0xfff6e0, 2.4], wci: [0xffe0f0, 0x8a6a7a, 0xfff0e0, 2.2] };
// second NPC visual pass: arc-specific outfits for each island's two grunt types [e1, e2]
export const GRUNT = {
  orange: [{ hairS: 'spiky', mouth: 'grin', brow: 'angry', stripes: true, hat: 'bandana', hatC: 0xd03030 }, { hairS: 'swept', mouth: 'grin', brow: 'angry', weapon: 'sabre', scarf: 0xd03030 }],
  syrup: [{ hat: 'beanie', hatC: 0x2a2a2a, mouth: 'teeth', brow: 'angry', vest: 0x3a2a1a }, { hairS: 'messy', glasses: 'round', mouth: 'grin', brow: 'angry', weapon: 'claws' }],
  baratie: [{ armor: 0xb8a040, hat: 'bandana', hatC: 0x6a1a1a, mouth: 'teeth', brow: 'angry' }, { armor: 0xd8b040, mouth: 'grin', brow: 'angry', weapon: 'spear', cape: 0x8a1a1a }],
  arlong: [{ skin: 'fish', fin: true, mouth: 'teeth', brow: 'angry', open: true, hat: 'bandana', hatC: 0x3a6a3a }, { skin: 'fish', fin: true, saw: true, mouth: 'teeth', brow: 'angry', weapon: 'kiribachi' }],
  loguetown: [{ hat: 'marine', collar: 0x2a5bb8, mouth: 'line', brow: 'angry', weapon: 'jitte' }, { hat: 'tricorn', hatC: 0x2a2a2a, mouth: 'grin', brow: 'angry', coat: 0x5a2a2a, weapon: 'sabre' }],
  whisky: [{ hat: 'cowboy', hatC: 0x6a4a2a, glasses: 'shades', mouth: 'line', coat: 0x3a2a1a }, { hairS: 'mohawk', glasses: 'shades', mouth: 'grin', vest: 0x2a2a2a, gloves: 0x2a2a2a }],
  alabasta: [{ hat: 'turban', hatC: 0xf0e0c0, scarf: 0xe0d0a0, coat: 0xe8d8b0, mouth: 'line', brow: 'angry', weapon: 'sabre' }, { glasses: 'shades', hairS: 'slick', coat: 0x2a2a3a, tie: 0xd0a040, mouth: 'grin' }],
  skypiea: [{ wings: true, wingC: 0xffffff, hairS: 'buzz', earlobes: true, sleeveless: true, sash: 0xe8c86a, mouth: 'line', weapon: 'staff' }, { wings: true, wingC: 0xffffff, hat: 'bandana', hatC: 0xf0f0f0, mask: 0x2a2a2a, mouth: 'line', weapon: 'spear' }],
  water7: [{ hat: 'top', hatC: 0x111111, coat: 0x111111, tie: 0xf0f0f0, mouth: 'line', brow: 'angry', longSleeve: true }, { hat: 'bandana', hatC: 0x2a6ab0, apron: 0x6a4a2a, mouth: 'grin', gloves: 0x6a4a2a, weapon: 'axe' }],
  enies: [{ hat: 'marine', collar: 0x2a5bb8, cape: 0xffffff, mouth: 'line', brow: 'angry', weapon: 'spear' }, { coat: 0x111111, tie: 0xf0f0f0, mask: 0xf4f4f4, mouth: 'line', longSleeve: true }],
  thriller: [{ skin: 0x8ab07a, scar: 'x', mouth: 'teeth', brow: 'angry', stripes: true, hairS: 'messy' }, { skin: 0x9aa0b0, scar: 'x', mouth: 'teeth', brow: 'angry', cape: 0x2a1a3a, weapon: 'sabre', hat: 'tricorn', hatC: 0x1a1a1a }],
  sabaody: [{ hat: 'tricorn', hatC: 0x2a2a2a, coat: 0x4a2a1a, mouth: 'grin', brow: 'angry', weapon: 'sabre' }, { hat: 'helmet', hatC: 0xf4f4f4, coat: 0x2a2a3a, mouth: 'line', weapon: 'axe', big: 1.2 }],
  amazon: [{ fem: true, hairS: 'ponytail', mouth: 'smile', sleeveless: true, sash: 0xd04a8a, weapon: 'spear' }, { fem: true, hairS: 'long', mouth: 'line', cape: 0xffffff, hat: 'crown', hatC: 0xd0a040, weapon: 'sabre' }],
  impel: [{ hat: 'horned', hatC: 0x3a1a2a, mask: 0x1a1a1a, mouth: 'teeth', weapon: 'spear', big: 1.2 }, { hat: 'helmet', hatC: 0x6a6a7a, shadeC: 0xff3a2a, mouth: 'line', weapon: 'jitte' }],
  marineford: [{ hat: 'marine', collar: 0x2a5bb8, mouth: 'line', brow: 'angry', weapon: 'sabre' }, { hat: 'marine', cape: 0xffffff, coat: null, tie: 0x1a1a1a, mouth: 'line', brow: 'angry', weapon: 'katana', longSleeve: true }],
  fishman: [{ skin: 'fish', fin: true, hairS: 'mohawk', mouth: 'teeth', brow: 'angry', open: true }, { skin: 0x6a8ad0, fin: true, saw: true, mouth: 'teeth', brow: 'angry', weapon: 'trident', eye: 0xd02020 }],
  punk: [{ hat: 'helmet', hatC: 0x3a6a3a, shadeC: 0xffe04a, coat: 0x4a5a3a, mouth: 'line' }, { horns: true, fur: 0xd0d8e0, mouth: 'teeth', brow: 'angry', big: 1.25 }],
  dressrosa: [{ glasses: 'shades', shadeC: 0xd02020, fur: 0xe8608a, mouth: 'grin', hairS: 'slick' }, { hat: 'helmet', hatC: 0xe0b060, shadeC: 0x2a2a2a, cape: 0xd02020, weapon: 'sabre', mouth: 'line' }],
  zou: [{ mink: true, hairS: 'messy', mouth: 'teeth', brow: 'angry', sleeveless: true }, { tusks: true, mask: 0x2a2a2a, coat: 0x1a1a1a, mouth: 'line', brow: 'angry', weapon: 'scimitars' }],
  wci: [{ hat: 'crown', hatC: 0xffd0e0, stripes: true, collar: 0xff7ab0, mouth: 'smile', weapon: 'spear' }, { scarf: 0x5a1a2a, coat: 0x3a0a1a, mouth: 'line', brow: 'angry', weapon: 'mogura' }],
  wano: [{ hat: 'jingasa', sash: 0x8a1a1a, coat: 0x4a3a5a, open: true, mouth: 'line', brow: 'angry', weapon: 'katana' }, { hat: 'topknot', hairS: 'slick', coat: 0x2a2a3a, sash: 0xd0a040, horns: true, mouth: 'teeth', brow: 'angry', weapon: 'kanabo' }],
  egghead: [{ hat: 'helmet', hatC: 0xf4f8ff, shadeC: 0x3af0ff, coat: 0xf4f8ff, mouth: 'line', gloves: 0x2a2a3a }, { hat: 'helmet', hatC: 0x2a2a3a, shadeC: 0xff4ad0, big: 1.25, mouth: 'line', wings: true, wingC: 0x2a2a3a, weapon: 'lightsword' }],
};
// terrain modifiers
// per-island keep-out for trees/rocks (canals, plazas)
export const NOTREE = { water7: (x, z, R) => (Math.abs(Math.abs(x) - 22) < 8 && z > -R * 0.55 && z < R * 0.66) || (Math.abs(z - R * 0.12) < 7 && Math.abs(x) > 12) || Math.abs(Math.abs(x) - 31) < 5 || Math.hypot(x, z + R * 0.58) < 27 };
export const TREEN = { water7: 14 };
export const HFX = {
  water7: (hf, R) => (x, z) => { let h = hf(x, z); const canal = (d, w) => Math.max(0, 1 - d / w); const c = Math.max(Math.abs(x) > 14 ? canal(Math.abs(Math.abs(x) - 22), 4.4) * (z > -R * 0.5 && z < R * 0.62 ? 1 : 0) : 0, Math.abs(x) > 14 && Math.abs(x) < R - 8 ? canal(Math.abs(z - R * 0.12), 4.0) : 0); return h > 0.5 && c > 0 ? h - c * (h + 1.4) : h; },
  alabasta: (hf, R) => (x, z) => { const h = hf(x, z); if (h < 0.9 || Math.abs(x) < 8) return h; return h + Math.max(0, Math.sin(x * 0.11 + Math.sin(z * 0.05) * 2) * Math.cos(z * 0.07)) * 2.4 * Math.min(1, (Math.abs(x) - 8) / 10); },
  wano: (hf, R) => (x, z) => { const h = hf(x, z); const d = Math.hypot(x + R * 0.48, z + R * 0.5); return h + Math.max(0, 1 - d / 14) * 7; }, // castle plateau
  dressrosa: (hf, R) => (x, z) => { const h = hf(x, z); const d = Math.hypot(x - R * 0.5, z + R * 0.45); return h + Math.max(0, Math.min(1, (13 - d) / 3)) * 9; }, // King's plateau
  zou: (hf, R) => (x, z) => hf(x, z) + (Math.hypot(x, z) > R - 14 ? Math.sin(x * 0.4) * Math.sin(z * 0.4) * 0.4 : 0),
};
export const PAINT = {
  alabasta: (x, z, y) => y > 0.9 && Math.abs(x) > 6 ? (Math.sin(x * 0.11 + Math.sin(z * 0.05) * 2) > 0.3 ? 0xf2d68a : 0xe6c272) : null,
  wci: (x, z, y) => y > 0.9 && Math.abs(Math.sin(x * 0.05) * 20 - z + 10) < 2.2 ? 0x6a3a1a : null, // chocolate river
  punk: (x, z, y) => y > 0.9 ? (x < 0 ? 0xeaf4ff : 0x8a3a2a) : null, // ice half / fire half
  zou: (x, z, y) => y > 0.9 && Math.hypot(x, z) > 56 ? 0x9a9a9a : null,
  thriller: (x, z, y) => y > 0.9 && Math.random() < 0.08 ? 0x2a2a1a : null,
};
const shadeC = (c, k) => new B.Color(c).multiplyScalar(k).getHex();
export function decorate(id, b, hf, C, I, R, rnd) {
  const g = I.group; const y0 = (x, z) => Math.max(0, hf(x, z)); const col = (x, z, r) => C.push({ x, z, r });
  const tower = (x, z, r, h, c, top, topC) => { const y = y0(x, z); b.add(cyl(r, r * 1.12, h, 12), c, mat(x, y + h / 2, z), { grad: 0.3 }); if (top) b.add(cone(r * 1.35, r * 1.8, 12), topC, mat(x, y + h + r * 0.9, z)); col(x, z, r * 1.12); };
  const glass = (geo, c, op, m) => { const ms = new B.Mesh(geo, new B.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, side: B.DoubleSide })); ms.applyMatrix4(m); g.add(ms); return ms; };
  const pagodaRoof = (x, y, z, w, c) => { b.add(cyl(0.01, w * 0.78, w * 0.28, 4), c, mat(x, y + w * 0.14, z, 0, Math.PI / 4)); b.add(box(w * 1.12, 0.18, w * 1.12), c, mat(x, y, z)); for (const s of [-1, 1]) for (const t of [-1, 1]) b.add(cone(0.18, 0.7, 4), c, mat(x + s * w * 0.56, y + 0.15, z + t * w * 0.56, s * 0.5, 0, t * 0.5), { outline: false }); };
  switch (id) {
    case 'alabasta': { // Alubarna: palace on the cliff with domes + clock tower, oasis, sandstone walls
      const px = 0, pz = -R * 0.62; const py = y0(px, pz); b.add(box(34, 3, 16), 0xd8c08a, mat(px, py + 1.5, pz)); b.add(box(24, 9, 10), 0xeedcb0, mat(px, py + 7.5, pz), { grad: 0.25 }); col(px, pz, 15);
      for (const [dx, r] of [[-9, 3.5], [0, 5], [9, 3.5]]) { b.add(sph(r, 14, 10), 0xf4e6c0, mat(px + dx, py + 12 + r * 0.3, pz, 0, 0, 0, 1, 1.2, 1)); b.add(cone(0.6, 3, 8), 0xd0a040, mat(px + dx, py + 12 + r * 1.6, pz)); }
      tower(px + 18, pz + 4, 3, 26, 0xe8d4a0, true, 0xd0a040); b.add(cyl(2.2, 2.2, 0.3, 20), 0xffffff, mat(px + 18, y0(px + 18, pz + 4) + 20, pz + 7.1, Math.PI / 2), { outline: false }); b.add(box(0.2, 1.8, 0.1), 0x222222, mat(px + 18, y0(px + 18, pz + 4) + 20.5, pz + 7.3), { outline: false });
      tower(px - 18, pz + 4, 2.4, 18, 0xe8d4a0, true, 0xd0a040);
      const ox = -R * 0.5, oz = R * 0.05; b.add(cyl(7, 7.5, 0.4, 20), 0x2ab0d0, mat(ox, y0(ox, oz) + 0.1, oz), { outline: false }); col(ox, oz, 6.5); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; const tx = ox + Math.cos(a) * 9, tz = oz + Math.sin(a) * 9; const ty = y0(tx, tz); b.add(cyl(0.3, 0.45, 7, 6), 0x9a7a4a, mat(tx, ty + 3.5, tz, 0.1, 0, 0.1)); for (let k = 0; k < 5; k++) b.add(cone(0.5, 3.4, 4), 0x4a9a3a, mat(tx + Math.cos(k * 1.25) * 1.4, ty + 7, tz + Math.sin(k * 1.25) * 1.4, Math.sin(k * 1.25) * 1.2, 0, -Math.cos(k * 1.25) * 1.2), { outline: false }); }
      for (let i = 0; i < 14; i++) { const a = -Math.PI * 0.95 + i / 13 * Math.PI * 0.9; const wx = Math.cos(a) * (R - 10), wz = Math.sin(a) * (R - 10); b.add(box(7, 4, 1.4), 0xd8c08a, mat(wx, y0(wx, wz) + 2, wz, 0, -a + Math.PI / 2, 0)); }
      break; }
    case 'skypiea': { // cloud sea shore, Giant Jack beanstalk, golden Shandora bell, ruins
      for (let i = 0; i < 46; i++) { const a = i / 46 * 6.28 + rnd() * 0.1, rr = R + 2 + rnd() * 12; b.add(sph(3 + rnd() * 4, 10, 7), 0xffffff, mat(Math.cos(a) * rr, -0.5 + rnd() * 1.5, Math.sin(a) * rr, 0, 0, 0, 1.4, 0.55, 1.2), { outline: false }); }
      const jx = R * 0.5, jz = -R * 0.5; for (let i = 0; i < 26; i++) { const t = i / 25; const yy = y0(jx, jz) + t * 90; const ox = Math.sin(t * 9) * 3, oz = Math.cos(t * 9) * 3; b.add(cyl(2.4 - t * 1.2, 2.6 - t * 1.2, 4.2, 9), 0x4a8a2a, mat(jx + ox, yy, jz + oz, Math.cos(t * 9) * 0.25, 0, Math.sin(t * 9) * 0.25)); if (i % 3 === 0) b.add(sph(2.6, 8, 6), 0x6ab83a, mat(jx + ox * 2.2, yy, jz + oz * 2.2, 0, 0, 0, 1.6, 0.4, 1), { outline: false }); } col(jx, jz, 3);
      const bx = -R * 0.45, bz = -R * 0.45, by = y0(bx, bz); b.add(box(1, 12, 1), 0x8a6a3a, mat(bx - 4, by + 6, bz)); b.add(box(1, 12, 1), 0x8a6a3a, mat(bx + 4, by + 6, bz)); b.add(box(10, 1, 1.2), 0x8a6a3a, mat(bx, by + 12, bz));
      b.add(cyl(1.6, 3.4, 5, 16), 0xffcc33, mat(bx, by + 8.5, bz), { grad: 0.4 }); b.add(sph(1.6, 12, 8), 0xffcc33, mat(bx, by + 11, bz)); b.add(new B.TorusGeometry(3.3, 0.35, 6, 18), 0xe0a020, mat(bx, by + 6, bz, Math.PI / 2)); col(bx, bz, 5);
      for (let i = 0; i < 8; i++) { const x = -R * 0.2 + rnd() * 12 - 30, z = -R * 0.2 - rnd() * 18; b.add(cyl(0.9, 1, 3 + rnd() * 6, 8), 0xe8e0c8, mat(x, y0(x, z) + 2, z), {}); col(x, z, 1); }
      break; }
    case 'water7': { // central grand fountain, canals with yagara, Galley-La cranes
      const fx = 0, fz = -R * 0.58, fy = y0(fx, fz); for (let i = 0; i < 5; i++) b.add(cyl(14 - i * 2.6, 15 - i * 2.6, 4, 20), [0xd8dde6, 0xc8d0dc, 0xe0e6ee, 0xd0d8e4, 0xe8ecf2][i], mat(fx, fy + 2 + i * 4, fz), { grad: 0.25 }); col(fx, fz, 15);
      tower(fx, fz, 2.2, 32, 0xf0f2f6, true, 0x3a7ad0); const sp = glass(cone(9, 14, 18, 1, true), 0x9ad8ff, 0.45, mat(fx, fy + 27, fz, Math.PI)); I.updaters.push(dt => { sp.rotation.y += dt * 0.6; });
      { const wm = new B.MeshBasicMaterial({ color: 0x2fa8d8, transparent: true, opacity: 0.85 }); const L = R * 1.12; for (const s of [-1, 1]) { const a = new B.Mesh(new B.BoxGeometry(7.6, 0.1, L), wm); a.position.set(s * 22, -0.35, (R * 0.62 - R * 0.5) / 2); g.add(a); const c = new B.Mesh(new B.BoxGeometry(R - 22, 0.1, 7.2), wm); c.position.set(s * (14 + (R - 22) / 2), -0.35, R * 0.12); g.add(c);
        for (const bz of [-R * 0.3, R * 0.35]) { const by = Math.max(y0(s * 16, bz), y0(s * 28, bz)); b.add(box(12, 0.5, 3), 0xc8b8a0, mat(s * 22, by + 0.25, bz)); b.add(new B.TorusGeometry(4.4, 0.35, 5, 14, Math.PI), 0xb8a890, mat(s * 22, by - 3.9, bz, 0, 0, 0), { outline: false }); for (const t of [-1, 1]) for (let q = 0; q < 6; q++) b.add(cyl(0.07, 0.07, 0.8, 5), 0x8a7a6a, mat(s * 22 - 5 + q * 2, by + 0.9, bz + t * 1.35), { outline: false }); for (const t of [-1, 1]) b.add(box(12, 0.1, 0.1), 0x8a7a6a, mat(s * 22, by + 1.3, bz + t * 1.35), { outline: false }); }
        // stone quay edges + railings along the long canal
        for (const e of [-1, 1]) { const ex = s * 22 + e * 4.6; for (let zq = -R * 0.48; zq < R * 0.6; zq += 6) { const qy = y0(ex + e * 1.2, zq); if (qy < 0.4) continue; b.add(box(1.2, 0.5, 6), 0xb0a898, mat(ex, qy + 0.05, zq + 3), { outline: false }); b.add(cyl(0.08, 0.08, 0.9, 5), 0x6a5a4a, mat(ex - e * 0.4, qy + 0.75, zq), { outline: false }); } } } }
      for (const s of [-1, 1]) for (let k = 0; k < 2; k++) { const x = s * (R * 0.55), z = -R * 0.1 + k * 20; const yy = y0(x, z); b.add(box(1, 22, 1), 0xd04a2a, mat(x, yy + 11, z)); b.add(box(16, 1, 1), 0xd04a2a, mat(x - s * 6, yy + 22, z)); b.add(box(0.15, 8, 0.15), 0x333333, mat(x - s * 12, yy + 18, z), { outline: false }); col(x, z, 1); }
      { const HC = [0xe8d8b8, 0xd8c8a8, 0xc8d8e8, 0xe8c8b0, 0xf0e8d8], RC = [0x3a6ab0, 0xc06a3a, 0x2a8a8a, 0x7a7a8a];
        for (const s of [-1, 1]) for (let z = -R * 0.42; z < R * 0.55; z += 9) { if (Math.abs(z - R * 0.12) < 7 || Math.abs(z + R * 0.3) < 4 || Math.abs(z - R * 0.35) < 4) continue; const x = s * 31 + (rnd() - 0.5) * 2; const yy = y0(x, z); if (yy < 0.6) continue;
          const fl = 2 + Math.floor(rnd() * 3), w = 5 + rnd() * 1.5, hc = HC[Math.floor(rnd() * HC.length)]; for (let f = 0; f < fl; f++) { const ww = w - f * 0.5; b.add(box(ww, 3, ww), f % 2 ? shadeC(hc, 0.92) : hc, mat(x, yy + 1.5 + f * 3, z), { grad: 0.25 }); for (const k of [-1, 1]) b.add(box(0.7, 0.9, 0.06), 0x2a4a6a, mat(x + k * ww * 0.25, yy + 1.8 + f * 3, z + ww / 2 + 0.02), { outline: false }); }
          b.add(cyl(0.01, w * 0.62, 1.8, 4), RC[Math.floor(rnd() * RC.length)], mat(x, yy + fl * 3 + 0.9 - (fl - 1) * 0.0, z, 0, Math.PI / 4)); col(x, z, w * 0.6); }
        // paved plaza around the fountain
        b.add(cyl(26, 26, 0.12, 24), 0xd8d4cc, mat(0, y0(0, -R * 0.58 + 18) + 0.06, -R * 0.58), { outline: false }); }
      for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1; const z = -R * 0.3 + i * 12; const m = new Builder(); m.add(sph(0.9, 10, 8), 0xf0c060, mat(0, 0.2, 0, 0, 0, 0, 1, 0.8, 2)); m.add(sph(0.5, 8, 6), 0xf0c060, mat(0, 1.1, -1.6)); m.add(box(1.4, 0.3, 2), 0xb07a3a, mat(0, 0.8, 0.6)); const ya = m.build(WORLD_MAT); ya.position.set(s * 22 + (i % 3 - 1) * 1.6, -0.7, z); g.add(ya); I.updaters.push(dt => { ya.position.y = -0.7 + Math.sin(performance.now() / 600 + i) * 0.08; }); }
      break; }
    case 'enies': { // Tower of Justice, Gates of Justice in the sea, the bottomless waterfall hole
      const ex = 0, ez = -R - 30; b.add(new B.TorusGeometry(42, 6, 6, 32), 0x2a5a8a, mat(ex, -1.5, ez, Math.PI / 2), { outline: false });
      const fall = glass(cyl(40, 34, 30, 32, 1, true), 0xdff4ff, 0.55, mat(ex, -16, ez)); const hole = glass(new B.CircleGeometry(36, 32), 0x050a14, 0.95, mat(ex, -1.2, ez, -Math.PI / 2)); I.updaters.push(dt => { fall.rotation.y += dt * 0.15; });
      for (const s of [-1, 1]) { b.add(box(10, 46, 4), 0x3a3a3a, mat(s * 6, 22, -R - 85, 0, s * 0.25, 0), { grad: 0.3 }); b.add(box(10.5, 4, 4.4), 0x8a7a3a, mat(s * 6, 44, -R - 85, 0, s * 0.25, 0)); }
      b.add(box(26, 12, 12), 0xe8e8f0, mat(0, y0(0, -R * 0.62) + 6, -R * 0.62), { grad: 0.25 }); col(0, -R * 0.62, 14); for (let i = -2; i <= 2; i++) b.add(cyl(0.8, 0.8, 10, 8), 0xf8f8ff, mat(i * 5, y0(0, -R * 0.55) + 5, -R * 0.55));
      tower(-R * 0.45, -R * 0.55, 4, 48, 0xf0f0f6, true, 0x2a5bb8); b.add(box(6, 4, 0.3), 0x2a5bb8, mat(-R * 0.45, y0(-R * 0.45, -R * 0.55) + 40, -R * 0.55 + 4.2), { outline: false });
      break; }
    case 'thriller': { // the island IS a giant ship: hull walls, enormous masts with tattered sails, graves
      for (const s of [-1, 1]) { b.add(box(6, 14, R * 2.1), 0x3a2a30, mat(s * (R + 6), 1, 0, 0, 0, s * 0.12), { grad: 0.5 }); for (let i = 0; i < 9; i++) b.add(box(0.6, 1.4, 3), 0x111111, mat(s * (R + 9.2), 10, -R + i * R * 0.24), { outline: false }); }
      b.add(box(R * 2.2, 26, 8), 0x2a1a22, mat(0, 6, R + 10), { grad: 0.5 }); b.add(cone(R * 0.9, 40, 4), 0x2a1a22, mat(0, 6, -R - 18, -Math.PI / 2, Math.PI / 4, 0, 1, 1, 0.35));
      for (const [mx, mz, h] of [[-R * 0.6, -R * 0.1, 90], [R * 0.62, R * 0.2, 80], [R * 0.55, -R * 0.6, 70]]) { const yy = y0(mx, mz); b.add(cyl(1.6, 2.2, h, 8), 0x3a2a22, mat(mx, yy + h / 2, mz)); col(mx, mz, 2.2); for (let k = 0; k < 2; k++) { b.add(box(26, 14, 0.4), 0x4a3a4a, mat(mx, yy + h * (0.55 + k * 0.25), mz + 1, 0.08, 0, 0.05)); b.add(cyl(0.5, 0.5, 30, 6), 0x3a2a22, mat(mx, yy + h * (0.55 + k * 0.25) + 7, mz, 0, 0, Math.PI / 2)); } }
      for (let i = 0; i < 26; i++) { const x = (rnd() - 0.5) * R * 1.3, z = (rnd() - 0.5) * R * 1.2; if (Math.abs(x) < 6) continue; const yy = y0(x, z); b.add(box(1.2, 1.8, 0.35), 0x7a7a80, mat(x, yy + 0.8, z, 0, rnd(), (rnd() - 0.5) * 0.3)); b.add(box(0.25, 1.1, 0.3), 0x7a7a80, mat(x, yy + 1.6, z, 0, 0, Math.PI / 2), { outline: false }); }
      break; }
    case 'sabaody': { // giant Yarukiman mangroves with grove numbers, rising resin bubbles
      const groves = [[-R * 0.55, -R * 0.4, 13], [R * 0.58, -R * 0.35, 24], [-R * 0.6, R * 0.25, 1], [R * 0.6, R * 0.3, 41], [0, -R * 0.72, 30]];
      for (const [x, z, n] of groves) { const yy = y0(x, z); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; b.add(cyl(0.9, 1.6, 8, 6), 0x8a6a4a, mat(x + Math.cos(a) * 4, yy + 3, z + Math.sin(a) * 4, Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45)); }
        b.add(cyl(3.2, 3.8, 30, 10), 0x9a7a5a, mat(x, yy + 18, z), { grad: 0.3 }); b.add(new B.IcosahedronGeometry(13, 1), 0x6ab04a, mat(x, yy + 36, z, 0, 0, 0, 1, 0.55, 1), { grad: 0.3 }); col(x, z, 4);
        const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const c = cv.getContext('2d'); c.fillStyle = '#f4e8c8'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#3a2a1a'; c.font = 'bold 44px Impact,sans-serif'; c.textAlign = 'center'; c.fillText(String(n), 64, 50);
        const sg = new B.Mesh(new B.PlaneGeometry(4, 2), new B.MeshBasicMaterial({ map: new B.CanvasTexture(cv) })); sg.position.set(x, yy + 9, z + 3.9); sg.lookAt(0, yy + 9, R); g.add(sg); }
      const bub = []; const bm = new B.MeshBasicMaterial({ color: 0xd8f4ff, transparent: true, opacity: 0.35, depthWrite: false }); const bg = sph(1, 12, 9);
      for (let i = 0; i < 36; i++) { const m = new B.Mesh(bg, bm); const gr = groves[i % groves.length]; m.userData = { x: gr[0] + (rnd() - 0.5) * 16, z: gr[1] + (rnd() - 0.5) * 16, s: 0.4 + rnd() * 1.4, t: rnd() * 30, v: 1 + rnd() * 1.6 }; m.scale.setScalar(m.userData.s); g.add(m); bub.push(m); }
      I.updaters.push(dt => { for (const m of bub) { const u = m.userData; u.t += dt * u.v; const yy = (u.t % 30); m.position.set(u.x + Math.sin(u.t * 0.7) * 1.5, yy, u.z + Math.cos(u.t * 0.5) * 1.5); } });
      break; }
    case 'fishman': { // giant bubble dome, coral reefs, sunlight through the deep
      const dome = glass(sph(R * 1.3, 32, 20), 0x9ae8ff, 0.16, mat(0, -6, 0)); glass(new B.TorusGeometry(R * 1.29, 0.6, 6, 48), 0xcff8ff, 0.4, mat(0, -4, 0, Math.PI / 2));
      for (let i = 0; i < 34; i++) { const a = rnd() * 6.28, rr = R * (0.35 + rnd() * 0.55); const x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (Math.abs(x) < 7) continue; const yy = y0(x, z); const cc = [0xff6a8a, 0xffa04a, 0xb06aff, 0x4ae0c0, 0xffe04a][i % 5];
        for (let k = 0; k < 4; k++) b.add(cyl(0.18, 0.35, 2 + rnd() * 2.6, 6), cc, mat(x + (rnd() - 0.5) * 1.4, yy + 1.2, z + (rnd() - 0.5) * 1.4, (rnd() - 0.5) * 0.9, 0, (rnd() - 0.5) * 0.9), { outline: false }); b.add(sph(0.7, 8, 6), cc, mat(x, yy + 0.3, z, 0, 0, 0, 1.4, 0.6, 1.4), { outline: false }); }
      for (let i = 0; i < 5; i++) glass(cyl(0.6, 6, 120, 8, 1, true), 0xeaffff, 0.06, mat(-30 + i * 15, 50, -20 + i * 6, 0.2, 0, 0.15));
      break; }
    case 'dressrosa': { // Corrida Colosseum, King's Plateau palace, sunflower fields, toy house
      const cx = -R * 0.5, cz = -R * 0.45, cy = y0(cx, cz); for (let t = 0; t < 3; t++) { const rr = 17 - t * 0.6, h = 5; const n = 28; for (let i = 0; i < n; i++) { const a = i / n * 6.28; if (t === 0 && Math.abs(a - Math.PI * 0.25) < 0.2) continue; b.add(box(3.6, h, 1.8), [0xe8c890, 0xd8b078, 0xe0bc84][t], mat(cx + Math.cos(a) * rr, cy + h / 2 + t * h, cz + Math.sin(a) * rr, 0, -a + Math.PI / 2, 0), { grad: 0.2 });
          b.add(box(1.4, 2.4, 1.9), 0x5a3a2a, mat(cx + Math.cos(a) * (rr + 0.02), cy + 1.4 + t * h, cz + Math.sin(a) * (rr + 0.02), 0, -a + Math.PI / 2, 0), { outline: false }); if (t === 0) C.push({ x: cx + Math.cos(a) * rr, z: cz + Math.sin(a) * rr, r: 1.8 }); } }
      b.add(cyl(14, 14, 0.2, 24), 0xd8c098, mat(cx, cy + 0.15, cz), { outline: false });
      const kx = R * 0.5, kz = -R * 0.45, ky = y0(kx, kz); b.add(box(14, 7, 9), 0xf4e0e8, mat(kx, ky + 3.5, kz), { grad: 0.2 }); for (const s of [-1, 1]) tower(kx + s * 7, kz, 1.6, 12, 0xf4e0e8, true, 0xe04a6a); tower(kx, kz - 2, 2, 16, 0xffeef4, true, 0xe04a6a); col(kx, kz, 8);
      for (let i = 0; i < 70; i++) { const x = -R * 0.65 + rnd() * 18, z = R * 0.05 + rnd() * 22; const yy = y0(x, z); b.add(cyl(0.05, 0.06, 1.4, 4), 0x3a8a2a, mat(x, yy + 0.7, z), { outline: false }); b.add(cyl(0.38, 0.38, 0.1, 8), 0xffd02a, mat(x, yy + 1.45, z, 1.2, 0, 0), { outline: false }); }
      break; }
    case 'zou': { // the island rides on Zunesha's back: head, ears, trunk, tusks and legs in the sea
      const ez = -R - 16; b.add(sph(26, 18, 12), 0x8a8a8e, mat(0, 8, ez, 0, 0, 0, 1.1, 0.95, 1), { grad: 0.4 }); for (const s of [-1, 1]) { b.add(sph(18, 14, 10), 0x7a7a80, mat(s * 28, 8, ez + 6, 0, s * 0.4, 0, 0.25, 1.1, 1)); b.add(sph(2.2, 10, 8), 0x111111, mat(s * 12, 14, ez - 22), { outline: false }); b.add(cone(2.4, 26, 8), 0xf4f0e0, mat(s * 9, -2, ez - 24, -1.2, 0, s * 0.2)); }
      for (let i = 0; i < 9; i++) { const t = i / 8; b.add(sph(5.5 - t * 2.6, 12, 9), 0x8a8a8e, mat(Math.sin(t * 2) * 6, -2 - t * 18 + Math.sin(t * 3) * 4, ez - 24 - t * 10 + t * t * 8)); }
      for (const [lx, lz] of [[-R * 0.75, -R * 0.5], [R * 0.75, -R * 0.5], [-R * 0.75, R * 0.6], [R * 0.75, R * 0.6]]) { b.add(cyl(11, 13, 60, 14), 0x7a7a80, mat(lx * 1.25, -30, lz * 1.25), { grad: 0.4 }); }
      break; }
    case 'wci': { // Whole Cake Chateau extra tiers, giant lollipops, candy canes, gumdrops
      for (let i = 0; i < 18; i++) { const a = rnd() * 6.28, rr = R * (0.3 + rnd() * 0.6); const x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (Math.abs(x) < 7) continue; const yy = y0(x, z); const h = 4 + rnd() * 6;
        if (i % 3 === 0) { b.add(cyl(0.25, 0.25, h, 6), 0xffffff, mat(x, yy + h / 2, z)); b.add(cyl(2.2, 2.2, 0.6, 18), [0xff4a8a, 0x4ad0ff, 0xffd02a][i % 3 === 0 ? (i / 3) % 3 : 0], mat(x, yy + h + 1.6, z, Math.PI / 2), {}); }
        else if (i % 3 === 1) { for (let k = 0; k < 6; k++) b.add(cyl(0.4, 0.4, h / 6, 8), k % 2 ? 0xffffff : 0xe02a3a, mat(x, yy + (k + 0.5) * h / 6, z), { outline: k === 0 }); b.add(new B.TorusGeometry(1, 0.4, 6, 10, Math.PI), 0xe02a3a, mat(x + 1, yy + h, z)); }
        else b.add(sph(1.6, 10, 8), [0x6ae04a, 0xff7a3a, 0xb06aff][i % 3], mat(x, yy + 0.8, z, 0, 0, 0, 1, 0.8, 1)); col(x, z, 1); }
      const cx = 0, cz = -R * 0.66, cy = y0(cx, cz); for (const s of [-1, 1]) { tower(cx + s * 16, cz, 3, 22, 0xffe0f0, true, 0xff5aa0); b.add(sph(2.2, 10, 8), 0xd01a3a, mat(cx + s * 16, cy + 29, cz)); }
      break; }
    case 'wano': { // tiered Japanese castle on a stone plateau, torii gates, distant Mt. Fuji and Onigashima
      const cx = -R * 0.48, cz = -R * 0.5, cy = y0(cx, cz); b.add(box(16, 4, 16), 0x8a8a90, mat(cx, cy + 1.5, cz), { grad: 0.3 }); for (let t = 0; t < 4; t++) { const w = 11 - t * 2.2; b.add(box(w, 3.2, w), 0xf4f0e8, mat(cx, cy + 5 + t * 4, cz)); pagodaRoof(cx, cy + 6.8 + t * 4, cz, w + 1.6, 0x3a3a4a); }
      b.add(cone(0.5, 1.5, 6), 0xffcc33, mat(cx, cy + 23, cz)); col(cx, cz, 9);
      for (let i = 0; i < 4; i++) { const z = R * 0.55 - i * 9; const yy = y0(0, z); for (const s of [-1, 1]) b.add(cyl(0.35, 0.4, 6, 8), 0xd02a1a, mat(s * 3.6, yy + 3, z)); b.add(box(9.2, 0.6, 0.7), 0xd02a1a, mat(0, yy + 6.2, z, 0, 0, 0)); b.add(box(8, 0.4, 0.5), 0x1a1a1a, mat(0, yy + 6.7, z)); b.add(box(7.6, 0.4, 0.5), 0xd02a1a, mat(0, yy + 5.2, z)); C.push({ x: 3.6, z, r: 0.5 }); C.push({ x: -3.6, z, r: 0.5 }); }
      b.add(cone(60, 70, 14), 0x6a7a9a, mat(80, 20, -260)); b.add(cone(17, 20, 14), 0xffffff, mat(80, 46, -260), { outline: false });
      b.add(new B.DodecahedronGeometry(22, 0), 0x3a3030, mat(-170, 8, -150, 0.2, 0.4, 0), { grad: 0.3 }); for (const s of [-1, 1]) b.add(cone(4, 26, 6), 0xe0d8c0, mat(-170 + s * 12, 34, -150, 0, 0, -s * 0.4));
      break; }
    case 'egghead': { // Labophase domes, neon towers with holo rings, floating Punk Records
      const px = R * 0.1, pz = -R * 0.8; const pr = new Builder(); pr.add(sph(14, 18, 14), 0xff8ab8, mat(0, 0, 0), { grad: 0.3 }); for (let i = 0; i < 6; i++) pr.add(new B.TorusGeometry(14.1, 0.5, 6, 30), 0xd05a8a, mat(0, 0, 0, i * 0.5, i * 0.7, 0), { outline: false }); pr.add(cyl(1.5, 3, 30, 8), 0xd0e0f0, mat(0, -26, 0));
      const pm = pr.build(WORLD_MAT); pm.position.set(px, 70, pz); g.add(pm); I.updaters.push(dt => { pm.rotation.y += dt * 0.1; pm.position.y = 70 + Math.sin(performance.now() / 1600) * 1.5; });
      const rings = []; for (const [x, z, h] of [[-R * 0.55, -R * 0.3, 26], [R * 0.6, -R * 0.2, 32], [-R * 0.5, R * 0.3, 20], [R * 0.55, R * 0.35, 22]]) { tower(x, z, 1.8, h, 0xf2f6ff, false); b.add(sph(2.2, 12, 10), 0x7ad0ff, mat(x, y0(x, z) + h + 1, z), { outline: false });
        for (let k = 0; k < 3; k++) { const rm = new B.Mesh(new B.TorusGeometry(3.4 + k, 0.12, 6, 32), new B.MeshBasicMaterial({ color: [0x3af0ff, 0xff4ad0, 0xffe04a][k], transparent: true, opacity: 0.8 })); rm.position.set(x, y0(x, z) + h * (0.35 + k * 0.22), z); rm.rotation.x = Math.PI / 2; g.add(rm); rings.push(rm); } }
      I.updaters.push(dt => { for (const [i, r] of rings.entries()) { r.rotation.z += dt * (0.5 + (i % 3) * 0.4); r.position.y += Math.sin(performance.now() / 500 + i) * 0.01; } });
      glass(sph(10, 20, 12, 0, 6.28, 0, Math.PI / 2), 0xbfefff, 0.25, mat(-R * 0.45, y0(-R * 0.45, -R * 0.62), -R * 0.62));
      break; }
    case 'impel': tower(0, -R - 26, 18, 60, 0x5a4a48, true, 0x3a2a28); break;
    case 'marineford': { for (let i = 0; i < 12; i++) { const a = Math.PI * 1.15 + i / 11 * Math.PI * 0.7; const x = Math.cos(a) * (R + 30), z = Math.sin(a) * (R + 30); b.add(box(16, 14, 4), 0xe8e8ee, mat(x, 4, z, 0, -a + Math.PI / 2, 0), { grad: 0.3 }); } const hy = y0(0, -R * 0.7); b.add(box(30, 5, 0.4), 0xffffff, mat(0, hy + 26, -R * 0.7 + 6.5), { outline: false }); break; }
  }
}
