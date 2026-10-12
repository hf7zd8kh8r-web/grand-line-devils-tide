// faction ranks, achievements, charts/export, crew recruitment
const { chromium } = require('playwright-core'); const BASE = process.env.BASE || 'http://localhost:4180'; const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [];
  for (const [tag, vp, touch, fac] of [['pc', { width: 1100, height: 640 }, false, 'pirate'], ['land', { width: 844, height: 390 }, true, 'marine']]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: touch, isMobile: touch, acceptDownloads: true }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ' ' + e.message));
    await p.goto(BASE + '/?skip&anytap'); await sleep(1200); if (touch) await p.touchscreen.tap(vp.width / 2, vp.height / 2); else await p.mouse.click(400, 300); await p.waitForFunction(() => __g.mode === 'create');
    await p.evaluate(fac => { const b = [...document.querySelectorAll('#create button, #create [data-fac], #create [data-v]')].find(x => /marine/i.test(x.textContent) && fac === 'marine'); if (b) b.click(); document.querySelector('#cGo').click(); }, fac); await sleep(1500);
    const r = await p.evaluate(async () => { const g = __g.game, S = g.save; const o = { faction: S.faction }; S.lvl = 40; S.ber = 1e6; S.stats.kills = 400; S.stats.bosses = 6; g.rankCheck(); S.rankT = 0; g.rankCheck(); const ST = g.st; o.title = document.getElementById('ptitle').textContent;
      g.ui.act('crewhire:swordsman'); g.ui.act('crewhire:shooter'); o.crew = S.crew.map(c => c.role + ':' + c.name); o.followers = g.crew.list.length;
      const P = g.p.pos; const e = g.enemies.find(x => !x.boss && !x.dead); e.aggro = true; e.c.root.position.set(P.x + 3, P.y, P.z + 3); e.hp = e.max = 1e6; await new Promise(r => setTimeout(r, 4000)); o.crewDmg = Math.round(1e6 - e.hp);
      g.ui.close(true); await new Promise(r => setTimeout(r, 3500)); o.ach = Object.keys(S.ach || {}); return o; });
    console.log(tag, JSON.stringify(r));
    await p.evaluate(() => __g.game.ui.open('inv', 'stats')); await sleep(800); await p.screenshot({ path: `${__dirname}/../shots/meta_${tag}_stats.png` });
    if (!touch) { const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), p.click('[data-do="exp:csv"]')]); console.log('download', dl ? dl.suggestedFilename() : 'none'); }
    await p.evaluate(() => __g.game.ui.open('inv', 'trophies')); await sleep(700); await p.screenshot({ path: `${__dirname}/../shots/meta_${tag}_trophies.png` });
    await p.evaluate(() => __g.game.ui.open('inv', 'crew')); await sleep(700); await p.screenshot({ path: `${__dirname}/../shots/meta_${tag}_crew.png` });
    await p.evaluate(() => __g.game.ui.close(true)); await sleep(500); await p.screenshot({ path: `${__dirname}/../shots/meta_${tag}_field.png` }); await ctx.close(); }
  console.log('ERRS', errs); await b.close(); })();
