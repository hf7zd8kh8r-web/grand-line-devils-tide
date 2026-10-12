// Grand Line: Devil's Tide - static file server + WebSocket co-op relay.
// Usage: npm run build && node server/server.js   (PORT env, default 8080)
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { makeProfiles } from './profiles.js';
import { sfWindow, sfLeft, reachable, rollSpawn } from '../src/fruitspawn.js';
import { FRUITS } from '../src/data.js';
const SF_DEV = process.env.FRUIT_DEV === '1';
// per-room world fruit: same spawn for every crew member, first pickup wins
function sfState(R, room, force) { const w = sfWindow(); if (!R.sf || R.sf.w !== w || force) { const lvl = Math.max(1, ...[...R.values()].map(p => (p.info && p.info.lvl) || 1)); const sp = rollSpawn(room + ':' + w + ':' + (force ? Math.random() : ''), reachable(lvl)); R.sf = { w, n: ((R.sf && R.sf.n) || 0) + 1, ...sp, by: null, until: Date.now() + sfLeft() }; } return R.sf; }
const sfMsg = (sf) => ({ t: 'sf', w: sf.w, n: sf.n, island: sf.island, fruit: sf.fruit, rar: sf.rar, seed: sf.seed, by: sf.by, left: Math.max(0, sf.until - Date.now()) });
const MAX_CREW = 5; // crew (room) cap
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.DIST_DIR ? path.resolve(process.env.DIST_DIR) : path.join(__dirname, '..', 'dist');
const profiles = makeProfiles(process.env.PROFILE_DIR || path.join(__dirname, '..', 'server-data'));
const PORT = process.env.PORT || 8080;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u === '/health') { res.writeHead(200); res.end('ok'); return; }
  if (u.startsWith('/api/profile/')) { profiles(req, res, u); return; }
  let f = path.normalize(path.join(ROOT, u === '/' ? 'index.html' : u));
  if (!f.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  if (u.endsWith('/') && u !== '/') f = path.join(f, 'index.html'); // e.g. /dash/ -> dist/dash/index.html
  else if (!path.extname(u) && fs.existsSync(path.join(f, 'index.html'))) { res.writeHead(301, { Location: u + '/' }); res.end(); return; } // /dash -> /dash/
  fs.stat(f, (err, st) => {
    if (err || !st.isFile()) { if (path.extname(u)) { res.writeHead(404, { 'Cache-Control': 'no-store' }); res.end('not found'); return; } f = path.join(ROOT, 'index.html'); }
    fs.readFile(f, (e, data) => { if (e) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': f.endsWith('.html') ? 'no-cache, no-store, must-revalidate' : (u.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache') }); res.end(data); });
  });
});
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });
const rooms = new Map(); let nextId = 1;
const cleanLook = (L) => { if (!L || typeof L !== 'object') return null; const o = {}; for (const k of ['skin', 'hairC', 'eye', 'top', 'pants']) o[k] = Math.max(0, Math.min(40, L[k] | 0)); for (const k of ['hairS', 'mouth', 'brow', 'outfit', 'hat']) o[k] = String(L[k] || '').replace(/[^a-z]/g, '').slice(0, 12); return o; };
const cleanCos = (C) => { if (!C || typeof C !== 'object') return {}; const o = {}; for (const k of ['hat', 'back', 'face', 'neck', 'extra']) if (C[k]) o[k] = String(C[k]).replace(/[^a-zA-Z]/g, '').slice(0, 16); return o; };
const clean = (s, n = 16) => String(s || '').replace(/[<>&"]/g, '').slice(0, n);
const ITEM_K = ['fruit', 'sword', 'gun', 'wear'];
const cleanItem = (it) => (it && ITEM_K.includes(it.k)) ? { k: it.k, id: String(it.id || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 24) } : null;
const num = (v, max) => Math.max(0, Math.min(max, Math.floor(+v || 0)));
wss.on('connection', (ws, req) => {
  const q = new URL(req.url, 'http://x').searchParams; const room = clean(q.get('room') || 'lobby', 12).toUpperCase();
  if (!rooms.has(room)) rooms.set(room, new Map()); const R = rooms.get(room);
  if (R.size >= MAX_CREW) { ws.send(JSON.stringify({ t: 'full' })); ws.close(); return; }
  const id = nextId++; const me = { ws, id, info: null, last: Date.now(), msgs: 0 }; R.set(id, me);
  ws.send(JSON.stringify({ t: 'welcome', id, room, peers: [...R.values()].filter(p => p.id !== id && p.info).map(p => ({ id: p.id, ...p.info })) }));
  const bc = (o, ex = id) => { const s = JSON.stringify(o); for (const p of R.values()) if (p.id !== ex && p.ws.readyState === 1) p.ws.send(s); };
  ws.on('message', raw => {
    me.msgs++; if (me.msgs > 60) return; // flood guard (per second)
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.t === 'hello') { me.info = { name: clean(m.name), faction: m.faction === 'Marine' ? 'Marine' : 'Pirate', race: clean(m.race, 10), lvl: m.lvl | 0, island: clean(m.island, 12), look: cleanLook(m.look), cos: cleanCos(m.cos), st: clean(m.st, 12) }; bc({ t: 'join', id, ...me.info }); ws.send(JSON.stringify(sfMsg(sfState(R, room)))); }
    else if (m.t === 'look') { if (me.info) { me.info.look = cleanLook(m.look); me.info.cos = cleanCos(m.cos); bc({ t: 'look', id, look: me.info.look, cos: me.info.cos }); } }
    else if (m.t === 's') { if (me.info) me.info.island = clean(m.i, 12); if (me.info) me.info.st = clean(m.st, 12); bc({ t: 's', id, i: me.info && me.info.island, p: (m.p || []).slice(0, 5).map(Number), a: m.a | 0, l: m.l | 0, h: +m.h || 0, m: m.m & 255, st: clean(m.st, 12), w: clean(m.w, 6) }); }
    else if (m.t === 'sail') bc({ t: 'sail', id, to: clean(m.to, 12), from: clean(m.from, 12) });
    else if (m.t === 'shop') bc({ t: 'shop', id, i: clean(m.i, 12), w: m.w | 0, s: num(m.s, 16), f: clean(m.f, 24) });
    else if (m.t === 'tr') { const T = R.get(m.to | 0); if (T && T.ws.readyState === 1 && T.id !== id) T.ws.send(JSON.stringify({ t: 'tr', id, k: clean(m.k, 8), it: cleanItem(m.it), ber: num(m.ber, 1e10), n: m.n | 0 })); }
    else if (m.t === 'sfget') { const sf = sfState(R, room); if (sf.by || (m.n | 0) !== sf.n) { ws.send(JSON.stringify({ t: 'sfno', n: m.n | 0, by: sf.by })); return; } sf.by = me.info ? me.info.name : 'Someone'; ws.send(JSON.stringify({ t: 'sfok', n: sf.n, fruit: sf.fruit })); bc({ t: 'sfgot', n: sf.n, id, name: sf.by, fruit: sf.fruit }); }
    else if (m.t === 'sfforce') { const local = /^(localhost|127\.|\[::1\])/.test(String(req.headers.host || '')); if (!SF_DEV && !local) return; if (m.fruit && FRUITS[m.fruit]) { const sf = sfState(R, room, true); sf.fruit = String(m.fruit); sf.rar = FRUITS[sf.fruit].rar; if (m.island) sf.island = clean(m.island, 12); } else sfState(R, room, true); bc(sfMsg(R.sf), -1); }
    else if (m.t === 'chat') bc({ t: 'chat', id, name: me.info ? me.info.name : '?', msg: clean(m.msg, 120) });
    else if (m.t === 'hit') bc({ t: 'hit', id, i: clean(m.i, 12), e: m.e | 0, d: Math.min(1e7, +m.d || 0) });
    else if (m.t === 'fx') bc({ t: 'fx', id, k: clean(m.k, 16), c: m.c | 0, p: (m.p || []).slice(0, 3).map(Number) });
  });
  ws.on('close', () => { R.delete(id); bc({ t: 'leave', id }); if (!R.size) rooms.delete(room); });
});
setInterval(() => { for (const R of rooms.values()) for (const p of R.values()) p.msgs = 0; }, 1000);
setInterval(() => { const w = sfWindow(); for (const [room, R] of rooms) if (R.sf && R.sf.w !== w) { const sf = sfState(R, room); const s = JSON.stringify(sfMsg(sf)); for (const p of R.values()) if (p.ws.readyState === 1) p.ws.send(s); } }, 5000);
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => console.log(`Grand Line: Devil's Tide on http://${HOST}:${PORT}  (co-op websocket at /ws)`));
// graceful shutdown (Render sends SIGTERM on redeploy / sleep): flush pending cloud saves first
let stopping = false;
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, async () => { if (stopping) return; stopping = true; console.log(`[server] ${sig}: flushing saves`);
  const t = setTimeout(() => process.exit(0), 25000); try { await profiles.flush(); } catch (e) { console.error('[server] flush failed', e.message); } clearTimeout(t); process.exit(0); });
