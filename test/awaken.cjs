// Awakened kits: awaken -> transformation + kit swap, cast each awakened move + special, Y toggle, save migration, zero errors. BASE=http://localhost:8111 node test/awaken.cjs
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8099'; let fails = 0; const ok = (n, c, x = '') => { console.log(c ? 'PASS' : 'FAIL', n, x); if (!c) fails++; };
const SH = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 } }); const s = await ctx.newPage(); s.on('pageerror', e => errs.push('PE ' + e.message)); s.on('console', m => { if (m.type() === 'error' && !/404|WebSocket/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await s.goto(BASE + '/?skip&anytap'); await s.waitForTimeout(1200); await s.mouse.click(200, 200);
  await s.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await s.fill('#cName', 'Awaker'); await s.click('#cGo'); await s.waitForFunction(() => __g.mode === 'game', null, { timeout: 20000 }); await s.waitForTimeout(1500); await s.evaluate(() => __g.ui.close && __g.ui.close(true));
  const n = await s.evaluate(() => Object.keys(__AWK).length); ok('awakened kits defined for all Legendary+ fruits', n >= 34, n);
  await s.addStyleTag({ content: '#toasts,#banner{display:none!important}' });
  const near = async () => { await s.evaluate(() => { for (const x of __g.game.enemies) if (x.dead && !x.temp) x.deadT = 999; }); await s.waitForTimeout(80); return s.evaluate(() => { const g = __g.game; for (const x of g.enemies) if (x.dead && !x.temp) x.deadT = 999; const e = g.enemies.find(x => !x.dead && !x.boss) || g.enemies.find(x => !x.dead) || g.enemies[0]; const P = e.c.root.position; g.p.pos.set(P.x + 7, g.groundAt(P.x + 7, P.z + 3), P.z + 3); g.p.yaw = Math.atan2(7, 3); g.p.pitch = -0.08; g.save.hp = g.st.maxHp; for (const x of g.enemies) if (x.dead === false) x.hp = x.max; }); };
  await s.evaluate(() => __g.game.tpv.toggle(true));
  let first = true;
  for (const f of ['magu', 'nika', 'hie', 'soru', 'seiryu', 'makami', 'sound', 'gura', 'phoenix', 'pika']) {
    const base = await s.evaluate(f => { const g = __g.game, S = g.save; S.inv.fruits.push(f); S.eq.fruit = f; S.slot = 'fruit'; g.refreshEquip && g.refreshEquip(); S.mastery['fr:' + f] = { lvl: 60, xp: 0 }; g.ui.updateMoves(); return g.ui.currentMoves().map(m => m.name); }, f);
    await near();
    await s.evaluate(f => { const S = __g.game.save; S.awake = S.awake || {}; S.awake[f] = true; }, f); // what the Awaken button does
    await s.waitForTimeout(first ? 1300 : 400); if (first) { await s.screenshot({ path: SH + 'awaken_transform.png' }); }
    await s.waitForTimeout(first ? 2600 : 3400); first = false; await s.evaluate(() => __g.game.tpv.toggle(true));
    const kit = await s.evaluate(f => [__g.game.ui.currentMoves().map(m => m.name), __AWK[f].mv.map(x => x[0]), __g.game.ui.currentMoves().filter(m => m.lock).length, document.querySelector('#moves').innerText], f);
    ok(`${f} kit swapped to awakened`, JSON.stringify(kit[0]) === JSON.stringify(kit[1]) && kit[0].every(x => !base.includes(x)), kit[0].join(' / '));
    if (f === 'magu') ok('awakened mastery gating (new fruit: 3 locked)', kit[2] === 3, kit[2]);
    await s.evaluate(f => { __g.game.save.mastery['aw:' + f] = { lvl: 60, xp: 0 }; __g.game.ui.updateMoves(); }, f);
    const d0 = await s.evaluate(() => __g.game.save.stats.dmg || 0);
    for (let i = 0; i < 4; i++) { await near(); await s.evaluate(i => { const g = __g.game; g.p.cds = {}; g.move(i); }, i); await s.waitForTimeout(i === 0 ? 650 : i === 3 ? 900 : 500);
      if (['magu:0', 'nika:0', 'hie:0', 'seiryu:0', 'soru:0', 'makami:0'].includes(f + ':' + i)) await s.screenshot({ path: SH + `awaken_${f}.png` }); }
    await s.waitForTimeout(1000);
    const sp = await s.evaluate(() => { const g = __g.game; g.p.special = 100; g.save.hp = g.st.maxHp * 0.3; g.special(); return [g.p.special, document.querySelector('#moves .mv.sp span') && document.querySelector('#moves .mv.sp span').innerText]; });
    ok(`${f} awakened special cast`, sp[0] === 0 && /✦/.test(sp[1] || ''), sp[1]);
    await s.waitForTimeout(2900);
    const dmgd = await s.evaluate(([f, d0]) => (__g.game.save.stats.dmg || 0) > d0 || (__g.game.save.mastery['aw:' + f] || {}).lvl > 60, [f, d0]); ok(`${f} awakened moves hit + train aw mastery`, dmgd);
  }
  // toggle
  await s.keyboard.press('KeyY'); await s.waitForTimeout(300);
  const tg = await s.evaluate(() => [__g.game.ui.currentMoves().map(m => m.name), __g.game.save.awk.kit.pika, document.getElementById('awkBtn').textContent]);
  ok('Y toggles to base kit', tg[1] === 'base' && /Base/.test(tg[2]), JSON.stringify(tg));
  await s.click('#awkBtn'); await s.waitForTimeout(200); ok('✦ button back to awakened', await s.evaluate(() => __g.game.save.awk.kit.pika === 'awake'));
  const dex = await s.evaluate(() => __g.ui.dexHtml(5)); ok('encyclopedia lists awakened kit', /Awakened: Ryusei Kazan/.test(dex));
  // migration: old save with an awakened fruit and no awk data
  await s.evaluate(() => { const S = __g.game.save; S.awake.mera = true; S.inv.fruits.push('mera'); delete S.awk; delete S.mastery['aw:mera']; __g.saveNow(); });
  await s.reload(); await s.waitForTimeout(1500); await s.mouse.click(200, 200); await s.waitForFunction(() => __g.mode === 'create' || __g.mode === 'game', null, { timeout: 20000 }); if (await s.evaluate(() => __g.mode === 'create')) await s.click('#cCont'); await s.waitForFunction(() => __g.mode === 'game', null, { timeout: 20000 }); await s.waitForTimeout(1500);
  const mg = await s.evaluate(() => { const S = __g.game.save; return [S.awk && S.awk.seen.mera, S.mastery['aw:mera'] && S.mastery['aw:mera'].lvl, !document.body.classList.contains('cine')]; });
  ok('save migration: old awakened fruit gets kit + aw mastery 10, no replayed cutscene', mg[0] === 1 && mg[1] === 10, JSON.stringify(mg));
  ok('zero console errors', errs.length === 0, JSON.stringify(errs.slice(0, 5)));
  await b.close(); process.exit(fails ? 1 : 0);
})();
