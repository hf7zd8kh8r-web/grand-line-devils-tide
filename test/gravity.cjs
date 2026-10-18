// Gravity fruit: special asteroid barrage + awakened meteor move + awakened MOON DROP all damage enemies; screenshots
const { chromium } = require('playwright-core');
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 960, height: 540 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push('PE ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  const ok = (n, c, x = '') => console.log(c ? 'PASS' : 'FAIL', n, x); const SH = `${__dirname}/../shots/`;
  await p.goto((process.env.BASE || 'http://127.0.0.1:5397') + '/?skip&anytap'); await p.waitForFunction(() => window.__g, null, { timeout: 30000 }); await p.waitForTimeout(1200); await p.mouse.click(480, 270);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForTimeout(2000);
  const setup = () => p.evaluate(() => { const g = __g.game, S = g.save; S.lvl = 120; S.mastery['fr:zushi'] = { lvl: 99, xp: 0 }; S.mastery['aw:zushi'] = { lvl: 99, xp: 0 }; if (!S.inv.fruits.includes('zushi')) S.inv.fruits.push('zushi'); S.eq.fruit = 'zushi'; S.slot = 'fruit'; g.refreshEquip(); S.hp = 99999;
    const P = g.p.pos, fw = g.fwdFlat(new P.constructor()); const live = g.enemies.filter(e => !e.boss); live.forEach((e, i) => { e.dead = false; e.c.root.visible = true; e.hp = e.maxHp = 99999; const a = (i / live.length - 0.5) * 2.2; const r = 7 + (i % 3) * 4; const x = P.x + fw.x * r + Math.cos(a) * 3 * (i % 2 ? 1 : -1), z = P.z + fw.z * r + Math.sin(a) * 3; e.c.root.position.set(x, g.groundAt(x, z), z); e.aggro = false; });
    return live.reduce((a, e) => a + e.hp, 0); });
  const dmgOf = before => p.evaluate(b0 => __g.game.enemies.filter(e => !e.boss).reduce((a, e) => a + Math.max(0, e.hp), 0), before).then(a => before - a);
  // base special
  let before = await setup(); await p.evaluate(() => { const g = __g.game; g.save.awake = {}; g.p.special = 100; g.special(); window.__t0 = g.t; }); await p.waitForFunction(() => { if (__g.game.t - __t0 > 2.9) { window.__hold = 1; return true; } }, null, { timeout: 20000, polling: 'raf' }); await p.screenshot({ path: SH + 'gravity_meteors.png' }); await p.evaluate(() => window.__hold = 0); await p.waitForFunction(() => !__g.game.cut, null, { timeout: 20000 });
  let d = await dmgOf(before); const hitN = await p.evaluate(() => __g.game.enemies.filter(e => !e.boss && e.hp < 99999).length); ok('Gravity special asteroids hit enemies', d > 0 && hitN >= 3, `dmg ${d} on ${hitN} enemies`);
  // awakened meteor move
  before = await setup(); await p.evaluate(() => { const g = __g.game, S = g.save; S.awake = { zushi: true }; S.awk = { kit: {} }; g.ui.updateMoves(); g.p.cds = {}; g.move(0); }); await p.waitForTimeout(3000); d = await dmgOf(before); ok('awakened Meteor Summon hits', d > 0, d);
  // awakened special: moon drop
  await p.waitForTimeout(6500); before = await setup(); await p.evaluate(() => { const g = __g.game; g._spNoFill = 0; g.p.special = 100; g.special(); window.__t0 = g.t; }); const at = s => p.waitForFunction(s => { const c = __g.game.cut; if (c && c.time > s) { window.__hold = 1; return true; } }, s, { timeout: 20000, polling: 'raf' });
  const shot = async (s, n) => { await at(s); await p.screenshot({ path: SH + n }); await p.evaluate(() => window.__hold = 0); }; await shot(2.6, 'gravity_moon_space.png'); await shot(4.9, 'gravity_moon.png'); await shot(5.6, 'gravity_moon_impact.png'); await p.waitForFunction(() => !__g.game.cut, null, { timeout: 15000 }).catch(() => {}); d = await dmgOf(before); const st = await p.evaluate(() => ({ cut: !!__g.game.cut, fog: !!__g.game.scene.fog, sky: __g.game.sky.visible }));
  ok('MOON DROP damages enemies', d > 0, d); ok('cutscene cleaned up (fog/sky restored)', !st.cut && st.fog && st.sky, JSON.stringify(st));
  ok('zero console errors', !errs.length, JSON.stringify(errs)); await b.close(); })();
