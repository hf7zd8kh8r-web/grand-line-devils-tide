// v4 character body: smooth lofted torso / limbs / anime head with blended skin weights across every joint
// (no more rigid cylinders that crease at the elbow/knee/waist), real hands with four fingers + thumb, layered
// sleeves/cuffs/belt, tapered anime head (chin + cranium) that keeps the spherical face front for the face decals,
// and curved tapered hair strands. Everything is generated once per character into the shared skinned Builder.
import { THREE as B } from './engine.js';
const _c = new B.Color();
// rings: [{ c: [x,y,z], rx, rz, col, w: [boneA, boneB, tB] , rot?: angle offset }] along any axis (ring plane ⟂ to local tangent)
// colFn(ring, angle) may override colour per vertex. caps close the ends with a pole.
export function loft(rings, seg = 12, o = {}) {
  const nR = rings.length, pos = [], col = [], si = [], sw = [], idx = []; const T = new B.Vector3(), N = new B.Vector3(), Bi = new B.Vector3(), up = new B.Vector3(0, 0, 1);
  const ax = o.axis || null;
  for (let r = 0; r < nR; r++) { const R = rings[r], p = R.c; const pa = rings[Math.max(0, r - 1)].c, pb = rings[Math.min(nR - 1, r + 1)].c; T.set(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]).normalize();
    const ref = ax ? ax : (Math.abs(T.z) > 0.9 ? new B.Vector3(1, 0, 0) : up); N.crossVectors(T, ref).normalize(); Bi.crossVectors(N, T).normalize();
    for (let s = 0; s <= seg; s++) { const a = s / seg * Math.PI * 2 + (R.rot || 0); const ca = Math.cos(a), sa = Math.sin(a);
      const k = R.prof ? R.prof(a) : 1; const x = p[0] + (N.x * ca * R.rx + Bi.x * sa * R.rz) * k, y = p[1] + (N.y * ca * R.rx + Bi.y * sa * R.rz) * k, z = p[2] + (N.z * ca * R.rx + Bi.z * sa * R.rz) * k;
      pos.push(x, y, z); _c.set(o.colFn ? o.colFn(R, a, r) : R.col); col.push(_c.r, _c.g, _c.b); const w = R.w || [0, 0, 0]; si.push(w[0], w[1], 0, 0); sw.push(1 - w[2], w[2], 0, 0); } }
  const row = seg + 1; for (let r = 0; r < nR - 1; r++) for (let s = 0; s < seg; s++) { const a = r * row + s, b = a + row; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const cap = (r, dir) => { const R = rings[r]; const ci = pos.length / 3; pos.push(R.c[0] + (o.capOff ? o.capOff[r ? 1 : 0][0] : 0), R.c[1] + (o.capOff ? o.capOff[r ? 1 : 0][1] : 0), R.c[2] + (o.capOff ? o.capOff[r ? 1 : 0][2] : 0)); _c.set(o.colFn ? o.colFn(R, 0, r) : R.col); col.push(_c.r, _c.g, _c.b); const w = R.w || [0, 0, 0]; si.push(w[0], w[1], 0, 0); sw.push(1 - w[2], w[2], 0, 0);
    for (let s = 0; s < seg; s++) { const a = r * row + s; if (dir) idx.push(ci, a + 1, a); else idx.push(ci, a, a + 1); } };
  if (o.cap0) cap(0, 1); if (o.cap1) cap(nR - 1, 0);
  const g = new B.BufferGeometry(); g.setAttribute('position', new B.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new B.Float32BufferAttribute(col, 3));
  g.setAttribute('skinIndex', new B.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new B.Float32BufferAttribute(sw, 4)); g.setIndex(idx); g.computeVertexNormals();
  { // keep normals pointing outward whatever the loft direction: flip winding if the first ring's normal faces the axis
    const n = g.attributes.normal, P = g.attributes.position, c = rings[Math.min(1, nR - 1)].c, i0 = Math.min(1, nR - 1) * row; const dx = P.getX(i0) - c[0], dy = P.getY(i0) - c[1], dz = P.getZ(i0) - c[2];
    if (n.getX(i0) * dx + n.getY(i0) * dy + n.getZ(i0) * dz < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } g.setIndex(idx); g.computeVertexNormals(); } }
  return g;
}
// smoothstep weight between two bones over a band [y0, y1] (y0 = fully A, y1 = fully B)
export const band = (y, y0, y1) => { const t = Math.min(1, Math.max(0, (y - y0) / (y1 - y0))); return t * t * (3 - 2 * t); };
// tag a plain (non-skinned) primitive with colour + single-bone skin so it can be merged with lofts
export function solid(geo, color, m, bone, wB = null) { let g = geo.index ? geo.toNonIndexed() : geo.clone(); for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k); if (m) g.applyMatrix4(m);
  const n = g.attributes.position.count, c = new Float32Array(n * 3), si = new Uint16Array(n * 4), sw = new Float32Array(n * 4); _c.set(color);
  for (let i = 0; i < n; i++) { c[i * 3] = _c.r; c[i * 3 + 1] = _c.g; c[i * 3 + 2] = _c.b; si[i * 4] = bone; sw[i * 4] = 1; if (wB) { si[i * 4 + 1] = wB[0]; sw[i * 4] = 1 - wB[1]; sw[i * 4 + 1] = wB[1]; } }
  g.setAttribute('color', new B.BufferAttribute(c, 3)); g.setAttribute('skinIndex', new B.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new B.BufferAttribute(sw, 4)); return g; }
const shade = (c, k) => new B.Color(c).multiplyScalar(k).getHex();
// ------------------------------------------------------------------ body
// Q: { g, W, P, hipY, kneeY, shY, elY, hipN, shN, hyN, hr, AXn, sk, L, top }
export function buildBody4(b, Q) {
  const { g, W, P, hipY, kneeY, shY, elY, hipN, shN, sk, L } = Q; const OT = 0.014;
  const add = (geo, ot = OT) => b.addSkinned(geo, { ot });
  const tY = y => hipN + (y - hipY) * P.torso; // standard torso y -> final
  // ---- torso: crotch -> hips -> belt -> waist -> chest -> shoulders -> trapezius ----
  const chestC = L.open ? sk : L.shirt, pants = L.pants, belt = L.belt || 0x3a2614;
  const sx = t => P.waist + (P.chest - P.waist) * Math.pow(t, 0.8), sz = t => (P.waistD || P.waist) + ((P.chestD || P.chest) - (P.waistD || P.waist)) * Math.pow(t, 0.8);
  const TR = [ // y (std), rx, rz (relative W), col, zoff
    [hipY - 0.1, 0.62, 0.5, pants, 0], [hipY - 0.04, 0.86, 0.6, pants, 0], [hipY + 0.06, 0.9, 0.62, pants, 0], [hipY + 0.1, 0.9, 0.62, pants, 0],
    [hipY + 0.1, 0.95, 0.67, belt, 0], [hipY + 0.16, 0.94, 0.66, belt, 0], [hipY + 0.16, 0.88, 0.62, chestC, 0],
    [hipY + 0.26, 0.82, 0.58, chestC, 0.006], [hipY + 0.38, 0.9, 0.62, chestC, 0.01], [shY - 0.2, 1.02, 0.68, chestC, 0.02], [shY - 0.1, 1.08, 0.66, chestC, 0.012],
    [shY - 0.03, 1.02, 0.58, chestC, 0], [shY + 0.02, 0.72, 0.48, chestC, -0.005], [shY + 0.05, 0.42, 0.38, sk, 0]];
  const ringsT = TR.map(([y, rx, rz, col, zo]) => { const t = Math.min(1, Math.max(0, (y - hipY) / (shY - hipY))); const fy = y < hipY ? hipN + (y - hipY) * P.leg : tY(y);
    const belly = P.belly ? 1 + P.belly * Math.sin(Math.PI * Math.min(1, Math.max(0, (y - hipY + 0.15) / 0.55))) : 1;
    return { c: [0, fy, zo * g], rx: W * rx * sx(t), rz: W * rz * sz(t), col, y, w: [0, 1, band(y, hipY + 0.1, hipY + 0.3)], prof: a => (Math.sin(a) > 0 ? 1 + (belly - 1) * Math.sin(a) : 1) }; });
  add(loft(ringsT, 16, { axis: new B.Vector3(0, 0, 1), cap0: true }));
  // ---- neck (torso -> head blend) ----
  const nk = 0.06 * g; add(loft([{ c: [0, shN - 0.02, 0], rx: nk * 1.3, rz: nk * 1.2, col: sk, w: [1, 2, 0] }, { c: [0, shN + 0.04, 0.005], rx: nk, rz: nk * 1.05, col: sk, w: [1, 2, 0.5] }, { c: [0, shN + 0.12, 0.01], rx: nk * 0.95, rz: nk, col: sk, w: [1, 2, 1] }], 10, { axis: new B.Vector3(0, 0, 1) }), 0.008);
  // ---- arms: shoulder dome -> deltoid -> bicep -> elbow -> forearm -> wrist (arm/fore blended at the elbow) ----
  const sleeveLong = !!(L.coat || L.longSleeve), sleeveless = !!L.sleeveless && !L.open, slC = L.coat || L.longSleeve ? (L.coat || L.shirt) : L.open ? L.shirt : L.shirt;
  const sleeveEnd = sleeveLong ? -0.56 : sleeveless ? 0.06 : -0.17, gl = L.gloves;
  for (const [s, up, fo] of [[-1, 3, 4 + 3], [1, 4, 8]]) { const ax = s * Q.AXn; const aw = g * P.armW * 1.1;
    const AR = [[0.055, 0.03, 0.03], [0.035, 0.06, 0.06], [0.0, 0.078, 0.078], [-0.07, 0.074, 0.072], [-0.15, 0.068, 0.07], [-0.24, 0.06, 0.06], [-0.33, 0.053, 0.052], [-0.37, 0.052, 0.05], [-0.43, 0.057, 0.054], [-0.52, 0.05, 0.045], [-0.62, 0.04, 0.034], [-0.65, 0.037, 0.031]];
    const rs = []; for (const [y, rx, rz] of AR) { const isSl = y > sleeveEnd; const col = isSl ? slC : (gl && y < -0.5 ? gl : sk); const fy = shN + y * P.arm;
      const wt = y > 0.0 ? [1, up, 0.5 + (0.055 - y) / 0.055 * 0.5] : [up, fo, band(-y, 0.31, 0.39)];
      if (y > 0.0) { rs.push({ c: [ax, fy, 0], rx: rx * aw, rz: rz * aw, col, w: wt, y }); continue; }
      // sleeve hem: a slightly wider lip then step in to the skin
      if (rs.length && rs[rs.length - 1].y > sleeveEnd && y <= sleeveEnd) { const hy = shN + sleeveEnd * P.arm; const r0 = (rs[rs.length - 1].rx + rx * aw) / 2; rs.push({ c: [ax, hy + 0.004, 0], rx: r0 * 1.16, rz: r0 * 1.12, col: slC, w: [up, fo, band(-sleeveEnd, 0.31, 0.39)], y: sleeveEnd + 0.001 });
        rs.push({ c: [ax, hy - 0.006, 0], rx: r0 * 1.12, rz: r0 * 1.1, col: shade(slC, 0.82), w: [up, fo, band(-sleeveEnd, 0.31, 0.39)], y: sleeveEnd - 0.001 }); rs.push({ c: [ax, hy - 0.007, 0], rx: r0 * 0.96, rz: r0 * 0.96, col: sk, w: [up, fo, band(-sleeveEnd, 0.31, 0.39)], y: sleeveEnd - 0.002 }); }
      rs.push({ c: [ax + s * (y < -0.15 && y > -0.3 ? 0.004 : 0), fy, y < -0.38 ? 0.006 : 0], rx: rx * aw, rz: rz * aw, col, w: wt, y }); }
    // rings are built top->bottom along -y; first ring at shoulder top
    add(loft(rs, 10, { axis: new B.Vector3(0, 0, 1), cap0: true, cap1: true }), 0.011);
    hand(b, Q, s, ax, fo, sk);
  }
  // ---- legs: hip -> thigh -> knee -> calf -> ankle (leg/shin blended at the knee) ----
  const boots = L.boots, shorts = L.shorts;
  for (const [s, th, sh] of [[-1, 5, 9], [1, 6, 10]]) { const x = s * 0.1 * g * P.waist; const lw = g * P.legW;
    const LR = [[hipY + 0.07, 0.085, 0.085], [hipY, 0.104, 0.1], [0.82, 0.098, 0.095], [0.66, 0.083, 0.082], [kneeY + 0.04, 0.071, 0.072], [kneeY, 0.07, 0.072], [kneeY - 0.07, 0.073, 0.078], [0.33, 0.064, 0.066], [0.2, 0.05, 0.05], [0.12, 0.046, 0.046]];
    const rs = LR.map(([y, rx, rz]) => { const col = boots && y < 0.44 ? boots : shorts && y < 0.6 ? sk : pants; const fy = y * P.leg; const w = y > hipY - 0.02 ? [0, th, 0.5 + band(hipY + 0.07 - y, 0, 0.09) * 0.5] : [th, sh, band(-y, -(kneeY + 0.05), -(kneeY - 0.05))];
      return { c: [x * (y > hipY ? 0.85 : 1), fy, y < kneeY && y > 0.25 ? -0.006 : 0], rx: rx * lw, rz: rz * lw, col, w, y }; });
    if (boots) { const i = rs.findIndex(r => r.y < 0.44); if (i > 0) { const r = rs[i]; rs.splice(i, 0, { ...r, c: [r.c[0], 0.44 * P.leg, r.c[2]], rx: r.rx * 1.18, rz: r.rz * 1.18, col: boots, y: 0.44 }); } }
    add(loft(rs, 10, { axis: new B.Vector3(0, 0, 1), cap0: true, cap1: true }), 0.012);
  }
}
// hand hanging at the wrist: palm, 4 slightly curled fingers with knuckles, thumb in front. Bone = forearm.
function hand(b, Q, s, ax, fo, sk) { const { g, P, shN } = Q; const k = g * Math.max(0.9, P.armW * 0.9); const wy = shN - 0.64 * P.arm; const gc = Q.L.gloves || sk, dk = shade(gc, 0.86);
  const M = (x, y, z, rx = 0, ry = 0, rz = 0, sx2 = 1, sy = 1, sz = 1) => { const m = new B.Matrix4(); m.compose(new B.Vector3(x, y, z), new B.Quaternion().setFromEuler(new B.Euler(rx, ry, rz)), new B.Vector3(sx2, sy, sz)); return m; };
  const add = (geo, ot = 0.006) => b.addSkinned(geo, ot ? { ot } : { outline: false });
  add(solid(new B.SphereGeometry(0.05 * k, 10, 8), gc, M(ax + s * 0.004, wy - 0.045 * k, 0.004, 0, 0, 0, 0.62, 1.05, 1.0), fo));
  for (let i = 0; i < 4; i++) { const z = (-0.027 + i * 0.018) * k, ln = (i === 0 ? 0.034 : i === 3 ? 0.03 : 0.04) * k; const y0 = wy - 0.09 * k;
    add(solid(new B.SphereGeometry(0.0115 * k, 5, 4), gc, M(ax + s * 0.008, y0 + 0.006, z), fo), 0); // knuckle
    add(solid(new B.CylinderGeometry(0.0105 * k, 0.0095 * k, ln, 5, 1, true), gc, M(ax + s * 0.002 - s * ln * 0.18, y0 - ln * 0.48, z, 0, 0, s * 0.38), fo), 0.003);
    add(solid(new B.SphereGeometry(0.0098 * k, 5, 3), dk, M(ax - s * ln * 0.38, y0 - ln * 0.95, z), fo), 0); }
  add(solid(new B.CylinderGeometry(0.012 * k, 0.01 * k, 0.04 * k, 6), gc, M(ax - s * 0.016 * k, wy - 0.06 * k, 0.034 * k, 0.5, 0, s * 0.5), fo), 0.003);
}
// ------------------------------------------------------------------ head
// anime head: spherical front (face decals sit on a sphere of radius hr), cranium a touch fuller at the back, cheeks + chin tapered on the sides/bottom.
export function headGeo(hr, jaw = 1) { const g = new B.SphereGeometry(hr, 18, 13); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const front = Math.max(0, z / hr), fk = 1 - 0.8 * front * front; const k = Math.max(0, -y / hr);
    const tp = 0.25 * Math.pow(k, 1.5) * fk; x *= 1 - tp * (1.15 - 0.15 * jaw); z *= 1 - tp * 0.7 * (z < 0 ? 1.2 : 0.4);
    if (y < -0.55 * hr) { y -= (k - 0.55) * hr * 0.22; z += front * (k - 0.55) * hr * 0.12; } // pointed anime chin
    if (z < 0 && y > -0.2 * hr) { z *= 1.06; y += 0.02 * hr * Math.max(0, -z / hr); }                // fuller cranium
    if (y > 0.1 * hr) x *= 1.03;
    p.setXYZ(i, x, y, z); }
  g.computeVertexNormals(); return g; }
// tapered, curved hair strand: base point, direction (unit), length, width, flatness, bend vector
export function strand(base, dir, len, w, col, bone, bend = [0, -0.25, 0], flat = 0.55, seg = 5) { const rs = [];
  for (let i = 0; i <= 4; i++) { const t = i / 4, tt = t * t; const c = [base[0] + dir[0] * len * t + bend[0] * len * tt, base[1] + dir[1] * len * t + bend[1] * len * tt, base[2] + dir[2] * len * t + bend[2] * len * tt];
    const r = w * (1 - t * 0.92) * (i === 0 ? 0.9 : 1); rs.push({ c, rx: r, rz: r * flat, col, w: [bone, bone, 0] }); }
  return loft(rs, seg, { cap0: true, cap1: true }); }
// shared character shading: 4-step toon ramp + a crisp warm rim light (one program for every character)
export function charShade(m) { m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `{ float rim = 1.0 - max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0); outgoingLight += vec3(1.0, 0.95, 0.88) * smoothstep(0.7, 0.78, rim) * 0.09; }
#include <opaque_fragment>`); }; m.customProgramCacheKey = () => 'char4rim'; return m; }
