// random events: start each, screenshot, drive it to completion
const { chromium } = require('playwright-core'); const BASE = process.env.BASE || 'http://localhost:4180';
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [];
  const tag = process.argv[2] || 'pc'; const vp = tag === 'land' ? { width: 844, height: 390 } : tag === 'port' ? { width: 390, height: 844 } : { width: 960, height: 540 }; const touch = tag !== 'pc';
  const p = await (await b.newContext({ viewport: vp, hasTouch: touch, isMobile: touch })).newPage(); p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto(BASE + '/?skip&anytap'); await sleep(1200); if (touch) await p.touchscreen.tap(vp.width / 2, vp.height / 2); else await p.mouse.click(480, 270); await p.waitForFunction(() => __g.mode === 'create'); await p.evaluate(() => document.querySelector('#cGo').click()); await sleep(1500);
  await p.evaluate(() => { const S = __g.game.save; S.lvl = 30; __g.game.st = __g.game.st; S.hp = 1e6; });
  const go = async (k, drive, wait = 6000) => { await p.evaluate(k => { const g = __g.game; g.save.hp = 1e7; g.events.start(k); }, k); await sleep(1500); await p.screenshot({ path: `${__dirname}/../shots/ev_${tag}_${k}.png` });
    const r = await p.evaluate(drive).catch(e => 'ERR ' + e.message); await sleep(wait); const st = await p.evaluate(() => ({ cur: __g.game.events.cur && __g.game.events.cur.kind, ev: __g.game.save.stats.events || 0, ber: __g.game.save.ber })); console.log(k, JSON.stringify(r), JSON.stringify(st)); };
  await go('dig', () => { const g = __g.game; const X = g.events.objs[0].position; g.p.pos.set(X.x, g.groundAt(X.x, X.z), X.z); return 'tp'; }, 4000);
  await go('seaking', () => { const g = __g.game; const e = g.events.cur.e; return new Promise(r => setTimeout(() => { g.damageEnemy(e, e.max + 1, { mast: 'fs:brawler' }); r('hit'); }, 2500)); }, 2000);
  await go('escort', () => { const g = __g.game; const c = g.events.cur; const npc = g.events.objs.find(o => o.type === 'Group' || o.isGroup); const I = g.island; g.p.pos.set(I.dock.x, 1, I.dock.z0 - 6); npc.position.set(I.dock.x, 1, I.dock.z0 - 4.5); return 'tp'; }, 1500);
  await go('stealth', () => { const g = __g.game; const crate = g.events.objs[0].position; g.p.pos.set(crate.x + 0.5, g.groundAt(crate.x, crate.z), crate.z + 0.5); return 'tp'; }, 1500);
  await go('davy', () => new Promise(async r => { const g = __g.game; const c = g.events.cur; for (let i = 0; i < 5 && c.round === 1; i++) { await new Promise(q => setTimeout(q, 300)); const rr = g.events.objs.filter(o => o.geometry && o.geometry.type === 'TorusGeometry' && o.parent); if (rr[0]) g.p.pos.set(rr[0].position.x, rr[0].position.y - 1.6, rr[0].position.z); }
    await new Promise(q => setTimeout(q, 600)); for (const e of g.enemies.filter(e => e.temp && !e.dead)) g.damageEnemy(e, 1e9, {}); await new Promise(q => setTimeout(q, 800)); r('round ' + (g.events.cur ? g.events.cur.round : 'done') + ' wins ' + c.wins); }), 2500);
  await go('buster', () => { __g.game.events.cur.dur = 6; return 'short'; }, 6500);
  await go('storm', () => { __g.game.events.cur.dur = 5; return 'short'; }, 5500);
  console.log('ERRS', errs); await b.close(); })();
