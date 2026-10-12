// Unique procedural Devil Fruit icons (canvas -> dataURL, cached). Each fruit = its own colour pair,
// swirl pattern (seeded from the id), rarity glow and a power emblem.
import { FRUITS, RCOL } from './data.js';
const EMO = { gomu: '🥊', mera: '🔥', pika: '✨', sube: '💧', bane: '🌀', toge: '📌', kilo: '🏋️', bara: '✂️', bomu: '💣', bari: '🛡️', horo: '👻', mane: '🎭', awa: '🫧', doru: '🕯️', noro: '🐌', hana: '🌸', kage: '🦇', doku: '☠️', mero: '💘', pero: '🍬', moku: '💨', suna: '🏜️', yuki: '☃️', gasu: '☁️', numa: '🟤', mochi: '🍡', hie: '❄️', ito: '🧵', ope: '🔷', nikyu: '🐾', yami: '🌑', goro: '⚡', magu: '🌋', gura: '💥', phoenix: '🐦‍🔥', soru: '💗', buddha: '🙏', kitsune: '🦊', orochi: '🐍', zushi: '🪐', supa: '🔪', ori: '⛓️', baku: '😋', beri: '🪙', doa: '🚪', nagi: '🤫', beta: '🟢', sabi: '🟠', atsu: '♨️', woshu: '🧼', ton: '⚖️', horu: '💉', hobi: '🧸', fuwa: '🎈', jiki: '🧲', sui: '🏊', toki: '⏳', bisu: '🍪', mira: '🪞', shiro: '🏰', mori: '🌳', goru: '🥇', ptera: '🦅', brachio: '🦕', onyudo: '🗿', pegasus: '🦄', kumo: '🕷️', thunderbird: '💀', raijin: '🐆', leviathan: '🦖', nika: '☀️', seiryu: '🐉', sound: '🎵', makami: '🐺' };
const cache = {};
const hx = c => '#' + (c >>> 0).toString(16).padStart(6, '0');
function hash(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
export function fruitIcon(id, size = 96) {
  const k = id + size; if (cache[k]) return cache[k]; const f = FRUITS[id]; if (!f) return '';
  const cv = document.createElement('canvas'); cv.width = cv.height = size; const c = cv.getContext('2d'); const S = size, cx = S / 2, cy = S * 0.55, R = S * 0.33;
  const h = hash(id); const rnd = (i) => ((h >>> (i * 3)) & 1023) / 1023;
  const rc = RCOL[f.rar ?? 0] || '#fff'; const g0 = c.createRadialGradient(cx, cy, R * 0.6, cx, cy, S * 0.5); g0.addColorStop(0, rc + 'aa'); g0.addColorStop(1, rc + '00'); c.fillStyle = g0; c.fillRect(0, 0, S, S);
  const [c1, c2] = f.col; const gb = c.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.05); gb.addColorStop(0, '#ffffff'); gb.addColorStop(0.25, hx(c1)); gb.addColorStop(1, hx(c2));
  c.save(); c.beginPath(); c.ellipse(cx, cy, R, R * 0.94, 0, 0, Math.PI * 2); c.fillStyle = gb; c.fill(); c.clip();
  // swirl / pattern
  const pat = h % 4, n = 2 + (h >> 4) % 3, rot = rnd(2) * 6.28; c.strokeStyle = hx(c2); c.globalAlpha = 0.85; c.lineCap = 'round';
  const dk = (() => { const r = (c2 >> 16) & 255, g = (c2 >> 8) & 255, b = c2 & 255; return `rgb(${r * 0.55 | 0},${g * 0.55 | 0},${b * 0.55 | 0})`; })(); c.strokeStyle = dk;
  if (pat === 0 || pat === 1) for (let j = 0; j < n + 2; j++) { const ox = cx + Math.cos(rot + j * 2.1) * R * 0.45, oy = cy + Math.sin(rot + j * 2.1) * R * 0.45; c.lineWidth = S * (pat ? 0.035 : 0.05); c.beginPath(); for (let t = 0; t < 14; t++) { const a = t * 0.55 + j, rr = t * R * 0.028; const x = ox + Math.cos(a) * rr, y = oy + Math.sin(a) * rr; t ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  if (pat === 2) for (let j = -3; j <= 3; j++) { c.lineWidth = S * 0.04; c.beginPath(); for (let t = 0; t <= 20; t++) { const x = cx - R + t / 20 * R * 2, y = cy + j * R * 0.3 + Math.sin(t * 0.8 + rot + j) * R * 0.12; t ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  if (pat === 3) for (let j = 0; j < 18; j++) { const a = j * 2.4 + rot, rr = Math.sqrt(j / 18) * R * 0.95; c.beginPath(); c.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, S * 0.045, 0, Math.PI * 2); c.lineWidth = S * 0.025; c.stroke(); }
  c.globalAlpha = 1; c.restore();
  c.lineWidth = S * 0.035; c.strokeStyle = '#1a120c'; c.beginPath(); c.ellipse(cx, cy, R, R * 0.94, 0, 0, Math.PI * 2); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(cx - R * 0.38, cy - R * 0.45, R * 0.18, R * 0.1, -0.6, 0, Math.PI * 2); c.fill();
  // stem + curly leaf
  c.strokeStyle = '#3d2a14'; c.lineWidth = S * 0.05; c.beginPath(); c.moveTo(cx, cy - R * 0.9); c.quadraticCurveTo(cx + S * 0.02, cy - R * 1.25, cx + S * 0.07, cy - R * 1.3); c.stroke();
  c.fillStyle = '#2fae3d'; c.strokeStyle = '#123a18'; c.lineWidth = S * 0.02; c.beginPath(); c.ellipse(cx + S * 0.15, cy - R * 1.2, S * 0.11, S * 0.045, -0.4 + rnd(5) * 0.4, 0, Math.PI * 2); c.fill(); c.stroke();
  // emblem badge
  const e = EMO[id] || (f.short || f.name)[0]; c.fillStyle = 'rgba(10,16,28,.85)'; c.beginPath(); c.arc(S * 0.8, S * 0.8, S * 0.17, 0, Math.PI * 2); c.fill(); c.strokeStyle = rc; c.lineWidth = S * 0.025; c.stroke();
  c.font = `${S * 0.2}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText(e, S * 0.8, S * 0.81);
  return (cache[k] = cv.toDataURL());
}
export const fruitEmblem = id => EMO[id] || '🍇';
