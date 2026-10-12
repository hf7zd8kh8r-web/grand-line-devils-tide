// Ambient townsfolk with idle activities (sweeping, hammering, carrying crates, fishing at the dock, chatting, strolling).
// Outfit palettes vary per island theme. Non-interactive, cheap, culled by distance.
import { THREE as B, setOutlinesVisible } from './engine.js';
import { makeChar, animChar } from './chars.js';
import { Q } from './engine.js';
const OUT = { desert: { shirt: [0xf0e6d0, 0xe8d8b0, 0xd8c098], pants: [0xc8b080, 0xe8dcc0], band: [0xffffff, 0x8a3a2a] }, snow: { shirt: [0x8a3a2a, 0x3a5a8a, 0x5a5a5a], pants: [0x3a3a3a, 0x4a3a2a], vest: [0xe8e0d0, 0x8a6a4a] }, wano: { shirt: [0x3a4a8a, 0xb83a3a, 0x5a3a6a, 0x2a6a4a], pants: [0x2a2a3a, 0x4a3a2a], sash: [0xe8d8a0, 0x2a2a2a] }, city: { shirt: [0xf4f4f4, 0x3a6ab8, 0xb8a06a, 0x7a3a5a], pants: [0x3a3a4a, 0x5a4a3a], vest: [0x2a2a3a, 0x6a2a2a] }, tropic: { shirt: [0xff8a4a, 0x4ac8b8, 0xffd23a, 0xff6a8a], pants: [0xe8d8b0, 0x3a6ab8] }, town: { shirt: [0x4a7fb8, 0xb84a3a, 0x6a9a4a, 0xd8a03a, 0x8a5ab8], pants: [0x6b5a3a, 0x3a3a4a, 0x5a4a3a], apron: [0xf4f0e0] } };
const THEME = { alabasta: 'desert', punk: 'snow', wano: 'wano', water7: 'city', enies: 'city', sabaody: 'city', dressrosa: 'city', marineford: 'city', loguetown: 'city', arlong: 'tropic', amazon: 'tropic', zou: 'tropic', fishman: 'tropic' };
const ACTS = ['sweep', 'hammer', 'carry', 'chat', 'stroll', 'sweep', 'chat', 'fish'];
function prop(kind) { const g = new B.Group(); const wood = new B.MeshToonMaterial({ color: 0x8a5a32 });
  if (kind === 'sweep') { const h = new B.Mesh(new B.CylinderGeometry(0.025, 0.025, 1.3, 5), wood); h.position.y = -0.55; g.add(h); const br = new B.Mesh(new B.ConeGeometry(0.16, 0.3, 6), new B.MeshToonMaterial({ color: 0xd8b060 })); br.position.y = -1.25; g.add(br); }
  if (kind === 'hammer') { const h = new B.Mesh(new B.CylinderGeometry(0.025, 0.025, 0.45, 5), wood); h.position.y = -0.2; g.add(h); const hd = new B.Mesh(new B.BoxGeometry(0.22, 0.1, 0.1), new B.MeshToonMaterial({ color: 0x5a5a62 })); hd.position.y = -0.42; g.add(hd); }
  if (kind === 'carry') { const c = new B.Mesh(new B.BoxGeometry(0.5, 0.4, 0.4), new B.MeshToonMaterial({ color: 0xb08a52 })); g.add(c); }
  if (kind === 'fish') { const h = new B.Mesh(new B.CylinderGeometry(0.012, 0.02, 2.2, 5), new B.MeshToonMaterial({ color: 0x2a4a7a })); h.position.set(0, -0.6, 0.6); h.rotation.x = 1.0; g.add(h); }
  return g; }
export class Folk {
  constructor(g) { this.g = g; this.list = []; }
  clear() { for (const f of this.list) f.c.root.removeFromParent(); this.list = []; }
  spawn(I) { this.clear(); const g = this.g; const th = THEME[I.id] || 'town'; const pal = OUT[th] || OUT.town; let s = 0; for (const ch of I.id) s = s * 31 + ch.charCodeAt(0); const r = () => ((s = (s * 16807 + 11) % 2147483647) / 2147483647);
    const n = Q.level === 'low' ? 4 : Q.level === 'med' ? 7 : 10; const npcs = I.npcs.length ? I.npcs : [{ x: 0, z: I.R * 0.3 }]; const pick = a => a[Math.floor(r() * a.length)];
    for (let i = 0; i < n; i++) { let act = ACTS[i % ACTS.length]; const anchor = npcs[i % npcs.length]; let x = anchor.x + (r() - 0.5) * 16, z = anchor.z + (r() - 0.5) * 16;
      if (act === 'fish' && I.dock) { x = I.dock.x + (i % 2 ? 1.1 : -1.1); z = I.dock.z1 - 1.5 - (i % 3); } else if (act === 'fish') act = 'stroll';
      let h = g.groundAt(x, z); const v = new B.Vector3(x, 0, z); g.collide(v, 0.6); x = v.x; z = v.z; h = g.groundAt(x, z); if (h < 0.3 && act !== 'fish') continue;
      const fem = r() < 0.45; const over = { shirt: pick(pal.shirt), pants: pick(pal.pants), hair: pick([0x2a1a10, 0x5a3a1a, 0x8a5a2a, 0xd8b060, 0x111111, 0xa03a2a, 0xe0e0e0]), hairS: fem ? pick(['long', 'pigtails']) : pick(['short', 'spiky', 'buzz']), mouth: pick(['smile', 'line', 'grin']), fem, dress: fem && r() < 0.6 };
      if (pal.band && r() < 0.6) over.band = pick(pal.band); if (pal.vest && r() < 0.6) over.vest = pick(pal.vest); if (pal.sash) over.sash = pick(pal.sash); if (pal.apron && (act === 'sweep' || r() < 0.2)) over.vest = pal.apron[0]; if (!fem && r() < 0.3) over.beard = pick(['stubble', 'big']); if (r() < 0.15) over.old = true;
      let c; try { c = makeChar('villager', over); } catch (_) { continue; } c.root.position.set(x, h, z); c.root.rotation.y = r() * 6.28; g.scene.add(c.root); setOutlinesVisible(c.root);
      const p = act === 'stroll' || act === 'chat' ? null : prop(act); if (p) { c.bones.foreR ? c.bones.foreR.add(p) : c.bones.armR.add(p); p.position.y = act === 'carry' ? -0.3 : -0.35; if (act === 'carry') { p.position.z = 0.3; } }
      const f = { c, act, home: new B.Vector3(x, h, z), t: r() * 10, dir: r() * 6.28, ph: 0, partner: null }; this.list.push(f); }
    // chat pairs face each other
    const chats = this.list.filter(f => f.act === 'chat'); for (let i = 0; i + 1 < chats.length; i += 2) { const a = chats[i], b = chats[i + 1]; b.c.root.position.copy(a.c.root.position).add(new B.Vector3(1.3, 0, 0)); b.c.root.position.y = g.groundAt(b.c.root.position.x, b.c.root.position.z); b.home.copy(b.c.root.position); a.c.root.rotation.y = Math.PI / 2; b.c.root.rotation.y = -Math.PI / 2; } }
  update(dt) { const g = this.g, P = g.p.pos, t = g.t;
    for (const f of this.list) { const R = f.c.root; const d = R.position.distanceTo(P); R.visible = d < 70; if (!R.visible) continue; f.t += dt; const B_ = f.c.bones; let move = 0;
      if (f.act === 'stroll' || f.act === 'carry') { const fw = new B.Vector3(Math.sin(f.dir), 0, Math.cos(f.dir)); const nx = R.position.x + fw.x * dt * 1.2, nz = R.position.z + fw.z * dt * 1.2; const h = g.groundAt(nx, nz); if (h < 0.3 || R.position.distanceTo(f.home) > 9 || Math.random() < dt * 0.15) { f.dir += Math.PI * (0.6 + Math.random() * 0.8); } else { const v = new B.Vector3(nx, 0, nz); g.collide(v, 0.4); R.position.set(v.x, g.groundAt(v.x, v.z), v.z); move = 1; } R.rotation.y += ((f.dir - R.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 4); }
      if (d < 5 && f.act !== 'fish') { const want = Math.atan2(P.x - R.position.x, P.z - R.position.z); R.rotation.y += ((want - R.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 3); move = 0; }
      f.ph += dt * 6 * move; animChar(f.c, { move, phase: f.ph, talk: f.act === 'chat' && Math.sin(f.t * 0.8) > 0, happy: d < 6 || (f.act === 'chat' && Math.sin(f.t * 0.8) <= 0), wave: d < 5 && Math.sin(f.t * 0.5) > 0.6, look: d < 7 ? g.eyePos() : null }, t + f.home.x);
      if (d < 5) continue;
      if (f.act === 'sweep') { B_.armR.rotation.x = -0.5 + Math.sin(f.t * 3) * 0.35; B_.armR.rotation.z = Math.sin(f.t * 3) * 0.3; B_.armL.rotation.x = -0.6 + Math.sin(f.t * 3) * 0.3; B_.torso.rotation.y = Math.sin(f.t * 3) * 0.2; }
      if (f.act === 'hammer') { const k = Math.max(0, Math.sin(f.t * 4)); B_.armR.rotation.x = -2.2 + k * 1.9; B_.torso.rotation.x = 0.2 + k * 0.15; if (k > 0.98 && !f.hit) { f.hit = 1; g.fx.burst(R.position.clone().add(new B.Vector3(Math.sin(R.rotation.y) * 0.6, 0.4, Math.cos(R.rotation.y) * 0.6)), 3, 0xffd08a, { speed: 2, size: 0.12, life: 0.25 }); } if (k < 0.5) f.hit = 0; }
      if (f.act === 'carry') { B_.armR.rotation.x = -1.2; B_.armL.rotation.x = -1.2; }
      if (f.act === 'fish') { B_.armR.rotation.x = -0.9 + Math.sin(f.t * 0.7) * 0.05; B_.armL.rotation.x = -0.9; R.rotation.y = Math.PI * (R.position.x > (g.island.dock ? g.island.dock.x : 0) ? 0.5 : -0.5); } } }
}
