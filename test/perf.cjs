const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage();
  p.on('pageerror', e => console.log('PE', e.message));
  await p.goto((process.env.BASE || 'http://localhost:4173') + '/?skip&anytap'); await p.waitForTimeout(1200); await p.touchscreen.tap(195, 420);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.click('#cGo'); await p.waitForTimeout(800);
  for (const isl of ['windmill', 'shells', 'water7', 'wano']) {
    const r = await p.evaluate(async (isl) => { const g = __g.game; g.loadIsland(isl, false); await new Promise(r => setTimeout(r, 600)); g.p.yaw = 0;
      const { renderer } = await import('/src/engine.js').catch(() => ({})); return null; }, isl).catch(e => e.message);
    await p.waitForTimeout(500);
    console.log(isl, await p.evaluate(() => window.__info ? window.__info() : 'n/a'));
  }
  await b.close();
})();
