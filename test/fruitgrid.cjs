// contact sheet of all Devil Fruits: 3D model render + 2D icon per cell. Needs a vite DEV server (imports /src).  node test/fruitgrid.cjs out.png [closeup.png ids]
const { chromium } = require('playwright-core'); const fs = require('fs');
const out = process.argv[2] || `${__dirname}/../shots/fruits2_grid.png`; const close = process.argv[3]; const cids = (process.argv[4] || 'gomu,mera,gura,soru').split(',');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 800, height: 600 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PE ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  await p.goto((process.env.BASE || 'http://127.0.0.1:5392') + '/test-blank.html').catch(() => {}); await p.goto((process.env.BASE || 'http://127.0.0.1:5392') + '/?skip'); await p.waitForTimeout(1500);
  const res = await p.evaluate(async ({ cids, wantClose }) => {
    const { THREE: B } = await import('/src/engine.js'); const FA = await import('/src/fruitart.js'); const { FRUITS, RCOL, RARITY } = await import('/src/data.js'); const { fruitIcon } = await import('/src/icons.js');
    const C = 150; const r = new B.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(C, C); r.outputColorSpace = B.SRGBColorSpace;
    const sc = new B.Scene(); sc.add(new B.HemisphereLight(0xcfe6ff, 0x5a4a3a, 1.4)); const d = new B.DirectionalLight(0xffffff, 2.2); d.position.set(2, 3, 2.5); sc.add(d);
    const cam = new B.PerspectiveCamera(30, 1, 0.1, 50); cam.position.set(0, 0.35, 3.4); cam.lookAt(0, 0.08, 0);
    const shot = (id, size) => { r.setSize(size, size); const m = FA.makeDevilFruit(id, 1); m.rotation.y = 0.5; sc.add(m); r.render(sc, cam); sc.remove(m); const cv = document.createElement('canvas'); cv.width = cv.height = size; cv.getContext('2d').drawImage(r.domElement, 0, 0); return cv; };
    const load = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = src; });
    const ids = Object.keys(FRUITS).sort((a, b) => FRUITS[a].rar - FRUITS[b].rar); const cols = 10, cw = 190, ch = 230; const G = document.createElement('canvas'); G.width = cols * cw; G.height = Math.ceil(ids.length / cols) * ch; const g = G.getContext('2d');
    g.fillStyle = '#1b2433'; g.fillRect(0, 0, G.width, G.height); const t0 = performance.now();
    for (let i = 0; i < ids.length; i++) { const id = ids[i], f = FRUITS[id]; const x = (i % cols) * cw, y = Math.floor(i / cols) * ch; g.fillStyle = '#243049'; g.fillRect(x + 3, y + 3, cw - 6, ch - 6);
      g.drawImage(shot(id, C), x + (cw - C) / 2, y + 4); const im = await load(fruitIcon(id, 96)); g.drawImage(im, x + 6, y + 150, 64, 64);
      g.fillStyle = RCOL[f.rar]; g.font = 'bold 13px sans-serif'; g.fillText((f.short || f.name).replace(/ Fruit$/, '').slice(0, 15), x + 74, y + 175); g.font = '11px sans-serif'; g.fillStyle = '#bcd'; g.fillText(RARITY[f.rar] + ' · ' + (FA.shapeOf ? FA.shapeOf(id) : ''), x + 74, y + 192); g.fillText(id, x + 74, y + 207); }
    const ms = performance.now() - t0; let closeUrl = null;
    if (wantClose) { const S = 420; const K = document.createElement('canvas'); K.width = S * cids.length; K.height = S + 110; const k = K.getContext('2d'); k.fillStyle = '#1b2433'; k.fillRect(0, 0, K.width, K.height);
      for (let i = 0; i < cids.length; i++) { k.drawImage(shot(cids[i], S), i * S, 0); const im = await load(fruitIcon(cids[i], 96)); k.drawImage(im, i * S + 10, S, 96, 96); k.fillStyle = RCOL[FRUITS[cids[i]].rar]; k.font = 'bold 22px sans-serif'; k.fillText(FRUITS[cids[i]].name, i * S + 116, S + 50); } closeUrl = K.toDataURL(); }
    return { url: G.toDataURL(), closeUrl, n: ids.length, ms }; }, { cids, wantClose: !!close });
  fs.writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64')); if (close) fs.writeFileSync(close, Buffer.from(res.closeUrl.split(',')[1], 'base64'));
  console.log('fruits', res.n, 'render ms', Math.round(res.ms), out); console.log('ERRS', errs); await b.close(); })();
