// Boss body animation: poses screenshots (MODE=before uses the old animChar flags, MODE=after drives the real boss animation path), zero console errors, cheap per frame.
const { chromium, devices } = require('playwright-core');
const MODE = process.env.MODE || 'after', BASE = process.env.BASE || 'http://127.0.0.1:5401', SH = `${__dirname}/../shots/`;
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 960, height: 540 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push('PE ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket|net::/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  const ok = (n, c, x = '') => console.log(c ? 'PASS' : 'FAIL', n, x); const ev = (f, a) => p.evaluate(f, a);
  await p.goto(BASE + '/?skip&anytap'); await p.waitForFunction(() => window.__g, null, { timeout: 60000 }); await p.waitForTimeout(1200); await p.mouse.click(480, 270);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 30000 }); await p.click('#cGo'); await p.waitForTimeout(2500);
  await ev(() => { const g = __g.game; g.save.lvl = 70; g.save.unlocked.push('alabasta'); g.loadIsland('alabasta', false); }); await p.waitForTimeout(2000);
  await ev(async (MODE) => { const g = __g.game; window.__CH = await import('/src/chars.js'); const e = g.enemies.find(x => x.boss); window.__B = e; const A = e.s.arena; g.bossIntroDone[e.s.type] = true;
    for (const x of g.enemies) if (x !== e) { x.c.root.visible = false; x.ext = () => { x.c.root.visible = false; }; }
    e.c.root.position.set(A.x, g.groundAt(A.x, A.z), A.z); e.c.root.rotation.y = 0; e.yaw = 0; g.save.hp = 1e9; g.st.maxHp = 1e9; g.hurtPlayer = () => {};
    g.p.pos.set(A.x, g.groundAt(A.x, A.z + 4.6), A.z + 4.6); g.p.yaw = 0; g.p.pitch = 0.04; const hc = () => { g.vm.scene && (g.vm.scene.visible = false); g.vm.root.visible = false; }; hc(); setInterval(hc, 50); const hideUI = () => { for (const el of document.body.children) if (el.tagName !== 'CANVAS' && !el.querySelector('canvas')) el.style.visibility = 'hidden'; }; hideUI(); setInterval(hideUI, 200);
    for (const o of [...g.scene.children]) { if (o === e.c.root || o.isLight || o.type === 'Group' && o.children.some(c => c.isLight)) continue; const wp = o.position; if (o.isMesh || o.isGroup) { const d = Math.hypot(wp.x - A.x, wp.z - (A.z + 2.3)); if (d < 3) { const bb = new o.position.constructor(); try { const B3 = new (Object.getPrototypeOf(e.c.root.position).constructor)(); } catch (_) {} if (!(o.geometry && o.geometry.boundingSphere && o.geometry.boundingSphere.radius > 6)) o.visible = false; } } } window.__pose = null; window.__T = 0;
    e.ext = (dt) => { window.__T += dt; const T = window.__T, P = window.__pose; if (!P) return; const R = e.c.root; R.position.y = g.groundAt(R.position.x, R.position.z) + (R.userData.air || 0); R.rotation.y = 0;
      if (MODE === 'before') { const st = { phase: e.anim.phase || 0, idleV: true, ...P.old(T) }; if (st.move) e.anim.phase = (e.anim.phase || 0) + dt * 9; st.phase = e.anim.phase; __CH.animChar(e.c, st, g.t); }
      else { P.now(e, T, dt, g); const t0 = performance.now(); g.animEnemy(e, dt); window.__ms = (window.__ms || 0) * 0.9 + (performance.now() - t0) * 0.1; } }; }, MODE);
  const poses = ['idle', 'walk', 'windup', 'swing', 'fruitwind', 'fruitrelease', 'special', 'hit', 'roar', 'enrage', 'death'];
  for (const n of poses) {
    await ev((n) => { const e = __B; window.__T = 0; e.dead = false; e.deadT = 0; e.c.root.rotation.x = 0; e.c.root.rotation.z = 0; e.c.root.visible = true; e.c.root.userData.air = 0; e.state = 'chase'; e.roarT = 0; e.enraged = false; e._act = null; e.anim = { phase: 0 }; e.hitT = 0;
      const O = { idle: () => ({}), walk: () => ({ move: 1 }), windup: () => ({ windup: true }), swing: T => ({ attack: Math.max(0.05, 1 - T * 1.5) }), fruitwind: () => ({ windup: true }), fruitrelease: () => ({ attack: 0.4 }), special: () => (__B.c.root.userData.air = 1.6, { windup: true, taunt: true }), hit: () => ({ hit: 1 }), roar: () => ({ taunt: true }), enrage: () => ({ angry: true }), death: T => ({ dead: T }) };
      const N = { idle: () => {}, walk: e => { e.anim.move = 1; e.state = 'chase'; }, windup: e => { e.state = 'windup'; }, swing: (e, T) => { e.anim.attack = Math.max(0, 1 - T * 3); },
        fruitwind: (e, T) => { e.state = 'skill'; e._act = e._act || { k: 'move', kind: 'sand', mk: 'desert', t: 0.5, wind: 1.15 }; e._act.t = 0.6; },
        fruitrelease: (e, T) => { e.state = 'skill'; e._act = e._act || { k: 'move', kind: 'sand', mk: 'desert', t: 0, wind: 1.15 }; e._act.t = 1.15 + Math.min(T, 0.12); },
        special: (e, T) => { e.state = 'skill'; e._act = e._act || { k: 'special', t: 0, wind: 2.3 }; e._act.t = 1.4; e.c.root.userData.air = 1.6; },
        hit: (e, T) => { if (T < 0.02) { e.state = 'hit'; e.hitT = 0.25; e.anim.hit = 1; } else e.anim.hit = Math.max(0, 1 - T * 2.5); },
        roar: (e, T) => { e.roarT = 0.6; e.state = 'skill'; }, enrage: e => { e.enraged = true; e.state = 'chase'; },
        death: (e, T) => { e.dead = true; e.deadT = T; } };
      window.__pose = { old: O[n], now: N[n] }; }, n);
    const wait = { swing: 220, fruitrelease: 160, hit: 120, death: 900, roar: 450 }[n] || 700; await p.waitForTimeout(wait);
    await p.screenshot({ path: `${SH}bossanim_${MODE}_${n}.png`, clip: { x: 255, y: 0, width: 450, height: 540 } }); }
  if (MODE === 'after') { const r = await ev(() => { const e = __B, B_ = e.c.bones; const snap = () => ['armR', 'armL', 'torso', 'legL', 'hips'].map(k => B_[k].rotation.x.toFixed(2) + ',' + B_[k].rotation.y.toFixed(2) + ',' + B_[k].rotation.z.toFixed(2)).join('|'); return { ms: window.__ms, snap: snap() }; });
    ok('boss anim cost per frame < 0.3 ms', r.ms < 0.3, (r.ms || 0).toFixed(3) + 'ms');
    // distinct windups per fruit move family
    const fam = await ev(async () => { const e = __B; const out = {}; for (const k of ['punch', 'beam', 'sky', 'ground', 'dash', 'spin', 'cast']) { e._act = { k: 'move', kind: k, t: 0.7, wind: 1.15 }; e.state = 'skill'; e.dead = false; window.__pose = { now: () => { e._act.t = 0.7; } }; await new Promise(r => setTimeout(r, 450)); out[k] = e.c.bones.armR.rotation.x.toFixed(1) + '/' + e.c.bones.armL.rotation.x.toFixed(1) + '/' + e.c.bones.torso.rotation.y.toFixed(1) + '/' + e.c.bones.hips.position.y.toFixed(2); } return out; });
    ok('distinct windup pose per move family', new Set(Object.values(fam)).size >= 6, JSON.stringify(fam));
    // real fight path: boss runs its AI for a few seconds without errors
    await ev(() => { const g = __g.game, e = __B; e.ext = null; e.dead = false; e.hp = e.max; e.aggro = true; e.skillCd = 0.3; e.spCd = 99; window.__pose = null; }); await p.waitForTimeout(5000);
    const hp = await ev(() => [__B.hp, __B.max]); ok('boss HP untouched by anim', hp[0] === hp[1], JSON.stringify(hp)); }
  ok('zero console errors', !errs.length, JSON.stringify(errs.slice(0, 4))); await b.close(); })();
