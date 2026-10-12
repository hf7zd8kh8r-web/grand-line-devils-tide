const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 800, height: 600 } })).newPage();
  p.on('pageerror', e => console.log('PE', e.message));
  await p.goto((process.env.BASE || 'http://localhost:4173') + '/?skip&anytap'); await p.waitForTimeout(1500); await p.mouse.click(400, 300);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.click('#cGo'); await p.waitForTimeout(800);
  const r = await p.evaluate(async () => { const g = __g.game; const e = g.enemies.find(e => e.s.type === 'bandit'); const P = e.c.root.position; g.p.pos.set(P.x, 0, P.z + 2); g.p.pos.y = g.groundAt(g.p.pos.x, g.p.pos.z); g.p.yaw = 0;
    const out = [JSON.stringify(P), JSON.stringify(g.p.pos), e.hp, g.enemiesInCone(2.7, 0.45).length, g.p.atkCd, g.ui.modal, !!g.cut, g.dead];
    g.p.atkCd=0; __g.IN.pressed.add('attack'); await new Promise(r=>setTimeout(r,400)); out.push(e.hp, [...__g.IN.pressed], __g.mode, g.running, JSON.stringify(e.c.root.position)); return out; });
  console.log(r); await b.close();
})();
