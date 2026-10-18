// Secret islands, clues, fake-wall hidden shops, secret quests, index hints. BASE=http://localhost:8121 node test/secrets.cjs
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8080'; const SH = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket|ws:/.test(m.text())) errs.push(m.text().slice(0, 300)); if (m.type() === 'warning' && /secrets/.test(m.text())) errs.push('W ' + m.text()); });
  await p.goto(BASE + '/?skip&anytap'); await p.evaluate(() => { for (const k of Object.keys(localStorage)) if (/save|gldt/i.test(k) && !/quality/.test(k)) localStorage.removeItem(k); }); await p.reload(); await p.waitForTimeout(1200); await p.mouse.click(640, 360);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 25000 }); await p.waitForTimeout(1500);
  const clean = () => p.evaluate(() => { document.querySelectorAll('.toast,#toasts > *').forEach(e => e.remove()); for (const id of ['banner', 'travel', 'qhint']) { const e = document.getElementById(id); if (e) e.style.visibility = 'hidden'; } });
  const ok = []; const res = (n, v) => { ok.push(v); console.log(v ? 'PASS' : 'FAIL', n); };
  await p.evaluate(() => { const g = __g.game, S = g.save; S.lvl = 400; S.ber = 5e7; for (const e of g.enemies) { e.c.root.visible = false; e.dead = true; } });
  // map: secret islands hidden
  await p.evaluate(() => __g.ui.open('map')); await p.waitForTimeout(500); const q = await p.evaluate(() => (document.getElementById('panel').innerHTML.match(/\?\?\?/g) || []).length); res('map hides secret islands (??? x' + q + ')', q >= 7); await p.evaluate(() => __g.ui.close(true));
  // windmill hidden room (built live on the first island)
  const r0 = await p.evaluate(() => { const I = __g.game.island; const r = I.secretRoom; return r && { th: r.th, ex: r.ex, ez: r.ez, npcs: __g.game.npcs.filter(n => n.id === 'secshop' || n.id === 'secq').length }; }); res('windmill hidden room + 2 NPCs ' + JSON.stringify(r0 && r0.npcs), r0 && r0.npcs === 2);
  const brd0 = await p.evaluate(() => __g.ui.boardHtml().includes('Secret Request')); res('secret request hidden on board before discovery', !brd0);
  // outside view of the fake wall (Observation Haki reveals the golden mark)
  await p.evaluate(({ th, ex, ez }) => { const g = __g.game; g.save.haki = { ken: true }; const s = Math.sin(th), c = Math.cos(th); const x = ex + s * 7 + c * 3, z = ez + c * 7 - s * 3; g.p.pos.set(x, g.groundAt(x, z), z); g.p.yaw = th + 0.35; g.p.pitch = -0.05; g.tpv.toggle(false); }, r0); await p.waitForTimeout(1500); await clean(); await p.screenshot({ path: SH + 'secret_wall.png' }); await p.evaluate(() => { __g.game.save.haki = {}; });
  // walk through the fake wall: stand outside the entrance, face in, hold W
  await p.evaluate(({ th, ex, ez }) => { const g = __g.game; g.p.pos.set(ex, g.groundAt(ex, ez) + 0.1, ez); g.p.vel && g.p.vel.set(0, 0, 0); g.p.yaw = th; g.p.pitch = -0.1; g.tpv.toggle(true); }, r0); await p.waitForTimeout(400);
  await p.keyboard.down('KeyW'); await p.waitForTimeout(2600); await p.keyboard.up('KeyW'); await p.waitForTimeout(300);
  const inside = await p.evaluate(() => { const g = __g.game; return [g.island.secretRoom.inside(g.p.pos.x, g.p.pos.z), !!(g.save.secRoom || {}).windmill]; }); res('walked through fake wall into the hidden shop ' + inside, inside[0] && inside[1]);
  // solid side wall: try to walk out sideways
  await p.evaluate(() => { __g.game.p.yaw += Math.PI / 2; }); await p.keyboard.down('KeyW'); await p.waitForTimeout(2000); await p.keyboard.up('KeyW');
  const stay = await p.evaluate(() => { const g = __g.game; return g.island.secretRoom.inside(g.p.pos.x, g.p.pos.z); }); res('side wall is solid', stay);
  const brd1 = await p.evaluate(() => __g.ui.boardHtml().includes('Secret Request')); res('secret request on board after discovery', brd1);
  // view: stand at the fake wall looking in
  await p.evaluate(() => { const g = __g.game, r = g.island.secretRoom; const s = Math.sin(r.th), c = Math.cos(r.th); const x = r.x + s * 1.6, z = r.z + c * 1.6; g.p.pos.set(x, g.groundAt(x, z), z); g.p.yaw = r.th; g.p.pitch = -0.12; g.tpv.toggle(false); }); await p.waitForTimeout(700); await clean(); await p.screenshot({ path: SH + 'secret_room.png' });
  // talk to the Hooded Merchant
  await p.evaluate(() => { const g = __g.game; __g.ui.talk(g.npcs.find(n => n.id === 'secshop')); }); await p.waitForTimeout(700);
  const sh = await p.evaluate(() => [document.querySelectorAll('#panel [data-do^="secbuy"]').length, document.getElementById('panel').innerText.slice(0, 80)]); res('hidden shop lists items ' + JSON.stringify(sh), sh[0] >= 2);
  await p.evaluate(() => __g.ui.act('secbuy:windmill:1')); await p.waitForTimeout(500); await clean(); await p.screenshot({ path: SH + 'secret_shop.png' });
  const bought = await p.evaluate(() => [__g.game.save.cos.includes('snowscarf'), __g.game.save.cosEq.neck]); res('bought exclusive + auto-worn ' + bought, bought[0] && bought[1] === 'snowscarf');
  await p.evaluate(() => __g.ui.close(true));
  const shopHides = await p.evaluate(() => { __g.ui.open('style', 'shop'); const h = document.getElementById('panel').innerHTML; __g.ui.close(true); return !/Pirate King's Cape|Oni Half-Mask/.test(h); }); res('normal style shop hides exclusives', shopHides);
  // Masked Stranger quest + reward
  const mq = await p.evaluate(() => { const g = __g.game, ui = __g.ui; const n = g.npcs.find(x => x.id === 'secq'); return ui.questHtml(n).includes('Secret Request'); }); res('Masked Stranger offers secret request', mq);
  // secret walls on other islands + clue → reveal drum
  const rooms = await p.evaluate(() => { const g = __g.game, o = {}; for (const id of ['loguetown', 'water7', 'fishman', 'dressrosa', 'wano']) { g.loadIsland(id, false); o[id] = !!g.island.secretRoom; } return o; }); res('hidden rooms on 5 more islands ' + JSON.stringify(rooms), Object.values(rooms).every(Boolean));
  const clue = await p.evaluate(async () => { const g = __g.game; g.loadIsland('loguetown', false); const c = g.island.clues[0]; g.amb.isNight = () => true; g.p.pos.set(c.x, g.groundAt(c.x, c.z), c.z); await new Promise(r => setTimeout(r, 1200)); return [c.id, !!(g.save.secrets || {}).drum]; }); res('Loguetown night clue reveals Drum Island ' + clue, clue[1]);
  await p.evaluate(() => __g.ui.open('map')); await p.waitForTimeout(400); const mapd = await p.evaluate(() => document.getElementById('panel').innerHTML.includes('Drum Island')); res('Drum Island now on the map', mapd); await p.evaluate(() => __g.ui.close(true));
  // every secret island builds; secret trial + reward
  const isl = await p.evaluate(() => { const g = __g.game, o = {}; for (const id of ['drum', 'shandora', 'kuraigana', 'momoiro', 'greenbit', 'elbaf', 'godvalley']) { g.loadIsland(id, false); o[id] = [g.island.id === id, g.npcs.length, g.enemies.some(e => e.boss)]; } return o; }); res('7 secret islands build ' + JSON.stringify(isl), Object.values(isl).every(v => v[0] && v[1] > 2));
  const rw = await p.evaluate(() => { const g = __g.game, S = g.save; g.loadIsland('elbaf', false); const Q = __dbg && __dbg.QUESTS ? __dbg.QUESTS : null; const n = g.npcs.find(x => x.role === 'quest' && __g.ui.questHtml(x).includes('Secret Trial')); return [!!n]; }); res('Elbaf giver offers Secret Trial', rw[0]);
  // index hints
  const ix = await p.evaluate(() => { __g.ui.open('swx', 1); const h1 = document.getElementById('panel').innerHTML; __g.ui.act('sechint:isledrum'); const h2 = document.getElementById('panel').innerHTML; return [h1.includes('Secret Islands'), (h2.match(/swck/g) || []).length > (h1.match(/swck/g) || []).length]; }); res('Sword Index shows secret section + reveal ' + ix, ix[0] && ix[1]);
  await p.waitForTimeout(400); await clean(); await p.screenshot({ path: SH + 'secret_index.png' }); await p.evaluate(() => __g.ui.close(true));
  await p.waitForTimeout(500); res('no console errors ' + JSON.stringify(errs.slice(0, 5)), errs.length === 0);
  console.log(ok.every(Boolean) ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
