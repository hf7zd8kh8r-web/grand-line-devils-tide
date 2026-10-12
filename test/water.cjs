const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 560 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message)); 
  await p.goto((process.env.BASE || 'http://localhost:4173') + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(320, 200);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.click('#cGo'); await p.waitForTimeout(1200);
  const swimTest = async (fruit) => { await p.evaluate(fruit => { const g = __g.game, S = g.save; S.eq.fruit = fruit; S.hp = g.st.maxHp; const R = g.island.R + 8; g.p.pos.set(R, -0.95, 0); g.p.vy = 0; }, fruit); await p.waitForTimeout(2500);
    return p.evaluate(() => { const g = __g.game; return { swim: g.p.swim, y: +g.p.pos.y.toFixed(2), hp: Math.round(g.save.hp), max: g.st.maxHp, drain: document.body.classList.contains('seadrain') }; }); };
  console.log('no fruit', await swimTest(null));
  console.log('fruit', await swimTest('mera')); await p.screenshot({ path: __dirname + '/../shots/v4_seadrain.png' });
  console.log('ERRS', errs); await b.close();
})();
