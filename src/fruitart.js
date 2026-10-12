// Anime-style Devil Fruit art: shared swirl texture (3D map + bump) and 2D icons, distinct shapes per fruit.
import { THREE as B } from './engine.js';
import { FRUITS, RCOL } from './data.js';
const hx = c => '#' + (c >>> 0).toString(16).padStart(6, '0');
const shade = (c, k) => { const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255; const f = v => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; };
function hash(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
// canonical-ish shapes for headline fruits, the rest picked from the id hash
const SHAPE = { gomu: 'grape', nika: 'grape', mera: 'round', hie: 'round', pika: 'star', goro: 'pear', magu: 'lumpy', gura: 'melon', yami: 'round', ope: 'heart', mero: 'heart', bara: 'long', hana: 'star', suna: 'pear', moku: 'lumpy', mochi: 'round', ito: 'long', kage: 'pear', doku: 'lumpy', seiryu: 'long', sound: 'round', makami: 'star', phoenix: 'pear', buddha: 'melon' };
const SHAPES = ['round', 'pear', 'melon', 'lumpy', 'heart', 'star', 'long'];
export const shapeOf = id => SHAPE[id] || SHAPES[hash(id) % SHAPES.length];
// swirl curls ("@"-shaped raised patterns) on an equirect canvas; returns { color, bump }
const texCache = {};
export function swirlTex(id) { if (texCache[id]) return texCache[id]; const f = FRUITS[id] || { col: [0x8a2be2, 0x5d1a9e] }; const [c1, c2] = f.col; const W = 256, H = 128; const h = hash(id); let s = h; const r = () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) >>> 0) / 4294967296);
  const mk = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; return cv; }; const cv = mk(), bv = mk(); const c = cv.getContext('2d'), b = bv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, shade(c1, 1.15)); g.addColorStop(0.55, hx(c1)); g.addColorStop(1, shade(c1, 0.7)); c.fillStyle = g; c.fillRect(0, 0, W, H); b.fillStyle = '#808080'; b.fillRect(0, 0, W, H);
  const curl = (ctx, x, y, R, turns, col, lw) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); const n = 40; for (let i = 0; i <= n; i++) { const t = i / n; const a = t * turns * 6.283; const rr = R * (1 - t * 0.85); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.8; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); };
  const n = 7 + (h % 4); for (let i = 0; i < n; i++) { const x = (i + r() * 0.6) / n * W, y = H * (0.18 + r() * 0.64), R = 13 + r() * 9; for (const dx of [-W, 0, W]) { curl(c, x + dx, y, R, 1.6, shade(c2, 0.55), 7); curl(c, x + dx, y, R, 1.6, hx(c2), 4.2); curl(b, x + dx, y, R, 1.6, '#ffffff', 6); }
    // connecting vine between curls
    c.strokeStyle = hx(c2); c.lineWidth = 3; c.beginPath(); c.moveTo(x + R, y); c.quadraticCurveTo(x + W / n * 0.5, y + (r() - 0.5) * 30, x + W / n, H * (0.2 + r() * 0.6)); c.stroke(); b.strokeStyle = '#d0d0d0'; b.lineWidth = 4; b.beginPath(); b.moveTo(x + R, y); b.quadraticCurveTo(x + W / n * 0.5, y, x + W / n, y); b.stroke(); }
  const color = new B.CanvasTexture(cv); color.wrapS = B.RepeatWrapping; color.colorSpace = B.SRGBColorSpace; const bump = new B.CanvasTexture(bv); bump.wrapS = B.RepeatWrapping;
  return (texCache[id] = { color, bump, canvas: cv }); }
function bodyGeo(shape) { const sph = new B.SphereGeometry(0.5, 40, 28); const p = sph.attributes.position; const v = new B.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const a = Math.atan2(v.z, v.x), y = v.y / 0.5; let k = 1;
    if (shape === 'pear') { k = 1 - 0.28 * Math.max(0, y) ** 1.4; v.y *= 1.12; }
    if (shape === 'melon') k = 1 + 0.06 * Math.cos(a * 8);
    if (shape === 'lumpy') k = 1 + 0.07 * Math.sin(a * 5 + y * 4) * Math.cos(y * 3);
    if (shape === 'star') k = 1 + 0.12 * Math.max(0, Math.cos(a * 5)) ** 2 * (1 - Math.abs(y));
    if (shape === 'heart') { k = 1 - 0.18 * Math.max(0, -y) ** 1.3; v.x *= 1 + 0.12 * (y > 0.2 ? 1 : 0) * Math.abs(Math.sin(a)); if (y > 0.7) k *= 0.92 + 0.1 * Math.abs(Math.cos(a)); }
    if (shape === 'long') { v.y *= 1.45; k = 0.86; }
    v.x *= k; v.z *= k; p.setXYZ(i, v.x, v.y * 0.95, v.z); }
  sph.computeVertexNormals(); return sph; }
// curly stem + leaf
function stem(top) { const g = new B.Group(); const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new B.Vector3(Math.sin(t * 5) * 0.06 * t, top + t * 0.26, Math.cos(t * 5) * 0.06 * t - 0.02)); }
  pts.push(new B.Vector3(0.1, top + 0.3, 0.0)); for (let i = 0; i <= 10; i++) { const a = i / 10 * 5.5; const rr = 0.07 * (1 - i / 12); pts.push(new B.Vector3(0.12 + Math.cos(a) * rr, top + 0.32 + Math.sin(a) * rr, 0)); }
  const tube = new B.Mesh(new B.TubeGeometry(new B.CatmullRomCurve3(pts), 40, 0.018, 6), new B.MeshToonMaterial({ color: 0x3d6a22 })); g.add(tube);
  const lg = new B.SphereGeometry(0.16, 12, 8); lg.scale(1, 0.18, 0.55); const leaf = new B.Mesh(lg, new B.MeshToonMaterial({ color: 0x3fbf4a })); leaf.position.set(-0.13, top + 0.12, 0.02); leaf.rotation.set(0.2, 0.4, 0.5); g.add(leaf);
  const l2 = leaf.clone(); l2.position.set(0.1, top + 0.1, -0.06); l2.rotation.set(-0.2, -0.6, -0.6); l2.scale.setScalar(0.8); g.add(l2); return g; }
const glowTex = (() => { let t; return () => { if (t) return t; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); return (t = new B.CanvasTexture(cv)); }; })();
export function makeDevilFruit(id, scale = 1, o = {}) { const f = FRUITS[id] || { col: [0x8a2be2, 0x5d1a9e], rar: 0 }; const shape = shapeOf(id); const T = swirlTex(id); const g = new B.Group();
  const mat = new B.MeshStandardMaterial({ map: T.color, bumpMap: T.bump, bumpScale: 2.2, roughness: 0.28, metalness: 0.05, emissive: new B.Color(f.col[0]).multiplyScalar(0.12) });
  let top = 0.47;
  if (shape === 'grape') { const geo = new B.SphereGeometry(0.17, 18, 12); const rows = [[0.3, 1, 0], [0.12, 4, 0.2], [-0.08, 5, 0.27], [-0.28, 4, 0.2], [-0.44, 1, 0]]; for (const [y, n, rr] of rows) for (let i = 0; i < n; i++) { const a = i / n * 6.283 + y * 3; const m = new B.Mesh(geo, mat); m.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr); m.rotation.y = a; g.add(m); } top = 0.44; }
  else { const body = new B.Mesh(bodyGeo(shape), mat); g.add(body); if (shape === 'long') top = 0.66; if (shape === 'pear') top = 0.52; }
  // outline shell (inverted hull)
  const out = new B.Group(); g.children.forEach(m => { const om = new B.Mesh(m.geometry, new B.MeshBasicMaterial({ color: 0x140a06, side: B.BackSide })); om.position.copy(m.position); om.scale.setScalar(1.045); om.rotation.copy(m.rotation); out.add(om); }); g.add(out);
  g.add(stem(top - 0.04));
  // glossy toon highlight
  const hl = new B.Mesh(new B.SphereGeometry(0.07, 10, 8), new B.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })); hl.scale.set(1.4, 0.7, 0.4); hl.position.set(-0.2, 0.22, 0.38); hl.rotation.z = 0.6; g.add(hl);
  if (o.glow !== false) { const rc = new B.Color(RCOL[f.rar ?? 0] || '#ffffff'); const sp = new B.Sprite(new B.SpriteMaterial({ map: glowTex(), color: rc, transparent: true, depthWrite: false, blending: B.AdditiveBlending, opacity: 0.35 + (f.rar ?? 0) * 0.07 })); sp.scale.setScalar(1.6 + (f.rar ?? 0) * 0.12); g.add(sp); g.userData.glow = sp; }
  let gv = 0; mat.uniforms = { t: { value: 0 }, glow: { get value() { return gv; }, set value(v) { gv = v; mat.emissiveIntensity = 1 + v * 2.5; } } };
  g.scale.setScalar(scale); g.userData.mat = mat; g.userData.spin = (dt, t) => { g.rotation.y += dt * 0.8; g.position.y = (g.userData.baseY ?? g.position.y) + Math.sin(t * 2) * 0.06 * scale; if (g.userData.glow) g.userData.glow.material.opacity = (0.35 + (f.rar ?? 0) * 0.07) * (0.8 + Math.sin(t * 3) * 0.2); };
  return g; }
// 2D icon matching the 3D look
const iconCache = {};
export function fruitIcon2(id, size = 96, emblem = '') { const k = id + size; if (iconCache[k]) return iconCache[k]; const f = FRUITS[id]; if (!f) return '';
  const S = size, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'); const [c1, c2] = f.col; const rc = RCOL[f.rar ?? 0] || '#fff'; const shape = shapeOf(id);
  const g0 = c.createRadialGradient(S / 2, S * 0.56, S * 0.1, S / 2, S * 0.56, S * 0.5); g0.addColorStop(0, rc + 'cc'); g0.addColorStop(1, rc + '00'); c.fillStyle = g0; c.fillRect(0, 0, S, S);
  if (f.rar >= 5) { c.save(); c.translate(S / 2, S * 0.56); c.globalAlpha = 0.35; c.fillStyle = rc; for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(0, 0); c.lineTo(S * 0.05, -S * 0.5); c.lineTo(-S * 0.05, -S * 0.5); c.fill(); } c.restore(); }
  const cx = S / 2, cy = S * 0.58, R = S * 0.3; const path = () => { c.beginPath(); if (shape === 'grape') { for (const [dx, dy, r] of [[0, -0.55, 0.42], [-0.5, -0.2, 0.42], [0.5, -0.2, 0.42], [0, -0.05, 0.45], [-0.35, 0.35, 0.42], [0.35, 0.35, 0.42], [0, 0.7, 0.38]]) { c.moveTo(cx + dx * R + r * R, cy + dy * R); c.arc(cx + dx * R, cy + dy * R, r * R, 0, 6.283); } return; }
    const n = 64; for (let i = 0; i <= n; i++) { const a = i / n * 6.283; let rx = R, ry = R * 0.95; const y = -Math.sin(a); let k = 1; if (shape === 'pear') { k = 1 - 0.25 * Math.max(0, y) ** 1.4; ry *= 1.1; } if (shape === 'melon') k = 1 + 0.04 * Math.cos(a * 8); if (shape === 'lumpy') k = 1 + 0.06 * Math.sin(a * 5); if (shape === 'star') k = 1 + 0.1 * Math.max(0, Math.cos(a * 5)) ** 2; if (shape === 'heart') { k = 1 - 0.2 * Math.max(0, -y) ** 1.3 + (y > 0.75 ? -0.12 * Math.max(0, 1 - Math.abs(Math.cos(a)) * 6) : 0); } if (shape === 'long') { ry *= 1.3; rx *= 0.82; }
      const x = cx + Math.cos(a) * rx * k, yy = cy - Math.sin(a) * ry * k; i ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.closePath(); };
  // body with texture
  c.save(); path(); c.clip(); const T = swirlTex(id).canvas; c.drawImage(T, 0, 0, T.width, T.height, cx - R * 1.6, cy - R * 1.3, R * 3.6, R * 2.6);
  const sh = c.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.1, cx, cy, R * 1.3); sh.addColorStop(0, 'rgba(255,255,255,.35)'); sh.addColorStop(0.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.45)'); c.fillStyle = sh; c.fillRect(0, 0, S, S); c.restore();
  c.lineWidth = S * 0.035; c.strokeStyle = '#160b06'; c.lineJoin = 'round'; path(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(cx - R * 0.42, cy - R * 0.48, R * 0.2, R * 0.1, -0.7, 0, 6.283); c.fill(); c.beginPath(); c.arc(cx - R * 0.18, cy - R * 0.62, R * 0.05, 0, 6.283); c.fill();
  // curly stem + leaves
  const ty = cy - R * (shape === 'long' ? 1.25 : shape === 'grape' ? 1.0 : 0.92); c.strokeStyle = '#2f5a1a'; c.lineWidth = S * 0.04; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, ty); c.bezierCurveTo(cx - S * 0.02, ty - S * 0.1, cx + S * 0.1, ty - S * 0.12, cx + S * 0.1, ty - S * 0.06); c.arc(cx + S * 0.075, ty - S * 0.07, S * 0.028, 0, 5); c.stroke();
  for (const [dx, rot, sc] of [[-0.11, 0.5, 1], [0.12, -0.5, 0.8]]) { c.save(); c.translate(cx + dx * S, ty - S * 0.02); c.rotate(rot); c.fillStyle = '#3fbf4a'; c.strokeStyle = '#123a18'; c.lineWidth = S * 0.018; c.beginPath(); c.ellipse(0, 0, S * 0.1 * sc, S * 0.04 * sc, 0, 0, 6.283); c.fill(); c.stroke(); c.strokeStyle = 'rgba(18,58,24,.6)'; c.beginPath(); c.moveTo(-S * 0.08 * sc, 0); c.lineTo(S * 0.08 * sc, 0); c.stroke(); c.restore(); }
  if (emblem) { c.fillStyle = 'rgba(10,16,28,.88)'; c.beginPath(); c.arc(S * 0.81, S * 0.81, S * 0.16, 0, 6.283); c.fill(); c.strokeStyle = rc; c.lineWidth = S * 0.025; c.stroke(); c.font = `${S * 0.18}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(emblem, S * 0.81, S * 0.82); }
  return (iconCache[k] = cv.toDataURL()); }
