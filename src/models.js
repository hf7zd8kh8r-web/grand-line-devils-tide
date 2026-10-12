import { THREE, Builder, mat, toonMat, OUTLINE_MAT, WORLD_MAT, rng } from './engine.js';
const B = THREE;
const box = (w, h, d) => new B.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, s = 8) => new B.CylinderGeometry(rt, rb, h, s);
const sph = (r, w = 10, h = 8) => new B.SphereGeometry(r, w, h);
const cone = (r, h, s = 8) => new B.ConeGeometry(r, h, s);

export { makeChar, animChar, LOOKS, HAIRS, HATS, MOUTHS, SKIN } from './chars.js';
import { makeChar as _mc } from './chars.js';
import { lookOverrides } from './style.js';
export function makeAvatar(faction, race, look, cos) { return _mc(faction === 'Marine' ? 'player_marine' : 'player_pirate', { hat: undefined, cape: undefined, collar: undefined, open: undefined, ...lookOverrides(look, race, faction, cos || {}) }); }

// ---------- Devil fruit mesh ----------
export function fruitMaterial(c1, c2, pat = 1) {
  return new B.ShaderMaterial({
    uniforms: { c1: { value: new B.Color(c1) }, c2: { value: new B.Color(c2) }, t: { value: 0 }, pat: { value: pat }, glow: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vP; varying vec3 vV; void main(){ vN=normalize(normalMatrix*normal); vP=position; vec4 mv=modelViewMatrix*vec4(position,1.); vV=-mv.xyz; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 c1; uniform vec3 c2; uniform float t; uniform float pat; uniform float glow; varying vec3 vN; varying vec3 vP; varying vec3 vV;
      void main(){ vec3 p=normalize(vP); float a=atan(p.z,p.x); float lat=asin(clamp(p.y,-1.,1.));
        float sw = sin(a*3.0 + lat*9.0*pat + t*0.6);
        float sw2 = sin(a*5.0 - lat*6.0 + 1.3);
        float m = smoothstep(0.15,0.35,sw) * (0.6+0.4*smoothstep(-.2,.2,sw2));
        vec3 col = mix(c1, c2, m);
        float ring = smoothstep(0.92,1.0, fract((lat*6.0+a*1.0)/3.1416*3.0));
        col = mix(col, col*0.55, ring*0.6);
        vec3 L=normalize(vec3(0.5,0.8,0.6)); float d=dot(normalize(vN),L); float tone = d>0.55?1.0:(d>0.0?0.78:0.55);
        col*=tone; float rim = pow(1.0-max(dot(normalize(vN),normalize(vV)),0.0),2.5); col += rim*(c1*0.6+0.3)*(0.6+glow);
        float spec = pow(max(dot(reflect(-L,normalize(vN)),normalize(vV)),0.0),28.0); col += step(0.5,spec)*0.5;
        gl_FragColor=vec4(col + glow*c1*0.35,1.0);
#include <colorspace_fragment>

      }`,
  });
}
export function makeFruit(c1, c2, pat = 1, scale = 1) {
  const g = new B.Group();
  const m = fruitMaterial(c1, c2, pat);
  const body = new B.Mesh(new B.SphereGeometry(0.5, 32, 24), m); body.scale.set(1, 0.92, 1); g.add(body);
  const o = new B.Mesh(new B.SphereGeometry(0.53, 20, 16), OUTLINE_MAT); o.scale.copy(body.scale); g.add(o);
  const b = new Builder();
  b.add(cyl(0.035, 0.05, 0.35, 6), 0x3d2a14, mat(0.02, 0.58, 0, 0, 0, -0.3), { ot: 0.02 });
  b.add(new B.SphereGeometry(0.2, 8, 4), 0x2fae3d, mat(0.18, 0.66, 0, 0, 0, -1.0, 1.6, 0.18, 0.8), { ot: 0.02 });
  b.add(new B.SphereGeometry(0.16, 8, 4), 0x2fae3d, mat(-0.12, 0.64, 0.05, 0, 0.6, 0.9, 1.6, 0.18, 0.8), { ot: 0.02 });
  g.add(b.build(WORLD_MAT));
  g.scale.setScalar(scale); g.userData.mat = m;
  return g;
}

// ---------- Ships ----------
export function makeShip(opts = {}) {
  const b = new Builder(); const s = opts.size || 1; const hull = opts.hull || 0x8a5a2b; const sail = opts.sail ?? 0xf3ecd8;
  b.add(box(2.2 * s, 1.0 * s, 6 * s), hull, mat(0, 0.5 * s, 0), { grad: 0.4 });
  b.add(cone(1.1 * s, 2.4 * s, 4), hull, mat(0, 0.5 * s, 4.1 * s, Math.PI / 2, Math.PI / 4, 0, 1, 1, 0.45 / 1), {});
  b.add(box(2.3 * s, 0.15 * s, 6.1 * s), 0x5a3a1a, mat(0, 1.05 * s, 0));
  b.add(box(2.0 * s, 0.9 * s, 1.6 * s), hull, mat(0, 1.4 * s, -2.4 * s));
  b.add(cyl(0.1 * s, 0.13 * s, 6 * s, 6), 0x5a3a1a, mat(0, 3.8 * s, 0.4 * s));
  if (sail !== null) {
    b.add(box(3.4 * s, 2.6 * s, 0.1 * s), sail, mat(0, 4.2 * s, 0.5 * s, 0.08, 0, 0));
    if (opts.mark) b.add(box(1.0 * s, 1.0 * s, 0.05 * s), opts.mark, mat(0, 4.3 * s, 0.6 * s), { outline: false });
  }
  if (opts.figure) b.add(sph(0.5 * s, 10, 8), opts.figure, mat(0, 1.4 * s, 4.6 * s));
  return b.build(WORLD_MAT);
}
export function makeBoatSmall() {
  const b = new Builder();
  b.add(box(1.4, 0.6, 3.4), 0x9a6a35, mat(0, 0.3, 0), { grad: 0.4 });
  b.add(cone(0.7, 1.3, 4), 0x9a6a35, mat(0, 0.3, 2.3, Math.PI / 2, Math.PI / 4, 0, 1, 1, 0.43));
  b.add(cyl(0.06, 0.07, 3, 6), 0x5a3a1a, mat(0, 1.8, 0.4));
  b.add(box(1.8, 1.5, 0.06), 0xf3ecd8, mat(0, 2.2, 0.45));
  return b.build(WORLD_MAT);
}

// ---------- Props (added into a world builder) ----------
export function addTree(b, x, y, z, r = 1, kind = 0, rr = Math.random) {
  if (kind === 1) { // palm
    const h = 4.5 * r; b.add(cyl(0.12 * r, 0.2 * r, h, 6), 0x8a6a3a, mat(x, y + h / 2, z, 0.08, 0, 0.1));
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; b.add(box(0.5 * r, 0.06, 2.2 * r), 0x3faa45, mat(x + Math.sin(a) * 0.9 * r + 0.2, y + h - 0.2, z + Math.cos(a) * 0.9 * r, -0.35, a, 0), { ot: 0.02 }); }
    return;
  }
  const h = (1.4 + rr() * 0.8) * r;
  b.add(cyl(0.16 * r, 0.24 * r, h, 6), 0x7a5230, mat(x, y + h / 2, z));
  const g = [0x3e9b3f, 0x4caf50, 0x2f8a3a][Math.floor(rr() * 3)];
  b.add(new B.IcosahedronGeometry(1.1 * r, 0), g, mat(x, y + h + 0.6 * r, z, rr(), rr(), 0), { grad: 0.3 });
  b.add(new B.IcosahedronGeometry(0.8 * r, 0), g, mat(x + 0.5 * r, y + h + 1.2 * r, z + 0.2 * r, rr(), rr(), 0), { grad: 0.3 });
  b.add(new B.IcosahedronGeometry(0.7 * r, 0), g, mat(x - 0.5 * r, y + h + 1.0 * r, z - 0.3 * r, rr(), rr(), 0), { grad: 0.3 });
}
export function addPine(b, x, y, z, r = 1) {
  b.add(cyl(0.12 * r, 0.18 * r, 1.2 * r, 6), 0x6a4528, mat(x, y + 0.6 * r, z));
  b.add(cone(1.2 * r, 2.2 * r, 7), 0x2f7a3a, mat(x, y + 2.0 * r, z), { grad: 0.3 });
  b.add(cone(0.85 * r, 1.7 * r, 7), 0x3a8f42, mat(x, y + 3.0 * r, z), { grad: 0.3 });
}
export function addRock(b, x, y, z, r = 1, rr = Math.random) { b.add(new B.DodecahedronGeometry(r, 0), 0x8a8f96, mat(x, y + r * 0.3, z, rr() * 3, rr() * 3, 0, 1, 0.7, 1), { grad: 0.3 }); }
// house: returns collision box
export function addHouse(b, x, y, z, rot = 0, o = {}) {
  const w = o.w || 5, d = o.d || 4.5, h = o.h || 3, wall = o.wall || 0xf1e2c0, roof = o.roof || 0xc0503a;
  const M = (lx, ly, lz, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { const m = mat(lx, ly, lz, rx, ry, rz, sx, sy, sz); return new B.Matrix4().makeRotationY(rot).setPosition(x, y, z).multiply(m); };
  b.add(box(w + 0.3, 0.4, d + 0.3), 0x8a7a6a, M(0, 0.1, 0));
  b.add(box(w, h, d), wall, M(0, h / 2 + 0.2, 0), { grad: 0.25 });
  // beams
  for (const sx of [-1, 1]) b.add(box(0.18, h, 0.18), 0x6a4528, M(sx * w / 2, h / 2 + 0.2, d / 2), { outline: false });
  b.add(box(w + 0.1, 0.18, 0.18), 0x6a4528, M(0, h + 0.15, d / 2), { outline: false });
  // roof: triangular prism via cylinder 3 sides
  const rg = new B.CylinderGeometry(d * 0.72, d * 0.72, w + 0.8, 3);
  b.add(rg, roof, M(0, h + 0.2 + d * 0.36 * 0.98, 0, 0, 0, Math.PI / 2, 1, 1, 1).multiply(new B.Matrix4().makeRotationY(Math.PI / 2)), { grad: 0.2 });
  // door + windows
  b.add(box(0.9, 1.7, 0.1), 0x6a3f22, M(0, 1.05, d / 2 + 0.03), { outline: false });
  for (const sx of [-1, 1]) { b.add(box(0.8, 0.8, 0.1), 0x9fd3ff, M(sx * w * 0.3, h * 0.6 + 0.2, d / 2 + 0.03), { outline: false }); b.add(box(0.95, 0.12, 0.12), 0x6a4528, M(sx * w * 0.3, h * 0.6 - 0.25, d / 2 + 0.06), { outline: false }); }
  if (o.chimney) b.add(box(0.5, 1.5, 0.5), 0x9a6a5a, M(w * 0.25, h + 1.4, -d * 0.15));
  if (o.sign) { b.add(box(1.6, 0.6, 0.08), 0x8a5a2b, M(0, h - 0.2, d / 2 + 0.25)); b.add(box(1.3, 0.35, 0.02), o.sign, M(0, h - 0.2, d / 2 + 0.3), { outline: false }); }
  return { x, z, hw: (w + 0.3) / 2, hd: (d + 0.3) / 2, rot };
}
export function addWindmill(b, x, y, z, rot = 0) {
  const M = (lx, ly, lz, rx = 0, ry = 0, rz = 0) => new B.Matrix4().makeRotationY(rot).setPosition(x, y, z).multiply(mat(lx, ly, lz, rx, ry, rz));
  b.add(cyl(1.4, 2.4, 7, 8), 0xf0e6d0, M(0, 3.5, 0), { grad: 0.25 });
  b.add(cone(1.9, 2.4, 8), 0x8a3a2a, M(0, 8.2, 0), { grad: 0.2 });
  b.add(box(0.9, 1.6, 0.2), 0x6a3f22, M(0, 0.8, 2.25), { outline: false });
  b.add(box(0.6, 0.6, 0.2), 0x9fd3ff, M(0, 4.6, 1.75, -0.13), { outline: false });
  return { x, z, r: 2.5 };
}
export function makeWindmillBlades() {
  const b = new Builder();
  b.add(cyl(0.3, 0.3, 0.6, 8), 0x6a4528, mat(0, 0, 0, Math.PI / 2));
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const cx = Math.sin(a) * 2.6, cy = Math.cos(a) * 2.6;
    b.add(box(0.15, 5.2, 0.12), 0x6a4528, mat(cx / 2, cy / 2, 0.3, 0, 0, -a));
    b.add(box(1.1, 3.8, 0.06), 0xf6f0e0, mat(Math.sin(a) * 3.2 + Math.cos(a) * 0.6, Math.cos(a) * 3.2 - Math.sin(a) * 0.6, 0.35, 0, 0, -a)); }
  return b.build(WORLD_MAT);
}
export function addDock(b, x, y, z, rot = 0, len = 12) {
  const M = (lx, ly, lz) => new B.Matrix4().makeRotationY(rot).setPosition(x, y, z).multiply(mat(lx, ly, lz));
  b.add(box(3, 0.25, len), 0xa07a4a, M(0, 0.6, len / 2), { grad: 0.2 });
  for (let i = 0; i <= len; i += 3) for (const s of [-1, 1]) b.add(cyl(0.15, 0.15, 3, 6), 0x6a4528, M(s * 1.4, -0.6, i));
}
export function addFence(b, x1, z1, x2, z2, hf) {
  const n = Math.max(1, Math.round(Math.hypot(x2 - x1, z2 - z1) / 2));
  for (let i = 0; i <= n; i++) { const x = x1 + (x2 - x1) * i / n, z = z1 + (z2 - z1) * i / n; b.add(box(0.14, 1, 0.14), 0x8a6a3a, mat(x, hf(x, z) + 0.5, z), { outline: false }); }
  const a = Math.atan2(x2 - x1, z2 - z1); const L = Math.hypot(x2 - x1, z2 - z1);
  for (const yy of [0.45, 0.85]) { const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2; b.add(box(0.08, 0.1, L), 0x9a7a4a, mat(mx, hf(mx, mz) + yy, mz, 0, a, 0), { outline: false }); }
}
