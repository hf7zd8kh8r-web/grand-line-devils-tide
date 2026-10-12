const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 640, height: 400 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack||'').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  await p.goto((process.env.BASE || 'http://localhost:4173') + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(320, 200);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.click('#cGo'); await p.waitForTimeout(500);
  const ids = process.argv[2] ? process.argv[2].split(',') : await p.evaluate(() => Object.keys(window.__ids || {}));
  const list = ids.length ? ids : ['orange','syrup','baratie','arlong','loguetown','whisky','alabasta','skypiea','water7','enies','thriller','sabaody','amazon','impel','marineford','fishman','punk','dressrosa','zou','wci','wano','egghead'];
  for (const id of list) {
    const t0 = Date.now(); await p.evaluate(id => { const g = __g.game; g.save.lvl = 400; g.loadIsland(id, false); g.p.yaw = 0; g.p.pitch = 0.05; const I = g.island; g.p.pos.set(0, 0, I.R * 0.2); g.p.pos.y = g.groundAt(0, I.R * 0.2) ; }, id);
    await p.waitForTimeout(700); await p.screenshot({ path: __dirname + '/../shots/isl_' + id + '.png' });
    // fight boss quickly to test skills
    await p.evaluate(() => { const g = __g.game; const e = g.enemies.find(e => e.boss); g.bossIntroDone[e.s.type] = true; e.aggro = true; e.skillCd = 0; const P = e.c.root.position; g.p.pos.set(P.x, 0, P.z + 8); g.p.pos.y = g.groundAt(g.p.pos.x, g.p.pos.z); });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: __dirname + '/../shots/islboss_' + id + '.png' });
    console.log(id, Date.now() - t0, 'ms', await p.evaluate(() => { const g = __g.game; return g.enemies.length + ' enemies, hp ' + Math.round(g.save.hp); }));
  }
  console.log('ERRS', errs.slice(0, 10)); await b.close();
})();
