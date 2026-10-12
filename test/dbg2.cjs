const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 640, height: 400 } })).newPage();
  p.on('pageerror', e => console.log('PE', e.message));
  await p.goto((process.env.BASE || 'http://localhost:4173') + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(320, 200);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.click('#cGo'); await p.waitForTimeout(800);
  await p.evaluate(() => { const g = __g.game; g.p.pos.set(0, 0.85, 64); g.p.yaw = Math.PI; g.p.pitch = -0.25; __g.IN.pressed.add('fish'); });
  await p.waitForTimeout(500);
  for (let i = 0; i < 3; i++) { console.log(await p.evaluate(() => { const g = __g.game; return JSON.stringify({ cam: g.cam.position, rot: [g.cam.rotation.x, g.cam.rotation.y], sky: g.sky.position, st: g.fishing.state, line: g.fishing.line.geometry.attributes.position.array.slice(0, 6) }); })); await p.screenshot({ path: '/tmp/f' + i + '.png' }); await p.waitForTimeout(1200); }
  await b.close();
})();
