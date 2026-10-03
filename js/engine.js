// Game loop, scene switching, progress saving, level intro / clear cards.
(function () {
  const W = 256, H = 240; // design size; on a phone the canvas gets wider (up to 320) with the touch pad in panels beside it
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const LEVEL_NAMES = ['WORLD 1: BUCHAREST', 'GARA DE NORD', 'BRAN CASTLE', 'DN1 HIGHWAY', 'BOSS: BUCHAREST'];

  const Game = {
    W, H, ctx, canvas,
    CW: W,               // real canvas width (wider on phones)
    viewX: 0,            // left edge of the centered 256px area for fixed-screen scenes
    t: 0,
    scene: null,
    levels: [],          // factories, filled by level files: Game.levels[i] = () => scene
    finalScene: null,    // factory, filled by final.js
    level: 0,            // current level index, 5 = final
    fails: 0,
    overlay: null,       // {text, sub, timer, then}
    pause: null,         // {cursor, prize} while the START menu is open

    go(scene) {
      Game.scene = scene;
      Game.overlay = null;
      Game.pause = null;
      document.getElementById('prize').classList.add('hidden');
      document.body.classList.toggle('four-way', !!scene.fourWay); // touch pad shows up/down only where needed
      Game.layout();
      if (scene.enter) scene.enter();
      if (scene.music !== undefined) GameAudio.music(scene.music);
    },

    save() { try { localStorage.setItem('dqb.level', String(Game.level)); } catch (e) {} },
    load() {
      try { const v = parseInt(localStorage.getItem('dqb.level'), 10); return isNaN(v) ? 0 : v; } catch (e) { return 0; }
    },

    // show intro card, then the level (or the final scene)
    startLevel(i) {
      Game.level = i;
      Game.fails = 0;
      Game.save();
      if (i >= Game.levels.length) { Game.go(Game.finalScene()); return; }
      Game.go(IntroCard(i));
    },

    // called by a level when it's beaten
    clear(text = 'LEVEL CLEAR!') {
      if (Game.overlay) return;
      GameAudio.stopMusic();
      GameAudio.sfx('clear');
      Game.overlay = { text, sub: 'WELL DONE, ' + CONFIG.name + '!', timer: 150, then: () => Game.startLevel(Game.level + 1) };
    },

    // called by a level on death / failed attempt (the race eases up a bit after each one)
    fail() { Game.fails++; },

    // ---- shared drawing helpers ----
    text(str, x, y, color, scale, align, shadow) { Font.draw(ctx, str, x, y, color, scale, align, shadow); },

    box(x, y, w, h, fill = '#000', border = '#fff') {
      ctx.fillStyle = border; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = fill; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    },

    blink(rate = 0.5) { return Math.floor(Game.t / rate) % 2 === 0; },

    // scenes marked wide (title, level 1) draw across the whole canvas; the others are drawn centered,
    // 256 wide, and the margins get the scene's bg color
    layout() {
      const wide = Game.scene && Game.scene.wide;
      Game.W = wide ? Game.CW : W;
      Game.viewX = wide ? 0 : Math.floor((Game.CW - W) / 2);
    },
  };

  // ---------------- title screen ----------------
  function TitleScene(startAt) {
    let heroX = -20, frame = 0;
    return {
      wide: true,
      noPause: true,
      music: undefined, // no music until first input (iOS needs a gesture)
      update() {
        heroX += 0.8; if (heroX > Game.W + 20) heroX = -20;
        frame += 0.15;
        if (Input.ok()) {
          GameAudio.unlock();
          GameAudio.sfx('confirm');
          Game.startLevel(startAt);
        }
      },
      draw() {
        ctx.fillStyle = '#5c94fc'; ctx.fillRect(0, 0, Game.W, H);
        for (let x = 0; x < Game.W; x += 16) { Sprites.tile.ground(ctx, x, 208); Sprites.tile.ground(ctx, x, 224); }
        ctx.save(); ctx.translate(Math.floor((Game.W - W) / 2), 0); // title art stays centered
        Sprites.cloud(ctx, 20, 20); Sprites.cloud(ctx, 180, 36);
        Sprites.hill(ctx, 150, 170, 90, 38);
        Sprites.bush(ctx, 30, 192);

        Game.box(24, 48, 208, 84, '#c84c0c', '#fcbcb0');
        ctx.fillStyle = '#000'; ctx.fillRect(28, 52, 200, 76);
        ctx.fillStyle = '#c84c0c'; ctx.fillRect(30, 54, 196, 72);
        Game.text(CONFIG.name + "'S", W / 2, 60, '#fcbcb0', 2, 'center', '#000');
        Game.text('ROAD TO', W / 2, 78, '#fff', 2, 'center', '#000');
        Game.text(CONFIG.to, W / 2, 98, '#fcd000', 3, 'center', '#000');

        if (Game.blink(0.5)) {
          Game.text(startAt > 0 ? 'PRESS START TO CONTINUE' : 'PRESS START', W / 2, 152, '#fcd000', 1, 'center', '#000');
        }
        Game.text(CONFIG.from + ' → ' + CONFIG.to, W / 2, 138, '#fff', 1, 'center', '#000');

        const f = Math.floor(frame) % 2 ? Sprites.hero.walk1 : Sprites.hero.walk2;
        ctx.restore();
        Sprites.draw(ctx, f, heroX, 192);
      },
    };
  }

  // ---------------- "LEVEL 1  WORLD 1: BUCHAREST" card ----------------
  function IntroCard(i) {
    let timer = 0;
    return {
      music: null,
      noPause: true,
      update() {
        timer++;
        if (timer > 170 || (timer > 20 && Input.ok())) Game.go(Game.levels[i]());
      },
      draw() {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        Game.text('LEVEL ' + (i + 1) + ' / ' + Game.levels.length, W / 2, 60, '#fff', 2, 'center');
        Game.text(LEVEL_NAMES[i], W / 2, 90, '#fcd000', 1, 'center');
        Sprites.draw(ctx, Sprites.hero.stand, W / 2 - 30, 118, 2);
        Game.text('X  ♥', W / 2 + 6, 128, '#fff', 1, 'left');
        Game.text('INFINITE LIVES', W / 2 + 6, 140, '#7c7c7c', 1, 'left');
        const lines = Font.wrap(CONFIG.tips[i] || '', 36);
        lines.forEach((l, k) => Game.text(l, W / 2, 180 + k * 12, '#fff', 1, 'center'));
      },
    };
  }

  // ---------------- pause menu (START): resume / restart level / new game ----------------
  const PAUSE_ITEMS = ['RESUME', 'RESTART LEVEL', 'NEW GAME'];
  const PM = { x: 48, y: 68, w: 160, h: 104, rowY: 108, rowH: 18 };
  const prizeEl = document.getElementById('prize');

  function openPause() {
    // the prize (QR + CLAIM) is html on top of the canvas, so it steps aside while the menu is open
    Game.pause = { cursor: 0, prize: !prizeEl.classList.contains('hidden') };
    prizeEl.classList.add('hidden');
    document.body.classList.add('four-way'); // the menu needs up/down on the touch pad
    GameAudio.sfx('select');
  }

  function closePause() {
    if (Game.pause.prize) prizeEl.classList.remove('hidden');
    Game.pause = null;
    document.body.classList.toggle('four-way', !!Game.scene.fourWay);
  }

  function updatePause() {
    const m = Game.pause, n = PAUSE_ITEMS.length;
    if (Input.pressed.start) { closePause(); return; }
    if (Input.pressed.up) { m.cursor = (m.cursor + n - 1) % n; GameAudio.sfx('select'); }
    if (Input.pressed.down) { m.cursor = (m.cursor + 1) % n; GameAudio.sfx('select'); }
    let pick = Input.pressed.a ? m.cursor : -1;
    if (Input.pressed.tap) {
      const tx = Input.tapX + Game.viewX - Math.floor((Game.CW - W) / 2);
      const row = Math.floor((Input.tapY - PM.rowY + 5) / PM.rowH);
      if (tx >= PM.x && tx <= PM.x + PM.w && row >= 0 && row < n) pick = row;
    }
    if (pick < 0) return;
    GameAudio.sfx('confirm');
    if (pick === 0) closePause();
    else Game.startLevel(pick === 1 ? Game.level : 0);
  }

  function drawPause() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, Game.CW, H);
    ctx.save(); ctx.translate(Math.floor((Game.CW - W) / 2), 0);
    Game.box(PM.x, PM.y, PM.w, PM.h, '#000', '#fff');
    Game.text('PAUSE', W / 2, PM.y + 12, '#fcd000', 2, 'center');
    PAUSE_ITEMS.forEach((s, k) => {
      const y = PM.rowY + k * PM.rowH, on = k === Game.pause.cursor;
      if (on) Game.text('>', PM.x + 22, y, '#fcd000');
      Game.text(s, PM.x + 34, y, on ? '#fff' : '#bcbcbc');
    });
    ctx.restore();
  }

  // ---------------- main loop (fixed 60 fps steps) ----------------
  let last = 0, acc = 0;
  const STEP = 1 / 60;
  // phone held upright: the "rotate your phone" card is shown, so the game waits
  const portraitTouch = window.matchMedia('(pointer: coarse) and (orientation: portrait)');

  function frame(ts) {
    requestAnimationFrame(frame);
    if (portraitTouch.matches) { last = ts; acc = 0; return; }
    if (!last) last = ts;
    acc += Math.min(0.1, (ts - last) / 1000);
    last = ts;
    while (acc >= STEP) {
      acc -= STEP;
      Game.t += STEP;
      Input.poll();
      if (Game.pause) {
        updatePause();
      } else if (Game.overlay) {
        const o = Game.overlay;
        if (--o.timer <= 0) { Game.overlay = null; o.then(); }
      } else if (Input.pressed.start && Game.scene && !Game.scene.noPause) {
        openPause();
      } else if (Game.scene && Game.scene.update) {
        Game.scene.update(STEP);
      }
    }
    ctx.imageSmoothingEnabled = false;
    const vx = Game.viewX;
    if (Game.scene && Game.scene.draw) {
      if (vx > 0) {
        ctx.fillStyle = Game.scene.bg || '#000';
        ctx.fillRect(0, 0, vx, H); ctx.fillRect(vx + W, 0, Game.CW - vx - W, H);
      }
      ctx.save();
      ctx.translate(vx, 0); ctx.beginPath(); ctx.rect(0, 0, Game.W, H); ctx.clip();
      Game.scene.draw(ctx);
      ctx.restore();
    }
    if (Game.overlay) {
      const o = Game.overlay;
      ctx.save(); ctx.translate(Math.floor((Game.CW - W) / 2), 0);
      const bw = Math.min(W - 4, Math.max(200, Font.width(o.text, 2) + 20, Font.width(o.sub, 1) + 20));
      Game.box(W / 2 - bw / 2, 88, bw, 64, '#000', '#fff');
      Game.text(o.text, W / 2, 102, '#fcd000', 2, 'center');
      Game.text(o.sub, W / 2, 128, '#fff', 1, 'center');
      ctx.restore();
    }
    if (Game.pause) drawPause();
  }

  // fit the canvas into the available area: height stays 240, on a phone the width grows (256..320)
  // and the two pad panels take the rest
  const touch = window.matchMedia('(pointer: coarse)');
  function fit() {
    const stage = document.getElementById('stage');
    const app = document.getElementById('app'), cs = getComputedStyle(app);
    // clientWidth includes the safe-area padding (the notch), which is not usable
    const aw = app.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    const ah = document.getElementById('screen').clientHeight;
    if (!aw || !ah) return;
    const side = touch.matches ? Math.max(150, Math.round(aw * 0.21)) : 0; // width of one pad panel
    const s0 = ah / H;
    const cw = touch.matches ? Math.max(W, Math.min(320, Math.floor((aw - 2 * side) / s0 / 2) * 2)) : W;
    if (canvas.width !== cw) canvas.width = cw;
    Game.CW = cw;
    Game.layout();
    let s = Math.min((aw - 2 * side) / cw, s0);
    if (s >= 3) s = Math.floor(s);
    stage.style.width = Math.floor(cw * s) + 'px';
    stage.style.height = Math.floor(H * s) + 'px';
  }

  Game.start = function () {
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', () => setTimeout(fit, 200));
    fit();
    setTimeout(fit, 100);

    // ?level=N jumps to a level (1-5, 6 = final). For testing.
    const m = /[?&]level=(\d)/.exec(location.search);
    let startAt = m ? Math.max(0, Math.min(Game.levels.length, parseInt(m[1], 10) - 1)) : Game.load();
    Game.go(TitleScene(startAt));
    requestAnimationFrame(frame);
  };

  Game.LEVEL_NAMES = LEVEL_NAMES;
  window.Game = Game;
})();
