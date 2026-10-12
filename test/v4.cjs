// v4 screenshot pass: node test/v3.cjs [desk|phone]
const { chromium } = require('playwright-core');
const mode = process.argv[2] || 'desk'; const phone = mode === 'phone';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext(phone ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  const shot = async n => { await p.screenshot({ path: `${__dirname}/../shots/v4_${phone ? 'phone_' : ''}${n}.png` }); console.log('shot', n); };
  await p.goto((process.env.BASE || 'http://localhost:4173') + '/?anytap'); await p.waitForTimeout(6500); await shot('cover'); if (phone) await p.touchscreen.tap(195, 420); else await p.mouse.click(640, 360);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.waitForTimeout(400);
  await p.fill('#cName', 'Adam'); await p.click('#cTabs button[data-t=look]');
  for (const [k, d, n] of [['hairS', 1, 2], ['hairC', 1, 4], ['outfit', 1, 4], ['hat', 1, 1], ['eye', 1, 2], ['top', 1, 6]]) for (let i = 0; i < n; i++) await p.click(`#cRows button[data-lk=${k}][data-ld="${d}"]`);
  await p.waitForTimeout(500); await shot('create'); await p.click('#cGo'); await p.waitForTimeout(2200);
  await p.evaluate(() => { const g = __g.game; g.save.ber = 200000; g.save.lvl = 30; g.ui.updateHud(); });
  await shot('spawn');
  // trading table
  const hasT = await p.evaluate(() => { const g = __g.game; if (!g.table) return false; const T = g.table, s = T.seatB; g.p.pos.set(s.x + (s.x - T.sp.x) * 1.4, 0, s.z + (s.z - T.sp.z) * 1.4); g.p.pos.y = g.groundAt(g.p.pos.x, g.p.pos.z); g.p.yaw = Math.atan2(-(T.sp.x - g.p.pos.x), -(T.sp.z - g.p.pos.z)); g.p.pitch = -0.15; return true; });
  await p.waitForTimeout(700); await shot('table_approach');
  if (hasT) { await p.evaluate(() => { const g = __g.game; const o = g.fakes.find(o => o.sit); g.ui.talk({ name: o.f.name, role: 'player', fake: o.f, c: o.c, sit: o.sit }); }); await p.waitForTimeout(900); await shot('table_seated');
    await p.evaluate(() => __g.ui.close()); }
  // wardrobe + cosmetics shop
  await p.evaluate(() => { const g = __g.game; const sp = g.island.spawn; g.p.pos.set(sp[0], g.groundAt(sp[0], sp[1]), sp[1]); g.p.yaw = Math.PI; (g.fakes || []).forEach(o => { if (!o.sit) o.c.root.position.x += 30; }); });
  await p.evaluate(() => __g.ui.open('style', 'shop')); await p.waitForTimeout(300); await p.click('[data-do="cosBuy:tricorn"]'); await p.waitForTimeout(200); await p.click('[data-do="cosBuy:capRed"]'); await p.waitForTimeout(300); await shot('cosmetics');
  await p.evaluate(() => __g.ui.open('style', 'look')); await p.waitForTimeout(300); await shot('wardrobe'); await p.evaluate(() => __g.ui.close());
  // fruit icons
  await p.evaluate(() => { const g = __g.game, S = g.save; S.inv.fruits.push('mera', 'gomu', 'pika', 'hie', 'goro', 'magu', 'yami', 'ope', 'kitsune', 'nika', 'seiryu', 'mochi'); g.ui.open('inv', 'gear'); }); await p.waitForTimeout(400);
  await p.evaluate(() => { const el = [...document.querySelectorAll('#panel h3')].find(h => /fruit/i.test(h.textContent)); el && el.scrollIntoView(); }); await p.waitForTimeout(200); await shot('fruit_icons'); await p.evaluate(() => __g.ui.close());
  // combat
  await p.evaluate(() => { const g = __g.game; const e = g.enemies.filter(e => !e.dead && !e.boss).sort((a, b) => a.c.root.position.distanceTo(g.p.pos) - b.c.root.position.distanceTo(g.p.pos))[0]; const P = e.c.root.position; g.p.pos.set(P.x, 0, P.z + 3.2); g.p.pos.y = g.groundAt(g.p.pos.x, g.p.pos.z); g.p.yaw = 0; g.p.pitch = -0.1; e.aggro = true; });
  for (let i = 0; i < 4; i++) { await p.evaluate(() => { const g = __g.game; g.p.atkCd = 0; __g.IN.pressed.add('attack'); }); await p.waitForTimeout(260); }
  await shot('combat');
  // bosses
  for (const isl of (phone ? ['wano'] : ['windmill', 'arlong', 'wano', 'egghead'])) {
    await p.evaluate(isl => { const g = __g.game; g.save.lvl = 400; if (g.island.id !== isl) g.loadIsland(isl, false); }, isl); await p.waitForTimeout(900);
    await p.waitForTimeout(2600); await p.evaluate(() => { const g = __g.game; const e = g.enemies.find(e => e.boss); g.bossIntroDone[e.s.type] = true; const P = e.c.root.position; const d = 9; g.p.pos.set(P.x, 0, P.z + d); g.p.pos.y = g.groundAt(g.p.pos.x, g.p.pos.z); g.p.yaw = 0; g.p.pitch = 0.0; g.save.hp = 99999; g.update(0.016); g.bossIntro(e); });
    await p.waitForTimeout(2300); await shot('boss_' + isl); await p.waitForTimeout(2600);
  }

  // ---- v4 extras ----
  await p.evaluate(() => { const g = __g.game; g.save.lvl = 400; g.save.hp = 99999; g.loadIsland('alabasta', false); }); await p.waitForTimeout(1500);
  for (const t of (phone ? [7, 5] : [0, 1, 2, 3, 4, 5, 6, 7])) { await p.evaluate(t => __g.ui.open('dex', t), t); await p.waitForTimeout(350); await shot('dex_' + t); }
  await p.evaluate(() => __g.ui.close());
  // fruit shop
  await p.evaluate(() => { const g = __g.game; g.save.ber = 5e6; const n = g.island.npcs.find(n => n.shop === 'rot'); __g.ui.open('shop', n.shop); }); await p.waitForTimeout(400); await shot('fruitshop'); await p.evaluate(() => __g.ui.close());
  // haki tree
  await p.evaluate(() => { const g = __g.game, S = g.save; for (const k of ['orange_boss', 'arlong_boss', 'alabasta_boss', 'enies_boss', 'wano_boss', 'higuma']) S.kills[k] = 1; __g.ui.open('inv', 'haki'); __g.ui.act('hbuy:buso'); __g.ui.act('hbuy:buso'); __g.ui.act('hbuy:ken'); __g.ui.act('hbuy:conq'); __g.ui.open('inv', 'haki'); }); await p.waitForTimeout(400); await shot('haki_tree'); await p.evaluate(() => __g.ui.close());
  // new fruits' moves near enemies
  const near = () => p.evaluate(() => { const g = __g.game; g.ui.close && g.ui.close(); const e = g.enemies.filter(e => !e.dead && !e.boss).sort((a, b) => a.c.root.position.distanceTo(g.p.pos) - b.c.root.position.distanceTo(g.p.pos))[0]; if (!e) return; const P = e.c.root.position; g.p.pos.set(P.x, 0, P.z + 6); g.p.pos.y = g.groundAt(g.p.pos.x, g.p.pos.z); g.p.yaw = 0; g.p.pitch = -0.05; for (const x of g.enemies) if (!x.boss) { x.hp = x.max; x.dead = false; } });
  for (const [fid, mv] of (phone ? [['makami', 'm1']] : [['raijin', 'm3'], ['thunderbird', 'm2'], ['makami', 'm1'], ['goro', 'm2'], ['seiryu', 'm1']])) {
    await p.evaluate(fid => { const g = __g.game, S = g.save; S.eq.fruit = fid; S.mastery['fr:' + fid] = { lvl: 30, xp: 0 }; S.slot = 'fruit'; g.refreshEquip(); g.p.cds = {}; g.ui.updateMoves && g.ui.updateMoves(); }, fid); await near(); await p.waitForTimeout(300);
    await p.evaluate(mv => __g.IN.pressed.add(mv), mv); await p.waitForTimeout(420); await shot('move_' + fid);
  }
  // gun skill
  await p.evaluate(() => { const g = __g.game, S = g.save; S.inv.guns.push('franky'); S.eq.gun = 'franky'; S.mastery['gn:franky'] = { lvl: 12, xp: 0 }; S.slot = 'gun'; g.refreshEquip(); g.p.cds = {}; g.ui.updateMoves && g.ui.updateMoves(); }); await near(); await p.waitForTimeout(300);
  await p.evaluate(() => __g.IN.pressed.add('m2')); await p.waitForTimeout(400); await shot('gun_skill');
  // Ultra special cutscene (Nika) during boss window: low HP rule
  await p.evaluate(() => { const g = __g.game, S = g.save; S.eq.fruit = 'nika'; S.slot = 'fruit'; g.refreshEquip(); g.p.special = 100; S.hp = Math.round(g.st.maxHp * 0.3); g.special(); }); await p.waitForTimeout(1300); await shot('ultra_special_a'); await p.waitForTimeout(1300); await shot('ultra_special_b');
  await p.waitForTimeout(4000);
  const info = await p.evaluate(() => __info()); console.log('render', JSON.stringify(info));
  // fps sample
  const fps = await p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(n / 2); }; requestAnimationFrame(f); })); console.log('fps(swiftshader)', fps);
  console.log('ERRS', errs.length, errs.slice(0, 8)); await b.close();
})();
