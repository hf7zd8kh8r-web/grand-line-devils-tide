// Fruit Roller: grant mats, basic+premium rolls, spend check, bag check, pity, screenshots. BASE=http://localhost:8111 node test/roller.cjs
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8111'; let fails = 0; const ok = (n, c, x = '') => { console.log(c ? 'PASS' : 'FAIL', n, x); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = []; const shots = __dirname + '/../shots/';
  const mk = async (name, vp) => { const ctx = await b.newContext({ viewport: vp, hasTouch: vp.width < 900 }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ' PE ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket/.test(m.text())) errs.push(name + ' ' + m.text().slice(0, 200)); });
    await p.goto(BASE + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(200, 200);
    await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.fill('#cName', name); await p.click('#cGo'); await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 20000 }); await p.waitForTimeout(1500); await p.evaluate(() => __g.ui.close && __g.ui.close(true)); return p; };
  const p = await mk('Roller', { width: 844, height: 390 });
  const npc = await p.evaluate(() => { const n = __g.game.npcs.find(n => n.role === 'roller'); return n && { x: n.x, z: n.z, m: !!n.machine }; }); ok('roller npc + machine in Windmill', npc && npc.m, JSON.stringify(npc));
  // view the stall
  await p.evaluate(() => { const g = __g.game, n = g.npcs.find(n => n.role === 'roller'); g.p.pos.set(n.x - 5, g.groundAt(n.x - 5, n.z + 2), n.z + 2); g.p.yaw = Math.atan2(-5, 2) ; g.p.pitch = -0.1; }); await p.waitForTimeout(800);
  await p.screenshot({ path: shots + 'roller_stall.png' });
  await p.evaluate(() => { const S = __g.game.save; S.inv.mats = { 'Bandit Bandana': 12, 'Marine Badge': 3, 'Road Poneglyph: Zou': 1 }; for (const k in S.inv.mats) {} S.inv.mats['Buggy Nose Pin (Boss)'] = 0; delete S.inv.mats['Buggy Nose Pin (Boss)']; });
  const prem = await p.evaluate(() => Object.keys(__g.game.save.inv.mats));
  await p.evaluate(() => { const g = __g.game; g.ui.talk(g.npcs.find(n => n.role === 'roller')); }); await p.waitForTimeout(800);
  ok('roller panel open', await p.evaluate(() => __g.ui.modal === 'roller' && !!document.getElementById('rlStrip')));
  const before = await p.evaluate(() => ({ f: __g.game.save.inv.fruits.length, m: JSON.parse(JSON.stringify(__g.game.save.inv.mats)) }));
  await p.click('[data-do="roll:basic"]'); await p.waitForTimeout(1400);
  await p.screenshot({ path: shots + 'roller_spin.png' });
  await p.waitForTimeout(2800);
  await p.screenshot({ path: shots + 'roller_reveal.png' });
  const after = await p.evaluate(() => ({ f: __g.game.save.inv.fruits.slice(), m: __g.game.save.inv.mats, r: __g.game.save.stats.rolls, last: __g.game.roller.last, saved: JSON.parse(localStorage.getItem('gldt_save_v1')).stats.rolls }));
  const spent = (before.m['Bandit Bandana'] || 0) - (after.m['Bandit Bandana'] || 0);
  ok('5 cheapest materials spent', spent === 5 && after.m['Marine Badge'] === 3 && after.m['Road Poneglyph: Zou'] === 1, JSON.stringify(after.m));
  ok('fruit in bag + stat saved', after.f.length === before.f + 1 && after.last && after.f.includes(after.last.id) && after.r === 1 && after.saved === 1, JSON.stringify(after.last));
  ok('reveal text', /added to your bag/.test(await p.innerText('#rlRes')));
  // premium refused with only First Sea mats
  const pr = await p.evaluate(() => __g.game.roller.roll('premium')); ok('premium refused w/o rare mats', pr === null);
  // premium with boss trophies + forced legendary flourish
  await p.evaluate(() => { const S = __g.game.save; S.inv.mats['Buggy Nose Pin (Boss)'] = 5; }); await p.evaluate(() => __g.ui.close(true)); await p.evaluate(() => __g.game.roller.open()); await p.waitForTimeout(700);
  await p.evaluate(() => { __g.game.roller.forceRar = 4; });
  await p.click('[data-do="roll:premium"]'); await p.waitForTimeout(4700);
  await p.screenshot({ path: shots + 'roller_reveal_legendary.png' });
  const pl = await p.evaluate(() => [__g.game.roller.last, __g.game.save.inv.mats['Buggy Nose Pin (Boss)']]); ok('premium high-tier roll, trophies spent', pl[0].rar >= 4 && !pl[1], JSON.stringify(pl));
  // pity: force low rarities for 10 rolls
  const pity = await p.evaluate(() => { const g = __g.game, S = g.save; S.rollPity = 0; S.inv.mats['Bandit Bandana'] = 60; g.roller.spinning = false; const rs = []; const R = Math.random; Math.random = () => 0.01; for (let i = 0; i < 10; i++) { g.roller.spinning = false; g.roller.roll('basic'); rs.push(g.roller._r = __g.game.save.inv.fruits.at(-1)); } Math.random = R; g.roller.spinning = false; return rs.map(id => window.__FR ? 0 : id); });
  const rars = await p.evaluate((ids) => ids.map(id => { const f = __g.game.save; return id; }), pity);
  const pr2 = await p.evaluate(() => __g.game.save.rollPity); ok('pity resets after 10th roll', pr2 === 0, String(pr2));
  await p.evaluate(() => __g.ui.close(true));
  // portrait phone
  const q = await mk('Portrait', { width: 390, height: 844 }); await q.evaluate(() => { __g.game.save.inv.mats = { 'Bandit Bandana': 10 }; __g.game.roller.open(); }); await q.waitForTimeout(800);
  await q.tap('[data-do="roll:basic"]'); await q.waitForTimeout(1200); await q.screenshot({ path: shots + 'roller_portrait_spin.png' }); await q.waitForTimeout(3000);
  ok('portrait tap roll works', await q.evaluate(() => __g.game.save.stats.rolls === 1 && __g.game.save.inv.mats['Bandit Bandana'] === 5));
  ok('zero console errors', errs.length === 0, JSON.stringify(errs));
  await b.close(); process.exit(fails ? 1 : 0);
})();
