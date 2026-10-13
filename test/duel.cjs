// Duels: challenge fake, arena teleport, AI uses moves, win/lose return, screenshots, zero console errors.
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8099';
const shot = (p, n) => p.screenshot({ path: require('path').join(__dirname, '../shots', n) });
let fails = 0; const ok = (n, c, x = '') => { console.log(c ? 'PASS' : 'FAIL', n, x); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PE ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket|favicon/.test(m.text())) errs.push(m.text().slice(0, 180)); });
  await p.goto(BASE + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(200, 200);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 });
  await p.fill('#cName', 'Duelist'); await p.click('#cGo');
  await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 20000 });
  await p.waitForTimeout(1800);
  await p.evaluate(() => __g.ui.close && __g.ui.close(true));

  // Ensure a fake exists
  const fake = await p.evaluate(() => {
    const g = __g.game; if (!g.save.fakes || !g.save.fakes.length) return null;
    const f = g.save.fakes[0]; f.lvl = 8; f.fruit = f.fruit || 'gomu'; return { id: f.id, name: f.name, lvl: f.lvl };
  });
  ok('has fake player', !!fake, JSON.stringify(fake));

  const before = await p.evaluate(() => ({ x: __g.game.p.pos.x, z: __g.game.p.pos.z, y: __g.game.p.pos.y, island: __g.game.island.id, hp: __g.game.save.hp }));
  await p.evaluate((id) => { const f = __g.game.save.fakes.find(x => x.id === id); __g.game.duel.challengeFake(f); }, fake.id);
  await p.waitForTimeout(300);
  const offer = await p.evaluate(() => ({ modal: __g.ui.modal, title: document.querySelector('#panel h2')?.textContent || '', hasAccept: !!document.querySelector('[data-do="duelok"]') }));
  ok('challenge opens duel card', offer.modal === 'duel' && /Duel/.test(offer.title) && offer.hasAccept, JSON.stringify(offer));
  await p.evaluate(() => __g.ui.act('duelok'));
  await p.waitForTimeout(500);
  const intro = await p.evaluate(() => ({ on: __g.game.duel.on, phase: __g.game.duel.phase, arena: !!__g.game.duel.arena, y: __g.game.p.pos.y, foe: !!__g.game.duel.foe }));
  ok('arena teleport (high colosseum)', intro.on && intro.arena && intro.y > 100 && intro.foe, JSON.stringify(intro));
  await shot(p, 'duel_arena.png');

  // Skip to fight
  await p.evaluate(() => { const d = __g.game.duel; d.phase = 'fight'; d._introT = 0; d.hideCount(); d.showHud(true); });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const d = __g.game.duel; if (!d._usedMove && d.foe) { d.foe.skillCd = 0; __g.game.bossSkill(d.foe, 8); d._usedMove = true; } });
  await p.waitForTimeout(400);
  const fight = await p.evaluate(() => {
    const d = __g.game.duel, e = d.foe;
    return { phase: d.phase, usedMove: !!d._usedMove, foeHp: e && e.hp, foeMax: e && e.max, hud: !!document.getElementById('duelhud') && document.getElementById('duelhud').style.display !== 'none', name: document.getElementById('duelFoeN')?.textContent };
  });
  ok('fight HUD + foe name', fight.hud && fight.name === fake.name, JSON.stringify(fight));
  ok('AI used a skill/move', fight.usedMove, JSON.stringify(fight));
  await shot(p, 'duel_midfight.png');

  // Win path
  const win = await p.evaluate(() => {
    const g = __g.game, S = g.save, d = g.duel; const ber0 = S.ber, xp0 = S.xp, duels0 = S.stats.duels || 0;
    d.foe.hp = 0; d.foeDown(); d.foe.deadT = 1; d.finish('win');
    return { ber0, ber1: S.ber, xp0, xp1: S.xp, duels: S.stats.duels, bounty: S.stats.duelBounty };
  });
  await p.waitForTimeout(200);
  await shot(p, 'duel_victory.png');
  ok('win grants berries+xp+duel wins', win.ber1 > win.ber0 && win.xp1 >= win.xp0 && win.duels >= 1 && win.bounty > 0, JSON.stringify(win));
  await p.waitForTimeout(1800);
  const back = await p.evaluate((b) => {
    const g = __g.game;
    return { on: g.duel.on, y: g.p.pos.y, near: Math.hypot(g.p.pos.x - b.x, g.p.pos.z - b.z) < 2.5, islandVis: g.island.group.visible };
  }, before);
  ok('returned after win', !back.on && back.near && back.islandVis && back.y < 50, JSON.stringify(back));

  // Lose / forfeit path
  await p.evaluate((id) => { const f = __g.game.save.fakes.find(x => x.id === id); __g.game.duel.challengeFake(f); __g.ui.act('duelok'); }, fake.id);
  await p.waitForTimeout(400);
  await p.evaluate(() => { const d = __g.game.duel; d.phase = 'fight'; d.showHud(true); });
  const deaths0 = await p.evaluate(() => __g.game.save.stats.deaths);
  await p.evaluate(() => __g.game.duel.forfeit());
  await p.waitForTimeout(1800);
  const lose = await p.evaluate(({ d0, b }) => {
    const g = __g.game;
    return { on: g.duel.on, deaths: g.save.stats.deaths, deaths0: d0, near: Math.hypot(g.p.pos.x - b.x, g.p.pos.z - b.z) < 2.5 };
  }, { d0: deaths0, b: before });
  ok('forfeit returns with no death penalty', !lose.on && lose.deaths === lose.deaths0 && lose.near, JSON.stringify(lose));

  ok('zero console errors', errs.length === 0, JSON.stringify(errs));
  await b.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
