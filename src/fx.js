import { THREE, qv } from './engine.js';
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
    this.ringGeo = new B.RingGeometry(0.85, 1, 40); this.sphGeo = new B.SphereGeometry(1, 16, 12); this.boxGeo = new B.BoxGeometry(1, 1, 1); this.cylGeo = new B.CylinderGeometry(1, 1, 1, 12, 1, true);
  }
  setScene(scene) { scene.add(this.points); this.scene = scene; for (const o of this.objs) o.mesh.removeFromParent(); this.objs = []; }
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
  add(mesh, max, fn) { this.scene.add(mesh); this.objs.push({ mesh, life: 0, max, fn }); return mesh; }
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
  update(dt) {
    for (let i = 0; i < N; i++) {
      if (this.life[i] <= 0) { this.alpha[i] = 0; continue; }
      this.life[i] -= dt; const t = this.life[i] / this.max[i];
      this.vel[i * 3 + 1] -= this.grav[i] * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.alpha[i] = Math.max(0, t); this.size[i] = this.s0[i] * (0.5 + t * 0.5);
    }
    for (const k of ['position', 'color', 'size', 'alpha']) this.geo.attributes[k].needsUpdate = true;
    for (let j = this.objs.length - 1; j >= 0; j--) { const o = this.objs[j]; o.life += dt; const t = Math.min(1, o.life / o.max); o.fn(t, dt); if (t >= 1) { o.mesh.removeFromParent(); o.mesh.material.dispose?.(); this.objs.splice(j, 1); } }
    this.mat.uniforms.ps.value = innerHeight * 0.9;
    this.shake = Math.max(0, this.shake - dt * 2.5);
  }
}
// DOM damage numbers
export class DmgNums {
  constructor(el) { this.el = el; this.list = []; }
  spawn(p, txt, cls = '') { const d = document.createElement('div'); d.className = 'dmg ' + cls; d.textContent = txt; this.el.appendChild(d); this.list.push({ d, p: p.clone(), t: 0, vx: (Math.random() - 0.5) * 1.5 }); if (this.list.length > 30) { const o = this.list.shift(); o.d.remove(); } }
  update(dt, cam) {
    const v = new B.Vector3();
    for (let i = this.list.length - 1; i >= 0; i--) { const o = this.list[i]; o.t += dt; o.p.y += dt * 1.6; o.p.x += o.vx * dt;
      v.copy(o.p).project(cam); if (o.t > 0.9 || v.z > 1) { o.d.remove(); this.list.splice(i, 1); continue; }
      o.d.style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px,${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-50%) scale(${o.t < 0.12 ? 1.6 - o.t * 5 : 1})`; o.d.style.opacity = o.t > 0.6 ? (0.9 - o.t) / 0.3 : 1; }
  }
  clear() { for (const o of this.list) o.d.remove(); this.list = []; }
}
