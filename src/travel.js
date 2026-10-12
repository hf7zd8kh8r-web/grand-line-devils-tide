// Devil Fruit travel moves: a toggle (B key / 🕊 button) separate from combat. Faster than any ship, energy-limited,
// no sea weakness while airborne / on your own path, safe drop to shore when energy runs out, fly to other islands.
import { THREE } from './engine.js';
import { IN } from './input.js';
import { ISLANDS, SEAS, islandById } from './data.js';
import { BUILDERS } from './islands.js';
const B = THREE;
// id: [move name, kind, trail colour, accent, speed u/s, energy seconds, mount style]
// kinds: fly (free altitude) · hover (low over sea) · path (rides a path it builds on the water) · blink (flash hops) · bounce (launch arcs)
export const TRAVEL = {
  mera: ['Flame Jet', 'fly', 0xff6a1a, 0xffd23a, 34, 26, 'jet'],
  phoenix: ['Phoenix Flight', 'fly', 0x3ad0ff, 0xffe26a, 40, 40, 'wings'],
  seiryu: ['Azure Dragon Ride', 'fly', 0x3a7aff, 0xbfe6ff, 46, 45, 'dragon'],
  pika: ['Light-Speed Flash', 'blink', 0xfff27a, 0xffffff, 60, 18, 'none'],
  moku: ['White Smoke Cloud', 'hover', 0xeeeeee, 0xbcbcbc, 30, 32, 'cloud'],
  suna: ['Sandstorm Glide', 'hover', 0xd8b878, 0xa8864a, 30, 30, 'sand'],
  hie: ['Ice Age Path', 'path', 0xbfeaff, 0x7ad0ff, 30, 40, 'none'],
  yuki: ['Snow Road', 'path', 0xffffff, 0xd8ecff, 28, 34, 'none'],
  makami: ['Ice Wolf Run', 'path', 0x9fdcff, 0xe8f8ff, 38, 40, 'wolf'],
  bari: ['Barrier Bridge', 'path', 0xd8f4ff, 0x9ae6ff, 27, 30, 'none'],
  gomu: ['Rubber Slingshot', 'bounce', 0xff9ad0, 0xffd0ea, 32, 24, 'none'],
  bane: ['Boing Spring Hops', 'bounce', 0x9aff9a, 0xd8ffd8, 28, 26, 'none'],
  nika: ['Gear 5 Cloud Walk', 'fly', 0xffffff, 0xfff3c0, 42, 38, 'cloud'],
  gasu: ['Gas Cloud Drift', 'hover', 0xa060ff, 0xd0ff60, 29, 30, 'gas'],
  magu: ['Magma Rocket', 'fly', 0xff4a10, 0x2a1a10, 33, 24, 'jet'],
  goro: ['Lightning Travel', 'blink', 0x7ad8ff, 0xffffff, 55, 26, 'none'],
  sound: ['Soundwave Surf', 'hover', 0xff6ad8, 0x6ad8ff, 40, 36, 'rings'],
  ptera: ['Pteranodon Glide', 'fly', 0x9a7a5a, 0xe0c890, 36, 34, 'wings'],
  pegasus: ['Sky Gallop', 'fly', 0xf2f2ff, 0xffe6a0, 38, 36, 'wings'],
  thunderbird: ['Thunderbird Soar', 'fly', 0xffe23a, 0x7ad8ff, 38, 34, 'wings'],
  doa: ['Door Hop', 'blink', 0xd8a86a, 0x6a4a2a, 44, 22, 'none'],
  ope: ['Room Shambles', 'blink', 0x7ad0ff, 0x3a8acc, 46, 20, 'none'],
  fuwa: ['Float-Float Flight', 'fly', 0xbfe8ff, 0xffffff, 31, 34, 'none'],
  awa: ['Bubble Ride', 'hover', 0xc8f0ff, 0xffffff, 27, 28, 'bubble'],
  mochi: ['Mochi Bounce', 'bounce', 0xfff0d8, 0xe8d0a8, 29, 26, 'none'],
  soru: ['Zeus Ride', 'fly', 0x5a6a8a, 0xffe23a, 36, 36, 'zeus'],
  zushi: ['Meteor Ride', 'fly', 0x8a3aff, 0x2a1a4a, 35, 30, 'rock'],
};
export const travelOf = id => TRAVEL[id] ? { name: TRAVEL[id][0], kind: TRAVEL[id][1], col: TRAVEL[id][2], col2: TRAVEL[id][3], spd: TRAVEL[id][4], dur: TRAVEL[id][5], mount: TRAVEL[id][6] } : null;
export const BOAT_MAX = 10.5 * 1.6 * 1.3; // fastest ship at full sail (u/s), for reference/tests
const KIND_TXT = { fly: 'flies', hover: 'floats over the sea', path: 'builds a path over the sea', blink: 'flash-dashes', bounce: 'launches in arcs' };
export const travelLabel = id => { const t = travelOf(id); return t ? `${t.name} (${KIND_TXT[t.kind]})` : ''; };
const WL = -0.95;
const M = (c, o = {}) => new B.MeshBasicMaterial({ color: c, transparent: true, opacity: o.op ?? 0.85, depthWrite: false, side: B.DoubleSide });
export function makeMount(id) { const t = travelOf(id), g = new B.Group(); if (!t) return g; g.userData.kind = t.mount; const add = (geo, c, x, y, z, op) => { const m = new B.Mesh(geo, M(c, { op })); m.position.set(x, y, z); g.add(m); return m; };
  if (t.mount === 'cloud' || t.mount === 'gas' || t.mount === 'sand') { for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; add(new B.SphereGeometry(0.45 + (i % 3) * 0.12, 10, 8), i % 2 ? t.col : t.col2, Math.cos(a) * 0.7, -0.15, Math.sin(a) * 0.55, 0.8); } add(new B.SphereGeometry(0.6, 10, 8), t.col, 0, -0.1, 0, 0.85); }
  else if (t.mount === 'wings') { for (const s of [-1, 1]) { const sh = new B.Shape(); sh.moveTo(0, 0.2); sh.lineTo(s * 1.6, 1.0); sh.lineTo(s * 3.4, 0.9); sh.lineTo(s * 2.8, 0.2); sh.lineTo(s * 3.0, -0.3); sh.lineTo(s * 2.0, -0.4); sh.lineTo(s * 2.2, -0.9); sh.lineTo(s * 1.0, -0.6); sh.lineTo(0, -0.4); const w = add(new B.ShapeGeometry(sh), t.col, 0, 1.1, 0.3, 0.9); const w2 = new B.Mesh(new B.ShapeGeometry(sh), M(t.col2, { op: 0.55 })); w2.scale.setScalar(0.6); w2.position.z = 0.01; w.add(w2); w.userData.wing = s; } }
  else if (t.mount === 'jet') { const c = add(new B.ConeGeometry(0.45, 1.6, 10, 1, true), t.col, 0, -0.5, 0, 0.8); c.rotation.x = Math.PI; add(new B.ConeGeometry(0.25, 1.0, 8, 1, true), t.col2, 0, -0.45, 0, 0.9).rotation.x = Math.PI; }
  else if (t.mount === 'zeus') { const cm = c => new B.MeshToonMaterial({ color: c }); const ad = (geo, c, x, y, z) => { const m = new B.Mesh(geo, cm(c)); m.position.set(x, y, z); g.add(m); return m; };
    [[0, 0, 0, 0.9], [0.8, 0.05, -0.1, 0.65], [-0.8, 0.05, -0.1, 0.65], [0.4, 0.35, -0.3, 0.6], [-0.4, 0.35, -0.3, 0.6], [0, -0.1, -0.8, 0.7], [1.3, -0.1, -0.5, 0.45], [-1.3, -0.1, -0.5, 0.45]].forEach(([x, y, z, r]) => ad(new B.SphereGeometry(r, 12, 10), 0x6a7a9a, x, y - 0.75, z));
    for (const sx of [-1, 1]) { ad(new B.SphereGeometry(0.2, 10, 8), 0xffffff, sx * 0.32, -0.55, 0.78); ad(new B.SphereGeometry(0.1, 8, 6), 0x111111, sx * 0.3, -0.56, 0.95); const br = ad(new B.BoxGeometry(0.34, 0.07, 0.06), 0x1a1a2a, sx * 0.32, -0.3, 0.88); br.rotation.z = sx * 0.45; }
    const mo = ad(new B.TorusGeometry(0.2, 0.05, 6, 12, Math.PI), 0x1a1a2a, 0, -1.05, 0.86); mo.rotation.z = 0; // frown
    for (let i = 0; i < 4; i++) { const sh = new B.Shape(); sh.moveTo(0, 0); sh.lineTo(0.15, -0.3); sh.lineTo(0.02, -0.3); sh.lineTo(0.18, -0.65); sh.lineTo(-0.08, -0.25); sh.lineTo(0.05, -0.25); sh.lineTo(-0.05, 0); const b = add(new B.ShapeGeometry(sh), 0xffe23a, Math.cos(i * 1.57) * 0.9, -1.4, Math.sin(i * 1.57) * 0.7, 1); b.userData.bolt = i; } }
  else if (t.mount === 'bubble') add(new B.SphereGeometry(1.25, 16, 12), t.col, 0, 0.75, 0, 0.28);
  else if (t.mount === 'rings') { for (let i = 0; i < 3; i++) { const r = add(new B.TorusGeometry(0.7 + i * 0.35, 0.05, 6, 24), i % 2 ? t.col2 : t.col, 0, -0.1, 0, 0.8); r.rotation.x = Math.PI / 2; r.userData.ring = i; } }
  else if (t.mount === 'rock') { add(new B.DodecahedronGeometry(0.9, 0), 0x4a3a5a, 0, -0.75, 0, 1); add(new B.TorusGeometry(1.3, 0.06, 6, 28), t.col, 0, -0.6, 0, 0.8).rotation.x = Math.PI / 2; }
  else if (t.mount === 'wolf') { const b = add(new B.BoxGeometry(0.7, 0.6, 1.7), t.col, 0, -0.35, 0, 0.9); add(new B.ConeGeometry(0.3, 0.7, 6), t.col2, 0, -0.15, 1.1, 0.9).rotation.x = Math.PI / 2; b.userData.wolf = 1; }
  else if (t.mount === 'dragon') { const segs = []; for (let i = 0; i < 18; i++) { const s = add(new B.SphereGeometry(0.95 - i * 0.04, 12, 10), i % 2 ? t.col : 0x2a5ad8, 0, -0.9, 1.2 - i * 1.0, 0.97); segs.push(s); } const hd = add(new B.ConeGeometry(0.75, 2.0, 8), t.col2, 0, -0.7, 2.6, 0.97); hd.rotation.x = Math.PI / 2; for (const sx of [-1, 1]) { const h = add(new B.ConeGeometry(0.12, 1.1, 5), 0xffe6a0, sx * 0.45, 0.0, 2.1, 1); h.rotation.x = -0.9; const wsk = add(new B.CylinderGeometry(0.04, 0.02, 2.2, 4), 0xbfe6ff, sx * 0.8, -0.8, 2.8, 0.9); wsk.rotation.z = sx * 1.2; } g.userData.segs = segs; }
  return g; }
export function animMount(m, t, dt, moving) { if (!m) return; for (const c of m.children) { if (c.userData.wing) c.rotation.z = c.userData.wing * Math.sin(t * (moving ? 9 : 4)) * 0.45; if (c.userData.ring != null) c.scale.setScalar(1 + ((t * 2 + c.userData.ring * 0.33) % 1) * 0.6); if (c.userData.bolt != null) { c.visible = Math.sin(t * 13 + c.userData.bolt * 2.1) > 0.3; c.rotation.y = t * 3; } if (c.userData.wolf) c.position.y = -0.35 + Math.abs(Math.sin(t * 12)) * 0.15; }
  if (m.userData.kind === 'cloud' || m.userData.kind === 'gas' || m.userData.kind === 'sand') m.rotation.y += dt * 1.5; if (m.userData.segs) m.userData.segs.forEach((s, i) => { s.position.x = Math.sin(t * 5 - i * 0.6) * 0.8 * Math.min(1, i / 3); s.position.y = -0.9 + Math.cos(t * 4 - i * 0.5) * 0.35 * Math.min(1, i / 3); }); }
// shared trail particles (local + remote players)
export function emitTrail(g, pos, id, dt, rate = 1) { const t = travelOf(id); if (!t || !g.fx) return; const n = Math.random() < dt * 30 * rate ? 1 : 0; if (!n) return;
  const p = pos.clone(); const k = t.kind, mo = t.mount; const j = () => (Math.random() - 0.5);
  if (mo === 'jet') g.fx.burst(p.add(new B.Vector3(j() * 0.3, -0.6, j() * 0.3)), 3, Math.random() < 0.5 ? t.col : t.col2, { speed: 2, up: -3, size: 0.38, life: 0.5, grav: -2 });
  else if (k === 'blink') g.fx.burst(p.add(new B.Vector3(j(), 0.6 + j(), j())), 3, Math.random() < 0.6 ? t.col : t.col2, { speed: 3.5, up: 0.5, size: 0.22, life: 0.35, grav: 0 });
  else if (mo === 'cloud' || mo === 'gas' || mo === 'sand') g.fx.burst(p.add(new B.Vector3(j(), -0.3, j())), 2, Math.random() < 0.5 ? t.col : t.col2, { speed: 0.8, up: 0.3, size: 0.6, life: 1.1, grav: 0 });
  else if (mo === 'zeus') g.fx.burst(p.add(new B.Vector3(j() * 1.6, -0.9, j() * 1.6)), 2, Math.random() < 0.7 ? 0x8a9aba : t.col2, { speed: 1.5, up: 0.2, size: 0.4, life: 0.7, grav: 0 });
  else if (mo === 'dragon' || mo === 'wings') g.fx.burst(p.add(new B.Vector3(j() * 2, 0.8, j() * 2)), 2, Math.random() < 0.6 ? t.col : t.col2, { speed: 1.2, up: 0.4, size: 0.34, life: 0.8, grav: -1 });
  else g.fx.burst(p.add(new B.Vector3(j() * 0.6, 0.1, j() * 0.6)), 2, Math.random() < 0.6 ? t.col : t.col2, { speed: 1.4, up: 1, size: 0.28, life: 0.6, grav: 2 }); }
export const builtIslands = () => ISLANDS.filter(i => i.built && BUILDERS[i.id]);
export function flyGate(S, I) { const sea = SEAS.find(s => s.id === I.sea) || { lvl: 1, name: 'that sea' }; if (S.lvl < sea.lvl) return `🔒 You need level ${sea.lvl} to fly into the ${sea.name}`; if (S.lvl < (I.lvl || 0)) return `🔒 Reach level ${I.lvl} to fly to ${I.name}`; if (I.secret && !(S.unlocked || []).includes(I.id)) return '🔒 Secret island — find it first'; return ''; }
export class Travel {
  constructor(g) { this.g = g; this.on = false; this.E = 100; this.tiles = []; this.mount = null; this.picked = false; this.stats = { maxSpd: 0, dist: 0 };
    const hud = document.getElementById('hud') || document.body; this.bar = document.createElement('div'); this.bar.id = 'tvBar'; this.bar.innerHTML = '<span></span><div><i></i></div>'; hud.appendChild(this.bar);
    this.pick = document.createElement('div'); this.pick.id = 'tvPick'; document.body.appendChild(this.pick);
    this.pick.addEventListener('click', e => { const b = e.target.closest('[data-fly]'); if (!b) return; e.stopPropagation(); const id = b.dataset.fly; this.pick.classList.remove('open'); if (id !== 'x') this.flyTo(id); else this.picked = false; }); }
  info() { const S = this.g.save; return S && S.slot === 'fruit' ? travelOf(S.eq.fruit) : (S && travelOf(S.eq.fruit)); }
  toggle() { this.on ? this.stop('off') : this.start(); }
  start() { const g = this.g, S = g.save, p = g.p, t = travelOf(S.eq.fruit);
    if (!S.eq.fruit) { g.ui.toast('Eat a Devil Fruit with a travel move to fly', 'blk'); return false; }
    if (!t) { g.ui.toast(`🕊 Your fruit has no travel move (try Flame, Phoenix, Ice, Smoke…)`, 'blk'); return false; }
    if (g.dead || g.cut || g.seat) return false;
    if (g.seaDrain && g.seaDrain()) { g.ui.toast('🌊 Powers are sealed in the sea — get to shore first!', 'blk'); return false; }
    if (this.E < 15) { g.ui.toast('🕊 Not enough travel energy — rest a moment', 'blk'); return false; }
    if (S.tf) g.transform(0);
    this.on = true; this.id = S.eq.fruit; this.t = t; this.isl = g.island; this.hopT = 0; this.bounceT = 0; this.lastTile = null; this.alt = Math.max(p.pos.y, WL) + (t.kind === 'fly' ? 3 : t.kind === 'hover' ? 1.6 : t.kind === 'path' ? 0 : 0.5);
    p.vy = 0; p.kb = null; p.lunge = null; p.dash = 0; this.mount = makeMount(this.id); g.scene.add(this.mount); document.body.classList.add('traveling'); this.labels(true);
    g.fx.burst(p.pos.clone().setY(p.pos.y + 0.8), 18, t.col, { speed: 4, up: 3, size: 0.4, life: 0.6 });
    g.ui.toast(`🕊 ${t.name}! ${t.kind === 'fly' ? (IN_TOUCH() ? '▲/▼ to climb' : 'Space up · C down') : ''} · fly past the island edge to reach other islands`, 'item'); return true; }
  stop(why) { const g = this.g, p = g.p; if (!this.on) return; this.on = false; document.body.classList.remove('traveling'); this.labels(false); if (this.mount) { g.scene.remove(this.mount); this.mount.traverse(o => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose(); }); this.mount = null; }
    p.vy = Math.min(0, p.vy || 0); p.kb = null; p.lunge = null; p.dash = 0; this.pick.classList.remove('open'); this.picked = false;
    const gh = g.groundAt(p.pos.x, p.pos.z); const overSea = gh < WL - 0.3;
    if (why === 'empty') { g.ui.toast(overSea ? '🕊 Out of energy — you dropped into the sea!' : '🕊 Out of travel energy', 'blk'); if (overSea) { p.pos.y = Math.min(p.pos.y, WL + 6); clearTimeout(this._rt); this._rt = setTimeout(() => { if (!this.on && g.p.swim && g.island === this.isl) g.toShore(true); }, 1600); } } }
  labels(on) { const j = document.querySelector('.tb.jmp'), b = document.querySelector('.tb.blk'); if (!j || !b) return; if (on && this.t.kind === 'fly') { j.dataset.o = j.dataset.o || j.textContent; b.dataset.o = b.dataset.o || b.textContent; j.textContent = '▲ UP'; b.textContent = '▼ DOWN'; } else { if (j.dataset.o) j.textContent = j.dataset.o; if (b.dataset.o) b.textContent = b.dataset.o; } }
  // replaces normal horizontal velocity while active; returns [vx, vz] or null
  vel(mv, dt) { if (!this.on) return null; const g = this.g, p = g.p, t = this.t; let dir = mv.clone(); dir.y = 0; const L = dir.length(); if (L > 1) dir.multiplyScalar(1 / L);
    let spd = t.spd; if (t.kind === 'blink') { this.hopT -= dt; if (L > 0.1 && this.hopT <= 0) { this.hopT = 0.45; this.flash = 0.12; g.fx.burst(p.pos.clone().setY(p.pos.y + 0.8), 14, t.col, { speed: 5, up: 1, size: 0.3, life: 0.4, grav: 0 }); } if (this.flash > 0) { this.flash -= dt; spd *= 2.6; } else spd *= 0.75; }
    this.cur = dir.length() * spd; return [dir.x * spd, dir.z * spd]; }
  vert(dt) { const g = this.g, p = g.p, t = this.t; const gh = g.groundAt(p.pos.x, p.pos.z); const floor = Math.max(gh, WL); let y;
    if (t.kind === 'fly') { const up = (IN.held.jump ? 1 : 0) - (IN.held.block ? 1 : 0); this.alt += up * 12 * dt; if (!IN_TOUCH() && this.cur > 1 && !up) this.alt += Math.sin(p.pitch) * this.cur * 0.5 * dt; this.alt = Math.min(Math.max(this.alt, floor + 1.2), 70); y = this.alt; }
    else if (t.kind === 'hover') y = this.alt = floor + 1.6 + Math.sin(g.t * 2) * 0.15;
    else if (t.kind === 'path') { y = this.alt = gh > WL + 0.2 ? gh : WL + 0.3; this.tile(gh); }
    else if (t.kind === 'bounce') { this.bounceT += dt * (this.cur > 1 ? 1.6 : 0.8); const ph = this.bounceT % 1; y = floor + 0.6 + Math.sin(ph * Math.PI) * 7; if (ph < this.lastPh) g.fx.burst(new B.Vector3(p.pos.x, floor + 0.4, p.pos.z), 10, t.col, { speed: 3, up: 1.5, size: 0.3, life: 0.4 }); this.lastPh = ph; }
    else y = floor + 0.6;
    p.pos.y = y; p.vy = 0; }
  tile(gh) { const g = this.g, p = g.p; if (gh > WL - 0.1) return; const lt = this.lastTile; if (lt && Math.hypot(p.pos.x - lt.x, p.pos.z - lt.z) < 1.3) return; this.lastTile = { x: p.pos.x, z: p.pos.z };
    let m = this.tiles.find(x => !x.visible); if (!m) { if (this.tiles.length > 90) m = this.tiles.reduce((a, b) => a.userData.t < b.userData.t ? a : b); else { m = new B.Mesh(new B.CylinderGeometry(1.6, 1.8, 0.25, 7), new B.MeshBasicMaterial({ transparent: true, opacity: 0.85, depthWrite: false })); g.scene.add(m); this.tiles.push(m); } }
    m.material.color.set(Math.random() < 0.5 ? this.t.col : this.t.col2); m.material.opacity = this.id === 'bari' ? 0.45 : 0.9; m.position.set(p.pos.x, WL + 0.08, p.pos.z); m.rotation.y = Math.random() * 6; m.visible = true; m.userData.t = g.t; m.userData.life = 7; m.scale.setScalar(1); }
  update(dt) { const g = this.g, S = g.save, p = g.p; if (!S) return; const t = travelOf(S.eq.fruit);
    { const bt = document.getElementById('trvBtn'); if (bt) { const show = !!t && S.slot === 'fruit'; if (bt.style.display !== (show ? '' : 'none')) bt.style.display = show ? '' : 'none'; bt.classList.toggle('on', this.on); } }
    for (const m of this.tiles) if (m.visible) { const a = g.t - m.userData.t; if (a > m.userData.life) m.visible = false; else if (a > m.userData.life - 1.5) m.material.opacity = 0.9 * (m.userData.life - a) / 1.5; }
    if (this.on && (g.island !== this.isl || g.dead || g.cut || S.eq.fruit !== this.id || S.slot !== 'fruit')) this.stop('off');
    if (this.on) { this.E -= dt * 100 / this.t.dur; if (this.E <= 0) { this.E = 0; this.stop('empty'); } }
    else this.E = Math.min(100, this.E + dt * (p.ground ? 14 : 6));
    this.bar.classList.toggle('show', !!t && (this.on || this.E < 99.5)); this.bar.classList.toggle('low', this.E < 25);
    if (t) { this.bar.firstChild.textContent = `🕊 ${t.name}`; this.bar.lastChild.firstChild.style.width = this.E.toFixed(1) + '%'; }
    if (!this.on) return;
    if (this.cur > this.stats.maxSpd) this.stats.maxSpd = this.cur; this.stats.dist += this.cur * dt;
    if (this.mount) { this.mount.position.copy(p.pos); this.mount.rotation.y = p.yaw + Math.PI; if (this.t.mount === 'dragon') this.mount.position.y -= 0.2; animMount(this.mount, g.t, dt, this.cur > 1); }
    emitTrail(g, p.pos, this.id, dt, this.cur > 1 ? 1.4 : 0.4);
    // island edge: offer to fly on to another island
    const r = Math.hypot(p.pos.x, p.pos.z); if (r > g.island.R + 14 && !this.picked) { this.picked = true; this.openPick(); } else if (r < g.island.R + 8 && this.picked && !this.pick.classList.contains('open')) this.picked = false; }
  openPick() { const g = this.g, S = g.save; const all = builtIslands().filter(i => i.id !== g.island.id), okL = all.filter(I => !flyGate(S, I)), lock = all.filter(I => flyGate(S, I)).slice(0, 3); const rows = [...okL, ...lock].map(I => { const gate = flyGate(S, I); return `<button data-fly="${gate ? 'x' : I.id}" ${gate ? 'class="lock"' : ''}><b>${I.name}</b><small>${gate || (SEAS.find(s => s.id === I.sea) || {}).name + ' · Lv.' + I.lvl + '+'}</small></button>`; }).join('');
    this.pick.innerHTML = `<h3>🕊 ${this.t.name}</h3><p>Fly on to another island — much faster than sailing!</p>${rows || '<p>No other islands to fly to yet</p>'}<button data-fly="x" class="cancel">Keep exploring</button>`; this.pick.classList.add('open'); }
  // cross to another island: same arrival as a voyage, but a short flight instead of a sail
  flyTo(id) { const g = this.g, S = g.save, I = islandById(id); if (!I || !BUILDERS[id]) { g.ui.toast('Coming in a future update', 'blk'); return false; } const gate = flyGate(S, I); if (gate) { g.ui.toast(gate, 'blk'); return false; }
    const t = travelOf(S.eq.fruit); if (!t) { g.ui.toast('Your fruit has no travel move', 'blk'); return false; } if (g.island && g.island.id === id) return false;
    const from = g.island.id, A = islandById(from); const md = A ? Math.hypot(A.x - I.x, A.y - I.y) : 20; const sec = Math.max(1.6, Math.min(5, (170 + md * 4) / t.spd * 0.35)); // a ship takes (170+md*4)/~11 s
    this.stop('off'); this.E = Math.max(10, this.E - 25); const ov = document.createElement('div'); ov.id = 'tvFly'; ov.style.setProperty('--c', '#' + t.col.toString(16).padStart(6, '0')); ov.innerHTML = `<div><b>🕊 ${t.name}</b><span>Flying to ${I.name}…</span><i><u style="animation-duration:${sec}s"></u></i></div>`; document.body.appendChild(ov);
    this.flying = id; S.stats.flights = (S.stats.flights || 0) + 1; return new Promise(res => setTimeout(() => { ov.remove(); this.flying = null; g.loadIsland(id, true); g.ui.toast(`🕊 Landed on ${I.name} by ${t.name}`, 'quest'); res(true); }, sec * 1000)); }
}
const IN_TOUCH = () => document.getElementById('hud') && document.getElementById('hud').classList.contains('touch');
if (typeof window !== 'undefined') { window.__TRAVEL = TRAVEL; window.__BOAT_MAX = BOAT_MAX; }
