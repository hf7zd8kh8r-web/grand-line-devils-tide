// Frame-by-frame viewmodel animation capture -> contact sheets in shots/anim2_<tag>_<view>_<seq>.png
// usage: node test/anim2.cjs <tag> [seqFilter]   (BASE=http://localhost:4173)
const { chromium } = require('playwright-core'); const fs = require('fs'); const { execFileSync } = require('child_process');
const BASE = process.env.BASE || 'http://localhost:4173'; const TAG = process.argv[2] || 'x'; const FIL = process.argv[3] || '';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SEQ = [ // [name, kind, id, action, frames, stepFrames]
  ['swing1', 'sword', 'wado', 'atk1', 22, 1], ['swing2', 'sword', 'wado', 'atk2', 22, 1], ['swing3', 'sword', 'wado', 'atk3', 22, 1], ['swing4', 'sword', 'wado', 'atk4', 24, 1], ['swing5', 'sword', 'wado', 'atk5', 24, 1],
  ['santoryu', 'sword', 'sanbon', 'atk1', 22, 1], ['santoryu2', 'sword', 'sanbon', 'atk2', 22, 1],
  ['skOni', 'sword', 'wado', 'mv0', 24, 2], ['skTatsu', 'sword', 'wado', 'mv1', 24, 2], ['skFly', 'sword', 'kikoku', 'mv0', 24, 2],
  ['idle', 'sword', 'wado', 'idle', 16, 4], ['walk', 'sword', 'wado', 'walk', 16, 3],
  ['meraBasic', 'fruit', 'mera', 'atk1', 20, 1], ['gomuBasic', 'fruit', 'gomu', 'atk1', 20, 1], ['guraBasic', 'fruit', 'gura', 'atk1', 20, 1],
  ['nika0', 'fruit', 'nika', 'mv0', 24, 3], ['seiryu0', 'fruit', 'seiryu', 'mv0', 24, 3], ['gura0', 'fruit', 'gura', 'mv0', 24, 3], ['yami1', 'fruit', 'yami', 'mv1', 24, 3], ['soru2', 'fruit', 'soru', 'mv2', 24, 3], ['pika0', 'fruit', 'pika', 'mv0', 24, 3], ['magu1', 'fruit', 'magu', 'mv1', 24, 3],
].filter(s => !FIL || FIL.split(',').some(f => s[0].startsWith(f)));
const VIEWS = (process.env.VIEWS || 'land,port').split(',').map(v => ({ land: { n: 'land', w: 844, h: 390 }, port: { n: 'port', w: 390, h: 844 } }[v]));
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const errs = [];
  for (const V of VIEWS) {
    const p = await (await b.newContext({ viewport: { width: V.w, height: V.h }, isMobile: false, hasTouch: true })).newPage();
    p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | '))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
    await p.goto(BASE + '/?skip&anytap'); await sleep(1500); await p.mouse.click(V.w / 2, V.h / 2); await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 30000 }); await p.click('#cGo'); await sleep(1800);
    await p.evaluate((NO) => { window.__noen = NO; const g = __g.game, S = g.save; S.lvl = 150; S.hp = 1e7; g.amb.phase = () => 0.3; if (g.events) g.events.timer = 1e9; window.__home = g.p.pos.clone(); window.requestAnimationFrame = () => 0; window.__noen = NO; }, !!process.env.NOEN);
    await sleep(200);
    for (const [name, kind, id, act, N, step] of SEQ) {
      const frames = await p.evaluate(([kind, id, act, N, step]) => { const g = __g.game, S = g.save; const pre = { fruit: 'fr:', sword: 'sw:' }[kind]; S.mastery[pre + id] = { lvl: 400, xp: 0 };
        if (kind === 'fruit') { if (!S.inv.fruits.includes(id)) S.inv.fruits.push(id); S.eq.fruit = id; S.slot = 'fruit'; } else { S.eq.sword = id; S.slot = 'sword'; (S.inv.swords || (S.inv.swords = [])).includes(id) || S.inv.swords.push(id); }
        S.tf = 0; g.refreshEquip(); g.p.cds = {}; S.hp = 1e7; const H = window.__home; const FAR = window.__noen; g.p.pos.copy(H); g.p.yaw = 0; g.p.pitch = -0.04; g.p.dash = 0; g.p.vel && g.p.vel.set(0, 0, 0);
        const live = g.enemies.filter(e => !e.boss).slice(0, 4); live.forEach((e, i) => { e.dead = false; e.c.root.visible = true; e.hp = e.max = 1e7; e.aggro = false; e.state = 'idle'; e.vel.set(0, 0, 0); const x = H.x + (i - 1.5) * 1.6, z = H.z - (FAR ? 40 : 3.0) - (i % 2) * 2.5; e.c.root.position.set(x, g.groundAt(x, z), z); });
        const dt = 1 / 60; for (let i = 0; i < 90; i++) g.update(dt); // settle equip
        const out = []; const shot = () => { g.render(); out.push(document.querySelector('canvas').toDataURL('image/jpeg', 0.8)); };
        const m = /^atk(\d)/.exec(act); if (m) { const k = +m[1]; for (let j = 1; j < k; j++) { g.p.atkCd = 0; g.attack(); for (let i = 0; i < 16; i++) g.update(dt); } g.p.atkCd = 0; g.attack(); }
        else if (act.startsWith('mv')) { g.p.cds = {}; g.move(+act.slice(2)); }
        const walk = act === 'walk'; for (let f = 0; f < N; f++) { shot(); for (let s = 0; s < step; s++) { if (walk) { g.p.moving = true; g.p.phase = (g.p.phase || 0) + dt * 9; } g.update(dt); } }
        if (g.cut) { try { g.cut.end && g.cut.end(); } catch (e) { } } for (let i = 0; i < 120; i++) g.update(dt); return out; }, [kind, id, act, N, step]);
      const dir = `/tmp/anim2/${TAG}_${V.n}_${name}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
      frames.forEach((d, i) => fs.writeFileSync(`${dir}/f${String(i * step).padStart(3, '0')}.png`, Buffer.from(d.split(',')[1], 'base64')));
      const outp = `${__dirname}/../shots/anim2_${TAG}_${V.n}_${name}.png`; execFileSync('python3', [__dirname + '/sheet.py', dir, outp, V.n === 'land' ? '6' : '8', `${TAG} ${V.n} ${name} (${kind}:${id} ${act}) frame step ${step}/60s`]); console.log('saved', outp);
    }
    await p.close();
  }
  console.log('ERRS', errs.length, JSON.stringify(errs.slice(0, 10))); await b.close(); })().catch(e => { console.error('FAIL', e); process.exit(1); });
