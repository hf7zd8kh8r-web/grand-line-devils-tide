// Cloud save profiles: name + race + 4-digit PIN -> hashed key. The PIN is never stored; files are named by a hash of the key.
// Storage backends:
//   default            -> local files in `dir` (server-data/ on the box)
//   PROFILE_STORE=github -> JSON files in a private GitHub repo via the Contents API (survives Render's ephemeral disk).
//                         env: GITHUB_TOKEN (repo scope), SAVES_REPO (default hf7zd8kh8r-web/grand-line-saves), SAVES_BRANCH (default main)
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function fileStore(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return {
    name: 'file:' + dir,
    async getSalt() { const f = path.join(dir, '.salt'); try { return fs.readFileSync(f, 'utf8').trim(); } catch (_) { const s = crypto.randomBytes(24).toString('hex'); fs.writeFileSync(f, s, { mode: 0o600 }); return s; } },
    async get(name) { try { return JSON.parse(fs.readFileSync(path.join(dir, name + '.json'), 'utf8')); } catch (_) { return null; } },
    async put(name, rec) { const f = path.join(dir, name + '.json'), t = f + '.' + process.pid + '.tmp'; fs.writeFileSync(t, JSON.stringify(rec)); fs.renameSync(t, f); },
    async del(name) { try { fs.unlinkSync(path.join(dir, name + '.json')); } catch (_) {} },
    async flush() {},
  };
}

export function githubStore({ token = process.env.GITHUB_TOKEN, repo = process.env.SAVES_REPO || 'hf7zd8kh8r-web/grand-line-saves', branch = process.env.SAVES_BRANCH || 'main', minGap = +(process.env.SAVE_MIN_GAP_MS || 60000) } = {}) {
  if (!token) throw new Error('PROFILE_STORE=github needs GITHUB_TOKEN');
  const api = async (method, p, body) => {
    for (let i = 0; ; i++) {
      let r; try {
        r = await fetch(`https://api.github.com/repos/${repo}/contents/${p}` + (method === 'GET' ? `?ref=${branch}` : ''), { method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'grand-line-devils-tide', 'X-GitHub-Api-Version': '2022-11-28', ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
      } catch (e) { if (i < 3) { await new Promise(s => setTimeout(s, 500 * 2 ** i)); continue; } throw e; }
      if (r.status >= 500 && i < 3) { await new Promise(s => setTimeout(s, 500 * 2 ** i)); continue; }
      return r;
    }
  };
  const getRaw = async p => { const r = await api('GET', p); if (r.status === 404) return { sha: null, text: null }; if (!r.ok) throw new Error('github get ' + r.status); const j = await r.json(); return { sha: j.sha, text: Buffer.from(j.content || '', 'base64').toString('utf8') }; };
  const putRaw = async (p, text, sha, msg) => {
    for (let i = 0; i < 4; i++) {
      const r = await api('PUT', p, { message: msg, content: Buffer.from(text).toString('base64'), branch, ...(sha ? { sha } : {}) });
      if (r.ok) return (await r.json()).content.sha;
      if (r.status === 409 || r.status === 422) { sha = (await getRaw(p)).sha; continue; } // stale sha -> refetch and retry
      throw new Error('github put ' + r.status);
    }
    throw new Error('github put conflict');
  };
  // cache: name -> { rec, sha, dirty, last, timer, busy }   (this server is the only writer, so the cache is authoritative)
  const C = new Map(); const pathOf = n => `profiles/${n}.json`;
  const load = async n => { let e = C.get(n); if (e) return e; const { sha, text } = await getRaw(pathOf(n)); e = C.get(n) || { rec: text ? JSON.parse(text) : null, sha, dirty: false, last: 0, timer: null }; C.set(n, e); if (C.size > 2000) for (const [k, v] of C) { if (C.size <= 1500) break; if (!v.dirty && !v.timer && !v.busy) C.delete(k); } return e; };
  const writeNow = async n => { const e = C.get(n); if (!e) return; clearTimeout(e.timer); e.timer = null; if (e.busy) return e.busy.then(() => writeNow(n)); if (!e.dirty) return;
    e.dirty = false; e.last = Date.now();
    e.busy = (async () => { try { if (e.rec === null) { if (e.sha) { const r = await api('DELETE', pathOf(n), { message: 'delete profile', sha: e.sha, branch }); if (!r.ok && r.status !== 404) throw new Error('github delete ' + r.status); } e.sha = null; } else e.sha = await putRaw(pathOf(n), JSON.stringify(e.rec), e.sha, 'save'); }
      catch (err) { console.error('[saves] write failed', n.slice(0, 8), err.message); e.dirty = true; schedule(n, 15000); } finally { e.busy = null; } })();
    return e.busy; };
  const schedule = (n, wait) => { const e = C.get(n); if (!e || e.timer) return; e.timer = setTimeout(() => { e.timer = null; writeNow(n); }, wait); };
  return {
    name: 'github:' + repo,
    async getSalt() { const { text } = await getRaw('salt.txt'); if (text && text.trim()) return text.trim(); const s = crypto.randomBytes(24).toString('hex'); await putRaw('salt.txt', s, null, 'init salt'); return s; },
    async get(n) { return (await load(n)).rec; },
    async put(n, rec) { const e = await load(n); const isNew = !e.sha && !e.last && !e.busy; e.rec = rec; e.dirty = true;
      if (isNew) return writeNow(n); // brand-new profile: persist right away
      schedule(n, Math.max(2000, e.last + minGap - Date.now())); },
    async del(n) { const e = await load(n); e.rec = null; e.dirty = true; return writeNow(n); },
    async flush() { await Promise.all([...C.keys()].map(n => { const e = C.get(n); return writeNow(n); })); },
  };
}

// rebirth count is clamped server-side: whole number 0..999 and at most +1 per save (no skipping ahead)
const rbOf = s => Math.max(0, Math.min(999, Math.floor(+((s && s.rebirth)) || 0)));
export function makeProfiles(dir) {
  const store = process.env.PROFILE_STORE === 'github' ? githubStore() : fileStore(dir);
  console.log('[saves] store =', store.name);
  let SALT = null; const ready = store.getSalt().then(s => { SALT = s; });
  ready.catch(e => console.error('[saves] salt load failed:', e.message));
  const H = s => crypto.createHash('sha256').update(s).digest('hex');
  const norm = s => String(s || '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 16);
  const keyOf = (name, race, pin) => H(SALT + '|' + norm(name) + '|' + String(race || '').slice(0, 12) + '|' + pin);
  const nameOf = key => H('file|' + SALT + '|' + key);
  const read = key => store.get(nameOf(key));
  const write = (key, rec) => store.put(nameOf(key), rec);
  const hits = new Map(); // per-IP rate limit for PIN logins (anti brute force)
  const limited = (ip, n, win) => { const now = Date.now(); const a = (hits.get(ip) || []).filter(t => now - t < win); a.push(now); hits.set(ip, a); return a.length > n; };
  setInterval(() => { const now = Date.now(); for (const [k, a] of hits) if (!a.some(t => now - t < 600000)) hits.delete(k); }, 300000).unref();
  const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
  function handle(req, res, u) {
    if (req.method !== 'POST') return send(res, 405, { err: 'POST only' });
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    let body = ''; let big = false;
    req.on('data', c => { body += c; if (body.length > 400000) { big = true; req.destroy(); } });
    req.on('end', async () => { if (big) return; let m; try { m = JSON.parse(body || '{}'); } catch (_) { return send(res, 400, { err: 'bad json' }); }
      try {
        await ready;
        if (u === '/api/profile/login') { // {name, race, pin, create?: {ts, save}}
          // limit per profile name+race (works even when every player shares one IP) and a looser per-IP cap
          if (limited('p|' + norm(m.name) + '|' + String(m.race || ''), 20, 600000) || limited(ip, 400, 600000)) return send(res, 429, { err: 'Too many tries — wait a few minutes.' });
          const pin = String(m.pin || ''); if (!/^\d{4}$/.test(pin) || !norm(m.name) || !m.race) return send(res, 400, { err: 'Need name, race and a 4-digit PIN' });
          const key = keyOf(m.name, m.race, pin); const rec = await read(key);
          if (rec) return send(res, 200, { key, exists: true, ts: rec.ts, save: rec.save });
          if (m.create && m.create.save) { if (typeof m.create.save === 'object') m.create.save.rebirth = rbOf(m.create.save); await write(key, { ts: +m.create.ts || Date.now(), save: m.create.save, made: Date.now() }); return send(res, 200, { key, exists: false, created: true }); }
          return send(res, 200, { key, exists: false });
        }
        if (u === '/api/profile/save') { // {key, ts, save} - newest wins
          if (limited('s' + ip, 240, 600000)) return send(res, 429, { err: 'slow down' });
          const key = String(m.key || ''); if (!/^[0-9a-f]{64}$/.test(key) || !m.save || typeof m.save !== 'object') return send(res, 400, { err: 'bad save' });
          const rec = await read(key); const ts = +m.ts || Date.now();
          if (rec && rec.ts > ts) return send(res, 200, { ok: false, newer: true, ts: rec.ts, save: rec.save });
          m.save.rebirth = Math.min(rbOf(m.save), rec ? rbOf(rec.save) + 1 : 999);
          await write(key, { ts, save: m.save, made: rec ? rec.made : Date.now() }); return send(res, 200, { ok: true, ts });
        }
        if (u === '/api/profile/load') { const key = String(m.key || ''); if (!/^[0-9a-f]{64}$/.test(key)) return send(res, 400, { err: 'bad key' }); const rec = await read(key); return send(res, 200, rec ? { ts: rec.ts, save: rec.save } : { none: true }); }
        if (u === '/api/profile/delete') { // {key} - remove a profile (used by tests / "forget me")
          const key = String(m.key || ''); if (!/^[0-9a-f]{64}$/.test(key)) return send(res, 400, { err: 'bad key' });
          if (limited('d' + ip, 30, 600000)) return send(res, 429, { err: 'slow down' });
          await store.del(nameOf(key)); return send(res, 200, { ok: true });
        }
        send(res, 404, { err: 'unknown' });
      } catch (e) { console.error('[saves]', e.message); send(res, 500, { err: 'server error' }); } });
  }
  handle.flush = () => store.flush();
  return handle;
}
