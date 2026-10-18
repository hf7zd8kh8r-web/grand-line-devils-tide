// Sword Index: where/how to get all 55 swords (+ Tier II forms), secret-quest riddles + reveal hints + progress,
// tavern rumors and NPC hints. Pure data + HTML helpers (UI in ui.js).
import { SWORDS, SWORD_LIST, ISLANDS, SEAS, RARITY, RCOL, ENEMIES, QUESTS, T2, islandById } from './data.js';
import { SECRET_Q } from './islands.js';
// boss-only drops (were price 0 and showed up free in shops)
export const SW_DROPS = { murakumo: ['marineford_boss', 0.12], ame: ['wano_boss', 0.12], shodai: ['wci_boss', 0.1], gryphon: ['egghead_boss', 0.1] };
for (const [id, [b, ch]] of Object.entries(SW_DROPS)) if (SWORDS[id]) SWORDS[id].drop = { boss: b, ch };
// riddles (shown) + clear steps (on reveal) per secret blade
const RID = {
  ryuma: 'Where the Pirate King lost his head, the white smoke must fall five times before the dead samurai\'s blade is yours.',
  shiro: 'Sixty marksmen guard the town of beginnings. Silence them all and the White Hunter\'s blade will listen.',
  sorrow: 'On the ship that steals shadows, the giant shadow-thief must fall four times.',
  wazamono: 'The snake princess rules the island of women. Defeat the empress five times, and an old pirate\'s saber is yours.',
  sutra: 'Where the great war burned, its general must fall four times.',
  kashu: 'Fire and ice split the scientist\'s island. Bring down its master five times.',
  kokuto: 'In the kingdom of toys and strings, the heavenly yaksha must be cut down six times.',
  enma: 'On the back of a walking elephant, the hell-blade waits for a sixfold victory.',
  ameoden: 'In the land of candy, an empress must fall six times before Oden\'s blade answers.',
  yoru: 'The world\'s greatest swordsman watches the ruins of the great war. Accept his trial and defeat him in single combat.',
  kitetsu1: 'In the land of samurai, one hundred and twenty beast pirates must fall to wake the first cursed blade.',
  ameno: 'On the island of the future, a genius\'s guardian must fall six times.',
  gods: 'In the island of the future, twelve victories over its master will reveal the blade from God Valley.',
};
const tName = t => (ENEMIES[t] ? ENEMIES[t].name : t);
const seaOf = id => { const I = islandById(id); const s = I && SEAS.find(x => x.id === I.sea); return s ? s.name : '?'; };
const islN = id => (islandById(id) || {}).name || id;
const GEN = new Set(ISLANDS.filter(i => i.built && !['windmill', 'shells'].includes(i.id) && !i.secret).map(i => i.id));
function shopIsland(id) { const d = SWORDS[id]; if (id === 'cutlass') return 'windmill'; if (id === 'marine') return 'shells';
  const c = ISLANDS.filter(i => GEN.has(i.id) && d.minLvl <= i.lvl + 10 && d.minLvl >= i.lvl - 45).sort((a, b) => a.lvl - b.lvl); return c.length ? c[0].id : null; }
// one record per sword
export function swordSource(id) { const d = SWORDS[id];
  if (id === 'sanbon') return { type: 'craft', island: 'loguetown', how: 'Bring Wado Ichimonji + Sandai Kitetsu + Shusui to the Loguetown weapon dealer and forge them.' };
  if (id === 'wado') return { type: 'quest', island: 'shells', how: 'Take Coby\'s quest "Defeat Axe-Hand Morgan" in Shells Town and win.' };
  if (d.drop) return { type: 'boss', island: d.drop.boss.split('_')[0], how: `Rare drop (${Math.round(d.drop.ch * 100)}%) from ${tName(d.drop.boss)} on ${islN(d.drop.boss.split('_')[0])}.` };
  const sq = SECRET_Q.findIndex(q => q[1] === id); if (sq >= 0) { const [isl, , target, n, lvl] = SECRET_Q[sq]; return { type: 'secret', island: isl, target, n, lvl, how: `Secret Trial from the Mysterious Swordsman on ${islN(isl)}: defeat ${tName(target)} ${n}× (Lv ${lvl}+).`, riddle: RID[id] || 'A legendary blade waits for a worthy swordsman.' }; }
  const isl = shopIsland(id); return { type: 'shop', island: isl, how: isl ? `Buy from the weapon dealer on ${islN(isl)} (Lv ${d.minLvl}+) for ฿${Math.round(d.price).toLocaleString()}.` : `Weapon dealers (Lv ${d.minLvl}+).`, extra: id === 'marine' ? 'Also dropped by Axe-Hand Morgan.' : '' }; }
export const SW_IDS = SWORD_LIST.map(x => x[0]);
// secret numbering per sea: "Secret Quest #1 – First Sea"
export function secretList() { const per = {}; const out = []; const ids = SW_IDS.filter(id => swordSource(id).type === 'secret').map(id => [id, swordSource(id)]).sort((a, b) => (islandById(a[1].island).sea - islandById(b[1].island).sea) || (a[1].lvl - b[1].lvl));
  for (const [id, s] of ids) { const sea = seaOf(s.island); per[sea] = (per[sea] || 0) + 1; out.push({ id, ...s, sea, label: `Secret Quest #${per[sea]} – ${sea}` }); } return out; }
export function secretSteps(S, id) { const s = swordSource(id); const q = (QUESTS[s.island] || []).find(x => x.sword === id); const act = q && (S.quests || []).find(x => x.id === q.id); const done = q && (S.qdone || []).includes(q.id); const own = S.inv.swords.includes(id) || S.eq.sword === id;
  return [[`Reach Lv ${s.lvl}`, S.lvl >= s.lvl], [`Sail to ${islN(s.island)} (${seaOf(s.island)})`, (S.unlocked || []).includes(s.island) || S.island === s.island], ['Accept the Mysterious Swordsman\'s Secret Trial', !!act || done || own], [`Defeat ${tName(s.target)} ${act ? `(${act.have}/${s.n})` : `${s.n}×`}`, done || own], ['Claim the blade', own]]; }
const TYPES = [['shop', '🛒 Shop'], ['boss', '💀 Boss drop'], ['quest', '📜 Quest'], ['secret', '🗝 Secret quest'], ['craft', '⚒ Craftable'], ['t2', '✨ Tier II']];
export const RUMOR_HOOKS = [], INDEX_HOOKS = []; // other systems (secrets.js) add riddles / index sections
export function swordIndexHtml(S, sea, moveList) { sea = +(sea || 1); const owned = new Set([...S.inv.swords, S.eq.sword].filter(Boolean)); const secr = secretList(); S.swHint = S.swHint || {};
  const all = SW_IDS.map(id => ({ id, d: SWORDS[id], s: swordSource(id) })); const inSea = x => (islandById(x.s.island) || { sea: 1 }).sea === sea;
  const tabs = SEAS.map(s => `<button data-do="swx:${s.id}" class="${s.id === sea ? 'on' : ''}">${s.name} (${all.filter(x => (islandById(x.s.island) || { sea: 1 }).sea === s.id).length})</button>`).join('');
  const card = ({ id, d, s }) => { const r = d.rar; const own = owned.has(id); const sc = secr.find(x => x.id === id); const hint = !!S.swHint[id];
    let body = `<small style="color:${RCOL[r]}">${RARITY[r]} sword · DMG ${d.dmg}</small><small>📍 ${islN(s.island)} · ${seaOf(s.island)}</small>`;
    if (s.type === 'secret') { body += `<small class="gold">${sc.label}</small><small class="riddle">“${s.riddle}”</small>`;
      body += hint ? `<small>${s.how}</small><ul class="swck">${secretSteps(S, id).map(([t, ok]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✔' : '◻'} ${t}</li>`).join('')}</ul>` : `<button class="mini" data-do="swhint:${id}">🔍 Reveal hint</button>`; }
    else body += `<small>${s.how}</small>${s.extra ? `<small class="dim">${s.extra}</small>` : ''}`;
    if (T2[id]) body += `<small style="color:#ffd04a">✨ Tier II: ${T2[id]} (Mastery 60 + boss trophy + ฿${Math.round(d.dmg * 2000).toLocaleString()} at a weapon dealer)${(S.t2 || {})[id] ? ' ✔' : ''}</small>`;
    body += moveList(S, 'sword', id);
    return `<div class="dexc swc ${own ? 'own' : ''}" style="--rc:${RCOL[r]}"><div class="ic ic-sword" style="--rc:${RCOL[r]}"></div><div><b>${d.name}${own ? ' <i class="gold">✔ Owned</i>' : ''}</b>${body}</div></div>`; };
  const groups = TYPES.map(([t, lab]) => { const L = t === 't2' ? all.filter(x => T2[x.id] && inSea(x)) : all.filter(x => x.s.type === t && inSea(x)); if (!L.length) return '';
    L.sort((a, b) => a.d.minLvl - b.d.minLvl); return `<h3>${lab} <small class="dim">(${L.length})</small></h3><div class="dexl">${t === 't2' ? L.map(x => card(x)).join('') : L.map(card).join('')}</div>`; }).join('');
  const nOwn = SW_IDS.filter(id => owned.has(id)).length;
  return `<h2>⚔ Sword Index</h2><p class="dim">${SW_IDS.length} swords · you own ${nOwn}. Grouped by sea and how to get them. Secret blades come from hard trials — tavern rumors and townsfolk drop riddles about them.</p><div class="tabs dextabs">${tabs}</div>${groups}${INDEX_HOOKS.map(f => { try { return f(S, sea) || ''; } catch (_) { return ''; } }).join('')}`; }
// a riddle for something you don't have yet (prefer this sea)
export function rumorFor(S, islandId) { for (const f of RUMOR_HOOKS) { try { const r = f(S, islandId); if (r) return r; } catch (_) {} } const I = islandById(islandId); const sec = secretList().filter(x => !S.inv.swords.includes(x.id) && S.eq.sword !== x.id); if (!sec.length) return null; const near = sec.filter(x => islandById(x.island).sea === (I ? I.sea : 1)); const L = near.length ? near : sec; const x = L[Math.floor(Math.random() * L.length)]; return { id: x.id, label: x.label, text: x.riddle }; }
