// fishing rod in hands (cast / wait / bite / reel), species variety, rare fruit catch, cooler sell/cook
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:4180';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = []; const out = `${__dirname}/../shots/`;
  for (const [tag, vp, touch] of [['pc', { width: 1280, height: 720 }, false], ['land', { width: 844, height: 390 }, true]]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1 }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ' PE ' + e.message));
    await p.goto(BASE + '/?skip&anytap'); await p.waitForTimeout(1200); if (touch) await p.touchscreen.tap(vp.width / 2, vp.height / 2); else await p.mouse.click(vp.width / 2, vp.height / 2);
    await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.evaluate(() => document.querySelector('#cGo').click()); await p.waitForTimeout(1500);
    await p.evaluate(() => { const g = __g.game; g.p.pos.set(0, 0.85, 64); g.p.yaw = Math.PI; g.p.pitch = -0.2; __g.IN.pressed.add('fish'); });
    await p.waitForTimeout(450); await p.screenshot({ path: out + `fish_${tag}_cast.png` });
    await p.waitForTimeout(1200); const st1 = await p.evaluate(() => __g.game.fishing.state); await p.screenshot({ path: out + `fish_${tag}_wait.png` });
    await p.evaluate(() => { __g.game.fishing.t = 0.01; }); await p.waitForTimeout(250); const st2 = await p.evaluate(() => __g.game.fishing.state); await p.screenshot({ path: out + `fish_${tag}_bite.png` });
    await p.evaluate(() => __g.game.fishing.press()); await p.waitForTimeout(150); await p.screenshot({ path: out + `fish_${tag}_reel.png` });
    console.log(tag, 'states', st1, st2);
    if (tag === 'pc') { const r = await p.evaluate(() => { const g = __g.game, S = g.save, F = g.fishing; const f0 = S.inv.fruits.length; let pop = 0; const cp = g.ui.chestPopup.bind(g.ui); g.ui.chestPopup = (x) => { pop++; }; const toast = g.ui.toast; g.ui.toast = () => {};
        for (let i = 0; i < 2000; i++) { F.spot = g.p.pos.clone(); F.catch(); } g.ui.chestPopup = cp; g.ui.toast = toast;
        const species = Object.keys(S.fishdex).length; const fruits = S.stats.fishFruits || 0; const fish = Object.values(S.inv.fish).reduce((a, b) => a + b, 0);
        const ber0 = S.ber; S.hp = 10; g.ui.open('inv', 'fish'); const html = document.querySelector('#panel').innerText.slice(0, 160);
        return { species, fruits, fish, chests: S.stats.chests, html }; }); console.log('2000 catches', JSON.stringify(r));
      await p.waitForTimeout(400); await p.screenshot({ path: out + `fish_${tag}_cooler.png` });
      const r2 = await p.evaluate(() => { const g = __g.game, S = g.save; const hp0 = S.hp; const n = Object.keys(S.inv.fish).find(k => k === 'Lobster') || Object.keys(S.inv.fish)[0]; document.querySelector(`[data-do="fcook:${n}"]`).click(); const hp1 = S.hp; const b0 = S.ber; document.querySelector('[data-do^="fsellall"]').click(); return { cooked: n, hp0, hp1, fed: g.fed, sold: S.ber - b0, left: Object.keys(S.inv.fish).length }; }); console.log('cook/sell', JSON.stringify(r2)); }
    await ctx.close(); }
  console.log('ERRS', errs); await b.close(); })();
