// Unique M1 chains: every fruit maps to a family; each family's 4-hit chain lands on a dummy; screenshot hit 4 (and hit 1) per family -> m1_styles grid.
const { chromium } = require('playwright-core'); const { execSync } = require('child_process');
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 640, height: 360 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push('PE ' + e.message)); p.on('console', m => { if ((m.type() === 'error' || /^m1 /.test(m.text())) && !/404/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  const ok = (n, c, x = '') => console.log(c ? 'PASS' : 'FAIL', n, x); const ev = (f, a) => p.evaluate(f, a); const SH = `${__dirname}/../shots/`;
  await p.goto((process.env.BASE || 'http://127.0.0.1:5397') + '/?skip&anytap'); await p.waitForFunction(() => window.__g, null, { timeout: 30000 }); await p.waitForTimeout(1200); await p.mouse.click(320, 180);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 25000 }); await p.click('#cGo'); await p.waitForTimeout(2500);
  const fams = { fire: 'mera', ice: 'hie', light: 'pika', rubber: 'gomu', magma: 'magu', gravity: 'zushi', dark: 'yami', quake: 'gura', string: 'ito', smoke: 'moku', sand: 'suna', soul: 'soru', dragon: 'seiryu', zoan: 'raijin', thunder: 'goro', sound: 'sound' };
  const files = [];
  for (const [fam, id] of Object.entries(fams)) {
    const r = await ev(async ({ id }) => { const g = __g.game, S = g.save; S.lvl = 100; S.hp = 1e7; if (!S.inv.fruits.includes(id)) S.inv.fruits.push(id); S.eq.fruit = id; S.slot = 'fruit'; S.awake = {}; g.refreshEquip(); g.p.pitch = -0.08;
      const e = g.enemies.find(x => !x.boss); const P = g.p.pos, F = g.fwdFlat(new P.constructor()); e.dead = false; e.c.root.visible = true; e.hp = e.max = 1e6; e.aggro = false; e.armorT = 0; e.blockT = 0; e.invT = 0; e.c.root.position.set(P.x + F.x * 3, g.groundAt(P.x + F.x * 3, P.z + F.z * 3), P.z + F.z * 3); window.__e = e; window.__h0 = e.hp; return 1; }, { id });
    for (let k = 1; k <= 4; k++) { await ev(() => { const g = __g.game; g.p.atkCd = 0; g.p.comboT = k_ => 0; }); await ev(k => { const g = __g.game, e = window.__e; e.armorT = 0; e.blockT = 0; e.state = 'idle'; const P = g.p.pos, F = g.fwdFlat(new P.constructor()); e.c.root.position.set(P.x + F.x * 3, g.groundAt(P.x + F.x * 3, P.z + F.z * 3), P.z + F.z * 3); e.vel.set(0, 0, 0); g.p.atkCd = 0; g.p.comboT = k > 1 ? 0.5 : 0; g.p.combo = k - 1; g.attack(); }, k);
      await p.waitForTimeout(k === 4 ? 160 : 280); if (k === 1 || k === 4) { const f = `/tmp/m1_${fam}_${k}.png`; await p.screenshot({ path: f }); files.push([fam, k, f]); } }
    await p.waitForTimeout(500); const d = await ev(() => window.__h0 - window.__e.hp); ok(`${fam} (${id}) 4-hit chain lands`, d > 0, Math.round(d));
  }
  const fam1 = files.filter(f => f[1] === 4).map(f => f[2]); const n = fam1.length; const lay = fam1.map((_, i) => `${(i % 4) ? Array.from({ length: i % 4 }, () => 'w0').join('+') : '0'}_${Math.floor(i / 4) ? Array.from({ length: Math.floor(i / 4) }, () => 'h0').join('+') : '0'}`).join('|');
  const lbl = Object.keys(fams).map((k, i) => `[${i}]scale=320:-1,drawtext=text='${k}':x=8:y=8:fontsize=22:fontcolor=white:borderw=2[v${i}]`).join(';');
  execSync(`ffmpeg -y -loglevel error ${fam1.map(f => '-i ' + f).join(' ')} -filter_complex "${lbl};${fam1.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${n}:layout=${lay}" ${SH}m1_styles.png`);
  ok('zero console errors', !errs.length, JSON.stringify(errs.slice(0, 5))); await b.close(); })();
