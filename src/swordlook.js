// Distinct procedural sword looks: one spec per sword (+ Tier II overrides) drives the first-person model, the third-person / remote
// held + sheathed models and the 2D shop/Bag/Index icon. Low poly: blade = one extruded profile, everything merged into one
// vertex-coloured mesh (+ outline); glow / ice parts use a handful of shared materials. Geometry is cached per sword.
import { THREE as B, Builder, mat, OUTLINE_MAT } from './engine.js';
const RX = Math.PI / 2;
// ---------- type templates ----------
const TY = {
  katana: { L: 1.1, w: 0.05, wt: 0.044, cv: 1, tip: 'kissaki', hm: 'str', g: 'round', gr: 6.5, hl: 0.24, wrap: 1, hab: 1 },
  nodachi: { L: 1.42, w: 0.052, wt: 0.045, cv: 1.1, tip: 'kissaki', hm: 'str', g: 'round', gr: 7, hl: 0.33, wrap: 1, hab: 1 },
  tachi: { L: 1.16, w: 0.048, wt: 0.04, cv: 1.6, tip: 'kissaki', hm: 'str', g: 'oval', gr: 6.5, hl: 0.25, wrap: 1, hab: 1 },
  shira: { L: 1.08, w: 0.04, wt: 0.036, cv: 0.35, tip: 'kissaki', hm: 'str', g: 'none', hl: 0.26, wrap: 0, cane: 1 },
  saber: { L: 1.04, w: 0.04, wt: 0.036, cv: 0.55, tip: 'point', hm: 'str', g: 'knuckle', gr: 4, hl: 0.2, wrap: 0, ridges: 1 },
  cutlass: { L: 0.86, w: 0.055, wt: 0.075, cv: 0.75, tip: 'clip', hm: 'str', g: 'cup', gr: 5, hl: 0.19, wrap: 0, ridges: 1 },
  scimitar: { L: 0.98, w: 0.05, wt: 0.095, cv: 1.8, tip: 'clip', hm: 'str', g: 'bar', gr: 7, hl: 0.2, wrap: 0, ridges: 1 },
  rapier: { L: 1.18, w: 0.02, wt: 0.014, cv: 0, tip: 'point', hm: 'none', g: 'cup', gr: 5, hl: 0.19, wrap: 0, ridges: 1, bar: 1 },
  broad: { L: 1.15, w: 0.07, wt: 0.06, cv: 0, tip: 'point', hm: 'str', de: 1, fu: 1, g: 'bar', gr: 11, hl: 0.24, wrap: 0, ridges: 1, pmb: 1 },
  gladius: { L: 0.7, w: 0.065, wt: 0.08, cv: 0, tip: 'point', hm: 'str', de: 1, fu: 1, g: 'oval', gr: 5, hl: 0.18, wrap: 0, ridges: 1, pmb: 1 },
  great: { L: 1.38, w: 0.095, wt: 0.085, cv: 0, tip: 'point', hm: 'str', de: 1, fu: 1, g: 'bar', gr: 17, hl: 0.34, wrap: 1, pmb: 1 },
  cleaver: { L: 1.05, w: 0.11, wt: 0.14, cv: 0.2, tip: 'square', hm: 'str', g: 'bar', gr: 9, hl: 0.26, wrap: 1 },
  dagger: { L: 0.42, w: 0.042, wt: 0.03, cv: 0, tip: 'point', hm: 'str', de: 1, g: 'bar', gr: 5, hl: 0.13, wrap: 0, ridges: 1 },
  saw: { L: 1.2, w: 0.085, wt: 0.08, cv: 0.3, tip: 'kissaki', hm: 'teeth', g: 'round', gr: 7, hl: 0.27, wrap: 1 },
  spear: { L: 0.32, P: 0.8, w: 0.06, wt: 0.05, cv: 0, tip: 'point', hm: 'str', de: 1, g: 'none', hl: 0.3, pole: 1 },
  trident: { L: 0.3, P: 0.78, w: 0.022, wt: 0.02, cv: 0, tip: 'point', hm: 'none', g: 'none', hl: 0.3, pole: 1, prongs: 3 },
  halberd: { L: 0.34, P: 0.8, w: 0.05, wt: 0.04, cv: 0, tip: 'point', hm: 'str', de: 1, g: 'none', hl: 0.3, pole: 1, axe: 1 },
  glaive: { L: 0.62, P: 0.78, w: 0.075, wt: 0.105, cv: 1.6, tip: 'clip', hm: 'str', g: 'round', gr: 5, hl: 0.3, pole: 1 },
  axe: { L: 0.18, P: 0.62, w: 0.05, wt: 0.04, cv: 0, tip: 'point', hm: 'none', g: 'none', hl: 0.3, pole: 1, axe: 2 },
  jitte: { L: 1.0, w: 0.03, wt: 0.03, cv: 0, tip: 'round', hm: 'none', g: 'none', hl: 0.24, wrap: 1, rod: 1 },
  whip: { L: 1.15, w: 0.034, wt: 0.02, cv: 0, tip: 'point', hm: 'none', g: 'bar', gr: 4, hl: 0.2, wrap: 0, ridges: 1, whip: 1 },
  claws: { L: 0.62, w: 0.016, wt: 0.012, cv: 1.2, tip: 'point', hm: 'none', g: 'none', hl: 0.12, wrap: 0, claws: 5 },
  hook: { L: 0.55, w: 0.045, wt: 0.03, cv: 0.4, tip: 'point', hm: 'str', g: 'cup', gr: 6, hl: 0.16, wrap: 0, hook: 1 },
  scissors: { L: 1.05, w: 0.07, wt: 0.03, cv: 0, tip: 'point', hm: 'str', g: 'none', hl: 0.16, wrap: 0, scissors: 1 },
};
// ---------- per sword: [type, overrides] ----------
// b blade · e edge/hamon · hm hamon (str/wave/gunome/teeth/none) · g guard shape · gc guard · grc grip · wr wrap · pm pommel · sh sheath · gl glow · ice translucent
const LOOK = {
  cutlass: ['cutlass', { b: 0x9a8f80, e: 0xcfc4b0, gc: 0x8a6a3a, grc: 0x5a3a20, sh: 0x5a3a22, rust: 1 }],
  marine: ['saber', { b: 0xe6eef8, e: 0xffffff, gc: 0xd8b040, grc: 0xf2f2f2, sh: 0x22345a }],
  wado: ['katana', { b: 0xeef2f6, e: 0xffffff, hm: 'wave', g: 'mokko', gc: 0xd0a040, grc: 0xffffff, wr: 0xffffff, wd: 0x1a1a1a, sh: 0xf4f4f4, pm: 0xd0a040 }],
  buggyknife: ['dagger', { b: 0xe0e6ee, gc: 0xe03030, grc: 0xffd040, sh: 0xe03030, x: 'stripe' }],
  kurocl: ['claws', { b: 0xd8dde4, grc: 0x2a2a3a, gc: 0x3a3a50 }],
  pearl: ['saber', { L: 1.12, w: 0.03, wt: 0.026, cv: 0.2, b: 0xf4f4f8, g: 'round', gr: 4, gc: 0xffd860, grc: 0xe0b040, sh: 0xc89a3a }],
  sawtooth: ['saw', { b: 0xb8c8d4, e: 0xe8f2ff, gc: 0x3a5a8a, grc: 0x2a3a5a, wr: 0x4a7aaa, sh: 0x3a5a8a, teethS: 1 }],
  yubashiri: ['katana', { w: 0.042, wt: 0.038, b: 0xf6f8fc, e: 0xffffff, g: 'round', gr: 5.5, gc: 0xc8ccd8, grc: 0x8a90c8, wr: 0xdde0ff, sh: 0x6a72b8 }],
  nidai: ['katana', { b: 0xc8ccd4, e: 0xe0d0d0, hm: 'gunome', g: 'sq', gc: 0x3a3030, grc: 0x1a1a1a, wr: 0x7a1a1a, sh: 0x3a1a1a }],
  sandai: ['katana', { b: 0xd8dce2, e: 0xff9a9a, hm: 'wave', g: 'clover', gc: 0x2a2224, grc: 0x8a1010, wr: 0xc81e1e, sh: 0xa01414, pm: 0x2a2224 }],
  peacemaker: ['whip', { b: 0x8a9098, e: 0xc0c8d0, gc: 0x6a6a72, grc: 0x5a3a22 }],
  hook: ['hook', { b: 0xffcc33, e: 0xfff0a0, gc: 0xe0a020, grc: 0x2a4a2a, gl: null }],
  jitte: ['jitte', { b: 0x5a5a62, e: 0x2a2a30, grc: 0x7a5a3a, wr: 0x3a2a1a, gc: 0x3a3a40 }],
  shigure: ['katana', { L: 1.05, w: 0.045, b: 0xe8ecf2, e: 0xffffff, hm: 'str', g: 'round', gc: 0x2a2a30, notch: 1, grc: 0x1a1a1a, wr: 0xe8e8e8, wd: 0x1a1a1a, sh: 0x1a1a1a }],
  kanshou: ['shira', { b: 0xdde3ea, grc: 0x2a1a10, sh: 0x2a1a10, pm: 0xe0d8b0 }],
  kikoku: ['nodachi', { L: 1.5, b: 0xdfe5ec, e: 0xffffff, g: 'cross4', gr: 7.5, gc: 0x1a1a1a, grc: 0xf2f2f2, wr: 0xf2f2f2, wd: 0x1a1a1a, sh: 0x1a1a1a, pm: 0x1a1a1a, x: 'tassel', xc: 0xd03a3a }],
  pacifista: ['axe', { P: 0.62, b: 0xc8ccd2, e: 0xffffff, grc: 0x8a6a3a, gc: 0xd0b040 }],
  kujabow: ['scimitar', { b: 0xe8ecf2, e: 0xffffff, gc: 0xe0b040, grc: 0x7a2a8a, sh: 0x6a2a7a, pm: 0x3aaa5a }],
  seastone: ['halberd', { b: 0x7a92a2, e: 0xb8d0e0, grc: 0x3a3a40, gc: 0x2a2a30 }],
  saberhq: ['katana', { b: 0xe4eaf2, e: 0xffffff, g: 'round', gc: 0xd8b040, grc: 0xeeeef4, wr: 0xeeeef4, wd: 0x1e3a7a, sh: 0x1e3a7a }],
  bisento: ['rapier', { w: 0.03, wt: 0.022, L: 1.05, b: 0xf0f2f6, g: 'flower', gr: 6, gc: 0xff6a9a, grc: 0xf8f0f4, sh: 0xc04a7a, x: 'twin' }],
  coral: ['trident', { b: 0xff8a7a, e: 0xffd0c0, grc: 0xd8505a, gc: 0xff7a6a }],
  iceblade: ['saber', { L: 1.1, w: 0.05, wt: 0.046, cv: 0.2, b: 0xbfe8ff, e: 0xffffff, ice: 1, g: 'star', gr: 7, gc: 0x9ad8ff, grc: 0xdff4ff, gl: 0x9ae4ff }],
  gladius: ['gladius', { b: 0xe6e8ec, gc: 0xc08a3a, grc: 0xa02a2a, pm: 0xc08a3a, sh: 0x6a1a1a }],
  kirin: ['broad', { b: 0xdfe4ea, gc: 0xc8ccd8, grc: 0x6a4a2a, pm: 0xc8ccd8, sh: 0x4a3420 }],
  tusk: ['scimitar', { L: 1.1, w: 0.065, wt: 0.12, b: 0x8a8c92, e: 0xc8ccd2, gc: 0x3a3a3a, grc: 0x2a4a2a, sh: 0x2a3a2a }],
  mink: ['broad', { cv: 0.3, de: 0, tip: 'kissaki', b: 0xe0e4ea, e: 0xfff27a, g: 'oval', gr: 6, gc: 0xd8a83a, grc: 0x9a7a4a, wr: 0x6a4a2a, wrap: 1, gl: 0xfff27a, glE: 1 }],
  candy: ['trident', { P: 0.7, L: 0.34, w: 0.03, b: 0xfff0f4, e: 0xffffff, grc: 0x5a1a3a, gc: 0xfff0f4 }],
  napoleon: ['cleaver', { L: 1.12, w: 0.1, wt: 0.12, cv: 0.6, tip: 'clip', b: 0xe8ecf2, e: 0xffffff, g: 'flower', gr: 9, gc: 0xffcc33, grc: 0xc81e3a, wr: 0xffcc33, sh: 0x8a1a2a, x: 'face' }],
  ame: ['katana', { b: 0xe8ecf2, e: 0xffb070, hm: 'wave', g: 'round', gc: 0xd8a040, grc: 0x8a2a1a, wr: 0xe0582a, sh: 0x6a1a10, gl: 0xff8a3a, glE: 1 }],
  shusui: ['katana', { L: 0.98, cv: 0.4, b: 0xe0e4ea, e: 0xffffff, g: 'sq', gc: 0x3a3a3a, grc: 0xd8c8a0, wr: 0xd8c8a0, wd: 0x5a4a30, sh: 0x8a7a5a, x: 'twin' }],
  soulsolid: ['shira', { w: 0.03, wt: 0.026, cv: 0, b: 0xd8ecff, e: 0xffffff, ice: 1, grc: 0x5a1a2a, sh: 0x5a1a2a, gl: 0x9ad0ff, pm: 0xf0f0e0, x: 'skull' }],
  durandal: ['rapier', { w: 0.026, b: 0xf6f6fa, gc: 0xffd860, grc: 0xffffff, sh: 0xf0f0f0, x: 'rose' }],
  sakura: ['katana', { b: 0xeef0f4, e: 0xffd0e4, hm: 'wave', g: 'flower', gc: 0xff8ab8, grc: 0x2a1a2a, wr: 0xff9ac0, sh: 0x3a1a2a }],
  oni: ['shira', { L: 1.12, b: 0xe8ecf2, e: 0xffffff, grc: 0x5a3a8a, sh: 0x5a3a8a, pm: 0xd8b040 }],
  tenseiken: ['nodachi', { L: 1.58, w: 0.058, b: 0xc8ccd4, e: 0xe8eef4, g: 'sq', gr: 8, gc: 0x2a2a2a, grc: 0x1a1a1a, wr: 0x3a3a3a, sh: 0x2a1a10 }],
  murakumo: ['glaive', { b: 0xe0e6ee, e: 0xffffff, grc: 0x1e1e22, gc: 0xd8b040, rings: 0xd8b040 }],
  laser: ['broad', { L: 1.15, w: 0.06, wt: 0.05, b: 0xfff6c0, e: 0xffffff, tip: 'clip', de: 0, fu: 0, g: 'bar', gr: 8, gc: 0xe8ecf4, grc: 0x9aa0b0, pm: 0xfff27a, gl: 0xfff27a, glB: 1 }],
  kogarasu: ['tachi', { L: 1.25, b: 0x3a3a42, e: 0xff7a3a, hm: 'wave', g: 'oval', gc: 0x2a2a2a, grc: 0x1a1a1a, wr: 0x3a1a1a, sh: 0x1a1a1a, gl: 0xff6a2a, glE: 1 }],
  shodai: ['katana', { L: 1.2, b: 0xc8c0c4, e: 0xff6a6a, hm: 'gunome', g: 'clover', gr: 7.5, gc: 0x1a1414, grc: 0x5a0a0a, wr: 0x9a1010, sh: 0x2a0a0a, gl: 0xff2a2a, glA: 0.18 }],
  gryphon: ['saber', { L: 1.12, w: 0.045, wt: 0.05, cv: 0.4, tip: 'clip', b: 0xe8ecf2, gc: 0xe0b040, grc: 0x1a1a1a, sh: 0x1a1a1a, x: 'gryph' }],
  enma: ['katana', { L: 1.22, b: 0xd8d0e8, e: 0xc070ff, hm: 'wave', g: 'oval', gc: 0x8a6a2a, grc: 0x1a1220, wr: 0x2a1a3a, wd: 0x9a4aff, sh: 0x2a1030, gl: 0xa040ff, glE: 1, glA: 0.22 }],
  yoru: ['great', { b: 0x14141a, e: 0x2a2a34, gc: 0xffcc33, grc: 0x1a1a1a, wr: 0x2a2a2a, wd: 0xffcc33, pm: 0xffcc33, x: 'cross', sh: 0x1a1a1a }],
  ameno: ['broad', { L: 1.25, w: 0.05, wt: 0.045, b: 0xfff6a0, e: 0xffffff, de: 1, fu: 0, g: 'bar', gr: 7, gc: 0xffe060, grc: 0xffe060, pm: 0xffe060, gl: 0xfff27a, glB: 1, ice: 1 }],
  ryuma: ['katana', { L: 1.2, b: 0x18181f, e: 0x5a3a4a, hm: 'wave', g: 'flower', gr: 6.5, gc: 0x2a2a2a, grc: 0x3a0a14, wr: 0x6a1020, sh: 0x1a1a1a, fu: 1 }],
  kitetsu1: ['nodachi', { L: 1.4, cv: 0.6, b: 0xa8b8c8, e: 0xd8ecff, hm: 'gunome', g: 'round', gc: 0x4a5a6a, grc: 0x1a2a3a, wr: 0x3a5a7a, sh: 0x1a2a3a }],
  ameoden: ['katana', { L: 1.18, b: 0x1a1a22, e: 0x8a8a9a, hm: 'str', g: 'round', gr: 7, gc: 0xd8a040, grc: 0x5a2a1a, wr: 0x8a3a1a, sh: 0x3a1a10 }],
  kashu: ['tachi', { L: 1.22, b: 0xe0d8c8, e: 0xffffff, g: 'mokko', gc: 0xb8703a, grc: 0x1a3a2a, wr: 0x2a6a4a, sh: 0x1a3a2a }],
  kokuto: ['saw', { L: 1.32, w: 0.12, wt: 0.13, cv: 0.2, tip: 'clip', b: 0x5a7a9a, e: 0xd8e8f8, g: 'bar', gr: 10, gc: 0x2a3a4a, grc: 0x2a2a2a, wr: 0x4a5a6a, sh: 0x2a3a4a, teethS: 1 }],
  wazamono: ['saber', { L: 1.08, cv: 0.35, b: 0xd0d6de, gc: 0xc8ccd8, g: 'cup', grc: 0x2a2a3a, sh: 0x2a2a3a, x: 'basket' }],
  sutra: ['dagger', { L: 0.5, w: 0.05, b: 0x2a2a30, e: 0xd8d8e0, gc: 0xd8b040, grc: 0x1a1a1a, pm: 0xd8b040, x: 'cross', sh: 0x1a1a1a }],
  gods: ['cleaver', { L: 1.32, w: 0.12, wt: 0.15, cv: 0.9, tip: 'clip', b: 0x2a2228, e: 0xff3a5a, g: 'star', gr: 9, gc: 0x3a2a3a, grc: 0x1a1018, wr: 0x5a1a2a, pm: 0xe8e0d0, x: 'skull', sh: 0x1a1018, gl: 0xff2a4a, glE: 1, teethS: 1 }],
  sorrow: ['scissors', { b: 0xd0d4dc, e: 0xffffff, grc: 0x3a1a4a, gc: 0x5a2a6a }],
  shiro: ['cutlass', { L: 1.0, w: 0.055, wt: 0.07, b: 0x1c1c22, e: 0x6a6a7a, g: 'knuckle', gc: 0xd8b040, grc: 0x8a1a1a, sh: 0x2a1a10 }],
  sanbon: ['katana', { b: 0xeef2f6 }],
};
// Tier II forms: blade override + aura
const T2L = { wado: { b: 0x18181e, e: 0x6a5a8a, a: 0x9a6aff }, sandai: { a: 0xff2a2a, e: 0xff4a4a }, shusui: { b: 0x18181e, a: 0x9a9aff }, kikoku: { a: 0x8a3aff, e: 0xc8a0ff },
  enma: { a: 0xff3ad0, e: 0xff70f0 }, yoru: { a: 0x3aff8a, e: 0x3aff8a }, murakumo: { a: 0xfff27a }, ame: { b: 0x1a1a22, a: 0xff8a2a }, durandal: { a: 0xfff6c0, e: 0xffffff },
  sanbon: { a: 0xb04aff }, napoleon: { a: 0xff6ab0 }, kirin: { a: 0x7ad8ff, e: 0xbff0ff } };
export const SANBON = ['ryuma', 'sandai', 'wado']; // right hand, left hand, mouth
export const auraOf = (id, t2) => t2 && T2L[id] ? T2L[id].a : null;
export function lookOf(id, t2) { const L = LOOK[id]; if (!L) return null; const s = { id, type: L[0], ...TY[L[0]], ...L[1] }; if (t2 && T2L[id]) { const o = T2L[id]; s.t2 = 1; if (o.b) s.b = o.b; if (o.e) s.e = o.e; s.aura = o.a; } return s; }
export const LOOK_IDS = Object.keys(LOOK);
// ---------- 2D blade profile (s along blade, y up = spine side) ----------
function wav(s, hm, u) { return hm === 'wave' ? 1 + 0.45 * Math.sin(u * 38) : hm === 'gunome' ? 1 + 0.5 * Math.abs(Math.sin(u * 26)) : 1; }
export function profile(sp) { const N = 14, L = sp.L, s0 = sp.P || 0; const c = u => (sp.cv || 0) * 0.06 * L * u * u; const hw = u => ((sp.w + (sp.wt - sp.w) * u) / 2);
  const tipF = sp.tip === 'kissaki' ? 0.1 : sp.tip === 'point' ? (sp.de ? 0.22 : 0.16) : sp.tip === 'clip' ? 0.25 : sp.tip === 'round' ? 0.05 : 0.0001; const u0 = 1 - tipF;
  const sp_ = [], ed = []; for (let i = 0; i <= N; i++) { const u = i / N * u0; sp_.push([s0 + u * L, c(u) + hw(u)]); ed.push([s0 + u * L, c(u) - hw(u)]); }
  const tipS = [], tipE = []; const M = 6; for (let j = 1; j <= M; j++) { const t = j / M, u = u0 + t * tipF, y = c(u), h = hw(u);
    if (sp.tip === 'kissaki') { tipS.push([s0 + u * L, y + h * (1 - t * t * 0.35)]); tipE.push([s0 + u * L, y - h + 1.65 * h * t * t]); }
    else if (sp.tip === 'point') { tipS.push([s0 + u * L, y + h * (1 - t) * (sp.de ? 1 : 1 - t * 0.2)]); tipE.push([s0 + u * L, y - h * (1 - t)]); }
    else if (sp.tip === 'clip') { tipS.push([s0 + u * L, y + h - 1.8 * h * Math.sin(t * RX)]); tipE.push([s0 + u * L, y - h * (1 - t * t * 0.2)]); }
    else if (sp.tip === 'round') { const a = t * RX; tipS.push([s0 + (u0 * L) + Math.sin(a) * h, y + Math.cos(a) * h]); tipE.push([s0 + (u0 * L) + Math.sin(a) * h, y - Math.cos(a) * h]); }
    else { tipS.push([s0 + L, y + h]); tipE.push([s0 + L, y - h]); } }
  const spine = [...sp_, ...tipS], edge = [...ed, ...tipE]; if (sp.tip === 'clip') edge[edge.length - 1] = spine[spine.length - 1].slice();
  if (sp.tip === 'point' || sp.tip === 'kissaki') { const a = spine[spine.length - 1], b = edge[edge.length - 1]; const m = [(a[0] + b[0]) / 2 + 0.003, (a[1] + b[1]) / 2]; spine[spine.length - 1] = m; edge[edge.length - 1] = m; }
  const body = [...spine, ...edge.slice().reverse()];
  // hamon / edge band (inner boundary wavy), teeth
  const band = (side) => { const E = side > 0 ? spine : edge, O = side > 0 ? edge : spine; const inner = E.map((p, i) => { const q = O[Math.min(i, O.length - 1)]; const d = q[1] - p[1]; const u = (p[0] - s0) / L; const bw = Math.min(Math.abs(d) * 0.42, sp.w * 0.32 * wav(0, sp.hm, u)); return [p[0], p[1] + Math.sign(d) * bw]; }); return [...E, ...inner.reverse()]; };
  const bands = sp.hm === 'none' ? [] : [band(-1)]; if (sp.de && sp.hm !== 'none') bands.push(band(1));
  const teeth = []; if (sp.hm === 'teeth' || sp.teethS) { const E = sp.teethS ? spine : edge, sg = sp.teethS ? 1 : -1; const n = Math.round(L * 11); for (let i = 1; i < n - 1; i++) { const u = i / n * u0, u1 = (i + 0.6) / n * u0; const a = [s0 + u * L, c(u) + sg * hw(u)], b = [s0 + u1 * L, c(u1) + sg * hw(u1)]; teeth.push([a, b, [s0 + (u - 0.012) * L, c(u) + sg * (hw(u) + sp.w * 0.32)]]); } }
  const fuller = sp.fu ? (() => { const a = [], b = []; for (let i = 1; i <= 10; i++) { const u = i / 10 * u0 * 0.85; a.push([s0 + u * L, c(u) + 0.006]); b.push([s0 + u * L, c(u) - 0.006]); } return [...a, ...b.reverse()]; })() : null;
  return { body, bands, teeth, fuller, spine, edge, c, hw }; }
// ---------- 3D ----------
const shp = pts => { const s = new B.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); s.closePath(); return s; };
const ext = (shapes, th) => new B.ExtrudeGeometry(shapes, { depth: th, bevelEnabled: false, curveSegments: 3 });
// shape (x along blade, y up, extrude z = thickness) -> sword frame (blade along -z from z=-0.12, thickness along x)
const BM = (th, x0 = 0) => new B.Matrix4().set(0, 0, 1, -th / 2 + x0, 0, 1, 0, 0, -1, 0, 0, -0.12, 0, 0, 0, 1);
const GEO = new Map(); const MATS = {}; const AURAS = [];
function basicMat(col, op, add) { const k = col + ':' + op + ':' + add; return MATS[k] || (MATS[k] = new B.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, blending: add ? B.AdditiveBlending : B.NormalBlending, side: B.DoubleSide })); }
function auraMat(col) { const k = 'aura' + col; if (!MATS[k]) { MATS[k] = basicMat(col, 0.4, true).clone(); AURAS.push(MATS[k]); } return MATS[k]; }
export function tickSwordFx(t) { for (let i = 0; i < AURAS.length; i++) AURAS[i].opacity = 0.32 + 0.16 * Math.sin(t * 5 + i); }
function guardShape(sp) { const R = (sp.gr || 6) / 100, g = sp.g; const pts = [];
  if (g === 'round' || g === 'oval') { for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; const n = sp.notch && i % 5 === 0 ? 0.82 : 1; pts.push([Math.cos(a) * R * (g === 'oval' ? 0.72 : 1) * n, Math.sin(a) * R * n]); } }
  else if (g === 'sq') { for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pts.push([x * R * 0.82, y * R * 0.9]); }
  else if (g === 'mokko' || g === 'clover' || g === 'cross4') { const lobes = 4; for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2 + Math.PI / 4; const k = g === 'cross4' ? 0.55 + 0.45 * Math.pow(Math.abs(Math.cos(a * 2)), 3) : 0.78 + 0.22 * Math.abs(Math.cos(a * lobes / 2)); pts.push([Math.cos(a) * R * k, Math.sin(a) * R * k]); } }
  else if (g === 'flower') { for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; const k = 0.7 + 0.3 * Math.abs(Math.cos(a * 3)); pts.push([Math.cos(a) * R * k, Math.sin(a) * R * k]); } }
  else if (g === 'star') { for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const k = i % 2 ? 0.45 : 1; pts.push([Math.cos(a) * R * k * 0.8, Math.sin(a) * R * k]); } }
  else return null; return pts; }
function geoFor(sp) { const key = sp.id + (sp.t2 ? '*' : '') + (sp.sub || ''); if (GEO.has(key)) return GEO.get(key);
  const b = new Builder(), gb = { glow: [], ice: [] }; const o = { ot: 0.005 }, no = { outline: false }; const th = sp.type === 'great' || sp.type === 'cleaver' ? 0.016 : sp.type === 'rapier' ? 0.008 : 0.01;
  const pr = profile(sp); const bladeCol = sp.b ?? 0xdde3ea, edgeCol = sp.e ?? 0xffffff; const P = sp.P || 0; const hl = sp.hl || 0.24;
  // X: extra placement applied after the shape->sword-frame matrix (thickness-specific so bands/teeth sit proud of the blade)
  const at = (geo, t, X) => { geo.applyMatrix4(X ? new B.Matrix4().copy(X).multiply(BM(t)) : BM(t)); return geo; };
  const addBlade = (pr, X, th) => { const body = at(ext(shp(pr.body), th), th, X);
    if (sp.ice) gb.ice.push(body); else b.add(body, bladeCol, null, o);
    for (const bd of pr.bands) b.add(at(ext(shp(bd), th * 1.25), th * 1.25, X), edgeCol, null, no);
    if (pr.teeth.length) b.add(at(ext(pr.teeth.map(shp), th * 0.8), th * 0.8, X), edgeCol, null, o);
    if (pr.fuller) b.add(at(ext(shp(pr.fuller), th * 1.3), th * 1.3, X), (bladeCol >> 1) & 0x7f7f7f, null, no);
    if (sp.gl && sp.glE) for (const bd of pr.bands) gb.glow.push(at(ext(shp(bd), th * 2.2), th * 2.2, X));
    if (sp.gl && sp.glB) gb.glow.push(at(ext(shp(pr.body), th * 3), th * 3, X)); };
  // ---- blade(s) ----
  if (sp.claws) { for (let i = 0; i < sp.claws; i++) { const off = (i - (sp.claws - 1) / 2); const X = new B.Matrix4().makeTranslation(off * 0.018, off * 0.004, 0.06).multiply(new B.Matrix4().makeRotationX(off * 0.07)); addBlade(pr, X, th); }
    b.add(new B.BoxGeometry(0.12, 0.07, 0.14), sp.grc, mat(0, 0, 0.02), o); for (let i = 0; i < 4; i++) b.add(new B.BoxGeometry(0.024, 0.03, 0.05), sp.gc, mat(-0.045 + i * 0.03, 0.045, -0.04), no); }
  else if (sp.scissors) { for (const sg of [1, -1]) { const X = new B.Matrix4().makeTranslation(sg * 0.007, 0, -0.16).multiply(new B.Matrix4().makeRotationX(sg * 0.12)).multiply(new B.Matrix4().makeTranslation(0, 0, 0.16)); addBlade(pr, X, th); }
    b.add(new B.CylinderGeometry(0.02, 0.02, 0.04, 8), 0x2a2a2a, mat(0, 0, -0.16, 0, 0, RX), no);
    for (const sg of [1, -1]) { b.add(new B.TorusGeometry(0.05, 0.012, 5, 12), sp.grc, mat(0, sg * 0.04, 0.04, 0, RX, 0), o); b.add(new B.BoxGeometry(0.016, 0.022, 0.12), sp.grc, mat(0, sg * 0.02, -0.06, sg * 0.3), o); } }
  else if (sp.whip) { const n = 9; for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, w = sp.w * (1 - u * 0.5); const y = Math.sin(u * 9) * 0.04 * u; b.add(new B.BoxGeometry(0.012, w, sp.L / n * 0.86), i % 2 ? bladeCol : edgeCol, mat(0, y, -0.12 - u * sp.L, Math.cos(u * 9) * 0.25), o); } }
  else if (sp.rod) { b.add(new B.CylinderGeometry(0.018, 0.02, sp.L, 8), bladeCol, mat(0, 0, -0.12 - sp.L / 2, RX), o); b.add(new B.SphereGeometry(0.03, 8, 6), edgeCol, mat(0, 0, -0.12 - sp.L), o);
    b.add(new B.BoxGeometry(0.014, 0.1, 0.016), bladeCol, mat(0, -0.04, -0.17), o); b.add(new B.CylinderGeometry(0.008, 0.01, 0.16, 6), bladeCol, mat(0, -0.088, -0.25, RX), o); }
  else if (sp.hook) { addBlade(pr, null, th); b.add(new B.TorusGeometry(0.07, 0.016, 6, 12, Math.PI * 1.2), bladeCol, mat(0, 0.05, -0.12 - sp.L, 0, RX, -0.4), o); b.add(new B.ConeGeometry(0.018, 0.06, 6), bladeCol, mat(0, 0.12, -0.12 - sp.L + 0.06, RX * 0.4), o); }
  else if (sp.prongs) { const m = [-0.075, 0, 0.075]; for (const y of m) { addBlade(pr, new B.Matrix4().makeTranslation(0, y, y ? 0 : -0.04), th); }
    b.add(new B.BoxGeometry(0.03, 0.17, 0.03), sp.gc ?? bladeCol, mat(0, 0, -0.12 - P), o); }
  else if (sp.type !== 'axe') addBlade(pr, null, th);
  if (sp.axe) { const h = sp.axe === 2 ? 0.26 : 0.17, d = sp.axe === 2 ? 0.3 : 0.2; const pts = []; for (let i = 0; i <= 10; i++) { const a = -0.9 + i / 10 * 1.8; pts.push([P + 0.05 + Math.cos(a) * 0.02 + (1 - Math.abs(a) / 0.9) * 0.01, -0.03 - Math.cos(a) * 0.0]); }
    const ax = [[P - 0.02, -0.02], [P + d * 0.5, -0.02], [P + d, -h * 0.5], [P + d * 0.95, -h], [P + d * 0.6, -h * 0.85], [P + d * 0.25, -h * 0.55], [P - 0.04, -0.06]]; const g = ext(shp(ax), 0.022); g.applyMatrix4(BM(0.022)); b.add(g, bladeCol, null, o);
    if (sp.axe === 2) { const g2 = ext(shp(ax.map(([x, y]) => [x, -y])), 0.022); g2.applyMatrix4(BM(0.022)); b.add(g2, bladeCol, null, o); }
    else { const hk = [[P, 0.02], [P + 0.08, 0.03], [P + 0.11, 0.09], [P + 0.06, 0.05], [P - 0.01, 0.045]]; const g3 = ext(shp(hk), 0.016); g3.applyMatrix4(BM(0.016)); b.add(g3, bladeCol, null, o); }
    const ed = ext(shp([[P + d * 0.97, -h * 0.5], [P + d * 1.02, -h * 0.5], [P + d * 0.98, -h], [P + d * 0.93, -h]]), 0.026); ed.applyMatrix4(BM(0.026)); b.add(ed, edgeCol, null, no); }
  // ---- pole / guard / grip ----
  if (sp.pole) { b.add(new B.CylinderGeometry(0.02, 0.023, P + hl + 0.04, 8), sp.grc ?? 0x6a4a2a, mat(0, 0, (hl - 0.12 - P) / 2 - 0.02, RX), o); b.add(new B.CylinderGeometry(0.026, 0.026, 0.05, 8), sp.gc ?? 0x8a8a90, mat(0, 0, hl, RX), no);
    if (sp.rings) for (let i = 0; i < 4; i++) b.add(new B.CylinderGeometry(0.026, 0.026, 0.02, 8), sp.rings, mat(0, 0, -0.08 - i * 0.18, RX), no);
    if (sp.g === 'round') b.add(new B.CylinderGeometry(0.05, 0.05, 0.016, 10), sp.gc ?? 0xc9a23a, mat(0, 0, -0.12 - P + 0.01, RX), o); b.add(new B.CylinderGeometry(0.03, 0.026, 0.06, 8), sp.gc ?? 0x8a8a90, mat(0, 0, -0.1 - P, RX), no); }
  else if (!sp.claws && !sp.scissors) {
    const gc = sp.gc ?? 0xc9a23a; const gs = guardShape(sp);
    if (gs) { const g = new B.ExtrudeGeometry(shp(gs), { depth: 0.016, bevelEnabled: false }); g.translate(0, 0, -0.008); b.add(g, gc, mat(0, 0, -0.1), o); }
    if (sp.g === 'bar' || sp.g === 'cup' && sp.bar || sp.g === 'knuckle') { const R = (sp.gr || 6) / 100; b.add(new B.BoxGeometry(0.03, R * 2 + 0.02, 0.03), gc, mat(0, 0, -0.1), o);
      if (sp.x === 'cross' || sp.type === 'great') for (const sg of [1, -1]) b.add(new B.SphereGeometry(0.03, 8, 6), gc, mat(0, sg * (R + 0.02), -0.1), no); }
    if (sp.g === 'cup') b.add(new B.SphereGeometry((sp.gr || 5) / 100, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.42), gc, mat(0, 0, -0.07, -RX), o);
    if (sp.g === 'knuckle' || sp.x === 'basket') b.add(new B.TorusGeometry(hl * 0.55, 0.008, 4, 14, Math.PI), gc, mat(0, -0.045, -0.1 + hl * 0.5, 0, RX, RX), o);
    if (sp.x === 'basket') for (const r of [-0.5, 0.5]) b.add(new B.TorusGeometry(hl * 0.5, 0.006, 4, 12, Math.PI), gc, mat(r * 0.03, -0.04, -0.1 + hl * 0.48, 0, RX + r * 0.5, RX), no);
    if (sp.x === 'cross' && sp.type === 'great') { b.add(new B.BoxGeometry(0.035, 0.07, 0.07), gc, mat(0, 0, -0.06), o); b.add(new B.BoxGeometry(0.04, 0.03, 0.03), 0x3aff8a, mat(0, 0, -0.1), no); }
    if (sp.hab) b.add(new B.BoxGeometry(0.016, sp.w * 1.1, 0.04), 0xd8c070, mat(0, 0, -0.13), no);
    // grip
    const gl = hl; b.add(new B.CylinderGeometry(0.021, 0.024, gl, 8), sp.wr ?? sp.grc ?? 0x1a1a2a, mat(0, 0, -0.09 + gl / 2, RX), o);
    if (sp.wrap) { const n = Math.round(gl / 0.045); const dc = sp.wd ?? (sp.wr != null ? sp.grc : 0xe8e0c8); for (let i = 0; i < n; i++) b.add(new B.BoxGeometry(0.03, 0.03, 0.012), dc, mat(0, 0, -0.065 + (i + 0.5) * gl / n, 0, 0, Math.PI / 4), no); }
    if (sp.ridges) for (let i = 0; i < 5; i++) b.add(new B.TorusGeometry(0.023, 0.004, 4, 10), sp.wr ?? 0x2a2a2a, mat(0, 0, -0.06 + i * gl / 5.5), no);
    if (sp.x === 'stripe') for (let i = 0; i < 3; i++) b.add(new B.CylinderGeometry(0.025, 0.025, 0.02, 8), 0xe03030, mat(0, 0, -0.07 + i * 0.045, RX), no);
    // pommel
    const pz = -0.09 + gl + 0.012;
    if (sp.cane) { b.add(new B.TorusGeometry(0.05, 0.019, 6, 10, Math.PI), sp.pm ?? sp.grc, mat(0, 0.05, pz, 0, RX, 0), o); }
    else if (sp.x === 'skull') b.add(new B.SphereGeometry(0.036, 8, 6), sp.pm ?? 0xf0f0e0, mat(0, 0, pz + 0.02, 0, 0, 0, 1, 1.1, 1), o);
    else if (sp.pmb || sp.x === 'cross') b.add(new B.SphereGeometry(sp.type === 'great' ? 0.04 : 0.03, 8, 6), sp.pm ?? sp.gc ?? 0xc9a23a, mat(0, 0, pz + 0.01), o);
    else b.add(new B.CylinderGeometry(0.026, 0.026, 0.022, 8), sp.pm ?? sp.gc ?? 0xc9a23a, mat(0, 0, pz, RX), o);
    if (sp.x === 'tassel') { b.add(new B.CylinderGeometry(0.004, 0.004, 0.1, 4), sp.xc, mat(0, -0.03, pz + 0.04, 0.6), no); b.add(new B.SphereGeometry(0.018, 6, 4), sp.xc, mat(0, -0.06, pz + 0.08), no); }
    if (sp.x === 'face') { for (const sg of [1, -1]) b.add(new B.SphereGeometry(0.014, 6, 4), 0x1a1a1a, mat(0, 0.02 + sg * 0.0, -0.3 + sg * 0.035, 0, 0, 0, 1.4, 1, 1), no); b.add(new B.BoxGeometry(0.022, 0.008, 0.06), 0xc81e1e, mat(0, -0.012, -0.3), no); }
    if (sp.x === 'rose') b.add(new B.SphereGeometry(0.03, 8, 6), 0xd8203a, mat(0, 0, -0.07), no);
    if (sp.x === 'gryph') for (const sg of [1, -1]) b.add(new B.ConeGeometry(0.02, 0.07, 4), sp.gc, mat(0, sg * 0.07, -0.08, sg * -1.2), no); }
  const G = { fill: b.geos(), glow: gb.glow.length ? mergeAll(gb.glow) : null, ice: gb.ice.length ? mergeAll(gb.ice) : null, len: P + sp.L, aura: null };
  if (sp.aura && !sp.claws) { const a = ext(shp(pr.body), th * 4); a.applyMatrix4(new B.Matrix4().makeScale(1, 1.35, 1.04).multiply(BM(th * 4))); G.aura = a; }
  GEO.set(key, G); return G; }
function mergeAll(list) { const out = []; for (const g of list) { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (k !== 'position' && k !== 'normal') n.deleteAttribute(k); out.push(n); } return out.length === 1 ? out[0] : mergeG(out); }
function mergeG(gs) { let n = 0; for (const g of gs) n += g.attributes.position.count; const p = new Float32Array(n * 3), nn = new Float32Array(n * 3); let o = 0; for (const g of gs) { p.set(g.attributes.position.array, o * 3); if (g.attributes.normal) nn.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; } const r = new B.BufferGeometry(); r.setAttribute('position', new B.BufferAttribute(p, 3)); r.setAttribute('normal', new B.BufferAttribute(nn, 3)); return r; }
// Group in the view-model sword frame (grip at origin, blade toward -z, edge toward -y). material: the caller's vertex-colour toon material.
export function buildSword(id, t2, material, sub, auraCol) { const sp = lookOf(id, t2); if (!sp) return null; if (sub) sp.sub = sub; if (auraCol) { sp.aura = auraCol; sp.t2 = 1; sp.sub = (sp.sub || '') + 'a' + auraCol; } const G = geoFor(sp); const grp = new B.Group();
  if (G.fill.fill) { const m = new B.Mesh(G.fill.fill, material); m.userData.shared = true; grp.add(m); }
  if (G.fill.line) { const m = new B.Mesh(G.fill.line, OUT()); m.userData.isOutline = true; m.userData.shared = true; grp.add(m); }
  if (G.ice) { const m = new B.Mesh(G.ice, MATS['ice' + (sp.b || 0)] || (MATS['ice' + (sp.b || 0)] = new B.MeshToonMaterial({ color: sp.b, transparent: true, opacity: 0.62, emissive: sp.b, emissiveIntensity: 0.35 }))); m.userData.shared = true; grp.add(m); }
  if (G.glow) { const m = new B.Mesh(G.glow, basicMat(sp.gl, sp.glA ?? 0.55, true)); m.userData.shared = true; m.renderOrder = 2; grp.add(m); }
  if (G.aura) { const m = new B.Mesh(G.aura, auraMat(sp.aura)); m.userData.shared = true; m.renderOrder = 3; grp.add(m); }
  grp.userData.len = G.len; grp.userData.look = sp; return grp; }
const OUT = () => OUTLINE_MAT;
// Sheath (saya) with the hilt sticking out (for the hip when not drawn) or empty (when drawn). Same frame as buildSword.
export function buildSheath(id, t2, material, withHilt) { const sp = lookOf(id, t2); if (!sp || sp.pole || sp.claws || sp.scissors || sp.rod || sp.whip || sp.hook || sp.prongs) return null; const key = 'sheath:' + id + (withHilt ? 'h' : '') + (t2 ? '*' : '');
  let G = GEO.get(key); if (!G) { const b = new Builder(); const pr = profile({ ...sp, w: sp.w * 1.35 + 0.012, wt: sp.wt * 1.35 + 0.012, tip: sp.tip === 'square' ? 'square' : 'round', hm: 'none', teethS: 0, fu: 0 }); const g = ext(shp(pr.body), 0.03); g.applyMatrix4(BM(0.03)); b.add(g, sp.sh ?? 0x2a1a10, null, { ot: 0.006 });
    b.add(new B.BoxGeometry(0.034, sp.w * 1.5 + 0.02, 0.03), 0xd8c070, mat(0, 0, -0.13), { outline: false }); b.add(new B.BoxGeometry(0.034, sp.wt * 1.4 + 0.016, 0.03), 0xd8c070, mat(0, pr.c(0.97), -0.12 - (sp.P || 0) - sp.L * 0.97), { outline: false });
    G = { fill: b.geos() }; GEO.set(key, G); }
  const grp = new B.Group(); grp.add(new B.Mesh(G.fill.fill, material)); if (G.fill.line) { const m = new B.Mesh(G.fill.line, OUT()); m.userData.isOutline = true; grp.add(m); } grp.traverse(o => { o.userData.shared = true; });
  if (withHilt) { const h = buildSword(id, t2, material); if (h) { h.scale.setScalar(1); grp.add(h); h.children.forEach(m => { if (m.material && m.material.blending === B.AdditiveBlending) m.visible = false; }); } }
  return grp; }
// ---------- 2D icon ----------
const ICON = {}; const hx = c => '#' + ((c ?? 0) >>> 0).toString(16).padStart(6, '0');
export function swordIcon(id, t2, size = 84) { const k = id + (t2 ? '*' : '') + size; if (ICON[k]) return ICON[k]; const sp = lookOf(id, t2); if (!sp || typeof document === 'undefined') return '';
  const cv = document.createElement('canvas'); cv.width = cv.height = size; const x = cv.getContext('2d');
  if (id === 'sanbon') { SANBON.forEach((sid, i) => { x.save(); x.translate(size / 2, size / 2); x.rotate([0.42, -0.42, 0][i] + (i === 2 ? Math.PI / 2 : 0)); x.translate(-size / 2, -size / 2); drawIcon(x, lookOf(sid), size * 0.96, t2 && T2L.sanbon ? T2L.sanbon.a : null); x.restore(); }); }
  else drawIcon(x, sp, size, null);
  return (ICON[k] = cv.toDataURL()); }
function drawIcon(x, sp, size, auraC) { if (auraC) sp = { ...sp, aura: auraC }; const pr = profile(sp); const P = sp.P || 0, hl = sp.hl || 0.24; const tot = P + sp.L + hl + (sp.hook ? 0.18 : 0.1);
  const S = size * 0.97 / tot, YK = sp.pole || sp.type === 'great' || sp.type === 'cleaver' || sp.type === 'saw' ? 1.2 : 1.55; x.save(); x.translate(size * 0.15, size * 0.85); x.rotate(-Math.PI / 4); x.scale(S, -S * YK); x.translate(hl + 0.05, 0); x.lineJoin = 'round';
  const poly = (pts, fill, stroke, lw = 0.012) => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.lineWidth = lw; x.strokeStyle = stroke; x.stroke(); } };
  const glowC = sp.aura ?? sp.gl; if (glowC != null) { x.shadowColor = hx(glowC); x.shadowBlur = size * (sp.aura ? 0.22 : 0.14); }
  const drawBlade = (dy, rot) => { x.save(); if (rot) x.rotate(rot); x.translate(0, dy || 0);
    if (sp.whip) { x.lineWidth = sp.w; x.strokeStyle = hx(sp.b); x.beginPath(); for (let i = 0; i <= 20; i++) { const u = i / 20; const px = u * sp.L, py = Math.sin(u * 9) * 0.04 * u; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); x.restore(); return; }
    if (sp.rod) { poly([[0, -0.02], [sp.L, -0.02], [sp.L + 0.03, 0], [sp.L, 0.02], [0, 0.02]], hx(sp.b), '#000a'); poly([[0.03, -0.01], [0.09, -0.09], [0.11, -0.08], [0.06, -0.01]], hx(sp.b), '#000a'); x.restore(); return; }
    poly(pr.body, sp.ice ? hx(sp.b) + 'cc' : hx(sp.b), '#0b0b10'); x.shadowBlur = 0; for (const bd of pr.bands) poly(bd, hx(sp.e ?? 0xffffff)); for (const t of pr.teeth) poly(t, hx(sp.e ?? 0xffffff), '#0b0b10', 0.006); if (pr.fuller) poly(pr.fuller, '#0006');
    if (sp.hook) { x.lineWidth = 0.035; x.strokeStyle = hx(sp.b); x.beginPath(); x.arc(sp.L + 0.02, 0.06, 0.07, -Math.PI * 0.6, Math.PI * 0.75); x.stroke(); }
    x.restore(); };
  if (sp.x === 'twin') { x.save(); x.globalAlpha = 0.85; x.rotate(0.35); x.translate(0.06, 0.05); drawBlade(); x.restore(); }
  if (sp.claws) for (let i = 0; i < 3; i++) drawBlade((i - 1) * 0.045, (i - 1) * 0.08); else if (sp.scissors) { drawBlade(0, 0.13); drawBlade(0, -0.13); } else if (sp.prongs) { for (const dy of [-0.07, 0, 0.07]) drawBlade(dy); poly([[P - 0.01, -0.09], [P + 0.02, -0.09], [P + 0.02, 0.09], [P - 0.01, 0.09]], hx(sp.gc ?? sp.b), '#000a'); } else if (sp.type !== 'axe') drawBlade();
  if (sp.axe) { const h = sp.axe === 2 ? 0.26 : 0.17, d = sp.axe === 2 ? 0.3 : 0.2; const ax = [[P - 0.02, -0.02], [P + d * 0.5, -0.02], [P + d, -h * 0.5], [P + d * 0.95, -h], [P + d * 0.6, -h * 0.85], [P + d * 0.25, -h * 0.55], [P - 0.04, -0.06]]; poly(ax, hx(sp.b), '#0b0b10'); if (sp.axe === 2) poly(ax.map(([a, b]) => [a, -b]), hx(sp.b), '#0b0b10'); }
  x.shadowBlur = 0;
  if (sp.pole) { poly([[-hl, -0.022], [P + 0.01, -0.02], [P + 0.01, 0.02], [-hl, 0.022]], hx(sp.grc ?? 0x6a4a2a), '#0b0b10'); if (sp.rings) for (let i = 0; i < 4; i++) poly([[-0.02 + i * 0.18, -0.026], [0 + i * 0.18, -0.026], [0 + i * 0.18, 0.026], [-0.02 + i * 0.18, 0.026]], hx(sp.rings)); }
  else if (sp.scissors) { x.lineWidth = 0.02; x.strokeStyle = hx(sp.grc); for (const sg of [1, -1]) { x.beginPath(); x.arc(-0.09, sg * 0.05, 0.05, 0, Math.PI * 2); x.stroke(); } }
  else if (sp.claws) poly([[-0.14, -0.06], [0.02, -0.06], [0.02, 0.06], [-0.14, 0.06]], hx(sp.grc), '#0b0b10');
  else { // grip, wrap diamonds, guard (3/4 view), pommel
    poly([[-hl, -0.024], [0, -0.022], [0, 0.022], [-hl, 0.024]], hx(sp.wr ?? sp.grc ?? 0x1a1a2a), '#0b0b10');
    if (sp.wrap) { const n = Math.round(hl / 0.045); x.fillStyle = hx(sp.wd ?? (sp.wr != null ? sp.grc : 0xe8e0c8)); for (let i = 0; i < n; i++) { const c = -hl + (i + 0.5) * hl / n; x.beginPath(); x.moveTo(c - 0.016, 0); x.lineTo(c, 0.018); x.lineTo(c + 0.016, 0); x.lineTo(c, -0.018); x.fill(); } }
    if (sp.ridges) { x.strokeStyle = '#0006'; x.lineWidth = 0.006; for (let i = 1; i < 5; i++) { const c = -hl * i / 5; x.beginPath(); x.moveTo(c, -0.022); x.lineTo(c, 0.022); x.stroke(); } }
    const gc = hx(sp.gc ?? 0xc9a23a); const gs = guardShape(sp); if (gs) poly(gs.map(([a, b]) => [a * 0.35 - 0.005, b]), gc, '#0b0b10');
    const R = (sp.gr || 6) / 100; if (sp.g === 'bar' || sp.g === 'knuckle' || sp.bar) { poly([[-0.018, -R - 0.01], [0.018, -R - 0.01], [0.018, R + 0.01], [-0.018, R + 0.01]], gc, '#0b0b10'); if (sp.x === 'cross' || sp.type === 'great') for (const sg of [1, -1]) { x.beginPath(); x.arc(0, sg * (R + 0.02), 0.03, 0, 7); x.fillStyle = gc; x.fill(); } }
    if (sp.g === 'cup') { x.beginPath(); x.ellipse(-0.01, 0, 0.03, R, 0, -RX, RX); x.fillStyle = gc; x.fill(); x.strokeStyle = '#0b0b10'; x.lineWidth = 0.01; x.stroke(); }
    if (sp.g === 'knuckle' || sp.x === 'basket') { x.strokeStyle = gc; x.lineWidth = 0.014; x.beginPath(); x.moveTo(0, -R); x.quadraticCurveTo(-hl * 0.5, -R - 0.06, -hl, -0.02); x.stroke(); }
    if (sp.cane) { x.strokeStyle = hx(sp.pm ?? sp.grc); x.lineWidth = 0.036; x.beginPath(); x.arc(-hl, 0.05, 0.05, -RX, RX, true); x.stroke(); }
    else { x.beginPath(); x.arc(-hl - 0.008, 0, sp.x === 'skull' || sp.pmb ? 0.034 : 0.026, 0, 7); x.fillStyle = hx(sp.pm ?? sp.gc ?? 0xc9a23a); x.fill(); x.strokeStyle = '#0b0b10'; x.lineWidth = 0.008; x.stroke(); }
    if (sp.x === 'tassel') { x.strokeStyle = hx(sp.xc); x.lineWidth = 0.01; x.beginPath(); x.moveTo(-hl, 0); x.lineTo(-hl - 0.05, -0.07); x.stroke(); x.beginPath(); x.arc(-hl - 0.055, -0.085, 0.018, 0, 7); x.fillStyle = hx(sp.xc); x.fill(); }
    if (sp.x === 'face') { x.fillStyle = '#111'; for (const sg of [1, -1]) { x.beginPath(); x.arc(0.18 + sg * 0.03, 0.02, 0.012, 0, 7); x.fill(); } x.fillStyle = '#c81e1e'; x.fillRect(0.16, -0.02, 0.05, 0.01); }
    if (sp.x === 'rose') { x.beginPath(); x.arc(0.02, 0, 0.026, 0, 7); x.fillStyle = '#d8203a'; x.fill(); } }
  x.restore(); }
