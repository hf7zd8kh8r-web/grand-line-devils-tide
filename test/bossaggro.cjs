const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto((process.env.BASE || 'http://localhost:4173') + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(200, 300);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForTimeout(1500);
  await p.evaluate(() => { const g = __g.game; g.save.lvl = 60; g.loadIsland('shells', false); }); await p.waitForTimeout(1500);
  const r1 = await p.evaluate(() => { const g = __g.game; const e = g.enemies.find(e => e.boss); g.bossIntroDone[e.s.type] = true; const P = e.c.root.position; g.p.pos.set(P.x, g.groundAt(P.x, P.z + 3), P.z + 3);
    g.damageEnemy ? 0 : 0; e.hp = Math.round(e.max * 0.6); e.aggro = true; e.lastHitT = g.t;
    // run far across the island
    const a = Math.atan2(P.z, P.x) + Math.PI; const x = Math.cos(a) * g.island.R * 0.6, z = Math.sin(a) * g.island.R * 0.6; g.p.pos.set(x, g.groundAt(x, z), z); g.save.hp = 1e9; g.st.maxHp = 1e9;
    window.__b = e; return { hp: e.hp, d0: P.distanceTo(g.p.pos), type: e.s.type }; });
  await p.waitForTimeout(8000);
  const r2 = await p.evaluate(() => { const g = __g.game, e = window.__b; return { hp: e.hp, aggro: e.aggro, d: e.c.root.position.distanceTo(g.p.pos), bar: g.ui.bossShown, gy: g.island.hf(e.c.root.position.x, e.c.root.position.z) }; });
  // island hop: HP should persist
  await p.evaluate(() => { const g = __g.game; g.loadIsland('windmill'); g.loadIsland('shells'); });
  await p.waitForTimeout(500);
  const r3 = await p.evaluate(() => { const g = __g.game; const e = g.enemies.find(e => e.boss); return { hp: e.hp, max: e.max }; });
  // player death resets
  await p.evaluate(() => { const g = __g.game; const e = g.enemies.find(e => e.boss); e.aggro = true; window.__b = e; g.save.hp = 0; g.st.maxHp = 100; (g.die || g.playerDie || (()=>{})).call(g); });
  await p.waitForTimeout(3000);
  const r4 = await p.evaluate(() => { const e = window.__b; return { hp: e.hp, max: e.max, aggro: e.aggro, dead: __g.game.dead }; });
  console.log(JSON.stringify({ r1, r2, r3, r4 })); console.log('errs', errs);
  await b.close();
})();
