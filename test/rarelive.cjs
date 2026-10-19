// Live repro (iPhone touch emulation): RARE STOCK announcement vs what the Fruit Dealer the player opens actually shows.
// Cases: fresh profile (only Windmill), and a profile with several islands unlocked that used Restock Now, standing on Windmill.
const { chromium, devices } = require('playwright-core');
const BASE = process.env.BASE || 'https://grand-line-devils-tide.onrender.com';
async function run(name, W, setup) { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'], viewport: { width: 844, height: 390 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(W => { const off = W * 300000 + 20000 - Date.now(); const D = Date.now; Date.now = () => D() + off; }, W);
  await p.goto(BASE + '/?skip&anytap'); await p.waitForFunction(() => window.__g, null, { timeout: 60000 }); await p.waitForTimeout(1500); await p.touchscreen.tap(422, 195);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 30000 }); await p.tap('#cGo'); await p.waitForTimeout(3000);
  await p.evaluate(setup); await p.waitForTimeout(600);
  if (await p.$('[data-do="rrestock"]')) { await p.tap('[data-do="rrestock"]'); await p.waitForTimeout(600); await p.evaluate(() => __g.game.ui.close && __g.game.ui.close()); }
  await p.evaluate(() => { const g = __g.game; window.__ban = []; const b0 = g.ui.banner.bind(g.ui); g.ui.banner = (a, c) => { window.__ban.push(a + ' | ' + c); return b0(a, c); }; g._stockW = undefined; g.stockTick(); });
  await p.waitForFunction(() => window.__ban.some(x => /RARE/.test(x)), null, { timeout: 20000 }).catch(() => {});
  await p.evaluate(() => { const g = __g.game; g.ui.open('shop', 'rot'); }); await p.waitForTimeout(800);
  const r = await p.evaluate(() => { const ban = (window.__ban.find(x => /RARE/.test(x)) || ''); const slots = [...document.querySelectorAll('.fslot')].map(x => ({ n: x.querySelector('b').textContent, gone: x.classList.contains('gone'), btn: !!x.querySelector('button[data-do^="rbuy"]:not([disabled])') })); return { ban, island: __g.game.island.id, slots }; });
  const hit = r.slots.find(s => r.ban.includes('| ' + s.n + ' ('));
  let bought = false; if (hit && hit.btn) { const i = r.slots.indexOf(hit); const n0 = await p.evaluate(() => __g.game.save.inv.fruits.length); await p.locator('.fslot').nth(i).locator('button').tap({ force: true }); await p.waitForTimeout(700); bought = await p.evaluate(n0 => __g.game.save.inv.fruits.length === n0 + 1, n0); }
  r.bought = bought;
  console.log(hit && !hit.gone && hit.btn && r.bought ? 'PASS' : 'FAIL', name, JSON.stringify({ ban: r.ban, on: r.island, shop: r.slots.map(s => s.n), visible: !!hit, buyable: !!(hit && hit.btn && !hit.gone), bought: r.bought }), errs.length ? 'errs:' + errs.slice(0, 2) : '');
  await p.screenshot({ path: `/workspace/one-piece-game/fp/shots/rarelive_${name}.png` }); await b.close(); }
(async () => {
  await run('fresh', +(process.env.W1 || 5974588), () => { const g = __g.game; g.save.ber = 1e8; });
  await run('multi_restocked', +(process.env.W2 || 5974590), () => { const g = __g.game, S = g.save; S.ber = 1e9; S.lvl = 40; for (const i of ['shells', 'orange', 'syrup', 'baratie']) if (!S.unlocked.includes(i)) S.unlocked.push(i); g.ui.open('shop', 'rot'); });
})();
