const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 1000, height: 600 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  await p.goto((process.env.BASE || 'http://localhost:4173') + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(320, 200);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.click('#cGo'); await p.waitForTimeout(1500);
  const take = id => p.evaluate(id => { const ui = __g.ui; ui.act('qtake:' + id, document.body); return __g.game.save.quest && __g.game.save.quest.text; }, id);
  // gather
  console.log('take', await take('w4')); await p.waitForTimeout(400);
  const n = await p.evaluate(() => { const g = __g.game; return g.gather ? g.gather.length : 0; }); console.log('gather items spawned', n);
  await p.evaluate(() => { const g = __g.game, it = g.gather[0]; g.p.pos.set(it.x, it.y, it.z + 8); g.p.yaw = 0; g.p.pitch = 0.1; }); await p.waitForTimeout(500); await p.screenshot({ path: __dirname + '/../shots/v3_quest_gather.png' });
  for (let i = 0; i < n; i++) { await p.evaluate(i => { const g = __g.game, it = g.gather && g.gather[i]; if (it) g.p.pos.set(it.x, it.y, it.z); }, i); await p.waitForTimeout(250); }
  console.log('after gather', await p.evaluate(() => JSON.stringify({ q: __g.game.save.quest, done: __g.game.save.qdone })));
  // talk/deliver
  console.log('take', await take('w7')); await p.evaluate(() => { const g = __g.game; const n = g.npcs.find(n => n.name === 'Shipwright Dan'); __g.ui.talk(n); }); console.log('after talk', await p.evaluate(() => JSON.stringify({ q: __g.game.save.quest, done: __g.game.save.qdone, modal: __g.ui.modal })));
  // timed
  console.log('take', await take('w6')); await p.evaluate(() => { const g = __g.game; const e = g.enemies.find(e => e.s.type === 'bandit' && !e.dead); g.killEnemy ? g.killEnemy(e) : null; }); await p.waitForTimeout(300);
  await p.screenshot({ path: __dirname + '/../shots/v3_quest_timed.png' }); console.log('timed', await p.evaluate(() => JSON.stringify(__g.game.save.quest)));
  // fish event
  await p.evaluate(() => { __g.ui.act('qdrop', document.body); }); console.log('take', await take('w5')); await p.evaluate(() => { __g.game.questEvent('fish'); __g.game.questEvent('fish'); }); console.log('fish done', await p.evaluate(() => __g.game.save.qdone.includes('w5')));
  // generic island list
  console.log('orange quests', await p.evaluate(() => { __g.game.loadIsland('orange', false); return document.querySelector('#quest').textContent; }));
  console.log('ERRS', errs.slice(0, 10)); await b.close();
})();
