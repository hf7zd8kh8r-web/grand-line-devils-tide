// Character contact sheets: NPC/villager/grunt/player lineup + boss lineup + town crowd. OUT=after|before BASE=... node test/opchars.cjs
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8111', OUT = process.env.OUT || 'after'; const SH = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = []; const p = await (await b.newContext({ viewport: { width: 1280, height: 640 } })).newPage(); p.on('pageerror', e => errs.push('PE ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto(BASE + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(200, 200);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.fill('#cName', 'Sheet'); await p.click('#cGo'); await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 20000 }); await p.waitForTimeout(1500); await p.evaluate(() => __g.ui.close && __g.ui.close(true));
  await p.addStyleTag({ content: '#hud,#toasts,#banner,#bars,.ebar,#tvBar,#specialcard{display:none!important}' });
  const lineup = (kind) => p.evaluate((kind) => { const g = __g.game; (window.__shown || []).forEach(c => g.scene.remove(c.root)); window.__shown = []; const Y = 60; const list = [];
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    if (kind === 'npc') { for (const id of ['makino', 'mayor', 'coby', 'rika', 'smith', 'villager', 'bandit', 'thug', 'marine']) list.push(__mk(id, {})); for (let i = 0; i < 4; i++) { const R = __rl(r, i % 2 ? 'Marine' : 'Pirate'); list.push(__av(R)); } for (let i = 0; i < 3; i++) list.push(__mk('villager', { shirt: [0x4a7fb8, 0xd0703a, 0x7a9a5a][i], hair: [0x5a3a1a, 0x111111, 0xe0c060][i], seed: i * 31 + 5 })); }
    else for (const [k, e] of Object.entries(__EN)) if (e.boss) list.push(__mk(e.look, { ...(e.lookO || {}), scale: e.scale || 1 }));
    const n = list.length;
    const per = kind === 'npc' ? 8 : 9, sp = kind === 'npc' ? 1.15 : 1.75, rs = kind === 'npc' ? 2.4 : 3.7;
    list.forEach((c, i) => { const row = Math.floor(i / per), col = i % per, nn = Math.min(per, n - row * per); c.root.position.set((col - (nn - 1) / 2) * sp, Y - row * rs, -8); c.root.rotation.y = 0.3 * Math.sin(i * 1.7); g.scene.add(c.root); window.__shown.push(c); });
    window.__animShown = () => { for (const c of window.__shown) g.anim(c, { move: 0 }); };
    g.p.pos.set(0, Y + (kind === 'npc' ? -1.9 : -4.6), kind === 'npc' ? -1.6 : 3.2); g.p.yaw = 0; g.p.pitch = 0; g.p.vy = 0; g.tpv.toggle(false); return n; }, kind);
  const hold = async (ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { await p.evaluate(() => { const g = __g.game; g.p.vy = 0; g.p.pos.y = window.__py ?? g.p.pos.y; window.__animShown && window.__animShown(); g.vm.root.visible = !window.__animShown; }); await p.waitForTimeout(80); } };
  const n1 = await lineup('npc'); await p.evaluate(() => window.__py = __g.game.p.pos.y); await hold(1200); await p.screenshot({ path: SH + `op_chars_${OUT}.png` });
  await p.evaluate(() => { const g = __g.game; window.__py = 60 + 1.45 - 1.6; g.p.pos.set(0, window.__py, -5.0); }); await hold(800); await p.screenshot({ path: SH + `op_faces_${OUT}.png` });
  const n2 = await lineup('boss'); await p.evaluate(() => window.__py = __g.game.p.pos.y); await hold(1200); await p.screenshot({ path: SH + (OUT === 'after' ? 'op_bosses.png' : 'op_bosses_before.png') });
  await p.evaluate(() => { const g = __g.game; (window.__shown || []).forEach(c => g.scene.remove(c.root)); window.__shown = []; window.__animShown = null;
    const pts = []; g.scene.traverse(o => { if (o.isSkinnedMesh && !o.userData.isOutline && o.parent && o.parent !== g.scene && o.parent.position) pts.push(o.parent.position); });
    let best = null, bn = -1; for (const a of pts) { const n = pts.filter(q => Math.hypot(q.x - a.x, q.z - a.z) < 14).length; if (n > bn) { bn = n; best = a; } }
    const P = best || { x: 0, z: 0 }; let bestA = 0, bs = -1; for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283, x = P.x + Math.sin(a) * 10, z = P.z + Math.cos(a) * 10; const h = g.groundAt(x, z); let clear = 0; for (let t = 0.1; t < 1; t += 0.1) { const xx = P.x + (x - P.x) * t, zz = P.z + (z - P.z) * t; if (g.groundAt(xx, zz) < h + 2) clear++; } if (clear > bs) { bs = clear; bestA = a; } }
    const x = P.x + Math.sin(bestA) * 10, z = P.z + Math.cos(bestA) * 10; window.__py = g.groundAt(x, z) + 1.8; g.p.pos.set(x, window.__py, z); g.p.yaw = Math.atan2(x - P.x, z - P.z); g.p.pitch = -0.22; g.tpv.toggle(false); window.__animShown = () => {}; window.__crowd = bn; });
  await hold(2500);  await p.screenshot({ path: SH + (OUT === 'after' ? 'op_town.png' : 'op_town_before.png') });
  console.log('npcs', n1, 'bosses', n2, 'errs', errs.length, JSON.stringify(errs.slice(0, 3)));
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
