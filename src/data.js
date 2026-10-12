// ---------- Game data ----------
export const RARITY = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Godly', 'Mythical', 'Ultra'];
export const RCOL = ['#d8d8d8', '#5fd16a', '#4aa8ff', '#b46bff', '#ffb02e', '#ffe85a', '#ff4d6d', '#ffffff'];

export const SEAS = [
  { id: 1, name: 'First Sea', sub: 'East Blue · Paradise · Pre-Timeskip', lvl: 1, col: '#2f8fd6' },
  { id: 2, name: 'Second Sea', sub: 'New World Gate · Post-Timeskip', lvl: 120, col: '#7b49c9' },
  { id: 3, name: 'Third Sea', sub: 'Emperor Waters', lvl: 250, col: '#c9314a' },
];
// map coords x,y in 0..100 for the world map; built:true = playable 3D island
export const ISLANDS = [
  { id: 'windmill', name: 'Windmill Village', sea: 1, lvl: 1, x: 8, y: 70, built: true },
  { id: 'shells', name: 'Shells Town', sea: 1, lvl: 8, x: 18, y: 60, built: true },
  { id: 'orange', name: 'Orange Town', sea: 1, lvl: 15, x: 27, y: 72 },
  { id: 'syrup', name: 'Syrup Village', sea: 1, lvl: 22, x: 34, y: 58 },
  { id: 'baratie', name: 'Baratie', sea: 1, lvl: 28, x: 42, y: 70 },
  { id: 'arlong', name: 'Arlong Park', sea: 1, lvl: 35, x: 50, y: 60 },
  { id: 'loguetown', name: 'Loguetown', sea: 1, lvl: 42, x: 57, y: 72 },
  { id: 'whisky', name: 'Whisky Peak', sea: 1, lvl: 50, x: 64, y: 60 },
  { id: 'alabasta', name: 'Alabasta', sea: 1, lvl: 60, x: 70, y: 74 },
  { id: 'skypiea', name: 'Skypiea', sea: 1, lvl: 70, x: 76, y: 52 },
  { id: 'water7', name: 'Water 7', sea: 1, lvl: 80, x: 82, y: 70 },
  { id: 'enies', name: 'Enies Lobby', sea: 1, lvl: 88, x: 88, y: 58 },
  { id: 'thriller', name: 'Thriller Bark', sea: 1, lvl: 95, x: 92, y: 76 },
  { id: 'sabaody', name: 'Sabaody Archipelago', sea: 1, lvl: 100, x: 72, y: 88 },
  { id: 'amazon', name: 'Amazon Lily', sea: 1, lvl: 104, x: 60, y: 88 },
  { id: 'impel', name: 'Impel Down', sea: 1, lvl: 108, x: 48, y: 90 },
  { id: 'marineford', name: 'Marineford', sea: 1, lvl: 114, x: 36, y: 88 },
  { id: 'fishman', name: 'Fish-Man Island', sea: 2, lvl: 120, x: 20, y: 40 },
  { id: 'punk', name: 'Punk Hazard', sea: 2, lvl: 140, x: 34, y: 33 },
  { id: 'dressrosa', name: 'Dressrosa', sea: 2, lvl: 165, x: 48, y: 42 },
  { id: 'zou', name: 'Zou', sea: 2, lvl: 200, x: 62, y: 34 },
  { id: 'wci', name: 'Whole Cake Island', sea: 3, lvl: 250, x: 70, y: 16 },
  { id: 'wano', name: 'Wano Country', sea: 3, lvl: 300, x: 82, y: 21 },
  { id: 'egghead', name: 'Egghead', sea: 3, lvl: 380, x: 92, y: 12 },
  { id: 'mirro', name: 'Mirro-World', sea: 2, lvl: 150, x: 8, y: 44, secret: 'Bring 3 boss trophies from the Second Sea to Collector Pip' },
  { id: 'laughtale', name: 'Laugh Tale', sea: 3, lvl: 420, x: 97, y: 4, secret: 'Collect 4 Road Poneglyph rubbings (Zou, Whole Cake, Wano, Egghead bosses)' },
];
export const islandById = id => ISLANDS.find(i => i.id === id);

export const RACES = {
  Human: { perk: '+15% XP gain', hp: 1, spd: 1, dmg: 1, xp: 1.15, jump: 1, h: 1.65 },
  'Fish-Man': { perk: '+15% fist damage, swim fast', hp: 1.05, spd: 1, dmg: 1.15, xp: 1, jump: 1, h: 1.75 },
  Mink: { perk: '+12% speed, Electro punches', hp: 1, spd: 1.12, dmg: 1, xp: 1, jump: 1.1, h: 1.6 },
  Skypiean: { perk: '+35% jump height', hp: 0.95, spd: 1.05, dmg: 1, xp: 1, jump: 1.35, h: 1.6 },
  Giant: { perk: '+30% HP, -8% speed, taller', hp: 1.3, spd: 0.92, dmg: 1.08, xp: 1, jump: 1, h: 2.3 },
  Lunarian: { perk: '-20% damage taken, flame aura', hp: 1.05, spd: 1, dmg: 1, xp: 1, jump: 1.15, h: 1.7, def: 0.8 },
};

// Weapons (first 3 playable now; 55-sword list is data for later layers)
export const SWORDS = {
  cutlass: { name: 'Rusty Cutlass', rar: 0, dmg: 14, spd: 1.0, price: 150, col: 0xb9b9b9, len: 0.95, moves: [{ k: 'slash', name: 'Rising Slash', cd: 4 }, { k: 'spin', name: 'Whirlwind', cd: 8 }] },
  marine: { name: 'Marine Saber', rar: 1, dmg: 22, spd: 1.05, price: 1800, col: 0xdfe8ff, len: 1.05, moves: [{ k: 'slash', name: 'Justice Cleave', cd: 4 }, { k: 'spin', name: 'Cyclone Cut', cd: 7 }] },
  wado: { name: 'Wado Ichimonji', rar: 3, dmg: 40, spd: 1.15, price: 0, col: 0xffffff, len: 1.15, quest: true, moves: [{ k: 'slash', name: 'Oni Giri', cd: 4 }, { k: 'spin', name: 'Tatsumaki', cd: 7 }] },
};
export const GUNS = {
  flintlock: { name: 'Flintlock Pistol', rar: 0, dmg: 18, cd: 0.9, price: 200, range: 40 },
  musket: { name: 'Marine Musket', rar: 1, dmg: 32, cd: 1.3, price: 2500, range: 60 },
};
export const ACCESSORIES = {
  strawhat: { name: 'Straw Hat', rar: 1, price: 600, stat: { hp: 40 } },
  bandana: { name: 'Black Bandana', rar: 1, price: 900, stat: { dmg: 0.08 } },
  marinecoat: { name: 'Marine Coat', rar: 2, price: 3500, stat: { hp: 80, def: 0.05 } },
  sandals: { name: 'Swift Sandals', rar: 1, price: 1200, stat: { spd: 0.08 } },
};

// Fruits. moves: key used by fruit move implementations in fruits.js
export const FRUITS = {
  gomu: { name: 'Gum-Gum Fruit', short: 'Gum-Gum', rar: 2, price: 800, col: [0x8a2be2, 0x5d1a9e], pat: 1,
    moves: [{ k: 'pistol', name: 'Gum-Gum Pistol', cd: 2, dmg: 2.2 }, { k: 'gatling', name: 'Gum-Gum Gatling', cd: 7, dmg: 0.6 }, { k: 'bazooka', name: 'Gum-Gum Bazooka', cd: 9, dmg: 4 }] },
  mera: { name: 'Flame-Flame Fruit', short: 'Flame', rar: 4, price: 6000, col: [0xff5a1f, 0xffb21f], pat: 2,
    moves: [{ k: 'firefist', name: 'Fire Fist', cd: 3, dmg: 3 }, { k: 'pillar', name: 'Flame Pillar', cd: 8, dmg: 2.2 }, { k: 'firedash', name: 'Flame Dash', cd: 6, dmg: 2.5 }, { k: 'emperor', name: 'Flame Emperor', cd: 16, dmg: 6 }] },
  pika: { name: 'Light-Light Fruit', short: 'Light', rar: 5, price: 20000, col: [0xfff27a, 0xffd21a], pat: 3,
    moves: [{ k: 'beads', name: 'Jewel Barrage', cd: 4, dmg: 0.9 }, { k: 'lightkick', name: 'Light-Speed Kick', cd: 5, dmg: 3.2 }, { k: 'lightsword', name: 'Sky Cloud Sword', cd: 7, dmg: 2.8 }, { k: 'mirror', name: 'Mirror Flash', cd: 6, dmg: 1.5 }],
    special: { k: 'lightrain', name: 'Heavenly Light Rain', dmg: 9 } },
};
// Ultra fruits (cover start button + future endgame)
export const ULTRA = [
  { id: 'nika', name: 'Human-Human: Model Nika Fruit', title: 'MODEL: NIKA', col: [0xffffff, 0xf2e6ff], glow: '#ffffff', fx: 'nika' },
  { id: 'seiryu', name: 'Fish-Fish: Model Azure Dragon Fruit', title: 'MODEL: AZURE DRAGON', col: [0x2a6cff, 0x7a3cff], glow: '#4a8bff', fx: 'dragon' },
  { id: 'sound', name: 'Sound-Sound Fruit', title: 'RESONANCE', col: [0x18e0c8, 0x2a2a8a], glow: '#3cf5e0', fx: 'sound' },
  { id: 'makami', name: 'Dog-Dog: Model Okuchi no Makami Fruit', title: 'MODEL: OKUCHI NO MAKAMI', col: [0xcfefff, 0x6fb6ff], glow: '#bfe8ff', fx: 'wolf' },
];

// Enemy archetypes
export const ENEMIES = {
  bandit: { name: 'Bandit', hp: 40, dmg: 5, spd: 2.6, reach: 1.9, cd: 1.6, xp: 14, ber: [12, 26], look: 'bandit', drop: 'Bandit Bandana' },
  thug: { name: 'Bandit Bruiser', hp: 80, dmg: 8, spd: 2.3, reach: 2.1, cd: 2.0, xp: 28, ber: [25, 45], look: 'thug', drop: 'Bandit Bandana' },
  marine: { name: 'Marine', hp: 110, dmg: 13, spd: 3.0, reach: 2.2, cd: 1.5, xp: 45, ber: [45, 80], look: 'marine', drop: 'Marine Badge' },
  rifle: { name: 'Marine Rifleman', hp: 90, dmg: 12, spd: 2.6, reach: 22, cd: 2.6, xp: 50, ber: [50, 90], look: 'marine', ranged: true, drop: 'Marine Badge' },
  higuma: { name: 'Higuma', title: 'Mountain Bandit Leader', bounty: '8,000,000', hp: 360, dmg: 12, spd: 3.1, reach: 2.4, cd: 1.4, xp: 400, ber: [500, 600], look: 'higuma', boss: true, taunt: "Heh. A brat thinks he can beat Higuma? I'll cut you down like the rest!", drop: "Higuma's Sabre", scale: 1.25 },
  morgan: { name: 'Axe-Hand Morgan', title: 'Marine Captain of Shells Town', bounty: 'Marine Captain', hp: 800, dmg: 28, spd: 3.0, reach: 3.0, cd: 1.6, xp: 1500, ber: [2500, 3000], look: 'morgan', boss: true, taunt: 'I am Captain Morgan! My rank is everything, and you are nothing! KNEEL!', drop: 'Axe Fragment', scale: 1.45 },
};

export const QUESTS = {
  windmill: [
    { id: 'w1', giver: 'Makino', lvl: 1, text: 'Defeat 4 Bandits', type: 'kill', target: 'bandit', n: 4, xp: 80, ber: 120 },
    { id: 'w2', giver: 'Makino', lvl: 3, text: 'Defeat 3 Bandit Bruisers', type: 'kill', target: 'thug', n: 3, xp: 180, ber: 260 },
    { id: 'w4', giver: 'Mayor Woop', lvl: 2, text: 'Find 4 lost windmill cogs', type: 'gather', item: 'Windmill Cog', col: 0xd0a040, n: 4, xp: 140, ber: 200 },
    { id: 'w5', giver: 'Makino', lvl: 2, text: 'Catch 2 fish for the Party\'s Bar', type: 'fish', n: 2, xp: 120, ber: 180 },
    { id: 'w6', giver: 'Makino', lvl: 4, text: 'Ambush! Defeat 3 Bandits in 45s', type: 'kill', target: 'bandit', n: 3, time: 45, xp: 220, ber: 300 },
    { id: 'w7', giver: 'Mayor Woop', lvl: 4, text: 'Deliver the Mayor\'s letter to Shipwright Dan', type: 'talk', target: 'Shipwright Dan', n: 1, xp: 160, ber: 250 },
    { id: 'w3', giver: 'Mayor Woop', lvl: 5, text: 'Defeat Higuma on the hill', type: 'kill', target: 'higuma', n: 1, xp: 500, ber: 700 },
  ],
  shells: [
    { id: 's1', giver: 'Rika', lvl: 8, text: 'Defeat 6 Marines', type: 'kill', target: 'marine', n: 6, xp: 600, ber: 900 },
    { id: 's2', giver: 'Rika', lvl: 10, text: 'Defeat 4 Marine Riflemen', type: 'kill', target: 'rifle', n: 4, xp: 800, ber: 1200 },
    { id: 's4', giver: 'Rika', lvl: 8, text: 'Find Rika\'s 4 dropped rice balls', type: 'gather', item: 'Rice Ball', col: 0xffffff, n: 4, xp: 500, ber: 700 },
    { id: 's5', giver: 'Coby', lvl: 9, text: 'Ambush! Defeat 4 Marines in 60s', type: 'kill', target: 'marine', n: 4, time: 60, xp: 700, ber: 1000 },
    { id: 's6', giver: 'Coby', lvl: 11, text: 'Collect 3 Marine Badges from Marines', type: 'mat', target: 'Marine Badge', n: 3, xp: 900, ber: 1300 },
    { id: 's3', giver: 'Coby', lvl: 12, text: 'Defeat Axe-Hand Morgan', type: 'kill', target: 'morgan', n: 1, xp: 2500, ber: 4000, reward: 'wado_hint' },
  ],
};

export const xpNeed = l => Math.round(60 + l * 45 + l * l * 4);

// ---------- Expanded catalogue (generated entries) ----------
// moves: [kind, name] kinds: proj aoe dash beam rain barrage blink wave orbit
const FRP = [350, 1200, 4000, 12000, 45000, 150000, 600000, 3500000];
const F = (id, name, rar, c1, c2, mv, special) => { FRUITS[id] = { name, short: name.replace(/ Fruit$/, '').replace(/-[A-Z][a-z]+$/, '').replace(/^Bird-Bird: /, ''), rar, price: FRP[rar], col: [c1, c2], pat: 1 + (rar % 3), moves: mv.map(([k, n], i) => ({ k: 'g:' + k, name: n, cd: [3, 6, 8, 12][i], dmg: [2.2, 2.6, 3.2, 4.2][i] })), ...(special ? { special: { k: 'g:special', name: special, dmg: 9 + rar } } : {}) }; };
F('sube', 'Smooth-Smooth Fruit', 0, 0xf0d0e0, 0xffffff, [['dash', 'Slippery Slide'], ['wave', 'Smooth Sweep'], ['proj', 'Slick Shot']]);
F('bane', 'Spring-Spring Fruit', 0, 0xa0a0b0, 0xe0e0f0, [['dash', 'Spring Hopper'], ['proj', 'Spring Snipe'], ['aoe', 'Spring Stamp']]);
F('toge', 'Spike-Spike Fruit', 0, 0x9a6ab0, 0x5a3a7a, [['barrage', 'Spike Shots'], ['aoe', 'Sea Urchin'], ['dash', 'Spike Rush']]);
F('kilo', 'Kilo-Kilo Fruit', 0, 0xffe0a0, 0xd0a060, [['aoe', '10,000 Kilo Press'], ['dash', 'Kilo Drop'], ['wave', 'Heavy Stomp']]);
F('bara', 'Chop-Chop Fruit', 0, 0xff8080, 0xe04040, [['barrage', 'Chop-Chop Cannon'], ['orbit', 'Chop-Chop Festival'], ['proj', 'Buggy Ball']]);
F('bomu', 'Bomb-Bomb Fruit', 0, 0xff9a3a, 0x8a3a1a, [['proj', 'Nose Fancy Cannon'], ['aoe', 'Breeze Breath Bomb'], ['rain', 'Kick Bomb']]);
F('bari', 'Barrier-Barrier Fruit', 1, 0x9ad4ff, 0xffffff, [['wave', 'Barrier Bash'], ['aoe', 'Barrier Dome'], ['proj', 'Barrier Crash']]);
F('horo', 'Hollow-Hollow Fruit', 1, 0xf4c0f0, 0xffffff, [['barrage', 'Ghost Rap'], ['orbit', 'Negative Hollow'], ['proj', 'Tokuhollow']]);
F('mane', 'Clone-Clone Fruit', 1, 0xffb0d0, 0x8a3a6a, [['dash', 'Mimic Rush'], ['wave', 'Swan Kick'], ['barrage', 'Okama Punches']]);
F('awa', 'Bubble-Bubble Fruit', 1, 0xc0f0ff, 0x6ab0ff, [['barrage', 'Bubble Shot'], ['aoe', 'Golden Bubble'], ['orbit', 'Clean Bubbles']]);
F('doru', 'Wax-Wax Fruit', 1, 0xf8f0d0, 0xc0a060, [['proj', 'Candle Arrows'], ['aoe', 'Candle Lock'], ['wave', 'Candle Wall']]);
F('noro', 'Slow-Slow Fruit', 1, 0xc0a0ff, 0x6a4aff, [['beam', 'Slow Beam'], ['barrage', 'Slow Shots'], ['aoe', 'Slow Field']]);
F('hana', 'Flower-Flower Fruit', 2, 0xff90c0, 0x8a2a5a, [['wave', 'Hundred Flowers'], ['aoe', 'Clutch'], ['rain', 'Gigantesco Mano']]);
F('kage', 'Shadow-Shadow Fruit', 2, 0x6a3a8a, 0x1a0a2a, [['barrage', 'Brick Bat'], ['blink', 'Shadow Swap'], ['aoe', 'Shadows Asgard']]);
F('doku', 'Venom-Venom Fruit', 2, 0x9a3aff, 0x3a0a6a, [['proj', 'Hydra'], ['rain', 'Venom Rain'], ['aoe', 'Venom Demon']]);
F('mero', 'Love-Love Fruit', 2, 0xff5ab0, 0xffd0f0, [['beam', 'Mero Mero Mellow'], ['barrage', 'Slave Arrow'], ['dash', 'Perfume Femur']]);
F('pero', 'Candy-Candy Fruit', 2, 0xff9ad0, 0x7ad0ff, [['barrage', 'Candy Bullets'], ['wave', 'Candy Wave'], ['aoe', 'Candy Man']]);
F('moku', 'Smoke-Smoke Fruit', 3, 0xe8e8e8, 0x9a9a9a, [['beam', 'White Blow'], ['dash', 'White Launcher'], ['aoe', 'White Out'], ['rain', 'White Vine Gun']]);
F('suna', 'Sand-Sand Fruit', 3, 0xe8c890, 0xa08050, [['wave', 'Desert Spada'], ['aoe', 'Sables'], ['proj', 'Desert Girasole'], ['rain', 'Ground Death']]);
F('yuki', 'Snow-Snow Fruit', 3, 0xffffff, 0xa0d0ff, [['barrage', 'Snow Bullets'], ['aoe', 'Gelato Whiteout'], ['wave', 'Snow Rabbit'], ['rain', 'Kamakura']]);
F('gasu', 'Gas-Gas Fruit', 3, 0xc0a0ff, 0xff9a3a, [['proj', 'Gastanet'], ['aoe', 'Gas Robe'], ['beam', 'Gas Blast'], ['rain', 'Shinokuni']]);
F('numa', 'Swamp-Swamp Fruit', 3, 0x5a4a2a, 0x2a2a1a, [['wave', 'Swamp Grip'], ['aoe', 'Bottomless Swamp'], ['proj', 'Mud Shot'], ['dash', 'Swamp Glide']]);
F('mochi', 'Mochi-Mochi Fruit', 3, 0xfff0e0, 0xe0c0a0, [['barrage', 'Power Mochi'], ['dash', 'Zan Giri Mochi'], ['wave', 'Mochi Tsuki'], ['orbit', 'Flowing Mochi']]);
F('hie', 'Ice-Ice Fruit', 4, 0xbfe8ff, 0x5ab0ff, [['barrage', 'Ice Saber'], ['wave', 'Ice Age'], ['proj', 'Partisan'], ['rain', 'Ice Time Capsule']]);
F('ito', 'String-String Fruit', 4, 0xff6a8a, 0xffffff, [['beam', 'Overheat'], ['wave', 'Five Color Strings'], ['barrage', 'Bullet String'], ['rain', 'Birdcage']]);
F('ope', 'Op-Op Fruit', 4, 0x7ad0ff, 0xffe060, [['blink', 'Shambles'], ['wave', 'Room Slash'], ['beam', 'Gamma Knife'], ['aoe', 'Counter Shock']]);
F('nikyu', 'Paw-Paw Fruit', 4, 0xf0d0b0, 0xa06a4a, [['barrage', 'Paw Cannons'], ['blink', 'Ursa Teleport'], ['proj', 'Ursus Shock'], ['wave', 'Pad Repel']]);
F('yami', 'Dark-Dark Fruit', 4, 0x2a1a3a, 0x8a3aff, [['orbit', 'Black Hole'], ['aoe', 'Liberation'], ['wave', 'Black Vortex'], ['beam', 'Dark Matter']]);
F('goro', 'Rumble-Rumble Fruit', 5, 0x9ad4ff, 0x2a4aff, [['beam', 'El Thor'], ['barrage', 'Sango'], ['blink', 'Mamaragan'], ['rain', 'Kiten']], 'Raigo: Thunder Cloud');
F('magu', 'Magma-Magma Fruit', 5, 0xff4a1a, 0x5a1a0a, [['proj', 'Great Eruption'], ['rain', 'Meteor Volcano'], ['aoe', 'Magma Pillar'], ['beam', 'Dai Funka']], 'Ryusei Kazan: Meteor Storm');
F('gura', 'Quake-Quake Fruit', 5, 0xffffff, 0xe0e0e0, [['wave', 'Quake Punch'], ['aoe', 'Seaquake'], ['beam', 'Air Crack'], ['rain', 'Kabutowari']], 'World Shaker');
F('phoenix', 'Bird-Bird: Model Phoenix Fruit', 5, 0x3ad0ff, 0xffe060, [['dash', 'Phoenix Brand'], ['barrage', 'Blue Flame Shots'], ['aoe', 'Flames of Restoration'], ['wave', 'Blue Bird']], 'Phoenix Rebirth Storm');
F('soru', 'Soul-Soul Fruit', 5, 0xffb0e0, 0x8a3a6a, [['orbit', 'Prometheus'], ['proj', 'Zeus Thunder'], ['aoe', 'Soul Pocus'], ['rain', 'Napoleon Strike']], 'Maser Raid');
F('buddha', 'Human-Human: Model Daibutsu Fruit', 6, 0xffe080, 0xffb020, [['wave', 'Buddha Shockwave'], ['aoe', 'Golden Palm'], ['beam', 'Holy Light'], ['rain', 'Heaven Strike']], 'Daibutsu: Thousand Palms');
F('kitsune', 'Dog-Dog: Model Kyubi no Kitsune Fruit', 6, 0xff7ab0, 0x7a3aff, [['barrage', 'Fox Fire'], ['dash', 'Kitsune Rush'], ['orbit', 'Nine Tails'], ['rain', 'Spirit Rain']], 'Kyubi: Nine-Fold Blaze');
F('orochi', 'Snake-Snake: Model Yamata no Orochi Fruit', 6, 0x6a8a3a, 0x2a3a1a, [['wave', 'Eight Heads'], ['dash', 'Serpent Lunge'], ['proj', 'Venom Spit'], ['aoe', 'Coil Crush']], 'Yamata no Orochi');
F('zushi', 'Gravity-Gravity Fruit', 6, 0x6a3aff, 0x1a0a3a, [['aoe', 'Gravity Blade'], ['rain', 'Meteorite'], ['beam', 'Gravity Ray'], ['orbit', 'Gravity Well']], 'Raging Tiger: Meteor Fall');
// ---- v4: fill every tier to 10 (canon fruits first, a few originals marked ★) ----
F('supa', 'Dice-Dice Fruit', 0, 0xc0c8d0, 0x6a7a8a, [['dash', 'Spider Slash'], ['barrage', 'Atomic Spar'], ['wave', 'Blade Arms']]);
F('ori', 'Bind-Bind Fruit', 0, 0x6a6a7a, 0xc0a060, [['proj', 'Iron Cage'], ['aoe', 'Grasp Prison'], ['wave', 'Bind Lash']]);
F('baku', 'Munch-Munch Fruit', 0, 0x8a6a4a, 0x3a2a1a, [['dash', 'Munch Rush'], ['proj', 'Cannon Burp'], ['aoe', 'Bite Quake']]);
F('beri', 'Berry-Berry Fruit', 0, 0xffd04a, 0xa07a1a, [['barrage', 'Berry Scatter'], ['blink', 'Berry Split'], ['aoe', 'Coin Burst']]);
F('doa', 'Door-Door Fruit', 1, 0xd0a070, 0x6a4a2a, [['blink', 'Air Door'], ['proj', 'Door Slam'], ['wave', 'Open Sesame']]);
F('nagi', 'Calm-Calm Fruit', 1, 0xe0e8f0, 0x9aa8c0, [['aoe', 'Silent Zone'], ['dash', 'Hush Step'], ['proj', 'Mute Shot']]);
F('beta', 'Stick-Stick Fruit', 1, 0x8ad04a, 0x3a6a1a, [['proj', 'Beta Beta Chain'], ['aoe', 'Sticky Floor'], ['wave', 'Mucus Wave']]);
F('sabi', 'Rust-Rust Fruit', 1, 0xc0602a, 0x5a2a10, [['wave', 'Rust Touch'], ['aoe', 'Corrode Ring'], ['barrage', 'Rust Shards']]);
F('atsu', 'Hot-Hot Fruit', 2, 0xff7a3a, 0xc02a1a, [['beam', 'Heat Ray'], ['aoe', 'Oden Boil'], ['dash', 'Hot Rush']]);
F('woshu', 'Wash-Wash Fruit', 2, 0x9ae0ff, 0x3a8ad0, [['wave', 'Wash Wave'], ['aoe', 'Laundry Spin'], ['proj', 'Soap Shot']]);
F('ton', 'Ton-Ton Fruit', 2, 0x8a8a9a, 0x3a3a4a, [['aoe', 'Ton Press'], ['dash', 'Heavy Charge'], ['rain', 'Ton Drop']]);
F('horu', 'Hormone-Hormone Fruit', 2, 0xff9ad0, 0x8a3aa0, [['barrage', 'Hormone Shots'], ['aoe', 'Tension Hormone'], ['dash', 'Death Wink']]);
F('hobi', 'Hobby-Hobby Fruit', 3, 0xffd0a0, 0xe06a8a, [['proj', 'Toy Touch'], ['barrage', 'Toy Soldiers'], ['aoe', 'Contract Seal'], ['wave', 'Toy Wave']]);
F('fuwa', 'Float-Float Fruit', 3, 0xd0f0ff, 0x6ab0e0, [['rain', 'Island Drop'], ['aoe', 'Lion Float'], ['proj', 'Floating Boulder'], ['blink', 'Sky Step']]);
F('jiki', 'Magnet-Magnet Fruit', 3, 0xd04a4a, 0x4a4ad0, [['barrage', 'Punk Gibson'], ['aoe', 'Repel'], ['wave', 'Damned Punk'], ['proj', 'Iron Pull']]);
F('sui', 'Swim-Swim Fruit', 3, 0x5ad0e0, 0x2a6a8a, [['dash', 'Ground Dive'], ['wave', 'Earth Splash'], ['proj', 'Mole Shot'], ['aoe', 'Stone Ripple']]);
F('toki', 'Time-Time Fruit', 4, 0xf0e0a0, 0x6a5aa0, [['blink', 'Time Skip'], ['aoe', 'Time Freeze'], ['beam', 'Era Ray'], ['wave', 'Clock Hand']]);
F('bisu', 'Biscuit-Biscuit Fruit', 4, 0xe8c080, 0x8a5a2a, [['barrage', 'Biscuit Soldiers'], ['wave', 'Pretzel Sword'], ['aoe', 'Hard Biscuit Wall'], ['dash', 'Biscuit Charge']]);
F('mira', 'Mirror-Mirror Fruit', 4, 0xe0f0ff, 0xb07aff, [['blink', 'Mirro-World Step'], ['proj', 'Reflection'], ['orbit', 'Mirror Shards'], ['beam', 'Mirror Flash']]);
F('shiro', 'Castle-Castle Fruit', 4, 0xc0b090, 0x6a5a3a, [['rain', 'Cannon Volley'], ['aoe', 'Fortress'], ['barrage', 'Battlement Shots'], ['wave', 'Drawbridge']]);
F('mori', 'Forest-Forest Fruit', 5, 0x4ac05a, 0x1a5a2a, [['wave', 'Root Strike'], ['rain', 'Wood Rain'], ['aoe', 'Forest Prison'], ['beam', 'Thorn Spear']], 'Green Bull: Forest of Doom');
F('goru', 'Gold-Gold Fruit', 5, 0xffd04a, 0xa07a1a, [['wave', 'Golden Wave'], ['proj', 'Gold Fist'], ['aoe', 'Gold Statue'], ['rain', 'Gilded Rain']], 'Tesoro: Golden Giant');
F('ptera', 'Dragon-Dragon: Model Pteranodon Fruit', 5, 0x8a3a3a, 0xe0a060, [['dash', 'Sky Dive'], ['wave', 'Wing Cutter'], ['barrage', 'Feather Darts'], ['rain', 'Dive Bomb']], 'King: Ancient Firestorm');
F('brachio', 'Dragon-Dragon: Model Brachiosaurus Fruit', 5, 0x8a7a5a, 0x4a3a2a, [['aoe', 'Neck Slam'], ['dash', 'Stampede'], ['wave', 'Tail Sweep'], ['rain', 'Quake Stomp']], 'Queen: Titan Crash');
F('onyudo', 'Human-Human: Model Onyudo Fruit', 6, 0x9a9ab0, 0x3a3a5a, [['aoe', 'Giant Grow'], ['wave', 'Colossus Swing'], ['rain', 'Mountain Fist'], ['beam', 'Giant\'s Glare']], 'Onyudo: Sky-Piercing Monk');
F('pegasus', 'Horse-Horse: Model Pegasus Fruit', 6, 0xffffff, 0x9ad4ff, [['dash', 'Pegasus Charge'], ['rain', 'Star Hooves'], ['wave', 'Wing Gale'], ['orbit', 'Holy Feathers']], 'Pegasus Meteor Fall');
F('kumo', 'Spider-Spider: Model Rosamygale Grauri Fruit', 6, 0x3a2a3a, 0xc02a5a, [['barrage', 'Web Shots'], ['aoe', 'Spider Nest'], ['dash', 'Eight-Leg Rush'], ['wave', 'Silk Slash']], 'Black Maria: Web of Flames');
// (ids kept from earlier originals so old saves still load; now canon fruits)
F('thunderbird', 'Revive-Revive Fruit', 6, 0xe8f0ff, 0x4a2a6a, [['blink', 'Soul Departure'], ['proj', 'Soul Solid: Hanauta Sancho'], ['aoe', 'Song of the Underworld'], ['orbit', 'Frost Soul Requiem']], 'Soul King: Yomi Requiem');
F('raijin', 'Cat-Cat: Model Leopard Fruit', 6, 0xe8b04a, 0x3a2a0a, [['dash', 'Soru Leopard'], ['barrage', 'Leopard Shigan'], ['beam', 'Rokuogan: Awakened'], ['aoe', 'Tempest Kick Storm']], 'Awakened Leopard: Beast Rampage');
F('leviathan', 'Dragon-Dragon: Model Spinosaurus Fruit', 6, 0x3a8a5a, 0x1a2a1a, [['dash', 'Sail-Back Charge'], ['wave', 'Tidal Tail'], ['aoe', 'Primal Roar'], ['rain', 'Ancient Stampede']], 'Primeval Rampage');
// Ultra (exactly 4) - playable fruit versions of the cover fruits
for (const [id, name, c1, c2, mv, sp] of [
  ['nika', 'Human-Human: Model Nika Fruit', 0xffffff, 0xf2e6ff, [['wave', 'Bajrang Gun'], ['dash', 'Dawn Rocket'], ['orbit', 'Gear 5: Toon Force'], ['rain', 'Bajrang Rain']], 'Drums of Liberation'],
  ['seiryu', 'Fish-Fish: Model Azure Dragon Fruit', 0x2a6cff, 0x7a3cff, [['beam', 'Boro Breath'], ['orbit', 'Bolo Breath Storm'], ['dash', 'Dragon Twister'], ['rain', 'Thunder Bagua']], 'Kaifu: Great Dragon'],
  ['sound', 'Sound-Sound Fruit', 0x18e0c8, 0x2a2a8a, [['wave', 'Resonance'], ['barrage', 'Echo Shots'], ['aoe', 'Sound Bomb'], ['beam', 'Sonic Lance']], 'Silent Requiem'],
  ['makami', 'Dog-Dog: Model Okuchi no Makami Fruit', 0xcfefff, 0x6fb6ff, [['wave', 'Frost Howl'], ['dash', 'Wolf Rush'], ['rain', 'Blizzard Fangs'], ['orbit', 'Snow Wolf Pack']], 'Okuchi no Makami: Divine Blizzard'],
]) { F(id, name, 7, c1, c2, mv, sp); FRUITS[id].price = 0; FRUITS[id].ultra = true; }
FRUITS.gomu.price = 2500; FRUITS.mera.price = 15000; FRUITS.pika.price = 40000;
// Legendary specials: one unique cutscene each (same special-time rules as Godly+)
{ const LS = { mera: ['Great Flame Commandment: Entei', 'entei'], hie: ['Ice Age: Pheasant Beak', 'glacier'], ito: ['Birdcage: God Thread', 'cage'], ope: ['ROOM: K-Room Shock', 'room'], nikyu: ['Ursus Shock: Full Release', 'ursus'], yami: ['Black Hole: Liberation', 'void'], toki: ['Time Collapse', 'clock'], bisu: ['Biscuit Army March', 'army'], mira: ['Mirror-World Shatter', 'shards'], shiro: ['Castle Cannon Barrage', 'cannon'] };
  for (const [id, [n, st]] of Object.entries(LS)) if (FRUITS[id]) FRUITS[id].special = { k: 'leg_' + id, name: n, dmg: 7, style: st, fixed: true }; }
for (const id of Object.keys(FRUITS)) { const f = FRUITS[id]; if (/: /.test(f.name) || / ★$/.test(f.name)) f.short = f.name.replace(/ ★$/, '').replace(/ Fruit$/, '').replace(/^[A-Za-z]+-[A-Za-z]+: (Model )?/, ''); f.original = / ★$/.test(f.name); }
// special "style" for the cutscene (Godly rain, Mythical nova/meteor, Ultras unique)
const SPS = { nika: 'nika', seiryu: 'coil', sound: 'nova', makami: 'meteor' };
for (const [id, f] of Object.entries(FRUITS)) if (f.special && !f.special.fixed) f.special.style = SPS[id] || (f.rar === 6 ? (id.length % 2 ? 'nova' : 'meteor') : 'rain');

// Swords: 40 standard + 15 secret (quest-only). [id, name, rarity, dmg, minLvl]
export const SWORD_LIST = [
  ['cutlass', 'Rusty Cutlass', 0, 14, 1], ['marine', 'Marine Saber', 1, 22, 8], ['buggyknife', 'Clown Dagger', 0, 18, 15], ['kurocl', 'Bagnaw Cat Claw', 1, 28, 22], ['pearl', 'Shell Rapier', 1, 32, 28],
  ['sawtooth', 'Kiribachi', 2, 40, 35], ['yubashiri', 'Yubashiri', 2, 46, 42], ['nidai', 'Nidai Kitetsu', 2, 50, 45], ['sandai', 'Sandai Kitetsu', 3, 56, 42], ['peacemaker', 'Peacemaker Cane', 1, 52, 50],
  ['hook', 'Golden Hook Blade', 2, 60, 60], ['jitte', 'Seastone Jitte', 2, 64, 42], ['shigure', 'Shigure', 3, 66, 42], ['kanshou', 'Soul Cane', 3, 72, 95], ['kikoku', 'Kikoku', 4, 90, 100],
  ['pacifista', 'Pacifista Blade', 2, 78, 100], ['kujabow', 'Kuja Snake Sabre', 3, 82, 104], ['seastone', 'Seastone Halberd', 3, 86, 108], ['saberhq', 'Vice Admiral Saber', 3, 92, 114], ['bisento', 'Bisento', 4, 100, 114],
  ['coral', 'Coral Trident', 3, 110, 120], ['iceblade', 'Frozen Katana', 3, 118, 140], ['gladius', 'Corrida Gladius', 3, 126, 165], ['kirin', 'Kirin Blade', 4, 135, 165], ['tusk', 'Mammoth Tusk Sword', 3, 140, 200],
  ['mink', 'Electro Tonfa Blade', 4, 150, 200], ['candy', 'Sweet Sabre', 3, 165, 250], ['napoleon', 'Napoleon', 4, 180, 250], ['ame', 'Ame no Habakiri', 5, 220, 300], ['shusui', 'Shusui', 4, 190, 88],
  ['soulsolid', 'Soul Solid', 4, 170, 95], ['durandal', 'Durandal', 4, 200, 120], ['sakura', 'Sakura Fubuki', 3, 210, 300], ['oni', 'Oni Kiri', 4, 230, 300], ['tenseiken', 'Tenseiken', 3, 240, 380],
  ['murakumo', 'Murakumo-giri', 5, 260, 300], ['laser', 'Seraphim Edge', 4, 270, 380], ['kogarasu', 'Kogarasu Maru', 4, 280, 380], ['shodai', 'Shodai Kitetsu', 5, 300, 380], ['gryphon', 'Gryphon', 5, 310, 380],
  // 15 secret legendary blades (extremely hard quest chains)
  ['wado', 'Wado Ichimonji', 5, 120, 12, 1], ['enma', 'Enma', 6, 340, 300, 1], ['yoru', 'Yoru', 7, 400, 300, 1], ['ameno', 'Ama no Murakumo', 6, 360, 380, 1], ['ryuma', "Ryuma's Shusui", 6, 330, 95, 1],
  ['kitetsu1', 'Kitetsu the First', 6, 350, 380, 1], ['ameoden', "Oden's Ame no Habakiri", 7, 390, 300, 1], ['kashu', 'Kashu', 6, 300, 250, 1], ['kokuto', 'Black Blade Kokuto', 7, 380, 250, 1], ['wazamono', 'Hundred Wazamono', 6, 320, 165, 1],
  ['sutra', 'Sutra Saber', 6, 310, 200, 1], ['gods', "God's Valley Edge", 7, 420, 380, 1], ['sorrow', 'Sea-King Fang', 6, 290, 120, 1], ['shiro', 'White Hunter Blade', 6, 260, 100, 1], ['sanbon', 'Three Sword Style', 7, 450, 1, 1],
];
const SWP = r => [150, 1800, 6000, 14000, 30000, 0, 0, 0][r];
for (const [id, name, rar, dmg, lvl, secret] of SWORD_LIST) {
  const prev = SWORDS[id] || {};
  SWORDS[id] = { name, rar, dmg, spd: 1 + rar * 0.03, price: prev.price ?? (secret ? 0 : SWP(rar) * (1 + lvl / 60)), col: rar >= 6 ? [0x2a2a2a, 0xffe060, 0xaa3aff][rar - 5] || 0xffffff : 0xdfe6ee, len: 0.95 + rar * 0.05, minLvl: lvl, secret: !!secret,
    moves: [{ k: 'slash', name: prev.moves?.[0]?.name || ['Rising Slash', 'Air Cutter', 'Lion Strike', 'Pound Cannon', 'Flying Dragon', 'Black Rope Dragon', 'Supreme Slash', 'Ashura'][rar], cd: 4 }, { k: 'spin', name: prev.moves?.[1]?.name || ['Whirlwind', 'Tornado', 'Tatsumaki', 'Tiger Hunt', 'Purgatory Onigiri', 'Dragon Twister', 'Asura Blaze', 'King of Hell'][rar], cd: 7 }] };
}
SWORDS.wado.quest = 'Defeat Axe-Hand Morgan (Coby\'s quest) to earn it';
SWORDS.sanbon.quest = 'Forge at the Loguetown swordsmith with Wado Ichimonji + Sandai Kitetsu + Shusui';
SWORDS.sanbon.santoryu = true;
// canon/iconic names (ids kept for saves)
const SWORD_NAMES = {"buggyknife": "Buggy's Clown Daggers", "kurocl": "Nekote (Kuro's Cat Claws)", "pearl": "Cabaji's Acrobat Sword", "peacemaker": "Ohm's Eisen Whip", "jitte": "Nanashaku Jitte", "kanshou": "Brook's Cane Sword", "pacifista": "Sentomaru's Battle Axe", "kujabow": "Kuja Warrior Scimitar", "seastone": "Hannyabal's Halberd", "saberhq": "Momonga's Katana", "bisento": "Vista's Twin Flower Swords", "coral": "Hody's Coral Trident", "iceblade": "Aokiji's Ice Saber", "gladius": "Rebecca's Gladius", "kirin": "Kyros' Gladiator Sword", "tusk": "Jack's Twin Scimitars", "mink": "Inuarashi's Sword", "candy": "Katakuri's Mogura", "ame": "Kin'emon's Katana", "shusui": "Kaku's Twin Swords", "sakura": "Kikunojo's Katana", "oni": "Fujitora's Shikomizue", "tenseiken": "Ashura Doji's Nodachi", "murakumo": "Murakumogiri", "kogarasu": "King's Katana", "kitetsu1": "Raiu (Shiryu)", "kashu": "Ushimaru's Blade", "kokuto": "Shark Cutter (Bastille)", "wazamono": "Rayleigh's Saber", "sutra": "Mihawk's Cross Knife", "gods": "Xebec's Blade (God Valley)", "sorrow": "Kage Giri (Moria's Scissors)", "shiro": "Ace (Roger's Black Blade)"};
for (const [id, n] of Object.entries(SWORD_NAMES)) if (SWORDS[id]) SWORDS[id].name = n;
export const GUN_LIST = [['flintlock', 'Flintlock Pistol', 0, 18, 1], ['musket', 'Marine Musket', 1, 32, 8], ['kabuto', 'Kabuto Slingshot', 2, 50, 22], ['yasopp', "Yasopp's Rifle", 2, 70, 40], ['blackkabuto', 'Black Kabuto', 3, 90, 80], ['bazooka', 'Marine Bazooka', 3, 120, 114], ['franky', "Franky's Arm Cannon", 3, 150, 130], ['senriku', "Van Augur's Senriku Rifle", 4, 210, 210], ['bege', "Bege's Big Father", 4, 230, 230], ['beckman', "Benn Beckman's Rifle", 4, 280, 300], ['seraph', 'Seraphim Blaster', 4, 300, 380]];
// two iconic skills per gun: [kind, name, dmgMult]; unlocked at gun mastery 3 and 10
export const GUN_SKILLS = { flintlock: [['rapid', 'Quick Draw'], ['aoe', 'Powder Burst', 1.6]], musket: [['rapid', 'Marine Volley'], ['dash', 'Bayonet Charge', 2]], kabuto: [['proj', 'Lead Star', 2.2], ['beam', 'Fire Bird Star', 2.6]],
  yasopp: [['beam', 'Ant-Eye Snipe', 3], ['rapid', 'Hunter\'s Volley']], blackkabuto: [['aoe', 'Pop Green: Devil', 2.6], ['rain', 'Hissatsu: Midori Boshi Rain', 2.8]], bazooka: [['proj', 'Bazooka Shell', 3], ['rain', 'Artillery Barrage', 3]],
  franky: [['wave', 'Coup de Vent', 3], ['beam', 'Radical Beam', 3.4]], senriku: [['beam', 'Long-Range Snipe', 3.6], ['blink', 'Warp Shot', 3]], bege: [['rapid', 'Big Father Barrage'], ['rain', 'Castle Cannon Volley', 3.4]],
  beckman: [['beam', 'Precision Headshot', 4], ['rapid', 'Red Hair Suppressing Fire']], seraph: [['beam', 'Pacifista Laser', 4], ['wave', 'Laser Sweep', 3.6]] };
for (const [id, name, rar, dmg, lvl] of GUN_LIST) GUNS[id] = { ...(GUNS[id] || {}), name, rar, dmg, cd: ({ flintlock: 0.9, musket: 1.3, kabuto: 0.8, yasopp: 1.2, blackkabuto: 0.9, bazooka: 1.6, franky: 1.4, senriku: 1.5, bege: 0.35, beckman: 1.1, seraph: 0.7 })[id], price: GUNS[id]?.price ?? Math.round([200, 2500, 7000, 25000, 60000, 200000][rar + (rar >= 4 ? 1 : 0)] || 9000), range: 40 + rar * 8, minLvl: lvl };
export const WEAR_LIST = [
  ['strawhat', 'Straw Hat', 1, { hp: 40 }, 1], ['bandana', 'Black Bandana', 1, { dmg: 0.08 }, 1], ['sandals', 'Swift Sandals', 1, { spd: 0.08 }, 1], ['marinecoat', 'Marine Coat', 2, { hp: 80, def: 0.05 }, 8],
  ['clownnose', 'Clown Nose', 1, { hp: 120 }, 15], ['catglasses', 'Cat Burglar Glasses', 2, { dmg: 0.12 }, 22], ['chefsuit', 'Sea Chef Suit', 2, { spd: 0.1, hp: 150 }, 28], ['sharkvest', 'Shark Tooth Vest', 2, { dmg: 0.15, hp: 120 }, 35],
  ['cowboy', 'Fire Fist Cowboy Hat', 3, { dmg: 0.18, hp: 200 }, 42], ['sandcape', 'Desert Warlord Cape', 3, { def: 0.1, hp: 300 }, 60], ['skywings', 'Sky Island Wings', 3, { spd: 0.15 }, 70], ['cp9mask', 'CP9 Mask', 3, { dmg: 0.2, spd: 0.08 }, 80],
  ['captaincoat', 'Pirate Captain Coat', 4, { hp: 500, dmg: 0.15 }, 100], ['kujaear', 'Kuja Snake Earrings', 4, { dmg: 0.25 }, 104], ['admiralcoat', 'Admiral Coat', 4, { hp: 700, def: 0.12 }, 114],
  ['karate', 'Fish-Man Karate Gi', 4, { dmg: 0.25, hp: 600 }, 120], ['pinkcoat', 'Pink Feather Coat', 5, { dmg: 0.3, spd: 0.12 }, 165], ['minkvest', 'Mink Warrior Vest', 4, { spd: 0.18, hp: 800 }, 200],
  ['yonkocoat', 'Emperor Coat', 5, { hp: 1500, dmg: 0.3, def: 0.1 }, 250], ['kimono', 'Wano Kimono', 5, { spd: 0.2, dmg: 0.3 }, 300], ['visor', 'Egghead Visor', 6, { dmg: 0.4, hp: 2000 }, 380],
];
for (const [id, name, rar, stat, lvl] of WEAR_LIST) ACCESSORIES[id] = { name, rar, stat, price: ACCESSORIES[id]?.price ?? Math.round(600 * Math.pow(1.042, lvl) * (1 + rar)), minLvl: lvl };

// Tier II upgrades (quest: reach sword mastery 60, bring a boss trophy + Berries to any weapon dealer)
export const T2 = { wado: 'Wado Ichimonji · Black Blade', sandai: 'Sandai Kitetsu · Cursed', shusui: 'Shusui · Black Blade', kikoku: 'Kikoku · Night Terror', enma: 'Enma · Hell Flame', yoru: 'Yoru · Supreme', murakumo: 'Murakumo-giri · Emperor', ame: 'Ame no Habakiri · Oden', durandal: 'Durandal · Holy', sanbon: 'Three Sword Style · King of Hell', napoleon: 'Napoleon · Big Mom', kirin: 'Kirin Blade · Thunder' };
export const swordDmg = (S, id) => SWORDS[id].dmg * ((S.t2 || {})[id] ? 1.35 : 1);
