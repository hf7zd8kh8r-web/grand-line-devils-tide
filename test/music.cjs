// render 26s previews of every music track via OfflineAudioContext, analyse (peak/RMS/clipping/loop seam), write shots/music_*.mp3
const { chromium } = require('playwright-core'); const fs = require('fs'); const { execSync } = require('child_process');
const only = process.argv[2] ? process.argv[2].split(',') : null; const SECS = +(process.env.SECS || 26);
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push('PE ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await p.goto((process.env.BASE || 'http://127.0.0.1:5393') + '/src/music.js');
  const names = only || await p.evaluate(async () => Object.keys((await import('/src/music.js')).TRACKS)); const rows = [];
  for (const n of names) {
    const r = await p.evaluate(async ({ n, SECS }) => { const M = await import('/src/music.js'); const T = M.TRACKS[n]; const t0 = performance.now(); const buf = await M.renderTrack(n, SECS); const ms = performance.now() - t0;
      const L = buf.getChannelData(0), R = buf.getChannelData(1); let pk = 0, ss = 0, clip = 0; for (let i = 0; i < L.length; i++) { const a = Math.abs(L[i]), b2 = Math.abs(R[i]); pk = Math.max(pk, a, b2); if (a > 0.999 || b2 > 0.999) clip++; ss += L[i] * L[i] + R[i] * R[i]; }
      const sr = buf.sampleRate; const win = s => { let q = 0; const a = Math.floor(s * sr), e = Math.min(L.length, a + Math.floor(0.5 * sr)); for (let i = a; i < e; i++) q += L[i] * L[i]; return Math.sqrt(q / Math.max(1, e - a)); };
      const sd = T.steps === 6 ? 60 / T.bpm / 3 : 60 / T.bpm / 4; const loop = 16 * T.steps * sd; const segs = []; for (let s = 1; s < SECS - 1; s += 0.5) segs.push(win(s)); const med = segs.slice().sort((a, b) => a - b)[segs.length >> 1];
      const seam = loop + 0.05 < SECS - 1 ? win(loop - 0.25) / med : null; const minSeg = Math.min(...segs) / med;
      // 16-bit stereo WAV
      const n2 = L.length, wav = new DataView(new ArrayBuffer(44 + n2 * 4)); const W = (o, s) => [...s].forEach((ch, i) => wav.setUint8(o + i, ch.charCodeAt(0)));
      W(0, 'RIFF'); wav.setUint32(4, 36 + n2 * 4, true); W(8, 'WAVEfmt '); wav.setUint32(16, 16, true); wav.setUint16(20, 1, true); wav.setUint16(22, 2, true); wav.setUint32(24, sr, true); wav.setUint32(28, sr * 4, true); wav.setUint16(32, 4, true); wav.setUint16(34, 16, true); W(36, 'data'); wav.setUint32(40, n2 * 4, true);
      for (let i = 0; i < n2; i++) { wav.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); wav.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
      let bin = ''; const u8 = new Uint8Array(wav.buffer); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
      return { name: T.name, ms: Math.round(ms), peak: +(20 * Math.log10(pk)).toFixed(1), rms: +(10 * Math.log10(ss / (2 * L.length))).toFixed(1), clip, loop: +loop.toFixed(1), seam: seam && +seam.toFixed(2), minSeg: +minSeg.toFixed(2), b64: btoa(bin) }; }, { n, SECS });
    const wavP = `/tmp/music_${n}.wav`; fs.writeFileSync(wavP, Buffer.from(r.b64, 'base64')); execSync(`ffmpeg -y -loglevel error -i ${wavP} -codec:a libmp3lame -b:a 160k ${__dirname}/../shots/music_${n}.mp3`); delete r.b64; rows.push({ id: n, ...r }); console.log(JSON.stringify(rows[rows.length - 1])); }
  const rm = rows.map(r => r.rms); console.log('RMS spread dB', (Math.max(...rm) - Math.min(...rm)).toFixed(1), 'any clipping', rows.some(r => r.clip > 0)); console.log('ERRS', errs); await b.close(); })();
