// iPhone touch test for every "hint" UI: Sword Index reveal, Secret Islands/Hidden Shops reveal, Mysterious Swordsman riddle link, Tavern Rumor.
// BASE=https://... node test/hints_touch.cjs [WxH]
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8099'; const [W, H] = (process.argv[2] || '844x390').split('x').map(Number);
let fails = 0; const ok = (n, c, x = '') => { console.log(c ? 'PASS' : 'FAIL', n, typeof x === 'string' ? x : JSON.stringify(x)); if (!c) fails++; };
const SH = __dirname + '/../shots/hints/';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage(); const errs = []; const cdp = await ctx.newCDPSession(p);
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket/.test(m.text())) errs.push(m.text().slice(0, 300)); if (process.env.V && m.type() === 'warning') console.log('warn', m.text().slice(0, 200)); });
  const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(q => ({ x: q[0], y: q[1], id: q[2] || 1 })) });
  // real finger tap on an element: scroll it into view the way a user would, check nothing covers it, touchStart/End (browser synthesises click)
  const tap = async (sel, scroll = true) => { const r = await p.evaluate(([sel, scroll]) => { const e = typeof sel === 'string' ? document.querySelector(sel) : null; if (!e) return { err: 'missing ' + sel }; if (scroll) e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); const x = b.left + b.width / 2, y = b.top + b.height / 2; const top = document.elementFromPoint(x, y);
      return { x, y, vis: b.width > 0 && b.height > 0 && y > 0 && y < innerHeight, top: top ? (e === top || e.contains(top) ? 'self' : (top.id || top.className || top.tagName)) : 'none' }; }, [sel, scroll]);
    if (r.err) return r; await p.waitForTimeout(700); await T('touchStart', [[r.x, r.y, 3]]); await p.waitForTimeout(70); await T('touchEnd', []); await p.waitForTimeout(450); return r; };
  const boot = async () => { await p.goto(BASE + '/?skip&anytap'); await p.waitForTimeout(1500); await T('touchStart', [[W / 2, H / 2, 1]]); await T('touchEnd', []); await p.waitForTimeout(800);
    await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 30000 }); };
  await boot(); await p.fill('#cName', 'Adam'); await p.evaluate(() => document.querySelector('#cGo').click()); await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 30000 }); await p.waitForTimeout(1500);
  await p.evaluate(() => { const g = __g.game; g.duel && (g.duel._chalT = 1e9); g.save.lvl = 40; });
  // 1. Bag -> Swords via taps
  let r = await tap('[data-ui=inv]', false); ok('bag button tappable', (await p.evaluate(() => __g.ui.modal)) === 'inv', r);
  await p.evaluate(() => { const e = [...document.querySelectorAll('#panel [data-do="swx"]')][0]; if (e) e.id = 'tSwx'; }); r = await tap('#tSwx'); ok('Bag ⚔ Swords opens Sword Index', (await p.evaluate(() => __g.ui.modal)) === 'swx', r);
  // 2. sword reveal hint (pick one far down the list)
  const hb = await p.evaluate(() => { const L = [...document.querySelectorAll('#panel [data-do^="swhint:"]')]; const e = L[L.length - 1]; if (!e) return null; e.id = 'tHint'; return e.dataset.do.split(':')[1]; });
  ok('sword reveal button present', !!hb, hb);
  if (hb) { r = await tap('#tHint'); const st = await p.evaluate(id => { const card = document.querySelector('#panel [data-do="swhint:' + id + '"]'); const ck = [...document.querySelectorAll('#panel .swck')]; const box = document.querySelector('#panel .pbox');
      const vis = ck.some(u => { const b = u.getBoundingClientRect(); return b.bottom > 0 && b.top < innerHeight; }); return { saved: !!__g.game.save.swHint[id], btnGone: !card, lists: ck.length, checklistOnScreen: vis, scrollTop: box && box.scrollTop, ls: !!(JSON.parse(localStorage.getItem('gldt_save_v1')).swHint || {})[id] }; }, hb);
    ok('sword hint: tap registered + saved', st.saved && st.ls, { tap: r, st }); ok('sword hint: checklist rendered', st.btnGone && st.lists > 0, st); ok('sword hint: checklist visible where you tapped (no jump to top)', st.checklistOnScreen, st);
    await p.screenshot({ path: SH + 'sword_hint.png' }); }
  // 3. secret islands / hidden shops reveal
  const sb = await p.evaluate(() => { const L = [...document.querySelectorAll('#panel [data-do^="sechint:"]')]; const e = L[L.length - 1]; if (!e) return null; e.id = 'tSec'; return e.dataset.do.split(':')[1]; });
  ok('secret reveal button present', !!sb, sb);
  if (sb) { r = await tap('#tSec'); const st = await p.evaluate(id => { const S = __g.game.save; const ck = [...document.querySelectorAll('#panel .swck')]; const vis = ck.some(u => { const b = u.getBoundingClientRect(); return b.bottom > 0 && b.top < innerHeight && /Sail to|Walk straight|Masked|Go to/.test(u.textContent); });
      return { modal: __g.ui.modal, saved: !!(S.secHint || {})[id], btnGone: !document.querySelector('#panel [data-do="sechint:' + id + '"]'), checklistOnScreen: vis, ls: !!(JSON.parse(localStorage.getItem('gldt_save_v1')).secHint || {})[id] }; }, sb);
    ok('secret hint: tap registered + saved', st.saved && st.ls, { tap: r, st }); ok('secret hint: checklist rendered + stays in view', st.btnGone && st.checklistOnScreen, st); await p.screenshot({ path: SH + 'secret_hint.png' }); }
  // 4. close + reopen + reload -> still revealed
  await p.evaluate(() => __g.ui.close(true)); await p.waitForTimeout(300);
  await p.evaluate(() => __g.saveNow());
  await p.reload(); await p.waitForTimeout(1500); await T('touchStart', [[W / 2, H / 2, 1]]); await T('touchEnd', []); await p.waitForTimeout(800); await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 30000 });
  await p.evaluate(() => document.querySelector('#cCont').click()); await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 30000 }); await p.waitForTimeout(1200);
  const per = await p.evaluate(([hb, sb]) => { const S = __g.game.save; __g.ui.open('swx', 1); return { sw: !!(S.swHint || {})[hb], sec: !!(S.secHint || {})[sb], btnSw: !!document.querySelector('[data-do="swhint:' + hb + '"]'), btnSec: !!document.querySelector('[data-do="sechint:' + sb + '"]'), lists: document.querySelectorAll('#panel .swck').length }; }, [hb, sb]);
  ok('hints persist after reload', per.sw && per.sec && !per.btnSw && !per.btnSec, per);
  await p.evaluate(() => __g.ui.close(true));
  // 5. Mysterious Swordsman riddle -> Sword Index link
  const ms = await p.evaluate(async () => { const g = __g.game, S = g.save; S.lvl = 120; const isl = Object.entries(__g.QUESTS || {}).find(([i, L]) => L.some(q => q.secret && q.sword)); const id = isl ? isl[0] : 'loguetown'; S.unlocked = [...new Set([...(S.unlocked || []), id])]; g.loadIsland(id, false); await new Promise(r => setTimeout(r, 600));
    const n = (g.island.npcs || []).find(n => n.name === 'Mysterious Swordsman'); if (!n) return { err: 'no swordsman on ' + id, npcs: g.island.npcs.map(n => n.name).slice(0, 12) }; g.ui.open('quest', n); const a = document.querySelector('#panel .riddle a[data-do]'); if (a) a.id = 'tRid'; return { id, riddle: (document.querySelector('#panel .riddle') || {}).textContent, link: !!a }; });
  ok('Mysterious Swordsman shows riddle + link', ms.link, ms);
  if (ms.link) { await p.waitForTimeout(600); r = await tap('#tRid'); ok('riddle link tap opens Sword Index', (await p.evaluate(() => __g.ui.modal)) === 'swx', r); await p.screenshot({ path: SH + 'riddle_link.png' }); }
  await p.evaluate(() => __g.ui.close(true)); await p.waitForTimeout(300);
  // 6. Tavern rumor
  const rum = await p.evaluate(() => { const g = __g.game; g._rumT = 0; g.rumorTick(); const L = [...document.querySelectorAll('#chat .chatl')]; const e = L.find(e => /Tavern Rumor/.test(e.textContent)); if (!e) return { err: 'no rumor', modal: __g.ui.modal, cut: !!g.cut };
    const a = e.querySelector('[data-do],a,button'); if (a) a.id = 'tRum'; return { text: e.textContent.slice(0, 200), link: !!a }; });
  ok('tavern rumor shown', !rum.err, rum); ok('rumor has a tappable Sword Index link', rum.link, rum);
  if (rum.link) { r = await tap('#tRum', false); ok('rumor link tap opens Sword Index', (await p.evaluate(() => __g.ui.modal)) === 'swx', r); }
  await p.screenshot({ path: SH + 'rumor.png' });
  ok('zero console errors', errs.length === 0, errs.slice(0, 6));
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message); process.exit(2); });
