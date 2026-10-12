const { chromium } = require('playwright-core');
const out = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const vp = process.argv[2] === 'phone' ? { width: 390, height: 844, isMobile: true, hasTouch: true } : { width: 1280, height: 800 };
  const tag = process.argv[2] === 'phone' ? '_phone' : '';
  const p = await (await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/?skip&anytap'); await p.waitForTimeout(1000); await p.mouse.click(200, 200);
  await p.waitForFunction(() => window.__g && __g.mode === 'create', null, { timeout: 30000 }); await p.fill('#cName', 'Luffy'); await p.click('#cGo');
  await p.waitForFunction(() => __g.game && __g.game.running, null, { timeout: 20000 }); await p.waitForTimeout(800);
  await p.evaluate(() => { const g = __g.game; g.save.lvl = 160; g.save.ber = 3e6; __g.ui.open('dock', { name: 'Shipwright Dan' }); }); await p.waitForTimeout(300);
  await p.screenshot({ path: out + 'v4_shipwright' + tag + '.png' });
  await p.evaluate(() => { __g.ui.act('buyship:dinghy'); __g.ui.act('buyship:caravel'); __g.ui.act('buyship:brig'); __g.ui.act('buyship:sunny'); }); await p.waitForTimeout(300);
  console.log('ships', await p.evaluate(() => [__g.game.save.ships, __g.game.save.ship, __g.game.save.ber]));
  // gating: third sea island needs tier5
  const third = await p.evaluate(() => { __g.ui.close(true); __g.ui.open('map'); __g.ui.act('isl:wano'); return document.querySelector('#mapInfo').textContent; }); console.log('wano:', third);
  await p.evaluate(() => { __g.ui.close(true); __g.game.save.unlocked = ['windmill','shells']; __g.ui.onSail('shells'); });
  await p.waitForTimeout(500);
  console.log('mode', await p.evaluate(() => __g.mode));
  await p.waitForFunction(() => __g.sail && __g.sail.enemies.length > 0, null, { timeout: 30000 }).catch(() => console.log('no enemy spawned'));
  await p.evaluate(() => { const v = __g.sail; const e = v.enemies[0]; v.lookYaw = Math.atan2(-(e.mesh.position.x - v.ship.position.x), -(e.mesh.position.z - v.ship.position.z)) - v.yaw; v.lookPitch = -0.05; });
  await p.waitForTimeout(200); for (let i = 0; i < 4; i++) { await p.evaluate(() => { __g.sail.fireCd = 0; __g.sail.fireQ = true; }); await p.waitForTimeout(150); }
  await p.screenshot({ path: out + 'v4_sailing_deck' + tag + '.png' });
  await p.evaluate(() => { __g.sail.view = 'tp'; }); await p.waitForTimeout(400); await p.screenshot({ path: out + 'v4_sailing_tp' + tag + '.png' });
  await p.evaluate(() => { __g.sail.view = 'fp'; const v = __g.sail; for (const e of v.enemies) { e.hp = 1; } });
  await p.waitForTimeout(200); await p.evaluate(() => { const v = __g.sail; v.fireCd = 0; v.fireQ = true; });
  await p.evaluate(() => { const v = __g.sail; for (const e of v.enemies) if (!e.dead) { e.hp = 0; e.dead = true; v.kills++; v.ber += 500; } v.skip = true; });
  await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 15000 });
  await p.waitForTimeout(1200); console.log('arrived', await p.evaluate(() => [__g.game.island.id, __g.game.save.ber, __g.game.save.stats.seaKills]));
  await p.evaluate(() => { const g = __g.game; const s = g.island.shipModel; if (s) { g.p.pos.set(s.position.x - 9, g.groundAt(s.position.x - 9, s.position.z - 6) + 0.1, s.position.z - 6); g.p.yaw = -Math.atan2(9, 6) ; g.p.pitch = 0; } });
  await p.waitForTimeout(600); await p.screenshot({ path: out + 'v4_dock_ship' + tag + '.png' });
  console.log('errors', errs.length ? errs : 'none'); await b.close();
})();
