import { THREE, renderer, Builder, mat, WORLD_MAT, setOutlinesVisible } from './engine.js';
import { makeWater, makeSky } from './world.js';
import { makeShip, makeFruit, makeChar, makeAvatar } from './models.js';
import { ULTRA } from './data.js';
import { lookOverrides } from './style.js';
import { FX } from './fx.js';
const B = THREE;

export class Cover {
  constructor() {
    const s = this.scene = new B.Scene();
    this.cam = new B.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 900);
    this.cam.position.set(0, 3.2, 12); this.cam.lookAt(0, 3, 0);
    s.fog = new B.Fog(0x1a2633, 30, 260);
    this.amb = new B.HemisphereLight(0x6a7f9a, 0x101820, 1.0); s.add(this.amb);
    this.key = new B.DirectionalLight(0x9ab8ff, 1.2); this.key.position.set(-20, 30, 10); s.add(this.key);
    this.water = makeWater(true); this.water.position.y = -1; const wu = this.water.userData.mat.uniforms; wu.fogC.value.set(0x1a2633); wu.fogN.value = 30; wu.fogF.value = 260; wu.foamOn.value = 0; s.add(this.water);
    this.sky = makeSky(0x0a1018, 0x2a3a4c, false); s.add(this.sky);
    // ships: silhouettes in the storm
    this.ships = [];
    const dark = { hull: 0x1a1a22, sail: 0x22222c };
    for (const [x, z, sc, ry] of [[-26, -40, 1.6, 0.6], [30, -70, 2.2, -0.4], [-60, -110, 2.6, 0.9], [14, -22, 1.0, -1.2]]) {
      const sh = makeShip({ size: sc, ...(z === -22 ? { hull: 0x5a3a1a, sail: 0xe9e0c8, figure: 0xf1d36a, mark: 0x1a1a1a } : dark) }); sh.position.set(x, -0.6, z); sh.rotation.y = ry; s.add(sh); this.ships.push(sh);
    }
    // rocks / sea stacks
    const b = new Builder(); for (const [x, z, r] of [[-40, -60, 9], [-48, -52, 5], [52, -90, 12], [60, -80, 6], [-14, -150, 14]]) b.add(new B.DodecahedronGeometry(r, 0), 0x2a2f38, mat(x, r * 0.3, z, 0.3, 0.5, 0.2, 0.8, 1.6, 0.8));
    s.add(b.build(WORLD_MAT));
    // rain
    const N = 1400, rp = new Float32Array(N * 6); this.rainV = [];
    for (let i = 0; i < N; i++) { const x = (Math.random() - 0.5) * 80, y = Math.random() * 40, z = (Math.random() - 0.7) * 70; rp.set([x, y, z, x + 0.15, y - 0.9, z], i * 6); }
    const rg = new B.BufferGeometry(); rg.setAttribute('position', new B.BufferAttribute(rp, 3));
    this.rain = new B.LineSegments(rg, new B.LineBasicMaterial({ color: 0x9ab0c8, transparent: true, opacity: 0.35 })); s.add(this.rain);
    // lightning bolt
    this.bolt = new B.Group(); s.add(this.bolt); this.flash = 0; this.nextBolt = 1.5;
    this.fx = new FX(s, this.cam);
    // ultra fruit
    this.ultra = ULTRA[Math.floor(Math.random() * ULTRA.length)];
    if (location.search.includes('fruit=')) { const id = new URLSearchParams(location.search).get('fruit'); this.ultra = ULTRA.find(u => u.id === id) || this.ultra; }
    this.fruit = makeFruit(this.ultra.col[0], this.ultra.col[1], 2, 1.5); this.fruit.position.set(0, 2.6, 4); s.add(this.fruit);
    this.aura = new B.Mesh(new B.SphereGeometry(1, 24, 16), new B.MeshBasicMaterial({ color: this.ultra.glow, transparent: true, opacity: 0.18, blending: B.AdditiveBlending, depthWrite: false })); this.aura.scale.setScalar(0.9); this.fruit.add(this.aura);
    this.fruitLight = new B.PointLight(this.ultra.glow, 30, 18, 2); this.fruitLight.position.copy(this.fruit.position); s.add(this.fruitLight);
    this.t = 0; this.state = 'cover'; this.burstT = 0;
    setOutlinesVisible(s);
  }
  strike() {
    this.bolt.clear(); const x = (Math.random() - 0.5) * 120, z = -60 - Math.random() * 100; let p = new B.Vector3(x, 70, z);
    const m = new B.MeshBasicMaterial({ color: 0xdfe8ff }); this.bolt.userData.m = m;
    for (let i = 0; i < 12; i++) { const q = p.clone().add(new B.Vector3((Math.random() - 0.5) * 9, -6, (Math.random() - 0.5) * 4)); const d = q.clone().sub(p); const seg = new B.Mesh(new B.BoxGeometry(0.5, 0.5, d.length()), m); seg.position.copy(p).addScaledVector(d, 0.5); seg.lookAt(q); this.bolt.add(seg); p = q; if (p.y < 0) break; }
    this.flash = 1; this.nextBolt = 2 + Math.random() * 4;
  }
  hitFruit(x, y) { const v = this.fruit.position.clone().project(this.cam); const sx = (v.x * 0.5 + 0.5) * innerWidth, sy = (-v.y * 0.5 + 0.5) * innerHeight; return Math.hypot(x - sx, y - sy) < Math.max(90, innerWidth * 0.18); }
  burst() {
    if (this.state !== 'cover') return false; this.state = 'burst'; this.burstT = 0; return true;
  }
  update(dt) {
    this.t += dt; const t = this.t;
    this.water.userData.mat.uniforms.t.value = t;
    for (const [i, sh] of this.ships.entries()) { sh.position.y = -0.6 + Math.sin(t * 0.9 + i) * 0.35; sh.rotation.z = Math.sin(t * 0.7 + i * 2) * 0.06; sh.rotation.x = Math.sin(t * 0.5 + i) * 0.04; }
    this.ships[3].position.x = 14 - Math.sin(t * 0.05) * 6;
    const rp = this.rain.geometry.attributes.position; for (let i = 0; i < rp.count; i += 2) { let y = rp.getY(i) - dt * 32; if (y < -1) y += 40; rp.setY(i, y); rp.setY(i + 1, y - 0.9); rp.setX(i + 1, rp.getX(i) + 0.15); }
    rp.needsUpdate = true;
    this.nextBolt -= dt; if (this.nextBolt <= 0) this.strike();
    this.flash = Math.max(0, this.flash - dt * 3.5); const fl = this.flash > 0.6 ? 1 : this.flash > 0.3 ? 0.3 : this.flash > 0.15 ? 0.8 : this.flash;
    this.sky.userData.mat.uniforms.flash.value = fl * 0.8; this.amb.intensity = 1 + fl * 3; this.bolt.visible = this.flash > 0.2;
    // fruit
    const F = this.fruit; const u = F.userData.mat.uniforms; u.t.value = t;
    if (this.state === 'cover') { F.position.y = 2.6 + Math.sin(t * 1.6) * 0.18; F.rotation.y += dt * 0.8; F.rotation.z = Math.sin(t) * 0.1; u.glow.value = 0.4 + Math.sin(t * 3) * 0.25; this.aura.scale.setScalar(0.85 + Math.sin(t * 3) * 0.06);
      if (Math.random() < 0.5) this.orbit(1); const za = this.cam.aspect < 0.8 ? 17 : 12; this.cam.position.set(Math.sin(t * 0.12) * 1.2, 3.3 + Math.sin(t * 0.5) * 0.15, za); this.cam.lookAt(0, 2.9, 0); }
    else if (this.state === 'burst') { this.burstT += dt; const k = this.burstT; F.rotation.y += dt * (3 + k * 10); u.glow.value = 0.6 + k * 2; this.aura.scale.setScalar(0.9 + k * 1.6); this.aura.material.opacity = 0.2 + k * 0.15;
      this.power(k, dt); this.cam.position.lerp(new B.Vector3(0, 2.7, this.cam.aspect < 0.8 ? 9 : 6.5), dt * 1.5); this.cam.lookAt(F.position); this.fruitLight.intensity = 30 + k * 80; }
    this.fruitLight.position.copy(F.position);
    this.fx.update(dt); this.sky.position.copy(this.cam.position);
  }
  orbit(n) { const a = Math.random() * Math.PI * 2; const p = this.fruit.position.clone().add(new B.Vector3(Math.cos(a) * 1.2, (Math.random() - 0.5) * 1.5, Math.sin(a) * 1.2)); this.fx.burst(p, n, this.ultra.glow, { speed: 0.6, up: 0.8, size: 0.25, life: 1.2, grav: 0 }); }
  power(k, dt) {
    const P = this.fruit.position, fx = this.fx, U = this.ultra.fx; this._pt = (this._pt || 0) - dt; if (this._pt > 0) return; this._pt = 0.12;
    if (U === 'nika') { fx.ring(P.clone(), 0xffffff, 6 + k * 3, 0.7, false, 0.9); fx.burst(P, 20, 0xffffff, { speed: 8, size: 0.35, life: 0.8, grav: 0 }); if (Math.random() < 0.4) fx.burst(P, 10, 0xffe0a0, { speed: 14, size: 0.25, life: 0.5, grav: 0 }); }
    else if (U === 'dragon') { for (let i = 0; i < 8; i++) { const a = k * 9 + i * 0.8; const r = 1.5 + i * 0.35; fx.burst(P.clone().add(new B.Vector3(Math.cos(a) * r, (i - 4) * 0.3, Math.sin(a) * r)), 2, i % 2 ? 0x4a8bff : 0x9a5cff, { speed: 1, size: 0.6, life: 0.6, grav: -1 }); } }
    else if (U === 'sound') { fx.ring(P.clone(), 0x3cf5e0, 4 + k * 4, 0.9, false, 0.7); fx.ring(P.clone(), 0x5a5aff, 2 + k * 3, 0.6, false, 0.6); fx.burst(P, 6, 0x3cf5e0, { speed: 4, size: 0.3, life: 0.6, grav: 0 }); }
    else { fx.burst(P, 30, 0xe8f6ff, { speed: 7, size: 0.35, life: 1.0, grav: 1, spread: 1 }); fx.burst(P.clone().add(new B.Vector3(0, 2, 0)), 14, 0x9ad4ff, { speed: 3, size: 0.6, life: 1.4, grav: 2, spread: 6 }); }
  }
  render() { renderer.clear(); renderer.render(this.scene, this.cam); }
  resize() { this.cam.aspect = innerWidth / innerHeight; this.cam.updateProjectionMatrix(); }
}

export class Creator {
  constructor() {
    const s = this.scene = new B.Scene(); s.fog = new B.Fog(0xf2b98a, 30, 160);
    this.cam = new B.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 600);
    s.add(new B.HemisphereLight(0xffe6c8, 0x4a3a5a, 1.4)); const d = new B.DirectionalLight(0xffd0a0, 2.2); d.position.set(5, 8, 6); s.add(d);
    const r = new B.DirectionalLight(0x8ab0ff, 1.2); r.position.set(-6, 4, -6); s.add(r);
    this.sky = makeSky(0x3a5aa8, 0xf7b07a, true); this.sky.userData.mat.uniforms.sunDir.value.set(0.2, 0.08, -1).normalize(); s.add(this.sky);
    this.water = makeWater(false); this.water.position.y = -1.6; const wu = this.water.userData.mat.uniforms; wu.fogC.value.set(0xf2b98a); wu.fogN.value = 30; wu.fogF.value = 160; wu.foamOn.value = 0; wu.deep.value.set(0x1a4a7a); wu.shallow.value.set(0xd08a6a); s.add(this.water);
    const b = new Builder(); b.add(new B.BoxGeometry(9, 0.4, 7), 0x9a6a3a, mat(0, -0.2, 0), { grad: 0.3 }); for (let i = -4; i <= 4; i += 1) b.add(new B.BoxGeometry(0.04, 0.02, 7), 0x6a4528, mat(i, 0.01, 0), { outline: false });
    b.add(new B.CylinderGeometry(0.25, 0.3, 9, 8), 0x6a4528, mat(-2.4, 4.4, -2.2)); b.add(new B.BoxGeometry(5, 3.5, 0.1), 0xf3ecd8, mat(-2.4, 5.5, -2.0, 0.05)); b.add(new B.BoxGeometry(9, 0.6, 0.3), 0x7a4a24, mat(0, 0.3, -3.4)); b.add(new B.BoxGeometry(0.3, 0.6, 7), 0x7a4a24, mat(4.4, 0.3, 0));
    b.add(new B.CylinderGeometry(0.4, 0.4, 0.8, 10), 0x8a5a2b, mat(3, 0.4, -2.5)); b.add(new B.CylinderGeometry(0.4, 0.4, 0.8, 10), 0x8a5a2b, mat(3.6, 0.4, -1.8));
    this.deck = b.build(WORLD_MAT); s.add(this.deck);
    this.t = 0; this.char = null; this.cam.position.set(0, 1.6, 5.2); this.cam.lookAt(0, 1.1, 0);
  }
  setLook(faction, race, look, cos) {
    if (this.char) this.scene.remove(this.char.root);
    this.char = makeAvatar(faction, race, look, cos); this.scene.add(this.char.root); setOutlinesVisible(this.char.root);
    this.cam.position.set(0, race === 'Giant' ? 2.2 : 1.6, race === 'Giant' ? 6.5 : 5.2);
  }
  update(dt) { this.t += dt; if (this.char) { this.char.root.rotation.y = (this.spin || 0) + Math.sin(this.t * 0.6) * 0.5 + 0.2; this.char.bones.head.rotation.y = Math.sin(this.t * 0.9) * 0.2; this.char.bones.armR.rotation.x = -0.2 + Math.sin(this.t * 1.5) * 0.08; this.char.bones.hips.position.y = this.char.hipY + Math.sin(this.t * 2) * 0.01; }
    this.water.userData.mat.uniforms.t.value = this.t; this.deck.rotation.z = Math.sin(this.t * 0.8) * 0.015; this.cam.lookAt(0, this.char && this.char.root.scale.x > 1 ? 1.5 : 1.05, 0); this.sky.position.copy(this.cam.position); }
  render() { renderer.clear(); renderer.render(this.scene, this.cam); }
  resize() { this.cam.aspect = innerWidth / innerHeight; this.cam.updateProjectionMatrix(); }
}
