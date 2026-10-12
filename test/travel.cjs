// Devil Fruit travel: speed > boat, energy drain, safe drop, sea gate + fly to island, picker, dex, mobile button, MP sync. BASE=http://localhost:8099 node test/travel.cjs
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8099'; let fails = 0; const ok = (n, c, x = '') => { console.log(c ? 'PASS' : 'FAIL', n, x); if (!c) fails++; };
const SH = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const mk = async (name, q, vp) => { const ctx = await b.newContext(vp || { viewport: { width: 844, height: 390 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ' PE ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket/.test(m.text())) errs.push(name + ' ' + m.text().slice(0, 200)); });
    await p.goto(BASE + '/?skip&anytap' + q); await p.waitForTimeout(1200); await p.mouse.click(200, 200);
    await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.fill('#cName', name); await p.click('#cGo'); await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 20000 }); await p.waitForTimeout(1500); await p.evaluate(() => __g.ui.close && __g.ui.close(true)); return p; };
  const eq = (p, f) => p.evaluate(f => { const g = __g.game, S = g.save; if (g.trv.on) g.trv.stop('off'); S.eq.fruit = f; S.slot = 'fruit'; if (!S.inv.fruits.includes(f)) S.inv.fruits.push(f); g.trv.E = 100; }, f);
  const s = await mk('Flyer', '');
  const cnt = await s.evaluate(() => { const ids = Object.keys(window.__TRAVEL || {}); return ids.length; });
  ok('20+ fruits have travel', cnt >= 20, cnt);
  // speed / drain / no sea weakness for several fruits
  for (const f of ['mera', 'seiryu', 'hie', 'pika', 'gomu', 'moku', 'phoenix', 'makami', 'soru']) {
    await eq(s, f);
    await s.evaluate(() => { const g = __g.game, p = g.p, R = g.island.R; p.pos.set(R + 4, 0, 0); p.yaw = 0; p.pitch = 0; p.vy = 0; p.swim = false; g.trv.start(); });
    const a = await s.evaluate(() => { const p = __g.game.p; return [p.pos.x, p.pos.z, __g.game.save.hp, __g.game.trv.on]; });
    await s.keyboard.down('KeyW'); await s.waitForTimeout(1000); await s.keyboard.up('KeyW');
    const r = await s.evaluate(() => { const g = __g.game, p = g.p; return [p.pos.x, p.pos.z, g.save.hp, g.trv.E, g.trv.stats.maxSpd, g.seaDrain(), p.swim, g.groundAt(p.pos.x, p.pos.z), g.trv.on, window.__BOAT_MAX]; });
    const spd = r[4];
    ok(`${f} active`, a[3] && r[8], JSON.stringify(a));
    ok(`${f} speed > boat`, spd > r[9], `travel ${spd.toFixed(1)} u/s vs boat max ${r[9].toFixed(1)}; moved ${Math.hypot(r[0] - a[0], r[1] - a[1]).toFixed(1)}u`);
    ok(`${f} energy drains`, r[3] < 99, r[3].toFixed(1));
    ok(`${f} no sea weakness over water`, !r[5] && !r[6] && r[2] >= a[2], `ground ${r[7].toFixed(2)} hp ${a[2]}->${r[2]}`);
    await s.evaluate(() => __g.game.trv.stats.maxSpd = 0);
  }
  // screenshots (third person)
  await s.evaluate(() => __g.game.tpv.toggle(true));
  await s.addStyleTag({ content: '#toasts,.ach,.achv,#ach{display:none!important}' });
  const shot = async (f, file, st) => { await eq(s, f); await s.evaluate(([f, st]) => { const g = __g.game, p = g.p, R = g.island.R, a = st[0]; p.pos.set(Math.cos(a) * (R + st[1]), 0, Math.sin(a) * (R + st[1])); p.yaw = -a + st[2]; p.pitch = st[3]; g.trv.start(); g.trv.picked = true; g.trv.alt += st[4]; }, [f, st]);
    await s.keyboard.down('KeyW'); await s.waitForTimeout(1100); await s.keyboard.up('KeyW'); await s.waitForTimeout(120); await s.screenshot({ path: SH + file }); };
  await shot('seiryu', 'travel_dragon.png', [0.3, 12, 0.5, -0.35, 6]);
  await shot('mera', 'travel_flame.png', [2.0, 11, 0.6, -0.2, 3]);
  await shot('hie', 'travel_icepath.png', [0, 10, 0.4, -0.25, 0]);
  await shot('phoenix', 'travel_phoenix.png', [1.2, 12, 0.6, -0.3, 4]);
  await shot('soru', 'travel_zeus.png', [0.6, 11, 0.5, -0.3, 3]);
  await shot('moku', 'travel_smoke.png', [-0.8, 11, 0.4, -0.2, 0]);
  await s.evaluate(() => { __g.game.trv.picked = false; });
  // picker at island edge
  await eq(s, 'mera'); await s.evaluate(() => { const g = __g.game, p = g.p, R = g.island.R; p.pos.set(R + 10, 0, 0); g.trv.start(); p.yaw = -Math.PI / 2; });
  await s.keyboard.down('KeyW'); await s.waitForTimeout(800); await s.keyboard.up('KeyW');
  const pk = await s.evaluate(() => [document.getElementById('tvPick').classList.contains('open'), document.getElementById('tvPick').innerText]);
  ok('edge opens fly-to-island picker', pk[0], pk[1].replace(/\n/g, ' | '));
  await s.screenshot({ path: SH + 'travel_picker.png' });
  ok('sea/level gate blocks low level', /level 8/.test(pk[1]), '');
  await s.evaluate(() => { document.querySelector('#tvPick [data-fly="x"].cancel').click(); });
  // safe drop when energy runs out over the sea
  await s.evaluate(() => { const g = __g.game, p = g.p, R = g.island.R; p.pos.set(R + 6, 0, 0); g.trv.E = 100; g.trv.start(); g.trv.alt += 10; });
  await s.waitForTimeout(300); await s.evaluate(() => __g.game.trv.E = 0.2); await s.waitForTimeout(400);
  const d0 = await s.evaluate(() => { const g = __g.game; return [g.trv.on, g.p.vy, g.p.pos.y]; });
  ok('energy empty -> travel stops, no launch', !d0[0] && d0[1] <= 0.01, JSON.stringify(d0));
  await s.waitForTimeout(3200);
  const d1 = await s.evaluate(() => { const g = __g.game, p = g.p; return [p.swim, g.groundAt(p.pos.x, p.pos.z), Math.hypot(p.pos.x, p.pos.z), g.island.R, isFinite(p.pos.y), g.save.hp]; });
  ok('safe drop returned to shore', !d1[0] && d1[1] > 0.3 && d1[4] && d1[5] > 0, JSON.stringify(d1));
  // fly to another island: gate then success
  await s.evaluate(() => { __g.game.save.lvl = 1; }); const gl = await s.evaluate(() => __g.game.trv.flyTo('shells')); ok('flyTo refused under level', gl === false);
  await s.evaluate(() => { __g.game.save.lvl = 12; __g.game.trv.E = 100; }); await s.evaluate(() => __g.game.trv.flyTo('shells')); await s.waitForTimeout(400); await s.screenshot({ path: SH + 'travel_flying.png' }); await s.waitForTimeout(5500);
  ok('arrived at Shells Town by flight', await s.evaluate(() => __g.game.island.id === 'shells'));
  const dex = await s.evaluate(() => __g.ui.dexHtml(4)); ok('encyclopedia shows Travel', /Travel: Flame Jet/.test(dex)); ok('dex shows Zeus Ride', /Travel: Zeus Ride/.test(await s.evaluate(() => __g.ui.dexHtml(5))));
  // mobile portrait button
  const m = await mk('Phone', '', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await eq(m, 'nika'); await m.waitForTimeout(400);
  const vis = await m.evaluate(() => { const e = document.getElementById('trvBtn'), r = e.getBoundingClientRect(); return [getComputedStyle(e).display, r.x, r.y, r.width, innerWidth, innerHeight]; });
  ok('mobile travel button visible', vis[0] !== 'none' && vis[3] > 0 && vis[1] >= 0 && vis[1] + vis[3] <= vis[4] && vis[2] > 0, JSON.stringify(vis));
  await m.tap('#trvBtn'); await m.waitForTimeout(500); ok('tap toggles travel', await m.evaluate(() => __g.game.trv.on));
  await m.evaluate(() => __g.game.tpv.toggle(true)); await m.waitForTimeout(600); await m.screenshot({ path: SH + 'travel_mobile.png' });
  // multiplayer sync
  const A = await mk('Adam', '&room=TRV' + Date.now() % 10000), room = await A.evaluate(() => __g.game.net.room); const C = await mk('Friend', '&room=' + room);
  await A.waitForTimeout(1500); await eq(A, 'phoenix'); await A.evaluate(() => __g.game.trv.start()); await C.waitForTimeout(1500);
  ok('peer sees travel mount', await C.evaluate(() => [...__g.game.net.peers.values()].some(p => p.tv === 'phoenix' && p.mount)));
  await eq(A, 'soru'); await A.evaluate(() => __g.game.trv.start()); await C.waitForTimeout(1500); ok('peer sees Zeus mount', await C.evaluate(() => [...__g.game.net.peers.values()].some(p => p.tv === 'soru' && p.mount)));
  ok('zero console errors', errs.length === 0, JSON.stringify(errs));
  await b.close(); process.exit(fails ? 1 : 0);
})();
