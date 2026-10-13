// First-person viewmodel animation: keyframed sword swings (anticipation -> eased strike -> overshoot -> follow-through -> recovery)
// with hands IK'd onto the hilt, tapered crescent slash arcs, impact sparks, camera sway; plus fruit cast poses
// (charge glow, jab / two-hand push / raise / slam / chop / claw / stretch) with release flash and recoil.
import { THREE } from './engine.js';
const B = THREE; const D2R = Math.PI / 180;
const v3 = (x = 0, y = 0, z = 0) => new B.Vector3(x, y, z);
const eOut3 = x => 1 - Math.pow(1 - x, 3), sstep = x => x * x * (3 - 2 * x), c01 = x => Math.max(0, Math.min(1, x));
const FWD = v3(0, 0, -1); const scr = d => v3(Math.cos(d * D2R), Math.sin(d * D2R), 0);
const _m = new B.Matrix4(), _x = v3(), _y = v3(), _z = v3(), _t = v3();
// quaternion for a blade pointing along d with its cutting edge facing e (pivot local +y = blade, -z = edge)
export function bladeQuat(d, e, out) { _y.copy(d).normalize(); _z.copy(e).addScaledVector(_y, -e.dot(_y)); if (_z.lengthSq() < 1e-6) _z.set(0, 0, -1).addScaledVector(_y, _y.z); _z.normalize().negate(); _x.crossVectors(_y, _z).normalize(); _z.crossVectors(_x, _y); return out.setFromRotationMatrix(_m.makeBasis(_x, _y, _z)); }
// ---- swing library. arc: blade sweeps a cone from screen direction A (deg) through "forward" to -A ----
const P0 = [0.1, -0.42, -0.78];
// arc swings: blade tip wipes across the screen (rotation a0->a1 from screen dir A toward side Cs = A-90*cw), hands travel from +A to -A
export const SWINGS = {
  diag: { A: 135, cw: 1, a0: -12, a1: 158, P0: [0.08, -0.34, -0.8], hr: 0.3, dep: 0.16, fb: 0.5, cam: { r: -0.05, y: 0.02, p: -0.015 }, lunge: 2.2 },
  rise: { A: -35, cw: 1, a0: -12, a1: 165, P0: [0.1, -0.32, -0.8], hr: 0.3, dep: 0.16, fb: 0.5, cam: { r: 0.045, y: 0.025, p: 0.015 }, lunge: 2.2 },
  sweep: { A: 4, cw: 1, a0: 8, a1: 176, P0: [0.06, -0.3, -0.85], hr: 0.44, dep: 0.18, fb: 0.5, cam: { r: 0.015, y: 0.055, p: 0 }, lunge: 2.4 },
  over: { A: 92, Cv: [1, 0, -0.55], a0: -18, a1: 168, P0: [0.04, -0.3, -0.8], hr: 0.3, dep: 0.2, fb: 0.12, cam: { r: 0, y: 0, p: -0.06 }, lunge: 4.2, Ts: 0.11, heavy: 1 },
  thrust: { line: 1, p0: [0.38, -0.42, -0.45], p1: [0.06, -0.26, -1.15], d: [-0.4, 0.34, -1], e: [-0.3, -1, 0], cam: { r: 0, y: 0, p: 0.015 }, lunge: 4.6, Ts: 0.08, fov: 4 },
  iai: { A: 182, cw: -1, a0: 4, a1: 182, P0: [0.0, -0.42, -0.8], hr: 0.5, dep: 0.2, fb: 0.7, cam: { r: -0.03, y: -0.07, p: 0 }, lunge: 0, Ts: 0.06, Tw: 0.3, big: 1 },
  spinA: { A: 4, cw: 1, a0: 4, a1: 184, P0: [0.04, -0.26, -0.82], hr: 0.48, dep: 0.18, fb: 0.45, cam: { r: 0.03, y: 0.09, p: 0 }, lunge: 0, Ts: 0.08, Tw: 0.05, big: 1 },
  spinB: { A: 176, cw: -1, a0: 4, a1: 184, P0: [0.04, -0.26, -0.82], hr: 0.48, dep: 0.18, fb: 0.45, cam: { r: -0.03, y: -0.09, p: 0 }, lunge: 0, Ts: 0.08, Tw: 0.04, big: 1 },
};
export const COMBO = ['diag', 'rise', 'sweep', 'over', 'thrust'];
const _A = v3(), _C = v3();
export function swingPose(S, u, out) { // -> out.p (hand/grip), out.d (blade dir), out.e (edge dir)
  if (S.line) { const k = u; out.p.fromArray(S.p0).lerp(_t.fromArray(S.p1), k); out.d.fromArray(S.d).normalize(); out.d.y += (1 - c01(k)) * 0.35; out.d.normalize(); out.e.fromArray(S.e); return out; }
  const a = (S.a0 + (S.a1 - S.a0) * u) * D2R, ca = Math.cos(a), sa = Math.sin(a); _A.copy(scr(S.A)); if (S.Cv) _C.fromArray(S.Cv).normalize(); else _C.copy(scr(S.A - 90 * (S.cw || 1)));
  out.d.copy(_A).multiplyScalar(ca).addScaledVector(_C, sa).addScaledVector(FWD, S.fb).normalize();
  out.p.fromArray(S.P0).addScaledVector(_A, S.hr * ca).addScaledVector(FWD, S.dep * Math.max(0, sa));
  out.e.copy(_A).multiplyScalar(-sa).addScaledVector(_C, ca); return out; }
const mirror = o => { o.p.x = -o.p.x; o.d.x = -o.d.x; o.e.x = -o.e.x; return o; };
// ---- crescent slash arc (tapered, white core -> coloured rim, head-reveal + fast fade); 3 vertex rows across the width ----
const CRES_N = 30, ROWS = [0, 0.1, 0.5, 1], NR = 4;
export class Crescent {
  constructor(parent) { const g = new B.BufferGeometry(); const n = CRES_N * NR; g.setAttribute('position', new B.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('color', new B.BufferAttribute(new Float32Array(n * 4), 4));
    const id = []; for (let i = 0; i < CRES_N - 1; i++) for (let r = 0; r < NR - 1; r++) { const a = i * NR + r, b = a + NR; id.push(a, a + 1, b, a + 1, b + 1, b); } g.setIndex(id);
    this.mat = new B.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, depthTest: false, side: B.DoubleSide, toneMapped: false });
    this.m = new B.Mesh(g, this.mat); this.m.frustumCulled = false; this.m.visible = false; this.m.renderOrder = 5; parent.add(this.m); this.o = { p: v3(), d: v3(), e: v3() }; this.col = new B.Color(0x4aa8ff); this.head = -1; }
  build(S, u0, u1, L, mir, xk, big) { const P = this.m.geometry.attributes.position; const o = this.o; const W = big ? 0.7 : 0.58;
    for (let i = 0; i < CRES_N; i++) { const s = i / (CRES_N - 1); swingPose(S, u0 + (u1 - u0) * s, o); if (mir) { o.p.x = -o.p.x; o.d.x = -o.d.x; } const taper = Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.05)), 0.75) * W;
      for (let r = 0; r < NR; r++) { const q = _t.copy(o.p).addScaledVector(o.d, L * 1.06 + (big ? 0.12 : 0) - L * taper * ROWS[r]); P.setXYZ(i * NR + r, q.x * xk, q.y, q.z); } }
    P.needsUpdate = true; this.head = -1; }
  set(head, fade, col) { const on = fade > 0.01 && head > 0; this.m.visible = on; if (!on) return; if (col != null) this.col.setHex(col); const C = this.m.geometry.attributes.color; const c = this.col; const tail = 0.75;
    for (let i = 0; i < CRES_N; i++) { const s = i / (CRES_N - 1); const vis = s > head + 0.02 ? 0 : sstep(c01((s - (head - tail)) / tail)); const a = vis * fade;
      const k = i * NR; C.setXYZW(k, 1, 1, 1, a); C.setXYZW(k + 1, 0.4 + c.r * 0.6, 0.4 + c.g * 0.6, 0.4 + c.b * 0.6, a); C.setXYZW(k + 2, c.r, c.g, c.b, a * 0.8); C.setXYZW(k + 3, c.r, c.g, c.b, 0); } C.needsUpdate = true; }
}
// ---- impact sparks + star flash (viewmodel space) ----
let STAR = null; function starTex() { if (STAR) return STAR; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, r = i % 2 ? 7 : 32; c.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } c.fill(); return (STAR = new B.CanvasTexture(cv)); }
export class Sparks {
  constructor(parent) { this.n = 14; const g = new B.BufferGeometry(); g.setAttribute('position', new B.BufferAttribute(new Float32Array(this.n * 6), 3)); this.mat = new B.LineBasicMaterial({ color: 0xfff2c0, transparent: true, blending: B.AdditiveBlending, depthWrite: false });
    this.l = new B.LineSegments(g, this.mat); this.l.frustumCulled = false; this.l.visible = false; parent.add(this.l); this.v = []; this.p = []; for (let i = 0; i < this.n; i++) { this.v.push(v3()); this.p.push(v3()); }
    this.fm = new B.MeshBasicMaterial({ map: starTex(), transparent: true, blending: B.AdditiveBlending, depthWrite: false, color: 0xffffff }); this.f = new B.Mesh(new B.PlaneGeometry(0.32, 0.32), this.fm); this.f.visible = false; this.f.renderOrder = 6; parent.add(this.f); this.t = 1; }
  fire(at, col = 0xffffff, k = 1) { this.t = 0; this.k = k; this.f.position.copy(at); this.f.rotation.z = Math.random() * 6.28; this.fm.color.setHex(col); this.mat.color.setHex(col).lerp(new B.Color(0xffffff), 0.6);
    for (let i = 0; i < this.n; i++) { this.p[i].copy(at); const a = Math.random() * 6.283; this.v[i].set(Math.cos(a), Math.sin(a) * 0.8, -0.3 - Math.random() * 0.4).multiplyScalar((2.2 + Math.random() * 2.8) * k); } }
  update(dt) { this.t += dt; const L = 0.2; const on = this.t < L; this.l.visible = this.f.visible = on; if (!on) return; const u = this.t / L; const P = this.l.geometry.attributes.position;
    for (let i = 0; i < this.n; i++) { const p = this.p[i], v = this.v[i]; p.addScaledVector(v, dt); v.multiplyScalar(Math.exp(-dt * 7)); v.y -= dt * 3; P.setXYZ(i * 2, p.x, p.y, p.z); P.setXYZ(i * 2 + 1, p.x - v.x * 0.045, p.y - v.y * 0.045, p.z - v.z * 0.045); } P.needsUpdate = true;
    this.mat.opacity = 1 - u; const s = (u < 0.25 ? u / 0.25 : 1 - (u - 0.25) / 0.75) * 0.9 * this.k + 0.01; this.f.scale.setScalar(s); this.fm.opacity = 1 - u * u; }
}
// ---- arm IK: put the arm's fist on `hand`, forearm pointing from `sh` (off-screen shoulder); thumb side faces `tw` ----
export function placeArm(A, hand, sh, tw, side) { _z.copy(hand).sub(sh).normalize(); const dir = _t.copy(_z); _z.negate(); // local -z points to the hand
  _x.copy(tw).addScaledVector(_z, -tw.dot(_z)); if (_x.lengthSq() < 1e-5) _x.set(1, 0, 0).addScaledVector(_z, -_z.x); _x.normalize().multiplyScalar(-side); // thumb is at local -x*side
  _y.crossVectors(_z, _x).normalize(); _x.crossVectors(_y, _z); A.quaternion.setFromRotationMatrix(_m.makeBasis(_x, _y, _z)); A.position.copy(hand).addScaledVector(dir, -0.41); }
// ---- fruit cast poses: [charge R, charge L], [release R, release L] (root units, right-handed; side -1 mirrors one-hand kinds) ----
export const POSES = {
  jab: { C: [[0.4, -0.36, -0.28], [-0.4, -0.44, -0.46]], X: [[0.08, -0.22, -1.08], [-0.46, -0.5, -0.38]], one: 1, kick: [0.018, 3, 0.01], rec: 0.12 },
  palm: { C: [[0.42, -0.3, -0.3], [-0.38, -0.46, -0.46]], X: [[0.04, -0.2, -1.0], [-0.44, -0.5, -0.36]], one: 1, kick: [0.025, 4, 0.0], rec: 0.18, hold: 0.08 },
  stretch: { C: [[0.44, -0.34, -0.22], [-0.4, -0.46, -0.44]], X: [[0.06, -0.22, -1.08], [-0.44, -0.5, -0.36]], one: 1, kick: [0.02, 4, 0.01], rec: 0.1, str: 1 },
  push: { C: [[0.24, -0.36, -0.26], [-0.24, -0.36, -0.26]], X: [[0.1, -0.2, -1.0], [-0.1, -0.2, -1.0]], kick: [0.035, 6, 0], rec: 0.2, hold: 0.32 },
  raise: { C: [[0.3, -0.62, -0.5], [-0.3, -0.62, -0.5]], X: [[0.42, 0.14, -0.98], [-0.42, 0.14, -0.98]], kick: [0.05, 3, 0], rec: 0.06, hold: 0.3, cp: 0.05 },
  slam: { C: [[0.2, 0.16, -0.8], [-0.2, 0.16, -0.8]], X: [[0.14, -0.66, -0.92], [-0.14, -0.66, -0.92]], kick: [0, 6, 0], rec: -0.06, hold: 0.18, cp: -0.07 },
  chop: { C: [[0.62, -0.02, -0.55], [-0.42, -0.48, -0.44]], X: [[-0.34, -0.36, -0.92], [-0.46, -0.52, -0.38]], one: 1, kick: [0.01, 2, -0.03], rec: 0.04 },
  claw: { C: [[0.5, 0.18, -0.6], [-0.42, -0.48, -0.44]], X: [[-0.06, -0.62, -0.88], [-0.46, -0.52, -0.38]], one: 1, kick: [0.0, 2, 0.03], rec: 0.04 },
};
export const REST = [[0.42, -0.4, -0.5], [-0.42, -0.4, -0.5]];
export const CHARGE = [[0.18, -0.46, -0.42], [-0.18, -0.46, -0.42]];
export { eOut3, sstep, c01, v3 };
