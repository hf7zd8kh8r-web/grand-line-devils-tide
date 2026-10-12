// v5 before/after screenshots: combat VFX, block, fruits, islands, NPCs, UI
const { chromium } = require('playwright-core'); const BASE = process.env.BASE || 'http://localhost:4180'; const PRE = process.argv[2] || 'after';
const sleep = ms => new Promise(r => setTimeout(r, ms)); const out = n => `${__dirname}/../shots/v5_${PRE}_${n}.png`;
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] }); const errs = [];
  const p = await (await b.newContext({ viewport: { width: 960, height: 540 } })).newPage(); p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto(BASE + '/?skip&anytap'); await sleep(2500); await p.screenshot({ path: out('cover') }); await p.mouse.click(480, 270); await p.waitForFunction(() => __g.mode === 'create'); await sleep(400); await p.screenshot({ path: out('create') }); await p.click('#cGo'); await sleep(1800);
  await p.evaluate(() => { const g = __g.game, S = g.save; S.lvl = 60; S.ber = 1e7; S.hp = 1e6; g.amb.phase = () => 0.3; g.events.timer = 1e9; });
  const setup = () => p.evaluate(() => { const g = __g.game; const P = g.p.pos; g.p.yaw = 0; g.p.pitch = -0.05; const e = g.enemies.find(x => !x.boss && !x.dead) || g.enemies[0]; e.dead = false; e.c.root.visible = true; e.hp = e.max = 1e7; e.aggro = false; e.state = 'idle'; e.c.root.position.set(P.x, g.groundAt(P.x, P.z - 2.3), P.z - 2.3); e.c.root.rotation.y = 0; return true; });
  const snap = async (n, fn, wait = 90) => { await setup(); await sleep(200); await p.evaluate(fn); await sleep(wait); await p.screenshot({ path: out(n) }); };
  await snap('punch', () => { const g = __g.game; g.save.slot = 'fist'; g.refreshEquip(); g.p.atkCd = 0; g.p.comboT = 1; g.p.combo = 3; g.attack(); }, 80);
  await snap('sword', () => { const g = __g.game, S = g.save; if (!S.inv.swords.includes('wado')) S.inv.swords.push('wado'); S.eq.sword = 'wado'; S.slot = 'sword'; g.refreshEquip(); g.p.atkCd = 0; g.attack(); }, 110);
  await snap('gun', () => { const g = __g.game, S = g.save; const k = Object.keys(window.__GUNS || {})[0]; S.eq.gun = 'flintlock'; if (!S.inv.guns.includes(S.eq.gun)) S.inv.guns.push(S.eq.gun); S.slot = 'gun'; g.refreshEquip(); g.p.atkCd = 0; g.attack(); }, 40);
  await snap('fruit', () => { const g = __g.game, S = g.save; S.mastery['fr:mera'] = { lvl: 60, xp: 0 }; S.inv.fruits.push('mera'); S.eq.fruit = 'mera'; S.slot = 'fruit'; g.refreshEquip(); g.p.cds = {}; g.move(0); }, 250);
  await snap('block', () => { const g = __g.game; g.save.slot = 'fist'; g.refreshEquip(); __g.IN.held.block = true; setTimeout(() => { const P = g.p.pos; g.hurtPlayer(10, P.clone().setZ(P.z - 2), { kb: 1 }); }, 250); }, 420);
  await p.evaluate(() => { __g.IN.held.block = false; });
  await p.evaluate(() => __g.game.ui.open('inv', 'fruits')); await sleep(600); await p.screenshot({ path: out('fruits_inv') }); await p.evaluate(() => __g.game.ui.close(true));
  await p.evaluate(() => __g.game.ui.open('menu')); await sleep(500); await p.screenshot({ path: out('menu') }); await p.evaluate(() => __g.game.ui.close(true));
  for (const id of ['windmill', 'shells', 'orange', 'alabasta', 'water7', 'wano']) { await p.evaluate(id => { const g = __g.game; g.loadIsland(id, false); g.p.yaw = 0; g.p.pitch = 0.02; const I = g.island; g.p.pos.set(0, 0, I.R * 0.25); g.p.pos.y = g.groundAt(0, I.R * 0.25); g.events.timer = 1e9; }, id).catch(e => console.log(id, e.message)); await sleep(1300); await p.screenshot({ path: out('isl_' + id) }); }
  // NPC close-up: villager in front
  await p.evaluate(() => { const g = __g.game; g.loadIsland('windmill', false); }); await sleep(1200);
  await p.evaluate(() => { const g = __g.game; const n = g.npcs.find(n => n.def && n.def.role === 'quest') || g.npcs[0]; const R = n.c.root.position; g.p.pos.set(R.x, R.y, R.z + 2.6); g.p.yaw = 0; g.p.pitch = -0.12; }); await sleep(600); await p.screenshot({ path: out('npc') });
  console.log('ERRS', errs); await b.close(); })();
