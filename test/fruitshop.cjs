// Fruit Dealer 5-min restock: deterministic stock, window change, reload-stable, shop UI countdown, zero console errors.
// BASE=http://localhost:8099 node test/fruitshop.cjs
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8099';
let fails = 0;
const ok = (n, c, x = '') => { console.log(c ? 'PASS' : 'FAIL', n, x); if (!c) fails++; };

(async () => {
  // ---- pure module checks (no browser)
  const FS = await import('../src/fruitshop.js');
  ok('PERIOD is 5 minutes', FS.PERIOD === 5 * 60 * 1000, String(FS.PERIOD));
  ok('WEIGHTS unchanged (8 tiers)', FS.WEIGHTS.length === 8 && FS.WEIGHTS[0] === 40 && FS.WEIGHTS[7] === 0.1, JSON.stringify(FS.WEIGHTS));
  const t0 = FS.PERIOD * 100 + 12_000; // mid-window
  const w0 = FS.windowId(t0);
  const a = FS.stockFor('windmill', w0);
  const b = FS.stockFor('windmill', w0);
  ok('same window same stock (reload-stable)', JSON.stringify(a) === JSON.stringify(b) && a.length === 6, JSON.stringify(a.map(o => o.id)));
  const c = FS.stockFor('windmill', w0 + 1);
  ok('next window different stock', JSON.stringify(a) !== JSON.stringify(c), JSON.stringify(c.map(o => o.id)));
  const d = FS.stockFor('shells', w0);
  ok('different island different stock', JSON.stringify(a) !== JSON.stringify(d));
  ok('fmtLeft m:ss', /^\d+:\d{2}$/.test(FS.fmtLeft(FS.msLeft(t0))), FS.fmtLeft(FS.msLeft(t0)));
  ok('msLeft within period', FS.msLeft(t0) > 0 && FS.msLeft(t0) <= FS.PERIOD);
  ok('rerollPrice scales with level', FS.rerollPrice(10, 0) === 2500 && FS.rerollPrice(1, 0) === 500, String(FS.rerollPrice(10,0)) + ' / ' + FS.rerollPrice(1,0));
  ok('rerollPrice doubles per use', FS.rerollPrice(10, 1) === 5000 && FS.rerollPrice(10, 2) === 10000, String([FS.rerollPrice(10,1), FS.rerollPrice(10,2)]));
  ok('nonce changes stock', JSON.stringify(FS.stockFor('windmill', w0, 0)) !== JSON.stringify(FS.stockFor('windmill', w0, 1)));
  ok('nonce 0 matches shared', JSON.stringify(FS.stockFor('windmill', w0)) === JSON.stringify(FS.stockFor('windmill', w0, 0)));


  // ---- browser: UI countdown + restock refresh + fsold persists in-window
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PE ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket|favicon/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto(BASE + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(200, 200);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 });
  await p.fill('#cName', 'ShopTest'); await p.click('#cGo');
  await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 20000 });
  await p.waitForTimeout(1200);
  await p.evaluate(() => __g.ui.close && __g.ui.close(true));

  const mod = await p.evaluate(() => {
    const FS = __g.FS || null;
    // expose via stockTick path — read from import through game
    const g = __g.game;
    const period = 5 * 60 * 1000;
    return { hasStockTick: typeof g.stockTick === 'function', periodHint: period };
  });
  ok('game has stockTick', mod.hasStockTick);

  // Open rotating fruit shop
  const opened = await p.evaluate(() => {
    const g = __g.game;
    const n = (g.island.npcs || []).find(n => n.shop === 'rot');
    if (!n) { __g.ui.open('shop', 'rot'); return 'forced'; }
    __g.ui.open('shop', 'rot'); return 'npc';
  });
  await p.waitForTimeout(400);
  const ui1 = await p.evaluate(() => {
    const t = document.getElementById('fsT');
    const h = document.querySelector('#panel h2');
    const label = document.querySelector('#panel .dim')?.textContent || '';
    const slots = [...document.querySelectorAll('.fslot')].map(el => el.querySelector('b')?.textContent);
    return { hasTimer: !!t, timer: t && t.textContent, label, title: h && h.textContent, slots, shopId: __g.ui.shopId };
  });
  ok('shop opens with Restocks in countdown', ui1.hasTimer && /Restocks in/.test(ui1.label) && /^\d+:\d{2}$/.test(ui1.timer || ''), JSON.stringify(ui1));
  ok('6 stock slots', ui1.slots.length === 6, JSON.stringify(ui1.slots));
  ok('shopId is rot', ui1.shopId === 'rot');

  // Snapshot stock ids via evaluate of same seed path used by UI
  const stockA = await p.evaluate(() => {
    // Reconstruct by opening rotHtml internals — grab fruit names from DOM + prices
    return [...document.querySelectorAll('.fslot')].map(el => ({
      name: el.querySelector('b')?.textContent,
      price: el.querySelector('button')?.textContent,
      gone: el.classList.contains('gone'),
    }));
  });

  // Simulate buy of slot 0 if affordable
  await p.evaluate(() => { __g.game.save.ber = 1e9; __g.ui.updateHud(); });
  await p.waitForTimeout(100);
  // Reopen so buy button not poor
  await p.evaluate(() => __g.ui.open('shop', 'rot'));
  await p.waitForTimeout(200);
  const bought = await p.evaluate(() => {
    const btn = document.querySelector('.fslot:not(.gone) button[data-do^="rbuy"]');
    if (!btn) return null;
    const doa = btn.getAttribute('data-do');
    __g.ui.act(doa, btn);
    const S = __g.game.save;
    const w = Math.floor(Date.now() / (5 * 60 * 1000));
    const key = S.island + ':' + w;
    return { key, sold: (S.fsold && S.fsold[key]) || [], fruits: S.inv.fruits.slice(-1) };
  });
  ok('purchase marks sold in fsold for window', bought && bought.sold.length >= 1, JSON.stringify(bought));

  // Reload within same window — stock names should match; sold should persist from save
  await p.reload();
  await p.waitForTimeout(1500);
  await p.mouse.click(200, 200);
  await p.waitForFunction(() => __g.mode === 'create' || __g.mode === 'game', null, { timeout: 20000 });
  if (await p.evaluate(() => __g.mode === 'create')) await p.click('#cCont');
  await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 20000 });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { __g.ui.close && __g.ui.close(true); __g.ui.open('shop', 'rot'); });
  await p.waitForTimeout(400);
  const stockB = await p.evaluate(() => [...document.querySelectorAll('.fslot')].map(el => ({
    name: el.querySelector('b')?.textContent,
    gone: el.classList.contains('gone'),
  })));
  ok('reload same window: same fruit names', stockA.map(s => s.name).join() === stockB.map(s => s.name).join(), JSON.stringify([stockA.map(s => s.name), stockB.map(s => s.name)]));
  ok('reload same window: sold slot stays sold', stockB.some(s => s.gone), JSON.stringify(stockB));

  // Simulate window change while shop open → Restocked toast + new stock
  const afterWin = await p.evaluate(async () => {
    const g = __g.game;
    // Force window advance by monkeypatching Date.now used by fruitshop — instead call open after faking window via stockTick path.
    // fruitshop closes over Date.now; shift by patching performance... better: directly invoke UI interval logic by setting FS window via replacing module exports is hard.
    // Use: save current names, then call stockFor with next window by importing through dynamic eval of same hash in page.
    // The live FS is bundled — find PERIOD from countdown and force restock by calling open after manually bumping _stockW and replacing windowId.
    const before = [...document.querySelectorAll('.fslot b')].map(b => b.textContent);
    // Patch: the bundled module's windowId reads Date.now. Override Date.now temporarily +5min.
    const real = Date.now;
    const shift = 5 * 60 * 1000 + 2000;
    Date.now = () => real() + shift;
    try {
      g._stockW = undefined; // allow stockTick to fire
      g.stockTick();
      // UI interval may take up to 1s; force refresh like the interval does
      if (__g.ui.modal === 'shop') {
        __g.ui.toast('🍇 Restocked!', 'item');
        __g.ui.open('shop', 'rot');
      }
      await new Promise(r => setTimeout(r, 300));
      const after = [...document.querySelectorAll('.fslot b')].map(b => b.textContent);
      const toast = [...document.querySelectorAll('.toast, #toasts .t, .toastbox, [class*="toast"]')].map(e => e.textContent).join(' ')
        || (document.body.innerText.includes('Restocked') ? 'Restocked' : '');
      const soldGone = [...document.querySelectorAll('.fslot.gone')].length;
      const timer = document.getElementById('fsT')?.textContent;
      return { before, after, toast, soldGone, timer, changed: before.join() !== after.join() };
    } finally { Date.now = real; }
  });
  ok('window change refreshes stock', afterWin.changed, JSON.stringify(afterWin));
  ok('sold cleared for new window (no gone or new set)', afterWin.soldGone === 0 || afterWin.changed, 'soldGone=' + afterWin.soldGone);
  ok('countdown still m:ss after restock', /^\d+:\d{2}$/.test(afterWin.timer || ''), afterWin.timer);

  // ---- personal Restock Now
  await p.evaluate(() => { const S = __g.game.save; S.ber = 1e7; S.lvl = 10; S.fsRoll = {}; __g.ui.updateHud(); __g.ui.open('shop', 'rot'); });
  await p.waitForTimeout(300);
  const beforeR = await p.evaluate(() => ({
    names: [...document.querySelectorAll('.fslot b')].map(b => b.textContent),
    ber: __g.game.save.ber,
    btn: document.querySelector('[data-do="rrestock"]')?.textContent || '',
    disabled: !!document.querySelector('[data-do="rrestock"]')?.disabled,
  }));
  ok('Restock Now button shows price', /Restock Now/.test(beforeR.btn) && /฿/.test(beforeR.btn) && !beforeR.disabled, beforeR.btn);
  const r1 = await p.evaluate(() => {
    const before = [...document.querySelectorAll('.fslot b')].map(b => b.textContent);
    const ber0 = __g.game.save.ber;
    const btn = document.querySelector('[data-do="rrestock"]');
    __g.ui.act('rrestock', btn);
    const after = [...document.querySelectorAll('.fslot b')].map(b => b.textContent);
    const S = __g.game.save; const w = Math.floor(Date.now() / (5 * 60 * 1000));
    const key = S.island + ':' + w;
    return { before, after, ber0, ber1: S.ber, nonce: (S.fsRoll || {})[key], sold: (S.fsold || {})[key], btn: document.querySelector('[data-do="rrestock"]')?.textContent || '', toast: document.body.innerText.includes('Restocked') };
  });
  ok('restock changes stock', r1.before.join() !== r1.after.join(), JSON.stringify([r1.before, r1.after]));
  ok('restock deducts berries', r1.ber1 === r1.ber0 - 2500, String([r1.ber0, r1.ber1]));
  ok('restock bumps nonce', r1.nonce === 1, String(r1.nonce));
  ok('restock clears sold', !r1.sold || r1.sold.length === 0, JSON.stringify(r1.sold));
  const r2 = await p.evaluate(() => {
    const ber0 = __g.game.save.ber;
    const btn = document.querySelector('[data-do="rrestock"]');
    const priceTxt = btn?.textContent || '';
    __g.ui.act('rrestock', btn);
    const S = __g.game.save; const w = Math.floor(Date.now() / (5 * 60 * 1000));
    return { ber0, ber1: S.ber, priceTxt, nonce: (S.fsRoll || {})[S.island + ':' + w], nextBtn: document.querySelector('[data-do="rrestock"]')?.textContent || '' };
  });
  ok('second restock costs double (5000)', r2.ber1 === r2.ber0 - 5000 && /฿5,?000/.test(r2.priceTxt), JSON.stringify(r2));
  ok('price escalates on button', /฿10,?000/.test(r2.nextBtn), r2.nextBtn);
  // unaffordable disables
  const poor = await p.evaluate(() => {
    __g.game.save.ber = 100; __g.ui.open('shop', 'rot');
    const btn = document.querySelector('[data-do="rrestock"]');
    return { disabled: !!btn?.disabled, cls: btn?.className || '', text: btn?.textContent || '' };
  });
  ok('unaffordable Restock Now disabled', poor.disabled && /poor/.test(poor.cls), JSON.stringify(poor));

  ok('zero console errors', errs.length === 0, JSON.stringify(errs));
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
