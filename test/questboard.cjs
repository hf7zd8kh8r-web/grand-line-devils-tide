// Quest board: pick, complete, repeat, rewards, screenshot, zero console errors.
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8099';
let fails = 0; const ok = (n, c, x = '') => { console.log(c ? 'PASS' : 'FAIL', n, x); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PE ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket|favicon/.test(m.text())) errs.push(m.text().slice(0, 180)); });
  await p.goto(BASE + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(200, 200);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 20000 });
  await p.fill('#cName', 'QBoard'); await p.click('#cGo');
  await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 20000 });
  await p.waitForTimeout(1500);
  await p.evaluate(() => __g.ui.close && __g.ui.close(true));

  // Open board
  await p.evaluate(() => __g.ui.open('board'));
  await p.waitForTimeout(400);
  const board = await p.evaluate(() => ({
    title: document.querySelector('#panel h2')?.textContent || '',
    cards: document.querySelectorAll('.qboard .qcard').length,
    accept: !!document.querySelector('[data-do^="qtake"]'),
  }));
  ok('board opens', /Quest Board/.test(board.title) && board.cards >= 4 && board.accept, JSON.stringify(board));
  await p.screenshot({ path: __dirname + '/../shots/questboard.png', fullPage: false });

  // Accept first quest (w1)
  const took = await p.evaluate(() => {
    const S = __g.game.save; const ber0 = S.ber, xp0 = S.xp, lvl0 = S.lvl;
    __g.ui.act('qtake:w1');
    return { active: (S.quests || []).map(q => q.id), ber0, xp0, lvl0, text: S.quest && S.quest.text };
  });
  ok('accepted w1', took.active.includes('w1'), JSON.stringify(took));

  // Complete it
  const done1 = await p.evaluate(() => {
    const g = __g.game, S = g.save; const ber0 = S.ber, xp0 = S.xp;
    const q = S.quests.find(q => q.id === 'w1'); q.have = q.n; g.completeQuest(q);
    return { ber0, ber1: S.ber, xp0, xp1: S.xp, qdone: S.qdone.slice(), active: (S.quests || []).map(q => q.id), qcd: !!(S.qcd && S.qcd.w1) };
  });
  ok('first clear rewards', done1.ber1 === done1.ber0 + 120 && done1.xp1 > done1.xp0, JSON.stringify(done1));
  ok('marked done + cooldown', done1.qdone.includes('w1') && done1.qcd && !done1.active.includes('w1'), JSON.stringify(done1));

  // Reopen board — Repeat on CD
  await p.evaluate(() => __g.ui.open('board'));
  await p.waitForTimeout(200);
  const cdBtn = await p.evaluate(() => {
    const card = [...document.querySelectorAll('.qcard')].find(c => /Defeat 4 Bandits/.test(c.textContent));
    const btn = card && card.querySelector('button');
    return { text: btn && btn.textContent, disabled: !!(btn && btn.disabled) };
  });
  ok('repeat locked on cooldown', cdBtn.disabled && /Ready in/.test(cdBtn.text || ''), JSON.stringify(cdBtn));

  // Clear CD and repeat
  const rep = await p.evaluate(() => {
    const S = __g.game.save; S.qcd.w1 = 0; __g.ui.open('board');
    const ber0 = S.ber, xp0 = S.xp;
    __g.ui.act('qtake:w1');
    const q = S.quests.find(q => q.id === 'w1');
    const okTake = !!q && q.repeat;
    q.have = q.n; __g.game.completeQuest(q);
    return { okTake, ber0, ber1: S.ber, xp0, xp1: S.xp, deltaBer: S.ber - ber0, banner: document.body.innerText.includes('REPEAT') || true };
  });
  ok('repeat accepted after CD clear', rep.okTake, JSON.stringify(rep));
  ok('repeat grants full berries again', rep.deltaBer === 120, JSON.stringify(rep));

  // Multi-track up to 3
  const multi = await p.evaluate(() => {
    const S = __g.game.save; S.qcd = {};
    __g.ui.act('qtake:w1'); __g.ui.act('qtake:w4'); __g.ui.act('qtake:w5');
    const full = __g.ui.act('qtake:w2'); // should fail slots
    return { n: S.quests.length, ids: S.quests.map(q => q.id) };
  });
  ok('tracks up to 3', multi.n === 3, JSON.stringify(multi));

  // Board has physical NPC
  const npc = await p.evaluate(() => (__g.game.npcs || []).some(n => n.role === 'board'));
  ok('quest board prop on island', npc);

  ok('zero console errors', errs.length === 0, JSON.stringify(errs));
  await b.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
