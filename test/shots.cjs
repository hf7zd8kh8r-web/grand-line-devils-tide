const { chromium } = require('playwright-core');
const OUT = __dirname + '/../shots/';
const URL = process.env.URL || (process.env.BASE || 'http://localhost:4173') + '/';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const which = process.argv[2] || 'both';
  const runs = which === 'both' ? ['m', 'd'] : [which];
  for (const r of runs) {
    const mob = r === 'm'; const pre = mob ? 'm_' : 'd_';
    const ctx = await b.newContext({ viewport: mob ? { width: 390, height: 844 } : { width: 1280, height: 800 }, hasTouch: mob, isMobile: mob, deviceScaleFactor: 1 });
    const p = await ctx.newPage(); const errs = [];
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
    p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
    const shot = async n => { await p.screenshot({ path: OUT + pre + n + '.png' }); console.log(r, 'shot', n); };
    const ev = (f, a) => p.evaluate(f, a);
    const fps = async () => ev(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else res(n); }; requestAnimationFrame(f); }));
    await p.goto(URL + '?skip&anytap' + (process.env.FRUIT ? '&fruit=' + process.env.FRUIT : ''));
    await p.waitForTimeout(2500); await shot('cover');
    if (mob) await p.touchscreen.tap(195, 420); else await p.mouse.click(640, 400);
    await p.waitForTimeout(1500); await shot('cinematic');
    try { await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); } catch (e) { console.log('ERRS', errs, await ev(() => __g.mode)); throw e; }
    await p.waitForTimeout(800);
    await p.fill('#cName', 'Adam'); await p.click('#cRace button[data-v="Mink"]'); await p.waitForTimeout(400); await shot('create');
    await p.click('#cGo'); await p.waitForTimeout(1500); await shot('spawn');
    console.log(r, 'fps(spawn)', await fps());
    // combat: teleport near bandits, face one
    await ev(() => { const g = __g.game; const e = g.enemies.find(e => e.s.type === 'bandit'); const P = e.c.root.position; g.p.pos.set(P.x, 0, P.z + 3.2); g.p.pos.y = g.groundAt(g.p.pos.x, g.p.pos.z); g.p.yaw = 0; g.p.pitch = -0.08; e.aggro = true; window.__e = e; });
    for (let i = 0; i < 8; i++) { await ev(() => { const g = __g.game; let e = g.enemies.filter(e=>!e.dead).sort((a,b)=>a.c.root.position.distanceTo(g.p.pos)-b.c.root.position.distanceTo(g.p.pos))[0]; const P = e.c.root.position; g.p.yaw = Math.atan2(-(P.x - g.p.pos.x), -(P.z - g.p.pos.z)); __g.IN.pressed.add('attack'); }); await p.waitForTimeout(260); }
    await shot('combat');
    console.log(r, 'state', await ev(() => { const g = __g.game; return { lvl: g.save.lvl, ber: g.save.ber, hp: g.save.hp, kills: g.save.stats.kills, enemies: g.enemies.length, calls: 0 }; }));
    // sword
    await ev(() => { const g = __g.game; g.save.inv.swords.push('cutlass'); g.save.eq.sword = 'cutlass'; g.save.slot = 'sword'; g.refreshEquip(); const e = g.enemies.find(e => !e.dead && e.s.type === 'bandit' && e !== window.__e) || window.__e; window.__e = e; const P = e.c.root.position; g.p.pos.set(P.x + 2.5, 0, P.z); g.p.pos.y = g.groundAt(g.p.pos.x, g.p.pos.z); g.p.yaw = Math.PI / 2; e.aggro = true; });
    for (let i = 0; i < 3; i++) { await ev(() => __g.IN.pressed.add('attack')); await p.waitForTimeout(200); }
    await shot('sword');
    // fruit: light
    await ev(() => { const g = __g.game; g.save.eq.fruit = 'pika'; g.save.mastery['fr:pika'] = { lvl: 20, xp: 0 }; g.save.slot = 'fruit'; g.refreshEquip(); });
    await ev(() => __g.IN.pressed.add('m1')); await p.waitForTimeout(700); await shot('fruit_light');
    await ev(() => { const g = __g.game; g.save.eq.fruit = 'mera'; g.save.mastery['fr:mera'] = { lvl: 20, xp: 0 }; g.refreshEquip(); __g.IN.pressed.add('m2'); }); await p.waitForTimeout(500); await shot('fruit_flame');
    await ev(() => { const g = __g.game; g.save.eq.fruit = 'gomu'; g.save.mastery['fr:gomu'] = { lvl: 20, xp: 0 }; g.refreshEquip(); __g.IN.pressed.add('m1'); }); await p.waitForTimeout(150); await shot('fruit_gomu');
    await ev(() => { const g = __g.game; g.save.eq.fruit = 'pika'; g.refreshEquip(); g.p.special = 100; __g.IN.pressed.add('special'); }); await p.waitForTimeout(2200); await shot('special');
    await p.waitForTimeout(2500);
    // boss intro
    await ev(() => { const g = __g.game; g.p.pos.set(0, 0, -30); g.p.pos.y = g.groundAt(0, -30); for (const e of g.enemies) if(!e.boss) { e.aggro=false; e.c.root.position.x += 0; } g.p.yaw = 0; g.p.pitch = 0; });
    await p.waitForTimeout(2200); await shot('boss_intro');
    await p.waitForTimeout(3000); await shot('boss_fight');
    // UI panels
    await ev(() => __g.ui.open('map')); await p.waitForTimeout(300); await shot('map'); await ev(() => __g.ui.close());
    await ev(() => __g.ui.open('inv')); await p.waitForTimeout(300); await shot('inv'); await ev(() => __g.ui.close());
    await ev(() => { const g = __g.game; g.ui.open('shop', 'fruits2'); }); await p.waitForTimeout(200); await shot('shop'); await ev(() => __g.ui.close());
    // sail to shells
    await ev(() => { const g = __g.game; g.save.boat = true; g.save.lvl = 9; g.ui.onSail('shells'); }); await p.waitForTimeout(1500); await shot('sailing');
    await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 15000 }); await p.waitForTimeout(1500); await shot('shells');
    console.log(r, 'fps(shells)', await fps());
    await ev(() => { const g = __g.game; g.p.pos.set(0, 0, -10); g.p.pos.y = g.groundAt(0, -10); g.p.yaw = 0; }); await p.waitForTimeout(2000); await shot('morgan_intro');
    await p.waitForTimeout(4000); await shot('morgan_fight');
    console.log(r, 'renderer', await ev(() => { return JSON.stringify(window.__g.game && { islands: __g.game.island.id, saved: !!localStorage.getItem('gldt_save_v1') }); }));
    console.log(r, 'ERRORS', errs.length, errs.slice(0, 15));
    await ctx.close();
  }
  await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
