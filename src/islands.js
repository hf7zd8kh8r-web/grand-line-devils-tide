import { THREE, Builder, mat, WORLD_MAT, noise2, rng } from './engine.js';
import { makeTerrain, addClouds } from './world.js';
import { addTree, addPine, addRock, addHouse, addWindmill, makeWindmillBlades, addDock, addFence, makeBoatSmall } from './models.js';
import { pathPaint, nearPath, signpost, farm, forest, beach, cliffs, camp } from './zones.js';
const GATHER = { orange: ['Buggy Map Scraps', 5, 0xd03030], syrup: ['Kaya\'s Lost Letters', 5, 0xffffff], baratie: ['Sea-King Fillets', 4, 0xff9a8a], arlong: ['Nami\'s Tangerines', 6, 0xff8a1a], loguetown: ['Torn Wanted Posters', 5, 0xf0e0b0],
  whisky: ['Baroque Works Orders', 5, 0x6a3a8a], alabasta: ['Water Barrels', 4, 0x3a8ae0], skypiea: ['Golden Bell Fragments', 5, 0xffd04a], water7: ['Blueprint Pages', 5, 0x6ab0ff], enies: ['Seastone Handcuff Keys', 5, 0xc0c0c0],
  thriller: ['Stolen Shadows', 6, 0x3a1a5a], sabaody: ['Bubble Coating Resin', 5, 0x9ae0ff], amazon: ['Kuja Snake Eggs', 5, 0xd0ff9a], impel: ['Cell Keys', 5, 0xe0c040], marineford: ['Fallen Marine Badges', 6, 0x2a5bb8],
  fishman: ['Energy Steroid Vials', 5, 0xff3a3a], punk: ['Candy Canisters', 5, 0xff9ad0], dressrosa: ['Toy Soldier Parts', 6, 0xff5a5a], zou: ['Medicinal Herbs', 5, 0x5ad05a], wci: ['Wedding Cake Ingredients', 6, 0xffb0e0],
  wano: ['Kaido\'s Sake Jugs', 5, 0xc0503a], egghead: ['Vegapunk Data Chips', 6, 0x5affd0], mirro: ['Mirror Shards', 6, 0xd0a0ff], laughtale: ['Ancient Gold Coins', 7, 0xffd04a] };
const B = THREE;
const box = (w, h, d) => new B.BoxGeometry(w, h, d);

function islandHF(R, bumps = [], flat = 1.2, noiseAmp = 0.5) {
  return (x, z) => {
    const r = Math.hypot(x, z);
    const edge = 1 - smoothstep(R - 14, R + 4, r + (noise2(x * 0.05 + 3, z * 0.05) - 0.5) * 10);
    let h = -4 + (flat + 4) * edge;
    h += (noise2(x * 0.09, z * 0.09) - 0.5) * noiseAmp * edge;
    for (const b of bumps) h += b.h * Math.exp(-((x - b.x) ** 2 + (z - b.z) ** 2) / (b.s * b.s)) * edge;
    return h;
  };
}
function smoothstep(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

function base(def) {
  return { id: def.id, group: new B.Group(), colliders: [], npcs: [], spawns: [], updaters: [], dock: null, R: def.R, spawn: def.spawn, interact: [], landmarks: [] };
}
function addTent(b, hf, x, z, col = 0x9a7a5a) { const y = hf(x, z); b.add(new B.ConeGeometry(2.2, 2.6, 4), col, mat(x, y + 1.3, z, 0, Math.PI / 4)); }
function addStall(b, hf, x, z, rot, col) {
  const y = hf(x, z); const M = (lx, ly, lz) => new B.Matrix4().makeRotationY(rot).setPosition(x, y, z).multiply(mat(lx, ly, lz));
  b.add(box(3, 1, 1.4), 0x8a5a2b, M(0, 0.5, 0)); for (const s of [-1, 1]) b.add(box(0.12, 2.4, 0.12), 0x6a4528, M(s * 1.4, 1.2, -0.6), { outline: false });
  b.add(box(3.4, 0.12, 2), col, M(0, 2.45, 0.1)); return { x, z, hw: 1.6, hd: 0.8, rot };
}
function scatter(b, hf, R, n, seed, avoid, fn) {
  const r = rng(seed); let c = 0, tries = 0;
  while (c < n && tries++ < n * 20) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R; const x = Math.cos(a) * d, z = Math.sin(a) * d; const y = hf(x, z);
    if (y < 1.0) continue; if (avoid.some(v => Math.hypot(x - v[0], z - v[1]) < v[2])) continue; if (avoid.fn && avoid.fn(x, z)) continue; fn(x, y, z, r); c++; }
}

// distant island silhouettes on the horizon (unfogged) so the wider world is always visible
function addHorizon(I, seed) { const sm = new B.MeshBasicMaterial({ color: 0x7d96ae, fog: false, transparent: true, opacity: 0.85, depthWrite: false }); const tm = new B.MeshBasicMaterial({ color: 0x6f9a86, fog: false, transparent: true, opacity: 0.85, depthWrite: false }); const sr = rng(seed + 77);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + sr() * 0.9, d0 = 330 + sr() * 60; const gS = new B.Group(); gS.position.set(Math.cos(a) * d0, -2, Math.sin(a) * d0); gS.userData.horizon = true;
    const h = 18 + sr() * 26, w = 40 + sr() * 40; const m1 = new B.Mesh(new B.ConeGeometry(w * 0.5, h, 7), sm); m1.position.y = h / 2; m1.scale.z = 0.5; gS.add(m1);
    const m2 = new B.Mesh(new B.ConeGeometry(w * 0.32, h * 0.65, 6), tm); m2.position.set(w * 0.35, h * 0.32, 0); m2.scale.z = 0.5; gS.add(m2);
    gS.lookAt(0, -2, 0); gS.renderOrder = -1; I.group.add(gS); } }
export const ISL_K = 1.4; // map expansion factor (radius); ~1.95x area vs the original layouts
export function buildWindmill() {
  const K = ISL_K, R = Math.round(66 * K); const I = base({ id: 'windmill', R, spawn: [3, 25] });
  const T = [0, 4], DZ = R - 16, CW = [-42, -34], CE = [49, -29], HILL = [0, -60], FARM = [46, 2], FOR = [-58, 2], CLF = [58, -54], MILL = [-34, 31];
  const hf = islandHF(R, [{ x: HILL[0], z: HILL[1], h: 9, s: 20 }, { x: CW[0], z: CW[1], h: 3, s: 14 }, { x: CE[0], z: CE[1], h: 3, s: 14 }, { x: CLF[0], z: CLF[1], h: 7, s: 13 }, { x: 56, z: 31, h: 2, s: 12 }, { x: FOR[0], z: FOR[1], h: 2.5, s: 16 }], 1.3, 0.6);
  I.hf = hf;
  const P = [[T, [0, DZ]], [T, [0, HILL[1] + 12]], [T, [-14, -14]], [[-14, -14], CW], [T, [16, -12]], [[16, -12], CE], [T, FARM], [T, MILL], [[-14, 6], FOR], [[-16, 4], [-14, -14]]]; I.paths = P;
  const b = new Builder();
  b.add(new B.BoxGeometry(1, 1, 1), 0, mat(0, -100, 0), { outline: false }); // seed
  const pp = pathPaint(P, 1.9); const plaza = (x, z) => Math.hypot(x - T[0], z - T[1]) < 9;
  const terrain = makeTerrain(hf, R * 2.6, Math.round(R * 1.3), { paint: I.paint = (x, z, y) => (y > 0.9 && plaza(x, z)) ? 0xd2b384 : pp(x, z, y) });
  I.group.add(terrain);
  const C = I.colliders;
  const H = (x, z, rot, o) => { const c = addHouse(b, x, hf(x, z) - 0.15, z, rot, o); C.push(c); return c; };
  H(-12.6, 2.8, Math.PI / 2, { w: 7, d: 5.5, h: 3.4, wall: 0xf3dfb0, roof: 0x3d7a4a, sign: 0xf3c34a, chimney: true }); // Party's Bar
  H(12.6, -1.4, -Math.PI / 2, { wall: 0xe8d3b0, roof: 0x9a3a2a, sign: 0xb0b8c4 }); // smithy
  H(-11, -17, 0.2, { roof: 0xc06a3a }); H(14, -19.6, -0.3, { roof: 0x4a6aa8 }); H(-22.4, 19.6, 1.2, { roof: 0xb0503a });
  H(22.4, 19.6, -1.4, { roof: 0x6a8a3a, w: 4.5 }); H(-28, -2.8, 1.5, { roof: 0x8a4a8a, w: 4.5 }); H(28, 5.6, -1.6, { roof: 0xc0503a });
  H(-8, 36, 0.1, { roof: 0x3a6a9a }); H(9, 44, -0.2, { roof: 0xd08a3a, w: 4.5 }); H(-30, 44, 0.9, { roof: 0x6a8a3a }); // outskirts
  C.push(addWindmill(b, MILL[0], hf(MILL[0], MILL[1]), MILL[1], 0.5));
  const blades = makeWindmillBlades(); blades.position.set(MILL[0] + Math.sin(0.5) * 2.0, hf(MILL[0], MILL[1]) + 6.6, MILL[1] + Math.cos(0.5) * 2.0); blades.rotation.y = 0.5; I.group.add(blades);
  I.updaters.push((dt) => { blades.rotation.z += dt * 0.6; });
  C.push(addStall(b, hf, 12, 20, Math.PI, 0xd04a8a)); // fruit stand
  C.push(addStall(b, hf, -12, 20, Math.PI, 0x4a9ad0)); // tailor
  C.push(addStall(b, hf, 20, 9, -Math.PI / 2, 0xc0283a)); // gacha
  C.push(addStall(b, hf, -22, 13, Math.PI / 2, 0x6a3a8a)); // collector
  // well in plaza
  const wy = hf(T[0], T[1]); b.add(new B.CylinderGeometry(1, 1.1, 0.9, 10), 0x9a9a9a, mat(T[0], wy + 0.45, T[1])); b.add(new B.BoxGeometry(2.4, 0.15, 0.3), 0x6a4528, mat(T[0], wy + 2.1, T[1])); for (const s of [-1, 1]) b.add(box(0.12, 2, 0.12), 0x6a4528, mat(T[0] + s * 1.05, wy + 1.1, T[1]), { outline: false });
  C.push({ x: T[0], z: T[1], r: 1.2 });
  // dock to the south
  addDock(b, 0, 0, DZ, 0, 16); I.dock = { x: 0, z: DZ + 8, y: 0.85, z0: DZ, z1: DZ + 16.2 };
  const boat = makeBoatSmall(); boat.position.set(3.2, -0.1, DZ + 10); I.group.add(boat); I.boat = boat;
  // zones
  const zr = rng(77); farm(b, hf, C, FARM[0], FARM[1], 16, 12); forest(b, hf, C, FOR[0], FOR[1], 15, 34, zr, 0.45); cliffs(b, hf, C, CLF[0], CLF[1], zr);
  beach(b, hf, C, R, 0.25, 1.15, zr); beach(b, hf, C, R, 2.0, 2.85, zr);
  camp(b, hf, C, CW[0], CW[1], 0x8a6a4a, 0x2a2a2a, zr); camp(b, hf, C, CE[0], CE[1], 0x7a5a4a, 0x8a2a2a, zr);
  for (const [x, z, r] of [[0, 12, 0], [-14, -14, 0.6], [16, -12, -0.6], [-16, 4, 1.4], [0, -30, 0]]) signpost(b, hf, x, z + 2.2, r);
  // boss hill arena markers (rocks ring)
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const x = HILL[0] + Math.cos(a) * 12, z = HILL[1] + Math.sin(a) * 12; if (Math.sin(a) > 0.6) continue; addRock(b, x, hf(x, z), z, 1.3, Math.random); C.push({ x, z, r: 1.3 }); }
  // trees, rocks (kept off paths, town, camps and zones)
  const avoid = [[T[0], T[1] + 8, 32], [0, DZ, 7], [MILL[0], MILL[1], 6], [HILL[0], HILL[1], 14], [CW[0], CW[1], 11], [CE[0], CE[1], 11], [FARM[0] - 3, FARM[1], 14], [FOR[0], FOR[1], 16], [CLF[0], CLF[1], 9]]; avoid.fn = (x, z) => nearPath(P, x, z, 3);
  scatter(b, hf, R - 8, 90, 7, avoid, (x, y, z, r) => { if (r() < 0.25) addPine(b, x, y, z, 0.9 + r() * 0.6); else addTree(b, x, y, z, 0.8 + r() * 0.6, 0, r); C.push({ x, z, r: 0.5 }); });
  scatter(b, hf, R - 6, 36, 9, avoid, (x, y, z, r) => { addRock(b, x, y, z, 0.4 + r() * 0.8, r); });
  addClouds(b, 18, 3, 260);
  I.group.add(b.build());
  // spawns: bandits live in their own camps, away from town
  const S = I.spawns; const rr = rng(42);
  for (let i = 0; i < 9; i++) { const a = rr() * Math.PI * 2, d = 2 + rr() * 7; const c = i % 2 ? CW : CE; S.push({ type: 'bandit', x: c[0] + Math.cos(a) * d, z: c[1] + Math.sin(a) * d, lvl: 1 + (i % 3) }); }
  for (let i = 0; i < 4; i++) { const c = i % 2 ? CW : CE; S.push({ type: 'thug', x: c[0] + (i - 1.5) * 1.5, z: c[1] - 4, lvl: 3 + (i % 2) }); }
  S.push({ type: 'higuma', x: HILL[0], z: HILL[1] - 2, lvl: 6, boss: true, arena: { x: HILL[0], z: HILL[1] + 2, r: 13 } });
  // npcs: spread around the plaza / in front of their buildings
  I.npcs.push({ id: 'makino', look: 'makino', name: 'Makino', role: 'quest', x: -7.6, z: 4.2, ry: Math.PI / 2 });
  I.npcs.push({ id: 'woop', look: 'mayor', name: 'Mayor Woop', role: 'quest', x: 4, z: -3.5, ry: 0.4 });
  I.npcs.push({ id: 'smith', look: 'smith', name: 'Blacksmith Gol', role: 'shop', shop: 'weapons1', x: 8, z: -0.4, ry: -Math.PI / 2 });
  I.npcs.push({ id: 'fruit', look: 'villager', name: 'Fruit Seller', role: 'shop', shop: 'rot', x: 12, z: 18.6, ry: 0 });
  I.npcs.push({ id: 'tailor', look: 'rika', name: 'Tailor Nana', role: 'shop', shop: 'wear1', x: -12, z: 18.6, ry: 0 });
  I.npcs.push({ id: 'ship', look: 'villager', name: 'Shipwright Dan', role: 'dock', x: 2.2, z: DZ - 4, ry: Math.PI, over: { shirt: 0x8a5a2b } });
  I.npcs.push({ id: 'roller', look: 'villager', name: 'Gacha Gus', role: 'roller', x: 18.6, z: 9, ry: -Math.PI / 2, over: { shirt: 0xc0283a, hair: 0xffd04a } });
  I.npcs.push({ id: 'trader', look: 'villager', name: 'Collector Pip', role: 'trader', x: -20.6, z: 13, ry: Math.PI / 2, over: { shirt: 0x6a3a8a, hair: 0xaa3333 } });
  I.npcs.push({ id: 'qboard', name: 'Quest Board', role: 'board', x: 0.5, z: 10, ry: 0 });
  I.landmarks = [{ n: "Party's Bar", x: -12.6, z: 2.8 }, { n: 'Windmill', x: MILL[0], z: MILL[1] }, { n: 'Smithy', x: 12.6, z: -1.4 }, { n: 'Bandit Camp', x: CW[0], z: CW[1] }, { n: 'Bandit Camp', x: CE[0], z: CE[1] }, { n: 'Mountain Hill', x: HILL[0], z: HILL[1] },
    { n: 'Farms', x: FARM[0], z: FARM[1] }, { n: 'Fuschia Woods', x: FOR[0], z: FOR[1] }, { n: 'Lighthouse Cliffs', x: CLF[0], z: CLF[1] }, { n: 'Dock', x: 0, z: DZ + 4 }];
  I.palette = { skyTop: 0x3f9be8, skyBot: 0xcfeeff, fog: 0xcfeeff };
  addHorizon(I, 11);
  return I;
}

export function buildShells() {
  const K = ISL_K, R = Math.round(64 * K); const I = base({ id: 'shells', R, spawn: [0, 56] });
  const OZ = -14, T = [0, 18], DZ = R - 16, CW = [-52, -6], CE = [54, 16], FARM = [-44, 38], FOR = [50, -36], CLF = [-50, -52];
  const hf = islandHF(R, [{ x: 0, z: -25 + OZ, h: 1.2, s: 26 }, { x: CE[0], z: CE[1], h: 3, s: 12 }, { x: CW[0], z: CW[1], h: 4, s: 13 }, { x: CLF[0], z: CLF[1], h: 7, s: 13 }, { x: FOR[0], z: FOR[1], h: 2.5, s: 15 }], 1.3, 0.4);
  I.hf = hf; const C = I.colliders;
  const P = [[[0, -8 + OZ], [0, DZ]], [T, [-20, 10]], [[-20, 10], CW], [T, [22, 18]], [[22, 18], CE], [[0, 34], FARM], [[0, 0], [24, -14]], [[24, -14], FOR], [[-20, 10], [-30, -30]], [[-30, -30], CLF]]; I.paths = P;
  const b = new Builder(); const pp = pathPaint(P, 2.2, 0xc9b493);
  const terrain = makeTerrain(hf, R * 2.6, Math.round(R * 1.3), { grass: 0x7fbf55, paint: I.paint = (x, z, y) => (Math.abs(x) < 16 && z < -10 + OZ && z > -40 + OZ && y > 0.9) ? 0xb8b0a0 : pp(x, z, y) });
  I.group.add(terrain);
  // Marine base walls (gate on south side)
  const by = hf(0, -25 + OZ), wallC = 0xdfe3ea;
  const W = (x, z, w, d) => { z += OZ; b.add(box(w, 4.2, d), wallC, mat(x, by + 2.1, z), { grad: 0.25 }); b.add(box(w + 0.1, 0.4, d + 0.1), 0x2a5bb8, mat(x, by + 4.2, z)); C.push({ x, z, hw: w / 2, hd: d / 2, rot: 0 }); };
  W(0, -42, 34, 1); W(-17, -25, 1, 34); W(17, -25, 1, 34); W(-10.5, -8, 13, 1); W(10.5, -8, 13, 1);
  b.add(box(9, 7, 7), 0xeef1f5, mat(0, by + 3.5, -36 + OZ), { grad: 0.3 }); C.push({ x: 0, z: -36 + OZ, hw: 4.5, hd: 3.5, rot: 0 });
  b.add(box(5, 6, 5), 0xeef1f5, mat(0, by + 10, -36 + OZ), { grad: 0.3 }); b.add(new B.ConeGeometry(4, 3, 4), 0x2a5bb8, mat(0, by + 14.5, -36 + OZ, 0, Math.PI / 4));
  b.add(box(3.2, 1.5, 0.2), 0x2a5bb8, mat(0, by + 6, -32.4 + OZ), { outline: false }); b.add(box(2.6, 0.9, 0.05), 0xffffff, mat(0, by + 6, -32.25 + OZ), { outline: false });
  // Morgan statue in courtyard
  b.add(box(2.4, 1.2, 2.4), 0xb0b0b0, mat(0, by + 0.6, -28 + OZ)); b.add(new B.CylinderGeometry(0.6, 0.8, 3.6, 8), 0xc0c4ca, mat(0, by + 3, -28 + OZ)); b.add(new B.SphereGeometry(0.7, 8, 6), 0xc0c4ca, mat(0, by + 5.3, -28 + OZ));
  C.push({ x: 0, z: -28 + OZ, r: 1.6 });
  b.add(new B.CylinderGeometry(0.1, 0.1, 9, 6), 0xdddddd, mat(-12, by + 4.5, -14 + OZ)); b.add(box(2.4, 1.4, 0.06), 0x2a5bb8, mat(-10.8, by + 8.2, -14 + OZ), { outline: false });
  // town (spread out along the main street)
  const H = (x, z, rot, o) => { C.push(addHouse(b, x, hf(x, z) - 0.15, z, rot, o)); };
  H(-12, 8, Math.PI / 2, { roof: 0x2a6aa8, sign: 0xffffff, w: 6 }); H(12, 8, -Math.PI / 2, { roof: 0xc0503a, sign: 0xb0b8c4, w: 6 });
  H(-13, 24, Math.PI / 2, { roof: 0xd08a3a }); H(13, 24, -Math.PI / 2, { roof: 0x7a4a9a, sign: 0xd04a8a });
  H(-13, 40, Math.PI / 2, { roof: 0x4a8a4a }); H(13, 40, -Math.PI / 2, { roof: 0xc06a3a }); H(-30, 18, 1.2, {}); H(30, 28, -1.1, { roof: 0x3a6a9a }); H(-24, 52, 0.6, { roof: 0x8a4a8a }); H(26, 50, -0.6, { roof: 0x6a8a3a, w: 4.5 });
  C.push(addStall(b, hf, 8, 22, -Math.PI / 2, 0x2a2a2a)); C.push(addStall(b, hf, -8, 36, Math.PI / 2, 0xc0283a)); C.push(addStall(b, hf, -8, 28, Math.PI / 2, 0x6a3a8a));
  addDock(b, 0, 0, DZ, 0, 14); I.dock = { x: 0, z: DZ + 8, y: 0.85, z0: DZ, z1: DZ + 14.2 };
  const boat = makeBoatSmall(); boat.position.set(3.2, -0.1, DZ + 10); I.group.add(boat); I.boat = boat;
  const zr = rng(91); farm(b, hf, C, FARM[0], FARM[1], 14, 10, 0xd0c040); forest(b, hf, C, FOR[0], FOR[1], 14, 30, zr, 0.3); cliffs(b, hf, C, CLF[0], CLF[1], zr);
  beach(b, hf, C, R, 0.3, 1.2, zr); beach(b, hf, C, R, 1.95, 2.8, zr);
  camp(b, hf, C, CW[0], CW[1], 0xdfe3ea, 0x2a5bb8, zr); camp(b, hf, C, CE[0], CE[1], 0x6a5a4a, 0x111111, zr);
  for (const [x, z, r] of [[-20, 10, 0.8], [22, 18, -0.8], [0, 34, 0.4], [24, -14, -0.3]]) signpost(b, hf, x + 1.5, z + 1.5, r);
  const avoid = [[0, 24, 26], [0, -25 + OZ, 24], [0, DZ, 7], [CW[0], CW[1], 11], [CE[0], CE[1], 11], [FARM[0] - 3, FARM[1], 13], [FOR[0], FOR[1], 15], [CLF[0], CLF[1], 9]]; avoid.fn = (x, z) => nearPath(P, x, z, 3);
  scatter(b, hf, R - 8, 80, 11, avoid, (x, y, z, r) => { addTree(b, x, y, z, 0.8 + r() * 0.5, r() < 0.3 ? 1 : 0, r); C.push({ x, z, r: 0.5 }); });
  scatter(b, hf, R - 6, 32, 12, avoid, (x, y, z, r) => addRock(b, x, y, z, 0.4 + r() * 0.8, r));
  addClouds(b, 18, 5, 260);
  I.group.add(b.build());
  // spawns: marines garrison the base + a field outpost; Captain Kuro-style rifles hold the east hideout
  const S = I.spawns;
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; S.push(i < 4 ? { type: 'marine', x: -8 + (i % 4) * 5.3, z: -18 + OZ + (i % 2) * 4, lvl: 8 + (i % 4) } : { type: 'marine', x: CW[0] + Math.cos(a) * 5, z: CW[1] + Math.sin(a) * 5, lvl: 8 + (i % 4) }); }
  for (let i = 0; i < 6; i++) S.push({ type: i < 2 ? 'rifle' : 'marine', x: -10 + (i % 3) * 10, z: -24 + OZ - Math.floor(i / 3) * 4, lvl: 9 + (i % 3) });
  for (let i = 0; i < 3; i++) S.push({ type: 'rifle', x: CE[0] - 3 + i * 3, z: CE[1] + i * 2 - 2, lvl: 10 });
  S.push({ type: 'morgan', x: 0, z: -24 + OZ, lvl: 14, boss: true, arena: { x: 0, z: -24 + OZ, r: 12 } });
  I.npcs.push({ id: 'rika', look: 'rika', name: 'Rika', role: 'quest', x: -5, z: 18, ry: Math.PI / 2 });
  I.npcs.push({ id: 'coby', look: 'coby', name: 'Coby', role: 'quest', x: 4, z: -4 + OZ + 2, ry: 0 });
  I.npcs.push({ id: 'surplus', look: 'smith', name: 'Surplus Dealer', role: 'shop', shop: 'weapons2', x: 8.4, z: 8, ry: -Math.PI / 2 });
  I.npcs.push({ id: 'fruit2', look: 'villager', name: 'Shady Fruit Dealer', role: 'shop', shop: 'rot', x: 6.6, z: 22, ry: -Math.PI / 2, over: { shirt: 0x2a2a2a, hair: 0x6a2a8a } });
  I.npcs.push({ id: 'tailor2', look: 'makino', name: 'Tailor Ume', role: 'shop', shop: 'wear2', x: -8.4, z: 8, ry: Math.PI / 2 });
  I.npcs.push({ id: 'ship2', look: 'villager', name: 'Harbor Master', role: 'dock', x: 2.2, z: DZ - 4, ry: Math.PI });
  I.npcs.push({ id: 'roller2', look: 'villager', name: 'Gacha Gus', role: 'roller', x: -6.6, z: 36, ry: Math.PI / 2, over: { shirt: 0xc0283a, hair: 0xffd04a } });
  I.npcs.push({ id: 'trader2', look: 'villager', name: 'Collector Pip', role: 'trader', x: -6.6, z: 28, ry: Math.PI / 2, over: { shirt: 0x6a3a8a, hair: 0xaa3333 } });
  I.npcs.push({ id: 'qboard2', name: 'Quest Board', role: 'board', x: 0, z: 14, ry: 0 });
  I.landmarks = [{ n: 'Marine Base 153', x: 0, z: -30 + OZ }, { n: 'Town', x: T[0], z: T[1] }, { n: 'Marine Outpost', x: CW[0], z: CW[1] }, { n: 'Pirate Hideout', x: CE[0], z: CE[1] }, { n: 'Farms', x: FARM[0], z: FARM[1] }, { n: 'East Woods', x: FOR[0], z: FOR[1] }, { n: 'Lighthouse Cliffs', x: CLF[0], z: CLF[1] }, { n: 'Dock', x: 0, z: DZ + 4 }];
  I.palette = { skyTop: 0x4aa0e0, skyBot: 0xdcefff, fog: 0xdcefff };
  addHorizon(I, 23);
  return I;
}
export const BUILDERS = { windmill: buildWindmill, shells: buildShells };

// ---------------- Generic data-driven islands ----------------
import { IDEFS } from './islanddefs.js';
import { decorate, HFX, PAINT, SEA, LIGHT, GRUNT, NOTREE, TREEN } from './landmarks2.js';
import { ISLANDS, ENEMIES, QUESTS } from './data.js';
const cyl = (a, b, h, s = 10) => new B.CylinderGeometry(a, b, h, s);
const sph = (r, w = 10, h = 8) => new B.SphereGeometry(r, w, h);
const cone = (r, h, s = 8) => new B.ConeGeometry(r, h, s);
// register enemies + quests for all generated islands
for (const [id, d] of Object.entries(IDEFS)) {
  const I = ISLANDS.find(i => i.id === id); I.built = true;
  ENEMIES[id + '_e1'] = { ...d.e1, lookO: { ...d.e1.look, ...((GRUNT[id] || [])[0] || {}) }, look: 'gen' };
  ENEMIES[id + '_e2'] = { ...d.e2, lookO: { ...d.e2.look, ...((GRUNT[id] || [])[1] || {}) }, look: 'gen' };
  const bo = d.boss; ENEMIES[id + '_boss'] = { ...bo, lookO: bo.look, look: 'gen', spd: 3.2, reach: 2.6 + (bo.scale || 1) * 0.4, cd: 1.4, xp: Math.round(bo.hp * 0.45), ber: [Math.round(bo.hp * 0.8), Math.round(bo.hp * 1.0)], boss: true, drop: d.drop + ' (Boss)', scale: bo.scale || 1.25 };
  const L = I.lvl; const g = d.giver;
  QUESTS[id] = [
    { id: id + '1', giver: g, lvl: L, text: `Defeat 6 ${d.e1.name}s`, type: 'kill', target: id + '_e1', n: 6, xp: Math.round(d.e1.hp * 3), ber: Math.round(d.e1.hp * 2.5) },
    { id: id + '2', giver: g, lvl: L + 3, text: `Defeat 5 ${d.e2.name}s`, type: 'kill', target: id + '_e2', n: 5, xp: Math.round(d.e2.hp * 3.4), ber: Math.round(d.e2.hp * 2.8) },
    { id: id + '4', giver: g, lvl: L + 1, text: `Find ${GATHER[id] ? GATHER[id][1] : 5} ${GATHER[id] ? GATHER[id][0] : 'Lost Treasures'}`, type: 'gather', item: (GATHER[id] || ['Lost Treasure'])[0], col: (GATHER[id] || [0, 0, 0xffd04a])[2], n: GATHER[id] ? GATHER[id][1] : 5, xp: Math.round(d.e1.hp * 2.6), ber: Math.round(d.e1.hp * 2.4) },
    { id: id + '5', giver: g, lvl: L + 2, text: `Ambush! Defeat 4 ${d.e1.name}s in 60s`, type: 'kill', target: id + '_e1', n: 4, time: 60, xp: Math.round(d.e1.hp * 3.2), ber: Math.round(d.e1.hp * 3) },
    { id: id + '6', giver: g, lvl: L + 3, text: `Deliver ${g}'s message to the Harbor Master`, type: 'talk', target: 'Harbor Master', n: 1, xp: Math.round(d.e1.hp * 1.6), ber: Math.round(d.e1.hp * 1.5) },
    (L % 2 ? { id: id + '7', giver: g, lvl: L + 4, text: `Collect 3 ${d.drop}s`, type: 'mat', target: d.drop, n: 3, xp: Math.round(d.e2.hp * 3), ber: Math.round(d.e2.hp * 2.6) }
      : { id: id + '7', giver: g, lvl: L + 4, text: `Catch 3 fish off the coast`, type: 'fish', n: 3, xp: Math.round(d.e2.hp * 2.6), ber: Math.round(d.e2.hp * 2.2) }),
    { id: id + '3', giver: g, lvl: L + 6, text: `Defeat ${bo.name}`, type: 'kill', target: id + '_boss', n: 1, xp: Math.round(bo.hp * 1.4), ber: Math.round(bo.hp * 1.6) },
  ];
  { // fun extras: 3 of 6 per island, picked by island
    const xp = Math.round(d.e1.hp * 2.4), ber = Math.round(d.e1.hp * 2.2); const h = [...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
    const fun = [
      { id: id + 'f1', giver: g, lvl: L + 1, text: `The cook wants a RARE fish (Rare or better) — go fishing!`, type: 'rarefish', n: 1, xp: xp * 1.5 | 0, ber: ber * 1.6 | 0 },
      { id: id + 'f2', giver: g, lvl: L + 1, text: `Cook 2 fish for the hungry dock workers (Bag → Fish)`, type: 'cook', n: 2, xp, ber },
      { id: id + 'f3', giver: g, lvl: L + 2, text: `Rush! Get the medicine to the Harbor Master in 50s`, type: 'talk', target: 'Harbor Master', time: 50, n: 1, xp: xp * 1.3 | 0, ber: ber * 1.4 | 0 },
      { id: id + 'f4', giver: g, lvl: L + 2, text: `Show off! Use 8 abilities in battle`, type: 'move', n: 8, xp: xp * 1.2 | 0, ber: ber * 1.1 | 0 },
      { id: id + 'f5', giver: g, lvl: L + 3, text: `Bounty board: defeat any 10 enemies`, type: 'kill', target: '*', n: 10, xp: xp * 2 | 0, ber: ber * 2 | 0 },
      { id: id + 'f6', giver: g, lvl: L + 4, text: `Treasure hunter: fish up a treasure chest`, type: 'chest', n: 1, xp: xp * 1.6 | 0, ber: ber * 1.2 | 0 } ];
    for (let k = 0; k < 3; k++) QUESTS[id].push(fun[(h + k * 2) % 6]); }
  QUESTS[id].sort((a, b) => a.lvl - b.lvl);
}
QUESTS.windmill.push(
  { id: 'wf1', giver: 'Mayor Woop', lvl: 3, text: 'Show off! Use 5 abilities in battle', type: 'move', n: 5, xp: 160, ber: 220 },
  { id: 'wf2', giver: 'Makino', lvl: 3, text: 'Cook a fish for Makino\'s bar (Bag → Fish)', type: 'cook', n: 1, xp: 120, ber: 160 },
  { id: 'wf3', giver: 'Mayor Woop', lvl: 4, text: 'Bounty board: defeat any 8 enemies', type: 'kill', target: '*', n: 8, xp: 260, ber: 320 },
  { id: 'wf4', giver: 'Makino', lvl: 2, text: 'Rush! Bring Makino\'s lunchbox to the Harbor Master in 45s', type: 'talk', target: 'Harbor Master', time: 45, n: 1, xp: 120, ber: 150 });
QUESTS.windmill.sort((a, b) => a.lvl - b.lvl);
function addHouseStyled(b, hf, x, z, rot, d, r) {
  const roof = d.roofs[Math.floor(r() * d.roofs.length)]; const tall = d.tall ? 1.8 : 1; const y = hf(x, z) - 0.15;
  if (d.flat) { const w = 4.5 + r() * 2, dd = 4 + r() * 1.5, h = (3 + r() * 1.5) * tall; const M = (lx, ly, lz) => new B.Matrix4().makeRotationY(rot).setPosition(x, y, z).multiply(mat(lx, ly, lz));
    b.add(new B.BoxGeometry(w, h, dd), d.walls || 0xe8e0d0, M(0, h / 2, 0), { grad: 0.25 }); b.add(new B.BoxGeometry(w + 0.3, 0.3, dd + 0.3), roof, M(0, h, 0)); b.add(new B.BoxGeometry(0.9, 1.7, 0.1), 0x5a3a22, M(0, 0.85, dd / 2 + 0.03), { outline: false });
    for (const sx of [-1, 1]) b.add(new B.BoxGeometry(0.7, 0.7, 0.1), 0x3a4a6a, M(sx * w * 0.28, h * 0.6, dd / 2 + 0.03), { outline: false });
    if (d.theme === 'desert' && r() < 0.5) b.add(sph(w * 0.3, 10, 6), roof, M(0, h, 0));
    return { x, z, hw: (w + 0.3) / 2, hd: (dd + 0.3) / 2, rot }; }
  const c = addHouse(b, x, y, z, rot, { roof, wall: d.walls || [0xf1e2c0, 0xe8d8c0, 0xf4ece0][Math.floor(r() * 3)], h: 3 * tall, w: 4.5 + r() * 2, chimney: r() < 0.3 });
  if (d.pagoda) { const M = new B.Matrix4().makeRotationY(rot).setPosition(x, y, z); b.add(cyl(0.01, 4.4, 1.2, 4), roof, M.clone().multiply(mat(0, 3 * tall + 2.4, 0, 0, Math.PI / 4)), {}); }
  return c;
}
function addTreeKind(b, x, y, z, k, r) {
  if (k === 0) return addTree(b, x, y, z, 0.8 + r() * 0.6, 0, r); if (k === 1) return addTree(b, x, y, z, 0.9 + r() * 0.4, 1, r);
  if (k === 2) { for (let i = 0; i < 3; i++) b.add(new B.IcosahedronGeometry(1 + r(), 1), 0xffffff, mat(x + (i - 1) * 1.2, y + 0.6 + r() * 0.5, z, 0, 0, 0, 1, 0.6, 1), { outline: false, grad: 0.2 }); return; }
  if (k === 3) { b.add(cyl(0.12, 0.25, 3, 5), 0x2a2020, mat(x, y + 1.5, z, 0.1, 0, 0.15)); b.add(cyl(0.05, 0.1, 1.6, 4), 0x2a2020, mat(x + 0.5, y + 2.6, z, 0, 0, -0.9)); b.add(cyl(0.05, 0.1, 1.4, 4), 0x2a2020, mat(x - 0.4, y + 2.2, z, 0, 0, 0.8)); return; }
  if (k === 4) { const s = 1.6 + r(); for (let i = 0; i < 4; i++) { const a = i * 1.57; b.add(cyl(0.12, 0.2, 2, 5), 0x8a6a4a, mat(x + Math.cos(a) * 0.6, y + 0.8, z + Math.sin(a) * 0.6, Math.sin(a) * 0.4, 0, Math.cos(a) * 0.4)); }
    b.add(cyl(0.5 * s, 0.6 * s, 6 * s, 7), 0x9a7a5a, mat(x, y + 3 * s + 1, z)); b.add(new B.IcosahedronGeometry(3 * s, 0), 0x5aa04a, mat(x, y + 6.5 * s + 1, z, r(), r(), 0, 1, 0.6, 1), { grad: 0.3 }); return; }
  if (k === 5) { const c = [0xff7ab0, 0xffa060, 0xb07aff][Math.floor(r() * 3)]; for (let i = 0; i < 3; i++) b.add(cone(0.35, 2 + r() * 2, 6), c, mat(x + (r() - 0.5) * 1.5, y + 1.2, z + (r() - 0.5) * 1.5, (r() - 0.5) * 0.5, 0, (r() - 0.5) * 0.5)); return; }
  if (k === 6) { const c = [0xff5a8a, 0x5ad0ff, 0xfff05a, 0xa05aff][Math.floor(r() * 4)]; b.add(cyl(0.08, 0.08, 2.6, 6), 0xffffff, mat(x, y + 1.3, z)); b.add(cyl(0.9, 0.9, 0.3, 14), c, mat(x, y + 3.2, z, Math.PI / 2)); return; }
  if (k === 7) { b.add(cyl(0.16, 0.24, 2, 6), 0x5a3a2a, mat(x, y + 1, z)); b.add(new B.IcosahedronGeometry(1.4, 0), 0xffb0d0, mat(x, y + 2.8, z, r(), r(), 0), { grad: 0.25 }); b.add(new B.IcosahedronGeometry(1, 0), 0xffc8e0, mat(x + 0.7, y + 3.3, z, r(), r(), 0), { grad: 0.25 }); }
}
function landmark(b, hf, C, kind, x, z, d) {
  const y = hf(x, z); const roof = d.roofs[0];
  const tower = (tx, tz, r, h, col, top) => { b.add(cyl(r, r * 1.1, h, 10), col, mat(tx, y + h / 2, tz), { grad: 0.3 }); if (top) b.add(cone(r * 1.3, r * 1.6, 10), top, mat(tx, y + h + r * 0.8, tz)); C.push({ x: tx, z: tz, r: r * 1.1 }); };
  const ringWall = (r, h, col, gap = 0.6) => { const n = 18; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; if (Math.abs(Math.sin(a) - 1) < gap && Math.cos(a) > -2 && a > Math.PI * 0.3 && a < Math.PI * 0.7) continue; const wx = x + Math.cos(a) * r, wz = z + Math.sin(a) * r; b.add(new B.BoxGeometry(r * 0.36, h, 1), col, mat(wx, hf(wx, wz) + h / 2, wz, 0, -a + Math.PI / 2, 0), { grad: 0.3 }); C.push({ x: wx, z: wz, r: 1.1 }); } };
  const box = (bx, bz, w, h, dd, col, by = 0) => { b.add(new B.BoxGeometry(w, h, dd), col, mat(bx, y + by + h / 2, bz), { grad: 0.3 }); if (!by) C.push({ x: bx, z: bz, hw: w / 2, hd: dd / 2, rot: 0 }); };
  switch (kind) {
    case 'tent': b.add(cyl(7, 7, 4, 16), 0xf0f0f0, mat(x, y + 2, z - 8), { grad: 0.2 }); b.add(cone(8, 6, 16), 0xd03030, mat(x, y + 7, z - 8)); C.push({ x, z: z - 8, r: 7 }); for (let i = 0; i < 8; i++) b.add(new B.BoxGeometry(0.6, 4.05, 0.1), 0xd03030, mat(x + Math.cos(i * 0.785) * 7, y + 2, z - 8 + Math.sin(i * 0.785) * 7, 0, -i * 0.785 + Math.PI / 2, 0), { outline: false }); break;
    case 'mansion': box(x, z - 9, 14, 6, 7, 0xf0e8d8); b.add(cyl(0.01, 10, 3, 4), roof, mat(x, y + 7.5, z - 9, 0, Math.PI / 4, 0, 1, 1, 0.5)); tower(x - 7, z - 9, 1.5, 8, 0xf0e8d8, roof); tower(x + 7, z - 9, 1.5, 8, 0xf0e8d8, roof); break;
    case 'restaurant': { b.add(new B.BoxGeometry(12, 3, 22), 0xa06a3a, mat(x, y + 1.5, z - 12), { grad: 0.4 }); b.add(new B.BoxGeometry(9, 4, 10), 0xf0e0c0, mat(x, y + 5, z - 12)); b.add(cyl(0.01, 7, 3, 4), 0x3a8a3a, mat(x, y + 8.5, z - 12, 0, Math.PI / 4)); b.add(sph(3, 10, 8), 0xd08a3a, mat(x, y + 3, z - 24, 0, 0, 0, 1, 0.8, 1.2)); C.push({ x, z: z - 12, hw: 6, hd: 11, rot: 0 }); break; }
    case 'arlongpark': ringWall(16, 6, 0xe8e0d0); tower(x, z - 6, 3, 14, 0xf0f0e8, 0x3a6ab0); b.add(new B.BoxGeometry(3.5, 2, 0.3), 0x3a6ab0, mat(x, y + 11, z - 3), { outline: false }); break;
    case 'scaffold': box(x, z - 6, 8, 5, 6, 0x6a4a2a); for (let i = 0; i < 5; i++) b.add(new B.BoxGeometry(3, 0.4, 1), 0x7a5a3a, mat(x, y + i + 0.2, z - 2 + i * 0.01 - i * 0.6)); b.add(new B.BoxGeometry(0.4, 4, 0.4), 0x5a3a1a, mat(x - 3, y + 7, z - 6)); b.add(new B.BoxGeometry(0.4, 4, 0.4), 0x5a3a1a, mat(x + 3, y + 7, z - 6)); b.add(new B.BoxGeometry(6.6, 0.4, 0.4), 0x5a3a1a, mat(x, y + 9, z - 6)); break;
    case 'cactus': for (const [cx, cz, h] of [[-10, -6, 14], [9, -10, 18], [0, -16, 22]]) { tower(x + cx, z + cz, 2.5, h, 0x9aa05a, null); b.add(cyl(0.9, 1, 5, 8), 0x9aa05a, mat(x + cx + 3, y + h * 0.6, z + cz, 0, 0, 1)); } break;
    case 'palace': box(x, z - 10, 20, 8, 10, 0xe8d8b0); b.add(sph(4, 12, 8), 0xe8d8b0, mat(x, y + 8, z - 10)); tower(x - 10, z - 10, 2, 14, 0xe8d8b0, 0xd0b070); tower(x + 10, z - 10, 2, 14, 0xe8d8b0, 0xd0b070); break;
    case 'ark': { const sh = new Builder(); b.add(new B.BoxGeometry(10, 4, 26), 0xc0a060, mat(x, y + 2, z - 12), { grad: 0.4 }); b.add(cyl(0.6, 0.6, 18, 8), 0x8a6a4a, mat(x, y + 11, z - 12)); for (let i = 0; i < 4; i++) b.add(new B.BoxGeometry(0.4, 6, 3), 0xf0e0b0, mat(x + (i < 2 ? -6 : 6), y + 10, z - 18 + (i % 2) * 12)); C.push({ x, z: z - 12, hw: 5, hd: 13, rot: 0 }); break; }
    case 'fountain': b.add(cyl(5, 5.5, 1.2, 16), 0xc0c8d0, mat(x, y + 0.6, z)); b.add(cyl(1, 1.4, 6, 10), 0xd0d8e0, mat(x, y + 3, z)); b.add(cyl(3, 3, 0.4, 14), 0xd0d8e0, mat(x, y + 6, z)); b.add(cyl(4.5, 4.5, 0.2, 16), 0x6ac0f0, mat(x, y + 1.25, z), { outline: false }); C.push({ x, z, r: 5.5 }); for (let i = 0; i < 6; i++) tower(x + Math.cos(i * 1.05) * 22, z - 6 + Math.sin(i * 1.05) * 12 - 6, 2.5, 12 + (i % 3) * 4, 0xe0d8c8, roof); break;
    case 'tower': tower(x, z - 10, 5, 32, 0xe8e8f0, 0x2a5bb8); box(x, z - 3, 12, 4, 4, 0xe0e0e8); break;
    case 'castle': box(x, z - 12, 18, 10, 10, 0x4a3a5a); tower(x - 9, z - 12, 2.5, 18, 0x4a3a5a, 0x2a1a3a); tower(x + 9, z - 12, 2.5, 18, 0x4a3a5a, 0x2a1a3a); tower(x, z - 14, 3, 24, 0x5a4a6a, 0x2a1a3a); break;
    case 'mangrove': for (const [cx, cz] of [[-14, -10], [12, -14], [0, -22]]) addTreeKind(b, x + cx, y, z + cz, 4, Math.random); break;
    case 'arena': ringWall(15, 5, 0xd0a060); for (const s of [-1, 1]) { b.add(cyl(1.2, 1.4, 10, 8), 0x5a8a3a, mat(x + s * 10, y + 5, z - 16)); b.add(sph(2, 8, 6), 0x5a8a3a, mat(x + s * 10, y + 11, z - 16)); } break;
    case 'prison': box(x, z - 14, 22, 14, 10, 0x6a6060); tower(x - 11, z - 14, 3, 18, 0x6a6060, 0x3a3030); tower(x + 11, z - 14, 3, 18, 0x6a6060, 0x3a3030); break;
    case 'hq': box(x, z - 14, 26, 12, 10, 0xf0f0f4); tower(x, z - 14, 4, 22, 0xf0f0f4, 0x2a5bb8); b.add(new B.BoxGeometry(6, 3, 0.3), 0x2a5bb8, mat(x, y + 9, z - 8.8), { outline: false }); break;
    case 'palace2': b.add(sph(14, 18, 10), 0x9ae8ff, mat(x, y, z - 14, 0, 0, 0, 1, 0.8, 1), { outline: false }); tower(x - 5, z - 14, 2, 16, 0xf0a0d0, 0xf0e070); tower(x + 5, z - 14, 2, 12, 0xf0a0d0, 0xf0e070); tower(x, z - 18, 2.5, 20, 0xffc0e0, 0xf0e070); break;
    case 'lab': box(x, z - 12, 18, 7, 9, 0xe0e0e8); for (const s of [-1, 1]) tower(x + s * 6, z - 14, 1.2, 12, 0xb0b0b8, null); b.add(new B.IcosahedronGeometry(8, 0), 0xa0d0ff, mat(x + 24, y, z - 10), { grad: 0.3 }); b.add(new B.IcosahedronGeometry(8, 0), 0xff7a3a, mat(x - 24, y, z - 10), { grad: 0.3 }); break;
    case 'colosseum': ringWall(16, 9, 0xe0b080); break;
    case 'whaletree': tower(x, z - 14, 4, 26, 0x7a5a3a, null); b.add(new B.IcosahedronGeometry(12, 1), 0x4a9a3a, mat(x, y + 30, z - 14, 0, 0, 0, 1, 0.6, 1), { grad: 0.3 }); break;
    case 'cake': for (let i = 0; i < 5; i++) { b.add(cyl(12 - i * 2.2, 12 - i * 2.2, 4, 20), [0xffd0e0, 0xffffff, 0xff9ac0, 0xfff0d0, 0xff7ab0][i], mat(x, y + 2 + i * 4, z - 14), { grad: 0.2 }); } C.push({ x, z: z - 14, r: 12 }); for (let i = 0; i < 8; i++) b.add(sph(0.8, 8, 6), 0xd01a3a, mat(x + Math.cos(i * 0.785) * 3, y + 21, z - 14 + Math.sin(i * 0.785) * 3)); break;
    case 'onigashima': b.add(new B.DodecahedronGeometry(14, 0), 0x5a4a4a, mat(x, y + 6, z - 22, 0.2, 0.4, 0), { grad: 0.3 }); for (const s of [-1, 1]) b.add(cone(2.5, 14, 6), 0xe0d8c0, mat(x + s * 7, y + 22, z - 22, 0, 0, -s * 0.4)); C.push({ x, z: z - 22, r: 13 }); break;
    case 'mirrors': for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; b.add(new B.BoxGeometry(4, 9, 0.4), [0xd0e8ff, 0xb07aff, 0xffffff][i % 3], mat(x + Math.cos(a) * 15, y + 4.5, z + Math.sin(a) * 15, 0, -a + Math.PI / 2, 0), { grad: 0.4 }); C.push({ x: x + Math.cos(a) * 15, z: z + Math.sin(a) * 15, r: 1.8 }); } b.add(new B.OctahedronGeometry(4, 0), 0xffffff, mat(x, y + 14, z - 6), { grad: 0.4 }); break;
    case 'treasure': b.add(new B.DodecahedronGeometry(10, 0), 0xc0a060, mat(x, y + 3, z - 18, 0, 0.3, 0, 1.6, 0.8, 1), { grad: 0.3 }); b.add(new B.BoxGeometry(5, 3.5, 3.5), 0x8a4a1a, mat(x, y + 2, z - 8)); b.add(new B.BoxGeometry(5.2, 0.6, 3.7), 0xffd04a, mat(x, y + 3.2, z - 8)); C.push({ x, z: z - 8, hw: 2.6, hd: 1.8, rot: 0 }); C.push({ x, z: z - 18, r: 12 }); for (let i = 0; i < 12; i++) b.add(new B.CylinderGeometry(0.5, 0.5, 0.15, 10), 0xffd04a, mat(x + (Math.random() - 0.5) * 6, y + 0.1, z - 5 + Math.random() * 2), { outline: false }); break;
    case 'egg': b.add(sph(12, 20, 14), 0xfff8e8, mat(x, y + 6, z - 18, 0, 0, 0, 1, 1.3, 1), { grad: 0.2 }); b.add(cyl(13, 13, 1.5, 24), 0x7ad0ff, mat(x, y + 4, z - 18), { outline: false }); C.push({ x, z: z - 18, r: 12.5 }); tower(x + 18, z - 10, 2, 16, 0xf4f8ff, 0x7ad0ff); tower(x - 18, z - 10, 2, 16, 0xf4f8ff, 0xff7ab0); break;
  }
}
export function genIsland(id) {
  const d = IDEFS[id]; const meta = ISLANDS.find(i => i.id === id); const R = d.small ? 66 : 88;
  const I = base({ id, R, spawn: [0, R * 0.55] });
  const T = [0, R * 0.4], CW = [-R * 0.46, -2], CE = [R * 0.46, -6], FARM = [-R * 0.42, R * 0.42], FOR = [R * 0.45, R * 0.36], CLF = [-R * 0.48, -R * 0.42], bz = -R * 0.35 + 8;
  const lush = !['desert', 'cloud', 'fortress', 'prison', 'spooky', 'sea'].includes(d.theme);
  const P = [[T, CW], [T, CE], [[0, 0], [0, bz + 10]], [T, lush ? FARM : [-R * 0.3, R * 0.5]], [T, FOR], [[-R * 0.2, 0], CLF]]; I.paths = P; const pp = pathPaint(P, 2, 0xc9b493);
  const seedN = [...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0; const r = rng(seedN);
  const bumps = []; for (let i = 0; i < 4; i++) { const a = r() * Math.PI * 2; bumps.push({ x: Math.cos(a) * R * 0.6, z: Math.sin(a) * R * 0.6, h: 2 + r() * 6, s: 8 + r() * 8 }); } bumps.push({ x: CLF[0], z: CLF[1], h: 6, s: 12 });
  const hf0 = islandHF(R, bumps, 1.3, d.theme === 'desert' ? 1.2 : 0.5); const hf = HFX[id] ? HFX[id](hf0, R) : hf0; I.hf = hf; const C = I.colliders;
  const b = new Builder();
  const pal = d.pal; const terrain = makeTerrain(hf, R * 2.6, Math.round(R * 1.3), { grass: pal.grass, grass2: new B.Color(pal.grass).multiplyScalar(0.82).getHex(), sand: pal.sand, rock: pal.rock, paint: I.paint = (x, z, y) => (Math.abs(x) < 2.4 && z > -20 && z < R * 0.7 && y > 0.9 ? 0xc9b493 : PAINT[id] ? PAINT[id](x, z, y) : pp(x, z, y)) });
  I.group.add(terrain);
  landmark(b, hf, C, d.landmark, 0, -R * 0.35, d); decorate(id, b, hf, C, I, R, rng(seedN + 9));
  // houses: two rows along the main road + scattered
  const nH = d.small ? 6 : 10; for (let i = 0; i < nH; i++) { const side = i % 2 ? 1 : -1; const zz = R * 0.56 - Math.floor(i / 2) * 11; C.push(addHouseStyled(b, hf, side * (15 + r() * 5), zz, side > 0 ? -Math.PI / 2 : Math.PI / 2, d, r)); }
  for (const [sx, sz, sr, sc] of [[9, T[1] - 6, -Math.PI / 2, 0x8a5a2b], [-9, T[1] - 10, Math.PI / 2, 0x2a2a2a], [9, T[1] + 2, -Math.PI / 2, d.roofs[0]], [10.5, T[1] + 13, -Math.PI / 2, 0xc0283a], [-10.5, T[1] + 6, Math.PI / 2, 0x6a3a8a]]) C.push(addStall(b, hf, sx, sz, sr, sc));
  { const zr = rng(seedN + 33); if (lush) farm(b, hf, C, FARM[0], FARM[1], 14, 10); if (lush || d.theme === 'spooky') forest(b, hf, C, FOR[0], FOR[1], 13, 26, zr, d.theme === 'spooky' ? 0.8 : 0.4); cliffs(b, hf, C, CLF[0], CLF[1], zr); beach(b, hf, C, R, 0.3, 1.1, zr); beach(b, hf, C, R, 2.05, 2.8, zr);
    camp(b, hf, C, CW[0], CW[1], d.roofs[0], 0x222222, zr); camp(b, hf, C, CE[0], CE[1], d.roofs[d.roofs.length - 1], 0x6a1a1a, zr); for (const [x, z] of [[-R * 0.2, 0], [R * 0.2, -1], [0, R * 0.3 - 4]]) signpost(b, hf, x + 2, z + 2, 0.5); }
  addDock(b, 0, 0, R * 0.78, 0, 14); I.dock = { x: 0, z: R * 0.78 + 8, y: 0.85, z0: R * 0.78, z1: R * 0.78 + 14.2 };
  const boat = makeBoatSmall(); boat.position.set(3.2, -0.1, R * 0.78 + 10); I.group.add(boat); I.boat = boat;
  const avoid = [[0, R * 0.42, 24], [0, -R * 0.35, 22], [0, R * 0.78, 6], [CW[0], CW[1], 11], [CE[0], CE[1], 11], [FARM[0] - 3, FARM[1], 13], [FOR[0], FOR[1], 14], [CLF[0], CLF[1], 9]];
  avoid.fn = (x, z) => nearPath(P, x, z, 3) || (NOTREE[id] ? NOTREE[id](x, z, R) : false);
  const tk = d.trees ?? 0; scatter(b, hf, R - 6, Math.round((TREEN[id] ?? (d.small ? 25 : 55)) * 1.4), seedN + 1, avoid, (x, y, z, rr) => { addTreeKind(b, x, y, z, tk === 0 && rr() < 0.3 ? 0 : tk, rr); C.push({ x, z, r: 0.5 }); });
  scatter(b, hf, R - 4, 32, seedN + 2, avoid, (x, y, z, rr) => addRock(b, x, y, z, 0.4 + rr() * 0.8, rr));
  addClouds(b, 14, seedN % 97);
  addHorizon(I, seedN);
  I.group.add(b.build());
  const S = I.spawns; const L = meta.lvl;
  for (let i = 0; i < 8; i++) { const a = r() * Math.PI * 2, dd = 4 + r() * 8; S.push({ type: id + '_e1', x: CW[0] + Math.cos(a) * dd * 0.8, z: CW[1] + Math.sin(a) * dd * 0.8, lvl: L + (i % 3) }); }
  for (let i = 0; i < 6; i++) { const a = r() * Math.PI * 2, dd = 4 + r() * 7; S.push({ type: id + '_e2', x: CE[0] + Math.cos(a) * dd * 0.8, z: CE[1] + Math.sin(a) * dd * 0.8, lvl: L + 3 + (i % 3) }); }
  S.push({ type: id + '_boss', x: 0, z: bz, lvl: L + 8, boss: true, arena: { x: 0, z: bz, r: 12 } });
  const sea = meta.sea;
  I.npcs.push({ id: 'giver', look: 'villager', name: d.giver, role: 'quest', x: -5, z: R * 0.4 - 1, ry: Math.PI / 2, over: { shirt: d.roofs[0], hair: 0x3a2a1a } });
  I.npcs.push({ id: 'sw', look: 'smith', name: 'Weapon Dealer', role: 'shop', shop: 'auto:weapons:' + L, x: 7.6, z: R * 0.4 - 6, ry: -Math.PI / 2 });
  I.npcs.push({ id: 'fr', look: 'villager', name: 'Fruit Dealer', role: 'shop', shop: 'rot', x: -7.6, z: R * 0.4 - 10, ry: Math.PI / 2, over: { shirt: 0x2a2a2a, hair: 0x6a2a8a } });
  I.npcs.push({ id: 'wr', look: 'makino', name: 'Outfitter', role: 'shop', shop: 'auto:wear:' + L, x: 7.6, z: R * 0.4 + 2, ry: -Math.PI / 2 });
  I.npcs.push({ id: 'dk', look: 'villager', name: 'Harbor Master', role: 'dock', x: 2.2, z: R * 0.78 - 2, ry: Math.PI });
  I.npcs.push({ id: 'rl', look: 'villager', name: 'Gacha Gus', role: 'roller', x: 9.1, z: R * 0.4 + 13, ry: -Math.PI / 2, over: { shirt: 0xc0283a, hair: 0xffd04a } });
  I.npcs.push({ id: 'tr', look: 'villager', name: 'Collector Pip', role: 'trader', x: -9.1, z: R * 0.4 + 6, ry: Math.PI / 2, over: { shirt: 0x6a3a8a, hair: 0xaa3333 } });
  I.npcs.push({ id: 'qboard', name: 'Quest Board', role: 'board', x: 0, z: R * 0.4 + 1, ry: 0 });
  I.landmarks = [{ n: d.boss.name + "'s lair", x: 0, z: bz }, { n: 'Town', x: 0, z: R * 0.4 }, { n: d.e1.name + ' Camp', x: CW[0], z: CW[1] }, { n: d.e2.name + ' Camp', x: CE[0], z: CE[1] }, ...(lush ? [{ n: 'Farms', x: FARM[0], z: FARM[1] }] : []), { n: 'Cliffs', x: CLF[0], z: CLF[1] }, { n: 'Dock', x: 0, z: R * 0.78 }];
  I.palette = { skyTop: pal.sky[0], skyBot: pal.sky[1], fog: pal.fog, sea: SEA[id], light: LIGHT[id] };
  I.dark = d.theme === 'spooky' || d.theme === 'prison';
  return I;
}
for (const id of Object.keys(IDEFS)) BUILDERS[id] = () => genIsland(id);
// Secret legendary sword quests (extremely hard): given by the Mysterious Swordsman on certain islands
export const SECRET_Q = [
  ['loguetown', 'ryuma', 'loguetown_boss', 5, 100], ['loguetown', 'shiro', 'loguetown_e2', 60, 100], ['thriller', 'sorrow', 'thriller_boss', 4, 120], ['amazon', 'wazamono', 'amazon_boss', 5, 165],
  ['marineford', 'sutra', 'marineford_boss', 4, 200], ['punk', 'kashu', 'punk_boss', 5, 250], ['dressrosa', 'kokuto', 'dressrosa_boss', 6, 250], ['zou', 'enma', 'zou_boss', 6, 300],
  ['wci', 'ameoden', 'wci_boss', 6, 300], ['wano', 'yoru', 'wano_boss', 8, 300], ['wano', 'kitetsu1', 'wano_e2', 120, 380], ['egghead', 'ameno', 'egghead_boss', 6, 380], ['egghead', 'gods', 'egghead_boss', 12, 380],
];
for (const [isl, sw, target, n, lvl] of SECRET_Q) { (QUESTS[isl] = QUESTS[isl] || []).push({ id: 'sec_' + sw, giver: 'Mysterious Swordsman', lvl, text: `Secret Trial: defeat ${target.endsWith('boss') ? ENEMIES[target].name : ENEMIES[target].name + 's'} ${n}×`, type: 'kill', target, n, xp: lvl * 300, ber: lvl * 400, sword: sw, secret: true }); }
const _gen = genIsland;
for (const id of Object.keys(IDEFS)) BUILDERS[id] = () => { const I = _gen(id); if (SECRET_Q.some(q => q[0] === id)) I.npcs.push({ id: 'myst', look: 'villager', name: 'Mysterious Swordsman', role: 'quest', x: 6, z: I.R * 0.4 + 10, ry: -Math.PI / 2, over: { shirt: 0x1a1a1a, coat: 0x2a2a2a, hair: 0x111111, cap: 'straw' } }); return I; };
