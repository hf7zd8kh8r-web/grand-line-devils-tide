const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const mk = async (name, vp) => { const ctx = await b.newContext(vp); const p = await ctx.newPage(); p.on('pageerror', e => console.log(name, 'PE', e.message));
    await p.goto((process.env.BASE || 'http://localhost:8080') + '/?skip&anytap&room=TEST1'); await p.waitForTimeout(1200); await p.mouse.click(200, 300);
    await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.fill('#cName', name); await p.click('#cGo'); return p; };
  const a = await mk('Adam', { viewport: { width: 800, height: 500 } });
  const c = await mk('Friend', { viewport: { width: 800, height: 500 } });
  await a.waitForTimeout(2500);
  await a.evaluate(() => { const g = __g.game; g.p.pos.set(0, 1.3, 10); g.p.yaw = 0; });
  await c.evaluate(() => { const g = __g.game; g.p.pos.set(1, 1.3, 4); g.p.yaw = Math.PI; g.p.pitch = -0.1; });
  await a.waitForTimeout(1500);
  console.log('A peers', await a.evaluate(() => [...__g.game.net.peers.values()].map(p => p.name + '@' + p.island + ' av:' + !!p.av)), await a.evaluate(() => __g.game.net.status));
  // shared hit
  const before = await c.evaluate(() => __g.game.enemies[0].hp);
  await a.evaluate(() => { const g = __g.game; g.damageEnemy(g.enemies[0], 15, {}); });
  await a.waitForTimeout(500);
  console.log('enemy0 hp on friend before/after', before, await c.evaluate(() => __g.game.enemies[0].hp));
  await c.evaluate(() => __g.game.net.chat('yo adam!')); await a.waitForTimeout(400);
  await c.screenshot({ path: __dirname + '/../shots/mp_friend.png' });
  await a.evaluate(() => __g.ui.open('pause')); await a.waitForTimeout(300); await a.screenshot({ path: __dirname + '/../shots/mp_adam_pause.png' });
  await b.close();
})();
