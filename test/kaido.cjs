const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [tag, vp] of [['', { viewport: { width: 1280, height: 800 } }], ['phone_', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
    const p = await (await b.newContext(vp)).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto((process.env.BASE || 'http://localhost:4173') + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(200, 300);
    await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForTimeout(1500);
    await p.evaluate(() => { const g = __g.game; g.save.lvl = 400; g.save.hp = 99999; g.loadIsland('wano', false); }); await p.waitForTimeout(1500);
    await p.evaluate(() => { const g = __g.game; const e = g.enemies.find(e => e.boss); g.bossIntroDone[e.s.type] = true; const P = e.c.root.position; g.p.pos.set(P.x, 0, P.z + 11); g.p.pos.y = g.groundAt(g.p.pos.x, g.p.pos.z); g.p.yaw = 0; g.p.pitch = 0.08; e.aggro = true; });
    await p.waitForTimeout(2500); await p.screenshot({ path: __dirname + '/../shots/v4_' + tag + 'kaido_fight.png' }); console.log(tag, 'errs', errs);
  }
  await b.close();
})();
