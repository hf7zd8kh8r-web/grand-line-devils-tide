// Rebirth: finish every island boss + every normal & secret quest, then Rebirth — keep items/fruits/swords/Berries/cosmetics,
// reset island & quest progress, and the world gets (rebirths + 1)× tougher with (rebirths + 1)× rewards.
// Debug: ?rbdebug in the URL (or localStorage gl_rbdebug=1) adds window.__rb and a "mark all complete" button.
import { ISLANDS, QUESTS, ENEMIES, islandById } from './data.js';
import { BUILDERS } from './islands.js';
import { VIS_HOOKS } from './style.js';
import * as QH from './quests.js';
import * as ST from './state.js';
const ROMAN = n => { let s = '', v = n; for (const [k, r] of [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (v >= k) { s += r; v -= k; } return s; };
export const rbOf = S => Math.max(0, Math.min(999, Math.floor(+(S && S.rebirth) || 0)));
export const rbMul = S => rbOf(S) + 1;
const DEBUG = typeof location !== 'undefined' && (/[?&]rbdebug\b/.test(location.search) || (() => { try { return localStorage.getItem('gl_rbdebug') === '1'; } catch (_) { return false; } })());
export function bossList() { const out = []; for (const I of ISLANDS) { if (!BUILDERS[I.id]) continue; const t = I.id === 'windmill' ? 'higuma' : I.id === 'shells' ? 'morgan' : I.id + '_boss'; if (ENEMIES[t] && ENEMIES[t].boss) out.push([I.id, t]); } return out; }
export function questList() { const out = []; for (const [isl, L] of Object.entries(QUESTS)) { if (!BUILDERS[isl]) continue; for (const q of L) out.push([isl, q]); } return out; }
export function cycle(S) { if (!S.rbc || typeof S.rbc !== 'object') { S.rbc = { q: {}, b: {} }; if (!rbOf(S)) { for (const id of S.qdone || []) S.rbc.q[id] = 1; for (const [, t] of bossList()) if ((S.kills || {})[t]) S.rbc.b[t] = 1; } } S.rbc.q = S.rbc.q || {}; S.rbc.b = S.rbc.b || {}; return S.rbc; }
// unique quests (swords, secret, one-off rewards) can only ever be done once, so a clear in any earlier life counts
const qOk = (S, c, q) => !!c.q[q.id] || (QH.isUnique(q) && (S.qdone || []).includes(q.id));
export function progress(S) { const c = cycle(S); const B = bossList(), Q = questList(); const missB = B.filter(([, t]) => !c.b[t]), missQ = Q.filter(([, q]) => !qOk(S, c, q));
  return { nb: B.length, nq: Q.length, bd: B.length - missB.length, qd: Q.length - missQ.length, missB, missQ, ready: !missB.length && !missQ.length }; }
const CSS = `#rbBadge{display:none;white-space:nowrap;margin-left:6px;padding:1px 7px;border-radius:9px;background:linear-gradient(90deg,#ffd04a,#ff7a3a);color:#1a0a00;font-weight:800;font-size:12px;cursor:pointer;pointer-events:auto;box-shadow:0 0 8px #ffb02e88}#rbBadge.ready{animation:rbPulse 1.2s infinite}@keyframes rbPulse{50%{box-shadow:0 0 18px #ffd04a;transform:scale(1.08)}}
.rbbar{height:12px;border-radius:6px;background:#0006;overflow:hidden;margin:4px 0 8px}.rbbar i{display:block;height:100%;background:linear-gradient(90deg,#ffd04a,#ff7a3a)}.rbmiss{font-size:12px;opacity:.8;max-height:92px;overflow:auto}.rbcols{display:grid;grid-template-columns:1fr 1fr;gap:10px}.rbcols ul{margin:4px 0;padding-left:18px;font-size:13px}.rbgo{font-size:18px!important;padding:10px 22px!important;background:linear-gradient(90deg,#ffd04a,#ff7a3a)!important;color:#1a0a00!important;font-weight:800}.rbwarn{border:1px solid #ff7a3a;background:#3a120a88;border-radius:10px;padding:10px;margin:8px 0}
#rbCine{position:fixed;inset:0;z-index:60;pointer-events:all;display:flex;align-items:center;justify-content:center;flex-direction:column;opacity:0;transition:opacity .6s;background:radial-gradient(circle at 50% 50%,#3a1a00cc 0%,#0a0400f2 60%,#000 100%);color:#ffe6a0;font-family:inherit;overflow:hidden}#rbCine.on{opacity:1}
#rbCine .ring{position:absolute;width:62vmin;height:62vmin;border-radius:50%;border:6px solid #ffd04a;box-shadow:0 0 40px #ffb02e,inset 0 0 40px #ffb02e;animation:rbSpin 2.2s linear infinite;border-top-color:transparent;border-bottom-color:#ff7a3a}#rbCine .ring.r2{width:44vmin;height:44vmin;animation-duration:1.4s;animation-direction:reverse;border-width:3px;opacity:.8}
#rbCine .burst{position:absolute;width:10px;height:10px;border-radius:50%;background:#fff;box-shadow:0 0 80px 60px #ffd04a;animation:rbBurst 4.4s ease-out forwards}@keyframes rbBurst{0%{transform:scale(0);opacity:0}35%{transform:scale(1);opacity:.6}45%{transform:scale(30);opacity:1}60%{opacity:0}100%{opacity:0}}
@keyframes rbSpin{to{transform:rotate(360deg)}}#rbCine b{font-size:min(15vw,110px);letter-spacing:.12em;text-shadow:0 0 30px #ff9a2a,0 4px 0 #6a2a00;z-index:2;animation:rbIn 1s ease-out}#rbCine span{z-index:2;font-size:min(4.6vw,22px);margin-top:6px;text-shadow:0 2px 6px #000}@keyframes rbIn{from{transform:scale(2.4);opacity:0;filter:blur(8px)}}
#rbCine .mote{position:absolute;bottom:-10px;width:6px;height:6px;border-radius:50%;background:#ffd04a;box-shadow:0 0 10px #ffb02e;animation:rbMote linear infinite}@keyframes rbMote{to{transform:translateY(-110vh);opacity:0}}`;
export function installRebirth(g) { if (g._rebirth) return; g._rebirth = true; const ui = g.ui;
  if (!document.getElementById('rbCss')) { const st = document.createElement('style'); st.id = 'rbCss'; st.textContent = CSS; document.head.appendChild(st); }
  VIS_HOOKS.push((S, o) => { const n = rbOf(S); if (n) o.rb = n; });
  const who = document.querySelector('#stat .who'); if (who && !document.getElementById('rbBadge')) { const b = document.createElement('span'); b.id = 'rbBadge'; b.onclick = (e) => { e.stopPropagation(); ui.open('shop', 'rebirth'); }; who.appendChild(b); }
  // tougher world: (rebirths + 1)× enemy & boss HP / damage, (rebirths + 1)× XP & Berries
  const se = g.spawnEnemy.bind(g); g.spawnEnemy = (s) => { const e = se(s); const m = rbMul(g.save); if (e && m > 1 && !e._rb) { e._rb = m; e.hp = Math.round(e.hp * m); e.max = Math.round(e.max * m); const d = e.def; e.def = { ...d, dmg: d.dmg * m, xp: Math.round(d.xp * m), ber: [d.ber[0] * m, d.ber[1] * m], hp: d.hp * m }; if (e.def.skills) e.def.skills = d.skills; } return e; };
  const ke = g.killEnemy.bind(g); g.killEnemy = (e) => { const r = ke(e); try { if (e && e.boss && !e.ext && !e.remote) { const c = cycle(g.save); c.b[e.s.type] = 1; } check(g); } catch (_) {} return r; };
  const cq = g.completeQuest.bind(g); g.completeQuest = (q) => { const S = g.save; q = q || S.quest; const m = rbMul(S); if (q && m > 1 && !q._rbm) { q._rbm = 1; q.xp = Math.round(q.xp * m); q.ber = Math.round(q.ber * m); } const r = cq(q); if (q) { cycle(S).q[q.id] = 1; ST.save(S); check(g); } return r; };
  const sh = ui.shopHtml.bind(ui); ui.shopHtml = (id) => id === 'rebirth' ? (ui.shopId = id, rebirthHtml(g)) : sh(id);
  const ph = ui.pauseHtml.bind(ui); ui.pauseHtml = () => ph().replace('<div class="pause">', `<div class="pause"><button data-do="rb:open" class="${progress(g.save).ready ? 'go' : ''}">⟳ Rebirth${rbOf(g.save) ? ' (' + rbOf(g.save) + ')' : ''}</button>`);
  const act = ui.act.bind(ui); ui.act = (cmd, btn) => { const [a, b] = String(cmd).split(':'); if (a !== 'rb') return act(cmd, btn);
    if (b === 'open' || b === 'no') { g._rbConfirm = false; ui.open('shop', 'rebirth'); } else if (b === 'go') { if (progress(g.save).ready) { g._rbConfirm = true; ui.open('shop', 'rebirth'); } } else if (b === 'yes') { if (g._rbConfirm && progress(g.save).ready) { g._rbConfirm = false; doRebirth(g); } } else if (b === 'dbg' && DEBUG) { debugComplete(g); ui.open('shop', 'rebirth'); } };
  if (DEBUG) window.__rb = { complete: () => debugComplete(g), set: n => { g.save.rebirth = rbOf({ rebirth: n }); ST.save(g.save); badge(g); }, progress: () => progress(g.save), rebirth: () => doRebirth(g, true), mul: () => rbMul(g.save) };
  g._rbReady = progress(g.save).ready; badge(g);
}
function check(g) { const P = progress(g.save); if (P.ready && !g._rbReady) { g._rbReady = true; setTimeout(() => g.ui.banner('REBIRTH UNLOCKED', 'Every boss and quest done — Menu → ⟳ Rebirth'), 2600); } badge(g, P); }
export function badge(g, P) { const el = document.getElementById('rbBadge'); if (!el) return; const n = rbOf(g.save); P = P || progress(g.save); el.style.display = n || P.ready ? 'inline-block' : 'none'; el.classList.toggle('ready', P.ready); el.textContent = P.ready ? `⟳ ${n ? ROMAN(n) + ' · ' : ''}Ready!` : `⟳ ${ROMAN(n)}`; el.title = `Rebirth ${n} · enemies ×${n + 1}`; }
function debugComplete(g) { const S = g.save, c = cycle(S); for (const [, q] of questList()) c.q[q.id] = 1; for (const [, t] of bossList()) c.b[t] = 1; ST.save(S); check(g); }
const islN = id => (islandById(id) || {}).name || id;
export function rebirthHtml(g) { const S = g.save, P = progress(S), n = rbOf(S), m = n + 1; const pct = (a, b) => Math.round(a / Math.max(1, b) * 100);
  const missB = P.missB.slice(0, 40).map(([i, t]) => `<li>${ENEMIES[t].name} <small class="dim">(${islN(i)})</small></li>`).join('') + (P.missB.length > 40 ? `<li>…+${P.missB.length - 40}</li>` : '');
  const missQ = P.missQ.slice(0, 40).map(([i, q]) => `<li>${q.secret ? '🗝 ' : ''}${q.text} <small class="dim">(${islN(i)})</small></li>`).join('') + (P.missQ.length > 40 ? `<li>…+${P.missQ.length - 40}</li>` : '');
  const body = g._rbConfirm ? `<div class="rbwarn"><b>Are you sure?</b><p>You will be sent back to Windmill Village. Island and quest progress for this life resets.<br>✔ You keep: level, items, Devil Fruits, swords, guns, Berries, cosmetics, Haki colours, mastery and found secret islands.<br>⚠ Every enemy and boss becomes <b>×${m + 1}</b> HP and damage (rewards ×${m + 1} too).</p></div><div class="pause"><button class="rbgo" data-do="rb:yes">⟳ Yes — Rebirth ${ROMAN(n + 1)}</button><button data-do="rb:no">Not yet</button></div>`
    : `<div class="rbcols"><div><b>👑 Island bosses ${P.bd}/${P.nb}</b><div class="rbbar"><i style="width:${pct(P.bd, P.nb)}%"></i></div>${P.missB.length ? `<div class="rbmiss"><ul>${missB}</ul></div>` : '<p class="gold">✔ All bosses beaten</p>'}</div>
      <div><b>📜 Quests (normal + secret) ${P.qd}/${P.nq}</b><div class="rbbar"><i style="width:${pct(P.qd, P.nq)}%"></i></div>${P.missQ.length ? `<div class="rbmiss"><ul>${missQ}</ul></div>` : '<p class="gold">✔ All quests done</p>'}</div></div>
      <p class="dim">Rebirth keeps your items, fruits, swords, Berries and cosmetics but resets islands and quests. Each rebirth: enemies & bosses ×(rebirths+1) HP/damage, XP & Berries ×(rebirths+1).</p>
      <div class="pause">${P.ready ? `<button class="rbgo" data-do="rb:go">⟳ Rebirth</button>` : `<button disabled>🔒 Finish everything above to Rebirth</button>`}${DEBUG ? '<button data-do="rb:dbg">🛠 Debug: mark all complete</button>' : ''}</div>`;
  return `<h2>⟳ Rebirth ${n ? ROMAN(n) : ''}</h2><p>Rebirths: <b class="gold">${n}</b> · world difficulty <b class="gold">×${m}</b> · rewards <b class="gold">×${m}</b></p>${body}`; }
export function doRebirth(g, force) { const S = g.save; if (!force && !progress(S).ready) return false; if (g._rbBusy) return false; g._rbBusy = true; const ui = g.ui; ui.close(true);
  const n = rbOf(S) + 1; const el = document.createElement('div'); el.id = 'rbCine';
  el.innerHTML = `<div class="burst"></div><div class="ring"></div><div class="ring r2"></div><b>REBIRTH</b><span>⟳ ${ROMAN(n)} — the seas grow ×${n + 1} stronger…</span><span style="opacity:.75;font-size:min(3.6vw,16px)">Your treasure sails with you. Your legend begins again.</span>` + Array.from({ length: 36 }, (_, i) => `<i class="mote" style="left:${(i * 37) % 100}%;animation-duration:${1.6 + (i % 5) * 0.5}s;animation-delay:${(i % 7) * 0.2}s"></i>`).join('');
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('on')); try { window.__audio && window.__audio.sfx('heavy', { vol: 1.2 }); } catch (_) {}
  try { const P = g.p.pos.clone(); P.y += 1; g.fx.burst(P, 80, 0xffd04a, { speed: 9, up: 6, size: 0.5, life: 1.2 }); g.fx.ring(P.clone().setY(P.y - 0.9), 0xffb02e, 10, 1.0); g.fx.shake = Math.max(g.fx.shake || 0, 0.6); } catch (_) {}
  setTimeout(() => { S.rebirth = n; S.rbc = { q: {}, b: {} }; S.quests = []; S.quest = null; S.qcd = {};
    S.unlocked = ['windmill', ...(S.unlocked || []).filter(id => id !== 'windmill' && (islandById(id) || {}).secret)]; S.hp = null; S.rbAt = Date.now(); ST.save(S);
    try { g.loadIsland('windmill'); } catch (e) { console.warn('rebirth load', e); } g._rbReady = false; badge(g); try { ui.updateQuest(); ui.updateHud(); } catch (_) {} try { g.net && g.net.lookChanged && g.net.lookChanged(); } catch (_) {} }, 2000);
  setTimeout(() => { el.classList.remove('on'); setTimeout(() => el.remove(), 700); g._rbBusy = false; ui.banner(`REBIRTH ${ROMAN(n)}`, `Enemies ×${n + 1} · rewards ×${n + 1} · back to Windmill Village`); }, 4300);
  return true; }
