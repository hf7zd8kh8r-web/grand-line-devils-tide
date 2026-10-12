// Lineup of characters for visual review: node test/gallery.cjs name type1,type2,...  (types = ENEMIES keys or look ids prefixed with "L:")
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 1000, height: 560 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(320, 200);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.click('#cGo'); await p.waitForTimeout(800);
  const name = process.argv[2] || 'gallery'; const types = (process.argv[3] || 'L:player_pirate,L:player_marine,L:makino,L:mayor,L:bandit,higuma,morgan').split(',');
  const pose = process.argv[4] || 'idle';
  await p.evaluate(([types, pose, dist]) => { const g = __g.game, D = __dbg; document.getElementById('hud').style.display = 'none';
    g.enemies.forEach(e => e.c.root.visible = false); (g.npcs || []).forEach(n => { n.c.root.visible = false; if (n.mark) n.mark.visible = false; }); (g.fakes || []).forEach(f => f.c && (f.c.root.visible = false));
    const P = g.p.pos; const yaw = g.p.yaw; const fw = new D.THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)), rt = new D.THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    window.__gal = types.map((t, i) => { const def = t.startsWith('L:') ? { look: t.slice(2) } : D.ENEMIES[t]; const c = D.makeChar(def.look, { ...(def.lookO || {}), scale: Math.min(def.scale || 1, 1.25) });
      const off = (i - (types.length - 1) / 2) * (dist < 3 ? 0.75 : 1.25); const pos = P.clone().addScaledVector(fw, dist).addScaledVector(rt, off); pos.y = g.island.hf(pos.x, pos.z); c.root.position.copy(pos); c.root.rotation.y = yaw; g.scene.add(c.root); return c; });
    g.p.pitch = -0.08; window.__pose = pose; const orig = g.update.bind(g); g.update = dt => { orig(dt); const t = g.t; __gal.forEach((c, i) => D.animChar(c, pose === 'walk' ? { move: 1, phase: t * 9 + i } : pose === 'attack' ? { attack: ((t * 0.8 + i * 0.2) % 1) } : pose === 'sit' ? { sit: 1, talk: 1 } : { move: 0 }, t)); }; }, [types, pose, +(process.env.DIST || 4.6)]);
  await p.waitForTimeout(900); await p.screenshot({ path: __dirname + '/../shots/' + name + '.png' });
  console.log('ERRS', errs.slice(0, 10)); await b.close();
})();
