// landscape phone pass: node test/land.cjs 844x390 [prefix]
const { chromium } = require('playwright-core');
const [W, H] = (process.argv[2] || '844x390').split('x').map(Number); const pre = (process.argv[3] || 'L_') + W + '_';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage(); const errs = []; const cdp = await ctx.newCDPSession(p);
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  const shot = async n => { await p.screenshot({ path: `${__dirname}/../shots/${pre}${n}.png` }); console.log('shot', n); };
  const fit = async n => { const r = await p.evaluate(() => { const o = []; const vw = innerWidth, vh = innerHeight; document.querySelectorAll('#panel .pbox, #panel .pbox .tabs, #hud .tb, #hud #moves, #hud #slots, #topbtns, #stat, #quest, #compass, #joy, .vbtns, #sail button').forEach(el => { const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden' || !el.offsetParent && s.position !== 'fixed') return; const r = el.getBoundingClientRect(); if (r.width === 0) return; if (r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1) o.push((el.id || el.className) + ' ' + [r.left, r.top, r.right, r.bottom].map(Math.round).join(',')); }); return o; }); if (r.length) console.log('OFFSCREEN', n, r); };
  const over = async n => { const r = await p.evaluate(() => { const els = [...document.querySelectorAll('#hud .tb, #hud #moves button, #hud #slots .hudbtn, #topbtns > *, #joy')].filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0); const o = []; for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i].getBoundingClientRect(), c = els[j].getBoundingClientRect(); const ix = Math.min(a.right, c.right) - Math.max(a.left, c.left), iy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top); if (ix > 6 && iy > 6 && !els[i].contains(els[j]) && !els[j].contains(els[i])) o.push((els[i].id || els[i].className || els[i].textContent).slice(0, 18) + ' x ' + (els[j].id || els[j].className || els[j].textContent).slice(0, 18)); } return o; }); if (r.length) console.log('OVERLAP', n, r); };
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/?anytap'); await p.waitForTimeout(6000); await shot('cover'); await p.touchscreen.tap(W / 2, H / 2);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.waitForTimeout(500); await shot('create'); await fit('create'); await p.click('#cGo'); await p.waitForTimeout(1500);
  await shot('hud0'); await over('hud0'); await fit('hud0');
  await p.evaluate(() => { const g = __g.game; g.save.fruit = 'gomu'; g.save.lvl = 30; g.save.ber = 99999; g.save.eq = g.save.eq || {}; g.save.inv = g.save.inv || {}; g.equipFruit ? g.equipFruit('gomu') : 0; __g.ui.updateMoves && __g.ui.updateMoves(); __g.ui.updateHud && __g.ui.updateHud(); });
  await p.waitForTimeout(500); await shot('hud_fruit'); await over('hud_fruit'); await fit('hud_fruit');
  const T = async (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(q => ({ x: q[0], y: q[1], id: q[2] })) });
  const y0 = await p.evaluate(() => __g.game.p.yaw); await T('touchStart', [[W * 0.62, H * 0.4, 1]]); for (let i = 1; i <= 10; i++) { await T('touchMove', [[W * 0.62 - i * 8, H * 0.4, 1]]); await p.waitForTimeout(16); } await T('touchEnd', []);
  console.log('look yaw', ((await p.evaluate(() => __g.game.p.yaw)) - y0).toFixed(3));
  const J = await p.evaluate(() => { const r = document.getElementById('joy').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); const q0 = await p.evaluate(() => __g.game.p.pos.clone());
  await T('touchStart', [[J[0], J[1], 2]]); for (let i = 1; i <= 6; i++) { await T('touchMove', [[J[0], J[1] - i * 9, 2]]); await p.waitForTimeout(16); } await p.waitForTimeout(800); await T('touchEnd', []);
  const q1 = await p.evaluate(() => __g.game.p.pos.clone()); console.log('joy move', Math.hypot(q1.x - q0.x, q1.z - q0.z).toFixed(2));
  for (const [n, a, t] of [['bag', 'inv', 'gear'], ['bag_haki', 'inv', 'haki'], ['map', 'map'], ['shop', 'shop', 'rot'], ['dojo', 'dojo', 'all'], ['dex', 'dex', 'Legendary'], ['dock', 'dock', { name: 'Shipwright Dan' }], ['pause', 'pause'], ['style', 'style', 'shop']]) {
    await p.evaluate(([a, t]) => __g.ui.open(a, t), [a, t]); await p.waitForTimeout(400); await shot(n); await fit(n);
    const sc = await p.evaluate(() => { const b = document.querySelector('#panel .pbox'); return b ? [b.scrollHeight, b.clientHeight, getComputedStyle(b).overflowY] : null; }); if (sc && sc[0] > sc[1] && sc[2] === 'visible') console.log('NO SCROLL', n, sc); }
  await p.evaluate(() => __g.ui.close(true));
  // dialog with an NPC
  await p.evaluate(() => { const g = __g.game; const n = (g.npcs || []).find(n => n.role === 'quest') || (g.npcs || [])[0]; if (n) __g.ui.talk(n); }); await p.waitForTimeout(400); await shot('dialog'); await fit('dialog'); await p.evaluate(() => __g.ui.close(true));
  // boss intro cutscene
  await p.evaluate(() => { const g = __g.game; const e = g.enemies.find(e => e.boss); if (e) { const P = e.c.root.position; g.p.pos.set(P.x, 0, P.z + 9); g.p.pos.y = g.groundAt(g.p.pos.x, g.p.pos.z); g.bossIntro(e); } }); await p.waitForTimeout(1600); await shot('bosscut'); await p.waitForTimeout(3600);
  // rotate to portrait live and back
  await p.setViewportSize({ width: H, height: W }); await p.waitForTimeout(800); await shot('rot_portrait'); await fit('rot_portrait'); await p.setViewportSize({ width: W, height: H }); await p.waitForTimeout(800); await shot('rot_back'); await over('rot_back');
  console.log('canvas', await p.evaluate(() => { const c = document.querySelector('canvas'); return [c.width, c.height, innerWidth, innerHeight]; }));
  await p.evaluate(() => { __g.ui.close(true); __g.game.save.unlocked = ['windmill', 'shells']; __g.ui.onSail('shells'); }); await p.waitForTimeout(5000); await shot('voyage'); await fit('voyage');
  console.log('ERRS', errs); await b.close();
})();
