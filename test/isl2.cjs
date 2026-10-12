const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 800, height: 450 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(320, 200);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.click('#cGo'); await p.waitForTimeout(800);
  const pre = process.argv[3] || 'v4_isl_';
  const list = (process.argv[2] || 'windmill,shells,orange,syrup,baratie,arlong,loguetown,whisky,alabasta,skypiea,water7,enies,thriller,sabaody,amazon,impel,marineford,fishman,punk,dressrosa,zou,wci,wano,egghead').split(',');
  await p.evaluate(() => { document.getElementById('hud').style.display = 'none'; const g = __g.game; g.vm.root.visible = false; g.vm.render = () => {}; const o = g.update.bind(g); g.update = dt => { o(dt); if (window.__fly) { g.p.pos.copy(window.__fly.p); g.p.vy = 0; g.p.yaw = window.__fly.yaw; g.p.pitch = window.__fly.pitch; } }; });
  for (const id of list) {
    await p.evaluate(id => { const g = __g.game; g.save.lvl = 400; g.loadIsland(id, false); const I = g.island; const R = I.R; window.__fly = { p: new __dbg.THREE.Vector3(R * 0.35, 0, R * 1.05), yaw: Math.atan2(R * 0.35, R * 1.05), pitch: -0.32 }; window.__fly.p.y = Math.max(g.groundAt(R * 0.35, R * 1.05), 0) + R * 0.42 + 6; document.querySelectorAll('.ebar,.banner,#toasts>*').forEach(e => e.style.display = 'none'); }, id);
    await p.waitForTimeout(900); await p.evaluate(() => document.querySelectorAll('.banner,#banner,.isltitle,#isl').forEach(e => e.style.display = 'none'));
    await p.screenshot({ path: __dirname + '/../shots/' + pre + id + '.png' });
  }
  console.log('ERRS', errs.slice(0, 10)); await b.close();
})();
