// Secret content runtime: hidden-island clues, secret shops behind fake walls (walk straight through the rock),
// hidden secret quests, exclusive shop items, and hints wired into the Sword Index + tavern rumors.
import { THREE as B, setOutlinesVisible } from './engine.js';
import { ISLANDS, QUESTS, ENEMIES, FRUITS, islandById, SEAS } from './data.js';
import { BUILDERS } from './islands.js';
import { IDEFS } from './islanddefs.js';
import { COSMETICS } from './style.js';
import { HAKI_COLORS } from './bodyfx.js';
import { SECRET_ISLES } from './secretdefs.js';
import { RUMOR_HOOKS, INDEX_HOOKS } from './swordindex.js';
import * as ST from './state.js';
const V = (x = 0, y = 0, z = 0) => new B.Vector3(x, y, z);
const fmt = n => Math.round(n).toLocaleString('en-US');
const islN = id => (islandById(id) || {}).name || id;
const seaN = id => { const I = islandById(id); const s = I && SEAS.find(x => x.id === I.sea); return s ? s.name : ''; };
// ---------------- exclusive cosmetics (hidden shops / secret quest rewards only) ----------------
export const EXCL = {
  kingcape: { name: "Pirate King's Cape", slot: 'back', price: 3500000, icon: '👑', o: { cape: 0xc02020, collarUp: 0xc02020, epaulets: 0xffd04a }, secret: true },
  shadowcloak: { name: 'Shadow Cloak', slot: 'back', price: 1800000, icon: '🦇', o: { cape: 0x14101c, fur: 0x2a2a3a, collarUp: 0x14101c }, secret: true },
  phoenixw: { name: 'Blue Phoenix Wings', slot: 'extra', price: 4500000, icon: '🐦‍🔥', o: { wings: true, wingC: 0x3ad0ff }, secret: true },
  roninhat: { name: 'Wandering Ronin Hat', slot: 'hat', price: 90000, icon: '🎋', o: { hat: 'jingasa' }, secret: true },
  onimask: { name: 'Oni Half-Mask', slot: 'face', price: 1200000, icon: '👺', o: { mask: 0xc02020 }, secret: true },
  goldcrown: { name: 'Golden King Crown', slot: 'hat', price: 6000000, icon: '🏵', o: { hat: 'crown', hatC: 0xffd04a }, secret: true },
  snowscarf: { name: 'Drum Snow Scarf', slot: 'neck', price: 250000, icon: '❄️', o: { scarf: 0xe8f4ff }, secret: true },
  sungodsash: { name: 'Sun God Sash', slot: 'neck', price: 2500000, icon: '☀️', o: { sash: 0xffd04a }, secret: true },
  giantbeard: { name: 'Giant Warrior Beard', slot: 'face', price: 2000000, icon: '🧔', o: { beard: true, mustache: true }, secret: true },
  xebecmark: { name: "Xebec's Cross Scar", slot: 'face', price: 8000000, icon: '✖️', o: { scar: 'x' }, secret: true },
};
Object.assign(COSMETICS, EXCL);
// ---------------- hidden shops behind fake walls ----------------
// items: ['cos', id] | ['hk', id] | ['fruit', id, price]
export const ROOMS = {
  windmill: { title: "Smuggler's Hollow", items: [['cos', 'roninhat'], ['cos', 'snowscarf']], quest: { target: 'bandit', n: 25, text: 'Secret Request: defeat 25 Bandits for the Masked Stranger', reward: ['cos', 'roninhat'], lvl: 3 } },
  loguetown: { title: 'The Execution Platform Cellar', items: [['cos', 'shadowcloak'], ['cos', 'onimask'], ['hk', 'oni']], quest: { target: 'loguetown_e1', n: 40, text: 'Secret Request: defeat 40 Loguetown Marines in secret', reward: ['hk', 'oni'], lvl: 45 } },
  water7: { title: "Franky's Secret Workshop", items: [['cos', 'kingcape'], ['fruit', 'gura', 2600000]], quest: { target: 'water7_boss', n: 3, text: 'Secret Request: defeat Water 7\'s boss 3× to test your ship', reward: ['cos', 'shadowcloak'], lvl: 85 } },
  fishman: { title: 'Sunken Treasure Grotto', items: [['cos', 'phoenixw'], ['hk', 'celestial']], quest: { target: 'fishman_e1', n: 50, text: 'Secret Request: defeat 50 New Fish-Man Pirates', reward: ['cos', 'onimask'], lvl: 125 } },
  dressrosa: { title: 'Underground Toy Factory', items: [['cos', 'goldcrown'], ['hk', 'voidc'], ['fruit', 'ope', 9000000]], quest: { target: 'dressrosa_boss', n: 5, text: 'Secret Request: defeat Dressrosa\'s boss 5×', reward: ['hk', 'celestial'], lvl: 170 } },
  wano: { title: 'Kozuki Hidden Armory', items: [['cos', 'sungodsash'], ['cos', 'xebecmark'], ['hk', 'voidc']], quest: { target: 'wano_e2', n: 80, text: 'Secret Request: defeat 80 Samurai Ronin', reward: ['cos', 'sungodsash'], lvl: 305 } },
};
// secret quests on the secret islands (reward exclusive items)
const ISLE_Q = { drum: ['drum_boss', 3, ['cos', 'snowscarf']], shandora: ['shandora_boss', 3, ['cos', 'goldcrown']], kuraigana: ['kuraigana_boss', 4, ['cos', 'shadowcloak']], momoiro: ['momoiro_e1', 40, ['cos', 'kingcape']],
  greenbit: ['greenbit_boss', 4, ['hk', 'celestial']], elbaf: ['elbaf_boss', 4, ['cos', 'giantbeard']], godvalley: ['godvalley_boss', 5, ['cos', 'xebecmark']] };
for (const [isl, R] of Object.entries(ROOMS)) { const q = R.quest; const id = 'sroom_' + isl; if ((QUESTS[isl] || []).some(x => x.id === id)) continue; (QUESTS[isl] = QUESTS[isl] || []).push({ id, giver: 'Masked Stranger', lvl: q.lvl, text: q.text, type: 'kill', target: q.target, n: q.n, xp: q.lvl * 260 + 400, ber: q.lvl * 380 + 1500, secret: true, hidden: true, secReward: q.reward }); }
for (const [isl, [t, n, rw]] of Object.entries(ISLE_Q)) { const d = IDEFS[isl]; if (!d) continue; const id = 'sisle_' + isl; if ((QUESTS[isl] || []).some(x => x.id === id)) continue; const L = islandById(isl).lvl; const nm = ENEMIES[t] ? ENEMIES[t].name : t;
  (QUESTS[isl] = QUESTS[isl] || []).push({ id, giver: d.giver, lvl: L + 8, text: `Secret Trial: defeat ${nm}${t.endsWith('boss') ? '' : 's'} ${n}×`, type: 'kill', target: t, n, xp: L * 420, ber: L * 600, secret: true, secReward: rw }); }
// ---------------- clues that reveal the secret islands ----------------
const isNight = g => !!(g.amb && g.amb.isNight && g.amb.isNight());
export const CLUES = {
  drum: { task: "On Loguetown's cliffs an old lantern has forgotten its purpose. Remind it, when the sun cannot see.", isl: 'loguetown', at: 'Cliffs', cond: g => isNight(g), need: 'only at night', look: 0x7ad0ff },
  shandora: { task: "Once the sky's god has fallen, the lair's three bells will sing again. The fewest rings speak first.", isl: 'skypiea', at: 'lair', cond: g => (g.save.kills.skypiea_boss || 0) > 0, need: "after defeating Skypiea's boss", look: 0xffd04a },
  kuraigana: { task: "On Thriller Bark's cliffs, footsteps only the senses can see lead into the dark.", isl: 'thriller', at: 'Cliffs', cond: g => !!(g.save.haki && g.save.haki.ken), need: 'only with Observation Haki on (H)', look: 0x3aff8a },
  momoiro: { task: 'In the sunken grotto, an old navigator talks in circles: the princess, the merchant, then home again.', isl: 'fishman', at: 'room', cond: () => true, need: "inside Fish-Man Island's hidden grotto", look: 0xff7ad0 },
  greenbit: { task: 'The little people of Dressrosa hide their treasure in plain boxes, and they only trust those who fought the family.', isl: 'dressrosa', at: 'Town', cond: g => (g.save.kills.dressrosa_e1 || 0) >= 25, need: 'after defeating 25 Donquixote Grunts on Dressrosa', look: 0x7aff7a },
  elbaf: { task: 'Beneath the Cake Island cliffs, the sea runs against the wind on dark nights, for those whose arms are black as iron.', isl: 'wci', at: 'Cliffs', cond: g => isNight(g) && !!(g.save.haki && g.save.haki.buso), need: 'at night, with Armament Haki raised', look: 0xd0a060 },
  godvalley: { task: "Egghead's forbidden archive is missing six pages. Every other lost island holds one.", isl: 'egghead', at: 'Town', cond: g => SECRET_ISLES.filter(x => x[0] !== 'godvalley').every(x => (g.save.secrets || {})[x[0]]), need: 'once all six other hidden islands are found', look: 0xff3a3a },
};
// ---------------- helpers ----------------
function rockCol(id) { const d = IDEFS[id]; return (d && d.pal && d.pal.rock) || (id === 'windmill' ? 0x8a8478 : 0x8a8070); }
// deterministic flat, empty spot for a hidden room: ring 0.42..0.72 R, far from colliders, NPCs, spawns, dock
function findSpot(I) { const R = I.R, hf = I.hf; let best = null; const C = I.colliders;
  for (const k of [0.62, 0.52, 0.7, 0.45]) for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2 + k; const x = Math.cos(a) * R * k, z = Math.sin(a) * R * k;
    let lo = 1e9, hi = -1e9; for (let dx = -4; dx <= 4; dx += 2) for (let dz = -4; dz <= 4; dz += 2) { const y = hf(x + dx, z + dz); lo = Math.min(lo, y); hi = Math.max(hi, y); } if (lo < 0.5 || hi - lo > 0.9) continue;
    let near = 1e9; for (const c of C) near = Math.min(near, Math.hypot(c.x - x, c.z - z) - (c.r || Math.hypot(c.hw || 0, c.hd || 0)));
    for (const n of I.npcs) near = Math.min(near, Math.hypot(n.x - x, n.z - z) - 2); for (const s of I.spawns) near = Math.min(near, Math.hypot(s.x - x, s.z - z) - 3); if (I.dock) near = Math.min(near, Math.hypot(I.dock.x - x, I.dock.z - z) - 8);
    if (near < 5) continue; const sc = near - (hi - lo) * 4; if (!best || sc > best.sc) best = { x, z, a, sc, y: hi }; if (near > 9 && hi - lo < 0.4) return best; }
  return best; }
const dir8 = (x, z) => ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'][((Math.round(Math.atan2(z, x) / (Math.PI / 4)) % 8) + 8) % 8];
// build the hollow rock block: solid sides/back/roof (colliders), passable fake front wall
function buildRoom(I, isl) { const sp = findSpot(I); if (!sp) return null; const W = 7.2, D = 7, H = 4, t = 0.55; const th = Math.atan2(-sp.x, -sp.z); // local +z faces the island centre (entrance)
  const grp = new B.Group(); grp.position.set(sp.x, sp.y - 0.05, sp.z); grp.rotation.y = th; const rc = rockCol(isl);
  const rockM = new B.MeshToonMaterial({ color: rc }), rockD = new B.MeshToonMaterial({ color: new B.Color(rc).multiplyScalar(0.82) });
  const box = (w, h, d, m, x, y, z) => { const o = new B.Mesh(new B.BoxGeometry(w, h, d), m); o.position.set(x, y, z); grp.add(o); return o; };
  box(t, H + 1.5, D, rockM, -W / 2, (H - 1.5) / 2, 0); box(t, H + 1.5, D, rockM, W / 2, (H - 1.5) / 2, 0); box(W + t, H + 1.5, t, rockD, 0, (H - 1.5) / 2, -D / 2); box(W + 1.2, 0.7, D + 1.0, rockD, 0, H + 0.2, 0);
  const fake = box(W + t, H + 1.5, t, rockM, 0, (H - 1.5) / 2, D / 2 - t / 2 + 0.02); fake.userData.fakeWall = true;
  const glyph = new B.Mesh(new B.PlaneGeometry(W * 0.7, H * 0.8), new B.MeshBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0.0, blending: B.AdditiveBlending, depthWrite: false })); glyph.position.set(0, H * 0.42, D / 2 + 0.04); glyph.visible = false; grp.add(glyph);
  // boulder dressing so it reads as a rock outcrop
  for (let i = 0; i < 9; i++) { const r = 0.6 + Math.random() * 1.1; const m = new B.Mesh(new B.IcosahedronGeometry(r, 0), i % 2 ? rockM : rockD); const a = Math.random() * Math.PI * 2; m.position.set(Math.cos(a) * (W / 2 + 0.4) * (i % 3 ? 1 : 0.6), H + 0.55 + r * 0.45, Math.sin(a) * (D / 2) * 0.8 - 0.4); m.rotation.set(Math.random(), Math.random(), 0); grp.add(m); }
  for (const s of [-1, 1]) { const m = new B.Mesh(new B.IcosahedronGeometry(1.0, 0), rockD); m.position.set(s * (W / 2 + 0.3), 0.4, D / 2 - 0.2); grp.add(m); }
  // interior: floor, counter, lanterns, treasure
  const fl = new B.Mesh(new B.PlaneGeometry(W - t, D - t), new B.MeshToonMaterial({ color: 0x5a4632 })); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.06; grp.add(fl);
  box(2.6, 0.9, 0.7, new B.MeshToonMaterial({ color: 0x7a5232 }), 0, 0.45, -1.2);
  for (const s of [-1, 1]) { const l = new B.Mesh(new B.SphereGeometry(0.16, 10, 8), new B.MeshBasicMaterial({ color: 0xffc040 })); l.position.set(s * (W / 2 - 0.6), 2.4, -D / 2 + 0.7); grp.add(l); const h = new B.Mesh(new B.SphereGeometry(0.32, 12, 10), new B.MeshBasicMaterial({ color: 0xffa020, transparent: true, opacity: 0.14, blending: B.AdditiveBlending, depthWrite: false })); h.position.copy(l.position); grp.add(h); }
  const shelfM = new B.MeshToonMaterial({ color: 0x6a4428 }); for (const yy of [1.2, 2.0]) box(3.4, 0.08, 0.45, shelfM, -0.4, yy, -D / 2 + 0.5); const gc = [0xc02020, 0x3a7aff, 0xffd04a, 0x7aff7a, 0xb46bff, 0xe8e8e8];
  for (let i = 0; i < 10; i++) { const m = new B.Mesh(i % 3 ? new B.BoxGeometry(0.28, 0.3, 0.26) : new B.SphereGeometry(0.16, 10, 8), new B.MeshToonMaterial({ color: gc[i % 6] })); m.position.set(-1.9 + (i % 5) * 0.75, (i < 5 ? 1.2 : 2.0) + 0.18, -D / 2 + 0.5); grp.add(m); }
  const chest = box(0.9, 0.55, 0.6, new B.MeshToonMaterial({ color: 0x8a5a2a }), 2.0, 0.3, -2.2); const gold = new B.Mesh(new B.SphereGeometry(0.32, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new B.MeshToonMaterial({ color: 0xffd04a, emissive: 0x6a4a00 })); gold.position.set(2.0, 0.58, -2.2); grp.add(gold);
  I.group.add(grp); setOutlinesVisible(grp);
  const cs = Math.cos(th), sn = Math.sin(th); const W2 = (lx, lz) => [sp.x + lx * cs + lz * sn, sp.z - lx * sn + lz * cs];
  const col = (lx, lz, hw, hd) => { const [x, z] = W2(lx, lz); I.colliders.push({ x, z, hw, hd, rot: -th, secret: true }); };
  col(-W / 2, 0, t / 2, D / 2); col(W / 2, 0, t / 2, D / 2); col(0, -D / 2, W / 2, t / 2); col(0, -1.2, 1.3, 0.35);
  const [mx, mz] = W2(-1.5, -1.9), [qx, qz] = W2(1.4, -0.6);
  I.npcs.push({ id: 'secshop', look: 'villager', name: 'Hooded Merchant', role: 'shop', shop: 'secret:' + isl, x: mx, z: mz, ry: th, over: { shirt: 0x2a2a3a, coat: 0x3a2a4a, hair: 0x1a1a1a, hat: 'bandana', hatC: 0x2a1a3a, mask: 0x1a1a1a } });
  I.npcs.push({ id: 'secq', look: 'villager', name: 'Masked Stranger', role: 'quest', x: qx, z: qz, ry: th + 0.5, over: { shirt: 0x1a1a1a, coat: 0x14101c, hair: 0xe0e0e0, mask: 0xf0f0f0 } });
  const [ix, iz] = W2(0, -0.4); const [ex, ez] = W2(0, D / 2 + 1.5);
  return { x: sp.x, z: sp.z, th, W, D, glyph, inside: (x, z) => { const dx = x - sp.x, dz = z - sp.z; const lx = dx * cs - dz * sn, lz = dx * sn + dz * cs; return Math.abs(lx) < W / 2 - 0.3 && lz < D / 2 - 0.3 && lz > -D / 2 + 0.3; }, ix, iz, ex, ez, dir: dir8(sp.x, sp.z) }; }
// ---------------- per-island discovery mechanics (no beams, no pickups: each island is found its own way) ----------------
const ken = g => !!(g.save.haki && g.save.haki.ken), buso = g => !!(g.save.haki && g.save.haki.buso);
function spotNear(I, C, off = 0) { if (C.at === 'room') { const r = I.secretRoom; return r ? { x: r.ix + (r.ex - r.ix) * 0.05, z: r.iz } : null; }
  const L = (I.landmarks || []).find(l => C.at === 'lair' ? /lair/i.test(l.n) : l.n === C.at) || { x: 0, z: I.R * 0.3 };
  for (let k = off; k < 40; k++) { const a = k * 0.9, r = 3 + k * 0.6; const x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r; if (I.hf(x, z) > 0.4 && !I.colliders.some(c => Math.hypot(c.x - x, c.z - z) < (c.r || Math.max(c.hw || 0, c.hd || 0)) + 1.2)) return { x, z, L }; }
  return { x: L.x, z: L.z, L }; }
function reveal(g, id, why) { const S = g.save; if ((S.secrets || {})[id]) return; S.secrets = S.secrets || {}; S.secrets[id] = 1; ST.save(S);
  g.ui.toast(why, 'rare'); setTimeout(() => g.ui.banner('SECRET ISLAND REVEALED', `${islN(id)} (${seaN(id)}) is now on your 🗺 Map — Lv ${islandById(id).lvl}+`), 1400); }
const say = (g, t) => g.ui.toast(t);
const tm = c => new B.MeshToonMaterial({ color: c });
function mk(grp, geo, m, x, y, z) { const o = new B.Mesh(geo, m); o.position.set(x, y, z); grp.add(o); return o; }
function buildDisc(I, id) { const C = CLUES[id]; const at = spotNear(I, C); if (!at) return null; const grp = new B.Group(); const y0 = I.hf(at.x, at.z); grp.position.set(at.x, y0, at.z); I.group.add(grp);
  const act = (x, z, r, label, fn, ok = () => true) => { const a = { x, z, r, label, act: fn, ok: g => !(g.save.secrets || {})[id] && ok(g) }; I.secAct.push(a); return a; };
  const D = { id, grp, x: at.x, z: at.z, upd: () => {} }; const stone = tm(rockCol(I.id)), wood = tm(0x6a4a2a);
  if (id === 'drum') { // night ritual: light the old cliff lantern
    mk(grp, new B.CylinderGeometry(0.18, 0.26, 1.3, 7), stone, 0, 0.65, 0); mk(grp, new B.BoxGeometry(0.55, 0.45, 0.55), stone, 0, 1.5, 0); mk(grp, new B.ConeGeometry(0.5, 0.35, 4), stone, 0, 1.9, 0).rotation.y = Math.PI / 4;
    const fl = mk(grp, new B.SphereGeometry(0.1, 8, 6), new B.MeshBasicMaterial({ color: 0xffb040 }), 0, 1.5, 0); fl.visible = false;
    act(at.x, at.z, 2.2, 'Light the old lantern', g => { if (!isNight(g)) return say(g, 'The wick is dry and cold. It is waiting for the dark.'); fl.visible = true; reveal(g, id, 'Far out over the black water, a single light answers… then the snow swallows it.'); });
  } else if (id === 'shandora') { // bell puzzle: strike the stones in the order of their carved rings
    const ord = [2, 0, 1]; let seq = []; const chest = mk(grp, new B.BoxGeometry(0.9, 0.5, 0.6), wood, 0, 0.25, -1.6); const lid = mk(grp, new B.BoxGeometry(0.92, 0.12, 0.62), wood, 0, 0.56, -1.6); chest.visible = lid.visible = false; let open = false;
    ord.forEach((rings, i) => { const bx = (i - 1) * 1.6; mk(grp, new B.CylinderGeometry(0.32, 0.42, 0.9, 9), tm(0xb89a50), bx, 0.45, 0); for (let k = 0; k <= rings; k++) mk(grp, new B.TorusGeometry(0.36 + k * 0.012, 0.025, 4, 14), tm(0x5a4a20), bx, 0.25 + k * 0.2, 0).rotation.x = Math.PI / 2;
      const [wx, wz] = [at.x + bx, at.z]; act(wx, wz, 1.1, 'Strike the bell-stone', g => { if (!((g.save.kills.skypiea_boss || 0) > 0)) return say(g, 'The bell is dead stone. Something on this island still forbids its song.'); if (open) return; seq.push(rings); say(g, '🔔 ' + 'DONG '.repeat(rings + 1).trim());
        if (seq.length === 3) { if (seq.join() === '0,1,2') { open = true; chest.visible = lid.visible = true; say(g, 'The ground rumbles. Something rises from the clouds behind you.'); } else { seq = []; say(g, 'The tones clash and fade. Start again.'); } } }); });
    act(at.x, at.z - 1.6, 1.4, 'Open the sky-chest', g => { lid.rotation.x = -1; reveal(g, id, 'Inside: a map fragment, inked in gold — an island where the clouds were never meant to be.'); }, () => open);
  } else if (id === 'kuraigana') { // footprints only Observation Haki can sense → a cave in the cliff
    const dir = Math.atan2(at.z, at.x) + 0.6; const cx = Math.cos(dir) * 11, cz = Math.sin(dir) * 11; const fm = new B.MeshBasicMaterial({ color: 0x9ad0b0, transparent: true, opacity: 0, depthWrite: false }); const prints = [];
    for (let k = 1; k < 10; k++) { const t = k / 10, px = cx * t + (k % 2 ? 0.25 : -0.25), pz = cz * t; const p = mk(grp, new B.CircleGeometry(0.13, 6), fm, px, I.hf(at.x + px, at.z + pz) - y0 + 0.04, pz); p.rotation.x = -Math.PI / 2; p.scale.y = 1.7; prints.push(p); }
    const cy = I.hf(at.x + cx, at.z + cz) - y0; for (let i = 0; i < 6; i++) mk(grp, new B.IcosahedronGeometry(0.9 + (i % 3) * 0.3, 0), stone, cx + Math.cos(i) * 1.4, cy + 0.6 + (i % 2) * 0.9, cz + Math.sin(i) * 1.4);
    mk(grp, new B.SphereGeometry(0.85, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), new B.MeshBasicMaterial({ color: 0x050508 }), cx, cy, cz).scale.set(1, 1.3, 0.6);
    D.upd = (g, dt) => { fm.opacity += ((ken(g) ? 0.22 : 0) - fm.opacity) * Math.min(1, dt * 2); };
    act(at.x + cx, at.z + cz, 2.2, 'Feel your way into the cave', g => ken(g) ? reveal(g, id, 'Your senses guide you through the dark. Pinned to the wall: a chart of a castle island lost in mist.') : say(g, 'Pitch black. You cannot sense where the passage goes.'));
  } else if (id === 'momoiro') { // NPC riddle chain inside the grotto
    const r = I.secretRoom; if (!r) return null; grp.position.set(0, 0, 0); const cs = Math.cos(r.th), sn = Math.sin(r.th); const nx = r.x + 2.4 * cs + 1.6 * sn, nz = r.z - 2.4 * sn + 1.6 * cs;
    I.npcs.push({ id: 'secnav', look: 'villager', name: 'Old Navigator', role: 'riddle', riddle: id, x: nx, z: nz, ry: r.th - 0.6, over: { shirt: 0x5a6a8a, coat: 0x2a3a5a, hair: 0xd8d8d8, beard: true } });
  } else if (id === 'greenbit') { // a tiny log pose in an ordinary crate
    mk(grp, new B.BoxGeometry(0.8, 0.7, 0.8), wood, 0, 0.35, 0); mk(grp, new B.BoxGeometry(0.6, 0.5, 0.6), wood, 0.55, 0.25, 0.5).rotation.y = 0.5;
    act(at.x, at.z, 1.8, 'Search the crate', g => (g.save.kills.dressrosa_e1 || 0) >= 25 ? (g.save.secItems = Object.assign(g.save.secItems || {}, { logpose_greenbit: 1 }), reveal(g, id, 'A tiny voice: "You fought the family for us." It leaves a Tiny Log Pose — the needle points to the jungle in the south.')) : say(g, 'Something inside squeaks and goes very still. It does not trust you yet.'));
  } else if (id === 'elbaf') { // a pale sea current at night that only answers raised Armament
    const L = at.L, n = Math.hypot(L.x, L.z) || 1, ux = L.x / n, uz = L.z / n; let sx = L.x, sz = L.z; for (let k = 0; k < 40 && I.hf(sx, sz) > 0.1; k++) { sx += ux; sz += uz; } grp.position.set(sx, 0, sz);
    const fm = new B.MeshBasicMaterial({ color: 0xe8f0f8, transparent: true, opacity: 0, depthWrite: false }); for (let k = 0; k < 8; k++) { const p = mk(grp, new B.CircleGeometry(0.9 - k * 0.05, 7), fm, ux * k * 3.5 + Math.sin(k) * 0.8, 0.06, uz * k * 3.5 + Math.cos(k) * 0.8); p.rotation.x = -Math.PI / 2; p.scale.x = 2; }
    const ex = sx + ux * 26, ez = sz + uz * 26; let shown = false; D.upd = (g, dt, P) => { const on = isNight(g) && buso(g); fm.opacity += ((on ? 0.16 + Math.sin(g.t * 1.5) * 0.04 : 0) - fm.opacity) * Math.min(1, dt * 1.5); grp.visible = fm.opacity > 0.01;
      if (on && Math.hypot(P.x - ex, P.z - ez) < 4) reveal(g, id, 'The current grips you, cold and strong. On the horizon: a horn the size of a mountain.'); if (on && !shown && Math.hypot(P.x - sx, P.z - sz) < 14) { shown = true; say(g, 'The sea below the cliffs is moving against the wind…'); } };
  } else if (id === 'godvalley') { // the archive only completes when six pages are found
    mk(grp, new B.BoxGeometry(1.6, 2, 0.5), wood, 0, 1, 0); for (let i = 0; i < 8; i++) mk(grp, new B.BoxGeometry(0.16, 0.42, 0.36), tm([0x8a2a2a, 0x2a4a8a, 0x6a6a2a][i % 3]), -0.6 + i * 0.17, 0.5 + (i > 3 ? 0.7 : 0), 0.1);
    act(at.x, at.z, 2, 'Read the forbidden archive', g => { const n = SECRET_ISLES.filter(x => x[0] !== 'godvalley' && (g.save.secrets || {})[x[0]]).length; n >= 6 ? reveal(g, id, 'The last page turns itself: a valley erased from every map, 38 years ago.') : say(g, `The log is torn. ${n}/6 of its pages are found — they lie on other forgotten islands.`); });
  }
  setOutlinesVisible(grp); return D; }
function talkRiddle(g, n) { const S = g.save; S.secStep = S.secStep || {}; const st = S.secStep.momoiro || 0;
  if (n.role === 'riddle') { if ((S.secrets || {}).momoiro) return say(g, 'Old Navigator: "Fair winds. You know the way now."');
    if (st === 3) { S.secStep.momoiro = 4; ST.save(S); return reveal(g, 'momoiro', 'Old Navigator: "The princess wept, the merchant cursed… then you are ready." He unrolls a pink-stained chart.'); }
    if (st === 0) { S.secStep.momoiro = 1; ST.save(S); } return say(g, st < 2 ? 'Old Navigator: "Go to the one who is too big for her tower, and too kind for this sea. Tell her the old man sent you."' : 'Old Navigator: "Now find the one who sells the sea\'s own curse."'); }
  if (g.save.island !== 'fishman' || (S.secrets || {}).momoiro) return false;
  if (st === 1 && n.name === (IDEFS.fishman || {}).giver) { S.secStep.momoiro = 2; ST.save(S); say(g, `${n.name}: "The old navigator? He still remembers the pink island… go to the seller of cursed fruit."`); return true; }
  if (st === 2 && /fruit/i.test(n.name + ' ' + (n.shop || ''))) { S.secStep.momoiro = 3; ST.save(S); say(g, `${n.name}: "Pink island? Hah. Tell the old man the merchant says: 'it was never sunk.'"`); return true; }
  return false; }
// room riddles (hidden shops) — no directions, just riddles
const ROOM_RIDDLE = { windmill: 'Where the wind is put to work, the hill holds its breath. The proud stone is only pretending.', loguetown: 'In the town where it all began, and ended, one cliff is a liar. It will not stop a man who does not stop.',
  water7: 'Among the shipwrights, a block of stone was carved by no tool. A true craftsman hears it is hollow.', fishman: 'Ten thousand metres down, the coral keeps one door that is not a door.',
  dressrosa: 'Toys remember what people forget. Beneath the land of love, one rock hides their workshop.', wano: 'The Kozuki hid their steel where no samurai would kneel: inside the mountain\'s own skin.' };
const ROOM_STEP = { windmill: 'The stone that casts no doubt casts no wall.', loguetown: 'Walk as if the rock were mist.', water7: 'Lean on the stone that does not lean back.', fishman: 'Swim through what does not stop the tide.', dressrosa: 'Not all walls are made by men; some are made by belief.', wano: 'A true blade passes through illusion.' };
// ---------------- decorate every island build ----------------
export function decorateIsland(I) { try { if (ROOMS[I.id]) I.secretRoom = buildRoom(I, I.id); const ids = Object.keys(CLUES).filter(k => CLUES[k].isl === I.id); I.secAct = []; I.clues = ids.map(k => buildDisc(I, k)).filter(Boolean); } catch (e) { console.warn('secrets', e); } return I; }
// ---------------- install ----------------
export function installSecrets(g) { if (g._secrets) return; g._secrets = true; const ui = g.ui;
  for (const k of Object.keys(BUILDERS)) { const f = BUILDERS[k]; if (f._sec) continue; const w = () => decorateIsland(f()); w._sec = true; BUILDERS[k] = w; }
  // current island was built before install: add live
  if (g.island && !g.island.secretRoom && !g.island.clues) { const I = g.island; const n0 = I.npcs.length; decorateIsland(I); for (const n of I.npcs.slice(n0)) g.spawnNpc(n); }
  const sh = ui.shopHtml.bind(ui); ui.shopHtml = (id) => String(id).startsWith('secret:') ? (ui.shopId = id, secretShopHtml(g, id.slice(7))) : sh(id);
  const act = ui.act.bind(ui); ui.act = (cmd, btn) => { const [a, b, c] = String(cmd).split(':'); if (a === 'secbuy') return secretBuy(g, b, +c); if (a === 'sechint') { g.save.secHint = g.save.secHint || {}; g.save.secHint[b] = 1; ST.save(g.save); const it = secretList(g.save).find(x => x.kind + x.id === b); ui.open('swx', ui.modal === 'swx' && ui._arg ? ui._arg : it ? it.sea : 1); return; } return act(cmd, btn); };
  const tk = ui.talk.bind(ui); ui.talk = (n) => { if (n && (n.role === 'riddle' || talkRiddle(g, n))) { if (n.role === 'riddle') talkRiddle(g, n); return; } return tk(n); };
  const bh = ui.boardHtml.bind(ui); ui.boardHtml = (arg) => { const isl = g.save.island; const L = QUESTS[isl]; if (!L) return bh(arg); const keep = (g.save.secRoom || {})[isl]; QUESTS[isl] = L.filter(q => !q.hidden || keep); try { return bh(arg); } finally { QUESTS[isl] = L; } };
  const cq = g.completeQuest.bind(g); g.completeQuest = (q) => { const S = g.save; q = q || S.quest; const first = q && !(S.qdone || []).includes(q.id); const r = cq(q); if (q && first && q.secReward) grantReward(g, q.secReward, q.text); return r; };
  RUMOR_HOOKS.push((S, islandId) => Math.random() < 0.45 ? secretRumor(S, islandId) : null);
  INDEX_HOOKS.push((S, sea) => secretIndexHtml(S, sea));
}
function grantReward(g, rw, why) { const S = g.save; const [k, id] = rw; if (k === 'cos') { S.cos = S.cos || []; if (!S.cos.includes(id)) S.cos.push(id); setTimeout(() => g.ui.banner('SECRET REWARD', `${COSMETICS[id].icon} ${COSMETICS[id].name} — wear it from Menu → Style`), 2900); }
  if (k === 'hk') { S.hakiCols = S.hakiCols || ['black']; if (!S.hakiCols.includes(id)) S.hakiCols.push(id); setTimeout(() => g.ui.banner('SECRET REWARD', `🎨 ${HAKI_COLORS[id].name} Armament colour (Bag → Haki)`), 2900); } ST.save(S); }
// per-frame
export function tickSecrets(g, dt) { const I = g.island, S = g.save; if (!I || !S) return; const P = g.p.pos;
  const r = I.secretRoom; if (r) { const ken = !!(S.haki && S.haki.ken); const d = Math.hypot(P.x - r.ex, P.z - r.ez); const k = ken ? Math.max(0, 1 - d / 6) : 0; // faint heat-haze shimmer, only up close with Observation Haki
    const o = r.glyph.material; o.opacity += (k * (0.05 + Math.sin(g.t * 2.3) * 0.025) - o.opacity) * Math.min(1, dt * 3); r.glyph.visible = o.opacity > 0.004;
    if (r.inside(P.x, P.z)) { S.secRoom = S.secRoom || {}; if (!S.secRoom[I.id]) { S.secRoom[I.id] = 1; ST.save(S); g.ui.banner('HIDDEN SHOP FOUND!', `The rock was never there — ${ROOMS[I.id].title}`); } } }
  for (const c of I.clues || []) if (!(S.secrets || {})[c.id]) c.upd(g, dt, P);
  let best = null, bd = 1e9; for (const a of I.secAct || []) { const d = Math.hypot(P.x - a.x, P.z - a.z); if (d < a.r && d < bd && a.ok(g)) { best = a; bd = d; } } g.secInter = best; }
// ---------------- shop ----------------
function itemInfo(it) { const [k, id, price] = it; if (k === 'cos') { const c = COSMETICS[id]; return { name: c.name, icon: c.icon, sub: 'Exclusive ' + c.slot + ' cosmetic', price: c.price }; }
  if (k === 'hk') { const H = HAKI_COLORS[id]; return { name: H.name.replace(' (secret)', ''), icon: '🎨', sub: 'Armament Haki colour', price: H.price, col: H.s }; }
  if (k === 'fruit') { const f = FRUITS[id]; return { name: f ? f.name : id, icon: '🍎', sub: 'Devil Fruit (rare stock)', price }; } return { name: id, icon: '?', sub: '', price: 0 }; }
const owns = (S, it) => it[0] === 'cos' ? (S.cos || []).includes(it[1]) : it[0] === 'hk' ? (S.hakiCols || []).includes(it[1]) : false;
export function secretShopHtml(g, isl) { const S = g.save, R = ROOMS[isl]; if (!R) return '<h2>Hidden shop</h2>';
  return `<h2>🗝 ${R.title}</h2><p class="dim">"Not many find this place… everything here is one of a kind." · You have <b class="gold">฿${fmt(S.ber)}</b></p><div class="list">` + R.items.map((it, i) => { const d = itemInfo(it); const own = owns(S, it);
    return `<div class="item r6"><div class="ic" style="display:flex;align-items:center;justify-content:center;font-size:24px${d.col ? ';box-shadow:inset 0 0 0 3px #' + d.col.toString(16).padStart(6, '0') : ''}">${d.icon}</div><div class="nm"><b>${d.name}</b><small class="gold">${d.sub}</small><small>Hidden-shop exclusive</small></div>${own ? '<button disabled>Owned</button>' : `<button data-do="secbuy:${isl}:${i}" class="${S.ber < d.price ? 'poor' : ''}">฿${fmt(d.price)}</button>`}</div>`; }).join('') + `</div><p class="dim">Talk to the Masked Stranger for a secret request.</p>`; }
function secretBuy(g, isl, i) { const S = g.save, ui = g.ui; const it = (ROOMS[isl] || { items: [] }).items[i]; if (!it || owns(S, it)) return; const d = itemInfo(it); if (S.ber < d.price) { ui.toast('Not enough Berries', 'blk'); return; }
  S.ber -= d.price; if (it[0] === 'cos') { S.cos = S.cos || []; S.cos.push(it[1]); S.cosEq = S.cosEq || {}; S.cosEq[COSMETICS[it[1]].slot] = it[1]; ui.styleChanged(); } else if (it[0] === 'hk') { S.hakiCols = S.hakiCols || ['black']; S.hakiCols.push(it[1]); S.hakiCol = it[1]; } else if (it[0] === 'fruit') S.inv.fruits.push(it[1]);
  ST.save(S); ui.updateHud(); ui.toast(`🗝 Bought ${d.name}!`, 'rare'); ui.open('shop', 'secret:' + isl); }
// ---------------- hints ----------------
export function secretList(S) { const out = []; let n = {};
  for (const [id, name, sea, lvl, , , hint] of SECRET_ISLES) { n[sea] = (n[sea] || 0) + 1; const C = CLUES[id]; out.push({ kind: 'isle', id, name, sea, lvl, label: `Secret Island #${n[sea]} – ${SEAS.find(s => s.id === sea).name}`, riddle: hint, steps: [[`Reach Lv ${Math.max(1, lvl - 15)}`, S.lvl >= lvl - 15], [`Go to ${islN(C.isl)} (${seaN(C.isl)})`, (S.unlocked || []).includes(C.isl)], [C.task, !!(S.secrets || {})[id]], [`Sail to ${name} and defeat its boss`, (S.kills[id + '_boss'] || 0) > 0]], done: (S.kills[id + '_boss'] || 0) > 0 }); }
  const m = {}; for (const [isl, R] of Object.entries(ROOMS)) { const I = islandById(isl); m[I.sea] = (m[I.sea] || 0) + 1; const q = (QUESTS[isl] || []).find(x => x.id === 'sroom_' + isl);
    out.push({ kind: 'room', id: isl, name: R.title, sea: I.sea, lvl: I.lvl, label: `Hidden Shop #${m[I.sea]} – ${SEAS.find(s => s.id === I.sea).name}`, riddle: ROOM_RIDDLE[isl] || `On ${I.name}, the stone keeps a secret.`, steps: [[`Go to ${I.name}`, (S.unlocked || []).includes(isl)], [`"${ROOM_STEP[isl] || 'Trust the stone that does not push back.'}"`, !!(S.secRoom || {})[isl]], [`Masked Stranger's request: ${q.text.replace('Secret Request: ', '')}`, (S.qdone || []).includes(q.id)]], done: !!(S.secRoom || {})[isl] }); }
  return out; }
export function secretRumor(S, islandId) { const I = islandById(islandId); const L = secretList(S).filter(x => !x.done); if (!L.length) return null; const near = L.filter(x => x.sea === (I ? I.sea : 1)); const pool = near.length ? near : L; const x = pool[Math.floor(Math.random() * pool.length)]; return { id: x.id, label: x.label, text: x.riddle }; }
export function secretIndexHtml(S, sea) { sea = +(sea || 1); S.secHint = S.secHint || {}; const L = secretList(S).filter(x => x.sea === sea); if (!L.length) return '';
  const card = x => { const hint = S.secHint[x.kind + x.id] || S.secHint[x.id]; return `<div class="dexc swc ${x.done ? 'own' : ''}" style="--rc:#ffd04a"><div class="ic" style="display:flex;align-items:center;justify-content:center;font-size:22px">${x.kind === 'isle' ? '🏝' : '🗝'}</div><div><b>${x.done ? x.name : '???'}${x.done ? ' <i class="gold">✔ Found</i>' : ''}</b><small class="gold">${x.label}</small><small class="riddle">“${x.riddle}”</small>${hint ? `<ul class="swck">${x.steps.map(([t, ok]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✔' : '◻'} ${t}</li>`).join('')}</ul>` : `<button class="mini" data-do="sechint:${x.kind + x.id}">🔍 Reveal hint</button>`}</div></div>`; };
  return `<h3>🗝 Secret Islands &amp; Hidden Shops <small class="dim">(${L.filter(x => x.done).length}/${L.length} found)</small></h3><div class="dexl">${L.map(card).join('')}</div>`; }
