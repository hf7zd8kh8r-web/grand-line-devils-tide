// cast every Legendary special among a crowd of bandits; screenshot mid-cutscene, confirm damage
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 960, height: 540 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(480, 270); await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForTimeout(1500);
  for (const id of (process.argv[2] || 'mera,hie,ito,ope,nikyu,yami,toki,bisu,mira,shiro').split(',')) {
    const r0 = await p.evaluate(id => { const g = __g.game, S = g.save; S.lvl = 60; S.mastery['fr:' + id] = { lvl: 60, xp: 0 }; S.inv.fruits.push(id); S.eq.fruit = id; S.slot = 'fruit'; g.refreshEquip(); g.st = g.st; S.hp = 99999;
      const P = g.p.pos; const live = g.enemies.filter(e => !e.boss); live.forEach((e, i) => { e.dead = false; e.c.root.visible = true; e.hp = e.maxHp || 999; const a = i / live.length * 6.28; e.c.root.position.set(P.x + Math.cos(a) * 6, g.groundAt(P.x + Math.cos(a) * 6, P.z + Math.sin(a) * 6), P.z + Math.sin(a) * 6); e.aggro = false; });
      g.p.special = 100; S.hp = Math.round(g.st.maxHp * 0.3); const before = live.reduce((a, e) => a + e.hp, 0); g.special(); return { before, cut: !!g.cut, name: document.querySelector('#specialCard, .spcard') ? document.querySelector('#specialCard, .spcard').innerText.replace(/\s+/g, ' ').slice(0, 60) : '' }; }, id);
    await p.waitForTimeout(2600); await p.screenshot({ path: `${__dirname}/../shots/legsp_${id}.png` }); await p.waitForTimeout(2600);
    const r1 = await p.evaluate(() => { const g = __g.game; return { after: g.enemies.filter(e => !e.boss).reduce((a, e) => a + Math.max(0, e.hp), 0), cutDone: !g.cut }; });
    console.log(id, r0.cut ? 'cut' : 'NO CUT', r0.name, '| dmg', r0.before - r1.after, r1.cutDone ? '' : 'STILL IN CUT'); }
  console.log('ERRS', errs); await b.close(); })();
