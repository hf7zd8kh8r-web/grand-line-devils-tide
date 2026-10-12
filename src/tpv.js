// Third-person (over-the-shoulder) camera + full player body with held weapon and fruit glow.
import { THREE as B, setOutlinesVisible } from './engine.js';
import { makeAvatar, animChar } from './models.js';
import { FRUITS } from './data.js';
import { IN } from './input.js';
const KEY = 'gldt_cam';
export class ThirdPerson {
  constructor(g) { this.g = g; this.on = localStorage.getItem(KEY) === 'tp'; document.body.classList.toggle('tpcam', this.on); this.body = null; this.key = ''; this.dist = 3.4; this.atk = 0; this.cast = 0; this.camP = new B.Vector3(); }
  toggle(v) { this.on = v ?? !this.on; localStorage.setItem(KEY, this.on ? 'tp' : 'fp'); if (!this.on) this.drop(); this.g.vm.root.visible = !this.on && !this.g.seat; document.body.classList.toggle('tpcam', this.on); this.g.ui.toast(this.on ? '🎥 Third-person view (V to switch)' : '👁 First-person view', 'blk'); }
  drop() { if (!this.body) return; this.g.scene.remove(this.body.root); this.body.root.traverse(o => { if (o.geometry && !o.userData.shared) o.geometry.dispose(); }); this.body = null; this.key = ''; }
  ensure() { const S = this.g.save; const k = JSON.stringify([S.faction, S.race, S.look, S.cosEq, S.slot, S.eq.sword, S.eq.gun, S.eq.fruit, S.tf, (S.t2 || {})[S.eq.sword]]); if (this.body && k === this.key) return; this.drop(); this.key = k;
    const c = makeAvatar(S.faction, S.race, S.look, S.cosEq); this.g.scene.add(c.root); setOutlinesVisible(c.root); this.body = c; const vm = this.g.vm; const hand = c.bones.foreR, handL = c.bones.foreL; const fy = hand.position.y;
    const grab = (src, bone, ry) => { if (!src || !src.children.length) return; const w = src.clone(true); w.visible = true; w.traverse(o => { o.visible = true; if (o.geometry) o.userData.shared = true; }); const h = new B.Group(); h.position.set(0, fy * 1.0, 0.04); h.rotation.set(Math.PI / 2, ry, 0); h.add(w); w.rotation.set(-Math.PI / 2, Math.PI, 0); w.scale.setScalar(1.0); bone.add(h); };
    if (S.slot === 'sword') { grab(vm.sword, hand, 0); if (vm.swordL && vm.swordL.children.length) grab(vm.swordL, handL, 0); }
    if (S.slot === 'gun') grab(vm.gun, hand, 0);
    const f = S.slot === 'fruit' && S.eq.fruit && FRUITS[S.eq.fruit]; if (f) { const col = f.glow || f.col[0]; this.glows = [hand, handL].map(bn => { const m = new B.Mesh(new B.SphereGeometry(0.14, 10, 8), new B.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55, depthWrite: false, blending: B.AdditiveBlending })); m.position.set(0, fy, 0); bn.add(m); return m; }); } else this.glows = null; }
  // called after player movement; returns true if it placed the camera
  update(dt) { const g = this.g, p = g.p; if (!this.on || g.cut) { if (this.body) this.body.root.visible = false; return false; }
    this.ensure(); const c = this.body; c.root.visible = !g.dead; g.vm.root.visible = false;
    c.root.position.set(p.pos.x, p.pos.y + (p.swim ? -0.45 : 0), p.pos.z); c.root.rotation.y = p.yaw + Math.PI; { const ts = g.save.tf === 2 ? 1.45 : g.save.tf === 1 ? 1.12 : 1; c.root.scale.setScalar(ts); }
    const vm = g.vm; const a = Math.max(vm.punch || 0, vm.swing || 0, vm.kick || 0); this.cast = Math.max(vm.cast || 0, vm.recoil || 0);
    animChar(c, { move: p.moving ? (IN_SPRINT(g) ? 1.25 : 1) : 0, phase: p.phase, attack: a > 0.02 ? a : 0, aim: g.save.slot === 'gun' || this.cast > 0.05, block: !!IN.held.block, sit: !!g.seat, swim: p.swim }, g.t);
    if (!p.ground && !p.swim) { const B_ = c.bones; B_.legL.rotation.x = -0.6; B_.shinL.rotation.x = 0.9; B_.legR.rotation.x = 0.2; B_.shinR.rotation.x = 0.3; }
    if (this.glows) for (const m of this.glows) m.scale.setScalar(1 + Math.sin(g.t * 8) * 0.15 + this.cast * 0.8);
    // camera: behind + over the right shoulder, pulled in when terrain/walls are in the way
    const eye = g.st.eye * (g.save.race === 'Giant' ? 1 : 1); const head = new B.Vector3(p.pos.x, p.pos.y + eye * 0.92, p.pos.z);
    const cp = Math.cos(p.pitch), sp = Math.sin(p.pitch); const fw = new B.Vector3(-Math.sin(p.yaw) * cp, sp, -Math.cos(p.yaw) * cp); const rt = new B.Vector3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
    const scale = (g.save.race === 'Giant' ? 1.6 : 1) * (g.save.tf === 2 ? 1.35 : 1); const want = head.clone().addScaledVector(fw, -this.dist * scale).addScaledVector(rt, 0.75 * scale).add(new B.Vector3(0, 0.35 * scale, 0));
    let best = 1; const tmp = new B.Vector3(); const R = 0.3;
    for (let i = 1; i <= 16; i++) { const k = i / 16; tmp.lerpVectors(head, want, k); if (g.groundAt(tmp.x, tmp.z) + 0.25 > tmp.y || hitCol(g.island.colliders, tmp.x, tmp.z, R, tmp.y)) { best = Math.max(0.12, (i - 1) / 16 - 0.04); break; } }
    const target = head.clone().lerp(want, best); const k = 1 - Math.exp(-dt * (best < (this._last ?? 1) ? 16 : 6)); this._last = best; if (this.camP.lengthSq() === 0 || this.camP.distanceTo(target) > 6) this.camP.copy(target); else this.camP.lerp(target, k);
    const sh = g.fx.shake * g.fx.shake * 0.25; g.cam.position.copy(this.camP); g.cam.position.x += (Math.random() - 0.5) * sh; g.cam.position.y += (Math.random() - 0.5) * sh;
    g.cam.rotation.set(p.pitch, p.yaw, 0); c.root.visible = !g.dead && this.camP.distanceTo(head) > 0.7; g.vm.root.visible = !c.root.visible && !g.seat; this.close = !c.root.visible; return true; }
}
function IN_SPRINT(g) { return false; }
function hitCol(C, x, z, r, y) { for (const c of C) { if (c.h !== undefined && y > c.h) continue; if (c.r !== undefined) { if (Math.hypot(x - c.x, z - c.z) < c.r + r && c.r > 0.6) return true; } else { const cs = Math.cos(-c.rot), sn = Math.sin(-c.rot); const lx = (x - c.x) * cs - (z - c.z) * sn, lz = (x - c.x) * sn + (z - c.z) * cs; if (Math.abs(lx) < c.hw + r && Math.abs(lz) < c.hd + r) return true; } } return false; }
