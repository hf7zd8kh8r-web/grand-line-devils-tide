// Installs the Oct-18 batch on a running game without touching the shared casting/AI code:
// haki visuals + Armament colour shop, awakened looks, (secret content + rebirth are installed from their own modules).
import { THREE as B } from './engine.js';
import { VIS_HOOKS, visCos } from './style.js';
import { AWK, awakeOn } from './awaken.js';
import * as ST from './state.js';
import { HAKI_COLORS, hakiColorOf, fpHaki, syncAvatar, syncFpAura, updateFx, conqFx, AURA_FAMILY, _fxCount } from './bodyfx.js';
import { makeAvatar } from './models.js';
const fmt = n => Math.round(n).toLocaleString('en-US');
const CSS = `
#conqFlash{position:fixed;inset:0;pointer-events:none;z-index:40;opacity:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 30%,rgba(60,0,10,.55) 70%,rgba(0,0,0,.85) 100%)}
#conqFlash.go{animation:conqF 1.1s ease-out}
@keyframes conqF{0%{opacity:0}8%{opacity:1;filter:contrast(1.4)}20%{opacity:.6}35%{opacity:.9}100%{opacity:0}}
.hkgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:6px 0 10px}
.hkc{border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:8px;background:rgba(0,0,0,.25);display:flex;flex-direction:column;gap:4px;align-items:flex-start}
.hkc.on{border-color:#ffd04a;box-shadow:0 0 0 1px #ffd04a inset}
.hkc i{display:block;width:100%;height:26px;border-radius:13px;box-shadow:inset 0 -6px 10px rgba(0,0,0,.5),inset 0 4px 6px rgba(255,255,255,.35)}
.hkc small{opacity:.75}
@keyframes ultraHue{to{filter:hue-rotate(360deg)}}
`;
export const EX = { extra: [], fxCount: () => _fxCount(), makeAvatar, syncAvatar, AWK, AURA_FAMILY, HAKI_COLORS, conqFx, visCos }; if (typeof window !== 'undefined') window.__ex = EX; // debug/test handles
export function installExtras(g) { if (g._extras) return; g._extras = true; const ui = g.ui;
  if (!document.getElementById('extrasCss')) { const st = document.createElement('style'); st.id = 'extrasCss'; st.textContent = CSS; document.head.appendChild(st); }
  // visible state shared with crewmates: awakened fruit (aura/Nika look) + Armament colour while Haki is on
  VIS_HOOKS.push((S, o) => { if (awakeOn(S)) o.aw = S.eq.fruit; if (S.haki && S.haki.buso) o.hk = hakiColorOf(S); });
  // Armament colour shop in Bag → Haki
  const ih = ui.invHtml.bind(ui); ui.invHtml = (tab) => { let h = ih(tab); if ((tab || ui.invTab) === 'haki') h += hakiShopHtml(g.save); return h; };
  const act = ui.act.bind(ui); ui.act = (cmd, btn) => { const [a, b] = String(cmd).split(':'); if (a === 'hkc') return hakiColorAct(g, b); return act(cmd, btn); };
  // per-frame: own fx, first-person coat + fist aura, third-person body / preview / crewmates
  let visKey = JSON.stringify(visCos(g.save)), visT = 0;
  const up = g.update.bind(g); g.update = (dt) => { up(dt); try { tick(g, dt); } catch (e) { if (!g._exErr) { g._exErr = 1; console.warn('extras', e); } } };
  function tick(g, dt) { const S = g.save; if (!S) return; updateFx(dt); fpHaki(g);
    const aw = awakeOn(S) ? S.eq.fruit : ''; syncFpAura(g, aw, AWK);
    const vis = visCos(S); if (g.tpv && g.tpv.body) syncAvatar(g.tpv.body, vis, g.t, AWK); if (g.preview) syncAvatar(g.preview, vis, g.t, AWK);
    if (g.net && g.net.peers) for (const p of g.net.peers.values()) if (p.av) syncAvatar(p.av, p.cos, g.t, AWK);
    for (const x of EX.extra) syncAvatar(x.c, x.vis, g.t, AWK);
    visT -= dt; if (visT <= 0) { visT = 0.35; const k = JSON.stringify(vis); if (k !== visKey) { const was = visKey; visKey = k; const nikaChange = /"aw":"nika"/.test(was) !== /"aw":"nika"/.test(k); if (nikaChange) { g.rebuildArms(); if (g.preview) g.showPreview(true); } g.net && g.net.lookChanged && g.net.lookChanged(); } } }
}
// ---------------- Armament colours ----------------
export function hakiShopHtml(S) { S.hakiCols = S.hakiCols || ['black']; const cur = hakiColorOf(S); const lv = S.lvl >= 15;
  const card = id => { const H = HAKI_COLORS[id]; const own = S.hakiCols.includes(id); const on = cur === id; const hex = '#' + H.c.toString(16).padStart(6, '0'), sh = '#' + H.s.toString(16).padStart(6, '0');
    const btn = own ? `<button data-do="hkc:${id}" class="${on ? 'on' : ''}">${on ? '✓ Equipped' : 'Equip'}</button>` : H.shop === 'secret' ? `<small class="gold">🗝 Sold only in a hidden shop</small>` : `<button data-do="hkc:${id}" class="${S.ber < H.price ? 'poor' : ''}">฿${fmt(H.price)}</button>`;
    return `<div class="hkc ${on ? 'on' : ''}"><i style="background:linear-gradient(100deg,${hex} 0%,${hex} 38%,${sh} 50%,${hex} 62%,${hex} 100%)${H.rainbow ? ';filter:hue-rotate(0deg);animation:ultraHue 3s linear infinite' : ''}"></i><b>${H.name}</b>${btn}</div>`; };
  const ids = Object.keys(HAKI_COLORS).filter(id => HAKI_COLORS[id].shop === 'bag' || S.hakiCols.includes(id) || HAKI_COLORS[id].shop === 'secret');
  return `<h3>🎨 Armament Colours</h3><p class="dim">${lv ? 'Your Armament Haki coat (arms, fists and blade) uses this colour — crewmates see it too. Toggle Haki with H / the HAKI button.' : 'Unlocks with Armament Haki at Lv 15.'}</p><div class="hkgrid">${ids.map(card).join('')}</div>`; }
export function hakiColorAct(g, id) { const S = g.save, ui = g.ui; const H = HAKI_COLORS[id]; if (!H) return; S.hakiCols = S.hakiCols || ['black'];
  if (!S.hakiCols.includes(id)) { if (H.shop !== 'bag') { ui.toast('🗝 That colour is only sold in a hidden shop…', 'blk'); return; } if (S.ber < H.price) { ui.toast('Not enough Berries', 'blk'); return; } S.ber -= H.price; S.hakiCols.push(id); ui.toast(`🎨 Bought ${H.name} Armament!`, 'rare'); ui.updateHud(); }
  S.hakiCol = id; ST.save(S); if (S.haki && S.haki.buso) g.fx.burst(g.p.pos.clone().setY(g.p.pos.y + 1.2), 18, H.s, { speed: 3, size: 0.3, life: 0.45, grav: 0 }); ui.open('inv', 'haki'); }
