// Procedural WebAudio music + SFX (all synthesized, no samples / no copyrighted tracks).
// Music lives in music.js (composed pirate tracks + island variants); this file owns the context, iOS unlock, volumes, crossfades and SFX.
import { Music, ISLAND_VARIANT } from './music.js';
const KEY = 'gldt_audio';
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
export class Audio {
  constructor() { let s = {}; try { s = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) {} this.set = { music: s.music ?? 0.55, sfx: s.sfx ?? 0.8, mute: !!s.mute }; this.ctx = null; this.cur = null; this.want = 'cover'; this.layers = {}; this.step = 0; this.last = {}; }
  save() { localStorage.setItem(KEY, JSON.stringify(this.set)); this.apply(); }
  apply() { if (!this.ctx) return; const t = this.ctx.currentTime; this.mG.gain.setTargetAtTime(this.set.mute ? 0 : this.set.music * 0.5, t, 0.08); this.sG.gain.setTargetAtTime(this.set.mute ? 0 : this.set.sfx, t, 0.05); }
  // must be called from a user gesture (iOS)
  unlock() { if (this.ctx) { if (this.ctx.state !== 'running') this.ctx.resume().then(() => this._tryTitle()).catch(() => {}); else this._tryTitle(); return; } const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; const c = this.ctx = new AC();
    this.out = c.createDynamicsCompressor(); this.out.threshold.value = -14; this.out.ratio.value = 4; this.out.connect(c.destination);
    this.mG = c.createGain(); this.sG = c.createGain(); this.mG.connect(this.out); this.sG.connect(this.out);
    // shared reverb (generated impulse)
    const len = c.sampleRate * 1.6, ir = c.createBuffer(2, len, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    this.rev = c.createConvolver(); this.rev.buffer = ir; this.revG = c.createGain(); this.revG.gain.value = 0.25; this.rev.connect(this.revG); this.revG.connect(this.out);
    const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1; this.noiseBuf = nb;
    const lite = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent)); this.music = new Music(c, this.mG, lite);
    // iOS: play a 1-sample silent buffer inside the gesture, and resume after interruptions / returning to the tab
    try { const sb = c.createBufferSource(); sb.buffer = c.createBuffer(1, 1, 22050); sb.connect(c.destination); sb.start(0); } catch (_) {}
    const wake = () => { if (this.ctx && this.ctx.state !== 'running' && !document.hidden) this.ctx.resume().catch(() => {}); }; document.addEventListener('visibilitychange', wake); addEventListener('focus', wake); addEventListener('pageshow', wake);
    this.apply(); this.timer = setInterval(() => this.tick(), 50); if (c.state !== 'running') c.resume().then(() => this._tryTitle()).catch(() => {}); else this._tryTitle(); }
  // anime title call (pre-rendered voice + taiko/brass sting, public/title_voice.mp3): plays once, on the cover, as soon as audio is unlocked; ducks the anthem
  titleCall() { if (this.titleDone) return; this.wantTitle = true; if (!this._tvBuf) this._tvBuf = fetch('./title_voice.mp3').then(r => r.ok ? r.arrayBuffer() : null).catch(() => null); this._tryTitle(); }
  async _tryTitle() { if (!this.wantTitle || this.titleDone || this._tvBusy || !this.ctx || this.ctx.state !== 'running') return; const m = window.__g && window.__g.mode; if (m && m !== 'cover' && m !== 'burst' && m !== 'logo') { this.wantTitle = false; return; }
    this._tvBusy = true; try { const ab = await this._tvBuf; if (!ab || this.titleDone) return; const buf = this._tvDec || (this._tvDec = await this.ctx.decodeAudioData(ab.slice(0))); if (this.titleDone) return; this.titleDone = true; this.titlePlays = (this.titlePlays || 0) + 1;
      if (this.set.mute) return; const c = this.ctx, t = c.currentTime + 0.05; const src = c.createBufferSource(); src.buffer = buf; const g = c.createGain(); g.gain.value = Math.min(1, 0.35 + Math.max(this.set.music, this.set.sfx) * 0.75); src.connect(g); g.connect(this.out); src.start(t);
      const mv = this.set.music * 0.5, p = this.mG.gain; p.cancelScheduledValues(t); p.setTargetAtTime(mv * 0.25, t, 0.08); p.setTargetAtTime(mv, t + buf.duration - 0.4, 0.5); src.onended = () => this.apply(); } finally { this._tvBusy = false; } }
  // duel arena + per-island variants are resolved here so callers just say island/night/battle/boss/sail/cover
  setTheme(name) { const g = typeof window !== 'undefined' && window.__g && window.__g.game; if (g && name !== 'cover' && name !== 'sail') { if (g.duel && g.duel.on) name = 'duel'; else if ((name === 'island' || name === 'night') && g.island && ISLAND_VARIANT[g.island.id]) name = ISLAND_VARIANT[g.island.id]; } this.want = name; }
  // ---------- music (crossfade: old track keeps playing while it fades, new one fades in) ----------
  tick() { const c = this.ctx; if (!c || c.state !== 'running' || !this.music) return; const t = c.currentTime;
    if (this.want !== this.cur) { if (this.curSt) this.music.stop(this.curSt, t); this.cur = this.want; this.curSt = this.cur ? this.music.start(this.cur, t + 0.08) : null; }
    this.music.schedule(t + 0.3); }
  tone(out, f, t, d, type, vol, o = {}) { const c = this.ctx; const os = c.createOscillator(); os.type = type; os.frequency.value = f; if (o.det) os.detune.value = (Math.random() - 0.5) * o.det * 2; const g = c.createGain(); let node = os;
    if (o.cut) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.cut; os.connect(fl); node = fl; }
    if (o.vib) { const lf = c.createOscillator(); lf.frequency.value = o.vib; const lg = c.createGain(); lg.gain.value = f * 0.006; lf.connect(lg); lg.connect(os.frequency); lf.start(t); lf.stop(t + d + 0.5); }
    node.connect(g); g.connect(out); const a = o.att || 0.008; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); if (o.dec) g.gain.setTargetAtTime(vol * 0.35, t + a, o.dec); g.gain.setTargetAtTime(0, t + d, 0.08); os.start(t); os.stop(t + d + 0.5); }
  noise(out, t, d, vol, type = 'highpass', freq = 6000, q = 0.7, f2) { const c = this.ctx; const s = c.createBufferSource(); s.buffer = this.noiseBuf; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = freq; fl.Q.value = q; if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + d); const g = c.createGain(); s.connect(fl); fl.connect(g); g.connect(out); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.05); }
  kick(out, t, v) { const c = this.ctx; const o = c.createOscillator(); const g = c.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.3); }
  snare(out, t, v, d) { this.noise(out, t, d, v, 'bandpass', 1800, 0.8); this.tone(out, 190, t, 0.05, 'triangle', v * 0.5, { dec: 0.03 }); }
  hat(out, t, v, kind) { this.noise(out, t, kind === 'shaker' ? 0.06 : kind === 'tamb' ? 0.09 : 0.035, v, 'highpass', kind === 'tamb' ? 7500 : 8000); }
  tom(out, t, v, f) { const c = this.ctx; const o = c.createOscillator(); const g = c.createGain(); o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.3); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.4); }
  // ---------- SFX ----------
  sfx(name, o = {}) { const c = this.ctx; if (!c || c.state !== 'running' || this.set.mute || this.set.sfx <= 0) return; const t = c.currentTime + 0.005; const now = performance.now();
    if (this.last[name] && now - this.last[name] < (o.gap ?? 35)) return; this.last[name] = now; const out = this.sG; const v = o.vol ?? 1; const pr = 0.92 + Math.random() * 0.16;
    switch (name) {
      case 'whoosh': this.noise(out, t, 0.16, 0.25 * v, 'bandpass', 900 * pr, 1.2, 2600); break;
      case 'punch': this.noise(out, t, 0.09, 0.5 * v, 'lowpass', 1400, 0.8); this.kick(out, t, 0.55 * v); break;
      case 'heavy': this.noise(out, t, 0.2, 0.7 * v, 'lowpass', 900, 0.8); this.kick(out, t, 0.9 * v); this.tom(out, t + 0.01, 0.4 * v, 70); break;
      case 'slash': this.noise(out, t, 0.18, 0.45 * v, 'bandpass', 5200 * pr, 2.5, 1600); this.tone(out, 2400 * pr, t, 0.12, 'sine', 0.05 * v, { dec: 0.05 }); break;
      case 'slashhit': this.noise(out, t, 0.12, 0.5 * v, 'highpass', 2500); this.tone(out, 3100 * pr, t, 0.25, 'sine', 0.06 * v, { dec: 0.08 }); this.tone(out, 4650 * pr, t, 0.2, 'sine', 0.04 * v, { dec: 0.06 }); break;
      case 'gun': this.noise(out, t, 0.22, 0.9 * v, 'lowpass', 3200, 0.7); this.kick(out, t, 0.8 * v); this.noise(this.rev, t, 0.3, 0.25 * v, 'lowpass', 2000); break;
      case 'block': this.tone(out, 820 * pr, t, 0.3, 'square', 0.08 * v, { dec: 0.06, cut: 3000 }); this.tone(out, 1270 * pr, t, 0.25, 'triangle', 0.1 * v, { dec: 0.07 }); this.noise(out, t, 0.08, 0.4 * v, 'highpass', 3000); break;
      case 'guardbreak': this.noise(out, t, 0.35, 0.7 * v, 'bandpass', 600, 1, 200); this.tone(out, 300, t, 0.35, 'sawtooth', 0.12 * v, { cut: 900 }); break;
      case 'hurt': this.noise(out, t, 0.12, 0.35 * v, 'lowpass', 900); this.tone(out, 180, t, 0.12, 'square', 0.06 * v, { cut: 600, dec: 0.05 }); break;
      case 'fire': this.noise(out, t, 0.5, 0.5 * v, 'lowpass', 600, 0.7, 2400); for (let k = 0; k < 6; k++) this.noise(out, t + Math.random() * 0.4, 0.03, 0.2 * v, 'highpass', 4000); break;
      case 'magma': this.noise(out, t, 0.7, 0.6 * v, 'lowpass', 300, 1, 900); this.kick(out, t, 0.6 * v); break;
      case 'ice': for (let k = 0; k < 4; k++) this.tone(out, (2200 + k * 640) * pr, t + k * 0.04, 0.4, 'sine', 0.05 * v, { dec: 0.15 }); this.noise(out, t, 0.25, 0.25 * v, 'highpass', 5000); break;
      case 'light': { const c2 = this.ctx; const os = c2.createOscillator(); const g = c2.createGain(); os.type = 'sine'; os.frequency.setValueAtTime(600, t); os.frequency.exponentialRampToValueAtTime(3200, t + 0.25); g.gain.setValueAtTime(0.12 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4); os.connect(g); g.connect(out); g.connect(this.rev); os.start(t); os.stop(t + 0.45); break; }
      case 'lightning': for (let k = 0; k < 5; k++) this.noise(out, t + k * 0.03 + Math.random() * 0.02, 0.05, 0.5 * v, 'highpass', 2500 + Math.random() * 3000); this.kick(out, t + 0.05, 0.5 * v); break;
      case 'dark': { const c2 = this.ctx; for (const d of [-14, 0, 9]) { const os = c2.createOscillator(); const g = c2.createGain(); os.type = 'sawtooth'; os.detune.value = d; os.frequency.setValueAtTime(220, t); os.frequency.exponentialRampToValueAtTime(55, t + 0.5); g.gain.setValueAtTime(0.06 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6); const f = c2.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; os.connect(f); f.connect(g); g.connect(out); os.start(t); os.stop(t + 0.65); } break; }
      case 'rubber': { const c2 = this.ctx; const os = c2.createOscillator(); const g = c2.createGain(); os.type = 'sine'; os.frequency.setValueAtTime(180, t); os.frequency.exponentialRampToValueAtTime(520, t + 0.12); os.frequency.exponentialRampToValueAtTime(140, t + 0.3); g.gain.setValueAtTime(0.25 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35); os.connect(g); g.connect(out); os.start(t); os.stop(t + 0.4); this.kick(out, t + 0.12, 0.4 * v); break; }
      case 'sound': case 'quake': this.tone(out, 70, t, 0.6, 'sine', 0.4 * v, { dec: 0.3 }); this.noise(out, t, 0.6, 0.4 * v, 'lowpass', 400); this.tone(out, 1200, t, 0.3, 'square', 0.03 * v, { vib: 30 }); break;
      case 'poison': case 'smoke': case 'sand': this.noise(out, t, 0.5, 0.4 * v, 'bandpass', 700, 0.6, 300); break;
      case 'plant': case 'beast': case 'phys': this.noise(out, t, 0.25, 0.35 * v, 'bandpass', 500, 0.8, 1800); this.kick(out, t, 0.4 * v); break;
      case 'boom': this.noise(out, t, 0.9, 0.9 * v, 'lowpass', 500, 0.7, 120); this.kick(out, t, 1 * v); this.noise(this.rev, t, 1.2, 0.4 * v, 'lowpass', 800); break;
      case 'special': this.sfx('boom', { vol: v, gap: 0 }); for (let k = 0; k < 5; k++) this.tone(out, midi(62 + [0, 3, 7, 10, 14][k]), t + k * 0.07, 0.8, 'sawtooth', 0.04 * v, { cut: 2500, dec: 0.4 }); break;
      case 'click': this.tone(out, 1500, t, 0.03, 'triangle', 0.08 * v, { dec: 0.01 }); break;
      case 'open': this.tone(out, 660, t, 0.06, 'triangle', 0.07 * v, { dec: 0.03 }); this.tone(out, 990, t + 0.04, 0.08, 'triangle', 0.06 * v, { dec: 0.03 }); break;
      case 'coin': this.tone(out, 1320, t, 0.06, 'square', 0.04 * v, { cut: 4000 }); this.tone(out, 1980, t + 0.06, 0.15, 'square', 0.04 * v, { cut: 4000, dec: 0.06 }); break;
      case 'level': [0, 4, 7, 12, 16].forEach((d, k) => this.tone(out, midi(72 + d), t + k * 0.08, 0.35, 'triangle', 0.09 * v, { dec: 0.15 })); break;
      case 'cast': this.noise(out, t, 0.35, 0.3 * v, 'bandpass', 1200, 1.5, 3800); break;
      case 'splash': this.noise(out, t, 0.45, 0.5 * v, 'lowpass', 2400, 0.7, 500); break;
      case 'bite': this.tone(out, 880, t, 0.08, 'sine', 0.15 * v); this.tone(out, 1320, t + 0.1, 0.1, 'sine', 0.15 * v); break;
      case 'reel': for (let k = 0; k < 8; k++) this.noise(out, t + k * 0.045, 0.02, 0.2 * v, 'highpass', 5000); break;
      case 'step': this.noise(out, t, 0.05, 0.06 * v, 'lowpass', 500); break;
    } }
  elementSfx(el, o) { this.sfx(['fire', 'magma', 'ice', 'light', 'lightning', 'dark', 'rubber', 'sound', 'quake', 'poison', 'smoke', 'sand', 'plant', 'beast'].includes(el) ? el : 'phys', o); }
}
export const audio = new Audio();
