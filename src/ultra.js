// Ultra fruit kits: every move is a readable, shaped effect with its own mechanic, plus a unique cutscene special each.
// Nika: giant rubber fists, cartoon physics, drums. Azure Dragon: a real segmented dragon, fire breath, tornado, Kaido's club.
// Sound: shockwave rings, waveforms, music notes, equalizer. Okuchi no Makami: ice wolves, frost fangs, freezing.
import { THREE, setOutlinesVisible } from './engine.js';
import { audio } from './audio.js';
import { makeAvatar, animChar } from './models.js';
import { visCos } from './style.js';
import { V, G, M, R, group, mesh, outline, run, after, busy, freeze, pull, chain, zone, word, puff, star, boom, wave, fist, arm, setArm, flame, crystal, note, dragon, wolf, drum, club, eq, waveLine, setWave } from './skills.js';
const B = THREE; const ease = t => 1 - Math.pow(1 - t, 3); const clamp01 = x => Math.max(0, Math.min(1, x));
const SKIN = 0xf6cfa8;
function reach(c, d, max, rad = 1.4) { const g = c.g; const e0 = c.eye(); if (c.local) { const h = g.rayEnemy(e0, d, max, rad); if (h) return Math.max(5, h.d); } for (let t = 2; t < max; t += 0.5) { const q = e0.clone().addScaledVector(d, t); if (q.y < g.groundAt(q.x, q.z) + 0.3) return Math.max(5, t); } return max; }
const near = (c, at, r, n) => c.inR(at, r).sort((a, b) => a.c.root.position.distanceTo(at) - b.c.root.position.distanceTo(at)).slice(0, n);
// player body for cutscene specials (the first-person view model is hidden while the camera orbits)
function showBody(c, P0) { if (!c.local) return null; try { const g = c.g, S = g.save; const av = makeAvatar(S.faction, S.race, S.look, visCos(S)); av.root.position.copy(P0); av.root.rotation.y = c.yaw() + Math.PI; g.scene.add(av.root); setOutlinesVisible(av.root);
  return { av, tick(st = {}) { try { animChar(av, { move: 0, phase: 0, attack: 0, aim: false, block: false, sit: false, swim: false, ...st }, g.t); } catch (e) { /* keep cutscene alive */ } }, dispose() { g.scene.remove(av.root); av.root.traverse(q => { if (q.geometry && !q.userData.shared) q.geometry.dispose(); }); } }; } catch (e) { return null; } }

// ======================= NIKA =======================
function bajrangGun(c) { const g = c.g; c.cast('jab'); audio.sfx('rubber'); const root = group(); const F = fist(SKIN, { em: 0x3a2a20 }); const A = arm(g, SKIN, 8); root.add(F, A);
  const d = c.fwd(); const L = reach(c, d, 26, 1.8); const SC = Math.min(3.8, 0.9 + L * 0.2); let hit = false; const seen = new Set();
  run(g, root, 1.35, (t, dt, s) => { const hand = c.hand(1); let ext, sc;
    if (s < 0.22) { ext = 0.6; sc = 0.35 + s / 0.22 * 0.55; } else if (s < 0.5) { const u = (s - 0.22) / 0.28; ext = 0.5 + ease(u) * (L - 2); sc = 1.0 + ease(u) * (SC - 1.0); }
    else if (s < 0.82) { const k = (0.82 - s) / 0.32; ext = L - 1.5 + Math.sin((s - 0.5) * 30) * 0.4 * k; sc = SC * (1 + Math.sin((s - 0.5) * 28) * 0.1 * k); } else { const u = (s - 0.82) / 0.53; ext = Math.max(0.3, (L - 1.5) * (1 - ease(u))); sc = SC - ease(u) * (SC - 0.4); }
    const tip = hand.clone().addScaledVector(d, ext); F.position.copy(tip); F.lookAt(tip.clone().add(d)); F.scale.setScalar(Math.max(0.01, sc));
    const wob = s > 0.82 ? Math.sin(s * 40) * 0.8 * Math.min(1, ext / 4) : s > 0.22 && s < 0.5 ? 0.35 : 0.08; setArm(A, hand, tip.clone().addScaledVector(d, -sc * 0.5), 0.12 + sc * 0.05, wob, s * 20);
    if (s > 0.22 && s < 0.55 && Math.random() < 0.7) puff(g, tip.clone().addScaledVector(d, -sc * 0.7).add(V(R(1), R(1), R(1))), 0.5 + sc * 0.25, 0.7, { vel: d.clone().multiplyScalar(-3).add(V(0, 1, 0)) });
    if (s < 0.22) g.fx.burst(tip, 2, 0xffffff, { speed: -2, size: 0.3, life: 0.25, grav: 0, spread: 2 });
    if (!hit && s >= 0.5) { hit = true; const end = tip.clone().addScaledVector(d, sc * 0.55); boom(c, end, 0xffffff, 4.5); word(g, end.clone().add(V(0, 2.8, 0)), 'DOOON!!', '#fff27a', 3.2, 0.9);
      for (let k = 0; k < 5; k++) g.fx.zap(end, end.clone().add(V(R(4.5), R(3), R(4.5))), k % 2 ? 0xff2a2a : 0x2a0a0a, 8, 0.3);
      c.hitLine(hand, d, L + 1, 2.8, 1.25, { kb: 9, up: 3 }, seen); c.hitR(end, 5, 0.8, { kb: 10, up: 4 }); c.shake(0.8); c.punch(0.05, 6); c.lines(1.3); audio.sfx('boom'); } }); }
function dawnRocket(c) { const g = c.g; audio.sfx('rubber'); const d = c.flat(); if (c.local) { const p = g.p; p.dash = 0.5; p.dashDir.copy(d); p.iframe = Math.max(p.iframe, 0.7); } c.lines(1.4); c.punch(0.03, 12);
  const P0 = c.P(); wave(g, P0.clone().add(V(0, 1, 0)).addScaledVector(d, -0.3), d, 0xffffff, 0.4, 3.4, 0.4, { fat: true }); word(g, P0.clone().add(V(0, 2.4, 0)).addScaledVector(d, 4), 'BOING!', '#ffd0f0', 1.6, 0.6);
  const F = fist(SKIN); if (!c.local) mesh(G.zcone(), M.glow(0xffffff, 0.45), F, 0, 0, -1.3, 0.8, 0.8, -2.6); const seen = new Set(); let last = 0, ended = false;
  run(g, F, 0.9, (t, dt, s) => { const P = c.P(); const pos = c.local ? c.eye().addScaledVector(c.fwd(), 1.5).addScaledVector(c.right(), 0.35).add(V(0, -0.5, 0)) : P.clone().add(V(0, 1.2, 0)).addScaledVector(d, 0.9);
    F.position.copy(pos); F.lookAt(pos.clone().add(d)); const fs = c.local ? 0.42 : 0.85; F.scale.setScalar(s < 0.55 ? fs * (1 + Math.sin(s * 30) * 0.06) : Math.max(0.01, fs * (1 - (s - 0.55) / 0.3)));
    if (s < 0.55 && s - last > 0.035) { last = s; puff(g, P.clone().addScaledVector(d, -1.2).add(V(R(0.8), 0.4 + Math.random() * 0.8, R(0.8))), 0.75, 0.8, { vel: V(R(1), 1.2, R(1)) }); g.fx.burst(P.clone().setY(P.y + 1), 3, 0xffd0f0, { speed: 2, size: 0.4, life: 0.4, grav: 0 }); }
    if (s < 0.55) for (const e of c.hitLine(P.clone().add(V(0, 1, 0)).addScaledVector(d, -1), d, 3.6, 1.9, 1.0, { kb: 4, up: 9 }, seen)) { const q = g.chest(e, V()); word(g, q.clone().add(V(0, 1.4, 0)), 'POW!', '#fff27a', 1.2, 0.5); star(g, q, 0xffe14a, 1.6); }
    if (!ended && s >= 0.55) { ended = true; const end = P.clone().add(V(0, 1, 0)).addScaledVector(d, 1.6); boom(c, end, 0xffd0f0, 3.2); c.hitR(end, 4, 0.6, { kb: 7, up: 6 }); c.shake(0.5); audio.sfx('boom'); } }); }
function toonForce(c) { const g = c.g; audio.sfx('rubber'); c.cast('raise'); const P0 = c.P(); word(g, P0.clone().add(V(0, 2.8, 0)).addScaledVector(c.flat(), 4), 'TOON FORCE!', '#ffffff', 2.2, 1.0, '#5a2a8a'); g.fx.orb(c.eye().addScaledVector(c.fwd(), 2), 0xffffff, 2.5, 0.25);
  const root = group(); const clouds = []; for (let i = 0; i < 6; i++) { const cl = group(); const m = M.toon(0xffffff, { emissive: 0x8a8a92 }); for (let k = 0; k < 4; k++) outline(mesh(G.lsph(), m, cl, R(0.6), R(0.25), R(0.6), 0.5 + Math.random() * 0.3), 1.08); root.add(cl); clouds.push(cl); }
  const sq = new Map(); let tick = 0.2, rip = 0;
  run(g, root, 4.2, (t, dt, s) => { const P = c.P(); const fade = Math.min(1, s * 4, (4.2 - s) * 3); const gy = g.groundAt(P.x, P.z);
    clouds.forEach((cl, i) => { const a = s * 1.8 + i * 1.047; cl.position.set(P.x + Math.cos(a) * 5.5, P.y + 3.4 + Math.sin(s * 3 + i) * 0.5, P.z + Math.sin(a) * 5.5); cl.scale.setScalar(Math.max(0.01, fade * 0.75 * (0.9 + 0.15 * Math.sin(s * 6 + i)))); });
    if ((rip -= dt) <= 0) { rip = 0.45; wave(g, P.clone().setY(gy + 0.15), null, 0xffffff, 1, 10, 0.8, { fat: true, op: 0.7 }); wave(g, P.clone().setY(gy + 0.2), null, 0xffd0f0, 0.5, 7, 0.7, { op: 0.6 }); if (Math.random() < 0.8) puff(g, P.clone().add(V(R(0.6), 2.4, R(0.6))).addScaledVector(c.flat(), -0.8), 0.5, 1.0, { vel: V(R(0.6), 2.4, R(0.6)) }); }
    for (const e of c.inR(P, 10)) if (!sq.has(e)) sq.set(e, { s0: e.c.root.scale.clone(), ph: Math.random() * 6 });
    for (const [e, q] of sq) { const RT = e.c.root; if (e.dead || t >= 1) { RT.scale.copy(q.s0); continue; } const w = Math.sin(s * 9 + q.ph) * Math.min(1, (4.2 - s) * 2); RT.scale.set(q.s0.x * (1 - 0.22 * w), q.s0.y * (1 + 0.38 * w), q.s0.z * (1 - 0.22 * w)); }
    if ((tick -= dt) <= 0) { tick = 0.55; for (const e of c.inR(P, 10)) { c.hitE(e, 0.28, { kb: 1.5, up: 6.5, stun: 0.5, from: P }); if (Math.random() < 0.6) word(g, g.chest(e, V()).add(V(0, 1.6, 0)), Math.random() < 0.5 ? 'BOING!' : 'BOYOYON!', '#ffd0f0', 1.1, 0.5); } } }); }
function dropFist(c, at, sc, i) { const g = c.g; const F = fist(SKIN); mesh(G.zcone(), M.glow(0xffffff, 0.5), F, 0, 0, -1.5, 0.7, 0.7, -3.2); const from = at.clone().add(V(R(3), 15, R(3))); const dir = at.clone().sub(from).normalize(); let hit = false; const land = at.clone().add(V(0, sc * 0.5, 0));
  run(g, F, 0.85, (t, dt, s) => { const u = Math.min(1, s / 0.36); const p = from.clone().lerp(land, u * u); F.position.copy(p); F.lookAt(p.clone().add(dir)); F.scale.setScalar(Math.max(0.01, sc * (u < 1 ? 1 : s < 0.6 ? 1 : 1 - (s - 0.6) / 0.25 * 0.95) * (u >= 1 ? 1 + Math.sin(s * 40) * 0.06 : 1)));
    if (!hit && u >= 1) { hit = true; const c0 = at.clone().add(V(0, 0.5, 0)); boom(c, c0, 0xffffff, 1.6 + sc * 0.6, { dust: i % 2 === 0 }); if (i % 3 === 0) word(g, c0.clone().add(V(0, 2.2, 0)), 'DON!', '#fff27a', 1.4, 0.5); c.hitR(at, 2.4 + sc * 0.6, 0.42, { kb: 4, up: 4 }); c.shake(0.35); if (i % 2) audio.sfx('heavy', { vol: 0.7 }); } }); }
function bajrangRain(c) { const g = c.g; c.cast('raise'); const tgt = c.ground(c.aim(32)); let n = 0, cd = 0; const N = 11; audio.sfx('rubber'); word(g, tgt.clone().add(V(0, 6, 0)), 'BAJRANG RAIN!', '#fff27a', 2.4, 0.9);
  run(g, group(), 1.8, (t, dt) => { if ((cd -= dt) <= 0 && n < N) { cd = 0.12; n++; dropFist(c, n === N ? tgt.clone() : c.ground(tgt.clone().add(V(R(5.5), 0, R(5.5)))), n === N ? 3.2 : 1.8 + Math.random() * 0.8, n); } }); }
function drums(c, P0) { const g = c.g; const root = group(); const Ld = drum(1.5), Rd = drum(1.5); root.add(Ld, Rd); const fl = c.flat(), rt = c.right(); const tgt = c.ground(P0.clone().addScaledVector(fl, 9)); const body = showBody(c, P0);
  const F = fist(SKIN); const A = arm(g, SKIN, 10); root.add(F, A); F.visible = A.visible = false; const beats = [0, 0.38, 0.58, 1.0, 1.38, 1.58, 1.95]; let bi = 0, slam = false; const pulse = [0, 0];
  const sp = { look: null }; const lk = V();
  run(g, root, 5.1, (t, dt, s) => { const T = s - 1.1; body && body.tick({ attack: T > 2.1 && T < 2.9 ? 0.8 : 0, aim: T > 2.1 });
    [[Ld, -1, 0], [Rd, 1, 1]].forEach(([d, sx, k]) => { pulse[k] = Math.max(0, pulse[k] - dt * 4); d.position.copy(P0).addScaledVector(rt, sx * 2.8).addScaledVector(fl, -1.6).add(V(0, 2.5 + Math.sin(s * 3 + sx) * 0.25, 0)); d.rotation.set(0.55, 0, sx * 0.35); d.scale.setScalar(Math.max(0.01, 1.5 * Math.min(1, s * 2) * (1 + pulse[k] * 0.3))); });
    if (s < 1.1) { if (Math.random() < 0.3) puff(g, P0.clone().add(V(R(1), 1.8, R(1))), 0.8, 1.1, { vel: V(R(1), 2.6, R(1)), force: true }); return; }
    if (bi < beats.length && T >= beats[bi]) { const k = bi % 2; bi++; pulse[k] = 1; const d = k ? Rd : Ld; const gy = g.groundAt(P0.x, P0.z); wave(g, P0.clone().setY(gy + 0.2), null, 0xffffff, 1, 18, 0.8, { fat: true }); wave(g, P0.clone().setY(gy + 0.25), null, 0xffd0f0, 0.5, 12, 0.7);
      g.fx.shock(d.position, 0xffffff, 4, 0.35); word(g, d.position.clone().add(V(0, 2.2, 0)), bi % 3 ? 'DON!' : 'DODON!', '#fff27a', 1.6, 0.5); c.hitR(P0, 16, 0.18, { kb: 3, up: 3 }); audio.sfx('boom', { vol: 0.55 }); c.shake(0.45); for (let i = 0; i < 2; i++) puff(g, P0.clone().add(V(R(4), 0.6, R(4))), 1.2, 1.1, { force: true, vel: V(R(4), 1.6, R(4)) }); }
    if (T > 2.1) { F.visible = A.visible = true; const u = clamp01((T - 2.1) / 0.55), v = clamp01((T - 2.7) / 0.28); const sh = P0.clone().add(V(0, 1.7, 0)).addScaledVector(rt, 0.4); const sky = tgt.clone().add(V(0, 24, 0)).addScaledVector(fl, -3); const hitP = tgt.clone().add(V(0, 5.2, 0));
      const tip = v > 0 ? sky.clone().lerp(hitP, v * v) : sh.clone().lerp(sky, ease(u)); const dir = v > 0 ? hitP.clone().sub(sky).normalize() : sky.clone().sub(sh).normalize(); const sc = slam ? Math.max(0.01, 10 * (1 - clamp01((T - 3.2) / 0.7))) : 2 + ease(u) * 8;
      F.position.copy(tip); F.lookAt(tip.clone().add(dir)); F.scale.setScalar(sc); setArm(A, sh, tip.clone().addScaledVector(dir, -sc * 0.5), Math.max(0.01, (0.25 + sc * 0.06) * (slam ? sc / 10 : 1)), 1.4 * (1 - v), T * 8);
      if (u < 1 && Math.random() < 0.6) puff(g, tip.clone().add(V(R(2), -2, R(2))), 1.5, 0.8, { force: true });
      if (!slam && v >= 1) { slam = true; boom(c, tgt.clone().add(V(0, 1, 0)), 0xffffff, 10); for (let i = 0; i < 4; i++) after(g, i * 0.09, () => wave(g, tgt.clone().setY(tgt.y + 0.3), null, i % 2 ? 0xffd0f0 : 0xffffff, 2, 26 + i * 4, 0.9, { fat: true }));
        word(g, tgt.clone().add(V(0, 9, 0)), 'DOOOON!!', '#fff27a', 5, 1.3); c.hitR(tgt, 15, 3.0, { kb: 12, up: 8 }); c.shake(1.3); audio.sfx('boom'); for (let i = 0; i < 8; i++) puff(g, tgt.clone().add(V(R(8), 0.5, R(8))), 2.2, 1.4, { force: true, col: 0xe8e0d0, em: 0x4a4038, vel: V(R(5), 2.5, R(5)) }); } }
    sp.look = T > 2.0 ? lk.copy(P0).lerp(tgt, 0.55).add(V(0, T < 2.75 ? 7 : 2.5, 0)) : null;
    if (t >= 1 && body) body.dispose(); });
  return sp; }

// ======================= AZURE DRAGON =======================
function fireHit(c, at, r = 3) { const g = c.g; g.fx.orb(at, 0xffd060, r * 0.6, 0.3); g.fx.shock(at, 0xff6a1a, r * 1.2, 0.35); g.fx.burst(at, 18, 0xff6a1a, { speed: 7, up: 4, size: 0.7, life: 0.6, grav: -4 }); g.fx.sparks(at, 10, 0xffb030, { speed: 10 }); }
function comet(c, from, to, o = {}) { const g = c.g; const f = flame(o.col ?? 0xff5a1a, 0xfff2b0, o.s ?? 1.2); const d = to.clone().sub(from); const L = Math.max(0.5, d.length()); d.normalize(); const T = L / (o.speed ?? 32); let done = false;
  f.position.copy(from); f.lookAt(to); run(g, f, T + 0.02, (t) => { f.position.copy(from).addScaledVector(d, L * Math.min(1, t)); f.children[0].scale.setScalar(0.35 * (o.s ?? 1.2) * (1 + R(0.2))); g.fx.burst(f.position, 2, Math.random() < 0.5 ? (o.col ?? 0xff6a1a) : 0xffb030, { speed: 1, size: 0.7, life: 0.35, grav: -3, spread: 0.4 }); if (t >= 1 && !done) { done = true; o.onHit && o.onHit(f.position.clone()); } }); }
function boroBreath(c) { const g = c.g; c.cast('push'); audio.sfx('fire'); const D = dragon(g, { n: 6, s: 0.5, head: 1.35 }); const root = group(); root.add(D.root); const bm = group(); root.add(bm);
  const core = mesh(G.zcyl(), M.glow(0xffffff, 0.95), bm), mid = mesh(G.zcyl(), M.glow(0xffd060, 0.8), bm), out = mesh(G.zcyl(), M.glow(0xff5a1a, 0.55), bm), flare = mesh(G.zcone(), M.glow(0xffa030, 0.75), bm); bm.visible = false; let tick = 0, zt = 0.1;
  run(g, root, 1.75, (t, dt, s) => { const d = c.fwd(); const rt = c.right(); const base = c.local ? c.eye().addScaledVector(d, 1.4).addScaledVector(rt, 0.55).add(V(0, -0.6, 0)) : c.P().add(V(0, 1.7, 0)).addScaledVector(c.flat(), 1.2);
    D.k = Math.max(0.01, Math.min(1, s / 0.18) * (s > 1.5 ? 1 - (s - 1.5) / 0.25 : 1)); D.set((u, o) => o.copy(base).addScaledVector(d, -u * 2.4).addScaledVector(rt, Math.sin(u * 4 + s * 5) * 0.35 * u).add(V(0, -u * 0.9 + Math.cos(u * 3 + s * 4) * 0.2 * u, 0)), s);
    D.open = s < 0.3 ? s / 0.3 : s > 1.4 ? Math.max(0, 1 - (s - 1.4) / 0.2) : 0.9 + R(0.1); const m0 = D.mouthPos();
    if (s < 0.32) g.fx.burst(m0, 2, 0xffa030, { speed: -2.5, size: 0.4, life: 0.3, grav: 0, spread: 2.5 });
    const on = s >= 0.32 && s < 1.45; bm.visible = on; if (!on) return;
    let L = 26; if (c.local) { const h = g.rayEnemy(m0, d, 26, 1.4); if (h) L = h.d + 0.5; } for (let k = 2; k < L; k += 0.75) { const q = m0.clone().addScaledVector(d, k); if (q.y < g.groundAt(q.x, q.z)) { L = k; break; } }
    const end = m0.clone().addScaledVector(d, L); const fl = 1 + Math.sin(s * 60) * 0.12; const w = Math.min(1, (s - 0.32) / 0.1) * (s > 1.35 ? (1.45 - s) / 0.1 : 1);
    for (const [m, r] of [[core, 0.25], [mid, 0.55], [out, 1.0]]) { m.position.copy(m0).addScaledVector(d, L / 2); m.lookAt(end); m.scale.set(Math.max(0.01, r * w * fl * (m === out ? 1 + Math.random() * 0.2 : 1)), Math.max(0.01, r * w * fl), L); }
    flare.position.copy(m0).addScaledVector(d, 1.0); flare.lookAt(end); flare.scale.set(1.1 * w, 1.1 * w, -2.2);
    for (let k = 0; k < 3; k++) g.fx.burst(m0.clone().addScaledVector(d, Math.random() * L), 1, [0xff6a1a, 0xffb030, 0xffe080][k], { speed: 2, up: 2, size: 0.9, life: 0.4, grav: -3, spread: 0.8 });
    g.fx.burst(end, 4, 0xff6a1a, { speed: 5, up: 4, size: 0.8, life: 0.5, grav: -3 }); if ((zt -= dt) <= 0) { zt = 0.3; if (Math.abs(end.y - g.groundAt(end.x, end.z)) < 1.5) zone(c, end, 2.2, 1.6, 0xff5a1a, { p: 0xffa030, mul: 0.08 }); }
    if ((tick -= dt) <= 0) { tick = 0.14; c.hitLine(m0, d, L + 0.5, 1.5, 0.2, { kb: 1.5, stun: 0.25 }); } c.shake(0.18); }); }
function boloStorm(c) { const g = c.g; audio.sfx('fire'); const D = dragon(g, { n: 11, s: 0.7 }); let fired = 0, cd = 0.35; const tg = c.local ? near(c, c.P(), 24, 6) : [];
  run(g, D.root, 2.4, (t, dt, s) => { const P = c.P(); const fl = c.flat(), rt = c.right(); const hp = P.clone().add(V(0, 4.2, 0)).addScaledVector(fl, -0.8); const e = tg.length ? tg[fired % tg.length] : null;
    const aimAt = e && !e.dead ? g.chest(e, V()) : c.ground(P.clone().addScaledVector(fl, 10).addScaledVector(rt, (fired - 2.5) * 2.6)); const dir = aimAt.clone().sub(hp).normalize();
    D.k = Math.max(0.01, Math.min(1, s / 0.25) * Math.min(1, (2.4 - s) / 0.3)); D.set((u, o) => o.copy(hp).addScaledVector(dir, -u * 0.8).add(V(Math.sin(u * 6 + s * 4) * 1.5 * u, -u * 3.4 + Math.cos(u * 5 + s * 3) * 0.4 * u, Math.cos(u * 6 + s * 4) * 1.5 * u)), s);
    D.open = cd < 0.12 ? 1 : 0.35;
    if ((cd -= dt) <= 0 && fired < 6 && s < 2.0) { cd = 0.26; fired++; audio.sfx('fire', { vol: 0.6 }); comet(c, D.mouthPos(), aimAt, { s: 1.3, onHit: (q) => { fireHit(c, q, 2.6); c.hitR(q, 3, 0.42, { kb: 5, up: 3 }); zone(c, q, 2.6, 2.4, 0xff5a1a, { p: 0xffa030, mul: 0.1 }); c.shake(0.25); } }); } }); }
function dragonTwister(c) { const g = c.g; audio.sfx('beast'); const D = dragon(g, { n: 24, s: 0.9 }); const root = group(); root.add(D.root); const fl0 = c.flat(); const C0 = c.ground(c.P().addScaledVector(fl0, 5));
  const rings = []; for (let i = 0; i < 7; i++) { const m = mesh(G.ftorus(), M.glow(i % 2 ? 0x9ad4ff : 0xffffff, 0.45), root); m.rotation.x = Math.PI / 2; rings.push(m); }
  const fg = new B.CylinderGeometry(5.5, 1.0, 13, 16, 1, true); const fun = mesh(fg, M.glow(0x6ab0ff, 0.18), root); fun.userData.ownGeo = 1; let tick = 0, ended = false; word(g, C0.clone().add(V(0, 9, 0)), 'DRAGON TWISTER!', '#9ad4ff', 2.4, 0.9, '#0a1a4a');
  if (c.local) g.p.iframe = Math.max(g.p.iframe, 0.4); c.shake(0.3);
  run(g, root, 2.9, (t, dt, s) => { const C = C0.clone().addScaledVector(fl0, s * 2.2); C.y = g.groundAt(C.x, C.z); const grow = Math.max(0.01, Math.min(1, s / 0.35) * Math.min(1, (2.9 - s) / 0.3));
    rings.forEach((m, i) => { const r = (1.2 + i * 0.7) * grow; m.position.set(C.x, C.y + 0.5 + i * 1.9, C.z); m.scale.set(r, r, 3 + i); m.rotation.z = s * (6 - i * 0.4); m.material.opacity = 0.45 * grow; });
    fun.position.set(C.x, C.y + 6.5, C.z); fun.scale.set(grow, grow, grow); fun.rotation.y = s * 8; fun.material.opacity = 0.18 * grow;
    D.k = grow; D.set((u, o) => { const a = s * 5.5 + u * 9; const h = 0.8 + (1 - u) * 11 * grow; const r = 1.6 + h * 0.36; o.set(C.x + Math.cos(a) * r, C.y + h, C.z + Math.sin(a) * r); }, s); D.open = 0.5 + 0.5 * Math.sin(s * 6);
    if (Math.random() < 0.8) g.fx.burst(C.clone().add(V(R(3), Math.random() * 8, R(3))), 2, 0xcfe8ff, { speed: 3, up: 3, size: 0.5, life: 0.5, grav: -2, spread: 1 });
    pull(c, C, 13, 9, dt); if ((tick -= dt) <= 0) { tick = 0.25; for (const e of c.inR(C, 4.2)) c.hitE(e, 0.16, { kb: 0.3, up: 4, stun: 0.4, from: C }); }
    if (t >= 1 && !ended) { ended = true; boom(c, C.clone().add(V(0, 2, 0)), 0x9ad4ff, 4); c.hitR(C, 6.5, 0.7, { kb: 10, up: 6 }); c.shake(0.6); audio.sfx('boom'); } }); }
function thunderBagua(c) { const g = c.g; audio.sfx('lightning'); const cl = club(1.25); let hit = false; const rt0 = c.right(), fl0 = c.flat(); word(g, c.P().add(V(0, 4.5, 0)).addScaledVector(fl0, 5), 'THUNDER BAGUA!', '#cfe8ff', 2.2, 0.8, '#1a0a3a');
  run(g, cl, 1.5, (t, dt, s) => { const P = c.P(); const piv = P.clone().add(V(0, 2.2, 0)).addScaledVector(rt0, 0.9); cl.position.copy(piv); const ax = rt0.clone().negate();
    const th = s < 0.3 ? -0.2 - s / 0.3 * 1.0 : s < 0.46 ? -1.2 + Math.pow((s - 0.3) / 0.16, 2) * 3.05 : 1.85; cl.quaternion.setFromAxisAngle(ax, th); cl.scale.setScalar(Math.max(0.01, 1.25 * Math.min(1, s * 6) * (s > 1.2 ? 1 - (s - 1.2) / 0.3 : 1))); cl.updateMatrixWorld(true);
    if (Math.random() < 0.8) { const a = cl.localToWorld(V(R(0.4), 2 + Math.random() * 3.5, R(0.4))); g.fx.zap(a, a.clone().add(V(R(2.5), R(2.5), R(2.5))), Math.random() < 0.5 ? 0xb08aff : 0xcfe8ff, 6, 0.12); }
    if (s > 0.3 && s < 0.46) g.fx.burst(cl.localToWorld(V(0, 4.5, 0)), 3, 0xcfe8ff, { speed: 1, size: 0.6, life: 0.25, grav: 0, spread: 1 });
    if (!hit && s >= 0.46) { hit = true; const imp = c.ground(cl.localToWorld(V(0, 5, 0))); boom(c, imp.clone().add(V(0, 0.6, 0)), 0xb08aff, 5, { star: 0xcfe8ff, spark: 0xcfe8ff }); word(g, imp.clone().add(V(0, 3.5, 0)), 'GOOON!!', '#cfe8ff', 2.8, 0.9, '#1a0a3a');
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; g.fx.zap(imp.clone().add(V(0, 0.2, 0)), c.ground(imp.clone().add(V(Math.cos(a) * 7, 0, Math.sin(a) * 7))).add(V(0, 0.2, 0)), 0xcfe8ff, 8, 0.35); }
      for (const e of near(c, imp, 14, 4)) { const q = g.chest(e, V()); g.fx.zap(q.clone().add(V(R(2), 18, R(2))), q, 0xe8f0ff, 10, 0.3); }
      c.hitR(imp, 5.5, 1.7, { kb: 9, up: 5, stun: 1.0 }); chain(c, imp.clone().add(V(0, 1, 0)), 5, 14, 0.55, 0xb08aff); c.shake(0.9); c.punch(0.05, 5); audio.sfx('boom'); } }); }
function kaifu(c, P0) { const g = c.g; const D = dragon(g, { n: 34, s: 2.3 }); const root = group(); root.add(D.root); const fl = c.flat(); const tgt = c.ground(P0.clone().addScaledVector(fl, 10)); const body = showBody(c, P0);
  const clouds = []; for (let i = 0; i < 7; i++) { const cl = group(); const m = M.toon(0x3a3a5a, { emissive: 0x10102a }); for (let k = 0; k < 4; k++) mesh(G.lsph(), m, cl, R(2), R(0.6), R(2), 1.6 + Math.random()); root.add(cl); const a = i / 7 * 6.283; cl.position.set(P0.x + Math.cos(a) * 15, P0.y + 22, P0.z + Math.sin(a) * 15); clouds.push(cl); }
  const bm = group(); root.add(bm); const core = mesh(G.zcyl(), M.glow(0xffffff, 0.95), bm), mid = mesh(G.zcyl(), M.glow(0xffd060, 0.8), bm), out = mesh(G.zcyl(), M.glow(0xff5a1a, 0.6), bm); bm.visible = false;
  let tick = 0, zt = 0, fin = false, bolt = 0; const sp = { look: null }; const lk = V(); const hp = V();
  run(g, root, 5.1, (t, dt, s) => { const T = s - 1.1; body && body.tick({ aim: true }); clouds.forEach((cl, i) => { cl.rotation.y += dt * 0.3; cl.scale.setScalar(Math.min(1, s)); });
    let path;
    if (T < 0) { const k = clamp01(s / 1.1); path = (u, o) => { const a = s * 3 + u * 7; const h = (1 - u) * 16 * k + 1; o.set(P0.x + Math.cos(a) * (3 + h * 0.5), P0.y + h, P0.z + Math.sin(a) * (3 + h * 0.5)); }; D.k = Math.max(0.01, k); }
    else if (T < 1.7) { path = (u, o) => { const a = T * 1.6 - u * 2.6; o.set(P0.x + Math.cos(a) * 16, P0.y + 15 + Math.sin(a * 2 + u * 3) * 2, P0.z + Math.sin(a) * 16); }; D.k = 1; }
    else { const v = clamp01((T - 1.7) / 0.5); const a0 = 1.7 * 1.6; const top = P0.clone().add(V(Math.cos(a0) * 16, 15, Math.sin(a0) * 16)); const hov = tgt.clone().add(V(0, 11, 0)).addScaledVector(fl, -4); hp.copy(top).lerp(hov, ease(v));
      const away = T > 3.6 ? clamp01((T - 3.6) / 0.4) : 0; hp.y += away * 20; path = (u, o) => { o.copy(hp).add(V(Math.cos(u * 5 + T * 2) * 3 * u, u * 6, Math.sin(u * 5 + T * 2) * 3 * u)).addScaledVector(fl, -u * 12); }; D.k = Math.max(0.01, 1 - away); }
    D.set(path, s); D.open = T > 0 && T < 1.7 ? 0.6 + 0.4 * Math.sin(T * 8) : T >= 2.2 && T < 3.6 ? 1 : 0.3;
    if (T > 0 && T < 3.6 && (bolt -= dt) <= 0) { bolt = 0.18; const a = Math.random() * 6.283, r = 3 + Math.random() * 16; const q = c.ground(P0.clone().add(V(Math.cos(a) * r, 0, Math.sin(a) * r))); g.fx.zap(q.clone().add(V(R(2), 22, R(2))), q, 0xcfe8ff, 10, 0.25); g.fx.orb(q, 0xcfe8ff, 1.2, 0.15); c.hitR(q, 3, 0.2, { stun: 0.5 }); }
    const m0 = D.mouthPos(); const beam = T >= 2.2 && T < 3.6; bm.visible = beam;
    if (beam) { const a = (T - 2.2) * 4.5; const end = tgt.clone().add(V(Math.cos(a) * 5 * (1 - (T - 2.2) / 1.4), 0.2, Math.sin(a) * 5 * (1 - (T - 2.2) / 1.4))); end.y = g.groundAt(end.x, end.z) + 0.2; const L = m0.distanceTo(end); const fk = 1 + Math.sin(T * 60) * 0.12;
      for (const [m, r] of [[core, 0.6], [mid, 1.3], [out, 2.2]]) { m.position.copy(m0).lerp(end, 0.5); m.lookAt(end); m.scale.set(r * fk, r * fk, L); }
      g.fx.burst(end, 6, 0xff6a1a, { speed: 7, up: 5, size: 1.1, life: 0.6, grav: -3 }); if ((zt -= dt) <= 0) { zt = 0.25; zone(c, end, 3, 1.8, 0xff5a1a, { p: 0xffa030, mul: 0.06 }); puff(g, end.clone().add(V(0, 1, 0)), 1.6, 1.0, { force: true, col: 0x5a4a4a, em: 0x1a1010, vel: V(R(2), 3, R(2)) }); }
      if ((tick -= dt) <= 0) { tick = 0.15; c.hitR(end, 4.5, 0.22, { kb: 2, stun: 0.3 }); } }
    if (!fin && T >= 3.6) { fin = true; boom(c, tgt.clone().add(V(0, 1, 0)), 0xff8a2a, 11, { star: 0xffe080, spark: 0xffb030 }); fireHit(c, tgt.clone().add(V(0, 2, 0)), 7); word(g, tgt.clone().add(V(0, 9, 0)), 'KAIFU!!', '#9ad4ff', 5, 1.2, '#0a1a4a'); c.hitR(tgt, 13, 2.2, { kb: 12, up: 7 }); c.shake(1.2); audio.sfx('boom'); }
    sp.look = T < 0 ? lk.copy(P0).add(V(0, 4 + s * 4, 0)) : T < 1.7 ? lk.copy(D.head.position).lerp(P0, 0.4) : lk.copy(tgt).add(V(0, 4, 0)).lerp(D.head.position, 0.3);
    if (t >= 1 && body) body.dispose(); });
  return sp; }

// ======================= SOUND =======================
const TEAL = 0x18e0c8, PINK = 0xff5ad0, WHITE = 0xffffff;
function mark(c, e, cb) { const g = c.g; const m = mesh(G.torus(), M.glow(TEAL, 0.9), null); const m2 = mesh(G.torus(), M.glow(PINK, 0.8), m, 0, 0, 0, 0.6, 0.6, 1); let done = false;
  run(g, m, 1.0, (t, dt, s) => { if (e.dead) { m.visible = false; return; } m.position.copy(g.chest(e, V())).add(V(0, (e.c.height || 1.8) * 0.55, 0)); m.quaternion.copy(g.cam.quaternion); const k = 0.5 + t * 0.4 + Math.sin(s * 30) * 0.05 * t; m.scale.set(k, k, 2); m2.rotation.z = s * 6;
    if (t >= 1 && !done) { done = true; cb(); } }); }
function resonance(c) { const g = c.g; c.cast('push'); audio.sfx('sound'); const d0 = c.fwd(); const d = V(d0.x, Math.max(-0.25, Math.min(0.25, d0.y)), d0.z).normalize(); const h0 = c.hand(1); const side = d.clone().cross(V(0, 1, 0)).normalize();
  for (let i = 0; i < 6; i++) after(g, i * 0.06, () => wave(g, h0.clone().addScaledVector(d, 1 + i * 0.3), d, i % 2 ? WHITE : TEAL, 0.4, 3.6, 0.95, { vel: d.clone().multiplyScalar(24), fat: i % 2 === 0, th: 2.5, op: 0.85 }));
  const root = group(); const l1 = waveLine(TEAL), l2 = waveLine(PINK); root.add(l1, l2); const seen = new Set(); word(g, h0.clone().addScaledVector(d, 6).add(V(0, 1.6, 0)), 'VWOOOM', '#7affea', 1.8, 0.7, '#0a2a3a');
  run(g, root, 1.0, (t, dt, s) => { const f = Math.min(24, s * 24); setWave(l1, h0, d, f, 0.9, 30, s * 40, side); setWave(l2, h0, d, f, 0.6, 22, -s * 30, side); l1.material.opacity = l2.material.opacity = 1 - t;
    if (c.local) for (const e of g.enemies) { if (e.dead || seen.has(e)) continue; const to = g.chest(e, V()).sub(h0); const tt = to.dot(d); if (tt > f + 0.5 || tt < f - 3) continue; if (to.addScaledVector(d, -tt).length() < 3.4 + (e.boss ? 0.8 : 0)) { seen.add(e); c.hitE(e, 0.7, { kb: 4, from: c.P() }); mark(c, e, () => { if (e.dead) return; const q = g.chest(e, V()); for (let k = 0; k < 3; k++) after(g, k * 0.06, () => g.fx.shock(q, k % 2 ? PINK : TEAL, 2 + k, 0.35)); g.fx.sparks(q, 10, 0xb0fff0, { speed: 9 }); c.hitE(e, 0.8, { kb: 3, stun: 0.7, from: q }); audio.sfx('sound', { vol: 0.5 }); }); } } }); }
function echoShots(c) { const g = c.g; let n = 0, cd = 0; audio.sfx('sound', { vol: 0.6 });
  run(g, group(), 0.9, (t, dt) => { if ((cd -= dt) <= 0 && n < 8) { cd = 0.09; n++; c.cast(0); const h = c.hand(n % 2 ? 1 : -1); const d = c.fwd(); let tgt = null; if (c.local) { let best = 0.82; for (const e of g.enemies) { if (e.dead) continue; const to = g.chest(e, V()).sub(h); const L = to.length(); if (L > 32) continue; const dt2 = to.normalize().dot(d); if (dt2 > best) { best = dt2; tgt = e; } } }
      const N = note(n % 3 === 2 ? PINK : TEAL, 0.9); N.position.copy(h); const vel = d.clone().multiplyScalar(30); let life = 0, hit = false, ring = 0;
      run(g, N, 1.1, (t2, dt2) => { if (hit) return; life += dt2; if (tgt && !tgt.dead) { const want = g.chest(tgt, V()).sub(N.position).normalize().multiplyScalar(30); vel.lerp(want, Math.min(1, dt2 * 6)); }
        N.position.addScaledVector(vel, dt2); N.quaternion.copy(g.cam.quaternion); N.rotateZ(Math.sin(life * 18) * 0.4); N.scale.setScalar(0.9 + Math.sin(life * 25) * 0.1); if ((ring -= dt2) <= 0) { ring = 0.06; g.fx.shock(N.position, TEAL, 0.6, 0.25, 0.6); }
        const e = tgt && !tgt.dead && g.chest(tgt, V()).distanceTo(N.position) < 1.3 ? tgt : null; if (e || t2 >= 1) { hit = true; N.visible = false; const q = N.position.clone(); g.fx.shock(q, WHITE, 1.4, 0.25); g.fx.sparks(q, 6, 0xb0fff0, { speed: 6 });
          if (e) { c.hitE(e, 0.3, { kb: 1.5 }); after(g, 0.25, () => { if (e.dead) return; g.fx.shock(g.chest(e, V()), PINK, 1.8, 0.3); c.hitE(e, 0.15, { kb: 0.5 }); }); } } }); } }); }
function soundBomb(c) { const g = c.g; c.cast('slam'); audio.sfx('sound'); const P0 = c.P(); const E = eq(18, 3.4); const root = group(); root.add(E); const sh = mesh(G.sph(), M.glow(TEAL, 0.25), root); sh.visible = false; let blown = false;
  run(g, root, 1.7, (t, dt, s) => { const P = c.P(); const gy = g.groundAt(P.x, P.z); E.position.set(P.x, gy, P.z); E.rotation.y = s * 1.5; const charge = Math.min(1, s / 0.65);
    E.userData.bars.forEach((b, i) => { const h = blown ? Math.max(0.05, (1.7 - s) * 3) : 0.3 + charge * (1.2 + Math.abs(Math.sin(s * 14 + i * 1.3)) * 2.4); b.scale.y = h; b.position.y = h / 2; });
    if (!blown && s < 0.65 && Math.random() < 0.5) g.fx.shock(P.clone().setY(gy + 1.2), TEAL, 2 + charge * 2, 0.25, 0.5);
    if (!blown && s >= 0.65) { blown = true; const q = P.clone().setY(gy + 1.2); sh.visible = true; word(g, q.clone().add(V(0, 3.5, 0)).addScaledVector(c.flat(), 3), 'BOOOM!!', '#7affea', 3, 0.9, '#0a2a3a');
      for (let k = 0; k < 4; k++) after(g, k * 0.07, () => { wave(g, q.clone().setY(gy + 0.2), null, k % 2 ? PINK : TEAL, 1, 12 + k * 2, 0.6, { fat: true }); g.fx.shock(q, k % 2 ? WHITE : TEAL, 6 + k * 2, 0.4); });
      c.hitR(P, 9, 1.6, { kb: 10, up: 4, stun: 1.2 }); c.shake(0.8); c.punch(0.04, 6); audio.sfx('boom'); }
    if (blown) { const u = clamp01((s - 0.65) / 0.45); sh.position.set(P.x, gy + 1, P.z); sh.scale.setScalar(1 + u * 9); sh.material.opacity = 0.3 * (1 - u); } }); }
function sonicLance(c) { const g = c.g; c.cast('push'); audio.sfx('sound'); const d = c.fwd(); const h = c.hand(1); const L = 40; const side = d.clone().cross(V(0, 1, 0)).normalize(); if (side.lengthSq() < 0.1) side.set(1, 0, 0);
  const root = group(); const core = mesh(G.zcyl(), M.glow(WHITE, 0.95), root); const glw = mesh(G.zcyl(), M.glow(TEAL, 0.5), root); const l1 = waveLine(TEAL, 90), l2 = waveLine(PINK, 90); root.add(l1, l2); const rings = []; for (let i = 0; i < 20; i++) { const r = mesh(G.torus(), M.glow(i % 2 ? TEAL : WHITE, 0.8), root); r.visible = false; rings.push(r); }
  let hit = false; c.hitLine(h, d, L, 1.5, 2.4, { kb: 6, stun: 0.4 }); c.shake(0.45); c.punch(0.03, 4); g.fx.shock(h.clone().addScaledVector(d, 1), WHITE, 2, 0.25);
  run(g, root, 0.75, (t, dt, s) => { const f = Math.min(L, s / 0.12 * L); const fade = s < 0.15 ? 1 : 1 - (s - 0.15) / 0.6; core.position.copy(h).addScaledVector(d, f / 2); core.lookAt(h.clone().addScaledVector(d, f + 0.01)); core.scale.set(0.12 * fade, 0.12 * fade, Math.max(0.01, f)); glw.position.copy(core.position); glw.quaternion.copy(core.quaternion); glw.scale.set(0.45 * fade, 0.45 * fade, Math.max(0.01, f));
    setWave(l1, h, d, f, 0.55, 40, s * 60, side); setWave(l2, h, d, f, 0.55, 40, s * 60 + Math.PI, side); l1.material.opacity = l2.material.opacity = fade;
    rings.forEach((r, i) => { const at = (i + 1) / rings.length * L; r.visible = at <= f; if (!r.visible) return; r.position.copy(h).addScaledVector(d, at); r.lookAt(r.position.clone().add(d)); const k = (0.5 + 0.35 * Math.sin(s * 30 - i)) * (1 + (1 - fade) * 1.5); r.scale.set(k, k, 2); r.material.opacity = 0.8 * fade; });
    if (!hit && f >= L) { hit = true; const e2 = h.clone().addScaledVector(d, L); g.fx.shock(e2, TEAL, 4, 0.4); } }); }
function requiem(c, P0) { const g = c.g; const root = group(); const body = showBody(c, P0); const staff = []; for (let i = 0; i < 5; i++) { const r = mesh(G.torus(), M.glow(i === 2 ? WHITE : TEAL, 0.75), root); r.rotation.x = Math.PI / 2; staff.push(r); }
  const notes = []; for (let i = 0; i < 14; i++) { const n = note(i % 3 ? TEAL : PINK, 1.3); root.add(n); notes.push({ n, a: i / 14 * 6.283, line: i % 5, fly: null }); } const E = eq(28, 15); root.add(E); const sh = mesh(G.sph(), M.glow(TEAL, 0.25), root); sh.visible = false;
  let pulseT = 0, fired = 0, cd = 0, silent = false, blast = false; const sp = { look: null }; const sky = g.sky && g.sky.userData.mat.uniforms; const gy = g.groundAt(P0.x, P0.z);
  run(g, root, 5.1, (t, dt, s) => { const T = s - 1.1; body && body.tick({ aim: T < 2.8 }); const grow = Math.min(1, s / 1.0); const fz = silent && !blast;
    staff.forEach((r, i) => { const k = 10 * grow; r.position.set(P0.x, gy + 0.9 + i * 0.45, P0.z); r.scale.set(k, k, 2); if (!fz) r.rotation.z += dt * (0.5 + i * 0.05); r.material.opacity = blast ? Math.max(0, 0.75 * (1 - (T - 3.05) * 2)) : 0.75; });
    E.position.set(P0.x, gy, P0.z); E.userData.bars.forEach((b, i) => { const hh = fz ? 0.05 : blast ? Math.max(0.05, (4 - T) * 2.5) : grow * (0.6 + Math.abs(Math.sin(s * 9 + i * 0.9)) * (T > 0 ? 4.5 : 1.5)); b.scale.y = hh; b.position.y = hh / 2; });
    notes.forEach((o, i) => { if (o.fly) return; const a = o.a + (fz ? 0 : s * 0.9); o.n.position.set(P0.x + Math.cos(a) * 10 * grow, gy + 1.2 + o.line * 0.45 + Math.sin(s * 4 + i) * 0.2, P0.z + Math.sin(a) * 10 * grow); o.n.quaternion.copy(g.cam.quaternion); o.n.visible = !blast; });
    if (T > 0 && T < 1.8) { pull(c, P0, 16, 2.5, dt); if ((pulseT -= dt) <= 0) { pulseT = 0.45; wave(g, P0.clone().setY(gy + 0.2), null, TEAL, 2, 16, 0.7, { fat: true, op: 0.6 }); c.hitR(P0, 15, 0.15, { kb: 0.5, stun: 0.8 }); audio.sfx('sound', { vol: 0.5 }); } }
    if (T >= 1.8 && T < 2.8 && (cd -= dt) <= 0 && fired < notes.length) { cd = 0.07; const o = notes[fired++]; const tg = near(c, P0, 18, 8); const e = tg.length ? tg[fired % tg.length] : null; const to = e ? g.chest(e, V()) : c.ground(P0.clone().add(V(R(10), 0, R(10)))).add(V(0, 1, 0)); const from = o.n.position.clone(); o.fly = 1;
      run(g, group(), 0.3, (t2) => { o.n.position.copy(from).lerp(to, t2 * t2).add(V(0, Math.sin(t2 * 3.14) * 2, 0)); if (t2 >= 1) { o.n.visible = false; g.fx.shock(to, PINK, 2, 0.3); g.fx.sparks(to, 6, 0xb0fff0, { speed: 6 }); if (e) c.hitE(e, 0.35, { kb: 2 }); } }); }
    if (!silent && T >= 2.8) { silent = true; word(g, P0.clone().add(V(0, 5, 0)), '. . . . .', '#ffffff', 3, 0.5, '#0a2a3a'); if (sky) sky.top.value.set(0xe8fff8); g.fx.orb(P0.clone().setY(gy + 1.5), WHITE, 6, 0.25); }
    if (silent && !blast && sky) sky.top.value.lerp(new B.Color(0x05030a), dt * 6);
    if (!blast && T >= 3.05) { blast = true; sh.visible = true; word(g, P0.clone().add(V(0, 7, 0)), 'SILENT REQUIEM', '#7affea', 4.5, 1.1, '#0a2a3a'); for (let k = 0; k < 5; k++) after(g, k * 0.08, () => { wave(g, P0.clone().setY(gy + 0.3), null, k % 2 ? PINK : TEAL, 2, 26 + k * 3, 0.9, { fat: true }); g.fx.shock(P0.clone().setY(gy + 2), k % 2 ? WHITE : TEAL, 14 + k * 4, 0.6); });
      c.hitR(P0, 18, 2.2, { kb: 12, up: 6, stun: 1.5 }); c.shake(1.2); audio.sfx('boom'); }
    if (blast) { const u = clamp01((T - 3.05) / 0.7); sh.position.set(P0.x, gy + 1, P0.z); sh.scale.setScalar(1 + u * 22); sh.material.opacity = 0.3 * (1 - u); }
    sp.look = null; if (t >= 1 && body) body.dispose(); });
  return sp; }

// ======================= OKUCHI NO MAKAMI =======================
const ICE = 0xbfeaff;
function spike(c, at, h = 2, dur = 1.1, tilt = 0.4) { const g = c.g; const gr = group(); const s = mesh(G.cone(), M.toon(ICE, { emissive: 0x2a5a8a }), gr, 0, 0, 0, 0.35 * h, h, 0.35 * h); outline(s, 1.08); mesh(G.cone(), M.glow(0x9ad8ff, 0.35), gr, 0, 0, 0, 0.5 * h, h * 1.15, 0.5 * h); gr.position.copy(at); gr.rotation.set(R(tilt), Math.random() * 6, R(tilt));
  run(g, gr, dur, t => { const k = t < 0.1 ? t / 0.1 : t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1; gr.scale.set(Math.max(0.01, k), Math.max(0.01, k), Math.max(0.01, k)); gr.children.forEach(m => { m.position.y = h * 0.5 * k; }); if (t >= 1) g.fx.sparks(at.clone().add(V(0, h * 0.5, 0)), 4, 0xe8f8ff, { speed: 5, life: 0.3 }); }); }
function frostHowl(c) { const g = c.g; audio.sfx('ice'); c.cast('push'); const d = c.flat(); const P0 = c.P(); word(g, P0.clone().add(V(0, 2.4, 0)).addScaledVector(d, 3), 'AWOOOO!', '#dff6ff', 1.8, 0.7, '#0a2a4a');
  for (let i = 0; i < 3; i++) after(g, i * 0.08, () => wave(g, c.eye().addScaledVector(d, 1.5), d, i % 2 ? WHITE : 0x9ad8ff, 0.5, 2.5, 0.5, { vel: d.clone().multiplyScalar(10), fat: true }));
  const cr = group(); const inner = group(); cr.add(inner); inner.rotation.x = -Math.PI / 2; outline(mesh(G.arc(), M.toon(0xe8f8ff, { emissive: 0x3a7aba }), inner, 0, 0, 0, 3, 3, 2.2), 1.06); mesh(G.arc(), M.glow(0x7ad0ff, 0.5), inner, 0, 0, 0, 3.15, 3.15, 4);
  cr.rotation.y = Math.atan2(d.x, d.z) + Math.PI; const seen = new Set(); let lastS = 0;
  run(g, cr, 1.05, (t, dt, s) => { const dist = s * 21; const C = P0.clone().addScaledVector(d, 1.5 + dist); C.y = g.groundAt(C.x, C.z) + 0.9; cr.position.copy(C); cr.scale.setScalar(Math.max(0.01, (0.6 + Math.min(1, s * 3) * 0.5) * (t > 0.85 ? (1 - t) / 0.15 : 1)));
    if (dist - lastS > 1.2) { lastS = dist; const rt = c.right(); for (const k of [-1.6, 0, 1.6]) if (Math.random() < 0.8) spike(c, c.ground(C.clone().addScaledVector(rt, k + R(0.5)).addScaledVector(d, -1.5)), 1.2 + Math.random() * 1.4, 1.2); g.fx.burst(C, 4, 0xdff6ff, { speed: 3, size: 0.4, life: 0.5, spread: 2 }); }
    if (c.local) for (const e of c.inR(C, 3.4)) if (!seen.has(e)) { seen.add(e); c.hitE(e, 1.3, { kb: 3, freeze: 1.8, from: P0 }); } }); }
function wolfRush(c) { const g = c.g; audio.sfx('ice'); const d = c.flat(); if (c.local) { const p = g.p; p.dash = 0.5; p.dashDir.copy(d); p.iframe = Math.max(p.iframe, 0.7); } c.lines(1.2); c.punch(0.02, 10);
  const W = wolf({ s: 1.15, op: 0.92 }); const seen = new Set(); let ph = 0, bit = false, trail = 0; const yaw = Math.atan2(d.x, d.z);
  run(g, W, 1.0, (t, dt, s) => { const P = c.P(); ph += dt * 18; let pos = P.clone().addScaledVector(d, 1.5); pos.y = g.groundAt(pos.x, pos.z); let open = 0;
    if (s > 0.5) { const u = clamp01((s - 0.5) / 0.3); pos.addScaledVector(d, u * 4); pos.y += Math.sin(u * Math.PI) * 1.6; open = u < 0.6 ? 1 : 0; }
    W.position.copy(pos); W.rotation.y = yaw; W.userData.anim(ph, s < 0.5 ? 1.2 : 0.3, open); W.scale.setScalar(Math.max(0.01, 1.15 * Math.min(1, s * 8) * (s > 0.85 ? (1 - s) / 0.15 : 1)));
    if ((trail -= dt) <= 0) { trail = 0.05; g.fx.burst(pos.clone().add(V(0, 0.6, 0)), 4, 0xdff6ff, { speed: 2, up: 1, size: 0.5, life: 0.6, grav: 0, spread: 1 }); if (Math.random() < 0.4) spike(c, c.ground(pos.clone().addScaledVector(d, -1.5).add(V(R(1), 0, R(1)))), 0.8 + Math.random(), 0.9); }
    if (s < 0.5) c.hitLine(P.clone().add(V(0, 1, 0)), d, 3.5, 1.9, 0.8, { kb: 4, freeze: 1.0 }, seen);
    if (!bit && s >= 0.72) { bit = true; const q = pos.clone().addScaledVector(d, 1.5).add(V(0, 1, 0)); word(g, q.clone().add(V(0, 1.8, 0)), 'GAAB!', '#dff6ff', 1.5, 0.5, '#0a2a4a'); g.fx.shock(q, 0x9ad8ff, 3, 0.3); g.fx.sparks(q, 14, 0xe8f8ff, { speed: 9 }); c.hitR(q, 3.5, 1.2, { kb: 6, up: 3, freeze: 1.4 }); c.shake(0.4); audio.sfx('bite'); } }); }
function blizzardFangs(c) { const g = c.g; audio.sfx('ice'); c.cast('raise'); const tgt = c.ground(c.aim(26)); const fl = c.flat(); const yaw = Math.atan2(fl.x, fl.z); const root = group(); root.position.copy(tgt); root.rotation.y = yaw;
  const up = group(), lo = group(); root.add(up, lo); const fm = M.toon(0xeefaff, { emissive: 0x3a7aba }); const gm = M.toon(0x9ad8ff, { emissive: 0x2a5a8a });
  for (const [gr, sgn] of [[up, -1], [lo, 1]]) { const jaw = mesh(G.ftorus(), gm, gr, 0, 0, 0, 3.6, 3.6, 3.5); jaw.rotation.x = Math.PI / 2; for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 2.6; const f = outline(mesh(G.cone(), fm, gr, Math.sin(a) * 3.4, sgn * 0.8, Math.cos(a) * 3.4 - 1, 0.32, i % 2 ? 1.5 : 2.1, 0.32), 1.08); if (sgn < 0) f.rotation.x = Math.PI; } }
  mesh(G.ftorus(), M.glow(0x7ad0ff, 0.25), root, 0, 2, 0, 4, 4, 6).rotation.x = Math.PI / 2; let snap = false; word(g, tgt.clone().add(V(0, 6, 0)), 'BLIZZARD FANGS!', '#dff6ff', 2.2, 0.8, '#0a2a4a');
  run(g, root, 1.35, (t, dt, s) => { const u = s < 0.45 ? 0 : clamp01((s - 0.45) / 0.12); up.position.y = 6.5 - u * 4.6; lo.position.y = -1.2 + u * 1.3; const k = Math.min(1, s * 5) * (s > 1.05 ? Math.max(0.01, 1 - (s - 1.05) / 0.3) : 1); root.scale.set(k, Math.max(0.01, k), k);
    if (s < 0.5) { for (let i = 0; i < 2; i++) { const a = Math.random() * 6.28; g.fx.burst(tgt.clone().add(V(Math.cos(a) * 4, 1 + Math.random() * 4, Math.sin(a) * 4)), 1, 0xffffff, { speed: 3, size: 0.4, life: 0.4, grav: 0, dir: V(-Math.sin(a) * 6, 0, Math.cos(a) * 6) }); } pull(c, tgt, 7, 4, dt); }
    if (!snap && u >= 1) { snap = true; const q = tgt.clone().add(V(0, 1.2, 0)); word(g, q.clone().add(V(0, 3, 0)), 'GACHIN!!', '#ffffff', 2.6, 0.7, '#0a2a4a'); g.fx.shock(q, 0xdff6ff, 5, 0.35); g.fx.sparks(q, 24, 0xffffff, { speed: 12, life: 0.45, grav: 16 }); g.fx.burst(q, 20, 0xdff6ff, { speed: 7, size: 0.5, life: 0.7 }); c.hitR(tgt, 4.4, 1.9, { kb: 3, up: 2, freeze: 2.0 }); c.shake(0.7); c.punch(0.04, 4); audio.sfx('bite'); audio.sfx('boom', { vol: 0.6 }); } }); }
function wolfPack(c) { const g = c.g; audio.sfx('ice'); const P0 = c.P(); word(g, P0.clone().add(V(0, 2.6, 0)).addScaledVector(c.flat(), 4), 'SNOW WOLF PACK!', '#dff6ff', 2, 0.9, '#0a2a4a'); const claimed = new Set();
  for (let i = 0; i < 4; i++) { const W = wolf({ s: 0.8, op: 0.9 }); const a = c.yaw() + Math.PI + (i - 1.5) * 0.9; const pos = c.ground(P0.clone().add(V(-Math.sin(a) * -2.2, 0, -Math.cos(a) * -2.2))); let head = c.yaw() + Math.PI; let tgt = null, bite = 0, bites = 0, ph = Math.random() * 6, orbitA = i * 1.57;
    g.fx.burst(pos.clone().add(V(0, 1, 0)), 16, 0xdff6ff, { speed: 5, size: 0.5, life: 0.6 }); spike(c, pos.clone(), 1.6, 0.6);
    run(g, W, 4.4, (t, dt, s) => { if (!tgt || tgt.dead) { tgt = null; let bd = 22; for (const e of g.enemies) { if (e.dead || (claimed.has(e) && g.enemies.filter(x => !x.dead).length > claimed.size)) continue; const dd = e.c.root.position.distanceTo(pos); if (dd < bd) { bd = dd; tgt = e; } } if (tgt) claimed.add(tgt); }
      let want; if (tgt) want = tgt.c.root.position; else { orbitA += dt * 2; const P = c.P(); want = P.clone().add(V(Math.cos(orbitA) * 3, 0, Math.sin(orbitA) * 3)); }
      const to = want.clone().sub(pos).setY(0); const dist = to.length(); let open = 0; bite -= dt; const lead = tgt ? 1.4 + (tgt.boss ? 1 : 0) : 0.4;
      if (dist > lead) { const spd = Math.min(dist - lead, 13 * dt); pos.addScaledVector(to.normalize(), spd); ph += dt * 16; } else if (tgt && bite <= 0 && bites < 4) { bite = 0.6; bites++; open = 1; const q = g.chest(tgt, V()); g.fx.sparks(q, 8, 0xe8f8ff, { speed: 7 }); g.fx.shock(q, 0x9ad8ff, 1.5, 0.25); c.hitE(tgt, 0.42, { kb: 2, freeze: 0.8, from: pos }); }
      if (bite > 0.4) open = 1; pos.y = g.groundAt(pos.x, pos.z); const wantH = dist > 0.05 ? Math.atan2(to.x, to.z) : head; let dh = wantH - head; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); head += dh * Math.min(1, dt * 10);
      W.position.copy(pos); if (open) W.position.y += 0.3; W.rotation.y = head; W.userData.anim(ph, dist > lead ? 1 : 0.15, open); const k = Math.min(1, s * 5) * (s > 4.1 || bites >= 4 && bite < 0.1 ? 0 : 1); W.scale.setScalar(Math.max(0.01, 0.8 * k));
      if (Math.random() < 0.3) g.fx.burst(pos.clone().add(V(0, 0.5, 0)), 1, 0xdff6ff, { speed: 1, size: 0.4, life: 0.5, grav: 0 });
      if (t >= 1 || (k === 0 && !W.userData.gone)) { if (!W.userData.gone) { W.userData.gone = 1; g.fx.sparks(pos.clone().add(V(0, 1, 0)), 14, 0xe8f8ff, { speed: 8 }); g.fx.burst(pos.clone().add(V(0, 1, 0)), 10, 0xdff6ff, { speed: 4, size: 0.5, life: 0.5 }); } } }); } }
function divineBlizzard(c, P0) { const g = c.g; const root = group(); const body = showBody(c, P0); const fl = c.flat(); const yaw = Math.atan2(fl.x, fl.z); const tgt = c.ground(P0.clone().addScaledVector(fl, 10)); const W = wolf({ s: 4.2, op: 0.95 }); root.add(W); const back = c.ground(P0.clone().addScaledVector(fl, -6));
  let ringR = 0, rt = 0, landed = false, snow = 0, ph = 0; const sp = { look: null }; const lk = V();
  run(g, root, 5.1, (t, dt, s) => { const T = s - 1.1; body && body.tick({ aim: T > 0 && T < 2.3 }); ph += dt * 10;
    if ((snow -= dt) <= 0) { snow = 0.05; for (let i = 0; i < 3; i++) g.fx.burst(P0.clone().add(V(R(22), 10 + Math.random() * 6, R(22))), 1, 0xffffff, { speed: 1, up: -3, size: 0.45, life: 2, grav: 2, dir: V(3, 0, 1) }); }
    let pos, open = 0, runK = 0; const k = Math.min(1, s / 0.9);
    if (T < 2.3) { pos = back.clone(); W.userData.head.rotation.x = T > 0 && T < 1.0 ? -0.7 : -0.2; open = T > 0 && T < 1.0 ? 1 : 0; if (T > 0 && T < 0.05 && !W.userData.howl) { W.userData.howl = 1; word(g, back.clone().add(V(0, 11, 0)), 'AWOOOOOO!', '#dff6ff', 4, 1.2, '#0a2a4a'); for (let i = 0; i < 4; i++) after(g, i * 0.12, () => g.fx.shock(back.clone().add(V(0, 8, 0)), 0x9ad8ff, 8 + i * 4, 0.5)); audio.sfx('ice'); } }
    else { const u = clamp01((T - 2.3) / 0.7); pos = back.clone().lerp(tgt, ease(u)); pos.y += Math.sin(u * Math.PI) * 8; runK = u < 1 ? 0.4 : 0.1; open = u > 0.4 && u < 1 ? 1 : 0; W.userData.head.rotation.x = u < 1 ? 0.2 : -0.5; }
    W.position.copy(pos); W.rotation.y = yaw; W.userData.anim(ph, runK, open); W.scale.setScalar(Math.max(0.01, 4.2 * k * (T > 3.6 ? Math.max(0.01, 1 - (T - 3.6) / 0.4) : 1)));
    if (T > 0.4 && T < 2.2 && (rt -= dt) <= 0) { rt = 0.3; ringR += 3.4; const n = Math.round(6 + ringR * 0.8); for (let i = 0; i < n; i++) { const a = i / n * 6.283 + ringR; spike(c, c.ground(P0.clone().add(V(Math.cos(a) * ringR, 0, Math.sin(a) * ringR))), 2 + Math.random() * 2.5, 1.6, 0.3); } wave(g, P0.clone().setY(g.groundAt(P0.x, P0.z) + 0.2), null, 0xdff6ff, ringR - 2, ringR + 1, 0.5, { fat: true }); for (const e of c.inR(P0, ringR + 1.5)) if (e.c.root.position.distanceTo(P0) > ringR - 3.5) c.hitE(e, 0.3, { kb: 2, up: 3, freeze: 1.6, from: P0 }); c.shake(0.35); }
    if (!landed && T >= 3.0) { landed = true; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; const at = c.ground(tgt.clone().add(V(Math.cos(a) * 6, 0, Math.sin(a) * 6))); spike(c, at, 5 + Math.random() * 3, 1.9, 0.25); } spike(c, tgt.clone(), 8, 1.9, 0.05); boom(c, tgt.clone().add(V(0, 1, 0)), 0xdff6ff, 10, { star: 0xffffff, spark: 0xe8f8ff, dustCol: 0xffffff });
      word(g, tgt.clone().add(V(0, 11, 0)), 'DIVINE BLIZZARD!', '#dff6ff', 4.5, 1.2, '#0a2a4a'); c.hitR(tgt, 14, 2.4, { kb: 10, up: 5, freeze: 2.5 }); c.shake(1.2); audio.sfx('boom'); }
    sp.look = T < 2.3 ? lk.copy(P0).lerp(back, 0.5).add(V(0, 4, 0)) : lk.copy(pos).add(V(0, 2, 0));
    if (t >= 1 && body) body.dispose(); });
  return sp; }

export const ULTRA = { nika: [bajrangGun, dawnRocket, toonForce, bajrangRain], seiryu: [boroBreath, boloStorm, dragonTwister, thunderBagua], sound: [resonance, echoShots, soundBomb, sonicLance], makami: [frostHowl, wolfRush, blizzardFangs, wolfPack] };
export const ULTRA_SP = { drums, kaifu, requiem, blizzard: divineBlizzard };
export const ULTRA_STYLE = { nika: 'drums', seiryu: 'kaifu', sound: 'requiem', makami: 'blizzard' };
export { showBody, comet, fireHit, spike, dropFist };
