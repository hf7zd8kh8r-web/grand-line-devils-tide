// stuck-movement + wearables-visible regression. BASE=http://localhost:8121 node test/stuckwear.cjs
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8080';
const launch = () => chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
async function start(b, mobile) {
  const ctx = await b.newContext(mobile ? { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket|ws:/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  await p.goto(BASE + '/?skip&anytap'); await p.evaluate(() => { for (const k of Object.keys(localStorage)) if (/save|gldt/i.test(k) && !/quality/.test(k)) localStorage.removeItem(k); }); await p.reload();
  await p.waitForTimeout(1200); if (mobile) await p.touchscreen.tap(422, 195); else await p.mouse.click(640, 360);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 25000 }); await p.waitForTimeout(1500);
  return { ctx, p, errs };
}
(async () => {
  const b = await launch(); let ok = true; const res = (n, v) => { console.log(v ? 'PASS' : 'FAIL', n); if (!v) ok = false; };
  { // desktop: missed keyups
    const { p, errs } = await start(b, false); const mz = () => p.evaluate(() => __g.IN.mz);
    await p.keyboard.down('KeyW'); await p.waitForTimeout(400); res('W held moves', (await mz()) === 1);
    await p.evaluate(() => dispatchEvent(new Event('blur'))); await p.waitForTimeout(100); res('blur clears W', (await mz()) === 0);
    await p.keyboard.up('KeyW');
    await p.keyboard.down('KeyD'); await p.waitForTimeout(80); await p.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); delete document.hidden; }); await p.waitForTimeout(80);
    res('visibilitychange clears D', (await p.evaluate(() => __g.IN.mx)) === 0); await p.keyboard.up('KeyD');
    await p.keyboard.down('Meta'); await p.keyboard.down('KeyA'); await p.evaluate(() => dispatchEvent(new KeyboardEvent('keyup', { code: 'MetaLeft', key: 'Meta' }))); await p.waitForTimeout(80);
    res('Cmd-combo keyup clears A', (await p.evaluate(() => __g.IN.mx)) === 0); await p.keyboard.up('KeyA'); await p.keyboard.up('Meta');
    // a UI handler that stops keyup propagation can no longer strand the key (window capture listener)
    await p.keyboard.down('KeyS'); await p.waitForTimeout(400); res('S held moves', (await mz()) === -1); await p.evaluate(() => { document.body.addEventListener('keyup', e => e.stopPropagation(), { once: true }); }); await p.keyboard.up('KeyS'); await p.waitForTimeout(300);
    res('keyup with stopPropagation still releases', (await mz()) === 0);
    console.log('desktop errors', errs); if (errs.length) ok = false; await p.context().close();
  }
  { // mobile: joystick
    const { p, errs, ctx } = await start(b, true); const cdp = await ctx.newCDPSession(p); const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(q => ({ x: q[0], y: q[1], id: q[2] })) });
    const st = () => p.evaluate(() => [+__g.IN.mx.toFixed(2), +__g.IN.mz.toFixed(2)]);
    await T('touchStart', [[150, 260, 1]]); await T('touchMove', [[150, 200, 1]]); await p.waitForTimeout(100); const a = await st(); res('joystick forward ' + a, a[1] > 0.9);
    await T('touchEnd', []); await p.waitForTimeout(80); res('touchend resets joystick', (await st()).join() === '0,0');
    // hold joystick and drag far off to the right over buttons / off-screen, then release
    await T('touchStart', [[150, 260, 2]]); await T('touchMove', [[400, 260, 2]]); await T('touchMove', [[840, 100, 2]]); await p.waitForTimeout(60); await T('touchEnd', []); await p.waitForTimeout(80);
    res('drag across screen + release resets', (await st()).join() === '0,0');
    // cancel (iOS system gesture)
    await T('touchStart', [[150, 260, 3]]); await T('touchMove', [[100, 260, 3]]); await T('touchCancel', []); await p.waitForTimeout(80); res('touchcancel resets', (await st()).join() === '0,0');
    // two fingers (joystick + look), CDP touchEnd lifts both
    await T('touchStart', [[150, 260, 4]]); await T('touchMove', [[150, 220, 4]]); await T('touchStart', [[150, 220, 4], [600, 200, 5]]); await T('touchMove', [[150, 215, 4], [640, 210, 5]]); await p.waitForTimeout(60);
    res('joystick held with a second look finger', (await st())[1] > 0.5); await T('touchEnd', []); await p.waitForTimeout(60); res('both lifted resets', (await st()).join() === '0,0');
    // walk test: hold forward 1.2 s, release, position must stop changing
    await T('touchStart', [[150, 260, 6]]); await T('touchMove', [[150, 200, 6]]); await p.waitForTimeout(1200); await T('touchEnd', []); await p.waitForTimeout(250);
    const p0 = await p.evaluate(() => [__g.game.p.pos.x, __g.game.p.pos.z]); await p.waitForTimeout(800); const p1 = await p.evaluate(() => [__g.game.p.pos.x, __g.game.p.pos.z]);
    res('player stops after release (moved ' + Math.hypot(p1[0] - p0[0], p1[1] - p0[1]).toFixed(3) + ')', Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 0.05);
    // panel opened mid-drag
    await T('touchStart', [[150, 260, 7]]); await T('touchMove', [[150, 200, 7]]); await p.evaluate(() => __g.ui.open('inv')); await p.waitForTimeout(100); await p.evaluate(() => __g.ui.close(true)); await p.waitForTimeout(100); res('panel mid-drag resets', (await st()).join() === '0,0'); await T('touchEnd', []);
    // ---- wearables visible ----
    const w = await p.evaluate(async () => { const g = __g.game, S = g.save; S.ber = 1e7; S.lvl = 120; for (const id of ['strawhat', 'marinecoat', 'catglasses']) if (!S.inv.wear.includes(id)) S.inv.wear.push(id); S.eq.wear = [];
      const ui = __g.ui; ui.open('inv', 'gear'); const btns = [...document.querySelectorAll('#panel [data-do^="equip:wear:"]')]; for (const id of ['strawhat', 'marinecoat', 'catglasses']) { const bt = document.querySelector(`#panel [data-do="equip:wear:${id}"]`); ui.act(bt.dataset.do, bt); await new Promise(r => setTimeout(r, 50)); }
      const label = (document.querySelector('#panel [data-do="equip:wear:strawhat"]') || {}).textContent; ui.close(true);
      return { eq: S.eq.wear.slice(), label, btns: btns.length }; });
    res('wear equipped from Bag ' + JSON.stringify(w), w.eq.length === 3 && /Wearing/.test(w.label || ''));
    // third-person body built with the outfit; screenshot
    await p.evaluate(() => { const g = __g.game; g.tpv.toggle(true); g.p.yaw = Math.PI; g.p.pitch = -0.15; }); await p.waitForTimeout(900);
    const hasHat = await p.evaluate(() => { const S = __g.game.save; return JSON.stringify(__g.game.tpv.key).includes('strawhat'); }); res('tpv avatar includes wear', hasHat);
    await p.evaluate(() => { const g = __g.game; g.tpv.toggle(false); g.showPreview(true); }); await p.waitForTimeout(900);
    await p.screenshot({ path: __dirname + '/../shots/outfit_on.png' });
    await p.evaluate(() => { const g = __g.game; g.showPreview(false); }); 
    console.log('mobile errors', errs); if (errs.length) ok = false;
  }
  await b.close(); console.log(ok ? 'ALL PASS' : 'SOME FAIL');
})();
