// Crew recruitment: hire up to 2 NPC crewmates who follow you and fight; each role has a perk.
import { THREE as B, setOutlinesVisible } from './engine.js';
import { makeAvatar } from './models.js';
import { randomLook } from './style.js';
import * as ST from './state.js';
export const ROLES = {
  swordsman: { icon: '🗡', name: 'Swordsman', perk: 'Strong sword slashes', dmg: 0.5, rate: 1.0, range: 2.8 },
  shooter: { icon: '🎯', name: 'Sharpshooter', perk: 'Shoots enemies from range', dmg: 0.32, rate: 1.4, range: 16, ranged: true },
  cook: { icon: '🍳', name: 'Cook', perk: 'Kicks hard · cooked fish heal +50%', dmg: 0.42, rate: 1.1, range: 2.8 },
  doctor: { icon: '🩺', name: 'Doctor', perk: 'Heals you when below 70% HP', dmg: 0.18, rate: 1.4, range: 2.6 },
  navigator: { icon: '🧭', name: 'Navigator', perk: 'Voyages 25% shorter', dmg: 0.22, rate: 1.2, range: 2.8 },
  musician: { icon: '🎻', name: 'Musician', perk: '+8% damage for you', dmg: 0.2, rate: 1.3, range: 2.6 },
};
const FIRST = ['Kaze', 'Mira', 'Tobi', 'Rook', 'Sora', 'Bram', 'Nell', 'Juno', 'Pico', 'Rin', 'Gus', 'Lia', 'Taro', 'Vex', 'Ona', 'Hector'];
const LAST = ['the Swift', 'Ironjaw', 'of the Tides', 'Redcoat', 'Saltbeard', 'Quickdraw', 'the Calm', 'Stormeye', 'Brightsail', 'Longshot'];
export const hirePrice = (S) => Math.round(2000 + S.lvl * 450);
export const hasRole = (S, r) => (S.crew || []).some(c => c.role === r);
export function hire(g, role) { const S = g.save; S.crew = S.crew || []; if (S.crew.length >= 2) return 'Your crew is full (2 max) — dismiss someone first';
  if (hasRole(S, role)) return 'You already have a ' + ROLES[role].name; const p = hirePrice(S); if (S.ber < p) return 'Not enough Berries';
  S.ber -= p; let sd = Date.now() % 100000; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647; const race = ['Human', 'Fish-Man', 'Mink', 'Skypiean', 'Human', 'Human'][Math.floor(r() * 6)];
  S.crew.push({ role, name: FIRST[Math.floor(r() * FIRST.length)] + ' ' + LAST[Math.floor(r() * LAST.length)], race, ...(() => { const rl = randomLook(r, S.faction); return { look: rl.look, cos: rl.cos }; })(), faction: S.faction }); ST.save(S); g.crew.spawn(); return null; }
export function dismiss(g, i) { const S = g.save; (S.crew || []).splice(i, 1); ST.save(S); g.crew.spawn(); }
export class CrewMates {
  constructor(g) { this.g = g; this.list = []; }
  clear() { for (const m of this.list) { m.c.root.removeFromParent(); m.c.root.traverse(o => { if (o.geometry && !o.userData.shared) o.geometry.dispose(); }); } this.list = []; }
  spawn() { this.clear(); const g = this.g, S = g.save; if (!S || !g.island) return; (S.crew || []).forEach((cm, i) => { let c; try { c = makeAvatar(cm.faction || S.faction, cm.race || 'Human', cm.look && cm.look.look ? cm.look.look : cm.look, cm.cos || (cm.look && cm.look.cos) || {}); } catch (err) { console.warn('crew spawn', err); return; } const p = g.p.pos; c.root.position.set(p.x + (i ? 2 : -2), g.groundAt(p.x, p.z + 2), p.z + 2); g.scene.add(c.root); setOutlinesVisible(c.root); this.list.push({ cm, c, role: ROLES[cm.role], cd: 1, atk: 0, ph: 0, side: i ? 1 : -1 }); }); }
  update(dt) { const g = this.g, S = g.save, p = g.p; if (!this.list.length || g.cut) return;
    for (const m of this.list) { const R = m.c.root.position; m.cd -= dt; m.atk = Math.max(0, m.atk - dt * 3);
      // target: nearest aggro enemy close to the player
      let tgt = null, best = 1e9; for (const e of g.enemies) { if (e.dead || (!e.aggro && !e.temp)) continue; const d = e.c.root.position.distanceTo(p.pos); if (d < 14) { const d2 = e.c.root.position.distanceTo(R); if (d2 < best) { best = d2; tgt = e; } } }
      const yaw = p.yaw; const home = new B.Vector3(p.pos.x + Math.cos(yaw) * 1.8 * m.side + Math.sin(yaw) * 2.2, 0, p.pos.z - Math.sin(yaw) * 1.8 * m.side + Math.cos(yaw) * 2.2);
      let goal = home, stop = 0.6; if (tgt) { goal = tgt.c.root.position; stop = m.role.ranged ? 9 : m.role.range * 0.8; }
      const to = new B.Vector3(goal.x - R.x, 0, goal.z - R.z); const d = to.length(); let mv = 0;
      if (R.distanceTo(p.pos) > 28) { R.copy(home); }
      else if (d > stop) { to.normalize(); const sp = Math.min(d - stop, (tgt ? 6.2 : 5.6) * dt * (d > 6 ? 1.3 : 1)); R.x += to.x * sp; R.z += to.z * sp; const v = R.clone(); g.collide(v, 0.4); R.x = v.x; R.z = v.z; mv = 1; m.c.root.rotation.y = Math.atan2(to.x, to.z); }
      else if (tgt) m.c.root.rotation.y = Math.atan2(goal.x - R.x, goal.z - R.z); else m.c.root.rotation.y = yaw + Math.PI;
      R.y = g.groundAt(R.x, R.z);
      if (tgt && m.cd <= 0 && R.distanceTo(tgt.c.root.position) < m.role.range + (tgt.boss ? 1.5 : 0.6)) { m.cd = m.role.rate; m.atk = 1; const dmg = g.baseDmg() * m.role.dmg * (1 + (S.lvl || 1) * 0.004);
        if (m.role.ranged) { const from = R.clone().setY(R.y + 1.3); g.fx.beam(from, g.chest(tgt, new B.Vector3()), 0xffd08a, 0.06, 0.12); g.fx.burst(from, 4, 0xffb04a, { speed: 2, size: 0.2, life: 0.2 }); }
        else g.fx.burst(g.chest(tgt, new B.Vector3()), 6, m.cm.role === 'cook' ? 0xff8a3a : 0xdff0ff, { speed: 3, size: 0.25, life: 0.25 });
        g.damageEnemy(tgt, dmg, { kb: 1.5, from: R, col: 0xffe6a0, crew: true }); }
      if (m.cm.role === 'doctor') { m.heal = (m.heal || 0) - dt; if (m.heal <= 0 && S.hp < g.st.maxHp * 0.7 && !g.dead) { m.heal = 2; const h = Math.round(g.st.maxHp * 0.03); S.hp = Math.min(g.st.maxHp, S.hp + h); g.fx.burst(p.pos.clone().setY(p.pos.y + 1), 6, 0x7dffb0, { speed: 1.5, up: 2, size: 0.25, life: 0.6 }); g.ui.updateHud(); } }
      m.ph += dt * 9 * mv; g.anim(m.c, { move: mv, phase: m.ph, attack: m.atk, aim: m.role.ranged && !!tgt }); } }
}
export function crewTabHtml(S, fmt, esc) { const crew = S.crew || []; const price = hirePrice(S);
  return `<p class="dim">Recruit up to <b>2 crewmates</b>. They follow you, fight beside you, and each role has a perk.</p><h3>Your crew (${crew.length}/2)</h3><div class="list">${crew.length ? crew.map((c, i) => `<div class="item"><div class="ic" style="display:flex;align-items:center;justify-content:center;font-size:26px">${ROLES[c.role].icon}</div><div class="nm"><b>${esc(c.name)}</b><small>${ROLES[c.role].name} · ${c.race}</small><small>${ROLES[c.role].perk}</small></div><button data-do="crewdis:${i}">Dismiss</button></div>`).join('') : '<p class="dim">No crewmates yet.</p>'}</div>
    <h3>Recruit · ฿${fmt(price)} each</h3><div class="list">${Object.entries(ROLES).map(([k, r]) => `<div class="item"><div class="ic" style="display:flex;align-items:center;justify-content:center;font-size:26px">${r.icon}</div><div class="nm"><b>${r.name}</b><small>${r.perk}</small></div><button data-do="crewhire:${k}" class="${S.ber < price || crew.length >= 2 || hasRole(S, k) ? 'poor' : ''}">${hasRole(S, k) ? 'Hired' : 'Hire'}</button></div>`).join('')}</div>`; }
