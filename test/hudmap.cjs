// phone HUD: top-right buttons size + overlap check, portrait & landscape.  node test/hudmap.cjs [prefix]
const { chromium } = require('playwright-core');
const pre = process.argv[2] || 'hudmap_';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  for (const [nm, w, h] of [['portrait', 390, 844], ['landscape', 844, 390]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(nm + ' PE ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(nm + ' ' + m.text().slice(0, 200)); });
    await p.goto((process.env.BASE || 'http://localhost:8080') + '/?skip&anytap'); await p.waitForFunction(() => window.__g, null, { timeout: 30000 }); await p.waitForTimeout(1500); await p.touchscreen.tap(w / 2, h / 2);
    await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForTimeout(4000);
    const r = await p.evaluate(() => { const vis = e => { const s = getComputedStyle(e); const R = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && R.width > 0 ? R : null; };
      const top = [...document.querySelectorAll('#topbtns .hudbtn')].map(e => ({ t: e.textContent.trim(), r: vis(e) })).filter(x => x.r);
      const others = [...document.querySelectorAll('#hud .hudbtn:not(#topbtns .hudbtn), #hud .tb, #hud .mv, #joy, #stick, #touch > *, #stat, #compass, #quest, #bars, #minimap')].map(e => ({ id: e.id || e.className || e.tagName, r: vis(e) })).filter(x => x.r);
      const ov = []; for (const a of top) for (const o of others) { const A = a.r, O = o.r; if (A.left < O.right && A.right > O.left && A.top < O.bottom && A.bottom > O.top) ov.push(a.t + ' x ' + o.id); }
      return { sizes: top.map(x => x.t + ' ' + Math.round(x.r.width) + 'x' + Math.round(x.r.height) + '@' + Math.round(x.r.left) + ',' + Math.round(x.r.top)), ov }; });
    console.log(nm, JSON.stringify(r)); await p.screenshot({ path: `${__dirname}/../shots/${pre}${nm}.png` }); await ctx.close(); }
  console.log('ERRS', errs); await b.close(); })();
