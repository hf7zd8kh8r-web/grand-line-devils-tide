// real-touch HUD buttons test with an old minimal save. node test/bag.cjs WxH
const { chromium } = require('playwright-core');
const [W, H] = (process.argv[2] || '390x844').split('x').map(Number);
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); const errs = []; const cdp = await ctx.newCDPSession(p);
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/?skip&anytap');
  await p.evaluate(() => { const old = { v: 1, name: 'Old', faction: 'pirate', race: 'Human', lvl: 3, xp: 5, ber: 40, hp: null, island: 'windmill', unlocked: ['windmill'], boat: false, inv: { swords: ['rusty'], guns: [], fruits: [], wear: [] }, eq: { sword: null, gun: null, fruit: null }, slot: 'fist', mastery: {}, quest: null, qdone: [], kills: {}, stats: { kills: 2 } }; for (const k of Object.keys(localStorage)) if (/save|gldt/i.test(k) && !/quality/.test(k)) localStorage.removeItem(k); localStorage.setItem('gldt_save_v1', JSON.stringify(old)); });
  await p.reload(); await p.waitForTimeout(1500); await p.touchscreen.tap(W / 2, H / 2); await p.waitForTimeout(800);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.click('#cCont');
  await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 20000 }); await p.waitForTimeout(1200);
  const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(q => ({ x: q[0], y: q[1], id: q[2] })) });
  for (const ui of ['inv', 'map', 'pause']) for (const hold of [false, true]) {
    const r = await p.evaluate(ui => { const e = document.querySelector(`[data-ui=${ui}]`).getBoundingClientRect(); const x = e.left + e.width / 2, y = e.top + e.height / 2; const top = document.elementFromPoint(x, y); return [x, y, top && (top.closest('[data-ui]') ? 'ok' : (top.id || top.className || top.tagName))]; }, ui);
    if (hold) { await T('touchStart', [[W * 0.7, H * 0.55, 5]]); await T('touchMove', [[W * 0.7 - 20, H * 0.55, 5]]); }
    const pts = hold ? [[W * 0.7 - 20, H * 0.55, 5]] : [];
    await T('touchStart', [...pts, [r[0], r[1], 7]]); await p.waitForTimeout(60); await T('touchEnd', pts.length ? pts : []); if (hold) await T('touchEnd', []);
    await p.waitForTimeout(500); const m = await p.evaluate(() => __g.ui.modal); console.log(ui, hold ? '(look finger held)' : '', 'hit:', r[2], '-> modal', m, m === ui ? 'PASS' : 'FAIL');
    await p.evaluate(() => __g.ui.close(true)); await p.waitForTimeout(200);
  }
  const tapEl = async sel => { const r = await p.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel); if (!r) return false; await T('touchStart', [[r[0], r[1], 9]]); await p.waitForTimeout(50); await T('touchEnd', []); await p.waitForTimeout(700); return true; };
  await tapEl('[data-ui=inv]'); await p.waitForTimeout(300); const tb = await p.evaluate(() => { const b = [...document.querySelectorAll('#panel .tabs button')].find(b => /haki/i.test(b.textContent)); if (b) b.id = 'tHaki'; return !!b; });
  console.log('tabs found', tb, await p.evaluate(() => __g.ui.modal + ' ' + document.querySelector('#panel').innerText.slice(0, 160))); if (tb) { await tapEl('#tHaki'); console.log('tab tap -> haki tree shown', await p.evaluate(() => !!document.querySelector('.htree')) ? 'PASS' : 'FAIL'); }
  await tapEl('#panel [data-close]'); console.log('X closes', await p.evaluate(() => __g.ui.modal) ? 'FAIL' : 'PASS');
  // NPC dialogs for every NPC (tap the action button nearby)
  const npcs = await p.evaluate(() => __g.game.npcs.map((n, i) => [i, n.name, n.role])); let bad = [];
  for (const [i, name, role] of npcs) { await p.evaluate(i => { const g = __g.game; const n = g.npcs[i]; g.p.pos.set(n.x, 0, n.z + 1.6); g.p.pos.y = g.groundAt(n.x, n.z + 1.6); g.p.yaw = 0; __g.ui.close(true); }, i); await p.waitForTimeout(250);
    await p.evaluate(i => { __g.ui.talk(__g.game.npcs[i]); }, i); await p.waitForTimeout(200);
    const st = await p.evaluate(() => { const P = document.getElementById('panel'); const b = P.querySelector('.pbox'); if (P.style.display !== 'flex') return 'closed'; if (!b) return 'BLUR-ONLY'; const r = b.getBoundingClientRect(); return r.height > 40 && r.top >= -1 && r.bottom <= innerHeight + 1 ? 'ok' : 'offscreen ' + Math.round(r.top) + ',' + Math.round(r.bottom); });
    if (st !== 'ok' && st !== 'closed') bad.push(name + '/' + role + ':' + st); }
  console.log('NPC dialogs', npcs.length, bad.length ? 'FAIL ' + bad.join(' | ') : 'PASS'); await p.evaluate(() => __g.ui.close(true));
  await p.evaluate(() => __g.ui.open('inv')); for (const t of ['gear', 'mastery', 'haki', 'stats', 'ranks', 'styles', 'dex']) { try { await p.evaluate(t => __g.ui.open('inv', t), t); } catch (e) { console.log('TAB FAIL', t, e.message.slice(0, 200)); } }
  console.log('ERRS', errs); await b.close();
})();
