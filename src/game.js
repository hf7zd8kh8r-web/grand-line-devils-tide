import { THREE, renderer, Builder, mat, WORLD_MAT, qv, setOutlinesVisible, clamp, lerp, damp, qualityHooks, rng } from './engine.js';
import { makeWater, makeSky } from './world.js';
import { BUILDERS } from './islands.js';
import { makeChar, animChar, makeShip, makeBoatSmall, LOOKS, makeAvatar } from './models.js';
import { ENEMIES, FRUITS, SWORDS, GUNS, QUESTS, RACES, islandById, swordDmg, ISLANDS, RARITY } from './data.js';
import { FX, DmgNums } from './fx.js';
import { ViewModel } from './viewmodel.js';
import { IN, consume, pollKeys } from './input.js';
import * as ST from './state.js';
import { defaultLook, lookOverrides, randomLook } from './style.js';
import * as FS from './fruitshop.js';
import { makeDevilFruit } from './fruitart.js';
import { decorate } from './decor.js';
import { Folk } from './folk.js';
import { STYLES, styleOf } from './styles.js';
import { makeShipModel, migrateShips } from './ships.js';
import { Ambience } from './ambience.js';
import { audio } from './audio.js';
import { elementOf, elementFromColor } from './elements.js';
import { Events } from './events.js';
import { checkAch } from './achievements.js';
import { CrewMates, hasRole } from './crew.js';
import { castMove, castSpecial, fruitBasic, SP_REQ, ZOAN } from './fruits.js';
import { Net } from './net.js';
import { FruitHunt } from './fruithunt.js';
import { Roller } from './roller.js';
import { ThirdPerson } from './tpv.js';
import { Fishing, hakiToggle, hakiVisual, conqueror, fakeSpawn, fakeUpdate, fakeRemove, HAKI, hk } from './features.js';
const B = THREE;
const V = () => new B.Vector3();
const tmp = new B.Vector3(), tmp2 = new B.Vector3();

// per-spawn grunt variety: body type, hair, skin, colour shade, face details, sometimes a different weapon
function gruntVariant(def, s) { let h = Math.floor((s.x * 73.1 + s.z * 19.7) * 1000) >>> 0; const r = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296); const L = { ...(LOOKS[def.look] || {}), ...(def.lookO || {}) }; const o = {}; const pick = a => a[Math.floor(r() * a.length)];
  const build = r(); if (build < 0.2) o.big = (L.big || 1) * 1.18; else if (build < 0.35) o.small = true; else if (build < 0.5) o.big = (L.big || 1) * 0.92;
  if (!L.hat || r() < 0.3) { o.hairS = pick(['short', 'spiky', 'messy', 'slick', 'mohawk', 'buzz', 'swept', 'long', 'afro']); }
  o.hair = pick([0x111111, 0x2a1a10, 0x5a3a1a, 0x8a5a2a, 0xd8b060, 0xa03a2a, 0x6a6a6a]);
  if (typeof L.skin !== 'number' && L.skin !== 'fish') o.skin = pick(['light', 'tan', 'light', 'tan', 'dark']);
  const jit = c => { if (typeof c !== 'number') return c; const k = 0.82 + r() * 0.3; return (Math.min(255, ((c >> 16) & 255) * k) << 16) | (Math.min(255, ((c >> 8) & 255) * k) << 8) | Math.min(255, (c & 255) * k); };
  for (const k of ['shirt', 'pants', 'coat', 'vest']) if (typeof L[k] === 'number') o[k] = jit(L[k]);
  o.mouth = pick(['grin', 'teeth', 'line', 'frown', L.mouth || 'grin']); o.brow = r() < 0.75 ? 'angry' : 'normal';
  if (r() < 0.25) o.beard = pick(['stubble', true, 'big']); if (r() < 0.2) o.scar = true; if (r() < 0.12) o.glasses = 'shades'; if (r() < 0.15 && !L.hat) o.hat = 'bandana', o.hatC = pick([0xb3262a, 0x2a2a2a, 0x2a5a8a]);
  if (L.weapon && r() < 0.3) o.weapon = pick(['sabre', 'axe', 'spear', 'knives', 'club']); else if (!L.weapon && !def.ranged && r() < 0.4) o.weapon = pick(['sabre', 'club', 'knives']);
  return o; }
if (typeof window !== 'undefined') { window.__mk = (l, o) => makeChar(l, o); window.__EN = ENEMIES; window.__gv = (d, s) => gruntVariant(d, s); window.__rl = randomLook; window.__av = (R) => makeAvatar('Pirate', 'Human', R.look, R.cos); }
export class Game {
  constructor(ui) {
    this.ui = ui;
    this.scene = new B.Scene();
    this.cam = new B.PerspectiveCamera(72, innerWidth / innerHeight, 0.08, 450); this.cam.rotation.order = 'YXZ';
    this.hemi = new B.HemisphereLight(0xdff2ff, 0x5a7a3a, 1.25); this.sun = new B.DirectionalLight(0xfff1d6, 2.2); this.sun.position.set(40, 60, -30);
    this.scene.add(this.hemi, this.sun);
    this.water = makeWater(false); this.scene.add(this.water);
    this.sky = makeSky(0x3f9be8, 0xcfeeff); this.scene.add(this.sky); this.amb = new Ambience(this); this.events = new Events(this); this.crew = new CrewMates(this); this.folk = new Folk(this);
    this.fx = new FX(this.scene, this.cam); this.nums = new DmgNums(document.getElementById('nums'));
    this.vm = new ViewModel(); this.tpv = new ThirdPerson(this);
    this.enemies = []; this.npcs = []; this.projs = []; this.island = null; this.cut = null; this.t = 0; this.paused = false;
    this.p = { pos: V(), vy: 0, yaw: Math.PI, pitch: 0, ground: true, dash: 0, dashCd: 0, dashDir: V(), iframe: 0, atkCd: 0, combo: 0, comboT: 0, phase: 0, moving: false, cds: {}, special: 0, regen: 0, hurtT: 0, swim: false, stun: 0 };
    this.shadowGeo = new B.CircleGeometry(0.5, 12); this.shadowMat = new B.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false });
    this.blobs = new B.InstancedMesh(this.shadowGeo, this.shadowMat, 64); this.blobs.frustumCulled = false; this.scene.add(this.blobs);
    this.bars = document.getElementById('bars'); this.fishing = new Fishing(this); this.net = new Net(this); this.hunt = new FruitHunt(this); this.roller = new Roller(this); this.anim = (c, st) => animChar(c, st, this.t);
    this.markers = [];
    qualityHooks.push(() => { setOutlinesVisible(this.scene); this.cam.far = qv().far + 250; this.cam.updateProjectionMatrix(); this.scene.fog && (this.scene.fog.far = qv().far); this.water.userData.mat.uniforms.fogF.value = qv().far; });
  }
  get S() { return this.save; }
  start(save) {
    this.save = save; save.tf = 0; this.st = ST.stats(save); if (save.hp == null) save.hp = this.st.maxHp;
    if (save.mastery && save.mastery['fs:Brawler'] && !save.mastery['fs:brawler']) { save.mastery['fs:brawler'] = save.mastery['fs:Brawler']; delete save.mastery['fs:Brawler']; } save.styles = save.styles || ['brawler']; save.eq.style = save.eq.style || 'brawler';
    if (!save.look) save.look = defaultLook(save.faction, save.race); save.cos = save.cos || []; save.cosEq = save.cosEq || {};
    this.rebuildArms();
    this.refreshEquip();
    this.loadIsland(save.island, false);
    this.running = true;
  }
  showPreview(on) { if (this.preview) { this.scene.remove(this.preview.root); this.preview.root.traverse(o => o.geometry && o.geometry.dispose()); this.preview = null; } this.vm.root.visible = !on && !this.seat; if (!on) return;
    const S = this.save; const c = makeAvatar(S.faction, S.race, S.look, S.cosEq); const fw = this.fwdFlat(V()); const P = this.p.pos.clone().addScaledVector(fw, (innerWidth > innerHeight ? 2.7 : 4.6) * (S.race === 'Giant' ? 1.4 : 1));
    const rt = new B.Vector3(-fw.z, 0, fw.x); if (innerWidth > innerHeight) P.addScaledVector(rt, -0.9); P.y = this.groundAt(P.x, P.z); c.root.position.copy(P); c.root.rotation.y = Math.atan2(-fw.x, -fw.z); this.scene.add(c.root); setOutlinesVisible(c.root); this.preview = c; this.p.pitch = innerWidth > innerHeight ? -0.12 : -0.3; }
  sitAt() { const T = this.table; if (!T) return; const taken = s => [...this.net.peers.values()].some(q => q.island === this.island.id && (q.m & 4) && Math.hypot(q.tgt.x - s.x, q.tgt.z - s.z) < 0.6); const s = (T.seats || [T.seatB]).find(x => !taken(x)) || T.seatB; this.seat = s; const dx = T.sp.x - s.x, dz = T.sp.z - s.z; this.p.yaw = Math.atan2(-dx, -dz); this.p.pitch = -0.2; this.vm.root.visible = false; this.p.pos.set(s.x, this.groundAt(s.x, s.z), s.z); }
  standUp() { if (!this.seat) return; const T = this.table; this.seat = null; this.vm.root.visible = true; if (T) { const dx = this.p.pos.x - T.sp.x, dz = this.p.pos.z - T.sp.z, l = Math.hypot(dx, dz) || 1; this.p.pos.x += dx / l * 0.9; this.p.pos.z += dz / l * 0.9; } }
  rebuildArms() { const S = this.save; const o = lookOverrides(S.look, S.race, S.faction, S.cosEq); const bare = (o.open || o.sleeveless) && !o.coat && !o.longSleeve;
    const sleeve = o.coat || (bare ? o.skin : o.shirt); const cuff = o.coat ? new B.Color(o.coat).multiplyScalar(0.75).getHex() : bare ? (o.gloves || o.skin) : (S.faction === 'Marine' ? 0x2a5bb8 : new B.Color(o.shirt).multiplyScalar(0.7).getHex());
    const z = S.tf && ZOAN[S.eq.fruit]; const fur = z ? z[1] : 0; const tint = (c, k) => z ? new B.Color(c).lerp(new B.Color(fur), k).getHex() : c;
    this.vm.build(tint(o.skin, S.tf === 2 ? 0.85 : 0.45), tint(sleeve, S.tf === 2 ? 0.9 : 0.25), tint(cuff, S.tf === 2 ? 0.9 : 0.3)); if (this.running) this.refreshEquip(); }
  // Zoan transform: Human -> Hybrid -> Full Beast -> Human
  transform(force) { const S = this.save; const z = S.eq.fruit && ZOAN[S.eq.fruit];
    if (force === 0) { if (!S.tf) return; } else { if (!z) { this.ui.toast('Only Zoan (animal) fruits can transform', 'blk'); return; } if (S.slot !== 'fruit') { this.ui.toast('Switch to your fruit to transform', 'blk'); return; } if (this.seaDrain && this.seaDrain()) { this.ui.toast('🌊 Can\'t transform in the sea!', 'blk'); return; } if (this.cut) return; }
    const hp = S.hp / this.st.maxHp; S.tf = force === 0 ? 0 : ((S.tf | 0) + 1) % 3; this.st = ST.stats(S); S.hp = Math.max(1, Math.round(hp * this.st.maxHp)); this.rebuildArms(); this.ui.updateMoves(); this.ui.updateHud();
    const col = z ? z[1] : 0xffffff; const c = this.p.pos.clone().setY(this.p.pos.y + 1); this.fx.burst(c, 30, col, { speed: 6, up: 3, size: 0.5, life: 0.6 }); this.fx.ring(this.p.pos.clone().setY(this.p.pos.y + 0.2), col, 5, 0.5); this.fx.shake = Math.max(this.fx.shake, S.tf === 2 ? 0.5 : 0.2);
    if (force !== 0) this.ui.toast(S.tf === 2 ? `🐾 FULL BEAST FORM: ${z[0]}! (+30% DMG, tougher, faster, beast moves)` : S.tf === 1 ? `🐾 Hybrid form: ${z[0]} (+15% DMG)` : '🧍 Back to human form', S.tf ? 'rare' : 'blk'); else this.ui.toast('🧍 Transformation wore off', 'blk');
    S.stats.transforms = (S.stats.transforms || 0) + (S.tf ? 1 : 0); }
  refreshEquip() {
    { const st = styleOf(this.save); this.vm.setStyle && this.vm.setStyle(st.col, st.id !== 'brawler'); }
    const S = this.save; this.st = ST.stats(S);
    this.vm.setSword(S.eq.sword ? ((S.t2 || {})[S.eq.sword] ? { ...SWORDS[S.eq.sword], col: 0x1a1a22 } : SWORDS[S.eq.sword]) : null);
    if (S.slot === 'sword' && !S.eq.sword) S.slot = 'fist'; if (S.slot === 'gun' && !S.eq.gun) S.slot = 'fist'; if (S.slot === 'fruit' && !S.eq.fruit) S.slot = 'fist';
    this.vm.setMode(S.slot === 'fruit' ? 'fist' : S.slot);
    const f = S.eq.fruit && FRUITS[S.eq.fruit]; this.vm.tint(f && S.slot === 'fruit' ? f.col[0] : 0, S.slot === 'fruit' ? 0.2 : 0); this.vm.aura(f && S.slot === 'fruit' ? (f.glow || f.col[0]) : 0);
    this.ui.updateMoves(); hakiVisual(this);
  }
  // ---------------- islands ----------------
  loadIsland(id, arrive = true) {
    if (this.island) { this.bossMem = this.bossMem || {}; for (const e of this.enemies) if (e.boss && !e.ext && !e.temp && !e.dead && e.hp < e.max) this.bossMem[this.island.id + ':' + e.s.type] = { hp: e.hp, phase2: e.phase2, t: Date.now() }; }
    if (this.events) this.events.reset(); if (this.crew) this.crew.clear(); if (this.folk) this.folk.clear();
    const disp = (root) => root.traverse(o => { if (o.geometry && o.geometry !== this.shadowGeo && o.geometry !== this.fx.sphGeo) o.geometry.dispose(); if (o.material && o.material !== WORLD_MAT && o.material.userData && !o.material.userData.keep && o.isSkinnedMesh && !o.userData.isOutline) o.material.dispose(); });
    if (this.island) { this.scene.remove(this.island.group); disp(this.island.group); for (const e of this.enemies) disp(e.c.root); for (const n of this.npcs) { disp(n.c.root); n.mark && disp(n.mark); n.machine && disp(n.machine); } for (const o of this.fakes || []) disp(o.c.root); this.net.islandChanged(); }
    for (const e of this.enemies) this.scene.remove(e.c.root); for (const n of this.npcs) { this.scene.remove(n.c.root); if (n.mark) this.scene.remove(n.mark); if (n.machine) this.scene.remove(n.machine); }
    for (const p of this.projs) p.mesh && this.scene.remove(p.mesh); fakeRemove(this); this.fishing && this.fishing.stop(); this.clearGather();
    this.enemies = []; this.npcs = []; this.projs = []; this.nums.clear(); this.bars.innerHTML = ''; this.barPool = [];
    const I = this.island = (BUILDERS[id] || BUILDERS.windmill)(); this.save.island = I.id;
    if (!this.save.unlocked.includes(I.id)) this.save.unlocked.push(I.id);
    this.scene.add(I.group);
    const pal = I.palette; this.sky.userData.mat.uniforms.top.value.set(pal.skyTop); this.sky.userData.mat.uniforms.bot.value.set(pal.skyBot);
    this.scene.fog = new B.Fog(pal.fog, 40, qv().far); const wu = this.water.userData.mat.uniforms; wu.fogC.value.set(pal.fog); wu.fogN.value = 40; wu.fogF.value = qv().far; wu.isl.value.set(0, 0, I.R - 4); const sea = pal.sea || [0x0b5a8c, 0x2fb3d6]; wu.deep.value.set(sea[0]); wu.shallow.value.set(sea[1]); const lt = pal.light || [0xdff2ff, 0x5a7a3a, 0xfff1d6, 2.2]; this.hemi.color.set(lt[0]); this.hemi.groundColor.set(lt[1]); this.sun.color.set(lt[2]); this.sun.intensity = lt[3];
    this.amb.base();
    for (const s of I.spawns) { const e = this.spawnEnemy(s); const m = e && e.boss && this.bossMem && this.bossMem[I.id + ':' + s.type]; if (m) { const age = (Date.now() - m.t) / 1000; if (age < 600) { e.hp = Math.min(e.max, Math.round(m.hp + e.max * age / 600)); e.phase2 = m.phase2 && e.hp < e.max * 0.5; } delete this.bossMem[I.id + ':' + s.type]; } }
    const tr = Object.values(STYLES).filter(st => st.island === I.id); if (tr.length && !I.npcs.some(n => n.role === 'trainer')) { const g0 = I.npcs.find(n => n.role === 'quest') || { x: 0, z: I.R * 0.4 };
      I.npcs.push({ id: 'trainer', look: 'smith', name: tr[0].name + ' Master', role: 'trainer', x: g0.x - 3.2, z: g0.z - 3, ry: Math.PI / 2, over: { shirt: tr[0].col, band: 0xffffff, hairS: 'buzz', sash: 0x1a1a1a, mouth: 'line' } }); }
    for (const n of I.npcs) this.spawnNpc(n);
    try { decorate(this, I); } catch (err) { console.warn('decor', err); } try { this.folk.spawn(I); } catch (err) { console.warn('folk', err); }
    { const fd = I.npcs.find(n => n.shop === 'rot'); if (fd) { const fx = Math.sin(fd.ry || 0), fz = Math.cos(fd.ry || 0); const st = new B.Group(); const tx = fd.x + fx * 1.5, tz = fd.z + fz * 1.5; st.position.set(tx, I.hf ? I.hf(tx, tz) : this.groundAt(tx, tz), tz); st.rotation.y = fd.ry || 0;
      const wood = new B.MeshToonMaterial({ color: 0x8a5a32 }), cloth = new B.MeshToonMaterial({ color: 0x6a2a8a }); const top = new B.Mesh(new B.BoxGeometry(2.4, 0.12, 0.9), wood); top.position.y = 0.9; st.add(top); const cl = new B.Mesh(new B.BoxGeometry(2.45, 0.5, 0.92), cloth); cl.position.y = 0.66; st.add(cl);
      for (const [x, z] of [[-1.1, -0.38], [1.1, -0.38], [-1.1, 0.38], [1.1, 0.38]]) { const lg = new B.Mesh(new B.BoxGeometry(0.1, 0.9, 0.1), wood); lg.position.set(x, 0.45, z); st.add(lg); }
      const fr = []; FS.stockFor(I.id).slice(0, 3).forEach((o, i) => { const d = new B.Mesh(new B.CylinderGeometry(0.2, 0.24, 0.08, 14), new B.MeshToonMaterial({ color: 0xd8c8a0 })); d.position.set(-0.75 + i * 0.75, 1.0, 0); st.add(d); const m = makeDevilFruit(o.id, 0.42); m.position.set(-0.75 + i * 0.75, 1.3, 0); m.userData.baseY = 1.3; st.add(m); fr.push(m); });
      I.group.add(st); setOutlinesVisible(st); I.updaters.push(dt => { for (const m of fr) m.userData.spin(dt, this.t); }); } }
    fakeSpawn(this); this.crew.spawn();
    const sp = arrive && I.dock ? [I.dock.x, I.dock.z - 2] : I.spawn;
    this.p.pos.set(sp[0], this.groundAt(sp[0], sp[1]), sp[1]); this.p.yaw = arrive ? 0 : Math.PI * 0.95; this.p.pitch = -0.05; this.p.vy = 0;
    migrateShips(this.save); if (I.boat && this.save.ship) { const sh = makeShipModel(this.save.ship, this.save.faction); sh.position.copy(I.boat.position); sh.position.x += sh.userData.wid * 0.5 - 0.6; sh.position.y = -0.25; sh.rotation.y = Math.PI; I.group.add(sh); setOutlinesVisible(sh); I.boat.visible = false; I.shipModel = sh; I.colliders.push({ x: sh.position.x, z: sh.position.z, r: sh.userData.wid * 0.55 }); }
    else if (I.boat) I.boat.visible = !!this.save.boat;
    this.bossIntroDone = {};
    setOutlinesVisible(this.scene);
    this.ui.islandBanner(islandById(I.id)); clearTimeout(this._hintT); this._hintT = setTimeout(() => this.ui.giverHint(), 3800);
    this.ui.mapDirty = true;
    ST.save(this.save);
  }
  resetCamera() { const p = this.p; p.pitch = 0; p.yaw = isFinite(p.yaw) ? p.yaw : 0; IN.resetTouch(); IN.lookX = IN.lookY = 0; this.cam.fov = 72; this.cam.updateProjectionMatrix(); this.cam.rotation.order = 'YXZ'; this.cam.up.set(0, 1, 0); this.cam.rotation.set(0, p.yaw, 0); if (this.cut && !this.cut.boss) this.cut = null; document.body.classList.remove('cine'); this.ui.letterbox && this.ui.letterbox(false); if (this.tpv) this.tpv.camP.set(0, 0, 0); this.ui.toast('🎥 Camera reset', 'blk'); }
  toShore(auto) { const p = this.p, I = this.island; const a = Math.atan2(p.pos.z, p.pos.x); let best = null;
    for (const da of [0, 0.15, -0.15, 0.3, -0.3, 0.6, -0.6, 1.2, -1.2, Math.PI]) { const aa = a + da; for (let r = I.R + 10; r > 2; r -= 1) { const x = Math.cos(aa) * r, z = Math.sin(aa) * r; const h = this.groundAt(x, z); if (h > 0.6) { const rr = Math.max(2, r - 3); best = [Math.cos(aa) * rr, Math.sin(aa) * rr]; break; } } if (best) break; }
    if (!best) best = [I.dock ? I.dock.x : 0, I.dock ? I.dock.z - 10 : 0];
    p.pos.set(best[0], 0, best[1]); this.collide(p.pos, 0.4); p.pos.y = this.groundAt(p.pos.x, p.pos.z) + 0.05; p.vy = 0; p.kb = null; p.lunge = null; p.swimT = 0; p.swim = false;
    this.fx.burst(p.pos.clone().setY(p.pos.y + 1), 14, 0xbfe8ff, { speed: 3, up: 3, size: 0.4, life: 0.6 }); this.ui.toast(auto ? '🌊 The tide washed you back to shore!' : '🏝 Back on shore', 'blk'); }
  groundAt(x, z) {
    const I = this.island; let h = I.hf(x, z);
    if (I.dock && Math.abs(x - I.dock.x) < 1.55 && z > I.dock.z0 && z < I.dock.z1) h = Math.max(h, I.dock.y);
    return h;
  }
  spawnEnemy(s) {
    const def = ENEMIES[s.type]; const c = makeChar(def.look, { ...(def.lookO || {}), ...(def.boss ? {} : gruntVariant(def, s)), scale: def.scale || (s.type === 'thug' ? 1.12 : 1) });
    if (s.type === 'rifle') { /* rifle look tweak */ }
    c.root.position.set(s.x, this.island.hf(s.x, s.z), s.z); this.scene.add(c.root); setOutlinesVisible(c.root);
    const hpMul = 1 + (s.lvl - 1) * 0.12;
    const e = { s, def, c, hp: Math.round(def.hp * hpMul), max: Math.round(def.hp * hpMul), lvl: s.lvl, home: V().set(s.x, 0, s.z), vel: V(), state: 'idle', t: Math.random() * 3, atk: 0, cd: 1 + Math.random(), hitT: 0, flash: 0, dead: false, deadT: 0, anim: { phase: Math.random() * 6 }, yaw: Math.random() * 6, wander: V().set(s.x, 0, s.z), boss: !!def.boss, aggro: false, phase2: false, skillCd: 4 };
    this.enemies.push(e); return e;
  }
  spawnNpc(n) {
    const c = makeChar(n.look, n.over || {}); const y = this.island.hf(n.x, n.z); c.root.position.set(n.x, y, n.z); c.root.rotation.y = n.ry || 0; this.scene.add(c.root); setOutlinesVisible(c.root);
    const o = { ...n, c, anim: { phase: 0 } };
    if (n.role === 'roller') { const m = this.roller.model(); const ry = n.ry || 0, mx = n.x + Math.cos(ry) * 1.6, mz = n.z - Math.sin(ry) * 1.6; m.position.set(mx, this.island.hf(mx, mz), mz); m.rotation.y = ry; this.scene.add(m); o.machine = m; }
    if (n.role === 'quest' || n.role === 'dock' || n.role === 'trader' || n.role === 'shop' || n.role === 'roller') {
      const b = new Builder(); const col = { quest: 0xffd23a, dock: 0x4ad0ff, trader: 0xc77dff, shop: 0x7dff9a, roller: 0xff4d6d }[n.role];
      if (n.role === 'quest') { b.add(new B.BoxGeometry(0.16, 0.5, 0.16), col, mat(0, 0.3, 0)); b.add(new B.BoxGeometry(0.17, 0.17, 0.17), col, mat(0, -0.12, 0)); }
      else b.add(new B.OctahedronGeometry(0.22, 0), col, mat(0, 0.1, 0));
      o.mark = b.build(); o.mark.position.set(n.x, y + c.height + 0.6, n.z); this.scene.add(o.mark);
      if (n.role === 'dock') { const bm = new B.Mesh(new B.CylinderGeometry(0.35, 0.6, 40, 10, 1, true), new B.MeshBasicMaterial({ color: 0x4ad0ff, transparent: true, opacity: 0.28, depthWrite: false, side: B.DoubleSide })); bm.position.set(n.x, y + 20, n.z); bm.visible = !(this.save.ships && this.save.ships.length) && !this.save.boat; this.scene.add(bm); o.beam = bm; }
    }
    this.npcs.push(o);
  }
  // ---------------- combat helpers ----------------
  eyePos() { return tmp2.set(this.p.pos.x, this.p.pos.y + this.st.eye, this.p.pos.z); }
  fwd(out = V()) { return out.set(-Math.sin(this.p.yaw) * Math.cos(this.p.pitch), Math.sin(this.p.pitch), -Math.cos(this.p.yaw) * Math.cos(this.p.pitch)); }
  fwdFlat(out = V()) { return out.set(-Math.sin(this.p.yaw), 0, -Math.cos(this.p.yaw)); }
  chest(e, out = V()) { return out.copy(e.c.root.position).setY(e.c.root.position.y + e.c.height * 0.6); }
  damageEnemy(e, dmg, o = {}) {
    if (e.dead || dmg <= 0) return;
    const S0 = this.save, hon = S0.haki && S0.haki.buso; const crit = Math.random() < (o.remote ? 0.1 : 0.1 + (S0.haki && S0.haki.ken && hk(S0, 'ken', 2) ? 0.1 : 0)); if (!o.remote && this.p.fsight) { dmg *= 2; this.p.fsight = 0; } if (!o.remote && e.boss && hon && hk(S0, 'buso', 2)) dmg *= 1.15; dmg = Math.round(dmg * (crit ? (hk(S0, 'conq', 3) ? 1.9 : 1.6) : 1) * (0.9 + Math.random() * 0.2) * (!o.remote && this.seaDrain() ? 0.5 : 1));
    if (!o.remote) this.net.hit(e, dmg);
    e.hp -= dmg; e.c.face && e.c.face.set(e.hp <= 0 ? 'ko' : 'hurt', e.hp <= 0 ? 99 : 0.35); e.flash = 0.12; e.hitT = o.stun ?? 0.22; e.aggro = true; e.lastHitT = this.t; e.calmT = 0; if (!e.boss) { e.state = 'hit'; e.atk = 0; }
    const kb = o.kb ?? 3; tmp.copy(e.c.root.position).sub(o.from || this.p.pos).setY(0).normalize(); e.vel.addScaledVector(tmp, kb * (e.boss ? 0.3 : 1)); if (o.up) e.vy = o.up * (e.boss ? 0.2 : 1);
    this.nums.spawn(this.chest(e, V()).add(new B.Vector3(0, 0.5, 0)), dmg, crit ? 'crit' : (o.cls || ''));
    { const hp0 = this.chest(e, V()); const el = o.el || (o.mast && o.mast.startsWith('fr:') ? elementOf(o.mast.slice(3), elementFromColor(o.col || 0xffe6a0)) : elementFromColor(o.col || 0xffe6a0)); const pw = (o.kb ?? 3) / 3.5 + (crit ? 0.6 : 0); const dirv = tmp.clone(); dirv.y = 0.3;
      if (o.remote) this.fx.burst(hp0, 6, o.col || 0xffe6a0, { speed: 5, size: 0.25, life: 0.35 }); else { this.fx.impact(hp0.addScaledVector(dirv, -0.3), el, pw, dirv); audio.sfx(o.snd || (o.mast && o.mast.startsWith('fr:') ? 'heavy' : 'punch'), { vol: Math.min(1.2, 0.6 + pw * 0.3) }); if (crit) { this.speedLines(0.7); this.camPunch(0.02, 3); } } e.kbPose = Math.min(1, 0.4 + pw * 0.4); }
    this.save.stats.dmg += dmg; this.p.special = Math.min(100, this.p.special + dmg * 0.04);
    if (o.mast) { const killing = e.hp <= 0; const amt = 1 + (killing ? (e.boss ? 40 : 5) : 0); let up = false; for (let i = 0; i < amt; i++) if (ST.addMastery(this.save, o.mast, 1)) up = true;
      if (up) { const L = ST.mastery(this.save, o.mast).lvl; this.ui.toast(`${o.mastName || 'Mastery'} up! Lv ${L}`, 'mast'); if ([10, 25, 50].includes(L) || Object.values(SP_REQ).includes(L)) { this.ui.toast(`🔓 New move unlocked at mastery ${L}!`, 'rare'); this.ui.updateMoves(); } } }
    if (o.mast && !this.cut) this.hitstop = Math.max(this.hitstop || 0, e.hp <= 0 ? 0.07 : 0.03);
    if (e.hp <= 0) { if (!this.cut) this.fx.shake = Math.min(1, this.fx.shake + (e.boss ? 0.6 : 0.15)); this.killEnemy(e); }
  }
  killEnemy(e) {
    e.dead = true; e.deadT = 0; e.hp = 0; const S = this.save; const d = e.def;
    S.stats.kills++; S.kills[e.s.type] = (S.kills[e.s.type] || 0) + 1; if (e.boss && !e.ext) S.stats.bosses++;
    const nb = this.amb && this.amb.isNight() ? 1.2 : 1; const fm = this.factionMul ? this.factionMul() : { ber: 1, xp: 1 };
    const ber = Math.round((d.ber[0] + Math.random() * (d.ber[1] - d.ber[0])) * (1 + (e.lvl - 1) * 0.08) * nb * fm.ber);
    this.addBerries(ber, this.chest(e, V()));
    this.addXp(Math.round(d.xp * (1 + (e.lvl - 1) * 0.1) * nb * fm.xp));
    if (d.drop && Math.random() < (e.boss ? 1 : (S.quest && S.quest.type === 'mat' ? 0.6 : 0.35))) { S.inv.mats[d.drop] = (S.inv.mats[d.drop] || 0) + 1; this.ui.toast(`Got ${d.drop}`, 'item'); this.questEvent('mat', d.drop); }
    if (e.s.type === 'higuma' && !S.inv.fruits.includes('gomu') && S.eq.fruit !== 'gomu' && Math.random() < 0.35) { S.inv.fruits.push('gomu'); this.ui.toast('Higuma dropped a strange swirly fruit! (Gum-Gum)', 'rare'); }
    if (e.s.type === 'morgan' && !S.inv.swords.includes('marine')) { S.inv.swords.push('marine'); this.ui.toast('Got Marine Saber from Morgan\'s armory!', 'rare'); }
    if (['zou_boss', 'wci_boss', 'wano_boss', 'egghead_boss'].includes(e.s.type) && Math.random() < 0.3) { const k = 'Road Poneglyph: ' + islandById(e.s.type.split('_')[0]).name; if (!S.inv.mats[k]) { S.inv.mats[k] = 1; this.ui.toast(`📜 Found a ${k} rubbing!`, 'rare'); const n = Object.keys(S.inv.mats).filter(x => x.startsWith('Road Poneglyph')).length; if (n >= 4 && !(S.secrets || {}).laughtale) { S.secrets = S.secrets || {}; S.secrets.laughtale = 1; setTimeout(() => this.ui.banner('LAUGH TALE REVEALED', 'All four Road Poneglyphs point to the final island…'), 2600); } } }
    if (e.boss && e.lvl >= 200 && Math.random() < 0.04) { const ul = ['nika', 'seiryu', 'sound', 'makami']; const u = ul[Math.floor(Math.random() * 4)]; S.inv.fruits.push(u); this.ui.banner('ULTRA FRUIT!!', `${FRUITS[u].name} dropped!`); }
    const q = S.quest; if (q && q.type === 'kill' && (q.target === e.s.type || q.target === '*')) { if (q.time && !q.until) q.until = this.t + q.time; q.have++; if (q.have >= q.n) this.completeQuest(); else this.ui.toast(`${q.text}: ${q.have}/${q.n}`, 'quest'); this.ui.updateQuest(); }
    if (e.boss && !e.ext) { this.ui.bossBar(null); this.ui.banner(`${d.name} DEFEATED!`, 'Victory'); this.fx.shake = 0.6;
      migrateShips(S); if (!S.ships.length && S.island === 'windmill') { S.ships.push('dinghy'); S.ship = 'dinghy'; S.boat = true; if (this.island.boat) this.island.boat.visible = true; setTimeout(() => { this.ui.banner('FREE BOAT!', 'Makino gifted you a Small Sailboat — open 🗺 Map to set sail!'); this.ui.updateHud(); }, 2600); } }
    ST.save(S);
  }
  addBerries(n, at) { this.save.ber += n; if (n > 0) audio.sfx('coin', { gap: 120 }); if (at) { this.nums.spawn(at.clone().add(new B.Vector3(0, 1, 0)), '+฿' + n, 'ber'); this.fx.burst(at, 10, 0xffd23a, { speed: 4, up: 5, size: 0.2, life: 0.7 }); } this.ui.updateHud(); }
  addXp(n) {
    const S = this.save; n = Math.round(n * this.st.xpM); S.xp += n; let up = false;
    while (S.xp >= ST.xpNeed(S.lvl)) { S.xp -= ST.xpNeed(S.lvl); S.lvl++; up = true; } if (up) audio.sfx('level');
    if (up) { this.st = ST.stats(S); S.hp = this.st.maxHp; this.ui.banner(`LEVEL ${S.lvl}!`, 'Level Up'); this.fx.burst(this.p.pos.clone().setY(this.p.pos.y + 1), 50, 0xffe85a, { speed: 6, up: 4, life: 1 }); this.fx.ring(this.p.pos.clone().setY(this.p.pos.y + 0.1), 0xffe85a, 6, 0.8); this.ui.updateMoves();
      for (const [k, l] of Object.entries(HAKI)) if (S.lvl >= l && !(S.hakiU || {})[k]) { S.hakiU = S.hakiU || {}; S.hakiU[k] = 1; setTimeout(() => this.ui.banner({ buso: 'ARMAMENT HAKI', ken: 'OBSERVATION HAKI', conq: "CONQUEROR'S HAKI" }[k], k === 'conq' ? 'Press J / CONQ to unleash it' : 'Press H / HAKI to toggle'), 2800); } }
    this.ui.updateHud();
  }
  questEvent(type, key) { const q = this.save.quest; if (!q || q.type !== type || (q.target && key !== q.target)) return false;
    q.have++; this.fx.burst(this.p.pos.clone().setY(this.p.pos.y + 1.2), 14, 0xffd04a, { speed: 3, up: 3, size: 0.2, life: 0.6 }); if (q.have >= q.n) this.completeQuest(); else this.ui.toast(`${q.text}: ${q.have}/${q.n}`, 'quest'); this.ui.updateQuest(); return true; }
  stockTick() { const w = FS.windowId(); if (this._stockW === w) return; const first = this._stockW === undefined; this._stockW = w;
    const rare = []; for (const I of ISLANDS) { if (I.secret || !(this.save.unlocked || []).includes(I.id) && I.id !== this.island.id) continue; for (const o of FS.stockFor(I.id, w)) if (o.rar >= 6) rare.push([I, o]); }
    if (rare.length) { const [I, o] = rare.sort((a, b) => b[1].rar - a[1].rar)[0]; setTimeout(() => { this.ui.banner('RARE STOCK!', `${FRUITS[o.id].name} (${RARITY[o.rar]}) at the ${I.name} Fruit Dealer`); this.ui.chat('📢 Fruit Dealer', `RARE STOCK! ${RARITY[o.rar]} ${FRUITS[o.id].name} on ${I.name} for the next ${FS.fmtLeft(FS.msLeft())}!`); }, first ? 9000 : 500); }
    else if (!first && !(this.ui.modal === 'shop' && this.ui.shopId === 'rot')) this.ui.toast('🍇 Fruit Dealers restocked!', 'item'); }
  questTick(dt) { const q = this.save.quest; if (!q) { if (this.gather) this.clearGather(); return; }
    if (q.time && q.until) { const left = q.until - this.t; if (left <= 0) { if (q.type === 'talk') { this.save.quest = null; this.ui.toast('⏱ Too slow! Ask again to retry the rush', 'blk'); this.ui.updateQuest(); this.ui.questTimer(null); return; } q.have = 0; q.until = 0; this.ui.toast('⏱ Too slow! The ambush regrouped — try again', 'blk'); } this.ui.questTimer(Math.max(0, left)); } else this.ui.questTimer(null);
    const here = (QUESTS[this.island.id] || []).some(x => x.id === q.id);
    if (q.type === 'gather' && here && !this.gather) this.spawnGather(q);
    if (this.gather) for (const it of this.gather) { if (it.got) continue; it.m.rotation.y += dt * 2; it.m.position.y = it.y + 0.9 + Math.sin(this.t * 3 + it.x) * 0.15;
      if (Math.hypot(it.x - this.p.pos.x, it.z - this.p.pos.z) < 1.7 && Math.abs(this.p.pos.y - it.y) < 2.5) { it.got = true; it.m.visible = false; this.questEvent('gather'); if (!this.save.quest) { this.clearGather(); break; } } } }
  spawnGather(q) { const I = this.island; const r = rng(q.id.length * 977 + (this.save.stats.created % 1000)); this.gather = []; const left = q.n - q.have; let tries = 0;
    while (this.gather.length < left && tries++ < 400) { const a = r() * Math.PI * 2, d = 6 + r() * I.R * 0.7; const x = Math.cos(a) * d, z = Math.sin(a) * d; const y = I.hf(x, z); if (y < 0.4) continue;
      if (I.colliders.some(c => Math.hypot(c.x - x, c.z - z) < (c.r || Math.max(c.hw || 1, c.hd || 1)) + 1)) continue; if (this.gather.some(o => Math.hypot(o.x - x, o.z - z) < 8)) continue;
      const g = new B.Group(); const core = new B.Mesh(new B.OctahedronGeometry(0.32, 0), new B.MeshToonMaterial({ color: q.col || 0xffd04a, emissive: q.col || 0xffd04a, emissiveIntensity: 0.6 })); g.add(core);
      const beam = new B.Mesh(new B.CylinderGeometry(0.12, 0.3, 14, 8, 1, true), new B.MeshBasicMaterial({ color: q.col || 0xffd04a, transparent: true, opacity: 0.22, blending: B.AdditiveBlending, depthWrite: false, side: B.DoubleSide })); beam.position.y = 6; g.add(beam);
      g.position.set(x, y + 0.9, z); this.scene.add(g); this.gather.push({ m: g, x, z, y }); } }
  clearGather() { if (!this.gather) return; for (const it of this.gather) { this.scene.remove(it.m); it.m.traverse(o => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose(); }); } this.gather = null; }
  completeQuest() {
    const S = this.save, q = S.quest; S.quest = null; S.qdone.push(q.id); this.clearGather(); this.ui.questTimer(null);
    this.ui.banner('QUEST COMPLETE', `${q.text} · +${q.xp} XP · +฿${q.ber}`);
    const sw = q.sword || (q.reward === 'wado_hint' ? 'wado' : null); if (sw && !S.inv.swords.includes(sw)) { S.inv.swords.push(sw); setTimeout(() => this.ui.banner(SWORDS[sw].name.toUpperCase(), 'Legendary blade obtained!'), 2700); } this.addBerries(q.ber); this.addXp(q.xp); this.ui.updateQuest();
  }
  hurtPlayer(dmg, from, o = {}) {
    const p = this.p; if (p.iframe > 0 || this.cut || this.dead) return;
    if (styleOf(this.save).id === 'kenbun' && Math.random() < 0.15) { this.ui.toast('Read it! (Kenbunshoku Dodge)', 'mast'); p.iframe = 0.3; return; }
    if (this.save.haki && this.save.haki.ken && Math.random() < (hk(this.save, 'ken', 1) ? 0.35 : 0.25)) { this.ui.toast(hk(this.save, 'ken', 3) ? 'Dodged! Future Sight: next hit x2' : 'Dodged! (Observation Haki)', 'mast'); p.iframe = 0.3; if (hk(this.save, 'ken', 3)) p.fsight = 1; return; }
    let d = dmg * this.st.def;
    const blocking = IN.held.block && !(p.gbreakT > 0);
    if (blocking && from) { this.fwdFlat(tmp); tmp2.copy(from).sub(p.pos).setY(0).normalize(); if (tmp.dot(tmp2) > 0.2) { d *= styleOf(this.save).id === 'tekkai' ? 0.12 : 0.2;
      const fp = this.eyePos().clone().addScaledVector(this.fwd(V()), 0.9).add(new B.Vector3(0, -0.2, 0)); this.fx.sparks(fp, 14, 0xfff0b0, { speed: 9, dir: tmp2.clone().multiplyScalar(-1) }); this.fx.shock(fp, 0x7ad8ff, 0.42, 0.28, 0.9); this.fx.shock(fp.clone().addScaledVector(tmp, 0.05), 0xffffff, 0.25, 0.18, 0.7);
      this.vm.blockHit(); audio.sfx('block'); this.camPunch(0.012, 0, (Math.random() - 0.5) * 0.02); p.guard = (p.guard ?? 100) - (14 + dmg / Math.max(1, this.st.maxHp) * 160);
      if (p.guard <= 0) { p.guard = 0; p.gbreakT = 1.1; this.vm.guardBreak(); audio.sfx('guardbreak'); this.ui.banner('GUARD BREAK!', 'Staggered'); this.camPunch(0.05, 4, 0.04); d = dmg * this.st.def * 0.6; p.stagger = 0.6; } else this.ui.toast('Blocked!', 'blk'); } } else if (from) audio.sfx('hurt');
    d = Math.round(d); this.save.hp -= d; p.hurtT = 0.35; this.fx.shake = Math.min(1, this.fx.shake + 0.25); this.ui.hurt();
    if (from && o.kb) { // own vector (never alias the shared tmp scratch vector), capped, and replaces rather than stacks
      const k = new B.Vector3(p.pos.x - from.x, 0, p.pos.z - from.z); if (k.lengthSq() < 1e-6) this.fwdFlat(k).multiplyScalar(-1); k.normalize();
      const cap = this.cut ? 0 : (o.boss || o.kb >= 8 ? 10 : 4.5); p.kb = k.multiplyScalar(Math.min(o.kb, cap)); }
    if (this.save.hp <= 0) this.die();
    this.ui.updateHud();
  }
  die() {
    this.dead = true; this.save.hp = 0; this.save.stats.deaths++; this.ui.banner('YOU WERE DEFEATED', 'Respawning…');
    setTimeout(() => { this.dead = false; this.save.hp = this.st.maxHp; const sp = this.island.spawn; this.p.pos.set(sp[0], this.groundAt(sp[0], sp[1]), sp[1]); this.p.vy = 0; this.bossMem = {}; for (const e of this.enemies) { e.aggro = false; e.state = 'idle'; if (e.boss && !e.dead) { e.hp = e.max; e.phase2 = false; const R = e.c.root; R.position.set(e.home.x, this.island.hf(e.home.x, e.home.z), e.home.z); } } this.ui.bossBar(null); this.bossIntroDone = {}; this.ui.updateHud(); }, 2200);
  }
  enemiesInCone(range, cosA, from = this.p.pos) {
    const out = []; this.fwdFlat(tmp);
    for (const e of this.enemies) { if (e.dead) continue; tmp2.copy(e.c.root.position).sub(from); const dy = tmp2.y; tmp2.y = 0; const d = tmp2.length(); const r = range + (e.boss ? 0.6 : 0);
      if (d > r || Math.abs(dy) > 3) continue; if (d > 0.8 && tmp2.normalize().dot(tmp) < cosA) continue; out.push(e); }
    return out;
  }
  enemiesInRadius(c, r) { return this.enemies.filter(e => !e.dead && e.c.root.position.distanceTo(c) < r + (e.boss ? 0.8 : 0)); }
  rayEnemy(o, dir, range, rad = 0.7) {
    let best = null, bd = range;
    for (const e of this.enemies) { if (e.dead) continue; const c = this.chest(e, V()); const to = c.sub(o); const t = to.dot(dir); if (t < 0 || t > bd) continue; const perp = to.addScaledVector(dir, -t).length(); if (perp < rad * (e.boss ? 1.6 : 1)) { bd = t; best = e; } }
    return best ? { e: best, d: bd } : null;
  }
  projectile(o) { // {pos, vel, r, dmg, life, player, col, size, onHit, aoe, mesh}
    const m = o.mesh || new B.Mesh(this.fx.sphGeo, new B.MeshBasicMaterial({ color: o.col || 0xffffff }));
    if (!o.mesh) m.scale.setScalar(o.size || 0.2); m.position.copy(o.pos); this.scene.add(m);
    this.projs.push({ ...o, mesh: m, age: 0, hit: new Set() });
  }
  // ---------------- player actions ----------------
  camPunch(p = 0.02, f = 3, r = 0) { const k = this.kick || (this.kick = { p: 0, f: 0, r: 0 }); k.p = Math.max(k.p, p); k.f = Math.max(k.f, f); k.r = r || k.r; }
  speedLines(k = 1) { const el = document.getElementById('speedlines'); if (!el) return; el.style.setProperty('--k', k); el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
  slashFx(col, side = 1, big = false) { const cam = this.cam; const fw = this.fwd(V()); const right = new B.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), up = new B.Vector3(0, 1, 0).applyQuaternion(cam.quaternion); const tilt = side * (0.35 + Math.random() * 0.25);
    const r2 = right.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(up, Math.sin(tilt)), u2 = up.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(right, -Math.sin(tilt)); if (side < 0) r2.multiplyScalar(-1);
    const c = this.eyePos().clone().addScaledVector(fw, 2.0).addScaledVector(u2, big ? -1.1 : -0.95); this.fx.slash(c, r2, u2, col, { r: big ? 1.55 : 1.25, w: big ? 0.42 : 0.3, a0: 2.75, a1: 0.35, dur: big ? 0.38 : 0.3, sweep: 0.4 }); }
  musicTheme() { const P = this.p.pos; let boss = false, near = false; for (const e of this.enemies) { if (e.dead || !e.aggro) continue; const d = e.c.root.position.distanceTo(P); if (e.boss && !e.ext && d < 45) boss = true; else if (d < 22) near = true; }
    if (boss) return 'boss'; if (near || (this.events && this.events.cur && ['seaking', 'buster', 'davy'].includes(this.events.cur.kind))) this._battleT = 5; if ((this._battleT = (this._battleT || 0) - 0.5) > 0) return 'battle'; return this.amb && this.amb.isNight() ? 'night' : 'island'; }
  factionMul() { const fr = ST.factionRank(this.save); return fr.marine ? { ber: 1, xp: 1 + fr.tier * 0.05 } : { ber: 1 + fr.tier * 0.05, xp: 1 }; }
  rankCheck() { const S = this.save; const fr = ST.factionRank(S); if (S.rankT == null) { S.rankT = fr.tier; return; } if (fr.tier > S.rankT) { S.rankT = fr.tier; const ber = 5000 * fr.tier * fr.tier; this.addBerries(ber); this.st = ST.stats(S); this.ui.banner(fr.marine ? 'PROMOTED!' : 'BOUNTY RAISED!', `${fr.title} · ${fr.perk} · +฿${ber.toLocaleString()}`); this.ui.updateHud(); ST.save(S); } }
  baseDmg() { return (7 + this.save.lvl * 1.3) * this.st.dmg * (this.fed && this.fed.t > 0 ? this.fed.mul : 1) * (hasRole(this.save, 'musician') ? 1.08 : 1); }
  attack() {
    const S = this.save, p = this.p; if (p.atkCd > 0) return;
    const slot = S.slot; this.net.fx('atk', 0);
    if (slot === 'fist' || slot === 'fruit') {
      p.combo = p.comboT > 0 ? (p.combo % 4) + 1 : 1; p.comboT = 0.8; p.atkCd = p.combo === 4 ? 0.42 : 0.26; this.vm.doPunch(); S.stats.punches++;
      if (slot === 'fruit') { fruitBasic(this, S.eq.fruit, p.combo); return; }
      const st = styleOf(S); const key = 'fs:' + st.id; const kickHit = st.kick && p.combo % 2 === 0; if (kickHit) this.vm.doKick(); const hits = this.enemiesInCone(kickHit ? 3.1 : 2.7, 0.45);
      const dmg = this.baseDmg() * st.pow * ST.mastMul(S, key) * (p.combo === 4 ? 1.8 : 1) * (S.race === 'Mink' ? 1.05 : 1) * (st.needsHaki && S.haki && S.haki.buso ? 1.1 : 1);
      const heavy = ['sumo', 'giant'].includes(st.id) ? 1.8 : 1; const col = st.id === 'brawler' && S.race === 'Mink' ? 0x9fe8ff : st.col;
      audio.sfx('whoosh', { vol: p.combo === 4 ? 1.2 : 0.7 }); if (st.id !== 'brawler') this.fx.burst(this.eyePos().clone().addScaledVector(this.fwd(tmp), 1.3).add(new B.Vector3(0, kickHit ? -0.7 : -0.2, 0)), 6, col, { speed: 3, size: 0.25, life: 0.3, grav: 0 }); if (kickHit) this.slashFx(col, this.vm.side, false);
      for (const e of hits) this.damageEnemy(e, dmg, { kb: (p.combo === 4 ? 7 : 2.5) * heavy, mast: key, mastName: st.name, col, cls: st.id === 'brawler' ? '' : 'fruit', el: st.el || elementFromColor(col), snd: p.combo === 4 || heavy > 1 ? 'heavy' : 'punch' });
      if (hits.length) { this.fx.shake = Math.min(1, this.fx.shake + 0.08); this.hitstop = p.combo === 4 ? 0.08 : 0.045; this.camPunch(p.combo === 4 ? 0.035 : 0.015, p.combo === 4 ? 5 : 2, (Math.random() - 0.5) * 0.02); if (p.combo === 4 || heavy > 1) this.speedLines(1); }
    } else if (slot === 'sword') {
      const sw = SWORDS[S.eq.sword]; p.atkCd = 0.42 / sw.spd; this.vm.doSwing(); const key = 'sw:' + S.eq.sword;
      const hits = this.enemiesInCone(3.3, 0.25); const dmg = swordDmg(S, S.eq.sword) * (1 + S.lvl * 0.06) * this.st.dmg * ST.mastMul(S, key) * (sw.santoryu ? 1.15 : 1);
      const scol = sw.aura || sw.col || 0xbfe0ff; this.vm.setTrailColor && this.vm.setTrailColor(scol === 0xb9b9b9 ? 0xbfe0ff : scol); this.slashFx(scol === 0xb9b9b9 ? 0xbfe0ff : scol, this.vm.side, sw.rar >= 4); audio.sfx('slash');
      for (const e of hits) this.damageEnemy(e, dmg, { kb: 3.5, mast: key, mastName: sw.name, col: 0xffffff, el: 'slash', snd: 'slashhit' });
      if (hits.length) { this.fx.shake += 0.1; this.hitstop = 0.06; this.vm.hitPause && this.vm.hitPause(0.07); this.camPunch(0.012, 2.5, this.vm.side * 0.015); }
    } else if (slot === 'gun') {
      const g = GUNS[S.eq.gun]; p.atkCd = g.cd; this.vm.doShoot(); const key = 'gn:' + S.eq.gun;
      const o = this.eyePos().clone(); const d = this.fwd(V()); const r = this.rayEnemy(o, d, g.range);
      const end = o.clone().addScaledVector(d, r ? r.d : g.range); const muzzle = o.clone().addScaledVector(d, 0.6).add(new B.Vector3(0, -0.15, 0));
      this.fx.beam(muzzle, end, 0xffe6a0, 0.07, 0.1); this.fx.beam(muzzle, end, 0xffffff, 0.025, 0.06); this.fx.orb(muzzle, 0xffd070, 0.22, 0.06); this.fx.sparks(muzzle, 8, 0xffc060, { speed: 10, dir: d, up: 0, life: 0.12, grav: 0 }); this.fx.burst(muzzle, 5, 0x9a9a9a, { speed: 1.5, up: 1, size: 0.35, life: 0.6, grav: -1 }); this.fx.shake += 0.06; audio.sfx('gun'); this.camPunch(0.03, 1.5, (Math.random() - 0.5) * 0.015);
      if (r) this.damageEnemy(r.e, g.dmg * (1 + S.lvl * 0.06) * this.st.dmg * ST.mastMul(S, key), { kb: 2, mast: key, mastName: g.name, el: 'phys', snd: 'punch' }); else this.fx.sparks(end, 6, 0xffe0a0, { speed: 5 });
    }
  }
  seaDrain() { return !!(this.p.swim && this.save.eq.fruit); }
  move(i) {
    if (this.seaDrain() && this.save.slot === 'fruit') { this.ui.toast('🌊 The sea drains your Devil Fruit power!', 'blk'); return; }
    const S = this.save, p = this.p; const list = this.ui.currentMoves(); const m = list[i]; if (!m) return;
    if (m.lock) { this.ui.toast(m.lock, 'blk'); return; }
    if (this.enemies.some(e => !e.dead && e.aggro && e.c.root.position.distanceTo(this.p.pos) < 25)) this.questEvent('move');
    const cdKey = m.id; if ((p.cds[cdKey] || 0) > 0) return;
    p.cds[cdKey] = m.cd; p.cdMax = p.cdMax || {}; p.cdMax[cdKey] = m.cd;
    castMove(this, m); const fc = S.eq.fruit && FRUITS[S.eq.fruit]; this.net.fx('move', fc && m.src === 'fruit' ? fc.col[0] : 0xffffff, this.p.pos.clone().setY(this.p.pos.y + 1));
  }
  specialWindow() { const p = this.p, S = this.save; if (this.enemies.some(e => e.boss && !e.dead && e.aggro && e.c.root.position.distanceTo(p.pos) < 40)) return 'boss';
    if (S.hp < this.st.maxHp * 0.35) return 'clutch'; if (this.enemies.filter(e => !e.dead && e.c.root.position.distanceTo(p.pos) < 15).length >= 3) return 'crowd'; return null; }
  special() {
    if (this.seaDrain()) { this.ui.toast('🌊 The sea drains your Devil Fruit power!', 'blk'); return; }
    const S = this.save; const f = S.eq.fruit && FRUITS[S.eq.fruit];
    if (!f || !f.special) { this.ui.toast('Only Legendary+ fruits have a Special', 'blk'); return; }
    if (S.slot !== 'fruit') { this.ui.toast('Switch to your fruit to use its Special', 'blk'); return; }
    { const need = SP_REQ[f.rar] || 50, have = ST.mastery(S, 'fr:' + S.eq.fruit).lvl; if (have < need) { this.ui.toast(`🔒 ${f.special.name} needs ${f.short} mastery ${need} (you have ${have})`, 'blk'); return; } }
    if (this.p.special < 100) { this.ui.toast('Special gauge not full - deal damage to charge it!', 'blk'); return; }
    const why = this.specialWindow(); if (!why) { this.ui.toast('Specials only work at special times: in a BOSS fight, below 35% HP, or with 3+ enemies around you', 'blk'); return; }
    this.p.special = 0; S.stats.specials = (S.stats.specials || 0) + 1; castSpecial(this, f.special);
  }
  // ---------------- interact ----------------
  nearestNpc() { let b = null, bd = this.table ? 3.4 : 3.2; for (const n of this.npcs) { const d = n.c.root.position.distanceTo(this.p.pos); if (d < bd) { bd = d; b = n; } } for (const o of this.fakes || []) { const d = o.c.root.position.distanceTo(this.p.pos); if (d < bd) { bd = d; b = { name: o.f.name, role: 'player', fake: o.f, c: o.c, sit: o.sit }; } } return b; }
  // ---------------- update ----------------
  update(dt) {
    if (!this.running) return;
    this.t += dt; const S = this.save, p = this.p;
    if (this.hitstop > 0) { this.hitstop -= dt; dt *= 0.15; }
    S.stats.time += dt;
    pollKeys();
    const ctl = !this.cut && !this.dead && !this.ui.modal;
    // look
    if (ctl) { const lx = clamp(IN.lookX, -0.4, 0.4), ly = clamp(IN.lookY, -0.4, 0.4); p.yaw -= lx; p.pitch = clamp(p.pitch - ly, -1.35, 1.35); if (!isFinite(p.yaw)) p.yaw = 0; if (!isFinite(p.pitch)) p.pitch = 0; p.yaw = ((p.yaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; }
    IN.lookX = IN.lookY = 0;
    // actions
    if (ctl) {
      if (consume('attack') || (IN.held.attack && p.atkCd <= 0)) this.attack();
      if (consume('jump')) { if (p.ground || p.swim) { p.vy = 7.6 * this.st.jump; p.ground = false; p.airJ = 0; } else if (styleOf(S).id === 'skywalk' || styleOf(S).id === 'rokushiki' || styleOf(S).id === 'rokuogan') { if ((p.airJ || 0) < (styleOf(S).id === 'skywalk' ? 2 : 1)) { p.airJ = (p.airJ || 0) + 1; p.vy = 7 * this.st.jump; this.fx.ring(p.pos.clone(), 0xcfefff, 2, 0.3); } } }
      if (consume('dash') && p.dashCd <= 0) { p.dash = 0.2; p.dashCd = 0.85; p.iframe = 0.25; const mv = this.moveVec(); p.dashDir.copy(mv.lengthSq() > 0.01 ? mv.normalize() : this.fwdFlat(V())); this.fx.burst(p.pos.clone().setY(p.pos.y + 0.3), 10, 0xffffff, { speed: 2, size: 0.3, life: 0.3, grav: 0 }); }
      for (let i = 0; i < 4; i++) if (consume('m' + (i + 1))) this.move(i);
      if (consume('special')) this.special();
      if (consume('swap')) this.ui.cycleSlot();
      if (consume('interact')) { const n = this.nearestNpc(); if (this.hunt.near && !n) this.hunt.pickup(); else if (n) this.ui.talk(n); else if (this.fishing.nearWater()) this.fishing.press(); }
      if (consume('fish')) this.fishing.press();
      if (this.fishing.state === 'bite' && (IN.pressed.has('attack') || IN.pressed.has('interact'))) { IN.pressed.delete('attack'); IN.pressed.delete('interact'); this.fishing.press(); }
      if (consume('haki')) hakiToggle(this);
      if (consume('cam')) this.tpv.toggle();
      if (consume('tf')) this.transform();
      if (S.tf && (S.slot !== 'fruit' || !ZOAN[S.eq.fruit] || (this.seaDrain && this.seaDrain()))) this.transform(0);
      if (consume('conq')) conqueror(this);
    } else { IN.pressed.delete('attack'); IN.pressed.delete('jump'); }
    if (consume('inv') && !this.cut) this.ui.toggle('inv');
    if (consume('map') && !this.cut) this.ui.toggle('map');
    if (consume('pause') && !this.cut) this.ui.toggle('pause');
    // timers
    p.atkCd -= dt; p.comboT -= dt; p.dashCd -= dt; p.iframe -= dt; p.hurtT -= dt;
    for (const k in p.cds) p.cds[k] = Math.max(0, p.cds[k] - dt);
    // movement
    const mv = ctl ? this.moveVec() : V(); let speed = this.st.spd * (IN.held.block ? 0.45 : 1) * (p.gbreakT > 0 ? 0.4 : 1) * (p.swim ? (S.eq.fruit ? 0.35 : S.race === 'Fish-Man' ? 1.3 : 0.6) : 1);
    let vx = mv.x * speed, vz = mv.z * speed;
    if (p.dash > 0) { p.dash -= dt; vx = p.dashDir.x * 24; vz = p.dashDir.z * 24; }
    if (p.kb) { vx += p.kb.x; vz += p.kb.z; p.kb.multiplyScalar(Math.exp(-dt * 8)); if (p.kb.lengthSq() < 0.01) p.kb = null; }
    if (p.lunge) { vx += p.lunge.x; vz += p.lunge.z; p.lunge.multiplyScalar(Math.exp(-dt * 10)); if (p.lunge.lengthSq() < 0.05) p.lunge = null; }
    { const md = (p.dash > 0 ? 1.4 : 0.9), dd = Math.hypot(vx, vz) * dt; if (dd > md) { vx *= md / dd; vz *= md / dd; } } // clamp per-frame displacement
    if (!isFinite(vx) || !isFinite(vz)) { vx = vz = 0; p.kb = null; p.lunge = null; }
    p.pos.x += vx * dt; p.pos.z += vz * dt;
    this.collide(p.pos, 0.4);
    if (this.seat) { p.pos.x = this.seat.x; p.pos.z = this.seat.z; vx = vz = 0; }
    const r = Math.hypot(p.pos.x, p.pos.z); const lim = this.island.R + 18; if (r > lim) { p.pos.x *= lim / r; p.pos.z *= lim / r; }
    p.vy -= 22 * dt; p.pos.y += p.vy * dt;
    const gh = this.groundAt(p.pos.x, p.pos.z); const wl = -0.95;
    p.swim = gh < wl - 0.3 && p.pos.y <= wl + 0.05;
    // never trapped at sea: track time in water, offer 'Return to shore', auto-rescue if far out / under terrain / NaN
    if (!isFinite(p.pos.x) || !isFinite(p.pos.z) || !isFinite(p.pos.y)) { p.pos.set(0, 0, this.island.R * 0.5); p.vy = 0; this.toShore(true); }
    if (p.swim) p.swimT = (p.swimT || 0) + dt; else p.swimT = 0;
    if (p.pos.y < gh - 1.2) { p.pos.y = gh; p.vy = 0; }
    if (p.swimT > 0 && (Math.hypot(p.pos.x, p.pos.z) > this.island.R + 14 || p.swimT > 40)) this.toShore(true);
    document.body.classList.toggle('canShore', p.swimT > 3.5 && !this.cut);
    if (p.pos.y <= gh) { p.pos.y = gh; p.vy = 0; p.ground = true; } else if (gh < wl && p.pos.y < wl) { p.pos.y = wl; p.vy = Math.max(p.vy, 0); p.swim = true; p.ground = false; } else p.ground = p.pos.y - gh < 0.05;
    p.moving = mv.lengthSq() > 0.01 && p.ground; if (p.moving) p.phase += dt * speed * 1.7;
    // Devil Fruit users in the sea: no sinking, but weakened, slowed, powers off and slowly drained of HP
    const drain = this.seaDrain(); document.body.classList.toggle('seadrain', drain);
    if (drain && !this.dead && !this.cut) { if (!this._drainWarn) { this._drainWarn = true; this.ui.toast('🌊 Devil Fruit user in the sea! You\'re weakened — get out of the water!', 'blk'); }
      S.hp -= this.st.maxHp * 0.04 * dt; p.hurtT = 0; if (Math.random() < dt * 8) this.fx.burst(p.pos.clone().add(new B.Vector3((Math.random() - 0.5) * 1.2, -0.6, (Math.random() - 0.5) * 1.2)), 2, 0xcfefff, { speed: 0.6, up: 2.2, size: 0.12, life: 0.9, grav: -1 });
      if (S.hp <= 0) { S.hp = 0; this.die ? this.die() : this.hurtPlayer(1, null); } this.ui.updateHud(); }
    else this._drainWarn = false;
    // regen
    if ((p.hurtT < -4) && S.hp < this.st.maxHp && !this.dead) { S.hp = Math.min(this.st.maxHp, S.hp + this.st.maxHp * 0.03 * dt); }
    // camera
    const shake = this.fx.shake * this.fx.shake * 0.25;
    if (!this.cut) {
      const bob = p.moving ? Math.sin(p.phase) * 0.05 : 0;
      this.cam.position.set(p.pos.x + (Math.random() - 0.5) * shake, p.pos.y + this.st.eye + bob + (p.swim ? -0.2 : 0) - (this.seat ? 0.55 * (this.st.eye / 1.6) : 0) + (Math.random() - 0.5) * shake, p.pos.z);
      const ck = this.kick || { p: 0, r: 0, f: 0 }; this.cam.rotation.order = 'YXZ'; this.cam.rotation.set(p.pitch + ck.p, p.yaw, ck.r); this.cam.up.set(0, 1, 0);
      if (this.kick) { const k = this.kick; k.p *= Math.exp(-dt * 14); k.r *= Math.exp(-dt * 10); k.f *= Math.exp(-dt * 9); }
      const tf = (p.dash > 0 ? 86 : 72) - (this.kick ? this.kick.f : 0); if (Math.abs(this.cam.fov - tf) > 0.1) { this.cam.fov = damp(this.cam.fov, tf, 10, dt); this.cam.updateProjectionMatrix(); }
    } else this.cut.update(dt);
    if (this.preview) { if (this.tpv.body) this.tpv.body.root.visible = false; } else this.tpv.update(dt);
    this.net.update(dt);
    this.amb.update(dt); this.events.update(dt); this.crew.update(dt); this._rk = (this._rk || 0) - dt; if (this._rk <= 0) { this._rk = 2; this.rankCheck(); checkAch(this); } this._clk = (this._clk || 0) - dt; if (this._clk <= 0) { this._clk = 1; const ck = document.getElementById('clock'); if (ck) { const nt = this.amb.isNight(); ck.textContent = `${nt ? '🌙' : '☀️'} ${this.amb.clock()}${nt ? ' · Night +20% ฿/XP' : ''}${this.amb.stormT > 0 ? ' · ⛈ Storm' : ''}`; ck.classList.toggle('night', nt); } }
    if (this.fed && this.fed.t > 0) { this.fed.t -= dt; if (this.fed.t <= 0) { this.fed = null; this.ui.toast('Well Fed buff wore off', 'blk'); } }
    this.updateEnemies(dt); this.updateProjs(dt); this.questTick(dt); this.stockTick(); try { this.hunt.update(dt); } catch (err) { if (!this._hErr) { this._hErr = 1; console.warn('hunt', err); } } if (this.preview) { this.preview.root.rotation.y += Math.sin(this.t * 0.7) * dt * 0.4; animChar(this.preview, { move: 0, wave: Math.sin(this.t * 0.5) > 0.7 }, this.t); } this.updateNpcs(dt); this.fishing.update(dt); fakeUpdate(this, dt);
    for (const u of this.island.updaters) u(dt);
    if (this.island.boat) this.island.boat.position.y = -0.1 + Math.sin(this.t * 1.2) * 0.08;
    this.water.userData.mat.uniforms.t.value = this.t; this.water.position.set(Math.round(this.cam.position.x / 10) * 10, -1.0, Math.round(this.cam.position.z / 10) * 10);
    this.sky.position.copy(this.cam.position);
    this.fx.update(dt); this.nums.update(dt, this.cam);
    p.gbreakT = Math.max(0, (p.gbreakT || 0) - dt); const blk = IN.held.block && ctl && !(p.gbreakT > 0); if (!blk) p.guard = Math.min(100, (p.guard ?? 100) + dt * 30);
    { const gb = document.getElementById('guardBar'); if (gb) { const show = blk || p.gbreakT > 0 || (p.guard ?? 100) < 100; gb.style.opacity = show ? 1 : 0; gb.firstChild.style.width = (p.guard ?? 100) + '%'; gb.classList.toggle('broke', p.gbreakT > 0); } }
    this.vm.update(dt, { moving: p.moving, phase: p.phase, block: blk });
    this.updateBlobs(); this.updateBars();
    this.ui.frame(dt);
    this.saveT = (this.saveT || 0) + dt; if (this.saveT > 8) { this.saveT = 0; ST.save(S); }
  }
  moveVec() { const f = this.fwdFlat(V()); const r = new B.Vector3(-f.z, 0, f.x); const v = f.multiplyScalar(IN.mz).addScaledVector(r, IN.mx); if (v.lengthSq() > 1) v.normalize(); return v; }
  collide(pos, rad) {
    for (const c of this.island.colliders) {
      if (c.r !== undefined) { const dx = pos.x - c.x, dz = pos.z - c.z; const d = Math.hypot(dx, dz); const m = c.r + rad; if (d < m && d > 0.0001) { pos.x = c.x + dx / d * m; pos.z = c.z + dz / d * m; } }
      else { const cs = Math.cos(-c.rot), sn = Math.sin(-c.rot); let lx = (pos.x - c.x) * cs - (pos.z - c.z) * sn, lz = (pos.x - c.x) * sn + (pos.z - c.z) * cs;
        const hw = c.hw + rad, hd = c.hd + rad; if (Math.abs(lx) < hw && Math.abs(lz) < hd) { const px = hw - Math.abs(lx), pz = hd - Math.abs(lz); if (px < pz) lx = Math.sign(lx) * hw; else lz = Math.sign(lz) * hd;
          const cs2 = Math.cos(c.rot), sn2 = Math.sin(c.rot); pos.x = c.x + lx * cs2 - lz * sn2; pos.z = c.z + lx * sn2 + lz * cs2; } }
    }
  }
  updateEnemies(dt) {
    const p = this.p; const far = qv().far * 0.6; let bossActive = null;
    if (this.enemies.some(e => e.gone)) this.enemies = this.enemies.filter(e => !e.gone);
    for (const e of this.enemies) {
      const R = e.c.root; e.t += dt;
      if (e.ext) { e.ext(dt); continue; }
      if (e.temp && e.dead && e.deadT > 2.2) { this.scene.remove(R); e.gone = true; continue; }
      if (e.dead) { e.deadT += dt; animChar(e.c, { dead: e.deadT }, this.t); if (e.deadT > 1.6) R.visible = false;
        if (e.deadT > (e.boss ? 60 : 14)) { e.dead = false; e.hp = e.max; e.c.face && e.c.face.set(null); R.visible = true; R.rotation.x = 0; R.position.set(e.home.x, this.island.hf(e.home.x, e.home.z), e.home.z); e.state = 'idle'; e.aggro = false; e.phase2 = false; if (e.boss) this.bossIntroDone[e.s.type] = false; } continue; }
      const toP = tmp.copy(p.pos).sub(R.position); toP.y = 0; const dist = toP.length();
      R.visible = dist < far; if (dist > far && !e.aggro) continue;
      e.flash -= dt; e.hitT -= dt; e.cd -= dt; e.skillCd -= dt; if (e.kbPose > 0 || R.rotation.x) { e.kbPose = Math.max(0, (e.kbPose || 0) - dt * 3.5); const kp = e.kbPose; R.rotation.x = -kp * kp * (e.boss ? 0.12 : 0.45); }
      const def = e.def; let spd = def.spd * (e.phase2 ? 1.3 : 1); let moving = 0;
      if (this.cut || this.dead) { e.anim.move = 0; animChar(e.c, { ...e.anim, taunt: this.cut && this.cut.boss === e }, this.t); this.flashMat(e); continue; }
      // boss intro trigger
      if (e.boss && !this.bossIntroDone[e.s.type] && dist < e.s.arena.r + 4) { this.bossIntroDone[e.s.type] = true; this.bossIntro(e); continue; }
      if (e.boss && e.aggro) bossActive = e;
      const aggroR = e.boss ? e.s.arena.r + 2 : 13;
      if (!e.aggro && dist < aggroR && !this.dead) e.aggro = true;
      // Bosses never leash: once engaged they fight until someone dies. Grunts leash only if far AND untouched for a while; they heal slowly only once out of combat.
      if (e.aggro && !e.boss && dist > 40 && this.t - (e.lastHitT || -99) > 6) { e.aggro = false; e.state = 'idle'; e.calmT = 0; }
      if (!e.aggro && !e.boss && e.hp < e.max) { e.calmT = (e.calmT || 0) + dt; if (e.calmT > 5) e.hp = Math.min(e.max, e.hp + e.max * 0.08 * dt); }
      if (e.boss && !e.phase2 && e.hp < e.max * 0.5) { e.phase2 = true; this.ui.banner(`${def.name} is enraged!`, 'Phase 2'); this.fx.ring(R.position.clone().setY(R.position.y + 0.2), 0xff3a2a, 8, 0.8); }
      if (e.state === 'hit') { if (e.hitT <= 0) e.state = e.aggro ? 'chase' : 'idle'; }
      else if (e.state === 'windup') { e.atk -= dt; if (e.atk <= 0) this.enemyStrike(e, dist); }
      else if (e.state === 'skill') { e.atk -= dt; if (e.skillUpd) e.skillUpd(dt); if (e.atk <= 0) { e.state = 'chase'; e.skillUpd = null; } }
      else if (e.aggro) {
        e.state = 'chase'; const want = def.ranged ? 14 : Math.max(1.6, def.reach * 0.8);
        if (e.boss && e.skillCd <= 0 && dist < 16) { this.bossSkill(e, dist); }
        else if (dist > want) { moving = e.boss && dist > 12 ? 1.6 : 1; }
        else if (def.ranged && dist < 7) { moving = -1; }
        if (dist <= def.reach && e.cd <= 0) { e.state = 'windup'; e.atk = def.ranged ? 0.9 : (e.boss ? 0.5 : 0.55) / (e.phase2 ? 1.25 : 1); }
        if (def.ranged && dist < def.reach && e.cd <= 0 && e.state !== 'windup') { e.state = 'windup'; e.atk = 0.9; }
        e.yaw = Math.atan2(toP.x, toP.z);
      } else { // wander
        if (e.t > 3) { e.t = 0; e.wander.set(e.home.x + (Math.random() - 0.5) * 8, 0, e.home.z + (Math.random() - 0.5) * 8); }
        tmp2.copy(e.wander).sub(R.position).setY(0); if (tmp2.length() > 0.6) { moving = 0.45; e.yaw = Math.atan2(tmp2.x, tmp2.z); }
      }
      const ox = R.position.x, oz = R.position.z;
      if (moving) { const dir = new B.Vector3(Math.sin(e.yaw), 0, Math.cos(e.yaw)); R.position.addScaledVector(dir, spd * moving * dt); e.anim.phase += dt * spd * 2.2 * Math.abs(moving); }
      R.position.addScaledVector(e.vel, dt); e.vel.multiplyScalar(Math.exp(-dt * 6));
      if (e.vy) { R.userData.air = (R.userData.air || 0) + e.vy * dt; e.vy -= 20 * dt; if (R.userData.air <= 0) { R.userData.air = 0; e.vy = 0; } }
      this.collide(R.position, e.boss ? 0.8 : 0.45);
      for (const o of this.enemies) { if (o === e || o.dead) continue; const dx = R.position.x - o.c.root.position.x, dz = R.position.z - o.c.root.position.z; const d = Math.hypot(dx, dz); if (d < 1 && d > 0.001) { R.position.x += dx / d * (1 - d) * 0.5; R.position.z += dz / d * (1 - d) * 0.5; } }
      { const gNew = this.island.hf(R.position.x, R.position.z); if (gNew < 0.25 && gNew < this.island.hf(ox, oz)) { // don't walk/knock into the sea: slide along shore, else stay put
        if (this.island.hf(R.position.x, oz) >= 0.25) R.position.z = oz; else if (this.island.hf(ox, R.position.z) >= 0.25) R.position.x = ox; else { R.position.x = ox; R.position.z = oz; } e.vel.set(0, 0, 0); } }
      const md = e.boss ? 1.8 : 1.3; if (dist < md && dist > 0.001) { R.position.x -= toP.x / dist * (md - dist); R.position.z -= toP.z / dist * (md - dist); }
      R.position.y = Math.max(this.island.hf(R.position.x, R.position.z), -1.2) + (R.userData.air || 0);
      R.rotation.y = damp(R.rotation.y, R.rotation.y + angDiff(R.rotation.y, e.yaw), 10, dt);
      e.anim.move = Math.abs(moving) > 0 ? Math.min(1, Math.abs(moving) * 1.2) : 0; e.anim.windup = e.state === 'windup' && !def.ranged; e.anim.aim = e.state === 'windup' && def.ranged; e.anim.hit = e.state === 'hit' ? Math.max(0, e.hitT * 4) : 0;
      e.anim.attack = Math.max(0, (e.anim.attack || 0) - dt * 3);
      e.anim.angry = !!e.aggro && !e.boss; e.anim.angryFace = !!e.aggro; e.anim.idleV = true; e.anim.look = e.aggro || dist < 8 ? (this._eyeV || (this._eyeV = V())).copy(this.eyePos()) : null; animChar(e.c, e.anim, this.t); this.flashMat(e);
    }
    if (bossActive) this.ui.bossBar(bossActive); else if (this.ui.bossShown && !this.enemies.some(e => e.boss && e.aggro && !e.dead)) this.ui.bossBar(null);
  }
  flashMat(e) { const m = e.c.material; if (e.flash > 0) { m.emissive.setHex(0xffffff); m.emissiveIntensity = 0.9; } else if (e.state === 'windup' || e.state === 'skill') { m.emissive.setHex(0xff2010); m.emissiveIntensity = 0.35 + Math.sin(this.t * 30) * 0.25; } else { m.emissiveIntensity = 0; } }
  enemyStrike(e, dist) {
    const def = e.def; e.state = 'chase'; e.cd = def.cd * (0.8 + Math.random() * 0.5) / (e.phase2 ? 1.3 : 1); e.anim.attack = 1;
    const lvlMul = 1 + (e.lvl - 1) * 0.1; const dmg = def.dmg * lvlMul;
    if (def.ranged) { const o = this.chest(e, V()); const d = this.eyePos().clone().add(new B.Vector3(0, -0.4, 0)).sub(o).normalize(); this.projectile({ pos: o, vel: d.multiplyScalar(26), r: 0.6, dmg, life: 2, player: false, col: 0xffe080, size: 0.1 }); this.fx.burst(o, 5, 0xffb040, { speed: 2, size: 0.2, life: 0.2, grav: 0 }); return; }
    if (dist <= def.reach + 0.4) this.hurtPlayer(dmg, e.c.root.position, { kb: e.boss ? 6 : 3 });
    if (e.boss) this.fx.burst(this.chest(e, V()), 8, 0xffffff, { speed: 4, size: 0.3, life: 0.3 });
  }
  bossSkill(e, dist) {
    const R = e.c.root, def = e.def; e.skillCd = (e.phase2 ? 4 : 6) + Math.random() * 2; e.state = 'skill';
    const pick = Math.random();
    if (def.skills) { const sk = def.skills[Math.floor(Math.random() * def.skills.length)]; this.genSkill(e, sk[0], sk[1], sk[2], dist); return; }
    if (e.s.type === 'higuma') {
      if (pick < 0.5 && dist > 4) { // lunge slash
        e.atk = 0.9; let t = 0; const dir = new B.Vector3(this.p.pos.x - R.position.x, 0, this.p.pos.z - R.position.z).normalize(); this.ui.toast('Higuma: "Bandit Rush!"', 'boss'); let hit = false;
        e.skillUpd = (dt) => { t += dt; if (t > 0.35 && t < 0.75) { R.position.addScaledVector(dir, 20 * dt); this.fx.burst(this.chest(e, V()), 2, 0xcccccc, { speed: 1, size: 0.3, life: 0.3, grav: 0 }); if (!hit && R.position.distanceTo(this.p.pos) < 2.2) { hit = true; this.hurtPlayer(def.dmg * 1.8, R.position, { kb: 8 }); } } };
      } else { // knife fan
        e.atk = 0.8; this.ui.toast('Higuma throws knives!', 'boss'); let fired = false;
        e.skillUpd = () => { if (!fired && e.atk < 0.4) { fired = true; e.anim.attack = 1; const o = this.chest(e, V()); const base = Math.atan2(this.p.pos.x - o.x, this.p.pos.z - o.z);
          for (let i = -2; i <= 2; i++) { const a = base + i * 0.16; const m = new B.Mesh(new B.BoxGeometry(0.06, 0.06, 0.5), new B.MeshBasicMaterial({ color: 0xdfe6ee })); m.rotation.y = a; this.projectile({ pos: o, vel: new B.Vector3(Math.sin(a), -0.03, Math.cos(a)).multiplyScalar(17), r: 0.7, dmg: def.dmg * 0.9, life: 2, player: false, mesh: m }); } } };
      }
    } else if (e.s.type === 'morgan') {
      if (pick < 0.45) { // axe slam shockwave
        e.atk = 1.2; this.ui.toast('Morgan: "AXE SLAM!"', 'boss'); let slam = false;
        const ring = this.fx.ring(R.position.clone().setY(R.position.y + 0.15), 0xff3020, 0.01, 1.0, true, 0.6); ring.scale.setScalar(7);
        e.skillUpd = () => { e.anim.windup = true; if (!slam && e.atk < 0.35) { slam = true; e.anim.attack = 1; this.fx.shake = 0.8; this.fx.ring(R.position.clone().setY(R.position.y + 0.2), 0xffffff, 8, 0.5); this.fx.burst(R.position.clone().setY(R.position.y + 0.3), 40, 0xc9a87a, { speed: 9, up: 4, size: 0.5, life: 0.8 });
          if (R.position.distanceTo(this.p.pos) < 7.5 && this.p.ground) this.hurtPlayer(def.dmg * 1.6, R.position, { kb: 10 }); else if (!this.p.ground) this.ui.toast('Jumped over the shockwave!', 'blk'); } };
      } else { // spin
        e.atk = 2.2; this.ui.toast('Morgan: "Axe Whirlwind!"', 'boss'); let tick = 0;
        e.skillUpd = (dt) => { R.rotation.y += dt * 18; tick -= dt; const dir = tmp2.copy(this.p.pos).sub(R.position).setY(0).normalize(); R.position.addScaledVector(dir, 3.2 * dt); this.fx.burst(this.chest(e, V()), 3, 0xdfe6ee, { speed: 6, size: 0.25, life: 0.25, grav: 0, spread: 2 });
          if (tick <= 0 && R.position.distanceTo(this.p.pos) < 3.6) { tick = 0.45; this.hurtPlayer(def.dmg * 0.6, R.position, { kb: 6 }); } };
      }
    }
  }
  genSkill(e, type, name, col, dist) {
    const R = e.c.root, def = e.def; const D = def.dmg * (1 + (e.lvl - 1) * 0.1); this.ui.toast(`${def.name}: "${name}!"`, 'boss'); this.ui.moveName(name, col);
    const P = this.p; let t = 0;
    if (type === 'lunge') { e.atk = 0.95; const dir = new B.Vector3(P.pos.x - R.position.x, 0, P.pos.z - R.position.z).normalize(); let hit = false;
      e.skillUpd = (dt) => { t += dt; if (t > 0.4 && t < 0.8) { R.position.addScaledVector(dir, 24 * dt); this.fx.burst(this.chest(e, V()), 3, col, { speed: 1, size: 0.5, life: 0.3, grav: 0 }); if (!hit && R.position.distanceTo(P.pos) < 2.4) { hit = true; this.hurtPlayer(D * 1.8, R.position, { kb: 9 }); } } }; }
    else if (type === 'fan') { e.atk = 1.0; let fired = 0;
      e.skillUpd = () => { if (fired < 3 && e.atk < 0.6 - fired * 0.18) { fired++; e.anim.attack = 1; const o = this.chest(e, V()); const base = Math.atan2(P.pos.x - o.x, P.pos.z - o.z);
        for (let i = -2; i <= 2; i++) { const a = base + i * 0.14 + (fired - 2) * 0.05; const m = new B.Mesh(this.fx.sphGeo, new B.MeshBasicMaterial({ color: col, transparent: true, blending: B.AdditiveBlending, depthWrite: false })); m.scale.setScalar(0.32); this.projectile({ pos: o, vel: new B.Vector3(Math.sin(a), -0.02, Math.cos(a)).multiplyScalar(18), r: 0.7, dmg: D * 0.7, life: 2.2, player: false, mesh: m, onTick: (pr) => Math.random() < 0.3 && this.fx.burst(pr.mesh.position, 1, col, { speed: 0.5, size: 0.4, life: 0.3, grav: 0 }) }); } } }; }
    else if (type === 'slam') { e.atk = 1.25; let slam = false; const ring = this.fx.ring(R.position.clone().setY(R.position.y + 0.15), col, 0.01, 1.0, true, 0.6); ring.scale.setScalar(8);
      e.skillUpd = () => { e.anim.windup = true; if (!slam && e.atk < 0.35) { slam = true; e.anim.attack = 1; this.fx.shake = 0.8; this.fx.ring(R.position.clone().setY(R.position.y + 0.2), col, 9, 0.5); this.fx.burst(R.position.clone().setY(R.position.y + 0.3), 40, col, { speed: 10, up: 4, size: 0.6, life: 0.8 });
        if (R.position.distanceTo(P.pos) < 8.5 && P.ground) this.hurtPlayer(D * 1.7, R.position, { kb: 10 }); else if (!P.ground && R.position.distanceTo(P.pos) < 8.5) this.ui.toast('Jumped over it!', 'blk'); } }; }
    else if (type === 'spin') { e.atk = 2.2; let tick = 0;
      e.skillUpd = (dt) => { R.rotation.y += dt * 18; tick -= dt; const dir = tmp2.copy(P.pos).sub(R.position).setY(0).normalize(); R.position.addScaledVector(dir, 3.4 * dt); this.fx.burst(this.chest(e, V()), 3, col, { speed: 6, size: 0.3, life: 0.25, grav: 0, spread: 2.5 });
        if (tick <= 0 && R.position.distanceTo(P.pos) < 3.8) { tick = 0.45; this.hurtPlayer(D * 0.6, R.position, { kb: 6 }); } }; }
    else if (type === 'beam') { e.atk = 1.5; const o = this.chest(e, V()); const tgt = P.pos.clone().setY(P.pos.y + 1); const dir = tgt.clone().sub(o).normalize(); const end = o.clone().addScaledVector(dir, 40); let fired = false;
      const warn = this.fx.beam(o, end, col, 0.12, 1.0);
      e.skillUpd = () => { if (!fired && e.atk < 0.45) { fired = true; e.anim.attack = 1; this.fx.beam(o, end, col, 1.6, 0.5); this.fx.beam(o, end, 0xffffff, 0.6, 0.4); this.fx.shake = 0.5;
        const to = P.pos.clone().setY(P.pos.y + 1).sub(o); const tt = to.dot(dir); if (tt > 0 && to.addScaledVector(dir, -tt).length() < 1.8) this.hurtPlayer(D * 2, o, { kb: 8 }); } }; }
    else if (type === 'rain') { e.atk = 2.0; const spots = []; for (let i = 0; i < 7; i++) { const a = Math.random() * Math.PI * 2, rr = i === 0 ? 0 : 2 + Math.random() * 7; const c = P.pos.clone().add(new B.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr)); c.y = this.groundAt(c.x, c.z) + 0.15; spots.push(c); const rg = this.fx.ring(c, col, 0.01, 1.1, true, 0.7); rg.scale.setScalar(2.6); }
      let fired = false; e.skillUpd = () => { if (!fired && e.atk < 0.8) { fired = true; for (const c of spots) { this.fx.pillar(c, col, 1.3, 20, 0.6); this.fx.burst(c, 10, col, { speed: 6, size: 0.5, life: 0.5 }); if (c.distanceTo(P.pos) < 2.8) this.hurtPlayer(D * 1.3, c, { kb: 4 }); } this.fx.shake = 0.5; } }; }
    else if (type === 'blink') { e.atk = 1.0; let done = false; this.fx.burst(this.chest(e, V()), 25, col, { speed: 5, size: 0.5, life: 0.4 });
      e.skillUpd = () => { if (!done && e.atk < 0.7) { done = true; const f = this.fwdFlat(V()); R.position.copy(P.pos).addScaledVector(f, -2.2); R.position.y = this.groundAt(R.position.x, R.position.z); e.yaw = Math.atan2(P.pos.x - R.position.x, P.pos.z - R.position.z); R.rotation.y = e.yaw; this.fx.burst(this.chest(e, V()), 25, col, { speed: 5, size: 0.5, life: 0.4 }); this.ui.toast('Behind you!', 'boss'); }
        if (done && e.atk < 0.25 && !e._bl) { e._bl = true; e.anim.attack = 1; if (R.position.distanceTo(P.pos) < 3.2) this.hurtPlayer(D * 1.5, R.position, { kb: 8 }); }
        if (e.atk < 0.05) e._bl = false; }; }
  }
  bossIntro(e) {
    const R = e.c.root; const def = e.def; const p = this.p;
    const startPos = this.cam.position.clone(); const startQ = this.cam.quaternion.clone();
    const head = R.position.clone().setY(R.position.y + e.c.height * 0.85);
    const dirToP = new B.Vector3(p.pos.x - R.position.x, 0, p.pos.z - R.position.z).normalize();
    const port = this.cam.aspect < 1; const camEnd = head.clone().addScaledVector(dirToP, (port ? 5.2 : 3.6) * (def.scale || 1)).add(new B.Vector3(port ? 0.1 : 0.8, -0.2, 0));
    const look = new B.PerspectiveCamera(); R.rotation.y = Math.atan2(dirToP.x, dirToP.z); e.yaw = R.rotation.y;
    let t = 0; const D = 4.6; this.ui.bossCard(def, e.lvl); this.ui.letterbox(true);
    this.cut = { boss: e, update: (dt) => { t += dt; const k = smooth(Math.min(1, t / 1.1)), k2 = smooth(clamp((t - (D - 0.8)) / 0.8, 0, 1));
      const pos = startPos.clone().lerp(camEnd, k).lerp(startPos, k2); this.cam.position.copy(pos); look.position.copy(pos); look.lookAt(head); const q = startQ.clone().slerp(look.quaternion, k).slerp(startQ, k2); this.cam.quaternion.copy(q);
      if (t > 1.2 && t < 1.3) { this.fx.ring(R.position.clone().setY(R.position.y + 0.2), 0xff4020, 9, 0.8); this.fx.shake = 0.5; this.fx.burst(head, 30, 0xff6030, { speed: 6, size: 0.4, life: 0.8 }); }
      if (t > 1.3 && Math.random() < 0.3) this.fx.burst(R.position.clone().setY(R.position.y + 0.3), 3, 0xff5020, { speed: 2, up: 4, size: 0.4, life: 0.6, grav: -2, spread: 2 });
      if (t >= D) { this.cut = null; this.ui.letterbox(false); this.ui.bossCard(null); e.aggro = true; e.cd = 1; e.skillCd = 3; this.cam.rotation.order = 'YXZ'; } } };
  }
  updateProjs(dt) {
    for (let i = this.projs.length - 1; i >= 0; i--) {
      const pr = this.projs[i]; pr.age += dt; pr.mesh.position.addScaledVector(pr.vel, dt); if (pr.grav) pr.vel.y -= pr.grav * dt; if (pr.onTick) pr.onTick(pr, dt);
      const pos = pr.mesh.position; let done = pr.age > pr.life;
      if (pr.player) { for (const e of this.enemies) { if (e.dead || pr.hit.has(e)) continue; if (this.chest(e, tmp).distanceTo(pos) < pr.r + (e.boss ? 0.8 : 0.3)) { pr.hit.add(e); if (pr.onHit) pr.onHit(pr, e); else this.damageEnemy(e, pr.dmg, { kb: pr.kb ?? 3, from: pos, mast: pr.mast, col: pr.col }); if (!pr.pierce) { done = true; break; } } } }
      else if (this.eyePos().distanceTo(pos) < pr.r + 0.3 || tmp.copy(this.p.pos).setY(this.p.pos.y + 0.9).distanceTo(pos) < pr.r + 0.2) { this.hurtPlayer(pr.dmg, pos.clone().sub(pr.vel), { kb: 2 }); done = true; }
      if (!done && pos.y < this.island.hf(pos.x, pos.z)) done = true;
      if (done) { if (pr.onEnd) pr.onEnd(pr); this.scene.remove(pr.mesh); this.projs.splice(i, 1); }
    }
  }
  updateNpcs(dt) {
    this.folk && this.folk.update(dt);
    const near = this.nearestNpc(); if (!near && this.hunt.near && !this.cut) this.ui.promptFruit(this.hunt.obj && this.hunt.obj.fruit); else this.ui.prompt(near && !this.cut ? `${near.name}` : null);
    for (const n of this.npcs) { const d = n.c.root.position.distanceTo(this.p.pos); if (d < 6) { const want = Math.atan2(this.p.pos.x - n.c.root.position.x, this.p.pos.z - n.c.root.position.z); n.c.root.rotation.y = damp(n.c.root.rotation.y, n.c.root.rotation.y + angDiff(n.c.root.rotation.y, want), 4, dt); }
      animChar(n.c, { talk: d < 4 && !!this.ui.modal, happy: d < 7 && !this.ui.modal, move: 0, look: d < 8 ? this.eyePos() : null }, this.t + n.x); if (n.mark) { n.mark.rotation.y += dt * 2; n.mark.position.y = n.c.root.position.y + n.c.height + 0.6 + Math.sin(this.t * 3) * 0.1;
        if (n.role === 'quest') { const q = this.questFor(n); n.mark.visible = !!q && !this.save.quest; } } }
  }
  questFor(n) { const list = QUESTS[this.island.id] || []; const S = this.save; return list.find(q => q.giver === n.name && !S.qdone.includes(q.id) && S.lvl >= (q.lvl || 0)) || list.find(q => q.giver === n.name && !S.qdone.includes(q.id)); }
  updateBlobs() {
    const m = new B.Matrix4(); let k = 0; const q = new B.Quaternion().setFromEuler(new B.Euler(-Math.PI / 2, 0, 0));
    for (const e of this.enemies) { if (!e.c.root.visible || k >= 63) continue; const P = e.c.root.position; const s = (e.boss ? 2.2 : 1.3); m.compose(new B.Vector3(P.x, this.island.hf(P.x, P.z) + 0.05, P.z), q, new B.Vector3(s, s, s)); this.blobs.setMatrixAt(k++, m); }
    for (const n of this.npcs) { if (k >= 63) break; const P = n.c.root.position; m.compose(new B.Vector3(P.x, P.y + 0.05, P.z), q, new B.Vector3(1.2, 1.2, 1.2)); this.blobs.setMatrixAt(k++, m); }
    this.blobs.count = k; this.blobs.instanceMatrix.needsUpdate = true;
  }
  updateBars() {
    if (!this.barPool) this.barPool = [];
    const list = this.enemies.filter(e => !e.dead && !e.boss && e.c.root.visible && e.c.root.position.distanceTo(this.p.pos) < (this.save.haki && this.save.haki.ken ? 45 : 24)).sort((a, b) => a.c.root.position.distanceTo(this.p.pos) - b.c.root.position.distanceTo(this.p.pos)).slice(0, 8);
    while (this.barPool.length < list.length) { const d = document.createElement('div'); d.className = 'ebar'; d.innerHTML = '<span></span><i><b></b></i>'; this.bars.appendChild(d); this.barPool.push(d); }
    const v = V();
    this.barPool.forEach((d, i) => { const e = list[i]; if (!e || this.cut) { d.style.display = 'none'; return; }
      v.copy(e.c.root.position); v.y += e.c.height + 0.35; v.project(this.cam); if (v.z > 1) { d.style.display = 'none'; return; }
      d.style.display = 'block'; d.style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px,${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-100%)`;
      const nm = `${e.def.name} Lv.${e.lvl}`; if (d._n !== nm) { d._n = nm; d.firstChild.textContent = nm; d.classList.toggle('hard', e.lvl > this.save.lvl + 3); }
      d.querySelector('b').style.width = (e.hp / e.max * 100) + '%'; });
  }
  render() {
    renderer.info.autoReset = false; renderer.info.reset(); renderer.clear(); renderer.render(this.scene, this.cam);
    if (!this.cut && !this.hideVM && (!this.tpv.on || this.tpv.close)) this.vm.render(renderer, this.cam.aspect);
  }
  resize() { this.cam.aspect = innerWidth / innerHeight; this.cam.updateProjectionMatrix(); }
}
export function angDiff(a, b) { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }
export const smooth = t => t * t * (3 - 2 * t);
