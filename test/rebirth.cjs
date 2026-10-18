// Rebirth: progress tracking, locked/unlocked button, confirm, cinematic, reset vs keep, difficulty x(n+1), HUD/nameplate, server clamp.
// BASE=http://localhost:8121 node test/rebirth.cjs
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8080'; const SH = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket|ws:/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  await p.goto(BASE + '/?skip&anytap&rbdebug'); await p.evaluate(() => { for (const k of Object.keys(localStorage)) if (/save|gldt/i.test(k) && !/quality/.test(k)) localStorage.removeItem(k); }); await p.reload(); await p.waitForTimeout(1200); await p.mouse.click(640, 360);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 25000 }); await p.waitForTimeout(1500);
  const clean = () => p.evaluate(() => { document.querySelectorAll('.toast,#toasts > *').forEach(e => e.remove()); for (const id of ['travel', 'qhint']) { const e = document.getElementById(id); if (e) e.style.visibility = 'hidden'; } });
  const ok = []; const res = (n, v) => { ok.push(v); console.log(v ? 'PASS' : 'FAIL', n); };
  const base = await p.evaluate(() => { const g = __g.game, S = g.save; S.lvl = 120; S.ber = 1234567; S.inv.swords.push('wado'); S.inv.fruits.push('mera'); S.cos = ['strawhat']; S.unlocked.push('orange', 'shells'); g.loadIsland('shells', false); return { pr: __rb.progress(), e: g.enemies.map(e => [e.s.type, e.max]) }; });
  res(`progress tracked: bosses ${base.pr.bd}/${base.pr.nb}, quests ${base.pr.qd}/${base.pr.nq}`, base.pr.nb >= 30 && base.pr.nq >= 100 && !base.pr.ready);
  await p.evaluate(() => __g.ui.open('shop', 'rebirth')); await p.waitForTimeout(600); const lk = await p.evaluate(() => [!!document.querySelector('#panel button[disabled]'), !document.querySelector('#panel [data-do="rb:go"]')]); res('rebirth locked until complete', lk[0] && lk[1]);
  await p.evaluate(() => __g.ui.open('pause')); await p.waitForTimeout(300); const pb = await p.evaluate(() => !!document.querySelector('#panel [data-do="rb:open"]')); res('pause menu has Rebirth button', pb);
  // one boss kill + one quest count for this life
  const one = await p.evaluate(() => { const g = __g.game; const e = g.enemies.find(x => x.boss); g.killEnemy(e); const S = g.save; return [!!S.rbc.b.morgan]; }); res('boss kill counted for this life', one[0]);
  await p.evaluate(() => { __rb.complete(); __g.ui.open('shop', 'rebirth'); }); await p.waitForTimeout(700);
  const rd = await p.evaluate(() => [__rb.progress().ready, !!document.querySelector('#panel [data-do="rb:go"]'), document.getElementById('rbBadge').textContent]); res('debug complete → Rebirth unlocked + badge ' + rd[2], rd[0] && rd[1] && /Ready/.test(rd[2]));
  await clean(); await p.screenshot({ path: SH + 'rebirth_panel.png' });
  await p.evaluate(() => __g.ui.act('rb:go')); await p.waitForTimeout(400); const cf = await p.evaluate(() => document.getElementById('panel').innerText.includes('Are you sure')); res('confirmation step', cf); await clean(); await p.screenshot({ path: SH + 'rebirth_confirm.png' });
  await p.evaluate(() => __g.ui.act('rb:yes')); await p.waitForTimeout(1500); await p.evaluate(() => { const b = document.getElementById('banner'); if (b) b.style.visibility = 'hidden'; }); await p.screenshot({ path: SH + 'rebirth.png' });
  const cine = await p.evaluate(() => !!document.getElementById('rbCine')); res('cinematic playing', cine);
  await p.waitForFunction(() => !document.getElementById('rbCine'), null, { timeout: 15000 }); await p.waitForTimeout(800);
  const after = await p.evaluate(() => { const g = __g.game, S = g.save; return { rb: S.rebirth, isl: g.island.id, un: S.unlocked, ber: S.ber, sw: S.inv.swords.includes('wado'), fr: S.inv.fruits.includes('mera'), cos: S.cos.includes('strawhat'), lvl: S.lvl, q: S.quests.length, pr: __rb.progress(), badge: document.getElementById('rbBadge').textContent, vis: __ex.visCos(S).rb, mul: __rb.mul(), e: g.enemies.map(e => [e.s.type, e.max, e._rb, +(e.def.dmg / (__dbg && __dbg.ENEMIES ? __dbg.ENEMIES[e.s.type].dmg : e.def.dmg / 2)).toFixed(2)]) }; });
  console.log(JSON.stringify({ ...after, pr: [after.pr.bd, after.pr.qd], e: after.e.slice(0, 3) }));
  res('rebirth count 1, back at Windmill, islands reset', after.rb === 1 && after.isl === 'windmill' && after.un.length === 1);
  res('kept berries/swords/fruits/cosmetics/level', after.ber >= 1234567 && after.sw && after.fr && after.cos && after.lvl === 120);
  res('quest + boss progress reset for the new life', after.pr.bd === 0 && after.q === 0 && !after.pr.ready);
  res('HUD badge + nameplate field ' + after.badge + ' rb=' + after.vis, /⟳ I/.test(after.badge) && after.vis === 1);
  res('difficulty x2 on enemies', after.mul === 2 && after.e.length > 0 && after.e.every(x => x[2] === 2));
  await clean(); await p.screenshot({ path: SH + 'rebirth_after.png' });
  // persisted across reload
  await p.evaluate(() => __g.game.save && window.__g && true); const stored = await p.evaluate(() => { for (const k of Object.keys(localStorage)) { try { const v = JSON.parse(localStorage.getItem(k)); if (v && v.rebirth) return v.rebirth; } catch (_) {} } return 0; }); res('rebirth saved in profile', stored === 1);
  // server clamp: at most +1 per save
  const srv = await p.evaluate(async () => { const P = (u, b) => fetch('/api/profile/' + u, { method: 'POST', body: JSON.stringify(b) }).then(r => r.json()); const nm = 'rbt' + Math.floor(Math.random() * 1e6);
    const L = await P('login', { name: nm, race: 'Human', pin: '1234', create: { ts: 1, save: { name: nm, rebirth: 9999 } } }); const k = L.key; const a = (await P('load', { key: k })).save.rebirth;
    await P('save', { key: k, ts: 2, save: { name: nm, rebirth: 0 } }); await P('save', { key: k, ts: 3, save: { name: nm, rebirth: 5 } }); const b2 = (await P('load', { key: k })).save.rebirth;
    await P('save', { key: k, ts: 4, save: { name: nm, rebirth: 5.7 } }); const c = (await P('load', { key: k })).save.rebirth; await P('delete', { key: k }); return [a, b2, c]; });
  res('server clamps rebirth (create 9999→' + srv[0] + ', 0 then 5→' + srv[1] + ', 5.7→' + srv[2] + ')', srv[0] === 999 && srv[1] === 1 && srv[2] === 2);
  await p.waitForTimeout(500); res('no console errors ' + JSON.stringify(errs.slice(0, 5)), errs.length === 0);
  console.log(ok.every(Boolean) ? 'ALL PASS' : 'SOME FAIL'); await b.close();
})();
