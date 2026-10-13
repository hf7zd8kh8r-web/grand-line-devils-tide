import { THREE, qv } from './engine.js';
import { palette } from './elements.js';
const B = THREE;
const N = 2000;
export class FX {
  constructor(scene, camera) {
    this.scene = scene; this.camera = camera;
    const g = new B.BufferGeometry();
    this.pos = new Float32Array(N * 3); this.col = new Float32Array(N * 3); this.size = new Float32Array(N); this.alpha = new Float32Array(N);
    this.vel = new Float32Array(N * 3); this.life = new Float32Array(N); this.max = new Float32Array(N); this.grav = new Float32Array(N); this.s0 = new Float32Array(N);
    g.setAttribute('position', new B.BufferAttribute(this.pos, 3)); g.setAttribute('color', new B.BufferAttribute(this.col, 3));
    g.setAttribute('size', new B.BufferAttribute(this.size, 1)); g.setAttribute('alpha', new B.BufferAttribute(this.alpha, 1));
    this.mat = new B.ShaderMaterial({ transparent: true, depthWrite: false, blending: B.AdditiveBlending, uniforms: { ps: { value: 300 } },
      vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA; uniform float ps;
        void main(){ vC=color; vA=alpha; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize = size*ps/max(-mv.z,0.1); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `varying vec3 vC; varying float vA; void main(){ vec2 d=gl_PointCoord-0.5; float r=length(d); if(r>0.5) discard; float a=(1.0-r*2.0); a=a*a*vA; gl_FragColor=vec4(vC*a*1.6, a); }` });
    this.points = new B.Points(g, this.mat); this.points.frustumCulled = false; scene.add(this.points);
    this.i = 0; this.objs = []; this.shake = 0; this.geo = g;
    // spark streaks: one LineSegments draw call
    const SN = this.SN = 360; this.sp = new Float32Array(SN * 6); this.sc = new Float32Array(SN * 6); this.sv = new Float32Array(SN * 3); this.sl = new Float32Array(SN); this.sm = new Float32Array(SN); this.sg = new Float32Array(SN); this.scol = new Float32Array(SN * 3); this.si = 0;
    const sgeo = this.sgeo = new B.BufferGeometry(); sgeo.setAttribute('position', new B.BufferAttribute(this.sp, 3)); sgeo.setAttribute('color', new B.BufferAttribute(this.sc, 3));
    this.sparkLines = new B.LineSegments(sgeo, new B.LineBasicMaterial({ vertexColors: true, transparent: true, blending: B.AdditiveBlending, depthWrite: false })); this.sparkLines.frustumCulled = false; scene.add(this.sparkLines);
    this.ringGeo = new B.RingGeometry(0.85, 1, 40); this.sphGeo = new B.SphereGeometry(1, 16, 12); this.boxGeo = new B.BoxGeometry(1, 1, 1); this.cylGeo = new B.CylinderGeometry(1, 1, 1, 12, 1, true);
  }
  setScene(scene) { scene.add(this.points); scene.add(this.sparkLines); this.scene = scene; for (const o of this.objs) o.mesh.removeFromParent(); this.objs = []; }
  burst(p, n, color, o = {}) {
    n = Math.ceil(n * qv().parts); const c = new B.Color(color);
    for (let k = 0; k < n; k++) {
      const i = this.i = (this.i + 1) % N; const sp = o.speed ?? 6;
      let vx = (Math.random() - 0.5) * 2, vy = (Math.random() - 0.5) * 2, vz = (Math.random() - 0.5) * 2; const l = Math.hypot(vx, vy, vz) || 1;
      const s = sp * (0.3 + Math.random() * 0.7) / l;
      this.vel[i * 3] = vx * s + (o.dir ? o.dir.x : 0); this.vel[i * 3 + 1] = vy * s + (o.up ?? 2) + (o.dir ? o.dir.y : 0); this.vel[i * 3 + 2] = vz * s + (o.dir ? o.dir.z : 0);
      const sp2 = o.spread ?? 0.1;
      this.pos[i * 3] = p.x + (Math.random() - 0.5) * sp2; this.pos[i * 3 + 1] = p.y + (Math.random() - 0.5) * sp2; this.pos[i * 3 + 2] = p.z + (Math.random() - 0.5) * sp2;
      const v = 0.7 + Math.random() * 0.3; this.col[i * 3] = c.r * v; this.col[i * 3 + 1] = c.g * v; this.col[i * 3 + 2] = c.b * v;
      this.s0[i] = (o.size ?? 0.35) * (0.6 + Math.random() * 0.8); this.max[i] = this.life[i] = (o.life ?? 0.7) * (0.6 + Math.random() * 0.6); this.grav[i] = o.grav ?? 9;
    }
  }
  add(mesh, max, fn) { this.scene.add(mesh); this.objs.push({ mesh, life: 0, max, fn }); try { fn(0, 0); } catch (e) { /* first-frame pose only */ } return mesh; } // pose at t=0 now so new effects never render one frame at their raw (huge) geometry scale
  ring(p, color, r = 4, dur = 0.5, flat = true, thick = 1) {
    const m = new B.Mesh(this.ringGeo, new B.MeshBasicMaterial({ color, transparent: true, blending: B.AdditiveBlending, depthWrite: false, side: B.DoubleSide }));
    m.position.copy(p); if (flat) m.rotation.x = -Math.PI / 2; else m.lookAt(this.camera.position);
    return this.add(m, dur, (t) => { m.scale.setScalar(0.2 + r * t); m.material.opacity = (1 - t) * thick; });
  }
  orb(p, color, r = 1, dur = 0.4) {
    const m = new B.Mesh(this.sphGeo, new B.MeshBasicMaterial({ color, transparent: true, blending: B.AdditiveBlending, depthWrite: false }));
    m.position.copy(p); return this.add(m, dur, t => { m.scale.setScalar(r * (0.4 + t)); m.material.opacity = 1 - t; });
  }
  pillar(p, color, r = 1.5, h = 8, dur = 1) {
    const m = new B.Mesh(this.cylGeo, new B.MeshBasicMaterial({ color, transparent: true, blending: B.AdditiveBlending, depthWrite: false, side: B.DoubleSide }));
    m.position.copy(p); return this.add(m, dur, t => { const k = Math.min(1, t * 4); m.scale.set(r * (1 + t * 0.3), h * k, r * (1 + t * 0.3)); m.position.y = p.y + h * k / 2; m.material.opacity = (1 - t) * 0.85; });
  }
  beam(a, b, color, w = 0.3, dur = 0.25) {
    const d = b.clone().sub(a); const L = d.length();
    const m = new B.Mesh(this.boxGeo, new B.MeshBasicMaterial({ color, transparent: true, blending: B.AdditiveBlending, depthWrite: false }));
    m.position.copy(a).addScaledVector(d, 0.5); m.lookAt(b); m.scale.set(w, w, L);
    return this.add(m, dur, t => { m.material.opacity = 1 - t; m.scale.x = m.scale.y = w * (1 - t * 0.7); });
  }

  sparks(p, n, color, o = {}) { n = Math.ceil(n * Math.max(0.5, qv().parts)); const c = new B.Color(color); const sp = o.speed ?? 12;
    for (let k = 0; k < n; k++) { const i = this.si = (this.si + 1) % this.SN; let vx = Math.random() - 0.5, vy = Math.random() - 0.5 + (o.up ?? 0.25), vz = Math.random() - 0.5; if (o.dir) { vx += o.dir.x * 1.2; vy += o.dir.y * 1.2; vz += o.dir.z * 1.2; } const l = Math.hypot(vx, vy, vz) || 1, s = sp * (0.4 + Math.random() * 0.8) / l;
      this.sv[i * 3] = vx * s; this.sv[i * 3 + 1] = vy * s; this.sv[i * 3 + 2] = vz * s; for (const j of [0, 3]) { this.sp[i * 6 + j] = p.x; this.sp[i * 6 + j + 1] = p.y; this.sp[i * 6 + j + 2] = p.z; }
      this.scol[i * 3] = c.r; this.scol[i * 3 + 1] = c.g; this.scol[i * 3 + 2] = c.b; this.sm[i] = this.sl[i] = (o.life ?? 0.28) * (0.6 + Math.random() * 0.7); this.sg[i] = o.grav ?? 14; } }
  // camera-facing shockwave ring
  shock(p, color, r = 2, dur = 0.3, thick = 1) { this.thinRing = this.thinRing || new B.RingGeometry(0.9, 1, 40); const m = new B.Mesh(this.thinRing, new B.MeshBasicMaterial({ color, transparent: true, blending: B.AdditiveBlending, depthWrite: false, side: B.DoubleSide })); m.position.copy(p); m.quaternion.copy(this.camera.quaternion);
    return this.add(m, dur, t => { const e = 1 - Math.pow(1 - t, 3); m.scale.setScalar(0.15 + r * e); m.material.opacity = (1 - t) * thick; }); }
  // jagged lightning bolt
  zap(a, b, color = 0xbfe0ff, segs = 8, dur = 0.18) { const pts = []; const d = b.clone().sub(a); const L = d.length(); for (let i = 0; i <= segs; i++) { const q = a.clone().addScaledVector(d, i / segs); if (i && i < segs) q.add(new B.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).multiplyScalar(L * 0.12)); pts.push(q); }
    const g = new B.BufferGeometry().setFromPoints(pts); const m = new B.Line(g, new B.LineBasicMaterial({ color, transparent: true, blending: B.AdditiveBlending, depthWrite: false })); this.add(m, dur, t => { m.material.opacity = t < 0.5 ? 1 : (1 - t) * 2; }); const o = this.objs[this.objs.length - 1]; const f0 = o.fn; o.fn = (t, dt) => { f0(t, dt); if (t >= 1) g.dispose(); }; return m; }
  // anime crescent slash: ribbon arc in a plane defined by (right,up) around center, sweeping a0->a1
  slash(center, right, up, color, o = {}) { const r = o.r ?? 1.5, w = o.w ?? 0.38, a0 = o.a0 ?? 2.4, a1 = o.a1 ?? 0.5, N = 26; const core = new B.Color(o.core ?? 0xffffff), glow = new B.Color(color);
    const pos = new Float32Array((N + 1) * 2 * 3), uv = new Float32Array((N + 1) * 2 * 2), idx = [];
    for (let i = 0; i <= N; i++) { const u = i / N; const a = a0 + (a1 - a0) * u; const taper = Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 0.7; const ri = r - w * taper, ro = r + w * 0.25 * taper; const cx = Math.cos(a), cy = Math.sin(a);
      for (const [j, rr] of [[0, ri], [1, ro]]) { const k = (i * 2 + j); pos[k * 3] = right.x * cx * rr + up.x * cy * rr; pos[k * 3 + 1] = right.y * cx * rr + up.y * cy * rr; pos[k * 3 + 2] = right.z * cx * rr + up.z * cy * rr; uv[k * 2] = u; uv[k * 2 + 1] = j; }
      if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    const g = new B.BufferGeometry(); g.setAttribute('position', new B.BufferAttribute(pos, 3)); g.setAttribute('uv', new B.BufferAttribute(uv, 2)); g.setIndex(idx);
    const mat = new B.ShaderMaterial({ transparent: true, depthWrite: false, blending: B.AdditiveBlending, side: B.DoubleSide, uniforms: { head: { value: 0 }, fade: { value: 1 }, core: { value: core }, glow: { value: glow } },
      vertexShader: 'varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform float head; uniform float fade; uniform vec3 core; uniform vec3 glow; varying vec2 vU; void main(){ float tail = smoothstep(head-0.75, head, vU.x) * step(vU.x, head); float edge = pow(vU.y, 2.5); vec3 c = mix(glow*0.9, core, edge); float a = tail * fade * (0.15 + 0.85*edge) * smoothstep(0.0,0.08,vU.x) * (0.55 + 0.45*smoothstep(head-0.25, head, vU.x)); gl_FragColor = vec4(c*a*2.4, a); }' });
    const m = new B.Mesh(g, mat); m.position.copy(center); m.frustumCulled = false; const dur = o.dur ?? 0.3, sweep = o.sweep ?? 0.38;
    this.add(m, dur, t => { mat.uniforms.head.value = Math.min(1.75, t / sweep * 1.75); mat.uniforms.fade.value = t < sweep ? 1 : 1 - (t - sweep) / (1 - sweep); m.scale.setScalar(1 + t * 0.15); });
    const ob = this.objs[this.objs.length - 1]; const f0 = ob.fn; ob.fn = (t, dt) => { f0(t, dt); if (t >= 1) g.dispose(); }; return m; }
  // element-flavoured hit impact
  impact(p, el, power = 1, dir) { const P = palette(el); const nk = this.camera ? Math.max(0.35, Math.min(1, p.distanceTo(this.camera.position) / 3.5)) : 1; const pw = Math.min(2.5, power) * (0.4 + 0.6 * nk);
    if (nk > 0.7) this.orb(p, P.core, 0.1 + 0.06 * pw, 0.08); this.shock(p, P.glow, (0.35 + 0.2 * pw) * nk, 0.14 + 0.04 * pw, 0.55 * nk); this.sparks(p, 6 + 6 * pw, P.spark, { speed: 9 + 5 * pw, dir });
    if (pw > 1.3 && el !== 'slash') { this.shock(p, P.core, 0.7 * pw, 0.32, 0.5); this.ring(p.clone().setY(p.y - 0.8), P.glow, 1.4 * pw, 0.35); }
    if (P.rise) this.burst(p, 8 * pw, P.glow, { speed: 2.5, up: 3, size: 0.32, life: 0.6, grav: -3 });
    if (P.heavy) this.burst(p, 8 * pw, P.spark, { speed: 4, up: 3, size: 0.3, life: 0.6, grav: 14 });
    if (P.shards) this.sparks(p, 8 * pw, 0xffffff, { speed: 7, up: 0.6, life: 0.45, grav: 18 });
    if (P.zap) for (let k = 0; k < 2 + pw; k++) this.zap(p, p.clone().add(new B.Vector3((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3)), P.spark, 6, 0.14);
    if (P.implode) { const m = new B.Mesh(this.ringGeo, new B.MeshBasicMaterial({ color: P.core, transparent: true, depthWrite: false, side: B.DoubleSide })); m.position.copy(p); m.quaternion.copy(this.camera.quaternion); this.add(m, 0.3, t => { m.scale.setScalar(1.8 * (1 - t) + 0.1); m.material.opacity = t; }); }
    if (P.rings) for (let k = 1; k <= 2; k++) setTimeout(() => this.shock(p, P.glow, 0.5 + k * 0.35 * pw, 0.28, 0.6), k * 60);
    if (P.flash) this.orb(p, 0xffffff, 0.3 * pw, 0.1); }
  update(dt) {
    for (let i = 0; i < N; i++) {
      if (this.life[i] <= 0) { this.alpha[i] = 0; continue; }
      this.life[i] -= dt; const t = this.life[i] / this.max[i];
      this.vel[i * 3 + 1] -= this.grav[i] * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.alpha[i] = Math.max(0, t); this.size[i] = this.s0[i] * (0.5 + t * 0.5);
    }
    for (const k of ['position', 'color', 'size', 'alpha']) this.geo.attributes[k].needsUpdate = true;
    { const P = this.sp, C = this.sc, Vv = this.sv; let any = false; for (let i = 0; i < this.SN; i++) { if (this.sl[i] <= 0) { if (C[i * 6] || C[i * 6 + 1] || C[i * 6 + 2]) { C.fill(0, i * 6, i * 6 + 6); any = true; } continue; } any = true; this.sl[i] -= dt; const t = Math.max(0, this.sl[i] / this.sm[i]);
      Vv[i * 3 + 1] -= this.sg[i] * dt; Vv[i * 3] *= 1 - dt * 3; Vv[i * 3 + 2] *= 1 - dt * 3; const x = P[i * 6] + Vv[i * 3] * dt, y = P[i * 6 + 1] + Vv[i * 3 + 1] * dt, z = P[i * 6 + 2] + Vv[i * 3 + 2] * dt; const L = 0.035;
      P[i * 6] = x; P[i * 6 + 1] = y; P[i * 6 + 2] = z; P[i * 6 + 3] = x - Vv[i * 3] * L; P[i * 6 + 4] = y - Vv[i * 3 + 1] * L; P[i * 6 + 5] = z - Vv[i * 3 + 2] * L;
      for (let k = 0; k < 3; k++) { C[i * 6 + k] = this.scol[i * 3 + k] * t * 1.4; C[i * 6 + 3 + k] = this.scol[i * 3 + k] * t * 0.2; } }
      if (any) { this.sgeo.attributes.position.needsUpdate = true; this.sgeo.attributes.color.needsUpdate = true; } }
    for (let j = this.objs.length - 1; j >= 0; j--) { const o = this.objs[j]; o.life += dt; const t = Math.min(1, o.life / o.max); o.fn(t, dt); if (t >= 1) { o.mesh.removeFromParent(); o.mesh.material.dispose?.(); this.objs.splice(j, 1); } }
    this.mat.uniforms.ps.value = innerHeight * 0.9;
    this.shake = Math.max(0, this.shake - dt * 2.5);
  }
}
// DOM damage numbers
export class DmgNums {
  constructor(el) { this.el = el; this.list = []; }
  spawn(p, txt, cls = '') { const d = document.createElement('div'); d.className = 'dmg ' + cls; d.textContent = txt; this.el.appendChild(d); this.list.push({ d, p: p.clone(), t: 0, vx: (Math.random() - 0.5) * 2.4, vy: 3.2 + Math.random() * 1.2, big: /crit/.test(cls) }); if (this.list.length > 30) { const o = this.list.shift(); o.d.remove(); } }
  update(dt, cam) {
    const v = new B.Vector3();
    for (let i = this.list.length - 1; i >= 0; i--) { const o = this.list[i]; o.t += dt; o.vy -= dt * 9; o.p.y += o.vy * dt; o.p.x += o.vx * dt;
      v.copy(o.p).project(cam); if (o.t > 0.9 || v.z > 1) { o.d.remove(); this.list.splice(i, 1); continue; }
      o.d.style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px,${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-50%) scale(${(o.t < 0.08 ? 0.4 + o.t / 0.08 * (o.big ? 1.8 : 1.3) : o.t < 0.2 ? (o.big ? 2.2 : 1.7) - (o.t - 0.08) / 0.12 * (o.big ? 0.9 : 0.6) : (o.big ? 1.3 : 1.1)).toFixed(3)}) rotate(${o.big ? Math.sin(o.t * 40) * Math.max(0, 0.3 - o.t) * 30 : 0}deg)`; o.d.style.opacity = o.t > 0.6 ? (0.9 - o.t) / 0.3 : 1; }
  }
  clear() { for (const o of this.list) o.d.remove(); this.list = []; }
}
