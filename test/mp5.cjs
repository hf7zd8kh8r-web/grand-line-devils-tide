const { chromium } = require('playwright-core');
const R = 'CREW5'; const out = __dirname + '/../shots/';
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const mk = async (name, vp = { width: 640, height: 400 }) => { const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message));
    await p.goto(`http://localhost:8080/?skip&anytap&room=${R}`); await p.waitForTimeout(1000); await p.mouse.click(200, 200);
    await p.waitForFunction(() => window.__g && __g.mode === 'create', null, { timeout: 30000 }); await p.fill('#cName', name); await p.click('#cGo');
    await p.waitForFunction(() => __g.game && __g.game.net.status === 'online', null, { timeout: 20000 }); return p; };
  const names = ['Adam', 'Zoro', 'Nami', 'Usopp', 'Sanji'];
  const P = []; for (const n of names) P.push(await mk(n, n === 'Zoro' ? { width: 390, height: 844 } : undefined));
  await P[0].waitForTimeout(1500);
  // 6th client must be refused
  const extra = await mk('Extra').catch(e => null);
  const full = extra ? await extra.evaluate(() => __g.game.net.status) : 'timeout(no online)';
  ok(full !== 'online', '6th client refused (status=' + full + ')');
  if (extra) await extra.context().close();
  // spread everyone around spawn
  for (let i = 0; i < 5; i++) await P[i].evaluate(i => { const g = __g.game; g.p.pos.set(-3 + i * 1.5, g.groundAt(-3 + i * 1.5, 6) + 0.05, 6 - (i % 2) * 1.5); g.p.yaw = 0; g.p.pitch = -0.05; }, i);
  await P[0].waitForTimeout(1500);
  for (let i = 0; i < 5; i++) { const r = await P[i].evaluate(() => [...__g.game.net.peers.values()].filter(p => p.av).length); ok(r === 4, `${names[i]} sees ${r}/4 crew avatars`); }
  // cosmetics + look
  await P[1].evaluate(() => { const g = __g.game, S = g.save; S.cos.push('straw'); S.cosEq.hat = 'straw'; S.look.hairS = 'afro'; g.rebuildArms(); g.net.lookChanged(); });
  // fighting style
  await P[4].evaluate(() => { const g = __g.game, S = g.save; S.styles.push('blackleg'); S.eq.style = 'blackleg'; g.refreshEquip(); });
  // swimming fruit user
  await P[3].evaluate(() => { const g = __g.game, S = g.save; S.inv.fruits.push('mera'); S.eq.fruit = 'mera'; g.refreshEquip(); const I = g.island; let x = 0, z = 0; for (let r = I.R; r < I.R + 40; r += 1) { if (g.groundAt(r, 0) < -0.8) { x = r + 3; break; } } g.p.pos.set(x, -0.5, 0); });
  await P[0].waitForTimeout(2000);
  const v = await P[0].evaluate(() => { const ps = [...__g.game.net.peers.values()]; const f = n => ps.find(p => p.name === n); return { zHat: f('Zoro').cos && f('Zoro').cos.hat, zHair: f('Zoro').look && f('Zoro').look.hairS, sanjiSt: f('Sanji').st, usoppM: f('Usopp').m, usoppHp: f('Usopp').hp }; });
  ok(v.zHat === 'straw' && v.zHair === 'afro', 'cosmetics/look synced ' + JSON.stringify([v.zHat, v.zHair]));
  ok(v.sanjiSt === 'blackleg', 'fighting style synced: ' + v.sanjiSt);
  const usSelf = await P[3].evaluate(() => ({ swim: __g.game.p.swim, drain: __g.game.seaDrain(), hp: __g.game.save.hp }));
  ok((v.usoppM & 3) === 3, `swim+drain flags synced m=${v.usoppM} (self swim=${usSelf.swim} drain=${usSelf.drain}) remote hp=${v.usoppHp}`);
  await P[0].evaluate(() => { const g = __g.game; g.p.yaw = Math.PI; }); await P[0].waitForTimeout(400);
  await P[1].screenshot({ path: out + 'v4_mp5_phone.png' });
  await P[0].screenshot({ path: out + 'v4_mp5_crew.png' });
  await P[3].evaluate(() => { const g = __g.game; g.p.pos.set(0, g.groundAt(0, 4) + 0.05, 4); g.save.hp = g.st.maxHp; });
  // fruit shop shared stock
  await P[0].evaluate(() => { const g = __g.game; g.save.ber += 5e6; __g.ui.open('shop', 'rot'); __g.ui.act('rbuy:0'); });
  await P[0].waitForTimeout(600);
  const sold = await P[2].evaluate(() => { const S = __g.game.save; return Object.values(S.fsold || {}).flat(); });
  ok(sold.includes(0), 'fruit shop purchase synced to crew (Nami sees slot 0 sold)');
  // trading table: Adam & Zoro sit, trade fruit for berries
  const hasT = await P[0].evaluate(() => !!__g.game.table);
  ok(hasT, 'trading table exists on island');
  for (const i of [0, 1]) await P[i].evaluate(() => { __g.ui.close(true); const g = __g.game; g.sitAt(); });
  await P[0].waitForTimeout(3000);
  console.log('zoro self', await P[1].evaluate(() => { const g = __g.game; return { seat: g.seat, pos: [g.p.pos.x.toFixed(1), g.p.pos.z.toFixed(1)] }; }));
  const seats = await P[0].evaluate(() => { const g = __g.game; const z = [...g.net.peers.values()].find(p => p.name === 'Zoro'); return { me: [g.p.pos.x.toFixed(1), g.p.pos.z.toFixed(1)], zoro: [z.tgt.x.toFixed(1), z.tgt.z.toFixed(1)], zm: z.m }; });
  ok(seats.me.join() !== seats.zoro.join() && (seats.zm & 4), 'two real players seated at different stools ' + JSON.stringify(seats));
  await P[0].evaluate(() => { const g = __g.game; g.save.inv.fruits.push('gomu'); const z = [...g.net.peers.values()].find(p => p.name === 'Zoro'); g.net.tradeReq(z.id); });
  await P[1].waitForSelector('#sailInv button', { state: 'visible', timeout: 5000 }); await P[1].click('#sailInv button');
  await P[0].waitForTimeout(600);
  await P[0].evaluate(() => __g.ui.act('tit:fruit:gomu')); await P[1].evaluate(() => { __g.game.save.ber += 20000; __g.ui.act('tber:10000'); });
  await P[0].waitForTimeout(600); await P[0].screenshot({ path: out + 'v4_mp5_trade.png' });
  const b0 = await P[0].evaluate(() => __g.game.save.ber); const zf0 = await P[1].evaluate(() => __g.game.save.inv.fruits.filter(f => f === 'gomu').length);
  await P[0].evaluate(() => __g.ui.act('tok')); await P[1].evaluate(() => __g.ui.act('tok'));
  await P[0].waitForTimeout(800);
  const b1 = await P[0].evaluate(() => __g.game.save.ber); const zf1 = await P[1].evaluate(() => __g.game.save.inv.fruits.filter(f => f === 'gomu').length);
  const aHas = await P[0].evaluate(() => __g.game.save.inv.fruits.filter(f => f === 'gomu').length);
  ok(b1 - b0 === 10000 && zf1 === zf0 + 1, `real-player trade done: Adam +฿${b1 - b0}, Zoro gomu ${zf0}->${zf1}, Adam gomu left ${aHas}`);
  for (const i of [0, 1]) await P[i].evaluate(() => __g.game.standUp());
  // sail together
  for (const p of P) await p.evaluate(() => { const S = __g.game.save; S.boat = true; S.lvl = Math.max(S.lvl, 10); });
  await P[0].evaluate(() => __g.ui.onSail('shells'));
  for (const i of [1, 2, 3, 4]) { await P[i].waitForSelector('#sailInv button', { state: 'visible', timeout: 5000 }).catch(() => {}); await P[i].click('#sailInv button').catch(e => console.log('no invite', names[i])); }
  await P[1].waitForTimeout(900);
  await P[0].waitForTimeout(2500);
  for (let i = 0; i < 5; i++) { const r = await P[i].evaluate(() => __g.sail ? __g.sail.mates.length : -1); ok(r >= 3, `${names[i]} sees ${r} crew ships alongside on the voyage`); }
  await P[4].screenshot({ path: out + 'v4_mp5_sailing.png' }); await P[0].evaluate(() => { __g.sail.view = 'tp'; }); await P[0].waitForTimeout(600); await P[0].screenshot({ path: out + 'v4_mp5_sailing_tp.png' });
  for (const p of P) await p.evaluate(() => { if (__g.sail) __g.sail.skip = true; });
  for (const p of P) await p.waitForFunction(() => __g.mode === 'game' && __g.game.island.id === 'shells', null, { timeout: 60000 }).catch(() => {}); await P[0].waitForTimeout(5000);
  for (let i = 0; i < 5; i++) { const r = await P[i].evaluate(() => ({ i: __g.game.island.id, n: [...__g.game.net.peers.values()].filter(p => p.island === __g.game.island.id).length, mode: __g.mode })); ok(r.i === 'shells' && r.n === 4, `${names[i]} arrived ${r.i} with ${r.n}/4 crew (${r.mode})`); }
  await P[2].evaluate(() => { const g = __g.game; g.p.yaw = Math.PI; }); await P[2].waitForTimeout(500); await P[2].screenshot({ path: out + 'v4_mp5_arrive.png' });
  // shared hit at new island
  const e0 = await P[3].evaluate(() => __g.game.enemies.findIndex(e => !e.dead));
  const hb = await P[3].evaluate(i => __g.game.enemies[i].hp, e0); await P[0].evaluate(i => { const g = __g.game; g.damageEnemy(g.enemies[i], 5, {}); }, e0); await P[0].waitForTimeout(500);
  ok(await P[3].evaluate(i => __g.game.enemies[i].hp, e0) < hb, 'combat hit synced on new island');
  console.log('page errors:', errs.length ? errs.slice(0, 8) : 'none');
  await b.close();
})();
