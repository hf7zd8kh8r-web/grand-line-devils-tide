// Island zones for the expanded maps: paths, farms, forest, beach, cliffs, enemy camps, signposts.
// Everything goes into the island's merged Builder (one draw call per material), so it stays cheap on iPhone.
import { THREE, mat } from './engine.js';
import { addTree, addPine, addRock, addFence } from './models.js';
const B = THREE;
const box = (w, h, d) => new B.BoxGeometry(w, h, d);
const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1]; const L2 = dx * dx + dz * dz || 1; const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2)); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
// path network: list of [from, to] point pairs (polyline segments)
export function pathPaint(paths, w = 1.9, col = 0xc9a873) { return (x, z, y) => { if (y < 0.9) return null; for (const [a, b] of paths) if (segD(x, z, a, b) < w) return col; return null; }; }
export const nearPath = (paths, x, z, w = 3) => paths.some(([a, b]) => segD(x, z, a, b) < w);
export function signpost(b, hf, x, z, rot = 0) { const y = hf(x, z); b.add(box(0.16, 2.2, 0.16), 0x6a4528, mat(x, y + 1.1, z), { outline: false }); b.add(box(1.4, 0.35, 0.08), 0xd8b47a, mat(x, y + 1.9, z, 0, rot)); b.add(box(1.2, 0.3, 0.08), 0xc8a46a, mat(x, y + 1.45, z, 0, rot + 0.6)); }
export function farm(b, hf, C, x, z, w = 16, d = 12, crop = 0x8fd14a) {
  const h = (a, c) => hf(a, c); addFence(b, x - w / 2, z - d / 2, x + w / 2, z - d / 2, hf); addFence(b, x + w / 2, z - d / 2, x + w / 2, z + d / 2, hf); addFence(b, x - w / 2, z + d / 2, x - w / 2, z - d / 2, hf);
  for (let i = 0; i < Math.floor(w / 1.6); i++) { const px = x - w / 2 + 1 + i * 1.6; b.add(box(0.9, 0.18, d - 2), 0x7a5a3a, mat(px, h(px, z) + 0.05, z), { outline: false }); for (let j = 0; j < Math.floor((d - 2) / 1.5); j++) { const pz = z - d / 2 + 1.6 + j * 1.5; b.add(new B.SphereGeometry(0.32, 5, 4), crop, mat(px, h(px, pz) + 0.32, pz), { outline: false }); } }
  // hay bales + scarecrow
  for (let k = 0; k < 3; k++) { const hx = x + w / 2 + 2, hz = z - 3 + k * 2.4; b.add(new B.CylinderGeometry(0.7, 0.7, 1.1, 10), 0xe0c060, mat(hx, h(hx, hz) + 0.7, hz, Math.PI / 2, 0, 0)); C.push({ x: hx, z: hz, r: 0.8 }); }
  const sy = h(x, z); b.add(box(0.12, 2.6, 0.12), 0x6a4528, mat(x, sy + 1.3, z), { outline: false }); b.add(box(1.6, 0.12, 0.12), 0x6a4528, mat(x, sy + 2, z), { outline: false }); b.add(new B.SphereGeometry(0.3, 6, 5), 0xe8d0a0, mat(x, sy + 2.7, z)); b.add(new B.ConeGeometry(0.5, 0.4, 8), 0xd0b050, mat(x, sy + 3, z));
  // barn
  const bx = x - w / 2 - 5, bz = z, by = h(bx, bz); b.add(box(6, 4, 5), 0xa03a2a, mat(bx, by + 2, bz), { grad: 0.3 }); b.add(new B.ConeGeometry(4.6, 2, 4), 0x5a3a2a, mat(bx, by + 5, bz, 0, Math.PI / 4, 0, 1, 1, 0.8)); b.add(box(2, 2.6, 0.1), 0xf0e0c0, mat(bx + 3.02, by + 1.3, bz, 0, Math.PI / 2)); C.push({ x: bx, z: bz, hw: 3, hd: 2.5, rot: 0 });
}
export function forest(b, hf, C, x, z, rad, n, r, pine = 0.5) { for (let i = 0; i < n; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * rad; const tx = x + Math.cos(a) * d, tz = z + Math.sin(a) * d; const y = hf(tx, tz); if (y < 1) continue; if (r() < pine) addPine(b, tx, y, tz, 1 + r() * 0.8); else addTree(b, tx, y, tz, 0.9 + r() * 0.7, 0, r); C.push({ x: tx, z: tz, r: 0.5 }); }
  for (let i = 0; i < n / 3; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * rad; const tx = x + Math.cos(a) * d, tz = z + Math.sin(a) * d; const y = hf(tx, tz); if (y < 1) continue; b.add(new B.IcosahedronGeometry(0.6 + r() * 0.4, 0), 0x3f8a34, mat(tx, y + 0.3, tz, 0, 0, 0, 1, 0.6, 1), { outline: false }); }
  for (let i = 0; i < 4; i++) { const a = r() * 6.283, d = r() * rad * 0.8; const tx = x + Math.cos(a) * d, tz = z + Math.sin(a) * d; const y = hf(tx, tz); b.add(new B.CylinderGeometry(0.4, 0.45, 0.5, 8), 0x8a6a4a, mat(tx, y + 0.25, tz)); } }
// beach: palms, umbrellas, towels, driftwood along an arc of the shore
export function beach(b, hf, C, R, a0, a1, r) { for (let i = 0; i < 14; i++) { const a = a0 + (a1 - a0) * (i / 13) + (r() - 0.5) * 0.08; let d = R - 6; for (let k = 0; k < 24 && hf(Math.cos(a) * d, Math.sin(a) * d) < 0.95; k++) d -= 1; const x = Math.cos(a) * d, z = Math.sin(a) * d, y = hf(x, z);
    const k = i % 4; if (k === 0) { addTree(b, x, y, z, 0.9 + r() * 0.4, 1, r); C.push({ x, z, r: 0.5 }); }
    else if (k === 1) { const c = [0xe04a4a, 0x3a8ae0, 0xf0c040][i % 3]; b.add(new B.CylinderGeometry(0.05, 0.05, 2.4, 5), 0xeeeeee, mat(x, y + 1.2, z), { outline: false }); b.add(new B.ConeGeometry(1.4, 0.6, 8), c, mat(x, y + 2.4, z)); b.add(box(0.9, 0.04, 1.8), c, mat(x + 1, y + 0.03, z, 0, a), { outline: false }); }
    else if (k === 2) b.add(new B.CylinderGeometry(0.18, 0.22, 2.4, 6), 0xb09a7a, mat(x, y + 0.2, z, Math.PI / 2, a, 0));
    else addRock(b, x, y, z, 0.4 + r() * 0.5, r); } }
// cliffs: a cluster of tall rock columns on a hill
export function cliffs(b, hf, C, x, z, r, n = 7) { for (let i = 0; i < n; i++) { const a = r() * 6.283, d = r() * 7; const cx = x + Math.cos(a) * d, cz = z + Math.sin(a) * d; const y = hf(cx, cz), s = 1.4 + r() * 1.6, h = 3 + r() * 5;
    b.add(new B.DodecahedronGeometry(s, 0), 0x8a8478, mat(cx, y + h * 0.5, cz, r(), r(), 0, 1, h / s * 0.5, 1)); C.push({ x: cx, z: cz, r: s * 0.9 }); }
  const lx = x + 2, ly = hf(lx, z); b.add(new B.CylinderGeometry(0.9, 1.1, 7, 10), 0xf0f0f0, mat(lx, ly + 3.5, z)); for (const yy of [1.5, 4.5]) b.add(new B.CylinderGeometry(0.95, 0.95, 0.8, 10), 0xd03a3a, mat(lx, ly + yy, z), { outline: false }); b.add(new B.CylinderGeometry(0.7, 0.7, 0.9, 8), 0xfff0a0, mat(lx, ly + 7.4, z), { outline: false }); b.add(new B.ConeGeometry(1, 0.9, 8), 0xd03a3a, mat(lx, ly + 8.3, z)); C.push({ x: lx, z, r: 1.1 }); }
// enemy camp: palisade arc, tents, campfire, crates, banner
export function camp(b, hf, C, x, z, col = 0x8a6a4a, flag = 0x222222, r = Math.random) { for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; if (Math.cos(a - Math.atan2(-z, -x)) > 0.8) continue; const px = x + Math.cos(a) * 9, pz = z + Math.sin(a) * 9; const y = hf(px, pz); b.add(new B.CylinderGeometry(0.22, 0.25, 2.2, 5), 0x7a5a3a, mat(px, y + 1.1, pz)); b.add(new B.ConeGeometry(0.25, 0.4, 5), 0x7a5a3a, mat(px, y + 2.4, pz), { outline: false }); C.push({ x: px, z: pz, r: 0.3 }); }
  for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.4, tx = x + Math.cos(a) * 5.5, tz = z + Math.sin(a) * 5.5, y = hf(tx, tz); b.add(new B.ConeGeometry(2, 2.4, 4), col, mat(tx, y + 1.2, tz, 0, a)); C.push({ x: tx, z: tz, r: 1.6 }); }
  const y = hf(x, z); b.add(new B.CylinderGeometry(0.8, 0.9, 0.3, 8), 0x555555, mat(x, y + 0.15, z)); b.add(new B.ConeGeometry(0.5, 1, 6), 0xff7a1a, mat(x, y + 0.7, z), { outline: false }); b.add(new B.ConeGeometry(0.28, 0.7, 6), 0xffd04a, mat(x, y + 0.6, z), { outline: false });
  for (let i = 0; i < 3; i++) { const cx = x + 3 + i * 0.9, cz = z - 3; b.add(box(0.8, 0.8, 0.8), 0x9a6a3a, mat(cx, hf(cx, cz) + 0.4 + (i === 1 ? 0.8 : 0), cz)); } C.push({ x: x + 3.9, z: z - 3, r: 1.2 });
  const fx = x - 3, fz = z - 3, fy = hf(fx, fz); b.add(new B.CylinderGeometry(0.08, 0.08, 5, 5), 0x5a4a3a, mat(fx, fy + 2.5, fz), { outline: false }); b.add(box(1.8, 1.1, 0.05), flag, mat(fx + 0.9, fy + 4.4, fz), { outline: false }); b.add(new B.SphereGeometry(0.25, 6, 5), 0xf0f0f0, mat(fx + 0.9, fy + 4.4, fz + 0.04), { outline: false }); }
