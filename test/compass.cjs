// HUD compass: points at the nearest Quest Board with no quest, at the quest target with one, and turns with the camera.
const { chromium } = require('playwright-core');
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 960, height: 540 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push('PE ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  const ok = (n, c, x = '') => console.log(c ? 'PASS' : 'FAIL', n, x); const ev = (f, a) => p.evaluate(f, a);
  await p.goto((process.env.BASE || 'http://127.0.0.1:5397') + '/?skip&anytap'); await p.waitForFunction(() => window.__g, null, { timeout: 30000 }); await p.waitForTimeout(1200); await p.mouse.click(480, 270);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForTimeout(2500);
  const read = () => ev(() => { const m = document.getElementById('cmpT'); return m && { txt: m.lastChild.textContent, tr: m.style.transform, cls: m.className, vis: m.style.display !== 'none' }; });
  await ev(() => { const S = __g.game.save; S.quests = []; S.quest = null; }); await p.waitForTimeout(1800); let r = await read(); ok('no quest -> nearest Quest Board', r && r.vis && /Quest Board/.test(r.txt), JSON.stringify(r));
  await ev(() => { const g = __g.game, S = g.save; const q = { id: 'w1', giver: 'Makino', type: 'kill', target: 'bandit', n: 4, have: 0, xp: 1, ber: 1 }; S.quests = [q]; S.quest = q; const e = g.enemies.find(x => x.s.type === 'bandit' && !x.dead); const d = { x: e.c.root.position.x - g.p.pos.x, z: e.c.root.position.z - g.p.pos.z }; g.p.yaw = Math.atan2(-d.x, -d.z); });
  await p.waitForTimeout(600); r = await read(); ok('kill quest -> target pack, centred when facing it', /Bandit/i.test(r.txt) && Math.abs(parseFloat(r.tr.slice(11))) <= 40, JSON.stringify(r)); await p.screenshot({ path: `${__dirname}/../shots/compass.png`, clip: { x: 230, y: 0, width: 500, height: 90 } }); await p.screenshot({ path: `${__dirname}/../shots/compass_full.png` });
  await ev(() => { __g.game.p.yaw += Math.PI / 2; }); await p.waitForTimeout(600); r = await read(); ok('turning left puts the marker off to the right', /off r/.test(r.cls), JSON.stringify(r));
  ok('zero console errors', !errs.length, JSON.stringify(errs.slice(0, 4))); await b.close(); })();
