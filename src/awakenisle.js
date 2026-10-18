// Awakening Isle: awakening is no longer bought. Sail/fly to the Awakening Isle, talk to The Awakener (fruit mastery 40 gate),
// clear a trial gauntlet (3 waves of tough enemies) and beat the Awakening Guardian; the fruit then awakens with a short cinematic.
// Saves keep their S.awake map untouched, so fruits awakened the old way stay awakened.
import { THREE as B } from './engine.js';
import { ISLANDS, FRUITS } from './data.js';
import * as ST from './state.js';
import { audio } from './audio.js';
import { showBody } from './ultra.js';
import { ctxFor } from './skills.js';
export const AW_ISLE = 'awaken', AW_MASTERY = 40;
const V = (x = 0, y = 0, z = 0) => new B.Vector3(x, y, z);
export function addAwakenIsland(IDEFS, E) {
  if (!ISLANDS.some(i => i.id === AW_ISLE)) ISLANDS.push({ id: AW_ISLE, name: 'Awakening Isle', sea: 1, lvl: 60, x: 31, y: 81 });
  IDEFS[AW_ISLE] = { theme: 'gold', pal: { sky: [0x3a2a7a, 0xe8c8ff], fog: 0xd8c0f0, grass: 0x6aa07a, sand: 0xe8dcc0, rock: 0x7a6a9a }, roofs: [0x6a3aaa, 0xffd04a], landmark: 'tower', giver: 'Monk Sorai', drop: 'Awakening Shard', trees: 4,
    e1: E('Trial Spirit', { shirt: 0x6a4aaa, pants: 0x2a1a4a, band: 0xb08aff, skin: 0xc8c0ff, hairS: 'wild', hair: 0xe8e0ff }, 900, 55, { drop: 'Awakening Shard', spd: 3.4 }),
    e2: E('Awakening Sentinel', { shirt: 0x2a2a3a, pants: 0x1a1a2a, coat: 0xffd04a, hairS: 'bald', glasses: 'shades', weapon: 'sabre' }, 1300, 65, { spd: 3.1 }),
    boss: { name: 'Awakening Guardian', title: 'Keeper of the Inner Sea', bounty: '???', hp: 9000, dmg: 90, look: { body: 'brute', shirt: 0x1a1030, coat: 0x6a3aaa, pants: 0x1a1030, hairS: 'long', hair: 0xffffff, big: 1.4, cape: 0xffd04a, mouth: 'teeth' }, scale: 1.7, taunt: 'Show me the power sleeping inside your fruit!', skills: [['slam', 'Awakening Quake', 0xb08aff], ['rain', 'Inner Sea Rain', 0x7ad0ff], ['beam', 'Soul Lance', 0xffd04a]] } };
}
// add The Awakener + trial ring to the generated island
export function decorateIsland(I) { if (I.id !== AW_ISLE || I.npcs.some(n => n.role === 'awakener')) return; const z = I.R * 0.4 - 7;
  I.npcs.push({ id: 'awakener', look: 'villager', name: 'The Awakener', role: 'awakener', x: 3.5, z, ry: -Math.PI / 2, over: { shirt: 0x6a3aaa, coat: 0xffd04a, hair: 0xffffff, hairS: 'long', mouth: 'line', brow: 'kind' } });
  I.landmarks = I.landmarks || []; I.landmarks.unshift({ n: 'Awakening Trial Ring', x: 0, z: z - 14 }); }
export class AwakenTrial {
  constructor(g) { this.g = g; this.active = false; this.mobs = []; this.wave = 0; this.gap = 0; }
  req() { const g = this.g, S = g.save, id = S.eq.fruit, f = id && FRUITS[id]; const m = f ? ST.mastery(S, 'fr:' + id).lvl : 0;
    return { id, f, m, ok: !!f && f.rar >= 4 && m >= AW_MASTERY && !(S.awake && S.awake[id]), done: !!(f && S.awake && S.awake[id]), low: !f || f.rar < 4 }; }
  html() { const r = this.req(); const f = r.f;
    const st = !f ? '<p class="dim">Eat a Legendary, Godly, Mythical or Ultra Devil Fruit first.</p>' : r.low ? `<p class="dim">${f.name} is too weak to awaken. Only Legendary+ fruits can.</p>` : r.done ? `<p class="gold">✦ Your ${f.short} is already awakened. Toggle its kit in your Backpack.</p>`
      : `<div class="qcard"><b>Awakening Trial — ${f.name}</b><span>${r.m >= AW_MASTERY ? '✔' : '✘'} Fruit mastery ${AW_MASTERY} (you: ${r.m})</span><span>3 waves of trial enemies, then the Awakening Guardian. Dying ends the trial.</span></div>
         <button class="go" data-do="awk:start" ${r.ok && !this.active ? '' : 'disabled'}>${this.active ? 'Trial in progress…' : 'Begin the Trial'}</button>`;
    return `<h2>✦ The Awakener</h2><p class="dim">"A fruit's true power sleeps deep inside. Gold can't wake it — only a trial can."</p>${st}`; }
  act(a) { if (a === 'start') { this.g.ui.close(); this.start(); } }
  center() { const n = this.g.npcs.find(x => x.role === 'awakener'); const p = n ? n.c.root.position : this.g.p.pos; return V(p.x - 2, 0, p.z - 14); }
  start() { const r = this.req(); if (!r.ok || this.active) return false; this.active = true; this.fruit = r.id; this.wave = 0; this.gap = 1.2; this.mobs = []; this.c0 = this.center(); this.c0.y = this.g.groundAt(this.c0.x, this.c0.z);
    this.g.ui.banner('AWAKENING TRIAL', `${r.f.name} — survive 3 waves, then defeat the Guardian`); audio.sfx('special'); return true; }
  spawnWave() { const g = this.g, S = g.save; this.wave++; const L = Math.max(S.lvl, 60) + 4 + this.wave * 3; const c = this.c0;
    if (this.wave <= 3) { const n = 3 + this.wave; for (let i = 0; i < n; i++) { const a = i / n * 6.283; const x = c.x + Math.cos(a) * 8, z = c.z + Math.sin(a) * 8; const e = g.spawnEnemy({ type: AW_ISLE + (i % 2 ? '_e2' : '_e1'), x, z, lvl: L }); e.temp = true; e.aggro = true; e.trial = true; this.mobs.push(e); g.fx.pillar(V(x, g.groundAt(x, z), z), 0xb08aff, 1, 8, 0.7); }
      g.ui.banner(`Wave ${this.wave} / 3`, 'Trial enemies'); }
    else { const e = g.spawnEnemy({ type: AW_ISLE + '_boss', x: c.x, z: c.z, lvl: L + 6, boss: true, arena: { x: c.x, z: c.z, r: 12 } }); e.temp = true; e.trial = true; e.aggro = true; g.bossIntroDone[e.s.type] = false; this.mobs.push(e); this.guardian = e; g.ui.banner('The Awakening Guardian', 'Final trial'); g.fx.shock(V(c.x, c.y + 1, c.z), 0xffd04a, 14, 0.8, 3); }
    this.g.ui.toast(`✦ Trial wave ${Math.min(4, this.wave)} — ${this.wave > 3 ? 'Guardian' : this.mobs.filter(m => !m.dead).length + ' enemies'}`, 'boss'); }
  fail(why) { const g = this.g; for (const e of this.mobs) if (!e.dead) { e.dead = true; e.deadT = 3; e.c.root.visible = false; } this.mobs = []; this.active = false; g.ui.toast(why, 'blk'); }
  target() { if (!this.active) return null; const P = this.g.p.pos; let b = null, bd = 1e9; for (const e of this.mobs) if (!e.dead) { const d = e.c.root.position.distanceTo(P); if (d < bd) { bd = d; b = e; } } const q = b ? b.c.root.position : this.c0; return { x: q.x, z: q.z, label: b ? (this.wave > 3 ? '👑 Awakening Guardian' : `✦ Trial wave ${this.wave}/3`) : '✦ Trial ring' }; }
  update(dt) { if (!this.active) return; const g = this.g; if (g.island.id !== AW_ISLE) return this.fail('✘ You left the Awakening Isle — trial abandoned');
    if (g.dead) return this.fail('✘ You fell — the trial is over. Talk to The Awakener to retry');
    if (g.save.eq.fruit !== this.fruit) return this.fail('✘ Your fruit changed — trial abandoned');
    const alive = this.mobs.some(e => !e.dead); if (alive) return; this.gap -= dt; if (this.gap > 0) return;
    if (this.wave < 4) { this.mobs = []; this.gap = 2.2; this.spawnWave(); return; }
    this.active = false; this.complete(); }
  complete() { const g = this.g, S = g.save, id = this.fruit; S.awake = S.awake || {}; S.awake[id] = true; S.awk = S.awk || {}; S.awk.kit = S.awk.kit || {}; S.awk.kit[id] = 'awake'; if (!S.mastery['aw:' + id]) S.mastery['aw:' + id] = { lvl: 10, xp: 0 }; S.awk.seen = S.awk.seen || {}; S.awk.seen[id] = 1; ST.save(S); cutscene(g, id); }
}
// cinematic: camera orbits, an aura bursts around the player, the fruit's colours flood the scene, title card
export function cutscene(g, id, D = 4.2) { const f = FRUITS[id], col = f.col[0], col2 = f.col[1] || 0xffffff; const P0 = g.p.pos.clone(); const c = ctxFor(g, { fruit: id }); let body = null; try { body = showBody(c, P0.clone()); } catch (e) { body = null; }
  const look = new B.PerspectiveCamera(); const fov0 = g.cam.fov; let t = 0, burst = false; g.hideVM = true; g.ui.letterbox(true); audio.sfx('special');
  const U = g.sky.userData.mat.uniforms, top0 = U.top.value.clone(), bot0 = U.bot.value.clone(); const aura = new B.Mesh(new B.SphereGeometry(1, 24, 16), new B.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, blending: B.AdditiveBlending, depthWrite: false })); aura.position.copy(P0).add(V(0, 1.1, 0)); g.scene.add(aura);
  let card = document.getElementById('awkCard'); if (!card) { card = document.createElement('div'); card.id = 'awkCard'; document.body.appendChild(card); } card.innerHTML = `<small>✦ AWAKENED ✦</small><b>${f.name}</b><i>New awakened kit + awakened special unlocked</i>`; card.style.setProperty('--c', '#' + new B.Color(col).getHexString()); card.className = '';
  g.cut = { update: dt => { t += dt; const k = Math.min(1, t / D); const a = g.p.yaw + Math.PI + t * 1.25; const r = 6.5 - k * 2.2; const cp = P0.clone().add(V(Math.sin(a) * r, 1.6 + k * 1.4, Math.cos(a) * r)); g.cam.position.copy(cp); look.position.copy(cp); look.lookAt(P0.clone().add(V(0, 1.2, 0))); g.cam.quaternion.copy(look.quaternion);
      const dk = Math.min(1, t * 1.5) * (t > D - 0.5 ? (D - t) / 0.5 : 1); U.top.value.copy(top0).lerp(new B.Color(0x07031a), dk); U.bot.value.copy(bot0).lerp(new B.Color(col).multiplyScalar(0.5), dk);
      if (body) body.tick({ aim: t > 1.2 }); if (Math.random() < 0.9) { const q = P0.clone().add(V((Math.random() - 0.5) * 3, 0.2, (Math.random() - 0.5) * 3)); g.fx.burst(q, 2, Math.random() < 0.5 ? col : col2, { speed: 1, up: 7, size: 0.5, life: 0.8, grav: -6 }); }
      const as = t < 1.3 ? 0.6 + t * 0.6 : 1.4 + Math.sin(t * 10) * 0.15 + (t - 1.3) * 0.8; aura.scale.setScalar(as); aura.material.opacity = Math.min(0.45, t * 0.4) * (t > D - 0.4 ? (D - t) / 0.4 : 1);
      if (!burst && t > 1.3) { burst = true; for (let i = 0; i < 4; i++) g.fx.shock(P0.clone().add(V(0, 0.3 + i * 0.5, 0)), i % 2 ? col2 : col, 6 + i * 3, 0.6 + i * 0.15, 3); g.fx.pillar(P0.clone(), col, 2.2, 30, 1.6); g.fx.burst(P0.clone().add(V(0, 1.2, 0)), 80, col, { speed: 10, size: 0.6, life: 1 }); g.fx.shake = 0.8; audio.sfx('boom'); card.className = 'go'; }
      if (t >= D) { g.cut = null; g.hideVM = false; g.ui.letterbox(false); U.top.value.copy(top0); U.bot.value.copy(bot0); g.scene.remove(aura); aura.geometry.dispose(); aura.material.dispose(); body && body.dispose(); g.cam.fov = fov0; g.cam.updateProjectionMatrix(); setTimeout(() => { card.className = 'out'; }, 900);
        g.ui.banner('AWAKENED!', `${f.name} — new awakened kit + special`); g.updateMovesSoon = true; g.ui.updateMoves && g.ui.updateMoves(); g.ui.updateHud && g.ui.updateHud(); } } };
}
