import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
export { THREE };

export const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const QKEY = 'gldt_quality';
// quality: 'auto' (default) guesses from the device, then adapts to measured frame rate during play
function guessQ() { let gpu = ''; try { const c = document.createElement('canvas').getContext('webgl'); const e = c && c.getExtension('WEBGL_debug_renderer_info'); gpu = e ? String(c.getParameter(e.UNMASKED_RENDERER_WEBGL)) : ''; } catch (e) {}
  const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4; const sw = /swiftshader|llvmpipe|software/i.test(gpu);
  if (sw || mem <= 2 || cores <= 2) return 'low'; if (isTouch) return (Math.max(screen.width, screen.height) * (devicePixelRatio || 1) > 2400 && cores >= 6) ? 'med' : 'med'; return /intel/i.test(gpu) && !/iris xe|arc/i.test(gpu) ? 'med' : 'high'; }
const stored = localStorage.getItem(QKEY);
export const Q = { auto: !stored || stored === 'auto', level: (stored && stored !== 'auto') ? stored : (localStorage.getItem(QKEY + '_a') || guessQ()) };
export function qset(l) { if (l === 'auto') { Q.auto = true; localStorage.setItem(QKEY, 'auto'); } else { Q.auto = false; Q.level = l; localStorage.setItem(QKEY, l); } applyQuality(); }
// adaptive step: call every frame while playing. Drops a level after ~4s under 34fps, climbs once after ~20s above 57fps.
const QA = { t: 0, n: 0, low: 0, hi: 0, ups: 0, cool: 3 };
export function qTick(dt) { if (!Q.auto) return; QA.cool -= dt; if (QA.cool > 0) return; QA.t += dt; QA.n++; if (QA.t < 2) return; const fps = QA.n / QA.t; QA.t = 0; QA.n = 0;
  const L = ['low', 'med', 'high'], i = L.indexOf(Q.level); if (fps < 34) { QA.low++; QA.hi = 0; } else if (fps > 57) { QA.hi++; QA.low = 0; } else { QA.low = 0; QA.hi = 0; }
  if (QA.low >= 2 && i > 0) { Q.level = L[i - 1]; QA.low = 0; QA.cool = 4; localStorage.setItem(QKEY + '_a', Q.level); applyQuality(); }
  else if (QA.hi >= 10 && i < 2 && QA.ups < 1) { Q.level = L[i + 1]; QA.hi = 0; QA.ups++; QA.cool = 4; localStorage.setItem(QKEY + '_a', Q.level); applyQuality(); } }
export const qv = () => ({ low: { pr: 0.75, outline: false, far: 110, parts: 0.4 }, med: { pr: 1.25, outline: true, far: 150, parts: 0.7 }, high: { pr: 2, outline: true, far: 220, parts: 1 } }[Q.level]);

export const renderer = new THREE.WebGLRenderer({ antialias: !isTouch, powerPreference: 'high-performance' });
renderer.autoClear = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.getElementById('app').appendChild(renderer.domElement);
renderer.domElement.id = 'gl';

export function applyQuality() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, qv().pr));
  // never give the canvas a fixed CSS pixel size (iOS then zooms the page instead of rotating); CSS keeps it at 100%
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  for (const f of qualityHooks) f();
}
export const qualityHooks = [];
window.addEventListener('resize', applyQuality);

// toon ramp
function ramp(n) {
  const d = new Uint8Array(n * 4);
  const tones = n === 3 ? [110, 190, 255] : [90, 160, 215, 255];
  for (let i = 0; i < n; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = tones[i]; d[i * 4 + 3] = 255; }
  const t = new THREE.DataTexture(d, n, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
}
export const RAMP = ramp(3);
export const RAMP4 = ramp(4);
export function toonMat(opts = {}) { return new THREE.MeshToonMaterial({ gradientMap: RAMP, vertexColors: true, ...opts }); }
export const OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: 0x14100c, side: THREE.BackSide });
export const WORLD_MAT = toonMat();
export const WORLD_MAT_FLAT = toonMat();

const _c = new THREE.Color();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler();
export function mat(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  _e.set(rx, ry, rz); _q.setFromEuler(_e); return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.clone(), new THREE.Vector3(sx, sy, sz));
}
function prep(g) {
  let geo = g.index ? g.toNonIndexed() : g.clone();
  for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'normal') geo.deleteAttribute(k);
  if (!geo.attributes.normal) geo.computeVertexNormals();
  return geo;
}
// Builder: merges primitives into one vertex-colored mesh (+ inverted hull outline)
export class Builder {
  constructor(skinned = false) { this.f = []; this.o = []; this.skinned = skinned; }
  add(geo, color, m, opt = {}) {
    const g = prep(geo);
    if (m) g.applyMatrix4(m);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3); _c.set(color);
    if (opt.grad) { // vertical gradient darkening
      const pos = g.attributes.position; let mn = Infinity, mx = -Infinity;
      for (let i = 0; i < n; i++) { mn = Math.min(mn, pos.getY(i)); mx = Math.max(mx, pos.getY(i)); }
      for (let i = 0; i < n; i++) { const t = (pos.getY(i) - mn) / (mx - mn || 1); const k = 1 - opt.grad * (1 - t); col[i * 3] = _c.r * k; col[i * 3 + 1] = _c.g * k; col[i * 3 + 2] = _c.b * k; }
    } else for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    if (this.skinned) this._skin(g, opt.bone || 0);
    this.f.push(g);
    if (opt.outline !== false) {
      const t = opt.ot ?? 0.035;
      const og = prep(geo); og.deleteAttribute('normal');
      og.computeBoundingBox(); const bb = og.boundingBox; const c = bb.getCenter(new THREE.Vector3()); const sz = bb.getSize(new THREE.Vector3());
      og.translate(-c.x, -c.y, -c.z);
      og.scale(1 + 2 * t / Math.max(sz.x, 0.01), 1 + 2 * t / Math.max(sz.y, 0.01), 1 + 2 * t / Math.max(sz.z, 0.01));
      og.translate(c.x, c.y, c.z);
      if (m) og.applyMatrix4(m);
      if (this.skinned) this._skin(og, opt.bone || 0);
      this.o.push(og);
    }
    return this;
  }
  // pre-skinned geometry (position, normal, color, skinIndex, skinWeight): smooth-weighted lofted body parts. Outline = normal-offset shell.
  addSkinned(geo, opt = {}) { const g = geo.index ? geo.toNonIndexed() : geo; this.f.push(g);
    if (opt.outline !== false) { const t = opt.ot ?? 0.012; const og = new THREE.BufferGeometry(); const p = g.attributes.position, n = g.attributes.normal, a = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) { a[i * 3] = p.getX(i) + n.getX(i) * t; a[i * 3 + 1] = p.getY(i) + n.getY(i) * t; a[i * 3 + 2] = p.getZ(i) + n.getZ(i) * t; }
      og.setAttribute('position', new THREE.BufferAttribute(a, 3)); og.setAttribute('skinIndex', g.attributes.skinIndex.clone()); og.setAttribute('skinWeight', g.attributes.skinWeight.clone()); this.o.push(og); }
    return this; }
  _skin(g, b) {
    const n = g.attributes.position.count; const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { si[i * 4] = b; sw[i * 4] = 1; }
    g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
  }
  geos() { return { fill: this.f.length ? mergeGeometries(this.f) : null, line: this.o.length ? mergeGeometries(this.o) : null }; }
  build(material = WORLD_MAT) {
    const grp = new THREE.Group(); const { fill, line } = this.geos();
    if (fill) { const m = new THREE.Mesh(fill, material); grp.add(m); grp.userData.fill = m; }
    if (line) { const m = new THREE.Mesh(line, OUTLINE_MAT); grp.add(m); grp.userData.line = m; m.userData.isOutline = true; }
    return grp;
  }
}
export function setOutlinesVisible(root) { const on = qv().outline; root.traverse(o => { if (o.userData.isOutline) o.visible = on; }); }

// Simple seeded rng
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
export function noise2(x, z) { // cheap value-noise
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const h = (a, b) => { const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); };
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return (h(xi, zi) * (1 - u) + h(xi + 1, zi) * u) * (1 - v) + (h(xi, zi + 1) * (1 - u) + h(xi + 1, zi + 1) * u) * v;
}
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
