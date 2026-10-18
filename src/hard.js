// Harder combat: enemy scaling per sea + elites + bigger packs, poise (no M1 stun-lock), blocking, telegraphed heavy attacks, pack aggro,
// and multi-phase Devil Fruit bosses (each boss wields a fruit and casts its moves/special with the NEW skill visuals, telegraphed).
import { THREE as B } from './engine.js';
import { FRUITS } from './data.js';
import { remoteMove } from './themed.js';
import { audio } from './audio.js';
const V = (x = 0, y = 0, z = 0) => new B.Vector3(x, y, z);
export const BOSS_FRUIT = { Higuma: 'bane', 'Axe-Hand Morgan': 'kilo', Buggy: 'bara', Kuro: 'noro', 'Don Krieg': 'bomu', Arlong: 'sui', Smoker: 'moku', 'Mr. 5': 'bomu', Crocodile: 'suna', Enel: 'goro', 'Rob Lucci': 'raijin', Spandam: 'ton', 'Gecko Moria': 'kage', Sentomaru: 'bari', 'Boa Hancock': 'mero', Magellan: 'doku', Akainu: 'magu', 'Hody Jones': 'sui', 'Caesar Clown': 'gasu', Doflamingo: 'ito', Jack: 'brachio', Katakuri: 'mochi', Kaido: 'seiryu', Kizaru: 'pika', 'Mirror Doppelgänger': 'mira', 'Echo of the Pirate King': 'gura', 'Awakening Guardian': 'zushi' };
export const bossFruitOf = e => e && e.boss ? (e.fruitId || BOSS_FRUIT[e.def.name] || null) : null;
// ---- spawn-time scaling ----
export function onSpawn(g, e) {
  const L = e.lvl || 1; e.poiseN = 0; e.armorT = 0; e.blockT = 0; e.invT = 0;
  if (e.boss) { const k = 2.1 + Math.min(1, L / 400) * 0.8; e.hp = e.max = Math.round(e.max * k); e.dmgMul = 1.35; e.phase = 1; e.spCd = 9; e.fruitId = BOSS_FRUIT[e.def.name] || null; return e; }
  const sea = 1.25 + Math.min(1, L / 300) * 0.55; e.dmgMul = 1.15 + Math.min(1, L / 300) * 0.35; e.spdMul = 1.12;
  if (!e.temp && !e.duelFoe && !e.s.noElite && Math.random() < 0.14) { e.elite = true; e.dmgMul *= 1.55; e.spdMul = 1.25; e.c.root.scale.multiplyScalar(1.16);
    const ring = new B.Mesh(new B.RingGeometry(0.62, 0.8, 28), new B.MeshBasicMaterial({ color: 0xffc23a, transparent: true, opacity: 0.8, side: B.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; ring.userData.eliteRing = true; e.c.root.add(ring); }
  e.hp = e.max = Math.round(e.max * sea * (e.elite ? 2.4 : 1) * (e.s.quest ? 1.15 : 1)); return e;
}
export const extraPack = s => !s.boss && Math.random() < 0.45;
// ---- damage-time: i-frames, block, poise ----
export function preHit(g, e, dmg, o) {
  if (o.remote) return dmg;
  if (e.invT > 0) { if (!e._ivn || g.t - e._ivn > 0.4) { e._ivn = g.t; g.fx.shock(g.chest(e, V()), 0xffffff, 2.2, 0.25); } return 0; }
  if (e.duelFoe) { const k = o.mastName || o.mast || 'm1'; if (k === e._lastK && g.t - e._lastKT < 6) e._rep = (e._rep || 0) + 1; else e._rep = 0; e._lastK = k; e._lastKT = g.t;
    if (e._rep >= 2) { dmg *= Math.max(k === 'm1' ? 0.35 : 0.2, 1 - 0.22 * (e._rep - 1)); if (e._rep === 3) g.ui.toast(`${e.def.name} is reading that move — mix it up!`, 'blk'); } }
  if (e.blockT > 0 && (!e.boss || e.duelFoe)) { e.blockT -= 0.15; g.fx.sparks(g.chest(e, V()), 8, 0xdfe6ff, { speed: 7 }); audio.sfx('block', { vol: 0.5, gap: 80 }); e._blocked = g.t; return dmg * 0.25; }
  return dmg;
}
// true = enemy shrugs off the hit (no stagger). After ~3 quick hits a grunt gains poise and counterattacks.
export function armored(g, e) {
  if (e.armorT > 0) return true;
  if (g.t - (e._pT || -9) > 1.4) e.poiseN = 0; e._pT = g.t; e.poiseN++;
  if (e.poiseN >= (e.elite ? 2 : 3)) { e.poiseN = 0; e.armorT = e.elite ? 2.2 : 1.6; g.fx.ring(e.c.root.position.clone().setY(e.c.root.position.y + 0.15), 0xffb03a, 1.8, 0.35); g.fx.burst(g.chest(e, V()), 10, 0xffd07a, { speed: 4, size: 0.3, life: 0.3, grav: 0 });
    e.state = 'windup'; e.atk = 0.28; e.counter = true; return true; }
  return false;
}
// ---- per-frame AI additions (called from updateEnemies before the state machine) ----
export function tick(g, e, dt, dist) {
  e.armorT -= dt; e.blockT -= dt; e.invT -= dt; const p = g.p; const R = e.c.root;
  if (e.armorT > 0 && e.state === 'hit') e.state = 'chase';
  if (e.aggro && !e._alerted) { e._alerted = true; for (const o of g.enemies) if (o !== e && !o.dead && !o.boss && !o.aggro && o.c.root.position.distanceTo(R.position) < 15) { o.aggro = true; o._alerted = true; } }
  if (!e.aggro) e._alerted = false;
  if (!e.boss) {
    if (e.aggro && e.state === 'chase' && dist < 3.4 && e.blockT <= 0 && g.t - (e._blkT || 0) > 3 && g.t - (p._atkT || -9) < 0.5 && Math.random() < dt * (e.elite ? 5 : 2.2)) { e.blockT = 0.8; e._blkT = g.t; }
    e.anim.block = e.blockT > 0;
    if (e.state === 'windup' && !e._wset) { e._wset = true; if (!e.def.ranged && !e.counter && Math.random() < (e.elite ? 0.45 : 0.25)) { e.heavy = true; e.atk = 0.95; const r = g.fx.ring(R.position.clone().setY(R.position.y + 0.12), 0xff3020, 0.01, 0.95, true, 0.6); r.scale.setScalar(3.2); } }
    if (e.state !== 'windup') { e._wset = false; e.counter = false; }
    return;
  }
  bossTick(g, e, dt, dist);
}
// heavy telegraphed grunt hit / counter: returns true when handled
export function strike(g, e, dist) {
  if (e.heavy) { e.heavy = false; const P = e.c.root.position; g.fx.ring(P.clone().setY(P.y + 0.2), 0xffffff, 3.4, 0.35); g.fx.burst(P.clone().setY(P.y + 0.3), 18, 0xc9a87a, { speed: 7, up: 3, size: 0.4, life: 0.5 }); g.fx.shake = Math.max(g.fx.shake, 0.3);
    if (dist < 3.4) g.hurtPlayer(e.def.dmg * (1 + (e.lvl - 1) * 0.1) * (e.dmgMul || 1) * 1.8, P, { kb: 7 }); e.state = 'chase'; e.cd = e.def.cd; e.anim.attack = 1; return true; }
  return false;
}
// ---- bosses ----
function telegraph(g, at, r, dur, col = 0xff3020) { const q = at.clone(); q.y = at.y + 0.12;
  const base = new B.Mesh(new B.CircleGeometry(1, 40), new B.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.18, depthWrite: false, side: B.DoubleSide })); base.position.copy(q); base.rotation.x = -Math.PI / 2; base.scale.setScalar(r); base.renderOrder = 3;
  const fill = new B.Mesh(new B.CircleGeometry(1, 40), new B.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35, depthWrite: false, side: B.DoubleSide })); fill.position.z = 0.01;
  const edge = new B.Mesh(new B.RingGeometry(0.93, 1, 48), new B.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false, side: B.DoubleSide })); edge.position.z = 0.02; base.add(fill, edge);
  g.fx.add(base, dur, t => { fill.scale.setScalar(Math.max(0.01, t)); edge.material.color.setHex(Math.sin(t * 40) > 0 ? 0xffffff : col); base.material.opacity = 0.18 + t * 0.12; if (t >= 1) base.traverse(m => { m.geometry && m.geometry.dispose(); if (m !== base) m.material.dispose(); }); }); return q; }
function bossDmg(e) { return e.def.dmg * (1 + (e.lvl - 1) * 0.1) * (e.dmgMul || 1); }
function peerOf(g, e, tgt) { const R = e.c.root; const d = tgt.clone().sub(R.position).setY(0).normalize(); return { yaw: Math.atan2(-d.x, -d.z), av: { root: R }, name: e.def.name }; }
export function phaseCheck(g, e) {
  const fr = e.hp / e.max; const want = fr < 0.33 ? 3 : fr < 0.66 ? 2 : 1;
  if (want > (e.phase || 1)) { e.phase = want; e.invT = 1.4; e.roarT = 1.4; e.skillCd = 1.8; e.spCd = Math.min(e.spCd, 3); const R = e.c.root;
    g.ui.banner(`${e.def.name} — Phase ${want}`, want === 3 ? 'ENRAGED! Watch the red rings' : 'Powering up! Minions incoming'); g.fx.shock(R.position.clone().setY(R.position.y + 1), 0xff3a2a, 12, 0.8, 3); g.fx.ring(R.position.clone().setY(R.position.y + 0.2), 0xffffff, 10, 0.6); g.fx.shake = Math.max(g.fx.shake, 0.7); audio.sfx('boom');
    const p = g.p.pos; if (p.distanceTo(R.position) < 6) g.hurtPlayer(bossDmg(e) * 0.6, R.position, { kb: 14 });
    summon(g, e, want === 3 ? 3 : 2); if (want === 3) { e.enraged = true; e.dmgMul *= 1.25; e.spdMul = 1.35; } }
}
function summon(g, e, n) { const isl = g.island && g.island.id; const type = isl && g.island.spawns && (g.island.spawns.find(s => !s.boss) || {}).type; if (!type) return; const R = e.c.root.position;
  for (let i = 0; i < n; i++) { const a = i / n * 6.283 + Math.random(); const x = R.x + Math.cos(a) * 4, z = R.z + Math.sin(a) * 4; const m = g.spawnEnemy({ type, x, z, lvl: e.lvl - 4, noElite: true }); if (!m) continue; m.temp = true; m.aggro = true; m.minion = true; g.fx.pillar(V(x, g.groundAt(x, z), z), 0xff3a2a, 1, 6, 0.6); } }
function bossTick(g, e, dt, dist) {
  const R = e.c.root, p = g.p; if (!e.aggro) return; phaseCheck(g, e);
  if (e.roarT > 0) { e.roarT -= dt; e.anim.taunt = true; if (e.state !== 'skill') { e.state = 'skill'; e.atk = e.roarT; e.skillUpd = null; } return; } e.anim.taunt = false;
  // anti-air: hovering/jumping/flying over the arena gets shot down
  const air = p.pos.y - g.groundAt(p.pos.x, p.pos.z); e.aaCd = (e.aaCd ?? 2) - dt;
  if ((air > 2.6 || (g.trv && g.trv.on)) && dist < e.s.arena.r + 12 && e.aaCd <= 0) { e.aaCd = 2.2; const o = g.chest(e, V()); const d = g.eyePos().clone().sub(o).normalize();
    g.fx.beam(o, o.clone().addScaledVector(d, 30), 0xff5a3a, 0.5, 0.25); g.fx.shock(o, 0xff5a3a, 3, 0.3); g.ui.toast(`${e.def.name}: "No hiding in the sky!"`, 'boss');
    const m = new B.Mesh(g.fx.sphGeo, new B.MeshBasicMaterial({ color: 0xff7a3a, transparent: true, blending: B.AdditiveBlending, depthWrite: false })); m.scale.setScalar(0.6);
    g.projectile({ pos: o, vel: d.multiplyScalar(34), r: 1.3, dmg: bossDmg(e) * 1.2, life: 2, player: false, mesh: m });
    if (g.trv && g.trv.on) { g.trv.stop('off'); g.ui.toast('💥 Knocked out of the sky!', 'blk'); } }
  // fruit moves (replace the old generic skill): telegraphed ring at your feet, then the boss casts the move with the new visuals
  const id = bossFruitOf(e); if (!id || !FRUITS[id]) return; e.spCd -= dt;
  if (e.state === 'skill' || e.state === 'windup') return;
  if (e.spCd <= 0 && dist < e.s.arena.r + 10) { e.spCd = (e.phase === 3 ? 13 : 18) + Math.random() * 4; e.skillCd = Math.max(e.skillCd, 4); return bossSpecial(g, e, id); }
  if (e.skillCd <= 0 && dist < 22) { e.skillCd = (e.phase === 3 ? 2.6 : e.phase === 2 ? 3.4 : 4.4) + Math.random() * 1.5; bossMove(g, e, id); }
}
export function bossMove(g, e, id, idx) {
  const f = FRUITS[id], R = e.c.root, P = g.p; if (idx == null) idx = Math.floor(Math.random() * f.moves.length); const mv = f.moves[idx]; const D = bossDmg(e) * (0.9 + (mv.dmg || 2) * 0.22);
  const wind = e.phase === 3 ? 0.6 : 0.8; const tgt = telegraph(g, P.pos, 3.2, wind); const col = f.col[0]; let t = 0, fired = false;
  g.ui.toast(`${e.def.name}: "${mv.name}!"`, 'boss'); g.ui.moveName(mv.name, col); e.state = 'skill'; e.atk = wind + 0.5; e.yaw = Math.atan2(P.pos.x - R.position.x, P.pos.z - R.position.z);
  e.skillUpd = dt => { t += dt; e.anim.windup = t < wind; if (t < wind && Math.random() < 0.6) g.fx.burst(g.chest(e, V()), 2, col, { speed: 2, size: 0.4, life: 0.3, grav: -2 });
    if (!fired && t >= wind) { fired = true; e.anim.attack = 1; e.anim.windup = false; try { remoteMove(g, peerOf(g, e, tgt), `mv:${id}:${idx}`, g.chest(e, V())); } catch (er) { /* visual only */ }
      g.fx.shock(tgt.clone().setY(tgt.y + 0.3), col, 3.4, 0.35); g.fx.burst(tgt.clone().setY(tgt.y + 0.5), 16, col, { speed: 6, up: 4, size: 0.5, life: 0.5 });
      const o = g.chest(e, V()), d = tgt.clone().sub(o), L = d.length(); d.normalize(); const to = P.pos.clone().setY(P.pos.y + 0.8).sub(o); const tt = Math.max(0, Math.min(L, to.dot(d))); const offLine = to.addScaledVector(d, -tt).length();
      if (P.pos.distanceTo(tgt) < 3.3 || (offLine < 1.3 && tt > 1)) g.hurtPlayer(D, tgt, { kb: 7 }); } };
}
export function bossSpecial(g, e, id) {
  const f = FRUITS[id], R = e.c.root, P = g.p; const name = (f.special && f.special.name) || `${f.short} Cataclysm`; const W = 1.7, r = Math.min(13, e.s.arena.r + 1); const c0 = R.position.clone(); telegraph(g, c0, r, W, 0xff1a1a); const col = f.col[0], col2 = f.col[1] || 0xffffff;
  g.ui.banner(`⚠ ${name}`, `${e.def.name}'s special — get out of the red circle!`); audio.sfx('special'); e.state = 'skill'; e.atk = W + 1.1; let t = 0, fired = 0;
  e.skillUpd = dt => { t += dt; R.userData.air = Math.min(2.2, (R.userData.air || 0) + dt * 2) * (t < W + 0.3 ? 1 : 0); e.anim.windup = t < W; e.anim.taunt = t < W * 0.5;
    if (t < W && Math.random() < 0.9) { const a = Math.random() * 6.283; g.fx.burst(c0.clone().add(V(Math.cos(a) * r * 0.9, 0.5, Math.sin(a) * r * 0.9)), 2, col, { speed: 1, up: 6, size: 0.5, life: 0.5, grav: -4 }); }
    if (fired === 0 && t >= W) { fired = 1; e.anim.attack = 1; const n = f.moves.length; for (let k = 0; k < 2; k++) { const a = k * 3.1 + Math.random(); const q = c0.clone().add(V(Math.cos(a) * 5, 0, Math.sin(a) * 5)); setTimeout(() => { try { remoteMove(g, peerOf(g, e, q), `mv:${id}:${n - 1 - k}`, g.chest(e, V())); } catch (er) { } }, k * 260); }
      for (let i = 0; i < 4; i++) g.fx.shock(c0.clone().setY(c0.y + 0.4 + i * 0.3), i % 2 ? col2 : col, r * (0.6 + i * 0.25), 0.5 + i * 0.2, 3); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.fx.pillar(V(c0.x + Math.cos(a) * r * 0.75, g.groundAt(c0.x + Math.cos(a) * r * 0.75, c0.z + Math.sin(a) * r * 0.75), c0.z + Math.sin(a) * r * 0.75), i % 2 ? col : col2, 1.4, 14, 0.9); }
      g.fx.shake = 1.2; audio.sfx('boom'); if (P.pos.distanceTo(c0) < r) g.hurtPlayer(bossDmg(e) * 3, c0, { kb: 16 }); else g.ui.toast('Dodged the special!', 'blk'); } };
}
