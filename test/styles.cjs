const { chromium } = require('playwright-core');
const out = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 560 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/?skip&anytap'); await p.waitForTimeout(1000); await p.mouse.click(200, 200);
  await p.waitForFunction(() => window.__g && __g.mode === 'create', null, { timeout: 30000 }); await p.fill('#cName', 'Sanji'); await p.click('#cGo');
  await p.waitForFunction(() => __g.game && __g.game.running, null, { timeout: 20000 }); await p.waitForTimeout(800);
  await p.evaluate(() => { const g = __g.game; g.save.lvl = 20; g.save.ber = 5e6; g.save.boat = true; g.loadIsland('baratie', true); });
  await p.waitForTimeout(1500);
  const tr = await p.evaluate(() => __g.game.npcs ? __g.game.npcs.filter(n => (n.def||n).role === 'trainer').map(n => (n.def||n).name) : 'n/a');
  console.log('trainers on Baratie:', tr);
  await p.evaluate(() => __g.ui.open('dojo', 'here')); await p.waitForTimeout(300); await p.screenshot({ path: out + 'v4_dojo_baratie.png' });
  await p.evaluate(() => __g.ui.act('stBuy:blackleg')); await p.waitForTimeout(400);
  console.log('after buy', await p.evaluate(() => ({ styles: __g.game.save.styles, eq: __g.game.save.eq.style})));
  await p.evaluate(() => __g.ui.act('stUp:diable')); await p.waitForTimeout(300);
  console.log('upgrade w/o quest ->', await p.evaluate(() => __g.game.save.styles.includes('diable')));
  // satisfy upgrade quest
  await p.evaluate(() => { const S = __g.game.save; S.mastery['fs:blackleg'] = { lvl: 45, xp: 0 }; S.kills['baratie_boss'] = 1; __g.ui.open('dojo', 'here'); __g.ui.act('stUp:diable'); });
  await p.waitForTimeout(500); console.log('upgrade w/ quest ->', await p.evaluate(() => [__g.game.save.styles, __g.game.save.eq.style]));
  await p.evaluate(() => { __g.ui.close(true); const S = __g.game.save; S.mastery['fs:diable'] = { lvl: 20, xp: 0 }; __g.game.refreshEquip(); __g.ui.updateMoves(); });
  // fight: put an enemy in front, use moves
  await p.evaluate(() => { const g = __g.game; const e = g.enemies.find(e => !e.dead && !e.boss); g.p.yaw = 0; g.p.pitch = -0.1; e.c.root.position.set(g.p.pos.x, g.p.pos.y, g.p.pos.z - 2.4); window.__e = e; });
  const hp0 = await p.evaluate(() => __e.hp);
  await p.evaluate(() => { const g = __g.game; g.vm.doKick(); g.attack && g.attack(); }); await p.waitForTimeout(120); await p.screenshot({ path: out + 'v4_style_kick.png' });
  const mv = await p.evaluate(() => { const { movesFor } = __g; return null; });
  await p.evaluate(() => { const g = __g.game; g.cds = {}; window.IN_ && 0; }); await p.keyboard.press('Digit3'); await p.waitForTimeout(250); await p.screenshot({ path: out + 'v4_style_diable_move.png' });
  await p.keyboard.press('Digit4'); await p.waitForTimeout(450); await p.screenshot({ path: out + 'v4_style_diable_move2.png' });
  console.log('enemy hp', hp0, '->', await p.evaluate(() => __e.hp), 'mastery', await p.evaluate(() => JSON.stringify(__g.game.save.mastery['fs:diable'])));
  await p.evaluate(() => __g.ui.open('dojo', 'all')); await p.waitForTimeout(300); await p.screenshot({ path: out + 'v4_styles_all.png' });
  await p.evaluate(() => { __g.ui.close(true); __g.ui.open('inv', 'stats'); }); await p.waitForTimeout(300); await p.screenshot({ path: out + 'v4_stats_style.png' });
  console.log('errors', errs.length ? errs : 'none'); await b.close();
})();
