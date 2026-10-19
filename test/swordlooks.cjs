// Distinct sword looks: model sheet (all 55 + Tier II), icon sheet, first-person + third-person shots, zero errors.
// BASE=http://localhost:8099 node test/swordlooks.cjs [tag]
const { chromium } = require('playwright-core'); const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:8099'; const TAG = process.argv[2] || 'v1'; const SH = __dirname + '/../shots/'; fs.mkdirSync(SH + 'swl', { recursive: true });
let fails = 0; const ok = (n, c, x = '') => { console.log(c ? 'PASS' : 'FAIL', n, typeof x === 'string' ? x : JSON.stringify(x)); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); p.on('console', m => { if (m.type() === 'error' && !/404|WebSocket/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  await p.goto(BASE + '/?skip&anytap'); await p.waitForTimeout(1200); await p.mouse.click(200, 200);
  await p.waitForFunction(() => __g.mode === 'create', null, { timeout: 30000 }); await p.fill('#cName', 'Adam'); await p.click('#cGo'); await p.waitForFunction(() => __g.mode === 'game', null, { timeout: 30000 }); await p.waitForTimeout(1500);
  await p.evaluate(() => { const g = __g.game; g.duel && (g.duel._chalT = 1e9); });
  // ---- stats: every sword has a look, all distinct, low poly ----
  const st = await p.evaluate(() => { const { SL, SWORDS, T2, THREE } = __g; const ids = Object.keys(SWORDS); const m = new THREE.MeshBasicMaterial(); const out = { miss: [], tris: {}, sig: {}, dup: [] };
    for (const id of ids) { if (!SL.lookOf(id)) { out.miss.push(id); continue; } const g = SL.buildSword(id, false, m); let t = 0; g.traverse(o => { if (o.geometry && !o.userData.isOutline) t += o.geometry.attributes.position.count / 3; }); out.tris[id] = Math.round(t);
      const sp = SL.lookOf(id); const sig = JSON.stringify([sp.type, sp.L, sp.w, sp.wt, sp.cv, sp.tip, sp.hm, sp.g, sp.b, sp.e, sp.gc, sp.grc, sp.wr, sp.x]); if (out.sig[sig]) out.dup.push([id, out.sig[sig]]); out.sig[sig] = id; }
    out.t2 = Object.keys(T2).map(id => [id, !!SL.buildSword(id, true, m).children.find(o => o.renderOrder === 3) || id === 'sanbon']); out.n = ids.length; out.maxT = Math.max(...Object.values(out.tris)); out.sig = undefined; return out; });
  ok('every sword has a look', st.miss.length === 0 && st.n >= 55, st.miss); ok('all looks distinct', st.dup.length === 0, st.dup); ok('Tier II forms get an aura', st.t2.every(x => x[1]), st.t2.filter(x => !x[1]));
  ok('low poly (max tris per sword < 2500)', st.maxT < 2500, { max: st.maxT, top: Object.entries(st.tris).sort((a, b) => b[1] - a[1]).slice(0, 4) });
  // ---- model sheet: offscreen renderer, grid of all swords side-on ----
  const sheet = async (list, file, cols) => { const url = await p.evaluate(([list, cols]) => { const { SL, THREE: T, SWORDS } = __g; const W = 1800, rows = Math.ceil(list.length / cols), CH = 170, CW = W / cols, H = rows * CH;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const r = new T.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true }); r.setClearColor(0x13202e, 1); r.setSize(W, H, false);
      const out = document.createElement('canvas'); out.width = W; out.height = H; const x = out.getContext('2d');
      const mat = __g.game.vm.mat; r.setScissorTest(true);
      list.forEach(([id, t2], i) => { const sc = new T.Scene(); sc.add(new T.AmbientLight(0xffffff, 1.4)); const dl = new T.DirectionalLight(0xffffff, 2); dl.position.set(2, 3, 2); sc.add(dl);
        const g = SL.buildSword(id, t2, mat); const L = g.userData.len + 0.45; const piv = new T.Group(); piv.add(g); g.position.z = (g.userData.len + 0.12) / 2 - 0.1; piv.rotation.set(0, Math.PI / 2, 0); piv.rotation.z = 0.0; const w = new T.Group(); w.add(piv); w.rotation.set(0.25, -0.35, 0.62); sc.add(w);
        const cam = new T.PerspectiveCamera(22, CW / CH, 0.1, 50); cam.position.set(0, 0, L * 1.45 + 0.35); cam.lookAt(0, 0, 0);
        const cx = (i % cols) * CW, cy = H - (Math.floor(i / cols) + 1) * CH; r.setViewport(cx, cy, CW, CH); r.setScissor(cx, cy, CW, CH); r.render(sc, cam); });
      x.drawImage(cv, 0, 0); x.font = 'bold 15px sans-serif'; x.fillStyle = '#ffd56a'; list.forEach(([id, t2], i) => { x.fillText((SWORDS[id].name + (t2 ? ' · TIER II' : '')).slice(0, 34), (i % cols) * CW + 8, Math.floor(i / cols) * CH + 18); });
      r.dispose(); return out.toDataURL('image/png'); }, [list, cols]); fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64')); };
  const ids = await p.evaluate(() => Object.keys(__g.SWORDS)); const t2 = await p.evaluate(() => Object.keys(__g.T2));
  await sheet(ids.slice(0, 28).map(i => [i, false]), SH + `swordlooks_${TAG}_models1.png`, 7); await sheet(ids.slice(28).map(i => [i, false]), SH + `swordlooks_${TAG}_models2.png`, 7); await sheet(t2.map(i => [i, true]), SH + `swordlooks_${TAG}_tier2.png`, 6);
  // ---- icon sheet (the same images the shop / Bag / Sword Index use) ----
  await p.evaluate(([ids, t2]) => { const d = document.createElement('div'); d.id = 'iconsheet'; d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#0f1b28;display:grid;grid-template-columns:repeat(12,1fr);gap:4px;padding:8px;overflow:hidden;font:10px sans-serif;color:#ffd56a';
    d.innerHTML = [...ids.map(i => [i, false]), ...t2.map(i => [i, true])].map(([i, t]) => `<div style="text-align:center"><img src="${__g.SL.swordIcon(i, t)}" style="width:64px;height:64px;background:#24384e;border-radius:10px"><br>${(__g.SWORDS[i].name).slice(0, 18)}${t ? ' II' : ''}</div>`).join(''); document.body.appendChild(d); }, [ids, t2]);
  await p.waitForTimeout(400); await p.screenshot({ path: SH + `swordlooks_${TAG}_icons.png` }); await p.evaluate(() => document.getElementById('iconsheet').remove());
  // ---- shop + bag use the icon ----
  const ui = await p.evaluate(() => { const g = __g.game, S = g.save; S.inv.swords = ['cutlass', 'wado', 'yoru', 'sorrow']; g.ui.open('inv'); const a = [...document.querySelectorAll('#panel .ic-sword')].filter(e => /url\(/.test(e.style.background || e.getAttribute('style'))).length; g.ui.open('swx', 1); const b = [...document.querySelectorAll('#panel .ic-sword')].filter(e => /url\(/.test(e.getAttribute('style'))).length; g.ui.close(true); return { bag: a, index: b }; });
  ok('Bag + Sword Index show sword icons', ui.bag > 0 && ui.index > 10, ui);
  // ---- first person + third person in game ----
  const show = ['yoru', 'wado', 'kikoku', 'sorrow', 'iceblade', 'enma', 'murakumo', 'sanbon', 'kokuto', 'gryphon'];
  for (const id of show) for (const t of (['yoru', 'enma', 'sanbon', 'wado'].includes(id) ? [false, true] : [false])) {
    await p.evaluate(([id, t]) => { const g = __g.game, S = g.save; S.inv.swords.includes(id) || S.inv.swords.push(id); S.eq.sword = id; S.t2 = S.t2 || {}; S.t2[id] = t ? 1 : 0; S.slot = 'sword'; g.refreshEquip(); g.vm.setMode('sword'); g.ui.updateHud && g.ui.updateHud(); g.tpv && g.tpv.on && g.tpv.toggle(); }, [id, t]);
    await p.waitForTimeout(500); await p.screenshot({ path: SH + `swl/fp_${id}${t ? '_t2' : ''}.png` });
    await p.evaluate(() => { const g = __g.game; g.tpv && !g.tpv.on && g.tpv.toggle(); }); await p.waitForTimeout(700); await p.screenshot({ path: SH + `swl/tp_${id}${t ? '_t2' : ''}.png` }); await p.evaluate(() => { const g = __g.game; g.tpv && g.tpv.on && g.tpv.toggle(); });
  }
  // ---- third-person showcase: the real TPV body (held sword, mouth sword, sheath) rendered from the front ----
  const tps = [['yoru', 0, 'sword'], ['sanbon', 0, 'sword'], ['kikoku', 0, 'sword'], ['sorrow', 0, 'sword'], ['enma', 1, 'sword'], ['murakumo', 0, 'sword'], ['iceblade', 0, 'sword'], ['wado', 0, 'fist']];
  const tiles = []; for (const [id, t, slot] of tps) { tiles.push(await p.evaluate(([id, t, slot]) => { const g = __g.game, S = g.save, T = __g.THREE; S.inv.swords.includes(id) || S.inv.swords.push(id); S.eq.sword = id; S.t2 = S.t2 || {}; S.t2[id] = t; S.slot = slot; g.refreshEquip(); g.vm.setMode(slot);
      if (!g.tpv.on) g.tpv.toggle(); g.tpv.key = null; g.tpv.update(0.016); const c = g.tpv.body; c.root.updateMatrixWorld(true); const W = 480, H = 600;
      const cam = new T.PerspectiveCamera(40, W / H, 0.05, 200); cam.position.copy(c.root.localToWorld(new T.Vector3(1.1, 1.5, 2.6))); cam.lookAt(c.root.localToWorld(new T.Vector3(0, 1.05, 0)));
      const r = __g.R, rt = new T.WebGLRenderTarget(W, H, { samples: 4 }); const was = g.vm.root.visible; r.setRenderTarget(rt); r.render(g.scene, cam); const buf = new Uint8Array(W * H * 4); r.readRenderTargetPixels(rt, 0, 0, W, H, buf); r.setRenderTarget(null); rt.dispose();
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'); const im = x.createImageData(W, H); const lin = T.ColorManagement && rt.texture.colorSpace !== 'srgb';
      for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) { const s = ((H - 1 - yy) * W + xx) * 4, d = (yy * W + xx) * 4; for (let k = 0; k < 3; k++) im.data[d + k] = lin ? Math.round(255 * Math.pow(buf[s + k] / 255, 1 / 2.2)) : buf[s + k]; im.data[d + 3] = 255; }
      x.putImageData(im, 0, 0); x.font = 'bold 18px sans-serif'; x.fillStyle = '#ffd56a'; x.fillText(__g.SWORDS[id].name + (t ? ' · II' : '') + (slot !== 'sword' ? ' (sheathed)' : ''), 10, 24); return cv.toDataURL('image/png'); }, [id, t, slot])); }
  await p.evaluate(tiles => new Promise(res => { const W = 480, H = 600, cols = 4; const cv = document.createElement('canvas'); cv.width = W * cols; cv.height = H * Math.ceil(tiles.length / cols); const x = cv.getContext('2d'); let n = 0;
    tiles.forEach((u, i) => { const im = new Image(); im.onload = () => { x.drawImage(im, (i % cols) * W, Math.floor(i / cols) * H); if (++n === tiles.length) { window.__tpsheet = cv.toDataURL('image/png'); res(); } }; im.src = u; }); }), tiles);
  fs.writeFileSync(SH + `swordlooks_${TAG}_thirdperson.png`, Buffer.from((await p.evaluate(() => window.__tpsheet)).split(',')[1], 'base64'));
  const mouth = await p.evaluate(() => { const g = __g.game, S = g.save; S.eq.sword = 'sanbon'; S.slot = 'sword'; g.refreshEquip(); g.vm.setMode('sword'); let n = 0; if (!g.tpv.on) g.tpv.toggle(); g.tpv.key = null; g.tpv.update(0.016); const c = g.tpv.body; c && c.root.traverse(o => { if (o.userData.mouthSword) n++; }); g.tpv.toggle(); return n; });
  ok('three-sword style shows the mouth sword in third person', mouth > 0, mouth);
  ok('zero console errors', errs.length === 0, errs.slice(0, 5));
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e.message); process.exit(2); });
