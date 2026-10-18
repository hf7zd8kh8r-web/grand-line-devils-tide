// Sword Index + secret-quest completability. BASE=http://localhost:8099 node test/swordindex.cjs
const { chromium } = require('playwright-core'); const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:8099'; let fails = 0; const ok = (n, c, x = '') => { console.log(c ? 'PASS' : 'FAIL', n, x); if (!c) fails++; };
const SQ = [...fs.readFileSync(__dirname + '/../src/islands.js', 'utf8').match(/const SECRET_Q = \[([\s\S]*?)\];/)[1].matchAll(/\['(\w+)', '(\w+)', '(\w+)', (\d+), (\d+)\]/g)].map(m => [m[1], m[2], m[3], +m[4], +m[5]]);
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = []; const ctx = await b.newContext({ viewport: { width: 1100, height: 700 } }); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto(BASE + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(200, 200);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 }); await p.fill('#cName', 'Adam'); await p.click('#cGo'); await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 20000 }); await p.waitForTimeout(1500);
  ok('secret quests parsed', SQ.length >= 13, SQ.length);
  ok('yoru is a Mihawk trial', SQ.some(q => q[1] === 'yoru' && q[2] === 'mihawk'));
  for (const [isl, sw, target, n, lvl] of SQ) {
    const r = await p.evaluate(async ([isl, sw, target, n, lvl]) => { const g = __g.game, S = g.save; S.lvl = Math.max(S.lvl, lvl); S.quests = []; S.quest = null; S.unlocked = [...new Set([...(S.unlocked || []), isl])];
      g.loadIsland(isl, false); await new Promise(r => setTimeout(r, 400));
      const myst = g.npcs.some(x => (x.name || (x.def && x.def.name) || '').includes('Mysterious')) || g.npcs.length > 0;
      g.ui.act('qtake:sec_' + sw); const q = S.quests.find(x => x.id === 'sec_' + sw); if (!q) return { err: 'quest not taken' };
      await new Promise(r => setTimeout(r, target === 'mihawk' ? 1500 : 200));
      let live = g.enemies.find(e => e.s.type === target && !e.dead); if (!live) return { err: 'target ' + target + ' not on island' };
      let kills = 0; for (let i = 0; i < n + 2 && S.quests.some(x => x.id === 'sec_' + sw); i++) { const e = g.enemies.find(e => e.s.type === target && !e.dead) || g.spawnEnemy({ ...live.s, lvl: live.lvl }); g.killEnemy(e); kills++; }
      return { kills, got: S.inv.swords.includes(sw), done: (S.qdone || []).includes('sec_' + sw) || !S.quests.some(x => x.id === 'sec_' + sw), myst }; }, [isl, sw, target, n, lvl]);
    ok(`secret ${sw} @${isl} (${target}×${n})`, r.got && r.kills === n, JSON.stringify(r));
  }
  // index screenshot: fresh-ish save with a few owned + a hint revealed
  await p.evaluate(() => { const g = __g.game, S = g.save; S.inv.swords = ['cutlass', 'wado', 'kokuto', 'yoru', 'ryuma']; S.lvl = 120; S.swHint = { shiro: 1 }; S.quests = []; g.loadIsland('loguetown', false); g.ui.open('swx', 1); });
  await p.waitForTimeout(600);
  const txt = await p.evaluate(() => document.querySelector('#modal, .modal, #panel') ? (document.querySelector('#modal, .modal, #panel')).innerText : document.body.innerText);
  ok('index lists Secret Quest labels', /Secret Quest #1 – First Sea/.test(txt), txt.slice(0, 120));
  ok('index has reveal button', await p.evaluate(() => !!document.querySelector('[data-do^="swhint:"]')));
  ok('revealed checklist', await p.evaluate(() => !!document.querySelector('.swck')));
  await p.screenshot({ path: __dirname + '/../shots/swordindex.png' });
  await p.evaluate(() => { const h = [...document.querySelectorAll('h3')].find(h => /Secret/.test(h.textContent)); h && h.scrollIntoView(); }); await p.waitForTimeout(300); await p.screenshot({ path: __dirname + '/../shots/swordindex_secret.png' });
  await p.evaluate(() => __g.game.ui.open('swx', 1)); await p.waitForTimeout(300);
  const t3 = await p.evaluate(() => document.body.innerText); ok('Kokuto Yoru in index', /Kokuto Yoru/.test(t3) && /Mihawk/.test(t3));
  const total = await p.evaluate(() => document.body.innerText.match(/(\d+) swords · you own/)); ok('55 swords', total && +total[1] === 55, total && total[1]);
  // count across seas
  let sum = 0; for (const s of [1, 2, 3]) { await p.evaluate(s => __g.game.ui.open('swx', s), s); sum += await p.evaluate(() => [...document.querySelectorAll('.dexc.swc')].length - [...document.querySelectorAll('h3')].filter(h => /Tier II/.test(h.textContent)).reduce((a, h) => a + h.nextElementSibling.children.length, 0)); }
  ok('all 55 placed in a sea group', sum === 55, sum);
  // shop no longer gives free boss-drop blades
  const free = await p.evaluate(() => { const L = []; for (const l of [60, 114, 250, 300, 380]) { const h = __g.game.ui.autoShop('auto:weapons:' + l); for (const it of (h.items || h)) if (Array.isArray(it) && ['ame', 'murakumo', 'shodai', 'gryphon'].includes(it[1])) L.push(it[1]); } return L; });
  ok('boss-drop blades not in shops', free.length === 0, JSON.stringify(free));
  ok('zero console errors', errs.length === 0, JSON.stringify(errs));
  await b.close(); process.exit(fails ? 1 : 0);
})();
