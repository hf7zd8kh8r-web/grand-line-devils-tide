// Player duels vs fake AI (and real players who accept). Arena + countdown + rewards. Keep hooks in game/ui tiny.
import { THREE, Builder, mat, WORLD_MAT, setOutlinesVisible, damp } from './engine.js';
import * as HD from './hard.js';
import { FRUITS, SWORDS, GUNS } from './data.js';
import { STYLES } from './styles.js';
import { makeAvatar } from './models.js';
import { IN } from './input.js';
import * as ST from './state.js';
const B = THREE;
const V = (x = 0, y = 0, z = 0) => new B.Vector3(x, y, z);
const tmp = V();

export const DIFF = (you, them) => {
  const d = (them - you) / Math.max(8, you * 0.25);
  if (d <= -1.2) return { stars: 1, label: 'Easy' };
  if (d <= -0.3) return { stars: 2, label: 'Fair' };
  if (d <= 0.4) return { stars: 3, label: 'Even' };
  if (d <= 1.2) return { stars: 4, label: 'Hard' };
  return { stars: 5, label: 'Brutal' };
};
export const rewardOf = (you, them) => {
  const lvl = Math.max(1, them | 0); const mul = 0.85 + Math.min(1.4, Math.max(0.5, lvl / Math.max(1, you)));
  return { ber: Math.round(180 * lvl * mul), xp: Math.round(35 * lvl * mul), bounty: Math.round(25000 * lvl * mul) };
};
export function loadout(f) {
  const lv = f.lvl | 0; let sd = ((String(f.id || 'fp0').replace(/\D/g, '') || '1') | 0) * 9973 + 17;
  const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const pool = Object.keys(FRUITS).filter(k => !FRUITS[k].ultra && FRUITS[k].rar <= Math.min(6, 1 + (lv / 55 | 0)));
  const fruit = f.fruit && FRUITS[f.fruit] ? f.fruit : pool[Math.floor(r() * pool.length)];
  const swords = Object.keys(SWORDS).filter(k => !SWORDS[k].secret && (SWORDS[k].minLvl || 1) <= lv + 5);
  const guns = Object.keys(GUNS).filter(k => (GUNS[k].minLvl || 1) <= lv + 5);
  const styles = Object.keys(STYLES).filter(k => !STYLES[k].from);
  return { fruit, sword: swords[Math.floor(r() * swords.length)] || null, gun: r() < 0.45 && guns.length ? guns[Math.floor(r() * guns.length)] : null, style: styles[Math.floor(r() * styles.length)] || 'brawler' };
}
const KIND_MAP = { 'g:proj': 'fan', 'g:barrage': 'fan', 'g:aoe': 'slam', 'g:wave': 'slam', 'g:dash': 'lunge', 'g:beam': 'beam', 'g:rain': 'rain', 'g:blink': 'blink', 'g:orbit': 'spin', 'g:special': 'beam', proj: 'fan', aoe: 'slam', dash: 'lunge', beam: 'beam', rain: 'rain', blink: 'blink', wave: 'slam', orbit: 'spin', spin: 'spin', slash: 'lunge' };

export class Duel {
  constructor(g) {
    this.g = g; this.on = false; this.phase = null; this.foe = null; this.arena = null; this.t = 0;
    this.saved = null; this.offer = null; this.peer = null; this._chalT = 28 + Math.random() * 40; this._usedMove = false; this._waitPeer = null;
  }
  active() { return this.on; }
  hf(x, z) { if (!this.arena) return 0; const d = Math.hypot(x - this.arena.cx, z - this.arena.cz); return d > this.arena.R + 0.4 ? -2 : this.arena.floorY; }

  cardHtml() {
    const vs = this.offer; if (!vs) return '<h2>Duel</h2>';
    const you = this.g.save.lvl, them = vs.lvl; const D = DIFF(you, them); const rw = rewardOf(you, them); const L = vs.load || loadout(vs.fake || vs);
    const fr = FRUITS[L.fruit]; const stars = '★'.repeat(D.stars) + '☆'.repeat(5 - D.stars);
    return `<h2>⚔ Challenge to Duel</h2><p class="say">“${vs.name} wants a fair fight in the Colosseum!”</p>
      <div class="duelcard"><b>${vs.name}</b><span>Lv.${them} ${vs.faction || 'Pirate'} · ${D.label} ${stars}</span>
      <small>Fruit: ${fr ? fr.name : '—'} · Style: ${(STYLES[L.style] || {}).name || L.style}${L.sword ? ' · ' + SWORDS[L.sword].name : ''}</small>
      <small class="gold">Win: ฿${rw.ber.toLocaleString()} · ${rw.xp} XP · bounty +฿${rw.bounty.toLocaleString()}</small></div>
      <p class="dim">No death penalty if you lose. Forfeit anytime with the button.</p>
      <button class="go" data-do="duelok">Accept Duel</button> <button data-do="duelno">Decline</button>`;
  }
  openOffer(vs) { this.offer = { ...vs, load: vs.load || loadout(vs.fake || vs) }; this.g.ui.open('duel'); }
  challengeFake(f) { if (this.on) return; this.openOffer({ kind: 'fake', id: f.id, name: f.name, lvl: f.lvl, faction: f.faction, fake: f }); }
  challengePeer(p) {
    if (this.on || !this.g.net || this.g.net.status !== 'online') return;
    this.g.net.send({ t: 'duel', k: 'req', to: p.id, lvl: this.g.save.lvl, name: this.g.save.name, faction: this.g.save.faction });
    this.g.ui.toast(`Challenged ${p.name}…`, 'quest'); this._waitPeer = p.id;
  }
  onNet(m) {
    const g = this.g;
    if (m.k === 'req') {
      const p = g.net.peers.get(m.id); if (!p || this.on) { g.net.send({ t: 'duel', k: 'no', to: m.id }); return; }
      this.openOffer({ kind: 'peer', id: m.id, name: p.name || m.name, lvl: m.lvl || p.lvl || 1, faction: m.faction || 'Pirate', peer: p });
    } else if (m.k === 'ok') {
      if (this._waitPeer !== m.id) return; this._waitPeer = null; const p = g.net.peers.get(m.id); if (!p) return;
      this.begin({ kind: 'peer', id: m.id, name: p.name, lvl: m.lvl || 1, faction: m.faction || 'Pirate', peer: p });
    } else if (m.k === 'no') {
      if (this._waitPeer === m.id) { this._waitPeer = null; g.ui.toast('Duel declined', 'blk'); }
      if (g.ui.modal === 'duel') g.ui.close(true);
    } else if (m.k === 'end') { if (this.on && this.peer === m.id) this.finish(m.win ? 'lose' : 'win', 'peer'); }
  }
  accept() {
    if (!this.offer || this.on) return; const o = this.offer; this.offer = null; this.g.ui.close(true);
    if (o.kind === 'peer') this.g.net.send({ t: 'duel', k: 'ok', to: o.id, lvl: this.g.save.lvl, name: this.g.save.name, faction: this.g.save.faction });
    this.begin(o);
  }
  decline() { if (this.offer && this.offer.kind === 'peer') this.g.net.send({ t: 'duel', k: 'no', to: this.offer.id }); this.offer = null; this.g.ui.close(true); }

  begin(vs) {
    if (this.on) return; const g = this.g, S = g.save;
    this.on = true; this.phase = 'intro'; this.t = 0; this.vs = vs; this.peer = vs.kind === 'peer' ? vs.id : null;
    this.load = vs.load || loadout(vs.fake || vs); this.rw = rewardOf(S.lvl, vs.lvl); this._usedMove = false;
    this.saved = { x: g.p.pos.x, y: g.p.pos.y, z: g.p.pos.z, yaw: g.p.yaw, pitch: g.p.pitch, hp: S.hp };
    g.island.group.visible = false;
    for (const e of g.enemies) { e._duelHide = e.c.root.visible; e.c.root.visible = false; }
    for (const o of g.fakes || []) { o._duelHide = o.c.root.visible; o.c.root.visible = false; }
    for (const n of g.npcs || []) { n._duelHide = n.c.root.visible; n.c.root.visible = false; if (n.mark) n.mark.visible = false; }
    if (g.table && g.table.grp) g.table.grp.visible = false;
    g.ui.close(true); g.seat = null; g.vm && (g.vm.root.visible = true);
    this.buildArena();
    g.p.pos.set(this.arena.cx, this.arena.floorY, this.arena.cz + 7); g.p.yaw = Math.PI; g.p.pitch = -0.08; g.p.vy = 0; g.p.kb = null; g.p.lunge = null; g.p.iframe = 2; S.hp = g.st.maxHp;
    this.spawnFoe(); this.ensureHud(); this.showHud(false);
    g.ui.banner('DUEL!', `${vs.name} · Lv.${vs.lvl}`); g.ui.letterbox(true); document.body.classList.add('cine');
    this._introT = 1.5;
  }
  spawnFoe() {
    const g = this.g, vs = this.vs, L = this.load; const fr = FRUITS[L.fruit];
    const look = (vs.fake && vs.fake.look) || { shirt: 0x3a6ab0, pants: 0x2a2a2a, hair: 0x1a1a1a };
    const c = makeAvatar(vs.faction || 'Pirate', (vs.fake && vs.fake.race) || 'Human', look, (vs.fake && vs.fake.cos) || {});
    const ax = this.arena.cx, az = this.arena.cz, fy = this.arena.floorY;
    c.root.position.set(ax, fy, az - 7); c.root.rotation.y = 0; g.scene.add(c.root); setOutlinesVisible(c.root);
    const stars = DIFF(g.save.lvl, vs.lvl).stars;
    const hp = Math.round((150 + vs.lvl * 24) * (0.9 + stars * 0.08) * 1.35);
    const dmg = Math.round((11 + vs.lvl * 1.15) * 1.25);
    const skills = [];
    if (fr) for (const m of fr.moves.slice(0, 4)) skills.push([KIND_MAP[m.k] || 'lunge', m.name, fr.col[0]]);
    if (L.sword && SWORDS[L.sword]) skills.push(['lunge', SWORDS[L.sword].name + ' Slash', 0xbfe0ff]);
    if (!skills.length) skills.push(['lunge', 'Rush', 0xffd04a], ['slam', 'Ground Pound', 0xc9a87a]);
    const def = { name: vs.name, hp, dmg, spd: 5.3 + Math.min(2.4, vs.lvl * 0.012), reach: 2.25, cd: 0.8, ranged: false, scale: 1, skills, look, taunt: 'Let\'s duel!', title: 'Duelist', bounty: 'Duel' };
    const e = { s: { type: 'duel_' + (vs.id || 'x'), x: ax, z: az - 10, lvl: vs.lvl, arena: { r: 18 } }, def, c, hp, max: hp, lvl: vs.lvl, home: V(ax, 0, az - 7), vel: V(), state: 'idle', t: 0, atk: 0, cd: 0.9, hitT: 0, flash: 0, dead: false, deadT: 0, anim: { phase: 0 }, yaw: 0, wander: V(ax, 0, az - 7), boss: true, aggro: true, phase2: false, skillCd: 0.4, duelFoe: true, temp: true, ext: (dt) => this.tickFoe(e, dt) };
    g.enemies.push(e); this.foe = e;
  }
  tickFoe(e, dt) {
    if (!this.on) return;
    if (this.phase !== 'fight' || e.dead) { if (e.dead) { e.deadT = (e.deadT || 0) + dt; this.g.anim(e.c, { dead: e.deadT }); } else this.g.anim(e.c, { move: 0, look: this.g.eyePos() }); return; }
    const g = this.g, R = e.c.root, P = g.p.pos;
    tmp.set(P.x - R.position.x, 0, P.z - R.position.z); const dist = Math.max(0.001, tmp.length()); tmp.multiplyScalar(1 / dist);
    e.flash -= dt; e.hitT -= dt; e.cd -= dt; e.skillCd -= dt;
    e.invT = (e.invT || 0) - dt; e.blockT = (e.blockT || 0) - dt; e.dodgeCd = (e.dodgeCd || 0) - dt;
    // reads your attacks: side-dash with i-frames, or guard, then punish
    const swing = g.t - (g.p._atkT || -9) < 0.12 || (g._lastCastT && g.t - g._lastCastT < 0.12); const read = Math.min(0.35, (e._rep || 0) * 0.08);
    if (swing && dist < 6 && e.state !== 'skill' && e.dodgeCd <= 0 && e.invT <= 0 && e.blockT <= 0) { e.dodgeCd = 0.5; const r = Math.random();
      if (r < 0.3 + read) { const s = Math.random() < 0.5 ? 1 : -1; R.position.x += -tmp.z * 3.4 * s - tmp.x * 0.8; R.position.z += tmp.x * 3.4 * s - tmp.z * 0.8; e.invT = 0.4; e.dodgeCd = 1.6; e.hitT = 0; g.fx.burst(R.position.clone().setY(R.position.y + 1), 10, 0xffffff, { speed: 5, life: 0.3 }); e._punish = 0.35; }
      else if (r < 0.55 + read * 1.5) { e.blockT = 0.65; e.dodgeCd = 1.2; e._punish = 0.5; } }
    if (e._punish > 0) { e._punish -= dt; if (e._punish <= 0 && e.state === 'chase' && dist < 3.2) { e.state = 'windup'; e.atk = 0.16; e.cd = 0; } }
    e.anim.block = e.blockT > 0;
    if (e.state === 'skill') { e.atk -= dt; if (e.skillUpd) e.skillUpd(dt); if (e.atk <= 0) { e.state = 'chase'; e.skillUpd = null; } }
    else if (e.state === 'windup') {
      e.atk -= dt; if (e.atk <= 0) { e.state = 'chase'; e.cd = e.def.cd * (0.7 + Math.random() * 0.45); e.anim.attack = 1;
        if (dist <= e.def.reach + 0.55) { let dmg = e.def.dmg * (1 + (e.lvl - 1) * 0.08); if (IN.held && IN.held.block) dmg *= 0.22; g.hurtPlayer(Math.round(dmg), R.position, { kb: 4 }); } }
    } else {
      e.yaw = Math.atan2(tmp.x, tmp.z); let moving = 0;
      if (e.skillCd <= 0 && dist < 20) { e.skillCd = 2.3 + Math.random() * 1.4; if (this.load && FRUITS[this.load.fruit] && Math.random() < 0.75) HD.bossMove(g, e, this.load.fruit); else g.bossSkill(e, dist); this._usedMove = true; }
      else if (dist > 2.05) moving = dist > 9 ? 1.4 : 1;
      else if (e.cd <= 0) { e.state = 'windup'; e.atk = 0.4; }
      if (moving) { R.position.addScaledVector(new B.Vector3(Math.sin(e.yaw), 0, Math.cos(e.yaw)), e.def.spd * moving * dt); e.anim.phase += dt * 8; e.anim.move = 1; } else e.anim.move = 0;
    }
    const dx = R.position.x - this.arena.cx, dz = R.position.z - this.arena.cz; const d = Math.hypot(dx, dz);
    if (d > this.arena.R - 1.1) { R.position.x = this.arena.cx + dx / d * (this.arena.R - 1.1); R.position.z = this.arena.cz + dz / d * (this.arena.R - 1.1); }
    R.position.addScaledVector(e.vel, dt); e.vel.multiplyScalar(Math.exp(-dt * 6));
    R.position.y = this.arena.floorY; R.rotation.y = damp(R.rotation.y, e.yaw, 10, dt);
    e.anim.windup = e.state === 'windup'; e.anim.attack = Math.max(0, (e.anim.attack || 0) - dt * 3); e.anim.angry = true; e.anim.look = g.eyePos();
    g.anim(e.c, e.anim); g.flashMat(e); this.clampPlayer();
  }
  clampPlayer() {
    const p = this.g.p; const dx = p.pos.x - this.arena.cx, dz = p.pos.z - this.arena.cz; const d = Math.hypot(dx, dz);
    if (d > this.arena.R - 0.7) { p.pos.x = this.arena.cx + dx / d * (this.arena.R - 0.7); p.pos.z = this.arena.cz + dz / d * (this.arena.R - 0.7); }
  }
  update(dt) {
    const g = this.g;
    if (!this.on && !this.offer && g.fakes && g.fakes.length && g.ui && !g.ui.modal && !g.cut && !g.dead) {
      this._chalT -= dt;
      if (this._chalT <= 0) {
        this._chalT = 55 + Math.random() * 80;
        const near = g.fakes.filter(o => o.c.root.visible && o.c.root.position.distanceTo(g.p.pos) < 16);
        if (near.length && Math.random() < 0.65) { const o = near[Math.floor(Math.random() * near.length)]; g.ui.chat(o.f.name, 'duel me!'); this.challengeFake(o.f); }
      }
    }
    if (!this.on) return;
    this.t += dt;
    if (this.phase === 'intro') {
      this._introT -= dt;
      if (this._introT <= 0) { this.phase = 'count'; this.count = 3; this._cd = 1; g.ui.letterbox(false); document.body.classList.remove('cine'); this.showCount('3'); }
      return;
    }
    if (this.phase === 'count') {
      this._cd -= dt;
      if (this._cd <= 0) {
        this.count--; this._cd = 0.85;
        if (this.count >= 1) this.showCount(String(this.count));
        else if (this.count === 0) this.showCount('FIGHT!');
        else { this.hideCount(); this.phase = 'fight'; this.showHud(true); }
      }
      return;
    }
    if (this.phase === 'fight') {
      this.refreshHud();
      if (this.arena && (this.t | 0) % 2 === 0) this.crowdCheer();
      if (this.foe && this.foe.dead && this.foe.deadT > 0.85) this.finish('win');
    }
  }
  showCount(txt) {
    let el = document.getElementById('duelcd'); if (!el) { el = document.createElement('div'); el.id = 'duelcd'; document.getElementById('hud').appendChild(el); }
    el.textContent = txt; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); el.style.display = 'block';
  }
  hideCount() { const el = document.getElementById('duelcd'); if (el) el.style.display = 'none'; }
  ensureHud() {
    if (document.getElementById('duelhud')) return;
    const el = document.createElement('div'); el.id = 'duelhud';
    el.innerHTML = `<div class="dhme"><b id="duelMeN">YOU</b><div class="dhp"><i id="duelMeH"></i></div></div><div class="dhvs">VS</div><div class="dhfoe"><b id="duelFoeN">FOE</b><div class="dhp"><i id="duelFoeH"></i></div></div><button id="duelForfeit" type="button">Forfeit</button>`;
    document.getElementById('hud').appendChild(el);
    el.querySelector('#duelForfeit').onclick = (ev) => { ev.stopPropagation(); this.forfeit(); };
  }
  showHud(on) {
    const el = document.getElementById('duelhud'); if (!el) return;
    el.style.display = on ? 'flex' : 'none';
    if (on) { document.getElementById('duelMeN').textContent = this.g.save.name; document.getElementById('duelFoeN').textContent = this.vs.name; this.refreshHud(); }
  }
  refreshHud() {
    const me = document.getElementById('duelMeH'), fo = document.getElementById('duelFoeH');
    if (me) me.style.width = Math.max(0, this.g.save.hp / this.g.st.maxHp * 100) + '%';
    if (fo && this.foe) fo.style.width = Math.max(0, this.foe.hp / this.foe.max * 100) + '%';
  }
  forfeit() { if (this.on && this.phase !== 'end') this.finish('lose', 'forfeit'); }
  playerDown() { if (!this.on) return false; this.g.dead = false; this.g.save.hp = Math.max(1, Math.round(this.g.st.maxHp * 0.2)); this.finish('lose', 'ko'); return true; }
  foeDown() { if (!this.on || !this.foe) return; this.foe.dead = true; this.foe.deadT = 0.01; this.foe.aggro = false; this.g.ui.bossBar(null); }
  finish(result, why) {
    if (!this.on || this.phase === 'end') return; this.phase = 'end'; const g = this.g, S = g.save; const win = result === 'win';
    if (this.peer != null) try { g.net.send({ t: 'duel', k: 'end', to: this.peer, win }); } catch (_) {}
    if (win) {
      const rw = this.rw; g.addBerries(rw.ber); g.addXp(rw.xp); S.stats.duels = (S.stats.duels || 0) + 1; S.stats.duelBounty = (S.stats.duelBounty || 0) + rw.bounty;
      g.ui.banner('DUEL WIN!', `+฿${rw.ber.toLocaleString()} · +${rw.xp} XP · bounty +฿${rw.bounty.toLocaleString()}`);
    } else g.ui.banner(why === 'forfeit' ? 'FORFEIT' : 'DUEL LOST', 'No death penalty — returning…');
    ST.save(S); setTimeout(() => this.restore(), 1500);
  }
  restore() {
    const g = this.g, S = g.save; if (!this.saved) { this.on = false; return; }
    if (this.foe) { g.scene.remove(this.foe.c.root); g.enemies = g.enemies.filter(e => e !== this.foe); this.foe = null; }
    if (this.arena) { g.scene.remove(this.arena.root); this.arena.root.traverse(o => { if (o.geometry) o.geometry.dispose(); const m = o.material; if (m) { if (Array.isArray(m)) m.forEach(x => x.dispose && x.dispose()); else m.dispose && m.dispose(); } }); this.arena = null; }
    g.island.group.visible = true;
    for (const e of g.enemies) e.c.root.visible = e._duelHide !== false;
    for (const o of g.fakes || []) o.c.root.visible = o._duelHide !== false;
    for (const n of g.npcs || []) n.c.root.visible = n._duelHide !== false;
    if (g.table && g.table.grp) g.table.grp.visible = true;
    g.p.pos.set(this.saved.x, this.saved.y, this.saved.z); g.p.yaw = this.saved.yaw; g.p.pitch = this.saved.pitch; g.p.vy = 0; g.p.kb = null;
    S.hp = Math.max(1, Math.min(g.st.maxHp, this.saved.hp > 0 ? this.saved.hp : g.st.maxHp)); g.dead = false; g.p.iframe = 1.2;
    this.showHud(false); this.hideCount(); g.ui.bossBar(null); g.ui.letterbox(false); document.body.classList.remove('cine'); g.ui.updateHud();
    this.on = false; this.phase = null; this.saved = null; this.vs = null; this.peer = null;
  }
  buildArena() {
    const g = this.g; const cx = 0, cz = 0, floorY = 240, R = 22; const root = new B.Group();
    const b = new Builder();
    b.add(new B.CylinderGeometry(R, R, 0.55, 48), 0xc9a87a, mat(0, floorY - 0.28, 0), { ot: 0.02 });
    for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; b.add(new B.BoxGeometry(1.45, 1.15, 0.7), 0x8a8070, mat(Math.cos(a) * (R - 0.35), floorY + 0.55, Math.sin(a) * (R - 0.35), 0, -a, 0), { ot: 0.02 }); }
    for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; b.add(new B.BoxGeometry(2.3, 4.6, 1.2), 0x6a6358, mat(Math.cos(a) * (R + 4), floorY + 2.2, Math.sin(a) * (R + 4), 0, -a, 0), { ot: 0.02 }); }
    for (let tier = 0; tier < 3; tier++) for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2 + tier * 0.03; const rr = R + 6 + tier * 2.2;
      b.add(new B.BoxGeometry(2.4, 0.42, 1.55), 0x7a6a55, mat(Math.cos(a) * rr, floorY + 3.15 + tier * 1.25, Math.sin(a) * rr, 0, -a, 0), { outline: false }); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const x = Math.cos(a) * (R + 1.1), z = Math.sin(a) * (R + 1.1); const col = i % 2 ? 0xc0283a : 0x2a5bb8;
      b.add(new B.BoxGeometry(0.12, 3.1, 0.12), 0x4a3020, mat(x, floorY + 2.7, z), { outline: false });
      b.add(new B.PlaneGeometry(1.35, 1.7), col, mat(x + Math.cos(a) * 0.08, floorY + 3.5, z + Math.sin(a) * 0.08, 0, -a + Math.PI / 2, 0), { outline: false }); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const x = Math.cos(a) * (R - 1.6), z = Math.sin(a) * (R - 1.6);
      b.add(new B.CylinderGeometry(0.12, 0.16, 1.55, 6), 0x4a3020, mat(x, floorY + 0.75, z), { outline: false });
      b.add(new B.SphereGeometry(0.2, 8, 6), 0xff8a2a, mat(x, floorY + 1.65, z), { outline: false }); }
    b.add(new B.TorusGeometry(3.1, 0.14, 6, 32), 0xd4af37, mat(0, floorY + 0.04, 0, Math.PI / 2, 0, 0), { outline: false });
    root.add(b.build(WORLD_MAT));
    const crowd = new B.Group(); const geo = new B.SphereGeometry(0.26, 6, 5);
    const mats = [0xffe0c0, 0xc8a070, 0x8a5a3a, 0xf0d0b0].map(c => new B.MeshToonMaterial({ color: c }));
    for (let i = 0; i < 110; i++) { const a = Math.random() * Math.PI * 2, tier = i % 3, rr = R + 6.1 + tier * 2.2 + Math.random() * 0.5;
      const m = new B.Mesh(geo, mats[i % 4]); m.position.set(Math.cos(a) * rr, floorY + 3.55 + tier * 1.25, Math.sin(a) * rr); crowd.add(m); }
    root.add(crowd);
    const dome = new B.Mesh(new B.SphereGeometry(90, 16, 12), new B.MeshBasicMaterial({ color: 0x4a90d0, side: B.BackSide, fog: false })); dome.position.y = floorY; root.add(dome);
    g.scene.add(root); setOutlinesVisible(root);
    this.arena = { root, cx, cz, R: R - 1.6, floorY, crowd };
  }
  crowdCheer() { if (!this.arena) return; const c = this.arena.crowd.children; for (let i = 0; i < c.length; i += 9) c[i].position.y += (Math.random() - 0.45) * 0.12; }
}
