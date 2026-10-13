// cover title call: plays exactly once on the unlocking tap, ducks the anthem, respects mute; Japanese title visible
const { chromium } = require('playwright-core');
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ok = (n, c, x = '') => console.log(c ? 'PASS' : 'FAIL', n, x); const errs = [];
  const run = async (mute, shot) => { const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push('PE ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    if (mute) await p.addInitScript(() => localStorage.setItem('gldt_audio', JSON.stringify({ music: 0.55, sfx: 0.8, mute: true })));
    await p.goto(process.env.BASE || 'http://127.0.0.1:5396/'); await p.waitForTimeout(3600); // logo -> cover (no gesture yet)
    let s = await p.evaluate(() => ({ mode: __g.mode, plays: __audio.titlePlays || 0 })); ok((mute ? '[mute] ' : '') + 'no play before a gesture', s.mode === 'cover' && !s.plays, JSON.stringify(s));
    await p.touchscreen.tap(60, 60); await p.waitForTimeout(500); const duck = await p.evaluate(() => __audio.mG.gain.value); await p.waitForTimeout(1200);
    await p.touchscreen.tap(80, 70); await p.waitForTimeout(600); await p.touchscreen.tap(90, 80); await p.waitForTimeout(2600);
    s = await p.evaluate(() => ({ plays: __audio.titlePlays || 0, done: !!__audio.titleDone, mg: __audio.mG.gain.value, state: __audio.ctx.state })); ok((mute ? '[mute] ' : '') + 'title call handled exactly once', s.plays === 1 && s.done, JSON.stringify(s));
    if (!mute) { ok('anthem ducked under the voice', duck < 0.55 * 0.5 * 0.6, duck.toFixed(3)); ok('anthem restored after', s.mg > 0.2, s.mg.toFixed(3)); }
    else ok('[mute] silent', s.mg < 0.01, s.mg.toFixed(3));
    const jp = await p.evaluate(() => { const e = document.querySelector('#cover .t3'); const r = e.getBoundingClientRect(); return { txt: e.textContent, vis: getComputedStyle(e).opacity, w: r.width, inView: r.right <= innerWidth && r.left >= 0 }; }); ok('Japanese title shown', jp.txt === 'グランドライン・デビルズタイド' && +jp.vis > 0.9 && jp.inView, JSON.stringify(jp));
    if (shot) await p.screenshot({ path: shot }); await ctx.close(); };
  await run(false, process.argv[2]); await run(true); ok('zero console errors', !errs.length, JSON.stringify(errs)); await b.close(); })();
