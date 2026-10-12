const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [tag, vp] of [['', { width: 1280, height: 800 }], ['_phone', { width: 390, height: 844, isMobile: true, hasTouch: true }]]) {
    const p = await (await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto((process.env.BASE || 'http://localhost:8080') + '/?skip&anytap'); await p.waitForTimeout(1000); await p.mouse.click(200, 200);
    await p.waitForFunction(() => window.__g && __g.mode === 'create', null, { timeout: 30000 }); await p.click('#cGo');
    await p.waitForFunction(() => __g.game && __g.game.running, null, { timeout: 20000 }); await p.waitForTimeout(500);
    await p.evaluate(() => { const g = __g.game; g.save.lvl = 140; g.save.island = 'water7'; __g.ui.open('map'); }); await p.waitForTimeout(600);
    await p.evaluate(() => __g.ui.act('isl:dressrosa')); await p.waitForTimeout(200);
    await p.screenshot({ path: __dirname + '/../shots/v4_worldmap' + tag + '.png' }); console.log(tag, errs);
  }
  await b.close();
})();
