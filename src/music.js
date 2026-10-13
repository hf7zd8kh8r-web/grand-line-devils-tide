// Original procedural pirate music (no samples, nothing copied): composed tracks = chord progressions + hand-written
// motifs developed into A/B sections, bass lines, accompaniment and percussion grids, played by layered WebAudio
// instruments (reed/accordion, fiddle, tin whistle, mandolin, brass, choir, koto, shakuhachi, oud, music box...).
// Works on a live AudioContext or an OfflineAudioContext (previews).
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
const SC = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11], mixo: [0, 2, 4, 5, 7, 9, 10], dorian: [0, 2, 3, 5, 7, 9, 10], hijaz: [0, 1, 4, 5, 7, 8, 10], miyako: [0, 1, 5, 7, 8], yo: [0, 2, 5, 7, 9] };
// motif syntax: "deg.len" (deg = scale degree from the tonic, len in steps), "r.len" rest, "|" bar line (ignored)
// section = { prog: 8 chord degrees, mot: 2-bar motif, k: sequence shift for bars 3-4, cad: 2-bar cadence, lead, alt (bars 5-6 variant) }
export const TRACKS = {
  cover: { name: 'Grand Pirate Anthem', bpm: 84, steps: 16, root: 62, scale: 'mixo', gain: 1.0, swing: 0,
    A: { prog: [0, 6, 3, 0, 0, 6, 4, 4], mot: '0.6 4.2 7.8 | 6.4 5.4 4.8', k: -1, cad: '4.4 5.4 6.4 8.4 | 7.12 r.4', lead: 'brass' },
    B: { prog: [5, 3, 0, 4, 5, 3, 4, 0], mot: '9.4 7.4 8.6 7.2 | 7.4 5.4 4.8', k: -1, cad: '2.4 4.4 5.4 6.4 | 7.16', lead: 'fiddle', dbl: 'whistle' },
    bass: 'march', comp: 'pad', pad: 'choir', drums: { taiko: 'X.......X...x...', kick: 'X.......X.......', snare: '....X.......X..x', crash: 'X...............' } },
  sail: { name: 'Set Sail! (6/8 shanty)', bpm: 100, steps: 6, root: 62, scale: 'major', gain: 1, swing: 0.08,
    A: { prog: [0, 3, 0, 4, 0, 3, 4, 0], mot: '4.2 2.1 4.3 | 7.3 6.1 5.1 4.1', k: 1, cad: '5.2 4.1 2.2 1.1 | 0.6', lead: 'fiddle' },
    B: { prog: [5, 3, 0, 4, 5, 3, 4, 4], mot: '7.2 9.1 8.2 7.1 | 5.3 4.3', k: -1, cad: '4.1 5.1 6.1 7.2 6.1 | 4.3 r.3', lead: 'whistle', dbl: 'reed' },
    bass: 'jig', comp: 'oompah', arp: 'mando', drums: { stomp: 'X..X..', clap: '...X..', tamb: 'x.xx.x' } },
  island: { name: 'Harbour Town Jig', bpm: 112, steps: 6, root: 67, scale: 'major', gain: 1, swing: 0.1,
    A: { prog: [0, 0, 4, 4, 0, 3, 4, 0], mot: '0.1 2.1 4.1 7.2 4.1 | 5.1 4.1 2.1 4.3', k: 1, cad: '2.1 4.1 2.1 1.2 -1.1 | 0.3 r.3', lead: 'reed' },
    B: { prog: [3, 3, 0, 0, 3, 3, 4, 4], mot: '5.3 7.3 | 6.1 5.1 4.1 2.3', k: -1, cad: '4.1 5.1 4.1 2.2 1.1 | -3.3 r.3', lead: 'whistle', dbl: 'mando' },
    bass: 'jig', comp: 'oompah', drums: { stomp: 'X..x..', clap: '...X..', tamb: 'xxxxxx', hey: '' }, crowd: 0.5 },
  night: { name: 'Lantern Lullaby', bpm: 66, steps: 6, root: 57, scale: 'minor', gain: 1.7, swing: 0,
    A: { prog: [0, 5, 2, 6, 0, 3, 4, 4], mot: '4.3 2.2 0.1 | 1.3 r.3', k: 1, cad: '2.2 1.1 0.2 -1.1 | -3.6', lead: 'musicbox' },
    B: { prog: [5, 2, 3, 0, 5, 2, 4, 0], mot: '7.3 6.2 4.1 | 5.6', k: -1, cad: '4.2 2.1 1.3 | 0.6', lead: 'fiddle' },
    bass: 'soft', comp: 'harp', pad: 'pad', drums: {} },
  battle: { name: 'Steel & Thunder (battle shanty)', bpm: 152, steps: 16, root: 64, scale: 'harm', gain: 0.8, swing: 0,
    A: { prog: [0, 0, 5, 4, 0, 0, 3, 4], mot: '0.3 0.3 4.2 3.2 2.2 0.4 | 6.3 6.3 5.2 4.8', k: 0, cad: '7.2 6.2 4.2 2.2 1.4 6.4 | 0.8 r.8', lead: 'brass' },
    B: { prog: [5, 5, 3, 3, 0, 5, 4, 4], mot: '7.6 6.2 4.8 | 5.4 4.4 2.8', k: -2, cad: '4.4 5.4 6.4 7.4 | 6.8 4.8', lead: 'fiddle', dbl: 'brass' },
    bass: 'drive', comp: 'stab', drums: { taiko: 'X.....X.X.......', kick: 'X.....X.X...x...', snare: '....X.......X.x.', hat: 'x.x.x.x.x.x.x.x.', crash: 'X...............' } },
  boss: { name: 'Emperor of the Storm (boss)', bpm: 160, steps: 16, root: 62, scale: 'harm', gain: 0.75, swing: 0,
    A: { prog: [0, 5, 0, 4, 0, 5, 3, 4], mot: '7.8 6.4 5.4 | 4.6 5.2 6.8', k: -1, cad: '7.4 9.4 8.4 6.4 | 7.16', lead: 'brass', dbl: 'choirlead' },
    B: { prog: [3, 4, 5, 0, 3, 4, 1, 4], mot: '9.4 9.4 10.4 9.4 | 7.12 4.4', k: 1, cad: '8.4 7.4 6.4 5.4 | 4.16', lead: 'fiddle', dbl: 'brass' },
    bass: 'drive', comp: 'stab', pad: 'choir', drums: { taiko: 'X..X..X.X..X..X.', kick: 'X.x.X.x.X.x.X.x.', snare: '....X.......X...', tom: '............x.xx', crash: 'X...............' } },
  duel: { name: 'Colosseum Roar (duel)', bpm: 138, steps: 16, root: 60, scale: 'dorian', gain: 0.8, swing: 0,
    A: { prog: [0, 0, 6, 6, 0, 0, 3, 4], mot: '0.4 0.2 2.2 3.4 4.4 | 6.6 4.2 3.8', k: -1, cad: '2.4 3.4 4.4 6.4 | 7.8 r.8', lead: 'brass' },
    B: { prog: [3, 3, 0, 0, 3, 3, 4, 4], mot: '7.6 7.2 6.4 4.4 | 3.4 4.4 2.8', k: 0, cad: '4.4 4.4 6.4 6.4 | 7.16', lead: 'reed', dbl: 'brass' },
    bass: 'drive', comp: 'stab', drums: { stomp: 'X...X...X...X...', clap: '....X.......X...', hey: '........X.......', taiko: 'X.......X.....X.', hat: '..x...x...x...x.', crash: 'X...............' }, crowd: 1 },
  // island variants
  desert: { name: 'Sands of the Kingdom (Alabasta)', bpm: 96, steps: 16, root: 62, scale: 'hijaz', gain: 1, swing: 0.06,
    A: { prog: [0, 0, 1, 0, 0, 6, 1, 0], mot: '0.2 1.2 2.4 1.2 0.2 1.4 | 2.2 3.2 4.6 3.2 2.4', k: 0, cad: '4.2 3.2 2.2 1.2 2.4 1.4 | 0.16', lead: 'oud' },
    B: { prog: [3, 3, 2, 2, 1, 1, 0, 0], mot: '4.6 5.2 4.4 3.4 | 2.8 1.8', k: -1, cad: '3.4 2.4 1.4 2.4 | 0.16', lead: 'reed', dbl: 'oud' },
    bass: 'march', comp: 'drone', drums: { darbum: 'X.....X...X.....', dartek: '..x.x...x...x.xx', tamb: 'x...x...x...x...' } },
  wano: { name: 'Blossom Road (Wano)', bpm: 88, steps: 16, root: 64, scale: 'miyako', gain: 1, swing: 0,
    A: { prog: [0, 0, 3, 3, 0, 0, 2, 3], mot: '5.6 4.2 3.4 2.4 | 3.4 2.4 1.8', k: 0, cad: '2.4 3.4 4.4 2.4 | 0.16', lead: 'shaku' },
    B: { prog: [3, 3, 2, 2, 0, 0, 3, 0], mot: '7.4 6.4 5.8 | 4.4 3.4 4.8', k: -1, cad: '3.4 2.4 1.4 -1.4 | 0.16', lead: 'koto', dbl: 'shaku' },
    bass: 'soft', comp: 'koto', drums: { taiko: 'X.......X...x.x.', clack: '....x.......x...' } },
  thriller: { name: 'Haunted Manor Waltz (Thriller Bark)', bpm: 72, steps: 6, root: 57, scale: 'harm', gain: 1.45, swing: 0,
    A: { prog: [0, 3, 4, 0, 5, 1, 4, 4], mot: '4.2 3.1 4.3 | 6.2 5.1 4.3', k: -1, cad: '2.2 1.1 2.2 4.1 | 0.6', lead: 'musicbox', dbl: 'organ' },
    B: { prog: [5, 1, 4, 0, 5, 3, 4, 4], mot: '7.3 6.2 7.1 | 5.6', k: -1, cad: '4.2 3.1 1.3 | -1.6', lead: 'fiddle' },
    bass: 'waltz', comp: 'organ', drums: { tom: 'x.....', clack: '...x.x' } },
  sweet: { name: 'Candy Parade (Whole Cake)', bpm: 108, steps: 6, root: 72, scale: 'major', gain: 1.35, swing: 0.12,
    A: { prog: [0, 5, 1, 4, 0, 5, 1, 4], mot: '4.1 5.1 4.1 2.3 | 0.1 2.1 4.1 7.3', k: -1, cad: '5.1 4.1 2.1 1.1 2.1 1.1 | 0.6', lead: 'musicbox', dbl: 'mando' },
    B: { prog: [3, 4, 2, 5, 3, 4, 1, 4], mot: '5.3 4.2 3.1 | 4.3 2.3', k: -1, cad: '1.1 2.1 3.1 4.1 5.1 6.1 | 7.3 r.3', lead: 'whistle' },
    bass: 'jig', comp: 'oompah', drums: { clap: '...X..', tamb: 'x..x..', bell: 'x.....' } },
};
export const ISLAND_VARIANT = { alabasta: 'desert', wano: 'wano', thriller: 'thriller', wci: 'sweet', impel: 'thriller' };
function parse(s) { const out = []; let p = 0; for (const tk of s.split(/\s+/)) { if (!tk || tk === '|') continue; const [d, l] = tk.split('.'); const len = +l; if (d !== 'r') out.push({ at: p, deg: +d, len }); p += len; } return out; }
function compile(T) { const notes = []; const S = T.steps; const secs = [T.A, T.B]; secs.forEach((X, si) => { const m = parse(X.mot), c = parse(X.cad); const base = si * 8 * S;
    const put = (arr, bar0, sh, lead) => arr.forEach(n => notes.push({ at: base + bar0 * S + n.at, deg: n.deg + sh, len: n.len, lead, dbl: X.dbl }));
    put(m, 0, 0, X.lead); put(m, 2, X.k, X.lead); put(m, 4, 0, X.lead); put(c, 6, 0, X.lead); });
  const by = {}; notes.forEach(n => (by[n.at] = by[n.at] || []).push(n)); return { by, prog: [...T.A.prog, ...T.B.prog], total: 16 * S }; }
export class Music {
  constructor(ctx, dest, lite = false) { this.c = ctx; this.lite = lite; const c = ctx;
    this.bus = c.createGain(); this.comp = c.createDynamicsCompressor(); this.comp.threshold.value = -16; this.comp.ratio.value = 3; this.comp.attack.value = 0.01; this.comp.release.value = 0.2; this.bus.connect(this.comp); this.comp.connect(dest);
    // stereo hall impulse: pre-delay, early reflections, smooth exponential tail with darkening
    const sr = c.sampleRate, len = Math.floor(sr * (lite ? 1.3 : 2.2)), ir = c.createBuffer(2, len, sr); for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { const t = i / sr; if (t < 0.012) continue; const k = 0.25 + 0.7 * (1 - t / 2.2); lp += k * ((Math.random() * 2 - 1) - lp); d[i] = lp * Math.exp(-t * 3.2) * (t < 0.08 && Math.random() < 0.02 ? 3 : 1); } }
    this.rev = c.createConvolver(); this.rev.buffer = ir; this.revG = c.createGain(); this.revG.gain.value = 0.32; this.rev.connect(this.revG); this.revG.connect(this.comp);
    const nb = c.createBuffer(1, sr * 2, sr), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1; this.nb = nb; this.live = []; }
  // ---------- tracks ----------
  start(name, t) { const T = TRACKS[name] || TRACKS.island; const g = this.c.createGain(); g.gain.value = 0; g.connect(this.bus); const send = this.c.createGain(); send.gain.value = 0.4; g.connect(send); send.connect(this.rev);
    const st = { name, T, C: compile(T), g, step: 0, nextT: t, r: 1234 + name.length * 77 }; g.gain.setTargetAtTime(T.gain, t, 0.5); this.live.push(st); return st; }
  stop(st, t) { st.g.gain.cancelScheduledValues(t); st.g.gain.setTargetAtTime(0, t, 0.7); st.end = t + 3.5; }
  schedule(until) { for (const st of this.live) { const T = st.T; const sd = T.steps === 6 ? 60 / T.bpm / 3 : 60 / T.bpm / 4;
      while (st.nextT < until && !(st.end && st.nextT > st.end)) { const sw = st.step % 2 ? T.swing * sd : 0; this.playStep(st, st.step, st.nextT + sw, sd); st.nextT += sd; st.step = (st.step + 1) % st.C.total; } }
    this.live = this.live.filter(st => { if (st.end && this.c.currentTime > st.end) { st.g.disconnect(); return false; } return true; }); }
  rnd(st) { st.r = (st.r * 16807) % 2147483647; return st.r / 2147483647; }
  note(T, deg, oct = 0) { const sc = SC[T.scale]; const n = sc.length; const o = Math.floor(deg / n), d = ((deg % n) + n) % n; return T.root + sc[d] + 12 * (o + oct); }
  chord(T, deg) { const n = SC[T.scale].length; return n === 5 ? [deg, deg + 2, deg + 3] : [deg, deg + 2, deg + 4]; }
  playStep(st, s, t, sd) { const T = st.T, S = T.steps, out = st.g; const bar = Math.floor(s / S), i = s % S; const ch = st.C.prog[bar]; const six = S === 6; const beat = six ? (i === 0 || i === 3) : i % 4 === 0;
    const hz = () => (this.rnd(st) - 0.5) * 0.012; const vel = () => 0.88 + this.rnd(st) * 0.24; const cd = this.chord(T, ch);
    // melody (+ doubling an octave up / down)
    for (const n of st.C.by[s] || []) { const f = midi(this.note(T, n.deg)); this.inst(n.lead, out, f, t + hz(), n.len * sd, vel()); if (n.dbl && !this.lite) this.inst(n.dbl, out, n.dbl === 'reed' || n.dbl === 'brass' ? f / 2 : f, t + hz(), n.len * sd, vel() * 0.55); }
    // bass
    const bn = k => midi(this.note(T, ch + k, -2)); const B = T.bass;
    if (B === 'jig' && (i === 0 || i === 3)) this.inst('bass', out, bn(i ? 4 : 0), t, sd * 2.5, 1);
    if (B === 'waltz' && i === 0) this.inst('bass', out, bn(0), t, sd * 5, 1);
    if (B === 'soft' && (six ? i === 0 : i % 8 === 0)) this.inst('bass', out, bn(0), t, sd * (six ? 5 : 7), 0.9);
    if (B === 'march' && i % 4 === 0) this.inst('bass', out, bn(i % 8 ? 4 : 0), t, sd * 3.5, 1);
    if (B === 'drive' && i % 2 === 0) this.inst('dbass', out, bn(0) * (i % 8 === 6 ? 2 : 1), t, sd * 1.7, 1);
    // accompaniment
    const C = T.comp, tri = (oct, vol, nm, len) => cd.forEach((d, k) => this.inst(nm, out, midi(this.note(T, d, oct)), t + k * 0.004, len, vol));
    if (C === 'oompah' && (i === 1 || i === 2 || i === 4 || i === 5)) tri(-1, i === 1 || i === 4 ? 0.35 : 0.25, 'reedchord', sd * 0.8);
    if (C === 'stab' && (i === 0 || i === 6 || i === 10)) tri(-1, 0.5, 'brasschord', sd * 1.6);
    if (C === 'pad' && i === 0) tri(-1, 0.4, 'padc', sd * S);
    if (C === 'organ' && i === 0) tri(-1, 0.4, 'organ', sd * S);
    if (C === 'drone' && i === 0) { this.inst('padc', out, midi(T.root - 24), t, sd * S, 0.5); this.inst('padc', out, midi(T.root - 17), t, sd * S, 0.35); }
    if (C === 'harp' || C === 'koto') { const seq = six ? [0, 1, 2, 3, 2, 1] : [0, 1, 2, 3, 2, 1, 0, 1]; if (six || i % 2 === 0) { const k = seq[(six ? i : i / 2) % seq.length]; const d = k === 3 ? cd[0] + (SC[T.scale].length) : cd[k]; this.inst(C === 'koto' ? 'koto' : 'musicbox', out, midi(this.note(T, d, C === 'koto' ? -1 : 0)), t + hz(), sd * 2, 0.35); } }
    if (T.arp === 'mando' && !this.lite) { const k = [0, 1, 2, 1, 2, 1][i % 6]; this.inst('mando', out, midi(this.note(T, cd[k], 0)), t + hz(), sd * 0.9, 0.3); }
    if (T.pad === 'choir' && i === 0) cd.forEach(d => this.inst('choir', out, midi(this.note(T, d, 0)), t, sd * S, 0.5));
    if (T.pad === 'pad' && i === 0) tri(0, 0.25, 'padc', sd * S);
    // percussion (bar 15 = fill: double the snare/clap)
    const D = T.drums; const fill = bar % 8 === 7 && i >= S / 2; for (const k in D) { const pat = D[k]; if (!pat) continue; const ch2 = pat[i % pat.length]; let v = ch2 === 'X' ? 1 : ch2 === 'x' ? 0.55 : 0; if (k === 'crash' && bar % 8) v = 0; if (fill && (k === 'snare' || k === 'clap' || k === 'tom') && !v) v = 0.5; if (v) this.drum(k, out, t + hz() * 0.5, v * vel()); }
    if (T.crowd && i === 0 && bar % 2 === 0) this.noise(out, t, sd * S * 2, 0.05 * T.crowd, 'bandpass', 900, 0.6, 1300, sd * S * 0.6); }
  // ---------- instruments ----------
  osc(type, f, t, d, det = 0) { const o = this.c.createOscillator(); o.type = type; o.frequency.value = f; if (det) o.detune.value = det; o.start(t); o.stop(t + d + (this.lite ? 0.35 : 0.5)); return o; }
  env(g, t, d, v, a, dec, sus, rel) { const p = g.gain; p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(v, t + a); if (dec) p.setTargetAtTime(v * sus, t + a, dec); p.setTargetAtTime(0.0001, t + Math.max(d, a), rel); }
  lp(f, q = 0.7) { const fl = this.c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = f; fl.Q.value = q; return fl; }
  vib(o, f, t, rate, depth, delay) { if (this.lite) return; const l = this.osc('sine', rate, t, 4); const g = this.c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(f * depth, t + delay); l.connect(g); g.connect(o.frequency); }
  inst(name, out, f, t, d, v) { const c = this.c; const g = c.createGain(); g.connect(out); const L = this.lite;
    const many = (types, dets, fl) => types.forEach((ty, k) => { if (L && k > 1) return; const o = this.osc(ty, f, t, d, dets[k]); o.connect(fl || g); }); let fl;
    switch (name) {
      case 'reed': case 'reedchord': { fl = this.lp(name === 'reed' ? 2600 : 1800, 1.2); fl.connect(g); many(['sawtooth', 'sawtooth', 'square'], [-9, 9, 0], fl); this.env(g, t, d, (name === 'reed' ? 0.07 : 0.035) * v, 0.025, 0.2, 0.8, 0.05); break; }
      case 'fiddle': { fl = this.lp(3200, 2); fl.connect(g); const os = []; many(['sawtooth', 'sawtooth'], [-5, 6], fl); this.env(g, t, d, 0.075 * v, 0.07, 0.3, 0.85, 0.09); const o = this.osc('sawtooth', f * 2, t, d); const g2 = c.createGain(); g2.gain.value = 0.15; o.connect(g2); g2.connect(fl); this.vib(o, f * 2, t, 5.6, 0.006, 0.18); break; }
      case 'whistle': { const o = this.osc('sine', f * 2, t, d); const o2 = this.osc('triangle', f * 2, t, d, 4); const g2 = c.createGain(); g2.gain.value = 0.3; o.connect(g); o2.connect(g2); g2.connect(g); this.vib(o, f * 2, t, 6, 0.008, 0.2); this.env(g, t, d, 0.07 * v, 0.03, 0.2, 0.85, 0.06); this.noise(out, t, 0.06, 0.012 * v, 'bandpass', f * 2, 2); break; }
      case 'mando': case 'pluck': { fl = this.lp(4200, 1.5); fl.frequency.setTargetAtTime(700, t, 0.09); fl.connect(g); many(['sawtooth', 'triangle'], [-4, 4], fl); this.env(g, t, Math.min(d, 0.12), 0.09 * v, 0.004, 0.12, 0.3, 0.15); break; }
      case 'oud': case 'koto': { fl = this.lp(name === 'koto' ? 3800 : 2400, 2); fl.frequency.setTargetAtTime(600, t, 0.18); fl.connect(g); const o = this.osc('sawtooth', f, t, d); o.frequency.setValueAtTime(f * 1.03, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06); o.connect(fl); const o2 = this.osc('triangle', f * 2, t, d); o2.connect(fl); this.env(g, t, Math.min(d, 0.3), (name === 'koto' ? 0.11 : 0.12) * v, 0.003, 0.25, 0.25, 0.3); break; }
      case 'shaku': { const o = this.osc('sine', f, t, d); o.frequency.setValueAtTime(f * 0.96, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.12); o.connect(g); const o2 = this.osc('triangle', f * 2, t, d); const g2 = c.createGain(); g2.gain.value = 0.15; o2.connect(g2); g2.connect(g); this.vib(o, f, t, 4.5, 0.012, 0.35); this.env(g, t, d, 0.11 * v, 0.09, 0.4, 0.8, 0.12); this.noise(out, t, d * 0.8, 0.02 * v, 'bandpass', f * 2, 1.5); break; }
      case 'brass': case 'brasschord': { const lead = name === 'brass'; fl = this.lp(500, 3); fl.frequency.setValueAtTime(500, t); fl.frequency.linearRampToValueAtTime(lead ? 2800 : 2000, t + 0.06); fl.frequency.setTargetAtTime(lead ? 1700 : 1100, t + 0.08, 0.2); fl.connect(g); many(['sawtooth', 'sawtooth', 'square'], [-8, 8, 0], fl); this.env(g, t, d, (lead ? 0.08 : 0.04) * v, 0.03, 0.25, lead ? 0.75 : 0.4, 0.08); break; }
      case 'choir': case 'choirlead': { const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 750; f1.Q.value = 2.5; const f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1150; f2.Q.value = 3; f1.connect(g); f2.connect(g); ['sawtooth', 'sawtooth', 'sawtooth'].forEach((ty, k) => { if (L && k > 0) return; const o = this.osc(ty, f, t, d, [-12, 0, 11][k]); o.connect(f1); if (!L) o.connect(f2); }); this.env(g, t, d, (name === 'choir' ? 0.09 : 0.12) * v, name === 'choir' ? 0.35 : 0.08, 0, 1, 0.3); break; }
      case 'musicbox': { const o = this.osc('sine', f * 2, t, d); const o2 = this.osc('sine', f * 8, t, 0.3); const g2 = c.createGain(); g2.gain.setValueAtTime(0.25, t); g2.gain.setTargetAtTime(0, t, 0.05); o.connect(g); o2.connect(g2); g2.connect(g); this.env(g, t, Math.min(d, 0.25), 0.09 * v, 0.003, 0.35, 0.3, 0.5); break; }
      case 'organ': { fl = this.lp(1600); fl.connect(g); many(['square', 'sine'], [0, 0], fl); const o = this.osc('sine', f * 2, t, d); o.connect(fl); this.env(g, t, d, 0.03 * v, 0.15, 0, 1, 0.25); break; }
      case 'padc': { fl = this.lp(900); fl.connect(g); many(['sawtooth', 'sawtooth'], [-10, 10], fl); this.env(g, t, d, 0.04 * v, 0.4, 0, 1, 0.4); break; }
      case 'bass': { const o = this.osc('triangle', f, t, d); const o2 = this.osc('sine', f, t, d); o.connect(g); o2.connect(g); this.env(g, t, d, 0.14 * v, 0.006, 0.25, 0.45, 0.07); break; }
      case 'dbass': { fl = this.lp(250, 4); fl.frequency.setValueAtTime(900, t); fl.frequency.setTargetAtTime(260, t, 0.06); fl.connect(g); many(L ? ['sawtooth'] : ['sawtooth', 'square'], [-6, 6], fl); if (!L) { const o = this.osc('sine', f, t, d); o.connect(g); } this.env(g, t, d, 0.11 * v, 0.004, 0.1, 0.6, 0.04); break; }
    } }
  noise(out, t, d, vol, type = 'highpass', freq = 6000, q = 0.7, f2, att = 0) { const c = this.c; const s = c.createBufferSource(); s.buffer = this.nb; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = freq; fl.Q.value = q; if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + d); const g = c.createGain(); s.connect(fl); fl.connect(g); g.connect(out);
    g.gain.setValueAtTime(att ? 0.0001 : vol, t); if (att) g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0005, t + d); s.start(t, Math.random() * 1.2); s.stop(t + d + 0.05); }
  thump(out, t, v, f0, f1, d) { const o = this.osc('sine', f0, t, d); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d * 0.5); const g = this.c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(out); }
  drum(k, out, t, v) { switch (k) {
    case 'kick': this.thump(out, t, 0.55 * v, 130, 45, 0.28); break;
    case 'stomp': this.thump(out, t, 0.5 * v, 95, 40, 0.3); this.noise(out, t, 0.12, 0.25 * v, 'lowpass', 380); break;
    case 'taiko': this.thump(out, t, 0.6 * v, 85, 52, 0.7); this.noise(out, t, 0.25, 0.22 * v, 'lowpass', 260); if (!this.lite) this.noise(this.rev, t, 0.4, 0.1 * v, 'lowpass', 400); break;
    case 'tom': this.thump(out, t, 0.35 * v, 150, 90, 0.35); break;
    case 'snare': this.noise(out, t, 0.16, 0.22 * v, 'bandpass', 1900, 0.8); this.thump(out, t, 0.15 * v, 230, 160, 0.08); break;
    case 'clap': for (let j = 0; j < 3; j++) this.noise(out, t + j * 0.011, 0.03, 0.18 * v, 'bandpass', 1300, 1.2); this.noise(out, t + 0.033, 0.14, 0.14 * v, 'bandpass', 1200, 1); break;
    case 'tamb': this.noise(out, t, 0.08, 0.06 * v, 'highpass', 7200); break;
    case 'hat': this.noise(out, t, 0.04, 0.05 * v, 'highpass', 8500); break;
    case 'crash': this.noise(out, t, 1.4, 0.07 * v, 'highpass', 5000); break;
    case 'hey': this.noise(out, t, 0.18, 0.16 * v, 'bandpass', 700, 3); this.noise(out, t, 0.18, 0.11 * v, 'bandpass', 1250, 4); break;
    case 'darbum': this.thump(out, t, 0.4 * v, 110, 70, 0.3); break;
    case 'dartek': this.noise(out, t, 0.04, 0.12 * v, 'bandpass', 3500, 2); break;
    case 'clack': this.noise(out, t, 0.03, 0.12 * v, 'bandpass', 2600, 6); break;
    case 'bell': this.inst('musicbox', out, 2093, t, 0.2, 0.5 * v); break; } }
}
// offline render for previews / analysis
export async function renderTrack(name, secs = 24, sr = 44100, lite = false) { const C = new OfflineAudioContext(2, Math.floor(sr * secs), sr); const G = C.createGain(); G.gain.value = 0.5; G.connect(C.destination);
  const m = new Music(C, G, lite); m.start(name, 0.05); m.schedule(secs); return C.startRendering(); }
