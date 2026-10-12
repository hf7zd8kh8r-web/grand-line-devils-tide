// Parchment nautical chart for the World Map: aged paper, rhumb lines, compass rose, sea regions, inked route, island illustrations.
import { IDEFS } from './islanddefs.js';
const hex = n => '#' + (n >>> 0).toString(16).padStart(6, '0');
function rnd(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const INK = '#4a2e14';
export function drawChart(cv, { S, islands, seas, here, questIsl }) {
  const dpr = Math.min(2, devicePixelRatio || 1); const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return; cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const r = rnd(1234); const k = Math.min(W, H) / 400; // scale factor
  // --- paper ---
  const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75); g.addColorStop(0, '#f3e2b8'); g.addColorStop(0.7, '#e2c78e'); g.addColorStop(1, '#b38a4e'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 1400; i++) { c.fillStyle = `rgba(${r() < 0.5 ? '120,80,30' : '255,250,230'},${r() * 0.07})`; const s = 1 + r() * 3; c.fillRect(r() * W, r() * H, s, s); }
  for (let i = 0; i < 7; i++) { const x = r() * W, y = r() * H, rr = (20 + r() * 50) * k; const sg = c.createRadialGradient(x, y, rr * 0.3, x, y, rr); sg.addColorStop(0, 'rgba(150,100,40,0)'); sg.addColorStop(0.85, 'rgba(150,100,40,0.10)'); sg.addColorStop(1, 'rgba(150,100,40,0)'); c.fillStyle = sg; c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill(); }
  // sea region washes + borders (First Sea bottom, Third Sea top)
  const bands = [[47, 100], [27, 47], [0, 27]];
  seas.forEach((s, i) => { const [a, b] = bands[i]; const y0 = a / 100 * H, y1 = b / 100 * H; c.fillStyle = s.col + '22'; c.fillRect(0, y0, W, y1 - y0); const locked = S.lvl < s.lvl;
    if (locked) { c.save(); c.beginPath(); c.rect(0, y0, W, y1 - y0); c.clip(); c.strokeStyle = 'rgba(74,46,20,0.18)'; c.lineWidth = 1; for (let x = -H; x < W; x += 9) { c.beginPath(); c.moveTo(x, y1); c.lineTo(x + (y1 - y0), y0); c.stroke(); } c.restore(); }
    if (i < 2) { c.strokeStyle = INK; c.globalAlpha = 0.55; c.lineWidth = 1.6; c.setLineDash([7, 5]); c.beginPath(); for (let x = 0; x <= W; x += 6) { const y = y0 + Math.sin(x * 0.04 + i) * 3; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.setLineDash([]); c.globalAlpha = 1; }
    c.save(); c.fillStyle = INK; c.globalAlpha = 0.28; c.font = `italic 900 ${Math.max(18, 34 * k)}px Georgia,serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s.name.toUpperCase().split('').join(' '), W * 0.5, (y0 + y1) / 2 + (i === 2 ? 14 * k : 0));
    c.globalAlpha = 0.6; c.font = `italic ${Math.max(9, 11 * k)}px Georgia,serif`; c.fillText(s.sub + (locked ? `  ·  sealed until Lv.${s.lvl}` : ''), W * 0.5, (y0 + y1) / 2 + (i === 2 ? 14 * k : 0) + 20 * k); c.restore(); c.textBaseline = 'alphabetic'; });
  // rhumb lines from compass rose
  const cx = W * 0.12, cy = H * 0.16, R = 42 * k;
  c.strokeStyle = 'rgba(74,46,20,0.16)'; c.lineWidth = 0.8; for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * W * 1.5, cy + Math.sin(a) * W * 1.5); c.stroke(); }
  // grid
  c.strokeStyle = 'rgba(74,46,20,0.08)'; for (let x = 0; x < W; x += W / 10) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 0; y < H; y += H / 8) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  // wave doodles
  c.strokeStyle = 'rgba(40,80,110,0.35)'; c.lineWidth = 1; for (let i = 0; i < 60; i++) { const x = r() * W, y = r() * H; c.beginPath(); for (let j = 0; j < 3; j++) c.arc(x + j * 6 * k, y, 3 * k, Math.PI, 0); c.stroke(); }
  // Red Line (vertical continent) between First and Second sea hint + Grand Line band
  c.fillStyle = 'rgba(160,60,40,0.25)'; c.fillRect(0, H * 0.27 - 2 * k, W, 4 * k); c.fillStyle = INK; c.globalAlpha = 0.6; c.font = `italic ${Math.max(8, 9 * k)}px Georgia,serif`; c.textAlign = 'right'; c.fillText('~ Red Line ~', W - 8, H * 0.27 - 5); c.globalAlpha = 1;
  // route
  const P = i => [i.x / 100 * W, i.y / 100 * H]; const route = islands.filter(i => !i.secret);
  c.strokeStyle = '#8a2a1a'; c.lineWidth = 2 * k; c.setLineDash([2 * k, 5 * k]); c.lineCap = 'round'; c.beginPath(); route.forEach((I, n) => { const [x, y] = P(I); if (!n) c.moveTo(x, y); else { const [px, py] = P(route[n - 1]); c.quadraticCurveTo((px + x) / 2 + (y - py) * 0.18, (py + y) / 2 - (x - px) * 0.18, x, y); } }); c.stroke(); c.setLineDash([]);
  // compass rose
  c.save(); c.translate(cx, cy); c.fillStyle = 'rgba(243,226,184,0.9)'; c.beginPath(); c.arc(0, 0, R * 1.05, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, R, 0, 7); c.stroke(); c.beginPath(); c.arc(0, 0, R * 0.86, 0, 7); c.stroke();
  for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86); c.lineTo(Math.cos(a) * R * (i % 4 ? 0.93 : 1), Math.sin(a) * R * (i % 4 ? 0.93 : 1)); c.stroke(); }
  const star = (n, len, wid, f1, f2, off = 0) => { for (let i = 0; i < n; i++) { const a = off + i / n * Math.PI * 2 - Math.PI / 2; const ax = Math.cos(a), ay = Math.sin(a), bx = -ay, by = ax; c.fillStyle = f1; c.beginPath(); c.moveTo(0, 0); c.lineTo(ax * len, ay * len); c.lineTo(bx * wid, by * wid); c.closePath(); c.fill(); c.fillStyle = f2; c.beginPath(); c.moveTo(0, 0); c.lineTo(ax * len, ay * len); c.lineTo(-bx * wid, -by * wid); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(bx * wid, by * wid); c.lineTo(ax * len, ay * len); c.lineTo(-bx * wid, -by * wid); c.stroke(); } };
  star(8, R * 0.6, R * 0.1, '#e8d6a8', '#8a5a2a', Math.PI / 8); star(4, R * 0.95, R * 0.16, '#f8eccc', '#a0302a');
  c.fillStyle = '#c9a23a'; c.beginPath(); c.arc(0, 0, R * 0.08, 0, 7); c.fill(); c.stroke();
  c.fillStyle = INK; c.font = `900 ${Math.max(10, 12 * k)}px Georgia,serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; for (const [t, a] of [['N', -Math.PI / 2], ['E', 0], ['S', Math.PI / 2], ['W', Math.PI]]) c.fillText(t, Math.cos(a) * R * 1.22, Math.sin(a) * R * 1.22); c.restore(); c.textBaseline = 'alphabetic';
  // sea monster + ship doodles
  doodleKing(c, W * 0.45, H * 0.53, k); doodleShip(c, W * 0.25, H * 0.88, k); doodleShip(c, W * 0.62, H * 0.2, k * 0.9);
  // islands
  for (const I of islands) { const [x, y] = P(I); const locked = S.lvl < I.lvl; if (I.secret && !(S.secrets || {})[I.id]) { drawMystery(c, x, y, k); continue; } drawIsle(c, x, y, k, I.id, locked); }
  // title cartouche
  c.save(); const tw = Math.min(W * 0.4, 230 * k), th = 28 * k, tx = W * 0.47 - tw / 2, ty = 6; c.fillStyle = 'rgba(243,226,184,0.92)'; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.roundRect(tx, ty, tw, th, 8); c.fill(); c.stroke(); c.beginPath(); c.roundRect(tx + 3, ty + 3, tw - 6, th - 6, 6); c.stroke();
  c.fillStyle = INK; c.font = `italic 900 ${Math.max(11, 15 * k)}px Georgia,serif`; c.textAlign = 'center'; c.fillText('Chart of the Grand Line', tx + tw / 2, ty + th * 0.68); c.restore();
  // burnt edge
  const e = c.createLinearGradient(0, 0, 0, H); c.strokeStyle = 'rgba(90,50,15,0.55)'; c.lineWidth = 6; c.strokeRect(3, 3, W - 6, H - 6);
}
function blob(c, x, y, rx, ry, seed) { const r = rnd(seed); c.beginPath(); const n = 14; const pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const m = 0.75 + r() * 0.4; pts.push([x + Math.cos(a) * rx * m, y + Math.sin(a) * ry * m]); } c.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2); for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); } c.closePath(); }
const LAND = { windmill: 0x7ac04a, shells: 0x8ac05a, alabasta: 0xe8c878, skypiea: 0xffffff, water7: 0xc8ccd4, enies: 0xd8dce4, thriller: 0x4a3a5a, sabaody: 0x7ab84a, fishman: 0xe08ab0, punk: 0xc8d8f0, wci: 0xffb0d0, wano: 0x7a9a4a, egghead: 0xe0eef8, impel: 0x7a5a50, marineford: 0xd8d8de, whisky: 0xc8a868, mirro: 0xc0a0ff, laughtale: 0xe8c860 };
function drawIsle(c, x, y, k, id, locked) {
  const s = 15 * k; const seed = [...id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0; const d = IDEFS[id];
  const land = LAND[id] ?? (d && d.pal ? d.pal.grass : 0x7ab84a);
  c.save(); c.strokeStyle = 'rgba(40,80,110,0.45)'; c.lineWidth = 1; for (let i = 1; i <= 2; i++) { blob(c, x, y, s * (1 + i * 0.28), s * 0.7 * (1 + i * 0.28), seed); c.stroke(); }
  blob(c, x, y, s * 1.08, s * 0.76, seed); c.fillStyle = '#e8d49a'; c.fill(); blob(c, x, y - 1, s * 0.88, s * 0.6, seed); c.fillStyle = hex(land); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; blob(c, x, y, s * 1.08, s * 0.76, seed); c.stroke();
  c.translate(x, y - s * 0.15); c.scale(k, k); c.lineWidth = 1.1; c.strokeStyle = INK; glyph(c, id); c.restore();
  if (locked) { c.save(); c.globalAlpha = 0.45; c.fillStyle = '#6a5a40'; blob(c, x, y, s * 1.1, s * 0.8, seed); c.fill(); c.restore(); }
}
function F(c, col, fn) { c.fillStyle = col; c.beginPath(); fn(); c.fill(); c.stroke(); }
function glyph(c, id) {
  const tri = (x, y, w, h) => { c.moveTo(x - w / 2, y); c.lineTo(x, y - h); c.lineTo(x + w / 2, y); c.closePath(); };
  const rect = (x, y, w, h) => c.rect(x - w / 2, y - h, w, h); const circ = (x, y, r) => c.arc(x, y, r, 0, 7);
  switch (id) {
    case 'windmill': F(c, '#f4ecd8', () => rect(0, 4, 5, 9)); c.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; c.moveTo(0, -5); c.lineTo(Math.cos(a) * 8, -5 + Math.sin(a) * 8); } c.stroke(); break;
    case 'shells': F(c, '#f0f0f4', () => rect(0, 4, 10, 7)); F(c, '#2a5bb8', () => tri(0, -3, 6, 5)); break;
    case 'orange': F(c, '#d03030', () => tri(0, 4, 13, 11)); break;
    case 'syrup': F(c, '#f0e8d8', () => rect(0, 4, 12, 6)); F(c, '#c04a3a', () => tri(0, -2, 14, 5)); break;
    case 'baratie': F(c, '#a06a3a', () => { c.ellipse(0, 2, 9, 3.5, 0, 0, 7); }); F(c, '#f0e0c0', () => rect(0, 0, 6, 5)); break;
    case 'arlong': F(c, '#f0f0e8', () => rect(0, 4, 4, 12)); F(c, '#3a6ab0', () => tri(0, -8, 6, 4)); break;
    case 'loguetown': F(c, '#6a4a2a', () => rect(0, 4, 10, 5)); c.beginPath(); c.moveTo(-4, -1); c.lineTo(-4, -8); c.lineTo(4, -8); c.lineTo(4, -1); c.stroke(); break;
    case 'whisky': for (const [dx, h] of [[-4, 9], [1, 13], [5, 7]]) F(c, '#9aa05a', () => { c.roundRect(dx - 1.5, 4 - h, 3, h, 1.5); }); break;
    case 'alabasta': F(c, '#f4e6c0', () => rect(0, 4, 13, 5)); for (const dx of [-4, 0, 4]) F(c, '#f4e6c0', () => c.arc(dx, -1, dx ? 2 : 3, Math.PI, 0)); break;
    case 'skypiea': F(c, '#ffffff', () => { circ(-4, 2, 3.5); circ(0, 0, 4.5); circ(4, 2, 3.5); }); c.strokeStyle = '#3a7a2a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(5, 2); c.bezierCurveTo(9, -4, 3, -8, 7, -14); c.stroke(); break;
    case 'water7': F(c, '#e0e6ee', () => { rect(0, 4, 12, 3); rect(0, 1, 8, 3); rect(0, -2, 4, 6); }); c.strokeStyle = '#2a8ad0'; c.beginPath(); c.moveTo(0, -9); c.quadraticCurveTo(5, -11, 7, -4); c.moveTo(0, -9); c.quadraticCurveTo(-5, -11, -7, -4); c.stroke(); break;
    case 'enies': F(c, '#f0f0f6', () => rect(0, 4, 4, 14)); F(c, '#2a5bb8', () => tri(0, -10, 6, 4)); c.strokeStyle = '#2a6ab0'; c.beginPath(); c.arc(0, 4, 10, 0.2, Math.PI - 0.2); c.stroke(); break;
    case 'thriller': F(c, '#2a1a22', () => { c.moveTo(-10, 0); c.lineTo(10, 0); c.lineTo(7, 5); c.lineTo(-7, 5); c.closePath(); }); c.beginPath(); c.moveTo(-3, 0); c.lineTo(-3, -11); c.moveTo(4, 0); c.lineTo(4, -9); c.stroke(); break;
    case 'sabaody': for (const dx of [-5, 4]) { F(c, '#9a7a5a', () => rect(dx, 4, 2.4, 8)); F(c, '#6ab04a', () => c.ellipse(dx, -5, 5, 3, 0, 0, 7)); } c.strokeStyle = '#4aa0d0'; for (const [bx, by, br] of [[0, -9, 2], [2, -13, 1.4], [-2, -15, 1]]) { c.beginPath(); circ(bx, by, br); c.stroke(); } break;
    case 'amazon': F(c, '#e8a040', () => rect(0, 4, 8, 6)); F(c, '#d04a8a', () => c.arc(0, -2, 4, Math.PI, 0)); break;
    case 'impel': F(c, '#5a4a48', () => rect(0, 4, 9, 12)); c.fillStyle = INK; for (let i = 0; i < 3; i++) c.fillRect(-3 + i * 2.5, -4, 1, 4); break;
    case 'marineford': F(c, '#f0f0f4', () => rect(0, 4, 13, 6)); F(c, '#f0f0f4', () => rect(0, -2, 4, 6)); c.fillStyle = '#2a5bb8'; c.fillRect(-1.5, -6, 3, 2); break;
    case 'fishman': F(c, '#f0a0d0', () => rect(0, 4, 4, 8)); c.strokeStyle = '#3ab0e0'; c.beginPath(); c.arc(0, 4, 10, Math.PI, 0); c.stroke(); break;
    case 'punk': F(c, '#e04a2a', () => c.arc(0, 2, 7, Math.PI / 2, Math.PI * 1.5)); F(c, '#bfe4ff', () => c.arc(0, 2, 7, -Math.PI / 2, Math.PI / 2)); break;
    case 'dressrosa': F(c, '#e8c890', () => c.ellipse(0, 2, 9, 4, 0, 0, 7)); F(c, '#d8b078', () => c.ellipse(0, 1, 6, 2.4, 0, 0, 7)); break;
    case 'zou': F(c, '#9a9aa0', () => c.ellipse(0, 1, 9, 5, 0, 0, 7)); F(c, '#9a9aa0', () => { c.moveTo(-8, 1); c.quadraticCurveTo(-13, 6, -11, 10); c.lineTo(-9, 9); c.quadraticCurveTo(-10, 5, -6, 3); }); F(c, '#4a9a3a', () => c.ellipse(1, -4, 6, 2.5, 0, 0, 7)); break;
    case 'wci': for (let i = 0; i < 3; i++) F(c, ['#ffd0e0', '#ffffff', '#ff7ab0'][i], () => rect(0, 4 - i * 4, 12 - i * 3.5, 4)); c.fillStyle = '#d01a3a'; c.beginPath(); circ(0, -9, 1.4); c.fill(); break;
    case 'wano': for (let i = 0; i < 3; i++) { F(c, '#f4f0e8', () => rect(0, 4 - i * 4, 7 - i * 2, 3)); F(c, '#3a3a4a', () => tri(0, 1 - i * 4, 11 - i * 2.6, 2.5)); } c.fillStyle = '#ff9ac0'; for (const [dx, dy] of [[-8, 2], [8, 3]]) { c.beginPath(); circ(dx, dy, 2.4); c.fill(); } break;
    case 'egghead': F(c, '#fff8e8', () => c.ellipse(0, -1, 5, 6.5, 0, 0, 7)); F(c, '#ff8ab8', () => circ(7, -10, 3)); break;
    case 'mirro': F(c, '#d0e8ff', () => rect(0, 4, 6, 11)); break;
    case 'laughtale': c.strokeStyle = '#a02010'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-4, -4); c.lineTo(4, 4); c.moveTo(4, -4); c.lineTo(-4, 4); c.stroke(); break;
    default: F(c, '#6ab04a', () => tri(0, 4, 8, 9));
  }
}
function drawMystery(c, x, y, k) { c.save(); c.globalAlpha = 0.7; c.fillStyle = 'rgba(120,100,70,0.35)'; for (const [dx, dy, r] of [[-6, 0, 8], [3, -3, 9], [8, 2, 7]]) { c.beginPath(); c.arc(x + dx * k, y + dy * k, r * k, 0, 7); c.fill(); } c.fillStyle = INK; c.font = `900 ${14 * k}px Georgia,serif`; c.textAlign = 'center'; c.fillText('?', x, y + 5 * k); c.restore(); }
function doodleKing(c, x, y, k) { c.save(); c.translate(x, y); c.scale(k, k); c.strokeStyle = 'rgba(74,46,20,0.6)'; c.fillStyle = 'rgba(90,130,90,0.35)'; c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(i * 12, 0, 6, Math.PI, 0); c.fill(); c.stroke(); } c.beginPath(); c.moveTo(-6, 0); c.quadraticCurveTo(-10, -14, -2, -16); c.quadraticCurveTo(4, -15, 0, -10); c.fill(); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(-3, -14, 0.9, 0, 7); c.fill(); c.restore(); }
function doodleShip(c, x, y, k) { c.save(); c.translate(x, y); c.scale(k, k); c.strokeStyle = 'rgba(74,46,20,0.7)'; c.fillStyle = 'rgba(138,90,42,0.5)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(-9, 0); c.lineTo(9, 0); c.lineTo(6, 4); c.lineTo(-6, 4); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -13); c.stroke(); c.fillStyle = 'rgba(250,240,220,0.8)'; c.beginPath(); c.moveTo(0.5, -12); c.quadraticCurveTo(7, -7, 0.5, -2); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#111'; c.fillRect(-0.5, -16, 4, 2.5); c.restore(); }
