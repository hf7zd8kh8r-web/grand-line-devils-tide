const { chromium } = require('playwright-core');
const OUT = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const mob = process.argv[2] === 'm';
  const p = await (await b.newContext(mob ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : { viewport: { width: 1280, height: 800 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  const pre = mob ? 'm_' : 'd_'; const ev = (f, a) => p.evaluate(f, a); const shot = n => p.screenshot({ path: OUT + pre + n + '.png' });
  await p.goto((process.env.BASE || 'http://localhost:4173') + '/?skip&anytap'); await p.waitForTimeout(1200); if (mob) await p.touchscreen.tap(195, 420); else await p.mouse.click(320, 200);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.click('#cGo'); await p.waitForTimeout(800);
  // fishing
  await ev(() => { const g = __g.game; g.p.pos.set(0, 0.85, 64); g.p.yaw = Math.PI; g.p.pitch = -0.25; __g.IN.pressed.add('fish'); });
  await p.waitForTimeout(600); await shot('fishing');
  await ev(() => { const g = __g.game; g.fishing.t = 0.01; }); await p.waitForTimeout(300); await shot('fish_bite');
  await ev(() => { const g = __g.game; const r = Math.random; Math.random = () => 0.01; g.fishing.press(); Math.random = r; }); await p.waitForTimeout(700); await shot('chest');
  console.log('after fishing', await ev(() => ({ ber: __g.game.save.ber, fruits: __g.game.save.inv.fruits, chests: __g.game.save.stats.chests })));
  // haki at lvl 60
  await ev(() => { const g = __g.game; g.save.lvl = 59; g.addXp(999999); }); await p.waitForTimeout(400);
  await ev(() => { const g = __g.game; g.p.pos.set(-26, 0, -6); g.p.pos.y = g.groundAt(-26, -6); g.p.yaw = 0; g.p.pitch = 0; __g.IN.pressed.add('haki'); }); await p.waitForTimeout(500);
  await ev(() => __g.IN.pressed.add('attack')); await p.waitForTimeout(200); await shot('haki');
  await ev(() => __g.IN.pressed.add('conq')); await p.waitForTimeout(300); await shot('conqueror');
  // fake player trade
  await ev(() => { const g = __g.game; const o = g.fakes[0]; const P = o.c.root.position; g.p.pos.set(P.x, P.y, P.z + 2); g.p.yaw = 0; }); await p.waitForTimeout(400);
  await ev(() => { const g = __g.game; const n = g.nearestNpc(); g.ui.talk(n); }); await p.waitForTimeout(300); await shot('trade');
  await ev(() => { __g.ui.close(); __g.ui.open('inv', 'ranks'); }); await p.waitForTimeout(300); await shot('leaderboard'); await ev(() => __g.ui.close());
  // awakening + generic fruit move on later island
  await ev(() => { const g = __g.game; g.save.lvl = 300; g.save.ber = 2e6; g.save.boat = true; g.loadIsland('wano', true); g.save.eq.fruit = 'seiryu'; g.save.mastery['fr:seiryu'] = { lvl: 50, xp: 0 }; g.save.slot = 'fruit'; g.refreshEquip(); });
  await p.waitForTimeout(800);
  await ev(() => { __g.ui.open('inv', 'gear'); }); await p.waitForTimeout(300); await shot('awaken_panel'); await ev(() => { __g.ui.act('awaken'); });
  await ev(() => { const g = __g.game; const e = g.enemies.find(e => e.s.type.endsWith('e1')); const P = e.c.root.position; g.p.pos.set(P.x, 0, P.z + 7); g.p.pos.y = g.groundAt(g.p.pos.x, g.p.pos.z); g.p.yaw = 0; g.p.pitch = -0.05; __g.IN.pressed.add('m1'); });
  await p.waitForTimeout(350); await shot('ultra_move');
  await ev(() => { const g = __g.game; g.p.cds = {}; __g.IN.pressed.add('m2'); }); await p.waitForTimeout(800); await shot('ultra_move2');
  await ev(() => { const g = __g.game; g.p.special = 100; __g.IN.pressed.add('special'); }); await p.waitForTimeout(2000); await shot('ultra_special');
  await p.waitForTimeout(3000);
  await ev(() => { __g.ui.open('map'); }); await p.waitForTimeout(300); await shot('map_wano'); await ev(() => __g.ui.close());
  await ev(() => { __g.ui.open('shop', 'auto:weapons:42'); }); await p.waitForTimeout(300); await shot('forge_shop');
  console.log('ERRS', errs.slice(0, 10)); await b.close();
})();
