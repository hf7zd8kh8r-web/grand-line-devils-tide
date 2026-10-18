// Sword kits: casts every move of every sword (or a batch), measures damage on dummies, checks net sync string + console errors,
// screenshots mid-effect into shots/sw3/<batch>/ and builds a contact sheet shots/swords3_<batch>.png.
// usage: BASE=http://localhost:8099 node test/swords3.cjs <batch-name> [from] [to]   (indexes into SWORD_LIST order)
const { chromium } = require('playwright-core'); const fs = require('fs'); const { execSync } = require('child_process');
const BASE = process.env.BASE || 'http://localhost:8099'; const batch = process.argv[2] || 'all'; const from = +(process.argv[3] || 0), to = +(process.argv[4] || 99);
const sleep = ms => new Promise(r => setTimeout(r, ms)); const dir = `${__dirname}/../shots/sw3/${batch}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
let fails = 0; const ok = (n, c, x = '') => { if (!c || process.env.V) console.log(c ? 'PASS' : 'FAIL', n, x); if (!c) fails++; };
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const errs = [];
  const p = await (await b.newContext({ viewport: { width: 640, height: 360 } })).newPage(); p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | '))); p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket/.test(m.text()) || (m.type() === 'warning' && /skill|weapon/.test(m.text()))) errs.push(m.type() + ': ' + m.text().slice(0, 300)); });
  await p.goto(BASE + '/?skip&anytap'); await sleep(1500); await p.mouse.click(300, 200); await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 30000 }); await p.click('#cGo'); await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 30000 }); await sleep(1500);
  await p.evaluate(() => { const g = __g.game, S = g.save; S.lvl = 300; S.hp = 1e7; g.amb.phase = () => 0.3; if (g.events) g.events.timer = 1e9; if (g.duel) { g.duel._chalT = 1e9; g.duel.offer = null; } g.ui.close && g.ui.close(true); window.__home = g.p.pos.clone(); window.__fx = []; const f0 = g.net.fx.bind(g.net); g.net.fx = (k, ...a) => { window.__fx.push(k); try { return f0(k, ...a); } catch (e) { } }; });
  const gt = () => p.evaluate(() => __g.game.t); const waitG = async s => { const t0 = await gt(); try { await p.waitForFunction(t => __g.game.t >= t, t0 + s, { timeout: 20000, polling: 16 }); } catch (e) { } };
  const ids = (await p.evaluate(() => Object.keys(__g.game.ui.constructor && window.__SW || {}))); 
  const all = await p.evaluate(() => { const sw = __g.SWORDS || null; return sw ? Object.keys(sw) : null; });
  const list = (all || []).slice(from, to).filter(x => !process.env.ONLY || process.env.ONLY.split(',').includes(x));
  ok('sword list exposed', list.length > 0, String(all && all.length));
  const sig = new Map();
  for (const id of list) {
    for (const t2 of [false, true]) { if (t2 && !(await p.evaluate(id => !!__g.T2[id], id))) continue;
      const info = await p.evaluate(([id, t2]) => { const g = __g.game, S = g.save; S.mastery['sw:' + id] = { lvl: 80, xp: 0 }; S.t2 = S.t2 || {}; if (t2) S.t2[id] = 1; else delete S.t2[id]; S.eq.sword = id; S.slot = 'sword'; if (!S.inv.swords.includes(id)) S.inv.swords.push(id); g.refreshEquip(); return g.ui.currentMoves().map(m => [m.name, m.arch, m.ki, m.lock, m.cd, m.dmg]); }, [id, t2]);
      ok(`${id}${t2 ? ' T2' : ''} has 3-4 moves`, info.length >= 3 && info.length <= 4, JSON.stringify(info.map(x => x[0])));
      if (!t2) { const s = info.map(x => x[1]).join(','); sig.set(id, info.map(x => x[0]).join('|')); }
      for (let i = 0; i < info.length; i++) { if (t2 && i < info.length - 1) continue;
        await p.evaluate(() => { const g = __g.game, S = g.save; g.p.cds = {}; S.hp = 1e7; const H = window.__home; g.p.pos.copy(H); g.p.yaw = 0; g.p.pitch = -0.06; g.p.dash = 0; g.p.vy = 0; window.__fx.length = 0;
          const live = g.enemies.filter(e => !e.boss && !e.temp).slice(0, 6); live.forEach((e, i) => { e.dead = false; e.deadT = 0; e.c.root.visible = true; e.hp = e.max = 1e7; e.aggro = false; e.state = 'idle'; e.vel.set(0, 0, 0); const x = H.x + (i - 2.5) * 1.8, z = H.z - 4.2 - (i % 2) * 2.2; e.c.root.position.set(x, g.groundAt(x, z), z); e.home.set(x, 0, z); }); window.__dum = live; });
        await sleep(60);
        await p.evaluate(i => __g.game.move(i), i); await waitG(0.45); await p.screenshot({ path: `${dir}/${id}${t2 ? '_T2' : ''}_${i}.png` }); await waitG(1.5);
        const r = await p.evaluate(() => ({ dmg: window.__dum.reduce((a, e) => a + (e.max - e.hp), 0), fx: window.__fx.filter(k => k.startsWith('mw:s:')) }));
        ok(`${id}${t2 ? ' T2' : ''} move ${i} "${info[i][0]}" (${info[i][1]}) hits`, r.dmg > 0, `dmg=${Math.round(r.dmg)}`);
        ok(`${id} move ${i} net sync`, r.fx.length === 1 && +r.fx[0].split(':')[3] === info[i][2], JSON.stringify(r.fx)); }
    }
    console.log(id, sig.get(id));
  }
  const names = [...sig.values()]; ok('kits distinct', new Set(names).size === names.length);
  // replay a remote cast through the co-op path for one move (visual only, must not throw)
  const rep = await p.evaluate(() => { try { return __g.remoteWeapon ? (__g.remoteWeapon(__g.game, { av: { root: __g.game.p.avatar ? __g.game.p.avatar.root : { position: __g.game.p.pos.clone() } }, yaw: 0 }, 'mw:s:0:2', __g.game.p.pos.clone().setY(__g.game.p.pos.y + 1)), 'ok') : 'n/a'; } catch (e) { return 'ERR ' + e.message; } });
  ok('remote replay', rep !== 'n/a' && !rep.startsWith('ERR'), rep); await waitG(1.5);
  ok('zero console errors', errs.length === 0, JSON.stringify(errs.slice(0, 8)));
  await b.close();
  execSync(`python3 ${__dirname}/sheet.py ${dir} ${__dirname}/../shots/swords3_${batch}.png 6 "Sword kits ${batch}"`);
  console.log(fails ? `FAILS ${fails}` : 'ALL PASS'); process.exit(fails ? 1 : 0); })().catch(e => { console.error('FAIL', e); process.exit(1); });
