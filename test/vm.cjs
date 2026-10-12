const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 800, height: 500 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await p.goto((process.env.BASE || 'http://localhost:4173') + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(320, 200);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.click('#cGo'); await p.waitForTimeout(800);
  for (const [slot, setup] of [['fist', ''], ['sword', 'S.inv.swords.push("wado"); S.eq.sword="wado";'], ['gun', 'S.inv.guns.push("flintlock"); S.eq.gun="flintlock";'], ['fruit', 'S.inv.fruits.push("mera"); S.eq.fruit="mera";']]) {
    await p.evaluate(([slot, setup]) => { const g = __g.game, S = g.save; eval(setup); if (slot === 'gun' && !S.eq.gun) { S.eq.gun = 'flintlock'; } S.slot = slot; g.refreshEquip(); }, [slot, setup]);
    await p.waitForTimeout(600); await p.screenshot({ path: __dirname + '/../shots/v3_vm_' + slot + '.png' });
  }
  console.log('ERRS', errs.slice(0, 10)); await b.close();
})();
