const { chromium } = require('playwright-core'); const BASE = process.env.BASE || 'http://localhost:4180';
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [];
  for (const [tag, vp, touch] of [['pc', { width: 960, height: 540 }, false], ['port', { width: 390, height: 844 }, true]]) {
  const p = await (await b.newContext({ viewport: vp, hasTouch: touch, isMobile: touch })).newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/?skip&anytap'); await p.waitForTimeout(1200); if (touch) await p.touchscreen.tap(195, 420); else await p.mouse.click(480, 270); await p.waitForFunction(() => __g.mode === 'create'); await p.evaluate(() => document.querySelector('#cGo').click()); await p.waitForTimeout(1500);
  for (const [n, ph, storm] of [['day', 0.3, 0], ['dusk', 0.585, 0], ['night', 0.75, 0], ['storm', 0.3, 1]]) {
    await p.evaluate(([ph, storm]) => { const g = __g.game; g.amb.phase = () => ph; g.amb.storm = storm; g.amb.stormT = storm ? 60 : 0; g._clk = 0; g.p.yaw = Math.PI * 0.8; g.p.pitch = 0.05; }, [ph, storm]); await p.waitForTimeout(700);
    await p.screenshot({ path: `${__dirname}/../shots/dn_${tag}_${n}.png` }); if (tag === 'port') break; }
  console.log(tag, await p.evaluate(() => document.getElementById('clock').textContent)); }
  console.log('ERRS', errs); await b.close(); })();
