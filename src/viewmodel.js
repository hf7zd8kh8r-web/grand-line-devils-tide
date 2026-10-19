import { THREE, Builder, mat, toonMat } from './engine.js';
import { buildSword, lookOf, auraOf, SANBON, tickSwordFx } from './swordlook.js';
import { SWINGS, COMBO, swingPose, bladeQuat, Crescent, Sparks, placeArm, POSES, REST, CHARGE, eOut3, sstep, c01 } from './vmanim.js';
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
      b.add(cyl(0.085, 0.078, 0.34), sleeve, mat(0, 0, 0.14, RX), o); b.add(cyl(0.09, 0.085, 0.8), sleeve, mat(0, 0, 0.7, RX), { outline: false });                                  // sleeve
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
    this.rig = new B.Group(); this.root.add(this.rig); this.swP = new B.Group(); this.rig.add(this.swP); this.sword = new B.Group(); this.swP.add(this.sword); this.sword.rotation.x = Math.PI / 2;
    this.swPL = new B.Group(); this.rig.add(this.swPL); this.swPM = new B.Group(); this.rig.add(this.swPM); this.fxG = new B.Group(); this.rig.add(this.fxG); this.cres = [new Crescent(this.fxG), new Crescent(this.fxG)]; this.sparks = new Sparks(this.rig);
    this.an = { cur: [null, null], hold: 0, q: [] }; this.camOff = { p: 0, y: 0, r: 0 }; this._o = [{ p: new B.Vector3(), d: new B.Vector3(), e: new B.Vector3() }, { p: new B.Vector3(), d: new B.Vector3(), e: new B.Vector3() }]; this._q = new B.Quaternion(); this._v = [new B.Vector3(), new B.Vector3(), new B.Vector3(), new B.Vector3()];
    this.hp = [{ p: new B.Vector3(0.3, -0.5, -0.72), q: new B.Quaternion() }, { p: new B.Vector3(-0.3, -0.5, -0.72), q: new B.Quaternion() }];
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
    if (def._id && lookOf(def._id)) { // distinct procedural look per sword (swordlook.js); santoryu = Shusui / Sandai / Wado
      const san = def.santoryu, au = san ? auraOf(def._id, def._t2) : null; const g = san ? buildSword(SANBON[0], false, this.mat, 'r', au) : buildSword(def._id, def._t2, this.mat);
      this.sword.add(g); this.swordLen = g.userData.len; if (this.mouth) { this.mouth.removeFromParent(); this.mouth = null; } if (this.swordL) { this.swordL.removeFromParent(); this.swordL = null; }
      if (san) { this.swordL = new B.Group(); this.swordL.add(buildSword(SANBON[1], false, this.mat, 'l', au)); this.swordL.rotation.x = Math.PI / 2; this.swPL.add(this.swordL); this.mouth = new B.Group(); this.mouth.add(buildSword(SANBON[2], false, this.mat, 'm', au)); this.mouth.rotation.x = Math.PI / 2; this.mouth.scale.setScalar(0.92); this.swPM.add(this.mouth); }
      this.swordDef = def; return; }
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
    const g = b.build(this.mat); this.sword.add(g); this.swordLen = L; if (this.mouth) { this.mouth.removeFromParent(); this.mouth = null; } this.swordDef = null;
    if (this.swordL) { this.swordL.removeFromParent(); this.swordL = null; }
    if (def.santoryu) { this.swordL = new B.Group(); this.swordL.add(g.clone()); this.swordL.rotation.x = Math.PI / 2; this.swPL.add(this.swordL); this.mouth = new B.Group(); this.mouth.add(g.clone()); this.mouth.rotation.x = Math.PI / 2; this.mouth.scale.setScalar(0.92); this.swPM.add(this.mouth); }
    this.swordDef = def;
  }
  aura(col) { this.auraCol = col; this.auraMat.color.setHex(col || 0xffffff); }
  setMode(m) { this.mode = m; if (!this.armR) return; this.sword.visible = m === 'sword'; if (this.swordL) this.swordL.visible = m === 'sword'; this.gun.visible = m === 'gun'; this.equipK = 0; if (this.mouth) this.mouth.visible = m === 'sword'; if (this.trailM) this.trailM.visible = false; if (this.an) { this.an.sw = null; this.an.q.length = 0; } this.cp = null; }
  tint(hex, k) { this.mat.emissive.setHex(hex); this.mat.emissiveIntensity = k; }
  doPunch() { this.punch = 1; this.side = -this.side; }
  doKick() { this.kick = 1; }
  setStyle(col, on) { this.styleCol = on ? col : null; }
  // ---- sword: keyframed combo swings ----
  doSwing(kind) { const a = this.an; if (!a) return; if (!kind) { if (this.t - (a.lastT ?? -9) > 0.95) a.ci = -1; a.ci = ((a.ci ?? -1) + 1) % COMBO.length; kind = COMBO[a.ci]; } a.lastT = this.t; a.q.length = 0;
    this._startSwing(kind, false); this.swing = 1; this.side = (SWINGS[kind].A > 90 && SWINGS[kind].A < 270) ? 1 : -1; this.swc = a.ci; return kind; }
  doSkillSwing(kind) { const a = this.an; if (!a) return; a.q.length = 0; if (kind === 'spin') { this._startSwing('spinA', true); a.q.push('spinB', 'spinA', 'spinB'); } else if (kind === 'combo') { this._startSwing('diag', true); a.q.push('rise', 'sweep'); } else this._startSwing(SWINGS[kind] ? kind : 'over', true); this.swing = 1; a.lastT = this.t; a.ci = -1; }
  _startSwing(kind, skill) { const S = SWINGS[kind] || SWINGS.diag; const fr = this.hp.map(h => ({ p: h.p.clone(), q: h.q.clone() })); this.an.sw = { k: kind, S, t: 0, fr, Tw: S.Tw ?? (skill ? 0.13 : 0.07), Ts: S.Ts ?? 0.095, To: 0.05, Th: 0.08, Tr: 0.24, built: false, big: !!(S.big || skill || S.heavy), lag: this.swordL ? 0.025 : 0, released: false }; }
  hitPause(t = 0.07) { if (this.an) this.an.hold = Math.max(this.an.hold, t); }
  impact(col) { if (!this.sparks || this.mode !== 'sword') return; const h = this.hp[0], L = this.swordLen || 1; const d = this._v[3].set(0, 1, 0).applyQuaternion(h.q); const at = this._v[2].copy(h.p).addScaledVector(d, L * 0.62); at.x *= this.xk || 1; this.sparks.fire(at, col ?? this._trailCol ?? 0xffffff, 1); }
  _swordAnim(dt, bob, bobx, drop) { const a = this.an, three = !!this.swordL, L = this.swordLen || 1, xk = this.xk || 1, t = this.t; this._ik = true;
    const O = this._o; const idle = (i, o) => { const s = i ? -1 : 1; if (three) { o.p.set(0.38 * s, -0.44, -0.8); o.d.set(-0.3 * s, 0.76, -0.56); } else { o.p.set(0.34, -0.44, -0.82); o.d.set(-0.42, 0.78, -0.5); } o.e.set(-0.8 * s, -0.2, -0.6);
      o.p.y += bob + Math.sin(t * 1.7) * 0.008 - drop * 1.4; o.p.x += bobx * s; o.p.z += drop * 0.4; o.d.x += Math.sin(t * 1.1 + i) * 0.03 - drop * 1.2 * s; o.d.z += drop * 1.5; o.d.normalize();
      if (this.blockK > 0.01) { const b = this.blockK * this.blockK * (3 - 2 * this.blockK), hb = this.bhit || 0; o.p.lerp(this._v[0].set((three ? 0.2 : 0.1) * s, -0.3 + hb * 0.03, -0.6 + hb * 0.08), b); o.d.lerp(this._v[1].set(-1 * s, three ? 0.5 : 0.22, -0.3), b).normalize(); o.e.lerp(this._v[1].set(0, 1, -0.2), b); } return o; };
    const sw = a.sw; let crest = 0; this.camOff.p *= Math.exp(-dt * 12); this.camOff.y *= Math.exp(-dt * 12); this.camOff.r *= Math.exp(-dt * 12);
    for (let i = 0; i < (three ? 2 : 1); i++) { const o = O[i], h = this.hp[i]; idle(i, o); const iq = bladeQuat(o.d, o.e, this._q).clone(); const ip = o.p.clone();
      if (!sw) { const k = 1 - Math.exp(-dt * 16); h.p.lerp(ip, k); h.q.slerp(iq, k); continue; }
      const tt = sw.t - (i ? sw.lag : 0); let u, bl = 1, rec = 0; const T1 = sw.Tw, T2 = T1 + sw.Ts, T3 = T2 + sw.To, T4 = T3 + sw.Th;
      if (tt < T1) { u = -0.14; bl = eOut3(c01(tt / T1)); } else if (tt < T2) { const x = (tt - T1) / sw.Ts; u = -0.14 + 1.14 * (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2); } else if (tt < T3) u = 1 + 0.07 * Math.sin((tt - T2) / sw.To * Math.PI / 2); else if (tt < T4) u = 1.07 - 0.07 * sstep((tt - T3) / sw.Th); else { u = 1; rec = sstep(c01((tt - T4) / sw.Tr)); }
      swingPose(sw.S, u, o); if (i) { o.p.x = -o.p.x; o.d.x = -o.d.x; o.e.x = -o.e.x; } const sq = bladeQuat(o.d, o.e, this._q).clone();
      if (bl < 1) { h.p.copy(sw.fr[i].p).lerp(o.p, bl); h.q.copy(sw.fr[i].q).slerp(sq, bl); } else if (rec > 0) { h.p.copy(o.p).lerp(ip, rec); h.q.copy(sq).slerp(iq, rec); } else { h.p.copy(o.p); h.q.copy(sq); }
      // crescent arc: built on release, head follows the blade, then fades fast
      const C = this.cres[i]; if (tt >= T1 && !sw['b' + i]) { sw['b' + i] = 1; C.build(sw.S, -0.14, 1.07, L, !!i, xk, sw.big); }
      if (sw['b' + i]) { const head = c01((u + 0.14) / 1.21 + 0.02); const fade = tt < T2 ? 1 : c01(1 - (tt - T2) / (sw.big ? 0.18 : 0.1)); C.set(head, fade * (sw.big ? 1 : 0.9), this._trailCol ?? 0xbfe0ff); crest = Math.max(crest, fade); } }
    if (sw) { if (a.hold > 0) a.hold -= dt; else sw.t += dt; const S = sw.S, tt = sw.t; const T1 = sw.Tw, T2 = T1 + sw.Ts; const cam = S.cam || {};
      const amp = tt < T1 ? -0.35 * eOut3(tt / T1) : Math.sin(Math.min(1, (tt - T1) / (sw.Ts + 0.1)) * Math.PI) * (1 - c01((tt - T2 - 0.1) / 0.2));
      this.camOff.r = (cam.r || 0) * amp; this.camOff.y = (cam.y || 0) * amp; this.camOff.p = (cam.p || 0) * amp;
      if (!sw.released && tt >= T1) { sw.released = true; if (this.onKick) this.onKick(S.heavy ? 0.03 : 0.012, S.fov || (S.heavy ? 4 : 2), (cam.r || 0) * 0.3); }
      if (tt > T2 + sw.To + sw.Th + (a.q.length ? 0 : sw.Tr)) { a.sw = null; if (a.q.length) this._startSwing(a.q.shift(), true); } }
    else for (const C of this.cres) C.set(0, 0);
    this.swing = sw ? Math.max(0.01, 1 - sw.t / 0.45) : 0;
    // apply: pivots, arms gripping the hilt (two-hand on one sword; one per sword for Three Sword Style)
    const sh = this._v; const shR = sh[0].set(0.6 * xk, -1.08, 0.12), shL = sh[1].set(-0.6 * xk, -1.08, 0.12);
    const zk = this.zk || 1; const put = (P, h) => { P.position.copy(h.p); P.position.x *= xk; P.position.z *= zk; P.quaternion.copy(h.q); };
    put(this.swP, this.hp[0]); const dR = sh[3].set(0, 1, 0).applyQuaternion(this.hp[0].q); const hR = this.swP.position.clone(); placeArm(this.armR, hR, shR, dR, 1, this.armK || 1);
    if (three) { put(this.swPL, this.hp[1]); const dL = new B.Vector3(0, 1, 0).applyQuaternion(this.hp[1].q); placeArm(this.armL, this.swPL.position.clone(), shL, dL, -1, this.armK || 1); }
    else { const hL = hR.clone().addScaledVector(dR, -0.15); placeArm(this.armL, hL, shL, dR, -1, this.armK || 1); }
    if (this.mouth) { this.swPM.visible = three; const k = this.swing; this.swPM.position.set(-0.05 * xk, -0.6 + bob * 0.6 - drop, -0.48); this.swPM.quaternion.copy(bladeQuat(sh[2].set(1, 0.06 + Math.sin(t * 1.3) * 0.02 + k * 0.05, -0.28), new B.Vector3(0, -0.2, -1), this._q)); }
    this.fxG.scale.x = 1; }
  // ---- fruit / style cast poses ----
  doCast(k = 0) { const kind = typeof k === 'string' ? k : k >= 1 ? 'push' : k > 0 ? 'stretch' : 'jab'; this.doPose(kind, { str: typeof k === 'number' && k > 0 && k < 1 ? k : 1 }); }
  fruitArc(kind, col, big = false, x = false) { if (!this.cres) return; this.fa = { t: 0, S: SWINGS[kind] || SWINGS.sweep, col: new B.Color(col).lerp(new B.Color(0xffffff), 0.35).getHex(), big, x, b: 0 }; }
  charge(T = 0.12, big = false) { if (!this.armR) return; this.cp = { kind: 'charge', t: 0, Tc: T, big, fr: this._handsNow() }; this.cast = 1; }
  doPose(kind, o = {}) { if (!this.armR) return; const P = POSES[kind] || POSES.push; const ch = this.cp && this.cp.kind === 'charge';
    let side = 1; if (P.one) { side = this.t - (this._pT ?? -9) > 0.7 ? 1 : -(this._pS || -1); this._pS = side; } this._pT = this.t;
    this.cp = { kind, P, side, t: 0, Tc: ch ? 0.0001 : (o.Tc ?? 0.04), Ts: o.Ts ?? 0.075, Th: (P.hold ?? 0.06) + (o.hold || 0), Tr: 0.24, big: !!o.big || (ch && this.cp.big), fr: this._handsNow(), str: o.str ?? 1, fired: false, glow0: ch ? 1 : 0 }; this.cast = 1; }
  _handsNow() { return [this.armR, this.armL].map(A => A.localToWorld(new B.Vector3(0, 0, -0.41)).applyMatrix4(new B.Matrix4().copy(this.root.matrixWorld).invert())).map(v => { v.x /= (this.xk || 1); return v; }); }
  _poseTargets(c, out) { // -> out[0..1] hand targets (unsqueezed root space), returns {w, glow}
    const t = c.t, V0 = out[0], V1 = out[1]; const tw = (a, b, k, i) => (i ? V1 : V0).set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
    if (c.kind === 'charge') { const k = eOut3(c01(t / c.Tc)); const j = Math.sin(t * 46) * 0.006 * k; for (let i = 0; i < 2; i++) { tw(c.fr[i].toArray(), CHARGE[i], k, i); (i ? V1 : V0).x += j * (i ? -1 : 1); } return { glow: k, rel: 0 }; }
    const P = c.P, s = c.side; const pick = (arr, i) => { const q = arr[s > 0 ? i : 1 - i]; return s > 0 ? q : [-q[0], q[1], q[2]]; };
    const T1 = c.Tc, T2 = T1 + c.Ts, T3 = T2 + c.Th; let glow = 0, rel = 0;
    for (let i = 0; i < 2; i++) { const C = pick(P.C, i), X = pick(P.X, i), R = REST[i];
      if (t < T1) { tw(c.fr[i].toArray(), C, eOut3(c01(t / T1)), i); glow = c.glow0 + (1 - c.glow0) * 0.3; }
      else if (t < T2) { tw(C, X, eOut3((t - T1) / c.Ts) * 1.07, i); rel = 1; glow = 1; }
      else if (t < T3) { const x = (t - T2) / c.Th; tw(C, X, 1.07 - 0.07 * sstep(Math.min(1, x * 3)), i); const v = i ? V1 : V0; const rk = Math.sin(Math.min(1, x * 2.5) * Math.PI) * (P.rec ?? 0.1); v.z += rk; v.y += rk * 0.3; rel = 1 - x * 0.6; glow = 1 - x * 0.5; }
      else { const x = sstep(c01((t - T3) / c.Tr)); tw(X, R, x, i); rel = 0; glow = 0.5 * (1 - x); } }
    return { glow, rel }; }
  _castPose(dt, bob) { const c = this.cp; if (!c) return; c.t += dt; const end = c.kind === 'charge' ? c.Tc + 0.35 : c.Tc + c.Ts + c.Th + c.Tr; if (c.t > end) { if (c.kind === 'charge') { this.cp = null; this.doPose('push', { Tc: 0.0001 }); } else this.cp = null; return; }
    const out = [this._v[0], this._v[1]]; const r = this._poseTargets(c, out); const xk = this.xk || 1; this._ik = true;
    const sh = [new B.Vector3(0.6 * xk, -1.08, 0.12), new B.Vector3(-0.6 * xk, -1.08, 0.12)]; const P = c.P || {}; const up = c.kind === 'push' || c.kind === 'raise' || c.kind === 'palm';
    [this.armR, this.armL].forEach((A, i) => { const h = out[i].clone(); h.y += bob; h.x *= xk; h.z *= this.zk || 1; const s = i ? -1 : 1; placeArm(A, h, sh[i], up ? new B.Vector3(0, 1, 0) : new B.Vector3(-s, 0.35, 0), s, this.armK || 1); });
    if (P.str && c.t > c.Tc) { const x = (c.t - c.Tc) / (c.Ts + c.Th); const k = x < 0.35 ? x / 0.35 : Math.max(0, 1 - (x - 0.35) / 0.65); const A = c.side > 0 ? this.armR : this.armL; A.scale.z = 1 + 3.2 * c.str * k; }
    if (!c.fired && c.kind !== 'charge' && c.t >= c.Tc) { c.fired = true; const k = P.kick || [0.02, 3, 0]; if (this.onKick) this.onKick(k[0] * (c.big ? 1.6 : 1), k[1] * (c.big ? 1.5 : 1), k[2] * c.side); if (P.cp) this.camOff.p = P.cp * (c.big ? 1.4 : 1);
      const x = (c.side > 0 ? P.X[0] : [-P.X[0][0], P.X[0][1], P.X[0][2]]); const at = new B.Vector3(x[0] * xk, x[1], x[2] - 0.12); this.sparks.fire(at, this.auraCol || this.styleCol || 0xffffff, c.big ? 1.3 : 0.8); if (!P.one) { this.sparks.fire(at.set(-x[0] * xk, x[1], x[2] - 0.12), this.auraCol || 0xffffff, c.big ? 1.3 : 0.8); } }
    this.camOff.p *= Math.exp(-dt * 7);
    const col = this.auraCol || this.styleCol || 0xffffff; for (const [gl, A, i] of [[this.fistGlowR, this.armR, 0], [this.fistGlowL, this.armL, 1]]) { if (!gl) continue; const one = P.one && (c.side > 0 ? i === 1 : i === 0); const g = one ? 0 : r.glow; gl.visible = g > 0.02; if (!gl.visible) continue; gl.material.color.setHex(col); gl.material.opacity = Math.min(0.8, 0.18 + g * 0.42); gl.scale.setScalar(0.45 + g * (c.big ? 0.75 : 0.5) + r.rel * 0.25); } }
  handWorld(side, mainCam, out) { if (!this.armR || !mainCam) return null; const xk = this.xk || 1; let v;
    const c = this.cp; if (c && c.P) { const P = c.P; const i = side > 0 ? 0 : 1; const q = (c.side > 0 ? P.X[i] : P.X[1 - i]); v = new B.Vector3((c.side > 0 ? q[0] : -q[0]) * xk, q[1], q[2] - 0.1); this.root.updateMatrixWorld(true); this.root.localToWorld(v); }
    else { this.scene.updateMatrixWorld(); v = (side > 0 ? this.armR : this.armL).localToWorld(new B.Vector3(0, 0, -0.5)); }
    const d = Math.max(0.7, v.length() * 2); const n = v.clone().project(this.cam); n.x = Math.max(-0.95, Math.min(0.95, n.x)); n.y = Math.max(-0.95, Math.min(0.95, n.y)); mainCam.updateMatrixWorld(); const dir = new B.Vector3(n.x, n.y, 0.5).unproject(mainCam).sub(mainCam.position).normalize(); return (out || new B.Vector3()).copy(mainCam.position).addScaledVector(dir, d); }
  setTrailColor(c) { const l = (((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11) / 255; this._trailCol = l > 0.72 ? 0x2f86ff : c; } // pale blades get a saturated blue rim so the white-core slash reads against bright skies
  doShoot() { this.recoil = 1; this.flashT = 0.06; if (this.flash) { this.flash.rotation.z = Math.random() * 6.28; this.flash.scale.setScalar(0.8 + Math.random() * 0.5); } }
  blockHit() { this.bhit = 1; }
  guardBreak() { this.gbreak = 1; }
  update(dt, st) {
    this.t += dt; if (!this.armR) return; this._aura(dt); tickSwordFx(this.t);
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
    } else if (this.mode === 'sword') { if (this.armL.userData.streak) this.armL.userData.streak.visible = this.armR.userData.streak.visible = false; this._swordAnim(dt, bob, bobx, drop);
    } else if (this.mode === 'gun') {
      const rc = this.recoil, rk = rc > 0.8 ? (1 - rc) / 0.2 : rc / 0.8; R.position.set(0.22, -0.22 + bob - drop + rk * 0.04, -0.42 + rk * 0.12); R.rotation.set(rk * 0.65, -0.05, rk * 0.12); this.root.rotation.z = rk * 0.03;
      this.flashT = (this.flashT || 0) - dt; if (this.flash) this.flash.visible = this.flashT > 0;
      L.position.y -= 0.15;
    }
    if (this.mode === 'fist' && !fishing) this._castPose(dt, bob); else this.cp = null;
    if (fishing) { this._ik = false; this.fishK = Math.max(0, this.fishK - dt * (this.fishSt === 'cast' ? 1.6 : 2.4)); const k = this.fishK;
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
      if (this.mode === 'sword') { /* sword guard handled by _swordAnim */ } else if (false) { R.position.lerp(new B.Vector3(0.2 + jit, -0.2 + hb * 0.03, -0.42 + hb * 0.08), b); lerpRot(R, 0.35, -1.25, -0.15); L.position.lerp(new B.Vector3(-0.12, -0.3, -0.44 + hb * 0.06), b); lerpRot(L, 0.9, 0.5, 0.3); }
      else { L.position.lerp(new B.Vector3(-0.17 + jit, -0.46 + hb * 0.02, -0.4 + hb * 0.1), b); R.position.lerp(new B.Vector3(0.17 + jit, -0.48 + hb * 0.02, -0.38 + hb * 0.1), b); lerpRot(L, 1.2, 0, -0.62); lerpRot(R, 1.2, 0, 0.62); }
      this.root.position.y = -0.02 * b; }
    else this.root.position.y = 0;
    if (this.gbreak > 0 && this.mode !== 'sword') { const g2 = Math.sin(Math.min(1, (1 - this.gbreak) * 3) * Math.PI / 2) * this.gbreak; L.position.x -= 0.25 * g2; R.position.x += 0.25 * g2; L.position.y -= 0.2 * g2; R.position.y -= 0.2 * g2; L.rotation.z += 0.6 * g2; R.rotation.z -= 0.6 * g2; this.root.rotation.x = -0.08 * g2; } else this.root.rotation.x = 0;
    if (this.sparks) this.sparks.update(dt); if (!this._ik) { L.position.x *= this.xk || 1; R.position.x *= this.xk || 1; if (this.leg) this.leg.position.x *= this.xk || 1; } this._ik = false;
    if (this.mode !== 'sword') { const f = this.fa; if (f && this.cres) { f.t += dt; if (!f.b) { f.b = 1; this.cres[0].build(f.S, -0.14, 1.07, 1.1, false, this.xk || 1, f.big); if (f.x) this.cres[1].build(f.S, -0.14, 1.07, 1.1, true, this.xk || 1, f.big); } const fade = f.t < 0.09 ? 1 : Math.max(0, 1 - (f.t - 0.09) / 0.16); this.cres[0].set(Math.min(1, f.t / 0.09), fade, f.col); this.cres[1].set(f.x ? Math.min(1, Math.max(0, f.t - 0.03) / 0.09) : 0, f.x ? fade : 0, f.col); if (fade <= 0) this.fa = null; } else if (this.cres) for (const C of this.cres) C.set(0, 0); if (this.an) this.an.sw = null; if (!this.cp) { this.camOff.p *= 0.8; } this.camOff.y *= 0.8; this.camOff.r *= 0.8; }
  }
  _aura(dt) { const on = !!this.auraCol && this.mode === 'fist';
    for (const A of [this.armL, this.armR]) { const au = A.userData.aura; if (!au) continue; au.visible = on; if (!on) continue;
      au.children.forEach((m, i) => { const p = (m.userData.ph += dt * (2 + i * 0.3)); const k = (p % 1.6) / 1.6; m.position.set(Math.cos(i * 2.4 + p) * 0.07, -0.02 + k * 0.16, Math.sin(i * 2.4 + p) * 0.07); m.scale.setScalar((1 - k) * (0.8 + this.cast * 1.5)); }); }
    this.auraMat.opacity = 0.55 + Math.sin(this.t * 12) * 0.15; }
  render(renderer, aspect) { const k = Math.max(0.34, Math.min(1, aspect / 1.6)); this.xk = k < 1 ? Math.max(0.42, k * 1.12) : 1; this.zk = 1 + (1 - k) * 0.35; this.armK = 0.66 + 0.34 * k; this.root.position.set(0, 0, 0); this.root.scale.setScalar(0.5 * (0.62 + 0.38 * k)); this.cam.aspect = aspect; this.cam.updateProjectionMatrix(); renderer.clearDepth(); renderer.render(this.scene, this.cam); }
}
