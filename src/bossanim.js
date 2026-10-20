// Keyframed boss body animation, layered on top of the shared animChar rig (locomotion/face/base death).
// Every boss gets: heavy breathing stance, charge lean, M1 swing with anticipation -> strike -> follow-through -> recovery,
// a distinct windup + release pose per fruit-move family (punch/beam/sky/ground/dash/spin/cast), floating channel for the
// special, stagger on hit, phase-transition roar, enrage posture and a kneel-then-topple death. All poses are additive
// rotation offsets damped toward a target each frame (smooth blends, no pops). Zero allocations per frame; ~11 bones.
import { animChar } from './chars.js';
const BONES = ['hips', 'torso', 'head', 'armL', 'armR', 'foreL', 'foreR', 'legL', 'legR', 'shinL', 'shinR'];
const NB = BONES.length, NV = NB * 3 + 1; // xyz per bone + hips height
const IX = {}; BONES.forEach((b, i) => IX[b] = i * 3);
// pose = { bone: [x, y, z], hy: hipsY }  ->  packed Float32Array
const pk = o => { const a = new Float32Array(NV); for (const k in o) { if (k === 'hy') a[NV - 1] = o.hy; else { const i = IX[k]; a[i] = o[k][0] || 0; a[i + 1] = o[k][1] || 0; a[i + 2] = o[k][2] || 0; } } return a; };
const P = {
  stance: pk({ torso: [0.12], head: [0.06], armR: [-0.3, 0, 0.28], armL: [-0.3, 0, -0.28], foreR: [-0.55], foreL: [-0.55], legL: [-0.12, 0, -0.1], legR: [0.08, 0, 0.1], shinL: [0.22], shinR: [0.18], hy: -0.05 }),
  charge: pk({ torso: [0.38], head: [-0.25], armR: [0.35, 0, 0.2], armL: [0.35, 0, -0.2], foreR: [-0.6], foreL: [-0.6], hy: -0.04 }),
  cock: pk({ torso: [-0.18, -0.6], head: [0.1, 0.35], armR: [-2.4, 0, 0.45], foreR: [-1.2], armL: [-0.9, 0, -0.35], foreL: [-1.3], legL: [-0.45], shinL: [0.35], legR: [0.3], hy: -0.08 }),
  strike: pk({ torso: [0.32, 0.6], head: [0.05, -0.3], armR: [-1.45, 0, -0.15], foreR: [-0.08], armL: [0.3, 0, -0.4], foreL: [-1.0], legL: [-0.6], shinL: [0.45], legR: [0.45], hy: -0.14 }),
  follow: pk({ torso: [0.36, 0.85], head: [0.1, -0.35], armR: [-0.55, 0, -0.75], foreR: [-0.35], armL: [0.45, 0, -0.5], foreL: [-0.8], legL: [-0.5], shinL: [0.4], legR: [0.35], hy: -0.12 }),
  stagger: pk({ torso: [-0.5, 0, 0.18], head: [-0.45], armR: [0.6, 0, 0.7], armL: [0.6, 0, -0.7], foreR: [-0.3], foreL: [-0.3], legR: [0.5], legL: [-0.15], shinR: [0.35], hy: -0.06 }),
  roar: pk({ torso: [-0.5], head: [-0.65], armR: [-0.7, 0, 1.25], armL: [-0.7, 0, -1.25], foreR: [-1.1], foreL: [-1.1], legL: [-0.25, 0, -0.22], legR: [0.15, 0, 0.22], shinL: [0.35], shinR: [0.3], hy: -0.12 }),
  enrage: pk({ torso: [0.3], head: [0.18], armR: [-0.55, 0, 0.45], armL: [-0.55, 0, -0.45], foreR: [-1.3], foreL: [-1.3], legL: [-0.2, 0, -0.16], legR: [0.12, 0, 0.16], shinL: [0.35], shinR: [0.3], hy: -0.1 }),
  chan: pk({ torso: [-0.25], head: [-0.5], armR: [-2.3, 0, 1.0], armL: [-2.3, 0, -1.0], foreR: [-0.25], foreL: [-0.25], legL: [-0.35], legR: [0.25], shinL: [0.7], shinR: [0.9] }),
  chanHit: pk({ torso: [0.55], head: [0.3], armR: [-0.3, 0, 1.55], armL: [-0.3, 0, -1.55], foreR: [0], foreL: [0], legL: [-0.6], shinL: [0.8], legR: [0.4], shinR: [0.5], hy: -0.2 }),
  kneel: pk({ torso: [0.55], head: [0.45], armR: [0.25, 0, 0.35], armL: [-0.6, 0, -0.2], foreL: [-1.2], legL: [-1.4], shinL: [1.5], legR: [0.25], shinR: [1.9], hy: -0.55 }),
  // fruit-move families: [windup, release]
  punch: [pk({ torso: [-0.1, -0.85], head: [0.1, 0.5], armR: [0.4, 0, 0.6], foreR: [-2.0], armL: [-1.4, 0, -0.2], foreL: [-0.4], legL: [-0.5], shinL: [0.5], legR: [0.45], shinR: [0.3], hy: -0.16 }),
          pk({ torso: [0.3, 0.75], head: [0, -0.4], armR: [-1.6, 0, -0.1], foreR: [0], armL: [0.5, 0, -0.4], foreL: [-1.1], legL: [-0.8], shinL: [0.5], legR: [0.6], hy: -0.18 })],
  beam: [pk({ torso: [-0.05, -0.75], head: [0, 0.55], armR: [-1.1, 0, 0.55], foreR: [-1.7], armL: [-1.1, 0, 0.35], foreL: [-1.8], legL: [-0.35], legR: [0.35], shinL: [0.3], shinR: [0.25], hy: -0.12 }),
         pk({ torso: [0.15, 0.05], head: [0.05], armR: [-1.55, 0, -0.12], foreR: [-0.05], armL: [-1.55, 0, 0.12], foreL: [-0.05], legL: [-0.45], legR: [0.45], shinL: [0.3], hy: -0.12 })],
  sky: [pk({ torso: [-0.3], head: [-0.6], armR: [-3.05, 0, 0.15], foreR: [-0.1], armL: [-0.5, 0, -0.8], foreL: [-0.4], legL: [-0.2], legR: [0.15], hy: 0.02 }),
        pk({ torso: [0.45], head: [0.2], armR: [-0.7, 0, -0.2], foreR: [-0.1], armL: [0.3, 0, -0.9], legL: [-0.5], shinL: [0.6], legR: [0.3], hy: -0.18 })],
  ground: [pk({ torso: [-0.35], head: [-0.35], armR: [-2.95, 0, -0.25], foreR: [-0.5], armL: [-2.95, 0, 0.25], foreL: [-0.5], legL: [-0.2, 0, -0.2], legR: [0.1, 0, 0.2], shinL: [0.3], shinR: [0.3], hy: 0.03 }),
           pk({ torso: [0.75], head: [0.3], armR: [-0.85, 0, 0.1], foreR: [-0.1], armL: [-0.85, 0, -0.1], foreL: [-0.1], legL: [-0.75, 0, -0.25], legR: [0.25, 0, 0.25], shinL: [1.0], shinR: [0.9], hy: -0.32 })],
  dash: [pk({ torso: [0.6, -0.3], head: [-0.35], armR: [0.85, 0, 0.35], armL: [0.85, 0, -0.35], foreR: [-0.4], foreL: [-0.4], legL: [-0.85], shinL: [1.25], legR: [0.45], shinR: [0.9], hy: -0.3 }),
         pk({ torso: [-0.3, 0.3], head: [0.1], armR: [0.6, 0, 0.8], armL: [-0.4, 0, -0.8], legR: [-1.5], shinR: [0.05], legL: [0.25], shinL: [0.4], hy: -0.05 })],
  spin: [pk({ torso: [0.15, -1.05], head: [0, 0.6], armR: [-1.4, 0, 0.9], foreR: [-0.2], armL: [-1.4, 0, -0.9], foreL: [-0.2], legL: [-0.35, 0, -0.2], legR: [0.2, 0, 0.2], shinL: [0.4], shinR: [0.3], hy: -0.14 }),
         pk({ torso: [0.1, 1.15], head: [0, -0.6], armR: [-0.2, 0, 1.45], armL: [-0.2, 0, -1.45], legL: [-0.3, 0, -0.25], legR: [0.2, 0, 0.25], shinL: [0.4], hy: -0.12 })],
  cast: [pk({ torso: [-0.12, -0.4], head: [0.05, 0.3, 0.12], armR: [-1.2, 0, 0.75], foreR: [-1.1], armL: [-0.8, 0, -0.5], foreL: [-1.3], legL: [-0.3], legR: [0.25], shinL: [0.25], hy: -0.06 }),
         pk({ torso: [0.25, 0.45], head: [0, -0.2], armR: [-1.7, 0, 0.05], foreR: [0], armL: [-0.2, 0, -0.6], foreL: [-0.9], legL: [-0.5], shinL: [0.35], legR: [0.35], hy: -0.12 })],
};
// map a move kind / name / fruit to an element-matching pose family
const FAM = [['punch', /fist|punch|gatling|pistol|bazooka|knuckle|fang|claw|bite|jet|gum|kong|hawk|elephant|hand/], ['beam', /beam|ray|laser|cannon|gun|blast|breath|shot|bullet|flash|ball|bomb|orb/],
  ['sky', /rain|sky|thunder|light|goro|raigo|meteor|storm|heaven|star|cloud|judg|kiten|bolt|lightning/], ['ground', /ground|quake|pillar|slam|sand|desert|earth|gura|magma|volcano|ryusei|wall|crush|press|mountain|ton/],
  ['dash', /dash|kick|leg|blink|rush|charge|step|lunge|sprint|warp|teleport|kizami/], ['spin', /spin|whirl|tornado|cyclone|fan|wave|sweep|tempest|vortex|twister|ring/]];
export const famOf = s => { s = String(s || '').toLowerCase(); if (P[s] && Array.isArray(P[s])) return s; for (const [k, re] of FAM) if (re.test(s)) return k; return 'cast'; };
const ss = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const T = new Float32Array(NV); // scratch target
const mix = (a, b, k) => { for (let i = 0; i < NV; i++) T[i] = a[i] + (b[i] - a[i]) * k; };
const set = a => { for (let i = 0; i < NV; i++) T[i] = a[i]; };
const addW = (a, w) => { for (let i = 0; i < NV; i++) T[i] += a[i] * w; };
// keyframe track sampler: keys = [[u, pose], ...], smoothstep between neighbours
function track(keys, u) { if (u <= keys[0][0]) return set(keys[0][1]); for (let i = 1; i < keys.length; i++) if (u <= keys[i][0]) return mix(keys[i - 1][1], keys[i][1], ss((u - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]))); set(keys[keys.length - 1][1]); }
const SWING = [[0, P.cock], [0.22, P.strike], [0.55, P.follow], [1, P.stance]]; // u = 1 - attack (attack decays 1 -> 0)
const MASK = { windup: false, attack: 0, taunt: false, angry: false };
export function animBoss(g, e, dt) {
  const c = e.c, B_ = c.bones, a = e.anim, t = g.t; if (!B_) return animChar(c, a, t);
  if (e.dead) { const D = e.deadT; animChar(c, { dead: Math.max(0, D - 0.7) }, t); c.root.rotation.x *= D > 0.7 ? 1 : 0; // kneel first, then the shared topple
    set(P.kneel); const k = ss(D / 0.35) * (1 - ss((D - 0.75) / 0.5)); for (let i = 0; i < NV; i++) T[i] *= k; if (D < 0.7) { const r = Math.sin(D * 40) * 0.05 * (1 - D / 0.7); T[IX.head] += r; T[IX.torso + 2] += r; } return apply(c, B_, dt, 30); }
  const keep = [a.windup, a.attack, a.taunt, a.angry]; Object.assign(a, MASK); animChar(c, a, t); [a.windup, a.attack, a.taunt, a.angry] = keep;
  const run = c._run || 0; const brR = e.enraged ? 3.4 : 1.7, br = Math.sin(t * brR + (c._seed || 0));
  // base layer: stance (idle) <-> charge (moving)
  mix(P.stance, P.charge, Math.min(1, run * (e.enraged ? 1.15 : 0.8))); if (e.enraged) addW(P.enrage, 0.65 * (1 - run * 0.5));
  T[IX.torso] += br * (e.enraged ? 0.07 : 0.045) * (1 - run); T[IX.armR + 2] += br * 0.05; T[IX.armL + 2] -= br * 0.05; T[IX.head] -= br * 0.03; T[NV - 1] += br * 0.018 * (1 - run);
  let rate = 9; const A = e._act;
  if (A) { A.t += dt; if (e.state !== 'skill' && A.t > (A.wind || 0.5) + 0.3) e._act = null; }
  if (e.roarT > 0) { set(P.roar); const q = Math.sin(t * 38) * 0.06; T[IX.torso] += q; T[IX.head] += q * 1.5; T[IX.armR + 2] += q; T[IX.armL + 2] -= q; rate = 12; }
  else if (A && A.k === 'special') { const W = A.wind || 2.3, u = A.t;
    if (u < W) { set(P.chan); const s = Math.sin(t * 5); T[IX.armR + 2] += s * 0.15; T[IX.armL + 2] -= s * 0.15; T[IX.torso + 1] += Math.sin(t * 1.3) * 0.25; T[IX.head + 1] = Math.sin(t * 1.3) * -0.2; const sh = Math.sin(t * 45) * 0.03 * ss(u / W); T[IX.foreR] += sh; T[IX.foreL] -= sh; rate = 6; }
    else { mix(P.chanHit, P.stance, ss((u - W - 0.35) / 0.8)); rate = 16; } }
  else if (A && A.k === 'move') { const fam = A.fam || (A.fam = famOf(A.kind)); const [W0, R0] = P[fam]; const W = A.wind || 1.15, u = A.t;
    if (u < W) { mix(P.stance, W0, ss(u / Math.min(0.45, W * 0.5))); const tr = Math.sin(t * 40) * 0.035 * ss(u / W); T[IX.armR] += tr; T[IX.armL] -= tr; T[IX.torso + 2] += tr * 0.5; rate = 10; }
    else if (u < W + 0.14) { mix(W0, R0, ss((u - W) / 0.09)); rate = 26; } // release snaps through
    else { mix(R0, P.stance, ss((u - W - 0.3) / 0.6)); rate = 10; } } // hold, then recover
  else if (e.state === 'windup') { const k = ss(1 - Math.max(0, e.atk) / 0.5); mix(P.stance, P.cock, Math.max(0.35, k)); const tr = Math.sin(t * 30) * 0.03; T[IX.armR] += tr; rate = 14; } // anticipation
  else if (a.attack > 0) { track(SWING, 1 - a.attack); rate = 22; }
  const h = c._hit || 0; if (h > 0.01) { addW(P.stagger, h * (e.roarT > 0 ? 0.3 : 0.9)); T[IX.torso + 2] *= c._hs || 1; rate = Math.max(rate, 20); }
  apply(c, B_, dt, rate);
}
function apply(c, B_, dt, rate) { const O = c._bo || (c._bo = new Float32Array(NV)); const k = 1 - Math.exp(-dt * rate);
  for (let i = 0; i < NV; i++) O[i] += (T[i] - O[i]) * k;
  for (let b = 0; b < NB; b++) { const r = B_[BONES[b]].rotation, i = b * 3; r.x += O[i]; r.y += O[i + 1]; r.z += O[i + 2]; }
  B_.hips.position.y += O[NV - 1]; }
