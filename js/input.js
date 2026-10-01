// Keyboard + on-screen gamepad. Keys: up down left right a b start tap
(function () {
  const KEYMAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
    Space: 'a', KeyZ: 'a', KeyK: 'a',
    KeyX: 'b', KeyJ: 'b', ShiftLeft: 'b', ShiftRight: 'b',
    Enter: 'start', Escape: 'start',
  };

  const kb = {};      // held by keyboard
  let touch = {};     // held by touch
  const latch = {};   // pressed since last poll (so very short taps aren't lost)
  const prev = {};
  const held = {};
  const pressed = {};
  let anyPressed = false;

  const Input = {
    held, pressed,
    // call once per frame before update
    poll() {
      anyPressed = false;
      for (const k of ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'tap']) {
        held[k] = !!(kb[k] || touch[k] || latch[k]);
        pressed[k] = !!latch[k] || (held[k] && !prev[k]);
        latch[k] = false;
        if (pressed[k]) anyPressed = true;
        prev[k] = held[k];
      }
      if (touch.tap) touch.tap = false; // tap is a one-shot
    },
    any() { return anyPressed; },
    ok() { return pressed.a || pressed.start || pressed.tap; },
    onFirstInteraction: null,
  };

  let triedFullscreen = false;
  function first() {
    if (Input.onFirstInteraction) Input.onFirstInteraction();
    // real fullscreen where the browser allows it (Android, iPad); on iPhone Safari use "Add to Home Screen"
    if (!triedFullscreen && window.matchMedia('(pointer: coarse)').matches) {
      triedFullscreen = true;
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) { try { const r = req.call(el); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
    }
  }

  window.addEventListener('keydown', e => {
    first();
    const k = KEYMAP[e.code];
    if (k) { if (!kb[k]) latch[k] = true; kb[k] = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', e => {
    const k = KEYMAP[e.code];
    if (k) { kb[k] = false; e.preventDefault(); }
  });
  window.addEventListener('blur', () => { for (const k in kb) kb[k] = false; touch = {}; });

  // ---- touch: recompute held buttons from all active touches, so sliding between buttons works ----
  const dpad = document.getElementById('dpad');
  const canvas = document.getElementById('game');
  const abButtons = document.querySelectorAll('#ab [data-key]');
  let canvasTouchIds = new Set();
  // every finger on the screen, by touch id, so move + jump work at the same time
  const fingers = new Map();
  function track(e, lifted) {
    for (const t of e.changedTouches) {
      if (lifted) fingers.delete(t.identifier);
      else fingers.set(t.identifier, { x: t.clientX, y: t.clientY });
    }
    if (e.touches && e.touches.length === 0) fingers.clear(); // never leave a button stuck
  }

  // remember where the canvas was tapped, in game pixels (256x240)
  function setTap(cx, cy) {
    const r = canvas.getBoundingClientRect();
    Input.tapX = (cx - r.left) / r.width * canvas.width - (window.Game ? Game.viewX : 0);
    Input.tapY = (cy - r.top) / r.height * canvas.height;
    touch.tap = true;
    latch.tap = true;
  }

  function recompute() {
    const next = {};
    const r = dpad.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const reach = r.width * 0.75;
    for (const t of fingers.values()) {
      const dx = t.x - cx, dy = t.y - cy;
      if (Math.abs(dx) < reach && Math.abs(dy) < reach && (r.width > 0)) {
        const dead = r.width * 0.12;
        if (Math.hypot(dx, dy) < dead) continue;
        // left/right only: the whole half of the pad counts, no need to aim
        if (!document.body.classList.contains('four-way')) { next[dx < 0 ? 'left' : 'right'] = true; continue; }
        const ang = Math.atan2(dy, dx) * 180 / Math.PI; // -180..180, 0 = right, 90 = down
        if (ang > -67.5 && ang < 67.5) next.right = true;
        if (ang > 112.5 || ang < -112.5) next.left = true;
        if (ang > 22.5 && ang < 157.5) next.down = true;
        if (ang < -22.5 && ang > -157.5) next.up = true;
        continue;
      }
      const el = document.elementFromPoint(t.x, t.y);
      const btn = el && el.closest('[data-key]');
      if (btn) { next[btn.dataset.key] = true; continue; }
      // a thumb that lands just off A or B still presses the nearest one
      let best = null, bestD = 60;
      for (const b of abButtons) {
        const br = b.getBoundingClientRect();
        const d = Math.hypot(t.x - (br.left + br.width / 2), t.y - (br.top + br.height / 2)) - br.width / 2;
        if (br.width > 0 && d < bestD) { bestD = d; best = b; }
      }
      if (best) next[best.dataset.key] = true;
    }
    if (touch.tap) next.tap = true;
    for (const k in next) if (!touch[k]) latch[k] = true;
    touch = next;
    document.querySelectorAll('[data-key]').forEach(b => b.classList.toggle('pressed', !!touch[b.dataset.key]));
  }

  function onPad(e) {
    return e.target.closest && (e.target.closest('.pad') || e.target.closest('#dpad') || e.target.closest('#ab') || e.target.closest('[data-key]'));
  }

  document.addEventListener('touchstart', e => {
    first();
    for (const t of e.changedTouches) if (t.target === canvas) { canvasTouchIds.add(t.identifier); setTap(t.clientX, t.clientY); }
    if (onPad(e) || e.target === canvas) e.preventDefault();
    track(e, false);
    recompute();
  }, { passive: false });
  document.addEventListener('touchmove', e => {
    if (!(e.target.closest && e.target.closest('#prize'))) e.preventDefault();
    track(e, false);
    recompute();
  }, { passive: false });
  const end = e => {
    if (Input.onFirstInteraction) Input.onFirstInteraction(); // iOS may only start audio on touchend, not touchstart
    for (const t of e.changedTouches) canvasTouchIds.delete(t.identifier);
    if (onPad(e)) e.preventDefault();
    track(e, true);
    recompute();
  };
  document.addEventListener('touchend', end, { passive: false });
  document.addEventListener('touchcancel', end, { passive: false });

  // mouse click on canvas = tap (desktop)
  canvas.addEventListener('mousedown', e => { first(); setTap(e.clientX, e.clientY); });

  // no pinch-zoom / double-tap zoom on iOS
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault());

  window.Input = Input;
})();
