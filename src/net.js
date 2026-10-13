import { remoteAwake } from './awaken.js';
import { makeMount, animMount, emitTrail } from './travel.js';
// Co-op multiplayer client (WebSocket relay in server/server.js)
import { THREE, setOutlinesVisible } from './engine.js';
import { makeChar, animChar, makeAvatar } from './models.js';
import { STYLES } from './styles.js';
import { islandById, FRUITS } from './data.js';
import * as ST from './state.js';
import { migrateShips, shipOf, seaTier } from './ships.js';
import { remoteMove } from './themed.js';
import { remoteWeapon } from './canonw.js';
export const MAX_CREW = 5;
export const PLAY_URL = 'https://grand-line-devils-tide.onrender.com'; // permanent home of the game (Render)
export const STABLE_URL = PLAY_URL; // kept for older references
export const validCode = c => /^[A-Z0-9]{4,8}$/.test(String(c || '').toUpperCase().trim());
const B = THREE;
export class Net {
  constructor(g) { this.g = g; this.ws = null; this.peers = new Map(); this.room = null; this.sendT = 0; this.status = 'off'; this.myId = 0; }
  static code() { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 5; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
  link() { return `${PLAY_URL}/?room=${this.room}`; }
  inviteText() { return `Join my pirate crew in Grand Line: Devil's Tide! 🏴‍☠️\nCREW CODE: ${this.room}\nTap to join: ${this.link()}\n(Or open ${PLAY_URL} and enter the code in "Join crew by code".)`; }
  connect(room, retry) {
    if (!retry) { this.disconnect(); this.tries = 0; } else if (this.ws) { const w = this.ws; this.ws = null; try { w.close(); } catch {} }
    clearTimeout(this.rt); this.manual = false; this.room = String(room).toUpperCase().trim(); try { localStorage.setItem('gldt_crew', this.room); } catch {} this.status = retry ? 'reconnecting' : 'connecting'; this.g.ui.netStatus();
    const u = new URL(location.href); u.searchParams.set('room', this.room); u.searchParams.delete('skip'); u.searchParams.delete('anytap'); history.replaceState(null, '', u.toString());
    let ws; try { ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws?room=${encodeURIComponent(this.room)}`); } catch (e) { this.status = 'offline'; this.g.ui.netStatus(); return; }
    this.ws = ws; const S = this.g.save; if (this.g.hunt) this.g.hunt.net = null;
    ws.onopen = () => { ws.send(JSON.stringify({ t: 'hello', name: S.name, faction: S.faction, race: S.race, lvl: S.lvl, island: S.island, look: S.look, cos: S.cosEq, st: (S.eq && S.eq.style) || 'brawler' })); };
    ws.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch { return; } this.on(m); };
    ws.onclose = () => { if (this.ws !== ws) return; const was = this.status; this.clearPeers(); if (!this.manual && (was === 'online' || was === 'reconnecting' || was === 'gone')) { this.reconnect(); return; } this.status = was === 'online' ? 'lost' : 'offline'; this.g.ui.netStatus(); };
    ws.onerror = () => {};
  }
  // auto-reconnect with backoff; if the host itself is gone (tunnel URL rotated) tell the player where to find the new link
  async reconnect() { this.tries = (this.tries || 0) + 1; this.status = this.status === 'gone' ? 'gone' : 'reconnecting'; this.g.ui.netStatus();
    let alive = false; try { const r = await fetch('/health', { cache: 'no-store', signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined }); alive = r.ok && (await r.text()).trim() === 'ok'; } catch {}
    if (this.manual) return;
    if (!alive) { this.dead = (this.dead || 0) + 1; if (this.dead >= 4 && this.status !== 'gone') { this.status = 'gone'; this.g.ui.netStatus(); this.g.ui.toast(`⚠ Can't reach the server — open ${PLAY_URL.replace('https://', '')} to rejoin (crew code ${this.room})`, 'blk'); } }
    else this.dead = 0;
    const wait = this.status === 'gone' ? 20000 : [1000, 2000, 3000, 5000, 8000, 13000][Math.min(5, this.tries - 1)];
    this.rt = setTimeout(() => { if (!this.manual && this.room) { if (alive || this.status === 'gone') this.connect(this.room, true); else this.reconnect(); } }, wait); }
  disconnect() { this.manual = true; clearTimeout(this.rt); if (this.ws) { const w = this.ws; this.ws = null; try { w.close(); } catch {} } this.clearPeers(); this.status = 'off'; }
  clearPeers() { for (const p of this.peers.values()) this.dropAvatar(p); this.peers.clear(); }
  send(o) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(o)); }
  on(m) {
    const g = this.g;
    if (m.t === 'welcome') { const back = this.tries > 0; this.tries = 0; this.dead = 0; this.myId = m.id; this.status = 'online'; if (back) setTimeout(() => g.ui.toast('🔌 Reconnected to your crew!', 'quest'), 50); for (const p of m.peers) this.peers.set(p.id, { ...p, pos: new B.Vector3(), tgt: new B.Vector3(), yaw: 0 }); g.ui.netStatus(); g.ui.toast(`Joined crew ${m.room} · ${m.peers.length + 1} online`, 'quest'); }
    else if (m.t === 'full') { g.ui.toast('That crew is full (5 pirates max)', 'blk'); }
    else if (m.t === 'join') { this.peers.set(m.id, { ...m, pos: new B.Vector3(), tgt: new B.Vector3(), yaw: 0 }); g.ui.toast(`${m.name} joined your crew!`, 'quest'); g.ui.netStatus(); }
    else if (m.t === 'look') { const p = this.peers.get(m.id); if (p) { p.look = m.look; p.cos = m.cos; this.dropAvatar(p); } }
    else if (m.t === 'leave') { const p = this.peers.get(m.id); if (p && this.trade && this.trade.peer === m.id) this.tradeEnd('left'); if (p) { g.ui.toast(`${p.name} left`, 'blk'); this.dropAvatar(p); this.peers.delete(m.id); g.ui.netStatus(); } }
    else if (m.t === 's') { const p = this.peers.get(m.id); if (!p) return; p.island = m.i; p.lvl = m.l; p.hp = m.h; p.a = m.a; p.m = m.m | 0; p.st = m.st; p.w = m.w; p.tv = m.tv || 0; const [x, y, z, yaw] = m.p; p.tgt.set(x, y, z); p.yaw = yaw; if (!p.seen) { p.pos.copy(p.tgt); p.seen = true; } }
    else if (m.t === 'chat') { g.ui.chat('🏴 ' + m.name, m.msg); }
    else if (m.t === 'hit') { if (m.i !== g.island.id) return; const e = g.enemies[m.e]; if (e && !e.dead) g.damageEnemy(e, m.d, { remote: true, kb: 0.5 }); }
    else if (m.t === 'sail') { const p = this.peers.get(m.id); if (!p) return; p.sailing = { to: m.to, t: performance.now() }; this.dropAvatar(p); p.island = '~sea';
      if (g.ui.onCrewSail) g.ui.onCrewSail(p, m.to);
      if (m.from === g.island.id && this.g.running && !this.g.cut) this.sailInvite(p, m.to); }
    else if (m.t === 'shop') { const p = this.peers.get(m.id); const S = g.save; const key = m.i + ':' + m.w; S.fsold = S.fsold || {}; const sold = S.fsold[key] = S.fsold[key] || []; if (!sold.includes(m.s)) sold.push(m.s);
      if (m.i === g.island.id && p) g.ui.toast(`🍎 ${p.name} bought the ${(FRUITS[m.f] ? FRUITS[m.f].name : m.f)} from the Fruit Dealer!`, 'quest'); if (g.ui.modal === 'shop') g.ui.open('shop', 'rot'); }
    else if (m.t === 'tr') this.onTrade(m);
    else if (m.t && m.t.startsWith('sf')) g.hunt && g.hunt.onNet(m);
    else if (m.t === 'fx') { const p = this.peers.get(m.id); if (!p || !p.av) return; const at = new B.Vector3(...m.p); if (m.k === 'atk') { p.atkT = 1; const st = STYLES[p.st]; if (st && st.id !== 'brawler' && (!p.w || p.w === 'fist')) { const R = p.av.root; const hp = R.position.clone().add(new B.Vector3(Math.sin(R.rotation.y) * 0.7, p.av.height * 0.62, Math.cos(R.rotation.y) * 0.7)); g.fx.burst(hp, 8, st.col, { speed: 3, size: 0.3, life: 0.3, grav: 0 }); } } else if (typeof m.k === 'string' && m.k.startsWith('mw:')) { if (p.island === undefined || p.island === g.island.id) remoteWeapon(g, p, m.k, at); } else if (typeof m.k === 'string' && m.k.startsWith('aw:')) { if (p.island === undefined || p.island === g.island.id) remoteAwake(g, p, m.k, at); } else if (typeof m.k === 'string' && m.k.startsWith('mv:')) { if (p.island === undefined || p.island === g.island.id) remoteMove(g, p, m.k, at); } else { g.fx.burst(at, 20, m.c, { speed: 6, size: 0.5, life: 0.5 }); g.fx.ring(at, m.c, 4, 0.4); p.atkT = 1; } }
  }
  dropAvatar(p) { if (p.av) { p.av.root.removeFromParent(); p.av = null; } if (p.tag) { p.tag.remove(); p.tag = null; } if (p.mount) { p.mount.removeFromParent(); p.mount = null; p.tvK = 0; } }
  hit(e, dmg) { if (!this.ws || e.ext || e.temp) return; const i = this.g.enemies.indexOf(e); if (i >= 0) this.send({ t: 'hit', i: this.g.island.id, e: i, d: Math.round(dmg) }); }
  fx(k, c, pos) { this.send({ t: 'fx', k, c, p: pos ? [pos.x, pos.y, pos.z] : [0, 0, 0] }); }
  lookChanged() { const S = this.g.save; this.send({ t: 'look', look: S.look, cos: S.cosEq }); }
  chat(msg) { this.send({ t: 'chat', msg }); this.g.ui.chat('You', msg); }
  // ---------- sailing together ----------
  sailStart(to, from) { this.send({ t: 'sail', to, from }); }
  sailInvite(p, to) { const S = this.g.save, I = islandById(to); migrateShips(S); if (!I || !S.ship || shipOf(S).tier < seaTier(I.sea) || S.lvl < (I.lvl || 0) || (I.secret && !(S.unlocked || []).includes(to))) { this.g.ui.toast(`⛵ ${p.name} set sail for ${I ? I.name : to}`, 'quest'); return; }
    const el = document.getElementById('sailInv'); el.innerHTML = `<b>⛵ ${p.name}</b> is setting sail for <b>${I.name}</b>!<button>Sail together</button><i>✕</i>`; el.style.display = 'flex'; clearTimeout(this._siT); this._siT = setTimeout(() => el.style.display = 'none', 14000);
    el.querySelector('button').onclick = () => { el.style.display = 'none'; this.g.ui.close(true); this.g.ui.onSail && this.g.ui.onSail(to); }; el.querySelector('i').onclick = () => el.style.display = 'none'; }
  sailMates(to) { const now = performance.now(); return [...this.peers.values()].filter(p => p.sailing && p.sailing.to === to && now - p.sailing.t < 20000); }
  // ---------- live trading between real players ----------
  peersHere() { return [...this.peers.values()].filter(p => p.island === this.g.island.id); }
  sig(T) { const a = [this.myId, T.mine], b = [T.peer, T.theirs]; const [x, y] = a[0] < b[0] ? [a, b] : [b, a]; const s = JSON.stringify([x[1], y[1]]); let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  tradeReq(id) { const p = this.peers.get(id); if (!p) return; this.trade = { peer: id, name: p.name, mine: { it: null, ber: 0 }, theirs: { it: null, ber: 0 }, accMe: false, accThem: false, open: false, wait: true }; this.send({ t: 'tr', to: id, k: 'req' }); this.g.ui.open('ptrade'); }
  tradeSet(it, ber) { const T = this.trade; if (!T) return; if (it !== undefined) T.mine.it = it; if (ber !== undefined) T.mine.ber = Math.max(0, Math.min(this.g.save.ber, ber)); T.accMe = T.accThem = false; this.send({ t: 'tr', to: T.peer, k: 'set', it: T.mine.it, ber: T.mine.ber }); this.g.ui.refreshTrade(); }
  tradeAccept() { const T = this.trade; if (!T || !T.open) return; if (!this.has(T.mine)) { this.g.ui.toast("You don't have that anymore", 'blk'); return; } T.accMe = true; T.sigMe = this.sig(T); this.send({ t: 'tr', to: T.peer, k: 'acc', n: T.sigMe }); this.tryFinish(); this.g.ui.refreshTrade(); }
  tradeEnd(why, quiet) { const T = this.trade; if (!T) return; if (!quiet && why !== 'left' && why !== 'done') this.send({ t: 'tr', to: T.peer, k: 'x' }); this.trade = null; if (why !== 'done') this.g.ui.toast(why === 'left' ? 'Trade cancelled: player left' : why === 'declined' ? `${T.name} declined the trade` : 'Trade cancelled', 'blk'); if (this.g.ui.modal === 'ptrade') this.g.ui.close(true); }
  has(o) { const S = this.g.save; if (o.ber > S.ber) return false; if (!o.it) return true; const L = { fruit: S.inv.fruits, sword: S.inv.swords, gun: S.inv.guns, wear: S.inv.wear }[o.it.k]; return !!L && L.includes(o.it.id); }
  tryFinish() { const T = this.trade; if (!T || !T.accMe || !T.accThem) return; const sg = this.sig(T); if (T.sigThem !== sg || T.sigMe !== sg) { T.accMe = T.accThem = false; this.g.ui.refreshTrade(); return; }
    const S = this.g.save, g = this.g; if (!this.has(T.mine)) { this.tradeEnd('cancel'); return; }
    const L = k => ({ fruit: S.inv.fruits, sword: S.inv.swords, gun: S.inv.guns, wear: S.inv.wear }[k]);
    if (T.mine.it) { const arr = L(T.mine.it.k); arr.splice(arr.indexOf(T.mine.it.id), 1); const eqk = { fruit: 'fruit', sword: 'sword', gun: 'gun' }[T.mine.it.k]; if (eqk && S.eq[eqk] === T.mine.it.id && !arr.includes(T.mine.it.id)) { S.eq[eqk] = null; if (S.slot === eqk) S.slot = 'fist'; } if (T.mine.it.k === 'wear' && !arr.includes(T.mine.it.id)) S.eq.wear = S.eq.wear.filter(x => x !== T.mine.it.id); }
    if (T.theirs.it) L(T.theirs.it.k).push(T.theirs.it.id);
    S.ber = S.ber - T.mine.ber + T.theirs.ber; S.stats.trades = (S.stats.trades || 0) + 1; ST.save(S); g.refreshEquip(); g.ui.updateHud(); g.ui.updateMoves && g.ui.updateMoves();
    this.trade = null; if (g.ui.modal === 'ptrade') g.ui.close(true); g.ui.banner('TRADE COMPLETE', `with ${T.name}`); }
  onTrade(m) { const g = this.g, p = this.peers.get(m.id); if (!p) return; const T = this.trade;
    if (m.k === 'req') { if (T) { this.send({ t: 'tr', to: m.id, k: 'busy' }); return; } this.incoming = m.id; const el = document.getElementById('sailInv'); el.innerHTML = `<b>⚖ ${p.name}</b> wants to trade with you!<button>Open trade</button><i>✕</i>`; el.style.display = 'flex'; clearTimeout(this._siT); this._siT = setTimeout(() => { el.style.display = 'none'; }, 15000);
      el.querySelector('button').onclick = () => { el.style.display = 'none'; this.trade = { peer: m.id, name: p.name, mine: { it: null, ber: 0 }, theirs: { it: null, ber: 0 }, accMe: false, accThem: false, open: true }; this.send({ t: 'tr', to: m.id, k: 'open' }); g.ui.open('ptrade'); };
      el.querySelector('i').onclick = () => { el.style.display = 'none'; this.send({ t: 'tr', to: m.id, k: 'no' }); }; return; }
    if (!T || T.peer !== m.id) return;
    if (m.k === 'open') { T.open = true; T.wait = false; g.ui.refreshTrade(); }
    else if (m.k === 'no' || m.k === 'busy') this.tradeEnd('declined', true);
    else if (m.k === 'x') this.tradeEnd('cancel', true);
    else if (m.k === 'set') { T.theirs = { it: m.it, ber: m.ber }; T.accMe = T.accThem = false; g.ui.refreshTrade(); }
    else if (m.k === 'acc') { T.accThem = true; T.sigThem = m.n; this.tryFinish(); if (this.trade) g.ui.refreshTrade(); }
  }
  islandChanged() { if (this.trade) this.tradeEnd('cancel'); for (const p of this.peers.values()) this.dropAvatar(p); }
  update(dt) {
    if (!this.ws || this.status !== 'online') return; const g = this.g, P = g.p;
    this.sendT -= dt; if (this.sendT <= 0) { this.sendT = 0.1; this.send({ t: 's', i: g.island.id, p: [+P.pos.x.toFixed(2), +P.pos.y.toFixed(2), +P.pos.z.toFixed(2), +P.yaw.toFixed(2), +P.pitch.toFixed(2)], a: P.moving ? 1 : 0, l: g.save.lvl, h: +(g.save.hp / g.st.maxHp).toFixed(2), m: (P.swim ? 1 : 0) | (g.seaDrain && g.seaDrain() ? 2 : 0) | (g.seat ? 4 : 0) | (g.save.tf === 1 ? 8 : g.save.tf === 2 ? 16 : 0), st: g.save.eq.style || 'brawler', w: g.save.slot, tv: g.trv && g.trv.on ? g.trv.id : 0 }); }
    const v = new B.Vector3();
    for (const p of this.peers.values()) {
      const here = p.island === g.island.id && p.seen;
      if (!here) { this.dropAvatar(p); continue; }
      if (!p.av) { p.av = makeAvatar(p.faction, p.race, p.look, p.cos); g.scene.add(p.av.root); setOutlinesVisible(p.av.root); p.anim = { phase: 0 }; p.tag = document.createElement('div'); p.tag.className = 'ebar ptag'; p.tag.innerHTML = '<span></span><i><b></b></i>'; g.bars.appendChild(p.tag); }
      const R = p.av.root; const before = R.position.clone(); R.position.lerp(p.tgt, Math.min(1, dt * 10)); R.rotation.y = p.yaw + Math.PI;
      const sp = before.distanceTo(R.position) / Math.max(dt, 1e-3); p.anim.move = Math.min(1, sp / 4); p.anim.phase += dt * sp * 1.8; p.atkT = Math.max(0, (p.atkT || 0) - dt * 3); p.anim.attack = p.atkT;
      const swim = p.m & 1, drain = p.m & 2, sit = p.m & 4; { if (p.baseS == null) p.baseS = R.scale.x; const ts = p.m & 16 ? 1.45 : p.m & 8 ? 1.12 : 1; R.scale.setScalar(p.baseS * ts); } if (swim) R.position.y = p.tgt.y - 0.9 + Math.sin(g.t * 2 + p.id) * 0.05; p.anim.sit = sit ? 1 : 0;
      if (sit && g.seat && p.id < this.myId && Math.hypot(p.tgt.x - g.seat.x, p.tgt.z - g.seat.z) < 0.5) g.sitAt(); // seat conflict: lower id keeps the stool
      if (sit && g.table) R.rotation.y = Math.atan2(g.table.sp.x - R.position.x, g.table.sp.z - R.position.z);
      if (p.tv !== p.tvK) { if (p.mount) { g.scene.remove(p.mount); p.mount = null; } p.tvK = p.tv; if (p.tv) { p.mount = makeMount(p.tv); g.scene.add(p.mount); } } if (p.mount) { p.mount.position.copy(R.position); p.mount.rotation.y = R.rotation.y; animMount(p.mount, g.t, dt, sp > 1); emitTrail(g, R.position, p.tv, dt, sp > 1 ? 1.2 : 0.4); }
      if (drain && Math.random() < dt * 6) g.fx.burst(R.position.clone().add(new B.Vector3((Math.random() - 0.5), 0.9, (Math.random() - 0.5))), 2, 0xcfefff, { speed: 0.6, up: 2.2, size: 0.12, life: 0.9, grav: -1 });
      animChar(p.av, p.anim, g.t);
      v.copy(R.position); v.y += p.av.height + 0.4; v.project(g.cam); if (v.z > 1 || g.cut) { p.tag.style.display = 'none'; continue; }
      p.tag.style.display = 'block'; p.tag.style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px,${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-100%)`; p.tag.firstChild.textContent = `${STYLES[p.st] && p.st !== 'brawler' ? STYLES[p.st].icon + ' ' : ''}${p.name} Lv.${p.lvl}${p.m & 2 ? ' 🌊' : ''}${p.m & 4 ? ' ⚖' : ''}`; p.tag.classList.toggle('drain', !!(p.m & 2)); p.tag.querySelector('b').style.width = (p.hp * 100) + '%';
    }
  }
}
