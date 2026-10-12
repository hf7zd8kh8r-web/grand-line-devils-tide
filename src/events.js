// Random island events: Sea King ambush, treasure dig, Buster Call, escort, stealth, Davy Back Fight, storms.
import { THREE as B, setOutlinesVisible } from './engine.js';
import { makeChar } from './models.js';
import { islandById } from './data.js';
import * as ST from './state.js';
const V = () => new B.Vector3();
const NAMES = { seaking: '🐉 Sea King Ambush', dig: '🗺 Treasure Dig', buster: '💥 Buster Call', escort: '🧳 Escort Mission', stealth: '🥷 Stealth Mission', davy: '🏴‍☠️ Davy Back Fight', storm: '⛈ Sudden Storm' };
export const EVENT_KINDS = Object.keys(NAMES);
export class Events {
  constructor(g) { this.g = g; this.cur = null; this.timer = 90; this.objs = []; }
  // ---- helpers ----
  get S() { return this.g.save; }
  bar(title, text, left) { let el = document.getElementById('evt'); if (!el) { el = document.createElement('div'); el.id = 'evt'; document.getElementById('hud').appendChild(el); el.addEventListener('pointerup', e => { if (e.target.closest('[data-x]')) { e.stopPropagation(); this.stop(false, true); } }); el.addEventListener('click', e => { if (e.target.closest('[data-x]')) { e.stopPropagation(); this.stop(false, true); } }); }
    if (!title) { el.style.display = 'none'; document.body.classList.remove('evton'); return; } el.style.display = ''; document.body.classList.add('evton');
    el.innerHTML = `<b>${title}</b><span>${text}</span>${left != null ? `<em>${Math.ceil(left)}s</em>` : ''}<i data-x>✕</i>`; }
  land(minD, maxD, from) { const g = this.g, I = g.island, P = from || g.p.pos; for (let k = 0; k < 60; k++) { const a = Math.random() * 6.283, d = minD + Math.random() * (maxD - minD); const x = P.x + Math.cos(a) * d, z = P.z + Math.sin(a) * d; if (Math.hypot(x, z) > I.R * 0.85) continue; if (g.groundAt(x, z) < 0.7) continue; const v = new B.Vector3(x, 0, z); g.collide(v, 1.2); v.y = g.groundAt(v.x, v.z); if (v.y > 0.6) return v; } const v = new B.Vector3(0, 0, I.R * 0.3); v.y = g.groundAt(v.x, v.z); return v; }
  add(o) { this.g.scene.add(o); this.objs.push(o); return o; }
  marker(pos, col, h = 30) { const m = new B.Mesh(new B.CylinderGeometry(0.5, 0.5, h, 8, 1, true), new B.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35, depthWrite: false, side: B.DoubleSide, blending: B.AdditiveBlending })); m.position.set(pos.x, pos.y + h / 2, pos.z); return this.add(m); }
  temp(type, pos, lvl, aggro = true) { const g = this.g; const e = g.spawnEnemy({ type, x: pos.x, z: pos.z, lvl: lvl ?? Math.max(1, this.S.lvl - 1) }); e.temp = true; e.aggro = aggro; e.state = aggro ? 'chase' : 'idle'; return e; }
  gruntType(k = 0) { const sp = this.g.island.spawns.filter(s => !s.boss); return (sp.find(s => k ? /e2|thug|rifle/.test(s.type) : true) || sp[0]).type; }
  reward(ber, xp, txt) { const g = this.g, S = this.S; const L = S.lvl; ber = Math.round(ber * (1 + L * 0.12)); xp = Math.round(xp * (1 + L * 0.1)); g.addBerries(ber, g.p.pos.clone().setY(g.p.pos.y + 1)); g.addXp(xp); S.stats.events = (S.stats.events || 0) + 1; S.evDone = S.evDone || {}; S.evDone[this.cur.kind] = (S.evDone[this.cur.kind] || 0) + 1; g.ui.banner('EVENT CLEAR!', `${txt} · +฿${ber.toLocaleString()} · +${xp} XP`); ST.save(S); }
  telegraph(pos, r, col, delay, fn) { const g = this.g; const ring = new B.Mesh(new B.RingGeometry(r * 0.92, r, 28), new B.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8, side: B.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(pos.x, g.groundAt(pos.x, pos.z) + 0.12, pos.z);
    const fill = new B.Mesh(new B.CircleGeometry(r, 28), new B.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.25, depthWrite: false })); fill.rotation.x = -Math.PI / 2; fill.position.copy(ring.position); fill.scale.setScalar(0.01); this.add(ring); this.add(fill);
    const t0 = g.t; const tick = () => { if (!this.cur) return; const k = (g.t - t0) / delay; fill.scale.setScalar(Math.min(1, k)); if (k >= 1) { ring.removeFromParent(); fill.removeFromParent(); fn(ring.position.clone()); } else requestAnimationFrame(tick); }; tick(); }
  blast(c, r, dmgFrac, col) { const g = this.g, p = g.p; g.fx.orb(c.clone().setY(c.y + 1), col, r * 1.2, 0.4); g.fx.burst(c.clone().setY(c.y + 0.5), 20, col, { speed: 6, up: 6, size: 0.5, life: 0.7 }); g.fx.ring(c.clone().setY(c.y + 0.2), 0xffffff, r * 1.5, 0.4);
    if (p.pos.distanceTo(c) < r + 0.4) g.hurtPlayer(Math.round(g.st.maxHp * dmgFrac), c, { kb: 4 }); for (const e of g.enemiesInRadius(c, r)) if (!e.ext) g.damageEnemy(e, e.max * 0.25, { kb: 4, from: c }); g.fx.shake = Math.max(g.fx.shake, p.pos.distanceTo(c) < 12 ? 0.35 : 0.1); }
  // ---- lifecycle ----
  eligible() { const I = islandById(this.g.island.id) || {}; const L = this.S.lvl; const k = ['dig', 'storm', 'escort', 'stealth', 'seaking'];
    if (L >= 8) k.push('davy'); if ((I.lvl || 0) >= 25 || L >= 40) k.push('buster'); return k.filter(x => x !== this.last); }
  update(dt) { const g = this.g; if (!g.island || g.dead) return;
    if (!this.cur) { if (g.cut || g.seat || g.ui.modal) return; if (g.enemies.some(e => e.boss && !e.ext && e.aggro && !e.dead)) return; this.timer -= dt; if (this.timer <= 0) { const k = this.eligible(); this.start(k[Math.floor(Math.random() * k.length)]); } return; }
    const c = this.cur; c.t += dt; const left = c.dur ? c.dur - c.t : null; if (left != null && left <= 0) { if (c.onTimeout) c.onTimeout(); else this.stop(false); return; }
    if (c.tick) c.tick(dt); if (this.cur === c) this.bar(NAMES[c.kind], c.text || '', left); }
  start(kind) { if (this.cur) this.stop(false, true); this.last = kind; const fn = this['ev_' + kind]; if (!fn) return; this.cur = { kind, t: 0 }; this.g.ui.banner('RANDOM EVENT', NAMES[kind]); this.g.ui.toast(`${NAMES[kind]}!`, 'quest'); fn.call(this, this.cur); }
  stop(win, quiet) { const c = this.cur; if (!c) return; if (c.cleanup) c.cleanup(); for (const o of this.objs) { o.removeFromParent(); o.traverse && o.traverse(m => { if (m.geometry) m.geometry.dispose(); }); } this.objs = []; this.cur = null; this.bar(null); this.timer = 150 + Math.random() * 90;
    if (!win && !quiet) this.g.ui.toast(`${NAMES[c.kind]} failed`, 'blk'); }
  reset() { if (this.cur) this.stop(false, true); this.timer = 90; }
  // ---- events ----
  ev_dig(c) { const g = this.g; const pos = this.land(22, 45); c.dur = 150; c.text = 'Follow the beam to the X and dig up the treasure!'; const X = new B.Group();
    for (const r of [0.785, -0.785]) { const m = new B.Mesh(new B.BoxGeometry(2.4, 0.08, 0.35), new B.MeshBasicMaterial({ color: 0xc8202a })); m.rotation.y = r; X.add(m); } X.position.set(pos.x, pos.y + 0.06, pos.z); this.add(X); this.marker(pos, 0xffd04a); let dig = 0;
    c.tick = (dt) => { const d = Math.hypot(g.p.pos.x - pos.x, g.p.pos.z - pos.z); if (d < 2.2) { dig += dt; c.text = `Digging… ${Math.min(100, Math.round(dig / 2.5 * 100))}%`; if (Math.random() < dt * 5) { g.vm.doPunch(); g.fx.burst(pos.clone().setY(pos.y + 0.3), 6, 0x8a6a3a, { speed: 3, up: 4, size: 0.3, life: 0.5 }); } if (dig >= 2.5) { g.fishing.chest(); this.reward(300, 120, 'Treasure dug up'); this.stop(true); } } else { dig = Math.max(0, dig - dt); c.text = `Follow the gold beam to the X (${Math.round(d)}m)`; } }; }
  ev_storm(c) { const g = this.g; g.amb.startStorm(75); c.dur = 75; c.text = 'Lightning strikes! Dodge the glowing circles — rare fish bite more in storms'; let nx = 3; g.stormLuck = 0.04;
    c.tick = (dt) => { nx -= dt; if (nx <= 0) { nx = 2.2 + Math.random() * 2.5; const p = g.p.pos; const t = new B.Vector3(p.x + (Math.random() - 0.5) * 12, 0, p.z + (Math.random() - 0.5) * 12); this.telegraph(t, 2.6, 0xbfd8ff, 1.3, (at) => { g.fx.beam(at.clone().setY(at.y + 60), at, 0xeaf4ff, 0.5, 0.25); g.amb.flash = 1; this.blast(at, 2.6, 0.12, 0xbfe0ff); }); } };
    c.onTimeout = () => { this.reward(150, 80, 'Weathered the storm'); this.stop(true); }; c.cleanup = () => { g.stormLuck = 0; }; }
  ev_buster(c) { const g = this.g; c.dur = 40; c.text = 'The Marines ordered a BUSTER CALL! Survive the bombardment!'; let nx = 1.5, big = 4; g.amb.startStorm(44);
    c.tick = (dt) => { nx -= dt; big -= dt; const p = g.p.pos; if (nx <= 0) { nx = 0.45 + Math.random() * 0.4; const a = Math.random() * 6.283, r = 3 + Math.random() * 14; const t = new B.Vector3(p.x + Math.cos(a) * r, 0, p.z + Math.sin(a) * r); this.fire(t, 2.8); }
      if (big <= 0) { big = 2.2; this.fire(p.clone(), 3.4); } };
    c.onTimeout = () => { if (!g.dead) { this.reward(1200, 500, 'Survived the Buster Call'); this.stop(true); } else this.stop(false); }; }
  fire(t, r) { const g = this.g; const from = new B.Vector3(t.x + 90, 30, t.z - 60); this.telegraph(t, r, 0xff3a2a, 1.25, (at) => { g.fx.beam(from, at.clone().setY(at.y + 0.5), 0x3a3a3a, 0.4, 0.25); this.blast(at, r, 0.14, 0xff8a3a); }); }
  ev_escort(c) { const g = this.g; const start = this.land(5, 10); const I = g.island; const dest = new B.Vector3(I.dock ? I.dock.x : 0, 0, I.dock ? I.dock.z0 - 4 : I.R * 0.5); dest.y = g.groundAt(dest.x, dest.z);
    const npc = makeChar('villager', { shirt: 0x7a9a5a, hair: 0x6a4a2a, hat: 0 }); npc.root.position.copy(start); this.add(npc.root); setOutlinesVisible(npc.root); this.marker(dest, 0x7dffb0, 20);
    let hp = 100, amb = 6; const sp = 2.4; c.dur = 160; c.text = 'Walk the traveler to the dock. Stay close!';
    c.tick = (dt) => { const R = npc.root.position; const toD = V().subVectors(dest, R).setY(0); const dD = toD.length(); const near = R.distanceTo(g.p.pos) < 10; let mv = 0;
      if (near && dD > 3) { toD.normalize(); R.x += toD.x * sp * dt; R.z += toD.z * sp * dt; const v = R.clone(); g.collide(v, 0.4); R.x = v.x; R.z = v.z; R.y = g.groundAt(R.x, R.z); npc.root.rotation.y = Math.atan2(toD.x, toD.z); mv = 1; }
      npc.anim = npc.anim || { phase: 0 }; npc.anim.phase += dt * 6 * mv; g.anim(npc, { move: mv, phase: npc.anim.phase, wave: !near });
      amb -= dt; if (amb <= 0) { amb = 13; for (let i = 0; i < 2; i++) { const a = Math.random() * 6.283; this.temp(this.gruntType(), R.clone().add(new B.Vector3(Math.cos(a) * 9, 0, Math.sin(a) * 9))); } g.ui.toast('Ambush! Protect the traveler!', 'blk'); }
      if (g.enemies.some(e => e.temp && !e.dead && e.c.root.position.distanceTo(R) < 3)) hp -= dt * 7; c.text = `Escort to the dock · ${Math.round(dD)}m · Traveler HP ${Math.max(0, Math.round(hp))}%${near ? '' : ' · ⚠ Come back, they will not move without you!'}`;
      if (hp <= 0) { this.stop(false); return; } if (dD <= 3.5) { this.reward(600, 260, 'Traveler delivered safely'); this.stop(true); } }; }
  ev_stealth(c) { const g = this.g; const crate = this.land(26, 40); const cb = new B.Mesh(new B.BoxGeometry(1.2, 1, 1.2), new B.MeshLambertMaterial({ color: 0x9a7a4a })); cb.position.set(crate.x, crate.y + 0.5, crate.z); this.add(cb); this.marker(crate, 0x5ad0ff, 18);
    const type = this.gruntType(1); const def = g.enemies.find(e => e.s.type === type)?.def; const sentries = [];
    for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283 + Math.random(); const pos = new B.Vector3(crate.x + Math.cos(a) * 7, 0, crate.z + Math.sin(a) * 7); pos.y = g.groundAt(pos.x, pos.z); const ch = makeChar(def ? def.look : 'marine', def ? { ...(def.lookO || {}) } : {}); ch.root.position.copy(pos); this.add(ch.root); setOutlinesVisible(ch.root);
      const cone = new B.Mesh(new B.CircleGeometry(9, 18, -0.5, 1.0), new B.MeshBasicMaterial({ color: 0xffe25a, transparent: true, opacity: 0.22, depthWrite: false, side: B.DoubleSide })); cone.rotation.x = -Math.PI / 2; ch.root.add(cone); cone.position.y = 0.15; cone.rotation.z = Math.PI / 2;
      sentries.push({ ch, pos, cone, yaw: Math.random() * 6.283, spd: (i % 2 ? 1 : -1) * (0.5 + Math.random() * 0.3) }); }
    c.dur = 120; c.text = 'Reach the supply crate without stepping into a guard\'s yellow vision cone'; let caught = false;
    c.tick = (dt) => { const p = g.p.pos; for (const s of sentries) { s.yaw += s.spd * dt; s.ch.root.rotation.y = s.yaw; g.anim(s.ch, { move: 0 }); const to = V().subVectors(p, s.pos).setY(0); const d = to.length(); const fw = new B.Vector3(Math.sin(s.yaw), 0, Math.cos(s.yaw)); if (!caught && d < 9 && to.normalize().dot(fw) > Math.cos(0.5)) caught = s; }
      if (caught) { g.ui.banner('SPOTTED!', 'The guards raise the alarm!'); for (const s of sentries) this.temp(type, s.pos); this.stop(false, true); g.ui.toast('🥷 Stealth failed — fight your way out!', 'blk'); return; }
      const d = Math.hypot(p.x - crate.x, p.z - crate.z); c.text = `Sneak to the crate (${Math.round(d)}m) — avoid the yellow cones`; if (d < 1.9) { g.fishing.chest(); this.reward(900, 320, 'Supplies stolen unseen'); this.stop(true); } }; }
  ev_davy(c) { const g = this.g; c.text = 'Foxy\'s crew challenges you! Win 2 of 3 rounds.'; c.round = 0; c.wins = 0; this.davyRound(c); }
  davyRound(c) { const g = this.g; c.round++; c.t = 0; if (c.cleanRound) c.cleanRound(); c.cleanRound = null;
    if (c.round > 3 || c.wins >= 2 || (c.round - 1 - c.wins) >= 2) { if (c.wins >= 2) { this.S.inv.mats['Davy Back Trophy'] = (this.S.inv.mats['Davy Back Trophy'] || 0) + 1; this.reward(1500, 600, `Won the Davy Back Fight ${c.wins}-${c.round - 1 - c.wins}`); this.stop(true); } else { g.ui.banner('DAVY BACK LOST', 'Foxy laughs: "Fe fe fe!"'); this.stop(false, true); } return; }
    const done = (win) => { if (win) c.wins++; g.ui.toast(win ? `Round ${c.round} WON!` : `Round ${c.round} lost…`, win ? 'quest' : 'blk'); this.davyRound(c); };
    if (c.round === 1) { // Donut Race: hit 5 buoys
      const pts = []; let from = g.p.pos.clone(); for (let i = 0; i < 5; i++) { const q = this.land(10, 18, from); pts.push(q); from = q; } const rings = pts.map(q => { const m = new B.Mesh(new B.TorusGeometry(1.4, 0.18, 6, 18), new B.MeshBasicMaterial({ color: 0xff8a2a })); m.position.set(q.x, q.y + 1.6, q.z); return this.add(m); });
      let k = 0; c.dur = 55; g.ui.banner('ROUND 1', 'Donut Race — touch all 5 buoys!'); c.onTimeout = () => { rings.forEach(r => r.removeFromParent()); done(false); };
      c.tick = () => { if (k >= 5) return; rings[k].rotation.y += 0.05; rings[k].scale.setScalar(1.3); const q = pts[k]; const d = Math.hypot(g.p.pos.x - q.x, g.p.pos.z - q.z); c.text = `Round 1 · Donut Race · buoy ${k + 1}/5 (${Math.round(d)}m)`; if (d < 2.4) { rings[k].removeFromParent(); g.fx.burst(rings[k].position, 14, 0xff8a2a, { speed: 4, size: 0.3, life: 0.5 }); k++; if (k >= 5) done(true); } }; c.cleanRound = () => rings.forEach(r => r.removeFromParent()); }
    else if (c.round === 2) { // Groggy Ring
      const foes = []; for (let i = 0; i < 4; i++) foes.push(this.temp(this.gruntType(), this.land(5, 9))); c.dur = 60; g.ui.banner('ROUND 2', 'Groggy Ring — defeat 4 Foxy Pirates!'); c.onTimeout = () => done(false);
      c.tick = () => { const left = foes.filter(e => !e.dead).length; c.text = `Round 2 · Groggy Ring · ${4 - left}/4 down`; if (!left) done(true); }; }
    else { // Combat vs Foxy
      const e = this.temp(this.gruntType(1), this.land(5, 8)); e.def = { ...e.def, name: 'Silver Fox Foxy' }; e.max = e.hp = Math.round(e.max * 3.5); c.dur = 75; g.ui.banner('ROUND 3', 'Combat — defeat Silver Fox Foxy!'); c.onTimeout = () => done(false);
      c.tick = () => { c.text = `Round 3 · Combat · Foxy HP ${Math.max(0, Math.round(e.hp / e.max * 100))}%`; if (e.dead) done(true); }; } }
  ev_seaking(c) { const g = this.g, I = g.island, p = g.p.pos; let a = Math.atan2(p.z, p.x); let shore = null;
    for (let r = Math.hypot(p.x, p.z); r < I.R + 30; r += 1) { const x = Math.cos(a) * r, z = Math.sin(a) * r; if (g.groundAt(x, z) < -1.2) { shore = new B.Vector3(Math.cos(a) * (r + 2.5), -1, Math.sin(a) * (r + 2.5)); break; } }
    if (!shore) shore = new B.Vector3(Math.cos(a) * (I.R + 4), -1, Math.sin(a) * (I.R + 4));
    const root = new B.Group(); root.position.copy(shore); const segs = []; const col = [0x3a7a5a, 0x7a3a5a, 0x3a5a9a][Math.floor(Math.random() * 3)]; const mat = new B.MeshLambertMaterial({ color: col }), belly = new B.MeshLambertMaterial({ color: 0xe8d8a0 });
    for (let i = 0; i < 9; i++) { const s = new B.Mesh(new B.SphereGeometry(1.5 - i * 0.05, 10, 8), mat); root.add(s); segs.push(s); }
    const head = new B.Group(); const sk = new B.Mesh(new B.BoxGeometry(2.4, 1.6, 3.2), mat); head.add(sk); const jaw = new B.Mesh(new B.BoxGeometry(2.2, 0.5, 2.8), belly); jaw.position.set(0, -0.9, 0.3); head.add(jaw);
    for (const sx of [-0.7, 0.7]) { const eye = new B.Mesh(new B.SphereGeometry(0.28, 8, 6), new B.MeshBasicMaterial({ color: 0xffe23a })); eye.position.set(sx, 0.45, 1.5); head.add(eye); const fin = new B.Mesh(new B.ConeGeometry(0.4, 1.6, 4), belly); fin.position.set(sx * 1.6, 0.6, -0.6); fin.rotation.z = -sx * 1.2; head.add(fin); }
    root.add(head); this.add(root); setOutlinesVisible(root);
    const L = this.S.lvl; const hp = Math.round((140 + L * 60) * 4);
    const e = { s: { type: 'seaking' }, def: { name: 'Sea King', xp: 60 + L * 25, ber: [400 + L * 60, 600 + L * 90], drop: 'Sea King Fang' }, c: { root, height: 7, bones: null }, hp, max: hp, lvl: L, home: shore.clone(), vel: V(), state: 'idle', t: 0, atk: 0, cd: 3, hitT: 0, flash: 0, dead: false, deadT: 0, anim: {}, boss: true, ext: null, aggro: true, skillCd: 0 };
    g.enemies.push(e); c.e = e; c.dur = 100; c.text = 'A Sea King rose from the deep! Fight it from the shore'; let nx = 3;
    e.ext = (dt) => { const t = g.t; e.flash -= dt; e.hitT -= dt; const rise = Math.min(1, (c.t || 0) / 2);
      if (e.dead) { e.deadT += dt; root.position.y = shore.y - e.deadT * 4; if (e.deadT > 2.5) root.visible = false; return; }
      const toP = V().subVectors(g.p.pos, root.position).setY(0).normalize();
      segs.forEach((s, i) => { const k = i / 8; s.position.set(Math.sin(t * 1.4 + i * 0.6) * 1.2 * (1 - k * 0.3), -4 + rise * (k * 10 + 3), -k * 2.5); });
      const top = segs[8].position; head.position.set(top.x + toP.x * 0.5, top.y + 1.4, top.z + 0.5); root.rotation.y = Math.atan2(toP.x, toP.z); head.rotation.x = -0.25 + Math.sin(t * 2) * 0.08;
      mat.emissive = mat.emissive || new B.Color(); mat.emissive.setHex(e.flash > 0 ? 0x664444 : 0x000000);
      nx -= dt; if (nx <= 0 && rise >= 1) { nx = 3.2 + Math.random(); const hp0 = head.getWorldPosition(V());
        if (Math.random() < 0.5) { const tgt = g.p.pos.clone(); this.telegraph(tgt, 3, 0x3ab0ff, 1.2, (at) => { g.fx.beam(hp0, at, 0x9fe8ff, 0.8, 0.3); this.blast(at, 3, 0.16, 0x9fe8ff); }); }
        else { for (let i = 0; i < 3; i++) { const tgt = g.p.pos.clone().add(new B.Vector3((Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8)); this.telegraph(tgt, 2.2, 0x3ab0ff, 1.0 + i * 0.25, (at) => { g.fx.beam(hp0, at, 0x5ad0ff, 0.4, 0.2); this.blast(at, 2.2, 0.1, 0x5ad0ff); }); } } }
      if (c.kind === 'seaking') c.text = `Defeat the Sea King! HP ${Math.max(0, Math.round(e.hp / e.max * 100))}% — hit it from the beach`; };
    c.tick = () => { if (e.dead && e.deadT > 0.1 && !c.paid) { c.paid = 1; g.fx.burst(root.position.clone().setY(1), 60, 0x9fe8ff, { speed: 8, up: 10, size: 0.6, life: 1.2 }); this.reward(900, 400, 'Sea King defeated'); this.stop(true); } };
    c.cleanup = () => { const i = g.enemies.indexOf(e); if (i >= 0) g.enemies.splice(i, 1); };
    c.onTimeout = () => { g.ui.toast('The Sea King sank back into the deep…', 'blk'); this.stop(false, true); }; }
}
