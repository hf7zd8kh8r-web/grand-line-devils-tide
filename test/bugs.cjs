// regression for real-device bugs: knockback, stuck at sea, travel hint. node test/bugs.cjs WxH
const { chromium } = require('playwright-core');
const [W, H] = (process.argv[2] || '844x390').split('x').map(Number);
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/?skip&anytap'); await p.waitForTimeout(1200); await p.touchscreen.tap(W / 2, H / 2);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${__dirname}/../shots/bugs_${W}_hint.png` });
  console.log('travel hint:', await p.evaluate(() => document.getElementById('travel').innerText));
  // knockback: 6 rapid hits from an adjacent bandit, then let the game run 2s
  const kb = await p.evaluate(async () => { const g = __g.game; const e = g.enemies.find(e => !e.boss); const P = g.p.pos; const start = P.clone(); e.c.root.position.set(P.x + 0.8, P.y, P.z);
    g.save.hp = 99999; for (let i = 0; i < 6; i++) { g.p.iframe = 0; g.hurtPlayer(5, e.c.root.position, { kb: 3 }); }
    await new Promise(r => setTimeout(r, 2000)); const d1 = Math.hypot(P.x - start.x, P.z - start.z);
    // boss heavy + a dt spike
    const s2 = P.clone(); g.p.iframe = 0; g.hurtPlayer(5, new __dbg.THREE.Vector3(P.x + 1, P.y, P.z), { kb: 10 }); g.update(1.0); await new Promise(r => setTimeout(r, 1500)); const d2 = Math.hypot(P.x - s2.x, P.z - s2.z);
    return [d1.toFixed(2), d2.toFixed(2)]; }).catch(e => 'ERR ' + e.message);
  console.log('knockback dist normal x6 / heavy+dt spike:', kb);
  // sea: drop player into the water just off shore, wait for the shore button, press it
  const sea = await p.evaluate(async () => { const g = __g.game; const R = g.island.R; g.p.pos.set(R + 6, -0.95, 0); await new Promise(r => setTimeout(r, 4500)); const btn = document.body.classList.contains('canShore'); const sb = document.getElementById('shoreBtn'); const vis = getComputedStyle(sb).display !== 'none';
    sb.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' })); sb.click(); await new Promise(r => setTimeout(r, 500)); const onLand = g.groundAt(g.p.pos.x, g.p.pos.z) > 0.5;
    g.p.pos.set(R + 40, -0.95, 10); await new Promise(r => setTimeout(r, 800)); const auto = g.groundAt(g.p.pos.x, g.p.pos.z) > 0.5 && Math.hypot(g.p.pos.x, g.p.pos.z) < R;
    return { swimBtn: btn && vis, onLand, autoRescue: auto }; }).catch(e => 'ERR ' + e.message);
  console.log('sea:', JSON.stringify(sea));
  await p.evaluate(() => { const g = __g.game; g.p.pos.set(0, 0, g.island.R * 0.6); g.p.pos.y = g.groundAt(g.p.pos.x, g.p.pos.z); g.p.yaw = 0; g.p.pitch = 0.05; }); await p.waitForTimeout(700);
  await p.screenshot({ path: `${__dirname}/../shots/bugs_${W}_horizon.png` });
  console.log('ERRS', errs); await b.close();
})();
