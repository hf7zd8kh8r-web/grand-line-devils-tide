// Anime-style Devil Fruit art v2: per-fruit base shapes (apple, pear, melon, pumpkin, starfruit, heart, eggplant, banana,
// pineapple, gourd, peach, grape cluster, lumpy), all-over raised "@" swirls (colour + soft bump map), cel-shaded toon
// material with rim light + crisp anime shine, extruded-hull outline, curly stem + leaves (pineapple crown), rarity glow.
// Geometries/materials are shared per shape / per fruit; 2D icons are rendered from the same 3D model and cached.
import { THREE as B } from './engine.js';
import { FRUITS, RCOL } from './data.js';
const hx = c => '#' + (c >>> 0).toString(16).padStart(6, '0');
const rgb = c => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const mixc = (c, k) => { const f = v => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k))); const [r, g, b] = rgb(c); return (f(r) << 16) | (f(g) << 8) | f(b); };
const shade = (c, k) => hx(mixc(c, k));
const lum = c => { const [r, g, b] = rgb(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
function hash(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
// canon-inspired shapes for the headline fruits; the rest are spread over the shape set by id hash
const SHAPE = { gomu: 'grape', nika: 'grape', ito: 'grape', mera: 'round', hie: 'round', yami: 'lumpy', pika: 'banana', goro: 'pumpkin', magu: 'lumpy', gura: 'melon', ope: 'heart', mero: 'heart', bara: 'pear', hana: 'pineapple', phoenix: 'pineapple', suna: 'pear', moku: 'gourd', mochi: 'round', kage: 'gourd', doku: 'lumpy', seiryu: 'long', sound: 'star', makami: 'star', buddha: 'pumpkin', soru: 'peach', pero: 'peach', bomu: 'pumpkin', kilo: 'pear', bane: 'banana', toki: 'gourd', bisu: 'melon', mira: 'star', shiro: 'pumpkin', kitsune: 'peach', orochi: 'long', zushi: 'round', ptera: 'pear', leviathan: 'pineapple', goru: 'star', mori: 'melon', raijin: 'banana', kumo: 'lumpy', pegasus: 'peach', thunderbird: 'pear', onyudo: 'gourd', brachio: 'long', sube: 'long', supa: 'heart' };
const SHAPES = ['round', 'pear', 'melon', 'pumpkin', 'star', 'heart', 'long', 'banana', 'pineapple', 'gourd', 'peach', 'lumpy'];
export const shapeOf = id => SHAPE[id] || SHAPES[hash(id) % SHAPES.length];
// swirl colour with guaranteed contrast against the skin (white-on-white fruits get a cool grey-lilac swirl)
function palette(id) { const f = FRUITS[id] || { col: [0x8a2be2, 0x5d1a9e] }; const c1 = f.col[0]; let c2 = f.col[1]; const d = Math.abs(lum(c1) - lum(c2));
  if (d < 0.18) c2 = lum(c1) > 0.6 ? mixc(c1, 0.62) : mixc(c1, 1.55); return [c1, c2]; }
// ---------- swirl texture (equirect 512x256): colour + soft height (bump) ----------
const texCache = {};
export function swirlTex(id) { if (texCache[id]) return texCache[id]; const [c1, c2] = palette(id); const W = 512, H = 256; let s = hash(id) || 1; const r = () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) >>> 0) / 4294967296);
  const mk = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; return cv; }; const cv = mk(), bv = mk(); const c = cv.getContext('2d'), b = bv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, shade(c1, 1.18)); g.addColorStop(0.5, hx(c1)); g.addColorStop(1, shade(c1, 0.78)); c.fillStyle = g; c.fillRect(0, 0, W, H); b.fillStyle = '#000'; b.fillRect(0, 0, W, H);
  // one "@" curl with a sweeping tail; sx compensates the equirect stretch at that latitude
  const curlPath = (ctx, x, y, R, sx, dir, tail) => { ctx.beginPath(); const n = 46, turns = 1.75; for (let i = 0; i <= n; i++) { const t = i / n; const a = dir * t * turns * 6.283; const rr = R * (1 - t * 0.88); const px = x + Math.cos(a) * rr * sx, py = y + Math.sin(a) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    // tail leaves the curl's outer end and sweeps into the next curl
    ctx.moveTo(x + R * sx, y); ctx.bezierCurveTo(x + R * sx * 1.4, y + tail * R * 1.2, x + R * sx * 2.2, y + tail * R * 0.2, x + R * sx * 2.7, y - tail * R * 0.5); };
  const curls = []; const rows = 3 + (hash(id) % 2); for (let row = 0; row < rows; row++) { const v = 0.2 + row / (rows - 1) * 0.6; const lat = Math.sin(v * Math.PI); const per = Math.max(3, Math.round(6 * lat)); const off = r();
    for (let i = 0; i < per; i++) curls.push([((i + off + (row % 2) * 0.5) / per) * W, v * H + (r() - 0.5) * 14, (22 + r() * 9) * (0.75 + lat * 0.25), 1 / Math.max(0.55, lat), r() < 0.5 ? 1 : -1, r() < 0.5 ? 1 : -1]); }
  for (const [x, y, R, sx, dir, tail] of curls) for (const dx of [-W, 0, W]) {
    // bump: soft ridge (stacked strokes, wide+dark to narrow+bright = rounded profile)
    b.lineCap = b.lineJoin = 'round'; for (const [w, a] of [[15, 0.25], [11, 0.45], [7, 0.75], [4, 1]]) { b.strokeStyle = `rgba(255,255,255,${a})`; b.lineWidth = w; curlPath(b, x + dx, y, R, sx, dir, tail); b.stroke(); }
    // colour: dark ink edge, swirl body, light top-left highlight = embossed look even without lighting
    c.lineCap = c.lineJoin = 'round'; c.strokeStyle = shade(c2, 0.5); c.lineWidth = 11; curlPath(c, x + dx, y, R, sx, dir, tail); c.stroke();
    c.strokeStyle = hx(c2); c.lineWidth = 7.5; curlPath(c, x + dx, y, R, sx, dir, tail); c.stroke();
    c.strokeStyle = shade(c2, 1.45); c.globalAlpha = 0.7; c.lineWidth = 2.2; curlPath(c, x + dx - 1.5, y - 1.8, R, sx, dir, tail); c.stroke(); c.globalAlpha = 1; }
  const color = new B.CanvasTexture(cv); color.wrapS = B.RepeatWrapping; color.colorSpace = B.SRGBColorSpace; color.anisotropy = 4; const bump = new B.CanvasTexture(bv); bump.wrapS = B.RepeatWrapping;
  return (texCache[id] = { color, bump, canvas: cv }); }
// ---------- shapes ----------
const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function shapeFn(shape, v) { const y = v.y / 0.5, a = Math.atan2(v.z, v.x); let k = 1, ys = 0.95, bend = 0;
  switch (shape) {
    case 'round': ys = 0.9; break;
    case 'peach': k = 1 - 0.09 * Math.exp(-(Math.atan2(Math.sin(a - 1.57), Math.cos(a - 1.57)) ** 2) * 10) * (1 - y * y); ys = 0.98 + 0.08 * Math.max(0, y); break;
    case 'pear': k = 1 - 0.36 * sm(-0.1, 1, y) ** 1.2; ys = 1.12; break;
    case 'melon': k = 0.92 + 0.1 * Math.abs(Math.cos(a * 5)) ** 0.55; ys = 0.92; break;
    case 'pumpkin': k = (0.88 + 0.14 * Math.abs(Math.cos(a * 4)) ** 0.5) * 1.06; ys = 0.84; break;
    case 'star': k = 0.74 + 0.36 * Math.max(0, Math.cos(a * 5)) ** 2.2; ys = 1.12; break;
    case 'heart': { k = 1 - 0.32 * Math.max(0, -y) ** 1.25; const cl = Math.abs(Math.sin(a)); if (y > 0.25) k *= 1 + 0.18 * cl * sm(0.25, 0.8, y); ys = 1; break; }
    case 'long': k = 0.7 + 0.16 * (1 - y) / 2; ys = 1.5; bend = 0.12; break;
    case 'banana': k = 0.56 * (1 + 0.06 * Math.cos(a * 5)) * (1 - 0.35 * y * y); ys = 1.55; bend = 0.42; break;
    case 'pineapple': { const st = Math.abs(Math.sin(a * 6 + y * 7)) * Math.abs(Math.sin(a * 6 - y * 7)); k = 0.82 * (1 + 0.07 * st) * (1 - 0.12 * Math.max(0, y) ** 2); ys = 1.28; break; }
    case 'gourd': k = 0.95 - 0.38 * Math.exp(-((y - 0.2) ** 2) * 18) - 0.25 * sm(0.3, 1, y); ys = 1.3; break;
    case 'lumpy': k = 1 + 0.08 * Math.sin(a * 5 + y * 4) * Math.cos(y * 3) + 0.04 * Math.sin(a * 9 - y * 6); ys = 0.96; break; }
  v.x *= k; v.z *= k; v.y *= ys;
  // dimple where the stem goes in + a little at the base
  if (shape !== 'banana') { v.y -= 0.07 * sm(0.8, 1, y) * (shape === 'pumpkin' ? 2 : 1); v.y += 0.03 * sm(0.85, 1, -y); }
  if (bend) v.x += bend * (v.y / 0.5) ** 2 * 0.5 - bend * 0.25; return v; }
const geoCache = {};
function shapeGeo(shape) { if (geoCache[shape]) return geoCache[shape]; const sph = new B.SphereGeometry(0.5, 56, 36); const p = sph.attributes.position; const v = new B.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); shapeFn(shape, v); p.setXYZ(i, v.x, v.y, v.z); } sph.computeVertexNormals(); sph.computeBoundingBox();
  // outline hull: push each vertex out along its (seam-averaged) normal
  const o = sph.clone(); const op = o.attributes.position, on = o.attributes.normal; const acc = new Map(); const key = i => `${op.getX(i).toFixed(4)},${op.getY(i).toFixed(4)},${op.getZ(i).toFixed(4)}`;
  for (let i = 0; i < op.count; i++) { const k = key(i); const n = acc.get(k) || [0, 0, 0]; n[0] += on.getX(i); n[1] += on.getY(i); n[2] += on.getZ(i); acc.set(k, n); }
  const W = 0.026; for (let i = 0; i < op.count; i++) { const n = acc.get(key(i)); const l = Math.hypot(...n) || 1; op.setXYZ(i, op.getX(i) + n[0] / l * W, op.getY(i) + n[1] / l * W, op.getZ(i) + n[2] / l * W); }
  const top = sph.boundingBox.max.y; const topX = shape === 'banana' || shape === 'long' ? (() => { let best = -9, bx = 0; for (let i = 0; i < p.count; i++) if (p.getY(i) > best) { best = p.getY(i); bx = p.getX(i); } return bx; })() : 0;
  return (geoCache[shape] = { body: sph, out: o, top, topX }); }
// ---------- shared bits ----------
let _grad, _outM, _stemM, _leafM, _leafG, _stemG, _crownG, _berryG, _berryO;
const gradMap = () => { if (_grad) return _grad; const d = new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 215, 215, 215, 255, 255, 255, 255, 255]); _grad = new B.DataTexture(d, 4, 1, B.RGBAFormat); _grad.minFilter = _grad.magFilter = B.NearestFilter; _grad.needsUpdate = true; return _grad; };
const outM = () => _outM || (_outM = new B.MeshBasicMaterial({ color: 0x150a06, side: B.BackSide }));
const stemM = () => _stemM || (_stemM = new B.MeshToonMaterial({ color: 0x4a6a1e, gradientMap: gradMap() }));
const leafM = () => _leafM || (_leafM = new B.MeshToonMaterial({ color: 0x3fc04a, gradientMap: gradMap(), side: B.DoubleSide }));
function leafGeo() { if (_leafG) return _leafG; const s = new B.Shape(); s.moveTo(0, 0); s.bezierCurveTo(0.06, 0.07, 0.17, 0.08, 0.26, 0); s.bezierCurveTo(0.17, -0.07, 0.06, -0.06, 0, 0); const g = new B.ShapeGeometry(s, 8); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, -x * x * 1.2 + Math.abs(y) * 0.35); } g.computeVertexNormals(); return (_leafG = g); }
function stemGeo() { if (_stemG) return _stemG; const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new B.Vector3(Math.sin(t * 2.4) * 0.05 * t, t * 0.2, -Math.sin(t * 3) * 0.03 * t)); }
  for (let i = 1; i <= 16; i++) { const a = -1.2 + i / 16 * 5.6; const rr = 0.075 * (1 - i / 22); pts.push(new B.Vector3(0.1 + Math.cos(a) * rr - 0.04, 0.24 + Math.sin(a) * rr, 0)); }
  return (_stemG = new B.TubeGeometry(new B.CatmullRomCurve3(pts), 60, 0.022, 7)); }
function crownGeo() { if (_crownG) return _crownG; const parts = []; const cone = new B.ConeGeometry(0.05, 0.34, 4); cone.translate(0, 0.17, 0); cone.scale(1, 1, 0.35);
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; const g = cone.clone(); const tilt = i % 2 ? 0.5 : 0.25; const sc = i % 2 ? 0.8 : 1.05; g.scale(sc, sc, sc); g.rotateZ(tilt); g.rotateY(a); parts.push(g); }
  // merge manually (no addons dependency)
  const nis = parts.map(g => g.toNonIndexed()); let n = 0; nis.forEach(g => { n += g.attributes.position.count; }); const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0; const idx = [];
  nis.forEach(gi => { pos.set(gi.attributes.position.array, o * 3); gi.computeVertexNormals(); nor.set(gi.attributes.normal.array, o * 3); o += gi.attributes.position.count; });
  const out = new B.BufferGeometry(); out.setAttribute('position', new B.BufferAttribute(pos.slice(0, o * 3), 3)); out.setAttribute('normal', new B.BufferAttribute(nor.slice(0, o * 3), 3)); return (_crownG = out); }
// toon + rim + crisp highlight; one material per fruit (shared by every instance of it)
const matCache = {};
function fruitMat(id) { if (matCache[id]) return matCache[id]; const f = FRUITS[id] || { rar: 0 }; const [c1] = palette(id); const T = swirlTex(id);
  const m = new B.MeshToonMaterial({ map: T.color, bumpMap: T.bump, bumpScale: 3.2, gradientMap: gradMap(), emissive: new B.Color(c1).multiplyScalar(0.1) });
  const rim = new B.Color(0xffffff).lerp(new B.Color(RCOL[f.rar ?? 0] || '#ffffff'), 0.45);
  m.onBeforeCompile = sh => { sh.uniforms.rimCol = { value: rim }; sh.fragmentShader = 'uniform vec3 rimCol;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `{ vec3 Vv = normalize(vViewPosition); float ndv = max(dot(normal, Vv), 0.0);
      outgoingLight += rimCol * smoothstep(0.62, 0.8, 1.0 - ndv) * 0.55;
      vec3 Hh = normalize(normalize(vec3(-0.45, 0.65, 0.6)) + Vv); float sp = pow(max(dot(normal, Hh), 0.0), 70.0); outgoingLight += vec3(1.0) * smoothstep(0.45, 0.55, sp) * 0.75; }
    #include <opaque_fragment>`); };
  m.customProgramCacheKey = () => 'dfruit2'; return (matCache[id] = m); }
const glowTex = (() => { let t; return () => { if (t) return t; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(0.45, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); return (t = new B.CanvasTexture(cv)); }; })();
const addOut = (g, geo, pos, rot, sc) => { const om = new B.Mesh(geo, outM()); om.userData.isOutline = true; if (pos) om.position.copy(pos); if (rot) om.rotation.copy(rot); if (sc) om.scale.copy(sc); g.add(om); return om; };
export function makeDevilFruit(id, scale = 1, o = {}) { const f = FRUITS[id] || { col: [0x8a2be2, 0x5d1a9e], rar: 0 }; const shape = shapeOf(id); const g = new B.Group(); const mat = fruitMat(id);
  let top = 0.45, topX = 0;
  if (shape === 'grape') { if (!_berryG) { _berryG = new B.SphereGeometry(0.15, 22, 14); _berryO = new B.SphereGeometry(0.168, 16, 10); }
    const rows = [[0.3, 3, 0.11], [0.12, 6, 0.22], [-0.07, 7, 0.26], [-0.25, 5, 0.2], [-0.41, 2, 0.08]];
    for (const [y, n, rr] of rows) for (let i = 0; i < n; i++) { const a = i / n * 6.283 + y * 4; const m = new B.Mesh(_berryG, mat); m.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr); m.rotation.set(y * 2, a, i); g.add(m); addOut(g, _berryO, m.position); } top = 0.42; }
  else { const G = shapeGeo(shape); g.add(new B.Mesh(G.body, mat)); addOut(g, G.out); top = G.top - 0.05; topX = G.topX; }
  if (shape === 'pineapple') { const cr = new B.Mesh(crownGeo(), leafM()); cr.position.set(topX, top, 0); g.add(cr); }
  else { const st = new B.Mesh(stemGeo(), stemM()); st.position.set(topX, top, 0); g.add(st);
    for (const [ry, rz, sc] of [[0.3, 0.45, 1], [2.9, 0.35, 0.8]]) { const l = new B.Mesh(leafGeo(), leafM()); l.position.set(topX, top + 0.04, 0); l.rotation.set(0, ry, rz); l.scale.setScalar(sc); g.add(l); } }
  if (o.glow !== false) { const rc = new B.Color(RCOL[f.rar ?? 0] || '#ffffff'); const base = 0.18 + (f.rar ?? 0) * 0.05; const sp = new B.Sprite(new B.SpriteMaterial({ map: glowTex(), color: rc, transparent: true, depthWrite: false, blending: B.AdditiveBlending, opacity: base })); sp.scale.setScalar(1.5 + (f.rar ?? 0) * 0.1); g.add(sp); g.userData.glow = sp; g.userData.glowBase = base; }
  // cover screen drives a glow pulse through mat.uniforms; give it its own material so shared copies are untouched
  let umat = mat; if (o.glow === false && !o.icon) { umat = mat.clone(); umat.onBeforeCompile = mat.onBeforeCompile; umat.customProgramCacheKey = mat.customProgramCacheKey; g.traverse(m => { if (m.material === mat) m.material = umat; }); }
  let gv = 0; umat.uniforms = { t: { value: 0 }, glow: { get value() { return gv; }, set value(v) { gv = v; umat.emissiveIntensity = 1 + v * 2.5; } } };
  g.scale.setScalar(scale); g.userData.mat = umat; g.userData.spin = (dt, t) => { g.rotation.y += dt * 0.8; g.position.y = (g.userData.baseY ?? g.position.y) + Math.sin(t * 2) * 0.06 * scale; if (g.userData.glow) g.userData.glow.material.opacity = g.userData.glowBase * (0.8 + Math.sin(t * 3) * 0.2); };
  return g; }
// ---------- 2D icons: rendered from the 3D model with one shared offscreen renderer; 2D fallback if WebGL is unavailable ----------
const iconCache = {}; let IR = null, IRfail = false;
function iconRenderer() { if (IR || IRfail) return IR; try { const r = new B.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.outputColorSpace = B.SRGBColorSpace; r.setPixelRatio(1); r.setClearColor(0x000000, 0);
    const sc = new B.Scene(); sc.add(new B.HemisphereLight(0xdfeeff, 0x6a5a4a, 1.5)); const d = new B.DirectionalLight(0xffffff, 2.3); d.position.set(-1.5, 2.5, 3); sc.add(d); const cam = new B.PerspectiveCamera(30, 1, 0.1, 20);
    r.domElement.addEventListener('webglcontextlost', () => { IR = null; IRfail = true; }); IR = { r, sc, cam }; } catch (e) { IRfail = true; } return IR; }
function render3d(id, S) { const R = iconRenderer(); if (!R) return null; const m = makeDevilFruit(id, 1, { glow: false, icon: true }); m.rotation.y = 0.35;
  const bb = new B.Box3().setFromObject(m); const ctr = bb.getCenter(new B.Vector3()); const sz = bb.getSize(new B.Vector3()); const h = Math.max(sz.y, sz.x) * 1.12;
  R.cam.position.set(ctr.x, ctr.y + h * 0.12, h / (2 * Math.tan(15 * Math.PI / 180)) + 0.6); R.cam.lookAt(ctr.x, ctr.y, ctr.z); R.r.setSize(S, S, false); R.sc.add(m); R.r.render(R.sc, R.cam); R.sc.remove(m); return R.r.domElement; }
export function fruitIcon2(id, size = 96, emblem = '') { const k = id + size + emblem; if (iconCache[k]) return iconCache[k]; const f = FRUITS[id]; if (!f) return '';
  const S = size, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'); const rc = RCOL[f.rar ?? 0] || '#fff';
  const g0 = c.createRadialGradient(S / 2, S * 0.55, S * 0.08, S / 2, S * 0.55, S * 0.5); g0.addColorStop(0, rc + 'aa'); g0.addColorStop(1, rc + '00'); c.fillStyle = g0; c.fillRect(0, 0, S, S);
  if (f.rar >= 5) { c.save(); c.translate(S / 2, S * 0.55); c.globalAlpha = 0.3; c.fillStyle = rc; for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(0, 0); c.lineTo(S * 0.05, -S * 0.5); c.lineTo(-S * 0.05, -S * 0.5); c.fill(); } c.restore(); }
  let ok = false; try { const R = render3d(id, S * 2); if (R) { c.drawImage(R, 0, 0, S * 2, S * 2, 0, 0, S, S); ok = true; } } catch (e) { ok = false; }
  if (!ok) { // 2D fallback: swirl-textured disc with outline + shine
    const cx = S / 2, cy = S * 0.56, R = S * 0.32; c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 6.283); c.clip(); const T = swirlTex(id).canvas; c.drawImage(T, 0, 0, T.width, T.height, cx - R * 1.6, cy - R * 1.3, R * 3.6, R * 2.6);
    const sh = c.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.1, cx, cy, R * 1.3); sh.addColorStop(0, 'rgba(255,255,255,.3)'); sh.addColorStop(0.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.45)'); c.fillStyle = sh; c.fillRect(0, 0, S, S); c.restore();
    c.lineWidth = S * 0.035; c.strokeStyle = '#160b06'; c.beginPath(); c.arc(cx, cy, R, 0, 6.283); c.stroke(); c.strokeStyle = '#3d6a22'; c.lineWidth = S * 0.04; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, cy - R); c.quadraticCurveTo(cx + S * 0.02, cy - R - S * 0.1, cx + S * 0.09, cy - R - S * 0.08); c.stroke(); }
  if (emblem) { c.fillStyle = 'rgba(10,16,28,.88)'; c.beginPath(); c.arc(S * 0.83, S * 0.83, S * 0.145, 0, 6.283); c.fill(); c.strokeStyle = rc; c.lineWidth = S * 0.025; c.stroke(); c.font = `${S * 0.16}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(emblem, S * 0.83, S * 0.84); }
  return (iconCache[k] = cv.toDataURL()); }
