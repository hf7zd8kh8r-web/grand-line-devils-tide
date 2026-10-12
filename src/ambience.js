// Day/night cycle (shared clock, so every crewmate sees the same time) + storm weather.
import { THREE as B } from './engine.js';
const DAY = 16 * 60; // seconds per full day
const C = (h) => new B.Color(h);
export class Ambience {
  constructor(g) { this.g = g; this.storm = 0; this.stormT = 0; this.flash = 0; this.b = null;
    // stars
    const n = 500, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * 6.283, r = 400; const s = Math.sqrt(1 - u * u); pos.set([Math.cos(a) * s * r, Math.abs(u) * r * 0.9 + 20, Math.sin(a) * s * r], i * 3); }
    const geo = new B.BufferGeometry(); geo.setAttribute('position', new B.BufferAttribute(pos, 3));
    this.stars = new B.Points(geo, new B.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); this.stars.renderOrder = -2; this.stars.frustumCulled = false;
    // moon
    this.moon = new B.Mesh(new B.SphereGeometry(9, 14, 10), new B.MeshBasicMaterial({ color: 0xf2f0dc, fog: false, transparent: true, opacity: 0 })); this.moon.frustumCulled = false;
    // rain: short streaks around the camera
    const rn = 700, rp = new Float32Array(rn * 6); this.rainP = rp; for (let i = 0; i < rn; i++) this._drop(i, true);
    const rg = new B.BufferGeometry(); rg.setAttribute('position', new B.BufferAttribute(rp, 3)); this.rain = new B.LineSegments(rg, new B.LineBasicMaterial({ color: 0xbfd6ff, transparent: true, opacity: 0.0, depthWrite: false })); this.rain.frustumCulled = false; this.rain.visible = false;
  }
  _drop(i, init) { const p = this.rainP; const x = (Math.random() - 0.5) * 40, z = (Math.random() - 0.5) * 40, y = init ? Math.random() * 20 : 18 + Math.random() * 4; p.set([x, y, z, x + 0.15, y - 0.9, z], i * 6); }
  attach(scene) { scene.add(this.stars, this.moon, this.rain); }
  // remember the island's own palette so night/storm can be blended on top
  base() { const g = this.g, u = g.sky.userData.mat.uniforms, wu = g.water.userData.mat.uniforms; this.b = { top: u.top.value.clone(), bot: u.bot.value.clone(), fog: g.scene.fog.color.clone(), hemi: g.hemi.intensity, hc: g.hemi.color.clone(), sun: g.sun.intensity, sc: g.sun.color.clone(), deep: wu.deep.value.clone(), sh: wu.shallow.value.clone(), wf: wu.fogC.value.clone() }; this.attach(g.scene); }
  phase() { return ((Date.now() / 1000) % DAY) / DAY; } // 0 = sunrise
  clock() { const h = (this.phase() * 24 + 6) % 24; return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`; }
  // night 0..1 (day 0-0.55, dusk to 0.62, night to 0.92, dawn to 1)
  nightK() { const t = this.phase(); if (t < 0.55) return 0; if (t < 0.62) return (t - 0.55) / 0.07; if (t < 0.92) return 1; return 1 - (t - 0.92) / 0.08; }
  isNight() { return this.nightK() > 0.6; }
  duskK() { const t = this.phase(); const d = (a, b) => Math.max(0, 1 - Math.abs(t - a) / b); return Math.max(d(0.585, 0.05), d(0.96, 0.05), d(0.0, 0.03), d(1.0, 0.03)); }
  startStorm(sec = 90) { this.stormT = sec; }
  update(dt) { const g = this.g; if (!this.b) return; const b = this.b; const n = this.nightK() * 0.85, dk = this.duskK();
    this.stormT = Math.max(0, this.stormT - dt); const want = this.stormT > 0 ? 1 : 0; this.storm += (want - this.storm) * Math.min(1, dt * 0.6); const s = this.storm;
    const u = g.sky.userData.mat.uniforms, wu = g.water.userData.mat.uniforms;
    if (!g.cut || !g.cut.sky) { // specials animate the sky themselves
      u.top.value.copy(b.top).lerp(C(0x0a1230), n).lerp(C(0x2a3038), s * 0.8); u.bot.value.copy(b.bot).lerp(C(0xff9a5a), dk * 0.55).lerp(C(0x1c2848), n).lerp(C(0x4a5058), s * 0.75); }
    g.scene.fog.color.copy(b.fog).lerp(C(0xffb07a), dk * 0.35).lerp(C(0x18223c), n).lerp(C(0x4a5058), s * 0.7); wu.fogC.value.copy(g.scene.fog.color);
    this.flash = Math.max(0, this.flash - dt * 4); if (s > 0.6 && Math.random() < dt * 0.25) { this.flash = 1; if (g.fx) g.fx.shake = Math.max(g.fx.shake, 0.15); }
    g.hemi.intensity = b.hemi * (1 - 0.5 * n) * (1 - 0.35 * s) + this.flash * 2.5; g.hemi.color.copy(b.hc).lerp(C(0x8aa0ff), n * 0.6);
    g.sun.intensity = b.sun * (1 - 0.72 * n) * (1 - 0.6 * s); g.sun.color.copy(b.sc).lerp(C(0xffa060), dk * 0.6).lerp(C(0xa8b8ff), n);
    wu.deep.value.copy(b.deep).lerp(C(0x04142a), n * 0.8).lerp(C(0x1a2a34), s * 0.5); wu.shallow.value.copy(b.sh).lerp(C(0x0e3050), n * 0.8).lerp(C(0x3a5a64), s * 0.5);
    const cp = g.cam.position; this.stars.position.copy(cp); this.stars.material.opacity = Math.max(0, n - s) * 0.95;
    this.moon.position.set(cp.x - 160, cp.y + 150, cp.z - 260); this.moon.material.opacity = Math.max(0, n - s);
    this.rain.visible = s > 0.05; if (this.rain.visible) { this.rain.material.opacity = 0.55 * s; this.rain.position.set(cp.x, cp.y - 6, cp.z); const p = this.rainP; for (let i = 0; i < p.length / 6; i++) { p[i * 6 + 1] -= dt * 26; p[i * 6 + 4] -= dt * 26; if (p[i * 6 + 4] < 0) this._drop(i); } this.rain.geometry.attributes.position.needsUpdate = true; }
  }
}
