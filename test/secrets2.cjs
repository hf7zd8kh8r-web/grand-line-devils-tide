// Per-island secret discovery mechanics + subtle fake walls. BASE=http://localhost:5401 node test/secrets2.cjs
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:5401'; const SH = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket|ws:/.test(m.text())) errs.push(m.text().slice(0, 300)); if (m.type() === 'warning' && /secrets/.test(m.text())) errs.push('W ' + m.text()); });
  await p.goto(BASE + '/?skip&anytap'); await p.evaluate(() => { for (const k of Object.keys(localStorage)) if (/save|gldt/i.test(k) && !/quality/.test(k)) localStorage.removeItem(k); }); await p.reload(); await p.waitForTimeout(1200); await p.mouse.click(640, 360);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 25000 }); await p.waitForTimeout(1500);
  const ok = []; const res = (n, v) => { ok.push(!!v); console.log(v ? 'PASS' : 'FAIL', n); };
  const clean = () => p.evaluate(() => { document.querySelectorAll('.toast,#toasts > *').forEach(e => e.remove()); for (const id of ['banner', 'travel', 'qhint']) { const e = document.getElementById(id); if (e) e.style.visibility = 'hidden'; } });
  await p.evaluate(() => { const g = __g.game, S = g.save; S.lvl = 400; S.ber = 5e7; S.unlocked = ['windmill','loguetown','skypiea','thriller','fishman','dressrosa','wci','egghead']; for (const e of g.enemies) { e.c.root.visible = false; e.dead = true; } });
  // fake wall: same material as side walls, no cracks; shimmer only with ken + close
  const fw = await p.evaluate(async () => { const g = __g.game, I = g.island, r = I.secretRoom; let fake, side; I.group.traverse(o => { if (o.userData.fakeWall) fake = o; }); side = fake.parent.children.find(o => o.isMesh && o !== fake && o.geometry.type === 'BoxGeometry');
    g.save.haki = { ken: true }; g.p.pos.set(r.ex + 30, g.groundAt(r.ex + 30, r.ez), r.ez); await new Promise(q => setTimeout(q, 800)); const far = r.glyph.material.opacity;
    g.p.pos.set(r.ex, g.groundAt(r.ex, r.ez), r.ez); await new Promise(q => setTimeout(q, 1500)); const near = r.glyph.material.opacity; return [fake.material === side.material, far, near]; });
  res('fake wall same material ' + JSON.stringify(fw), fw[0] && fw[1] < 0.005 && fw[2] > 0.01 && fw[2] < 0.1);
  await p.evaluate(() => { const g = __g.game, r = g.island.secretRoom; g.save.haki = {}; const s = Math.sin(r.th), c = Math.cos(r.th); const x = r.ex + s * 7 + c * 3, z = r.ez + c * 7 - s * 3; g.p.pos.set(x, g.groundAt(x, z), z); g.p.yaw = r.th + 0.35; g.p.pitch = -0.05; g.tpv.toggle(false); }); await p.waitForTimeout(3000); await clean(); await p.screenshot({ path: SH + "secret2_wall.png" }); await p.evaluate(() => { __g.game.island.secretRoom.glyph.visible = false; }); await p.waitForTimeout(300); await p.screenshot({ path: SH + "secret2_wall_noglyph.png" });
  const hints = await p.evaluate(async () => { const m = await import('/src/secrets.js'); return m.secretList(__g.game.save).map(x => x.riddle + ' | ' + x.steps.map(s => s[0]).join(' / ')).join('\n'); });
  res('hints are riddles (no "glowing scroll"/"golden mark")', !/glowing scroll|golden mark|Walk into it/.test(hints));
  const run = (isl, setup, steps) => p.evaluate(async ([isl, setup, steps]) => { const g = __g.game; g.loadIsland(isl, false); g.amb.isNight = () => false; eval(setup); const out = [];
    const beams = []; g.island.group.traverse(o => { if (o.geometry && o.geometry.type === 'CylinderGeometry' && o.material && o.material.blending === 2) beams.push(1); });
    for (const st of steps) { if (st.npc) { const n = g.npcs.find(x => new RegExp(st.npc).test(x.name + ' ' + (x.shop || ''))); __g.ui.talk(n); out.push(!!n); continue; } const a = g.island.secAct[st.i]; g.p.pos.set(a.x, g.groundAt(a.x, a.z), a.z); await new Promise(r => setTimeout(r, 250)); out.push(g.secInter === a ? 1 : 0); if (st.cb) eval(st.cb); g.secInter && g.secInter.act(g); await new Promise(r => setTimeout(r, 100)); }
    return { found: !!(g.save.secrets || {})[isl === 'loguetown' ? 'drum' : isl === 'skypiea' ? 'shandora' : isl === 'thriller' ? 'kuraigana' : isl === 'fishman' ? 'momoiro' : isl === 'dressrosa' ? 'greenbit' : isl === 'wci' ? 'elbaf' : 'godvalley'], out, beams: beams.length }; }, [isl, setup, steps]);
  let r = await run('loguetown', '', [{ i: 0 }]); res('drum: lantern does nothing by day ' + JSON.stringify(r), !r.found && r.beams === 0);
  r = await run('loguetown', 'g.amb.isNight = () => true', [{ i: 0 }]); res('drum: light lantern at night reveals', r.found);
  r = await run('skypiea', "g.save.kills.skypiea_boss = 1", [{ i: 0 }, { i: 1 }, { i: 2 }]); res('shandora: wrong bell order no reveal', !r.found);
  r = await run('skypiea', "g.save.kills.skypiea_boss = 1", [{ i: 1 }, { i: 2 }, { i: 0 }, { i: 3 }]); res('shandora: bells 1-2-3 then chest reveals ' + JSON.stringify(r), r.found);
  r = await run('thriller', "g.save.haki = {}", [{ i: 0 }]); res('kuraigana: cave blind without ken', !r.found);
  r = await run('thriller', "g.save.haki = { ken: true }", [{ i: 0 }]); res('kuraigana: ken + cave reveals', r.found);
  r = await run('fishman', '', [{ npc: 'Old Navigator' }, { npc: '^Shirahoshi' }, { npc: 'Fruit' }, { npc: 'Old Navigator' }]); res('momoiro: riddle chain ' + JSON.stringify(r), r.found);
  r = await run('dressrosa', "g.save.kills.dressrosa_e1 = 3", [{ i: 0 }]); res('greenbit: crate shy before 25 kills', !r.found);
  r = await run('dressrosa', "g.save.kills.dressrosa_e1 = 30", [{ i: 0 }]); res('greenbit: tiny log pose', r.found && 1);
  const el = await p.evaluate(async () => { const g = __g.game; g.loadIsland('wci', false); g.amb.isNight = () => true; g.save.haki = { buso: true }; const c = g.island.clues[0]; const gp = c.grp.position; const P = g.p.pos; P.set(gp.x, 0.5, gp.z); await new Promise(r => setTimeout(r, 600)); const vis = c.grp.visible; const n = Math.hypot(gp.x, gp.z); P.set(gp.x + gp.x / n * 26, 0.5, gp.z + gp.z / n * 26); await new Promise(r => setTimeout(r, 300)); return [vis, !!g.save.secrets.elbaf]; });
  res('elbaf: night current with Armament ' + el, el[0] && el[1]);
  r = await run('egghead', '', [{ i: 0 }]); res('godvalley: archive reveals after six', r.found);
  await p.waitForTimeout(400); res('no console errors ' + JSON.stringify(errs.slice(0, 5)), errs.length === 0);
  console.log(ok.every(Boolean) ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
