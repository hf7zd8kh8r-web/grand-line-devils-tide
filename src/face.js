// Expressive face layer: two curved decal patches (eyes+brows, mouth) on the head bone, driven by a shared
// canvas atlas. Blinks, looks, flaps the mouth while talking, and switches expression (happy / angry / hurt /
// KO / smirk / roar / surprised). Two draw calls per character; texture sources are shared.
import { THREE as B } from './engine.js';
const EW = 128, EH = 64, ECOLS = 2, EROWS = 6, MW = 128, MH = 64, MCOLS = 4, MROWS = 2;
export const EYE = { normal: 0, half: 1, closed: 2, happy: 3, angry: 4, hurt: 5, ko: 6, smirk: 7, kind: 8, sad: 9, angryHalf: 10, wide: 11 };
export const MOUTH = { smile: 0, open: 1, line: 2, frown: 3, grin: 4, roar: 5, o: 6, smirk: 7 };
const hx = c => '#' + (c >>> 0).toString(16).padStart(6, '0');
// geometry of the patches in head-sphere angles (three.js sphere: phi around Y from -X, theta from +Y)
const EP = { phi0: Math.PI / 2 - 0.698, phiL: 1.396, th0: 55 * Math.PI / 180, thL: 55 * Math.PI / 180 };
const MP = { phi0: Math.PI / 2 - 0.436, phiL: 0.873, th0: 98 * Math.PI / 180, thL: 37 * Math.PI / 180 };
// convert a head-space point (x offset, y offset from head centre) to atlas pixel coords inside a cell
const toCell = (P, W, H, hr, x, y) => { const phi = Math.PI / 2 + Math.asin(Math.max(-1, Math.min(1, x / hr))); const th = Math.PI / 2 - Math.asin(Math.max(-1, Math.min(1, y / hr))); return [(phi - P.phi0) / P.phiL * W, (th - P.th0) / P.thL * H]; };
const eyeCache = {}, mouthCache = {};
function eyeAtlas(eyeC, browC, thick) { const k = eyeC + ':' + browC + ':' + (thick ? 1 : 0); if (eyeCache[k]) return eyeCache[k];
  const cv = document.createElement('canvas'); cv.width = EW * ECOLS; cv.height = EH * EROWS; const c = cv.getContext('2d'); const hr = 0.185;
  const px = (x, y) => toCell(EP, EW, EH, hr, x, y); const [ , eyY] = px(0, 0.005); const [lx] = px(-0.068, 0); const [rx] = px(0.068, 0); const sx = (lx - px(-0.068 - 0.044, 0)[0]) * -1; const rr = Math.abs(sx) * 0.96; const ry = rr * 1.36;
  const [ , brY] = px(0, 0.08);
  const ink = '#1a0e08';
  const brow = (x, s, ang, dy = 0) => { c.save(); c.translate(x, brY + dy); c.rotate(ang * s); c.fillStyle = hx(browC); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; const w = rr * 2.05, h = thick ? 7 : 5; c.beginPath(); c.ellipse(0, 0, w / 2, h / 2, 0, 0, 6.283); c.fill(); c.stroke(); c.restore(); };
  const openEye = (x, s, o = {}) => { const k = o.k ?? 1; c.save(); c.beginPath(); c.ellipse(x, eyY, rr, ry * k, 0, 0, 6.283); c.fillStyle = '#fff'; c.fill(); c.clip();
    const lx2 = x + (o.dx || 0) * rr * 0.25; c.fillStyle = hx(eyeC); c.beginPath(); c.ellipse(lx2, eyY + ry * 0.12, rr * 0.72, ry * 0.8, 0, 0, 6.283); c.fill(); c.fillStyle = '#0a0a0a'; c.beginPath(); c.ellipse(lx2, eyY + ry * 0.14, rr * 0.38, ry * 0.45, 0, 0, 6.283); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(lx2 - rr * 0.28, eyY - ry * 0.25, rr * 0.22, 0, 6.283); c.fill(); c.beginPath(); c.arc(lx2 + rr * 0.25, eyY + ry * 0.35, rr * 0.1, 0, 6.283); c.fill();
    if (o.lid) { c.fillStyle = o.lidC || '#00000000'; } c.restore();
    c.strokeStyle = ink; c.lineWidth = 3.6; c.beginPath(); c.ellipse(x, eyY, rr, ry * k, 0, Math.PI * 1.02, Math.PI * 1.98); c.stroke(); // upper lash
    c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, eyY, rr, ry * k, 0, Math.PI * 0.2, Math.PI * 0.8); c.stroke(); if (o.lash) { c.lineWidth = 2; c.beginPath(); c.moveTo(x + s * rr * 0.9, eyY - ry * k * 0.5); c.lineTo(x + s * rr * 1.3, eyY - ry * k * 0.85); c.stroke(); } };
  const lidEye = (x, s, k, angle = 0) => { // eye with upper lid lowered to k (0 open..1 closed)
    c.save(); c.beginPath(); c.ellipse(x, eyY, rr, ry, 0, 0, 6.283); c.clip(); c.fillStyle = '#fff'; c.fillRect(x - rr, eyY - ry, rr * 2, ry * 2); c.fillStyle = hx(eyeC); c.beginPath(); c.ellipse(x, eyY + ry * 0.2, rr * 0.72, ry * 0.8, 0, 0, 6.283); c.fill(); c.fillStyle = '#0a0a0a'; c.beginPath(); c.ellipse(x, eyY + ry * 0.22, rr * 0.38, ry * 0.45, 0, 0, 6.283); c.fill();
    c.globalCompositeOperation = 'destination-out'; c.save(); c.translate(x, eyY - ry + k * ry * 2); c.rotate(angle * s); c.fillRect(-rr * 2, -ry * 3, rr * 4, ry * 3); c.restore(); c.restore();
    c.strokeStyle = ink; c.lineWidth = 2.8; c.save(); c.translate(x, eyY - ry + k * ry * 2); c.rotate(angle * s); c.beginPath(); c.moveTo(-rr * 1.05, 0); c.lineTo(rr * 1.05, 0); c.stroke(); c.restore(); };
  const cell = (i, fn) => { c.save(); c.translate((i % ECOLS) * EW, Math.floor(i / ECOLS) * EH); c.beginPath(); c.rect(0, 0, EW, EH); c.clip(); fn(); c.restore(); };
  const both = f => { f(lx, -1); f(rx, 1); };
  cell(EYE.normal, () => both((x, s) => { openEye(x, s); brow(x, s, -0.05); }));
  cell(EYE.half, () => both((x, s) => { lidEye(x, s, 0.5); brow(x, s, -0.05, 2); }));
  cell(EYE.closed, () => both((x, s) => { c.strokeStyle = ink; c.lineWidth = 3; c.beginPath(); c.ellipse(x, eyY, rr, ry * 0.35, 0, 0.15, Math.PI - 0.15); c.stroke(); brow(x, s, -0.05, 3); }));
  cell(EYE.happy, () => both((x, s) => { c.strokeStyle = ink; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); c.ellipse(x, eyY + ry * 0.35, rr * 0.9, ry * 0.7, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); brow(x, s, -0.2, -3); }));
  cell(EYE.angry, () => both((x, s) => { lidEye(x, s, 0.28, -0.35); brow(x, s, 0.42, 4); }));
  cell(EYE.angryHalf, () => both((x, s) => { lidEye(x, s, 0.7, -0.2); brow(x, s, 0.42, 5); }));
  cell(EYE.hurt, () => both((x, s) => { c.strokeStyle = ink; c.lineWidth = 3.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - s * rr, eyY - ry * 0.6); c.lineTo(x + s * rr * 0.7, eyY); c.lineTo(x - s * rr, eyY + ry * 0.6); c.stroke(); brow(x, s, -0.45, 2); }));
  cell(EYE.ko, () => both((x, s) => { c.strokeStyle = ink; c.lineWidth = 3.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - rr, eyY - ry * 0.8); c.lineTo(x + rr, eyY + ry * 0.8); c.moveTo(x + rr, eyY - ry * 0.8); c.lineTo(x - rr, eyY + ry * 0.8); c.stroke(); brow(x, s, -0.3, -2); }));
  cell(EYE.smirk, () => both((x, s) => { lidEye(x, s, s < 0 ? 0.45 : 0.3, s < 0 ? 0 : -0.25); brow(x, s, s < 0 ? -0.25 : 0.38, s < 0 ? -5 : 3); }));
  cell(EYE.kind, () => both((x, s) => { openEye(x, s); brow(x, s, -0.28, -2); }));
  cell(EYE.sad, () => both((x, s) => { lidEye(x, s, 0.25, 0.25); brow(x, s, -0.5); }));
  cell(EYE.wide, () => both((x, s) => { openEye(x, s, { k: 1.12 }); brow(x, s, -0.15, -6); }));
  const t = new B.CanvasTexture(cv); t.colorSpace = B.SRGBColorSpace; t.anisotropy = 2; return (eyeCache[k] = t); }
function mouthAtlas(lipC) { const k = lipC; if (mouthCache[k]) return mouthCache[k]; const cv = document.createElement('canvas'); cv.width = MW * MCOLS; cv.height = MH * MROWS; const c = cv.getContext('2d'); const hr = 0.185;
  const [cx, cy] = toCell(MP, MW, MH, hr, 0, -0.08); const W = toCell(MP, MW, MH, hr, 0.05, 0)[0] - MW / 2; const ink = '#3a120c', inside = '#4a1010', tongue = '#d0505a';
  const cell = (i, fn) => { c.save(); c.translate((i % MCOLS) * MW, Math.floor(i / MCOLS) * MH); c.beginPath(); c.rect(0, 0, MW, MH); c.clip(); c.lineCap = 'round'; c.lineJoin = 'round'; fn(); c.restore(); };
  const openM = (w, h, teeth, tng = true) => { c.fillStyle = inside; c.beginPath(); c.ellipse(cx, cy, w, h, 0, 0, 6.283); c.fill(); if (tng) { c.save(); c.clip(); c.fillStyle = tongue; c.beginPath(); c.ellipse(cx, cy + h * 0.8, w * 0.6, h * 0.55, 0, 0, 6.283); c.fill(); c.restore(); } if (teeth) { c.save(); c.beginPath(); c.ellipse(cx, cy, w, h, 0, 0, 6.283); c.clip(); c.fillStyle = '#fff'; c.fillRect(cx - w, cy - h, w * 2, h * 0.38); if (teeth > 1) c.fillRect(cx - w, cy + h * 0.68, w * 2, h * 0.4); c.restore(); } c.strokeStyle = ink; c.lineWidth = 2.2; c.beginPath(); c.ellipse(cx, cy, w, h, 0, 0, 6.283); c.stroke(); };
  cell(MOUTH.smile, () => { c.strokeStyle = ink; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy - W * 0.7, W * 1.05, Math.PI * 0.2, Math.PI * 0.8); c.stroke(); });
  cell(MOUTH.open, () => openM(W * 0.62, W * 0.42, 1));
  cell(MOUTH.line, () => { c.strokeStyle = ink; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - W * 0.6, cy); c.lineTo(cx + W * 0.6, cy); c.stroke(); });
  cell(MOUTH.frown, () => { c.strokeStyle = ink; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy + W * 0.9, W * 0.95, Math.PI * 1.25, Math.PI * 1.75); c.stroke(); });
  cell(MOUTH.grin, () => { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(cx - W * 1.05, cy - W * 0.18); c.quadraticCurveTo(cx, cy - W * 0.05, cx + W * 1.05, cy - W * 0.18); c.quadraticCurveTo(cx, cy + W * 0.95, cx - W * 1.05, cy - W * 0.18); c.fill(); c.strokeStyle = ink; c.lineWidth = 2.4; c.stroke(); c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx - W * 0.85, cy + W * 0.05); c.quadraticCurveTo(cx, cy + W * 0.3, cx + W * 0.85, cy + W * 0.05); c.stroke(); for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(cx + i * W * 0.3, cy - W * 0.1); c.lineTo(cx + i * W * 0.3, cy + W * 0.4); c.stroke(); } });
  cell(MOUTH.roar, () => { openM(W * 1.0, W * 0.75, 2); c.fillStyle = '#fff'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * W * 0.6, cy - W * 0.55); c.lineTo(cx + s * W * 0.45, cy - W * 0.2); c.lineTo(cx + s * W * 0.75, cy - W * 0.45); c.fill(); } });
  cell(MOUTH.o, () => openM(W * 0.3, W * 0.36, 0, false));
  cell(MOUTH.smirk, () => { c.strokeStyle = ink; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - W * 0.6, cy + W * 0.05); c.quadraticCurveTo(cx + W * 0.2, cy + W * 0.15, cx + W * 0.75, cy - W * 0.3); c.stroke(); });
  const t = new B.CanvasTexture(cv); t.colorSpace = B.SRGBColorSpace; return (mouthCache[k] = t); }
function patch(P, r) { return new B.SphereGeometry(r, 10, 6, P.phi0, P.phiL, P.th0, P.thL); }
const BASE_EYE = { angry: 'angry', kind: 'kind', sad: 'sad' }; const BASE_MOUTH = { smile: 'smile', grin: 'grin', teeth: 'grin', line: 'line', frown: 'frown' };
export function buildFace(c, L, o) { const { hr, hy, headY, skinC } = o; const g = new B.Group(); g.position.set(0, hy - headY, 0); c.bones.head.add(g);
  const mkMat = (tex, cols, rows) => { const map = tex.clone(); map.needsUpdate = true; map.repeat.set(1 / cols, 1 / rows); const m = new B.MeshToonMaterial({ map, alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.userData.cols = cols; m.userData.rows = rows; return m; };
  const browC = L.hair && L.hairS !== 'bald' ? L.hair : 0x2a1a10; let eyes = null, mouth = null;
  if (L.glasses !== 'shades' && !L.noEyes) { eyes = new B.Mesh(patch(EP, hr * 1.012), mkMat(eyeAtlas(L.eye || 0x2a1a10, browC, L.thickBrow), ECOLS, EROWS)); g.add(eyes); }
  if (!L.mask && !L.jaw && !L.saw && !L.noMouth) { mouth = new B.Mesh(patch(MP, hr * 1.012), mkMat(mouthAtlas(0), MCOLS, MROWS)); g.add(mouth); }
  const set = (mesh, i) => { if (!mesh || mesh.userData.i === i) return; mesh.userData.i = i; const m = mesh.material, cols = m.userData.cols, rows = m.userData.rows; m.map.offset.set((i % cols) / cols, 1 - (Math.floor(i / cols) + 1) / rows); };
  const baseE = EYE[BASE_EYE[L.brow]] ?? EYE.normal, baseM = MOUTH[BASE_MOUTH[L.mouth || 'smile']] ?? MOUTH.smile;
  const F = { group: g, expr: null, exprT: 0, blinkT: 1 + Math.random() * 3, blink: 0, flap: 0, lookYaw: 0, lookPitch: 0,
    set(expr, dur = 0) { this.expr = expr; this.exprT = dur; },
    update(dt, st = {}) { this.exprT > 0 && (this.exprT -= dt) <= 0 && (this.expr = null);
      let ex = this.expr; if (!ex) { if (st.dead !== undefined) ex = 'ko'; else if ((st.hit || 0) > 0.35) ex = 'hurt'; else if (st.taunt) ex = (st.tauntT ?? (performance.now() / 1000)) % 2.4 < 1.1 ? 'smirk' : 'roar'; else if (st.attack > 0 || st.windup || st.angry || st.angryFace) ex = 'angry'; else if (st.happy) ex = 'happy'; }
      // blinking
      this.blinkT -= dt; if (this.blinkT <= 0) { this.blink = 0.16; this.blinkT = 1.8 + Math.random() * 3.5; if (Math.random() < 0.15) this.blinkT = 0.25; } this.blink = Math.max(0, this.blink - dt);
      const bl = this.blink > 0 ? (this.blink > 0.11 || this.blink < 0.05 ? 1 : 2) : 0;
      let e = ex === 'ko' ? EYE.ko : ex === 'hurt' ? EYE.hurt : ex === 'happy' ? EYE.happy : ex === 'angry' || ex === 'roar' ? EYE.angry : ex === 'smirk' ? EYE.smirk : ex === 'surprised' ? EYE.wide : baseE;
      if (bl && (e === EYE.normal || e === EYE.kind || e === EYE.wide || e === EYE.sad)) e = bl === 2 ? EYE.closed : EYE.half; else if (bl && e === EYE.angry) e = EYE.angryHalf;
      let m = ex === 'ko' || ex === 'hurt' || ex === 'surprised' ? MOUTH.o : ex === 'roar' ? MOUTH.roar : ex === 'smirk' ? MOUTH.smirk : ex === 'angry' ? (baseM === MOUTH.grin ? MOUTH.grin : MOUTH.frown) : ex === 'happy' ? (baseM === MOUTH.grin ? MOUTH.grin : MOUTH.smile) : baseM;
      if (st.talk && !ex) { this.flap -= dt; if (this.flap <= 0) { this.flap = 0.07 + Math.random() * 0.1; this.fo = !this.fo; } m = this.fo ? MOUTH.open : baseM === MOUTH.frown ? MOUTH.line : baseM; }
      set(eyes, e); set(mouth, m); } };
  return F; }
