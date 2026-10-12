// rotation re-layout: cover + game, portrait <-> landscape
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message));
  const chk = async tag => { await p.waitForTimeout(700); const r = await p.evaluate(() => { const c = document.getElementById('gl').getBoundingClientRect(); const g = __g.game; const cam = g && g.cam; const tb = document.querySelector('#topbtns').getBoundingClientRect(); return { styleW: document.getElementById('gl').style.width, bw: document.getElementById('gl').width, vw: innerWidth, vh: innerHeight, cw: Math.round(c.width), ch: Math.round(c.height), aspect: cam ? +cam.aspect.toFixed(3) : null, topbtnsIn: tb.right <= innerWidth + 1 && tb.top >= 0 }; }); const ok = r.cw === r.vw && r.ch === r.vh && (r.aspect === null || Math.abs(r.aspect - r.vw / r.vh) < 0.01); console.log(tag, JSON.stringify(r), ok ? 'PASS' : 'FAIL'); await p.screenshot({ path: `${__dirname}/../shots/rot_${tag}.png` }); };
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/?anytap'); await p.waitForTimeout(5000); await p.setViewportSize({ width: 844, height: 390 }); await chk('cover_land');
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300); await p.touchscreen.tap(195, 420); await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForTimeout(1500); await chk('game_port');
  await p.setViewportSize({ width: 844, height: 390 }); await chk('game_land'); await p.setViewportSize({ width: 390, height: 844 }); await chk('game_port2'); await p.setViewportSize({ width: 932, height: 430 }); await chk('game_land2');
  console.log('ERRS', errs); await b.close(); })();
