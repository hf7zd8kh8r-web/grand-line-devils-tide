// Body FX: Armament Haki coating (glossy, coloured, sheen sweep) on first-person arms/weapon + third-person/crewmate arms,
// Conqueror's Haki (black lightning with red outlines, crackling bolts, shockwave dome, screen pulse),
// and awakened auras per fruit family (Gravity meteors, Flame, Frost mist, Light glow, Magma drips, Void wisps, Quake cracks,
// Lightning, Nika cloud ring + steam + bounce glow, ...). Everything visual is driven by visCos() keys: hk (haki colour), aw (fruit).
import { THREE as B } from './engine.js';
const V = (x = 0, y = 0, z = 0) => new B.Vector3(x, y, z);
const R = (s = 1) => (Math.random() - 0.5) * 2 * s;
// ---------------- Armament colours ----------------
// price 0 = default; shop: 'bag' (Bag → Haki → Armament Colours), 'secret' = only in hidden shops
export const HAKI_COLORS = {
  black: { name: 'Classic Black', c: 0x14101c, s: 0x8a7aff, price: 0, shop: 'bag' },
  crimson: { name: 'Crimson Fist', c: 0x4a0610, s: 0xff4a5a, price: 250000, shop: 'bag' },
  purple: { name: 'Royal Purple', c: 0x24083a, s: 0xd08aff, price: 250000, shop: 'bag' },
  blue: { name: 'Abyss Blue', c: 0x061a3e, s: 0x6ac8ff, price: 300000, shop: 'bag' },
  gold: { name: 'Gilded Gold', c: 0x4a3206, s: 0xffe07a, price: 600000, shop: 'bag' },
  emerald: { name: 'Emerald Steel', c: 0x06301a, s: 0x7affb0, price: 450000, shop: 'bag' },
  silver: { name: 'Silver Ward', c: 0x5a5a66, s: 0xffffff, price: 800000, shop: 'bag' },
  oni: { name: 'Oni Ember (secret)', c: 0x1a0606, s: 0xff7a1a, price: 2500000, shop: 'secret' },
  celestial: { name: 'Celestial White (secret)', c: 0xc8c8d8, s: 0xffe8a0, price: 4000000, shop: 'secret' },
  voidc: { name: 'Void Prism (secret)', c: 0x0a0414, s: 0xff3df7, price: 6000000, shop: 'secret', rainbow: true },
};
export const hakiColorOf = S => HAKI_COLORS[(S && S.hakiCol) || 'black'] ? (S.hakiCol || 'black') : 'black';
const T = { v: 0 }; // shared time uniform
const mats = {};
const VS = `varying vec3 vN; varying vec3 vV; varying vec3 vW; varying vec3 vL;
#include <common>
#include <skinning_pars_vertex>
void main(){
  #include <skinbase_vertex>
  #include <begin_vertex>
  #include <beginnormal_vertex>
  #include <skinnormal_vertex>
  #include <skinning_vertex>
  vL = position; vec4 wp = modelMatrix * vec4(transformed, 1.0); vW = wp.xyz; vec4 mv = viewMatrix * wp; vV = -mv.xyz; vN = normalize(normalMatrix * objectNormal); gl_Position = projectionMatrix * mv; }`;
// glossy hardened metal: dark lacquer base + fake sky/ground reflection + two specular lobes + coloured rim, sheen sweep,
// and (first-person arms) a jagged crackle edge where the coat creeps up the forearm, with glowing hairline cracks behind it.
const FS = `uniform vec3 uC; uniform vec3 uS; uniform float uT; uniform float uA; uniform float uRb; uniform float uE; varying vec3 vN; varying vec3 vV; varying vec3 vW; varying vec3 vL;
vec3 hue(float h){ return clamp(abs(mod(h*6.0+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
void main(){ vec3 n = normalize(vN), v = normalize(vV); float ndv = max(dot(n, v), 0.0); float fr = pow(1.0 - ndv, 3.0);
  float ce = 0.0, crack = 0.0;
  if (uE < 50.0) { float ang = atan(vL.y, vL.x); float edge = uE + 0.03 * (vn(vec2(ang * 3.0, 1.7)) - 0.5) * 2.0 + 0.012 * sin(ang * 11.0) + 0.006 * sin(uT * 2.0 + ang * 5.0);
    float e = vL.z - edge; if (e > 0.0) discard; ce = smoothstep(-0.03, 0.0, e);
    float c1 = abs(vn(vec2(ang * 6.0, vL.z * 40.0)) - 0.5), c2 = abs(vn(vec2(ang * 13.0 + 4.0, vL.z * 75.0)) - 0.5); crack = (smoothstep(0.045, 0.0, c1) + smoothstep(0.03, 0.0, c2) * 0.6) * smoothstep(-0.16, -0.01, e); }
  vec3 r = reflect(-v, n); vec3 lA = normalize(vec3(0.4, 0.85, 0.45)), lB = normalize(vec3(-0.6, 0.3, 0.7));
  float sky = smoothstep(-0.3, 0.9, r.y); vec3 base = uC * 0.55; vec3 refl = mix(uC * 0.35 + vec3(0.01), mix(uC * 2.2, vec3(0.8, 0.85, 0.95), 0.35), sky);
  float sp = pow(max(dot(n, normalize(lA + v)), 0.0), 90.0) * 1.4 + pow(max(dot(n, normalize(lB + v)), 0.0), 18.0) * 0.22;
  float band = smoothstep(0.93, 1.0, sin(vW.y * 6.0 + vW.x * 2.5 + vW.z * 2.5 - uT * 2.6));
  vec3 s = mix(uS, hue(fract(uT * 0.15 + vW.y * 0.3)), uRb);
  vec3 c = base * (0.35 + 0.65 * max(dot(n, lA), 0.0)) + refl * (0.35 + 0.65 * fr) + s * (smoothstep(0.35, 0.85, fr) * 0.75 + band * 0.35) + vec3(1.0) * sp;
  c += s * (ce * 1.4 + crack * 1.1);
  gl_FragColor = vec4(c, uA); }`;
export function coatMat(id, alpha = 1, skinned = false, edge = 1e3) { const k = id + ':' + alpha + ':' + skinned + ':' + edge; if (mats[k]) return mats[k]; const H = HAKI_COLORS[id] || HAKI_COLORS.black;
  const m = new B.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, transparent: alpha < 1, depthWrite: alpha >= 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
    uniforms: { uC: { value: new B.Color(H.c) }, uS: { value: new B.Color(H.s) }, uT: T, uA: { value: alpha }, uRb: { value: H.rainbow ? 1 : 0 }, uE: { value: edge } } });
  m.userData.keep = true; mats[k] = m; return m; }
const isIn = (o, p) => { for (let q = o; q; q = q.parent) if (q === p) return true; return false; };
// ---------------- first-person coating ----------------
// every solid mesh of the view model (arms, fists, held blade) gets a coat overlay that shares its geometry
export function fpHaki(g) { const S = g.save, vm = g.vm; if (!vm || !vm.root) return; const on = !!(S.haki && S.haki.buso); const id = hakiColorOf(S); const k = on ? id : '';
  vm.root.traverse(o => { if (!o.isMesh || o.userData.isOutline || o.userData.hkOv) return; const m = o.material; if (!m || m.transparent || m.blending === B.AdditiveBlending || !o.geometry) return;
    let ov = o.userData.hk; if (!on && !ov) return; if (!ov || ov.userData.k !== k) { if (ov) { o.remove(ov); ov = null; } if (on) { let arm = false; for (let q = o; q; q = q.parent) if (q === vm.armL || q === vm.armR) { arm = q.userData && !o.userData.notArm; break; } if (arm && (vm.gun && isIn(o, vm.gun))) arm = false; ov = new B.Mesh(o.geometry, coatMat(id, arm ? 1 : 0.92, false, arm ? -0.17 : 1e3)); ov.userData.hkOv = true; ov.userData.k = k; ov.renderOrder = 2; o.add(ov); } o.userData.hk = ov; }
    if (ov) ov.visible = on; });
  if (vm.mat) { vm.mat.color.setScalar(1); vm.mat.emissive.setHex(0); vm.mat.emissiveIntensity = 0; } }
// ---------------- avatar coating (bones) ----------------
const G = { cyl: new B.CylinderGeometry(1, 0.9, 1, 12, 1, true), sph: new B.SphereGeometry(1, 14, 10), ico: new B.IcosahedronGeometry(1, 0), oct: new B.OctahedronGeometry(1, 0), cone: new B.ConeGeometry(1, 1, 7, 1, true), tor: new B.TorusGeometry(1, 0.06, 6, 40), ring: new B.RingGeometry(0.9, 1, 48), plane: new B.PlaneGeometry(1, 1), box: new B.BoxGeometry(1, 1, 1) };
for (const k in G) G[k].userData = { shared: true };
function shared(m) { m.userData.shared = true; m.traverse && m.traverse(o => { if (o.geometry) o.userData.shared = true; }); return m; }
function avatarCoat(c, id) { const L = c.look || {}; const gg = (L.big || 1); const out = new B.Group(); out.name = 'hkcoat';
  for (const [arm, fore] of [[c.bones.armL, c.bones.foreL], [c.bones.armR, c.bones.foreR]]) { if (!arm || !fore) continue; const fy = fore.position.y;
    const up = new B.Mesh(G.cyl, coatMat(id)); up.scale.set(0.09 * gg, Math.abs(fy) * 0.8, 0.088 * gg); up.position.y = fy * 0.55; arm.add(shared(up)); up.userData.hkPart = true;
    const lo = new B.Mesh(G.cyl, coatMat(id)); lo.scale.set(0.072 * gg, Math.abs(fy) * 0.98, 0.07 * gg); lo.position.y = fy * 0.5; fore.add(shared(lo)); lo.userData.hkPart = true;
    const fist = new B.Mesh(G.sph, coatMat(id)); fist.scale.set(0.05 * gg, 0.075 * gg, 0.068 * gg); fist.position.set(0, fy * 1.08, 0.01); fore.add(shared(fist)); fist.userData.hkPart = true; }
  return out; }
function dropCoat(c) { const rm = []; c.root.traverse(o => { if (o.userData.hkPart) rm.push(o); }); for (const o of rm) o.removeFromParent(); }
// ---------------- auras ----------------
export const AURA_FAMILY = { zushi: 'gravity', mera: 'fire', phoenix: 'fire', seiryu: 'fire', soru: 'soul', hie: 'ice', makami: 'ice', pika: 'light', magu: 'magma', yami: 'dark', gura: 'quake',
  goro: 'lightning', raijin: 'lightning', thunderbird: 'lightning', nika: 'nika', mori: 'plant', sound: 'sound', ito: 'string', toki: 'time', mira: 'mirror', goru: 'gold', ope: 'room', nikyu: 'paw',
  bisu: 'spirit', shiro: 'spirit', ptera: 'beast', brachio: 'beast', buddha: 'light', kitsune: 'fire', orochi: 'dark', onyudo: 'spirit', pegasus: 'light', kumo: 'string', leviathan: 'ice' };
const add = (col, op = 0.8) => new B.MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: B.AdditiveBlending, depthWrite: false, side: B.DoubleSide });
const solid = col => new B.MeshToonMaterial({ color: col });
function partList(grp, n, mk) { const L = []; for (let i = 0; i < n; i++) { const m = mk(i); m.userData.ph = Math.random(); grp.add(m); L.push(m); } return L; }
// returns { grp, upd(t, dt) } in avatar-local units (height ~1.8)
export function makeAura(fam, a, b, h = 1.8) { const grp = new B.Group(); grp.name = 'aura'; let upd = () => {};
  const glow = new B.Mesh(G.sph, add(a, 0.08)); glow.scale.set(0.55, h * 0.62, 0.45); glow.position.y = h * 0.52; glow.renderOrder = 3; grp.add(glow);
  if (fam === 'gravity') { // dark meteors orbiting on tilted rings + purple gravity ring
    const rocks = partList(grp, 8, i => { const m = new B.Mesh(G.ico, solid(i % 2 ? 0x4a3a5a : 0x2a2030)); const s = 0.07 + Math.random() * 0.07; m.scale.setScalar(s); const t = new B.Mesh(G.ico, add(0xb07aff, 0.5)); t.scale.setScalar(1.35); m.add(t); return m; });
    const ring = new B.Mesh(G.ring, add(0x9a5aff, 0.45)); ring.rotation.x = -Math.PI / 2; ring.scale.setScalar(0.95); ring.position.y = 0.05; grp.add(ring);
    upd = (t) => { rocks.forEach((m, i) => { const sp = 1.1 + (i % 3) * 0.35, ph = m.userData.ph * 6.28, r = 0.65 + (i % 3) * 0.18, tilt = (i % 4 - 1.5) * 0.35; const ang = t * sp + ph;
      m.position.set(Math.cos(ang) * r, h * 0.55 + Math.sin(ang) * r * tilt + Math.sin(t * 2 + i) * 0.06, Math.sin(ang) * r); m.rotation.set(t * 2 + i, t * 1.3, 0); }); ring.scale.setScalar(0.9 + Math.sin(t * 3) * 0.08); ring.material.opacity = 0.3 + Math.sin(t * 4) * 0.12; glow.material.color.setHex(0x6a3aaa); }; }
  else if (fam === 'fire' || fam === 'soul') { // flame tongues rising off the body
    const fl = partList(grp, 18, i => { const m = new B.Mesh(G.cone, add(i % 3 ? a : b, 0.95)); return m; });
    upd = (t) => { fl.forEach((m, i) => { const k = (t * 0.9 + m.userData.ph) % 1; const ang = m.userData.ph * 40 + i; const r = 0.28 + (1 - k) * 0.12; m.position.set(Math.cos(ang) * r, 0.2 + k * h * 0.95, Math.sin(ang) * r); const s = (1 - k) * 0.2 + 0.04; m.scale.set(s, s * 3.6, s); m.material.opacity = Math.min(1, (1 - k) * 1.3); m.rotation.y = t; }); glow.material.opacity = 0.1 + Math.sin(t * 9) * 0.04; };
    if (fam === 'soul') { const cl = new B.Mesh(G.sph, add(0xffffff, 0.35)); cl.scale.set(0.25, 0.14, 0.25); grp.add(cl); const u0 = upd; upd = (t, dt) => { u0(t, dt); cl.position.set(Math.cos(t * 1.4) * 0.8, h * 0.9 + Math.sin(t * 3) * 0.1, Math.sin(t * 1.4) * 0.8); }; } }
  else if (fam === 'ice') { // frost mist low around the feet + orbiting ice crystals
    const mist = partList(grp, 12, () => new B.Mesh(G.sph, add(0xd8f6ff, 0.22))); const cr = partList(grp, 6, () => { const m = new B.Mesh(G.oct, add(0xbfeaff, 0.85)); m.scale.set(0.04, 0.11, 0.04); return m; });
    upd = (t) => { mist.forEach((m, i) => { const k = (t * 0.25 + m.userData.ph) % 1; const ang = m.userData.ph * 30 + t * 0.3; const r = 0.4 + k * 0.6; m.position.set(Math.cos(ang) * r, 0.08 + k * 0.25, Math.sin(ang) * r); m.scale.set(0.1 + k * 0.16, 0.05 + k * 0.06, 0.1 + k * 0.16); m.material.opacity = Math.sin(k * Math.PI) * 0.2; });
      cr.forEach((m, i) => { const ang = t * 0.8 + i * 1.05; m.position.set(Math.cos(ang) * 0.6, h * 0.45 + Math.sin(t * 2 + i) * 0.25, Math.sin(ang) * 0.6); m.rotation.y = t * 2; }); }; }
  else if (fam === 'light') { // bright pulsing glow + sparkles
    glow.material.opacity = 0.25; const halo = new B.Mesh(G.tor, add(b, 0.8)); halo.rotation.x = Math.PI / 2; halo.scale.setScalar(0.22); halo.position.y = h * 1.02; grp.add(halo);
    const sp = partList(grp, 10, () => { const m = new B.Mesh(G.oct, add(0xffffff, 0.9)); m.scale.setScalar(0.035); return m; });
    upd = (t) => { glow.material.opacity = 0.2 + Math.sin(t * 5) * 0.08; glow.scale.set(0.6 + Math.sin(t * 5) * 0.04, h * 0.65, 0.5); halo.rotation.z = t; sp.forEach((m, i) => { const k = (t * 0.6 + m.userData.ph) % 1; const ang = m.userData.ph * 50; m.position.set(Math.cos(ang) * 0.5, k * h * 1.1, Math.sin(ang) * 0.5); m.scale.setScalar(0.04 * Math.sin(k * Math.PI)); }); }; }
  else if (fam === 'magma') { // lava drips from shoulders/arms + embers
    const dr = partList(grp, 10, () => new B.Mesh(G.sph, add(0xff5a10, 0.95))); const pool = new B.Mesh(G.ring, add(0xff3a0a, 0.5)); pool.rotation.x = -Math.PI / 2; pool.scale.setScalar(0.5); pool.position.y = 0.03; grp.add(pool);
    upd = (t) => { dr.forEach((m, i) => { const k = (t * 0.7 + m.userData.ph) % 1; const sx = (i % 2 ? 1 : -1) * (0.22 + (i % 3) * 0.04); m.position.set(sx, h * 0.8 * (1 - k * k), (i % 3 - 1) * 0.06); m.scale.set(0.045, 0.045 + k * 0.05, 0.045); m.material.color.setHex(k > 0.7 ? 0xff9a2a : 0xff4a10); }); pool.material.opacity = 0.35 + Math.sin(t * 3) * 0.12; glow.material.color.setHex(0xff3a0a); }; }
  else if (fam === 'dark') { // void wisps spiralling up + black disc
    glow.material.color.setHex(0x3a1a5a); const disc = new B.Mesh(new B.CircleGeometry(1, 32), new B.MeshBasicMaterial({ color: 0x0a0010, transparent: true, opacity: 0.7, depthWrite: false })); disc.rotation.x = -Math.PI / 2; disc.position.y = 0.03; disc.scale.setScalar(0.8); grp.add(disc);
    const w = partList(grp, 14, i => new B.Mesh(G.sph, i % 3 ? new B.MeshBasicMaterial({ color: 0x14001e, transparent: true, opacity: 0.8, depthWrite: false }) : add(0xb07aff, 0.7)));
    upd = (t) => { w.forEach((m, i) => { const k = (t * 0.4 + m.userData.ph) % 1; const ang = k * 9 + m.userData.ph * 6.28; const r = 0.5 * (1 - k * 0.5); m.position.set(Math.cos(ang) * r, k * h * 1.05, Math.sin(ang) * r); m.scale.setScalar(0.09 * (1 - k) + 0.02); }); disc.scale.setScalar(0.8 + Math.sin(t * 2) * 0.08); }; }
  else if (fam === 'quake') { // cracked ground ring + air cracks around fists
    const cr = new B.Group(); for (let i = 0; i < 9; i++) { const seg = new B.Group(); let x = 0.25, z = 0; const ang = i / 9 * 6.28; for (let j = 0; j < 4; j++) { const L = 0.14 + Math.random() * 0.1; const m = new B.Mesh(G.box, add(0xeaf6ff, 0.9)); m.scale.set(L, 0.01, 0.025); const a2 = ang + R(0.5); m.position.set(Math.cos(a2) * (x + L / 2), 0.02, Math.sin(a2) * (x + L / 2)); m.rotation.y = -a2; seg.add(m); x += L; } cr.add(seg); } grp.add(cr);
    const sh = partList(grp, 8, () => { const m = new B.Mesh(G.plane, add(0xffffff, 0.8)); m.scale.set(0.02, 0.18, 1); return m; });
    upd = (t) => { cr.children.forEach((s, i) => s.children.forEach(m => { m.material.opacity = 0.5 + 0.4 * Math.sin(t * 6 + i); })); sh.forEach((m, i) => { const ang = i / 8 * 6.28 + t; m.position.set(Math.cos(ang) * 0.45, h * 0.5 + Math.sin(t * 7 + i) * 0.2, Math.sin(ang) * 0.45); m.rotation.set(t * 3 + i, ang, 0.6); m.material.opacity = 0.5 + 0.5 * Math.sin(t * 11 + i * 2); }); }; }
  else if (fam === 'lightning') { // flickering zaps
    const zz = partList(grp, 7, () => { const m = new B.Mesh(G.box, add(b, 1)); m.scale.set(0.02, 0.35, 0.02); return m; });
    upd = (t) => { zz.forEach((m, i) => { if (Math.random() < 0.3) { const ang = Math.random() * 6.28; m.position.set(Math.cos(ang) * 0.4, Math.random() * h, Math.sin(ang) * 0.4); m.rotation.set(R(1.2), 0, R(1.2)); m.visible = Math.random() < 0.7; } }); glow.material.opacity = 0.1 + Math.random() * 0.08; }; }
  else if (fam === 'nika') { // Sun God: puffy cloud ring around the shoulders, steam rising, bouncing white glow
    glow.material.color.setHex(0xfff6d8); const sun = new B.Mesh(new B.CircleGeometry(1, 40), add(0xfff0b0, 0.35)); sun.scale.setScalar(0.42); sun.position.set(0, h * 0.78, 0.24); grp.add(sun); const rays = new B.Mesh(G.ring, add(0xffffff, 0.5)); rays.scale.setScalar(0.5); rays.position.copy(sun.position); grp.add(rays); const ring = new B.Group(); for (let i = 0; i < 12; i++) { const m = new B.Mesh(G.sph, new B.MeshToonMaterial({ color: 0xffffff, emissive: 0xb8b8c0, transparent: true, opacity: 0.95 })); const ang = i / 12 * 6.28; m.position.set(Math.cos(ang) * 0.36, 0, Math.sin(ang) * 0.36); m.scale.setScalar(0.08 + (i % 3) * 0.02); ring.add(m); } ring.position.y = h * 0.8; grp.add(ring);
    const steam = partList(grp, 8, () => new B.Mesh(G.sph, add(0xffffff, 0.2)));
    const halo = new B.Mesh(G.tor, add(0xfff3c0, 0.6)); halo.rotation.x = Math.PI / 2; halo.scale.setScalar(0.5); halo.position.y = h * 0.8; grp.add(halo);
    upd = (t) => { ring.rotation.y = t * 0.9; ring.children.forEach((m, i) => { m.position.y = Math.sin(t * 3 + i) * 0.03; }); const bo = Math.abs(Math.sin(t * 3.2)); glow.scale.set(0.55 + bo * 0.12, h * (0.6 + bo * 0.08), 0.48 + bo * 0.1); glow.material.opacity = 0.015 + bo * 0.025; sun.material.opacity = 0.18 + bo * 0.2; rays.scale.setScalar(0.48 + bo * 0.12); rays.material.opacity = 0.25 + bo * 0.35; halo.scale.setScalar(0.45 + bo * 0.15); halo.material.opacity = 0.2 + bo * 0.3;
      steam.forEach((m, i) => { const k = (t * 0.35 + m.userData.ph) % 1; const ang = m.userData.ph * 30; m.position.set(Math.cos(ang) * 0.42, h * 0.75 + k * h * 0.6, Math.sin(ang) * 0.42); m.scale.setScalar(0.03 + k * 0.05); m.material.opacity = Math.sin(k * Math.PI) * 0.18; }); }; }
  else { // spirit / plant / sound / string / time / mirror / gold / room / paw / beast: rising motes + family accents
    const sym = { plant: G.oct, mirror: G.oct, gold: G.oct, string: G.box, time: G.box }[fam] || G.sph;
    const mo = partList(grp, 14, i => { const m = new B.Mesh(sym, add(i % 2 ? a : b, 0.8)); return m; });
    const ring = new B.Mesh(fam === 'sound' || fam === 'time' || fam === 'room' ? G.tor : G.ring, add(a, 0.4)); ring.rotation.x = -Math.PI / 2; ring.position.y = fam === 'room' ? h * 0.5 : 0.05; ring.scale.setScalar(fam === 'room' ? 1.1 : 0.8); grp.add(ring);
    upd = (t) => { mo.forEach((m, i) => { const k = (t * 0.5 + m.userData.ph) % 1; const ang = m.userData.ph * 40 + t * (fam === 'string' ? 2 : 0.6); const r = 0.35 + Math.sin(k * 3) * 0.15; m.position.set(Math.cos(ang) * r, k * h * 1.05, Math.sin(ang) * r);
      const s = 0.05 * Math.sin(k * Math.PI) + 0.01; if (fam === 'string') m.scale.set(0.006, 0.25, 0.006); else m.scale.setScalar(s); m.rotation.set(t, t * 1.3, 0); }); ring.scale.setScalar((fam === 'room' ? 1.1 : 0.8) + Math.sin(t * 2.5) * 0.08); ring.rotation.z = t * 0.5; ring.material.opacity = 0.25 + Math.sin(t * 3) * 0.1; }; }
  grp.traverse(o => { if (o.isMesh) { o.frustumCulled = false; if (o.geometry && Object.values(G).includes(o.geometry)) o.userData.shared = true; } });
  return { grp, upd }; }
// ---------------- sync one avatar with its visual state ----------------
// c = makeChar result, vis = visCos object, AWK table for colours
export function syncAvatar(c, vis, t, AWK) { if (!c || !c.root) return; const st = c._bfx || (c._bfx = {}); vis = vis || {};
  const hk = vis.hk && HAKI_COLORS[vis.hk] ? vis.hk : ''; if (hk !== st.hk) { dropCoat(c); if (hk) avatarCoat(c, hk); st.hk = hk; }
  const aw = vis.aw || ''; if (aw !== st.aw) { if (st.aura) { st.aura.grp.removeFromParent(); st.aura = null; } st.aw = aw; const A = AWK && AWK[aw]; if (aw) { const fam = AURA_FAMILY[aw] || 'spirit'; st.aura = makeAura(fam, A ? A.a : 0xffffff, A ? A.b : 0xffffff, 1.8); st.aura.grp.scale.setScalar(1 / (c.root.scale.x || 1)); c.root.add(st.aura.grp); } }
  if (st.aura) { st.aura.grp.scale.setScalar(Math.max(0.6, (c.height || 1.8) / 1.8) / (c.root.scale.x || 1)); st.aura.upd(t); } }
// first-person: small copy of the aura around each fist
export function syncFpAura(g, aw, AWK) { const vm = g.vm; if (!vm) return; const st = vm._bfx || (vm._bfx = {}); const key = aw + ':' + (vm.armL && vm.armL.uuid);
  if (key !== st.key) { for (const a of st.list || []) a.grp.removeFromParent(); st.list = []; st.key = key; if (aw && vm.armL && vm.armR) { const A = AWK[aw]; const fam = AURA_FAMILY[aw] || 'spirit'; for (const arm of [vm.armL, vm.armR]) { const au = makeAura(fam, A ? A.a : 0xffffff, A ? A.b : 0xffffff, 0.5); au.grp.scale.setScalar(0.26); au.grp.position.set(0, -0.08, -0.32); au.grp.children[0].visible = false; arm.add(au.grp); st.list.push(au); } } }
  for (const a of st.list || []) a.upd(g.t); }
// ---------------- Conqueror's Haki ----------------
const fxList = []; // own transient effects (groups)
function boltPath(a, b, segs, jit) { const pts = [a.clone()]; const d = b.clone().sub(a); for (let i = 1; i < segs; i++) { const p = a.clone().addScaledVector(d, i / segs); p.x += R(jit); p.y += R(jit); p.z += R(jit); pts.push(p); } pts.push(b.clone()); return pts; }
const BLK = new B.MeshBasicMaterial({ color: 0x050005 }); const RED = new B.MeshBasicMaterial({ color: 0xff1a2a, side: B.BackSide }); const REDG = add(0xff2a3a, 0.22); BLK.userData.keep = RED.userData.keep = REDG.userData.keep = true;
function boltMesh(pts, w) { const grp = new B.Group(); for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; const d = b.clone().sub(a); const L = d.length(); const mid = a.clone().addScaledVector(d, 0.5); const q = new B.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize());
  const core = new B.Mesh(G.box, BLK); core.scale.set(w, L + w, w); core.position.copy(mid); core.quaternion.copy(q); const out = new B.Mesh(G.box, RED); out.scale.set(w * 2.2, L + w * 1.6, w * 2.2); out.position.copy(mid); out.quaternion.copy(q); const gl = new B.Mesh(G.box, REDG); gl.scale.set(w * 3.4, L * 0.9, w * 3.4); gl.position.copy(mid); gl.quaternion.copy(q); grp.add(out, core, gl); }
  grp.traverse(o => { o.userData.shared = true; o.frustumCulled = false; }); return grp; }
// branching black bolts with red outlines from c outwards; recrackle every 70ms
export function conqFx(g, c, radius = 14) { const root = new B.Group(); g.scene.add(root); const dome = new B.Mesh(G.sph, new B.MeshBasicMaterial({ color: 0x14000a, transparent: true, opacity: 0.35, side: B.BackSide, depthWrite: false })); dome.position.copy(c); root.add(dome);
  const rim = new B.Mesh(G.sph, add(0xff1a2a, 0.35)); rim.position.copy(c); root.add(rim); const gr = new B.Mesh(G.ring, add(0xff1a2a, 0.9)); gr.rotation.x = -Math.PI / 2; gr.position.set(c.x, c.y - 0.9, c.z); root.add(gr); const gr2 = new B.Mesh(G.ring, new B.MeshBasicMaterial({ color: 0x050005, transparent: true, opacity: 0.85, side: B.DoubleSide, depthWrite: false })); gr2.rotation.x = -Math.PI / 2; gr2.position.set(c.x, c.y - 0.88, c.z); root.add(gr2);
  let bolts = new B.Group(); root.add(bolts); let k = 0;
  const crackle = (s) => { root.remove(bolts); bolts = new B.Group(); root.add(bolts); const n = 11; for (let i = 0; i < n; i++) { const a = (i / n) * 6.28 + R(0.3); const len = radius * (0.35 + Math.random() * 0.65) * Math.min(1, 0.4 + s); const end = c.clone().add(V(Math.cos(a) * len, R(1.6) + 0.3, Math.sin(a) * len));
      const pts = boltPath(c.clone().add(V(Math.cos(a) * 1.6, R(0.4), Math.sin(a) * 1.6)), end, 8, 0.9); bolts.add(boltMesh(pts, 0.045 + Math.random() * 0.035));
      if (Math.random() < 0.6) { const j = 2 + Math.floor(Math.random() * 3); const s0 = pts[j]; const e2 = s0.clone().add(V(R(4), R(2), R(4))); bolts.add(boltMesh(boltPath(s0, e2, 4, 0.6), 0.035)); } } };
  crackle(0); g.fx.shake = Math.max(g.fx.shake, 0.9); screenPulse();
  fxList.push({ root, life: 0, max: 1.3, fn: (t, dt) => { k += dt; if (k > 0.07) { k = 0; if (t < 0.8) crackle(t); else bolts.visible = false; } const e = 1 - Math.pow(1 - t, 3); dome.scale.setScalar(0.5 + e * radius); dome.material.opacity = 0.4 * (1 - t); rim.scale.setScalar(0.6 + e * radius * 1.02); rim.material.opacity = 0.35 * (1 - t);
    gr.scale.setScalar(0.5 + e * radius * 1.1); gr.material.opacity = 0.9 * (1 - t); gr2.scale.setScalar(0.45 + e * radius * 1.05); gr2.material.opacity = 0.85 * (1 - t); } }); }
function screenPulse() { if (typeof document === 'undefined') return; let el = document.getElementById('conqFlash'); if (!el) { el = document.createElement('div'); el.id = 'conqFlash'; document.body.appendChild(el); } el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); }
export function updateFx(dt) { T.v += dt; for (let i = fxList.length - 1; i >= 0; i--) { const o = fxList[i]; o.life += dt; const t = Math.min(1, o.life / o.max); try { o.fn(t, dt); } catch (e) { o.life = o.max; } if (t >= 1) { o.root.removeFromParent(); fxList.splice(i, 1); } } }
export const _fxCount = () => fxList.length;
