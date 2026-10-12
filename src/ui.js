import { isTouch, Q, qset } from './engine.js';
import { FRUITS, SWORDS, GUNS, ACCESSORIES, RARITY, RCOL, ISLANDS, SEAS, QUESTS, islandById, RACES, T2, ENEMIES } from './data.js';
import { fruitIcon } from './icons.js';
import * as FS from './fruitshop.js';
import { MAX_CREW , STABLE_URL, validCode } from './net.js';
import { achHtml, drawStatCharts, exportStats } from './achievements.js';
import { crewTabHtml, hire, dismiss } from './crew.js';
import { SHIPS, SHIP_IDS, seaTier, shipOf, migrateShips } from './ships.js';
import { drawChart } from './chart.js';
import { STYLES, styleOf } from './styles.js';
import { COSMETICS } from './style.js';
import { rowsHtml, stepLook } from './lookui.js';
import { IN, press } from './input.js';
import * as ST from './state.js';
import * as CL from './cloud.js';
import { movesFor, moveListHtml, moveInfo, SP_REQ, ZOAN } from './fruits.js';
import { makeOffer, value, HAKI, HAKI_TREE, hakiPoints, hakiTierLvl , FISH, FISH_RAR, FISH_COL, fishValue, sellFish, cookFish } from './features.js';
const $ = s => document.querySelector(s);
const esc2 = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const h = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => Math.floor(n).toLocaleString('en-US');
export const SHOPS = {
  weapons1: { title: "Gol's Smithy", items: [['sword', 'cutlass'], ['gun', 'flintlock']] },
  fruits1: { title: 'Mysterious Fruit Stand', items: [['fruit', 'gomu']] },
  wear1: { title: "Nana's Tailor", items: [['wear', 'strawhat'], ['wear', 'sandals']] },
  weapons2: { title: 'Marine Surplus', items: [['sword', 'cutlass'], ['sword', 'marine'], ['gun', 'flintlock'], ['gun', 'musket']] },
  fruits2: { title: 'Shady Fruit Dealer', items: [['fruit', 'gomu'], ['fruit', 'mera'], ['fruit', 'pika']] },
  wear2: { title: "Ume's Tailor", items: [['wear', 'bandana'], ['wear', 'marinecoat'], ['wear', 'strawhat']] },
};
const TRADES = [
  { give: { 'Fish-Man Island (Boss)': 0 }, secret: 'mirro', label: '🔮 Mirror Key (unlocks a secret dimension)' },
  { give: { 'Bandit Bandana': 5 }, get: { ber: 400 }, label: '฿400' },
  { give: { 'Bandit Bandana': 10 }, get: { wear: 'bandana' }, label: 'Black Bandana' },
  { give: { "Higuma's Sabre": 1, 'Bandit Bandana': 4 }, get: { ber: 1500 }, label: '฿1,500' },
  { give: { 'Marine Badge': 6 }, get: { ber: 1600 }, label: '฿1,600' },
  { give: { 'Marine Badge': 12 }, get: { wear: 'marinecoat' }, label: 'Marine Coat' },
  { give: { 'Axe Fragment': 1, 'Marine Badge': 5 }, get: { fruit: 'mera' }, label: 'Flame-Flame Fruit' },
];
const DEF = { sword: SWORDS, gun: GUNS, fruit: FRUITS, wear: ACCESSORIES };
const KIND = { sword: 'swords', gun: 'guns', fruit: 'fruits', wear: 'wear' };
const LINES = {
  Makino: ['Welcome to the Party\'s Bar! Those bandits keep scaring the village...', 'You\'re getting strong! Luffy would be proud.'],
  'Mayor Woop': ['Hmph! Higuma and his gang camp up on the hill. Nobody dares go up there.', 'If you beat Higuma... you\'re a real fighter.'],
  Rika: ['The Marines here are bullies! Captain Morgan makes everyone bow to his statue.', 'Thank you for standing up to them!'],
  Coby: ['I want to be a real Marine... not like Morgan. Please, stop him!', 'Morgan is in the base courtyard. Watch out for his axe slam - jump over the shockwave!'],
};
export class UI {
  constructor() { this.modal = null; this.toastQ = []; this.mapDirty = true; this.bossShown = false; }
  attach(g) {
    this.g = g; const root = $('#hud'); root.classList.toggle('touch', isTouch);
    root.querySelectorAll('[data-ui]').forEach(b => { // touch: fire on pointerup (reliable on iOS Safari), swallow the follow-up click
      b.addEventListener('pointerdown', e => { e.stopPropagation(); b._pd = e.pointerId; });
      b.addEventListener('pointerup', e => { e.stopPropagation(); if (e.pointerType === 'mouse' || b._pd !== e.pointerId) return; b._pd = null; b._t = performance.now(); this.toggle(b.dataset.ui); });
      b.addEventListener('click', e => { e.stopPropagation(); if (performance.now() - (b._t || 0) < 700) return; this.toggle(b.dataset.ui); }); });
    { const cb = document.getElementById('camBtn'); if (cb) { const go = e => { e.stopPropagation(); if (performance.now() - (cb._t || 0) < 700) return; cb._t = performance.now(); this.g.tpv && this.g.tpv.toggle(); }; cb.addEventListener('pointerup', go); cb.addEventListener('click', go); cb.addEventListener('pointerdown', e => e.stopPropagation()); } }
    { const sb = document.getElementById('shoreBtn'); if (sb) { const go = e => { e.stopPropagation(); if (performance.now() - (sb._t || 0) < 700) return; sb._t = performance.now(); this.g.toShore && this.g.toShore(false); }; sb.addEventListener('pointerup', go); sb.addEventListener('click', go); sb.addEventListener('pointerdown', e => e.stopPropagation()); } }
    root.querySelectorAll('[data-slot]').forEach(b => { b.addEventListener('pointerdown', e => { e.stopPropagation(); b._pd = e.pointerId; });
      b.addEventListener('pointerup', e => { e.stopPropagation(); if (e.pointerType === 'mouse' || b._pd !== e.pointerId) return; b._pd = null; b._t = performance.now(); this.setSlot(b.dataset.slot); });
      b.addEventListener('click', e => { e.stopPropagation(); if (performance.now() - (b._t || 0) < 700) return; this.setSlot(b.dataset.slot); }); });
    $('#moves').addEventListener('click', e => { if (isTouch) return; const b = e.target.closest('[data-act]'); if (b) press(b.dataset.act); });
    addEventListener('wheel', e => { if (IN.enabled && !this.modal) this.cycleSlot(e.deltaY > 0 ? 1 : -1); }, { passive: true });
    IN.onUnlock = () => { if (!this.modal && !g.cut && !isTouch && g.running) this.open('pause'); };
  }
  show(on) { $('#hud').style.display = on ? 'block' : 'none'; }
  // ---------- HUD ----------
  updateHud() {
    const g = this.g, S = g.save; if (!S) return; const st = g.st;
    $('#hpFill').style.width = Math.max(0, S.hp / st.maxHp * 100) + '%'; $('#hpTxt').textContent = `${fmt(Math.max(0, S.hp))} / ${fmt(st.maxHp)}`;
    $('#xpFill').style.width = (S.xp / ST.xpNeed(S.lvl) * 100) + '%'; $('#lvl').textContent = S.lvl; $('#pname').textContent = S.name; { const fr = ST.factionRank(S); let t = document.getElementById('ptitle'); if (!t) { t = document.createElement('small'); t.id = 'ptitle'; $('#pname').after(t); } t.innerHTML = `${fr.marine ? '⚓' : '☠'}<span> ${fr.title}</span>`; t.title = fr.title; t.className = fr.marine ? 'mar' : 'pir'; }
    $('#ber').textContent = '฿' + fmt(S.ber);
    this.updateTravel();
  }
  // always-visible travel objective so new players know how to leave the island
  updateTravel() { const g = this.g, S = g.save; const el = $('#travel'); if (!el || !S) return; migrateShips(S);
    const order = ISLANDS.filter(i => !i.secret && i.built !== false); const ci = order.findIndex(i => i.id === S.island); const next = order[ci + 1];
    let html = '', pulse = false;
    if (!S.ships.length) { const need = SHIPS.dinghy.price; html = S.ber >= need ? `⛵ You can afford a boat! Visit the <b class="sw">Shipwright</b> at the dock (blue ◆ beam)` : `⛵ Earn ฿${fmt(need)} (${fmt(S.ber)}/${fmt(need)}) → buy a boat at the <b class="sw">Shipwright</b> → open 🗺 Map to sail`; }
    else if (next && (S.stats.sails || 0) < 2) { html = S.lvl >= next.lvl ? `🗺 Tap <b>Map</b> to sail to <b>${next.name}</b>!` : `🗺 Next island: <b>${next.name}</b> (reach Lv.${next.lvl})`; pulse = S.lvl >= next.lvl; }
    el.innerHTML = html; el.style.display = html ? '' : 'none'; const mb = document.querySelector('[data-ui=map]'); if (mb) mb.classList.toggle('pulse', pulse && this.modal !== 'map');
    for (const n of g.npcs || []) if (n.beam) n.beam.visible = n.role === 'dock' && !S.ships.length; }
  updateQuest() { if (!this.g.save) return; const q = this.g.save.quest; $('#quest').innerHTML = q ? `<b>QUEST</b><span>${q.text}</span><em>${q.have}/${q.n}</em>` : `<b>QUEST</b><span class="dim">Talk to a <i class="qm">!</i> villager for a quest</span>`; this.mapDirty = true; }
  currentMoves() { return movesFor(this.g.save); }
  updateMoves() {
    const S = this.g.save; if (!S) return; const ms = this.currentMoves(); const box = $('#moves');
    const f = S.eq.fruit && FRUITS[S.eq.fruit]; const hasSp = f && f.special && S.slot === 'fruit';
    const spReq = hasSp ? (SP_REQ[f.rar] || 50) : 0; const spLock = hasSp && ST.mastery(S, 'fr:' + S.eq.fruit).lvl < spReq;
    box.innerHTML = ms.map((m, i) => `<div class="mv ${m.lock ? 'lock' : ''}" data-act="m${i + 1}" data-id="${m.id}"><kbd>${i + 1}</kbd><span>${m.name}</span>${m.lock ? `<b class="req">M${m.req}</b>` : ''}<i class="cd"></i></div>`).join('') + (hasSp ? `<div class="mv sp ${spLock ? 'lock' : ''}" data-act="special"><kbd>Q</kbd><span>${f.special.name}</span>${spLock ? `<b class="req">M${spReq}</b>` : ''}<i class="spg"></i></div>` : '') + (S.slot === 'fruit' && S.eq.fruit && ZOAN[S.eq.fruit] ? `<div class="mv tfm ${S.tf ? 'on' : ''}" data-act="tf"><kbd>X</kbd><span>${S.tf === 2 ? 'Beast form' : S.tf === 1 ? 'Hybrid form' : 'Transform'}</span></div>` : '');
    document.querySelectorAll('[data-slot]').forEach(b => { const s = b.dataset.slot; const have = s === 'fist' || (s === 'fruit' && S.eq.fruit) || (s === 'sword' && S.eq.sword) || (s === 'gun' && S.eq.gun); b.classList.toggle('on', S.slot === s); b.classList.toggle('none', !have);
      if (s === 'fruit') { const im = b.querySelector('img') || (() => { const i = document.createElement('img'); i.className = 'sfi'; b.prepend(i); return i; })(); if (f) { im.src = fruitIcon(S.eq.fruit, 64); im.style.display = ''; b.childNodes.forEach(n => { if (n.nodeType === 3) n.textContent = ''; }); } else { im.style.display = 'none'; b.childNodes.forEach(n => { if (n.nodeType === 3) n.textContent = '🍇'; }); } }
      if (s === 'fist') { const st = styleOf(S); b.childNodes.forEach(n => { if (n.nodeType === 3) n.textContent = st.icon; }); }
      b.querySelector('small').textContent = s === 'fist' ? styleOf(S).name.split(' ').slice(-1)[0] : s === 'fruit' ? (f ? f.short : '—') : s === 'sword' ? (S.eq.sword ? SWORDS[S.eq.sword].name.split(' ').pop() : '—') : (S.eq.gun ? GUNS[S.eq.gun].name.split(' ')[0] : '—'); });
    $('#spBtn').style.display = hasSp ? '' : 'none';
    { const tb = $('#tfBtn'); if (tb) { const zz = S.slot === 'fruit' && S.eq.fruit && ZOAN[S.eq.fruit]; tb.style.display = zz ? '' : 'none'; tb.classList.toggle('on', !!S.tf); tb.querySelector('small').textContent = S.tf === 2 ? 'Beast' : S.tf === 1 ? 'Hybrid' : 'Form'; } }
  }
  setSlot(s) { const S = this.g.save; if ((s === 'fruit' && !S.eq.fruit) || (s === 'sword' && !S.eq.sword) || (s === 'gun' && !S.eq.gun)) { this.toast(`No ${s} equipped - open Inventory (I)`, 'blk'); return; } S.slot = s; this.g.refreshEquip(); }
  cycleSlot(d = 1) { const S = this.g.save; const order = ['fist', 'fruit', 'sword', 'gun'].filter(s => s === 'fist' || S.eq[s]); let i = order.indexOf(S.slot); i = (i + d + order.length) % order.length; this.setSlot(order[i]); }
  frame(dt) {
    const g = this.g, p = g.p; this.updateHud();
    document.querySelectorAll('#moves .mv[data-id]').forEach(el => { const id = el.dataset.id; const c = p.cds[id] || 0, mx = (p.cdMax && p.cdMax[id]) || 1; el.querySelector('.cd').style.height = (c / mx * 100) + '%'; });
    const sp = document.querySelector('#moves .spg'); if (sp) { sp.style.width = p.special + '%'; sp.parentElement.classList.toggle('ready', p.special >= 100 && !!this.g.specialWindow()); }
    $('#spBtn').classList.toggle('ready', p.special >= 100 && !!this.g.specialWindow()); $('#spBtn').style.setProperty('--k', p.special + '%');
    $('#vign').style.opacity = Math.max(0, p.hurtT * 2) + (g.save.hp / g.st.maxHp < 0.3 ? 0.35 : 0);
    if (this.bossShown && this.bossE) { const e = this.bossE; $('#bossFill').style.width = (e.hp / e.max * 100) + '%'; }
    if (this.modal === 'map' && this.mapDirty) this.renderMap();
    if (this._mapT === undefined) this._mapT = 0; this._mapT += dt; if (this._mapT > 0.2) { this._mapT = 0; this.compass(); }
  }
  compass() { const g = this.g; let a = (-g.p.yaw * 180 / Math.PI) % 360; const el = $('#compass'); el.style.backgroundPositionX = (-a * 2) + 'px'; }
  promptFruit(id) { const el = $('#prompt'); el.style.display = 'block'; el.innerHTML = isTouch ? `<b>Pick up</b> 🍎 Devil Fruit` : `<kbd>E</kbd> Pick up the <b>Devil Fruit</b>`; const b = $('#actBtn'); b.style.display = ''; b.textContent = 'GRAB'; this._grab = true; }
  prompt(name) { if (this._grab) { this._grab = false; $('#actBtn').textContent = 'TALK'; } const el = $('#prompt'); if (name) { el.style.display = 'block'; el.innerHTML = isTouch ? `<b>Talk</b> ${name}` : `<kbd>E</kbd> Talk to <b>${name}</b>`; } else el.style.display = 'none'; $('#actBtn').style.display = name ? '' : 'none'; const w = !name && this.g.fishing && (this.g.fishing.state !== 'idle' || (this._fw = (this._fw || 0) + 1) % 10 === 0 ? (this._nw = this.g.fishing.state !== 'idle' || !!this.g.fishing.nearWater()) : this._nw); $('#fishBtn').style.display = w ? '' : 'none'; if (!isTouch && w && !name && this.g.fishing.state === 'idle') { el.style.display = 'block'; el.innerHTML = '<kbd>F</kbd> Fish'; } const S = this.g.save; $('#hakiBtn').style.display = S.lvl >= HAKI.buso ? '' : 'none'; $('#hakiBtn').classList.toggle('on2', !!(S.haki && S.haki.buso)); $('#conqBtn').style.display = S.lvl >= HAKI.conq ? '' : 'none'; }
  toast(msg, cls = '') { const el = h(`<div class="toast ${cls}">${msg}</div>`); $('#toasts').appendChild(el); setTimeout(() => el.classList.add('out'), 1800); setTimeout(() => el.remove(), 2300); const all = $('#toasts').children; if (all.length > 4) all[0].remove(); }
  banner(big, small) { const el = $('#banner'); el.innerHTML = `<b>${big}</b><span>${small || ''}</span>`; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); }
  moveName(n, col) { const el = $('#movename'); el.textContent = n; el.style.color = '#' + (col || 0xffffff).toString(16).padStart(6, '0'); el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); }
  islandBanner(I) { const sea = SEAS.find(s => s.id === I.sea); const el = $('#islandBanner'); el.innerHTML = `<small>${sea.name}</small><b>${I.name}</b>`; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); }
  hurt() { const el = $('#hurt'); el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); }
  letterbox(on) { document.body.classList.toggle('cine', on); }
  bossCard(def, lvl) { const el = $('#bosscard'); if (!def) { el.classList.remove('go'); return; } el.innerHTML = `<small>${def.title}</small><b>${def.name}</b><em>${def.bounty.match(/\d/) ? 'BOUNTY ฿' + def.bounty : def.bounty} · Lv.${lvl}</em><q>${def.taunt}</q>`; el.classList.add('go'); }
  specialCard(name, col, tag = 'SPECIAL') { const el = $('#specialcard'); if (!name) { el.classList.remove('go'); return; } el.innerHTML = `<small>${tag}</small><b>${name}</b>`; el.style.setProperty('--c', col); el.classList.add('go'); }
  bossBar(e) { const el = $('#bossbar'); this.bossE = e; this.bossShown = !!e; if (!e) { el.style.display = 'none'; return; } el.style.display = 'block'; el.querySelector('span').textContent = `${e.def.name} · Lv.${e.lvl}`; }
  // ---------- panels ----------
  toggle(id) { if (this.modal === id) this.close(); else this.open(id); }
  _rz() { if (this._rzOn) return; this._rzOn = 1; let t; const f = () => { clearTimeout(t); t = setTimeout(() => { this._chartDraw && this._chartDraw(); }, 180); }; addEventListener('resize', f); addEventListener('orientationchange', f); }
  open(id, arg) { window.__audio && window.__audio.sfx('open', { gap: 200 }); this._rz(); this._openT = performance.now(); IN.resetTouch && IN.resetTouch();
    const wasOpen = !!this.modal; this.close(true); this.modal = id; const P = $('#panel'); P.style.display = 'flex'; P.className = 'panel p-' + id + (wasOpen ? '' : ' pin');
    if (document.pointerLockElement) document.exitPointerLock();
    const fns = { inv: () => this.invHtml(arg), map: () => this.mapHtml(), pause: () => this.pauseHtml(), shop: () => this.shopHtml(arg), quest: () => this.questHtml(arg), dock: () => this.dockHtml(arg), trader: () => this.traderHtml(arg), player: () => this.playerHtml(arg), ptrade: () => this.ptradeHtml(), style: () => this.styleHtml(arg), dex: () => this.dexHtml(arg), dojo: () => this.dojoHtml(arg) };
    let body; try { const f = fns[id]; if (!f) throw new Error('no panel ' + id); body = f(); if (!body || typeof body !== 'string') throw new Error('empty'); }
    catch (err) { console.warn('panel', id, err); body = id === 'quest' && arg ? `<h2>${(arg.name || 'Villager')}</h2><p class="say">“Ahoy there, pirate! Fine weather for sailing, isn't it?”</p>` : `<h2>Oops</h2><p>Couldn't open this panel (${String(err && err.message || err).replace(/[<>]/g, '').slice(0, 80)}). Try again — your save is safe.</p>`; }
    P.innerHTML = `<div class="pbox"><button class="x" data-close>✕</button>${body}</div>`;
    P.querySelector('[data-close]').onclick = () => { if (performance.now() - (this._openT || 0) < 550) return; this.close(); };
    P.oninput = (e) => { const r = e.target.closest && e.target.closest('[data-vol]'); const A = window.__audio; if (r && A) { A.set[r.dataset.vol] = r.value / 100; A.save(); if (r.dataset.vol === 'sfx') A.sfx('punch', { gap: 150 }); } };
    this._openT = performance.now(); P.onclick = (e) => { if (performance.now() - this._openT < 550) return; /* ghost click from the tap that opened it */ if (e.target === P) this.close(); const b = e.target.closest('[data-do]'); if (b && !b.disabled) this.act(b.dataset.do, b); };
    if (id === 'map') { this.mapDirty = true; this.renderMap(); }
    clearInterval(this._fsIv); if (id === 'shop' && arg === 'rot') { const w0 = FS.windowId(); this._fsIv = setInterval(() => { if (this.modal !== 'shop') { clearInterval(this._fsIv); return; } if (FS.windowId() !== w0) { this.toast('🍇 Restocked!', 'item'); this.open('shop', 'rot'); return; } const el = $('#fsT'); if (el) el.textContent = FS.fmtLeft(FS.msLeft()); }, 1000); }
    if (id === 'pause') this.bindPause();
    if (id === 'player' && this.g.seat) P.classList.add('seated');
    if (id === 'style') { this.g.showPreview(true); this._stab = arg || 'look'; const R = P.querySelector('#sRows'); if (R) R.onclick = e => { const b = e.target.closest('button[data-lk]'); if (!b) return; e.stopPropagation(); stepLook(this.g.save.look, b.dataset.lk, +b.dataset.ld); R.innerHTML = rowsHtml(this.g.save.look); this.styleChanged(); }; }
  }
  close(silent) { if (this.modal === 'ptrade' && this.g.net.trade && !silent) this.g.net.tradeEnd('cancel'); if (!silent && this.g && this.g.seat) this.g.standUp(); if (this.g && this.g.preview && !silent) this.g.showPreview(false); this.modal = null; $('#panel').style.display = 'none'; $('#panel').innerHTML = ''; }
  talk(n) { this.trNpc = n; if (this.g.questEvent('talk', n.name)) return; if (n.role === 'shop') this.open('shop', n.shop); else if (n.role === 'quest') this.open('quest', n); else if (n.role === 'dock') this.open('dock', n); else if (n.role === 'trader') this.open('trader', n); else if (n.role === 'trainer') this.open('dojo', 'here'); else if (n.role === 'player') { if (n.sit) this.g.sitAt(); this.open('player', n); } else this.open('quest', n); }
  itemCard(kind, id, extra = '') { const d = DEF[kind][id]; const r = d.rar ?? 0;
    const stat = kind === 'sword' ? `DMG ${d.dmg} · SPD ${d.spd}` : kind === 'gun' ? `DMG ${d.dmg} · Range ${d.range}m` : kind === 'fruit' ? `${d.moves.length} moves${d.special ? ' + Special' : ''}` : Object.entries(d.stat).map(([k, v]) => `+${v < 1 ? Math.round(v * 100) + '%' : v} ${k.toUpperCase()}`).join(' ');
    return `<div class="item r${r}"><div class="ic ic-${kind}" style="--rc:${RCOL[r]}${kind === 'fruit' ? `;background:url(${fruitIcon(id)}) center/cover` : ''}"></div><div class="nm"><b>${d.name}</b><small style="color:${RCOL[r]}">${RARITY[r]} ${kind}</small><small>${stat}</small>${['fruit', 'sword', 'gun'].includes(kind) && this.g.save ? moveListHtml(this.g.save, kind, id) : ''}</div>${extra}</div>`; }
  autoShop(id) { const [, kind, Ls] = id.split(':'); const L = +Ls; const items = [];
    if (kind === 'weapons') { for (const [k, d] of Object.entries(SWORDS)) if (!d.secret && d.minLvl <= L + 10 && d.minLvl >= L - 45) items.push(['sword', k]); for (const [k, d] of Object.entries(GUNS)) if (d.minLvl <= L + 10 && d.minLvl >= L - 60) items.push(['gun', k]); }
    if (kind === 'fruits') { const maxR = L < 20 ? 2 : L < 60 ? 3 : L < 120 ? 4 : L < 250 ? 5 : 6; const pool = Object.entries(FRUITS).filter(([k, f]) => !f.ultra && f.rar <= maxR && f.rar >= maxR - 3).map(([k]) => k); let h = L * 7 + new Date().getDate(); const pick = new Set(); while (pick.size < Math.min(6, pool.length)) { h = (h * 1103515245 + 12345) % 2147483648; pick.add(pool[h % pool.length]); } for (const k of pick) items.push(['fruit', k]); items.sort((a, b) => FRUITS[a[1]].rar - FRUITS[b[1]].rar); }
    if (kind === 'wear') for (const [k, d] of Object.entries(ACCESSORIES)) if (d.minLvl <= L + 5 && d.minLvl >= L - 50) items.push(['wear', k]);
    const IS = islandById(this.g.save.island); return { title: { weapons: IS.id === 'loguetown' ? "Ipponmatsu's Sword Shop & Forge" : 'Weapon Dealer', fruits: 'Devil Fruit Dealer', wear: 'Outfitter' }[kind], items, forge: IS.id === 'loguetown' && kind === 'weapons' }; }
  styleReq(st) { const S = this.g.save, r = st.req; const m = ST.mastery(S, 'fs:' + st.from).lvl; const boss = (S.kills[r.boss] || 0) > 0; const own = S.styles.includes(st.from); const ber = S.ber >= r.ber;
    const bn = (ENEMIES[r.boss] || {}).name || r.boss; const text = `${own ? '✔' : '✘'} know ${STYLES[st.from].name} · ${m >= r.mast ? '✔' : '✘'} its mastery ${r.mast} (you ${m}) · ${boss ? '✔' : '✘'} defeat ${bn} · ${ber ? '✔' : '✘'} ฿${fmt(r.ber)}`; return { all: own && m >= r.mast && boss && ber, text }; }
  dojoHtml(mode = 'all') { this._dojo = mode; const S = this.g.save; S.styles = S.styles || ['brawler']; const isl = S.island; const cur = styleOf(S).id;
    const list = Object.values(STYLES).filter(st => mode === 'all' || st.island === isl || (st.from && STYLES[st.from] && (STYLES[st.from].island === isl || (STYLES[STYLES[st.from].from] || {}).island === isl)));
    const card = st => { const own = S.styles.includes(st.id); const m = ST.mastery(S, 'fs:' + st.id).lvl; let btn = '';
      if (own) btn = `<button data-do="stEq:${st.id}" class="${cur === st.id ? 'on' : ''}">${cur === st.id ? 'Equipped' : 'Equip'}</button>`;
      else if (st.from) { const r = this.styleReq(st); btn = `<small class="req">Upgrade quest: ${r.text}</small><button data-do="stUp:${st.id}" class="${r.all ? '' : 'poor'}">Upgrade</button>`; }
      else if (st.island && (mode !== 'all' || st.island === isl)) btn = `<button data-do="stBuy:${st.id}" class="${S.ber < st.price ? 'poor' : ''}">฿${fmt(st.price)}</button>`;
      else if (st.island) btn = `<small class="dim">Trainer on ${islandById(st.island).name}</small>`;
      return `<div class="stc ${own ? 'own' : ''}" style="--rc:#${st.col.toString(16).padStart(6, '0')}"><div class="sti">${st.icon}</div><div class="stb"><b>${st.name}${own ? ` <small>· Mastery ${m}</small>` : ''}</b><small>${st.desc}</small>${own ? moveListHtml(S, 'style', st.id) : `<small class="mvs">${st.moves.map((x, k) => x[1] + ` <em>M${[1, 10, 25, 50][k]}</em>`).join(' · ')}</small>`}${st.from ? `<small class="gold">Advanced form of ${STYLES[st.from].name}</small>` : ''}</div><div class="stx">${btn}</div></div>`; };
    return `<h2>🥋 ${mode === 'all' ? 'Fighting Styles' : 'Dojo — ' + islandById(isl).name}</h2><p class="dim">${Object.keys(STYLES).length} styles · you know ${S.styles.length}. Styles replace your fists: own moves, mastery and effects. Advanced styles unlock through quest chains.</p><div class="stl">${list.map(card).join('')}</div>`; }
  dexHtml(tier = 7) { tier = +tier; const S = this.g.save; const seen = new Set([...S.inv.fruits, S.eq.fruit, ...Object.keys(S.awake || {})]);
    const tabs = RARITY.map((r, i) => `<button data-do="dex:${i}" class="${i === tier ? 'on' : ''}" style="color:${RCOL[i]}">${r} (${Object.values(FRUITS).filter(f => f.rar === i).length})</button>`).join('');
    const list = Object.entries(FRUITS).filter(([, f]) => f.rar === tier).map(([id, f]) => `<div class="dexc" style="--rc:${RCOL[tier]}"><img src="${fruitIcon(id)}"><div><b>${f.name}${seen.has(id) ? ' <i class="gold">✔</i>' : ''}</b><small>${f.moves.map(m => m.name).join(' · ')}</small>${f.special ? `<small class="gold">★ Special: ${f.special.name}</small>` : ''}${f.rar >= 4 ? '<small style="color:#7dffb0">Can Awaken</small>' : ''}</div></div>`).join('');
    return `<h2>📖 Devil Fruit Encyclopedia</h2><p class="dim">${Object.keys(FRUITS).length} fruits · Common/Uncommon/Rare: 3 moves · Epic/Legendary: 4 · Godly/Mythical/Ultra: 4 + cutscene Special (boss fights, below 35% HP, or 3+ enemies near). Legendary+ can Awaken. ★ = original fan fruit.</p><div class="tabs dextabs">${tabs}</div><div class="dexl">${list}</div>`; }
  rotHtml() { const S = this.g.save, isl = S.island, w = FS.windowId(); const st = FS.stockFor(isl, w); S.fsold = S.fsold || {}; const sold = S.fsold[isl + ':' + w] || [];
    const odds = FS.WEIGHTS.map((p, i) => `<span style="color:${RCOL[i]}">${RARITY[i]} ${p}%</span>`).join(' · ');
    return `<h2>🍇 Fruit Dealer</h2><p class="dim">You have <b class="gold">฿${fmt(S.ber)}</b> · Restocks in <b class="gold" id="fsT">${FS.fmtLeft(FS.msLeft())}</b></p><p class="odds">Each slot rolls: ${odds}</p><div class="fstock">` +
      st.map(o => { const f = FRUITS[o.id]; const gone = sold.includes(o.slot); return `<div class="fslot r${o.rar} ${gone ? 'gone' : ''}" style="--rc:${RCOL[o.rar]}"><img src="${fruitIcon(o.id)}"><b>${f.name}</b><small style="color:${RCOL[o.rar]}">${RARITY[o.rar]}</small><small>${f.moves.length} moves${f.special ? ' + Special' : ''}${f.rar >= 4 ? ' · Awakens' : ''}</small>${gone ? '<button disabled>SOLD</button>' : `<button data-do="rbuy:${o.slot}" class="${S.ber < o.price ? 'poor' : ''}">฿${fmt(o.price)}</button>`}</div>`; }).join('') + `</div>`; }
  shopHtml(id) { this.shopId = id; if (id === 'rot') return this.rotHtml(); const sh = id.startsWith('auto:') ? this.autoShop(id) : SHOPS[id]; const S = this.g.save;
    const isWear = sh.items.some(([k]) => k === 'wear');
    return `<h2>${sh.title}</h2><p class="dim">You have <b class="gold">฿${fmt(S.ber)}</b></p>${isWear ? '<button class="big2" data-do="stab:shop">✂ Cosmetics &amp; Wardrobe (hats, capes, coats, glasses…)</button>' : ''}<div class="list">` + sh.items.map(([k, i]) => { const d = DEF[k][i]; const own = k !== 'fruit' && S.inv[KIND[k]].includes(i);
      const lock = d.minLvl && S.lvl < d.minLvl; return this.itemCard(k, i, own ? `<button disabled>Owned</button>` : lock ? `<button disabled>Lv.${d.minLvl}</button>` : `<button data-do="buy:${k}:${i}" ${S.ber < d.price ? 'class="poor"' : ''}>฿${fmt(d.price)}</button>`); }).join('') + `</div>` + (sh.forge ? this.forgeHtml() : ''); }
  forgeHtml() { const S = this.g.save; const need = ['wado', 'sandai', 'shusui']; const have = need.map(n => S.inv.swords.includes(n)); const done = S.inv.swords.includes('sanbon');
    return `<h3>⚒ Master Forge — Three Sword Style</h3><p class="dim">Bring three legendary blades and I'll forge them into the <b>Three Sword Style</b> set.</p><div class="list">${need.map((n, i) => `<div class="item"><div class="nm"><b>${SWORDS[n].name}</b><small>${SWORDS[n].quest || 'Sold at weapon dealers around Lv.' + SWORDS[n].minLvl}</small></div><b class="${have[i] ? 'gold' : 'red'}">${have[i] ? '✔ Have' : '✘ Missing'}</b></div>`).join('')}</div>${done ? '<p class="gold">You already own Three Sword Style!</p>' : `<button class="go" data-do="forge" ${have.every(Boolean) ? '' : 'disabled'}>Forge Three Sword Style</button>`}`; }
  styleHtml(tab = 'look') { const S = this.g.save; S.cos = S.cos || []; S.cosEq = S.cosEq || {};
    const tabs = `<div class="tabs"><button data-do="stab:look" class="${tab === 'look' ? 'on' : ''}">✂ Appearance</button><button data-do="stab:shop" class="${tab === 'shop' ? 'on' : ''}">🛍 Cosmetics Shop</button><button data-do="stab:mine" class="${tab === 'mine' ? 'on' : ''}">🎒 My Cosmetics (${S.cos.length})</button></div>`;
    if (tab === 'look') return `<h2>Wardrobe</h2>${tabs}<p class="dim">Restyle any time — free. Your crewmates see your new look.</p><div class="lrows" id="sRows">${rowsHtml(S.look)}</div>`;
    const ids = Object.keys(COSMETICS).filter(id => tab === 'shop' ? true : S.cos.includes(id));
    const card = id => { const c = COSMETICS[id]; const own = S.cos.includes(id), on = S.cosEq[c.slot] === id;
      return `<div class="cos ${on ? 'on' : ''}"><div class="ce">${c.icon}</div><b>${c.name}</b><small>${c.slot}</small>${own ? `<button data-do="cosEq:${id}">${on ? 'Unequip' : 'Wear'}</button>` : `<button data-do="cosBuy:${id}" class="${S.ber < c.price ? 'poor' : ''}">฿${fmt(c.price)}</button>`}</div>`; };
    return `<h2>${tab === 'shop' ? 'Cosmetics Shop' : 'My Cosmetics'}</h2>${tabs}<p class="dim">Cosmetics are looks only (no stats). One per slot: hat · back · face · neck · extra. You have ฿${fmt(S.ber)}.</p><div class="cosgrid">${ids.length ? ids.map(card).join('') : '<p class="dim">Nothing yet — check the shop!</p>'}</div>`; }
  styleChanged() { const g = this.g; ST.save(g.save); g.rebuildArms(); if (g.preview) g.showPreview(true); g.net && g.net.lookChanged && g.net.lookChanged(); }
  questTimer(t) { const el = $('#quest'); if (!el) return; let tm = el.querySelector('.qt'); if (t == null) { if (tm) tm.remove(); return; } if (!tm) { tm = document.createElement('i'); tm.className = 'qt'; el.appendChild(tm); } tm.textContent = '⏱ ' + Math.ceil(t) + 's'; tm.classList.toggle('red', t < 10); }
  giverHint() { const g = this.g, S = g.save; if (!S || S.quest || !g.island) return; const isl = g.island.id;
    const q = (QUESTS[isl] || []).find(q => !S.qdone.includes(q.id) && S.lvl >= (q.lvl || 0) && q.giver !== 'Mysterious Swordsman' && (g.npcs || []).some(n => n.name === q.giver));
    if (q) this.toast(`Talk to ${q.giver} (yellow !) for a quest`, 'quest'); }
  questHtml(n) { const S = this.g.save; const list = QUESTS[S.island] || []; const mine = list.filter(q => q.giver === n.name); const avail = mine.find(q => !S.qdone.includes(q.id) && S.lvl >= (q.lvl || 0)) || mine.find(q => !S.qdone.includes(q.id));
    const bossN = Object.values(QUESTS[S.island] || []).find(q => (q.target || '').endsWith('_boss')); const line = (n.name === 'Mysterious Swordsman' ? ['...You want a legendary blade? Prove yourself. Only the strongest finish my trials.', 'Hmph. Not bad.'] : LINES[n.name] || [bossN ? `Please help us! ${bossN.text.replace('Defeat ', '')} has taken over this island!` : 'Hello there!', 'Thank you, hero! You saved us.'])[avail ? 0 : 1]; this.qNpc = n;
    let act = '';
    if (S.quest) act = `<p>Current quest: <b>${S.quest.text}</b> (${S.quest.have}/${S.quest.n})</p><button data-do="qdrop">Abandon quest</button>`;
    else if (!avail) act = `<p class="dim">No more quests from ${n.name} right now.</p>`;
    else if (S.lvl < avail.lvl) act = `<div class="qcard lock"><b>${avail.text}</b><span>Requires level ${avail.lvl}</span></div>`;
    else act = `<div class="qcard"><b>${avail.text}</b><span>Reward: ${avail.xp} XP · ฿${fmt(avail.ber)}</span></div><button class="go" data-do="qtake:${avail.id}">Accept Quest</button>`;
    return `<h2>${n.name}</h2><p class="say">“${line}”</p>${act}<h3>All quests here</h3><div class="qlist">${list.map(q => `<div class="${S.qdone.includes(q.id) ? 'done' : S.lvl < q.lvl ? 'lock' : ''}">Lv.${q.lvl} · ${q.text} <small>(${q.giver})</small> ${S.qdone.includes(q.id) ? '✔' : ''}</div>`).join('')}</div>`; }
  dockHtml(n) { const S = this.g.save; migrateShips(S); const cur = shipOf(S);
    const row = id => { const D = SHIPS[id]; const own = S.ships.includes(id); const lock = S.lvl < D.lvl; const seas = D.tier >= 5 ? 'All 3 seas' : D.tier >= 3 ? 'First + Second Sea' : 'First Sea';
      const btn = own ? (S.ship === id ? '<button class="on" disabled>Sailing</button>' : `<button data-do="useship:${id}">Use</button>`) : lock ? `<small class="red">Lv.${D.lvl}</small>` : `<button data-do="buyship:${id}" class="${S.ber < D.price ? 'poor' : ''}">฿${fmt(D.price)}</button>`;
      return `<div class="shipc ${own ? 'own' : ''} ${lock ? 'lock' : ''}"><div class="shi">${['', '🛶', '⛵', '🚢', '🦁', '⚓', '🐋'][D.tier]}</div><div class="stb"><b>${D.name} <small class="gold">Tier ${D.tier}</small></b><small>${D.desc}</small>
        <div class="shst"><span>💨 Speed ${D.spd.toFixed(1)}</span><span>🛡 Hull ${D.hull}</span><span>💥 ${D.cannons ? D.cannons + ' cannons · ' + D.dmg + ' dmg' : 'slingshot only'}</span><span>🌊 ${seas}</span></div></div><div class="stx">${btn}</div></div>`; };
    return `<h2>⚓ ${n.name} · Shipwright</h2><p class="say">“${cur ? `The ${cur.name} is ready. Where to, captain?` : 'No ship, no sea! Every pirate needs a boat — start with a sailboat.'}”</p>
      ${cur ? '<button class="go" data-do="openmap">🗺 Open Sea Chart &amp; Set Sail</button>' : ''}<p class="dim">You sail in first person from the deck: steer, fire cannons at warships and Sea Kings for Berries. The Second Sea needs a Tier 3 coated ship, the Third Sea Tier 5.</p>
      <div class="stl">${SHIP_IDS.map(row).join('')}</div>`; }
  traderHtml(n) { const S = this.g.save; const m = S.inv.mats;
    return `<h2>${n.name} · Material Trader</h2><p class="say">“Bring me the stuff enemies drop on each island and I'll make it worth your while!”</p><p class="dim">Your materials: ${Object.entries(m).map(([k, v]) => `<b>${k}</b> ×${v}`).join(' · ') || 'none yet'}</p><div class="list">` +
      TRADES.map((t, i) => { if (t.secret) { if ((S.secrets || {})[t.secret]) return ''; const tro = Object.keys(m).filter(k => /\((Boss)\)$/.test(k) && ['Energy Steroid (Boss)', 'Smiley Gas Vial (Boss)', 'SMILE Fruit Seed (Boss)', 'Mink Fur (Boss)'].includes(k)); const ok = tro.length >= 3; return `<div class="item"><div class="nm"><b>${t.label}</b><small>Costs: 3 different Second Sea boss trophies (have ${tro.length})</small></div><button data-do="trade:${i}" ${ok ? '' : 'class="poor"'}>Trade</button></div>`; } const ok = Object.entries(t.give).every(([k, v]) => (m[k] || 0) >= v); return `<div class="item"><div class="nm"><b>${t.label}</b><small>Costs: ${Object.entries(t.give).map(([k, v]) => `${v}× ${k}`).join(', ')}</small></div><button data-do="trade:${i}" ${ok ? '' : 'class="poor"'}>Trade</button></div>`; }).join('') + `</div>`; }
  invHtml(tab = 'gear') { const S = this.g.save; this.invTab = tab; const st = this.g.st;
    const tabs = ['gear', 'fish', 'crew', 'mastery', 'haki', 'stats', 'trophies', 'ranks'].map(t => `<button class="tab ${t === tab ? 'on' : ''}" data-do="invtab:${t}">${{ fish: '🎣 Fish', trophies: '🏆 Trophies', crew: '🤝 Crew' }[t] || t[0].toUpperCase() + t.slice(1)}</button>`).join('') + `<button class="tab" data-do="dojo:all">🥋 Styles</button><button class="tab" data-do="stab:look">✂ Wardrobe</button><button class="tab" data-do="dex:7">📖 Fruits</button>`;
    let body = '';
    if (tab === 'haki') { S.hakiT = S.hakiT || {}; for (const k in HAKI) if (S.lvl >= HAKI[k] && !S.hakiT[k]) S.hakiT[k] = 1; const pts = hakiPoints(S); const nm = { buso: '🛡 Armament', ken: '👁 Observation', conq: "👑 Conqueror's" }; const cc = { buso: '#9a7aff', ken: '#5ad0ff', conq: '#ff4a6a' };
      body = `<p class="dim">Haki Points: <b class="gold">${pts}</b> · earn 1 every 10 levels and 1 for each different boss defeated. Toggle Haki with H (or the Haki button); Conqueror's with X.</p><div class="htree">${Object.keys(HAKI_TREE).map(k => `<div class="hcol" style="--hc:${cc[k]}"><h3>${nm[k]} <small>Lv.${HAKI[k]}+</small></h3>${HAKI_TREE[k].map(([n, d], t) => { const own = (S.hakiT[k] || 0) > t; const next = (S.hakiT[k] || 0) === t; const lv = hakiTierLvl(k, t); const can = next && t > 0 && S.lvl >= lv && pts > 0;
        return `<div class="hnode ${own ? 'own' : ''} ${next ? 'next' : ''}"><b>${t + 1}. ${n}</b><small>${d}</small>${own ? '<em>✔ Learned</em>' : next ? (t === 0 ? `<em class="red">Unlocks at Lv.${HAKI[k]}</em>` : can ? `<button data-do="hbuy:${k}">Learn (1 pt)</button>` : `<em class="red">${S.lvl < lv ? 'Lv.' + lv : 'Need 1 point'}</em>`) : `<em class="dim">Lv.${lv}</em>`}</div>`; }).join('<i class="hline"></i>')}</div>`).join('')}</div>`; }
    if (tab === 'trophies') body = achHtml(S, fmt);
    else if (tab === 'crew') body = crewTabHtml(S, fmt, esc);
    else if (tab === 'fish') { const C = S.inv.fish || {}; const dex = S.fishdex || {}; const rows = FISH.filter(f => C[f[0]]).sort((a, b) => b[2] - a[2]);
      const tot = rows.reduce((a, f) => a + fishValue(S, f) * C[f[0]], 0);
      body = `<p class="dim">Fish at any dock or beach (F / FISH button). Sell fish for Berries or cook them to heal — Rare+ dishes give a <b>Well Fed</b> damage buff. Rare catches: treasure chests and even Devil Fruits (~1.5%)!</p>
        <h3>Cooler ${rows.length ? `<button data-do="fsellall:x" style="float:right">Sell all · ฿${fmt(tot)}</button>` : ''}</h3><div class="list">${rows.length ? rows.map(f => `<div class="item"><div class="ic" style="--rc:${FISH_COL[f[2]]};display:flex;align-items:center;justify-content:center;font-size:26px">${f[3]}</div><div class="nm"><b>${f[0]} ×${C[f[0]]}</b><small style="color:${FISH_COL[f[2]]}">${FISH_RAR[f[2]]} fish</small><small>฿${fmt(fishValue(S, f))} each</small></div><button data-do="fcook:${f[0]}">🍳 Cook</button><button data-do="fsell:${f[0]}">฿ Sell</button></div>`).join('') : '<p class="dim">Empty — go catch something!</p>'}</div>
        <h3>Fish Log · ${Object.keys(dex).length}/${FISH.length} species</h3><div class="fdex">${FISH.map(f => dex[f[0]] ? `<span style="border-color:${FISH_COL[f[2]]}" title="${f[0]}">${f[3]}<small>${f[0]}</small></span>` : `<span class="unk">❔<small>???</small></span>`).join('')}</div>`; }
    else if (tab === 'haki') {} else if (tab === 'gear') {
      const sec = (k, title) => { const ids = S.inv[KIND[k]]; return `<h3>${title}</h3><div class="list">${ids.length ? ids.map((id, idx) => { const eq = k === 'wear' ? S.eq.wear.includes(id) : S.eq[k] === id;
        const t2 = k === 'sword' && T2[id] ? ((S.t2 || {})[id] ? `<small class="gold">★ ${T2[id]}</small>` : `<button data-do="t2:${id}" title="Tier II">★ II</button>`) : '';
        return this.itemCard(k, id, t2 + (k === 'fruit' ? `<button data-do="eat:${idx}">Eat</button>` : `<button data-do="equip:${k}:${id}" class="${eq ? 'on' : ''}">${eq ? 'Equipped' : 'Equip'}</button>`)); }).join('') : '<p class="dim">None yet</p>'}</div>`; };
      const f = S.eq.fruit && FRUITS[S.eq.fruit]; const mlv = f ? ST.mastery(S, 'fr:' + S.eq.fruit).lvl : 0; const aw = S.awake && S.awake[S.eq.fruit];
      const awk = !f ? '' : f.rar < 4 ? '<p class="dim">Only Legendary, Godly, Mythical and Ultra fruits can Awaken.</p>' : aw ? '<p class="gold">✦ AWAKENED (+50% damage)</p>' : `<div class="qcard"><b>Awakening</b><span>Needs fruit mastery 40 (you: ${mlv}) and ฿${fmt(this.awakenCost(f))}</span></div><button class="go" data-do="awaken" ${mlv >= 40 ? '' : 'disabled'}>Awaken ${f.short}</button>`;
      const cur = S.eq.fruit ? `<div class="cur">Ate: ${this.itemCard('fruit', S.eq.fruit, '')}</div>${awk}` : `<p class="dim">You haven't eaten a Devil Fruit yet. (You can only have one power at a time — eating another replaces it.)</p>`;
      body = `<h3>Devil Fruit Power</h3>${cur}` + sec('fruit', 'Fruits in bag') + sec('sword', 'Swords') + sec('gun', 'Guns') + sec('wear', 'Wearables (up to 3)') + `<h3>Materials</h3><p class="dim">${Object.entries(S.inv.mats).map(([k, v]) => `${k} ×${v}`).join(' · ') || 'None yet'}</p>`;
    } else if (tab === 'mastery') {
      const rows = Object.entries(S.mastery).map(([k, m]) => { const [t, id] = k.split(':'); const n = t === 'fr' ? FRUITS[id]?.name : t === 'sw' ? SWORDS[id]?.name : t === 'gn' ? GUNS[id]?.name : t === 'fs' ? (STYLES[id]?.name || id) + ' (style)' : id; return `<div class="mrow"><b>${n}</b><span>Mastery ${m.lvl}</span><i><u style="width:${m.xp / (6 + m.lvl * 2) * 100}%"></u></i><small>+${Math.round((m.lvl - 1) * 1.2)}% dmg</small></div>`; });
      body = `<p class="dim">Every fighting style, fruit, sword and gun has its own mastery. Use it to level it up — higher mastery = more damage and unlocks moves.</p>${rows.join('') || '<p class="dim">Hit something!</p>'}`;
    } else if (tab === 'ranks') {
      const all = [...(S.fakes || []).map(f => ({ n: f.name, l: f.lvl, b: f.bounty, f: f.faction })), { n: S.name + ' (you)', l: S.lvl, b: this.bounty(), f: S.faction, me: 1 }].sort((a, b) => b.l - a.l || b.b - a.b);
      body = `<p class="dim">Leaderboard — players on your server</p><div class="qlist">${all.map((r, i) => `<div class="${r.me ? 'gold' : ''}">#${i + 1} · <b>${r.n}</b> · Lv.${r.l} · ${r.f} · ฿${fmt(r.b)}</div>`).join('')}</div>`;
    } else {
      const s = S.stats; const fr = ST.factionRank(S); body = `<div class="poster ${fr.marine ? 'mar' : ''}"><small>${fr.marine ? 'MARINE SERVICE RECORD' : 'WANTED · DEAD OR ALIVE'}</small><b>${esc(S.name)}</b><em>${fr.title}</em><span>${fr.unit}: ${fr.marine ? fmt(fr.value) + ' pts' : '฿' + fmt(fr.value)}</span><i>${fr.next ? `Next: ${fr.nextTitle} at ${fr.marine ? fmt(fr.next) + ' merit' : '฿' + fmt(fr.next)}` : 'Highest rank reached!'}</i><i>Perk: ${fr.perk}</i></div><div class="grid">${[['Name', S.name], ['Faction', S.faction], ['Race', `${S.race} <small>(${RACES[S.race].perk})</small>`], ['Level', S.lvl], ['Max HP', st.maxHp], ['Damage x', st.dmg.toFixed(2)], ['Speed', st.spd.toFixed(1)], ['Berries', '฿' + fmt(S.ber)], ['Fighting Style', `${styleOf(S).icon} ${styleOf(S).name} <small>(mastery ${ST.mastery(S, 'fs:' + styleOf(S).id).lvl})</small>`], ['Styles known', `${(S.styles || ['brawler']).length} / ${Object.keys(STYLES).length}`], ['Enemies defeated', s.kills], ['Bosses defeated', s.bosses], ['Damage dealt', fmt(s.dmg)], ['Punches thrown', fmt(s.punches)], ['Deaths', s.deaths], ['Play time', Math.round(s.time / 60) + ' min'], ['Islands found', S.unlocked.length], ['Quests done', S.qdone.length], ['Bounty', '฿' + fmt(this.bounty())], ['Fish caught', s.fish || 0], ['Chests opened', s.chests || 0], ['Haki', S.lvl >= HAKI.conq ? 'Armament · Observation · Conqueror' : S.lvl >= HAKI.ken ? 'Armament · Observation' : S.lvl >= HAKI.buso ? 'Armament' : 'Locked (Lv.15)']].map(([a, b]) => `<div><small>${a}</small><b>${b}</b></div>`).join('')}</div>`;
      body += `<h3>Charts</h3><canvas id="chK" class="chart2"></canvas><canvas id="chM" class="chart2"></canvas><canvas id="chA" class="chart2"></canvas><h3>Export</h3><div class="seg"><button data-do="exp:csv">⬇ Stats (CSV)</button><button data-do="exp:json">⬇ Save backup (JSON)</button></div>`; setTimeout(() => drawStatCharts(S), 40);
    }
    return `<h2>Inventory</h2><div class="tabs">${tabs}</div>${body}`; }
  bounty() { return ST.bountyOf(this.g.save); }
  playerHtml(n) { const f = n.fake; const S = this.g.save; this.offer = this.offer && this.offer.who === f.id ? this.offer : { who: f.id, ...makeOffer(this.g, f) }; const o = this.offer;
    const nm = ([k, id]) => k === 'ber' ? '฿' + fmt(id) : k === 'fruit' ? `<img class="tfi" src="${fruitIcon(id)}">` + FRUITS[id].name : k === 'sword' ? SWORDS[id].name : ACCESSORIES[id].name;
    const rc = ([k, id]) => k === 'fruit' ? RCOL[FRUITS[id].rar] : '#fff';
    const verdict = o.ratio > 1.15 ? '<b class="gold">Great deal for you!</b>' : o.ratio > 0.8 ? '<b style="color:#7dffb0">Fair trade</b>' : '<b class="red">Looks like a rip-off…</b>';
    return `<h2>${f.name}</h2><p class="dim">Lv.${f.lvl} ${f.faction} · Fruit: ${FRUITS[f.fruit] ? FRUITS[f.fruit].name : 'none'} · Bounty ฿${fmt(f.bounty)}</p><p class="say">“${f.honest ? 'Hey! Wanna trade?' : 'Yo, I got an AMAZING deal for you, trust me!!'}”</p>
      <div class="trade"><div><small>They give</small><b style="color:${rc(o.give)}">${nm(o.give)}</b></div><div class="arr">⇄</div><div><small>You give</small><b style="color:${rc(o.want)}">${nm(o.want)}</b></div></div><p>${verdict}</p>
      <button class="go" data-do="tacc">Accept</button> <button data-do="tnew">Ask for another offer</button> <button data-do="tdec">Decline</button>${this.g.net.status === 'online' ? `<h3>Crewmates on this island</h3><div class="seg">${this.g.net.peersHere().map(p => `<button data-do="ptr:${p.id}">⚖ Trade with ${esc(p.name)}</button>`).join('') || '<span class="dim">No crewmates here yet — they can sit at the other stools.</span>'}</div>` : ''}`; }
  refreshTrade() { if (this.modal === 'ptrade') { const P = $('#panel .pbox'); if (P) P.innerHTML = '<button class="x" data-close>✕</button>' + this.ptradeHtml(); const x = P && P.querySelector('[data-close]'); if (x) x.onclick = () => this.close(); } }
  ptradeHtml() { const T = this.g.net.trade, S = this.g.save; if (!T) return '<h2>Trade</h2><p>No trade open.</p>';
    const nm = it => !it ? '<span class="dim">nothing</span>' : it.k === 'fruit' ? `<img class="tfi" src="${fruitIcon(it.id)}"><b style="color:${RCOL[(FRUITS[it.id] || {}).rar || 0]}">${(FRUITS[it.id] || {}).name || it.id}</b>` : `<b>${({ sword: SWORDS, gun: GUNS, wear: ACCESSORIES }[it.k][it.id] || {}).name || it.id}</b>`;
    const side = (o, acc) => `<div class="tside ${acc ? 'ok' : ''}">${nm(o.it)}<small>+ ฿${fmt(o.ber)}</small>${acc ? '<em>✔ Accepted</em>' : ''}</div>`;
    if (T.wait && !T.open) return `<h2>⚖ Trade with ${esc(T.name)}</h2><p class="say">Waiting for ${esc(T.name)} to open the trade…</p><button data-do="tx">Cancel</button>`;
    const pick = [...new Set(S.inv.fruits)].map(id => `<button data-do="tit:fruit:${id}" class="${T.mine.it && T.mine.it.id === id ? 'on' : ''}"><img class="sfi" src="${fruitIcon(id)}">${FRUITS[id].short || FRUITS[id].name}</button>`).join('') + [...new Set(S.inv.swords)].map(id => `<button data-do="tit:sword:${id}" class="${T.mine.it && T.mine.it.id === id ? 'on' : ''}">⚔ ${SWORDS[id].name}</button>`).join('') + [...new Set(S.inv.guns)].map(id => `<button data-do="tit:gun:${id}" class="${T.mine.it && T.mine.it.id === id ? 'on' : ''}">🔫 ${GUNS[id].name}</button>`).join('') + [...new Set(S.inv.wear)].map(id => `<button data-do="tit:wear:${id}" class="${T.mine.it && T.mine.it.id === id ? 'on' : ''}">🎽 ${ACCESSORIES[id].name}</button>`).join('');
    return `<h2>⚖ Trading with ${esc(T.name)}</h2><p class="dim">Live trade between real players. Both must accept; changing the offer resets both accepts.</p>
      <div class="trade2">${side(T.mine, T.accMe)}<div class="arr">⇄</div>${side(T.theirs, T.accThem)}</div><div class="tlab"><small>You give</small><small>${esc(T.name)} gives</small></div>
      <h3>Your offer</h3><div class="tpick"><button data-do="tit:none" class="${!T.mine.it ? 'on' : ''}">— no item —</button>${pick}</div>
      <div class="seg">${[1000, 10000, 100000, 1000000].map(v => `<button data-do="tber:${v}">+฿${fmt(v)}</button>`).join('')}<button data-do="tber:0">฿0</button></div>
      <p><button class="go" data-do="tok" ${T.accMe ? 'disabled' : ''}>${T.accMe ? 'Waiting for them…' : 'Accept trade'}</button> <button data-do="tx">Cancel</button></p>`; }
  chat(name, msg) { const el = h(`<div class="chatl"><b>${name}:</b> ${msg}</div>`); $('#chat').appendChild(el); setTimeout(() => el.remove(), 9000); while ($('#chat').children.length > 4) $('#chat').firstChild.remove(); }
  fishBtn(label) { const b = $('#fishBtn'); b.textContent = label || 'FISH'; b.classList.toggle('reel', !!label); }
  biteFx(on) { $('#bite').style.display = on ? 'block' : 'none'; }
  chestPopup(r) { const el = $('#chest'); el.innerHTML = `<div class="cbx"><div class="chesticon"></div><small>TREASURE CHEST!</small><b style="color:${r.col}">${r.txt}</b><span>${r.sub}</span></div>`; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); }
  awakenCost(f) { return [0, 0, 0, 0, 80000, 250000, 600000, 1500000][f.rar]; }
  mapHtml() { return `<h2>World Map</h2><div class="maptabs"><span id="mapInfo" class="dim">Tap an island</span></div><div id="wmap"></div>`; }
  renderMap() {
    this.mapDirty = false; const el = $('#wmap'); if (!el) return; const S = this.g.save;
    const questIsl = new Set(); for (const [isl, qs] of Object.entries(QUESTS)) if (qs.some(q => !S.qdone.includes(q.id) && S.lvl >= q.lvl)) questIsl.add(isl);
    const dots = ISLANDS.map(I => { if (I.secret && !(S.secrets || {})[I.id]) return `<button class="isl secret" style="left:${I.x}%;top:${I.y}%" data-do="isl:${I.id}"><span>???<small>Secret</small></span></button>`; const here = I.id === S.island; const lock = S.lvl < I.lvl; const q = questIsl.has(I.id);
      return `<button class="isl ${here ? 'here' : ''} ${lock ? 'lock' : ''} ${I.built ? 'built' : ''}" style="left:${I.x}%;top:${I.y}%" data-do="isl:${I.id}">${here ? '<i class="you">⚑ YOU</i>' : ''}${q ? '<i class="qm">!</i>' : ''}<span>${I.name}<small>${lock ? '🔒 Lv.' + I.lvl : 'Lv.' + I.lvl + '+'}</small></span></button>`; }).join('');
    el.classList.add('chart'); el.innerHTML = `<canvas id="chartCv"></canvas>` + dots + `<div class="legend"><span><i class="lg here"></i>You</span><span><i class="qm">!</i>Quest</span><span>🔒 Level locked</span><span>⛵ Ship tier: ${shipOf(S) ? shipOf(S).tier : '—'}</span></div>`;
    const cv = $('#chartCv'); const draw = () => drawChart(cv, { S, islands: ISLANDS, seas: SEAS, questIsl }); requestAnimationFrame(draw); this._chartDraw = () => { if (this.modal === 'map' && cv.isConnected) draw(); };
  }
  crewHtml() { const n = this.g.net; const st = n.status;
    if (st === 'online') return `<h3>🏴‍☠️ Crew ${n.room} · ${n.peers.size + 1}/${MAX_CREW} online</h3><div class="qlist"><div class="gold">${esc(this.g.save.name)} (you)</div>${[...n.peers.values()].map(p => `<div>${esc(p.name)} · Lv.${p.lvl} · ${p.island === '~sea' ? '⛵ at sea' : p.island ? islandById(p.island)?.name || '' : ''}${p.st && STYLES[p.st] ? ' · ' + STYLES[p.st].icon : ''}${p.island === this.g.island.id ? ` <button data-do="ptr:${p.id}">⚖ Trade</button>` : ''}</div>`).join('')}</div>
      <div class="crewcode">CREW CODE <b>${n.room}</b></div><p class="dim">Invite friends: they open <b>${STABLE_URL.replace('https://', '')}</b> and type your code in <b>Join crew by code</b>, or just send them the invite link below.</p><div class="linkbox"><input readonly id="crewLink" value="${n.link()}"><button data-do="copylink">${navigator.share ? 'Share invite' : 'Copy invite'}</button></div>
      <div class="seg chatq">${['Hi! 👋', 'Follow me!', 'Help!', 'Boss time!', 'GG 🎉'].map(c => `<button data-do="say:${c}">${c}</button>`).join('')}</div><button data-do="leavecrew">Leave crew</button>`;
    const last = (() => { try { return localStorage.getItem('gldt_crew') || ''; } catch { return ''; } })();
    if (st === 'gone') return `<h3>🏴‍☠️ Crew ${n.room}</h3><p class="red">⚠ Can't reach the server. Open <a href="${STABLE_URL}" target="_blank" rel="noopener">${STABLE_URL.replace('https://', '')}</a>, then join crew <b>${n.room}</b> again. Your progress is saved.</p><button data-do="leavecrew">Stop trying</button>`;
    return `<h3>🏴‍☠️ Play with friends</h3><p class="dim">${st === 'connecting' ? 'Connecting…' : st === 'reconnecting' ? `🔌 Reconnecting to crew ${n.room}…` : st === 'offline' ? '⚠ The co-op server is offline on this host (it needs <b>node server/server.js</b>). Solo play still works.' : st === 'lost' ? 'Connection lost.' : 'Create a crew and share the CREW CODE with friends. You will see each other, chat, and beat enemies together.'}</p><button class="go" data-do="crew">Create crew</button>
      <h3>Join crew by code</h3><div class="linkbox"><input id="joinCode2" maxlength="8" autocapitalize="characters" autocomplete="off" placeholder="CREW CODE" value="${esc(last)}" style="text-transform:uppercase;letter-spacing:3px"><button data-do="joincode">Join</button></div>`; }
  netStatus() { if (this.modal === 'pause') { const el = document.getElementById('crewBox'); if (el) el.innerHTML = this.crewHtml(); } const b = document.getElementById('netDot'); if (b) { b.className = this.g.net.status; b.textContent = this.g.net.status === 'online' ? `👥 ${this.g.net.peers.size + 1}` : this.g.net.status === 'reconnecting' ? '🔌…' : ''; }
    { let gb = document.getElementById('netGone'); const gone = this.g.net.status === 'gone'; if (gone && !gb) { gb = document.createElement('div'); gb.id = 'netGone'; document.body.appendChild(gb); } if (gb) { gb.style.display = gone ? '' : 'none'; if (gone) gb.innerHTML = `⚠ Can't reach the server — open <a href="${STABLE_URL}" target="_blank" rel="noopener">${STABLE_URL.replace('https://', '')}</a> to rejoin crew <b>${this.g.net.room}</b> <button onclick="this.parentNode.style.display='none'">✕</button>`; } } }
  pauseHtml() { return `<h2>Paused</h2><div class="pause"><button class="go" data-close2>Resume</button><div id="crewBox">${this.crewHtml()}</div><h3>Sound</h3><div class="snd">${(() => { const A = window.__audio; const s = A ? A.set : { music: 0.5, sfx: 0.8, mute: false }; return `<label>🎵 Music <input type="range" min="0" max="100" value="${Math.round(s.music * 100)}" data-vol="music"></label><label>🔊 Effects <input type="range" min="0" max="100" value="${Math.round(s.sfx * 100)}" data-vol="sfx"></label><button data-do="mute" class="${s.mute ? 'on' : ''}">${s.mute ? '🔇 Muted' : '🔈 Mute'}</button>`; })()}</div><h3>Graphics quality</h3><div class="seg"><button data-do="q:auto" class="${Q.auto ? 'on' : ''}">AUTO${Q.auto ? ' (' + Q.level + ')' : ''}</button>${['low', 'med', 'high'].map(q => `<button data-do="q:${q}" class="${!Q.auto && Q.level === q ? 'on' : ''}">${q.toUpperCase()}</button>`).join('')}</div>
    <h3>Cloud save</h3><div class="cloudst" id="cloudSt">${CL.statusText()}</div>${CL.cloud.key ? `<div class="seg"><button data-do="cloudsync">☁ Sync now</button></div>` : `<p class="dim small">Pick a 4-digit PIN to load ${this.g.save ? esc2(this.g.save.name) + ' (' + this.g.save.race + ')' : 'this pirate'} on any phone or PC.</p><div class="seg"><input id="cloudPin" inputmode="numeric" pattern="[0-9]*" maxlength="4" type="password" placeholder="PIN" style="width:90px"><button data-do="cloudon">☁ Turn on</button></div>`}
    <h3>Look sensitivity</h3><input type="range" id="sens" min="0.3" max="2.5" step="0.1" value="${IN.sens}"><div class="seg" style="margin-top:6px"><button data-do="invy" class="${IN.invY ? 'on' : ''}">↕ Invert look ${IN.invY ? 'ON' : 'OFF'}</button><button data-do="camreset">🎥 Reset camera</button><button data-do="camtp">${this.g.tpv && this.g.tpv.on ? '👁 First-person' : '🎥 Third-person'}</button></div>
    <h3>Controls</h3><div class="help">${isTouch ? 'Left side: drag to move · Right side: drag to look · Buttons: attack, jump, dash, block, moves 1-4, special, talk. Swap weapon slots at the bottom.' : 'WASD move · Mouse look (click to lock) · Left click attack · Right click / C block · Space jump · Shift dash · 1-4 moves · Q special · E talk · G or mouse wheel swap weapon · I inventory · M map · Esc pause'}</div>
    <button data-do="title">Save & return to title</button><button class="danger" data-do="wipe">Delete save & start over</button></div>`; }
  bindPause() { const s = $('#sens'); if (s) s.oninput = () => { IN.sens = parseFloat(s.value); localStorage.setItem('gldt_sens', s.value); }; const r = document.querySelector('[data-close2]'); if (r) r.onclick = () => this.close(); }
  act(cmd, btn) {
    const g = this.g, S = g.save; const [a, b, c] = cmd.split(':');
    if (a === 'rbuy') { const isl = S.island, w = FS.windowId(); const o = FS.stockFor(isl, w)[+b]; const key = isl + ':' + w; S.fsold = S.fsold || {}; const sold = S.fsold[key] = S.fsold[key] || [];
      if (sold.includes(o.slot)) return; if (S.ber < o.price) { this.toast('Not enough Berries!', 'blk'); return; } S.ber -= o.price; sold.push(o.slot); S.inv.fruits.push(o.id); for (const k of Object.keys(S.fsold)) if (!k.endsWith(':' + w)) delete S.fsold[k];
      g.net.send({ t: 'shop', i: isl, w, s: o.slot, f: o.id }); ST.save(S); this.updateHud(); this.toast(`Bought ${FRUITS[o.id].name}! It's in your bag.`, o.rar >= 5 ? 'rare' : 'item'); if (o.rar >= 6) this.banner(RARITY[o.rar].toUpperCase() + ' FRUIT!', FRUITS[o.id].name); this.open('shop', 'rot'); return; }
    if (a === 'buy') { const d = DEF[b][c]; const fr = ST.factionRank(S); const price = Math.round(d.price * (fr.marine ? 1 - fr.tier * 0.02 : 1)); if (S.ber < price) { this.toast('Not enough Berries!', 'blk'); return; } S.ber -= price; if (price < d.price) this.toast(`⚓ Marine discount: saved ฿${fmt(d.price - price)}`, 'item'); S.inv[KIND[b]].push(c);
      if (b === 'sword' && !S.eq.sword) { S.eq.sword = c; S.slot = 'sword'; } if (b === 'gun' && !S.eq.gun) S.eq.gun = c; if (b === 'wear' && S.eq.wear.length < 3) S.eq.wear.push(c);
      this.toast(`Bought ${d.name}!`, 'item'); g.refreshEquip(); ST.save(S); this.open('shop', this.shopId); }
    if (a === 'equip') { if (b === 'wear') { const i = S.eq.wear.indexOf(c); if (i >= 0) S.eq.wear.splice(i, 1); else { if (S.eq.wear.length >= 3) S.eq.wear.shift(); S.eq.wear.push(c); } } else { S.eq[b] = S.eq[b] === c ? null : c; if (S.eq[b]) S.slot = b; }
      g.refreshEquip(); ST.save(S); this.open('inv', 'gear'); }
    if (a === 'eat') { const id = S.inv.fruits.splice(+b, 1)[0]; if (S.eq.fruit) this.toast(`Your ${FRUITS[S.eq.fruit].short} power fades...`, 'blk'); S.eq.fruit = id; S.slot = 'fruit'; g.refreshEquip(); ST.save(S); this.close(); this.banner(`${FRUITS[id].name.toUpperCase()}`, 'You ate a Devil Fruit! Switch to the Fruit slot to use it.'); g.fx.burst(g.p.pos.clone().setY(g.p.pos.y + 1.2), 60, FRUITS[id].col[0], { speed: 6, life: 1 }); }
    if (a === 'invtab') this.open('inv', b);
    if (a === 'mute') { const A = window.__audio; if (A) { A.set.mute = !A.set.mute; A.save(); btn && (btn.textContent = A.set.mute ? '🔇 Muted' : '🔈 Mute', btn.classList.toggle('on', A.set.mute)); } }
    if (a === 'crewhire') { const err = hire(g, b); if (err) this.toast(err, 'blk'); else { this.toast(`🤝 ${S.crew[S.crew.length - 1].name} joined your crew!`, 'quest'); this.updateHud(); } this.open('inv', 'crew'); }
    if (a === 'crewdis') { dismiss(g, +b); this.open('inv', 'crew'); }
    if (a === 'exp') { const n = exportStats(S, b); this.toast(`⬇ Exported ${b.toUpperCase()} (${Math.round(n / 1024) || 1} KB)`, 'item'); }
    if (a === 'fsell' || a === 'fsellall') { let ber = 0; if (a === 'fsellall') { for (const n of Object.keys(S.inv.fish || {})) ber += sellFish(this.g, n, true); } else ber = sellFish(this.g, b, false); if (ber) this.toast(`Sold for ฿${fmt(ber)}`, 'item'); this.open('inv', 'fish'); }
    if (a === 'fcook') { const r = cookFish(this.g, b); if (r) this.toast(`🍳 Cooked ${b}: +${r.heal} HP${r.fed ? ` · Well Fed +${r.fed}% DMG` : ''}`, 'item'); this.updateHud(); this.open('inv', 'fish'); }
    if (a === 'stab') this.open('style', b);
    if (a === 'dex') this.open('dex', b);
    if (a === 'dojo') this.open('dojo', b);
    if (a === 'ptr') { if (g.net.trade) { this.open('ptrade'); return; } g.net.tradeReq(+b); return; }
    if (a === 'tit') { const T = g.net.trade; if (!T) return; g.net.tradeSet(b === 'none' ? null : { k: b, id: c }); return; }
    if (a === 'tber') { const T = g.net.trade; if (!T) return; g.net.tradeSet(undefined, b === '0' ? 0 : T.mine.ber + (+b)); return; }
    if (a === 'tok') { g.net.tradeAccept(); return; }
    if (a === 'tx') { g.net.tradeEnd('cancel'); return; }
    if (a === 'stEq') { S.eq.style = b; S.slot = 'fist'; g.refreshEquip(); this.updateMoves(); this.updateHud(); ST.save(S); this.toast(`Fighting style: ${STYLES[b].name}`, 'mast'); this.open('dojo', this._dojo); }
    if (a === 'stBuy') { const st = STYLES[b]; if (st.needsHaki && S.lvl < 15) { this.toast('Learn Armament Haki first (level 15)', 'blk'); return; } if (S.ber < st.price) { this.toast('Not enough Berries!', 'blk'); return; } S.ber -= st.price; S.styles.push(b); S.eq.style = b; S.slot = 'fist'; S.stats.styles = S.styles.length; g.refreshEquip(); this.updateMoves(); this.updateHud(); ST.save(S); this.banner('NEW FIGHTING STYLE', st.name); this.open('dojo', this._dojo); }
    if (a === 'stUp') { const st = STYLES[b], r = st.req; const ok = this.styleReq(st); if (!ok.all) { this.toast('Quest not finished: ' + ok.text, 'blk'); return; } S.ber -= r.ber; S.styles.push(b); S.eq.style = b; S.slot = 'fist'; S.stats.styles = S.styles.length; g.refreshEquip(); this.updateMoves(); this.updateHud(); ST.save(S); this.close(); this.banner('STYLE UPGRADED!', `${STYLES[st.from].name} → ${st.name}`); }
    if (a === 'cosBuy') { const c = COSMETICS[b]; if (S.ber < c.price) { this.toast('Not enough Berries', 'blk'); return; } S.ber -= c.price; S.cos.push(b); S.cosEq[c.slot] = b; this.updateHud(); this.styleChanged(); this.toast(`Bought ${c.name}!`, 'rare'); this.open('style', 'shop'); }
    if (a === 'cosEq') { const c = COSMETICS[b]; if (S.cosEq[c.slot] === b) delete S.cosEq[c.slot]; else S.cosEq[c.slot] = b; this.styleChanged(); this.open('style', this._stab || 'mine'); }
    if (a === 't2') { const m = ST.mastery(S, 'sw:' + b).lvl; const cost = Math.round(SWORDS[b].dmg * 2000); const tro = Object.keys(S.inv.mats).find(k => k.endsWith('(Boss)'));
      if (m < 60 || !tro || S.ber < cost) { this.toast(`Tier II quest: ${SWORDS[b].name} mastery 60 (you: ${m}), 1 boss trophy${tro ? ' ✔' : ' ✘'}, ฿${fmt(cost)}`, 'blk'); return; }
      S.ber -= cost; S.inv.mats[tro]--; if (!S.inv.mats[tro]) delete S.inv.mats[tro]; S.t2 = S.t2 || {}; S.t2[b] = 1; g.refreshEquip(); ST.save(S); this.close(); this.banner('TIER II!', T2[b] + ' · +35% damage'); }
    if (a === 'crew') { g.net.connect(g.net.room || (new URLSearchParams(location.search).get('room')) || g.net.constructor.code()); }
    if (a === 'leavecrew') { g.net.disconnect(); const u = new URL(location.href); u.searchParams.delete('room'); history.replaceState(null, '', u.toString()); this.netStatus(); }
    if (a === 'joincode') { const c = (document.getElementById('joinCode2') || {}).value || ''; if (!validCode(c)) { this.toast('Crew codes are 4-8 letters/numbers', 'blk'); return; } g.net.connect(c.toUpperCase().trim()); }
    if (a === 'copylink') { const l = g.net.inviteText(); if (navigator.share) navigator.share({ title: "Grand Line: Devil's Tide", text: l }).catch(() => {}); else { navigator.clipboard?.writeText(l).then(() => this.toast('Invite copied! Paste it to your friends', 'item')).catch(() => { const i = document.getElementById('crewLink'); i.select(); document.execCommand('copy'); this.toast('Link copied!', 'item'); }); } }
    if (a === 'say') { g.net.chat(cmd.slice(4)); }
    if (a === 'tacc') { const o = this.offer; const [gk, gid] = o.give, [wk, wid] = o.want;
      if (wk === 'ber') { if (S.ber < wid) { this.toast('Not enough Berries', 'blk'); return; } S.ber -= wid; } else { const arr = S.inv[KIND[wk]]; const i = arr.indexOf(wid); if (i < 0) return; arr.splice(i, 1); if (S.eq[wk] === wid) S.eq[wk] = null; }
      S.inv[KIND[gk]].push(gid); this.offer = null; this.toast(`Traded! Got ${DEF[gk][gid].name}`, 'item'); g.refreshEquip(); ST.save(S); this.close(); }
    if (a === 'tnew') { const n = this.trNpc; this.offer = { who: n.fake.id, ...makeOffer(g, n.fake) }; this.open('player', n); }
    if (a === 'tdec') { this.offer = null; this.close(); }
    if (a === 'forge') { if (!['wado', 'sandai', 'shusui'].every(n => S.inv.swords.includes(n))) return; S.inv.swords.push('sanbon'); S.eq.sword = 'sanbon'; S.slot = 'sword'; g.refreshEquip(); ST.save(S); this.close(); this.banner('THREE SWORD STYLE!', 'Forged from Wado Ichimonji, Sandai Kitetsu and Shusui'); }
    if (a === 'awaken') { const f = FRUITS[S.eq.fruit]; const cost = this.awakenCost(f); if (S.ber < cost) { this.toast('Not enough Berries', 'blk'); return; } S.ber -= cost; S.awake = S.awake || {}; S.awake[S.eq.fruit] = true; ST.save(S); this.close(); this.banner('AWAKENED!', `${f.name}: all moves +50% damage`); g.fx.burst(g.p.pos.clone().setY(g.p.pos.y + 1), 80, f.col[0], { speed: 9, life: 1.2 }); g.fx.ring(g.p.pos.clone().setY(g.p.pos.y + 0.2), f.col[0], 10, 1); g.updateMovesSoon = true; this.updateMoves(); }
    if (a === 'qtake') { const q = (QUESTS[S.island] || []).find(q => q.id === b); S.quest = { ...q, have: q.type === 'mat' ? Math.min(q.n - 1, S.inv.mats[q.target] || 0) : 0 }; if (q.time && q.type === 'talk') S.quest.until = this.g.t + q.time; if (q.type === 'gather') this.toast('Look for the glowing beams of light!', 'quest'); if (q.time) this.toast(`⏱ The timer starts on your first defeat!`, 'quest'); this.updateQuest(); this.toast('Quest accepted: ' + q.text, 'quest'); ST.save(S); this.close(); }
    if (a === 'qdrop') { S.quest = null; this.updateQuest(); this.close(); }
    if (a === 'hbuy') { S.hakiT = S.hakiT || {}; const t = S.hakiT[b] || 0; if (t < 1 || t >= 4 || hakiPoints(S) < 1 || S.lvl < hakiTierLvl(b, t)) return; S.hakiT[b] = t + 1; ST.save(S); this.g.st = ST.stats(S); this.banner('HAKI AWAKENS', HAKI_TREE[b][t][0]); this.open('inv', 'haki'); return; }
    if (a === 'buyship') { const D = SHIPS[b]; migrateShips(S); if (S.lvl < D.lvl) { this.toast(`Reach level ${D.lvl}`, 'blk'); return; } if (S.ber < D.price) { this.toast('Not enough Berries!', 'blk'); return; } S.ber -= D.price; S.ships.push(b); S.ship = b; S.boat = true; if (g.island.boat) g.island.boat.visible = true; ST.save(S); this.updateHud(); this.banner('NEW SHIP!', D.name); this.open('dock', this.g.nearestNpc() || { name: 'Shipwright' }); return; }
    if (a === 'useship') { S.ship = b; ST.save(S); this.toast(`Now sailing the ${SHIPS[b].name}`, 'item'); this.open('dock', this.g.nearestNpc() || { name: 'Shipwright' }); return; }
    if (a === 'buyboat') { if (S.ber < 500) { this.toast('Not enough Berries! Defeat bandits to earn more.', 'blk'); return; } S.ber -= 500; S.boat = true; if (g.island.boat) g.island.boat.visible = true; ST.save(S); this.banner('YOU GOT A BOAT!', 'Open the Sea Chart to set sail'); this.open('dock', this.g.nearestNpc()); }
    if (a === 'openmap') this.open('map');
    if (a === 'trade' && TRADES[+b].secret) { const m = S.inv.mats; const tro = Object.keys(m).filter(k => ['Energy Steroid (Boss)', 'Smiley Gas Vial (Boss)', 'SMILE Fruit Seed (Boss)', 'Mink Fur (Boss)'].includes(k)); if (tro.length < 3) { this.toast('Need 3 different Second Sea boss trophies', 'blk'); return; } tro.slice(0, 3).forEach(k => { m[k]--; if (!m[k]) delete m[k]; }); S.secrets = S.secrets || {}; S.secrets.mirro = 1; ST.save(S); this.close(); this.banner('SECRET UNLOCKED', 'Mirro-World has appeared on your World Map!'); return; }
    if (a === 'trade') { const t = TRADES[+b]; const m = S.inv.mats; if (!Object.entries(t.give).every(([k, v]) => (m[k] || 0) >= v)) { this.toast('Not enough materials', 'blk'); return; }
      for (const [k, v] of Object.entries(t.give)) { m[k] -= v; if (!m[k]) delete m[k]; } if (t.get.ber) g.addBerries(t.get.ber); if (t.get.wear) S.inv.wear.push(t.get.wear); if (t.get.fruit) S.inv.fruits.push(t.get.fruit); this.toast('Traded for ' + t.label, 'item'); ST.save(S); this.open('trader', this.trNpc); }
    if (a === 'isl') { const I = islandById(b); const info = $('#mapInfo'); const sea = SEAS.find(s => s.id === I.sea);
      if (I.secret && !(S.secrets || {})[I.id]) { info.innerHTML = `<b>??? — a hidden place</b> <em class="red">Secret quest: ${I.secret}</em>`; return; }
      let html = `<b>${I.name}</b> · ${sea.name} · Lv.${I.lvl}+ `;
      if (I.id === S.island) html += '<em>You are here</em>'; else if (S.lvl < I.lvl) html += `<em class="red">🔒 Reach level ${I.lvl}</em>`; else if (!I.built) html += '<em>Coming in a future update</em>'; else if ((migrateShips(S), !S.ship)) html += '<em class="red">Buy a ship from a Shipwright at the dock first</em>'; else if (shipOf(S).tier < seaTier(I.sea)) html += `<em class="red">🚢 Needs a Tier ${seaTier(I.sea)} ship (yours: Tier ${shipOf(S).tier}) — visit a Shipwright</em>`; else html += `<button class="go" data-do="sail:${I.id}">⛵ Set Sail</button>`;
      info.innerHTML = html; }
    if (a === 'sail') { migrateShips(S); const I = islandById(b); if (!S.ship || shipOf(S).tier < seaTier(I.sea)) { this.toast('Your ship can\'t make that voyage', 'blk'); return; } this.close(); this.onSail && this.onSail(b); }
    if (a === 'q') { qset(b); this.open('pause'); }
    if (a === 'invy') { IN.invY = !IN.invY; localStorage.setItem('gldt_invy', IN.invY ? '1' : '0'); this.open('pause'); return; }
    if (a === 'camreset') { this.g.resetCamera(); this.close(); return; }
    if (a === 'camtp') { this.g.tpv.toggle(); this.open('pause'); return; }
    if (a === 'cloudsync') { CL.push(S).then(() => { const el = $('#cloudSt'); if (el) el.textContent = CL.statusText(); }); return; }
    if (a === 'cloudon') { const pin = ($('#cloudPin') || {}).value || ''; if (!CL.validPin(pin)) { this.toast('PIN must be 4 digits', 'blk'); return; } const el = $('#cloudSt'); el.textContent = '☁ Connecting…';
      CL.login(S.name, S.race, pin, S).then(j => { if (j.exists) { const pk = CL.pickNewest(S, j); if (pk.from === 'cloud') { localStorage.setItem('gldt_save_v1', JSON.stringify(pk.save)); this.toast('☁ Newer progress found in the cloud — loading it', 'item'); setTimeout(() => location.reload(), 1200); return; } CL.push(S); }
        this.toast('☁ Cloud save on — log in anywhere with name, race & PIN', 'item'); this.open('pause'); }).catch(e => { el.textContent = '☁ ' + (e.code === 429 ? e.message : 'Save server unreachable — try again later'); }); return; }
    if (a === 'title') { ST.save(S); location.reload(); }
    if (a === 'wipe') { if (confirm('Delete your save and start over?')) { ST.wipe(); location.reload(); } }
  }
}
