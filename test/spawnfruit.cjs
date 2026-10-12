// World Devil Fruit spawn: solo force/pickup/persist + 2-client first-pickup-wins. BASE=http://localhost:8099 node test/spawnfruit.cjs
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8099'; let fails = 0; const ok = (n, c, x = '') => { console.log(c ? 'PASS' : 'FAIL', n, x); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const mk = async (name, q, vp) => { const ctx = await b.newContext(vp || { viewport: { width: 844, height: 390 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ' PE ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket/.test(m.text())) errs.push(name + ' ' + m.text().slice(0, 200)); });
    await p.goto(BASE + '/?skip&anytap' + q); await p.waitForTimeout(1200); await p.mouse.click(200, 200);
    await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.fill('#cName', name); await p.click('#cGo'); await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 20000 }); await p.waitForTimeout(1500); await p.evaluate(() => __g.ui.close && __g.ui.close(true)); return p; };
  const goTo = (p) => p.evaluate(() => { const g = __g.game, o = g.hunt.obj; if (!o) return false; g.p.pos.set(o.x + 1.2, o.y, o.z + 1.2); g.p.yaw = Math.atan2(1.2, 1.2); g.p.pitch = -0.35; return true; });
  // ---- solo
  const s = await mk('Solo', '');
  await s.evaluate(() => __forceFruit('mera')); await s.waitForTimeout(800);
  ok('solo spawn placed', await goTo(s)); await s.waitForTimeout(600);
  await s.screenshot({ path: __dirname + '/../shots/spawnfruit_solo_close.png' });
  await s.evaluate(() => { const g = __g.game, o = g.hunt.obj; g.p.pos.set(o.x + 7, o.y, o.z + 7); g.p.pos.y = g.groundAt(g.p.pos.x, g.p.pos.z); g.p.yaw = Math.atan2(7, 7); g.p.pitch = -0.12; }); await s.waitForTimeout(700);
  await s.screenshot({ path: __dirname + '/../shots/spawnfruit_solo_far.png' });
  await goTo(s); await s.waitForTimeout(400);
  const pr = await s.evaluate(() => [__g.game.hunt.near, document.getElementById('prompt').innerText]); ok('pickup prompt', pr[0] && /Devil Fruit/.test(pr[1]), pr[1]);
  await s.keyboard.press('KeyE'); await s.waitForTimeout(600);
  const inv = await s.evaluate(() => [__g.game.save.inv.fruits.slice(), __g.game.save.stats.fruitsFound, !!__g.game.hunt.obj, JSON.parse(localStorage.getItem('gldt_save_v1')).sfGot]);
  ok('fruit in bag', inv[0].includes('mera') && inv[1] === 1 && !inv[2], JSON.stringify(inv));
  await s.reload(); await s.waitForTimeout(1500); await s.mouse.click(200, 200); await s.waitForFunction(() => __g.mode === 'create' || __g.mode === 'game', null, { timeout: 20000 }); if (await s.evaluate(() => __g.mode === 'create')) await s.click('#cCont'); await s.waitForFunction(() => __g.mode === 'game', null, { timeout: 20000 }); await s.waitForTimeout(2000);
  const after = await s.evaluate(() => __g.mode === 'game' ? [!!__g.game.hunt.obj, __g.game.hunt.cur && __g.game.hunt.cur.taken, __g.game.save.inv.fruits.length] : __g.mode); ok('stays collected after reload', Array.isArray(after) && !after[0] && after[1], JSON.stringify(after));
  // ---- 2 clients
  const a = await mk('Adam', '&room=FRT' + Date.now() % 10000), room = await a.evaluate(() => __g.game.net.room);
  const c = await mk('Friend', '&room=' + room);
  await a.waitForTimeout(1000); await a.evaluate(() => __forceFruit('gomu', 'windmill')); await a.waitForTimeout(1200);
  const sa = await a.evaluate(() => __g.game.hunt.cur), sc = await c.evaluate(() => __g.game.hunt.cur);
  ok('both see same server spawn', sa.key === sc.key && sa.fruit === 'gomu' && sc.fruit === 'gomu', sa.key + ' ' + sc.key);
  const pa = await a.evaluate(() => [__g.game.hunt.obj.x, __g.game.hunt.obj.z]), pc = await c.evaluate(() => [__g.game.hunt.obj.x, __g.game.hunt.obj.z]); ok('same spot', Math.abs(pa[0] - pc[0]) < 1e-6 && Math.abs(pa[1] - pc[1]) < 1e-6, JSON.stringify([pa, pc]));
  await goTo(a); await goTo(c); await a.waitForTimeout(300);
  await Promise.all([a.evaluate(() => __g.game.hunt.pickup()), c.evaluate(() => __g.game.hunt.pickup())]); await a.waitForTimeout(1500);
  const ra = await a.evaluate(() => __g.game.save.inv.fruits.filter(f => f === 'gomu').length), rc = await c.evaluate(() => __g.game.save.inv.fruits.filter(f => f === 'gomu').length);
  ok('exactly one winner', ra + rc === 1, `adam=${ra} friend=${rc}`);
  const gone = await Promise.all([a, c].map(p => p.evaluate(() => !__g.game.hunt.obj && __g.game.hunt.cur.taken))); ok('vanished for everyone', gone[0] && gone[1]);
  ok('zero console errors', errs.length === 0, JSON.stringify(errs));
  await b.close(); process.exit(fails ? 1 : 0);
})();
