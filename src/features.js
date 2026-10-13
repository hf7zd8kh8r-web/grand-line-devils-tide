// Haki, fishing + treasure chests, fake players + trading
import { THREE, Builder, mat, WORLD_MAT, setOutlinesVisible } from './engine.js';
import { FRUITS, SWORDS, ACCESSORIES, RARITY, RCOL, islandById, ISLANDS } from './data.js';
import { makeChar, makeAvatar } from './models.js';
import { randomLook } from './style.js';
import * as ST from './state.js';
const B = THREE; const V = () => new B.Vector3();
export const HAKI = { buso: 15, ken: 30, conq: 60 };
// Haki skill tree: 3 branches x 4 tiers. Points: 1 per 10 levels + 1 per different boss defeated.
export const HAKI_TREE = {
  buso: [['Hardening', '+25% damage while Haki is on'], ['Full-Body Hardening', '-10% damage taken'], ['Emission', '+10% damage, +15% vs bosses'], ['Internal Destruction (Ryuo)', '+20% damage, heavy hits send a shockwave']],
  ken: [['Sense Presence', '25% dodge, enemy radar'], ['Heightened Senses', '35% dodge'], ['Precognition', '+10% critical chance'], ['Future Sight', 'After a dodge your next hit deals x2']],
  conq: [["Conqueror's Will", 'AoE knock-out of weak foes'], ['Overbearing Aura', '+10% damage'], ['Domination', 'Bigger radius, stuns bosses 2s'], ["Conqueror's Coating", '+15% damage, crits strike harder']],
};
export const hakiTierLvl = (k, t) => HAKI[k] + t * 20;
export function hakiPoints(S) { const bosses = Object.keys(S.kills || {}).filter(k => k.endsWith('_boss') || k === 'higuma' || k === 'morgan').length; const spent = Object.values(S.hakiT || {}).reduce((a, n) => a + Math.max(0, n - 1), 0); return Math.floor(S.lvl / 10) + bosses - spent; }
export const hk = (S, k, t) => ((S.hakiT || {})[k] || (S.lvl >= HAKI[k] ? 1 : 0)) > t; // has node t (0-based)
export function hakiToggle(g) {
  const S = g.save; S.haki = S.haki || {}; if (S.lvl < HAKI.buso) { g.ui.toast(`Haki unlocks at level ${HAKI.buso}`, 'blk'); return; }
  const on = !S.haki.buso; S.haki.buso = on; S.haki.ken = on && S.lvl >= HAKI.ken;
  g.ui.toast(on ? `Armament Haki ON (+25% dmg)${S.haki.ken ? ' · Observation Haki ON (dodge)' : ''}` : 'Haki OFF', 'mast');
  g.st = ST.stats(S); hakiVisual(g); if (on) g.fx.burst(g.eyePos().clone().addScaledVector(g.fwd(V()), 0.8), 20, 0x5a2aaa, { speed: 3, size: 0.3, life: 0.4, grav: 0 });
}
export function hakiVisual(g) { const on = g.save.haki && g.save.haki.buso; g.vm.mat.color.setScalar(on ? 0.22 : 1); g.vm.mat.emissive.setHex(on ? 0x2a0a4a : 0); g.vm.mat.emissiveIntensity = on ? 0.4 : 0; }
export function conqueror(g) {
  const S = g.save, p = g.p; if (S.lvl < HAKI.conq) { g.ui.toast(`Conqueror's Haki awakens at level ${HAKI.conq}`, 'blk'); return; }
  if ((p.cds.conq || 0) > 0) { g.ui.toast(`Conqueror's Haki recharging (${Math.ceil(p.cds.conq)}s)`, 'blk'); return; }
  p.cds.conq = 40; p.cdMax = p.cdMax || {}; p.cdMax.conq = 40; g.ui.moveName("Conqueror's Haki", 0xff3a5a);
  const c = p.pos.clone().setY(p.pos.y + 1); g.fx.ring(c, 0xff2a4a, 16, 0.8, true); g.fx.ring(c, 0x1a0a1a, 12, 0.7, true); g.fx.shake = 0.9;
  for (let i = 0; i < 10; i++) { const a = Math.random() * 6.28; g.fx.beam(c, c.clone().add(new B.Vector3(Math.cos(a) * 9, (Math.random() - 0.3) * 5, Math.sin(a) * 9)), i % 2 ? 0xff2a4a : 0x2a0a2a, 0.15, 0.4); }
  const dom = hk(S, 'conq', 2); for (const e of g.enemiesInRadius(p.pos, dom ? 22 : 15)) { const weak = !e.boss && e.lvl < S.lvl; g.damageEnemy(e, weak ? e.max * 0.6 : e.max * 0.04, { kb: 6, stun: weak ? 3 : (dom ? 2 : 1), col: 0xff2a4a }); if (dom && e.boss) { e.state = 'hit'; e.hitT = 2; } if (weak && !e.dead) { e.state = 'hit'; e.hitT = 3; } }
}
// ---------- fishing ----------
// fish species: [name, base value, rarity 0-4, emoji, min sea (1-3)]
export const FISH = [
  ['Sardine', 18, 0, '🐟', 1], ['Sea Bass', 30, 0, '🐟', 1], ['Mackerel', 26, 0, '🐟', 1], ['Blue Snapper', 45, 0, '🐠', 1], ['Clownfish', 40, 0, '🐠', 1], ['Herring', 22, 0, '🐟', 1], ['Shrimp', 20, 0, '🦐', 1],
  ['Striped Tuna', 70, 1, '🐟', 1], ['Puffer Fish', 55, 1, '🐡', 1], ['Octopus', 80, 1, '🐙', 1], ['Squid', 65, 1, '🦑', 1], ['Red Crab', 75, 1, '🦀', 1], ['Swordfish', 110, 1, '🐟', 1], ['Moray Eel', 90, 1, '🐍', 2],
  ['Lobster', 150, 2, '🦞', 1], ['Elephant Tuna', 220, 2, '🐟', 1], ['Sky Fish', 200, 2, '🐟', 2], ['Coral Angelfish', 180, 2, '🐠', 2], ['Glow Squid', 240, 2, '🦑', 2], ['Fighting Fish', 260, 2, '🐠', 2], ['Ghost Jellyfish', 210, 2, '🪼', 2],
  ['Sea King Scale', 400, 3, '🐉', 1], ['Golden Carp', 520, 3, '🐟', 1], ['Rainbow Koi', 600, 3, '🎏', 2], ['Kraken Tentacle', 750, 3, '🐙', 2], ['Seabeast Fry', 700, 3, '🐊', 3], ['Wano Golden Koi', 820, 3, '🎏', 3],
  ['Island Whale Calf', 1600, 4, '🐋', 2], ['Master Sea King', 2200, 4, '🐉', 3], ['Ancient Laboon Scale', 1900, 4, '🐋', 1] ];
export const FISH_RAR = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']; export const FISH_COL = ['#c8d0d8', '#7ad67a', '#5ab0ff', '#c07aff', '#ffb02a'];
export const fishValue = (S, f) => Math.round(f[1] * (1 + S.lvl * 0.06));
export function rollFish(S, sea = 1, luck = 0) { const r = Math.random(); const rar = r < 0.02 + luck ? 4 : r < 0.09 + luck ? 3 : r < 0.25 ? 2 : r < 0.55 ? 1 : 0;
  let pool = FISH.filter(f => f[2] === rar && f[4] <= sea); if (!pool.length) pool = FISH.filter(f => f[2] === rar); return pool[Math.floor(Math.random() * pool.length)]; }
export const FRUIT_CATCH = 0.015; // rare direct Devil Fruit catch (Common-Epic weighted)
export class Fishing {
  constructor(g) { this.g = g; this.state = 'idle'; this.t = 0; }
  nearWater() { const g = this.g, p = g.p; const f = g.fwdFlat(V()); for (const d of [3, 5, 7]) { const q = p.pos.clone().addScaledVector(f, d); if (g.island.hf(q.x, q.z) < -0.9) return q; } return null; }
  press() {
    const g = this.g;
    if (this.state === 'idle') { const w = this.nearWater(); if (!w) { g.ui.toast('Face the water (stand on a dock or beach) to fish', 'blk'); return; }
      this.state = 'cast'; this.t = 2.4 + Math.random() * 3.5; this.castT = 0; this.spot = w.setY(-0.95); this.from = null;
      if (!this.bob) { const b = new Builder(); b.add(new B.SphereGeometry(0.12, 8, 6), 0xff3030, mat(0, 0, 0)); b.add(new B.SphereGeometry(0.1, 8, 6), 0xffffff, mat(0, -0.08, 0), { outline: false }); b.add(new B.CylinderGeometry(0.015, 0.015, 0.14, 5), 0x222222, mat(0, 0.13, 0), { outline: false }); this.bob = b.build(WORLD_MAT);
        const N = 14; this.line = new B.Line(new B.BufferGeometry().setFromPoints(Array.from({ length: N }, () => V())), new B.LineBasicMaterial({ color: 0xf4f4f4, transparent: true, opacity: 0.85 })); this.line.frustumCulled = false; }
      g.scene.add(this.bob, this.line); this.bob.visible = false; g.vm.setFish('cast'); window.__audio && window.__audio.sfx('cast'); setTimeout(() => window.__audio && window.__audio.sfx('splash', { vol: 0.5 }), 800); g.ui.toast('Casting… wait for a bite!', 'blk'); g.ui.fishBtn('REEL'); return; }
    if (this.state === 'bite') { this.catch(); return; }
    if (this.state === 'wait' || this.state === 'cast') { this.stop(); g.ui.toast('Reeled in too early!', 'blk'); }
  }
  stop(reel) { this.state = 'idle'; if (this.bob) { this.bob.removeFromParent(); this.line.removeFromParent(); } this.g.ui.fishBtn(null); this.g.ui.biteFx(false);
    if (reel) { this.g.vm.setFish('reel'); clearTimeout(this._rt); this._rt = setTimeout(() => { if (this.state === 'idle') this.g.vm.setFish(null); }, 450); } else this.g.vm.setFish(null); }
  tip(out) { const g = this.g; if (g.tpv && g.tpv.on && g.tpv.body && g.tpv.body.root.visible) { g.tpv.body.bones.foreR.getWorldPosition(out); return out.add(g.fwdFlat(V()).multiplyScalar(1.6)).setY(out.y + 1.2); }
    return g.vm.rodTipWorld(g.cam, out) || out.copy(g.eyePos()).addScaledVector(g.fwd(V()), 1.2).add(new B.Vector3(0, -0.2, 0)); }
  update(dt) {
    if (this.state === 'idle') return; const g = this.g; this.t -= dt;
    const tip = this.tip(V());
    if (this.state === 'cast') { this.castT += dt; const k = Math.min(1, Math.max(0, (this.castT - 0.35) / 0.5)); // bobber flies out in an arc
      if (k > 0) { this.bob.visible = true; const from = this.from || (this.from = tip.clone()); this.bob.position.lerpVectors(from, this.spot, k); this.bob.position.y += Math.sin(k * Math.PI) * 2.2; }
      if (k >= 1) { this.state = 'wait'; g.fx.ring(this.spot.clone().setY(-0.9), 0xffffff, 1.5, 0.5); g.fx.burst(this.spot, 8, 0xdff6ff, { speed: 2, up: 2, size: 0.2, life: 0.4 }); g.vm.setFish('wait'); } }
    // sagging line: quadratic curve from rod tip to bobber (taut on a bite)
    const pos = this.line.geometry.attributes.position, N = pos.count, b = this.bob.visible ? this.bob.position : tip; const sag = this.state === 'bite' ? 0.05 : this.state === 'cast' ? 0.2 : 0.9;
    for (let i = 0; i < N; i++) { const k = i / (N - 1); pos.setXYZ(i, tip.x + (b.x - tip.x) * k, tip.y + (b.y - tip.y) * k - Math.sin(k * Math.PI) * sag * Math.min(1, tip.distanceTo(b) / 6), tip.z + (b.z - tip.z) * k); } pos.needsUpdate = true;
    if (g.p.pos.distanceTo(this.spot) > 12) { this.stop(); return; }
    if (this.state === 'wait') { this.bob.position.y = -0.95 + Math.sin(g.t * 3) * 0.04; if (Math.random() < dt * 0.8) g.fx.ring(this.spot.clone().setY(-0.92), 0xffffff, 0.6, 0.6); if (this.t <= 0) { this.state = 'bite'; this.t = 0.95; g.ui.biteFx(true); window.__audio && window.__audio.sfx('bite'); g.vm.setFish('bite'); g.fx.burst(this.spot, 12, 0xffffff, { speed: 3, up: 3, size: 0.25, life: 0.5 }); } }
    else if (this.state === 'bite') { this.bob.position.y = -1.15 + Math.sin(g.t * 30) * 0.08; if (Math.random() < dt * 10) g.fx.burst(this.spot, 2, 0xffffff, { speed: 1.5, up: 2, size: 0.15, life: 0.3 }); if (this.t <= 0) { this.stop(); g.ui.toast('The fish got away…', 'blk'); } }
  }
  catch() { window.__audio && (window.__audio.sfx('reel'), window.__audio.sfx('splash'));
    const g = this.g, S = g.save; this.stop(true); S.stats.fish = (S.stats.fish || 0) + 1; g.addXp(15 + S.lvl * 5); g.questEvent('fish');
    g.fx.burst(this.spot.clone().setY(-0.5), 25, 0x9fe8ff, { speed: 5, up: 6, size: 0.3, life: 0.8 });
    const sea = (islandById(g.island.id) || {}).sea || 1;
    if (Math.random() < FRUIT_CATCH) { const roll = Math.random(); const rar = roll < 0.4 ? 0 : roll < 0.7 ? 1 : roll < 0.9 ? 2 : 3; const pool = Object.keys(FRUITS).filter(k => FRUITS[k].rar === rar); const id = pool[Math.floor(Math.random() * pool.length)];
      S.inv.fruits.push(id); S.stats.fishFruits = (S.stats.fishFruits || 0) + 1; g.ui.chestPopup({ txt: FRUITS[id].name, sub: '🎣 Fished up a ' + RARITY[rar] + ' Devil Fruit!', col: RCOL[rar] }); ST.save(S); return; }
    if (Math.random() < 0.12) { this.chest(); return; }
    const f = rollFish(S, sea, styleLuck(S) + (g.stormLuck || 0)); S.inv.fish = S.inv.fish || {}; S.inv.fish[f[0]] = (S.inv.fish[f[0]] || 0) + 1; S.fishdex = S.fishdex || {}; const first = !S.fishdex[f[0]]; S.fishdex[f[0]] = (S.fishdex[f[0]] || 0) + 1;
    g.ui.toast(`${f[3]} Caught a ${FISH_RAR[f[2]]} ${f[0]}!${first ? ' ✨ NEW' : ''} (in your cooler · worth ฿${fishValue(S, f)})`, f[2] >= 3 ? 'rare' : 'item');
    if (f[2] >= 2) g.questEvent('rarefish');
    if (f[2] >= 3) g.fx.burst(this.spot.clone().setY(0), 30, f[2] === 4 ? 0xffb02a : 0xc07aff, { speed: 6, up: 7, size: 0.4, life: 1 }); ST.save(S);
  }
  chest() {
    const g = this.g, S = g.save; S.stats.chests = (S.stats.chests || 0) + 1; g.questEvent('chest');
    let reward; if (Math.random() < 0.65) { const ber = Math.round(250 + S.lvl * 90 * (0.6 + Math.random())); g.addBerries(ber); reward = { txt: `฿${ber.toLocaleString()}`, sub: 'Berries', col: '#ffd04a' }; }
    else { const roll = Math.random(); const rar = roll < 0.4 ? 0 : roll < 0.7 ? 1 : roll < 0.9 ? 2 : 3; const pool = Object.keys(FRUITS).filter(k => FRUITS[k].rar === rar); const id = pool[Math.floor(Math.random() * pool.length)]; S.inv.fruits.push(id); reward = { txt: FRUITS[id].name, sub: RARITY[rar] + ' Devil Fruit', col: RCOL[rar] }; }
    g.ui.chestPopup(reward); ST.save(S);
  }
}
const styleLuck = S => (S.eq.wear || []).some(w => /fish|rod|lucky/i.test(w)) ? 0.02 : 0;
// cooler: sell or cook caught fish. Cooking heals, and Rare+ dishes give a 'Well Fed' damage buff.
export function sellFish(g, name, all) { const S = g.save; const f = FISH.find(x => x[0] === name); const n = (S.inv.fish || {})[name] || 0; if (!f || !n) return 0; const k = all ? n : 1; S.inv.fish[name] -= k; if (!S.inv.fish[name]) delete S.inv.fish[name]; const ber = fishValue(S, f) * k; g.addBerries(ber); ST.save(S); return ber; }
export function cookFish(g, name) { const S = g.save; const f = FISH.find(x => x[0] === name); if (!f || !(S.inv.fish || {})[name]) return null; S.inv.fish[name]--; if (!S.inv.fish[name]) delete S.inv.fish[name];
  const heal = Math.round(g.st.maxHp * (0.2 + f[2] * 0.1) * ((S.crew || []).some(c => c.role === 'cook') ? 1.5 : 1)); S.hp = Math.min(g.st.maxHp, S.hp + heal); if (f[2] >= 2) { g.fed = { t: 60 + f[2] * 30, mul: 1 + f[2] * 0.04 }; } S.stats.cooked = (S.stats.cooked || 0) + 1; g.questEvent('cook'); ST.save(S); return { heal, fed: f[2] >= 2 ? Math.round((f[2] * 0.04) * 100) : 0 }; }
// ---------- fake players ----------
const N1 = ['Shadow', 'Pirate', 'Zoro', 'Luffy', 'Ace', 'Sanji', 'Ninja', 'Captain', 'Dragon', 'Sea', 'Storm', 'Gear', 'Sniper', 'Yonko', 'Blox', 'Haki', 'Red', 'Kaido', 'Mochi', 'Sabo'];
const N2 = ['King', 'Fan', 'Master', 'Hunter', 'Kid', 'Lord', 'Slayer', 'God', 'Boy', 'Pro', 'X', 'Wave', 'Fist', 'Blade', '', 'Dash', 'Rider'];
export function makeFakes(seed = 1) {
  let s = seed * 9973; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const out = [];
  for (let i = 0; i < 24; i++) { const lv = Math.max(1, Math.round(Math.pow(r(), 1.6) * 420)); const isl = ISLANDS.filter(x => x.lvl <= lv).pop();
    const cap = Math.min(6, Math.floor(lv / 55) + 1); const fruitPool = Object.keys(FRUITS).filter(k => FRUITS[k].rar <= cap && !FRUITS[k].ultra);
    out.push({ id: 'fp' + i, name: (r() < 0.3 ? 'xX' : '') + N1[Math.floor(r() * N1.length)] + N2[Math.floor(r() * N2.length)] + (r() < 0.6 ? Math.floor(r() * 999) : '') + (r() < 0.3 ? 'Xx' : ''), lvl: lv, faction: r() < 0.75 ? 'Pirate' : 'Marine', island: isl.id, fruit: fruitPool[Math.floor(r() * fruitPool.length)], bounty: Math.round(lv * lv * (800 + r() * 1600)), shirt: Math.floor(r() * 0xffffff), honest: r() < 0.65 }); }
  return out;
}
const CHAT = ['anyone wanna trade?', 'just beat the boss lol', 'how do i get to the next sea', 'trading fruits!!', 'lf crew', 'this boss is so hard', 'gg', 'anyone got a Flame fruit?', 'selling swords cheap', 'my mastery is so low :(', 'who wants to fight me', 'where is the fruit dealer'];
// find a flat, open spot near (x0,z0) for the trading table
function findSpot(g, x0, z0) { const I = g.island; const C = I.colliders;
  for (let r = 5; r < 22; r += 1.5) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2 + r; const x = x0 + Math.cos(a) * r, z = z0 + Math.sin(a) * r;
    const h = I.hf(x, z); if (h < 0.3) continue; let flat = true; for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) if (Math.abs(I.hf(x + dx, z + dz) - h) > 0.35) flat = false; if (!flat) continue;
    if (C.some(c => Math.hypot(c.x - x, c.z - z) < (c.r || Math.max(c.hw || 1, c.hd || 1)) + 2.6)) continue;
    if (I.npcs.some(n => Math.hypot(n.x - x, n.z - z) < 3.5)) continue; if (I.dock && Math.abs(x - I.dock.x) < 4 && z > I.dock.z0 - 3) continue;
    return { x, z, y: h, a }; }
  return null; }
function buildTable(g, sp) { const b = new Builder(); const B = THREE;
  b.add(new B.CylinderGeometry(0.85, 0.85, 0.08, 16), 0x9a6a3a, mat(0, 0.78, 0), { ot: 0.02 }); b.add(new B.CylinderGeometry(0.1, 0.16, 0.74, 8), 0x6a4a2a, mat(0, 0.37, 0)); b.add(new B.CylinderGeometry(0.4, 0.45, 0.06, 12), 0x5a3a1a, mat(0, 0.03, 0));
  b.add(new B.BoxGeometry(1.0, 0.012, 0.6), 0xe8d8b0, mat(0, 0.83, 0, 0, 0.3, 0), { outline: false }); // trade cloth
  b.add(new B.SphereGeometry(0.1, 10, 8), 0xff7a2a, mat(-0.25, 0.92, 0.1), { ot: 0.01 }); b.add(new B.BoxGeometry(0.22, 0.12, 0.16), 0x8a4a1a, mat(0.25, 0.89, -0.1), { ot: 0.01 }); b.add(new B.CylinderGeometry(0.06, 0.06, 0.03, 10), 0xffd04a, mat(0.05, 0.85, 0.2), { outline: false });
  for (const [sx, sz] of [[0, -1.5], [0, 1.5], [-1.5, 0], [1.5, 0]]) { b.add(new B.CylinderGeometry(0.28, 0.25, 0.06, 12), 0x8a5a2a, mat(sx, 0.5, sz), { ot: 0.015 }); b.add(new B.CylinderGeometry(0.06, 0.08, 0.48, 6), 0x5a3a1a, mat(sx, 0.24, sz)); }
  b.add(new B.BoxGeometry(1.6, 0.9, 0.04), 0xe8d0a0, mat(0, 2.1, -1.9 + 0.0), { ot: 0.02 }); b.add(new B.CylinderGeometry(0.04, 0.04, 2.6, 6), 0x5a3a1a, mat(-0.8, 1.3, -1.9)); b.add(new B.CylinderGeometry(0.04, 0.04, 2.6, 6), 0x5a3a1a, mat(0.8, 1.3, -1.9));
  const grp = b.build(WORLD_MAT); grp.position.set(sp.x, sp.y, sp.z); grp.rotation.y = sp.a; g.scene.add(grp); setOutlinesVisible(grp);
  // sign text
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const c = cv.getContext('2d'); c.fillStyle = '#e8d0a0'; c.fillRect(0, 0, 256, 128); c.fillStyle = '#4a1a00'; c.font = 'bold 40px Impact, sans-serif'; c.textAlign = 'center'; c.fillText('TRADING', 128, 56); c.font = 'bold 30px Impact, sans-serif'; c.fillText('TABLE ⚖', 128, 100);
  const sign = new B.Mesh(new B.PlaneGeometry(1.5, 0.75), new B.MeshBasicMaterial({ map: new B.CanvasTexture(cv) })); sign.position.set(0, 2.1, -1.875); grp.add(sign);
  g.island.colliders.push({ x: sp.x, z: sp.z, r: 0.95 });
  const seat = (s, sx = 0) => { const v = new B.Vector3(sx * 1.5, 0, s * 1.5).applyAxisAngle(new B.Vector3(0, 1, 0), sp.a); return { x: sp.x + v.x, z: sp.z + v.z }; };
  return { grp, sp, seatA: seat(-1), seatB: seat(1), seats: [seat(1), seat(0, -1), seat(0, 1)] }; }
export function fakeSpawn(g) {
  const S = g.save; if (!S.fakes) S.fakes = makeFakes(S.stats.created % 1000 + 7);
  for (const f of S.fakes) { f.lvl = Math.max(f.lvl, Math.min(450, Math.round(f.lvl + S.stats.time / 900))); if (!f.look) { let sd = (f.id.slice(2) | 0) * 7919 + 13; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647; const L = randomLook(r, f.faction); f.look = L.look; f.cos = L.cos; } }
  const here = S.fakes.filter(f => Math.abs(islandById(f.island).lvl - (islandById(g.island.id).lvl)) < 40 || f.island === g.island.id).slice(0, 4);
  const R = g.island.R; g.fakes = [];
  const sp0 = g.island.spawn || [0, R * 0.35]; const sp = here.length ? findSpot(g, sp0[0], sp0[1] - 4) : null; g.table = sp ? buildTable(g, sp) : null;
  here.forEach((f, i) => { const x = (i % 2 ? 1 : -1) * (3 + i * 2), z = R * 0.3 - i * 4; const c = makeAvatar(f.faction, f.race || 'Human', f.look, f.cos);
    const o = { f, c, anim: { phase: 0 }, tgt: V().set(x, 0, z), t: Math.random() * 4, chatT: 3 + Math.random() * 10 };
    if (i === 0 && g.table) { const T = g.table; o.sit = T.seatA; c.root.position.set(T.seatA.x, g.island.hf(T.seatA.x, T.seatA.z), T.seatA.z); c.root.rotation.y = Math.atan2(T.sp.x - T.seatA.x, T.sp.z - T.seatA.z); }
    else c.root.position.set(x, g.island.hf(x, z), z);
    g.scene.add(c.root); setOutlinesVisible(c.root); g.fakes.push(o); });
}
export function fakeUpdate(g, dt) {
  if (!g.fakes) return;
  for (const o of g.fakes) { const R = o.c.root; o.t -= dt; o.chatT -= dt;
    if (o.sit) { const near = R.position.distanceTo(g.p.pos) < 4; o.anim.sit = 1; o.anim.move = 0; o.anim.talk = near || (Math.sin(g.t * 0.4 + 1) > 0.6); o.anim.wave = !near && R.position.distanceTo(g.p.pos) < 9 && Math.sin(g.t * 0.7) > 0.8;
      if (o.chatT <= 0) { o.chatT = 14 + Math.random() * 20; if (R.position.distanceTo(g.p.pos) < 25) g.ui.chat(o.f.name, ['trading table open! come sit', 'got fruits to trade, sit down', 'fair trades only (mostly)', 'anyone wanna trade??'][Math.floor(Math.random() * 4)]); }
      g.anim(o.c, o.anim); continue; }
    if (o.t <= 0) { o.t = 3 + Math.random() * 4; const a = Math.random() * 6.28; const hub = (g.island.npcs.length ? g.island.npcs[(Math.random() * g.island.npcs.length) | 0] : { x: 0, z: g.island.R * 0.3 }); o.tgt.set(hub.x + Math.cos(a) * 6, 0, hub.z + Math.sin(a) * 6); }
    const d = o.tgt.clone().sub(R.position).setY(0); const near = R.position.distanceTo(g.p.pos) < 4; let mv = 0;
    if (near && R.position.distanceTo(g.p.pos) < 2.4) { const aw = R.position.clone().sub(g.p.pos).setY(0).normalize(); R.position.addScaledVector(aw, 2 * dt); }
    if (d.length() > 0.8 && !near) { d.normalize(); R.position.addScaledVector(d, 3 * dt); R.rotation.y = Math.atan2(d.x, d.z); mv = 1; o.anim.phase += dt * 7; } else if (near) R.rotation.y = Math.atan2(g.p.pos.x - R.position.x, g.p.pos.z - R.position.z);
    g.collide(R.position, 0.4); R.position.y = g.island.hf(R.position.x, R.position.z);
    o.anim.move = mv; o.anim.talk = near; o.anim.wave = !near && !mv && R.position.distanceTo(g.p.pos) < 8; if (o.chatT <= 0) { o.chatT = 10 + Math.random() * 20; if (R.position.distanceTo(g.p.pos) < 30) g.ui.chat(o.f.name, CHAT[Math.floor(Math.random() * CHAT.length)]); }
    g.anim(o.c, o.anim); }
}
export function fakeRemove(g) { if (g.fakes) for (const o of g.fakes) o.c.root.removeFromParent(); g.fakes = []; if (g.table) { g.table.grp.removeFromParent(); g.table.grp.traverse(m => { m.geometry && m.geometry.dispose(); }); g.table = null; } g.seat = null; }
// trade offers: they offer something; value-based fairness
export const value = (kind, id) => kind === 'fruit' ? [400, 1200, 3000, 8000, 20000, 60000, 140000, 900000][FRUITS[id].rar] : kind === 'sword' ? Math.max(200, SWORDS[id].price || 50000) : kind === 'wear' ? ACCESSORIES[id].price : id;
export function makeOffer(g, f) {
  const S = g.save; const mine = [...S.inv.fruits.map(i => ['fruit', i]), ...S.inv.swords.filter(i => !SWORDS[i].secret).map(i => ['sword', i]), ...S.inv.wear.filter(w => !S.eq.wear.includes(w)).map(i => ['wear', i])];
  const maxR = Math.min(6, Math.floor(f.lvl / 60) + 1); const fr = Object.keys(FRUITS).filter(k => FRUITS[k].rar <= maxR && !FRUITS[k].ultra); const give = ['fruit', fr[Math.floor(Math.random() * fr.length)]];
  const gv = value(...give);
  if (mine.length && Math.random() < 0.7) { const want = mine[Math.floor(Math.random() * mine.length)]; const wv = value(...want); return { give, want, fair: !f.honest ? gv < wv * 0.6 ? false : true : true, ratio: gv / wv }; }
  const price = Math.round(gv * (f.honest ? 0.9 + Math.random() * 0.3 : 1.8 + Math.random())); return { give, want: ['ber', price], ratio: gv / price };
}
