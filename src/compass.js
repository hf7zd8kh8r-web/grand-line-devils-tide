// HUD compass target: points to the tracked quest's objective (enemy pack / NPC / items / island dock), else the nearest Quest Board.
import { QUESTS, ENEMIES, islandById } from './data.js';
const near = (P, L) => { let b = null, bd = 1e9; for (const o of L) { const d = Math.hypot(o.x - P.x, o.z - P.z); if (d < bd) { bd = d; b = o; } } return b; };
const npcAt = (g, f) => near(g.p.pos, g.npcs.filter(f).map(n => ({ x: n.c.root.position.x, z: n.c.root.position.z, n })));
export function compassTarget(g) {
  const S = g.save, P = g.p.pos, I = g.island; if (!I) return null; const q = (S.quests || [])[0] || S.quest;
  if (q) { const here = (QUESTS[I.id] || []).some(x => x.id === q.id) || q.isl === I.id || (q.awaken && I.id === 'awaken');
    if (!here) { const isl = (q.isl && islandById && islandById(q.isl)) || null; const d = npcAt(g, n => n.role === 'dock'); return d ? { ...d, label: `⛵ ${isl ? isl.name : 'Set sail'}` } : null; }
    if (q.awaken && g.awk && g.awk.target) { const t = g.awk.target(); if (t) return t; }
    if (q.type === 'kill' || q.type === 'mat') { const L = g.enemies.filter(e => !e.dead && (q.type === 'kill' ? e.s.type === q.target : (ENEMIES[e.s.type] || {}).drop === q.target)).map(e => ({ x: e.c.root.position.x, z: e.c.root.position.z })); const t = near(P, L); if (t) return { ...t, label: '⚔ ' + (q.type === 'kill' ? (ENEMIES[q.target] || {}).name || 'Target' : q.target) }; }
    if (q.type === 'gather' && g.gather && g.gather.length) { const t = near(P, g.gather); if (t) return { ...t, label: '✦ ' + (q.item || 'Item') }; }
    if (q.type === 'talk') { const t = npcAt(g, n => n.name === q.target); if (t) return { ...t, label: '💬 ' + q.target }; }
    if (q.type === 'fish') { const t = npcAt(g, n => n.role === 'dock'); if (t) return { ...t, label: '🎣 Fish at the shore' }; }
    const gv = npcAt(g, n => n.name === q.giver); if (gv) return { ...gv, label: '❗ ' + q.giver }; }
  const b = npcAt(g, n => n.role === 'board'); return b ? { ...b, label: '📜 Quest Board' } : null;
}
// signed bearing (deg, + = to the right) from the camera heading to the target
export function bearing(g, t) { const y = g.p.yaw, dx = t.x - g.p.pos.x, dz = t.z - g.p.pos.z; const fx = -Math.sin(y), fz = -Math.cos(y), rx = Math.cos(y), rz = -Math.sin(y); return Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz) * 180 / Math.PI; }
