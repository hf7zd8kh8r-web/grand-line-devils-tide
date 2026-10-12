// third-person camera: node test/tp.cjs WxH [touch]
const { chromium } = require('playwright-core');
const [W, H] = (process.argv[2] || '1280x800').split('x').map(Number); const touch = process.argv[3] === 'touch';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext(touch ? { viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: W, height: H } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  const shot = n => p.screenshot({ path: `${__dirname}/../shots/tp_${W}_${n}.png` });
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/?skip&anytap'); await p.waitForTimeout(1200); if (touch) await p.touchscreen.tap(W / 2, H / 2); else await p.mouse.click(W / 2, H / 2);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForTimeout(1500);
  if (touch) await p.tap('#camBtn'); else { await p.keyboard.press('KeyV'); }
  await p.waitForTimeout(800); console.log('tp on', await p.evaluate(() => __g.game.tpv.on + ' saved=' + localStorage.getItem('gldt_cam')));
  await p.evaluate(() => { const g = __g.game; g.p.yaw = Math.PI; g.p.pitch = -0.1; }); await p.waitForTimeout(500); await shot('fist');
  await p.evaluate(() => { const g = __g.game, S = g.save; const sw = Object.keys(__dbg.SWORDS || {})[0]; }); 
  await p.evaluate(() => { const g = __g.game, S = g.save; const ids = Object.keys(g.constructor && window.__SW || {}); }); 
  await p.evaluate(() => { const g = __g.game, S = g.save; S.inv.swords.push('enma'); S.eq.sword = 'enma'; S.slot = 'sword'; g.refreshEquip(); __g.IN.pressed.add('attack'); }); await p.waitForTimeout(150); await shot('sword');
  await p.evaluate(() => { const g = __g.game, S = g.save; S.inv.fruits.push('mera'); S.eq.fruit = 'mera'; S.slot = 'fruit'; g.refreshEquip(); }); await p.waitForTimeout(400); await shot('fruit');
  // walk forward for 1.2s (moving anim) and check camera behind player
  const r = await p.evaluate(async () => { const g = __g.game; __g.IN.mz = 1; await new Promise(r => setTimeout(r, 1200)); __g.IN.mz = 0; const c = g.cam.position, P = g.p.pos; return { camDist: +Math.hypot(c.x - P.x, c.z - P.z).toFixed(2), bodyVis: g.tpv.body && g.tpv.body.root.visible, vm: g.vm.root.visible }; }); console.log('walk', JSON.stringify(r)); await shot('walk');
  // wall collision: back the player against a house so the camera must pull in
  const wall = await p.evaluate(async () => { const g = __g.game; const c = g.island.colliders.find(c => c.hw !== undefined && c.hw > 2); if (!c) return 'no box'; const P = g.p.pos; P.set(c.x, 0, c.z + c.hd + 0.7); P.y = g.groundAt(P.x, P.z); g.p.yaw = Math.PI; g.p.pitch = 0; await new Promise(r => setTimeout(r, 900)); const cp = g.cam.position; return { camDist: +Math.hypot(cp.x - P.x, cp.z - P.z).toFixed(2) }; }); console.log('wall', JSON.stringify(wall)); await shot('wall');
  await p.reload(); await p.waitForTimeout(1200); if (touch) await p.touchscreen.tap(W / 2, H / 2); else await p.mouse.click(W / 2, H / 2); await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cCont').catch(() => p.click('#cGo')); await p.waitForTimeout(1500);
  console.log('remembered after reload', await p.evaluate(() => __g.game.tpv.on));
  console.log('ERRS', errs); await b.close(); })();
