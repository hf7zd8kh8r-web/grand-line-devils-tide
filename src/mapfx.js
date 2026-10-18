// Map look layer, applied to every island after it is built: instanced foliage (grass tufts with wind sway, flowers, bushes,
// varied trees/palms/cacti/maples/sakura/dead trees/coral/lollipops, pebbles) with chunked distance LOD, a terrain heightmap for
// true shoreline foam + depth colour in the water shader, lantern glows that light up at dusk, chimney smoke, light shafts,
// camera-local atmosphere particles (dust / fireflies / sakura petals / sand / snow+embers / bubbles / mist / sparkles / holo),
// per-theme fog, and a moving sun with dusk/night sky. Density scales with the graphics quality (Low/Med/High).
import { THREE, Q, qv, rng, noise2, toonMat, qualityHooks } from './engine.js';
import { IDEFS } from './islanddefs.js';
const B = THREE;
const LV = () => ({ low: 0, med: 1, high: 2 }[Q.level] ?? 1);
const DENS = [{ tuft: 0.12, flower: 0.3, bush: 0.45, tree: 0.45, peb: 0, chunk: 0.6, parts: 50, shafts: 0, smoke: 6 }, { tuft: 0.55, flower: 0.6, bush: 0.75, tree: 0.75, peb: 0.6, chunk: 0.8, parts: 120, shafts: 3, smoke: 10 }, { tuft: 1, flower: 1, bush: 1, tree: 1, peb: 1, chunk: 1, parts: 220, shafts: 6, smoke: 14 }];
// per-theme look
const G1 = [0x5aa83a, 0x7cc04a, 0x6ab842], FL = [0xff5a7a, 0xffd84a, 0xffffff, 0xb07aff, 0xff9a3a];
const T = {
  town: { tuft: G1, fl: FL, bush: [0x3f8a34, 0x4f9a3a, 0x5aa040], trees: ['round', 'pine', 'birch'], tc: [0x3f9a3a, 0x5ab04a, 0x2f7a30], n: [1, 1, 1, 1], parts: 'dust', fog: [40, 1] },
  village: { tuft: G1, fl: FL, bush: [0x3f8a34, 0x4f9a3a], trees: ['round', 'birch', 'pine'], tc: [0x4aa03a, 0x6ab84a], n: [1.1, 1.3, 1, 1], parts: 'dust', fog: [40, 1] },
  city: { tuft: G1, fl: FL, bush: [0x3f8a34, 0x4f9a3a], trees: ['round', 'birch'], tc: [0x4aa03a, 0x5ab04a], n: [0.6, 0.7, 0.8, 0.6], parts: 'dust', fog: [40, 1] },
  canal: { tuft: G1, fl: FL, bush: [0x3f8a34], trees: ['round', 'palm'], tc: [0x4aa03a], n: [0.5, 0.6, 0.7, 0.5], parts: 'dust', fog: [40, 1] },
  park: { tuft: G1, fl: [0xff5a7a, 0xffd84a], bush: [0x3f8a34, 0x4f9a3a], trees: ['palm', 'round'], tc: [0x4ab03a, 0x3a9a3a], n: [1, 0.8, 1, 1], parts: 'dust', fog: [40, 1] },
  sea: { tuft: G1, fl: FL, bush: [0x3f8a34], trees: ['palm'], tc: [0x4ab03a], n: [0.6, 0.5, 0.5, 0.6], parts: 'dust', fog: [40, 1] },
  desert: { tuft: [0xc8b060, 0xa89040, 0xd8c070], fl: [], bush: [0x8a9a4a, 0x9a8a4a], trees: ['cactus', 'palm', 'cactus'], tc: [0x5a9a3a, 0x4a8a3a], n: [0.35, 0, 0.5, 0.8], parts: 'sand', fog: [26, 0.9], fogTint: 0xf0d8a0 },
  cactus: { tuft: [0xb8a860, 0x9a9a50], fl: [0xff6a9a, 0xffd04a], bush: [0x8a9a4a], trees: ['cactus', 'cactus', 'palm'], tc: [0x5a9a3a], n: [0.4, 0.2, 0.5, 1], parts: 'sand', fog: [30, 0.95], fogTint: 0xf0d8a0 },
  wano: { tuft: [0x6a9a3a, 0x7aa84a], fl: [0xff7aa0, 0xffffff, 0xffd0e0], bush: [0xd8402a, 0xff7a2a, 0xe8a030, 0x3f8a34], trees: ['sakura', 'maple', 'pine'], tc: [0xffa8c8, 0xff7a2a, 0xd8402a, 0x2f6a30], n: [0.9, 0.9, 1, 1.1], parts: 'petals', fog: [34, 1], lan: 0xff4a2a },
  jungle: { tuft: [0x3f8a2a, 0x4f9a30, 0x5aa83a], fl: [0xff4a8a, 0xffa02a, 0xff3a3a], bush: [0x2f7a2a, 0x3a8a30, 0x4a9a3a], trees: ['jungle', 'palm', 'jungle'], tc: [0x2f7a2a, 0x3a9a30, 0x4aa83a], n: [1.5, 0.8, 1.6, 1.4], parts: 'fireflies', fog: [28, 0.9], shafts: 1.6 },
  grove: { tuft: G1, fl: [0xffffff, 0xff9ad8], bush: [0x4aa04a], trees: ['jungle', 'round'], tc: [0x5ab04a, 0x6ac05a], n: [1, 0.8, 1, 1], parts: 'bubbles', fog: [34, 1] },
  spooky: { tuft: [0x4a5a3a, 0x5a5a40], fl: [0x9a5aff, 0x5affd0], bush: [0x3a3a4a, 0x4a3a5a], trees: ['dead', 'dead', 'pine'], tc: [0x3a3040, 0x2a3a2a], n: [0.8, 0.4, 1, 1.2], parts: 'mist', fog: [14, 0.7], fogTint: 0x6a5a8a, lan: 0x9a6aff },
  cloud: { tuft: [0xf4f4e8, 0xe8f0d8], fl: [0xffd84a, 0xffffff], bush: [0xffffff, 0xf0f4ff], trees: ['round', 'palm'], tc: [0x8ad06a, 0xa0e080], n: [0.6, 0.6, 1.2, 0.6], parts: 'sparkle', fog: [40, 1] },
  coral: { tuft: [0xff7a8a, 0xffb04a, 0x7a5aff, 0x3affd0], fl: [0xff5a9a, 0xffd04a], bush: [0xff6a7a, 0xff9a4a, 0x8a5aff], trees: ['coral', 'coral', 'palm'], tc: [0xff6a8a, 0xffa04a, 0xa070ff], n: [0.8, 0.5, 1.2, 1], parts: 'bubbles', fog: [32, 0.9], fogTint: 0x6ad0ff },
  fireice: { tuft: [0xe8f4ff, 0xc8d8e0], fl: [], bush: [0xdff0ff, 0x5a4a4a], trees: ['snowpine', 'dead'], tc: [0xf0f8ff, 0x3a3030], n: [0.6, 0, 0.7, 1], parts: 'emberSnow', fog: [30, 0.9] },
  candy: { tuft: [0x8aff8a, 0xff9ad8, 0x9ad8ff], fl: [0xff5ab0, 0xffd04a, 0x8affff, 0xffffff], bush: [0xff9ad8, 0xffd0f0, 0x9affc8], trees: ['lolli', 'lolli', 'round'], tc: [0xff5ab0, 0x8ad8ff, 0xffd04a, 0x9aff8a], n: [1, 1.4, 1, 1.2], parts: 'sparkle', fog: [40, 1] },
  future: { tuft: [0x3affd0, 0x8affff, 0x5aff9a], fl: [0x3affff, 0xff5aff], bush: [0x2ad0b0, 0x5affd0], trees: ['round', 'birch'], tc: [0x3affd0, 0x5ad0ff], n: [0.8, 0.5, 0.8, 0.8], parts: 'holo', fog: [40, 1] },
  fortress: { tuft: G1, fl: [0xffffff], bush: [0x4f8a3a], trees: ['round'], tc: [0x4a9a3a], n: [0.4, 0.3, 0.5, 0.4], parts: 'dust', fog: [36, 1] },
  prison: { tuft: [0x6a7a5a], fl: [], bush: [0x4a5a4a], trees: ['dead'], tc: [0x3a3a3a], n: [0.3, 0, 0.4, 0.4], parts: 'mist', fog: [24, 0.85], fogTint: 0x7a7a8a },
};
const THEME_OF = { windmill: 'village', shells: 'town' };
// ---------- geometry ----------
function tuftGeo() { const P = [], C = []; for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI + 0.3, ca = Math.cos(a) * 0.16, sa = Math.sin(a) * 0.16, lean = (k - 1) * 0.08; P.push(-ca, 0, -sa, ca, 0, sa, lean, 0.55 + k * 0.08, lean * 0.5); C.push(0.55, 0.55, 0.55, 0.55, 0.55, 0.55, 1.1, 1.1, 1.1); }
  const g = new B.BufferGeometry(); g.setAttribute('position', new B.Float32BufferAttribute(P, 3)); g.setAttribute('color', new B.Float32BufferAttribute(C, 3)); g.computeVertexNormals(); const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0); return g; }
function colorize(geo, c) { const n = geo.attributes.position.count; const a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } geo.setAttribute('color', new B.BufferAttribute(a, 3)); return geo; }
function merge(parts) { const gs = parts.map(([g, m, c]) => { const q = g.index ? g.toNonIndexed() : g.clone(); q.applyMatrix4(m); q.deleteAttribute('uv'); colorize(q, c || [1, 1, 1]); return q; }); let n = 0; for (const g of gs) n += g.attributes.position.count;
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3); let o = 0; for (const g of gs) { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); C.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; }
  const r = new B.BufferGeometry(); r.setAttribute('position', new B.BufferAttribute(P, 3)); r.setAttribute('normal', new B.BufferAttribute(N, 3)); r.setAttribute('color', new B.BufferAttribute(C, 3)); return r; }
const Mx = (x, y, z, rx = 0, ry = 0, rz = 0, s = 1, sy = s, sz = s) => new B.Matrix4().compose(new B.Vector3(x, y, z), new B.Quaternion().setFromEuler(new B.Euler(rx, ry, rz)), new B.Vector3(s, sy, sz));
const W = [1, 1, 1], BR = [0.42, 0.28, 0.16], DK = [0.25, 0.18, 0.12];
// each tree kind: [trunk parts (fixed colours), top parts (white -> tinted per instance)]
const KINDS = {
  round: () => [[[new B.CylinderGeometry(0.18, 0.28, 2.4, 6), Mx(0, 1.2, 0), BR]], [[new B.IcosahedronGeometry(1.5, 0), Mx(0, 3.2, 0)], [new B.IcosahedronGeometry(1.1, 0), Mx(0.8, 2.7, 0.3)], [new B.IcosahedronGeometry(1.0, 0), Mx(-0.7, 2.9, -0.4), [0.82, 0.82, 0.82]]]],
  birch: () => [[[new B.CylinderGeometry(0.14, 0.2, 3.4, 6), Mx(0, 1.7, 0), [0.92, 0.9, 0.86]], [new B.BoxGeometry(0.3, 0.06, 0.3), Mx(0, 1.2, 0), DK], [new B.BoxGeometry(0.3, 0.06, 0.3), Mx(0, 2.3, 0), DK]], [[new B.IcosahedronGeometry(1.1, 0), Mx(0, 3.8, 0, 0, 0, 0, 1, 1.4, 1)], [new B.IcosahedronGeometry(0.8, 0), Mx(0.5, 3.1, 0.2), [0.85, 0.85, 0.85]]]],
  pine: () => [[[new B.CylinderGeometry(0.14, 0.22, 1.6, 6), Mx(0, 0.8, 0), BR]], [[new B.ConeGeometry(1.5, 1.8, 7), Mx(0, 2.0, 0), [0.85, 0.85, 0.85]], [new B.ConeGeometry(1.15, 1.6, 7), Mx(0, 3.0, 0)], [new B.ConeGeometry(0.75, 1.4, 7), Mx(0, 3.9, 0), [1.1, 1.1, 1.1]]]],
  snowpine: () => [[[new B.CylinderGeometry(0.14, 0.22, 1.6, 6), Mx(0, 0.8, 0), BR], [new B.ConeGeometry(1.5, 1.8, 7), Mx(0, 2.0, 0), [0.25, 0.42, 0.3]], [new B.ConeGeometry(1.15, 1.6, 7), Mx(0, 3.0, 0), [0.28, 0.46, 0.32]]], [[new B.ConeGeometry(0.8, 1.2, 7), Mx(0, 3.9, 0)], [new B.ConeGeometry(1.25, 0.5, 7), Mx(0, 3.65, 0)]]],
  palm: () => { const t = [], l = []; for (let i = 0; i < 5; i++) t.push([new B.CylinderGeometry(0.16 - i * 0.01, 0.2 - i * 0.01, 0.95, 6), Mx(i * i * 0.04, 0.45 + i * 0.9, 0, 0, 0, -i * 0.05), i % 2 ? [0.55, 0.4, 0.24] : [0.48, 0.34, 0.2]]);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; l.push([new B.BoxGeometry(2.4, 0.06, 0.5), Mx(0.64 + Math.cos(a) * 1.1, 4.6, Math.sin(a) * 1.1, 0, -a, -0.35)]); } l.push([new B.IcosahedronGeometry(0.3, 0), Mx(0.64, 4.45, 0), BR]); return [t, l]; },
  cactus: () => [[], [[new B.CylinderGeometry(0.32, 0.36, 2.6, 7), Mx(0, 1.3, 0)], [new B.CylinderGeometry(0.2, 0.2, 1.0, 6), Mx(0.55, 1.4, 0, 0, 0, Math.PI / 2)], [new B.CylinderGeometry(0.18, 0.18, 0.9, 6), Mx(0.85, 1.9, 0)], [new B.CylinderGeometry(0.16, 0.16, 0.7, 6), Mx(-0.5, 1.0, 0, 0, 0, Math.PI / 2)], [new B.CylinderGeometry(0.15, 0.15, 0.7, 6), Mx(-0.75, 1.35, 0)], [new B.SphereGeometry(0.33, 7, 4, 0, 6.3, 0, 1.6), Mx(0, 2.6, 0)]]],
  maple: () => [[[new B.CylinderGeometry(0.16, 0.26, 2.2, 6), Mx(0, 1.1, 0), [0.32, 0.22, 0.16]]], [[new B.IcosahedronGeometry(1.4, 0), Mx(0, 3.0, 0, 0, 0, 0, 1.2, 0.8, 1.2)], [new B.IcosahedronGeometry(1.0, 0), Mx(0.9, 2.6, 0.4), [0.85, 0.85, 0.85]], [new B.IcosahedronGeometry(0.9, 0), Mx(-0.8, 2.7, -0.3), [1.1, 1.1, 1.1]]]],
  sakura: () => [[[new B.CylinderGeometry(0.15, 0.28, 2.0, 6), Mx(0, 1.0, 0, 0, 0, 0.1), [0.3, 0.2, 0.18]], [new B.CylinderGeometry(0.08, 0.12, 1.4, 5), Mx(0.5, 2.1, 0, 0, 0, -0.7), [0.3, 0.2, 0.18]]], [[new B.IcosahedronGeometry(1.3, 0), Mx(0.2, 2.9, 0, 0, 0, 0, 1.3, 0.75, 1.3)], [new B.IcosahedronGeometry(0.9, 0), Mx(1.1, 2.6, 0.3), [1.08, 1.0, 1.04]], [new B.IcosahedronGeometry(0.8, 0), Mx(-0.8, 2.5, -0.5), [0.92, 0.92, 0.92]]]],
  jungle: () => [[[new B.CylinderGeometry(0.22, 0.4, 4.2, 6), Mx(0, 2.1, 0), [0.36, 0.26, 0.18]], [new B.CylinderGeometry(0.08, 0.1, 1.5, 4), Mx(0.6, 0.5, 0, 0, 0, 0.9), [0.36, 0.26, 0.18]]], [[new B.IcosahedronGeometry(1.9, 0), Mx(0, 4.8, 0, 0, 0, 0, 1.3, 0.6, 1.3)], [new B.IcosahedronGeometry(1.2, 0), Mx(1.2, 4.2, 0.6), [0.85, 0.85, 0.85]], [new B.BoxGeometry(2.2, 0.05, 0.6), Mx(0.8, 3.4, 0, 0, 0.6, -0.5), [1.1, 1.1, 1.1]], [new B.BoxGeometry(2.2, 0.05, 0.6), Mx(-0.8, 3.6, 0.2, 0, -0.9, 0.5), [1.1, 1.1, 1.1]]]],
  dead: () => [[[new B.CylinderGeometry(0.14, 0.3, 3.2, 5), Mx(0, 1.6, 0, 0, 0, 0.08), [0.3, 0.26, 0.24]], [new B.CylinderGeometry(0.05, 0.1, 1.5, 4), Mx(0.55, 2.6, 0, 0, 0, -0.9), [0.3, 0.26, 0.24]], [new B.CylinderGeometry(0.05, 0.09, 1.3, 4), Mx(-0.5, 2.3, 0.2, 0.3, 0, 0.8), [0.3, 0.26, 0.24]], [new B.CylinderGeometry(0.04, 0.07, 1.0, 4), Mx(0.1, 3.4, -0.3, -0.6, 0, 0.2), [0.3, 0.26, 0.24]]], [[new B.IcosahedronGeometry(0.22, 0), Mx(1.1, 3.0, 0)], [new B.IcosahedronGeometry(0.2, 0), Mx(-1.0, 2.75, 0.4)]]],
  coral: () => [[], [[new B.CylinderGeometry(0.12, 0.3, 2.2, 6), Mx(0, 1.1, 0)], [new B.CylinderGeometry(0.08, 0.14, 1.4, 5), Mx(0.5, 1.9, 0, 0, 0, -0.6)], [new B.CylinderGeometry(0.08, 0.14, 1.3, 5), Mx(-0.45, 1.7, 0.2, 0.2, 0, 0.7)], [new B.SphereGeometry(0.22, 6, 4), Mx(0.9, 2.45, 0)], [new B.SphereGeometry(0.2, 6, 4), Mx(-0.85, 2.2, 0.25)], [new B.SphereGeometry(0.24, 6, 4), Mx(0, 2.25, 0)]]],
  lolli: () => [[[new B.CylinderGeometry(0.07, 0.07, 2.6, 6), Mx(0, 1.3, 0), [0.95, 0.95, 0.92]]], [[new B.CylinderGeometry(0.85, 0.85, 0.24, 14), Mx(0, 3.2, 0, Math.PI / 2, 0, 0)], [new B.TorusGeometry(0.55, 0.08, 4, 14), Mx(0, 3.2, 0.13), [1.25, 1.25, 1.25]]]],
};
// ---------- material with wind sway ----------
const U = { uT: { value: 0 } };
function swayMat(k = 0.08, opts = {}) { const m = toonMat({ ...opts }); m.onBeforeCompile = sh => { sh.uniforms.uT = U.uT; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  #ifdef USE_INSTANCING
  float ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.23; transformed.x += sin(uT * 1.8 + ph) * ${k.toFixed(3)} * position.y * position.y; transformed.z += cos(uT * 1.3 + ph) * ${(k * 0.6).toFixed(3)} * position.y * position.y;
  #endif`); }; m.customProgramCacheKey = () => 'sway' + k; m.userData.keep = true; return m; }
// ---------- placement ----------
function sampler(I) { const C = I.colliders, npcs = I.npcs || [], R = I.R; const sp = I.spawn || [0, 0]; const dock = I.dock;
  return (x, z, m = 0.6) => { const y = I.hf(x, z); if (Math.hypot(x, z) > R * 1.05) return null; for (const c of C) { if (c.r != null) { if (Math.hypot(x - c.x, z - c.z) < c.r + m) return null; } else if (c.hw != null) { const ca = Math.cos(-(c.rot || 0)), sa = Math.sin(-(c.rot || 0)); const dx = x - c.x, dz = z - c.z; const lx = dx * ca - dz * sa, lz = dx * sa + dz * ca; if (Math.abs(lx) < c.hw + m && Math.abs(lz) < c.hd + m) return null; } }
    for (const n of npcs) if (Math.hypot(x - n.x, z - n.z) < 2.2) return null; if (Math.hypot(x - sp[0], z - sp[1]) < 3) return null; if (dock && Math.abs(x - dock.x) < 4 && z > dock.z0 - 6) return null;
    if (I.paint && I.paint(x, z, y)) return null; const s = Math.abs(I.hf(x + 0.7, z) - I.hf(x - 0.7, z)) + Math.abs(I.hf(x, z + 0.7) - I.hf(x, z - 0.7)); return { y, s }; }; }
function cols(list, r) { return new B.Color(list[Math.floor(r() * list.length) % list.length]); }
// ---------- build ----------
export function buildMapFx(g, I) { if (I._mapfx) return; I._mapfx = 1; const lv = LV(), D = DENS[lv]; const th = (IDEFS[I.id] || {}).theme || THEME_OF[I.id] || 'town'; const cfg = T[th] || T.town; const R = I.R;
  const seed = [...I.id].reduce((a, c) => a * 31 + c.charCodeAt(0), 11) >>> 0; const r = rng(seed); const ok = sampler(I); const root = new B.Group(); root.name = 'mapfx'; I.group.add(root); const area = (R / 88) ** 2;
  const fire = th === 'fireice'; const tc = (x) => fire && x > 0;
  // 1) trees (instanced per kind, trunks + tinted tops); colliders so the player bumps into them
  const nTree = Math.round(42 * D.tree * cfg.n[3] * area); const byKind = {}; let tries = 0;
  for (let i = 0; i < nTree && tries < nTree * 30; tries++) { const a = r() * 6.283, d = Math.sqrt(r()) * R * 0.95; const x = Math.cos(a) * d, z = Math.sin(a) * d; let kind = cfg.trees[Math.floor(r() * cfg.trees.length)]; if (fire) kind = x > 0 ? 'dead' : 'snowpine';
    const q = ok(x, z, 1.4); if (!q || q.s > 1.4) continue; const beach = q.y < 1.3 && Math.hypot(x, z) > R * 0.72; if (beach && kind !== 'palm' && kind !== 'coral' && kind !== 'cactus') { if (cfg.trees.includes('palm') || th === 'town' || th === 'village') kind = 'palm'; else continue; } if (!beach && q.y < 1.3) continue; if (!beach && kind === 'palm' && r() < 0.6 && !['desert', 'cactus', 'sea', 'park', 'canal'].includes(th)) continue;
    if (q.y < 0.95) continue; (byKind[kind] = byKind[kind] || []).push([x, q.y - 0.1, z, r() * 6.283, 0.8 + r() * 0.55, cols(cfg.tc, r)]); I.colliders.push({ x, z, r: 0.45 }); i++; }
  for (const [kind, L] of Object.entries(byKind)) { const [tr, tp] = KINDS[kind](); const m4 = new B.Matrix4(); const add = (parts, tint) => { if (!parts.length) return; const geo = merge(parts); const im = new B.InstancedMesh(geo, swayMat(kind === 'palm' ? 0.004 : 0.002), L.length);
      L.forEach(([x, y, z, ry, s, c], k) => { im.setMatrixAt(k, Mx(x, y, z, 0, ry, 0, s)); im.setColorAt(k, tint ? c.clone().multiplyScalar(0.9 + (k % 5) * 0.05) : new B.Color(1, 1, 1)); }); im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); root.add(im); };
    add(tr, false); add(tp, true); }
  // 2) bushes (3-blob clusters), 3) pebbles
  const bushG = merge([[new B.IcosahedronGeometry(0.75, 0), Mx(0, 0.45, 0)], [new B.IcosahedronGeometry(0.55, 0), Mx(0.6, 0.32, 0.2), [0.86, 0.86, 0.86]], [new B.IcosahedronGeometry(0.5, 0), Mx(-0.5, 0.3, -0.25), [1.1, 1.1, 1.1]]]);
  const nB = Math.round(150 * D.bush * cfg.n[2] * area); const bl = []; tries = 0; while (bl.length < nB && tries++ < nB * 20) { const a = r() * 6.283, d = Math.sqrt(r()) * R * 0.95; const x = Math.cos(a) * d, z = Math.sin(a) * d; if (noise2(x * 0.06 + 3, z * 0.06) < 0.42) continue; const q = ok(x, z, 0.9); if (!q || q.y < 1.1 || q.s > 1.6) continue; bl.push([x, q.y - 0.05, z]); }
  if (bl.length) { const im = new B.InstancedMesh(bushG, swayMat(0.03), bl.length); bl.forEach(([x, y, z], k) => { const s = 0.7 + r() * 0.7; im.setMatrixAt(k, Mx(x, y, z, 0, r() * 6.283, 0, s, s * (0.8 + r() * 0.3), s)); const c = tc(x) ? new B.Color(0x4a3a3a) : cols(cfg.bush, r); im.setColorAt(k, c.multiplyScalar(0.85 + r() * 0.3)); }); im.computeBoundingSphere(); root.add(im); }
  const nP = Math.round(160 * D.peb * area); if (nP) { const pl = []; tries = 0; while (pl.length < nP && tries++ < nP * 10) { const a = r() * 6.283, d = Math.sqrt(r()) * R; const x = Math.cos(a) * d, z = Math.sin(a) * d; const y = I.hf(x, z); if (y < 0.1 || y > 1.6 && r() < 0.6) continue; const q = ok(x, z, 0.3); if (!q) continue; pl.push([x, q.y, z]); }
    const im = new B.InstancedMesh(colorize(new B.IcosahedronGeometry(0.22, 0), W), toonMat(), pl.length); pl.forEach(([x, y, z], k) => { const s = 0.5 + r() * 1.2; im.setMatrixAt(k, Mx(x, y + 0.03, z, r(), r() * 6, r(), s, s * 0.6, s)); im.setColorAt(k, new B.Color(0x8a8478).multiplyScalar(0.8 + r() * 0.4)); }); im.computeBoundingSphere(); root.add(im); }
  // 4) grass tufts + flowers in chunks (distance LOD)
  const CH = 40; const chunks = new Map(); const tuftG = tuftGeo(); const stemG = colorize(new B.CylinderGeometry(0.02, 0.025, 0.5, 3).translate(0, 0.25, 0), [0.35, 0.6, 0.3]); const headG = colorize(new B.OctahedronGeometry(0.11, 0).translate(0, 0.52, 0), W);
  const put = (kind, x, y, z, s, c, ry) => { const k = Math.floor(x / CH) + ',' + Math.floor(z / CH); let ch = chunks.get(k); if (!ch) chunks.set(k, ch = { x: (Math.floor(x / CH) + 0.5) * CH, z: (Math.floor(z / CH) + 0.5) * CH, t: [], f: [] }); ch[kind].push([x, y, z, s, c, ry]); };
  const nT = Math.round(2800 * D.tuft * cfg.n[0] * area); tries = 0; let nt = 0; while (nt < nT && tries++ < nT * 6) { const a = r() * 6.283, d = Math.sqrt(r()) * R * 0.98; const x = Math.cos(a) * d, z = Math.sin(a) * d; if (noise2(x * 0.09, z * 0.09) < 0.3 + r() * 0.2) continue; const q = ok(x, z, 0.25); if (!q || q.y < 1.0 || q.s > 1.8) continue; nt++;
    put('t', x, q.y - 0.02, z, 0.7 + r() * 0.8, (tc(x) ? new B.Color(0x5a4a3a) : cols(cfg.tuft, r)).multiplyScalar(0.8 + r() * 0.35), r() * 6.283); }
  const nF = cfg.fl.length ? Math.round(520 * D.flower * cfg.n[1] * area) : 0; tries = 0; let nf = 0; while (nf < nF && tries++ < nF * 10) { const a = r() * 6.283, d = Math.sqrt(r()) * R * 0.95; const x = Math.cos(a) * d, z = Math.sin(a) * d; if (noise2(x * 0.07 + 9, z * 0.07 - 4) < 0.55) continue; const q = ok(x, z, 0.3); if (!q || q.y < 1.1 || q.s > 1.4) continue; nf++;
    put('f', x, q.y - 0.02, z, 0.8 + r() * 0.6, cols(cfg.fl, r), r() * 6.283); }
  const tMat = swayMat(0.16), sMat = swayMat(0.16), hMat = swayMat(0.16, { emissive: th === 'future' || th === 'spooky' ? 0x222222 : 0x000000 }); const LOD = [];
  for (const ch of chunks.values()) { const grp = new B.Group(); const mk = (geo, mat, L, f) => { if (!L.length) return; const im = new B.InstancedMesh(geo, mat, L.length); L.forEach((e, k) => { im.setMatrixAt(k, Mx(e[0], e[1], e[2], 0, e[5], 0, e[3])); im.setColorAt(k, f(e)); }); im.computeBoundingSphere(); grp.add(im); };
    mk(tuftG, tMat, ch.t, e => e[4]); mk(stemG, sMat, ch.f, () => new B.Color(1, 1, 1)); mk(headG, hMat, ch.f, e => e[4]); root.add(grp); LOD.push({ g: grp, x: ch.x, z: ch.z, nT: ch.t.length }); }
  // 5) lanterns: house lanterns + lamp posts along the paths; halos glow at dusk/night
  const lanP = []; for (const c of I.colliders) if (c.lan) for (const v of c.lan) lanP.push(v.clone());
  if (I.paths) { for (const [a, b2] of I.paths) { const L = Math.hypot(b2[0] - a[0], b2[1] - a[1]); for (let s = 10; s < L - 4; s += 16) { const u = s / L; const nx = -(b2[1] - a[1]) / L, nz = (b2[0] - a[0]) / L; const x = a[0] + (b2[0] - a[0]) * u + nx * 2.8, z = a[1] + (b2[1] - a[1]) * u + nz * 2.8; const q = ok(x, z, 0.4); if (!q || q.y < 1) continue; lanP.push(new B.Vector3(x, q.y + 2.45, z)); (I._posts = I._posts || []).push([x, q.y, z]); I.colliders.push({ x, z, r: 0.25 }); } } }
  if (I._posts && I._posts.length) { const post = merge([[new B.CylinderGeometry(0.07, 0.1, 2.3, 6), Mx(0, 1.15, 0), [0.18, 0.16, 0.15]], [new B.BoxGeometry(0.34, 0.42, 0.34), Mx(0, 2.45, 0), [0.15, 0.13, 0.12]], [new B.ConeGeometry(0.3, 0.25, 4), Mx(0, 2.78, 0, 0, Math.PI / 4, 0), [0.15, 0.13, 0.12]], [new B.BoxGeometry(0.24, 0.3, 0.24), Mx(0, 2.45, 0), [1.0, 0.86, 0.5]]]);
    const im = new B.InstancedMesh(post, toonMat({ emissive: 0x2a1a00 }), I._posts.length); I._posts.forEach(([x, y, z], k) => im.setMatrixAt(k, Mx(x, y, z))); im.computeBoundingSphere(); root.add(im); }
  const glowT = glowTex(); const lanC = new B.Color(cfg.lan || 0xffc070);
  let halo = null; if (lanP.length) { const geo = new B.BufferGeometry().setFromPoints(lanP); halo = new B.Points(geo, new B.PointsMaterial({ map: glowT, color: lanC, size: 2.6, transparent: true, opacity: 0.2, depthWrite: false, blending: B.AdditiveBlending, fog: false })); halo.renderOrder = 3; root.add(halo); }
  // 6) chimney smoke
  const smk = I.colliders.filter(c => c.smoke).slice(0, D.smoke).map(c => c.smoke); const SN = 10; let smoke = null; const sp = [];
  if (smk.length) { const P = new Float32Array(smk.length * SN * 3); for (let i = 0; i < smk.length * SN; i++) sp.push({ s: smk[Math.floor(i / SN)], t: (i % SN) / SN }); const geo = new B.BufferGeometry(); geo.setAttribute('position', new B.BufferAttribute(P, 3));
    smoke = new B.Points(geo, new B.PointsMaterial({ map: glowT, color: 0xd8d8d8, size: 1.5, transparent: true, opacity: 0.38, depthWrite: false })); smoke.frustumCulled = false; root.add(smoke); }
  // 7) light shafts (high): crossed additive planes slanted along the sun, over forest / plaza
  const shafts = []; const nS = Math.round(D.shafts * (cfg.shafts || 1)); if (nS) { const sm = new B.MeshBasicMaterial({ map: shaftTex(), color: 0xfff2c8, transparent: true, opacity: 0, depthWrite: false, blending: B.AdditiveBlending, side: B.DoubleSide, fog: false });
    for (let i = 0; i < nS * 4 && shafts.length < nS; i++) { const a = r() * 6.283, d = R * (0.2 + r() * 0.6); const x = Math.cos(a) * d, z = Math.sin(a) * d; const y = I.hf(x, z); if (y < 1.2) continue; const gp = new B.Group(); for (let k = 0; k < 2; k++) { const pl = new B.Mesh(new B.PlaneGeometry(3.2 + r() * 2, 16), sm); pl.rotation.y = k * Math.PI / 2; gp.add(pl); } gp.position.set(x, y + 7, z); gp.rotation.set(0.35, r() * 6.283, 0.25); root.add(gp); shafts.push(gp); } }
  // 8) atmosphere particles around the camera
  const parts = makeParts(cfg.parts, D.parts, th); root.add(parts.pts);
  // 9) water heightmap (true shoreline foam / depth), fog per theme
  const wu = g.water.userData.mat.uniforms; if (wu.hm) { const S = R * 2.6, N = 128; const data = new Uint8Array(N * N * 4); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = (i + 0.5) / N * S - S / 2, z = (j + 0.5) / N * S - S / 2; const h = Math.max(-8, Math.min(4, I.hf(x, z))); const v = Math.round((h + 8) / 12 * 255); data.set([v, v, v, 255], (j * N + i) * 4); }
    if (wu.hm.value) wu.hm.value.dispose(); const tx = new B.DataTexture(data, N, N, B.RGBAFormat); tx.magFilter = tx.minFilter = B.LinearFilter; tx.needsUpdate = true; wu.hm.value = tx; wu.hmS.value = S; wu.hmOn.value = 1; }
  if (g.scene.fog && cfg.fog) { g.scene.fog.near = cfg.fog[0]; g.scene.fog.far = qv().far * cfg.fog[1]; if (cfg.fogTint) { g.scene.fog.color.lerp(new B.Color(cfg.fogTint), 0.35); if (g.amb && g.amb.b) g.amb.b.fog.copy(g.scene.fog.color); } wu.fogN.value = g.scene.fog.near; wu.fogF.value = g.scene.fog.far; }
  // ---- per-frame ----
  let lodT = 0; const skyU = g.sky.userData.mat.uniforms; const sunD = new B.Vector3();
  I.updaters.push(dt => { U.uT.value += dt; const cam = g.cam.position; const amb = g.amb; const nk = amb ? amb.nightK() : 0, dk = amb ? amb.duskK() : 0; const ph = amb ? amb.phase() : 0.3;
    // sun path: rises at dawn, sets at dusk
    const u = ((ph + 0.06) % 1) / 0.68; const e = u <= 1 ? Math.sin(u * Math.PI) * 1.05 - 0.06 : -0.4; const az = Math.PI * (Math.min(u, 1) - 0.5) * 0.9; sunD.set(Math.sin(az) * Math.cos(e), Math.sin(e), -Math.cos(az) * Math.cos(e)).normalize();
    if (skyU.sunDir && !(g.cut && g.cut.sky)) skyU.sunDir.value.copy(sunD); if (skyU.fogC && g.scene.fog) skyU.fogC.value.copy(g.scene.fog.color); if (skyU.dusk) { skyU.dusk.value = dk; skyU.night.value = nk; skyU.t.value += dt; skyU.hq.value = lv >= 1 ? 1 : 0; }
    if (wu.sunDir) { wu.sunDir.value.copy(sunD.y > 0.05 ? sunD : new B.Vector3(-0.3, 0.4, -0.8).normalize()); wu.night.value = nk; wu.hq.value = lv >= 1 ? 1 : 0; wu.sunC.value.setRGB(1, 0.92 - dk * 0.3, 0.8 - dk * 0.45); }
    if ((lodT -= dt) <= 0) { lodT = 0.25; const tr = (lv === 2 ? 58 : 42) * D.chunk; for (const c of LOD) { const d = Math.hypot(c.x - cam.x, c.z - cam.z); c.g.visible = d < tr + CH * 0.7; } }
    if (halo) { halo.material.opacity = 0.1 + Math.max(nk, dk * 0.6) * 1.0; halo.material.size = 2.4 + nk * 2.2 + Math.sin(U.uT.value * 3) * 0.08; }
    if (smoke) { const P = smoke.geometry.attributes.position; sp.forEach((o, i) => { o.t += dt * 0.22; if (o.t > 1) o.t -= 1; const k = o.t; P.setXYZ(i, o.s.x + Math.sin(k * 5 + i) * 0.3 + k * 1.6, o.s.y + k * 5.5, o.s.z + k * 0.8); }); P.needsUpdate = true; smoke.material.opacity = 0.32 * (1 - nk * 0.5); smoke.material.size = 1.4 + Math.sin(U.uT.value) * 0.1; }
    for (const s of shafts) { const d = Math.hypot(s.position.x - cam.x, s.position.z - cam.z); const day = (1 - nk) * (0.35 + dk * 0.9 + (ph < 0.12 ? 0.5 : 0)); s.children[0].material.opacity = 0.11 * day * Math.min(1, Math.max(0, (d - 5) / 10)) * Math.max(0, 1 - d / 90); }
    parts.update(dt, cam, nk, dk); });
  // quality change: hide tufts on Low, re-tune particles
  const qh = () => { const l = LV(); for (const c of LOD) c.g.children.forEach((m, i) => { if (i === 0) m.visible = l > 0 || c.nT < 40; }); parts.setN(DENS[l].parts); }; qualityHooks.push(qh); I.updaters.push(() => { if (I !== g.island) { const i = qualityHooks.indexOf(qh); if (i >= 0) qualityHooks.splice(i, 1); } });
  return root; }
// ---------- textures ----------
let GT = null, ST2 = null;
function glowTex() { if (GT) return GT; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); GT = new B.CanvasTexture(c); return GT; }
function shaftTex() { if (ST2) return ST2; const c = document.createElement('canvas'); c.width = 32; c.height = 128; const x = c.getContext('2d'); const gh = x.createLinearGradient(0, 0, 32, 0); gh.addColorStop(0, 'rgba(255,255,255,0)'); gh.addColorStop(0.5, 'rgba(255,255,255,1)'); gh.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gh; x.fillRect(0, 0, 32, 128);
  x.globalCompositeOperation = 'destination-in'; const gv = x.createLinearGradient(0, 0, 0, 128); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.3, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gv; x.fillRect(0, 0, 32, 128); ST2 = new B.CanvasTexture(c); return ST2; }
// ---------- camera-local particles (GPU wrap; no per-frame CPU work) ----------
const PK = { dust: [0xfff0c8, 0.08, [0.2, 0.1, 0.15], 0], fireflies: [0xd8ff6a, 0.16, [0.3, 0.2, 0.25], 1], petals: [0xffb0d0, 0.16, [0.8, -1.1, 0.4], 2], sand: [0xe8cc90, 0.08, [3.2, 0.05, 1.2], 0], emberSnow: [0xffffff, 0.12, [0.2, -0.9, 0.2], 3], bubbles: [0xbfefff, 0.14, [0.05, 0.9, 0.05], 4], mist: [0xb8a8d8, 1.8, [0.4, 0.02, 0.3], 5], sparkle: [0xffffff, 0.12, [0.1, 0.15, 0.1], 6], holo: [0x5affff, 0.12, [0, 0.3, 0], 7] };
function makeParts(kind, n0, th) { const [col, size, vel, mode] = PK[kind] || PK.dust; const NMAX = 240; const P = new Float32Array(NMAX * 3), S = new Float32Array(NMAX); for (let i = 0; i < NMAX; i++) { P.set([Math.random(), Math.random(), Math.random()], i * 3); S[i] = Math.random(); }
  const geo = new B.BufferGeometry(); geo.setAttribute('position', new B.BufferAttribute(P, 3)); geo.setAttribute('seed', new B.BufferAttribute(S, 1)); geo.setDrawRange(0, Math.min(NMAX, n0));
  const box = mode === 5 ? new B.Vector3(70, 6, 70) : new B.Vector3(44, mode === 1 ? 6 : 18, 44);
  const m = new B.ShaderMaterial({ transparent: true, depthWrite: false, blending: mode === 5 ? B.NormalBlending : B.AdditiveBlending, fog: false,
    uniforms: { cam: { value: new B.Vector3() }, t: { value: 0 }, box: { value: box }, vel: { value: new B.Vector3(...vel) }, col: { value: new B.Color(col) }, sz: { value: size }, night: { value: 0 }, dusk: { value: 0 }, mode: { value: mode } },
    vertexShader: `uniform vec3 cam; uniform float t; uniform vec3 box; uniform vec3 vel; uniform float sz; uniform float mode; attribute float seed; varying float vS; varying float vA;
      void main(){ vec3 p = position*box + vel*t*(0.6+seed*0.8) + vec3(sin(t*0.7+seed*20.0), sin(t*0.9+seed*13.0)*0.5, cos(t*0.6+seed*17.0))*(mode==2.0?1.2:0.6);
        vec3 base = cam - box*0.5; if (mode == 1.0 || mode == 5.0) base.y = cam.y - 2.0; p = base + mod(p - base, box);
        vec3 rel = p - cam; float edge = 1.0 - smoothstep(0.35, 0.5, max(abs(rel.x)/box.x, abs(rel.z)/box.z));
        vA = edge; vS = seed; vec4 mv = viewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = clamp(sz*(300.0/-mv.z), 1.0, mode==5.0?260.0:22.0); }`,
    fragmentShader: `uniform vec3 col; uniform float t; uniform float night; uniform float dusk; uniform float mode; varying float vS; varying float vA;
      void main(){ vec2 q = gl_PointCoord-0.5; float d = length(q); float a = smoothstep(0.5, 0.0, d);
        float day = 1.0 - night; float k = 1.0; vec3 c = col;
        if (mode == 0.0) { k = (0.35 + dusk*0.6) * day * (0.6 + 0.4*sin(t*2.0 + vS*30.0)); }
        else if (mode == 1.0) { k = night * pow(max(0.0, sin(t*(1.5+vS) + vS*40.0)), 3.0) * 1.6; c = mix(col, vec3(1.0,0.9,0.4), vS); }
        else if (mode == 2.0) { a = smoothstep(0.5, 0.2, length(q*vec2(1.0, 2.2))); k = 0.75 * (0.6+day*0.4); c = mix(col, vec3(1.0), vS*0.4); }
        else if (mode == 3.0) { if (vS > 0.5) { c = vec3(1.0, 0.45, 0.1); k = 1.0; } else k = 0.8; }
        else if (mode == 4.0) { a = smoothstep(0.5, 0.38, d) - smoothstep(0.38, 0.2, d)*0.7; k = 0.6; }
        else if (mode == 5.0) { a *= 0.5; k = 0.18 + night*0.15; }
        else if (mode == 6.0) { k = pow(max(0.0, sin(t*3.0 + vS*50.0)), 8.0) * 1.4; }
        else if (mode == 7.0) { a = step(abs(q.x), 0.3)*step(abs(q.y), 0.3)*0.8; k = 0.6*(0.5+0.5*sin(t*4.0+vS*30.0)); }
        gl_FragColor = vec4(c, a*k*vA); }` });
  const pts = new B.Points(geo, m); pts.frustumCulled = false; pts.renderOrder = 4;
  return { pts, setN: n => geo.setDrawRange(0, Math.min(NMAX, n)), update: (dt, cam, nk, dk) => { m.uniforms.t.value += dt; m.uniforms.cam.value.copy(cam); m.uniforms.night.value = nk; m.uniforms.dusk.value = dk; if (kind === 'dust' && nk > 0.5) { m.uniforms.mode.value = 1; m.uniforms.col.value.set(0xd8ff6a); m.uniforms.sz.value = 0.16; } else if (kind === 'dust') { m.uniforms.mode.value = 0; m.uniforms.col.value.set(col); m.uniforms.sz.value = size; } } }; }
