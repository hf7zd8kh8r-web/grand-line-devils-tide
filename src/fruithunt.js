// Client side of world Devil Fruit spawns: picks the active spawn (server in co-op, deterministic time window solo),
// places the real fruit model with glow/sparkle/bob and a faint close-range light pillar, handles pickup.
import { THREE as B } from './engine.js';
import { FRUITS, RARITY, islandById } from './data.js';
import { makeDevilFruit } from './fruitart.js';
import * as ST from './state.js';
import { audio } from './audio.js';
import { sfWindow, sfLeft, reachable, rollSpawn, rngOf, seaName } from './fruitspawn.js';
export class FruitHunt {
  constructor(g) { this.g = g; this.cur = null; this.obj = null; this.net = null; this.key = ''; this.near = false; this.pend = false; this.t = 0; }
  online() { const n = this.g.net; return !!(n && n.status === 'online' && this.net); }
  local() { const S = this.g.save; const w = sfWindow(); const f = S.sfForce; if (f && f.until > Date.now()) return { ...f, key: 'F' + f.n, taken: S.sfGot === 'F' + f.n };
    const sp = rollSpawn((S.name || '') + ':' + (S.stats.created || 0) + ':' + w, reachable(S.lvl, S.unlocked || [])); return { ...sp, key: 'W' + w, taken: S.sfGot === 'W' + w, until: Date.now() + sfLeft() }; }
  spawn() { if (this.online()) { const s = this.net; return { ...s, key: 'N' + s.n + ':' + s.w, taken: !!s.by }; } return this.local(); }
  force(fruit, island) { const g = this.g; if (this.online()) { g.net.send({ t: 'sfforce', fruit, island }); return 'net'; }
    const S = g.save; const isl = island || g.island.id; const f = fruit && FRUITS[fruit] ? fruit : rollSpawn('force' + Math.random(), reachable(S.lvl, S.unlocked)).fruit;
    S.sfForce = { n: Date.now(), island: isl, fruit: f, rar: FRUITS[f].rar, seed: Math.floor(Math.random() * 1e9), until: Date.now() + sfLeft() }; ST.save(S); return 'local'; }
  onNet(m) { const g = this.g;
    if (m.t === 'sf') this.net = { w: m.w, n: m.n, island: m.island, fruit: m.fruit, rar: m.rar, seed: m.seed, by: m.by };
    else if (m.t === 'sfgot') { if (this.net && this.net.n === m.n) this.net.by = m.name; g.ui.toast(`🍎 ${m.name} found the ${FRUITS[m.fruit] ? FRUITS[m.fruit].name : 'Devil Fruit'}!`, 'quest'); }
    else if (m.t === 'sfok') { this.pend = false; if (this.net) this.net.by = g.save.name; this.grant(m.fruit); }
    else if (m.t === 'sfno') { this.pend = false; g.ui.toast(m.by ? `Too late — ${m.by} grabbed it first!` : 'That fruit is gone…', 'blk'); } }
  spot(sp) { const I = this.g.island; const r = rngOf(sp.seed + 11); const ok = (x, z) => { const y = I.hf(x, z); if (y < 0.45) return false; if (Math.hypot(x - I.spawn[0], z - I.spawn[1]) < 10) return false; return !I.colliders.some(c => c.hw ? Math.abs(c.x - x) < c.hw + 0.6 && Math.abs(c.z - z) < c.hd + 0.6 : Math.hypot(c.x - x, c.z - z) < (c.r || 1) + 0.5); };
    const small = I.colliders.filter(c => !c.hw && c.r > 0.3 && c.r < 2.6 && I.hf(c.x, c.z) > 0.45); // trees, rocks, barrels
    for (let i = 0; i < 60 && small.length; i++) { const c = small[Math.floor(r() * small.length)]; const a = r() * Math.PI * 2, d = c.r + 0.75; const x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d; if (ok(x, z)) return [x, z]; }
    for (let i = 0; i < 300; i++) { const a = r() * Math.PI * 2, d = 8 + r() * I.R * 0.75; const x = Math.cos(a) * d, z = Math.sin(a) * d; if (ok(x, z)) return [x, z]; }
    return [I.spawn[0] + 6, I.spawn[1] + 6]; }
  place(sp) { const g = this.g, I = g.island; const [x, z] = this.spot(sp); const y = I.hf(x, z); const grp = new B.Group(); grp.position.set(x, y, z);
    const f = makeDevilFruit(sp.fruit, 0.5); f.position.y = 0.55; f.userData.baseY = 0.55; grp.add(f);
    const col = new B.Color((FRUITS[sp.fruit].col || [0xffffff])[0]); const gold = new B.Color(0xfff2a8);
    const gm = new B.SpriteMaterial({ map: glowTex(), color: col.clone().lerp(gold, 0.5), transparent: true, opacity: 0.55, blending: B.AdditiveBlending, depthWrite: false }); const glow = new B.Sprite(gm); glow.scale.set(1.6, 1.6, 1); glow.position.y = 0.55; grp.add(glow);
    const N = 18, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 1.2; pos[i * 3 + 1] = Math.random() * 1.6; pos[i * 3 + 2] = (Math.random() - 0.5) * 1.2; }
    const pg = new B.BufferGeometry(); pg.setAttribute('position', new B.BufferAttribute(pos, 3)); const pm = new B.PointsMaterial({ color: 0xfff6c0, size: 0.09, transparent: true, opacity: 0.9, blending: B.AdditiveBlending, depthWrite: false }); const spk = new B.Points(pg, pm); grp.add(spk);
    const bm = new B.MeshBasicMaterial({ color: col.clone().lerp(gold, 0.6), transparent: true, opacity: 0, blending: B.AdditiveBlending, depthWrite: false, side: B.DoubleSide }); const beam = new B.Mesh(new B.CylinderGeometry(0.18, 0.45, 18, 10, 1, true), bm); beam.position.y = 9; grp.add(beam);
    const ring = new B.Mesh(new B.RingGeometry(0.35, 0.6, 24), new B.MeshBasicMaterial({ color: 0xfff2a8, transparent: true, opacity: 0.35, blending: B.AdditiveBlending, depthWrite: false, side: B.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; grp.add(ring);
    g.scene.add(grp); this.obj = { grp, f, glow, spk, beam, ring, own: [gm, pg, pm, bm, beam.geometry, ring.geometry, ring.material], x, y, z, fruit: sp.fruit }; }
  clear() { if (!this.obj) return; this.g.scene.remove(this.obj.grp); for (const o of this.obj.own) o.dispose(); this.obj = null; }
  announce(sp, first) { const g = this.g; const I = islandById(sp.island); const fr = FRUITS[sp.fruit]; const big = sp.rar >= 5;
    const lvlOk = reachable(g.save.lvl, g.save.unlocked || []).some(i => i.id === sp.island);
    const msg = `A Devil Fruit has appeared somewhere on ${I ? I.name : sp.island} (${seaName(sp.island)})!` + (big ? ` Rumor says it's ${RARITY[sp.rar]}…` : '') + (lvlOk ? '' : ` (Reach Lv ${I ? I.lvl : '?'} to sail there)`);
    setTimeout(() => { if (big || !first) g.ui.banner('🍎 DEVIL FRUIT SPOTTED', msg); g.ui.chat('📢 Rumor', msg + ` Look under trees and by rocks — it vanishes in ${Math.ceil(sfLeft() / 60000)} min.`); }, first ? 6000 : 300); }
  pickup() { const g = this.g, o = this.obj; if (!o || this.pend || !this.cur) return false; const sp = this.cur; g.fx && g.fx.burst(new B.Vector3(o.x, o.y + 0.6, o.z), 30, 0xfff2a8, { speed: 4, up: 3, size: 0.3, life: 0.7 });
    if (sp.key[0] === 'N') { this.pend = true; g.net.send({ t: 'sfget', n: this.net.n }); setTimeout(() => { this.pend = false; }, 4000); this.clear(); return true; }
    g.save.sfGot = sp.key; this.clear(); this.grant(sp.fruit); return true; }
  grant(id) { const g = this.g, S = g.save; S.inv.fruits.push(id); S.stats.fruitsFound = (S.stats.fruitsFound || 0) + 1; const fr = FRUITS[id];
    g.ui.banner('🍎 DEVIL FRUIT FOUND!', `${fr.name} (${RARITY[fr.rar]}) — it's in your bag. Eat it or keep it to trade!`); try { audio.sfx('level'); } catch (_) {} ST.save(S); g.ui.updateHud && g.ui.updateHud(); }
  update(dt) { const g = this.g; this.t += dt; if (!g.island) return; const sp = this.spawn(); const key = sp.key + '|' + sp.island + '|' + sp.fruit;
    if (key !== this.key) { this.clear(); this.key = key; this.cur = sp; this.isl = null; if (!sp.taken && this._ann !== key) { this._ann = key; this.announce(sp, this.t < 3); } }
    this.cur = sp; if (sp.taken && this.obj) this.clear();
    if (!sp.taken && sp.island === g.island.id && this.isl !== g.island && !this.pend) { this.clear(); this.place(sp); this.isl = g.island; }
    if (this.isl && this.isl !== g.island) { this.obj = null; this.isl = null; }
    const o = this.obj; this.near = false; if (!o) return;
    o.f.userData.spin ? o.f.userData.spin(dt, g.t) : (o.f.rotation.y += dt); o.f.position.y = 0.55 + Math.sin(this.t * 2.2) * 0.12; o.glow.position.y = o.f.position.y; o.glow.material.opacity = 0.4 + Math.sin(this.t * 4) * 0.15; o.spk.rotation.y += dt * 0.6; o.ring.scale.setScalar(1 + (this.t % 1.5) * 0.6); o.ring.material.opacity = 0.35 * (1 - (this.t % 1.5) / 1.5);
    const d = Math.hypot(g.p.pos.x - o.x, g.p.pos.z - o.z); const ken = !!(g.save.haki && g.save.haki.ken); o.beam.material.opacity = ken ? 0.3 : d < 45 ? 0.22 * Math.min(1, (45 - d) / 20) : 0; o.beam.visible = o.beam.material.opacity > 0.01;
    this.near = d < 2.4 && Math.abs(g.p.pos.y - o.y) < 2.5; }
}
let _gt = null; function glowTex() { if (_gt) return _gt; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); _gt = new B.CanvasTexture(c); return _gt; }
