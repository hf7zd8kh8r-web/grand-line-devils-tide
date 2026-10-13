// in-game music: unlock via tap, check the theme switches (cover -> island variant / battle / duel) and crossfades without console errors
const { chromium } = require('playwright-core');
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  const ok = (n, c, x = '') => console.log(c ? 'PASS' : 'FAIL', n, x);
  await p.goto((process.env.BASE || 'http://127.0.0.1:5394') + '/?skip&anytap'); await p.waitForFunction(() => window.__g, null, { timeout: 30000 }); await p.waitForTimeout(1500); await p.touchscreen.tap(422, 195); await p.waitForTimeout(800);
  const st = () => p.evaluate(() => { const A = __audio; return { state: A.ctx && A.ctx.state, cur: A.cur, live: A.music ? A.music.live.map(s => s.name + (s.end ? '(fading)' : '')) : [], lite: A.music && A.music.lite }; });
  let s = await st(); ok('context unlocked + cover playing', s.state === 'running' && s.cur === 'cover', JSON.stringify(s)); ok('iPhone lite mode', s.lite === true);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForTimeout(2500); s = await st(); ok('island theme after entering game', ['island', 'night'].includes(s.cur), JSON.stringify(s));
  await p.evaluate(() => { const g = __g.game; g._battleT = 30; }); await p.waitForTimeout(1200); s = await st(); ok('battle theme + crossfade', s.cur === 'battle' && s.live.some(x => /fading/.test(x)), JSON.stringify(s));
  await p.evaluate(() => { __g.game._battleT = 0; __g.game.island = { ...__g.game.island, id: 'wano' }; }); await p.waitForTimeout(1500); s = await st(); ok('Wano island variant', s.cur === 'wano', JSON.stringify(s));
  await p.evaluate(() => { __g.game.duel.on = true; }); await p.waitForTimeout(1200); s = await st(); ok('duel arena theme', s.cur === 'duel', JSON.stringify(s)); await p.evaluate(() => { __g.game.duel.on = false; });
  await p.evaluate(() => { __audio.set.music = 0.2; __audio.save(); }); await p.waitForTimeout(400); const gv = await p.evaluate(() => __audio.mG.gain.value); ok('music volume slider applies', Math.abs(gv - 0.1) < 0.02, gv.toFixed(3));
  await p.waitForTimeout(4000); s = await st(); ok('faded tracks cleaned up', s.live.length <= 2, JSON.stringify(s));
  ok('zero console errors', errs.length === 0, JSON.stringify(errs)); await b.close(); })();
