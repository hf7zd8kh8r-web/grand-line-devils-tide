// Zoan transform, themed basic attacks, mastery-gated moves (buttons + bag), across PC / phone landscape / portrait
const { chromium, devices } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:4180';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = []; const out = `${__dirname}/../shots/`;
  for (const [tag, vp, touch] of [['pc', { width: 1280, height: 720 }, false], ['land', { width: 844, height: 390 }, true], ['port', { width: 390, height: 844 }, true]]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1 }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ' PE ' + e.message));
    await p.goto(BASE + '/?skip&anytap'); await p.waitForTimeout(1200); if (touch) await p.touchscreen.tap(vp.width / 2, vp.height / 2); else await p.mouse.click(vp.width / 2, vp.height / 2);
    await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.evaluate(() => document.querySelector('#cGo').click()); await p.waitForTimeout(1500);
    const r = await p.evaluate(() => { const g = __g.game, S = g.save; S.lvl = 80; S.inv.fruits.push('kitsune', 'mera', 'ope', 'gomu'); S.eq.fruit = 'kitsune'; S.slot = 'fruit'; S.mastery['fr:kitsune'] = { lvl: 12, xp: 0 }; g.refreshEquip(); g.ui.updateMoves();
      const o = {}; o.btns0 = [...document.querySelectorAll('#moves .mv')].map(e => e.innerText.replace(/\s+/g, ' ')); o.tfVis = getComputedStyle(document.querySelector('#tfBtn')).display;
      const hp0 = g.st.maxHp, d0 = g.st.dmg; g.transform(); o.tf1 = S.tf; g.transform(); o.tf2 = S.tf; o.hpUp = g.st.maxHp / hp0; o.dmgUp = +(g.st.dmg / d0).toFixed(2); o.eye = g.st.eye;
      o.btns2 = [...document.querySelectorAll('#moves .mv')].map(e => e.innerText.replace(/\s+/g, ' ')); return o; });
    console.log(tag, JSON.stringify(r));
    await p.waitForTimeout(500); await p.screenshot({ path: out + `zoan_${tag}_beast.png` });
    if (tag === 'pc') { // basic attacks per kind + beast move hits
      const k = await p.evaluate(async () => { const g = __g.game, S = g.save; const P = g.p.pos; const res = {};
        const place = () => { const live = g.enemies.filter(e => !e.boss); live.forEach((e, i) => { e.dead = false; e.c.root.visible = true; e.hp = 9999; e.aggro = false; const a = g.p.yaw + Math.PI + (i % 3 - 1) * 0.15; const d = 2.4 + (i % 3) * 0.3; e.c.root.position.set(P.x - Math.sin(g.p.yaw) * d, g.groundAt(P.x, P.z), P.z - Math.cos(g.p.yaw) * d); }); return live; };
        for (const id of ['kitsune', 'mera', 'ope', 'gomu', 'gura']) { if (!S.inv.fruits.includes(id)) S.inv.fruits.push(id); S.eq.fruit = id; S.slot = 'fruit'; g.refreshEquip(); g.p.pitch = -0.05; const live = place(); const h0 = live.reduce((a, e) => a + e.hp, 0); for (let i = 0; i < 4; i++) { g.p.atkCd = 0; g.attack(); await new Promise(r => setTimeout(r, 300)); } res[id] = Math.round(h0 - live.reduce((a, e) => a + e.hp, 0)); }
        S.eq.fruit = 'kitsune'; g.refreshEquip(); S.mastery['fr:kitsune'] = { lvl: 60, xp: 0 }; g.transform(); g.transform(); g.ui.updateMoves(); const live = place(); const h0 = live.reduce((a, e) => a + e.hp, 0); g.move(0); await new Promise(r => setTimeout(r, 900));
        res.beastMove = Math.round(h0 - live.reduce((a, e) => a + e.hp, 0)); res.tf = S.tf; res.mv = [...document.querySelectorAll('#moves .mv')].map(e => e.innerText.replace(/\s+/g, ' ')); return res; }).catch(e => 'ERR ' + e.message);
      console.log('basic+beast', JSON.stringify(k)); }
    await p.evaluate(() => { const S = __g.game.save; S.mastery['fr:kitsune'] = { lvl: 12, xp: 0 }; __g.game.ui.open('inv'); }); await p.waitForTimeout(600); await p.screenshot({ path: out + `zoan_${tag}_bag.png` });
    await ctx.close(); }
  console.log('ERRS', errs); await b.close(); })();
