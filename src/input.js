import { isTouch } from './engine.js';
export const IN = { invY: localStorage.getItem('gldt_invy') === '1', resetTouch: () => {}, mx: 0, mz: 0, lookX: 0, lookY: 0, held: {}, pressed: new Set(), enabled: false, locked: false, sens: parseFloat(localStorage.getItem('gldt_sens') || '1') };
const keys = {};
const KEYMAP = { Space: 'jump', ShiftLeft: 'dash', ShiftRight: 'dash', Digit1: 'm1', Digit2: 'm2', Digit3: 'm3', Digit4: 'm4', KeyQ: 'special', KeyE: 'interact', KeyF: 'fish', KeyI: 'inv', KeyM: 'map', Escape: 'pause', KeyR: 'gun', KeyG: 'swap', KeyT: 'swapgun', KeyH: 'haki', KeyJ: 'conq', KeyV: 'cam', KeyX: 'tf', KeyC: 'block' };
export function press(a) { IN.pressed.add(a); }
export function consume(a) { const h = IN.pressed.has(a); IN.pressed.delete(a); return h; }
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  keys[e.code] = true; const a = KEYMAP[e.code]; if (a && !e.repeat) press(a);
  if (a === 'pause' && IN.locked) {} // pointer lock exit handled by browser
  if (['Space', 'Tab'].includes(e.code)) e.preventDefault();
  if (a === 'block') IN.held.block = true;
});
addEventListener('keyup', e => { keys[e.code] = false; if (KEYMAP[e.code] === 'block') IN.held.block = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; IN.held = {}; });
export function pollKeys() {
  if (isTouch && !keys.KeyW && !keys.KeyA && !keys.KeyS && !keys.KeyD) return;
  IN.mz = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  IN.mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  IN.sprint = !!keys.ShiftLeft;
}
// mouse
export function initMouse(canvas) {
  document.addEventListener('mousedown', e => {
    if (!IN.enabled || isTouch || IN.blockMouse) return;
    if (e.target.closest && e.target.closest('button,.panel,.mv,.hudbtn,input')) return;
    if (!IN.locked) { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (_) {} }
    if (e.button === 0) { press('attack'); IN.held.attack = true; }
    if (e.button === 2) IN.held.block = true;
  });
  addEventListener('mouseup', e => { if (e.button === 0) IN.held.attack = false; if (e.button === 2) IN.held.block = false; });
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('pointerlockchange', () => { IN.locked = document.pointerLockElement === canvas; if (!IN.locked && IN.enabled && IN.onUnlock) IN.onUnlock(); });
  addEventListener('mousemove', e => { if (IN.locked && IN.enabled) { IN.lookX += e.movementX * 0.0022 * IN.sens; IN.lookY += e.movementY * 0.0022 * IN.sens; } });
}
// touch
export function initTouch(root) {
  const joy = root.querySelector('#joy'), knob = root.querySelector('#knob');
  let joyId = null, jx = 0, jy = 0, lookId = null, lx = 0, ly = 0, lookSkip = false;
  // forget all fingers (rotation, resize, tab switch, panels opening): stale touches must never drive the camera
  IN.resetTouch = () => { lookId = null; joyId = null; lookSkip = false; IN.mx = IN.mz = 0; IN.sprint = false; IN.lookX = IN.lookY = 0; joy.classList.remove('act'); joy.style.left = ''; joy.style.top = ''; knob.style.transform = ''; };
  for (const ev of ['resize', 'orientationchange', 'blur', 'pagehide']) addEventListener(ev, () => IN.resetTouch()); document.addEventListener('visibilitychange', () => IN.resetTouch());
  root.addEventListener('lostpointercapture', e => { if (e.pointerId === lookId) lookId = null; });
  const R = 55;
  root.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    const btn = e.target.closest('[data-act]');
    if (btn) { const a = btn.dataset.act; press(a); IN.held[a] = true; btn.classList.add('on'); btn.setPointerCapture(e.pointerId); btn._pid = e.pointerId; e.preventDefault(); return; }
    if (e.target.closest('.hudbtn,.panel')) return;
    if (e.clientX < innerWidth * 0.45 && joyId === null) { joyId = e.pointerId; jx = e.clientX; jy = e.clientY; joy.style.left = (jx - 60) + 'px'; joy.style.top = (jy - 60) + 'px'; joy.classList.add('act'); knob.style.transform = 'translate(0,0)'; }
    else if (lookId === null) { lookId = e.pointerId; lx = e.clientX; ly = e.clientY; lookSkip = true; }
    e.preventDefault();
  }, { passive: false });
  root.addEventListener('pointermove', e => {
    if (e.pointerId === joyId) { let dx = e.clientX - jx, dy = e.clientY - jy; const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; } knob.style.transform = `translate(${dx}px,${dy}px)`; IN.mx = dx / R; IN.mz = -dy / R; IN.sprint = d > R * 0.95; }
    else if (e.pointerId === lookId) { // per-finger tracking; skip the first event, clamp spikes (iOS can deliver a jump when fingers swap/land)
      let dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; if (lookSkip) { lookSkip = false; return; }
      const m = Math.hypot(dx, dy); if (m > 70) { dx *= 70 / m; dy *= 70 / m; } IN.lookX += dx * 0.0055 * IN.sens; IN.lookY += dy * 0.0055 * IN.sens * (IN.invY ? -1 : 1); }
  });
  const up = e => {
    if (e.pointerId === joyId) { joyId = null; IN.mx = IN.mz = 0; IN.sprint = false; joy.classList.remove('act'); joy.style.left = ''; joy.style.top = ''; knob.style.transform = ''; }
    if (e.pointerId === lookId) lookId = null;
    root.querySelectorAll('[data-act]').forEach(b => { if (b._pid === e.pointerId) { IN.held[b.dataset.act] = false; b.classList.remove('on'); b._pid = null; } });
  };
  root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
}
