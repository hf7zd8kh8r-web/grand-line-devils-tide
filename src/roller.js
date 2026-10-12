// Fruit Roller: gacha stall that turns island materials into a random Devil Fruit (basic / premium tiers, pity, reel reveal).
import { THREE } from './engine.js';
import { FRUITS, RARITY, RCOL, ISLANDS, ENEMIES } from './data.js';
import { IDEFS } from './islanddefs.js';
import { fruitIcon } from './icons.js';
import * as ST from './state.js';
import { audio } from './audio.js';

export const TIERS = {
  basic: { name: 'Basic Roll', cost: 5, min: 1, desc: 'Any island materials', odds: [45, 28, 15, 8, 3, 0.8, 0.18, 0.02] },
  premium: { name: 'Premium Roll', cost: 15, min: 2, desc: 'Second/Third Sea materials or boss trophies only', odds: [0, 20, 33, 25, 13, 6, 2.5, 0.5] },
};
export const PITY = 10; // guaranteed Epic+ on the 10th roll without one
let VAL = null;
function vals() { if (VAL) return VAL; VAL = {}; const seaOf = {}; for (const i of ISLANDS) seaOf[i.id] = i.sea || 1;
  for (const e of Object.values(ENEMIES)) if (e.drop && !VAL[e.drop]) VAL[e.drop] = 1;
  for (const [id, d] of Object.entries(IDEFS)) { const s = seaOf[id] || 1; for (const n of [d.drop, d.e1 && d.e1.drop, d.e2 && d.e2.drop].filter(Boolean)) VAL[n] = s; if (d.drop) VAL[d.drop + ' (Boss)'] = s + 2; }
  return VAL; }
export function matValue(k) { if (/^Road Poneglyph/.test(k)) return 0; const v = vals(); if (v[k]) return v[k]; if (/\(Boss\)$/.test(k)) return 3; return 2; }
export function points(S, tier) { const t = TIERS[tier]; let p = 0; for (const [k, n] of Object.entries(S.inv.mats)) { const v = matValue(k); if (v >= t.min) p += v * n; } return p; }
function spend(S, tier) { const t = TIERS[tier], m = S.inv.mats; const ks = Object.keys(m).filter(k => matValue(k) >= t.min).sort((a, b) => matValue(a) - matValue(b)); let need = t.cost; const used = {};
  for (const k of ks) { while (need > 0 && m[k] > 0) { m[k]--; need -= matValue(k); used[k] = (used[k] || 0) + 1; } if (!m[k]) delete m[k]; if (need <= 0) break; } return used; }
export function pickRarity(odds, r = Math.random) { const tot = odds.reduce((a, b) => a + b, 0); let x = r() * tot; for (let i = 0; i < odds.length; i++) { if (x < odds[i]) return i; x -= odds[i]; } return 0; }
const poolOf = rar => Object.keys(FRUITS).filter(k => FRUITS[k].rar === rar);

const CSS = `.rl-odds{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;font-size:12px;margin:4px 0 8px}.rl-odds span{padding:3px 5px;border-radius:6px;background:#0006;border-left:3px solid var(--c)}
.rl-tiers{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media (max-width:520px){.rl-tiers{grid-template-columns:1fr}.rl-odds{grid-template-columns:repeat(2,1fr)}}
.rl-tier{padding:10px;border-radius:12px;background:#0005;border:1.5px solid #ffffff22}.rl-tier.prem{border-color:#c77dff88;background:linear-gradient(#2a1440aa,#0006)}
.rl-tier button{width:100%;min-height:46px;font-size:16px}.rl-win{position:relative;height:118px;overflow:hidden;border-radius:14px;background:radial-gradient(#1b3350,#060d16);border:2px solid #ffd04a;margin:8px 0}
.rl-strip{position:absolute;left:0;top:9px;display:flex;gap:8px;will-change:transform}.rl-cell{width:96px;height:96px;flex:none;border-radius:12px;background:radial-gradient(circle,color-mix(in srgb,var(--c) 45%,transparent),#0008 70%);border:2px solid var(--c);box-shadow:0 0 14px var(--c)}
.rl-cell img{width:100%;height:100%}.rl-ptr{position:absolute;left:50%;top:0;bottom:0;width:4px;margin-left:-2px;background:#fff;box-shadow:0 0 10px #ffd04a;z-index:2}
.rl-res{text-align:center;min-height:52px;font-size:15px}.rl-res b{font:400 26px "Bangers",Impact,sans-serif;letter-spacing:1px}
.rl-win.flour{animation:rlf 1.2s ease-out}.rl-win.flour:after{content:"";position:absolute;inset:-60%;background:repeating-conic-gradient(var(--fc) 0 8deg,transparent 8deg 22deg);opacity:.55;animation:rlspin 2.4s linear infinite;z-index:1;mix-blend-mode:screen}
@media (max-height:500px){.rl-win{height:80px;margin:4px 0}.rl-strip{top:7px}.rl-cell{width:62px;height:62px}.rl-odds{grid-template-columns:repeat(8,1fr);font-size:10px;gap:2px}.rl-odds span{padding:2px 3px}.rl-tier{padding:7px}.rl-tier button{min-height:40px}.p-roller .say{display:none}.rl-res{min-height:40px}.rl-res b{font-size:22px}}
@keyframes rlf{0%{transform:scale(1)}25%{transform:scale(1.07)}100%{transform:scale(1)}}@keyframes rlspin{to{transform:rotate(360deg)}}`;

export class Roller {
  constructor(g) { this.g = g; this.spinning = false; if (typeof document !== 'undefined' && !document.getElementById('rlcss')) { const s = document.createElement('style'); s.id = 'rlcss'; s.textContent = CSS; document.head.appendChild(s); } }
  model() { const g = new THREE.Group(); const M = (c, o = {}) => new THREE.MeshToonMaterial({ color: c, ...o });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 1.1, 14), M(0xc0283a)); base.position.y = 0.55; g.add(base);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.74, 0.14, 14), M(0xffd04a)); band.position.y = 1.1; g.add(band);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.72, 18, 12), new THREE.MeshPhongMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.35, shininess: 90 })); dome.position.y = 1.65; g.add(dome);
    const cols = [0xd8d8d8, 0x5fd16a, 0x4aa8ff, 0xb46bff, 0xffb02e, 0xff4d6d]; for (let i = 0; i < 16; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), M(cols[i % 6])); const a = i * 2.4, r = 0.25 + (i % 3) * 0.12; b.position.set(Math.cos(a) * r, 1.3 + (i % 4) * 0.13, Math.sin(a) * r); g.add(b); }
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 10), M(0xffd04a)); knob.rotation.x = Math.PI / 2; knob.position.set(0, 0.7, 0.86); g.add(knob);
    const chute = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.26, 0.12), M(0x2a1a10)); chute.position.set(0, 0.3, 0.82); g.add(chute);
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const x = cv.getContext('2d'); x.fillStyle = '#2a0e40'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#ffd04a'; x.font = 'bold 34px Impact,sans-serif'; x.textAlign = 'center'; x.fillText('FRUIT ROLLER', 128, 45);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) })); sign.position.set(0, 2.65, 0); g.add(sign);
    const sign2 = sign.clone(); sign2.rotation.y = Math.PI; g.add(sign2);
    const poleM = M(0x6a4528); for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.7, 6), poleM); p.position.set(s * 0.95, 1.35, 0); g.add(p); }
    const lamp = new THREE.PointLight(0xc77dff, 1.2, 6); lamp.position.set(0, 1.7, 0.6); g.add(lamp);
    return g; }
  html() { const S = this.g.save; const pity = S.rollPity || 0; const odd = (o) => `<div class="rl-odds">${o.map((v, i) => `<span style="--c:${RCOL[i]}"><b style="color:${RCOL[i]}">${RARITY[i]}</b> ${v}%</span>`).join('')}</div>`;
    const tier = (k) => { const t = TIERS[k], p = points(S, k); return `<div class="rl-tier ${k === 'premium' ? 'prem' : ''}"><b>${t.name}</b> · ${t.cost} pts<br><small class="dim">${t.desc} · you have <b>${p}</b> pts</small>${odd(t.odds)}<button class="go ${p < t.cost ? 'poor' : ''}" data-do="roll:${k}">🎰 Roll (${t.cost} pts)</button></div>`; };
    return `<h2>🎰 Fruit Roller</h2><p class="say">“Materials in, Devil Fruit out! Feelin' lucky, ${S.name || 'pirate'}?”</p><div class="rl-win" id="rlWin"><div class="rl-ptr"></div><div class="rl-strip" id="rlStrip"></div></div><div class="rl-res" id="rlRes"><span class="dim">Pity: Epic+ guaranteed in <b>${PITY - pity}</b> roll${PITY - pity === 1 ? '' : 's'} · Rolls so far: ${S.stats.rolls || 0}</span></div><div class="rl-tiers">${tier('basic')}${tier('premium')}</div><p class="dim" style="font-size:12px">Material points: First Sea drops 1 · Second Sea 2 · Third Sea 3 · boss trophies +2. Cheapest materials are spent first; Road Poneglyphs are never used.</p>`; }
  open() { this.g.ui.open('roller'); this.idle(); }
  idle() { const st = document.getElementById('rlStrip'); if (!st) return; const ids = Object.keys(FRUITS); st.innerHTML = Array.from({ length: 9 }, (_, i) => this.cell(ids[(i * 7) % ids.length])).join(''); const w = document.getElementById('rlWin'); const W = (st.firstChild ? st.firstChild.offsetWidth : 96) + 8; st.style.transform = `translateX(${w.clientWidth / 2 - 4.5 * W + 4}px)`; }
  cell(id) { const r = FRUITS[id].rar; return `<div class="rl-cell" style="--c:${RCOL[r]}"><img src="${fruitIcon(id, 96)}"></div>`; }
  roll(tier) { const g = this.g, S = g.save, t = TIERS[tier]; if (!t || this.spinning) return null; if (points(S, tier) < t.cost) { g.ui.toast(`Need ${t.cost} material points for a ${t.name}`, 'blk'); return null; }
    spend(S, tier); S.stats.rolls = (S.stats.rolls || 0) + 1; S.stats[tier === 'premium' ? 'rollsPremium' : 'rollsBasic'] = (S.stats[tier === 'premium' ? 'rollsPremium' : 'rollsBasic'] || 0) + 1;
    let rar = this.forceRar ?? pickRarity(t.odds); this.forceRar = undefined; const pity = (S.rollPity || 0) + 1; let pityHit = false; if (rar < 3 && pity >= PITY) { rar = 3 + pickRarity(t.odds.slice(3).map((v, i) => i ? v : Math.max(v, 1))); pityHit = true; }
    S.rollPity = rar >= 3 ? 0 : pity; const pool = poolOf(rar); const id = pool[Math.floor(Math.random() * pool.length)];
    S.inv.fruits.push(id); S.stats.rollBest = Math.max(S.stats.rollBest ?? -1, rar); ST.save(S); g.ui.updateHud && g.ui.updateHud();
    this.animate(id, rar, pityHit); return id; }
  animate(id, rar, pityHit) { const st = document.getElementById('rlStrip'), w = document.getElementById('rlWin'), res = document.getElementById('rlRes'); const done = () => this.reveal(id, rar, pityHit);
    if (!st || !w) { done(); return; } this.spinning = true; w.classList.remove('flour'); document.querySelectorAll('[data-do^="roll:"]').forEach(b => b.disabled = true);
    const ids = Object.keys(FRUITS), N = 44, cells = []; for (let i = 0; i < N; i++) { const rr = pickRarity([40, 25, 15, 10, 5, 3, 1.5, 0.5]); const p = poolOf(rr); cells.push(i === N - 4 ? id : p[Math.floor(Math.random() * p.length)] || ids[i % ids.length]); }
    st.innerHTML = cells.map(c => this.cell(c)).join(''); const W = (st.firstChild ? st.firstChild.offsetWidth : 96) + 8, H = W / 2 - 4; try { w.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (_) {} if (res) res.innerHTML = '<span class="dim">Rolling…</span>';
    const cx = w.clientWidth / 2, end = cx - ((N - 4) * W + H) + (Math.random() - 0.5) * W * 0.5, start = cx - H, D = rar >= 4 ? 4200 : 3200; const t0 = performance.now(); let lastI = -1;
    try { audio.sfx('whoosh'); } catch (_) {}
    const step = (now) => { const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 4); const x = start + (end - start) * e; st.style.transform = `translateX(${x}px)`; const ci = Math.floor((cx - x) / W); if (ci !== lastI) { lastI = ci; try { audio.sfx('click', { gap: 0, vol: 0.5 }); } catch (_) {} }
      if (k < 1 && this.spinning) requestAnimationFrame(step); else { st.style.transform = `translateX(${cx - ((N - 4) * W + H)}px)`; done(); } };
    requestAnimationFrame(step); }
  reveal(id, rar, pityHit) { this.spinning = false; const f = FRUITS[id], w = document.getElementById('rlWin'), res = document.getElementById('rlRes'); this.last = { id, rar };
    if (w) { w.style.setProperty('--fc', RCOL[rar]); if (rar >= 4) { void w.offsetWidth; w.classList.add('flour'); } }
    if (res) res.innerHTML = `<b style="color:${RCOL[rar]};text-shadow:0 0 12px ${RCOL[rar]}">${f.name}</b><br><small>${RARITY[rar]} Devil Fruit — added to your bag${pityHit ? ' · ✨ Pity!' : ''}</small>`;
    try { audio.sfx(rar >= 4 ? 'special' : 'coin'); if (rar >= 3) audio.sfx('level'); } catch (_) {}
    if (rar >= 4) { this.g.ui.banner(rar >= 7 ? '🌟 ULTRA FRUIT!!' : `✨ ${RARITY[rar].toUpperCase()} FRUIT!`, `${f.name} rolled at the Fruit Roller!`); this.g.cam && this.g.cam.shake && this.g.cam.shake(0.3); }
    const S = this.g.save; document.querySelectorAll('.rl-tier').forEach((el, i) => { const k = i ? 'premium' : 'basic', p = points(S, k), b = el.querySelector('button'), sm = el.querySelector('small b'); if (sm) sm.textContent = p; if (b) { b.disabled = false; b.classList.toggle('poor', p < TIERS[k].cost); } }); }
}
