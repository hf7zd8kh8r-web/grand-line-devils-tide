// Rare stock: the RARE STOCK announcement matches what the Fruit Dealer actually shows (even after a personal Restock Now), the open shop refreshes, peers' buys only mark matching slots.
const { chromium } = require('playwright-core');
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 960, height: 540 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push('PE ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  const ok = (n, c, x = '') => console.log(c ? 'PASS' : 'FAIL', n, x); const ev = (f, a) => p.evaluate(f, a);
  const W = +(process.env.RW || 5974534); await p.addInitScript(W => { const off = W * 300000 + 20000 - Date.now(); const D = Date.now; Date.now = () => D() + off; }, W);
  await p.goto((process.env.BASE || 'http://127.0.0.1:5397') + '/?skip&anytap'); await p.waitForFunction(() => window.__g, null, { timeout: 30000 }); await p.waitForTimeout(1200); await p.mouse.click(480, 270);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForTimeout(2500);
  // personal reroll twice, then the announcement fires
  await ev(() => { const g = __g.game, S = g.save; S.ber = 1e9; S.island = 'windmill'; g.ui.trNpc = null; g.ui.open('shop', 'rot'); });
  for (let i = 0; i < 2; i++) { await p.waitForTimeout(700); await p.click('[data-do="rrestock"]'); }
  await p.waitForTimeout(700); await ev(() => { const g = __g.game; g._stockW = undefined; window.__ban = []; const b0 = g.ui.banner.bind(g.ui); g.ui.banner = (a, c) => { window.__ban.push(c); return b0(a, c); }; g.stockTick(); });
  await p.waitForFunction(() => window.__ban.length, null, { timeout: 30000 });
  const r = await ev(() => { const txt = window.__ban[0]; const shop = [...document.querySelectorAll('.fslot b')].map(x => x.textContent); return { txt, shop, has: shop.some(n => txt.startsWith(n + ' (')) }; });
  ok('announced rare fruit is in the (rerolled) shop', r.has, JSON.stringify(r));
  ok('zero console errors', !errs.length, JSON.stringify(errs.slice(0, 4))); await b.close(); })();
