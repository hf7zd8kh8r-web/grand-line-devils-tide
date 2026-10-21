// Visual shots: character lineup (chars2_*), first-person hands (hands2_*), Armament Haki colours (haki2_*). MODE=before|after. Zero console errors.
const { chromium } = require('playwright-core');
const MODE = process.env.MODE || 'after', BASE = process.env.BASE || 'http://127.0.0.1:5401', SH = `${__dirname}/../shots/`;
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 960, height: 540 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push('PE ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket|net::/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  const ok = (n, c, x = '') => console.log(c ? 'PASS' : 'FAIL', n, x); const ev = (f, a) => p.evaluate(f, a);
  await p.goto(BASE + '/?skip&anytap'); await p.waitForFunction(() => window.__g, null, { timeout: 60000 }); await p.waitForTimeout(1200); await p.mouse.click(480, 270);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 30000 }); await p.click('#cGo'); await p.waitForTimeout(3000);
  await ev(() => { const hideUI = () => { for (const el of document.body.children) if (el.tagName !== 'CANVAS' && !el.querySelector('canvas')) el.style.visibility = 'hidden'; }; hideUI(); window.__hu = setInterval(hideUI, 200); });
  // ---- hands ----
  await ev(() => { const g = __g.game; g.save.haki = null; g.p.pitch = -0.1; }); await p.waitForTimeout(1200); await p.screenshot({ path: `${SH}hands2_${MODE}_fist.png` });
  await ev(() => { const g = __g.game; g.attack && (g.p.atkCd = 0, g.attack()); }); await p.waitForTimeout(110); await p.screenshot({ path: `${SH}hands2_${MODE}_punch.png` }); await p.waitForTimeout(900);
  for (const c of ['black', 'crimson', 'gold', 'blue', 'voidc']) { await ev(c => { const g = __g.game; g.save.haki = { buso: true }; g.save.hakiCol = c; }, c); await p.waitForTimeout(900); await p.screenshot({ path: `${SH}haki2_${MODE}_${c}.png` }); }
  await ev(() => { __g.game.save.haki = null; }); await p.waitForTimeout(300);
  // ---- character lineup ----
  const n = await ev(async () => { const g = __g.game; const CH = await import('/src/chars.js'); const { ENEMIES } = await import('/src/data.js');
    for (const e of g.enemies) e.c.root.visible = false, e.ext = () => { e.c.root.visible = false; };
    for (const n of (g.npcs || [])) n.c && (n.c.root.visible = false);
    const P = g.p.pos; const yaw = g.p.yaw; const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const L = [['player_pirate', {}], ['player_marine', {}], ['makino', {}], ['villager', {}], ['marine', {}], ['bandit', {}], ['thug', {}], ['gen', (ENEMIES.alabasta_boss || {}).lookO || {}], ['gen', (ENEMIES.orange_boss || {}).lookO || {}], ['rika', {}]];
    window.__line = []; L.forEach(([id, o], i) => { const c = CH.makeChar(id, o); const k = (i - (L.length - 1) / 2) * 0.95; c.root.position.set(P.x + fx * 5.2 + rx * k, 0, P.z + fz * 5.2 + rz * k); c.root.position.y = g.groundAt(c.root.position.x, c.root.position.z); c.root.rotation.y = yaw; g.scene.add(c.root); window.__line.push(c); });
    let t = 0; window.__li = setInterval(() => { t += 0.05; for (const c of window.__line) CH.animChar(c, { idleV: false, phase: 0 }, t); }, 50); g.p.pitch = -0.12; return L.length; });
  await p.waitForTimeout(1500); await p.screenshot({ path: `${SH}chars2_${MODE}_lineup.png` });
  await ev(() => { const g = __g.game; const P = g.p.pos; g.p.pos.set(P.x + -Math.sin(g.p.yaw) * 3.4, P.y, P.z + -Math.cos(g.p.yaw) * 3.4); g.p.pitch = -0.05; }); await p.waitForTimeout(1200); await p.screenshot({ path: `${SH}chars2_${MODE}_close.png` });
  await ev(() => { const g = __g.game; const P = g.p.pos; const c = window.__line[0]; g.p.pos.set(c.root.position.x + -Math.sin(g.p.yaw) * -1.05, P.y, c.root.position.z + -Math.cos(g.p.yaw) * -1.05); g.p.pitch = -0.02; }); await p.waitForTimeout(1200); await p.screenshot({ path: `${SH}chars2_${MODE}_portrait.png` });
  await ev(() => { const g = __g.game; const c = window.__line[7]; g.p.pos.set(c.root.position.x + -Math.sin(g.p.yaw) * -2.0, g.p.pos.y, c.root.position.z + -Math.cos(g.p.yaw) * -2.0); }); await p.waitForTimeout(1000); await p.screenshot({ path: `${SH}chars2_${MODE}_boss.png` });
  ok('shots taken', n === 10); ok('zero console errors', !errs.length, JSON.stringify(errs.slice(0, 4))); await b.close(); })();
