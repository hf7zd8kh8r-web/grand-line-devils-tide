import { THREE } from './engine.js';
import { FRUITS, SWORDS, GUNS, GUN_SKILLS, swordDmg, T2 } from './data.js';
import * as ST from './state.js';
import { STYLES, styleOf } from './styles.js';
const B = THREE; const V = () => new B.Vector3();
const FCOL = { gomu: 0xff9ad0, mera: 0xff6a1a, pika: 0xfff27a };
const fcol = id => FCOL[id] || (FRUITS[id] ? FRUITS[id].col[0] : 0xffffff);
// Zoan fruits: transform toggle (Hybrid -> Full Beast -> Human) with beast moves
export const ZOAN = { phoenix: ['Phoenix', 0x3ad0ff, 'Flame Talon', 'Blue Flame Dive', 'Regen Wing Storm', 'Phoenix Brand'], kitsune: ['Nine-Tailed Fox', 0xffd890, 'Fox Fire Pounce', 'Nine Tails Sweep', 'Foxfire Howl', 'Spirit Fox Rush'], orochi: ['Eight-Headed Serpent', 0x7a4a9a, 'Serpent Strike', 'Eight-Head Bite', 'Coil Crush', 'Yamata Rampage'], ptera: ['Pteranodon', 0x9a7a5a, 'Dive Bomb', 'Wing Cutter', 'Sky Charge', 'Ptera Tornado'], brachio: ['Brachiosaurus', 0x7a8a5a, 'Neck Slam', 'Stomp Quake', 'Tail Whip', 'Brachio Crush'], onyudo: ['Giant Monk', 0xc8b8a8, 'Monk Palm', 'Giant Stomp', 'Cloud Grab', 'Onyudo Fall'], pegasus: ['Pegasus', 0xf2f2ff, 'Hoof Kick', 'Sky Gallop', 'Wing Gale', 'Pegasus Meteor'], kumo: ['Spider', 0x6a2a2a, 'Venom Fang', 'Web Snare', 'Eight-Leg Rush', 'Spider Nest'], raijin: ['Leopard', 0xe0b050, 'Leopard Pounce', 'Claw Flurry', 'Predator Dash', 'Leopard Rampage'], leviathan: ['Spinosaurus', 0x3a7a6a, 'Sail Slash', 'Jaw Crush', 'Tail Wave', 'Spino Charge'], seiryu: ['Azure Dragon', 0x4a8aff, 'Dragon Claw', 'Bolo Breath', 'Dragon Twister', 'Heavenly Dragon Dive'], makami: ['Wolf', 0xe8f0ff, 'Frost Fang', 'Ice Howl', 'Moon Pounce', 'Great Wolf Charge'], buddha: ['Great Buddha', 0xffd040, 'Buddha Palm', 'Shockwave Slam', 'Golden Stomp', 'Impact Wave'] };
const BEASTK = ['g:dash', 'g:barrage', 'g:aoe', 'g:wave'];
export const UNLOCK = [1, 10, 25, 50]; export const UNLOCK2 = [1, 10]; // mastery needed per move slot (4-move kits / 2-move swords+guns)
export const SP_REQ = { 4: 50, 5: 40, 6: 30, 7: 25 }; // cutscene special: Legendary 50, Godly 40, Mythical 30, Ultra 25
// move list + required mastery for any item (bag, shops, dojo, buttons)
export function moveInfo(S, kind, id) { const key = { fruit: 'fr:', sword: 'sw:', gun: 'gn:', style: 'fs:' }[kind] + id; const m = ST.mastery(S, key).lvl; let names = [], req = UNLOCK, sp = null;
  if (kind === 'fruit') { const f = FRUITS[id]; names = f.moves.map(x => x.name); if (f.special) sp = { name: f.special.name, req: SP_REQ[f.rar] || 50 }; }
  else if (kind === 'sword') { names = SWORDS[id].moves.map(x => x.name); req = UNLOCK2; }
  else if (kind === 'gun') { names = (GUN_SKILLS[id] || [['rapid', 'Rapid Fire']]).map(x => x[1]); req = UNLOCK2; }
  else if (kind === 'style') { const st = STYLES[id]; names = st ? st.moves.map(x => x[1]) : []; }
  return { m, moves: names.map((n, i) => ({ name: n, req: req[i] ?? 50, ok: m >= (req[i] ?? 50) })), sp: sp && { ...sp, ok: m >= sp.req } }; }
export function moveListHtml(S, kind, id) { const I = moveInfo(S, kind, id); return `<small class="mvl">${I.moves.map(x => `<i class="${x.ok ? 'ok' : 'lk'}">${x.ok ? '✔' : '🔒'} ${x.name}${x.ok ? '' : ` <em>M${x.req}</em>`}</i>`).join('')}${I.sp ? `<i class="${I.sp.ok ? 'ok sp' : 'lk sp'}">${I.sp.ok ? '★' : '🔒'} ${I.sp.name}${I.sp.ok ? '' : ` <em>M${I.sp.req}</em>`}</i>` : ''}</small>`; }
export function movesFor(S) {
  const slot = S.slot;
  if (slot === 'fruit' && S.eq.fruit) { const f = FRUITS[S.eq.fruit]; const m = ST.mastery(S, 'fr:' + S.eq.fruit).lvl;
    if (S.tf === 2 && ZOAN[S.eq.fruit]) { const z = ZOAN[S.eq.fruit]; return f.moves.map((mv, i) => ({ ...mv, k: BEASTK[i % 4], name: z[2 + (i % 4)], dmg: (mv.dmg || 1.5) * 1.15, id: 'fr:beast' + i, src: 'fruit', fruit: S.eq.fruit, beast: true, lock: m < UNLOCK[i] ? `Needs ${f.short} mastery ${UNLOCK[i]}` : null, req: UNLOCK[i] })); }
    return f.moves.map((mv, i) => ({ ...mv, id: 'fr:' + mv.k, src: 'fruit', fruit: S.eq.fruit, lock: m < UNLOCK[i] ? `Needs ${f.short} mastery ${UNLOCK[i]}` : null, req: UNLOCK[i] })); }
  if (slot === 'sword' && S.eq.sword) { const s = SWORDS[S.eq.sword]; const m = ST.mastery(S, 'sw:' + S.eq.sword).lvl;
    return s.moves.map((mv, i) => ({ ...mv, id: 'sw:' + mv.k, src: 'sword', dmg: i ? 1.6 : 2.2, lock: m < UNLOCK2[i] ? `Needs ${s.name} mastery ${UNLOCK2[i]}` : null, req: UNLOCK2[i] })); }
  if (slot === 'gun' && S.eq.gun) { const ml = ST.mastery(S, 'gn:' + S.eq.gun).lvl; return (GUN_SKILLS[S.eq.gun] || [['rapid', 'Rapid Fire']]).map(([k, name, dm], i) => ({ k: k === 'rapid' ? 'rapid' : 'g:' + k, id: 'gn:' + S.eq.gun + i, name, cd: [7, 11][i], src: 'gun', dmg: dm || 1, lock: ml < UNLOCK2[i] ? `Needs gun mastery ${UNLOCK2[i]}` : null, req: UNLOCK2[i] })); }
  const st = styleOf(S); const m = ST.mastery(S, 'fs:' + st.id).lvl;
  return st.moves.map(([kind, name, dm], i) => ({ k: kind === 'heavy' || kind === 'kick' ? kind : (st.id === 'brawler' && i === 2 ? 'smash' : 'g:' + kind), id: 'fs:' + st.id + i, name, cd: [3, 5, 8, 12][i], src: 'fist', dmg: dm, style: st.id, lock: m < UNLOCK[i] ? `Needs ${st.name} mastery ${UNLOCK[i]}` : null, req: UNLOCK[i] }));
}
function fd(g, m) { const S = g.save; const key = m.src === 'fruit' ? 'fr:' + S.eq.fruit : m.src === 'sword' ? 'sw:' + S.eq.sword : m.src === 'gun' ? 'gn:' + S.eq.gun : 'fs:' + styleOf(S).id;
  let base = g.baseDmg(); if (m.src === 'fist') base *= styleOf(S).pow * (styleOf(S).needsHaki && S.haki && S.haki.buso ? 1.1 : 1); if (m.src === 'fruit') base *= 1 + FRUITS[S.eq.fruit].rar * 0.18; if (m.src === 'sword') base = swordDmg(S, S.eq.sword) * (1 + S.lvl * 0.06) * g.st.dmg; if (m.src === 'gun') base = GUNS[S.eq.gun].dmg * (1 + S.lvl * 0.06) * g.st.dmg;
  return { dmg: base * (m.dmg || 1) * ST.mastMul(S, key), key }; }
function aimPoint(g, max = 30) { const o = g.eyePos().clone(); const d = g.fwd(V()); const hit = g.rayEnemy(o, d, max, 1.0); if (hit) return g.chest(hit.e, V());
  for (let t = 1; t < max; t += 0.5) { const p = o.clone().addScaledVector(d, t); if (p.y < g.island.hf(p.x, p.z) + 0.2) return p; } return o.addScaledVector(d, max); }
function title(g, name, col) { g.ui.moveName(name, col); }
// themed basic (click) attack per fruit: stretch punch, elemental bolt, blade slash, beast claw, or shock palm
const BASIC = {}; { const set = (k, ids) => ids.split(' ').forEach(id => BASIC[id] = k);
  set('stretch', 'gomu nika mochi bane');
  set('bolt', 'mera pika hie goro magu moku suna yuki gasu numa yami doku bomu awa doru pero kage mero bari noro horo hana mori fuwa jiki goru atsu woshu beri toge sound hobi');
  set('slash', 'supa ito ope bara sabi mira nagi');
  set('claw', 'phoenix kitsune orochi ptera brachio onyudo pegasus kumo raijin leviathan seiryu makami');
  set('pulse', 'gura zushi sube kilo ton ori baku doa beta horu sui toki bisu shiro soru buddha thunderbird mane'); }
export const basicKind = id => BASIC[id] || 'pulse';
export function fruitBasic(g, id, combo) {
  const S = g.save; const col = fcol(id); const key = 'fr:' + id; const f = FRUITS[id]; const kind = basicKind(id); const big = combo === 4;
  const tf = S.tf ? (S.tf === 2 ? 1.35 : 1.15) : 1; // Zoan transform boosts claws
  const dmg = g.baseDmg() * (1 + f.rar * 0.18) * 0.95 * ST.mastMul(S, key) * (big ? 1.8 : 1) * (kind === 'claw' ? tf : 1);
  const O = { mast: key, mastName: f.short, col, cls: 'fruit' };
  const hand = g.eyePos().clone().addScaledVector(g.fwd(V()), 1.1).add(new B.Vector3(0, -0.25, 0));
  if (kind === 'stretch') { g.vm.doCast(big ? 1 : 0.6); const reach = big ? 7 : 5.2; const tip = g.eyePos().clone().addScaledVector(g.fwd(V()), reach);
    g.fx.beam(hand, tip, id === 'nika' ? 0xffffff : 0xffc9a0, big ? 0.32 : 0.2, 0.14); g.fx.orb(tip, col, big ? 1.4 : 0.8, 0.18); g.fx.burst(tip, 8, col, { speed: 3, size: 0.35, life: 0.3 });
    for (const e of g.enemiesInCone(reach, 0.28)) g.damageEnemy(e, dmg, { ...O, kb: big ? 8 : 3 }); return; }
  if (kind === 'bolt') { g.vm.doCast(0); const fw = g.fwd(V()); const n = big ? 3 : 1;
    for (let i = 0; i < n; i++) { const d = fw.clone().applyAxisAngle(new B.Vector3(0, 1, 0), (i - (n - 1) / 2) * 0.12);
      const m = new B.Mesh(g.fx.sphGeo, new B.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.95, blending: B.AdditiveBlending, depthWrite: false })); m.scale.setScalar(big ? 0.42 : 0.3);
      g.projectile({ pos: hand.clone(), vel: d.multiplyScalar(id === 'pika' || id === 'goro' ? 60 : 34), r: 0.8, dmg: dmg * (big ? 0.7 : 0.85), kb: big ? 5 : 2, life: 0.9, player: true, mesh: m, col, mast: key,
        onTick: (pr) => { if (Math.random() < 0.6) g.fx.burst(pr.mesh.position, 1, col, { speed: 0.6, size: 0.35, life: 0.25, grav: id === 'mera' ? -2 : 0, spread: 0.2 }); },
        onEnd: (pr) => g.fx.burst(pr.mesh.position, 8, col, { speed: 3, size: 0.4, life: 0.35 }) }); }
    g.fx.burst(hand, 6, col, { speed: 2, size: 0.3, life: 0.25, grav: 0 }); return; }
  if (kind === 'slash') { g.vm.doPunch(); const r = big ? 4.4 : 3.6; const e0 = g.eyePos(); const fl = g.fwdFlat(V()); const yaw = Math.atan2(fl.x, fl.z); const sd = (g.vm.side || 1);
    for (let i = 0; i < 6; i++) { const a1 = yaw + sd * (-0.9 + i * 0.3), a2 = a1 + sd * 0.3; g.fx.beam(new B.Vector3(e0.x + Math.sin(a1) * r * 0.8, e0.y - 0.3 + i * 0.04, e0.z + Math.cos(a1) * r * 0.8), new B.Vector3(e0.x + Math.sin(a2) * r * 0.8, e0.y - 0.3 + (i + 1) * 0.04, e0.z + Math.cos(a2) * r * 0.8), id === 'ope' ? 0x7ad0ff : col, 0.1, 0.16); }
    for (const e of g.enemiesInCone(r, 0.75)) g.damageEnemy(e, dmg * 0.95, { ...O, kb: big ? 6 : 2 }); return; }
  if (kind === 'claw') { const reach = (big ? 3.6 : 3.1) * (tf > 1 ? 1.2 : 1); const c = g.eyePos().clone().addScaledVector(g.fwd(V()), 2);
    for (let k = 0; k < 3; k++) g.fx.beam(c.clone().add(new B.Vector3(-0.6 + k * 0.4, 0.7, 0)), c.clone().add(new B.Vector3(-0.2 + k * 0.4, -0.7, 0)), col, 0.08, 0.15);
    g.fx.burst(c, 8, col, { speed: 3, size: 0.35, life: 0.3, grav: 0 });
    const hits = g.enemiesInCone(reach, 0.5); for (const e of hits) g.damageEnemy(e, dmg * 0.6, { ...O, kb: 1.5 });
    setTimeout(() => { if (g.dead) return; g.vm.doPunch(); for (const e of g.enemiesInCone(reach, 0.5)) g.damageEnemy(e, dmg * 0.55, { ...O, kb: big ? 7 : 2.5 }); }, 120); return; }
  // pulse: shock palm with a small shockwave cone
  const reach = big ? 4 : 3.2; const tip = g.eyePos().clone().addScaledVector(g.fwd(V()), 1.8);
  g.fx.ring(tip, col, big ? 2.6 : 1.6, 0.25, false); g.fx.burst(hand, 8, col, { speed: 3, size: 0.3, life: 0.3, grav: 0 }); if (big) g.fx.shake = Math.max(g.fx.shake, 0.25);
  for (const e of g.enemiesInCone(reach, 0.5)) g.damageEnemy(e, dmg, { ...O, kb: big ? 9 : 3.5 });
}
export function castMove(g, m) {
  const S = g.save, p = g.p; let { dmg, key } = fd(g, m); if (m.src === 'fruit' && S.awake && S.awake[S.eq.fruit]) dmg *= 1.5; const col = m.src === 'fruit' ? fcol(S.eq.fruit) : m.src === 'sword' ? 0xdff0ff : m.src === 'gun' ? 0xffb04a : styleOf(S).col;
  const eye = () => g.eyePos().clone(); const fw = () => g.fwd(V()); const fl = () => g.fwdFlat(V());
  const O = { mast: key, mastName: m.name, col, cls: m.src === 'fruit' ? 'fruit' : '' };
  title(g, m.name, col);
  if (m.k.startsWith('g:')) return generic(g, m.k.slice(2), dmg, col, O, m);
  switch (m.k) {
    // ---- fighting style ----
    case 'heavy': g.vm.doPunch(); g.vm.punch = 1; p.lunge = fl().multiplyScalar(10); for (const e of g.enemiesInCone(3.2, 0.3)) g.damageEnemy(e, dmg, { ...O, kb: 12 * (['sumo', 'giant'].includes(styleOf(S).id) ? 1.8 : 1), up: 3 }); g.fx.ring(eye().addScaledVector(fw(), 1.5), col, 1.5, 0.25, false); g.fx.burst(eye().addScaledVector(fw(), 1.4), 14, col, { speed: 5, size: 0.35, life: 0.35, grav: 0 }); g.fx.shake += 0.2; break;
    case 'kick': { g.vm.doKick && g.vm.doKick(); const c = p.pos.clone().setY(p.pos.y + 0.8); g.fx.ring(c, col, 4, 0.35); g.fx.burst(c, 16, col, { speed: 6, size: 0.4, life: 0.4, grav: 0 }); for (const e of g.enemiesInRadius(c, 3.4)) g.damageEnemy(e, dmg, { ...O, kb: 8 }); g.fx.shake += 0.15; break; }
    case 'smash': p.vy = 6; setTimeout(() => { const c = p.pos.clone().setY(p.pos.y + 0.2); g.fx.ring(c, 0xd9c08a, 7, 0.5); g.fx.burst(c, 40, 0xc9a87a, { speed: 8, up: 5, size: 0.5, life: 0.8 }); g.fx.shake = 0.6; for (const e of g.enemiesInRadius(c, 5.5)) g.damageEnemy(e, dmg, { ...O, kb: 9, up: 5 }); }, 450); break;
    // ---- sword ----
    case 'slash': { g.vm.doSwing(); const o = eye().add(new B.Vector3(0, -0.3, 0)); const d = fl(); const wave = new B.Mesh(new B.TorusGeometry(1.2, 0.08, 4, 16, Math.PI), new B.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.9, blending: B.AdditiveBlending, depthWrite: false })); wave.rotation.y = Math.atan2(d.x, d.z); wave.rotation.z = Math.PI / 2;
      g.projectile({ pos: o.addScaledVector(d, 1), vel: d.multiplyScalar(22), r: 1.3, dmg, life: 0.9, player: true, mesh: wave, pierce: true, kb: 6, mast: key, col: 0xcfe8ff }); break; }
    case 'spin': { g.vm.doSwing(); const c = p.pos.clone().setY(p.pos.y + 0.9); let n = 0; const iv = setInterval(() => { g.vm.doSwing(); g.fx.ring(p.pos.clone().setY(p.pos.y + 0.9), 0xcfe8ff, 4.2, 0.3); for (const e of g.enemiesInRadius(p.pos, 4)) g.damageEnemy(e, dmg * 0.45, { ...O, kb: 4 }); if (++n >= 4) clearInterval(iv); }, 140); break; }
    // ---- gun ----
    case 'rapid': { let n = 0; const iv = setInterval(() => { g.p.atkCd = 0; g.attack(); if (++n >= 6) clearInterval(iv); }, 110); break; }
    // ---- Gum-Gum ----
    case 'pistol': { g.vm.doCast(1); const o = eye(); const d = fw(); const r = g.rayEnemy(o, d, 16, 1.0); const end = o.clone().addScaledVector(d, r ? r.d : 16);
      g.fx.beam(o.clone().add(new B.Vector3(0, -0.3, 0)), end, 0xf2c49b, 0.25, 0.3); g.fx.burst(end, 14, col, { speed: 5, size: 0.35, life: 0.4 }); if (r) g.damageEnemy(r.e, dmg, { ...O, kb: 10 }); break; }
    case 'gatling': { let n = 0; g.vm.gatling = 1; const iv = setInterval(() => { const c = eye().addScaledVector(fw(), 2.5); for (let i = 0; i < 2; i++) g.fx.burst(c.clone().add(new B.Vector3((Math.random() - .5) * 2, (Math.random() - .5) * 1.4, (Math.random() - .5) * 2)), 2, 0xf2c49b, { speed: 1, size: 0.5, life: 0.15, grav: 0 });
      for (const e of g.enemiesInCone(5.5, 0.55)) g.damageEnemy(e, dmg, { ...O, kb: 1, stun: 0.3 }); g.fx.shake = Math.max(g.fx.shake, 0.2); if (++n >= 14) { clearInterval(iv); g.vm.gatling = 0; } }, 100); break; }
    case 'bazooka': { g.vm.doCast(0); setTimeout(() => { const c = eye().addScaledVector(fw(), 2.5); g.fx.ring(c, 0xffffff, 3, 0.3, false); g.fx.burst(c, 30, col, { speed: 8, size: 0.4, life: 0.5 }); g.fx.shake = 0.5; for (const e of g.enemiesInCone(5, 0.35)) g.damageEnemy(e, dmg, { ...O, kb: 22, up: 6 }); }, 220); break; }
    // ---- Flame ----
    case 'firefist': { g.vm.doCast(0); const o = eye().addScaledVector(fw(), 1).add(new B.Vector3(0, -0.2, 0)); const m2 = new B.Mesh(g.fx.sphGeo, new B.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.9, blending: B.AdditiveBlending, depthWrite: false })); m2.scale.setScalar(0.9);
      const boom = (pr) => { const c = pr.mesh.position.clone(); g.fx.orb(c, 0xff8a2a, 4, 0.5); g.fx.burst(c, 40, 0xff6a1a, { speed: 9, size: 0.6, life: 0.7, grav: -4 }); g.fx.shake = Math.max(g.fx.shake, 0.4); for (const e of g.enemiesInRadius(c, 4.5)) g.damageEnemy(e, dmg, { ...O, kb: 9, from: c }); };
      g.projectile({ pos: o, vel: fw().multiplyScalar(30), r: 1, dmg: 0, life: 1.2, player: true, mesh: m2, onHit: () => {}, onEnd: boom, onTick: (pr) => g.fx.burst(pr.mesh.position, 3, 0xffa030, { speed: 1, size: 0.7, life: 0.35, grav: -3, spread: 0.6 }) }); break; }
    case 'pillar': { const c = p.pos.clone(); g.fx.pillar(c, 0xff5a10, 5.5, 12, 1.4); g.fx.ring(c.clone().setY(c.y + 0.2), 0xffa030, 7, 0.6); let n = 0; const iv = setInterval(() => { g.fx.burst(c.clone().setY(c.y + 1 + Math.random() * 4), 12, 0xff6a1a, { speed: 6, size: 0.7, life: 0.6, grav: -6, spread: 4 }); for (const e of g.enemiesInRadius(c, 6.5)) g.damageEnemy(e, dmg * 0.4, { ...O, kb: 3, up: 3, from: c }); if (++n >= 5) clearInterval(iv); }, 220); break; }
    case 'firedash': { const d = fl(); p.dash = 0.4; p.dashDir.copy(d); p.iframe = 0.5; const hit = new Set(); let n = 0; const iv = setInterval(() => { g.fx.burst(p.pos.clone().setY(p.pos.y + 0.6), 10, 0xff6a1a, { speed: 2, size: 0.8, life: 0.6, grav: -4, spread: 1 }); for (const e of g.enemiesInRadius(p.pos, 2.6)) if (!hit.has(e)) { hit.add(e); g.damageEnemy(e, dmg, { ...O, kb: 6, up: 4 }); } if (++n >= 9) clearInterval(iv); }, 45); break; }
    case 'emperor': { g.vm.doCast(0); const c = p.pos.clone().setY(p.pos.y + 7); const sun = new B.Mesh(g.fx.sphGeo, new B.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.95, blending: B.AdditiveBlending, depthWrite: false }));
      g.fx.add(sun, 1.0, (t) => { sun.position.copy(c); sun.scale.setScalar(0.5 + t * 3.5); g.fx.burst(c, 4, 0xffb030, { speed: 3, size: 1, life: 0.5, grav: 0, spread: 3 }); });
      setTimeout(() => { const tgt = aimPoint(g, 40); const m2 = new B.Mesh(g.fx.sphGeo, sun.material.clone()); m2.scale.setScalar(4); const v = tgt.clone().sub(c).normalize().multiplyScalar(26);
        g.projectile({ pos: c, vel: v, r: 3, dmg: 0, life: 2.5, player: true, mesh: m2, onHit: () => {}, onEnd: (pr) => { const q = pr.mesh.position.clone(); g.fx.orb(q, 0xff7a1a, 9, 0.8); g.fx.ring(q, 0xffd080, 12, 0.7); g.fx.burst(q, 80, 0xff6a1a, { speed: 14, size: 0.9, life: 1, grav: -3 }); g.fx.shake = 1; for (const e of g.enemiesInRadius(q, 9)) g.damageEnemy(e, dmg, { ...O, kb: 14, up: 8, from: q }); }, onTick: (pr) => g.fx.burst(pr.mesh.position, 6, 0xff8a1a, { speed: 3, size: 1.2, life: 0.4, grav: 0, spread: 3 }) }); }, 1000); break; }
    // ---- Light ----
    case 'beads': { let n = 0; const iv = setInterval(() => { const o = eye().add(new B.Vector3((Math.random() - .5) * 1.2, -0.2 + (Math.random() - .5) * 0.6, 0)).addScaledVector(fw(), 0.8); const tgt = aimPoint(g, 35); const v = tgt.sub(o).normalize().multiplyScalar(45);
      const m2 = new B.Mesh(g.fx.sphGeo, new B.MeshBasicMaterial({ color: 0xfff6a0, blending: B.AdditiveBlending, transparent: true })); m2.scale.setScalar(0.18);
      g.projectile({ pos: o, vel: v, r: 0.8, dmg, life: 1, player: true, mesh: m2, kb: 1.5, mast: key, col, onEnd: (pr) => g.fx.burst(pr.mesh.position, 5, 0xfff27a, { speed: 4, size: 0.3, life: 0.3 }) }); if (++n >= 16) clearInterval(iv); }, 85); break; }
    case 'lightkick': { const o = p.pos.clone(); const d = fl(); let L = 16; const r = g.rayEnemy(g.eyePos().clone(), g.fwd(V()), 18, 1.2); if (r) L = Math.max(0, r.d - 1.2);
      const end = o.clone().addScaledVector(d, L); end.y = g.groundAt(end.x, end.z); g.fx.beam(o.clone().setY(o.y + 1), end.clone().setY(end.y + 1), 0xfff27a, 0.6, 0.35);
      for (const e of g.enemies) { if (e.dead) continue; const to = e.c.root.position.clone().sub(o); const t = to.dot(d); if (t < 0 || t > L + 2.5) continue; if (to.addScaledVector(d, -t).setY(0).length() < 2) g.damageEnemy(e, dmg, { ...O, kb: 12, up: 5 }); }
      p.pos.copy(end); g.collide(p.pos, 0.4); g.fx.burst(end.clone().setY(end.y + 1), 30, 0xfff27a, { speed: 7, size: 0.4, life: 0.5 }); g.fx.shake = 0.3; break; }
    case 'lightsword': { g.vm.setMode('sword'); g.vm.setSword({ col: 0xfff6a0, len: 1.4, guard: 0xffe060 }); g.vm.tint(0xfff27a, 1.2); let n = 0; const iv = setInterval(() => { g.vm.doSwing(); g.fx.burst(eye().addScaledVector(fw(), 2), 16, 0xfff27a, { speed: 5, size: 0.35, life: 0.3, grav: 0, spread: 2 }); for (const e of g.enemiesInCone(5, 0.2)) g.damageEnemy(e, dmg * 0.6, { ...O, kb: 5 }); if (++n >= 3) { clearInterval(iv); setTimeout(() => g.refreshEquip(), 300); } }, 260); break; }
    case 'mirror': { let tgt = aimPoint(g, 30); tgt.y = g.groundAt(tgt.x, tgt.z); g.fx.beam(g.eyePos().clone(), tgt.clone().setY(tgt.y + 1.5), 0xffffff, 0.5, 0.3); p.pos.copy(tgt); g.collide(p.pos, 0.4); p.vy = 0; p.iframe = 0.4;
      const c = p.pos.clone().setY(p.pos.y + 1); g.fx.orb(c, 0xfff27a, 3.5, 0.4); g.fx.burst(c, 30, 0xfff27a, { speed: 8, size: 0.4, life: 0.5 }); for (const e of g.enemiesInRadius(p.pos, 4)) g.damageEnemy(e, dmg, { ...O, kb: 9 }); break; }
  }
}
export function castSpecial(g, sp) {
  const p = g.p; const S = g.save; let { dmg, key } = fd(g, { src: 'fruit', dmg: sp.dmg }); if (S.awake && S.awake[S.eq.fruit]) dmg *= 1.5; const col = S.eq.fruit === 'pika' ? 0xfff27a : fcol(S.eq.fruit);
  const F = FRUITS[S.eq.fruit] || {}; const ultra = F.rar === 7; const style = sp.style || 'rain';
  const start = g.cam.position.clone(); const startQ = g.cam.quaternion.clone(); const look = new B.PerspectiveCamera(); let t = 0; const D = ultra ? 5.6 : 4.4; let drops = 0;
  g.ui.letterbox(true); g.ui.specialCard(sp.name, '#' + col.toString(16).padStart(6, '0'), ultra ? 'ULTRA SPECIAL' : F.rar === 6 ? 'MYTHICAL SPECIAL' : F.rar === 5 ? 'GODLY SPECIAL' : 'LEGENDARY SPECIAL'); g.hideVM = true;
  const sky = g.sky.userData.mat.uniforms; const c0 = sky.top.value.clone(), c1 = sky.bot.value.clone(); const P0 = p.pos.clone();
  const hit = (c, r, k, o = {}) => { for (const e of g.enemiesInRadius(c, r)) g.damageEnemy(e, dmg * k, { mast: key, col, cls: 'fruit', kb: 4, up: 3, from: c, ...o }); };
  const ground = (c) => { c.y = g.groundAt(c.x, c.z); return c; };
  g.cut = { sky: true, update: (dt) => { t += dt; const k = Math.min(1, t / 0.9) ** 0.5; const back = Math.max(0, (t - (D - 0.6)) / 0.6);
    // camera: Godly/Mythical swing up and back; Ultra orbits the player
    let camT; if (ultra) { const a = t * 0.9 + g.p.yaw; camT = P0.clone().add(new B.Vector3(Math.sin(a) * 11, 6 + Math.sin(t) * 2, Math.cos(a) * 11)); } else camT = P0.clone().add(new B.Vector3(0, 16, 9).applyAxisAngle(new B.Vector3(0, 1, 0), g.p.yaw + Math.PI));
    const pos = start.clone().lerp(camT, k * (1 - back)); g.cam.position.copy(pos); look.position.copy(pos); look.lookAt(ultra ? P0.clone().setY(P0.y + 1.5) : P0.clone().add(g.fwdFlat(V()).multiplyScalar(6))); g.cam.quaternion.copy(startQ.clone().slerp(look.quaternion, k * (1 - back)));
    sky.top.value.copy(c0).lerp(new B.Color(ultra ? 0x05030a : 0x1a1530), Math.min(1, t * 2) * (1 - back)); sky.bot.value.copy(c1).lerp(new B.Color(col).multiplyScalar(0.4), Math.min(1, t * 2) * (1 - back));
    if (t < 1.1) g.fx.burst(P0.clone().setY(P0.y + 1.5), ultra ? 12 : 6, col, { speed: 4, up: 8, size: 0.5, life: 0.8, grav: -4 });
    if (t > 1.1 && t < D - 0.5) { const T = t - 1.1;
      if (style === 'rain') while (drops < T * 14) { drops++; const a = Math.random() * 6.28, r = 2 + Math.random() * 20; const c = ground(P0.clone().add(new B.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r))); g.fx.pillar(c, col, 0.7, 30, 0.45); g.fx.ring(c.clone().setY(c.y + 0.15), 0xffffff, 3.5, 0.4); g.fx.burst(c.clone().setY(c.y + 0.5), 8, col, { speed: 5, size: 0.4, life: 0.4 }); hit(c, 3.5, 0.35); }
      if (style === 'nova') while (drops < T * 3) { drops++; const c = P0.clone().setY(P0.y + 0.3); g.fx.ring(c, col, 10 + drops * 5, 0.8); g.fx.ring(c.clone().setY(c.y + 1.2), 0xffffff, 8 + drops * 4, 0.7); g.fx.orb(c.clone().setY(c.y + 1), col, 4 + drops, 0.5); g.fx.burst(c.clone().setY(c.y + 1), 40, col, { speed: 14, size: 0.6, life: 0.7, grav: 0 }); hit(c, 9 + drops * 4, 0.6, { kb: 12 }); g.fx.shake = 0.5; }
      if (style === 'meteor') while (drops < T * 5) { drops++; const a = Math.random() * 6.28, r = 3 + Math.random() * 14; const c = ground(P0.clone().add(new B.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r))); g.fx.beam(c.clone().add(new B.Vector3(6, 30, -4)), c, col, 1.6, 0.4); g.fx.orb(c.clone().setY(c.y + 1), col, 5, 0.5); g.fx.burst(c, 30, col, { speed: 10, up: 6, size: 0.6, life: 0.7 }); hit(c, 5.5, 0.55); g.fx.shake = 0.6; }
      if (style === 'coil') while (drops < T * 22) { drops++; const a = drops * 0.45, r = 4 + drops * 0.35, h = 1 + drops * 0.35; const c = P0.clone().add(new B.Vector3(Math.cos(a) * r, h, Math.sin(a) * r)); g.fx.orb(c, col, 2.2, 0.45); g.fx.burst(c, 6, 0x9ad4ff, { speed: 4, size: 0.5, life: 0.5, grav: 0 }); hit(ground(c.clone()), 4.5, 0.3); }
      if (style === 'nika') { while (drops < T * 10) { drops++; const a = Math.random() * 6.28, r = 2 + Math.random() * 16; const c = ground(P0.clone().add(new B.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r))); g.fx.pillar(c, 0xffffff, 1.2, 40, 0.5); g.fx.ring(c.clone().setY(c.y + 0.2), 0xfff2a0, 5, 0.5); hit(c, 4, 0.4, { up: 8 }); }
        if (Math.random() < 0.25) g.fx.burst(P0.clone().setY(P0.y + 2), 16, [0xffffff, 0xffd0f0, 0xfff27a][Math.floor(Math.random() * 3)], { speed: 9, size: 0.7, life: 0.6, grav: 0 }); g.fx.shake = 0.3 + Math.sin(t * 20) * 0.1; }
      // ---- Legendary specials (one unique cutscene per fruit) ----
      const ring8 = (n, r, f) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283 + t * 0.4; f(ground(P0.clone().add(new B.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r))), a); } };
      if (style === 'entei') { // a sun of fire gathers overhead, then crashes down
        const sun = P0.clone().add(g.fwdFlat(V()).multiplyScalar(8)).setY(P0.y + 14 - Math.max(0, T - 1.8) * 9);
        if (T < 1.8) { if (Math.random() < 0.6) g.fx.orb(sun, col, 2 + T * 3.2, 0.25); g.fx.burst(sun, 6, 0xffd060, { speed: 3 + T * 3, size: 0.9, life: 0.4, grav: 0, spread: 2 + T * 2 }); }
        else if (drops < 1) { drops = 1; const c = ground(sun.clone()); g.fx.orb(c, col, 12, 0.9); g.fx.ring(c.clone().setY(c.y + 0.3), 0xffb21f, 22, 1.1); for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; g.fx.pillar(ground(c.clone().add(new B.Vector3(Math.cos(a) * 9, 0, Math.sin(a) * 9))), col, 1.4, 16, 0.9); } g.fx.shake = 1; hit(c, 15, 4); } }
      if (style === 'glacier') while (drops < T * 8) { drops++; const r = 2 + drops * 1.1; ring8(10, r, (c) => { g.fx.pillar(c, 0xdff6ff, 0.6, 4 + Math.random() * 4, 1.6); g.fx.burst(c.clone().setY(c.y + 1), 3, 0xbfe8ff, { speed: 3, size: 0.4, life: 0.5 }); }); hit(P0, r + 1, 0.55, { stun: 1.2, kb: 0.5, up: 0 }); }
      if (style === 'cage') { if (drops < T * 6) { drops++; const R0 = Math.max(3, 22 - T * 6); ring8(14, R0, (c) => { g.fx.beam(c.clone().setY(c.y + 40), c, 0xffffff, 0.12, 0.35); g.fx.beam(c.clone().setY(c.y + 40), c, col, 0.06, 0.35); }); hit(P0, R0 + 1.5, 0.5, { kb: -2 }); } }
      if (style === 'room') { if (drops < 1) { drops = 1; g.fx.orb(P0.clone().setY(P0.y + 1), 0x7ad0ff, 18, 2.2); g.fx.ring(P0.clone().setY(P0.y + 0.2), 0x7ad0ff, 18, 2.2); }
        if (Math.random() < 0.35) { const a = Math.random() * 6.283, b2 = a + 2.4 + Math.random(); const h = P0.y + 1 + Math.random() * 3; g.fx.beam(new B.Vector3(P0.x + Math.cos(a) * 16, h, P0.z + Math.sin(a) * 16), new B.Vector3(P0.x + Math.cos(b2) * 16, h, P0.z + Math.sin(b2) * 16), 0xe8f6ff, 0.18, 0.25); hit(P0, 16, 0.18); } }
      if (style === 'ursus') { const c = P0.clone().add(g.fwdFlat(V()).multiplyScalar(7)).setY(P0.y + 2.5);
        if (T < 1.6) { g.fx.orb(c, 0xf0d0b0, 0.5 + T * 2.5, 0.2); g.fx.burst(c, 4, 0xa06a4a, { speed: -3, size: 0.6, life: 0.4, grav: 0, spread: 6 - T * 3 }); } else if (drops < 1) { drops = 1; g.fx.ring(ground(c.clone()), 0xffffff, 28, 0.9); g.fx.ring(c, 0xf0d0b0, 20, 0.7, false, 2); g.fx.orb(c, 0xffffff, 9, 0.5); g.fx.shake = 1.2; hit(c, 18, 3.6, { kb: 14, up: 6 }); } }
      if (style === 'void') { const c = P0.clone().add(g.fwdFlat(V()).multiplyScalar(6)); g.fx.ring(ground(c.clone()).setY(c.y + 0.1), 0x2a1a3a, 4 + T * 6, 0.25); if (Math.random() < 0.5) g.fx.burst(c.clone().setY(c.y + 0.5), 8, 0x8a3aff, { speed: -6, size: 0.6, life: 0.5, grav: 0, spread: 10 });
        for (const e of g.enemiesInRadius(c, 22)) { const R = e.c.root.position; R.x += (c.x - R.x) * Math.min(1, 0.025); R.z += (c.z - R.z) * Math.min(1, 0.025); }
        if (T > 2.4 && drops < 1) { drops = 1; g.fx.orb(c.clone().setY(c.y + 1), 0x8a3aff, 10, 0.8); g.fx.ring(c, 0x1a0a2a, 20, 0.8); g.fx.shake = 0.9; hit(c, 10, 3.4, { up: 8 }); } }
      if (style === 'clock') { const a = T * 2.2; for (const L of [12, 7]) { const e2 = P0.clone().add(new B.Vector3(Math.sin(a * (L === 12 ? 1 : 0.35)) * L, 0.8, Math.cos(a * (L === 12 ? 1 : 0.35)) * L)); g.fx.beam(P0.clone().setY(P0.y + 0.8), e2, L === 12 ? 0xf0e0a0 : 0x6a5aa0, 0.25, 0.08); }
        if (drops < T * 2) { drops++; g.fx.ring(P0.clone().setY(P0.y + 0.1), 0xf0e0a0, 12, 0.6); hit(P0, 12, 0.3, { stun: 1.5, kb: 0 }); } if (T > 2.6 && !g._tk) { g._tk = 1; g.fx.orb(P0.clone().setY(P0.y + 1), 0xffffff, 13, 0.4); hit(P0, 13, 3); setTimeout(() => { g._tk = 0; }, 500); } }
      if (style === 'army') while (drops < T * 10) { drops++; const lane = drops % 6, step = Math.floor(drops / 6); const a = g.p.yaw + Math.PI + (lane - 2.5) * 0.28; const r = 3 + step * 2.2; const c = ground(P0.clone().add(new B.Vector3(-Math.sin(a) * -r, 0, -Math.cos(a) * -r)));
        g.fx.pillar(c, 0xe8c080, 0.5, 2.2, 0.8); g.fx.burst(c.clone().setY(c.y + 2.2), 3, 0x8a5a2a, { speed: 2, size: 0.5, life: 0.4 }); hit(c, 2.6, 0.45, { kb: 5 }); }
      if (style === 'shards') { if (drops < T * 16) { drops++; const a = Math.random() * 6.283, r = 6 + Math.random() * 12, h = 1 + Math.random() * 6; const c = P0.clone().add(new B.Vector3(Math.cos(a) * r, h, Math.sin(a) * r)); g.fx.orb(c, drops % 2 ? 0xe0f0ff : 0xb07aff, 0.8, 0.5); if (drops % 4 === 0) { const e = g.enemiesInRadius(P0, 20)[drops % 5 | 0]; if (e) { g.fx.beam(c, e.c.root.position.clone().setY(e.c.root.position.y + 1), 0xe0f0ff, 0.15, 0.2); g.damageEnemy(e, dmg * 0.6, { mast: key, col, cls: 'fruit', kb: 2 }); } } } }
      if (style === 'cannon') while (drops < T * 7) { drops++; const side = drops % 4; const a = g.p.yaw + side * Math.PI / 2 + 0.4; const from = P0.clone().add(new B.Vector3(Math.sin(a) * 30, 18, Math.cos(a) * 30)); const rr = Math.random() * 14; const ta = Math.random() * 6.283; const c = ground(P0.clone().add(new B.Vector3(Math.cos(ta) * rr, 0, Math.sin(ta) * rr)));
        g.fx.beam(from, c, 0x3a3a3a, 0.35, 0.3); g.fx.orb(c.clone().setY(c.y + 0.5), 0xff8a3a, 2.4, 0.4); g.fx.burst(c, 14, 0x9a8a7a, { speed: 5, up: 5, size: 0.8, life: 0.7 }); hit(c, 3.5, 0.7, { kb: 6, up: 4 }); }
      if (style !== 'nova' && style !== 'meteor') g.fx.shake = Math.max(g.fx.shake, 0.35); }
    if (t >= D) { g.cut = null; g.hideVM = false; g.ui.letterbox(false); g.ui.specialCard(null); sky.top.value.copy(c0); sky.bot.value.copy(c1); }
  } };
}

function generic(g, kind, dmg, col, O, m) {
  const p = g.p; const eye = () => g.eyePos().clone(); const fw = () => g.fwd(V()); const fl = () => g.fwdFlat(V());
  const glow = (sz) => { const mm = new B.Mesh(g.fx.sphGeo, new B.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.95, blending: B.AdditiveBlending, depthWrite: false })); mm.scale.setScalar(sz); return mm; };
  switch (kind) {
    case 'proj': { g.vm.doCast(0); const o = eye().addScaledVector(fw(), 1).add(new B.Vector3(0, -0.2, 0));
      g.projectile({ pos: o, vel: fw().multiplyScalar(30), r: 1, dmg: 0, life: 1.2, player: true, mesh: glow(0.7), onHit: () => {}, onTick: (pr) => g.fx.burst(pr.mesh.position, 2, col, { speed: 1, size: 0.6, life: 0.3, grav: 0, spread: 0.5 }),
        onEnd: (pr) => { const c = pr.mesh.position.clone(); g.fx.orb(c, col, 3.5, 0.45); g.fx.burst(c, 30, col, { speed: 8, size: 0.5, life: 0.6 }); g.fx.shake = Math.max(g.fx.shake, 0.35); for (const e of g.enemiesInRadius(c, 4.5)) g.damageEnemy(e, dmg, { ...O, kb: 9, from: c }); } }); break; }
    case 'aoe': { const c = p.pos.clone(); g.vm.doCast(0); g.fx.pillar(c, col, 5, 10, 1.1); g.fx.ring(c.clone().setY(c.y + 0.2), col, 7, 0.6); let n = 0;
      const iv = setInterval(() => { g.fx.burst(c.clone().setY(c.y + 1 + Math.random() * 3), 10, col, { speed: 6, size: 0.6, life: 0.6, grav: -2, spread: 4 }); for (const e of g.enemiesInRadius(c, 6.5)) g.damageEnemy(e, dmg * 0.4, { ...O, kb: 3, up: 3, from: c }); if (++n >= 4) clearInterval(iv); }, 220); break; }
    case 'dash': { const d = fl(); p.dash = 0.4; p.dashDir.copy(d); p.iframe = 0.5; const hit = new Set(); let n = 0;
      const iv = setInterval(() => { g.fx.burst(p.pos.clone().setY(p.pos.y + 0.8), 8, col, { speed: 2, size: 0.7, life: 0.5, grav: 0, spread: 1 }); for (const e of g.enemiesInRadius(p.pos, 2.8)) if (!hit.has(e)) { hit.add(e); g.damageEnemy(e, dmg, { ...O, kb: 8, up: 4 }); } if (++n >= 9) clearInterval(iv); }, 45); break; }
    case 'beam': { g.vm.doCast(0); const o = eye().add(new B.Vector3(0, -0.25, 0)); const d = fw(); const end = o.clone().addScaledVector(d, 30);
      g.fx.beam(o, end, col, 1.0, 0.45); g.fx.beam(o, end, 0xffffff, 0.35, 0.35); g.fx.shake = 0.3;
      for (const e of g.enemies) { if (e.dead) continue; const to = g.chest(e, V()).sub(o); const t = to.dot(d); if (t < 0 || t > 31) continue; if (to.addScaledVector(d, -t).length() < 1.6 + (e.boss ? 0.8 : 0)) g.damageEnemy(e, dmg, { ...O, kb: 7 }); } break; }
    case 'rain': { const tgt = aimPointG(g, 32); let n = 0; g.vm.doCast(0);
      const iv = setInterval(() => { for (let i = 0; i < 2; i++) { const a = Math.random() * 6.28, r = Math.random() * 5; const c = tgt.clone().add(new B.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); c.y = g.groundAt(c.x, c.z); g.fx.pillar(c, col, 0.8, 18, 0.45); g.fx.burst(c.clone().setY(c.y + 0.3), 6, col, { speed: 4, size: 0.4, life: 0.4 }); for (const e of g.enemiesInRadius(c, 3)) g.damageEnemy(e, dmg * 0.3, { ...O, kb: 3, up: 2, from: c }); } g.fx.shake = 0.2; if (++n >= 8) clearInterval(iv); }, 120); break; }
    case 'barrage': { let n = 0; const iv = setInterval(() => { const o = eye().add(new B.Vector3((Math.random() - .5) * 1.2, -0.2 + (Math.random() - .5) * 0.6, 0)).addScaledVector(fw(), 0.8); const v = aimPointG(g, 35).sub(o).normalize().multiplyScalar(40);
      g.projectile({ pos: o, vel: v, r: 0.8, dmg: dmg * 0.55, life: 1, player: true, mesh: glow(0.2), kb: 1.5, mast: O.mast, col, onEnd: (pr) => g.fx.burst(pr.mesh.position, 4, col, { speed: 4, size: 0.3, life: 0.3 }) }); if (++n >= 10) clearInterval(iv); }, 90); break; }
    case 'blink': { let tgt = aimPointG(g, 26); tgt.y = g.groundAt(tgt.x, tgt.z); g.fx.burst(p.pos.clone().setY(p.pos.y + 1), 20, col, { speed: 5, size: 0.5, life: 0.4 }); p.pos.copy(tgt); g.collide(p.pos, 0.4); p.vy = 0; p.iframe = 0.4;
      const c = p.pos.clone().setY(p.pos.y + 1); g.fx.orb(c, col, 3.5, 0.4); g.fx.burst(c, 30, col, { speed: 8, size: 0.4, life: 0.5 }); for (const e of g.enemiesInRadius(p.pos, 4.2)) g.damageEnemy(e, dmg, { ...O, kb: 9 }); break; }
    case 'wave': { g.vm.doCast(0); const d = fl(); const o = p.pos.clone().setY(p.pos.y + 0.6); const w = new B.Mesh(new B.TorusGeometry(1.6, 0.25, 6, 18, Math.PI), new B.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, blending: B.AdditiveBlending, depthWrite: false })); w.rotation.y = Math.atan2(d.x, d.z); w.rotation.z = Math.PI / 2;
      g.projectile({ pos: o.addScaledVector(d, 1.2), vel: d.multiplyScalar(20), r: 2.2, dmg, life: 1.1, player: true, mesh: w, pierce: true, kb: 9, mast: O.mast, col, onTick: (pr) => { pr.mesh.scale.multiplyScalar(1.025); g.fx.burst(pr.mesh.position, 2, col, { speed: 2, size: 0.6, life: 0.3, grav: 0, spread: 2 }); } }); g.fx.shake = 0.25; break; }
    case 'orbit': { const orbs = []; for (let i = 0; i < 5; i++) { const o = glow(0.35); g.scene.add(o); orbs.push(o); } let t = 0; const hitT = new Map();
      const iv = setInterval(() => { t += 0.05; orbs.forEach((o, i) => { const a = t * 5 + i * 1.256; o.position.set(p.pos.x + Math.cos(a) * 2.6, p.pos.y + 1.1 + Math.sin(t * 3 + i) * 0.3, p.pos.z + Math.sin(a) * 2.6); });
        if (Math.random() < 0.5) g.fx.burst(orbs[0].position, 2, col, { speed: 1, size: 0.4, life: 0.3, grav: 0 });
        for (const e of g.enemiesInRadius(p.pos, 3.4)) { const lt = hitT.get(e) || 0; if (t - lt > 0.35) { hitT.set(e, t); g.damageEnemy(e, dmg * 0.35, { ...O, kb: 3 }); } }
        if (t > 3) { clearInterval(iv); orbs.forEach(o => g.scene.remove(o)); } }, 50); break; }
  }
}
function aimPointG(g, max) { const o = g.eyePos().clone(); const d = g.fwd(V()); const hit = g.rayEnemy(o, d, max, 1.0); if (hit) return g.chest(hit.e, V());
  for (let t = 1; t < max; t += 0.5) { const q = o.clone().addScaledVector(d, t); if (q.y < g.island.hf(q.x, q.z) + 0.2) return q; } return o.addScaledVector(d, max); }
