// Procedural WebAudio music + SFX (all synthesized, no samples / no copyrighted tracks).
// Themes: cover (sea shanty), island (calm), night, battle, boss, sail. Crossfades between them.
const KEY = 'gldt_audio';
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phryg: [0, 1, 3, 5, 7, 8, 10] };
// chord = scale degree (0-based); melody generated per theme from a seeded RNG so loops are stable
const THEMES = {
  cover: { bpm: 132, six: true, root: 62, scale: 'dorian', prog: [0, 6, 0, 4, 0, 6, 3, 4], lead: 'accordion', bass: 'pluckbass', drums: 'shanty', pad: 0.0, seed: 7, dens: 0.8 },
  sail: { bpm: 118, six: true, root: 60, scale: 'major', prog: [0, 3, 4, 0, 5, 3, 4, 4], lead: 'fiddle', bass: 'pluckbass', drums: 'shanty', pad: 0.05, seed: 11, dens: 0.75 },
  island: { bpm: 92, root: 67, scale: 'major', prog: [0, 5, 3, 4, 0, 5, 1, 4], lead: 'pluck', bass: 'softbass', drums: 'shaker', pad: 0.08, seed: 3, dens: 0.5, arp: true },
  night: { bpm: 74, root: 57, scale: 'minor', prog: [0, 5, 2, 6, 0, 3, 4, 4], lead: 'celesta', bass: 'softbass', drums: 'none', pad: 0.12, seed: 5, dens: 0.35, arp: true },
  battle: { bpm: 150, root: 52, scale: 'minor', prog: [0, 0, 5, 6, 0, 0, 3, 4], lead: 'brass', bass: 'drivebass', drums: 'rock', pad: 0.0, seed: 9, dens: 0.7 },
  boss: { bpm: 164, root: 50, scale: 'phryg', prog: [0, 1, 0, 6, 0, 1, 5, 4], lead: 'brass', bass: 'drivebass', drums: 'epic', pad: 0.14, seed: 13, dens: 0.75, choir: true },
};
function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
export class Audio {
  constructor() { let s = {}; try { s = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) {} this.set = { music: s.music ?? 0.55, sfx: s.sfx ?? 0.8, mute: !!s.mute }; this.ctx = null; this.cur = null; this.want = 'cover'; this.layers = {}; this.step = 0; this.last = {}; }
  save() { localStorage.setItem(KEY, JSON.stringify(this.set)); this.apply(); }
  apply() { if (!this.ctx) return; const t = this.ctx.currentTime; this.mG.gain.setTargetAtTime(this.set.mute ? 0 : this.set.music * 0.5, t, 0.08); this.sG.gain.setTargetAtTime(this.set.mute ? 0 : this.set.sfx, t, 0.05); }
  // must be called from a user gesture (iOS)
  unlock() { if (this.ctx) { if (this.ctx.state !== 'running') this.ctx.resume(); return; } const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; const c = this.ctx = new AC();
    this.out = c.createDynamicsCompressor(); this.out.threshold.value = -14; this.out.ratio.value = 4; this.out.connect(c.destination);
    this.mG = c.createGain(); this.sG = c.createGain(); this.mG.connect(this.out); this.sG.connect(this.out);
    // shared reverb (generated impulse)
    const len = c.sampleRate * 1.6, ir = c.createBuffer(2, len, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    this.rev = c.createConvolver(); this.rev.buffer = ir; this.revG = c.createGain(); this.revG.gain.value = 0.25; this.rev.connect(this.revG); this.revG.connect(this.out);
    const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1; this.noiseBuf = nb;
    this.apply(); this.nextT = c.currentTime + 0.1; this.timer = setInterval(() => this.tick(), 40); if (c.state !== 'running') c.resume(); }
  setTheme(name) { this.want = name; }
  // ---------- music ----------
  layer(name) { if (!this.layers[name]) { const g = this.ctx.createGain(); g.gain.value = 0; g.connect(this.mG); const send = this.ctx.createGain(); send.gain.value = 0.35; g.connect(send); send.connect(this.rev); this.layers[name] = { g, mel: this.melody(THEMES[name]) }; } return this.layers[name]; }
  melody(T) { const r = rng(T.seed); const bars = T.prog.length, per = T.six ? 6 : 8; const notes = []; let deg = 4;
    for (let b = 0; b < bars; b++) for (let i = 0; i < per; i++) { const strong = i === 0 || i === (T.six ? 3 : 4); const play = strong ? r() < 0.92 : r() < T.dens * 0.7; if (!play) { notes.push(null); continue; } deg += Math.round((r() - 0.5) * 3.2); if (strong) deg = T.prog[b] + [0, 2, 4][Math.floor(r() * 3)]; deg = Math.max(-2, Math.min(9, deg)); notes.push({ deg, len: strong ? 1.6 : 0.9 }); }
    // second half answers the first: repeat bars 0-3 with a different ending
    for (let i = 0; i < per * 3; i++) notes[per * 4 + i] = notes[i]; return notes; }
  degNote(T, deg, oct = 0) { const sc = SCALES[T.scale]; const o = Math.floor(deg / 7), d = ((deg % 7) + 7) % 7; return T.root + sc[d] + 12 * (o + oct); }
  tick() { const c = this.ctx; if (!c || c.state !== 'running') return;
    if (this.want !== this.cur) { const t = c.currentTime; if (this.cur && this.layers[this.cur]) this.layers[this.cur].g.gain.setTargetAtTime(0, t, 0.6); this.cur = this.want; if (this.cur) { const L = this.layer(this.cur); L.g.gain.setTargetAtTime(1, t + 0.15, 0.7); } this.step = 0; this.nextT = Math.max(this.nextT, t + 0.05); }
    if (!this.cur) return; const T = THEMES[this.cur]; const L = this.layers[this.cur]; const per = T.six ? 6 : 8; const dur = 60 / T.bpm / (T.six ? 2 : 2);
    while (this.nextT < c.currentTime + 0.25) { this.playStep(T, L, this.step, this.nextT, dur, per); this.nextT += dur; this.step = (this.step + 1) % (per * T.prog.length); }
    // fading-out layers keep playing their tail only via envelopes; nothing else to do
  }
  playStep(T, L, s, t, dur, per) { const bar = Math.floor(s / per), i = s % per; const chord = T.prog[bar]; const out = L.g;
    // bass
    if (T.bass === 'drivebass') this.tone(out, midi(this.degNote(T, chord, -2)), t, dur * 0.9, 'sawtooth', 0.16, { cut: 700, dec: 0.12 });
    else if (i === 0 || i === (T.six ? 3 : 4) || (T.bass === 'pluckbass' && i === (T.six ? 5 : 6))) this.tone(out, midi(this.degNote(T, chord + (i ? 4 : 0), -2)), t, dur * 2.2, T.bass === 'softbass' ? 'sine' : 'triangle', 0.22, { dec: 0.4 });
    // chords / arp / pad
    if (T.arp) { const a = [0, 2, 4, 7, 4, 2, 0, 4][i % 8]; this.tone(out, midi(this.degNote(T, chord + a, 0)), t, dur * 3, 'triangle', 0.05, { dec: 0.5 }); }
    else if (i === 0 || (!T.six && i === 4) || (T.six && i === 3)) for (const a of [0, 2, 4]) this.tone(out, midi(this.degNote(T, chord + a, -1)), t, dur * (T.six ? 2.6 : 3.6), T.lead === 'accordion' ? 'square' : 'sawtooth', 0.025, { cut: 1400, dec: 0.3 });
    if (T.pad && i === 0) for (const a of [0, 2, 4]) this.tone(out, midi(this.degNote(T, chord + a, -1)), t, dur * per, 'sawtooth', T.pad * 0.3, { cut: 900, att: dur * 2, dec: 1, det: 6 });
    if (T.choir && i === 0) for (const a of [0, 4]) this.tone(out, midi(this.degNote(T, chord + a, 0)), t, dur * per, 'triangle', 0.05, { att: dur * 2, vib: 5 });
    // melody (skips every other loop for breathing room in calm themes)
    const n = L.mel[s]; const rest = (T.dens < 0.6) && (Math.floor(this.loopN = (this.loopN || 0)) % 2 === 1); if (s === 0) this.loopN = (this.loopN || 0) + 1;
    if (n && !rest) { const f = midi(this.degNote(T, n.deg, T.lead === 'celesta' ? 1 : 0)); const v = { accordion: ['square', 0.07, { cut: 2200, vib: 4, det: 8 }], fiddle: ['sawtooth', 0.07, { cut: 2600, vib: 6, att: 0.04 }], pluck: ['triangle', 0.09, { dec: 0.35 }], celesta: ['sine', 0.09, { dec: 0.8 }], brass: ['sawtooth', 0.08, { cut: 1800, att: 0.02, det: 5 }] }[T.lead]; this.tone(out, f, t, dur * n.len, v[0], v[1], v[2]); }
    // drums
    const D = T.drums; if (D === 'none') return; const beat = T.six ? (i === 0 || i === 3) : i % 2 === 0;
    if (D === 'shanty') { if (i === 0) this.kick(out, t, 0.5); if (i === 3) this.snare(out, t, 0.18, 0.08); if (i % 1 === 0) this.hat(out, t, i % 3 === 0 ? 0.05 : 0.03, 'tamb'); }
    if (D === 'shaker') { this.hat(out, t, i % 2 ? 0.02 : 0.035, 'shaker'); if (i === 0) this.kick(out, t, 0.25); }
    if (D === 'rock') { if (i === 0 || i === 3 || i === 6 && bar % 2) this.kick(out, t, 0.6); if (i === 2 || i === 6) this.snare(out, t, 0.3, 0.14); this.hat(out, t, 0.035); }
    if (D === 'epic') { if (i % 2 === 0) this.kick(out, t, 0.55); if (i === 4) this.snare(out, t, 0.35, 0.2); if (i === 6 || i === 7) this.tom(out, t, 0.3, i === 6 ? 110 : 85); this.hat(out, t, 0.03); } }
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
