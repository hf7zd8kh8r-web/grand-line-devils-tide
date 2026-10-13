import './style.css';
import { THREE, renderer, applyQuality, Q, qset, qTick, isTouch } from './engine.js';
import * as CL from './cloud.js';
import { Cover, Creator } from './cover.js';
import { Game } from './game.js';
import { UI } from './ui.js';
import { IN, initMouse, initTouch } from './input.js';
import { RACES, ISLANDS, islandById } from './data.js';
import { makeWater, makeSky } from './world.js';
import { makeShip } from './models.js';
import { Voyage } from './voyage.js';
import { installAwaken, migrate as migrateAw } from './awaken.js';
import { migrateShips } from './ships.js';
import * as ST from './state.js';
import { defaultLook, randomLook } from './style.js';
import { rowsHtml, stepLook } from './lookui.js';
const $ = s => document.querySelector(s);
const show = (id, d = 'block') => { $(id).style.display = d; }, hide = id => { $(id).style.display = 'none'; };
applyQuality();
const params = new URLSearchParams(location.search);
let mode = 'logo', cover = null, creator = null, game = null, sail = null; const ui = new UI();
window.__g = { Q, CL, saveNow: () => game && game.save && ST.save(game.save), get game() { return game; }, get mode() { return mode; }, get sail() { return sail; }, ui, IN };
window.__forceFruit = (fruit, island) => game && game.hunt && game.hunt.force(fruit, island); // dev/test: force a world Devil Fruit spawn
window.__info = () => { const i = renderer.info.render; return { calls: i.calls, tris: i.triangles, geos: renderer.info.memory.geometries }; };
initMouse(renderer.domElement); initTouch($('#hud'));
const TIPS = ['Tip: Block (right click / BLOCK) cuts damage by 80%.', 'Tip: Dash gives you a moment of invincibility.', 'Tip: Every weapon and fruit has its own mastery. Use it to unlock moves!', 'Tip: Bosses glow red right before they strike.', 'Tip: Jump over Morgan\'s Axe Slam shockwave!', 'Tip: Higher seas need higher levels. Check the World Map (M).'];

// ---------- logo -> cover ----------
function toCover() { if (mode !== 'logo') return; mode = 'cover'; hide('#logo'); cover = new Cover(); show('#cover'); const u = cover.ultra; $('#ufName').textContent = u.name.toUpperCase(); $('#ufName').style.setProperty('--g', u.glow); $('#qBtn b').textContent = Q.auto ? 'AUTO' : Q.level.toUpperCase(); if (params.get('room')) $('#crewJoin').textContent = `🏴‍☠️ Your friend invited you to crew ${params.get('room').toUpperCase()}`; }
show('#logo', 'flex');
if (params.has('skip')) toCover(); else { setTimeout(toCover, 2600); $('#logo').addEventListener('pointerdown', toCover); }
$('#qBtn').addEventListener('pointerdown', e => { e.stopPropagation(); const n = Q.auto ? 'low' : { low: 'med', med: 'high', high: 'auto' }[Q.level]; qset(n); $('#qBtn b').textContent = n.toUpperCase(); });
{ const jc = $('#joinCode'), jb = $('#joinBox'); try { const last = localStorage.getItem('gldt_crew'); if (last && !params.get('room')) jc.value = last; } catch (_) {}
  ['pointerdown', 'touchstart', 'click'].forEach(ev => jb.addEventListener(ev, e => e.stopPropagation()));
  const join = () => { const c = jc.value.toUpperCase().trim(); if (!/^[A-Z0-9]{4,8}$/.test(c)) { $('#crewJoin').textContent = 'Crew codes are 4-8 letters/numbers'; return; } params.set('room', c); const u = new URL(location.href); u.searchParams.set('room', c); history.replaceState(null, '', u.toString()); $('#crewJoin').textContent = `🏴‍☠️ You'll join crew ${c} — now tap the fruit!`; jc.blur(); };
  $('#joinGo').addEventListener('click', join); jc.addEventListener('keydown', e => { if (e.key === 'Enter') join(); }); }
addEventListener('pointerdown', e => { if (mode === 'cover' && cover && !e.target.closest('#qBtn') && !e.target.closest('#joinBox') && (cover.hitFruit(e.clientX, e.clientY) || params.has('anytap'))) startBurst(); });
function startBurst() {
  if (!cover.burst()) return; mode = 'burst'; hide('#cover');
  const u = cover.ultra; const ft = $('#fruitTitle'); ft.style.setProperty('--g', u.glow); ft.querySelector('b').textContent = u.title; ft.querySelector('span').textContent = u.name; setTimeout(() => show('#fruitTitle', 'flex'), 500);
  setTimeout(() => { $('#white').style.opacity = 1; }, 2300);
  setTimeout(() => { hide('#fruitTitle'); toLoading(); }, 2800);
}
// ---------- loading ----------
function toLoading() {
  mode = 'loading'; show('#loading', 'flex'); $('#white').style.opacity = 0; $('.tip').textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
  const bar = $('.lbar i'), txt = $('.ltxt'); const steps = [['Calibrating Log Pose…', 15], ['Charting the East Blue…', 35], ['Raising the sails…', 60], ['Waking the bandits…', 80], ['Setting course…', 100]];
  let i = 0; const next = () => { const [t, p] = steps[i]; txt.textContent = t; bar.style.width = p + '%';
    if (i === 1) { game = new Game(ui); ui.attach(game); ui.onSail = doSail; }
    if (i === 3) { creator = new Creator(); }
    i++; if (i < steps.length) setTimeout(next, 420); else setTimeout(toCreate, 500); };
  setTimeout(next, 200);
}
// ---------- create ----------
let cfac = 'Pirate', crace = 'Human', clook = null;
function toCreate() {
  hide('#loading'); mode = 'create'; show('#create'); cover = null;
  const ex = ST.load();
  $('#cont').innerHTML = ex ? `<button class="big" id="cCont">Continue as ${esc(ex.name)} ▶</button><p>Lv.${ex.lvl} ${ex.race} ${ex.faction} · ${islandById(ex.island).name}. Or make a new character below (replaces this save).</p>` : '';
  if (ex) $('#cCont').onclick = async () => { const b = $('#cCont'); if (CL.cloud.key) { b.textContent = '☁ Checking cloud…'; try { const r = await CL.fetchSave(); const pk = CL.pickNewest(ex, r); if (pk.from === 'cloud') { ST.fixSave(pk.save); ui.toast('☁ Loaded newer progress from the cloud', 'item'); } begin(pk.save); return; } catch (e) { ui.toast('☁ Cloud offline — playing your saved progress here', 'blk'); } } begin(ex); };
  $('#lRace').innerHTML = Object.keys(RACES).map(r => `<option>${r}</option>`).join('');
  $('#cLoadBtn').onclick = () => { const bx = $('#cloudBox'); bx.style.display = bx.style.display === 'none' ? '' : 'none'; if (ex) { $('#lName').value = $('#lName').value || ex.name; $('#lRace').value = ex.race; } };
  $('#lGo').onclick = async () => { const nm = $('#lName').value.trim(), rc = $('#lRace').value, pin = $('#lPin').value.trim(); const msg = $('#lMsg');
    if (!nm || !CL.validPin(pin)) { msg.textContent = 'Enter your name, race and 4-digit PIN.'; return; } msg.textContent = '☁ Loading…';
    try { const j = await CL.login(nm, rc, pin); if (!j.exists) { CL.logout(); msg.textContent = 'No profile found with that name + race + PIN. Check them, or create a new pirate below with a PIN.'; return; }
      const local = ex && ex.name.trim().toLowerCase() === nm.toLowerCase() && ex.race === rc ? ex : null; const pk = CL.pickNewest(local, j); const sv = ST.fixSave(pk.save); begin(sv); }
    catch (e) { msg.textContent = e.code === 429 ? e.message : '☁ Can\'t reach the save server right now (' + (e.code ? e.message : 'offline') + '). Try again soon.'; } };
  $('#cRace').innerHTML = Object.keys(RACES).map(r => `<button data-v="${r}" class="${r === crace ? 'on' : ''}">${r}</button>`).join('');
  clook = clook || defaultLook(cfac, crace);
  const rows = () => { $('#cRows').innerHTML = rowsHtml(clook); };
  $('#cTabs').onclick = e => { const b = e.target.closest('button'); if (!b) return; document.querySelectorAll('#cTabs button').forEach(x => x.classList.toggle('on', x === b)); $('#cId').style.display = b.dataset.t === 'id' ? '' : 'none'; $('#cLook').style.display = b.dataset.t === 'look' ? '' : 'none'; rows(); };
  $('#cRows').onclick = e => { const b = e.target.closest('button[data-lk]'); if (!b) return; stepLook(clook, b.dataset.lk, +b.dataset.ld); rows(); creator.setLook(cfac, crace, clook); };
  $('#cRand').onclick = () => { const r = Math.random; clook = randomLook(r, cfac).look; rows(); creator.setLook(cfac, crace, clook); };
  $('#cTurn').onclick = () => { creator.spin = (creator.spin || 0) + Math.PI / 2; };
  const upd = () => { $('#cPerk').textContent = `${crace}: ${RACES[crace].perk}`; document.querySelectorAll('#cFac button').forEach(b => b.classList.toggle('on', b.dataset.v === cfac)); document.querySelectorAll('#cRace button').forEach(b => b.classList.toggle('on', b.dataset.v === crace)); creator.setLook(cfac, crace, clook); };
  $('#cFac').onclick = e => { const b = e.target.closest('button'); if (b) { cfac = b.dataset.v; upd(); } };
  $('#cRace').onclick = e => { const b = e.target.closest('button'); if (b) { crace = b.dataset.v; upd(); } };
  $('#cGo').onclick = async () => { const n = ($('#cName').value || '').trim() || 'Rookie'; const pin = ($('#cPin').value || '').trim(); const sv = ST.newSave(n.slice(0, 16), cfac, crace); sv.look = { ...clook }; sv.savedAt = Date.now();
    if (!pin) { CL.logout(); begin(sv); return; } if (!CL.validPin(pin)) { ui.toast('PIN must be exactly 4 digits (or leave it empty)', 'blk'); return; }
    const go = $('#cGo'); go.disabled = true; go.textContent = '☁ Creating profile…';
    try { const j = await CL.login(sv.name, crace, pin, sv); if (j.exists) { CL.logout(); go.disabled = false; go.textContent = 'Set Sail ▶'; ui.toast('A profile with this name + race + PIN already exists — use ☁ Load, or pick another PIN', 'blk'); return; } begin(sv); setTimeout(() => ui.toast('☁ Cloud profile created — log in anywhere with your name, race & PIN', 'item'), 2500); }
    catch (e) { CL.logout(); go.disabled = false; go.textContent = 'Set Sail ▶'; begin(sv); setTimeout(() => ui.toast('☁ Save server unreachable — playing locally. Turn on cloud save later in Menu.', 'blk'), 2500); } };
  upd();
}
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function begin(save) {
  hide('#create'); mode = 'game'; creator = null; ST.save(save);
  game.start(save); try { migrateAw(game.save); installAwaken(game); } catch (e) { console.warn('awaken', e); } ui.show(true); setTimeout(() => { const r = document.getElementById('rotHint'); if (r) { r.classList.add('bye'); setTimeout(() => r.remove(), 700); } }, 7000); IN.enabled = true; ui.updateHud(); ui.updateQuest(); ui.updateMoves();
  const room = params.get('room'); if (room) setTimeout(() => game.net.connect(room), 600);
  if (!save.stats.time) setTimeout(() => ui.toast(isTouch ? 'Drag left side to move, right side to look' : 'Click to lock the mouse · WASD to move', 'blk'), 1500);
}
// ---------- sailing ----------
function doSail(id) {
  const I = islandById(id); const S = game.save; migrateShips(S); mode = 'sail'; IN.enabled = true; ui.show(false); const el = $('#sail'); el.classList.add('voy'); show('#sail', 'flex');
  const from = game.island ? game.island.id : '';
  sail = new Voyage({ to: id, toName: I.name, toLvl: I.lvl, sea: I.sea, save: S, shipId: S.ship || 'dinghy', faction: S.faction, from, onEnd: r => endSail(r) });
  if (game.net) { game.net.sailStart(id, from); for (const p of game.net.sailMates(id)) sail.addMate(p.name, p.faction, p.id); }
}
ui.onCrewSail = (p, to) => { if (sail && sail.to === to) sail.addMate(p.name, p.faction, p.id); };
function endSail(r) { if (!sail) return; try { const S0 = game.save; S0.stats.sails = (S0.stats.sails || 0) + 1; } catch (_) {} const v = sail; sail = null; const el = $('#sail'); hide('#sail'); el.classList.remove('voy', 'vhit'); el.innerHTML = '';
  const S = game.save; v.dispose(); if (document.pointerLockElement) document.exitPointerLock();
  if (r.wrecked) { game.loadIsland(v.from || S.island, true); mode = 'game'; ui.show(true); ui.banner('SHIPWRECKED!', 'Your crew dragged the ship back to port'); S.hp = Math.max(1, Math.round((S.hp || 1) * 0.5)); }
  else { game.loadIsland(v.to, true); mode = 'game'; ui.show(true); }
  if (r.ber) game.addBerries(r.ber); if (r.xp) game.addXp(r.xp); if (r.kills) { S.stats.seaKills = (S.stats.seaKills || 0) + r.kills; ui.toast(`Voyage: ${r.kills} enemies sunk · +฿${r.ber}`, 'quest'); } ST.save(S); IN.enabled = true; }
// ---------- loop ----------
let last = performance.now();
import { audio } from './audio.js';
window.__audio = audio;
for (const ev of ['pointerdown', 'touchend', 'keydown']) addEventListener(ev, () => audio.unlock(), { capture: true, passive: true });
addEventListener('pointerdown', e => { const b = e.target.closest && e.target.closest('button,.tab,[data-do]'); if (b) audio.sfx('click'); }, { capture: true, passive: true });
let _mt = 0;
function loop(now) {
  requestAnimationFrame(loop); const raw = Math.min(1, (now - last) / 1000), dt = Math.min(0.05, raw); last = now;
  if ((_mt -= dt) <= 0) { _mt = 0.5; audio.setTheme(mode === 'sail' ? 'sail' : mode === 'game' && game ? game.musicTheme() : 'cover'); }
  if (mode === 'cover' || mode === 'burst') { cover.update(dt); cover.render(); }
  else if (mode === 'loading') { renderer.clear(); }
  else if (mode === 'create' && creator) { creator.update(dt); creator.render(); }
  else if (mode === 'game') { game.update(dt); game.render(); if (!document.hidden) qTick(raw); }
  else if (mode === 'sail' && sail) { sail.update(dt); if (sail) sail.render(renderer); }
}
requestAnimationFrame(loop);
// rotation / resize: re-layout canvas + all cameras immediately and again after iOS settles its viewport
let _lw = 0, _lh = 0;
function relayout(force) { const w = innerWidth, h = innerHeight; if (!force && w === _lw && h === _lh) return; _lw = w; _lh = h; applyQuality(); cover && cover.resize && cover.resize(); creator && creator.resize && creator.resize(); game && game.resize(); if (sail) sail.resize(); document.body.classList.toggle('land', w > h); document.body.classList.toggle('port', w <= h); }
const relayoutSoon = () => { relayout(true); requestAnimationFrame(() => relayout(true)); for (const ms of [60, 250, 600, 1200]) setTimeout(() => relayout(true), ms); };
addEventListener('resize', relayoutSoon); addEventListener('orientationchange', relayoutSoon); if (window.visualViewport) visualViewport.addEventListener('resize', relayoutSoon);
if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', relayoutSoon);
setInterval(() => relayout(false), 500); relayout(true);
document.addEventListener('visibilitychange', () => { if (document.hidden && game && game.save && mode !== 'create') { ST.save(game.save); flushCloud(); } });
// autosave every 30s; cloud sync debounced after any save; retry when back online
CL.cloud.onConflict = j => { // another device saved newer progress: adopt it, stop saving this stale copy, reload into it
  ST.lock.on = true; try { localStorage.setItem('gldt_save_v1', JSON.stringify(ST.fixSave(j.save))); } catch (_) {} ui.toast('☁ Newer progress from your other device — loading it…', 'item'); setTimeout(() => location.reload(), 2500); };
let _pt = 0; ST.saveHooks.push(S => { if (!CL.cloud.key) return; clearTimeout(_pt); _pt = setTimeout(() => CL.push(S), 4000); });
function flushCloud() { const S = game && game.save; if (!S || !CL.cloud.key || CL.cloud.blocked) return; try { const b = new Blob([JSON.stringify({ key: CL.cloud.key, ts: S.savedAt || Date.now(), save: S })], { type: 'application/json' }); if (!(navigator.sendBeacon && navigator.sendBeacon('/api/profile/save', b))) CL.push(S); } catch (_) { CL.push(S); } }
setInterval(() => { if (mode === 'game' && game && game.save && game.running !== false) ST.save(game.save); else if (CL.cloud.dirty && game && game.save) CL.push(game.save); }, 30000);
addEventListener('online', () => { if (game && game.save && CL.cloud.key) CL.push(game.save); }); addEventListener('pagehide', () => flushCloud());
// debug hooks for automated screenshots (harmless in production)
import { makeChar as _mc, animChar as _ac } from './models.js';
import { ENEMIES as _EN } from './data.js';
window.__dbg = { makeChar: _mc, animChar: _ac, ENEMIES: _EN, THREE };
