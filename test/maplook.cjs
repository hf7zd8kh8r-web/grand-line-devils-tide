// Map look before/after: fixed camera shots per island (ground road view, elevated view, shore) + windmill sunset/night.
// usage: BASE=http://localhost:8099 node test/maplook.cjs <before|after> [ids] [quality]
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8099', TAG = process.argv[2] || 'x', IDS = (process.argv[3] || 'windmill,orange,alabasta,wano,zou,thriller').split(','), QL = process.argv[4] || 'high';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }); await ctx.addInitScript(q => { localStorage.setItem('gldt_quality', q); }, QL); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto(BASE + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(300, 300);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.click('#cGo'); await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 20000 }); await p.waitForTimeout(800);
  await p.addStyleTag({ content: '#app > *:not(#gl), body > *:not(#app) { visibility: hidden !important; }' });
  const shot = async (id, view, ph = 0.3) => { const info = await p.evaluate(([id, view, ph]) => { const g = __g.game; g.save.lvl = 400; if (g.island.id !== id) g.loadIsland(id, false); window.requestAnimationFrame = () => 0; g.amb && (g.amb.phase = () => ph); if (g.duel) g.duel._chalT = 1e9;
      for (const e of g.enemies) e.c.root.visible = false; const I = g.island; const R = I.R; g.hideVM = true; const c = g.cam;
      const V = { ground: [0, 2.2, R * 0.66, 0, 1.6, R * 0.2], high: [R * 0.55, 34, R * 0.95, 0, 0, -R * 0.1], shore: [R * 0.05, 3.2, R * 0.95 + 4, R * 0.7, 0, R * 0.5], forest: [R * 0.2, 4, R * 0.15, R * 0.5, 2, R * 0.38] }[view];
      g.p.pos.set(V[0], 0, V[2]); g.p.pos.y = g.groundAt(V[0], V[2]);
      for (let i = 0; i < 40; i++) { g.update(1 / 30); } const y0 = Math.max(g.groundAt(V[0], V[2]), 0) + V[1]; c.position.set(V[0], y0, V[2]); c.lookAt(V[3], Math.max(0, g.groundAt(V[3], V[5])) + V[4], V[5]); c.updateMatrixWorld(); if (g.sky) g.sky.position.copy(c.position); g.render();
      return { R }; }, [id, view, ph]); await p.screenshot({ path: `${__dirname}/../shots/maplook_${TAG}_${id}_${view}.png` }); return info; };
  for (const id of IDS) { for (const v of ['ground', 'high', 'shore']) await shot(id, v); console.log(id, 'ok'); }
  await shot('windmill', 'forest'); await shot('windmill', 'ground', 0.585); await p.evaluate(() => 0); require('fs').renameSync(`${__dirname}/../shots/maplook_${TAG}_windmill_ground.png`, `${__dirname}/../shots/maplook_${TAG}_windmill_sunset.png`);
  await shot('windmill', 'ground', 0.75); require('fs').renameSync(`${__dirname}/../shots/maplook_${TAG}_windmill_ground.png`, `${__dirname}/../shots/maplook_${TAG}_windmill_night.png`); await shot('windmill', 'ground', 0.3);
  console.log('ERRS', errs.length, JSON.stringify(errs.slice(0, 5))); await b.close(); process.exit(errs.length ? 1 : 0);
})();
