// Cloud save profiles (name + race + 4-digit PIN). localStorage stays the primary save; the server copy syncs, newest wins.
const CK = 'gldt_cloud';
export const cloud = { key: null, name: '', race: '', status: 'off', last: 0, dirty: false, blocked: false, newer: null };
try { Object.assign(cloud, JSON.parse(localStorage.getItem(CK) || '{}')); } catch (_) {}
cloud.status = cloud.key ? 'pending' : 'off'; cloud.dirty = false; cloud.blocked = false;
const keep = () => { try { localStorage.setItem(CK, JSON.stringify({ key: cloud.key, name: cloud.name, race: cloud.race, last: cloud.last })); } catch (_) {} };
async function post(path, body, ms = 8000) { const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try { const r = await fetch('/api/profile/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ac.signal, cache: 'no-store' });
    const j = await r.json().catch(() => null); if (!r.ok) { const e = new Error((j && j.err) || ('HTTP ' + r.status)); e.code = r.status; throw e; } return j; } finally { clearTimeout(t); } }
export const validPin = p => /^\d{4}$/.test(String(p || ''));
// login: returns { key, exists, ts, save }. If create is given and no profile exists, the server stores it.
export async function login(name, race, pin, create) { const j = await post('login', { name, race, pin, create: create ? { ts: create.savedAt || Date.now(), save: create } : undefined });
  cloud.key = j.key; cloud.name = name; cloud.race = race; cloud.status = 'ok'; cloud.last = Date.now(); keep(); return j; }
export function logout() { cloud.key = null; cloud.status = 'off'; keep(); }
export async function fetchSave() { if (!cloud.key) return null; const j = await post('load', { key: cloud.key }); return j && !j.none ? j : null; }
let busy = false;
export async function push(S, force) { if (!cloud.key || !S || cloud.blocked) return; if (busy) { cloud.dirty = true; return; } busy = true;
  try { const j = await post('save', { key: cloud.key, ts: S.savedAt || Date.now(), save: S });
    if (j.newer) { cloud.blocked = true; cloud.newer = j; cloud.status = 'conflict'; if (cloud.onConflict) cloud.onConflict(j); } else { cloud.status = 'ok'; cloud.last = Date.now(); cloud.dirty = false; keep(); } }
  catch (e) { cloud.status = 'offline'; cloud.dirty = true; }
  finally { busy = false; } }
export function statusText() { if (!cloud.key) return '☁ Cloud save off'; if (cloud.status === 'conflict') return '⚠ Newer progress on another device — reload to get it'; if (cloud.status === 'offline') return '☁ Offline — saved on this device, will sync'; if (!cloud.last) return '☁ Syncing…'; const s = Math.round((Date.now() - cloud.last) / 1000); return `☁ Synced ${s < 5 ? 'just now' : s < 90 ? s + 's ago' : Math.round(s / 60) + 'm ago'} · ${cloud.name} (${cloud.race})`; }
// newest of local vs cloud
export function pickNewest(local, remote) { if (!remote || !remote.save) return { save: local, from: 'local' }; if (!local) return { save: remote.save, from: 'cloud' }; return (remote.ts || 0) > (local.savedAt || 0) ? { save: remote.save, from: 'cloud' } : { save: local, from: 'local' }; }
