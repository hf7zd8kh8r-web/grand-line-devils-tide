// Rarity light pillars for the world fruit hunt -> shots/beams_rarity.png.  BASE=http://localhost:4173 node test/beams.cjs
const { chromium } = require('playwright-core'); const BASE = process.env.BASE || 'http://localhost:4173';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 640 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto(BASE + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(300, 300);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.click('#cGo'); await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 20000 }); await p.waitForTimeout(800);
  const r = await p.evaluate(() => { const g = __g.game, H = g.hunt; window.requestAnimationFrame = () => 0; g.amb && (g.amb.phase = () => 0.75); __forceFruit('gomu'); for (let i = 0; i < 3; i++) g.update(1 / 30);
    const { FR } = window; const byR = {}; for (const [k, f] of Object.entries(__g.FRUITS || {})) byR[f.rar] = byR[f.rar] || k; const objs = []; if (H.obj) { H.obj.grp.visible = false; }
    const ids = ['bomu', 'gomu', 'hana', 'mera', 'hie', 'yami', 'gura', 'nika'];
    ids.forEach((id, i) => { const f = __g.FRUITS ? __g.FRUITS[id] : null; H.place({ fruit: id, rar: i, seed: 1000 + i * 77, island: g.island.id }); const o = H.obj; const x = -42 + i * 12, z = -30; o.grp.position.set(x, g.groundAt(x, z), z); o.x = x; o.z = z; objs.push(o); });
    g.p.pos.set(0, g.groundAt(0, 40) , 40); g.p.yaw = 0; g.p.pitch = 0.18; g.hideVM = true;
    for (let k = 0; k < 40; k++) { for (const o of objs) { H.obj = o; H.isl = g.island; H.update(1 / 30); } g.update(1 / 30); }
    g.render(); return objs.length; });
  await p.screenshot({ path: __dirname + '/../shots/beams_rarity.png' }); console.log('beams', r, 'ERRS', errs.length, JSON.stringify(errs.slice(0, 3))); await b.close(); })();
