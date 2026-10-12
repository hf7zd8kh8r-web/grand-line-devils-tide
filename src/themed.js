// Element-themed fruit moves for every non-Ultra fruit: each fruit gets a projectile SHAPE (flame comet, crystal, magma rock,
// light streak, lightning, cloud, black vortex, thorn, crescent blade, bubble, shock ring, fist, spirit wisp, coin, claw,
// barrier hex, feather, paw) and a MECHANIC that comes with it (burn zone, freeze, chain lightning, pull, root, knock-up...).
// The 9 move kinds (proj aoe dash beam rain barrage blink wave orbit) are rebuilt around that shape. Also the dispatcher
// used by castMove/castSpecial and by co-op peers (visual-only replay).
import { THREE } from './engine.js';
import { audio } from './audio.js';
import { FRUITS } from './data.js';
import { elementOf } from './elements.js';
import { V, G, M, R, group, mesh, outline, run, after, busy, freeze, pull, chain, zone, word, puff, star, boom, wave, fist, flame, crystal, rock, cleanup, ctxFor } from './skills.js';
import { ULTRA, ULTRA_SP, ULTRA_STYLE, showBody, spike } from './ultra.js';
import { CANON, CANON_SP } from './canon.js';
const B = THREE; const clamp01 = x => Math.max(0, Math.min(1, x));
const T = {}; const th = (s, c1, c2, ids) => ids.split(' ').forEach(id => { T[id] = { s, c1, c2 }; });
th('flame', 0xff6a1a, 0xffd060, 'mera atsu'); th('flame', 0x3ad0ff, 0xffe060, 'phoenix'); th('flame', 0xff9a3a, 0xfff0a0, 'bomu');
th('rock', 0x4a2a1a, 0xff4a1a, 'magu'); th('rock', 0x8a8a9a, 0xd8e8ff, 'kilo ton baku sui fuwa jiki'); th('rock', 0x7a8a5a, 0xe0d0a0, 'brachio'); th('rock', 0xe0b070, 0xffe0a0, 'bisu'); th('rock', 0x5a5a62, 0xff8a3a, 'shiro');
th('shard', 0xbfe8ff, 0x5ab0ff, 'hie yuki'); th('shard', 0xe0f0ff, 0xb07aff, 'mira'); th('shard', 0xf8f0d0, 0xc0a060, 'doru'); th('shard', 0xff9ad0, 0x7ad0ff, 'pero');
th('streak', 0xfff27a, 0xffffff, 'pika'); th('streak', 0xffd040, 0xfff6c0, 'buddha'); th('streak', 0xc0a0ff, 0xffffff, 'noro');
th('bolt', 0x9ad4ff, 0xffffff, 'goro');
th('vortex', 0x1a0a2a, 0x8a3aff, 'yami'); th('vortex', 0x1a0a3a, 0x6a3aff, 'zushi'); th('vortex', 0x2a1a3a, 0xb08aff, 'kage');
th('ring', 0xffffff, 0xd8e8ff, 'gura'); th('ring', 0xf0e0a0, 0x6a5aa0, 'toki'); th('ring', 0xe0e8f0, 0x9aa8c0, 'nagi sube');
th('cloud', 0xe8e8e8, 0xffffff, 'moku'); th('cloud', 0xb090f0, 0xff9a3a, 'gasu'); th('cloud', 0xe8c890, 0xa08050, 'suna'); th('cloud', 0x6a5a3a, 0x8a7a4a, 'numa'); th('cloud', 0xc0602a, 0x5a2a10, 'sabi'); th('cloud', 0x9a3aff, 0xe0b0ff, 'doku'); th('cloud', 0x8ad04a, 0x3a6a1a, 'beta');
th('bubble', 0xc0f0ff, 0x6ab0ff, 'awa woshu');
th('thorn', 0x4ad84a, 0x8a5a2a, 'mori'); th('thorn', 0x9a6ab0, 0xe0d0ff, 'toge');
th('string', 0xffffff, 0xff6a8a, 'ito'); th('string', 0xe8e8e8, 0x6a2a2a, 'kumo'); th('string', 0x9a9aaa, 0xc0a060, 'ori');
th('blade', 0x7ad0ff, 0xffffff, 'ope supa');
th('fist', 0xfff0e0, 0xe0c0a0, 'mochi'); th('fist', 0xf6cfa8, 0xffffff, 'bane mane bara'); th('fist', 0xffb0d0, 0xff90c0, 'hana'); th('fist', 0xc8b8a8, 0xffffff, 'onyudo');
th('paw', 0xf0d0b0, 0xff9ab0, 'nikyu');
th('wisp', 0x9ad8ff, 0xffffff, 'thunderbird'); th('wisp', 0xf4c0f0, 0xffffff, 'horo'); th('wisp', 0xff5ab0, 0xffd0f0, 'mero horu'); th('wisp', 0xffb0e0, 0xffe060, 'soru'); th('wisp', 0xff7ab0, 0xb07aff, 'kitsune');
th('coin', 0xffd04a, 0xa07a1a, 'beri goru'); th('coin', 0xffd0a0, 0xe06a8a, 'hobi');
th('hex', 0x9ad4ff, 0xffffff, 'bari'); th('hex', 0xd0a070, 0xffe0b0, 'doa');
th('claw', 0xe0b050, 0x9ad4ff, 'raijin'); th('claw', 0x8aaa4a, 0xc0ff60, 'orochi'); th('claw', 0x3a9a8a, 0x9ad4ff, 'leviathan');
th('feather', 0xf2f2ff, 0xffe080, 'pegasus'); th('feather', 0x9a7a5a, 0xffd0a0, 'ptera');
export function themeOf(id) { if (T[id]) return T[id]; const f = FRUITS[id]; const el = elementOf(id); const c1 = f ? f.col[0] : 0xffffff, c2 = f ? f.col[1] : 0xffffff;
  return { s: { fire: 'flame', magma: 'rock', ice: 'shard', light: 'streak', lightning: 'bolt', dark: 'vortex', quake: 'ring', smoke: 'cloud', sand: 'cloud', poison: 'cloud', plant: 'thorn', beast: 'claw', rubber: 'fist', sound: 'ring' }[el] || 'shard', c1, c2 }; }
const MECH = { flame: 'burn', rock: 'heavy', shard: 'pierce', streak: 'pierce', bolt: 'chain', cloud: 'zone', vortex: 'pull', thorn: 'root', blade: 'pierce', bubble: 'trap', ring: 'stagger', fist: 'knock', wisp: 'home', coin: 'scatter', claw: 'multi', hex: 'guard', feather: 'home', paw: 'knock', string: 'root' };
const isIce = id => elementOf(id) === 'ice';
// ---------- shape meshes (all face +Z = direction of travel) ----------
export function shapeMesh(Th, s = 1) { const { c1, c2 } = Th; const gr = group();
  switch (Th.s) {
    case 'flame': return flame(c1, 0xfff2b0, s * 0.9);
    case 'rock': return rock(c1, c2, 0.55 * s);
    case 'shard': return crystal(c1, s * 0.9, { glow: c2, em: new B.Color(c2).multiplyScalar(0.35).getHex() });
    case 'streak': mesh(G.zcyl(), M.glow(0xffffff, 1), gr, 0, 0, -1.1 * s, 0.09 * s, 0.09 * s, 2.4 * s); mesh(G.zcyl(), M.glow(c1, 0.7), gr, 0, 0, -1.2 * s, 0.26 * s, 0.26 * s, 2.6 * s); mesh(G.sph(), M.glow(c2, 1), gr, 0, 0, 0, 0.22 * s); return gr;
    case 'bolt': mesh(G.oct(), M.glow(0xffffff, 1), gr, 0, 0, 0, 0.18 * s, 0.18 * s, 0.6 * s); mesh(G.sph(), M.glow(c1, 0.45), gr, 0, 0, 0, 0.45 * s); return gr;
    case 'cloud': { const m = M.toon(c1, { emissive: new B.Color(c1).multiplyScalar(0.35).getHex() }); for (let i = 0; i < 4; i++) outline(mesh(G.lsph(), m, gr, R(0.35 * s), R(0.2 * s), R(0.35 * s), (0.35 + Math.random() * 0.2) * s), 1.08); return gr; }
    case 'vortex': mesh(G.sph(), M.flat(c1), gr, 0, 0, 0, 0.32 * s); mesh(G.torus(), M.glow(c2, 0.9), gr, 0, 0, 0, 0.6 * s, 0.6 * s, 2); const t2 = mesh(G.torus(), M.glow(c2, 0.6), gr, 0, 0, 0, 0.85 * s, 0.85 * s, 2); t2.rotation.x = 1.2; return gr;
    case 'thorn': outline(mesh(G.zcone(), M.toon(c1, { emissive: new B.Color(c1).multiplyScalar(0.2).getHex() }), gr, 0, 0, 0, 0.22 * s, 0.22 * s, 1.6 * s), 1.1); for (const k of [-1, 1]) { const l = mesh(G.sph(), M.toon(c2), gr, k * 0.2 * s, 0, -0.4 * s, 0.18 * s, 0.05 * s, 0.32 * s); l.rotation.y = k * 0.6; } return gr;
    case 'string': for (let i = 0; i < 5; i++) mesh(G.zcyl(), M.glow(i % 2 ? c2 : c1, 0.9), gr, R(0.25 * s), R(0.25 * s), -0.8 * s, 0.025 * s, 0.025 * s, 2.2 * s); return gr;
    case 'blade': mesh(G.arc(), M.glow(c1, 0.9), gr, 0, 0, 0, 1.1 * s, 1.1 * s, 1.5); mesh(G.arc(), M.glow(c2, 1), gr, 0, 0.02, 0, 1.05 * s, 1.05 * s, 0.5); gr.children.forEach(m => { m.rotation.z = -Math.PI / 2; }); return gr;
    case 'bubble': mesh(G.sph(), M.glow(c1, 0.32), gr, 0, 0, 0, 0.5 * s); mesh(G.torus(), M.glow(c2, 0.7), gr, 0, 0, 0, 0.5 * s, 0.5 * s, 1); mesh(G.sph(), M.glow(0xffffff, 0.9), gr, 0.18 * s, 0.2 * s, 0.3 * s, 0.09 * s); return gr;
    case 'ring': mesh(G.ftorus(), M.glow(c1, 0.85), gr, 0, 0, 0, 0.7 * s, 0.7 * s, 1); mesh(G.torus(), M.glow(c2, 0.8), gr, 0, 0, -0.3 * s, 0.45 * s, 0.45 * s, 2); return gr;
    case 'fist': { const f = fist(c1); f.scale.setScalar(0.75 * s); return f; }
    case 'paw': { const m = M.toon(c1, { emissive: 0x3a2a20 }); const pm = M.toon(c2, { emissive: 0x5a2a3a }); outline(mesh(G.cyl(), m, gr, 0, 0, 0, 0.6 * s, 0.12 * s, 0.6 * s), 1.08).rotation.x = Math.PI / 2; mesh(G.cyl(), pm, gr, 0, -0.1 * s, 0.07 * s, 0.32 * s, 0.04 * s, 0.26 * s).rotation.x = Math.PI / 2;
      for (let i = 0; i < 4; i++) { const a = -0.9 + i * 0.6; mesh(G.cyl(), pm, gr, Math.sin(a) * 0.4 * s, Math.cos(a) * 0.38 * s, 0.07 * s, 0.11 * s, 0.04 * s, 0.11 * s).rotation.x = Math.PI / 2; } return gr; }
    case 'wisp': { const f = flame(c1, c2, s * 0.75); mesh(G.sph(), M.flat(0x1a0a2a), f, -0.1 * s, 0.06 * s, 0.24 * s, 0.05 * s); mesh(G.sph(), M.flat(0x1a0a2a), f, 0.1 * s, 0.06 * s, 0.24 * s, 0.05 * s); return f; }
    case 'coin': { const cm = outline(mesh(G.cyl(), M.toon(c1, { emissive: 0x5a3a00 }), gr, 0, 0, 0, 0.45 * s, 0.08 * s, 0.45 * s), 1.1); cm.rotation.x = Math.PI / 2; mesh(G.cyl(), M.toon(c2), gr, 0, 0, 0.05 * s, 0.28 * s, 0.02 * s, 0.28 * s).rotation.x = Math.PI / 2; return gr; }
    case 'claw': for (let i = -1; i <= 1; i++) { const b = mesh(G.box(), M.glow(i ? c1 : c2, 0.95), gr, i * 0.3 * s, 0, 0, 0.07 * s, 1.5 * s, 0.07 * s); b.rotation.z = i * 0.18; } return gr;
    case 'hex': mesh(G.hex(), M.glow(c1, 0.55), gr, 0, 0, 0, 0.8 * s); const e = mesh(G.torus(), M.glow(c2, 0.9), gr, 0, 0, 0, 0.8 * s, 0.8 * s, 1); return gr;
    case 'feather': { const m = M.toon(c1, { emissive: new B.Color(c1).multiplyScalar(0.25).getHex() }); outline(mesh(G.sph(), m, gr, 0, 0, 0, 0.22 * s, 0.05 * s, 0.75 * s), 1.1); mesh(G.box(), M.toon(c2), gr, 0, 0.02 * s, 0, 0.02 * s, 0.02 * s, 1.5 * s); return gr; }
  }
  mesh(G.oct(), M.glow(c1, 0.9), gr, 0, 0, 0, 0.3 * s, 0.3 * s, 0.8 * s); return gr; }
// trail particles per shape while flying
function trail(c, Th, p, s) { const g = c.g; const k = Th.s;
  if (k === 'flame' || k === 'wisp') g.fx.burst(p, 2, Math.random() < 0.5 ? Th.c1 : Th.c2, { speed: 1, size: 0.6 * s, life: 0.35, grav: -3, spread: 0.3 });
  else if (k === 'rock') g.fx.burst(p, 1, Th.c2, { speed: 0.8, size: 0.6 * s, life: 0.4, grav: -1, spread: 0.3 });
  else if (k === 'bolt') { if (Math.random() < 0.7) g.fx.zap(p, p.clone().add(V(R(1.5), R(1.5), R(1.5))), Th.c1, 5, 0.1); }
  else if (k === 'cloud') { if (Math.random() < 0.3) g.fx.burst(p, 1, Th.c1, { speed: 0.4, size: 0.9 * s, life: 0.6, grav: 0, spread: 0.5 }); }
  else if (k === 'vortex') g.fx.burst(p, 2, Th.c2, { speed: -1.5, size: 0.4, life: 0.3, grav: 0, spread: 1.2 });
  else if (k === 'ring' || k === 'hex') { if (Math.random() < 0.3) g.fx.shock(p, Th.c1, 0.8 * s, 0.25, 0.5); }
  else if (Math.random() < 0.6) g.fx.burst(p, 1, Th.c2, { speed: 0.5, size: 0.35 * s, life: 0.3, grav: 0, spread: 0.2 }); }
// impact visuals + mechanic + damage
function impact(c, Th, at, r, mul, o = {}) { const g = c.g; const k = Th.s; const ice = isIce(c.fruit); const pw = Math.min(2.5, 0.8 + r * 0.25);
  g.fx.shock(at, Th.c1, r * 1.1, 0.3); g.fx.sparks(at, 8 + r * 2, Th.c2, { speed: 8 + r * 2 }); g.fx.orb(at, Th.c2, r * 0.3, 0.12);
  const x = { kb: 5, from: o.from || at };
  switch (MECH[k]) {
    case 'burn': g.fx.burst(at, 16, Th.c1, { speed: 6, up: 4, size: 0.7, life: 0.6, grav: -4 }); if (o.zone !== false) zone(c, at, r * 0.7, 2.2, Th.c1, { p: Th.c2, mul: 0.08 }); break;
    case 'heavy': x.up = 6; x.kb = 6; for (let i = 0; i < (busy(g) ? 1 : 3); i++) { const rk = rock(Th.c1, Th.c2, 0.25 + Math.random() * 0.2); rk.position.copy(at); const v = V(R(5), 6 + Math.random() * 4, R(5)); run(g, rk, 0.8, (t, dt) => { v.y -= 22 * dt; rk.position.addScaledVector(v, dt); rk.rotation.x += dt * 8; }); } if (o.zone !== false) puff(g, at.clone().add(V(0, 0.3, 0)), r * 0.4, 0.9, { col: 0xd8ccb8, em: 0x4a4038 }); break;
    case 'pierce': if (ice) { x.freeze = 1.2; for (let i = 0; i < 4; i++) spike(c, c.ground(at.clone().add(V(R(r * 0.6), 0, R(r * 0.6)))), 0.8 + Math.random() * r * 0.4, 0.9); } g.fx.sparks(at, 10, 0xffffff, { speed: 7, up: 0.6, life: 0.45, grav: 18 }); break;
    case 'chain': x.stun = 0.5; for (let i = 0; i < 3; i++) g.fx.zap(at, at.clone().add(V(R(r), R(r), R(r))), Th.c1, 7, 0.18); break;
    case 'zone': for (let i = 0; i < 3; i++) puff(g, at.clone().add(V(R(r * 0.5), 0.3, R(r * 0.5))), r * 0.45, 1.1, { col: Th.c1, em: new B.Color(Th.c1).multiplyScalar(0.3).getHex(), vel: V(R(2), 1, R(2)) }); if (o.zone !== false) zone(c, at, r * 0.8, 2.5, Th.c1, { p: Th.c2, mul: 0.07, stun: 0.6, up: 1, size: 0.8 }); break;
    case 'pull': { const ctr = at.clone(); const gr = group(); run(g, gr, 0.9, (t, dt) => { pull(c, ctr, r * 2.2, 7, dt); if (Math.random() < 0.6) g.fx.burst(ctr, 4, Th.c2, { speed: -5, size: 0.5, life: 0.4, grav: 0, spread: r * 2 }); }); g.fx.ring(c.ground(at.clone()).add(V(0, 0.15, 0)), Th.c2, r * 1.6, 0.9); break; }
    case 'root': x.stun = 1.2; x.kb = 1; for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; const p = c.ground(at.clone().add(V(Math.cos(a) * r * 0.4, 0, Math.sin(a) * r * 0.4))); const tn = mesh(G.cone(), M.toon(Th.c1, { emissive: new B.Color(Th.c1).multiplyScalar(0.2).getHex() }), null); tn.position.copy(p); tn.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); run(g, tn, 1.2, t => { const kk = t < 0.12 ? t / 0.12 : t > 0.8 ? (1 - t) / 0.2 : 1; tn.scale.set(0.15 * r * kk + 0.001, 0.9 * r * kk + 0.001, 0.15 * r * kk + 0.001); }); } break;
    case 'trap': x.stun = 1.0; x.kb = 0.5; for (let i = 0; i < 3; i++) after(g, i * 0.07, () => g.fx.shock(at, i % 2 ? 0xffffff : Th.c1, r * (0.6 + i * 0.3), 0.3)); break;
    case 'stagger': x.stun = 0.6; x.kb = 6; for (let i = 0; i < 2; i++) after(g, i * 0.06, () => g.fx.shock(at, i ? Th.c2 : 0xffffff, r * (1 + i * 0.6), 0.35)); if (c.fruit === 'gura') { for (let i = 0; i < 6; i++) g.fx.zap(at, at.clone().add(V(R(r * 1.2), R(r * 1.2), R(r * 1.2))), 0xffffff, 6, 0.3); c.shake(0.4); } break;
    case 'knock': x.kb = 10; x.up = 3; star(g, at, 0xfff27a, r * 0.8, 0.25); if (Math.random() < 0.5) word(g, at.clone().add(V(0, 1.6, 0)), Th.s === 'paw' ? 'POMF!' : 'POW!', '#fff27a', 1.2, 0.5); break;
    case 'scatter': for (let i = 0; i < (busy(g) ? 2 : 5); i++) { const cn = shapeMesh(Th, 0.5); cn.position.copy(at); const v = V(R(5), 5 + Math.random() * 4, R(5)); run(g, cn, 0.8, (t, dt) => { v.y -= 20 * dt; cn.position.addScaledVector(v, dt); cn.rotation.y += dt * 12; }); } break;
    case 'multi': for (let i = 0; i < 3; i++) after(g, i * 0.08, () => { g.fx.zap(at.clone().add(V(R(0.8), 1, R(0.8))), at.clone().add(V(R(0.8), -1, R(0.8))), Th.c1, 3, 0.15); c.hitR(at, r * 0.8, mul * 0.25, { kb: 1, stun: 0.3 }); }); break;
    case 'guard': if (c.local) c.g.p.iframe = Math.max(c.g.p.iframe, 0.5); for (let i = 0; i < 3; i++) { const h = shapeMesh(Th, 0.6); h.position.copy(at); const v = V(R(4), R(4), R(4)); run(g, h, 0.5, (t, dt) => { h.position.addScaledVector(v, dt); h.rotation.z += dt * 6; }); } break;
    case 'home': g.fx.burst(at, 12, Th.c1, { speed: 5, up: 3, size: 0.6, life: 0.5, grav: -3 }); break;
  }
  const L = c.hitR(at, r, mul, { ...x, ...(o.x || {}) }); if (MECH[k] === 'chain' && L.length) chain(c, at.clone().add(V(0, 0.5, 0)), 3, 11, mul * 0.45, Th.c1); return L; }
// own projectile: travels, collides with enemies (homing optional), then impact()
function shoot(c, Th, o) { const g = c.g; const m = shapeMesh(Th, o.s ?? 1); const pos = o.from.clone(); const vel = o.vel.clone(); m.position.copy(pos); m.lookAt(pos.clone().add(vel)); let done = false; const seen = new Set(); let spin = 0;
  run(g, m, o.life ?? 1.2, (t, dt) => { if (done) return; if (o.home && c.local) { let best = null, bd = 0.85; const sp = vel.length(); const dn = vel.clone().normalize(); for (const e of g.enemies) { if (e.dead) continue; const to = g.chest(e, V()).sub(pos); const L = to.length(); if (L > 30) continue; const dd = to.normalize().dot(dn); if (dd > bd) { bd = dd; best = e; } } if (best) vel.lerp(g.chest(best, V()).sub(pos).normalize().multiplyScalar(sp), Math.min(1, dt * o.home)); }
    pos.addScaledVector(vel, dt); m.position.copy(pos); m.lookAt(pos.clone().add(vel)); spin += dt; if (Th.s === 'coin' || Th.s === 'shard' || Th.s === 'hex' || Th.s === 'vortex') m.rotateZ(spin * 8); if (Th.s === 'blade') m.rotateZ(Math.sin(spin * 3) * 0.2); trail(c, Th, pos, o.s ?? 1);
    let hitE = null; for (const e of g.enemies) { if (e.dead || seen.has(e)) continue; if (g.chest(e, V()).distanceTo(pos) < (o.r ?? 1) + (e.boss ? 0.8 : 0.3)) { hitE = e; break; } }
    const gnd = pos.y < g.groundAt(pos.x, pos.z) + 0.1;
    if (hitE && o.pierce) { seen.add(hitE); if (c.local) c.hitE(hitE, o.mul, { kb: 4, ...(o.x || {}) }); if (o.onPierce) o.onPierce(hitE, pos.clone()); g.fx.sparks(pos, 6, Th.c2, { speed: 6 }); }
    else if (hitE || gnd || t >= 1) { done = true; m.visible = false; if (o.onEnd) o.onEnd(pos.clone(), hitE); } }); return m; }
// ---------- the 9 move kinds, themed ----------
function themed(c, kind, Th) { const g = c.g; const s = 1 + c.rar * 0.09; const k = Th.s; const ice = isIce(c.fruit);
  switch (kind) {
    case 'proj': { c.cast(0); const h = c.hand(1); shoot(c, Th, { from: h, vel: c.fwd().multiplyScalar(30), s: 1.7 * s, r: 1.2, life: 1.2, home: k === 'wisp' || k === 'feather' ? 3 : 0, onEnd: (p) => { impact(c, Th, p, 4 + s, 1.0); c.shake(0.35); audio.elementSfx(elementOf(c.fruit), { vol: 0.6 }); } }); break; }
    case 'barrage': { let n = 0, cd = 0; run(g, group(), 1.0, (t, dt) => { if ((cd -= dt) <= 0 && n < 9) { cd = 0.09; n++; c.cast(0); const h = c.hand(n % 2 ? 1 : -1); const tgt = c.aim(35); const v = tgt.sub(h).normalize().add(V(R(0.05), R(0.05), R(0.05))).normalize().multiplyScalar(k === 'streak' ? 55 : 40);
        shoot(c, Th, { from: h, vel: v, s: 0.75 * s, r: 0.9, life: 1.0, home: k === 'wisp' || k === 'feather' ? 5 : 1.5, onEnd: (p, e) => { g.fx.shock(p, Th.c1, 1.2, 0.2); g.fx.sparks(p, 5, Th.c2, { speed: 6 }); if (e) { c.hitE(e, 0.5, { kb: 1.5, stun: MECH[k] === 'root' ? 0.4 : 0.22, freeze: ice && n % 3 === 0 ? 0.8 : 0 }); if (MECH[k] === 'chain' && n % 3 === 0) chain(c, p, 2, 9, 0.25, Th.c1); if (MECH[k] === 'burn' && n % 3 === 0) zone(c, p, 1.6, 1.4, Th.c1, { p: Th.c2, mul: 0.06 }); } } }); } }); break; }
    case 'beam': { c.cast(0); const bm = group(); const core = mesh(G.zcyl(), M.glow(0xffffff, 0.95), bm), mid = mesh(G.zcyl(), M.glow(Th.c2, 0.7), bm), out = mesh(G.zcyl(), M.glow(Th.c1, 0.5), bm); let tick = 0, zt = 0.15; const rings = k === 'ring' || k === 'vortex' || k === 'hex';
      run(g, bm, 1.0, (t, dt, sec) => { const d = c.fwd(); const o = c.hand(1).addScaledVector(d, 0.4); let L = 28; if (c.local) { const h = g.rayEnemy(o, d, 28, 1.3); if (h) L = h.d + 0.5; } for (let q = 2; q < L; q += 0.75) { const p = o.clone().addScaledVector(d, q); if (p.y < g.groundAt(p.x, p.z)) { L = q; break; } } const end = o.clone().addScaledVector(d, L);
        const w = Math.min(1, sec / 0.08) * (t > 0.85 ? (1 - t) / 0.15 : 1) * s; const fl = 1 + Math.sin(sec * 50) * 0.12; for (const [m, r] of [[core, 0.16], [mid, 0.42], [out, 0.8]]) { m.position.copy(o).addScaledVector(d, L / 2); m.lookAt(end); m.scale.set(Math.max(0.01, r * w * fl), Math.max(0.01, r * w * fl), L); }
        if (k === 'bolt') { if (Math.random() < 0.8) g.fx.zap(o, end, Math.random() < 0.5 ? Th.c1 : 0xffffff, 14, 0.08); }
        else if (k === 'flame' || k === 'rock') { for (let i = 0; i < 2; i++) g.fx.burst(o.clone().addScaledVector(d, Math.random() * L), 1, Math.random() < 0.5 ? Th.c1 : Th.c2, { speed: 2, up: 2, size: 0.8, life: 0.4, grav: -3, spread: 0.6 }); }
        else if (k === 'cloud') { if (Math.random() < 0.4) puff(g, o.clone().addScaledVector(d, Math.random() * L), 0.7, 0.7, { col: Th.c1, em: new B.Color(Th.c1).multiplyScalar(0.3).getHex(), vel: d.clone().multiplyScalar(4) }); }
        else if (rings) { if (Math.random() < 0.5) wave(g, o.clone().addScaledVector(d, Math.random() * L), d, Th.c1, 0.4, 1.4, 0.3, { op: 0.7 }); if (k === 'vortex') pull(c, end, 6, 6, dt); }
        else if ((k === 'shard' || k === 'thorn') && Math.random() < 0.35) { const sh = shapeMesh(Th, 0.6); sh.position.copy(o).addScaledVector(d, Math.random() * L).add(V(R(0.6), R(0.6), R(0.6))); sh.lookAt(sh.position.clone().add(V(R(1), R(1), R(1)))); run(g, sh, 0.5, tt => sh.scale.setScalar(Math.max(0.01, 1 - tt))); }
        else g.fx.burst(o.clone().addScaledVector(d, Math.random() * L), 1, Th.c2, { speed: 1, size: 0.5, life: 0.3, grav: 0, spread: 0.4 });
        g.fx.burst(end, 3, Th.c1, { speed: 5, up: 3, size: 0.6, life: 0.4 }); if (MECH[k] === 'burn' && (zt -= dt) <= 0) { zt = 0.35; if (Math.abs(end.y - g.groundAt(end.x, end.z)) < 1.4) zone(c, end, 1.8, 1.4, Th.c1, { p: Th.c2, mul: 0.06 }); }
        if ((tick -= dt) <= 0) { tick = 0.15; for (const e of c.hitLine(o, d, L + 0.5, 1.4, 0.19, { kb: 1.2, stun: 0.25 })) { if (ice && Math.random() < 0.25) freeze(c, e, 1.0); if (k === 'bolt' && Math.random() < 0.3) chain(c, g.chest(e, V()), 2, 8, 0.12, Th.c1); } } c.shake(0.12); }); break; }
    case 'rain': { c.cast(1); const tgt = c.ground(c.aim(32)); let n = 0, cd = 0; const N = 10;
      run(g, group(), 1.4, (t, dt) => { if ((cd -= dt) <= 0 && n < N) { cd = 0.1; n++; const at = c.ground(tgt.clone().add(V(R(5), 0, R(5)))); const last = n === N;
        if (k === 'bolt') { g.fx.zap(at.clone().add(V(R(2), 20, R(2))), at, Th.c1, 12, 0.25); g.fx.zap(at.clone().add(V(R(2), 20, R(2))), at, 0xffffff, 8, 0.15); g.fx.orb(at.clone().add(V(0, 0.5, 0)), Th.c2, 1.6, 0.15); impact(c, Th, at.clone().add(V(0, 0.4, 0)), 2.6, 0.32, { zone: false }); c.shake(0.25); }
        else if (k === 'streak') { g.fx.pillar(at, Th.c1, 0.9, 22, 0.4); g.fx.pillar(at, 0xffffff, 0.35, 22, 0.3); impact(c, Th, at.clone().add(V(0, 0.4, 0)), 2.6, 0.32, { zone: false }); }
        else { const from = at.clone().add(V(R(4), 18, R(4))); const sz = (last ? 2.4 : 1.5) * s; shoot(c, Th, { from, vel: at.clone().sub(from).normalize().multiplyScalar(45), s: sz, r: 0.6, life: 0.8, onEnd: (p) => { impact(c, Th, p.clone().add(V(0, 0.4, 0)), 2.4 + (last ? 1.5 : 0), 0.32, { zone: last || n % 4 === 0 }); c.shake(0.22); } }); } } }); break; }
    case 'aoe': { c.cast(1); const P = c.P(); const gy = g.groundAt(P.x, P.z); const ctr = P.clone().setY(gy); const r = 6.5 * Math.min(1.3, s);
      word(g, ctr.clone().add(V(0, 3.2, 0)).addScaledVector(c.flat(), 3), { flame: 'FWOOSH!', rock: 'DOGOON!', shard: 'PAKIIN!', bolt: 'ZZZAP!', vortex: 'ZUZUZU...', ring: 'GOGOGO!', cloud: 'MOKU!', thorn: 'ZAKU!', bubble: 'POP!', fist: 'DON!', hex: 'BARI!' }[k] || 'BOOM!', '#' + new B.Color(Th.c2).getHexString(), 1.6, 0.7);
      if (k === 'vortex') { const hole = group(); mesh(G.sph(), M.flat(0x050008), hole, 0, 0, 0, 1); const rg = mesh(G.ftorus(), M.glow(Th.c2, 0.85), hole, 0, 0, 0, 1.6, 1.6, 1); const rg2 = mesh(G.torus(), M.glow(0xffffff, 0.6), hole, 0, 0, 0, 2.2, 2.2, 2); const at = ctr.clone().add(V(0, 2.2, 0)).addScaledVector(c.flat(), 3); hole.position.copy(at); let tk = 0;
        run(g, hole, 1.8, (t, dt) => { hole.scale.setScalar(Math.max(0.01, Math.min(1, t * 5) * (t > 0.85 ? (1 - t) / 0.15 : 1)) * 1.2); rg.rotation.z += dt * 6; rg2.rotation.x += dt * 4; hole.quaternion.copy(g.cam.quaternion); pull(c, at, 11, 8, dt); g.fx.burst(at, 3, Th.c2, { speed: -7, size: 0.5, life: 0.4, grav: 0, spread: 9 }); if ((tk -= dt) <= 0) { tk = 0.3; c.hitR(at, 3.5, 0.22, { kb: 0.3, stun: 0.4 }); } if (t >= 1) { boom(c, at, Th.c2, 4, { star: Th.c2, dust: false }); c.hitR(at, 6, 0.6, { kb: 9, up: 5 }); } }); break; }
      if (k === 'shard' || k === 'thorn') { for (let w = 0; w < 3; w++) after(g, w * 0.15, () => { const rr = 2 + w * 2.2; const n = 6 + w * 4; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + w; const p = c.ground(ctr.clone().add(V(Math.cos(a) * rr, 0, Math.sin(a) * rr))); if (k === 'shard') spike(c, p, 1.4 + Math.random() * 1.5, 1.2); else { const tn = mesh(G.cone(), M.toon(Th.c1, { emissive: new B.Color(Th.c1).multiplyScalar(0.2).getHex() }), null); tn.position.copy(p); tn.rotation.set(R(0.4), 0, R(0.4)); run(g, tn, 1.2, t => { const kk = t < 0.1 ? t / 0.1 : t > 0.8 ? (1 - t) / 0.2 : 1; tn.scale.set(0.3 * kk + 0.001, (2 + (i % 3)) * kk + 0.001, 0.3 * kk + 0.001); tn.position.y = p.y + (1 + (i % 3) * 0.5) * kk; }); } } c.hitR(ctr, rr + 1.2, 0.5, { kb: 3, up: 4, ...(ice ? { freeze: 1.4 } : { stun: 1.0 }) }); c.shake(0.3); }); break; }
      if (k === 'bubble' || k === 'hex') { const dome = group(); mesh(G.sph(), M.glow(Th.c1, 0.22), dome, 0, 0, 0, 1); mesh(G.ftorus(), M.glow(Th.c2, 0.7), dome, 0, 0, 0, 1, 1, 0.5).rotation.x = Math.PI / 2; dome.position.copy(ctr); if (c.local) g.p.iframe = Math.max(g.p.iframe, 1.2); let tk = 0;
        run(g, dome, 1.5, (t, dt) => { dome.scale.setScalar(Math.max(0.01, r * Math.min(1, t * 6) * (t > 0.85 ? (1 - t) / 0.15 : 1))); dome.rotation.y += dt; if ((tk -= dt) <= 0) { tk = 0.3; for (const e of c.inR(ctr, r + 0.5)) c.hitE(e, 0.3, { kb: 7, from: ctr, stun: 0.5 }); } if (k === 'bubble' && Math.random() < 0.6) { const b = shapeMesh(Th, 0.5 + Math.random() * 0.4); b.position.copy(ctr).add(V(R(r * 0.7), 0.5, R(r * 0.7))); run(g, b, 1.2, (tt, dd) => { b.position.y += dd * 2.5; b.scale.setScalar(Math.max(0.01, 1 - tt * 0.5)); }); } }); break; }
      // flame / rock / ring / bolt / cloud / default: eruption rings with themed debris
      for (let w = 0; w < 4; w++) after(g, w * 0.2, () => { wave(g, ctr.clone().add(V(0, 0.2, 0)), null, w % 2 ? Th.c2 : Th.c1, 1, r + w * 0.6, 0.6, { fat: true }); const n = busy(g) ? 3 : 6; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + w; const p = ctr.clone().add(V(Math.cos(a) * (2 + w), 0.5, Math.sin(a) * (2 + w)));
          if (k === 'flame') { g.fx.pillar(c.ground(p.clone()), Th.c1, 0.7, 5 + Math.random() * 3, 0.6); g.fx.burst(p, 4, Th.c2, { speed: 3, up: 6, size: 0.7, life: 0.6, grav: -4 }); }
          else if (k === 'bolt') { if (i % 2) g.fx.zap(p.clone().add(V(0, 14, 0)), p, Th.c1, 9, 0.2); }
          else if (k === 'cloud') { if (i % 2) puff(g, p, 1.4, 1.2, { col: Th.c1, em: new B.Color(Th.c1).multiplyScalar(0.3).getHex(), vel: V(Math.cos(a) * 4, 1.2, Math.sin(a) * 4) }); }
          else if (k === 'ring') g.fx.shock(p.clone().add(V(0, 1, 0)), Th.c1, 2, 0.3);
          else { const d = shapeMesh(Th, 0.7); d.position.copy(p); const v = V(Math.cos(a) * 5, 7, Math.sin(a) * 5); run(g, d, 0.8, (t, dt) => { v.y -= 20 * dt; d.position.addScaledVector(v, dt); d.rotation.x += dt * 6; }); } }
        c.hitR(ctr, r, 0.42, { kb: 3, up: 3, from: ctr, ...(MECH[k] === 'chain' ? { stun: 0.5 } : MECH[k] === 'stagger' ? { stun: 0.4 } : {}) }); c.shake(0.25); });
      if (MECH[k] === 'burn' || MECH[k] === 'zone') zone(c, ctr, r * 0.8, 2.6, Th.c1, { p: Th.c2, mul: 0.07, stun: MECH[k] === 'zone' ? 0.6 : 0.3 }); break; }
    case 'wave': { c.cast(0); const d = c.flat(); const P0 = c.P(); const cr = group(); const inner = group(); cr.add(inner); inner.rotation.x = -Math.PI / 2; mesh(G.arc(), M.glow(Th.c1, 0.85), inner, 0, 0, 0, 2.6 * s, 2.6 * s, 3); mesh(G.arc(), M.glow(Th.c2, 0.9), inner, 0, 0, 0, 2.45 * s, 2.45 * s, 1.2);
      cr.rotation.y = Math.atan2(d.x, d.z) + Math.PI; const seen = new Set(); let lastS = 0; g.fx.shake = Math.max(g.fx.shake, 0.2);
      run(g, cr, 1.0, (t, dt, sec) => { const dist = sec * 22; const C = P0.clone().addScaledVector(d, 1.5 + dist); C.y = g.groundAt(C.x, C.z) + 0.9; cr.position.copy(C); cr.scale.setScalar(Math.max(0.01, (0.6 + Math.min(1, sec * 3) * 0.6) * (t > 0.85 ? (1 - t) / 0.15 : 1)));
        if (dist - lastS > 1.5) { lastS = dist; const rt = c.right(); const back = C.clone().addScaledVector(d, -1.2);
          if (k === 'shard' || k === 'thorn') { for (const q of [-1.5, 0, 1.5]) if (Math.random() < 0.7) spike(c, c.ground(back.clone().addScaledVector(rt, q + R(0.4))), 1 + Math.random() * 1.3, 1.0); }
          else if (k === 'flame') g.fx.pillar(c.ground(back.clone()), Th.c1, 1.1, 3, 0.5);
          else if (k === 'bolt') g.fx.zap(back.clone().addScaledVector(rt, -2), back.clone().addScaledVector(rt, 2), Th.c1, 8, 0.15);
          else if (k === 'cloud' || k === 'rock') puff(g, back, 0.9, 0.8, { col: k === 'rock' ? 0xd8ccb8 : Th.c1, em: 0x3a3a3a });
          else if (k === 'ring') g.fx.shock(C, Th.c1, 3, 0.3);
          else { const sm = shapeMesh(Th, 0.6); sm.position.copy(back).addScaledVector(rt, R(2)); sm.lookAt(sm.position.clone().add(d)); run(g, sm, 0.5, tt => sm.scale.setScalar(Math.max(0.01, 1 - tt))); } }
        g.fx.burst(C, 2, Th.c2, { speed: 2, size: 0.5, life: 0.35, grav: 0, spread: 2 });
        if (c.local) for (const e of c.inR(C, 3.2 * s)) if (!seen.has(e)) { seen.add(e); impact(c, Th, g.chest(e, V()), 1.6, 0, { zone: false }); c.hitE(e, 1.05, { kb: 7, from: P0, up: MECH[k] === 'heavy' ? 5 : 1, stun: MECH[k] === 'root' ? 1.2 : 0.3, freeze: ice ? 1.4 : 0 }); } }); break; }
    case 'orbit': { const items = []; const root = group(); for (let i = 0; i < 6; i++) { const m = shapeMesh(Th, 0.8 * s); root.add(m); items.push(m); } const hitT = new Map(); let ring = 0;
      run(g, root, 3.2, (t, dt, sec) => { const P = c.P(); const grow = Math.min(1, sec * 4) * Math.min(1, (3.2 - sec) * 4); const rad = 2.8 * grow + 0.01; items.forEach((m, i) => { const a = sec * 4.5 + i * 1.047; const p = V(P.x + Math.cos(a) * rad, P.y + 1.1 + Math.sin(sec * 3 + i) * 0.35, P.z + Math.sin(a) * rad); m.position.copy(p); m.lookAt(p.clone().add(V(-Math.sin(a), 0, Math.cos(a)))); m.scale.setScalar(Math.max(0.01, grow)); });
        if (Math.random() < 0.5) trail(c, Th, items[(Math.random() * 6) | 0].position, 0.8); if ((ring -= dt) <= 0) { ring = 0.5; g.fx.ring(P.clone().setY(g.groundAt(P.x, P.z) + 0.15), Th.c1, rad + 0.6, 0.4); }
        if (MECH[k] === 'pull') pull(c, P, 7, 3, dt);
        for (const e of c.inR(P, rad + 0.9)) { const lt = hitT.get(e) ?? -1; if (sec - lt > 0.4) { hitT.set(e, sec); c.hitE(e, 0.33, { kb: 3, from: P, stun: MECH[k] === 'root' ? 0.6 : 0.25, freeze: ice && Math.random() < 0.3 ? 0.9 : 0 }); g.fx.sparks(g.chest(e, V()), 5, Th.c2, { speed: 6 }); if (MECH[k] === 'chain' && Math.random() < 0.3) chain(c, g.chest(e, V()), 2, 8, 0.15, Th.c1); } } }); break; }
    case 'dash': { const d = c.flat(); if (c.local) { const p = g.p; p.dash = 0.42; p.dashDir.copy(d); p.iframe = Math.max(p.iframe, 0.55); } c.lines(1); const seen = new Set(); let tr = 0, ended = false;
      run(g, group(), 0.6, (t, dt, sec) => { const P = c.P(); if ((tr -= dt) <= 0) { tr = 0.04; const q = P.clone().add(V(0, 0.9, 0)); trail(c, Th, q, 1.4); if (k === 'flame' || k === 'cloud') g.fx.burst(q, 3, Th.c1, { speed: 2, size: 0.8, life: 0.5, grav: k === 'flame' ? -3 : 0, spread: 0.8 }); else if (k === 'shard' && Math.random() < 0.5) spike(c, c.ground(P.clone().add(V(R(1), 0, R(1)))), 0.9, 0.8); else if (k === 'bolt') g.fx.zap(q, q.clone().addScaledVector(d, -3).add(V(R(1), R(1), R(1))), Th.c1, 6, 0.12); else if (Math.random() < 0.4) { const sm = shapeMesh(Th, 0.6); sm.position.copy(q).add(V(R(0.6), R(0.6), R(0.6))); sm.lookAt(sm.position.clone().add(d)); run(g, sm, 0.4, tt => sm.scale.setScalar(Math.max(0.01, 1 - tt))); } }
        if (sec < 0.42) for (const e of c.hitLine(P.clone().add(V(0, 1, 0)).addScaledVector(d, -1), d, 3.2, 1.9, 0, {}, seen)) impact(c, Th, g.chest(e, V()), 1.8, 1.0, { zone: false, x: { kb: 6, up: 4 } });
        if (!ended && sec >= 0.42) { ended = true; const q = P.clone().add(V(0, 1, 0)).addScaledVector(d, 1); impact(c, Th, q, 3, 0.35); } }); break; }
    case 'blink': { const P = c.P(); const tgt = c.ground(c.aim(26)); for (let i = 0; i < 5; i++) { const sm = shapeMesh(Th, 0.7); sm.position.copy(P).add(V(R(0.8), 0.5 + Math.random() * 1.5, R(0.8))); const v = V(R(4), 3, R(4)); run(g, sm, 0.5, (tt, dt) => { sm.position.addScaledVector(v, dt); sm.scale.setScalar(Math.max(0.01, 1 - tt)); }); }
      g.fx.burst(P.clone().add(V(0, 1, 0)), 20, Th.c1, { speed: 5, size: 0.5, life: 0.4 }); if (c.local) { const p = g.p; p.pos.copy(tgt); g.collide(p.pos, 0.4); p.vy = 0; p.iframe = Math.max(p.iframe, 0.4); } g.fx.beam(P.clone().add(V(0, 1, 0)), tgt.clone().add(V(0, 1, 0)), Th.c1, 0.25, 0.25);
      after(g, 0.02, () => { const q = (c.local ? c.P() : tgt).add(V(0, 1, 0)); impact(c, Th, q, 4.2, 1.0); boom(c, q, Th.c1, 3, { star: Th.c2, dust: false }); c.shake(0.3); }); break; }
    default: return false; }
  return true; }
// ---------- dispatcher ----------
export function fruitMove(g, m, dmg, col, O) { const S = g.save; const id = S.eq.fruit; const f = FRUITS[id]; if (!f || m.beast) return false; const idx = f.moves.findIndex(x => x.name === m.name); if (idx < 0) return false;
  const c = ctxFor(g, { fruit: id, dmg, col, O, rar: f.rar }); const U = ULTRA[id] || CANON[id];
  try { if (U && U[idx]) U[idx](c); else if (!m.k.startsWith('g:') || !themed(c, m.k.slice(2), themeOf(id))) return false; } catch (e) { console.warn('skill', id, idx, e); return false; }
  try { g.net && g.net.fx && g.net.fx(('mv:' + id + ':' + idx).slice(0, 16), col, g.p.pos.clone().setY(g.p.pos.y + 1)); } catch (e) { /* offline */ }
  return true; }
// co-op: replay a peer's move visually (damage arrives separately via net 'hit')
export function remoteMove(g, peer, k, at) { const [, id, si] = k.split(':'); const f = FRUITS[id]; const idx = +si; if (!f || !f.moves[idx] || !peer.av) return; if (busy(g, 180)) return;
  const c = ctxFor(g, { peer, fruit: id, at: at.clone().setY(at.y - 1), col: f.col[0], rar: f.rar }); try { const U = ULTRA[id] || CANON[id]; if (U && U[idx]) U[idx](c); else themed(c, f.moves[idx].k.replace('g:', ''), themeOf(id)); } catch (e) { /* visual only */ } }
// specials: Ultra cutscenes, and themed falling shapes for Godly/Mythical meteor/rain/nova styles
export function ultraSpecial(g, style, dmg, col, O, P0) { const fn = ULTRA_SP[style]; if (!fn) return null; const id = g.save.eq.fruit; const c = ctxFor(g, { fruit: id, dmg, col, O, rar: 7 }); try { return fn(c, P0) || {}; } catch (e) { console.warn('ultra special', e); return null; } }
export const ultraStyleOf = id => ULTRA_STYLE[id];
export function canonSpecial(g, dmg, col, O, P0) { const id = g.save.eq.fruit; const fn = CANON_SP[id]; if (!fn) return null; const c = ctxFor(g, { fruit: id, dmg, col, O, rar: FRUITS[id].rar }); try { return fn(c, P0) || {}; } catch (e) { console.warn('canon special', e); return null; } }
export function specialBody(g, P0) { const c = ctxFor(g, { fruit: g.save.eq.fruit }); return showBody(c, P0); }
export function spShape(g, style, at, big = 1) { const id = g.save.eq.fruit; const Th = themeOf(id); const c = ctxFor(g, { fruit: id, dmg: 0, rar: FRUITS[id] ? FRUITS[id].rar : 5 }); if (busy(g, 240)) return;
  if (style === 'nova') { for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + Math.random(); const sm = shapeMesh(Th, 1.6 * big); sm.position.copy(at).add(V(0, 1, 0)); const v = V(Math.cos(a) * 16, 1, Math.sin(a) * 16); sm.lookAt(sm.position.clone().add(v)); run(g, sm, 0.6, (t, dt) => { sm.position.addScaledVector(v, dt); sm.scale.setScalar(Math.max(0.01, 1.6 * big * (1 - t * 0.6))); }); } return; }
  const from = at.clone().add(V(R(5), 20, R(5))); const sm = shapeMesh(Th, (style === 'meteor' ? 3 : 1.6) * big); const dir = at.clone().sub(from).normalize(); sm.position.copy(from); sm.lookAt(at);
  run(g, sm, 0.22, (t) => { sm.position.copy(from).lerp(at, t); trail(c, Th, sm.position, 2); if (t >= 1) { sm.visible = false; g.fx.shock(at.clone().add(V(0, 1, 0)), Th.c1, 4, 0.3); g.fx.sparks(at, 10, Th.c2, { speed: 10 }); } }); }
export const basicShape = (id, sz) => shapeMesh(themeOf(id), sz);
export function basicFist(g, at, dir, s) { const f = fist(0xf6cfa8); f.position.copy(at); f.lookAt(at.clone().add(dir)); run(g, f, 0.2, t => f.scale.setScalar(Math.max(0.01, s * (t < 0.3 ? 0.6 + t / 0.3 * 0.4 : 1 - (t - 0.3) / 0.7 * 0.7)))); }
export { themed, impact, shoot, cleanup };
