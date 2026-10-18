// Haki visuals + Armament colours + awakened looks. BASE=http://localhost:8121 node test/hakiaw.cjs
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8080'; const SH = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket|ws:/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  await p.goto(BASE + '/?skip&anytap'); await p.evaluate(() => { for (const k of Object.keys(localStorage)) if (/save|gldt/i.test(k) && !/quality/.test(k)) localStorage.removeItem(k); }); await p.reload(); await p.waitForTimeout(1200); await p.mouse.click(640, 360);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 25000 }); await p.waitForTimeout(1500);
  const clean = () => p.evaluate(() => { document.querySelectorAll('.toast,#toasts > *').forEach(e => e.remove()); for (const id of ['banner', 'travel', 'qhint']) { const e = document.getElementById(id); if (e) e.style.visibility = 'hidden'; } const c = document.getElementById('chat'); if (c) c.style.display = 'none'; });
  const ok = []; const res = (n, v) => { ok.push(v); console.log(v ? 'PASS' : 'FAIL', n); };
  // set up a strong character in an open spot, enemies away
  await p.evaluate(() => { const g = __g.game, S = g.save; S.lvl = 150; S.ber = 5e7; g.st = g.st; for (const e of g.enemies) { e.c.root.visible = false; e.dead = true; } const P = g.p.pos; const C = g.island.colliders; let best = null; for (let x = -60; x <= 60; x += 4) for (let z = -60; z <= 60; z += 4) { const gh = g.groundAt(x, z); let lo = 1e9, hi = -1e9; for (let dx = -9; dx <= 9; dx += 3) for (let dz = 0; dz <= 10; dz += 2.5) { const y = g.groundAt(x + dx, z - dz); lo = Math.min(lo, y); hi = Math.max(hi, y); } if (lo < 0.4 || hi - lo > 0.8) continue; let near = 1e9; for (const c of C) near = Math.min(near, Math.hypot(c.x - x, c.z - (z - 5)) - (c.r || Math.max(c.hw || 0, c.hd || 0))); for (const n of g.npcs) near = Math.min(near, Math.hypot(n.x - x, n.z - (z - 5)) - 1); if (!best || near > best[2]) best = [x, z, near]; } P.set(best[0], 0, best[1]); P.y = g.groundAt(P.x, P.z); window.__spot = best; g.p.yaw = 0; g.p.pitch = -0.1; __g.ui.close(true); });
  // FP armament on
  await p.evaluate(() => { const g = __g.game; g.save.haki = {}; window.__hk = () => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH' })); }); for (let i = 0; i < 5; i++) { await p.keyboard.press('KeyH'); await p.waitForTimeout(700); if (await p.evaluate(() => !!(__g.game.save.haki && __g.game.save.haki.buso))) break; console.log('retry H', await p.evaluate(() => [__g.ui.modal, !!__g.game.cut, __g.game.dead])); }
  const ov = await p.evaluate(() => { let n = 0; __g.game.vm.root.traverse(o => { if (o.userData.hkOv && o.visible) n++; }); return [n, !!(__g.game.save.haki && __g.game.save.haki.buso)]; }); res('FP armament coat overlays ' + ov, ov[0] > 0 && ov[1]);
  // buy + equip colours via the Bag
  await p.evaluate(() => { __g.ui.open('inv', 'haki'); }); await p.waitForTimeout(600);
  const shopOk = await p.evaluate(() => document.querySelectorAll('#panel .hkc').length); res('Bag Haki tab lists colours: ' + shopOk, shopOk >= 7);
  await p.evaluate(() => { const ui = __g.ui; for (const id of ['crimson', 'purple', 'gold', 'blue']) ui.act('hkc:' + id); ui.act('hkc:oni'); }); await p.waitForTimeout(300);
  const own = await p.evaluate(() => [__g.game.save.hakiCols, __g.game.save.hakiCol]); res('bought colours saved ' + JSON.stringify(own), own[0].length === 5 && own[1] === 'blue');
  await clean(); await p.screenshot({ path: SH + 'haki_shop.png' }); await p.evaluate(() => __g.ui.close(true));
  await p.evaluate(() => __g.ui.act('hkc:crimson')); await p.evaluate(() => __g.ui.close(true)); await p.waitForTimeout(500); await clean(); await p.screenshot({ path: SH + 'haki_fp.png' });
  // colour lineup: 7 avatars with coated arms raised
  await p.evaluate(() => { const g = __g.game, X = __ex; const ids = ['black', 'crimson', 'purple', 'blue', 'gold', 'emerald', 'silver', 'voidc']; const P = g.p.pos; const f = new __dbg.THREE.Vector3(0, 0, -1);
    ids.forEach((id, i) => { const c = X.makeAvatar('Pirate', 'Human', g.save.look, { hk: id }); const x = P.x + (i - 3.5) * 1.05, z = P.z - 4.2; c.root.position.set(x, g.groundAt(x, z), z); c.root.rotation.y = 0; g.scene.add(c.root); c.bones.armR.rotation.x = -1.2; c.bones.armL.rotation.z = 0.5; c.bones.foreR.rotation.x = -0.5; X.extra.push({ c, vis: { hk: id } }); });
    g.p.pitch = -0.12; g.tpv.toggle(false); }); await p.waitForTimeout(800); await clean(); await p.screenshot({ path: SH + 'haki_colors.png' });
  await p.evaluate(() => { const g = __g.game; for (const x of __ex.extra) g.scene.remove(x.c.root); __ex.extra.length = 0; });
  // Conqueror's: third person, trigger and capture mid-crackle
  await p.evaluate(() => { const g = __g.game; g.tpv.toggle(true); g.p.yaw = 0.6; g.p.pitch = -0.25; }); await p.waitForTimeout(500);
  await p.keyboard.press('KeyJ'); await p.waitForTimeout(260); await clean(); await p.screenshot({ path: SH + 'haki_conq.png' });
  const cq = await p.evaluate(() => [document.getElementById('conqFlash') && document.getElementById('conqFlash').classList.contains('go'), (__g.game.p.cds.conq || 0) > 0]); res('conqueror fired (flash, cooldown) ' + cq, cq[0] && cq[1]);
  await p.waitForFunction(() => document.querySelectorAll('#none').length === 0 && __ex && true); for (let i = 0; i < 40; i++) { if (await p.evaluate(() => __ex.fxCount() === 0)) break; await p.waitForTimeout(500); }
  // awakened looks lineup
  const fams = await p.evaluate(() => { const g = __g.game, X = __ex; g.tpv.toggle(false); g.save.haki.buso = false; __g.game.st = __g.game.st; const list = ['zushi', 'mera', 'hie', 'pika', 'magu', 'yami', 'gura', 'goro', 'nika', 'mori', 'sound', 'phoenix']; const P = g.p.pos; g.p.yaw = 0; g.p.pitch = -0.08;
    list.forEach((id, i) => { const row = i < 6 ? 0 : 1; const col = i % 6; const x = P.x + (col - 2.5) * 1.9, z = P.z - 6 - row * 3.4; const c = X.makeAvatar('Pirate', 'Human', g.save.look, { aw: id }); c.root.position.set(x, g.groundAt(x, z), z); g.scene.add(c.root); X.extra.push({ c, vis: { aw: id } }); });
    return list.map(id => X.AURA_FAMILY[id]); }); console.log('families', fams.join(','));
  await p.waitForTimeout(900); await clean();
  await p.evaluate(() => { const g = __g.game; const names = ['Gravity', 'Flame', 'Ice', 'Light', 'Magma', 'Dark', 'Quake', 'Thunder', 'Nika', 'Forest', 'Sound', 'Phoenix']; __ex.extra.forEach((x, i) => { const v = x.c.root.position.clone(); v.y += 2.15; v.project(g.cam); const d = document.createElement('div'); d.className = 'awlbl'; d.textContent = names[i]; d.style.cssText = `position:fixed;left:${(v.x * 0.5 + 0.5) * innerWidth}px;top:${(-v.y * 0.5 + 0.5) * innerHeight}px;transform:translate(-50%,-100%);font:700 13px system-ui;color:#fff;background:rgba(0,0,0,.55);padding:2px 7px;border-radius:8px;z-index:50;pointer-events:none`; document.body.appendChild(d); }); });
  await p.screenshot({ path: SH + 'awaken_looks.png' }); await p.evaluate(() => document.querySelectorAll('.awlbl').forEach(e => e.remove()));
  await p.evaluate(() => { const g = __g.game; for (const x of __ex.extra) g.scene.remove(x.c.root); __ex.extra.length = 0; });
  // Nika close-up (real player state: awakened Nika, third person + preview)
  const nk = await p.evaluate(() => { const g = __g.game, S = g.save; if (!S.inv.fruits.includes('nika')) S.inv.fruits.push('nika'); S.eq.fruit = 'nika'; S.slot = 'fruit'; S.awake = { nika: 1 }; S.awk = { kit: { nika: 'awake' }, seen: { nika: 1 } }; g.refreshEquip && g.refreshEquip(); S.haki.buso = false; return __ex.visCos(S); });
  res('visCos while Nika awakened ' + JSON.stringify(nk), nk.aw === 'nika');
  await p.waitForTimeout(900); await p.evaluate(() => { const g = __g.game; g.showPreview(true); }); await p.waitForTimeout(900);
  const pv = await p.evaluate(() => { const c = __g.game.preview; return !!(c && c._bfx && c._bfx.aura); }); res('preview shows aura', pv);
  await clean(); await p.screenshot({ path: SH + 'nika_awaken.png' }); await p.evaluate(() => __g.game.showPreview(false));
  await p.waitForTimeout(300); await clean(); await p.screenshot({ path: SH + 'nika_fp.png' });
  console.log('ERRS', errs); await b.close(); console.log(ok.every(Boolean) && !errs.length ? 'ALL PASS' : 'SOME FAIL');
})();
