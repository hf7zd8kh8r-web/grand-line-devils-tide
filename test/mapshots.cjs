// Overhead + ground-level island shots. node test/mapshots.cjs <tag> [ids]   (BASE=http://localhost:4173)
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:4173', TAG = process.argv[2] || 'x', IDS = (process.argv[3] || 'windmill,shells').split(',');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 900 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto(BASE + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(300, 300);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.click('#cGo'); await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 20000 }); await p.waitForTimeout(800);
  for (const id of IDS) {
    const info = await p.evaluate(id => { const g = __g.game; g.save.lvl = 400; if (g.island.id !== id) g.loadIsland(id, false); window.requestAnimationFrame = () => 0; g.amb && (g.amb.phase = () => 0.3);
      for (let i = 0; i < 30; i++) g.update(1 / 30); const I = g.island; g.hideVM = true; const c = g.cam; const far = c.far; c.far = 2000; c.position.set(0, 215, 32); c.lookAt(0, 0, 0); c.updateProjectionMatrix(); const fog = g.scene.fog, fn = fog.near, ff = fog.far; fog.near = 1500; fog.far = 2000; g.render();
      const url = g.renderer ? null : null; window.__restore = () => { c.far = far; c.updateProjectionMatrix(); fog.near = fn; fog.far = ff; g.hideVM = false; }; return { R: I.R, npcs: I.npcs.length, spawns: I.spawns.length, en: g.enemies.length }; }, id);
    await p.screenshot({ path: `${__dirname}/../shots/map_${TAG}_${id}.png` });
    await p.evaluate(() => { const g = __g.game; __restore(); const I = g.island; const n = I.npcs.find(n => n.role === 'board') || I.npcs[0]; g.p.pos.set(n.x + 3, 0, n.z + 22); g.collide(g.p.pos, 0.5); g.p.pos.y = g.groundAt(g.p.pos.x, g.p.pos.z) + 1.5; g.p.yaw = Math.PI; g.p.pitch = -0.05; for (let i = 0; i < 4; i++) g.update(1 / 30); g.hideVM = true; g.render(); });
    await p.screenshot({ path: `${__dirname}/../shots/map_${TAG}_${id}_ground.png` });
    console.log(id, JSON.stringify(info));
  }
  console.log('ERRS', errs.length, JSON.stringify(errs.slice(0, 5))); await b.close();
})();
