// Damage sanity: on-level players at several seas take ~5-10% per grunt hit, <=~17% elite/heavy, boss M1 small; hard 40% cap outside duels.
const { chromium } = require('playwright-core');
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 960, height: 540 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push('PE ' + e.message));
  const ok = (n, c, x = '') => console.log(c ? 'PASS' : 'FAIL', n, x); const ev = (f, a) => p.evaluate(f, a);
  await p.goto((process.env.BASE || 'http://127.0.0.1:5397') + '/?skip&anytap'); await p.waitForFunction(() => window.__g, null, { timeout: 30000 }); await p.waitForTimeout(1200); await p.mouse.click(480, 270);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForTimeout(2500);
  for (const [isl, L] of [['windmill', 1], ['alabasta', 60], ['fishman', 120], ['dressrosa', 165], ['wano', 300], ['egghead', 380]]) {
    await ev(([isl, L]) => { const g = __g.game; g.save.lvl = L + 4; if (!g.save.unlocked.includes(isl)) g.save.unlocked.push(isl); g.loadIsland(isl, false); }, [isl, L]); await p.waitForTimeout(1500);
    const r = await ev(() => { const g = __g.game, S = g.save; S.haki = null; g.refreshEquip(); const st = g.st; const pct = [];
      const hit = (e, f) => { S.hp = st.maxHp; g.p.iframe = 0; g.dead = false; g.cut = null; const h = S.hp; f(e); return Math.round(100 * (h - S.hp) / st.maxHp); };
      const gr = g.enemies.filter(e => !e.boss && !e.def.ranged), boss = g.enemies.find(e => e.boss); let mxN = 0, mxH = 0;
      for (const e of gr) { const el = e.elite; mxN = Math.max(mxN, hit(e, e => g.enemyStrike(e, 0))); e.heavy = true; mxH = Math.max(mxH, hit(e, e => g.enemyStrike(e, 0))); e.elite = el; }
      const bm = boss ? hit(boss, e => { e.heavy = false; e.skillCd = 99; e.spCd = 99; const s = e.state; g.enemyStrike(e, 0); }) : -1;
      const cap = hit(null, () => g.hurtPlayer(1e9, g.p.pos.clone().add({ x: 1, y: 0, z: 0, isVector3: true }), {}));
      return { lvl: S.lvl, maxHp: st.maxHp, normalMax: mxN, heavyMax: mxH, bossM1: bm, cap1e9: cap }; });
    ok(`${isl} L${r.lvl}`, r.normalMax <= 17 && r.heavyMax <= 20 && r.cap1e9 <= 40 && r.cap1e9 > 0, JSON.stringify(r)); }
  ok('no page errors', !errs.length, errs.slice(0, 3).join(' | ')); await b.close(); })();
