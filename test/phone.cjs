// phone pass: bag tabs, CDP touch drags (look + joystick), voyage HUD, fps.  node test/phone.cjs [prefix]
const { chromium } = require('playwright-core');
const pre = process.argv[2] || 'r1_phone_';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage(); const errs = []; const cdp = await ctx.newCDPSession(p);
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  const shot = async n => { await p.screenshot({ path: `${__dirname}/../shots/${pre}${n}.png` }); console.log('shot', n); };
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/?skip&anytap'); await p.waitForTimeout(1500); await p.touchscreen.tap(195, 420);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForTimeout(1500);
  console.log('quality', await p.evaluate(() => JSON.stringify({ q: __g.Q.level, a: __g.Q.auto, auto: localStorage.getItem('gldt_q_auto') })));
  const T = async (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((q, i) => ({ x: q[0], y: q[1], id: q[2] ?? i })) });
  // look drag on right half
  const y0 = await p.evaluate(() => __g.game.p.yaw); await T('touchStart', [[300, 400, 1]]); for (let i = 1; i <= 10; i++) { await T('touchMove', [[300 - i * 8, 400 + i * 2, 1]]); await p.waitForTimeout(16); } await T('touchEnd', []);
  const y1 = await p.evaluate(() => __g.game.p.yaw); console.log('look drag 80px -> yaw delta', (y1 - y0).toFixed(3));
  // joystick: hold forward on left side while looking (two fingers)
  const p0 = await p.evaluate(() => __g.game.p.pos.clone()); await T('touchStart', [[90, 700, 2]]); for (let i = 1; i <= 6; i++) { await T('touchMove', [[90, 700 - i * 10, 2]]); await p.waitForTimeout(16); }
  await T('touchStart', [[90, 640, 2], [300, 420, 3]]); for (let i = 1; i <= 10; i++) { await T('touchMove', [[90, 640, 2], [300 + i * 6, 420, 3]]); await p.waitForTimeout(30); }
  await p.waitForTimeout(700); await T('touchEnd', []); const p1 = await p.evaluate(() => __g.game.p.pos.clone());
  console.log('joystick move dist', Math.hypot(p1.x - p0.x, p1.z - p0.z).toFixed(2), 'yaw after 2-finger', (await p.evaluate(() => __g.game.p.yaw) - y1).toFixed(3));
  const fps = await p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(n / 2); }; requestAnimationFrame(f); })); console.log('fps (swiftshader)', fps);
  await shot('hud');
  for (const t of ['gear', 'fruits', 'haki', 'stats']) { await p.evaluate(t => __g.ui.open('inv', t), t); await p.waitForTimeout(300); if (t === 'gear') await shot('bag'); }
  const ov = await p.evaluate(() => { const r = []; document.querySelectorAll('.tabs').forEach(tb => { if (tb.scrollWidth > tb.clientWidth + 2 || tb.getBoundingClientRect().right > innerWidth + 1) r.push(tb.className); }); return r; }); console.log('tab overflow', ov);
  await p.evaluate(() => { __g.ui.close(true); __g.game.save.unlocked = ['windmill', 'shells']; __g.ui.onSail('shells'); }); await p.waitForTimeout(6000); await shot('voyage'); console.log('q after play', await p.evaluate(() => __g.Q.level));
  console.log('route', await p.evaluate(() => __g.sail && __g.sail.R), 'eta', await p.evaluate(() => { const e = document.querySelector('.veta'); return e && e.textContent; }));
  console.log('ERRS', errs); await b.close();
})();
