// First-person deck sailing between islands: steer, full sail, fire cannons at Marine/pirate ships and Sea Kings.
import { THREE, Builder, mat, WORLD_MAT, setOutlinesVisible, isTouch } from './engine.js';
import { makeWater, makeSky } from './world.js';
import { FX } from './fx.js';
import { IN, consume, pollKeys } from './input.js';
import { SHIPS, makeShipModel } from './ships.js';
const B = THREE; const V = () => new B.Vector3();
const ROUTE0 = 260;
import { ISLANDS } from './data.js';
export class Voyage {
  constructor(o) { // o: { to, toName, toLvl, sea, save, shipId, faction, onEnd }
    Object.assign(this, o); this.D = SHIPS[o.shipId] || SHIPS.dinghy; this.t = 0; this.dist = 0; this.done = false; this.kills = 0; this.ber = 0; this.xp = 0;
    { const A = ISLANDS.find(i => i.id === o.from), Bi = ISLANDS.find(i => i.id === o.to); const md = A && Bi ? Math.hypot(A.x - Bi.x, A.y - Bi.y) : 20; this.R = Math.round(Math.min(520, 170 + md * 4 + ((o.sea || 1) - 1) * 70) * (o.save && (o.save.crew || []).some(c => c.role === 'navigator') ? 0.75 : 1)); } const ROUTE = this.R; this.spdNow = 5; this.marks = {};
    this.hullMax = this.D.hull; this.hull = this.hullMax; this.yaw = 0; this.lookYaw = 0; this.lookPitch = -0.05; this.fireCd = 0; this.burstT = 0; this.burstCd = 0; this.view = 'fp';
    const stormy = o.sea >= 3; const s = this.s = new B.Scene(); s.fog = new B.Fog(stormy ? 0x8a9ab0 : 0xcfeeff, 60, 330);
    s.add(new B.HemisphereLight(0xdff2ff, 0x335577, 1.4)); const d = new B.DirectionalLight(0xfff1d6, 2); d.position.set(30, 50, 20); s.add(d);
    this.w = makeWater(stormy); this.w.userData.mat.uniforms.foamOn.value = 0; this.w.position.y = 0; s.add(this.w); this.sk = makeSky(stormy ? 0x4a5a78 : 0x3f9be8, stormy ? 0x9aa6b8 : 0xcfeeff); s.add(this.sk);
    this.cam = new B.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 900); this.fx = new FX(s, this.cam);
    this.ship = makeShipModel(o.shipId, o.faction); s.add(this.ship); setOutlinesVisible(this.ship); this.U = this.ship.userData;
    // destination island on the horizon
    const ib = new Builder(); ib.add(new B.ConeGeometry(38, 26, 9), 0x5a8a3a, mat(0, 6, 0)); ib.add(new B.CylinderGeometry(44, 48, 4, 12), 0xe8d8a0, mat(0, 0, 0)); ib.add(new B.ConeGeometry(14, 18, 7), 0x4a6a3a, mat(18, 14, 8));
    this.isle = ib.build(WORLD_MAT); this.isle.position.set(0, -1, -ROUTE - 60); s.add(this.isle);
    // scenery along the route so the trip reads as travel: rock islets, sandbars, a far island passing by
    { const sb = new Builder(); let sd = (o.to || 'x').length * 977; const rr = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      for (let i = 0; i < 9; i++) { const z = -30 - (i + rr()) * ROUTE / 9, x = (rr() < 0.5 ? -1 : 1) * (45 + rr() * 70); const k = rr(); if (k < 0.5) { sb.add(new B.DodecahedronGeometry(3 + rr() * 5, 0), 0x6a6a72, mat(x, 0.5, z, rr(), rr(), 0, 1, 0.7 + rr(), 1)); sb.add(new B.DodecahedronGeometry(2 + rr() * 2, 0), 0x7a7a80, mat(x + 4, 0, z + 3)); } else if (k < 0.8) { sb.add(new B.CylinderGeometry(7, 9, 1.2, 9), 0xe8d8a0, mat(x, -0.2, z)); sb.add(new B.CylinderGeometry(0.25, 0.35, 5, 5), 0x7a5a3a, mat(x, 2.5, z, 0, 0, 0.15)); sb.add(new B.ConeGeometry(3, 1.2, 6), 0x3a9a4a, mat(x + 0.4, 5.2, z)); } else { sb.add(new B.ConeGeometry(18, 22, 8), 0x4a7a4a, mat(x * 1.8, 8, z)); sb.add(new B.CylinderGeometry(22, 24, 2, 10), 0xd8c890, mat(x * 1.8, 0, z)); } }
      const sm = sb.build(WORLD_MAT); s.add(sm); }
    this.enemies = []; this.balls = []; this.mates = []; this.spawnT = 4;
    // voyage random events: Knock Up Stream to Skypiea, rival ship race
    this.knockUp = o.to === 'skypiea' ? { at: 0.55, t: -1 } : null; this.race = !this.knockUp && !o.noRace && (o.forceRace || Math.random() < 0.35) ? { rd: 0, start: null, done: false, mesh: null } : null;
    this.el = document.getElementById('sail'); this.buildHud();
  }
  buildHud() { const el = this.el; const D = this.D;
    el.innerHTML = `<div class="vtop"><b>⛵ ${this.toName}</b><div class="sbar"><i></i></div><small class="veta"></small><div class="vhull"><span>🛡 Hull</span><div class="hb"><i></i></div></div><div class="vcomp">⬆</div></div>
      <div class="vmsg"></div><div class="vship">${D.name} · ${D.cannons ? D.cannons + ' cannons' : 'slingshot'}${D.tier >= 4 ? ' · Coup de Burst' : ''}</div>
      <div class="vbtns"><button data-v="l">◀</button><button data-v="r">▶</button><button data-v="sail" class="vs">⛵ Full sail</button>${D.tier >= 4 ? '<button data-v="burst">💨 Burst</button>' : ''}<button data-v="fire" class="vf">💥 FIRE</button></div>
      <div class="vtr"><button data-v="view">🎥</button><button data-v="skip">⏩ Skip</button></div>
      <small class="vhint">${isTouch ? 'Drag right side to look · ◀ ▶ steer · FIRE cannons' : 'A/D steer · W full sail · Mouse look · Click / F to fire · Shift Coup de Burst · C camera'}</small>`;
    this.held = {};
    const down = e => { const b = e.target.closest('[data-v]'); if (!b) { if (e.pointerType !== 'mouse' && e.clientX > innerWidth * 0.4) { this.lookId = e.pointerId; this.lx = e.clientX; this.ly = e.clientY; } return; } e.preventDefault(); e.stopPropagation(); const v = b.dataset.v; this.held[v] = true; b._pid = e.pointerId;
      if (v === 'fire') this.fireQ = true; if (v === 'skip') this.skip = true; if (v === 'view') this.view = this.view === 'fp' ? 'tp' : 'fp'; if (v === 'burst') this.burstQ = true; };
    const move = e => { if (e.pointerId === this.lookId) { this.lookYaw -= (e.clientX - this.lx) * 0.006; this.lookPitch -= (e.clientY - this.ly) * 0.006; this.lx = e.clientX; this.ly = e.clientY; } };
    const up = e => { if (e.pointerId === this.lookId) this.lookId = null; for (const b of el.querySelectorAll('[data-v]')) if (b._pid === e.pointerId) { this.held[b.dataset.v] = false; b._pid = null; } };
    this._h = [['pointerdown', down], ['pointermove', move], ['pointerup', up], ['pointercancel', up]]; for (const [k, f] of this._h) el.addEventListener(k, f);
    this._k = e => { if (e.code === 'KeyC') this.view = this.view === 'fp' ? 'tp' : 'fp'; if (e.code === 'KeyF') this.fireQ = true; }; addEventListener('keydown', this._k);
  }
  addMate(name, faction, id) { if (this.mates.some(m => m.id === id)) return; const k = this.mates.length; const sh = makeShipModel(['caravel', 'brig', 'sunny', 'galleon'][k % 4], faction); setOutlinesVisible(sh); this.s.add(sh);
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const c = cv.getContext('2d'); c.fillStyle = '#0008'; c.fillRect(0, 8, 256, 48); c.fillStyle = '#ffd04a'; c.font = 'bold 30px sans-serif'; c.textAlign = 'center'; c.fillText('⛵ ' + name, 128, 43);
    const tag = new B.Sprite(new B.SpriteMaterial({ map: new B.CanvasTexture(cv), depthTest: false })); tag.scale.set(5, 1.25, 1); tag.position.y = 9; sh.add(tag);
    this.mates.push({ id, sh, off: new B.Vector3((k % 2 ? -1 : 1) * (14 + 6 * Math.floor(k / 2)), 0, 6 + 8 * Math.floor(k / 2)) }); this.msg(`${name} is sailing with you!`); }
  msg(t) { const m = this.el.querySelector('.vmsg'); if (!m) return; m.textContent = t; m.classList.remove('on'); void m.offsetWidth; m.classList.add('on'); }
  fwd(out = V()) { return out.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }
  spawn() { const lvl = this.toLvl || 1; const kind = Math.random() < (this.sea >= 2 ? 0.45 : 0.3) ? 'king' : 'ship'; const side = Math.random() < 0.5 ? -1 : 1;
    const f = this.fwd(); const r = V().set(-f.z, 0, f.x); const pos = this.ship.position.clone().addScaledVector(f, 70 + Math.random() * 30).addScaledVector(r, side * (30 + Math.random() * 15));
    const hp = Math.round((kind === 'king' ? 260 : 180) + lvl * (kind === 'king' ? 26 : 18)); let mesh;
    if (kind === 'ship') { mesh = makeShipModel(lvl > 60 ? 'brig' : 'caravel', this.faction === 'Marine' ? 'Pirate' : 'Marine'); }
    else { const b = new Builder(); const col = [0x3a7a4a, 0x7a3a5a, 0x3a5a8a][Math.floor(Math.random() * 3)]; for (let i = 0; i < 7; i++) b.add(new B.SphereGeometry(2.2 - i * 0.15, 12, 9), col, mat(0, 3 + Math.sin(i * 0.8) * 2.5 - i * 1.2, 2 + i * 2.6)); b.add(new B.SphereGeometry(3, 14, 10), col, mat(0, 6.5, -1, 0, 0, 0, 1, 0.8, 1.4)); b.add(new B.BoxGeometry(4, 0.6, 3), 0xffffff, mat(0, 5.4, -3.2), { outline: false });
      for (const x of [-1, 1]) { b.add(new B.SphereGeometry(0.55, 8, 6), 0xffee55, mat(x * 1.6, 7.6, -2.4), { outline: false }); b.add(new B.SphereGeometry(0.25, 6, 4), 0x111111, mat(x * 1.7, 7.7, -2.85), { outline: false }); } mesh = b.build(WORLD_MAT); }
    mesh.position.copy(pos); mesh.position.y = kind === 'king' ? -9 : 0; this.s.add(mesh); setOutlinesVisible(mesh);
    const e = { kind, mesh, hp, max: hp, t: 0, cd: 2.5 + Math.random(), side, lvl }; this.enemies.push(e); this.msg(kind === 'king' ? '⚠ A SEA KING rises from the depths!' : `⚠ ${this.faction === 'Marine' ? 'Pirate' : 'Marine'} warship approaching!`); }
  fire() { const D = this.D; if (this.fireCd > 0) return; this.fireCd = D.cannons ? Math.max(0.35, 1.4 - D.cannons * 0.09) : 0.7;
    const dir = V(); this.cam.getWorldDirection(dir); const cs = this.U.cannons; let from;
    if (cs.length) { const lp = cs.reduce((a, c) => { const w = c.clone().applyMatrix4(this.ship.matrixWorld); const score = w.clone().sub(this.cam.position).normalize().dot(dir) + (Math.sign(c.x) === Math.sign(V().copy(dir).applyAxisAngle(new B.Vector3(0, 1, 0), -this.yaw).x) ? 1 : 0); return score > a.s ? { s: score, w } : a; }, { s: -9, w: null }); from = lp.w; }
    else from = this.cam.position.clone().addScaledVector(dir, 1);
    const v = dir.clone().multiplyScalar(D.cannons ? 70 : 55); v.y += 5; const m = new B.Mesh(new B.SphereGeometry(D.cannons ? 0.35 : 0.15, 8, 6), new B.MeshBasicMaterial({ color: 0x222222 })); m.position.copy(from); this.s.add(m);
    this.balls.push({ m, v, mine: true, life: 3, dmg: (D.dmg || 25) * (1 + (this.save.lvl || 1) * 0.01) }); this.fx.burst(from, 14, 0xffd08a, { speed: 6, size: 0.6, life: 0.4 }); this.fx.burst(from, 10, 0x9a9a9a, { speed: 3, up: 2, size: 1.2, life: 0.9, grav: -0.5 }); this.fx.shake = Math.max(this.fx.shake || 0, 0.15); }
  hurt(d) { this.hull = Math.max(0, this.hull - d); this.fx.shake = 0.5; this.flash = 0.4; if (this.hull <= 0 && !this.done) this.finish(true); }
  update(dt) { const ROUTE = this.R;
    if (this.done) return; this.t += dt; pollKeys(); const D = this.D;
    // look
    if (IN.lookX || IN.lookY) { this.lookYaw -= IN.lookX; this.lookPitch -= IN.lookY; IN.lookX = IN.lookY = 0; } this.lookYaw = Math.max(-2.6, Math.min(2.6, this.lookYaw)); this.lookPitch = Math.max(-0.8, Math.min(0.6, this.lookPitch));
    const steer = (this.held.l ? -1 : 0) + (this.held.r ? 1 : 0) + IN.mx; this.yaw -= Math.max(-1, Math.min(1, steer)) * dt * 0.55;
    const full = this.held.sail || IN.mz > 0.3; if ((consume('dash') || this.burstQ) && D.tier >= 4 && this.burstCd <= 0) { this.burstT = 1.6; this.burstCd = 12; this.msg('💨 COUP DE BURST!'); this.fx.burst(this.ship.position.clone().add(new B.Vector3(0, 1, 4)), 60, 0xbfefff, { speed: 14, size: 1.2, life: 0.8 }); } this.burstQ = false;
    this.burstT -= dt; this.burstCd -= dt;
    const spdT = 10.5 * D.spd * (full ? 1.3 : 1) * (this.burstT > 0 ? 3.2 : 1); this.spdNow += (spdT - this.spdNow) * Math.min(1, dt * (this.burstT > 0 ? 4 : 0.8)); const spd = this.spdNow; const f = this.fwd(); this.ship.position.addScaledVector(f, spd * dt);
    // progress: along route toward the island
    const toI = this.isle.position.clone().sub(this.ship.position).setY(0); const dist = toI.length(); this.dist = Math.max(this.dist, ROUTE - (dist - 60)); const prog = Math.min(1, this.dist / ROUTE);
    for (const [k, t] of [[0.5, '🧭 Halfway there - keep the Log Pose steady!'], [0.85, '🏝 LAND HO! ' + this.toName + ' ahead!']]) if (prog >= k && !this.marks[k]) { this.marks[k] = 1; this.msg(t); }
    { const eta = Math.max(0, Math.ceil((ROUTE - this.dist) / Math.max(4, spd))); const ee = this.el.querySelector('.veta'); if (ee) ee.textContent = Math.round(spd * 1.94) + ' kn · ETA ' + eta + 's'; }
    const bear = Math.atan2(-toI.x, -toI.z) - this.yaw; this.el.querySelector('.vcomp').style.transform = `rotate(${-bear}rad)`;
    this.ship.rotation.set(Math.sin(this.t * 1.1) * 0.025, this.yaw, Math.sin(this.t * 1.3) * 0.04 - steer * 0.04); this.ship.position.y = Math.sin(this.t * 1.7) * 0.15 - 0.1; this.ship.updateMatrixWorld();
    // camera
    const port = innerWidth < innerHeight; const eye = (port || innerHeight < 520) ? new B.Vector3(0, this.U.wheel.y + 1.5, -this.U.len * 0.22) : new B.Vector3(this.U.wid * 0.22, this.U.wheel.y + 0.85, this.U.wheel.z + 0.45); // portrait phones: stand at the bow so the mast never fills the narrow view if (this.view === 'tp') eye.set(0, 9 + this.U.len * 0.4, this.U.len * 1.6 + 6);
    this.cam.position.copy(eye.applyMatrix4(this.ship.matrixWorld)); const sh = this.fx.shake || 0; this.cam.position.x += (Math.random() - 0.5) * sh * 0.3; this.cam.position.y += (Math.random() - 0.5) * sh * 0.3; this.fx.shake = Math.max(0, sh - dt * 2);
    this.cam.rotation.set(0, 0, 0); this.cam.rotation.order = 'YXZ'; this.cam.rotation.y = this.yaw + this.lookYaw; this.cam.rotation.x = this.lookPitch + (this.view === 'tp' ? -0.3 : (innerWidth < innerHeight ? -0.16 : 0));
    if (IN.pressed.has('attack')) { IN.pressed.delete('attack'); this.fireQ = true; } if (this.fireQ || this.held.fire) this.fire(); this.fireQ = false; this.fireCd -= dt;
    // enemies
    this.spawnT -= dt; if (this.spawnT <= 0 && prog < 0.85 && D.cannons > 0 && this.enemies.length < (D.tier >= 3 ? 2 : 1)) { this.spawn(); this.spawnT = 7 + Math.random() * 5; }
    for (const e of this.enemies) { e.t += dt; const M = e.mesh; const to = this.ship.position.clone().sub(M.position).setY(0); const d = to.length(); to.normalize();
      if (e.dead) { M.position.y -= dt * 3; M.rotation.z += dt * 0.4; continue; }
      if (e.kind === 'ship') { const want = to.clone().applyAxisAngle(new B.Vector3(0, 1, 0), d > 40 ? 0 : e.side * 1.2); M.position.addScaledVector(want, spd * 0.95 * dt); M.rotation.y = Math.atan2(-want.x, -want.z); M.position.y = Math.sin(this.t * 1.5 + e.side) * 0.15;
        e.cd -= dt; if (e.cd <= 0 && d < 60) { e.cd = 2.6 + Math.random(); const v = to.clone().multiplyScalar(d / 1.6).add(new B.Vector3((Math.random() - 0.5) * 6, 9, 0)); const m = new B.Mesh(new B.SphereGeometry(0.4, 8, 6), new B.MeshBasicMaterial({ color: 0x1a1a1a })); m.position.copy(M.position).add(new B.Vector3(0, 2, 0)); this.s.add(m); this.balls.push({ m, v, mine: false, life: 2.2, dmg: this.hullMax * (this.sea >= 3 ? 0.08 : this.sea >= 2 ? 0.065 : 0.05) }); this.fx.burst(m.position.clone(), 10, 0xffd08a, { speed: 5, size: 0.6, life: 0.3 }); } }
      else { M.position.y = Math.min(-0.5, M.position.y + dt * 6); M.lookAt(this.ship.position.x, M.position.y, this.ship.position.z); M.rotateY(Math.PI); if (d > 16) M.position.addScaledVector(to, spd * 1.05 * dt); else { e.cd -= dt; if (e.cd <= 0) { e.cd = 2.2; this.hurt(this.hullMax * (this.sea >= 3 ? 0.11 : 0.08)); this.msg('🐉 The Sea King bites your hull!'); this.fx.burst(this.ship.position.clone().add(new B.Vector3(0, 2, 0)), 30, 0xcfefff, { speed: 9, up: 6, size: 1, life: 0.8 }); } M.position.addScaledVector(to, (d - 14) * dt); } }
      if (d > 200) { e.gone = true; } }
    for (const e of this.enemies) if ((e.dead && e.mesh.position.y < -14) || e.gone) { e.mesh.removeFromParent(); e.mesh.traverse(o => o.geometry && o.geometry.dispose()); }
    this.enemies = this.enemies.filter(e => !((e.dead && e.mesh.position.y < -14) || e.gone));
    // cannonballs
    for (const b of this.balls) { b.life -= dt; b.v.y -= 18 * dt; b.m.position.addScaledVector(b.v, dt);
      if (b.m.position.y < 0) { b.life = 0; this.fx.burst(b.m.position.clone().setY(0.3), 18, 0xe0f6ff, { speed: 4, up: 7, size: 0.7, life: 0.7 }); }
      if (b.mine) for (const e of this.enemies) { if (e.dead) continue; const c = e.mesh.position.clone(); c.y = e.kind === 'king' ? e.mesh.position.y + 5 : 1.5; if (b.m.position.distanceTo(c) < (e.kind === 'king' ? 6 : 5.5)) { b.life = 0; e.hp -= b.dmg; this.fx.burst(b.m.position.clone(), 26, 0xff9a3a, { speed: 8, size: 1, life: 0.6 }); this.dmgPop(Math.round(b.dmg));
          if (e.hp <= 0) { e.dead = true; this.kills++; const r = Math.round(60 + e.lvl * 45 * (e.kind === 'king' ? 1.5 : 1)); this.ber += r; this.xp += Math.round(20 + e.lvl * 6); this.msg(`${e.kind === 'king' ? '🐉 Sea King' : '⚓ Warship'} defeated! +฿${r}`); } } }
      if (!b.mine && b.m.position.distanceTo(this.ship.position.clone().setY(1)) < this.U.len * 0.55) { b.life = 0; this.hurt(b.dmg); this.fx.burst(b.m.position.clone(), 24, 0xff7a2a, { speed: 7, size: 0.9, life: 0.5 }); } }
    for (const b of this.balls) if (b.life <= 0) { b.m.removeFromParent(); b.m.geometry.dispose(); } this.balls = this.balls.filter(b => b.life > 0);
    for (const m of this.mates) { m.sh.position.copy(this.ship.position).add(m.off.clone().applyAxisAngle(new B.Vector3(0, 1, 0), this.yaw)); m.sh.rotation.set(0, this.yaw, Math.sin(this.t * 1.2 + m.id) * 0.04); m.sh.position.y = Math.sin(this.t * 1.5 + m.id) * 0.15 - 0.1; }
    this.w.userData.mat.uniforms.t.value = this.t; this.w.position.set(Math.round(this.ship.position.x / 10) * 10, 0, Math.round(this.ship.position.z / 10) * 10); this.sk.position.copy(this.cam.position); this.fx.update(dt);
    this.el.querySelector('.sbar i').style.width = (prog * 100) + '%'; this.el.querySelector('.hb i').style.width = (this.hull / this.hullMax * 100) + '%'; this.flash = Math.max(0, (this.flash || 0) - dt); this.el.classList.toggle('vhit', this.flash > 0);
    if (this.race && !this.race.done) { const R = this.race; if (!R.mesh) { R.start = this.ship.position.clone(); R.mesh = makeShipModel(D.tier >= 3 ? 'brig' : 'caravel', 'Pirate'); this.s.add(R.mesh); setOutlinesVisible(R.mesh); R.spd = 10.5 * Math.max(0.8, D.spd) * 1.18; this.msg('🏁 SHIP RACE! A rival crew bets they reach ' + this.toName + ' first — hold FULL SAIL!'); }
      R.rd += R.spd * dt * (prog > 0.6 ? 1.05 : 1); const k = Math.min(1, R.rd / ROUTE); const tgt = this.isle.position.clone(); const P = R.start.clone().lerp(tgt, k * 0.9); const side = new THREE.Vector3(-(tgt.z - R.start.z), 0, tgt.x - R.start.x).normalize(); P.addScaledVector(side, -22); R.mesh.position.set(P.x, Math.sin(this.t * 1.5) * 0.15, P.z); R.mesh.rotation.y = Math.atan2(-(tgt.x - R.start.x), -(tgt.z - R.start.z));
      const ee = this.el.querySelector('.veta'); if (ee) ee.textContent += ` · 🏁 You ${Math.round(prog * 100)}% vs Rival ${Math.round(k * 100)}%`;
      if (k >= 1) { R.done = true; this.msg('🏁 The rival crew won the race… next time!'); } else if (prog >= 0.99) { R.done = true; const r = Math.round(800 + (this.toLvl || 1) * 90); this.ber += r; this.raceWon = true; this.msg(`🏆 RACE WON! +฿${r.toLocaleString()}`); } }
    if (this.knockUp && prog >= this.knockUp.at) { const K = this.knockUp; if (K.t < 0) { K.t = 0; this.msg('🌊 KNOCK UP STREAM!! Hold on — next stop: the sky!'); K.col = new THREE.Mesh(new THREE.CylinderGeometry(9, 12, 400, 18, 1, true), new THREE.MeshBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })); K.col.position.set(this.ship.position.x, 200, this.ship.position.z); this.s.add(K.col); this.fx.shake = 1; }
      K.t += dt; this.ship.position.y = Math.pow(Math.min(1, K.t / 4.5), 1.6) * 160; this.ship.updateMatrixWorld(); this.cam.position.y += this.ship.position.y; this.fx.shake = Math.max(this.fx.shake || 0, 0.3); if (Math.random() < 0.6) this.fx.burst(this.ship.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 10, -2, (Math.random() - 0.5) * 10)), 6, 0xffffff, { speed: 6, up: -8, size: 1.2, life: 0.8 });
      this.sk.userData.mat.uniforms.top.value.lerp(new THREE.Color(0x2a6ad8), dt * 0.5); if (K.t > 4.8) { this.knockedUp = true; this.finish(false); return; } }
    if (prog >= 1 || this.skip) this.finish(false);
  }
  dmgPop(n) { const d = document.createElement('div'); d.className = 'vdmg'; d.textContent = n; d.style.left = (45 + Math.random() * 10) + '%'; this.el.appendChild(d); setTimeout(() => d.remove(), 800); }
  finish(wrecked) { if (this.done) return; this.done = true; for (const [k, f] of this._h) this.el.removeEventListener(k, f); removeEventListener('keydown', this._k); this.onEnd({ wrecked, ber: this.ber, xp: this.xp, kills: this.kills, skipped: !!this.skip }); }
  render(renderer) { renderer.clear(); renderer.render(this.s, this.cam); }
  resize() { this.cam.aspect = innerWidth / innerHeight; this.cam.updateProjectionMatrix(); }
  dispose() { this.s.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
}
