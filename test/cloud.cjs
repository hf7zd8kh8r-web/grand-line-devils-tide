// cloud profiles e2e: device A (phone) creates w/ PIN, device B (PC) loads, newest wins, offline fallback. BASE=http://localhost:8091
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8091';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = []; const mk = async (opt) => { const c = await b.newContext(opt); const p = await c.newPage(); p.on('pageerror', e => errs.push('PE ' + e.message)); return [c, p]; };
  const toCreate = async (p, W, H) => { await p.goto(BASE + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(W / 2, H / 2); await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); };
  const name = 'Zoro' + Math.floor(Math.random() * 1e4);
  // device A: create with PIN
  const [cA, A] = await mk({ viewport: { width: 844, height: 390 } }); await toCreate(A, 844, 390);
  await A.fill('#cName', name); await A.click('#cRace button[data-v=Mink]'); await A.fill('#cPin', '4821'); await A.click('#cGo');
  await A.waitForFunction(() => __g.mode === 'game', null, { timeout: 15000 }); await A.waitForTimeout(500);
  console.log('A cloud key set', await A.evaluate(() => !!JSON.parse(localStorage.getItem('gldt_cloud') || '{}').key));
  await A.evaluate(() => { const g = __g.game; g.save.ber = 777; g.save.lvl = 4; __g.saveNow(); }); await A.waitForTimeout(5500);
  // device B: load
  const [cB, B] = await mk({ viewport: { width: 1280, height: 800 } }); await toCreate(B, 1280, 800);
  await B.click('#cLoadBtn'); await B.fill('#lName', name.toLowerCase()); await B.selectOption('#lRace', 'Mink'); await B.fill('#lPin', '1111'); await B.click('#lGo'); await B.waitForTimeout(800);
  console.log('B wrong PIN ->', await B.textContent('#lMsg'));
  await B.fill('#lPin', '4821'); await B.click('#lGo'); await B.waitForFunction(() => __g.mode === 'game', null, { timeout: 15000 });
  const bs = await B.evaluate(() => [__g.game.save.name, __g.game.save.ber, __g.game.save.lvl]); console.log('B loaded', bs, bs[1] === 777 ? 'PASS' : 'FAIL');
  // B progresses; A (stale) tries to push older progress -> must not overwrite
  await B.evaluate(() => { __g.game.save.ber = 5000; __g.saveNow(); }); await B.waitForTimeout(5500);
  const conflict = await A.evaluate(async () => { const S = __g.game.save; S.ber = 1; S.savedAt = Date.now() - 60000; await __g.CL.push(S); return __g.CL.cloud.status; }); console.log('A stale push ->', conflict, conflict === 'conflict' ? 'PASS' : 'FAIL');
  // A reloads + Continue -> gets B's newer progress
  await A.waitForTimeout(4000); await A.waitForFunction(() => __g.mode === 'create' || __g.mode === 'cover' || __g.mode === 'logo', null, { timeout: 15000 }).catch(() => {}); await A.waitForTimeout(1200); await A.mouse.click(422, 195); await A.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await A.click('#cCont'); await A.waitForFunction(() => __g.mode === 'game', null, { timeout: 15000 });
  const ab = await A.evaluate(() => __g.game.save.ber); console.log('A continue -> ber', ab, ab === 5000 ? 'PASS' : 'FAIL');
  // offline: block API, play, autosave stays local, then sync when back
  await cB.route('**/api/profile/**', r => r.abort()); await B.evaluate(() => { __g.game.save.ber = 6000; __g.saveNow(); }); await B.waitForTimeout(5000);
  console.log('B offline status', await B.evaluate(() => __g.CL.statusText()), 'local ber', await B.evaluate(() => JSON.parse(localStorage.getItem('gldt_save_v1')).ber));
  await cB.unroute('**/api/profile/**'); await B.evaluate(() => __g.CL.push(__g.game.save)); await B.waitForTimeout(800); console.log('B back online', await B.evaluate(() => __g.CL.statusText()));
  await B.evaluate(() => __g.ui.open('pause')); await B.waitForTimeout(300); await B.screenshot({ path: `${__dirname}/../shots/cloud_pause.png` });
  await A.evaluate(() => __g.ui.close(true)); await A.goto(BASE + '/?skip&anytap'); await A.waitForTimeout(1200); await A.mouse.click(422, 195); await A.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await A.click('#cLoadBtn'); await A.waitForTimeout(200); await A.screenshot({ path: `${__dirname}/../shots/cloud_load_land.png` });
  console.log('ERRS', errs); await b.close(); })();
