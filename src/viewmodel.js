import { THREE, Builder, mat, toonMat } from './engine.js';
const B = THREE;
const box = (w, h, d) => new B.BoxGeometry(w, h, d);
export class ViewModel {
  constructor() {
    this.scene = new B.Scene();
    this.cam = new B.PerspectiveCamera(66, 1, 0.02, 20);
    this.scene.add(new B.HemisphereLight(0xffffff, 0x88aacc, 1.6));
    const dl = new B.DirectionalLight(0xffffff, 1.6); dl.position.set(0.5, 1, 0.3); this.scene.add(dl);
    this.root = new B.Group(); this.root.scale.setScalar(0.5); this.scene.add(this.root);
    this.mat = toonMat({ emissive: 0x000000 });
    this.t = 0; this.punch = 0; this.side = 1; this.swing = 0; this.recoil = 0; this.cast = 0; this.stretch = 0; this.blockK = 0; this.equipK = 1; this.gatling = 0;
    this.mode = 'fist';
  }
  build(skin, sleeve, cuff) {
    this.root.clear();
    const cyl = (rt, rb, h, n = 12) => new B.CylinderGeometry(rt, rb, h, n); const sph = (r, w = 12, h = 9) => new B.SphereGeometry(r, w, h); const RX = Math.PI / 2;
    const dk = new B.Color(skin).multiplyScalar(0.82).getHex(), nail = new B.Color(skin).lerp(new B.Color(0xffffff), 0.35).getHex();
    const mk = (s) => { const b = new Builder(); const o = { ot: 0.005 };
      b.add(cyl(0.085, 0.078, 0.34), sleeve, mat(0, 0, 0.14, RX), o);                                  // sleeve
      b.add(new B.TorusGeometry(0.078, 0.018, 6, 14), cuff, mat(0, 0, -0.03), { outline: false });        // cuff ring
      b.add(cyl(0.056, 0.064, 0.3), skin, mat(0, 0, -0.18, RX), o);                                    // forearm (tapers to wrist)
      b.add(sph(0.05, 10, 7), skin, mat(0, -0.005, -0.33, 0, 0, 0, 1.05, 0.9, 1), { outline: false }); // wrist
      b.add(sph(0.075, 12, 9), skin, mat(0, 0.0, -0.41, 0, 0, 0, 1.0, 0.72, 1.05), o);                 // palm/back of hand
      for (let i = 0; i < 4; i++) { const x = -0.045 + i * 0.03, ln = i === 0 || i === 3 ? 0.9 : 1;     // curled fingers (fist)
        b.add(cyl(0.016, 0.016, 0.05 * ln, 8), skin, mat(x, 0.022, -0.47, RX + 0.25), { outline: false });
        b.add(sph(0.017, 8, 6), skin, mat(x, 0.028, -0.495), { ot: 0.003 });                              // knuckle
        b.add(cyl(0.015, 0.014, 0.05, 8), dk, mat(x, -0.012, -0.495, 0.1), { outline: false });          // folded segment
        b.add(sph(0.0085, 6, 4), nail, mat(x, -0.03, -0.482), { outline: false }); }
      b.add(cyl(0.017, 0.015, 0.07, 8), skin, mat(-s * 0.068, -0.012, -0.445, RX, 0, s * 0.9), { ot: 0.003 }); // thumb
      const g = b.build(this.mat); const grp = new B.Group(); grp.add(g);
      // devil-fruit aura (shown in fruit slot)
      const au = new B.Group(); au.visible = false; for (let i = 0; i < 9; i++) { const m = new B.Mesh(sph(0.03, 6, 4), this.auraMat); m.userData.ph = Math.random() * 6.28; au.add(m); } au.position.set(0, 0, -0.42); grp.add(au); grp.userData.aura = au;
      const gl = new B.Mesh(sph(0.09, 12, 9), new B.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: B.AdditiveBlending, depthWrite: false })); gl.position.set(0, 0, -0.43); gl.visible = false; grp.add(gl); grp.userData.glow = gl;
      return grp; };
    this.auraMat = this.auraMat || new B.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, blending: B.AdditiveBlending, depthWrite: false });
    this.armL = mk(-1); this.armR = mk(1); this.armL.rotation.order = this.armR.rotation.order = 'ZYX';
    // punch streaks (additive elongated cones in front of each fist)
    this.streakMat = new B.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: B.AdditiveBlending, depthWrite: false });
    for (const A of [this.armL, this.armR]) { const st = new B.Mesh(new B.ConeGeometry(0.07, 0.6, 10, 1, true), this.streakMat); st.rotation.x = Math.PI / 2; st.position.set(0, 0, -0.2); A.add(st); A.userData.streak = st; }
    this.restL = new B.Vector3(-0.42, -0.4, -0.5); this.restR = new B.Vector3(0.42, -0.4, -0.5);
    this.root.add(this.armL, this.armR);
    { const b = new Builder(); const o = { ot: 0.006 }; b.add(cyl(0.11, 0.09, 0.5), 0x2a2a3a, mat(0, 0.25, 0), o); b.add(cyl(0.09, 0.075, 0.42), 0x3a3a52, mat(0, -0.2, 0), o); b.add(new B.BoxGeometry(0.16, 0.12, 0.3), 0x1a1a1a, mat(0, -0.44, 0.06), o);
      this.leg = b.build(this.mat); this.leg.visible = false; this.root.add(this.leg);
      this.fistGlowR = this.armR.userData.glow; this.fistGlowL = this.armL.userData.glow; }
    this.sword = new B.Group(); this.armR.add(this.sword); this.sword.position.set(0, 0.0, -0.44);
    // flintlock: octagonal barrel, brass bands, curved walnut stock, hammer + trigger guard
    const gb = new Builder(); const o = { ot: 0.005 };
    gb.add(cyl(0.024, 0.026, 0.46, 8), 0x3a3a42, mat(0, 0.085, -0.3, RX), o); gb.add(cyl(0.032, 0.032, 0.02, 10), 0xc9a23a, mat(0, 0.085, -0.52, RX), { outline: false }); gb.add(cyl(0.03, 0.03, 0.02, 10), 0xc9a23a, mat(0, 0.085, -0.25, RX), { outline: false });
    gb.add(new B.BoxGeometry(0.05, 0.06, 0.34), 0x7a4a2a, mat(0, 0.055, -0.2), o); gb.add(new B.BoxGeometry(0.055, 0.2, 0.08), 0x6a3a1e, mat(0, -0.05, 0.03, 0.45), o); gb.add(sph(0.04, 8, 6), 0xc9a23a, mat(0, -0.14, 0.08), { outline: false });
    gb.add(new B.BoxGeometry(0.02, 0.06, 0.03), 0x2a2a30, mat(0, 0.12, -0.04, -0.4), o); gb.add(new B.TorusGeometry(0.03, 0.006, 4, 10, Math.PI), 0xc9a23a, mat(0, 0.02, -0.08, 0, RX, 0), { outline: false });
    this.gun = gb.build(this.mat); this.armR.add(this.gun); this.gun.position.set(0, 0.03, -0.42); this.gun.visible = false;
    { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,230,1)'); gr.addColorStop(0.25, 'rgba(255,200,80,.9)'); gr.addColorStop(1, 'rgba(255,120,0,0)'); c.fillStyle = gr; c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, r = i % 2 ? 12 : 32; c.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } c.fill();
      const tx = new B.CanvasTexture(cv); const fm = new B.MeshBasicMaterial({ map: tx, transparent: true, blending: B.AdditiveBlending, depthWrite: false, side: B.DoubleSide }); const fl = new B.Group(); for (let i = 0; i < 2; i++) { const pl = new B.Mesh(new B.PlaneGeometry(0.34, 0.34), fm); pl.rotation.y = i * Math.PI / 2; pl.position.z = -0.08; fl.add(pl); } const face = new B.Mesh(new B.PlaneGeometry(0.28, 0.28), fm); fl.add(face); fl.position.set(0, 0.085, -0.6); fl.visible = false; this.gun.add(fl); this.flash = fl; }
    // fishing rod: cork grip + reel, then 4 jointed segments so it can bend on a bite
    { const rod = new B.Group(); const rb = new Builder(); rb.add(cyl(0.022, 0.026, 0.2, 8), 0xc89a5a, mat(0, 0, 0, RX), o); rb.add(cyl(0.03, 0.03, 0.012, 10), 0x2a2a30, mat(0, 0, -0.11, RX), { outline: false });
      rb.add(cyl(0.035, 0.035, 0.03, 12), 0x8a8a95, mat(0, -0.045, -0.02, 0, 0, RX), o); rb.add(new B.BoxGeometry(0.008, 0.03, 0.008), 0x55555f, mat(0.025, -0.045, -0.02), { outline: false }); rod.add(rb.build(this.mat));
      let par = rod, z = -0.12; this.rodJ = []; const segL = 0.26;
      for (let i = 0; i < 4; i++) { const j = new B.Group(); j.position.set(0, 0, i ? -segL : z); par.add(j); const sb = new Builder(); const r0 = 0.013 - i * 0.0026, r1 = r0 - 0.0026;
        sb.add(cyl(r1, r0, segL, 6), i % 2 ? 0x2a4a7a : 0x1e3a66, mat(0, 0, -segL / 2, RX), { ot: 0.003 }); sb.add(new B.TorusGeometry(0.012, 0.0025, 4, 8), 0xd0d0d8, mat(0, -0.012, -segL + 0.02), { outline: false }); j.add(sb.build(this.mat)); this.rodJ.push(j); par = j; }
      this.rodTip = new B.Object3D(); this.rodTip.position.set(0, 0, -segL); par.add(this.rodTip);
      rod.position.set(0, 0.01, -0.42); rod.rotation.set(0.55, 0, 0); this.rod = rod; rod.visible = false; this.armR.add(rod); }
    this.fishSt = null; this.fishK = 0;
    this.setMode(this.mode);
  }
  // fishing state from Fishing: null | 'cast' | 'wait' | 'bite' | 'reel'
  setFish(st) { if (st === this.fishSt) return; if (st === 'cast') this.fishK = 1; if (st === 'reel') this.fishK = 1; this.fishSt = st; }
  rodTipWorld(mainCam, out) { if (!this.rod || !this.rod.visible) return null; this.scene.updateMatrixWorld(); const v = this.rodTip.getWorldPosition(new B.Vector3()); const d = v.length();
    const n = v.clone().project(this.cam); const dir = new B.Vector3(n.x, n.y, 0.5).unproject(mainCam).sub(mainCam.position).normalize(); return out.copy(mainCam.position).addScaledVector(dir, d * 1.0); }
  setSword(def) {
    this.sword.clear(); if (!def) return;
    const b = new Builder(); const L = def.len || 1; const o = { ot: 0.005 }; const RX = Math.PI / 2;
    // wrapped handle (diamond ito pattern), tsuba, habaki, curved blade with hamon edge
    b.add(new B.CylinderGeometry(0.022, 0.024, 0.22, 8), def.grip || 0x1a1a2a, mat(0, 0, 0.04, RX), o);
    for (let i = 0; i < 5; i++) b.add(new B.BoxGeometry(0.03, 0.03, 0.012), 0xe8e0c8, mat(0, 0, -0.04 + i * 0.04, 0, 0, Math.PI / 4), { outline: false });
    b.add(new B.SphereGeometry(0.026, 8, 6), def.guard || 0xc9a23a, mat(0, 0, 0.16), { outline: false });
    b.add(new B.CylinderGeometry(0.07, 0.07, 0.014, def.guardSides || 12), def.guard || 0xc9a23a, mat(0, 0, -0.08, RX), o);
    b.add(new B.BoxGeometry(0.016, 0.05, 0.04), 0xd8c070, mat(0, 0, -0.1), { outline: false });
    const seg = 4; for (let i = 0; i < seg; i++) { const z0 = -0.12 - i * L / seg, bend = (i + 0.5) / seg; const y = Math.pow(bend, 2) * 0.05 * (def.curve ?? 1);
      b.add(new B.BoxGeometry(0.01, 0.05 - bend * 0.01, L / seg + 0.004), def.col || 0xdde3ea, mat(0, y, z0 - L / seg / 2, -0.05 * (def.curve ?? 1)), o);
      b.add(new B.BoxGeometry(0.012, 0.012, L / seg), def.hamon || 0xffffff, mat(0, y - 0.022, z0 - L / seg / 2, -0.05 * (def.curve ?? 1)), { outline: false }); }
    b.add(new B.ConeGeometry(0.025, 0.08, 4), def.col || 0xdde3ea, mat(0, 0.05 * (def.curve ?? 1), -0.12 - L - 0.03, -RX, 0, 0, 0.4, 1, 1), o);
    const g = b.build(this.mat); this.sword.add(g); this.swordLen = L; if (this.mouth) { this.mouth.removeFromParent(); this.mouth = null; }
    if (this.swordL) { this.swordL.removeFromParent(); this.swordL = null; }
    if (def.santoryu) { this.swordL = g.clone(); this.swordL.position.set(0, 0.0, -0.44); this.armL.add(this.swordL); }
  }
  aura(col) { this.auraCol = col; this.auraMat.color.setHex(col || 0xffffff); }
  setMode(m) { this.mode = m; if (!this.armR) return; this.sword.visible = m === 'sword'; if (this.swordL) this.swordL.visible = m === 'sword'; this.gun.visible = m === 'gun'; this.equipK = 0; if (this.mouth) this.mouth.visible = m === 'sword'; if (this.trailM) this.trailM.visible = false; }
  tint(hex, k) { this.mat.emissive.setHex(hex); this.mat.emissiveIntensity = k; }
  doPunch() { this.punch = 1; this.side = -this.side; }
  doKick() { this.kick = 1; }
  setStyle(col, on) { this.styleCol = on ? col : null; }
  doSwing() { this.swing = 1; this.side = -this.side; this.swc = ((this.swc ?? -1) + 1) % 4; this.trailN = 0; }
  hitPause(t = 0.07) { this.hold = Math.max(this.hold || 0, t); }
  // combo patterns: [rotZ start,end] [rotX start,end] [posX start,end] [posY start,end]; 0 diag down-right, 1 rising left, 2 flat sweep, 3 overhead crush
  _swordPose(dt, bob, drop) { const R = this.armR, L = this.armL; const P = [[[-1.3, 1.5], [1.4, -0.9], [-0.05, 0.45], [0.1, -0.14]], [[1.4, -1.2], [-0.6, 1.1], [0.5, -0.1], [-0.16, 0.12]], [[-1.65, 1.65], [0.3, 0.2], [-0.15, 0.55], [-0.02, -0.04]], [[0.1, 0.05], [2.0, -1.4], [0.18, 0.12], [0.2, -0.22]]];
    const three = !!this.swordL; const idle = { x: 0.26, y: -0.27 + bob - drop, z: -0.4 };
    // draw from the hip while equipping (sheathe = reverse when equipK low)
    const dr = 1 - this.equipK; R.position.set(idle.x + dr * 0.1, idle.y - dr * 0.25, idle.z + dr * 0.15); R.rotation.set(0.5 + dr * 1.6, -0.2 - dr * 0.6, 0.25 + dr * 0.4);
    if (three) { L.position.set(-0.26, idle.y, -0.4); L.rotation.set(0.5, 0.2, -0.25); } else { L.position.set(0.12, idle.y - 0.1, -0.3); L.rotation.set(0.7, 0.4, 0.5); }
    if (this.hold > 0) { this.hold -= dt; this.swing = Math.min(1, this.swing + dt * 3.0); }
    let e = 0, sw = 0; if (this.swing > 0) { const s = 1 - this.swing; const pt = P[this.swc ?? 0]; const ph = s < 0.16 ? -0.18 * Math.sin(s / 0.16 * Math.PI / 2) : s < 0.42 ? -0.18 + 1.18 * (1 - Math.pow(1 - (s - 0.16) / 0.26, 3)) : s < 0.6 ? 1 + 0.08 * Math.sin((s - 0.42) / 0.18 * Math.PI) : 1;
      const back = s < 0.6 ? 0 : Math.pow((s - 0.6) / 0.4, 1.5); e = ph; sw = s > 0.14 && s < 0.5 ? Math.sin((s - 0.14) / 0.36 * Math.PI) : 0; const lr = (k) => k[0] + (k[1] - k[0]) * Math.max(-0.2, ph);
      const mix = (v, i) => v + (i - v) * back; const rz = mix(lr(pt[0]), 0.25), rx = mix(lr(pt[1]), 0.5), px = mix(lr(pt[2]), idle.x), py = mix(idle.y + lr(pt[3]), idle.y);
      R.rotation.z = rz; R.rotation.x = rx; R.position.x = px; R.position.y = py; R.position.z = idle.z - Math.sin(Math.max(0, Math.min(1, ph)) * Math.PI) * 0.22 * (1 - back);
      if (three) { L.rotation.z = -rz; L.rotation.x = rx; L.position.x = -px; L.position.y = py; L.position.z = R.position.z; }
      else { L.position.set(R.position.x - 0.1, R.position.y - 0.06, R.position.z + 0.06); L.rotation.copy(R.rotation); }
      this.root.rotation.z = (this.side || 1) * Math.sin(Math.max(0, Math.min(1, ph)) * Math.PI) * 0.06 * (1 - back); this.root.position.z = -0.04 * sw; }
    else { this.root.rotation.z *= 0.85; this.root.position.z *= 0.85; }
    // mouth sword (Three Sword Style): held horizontally under the camera
    if (three && !this.mouth && this.swordL) { this.mouth = this.swordL.clone(); this.mouth.position.set(0, -0.36, -0.42); this.mouth.rotation.set(0, Math.PI / 2, 0.15); this.mouth.scale.setScalar(0.9); this.root.add(this.mouth); }
    if (this.mouth) { this.mouth.visible = three && this.mode === 'sword'; if (three) this.mouth.rotation.z = 0.15 + sw * 0.15; }
    this._trail(sw); }
  _trail(k) { if (!this.trailM) { const N = 14; const geo = new B.BufferGeometry(); geo.setAttribute('position', new B.BufferAttribute(new Float32Array(N * 2 * 3), 3)); const al = new Float32Array(N * 2); for (let i = 0; i < N; i++) al[i * 2] = al[i * 2 + 1] = i / (N - 1); geo.setAttribute('a', new B.BufferAttribute(al, 1)); const id = []; for (let i = 0; i < N - 1; i++) { const q = i * 2; id.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } geo.setIndex(id);
      this.trailMat = new B.ShaderMaterial({ transparent: true, depthWrite: false, blending: B.AdditiveBlending, side: B.DoubleSide, uniforms: { col: { value: new B.Color(0xcfe8ff) }, k: { value: 0 } }, vertexShader: 'attribute float a; varying float vA; void main(){ vA=a; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }', fragmentShader: 'uniform vec3 col; uniform float k; varying float vA; void main(){ float a=vA*vA*k; gl_FragColor=vec4(mix(col,vec3(1.),vA*0.6)*a*1.6,a); }' });
      this.trailM = new B.Mesh(geo, this.trailMat); this.trailM.frustumCulled = false; this.root.add(this.trailM); this.trailPts = []; this._tA = new B.Vector3(); this._tB = new B.Vector3(); }
    const on = k > 0.02 && this.mode === 'sword'; this.trailM.visible = on; this.trailMat.uniforms.k.value = k; if (!on) { this.trailPts.length = 0; return; }
    this.root.updateMatrixWorld(true); const L = (this.swordLen || 1); const hilt = this.sword.localToWorld(this._tA.set(0, 0, -0.15)); const tip = this.sword.localToWorld(this._tB.set(0, 0.05, -0.15 - L)); this.root.worldToLocal(hilt); this.root.worldToLocal(tip);
    this.trailPts.push([hilt.clone().lerp(tip, 0.45), tip.clone()]); const N = 14; while (this.trailPts.length > N) this.trailPts.shift(); const P = this.trailM.geometry.attributes.position;
    for (let i = 0; i < N; i++) { const q = this.trailPts[Math.max(0, this.trailPts.length - N + i)] || this.trailPts[0]; P.setXYZ(i * 2, q[0].x, q[0].y, q[0].z); P.setXYZ(i * 2 + 1, q[1].x, q[1].y, q[1].z); } P.needsUpdate = true; }
  setTrailColor(c) { if (this.trailMat) this.trailMat.uniforms.col.value.setHex(c); this._trailCol = c; }
  doShoot() { this.recoil = 1; this.flashT = 0.06; if (this.flash) { this.flash.rotation.z = Math.random() * 6.28; this.flash.scale.setScalar(0.8 + Math.random() * 0.5); } }
  blockHit() { this.bhit = 1; }
  guardBreak() { this.gbreak = 1; }
  doCast(stretch = 0) { this.cast = 1; this.stretch = stretch; }
  update(dt, st) {
    this.t += dt; if (!this.armR) return; this._aura(dt);
    const bob = st.moving ? Math.sin(st.phase) * 0.018 : Math.sin(this.t * 1.6) * 0.005; const bobx = st.moving ? Math.cos(st.phase * 0.5) * 0.015 : 0;
    this.kick = Math.max(0, (this.kick || 0) - dt * 3.4); if (this.leg) { const k = this.kick, e = k > 0.55 ? (1 - k) / 0.45 : k / 0.55; this.leg.visible = k > 0 && this.mode === 'fist'; this.leg.position.set(0.12, -0.95 + e * 0.62, -0.55 - e * 0.45); this.leg.rotation.set(-0.4 - e * 1.1, 0, 0.25 - e * 0.2); }
    if (this.fistGlowR) for (const [gl, A] of [[this.fistGlowR, this.armR], [this.fistGlowL, this.armL]]) { const on = this.styleCol != null && this.mode === 'fist'; gl.visible = on; if (on) { gl.material.color.setHex(this.styleCol); gl.material.opacity = 0.22 + this.punch * 0.45 + Math.sin(this.t * 6) * 0.06; gl.scale.setScalar(1 + this.punch * 0.4); } }
    this.punch = Math.max(0, this.punch - dt * 5); this.swing = Math.max(0, this.swing - dt * 2.8); this.recoil = Math.max(0, this.recoil - dt * 5);
    this.cast = Math.max(0, this.cast - dt * 2.2); this.equipK = Math.min(1, this.equipK + dt * 4);
    this.blockK += ((st.block ? 1 : 0) - this.blockK) * Math.min(1, dt * 14);
    const L = this.armL, R = this.armR;
    const fishing = !!this.fishSt; if (this.rod) { this.rod.visible = fishing; if (fishing) { this.sword.visible = false; if (this.swordL) this.swordL.visible = false; this.gun.visible = false; } else if (this._wasFish) this.setMode(this.mode); this._wasFish = fishing; }
    L.position.copy(this.restL); R.position.copy(this.restR); L.rotation.set(0.15, 0.1, 0); R.rotation.set(0.15, -0.1, 0);
    L.scale.set(1, 1, 1); R.scale.set(1, 1, 1);
    const drop = (1 - this.equipK) * 0.3;
    L.position.y += bob - drop; R.position.y += bob - drop; L.position.x += bobx; R.position.x += bobx;
    if (this.mode === 'fist') {
      const p = this.punch; const u = 1 - p; // anticipation (tiny pull-back), snap out with ease-out, overshoot, ease back
      const k = u < 0.12 ? -0.25 * (u / 0.12) : u < 0.4 ? -0.25 + 1.4 * (1 - Math.pow(1 - (u - 0.12) / 0.28, 3)) : 1.15 - 1.15 * Math.pow((u - 0.4) / 0.6, 0.8);
      const A = this.side > 0 ? R : L; const sx = this.side > 0 ? -1 : 1;
      A.position.z -= 0.36 * k; A.position.x += sx * 0.2 * k; A.position.y += 0.1 * k; A.rotation.y += sx * -0.45 * k; A.rotation.z += sx * -0.5 * Math.max(0, k);
      const O = A === R ? L : R; O.position.z += 0.06 * Math.max(0, k); O.position.y += 0.05 * Math.max(0, k); O.position.x -= sx * 0.04 * Math.max(0, k);
      this.root.rotation.z = sx * -0.05 * Math.max(0, k); this.root.position.z = -0.03 * Math.max(0, k);
      const sk = u > 0.1 && u < 0.5 ? Math.sin((u - 0.1) / 0.4 * Math.PI) : 0; this.streakMat.opacity = sk * 0.55; this.streakMat.color.setHex(this.styleCol ?? 0xffffff); A.userData.streak.visible = sk > 0.01; A.userData.streak.scale.set(1, 0.6 + sk, 1); O.userData.streak.visible = false;
      if (this.gatling > 0) { const g = Math.sin(this.t * 60); R.position.z -= 0.3 * Math.max(0, g); L.position.z -= 0.3 * Math.max(0, -g); R.position.x -= 0.12; L.position.x += 0.12; }
    } else if (this.mode === 'sword') { if (this.armL.userData.streak) this.armL.userData.streak.visible = this.armR.userData.streak.visible = false; this._swordPose(dt, bob, drop);
    } else if (this.mode === 'gun') {
      const rc = this.recoil, rk = rc > 0.8 ? (1 - rc) / 0.2 : rc / 0.8; R.position.set(0.22, -0.22 + bob - drop + rk * 0.04, -0.42 + rk * 0.12); R.rotation.set(rk * 0.65, -0.05, rk * 0.12); this.root.rotation.z = rk * 0.03;
      this.flashT = (this.flashT || 0) - dt; if (this.flash) this.flash.visible = this.flashT > 0;
      L.position.y -= 0.15;
    }
    if (this.cast > 0) { const c = this.cast; const k = c > 0.7 ? (1 - c) / 0.3 : c / 0.7;
      R.position.z -= 0.3 * k; R.position.x -= 0.1 * k; R.position.y += 0.08 * k; if (this.stretch) R.scale.z = 1 + this.stretch * k * 8;
      if (this.stretch === 0) { L.position.z -= 0.3 * k; L.position.x += 0.1 * k; L.position.y += 0.08 * k; } }
    if (fishing) { this.fishK = Math.max(0, this.fishK - dt * (this.fishSt === 'cast' ? 1.6 : 2.4)); const k = this.fishK;
      R.position.set(0.2, -0.27 + bob * 0.5, -0.36); R.rotation.set(0.1, -0.15, 0.05); L.position.set(0.02, -0.36 + bob * 0.5, -0.3); L.rotation.set(0.6, 0.5, 0.3);
      let pitch = 0.55, bend = 0, jig = 0;
      if (this.fishSt === 'cast') { const e = 1 - k; pitch = e < 0.35 ? 0.55 + (e / 0.35) * 1.1 : 1.65 - Math.min(1, (e - 0.35) / 0.25) * 1.45; bend = e > 0.35 && e < 0.7 ? 0.12 : 0; R.position.y += e < 0.35 ? e * 0.2 : 0; }
      else if (this.fishSt === 'wait') { pitch = 0.35 + Math.sin(this.t * 1.3) * 0.03; }
      else if (this.fishSt === 'bite') { pitch = 0.6 + Math.sin(this.t * 22) * 0.05; bend = 0.2 + Math.sin(this.t * 18) * 0.06; jig = Math.sin(this.t * 25) * 0.015; R.position.x += jig; R.position.y -= 0.03; }
      else if (this.fishSt === 'reel') { pitch = 0.2 + (1 - k) * 1.1; bend = 0.25 * k; }
      this.rod.rotation.set(pitch, 0, 0); this.rodJ.forEach((j, i) => { j.rotation.x = -bend * (0.4 + i * 0.35); }); }
    this.bhit = Math.max(0, (this.bhit || 0) - dt * 5); this.gbreak = Math.max(0, (this.gbreak || 0) - dt * 1.4);
    if (this.mode !== 'fist' || this.punch <= 0) { if (this.armL.userData.streak) this.armL.userData.streak.visible = this.armR.userData.streak.visible = false; if (this.mode !== 'sword' && this.mode !== 'gun' && this.punch <= 0) { this.root.rotation.z *= 0.8; this.root.position.z *= 0.8; } }
    if (this.blockK > 0.01) { const b = this.blockK * this.blockK * (3 - 2 * this.blockK); const hb = this.bhit; const jit = hb * Math.sin(this.t * 70) * 0.012;
      const lerpRot = (A, x, y, z) => { A.rotation.x += (x - A.rotation.x) * b; A.rotation.y += (y - A.rotation.y) * b; A.rotation.z += (z - A.rotation.z) * b; };
      if (this.mode === 'sword') { R.position.lerp(new B.Vector3(0.2 + jit, -0.2 + hb * 0.03, -0.42 + hb * 0.08), b); lerpRot(R, 0.35, -1.25, -0.15); L.position.lerp(new B.Vector3(-0.12, -0.3, -0.44 + hb * 0.06), b); lerpRot(L, 0.9, 0.5, 0.3); }
      else { L.position.lerp(new B.Vector3(-0.17 + jit, -0.46 + hb * 0.02, -0.4 + hb * 0.1), b); R.position.lerp(new B.Vector3(0.17 + jit, -0.48 + hb * 0.02, -0.38 + hb * 0.1), b); lerpRot(L, 1.2, 0, -0.62); lerpRot(R, 1.2, 0, 0.62); }
      this.root.position.y = -0.02 * b; }
    else this.root.position.y = 0;
    if (this.gbreak > 0) { const g2 = Math.sin(Math.min(1, (1 - this.gbreak) * 3) * Math.PI / 2) * this.gbreak; L.position.x -= 0.25 * g2; R.position.x += 0.25 * g2; L.position.y -= 0.2 * g2; R.position.y -= 0.2 * g2; L.rotation.z += 0.6 * g2; R.rotation.z -= 0.6 * g2; this.root.rotation.x = -0.08 * g2; } else this.root.rotation.x = 0;
  }
  _aura(dt) { const on = !!this.auraCol && this.mode === 'fist';
    for (const A of [this.armL, this.armR]) { const au = A.userData.aura; if (!au) continue; au.visible = on; if (!on) continue;
      au.children.forEach((m, i) => { const p = (m.userData.ph += dt * (2 + i * 0.3)); const k = (p % 1.6) / 1.6; m.position.set(Math.cos(i * 2.4 + p) * 0.07, -0.02 + k * 0.16, Math.sin(i * 2.4 + p) * 0.07); m.scale.setScalar((1 - k) * (0.8 + this.cast * 1.5)); }); }
    this.auraMat.opacity = 0.55 + Math.sin(this.t * 12) * 0.15; }
  render(renderer, aspect) { const k = Math.max(0.34, Math.min(1, aspect / 1.6)); this.root.position.set(0, (1 - k) * 0.02, 0); this.root.scale.set(0.5 * k, 0.5 * (0.85 + 0.15 * k), 0.5); this.cam.aspect = aspect; this.cam.updateProjectionMatrix(); renderer.clearDepth(); renderer.render(this.scene, this.cam); }
}
