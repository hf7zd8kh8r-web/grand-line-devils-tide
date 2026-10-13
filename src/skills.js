// Skill VFX library: shared geometry, pooled/disposed per-effect materials, readable shaped effects (fists, dragons, wolves,
// music notes, flames, crystals...) and gameplay helpers (freeze, pull, chain lightning, burn zones). Used by ultra.js and the
// element-themed fallback for every other fruit. Everything runs inside g.fx's update loop (no timers), materials are disposed
// when an effect ends, and decorative spawns back off when many effects are alive (iPhone budget).
import { THREE, RAMP, OUTLINE_MAT, qv } from './engine.js';
const B = THREE;
export const V = (x = 0, y = 0, z = 0) => new B.Vector3(x, y, z);
const NOMAT = { dispose() {} };
const GEO = {}; const geo = (k, f) => GEO[k] || (GEO[k] = f());
export const G = {
  sph: () => geo('sph', () => new B.SphereGeometry(1, 14, 10)),
  lsph: () => geo('lsph', () => new B.SphereGeometry(1, 8, 6)),
  box: () => geo('box', () => new B.BoxGeometry(1, 1, 1)),
  cyl: () => geo('cyl', () => new B.CylinderGeometry(1, 1, 1, 12)),
  zcyl: () => geo('zcyl', () => new B.CylinderGeometry(1, 1, 1, 12, 1, true).rotateX(Math.PI / 2)),
  zcylc: () => geo('zcylc', () => new B.CylinderGeometry(1, 1, 1, 10).rotateX(Math.PI / 2)),
  cone: () => geo('cone', () => new B.ConeGeometry(1, 1, 8)),
  zcone: () => geo('zcone', () => new B.ConeGeometry(1, 1, 10).rotateX(Math.PI / 2)),
  torus: () => geo('torus', () => new B.TorusGeometry(1, 0.06, 6, 48)),
  ftorus: () => geo('ftorus', () => new B.TorusGeometry(1, 0.16, 6, 40)),
  arc: () => geo('arc', () => new B.TorusGeometry(1, 0.13, 5, 24, Math.PI)),
  ico: () => geo('ico', () => new B.IcosahedronGeometry(1, 0)),
  oct: () => geo('oct', () => new B.OctahedronGeometry(1, 0)),
  disk: () => geo('disk', () => new B.CircleGeometry(1, 32).rotateX(-Math.PI / 2)),
  hex: () => geo('hex', () => new B.CircleGeometry(1, 6)),
  star: () => geo('star', () => { const s = new B.Shape(); for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, r = i % 2 ? 0.42 : 1; s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } return new B.ShapeGeometry(s); }),
};
const own = m => { m.userData.own = 1; return m; };
export const M = {
  toon: (c, o = {}) => own(new B.MeshToonMaterial({ color: c, gradientMap: RAMP, ...o })),
  glow: (c, op = 1) => own(new B.MeshBasicMaterial({ color: c, transparent: true, opacity: op, blending: B.AdditiveBlending, depthWrite: false, side: B.DoubleSide })),
  flat: (c, op = 1) => own(new B.MeshBasicMaterial({ color: c, transparent: op < 1, opacity: op, side: B.DoubleSide, depthWrite: op >= 1 })),
};
export function group() { const g = new B.Group(); g.material = NOMAT; return g; }
export function mesh(geo, mat, parent, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx) { const m = new B.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); if (parent) parent.add(m); return m; }
export function outline(m, k = 1.12) { if (!qv().outline) return m; const o = new B.Mesh(m.geometry, OUTLINE_MAT); o.scale.setScalar(k); o.userData.isOutline = true; m.add(o); return m; }
export function cleanup(obj) { obj.traverse(o => { const m = o.material; if (m && m.userData && m.userData.own) m.dispose(); if (o.isInstancedMesh) o.dispose(); if (o.userData.ownGeo) o.geometry.dispose(); }); }
// run an effect: fn(t 0..1, dt, seconds). The object is removed and its own materials disposed at the end.
export function run(g, obj, dur, fn) { g.fx.add(obj, dur, (t, dt) => { if (fn) fn(t, dt, t * dur); if (t >= 1) cleanup(obj); }); return obj; }
export function after(g, delay, fn) { const h = group(); run(g, h, Math.max(0.001, delay), t => { if (t >= 1) fn(); }); }
export const busy = (g, n = 200) => g.fx.objs.length > n * (qv().parts < 0.5 ? 0.6 : 1);
const ease = t => 1 - Math.pow(1 - t, 3);
export const R = (a = 1) => (Math.random() - 0.5) * 2 * a;
// ---------- context: same skill code runs locally (with damage) or for a co-op peer (visual only) ----------
export function ctxFor(g, o) {
  const local = !o.peer; const p = g.p; const peer = o.peer;
  const yaw = () => local ? p.yaw : (peer.yaw || 0); const pitch = () => local ? p.pitch : 0;
  const c = { g, local, fruit: o.fruit, dmg: o.dmg || 0, col: o.col, O: o.O || {}, rar: o.rar ?? 0, P: () => local ? p.pos.clone() : (peer.av ? peer.av.root.position.clone() : o.at.clone()) };
  c.eye = () => local ? g.eyePos().clone() : c.P().add(V(0, 1.5, 0));
  c.fwd = () => { const y = yaw(), pt = pitch(); return V(-Math.sin(y) * Math.cos(pt), Math.sin(pt), -Math.cos(y) * Math.cos(pt)); };
  c.flat = () => { const y = yaw(); return V(-Math.sin(y), 0, -Math.cos(y)); };
  c.right = () => { const y = yaw(); return V(Math.cos(y), 0, -Math.sin(y)); };
  c.yaw = yaw;
  c.hand = (side = 1) => local && g.vm && g.vm.handWorld && !g.cut && !(g.tpv && g.tpv.on && !g.tpv.close) ? (g.vm.handWorld(side, g.cam) || c.eye()) : local ? c.eye().addScaledVector(c.fwd(), 0.9).addScaledVector(c.right(), 0.3 * side).add(V(0, -0.32, 0)) : c.P().add(V(0, 1.2, 0)).addScaledVector(c.flat(), 0.6).addScaledVector(c.right(), 0.3 * side);
  c.ground = v => { v.y = g.groundAt(v.x, v.z); return v; };
  c.aim = (max = 30) => { const e0 = c.eye(), d = c.fwd(); if (local) { const h = g.rayEnemy(e0, d, max, 1.0); if (h) return g.chest(h.e, V()); }
    for (let t = 1; t < max; t += 0.5) { const q = e0.clone().addScaledVector(d, t); if (q.y < g.groundAt(q.x, q.z) + 0.2) return q; } return local ? e0.addScaledVector(d, max) : c.ground(c.P().addScaledVector(c.flat(), Math.min(max, 14))); };
  c.inR = (pt, r) => g.enemiesInRadius(pt, r);
  c.hitE = (e, mul, x = {}) => { if (!local || e.dead) return; g.damageEnemy(e, c.dmg * mul, { ...c.O, kb: 4, ...x }); if (x.freeze) freeze(c, e, x.freeze); };
  c.hitR = (pt, r, mul, x = {}) => { if (!local) return []; const L = g.enemiesInRadius(pt, r); for (const e of L) c.hitE(e, mul, { from: pt, ...x }); return L; };
  c.hitLine = (a, d, len, w, mul, x = {}, seen) => { if (!local) return []; const out = []; for (const e of g.enemies) { if (e.dead || (seen && seen.has(e))) continue; const to = g.chest(e, V()).sub(a); const t = to.dot(d); if (t < -0.5 || t > len) continue; if (to.addScaledVector(d, -t).length() < w + (e.boss ? 0.9 : 0)) { out.push(e); if (seen) seen.add(e); c.hitE(e, mul, x); } } return out; };
  c.shake = v => { if (local) g.fx.shake = Math.max(g.fx.shake, v); };
  c.punch = (a, f) => { if (local && g.camPunch) g.camPunch(a, f); };
  c.lines = k => { if (local && g.speedLines) g.speedLines(k); };
  c.cast = s => { if (local && g.vm) g.vm.doCast(s); };
  c.cam = () => g.cam;
  return c;
}
// ---------- status effects ----------
const now = () => performance.now() / 1000;
export function freeze(c, e, dur) { const g = c.g; if (e.dead) return; const until = now() + (e.boss ? dur * 0.3 : dur); if (e._frz && e._frz > now()) { e._frz = Math.max(e._frz, until); return; } e._frz = until;
  const h = (e.c.height || 1.8) * (e.boss ? 0.7 : 1); const gr = group(); const m = M.toon(0xbfeaff, { transparent: true, opacity: 0.55, emissive: 0x2a5a8a });
  mesh(G.ico(), m, gr, 0, h * 0.5, 0, h * 0.42, h * 0.62, h * 0.42); const sm = M.toon(0xe8f8ff, { emissive: 0x3a6a9a });
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28, s = mesh(G.cone(), sm, gr, Math.cos(a) * h * 0.38, h * (0.2 + Math.random() * 0.5), Math.sin(a) * h * 0.38, 0.12 * h, 0.45 * h, 0.12 * h); s.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); }
  gr.position.copy(e.c.root.position); g.fx.burst(gr.position.clone().setY(gr.position.y + h * 0.5), 10, 0xdff6ff, { speed: 4, size: 0.35, life: 0.5 });
  run(g, gr, Math.min(6, dur + 0.4), (t, dt) => { const left = e._frz - now(); gr.position.copy(e.c.root.position); const k = Math.min(1, (1 - t) * 6, left > 0 ? 1 : 0.0001); gr.scale.setScalar(Math.max(0.001, Math.min(1, t * 12) * k));
    if (left > 0 && !e.dead) { if (!e.boss) { e.hitT = Math.max(e.hitT, 0.12); e.state = 'hit'; e.atk = 0; } e.vel.multiplyScalar(0.6); } else if (gr.visible) { gr.visible = false; g.fx.sparks(gr.position.clone().setY(gr.position.y + h * 0.5), 14, 0xe8f8ff, { speed: 7, life: 0.4 }); } }); }
export function pull(c, pt, r, speed, dt) { if (!c.local) return; for (const e of c.inR(pt, r)) { const P = e.c.root.position; const dx = pt.x - P.x, dz = pt.z - P.z, d = Math.hypot(dx, dz); if (d < 1.2) continue; const k = Math.min(d - 1.2, speed * dt * (e.boss ? 0.15 : 1)) / d; P.x += dx * k; P.z += dz * k; } }
export function chain(c, from, n, range, mul, col = 0xcfe8ff, x = {}) { const g = c.g; const seen = new Set(); let at = from.clone(); for (let i = 0; i < n; i++) { let best = null, bd = range; for (const e of g.enemies) { if (e.dead || seen.has(e)) continue; const d = g.chest(e, V()).distanceTo(at); if (d < bd) { bd = d; best = e; } } if (!best) break; seen.add(best); const to = g.chest(best, V()); g.fx.zap(at, to, col, 10, 0.25); g.fx.zap(at, to, 0xffffff, 6, 0.15); g.fx.sparks(to, 8, col, { speed: 8 }); c.hitE(best, mul * Math.pow(0.85, i), { kb: 2, stun: 0.6, from: at, ...x }); at = to; } }
// lingering ground zone (burn / poison / slow); ticks damage every 0.4 s
export function zone(c, pt, r, dur, col, o = {}) { const g = c.g; const gr = group(); gr.position.copy(pt).setY(g.groundAt(pt.x, pt.z) + 0.06); const m = M.glow(col, 0.55); const d = mesh(G.disk(), m, gr, 0, 0, 0, r, 1, r); const rm = M.glow(o.c2 ?? 0xffffff, 0.6); const rg = mesh(G.torus(), rm, gr, 0, 0.05, 0, r, r, 3); rg.rotation.x = Math.PI / 2;
  let tick = 0; run(g, gr, dur, (t, dt) => { m.opacity = 0.5 * Math.min(1, t * 8) * (1 - t * t); rm.opacity = m.opacity; rg.rotation.z += dt * 0.8; if (Math.random() < 0.5 * qv().parts + 0.2) g.fx.burst(gr.position.clone().add(V(R(r * 0.8), 0.2, R(r * 0.8))), 1, o.p ?? col, { speed: 0.6, up: o.up ?? 2.5, size: o.size ?? 0.5, life: 0.6, grav: o.grav ?? -2, spread: 0.3 });
    if ((tick -= dt) <= 0) { tick = 0.4; c.hitR(gr.position, r + 0.4, o.mul ?? 0.12, { kb: 0.4, stun: o.stun ?? 0.3, ...(o.x || {}) }); } }); return gr; }
// ---------- small reusable visuals ----------
const TX = {};
function textTex(s, fill, edge) { const k = s + fill + edge; if (TX[k]) return TX[k]; const c = document.createElement('canvas'); c.width = 512; c.height = 192; const x = c.getContext('2d');
  let fs = 150; x.font = `italic 900 ${fs}px "Arial Black", Impact, sans-serif`; while (x.measureText(s).width > 470 && fs > 40) { fs -= 8; x.font = `italic 900 ${fs}px "Arial Black", Impact, sans-serif`; }
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; x.lineWidth = Math.max(10, fs * 0.2); x.strokeStyle = edge; x.strokeText(s, 256, 100); const gr = x.createLinearGradient(0, 30, 0, 170); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, fill); gr.addColorStop(1, fill); x.fillStyle = gr; x.fillText(s, 256, 100);
  const t = new B.CanvasTexture(c); t.colorSpace = B.SRGBColorSpace; return TX[k] = t; }
// comic onomatopoeia ("DOOON!!") that pops at a world point
export function word(g, pos, s, fill = '#ffe14a', size = 2.4, dur = 0.8, edge = '#1a0a04') { if (busy(g, 260)) return; const sp = new B.Sprite(own(new B.SpriteMaterial({ map: textTex(s, fill, edge), transparent: true, depthTest: false, depthWrite: false }))); sp.position.copy(pos); sp.renderOrder = 998; const rot = R(0.25);
  run(g, sp, dur, t => { const k = t < 0.12 ? 0.3 + t / 0.12 * 1.0 : t < 0.22 ? 1.3 - (t - 0.12) * 3 : 1 + (t - 0.22) * 0.12; sp.scale.set(size * k * 2.67, size * k, 1); sp.material.opacity = t > 0.72 ? (1 - t) / 0.28 : 1; sp.material.rotation = rot + Math.sin(t * 40) * 0.04 * (1 - t); }); }
// puffy toon cloud / steam
export function puff(g, p, s = 1, dur = 0.9, o = {}) { if (busy(g, o.force ? 300 : 230)) return; const gr = group(); const m = M.toon(o.col ?? 0xffffff, { emissive: o.em ?? 0x6a6a72, transparent: true });
  const n = qv().parts < 0.5 ? 3 : 5; for (let i = 0; i < n; i++) outline(mesh(G.lsph(), m, gr, R(0.55), R(0.3), R(0.55), 0.45 + Math.random() * 0.35), 1.08);
  gr.position.copy(p); const vel = o.vel || V(R(0.4), 1.4, R(0.4)); gr.rotation.y = Math.random() * 6;
  run(g, gr, dur, (t, dt) => { gr.position.addScaledVector(vel, dt); vel.multiplyScalar(1 - dt * 1.5); gr.scale.setScalar(Math.max(0.001, s * (0.35 + 0.65 * ease(Math.min(1, t * 3))) * (t > 0.6 ? 1 - (t - 0.6) / 0.4 * 0.9 : 1))); m.opacity = t > 0.65 ? (1 - t) / 0.35 : 1; }); return gr; }
// comic impact star (flat, camera facing)
export function star(g, p, col = 0xfff27a, r = 3, dur = 0.3) { const nk = g.cam ? Math.max(0.2, Math.min(1, p.distanceTo(g.cam.position) / (r * 1.4 + 0.01))) : 1; r *= nk; const m = M.glow(col, nk); const s = mesh(G.star(), m, null); s.position.copy(p); s.quaternion.copy(g.cam.quaternion); s.rotateZ(Math.random() * 3);
  const w = M.glow(0xffffff, 1); const s2 = mesh(G.star(), w, s, 0, 0, 0.01, 0.55); run(g, s, dur, t => { s.scale.setScalar(Math.max(0.001, r * (0.3 + ease(t) * 0.9))); m.opacity = (1 - t) * nk; w.opacity = (1 - t) * nk; }); }
export function boom(c, p, col, r = 3, o = {}) { const g = c.g; g.fx.orb(p, 0xffffff, r * 0.35, 0.12); g.fx.shock(p, col, r * 1.3, 0.35, 1); g.fx.shock(p, 0xffffff, r * 0.8, 0.25, 0.8); g.fx.ring(c.ground(p.clone()).setY(g.groundAt(p.x, p.z) + 0.15), col, r * 1.6, 0.5); g.fx.sparks(p, 18, o.spark ?? 0xffffff, { speed: 14, life: 0.35 }); star(g, p, o.star ?? 0xffe14a, r * 0.9, 0.28); if (o.dust !== false) for (let i = 0; i < 3; i++) puff(g, c.ground(p.clone().add(V(R(r * 0.6), 0, R(r * 0.6)))).add(V(0, 0.4, 0)), r * 0.35, 0.9, { col: o.dustCol ?? 0xe8e0d0, em: 0x4a4038, vel: V(R(3), 1.5, R(3)) }); }
// a ring that travels/expands (sound waves, ripples). dir null = ground ring
export function wave(g, p, dir, col, r0, r1, dur, o = {}) { const m = M.glow(col, o.op ?? 0.9); const ms = mesh(o.fat ? G.ftorus() : G.torus(), m, null); ms.position.copy(p); if (dir) ms.lookAt(p.clone().add(dir)); else ms.rotation.x = Math.PI / 2; const v = o.vel;
  run(g, ms, dur, (t, dt) => { const k = r0 + (r1 - r0) * ease(t); ms.scale.set(k, k, o.th ?? Math.max(1, k * 0.6)); if (v) ms.position.addScaledVector(v, dt); m.opacity = (o.op ?? 0.9) * (1 - t); }); return ms; }
// ---------- shaped meshes ----------
export function fist(col = 0xf6cfa8, o = {}) { const gr = group(); const m = M.toon(col, { emissive: o.em ?? 0x2a1a10 }); const k = o.outline ?? 1.1;
  outline(mesh(G.sph(), m, gr, 0, 0, 0, 0.62, 0.55, 0.6), k);
  for (let i = 0; i < 4; i++) { const x = -0.39 + i * 0.26; outline(mesh(G.sph(), m, gr, x, 0.17 - Math.abs(i - 1.5) * 0.04, 0.44, 0.15, 0.17, 0.2), k); outline(mesh(G.sph(), m, gr, x, -0.13, 0.4, 0.13, 0.15, 0.18), k); }
  const th = outline(mesh(G.sph(), m, gr, 0.5, -0.15, 0.22, 0.15, 0.13, 0.3), k); th.rotation.y = -0.4;
  if (o.cuff != null) outline(mesh(G.zcylc(), M.toon(o.cuff), gr, 0, 0, -0.62, 0.42, 0.42, 0.25), k);
  return gr; }
// segmented arm between two points with rubber wobble
export function arm(g, col = 0xf6cfa8, n = 7) { const gr = group(); const m = M.toon(col, { emissive: 0x2a1a10 }); const segs = []; for (let i = 0; i < n; i++) segs.push(outline(mesh(G.zcylc(), m, gr), 1.15)); gr.userData.segs = segs; return gr; }
const _q = V(), _a = V(), _b = V();
export function setArm(armG, a, b, r, wob = 0, ph = 0, up = V(0, 1, 0)) { const segs = armG.userData.segs, n = segs.length; const d = b.clone().sub(a); const L = d.length(); const side = d.clone().cross(up).normalize(); if (!isFinite(side.x) || side.lengthSq() < 0.1) side.set(1, 0, 0);
  const pt = (u, out) => out.copy(a).addScaledVector(d, u).addScaledVector(side, Math.sin(u * Math.PI) * wob * Math.sin(ph + u * 7)).addScaledVector(up, Math.sin(u * Math.PI) * wob * 0.5 * Math.cos(ph * 1.3 + u * 5));
  for (let i = 0; i < n; i++) { pt(i / n, _a); pt((i + 1) / n, _b); const s = segs[i]; s.position.copy(_a).add(_b).multiplyScalar(0.5); s.lookAt(_b); const rr = r * (1 - i / n * 0.15); s.scale.set(rr, rr, Math.max(0.001, _a.distanceTo(_b) * 1.15)); } }
// flame comet: bright core + tapered flame tail (points back along -Z)
export function flame(col = 0xff6a1a, core = 0xfff2b0, s = 1) { const gr = group(); mesh(G.sph(), M.glow(core, 1), gr, 0, 0, 0, 0.35 * s); mesh(G.zcone(), M.glow(col, 0.85), gr, 0, 0, -0.9 * s, 0.5 * s, 0.5 * s, -1.9 * s); mesh(G.zcone(), M.glow(0xffd060, 0.8), gr, 0, 0, -0.5 * s, 0.3 * s, 0.3 * s, -1.1 * s); mesh(G.sph(), M.glow(col, 0.5), gr, 0, 0, 0, 0.6 * s, 0.6 * s, 0.75 * s); return gr; }
export function crystal(col = 0xbfeaff, s = 1, o = {}) { const gr = group(); outline(mesh(G.oct(), M.toon(col, { emissive: o.em ?? 0x2a5a8a, transparent: o.op != null, opacity: o.op ?? 1 }), gr, 0, 0, 0, 0.3 * s, 0.3 * s, (o.len ?? 1.3) * s), 1.12); mesh(G.oct(), M.glow(o.glow ?? 0x9ad8ff, 0.35), gr, 0, 0, 0, 0.42 * s, 0.42 * s, (o.len ?? 1.3) * 1.2 * s); return gr; }
export function rock(col = 0x5a3a2a, glowC = 0xff5a1a, s = 1) { const gr = group(); const r = outline(mesh(G.ico(), M.toon(col, { emissive: glowC, emissiveIntensity: 0.25 }), gr, 0, 0, 0, s), 1.1); r.rotation.set(Math.random() * 3, Math.random() * 3, 0); mesh(G.ico(), M.glow(glowC, 0.45), gr, 0, 0, 0, s * 1.2); return gr; }
export function note(col = 0x5affd8, s = 1) { const gr = group(); const m = M.toon(col, { emissive: col, emissiveIntensity: 0.6 }); const hd = outline(mesh(G.sph(), m, gr, 0, 0, 0, 0.36 * s, 0.26 * s, 0.22 * s), 1.15); hd.rotation.z = 0.45; outline(mesh(G.box(), m, gr, 0.3 * s, 0.6 * s, 0, 0.08 * s, 1.2 * s, 0.08 * s), 1.2);
  const fl = outline(mesh(G.box(), m, gr, 0.48 * s, 1.0 * s, 0, 0.4 * s, 0.1 * s, 0.07 * s), 1.2); fl.rotation.z = -0.7; mesh(G.sph(), M.glow(col, 0.35), gr, 0.1 * s, 0.4 * s, 0, 0.75 * s); return gr; }
// the Azure Dragon: instanced segmented body + detailed head (horns, whiskers, jaw, mane, eyes). path(u) gives the spine point (u=0 head)
export function dragon(g, o = {}) { const n = o.n ?? 20, s = o.s ?? 1; const root = group(); const col = o.col ?? 0x2a6cff;
  const bodyM = M.toon(col, { emissive: 0x0a1a5a }); const finM = M.toon(o.fin ?? 0x7ad8ff, { emissive: 0x1a4a7a }); const bellyM = M.toon(0xf2e6b0, { emissive: 0x3a3010 });
  const body = new B.InstancedMesh(G.sph(), bodyM, n); const fins = new B.InstancedMesh(G.cone(), finM, n); const belly = new B.InstancedMesh(G.lsph(), bellyM, n); body.frustumCulled = fins.frustumCulled = belly.frustumCulled = false; root.add(body, fins, belly);
  let ol = null; if (qv().outline) { ol = new B.InstancedMesh(G.lsph(), OUTLINE_MAT, n); ol.frustumCulled = false; root.add(ol); }
  const head = group(); root.add(head); const hm = M.toon(col, { emissive: 0x0a1a5a }); const gold = M.toon(0xffd860, { emissive: 0x5a3a00 });
  outline(mesh(G.sph(), hm, head, 0, 0.1, 0, 0.62, 0.5, 0.7)); outline(mesh(G.box(), hm, head, 0, 0.06, 0.75, 0.62, 0.32, 0.95)); // skull + upper snout
  const jaw = group(); jaw.position.set(0, -0.15, 0.25); head.add(jaw); outline(mesh(G.box(), bellyM, jaw, 0, -0.08, 0.45, 0.52, 0.16, 0.9));
  const teethM = M.toon(0xffffff); for (let i = 0; i < 5; i++) { const t2 = mesh(G.cone(), teethM, head, -0.24 + i * 0.12, -0.14, 1.1 - Math.abs(i - 2) * 0.06, 0.04, 0.14, 0.04); t2.rotation.x = Math.PI; }
  for (const sx of [-1, 1]) { const h = outline(mesh(G.cone(), gold, head, sx * 0.3, 0.55, -0.25, 0.08, 0.9, 0.08)); h.rotation.set(-0.9, 0, sx * -0.35); const h2 = mesh(G.cone(), gold, head, sx * 0.42, 0.75, -0.55, 0.05, 0.4, 0.05); h2.rotation.set(-0.3, 0, sx * -0.9);
    const w = mesh(G.zcone(), gold, head, sx * 0.3, -0.02, 1.0, 0.03, 0.03, -1.6); w.rotation.y = sx * 0.6; mesh(G.sph(), M.glow(0xffe060, 1), head, sx * 0.3, 0.28, 0.32, 0.1, 0.09, 0.08); mesh(G.sph(), M.flat(0x101010), head, sx * 0.33, 0.29, 0.38, 0.04, 0.05, 0.04);
    for (let k = 0; k < 3; k++) { const mn = mesh(G.cone(), finM, head, sx * (0.35 + k * 0.08), 0.15 - k * 0.12, -0.5 - k * 0.1, 0.1, 0.55, 0.1); mn.rotation.set(-1.9, 0, sx * -0.8); } }
  const mouth = group(); mouth.position.set(0, -0.1, 1.3); head.add(mouth);
  const D = new B.Object3D(); const pts = []; for (let i = 0; i < n; i++) pts.push(V());
  const hs = s * (o.head ?? 1.15); const api = { root, head, jaw, mouth, n, s, open: 0, k: 1,
    set(path, time = 0) { for (let i = 0; i < n; i++) path(i / (n - 1), pts[i], i); const hd = pts[0], nx = pts[1]; head.position.copy(hd); head.scale.setScalar(Math.max(0.001, hs * api.k)); head.lookAt(_q.copy(hd).multiplyScalar(2).sub(nx)); jaw.rotation.x = 0.1 + api.open * 0.75;
      for (let i = 0; i < n; i++) { const p = pts[i], q = pts[Math.min(n - 1, i + 1)], pp = pts[Math.max(0, i - 1)]; const u = i / (n - 1); const r = s * 0.5 * (1 - u * 0.7) * (i === 0 ? 0.8 : 1) * (1 + 0.05 * Math.sin(time * 6 + i)) * Math.max(0.001, api.k);
        D.position.copy(p); D.lookAt(_a.copy(pp).sub(q).add(p)); D.scale.set(r, r, r * 1.35); D.updateMatrix(); body.setMatrixAt(i, D.matrix); if (ol) { D.scale.set(r * 1.12, r * 1.12, r * 1.5); D.updateMatrix(); ol.setMatrixAt(i, D.matrix); }
        D.scale.set(r * 0.72, r * 0.62, r * 1.3); D.position.y -= r * 0.4; D.updateMatrix(); belly.setMatrixAt(i, D.matrix); D.position.copy(p); D.position.y += r * 0.85; D.scale.set(r * 0.28, r * (i % 2 ? 0.8 : 1.15) * (u > 0.92 ? 2.2 : 1), r * 0.5); D.rotation.x -= 0.5; D.updateMatrix(); fins.setMatrixAt(i, D.matrix); }
      body.instanceMatrix.needsUpdate = fins.instanceMatrix.needsUpdate = belly.instanceMatrix.needsUpdate = true; if (ol) ol.instanceMatrix.needsUpdate = true; },
    mouthPos(out = V()) { head.updateMatrixWorld(true); return mouth.getWorldPosition(out); },
  };
  return api; }
// ice wolf: icy toon body with glowing frost shell, animated legs. faces +Z
export function wolf(o = {}) { const gr = group(); const s = o.s ?? 1; const m = M.toon(o.col ?? 0xeaf7ff, { emissive: o.em ?? 0x3a6a9a, transparent: o.op != null, opacity: o.op ?? 1 }); const dk = M.toon(0x8ac8ff, { emissive: 0x2a5a9a }); const gl = M.glow(o.glow ?? 0x7ad0ff, 0.28);
  const body = group(); gr.add(body); outline(mesh(G.sph(), m, body, 0, 0.95, 0, 0.42, 0.42, 0.85), 1.1); outline(mesh(G.sph(), m, body, 0, 1.05, 0.55, 0.46, 0.52, 0.48), 1.1); mesh(G.sph(), gl, body, 0, 1.0, 0.2, 0.62, 0.62, 1.15);
  const head = group(); head.position.set(0, 1.42, 0.98); body.add(head); outline(mesh(G.sph(), m, head, 0, 0, 0, 0.3, 0.28, 0.32), 1.1); outline(mesh(G.box(), m, head, 0, -0.06, 0.32, 0.2, 0.17, 0.36), 1.12); mesh(G.box(), dk, head, 0, -0.01, 0.51, 0.08, 0.07, 0.04);
  const jaw = group(); jaw.position.set(0, -0.14, 0.15); head.add(jaw); outline(mesh(G.box(), m, jaw, 0, -0.02, 0.18, 0.17, 0.07, 0.3), 1.12);
  for (const sx of [-1, 1]) { const e = outline(mesh(G.cone(), m, head, sx * 0.16, 0.3, -0.06, 0.08, 0.26, 0.06), 1.15); e.rotation.z = sx * -0.3; mesh(G.sph(), M.glow(0x5ac8ff, 1), head, sx * 0.13, 0.08, 0.24, 0.05, 0.035, 0.03); mesh(G.cone(), M.toon(0xffffff), jaw, sx * 0.06, 0.04, 0.3, 0.025, 0.08, 0.025); }
  for (let i = 0; i < 5; i++) { const sp = mesh(G.cone(), dk, body, 0, 1.3 - i * 0.04, 0.5 - i * 0.28, 0.07, 0.32, 0.07); sp.rotation.x = -0.9; }
  const tail = group(); tail.position.set(0, 1.1, -0.8); body.add(tail); const tl = outline(mesh(G.cone(), m, tail, 0, 0, -0.4, 0.18, 0.9, 0.18), 1.1); tl.rotation.x = -1.9;
  const legs = []; for (const [x, z] of [[-0.22, 0.55], [0.22, 0.55], [-0.22, -0.5], [0.22, -0.5]]) { const L = group(); L.position.set(x, 0.85, z); body.add(L); outline(mesh(G.cyl(), m, L, 0, -0.38, 0, 0.1, 0.8, 0.1), 1.15); mesh(G.sph(), m, L, 0, -0.8, 0.05, 0.12, 0.08, 0.15); legs.push(L); }
  gr.scale.setScalar(s); gr.userData = { body, head, jaw, tail, legs, m };
  gr.userData.anim = (ph, run = 1, open = 0) => { legs.forEach((L, i) => { L.rotation.x = Math.sin(ph + (i % 2 ? Math.PI : 0) + (i > 1 ? 0.8 : 0)) * 0.9 * run; }); body.position.y = Math.abs(Math.sin(ph)) * 0.12 * run; body.rotation.x = Math.sin(ph) * 0.06 * run; tail.rotation.x = Math.sin(ph * 0.5) * 0.3; jaw.rotation.x = open * 0.7; };
  return gr; }
// taiko drum for Drums of Liberation
export function drum(s = 1) { const gr = group(); const red = M.toon(0xb02a2a, { emissive: 0x3a0a0a }); const skin = M.toon(0xfff4e0, { emissive: 0x5a5040 }); const rope = M.toon(0xffd860, { emissive: 0x4a3a00 });
  outline(mesh(G.cyl(), red, gr, 0, 0, 0, 1, 1.1, 1), 1.06); mesh(G.cyl(), skin, gr, 0, 0.56, 0, 0.92, 0.04, 0.92); mesh(G.cyl(), skin, gr, 0, -0.56, 0, 0.92, 0.04, 0.92);
  for (const y of [0.42, -0.42]) { const t = mesh(G.ftorus(), rope, gr, 0, y, 0, 1.02, 1.02, 0.6); t.rotation.x = Math.PI / 2; } const tm = mesh(G.sph(), M.flat(0x1a0a04), gr, 0, 0.59, 0, 0.35, 0.01, 0.35); gr.scale.setScalar(s); return gr; }
// Kaido's spiked kanabo club; handle at origin, head along +Y
export function club(s = 1) { const gr = group(); const iron = M.toon(0x3a3a46, { emissive: 0x10101a }); const stud = M.toon(0xc8c8d8, { emissive: 0x2a2a3a }); const wrap = M.toon(0x8a1a2a);
  outline(mesh(G.cyl(), wrap, gr, 0, 0.6, 0, 0.16, 1.2, 0.16)); const hd = new B.CylinderGeometry(0.55, 0.28, 4.2, 10); const h = outline(mesh(hd, iron, gr, 0, 3.3, 0)); h.userData.ownGeo = 1;
  for (let i = 0; i < 24; i++) { const a = i * 2.4, y = 1.6 + (i % 8) * 0.48, r = 0.3 + (y - 1.2) / 4.2 * 0.27; const st = mesh(G.cone(), stud, gr, Math.cos(a) * r, y, Math.sin(a) * r, 0.08, 0.26, 0.08); st.lookAt(st.position.clone().multiplyScalar(2).setY(y)); st.rotateX(Math.PI / 2); }
  gr.scale.setScalar(s); return gr; }
// equalizer bars around a point (sound)
export function eq(n = 16, r = 3.5, cols = [0x18e0c8, 0xff5ad0]) { const gr = group(); const bars = []; for (let i = 0; i < n; i++) { const a = i / n * 6.283; const c = new B.Color(cols[0]).lerp(new B.Color(cols[1]), (Math.sin(a) + 1) / 2); const b = mesh(G.box(), M.toon(c.getHex(), { emissive: c.getHex(), emissiveIntensity: 0.55 }), gr, Math.cos(a) * r, 0, Math.sin(a) * r, 0.35, 1, 0.35); b.rotation.y = -a; outline(b, 1.1); bars.push(b); } gr.userData.bars = bars; return gr; }
// sine waveform line (oscilloscope look); update with setWave
export function waveLine(col, n = 64) { const geo = new B.BufferGeometry(); geo.setAttribute('position', new B.BufferAttribute(new Float32Array(n * 3), 3)); const l = new B.Line(geo, own(new B.LineBasicMaterial({ color: col, transparent: true, blending: B.AdditiveBlending, depthWrite: false }))); l.userData.ownGeo = 1; l.frustumCulled = false; l.userData.n = n; return l; }
export function setWave(l, a, d, len, amp, freq, ph, side) { const n = l.userData.n, P = l.geometry.attributes.position; for (let i = 0; i < n; i++) { const u = i / (n - 1); const k = Math.sin(u * Math.PI); const w = Math.sin(u * freq + ph) * amp * k; P.setXYZ(i, a.x + d.x * len * u + side.x * w, a.y + d.y * len * u + side.y * w + Math.cos(u * freq * 0.5 + ph) * amp * 0.4 * k, a.z + d.z * len * u + side.z * w); } P.needsUpdate = true; }
