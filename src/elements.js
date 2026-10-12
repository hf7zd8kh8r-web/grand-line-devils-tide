// Element palette per fruit / fighting style: drives VFX colours/particles and SFX flavour.
const EL = {
  fire: { core: 0xfff2b0, glow: 0xff6a1a, spark: 0xffb030, rise: true },
  magma: { core: 0xffe08a, glow: 0xff3a0a, spark: 0xff7a1a, heavy: true },
  ice: { core: 0xffffff, glow: 0x7ad8ff, spark: 0xd8f6ff, shards: true },
  light: { core: 0xffffff, glow: 0xfff07a, spark: 0xfffbd0, flash: true },
  lightning: { core: 0xffffff, glow: 0x6ab8ff, spark: 0xcfe8ff, zap: true },
  dark: { core: 0x8a5aff, glow: 0x2a0a4a, spark: 0xb08aff, implode: true },
  rubber: { core: 0xffffff, glow: 0xff7ab8, spark: 0xffd0e6, rings: true },
  sound: { core: 0xffffff, glow: 0x5affd8, spark: 0xb0fff0, rings: true },
  quake: { core: 0xffffff, glow: 0xd8e8ff, spark: 0xffffff, rings: true, heavy: true },
  poison: { core: 0xe0b0ff, glow: 0x8a2ad8, spark: 0xb05aff },
  sand: { core: 0xfff0c0, glow: 0xd8a85a, spark: 0xe8c890, heavy: true },
  smoke: { core: 0xffffff, glow: 0xb8c0c8, spark: 0xe0e4e8 },
  plant: { core: 0xe0ffd0, glow: 0x4ad84a, spark: 0xffb0d8 },
  beast: { core: 0xffffff, glow: 0xffc070, spark: 0xffe0b0 },
  slash: { core: 0xffffff, glow: 0xbfe0ff, spark: 0xffffff },
  phys: { core: 0xffffff, glow: 0xffd080, spark: 0xfff0c0 },
};
const BY_FRUIT = { mera: 'fire', atsu: 'fire', phoenix: 'fire', magu: 'magma', hie: 'ice', yuki: 'ice', pika: 'light', goro: 'lightning', raijin: 'lightning', thunderbird: 'lightning', yami: 'dark', kage: 'dark', horo: 'dark', gomu: 'rubber', nika: 'rubber', mochi: 'rubber', sound: 'sound', nagi: 'sound', gura: 'quake', doku: 'poison', suna: 'sand', moku: 'smoke', gasu: 'smoke', hana: 'plant', mori: 'plant', seiryu: 'fire', makami: 'ice' };
export function elementOf(fruitId, fallback = 'phys') { const k = BY_FRUIT[fruitId]; if (k) return k; return fallback; }
export function palette(el) { return EL[el] || EL.phys; }
export function elementFromColor(col) { const r = (col >> 16) & 255, g = (col >> 8) & 255, b = col & 255; if (r > 200 && g < 140 && b < 90) return 'fire'; if (b > 200 && r < 170) return 'ice'; if (r > 220 && g > 200 && b < 140) return 'light'; if (r < 140 && g < 100 && b > 120) return 'dark'; return 'phys'; }
