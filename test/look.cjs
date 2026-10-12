// touch-look robustness on phone landscape
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); const errs = []; const cdp = await ctx.newCDPSession(p);
  p.on('pageerror', e => errs.push('PE ' + e.message));
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/?skip&anytap'); await p.waitForTimeout(1200); await p.touchscreen.tap(422, 195); await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForTimeout(1500);
  const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(q => ({ x: q[0], y: q[1], id: q[2] })) });
  const st = () => p.evaluate(() => { const g = __g.game; return { yaw: +g.p.yaw.toFixed(3), pitch: +g.p.pitch.toFixed(3), roll: +g.cam.rotation.z.toFixed(4) }; });
  let s0 = await st();
  // lift + re-land far away: the landing must not jump the view
  await T('touchStart', [[600, 200, 1]]); await T('touchMove', [[610, 200, 1]]); await T('touchEnd', []); let s1 = await st();
  await T('touchStart', [[780, 330, 2]]); await T('touchMove', [[781, 330, 2]]); await p.waitForTimeout(50); let s2 = await st(); await T('touchEnd', []);
  console.log('re-land jump yaw delta', (s2.yaw - s1.yaw).toFixed(3), Math.abs(s2.yaw - s1.yaw) < 0.02 ? 'PASS' : 'FAIL');
  // spike: one 500px move event
  await T('touchStart', [[500, 200, 3]]); await T('touchMove', [[501, 200, 3]]); const a = await st(); await T('touchMove', [[1, 200, 3]]); await p.waitForTimeout(50); const c = await st(); await T('touchEnd', []);
  { let d = c.yaw - a.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); console.log('500px spike yaw delta', d.toFixed(3), Math.abs(d) <= 0.41 ? 'PASS' : 'FAIL'); }
  // joystick + look, lift joystick first then look, then reverse; ids swapped
  for (const order of [[4, 5], [5, 4]]) { await T('touchStart', [[100, 300, 4]]); await T('touchStart', [[100, 300, 4], [600, 200, 5]]); for (let i = 0; i < 5; i++) await T('touchMove', [[100, 260, 4], [600 + i * 5, 200, 5]]);
    const keep = order[0] === 4 ? [[600 + 25, 200, 5]] : [[100, 260, 4]]; await T('touchEnd', keep); await T('touchEnd', []); }
  // resize mid-drag then keep moving the same finger: no jump
  await T('touchStart', [[600, 200, 6]]); await T('touchMove', [[602, 200, 6]]); await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300); const r0 = await st(); await T('touchMove', [[300, 600, 6]]); await p.waitForTimeout(50); const r1 = await st(); await T('touchEnd', []);
  console.log('resize mid-drag yaw delta', (r1.yaw - r0.yaw).toFixed(3), Math.abs(r1.yaw - r0.yaw) < 0.01 ? 'PASS' : 'FAIL');
  await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(300);
  // pitch clamp
  for (let k = 0; k < 3; k++) { await T('touchStart', [[600, 50, 7]]); for (let i = 1; i < 8; i++) await T('touchMove', [[600, 50 + i * 40, 7]]); await T('touchEnd', []); }
  const pc = await st(); console.log('pitch after big drags', pc.pitch, 'roll', pc.roll, Math.abs(pc.pitch) <= 1.35 && pc.roll === 0 ? 'PASS' : 'FAIL');
  await p.evaluate(() => __g.game.resetCamera()); console.log('after reset', JSON.stringify(await st()));
  console.log('ERRS', errs); await b.close(); })();
